# 4 — Route collision and dependency report

Scope: the page set the plan calls "the proposed 391 pages." All figures
measured against `origin/master` @ `76ed5f2`.

## 4.1 Where the number 391 comes from — and what it is now

391 is exactly the count of routes declared in `russell-capital-app` that were
absent from the live build **at an earlier commit**. Against current `master`
the same measurement gives **385**: `master` has since absorbed six of them.

| Measurement | Live routes | New from `russell-capital-app` |
|---|---:|---:|
| Earlier branch (`b4773a9`) | 266 | **391** |
| `origin/master` (`76ed5f2`) | 330 | **385** |

Treat 391 as a label for the set, not a target. **Every migration PR must
recompute its own delta at the moment it opens** (`tools/extract_routes.py`).

## 4.2 Collisions with the live build

| Donor | Routes | Collide with live | Byte-identical | **Divergent** | New |
|---|---:|---:|---:|---:|---:|
| russell-capital | 660 | 267 | 29 | **238** | 393 |
| russell-capital-app | 612 | 227 | 0 | **227** | 385 |

**494 collision instances across the two donors, of which 29 are byte-identical
and 465 are divergent implementations of a route the live build already
serves.** Under the rule in §2.1 the live version wins all 494. None is in the
migration surface, and no migration PR may modify a file backing an existing
live route without the regression proof §2.1 requires.

That `russell-capital-app` has **zero** byte-identical collisions is expected,
not alarming: it is a separate lineage, so even unchanged pages differ in
imports and formatting.

## 4.3 Donor-versus-donor collisions — the real decision

This is the finding that reshapes the plan. Of the 385 new routes from
`russell-capital-app`:

| | Count |
|---|---:|
| Also declared by `russell-capital` | **384** |
| Byte-identical in both donors | 164 |
| **Divergent between the two donors** | **220** |
| Unique to `russell-capital-app` | **1** (`/portal/nav-placeholder`) |

Among the 220 divergent pages, `russell-capital-app` is the larger file in
**211** and the smaller in **0** (9 are equal length). It is consistently the
later, fuller implementation of the shared surface.

**So the migration question is not "import 391 pages from one donor."** It is:
for 220 pages, choose between two donor implementations; for 164, either will
do; and one page is a placeholder that should not be imported at all.

`russell-capital` additionally declares **9 routes neither live nor
`russell-capital-app` has**, and they are its distinctive contribution:
`/portal/elite-showdown`, `/portal/entrainment-engine`,
`/portal/holographic-mirage`, `/portal/moat-fortress`,
`/portal/pavlovian-engagement`, `/portal/predictive-arena`,
`/portal/strategy-comparison`, `/portal/wealth-odyssey`,
`/portal/wealth-warrior`.

## 4.4 Pattern-level collisions

- **Parameterised routes among the 385 new: 0.** Every incoming route is a
  static path, so none can shadow or be shadowed by a wildcard.
- **Live parameterised routes: 12** — `/client-portal/:token`, `/for/:slug`,
  `/portal/alt-credit/:slug`, `/portal/clients/:id`, `/portal/mechanism/:slug`,
  `/portal/mechanism/:slug/providers`, `/portal/mechanism/:slug/sequences`,
  `/portal/secret-secrets/:id`, `/portal/tax-combos/:id`,
  `/shared-slides/:token`, `/shared/:token`, `/video/:token`.
- **New static routes that would sit at the same depth beneath a live
  parameterised prefix: 0.** No `<Switch>` ordering hazard exists in this set.

This is a clean result and it should be re-checked per PR, because it is a
property of the set being imported, not a permanent fact.

## 4.5 Dependency report

All 385 pages were parsed for imports and each specifier resolved against both
trees.

**New npm packages required: 0.** Every external import the 385 pages make is
already a dependency of the live build. No `package.json` change, no lockfile
change, no new supply-chain surface.

**Internal modules required that live does not have: 18**, totalling 9,447
lines. This is the whole prerequisite set, and it is heavily shared — five
modules carry 621 of the 385 pages' import edges:

| Imported by | Lines | Also in `russell-capital` | Module |
|---:|---:|---|---|
| 212 | 131 | identical | `@/context/FinancialDataContext` |
| 114 | 262 | identical | `@/components/CalculatorPDFExport` |
| 105 | 174 | identical | `@/components/ProjectionChart50yr` |
| 100 | 715 | identical | `@/components/CalculatorIntegration` |
| 90 | 111 | identical | `@/components/StateTaxSelector` |
| 54 | 197 | identical | `@/contexts/UnifiedDataBusContext` |
| 24 | 44 | identical | `@/components/ToggleHub` |
| 11 | 107 | identical | `@/contexts/OrganismContext` |
| 6 | 135 | identical | `@/components/ResultReveal` |
| 6 | 104 | identical | `@/components/ComboPageWrapper` |
| 2 | 605 | identical | `@/hooks/useOrganismEyes` |
| 2 | 964 | identical | `@/hooks/useOrganismNervousSystem` |
| 1 | 338 | identical | `@/hooks/useOrganismDeepIndex` |
| 1 | 186 | identical | `@/hooks/useOrganism` |
| 1 | 512 | identical | `@/components/NeuralMeshInterceptor` |
| 1 | 614 | identical | `@/data/physicianSpecialtyDefaults` |
| 1 | 718 | identical | `@/hooks/useOrganismSkeleton` |
| 1 | 3530 | **differs** | `@/lib/toolSearchIndex` |

Seventeen of the eighteen are **byte-identical in both donors**, so for those the
donor choice is moot. Only `toolSearchIndex.ts` differs between donors, it is
the largest file in the set at 3,530 lines, and exactly one page imports it —
so it can be deferred out of the critical path entirely.

**This is why PR-1 in §6 is the 18 prerequisites and nothing else.** They are a
closed set, they add no dependencies, and until they land no page can compile.

Machine-readable: `data/dependency_report.json`, `data/prerequisite_modules.json`,
`data/collision_detail.json`.
