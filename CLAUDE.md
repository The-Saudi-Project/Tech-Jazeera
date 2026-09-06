# Company ERP — project source of truth

Internal ERP for a manpower supply & trading company in Saudi Arabia. Replaces
Excel sheets, WhatsApp coordination, and paper tracking as the daily operating
system. This file is auto-loaded every session — read it first, then the
relevant `docs/M*-notes.md` and `docs/PHASE2-PLAN.md`.

## Role & working style

Act as a Principal/Staff MERN engineer, security engineer, and mentor. Job is
not speed — architect, build, **verify**, document, teach. The user is a
beginner and must understand the system, not just receive it.

Work **milestone by milestone**. At the end of each: verify (actually run it),
document, suggest a commit, summarize, then **stop and wait** for the user to
say continue. Commit only when the user asks.

## Hard rules

1. Everything shipped is production-ready and immediately usable.
2. No placeholder screens, no "coming soon" stubs, no dead code, no unused
   files/vars/imports/deps. If a tab/feature has no real data yet, don't ship
   it — add it when its data exists (this is why Phase 1 client tabs were
   added module by module).
3. Modular enough that new phases bolt on without refactoring.
4. **Never invent** credentials, URIs, API keys, secrets. When one is needed,
   stop and ask the user (the "USER ACTION REQUIRED" protocol). Local
   defaults with an env override are fine (e.g. `UPLOAD_DIR`).
5. Verify by running — boot the server, hit endpoints with curl, drive the
   Vite app in the browser, check the console. Never claim it works unchecked.
   Testing has repeatedly caught bugs that passed code review.
6. KISS, DRY, SOLID where it helps. Readable beats clever. Never add a library
   where ~30 lines would do; any new dependency needs a stated justification.

## Locked stack

Frontend: React 18, Vite, TailwindCSS, React Router, TanStack Query, React
Hook Form, Zod, Axios. Backend: Node.js, Express. DB: MongoDB Atlas via
Mongoose. Auth: JWT access token (in memory) + refresh token (httpOnly cookie)
with rotation. Utilities: Helmet, Winston, Multer, express-rate-limit, CORS,
dotenv. Added with justification in Phase 1: exceljs + pdfkit (exports), bcrypt
/ jsonwebtoken / cookie-parser. Post-Phase-1: `xlsx` (SheetJS, patched 0.20.3
from the vendor CDN, not the vulnerable npm 0.18.5) to READ legacy `.xls`
attendance-device exports in the Timesheet Processor; exceljs still writes. No
component libraries (Tailwind only).

## Architecture (decided — do not relitigate)

- **Monorepo**, two apps: `client/` and `server/`.
- **Layered backend**: routes → validation middleware (Zod) → controller →
  service → model. Controllers only translate HTTP; services hold business
  logic; models hold schemas. Business logic never in a controller.
- **Feature-based frontend**: `features/<name>/` owns pages, components,
  `<name>.api.js`, `<name>.schema.js`. Shared UI primitives in
  `components/ui/`, cross-feature composites in `components/shared/`.
- **References over embedding** for entities with independent lifecycles
  (Employee ↔ Client ↔ Deployment). Embed only data that lives and dies with
  its parent (line items, sites, doc versions, emergency contact). Snapshot
  denormalized fields (clientName on deployment/quotation) for durable history.
- **Single JSON contract**: every endpoint returns `{ success, message, data }`
  via `ApiResponse`; failures throw `ApiError`; one centralized error handler;
  never leak stack traces in production. Binary responses (exports, file
  streaming, PDFs) are the only documented exception.
- **Tokens**: short access token in client memory only (never localStorage);
  rotating refresh token in an httpOnly, sameSite cookie with a 30s reuse-grace
  window (multi-tab safe) + theft detection; CORS with credentials + exact
  origin. File/export downloads fetch an authenticated Blob (a plain
  `<a>`/`<img>` can't send the in-memory token).

## Security requirements

Helmet, rate limiting (stricter on auth), bcrypt, JWT + refresh rotation, Zod
validation on EVERY input server-side (never trust the client — totals, roles,
ownership all re-checked/recomputed on the server), input sanitization, RBAC on
every protected route, audit logging of auth + CRUD, secrets only via env.
Winston logs auth/CRUD/warnings/errors — never passwords/tokens/secrets.

Roles: `Admin, Manager, HR, Accounts` (Phase 2 adds `Coordinator`, `Worker`).
Per-module write/delete guards live in `client/src/lib/constants.js` (UI
hint) and are enforced server-side (truth). `Operations` and `Viewer` were
removed post-P2-M2 — never had a real account, not part of the role set
going forward.

## UI requirements

Tailwind only, token-based colors (dark-mode-ready class strategy). Inspiration:
Linear, Stripe, Vercel, Notion — modern, minimal, consistent spacing/type.
Every data view: loading skeletons, empty states, error states, success toasts,
confirm dialogs for destructive actions. Fully responsive: no horizontal page
scroll (wide tables scroll inside their own container / become cards on
mobile), collapsible sidebar, touch-friendly. Lists are row-clickable to the
detail view with an explicit View button too.

## Verification (every milestone)

curl the happy path + validation failure + auth failure + wrong-role failure;
for frontend, a browser click-through. Fix everything found before declaring
done. No automated test suites unless asked.

## Environment notes (Windows dev)

- `node --watch` sometimes orphans a worker holding port 5000; kill node
  `src/server.js` processes and restart clean before testing after server
  edits. Warm the connection before the first curl (first request can return
  HTTP 000). Git shows harmless LF→CRLF warnings.
- Server: `cd server; npm run dev` (needs `server/.env` — see `.env.example`;
  Atlas URI, JWT secrets, UPLOAD_DIR). Client: `cd client; npm run dev`.
- Seed/reset admin: `npm run seed:admin -- <email> <password> "<name>"`.

## Status

**Phase 1 COMPLETE (M1–M10)** — auth/RBAC, employees, clients, deployments,
attendance (+Excel/PDF export), documents (uploads/versioning/preview),
quotations (line items/totals/PDF), dashboard. Plus a view-access UI pass.
Each milestone documented in `docs/M<N>-notes.md`.

**Phase 2 backbone COMPLETE (`docs/PHASE2-PLAN.md`)** — worker accounts +
self-service portal, timesheets + approval, payroll + payslips, invoices +
payments, expenses, and a real profit dashboard, all now built end-to-end
(P2-M1 through P2-M8). Same stack, same rules, same discipline.

- **P2-M1 COMPLETE** — worker accounts & account linking: `Worker` role,
  `User.employee` link (partial unique index), `requireStaff` locking all admin
  modules against Workers, admin-only login provisioning (temp password surfaced
  once). See `docs/P2-M1-notes.md`.
- **P2-M2 COMPLETE** — ESS portal (My Profile/Documents/Leave, real web access
  now — the P2-M1 staff-only gate is gone), `Coordinator` role + hierarchy
  (`Employee.coordinator`, `User.managedBy`, scoped queries), a Users module
  for staff-login provisioning (Admin/Manager/HR/Accounts/Coordinator —
  previously only possible via the `seed:admin` CLI), a
  configurable Leave module (`LeaveType` policies + a server-side eligibility
  engine with Annual/ContractCycle/Manual auto-approval), and configurable
  expiry-alert thresholds with Coordinator team-scoping. See
  `docs/P2-M2-notes.md`.
- **P2-M3 PARTIAL** — installable PWA (manifest, service worker, icons) and
  geofenced Worker self-attendance (GPS geofence + office-IP allow-list,
  Admin-configurable, staff marking still overrides). The multi-level signed
  timesheet-approval half (new `BDM` role, per-user signature images, the
  timesheet document itself) is designed but waiting on a template example
  from the user before building. See `docs/P2-M3-notes.md`.
- **P2-M4 COMPLETE** — self-service password change (`PATCH /api/auth/password`,
  every role, revokes all sessions) and Admin-initiated password reset for
  both staff and Worker logins (the recovery path — no email provider is
  configured for a self-service "forgot password" flow). Also: real logo
  applied everywhere (PWA install icons, sidebar/login marks, theme color).
  See `docs/P2-M4-notes.md`.

**Phase 3 COMPLETE (`docs/PHASE3-PLAN.md`)** — folded an HR/ESS PRD's
remaining scope into the Phase 2 backbone: EOSB, statutory leave/holidays,
financial requests, exit & document requests, asset tracking, overtime/
Ramadan shift rules, notifications, and multi-language, all now built
end-to-end (P3-A through P3-G) — decided over native mobile (staying on the
PWA) and against inventing the deferred multi-level timesheet signing flow
(a sensible single-level default instead).

- **P3-B COMPLETE** — statutory leave caps (`LeaveType.maxDaysPerRequest`,
  `isPaid`) and a new company Holiday calendar module, integrated into the
  attendance records grid (inferred "Holiday" days, same precedence as the
  existing weekly-off inference) and both Leave pages. See
  `docs/P3-B-notes.md`.
- **P3-A COMPLETE** — End of Service (EOSB) calculator: Labor Law Article
  84/85 award (tiered gross + resignation reduction), vacation-pay
  encashment of unused annual leave (reuses the Leave module's own
  eligibility engine), a permanent `Settlement` record per exit, and a PDF.
  See `docs/P3-A-notes.md`.
- **P3-C COMPLETE** — financial requests: salary advance/loan workflow with
  a manual repayment ledger (auto-`Closed` at zero balance; no Payroll to
  auto-deduct yet) and expense reimbursement claims with a real receipt
  upload (own minimal file storage, not routed through the Documents
  module — different trust category). Single-level Approve/Reject, not the
  multi-level matrix the PRD describes — same judgment call as the
  Phase 3 planning decision to default P2-M3b's timesheet signing the same
  way. See `docs/P3-C-notes.md`.
- **P3-D COMPLETE** — exit re-entry visa requests (tracks the request only;
  Jawazat/Muqeem processing stays external), certificate requests with real
  generated PDFs for Salary/Service certificates (minimal letterhead — no
  company Settings record exists yet, so no CR number/signatory is
  invented; the Service Certificate correctly pulls a real exit date from
  an EOSB Settlement when one exists) and status-only tracking for Chamber
  of Commerce Attestation (an external stamping process, no document to
  generate), and a company asset register (`Asset` + a separate
  `AssetAssignment` history collection, mirroring Deployment's exact
  pattern). See `docs/P3-D-notes.md`.
- **P2-M3b COMPLETE** — timesheet approval, resuming the Phase 2 backbone:
  a weekly `Timesheet` that summarizes real Attendance data (self-punched
  hours, or `expectedDailyHours` as the fallback for a staff-marked
  Present day — never an invented default) and puts it through single-level
  Approve/Reject, plus bulk-approve. Does not re-enter hours (Attendance
  already does that) and does not yet lock approved weeks against later
  attendance edits (deferred until Payroll needs it). See
  `docs/P2-M3b-notes.md`.
- **P2-M5 COMPLETE** — payroll & payslips: a monthly `PayrollRun` computed
  from real employee salaries (an optional Basic/Housing/Transport
  breakdown on Employee, falling back to the whole salary as Basic when
  unset — never an invented split) and P2-M3b's approved hours (shown as
  informational; overtime-rate pay is P3-E's job, not yet built). GOSI is
  entered by HR/Accounts, never calculated — no verified current rate
  exists in this app. Draft → editable, Finalize → locked and payslips
  become visible in ESS, with a real generated PDF. See `docs/P2-M5-notes.md`.
- **P2-M6 COMPLETE** — invoices & payments: an `Invoice` created from an
  Approved quotation (line items/totals frozen at creation, never
  re-derived if the quotation later changes), one per quotation, with an
  append-only payment ledger (`amountPaid`/`balanceDue`/`status` always
  recomputed, same discipline as the salary-advance repayment ledger), an
  invoice PDF, and a real "Invoices" tab on the client profile. Deletable
  only before any payment is recorded. See `docs/P2-M6-notes.md`.
- **P2-M7 COMPLETE** — expenses: a company-level `Expense` ledger (date,
  category, vendor, amount, optional client/deployment attribution, an
  optional receipt reusing the reimbursement-claim upload pattern),
  list + filters + a monthly-totals summary, a narrower Admin/Manager/HR/
  Accounts view circle than Invoices (internal cost data, same circle as
  Payroll/EOSB). The other half of profit for P2-M8's Dashboard v2. See
  `docs/P2-M7-notes.md`.
- **P2-M8 COMPLETE — Phase 2 backbone finished.** Dashboard v2: real profit
  (Revenue from issued invoices − Payroll cost from a Finalized PayrollRun
  − recorded Expenses, all for the same selected calendar month), a month
  selector, and a 6-month diverging-bar trend — replacing the old "profit
  needs cost data" placeholder. Extends the existing `/api/dashboard`
  endpoint rather than adding a new one; the old approved-quotation/
  pipeline/payroll-run-rate estimates stay alongside it, relabeled
  "Pipeline". See `docs/P2-M8-notes.md`.
- **P3-E COMPLETE** — overtime & Ramadan shifts: a configurable
  `RamadanPeriod` calendar (date range + editable daily/weekly hour caps,
  default 6/36 per Labor Law Article 98), real overtime hours computed
  weekly on Timesheet submission (48-hour normal week, or the smallest
  overlapping Ramadan cap), and real overtime pay (Article 107's 1.5× on an
  hourly wage of basicSalary/240) folded into Payroll's gross pay and
  payslip PDF. See `docs/P3-E-notes.md`.
- **P3-G COMPLETE — Phase 3 fully finished.** Multi-language: the Worker
  self-service (ESS) portal (not the staff panel — the user's explicit
  scope choice) fully translated into English/Arabic/Hindi/Nepali/Bengali
  via i18next, with real RTL for Arabic (native `dir="rtl"` cascading,
  verified with a screenshot — no per-component RTL classes needed). A
  language switcher lives only on the login screen and the ESS shell.
  Server-generated text, client-side Zod messages, and date/number
  formatting stay English/unlocalized — documented scope boundaries, not
  oversights. See `docs/P3-G-notes.md`.
- **P3-F COMPLETE** — notifications: a real in-app notification center
  (bell icon in both staff and Worker headers, every role) plus genuine Web
  Push (VAPID, the app's own self-generated key pair — see `.env.example`)
  on top of it. Wired into every one of the app's 7 decide-type actions
  (Leave, Timesheet, Salary Advance, Reimbursement ×2, Exit Re-entry Visa,
  Certificate, Client) plus a daily expiry-alert background job
  (setInterval, no new scheduler dependency) for Admin/Manager/HR. See
  `docs/P3-F-notes.md` — including a critical dedupe-index bug found and
  fixed during verification.

**Post-Phase-3 addition (not phase-numbered — Phase 3 was already complete
when requested):**

- **Tiered sick pay COMPLETE** — Labor Law Article 117: a new `Sick`
  LeaveType recurrence with fully configurable pay tiers (`sickPayTiers`,
  the client pre-fills the statutory 30d@100%/60d@75%/rest@0% as a starting
  point, but every number is company-editable, never hardcoded — the user's
  explicit instruction, same as leaving Bereavement/Hajj day-counts
  unseeded), a real eligibility engine that consumes tiers in leave-year
  order across all of a worker's sick requests, and a real payroll deduction
  (`sickLeaveDeduction`) computed by reconstructing which calendar days of
  an approved request fall in the target payroll month — correctly handling
  a request that spans a month boundary. See `docs/SICK-PAY-notes.md`.
