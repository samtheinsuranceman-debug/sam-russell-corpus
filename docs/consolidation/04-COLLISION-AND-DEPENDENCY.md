# 4 — Route Collision and Dependency Report for the 391 Pages

**Compiled:** 2026-09-20
**Donor:** `samtheinsuranceman-debug/russell-capital` @ `863b3f0`
**Target:** `sam-russell-corpus/russell-capital-systems` @ `76ed5f2`

Generated mechanically by parsing both `App.tsx` files for `<Route>` elements
and `lazy(() => import(...))` bindings, resolving each donor route to its
component file, and checking every `@shared/*` and `@/components/*` import
against the target tree.

**Machine-readable artifacts in this directory:**

| File | Contents |
|---|---|
| `route-collision-report.json` | Every donor route with its file, LOC and missing imports |
| `collision-size-comparison.json` | All 210 collisions with donor LOC, live LOC and delta |
| `donor-routes-clean.txt` | The 244 routes that import nothing missing |
| `donor-routes-blocked.txt` | The 147 blocked routes, each with its blocking components |
| `route-collisions.txt` | The 210 colliding paths |

---

## 4.1 Headline numbers

```
Donor portal routes:                             601
Target portal routes:                            306
Donor routes absent from target:                 391
Route paths present in BOTH (collisions):        210

Of the 391:
  Clean — every import resolves in target:       244
  Blocked on components only:                    147
  Blocked on missing shared modules:               0
  Component file could not be resolved:            0

Of the 210 collisions:
  Target implementation already larger:          172
  Donor larger:                                   20
  Equal / not size-comparable:                    18
```

---

## 4.2 The dependency finding that shapes the plan

**Not one of the 391 pages is blocked on a missing shared module.** The
target's 174 shared modules are a practical superset of the donor's 63. The
entire blocking set is **five React components**:

| Component | Pages blocked | Decision |
|---|---|---|
| `components/ProjectionChart50yr` | **122** | **Port.** Recharts-based 50-year projection chart. |
| `components/CalculatorIntegration` | **113** | **Port.** Cross-calculator wiring surface. |
| `components/CalculatorPDFExport` | 27 | **Port.** Target already has `pdfkit`. |
| `components/ComboPageWrapper` | 8 | **Port.** Small wrapper. |
| `components/NeuralMeshInterceptor` | 1 | **Do not port.** See below. |

Many pages need more than one, so the four recommended ports do not sum to
147 — they cover it.

### Why `NeuralMeshInterceptor` is excluded

In the donor it is a 512-line component mounted once in `AppShell` that
auto-wires **every** route into a data bus, an AI brain, a client context and
cross-calculator results, via a route → `PageIntelligence` map. Its own
comments describe it as solving "281+ orphaned pages".

Adopting a platform-wide interception layer to unblock **one** page is a bad
trade, and it would change behaviour on all 331 existing routes. The single
page that needs it should be either adapted or deferred. If the pattern is
wanted on its own merits, that is a separate proposal with its own evaluation.

---

## 4.3 The 210 collisions

**Default resolution: the target wins.** In 172 of 210 the target
implementation is already larger, and under the matrix's incumbency rule a tie
also goes to the target. That leaves roughly 20 routes needing a real decision.

### Collisions where the donor is materially larger

Ordered by gap. **LOC is a screening signal for where to look — never the
decision.** Each of these requires both pages read and the difference stated
before anything moves.

| Route | Donor | Target | Gap | Note |
|---|---|---|---|---|
| `/portal/carrier-ratings` | 1,713 | 94 | +1,619 | Target is a stub. Largest gap found. |
| `/portal/carrier-rates` | 1,713 | 94 | +1,619 | **Same component as the line above** — the donor registers one component on two paths. Only one route should survive the migration. |
| `/portal/legal-payment-folder` | 1,198 | 29 | +1,169 | Target is a stub. |
| `/portal/ai-meeting-notes` | 1,046 | 31 | +1,015 | Target is a stub. |
| `/portal/billing` | 987 | 25 | +962 | **Touches Stripe. Not a simple swap — treat as sensitive.** |
| `/portal/ai-brain-hub` | 495 | 178 | +317 | |
| `/portal/myga-waterfall` | 299 | 126 | +173 | Target also has `/portal/myga-fixed-rate`; resolve both together or the result is two MYGA pages. |
| `/portal/market-pulse` | 267 | 133 | +134 | |
| `/portal/ai-assist` | 1,279 | 1,151 | +128 | |
| `/portal/ai` | 1,279 | 1,151 | +128 | Same donor component as `/portal/ai-assist`. |
| `/portal/meeting-prep` | 195 | 121 | +74 | |
| `/portal/long-term-care` | 208 | 164 | +44 | |

Gaps below ~30 LOC (`household-wealth` +29, `mortgage-killer-v2` +25,
`tax-combos` +3, `secret-secrets` +3, `war-story-generator` +2, `toilet` +2,
`time-machine` +2, `team-management` +2) are noise. **Target wins all of them
on incumbency.** They are listed in the JSON for completeness and need no
review.

### Duplicate donor registrations to resolve before import

The donor registers one component on two paths in at least three cases:

- `/portal/carrier-ratings` and `/portal/carrier-rates` → `CarrierRatings.tsx`
- `/portal/ai` and `/portal/ai-assist` → `AiAssist.tsx`
- `/portal/alternative-investments` and `/portal/alt-investment-dd` → `AlternativeInvestmentDueDiligence.tsx`

Importing both sides of any of these reproduces the donor's own duplication in
the target. One canonical path each; the other is dropped, not aliased.

---

## 4.4 The 244 clean routes

Every import resolves against the target today. These are the low-risk
migrations and they form Phase 4.

They are **not** a single PR. Grouped by capability area for review, with the
counts from `donor-routes-clean.txt`:

| Group | Approximate count | Examples |
|---|---|---|
| Advanced estate and trusts | ~30 | `/portal/grat`, `/qprt-advanced`, `/slat-deep-dive`, `/idgt-advanced`, `/dynasty-trust-planner`, `/gst-trust`, `/trust-decanting`, `/section-2701` |
| Alternatives and private markets | ~25 | `/portal/private-credit`, `/pe-secondary-market`, `/dst-analyzer`, `/structured-notes`, `/direct-indexing`, `/private-reit` |
| Advanced markets | ~20 | `/portal/ppli-modeler`, `/ppva`, `/split-dollar`, `/executive-bonus`, `/serp-analyzer`, `/life-settlement` |
| Family office | ~12 | `/portal/family-office`, `/family-bank`, `/family-constitution`, `/cross-border-wealth` |
| Practice operations | ~30 | `/portal/pipeline`, `/team-management`, `/referral-tracking`, `/document-vault`, `/webhooks`, `/email-campaigns` |
| Tax — advanced | ~25 | `/portal/qsbs`, `/199a-optimizer`, `/nii-surtax`, `/expat-tax`, `/fbar-fatca`, `/cost-segregation-engine` |
| Retirement and Medicare | ~15 | `/portal/retirement-projection`, `/medicare-irmaa`, `/income-floor-strategy`, `/sequence-of-returns` |
| Everything else | remainder | See `donor-routes-clean.txt` |

**Caveat that applies to all 244.** "Clean" means *imports resolve*. It does
not mean the page renders correctly, that its numbers are right, or that it
matches the target's house conventions (`AppShell`, the `Verified<T>` sourcing
pattern, weaknesses-before-strengths). Each migration PR must typecheck,
build, and include at least a module-load smoke test — the donor repo has no
equivalent of the target's 225-file suite, so **nothing arrives with test
coverage attached**.

---

## 4.5 What was deliberately not measured

Stated so the report is not read as more than it is.

1. **Runtime behaviour.** Static import analysis only. A page whose imports
   all resolve can still throw on render.
2. **Visual and UX conformance.** Whether a donor page matches the target's
   design system was not assessed.
3. **Numerical correctness.** No donor calculator's output was verified
   against the target's engines. Where a donor page and a target engine both
   claim to compute the same thing, that is a per-PR verification task.
4. **tRPC surface.** Donor pages calling procedures the target does not expose
   would fail at runtime, not at import. **This is the most likely source of
   surprise during Phase 4** and each PR must check its page's `trpc.*` calls
   against the target router.
5. **`@ts-nocheck` contamination.** The donor uses it widely. A page carrying
   it will typecheck trivially while hiding real errors. **Every migration PR
   must strip `@ts-nocheck` from what it imports and fix what that reveals.**
