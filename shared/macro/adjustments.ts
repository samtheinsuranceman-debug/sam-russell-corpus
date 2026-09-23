/**
 * Macro Adjustments — what the toggles do to a calculator's assumptions.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every predictive calculator on the platform can mount `MacroScenarioToggle`.
 * The toggle state comes here; what goes back is a small, additive set of
 * deltas the calculator applies to its own base assumptions: yield, mortgage
 * rate, inflation, equity return and volatility, dollar, gold, recession
 * probability. The calculator keeps its own math; it only shifts its inputs.
 *
 * Nothing here is hidden: `rationale` lists each step and `sourceIds` gives
 * the citations, so the evidence ledger on the PDF shows exactly why the
 * number moved.
 */
import type { MacroAdjustments, MacroToggles } from "./types";
import { simulateLiquidation } from "./treasuryLiquidation";
import { forecastPetrodollar } from "./petrodollar";
import { contagion } from "./globalDebt";
import { simulateTaiwanImpact, TAIWAN_PRIORS } from "./taiwanRisk";
import { A } from "./assumptions";

import { NEUTRAL_ADJUSTMENTS } from "./neutral";
export { NEUTRAL_ADJUSTMENTS };

/** Fast path: fewer Monte Carlo runs for interactive toggling; the page can request the full 10,000. */
export function macroAdjustments(toggles: MacroToggles, opts: { runs?: number } = {}): MacroAdjustments {
  const runs = opts.runs ?? 2000;
  const out: MacroAdjustments = { ...NEUTRAL_ADJUSTMENTS, rationale: [], sourceIds: [] };
  let recession = 0.15;
  const conf: number[] = [];

  if (toggles.treasuryLiquidation) {
    const t = toggles.treasuryLiquidation;
    const r = simulateLiquidation({ holder: t.holder, fraction: t.fraction, months: t.months, runs });
    const bp = r.twelveMonthTenYearDeltaBp.p50;
    out.tenYearYieldDelta += bp / 100;
    out.mortgageRateDelta += (bp * 0.9) / 100;
    out.equityReturnMultiplier *= 1 + r.transmission.equityIndexPct / 100 / 5; // spread a one-off repricing over five years
    out.equityVolMultiplier *= 1 + Math.min(0.5, Math.abs(bp) / 200);
    out.dollarIndexPct += r.transmission.dollarIndexPct;
    out.goldPct += r.transmission.goldPct;
    recession += r.transmission.recessionProbabilityDelta / 100;
    out.rationale.push(
      `${t.holder === "BOTH" ? "Japan and China" : t.holder === "JP" ? "Japan" : "China"} sell ${Math.round(t.fraction * 100)} % of Treasuries ($${r.soldUsdBn.toLocaleString()} bn) over ${t.months} months → 10-year +${bp.toFixed(0)} bp at month 12 (median of ${runs.toLocaleString()} paths; p90 +${r.twelveMonthTenYearDeltaBp.p90.toFixed(0)} bp).`,
    );
    out.sourceIds.push(...r.sourceIds);
    conf.push(70);
  }

  if (toggles.petrodollarErosion) {
    const p = toggles.petrodollarErosion;
    const f = forecastPetrodollar({ years: p.years, runs });
    const endShare = f.path[f.path.length - 1].share.p50;
    const target = Math.max(p.targetNonUsdShare, endShare);
    const delta = target - f.startShare; // points of share moving out of the dollar
    // Per 10 points of oil trade leaving the dollar (rules table `oil.adj.*`): less official recycling into Treasuries → term premium; dollar; gold; import-price inflation.
    const tpBp = (delta / 10) * A("oil.adj.termPremiumBpPer10pts");
    out.tenYearYieldDelta += tpBp / 100;
    out.mortgageRateDelta += (tpBp * A("liq.tx.mortgagePassThrough")) / 100;
    out.dollarIndexPct += (delta / 10) * A("oil.adj.dollarPctPer10pts");
    out.goldPct += (delta / 10) * A("oil.adj.goldPctPer10pts");
    out.inflationDelta += (delta / 10) * A("oil.adj.inflationPpPer10pts");
    out.rationale.push(`Non-dollar oil settlement to ${target.toFixed(0)} % by ${2026 + p.years} (from ${f.startShare} %): +${tpBp.toFixed(0)} bp term premium, dollar ${((delta / 10) * A("oil.adj.dollarPctPer10pts")).toFixed(1)} %, gold +${((delta / 10) * A("oil.adj.goldPctPer10pts")).toFixed(0)} % [oil.adj.*].`);
    out.sourceIds.push(...f.sourceIds);
    conf.push(45);
  }

  if (toggles.sovereignStress && toggles.sovereignStress.countries.length) {
    const c = contagion({ countries: toggles.sovereignStress.countries });
    out.tenYearYieldDelta += c.effects.usTreasuryFlightBp / 100;
    out.mortgageRateDelta += (c.effects.usTreasuryFlightBp * 0.9) / 100;
    out.equityReturnMultiplier *= c.effects.equityReturnMultiplier;
    out.equityVolMultiplier *= c.effects.equityVolMultiplier;
    out.dollarIndexPct += c.effects.dollarIndexPct;
    recession += c.effects.recessionProbabilityDelta / 100;
    out.rationale.push(`Sovereign stress in ${c.triggers.join(", ")} (${c.triggerGdpShare} % of world GDP): EM spreads +${c.effects.emSpreadDeltaBp} bp, equity vol ×${c.effects.equityVolMultiplier}, Treasuries ${c.effects.usTreasuryFlightBp > 0 ? "+" : ""}${c.effects.usTreasuryFlightBp} bp.`);
    out.sourceIds.push(...c.sourceIds);
    conf.push(55);
  }

  if (toggles.taiwan) {
    const tw = toggles.taiwan;
    const p = tw.probability ?? TAIWAN_PRIORS[tw.scenario];
    const r = simulateTaiwanImpact({ scenario: tw.scenario, runs });
    // Expected-value blend: probability-weight the shock into the assumptions, and show the conditional shock in the rationale.
    out.equityReturnMultiplier *= 1 + (p * r.equityDrawdownPct.p50) / 100 / 3;
    out.equityVolMultiplier *= 1 + p * Math.min(1.5, Math.abs(r.equityDrawdownPct.p50) / 30);
    out.tenYearYieldDelta += (p * r.tenYearDeltaBp.p50) / 100;
    out.goldPct += p * r.goldPct.p50;
    out.inflationDelta += p * (r.chipSupplyLoss * A("tw.adj.inflationPpPerChipLoss"));
    recession += p * r.recessionProbability;
    out.rationale.push(`Taiwan ${tw.scenario} at ${Math.round(p * 100)} % probability: conditional first-year world GDP ${r.firstYearGdpPct.p50.toFixed(1)} %, equities ${r.equityDrawdownPct.p50.toFixed(0)} %, gold +${r.goldPct.p50.toFixed(0)} %; probability-weighted into the assumptions.`);
    out.sourceIds.push(...r.sourceIds);
    conf.push(40);
  }

  out.recessionProbability = round4(Math.min(0.95, recession));
  out.tenYearYieldDelta = round4(out.tenYearYieldDelta);
  out.mortgageRateDelta = round4(out.mortgageRateDelta);
  out.inflationDelta = round4(out.inflationDelta);
  out.equityReturnMultiplier = round4(out.equityReturnMultiplier);
  out.equityVolMultiplier = round4(out.equityVolMultiplier);
  out.dollarIndexPct = round4(out.dollarIndexPct);
  out.goldPct = round4(out.goldPct);
  out.sourceIds = Array.from(new Set(out.sourceIds));
  out.confidence = conf.length ? Math.round(conf.reduce((a, b) => a + b, 0) / conf.length) : 100;
  if (!out.rationale.length) out.rationale = [...NEUTRAL_ADJUSTMENTS.rationale];
  return out;
}

/** Apply adjustments to a calculator's base assumptions in one call. */
export function applyMacro<T extends { expectedReturn?: number; volatility?: number; inflationRate?: number; mortgageRate?: number; tenYearYield?: number }>(base: T, adj: MacroAdjustments): T {
  const out = { ...base };
  if (typeof base.expectedReturn === "number") out.expectedReturn = base.expectedReturn * adj.equityReturnMultiplier;
  if (typeof base.volatility === "number") out.volatility = base.volatility * adj.equityVolMultiplier;
  if (typeof base.inflationRate === "number") out.inflationRate = base.inflationRate + adj.inflationDelta / 100;
  if (typeof base.mortgageRate === "number") out.mortgageRate = base.mortgageRate + adj.mortgageRateDelta / 100;
  if (typeof base.tenYearYield === "number") out.tenYearYield = base.tenYearYield + adj.tenYearYieldDelta / 100;
  return out;
}

function round4(x: number) {
  return Math.round(x * 10_000) / 10_000;
}
