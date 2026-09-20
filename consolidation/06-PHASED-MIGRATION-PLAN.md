# 6 — Phased migration plan

One bounded capability per pull request. Nothing here merges until the
foundation PR is reviewed and green, and nothing here deploys, changes DNS,
touches a database, or alters credentials.

## 6.0 Rules binding every migration PR

1. **Recompute before you start.** `master` moved during this survey — donor-only
   engines fell 40 → 10 and live routes rose 266 → 330. Run
   `tools/extract_routes.py` and restate the delta in the PR body. Numbers from
   these documents are stamped to `76ed5f2` and are not carried forward.
2. **Acceptance gate is `pnpm run test`** — the full suite, not `test:ci` (§3.2).
   Plus `pnpm run check` and `pnpm run build`, all enforced by
   `consolidation-verify.yml`.
3. **Route count must move by exactly the stated number.** The CI job prints it.
4. **No existing live file changes** unless the PR carries the §2.1 comparison
   and a test that fails on live and passes on the donor version.
5. **No database work.** No `db:push`, no schema edit, no dialect port. Schema
   changes are a separate track requiring separate approval.
6. **Merge commits, not squashes**, and tag `consolidation-pre-N` before merging
   (§5.3).
7. **No deploy.** Merging to `master` republishes `deploy/rcs` and is a deploy
   action in this repository (§5.1); each merge needs the owner's explicit
   go-ahead.

## 6.1 The first three PRs

### PR-1 — Prerequisite shared modules

**Nothing else can move until this lands.** 289 of the 385 candidate pages fail
to compile without it.

| | |
|---|---|
| Source | `russell-capital-app/` (17 of 18 byte-identical in `russell-capital`) |
| Target | `russell-capital-systems/client/src/{context,contexts,components,hooks,data,lib}/` |
| Size | 18 files, 9,447 lines |
| Routes added | **0** |
| New npm dependencies | **0** |
| Risk | Low — additive only; no existing file is touched |

Source → target, in dependency order:

| Source path (`russell-capital-app/`) | Target path (`russell-capital-systems/`) | Lines |
|---|---|---:|
| `client/src/context/FinancialDataContext.tsx` | same | 131 |
| `client/src/contexts/UnifiedDataBusContext.tsx` | same | 197 |
| `client/src/contexts/OrganismContext.tsx` | same | 107 |
| `client/src/components/ToggleHub.tsx` | same | 44 |
| `client/src/components/StateTaxSelector.tsx` | same | 111 |
| `client/src/components/ComboPageWrapper.tsx` | same | 104 |
| `client/src/components/ResultReveal.tsx` | same | 135 |
| `client/src/components/ProjectionChart50yr.tsx` | same | 174 |
| `client/src/components/CalculatorPDFExport.tsx` | same | 262 |
| `client/src/components/CalculatorIntegration.tsx` | same | 715 |
| `client/src/components/NeuralMeshInterceptor.tsx` | same | 512 |
| `client/src/hooks/useOrganism.ts` | same | 186 |
| `client/src/hooks/useOrganismEyes.ts` | same | 605 |
| `client/src/hooks/useOrganismSkeleton.ts` | same | 718 |
| `client/src/hooks/useOrganismDeepIndex.ts` | same | 338 |
| `client/src/hooks/useOrganismNervousSystem.ts` | same | 964 |
| `client/src/data/physicianSpecialtyDefaults.ts` | same | 614 |
| `client/src/lib/toolSearchIndex.ts` | same | 3,530 |

**Test criteria**
- `pnpm run check` clean — this is the real test; these modules must typecheck
  against live's tsconfig, path aliases and React/Tailwind versions.
- `pnpm run build` succeeds; route count stays at **330** (nothing is wired yet).
- `pnpm run test` — full suite, zero new failures.
- A new `consolidation-prereq.test.ts` asserting each of the 18 resolves.

**Open question to settle inside this PR, not after:** `toolSearchIndex.ts`
(3,530 lines) is the one module the two donors disagree on, and exactly one page
imports it. Recommendation: **split it out and defer it.** PR-1 ships 17
modules, 5,917 lines; `toolSearchIndex` gets its own PR when the page that needs
it is scheduled.

**Rollback** — revert the merge commit. No route or behaviour change to unwind.

---

### PR-2 — One vertical slice: the AMT hub

The smallest change that exercises the entire pipeline end to end: a donor hub,
its three lazily-loaded pages, route registration and the route-count assertion.
Its purpose is to prove the process, not to move volume.

| | |
|---|---|
| Source | `russell-capital-app/` |
| Size | 4 files, 670 lines |
| Routes added | **3** → live goes 330 → 333 |
| Depends on | PR-1 (uses 6 of the 18 prerequisites) |
| Risk | Low, and deliberately so |

| Source path | Target path | Lines | Donors agree? |
|---|---|---:|---|
| `client/src/pages/hubs/AmtHub.tsx` | same | 20 | yes |
| `client/src/pages/portal/AMTCalculator.tsx` | same | 240 | no — pick per §2.1 |
| `client/src/pages/portal/AMTAnalyzer.tsx` | same | 222 | no — pick per §2.1 |
| `client/src/pages/portal/AlternativeMinimumTaxPlanner.tsx` | same | 188 | no — pick per §2.1 |

Routes: `/portal/amt-calculator` → `AmtHub`, `/portal/amt-analyzer` →
`AMTAnalyzer`, `/portal/amt-planner` → `AlternativeMinimumTaxPlanner`.

**Test criteria**
- Route count moves 330 → **333**, exactly.
- `pnpm run check`, `pnpm run build`, `pnpm run test` all clean.
- A route test asserting the three paths resolve and render behind the auth gate.
- For each of the three divergent pages, the PR body records which donor was
  chosen and why (line count is evidence, not an argument).

**Rollback** — revert; route count returns to 330.

---

### PR-3 — The nine routes only `russell-capital` has

The one part of the surface with **no donor conflict at all**: nine portal
routes that exist in neither the live build nor `russell-capital-app`. Nothing
to adjudicate, so it is a clean second migration and it exercises the second
donor.

| | |
|---|---|
| Source | `russell-capital/client/src/pages/portal/` |
| Size | 9 files, 3,213 lines |
| Routes added | **9** → 333 → 342 |
| Depends on | PR-1 (each page needs 1–3 prerequisites) |
| Risk | Low-to-moderate — no conflict, but unreviewed code |

| Route | Component | Lines | Prerequisites |
|---|---|---:|---:|
| `/portal/entrainment-engine` | `EntrainmentEngine` | 719 | 3 |
| `/portal/pavlovian-engagement` | `GamifiedPavlovianEngagement` | 704 | 3 |
| `/portal/predictive-arena` | `PredictiveInsightArena` | 315 | 1 |
| `/portal/wealth-odyssey` | `WealthOdyssey` | 314 | 1 |
| `/portal/moat-fortress` | `MoatFortress` | 278 | 1 |
| `/portal/elite-showdown` | `EliteShowdown` | 260 | 1 |
| `/portal/wealth-warrior` | `WealthWarriorChallenges` | 257 | 1 |
| `/portal/holographic-mirage` | `HolographicMirage` | 247 | 1 |
| `/portal/strategy-comparison` | `StrategyComparisonArena` | 119 | 2 |

**Test criteria**
- Route count moves 333 → **342**, exactly.
- `pnpm run check`, `pnpm run build`, `pnpm run test` all clean.
- A route test per page.
- `EntrainmentEngine` overlaps the live `EntrainmentProvider` in `App.tsx`; the
  PR must show they do not both drive the same state, or the page is dropped
  from the batch.

**Rollback** — revert; route count returns to 333.

## 6.2 Everything after that

Sequenced, not scheduled. Each becomes its own PR with the same gate.

| # | Capability | Size | Notes |
|---|---|---|---|
| 4 | `toolSearchIndex.ts` + its one consumer | 3,530 lines | The deferred half of PR-1 |
| 5 | `accessControl.ts` reconciliation | live 29 vs donors 104/107 | **Security-relevant.** Read both in full first; establish whether live delegates or is missing logic. No copy without a failing-then-passing test. |
| 6 | The remaining 5 engine divergences | `mortgageKiller` +3, `taxBracketEngine` +15, `sp500SeriesAudit` +4, `divorceFinancialEngine` +21, `patentStatus` +37 | One PR each. `divorceFinancialEngine`: the donors disagree with each other (200/179/151) — resolve that before choosing. |
| 7 | The 10 donor-only engines | 2,821 lines | Additive; start with `multiplierDecision` (660) |
| 8–n | The 385 candidate pages | ~23 hub clusters | One hub cluster per PR. The 24 hubs pull 102 distinct pages (~23.4k lines) — see `data/hubclosure.json`. Never one PR. |
| — | The 164 donor-identical pages | — | Cheapest tranche; donor choice is moot, so they fold into their hub clusters |
| — | `/portal/wealth-rituals`, `/portal/usage-analytics` | 428 lines | The *entire* gamification migration (§2.4) |
| — | Sacred Seven diff review | 7 files | **Review, not migration.** Live is authoritative and `TheStrategyTable` is larger in live |
| — | `audit/route_manifest.json` reconciliation | — | 232 recorded vs 330 actual; its own PR |
| — | `/portal/nav-placeholder` | — | **Do not import.** A placeholder. |

## 6.3 Explicitly out of scope

Not in any PR above; each needs separate, explicit approval:

- Any database work — migration, schema edit, or the MySQL→Postgres question
  (§2.5)
- Any deployment: Railway, Vercel, GitHub Pages, the `deploy/rcs` subtree
- DNS, domains, GoDaddy
- Credentials, environment variables, secret rotation
- Deleting, archiving or overwriting any repository — including the eleven
  content-only repositories in §1.2, which this plan classifies but does not act on
- Wholesale repository merges
