# 6 — Phased Migration Plan

**Date:** 2026-09-20
**Rule:** one bounded capability per pull request. No PR merges until the one before it is green
on `master`. No deployment, DNS, hosting, database, or credential change in any PR below —
those require separate explicit approval.

Paths are written relative to each repository root.
**BASE** = `sam-russell-corpus/russell-capital-systems/` ·
**LIVE** = `russell-capital` @ `863b3f0` · **APP** = `russell-capital-app`

---

## 6.0 Prerequisites before PR-3 (the first code PR)

1. **This PR (PR-1) is reviewed and merged.**
2. **PR-2 is answered** — the two open questions in capability matrix §2.8.
3. **Tag pushed:** `pre-consolidation-2026-09-20` at `76ed5f2` (command in document 5 §5.3).
4. **CI green on `master`** so every later PR has a true baseline to diff against.

---

## PR-1 — Foundation *(this PR)*

| | |
|---|---|
| **Adds** | `consolidation/*.md` ×7, `.github/workflows/consolidation-ci.yml` |
| **Application code** | **None.** |
| **Test criteria** | CI green: 0 tsc errors, 194/194 test files, build emits 330 route patterns, secret scan clean |
| **Rollback** | `git revert` — removes documentation and one workflow; no code affected |

---

## PR-2 — Decisions *(documentation only, no code)*

Resolves the two open questions before any code moves, because both change scope.

1. **The "18 gamification routes."** 9 identified, all in LIVE not APP, all collision-free
   (matrix §2.8). Confirm this 9 as the scope of PR-6, or name the other 9.
2. **Postgres/Vercel patterns from APP.** Adopting these changes dialect and hosting. In or out?
   Excluded from every PR below until answered.

Also records your ruling on the two corrections in the capability matrix:
- The **Sacred Seven** is native to BASE, not LIVE — removes a planned migration entirely (§2.3).
- The **behavioral/genome schema** is already complete in BASE and is *ahead* of LIVE (§2.2).

| | |
|---|---|
| **Adds** | `consolidation/07_DECISIONS.md` |
| **Rollback** | `git revert` |

---

## PR-3 — Shared engines & server modules *(first code PR — 7 files)*

The smallest possible real migration, chosen deliberately to exercise CI end to end on a
low-risk change.

| | |
|---|---|
| **Source → target** | LIVE `shared/{clientOnboardingEngine,complianceDocGeneratorEngine,familyTreeFinancialEngine,multiCurrencyWealthEngine}.ts` → BASE `shared/` |
| | LIVE's 3 server-only modules → BASE `server/` |
| **Size** | 4 shared engines + 3 server modules |
| **Overwrites** | **None** — all 7 filenames are absent from BASE |
| **Registry impact** | None. Route manifest unchanged: **330 → 330** |
| **Test criteria** | 0 tsc errors · `test:ci` still 194/194 · manifest diff empty · plus a unit test per migrated engine |
| **Rollback** | `git revert -m 1 <sha>` — nothing depends on these yet |

---

## PR-4 — Additive schema: 7 tables

| | |
|---|---|
| **Source → target** | LIVE `drizzle/schema.ts` → BASE `drizzle/schema.ts` (append only) |
| **Tables** | `clientReports`, `engineChainRuns`, `engineChains`, `engineUsageLogs`, `pagePerformanceMetrics`, `toolFavorites`, `toolUsage` |
| **Size** | 155 → **162** tables |
| **Overwrites** | **None.** No existing table, column, index or type altered or dropped |
| **Migration** | One generated Drizzle migration, `CREATE TABLE` statements only. **Reviewed as SQL before it is run anywhere.** Not executed against any database in this PR |
| **Test criteria** | 0 tsc errors · `test:ci` 194/194 · generated SQL contains no `DROP`/`ALTER`/`RENAME` · schema snapshot committed |
| **Rollback** | Revert the commit; if the migration has been applied anywhere, the paired `DROP TABLE` for the 7 new tables only |

---

## PR-5 — Consolidation hubs from APP *(41 routes)*

`ToggleHub` mounts several existing tool pages as tabs in one window, children lazy-loaded,
child pages unmodified. It de-duplicates the menu without deleting any implementation.

| | |
|---|---|
| **Source → target** | APP `client/src/components/ToggleHub.tsx` → BASE `client/src/components/` |
| | APP `client/src/pages/hubs/*.tsx` (41) → BASE `client/src/pages/hubs/` |
| **Blocking precondition** | Each hub references child pages by import. **Every child import must resolve in BASE before this PR opens.** Verify first; hubs whose children have not yet migrated are deferred to after PR-7 |
| **Size** | 41 new routes under `/portal/hub/*` |
| **Overwrites** | **None** — 0 path collisions (report §4.2) |
| **Registry impact** | Manifest **330 → 371**, additions only |
| **Test criteria** | 0 tsc errors · `test:ci` 194/194 · manifest guard passes · one render test per hub asserting its first tab mounts |
| **Rollback** | `git revert -m 1 <sha>` — hubs are leaves, nothing imports them |

---

## PR-6 — Engagement / gamification pages *(9 routes, pending PR-2)*

| | |
|---|---|
| **Source → target** | LIVE `client/src/pages/portal/{EliteShowdown,EntrainmentEngine,GamifiedPavlovianEngagement,HolographicMirage,MoatFortress,PredictiveInsightArena,StrategyComparisonArena,WealthOdyssey,WealthWarriorChallenges}.tsx` → BASE `client/src/pages/portal/` |
| **Routes** | `/portal/elite-showdown`, `/portal/entrainment-engine`, `/portal/pavlovian-engagement`, `/portal/holographic-mirage`, `/portal/moat-fortress`, `/portal/predictive-arena`, `/portal/strategy-comparison`, `/portal/wealth-odyssey`, `/portal/wealth-warrior` |
| **Overwrites** | **None** — all 9 verified collision-free |
| **Scope risk** | The brief says 18; 9 are evidenced. **PR-2 must settle this before this PR opens.** |
| **Test criteria** | 0 tsc errors · `test:ci` 194/194 · manifest 371 → 380, additions only · smoke render per page |
| **Rollback** | `git revert -m 1 <sha>` |

---

## PR-7 onward — the 391 pages, in bounded tranches

**Not one PR.** 391 pages and 436 files is too large to review in a single diff, and a single
revert of it would be indistinguishable from a rewrite. Split into tranches of **~40 routes**,
grouped by domain so each tranche is independently reviewable and independently revertible.

Proposed sequence (exact membership generated per tranche from Appendix A):

| PR | Tranche | ~Routes |
|---|---|---:|
| PR-7 | Tax & compliance | ~40 |
| PR-8 | Retirement & income | ~40 |
| PR-9 | Insurance & policy | ~40 |
| PR-10 | Estate & trusts | ~40 |
| PR-11 | Real estate & debt | ~40 |
| PR-12 | Business owner & practice | ~40 |
| PR-13 | Client management & CRM | ~40 |
| PR-14 | Analytics & reporting | ~40 |
| PR-15 | Admin & operations | ~40 |
| PR-16 | Remainder + the 31 shared components | ~31 |

**Per-tranche contract, identical every time:**

- **Source:** LIVE `client/src/pages/portal/<page>.tsx` (+ any of the 49 non-page dependencies
  the tranche is first to need)
- **Target:** BASE at the same relative path
- **Precondition:** the tranche's full import closure already resolves in BASE
- **Test criteria:** 0 tsc errors · `test:ci` holds at 194/194 or higher · route-manifest guard
  passes with **additions only** · a smoke render test per migrated page · bundle report attached
- **Rollback:** `git revert -m 1 <sha>`; dependencies always land in an earlier tranche than
  their dependants, so a revert can never orphan a page that remains
- **Excluded throughout:** the 229 overlapping paths. Those stay on the BASE implementation
  (matrix §2.7). Any individual re-decision is its own PR with a side-by-side comparison
- **Deferred:** the 1 unresolved dynamic route (report §4.2) until identified by hand

**End state if all tranches land:** route manifest **330 → 721**, tables **155 → 162**, shared
modules **187 → 191**. No existing route removed or re-pointed at any point.

---

## 6.1 What is deliberately not in this plan

| Excluded | Why |
|---|---|
| Any deployment | Requires separate explicit approval |
| Any DNS, domain, GoDaddy, Railway, Vercel change | Requires separate explicit approval |
| Any database connection, migration run, or seed | PR-4 reviews SQL; it does not run it |
| Any credential or environment variable change | Out of scope entirely |
| Postgres/Vercel adoption from APP | Changes dialect and hosting — needs its own decision (PR-2) |
| Wholesale repository merge | Every migration is file-level and named |
| Deleting, archiving, or overwriting any repository | Archive candidates are *proposed* in document 1, never actioned |
| Replacing the engine registry, calculator registry, route manifest, or existing tests | All four are additive-only and CI-enforced |
| Merging anything to `master` without review | Every PR above is reviewed independently |
