# NFC Customers — developer notes

An **Admin-only** directory, separate from Clients: a register of customer
**companies** and the **people** under each, where every person can hold a unique
**NFC card**. Full CRUD on both. Isolated module, its own collections, no link to
the existing Clients/Employees.

## What was built

**Backend** (`server/src/modules/nfc/`)
```
nfcCompany.model.js    # company record
nfcEmployee.model.js   # person under a company; partial-unique NFC card index
nfc.validation.js      # Zod: company + employee create/update, id param, list
nfc.service.js         # CRUD for both; card-uniqueness pre-check; cascade delete
nfc.controller.js      # thin HTTP
nfc.routes.js          # Admin-only; /companies and /employees
```
Mounted with one additive line in `app.js` at `/api/nfc`.

**Frontend** (`client/src/features/nfc/`)
```
nfc.api.js / nfc.schema.js
components/NfcCompanyFormModal.jsx    # add / edit company
components/NfcEmployeeFormModal.jsx    # add / edit person (NFC card headline field)
pages/NfcCompanyListPage.jsx           # searchable directory, row-click to a company
pages/NfcCompanyProfilePage.jsx        # company details + its people (full CRUD)
```
Plus two routes in `router.jsx` and an Admin-only "NFC Customers" nav item.

## API (all Admin-only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/nfc/companies?search` | list companies (+ employeeCount) |
| POST | `/api/nfc/companies` | create company |
| GET | `/api/nfc/companies/:id` | company + its employees |
| PATCH | `/api/nfc/companies/:id` | update company |
| DELETE | `/api/nfc/companies/:id` | delete company (**cascades** its people) |
| POST | `/api/nfc/employees` | add a person to a company |
| PATCH | `/api/nfc/employees/:id` | update a person |
| DELETE | `/api/nfc/employees/:id` | remove a person |

## Key decisions & why

- **Separate collections, separate module.** NFC customers are a distinct book
  from the manpower-supply Clients, so they get their own `NfcCompany` /
  `NfcEmployee` models and never touch the existing Client/Employee data.
- **NFC card is uniquely held.** A partial unique index on `nfcCardNumber` (only
  real string values) stops one card being assigned to two people; the service
  also pre-checks for a friendly "already assigned" 409. People with no card
  store the field as **absent** (validation maps "" → undefined) so they never
  collide.
- **Reference, not embed.** People reference their company, so each has its own
  CRUD; a company page fetches company + its people in one call. Deleting a
  company **cascades** to its people.
- **Admin-only**, enforced server-side (`requireRoles('Admin')`), with the nav
  item hidden and a client-side redirect for stray direct visits.
- **Fields (simple, per request):** company = name, contact, phone, email, city,
  notes; person = name, NFC card number, designation, phone, ID/Iqama, notes.

## Verified (2026-08-06)

**curl** (throwaway admin, cleaned up): create company · list with employeeCount ·
add person with card · **duplicate card → 409** · bad company → 404 · missing
name → 400 · get company with employees · update person · **delete company
cascades** its people · no auth → 401.

**Browser:** Admin-only nav item · directory empty state → **Add company** modal →
company row · open company → **Add person** modal (NFC card field) → person listed
with the card mono-styled · Edit/Delete on both · no functional console errors.
