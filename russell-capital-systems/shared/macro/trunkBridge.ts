/**
 * Trunk Bridge — how this layer extends the engines the corpus trunk already
 * has, instead of duplicating them.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The trunk (`sam-russell-corpus/russell-capital-systems/shared/`) holds:
 *
 *   • `macroEngine.ts` — the money-printing layer: M2 growth → consumer
 *     inflation, hard-asset boosts, mortgage rate and credit availability,
 *     future taxation, as one `MacroAssumptions` object driving `macroPath()`.
 *   • `marketRegimeClassifier.ts` — rule-based regime labels for each year of
 *     the record and `regimeConditionedPaths()` that resample history
 *     conditioned on a starting regime.
 *   • `historicalMarketRegimeEngine.ts` / `shockRegimeBridge.ts` — the record
 *     with sample sizes, and regime readings for windows without index data.
 *
 * None of them prices a Treasury liquidation, oil leaving the dollar, a
 * sovereign restructuring or a Taiwan strike. This layer does. The two
 * functions here are the join: they take this layer's `MacroAdjustments` and
 * produce (1) an overlay on the trunk's `MacroAssumptions` so `macroPath()`
 * carries the shock through every chained calculator, and (2) a starting
 * regime and threshold overlay so `regimeConditionedPaths()` samples the kind
 * of years the shock implies.
 *
 * The trunk's types are declared here structurally (only the fields the
 * bridge touches) so this file compiles in any tree; on the trunk, replace the
 * local declarations with `import type { MacroAssumptions } from
 * "./macroEngine"` and `import type { Regime, RegimeThresholds } from
 * "./marketRegimeClassifier"` — the shapes match field for field.
 */
import type { MacroAdjustments } from "./types";
import type { MacroAssumptions } from "../macroEngine";
import type { Regime, RegimeThresholds } from "../marketRegimeClassifier";

/** On the trunk these are the real engine types (port step 2); the structural copies the layer carried elsewhere are gone. */
export type TrunkMacroAssumptions = MacroAssumptions;
export type TrunkRegime = Regime;
export type TrunkRegimeThresholds = RegimeThresholds;

export type MacroEngineOverlay = {
  assumptions: TrunkMacroAssumptions;
  /** What changed and why, for `macroNarrative()` to print beside its own lines. */
  narrative: string[];
  sourceIds: string[];
};

export function overlayMacroEngine(base: TrunkMacroAssumptions, adj: MacroAdjustments): MacroEngineOverlay {
  const neutral = adj.tenYearYieldDelta === 0 && adj.mortgageRateDelta === 0 && adj.inflationDelta === 0 && adj.equityReturnMultiplier === 1 && adj.equityVolMultiplier === 1;
  if (neutral) return { assumptions: base, narrative: [], sourceIds: [] };
  const out: TrunkMacroAssumptions = {
    ...base,
    baselineCpiPct: round2(base.baselineCpiPct + adj.inflationDelta),
    credit: {
      ...base.credit,
      enabled: base.credit.enabled || adj.mortgageRateDelta !== 0,
      baseMortgageRatePct: round2(base.credit.baseMortgageRatePct + adj.mortgageRateDelta),
      availabilityCeiling: adj.equityReturnMultiplier < 1 ? Math.min(base.credit.availabilityCeiling, 1 + (base.credit.availabilityCeiling - 1) * adj.equityReturnMultiplier) : base.credit.availabilityCeiling,
    },
    hardAssets: {
      ...base.hardAssets,
      betaEquities: round4(base.hardAssets.betaEquities * adj.equityReturnMultiplier),
      betaRealEstate: round4(base.hardAssets.betaRealEstate * (1 - Math.max(0, adj.mortgageRateDelta) * 0.1)),
    },
  };
  const narrative = [
    `Global macro scenario applied to the money-printing layer: consumer inflation ${signed(adj.inflationDelta)} pp, mortgage rate ${signed(adj.mortgageRateDelta)} pp, equity beta ×${adj.equityReturnMultiplier.toFixed(2)}, recession probability ${Math.round(adj.recessionProbability * 100)} %.`,
    ...adj.rationale,
  ];
  return { assumptions: out, narrative, sourceIds: adj.sourceIds };
}

export type RegimeOverlay = {
  /** The regime the shock most resembles; `null` when the adjustment is neutral. */
  startRegime: TrunkRegime | null;
  /** Optional threshold tightening so the classifier labels the shock's years as such. */
  thresholds: Partial<TrunkRegimeThresholds>;
  /** Why, in one sentence a reader can check. */
  basis: string;
};

/**
 * Pick the trunk regime a shock most resembles, so the regime-conditioned
 * sampler starts its chain there.
 *
 *   yields up ≥ 100 bp with inflation up      → stagflation if equities fall too, else inflation-shock
 *   yields up ≥ 100 bp, inflation flat        → rate-shock
 *   equities multiplier ≤ 0.85 with vol up    → contraction
 *   inflation up ≥ 1 pp alone                 → inflation-shock
 *   anything smaller                          → null (let the classifier's most-recent regime stand)
 */
export function regimeForAdjustments(adj: MacroAdjustments): RegimeOverlay {
  const yieldsUp = adj.tenYearYieldDelta >= 1.0;
  const inflUp = adj.inflationDelta >= 0.5;
  const eqDown = adj.equityReturnMultiplier <= 0.85;
  const volUp = adj.equityVolMultiplier >= 1.2;
  if (yieldsUp && inflUp && eqDown) return { startRegime: "stagflation", thresholds: {}, basis: "Yields +≥100 bp, inflation +≥0.5 pp and equities repriced down: the 1973–74 / 1980 shape." };
  if (yieldsUp && inflUp) return { startRegime: "inflation-shock", thresholds: {}, basis: "Yields and inflation both up without an equity break: 2022." };
  if (yieldsUp) return { startRegime: "rate-shock", thresholds: { rateShockRise: Math.min(0.02, adj.tenYearYieldDelta / 100) }, basis: "A rate move of this size with flat inflation is the 1994 / 2013 shape; the rate-shock threshold is lowered to the modelled rise." };
  if (eqDown && volUp) return { startRegime: "contraction", thresholds: {}, basis: "Equity repricing with higher volatility and no rate move: 2008-style contraction." };
  if (inflUp) return { startRegime: "inflation-shock", thresholds: {}, basis: "Inflation alone." };
  return { startRegime: null, thresholds: {}, basis: "Adjustment too small to change the starting regime; the classifier's most recent label stands." };
}

const signed = (x: number) => `${x >= 0 ? "+" : ""}${x.toFixed(2)}`;
const round2 = (x: number) => Math.round(x * 100) / 100;
const round4 = (x: number) => Math.round(x * 10_000) / 10_000;
