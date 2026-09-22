# PR-3b — what was ported, and the seven pages that were not

**Branch:** `claude/pr-3b-portable-pages-6dwkg2` off `master` (`76ed5f2`).
**Ported:** 106 pages, 106 new routes, 106 menu entries. Manifest 330 → 436.

---

## The selection

113 pages in `russell-capital-app` need no infrastructure this build lacks —
they import only components canonical already has. Of those:

| | |
|---|---:|
| Candidates | 113 |
| **Ported** | **106** |
| Deferred as contested | 7 |
| Stubs excluded before selection (<40 lines) | 0 in this set |

Every ported page is additive. **No existing route, component, engine or test
was modified.** 11 of the 106 had no route in the donor either — they were page
files nobody had wired up — and were given kebab-case slugs derived from their
component name, each checked against the manifest for collision.

---

## The seven not ported

These are the duplicates. Porting them is exactly what "merge without creating
duplicates" forbids, so each is recorded here with evidence instead.

### A. Four would have collided with a route canonical already serves

| Route | Canonical serves | Donor offers |
|---|---|---|
| `/portal/myga-waterfall` | `MygaWaterfallPage` (126 L) | `MYGAWaterfallComparison` (299 L) |
| `/portal/long-term-care` | `LongTermCare` (164 L) | `LongTermCarePlanner` (208 L) |
| `/portal/mortgage-killer-v2` | `MortgageKillerV2Page` (201 L) | `MortgageKillerV2` (225 L) |
| `/portal/meeting-prep` | `MeetingPrepPage` (121 L) | `AdvisorMeetingPrep` (195 L) |

**Here the donor's version may genuinely be better**, and that is a replacement
decision, not an addition.

Worked example — `/portal/myga-waterfall`:

```
canonical MygaWaterfallPage       donor MYGAWaterfallComparison
  React, useState                   React, useState, useMemo
  Button, ChevronRight              12 lucide icons
  (no chart)                        AreaChart, BarChart, ComposedChart, Legend…
                                    PageInsights
```

Canonical's is a plain form. The donor's has real charting. But replacing a
live page is precisely what the program rules say requires "a documented
comparison and regression proof" — so it is proposed, not done.

**Recommendation:** take the donor's version for `myga-waterfall` and
`meeting-prep` (materially richer), and leave `long-term-care` and
`mortgage-killer-v2` alone (marginal difference, not worth churn). Awaiting a
ruling either way — nothing has been changed.

### B. Three are thin duplicates of far deeper canonical pages

| Donor page | Canonical equivalent | Verdict |
|---|---|---|
| `TaxLossHarvesting` (231 L) | `TaxLossHarvestingScanner` (**1,322 L**) | canonical wins |
| `PremiumFinancingCalculator` (202 L) | `PremiumFinancing` (**1,240 L**) | canonical wins |
| `FinancialNerveCenter` (176 L) | `NerveCenter` (**646 L**) | canonical wins |

Not close, and not a judgment call. **No ruling needed** — these should never
be ported. Recorded so nobody re-proposes them.

Line count is a weak quality signal in general and was deliberately not used on
its own anywhere else in this audit. At 6:1 with the same subject matter it is
sufficient.

---

## Two defects fixed on the way in

Both are donor content breaking a rule this repository enforces and the donor
did not have.

### 1. False patent marking — the serious one

`EngineChainingPipeline` and `InnovationDashboard` shipped the words
**"patent-pending"**. Nothing is on file. `server/patentClaimGuard.test.ts`
exists specifically to catch this, citing false marking under
**35 U.S.C. § 292** as live civil exposure.

The guard's own instruction is to say what is true rather than exempt the file,
so the user-visible claims were rewritten:

| Was | Now |
|---|---|
| "Build sequential pipelines of patent-pending engines" | "…of proprietary engines" |
| "27 Patent-Pending Financial Engines" | "27 proprietary financial engines — patent claims drafted, none yet filed" |
| "Patent-Pending Engines" | "Proprietary Engines" |
| "Core Patents Filed" | "Core Claims Drafted" |
| "Patent Portfolio Summary" | "Invention Portfolio Summary" |
| "Avg Patent Score" | "Avg Novelty Score" |

Internal field names (`patentId`, `patentScore`) are untouched — they are not
user-visible claims.

When a provisional is actually filed, add it to `APPLICATIONS` in
`shared/patentStatus.ts` and the wording may go back.

### 2. Banned palette

Donor pages used `violet-*` / `purple-*` freely.
`server/concept16Homepage.test.ts` forbids both anywhere in `client/src`. The
port rewrote them to the indigo scale (`violet-500` → `indigo-500`, `#8b5cf6` →
`#6366f1`, and so on) across all 106 files.

---

## Nothing is hidden from the menu

`server/navigation-organization.test.ts` asserts every static `/portal` route is
reachable from the primary sidebar or the secondary catalog. Adding 106 routes
failed it with 106 undiscoverable paths — which is the guard working.

All 106 are now in `SECONDARY_CATALOG`, categorised:

| Category | Entries |
|---|---:|
| Advanced Analysis | 63 |
| Additional Tools | 21 |
| Operations & Administration | 12 |
| Experience & Experimental | 4 |
| Reports & Documents | 3 |
| Reference & Education | 3 |

Categories were assigned by keyword over component name and route. The 21 in
"Additional Tools" are the ones no rule matched confidently; they are reachable
and correctly labelled, and re-filing them is cosmetic and cheap. Collapsing
related entries into tabbed hubs is Phase 3c, which is what `ToggleHub` (PR-3a)
is for.

---

## Verification on this commit

```
pnpm check   → 0 errors
pnpm build   → exit 0, 436 route patterns written to dist/public/routes.json
pnpm test    → 217 files passed | 9 skipped
                4,155 passed | 82 skipped | 0 failed
```

Baseline was **216 files / 4,138 passing / 0 failing**. Deltas (+1 file,
+17 tests) are exactly `server/pr3bPortedPages.test.ts`. No existing test was
modified, and both tests that failed mid-port (`patentClaimGuard`,
`navigation-organization`) were fixed at the source rather than relaxed.

## Relationship to PR-3a

Independent. PR-3a ports the shared calculator-data layer; these 106 pages need
none of it, which is why they are a separate branch off `master` and can be
reviewed in either order. The ~340 pages that *do* need PR-3a are Phase 3d and
come after it lands.
