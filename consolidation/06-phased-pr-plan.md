# 6 — Phased PR plan

One bounded capability per PR. Each lands only after the previous is green.

**Every PR below touches `russell-capital-systems/**` and therefore deploys to production on
merge** (§5.1). Each needs its own explicit approval at merge time.

## Standing gates — every PR

| Gate | Threshold |
|---|---|
| `pnpm check` | 0 errors |
| `pnpm build` | exit 0 |
| `pnpm test` | ≥ 4138 passing, **0 failing** |
| Route manifest | `grok-merge.smoke.test.ts` — no missing/unexpected/duplicate path |
| Route invariant | `App.tsx` == `ROUTE_MANIFEST` == `dist/public/routes.json`.routes |
| Protected files | no change to `routeManifest.ts` except **added** lines; no change to `calculatorCatalog.ts`, `patentCatalog.ts`, `journeyCatalog.ts` except added entries; **no existing test modified or deleted**; no change to `server/_core/**` |
| Tag | `rcs-pre-<phase>` pushed before merge |

Rollback for every PR: `git revert -m 1 <merge-sha>` → push → confirm redeploy (§5.5).

---

## PR-0 — Foundation *(this PR)*

**Touches:** `consolidation/**`, `.github/workflows/rcs-ci.yml`, `.gitleaks.toml`
**Not:** `russell-capital-systems/**` — so merging cannot deploy.
**Tests:** CI must go green on itself.
**Rollback:** revert; nothing runtime changes.

---

## PR-1 — Blocking questions *(no code)*

Three answers are needed before the plan can run as written.

1. **"18 gamification routes."** Not reproducible — by name 15, by content signal 4, and the
   set lives in `russell-capital`, not `russell-capital-app` (§2.5). **Name the 18, or approve
   the 15.**
2. **"Behavioral schema."** `behavioralBiasEngine.ts` is byte-identical across base and donor,
   and no behavioral table is missing from the base (§2.1). **Name what else it means, or mark
   it closed.**
3. **"Engine registry."** No file by that name exists in the base. `calculatorCatalog.ts` is
   the closest. **Name the file so it can be added to the protected list** (§2.4).

Also for confirmation: the **Sacred Seven are already in the base and absent from
`russell-capital`** (§2.1). That donor line appears already closed — confirm it is.

---

## PR-2 — Client prerequisites

Unblocks every later page phase. **8 files, additive, no route changes.**

| Source (`russell-capital` @ `863b3f0`) | Target (`russell-capital-systems`) |
|---|---|
| `client/src/components/CalculatorIntegration.tsx` | same path |
| `client/src/components/CalculatorPDFExport.tsx` | same path |
| `client/src/components/ComboPageWrapper.tsx` | same path |
| `client/src/components/NeuralMeshInterceptor.tsx` | same path |
| `client/src/components/ProjectionChart50yr.tsx` | same path |
| `client/src/contexts/OrganismContext.tsx` | same path |
| `client/src/contexts/UnifiedDataBusContext.tsx` | same path |
| `client/src/lib/toolSearchIndex.ts` | same path |

**Test criteria:** standing gates. Route counts **unchanged at 330** — this PR adds no routes.
Add a render smoke test for each new component.
**Risk:** low. Nothing imports them yet.
**Rollback:** revert; nothing referenced them.

---

## PR-3 — Gamification pages *(blocked on PR-1 Q1)*

**15 pages** absent from the base (§2.5) — 9 from `russell-capital`, 6 present in both donors
(take from `russell-capital`, same MySQL/tRPC shape as the base).

`EliteShowdown` · `EntrainmentEngine` · `GamifiedPavlovianEngagement` · `HolographicMirage` ·
`MoatFortress` · `PredictiveInsightArena` · `StrategyComparisonArena` · `WealthOdyssey` ·
`WealthWarriorChallenges` · `WealthRituals` · `MasteryNexus` · `FinancialFluencyAcademy` ·
`LegacyVault` · `PresentationVault` · `ToolExplorer`

**Source:** `client/src/pages/portal/<Name>.tsx` → **target:** same path.
**Also:** one `<Route>` per page in `App.tsx`, one line per route appended to
`ROUTE_MANIFEST`, and a nav entry each.
**Test criteria:** standing gates; route counts move **330 → 345** in all three places
together. New render smoke test per page.
**Risk:** medium — 15 new lazy chunks. None collides (§4.2).
**Rollback:** revert. Routes and manifest lines disappear together.

---

## PR-4 — Engine-chaining and telemetry backend

The prerequisite for the 5 missing tRPC namespaces (§4.3). **Additive only.**

| Source (`russell-capital`, MySQL) | Target |
|---|---|
| `server/engineChainingRouter.ts` | same path |
| `server/analyticsRouter.ts` | same path |
| `server/reportBuilderRouter.ts` | same path |
| 7 table definitions in `drizzle/schema.ts` | **appended** to the base's schema |

Tables: `engineUsageLogs`, `engineChains`, `engineChainRuns`, `clientReports`,
`toolFavorites`, `toolUsage`, `pagePerformanceMetrics`.

Mount the three routers in `appRouter` as `analytics`, `chains`, `comboRecommend`,
`healthDashboard`, `toolAnalytics` — **appended, never replacing an existing namespace.**

**Take from `russell-capital`, not `russell-capital-app`** — the latter is PostgreSQL and
would need dialect translation for no benefit (§2.6).

**Test criteria:** standing gates, plus a procedure-level test per new namespace. Verify the
base's 150 existing namespaces are untouched (diff the `appRouter` key list before/after).
**Risk:** medium — touches `routers.ts` and `schema.ts`, both live. Mitigated by
append-only and by asserting no existing key changes.
**Rollback:** revert the code. **The 7 tables remain and are harmless** — additive, unreferenced
by the reverted build.

---

## PR-5 — Selected page/content modules *(the "individually selected" subset)*

Drawn from the 391-route pool (`consolidation/data/candidate-routes-russell-capital.txt`).

**This PR is not written until the selection exists.** Proposed method: rank the pool with
`sam-russell-corpus/russell-capital/CONSOLIDATION_PLAN.json`, which already scores 300+ pages
with a verdict (`KEEP-L1`, layer, cluster, hierarchy role) and a rationale per page. Take the
`KEEP-L1` set, minus anything already in the base, and bring it in **batches of ~20 routes per
PR**, each batch its own PR under the standing gates.

**Test criteria:** per batch — standing gates; route counts move by exactly the batch size in
all three places; render smoke test per page.
**Risk:** medium, bounded by batch size.
**Rollback:** per batch.

---

## PR-6 — `taxBracketEngine.ts` decision

Donor is 669 lines to the base's 654 (§2.3). Tax brackets are year-versioned; the longer file
may simply carry a later year — or may be an older file with dead years.

**Deliverable:** a written diff in the PR body showing which tax years each version covers,
then either (a) no change, or (b) merge the missing years into the base's file — **never
wholesale replacement.**
**Test criteria:** standing gates plus the existing `taxBracketEngine` tests, unmodified.
**Risk:** high if replaced wholesale. Low if merged year-wise.

---

## PR-7 — `accessControl.ts` decision

Donor is 104 lines to the base's 29 (§2.3). **Security-bearing.**

**Deliverable:** a written comparison of the permission model in each, a threat note on what
the larger file grants or denies that the smaller does not, and `/security-review` run on the
diff. Default outcome is **no change**; the donor must earn the replacement.
**Test criteria:** standing gates plus explicit authorization tests for every role.
**Risk:** high. **Do not merge this one without a security review in the PR body.**

---

## PR-8 — Donor-only engines

| Source | Target | Note |
|---|---|---|
| `shared/familyTreeFinancialEngine.ts` (221) | same path | No base equivalent |
| `shared/complianceDocGeneratorEngine.ts` (178) | same path | No base equivalent |
| `shared/clientOnboardingEngine.ts` (176) | same path | **Check overlap first** with the base's `clientFactFinder` + `intakeRouter` |

`multiCurrencyWealthEngine.ts` (159) — **deferred**, no evidenced demand.

**Test criteria:** standing gates plus a unit test per engine.
**Risk:** low — additive, nothing imports them until a page does.

---

## PR-9 — Archive pass *(no code)*

Act on §1.3 only after each repository is opened and confirmed. Highest value first:
pull `russell-capital-patents` (15 patents + 27 sister inventions drive the roadmap), then
rotate the credentials in `Russell-Capital-Solutions-NEW`'s history before archiving it.

---

## Sequence

```
PR-0 foundation  ──►  PR-1 answers  ──►  PR-2 prerequisites  ──►  PR-4 backend
                                                │                      │
                                                └──► PR-3 gamification │
                                                                       ▼
                                          PR-5 page batches (≈20 routes each)
PR-6, PR-7, PR-8 — independent, any time after PR-0
PR-9 — independent, no code
```

PR-2 and PR-4 are the unlocks: **13 items** (§4.4) gate the entire 391-route pool.

## What this plan deliberately does not do

- Move DNS, domains, traffic, hosting, databases or credentials.
- Merge any repository wholesale.
- Replace the route manifest, calculator catalog, patent catalog or any existing test.
- Touch `server/_core/**` — the files that boot the live service (§2.7).
- Change the component bound to any existing route (§4.2).
- Alter or drop any existing database table (§5.5).
