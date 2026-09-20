# 04 — Route Collision and Dependency Report

**Foundation PR, deliverable 4 of 6.**
**Machine-readable companion:** `route-collisions.json` (all 236 collisions with
donor file path and line count, plus the 395 + 1 importable routes).

---

## 4.1 — ROUTE COUNTS

| Source | Routes | Method |
|---|---|---|
| **Base** — `russell-capital-systems` | **330** | `dist/public/routes.json`, emitted by `pnpm build` |
| Base page registry | 309 | `docs/audit/pageRegistry.json` |
| Donor — `russell-capital-app` | 631 | parsed from `client/src/App.tsx` |
| Donor — `russell-capital` | 622 | parsed from `client/src/App.tsx` |

| Relationship | Count |
|---|---|
| **Collisions — same path, base and app, different implementations** | **236** |
| Importable from app — not in base | **395** |
| Importable from `russell-capital` — not in base or app | **1** |
| Full union if everything merged | 726 |

---

## 4.2 — ON THE "391 PAGES" FIGURE

The directive asks for a collision report on "the proposed 391 pages." The
nearest measured figure is **395 routes present in `russell-capital-app` and
absent from the base** — within rounding, and almost certainly the same set.

**Importable is not the same as safe.** Alongside those 395, there are **236
routes that already exist in the base under the same path with a different
implementation.** Together, 395 + 236 = 631, the app's full route count.

A bulk import of the app donor would therefore overwrite 236 base
implementations — several of which are covered by the base's 225 test files and
are named in the directive as not-to-overwrite.

**Ruling (from `02-CAPABILITY-MATRIX.md` §2.3): all 236 collisions resolve to
BASE.** None enters this consolidation. Each may be revisited later as its own
PR with a documented comparison and regression proof.

---

## 4.3 — THE DEPENDENCY FINDING

This is the part that changes the plan, and it would not have been visible from
route counts alone.

**The base and `russell-capital-app` are two different architectures.** The base
is not a subset of the app with fewer pages; they solved the same problems
differently.

| Module | In base | In app | Note |
|---|---|---|---|
| `components/ToggleHub.tsx` | **no** | yes | App's tab-consolidation pattern |
| `pages/hubs/` | **no** (0 files) | yes (41) | App's 41 consolidated hub pages |
| `context/FinancialDataContext.tsx` | **no** | yes | App's cross-page shared-field layer |
| `components/ResultReveal.tsx` | **no** | yes | |
| `navTree.ts` / `navConfig.ts` / `navMaster.ts` | **no** | yes | App's nav layer; base's nav lives in `AppShell.tsx` |
| `contexts/UnifiedDataBusContext` | **no** | yes | |
| `components/CalculatorIntegration` | **no** | yes | Base has `RelatedCalculators.tsx` instead |
| `components/ComboPageWrapper` | **no** | yes | |
| `hooks/useOrganismSkeleton` | **no** | yes | |
| `shared/routeManifest.ts` | **yes** | **no** | Base's mechanism; no app equivalent |
| `shared/*Engine.ts` (54) | **yes** | **no** | Base's engine layer |
| `shared/wealthGenome*` (6) | **yes** | **no** | |
| `useSharedField` usage | **0 files** | **306 files** | |

**Two consequences:**

1. **The base has its own consolidation mechanism and it is not ToggleHub.**
   The base's HEAD commit is *"Route manifest replaces the hard-coded count; each
   façade becomes one front door."* `shared/routeManifest.ts` documents the
   reasoning: a list instead of an integer, so two branches adding routes merge
   without conflict, and duplicate paths become visible where a `Set.size`
   assertion would swallow them. Importing ToggleHub and the 41 hub pages would
   add a second, competing consolidation pattern. **Not recommended.** Out of
   scope for this consolidation; revisit only as a deliberate architecture
   decision with its own PR.

2. **The 306-file shared-field layer cannot be imported piecemeal.** It is a
   cross-cutting architectural change touching 306 files in the donor. It is not
   in scope here and should not be attempted as part of any page migration.

---

## 4.4 — DEPENDENCY BLOCKERS ON THE 9 GAMIFICATION PAGES

The gamification import looked additive and low-risk. It is not a file copy.
Every one of the 9 pages imports at least one module the base does not have:

| Page | Missing dependencies in base |
|---|---|
| EliteShowdown | `contexts/UnifiedDataBusContext` |
| WealthOdyssey | `contexts/UnifiedDataBusContext` |
| MoatFortress | `contexts/UnifiedDataBusContext` |
| HolographicMirage | `contexts/UnifiedDataBusContext` |
| PredictiveInsightArena | `contexts/UnifiedDataBusContext` |
| WealthWarriorChallenges | `contexts/UnifiedDataBusContext` |
| StrategyComparisonArena | `components/CalculatorIntegration`, `hooks/useOrganismSkeleton` |
| GamifiedPavlovianEngagement | `contexts/UnifiedDataBusContext`, `components/CalculatorIntegration`, `components/ComboPageWrapper` |
| EntrainmentEngine *(page)* | `contexts/UnifiedDataBusContext`, `components/CalculatorIntegration`, `components/ComboPageWrapper` |

**Four shared modules gate all nine:** `UnifiedDataBusContext`,
`CalculatorIntegration`, `ComboPageWrapper`, `useOrganismSkeleton`.

**Three options, to be decided in the migration PR — not here:**

| Option | Description | Trade-off |
|---|---|---|
| **A — Adapt** *(recommended)* | Rewrite the 9 pages against the base's own equivalents: `ClientDataContext` / `StrategyContext` for the data bus, `RelatedCalculators` for `CalculatorIntegration`. | Most work per page. No new architecture. Keeps one data layer. |
| **B — Import the 4 modules** | Bring the shared modules across as-is, then copy the 9 pages unchanged. | Fast. Introduces a second data-bus pattern alongside the base's — the exact duplication this consolidation exists to end. |
| **C — Defer** | Leave the 9 pages out until the data-layer question is settled. | Zero risk. Base keeps 8/17. |

Note the base already holds `contexts/EntrainmentEngine.tsx` — the breathing
provider — with the correct 6 breaths/min tuning and a cited medical basis. Only
the *page* is missing, not the engine.

---

## 4.5 — WHAT THE ROUTE MANIFEST GUARANTEES

Any route added by a migration PR must also be added to
`shared/routeManifest.ts`. The base's smoke tests compare that list against the
routes actually registered in `App.tsx` and fail naming the specific paths that
differ, in both directions.

This is a genuine safety property and every migration PR inherits it:
**a route imported without a manifest entry fails the base's own tests.** No
additional tooling needed.
