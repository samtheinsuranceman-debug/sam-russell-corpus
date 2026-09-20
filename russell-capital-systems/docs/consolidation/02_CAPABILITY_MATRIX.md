# Consolidation Foundation — Capability Matrix

One chosen implementation per capability. `LIVE` = keep the canonical base's version.
`DONOR` = migrate the donor's version. `COMPARE` = undecided, needs a documented diff and
regression proof before either is chosen.

Default rule: **anything already in the live build stays LIVE unless a documented comparison
shows the donor's version is better.** Nothing is marked DONOR in this document without review.

---

## A. Shared modules present in BOTH builds (36) — all COMPARE

These are the same filename in both trees. Each needs a diff before a choice is recorded.

| Module | Decision | Notes |
|---|---|---|
| `shared/_core/errors.ts` | COMPARE | |
| `shared/accessControl.ts` | COMPARE | |
| `shared/advancedAnalytics.ts` | COMPARE | |
| `shared/advisorySummaryData.ts` | COMPARE | |
| `shared/annuityData.ts` | COMPARE | |
| `shared/branding.ts` | COMPARE | |
| `shared/carrierRatings.ts` | COMPARE | |
| `shared/carrierRecommendation.ts` | COMPARE | |
| `shared/const.ts` | COMPARE | |
| `shared/cryptoCycleEngine.ts` | COMPARE | |
| `shared/estateTaxEngine.ts` | COMPARE | |
| `shared/fiaCollateralEngine.ts` | COMPARE | |
| `shared/growthAnnuityEngine.ts` | COMPARE | |
| `shared/householdWealth.bak.ts` | COMPARE | |
| `shared/householdWealth.ts` | COMPARE | |
| `shared/ibbotsonModel.ts` | COMPARE | |
| `shared/indexCreditingData.ts` | COMPARE | |
| `shared/iulCarriers.ts` | COMPARE | |
| `shared/lifetimeIncomeEngine.ts` | COMPARE | |
| `shared/livingRiskProfile.ts` | COMPARE | |
| `shared/modelPortfolios.ts` | COMPARE | |
| `shared/monteCarloEngine.ts` | COMPARE | |
| `shared/mortgageKiller.ts` | COMPARE | |
| `shared/multiPropertyMyga.ts` | COMPARE | |
| `shared/mygaWaterfall.ts` | COMPARE | |
| `shared/policyLoanOptimizer.ts` | COMPARE | |
| `shared/premiumFinancing.ts` | COMPARE | |
| `shared/replacementScoring.ts` | COMPARE | |
| `shared/retirementDNA.ts` | COMPARE | |
| `shared/reverseHeloc.ts` | COMPARE | |
| `shared/slideThemes.ts` | COMPARE | |
| `shared/tabScores.ts` | COMPARE | |
| `shared/taxBracketEngine.ts` | COMPARE | |
| `shared/timeMachineEngine.ts` | COMPARE | |
| `shared/types.ts` | COMPARE | |
| `shared/weaponizeEngines.ts` | COMPARE | |

## B. Donor-only shared engines (27) — candidates, default OUT

| Module | Decision |
|---|---|
| `shared/annuityFeeDetectionEngine.ts` | CANDIDATE |
| `shared/behavioralBiasEngine.ts` | CANDIDATE |
| `shared/captiveInsuranceEngine.ts` | CANDIDATE |
| `shared/carrierStrengthMonitorEngine.ts` | CANDIDATE |
| `shared/ceCreditTrackerEngine.ts` | CANDIDATE |
| `shared/clientOnboardingEngine.ts` | CANDIDATE |
| `shared/clientRetentionEngine.ts` | CANDIDATE |
| `shared/commissionOptimizerEngine.ts` | CANDIDATE |
| `shared/complianceDocGeneratorEngine.ts` | CANDIDATE |
| `shared/crtWealthReplacementEngine.ts` | CANDIDATE |
| `shared/disabilityGapEngine.ts` | CANDIDATE |
| `shared/divorceFinancialEngine.ts` | CANDIDATE |
| `shared/familyTreeFinancialEngine.ts` | CANDIDATE |
| `shared/generationalWealthEngine.ts` | CANDIDATE |
| `shared/iulComplianceEngine.ts` | CANDIDATE |
| `shared/livingBenefitsProbabilityEngine.ts` | CANDIDATE |
| `shared/multiCarrierIULOptimizer.ts` | CANDIDATE |
| `shared/multiCurrencyWealthEngine.ts` | CANDIDATE |
| `shared/peerBenchmarkingEngine.ts` | CANDIDATE |
| `shared/policyReplacementAnalyzer.ts` | CANDIDATE |
| `shared/premiumFinancingArbitrage.ts` | CANDIDATE |
| `shared/prospectQualificationEngine.ts` | CANDIDATE |
| `shared/retirementGapEngine.ts` | CANDIDATE |
| `shared/socialSecurityBridgeEngine.ts` | CANDIDATE |
| `shared/stateTaxMigrationEngine.ts` | CANDIDATE |
| `shared/successionValuationEngine.ts` | CANDIDATE |
| `shared/taxCodeChangeSimulator.ts` | CANDIDATE |

## C. Live-only shared modules (79) — LIVE, no action

Not listed individually; they are unaffected by the merge.

## D. Server modules present in BOTH (44) — all COMPARE

| Module | Decision |
|---|---|
| `server/_core/context.ts` | COMPARE |
| `server/_core/cookies.ts` | COMPARE |
| `server/_core/dataApi.ts` | COMPARE |
| `server/_core/env.ts` | COMPARE |
| `server/_core/imageGeneration.ts` | COMPARE |
| `server/_core/index.ts` | COMPARE |
| `server/_core/llm.ts` | COMPARE |
| `server/_core/map.ts` | COMPARE |
| `server/_core/notification.ts` | COMPARE |
| `server/_core/oauth.ts` | COMPARE |
| `server/_core/sdk.ts` | COMPARE |
| `server/_core/storageProxy.ts` | COMPARE |
| `server/_core/systemRouter.ts` | COMPARE |
| `server/_core/trpc.ts` | COMPARE |
| `server/_core/types/manusTypes.ts` | COMPARE |
| `server/_core/vite.ts` | COMPARE |
| `server/_core/voiceTranscription.ts` | COMPARE |
| `server/batchStrategyPdf.ts` | COMPARE |
| `server/bulkComparisonPdf.ts` | COMPARE |
| `server/calendarService.ts` | COMPARE |
| `server/carrierRatingsService.ts` | COMPARE |
| `server/csvTemplate.ts` | COMPARE |
| `server/dataFeedService.ts` | COMPARE |
| `server/db.ts` | COMPARE |
| `server/email.ts` | COMPARE |
| `server/emailPinService.ts` | COMPARE |
| `server/experienceDb.ts` | COMPARE |
| `server/experienceRouter.ts` | COMPARE |
| `server/generate1035Pdf.ts` | COMPARE |
| `server/heygenService.ts` | COMPARE |
| `server/index.ts` | COMPARE |
| `server/mortgageKillerPdf.ts` | COMPARE |
| `server/pdfExportService.ts` | COMPARE |
| `server/pdfReport.ts` | COMPARE |
| `server/rothPdfReport.ts` | COMPARE |
| `server/routers.ts` | COMPARE |
| `server/slackBot.ts` | COMPARE |
| `server/storage.ts` | COMPARE |
| `server/strategyPdfService.ts` | COMPARE |
| `server/stripeClient.ts` | COMPARE |
| `server/stripeProducts.ts` | COMPARE |
| `server/stripeWebhook.ts` | COMPARE |
| `server/videoScriptGenerator.ts` | COMPARE |
| `server/webhookDispatch.ts` | COMPARE |

## E. Registries that must not be replaced without regression proof

| Registry | Path | Status |
|---|---|---|
| Route manifest | `client/src/App.tsx` | LIVE — additive changes only |
| Sidebar registry | `client/src/components/AppShell.tsx` (`NAV_SECTIONS`) | LIVE |
| Secondary catalogue | `client/src/lib/secondaryCatalog.ts` | LIVE — **enforced disjoint from the sidebar by `server/navigation-organization.test.ts`** |
| Build route emitter | `scripts/build.mjs` → `dist/public/routes.json` | LIVE |
| Drizzle schema | `drizzle/` + `shared/` schema modules | LIVE |

> **Live invariant discovered during this pass.** Promoting any orphaned route into the primary
> sidebar breaks `navigation-organization.test.ts` unless the same path is removed from
> `secondaryCatalog.ts` in the same change. Five promotions were attempted and reverted for this
> reason; see the verification log. Any future promotion must be a coordinated two-file change.
