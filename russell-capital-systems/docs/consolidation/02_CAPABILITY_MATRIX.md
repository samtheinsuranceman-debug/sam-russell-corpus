# Consolidation Foundation — Capability Matrix

Base = `russell-capital-app`. `BASE` keeps the base's implementation. `DONOR` migrates
`russell-capital-systems`'s version in. `COMPARE` = undecided, needs a documented diff and a
passing regression run before either is chosen.

Default rule: **the base wins unless a documented comparison shows the donor's version is better.**
Nothing is marked DONOR here without review.

---

## A. Shared modules present in BOTH (36) — all COMPARE

| Module | Decision |
|---|---|
| `shared/_core/errors.ts` | COMPARE |
| `shared/accessControl.ts` | COMPARE |
| `shared/advancedAnalytics.ts` | COMPARE |
| `shared/advisorySummaryData.ts` | COMPARE |
| `shared/annuityData.ts` | COMPARE |
| `shared/branding.ts` | COMPARE |
| `shared/carrierRatings.ts` | COMPARE |
| `shared/carrierRecommendation.ts` | COMPARE |
| `shared/const.ts` | COMPARE |
| `shared/cryptoCycleEngine.ts` | COMPARE |
| `shared/estateTaxEngine.ts` | COMPARE |
| `shared/fiaCollateralEngine.ts` | COMPARE |
| `shared/growthAnnuityEngine.ts` | COMPARE |
| `shared/householdWealth.bak.ts` | COMPARE |
| `shared/householdWealth.ts` | COMPARE |
| `shared/ibbotsonModel.ts` | COMPARE |
| `shared/indexCreditingData.ts` | COMPARE |
| `shared/iulCarriers.ts` | COMPARE |
| `shared/lifetimeIncomeEngine.ts` | COMPARE |
| `shared/livingRiskProfile.ts` | COMPARE |
| `shared/modelPortfolios.ts` | COMPARE |
| `shared/monteCarloEngine.ts` | COMPARE |
| `shared/mortgageKiller.ts` | COMPARE |
| `shared/multiPropertyMyga.ts` | COMPARE |
| `shared/mygaWaterfall.ts` | COMPARE |
| `shared/policyLoanOptimizer.ts` | COMPARE |
| `shared/premiumFinancing.ts` | COMPARE |
| `shared/replacementScoring.ts` | COMPARE |
| `shared/retirementDNA.ts` | COMPARE |
| `shared/reverseHeloc.ts` | COMPARE |
| `shared/slideThemes.ts` | COMPARE |
| `shared/tabScores.ts` | COMPARE |
| `shared/taxBracketEngine.ts` | COMPARE |
| `shared/timeMachineEngine.ts` | COMPARE |
| `shared/types.ts` | COMPARE |
| `shared/weaponizeEngines.ts` | COMPARE |

## B. Donor-only shared modules (79) — candidates to migrate in

These exist in `russell-capital-systems` and **not** in the base. Each is a candidate.

| Module | Decision |
|---|---|
| `shared/advisorModes.ts` | CANDIDATE |
| `shared/ag49Validator.ts` | CANDIDATE |
| `shared/aiIntakeScript.ts` | CANDIDATE |
| `shared/altCredit/deployment.ts` | CANDIDATE |
| `shared/altCredit/lenders.ts` | CANDIDATE |
| `shared/altCredit/presets.ts` | CANDIDATE |
| `shared/altCredit/routes.ts` | CANDIDATE |
| `shared/altCredit/simulator.ts` | CANDIDATE |
| `shared/altCredit/types.ts` | CANDIDATE |
| `shared/assessmentBridge.ts` | CANDIDATE |
| `shared/balancedIndexedAccount.ts` | CANDIDATE |
| `shared/calculatorCatalog.ts` | CANDIDATE |
| `shared/careerEngine.ts` | CANDIDATE |
| `shared/chainEngine.ts` | CANDIDATE |
| `shared/clientFactFinder.ts` | CANDIDATE |
| `shared/compositeMind.ts` | CANDIDATE |
| `shared/consent.ts` | CANDIDATE |
| `shared/costStructure.ts` | CANDIDATE |
| `shared/creditUnionLenders.ts` | CANDIDATE |
| `shared/creditingWindows.ts` | CANDIDATE |
| `shared/erosion.ts` | CANDIDATE |
| `shared/firewall.ts` | CANDIDATE |
| `shared/forgiveness.ts` | CANDIDATE |
| `shared/genomeStrategies.ts` | CANDIDATE |
| `shared/genomeStrategyFit.ts` | CANDIDATE |
| `shared/historicalShocks.ts` | CANDIDATE |
| `shared/householdGenome.ts` | CANDIDATE |
| `shared/illustrationCalibration.ts` | CANDIDATE |
| `shared/incomeForLife.ts` | CANDIDATE |
| `shared/inheritanceEngine.ts` | CANDIDATE |
| `shared/irc7702.ts` | CANDIDATE |
| `shared/iulLinks.ts` | CANDIDATE |
| `shared/journeyCatalog.ts` | CANDIDATE |
| `shared/journeyEngine.ts` | CANDIDATE |
| `shared/leadTypes.ts` | CANDIDATE |
| `shared/liquidityRoutes.ts` | CANDIDATE |
| `shared/loginDisclaimers.ts` | CANDIDATE |
| `shared/longevityEngine.ts` | CANDIDATE |
| `shared/ltcEngine.ts` | CANDIDATE |
| `shared/macroEngine.ts` | CANDIDATE |
| `shared/mandates.ts` | CANDIDATE |
| `shared/mortgageLedger.ts` | CANDIDATE |
| `shared/mutualIulCarriers.ts` | CANDIDATE |
| `shared/nlpBrain.ts` | CANDIDATE |
| `shared/pacificHorizonEcv.ts` | CANDIDATE |
| `shared/passwordPolicy.ts` | CANDIDATE |
| `shared/patentCatalog.ts` | CANDIDATE |
| `shared/patentStatus.ts` | CANDIDATE |
| `shared/planLedger.ts` | CANDIDATE |
| `shared/policyLoanMechanics.ts` | CANDIDATE |
| `shared/policyMechanics.ts` | CANDIDATE |
| `shared/policyMultiplier.ts` | CANDIDATE |
| `shared/powerHistory.ts` | CANDIDATE |
| `shared/provenance.ts` | CANDIDATE |
| `shared/qbiDeduction.ts` | CANDIDATE |
| `shared/regulatorySandbox.ts` | CANDIDATE |
| `shared/rentalEnterprise.ts` | CANDIDATE |
| `shared/retirementLimits.ts` | CANDIDATE |
| `shared/revealCopy.ts` | CANDIDATE |
| `shared/roomVideos.ts` | CANDIDATE |
| …and 19 more | CANDIDATE |

## C. Server modules present in BOTH (44) — all COMPARE

## D. Donor-only server modules (86) — candidates

## E. Registries — base copies are authoritative

| Registry | Path in base | Status |
|---|---|---|
| Navigation tree | `client/src/navTree.ts` | **BASE** — the reason this repo is the base |
| Route manifest | `client/src/App.tsx` | BASE — additive only |
| Consolidation manifest | `CONSOLIDATION_PLAN.json` | BASE — 687 scored entries drive selection |
| Deploy config | `vercel.json`, `api/index.ts` | BASE — do not alter |
| Drizzle schema | `drizzle/`, `shared/` | BASE — additive migrations only |

> **Invariant carried over from the donor.** In `russell-capital-systems`, the sidebar and
> `secondaryCatalog.ts` are enforced disjoint by `navigation-organization.test.ts`. If that
> catalogue is migrated, the invariant and its test must come with it.
