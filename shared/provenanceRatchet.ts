/**
 * Provenance ratchet — the allow-lists that only shrink.
 *
 * Measured once on master aecbb6c (23 Sep 2026) by
 * server/_core/provenanceCensus.ts, then frozen here. server/provenanceCensus.test.ts
 * asserts two things on every run:
 *
 *   1. nothing the census finds is missing from these lists — a new engine
 *      with typed-in numbers and no source, a new Math.random in a value
 *      path, a new page that prints no source, fails the build
 *   2. nothing on these lists has stopped failing — when an engine is
 *      sourced, its line is removed here in the same change, so the list is
 *      always the true remaining work and never a stale record
 *
 * Sourcing an engine means: name the institution, the document, the URL and
 * the date read, next to the number, and export a `*_SOURCES` constant so
 * the shell can print it (shared/engineSources.ts). Anything nobody knows is
 * declared an assumption in words, not left as a bare literal.
 */

/** Engines that carry typed-in numeric literals and name no institution, URL, dated source or exported source constant. */
export const ZERO_SOURCE_ENGINES: readonly string[] = [

];

/** Engines with Math.random() in a value path. chainEngine uses it for step ids only (cosmetic, D47). */
export const UNSEEDED_RANDOM_ENGINES: readonly string[] = [
  "shared/chainEngine.ts",
];

/** Catalogue engines with no loader in shared/engineSources.ts, so the shell cannot print their sources yet. outsideForces is server code the shell cannot import. */
export const CATALOGUE_ENGINES_WITHOUT_SHELL_SOURCES: readonly string[] = [
  "server/outsideForces.ts",
];

/** Pages and components that import an engine and print no source, and whose route the shell does not cover. */
export const PAGES_PRINTING_NO_SOURCE: readonly string[] = [
  "client/src/components/ChainDock.tsx",
  "client/src/components/ComplianceGate.tsx",
  "client/src/components/ConsumerOutcomeBlocks.tsx",
  "client/src/components/ExitRating.tsx",
  "client/src/components/IbbotsonYearSelector.tsx",
  "client/src/components/MonteCarloChart.tsx",
  "client/src/components/MultiPropertyTab.tsx",
  "client/src/components/ProprietaryTech.tsx",
  "client/src/components/ReplacementRadarPanel.tsx",
  "client/src/components/SubscriptionGuard.tsx",
  "client/src/components/VoiceAdvisor.tsx",
  "client/src/components/rooms/Reveal.tsx",
  "client/src/components/rooms/RoomTheme.tsx",
  "client/src/pages/Login.tsx",
  "client/src/pages/MassiveCalculatorsPage.tsx",
  "client/src/pages/SpecialtyIndexPage.tsx",
  "client/src/pages/TrialLogin.tsx",
  "client/src/pages/portal/AIFinancialAdvisor.tsx",
  "client/src/pages/portal/AIPolicyReviewGap.tsx",
  "client/src/pages/portal/AdvisorIncomeCalculator.tsx",
  "client/src/pages/portal/AiStrategyRecommender.tsx",
  "client/src/pages/portal/AnnuityAccumulationDB.tsx",
  "client/src/pages/portal/AnnuityMemory.tsx",
  "client/src/pages/portal/AtheneGuaranteedIncome.tsx",
  "client/src/pages/portal/AxonicSP500.tsx",
  "client/src/pages/portal/BeneficiaryOptimization.tsx",
  "client/src/pages/portal/BulkGeneration.tsx",
  "client/src/pages/portal/BusinessOwnerPlanning.tsx",
  "client/src/pages/portal/CarrierComparison.tsx",
  "client/src/pages/portal/ChainBuilder.tsx",
  "client/src/pages/portal/CharitableGivingOptimizer.tsx",
  "client/src/pages/portal/ClientPortfolioDashboard.tsx",
  "client/src/pages/portal/ClientSnapshotMap.tsx",
  "client/src/pages/portal/CompetitiveAnalysis.tsx",
  "client/src/pages/portal/Controls.tsx",
  "client/src/pages/portal/CryptoCurrencyCorner.tsx",
  "client/src/pages/portal/EstateFlowChart.tsx",
  "client/src/pages/portal/EstateTax.tsx",
  "client/src/pages/portal/FIACollateralStrategy.tsx",
  "client/src/pages/portal/FIATop10.tsx",
  "client/src/pages/portal/GrowthAnnuities.tsx",
  "client/src/pages/portal/IncomeAnnuityTop10.tsx",
  "client/src/pages/portal/PatentShowcase.tsx",
  "client/src/pages/portal/Sphere.tsx",
  "client/src/pages/portal/StrategyCompare.tsx",
  "client/src/pages/portal/ThomasGoldman.tsx",
];
