# Mobilisation module

A new commercial+staffing record for placing a worker with a client
(optionally routed through a subcontractor) — the sheet coordinators
currently keep in Excel. Distinct from the existing `Deployment` record,
which only tracks worker↔client↔site with no billing data.

Full design in `docs/APPROVAL-HIERARCHY-notes.md`'s sibling plan (not yet
promoted to a notes file of its own name at planning time) — see the
in-session plan for the complete field list, workflow, and 5-milestone
breakdown. This file tracks what's actually been built, milestone by
milestone.

## M1 COMPLETE — Subcontractor CRUD + Mobilisation skeleton (Draft only)

- New module `server/src/modules/subcontractors/`: a `Subcontractor` entity
  (name/contactPerson/phone/email/status/notes) — mirrors `Client` but
  drastically simplified (no sites, no approval workflow, no VAT/CR
  numbers). Referenced by ObjectId from Mobilisation, never embedded.
  Delete is guarded by a referential-integrity count against
  `Mobilisation.subcontractor` (same pattern as `Client`'s guard against
  assigned Employees).
- New module `server/src/modules/mobilisations/`: the full `Mobilisation`
  schema is in place already (Section 1 fields, Section 2 quotation/PO
  fields, the Configurable-Approval-Hierarchy workflow fields identical in
  shape to `ReimbursementClaim`, the `coordinators[]` joint-coordinator
  array, `documents[]`) — but M1 only wires up `POST/GET/GET:id/PATCH:id`,
  every record staying `Draft`. Submit-to-review, Marketing Manager
  decide, visibility circle, self-mobilise, and documents land in M2–M5.
- Snapshot fields (`workerName`/`iqamaNumber`/`nationality`/`trade`/`phone`
  from `Employee`, `clientName` from `Client`, `subcontractorName` from
  `Subcontractor`) are captured at creation/edit time — same durable-history
  convention as `Deployment.clientName` — not live-joined on read.
- `profit` is a plain editable `Number`, never a formula-only computed
  field — the exact commission arithmetic needs a verification pass with a
  real example before any auto-calculation is trusted (same posture as
  Payroll's manually-entered GOSI).
- Access for M1: only `Coordinator` or `Admin` may create a mobilisation;
  everyone else gets a clear 403. Listing/viewing is scoped to "my own, as
  coordinator" for everyone except Admin (who sees all) — this scope only
  ever grows in M4, never needs unbuilding.
- Client: `client/src/features/subcontractors/` (list+modal, mirrors
  `ExpenseListPage`) and `client/src/features/mobilisations/` (list page,
  a shared `MobilisationForm` used by New/Edit pages — Edit also serves as
  the "view" for now, since every M1 record is a Draft). Wired into the
  Sales & Clients nav group and `router.jsx`.
- Two real bugs found and fixed during verification:
  1. The New/Edit pages' worker/client/subcontractor picker queries
     requested `limit: 200`, but every list endpoint's Zod schema caps
     `limit` at 100 — every picker 400'd. Fixed to `limit: 100`.
  2. `MobilisationForm`'s local `Checkbox` wrapper was a plain function
     component; react-hook-form's `register()` spreads a `ref` onto it,
     which React silently drops on a non-forwardRef component. Fixed with
     `React.forwardRef`.
- Verified: curl create/validate/list/get/update/wrong-role/auth-failure as
  Admin, HR (wrong role), and a real Coordinator (own-record scoping,
  including a cross-coordinator 403); full browser click-through of both
  modules as Admin (create with a subcontractor, edit, delete-blocked-by-409
  on a referenced subcontractor) and as a Coordinator (nav visibility, own
  mobilisation list). All test data (2 Employees, 1 Client, 1 Subcontractor,
  3 Mobilisations, 3 Users, refresh tokens, audit logs) deleted afterward.

## M2 COMPLETE — joint coordinators + submit

- `Mobilisation` schema's `coordinators[]` gains real endpoints: invite
  (`POST /:id/coordinators`, primary/Admin, Draft/Rejected only, target must
  be a real `Coordinator` login), remove (same gate, but only while the
  invitee is still unconfirmed — a confirmed co-coordinator has already
  vouched for the record, so undoing that is an Admin edit, not a routine
  removal), and self-confirm (`PATCH /:id/coordinators/:userId/confirm`,
  only that user, for themselves).
- `POST /:id/submit` — Draft/Rejected → PendingReview, 400 unless every
  coordinator has confirmed. Resolves the `Mobilisation` `ApprovalWorkflow`
  via `resolveApprovalWorkflow` reused completely unchanged (always falls
  through to the company-wide default — a mobilisation's `worker` is the
  subject of the placement, not the requester, so there's no per-employee
  override concept here, unlike Leave/Reimbursement). Added `'Mobilisation'`
  to `APPROVAL_REQUEST_TYPES`. A prior rejection's `approvalTrail` history is
  kept; only the terminal decision fields reset.
- New minimal endpoint `GET /api/mobilisations/coordinators` — a real access
  gap found while building the invite UI: `GET /api/users` (the general
  staff directory) is Admin/Manager/HR only, so the Coordinator who actually
  needs to invite a peer couldn't call it. Returns name-only (no email) for
  every Coordinator login, to any staff member.

## M3 COMPLETE — Marketing Manager review

- `PATCH /:id/commercial-details` — Section 2 fields (quotation/PO), gated
  by exporting and reusing the approval engine's own `resolveStepAuthority`
  (current-step-role-or-Admin), PendingReview only, does not touch status.
- `PATCH /:id/decide` — reuses `decideApprovalStep` completely unchanged
  except for one new, backward-compatible extension point:
  `decideApprovalStep` gained an optional `notifyFinal` override (default:
  `notifyEmployeeUser(doc.employee, ...)`, unchanged for every existing
  caller). Mobilisation had to supply its own — the default assumes the
  request's subject is an Employee with a login, but `Mobilisation` has no
  `employee` field at all (its `coordinators[]` are Users directly) — this
  was caught and fixed during implementation, before it ever shipped as a
  silent no-op. `legacyAllowedRoles: ['Admin']` is the same safety net every
  other request type has for before a real workflow is configured.
- Verified the full lifecycle: submit → commercial-details → approve; a
  separate reject-without-note (400) → reject-with-note (200) →
  coordinator-edits → resubmit cycle, confirming `approvalTrail` history
  survives resubmission; the Admin-safety-net decide path before any
  `Mobilisation` workflow existed.

## M4 COMPLETE — visibility circle + self-mobilise + field stripping

- New module `server/src/modules/mobilisationSettings/`: a `MobilisationSettings`
  singleton (same found-or-created pattern as `CompanySettings`) holding
  `viewerRoles` and `selfMobiliseRoles` — both `ApprovalRole` reference
  arrays, admin-configurable via a new `MobilisationSettingsPage` (Admin
  only), reusing the existing Approval Hierarchy's roles rather than
  inventing a new role concept.
- `viewerRoles` deliberately does NOT reuse the generic "any ApprovalRole
  member" check (`isApprovalRoleMember`, used by the Approval Log) — the
  org's real hierarchy has roles (e.g. HR) that sit elsewhere in the
  Approval Hierarchy but were explicitly excluded from mobilisation
  visibility. Added `isMemberOfAnyRole(userId, roleIds)` to
  `approvals.service.js` instead — a subset check, reused for both
  `viewerRoles` and `selfMobiliseRoles`.
- Visibility: a viewer-role member sees a mobilisation once it's past Draft
  (BDM's immediate "read on version" on submit) with full fields; the
  current step's reviewer (e.g. Marketing Manager) also sees it in full
  while PendingReview even before being added to `viewerRoles`. A plain
  Coordinator only ever sees their own (any status); the response has its
  12 commercial fields (rates, commission, profit, quotation/PO) stripped
  entirely once `status === 'Approved'` — verified as an actual absent key,
  not a null/zeroed value, in both the API response and the browser (the
  "Marketing Manager Review" card simply doesn't render for a Coordinator
  viewing their own Approved record).
- `createMobilisation`'s gate extended: Admin or Coordinator (unchanged from
  M1) or a `selfMobiliseRoles` member — verified a BDM-role test user
  self-mobilising directly.
- `annotateCanDecide` (already built for Leave/Reimbursement/etc.) reused
  for both `listMobilisations` and `getMobilisation`, giving the client a
  real `canDecideCurrentStep` flag instead of duplicating the engine's
  authorization logic in the UI.

## M5 COMPLETE — documents

- `server/src/middleware/upload.js` gained `uploadMultiple` (up to 10 files,
  field name `files`) alongside the existing `uploadSingle` — the first
  `.array()` upload in this codebase, reusing every piece of the existing
  private/authenticated Cloudinary pipeline (`verifyContent` content-
  signature checking, `uploadBuffer`, `ALLOWED_TYPES`) unchanged.
- `POST /:id/documents` (multipart, `files` + `category`), `DELETE
  /:id/documents/:fileId`, `GET /:id/documents/:fileId/file` (streams
  bytes, same signed-URL-fetched-server-side-only pattern as reimbursement
  receipts). Upload/delete blocked once `Approved` — a document needed
  after that point is an Admin edit, not a routine attachment.
- Verified: multi-file upload, a signature-mismatch file correctly rejected
  (bytes don't match the declared PDF type), byte-exact download, delete
  (Cloudinary file actually destroyed, not just unlinked from the array),
  and the Approved-blocks-upload rule.

## Client-side (all milestones)

- `client/src/features/mobilisations/pages/MobilisationDetailPage.jsx` —
  the workhorse: Section 1 read-only display (commercial fields are simply
  absent from what the API returned for a stripped Coordinator — no
  client-side hiding logic needed), the coordinator confirm/invite/remove/
  submit flow, the reused `ApprovalTrailView`, the Marketing Manager's
  Section 2 form + Approve/Reject (a `Modal`, not `ConfirmDialog` — the
  latter hardcodes a red "Delete" button and renders its message inside a
  `<p>`, wrong for a non-destructive Approve action and invalid for nesting
  a Textarea), and document upload/list/download. A real bug caught during
  build (not just review): the Section-2 form's `useForm` was originally
  called before the page's loading guard, so `defaultValues` would have
  frozen at `undefined` from the first (loading) render and never
  repopulated — fixed by extracting `CommercialDetailsCard` as its own
  component, mounted only once real data exists, matching every other
  form in this codebase (`MobilisationForm`, `DeploymentForm`, etc.).
- `client/src/features/mobilisationSettings/` — the settings page, two
  `ApprovalRole` checklists mirroring `ApprovalsPage`'s existing
  member-checkbox pattern.
- List page's row-click/View now goes to the detail page; Edit page is
  Section-1-only, reachable from the detail page, Draft/Rejected only.

Verified end-to-end in the browser as five real roles simultaneously
(Admin, two Coordinators, a BDM-role user, a Marketing-Manager-role user):
create → invite co-coordinator → confirm → submit → commercial-details →
approve → coordinator's stripped view → BDM's full read-only view → self-
mobilise. All test data (5 Employees, 1 Client, 1 Subcontractor, 6
Mobilisations, 5 Users, 2 ApprovalRoles, 1 ApprovalWorkflow, 1
MobilisationSettings doc, refresh tokens, audit logs, notifications)
deleted afterward.

## Follow-up (2026-09-05): a submitted mobilisation had nowhere to go

A user asked, about a real mobilisation they'd just submitted for review,
"where does this go?" Traced it and found the answer was "nowhere useful":
`mobilisation.service.js`'s `submitMobilisation()` correctly calls
`resolveApprovalWorkflow(..., 'Mobilisation')` to find a configured
workflow and, if one exists, notifies its first step's role members — this
part was always correct. But `server/src/modules/approvals/
approvalWorkflow.model.js`'s `APPROVAL_REQUEST_TYPES` already included
`'Mobilisation'` (added when this module shipped) while its client-side
mirror, `client/src/lib/constants.js`'s `APPROVAL_REQUEST_TYPES`, did not.
The Approval Hierarchy page's "which request types does this workflow
apply to" checklist is built from that client constant — so an Admin could
never actually select Mobilisation there, no matter how they configured
things. With no workflow ever assignable, every mobilisation silently fell
back to `decideApprovalStep`'s legacy path with `legacyAllowedRoles:
['Admin']` — meaning only Admin could approve/reject it, and, since the
notify step only runs `if (workflow)`, **nobody was ever notified that a
mobilisation needed review at all**.

Fixed by adding `'Mobilisation'` to the client's `APPROVAL_REQUEST_TYPES`
and `APPROVAL_REQUEST_TYPE_LABELS` — no server change needed, since the
server-side enum, the workflow-resolution logic, and the notification call
were already correct and had been since the module shipped. Verified live
against the real database: the "Add workflow" modal's request-type
checklist now offers Mobilisation alongside Leave/Salary Advance/
Reimbursement/Timesheet. Whether to actually configure a workflow for
Mobilisation (and which role(s) — Marketing Manager was the module's
original design intent) is the user's own call, not made here.

## Follow-up (2026-09-05): multi-document upload was already built

Separately reported as missing via a screenshot showing one file selected
next to a "Choose files" button. Traced the full pipeline — client
`<input type="file" multiple>`, `onChange={(e) => setFiles([...e.target.
files])}`, `uploadMobilisationDocuments()` appending every file under the
same `files` FormData key, the server route's `uploadMultiple` middleware,
`addDocuments` controller — and confirmed it was already fully built and
working; the screenshot just showed a single file because only one had
been selected (holding Ctrl/Cmd or Shift in the OS file picker selects
several at once, same as any native multi-select file input). Verified
live: attached two real files to a real mobilisation's document list in
one request, confirmed the server stored both in one response, then
removed the test files.
