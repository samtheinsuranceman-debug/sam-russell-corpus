# 2 — Authoritative Capability Matrix

**Compiled:** 2026-09-20
**Rule:** exactly one chosen implementation per engine, calculator, route,
schema and shared module. Everything not chosen is superseded, not deleted;
superseded routes keep resolving so no URL or bookmark breaks.

**Selection criteria, applied in order:**
1. **Correctness** — a known-defective implementation never wins, whatever its size.
2. **Test coverage** — an implementation the live suite exercises beats one it does not.
3. **Depth** — where 1 and 2 do not separate them, the more complete implementation wins.
4. **Incumbency** — a genuine tie goes to the live build, because zero change is zero risk.

---

## 2.1 Shared modules — measured, not assumed

| | Count |
|---|---|
| Shared modules in live | **174** |
| Shared modules in `russell-capital` | 63 |
| Shared modules in `russell-capital-app` | 62 |
| Present in both live and a donor | 58 |
| **Of those 58, live is larger or equal in** | **57** |
| Donor-only modules | **4** (plus one authored in this workstream) |

**Decision: the live build is canonical for all 174 shared modules.**
One module and one exception are called out below; nothing else moves.

### The four donor-only modules

Each exists in both `russell-capital` and `russell-capital-app`, identical in size.

| Module | LOC | Decision | Why |
|---|---|---|---|
| `shared/familyTreeFinancialEngine.ts` | 221 | **Import — candidate PR** | No live equivalent. Powers family-tree financial mapping, which the live Family Office pages have no engine for. |
| `shared/complianceDocGeneratorEngine.ts` | 178 | **Import — candidate PR** | No live equivalent. Compliance document generation. |
| `shared/clientOnboardingEngine.ts` | 176 | **Evaluate before import** | Live has `assessmentBridge.ts`, `clientFactFinder.ts` and `journeyEngine.ts` covering adjacent ground. Overlap must be resolved before it is added, or it becomes a second onboarding path. |
| `shared/multiCurrencyWealthEngine.ts` | 159 | **Import — candidate PR** | No live equivalent. |

### The one module where a donor is larger

| Module | Donor LOC | Live LOC | Decision |
|---|---|---|---|
| `shared/accessControl.ts` | 104 | 29 | **Live wins. Do not import.** This is authorisation code. A larger implementation is not a better one, and the donor repo carries four parallel privileged-access environment variables (`ETERNAL_PASSWORD`, `ETERNAL_PASSWORD_2`, `DASHBOARD_PASSWORDS`, `ADMIN_DASHBOARD_PASSWORD`). Any change here needs a security review of its own, not a size comparison. |

### Modules explicitly rejected from donors

| Module | Repo | Reason |
|---|---|---|
| `server/calendarService.ts` | `russell-capital-app` | Interpolates user-controlled JSON into `execAsync` — command-injection surface. |
| `client/src/hooks/engine_montecarlo.ts` | `russell-capital-app` | Correlated-normals defect: independents drawn from `mean[0]`/`covariance[0][0]`, then `mean[i]` added on top of `L·z`. Means double-counted, per-asset vols ignored. Live `shared/monteCarloEngine.ts` is correct and seeded (`mulberry32(42)`) for reproducible illustrations. |
| `shared/householdWealth.bak.ts` | both donors | A committed backup file sitting beside the live one. |
| Any auth or session module | both donors | Out of scope. Credentials are excluded by the mandate. |

---

## 2.2 Routes

| | Count |
|---|---|
| Routes in live manifest | **331** |
| Donor routes absent from live (`russell-capital`) | **391** |
| **Route paths present in BOTH** | **210** |
| Of those 210, live implementation is already larger | **172** |
| Of those 210, donor is larger | 20 |
| Of those 210, equal or unresolvable | 18 |

**Decision for the 210 collisions: live is canonical by default.** 172 resolve
in live's favour on depth alone and need no further thought. The remaining 38
are enumerated in `collision-size-comparison.json`; the ones with a material
gap are listed below and each requires a documented per-route comparison
before anything is touched.

### Collisions where the donor is materially larger

| Route | Donor LOC | Live LOC | Note |
|---|---|---|---|
| `/portal/carrier-ratings` | 1,713 | 94 | Live page is a 94-line stub. Largest gap in the estate. |
| `/portal/carrier-rates` | 1,713 | 94 | Same component as above — the donor registers it twice. Only one route should survive. |
| `/portal/legal-payment-folder` | 1,198 | 29 | Live is a 29-line stub. |
| `/portal/ai-meeting-notes` | 1,046 | 31 | Live is a 31-line stub. |
| `/portal/billing` | 987 | 25 | Live is a 25-line stub. **Billing touches Stripe — treat as sensitive, not a simple swap.** |
| `/portal/ai-brain-hub` | 495 | 178 | |
| `/portal/myga-waterfall` | 299 | 126 | Live also has `/portal/myga-fixed-rate`; resolve both together. |
| `/portal/market-pulse` | 267 | 133 | |
| `/portal/ai-assist`, `/portal/ai` | 1,279 | 1,151 | Two donor routes, one component. |

> **A larger page is not automatically a better page.** LOC is a screening
> signal for where to look, never the decision itself. Each swap above needs
> the live page read, the donor page read, and the difference stated — which
> is why they are individually-scoped PRs in document 06 and not a batch.

### Donor routes with no collision — the 391

| Migration class | Count | Meaning |
|---|---|---|
| **Clean** | **244** | Every `@/components/*` import already exists in live. No missing shared module. |
| **Blocked on components** | **147** | Imports one or more of five components live does not have. |
| **Blocked on shared modules** | **0** | Live's 174 modules are a practical superset. |
| **Unresolvable file** | 0 | Every donor route maps to a real component file. |

### The five missing components — the whole blocking set

| Component | Pages blocked |
|---|---|
| `components/ProjectionChart50yr` | **122** |
| `components/CalculatorIntegration` | **113** |
| `components/CalculatorPDFExport` | 27 |
| `components/ComboPageWrapper` | 8 |
| `components/NeuralMeshInterceptor` | 1 |

**This is the single highest-leverage finding in the matrix.** Porting two
components — `ProjectionChart50yr` and `CalculatorIntegration` — unblocks the
overwhelming majority of the 147. They are therefore Phase 2, ahead of any
page migration, and get their own PR with their own tests.

`NeuralMeshInterceptor` is a single-page dependency and is **not recommended**:
in the donor it mounts once in `AppShell` and auto-wires every route into a
data bus, AI brain and client context. That is a large, invasive behaviour to
adopt for one page.

---

## 2.3 Calculators

| | Count |
|---|---|
| Entries in live `shared/calculatorCatalog.ts` | **117** |
| Entries bound to a named engine module | 45 |

**Decision: the live catalogue is canonical.** It is enforced —
`server/calculatorCatalog.test.ts` verifies every `path` against the real
router, so an entry pointing at a route that does not exist fails the build.
Its own header records why it exists: eighteen of thirty-five cards once
pointed at routes that did not exist.

**Rule for every migration PR:** a page arrives with (a) its route in
`App.tsx`, (b) its path in `shared/routeManifest.ts`, and (c) a catalogue row
if it is a calculator. Any PR that adds a route without the manifest entry
fails `server/*.smoke.test.ts` by design.

---

## 2.4 Schema

**Decision: the live schema is canonical and unchanged by this consolidation.**

| Source | Tables | Decision |
|---|---|---|
| live `database/rcs-schema.sql` | 115 | **Canonical.** |
| `russell-capital-app` | 117 | Postgres port. Reference only. **No migration proposed.** |
| `russell-capital` | — | MySQL. Reference only. |
| `Russell-Capital-Calibrate-System` `drizzle/schema.ts` | 15 | **Approved donation, deferred.** The behavioral schema — breathing telemetry, hesitation-as-signal, versioned genome, chaptered vision boards — has no live counterpart and is genuinely novel. It is a database change and therefore needs its own migration plan, its own approval, and a rollback that is tested against a copy. **Not in any PR in document 06.** |

---

## 2.5 Registries that must not be replaced wholesale

Per the mandate, these four are modified only additively, one entry at a time,
with the regression proof in document 03 as the baseline:

| Registry | File | Protection |
|---|---|---|
| Route manifest | `shared/routeManifest.ts` | Smoke tests compare it against `App.tsx` in both directions and name the differing paths. |
| Calculator catalogue | `shared/calculatorCatalog.ts` | `calculatorCatalog.test.ts` verifies every path resolves. |
| Engine registry | `shared/*.ts` | Typecheck plus per-engine suites. |
| Navigation | `components/AppShell.tsx` | `navigation-organization.test.ts`, `grok-merge.smoke.test.ts`, `integrationAudit.test.ts`. **See document 03 §3.4 — these tests currently assert two navigation entries that have no route.** |

---

## 2.6 Summary of what actually moves

| Capability | Chosen source | Phase |
|---|---|---|
| All 174 shared modules | **Live** | — no change |
| 4 donor-only engines (3 clean, 1 to evaluate) | `russell-capital` | 3 |
| 115-table schema | **Live** | — no change |
| Behavioral schema (15 tables) | `Calibrate-System` | **Deferred — needs its own approval** |
| 117-entry calculator catalogue | **Live** | — additive only |
| 172 of 210 route collisions | **Live** | — no change |
| ~20 donor-favouring collisions | Case by case | 5 |
| 244 clean donor routes | `russell-capital` | 4 |
| 147 blocked donor routes | `russell-capital`, after components | 4 |
| 5 shared components | `russell-capital` (4 of 5) | **2 — unblocks everything else** |
| 18 gamification routes | `russell-capital-app` | 6 |
| Sacred Seven | `russell-capital` | 6 |
| Postgres / Vercel patterns | `russell-capital-app` | **Reference only — no migration proposed** |
