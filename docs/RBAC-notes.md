# RBAC tightening: Leave/Holiday policy off Manager + a new Executive role

Prompted by the user reviewing their own real usage: "why does the Manager
have Leave Type configuration — that's the Admin's job." Pulling that thread
across the whole app surfaced a bigger pattern, not a one-off mistake:
`Manager` is the **only** fixed role broad enough to fit a BDM, GM, COO,
Marketing Manager, or Finance Manager — none of those titles exist as their
own `User.role`. Since `Manager` sits in nearly every module's write-role
array (Employees, Clients, Deployments, Quotations, Invoices, Expenses,
Assets, Documents, Payroll, EOSB…), anyone with one of those titles inherited
near-Admin-level company-wide CRUD by default, whether their actual job
needed it or not. This work does two things about it: moves genuine
*policy configuration* off Manager, and gives senior leadership (GM/COO) a
role shaped like what they actually do — see data, approve what's already
routed to them, touch nothing else.

## Part 1 — Leave Type & Holiday config: Admin/HR only

Small, mechanical, no new concepts:

```
server/src/modules/leave/leave.routes.js      # POST/PATCH /leave-types: Admin,Manager → Admin,HR
server/src/modules/holidays/holiday.routes.js # POST/PATCH/DELETE /: Admin,Manager,HR → Admin,HR
client/src/lib/constants.js                   # LEAVE_TYPE_MANAGE_ROLES, HOLIDAY_MANAGE_ROLES mirrored
```

Deciding a leave request (`LEAVE_DECIDE_ROLES`) is untouched — that's the
operational job a Manager/Coordinator actually does day to day. Only
*defining new leave categories and the company calendar* moved, since
neither is something an operational manager should need to invent.

## Part 2 — the `Executive` role

### The core design decision: deny-by-default, not opt-out

Every existing role except Worker/Staff is `STAFF_ROLES` — one array,
subtracted from `ROLES`, that every CRUD module's `router.use(requireStaff)`
trusts completely. That's exactly the mechanism that let Manager's access
grow unchecked: a module that forgets to narrow itself is wide open to
`STAFF_ROLES` by default. `Executive` deliberately inverts this:

- **Excluded from `STAFF_ROLES`** (`server/src/middleware/rbac.js`) — so
  every CRUD module rejects it with zero extra code, by construction. A
  future module that adds `router.use(requireStaff)` and forgets Executive
  entirely still does the right thing automatically.
- **Explicitly allow-listed**, one route at a time, via a new
  `requireStaffOrExecutive` — only where an Executive actually belongs:
  the Dashboard, and the list/submit/decide endpoints of Leave, Timesheet,
  Salary Advance, and Reimbursement (the four types the Configurable
  Approval Hierarchy governs), plus the Approval Log.

### Why letting Executive through those gates is still safe

`requireStaffOrExecutive` only answers "can this login knock on this door."
*What happens once they're in* is unchanged: `decideApprovalStep`
(`approvalEngine.service.js`) re-checks real `ApprovalRole` membership for
every single decide call, regardless of who cleared the router. An
Executive with no membership on a workflow's current step gets the exact
same 403 ("You are not an approver for the current step of this request.")
anyone else would — confirmed live against a real workflow during
verification (see below). This is what makes the router-wide `requireStaff`
→ `requireStaffOrExecutive` swap safe for Timesheet's whole router (which
also covers `/bulk-approve` and `/monthly-report`) without auditing every
sub-route individually: the real gate was never the router in the first
place.

Money-handling actions — advance repayments, marking a reimbursement paid,
downloading a receipt — deliberately keep their original
`Admin/Manager/HR/Accounts`-only gate (`canHandleMoney` in
`financialRequests.routes.js`). Deciding whether to approve something and
actually handling the cash it releases are different levels of access, and
Executive only ever gets the first one.

### What was deliberately left out of this pass

- **Mobilisation** — its whole router is one `router.use(requireStaff)`
  covering create/edit/decide together (no per-route split today), so
  giving Executive read+decide without also opening create/edit would need
  restructuring that router first. Not done here; a reasonable follow-up if
  Executive needs to sit in a Mobilisation approval chain.
- **Client decide** — never part of the Configurable Approval Hierarchy to
  begin with (hardcoded `Admin`/`Manager` only, no `ApprovalRole` check at
  all). Unrelated to this change; would need its own bespoke gate.

### The client side: an "opt-in" nav, not another `roles` filter

`DashboardLayout`'s sidebar (`navConfig.js` + `NAV_GROUPS`) treats a nav item
with no `roles` array as visible to *anyone* who reaches the shell — which
is exactly how a Manager ends up seeing almost the whole app. Adding
Executive to a `roles` array here and there would still leak every one of
those unguarded items (Clients, Deployments, Quotations, Documents, Assets,
Approval Log…) for free. Instead, `Sidebar()` (`DashboardLayout.jsx`)
special-cases `user.role === 'Executive'` entirely and renders a short, flat,
explicitly-defined list (`EXECUTIVE_NAV_ITEMS` in `navConfig.js`): Leave,
Timesheets, Financial Requests, Approval Log — no hub pages to drill into,
nothing to opt out of. `router.jsx`'s Worker/Staff-only `SELF_SERVICE_ROLES`
check needed no change — Executive was never in it, so it already falls
through to the normal `DashboardLayout` shell (not the ESS portal), which is
what makes company-wide Dashboard visibility work at all.

Each of the four pages Executive can reach behaves correctly with zero
page-level changes: `LeaveTypesPanel` is already gated by
`LEAVE_TYPE_MANAGE_ROLES` (Admin/HR, Executive excluded); the "submit your
own request" panels on Leave/Timesheet/Advance/Reimbursement are gated by
`user.role !== 'Admin'`, so Executive gets it (they're a real Employee, so
they can request their own leave — deliberately allowed, a person
self-referentially requesting isn't the CRUD/config access this change is
about restricting); `canDecideCurrentStep` (server-computed, per
`annotateCanDecide`) simply comes back `false` on every row until an Admin
actually puts them in an `ApprovalRole`, so no Approve/Reject buttons render
— matching "just sees data" until the org chart says otherwise.

### Provisioning an Executive login

`EMPLOYEE_LOGIN_ROLES` (`client/src/lib/constants.js`) now includes
`'Executive'`, so it's selectable from an Employee profile's login panel
exactly like Manager/HR/Accounts/Coordinator. Server-side
`EMPLOYEE_LOGIN_ROLES` (`employee.validation.js`) is derived from `ROLES`
automatically and needed no change.

## Part 3 — "are you sure?" on every decide action

`components/shared/ConfirmDialog.jsx` gained an optional `confirmVariant`
prop (default `'danger'`, so every existing delete-confirmation call site is
unaffected) — Approve now renders it as `'primary'` so the button doesn't
look like a destructive red action. Wired into all four review queues'
Approve/Reject buttons (Leave, Timesheet — including its bulk-approve
action, Salary Advance, Reimbursement), each with a specific message naming
the request being decided. This was a real, pre-existing gap: every decide
button fired its mutation immediately on click, for every role, with no
confirmation at all — not just an Executive-specific precaution.

## Verified (2026-09-05)

**Build**: `npm run build` clean, client and server syntax-checked.

**curl, live against real data** (throwaway Admin + a throwaway Executive +
a throwaway Manager, all deleted after): Executive got 403 on
`GET /employees` and `GET /clients` (deny-by-default confirmed) but 200 on
`GET /dashboard`, `GET /leave`, `GET /timesheets`,
`GET /financial-requests/{advances,reimbursements}` (the explicit allow-list
confirmed); 403 on `POST /financial-requests/advances/:id/repayments`,
`PATCH .../reimbursements/:id/pay`, and the receipt download (money-handling
correctly excluded). Executive successfully submitted their own leave
request into a real configured 3-step workflow (HR→BDM→Management), then
correctly got 403 ("You are not an approver for the current step of this
request") attempting to decide it themselves — proving the router-level
allow-list and the engine's real per-item authorization are independent
layers, not one relying on the other. Separately, Manager got 403 creating
a Leave Type and a Holiday (previously 201); Admin still succeeded at both.

**Browser** (same throwaway accounts): logged in as Executive — sidebar
showed exactly Dashboard/Leave/Timesheets/Financial Requests/Approval Log,
nothing else; the Leave page showed no Leave Types panel, showed the
"submit your own request" panel, and showed zero Approve/Reject buttons
(no ApprovalRole membership yet) on a page listing requests company-wide.
Logged in as Admin on the same data — clicking Approve on the Executive's
own pending request opened the confirmation dialog with the correct
specific wording and a primary-styled (not red) Approve button; Cancel
closed it without deciding anything.

**Cleanup**: every throwaway user (Admin/Executive/Manager), employee, leave
request, test leave type, and the real HR-role notifications the test
submissions generated were all removed after verification; no scratch
scripts remain in the repo.

## Not done / deliberately out of scope

- Mobilisation and Client decide flows (see "What was deliberately left out"
  above) — flagged as follow-ups, not silently dropped.
- No further role-splitting (separate BDM/Marketing-Manager/Finance-Manager
  roles) — the user's ask was specifically the Leave Type-style leakage and
  a GM/COO-shaped role; Manager's remaining operational access (Clients,
  Deployments, Quotations, Payroll, Invoices, Assets, deciding requests)
  was reviewed and judged genuinely needed, not further clutter.
