/**
 * Timesheet parser — turns a raw .xlsx buffer into normalized punch records.
 *
 * Responsibilities (and nothing else — no attendance math lives here):
 *  - open the workbook defensively (corrupt files become a friendly 400)
 *  - find the header row and map columns by ALIAS, not by fixed position, so
 *    slightly different device exports still work
 *  - read each data row tolerantly: Date cells, string dates/times, and Excel
 *    numeric serials are all handled; unreadable rows are skipped and reported
 *  - keep only punches inside the requested month/year
 *
 * A punch is reduced to `{ day, minutes }` (minutes = minute-of-day) because the
 * month and year are already fixed by the caller's selection.
 */
import ExcelJS from 'exceljs';
import ApiError from '../../utils/ApiError.js';
import { COLUMN_ALIASES } from './timesheet.constants.js';

/** Best-effort display text for any exceljs cell value (rich text, formula, …). */
function cellText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text.trim();
    if (Array.isArray(value.richText)) return value.richText.map((r) => r.text).join('').trim();
    if ('result' in value) return cellText(value.result);
    if ('hyperlink' in value && typeof value.text === 'string') return value.text.trim();
  }
  return String(value).trim();
}

/** Normalize a header cell for alias comparison: lowercase, single-spaced. */
function normHeader(value) {
  return cellText(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

/** { y, m, d } from a Date cell (read in UTC — exceljs stores wall-clock as UTC)
 *  or a string. String dates assume DAY-first (DD/MM/YYYY) when ambiguous. */
function toDateParts(value) {
  if (value instanceof Date) {
    return { y: value.getUTCFullYear(), m: value.getUTCMonth() + 1, d: value.getUTCDate() };
  }
  const text = cellText(value);
  if (!text) return null;
  let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/); // ISO: YYYY-MM-DD
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/); // DD/MM/YYYY (day first)
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return { y, m: +m[2], d: +m[1] };
  }
  return null;
}

/** Minute-of-day (0..1439) from a Date, an Excel numeric serial, or "HH:MM". */
function toMinutesOfDay(value) {
  if (value instanceof Date) return value.getUTCHours() * 60 + value.getUTCMinutes();
  if (typeof value === 'number') {
    // Excel stores a time as a fraction of a day; a datetime keeps it in the
    // fractional part. Either way the fraction is the clock time.
    const frac = value - Math.floor(value);
    return Math.round(frac * 1440) % 1440;
  }
  const text = cellText(value);
  if (!text) return null;
  const m = text.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?/);
  if (!m) return null;
  let hh = +m[1];
  const mm = +m[2];
  const ampm = m[3] ? m[3].toLowerCase() : null;
  if (ampm === 'pm' && hh < 12) hh += 12;
  if (ampm === 'am' && hh === 12) hh = 0;
  if (hh > 23 || mm > 59) return null;
  return hh * 60 + mm;
}

/** Combined { y, m, d, minutes } from a single timestamp cell. */
function toTimestampParts(value) {
  const date = toDateParts(value);
  if (!date) return null;
  const minutes = toMinutesOfDay(value);
  if (minutes == null) return null;
  return { ...date, minutes };
}

/** Map a candidate header row to column indexes by exact alias match. */
function mapHeaderRow(row) {
  const map = {};
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = normHeader(cell.value);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (map[field] == null && aliases.includes(header)) {
        map[field] = colNumber;
        break;
      }
    }
  });
  return map;
}

/** We can process a row if there's a timestamp, OR a date AND a time. */
function hasRequiredColumns(map) {
  return map.timestamp != null || (map.date != null && map.time != null);
}

/**
 * Parse a buffer into punches for the given month/year.
 * @returns {{ punches: {day:number, minutes:number}[], warnings: string[],
 *            detectedEmployee: {id:string, name:string}|null }}
 */
export async function parseAttendanceWorkbook(buffer, { month, year }) {
  if (!buffer || buffer.length === 0) throw new ApiError(400, 'The uploaded file is empty.');

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new ApiError(400, 'The file is not a valid Excel workbook, or it is corrupted.');
  }

  const ws = workbook.worksheets.find((w) => w.rowCount > 0) ?? workbook.worksheets[0];
  if (!ws || ws.rowCount === 0) throw new ApiError(400, 'The workbook has no data.');

  // Locate the header row within the first rows (some exports have a title band).
  let headerMap = null;
  let headerRow = 0;
  const scanLimit = Math.min(ws.rowCount, 15);
  for (let r = 1; r <= scanLimit; r++) {
    const map = mapHeaderRow(ws.getRow(r));
    if (hasRequiredColumns(map)) {
      headerMap = map;
      headerRow = r;
      break;
    }
  }
  if (!headerMap) {
    throw new ApiError(
      400,
      'Could not find the attendance columns. The sheet needs a Date and Time column, or a single Timestamp column.'
    );
  }

  const punches = [];
  const warnings = [];
  let detectedEmployee = null;
  let skipped = 0;
  let skipWarnShown = 0;
  let outOfMonth = 0;

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);

    // Capture the employee identity from the first row that carries it.
    if (!detectedEmployee && (headerMap.employeeId || headerMap.employeeName)) {
      const id = headerMap.employeeId ? cellText(row.getCell(headerMap.employeeId).value) : '';
      const name = headerMap.employeeName ? cellText(row.getCell(headerMap.employeeName).value) : '';
      if (id || name) detectedEmployee = { id, name };
    }

    let parts;
    if (headerMap.timestamp) {
      parts = toTimestampParts(row.getCell(headerMap.timestamp).value);
    } else {
      const date = toDateParts(row.getCell(headerMap.date).value);
      const minutes = toMinutesOfDay(row.getCell(headerMap.time).value);
      parts = date && minutes != null ? { ...date, minutes } : null;
    }

    if (!parts) {
      // Only warn about rows that actually have content (ignore blank spacers).
      const hasContent = Array.isArray(row.values) && row.values.some((v) => cellText(v) !== '');
      if (hasContent) {
        skipped++;
        if (skipWarnShown < 15) {
          warnings.push(`Row ${r}: could not read the date/time — skipped.`);
          skipWarnShown++;
        }
      }
      continue;
    }

    if (parts.y !== year || parts.m !== month) {
      outOfMonth++;
      continue;
    }
    punches.push({ day: parts.d, minutes: parts.minutes });
  }

  if (skipped > skipWarnShown) warnings.push(`…and ${skipped - skipWarnShown} more unreadable row(s) skipped.`);
  if (outOfMonth > 0) warnings.push(`${outOfMonth} punch(es) outside the selected month were ignored.`);

  return { punches, warnings, detectedEmployee };
}
