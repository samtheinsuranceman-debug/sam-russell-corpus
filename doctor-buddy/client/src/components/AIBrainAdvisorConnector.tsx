/**
 * AIBrainAdvisorConnector
 *
 * Modeled on the RCS AIBrainAdvisorConnector architecture.
 * This component bridges every patented feature page to the Dr. Buddy Brain
 * by emitting structured events to the UnifiedDataBus and the server-side
 * brain_events table via tRPC.
 *
 * Usage: wrap any page that should feed the Brain:
 *   <AIBrainAdvisorConnector feature="prs" data={prsData}>
 *     <PsychiatricRiskScorePage />
 *   </AIBrainAdvisorConnector>
 *
 * Or use the hook directly:
 *   const { reportFeatureEvent } = useAIBrainConnector("digital-twin");
 */
import { useEffect, useCallback, createContext, useContext, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useBrain } from "@/contexts/UnifiedDataBus";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Feature registry — maps feature keys to event categories ─────────────────
export type FeatureKey =
  | "prs"
  | "digital-twin"
  | "life-maps"
  | "life-events"
  | "assessment"
  | "report"
  | "journal"
  | "wellness-plan"
  | "medications"
  | "progress-checkin"
  | "crisis";

const FEATURE_META: Record<FeatureKey, { category: string; label: string }> = {
  "prs": { category: "psychiatric_risk", label: "Psychiatric Risk Score™" },
  "digital-twin": { category: "digital_twin", label: "Digital Twin Mental Health Model™" },
  "life-maps": { category: "life_trajectory", label: "Life Trajectory Divergence Engine™" },
  "life-events": { category: "life_events", label: "Life Events Trigger Probability Matrix™" },
  "assessment": { category: "assessment", label: "DSM-5 Adaptive Assessment™" },
  "report": { category: "diagnostic_report", label: "Auto-Differential Report™" },
  "journal": { category: "mood_journal", label: "AI Mood Journal" },
  "wellness-plan": { category: "wellness_plan", label: "Personalized Wellness Plan" },
  "medications": { category: "medication", label: "Medication Tracker" },
  "progress-checkin": { category: "progress_checkin", label: "Daily Progress Check-In" },
  "crisis": { category: "crisis", label: "Crisis Resources" },
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface AIBrainConnectorContextValue {
  reportFeatureEvent: (eventType: string, data?: Record<string, unknown>) => void;
  featureKey: FeatureKey;
}

const AIBrainConnectorContext = createContext<AIBrainConnectorContextValue>({
  reportFeatureEvent: () => {},
  featureKey: "assessment",
});

export function useAIBrainConnector() {
  return useContext(AIBrainConnectorContext);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAIBrainConnectorHook(feature: FeatureKey) {
  const { isAuthenticated } = useAuth();
  const { report } = useBrain();
  const emitMutation = trpc.drBuddy.emitEvent.useMutation();
  const meta = FEATURE_META[feature];

  const reportFeatureEvent = useCallback(
    (eventType: string, data?: Record<string, unknown>) => {
      if (!isAuthenticated) return;

      const payload = {
        feature,
        category: meta.category,
        eventType,
        label: meta.label,
        data: data ?? {},
        timestamp: Date.now(),
      };

      // 1. Emit to client-side UnifiedDataBus (instant, no network)
      // Map to a known BrainEventType or fall back to page_visited
      const busType = (eventType === "page_view" ? "page_visited" : eventType) as import("@/contexts/UnifiedDataBus").BrainEventType;
      report(busType, payload);

      // 2. Persist to server-side brain_events table (async, non-blocking)
      emitMutation.mutate({
        featureId: feature,
        category: meta.category,
        eventType: `${feature}.${eventType}`,
        payload,
      });
    },
    [feature, meta, isAuthenticated, report, emitMutation]
  );

  return { reportFeatureEvent, featureKey: feature };
}

// ─── Provider Component ───────────────────────────────────────────────────────
interface AIBrainAdvisorConnectorProps {
  feature: FeatureKey;
  children: React.ReactNode;
  /** Optional: auto-emit a "page_view" event on mount */
  emitPageView?: boolean;
  /** Optional: data to include in the page_view event */
  pageViewData?: Record<string, unknown>;
}

export function AIBrainAdvisorConnector({
  feature,
  children,
  emitPageView = true,
  pageViewData,
}: AIBrainAdvisorConnectorProps) {
  const { reportFeatureEvent } = useAIBrainConnectorHook(feature);
  const { isAuthenticated } = useAuth();
  const emittedRef = useRef(false);

  // Emit page_view on mount (once)
  useEffect(() => {
    if (emitPageView && isAuthenticated && !emittedRef.current) {
      emittedRef.current = true;
      reportFeatureEvent("page_view", pageViewData);
    }
  }, [isAuthenticated, emitPageView, pageViewData, reportFeatureEvent]);

  const value: AIBrainConnectorContextValue = {
    reportFeatureEvent,
    featureKey: feature,
  };

  return (
    <AIBrainConnectorContext.Provider value={value}>
      {children}
    </AIBrainConnectorContext.Provider>
  );
}

// ─── Convenience HOC ─────────────────────────────────────────────────────────
export function withAIBrainConnector<P extends object>(
  Component: React.ComponentType<P>,
  feature: FeatureKey
) {
  return function WrappedWithBrain(props: P) {
    return (
      <AIBrainAdvisorConnector feature={feature} emitPageView>
        <Component {...props} />
      </AIBrainAdvisorConnector>
    );
  };
}
