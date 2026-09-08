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
component libraries (Tailwind only). Post-Phase-3: `@capacitor/core` +
`@capacitor/android` + `@capacitor/ios` + `@capacitor/geolocation` to wrap
the existing web app as a real installable native app (see
`docs/P-MOBILE-notes.md`) — reuses the same React code, not a rewrite.

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

Roles: `Admin, Manager, HR, Accounts` (Phase 2 adds `Coordinator`, `Worker`;
post-Phase-3 adds `Staff`, then `Executive` — see the RBAC tightening Status
entry). Per-module write/delete guards live in `client/src/lib/constants.js`
(UI hint) and are enforced server-side (truth). `Operations` and `Viewer` were
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
- **Native Android app COMPLETE** — the PWA wrapped in a real installable
  Android app via Capacitor (React Native was considered and rejected: a
  full rewrite of 15+ existing modules vs. near-zero rework). Reuses every
  screen unchanged; the hard part was cross-origin cookie handling —
  `CapacitorHttp`'s native networking (not plain WebView fetch) turned out
  to be required, not optional, for the refresh-token cookie to survive an
  app restart, alongside a real bug fix (the cookie had no `maxAge`, which
  also quietly improves the *web* app's "stay logged in" behavior). CORS
  and the CSRF origin guard now support multiple trusted origins. The
  Worker/Staff/Admin geofence GPS calls were swapped to
  `@capacitor/geolocation` — the concrete PWA limitation flagged when the
  original "stay on PWA" decision was made. iOS is scaffolded but unbuilt
  (no Mac available). A signed release build was verified end-to-end
  against the real production deployment (Oracle VM + Caddy/DuckDNS HTTPS +
  MongoDB Atlas + GitHub Actions CI/CD) — login and session persistence
  both confirmed against the live server. See `docs/P-MOBILE-notes.md`.
- **Configurable Approval Hierarchy COMPLETE** — a self-service,
  admin-configurable multi-step approval workflow for Leave/Salary-Advance/
  Reimbursement/Timesheet, modeled on the company's real org chart (GM→COO→
  {MM,HR,FM}; MM→BDM→Coordinators; FM→Accountants/Clerks). New
  `ApprovalRole` (admin-named, any staff members) and `ApprovalWorkflow`
  (ordered steps, each a pool of roles — "any ONE member decides it," which
  covers both a strict single approver and a fan-in final tier with no
  special-casing) — fully decoupled from the fixed `User.role` enum, not an
  expansion of it. One `Employee.approvalWorkflow` override field is the
  entire mechanism behind a company having two different chains (e.g. a
  BDM-inclusive branch vs. a Finance branch that skips straight to the top
  tier) — no hardcoded department concept anywhere. A `null` workflow always
  means the original single-level flow, byte-for-byte unchanged — the safe
  per-employee rollout mechanism. Also closed a real, separately-confirmed
  gap: staff (Coordinator/HR/Manager/Accounts) previously had no way to
  submit a request of their own at all (only the Worker ESS portal could) —
  each request type now has a staff self-submit route reusing its existing
  submit function verbatim. A shared `ApprovalTrailView` and a cross-type
  Approval Log (visible to Admin or any real ApprovalRole member) give
  "who approved what" full visibility. See `docs/APPROVAL-HIERARCHY-notes.md`.
- **Mobilisation module COMPLETE** — a new commercial+staffing record for
  placing a worker with a client (optionally through a `Subcontractor`, a
  new simplified Client-like entity), replacing the coordinators' Excel
  sheet: full `Subcontractor` CRUD; `Mobilisation` CRUD with snapshot
  fields from Employee/Client/Subcontractor and a plain editable `profit`
  (not auto-calculated — the commission formula isn't verified yet, same
  posture as Payroll's manual GOSI); joint-coordinator invite/confirm and
  submit-to-review; Marketing Manager commercial-details + decide, reusing
  the Configurable Approval Hierarchy engine unchanged (one small
  backward-compatible extension: `decideApprovalStep` gained an optional
  `notifyFinal` override, since Mobilisation's coordinators are Users
  directly, not an Employee-linked login the engine's default assumes); an
  admin-configurable `MobilisationSettings` viewer-role circle (BDM/
  Marketing Manager/FM/COO/GM see everything once submitted) and
  self-mobilise roles, deliberately NOT reusing the Approval Log's generic
  "any ApprovalRole member" check since the real org chart has roles that
  should be excluded from mobilisation visibility; commercial-field
  stripping for a plain Coordinator once Approved; multi-file documents
  reusing the existing private Cloudinary pipeline. See
  `docs/MOBILISATION-notes.md`.
- **Workforce model: Subcontracted employee type + Staff login role
  COMPLETE** — a third `Employee.type` (`'Subcontracted'`) for a worker
  sourced from an outside `Subcontractor` (their real employer, not this
  company): full compliance/attendance tracking applies, but Payroll and the
  dashboard's payroll-cost figure stay `'Client'`-only by design, since this
  company never pays them. A new `Staff` login role reuses the existing
  Worker ESS portal (`/api/me`) verbatim for office employees who need a
  login but only for their own self-service, never the company-wide staff
  modules. Also fixed a real pre-existing bug found during verification: a
  PATCH to an employee that omitted `type`/`status` was silently resetting
  both to their schema defaults (Zod's `.partial()` doesn't suppress
  `.default()`) — the same class of bug this file's `weeklyOffDay` field had
  already been written to avoid, just not consistently applied. See
  `docs/WORKFORCE-MODEL-notes.md`.
- **Navigation consistency: Back button everywhere + login role correction
  COMPLETE** — a `PageHeader` `onBack` prop (icon arrow left of the title)
  rolled out to every page one level below a sidebar hub (29 pages), plus
  the previously-missing Employee/Client/Quotation/Mobilisation Edit pages;
  hub landing pages and Dashboard deliberately excluded (already one click
  from the sidebar). New: `PATCH /api/employees/:id/user/role` lets Admin/HR
  correct an existing login's role (e.g. Worker picked instead of Staff),
  revoking sessions so it takes effect immediately — the Team/Users admin
  page still deliberately excludes Worker/Staff logins from its own
  management surface, so this lives on the Employee profile instead. Also:
  `Input`/`Textarea` now default `autoComplete="off"` (Chrome was leaking
  autofill suggestions between every entity's `name` field app-wide, since
  they all shared one origin-wide autofill bucket) — **superseded 2026-09-05**,
  see below. See `docs/UI-NAVIGATION-notes.md`.
- **Follow-up (2026-09-05): autofill fix replaced + 6 missed back buttons
  COMPLETE** — the `autoComplete="off"` fix above didn't actually stop
  Chrome's "Addresses and more" contact-autofill, which ignores that
  attribute's value entirely for a field it heuristically recognizes as
  name/email/phone-shaped. Real fix: `Input`/`Textarea` now render `readOnly`
  until the field's first click/focus, so Chrome never gets an editable
  field to attach suggestions to in the first place — scoped to only the
  default case, so Login/Change-password's explicit `autoComplete` overrides
  are unaffected. Also found and fixed: the original back-button audit only
  covered pages one level below a nav hub, missing every hub's own "New"
  page — 6 pages (Mobilisation/Deployment/Settlement/Employee/Quotation/
  Client) gained `onBack`. See `docs/UI-NAVIGATION-notes.md`.
- **Company Settings COMPLETE** — a real company profile (legal identity,
  contact & address, bank details, authorized signatory, logo), admin-
  configurable `manageRoles` circle (Admin/Manager always; else any member
  of a chosen `ApprovalRole`, changing the circle itself is Admin-only), and
  wired into every PDF generator (Invoice, Quotation, Settlement,
  Certificate, Payslip) via one shared `getLetterheadData()` call and a
  common `LETTERHEAD_HEIGHT` constant — a PDF generated before the profile
  exists still renders exactly as it always did. Invoices also gained a
  Payment Instructions section (bank name/IBAN) shown only on a
  still-outstanding balance. See `docs/COMPANY-SETTINGS-notes.md`.
- **Job Titles COMPLETE** — replaced Mobilisation's free-text Job title
  field with an admin-managed picklist (`JobTitle` model), writable by
  Admin/Manager or any `ApprovalRole` member (a coarser, lower-stakes check
  than Company Settings' own `manageRoles`, matching the lower sensitivity
  of a label list), with an inline "+ Add new" quick-create modal on the
  Mobilisation form. `Mobilisation.jobTitle` stays a plain snapshot string,
  not a foreign key — same durable-history convention as `clientName`/
  `workerName`. A real bug was found and fixed during verification: the
  newly-created title wasn't auto-selecting because `setValue` ran before
  the invalidated list query's refetch had put the matching `<option>` in
  the DOM; fixed by deferring the selection to a `useEffect` that waits for
  the option to actually exist. See `docs/JOB-TITLES-notes.md`.
- **RBAC tightening COMPLETE** — prompted by the user noticing Manager could
  configure Leave Types (an Admin/HR job). Moved Leave Type + Holiday
  calendar config to Admin/HR only. Added a new `Executive` role (GM/COO)
  built deny-by-default — excluded from `STAFF_ROLES` so every CRUD module
  rejects it automatically, then explicitly allow-listed via a new
  `requireStaffOrExecutive` into only the Dashboard and the Leave/Timesheet/
  SalaryAdvance/Reimbursement list+submit+decide endpoints + the Approval
  Log; real per-item authorization still comes entirely from `ApprovalRole`
  membership via the shared engine, unchanged. The sidebar gives Executive
  its own short, explicitly-defined flat nav rather than another `roles`
  filter on the existing grouped one — an unguarded nav item is visible to
  anyone by default, which is exactly how Manager's clutter happened in the
  first place. Also added a precautionary "are you sure?" confirmation
  (reusing `ConfirmDialog`, previously delete-only) to every Approve/Reject
  action across Leave/Timesheet/Salary-Advance/Reimbursement — a real
  pre-existing gap for every role, not just Executive. Mobilisation and
  Client decide flows were deliberately left out of this pass (see
  `docs/RBAC-notes.md`). See `docs/RBAC-notes.md`.
- **Tabbed layout COMPLETE** — the 5 pages that stacked several independent
  panels vertically (Leave, Timesheets, Financial Requests, Exit Documents,
  Approval Hierarchy) now split them into tabs instead, prompted by the
  same UX review that led to the RBAC pass above. New shared
  `components/ui/Tabs.jsx` (fully controlled, horizontally-scrollable at
  every width rather than collapsing to a `<Select>` on mobile,
  lazy-mount-then-keep-alive so switching tabs never loses in-progress
  form input) plus a `useTabParam` hook backing the active tab with a
  `?tab=` URL param — chosen specifically so every existing
  "needs your approval" notification link (which points at the bare page,
  now also each page's default tab) keeps working with zero server change,
  while leaving room for a future notification to target a specific tab.
  Two pages needed real internal surgery (Financial Requests' submit
  panels were exported out of their review-panel files; Timesheets' inline
  queue was extracted into its own component so its bulk-approve button
  could move out of the always-visible `PageHeader` into the queue's own
  tab); the other three were pure page-shell swaps. See
  `docs/TABS-notes.md`.
- **BDM/Manager dashboard narrowing + attendance fixes COMPLETE** — the
  Manager-role dashboard (the generic login a BDM job title holds) no
  longer shows Pipeline/Profit/Recent Activity (Admin/Executive territory);
  "Pending quotations" is now personal (their own Drafts — required adding
  a real `Quotation.createdBy` field). A new "Waiting on you" widget (real
  per-viewer pending-decision counts, every role) replaced the old
  company-wide-only framing. Manager can now self-mark attendance
  (`STAFF_SELF_ATTENDANCE_ROLES`). Root-caused a recurring native-scrollbar
  UI glitch to a genuine CSS quirk (`overflow-x-auto` alone forces the
  other axis to `auto` too) rather than guessing from a screenshot, via
  `getComputedStyle` at the exact reported coordinates. Also fixed a real
  pre-existing bug found during verification: the query cache was never
  cleared on login/logout, so switching accounts in one tab could briefly
  leak the previous user's cached data. See `docs/BDM-DASHBOARD-notes.md`.
- **Section Access COMPLETE** — a generic, admin-configurable "who else can
  open this section" mechanism (extracted from the bespoke pattern Company
  Settings/Mobilisation Settings each built independently), covering
  Payroll and Expenses first. Each section grants access by literal login
  role and/or by a named `ApprovalRole` (e.g. "Financial Manager", "COO")
  — Admin always has full access; nobody else does until granted. Both
  modules collapsed from three role tiers (view/write/finalize) to one
  unified circle per section, matching the user's own framing ("do
  whatever they want") — Accounts kept default access (now including
  finalize/delete, which it previously lacked), Manager/HR lost their
  previous default access. New Admin-only Section Access settings page.
  See `docs/SECTION-ACCESS-notes.md`. Extended the same afternoon: a third
  section, `employeeCreate` (Admin only by default, until an admin
  designates a real "office secretary" via an `ApprovalRole` grant),
  replacing Employee's old static `requireRoles('Admin','Manager','HR',
  'Coordinator')` create guard — plus a new `GET /section-access/:key/mine`
  endpoint (any user, not Admin-only) so a page can hide a gated button
  before a wasted form-fill 403s. Found and fixed a real pre-existing bug
  in the same pass: a Coordinator's create form let them pick "Own —
  internal staff," which the server always overrides to 'Client', but that
  override runs after Zod validation — a Coordinator following the form's
  own "optional for Own" guidance would 400 on fields Mongoose required for
  the type they were silently flipped into. Fixed by never offering 'Own'
  to a Coordinator in the first place.
- **Exit Re-Entry & Certificate join the Approval Hierarchy engine
  COMPLETE** — the same self-submit gap the original Configurable Approval
  Hierarchy work closed for Leave/Timesheet/SalaryAdvance/Reimbursement,
  closed for these two: a staff login can now submit their own request
  (new "Submit Re-Entry"/"Submit Certificate" tabs), and an Admin can
  configure a multi-step `ApprovalWorkflow` for either from the Approval
  Hierarchy page — both types added to `APPROVAL_REQUEST_TYPES`, both
  models gained the standard `workflow`/`steps`/`currentStep`/
  `approvalTrail` fields, both `decide` functions now run through the
  shared engine. Marking a request actually issued stays a separate,
  narrower Admin/Manager/HR-only step (HR/compliance paperwork, not part
  of the approval chain). Found two more latent bugs while wiring this in:
  the Approval Log's source map only ever listed `Leave` (SalaryAdvance/
  Reimbursement/Timesheet/Mobilisation support workflows too but were
  never added — follow-up queued), and the shared `ApprovalTrailView`'s
  progress badge was hardcoded to Leave's own pending-status string
  (fixed via a prop for the two new types; four existing callers still
  carry the old bug — follow-up queued). See
  `docs/APPROVAL-HIERARCHY-notes.md`'s 2026-09-06 follow-up.
- **Staff panel Arabic, first increment (shell + Dashboard) COMPLETE** —
  P3-G's ESS-only i18n scope explicitly extended to the staff panel too,
  English/Arabic only (Hindi/Nepali/Bengali stay ESS-only — a different
  persona), rolled out module by module like everything else in this app.
  Before writing code, a real design tradeoff was put to the user: whether
  RTL should flip app-wide the moment Arabic is picked (even on the ~49
  staff pages not yet translated) or only per-page as each is translated —
  decided in favor of flipping immediately, everywhere, for one consistent
  direction throughout the rollout. Reuses the ESS portal's exact i18next/
  RTL machinery (one shared instance); `LanguageSwitcher` gained an
  optional `languages` prop so the staff shell can offer a restricted
  English/Arabic list without touching the ESS's own 5-language mount
  points. This increment: the full navigation shell (every sidebar/hub
  label+description), the staff header chrome, and the entire Dashboard
  page + its 6 sub-components — every visible string, not a partial pass.
  See `docs/STAFF-I18N-notes.md`.
- **Follow-up (2026-09-06): Hindi/Nepali/Bengali removed app-wide** — the
  user decided the ESS portal's workforce-language scope was no longer
  wanted; every surface (ESS, login, staff panel) is now English/Arabic
  only. Removed the three locale files, their i18n registrations, and the
  now-redundant `STAFF_SUPPORTED_LANGUAGES` split (`LanguageSwitcher` no
  longer needs a per-surface `languages` override). See
  `docs/P3-G-notes.md`'s superseded note.
- **Section Access expanded to every module COMPLETE** — the original
  Payroll/Expenses/`employeeCreate` mechanism now covers ~20 sections
  app-wide: the two older bespoke "who else can open this" patterns
  (Company Settings' `manageRoles`, Mobilisation Settings'
  `viewerRoles`/`selfMobiliseRoles`) folded into it; every other
  financial/sensitive whole-module screen (Invoices, EOSB, Financial
  Requests' decide action, the Security Log, Timesheet Processor, NFC
  Customers, Team's staff-login list) and every remaining write-only action
  (Clients, Deployments, Subcontractors, Attendance marking, Documents,
  Assets, Quotations, Ramadan Periods, the Approval Hierarchy's own
  role/workflow editing) now has a real, admin-configurable circle instead
  of a hardcoded role list — plus, as an optional but genuinely
  zero-regression finishing touch, Leave/Timesheet/Exit-Documents' router
  floors too. Every default preserves today's real access exactly (a
  rollout that silently changed nothing) except two explicitly-flagged
  cases: Accounts gains full EOSB rights (create/delete, not just view) and
  Coordinator's mobilisation create-permission (from the earlier Mobilisation
  Settings reconciliation) moves from hardcoded to admin-editable. A real
  design bug was caught and fixed mid-implementation: `financialRequests`
  first tried to gate the review queue itself, which broke Coordinator's
  existing self-submit right and, more importantly, revealed that a
  Section Access floor sitting in front of the shared Approval workflow
  engine's own per-step authority check must never be narrower than the
  floor it replaces — fixed by only gating the DECIDE action, with a
  default matching the original floor's full reach. The client's
  `SectionAccessPage` (now ~20 cards) groups them under the same
  Workforce/Sales/Financial/Admin categories the sidebar itself uses;
  `navConfig.js` hides a nav item entirely for an ungranted whole-module
  section (matching Payroll/Expenses) while a write-only section's nav item
  stays visible with its Create/Edit button gated internally (matching
  Employees' own `employeeCreate` precedent) — surfacing two more real
  pre-existing bugs along the way (a dashboard shortcut and a Ramadan-page
  button each checking the wrong, unrelated role list). See
  `docs/SECTION-ACCESS-notes.md`.
