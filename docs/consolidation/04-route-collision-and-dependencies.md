# 4 — Route Collision and Dependency Report

Requirement: *"A route collision and dependency report for the proposed 391
pages."*

**The 391-page set could not be derived from any repository** (see
`00-README.md`). This report therefore covers every set that *can* be defined,
so the answer is present whichever set 391 refers to. Re-cutting against an
explicit list is a one-command change once provided.

Source data: [`data/corpus.routemap.tsv`](data/corpus.routemap.tsv),
[`data/app.routemap.tsv`](data/app.routemap.tsv),
[`data/twin.routemap.tsv`](data/twin.routemap.tsv) — route → component, parsed
from each repo's `App.tsx`.

## 4.1 Route population

| Repo | Routes in `App.tsx` | Portal pages | Top pages |
|---|---|---|---|
| Base | 330 | 261 | 64 |
| App | 652 | 620 | 61 |
| Twin | 621 | 630 | 59 |

| Comparison | Base only | Both | App only |
|---|---|---|---|
| Routes, base vs app | 103 | 227 | 385 |

| Page set | Count |
|---|---|
| Base portal pages | 261 |
| Base portal + top | 325 |
| Union, all three repos | **691** |
| Base ∪ app-only | 680 |

## 4.2 Hard collisions — same route, different component

**24 routes resolve to a different component in the base than in the app.**
Full table: [`data/route-collisions-corpus-vs-app.tsv`](data/route-collisions-corpus-vs-app.tsv).

These are the genuine merge hazards: migrating an app page without resolving
these silently changes what an existing, tested URL renders.

| Route | Base component | App component | Severity |
|---|---|---|---|
| `/` | `FrontDoor` | `Landing` | **CRITICAL** — site entry point |
| `/portal` | `InfiniteScroll` | `Dashboard` | **CRITICAL** — portal entry point |
| `/portal/estate-flow` | `EstateFlowChart` | `EstateDocumentsHub` | high |
| `/portal/estate-tax` | `EstateTax` | `EstateTaxLiquidityHub` | high |
| `/portal/existing-annuities` | `ExistingAnnuities` | `AnnuityComparisonReviewHub` | high |
| `/portal/illustration-compare` | `IllustrationCompare` | `IllustrationQuotingHub` | high |
| `/portal/long-term-care` | `LongTermCare` | `LongTermCarePlanner` | medium |
| `/portal/market-pulse` | `MarketPulsePage` | `MarketPulseSentinel` | medium |
| `/portal/medicare-irmaa` | `MedicareIRMAA` | `MedicareIrmaaHub` | high |
| `/portal/meeting-prep` | `MeetingPrepPage` | `AdvisorMeetingPrep` | medium |
| `/portal/mortgage-killer` | `MortgageKiller` | `MortgageKillerHub` | high |
| `/portal/mortgage-killer-v2` | `MortgageKillerV2Page` | `MortgageKillerV2` | medium |
| `/portal/multi-gen-wealth` | `MultiGenWealthTransfer` | `DynastyMultiGenTransferHub` | high |
| `/portal/myga-waterfall` | `MygaWaterfallPage` | `MYGAWaterfallComparison` | medium |
| `/portal/policy-review-checklist` | `PolicyReviewChecklist` | `PolicyReviewHub` | high |
| `/portal/premium-financing` | `PremiumFinancing` | `PremiumFinancingHub` | high |
| `/portal/retirement-projection` | `RetirementIncomeProjection` | `RetirementIncomeProjectorHub` | high |
| `/portal/reverse-heloc` | `ReverseHeloc` | `MortgageRefiToolsHub` | high |
| `/portal/roth-conversion` | `RothConversionSTR` | `RothStrategyHub` | high |
| `/portal/sales-story` | `SalesStoryBuilder` | `SalesStoryBuilderHub` | medium |
| *(4 more)* | | | see TSV |

**Pattern:** most collisions are the app replacing a single base page with a
`*Hub` aggregator. This is a real architectural divergence, not a rename — a
Hub absorbs several pages as tabs. Migrating a Hub therefore also decides the
fate of every page it absorbs.

**Resolution rule for every collision:** the base's component holds the route
unless a documented comparison chooses otherwise. A Hub may only take a route
once the disposition of every page it absorbs is recorded in PR-2.

> **Double-stacking check — mandatory before any Hub migrates.** For each Hub,
> confirm whether the pages it absorbs remain independently routable. If both
> the Hub tab and the original route survive, the capability is reachable twice.
> That is the duplication this consolidation exists to remove.

## 4.3 Dependency report

### Runtime dependencies

Both packages declare **75** runtime dependencies; 70 are identical.

| Only in base | Only in app |
|---|---|
| `compression` | `@types/pdfkit` |
| `nodemailer` | `fuse.js` |
| `streamdown` | **`postgres`** |
| `unpdf` | `web-vitals` |
| `ws` | `xlsx` |

**`postgres` is the load-bearing difference.** The base cannot run on
PostgreSQL until that dependency and the driver change are adopted (PR-1).

`fuse.js` (fuzzy search) and `xlsx` are app capabilities the base lacks; both
arrive only with the features that need them.

### Data-layer dependency — the blocking migration

| | Base | App |
|---|---|---|
| Driver | `drizzle-orm/mysql2` | `drizzle-orm/postgres-js` + `postgres` |
| Dialect | `mysql` | `postgresql` |
| Tables | **155** | 116 |

The base has **39 tables the app does not**. The port must therefore carry the
base's schema *forward* into PostgreSQL — it is not a matter of adopting the
app's schema file. The app's `DEPLOY_NOTES.md` documents the exact conversions
required (`mysqlTable`→`pgTable`, `int().autoincrement()`→`serial`,
`json`→`jsonb`, `mysqlEnum`→`text({enum})`, `.$returningId()`→`.returning()`,
`.onDuplicateKeyUpdate`→`.onConflictDoUpdate`, dropping `.onUpdateNow()`).

**This is PR-1 and everything else waits on it**, because 194 test files and
3,757 tests currently pass against the MySQL data layer.

### Deployment dependency

The base has no `vercel.json` and no `api/` entrypoint. Both come from the app
(PR-9) — and per the decision, **adopting the config is not deploying**. No DNS
or hosting change occurs without separate explicit approval.

## 4.4 Orphan and reachability checks

To run in PR-2, once the page set is frozen:

1. **Routed-but-unlisted** — routes in `App.tsx` absent from
   `shared/routeManifest.ts` (reachable but undiscoverable).
2. **Listed-but-unrouted** — manifest entries with no route (dead nav links).
3. **Page-file orphans** — `.tsx` files under `pages/portal/` with no route.
4. **Duplicate component targets** — one component serving several routes.

`scripts/reconcile-route-manifest.mjs` already exists in the base and is the
right harness to extend for checks 1 and 2.
