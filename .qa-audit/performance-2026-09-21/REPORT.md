# Performance and cleanup audit — 21 September 2026

Audited server commit `b5e9b1a` and client commit `a77d62f`, treating them as separate repositories. No application source, dependencies, settings, or existing database records were changed. This folder contains audit artifacts only.

**Conclusion:** prioritize database round trips, polling, synchronous spreadsheet processing, and initial JavaScript delivery. Deleting historical documentation or small duplicated helpers will have little effect on runtime responsiveness.

## What was actually checked

- Parsed and traced imports, including dynamic imports, across all **532 JS/JSX source files**. App entry points, tests, and command-line scripts were included as roots. No unreachable source files were found.
- Client production build passed: **787.01 KB minified / 237.08 KB gzip main JS**, a separate **65.88 KB / 24.36 KB gzip Axios chunk**, and **42.08 KB / 8.23 KB gzip CSS**. Route chunks are additional and loaded as needed. The build emits a large-chunk warning.
- Both development and production-preview frontend servers started. The production-built login page rendered in the browser; its captured warning/error log was empty at inspection. Authenticated browser workflows and real-user paint/interaction metrics were not measured.
- The regular backend entry point booted against disposable local MongoDB and returned HTTP 200 from `/api/health`. Read-only API profiling against the configured Atlas database used the actual Express app without starting its scheduled notification jobs. Automatic collection/index creation was disabled for those Atlas checks.
- Server lint passed. Client lint: **0 errors, 17 warnings** (13 Fast Refresh export warnings, four hook dependency warnings).
- Existing backend tests: **37 passed, one failed**. The failed approval test passed when its three-test file was rerun. See the test finding below.
- Ran HTTP middleware probes, query counting, injected-latency service probes, an actual spreadsheet-parser benchmark, bundle module analysis, cache-key reproduction, index/explain inspection, dependency usage searches, and documentation comparisons.

## Live read-only measurements

These are single local-machine samples against the configured Atlas database, not production p95 measurements. Cold connection/pool effects can contribute. Payload contents and credentials were not recorded.

| Request | Elapsed | Database operations | Response bytes |
|---|---:|---:|---:|
| `/api/health` | 55 ms | 0 | 54 |
| `/api/notifications?limit=10` | 1,370 ms | 5 | 2,978 |
| `/api/dashboard` | 2,162 ms | 36 | 3,678 |
| `/api/employees?limit=20` | 572 ms | 5 | 11,221 |
| `/api/deployments?limit=20` | 457 ms | 5 | 11,723 |
| `/api/requirements/board` | 625 ms | 4 | 2,019 |

Five database ping samples: **143, 135, 136, 137, 136 ms**. This measures this workstation's network path. Measure the deployed API server's path before changing hosting or database regions. A small JSON response taking seconds points toward request/query overhead rather than simply too many rows in the response.

## Prioritized findings

### P1 — High: ordinary office traffic can exhaust the API rate limit

**Locations:** `server/src/middleware/rateLimiter.js:19`; `client/src/components/shared/NotificationBell.jsx:34,42`; `server/src/modules/notifications/notification.service.js:109`. Additional ten-second polling exists in ClientListPage, MobilisationListPage, ApprovalLogPage and request-review panels.

The API allows **600 requests per IP per 15 minutes**. Each foreground, active user's notification bell alone makes approximately **90 requests in that period**. Seven active users behind one office IP exceed the budget before ordinary page usage. Four active users with both the bell and a polling list make about 720 requests. These are traffic calculations, not a claim that seven real users were load-tested. Inactivity logout and background-tab behavior affect actual traffic.

**Reproduced:** the real Express app's limiter returned HTTP 429 on request **601**, using an isolated listener. No load was sent to the deployed service.

**Fix:** retain an IP abuse limit, add an appropriately sized authenticated-user budget after authentication, and keep login protection separate. Reduce polling or use an authenticated event channel to invalidate relevant cached queries. A bell badge should fetch a lightweight unread count; fetch the ten full notification records when the panel opens. Respect 429 backoff. Do not simply remove rate limiting.

### P2 — High: many requests authenticate twice

**Locations:** `server/src/app.js:116`; `server/src/modules/leave/leave.routes.js:32`; `server/src/middleware/auth.js:33`.

The leave router is mounted at `/api` and unconditionally runs `requireAuth`. Requests for modules mounted after it pass through that authentication before reaching their own authentication middleware. Each execution performs a user lookup and JWT verification.

**Reproduced:** a successful notification GET made **two `users.findOne` calls** in the live read-only trace. The requirements-board GET did too. An isolated HTTP probe reproduced two user reads for notifications, while public health/branding made none. The notification request's five queries were two user lookups, the notification list and two counts.

**Fix:** scope the leave router's authentication to its actual paths, or split its two resource routers. Keep each protected route authenticated exactly once and preserve immediate deactivation/token-version enforcement. Do not solve this by blindly trusting a cached user across requests. Verify public routes and wrong-token behavior after restructuring.

### P3 — High: dashboard fans out into too many database operations

**Locations:** `server/src/modules/dashboard/dashboard.service.js:82,113,164,254,293`.

**Reproduced:** the Admin dashboard made **36 database operations** and took **2.16 seconds** in the local sample. Its six-month profit chart alone made **18 operations**: six invoice aggregates, six expense aggregates and six payroll lookups. Other reads load metrics and pending requests. A stubbed Manager invocation with no configured grants still performed nine separate SectionAccess reads before the other dashboard work.

Parallel queries are better than sequential queries, but they do not eliminate network, database, or connection-pool work. Pending-action calculation also loads matching pending records and evaluates them in JavaScript.

**Fix:** aggregate all six months in one date-range query per financial collection, grouping by month. Resolve section access once per request, then reuse the result. Batch approval-role membership checks. Consider independently loading widgets so an expensive financial summary does not hold the entire dashboard. Preserve each widget's authorization and Coordinator scope; any summary cache must include that scope and have explicit invalidation.

### P4 — High for larger payrolls: three sequential reads per employee

**Locations:** `server/src/modules/payroll/payroll.service.js:137,152,154,159`; `server/src/modules/deployments/deployment.service.js:910`.

Each employee triggers deployment-deduction, approved-timesheet and sick-leave reads, sequentially, before the loop advances to the next employee.

**Reproduced with the actual service and stubbed storage:** 10 employees made 30 per-employee reads and took **494 ms**; 100 employees made 300 reads and took **4,708 ms**. Each stub read requested a 10 ms delay; scheduler overhead is included. Maximum concurrent reads was **one**. These are controlled synthetic timings, not live payroll creation. No real payroll was created.

**Fix:** fetch all eligible employees' month data in three batched reads/aggregations and group it by employee ID. Keep the monetary and snapshot rules unchanged. If batching must be staged, use bounded concurrency as an interim measure rather than unbounded `Promise.all` over an arbitrary workforce.

### P5 — Medium: save responses wait for external push delivery

**Locations:** `server/src/modules/notifications/notification.service.js:36,73`; `server/src/modules/requirements/requirement.service.js:272,303,349`; `server/src/modules/approvals/approvalEngine.service.js:165`.

Notification failures are caught, but delivery is still awaited. Requirement notification loops also await recipients one after another. A successful save can therefore feel slow while the API waits for push services.

**Reproduced:** with real notification service code and a fake 250 ms push sender, one recipient took **259 ms** and four sequential recipients took **1,055 ms**. No external push was sent.

**Fix:** persist the business change and a durable notification/outbox job, then return. Deliver push separately with bounded concurrency, retries and timeouts. Catching an exception is not the same as removing delivery from the response path. Avoid detached, unreliable promises as the only delivery mechanism.

### P6 — Medium: initial JavaScript remains substantial despite route splitting

**Locations:** `client/src/i18n/index.js:17`; `client/src/app/router.jsx:21`; `client/src/lib/sentry.js:11`; `client/vite.config.js:8`.

**Reproduced:** the production entry chunk is **787 KB minified / 237 KB gzip**. Bundle module inspection found both language dictionaries (~180 KB combined in the pre-minification module accounting), React Hook Form, Zod, Sentry, both application layouts, routing and rendering libraries in that entry chunk. Module accounting is not interchangeable with final compressed download savings.

**Fix:** prioritize loading only the selected language and relevant translation namespaces; split authenticated staff/ESS shells from the public login path; check why form libraries are placed in the common entry and split them where useful. Keep error reporting, but consider an early-error-safe deferred initialization or a smaller error-only integration after measuring its benefit. Splitting vendor files alone does not reduce total startup bytes if all remain eager dependencies.

Measure cold/warm navigation and interaction on a representative slower phone before claiming a user-visible improvement. Do not raise the chunk warning threshold and treat that as a fix.

### P7 — Medium: spreadsheet parsing blocks the API event loop

**Locations:** `server/src/modules/timesheetProcessor/timesheet.parser.js:147,152,161`; `server/src/modules/timesheetProcessor/timesheet.constants.js:27`.

The parser is declared async but calls synchronous `XLSX.read` and `sheet_to_json` on the request thread. The 5 MB compressed upload limit does not bound worksheet row count or parsing CPU.

**Reproduced with a generated valid workbook:** 1,000 rows parsed in **67 ms**; 50,000 rows compressed to **1,743,283 bytes**, passed the byte-size limit, and parsed in **1,116 ms**. A zero-delay timer could not run until parsing finished (**1,117 ms**). This proves event-loop blocking in that process; it is not a production denial-of-service load test.

**Fix:** enforce worksheet/row/cell limits and move larger parses to worker threads or a job worker. Avoid parsing the same unchanged upload twice for preview and export where a short-lived, actor-scoped result can be reused. Keep file and authorization validation.

### P8 — Medium, scaling risk: large overview/board responses and DOM rendering

**Locations:** `client/src/features/deployments/components/DeploymentOverviewModal.jsx:133,225,794`; `server/src/modules/deployments/deployment.service.js:790`; `server/src/modules/requirements/requirement.service.js:92,194`; `client/src/features/requirements/pages/RequirementsBoardPage.jsx:235`.

The deployment overview requests up to **5,000 full rows**, including monthly histories and populated mobilisation fields, then renders every row and column. The requirements board allows **1,000 cards**, renders all of them, and passes through `stageHistory`; candidate details are correctly stripped from board responses, but only after being fetched into the backend.

**Verified from executed import/build analysis and code, not reproduced as a current UI freeze.** The configured database is too small to establish large-board browser behavior. These are growth risks, not demonstrated causes of today's latency.

**Fix:** introduce compact list/board projections, server-side filtering/pagination or incremental column loading, and row/card virtualization where a real large-data browser profile justifies it. Keep bulk history in the export/detail path. Existing `enabled: open` on the overview already avoids fetching it while closed.

### P9 — Low/Medium: some identical picker requests still use separate caches

**Locations:** `client/src/lib/useEmployeePicker.js:15`; `client/src/features/documents/components/DocumentUploadModal.jsx:55`; `client/src/features/expenses/pages/ExpenseListPage.jsx:114`.

The shared employee picker is already a good improvement, but the document-owner picker still fetches the same employees under `['ownerPicker','Employee']`. Its client list also duplicates the expense client picker with a different key.

**Reproduced:** executing the installed QueryClient with the two employee keys invoked an identical fetch function twice; repeating the shared key within its freshness interval invoked it zero additional times.

**Fix:** share query options/keys only when the endpoint, parameters, data shape and authorization scope are identical. Keep approved-only and all-client datasets distinct. Replace first-100 dropdowns with debounced server-side search as those datasets grow; raising all limits increases payloads and still does not solve completeness.

### P10 — Low now, scaling risk: two inspected query shapes lack supporting indexes

**Locations:** `server/src/modules/invoices/invoice.model.js:84`; `server/src/modules/dashboard/dashboard.service.js:83`; `server/src/modules/requirements/requirement.model.js:99`; `server/src/modules/requirements/requirement.service.js:194`.

**Reproduced using the configured database's actual indexes and read-only explain:** the invoice date range selected `COLLSCAN`; there is no invoice `date` index. The whole-board `{stageEnteredAt:1,_id:1}` sort selected `SORT` over `COLLSCAN`; the current `{stage:1,stageEnteredAt:1}` index is not a matching whole-board sort index. Employee name sorting correctly used `fullName_1`.

The invoice and requirement collections were empty in these inspected plans. Therefore these are validated index gaps for those shapes, **not evidence of costly current scans**. Explain representative populated queries before choosing indexes, including actual Coordinator/stage filters; avoid adding every possible index because writes and storage also have costs.

## Dead code, duplication, dependencies and docs

**No confirmed abandoned source module or unused import was found.** Lint and entry-point reachability are useful evidence, not proof that every business feature remains wanted. A file referenced by a live entry point must not be deleted merely because it has few references. Migrations and maintenance scripts are legitimate entry points.

**33 named exports had no other source-file reference by name, but all still had local references.** These are candidates to make private, not functions to delete. Examples: `FALLBACK_BRAND_NAME` (BrandLogo.jsx:13), `toDateKey` (attendance.dates.js:9), `emptyCompanySettingsForm` (companySettings.schema.js:26), `RANGES` (NfcAnalyticsBits.jsx:13), `RTL_LANGUAGES` and `applyDocumentDirection` (i18n/index.js:24,40), and `roundMoney` (server/src/utils/moneyMath.js:2). This cleanup is unlikely to materially improve production speed because build optimization already removes unnecessary exported surface where possible.

**Remaining exact duplicate function bodies** (AST scan, comments/whitespace normalized, bodies at least 180 characters):

| Duplication | Locations | Recommendation |
|---|---|---|
| Navigation icon renderer | DashboardLayout.jsx:33; EssLayout.jsx:64 | Small shared primitive; low priority. |
| Hub/tile icon renderer | SectionHubPage.jsx:12; SectionAccessPage.jsx:133 | Same small renderer pattern; low priority. |
| Copy-password handler | EmployeeLoginPanel.jsx:65; UserListPage.jsx:65 | Share clipboard/error handling if behavior should stay identical. |
| Inline job-title creation success handler | MobilisationForm.jsx:321; RequirementFormModal.jsx:57 | Consider a focused shared hook. |
| Coordinator-list service body | dailyUpdate.service.js:202; requirement.service.js:230 | Share only while preserving each module's own access resolution. |
| PDF row rendering | invoice.pdf.js:47; quotation.pdf.js:50 | Shared PDF table utility. |
| PDF totals rendering | invoice.pdf.js:77; quotation.pdf.js:81 | Same utility; preserve each document's layout. |
| Mobilisation validation refinement | client mobilisations.schema.js:221; server mobilisation.validation.js:314 | Intentional validation at both boundaries; do not remove server validation. Contract tests may be better than coupling two repositories. |

These are exact-body matches, not an exhaustive claim that no semantically equivalent code exists elsewhere. Prior duplicated money totals, regex escaping, profile fields, image-upload handling and most employee picker queries have already been consolidated; do not reopen them as unresolved findings.

**Dependencies:** no unused backend direct runtime dependency was identified. Capacitor packages belong to the native builds even when not directly imported by web source. `tslib` has no direct application use found but is required transitively by Capacitor/dnd-kit; its explicit devDependency may be redundant, not the installed package itself. Removing that declaration would not be a meaningful browser speed fix.

**Documentation:** the server/client copies of all **54 shared docs files** match byte-for-byte; 53 are Markdown (~851 KB total per repo), one is a PDF. Their two ~102 KB CLAUDE.md files also match. Keeping docs in both independent repos is an explicit architectural decision, not accidental runtime duplication.

- The retired root `CLAUDE.md` differs from the two authoritative copies. Root docs overlap the current copies, while root-only `docs/CONTINUE-PROMPT.md` and the other session handoff material are historical. Archive the retired root material outside active onboarding paths once its desired history is retained.
- Split the long CLAUDE feature history into an archive/changelog and retain a shorter current architecture, commands and invariants guide. This helps handoff and developer/agent reading time, not browser speed.
- Keep historical milestone and audit notes, clearly labeled with dates/supersession; deleting them without review would lose rationale.
- Correct actual comment drift: NotificationBell.jsx:8 says 30 seconds while line 42 configures 10; its nearby claim that ten-second polling is only a handful of requests per hour is false (360/hour per active tab). sectionAccess.controller.js:2 says every route is Admin-only despite the explicit authenticated `/mine` exception. dashboard.service.js:6 describes one fast round trip, while the measured request makes dozens of DB operations.
- Docs outside `client/public` are not automatically shipped by Vite. The inspected production assets contained no Markdown documentation. Deleting these docs will not make page loads faster.

## Existing test instability

**Medium reliability finding:** `server/src/modules/approvals/approvalEngine.service.test.js:71` requires the losing concurrent decision to return 409. The initial full run returned 400 instead; a targeted rerun passed all three tests. The engine returns 400 if it first reads an already-decided record (`approvalEngine.service.js:205`) and 409 if its conditional update loses the race (`:234`). Which branch executes depends on scheduling.

This result does **not** establish that two approvals committed: the test's one-success/one-rejection assertions passed before the status-code assertion failed. Decide the intended conflict contract, then make the implementation/test consistent and make the intended race deterministic. Do not dismiss the failed suite or claim a double-approval bug from this evidence.

## Suggested implementation order

1. Fix duplicate authentication and the polling/rate-limit mismatch. These affect routine navigation and all active staff.
2. Batch dashboard financial/permission reads and payroll reads. Keep output and ownership rules unchanged; measure query counts before/after.
3. Move push delivery out of save responses; bound spreadsheet CPU work.
4. Reduce startup payload and introduce compact list/picker endpoints. Profile larger overview/board views before adding virtualization.
5. Reconcile the flaky test, tidy duplicate helpers/private exports and archive retired docs.

Record production API p50/p95, database time, query counts, 429 frequency, payload sizes, event-loop delay, and browser navigation/interaction timing. Error tracking exists, but `client/src/lib/sentry.js:19` explicitly sets `tracesSampleRate: 0`; current configuration does not supply browser performance traces. Establish a privacy-conscious performance baseline rather than guessing from exception reports.

The highest-value first change is **fewer database round trips per user action**, followed by **less background polling**. No production latency percentage or before/after improvement is claimed until those changes are implemented and measured.

## Reproduction

From `server/`, run `node ../.qa-audit/performance-2026-09-21/reproduce.mjs`. This uses real application code with local model stubs, an ephemeral HTTP listener, a fake push sender and a generated in-memory spreadsheet. It never connects to MongoDB, sends external push, or saves a payroll. It reproduces authentication counts, the rate-limit threshold, sequential payroll reads, awaited push latency, and parser event-loop blocking. Timings vary by machine. Push latency requires the existing VAPID configuration to enable the service path; the script prints whether that path was enabled.

Standard checks: `npm run build` and `npm run lint` from `client/`; `npm run lint` and `npm test` from `server/`. The targeted flaky-test rerun was `npx vitest run src/modules/approvals/approvalEngine.service.test.js`.

Live timings/explain results above came from a separate read-only harness with automatic index/collection creation disabled. The reproduction script intentionally does not repeat real-data access or impersonate an existing account.
