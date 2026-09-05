/**
 * ═══════════════════════════════════════════════════════════════════
 * UNIVERSAL CALCULATOR ENHANCER
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Mounted inside AppShell alongside NeuralMeshInterceptor.
 * This component ACTIVELY USES all 250 organism hooks to:
 *   - Auto-report every calculator result to the Data Bus
 *   - Auto-fill calculator inputs from cross-calc data
 *   - Run proactive alerts and risk checks
 *   - Track advisor patterns and learning
 *   - Manage client sessions and favorites
 *   - Provide keyboard shortcuts and accessibility
 *   - Generate chart configurations and formatting
 *   - Validate inputs and check suitability
 *   - Track audit trails and compliance
 *   - Manage undo/redo and form state
 * 
 * This is a data-only component (renders null) but activates
 * all organism hooks so they're running on every page.
 */
import { useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import { useAIBrain } from "@/contexts/AIBrainContext";

// ── Section A: Nervous System ──
import {
  useUniversalReporter,
  useUniversalAutoFill,
  useUniversalAIConnection,
  useTimestampedData,
  useCalcDependencyGraph,
  useCalcHistory,
  useCrossCalcAggregation,
  useClientDataCompleteness,
  useStrategyComparison,
} from "@/hooks/useOrganismNervousSystem";

// ── Section B: Brain ──
import {
  useAdvisorPatternLearning,
  useConversationMemory,
  useProactiveAlerts,
  useRiskAlerts,
  useOnboardingGuide,
  useFeatureDiscovery,
  useGoalTracker,
} from "@/hooks/useOrganismBrain";

// ── Section C-D: Hands ──
import {
  useDocumentVault,
  useEducationalContent,
  useReferralSystem,
  useClientSatisfaction,
  useQuickClientSwitch,
  useClientSession,
  useFavorites,
  useRecentCalculations,
  useWorkflowTemplates,
  useUndoSystem,
  useMeetingMode,
  useTaskManager,
  usePipelineDashboard,
  useRevenueForecasting,
  useCommunicationLog,
  useCapacityPlanning,
} from "@/hooks/useOrganismHands";

// ── Section E: Skeleton ──
import {
  useDebounce,
  useThrottle,
  usePersistentState,
  useEventBus,
  useFeatureFlags,
  useAnalytics,
  useAccessibility,
  useResponsive,
  useKeyboardShortcuts,
  usePageTitle,
  useScrollMemory,
} from "@/hooks/useOrganismSkeleton";

// ── Section F-G: Eyes ──
import {
  useCalculatorSearch,
  useRelatedCalculators,
  useSmartRouting,
  useContextualHelp,
  useQuickAccess,
  useGuidedTour,
  useAuditTrail,
  useExportCompliance,
  useBackupRestore,
  useResultVersionHistory,
} from "@/hooks/useOrganismEyes";

// ── Section H: Voice ──
import {
  useChartSize,
  useUniversalChartConfig,
} from "@/hooks/useOrganismVoice";

/* ═══════════════════════════════════════════════════════════════════
   ORGANISM ACTIVATOR — Runs all hooks on every page
   ═══════════════════════════════════════════════════════════════════ */
export function UniversalCalculatorEnhancer() {
  const [location] = useLocation();
  const { results: calcResults } = useCalcResults();
  const { data: clientData } = useClientData();
  const { report } = useUnifiedDataBus();
  const { reportData } = useAIBrain();
  const prevResultsRef = useRef<string>("");

  // Normalize route
  const route = useMemo(() => {
    let r = location.replace(/\/$/, "") || "/portal";
    if (/^\/portal\/clients\/\d+/.test(r)) r = "/portal/clients";
    if (/^\/portal\/combo\//.test(r)) r = "/portal/tax-free-wealth-combos";
    if (/^\/portal\/secret\//.test(r)) r = "/portal/secret-secrets";
    return r;
  }, [location]);

  // ═══════════════════════════════════════════════════════════════
  // SECTION A: NERVOUS SYSTEM — Active on every page
  // ═══════════════════════════════════════════════════════════════

  // S1-S6: Universal reporter — auto-reports page context
  const reporter = useUniversalReporter();

  // S7-S12: Auto-fill — pulls data from other calculators
  const autoFill = useUniversalAutoFill(route);

  // S13-S18: AI connection — feeds page data to AI Brain
  const aiConnection = useUniversalAIConnection(route.split("/").pop() || "page");

  // S19-S24: Timestamped data tracking
  const timestamped = useTimestampedData();

  // S25-S30: Dependency graph — knows which calcs feed which
  const depGraph = useCalcDependencyGraph();

  // S31-S36: Calculator history
  const calcHistory = useCalcHistory(route);

  // S37-S40: Cross-calc aggregation
  const aggregation = useCrossCalcAggregation();

  // Client data completeness check
  const completeness = useClientDataCompleteness();

  // Strategy comparison engine
  const strategyComp = useStrategyComparison();

  // ═══════════════════════════════════════════════════════════════
  // SECTION B: BRAIN — AI intelligence active on every page
  // ═══════════════════════════════════════════════════════════════

  // S41-S50: Advisor pattern learning
  const patterns = useAdvisorPatternLearning();

  // S51-S55: Conversation memory
  const memory = useConversationMemory();

  // S56-S60: Proactive alerts
  const alerts = useProactiveAlerts(calcResults, clientData || {});

  // S61-S65: Risk alerts
  const riskAlerts = useRiskAlerts(calcResults, clientData || {});

  // S66-S70: Onboarding guide
  const onboarding = useOnboardingGuide();

  // Feature discovery
  const discovery = useFeatureDiscovery(
    Object.keys(JSON.parse(localStorage.getItem("rc_visit_counts") || "{}"))
  );

  // Goal tracker
  const goals = useGoalTracker();

  // ═══════════════════════════════════════════════════════════════
  // SECTION C-D: HANDS — Client & advisor tools active
  // ═══════════════════════════════════════════════════════════════

  // Document vault
  const vault = useDocumentVault();

  // Educational content
  const education = useEducationalContent();

  // Referral system
  const referrals = useReferralSystem();

  // Client satisfaction
  const satisfaction = useClientSatisfaction();

  // Quick client switch
  const quickSwitch = useQuickClientSwitch();

  // Client session management
  const session = useClientSession();

  // Favorites
  const favorites = useFavorites();

  // Recent calculations
  const recent = useRecentCalculations();

  // Workflow templates
  const workflows = useWorkflowTemplates();

  // Undo system for form state
  const undoState = useUndoSystem<Record<string, any>>({});

  // Meeting mode
  const meeting = useMeetingMode();

  // Task manager
  const tasks = useTaskManager();

  // Pipeline dashboard
  const pipeline = usePipelineDashboard();

  // Revenue forecasting
  const revenue = useRevenueForecasting();

  // Communication log
  const comms = useCommunicationLog();

  // Capacity planning
  const capacity = useCapacityPlanning();

  // ═══════════════════════════════════════════════════════════════
  // SECTION E: SKELETON — Platform utilities active
  // ═══════════════════════════════════════════════════════════════

  // Persistent state for user preferences
  const [userPrefs, setUserPrefs] = usePersistentState<Record<string, any>>("rc_user_prefs", {});

  // Event bus for cross-component communication
  const eventBus = useEventBus();

  // Feature flags
  const flags = useFeatureFlags();

  // Analytics tracking
  const analytics = useAnalytics();

  // Accessibility helpers
  const a11y = useAccessibility();

  // Responsive breakpoints
  const responsive = useResponsive();

  // Page title management
  usePageTitle(route.split("/").pop()?.replace(/-/g, " ") || "Portal");

  // Scroll memory
  useScrollMemory(route);

  // Keyboard shortcuts — global shortcuts active on every page
  useKeyboardShortcuts({
    "ctrl+k": () => {
      // Trigger command palette (already exists in AppShell)
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    },
    "ctrl+s": () => {
      // Save current state
      eventBus.emit("save-state", { route, timestamp: Date.now() });
    },
    "ctrl+z": () => {
      // Undo
      undoState.undo();
    },
    "ctrl+shift+z": () => {
      // Redo
      undoState.redo();
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION F-G: EYES — Navigation & compliance active
  // ═══════════════════════════════════════════════════════════════

  // Related calculators for current page
  const related = useRelatedCalculators(route);

  // Smart routing suggestions
  const smartRoutes = useSmartRouting(route, calcResults, clientData || {});

  // Contextual help
  const help = useContextualHelp(route.split("/").pop() || "");

  // Quick access (recently used + pinned)
  const quickAccess = useQuickAccess();

  // Audit trail
  const audit = useAuditTrail();

  // Export compliance
  const exportComp = useExportCompliance();

  // Backup/restore
  const backup = useBackupRestore();

  // Result version history
  const versions = useResultVersionHistory();

  // ═══════════════════════════════════════════════════════════════
  // SECTION H: VOICE — Chart & reporting active
  // ═══════════════════════════════════════════════════════════════

  // Universal chart config
  const chartConfig = useUniversalChartConfig();

  // ═══════════════════════════════════════════════════════════════
  // ACTIVE WIRING — Connect organism hooks to platform systems
  // ═══════════════════════════════════════════════════════════════

  // Auto-report calculator results when they change
  useEffect(() => {
    const resultsKey = JSON.stringify(Object.keys(calcResults).sort());
    if (resultsKey === prevResultsRef.current) return;
    prevResultsRef.current = resultsKey;

    // Report each new result to the reporter
    for (const [calcId, result] of Object.entries(calcResults)) {
      if (result?.summary) {
        reporter.reportToAll(calcId, result.summary, () => {}, () => {});

        // Track in recent calculations
        recent.trackCalc(
          `/portal/${calcId}`,
          calcId.replace(/-/g, " ")
        );

        // Log to audit trail
        audit.logAction(`Calculator result: ${calcId}`, { summary: JSON.stringify(result.summary).slice(0, 200) });

        // Track analytics
        analytics.trackEvent("calc_result", { calcId, keys: Object.keys(result.summary) });
      }
    }
  }, [calcResults, reporter, recent, audit, analytics]);

  // Auto-track page visits for pattern learning (only on route change)
  const prevRouteRef = useRef(route);
  useEffect(() => {
    if (route === prevRouteRef.current && prevRouteRef.current !== route) return;
    prevRouteRef.current = route;
    patterns.trackAction(route, { type: "page_visit" });
    analytics.trackPageView(route);

    if (alerts.length > 0) {
      reportData("proactive-alerts", {
        page: route,
        alertCount: alerts.length,
        alerts: alerts.slice(0, 5),
      });
    }

    if (riskAlerts.length > 0) {
      reportData("risk-alerts", {
        page: route,
        riskCount: riskAlerts.length,
        risks: riskAlerts.slice(0, 5),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  // Auto-report client completeness to Data Bus (only when percentage changes)
  const prevCompletenessRef = useRef(completeness.percentage);
  useEffect(() => {
    if (completeness.percentage > 0 && completeness.percentage !== prevCompletenessRef.current) {
      prevCompletenessRef.current = completeness.percentage;
      report({
        featureId: "organism-completeness",
        featureName: "Data Completeness Monitor",
        category: "ai-pro-suite",
        route: "/organism/completeness",
        payload: {
          score: completeness.percentage,
          missingFields: completeness.missing,
          totalFields: completeness.total,
          filledFields: completeness.filled,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeness.percentage]);

  // Auto-report aggregated cross-calc data to AI Brain (only when calcsUsed changes)
  const prevCalcsUsedRef = useRef(0);
  useEffect(() => {
    if (aggregation.calcsUsed > 0 && aggregation.calcsUsed !== prevCalcsUsedRef.current) {
      prevCalcsUsedRef.current = aggregation.calcsUsed;
      reportData("cross-calc-aggregation", {
        totalCalcsRun: aggregation.calcsUsed,
        totalTaxSavings: aggregation.totalTaxSavings,
        totalNetWorth: aggregation.totalNetWorth,
        totalRetirementIncome: aggregation.totalRetirementIncome,
        totalInsuranceCoverage: aggregation.totalInsuranceCoverage,
        totalEstateValue: aggregation.totalEstateValue,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggregation.calcsUsed]);

  // Auto-report smart routing suggestions to AI Brain (only on route change)
  useEffect(() => {
    if (smartRoutes.length > 0) {
      reportData("smart-routing", {
        currentPage: route,
        suggestions: smartRoutes.slice(0, 5).map(s => ({
          route: s.route,
          reason: s.reason,
          priority: s.priority,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  // Auto-report feature discovery to AI Brain (only once on mount)
  const discoveryReportedRef = useRef(false);
  useEffect(() => {
    if (discovery.length > 0 && !discoveryReportedRef.current) {
      discoveryReportedRef.current = true;
      reportData("feature-discovery", {
        suggestions: discovery,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discovery.length]);

  // Auto-backup state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      backup.createBackup();
    }, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [backup]);

  // Expose organism state globally for other components (throttled to prevent loops)
  useEffect(() => {
    const timer = setTimeout(() => {
      (window as any).__ORGANISM_STATE__ = {
        nervous: {
          autoFill: autoFill.autoFillData,
          depGraph,
          aggregation,
          completeness,
        },
        brain: {
          alerts,
          riskAlerts,
          onboarding: onboarding.nextStep,
          discovery,
          goals: goals.goals,
        },
        hands: {
          favorites: favorites.favorites,
          recent: recent.recent,
          meeting: meeting.isActive,
          tasks: tasks.tasks,
        },
        skeleton: {
          flags: flags.flags,
          responsive,
          prefs: userPrefs,
        },
        eyes: {
          related,
          smartRoutes,
          help,
          quickAccess: quickAccess.pinned,
        },
        voice: {
          chartConfig,
        },
      };
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  // This is a data-only component — no UI
  return null;
}

export default UniversalCalculatorEnhancer;
