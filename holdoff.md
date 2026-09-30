# Holdoff list — things decided/discussed but deliberately not built yet

Personal tracking file, not project documentation (same category as
`CONTINUE-PROMPT.md`) — lives at repo root only, not synced into
`server/docs/`or `client/docs/`. Check this at the start of a session if
picking up "what's next."

---

## 1. Cloudinary → Oracle Cloud Object Storage migration

**Status (2026-09-26): decision made, nothing built. Blocked on the user
gathering real OCI credentials — Claude cannot invent these.**

**Why:** Cloudinary is US-hosted; this app stores Iqama copies and other
worker documents, which raises a PDPL/Saudi-residency concern (same reasoning
that already drove the production DB and backend VM into the Riyadh/Jeddah
region — see the `production-infrastructure` memory).

**Decided:**
- Target: **Oracle Cloud Object Storage**, region **Saudi Arabia West
  (Jeddah)**, `me-jeddah-1` — the user already runs the prod VM there
  (Always Free tier confirmed active, home region Jeddah).
- Ruled out **Cloudflare R2** (cheap, S3-compatible, but no confirmed Saudi
  jurisdiction).
- Ruled out **OneDrive** (fragile auth model, and archiving Iqama data there
  reintroduces the same residency problem).
- Delivered a stakeholder PDF earlier (cost table, why-not-R2, why-not-
  Cloudinary, overage costs, OneDrive-archival option flagged as reintroducing
  residency risk) — that PDF was built in a scratchpad and is gone; rebuild
  from this file's numbers if needed again, don't re-derive the analysis.

**4-phase scope (agreed, not started):**
- **Phase 1** — new `server/src/config/oci.js` + rewrite the internals of
  `server/src/middleware/upload.js` only: `uploadSingle`/`uploadMultiple` →
  OCI `putObject`, `signedDownloadUrl` → an OCI Pre-Authenticated Request,
  `destroyDocumentFile` → `deleteObject`. The 11 calling modules stay
  untouched — they only ever call these 4 functions. Also set bucket
  Lifecycle Rules (Standard → IA → Archive aging) — console config, no code.
- **Phase 2** — verify against a test bucket: curl happy path + auth-fail +
  role-fail, plus a browser click-through.
- **Phase 3** — one-time migration script: pull each existing file from
  Cloudinary via its signed URL, push to OCI, update the DB record's file
  reference, verify before touching the original. Keep Cloudinary live for a
  30-day safety window.
- **Phase 4** — cutover production, decommission Cloudinary after the window.

**Important scope finding (2026-09-26, verified by reading the code):** THREE
separate Cloudinary integrations sit outside this migration entirely, each
with its own standalone `CloudinaryStorage` instance that never goes through
`middleware/upload.js` — so Phases 1-4 above never touch any of them:
- NFC card logos/photos (`server/src/modules/nfc/nfc.upload.js`)
- User avatars (`server/src/modules/auth/avatar.upload.js`)
- Company logo (`server/src/modules/companySettings/logo.upload.js`,
  `CompanySettings.logoUrl`) — used two ways: a plain `<img src>` on the
  public branding endpoint (login screen/sidebar, zero risk either way), AND
  a **live server-side `fetch(logoUrl)`** on every single PDF generation
  (Invoice/Quotation/Settlement/Certificate/Payslip — see
  `companySettings.service.js`'s `getLogoForEmbedding()`) to embed the actual
  image bytes via pdfkit. Degrades gracefully on failure (skips the logo
  band, doesn't crash), but this is a real ongoing server-side dependency on
  Cloudinary staying reachable — more consequential to eventually leave
  behind than NFC/avatars, which are just browser `<img>` tags.

Consequences:
- **Zero risk to production's real, already-printed NFC cards/QR codes** —
  confirmed the printed URL is `env.publicBaseUrl + '/c/' + token` (this
  app's own domain + a token, see `nfc.service.js:20`), never a raw
  Cloudinary URL. The public profile page looks up the card by token and
  renders whatever logo/photo URL is *currently* stored on that DB record —
  so even a future NFC-media migration would need zero reprinting, just a
  script updating the stored URL.
- **"Decommission Cloudinary" (Phase 4) as originally scoped is incomplete**
  if the real end goal is leaving Cloudinary entirely — NFC media, avatars,
  AND the company logo would all still be there. That's a separate decision:
  Iqama/passport documents (the Documents pipeline) are the actual
  PDPL-residency concern; NFC logos/profile photos/company logo are
  lower-stakes public images, so leaving those three on Cloudinary
  indefinitely may be an acceptable, deliberate choice rather than something
  to also migrate. Ask the user which they want before
  treating Phase 4 as "Cloudinary fully gone."

**What's actually blocking Phase 1** — the user needs to gather 8 values and
add them to `server/.env` (never pasted into chat):
```
OCI_TENANCY_OCID
OCI_USER_OCID
OCI_FINGERPRINT
OCI_PRIVATE_KEY_PATH      (path to the downloaded .pem, kept outside the repo)
OCI_REGION                (me-jeddah-1)
OCI_COMPARTMENT_OCID
OCI_NAMESPACE
OCI_BUCKET_NAME
```
Full click-path walkthrough (OCI Console → Profile → API Keys → Add API Key,
etc.) was given in chat on 2026-09-25/26 — ask Claude to repeat it if needed,
or re-derive from OCI's own "Add API Key" flow (Console → Profile icon → My
profile → Resources → API keys).

**Resume by:** once those 8 `.env` values exist, tell Claude — Phase 1 build
starts from there.

---

## 2. ERPNext integration (SUPERSEDED 2026-09-27 — see note before resuming)

**⚠️ This plan pushed THIS APP'S Invoice/Payment records to ERPNext. On
2026-09-27 the Invoice/Quotation/CreditNote modules described below were
deleted entirely** (see `docs/INVOICE-QUOTATION-REMOVAL-notes.md` — real
accounting/invoicing is ERPNext's job, full stop, not something this app
tracks alongside it). Every field/model this plan references
(`Invoice.grandTotal`, `erpnextInvoiceId`, etc.) no longer exists. If this
comes back up, it needs a fresh design, not a resume of "Before starting"
below — most likely question to answer first: does ERPNext now hold 100%
of invoicing standalone with zero data from this app, or would a future
sync instead read from the Deployment billing tracker's plain
`invoiceNumber`/`amountReceived` fields (the metadata-only tracker that
replaced Invoice for target-crediting purposes)? Kept below for its
customer/item-mapping/ZATCA reasoning only, in case any of it transfers.

**Status (as originally paused, before the above): full design agreed,
nothing built. Explicitly paused by the user —
"let's store this idea somewhere for now... we'll revisit after some time."**

**Goal:** this app stays the system of record for *operations*; ERPNext
(Frappe Cloud, already running, already ZATCA-registered) becomes the system
of record for *accounting* — real double-entry books/GL — by syncing Invoice
creation and every recorded Payment across. Not a replacement of this app,
not moving Payroll/HR.

**Four scope decisions already made (don't re-ask):**
1. Push trigger: Invoice creation **and** every Payment recorded.
2. Missing ERPNext Customer → auto-create, link back on `Client`.
3. Item mapping: just two admin-configurable ERPNext Item Codes (Labour /
   Trading — Invoice line items only ever carry that 2-value enum).
4. ZATCA: in scope from the start, but Claude only pushes complete/accurate
   Sales Invoice + Customer data (VAT numbers, per-line tax) — the actual
   cryptographic stamping/XML/clearance is ERPNext's own Saudi compliance
   app's job, not code to be written here.

**Architecture agreed:** new `server/src/modules/erpnext/` module
(`erpnext.client.js` REST wrapper, `erpnext.service.js` sync logic,
`erpnextSettings.model.js` singleton for non-secret config), new Section
Access key `erpnextIntegration` (Admin-only default), `Client` gains
`erpnextCustomerId`, `Invoice` gains `erpnextInvoiceId` +
`erpnextSyncError` + per-payment sync tracking. Both pushes best-effort
(never blocks the real save), manual "Resync" action instead of a full
outbox.

**Before starting, need from the user (none invented):**
1. `server/.env`: `ERPNEXT_URL`, `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET`
   (ERPNext → My Settings → API Access → Generate Keys).
2. Exact ERPNext **Item Codes** for two non-stock items (Labour, Trading).
3. Exact ERPNext **Company name** (Setup → Company) — must match exactly.

**Resume by:** re-read the fuller `erpnext-integration-plan` memory, confirm
nothing's changed, pick up at "Before starting" rather than re-deriving the
design.

---

## 3. Operational checklist items still open (not "build later", just not yet clicked)

- **Section Access grants on staging/prod**: the Coordinator Workflow's
  `dailyUpdates*`/`requirements*` grants (Coordinator → own Write, MM → team
  Write) are applied on the **dev** database only. The user ticks the
  matching boxes on staging/prod from the Section Access page themselves —
  Claude doesn't have those DB credentials. (May already be done by the time
  this is revisited — check before assuming.)
- On any Requirements board built before 2026-09-20, an Admin still needs to
  tick "Where a fully-mobilised requirement goes" on the destination stage
  once (only matters for a board that predates the candidates/handoff
  milestone).

---

## 4. Dashboard-extras audit findings awaiting a decision (flagged 2026-09-22)

Work built outside a Claude session (directly by the user, or via Codex CLI)
turned up 4 real gaps Claude deliberately did **not** fix without asking —
full detail in `docs/DASHBOARD-EXTRAS-notes.md` (synced to both repos) and
the `dashboard-extras-audit-2026-09-22` memory. Short version:
1. 7 of 9 new dashboard widgets have zero i18n (hardcoded English) —
   regression against the "every visible string" Arabic-translation rule.
2. Some new dashboard fields gate on a hardcoded role check instead of
   `canAccessSection(...)` — reintroduces a pattern already removed once.
3. A new `finance.activeMobilisationRevenue` figure has no Section Access
   gate at all, unlike every sibling financial figure.
4. `deployment.service.js`'s Coordinator team-scoping changed formula and
   dropped a previously-always-visible branch — undocumented, comment now
   stale.

Also noted but not acted on: a stray `server/test.js` debug script committed
at the server root (dead code by this project's own hard rules) — left in
place pending the user's own go-ahead to delete it.

**Resume by:** re-read `docs/DASHBOARD-EXTRAS-notes.md`, confirm each item is
still true against current code (this audit is now several days old and the
repo has moved since), then get the user's decision on each before touching
anything.
