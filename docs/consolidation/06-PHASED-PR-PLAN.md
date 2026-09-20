# 06 — Phased PR Plan

**Foundation PR, deliverable 6 of 6.**

Every phase is one pull request into **`consolidation/main`** — never `master`.
Merging into `master` deploys the live site (`05-CI-AND-ROLLBACK.md` §5.1) and
happens once, at the end, under separate explicit approval.

Each phase below gives source paths, target paths, test criteria and rollback.

---

## Baseline every phase is measured against

| Metric | Value @ `76ed5f2` |
|---|---|
| `tsc --noEmit` errors | 0 |
| Routes emitted | 330 |
| Route manifest parity | exact |
| Test files passing | 216 (225 incl. skipped) |
| Tests passing / failing | 4,138 / 0 |

The gate in `.github/workflows/consolidation-gate.yml` enforces these as floors.

---

## Phase 0 — Foundation *(this PR)*

| | |
|---|---|
| **Source** | — |
| **Target** | `docs/consolidation/*`, `.github/workflows/consolidation-gate.yml` |
| **App code changed** | **none** |
| **Test criteria** | Gate is green on the base, unchanged — validated locally before commit: parity exact at 330/330; reporter yields 225 files, 4,138 passed, 0 failed |
| **Rollback** | Revert the merge. No app code touched. |

---

## Phase 0b — Narrow the stale CI exclusion list

Small, independent, and it strictly increases coverage.

| | |
|---|---|
| **Source** | — |
| **Target** | `russell-capital-systems/package.json` → `test:ci` |
| **Change** | Drop ~21 stale `--exclude` entries; keep only `*.secret.test.ts`, `*.live.test.ts`, `heygen-api`, `client-workflow.integration` |
| **Rationale** | `03-VERIFICATION.md` §3.2 — the excluded files now pass. CI tests 194 files while 216 pass: a 22-file blind spot. |
| **Test criteria** | `pnpm test:ci` file count rises to ~212; 0 failures |
| **Rollback** | Revert; one-line restore |
| **Risk** | Very low. Touches the base's test config, so the comparison above is attached to the PR per the directive. |

---

## Phase 1 — Resolve the 9 gamification pages *(decision first, code second)*

**Blocked on a decision, not on work.** `04-ROUTE-COLLISIONS-AND-DEPENDENCIES.md`
§4.4: all 9 pages depend on four modules the base does not have —
`UnifiedDataBusContext`, `CalculatorIntegration`, `ComboPageWrapper`,
`useOrganismSkeleton`.

| Option | Work | Consequence |
|---|---|---|
| **A — Adapt** *(recommended)* | Rewrite each page against the base's `ClientDataContext` / `StrategyContext` / `RelatedCalculators` | Most work. One data layer. No new architecture. |
| **B — Import the 4 modules** | Copy modules, then pages unchanged | Fast. Adds a second data-bus pattern beside the base's — the duplication this consolidation exists to remove. |
| **C — Defer** | Nothing now | Zero risk. Base stays at 8/17. |

| | |
|---|---|
| **Source** | `russell-capital-app/client/src/pages/portal/{EliteShowdown,WealthOdyssey,MoatFortress,HolographicMirage,PredictiveInsightArena,StrategyComparisonArena,WealthWarriorChallenges,GamifiedPavlovianEngagement,EntrainmentEngine}.tsx` |
| **Target** | `russell-capital-systems/client/src/pages/portal/` + routes in `App.tsx` + **entries in `shared/routeManifest.ts`** |
| **Test criteria** | Routes 330 → 339; manifest parity exact; test floors hold; each page renders (the base's `experience-batch2.test.ts` pattern — "page exports a default component") |
| **Rollback** | `consolidation-phase-1-pre` tag; revert the merge |
| **Note** | The base already holds `contexts/EntrainmentEngine.tsx` at the correct 6 breaths/min with a cited basis. **Do not overwrite it** — only the page is missing. |

**Recommended split:** the 6 pages needing only `UnifiedDataBusContext` first
(one shared decision), then the 3 with wider dependencies.

---

## Phase 2 — `CONSOLIDATION_PLAN.json` as reference data

| | |
|---|---|
| **Source** | `russell-capital-app/CONSOLIDATION_PLAN.json` (687 rows) |
| **Target** | `russell-capital-systems/docs/audit/consolidationPlan.json` |
| **Change** | Data file only. No code reads it in this phase. |
| **Why** | Every row carries a written client story and discovery questions. Cross-referencing it against `pageRegistry.json` (309 entries) gives evidence-based page selection for later phases. |
| **Test criteria** | Baseline unchanged — no code path touches it |
| **Rollback** | Delete the file |
| **Risk** | None |

---

## Phase 3 — Page selection from the 395 importable routes

Do not bulk-import. Select, one bounded group at a time.

| | |
|---|---|
| **Source** | `russell-capital-app` — only routes in `route-collisions.json → appOnly` |
| **Target** | `russell-capital-systems/client/src/pages/portal/` + `App.tsx` + `shared/routeManifest.ts` + `docs/audit/pageRegistry.json` |
| **Hard constraint** | **None of the 236 collision routes.** Those resolve to BASE (`02-CAPABILITY-MATRIX.md` §2.3). A PR touching one needs the full four-point comparison. |
| **Batching** | ≤ 10 routes per PR, grouped by capability (annuities, estate, tax…), each with its dependency check run first |
| **Test criteria** | Route count rises by exactly the number imported; manifest parity exact; test floors hold; new `pageRegistry.json` entry per page |
| **Rollback** | Per-phase pre-tag; revert the merge |
| **Risk** | Medium, and it compounds. Dependency-check every batch before writing code — the gamification finding in Phase 1 is what happens when you don't. |

---

## Phase 4 — Deployment-pattern study *(read-only)*

| | |
|---|---|
| **Source** | `russell-capital-app/vercel.json`, `api/index.ts`, `server/db.ts` |
| **Target** | `docs/consolidation/07-DEPLOYMENT-PATTERNS.md` — **documentation only** |
| **Change** | **No config, no credentials, no deploy.** The base runs on Railway from `master`; the donor's patterns are Vercel-shaped and are studied, not applied. |
| **Test criteria** | Baseline unchanged; no app file modified |
| **Rollback** | Delete the document |
| **Risk** | None as scoped. Applying any of it is a separate proposal requiring explicit approval. |

---

## Phase 5 — Promotion to production *(requires your explicit approval)*

| | |
|---|---|
| **Source** | `consolidation/main` |
| **Target** | `master` |
| **Effect** | `deploy-branch.yml` splits the subtree to `deploy/rcs` and deploys Railway service `e8d1eb7b…` — **the live `www.russellcapitalsystems.com`** |
| **Pre-conditions** | Gate green on `consolidation/main`; every phase merged and individually green; `consolidation-pre-promotion` tag pushed; last known-good Railway deployment ID recorded |
| **Test criteria** | Post-deploy: `scripts/smoke-production-routes.mjs`; Railway healthcheck on `/` (300s timeout) passes |
| **Rollback** | 1) Redeploy the previous Railway deployment from the dashboard — fastest, no Git change. 2) Then revert the merge on `master`. In that order. |
| **Approval** | **Yours, explicitly, at the time. Not implied by approval of any earlier phase.** |

---

## Sequencing

```
Phase 0   foundation ........................ this PR
Phase 0b  CI exclusion list ................. independent, any time
Phase 2   plan as reference data ............ independent, any time
Phase 1   gamification ...................... needs your A/B/C decision
Phase 3   page selection .................... needs Phase 2 for evidence
Phase 4   deployment study .................. independent, read-only
Phase 5   promotion ......................... last, explicit approval
```

0b, 2 and 4 carry no risk and need no decision. Phase 1 is waiting on you.
Phase 3 is the long tail and should not start until Phase 2 gives it evidence.

---

## What is out of scope throughout

DNS · domains · production traffic · hosting · databases · credentials ·
wholesale repository merges · overwriting the engine registry, calculator
registry, route manifest or existing tests without a documented comparison and
regression proof · the 41 ToggleHub pages and the 306-file shared-field layer
(`04` §4.3 — competing architecture, separate decision) · external data
connectors (`01` §1.5 — follow-on work, not migration).
