# Company ERP — Manpower Supply & Trading

Internal ERP for daily operations: employees, clients, deployments, attendance,
documents, quotations, and a management dashboard.

**Stack:** React 18 + Vite + Tailwind (client) · Node.js + Express + MongoDB/Mongoose (server) · JWT auth with refresh rotation.

## Repository layout

```
company-erp/
├── client/   # React app (from M3)
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

## Documentation

Each milestone writes `docs/M<N>-notes.md` explaining how that slice works,
how to modify it, and common mistakes. Start with `docs/M1-notes.md`.
