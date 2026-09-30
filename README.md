# Valizent CRM — Al Jazeera

Internal ERP for a manpower supply & trading company: employees, clients,
deployments/mobilisations, attendance, documents, quotations/invoices,
payroll, leave, financial requests, and a management dashboard, plus a
separate self-service (ESS) portal for workers.

**Read [`CLAUDE.md`](CLAUDE.md) first** — it's the project's source of truth
(architecture decisions, hard rules, security requirements, and a full
feature-by-feature status log). Then `docs/` for the how-and-why behind each
module.

## Repository layout — read this carefully

This folder is a convenience checkout, not itself the authoritative repo for
either app. There are **three separate git repos** involved:

```
Al Jazeera CRM/            ← this folder (repo: Tech-Jazeera) — kept as a
├── client/                  single local checkout for easy cross-app
│   └── .git/                searching/reading; NOT synced automatically
├── server/                  with the two repos below, and not connected to
│   └── .git/                any deployment. New joiners: ask about this.
├── docs/
└── CLAUDE.md
```

- **`client/`** is its own independent git repo, `Tech-Jazeera-Frontend`,
  deployed via Cloudflare Pages' own git integration.
- **`server/`** is its own independent git repo, `Tech-Jazeera-Backend`,
  deployed via GitHub Actions to a company-owned Oracle VM.
- **This root folder** is a third, separate repo (`Tech-Jazeera`) with its
  own full copy of both apps' files (not a submodule link) — genuinely
  useful as one place to check out both apps together, but its own git
  history is not the source of truth for either app's code and isn't kept
  in lockstep automatically. Real work happens inside `client/`'s and
  `server/`'s own repos, each on its own `development`/`main` branches.

`CLAUDE.md` and `docs/` are kept identical across all three locations
(this root folder, `server/`, `client/`) — update all three when either
changes. Each of the three has its **own** `README.md` (this file describes
the combined checkout; `server/README.md` and `client/README.md` each
describe just that one app's setup).

## Prerequisites

- Node.js ≥ 20.6 (built with 22.x)
- A MongoDB Atlas cluster

## Quick start

Backend first (see `server/README.md` for the full setup, env vars, and
first-login steps):

```bash
cd server
npm install
copy .env.example .env    # macOS/Linux: cp .env.example .env
# fill in server/.env, then:
npm run dev
```

Then the frontend (see `client/README.md` for env overrides, build, and the
Android app):

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173.
