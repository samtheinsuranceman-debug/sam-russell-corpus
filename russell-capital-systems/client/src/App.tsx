import { AnalyticsLoader } from "@/components/AnalyticsLoader";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { SeoSync } from "@/hooks/useSeo";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
const NotFound = lazy(() => import("@/pages/NotFound"));
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { EntrainmentProvider } from "./contexts/EntrainmentEngine";
import ComplianceGate from "./components/ComplianceGate";
import ManagedAuthGuard from "./components/ManagedAuthGuard";
import { SkipToContent, FocusRingStyles } from "@/components/AccessibilityHelpers";
import TrialTimer from "./components/TrialTimer";
import { GlobalHooks } from "./components/GlobalHooks";
import { OnboardingTour } from "./components/OnboardingTour";
import { AchievementUnlockOverlay } from "./components/AchievementUnlockOverlay";
import { PetEvolutionOverlay } from "./components/PetEvolutionOverlay";
import VoiceAdvisor from "./components/VoiceAdvisor";

// Public pages — lazy-loaded to reduce initial bundle
const Landing = lazy(() => import("./pages/Landing"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Legal").then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/Legal").then(m => ({ default: m.Terms })));
const Support = lazy(() => import("./pages/Legal").then(m => ({ default: m.Support })));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/ManagedAuthLegacy"));
const ForgotPassword = lazy(() => import("./pages/ManagedAuthLegacy"));
const ResetPassword = lazy(() => import("./pages/ManagedAuthLegacy"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const TrialLogin = lazy(() => import("./pages/ManagedAuthLegacy"));
const AdministratorPortal = lazy(() => import("./pages/AdministratorPortal"));
const ExecutiveEntrance = lazy(() => import("./pages/ExecutiveEntrance"));
const ClientPortalView = lazy(() => import("./pages/ClientPortalView"));
const UltraCalculatorPage = lazy(() => import("./pages/UltraCalculatorPage"));
const FactFinderPage = lazy(() => import("./pages/FactFinderPage"));
const MassiveCalculatorsPage = lazy(() => import("./pages/MassiveCalculatorsPage"));
const SharedProjection = lazy(() => import("./pages/SharedProjection"));
const SharedSlidesViewer = lazy(() => import("./pages/SharedSlidesViewer"));

// Portal pages — lazy-loaded for fast initial page load
const Onboarding = lazy(() => import("./pages/portal/Onboarding"));
const Dashboard = lazy(() => import("./pages/portal/Dashboard"));
const Clients = lazy(() => import("./pages/portal/Clients"));
const LeadInbox = lazy(() => import("./pages/portal/LeadInbox"));
const ClientDetail = lazy(() => import("./pages/portal/ClientDetail"));
const Pipeline = lazy(() => import("./pages/portal/Pipeline"));
const StrategyLab = lazy(() => import("./pages/portal/StrategyLab"));
const AiAssist = lazy(() => import("./pages/portal/AiAssist"));
const Team = lazy(() => import("./pages/portal/Team"));
const Billing = lazy(() => import("./pages/portal/Billing"));
const Knowledge = lazy(() => import("./pages/portal/Knowledge"));
const Leaderboard = lazy(() => import("./pages/portal/Leaderboard"));
const EnterpriseAdmin = lazy(() => import("./pages/portal/EnterpriseAdmin"));
const ScenarioAdjustments = lazy(() => import("./pages/portal/ScenarioAdjustments"));
const AdvisorChat = lazy(() => import("./pages/portal/AdvisorChat"));
const StaleDigest = lazy(() => import("./pages/portal/StaleDigest"));
const Webhooks = lazy(() => import("./pages/portal/Webhooks"));
const SlackIntegration = lazy(() => import("./pages/portal/SlackIntegration"));
const ComplianceExport = lazy(() => import("./pages/portal/ComplianceExport"));
const RebalanceAlerts = lazy(() => import("./pages/portal/RebalanceAlerts"));
const WorkspaceBranding = lazy(() => import("./pages/portal/WorkspaceBranding"));
const Meetings = lazy(() => import("./pages/portal/Meetings"));
const ComplianceAlerts = lazy(() => import("./pages/portal/ComplianceAlerts"));
const HubSpotSync = lazy(() => import("./pages/portal/HubSpotSync"));
const Integrations = lazy(() => import("./pages/portal/Integrations"));
const RothConversionSTR = lazy(() => import("./pages/portal/RothConversionSTR"));
const OnboardingWizard = lazy(() => import("./pages/portal/OnboardingWizard"));
const StrategyCompare = lazy(() => import("./pages/portal/StrategyCompare"));
const CarrierSettings = lazy(() => import("./pages/portal/CarrierSettings"));
const BulkGeneration = lazy(() => import("./pages/portal/BulkGeneration"));
const CarrierQuotes = lazy(() => import("./pages/portal/CarrierQuotes"));
const IndexBacktester = lazy(() => import("./pages/portal/IndexBacktester"));
const TimeMachineAG49 = lazy(() => import("./pages/portal/TimeMachineAG49"));
const TimeMachineMethod = lazy(() => import("./pages/portal/TimeMachineMethod"));
const TimeMachineCalculator = lazy(() => import("./pages/portal/TimeMachineCalculator"));
const IllustrationCompare = lazy(() => import("./pages/portal/IllustrationCompare"));
const PremiumFinancing = lazy(() => import("./pages/portal/PremiumFinancing"));
const PolicyLoans = lazy(() => import("./pages/portal/PolicyLoans"));
const CarrierRatings = lazy(() => import("./pages/portal/CarrierRatings"));
const TaxWaterfall = lazy(() => import("./pages/portal/TaxWaterfall"));
const EstateTax = lazy(() => import("./pages/portal/EstateTax"));
const IncomeTimeline = lazy(() => import("./pages/portal/IncomeTimeline"));
const IULvsRoth = lazy(() => import("./pages/portal/IULvsRoth"));
const CompetitiveAnalysis = lazy(() => import("./pages/portal/CompetitiveAnalysis"));
const QuickQuote = lazy(() => import("./pages/portal/QuickQuote"));
const BatchIllustration = lazy(() => import("./pages/portal/BatchIllustration"));
const MeetingAgenda = lazy(() => import("./pages/portal/MeetingAgenda"));
const OnboardingWizardV2 = lazy(() => import("./pages/portal/OnboardingWizardV2"));
const InflationAnalysis = lazy(() => import("./pages/portal/InflationAnalysis"));
const ClientScorecard = lazy(() => import("./pages/portal/ClientScorecard"));
const DocumentVault = lazy(() => import("./pages/portal/DocumentVault"));
const AuditTimeline = lazy(() => import("./pages/portal/AuditTimeline"));
const ReferralTracker = lazy(() => import("./pages/portal/ReferralTracker"));
const PolicyReview = lazy(() => import("./pages/portal/PolicyReview"));
const AdvancedReporting = lazy(() => import("./pages/portal/AdvancedReporting"));
const MortgageKiller = lazy(() => import("./pages/portal/MortgageKiller"));
const EcologicalDrivers = lazy(() => import("./pages/portal/EcologicalDrivers"));
const ClientComparison = lazy(() => import("./pages/portal/ClientComparison"));
const WebsiteUsage = lazy(() => import("./pages/portal/WebsiteUsage"));
const HouseholdWealth = lazy(() => import("./pages/portal/HouseholdWealth"));
const CryptoCurrencyCorner = lazy(() => import("./pages/portal/CryptoCurrencyCorner"));
const LifetimeGuaranteedIncome = lazy(() => import("./pages/portal/LifetimeGuaranteedIncome"));
const ExistingAnnuities = lazy(() => import("./pages/portal/ExistingAnnuities"));
const GrowthAnnuities = lazy(() => import("./pages/portal/GrowthAnnuities"));
const MYGAFixedRate = lazy(() => import("./pages/portal/MYGAFixedRate"));
const AxonicSP500 = lazy(() => import("./pages/portal/AxonicSP500"));
const AthenePEPlus15 = lazy(() => import("./pages/portal/AthenePEPlus15"));
const AtheneGuaranteedIncome = lazy(() => import("./pages/portal/AtheneGuaranteedIncome"));
const AdvisorIncomeCalculator = lazy(() => import("./pages/portal/AdvisorIncomeCalculator"));
const ClientOnboardingWizard = lazy(() => import("./pages/portal/ClientOnboardingWizard"));
const SavedScenariosHub = lazy(() => import("./pages/portal/SavedScenariosHub"));
const AiStrategyRecommender = lazy(() => import("./pages/portal/AiStrategyRecommender"));
const EmailCampaignManager = lazy(() => import("./pages/portal/EmailCampaignManager"));
const ComplianceAuditCenter = lazy(() => import("./pages/portal/ComplianceAuditCenter"));
const LegalPaymentFolder = lazy(() => import("./pages/portal/LegalPaymentFolder"));
const EducationHub = lazy(() => import("./pages/portal/EducationHub"));
const AffiliateLinkManager = lazy(() => import("./pages/portal/AffiliateLinkManager"));
const HiddenMaterial = lazy(() => import("./pages/portal/HiddenMaterial"));
const IULHistoricalPerformance = lazy(() => import("./pages/portal/IULHistoricalPerformance"));
const IndexStrategyComparison = lazy(() => import("./pages/portal/IndexStrategyComparison"));
const RetirementIncomeProjection = lazy(() => import("./pages/portal/RetirementIncomeProjection"));
const TaxAdvantagedGrowth = lazy(() => import("./pages/portal/TaxAdvantagedGrowth"));
const SocialSecurityOptimizer = lazy(() => import("./pages/portal/SocialSecurityOptimizer"));
const IncomeAnnuityTop10 = lazy(() => import("./pages/portal/IncomeAnnuityTop10"));
const HotIncome = lazy(() => import("./pages/portal/HotIncome"));
const Recommendations = lazy(() => import("./pages/portal/Recommendations"));
const ClientFiles = lazy(() => import("./pages/portal/ClientFiles"));
const RealEstateMogul = lazy(() => import("./pages/portal/RealEstateMogul"));
const FIATop10 = lazy(() => import("./pages/portal/FIATop10"));
const TaxReturnUpload = lazy(() => import("./pages/portal/TaxReturnUpload"));
const AnnuityMemory = lazy(() => import("./pages/portal/AnnuityMemory"));
const AnnuityAccumulationDB = lazy(() => import("./pages/portal/AnnuityAccumulationDB"));
const HouseRecyclingStrategy = lazy(() => import("./pages/portal/HouseRecyclingStrategy"));
const SalesStoryBuilder = lazy(() => import("./pages/portal/SalesStoryBuilder"));
const EstateFlowChart = lazy(() => import("./pages/portal/EstateFlowChart"));
const GoalsBasedPlanning = lazy(() => import("./pages/portal/GoalsBasedPlanning"));
const RiskToleranceScoring = lazy(() => import("./pages/portal/RiskToleranceScoring"));
const MultiScenarioPlayZone = lazy(() => import("./pages/portal/MultiScenarioPlayZone"));
const WithdrawalSequencing = lazy(() => import("./pages/portal/WithdrawalSequencing"));
const BusinessOwnerPlanning = lazy(() => import("./pages/portal/BusinessOwnerPlanning"));
const SeminarGenerator = lazy(() => import("./pages/portal/SeminarGenerator"));
const ComplianceReportGenerator = lazy(() => import("./pages/portal/ComplianceReportGenerator"));
const AdvisorTraining = lazy(() => import("./pages/portal/AdvisorTraining"));
const AgencyTutorial = lazy(() => import("./pages/portal/AgencyTutorial"));
const IndividualAgentTutorial = lazy(() => import("./pages/portal/IndividualAgentTutorial"));
const SupervisorMonitoringAgreement = lazy(() => import("./pages/portal/SupervisorMonitoringAgreement"));
const TeamManagement = lazy(() => import("./pages/portal/TeamManagement"));
const OwnerOversight = lazy(() => import("./pages/portal/OwnerOversight"));
const PredictiveAnalytics = lazy(() => import("./pages/portal/PredictiveAnalytics"));
const CollaborativePlanning = lazy(() => import("./pages/portal/CollaborativePlanning"));
const MarketDataDashboard = lazy(() => import("./pages/portal/MarketDataDashboard"));
const AIMeetingNotes = lazy(() => import("./pages/portal/AIMeetingNotes"));
const ClientPortal = lazy(() => import("./pages/portal/ClientPortal"));
const DocumentTemplates = lazy(() => import("./pages/portal/DocumentTemplates"));
const CommissionCalculator = lazy(() => import("./pages/portal/CommissionCalculator"));
const CarrierComparison = lazy(() => import("./pages/portal/CarrierComparison"));
const ReferralTracking = lazy(() => import("./pages/portal/ReferralTracking"));
const TaxBracketVisualizer = lazy(() => import("./pages/portal/TaxBracketVisualizer"));
const PolicyReviewChecklist = lazy(() => import("./pages/portal/PolicyReviewChecklist"));
const IncomeGapAnalyzer = lazy(() => import("./pages/portal/IncomeGapAnalyzer"));
const MedicareIRMAA = lazy(() => import("./pages/portal/MedicareIRMAA"));
const IbbotsonCharts = lazy(() => import("./pages/portal/IbbotsonCharts"));
const VoicePlanBuilder = lazy(() => import("./pages/portal/VoicePlanBuilder"));
const ClientSnapshotMap = lazy(() => import("./pages/portal/ClientSnapshotMap"));
const TaxOpportunityDetector = lazy(() => import("./pages/portal/TaxOpportunityDetector"));
const WorkflowAutomations = lazy(() => import("./pages/portal/WorkflowAutomations"));
const ScenarioSideBySide = lazy(() => import("./pages/portal/ScenarioSideBySide"));
const ClientHealthDashboard = lazy(() => import("./pages/portal/ClientHealthDashboard"));
const ClientIntakeInterview = lazy(() => import("./pages/portal/ClientIntakeInterview"));
const PortfolioDriftMonitor = lazy(() => import("./pages/portal/PortfolioDriftMonitor"));
const NaturalLanguageQuery = lazy(() => import("./pages/portal/NaturalLanguageQuery"));
const ClientEngagementScore = lazy(() => import("./pages/portal/ClientEngagementScore"));
const PresentationBuilder = lazy(() => import("./pages/portal/PresentationBuilder"));
const ComplianceAuditTrail = lazy(() => import("./pages/portal/ComplianceAuditTrail"));
const LeadGenerator = lazy(() => import("./pages/portal/LeadGenerator"));
const FinancialVitalsScorecard = lazy(() => import("./pages/portal/FinancialVitalsScorecard"));
const EstateDocumentGenerator = lazy(() => import("./pages/portal/EstateDocumentGenerator"));
const RetirementGuardrails = lazy(() => import("./pages/portal/RetirementGuardrails"));
const ClientSelfServicePortal = lazy(() => import("./pages/portal/ClientSelfServicePortal"));
const TaxLossHarvestingScanner = lazy(() => import("./pages/portal/TaxLossHarvestingScanner"));
const BeneficiaryOptimization = lazy(() => import("./pages/portal/BeneficiaryOptimization"));
const FeeTransparencyDashboard = lazy(() => import("./pages/portal/FeeTransparencyDashboard"));
const SuccessionPlanningWizard = lazy(() => import("./pages/portal/SuccessionPlanningWizard"));
const AIPolicyReviewGap = lazy(() => import("./pages/portal/AIPolicyReviewGap"));
const SmartRebalancingAlerts = lazy(() => import("./pages/portal/SmartRebalancingAlerts"));
const ComplianceMonitoringDashboard = lazy(() => import("./pages/portal/ComplianceMonitoringDashboard"));
const MultiGenWealthTransfer = lazy(() => import("./pages/portal/MultiGenWealthTransfer"));
const CharitableGivingOptimizer = lazy(() => import("./pages/portal/CharitableGivingOptimizer"));
const MarketScenarioStressTest = lazy(() => import("./pages/portal/MarketScenarioStressTest"));
const ClientOnboardingAutomation = lazy(() => import("./pages/portal/ClientOnboardingAutomation"));
const CommissionTracker = lazy(() => import("./pages/portal/CommissionTracker"));
const ReverseHeloc = lazy(() => import("./pages/portal/ReverseHeloc"));
const AdvisorySummary = lazy(() => import("./pages/portal/AdvisorySummary"));
const AdvisorDirectory = lazy(() => import("./pages/portal/AdvisorDirectory"));
const AISlideGenerator = lazy(() => import("./pages/portal/AISlideGenerator"));
const MySlides = lazy(() => import("./pages/portal/MySlides"));
const OwnerWarRoom = lazy(() => import("./pages/portal/OwnerWarRoom"));
const BatchSlides = lazy(() => import("./pages/portal/BatchSlides"));

// ── The Experience ──────────────────────────────────────────────
const NerveCenter = lazy(() => import("./pages/portal/NerveCenter"));
const Arena = lazy(() => import("./pages/portal/Arena"));
const MyWorld = lazy(() => import("./pages/portal/MyWorld"));
const WarRoom = lazy(() => import("./pages/portal/WarRoom"));
const RewardsVault = lazy(() => import("./pages/portal/RewardsVault"));
const BlackMirror = lazy(() => import("./pages/portal/BlackMirror"));
const SocialNarcotic = lazy(() => import("./pages/portal/SocialNarcotic"));
const Endgame = lazy(() => import("./pages/portal/Endgame"));
const WillWriter = lazy(() => import("./pages/portal/WillWriter"));
const AvatarTwins = lazy(() => import("./pages/portal/AvatarTwins"));
const CouplesMode = lazy(() => import("./pages/portal/CouplesMode"));
const RussellNumber = lazy(() => import("./pages/portal/RussellNumber"));
const DailyDiscovery = lazy(() => import("./pages/portal/DailyDiscovery"));
const RussellWrapped = lazy(() => import("./pages/portal/RussellWrapped"));
const ClientStoryGenerator = lazy(() => import("./pages/portal/ClientStoryGenerator"));
const TimeMachine = lazy(() => import("./pages/portal/TimeMachine"));
const LiveCoPilot = lazy(() => import("./pages/portal/LiveCoPilot"));
const TimeLapse = lazy(() => import("./pages/portal/TimeLapse"));
const InfiniteScroll = lazy(() => import("./pages/portal/InfiniteScroll"));
const MorningRitual = lazy(() => import("./pages/portal/MorningRitual"));
const PetSystem = lazy(() => import("./pages/portal/PetSystem"));
const WarStoryGenerator = lazy(() => import("./pages/portal/WarStoryGenerator"));
const RevenueGuarantee = lazy(() => import("./pages/portal/RevenueGuarantee"));
const ToiletDashboard = lazy(() => import("./pages/portal/ToiletDashboard"));
const DailyBriefing = lazy(() => import("./pages/portal/DailyBriefing"));
const ComparisonDashboard = lazy(() => import("./pages/portal/ComparisonDashboard"));
const VideoProposalGenerator = lazy(() => import("./pages/portal/VideoProposalGenerator"));
const VideoViewer = lazy(() => import("./pages/VideoViewer"));

// ── Tax-Free Wealth Combos ────────────────────────────────────
const TaxFreeWealthCombos = lazy(() => import("./pages/portal/TaxFreeWealthCombos"));
const ComboDetail = lazy(() => import("./pages/portal/ComboDetail"));
const SecretSecrets = lazy(() => import("./pages/portal/SecretSecrets"));
const SecretDetail = lazy(() => import("./pages/portal/SecretDetail"));
const StrategyCompareTool = lazy(() => import("./pages/portal/StrategyCompareTool"));
const ClientIntakeRecommender = lazy(() => import("./pages/portal/ClientIntakeRecommender"));
const DivorceCalculator = lazy(() => import("./pages/portal/DivorceCalculator"));
const TrustsPage = lazy(() => import("./pages/portal/TrustsPage"));
const MortgageKillerV3 = lazy(() => import("./pages/portal/MortgageKillerV3"));
const STRStrategy = lazy(() => import("./pages/portal/STRStrategy"));
const ClientPortfolioDashboard = lazy(() => import("./pages/portal/ClientPortfolioDashboard"));
const PhysiciansEdge = lazy(() => import("./pages/portal/PhysiciansEdge"));
const VideoLibrary = lazy(() => import("./pages/portal/VideoLibrary"));
const PatentShowcase = lazy(() => import("./pages/portal/PatentShowcase"));

// ── Client Journey — verified Grok addition ─────────────────────
const TheArrival = lazy(() => import("./pages/portal/TheArrival"));
const TheMirror = lazy(() => import("./pages/portal/TheMirror"));
const TheStrategyTable = lazy(() => import("./pages/portal/TheStrategyTable"));
const TheField = lazy(() => import("./pages/portal/TheField"));
const TheMap = lazy(() => import("./pages/portal/TheMap"));
const TheLegacy = lazy(() => import("./pages/portal/TheLegacy"));
const WealthGenomePage = lazy(() => import("./pages/WealthGenomePage"));
const FinancialAssessment = lazy(() => import("./pages/portal/FinancialAssessment"));
const AIFinancialAdvisor = lazy(() => import("./pages/portal/AIFinancialAdvisor"));
const MyJourney = lazy(() => import("./pages/portal/MyJourney"));
const PlanLedger = lazy(() => import("./pages/portal/PlanLedger"));
const Connections = lazy(() => import("./pages/portal/Connections"));
const Controls = lazy(() => import("./pages/portal/Controls"));
const Erosion = lazy(() => import("./pages/portal/Erosion"));
const Forgiveness = lazy(() => import("./pages/portal/Forgiveness"));
const TaxSchedule = lazy(() => import("./pages/portal/TaxSchedule"));
const Sphere = lazy(() => import("./pages/portal/Sphere"));
const TheBrotherhood = lazy(() => import("./pages/portal/TheBrotherhood"));
const SecondaryInformation = lazy(() => import("./pages/portal/SecondaryInformation"));
const PlanningCases = lazy(() => import("./pages/portal/PlanningCases"));
const SystemHealth = lazy(() => import("./pages/portal/SystemHealth"));
const SiteHealth = lazy(() => import("./pages/portal/SiteHealth"));

/**
 * Sleek loading spinner shown while lazy-loaded pages are being fetched.
 * Keeps the UI feeling responsive during route transitions.
 */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Managed OAuth authorization plus the compliance acknowledgement.
 */
function gated(Component: React.ComponentType<any>, returnPath: string) {
  return function GatedRoute(props: any) {
    return (
      <ManagedAuthGuard returnPath={returnPath}>
        <ComplianceGate returnTo={returnPath}>
          <Component {...props} />
        </ComplianceGate>
      </ManagedAuthGuard>
    );
  };
}

function Router() {
  const [location] = useLocation();
  const fallbackRoute = location.startsWith("/portal") ? "/portal/dashboard" : "/";
  return (
    <ErrorBoundary key={location} fallbackRoute={fallbackRoute}>
    <Suspense fallback={<PageLoader />}>
    <Switch>
      {/* Public routes — NO compliance gate */}
      <Route path="/" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/support" component={Support} />
      <Route path="/invite" component={AcceptInvite} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/trial" component={TrialLogin} />
      <Route path="/administrator" component={AdministratorPortal} />
      <Route path="/executive" component={ExecutiveEntrance} />

      {/* Ultra Calculator suite — public: the one-machine mega calculator,
          the discovery fact finder, and the full calculator catalog */}
      <Route path="/ultra-calculator" component={UltraCalculatorPage} />
      <Route path="/fact-finder" component={FactFinderPage} />
      <Route path="/calculators" component={MassiveCalculatorsPage} />

      {/* Onboarding — accessible without auth or compliance */}
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/portal/onboarding" component={gated(Onboarding, "/portal/onboarding")} />
      <Route path="/portal/welcome" component={gated(OnboardingWizard, "/portal/welcome")} />

      {/* Portal routes — ALL gated with compliance disclaimer */}
      <Route path="/portal" component={gated(InfiniteScroll, "/portal")} />
      <Route path="/portal/dashboard" component={gated(Dashboard, "/portal/dashboard")} />
      <Route path="/portal/advisory-summary" component={gated(AdvisorySummary, "/portal/advisory-summary")} />
      <Route path="/portal/advisor-directory" component={gated(AdvisorDirectory, "/portal/advisor-directory")} />
      <Route path="/portal/clients" component={gated(Clients, "/portal/clients")} />
      <Route path="/portal/leads" component={gated(LeadInbox, "/portal/leads")} />
      <Route path="/portal/clients/:id" component={gated(ClientDetail, "/portal/clients")} />
      <Route path="/portal/pipeline" component={gated(Pipeline, "/portal/pipeline")} />
      <Route path="/portal/strategy" component={gated(StrategyLab, "/portal/strategy")} />

      {/* AI Assist */}
      <Route path="/portal/ai" component={gated(AiAssist, "/portal/ai")} />
      <Route path="/portal/ai-assist" component={gated(AiAssist, "/portal/ai-assist")} />

      <Route path="/portal/team" component={gated(Team, "/portal/team")} />
      <Route path="/portal/billing" component={gated(Billing, "/portal/billing")} />
      <Route path="/portal/knowledge" component={gated(Knowledge, "/portal/knowledge")} />
      <Route path="/portal/leaderboard" component={gated(Leaderboard, "/portal/leaderboard")} />
      <Route path="/portal/scenarios" component={gated(ScenarioAdjustments, "/portal/scenarios")} />
      <Route path="/portal/advisor-chat" component={gated(AdvisorChat, "/portal/advisor-chat")} />
      <Route path="/portal/stale-digest" component={gated(StaleDigest, "/portal/stale-digest")} />
      <Route path="/portal/webhooks" component={gated(Webhooks, "/portal/webhooks")} />
      <Route path="/portal/slack" component={gated(SlackIntegration, "/portal/slack")} />
      <Route path="/portal/compliance" component={gated(ComplianceExport, "/portal/compliance")} />
      <Route path="/portal/legal-payment-folder" component={gated(LegalPaymentFolder, "/portal/legal-payment-folder")} />
      <Route path="/portal/rebalance" component={gated(RebalanceAlerts, "/portal/rebalance")} />
      <Route path="/portal/branding" component={gated(WorkspaceBranding, "/portal/branding")} />
      <Route path="/portal/meetings" component={gated(Meetings, "/portal/meetings")} />
      <Route path="/portal/compliance-alerts" component={gated(ComplianceAlerts, "/portal/compliance-alerts")} />
      <Route path="/portal/hubspot" component={gated(HubSpotSync, "/portal/hubspot")} />
      <Route path="/portal/integrations" component={gated(Integrations, "/portal/integrations")} />
      <Route path="/portal/roth-conversion" component={gated(RothConversionSTR, "/portal/roth-conversion")} />
      <Route path="/portal/strategy-compare" component={gated(StrategyCompareTool, "/portal/strategy-compare")} />
      <Route path="/portal/carrier-settings" component={gated(CarrierSettings, "/portal/carrier-settings")} />
      <Route path="/portal/bulk-generation" component={gated(BulkGeneration, "/portal/bulk-generation")} />
      <Route path="/portal/quotes" component={gated(CarrierQuotes, "/portal/quotes")} />
      <Route path="/portal/index-backtester" component={gated(IndexBacktester, "/portal/index-backtester")} />
      <Route path="/portal/ibbotson-charts" component={gated(IbbotsonCharts, "/portal/ibbotson-charts")} />
      <Route path="/portal/time-machine-ag49" component={gated(TimeMachineAG49, "/portal/time-machine-ag49")} />
      <Route path="/portal/time-machine-method" component={gated(TimeMachineMethod, "/portal/time-machine-method")} />
      <Route path="/portal/time-machine-calculator" component={gated(TimeMachineCalculator, "/portal/time-machine-calculator")} />
      <Route path="/portal/illustration-compare" component={gated(IllustrationCompare, "/portal/illustration-compare")} />
      <Route path="/portal/premium-financing" component={gated(PremiumFinancing, "/portal/premium-financing")} />
      <Route path="/portal/policy-loans" component={gated(PolicyLoans, "/portal/policy-loans")} />
      <Route path="/portal/carrier-ratings" component={gated(CarrierRatings, "/portal/carrier-ratings")} />
      <Route path="/portal/tax-waterfall" component={gated(TaxWaterfall, "/portal/tax-waterfall")} />
      <Route path="/portal/estate-tax" component={gated(EstateTax, "/portal/estate-tax")} />
      <Route path="/portal/income-timeline" component={gated(IncomeTimeline, "/portal/income-timeline")} />
      <Route path="/portal/iul-vs-roth" component={gated(IULvsRoth, "/portal/iul-vs-roth")} />
      <Route path="/portal/competitive" component={gated(CompetitiveAnalysis, "/portal/competitive")} />
      <Route path="/portal/quick-quote" component={gated(QuickQuote, "/portal/quick-quote")} />
      <Route path="/portal/batch-illustration" component={gated(BatchIllustration, "/portal/batch-illustration")} />
      <Route path="/portal/meeting-agenda" component={gated(MeetingAgenda, "/portal/meeting-agenda")} />
      <Route path="/portal/onboarding-v2" component={gated(OnboardingWizardV2, "/portal/onboarding-v2")} />
      <Route path="/portal/inflation" component={gated(InflationAnalysis, "/portal/inflation")} />
      <Route path="/portal/client-scorecard" component={gated(ClientScorecard, "/portal/client-scorecard")} />
      <Route path="/portal/document-vault" component={gated(DocumentVault, "/portal/document-vault")} />
      <Route path="/portal/audit-timeline" component={gated(AuditTimeline, "/portal/audit-timeline")} />
      <Route path="/portal/referral-tracker" component={gated(ReferralTracker, "/portal/referral-tracker")} />
      <Route path="/portal/policy-review" component={gated(PolicyReview, "/portal/policy-review")} />
      <Route path="/portal/advanced-reporting" component={gated(AdvancedReporting, "/portal/advanced-reporting")} />
      <Route path="/portal/mortgage-killer" component={gated(MortgageKiller, "/portal/mortgage-killer")} />
      <Route path="/portal/reverse-heloc" component={gated(ReverseHeloc, "/portal/reverse-heloc")} />
      <Route path="/portal/ecological-drivers" component={gated(EcologicalDrivers, "/portal/ecological-drivers")} />
      <Route path="/portal/client-comparison" component={gated(ClientComparison, "/portal/client-comparison")} />
      <Route path="/portal/website-usage" component={gated(WebsiteUsage, "/portal/website-usage")} />
      <Route path="/portal/household-wealth" component={gated(HouseholdWealth, "/portal/household-wealth")} />
      <Route path="/portal/carrier-rates" component={gated(CarrierRatings, "/portal/carrier-rates")} />
      <Route path="/portal/crypto-corner" component={gated(CryptoCurrencyCorner, "/portal/crypto-corner")} />
      <Route path="/portal/lifetime-income" component={gated(LifetimeGuaranteedIncome, "/portal/lifetime-income")} />
      <Route path="/portal/existing-annuities" component={gated(ExistingAnnuities, "/portal/existing-annuities")} />
      <Route path="/portal/growth-annuities" component={gated(GrowthAnnuities, "/portal/growth-annuities")} />
      <Route path="/portal/myga-fixed-rate" component={gated(MYGAFixedRate, "/portal/myga-fixed-rate")} />
      <Route path="/portal/axonic-sp500" component={gated(AxonicSP500, "/portal/axonic-sp500")} />
      <Route path="/portal/athene-pe-plus15" component={gated(AthenePEPlus15, "/portal/athene-pe-plus15")} />
      <Route path="/portal/athene-guaranteed-income" component={gated(AtheneGuaranteedIncome, "/portal/athene-guaranteed-income")} />
      <Route path="/portal/income-annuity-top10" component={gated(IncomeAnnuityTop10, "/portal/income-annuity-top10")} />
      <Route path="/portal/hot-income" component={gated(HotIncome, "/portal/hot-income")} />
      <Route path="/portal/recommendations" component={gated(Recommendations, "/portal/recommendations")} />
      <Route path="/portal/client-files" component={gated(ClientFiles, "/portal/client-files")} />
      <Route path="/portal/real-estate-mogul" component={gated(RealEstateMogul, "/portal/real-estate-mogul")} />
      <Route path="/portal/fia-top10" component={gated(FIATop10, "/portal/fia-top10")} />
      <Route path="/portal/tax-return-upload" component={gated(TaxReturnUpload, "/portal/tax-return-upload")} />
      <Route path="/portal/advisor-income-calculator" component={gated(AdvisorIncomeCalculator, "/portal/advisor-income-calculator")} />
      <Route path="/portal/social-security" component={gated(SocialSecurityOptimizer, "/portal/social-security")} />
      <Route path="/portal/client-onboarding" component={gated(ClientOnboardingWizard, "/portal/client-onboarding")} />
      <Route path="/portal/saved-scenarios" component={gated(SavedScenariosHub, "/portal/saved-scenarios")} />
      <Route path="/portal/ai-recommender" component={gated(AiStrategyRecommender, "/portal/ai-recommender")} />
      <Route path="/portal/email-campaigns" component={gated(EmailCampaignManager, "/portal/email-campaigns")} />
      <Route path="/portal/compliance-audit" component={gated(ComplianceAuditCenter, "/portal/compliance-audit")} />
      <Route path="/portal/education" component={gated(EducationHub, "/portal/education")} />
      <Route path="/portal/affiliate-links" component={gated(AffiliateLinkManager, "/portal/affiliate-links")} />
      <Route path="/portal/hidden-material" component={gated(HiddenMaterial, "/portal/hidden-material")} />
      <Route path="/portal/annuity-memory" component={gated(AnnuityMemory, "/portal/annuity-memory")} />
      <Route path="/portal/annuity-accumulation-db" component={gated(AnnuityAccumulationDB, "/portal/annuity-accumulation-db")} />
      <Route path="/portal/house-recycling" component={gated(HouseRecyclingStrategy, "/portal/house-recycling")} />

      {/* 20 Transformative Upgrades */}
      <Route path="/portal/sales-story" component={gated(SalesStoryBuilder, "/portal/sales-story")} />
      <Route path="/portal/estate-flow" component={gated(EstateFlowChart, "/portal/estate-flow")} />
      <Route path="/portal/goals-planning" component={gated(GoalsBasedPlanning, "/portal/goals-planning")} />
      <Route path="/portal/risk-tolerance" component={gated(RiskToleranceScoring, "/portal/risk-tolerance")} />
      <Route path="/portal/scenario-play" component={gated(MultiScenarioPlayZone, "/portal/scenario-play")} />
      <Route path="/portal/withdrawal-sequencing" component={gated(WithdrawalSequencing, "/portal/withdrawal-sequencing")} />
      <Route path="/portal/business-owner" component={gated(BusinessOwnerPlanning, "/portal/business-owner")} />
      <Route path="/portal/seminar-generator" component={gated(SeminarGenerator, "/portal/seminar-generator")} />
      <Route path="/portal/compliance-reports" component={gated(ComplianceReportGenerator, "/portal/compliance-reports")} />
      <Route path="/portal/advisor-training" component={gated(AdvisorTraining, "/portal/advisor-training")} />
      <Route path="/portal/agency-tutorial" component={gated(AgencyTutorial, "/portal/agency-tutorial")} />
      <Route path="/portal/agent-tutorial" component={gated(IndividualAgentTutorial, "/portal/agent-tutorial")} />
      <Route path="/portal/monitoring-agreement" component={gated(SupervisorMonitoringAgreement, "/portal/monitoring-agreement")} />
      <Route path="/portal/team-management" component={gated(TeamManagement, "/portal/team-management")} />
      <Route path="/portal/owner-oversight" component={gated(OwnerOversight, "/portal/owner-oversight")} />
      <Route path="/portal/predictive-analytics" component={gated(PredictiveAnalytics, "/portal/predictive-analytics")} />
      <Route path="/portal/collaborative-planning" component={gated(CollaborativePlanning, "/portal/collaborative-planning")} />
      <Route path="/portal/market-data" component={gated(MarketDataDashboard, "/portal/market-data")} />
      <Route path="/portal/ai-meeting-notes" component={gated(AIMeetingNotes, "/portal/ai-meeting-notes")} />
      <Route path="/portal/client-portal-config" component={gated(ClientPortal, "/portal/client-portal-config")} />
      <Route path="/portal/document-templates" component={gated(DocumentTemplates, "/portal/document-templates")} />
      <Route path="/portal/commission-calculator" component={gated(CommissionCalculator, "/portal/commission-calculator")} />
      <Route path="/portal/carrier-comparison" component={gated(CarrierComparison, "/portal/carrier-comparison")} />
      <Route path="/portal/referral-tracking" component={gated(ReferralTracking, "/portal/referral-tracking")} />
      <Route path="/portal/tax-brackets" component={gated(TaxBracketVisualizer, "/portal/tax-brackets")} />
      <Route path="/portal/policy-review-checklist" component={gated(PolicyReviewChecklist, "/portal/policy-review-checklist")} />
      <Route path="/portal/income-gap" component={gated(IncomeGapAnalyzer, "/portal/income-gap")} />
      <Route path="/portal/medicare-irmaa" component={gated(MedicareIRMAA, "/portal/medicare-irmaa")} />

      {/* NAIC Compliant Analysis Pages */}
      <Route path="/portal/iul-historical" component={gated(IULHistoricalPerformance, "/portal/iul-historical")} />
      <Route path="/portal/index-strategies" component={gated(IndexStrategyComparison, "/portal/index-strategies")} />
      <Route path="/portal/retirement-projection" component={gated(RetirementIncomeProjection, "/portal/retirement-projection")} />
      <Route path="/portal/tax-advantaged-growth" component={gated(TaxAdvantagedGrowth, "/portal/tax-advantaged-growth")} />

      {/* Client portal — gate removed */}
      <Route path="/client-portal/:token">{(params: any) => (
        <ClientPortalView {...params} />
      )}</Route>

      {/* Shared projection — public, no gate */}
      <Route path="/shared/:token" component={SharedProjection} />
      <Route path="/shared-slides/:token" component={SharedSlidesViewer} />

      {/* 15 AI Platform-Inspired Features */}
      <Route path="/portal/voice-plan" component={gated(VoicePlanBuilder, "/portal/voice-plan")} />
      <Route path="/portal/client-snapshot" component={gated(ClientSnapshotMap, "/portal/client-snapshot")} />
      <Route path="/portal/tax-opportunities" component={gated(TaxOpportunityDetector, "/portal/tax-opportunities")} />
      <Route path="/portal/workflow-automations" component={gated(WorkflowAutomations, "/portal/workflow-automations")} />
      <Route path="/portal/scenario-side-by-side" component={gated(ScenarioSideBySide, "/portal/scenario-side-by-side")} />
      <Route path="/portal/client-health" component={gated(ClientHealthDashboard, "/portal/client-health")} />
      <Route path="/portal/client-intake" component={gated(ClientIntakeInterview, "/portal/client-intake")} />
      <Route path="/portal/portfolio-drift" component={gated(PortfolioDriftMonitor, "/portal/portfolio-drift")} />
      <Route path="/portal/data-query" component={gated(NaturalLanguageQuery, "/portal/data-query")} />
      <Route path="/portal/engagement-score" component={gated(ClientEngagementScore, "/portal/engagement-score")} />
      <Route path="/portal/presentation-builder" component={gated(PresentationBuilder, "/portal/presentation-builder")} />
      <Route path="/portal/ai-slides" component={gated(AISlideGenerator, "/portal/ai-slides")} />
      <Route path="/portal/my-slides" component={gated(MySlides, "/portal/my-slides")} />
      <Route path="/portal/command-center" component={gated(OwnerWarRoom, "/portal/command-center")} />
      <Route path="/portal/batch-slides" component={gated(BatchSlides, "/portal/batch-slides")} />
      <Route path="/portal/compliance-audit-trail" component={gated(ComplianceAuditTrail, "/portal/compliance-audit-trail")} />
      <Route path="/portal/lead-generator" component={gated(LeadGenerator, "/portal/lead-generator")} />

      {/* 15 Second-Round Features */}
      <Route path="/portal/financial-vitals" component={gated(FinancialVitalsScorecard, "/portal/financial-vitals")} />
      <Route path="/portal/estate-document-gen" component={gated(EstateDocumentGenerator, "/portal/estate-document-gen")} />
      <Route path="/portal/retirement-guardrails" component={gated(RetirementGuardrails, "/portal/retirement-guardrails")} />
      <Route path="/portal/client-self-service" component={gated(ClientSelfServicePortal, "/portal/client-self-service")} />
      <Route path="/portal/tax-loss-harvesting" component={gated(TaxLossHarvestingScanner, "/portal/tax-loss-harvesting")} />
      <Route path="/portal/beneficiary-optimization" component={gated(BeneficiaryOptimization, "/portal/beneficiary-optimization")} />
      <Route path="/portal/fee-transparency" component={gated(FeeTransparencyDashboard, "/portal/fee-transparency")} />
      <Route path="/portal/succession-planning" component={gated(SuccessionPlanningWizard, "/portal/succession-planning")} />
      <Route path="/portal/ai-policy-review" component={gated(AIPolicyReviewGap, "/portal/ai-policy-review")} />
      <Route path="/portal/smart-rebalancing" component={gated(SmartRebalancingAlerts, "/portal/smart-rebalancing")} />
      <Route path="/portal/compliance-monitoring" component={gated(ComplianceMonitoringDashboard, "/portal/compliance-monitoring")} />
      <Route path="/portal/multi-gen-wealth" component={gated(MultiGenWealthTransfer, "/portal/multi-gen-wealth")} />
      <Route path="/portal/charitable-giving" component={gated(CharitableGivingOptimizer, "/portal/charitable-giving")} />
      <Route path="/portal/market-stress-test" component={gated(MarketScenarioStressTest, "/portal/market-stress-test")} />
      <Route path="/portal/client-onboarding-auto" component={gated(ClientOnboardingAutomation, "/portal/client-onboarding-auto")} />
      <Route path="/portal/commission-tracker" component={gated(CommissionTracker, "/portal/commission-tracker")} />

      {/* Enterprise Admin — gated */}
      <Route path="/portal/admin" component={gated(EnterpriseAdmin, "/portal/admin")} />
      <Route path="/portal/enterprise" component={gated(EnterpriseAdmin, "/portal/enterprise")} />

      {/* ── The Experience ──────────────────────────────────────── */}
      <Route path="/portal/nerve-center" component={gated(NerveCenter, "/portal/nerve-center")} />
      <Route path="/portal/arena" component={gated(Arena, "/portal/arena")} />
      <Route path="/portal/my-world" component={gated(MyWorld, "/portal/my-world")} />
      <Route path="/portal/war-room" component={gated(WarRoom, "/portal/war-room")} />
      <Route path="/portal/rewards" component={gated(RewardsVault, "/portal/rewards")} />
      <Route path="/portal/black-mirror" component={gated(BlackMirror, "/portal/black-mirror")} />
      <Route path="/portal/social" component={gated(SocialNarcotic, "/portal/social")} />
      <Route path="/portal/endgame" component={gated(Endgame, "/portal/endgame")} />
      <Route path="/portal/will-writer" component={gated(WillWriter, "/portal/will-writer")} />
      <Route path="/portal/avatar-twins" component={gated(AvatarTwins, "/portal/avatar-twins")} />
      <Route path="/portal/couples" component={gated(CouplesMode, "/portal/couples")} />
      <Route path="/portal/russell-number" component={gated(RussellNumber, "/portal/russell-number")} />
      <Route path="/portal/daily-discovery" component={gated(DailyDiscovery, "/portal/daily-discovery")} />
      <Route path="/portal/wrapped" component={gated(RussellWrapped, "/portal/wrapped")} />
      <Route path="/portal/story-generator" component={gated(ClientStoryGenerator, "/portal/story-generator")} />
      <Route path="/portal/time-machine" component={gated(TimeMachine, "/portal/time-machine")} />
      <Route path="/portal/co-pilot" component={gated(LiveCoPilot, "/portal/co-pilot")} />
      <Route path="/portal/time-lapse" component={gated(TimeLapse, "/portal/time-lapse")} />
      <Route path="/portal/wealth-reels" component={gated(InfiniteScroll, "/portal/wealth-reels")} />
      <Route path="/portal/infinite-scroll" component={gated(InfiniteScroll, "/portal/infinite-scroll")} />
      <Route path="/portal/morning-ritual" component={gated(MorningRitual, "/portal/morning-ritual")} />
      <Route path="/portal/pet" component={gated(PetSystem, "/portal/pet")} />
      <Route path="/portal/war-story-generator" component={gated(WarStoryGenerator, "/portal/war-story-generator")} />
      <Route path="/portal/revenue-guarantee" component={gated(RevenueGuarantee, "/portal/revenue-guarantee")} />
      <Route path="/portal/toilet" component={gated(ToiletDashboard, "/portal/toilet")} />
      <Route path="/portal/daily-briefing" component={gated(DailyBriefing, "/portal/daily-briefing")} />
      <Route path="/portal/comparison" component={gated(ComparisonDashboard, "/portal/comparison")} />
      <Route path="/portal/video-proposals" component={gated(VideoProposalGenerator, "/portal/video-proposals")} />
      <Route path="/video/:token" component={VideoViewer} />

      {/* ── Tax-Free Wealth Combos ──────────────────────────── */}
      <Route path="/portal/tax-combos" component={gated(TaxFreeWealthCombos, "/portal/tax-combos")} />
      <Route path="/portal/tax-combos/:id" component={gated(ComboDetail, "/portal/tax-combos")} />
      <Route path="/portal/secret-secrets" component={gated(SecretSecrets, "/portal/secret-secrets")} />
      <Route path="/portal/secret-secrets/:id" component={gated(SecretDetail, "/portal/secret-secrets")} />
      <Route path="/portal/combo-recommender" component={gated(ClientIntakeRecommender, "/portal/combo-recommender")} />
      <Route path="/portal/client-intake-recommender" component={gated(ClientIntakeRecommender, "/portal/client-intake-recommender")} />
      <Route path="/portal/divorce-calculator" component={gated(DivorceCalculator, "/portal/divorce-calculator")} />
      <Route path="/portal/trusts" component={gated(TrustsPage, "/portal/trusts")} />
      <Route path="/portal/mortgage-killer-v3" component={gated(MortgageKillerV3, "/portal/mortgage-killer-v3")} />
      <Route path="/portal/str-strategy" component={gated(STRStrategy, "/portal/str-strategy")} />
      <Route path="/portal/client-portfolio" component={gated(ClientPortfolioDashboard, "/portal/client-portfolio")} />
      <Route path="/portal/physicians-edge" component={gated(PhysiciansEdge, "/portal/physicians-edge")} />
      <Route path="/portal/video-library" component={gated(VideoLibrary, "/portal/video-library")} />
      <Route path="/portal/patent-showcase" component={gated(PatentShowcase, "/portal/patent-showcase")} />

      {/* Verified Grok client-journey additions — additive, no primary routes removed */}
      {/* New Client Welcome List — assessment, the AI Financial Advisor (Financial Librarian), the Wealth Genome, then the seven journey pages */}
      <Route path="/portal/financial-assessment" component={gated(FinancialAssessment, "/portal/financial-assessment")} />
      <Route path="/portal/ai-advisor" component={gated(AIFinancialAdvisor, "/portal/ai-advisor")} />
      <Route path="/portal/my-journey" component={gated(MyJourney, "/portal/my-journey")} />
      <Route path="/portal/plan-ledger" component={gated(PlanLedger, "/portal/plan-ledger")} />
      <Route path="/portal/connections" component={gated(Connections, "/portal/connections")} />
      <Route path="/portal/controls" component={gated(Controls, "/portal/controls")} />
      <Route path="/portal/erosion" component={gated(Erosion, "/portal/erosion")} />
      <Route path="/portal/forgiveness" component={gated(Forgiveness, "/portal/forgiveness")} />
      <Route path="/portal/tax-schedule" component={gated(TaxSchedule, "/portal/tax-schedule")} />
      <Route path="/portal/sphere" component={gated(Sphere, "/portal/sphere")} />
      <Route path="/portal/wealth-genome" component={gated(WealthGenomePage, "/portal/wealth-genome")} />
      <Route path="/portal/the-arrival" component={gated(TheArrival, "/portal/the-arrival")} />
      <Route path="/portal/the-mirror" component={gated(TheMirror, "/portal/the-mirror")} />
      <Route path="/portal/the-strategy-table" component={gated(TheStrategyTable, "/portal/the-strategy-table")} />
      <Route path="/portal/the-field" component={gated(TheField, "/portal/the-field")} />
      <Route path="/portal/the-map" component={gated(TheMap, "/portal/the-map")} />
      <Route path="/portal/the-legacy" component={gated(TheLegacy, "/portal/the-legacy")} />
      <Route path="/portal/the-brotherhood" component={gated(TheBrotherhood, "/portal/the-brotherhood")} />
      <Route path="/portal/secondary-information" component={gated(SecondaryInformation, "/portal/secondary-information")} />
      <Route path="/portal/planning-cases" component={gated(PlanningCases, "/portal/planning-cases")} />
      <Route path="/portal/system-health" component={gated(SystemHealth, "/portal/system-health")} />
      <Route path="/portal/site-health" component={gated(SiteHealth, "/portal/site-health")} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <EntrainmentProvider>
          {/* ═══ Universal Coherent Breathing Layer ═══
              Subliminal ambient animation at 6.0 breaths/min (10s cycle).
              Baroreflex resonance entrainment at exact 0.1 Hz for parasympathetic flow state.
              Body-level brightness + viewport scale cover every page — imperceptible to conscious awareness. */}
          <div className="rc-breathe-layer" aria-hidden="true" />
          <div className="rc-breathe-layer-extra" aria-hidden="true" />
          <GlobalHooks />
          <OnboardingTour />
          <AchievementUnlockOverlay />
          <PetEvolutionOverlay />
          <SkipToContent />
          <FocusRingStyles />
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            {/* Browser-side platforms the host switched on (PostHog, GA4, Sentry, Intercom) */}
            <AnalyticsLoader />
            {/* Per-route title/description/canonical and real-visitor Core Web Vitals */}
            <SeoSync />
            <WebVitalsReporter />
            <Router />
            {/* The every-page AI voice advisor — speak on any page, the AI
                answers in context of that page and the saved profile. */}
            <VoiceAdvisor />
            <TrialTimer />
          </TooltipProvider>
        </EntrainmentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
