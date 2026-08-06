# NFC Customers — developer notes (Phase A)

An **Admin-only** NFC digital-business-card platform: companies and their people,
a physical **card inventory** (tokens, batches, assignment lifecycle, history),
and a **public server-rendered tap page** per active card. Separate from the
Client/Employee modules. Phase A ships the core + the trial workflow; analytics,
CSV import, wallet passes, i18n, and lead capture are later phases.

## Data model (`server/src/modules/nfc/`)
```
nfcCompany.model.js     # name, contact, phone, email, website, address, mapLink, city, brandColour
nfcEmployee.model.js    # company ref; name, jobTitle, phone, whatsapp, email, linkedin, bio, idNumber
nfcCard.model.js        # token (unique), chipUid (partial-unique), batch, status, employee/company, assignedAt
nfcBatch.model.js       # label, note, count, createdBy  (a run of blank cards)
nfcAssignment.model.js  # card, employee, company, assignedAt, unassignedAt  (full history; open row = current)
```
Statuses: `unassigned | active | lost | returned | disabled`.

## Public tap page (server-rendered, NOT the SPA)
- `GET /c/:token` → mobile HTML (Express, `nfc.publicPage.js`): brand-colour
  accent, tappable Call/WhatsApp/Email/Website/LinkedIn/Location rows, one-tap
  **Save Contact**, `noindex`, Open Graph tags. Server-rendered so crawlers get
  OG/`noindex` without running JS.
- `GET /c/:token/vcard` → vCard 3.0 (`nfc.vcard.js`), CRLF + escaped, iOS-safe.
- Mounted at `/c` (own rate limiter `publicCardLimiter`, no auth), before the 404.
- **Card URLs** use `env.publicBaseUrl` (`PUBLIC_BASE_URL`, default the local API
  origin) so QR/CSV/tap links point at the right host.

## Admin API (`/api/nfc`, Admin only)
Companies + people CRUD; `POST /batches` (generate N blank cards),
`GET /batches`, `GET /batches/:id/cards.csv`; `GET /cards` (search + status +
company filters), `GET /cards/:id`, `PATCH /cards/:id` (chipUid),
`GET /cards/:id/qr.png`, and lifecycle POSTs `assign` / `unassign` / `lost` /
`return` / `disable` / `rotate`.

## Security & privacy (built in)
- **Random 12-char base62 tokens** (`nfc.token.js`), never derived from a name.
- **Identical information-free 404** for unknown / inactive / lost / unassigned /
  rotated-away tokens — a scanner can't tell them apart.
- **Whitelisted fields only** in the public payload/vCard (no ids, no internal
  fields like idNumber/notes).
- **Rate limiting** on `/c/*`; token format pre-checked before any DB hit.
- Lifecycle is effectively atomic: assign closes the prior open assignment first
  (reassign is one step); lost/rotate kill the URL immediately.

## Key decisions
- **Cards are inventory, not a field on a person** — one card ↔ (at most) one
  person at a time, with full history, so lost/rotate/reassign are first-class.
- **Deleting a company/person frees their cards** back to `unassigned` (physical
  cards aren't destroyed), and closes their assignment history rows.
- **QR** via the `qrcode` dependency (encoding QR by hand is infeasible; it's the
  standard).
- **Map** = an address (opens a Maps search) or an explicit `mapLink`.

## Tap-page design (premium "foil-and-stock")
`nfc.publicPage.js` renders a mobile-first business card: a foil-stamp loader,
the card rising with a sheen sweep, staggered actions, pointer-tilt (desktop),
a faint dot pattern + grain, and a serif name. **Adaptive per brand**: the
treatment (dark stock vs light ivory stock) is chosen from the brand colour's
luminance so the colour always reads; the accent is contrast-nudged with
`color-mix`. `prefers-reduced-motion` disables the motion.

**Images** (`nfc.upload.js`): company **logo** and person **photo** upload
(PNG/JPG/WEBP ≤ 2 MB, random-named on disk under `UPLOAD_DIR/nfc`), served
publicly at `/nfc-media/<file>` (basename-guarded, cached). URLs are returned as
`logoUrl`/`photoUrl`; the photo also becomes the page's `og:image` for rich link
previews. Replacing/removing/deleting cleans up the old file.

## Admin UI (`client/src/features/nfc/`)
Companies list (`/nfc`) → company profile (`/nfc/:id`, brand + people + assign) ·
card inventory (`/nfc/cards`, filters + generate batch) → card detail
(`/nfc/cards/:id`, URL + QR + status + history + lifecycle). Assignment is done
from a person's page; card detail manages an existing card.

## Verified (2026-08-06)
curl end-to-end: company (brand colour) → person (all fields) → **batch of 10** →
assign → **public page 200** (name/title/brand/`noindex`) → **vCard** (valid 3.0)
→ **QR PNG** → **CSV** → rotate (old URL 404, new 200) → mark lost (404) →
assign-to-lost **400** → unassign (404) → reassign (history grows, one active).
Identical 404 for unknown tokens; admin 401 without auth. Browser: cards
inventory, card detail (QR/actions/history), company profile. All test data wiped.

## Later phases (not built)
B: analytics (views/saves/clicks, country via GeoIP). C: CSV import, card-request
workflow, expiry auto-disable, audit-log surfacing, Arabic/English, Wallet passes
(need Apple/Google certs), lead capture.
