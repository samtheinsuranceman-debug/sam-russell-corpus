# 4 · Route Collision and Dependency Report

**Date:** 2026-09-20
**Machine-readable source:** `data/route_collision_report.json`
**Raw extraction:** `data/raw_routes.json`

Routes were extracted from each tree's `client/src/App.tsx` by matching
`<Route path="…">`, with the bound component captured from
`component={gated(X, …)}` / `component={X}`.

---

## 1 · Where "391" comes from

The brief proposes 391 pages. That figure is **exactly correct** and resolves to
one specific set:

```
|R − C| = 391
```

where `R` = routes in donor `russell-capital` (`origin/main`) and `C` = routes in
the canonical base. **391 is the number of routes in `russell-capital` that do
not exist in the base.** It is not a page count and it is not the migration
backlog.

Every count, measured:

| Quantity | Value |
|---|---:|
| Canonical base routes | **330** |
| `russell-capital` routes | 620 |
| `russell-capital-app` routes (declared / unique) | 653 / **612** |
| `russell-capital` routes **not** in base | **391** ← the brief's figure |
| `russell-capital-app` routes **not** in base | 385 |
| Union of both donors **not** in base | **394** |
| Union of all three trees | **724** |
| Base page registry (`pageRegistry.json`) | 309 pages |

**The 391 are not 391 migrations.** Of them, 382 also exist in
`russell-capital-app`, and every one must be triaged against the base before it
becomes a candidate. Only **9** are confirmed migrations today (§3).

---

## 2 · Internal duplicates — a defect in one donor

A duplicate route is the same path registered twice in one `App.tsx`. `wouter`
matches the first declaration, so the second component is **unreachable**.

| Tree | Internal duplicates |
|---|---:|
| **Canonical base** | **0** |
| `russell-capital` | **0** |
| `russell-capital-app` | **41** |

The 41 include `/portal/mortgage-killer`, `/portal/roth-conversion`,
`/portal/premium-financing`, `/portal/estate-tax`, `/portal/tax-loss-harvesting`,
`/portal/medicare-irmaa`, `/portal/split-dollar`, `/portal/ppli` — full list in
`data/route_collision_report.json → donor_app_internal_duplicates`.

Two consequences:

1. **41 components in `russell-capital-app` are dead code** behind a shadowed
   route. Any count taken from that tree overstates its working surface.
2. It is direct evidence for the base's design choice. The base's
   `shared/routeManifest.ts` header states that a `Set`-based count cannot see a
   duplicate — "a duplicate route … is invisible to `.size` because a Set
   swallows it, but visible here." The tree without a manifest accumulated 41;
   the tree with one has zero.

**This is the strongest single argument against merging `russell-capital-app`
wholesale.**

---

## 3 · Confirmed migrations — 9 routes, zero collisions

These are the only routes in any donor that (a) do not exist in the base and
(b) do not collide with anything. They are exactly the 9 routes exclusive to
`russell-capital`, and exactly the 9 gamification routes the base is missing.

| # | Route | Component | Lines | Collides |
|---|---|---|---:|---|
| 1 | `/portal/wealth-warrior` | `WealthWarriorChallenges` | 257 | none |
| 2 | `/portal/wealth-odyssey` | `WealthOdyssey` | 314 | none |
| 3 | `/portal/elite-showdown` | `EliteShowdown` | 260 | none |
| 4 | `/portal/holographic-mirage` | `HolographicMirage` | 247 | none |
| 5 | `/portal/predictive-arena` | `PredictiveInsightArena` | 315 | none |
| 6 | `/portal/moat-fortress` | `MoatFortress` | 278 | none |
| 7 | `/portal/pavlovian-engagement` | `GamifiedPavlovianEngagement` | 703 | none |
| 8 | `/portal/entrainment-engine` | `EntrainmentEngine` | 718 | none |
| 9 | `/portal/strategy-comparison` | `StrategyComparisonArena` | 119 | none |

Total: **3,211 lines** across 9 files.

---

## 4 · Dependency analysis for the 9

Resolved every `@/…` import against the base. **14 of 18 dependencies already
exist in the base. Four do not.**

| Dependency | In base | Needed by |
|---|:--:|---|
| `components/AppShell` | ✅ | 6 |
| `components/PageInsights` | ✅ | 9 |
| `contexts/AIBrainContext` | ✅ | 2 |
| `contexts/ClientDataContext` | ✅ | 3 |
| `lib/trpc` | ✅ | 3 |
| `_core/hooks/useAuth` | ✅ | 1 |
| `components/ui/*` (badge, button, card, progress, tabs, slider, toggle, input) | ✅ | all |
| **`contexts/UnifiedDataBusContext`** | ❌ | **8 of 9** |
| **`components/CalculatorIntegration`** | ❌ | 3 |
| **`components/ComboPageWrapper`** | ❌ | 2 |
| **`hooks/useOrganismSkeleton`** | ❌ | 1 |

Per page:

| Page | Missing dependencies |
|---|---|
| `WealthWarriorChallenges` | `UnifiedDataBusContext` |
| `WealthOdyssey` | `UnifiedDataBusContext` |
| `EliteShowdown` | `UnifiedDataBusContext` |
| `HolographicMirage` | `UnifiedDataBusContext` |
| `PredictiveInsightArena` | `UnifiedDataBusContext` |
| `MoatFortress` | `UnifiedDataBusContext` |
| `GamifiedPavlovianEngagement` | `UnifiedDataBusContext`, `CalculatorIntegration`, `ComboPageWrapper` |
| `EntrainmentEngine` | `UnifiedDataBusContext`, `CalculatorIntegration`, `ComboPageWrapper` |
| `StrategyComparisonArena` | `CalculatorIntegration`, `useOrganismSkeleton` |

### Likely base equivalents — to confirm, not assume

The base may already solve three of these under different names:

| Donor module | Candidate base equivalent |
|---|---|
| `components/CalculatorIntegration` | `hooks/useCalculatorIntegration.ts` + `components/RelatedCalculators.tsx` + `components/CalculationSyncBar.tsx` |
| `contexts/UnifiedDataBusContext` | no obvious equivalent — base has `AIBrainContext`, `ClientDataContext`, `StrategyContext`, `AccessContext`, `DisclaimerContext`, `ThemeContext`, `EntrainmentEngine` |
| `hooks/useOrganismSkeleton` | no equivalent in base `hooks/` |
| `components/ComboPageWrapper` | no equivalent in base `components/` |

Note the base **already has `contexts/EntrainmentEngine.tsx`** — the *context*
exists; only the *page* `/portal/entrainment-engine` is missing.

**This dependency shape dictates the PR split.** `UnifiedDataBusContext` is a
prerequisite for 8 of 9 pages and must land, or be mapped to a base equivalent,
in its own PR first. See [06](06_PHASED_PR_PLAN.md) PR-05a/b/c.

---

## 5 · Collisions — 229 routes, 6 real conflicts

229 routes exist in both `russell-capital` and the base. For 223 of them the
bound component has the **same name** in both trees — same feature, likely
divergent implementation, base wins by default.

**Six collide with a genuinely different component:**

| Route | Base component | `russell-capital` component |
|---|---|---|
| `/` | `FrontDoor` | `Landing` |
| `/portal/long-term-care` | `LongTermCare` | `LongTermCarePlanner` |
| `/portal/market-pulse` | `MarketPulsePage` | `MarketPulseSentinel` |
| `/portal/meeting-prep` | `MeetingPrepPage` | `AdvisorMeetingPrep` |
| `/portal/mortgage-killer-v2` | `MortgageKillerV2Page` | `MortgageKillerV2` |
| `/portal/myga-waterfall` | `MygaWaterfallPage` | `MYGAWaterfallComparison` |

`/` is the significant one: the base serves a `FrontDoor` component, and the
base's HEAD commit message is *"Route manifest replaces the hard-coded count;
each façade becomes one front door."* The base's root is a deliberate, recent
redesign. **Do not replace it.**

The other five are named-variant pairs needing a feature-level comparison before
anyone decides the base is missing something. **None is proposed for migration.**
They are the agenda for the PR-08 triage.

`russell-capital-app` collides with the base on 227 routes; not separately
enumerated, since nothing is being migrated from that tree's route surface
beyond the 3 exclusives.

---

## 6 · Routes exclusive to `russell-capital-app` — 3

| Route | Purpose |
|---|---|
| `/portal/lab` | "The Lab" — L2 surface for the app's `ROUTE_LAYER` scheme |
| `/portal/nav-placeholder` | Renders "coming soon" nav leaves with a breadcrumb trail |
| `/portal/reveal-demo` | Demo page for its `ResultReveal` animation |

All three exist only to serve that tree's nav architecture, which is **deferred**
(capability matrix §2.7). They are therefore deferred with it, not migrated on
their own. **PR-07, gated on the PR-10 nav decision.**

---

## 7 · The remaining 382

382 routes exist in both donors but not in the base. They are **not** a backlog —
they are a triage queue. Each needs, before it can become a candidate:

1. Does the base serve the same capability under a different route?
2. Does the base's page registry already score this capability?
3. Is it one of the 41 shadowed routes in `russell-capital-app` (i.e. dead there)?
4. Does it depend on modules absent from the base?

**PR-08 produces that triage as a report.** It migrates nothing. Attempting these
as a block is precisely the wholesale merge the brief rules out.

---

## 8 · Reproducing

```bash
python3 consolidation/data/regenerate.py
git diff --exit-code consolidation/data/   # expect no change on an unchanged tree
```

The script hard-codes the three tree paths at the top; adjust for your checkout.
