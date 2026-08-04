# Timesheet Processor — developer notes

An **Admin-only** internal tool: upload one employee's monthly door-access log
(.xlsx), get a salary-ready timesheet you can preview and export. Deterministic,
stateless (nothing is persisted), and fully isolated from the rest of the ERP.

## What was built

**Backend** (`server/src/modules/timesheetProcessor/`) — layered, small files
```
timesheet.constants.js   # 08:00 default (configurable), column aliases, mime/size limits, status enum
timesheet.time.js        # minute math + HH:MM + daysInMonth + weekday
timesheet.parser.js      # exceljs read → normalized punches; alias column mapping; tolerant row parsing
timesheet.processor.js   # PURE attendance rules (login/logout, worked, deficiency, overtime, summary)
timesheet.export.js      # exceljs → professionally formatted .xlsx (theme colours, borders, summary)
timesheet.validation.js  # Zod for the multipart text fields
timesheet.service.js     # orchestration: load employee → parse → process
timesheet.controller.js  # thin HTTP (preview = JSON, export = streamed .xlsx)
timesheet.routes.js      # Admin guard + module-local Multer (MEMORY storage)
```
Mounted with one additive line in `app.js` at `/api/timesheet-processor`.

**Frontend** (`client/src/features/timesheetProcessor/`)
```
timesheet.api.js                    # preview (JSON) + export (authenticated Blob download)
timesheet.constants.js              # status→Badge variant, months, HH:MM helpers
components/TimesheetResults.jsx      # warnings + summary + day table (reuses the Table primitive)
pages/TimesheetProcessorPage.jsx     # form + orchestration + Admin route guard
```
Plus one route in `router.jsx` and one **Admin-only** nav item in
`DashboardLayout.jsx` (the sidebar now filters items by `roles`; items without
`roles` stay visible to everyone, so existing nav is unchanged).

## API

| Method | Path | Roles | Purpose |
|--------|------|-------|---------|
| POST | `/api/timesheet-processor/preview` | Admin | multipart (file + employeeId, month, year, requiredMinutes?) → computed JSON |
| POST | `/api/timesheet-processor/export`  | Admin | same input → streamed formatted `.xlsx` |

Both stateless: the client keeps the file and posts it to whichever endpoint, so
the server recomputes authoritatively and stores nothing.

## Business rules (the "literal" policy, confirmed with the admin)

- Per date: sort punches, **first = Login, last = Logout**, ignore the middle.
  `Worked = Logout − Login`. Exactly one punch → **Single Punch**, logout blank,
  worked `00:00`.
- **Every calendar day of the month accrues the required hours** (08:00 default,
  overridable per run). `Deficiency = max(0, Required − Worked)` and
  `Overtime = max(0, Worked − Required)` on **every** day — so a No-Attendance or
  Single-Punch day shows a full-day deficiency.
- Summary: `Working Days` = all days in the month; `Present Days` = days with a
  complete login+logout pair; `Single Punch Days` = exactly one punch; plus the
  four totals.
- **Known limitation (by design):** weekends/holidays are not modelled yet, so
  they count as deficiency until a holiday calendar is added. This is the
  documented consequence of the "literal" policy and the natural extension point.

## Key decisions & why

- **Column mapping by alias, not position** (`COLUMN_ALIASES`). A file may have a
  single `Timestamp` column OR separate `Date` + `Time`; both work. New device
  dialects are added in one constant, never in the parser.
- **Tolerant parsing.** Date cells (read in UTC to avoid tz drift), string
  dates/times, and Excel numeric serials are all handled; unreadable rows are
  **skipped and reported** as warnings, never fatal. Punches outside the selected
  month are ignored (reported).
- **Pure processor.** All the maths lives in pure functions with no I/O, so it's
  trivial to test and to extend (shift timings, holiday calendar, custom rules).
- **Memory-storage Multer, separate instance.** The file is parsed and discarded
  (never written to disk), and the module's own Multer can't affect the document
  upload middleware. `.xlsx` only (exceljs can't read legacy `.xls`); 5 MB cap.
- **Configurable required hours.** One constant (`DEFAULT_REQUIRED_MINUTES`) plus
  an optional per-run override field; never hard-coded around the codebase.
- **Nothing persisted.** No new Mongoose model → zero migration risk and no
  change to existing data. Persistence is a clean future add for payroll.

## Validation & security

Rejects (friendly messages): empty file, non-.xlsx, corrupted workbook, missing
Date/Time (or Timestamp) columns, and no punches for the chosen month. File type
+ size enforced by Multer; uploaded content is only ever parsed as data (never
executed); every text input is Zod-validated; the route is Admin-only server-side.

## Extensibility (structured for, not implemented)

Multiple-employee uploads, shift timings, holiday calendar, leave integration,
payroll export, PDF reports, more device formats, per-employee required hours,
company rules. The parser (input formats) and processor (rules) are the two
seams these slot into.

## Verified (2026-08-04)

**curl** (throwaway admin + employee, deleted after; DB left pristine): preview of
a crafted July file → summary exactly correct (Working 31, Present 4, Single 1,
No-Attendance 26, Worked 33:00, Required 248:00, Deficiency 218:00, Overtime
03:00) and per-day rows correct (Present / Overtime / Deficient / Single-Punch
with blank logout / 4-punch day using only first+last / No-Attendance) · export
streams a valid `.xlsx` (PK, correct headers/filename) · failures: no file 400,
empty month 400, non-xlsx 400, corrupted 400, bad month 400, no auth 401,
**Worker role 403**.

**Browser:** Admin sees the "Timesheet Processor" nav item (hidden for other
roles) · form (employee/month/year/required-hours/file) · Process renders the
warnings, summary, and 31-day table identical to the API · **Export → 200**, no
console errors.
