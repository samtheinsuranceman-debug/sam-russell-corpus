import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import PageErrorBoundary from "./components/PageErrorBoundary";
import DemoModeBanner from "./components/DemoModeBanner";
import UserAgreementModal from "./components/UserAgreementModal";
import { ThemeProvider } from "./contexts/ThemeContext";
// Atelier direction: cosmic effects removed
// import { CursorGlow } from "./components/CursorGlow";
// import { GlobalAtmosphere } from "./components/GlobalAtmosphere";
import Home from "./pages/Home";
import { lazy, Suspense, useEffect, useState, useRef, useCallback } from "react";
import {
  ProfileSkeleton,
  PricingSkeleton,
  AdminSkeleton,
  AssessmentSkeleton,
  EvidenceSkeleton,
  ScienceSkeleton,
  PageSkeleton,
} from "@/components/ui/loading-skeleton";

// Lazy load non-landing pages for performance
const Assessment = lazy(() => import("./pages/Assessment"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Evidence = lazy(() => import("./pages/Evidence"));
const Profile = lazy(() => import("./pages/Profile"));
const Science = lazy(() => import("./pages/Science"));
const Method = lazy(() => import("./pages/Method"));
const Membership = lazy(() => import("./pages/Membership"));
const Admin = lazy(() => import("./pages/Admin"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const InfluencerDashboard = lazy(() => import("./pages/InfluencerDashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Challenge = lazy(() => import("./pages/Challenge"));
const Results = lazy(() => import("./pages/Results"));
const Coaching = lazy(() => import("./pages/Coaching"));
const NlpReport = lazy(() => import("./pages/NlpReport"));
const PlatinumPreview = lazy(() => import("./pages/PlatinumPreview"));
const Login = lazy(() => import("./pages/Login"));
const About = lazy(() => import("./pages/About"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const CalibrationTest = lazy(() => import("./pages/CalibrationTest"));
const IntelligenceProfile = lazy(() => import("./pages/IntelligenceProfile"));
const UIPreview = lazy(() => import("./pages/UIPreview"));
const VideoAssessment = lazy(() => import("./pages/VideoAssessment"));
const Portal = lazy(() => import("./pages/Portal"));
const Commitment = lazy(() => import("./pages/Commitment"));
const ResearchLibrary = lazy(() => import("./pages/ResearchLibrary"));
const Archetypes = lazy(() => import("./pages/Archetypes"));
const Matches = lazy(() => import("./pages/Matches"));
const Messages = lazy(() => import("./pages/Messages"));
const Goals = lazy(() => import("./pages/Goals"));
const Beliefs = lazy(() => import("./pages/Beliefs"));
const EcologicalInterventions = lazy(() => import("./pages/EcologicalInterventions"));
const LaunchCheck = lazy(() => import("./pages/LaunchCheck"));
const Lines = lazy(() => import("./pages/Lines"));
const WhichArchetype = lazy(() => import("./pages/WhichArchetype"));
const WelcomeBack = lazy(() => import("./pages/WelcomeBack"));
const Corrections = lazy(() => import("./pages/Corrections"));
const Runbook = lazy(() => import("./pages/Runbook"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const BlackBox = lazy(() => import("./pages/BlackBox"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const SampleReport = lazy(() => import("./pages/SampleReport"));
const Help = lazy(() => import("./pages/Help"));
const MetaSystems = lazy(() => import("./pages/MetaSystems"));
const ScenarioIntelligence = lazy(() => import("./pages/ScenarioIntelligence"));
const VerificationLedger = lazy(() => import("./pages/VerificationLedger"));
const PricingStructure = lazy(() => import("./pages/PricingStructure"));
const BlindSideAnalyzer = lazy(() => import("./pages/BlindSideAnalyzer"));
const WeaknessFinder = lazy(() => import("./pages/WeaknessFinder"));
const SynergyReport = lazy(() => import("./pages/SynergyReport"));
const MensaLanding = lazy(() => import("./pages/MensaLanding"));

// Prefetch map for route → module
const prefetchMap: Record<string, () => Promise<any>> = {
  "/assessment": () => import("./pages/Assessment"),
  "/pricing": () => import("./pages/Pricing"),
  "/evidence": () => import("./pages/Evidence"),
  "/profile": () => import("./pages/Profile"),
  "/results": () => import("./pages/Results"),
  "/science": () => import("./pages/Science"),
  "/membership": () => import("./pages/Membership"),
  "/coaching": () => import("./pages/Coaching"),
  "/nlp-report": () => import("./pages/NlpReport"),
  "/admin": () => import("./pages/Admin"),
  "/portal": () => import("./pages/Portal"),
  "/commitment": () => import("./pages/Commitment"),
  "/calibration": () => import("./pages/CalibrationTest"),
  "/video-assessment": () => import("./pages/VideoAssessment"),
  "/intelligence-profile": () => import("./pages/IntelligenceProfile"),
};

// Prefetch on hover — preload route module when user hovers a link
const prefetched = new Set<string>();
export function usePrefetch() {
  return useCallback((path: string) => {
    if (prefetched.has(path) || !prefetchMap[path]) return;
    prefetched.add(path);
    prefetchMap[path]();
  }, []);
}

// Global client-error reporter — member-facing breakage becomes server-visible.
// Throttled to 5 reports per page load; never throws itself.
let errorReports = 0;
function reportClientError(message: string, stack?: string) {
  if (errorReports >= 5) return;
  errorReports += 1;
  try {
    fetch("/api/client-error", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, stack, url: location.pathname, ua: navigator.userAgent }),
    }).catch(() => { /* noop */ });
  } catch { /* noop */ }
}
if (typeof window !== "undefined" && !(window as any).__aqalErrHook) {
  (window as any).__aqalErrHook = true;
  window.addEventListener("error", (e) => reportClientError(e.message, e.error?.stack));
  window.addEventListener("unhandledrejection", (e) => reportClientError(`unhandledrejection: ${String(e.reason).slice(0, 200)}`, (e.reason as any)?.stack));
}

// Top loading bar component
function RouteLoadingBar() {
  const [location] = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevLocation = useRef(location);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (location !== prevLocation.current) {
      prevLocation.current = location;
      setLoading(true);
      setProgress(0);
      
      // Animate progress
      let p = 0;
      timerRef.current = setInterval(() => {
        p += Math.random() * 25 + 10;
        if (p >= 90) p = 90;
        setProgress(p);
      }, 80);

      // Complete after a short delay (Suspense will handle actual loading)
      const complete = setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 200);
      }, 300);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        clearTimeout(complete);
      };
    }
  }, [location]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary/80 to-accent"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 200ms ease-out, opacity 200ms ease-out' : 'width 300ms cubic-bezier(0.23, 1, 0.32, 1)',
          opacity: progress === 100 ? 0 : 1,
          boxShadow: '0 0 10px oklch(0.82 0.16 195 / 0.8), 0 0 20px oklch(0.7 0.2 240 / 0.4)',
        }}
      />
    </div>
  );
}

// Page transition wrapper — fade + subtle slide
function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionState, setTransitionState] = useState<'enter' | 'idle'>('idle');

  useEffect(() => {
    setTransitionState('enter');
    setDisplayChildren(children);
    const timer = setTimeout(() => setTransitionState('idle'), 300);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        transitionState === 'enter' 
          ? 'animate-page-enter' 
          : ''
      }`}
      style={{ willChange: 'opacity, transform' }}
    >
      {displayChildren}
    </div>
  );
}

// Back to top button
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary/80 backdrop-blur-sm border border-primary/30 text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary transition-all duration-200 hover:scale-110 active:scale-95"
      aria-label="Back to top"
      style={{
        animation: visible ? 'fadeInUp 300ms cubic-bezier(0.23, 1, 0.32, 1) forwards' : undefined,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8 12V4M4 7l4-4 4 4" />
      </svg>
    </button>
  );
}

function Router() {
  return (
    <PageTransition>
      <Switch>
        <Route path={"/"}>
          <PageErrorBoundary pageName="Home">
            <Home />
          </PageErrorBoundary>
        </Route>
        <Route path={"/assessment"}>
          <PageErrorBoundary pageName="Assessment">
            <Suspense fallback={<AssessmentSkeleton />}><Assessment /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/pricing"}>
          <PageErrorBoundary pageName="Pricing">
            <Suspense fallback={<PricingSkeleton />}><Pricing /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/evidence"}>
          <PageErrorBoundary pageName="Evidence">
            <Suspense fallback={<EvidenceSkeleton />}><Evidence /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/profile"}>
          <PageErrorBoundary pageName="Profile">
            <Suspense fallback={<ProfileSkeleton />}><Profile /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/portal"}>
          <PageErrorBoundary pageName="Portal">
            <Suspense fallback={<PageSkeleton />}><Portal /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/commitment"}>
          <PageErrorBoundary pageName="Commitment">
            <Suspense fallback={<PageSkeleton />}><Commitment /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/science"}>
          <PageErrorBoundary pageName="Science">
            <Suspense fallback={<ScienceSkeleton />}><Science /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/method"}>
          <PageErrorBoundary pageName="Method">
            <Suspense fallback={<PageSkeleton />}><Method /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/membership"}>
          <PageErrorBoundary pageName="Membership">
            <Suspense fallback={<PricingSkeleton />}><Membership /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/admin"}>
          <PageErrorBoundary pageName="Admin">
            <Suspense fallback={<AdminSkeleton />}><Admin /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/payment-success"}>
          <PageErrorBoundary pageName="Payment">
            <Suspense fallback={<PageSkeleton />}><PaymentSuccess /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/payment-cancel"}>
          <PageErrorBoundary pageName="Payment">
            <Suspense fallback={<PageSkeleton />}><PaymentCancel /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/influencer"}>
          <PageErrorBoundary pageName="Influencer">
            <Suspense fallback={<PageSkeleton />}><InfluencerDashboard /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/leaderboard"}>
          <PageErrorBoundary pageName="Leaderboard">
            <Suspense fallback={<PageSkeleton />}><Leaderboard /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/challenge/:token"}>
          <PageErrorBoundary pageName="Challenge">
            <Suspense fallback={<PageSkeleton />}><Challenge /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/results"}>
          <PageErrorBoundary pageName="Results">
            <Suspense fallback={<PageSkeleton />}><Results /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/coaching"}>
          <PageErrorBoundary pageName="Coaching">
            <Suspense fallback={<PageSkeleton />}><Coaching /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/nlp-report"}>
          <PageErrorBoundary pageName="NLP Report">
            <Suspense fallback={<PageSkeleton />}><NlpReport /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/login"}>
          <PageErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Login />
            </Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/signin"}>
          <PageErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Login />
            </Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/platinum"}>
          <PageErrorBoundary pageName="Platinum">
            <Suspense fallback={<PageSkeleton />}><PlatinumPreview /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/video-assessment"}>
          <PageErrorBoundary pageName="VideoAssessment">
            <Suspense fallback={<PageSkeleton />}><VideoAssessment /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/about"}>
          <PageErrorBoundary pageName="About">
            <Suspense fallback={<PageSkeleton />}><About /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/terms"}>
          <PageErrorBoundary pageName="Terms">
            <Suspense fallback={<PageSkeleton />}><Terms /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/privacy"}>
          <PageErrorBoundary pageName="Privacy">
            <Suspense fallback={<PageSkeleton />}><Privacy /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/calibration"}>
          <PageErrorBoundary pageName="Calibration">
            <Suspense fallback={<PageSkeleton />}><CalibrationTest /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/intelligence-profile"}>
          <PageErrorBoundary pageName="Intelligence Profile">
            <Suspense fallback={<PageSkeleton />}><IntelligenceProfile /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/research-library"}>
          <PageErrorBoundary pageName="Research Library">
            <Suspense fallback={<PageSkeleton />}><ResearchLibrary /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/archetypes"}>
          <PageErrorBoundary pageName="Archetypes">
            <Suspense fallback={<PageSkeleton />}><Archetypes /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/matches"}>
          <PageErrorBoundary pageName="Matches">
            <Suspense fallback={<PageSkeleton />}><Matches /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/messages"}>
          <PageErrorBoundary pageName="Messages">
            <Suspense fallback={<PageSkeleton />}><Messages /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/goals"}>
          <PageErrorBoundary pageName="Goals">
            <Suspense fallback={<PageSkeleton />}><Goals /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/beliefs"}>
          <PageErrorBoundary pageName="Beliefs">
            <Suspense fallback={<PageSkeleton />}><Beliefs /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/launch-check"}>
          <PageErrorBoundary pageName="LaunchCheck">
            <Suspense fallback={<PageSkeleton />}><LaunchCheck /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/lines"}>
          <PageErrorBoundary pageName="Lines">
            <Suspense fallback={<PageSkeleton />}><Lines /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/help"}>
          <PageErrorBoundary pageName="Help">
            <Suspense fallback={<PageSkeleton />}><Help /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/verify-email"}>
          <PageErrorBoundary pageName="VerifyEmail">
            <Suspense fallback={<PageSkeleton />}><VerifyEmail /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/sample-report"}>
          <PageErrorBoundary pageName="SampleReport">
            <Suspense fallback={<PageSkeleton />}><SampleReport /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/reset-password"}>
          <PageErrorBoundary pageName="ResetPassword">
            <Suspense fallback={<PageSkeleton />}><ResetPassword /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/black-box"}>
          <PageErrorBoundary pageName="BlackBox">
            <Suspense fallback={<PageSkeleton />}><BlackBox /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/welcome-back"}>
          <PageErrorBoundary pageName="WelcomeBack">
            <Suspense fallback={<PageSkeleton />}><WelcomeBack /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/corrections"}>
          <PageErrorBoundary pageName="Corrections">
            <Suspense fallback={<PageSkeleton />}><Corrections /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/runbook"}>
          <PageErrorBoundary pageName="Runbook">
            <Suspense fallback={<PageSkeleton />}><Runbook /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/which-archetype"}>
          <PageErrorBoundary pageName="WhichArchetype">
            <Suspense fallback={<PageSkeleton />}><WhichArchetype /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/ecological-interventions"}>
          <PageErrorBoundary pageName="EcologicalInterventions">
            <Suspense fallback={<PageSkeleton />}><EcologicalInterventions /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/meta-systems"}>
          <PageErrorBoundary pageName="MetaSystems">
            <Suspense fallback={<PageSkeleton />}><MetaSystems /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/scenario-intelligence"}>
          <PageErrorBoundary pageName="ScenarioIntelligence">
            <Suspense fallback={<PageSkeleton />}><ScenarioIntelligence /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/verification"}>
          <PageErrorBoundary pageName="Verification Ledger">
            <Suspense fallback={<PageSkeleton />}><VerificationLedger /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/pricing-structure"}>
          <PageErrorBoundary pageName="Pricing Structure">
            <Suspense fallback={<PageSkeleton />}><PricingStructure /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/blind-side"}>
          <PageErrorBoundary pageName="Blind-Side Analyzer">
            <Suspense fallback={<PageSkeleton />}><BlindSideAnalyzer /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/weakness-finder"}>
          <PageErrorBoundary pageName="Weakness-Finder">
            <Suspense fallback={<PageSkeleton />}><WeaknessFinder /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/synergy-report"}>
          <PageErrorBoundary pageName="Synergy Report">
            <Suspense fallback={<PageSkeleton />}><SynergyReport /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/mensa"}>
          <PageErrorBoundary pageName="Mensa">
            <Suspense fallback={<PageSkeleton />}><MensaLanding /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/ui-preview"}>
          <PageErrorBoundary pageName="UI Preview">
            <Suspense fallback={<PageSkeleton />}><UIPreview /></Suspense>
          </PageErrorBoundary>
        </Route>
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          {/* Skip to content — accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>
          {/* Atelier: no cosmic atmosphere or cursor glow */}
          <RouteLoadingBar />
          <DemoModeBanner />
          <UserAgreementModal />
          <Toaster />
          <main id="main-content" className="relative z-10">
            <Router />
          </main>
          <BackToTop />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
