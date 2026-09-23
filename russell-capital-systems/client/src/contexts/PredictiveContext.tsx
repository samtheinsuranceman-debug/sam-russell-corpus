/**
 * PredictiveContext — one macro scenario state for the whole portal.
 *
 * The scenario toggles are set once and travel with the visitor from
 * calculator to calculator, the way a stress assumption should. The app shell
 * renders the footer that shows them; a calculator that wants the numbers to
 * move calls `usePredictive()` and applies `adjustments` with `applyMacro`,
 * or — for a projection over years — `useCalculatorMacro({ years })` and
 * applies `averaged` (one set of assumptions for the whole horizon) or
 * `forYear(y)` (a year loop). Outside the provider (tests, isolated renders)
 * the hooks return a neutral state, so a page never breaks for lack of the
 * context.
 *
 * The provider asks the server for the projection path once, to
 * `PORTAL_PROJECTION_YEARS`; each calculator slices it to its own horizon, so
 * moving between calculators never re-queries.
 */
import { createContext, createElement, Fragment, useContext, useMemo, type ReactNode } from "react";
import { useMacroScenario, type MacroScenarioState } from "@/components/MacroScenarioToggle";
import { NEUTRAL_ADJUSTMENTS } from "@shared/macro/neutral";
import { averageAdjustments, sliceProjection } from "@shared/macro/projectionSlice";
import type { MacroAdjustments } from "@shared/macro/types";
import type { ProjectionHorizon } from "@shared/macro/projection";

/** The longest horizon any calculator asks for; the router caps `projection.years` at 60. */
export const PORTAL_PROJECTION_YEARS = 60;

const PredictiveContext = createContext<MacroScenarioState | null>(null);

export function PredictiveProvider({ children }: { children: ReactNode }) {
  const state = useMacroScenario({}, { years: PORTAL_PROJECTION_YEARS });
  return <PredictiveContext.Provider value={state}>{children}</PredictiveContext.Provider>;
}

const neutralForYear = (_year: number): MacroAdjustments => NEUTRAL_ADJUSTMENTS;

export const NEUTRAL_PREDICTIVE_STATE: MacroScenarioState = {
  toggles: {},
  adjustments: NEUTRAL_ADJUSTMENTS,
  averaged: NEUTRAL_ADJUSTMENTS,
  horizon: null,
  forYear: neutralForYear,
  confidentYears: 0,
  loading: false,
  active: false,
  // createElement, not JSX: this object is built at import time, and the
  // server-side test runner imports pages without React's automatic runtime.
  panel: createElement(Fragment),
};

export function usePredictive(): MacroScenarioState {
  const ctx = useContext(PredictiveContext);
  return ctx ?? NEUTRAL_PREDICTIVE_STATE;
}

export type CalculatorMacro = {
  /** Whether a scenario is toggled on anywhere in the portal. */
  active: boolean;
  /** Year-1 adjustments (full scenario). */
  adjustments: MacroAdjustments;
  /** Confidence-weighted average over this calculator's `years`. */
  averaged: MacroAdjustments;
  /** Adjustments for projected year `year` (1-based); neutral beyond the confident years. */
  forYear: (year: number) => MacroAdjustments;
  /** Years within this calculator's horizon that the platform projects with confidence. */
  confidentYears: number;
  /** The projection path sliced to this calculator's horizon; null until the server answers. */
  horizon: ProjectionHorizon | null;
  loading: boolean;
  /**
   * The portal's scenario panel, bound to the shared state. A predictive page
   * does not need it (the footer renders it); a page outside
   * `PREDICTIVE_CALCULATOR_PATHS` renders it so the visitor can see and set
   * the scenario that moves its numbers.
   */
  panel: MacroScenarioState["panel"];
};

/**
 * The one hook a calculator page needs. `years` is the page's own projection
 * horizon (default 30). Reads the portal-wide scenario; never queries.
 */
export function useCalculatorMacro(opts: { years?: number } = {}): CalculatorMacro {
  const s = usePredictive();
  const years = Math.max(1, Math.min(PORTAL_PROJECTION_YEARS, Math.round(opts.years ?? 30)));
  return useMemo(() => {
    const horizon = s.horizon ? sliceProjection(s.horizon, years) : null;
    const averaged = s.active && horizon ? averageAdjustments(horizon) : NEUTRAL_ADJUSTMENTS;
    const confidentYears = horizon ? horizon.confidentYears : 0;
    return { active: s.active, adjustments: s.adjustments, averaged, forYear: s.forYear, confidentYears, horizon, loading: s.loading, panel: s.panel };
  }, [s.active, s.adjustments, s.horizon, s.forYear, s.loading, s.panel, years]);
}
