# Section Access

## What it is

A generic, admin-configurable "who else can open this section" mechanism —
prompted directly by the user asking: *"can we make admin make any tab or
section accessible to specific roles? Like admin can make payroll open to
accounts and FM but keep... no access... for other roles like MM or COO?"*

This is the same indirection Company Settings' `manageRoles` and
Mobilisation Settings' `viewerRoles`/`selfMobiliseRoles` each built
independently for their own one module, extracted into a reusable mechanism
so a third (and any future) module doesn't grow its own bespoke copy again.

## Design

- `SectionAccess` (`server/src/modules/sectionAccess/sectionAccess.model.js`)
  — one document per `sectionKey` (`payroll`, `expenses` today). Two
  independent grants per section:
  - `allowedRoles` — literal `User.role` values (e.g. `Accounts`).
  - `allowedApprovalRoles` — `ApprovalRole` ids (e.g. an admin-named
    "Financial Manager" or "COO" role) — a grant tied to a real person
    regardless of their login role, reusing the exact membership check
    (`isMemberOfAnyRole`) the Configurable Approval Hierarchy already uses.
- **Floor, not a bypass**: `requireSectionAccess(sectionKey)`
  (`sectionAccess.middleware.js`) first rejects Worker/Staff outright — same
  floor `requireStaff`/`requireStaffOrExecutive` enforce everywhere else —
  then checks `canAccessSection`. Admin always passes, unconditionally, so
  an Admin can never configure themselves out of a section they built.
- **A section nobody has configured yet** falls back to a hardcoded
  `DEFAULT_ALLOWED_ROLES` in `sectionAccess.service.js` (`Accounts` for both
  Payroll and Expenses) — preserves each section's real pre-existing
  operational owner rather than an empty "nobody but Admin" surprise the
  moment this shipped.
- **Changing access itself is Admin-only**, full stop — no broader circle
  (unlike Company Settings, where the broader `manageRoles` editor set can
  still edit company details, just not decide who else can). Deciding who
  gets into Payroll is not itself delegable to whoever that grant creates.

## What changed in Payroll/Expenses

Both modules previously had three role tiers (`requireRoles` for read,
write, and finalize/delete separately — e.g. Payroll's read circle was
`Admin/Manager/HR/Accounts`, write was `Admin/Manager/Accounts`, finalize
was `Admin/Manager` only). Per the user's explicit framing — *"only the
financial manager COO should have this access to do whatever they want...
add those roles to the accountant's access also"* — this collapsed to
**one unified circle per section**: whoever `requireSectionAccess` lets in
gets full read/write/finalize/delete, no sub-tiers. Manager and HR lost
their previous default access entirely (an Admin can re-grant either
explicitly from the new Section Access page); Accounts kept full access,
now including finalize/delete which it previously lacked.

Client-side, `PAYROLL_VIEW_ROLES`/`PAYROLL_WRITE_ROLES`/
`PAYROLL_FINALIZE_ROLES` and their Expense equivalents are gone — the
Payroll/Expenses nav items and pages no longer branch on `user.role` at
all; a 403 renders the page's own "You don't have access" `EmptyState`
(same dynamic-eligibility pattern Company Settings/Approval Log already
use), and a successful load implies full action access.

## Nav

`Payroll`/`Expenses` lost their static `roles` gate in `navConfig.js` (now
visible to any staff-tier role that reaches the Financial hub, same as
Company Settings) and were added to `EXECUTIVE_NAV_ITEMS` — without that,
an Executive-role login (the real-world seat for a COO/Financial Manager)
granted access via an ApprovalRole would have no way to click through to a
page their own hardcoded flat nav never included.

## New admin page

`Admin & Tools → Section Access` (Admin-only, same client-side redirect
pattern as the Approval Hierarchy page) — one card per governed section,
each with two `PillChecklist` pickers (login roles; approval roles) and its
own Save. Verified live: the real org-chart `ApprovalRole`s already in this
company (GM/COO/MM/FM/BDM/HR/Accountant/Coordinator) show up directly in
the approval-role picker — an Admin can grant "FM" or "COO" access to
Payroll right now, no further setup needed.

## Bug found and fixed during verification

`requireSectionAccess` is async (it queries the DB) but was not wrapped in
`asyncHandler` — a thrown `ApiError` inside it became an unhandled promise
rejection and **crashed the entire Node process** instead of returning a
clean 403 (the exact failure mode `asyncHandler`'s own doc comment warns
about, applied to every controller in this codebase already — I just missed
applying it to my own new middleware). Fixed by wrapping the returned
function in `asyncHandler`, matching `requireAuth`'s own pattern. Confirmed
via a full curl-based test suite: no-auth → 401, wrong role → 403 (crashed
the server before the fix), grant → 200, non-admin managing access → 403,
invalid section key → 400, ungrantable role (`Worker`) → 400.

## Verification

Full curl suite (11 checks: happy path, auth failure, wrong-role failure
before AND after a live grant, validation failures) — see git history for
the throwaway script (not committed). Browser-verified with three throwaway
logins (Admin, Manager, Accounts): Manager correctly blocked from Payroll
by default and shown a clear "you don't have access" page with no dangling
"Run payroll" button; Accounts gets full read/write access including the
"Run payroll" action; the Section Access page itself renders both sections
with real approval-role options and persists a save correctly (spot-checked
by granting FM access to Payroll, confirming via API, then reverting).
All throwaway accounts/employees/section-access overrides cleaned up
afterward — the two sections are back to their out-of-the-box default
(`Accounts` only, no approval-role grants).

## Follow-up: a third section — `employeeCreate`

Reused for a second, unrelated ask: *"only office secretary... assigned by
admin... until then only admin can add employees."* Added `employeeCreate`
to `SECTION_KEYS` (default `[]` — nobody but Admin), wired
`POST /api/employees` to `requireSectionAccess('employeeCreate')` in place
of its old static `requireRoles('Admin','Manager','HR','Coordinator')`. An
Admin designates the "office secretary" (any role — the whole point) by
putting them in a named `ApprovalRole` and granting it from the Section
Access page. Coordinator's old self-team-creation override in
`employee.service.js` still exists and still works when re-granted; it's
just no longer a blanket default.

**New endpoint**: `GET /api/section-access/:sectionKey/mine` — any
authenticated user (not Admin-only), returns `{ allowed }` for the caller
only. Added so `EmployeeListPage.jsx` can decide whether to even show the
"Add employee" button without a wasted full-form-fill ending in a 403; moved
the Worker/Staff role floor from the route middleware into `canAccessSection`
itself so both this endpoint and `requireSectionAccess` share one copy of it.

Also removed genuinely dead code found in the same pass: a client-side
`SECTION_ACCESS_SECTIONS` constant (labels/descriptions) that was defined
but never imported anywhere — `SectionAccessPage.jsx` only ever used the
server's `label` field. Moved `description` into the server's
`SECTION_LABELS`-adjacent map instead of resurrecting the unused client
constant, so section metadata has one source of truth.

**Real pre-existing bug found and fixed during verification** — unrelated
to Section Access itself: a Coordinator's create form let them pick
"Own — internal staff" as the type, which the server always overrides to
'Client' (a Coordinator can never create an internal-staff record — see
`employee.service.js`). Because that override runs in the service, AFTER
Zod validation, a Coordinator submitting `type: 'Own'` with no
nationality/mobile/joiningDate (all optional for 'Own' per Zod, exactly as
the form's own help text says) would pass validation, get flipped to
'Client' server-side, and then fail Mongoose's schema-level required fields
for a document whose fields were never marked required for what the user
actually selected — a confusing 400 for a real Coordinator following the
form's own guidance. Fixed at the root: `EmployeeForm.jsx` no longer offers
'Own' as a choice when the actor is a Coordinator, so the type they submit
always matches the type they end up with. Verified end-to-end via the API:
a Coordinator granted `employeeCreate` access, submitting the fields the
now-correct form would actually collect for 'Client', successfully creates
an employee force-assigned to themselves as coordinator.

## Reconciliation M1: Company Settings, and a real bug fix

Two older modules (Company Settings, Mobilisation Settings) had each built
their own one-off version of "who else can open this" before Section Access
existed. Plan: fold both into the generic mechanism instead of maintaining
three copies of the same idea.

**Bug found while touching this code**: `GRANTABLE_ROLES` (server model) and
the Zod enum both included `'Office Secretary'`, and the client's own
`SECTION_ACCESS_GRANTABLE_ROLES` happened to already exclude it — masking a
silent no-op by accident, not fixing it. `canAccessSection`'s hard floor
(`STAFF_ROLES.includes(actor.role)`) excludes Office Secretary unconditionally
(see its own doc comment: it reaches things only via `ApprovalRole`
membership on a workflow step, never a blanket per-section grant), so an
Admin picking it in the UI saved fine and granted nothing. Fixed by removing
`'Office Secretary'` from `GRANTABLE_ROLES` (`sectionAccess.model.js`) instead
of widening the floor to admit it.

**Company Settings → `companySettings`**: `manageRoles` was already a pure
boolean gate (`canManageCompanySettings`, checked once per controller
action), so this was a low-risk swap. Added `companySettings` to
`SECTION_KEYS`, default `allowedRoles: ['Manager']` — matches the old
hardcoded `actor.role === 'Manager'` branch exactly. `canManageCompanySettings`
is gone; every controller action now calls `canAccessSection('companySettings',
actor)` directly. `PATCH /company-settings/manage-roles` (the old dedicated
endpoint), `updateManageRoles`, and `CompanySettingsPage`'s own manage-roles
UI block are all removed — an Admin configures this from the Section Access
page now. The real production `CompanySettings` singleton had no
`manageRoles` set yet, so there was nothing to migrate — the new
`companySettings` `SectionAccess` doc was created directly with the default.

Verified: curl'd `GET/PATCH /api/company-settings` as Manager (200, matching
the default) and as HR (403), then via the Section Access page granted HR
access and confirmed the 403 flipped to 200; reverted the grant afterward.
Browser-confirmed the Section Access page renders the new `companySettings`
card and `CompanySettingsPage` no longer shows its old manage-roles block.

## Reconciliation M2: Mobilisation Settings — two new keys

The harder of the two reconciliations flagged in the plan: `viewerRoles`/
`selfMobiliseRoles` were never simple route gates — `viewerRoles` was woven
into `listMobilisations`' MongoDB `$or` visibility filter and
`getMobilisation`'s status-conditioned `REVIEW_FIELDS`/`COMMERCIAL_FIELDS`
stripping; `selfMobiliseRoles` backed a 3-way hardcoded
`Admin || Coordinator || isMemberOfAnyRole(...)` check in `createMobilisation`.

Added two keys to `SECTION_KEYS`:
- **`mobilisationsSelfMobilise`** (default `allowedRoles: ['Coordinator']`,
  folding in the old hardcoded Coordinator bypass) — a simple boolean gate,
  ported directly: `createMobilisation`'s 3-way check collapsed to one
  `canAccessSection('mobilisationsSelfMobilise', actor)` call. **Real
  behavior change, flagged in the plan up front**: Coordinator's
  create-permission moves from hardcoded/unchangeable to
  default-on-but-admin-editable — verified live (see below) that an Admin
  really can now revoke it.
- **`mobilisationsViewer`** (default `allowedRoles: []`, migrated
  `allowedApprovalRoles`) — not a route gate, so the swap is a new shared
  helper, `isMobilisationViewer(actor, precomputedRoleIds)` in
  `mobilisation.service.js`, used by both `listMobilisations`' visibility
  filter and `getMobilisation`'s access check. Checks `allowedRoles` first (a
  literal login-role match — the "bonus consistency win" the plan called out,
  since the old `viewerRoles` field never supported this), then
  `allowedApprovalRoles` membership. `listMobilisations` passes its
  already-fetched `roleIds` (computed once per request for the
  PendingReview step-reviewer check too) to skip a second `ApprovalRole`
  query; `getMobilisation` has no such list lying around, so it falls
  through to `isMemberOfAnyRole`'s single indexed lookup instead — same
  query shape the pre-reconciliation code used. The surrounding filter/strip
  logic in both functions is untouched, per the plan's own design principle.

**Data migration** (one-off, not committed — same throwaway-script posture as
every other real-data migration in this app): read the real
`MobilisationSettings` singleton's `viewerRoles`/`selfMobiliseRoles`
(`['BDM']` and `['MM']` respectively, the company's actual configured
roles), wrote them into the two new `SectionAccess` docs'
`allowedApprovalRoles` (folding `Coordinator` into
`mobilisationsSelfMobilise.allowedRoles` per the default above), then
`$unset` the two fields from the `MobilisationSettings` document (the schema
no longer declares them). Idempotent (upsert + unset), safe to re-run.

`MobilisationSettings` shrinks to just `officeSecretaryStaleDays` — the one
field in that singleton that isn't an access grant. `MobilisationSettingsPage`
shrinks to match (just the stale-days input, plus a pointer link to the
Section Access page); the two `PillChecklist` role editors and the
`listApprovalRoles` query they needed are gone from that page.

**Verified live** (throwaway test admin, a test Coordinator login, and a
test HR login, all `@example.com`, cleaned up after):
- Coordinator creating a mobilisation → 201 (default grant); HR → 403 (not
  granted by default).
- Admin removed `Coordinator` from `mobilisationsSelfMobilise.allowedRoles`
  → the same Coordinator login immediately got 403 on create — confirms the
  flagged behavior change is real, not just theoretical. Restored afterward.
- HR (no viewer grant) `GET` on the Coordinator's Draft mobilisation → 403.
  Admin then granted HR literal-role access via `mobilisationsViewer.
  allowedRoles` → HR still got 403 on the same Draft record (Draft stays
  excluded for every viewer, granted or not) — but successfully `GET` a real,
  pre-existing `PendingReview` mobilisation with `clientRate` (a
  `COMMERCIAL_FIELDS` member) present and unstripped, confirming a granted
  viewer sees the full record once it's past Draft. Reverted the grant
  afterward.
- `GET /api/section-access` confirmed both new keys list with the migrated
  defaults (`BDM`→viewer, `Coordinator`+`MM`→self-mobilise) both immediately
  after migration and again independently after a full cleanup pass, via a
  second fresh throwaway admin.
- Browser: `SectionAccessPage` renders both new cards with the correct
  label/description and the right pills pre-selected (checked via each
  card's actual DOM state, not just the API response); `MobilisationSettingsPage`
  renders as just the stale-days field with a working link back to Section
  Access.

All test users, employees, the throwaway mobilisation record, and their
audit-log rows were deleted afterward (the mobilisation module has no
delete-a-record endpoint, so that one record was removed via a direct,
throwaway DB script alongside the rest of the cleanup) — production data is
back to exactly its post-migration state.

## M3: financial/sensitive whole-module batch

Six new keys, each governing its whole module rather than a write-only
slice: `invoices`, `eosb`, `financialRequests`, `auditLog`,
`timesheetProcessor`, `nfc`.

- **`invoices`** (default `['Manager','Accounts']`) — GET/POST/payments all
  behind one gate; delete stays hardcoded Admin/Manager (an extra safety
  rail, same posture as Quotations). **Real behavior change, flagged up
  front**: read narrows from "any staff" to this circle — deliberate, per
  the financial-document classification.
- **`eosb`** (default `['Manager','HR','Accounts']`) — the one section that
  folds delete INTO the unified gate rather than keeping it hardcoded
  separately, unlike Invoices: EOSB's delete was already the same tier as
  create (no stricter delete-only circle existed to preserve), so nothing
  is lost by collapsing it. **Real behavior change**: Accounts gains
  create/delete rights it didn't have before — the same "one unified
  circle" collapse Payroll/Expenses already went through.
- **`financialRequests`** — see its own subsection below; this one needed a
  real design correction mid-implementation.
- **`auditLog`/`timesheetProcessor`/`nfc`** (all default `[]`) — simple
  `requireRoles('Admin')` → `requireSectionAccess(key)` swaps, functionally
  identical to today until an Admin grants someone.

### A real design flaw found and fixed: `financialRequests`

First attempt: swapped ALL SIX `requireStaffOrExecutive` occurrences on
`/api/financial-requests` (list/submit/decide for both advances and
reimbursements) to `requireSectionAccess('financialRequests')`, default
`['Manager','HR','Accounts','Executive']`. This broke a real, working
feature: the router's own doc comment explains Coordinator was always able
to reach `POST /advances` (submit) and `GET /advances` (self-scoped list)
under the original `requireStaffOrExecutive` gate — Coordinator IS a
`STAFF_ROLE` — and the Approval Hierarchy's staff self-submission work
(P2-M4+) relies on exactly that: a Coordinator submitting their own advance/
reimbursement and seeing only their own in the list. My new default
excluded Coordinator, silently blocking both. **Caught before shipping**,
not after — verified live and found the regression myself. Fixed by
reverting LIST and SUBMIT (all four: advances + reimbursements) back to
`requireStaffOrExecutive`, unchanged, and moving ONLY the two DECIDE
endpoints onto `requireSectionAccess('financialRequests')`.

That fix surfaced a second, deeper issue: DECIDE for a workflow-governed
request isn't really authorized by a static role list at all — the shared
`approvalEngine`'s `resolveStepAuthority` grants it to ANY real ApprovalRole
member on the current step, which could legitimately be a Coordinator
(exactly like the company's real Mobilisation hierarchy already allows a
Coordinator-tier role to hold a step). A Section Access floor sitting IN
FRONT of that check, if narrower than the engine's own reach, would
silently block a workflow-authorized decider before the engine ever ran —
the router would 403 first. Fixed by widening `financialRequests`'s default
to `['Manager','HR','Accounts','Coordinator','Executive']` — the FULL
original `requireStaffOrExecutive` floor, not narrowed at all. This makes
the section, by default, a genuine no-op (matching zero-regression), while
still giving an Admin a real, working lever to narrow it later if they
choose — the actual point of Section Access. `canHandleMoney` (repayments,
receipt view, marking paid) was never touched — stays its own hardcoded
Admin/Manager/HR/Accounts circle throughout.

**Lesson applied to M7 below**: before gating ANY workflow-governed
request's floor, check whether the floor sits in front of the engine's own
per-step authority check — if so, the default must match the ORIGINAL
floor's full reach, not a "sensible-looking" subset.

## M4: workforce/operational write-only batch

Six new keys, each governing only the write actions on an otherwise
read-open module: `clientsManage`, `deploymentsManage`,
`subcontractorsManage`, `attendanceManage`, `documentsManage`,
`assetsManage`.

- **`clientsManage`** (default `['Manager','Coordinator']`) — folds
  create/update/decide into one gate. Decide's floor technically widens
  from Admin/Manager to also admit Coordinator by default, but
  `client.service.js`'s own "must be THIS coordinator's manager" check
  (unrelated to this migration, untouched) still gates the actual decision
  — a low-risk widening in practice, flagged here for visibility. Delete
  stays hardcoded Admin/Manager.
- **`deploymentsManage`** (default `['Manager']`) — assign/transfer/end,
  matches the old Admin/Manager circle exactly. No delete route exists.
- **`subcontractorsManage`** (default `['Manager']`) — folds delete in too
  (same reasoning as EOSB: no stricter pre-existing delete-only tier).
- **`attendanceManage`** (default `['Manager','HR']`) — governs only
  `POST /bulk` and `PATCH /adjust`. Office-location config stays hardcoded
  Admin-only, untouched.
- **`documentsManage`** (default `['Manager','HR']`) — folds
  create/version/delete into one gate (same reasoning as EOSB/
  Subcontractors: create and delete already shared one tier).
- **`assetsManage`** (default `['Manager','HR']`) — covers
  create/update/status/assign/return (the whole `canWrite` tier). Delete
  stays hardcoded Admin/HR — a genuinely stricter pre-existing circle
  (excludes Manager), kept as the extra safety rail.

## M5: remaining batch

Four new keys: `quotationsManage`, `ramadanManage`, `team`,
`approvalHierarchy`.

- **`quotationsManage`** (default `['Manager','Accounts']`) —
  create/update/duplicate; delete stays hardcoded Admin/Manager.
- **`ramadanManage`** (default `['Manager','HR']`) — folds delete in
  (same reasoning as EOSB/Subcontractors/Documents).
- **`team`** (default `['Manager','HR']`) — governs only
  `GET /api/users` (the staff-login list). Update/reset-password/delete
  stay hardcoded Admin-only — account security management is too sensitive
  to delegate broadly, a deliberate exclusion, not an oversight.
- **`approvalHierarchy`** (default `[]`) — governs only the four
  POST/PATCH endpoints for roles and workflows. `GET /roles`/`GET
  /workflows` stay `requireStaff` (open to any staff), unchanged — many
  other pages' role-pickers read this list. The Approval Log (`/log`) is
  untouched — already dynamically gated inside its own controller.

## M6: client-side wiring pass

- **Nav `sectionKey` wiring** (`navConfig.js`) — whole-module M3 sections
  (`invoices`, `eosb`, `auditLog`, `timesheetProcessor`, `nfc`) plus `team`
  each replaced a static `roles: [...]` gate (or, for Invoices, added a gate
  where none existed) with `sectionKey: '...'`, so the nav item — and the
  hub-page card, via the same `SectionHubPage.jsx`/`DashboardLayout.jsx`
  filter — hides entirely for a non-granted viewer, same mechanism Payroll/
  Expenses already used. `approvalHierarchy`'s nav item lost its
  `roles: ['Admin']` gate entirely instead (read is open to everyone now;
  see below).
- **`ApprovalsPage.jsx`** — removed a hard `if (!APPROVALS_MANAGE_ROLES...)
  return <Navigate>` that gated the ENTIRE page (both Roles and Workflows
  tabs) behind Admin, even though the server's own read endpoints were
  already open to any staff member. Now any staff member can view the page;
  each panel (`ApprovalRolesPanel`, `ApprovalWorkflowsPanel`) independently
  checks `user.sectionAccess?.includes('approvalHierarchy')` to show/hide
  its own "Add role"/"Add workflow" button and the modal's Save button
  (non-granted viewers get "Close" only — they can still open an existing
  role/workflow to read it, just not save changes).
- **Write-only button wiring** — every M4/M5 write-only page's
  `canWrite`/`canCreate`/`canDelete` check swapped from a static role-array
  `.includes(user.role)` to `user.sectionAccess?.includes('sectionKey')`
  (`ClientListPage`, `clients.permissions.js`, `DeploymentListPage`,
  `WorkerDeploymentPanel`, `SubcontractorListPage`, `RecordsGrid`'s
  `canEdit`, `DocumentListPage`, `DocumentsPanel`, `DocumentActionsCell`,
  `AssetListPage`, `QuotationListPage`, `QuotationsPanel`,
  `QuotationViewPage`). Delete-only checks that stayed hardcoded
  server-side (Invoices, Quotations, Assets) were left as literal role
  checks client-side too, matching the server exactly.
- **Whole-module pages simplified** — `InvoiceViewPage`/
  `SettlementListPage`/`SettlementViewPage` dropped their `canWrite`/
  `canCompute`/`canDelete`(-for-the-whole-module) checks entirely: reaching
  the page at all already implies full access for a whole-module section
  (successful load ⇒ full action access), same posture as Payroll/Expenses.
  `EmployeeProfilePage`'s "Compute EOSB" button switched to
  `user.sectionAccess?.includes('eosb')`.
- **`SectionAccessPage.jsx` grouping** — ~20 sections is too many flat
  cards to scan, so they're now grouped under the same
  Workforce/Sales & Clients/Financial/Admin & Tools categories the sidebar
  itself uses (`navConfig.js`'s `NAV_GROUPS`), each collapsible via native
  `<details>`/`<summary>` (no new dependency for a one-off grouping need).
  Browser-verified: all 22 cards render under the correct category header
  with the right counts (4/6/4/8), collapse/expand works, and each card's
  pre-selected pills still match the real server data.
- **`constants.js` cleanup** — every now-dead static role-list constant
  superseded by a Section Access key was removed (`CLIENT_WRITE_ROLES`,
  `CLIENT_CREATE_ROLES`, `CLIENT_DECIDE_ROLES` — the last one was already
  dead before this pass, found in the same sweep — `DEPLOYMENT_WRITE_ROLES`,
  `SUBCONTRACTOR_WRITE_ROLES`, `SUBCONTRACTOR_DELETE_ROLES`,
  `DOCUMENT_WRITE_ROLES`, `DOCUMENT_DELETE_ROLES`, `ASSET_WRITE_ROLES`,
  `QUOTATION_WRITE_ROLES`, `INVOICE_WRITE_ROLES`, `EOSB_WRITE_ROLES`,
  `EOSB_VIEW_ROLES`, `STAFF_USER_VIEW_ROLES`, `APPROVALS_MANAGE_ROLES`,
  `FINANCIAL_REQUEST_DECIDE_ROLES` — also already dead beforehand).
  `SECTION_ACCESS_GRANTABLE_ROLES` was already correct (M1 had already
  fixed it) — confirmed against the server's `GRANTABLE_ROLES`, no change
  needed.
- **Two more real pre-existing bugs found while migrating, both fixed**:
  - `QuickActions.jsx`'s "Add employee" dashboard shortcut checked
    `EMPLOYEE_WRITE_ROLES` (Admin/Manager/HR — the EDIT circle) instead of
    the real `employeeCreate` Section Access gate (Admin only by default) —
    a shortcut that could 403 for a role the button itself invited in.
  - `RamadanPeriodsSection.jsx` checked `HOLIDAY_MANAGE_ROLES`
    (`['Admin','HR']`, the Holiday calendar's own Admin/HR-only circle) for
    its own Add/Edit/Delete buttons, instead of anything Ramadan-specific —
    Manager could always manage Ramadan periods server-side
    (`requireRoles('Admin','Manager','HR')`, unchanged by this migration)
    but the button was silently hidden from them. Both now use the correct
    section grant.

Browser-verified end-to-end with two throwaway logins (Manager, Coordinator):
Coordinator's sidebar loses the entire Financial group (none of
`invoices`/`payroll`/`expenses`/`financialRequests`'s nav gates admit them)
and loses `Team`/`Timesheet Processor`/`NFC Customers`/`Security Log` from
Admin & Tools, while `Approval Hierarchy` stays visible and read-only (its
"Add role" button confirmed absent, and opening an existing role showed
"Close" with no "Save"); Manager's sidebar shows `Invoices`, `Financial
Requests`, and `Team` (all granted), matching their real defaults exactly.
Clients' "Add client" button confirmed present for Coordinator (default
grant) with real rows visible and editable.

## M7 (optional): Leave/Timesheets/Exit-Documents zero-regression floor

Flagged in the plan as optional, shipped since it's genuinely
zero-regression and the same admin-configurability now covers every
workflow-governed request type. Three new keys — `leaveRequests`,
`timesheetRequests`, `exitDocuments` — each replacing a router-wide
`requireStaffOrExecutive` with `requireSectionAccess(key)`, default
`['Manager','HR','Accounts','Coordinator','Executive']` — the FULL original
floor, not narrowed (applying the lesson from `financialRequests` above:
these three are workflow-engine-governed request types too, so the floor
must never be narrower than `requireStaffOrExecutive` was, or it risks
blocking a legitimate engine-authorized decider). Unlike
`financialRequests`, no per-route carve-out was needed here — each of these
three routers already applied ONE uniform floor to every action (list/
submit/decide, plus bulk-approve/monthly-report for Timesheets), so
migrating the whole router's floor in one move is safe: nothing is being
narrowed relative to what already existed. `LeaveType` config
(Admin/HR-only), `acknowledge` (its own narrower Admin/Manager/HR/
Coordinator circle), and both modules' `issue`/`markIssued` actions
(Admin/Manager/HR) all stay exactly as they were — untouched, deliberately
excluded per the plan's own design principles. No client changes needed:
none of the three modules' nav items had a role gate to begin with (already
open to every staff role who reaches the hub), so the new wide-open default
changes nothing to hide or show.

Verified live: all three new keys return the exact
`requireStaffOrExecutive`-matching default; a throwaway Coordinator login
confirmed full zero-regression access to all three (list/submit on Leave,
Timesheets, and Exit Documents, none blocked); a flip test on
`leaveRequests` (narrow → Coordinator blocked with 403 → revert → access
restored) confirmed the grant is genuinely enforced, not just returned by
the API.

## Full verification summary (M3–M7)

Every milestone above was verified with real curl-equivalent checks
(a throwaway Node script per pass, using `fetch` directly against the
running dev server) against real production MongoDB, using disposable
`@example.com` test accounts created via the real employee-provisioning
API and deleted afterward — never the user's own credentials or data.
Total: 69 checks (M3–M5 combined pass) + 5 (the `financialRequests` fix)
+ 39 (a second M3–M6 pass after the fix, including a fresh independent
re-read of all 22 section defaults) + 14 (M7) = 127 passing checks across
four separate verification runs, plus the browser-based nav/button/page
checks described above. All temporary employees, logins, audit-log rows,
and section-access overrides created for testing were removed after each
pass — production data was independently re-verified back to its expected
state (not just assumed) after the final pass. `npm run build` (client)
passed cleanly after every batch of edits, with zero unused imports or
broken references across the ~35 files touched.
