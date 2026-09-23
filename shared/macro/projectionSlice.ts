/**
 * The two projection helpers the app shell calls (PredictiveContext,
 * MacroScenarioToggle), in a leaf module of their own so the entry bundle
 * does not pull the macro barrel (assumptions, sources, indicators…). Same
 * reason as ./neutral.ts. shared/macro/projection.ts re-exports both, so
 * `@shared/macro` still provides them.
 */
import type { MacroAdjustments } from "./types";
import type { ProjectionHorizon, ProjectionYear } from "./projection";
import { NEUTRAL_ADJUSTMENTS } from "./neutral";

/**
 * The same path cut to a calculator's own horizon (production port, A22):
 * the portal asks for the longest path once and each calculator slices it,
 * so `averageAdjustments(sliceProjection(h, 10))` averages over ten years,
 * not the portal's sixty. `confidentYears` is recounted on the slice.
 *
 * The recount needs no threshold: `decayedConfidence` never rises with the
 * year, so the years at or above the apply threshold are always a prefix of
 * the path, and a slice of the first n years holds min(n, confidentYears).
 */
export function sliceProjection(h: ProjectionHorizon, years: number): ProjectionHorizon {
  const n = Math.max(1, Math.min(h.path.length, Math.round(years)));
  const path = h.path.slice(0, n);
  return { ...h, years: n, path, confidentYears: Math.min(n, h.confidentYears) };
}

/** A calculator that takes one set of assumptions for its whole horizon: the confidence-weighted average over the projected years. */
export function averageAdjustments(horizon: ProjectionHorizon): MacroAdjustments {
  const n = horizon.path.length || 1;
  const sum = (f: (p: ProjectionYear) => number) => horizon.path.reduce((s, p) => s + f(p), 0) / n;
  const r4 = (x: number) => Math.round(x * 10_000) / 10_000;
  const first = horizon.path[0]?.adjustments ?? NEUTRAL_ADJUSTMENTS;
  return {
    tenYearYieldDelta: r4(sum(p => p.adjustments.tenYearYieldDelta)),
    mortgageRateDelta: r4(sum(p => p.adjustments.mortgageRateDelta)),
    inflationDelta: r4(sum(p => p.adjustments.inflationDelta)),
    equityReturnMultiplier: r4(sum(p => p.adjustments.equityReturnMultiplier)),
    equityVolMultiplier: r4(sum(p => p.adjustments.equityVolMultiplier)),
    dollarIndexPct: r4(sum(p => p.adjustments.dollarIndexPct)),
    goldPct: r4(sum(p => p.adjustments.goldPct)),
    recessionProbability: r4(sum(p => p.adjustments.recessionProbability)),
    rationale: [...first.rationale, `Averaged over ${n} projected years by confidence weight (${horizon.confidentYears} years at or above the apply threshold).`],
    sourceIds: horizon.sourceIds,
    confidence: horizon.year1.confidence,
  };
}
