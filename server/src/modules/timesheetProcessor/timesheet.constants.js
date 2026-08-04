/**
 * Timesheet Processor — configuration constants.
 *
 * Everything tunable for this admin-only tool lives here so business rules are
 * never scattered as magic numbers. Required working hours default to 08:00 and
 * can be overridden per run from the UI; the column aliases make the Excel
 * reader tolerant of slightly different header names across attendance devices.
 * New device dialects are added here without touching the parser.
 */

/** Default required working time per day, in minutes (08:00). Overridable per run. */
export const DEFAULT_REQUIRED_MINUTES = 8 * 60;

/** Bounds for a per-run required-hours override (1 minute .. 24h). */
export const MIN_REQUIRED_MINUTES = 1;
export const MAX_REQUIRED_MINUTES = 24 * 60;

/**
 * The Excel type we accept. Legacy `.xls` is intentionally excluded — exceljs
 * does not reliably read the old binary format. Browsers occasionally label an
 * .xlsx as octet-stream/zip, so the file filter also accepts those when the
 * name ends in .xlsx (the parser still rejects anything that isn't a real
 * workbook).
 */
export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB — a month of punches is tiny

/** Per-day statuses. Frozen so the UI can import the exact labels/order. */
export const STATUS = Object.freeze({
  PRESENT: 'Present',
  DEFICIENT: 'Deficient',
  OVERTIME: 'Overtime',
  SINGLE_PUNCH: 'Single Punch',
  NO_ATTENDANCE: 'No Attendance',
});

/**
 * Header aliases for flexible column mapping. Matching is case-insensitive and
 * whitespace-trimmed, on an EXACT header-cell match. A file may provide EITHER
 * a single combined timestamp column OR separate date + time columns — the
 * parser handles both, preferring a timestamp when present.
 */
export const COLUMN_ALIASES = Object.freeze({
  timestamp: ['timestamp', 'time stamp', 'date time', 'datetime', 'punch time', 'access time', 'event time'],
  date: ['date', 'punch date', 'log date', 'access date', 'att date', 'attendance date'],
  time: ['time', 'log time', 'in/out time', 'clocking'],
  employeeId: ['employee id', 'emp id', 'employee code', 'emp code', 'user id', 'badge', 'card no', 'ac-no', 'ac no'],
  employeeName: ['employee name', 'name', 'emp name', 'user name', 'full name'],
});
