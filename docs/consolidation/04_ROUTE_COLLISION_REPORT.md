# 4. Route Collision and Dependency Report

Covers the proposed 391 pages. Raw lists in `data/`; every figure is reproducible
from them with `comm`.

---

## 4.1 Where "391" comes from

The brief proposes 391 pages. That number is exact and its provenance is now known:

```
routes in russell-capital       620
minus routes already canonical −229
                               ────
new paths from russell-capital  391   ← the brief's figure
```

**391 is the `russell-capital` delta specifically** — not a union, and not the size
of the consolidated app.

## 4.2 The arithmetic that matters

| Set | Count |
|---|---:|
| Canonical routes today | 330 |
| rc-app routes | 612 |
| rc routes | 620 |
| rc-app ∩ canonical — already served, do not import | 227 |
| rc ∩ canonical — already served, do not import | 229 |
| rc-app ∖ canonical — new from rc-app | 385 |
| rc ∖ canonical — new from rc (**the brief's 391**) | **391** |
| **Contested: both donors add it, canonical lacks it** | **382** |
| Only rc-app offers | 3 |
| Only rc offers | 9 |
| **Union of genuinely new paths** | **394** |
| **Total if everything merged** | **724** |

### Three consequences

**(a) 382 of the 391 are contested.** Almost every page the brief proposes is
offered by *both* donors. These are not 391 independent imports — they are 382
two-way choices plus 12 uncontested pages. The work is *deciding*, not copying.

**(b) The union is 394, not 391.** Taking rc's 391 alone silently drops the 3 pages
only rc-app has. The complete new-page set is 394.

**(c) The consolidated app would serve 724 routes, not 391.** More than double
today's 330. Route count is a proxy for surface area, bundle size, and test burden;
724 should be an explicit decision, not a by-product.

## 4.3 Direct collisions with canonical — do not overwrite

**227–229 paths already exist in canonical and in the donors.** Every one is a
potential silent overwrite. The matrix (§2) resolves all of them the same way:
**canonical wins, import nothing.** The CI gate in §5 enforces this by failing any
PR that modifies a canonical route's binding without an accompanying comparison
document.

## 4.4 The 12 uncontested pages

Lowest-risk batch. Only one donor offers each, so there is no choice to make.

**Only `russell-capital` (9)** — `data/routes.only-rc-9.txt`:
```
/portal/elite-showdown        /portal/pavlovian-engagement
/portal/entrainment-engine    /portal/predictive-arena
/portal/holographic-mirage    /portal/strategy-comparison
/portal/moat-fortress         /portal/wealth-odyssey
                              /portal/wealth-warrior
```

**Only `russell-capital-app` (3)** — `data/routes.only-rc-app-3.txt`:
```
/portal/lab   /portal/nav-placeholder   /portal/reveal-demo
```

`/portal/nav-placeholder` and `/portal/reveal-demo` read as scaffolding. They should
be confirmed as real destinations or dropped — a placeholder route in a 724-route
app is a page that will never be finished.

## 4.5 Dependency analysis

What the donor pages need that the canonical base does not have. **The surface is
small.**

### Shared modules — 4 missing (all engines)
```
clientOnboardingEngine.ts        familyTreeFinancialEngine.ts
complianceDocGeneratorEngine.ts  multiCurrencyWealthEngine.ts
```
The canonical `shared/` is otherwise a strict superset (174 vs 62).

### Database tables — 7 missing
```
clientReports          engineUsageLogs         toolFavorites
engineChainRuns        pagePerformanceMetrics  toolUsage
engineChains
```
Six of the seven are **analytics/telemetry storage**, matching the rc-app analytics
suite in §2.5 exactly. The dependency is coherent: that suite needs those tables.
`clientReports` is the only one outside that group.

### Dependency ordering this forces

```
Phase C: 4 engines ──┐
                     ├──> Phase B: page batches that use them
Phase D: 7 tables ───┘
```
Pages depending on an engine or table cannot migrate before it. This is why the
phased plan puts engines and schema **before** page batches.

### Limit of this analysis

Routes bind components through a `gated()` wrapper rather than a direct
`component={Name}` reference, so path→component→import resolution is not
mechanical from `App.tsx` alone. **Per-page dependency resolution is therefore a
per-batch activity in Phase B**, not a claim this document makes. What *is*
established here is the outer bound: the only shared-module and schema gaps across
all 394 pages are the 4 engines and 7 tables above.

## 4.6 Duplicate-path check within canonical

```
App.tsx <Route> entries:  330
unique paths:             330
```
No duplicate registrations. The manifest's stated advantage over a count — that a
`Set` hides duplicates — currently has nothing to hide. Preserve this.

## 4.7 Recommended batching for Phase B

394 pages in one PR is unreviewable. Proposed order, lowest risk first:

| Batch | Contents | Size | Risk |
|---|---|---:|---|
| B1 | 12 uncontested pages (§4.4) | 12 | Low — no choice to make |
| B2 | Contested pages where both donors are byte-identical | TBD | Low — mechanical |
| B3 | Contested pages differing only cosmetically | TBD | Medium |
| B4 | Contested pages with real divergence | TBD | High — needs per-page comparison |
| B5 | Pages depending on the 4 engines / 7 tables | TBD | Blocked on C and D |

B2–B5 sizes require a byte-level diff of the 382 contested pages, which is the
first task *inside* Phase B and deliberately not pre-judged here.
