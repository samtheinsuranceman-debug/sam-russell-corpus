import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { Suspense, lazy, ComponentType } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SupportModeProvider } from "./contexts/SupportModeContext";
import ConsumerHealthConsentModal from "./components/ConsumerHealthConsentModal";
import Home from "./pages/Home";
import ClinicalHome from "./pages/ClinicalHome";
import ClinicalDeploymentBanner from "./components/ClinicalDeploymentBanner";
import PreviewPostureBanner from "./components/PreviewPostureBanner";
import Assessment from "./pages/Assessment";
import WellnessIntake from "./pages/WellnessIntake";
import DiagnosticReport from "./pages/DiagnosticReport";
import Research from "./pages/Research";
import Dashboard from "./pages/Dashboard";
import SharedReport from "./pages/SharedReport";
import LifeMaps from "./pages/LifeMaps";
import LifeEvents from "./pages/LifeEvents";
import AIAdvisory from "./pages/AIAdvisory";
import PsychiatricRiskScore from "./pages/PsychiatricRiskScore";
import DigitalTwin from "./pages/DigitalTwin";
import AdminAuditPanel from "./pages/AdminAuditPanel";
import AccountSettings from "./pages/AccountSettings";
import ProgressCheckIn from "./pages/ProgressCheckIn";
import WellnessProgressCheckIn from "./pages/WellnessProgressCheckIn";
import CrisisResources from "./pages/CrisisResources";
import VitalSigns from "./pages/VitalSigns";
import MoodJournal from "./pages/MoodJournal";
import WellnessPlan from "./pages/WellnessPlan";
import GeneralWellnessPlan from "./pages/GeneralWellnessPlan";
import MedicationTracker from "./pages/MedicationTracker";
import { DrBuddyWidget } from "./components/DrBuddyWidget";
import DoctorPortal from "./pages/DoctorPortal";
import PatientPortal from "./pages/PatientPortal";
import PsychiatristPortal from "./pages/PsychiatristPortal";
import ConditionLibrary from "./pages/ConditionLibrary";
import FDACompliance from "./pages/FDACompliance";
import PhysicianWellness from "./pages/PhysicianWellness";
import { AIBrainAdvisorConnector } from "./components/AIBrainAdvisorConnector";
import SupportLab from "./pages/SupportLab";
import Companion from "./pages/Companion";
import ClinicalToolsUnavailable from "./pages/ClinicalToolsUnavailable";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import HealthDataPrivacy from "./pages/legal/HealthDataPrivacy";
import MedicalDisclaimer from "./pages/legal/MedicalDisclaimer";
import SubscriptionTerms from "./pages/legal/SubscriptionTerms";
import Subscribe from "./pages/Subscribe";
import Login from "./pages/Login";
import FinancialDisclaimer from "./pages/legal/FinancialDisclaimer";
import FinanceHub from "./pages/finance/FinanceHub";
import FactFinder from "./pages/finance/FactFinder";
import FinanceCalculator from "./pages/finance/FinanceCalculator";
import FinanceStrategy from "./pages/finance/FinanceStrategy";
import { CLINICAL_TOOLS_ENABLED } from "./lib/releasePolicy";
import PaidAccessGate from "./components/PaidAccessGate";
import ClinicalAccessGate from "./components/ClinicalAccessGate";

// Wrap each page in its own ErrorBoundary so one crash doesn't take down the whole app
function PageBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      }>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function withBoundary<P extends object>(Component: ComponentType<P>) {
  return function BoundedPage(props: P) {
    return <PageBoundary><Component {...props} /></PageBoundary>;
  };
}

const clinical = <P extends object>(Component: ComponentType<P>) =>
  CLINICAL_TOOLS_ENABLED ? withBoundary(Component) : withBoundary(ClinicalToolsUnavailable as ComponentType<P>);

const clinicalProtected = <P extends object>(Component: ComponentType<P>) =>
  CLINICAL_TOOLS_ENABLED
    ? function ClinicalProtectedPage(props: P) {
        return <PageBoundary><ClinicalAccessGate><Component {...props} /></ClinicalAccessGate></PageBoundary>;
      }
    : withBoundary(ClinicalToolsUnavailable as ComponentType<P>);

const clinicalClinician = <P extends object>(Component: ComponentType<P>) =>
  CLINICAL_TOOLS_ENABLED
    ? function ClinicalClinicianPage(props: P) {
        return <PageBoundary><ClinicalAccessGate clinicianOnly><Component {...props} /></ClinicalAccessGate></PageBoundary>;
      }
    : withBoundary(ClinicalToolsUnavailable as ComponentType<P>);

function PaidPage({ children }: { children: React.ReactNode }) {
  return <PageBoundary><PaidAccessGate>{children}</PaidAccessGate></PageBoundary>;
}

const paid = <P extends object>(Component: ComponentType<P>) =>
  function PaidBoundedPage(props: P) {
    return <PaidPage><Component {...props} /></PaidPage>;
  };

function Router() {
  return (
    <Switch>
      <Route path="/" component={CLINICAL_TOOLS_ENABLED ? withBoundary(ClinicalHome) : withBoundary(Home)} />
      <Route path="/assessment" component={CLINICAL_TOOLS_ENABLED ? withBoundary(Assessment) : paid(WellnessIntake)} />
      <Route path="/report/:id" component={clinical(DiagnosticReport)} />
      <Route path="/shared/:token" component={clinical(SharedReport)} />
      <Route path="/research" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(Research) : paid(Research)} />
      <Route path="/dashboard" component={clinicalProtected(Dashboard)} />
      <Route path="/life-maps" component={CLINICAL_TOOLS_ENABLED ? (() => <PageBoundary><ClinicalAccessGate clinicianOnly><AIBrainAdvisorConnector feature="life-maps"><LifeMaps /></AIBrainAdvisorConnector></ClinicalAccessGate></PageBoundary>) : withBoundary(ClinicalToolsUnavailable)} />
      <Route path="/life-events" component={CLINICAL_TOOLS_ENABLED ? (() => <PageBoundary><ClinicalAccessGate clinicianOnly><AIBrainAdvisorConnector feature="life-events"><LifeEvents /></AIBrainAdvisorConnector></ClinicalAccessGate></PageBoundary>) : withBoundary(ClinicalToolsUnavailable)} />
      <Route path="/ai-advisory" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(AIAdvisory) : paid(AIAdvisory)} />
      <Route path="/prs" component={CLINICAL_TOOLS_ENABLED ? (() => <PageBoundary><ClinicalAccessGate><AIBrainAdvisorConnector feature="prs"><PsychiatricRiskScore /></AIBrainAdvisorConnector></ClinicalAccessGate></PageBoundary>) : withBoundary(ClinicalToolsUnavailable)} />
      <Route path="/digital-twin" component={CLINICAL_TOOLS_ENABLED ? (() => <PageBoundary><ClinicalAccessGate><AIBrainAdvisorConnector feature="digital-twin"><DigitalTwin /></AIBrainAdvisorConnector></ClinicalAccessGate></PageBoundary>) : withBoundary(ClinicalToolsUnavailable)} />
      <Route path="/admin" component={clinicalClinician(AdminAuditPanel)} />
      <Route path="/settings" component={withBoundary(AccountSettings)} />
      <Route path="/progress" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(ProgressCheckIn) : paid(WellnessProgressCheckIn)} />
      <Route path="/crisis" component={withBoundary(CrisisResources)} />
      <Route path="/vital-signs" component={clinicalProtected(VitalSigns)} />
      <Route path="/journal" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(MoodJournal) : paid(MoodJournal)} />
      <Route path="/wellness-plan" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(WellnessPlan) : paid(GeneralWellnessPlan)} />
      <Route path="/medications" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(MedicationTracker) : paid(MedicationTracker)} />
      <Route path="/doctor" component={clinicalClinician(DoctorPortal)} />
      <Route path="/patient" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(PatientPortal) : paid(PatientPortal)} />
      <Route path="/psychiatrist" component={clinicalClinician(PsychiatristPortal)} />
      <Route path="/conditions" component={withBoundary(ConditionLibrary)} />
      <Route path="/fda-compliance" component={clinicalClinician(FDACompliance)} />
      <Route path="/physician-wellness" component={clinicalProtected(PhysicianWellness)} />
      <Route path="/support-lab" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(SupportLab) : paid(SupportLab)} />
      <Route path="/companion" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(Companion) : paid(Companion)} />
      {/* Medically-driven financial planning. The calculators are educational and
          not medical, so they take the edition's ordinary gate: paid membership in
          the public edition, clinical sign-in in the clinical edition. The one
          procedure that reads clinical data, finance.readiness, is server-blocked
          in the public edition. */}
      <Route path="/finance" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(FinanceHub) : paid(FinanceHub)} />
      <Route path="/finance/fact-finder" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(FactFinder) : paid(FactFinder)} />
      <Route path="/finance/calc/:id" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(FinanceCalculator) : paid(FinanceCalculator)} />
      <Route path="/finance/strategy/:slug" component={CLINICAL_TOOLS_ENABLED ? clinicalProtected(FinanceStrategy) : paid(FinanceStrategy)} />
      <Route path="/financial-disclaimer" component={withBoundary(FinancialDisclaimer)} />
      <Route path="/login" component={withBoundary(Login)} />
      <Route path="/subscribe" component={withBoundary(Subscribe)} />
      <Route path="/terms" component={withBoundary(Terms)} />
      <Route path="/privacy" component={withBoundary(Privacy)} />
      <Route path="/health-data-privacy" component={withBoundary(HealthDataPrivacy)} />
      <Route path="/medical-disclaimer" component={withBoundary(MedicalDisclaimer)} />
      <Route path="/subscription-terms" component={withBoundary(SubscriptionTerms)} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <SupportModeProvider>
        <TooltipProvider>
          <Toaster />
          {!CLINICAL_TOOLS_ENABLED && <ConsumerHealthConsentModal />}
          <ClinicalDeploymentBanner />
          <Router />
          <PreviewPostureBanner />
          <DrBuddyWidget />
        </TooltipProvider>
        </SupportModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
