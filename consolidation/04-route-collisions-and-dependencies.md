# 4 — Route collision and dependency report

Scope: the **391 candidate routes** from `russell-capital`, plus the 384 from
`russell-capital-app`, measured against the base's 330.

---

## 4.1 What "391" is

The figure is a **route count, not a page count**: `russell-capital` registers exactly
**391 route paths that the live build does not have**. Reproduce with
`consolidation/data/candidate-routes-russell-capital.txt`.

It is the **maximum candidate surface** from that donor — the ceiling, not a proposal. Your
own scope for `russell-capital` is "the Sacred Seven, behavioral schema, and individually
selected page/content modules", and §2 shows the first two are already in the base. So the
391 is the pool that the "individually selected" subset is drawn *from*.

Base after a hypothetical full import would be 330 + 391 = **721 routes**. That is recorded
for completeness and is **not** recommended.

---

## 4.2 Collisions — same path, different component

This is the short, dangerous list. Only **6** paths collide.

| Route | Base component | `russell-capital` component | Risk | Decision |
|---|---|---|---|---|
| `/` | `FrontDoor` | `Landing` | **HIGH** | **Base wins.** `/` is the live front door. Never overwritten. |
| `/portal` | `InfiniteScroll` | `Dashboard` | **HIGH** | **Base wins.** The portal index is the live authenticated landing. *(collides via `russell-capital-app` only)* |
| `/portal/long-term-care` | `LongTermCare` | `LongTermCarePlanner` | MED | **Base wins** pending diff. Different names, possibly different scope. |
| `/portal/market-pulse` | `MarketPulsePage` | `MarketPulseSentinel` | LOW | **Base wins.** Base is the `*Page` wrapper pattern. |
| `/portal/meeting-prep` | `MeetingPrepPage` | `AdvisorMeetingPrep` | LOW | **Base wins.** |
| `/portal/mortgage-killer-v2` | `MortgageKillerV2Page` | `MortgageKillerV2` | LOW | **Base wins.** |
| `/portal/myga-waterfall` | `MygaWaterfallPage` | `MYGAWaterfallComparison` | LOW | **Base wins.** |

`russell-capital-app` collides on the same set plus `/portal`. Full data:
`consolidation/data/route-collisions-*.tsv`.

**Pattern.** Four of the six are the base's `*Page` wrapper versus the donor's bare
component — the base has already wrapped and re-homed these. The collisions are therefore
mostly *evidence the base is ahead*, not conflicts to resolve.

**Rule adopted:** no migration PR may change the component bound to an existing route. If a
donor page is judged better, it lands at a **new path** and the swap is a separate,
explicitly-approved PR with a side-by-side comparison.

---

## 4.3 Dependency analysis — what the 391 actually need

All 391 candidate routes were resolved to their page files (390 resolved; 1 uses a non-lazy
component) and their imports walked against the base.

### `@shared/*` — **zero missing**

> All 391 candidate pages reference **0** shared modules the base does not already have.

This is the most important number in this document. The base's 187-module `shared/` is a
**complete superset** of what every candidate page needs. No engine, no calculator, no
constant has to be ported to make any of these pages typecheck. It also independently
confirms §2's decision to keep the base's engines.

### `@/components/*` — 5 missing of 25

| Missing component | Needed because |
|---|---|
| `CalculatorIntegration` | cross-calculator wiring wrapper |
| `CalculatorPDFExport` | per-calculator PDF export |
| `ComboPageWrapper` | wrapper for the tax-combo pages |
| `NeuralMeshInterceptor` | data-bus interceptor |
| `ProjectionChart50yr` | 50-year projection chart |

### `@/contexts/*` — 2 missing of 4

`OrganismContext` · `UnifiedDataBusContext`

### `@/lib/*` — 1 missing of 2

`toolSearchIndex`

### tRPC namespaces — 5 missing of 13

The 391 pages call **13** tRPC namespaces. The base's `appRouter` exposes **150**. Missing:

`analytics` · `chains` · `comboRecommend` · `healthDashboard` · `toolAnalytics`

These map onto the donor-only server modules and tables in §2.6/§2.7
(`analyticsRouter.ts`, `engineChainingRouter.ts`, `reportBuilderRouter.ts`, and the
`engineChain*` / `toolUsage` / `pagePerformanceMetrics` tables), which is why **PR-4 must land
before any page phase.**

---

## 4.4 Total prerequisite surface

To make *any* of the 391 compile, exactly **13 items** must exist first:

| Kind | Count | Phase |
|---|---:|---|
| Components | 5 | PR-2 |
| Contexts | 2 | PR-2 |
| lib modules | 1 | PR-2 |
| tRPC routers | 5 (3 files + tables) | PR-4 |

That is the whole prerequisite. Thirteen items unlock a 391-route pool — which is why the
phased plan front-loads them.

---

## 4.5 Manifest and count invariants

The base keeps three counts in agreement, and CI enforces it:

```
<Route path=…> in App.tsx   == 330
ROUTE_MANIFEST.length        == 330
dist/public/routes.json      == 330
```

`server/grok-merge.smoke.test.ts` enforces this: `diffRoutes()` reports `missing` and
`unexpected` in both directions with the specific paths named, plus `duplicates`, and then
asserts `currentRoutes.size === ROUTE_COUNT`. **Every page-adding PR raises all three counts
together**, adding one manifest line per route. A PR that adds a `<Route>` without its
manifest line fails that test — by design, and the gate is not to be weakened.

> `scripts/reconcile-route-manifest.mjs` is a separate, easily-confused thing: it maintains
> `audit/route_manifest.json` (232 entries, the page-audit corpus) and it **writes** rather
> than checks. It is not the gate for `shared/routeManifest.ts`.
