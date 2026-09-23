# Provenance census — summary (tree `8194d52`)

Every count below is computed from the tree; none is typed. `server/provenanceCensus.test.ts` fails the build if any list grows.

| Count | Value |
|---|---|
| Engines censused | 95 (36 via catalogue bindings, 87 via memory-bank modules, union) |
| **Engines with zero sources** | **20** (of which 8 carry 20+ typed-in numeric literals) |
| **Catalogue engines whose sources the shell cannot print yet** | **26** |
| **Engines with unseeded randomness** | **1** |
| **Pages that import an engine and print no source** | **95** of 120 |
| Engines with hard-coded years older than 2025 | 39 |
| Engines that simulate | 20 |
| Engines on a live feed seam | 9 |
| Engines imported by no page and no router | 8 |

## Engines with zero sources

- `shared/accessControl.ts`
- `shared/advisorModes.ts`
- `shared/altCredit/simulator.ts`
- `shared/carrierRatings.ts`
- `shared/cryptoCycleEngine.ts`
- `shared/erosion.ts`
- `shared/firewall.ts`
- `shared/genomeStrategyFit.ts`
- `shared/historicalShocks.ts`
- `shared/householdWealth.ts`
- `shared/monteCarloEngine.ts`
- `shared/mortgageKiller.ts`
- `shared/mortgageLedger.ts`
- `shared/multiPropertyMyga.ts`
- `shared/mygaWaterfall.ts`
- `shared/premiumFinancing.ts`
- `shared/realEstateCapacityEngine.ts`
- `shared/regulatorySandbox.ts`
- `shared/reverseHeloc.ts`
- `shared/taxBracketEngine.ts`

## Catalogue engines whose sources the shell cannot print yet

- `server/outsideForces.ts`
- `shared/altCredit/simulator.ts`
- `shared/balancedIndexedAccount.ts`
- `shared/clientFactFinder.ts`
- `shared/compositeMind.ts`
- `shared/cycleEngine.ts`
- `shared/erosion.ts`
- `shared/forgiveness.ts`
- `shared/genomeStrategyFit.ts`
- `shared/householdGenome.ts`
- `shared/liquidityRoutes.ts`
- `shared/mechanismDossiers.ts`
- `shared/mortgageKiller.ts`
- `shared/mortgageLedger.ts`
- `shared/nlpBrain.ts`
- `shared/pageRatings.ts`
- `shared/policyMechanics.ts`
- `shared/provenance.ts`
- `shared/realEstateCapacityEngine.ts`
- `shared/retirementDNA.ts`
- `shared/sequencePlanner.ts`
- `shared/taxBracketEngine.ts`
- `shared/taxSchedule.ts`
- `shared/thresholds.ts`
- `shared/ultraEngine.ts`
- `shared/wealthGenomeFactors.ts`

## Engines with unseeded randomness

- `shared/chainEngine.ts`

## Pages that import an engine and print no source

- `client/src/components/ChainDock.tsx`
- `client/src/components/ComplianceGate.tsx`
- `client/src/components/ConsumerOutcomeBlocks.tsx`
- `client/src/components/ExitRating.tsx`
- `client/src/components/IbbotsonYearSelector.tsx`
- `client/src/components/MonteCarloChart.tsx`
- `client/src/components/MultiPropertyTab.tsx`
- `client/src/components/ProprietaryTech.tsx`
- `client/src/components/ReplacementRadarPanel.tsx`
- `client/src/components/SubscriptionGuard.tsx`
- `client/src/components/VoiceAdvisor.tsx`
- `client/src/components/rooms/Reveal.tsx`
- `client/src/components/rooms/RoomTheme.tsx`
- `client/src/pages/Login.tsx`
- `client/src/pages/MassiveCalculatorsPage.tsx`
- `client/src/pages/SpecialtyIndexPage.tsx`
- `client/src/pages/TrialLogin.tsx`
- `client/src/pages/UltraCalculatorPage.tsx`
- `client/src/pages/portal/AIFinancialAdvisor.tsx`
- `client/src/pages/portal/AIPolicyReviewGap.tsx`
- `client/src/pages/portal/AdvisorIncomeCalculator.tsx`
- `client/src/pages/portal/AiStrategyRecommender.tsx`
- `client/src/pages/portal/AltCreditHub.tsx`
- `client/src/pages/portal/AnnuityAccumulationDB.tsx`
- `client/src/pages/portal/AnnuityMemory.tsx`
- `client/src/pages/portal/AtheneGuaranteedIncome.tsx`
- `client/src/pages/portal/AxonicSP500.tsx`
- `client/src/pages/portal/BeneficiaryOptimization.tsx`
- `client/src/pages/portal/BulkGeneration.tsx`
- `client/src/pages/portal/BusinessOwnerPlanning.tsx`
- `client/src/pages/portal/CarrierComparison.tsx`
- `client/src/pages/portal/ChainBuilder.tsx`
- `client/src/pages/portal/CharitableGivingOptimizer.tsx`
- `client/src/pages/portal/ClientPortfolioDashboard.tsx`
- `client/src/pages/portal/ClientSnapshotMap.tsx`
- `client/src/pages/portal/CompetitiveAnalysis.tsx`
- `client/src/pages/portal/Controls.tsx`
- `client/src/pages/portal/CryptoCurrencyCorner.tsx`
- `client/src/pages/portal/EstateFlowChart.tsx`
- `client/src/pages/portal/EstateTax.tsx`
- `client/src/pages/portal/FIACollateralStrategy.tsx`
- `client/src/pages/portal/FIATop10.tsx`
- `client/src/pages/portal/FinancialAssessment.tsx`
- `client/src/pages/portal/GenomeStrategies.tsx`
- `client/src/pages/portal/GrowthAnnuities.tsx`
- `client/src/pages/portal/HotIncome.tsx`
- `client/src/pages/portal/HouseRecyclingStrategy.tsx`
- `client/src/pages/portal/HouseholdWealth.tsx`
- `client/src/pages/portal/IULvsRoth.tsx`
- `client/src/pages/portal/IbbotsonCharts.tsx`
- `client/src/pages/portal/IllustrationCompare.tsx`
- `client/src/pages/portal/IncomeAnnuityTop10.tsx`
- `client/src/pages/portal/IncomeGapAnalyzer.tsx`
- `client/src/pages/portal/IncomeTimeline.tsx`
- `client/src/pages/portal/IndexStrategyComparison.tsx`
- `client/src/pages/portal/InfiniteBanking.tsx`
- `client/src/pages/portal/InflationAnalysis.tsx`
- `client/src/pages/portal/MarketScenarioStressTest.tsx`
- `client/src/pages/portal/MechanismDetail.tsx`
- `client/src/pages/portal/Mechanisms.tsx`
- `client/src/pages/portal/MedicareIRMAA.tsx`
- `client/src/pages/portal/MortgageLedger.tsx`
- `client/src/pages/portal/MultiGenWealthTransfer.tsx`
- `client/src/pages/portal/MultiScenarioPlayZone.tsx`
- `client/src/pages/portal/PatentShowcase.tsx`
- `client/src/pages/portal/PolicyLoans.tsx`
- `client/src/pages/portal/PolicyReview.tsx`
- `client/src/pages/portal/PortfolioDriftMonitor.tsx`
- `client/src/pages/portal/PredictiveAnalytics.tsx`
- `client/src/pages/portal/QuickQuote.tsx`
- `client/src/pages/portal/RealEstateMogul.tsx`
- `client/src/pages/portal/Recommendations.tsx`
- `client/src/pages/portal/RetirementGuardrails.tsx`
- `client/src/pages/portal/ReverseHeloc.tsx`
- `client/src/pages/portal/SavedScenariosHub.tsx`
- `client/src/pages/portal/ScenarioAdjustments.tsx`
- `client/src/pages/portal/ScenarioSideBySide.tsx`
- `client/src/pages/portal/SequencePlanner.tsx`
- `client/src/pages/portal/SocialSecurityOptimizer.tsx`
- `client/src/pages/portal/Sphere.tsx`
- `client/src/pages/portal/StrategyCompare.tsx`
- `client/src/pages/portal/StrategyLab.tsx`
- `client/src/pages/portal/SuccessionPlanningWizard.tsx`
- `client/src/pages/portal/TaxAdvantagedGrowth.tsx`
- `client/src/pages/portal/TaxBracketVisualizer.tsx`
- `client/src/pages/portal/TaxLossHarvestingScanner.tsx`
- `client/src/pages/portal/TaxOpportunityDetector.tsx`
- `client/src/pages/portal/TaxReturnUpload.tsx`
- `client/src/pages/portal/TaxWaterfall.tsx`
- `client/src/pages/portal/ThomasGoldman.tsx`
- `client/src/pages/portal/Thresholds.tsx`
- `client/src/pages/portal/TimeMachineAG49.tsx`
- `client/src/pages/portal/TimeMachineCalculator.tsx`
- `client/src/pages/portal/TimeMachineMethod.tsx`
- `client/src/pages/portal/WithdrawalSequencing.tsx`

## Engines with hard-coded years older than 2025

- `server/outsideForces.ts (2019, 2023)`
- `shared/ag49Validator.ts (2015, 2020, 2023)`
- `shared/altCredit/deployment.ts (2014, 2015, 2019, 2022, 2023, 2024)`
- `shared/altCredit/lenders.ts (2004, 2006, 2012, 2013, 2017, 2018, 2019, 2021)`
- `shared/altCredit/routes.ts (2005, 2006, 2008, 2019, 2020, 2021, 2022, 2023, 2024)`
- `shared/annuityData.ts (2000)`
- `shared/balancedIndexedAccount.ts (2019, 2020, 2021, 2022, 2023, 2024)`
- `shared/careerEngine.ts (2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)`
- `shared/creditingWindows.ts (2000, 2007, 2020)`
- `shared/cryptoCycleEngine.ts (2012, 2013, 2015, 2016, 2017, 2018, 2020, 2021, 2022, 2024)`
- `shared/estateTaxEngine.ts (2024)`
- `shared/forgiveness.ts (2007, 2009, 2010, 2011, 2012, 2014, 2015, 2018, 2020, 2021, 2022, 2023, 2024)`
- `shared/genomeStrategies.ts (2022)`
- `shared/growthAnnuityEngine.ts (2019, 2020, 2021, 2022, 2023, 2024)`
- `shared/historicalShocks.ts (2000, 2002, 2008, 2020, 2022)`
- `shared/ibbotsonModel.ts (2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)`
- `shared/incomeForLife.ts (2003, 2004, 2018, 2023)`
- `shared/indexCreditingData.ts (2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)`
- `shared/inheritanceEngine.ts (2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)`
- `shared/lifetimeIncomeEngine.ts (2019, 2024)`
- `shared/liquidityRoutes.ts (2004, 2006, 2008, 2020)`
- `shared/longevityEngine.ts (2012, 2020, 2021, 2023)`
- `shared/ltcEngine.ts (2022)`
- `shared/macroEngine.ts (2010, 2019, 2020, 2021, 2022, 2023)`
- `shared/mutualIulCarriers.ts (2023)`
- `shared/nlpBrain.ts (2008)`
- `shared/patentCatalog.ts (2008, 2020, 2022)`
- `shared/powerHistory.ts (2000, 2001, 2003, 2005, 2007, 2008, 2009, 2011, 2013, 2015, 2016, 2017, 2019, 2020, 2021, 2023, 2024)`
- `shared/provenance.ts (2019, 2020)`
- `shared/sequenceOrderings.ts (2021)`
- `shared/sp500SeriesAudit.ts (2000, 2016, 2019, 2023, 2024)`
- `shared/taxHistory.ts (2000, 2001, 2002, 2003, 2004, 2005, 2006, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)`
- `shared/taxRules.ts (2024)`
- `shared/taxStrategies.ts (2010, 2020, 2022, 2023, 2024)`
- `shared/thresholds.ts (2022)`
- `shared/unaskedQuestions.ts (2018)`
- `shared/wealthGenomeDurability.ts (2008, 2019, 2020, 2022)`
- `shared/wealthGenomeFactors.ts (2008, 2020, 2022)`
- `shared/zipEngine.ts (2000, 2008, 2015)`

## What this census does not contain

- No environment values, keys, private hostnames or vault material.
- No method claims: formulas, coefficients, weightings and step order are not described.
- No client data.
