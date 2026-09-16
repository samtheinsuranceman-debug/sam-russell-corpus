/**
 * UnifiedDataBus — Client-side event bus that collects all platform events
 * and makes them available to Dr. Buddy AI Brain for context-aware responses.
 *
 * Modeled after the RCS AI Brain architecture pattern.
 * Every feature page calls useBrain().report(event) to emit events.
 * Dr. Buddy reads getAllEntries() to build its full patient context.
 */
import React, { createContext, useContext, useReducer, useCallback, useRef } from "react";

export type BrainEventType =
  | "assessment_started"
  | "assessment_completed"
  | "assessment_question_answered"
  | "prs_viewed"
  | "prs_score_computed"
  | "digital_twin_viewed"
  | "digital_twin_alert_triggered"
  | "digital_twin_checkin"
  | "life_events_analyzed"
  | "life_maps_generated"
  | "journal_entry_created"
  | "journal_sentiment_analyzed"
  | "medication_added"
  | "medication_logged"
  | "medication_interaction_checked"
  | "wellness_plan_generated"
  | "wellness_action_completed"
  | "crisis_detected"
  | "crisis_resources_viewed"
  | "progress_checkin_completed"
  | "research_searched"
  | "report_viewed"
  | "report_shared"
  | "dr_buddy_opened"
  | "dr_buddy_message_sent"
  | "patient_portal_message_sent"
  | "page_visited";

export interface BrainEvent {
  id: string;
  type: BrainEventType;
  timestamp: number;
  payload: Record<string, unknown>;
  page?: string;
}

interface BrainState {
  events: BrainEvent[];
  sessionStarted: number;
  lastActivity: number;
}

type BrainAction =
  | { type: "EMIT"; event: BrainEvent }
  | { type: "CLEAR" };

function brainReducer(state: BrainState, action: BrainAction): BrainState {
  switch (action.type) {
    case "EMIT":
      return {
        ...state,
        events: [...state.events.slice(-199), action.event], // keep last 200 events
        lastActivity: action.event.timestamp,
      };
    case "CLEAR":
      return { ...state, events: [], lastActivity: Date.now() };
    default:
      return state;
  }
}

interface BrainContextValue {
  report: (type: BrainEventType, payload?: Record<string, unknown>, page?: string) => void;
  getAllEntries: () => BrainEvent[];
  getEntriesByType: (type: BrainEventType) => BrainEvent[];
  getRecentEntries: (count?: number) => BrainEvent[];
  getSummary: () => string;
  clearHistory: () => void;
  sessionStarted: number;
  lastActivity: number;
}

const BrainContext = createContext<BrainContextValue | null>(null);

let eventCounter = 0;

export function UnifiedDataBusProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(brainReducer, {
    events: [],
    sessionStarted: Date.now(),
    lastActivity: Date.now(),
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const report = useCallback(
    (type: BrainEventType, payload: Record<string, unknown> = {}, page?: string) => {
      const event: BrainEvent = {
        id: `evt_${++eventCounter}_${Date.now()}`,
        type,
        timestamp: Date.now(),
        payload,
        page: page ?? window.location.pathname,
      };
      dispatch({ type: "EMIT", event });
    },
    []
  );

  const getAllEntries = useCallback(() => stateRef.current.events, []);

  const getEntriesByType = useCallback(
    (type: BrainEventType) => stateRef.current.events.filter((e) => e.type === type),
    []
  );

  const getRecentEntries = useCallback(
    (count = 20) => stateRef.current.events.slice(-count),
    []
  );

  const getSummary = useCallback(() => {
    const events = stateRef.current.events;
    if (events.length === 0) return "No activity recorded yet in this session.";

    const counts: Partial<Record<BrainEventType, number>> = {};
    for (const e of events) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }

    const lines: string[] = [];
    const sessionMins = Math.round((Date.now() - stateRef.current.sessionStarted) / 60000);
    lines.push(`Session active for ${sessionMins} minutes. ${events.length} events recorded.`);

    if (counts.assessment_completed) lines.push(`Completed ${counts.assessment_completed} assessment(s).`);
    if (counts.prs_score_computed) lines.push(`PRS score computed ${counts.prs_score_computed} time(s).`);
    if (counts.digital_twin_alert_triggered) lines.push(`${counts.digital_twin_alert_triggered} Digital Twin alert(s) triggered.`);
    if (counts.journal_entry_created) lines.push(`Created ${counts.journal_entry_created} journal entry/entries.`);
    if (counts.medication_interaction_checked) lines.push(`Checked ${counts.medication_interaction_checked} drug interaction(s).`);
    if (counts.crisis_detected) lines.push(`⚠️ Crisis signal detected ${counts.crisis_detected} time(s).`);
    if (counts.wellness_action_completed) lines.push(`Completed ${counts.wellness_action_completed} wellness action(s).`);
    if (counts.progress_checkin_completed) lines.push(`Completed ${counts.progress_checkin_completed} progress check-in(s).`);

    const recentPages = Array.from(new Set(events.slice(-10).map((e) => e.page).filter(Boolean)));
    if (recentPages.length > 0) lines.push(`Recently visited: ${recentPages.join(", ")}.`);

    return lines.join(" ");
  }, []);

  const clearHistory = useCallback(() => dispatch({ type: "CLEAR" }), []);

  return (
    <BrainContext.Provider
      value={{
        report,
        getAllEntries,
        getEntriesByType,
        getRecentEntries,
        getSummary,
        clearHistory,
        sessionStarted: state.sessionStarted,
        lastActivity: state.lastActivity,
      }}
    >
      {children}
    </BrainContext.Provider>
  );
}

export function useBrain(): BrainContextValue {
  const ctx = useContext(BrainContext);
  if (!ctx) throw new Error("useBrain must be used inside UnifiedDataBusProvider");
  return ctx;
}
