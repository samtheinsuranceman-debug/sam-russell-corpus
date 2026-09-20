# 2 — Authoritative capability matrix

One chosen implementation per capability. **Default: the base wins.** A donor implementation
is selected only where this document records a reason, and every such selection becomes its
own PR in §6 with a documented comparison and regression proof.

Rule of construction: *the base is never overwritten without evidence.* Where a module
exists in both and differs, the larger/newer implementation is not automatically correct —
but it is the one that must justify replacement, and the base holds the position until it does.

---

## 2.1 The three named donor items — status

You scoped `russell-capital` as donor for the Sacred Seven, the behavioral schema, and
selected page/content modules. Two of the three are already closed.

| Item | Status | Evidence |
|---|---|---|
| **Sacred Seven** | ✅ **Already in the base. Nothing to migrate.** | `docs/source-manifest.md` describes the "addition release" as *"the seven Sacred Seven page components and their shared `GenomeKit.tsx` component"* — eight files, already imported. All eight verified present in `russell-capital-systems/client/src/pages/portal/`: `TheArrival`, `TheMirror`, `TheStrategyTable`, `TheField`, `TheMap`, `TheLegacy`, `TheBrotherhood`, `_genome/GenomeKit`. All eight verified **absent** from `russell-capital`. The donor cannot supply them. |
| **Behavioral schema** | ⚠️ **Appears already satisfied — needs your definition.** | `shared/behavioralBiasEngine.ts` is **byte-identical** in base and donor (187 lines). No behavioral/NLP/calibration/persona table exists in the donor's schema that the base lacks. If "behavioral schema" means something other than this engine, name it and it will be matrixed. |
| **Selected page/content modules** | ✅ In scope, scoped in §2.4 and §6. | 391 candidate routes; approved subset far smaller. |

## 2.2 The `russell-capital-app` donor items

| Item | Status |
|---|---|
| **18 gamification routes** | ⚠️ **Count not reproducible — needs your list.** See §2.5. |
| **Postgres / Vercel patterns** | ✅ In scope as *pattern reference only*, not code import. See §2.6. |

---

## 2.3 Engines and shared modules

Base `shared/`: **187 modules.** Donors: **63 each.** Of the 63, **47 are byte-identical** to
the base. That leaves 16 to decide.

### Differs in both — decision

| Module | base | donor | Chosen | Reason |
|---|---:|---:|---|---|
| `indexCreditingData.ts` | 999 | 685 | **base** | Base carries 314 more lines of crediting data. |
| `mortgageKiller.ts` | 759 | 696 | **base** | Base is ahead; PAT-009 core. |
| `growthAnnuityEngine.ts` | 480 | 443 | **base** | Base ahead. |
| `timeMachineEngine.ts` | 505 | 482 | **base** | Base ahead; PAT-010 core. |
| `policyLoanOptimizer.ts` | 277 | 198 | **base** | Base ahead. |
| `divorceFinancialEngine.ts` | 179 | 151 | **base** | Base ahead; PAT-006 core. |
| `tabScores.ts` | 205 | 204 | **base** | Effectively equal; hold. |
| `slideThemes.ts` | 93 | 93 | **base** | Equal length, differs in content — **diff before any change**. |
| `branding.ts` | 42 | 40 | **base** | Base is live branding. Donor is a different property. |
| `const.ts` | 30 | 5 | **base** | Base ahead. |
| `taxBracketEngine.ts` | 654 | **669** | **⚠️ REVIEW** | Donor is 15 lines longer. Tax brackets are year-versioned; the longer file may simply carry a later year. **PR-6 in §6 diffs these before choosing.** |
| `accessControl.ts` | 29 | **104** | **⚠️ REVIEW** | Donor is 3.5× larger. Access control is security-bearing; a larger implementation is not automatically safer. **PR-7 in §6, with a security review.** |

### Donor-only modules — candidates

| Module | Lines | Disposition |
|---|---:|---|
| `familyTreeFinancialEngine.ts` | 221 | **Candidate** — no base equivalent. PR-8. |
| `complianceDocGeneratorEngine.ts` | 178 | **Candidate** — PR-8. |
| `clientOnboardingEngine.ts` | 176 | **Candidate**, but base has `clientFactFinder` + `intakeRouter`; check for overlap first. PR-8. |
| `multiCurrencyWealthEngine.ts` | 159 | **Deferred** — no evidence of demand; archive candidate. |

**Everything else in `shared/` stays as the base has it.** The base's 124 unique modules —
`altCredit/`, `householdGenome`, `whispererEngine`, `sequencePlanner`, `mechanismDossiers`,
`policyMechanics`, `irc7702`, `zipEngine`, `careerEngine`, `liquidityRoutes`,
`mortgageLedger`, `routeManifest`, `calculatorCatalog`, `patentCatalog`, `journeyCatalog` and
the rest — have **no donor equivalent and are not in question.**

---

## 2.4 Registries — protected

These are the files you named as not-to-be-overwritten. Their status:

| Registry | Location | Chosen | Protection |
|---|---|---|---|
| **Route manifest** | `shared/routeManifest.ts` (330 entries) | **base, absolute** | Append-only. Neither donor has an equivalent, so there is nothing to merge — only additions, one line per new route, as §6 phases land. `server/grok-merge.smoke.test.ts` is the gate: it calls `diffRoutes()` and asserts `currentRoutes.size === ROUTE_COUNT`. (Note `scripts/reconcile-route-manifest.mjs` is a *different* thing — it mutates `audit/route_manifest.json`, 232 entries, and is not this manifest's checker.) |
| **Calculator registry** | `shared/calculatorCatalog.ts` (+ `calculatorCatalog.test.ts`) | **base, absolute** | Append-only. |
| **Patent catalog** | `shared/patentCatalog.ts` (+ test) | **base, absolute** | Append-only. |
| **Journey catalog** | `shared/journeyCatalog.ts` | **base, absolute** | Append-only. |
| **Engine registry** | *no single file found* | — | The base has no file literally named an engine registry. `shared/calculatorCatalog.ts` and the `engineChain*` tables in the donors are the closest. **If you mean a specific file, name it and it will be added here as protected.** |
| **Existing tests** | `server/**/*.test.ts` (216 files) | **base, absolute** | No test is modified or deleted by any phase. Phases add tests. |

---

## 2.5 Gamification — the count does not reproduce

Two independent methods were run against `russell-capital-app`, the repo you scoped for this.

- **By name**, across the known gamification pages, `russell-capital-app` holds **6** the base
  lacks: `WealthRituals`, `MasteryNexus`, `FinancialFluencyAcademy`, `LegacyVault`,
  `PresentationVault`, `ToolExplorer`.
- **By content signal** (XP, streak, achievement, badge, level-up, leaderboard, trophy,
  unlock, petHappiness — ≥3 occurrences), `russell-capital-app` yields **4**:
  `WealthRituals` (30 signals), `UsageAnalyticsDashboard` (5), `MasteryNexus` (4),
  `FinancialFluencyAcademy` (3).

**The gamification set lives in `russell-capital`, not `russell-capital-app`.** Presence matrix:

| Page | base | `-app` | `russell-capital` |
|---|:--:|:--:|:--:|
| Arena, BlackMirror, Endgame, InfiniteScroll, PetSystem, RewardsVault, SocialNarcotic, ToiletDashboard | ✅ | — | ✅ |
| EliteShowdown, EntrainmentEngine, GamifiedPavlovianEngagement, HolographicMirage, MoatFortress, PredictiveInsightArena, StrategyComparisonArena, WealthOdyssey, WealthWarriorChallenges | — | — | ✅ |
| WealthRituals, MasteryNexus, FinancialFluencyAcademy, LegacyVault, PresentationVault, ToolExplorer | — | ✅ | ✅ |

Base already has **8**. Absent-from-base candidates total **15** (9 only in `russell-capital`,
6 in both donors) — not 18.

**Blocking question:** name the 18, or approve the 15 above as the set. PR-3 does not run
until this is settled.

---

## 2.6 Schema

**Base: 155 tables. Donors: 116.** All 116 donor tables exist in the base except **7**:

`engineUsageLogs` · `engineChains` · `engineChainRuns` · `clientReports` · `toolFavorites` ·
`toolUsage` · `pagePerformanceMetrics`

These are engine-chaining and telemetry tables, backing the donor-only routers
`engineChainingRouter.ts`, `analyticsRouter.ts` and `reportBuilderRouter.ts`. They are
**additive** — no base table is altered — which makes them a clean, low-risk phase (PR-4).

**Dialect note.** The base is MySQL (`mysqlTable`, `drizzle-orm/mysql2`).
`russell-capital-app` is PostgreSQL (`pgTable`, `postgres-js`), ported per its
`DEPLOY_NOTES.md`. **Take these 7 tables from `russell-capital` (MySQL), not from
`russell-capital-app`**, so no dialect translation is needed. The Postgres port is valuable
as a *documented pattern* if a future migration is wanted — it is not imported here.

---

## 2.7 Server modules

Base `server/`: **147** non-test modules. Donors: **49**, of which only 9–11 are identical to
the base. The 35–37 that differ are almost entirely `_core/` platform files — `env.ts`,
`index.ts`, `trpc.ts`, `oauth.ts`, `vite.ts`, `db.ts`, `llm.ts`, `storageProxy.ts` — which
differ because **the two builds target different hosts** (Railway/MySQL vs Manus or
Vercel/Postgres).

**Decision: the base wins every `_core/` file, without exception.** These are the files that
boot the live service. Importing a donor's `_core/index.ts` or `db.ts` would replace the
running server's host integration with another platform's. This is the single most dangerous
category in the entire consolidation and it is **closed to migration**.

Donor-only server modules — 3, all additive, all tied to §2.6:
`engineChainingRouter.ts` · `analyticsRouter.ts` · `reportBuilderRouter.ts` (PR-4).

---

## 2.8 Summary of what actually migrates

| Capability | Count | Phase |
|---|---:|---|
| Schema tables (additive, MySQL) | 7 | PR-4 |
| Server routers (additive) | 3 | PR-4 |
| Gamification pages | 15 *(pending your confirmation)* | PR-3 |
| Donor-only shared engines | 3 | PR-8 |
| Shared modules needing a diff decision | 2 | PR-6, PR-7 |
| Selected page/content modules | TBD from 391 | PR-5 |
| Sacred Seven | **0 — already present** | — |
| Behavioral schema | **0 — already identical** | — |
| `_core/` server files | **0 — closed** | — |

The honest headline: **the approved, evidenced migration surface is roughly 28 items plus a
selected subset of pages — not 391.**
