# 2 · Authoritative Capability Matrix

**Date:** 2026-09-20 · **Rule:** for every capability there is exactly **one**
chosen implementation. Where the chosen implementation is already in the base,
the migration action is **NONE** and the entry exists to record that the
comparison was made.

Legend — **Chosen** column:
`BASE` = keep the canonical implementation · `RC` = migrate from `russell-capital`
· `APP` = migrate from `russell-capital-app` · `NEW` = does not exist anywhere yet.

---

## 2.1 Registries and manifests — **BASE wins every row, no exceptions**

These are the files the brief forbids overwriting without documented comparison.
The comparison is here, and the answer is the same in all five cases: the base's
implementation is the only one with an enforcement mechanism attached.

| Capability | Base | donor `russell-capital` | donor `russell-capital-app` | Chosen | Why |
|---|---|---|---|---|---|
| **Route manifest** | `shared/routeManifest.ts`, 330 entries, diffed against the router by smoke tests in both directions | none | none | **BASE** | Neither donor has any route manifest. The base's is verified at build: `dist/public/routes.json` emitted 330 patterns, matching exactly. |
| **Calculator registry** | `shared/calculatorCatalog.ts`, 116 entries, each `path` verified against the real router by `server/calculatorCatalog.test.ts` | none | none | **BASE** | Neither donor has a calculator registry. The base's header records the failure it was built to prevent: 18 of 35 catalogue cards once pointed at non-existent routes. |
| **Page registry** | `docs/audit/pageRegistry.json`, 309 pages with value score, hub, engines, capability flags | none | none | **BASE** | No donor equivalent. |
| **Engine registry** | 55 engines in `shared/*Engine*.ts`; 174 files in `shared/` | 32 engines; 63 files in `shared/` | 32 engines | **BASE** | Base is a near-superset — see §5 for the 4 genuine gaps. |
| **Route reconciliation** | `scripts/reconcile-route-manifest.mjs` | none | none | **BASE** | No donor equivalent. |
| **Provenance** | `PROVENANCE.md`, `PARTS_MANIFEST.json`, `audit/` corpus with per-page source hashes | none | `CONSOLIDATION_PLAN.json` (1.0 MB) | **BASE** | The app's plan file is an input to a superseded consolidation, not a provenance record. Retain as reference. |
| **Test suite** | 225 files; `test:ci` with 26 documented exclusions | ~120 files, no curated CI suite | ~120 files | **BASE** | See [03_BASELINE_VERIFICATION.md](03_BASELINE_VERIFICATION.md). |

**Conclusion: no registry, manifest, or test file is overwritten by this
consolidation.** Every migration *adds* entries to the base's registries through
the base's own mechanisms.

---

## 2.2 Platform and infrastructure

| Capability | Chosen | Detail |
|---|---|---|
| **Database dialect** | **BASE** (MySQL) | Base uses `drizzle-orm/mysql2`, `dialect: "mysql"`. `russell-capital` matches. `russell-capital-app` is PostgreSQL. **Not in scope** — explicitly excluded by the brief. Donor `russell-capital`'s matching MySQL dialect makes it the lower-risk donor for anything schema-adjacent. |
| **Postgres port** | **APP — reference only** | 11 server files + 117 tables converted, documented in the app's `DEPLOY_NOTES.md`. Preserve as a reference implementation for a future, separately-approved cutover. **No code moves in this consolidation.** |
| **Deploy target** | **BASE** (Railway via `deploy/rcs`) | `.github/workflows/deploy-branch.yml`. Base has no Vercel config. |
| **Vercel pattern** | **APP — reference only** | `vercel.json` + `api/index.ts`. Recorded, not migrated. Any deploy change needs separate explicit approval. |
| **DNS / domain** | **OUT OF SCOPE** | `russell-capital-domain-redirect` holds the CNAME. No action in this consolidation. |
| **CI** | **BASE** + one addition | 12 workflows exist. This PR adds one consolidation-gate workflow. See [05](05_CI_SECRETS_ROLLBACK.md). |

---

## 2.3 Gamification routes — **the brief's donor assignment is inverted**

The brief assigns these to `russell-capital-app`. Measured against `App.tsx` in
all three trees:

**`russell-capital-app` contains 0 of 18.** That build deleted them.
**`russell-capital` contains 18 of 18.** **The base already contains 9 of 18.**

| Route | Base | `russell-capital` | `russell-capital-app` | Chosen | Action |
|---|:--:|:--:|:--:|---|---|
| `/portal/arena` | ✅ | ✅ | ❌ | BASE | none |
| `/portal/rewards` | ✅ | ✅ | ❌ | BASE | none |
| `/portal/black-mirror` | ✅ | ✅ | ❌ | BASE | none |
| `/portal/social` | ✅ | ✅ | ❌ | BASE | none |
| `/portal/endgame` | ✅ | ✅ | ❌ | BASE | none |
| `/portal/wealth-reels` | ✅ | ✅ | ❌ | BASE | none |
| `/portal/infinite-scroll` | ✅ | ✅ | ❌ | BASE | none |
| `/portal/pet` | ✅ | ✅ | ❌ | BASE | none |
| `/portal/toilet` | ✅ | ✅ | ❌ | BASE | none |
| `/portal/wealth-warrior` | ❌ | ✅ | ❌ | **RC** | **migrate** |
| `/portal/wealth-odyssey` | ❌ | ✅ | ❌ | **RC** | **migrate** |
| `/portal/elite-showdown` | ❌ | ✅ | ❌ | **RC** | **migrate** |
| `/portal/holographic-mirage` | ❌ | ✅ | ❌ | **RC** | **migrate** |
| `/portal/predictive-arena` | ❌ | ✅ | ❌ | **RC** | **migrate** |
| `/portal/moat-fortress` | ❌ | ✅ | ❌ | **RC** | **migrate** |
| `/portal/pavlovian-engagement` | ❌ | ✅ | ❌ | **RC** | **migrate** |
| `/portal/entrainment-engine` | ❌ | ✅ | ❌ | **RC** | **migrate** |
| `/portal/strategy-comparison` | ❌ | ✅ | ❌ | **RC** | **migrate** |

**Net: 9 routes to migrate, from `russell-capital`, not `russell-capital-app`.**
These are also exactly the 9 routes exclusive to `russell-capital` (§4 of the
collision report) — so they collide with nothing. Scheduled as **PR-05**.

Verify:
```bash
python3 -c "import json;d=json.load(open('consolidation/data/route_collision_report.json'));\
[print(k, v['canonical'], v['donor_rc'], v['donor_app']) for k,v in d['gamification'].items()]"
```

---

## 2.4 The Sacred Seven — **already in the base, in a fuller form**

The brief assigns these to `russell-capital`. They are **absent from
`russell-capital` at `origin/main`** — all seven. They exist in the base and in
`russell-capital-app`, and the base's copies are larger in every case:

| Page | Base | `russell-capital-app` | Δ | Chosen |
|---|---:|---:|---:|---|
| `TheArrival.tsx` | 14,599 b | 14,579 b | +20 | **BASE** |
| `TheBrotherhood.tsx` | 9,542 b | 9,532 b | +10 | **BASE** |
| `TheField.tsx` | 8,531 b | 8,525 b | +6 | **BASE** |
| `TheLegacy.tsx` | 10,737 b | 10,730 b | +7 | **BASE** |
| `TheMap.tsx` | 8,947 b | 8,941 b | +6 | **BASE** |
| `TheMirror.tsx` | 9,188 b | 9,183 b | +5 | **BASE** |
| `TheStrategyTable.tsx` | **15,080 b** | 10,829 b | **+4,251 (+39%)** | **BASE** |

`_genome/GenomeKit.tsx` and `server/fieldRouter.ts` likewise reference the Sacred
Seven in the base.

**Action: NONE.** `TheStrategyTable` is 39% larger in the base — migrating the
donor copy would be a regression. A byte-level diff of the six near-identical
files is scheduled as a read-only check in **PR-04** to confirm the deltas are
cosmetic and nothing in the donor copies is worth back-porting.

> If "Sacred Seven" refers to something other than these seven `The*.tsx` pages —
> a different seven-part construct — say so and this row reopens. The identifier
> resolves to these files in both the base and `rcs-code-book/`.

---

## 2.5 Engines — base is a near-superset; 4 genuine gaps

Base: **55** engines. `russell-capital`: **32**. `russell-capital-app`: **32**.

**In `russell-capital` but not in the base — the only engine migration candidates:**

| Engine | Chosen | Action |
|---|---|---|
| `clientOnboardingEngine.ts` | **RC** | evaluate → migrate (PR-06) |
| `complianceDocGeneratorEngine.ts` | **RC** | evaluate → migrate (PR-06) |
| `familyTreeFinancialEngine.ts` | **RC** | evaluate → migrate (PR-06) |
| `multiCurrencyWealthEngine.ts` | **RC** | evaluate → migrate (PR-06) |

**In the base but not in `russell-capital` — 27 engines, all BASE, no action:**
`careerEngine`, `chainEngine`, `cycleEngine`, `disabilityGapAnalyzerEngine`,
`exchangeChainEngine`, `historicalMarketRegimeEngine`, `hybridIncomeFloorEngine`,
`inheritanceEngine`, `iulLoanOptimizationEngine`, `journeyEngine`,
`keyPersonValuationEngine`, `longevityEngine`, `ltcEngine`, `macroEngine`,
`multiGenTransferEngine`, `physicianLoanRefiEngine`, `practiceAcquisitionEngine`,
`realEstateCapacityEngine`, `realEstateCapitalStackEngine`,
`realEstateStressEngine`, `realEstateStructuredFinanceEngine`,
`rentalMarketEngine`, `scenarioEngine`, `strEngine`, `ultraEngine`,
`whispererEngine`, `zipEngine`.

**Engines present in both (28):** base implementation chosen by default. A
content diff is required before any is replaced — none is proposed.

---

## 2.6 Behavioral schema

| Module | Base | `russell-capital` | Chosen |
|---|:--:|:--:|---|
| `shared/behavioralBiasEngine.ts` | ✅ | ✅ | **BASE** — diff required before any change |
| `shared/clientRetentionEngine.ts` | ✅ | ✅ | **BASE** — diff required before any change |
| `shared/realEstateFindings.ts` | ✅ | ❌ | BASE |
| `shared/forgiveness.ts` | ✅ | ❌ | BASE |
| `shared/patentCatalog.ts` | ✅ | ❌ | BASE |
| `shared/homeManifesto.json` | ✅ | ❌ | BASE |
| `shared/council/aiCouncil.ts` | ✅ | ❌ | BASE |

The base carries **174 files in `shared/`** against the donor's **63**. The two
shared behavioral modules are byte-diffed in **PR-06** before any decision; the
default is BASE.

> The brief names "behavioral schema" as a `russell-capital` contribution. The
> two modules that match that description exist in both trees. Whether the donor
> copies are newer is a diff, not an assumption — PR-06 runs it and reports
> before changing anything.

---

## 2.7 Nav architecture

| Capability | Base | `russell-capital-app` | Chosen |
|---|---|---|---|
| Sidebar / nav tree | base's own `AppShell` | `navTree.ts` (1,058 lines, 5-level recursive) + `navConfig.ts` (640 lines, `ROUTE_LAYER` L1/L2/L3/CUT/MERGE) | **DEFERRED** |

The app's `ROUTE_LAYER` scheme is a genuine de-duplication mechanism — but that
build still carries **41 internally duplicated routes**, so the scheme did not
prevent the failure it targets. The base has **zero** duplicate routes without
it.

**Action: no nav migration in this consolidation.** Evaluated separately in
**PR-10** against the base's existing nav, after the route work settles.

---

## 2.8 Net-new capabilities (exist nowhere)

| Capability | Source | Chosen |
|---|---|---|
| Plastic to Cash (page + card/carrier data + IUL projection) | branch `claude/russell-capital-consolidation-kbwl81` in `russell-capital` | **NEW** — PR-09 |
| Mutual Carriers (carrier intelligence) | same branch | **NEW** — PR-09 |

Built in an earlier session under a superseded plan. The code is standalone
(two pages + one data module, no registry edits) and carries its own compliance
disclosures. Re-reviewed on its own merits as the **last** PR in the sequence,
not carried in as part of any merge.

---

## 2.9 Summary of migration volume

| Category | Candidates | PR |
|---|---:|---|
| Gamification routes | **9** | PR-05 |
| Engines | **4** | PR-06 |
| Routes exclusive to `russell-capital-app` | **3** | PR-07 |
| Remaining `russell-capital` routes needing triage | **382** | PR-08 (triage only) |
| Net-new pages | **2** | PR-09 |
| Nav architecture | 1 decision | PR-10 |
| Registries / manifests / tests overwritten | **0** | — |

**Out of the 391 routes in `russell-capital` absent from the base, only 9 are
confirmed migrations today.** The other 382 collide with working base routes and
require per-route triage before any of them is a candidate. That triage is a
report, not a migration — see [04](04_ROUTE_COLLISION_REPORT.md).
