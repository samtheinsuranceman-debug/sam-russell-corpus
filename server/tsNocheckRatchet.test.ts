// ============================================================
// TS-NOCHECK RATCHET
// A file that starts with `// @ts-nocheck` has type checking switched off, so an
// undefined name in it (a missing import, a variable from another component, a
// procedure that does not exist) compiles and ships, and the page crashes when a
// visitor reaches that code. The audit found about 300 such files hiding about 2,000
// type errors, 226 of them "cannot find name".
//
// This test pins the list so it can only shrink:
//   - a file NOT in ALLOWED_NOCHECK that turns type checking off fails the test;
//   - a file IN ALLOWED_NOCHECK that no longer turns it off also fails, so whoever
//     fixes a file deletes its line here in the same change.
//
// Scope: every source file under client/src, shared and server, tests excluded (the
// same folders tsconfig.json checks). A file counts when a line of its leading comment
// block carries `@ts-nocheck`, which is the only place TypeScript honours it.
//
// To fix a file: delete its `// @ts-nocheck`, run `npx tsc --noEmit`, fix every error
// properly (the missing import, or the real source the page meant, never a placeholder
// value), then delete its line below.
//
// MERGE NOTE: two sibling branches (the crash-on-load fixes, groups A and B) remove
// `// @ts-nocheck` from some of their own files. When those branches merge with this
// one, this test will name each such file as "no longer has @ts-nocheck"; delete those
// lines from ALLOWED_NOCHECK in the merge. The list must only ever get shorter.
// ============================================================
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const APP = path.resolve(__dirname, "..");
const ROOTS = ["client/src", "shared", "server"];
const SOURCE = /\.(tsx?|mts|cts|jsx?|mjs|cjs)$/;
const TEST = /\.(test|spec)\.[cm]?[jt]sx?$/;

/** Files still allowed to turn type checking off, relative to the app root. Only ever remove lines. */
export const ALLOWED_NOCHECK: readonly string[] = [
  "client/src/components/CalculationSyncBar.tsx",
  "client/src/components/ClientSelectorBar.tsx",
  "client/src/components/ConsumerOutcomeBlocks.tsx",
  "client/src/components/ErrorBoundary.tsx",
  "client/src/components/GenerateOutcomeTab.tsx",
  "client/src/components/MultiPropertyTab.tsx",
  "client/src/contexts/StrategyContext.tsx",
  "client/src/hooks/useCalculatorIntegration.ts",
  "client/src/pages/VideoViewer.tsx",
  "client/src/pages/portal/AIPolicyReviewGap.tsx",
  "client/src/pages/portal/AdminHealthDashboard.tsx",
  "client/src/pages/portal/AdvancedReporting.tsx",
  "client/src/pages/portal/AdvisorChat.tsx",
  "client/src/pages/portal/AdvisorDirectory.tsx",
  "client/src/pages/portal/AdvisorIncomeCalculator.tsx",
  "client/src/pages/portal/AdvisorTraining.tsx",
  "client/src/pages/portal/AdvisorySummary.tsx",
  "client/src/pages/portal/AffiliateLinkManager.tsx",
  "client/src/pages/portal/AgencyTutorial.tsx",
  "client/src/pages/portal/AiAssist.tsx",
  "client/src/pages/portal/AiStrategyRecommender.tsx",
  "client/src/pages/portal/AlternativeInvestmentAllocator.tsx",
  "client/src/pages/portal/AnnuityAccumulationDB.tsx",
  "client/src/pages/portal/AnnuityMemory.tsx",
  "client/src/pages/portal/AnnuityWaterfallEngine.tsx",
  "client/src/pages/portal/Arena.tsx",
  "client/src/pages/portal/AssetProtection.tsx",
  "client/src/pages/portal/AtheneGuaranteedIncome.tsx",
  "client/src/pages/portal/AthenePEPlus15.tsx",
  "client/src/pages/portal/AvatarTwins.tsx",
  "client/src/pages/portal/AxonicSP500.tsx",
  "client/src/pages/portal/BatchIllustration.tsx",
  "client/src/pages/portal/BatchSlides.tsx",
  "client/src/pages/portal/BeneficiaryOptimization.tsx",
  "client/src/pages/portal/BlackMirror.tsx",
  "client/src/pages/portal/BulkGeneration.tsx",
  "client/src/pages/portal/BusinessOwnerPlanning.tsx",
  "client/src/pages/portal/BusinessSuccession.tsx",
  "client/src/pages/portal/BuySellAgreement.tsx",
  "client/src/pages/portal/CalculatorHub.tsx",
  "client/src/pages/portal/CaptiveInsuranceModeler.tsx",
  "client/src/pages/portal/CaptiveInsurancePlanner.tsx",
  "client/src/pages/portal/CarrierComparison.tsx",
  "client/src/pages/portal/CarrierQuotes.tsx",
  "client/src/pages/portal/CarrierSettings.tsx",
  "client/src/pages/portal/CashBalancePlanCalc.tsx",
  "client/src/pages/portal/CashFlowOptimizer.tsx",
  "client/src/pages/portal/CharitableGivingDashboard.tsx",
  "client/src/pages/portal/CharitableGivingOptimizer.tsx",
  "client/src/pages/portal/CharitableLeadTrustPlanner.tsx",
  "client/src/pages/portal/ClientComparison.tsx",
  "client/src/pages/portal/ClientDetail.tsx",
  "client/src/pages/portal/ClientFiles.tsx",
  "client/src/pages/portal/ClientFinancialHealthScore.tsx",
  "client/src/pages/portal/ClientIntakeInterview.tsx",
  "client/src/pages/portal/ClientOnboardingAutomation.tsx",
  "client/src/pages/portal/ClientOnboardingWizard.tsx",
  "client/src/pages/portal/ClientPortal.tsx",
  "client/src/pages/portal/ClientPortfolioDashboard.tsx",
  "client/src/pages/portal/ClientPresentationBuilder.tsx",
  "client/src/pages/portal/ClientReportBuilder.tsx",
  "client/src/pages/portal/ClientReportGenerator.tsx",
  "client/src/pages/portal/ClientScorecard.tsx",
  "client/src/pages/portal/ClientSelfServicePortal.tsx",
  "client/src/pages/portal/ClientSnapshotMap.tsx",
  "client/src/pages/portal/ClientStoryGenerator.tsx",
  "client/src/pages/portal/Clients.tsx",
  "client/src/pages/portal/CollaborativePlanning.tsx",
  "client/src/pages/portal/CollegeAidOptimizer.tsx",
  "client/src/pages/portal/CommissionCalculator.tsx",
  "client/src/pages/portal/CommissionTracker.tsx",
  "client/src/pages/portal/ComparisonDashboard.tsx",
  "client/src/pages/portal/CompetitiveAnalysis.tsx",
  "client/src/pages/portal/ComplianceAlerts.tsx",
  "client/src/pages/portal/ComplianceAuditCenter.tsx",
  "client/src/pages/portal/ComplianceAuditTrail.tsx",
  "client/src/pages/portal/ComplianceExport.tsx",
  "client/src/pages/portal/ComplianceMonitoringDashboard.tsx",
  "client/src/pages/portal/ComplianceReportGenerator.tsx",
  "client/src/pages/portal/ComprehensiveIRCReferenceIndex.tsx",
  "client/src/pages/portal/ConcentratedStock.tsx",
  "client/src/pages/portal/CostSegregationAccelerator.tsx",
  "client/src/pages/portal/CostSegregationEngine.tsx",
  "client/src/pages/portal/CouplesMode.tsx",
  "client/src/pages/portal/CrossPurchaseAgreement.tsx",
  "client/src/pages/portal/CryptoCurrencyCorner.tsx",
  "client/src/pages/portal/CryptoTaxStrategy.tsx",
  "client/src/pages/portal/DAFStrategicPlanner.tsx",
  "client/src/pages/portal/DSTAnalyzer.tsx",
  "client/src/pages/portal/DailyBriefing.tsx",
  "client/src/pages/portal/DailyDiscovery.tsx",
  "client/src/pages/portal/Dashboard.tsx",
  "client/src/pages/portal/DebtRecyclingStrategy.tsx",
  "client/src/pages/portal/DigitalEstatePlanner.tsx",
  "client/src/pages/portal/DirectIndexingOptimizer.tsx",
  "client/src/pages/portal/DivorceFinancialPlanner.tsx",
  "client/src/pages/portal/DocumentTemplates.tsx",
  "client/src/pages/portal/DocumentVault.tsx",
  "client/src/pages/portal/DynastyTrustPlanner.tsx",
  "client/src/pages/portal/EcologicalDrivers.tsx",
  "client/src/pages/portal/Education529Planner.tsx",
  "client/src/pages/portal/EmailCampaignManager.tsx",
  "client/src/pages/portal/EmployeeRetentionStrategy.tsx",
  "client/src/pages/portal/Endgame.tsx",
  "client/src/pages/portal/EngineChainingPipeline.tsx",
  "client/src/pages/portal/EnterpriseAdmin.tsx",
  "client/src/pages/portal/EstateDocumentGenerator.tsx",
  "client/src/pages/portal/EstateFlowChart.tsx",
  "client/src/pages/portal/EstatePlanningSimulator.tsx",
  "client/src/pages/portal/EstatePlanningTimeline.tsx",
  "client/src/pages/portal/EstateTax.tsx",
  "client/src/pages/portal/Exchange1031Analyzer.tsx",
  "client/src/pages/portal/ExecutiveBonusPlan.tsx",
  "client/src/pages/portal/ExistingAnnuities.tsx",
  "client/src/pages/portal/FBARFATCACompliance.tsx",
  "client/src/pages/portal/FIACollateralStrategy.tsx",
  "client/src/pages/portal/FIATop10.tsx",
  "client/src/pages/portal/FIDOComplianceTracker.tsx",
  "client/src/pages/portal/FamilyBankStrategy.tsx",
  "client/src/pages/portal/FamilyGovernanceFramework.tsx",
  "client/src/pages/portal/FamilyLimitedPartnership.tsx",
  "client/src/pages/portal/FamilyWealthConstitution.tsx",
  "client/src/pages/portal/FeeTransparencyDashboard.tsx",
  "client/src/pages/portal/FiduciaryDutyTracker.tsx",
  "client/src/pages/portal/FinancialPlanChecklist.tsx",
  "client/src/pages/portal/FinancialVitalsScorecard.tsx",
  "client/src/pages/portal/GrantorTrustStrategy.tsx",
  "client/src/pages/portal/GrowthAnnuities.tsx",
  "client/src/pages/portal/HiddenMaterial.tsx",
  "client/src/pages/portal/HotIncome.tsx",
  "client/src/pages/portal/HouseRecyclingStrategy.tsx",
  "client/src/pages/portal/HouseholdWealth.tsx",
  "client/src/pages/portal/HubSpotSync.tsx",
  "client/src/pages/portal/IDGTModeler.tsx",
  "client/src/pages/portal/ILITAnalyzer.tsx",
  "client/src/pages/portal/ILITDeepDive.tsx",
  "client/src/pages/portal/IULHistoricalPerformance.tsx",
  "client/src/pages/portal/IULvsRoth.tsx",
  "client/src/pages/portal/IbbotsonCharts.tsx",
  "client/src/pages/portal/IncentiveTrustDesigner.tsx",
  "client/src/pages/portal/IncomeAnnuityTop10.tsx",
  "client/src/pages/portal/IncomeGapAnalyzer.tsx",
  "client/src/pages/portal/IndexBacktester.tsx",
  "client/src/pages/portal/IndexStrategyComparison.tsx",
  "client/src/pages/portal/IndividualAgentTutorial.tsx",
  "client/src/pages/portal/InfiniteScroll.tsx",
  "client/src/pages/portal/InfinityBankingConcept.tsx",
  "client/src/pages/portal/InflationAnalysis.tsx",
  "client/src/pages/portal/InnovationDashboard.tsx",
  "client/src/pages/portal/InstallmentSale.tsx",
  "client/src/pages/portal/Integrations.tsx",
  "client/src/pages/portal/InternationalTaxPlanner.tsx",
  "client/src/pages/portal/KeyPersonInsurance.tsx",
  "client/src/pages/portal/Knowledge.tsx",
  "client/src/pages/portal/LeadGenerator.tsx",
  "client/src/pages/portal/Leaderboard.tsx",
  "client/src/pages/portal/LifeSettlementAnalyzer.tsx",
  "client/src/pages/portal/LifetimeGuaranteedIncome.tsx",
  "client/src/pages/portal/LiveCoPilot.tsx",
  "client/src/pages/portal/LongTermCareHybrid.tsx",
  "client/src/pages/portal/MarketDataDashboard.tsx",
  "client/src/pages/portal/MedicaidPlanning.tsx",
  "client/src/pages/portal/MedicareIRMAA.tsx",
  "client/src/pages/portal/MeetingAgenda.tsx",
  "client/src/pages/portal/Meetings.tsx",
  "client/src/pages/portal/MorningRitual.tsx",
  "client/src/pages/portal/MortgageKiller.tsx",
  "client/src/pages/portal/MultiGenWealthTransfer.tsx",
  "client/src/pages/portal/MultiScenarioPlayZone.tsx",
  "client/src/pages/portal/MySlides.tsx",
  "client/src/pages/portal/MyWorld.tsx",
  "client/src/pages/portal/NIISurtaxOptimizer.tsx",
  "client/src/pages/portal/NUAStrategy.tsx",
  "client/src/pages/portal/NaturalLanguageQuery.tsx",
  "client/src/pages/portal/NerveCenter.tsx",
  "client/src/pages/portal/Onboarding.tsx",
  "client/src/pages/portal/OnboardingQuiz.tsx",
  "client/src/pages/portal/OnboardingWizard.tsx",
  "client/src/pages/portal/OnboardingWizardV2.tsx",
  "client/src/pages/portal/OpportunityZonePlanner.tsx",
  "client/src/pages/portal/OpportunityZoneTracker.tsx",
  "client/src/pages/portal/OrganismControlCenter.tsx",
  "client/src/pages/portal/OrganismHealthReport.tsx",
  "client/src/pages/portal/OwnerOversight.tsx",
  "client/src/pages/portal/OwnerWarRoom.tsx",
  "client/src/pages/portal/PPLIModeler.tsx",
  "client/src/pages/portal/PensionMaximizationEngine.tsx",
  "client/src/pages/portal/PetSystem.tsx",
  "client/src/pages/portal/PhilanthropyImpactDashboard.tsx",
  "client/src/pages/portal/PhysicianForum.tsx",
  "client/src/pages/portal/PhysicianMortgageAnalyzer.tsx",
  "client/src/pages/portal/Pipeline.tsx",
  "client/src/pages/portal/PolicyReview.tsx",
  "client/src/pages/portal/PolicyReviewChecklist.tsx",
  "client/src/pages/portal/PortfolioDriftMonitor.tsx",
  "client/src/pages/portal/PostMortemTaxPlanner.tsx",
  "client/src/pages/portal/PracticeValuation.tsx",
  "client/src/pages/portal/PredictiveAnalytics.tsx",
  "client/src/pages/portal/PremiumFinancing.tsx",
  "client/src/pages/portal/PresentationBuilder.tsx",
  "client/src/pages/portal/PrivateCredit.tsx",
  "client/src/pages/portal/PrivateEquitySecondaryMarket.tsx",
  "client/src/pages/portal/PrivateFoundationPlanner.tsx",
  "client/src/pages/portal/PrivatePlacement.tsx",
  "client/src/pages/portal/QPRTPlanner.tsx",
  "client/src/pages/portal/QSBSExclusionCalc.tsx",
  "client/src/pages/portal/QualifiedOpportunityFund.tsx",
  "client/src/pages/portal/QualifiedSmallBusinessStock.tsx",
  "client/src/pages/portal/QuickQuote.tsx",
  "client/src/pages/portal/RealEstateDepreciationRecapture.tsx",
  "client/src/pages/portal/RealEstateMogul.tsx",
  "client/src/pages/portal/RealEstatePortfolioManager.tsx",
  "client/src/pages/portal/RebalanceAlerts.tsx",
  "client/src/pages/portal/Recommendations.tsx",
  "client/src/pages/portal/ReferralTracker.tsx",
  "client/src/pages/portal/ReferralTracking.tsx",
  "client/src/pages/portal/RetirementAdvantage.tsx",
  "client/src/pages/portal/RetirementGuardrails.tsx",
  "client/src/pages/portal/RetirementIncomeFloorStrategy.tsx",
  "client/src/pages/portal/RetirementIncomeProjection.tsx",
  "client/src/pages/portal/RetirementReadinessScore.tsx",
  "client/src/pages/portal/RetirementSpendingGuardrails.tsx",
  "client/src/pages/portal/RevenueGuarantee.tsx",
  "client/src/pages/portal/ReverseHeloc.tsx",
  "client/src/pages/portal/RewardsVault.tsx",
  "client/src/pages/portal/RiskToleranceProfiler.tsx",
  "client/src/pages/portal/RiskToleranceScoring.tsx",
  "client/src/pages/portal/RothConversionSTR.tsx",
  "client/src/pages/portal/RussellNumber.tsx",
  "client/src/pages/portal/RussellWrapped.tsx",
  "client/src/pages/portal/SLATDeepDive.tsx",
  "client/src/pages/portal/SLATPlanner.tsx",
  "client/src/pages/portal/SalesStoryBuilder.tsx",
  "client/src/pages/portal/SavedScenariosHub.tsx",
  "client/src/pages/portal/Section1031AdvancedExchange.tsx",
  "client/src/pages/portal/SeminarGenerator.tsx",
  "client/src/pages/portal/SlackIntegration.tsx",
  "client/src/pages/portal/SmartRebalancingAlerts.tsx",
  "client/src/pages/portal/SocialNarcotic.tsx",
  "client/src/pages/portal/SocialSecurityOptimizer.tsx",
  "client/src/pages/portal/SpecialNeedsPlanner.tsx",
  "client/src/pages/portal/StaleDigest.tsx",
  "client/src/pages/portal/StrategyCompare.tsx",
  "client/src/pages/portal/StrategyLab.tsx",
  "client/src/pages/portal/StructuredNoteAnalyzer.tsx",
  "client/src/pages/portal/StructuredSettlementPlanner.tsx",
  "client/src/pages/portal/SuccessionPlanningHub.tsx",
  "client/src/pages/portal/SuccessionPlanningWizard.tsx",
  "client/src/pages/portal/SupervisorMonitoringAgreement.tsx",
  "client/src/pages/portal/SyndicationDealAnalyzer.tsx",
  "client/src/pages/portal/TaxAdvantagedGrowth.tsx",
  "client/src/pages/portal/TaxAlphaScorecard.tsx",
  "client/src/pages/portal/TaxBracketVisualizer.tsx",
  "client/src/pages/portal/TaxLossHarvestingScanner.tsx",
  "client/src/pages/portal/TaxOpportunityDetector.tsx",
  "client/src/pages/portal/TaxReturnUpload.tsx",
  "client/src/pages/portal/TaxStrategyOptimizer.tsx",
  "client/src/pages/portal/TaxWaterfall.tsx",
  "client/src/pages/portal/TaxableAccountOptimizer.tsx",
  "client/src/pages/portal/Team.tsx",
  "client/src/pages/portal/TeamManagement.tsx",
  "client/src/pages/portal/TheArrival.tsx",
  "client/src/pages/portal/TheBrotherhood.tsx",
  "client/src/pages/portal/TheField.tsx",
  "client/src/pages/portal/TheLegacy.tsx",
  "client/src/pages/portal/TheMap.tsx",
  "client/src/pages/portal/TheMirror.tsx",
  "client/src/pages/portal/TheStrategyTable.tsx",
  "client/src/pages/portal/TimeLapse.tsx",
  "client/src/pages/portal/TimeMachine.tsx",
  "client/src/pages/portal/TimeMachineAG49.tsx",
  "client/src/pages/portal/ToiletDashboard.tsx",
  "client/src/pages/portal/TrustComparisonMatrix.tsx",
  "client/src/pages/portal/UsageAnalyticsDashboard.tsx",
  "client/src/pages/portal/VideoProposalGenerator.tsx",
  "client/src/pages/portal/VoicePlanBuilder.tsx",
  "client/src/pages/portal/WarRoom.tsx",
  "client/src/pages/portal/WarStoryGenerator.tsx",
  "client/src/pages/portal/WealthDashboardSummary.tsx",
  "client/src/pages/portal/WealthErosionTracker.tsx",
  "client/src/pages/portal/WealthTransferScorecard.tsx",
  "client/src/pages/portal/Webhooks.tsx",
  "client/src/pages/portal/WillWriter.tsx",
  "client/src/pages/portal/WithdrawalSequencing.tsx",
  "client/src/pages/portal/WorkflowAutomations.tsx",
  "client/src/pages/portal/WorkspaceBranding.tsx",
];

function sourceFiles(rel: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(path.join(APP, rel))) {
    if (name === "node_modules") continue;
    const childRel = `${rel}/${name}`;
    if (statSync(path.join(APP, childRel)).isDirectory()) out.push(...sourceFiles(childRel));
    else if (SOURCE.test(name) && !TEST.test(name)) out.push(childRel);
  }
  return out;
}

/** True when the file's leading comment block carries @ts-nocheck (TypeScript ignores it anywhere else). */
export function hasTsNocheck(source: string): boolean {
  let inBlock = false;
  for (const raw of source.replace(/^\uFEFF/, "").split("\n")) {
    const line = raw.trim();
    if (inBlock) {
      if (line.includes("@ts-nocheck")) return true;
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line === "") continue;
    if (line.startsWith("//")) {
      if (/^\/\/\s*@ts-nocheck\b/.test(line)) return true;
      continue;
    }
    if (line.startsWith("/*")) {
      if (line.includes("@ts-nocheck")) return true;
      inBlock = !line.includes("*/");
      continue;
    }
    return false;
  }
  return false;
}

const nocheckNow = ROOTS.flatMap(sourceFiles)
  .filter((rel) => hasTsNocheck(readFileSync(path.join(APP, rel), "utf8")))
  .sort();

describe("@ts-nocheck ratchet", () => {
  it("detects the directive only in the leading comment block", () => {
    expect(hasTsNocheck("// @ts-nocheck\nexport const a = 1;\n")).toBe(true);
    expect(hasTsNocheck("\n\n// @ts-nocheck\nexport const a = 1;\n")).toBe(true);
    expect(hasTsNocheck("/**\n * header\n */\n// @ts-nocheck\nconst a = 1;\n")).toBe(true);
    expect(hasTsNocheck("/* @ts-nocheck */\nconst a = 1;\n")).toBe(true);
    expect(hasTsNocheck("import x from 'y';\n// @ts-nocheck\n")).toBe(false);
    expect(hasTsNocheck("// explains why @ts-nocheck is banned\nconst a = 1;\n")).toBe(false);
  });

  it("the allow-list is sorted and has no duplicates", () => {
    expect([...ALLOWED_NOCHECK].sort()).toEqual([...ALLOWED_NOCHECK]);
    expect(new Set(ALLOWED_NOCHECK).size).toBe(ALLOWED_NOCHECK.length);
  });

  it("no file outside the allow-list turns type checking off", () => {
    const allowed = new Set(ALLOWED_NOCHECK);
    const added = nocheckNow.filter((rel) => !allowed.has(rel));
    expect(
      added,
      "These files start with // @ts-nocheck but are not on the allow-list. Remove the directive and fix the type errors instead.",
    ).toEqual([]);
  });

  it("every allow-listed file still has @ts-nocheck (the list shrinks when a file is fixed)", () => {
    const now = new Set(nocheckNow);
    const fixed = ALLOWED_NOCHECK.filter((rel) => !now.has(rel));
    expect(
      fixed,
      "These files no longer turn type checking off (or no longer exist). Delete their lines from ALLOWED_NOCHECK.",
    ).toEqual([]);
  });
});
