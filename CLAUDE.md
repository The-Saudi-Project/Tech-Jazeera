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
/ jsonwebtoken / cookie-parser. No component libraries (Tailwind only).

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

Roles: `Admin, Manager, HR, Operations, Accounts, Viewer` (Phase 2 adds
`Worker`). Per-module write/delete guards live in `client/src/lib/constants.js`
(UI hint) and are enforced server-side (truth).

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

**Phase 2 — planned in `docs/PHASE2-PLAN.md`**: worker accounts + self-service
portal, timesheets + approval, payroll + payslips, invoices + payments,
expenses, and a real profit dashboard. Same stack, same rules, same discipline.

- **P2-M1 COMPLETE** — worker accounts & account linking: `Worker` role,
  `User.employee` link (partial unique index), `requireStaff` locking all admin
  modules against Workers, admin-only login provisioning (temp password surfaced
  once), and a staff-only web gate. Web ESS portal + the reusable ownership-guard
  middleware are P2-M2. See `docs/P2-M1-notes.md`.
