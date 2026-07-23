# Company ERP — Manpower Supply & Trading

Internal ERP for daily operations: employees, clients, deployments, attendance,
documents, quotations, and a management dashboard.

**Stack:** React 18 + Vite + Tailwind (client) · Node.js + Express + MongoDB/Mongoose (server) · JWT auth with refresh rotation.

## Repository layout

```
company-erp/
├── client/   # React app (Vite + Tailwind)
├── server/   # Express API
└── docs/     # per-milestone developer notes — read these to learn the system
```

## Prerequisites

- Node.js ≥ 20.6 (built with 22.x)
- A MongoDB Atlas cluster (free tier is fine)

## Server setup

```bash
cd server
npm install
copy .env.example .env    # macOS/Linux: cp .env.example .env
```

Open `server/.env` and fill in every variable — the server validates them at
boot and refuses to start otherwise. See `docs/M1-notes.md` for a step-by-step
guide to getting a MongoDB Atlas URI.

Run it:

```bash
npm run dev     # auto-restarts on file changes
```

Check it's alive: open http://localhost:5000/api/health — you should see
`{ "success": true, ... "database": "connected" }`.

## First login

Create (or reset) the Admin account, then log in with it:

```bash
npm run seed:admin -- you@company.com YourStrongPassword "Your Name"
```

Auth endpoints: `POST /api/auth/login` `{ email, password }` →
`{ user, accessToken }` + httpOnly refresh cookie; `POST /api/auth/refresh`;
`POST /api/auth/logout`. Roles: Admin, Manager, HR, Operations, Accounts,
Viewer. See `docs/M2-notes.md` for the full token flow.

## Client setup

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 and sign in with the seeded admin account. The
client expects the API at `http://localhost:5000/api`; override with
`VITE_API_URL` in `client/.env` when deploying. Both servers must run
together during development (two terminals).

## Modules

- **Employees** (`/employees`) — workforce register: full CRUD, search,
  status & expiring-document filters, sortable list, pagination, per-employee
  profile with passport/visa/iqama/medical/licence expiry tracking. Write
  access: Admin/Manager/HR; delete: Admin/HR. See `docs/M4-notes.md`.
- **Clients** (`/clients`) — customer register: company/contact/VAT/CR/
  industry/notes, a dynamic list of sites, and a tabbed profile (Overview +
  live Assigned-Workers). Delete is guarded against clients with assigned
  workers. Write: Admin/Manager/Operations; delete: Admin/Manager. See
  `docs/M5-notes.md`.
- **Deployments** (`/deployments`) — place workers at client sites: assign,
  transfer, and unassign, with full history. A partial-unique index guarantees
  a worker is never actively deployed in two places at once, and each
  operation is transactional. Managed from the register and each worker's
  profile. Write: Admin/Manager/Operations. See `docs/M6-notes.md`.
- **Attendance** (`/attendance`) — daily marking, a weekly/monthly grid, and
  per-worker summaries with **Excel/PDF export** (generated server-side via
  exceljs/pdfkit). One record per worker per day (upsert). Mark: Admin/
  Manager/HR/Operations; read/export: all. See `docs/M7-notes.md`.
- **Documents** (`/documents`) — upload files against employees and clients
  with categories, expiry dates, version history, inline preview, download,
  and search. Files stored on disk at `UPLOAD_DIR`; served authenticated.
  Upload: Admin/Manager/HR/Operations; delete: Admin/Manager/HR. See
  `docs/M8-notes.md`.
- **Quotations** (`/quotations`) — labour/trading line items with per-line
  discount and tax, **server-computed** totals, Draft/Approved/Rejected
  statuses, duplicate, and PDF generation. Sequential numbers via an atomic
  counter. Write: Admin/Manager/Accounts; delete: Admin/Manager. See
  `docs/M9-notes.md`.
- **Dashboard** (`/`) — a management overview aggregating every module in one
  endpoint: headline stats, a finance summary, workforce/quotation
  breakdowns, expiring-document alerts, recent activity from the audit log,
  and role-aware quick actions. Available to all signed-in users. See
  `docs/M10-notes.md`.

## Documentation

Each milestone writes `docs/M<N>-notes.md` explaining how that slice works,
how to modify it, and common mistakes. Start with `docs/M1-notes.md`.
