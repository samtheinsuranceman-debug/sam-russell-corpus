/**
 * The "no macro scenario" adjustments, in a leaf module of its own so the app
 * shell (PredictiveContext, MacroScenarioToggle) can import it without pulling
 * the whole macro barrel (assumptions, sources, indicators…) into the entry bundle.
 * shared/macro/adjustments.ts re-exports it, so `@shared/macro` still provides it.
 */
import type { MacroAdjustments } from "./types";

export const NEUTRAL_ADJUSTMENTS: MacroAdjustments = {
  tenYearYieldDelta: 0,
  mortgageRateDelta: 0,
  inflationDelta: 0,
  equityReturnMultiplier: 1,
  equityVolMultiplier: 1,
  dollarIndexPct: 0,
  goldPct: 0,
  recessionProbability: 0.15,
  rationale: ["No macro scenario toggled; calculator uses its own assumptions."],
  sourceIds: [],
  confidence: 100,
};
