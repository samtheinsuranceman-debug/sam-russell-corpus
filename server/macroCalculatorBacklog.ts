/**
 * The predictive calculators that do not yet apply the portal's macro
 * scenario to their own numbers (production port, A22, 2026-09-23).
 *
 * `server/macroCalculatorCoverage.test.ts` is the ratchet: a path in
 * `PREDICTIVE_CALCULATOR_PATHS` must either apply the scenario
 * (`useCalculatorMacro({ years })` or `usePredictive()` plus `applyMacro`,
 * `applyMacroYear`, `.averaged` or `.forYear(`) or be listed here, and a page
 * that applies it must be removed from this list. Wiring a calculator is
 * therefore: edit the page, delete its line here, run the test.
 *
 * Generated from production master 90254e7: 80 predictive paths, 1 apply the
 * scenario (Mortgage Killer), 79 listed below. The page file is noted for
 * each; the per-page recipe is in the port package's APPLY.md (step 6).
 */
export const MACRO_CALCULATOR_BACKLOG: readonly string[] = [
  "/portal/recin", // client/src/pages/portal/RECINWorkspace.tsx
  "/ultra-calculator", // client/src/pages/UltraCalculatorPage.tsx
  "/portal/income-for-life", // client/src/pages/portal/IncomeForLife.tsx
  "/portal/retirement-projection", // client/src/pages/portal/RetirementIncomeProjection.tsx
  "/portal/income-gap", // client/src/pages/portal/IncomeGapAnalyzer.tsx
  "/portal/withdrawal-sequencing", // client/src/pages/portal/WithdrawalSequencing.tsx
  "/portal/lifetime-income", // client/src/pages/portal/LifetimeGuaranteedIncome.tsx
  "/portal/income-timeline", // client/src/pages/portal/IncomeTimeline.tsx
  "/portal/retirement-guardrails", // client/src/pages/portal/RetirementGuardrails.tsx
  "/portal/social-security", // client/src/pages/portal/SocialSecurityOptimizer.tsx
  "/portal/retirement-opportunities", // client/src/pages/RetirementOpportunitiesPage.tsx
  "/portal/ecological-drivers", // client/src/pages/portal/EcologicalDrivers.tsx
  "/portal/forgiveness", // client/src/pages/portal/Forgiveness.tsx
  "/portal/tax-waterfall", // client/src/pages/portal/TaxWaterfall.tsx
  "/portal/roth-conversion", // client/src/pages/portal/RothConversionSTR.tsx
  "/portal/erosion", // client/src/pages/portal/Erosion.tsx
  "/portal/tax-combos", // client/src/pages/portal/TaxFreeWealthCombos.tsx
  "/portal/tax-opportunities", // client/src/pages/portal/TaxOpportunityDetector.tsx
  "/portal/tax-loss-harvesting", // client/src/pages/portal/TaxLossHarvestingScanner.tsx
  "/portal/tax-advantaged-growth", // client/src/pages/portal/TaxAdvantagedGrowth.tsx
  "/portal/hot-income", // client/src/pages/portal/HotIncome.tsx
  "/portal/medicare-irmaa", // client/src/pages/portal/MedicareIRMAA.tsx
  "/portal/str-tax-eliminator", // client/src/pages/STRTaxEliminatorPage.tsx
  "/portal/oil-gas", // client/src/pages/OilGasPage.tsx
  "/portal/qbi-optimizer", // client/src/pages/portal/QbiOptimizer.tsx
  "/portal/iul-engine", // client/src/pages/portal/IulEngine.tsx
  "/portal/iul-projection", // client/src/pages/IulProjectionPage.tsx
  "/portal/iul-historical", // client/src/pages/portal/IULHistoricalPerformance.tsx
  "/portal/lookback-integrity", // client/src/pages/portal/LookbackIntegrity.tsx
  "/portal/iul-vs-roth", // client/src/pages/portal/IULvsRoth.tsx
  "/portal/policy-cost-lab", // client/src/pages/portal/PolicyCostLab.tsx
  "/portal/policy-loans", // client/src/pages/portal/PolicyLoans.tsx
  "/portal/early-cash-value", // client/src/pages/portal/EarlyCashValue.tsx
  "/portal/credit-line-sequencing", // client/src/pages/portal/CreditLineSequencing.tsx
  "/portal/premium-financing", // client/src/pages/portal/PremiumFinancing.tsx
  "/portal/fia-collateral", // client/src/pages/portal/FIACollateralStrategy.tsx
  "/portal/long-term-care", // client/src/pages/portal/LongTermCare.tsx
  "/portal/index-strategies", // client/src/pages/portal/IndexStrategyComparison.tsx
  "/portal/fia-top10", // client/src/pages/portal/FIATop10.tsx
  "/portal/myga-fixed-rate", // client/src/pages/portal/MYGAFixedRate.tsx
  "/portal/myga-waterfall", // client/src/pages/MygaWaterfallPage.tsx
  "/portal/annuity-explorer", // client/src/pages/AnnuityExplorerPage.tsx
  "/portal/income-annuity", // client/src/pages/IncomeAnnuityPage.tsx
  "/portal/mortgage-ledger", // client/src/pages/portal/MortgageLedger.tsx
  "/portal/liquidity-routes", // client/src/pages/portal/LiquidityRoutes.tsx
  "/portal/alt-credit", // client/src/pages/portal/AltCreditHub.tsx
  "/portal/mortgage-killer-v3", // client/src/pages/portal/MortgageKillerV3.tsx
  "/portal/zip-engine", // client/src/pages/portal/ZipEngine.tsx
  "/portal/real-estate-mogul", // client/src/pages/portal/RealEstateMogul.tsx
  "/portal/rental-enterprise", // client/src/pages/portal/RentalEnterprise.tsx
  "/portal/short-term-rentals", // client/src/pages/portal/ShortTermRentals.tsx
  "/portal/str-strategy", // client/src/pages/portal/STRStrategy.tsx
  "/portal/house-recycling", // client/src/pages/portal/HouseRecyclingStrategy.tsx
  "/portal/household-wealth", // client/src/pages/portal/HouseholdWealth.tsx
  "/portal/reverse-heloc", // client/src/pages/portal/ReverseHeloc.tsx
  "/portal/estate-tax", // client/src/pages/portal/EstateTax.tsx
  "/portal/estate-planning", // client/src/pages/EstatePlanningPage.tsx
  "/portal/estate-flow", // client/src/pages/portal/EstateFlowChart.tsx
  "/portal/trusts", // client/src/pages/portal/TrustsPage.tsx
  "/portal/inheritance", // client/src/pages/portal/Inheritance.tsx
  "/portal/multi-gen-wealth", // client/src/pages/portal/MultiGenWealthTransfer.tsx
  "/portal/beneficiary-optimization", // client/src/pages/portal/BeneficiaryOptimization.tsx
  "/portal/charitable-giving", // client/src/pages/portal/CharitableGivingOptimizer.tsx
  "/portal/divorce-ilit", // client/src/pages/DivorceILITStrategyPage.tsx
  "/portal/business-owner", // client/src/pages/portal/BusinessOwnerPlanning.tsx
  "/portal/succession-planning", // client/src/pages/portal/SuccessionPlanningWizard.tsx
  "/portal/physicians-edge", // client/src/pages/portal/PhysiciansEdge.tsx
  "/portal/divorce-calculator", // client/src/pages/portal/DivorceCalculator.tsx
  "/portal/divorce-recovery", // client/src/pages/DivorceCalculatorPage.tsx
  "/portal/wealth-genome", // client/src/pages/WealthGenomePage.tsx
  "/portal/infinite-banking", // client/src/pages/portal/InfiniteBanking.tsx
  "/portal/sequence-planner", // client/src/pages/portal/SequencePlanner.tsx
  "/portal/thresholds", // client/src/pages/portal/Thresholds.tsx
  "/portal/outside-forces", // client/src/pages/portal/OutsideForces.tsx
  "/portal/inflation", // client/src/pages/portal/InflationAnalysis.tsx
  "/portal/time-machine", // client/src/pages/portal/TimeMachine.tsx
  "/portal/time-machine-ag49", // client/src/pages/portal/TimeMachineAG49.tsx
  "/portal/index-backtester", // client/src/pages/portal/IndexBacktester.tsx
  "/portal/crypto-cycle", // client/src/pages/CryptoCyclePage.tsx
];
