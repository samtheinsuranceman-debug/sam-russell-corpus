/**
 * PredictiveContext — one macro scenario state for the whole portal.
 *
 * The scenario toggles are set once and travel with the visitor from
 * calculator to calculator, the way a stress assumption should. The app shell
 * renders the footer that shows them; a calculator that wants the numbers to
 * move calls `usePredictive()` and applies `adjustments` with `applyMacro`.
 * Outside the provider (tests, isolated renders) the hook returns a neutral
 * state, so a page never breaks for lack of the context.
 */
import { createContext, useContext, type ReactNode } from "react";
import { useMacroScenario, type MacroScenarioState } from "@/components/MacroScenarioToggle";
import { NEUTRAL_ADJUSTMENTS } from "@shared/macro/neutral";

const PredictiveContext = createContext<MacroScenarioState | null>(null);

export function PredictiveProvider({ children }: { children: ReactNode }) {
  const state = useMacroScenario();
  return <PredictiveContext.Provider value={state}>{children}</PredictiveContext.Provider>;
}

export function usePredictive(): MacroScenarioState {
  const ctx = useContext(PredictiveContext);
  if (ctx) return ctx;
  return { toggles: {}, adjustments: NEUTRAL_ADJUSTMENTS, loading: false, active: false, panel: <></> };
}
