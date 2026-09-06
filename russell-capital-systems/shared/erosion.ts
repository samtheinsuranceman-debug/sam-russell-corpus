// ============================================================
// THE EROSION ENGINE — two forces melt purchasing power: taxes and prices.
// This module models both against a client's plan over 40 years.
//
//   Tax trajectory: the historical base rate of change in statutory rates
//   (shared/taxHistory.ts) blended with a weighted consensus of published
//   long-horizon fiscal forecasts (server/forecastSources.ts). Output per
//   five-year horizon: the probability taxes are higher than today, the
//   expected change, a confidence score, and a burden multiplier the
//   projection applies to the client's effective rate.
//
//   Inflation ladder: annualised price change by category over 1–40 years
//   (server/inflation.ts feeds it from FRED); the client's own basket; the
//   purchasing-power decay of a dollar; and the nominal return required to
//   grow at all after inflation and tax — the real hurdle rate.
//
//   Two projections: the client's income and savings under current law with
//   indexed brackets (baseline), and under the expected tax path (alternate),
//   both in today's dollars. Every assumption is an input, printed back.
// ============================================================
import { TOP_MARGINAL_RATE, windowStats, type WindowStats, type YearValue } from "./taxHistory";
import { DEM_LEVER_SHARE, MIN_WINDOWS, baseRateFor, conditionalWindowStats, type PowerBucket } from "./powerHistory";
import { computeTaxPicture, currentRules, type FilingKey, type TaxRuleSet } from "./taxRules";

export const HORIZONS = [5, 10, 15, 20, 25, 30, 35, 40] as const;
export type Horizon = (typeof HORIZONS)[number];

// ─── Forecaster consensus ────────────────────────────────────────────────────
export type Direction = 1 | 0 | -1;

/** One published claim, already weighted by its source's evidence × track record × consistency. */
export type WeightedClaim = {
  sourceId: string;
  metric: string;
  horizonYear: number;
  /** the platform's reading of what the claim implies for the client's tax burden */
  direction: Direction;
  /** optional burden multiplier the claim implies (e.g. revenue/GDP 19.3 ÷ 17.1 = 1.129) */
  burdenMultiplier?: number | null;
  weight: number; // 0..1
};

export type ConsensusPoint = {
  horizonYears: number;
  targetYear: number;
  claims: number;
  coverage: number;   // 0..1, how much of the panel's weight spoke to this horizon
  direction: number;  // -1..1, weighted mean direction
  agreement: number;  // 0..1, 1 = every weighted claim points the same way
  burdenMultiplier: number | null; // weighted mean of the multipliers offered
};

export function consensusAt(claims: WeightedClaim[], startYear: number, h: number, totalPanelWeight: number): ConsensusPoint {
  const target = startYear + h;
  const half = Math.max(3, Math.floor(h / 2));
  const near = claims.filter((c) => Math.abs(c.horizonYear - target) <= half && c.weight > 0);
  const w = near.reduce((s, c) => s + c.weight, 0);
  if (!near.length || w <= 0 || totalPanelWeight <= 0) return { horizonYears: h, targetYear: target, claims: 0, coverage: 0, direction: 0, agreement: 0, burdenMultiplier: null };
  const dir = near.reduce((s, c) => s + c.weight * c.direction, 0) / w;
  const variance = near.reduce((s, c) => s + c.weight * (c.direction - dir) ** 2, 0) / w;
  const withMult = near.filter((c) => c.burdenMultiplier != null && Number.isFinite(c.burdenMultiplier));
  const mw = withMult.reduce((s, c) => s + c.weight, 0);
  const mult = mw > 0 ? withMult.reduce((s, c) => s + c.weight * (c.burdenMultiplier as number), 0) / mw : null;
  // A source may have several claims near one horizon; coverage counts distinct sources.
  const distinct = new Set(near.map((c) => c.sourceId)).size;
  const perSource = new Map<string, number>();
  for (const c of near) perSource.set(c.sourceId, Math.max(perSource.get(c.sourceId) ?? 0, c.weight));
  const coverage = Math.min(1, Array.from(perSource.values()).reduce((s, x) => s + x, 0) / totalPanelWeight);
  return { horizonYears: h, targetYear: target, claims: distinct, coverage: r3(coverage), direction: r3(dir), agreement: r3(1 - Math.min(1, variance)), burdenMultiplier: mult == null ? null : r3(mult) };
}

// ─── Tax trajectory ──────────────────────────────────────────────────────────
export type TrajectoryPoint = {
  horizonYears: number;
  year: number;
  history: WindowStats;
  consensus: ConsensusPoint;
  /** probability the top statutory rate is higher than today at this horizon */
  pHigher: number;
  /** expected change in the top rate, percentage points */
  expectedChangePoints: number;
  expectedTopRate: number;
  /** multiplier the alternate projection applies to the client's effective federal rate */
  burdenMultiplier: number;
  /** 0..1: how much the history and the panel agree, and how much of the panel spoke */
  confidence: number;
  weightOnHistory: number;
  /** the power layer: which base rate the history term used, and how much control alone moves the odds */
  power: PowerPoint | null;
};

export type PowerInput = {
  /** Democratic share of the federal levers today (president ½, Senate ¼, House ¼) */
  shareToday: number;
  /** expected share once the next elections seat, from the markets where they have spoken */
  expectedShareNext: number;
  /** the year the next elected government is seated */
  seatedYear: number;
  /** the long-run mean share since 1946; the path settles back to it after one full term */
  longRunShare: number;
};

export type PowerPoint = {
  leverShareExpected: number;   // mean expected share over the window
  bucket: PowerBucket;          // which bucket that share lands in
  pUpConditional: number;       // P(rate higher) in that bucket's windows
  windows: number;              // how many windows the bucket has
  fellBack: boolean;            // true when the bucket was thin and the unconditional rate was used
  pHigherIfLeft: number;        // the blended P(higher) had the left held ≥ ⅔ of the levers
  pHigherIfRight: number;       // … had the right held ≥ ⅔
  powerSwing: number;           // pHigherIfLeft − pHigherIfRight
};

/** Mean of the DEM lever share since 1946: where the path settles after one term. */
export function longRunLeverShare(from = 1946): number {
  const xs = DEM_LEVER_SHARE.filter((p) => p.year >= from && p.value != null).map((p) => p.value as number);
  return xs.length ? Math.round((xs.reduce((s, v) => s + v, 0) / xs.length) * 1000) / 1000 : 0.5;
}

/** Expected Democratic lever share averaged over the h years after startYear. */
export function expectedShareOver(power: PowerInput, startYear: number, h: number): number {
  let sum = 0;
  for (let k = 0; k < h; k += 1) {
    const y = startYear + k;
    sum += y < power.seatedYear ? power.shareToday : y < power.seatedYear + 4 ? power.expectedShareNext : power.longRunShare;
  }
  return h > 0 ? sum / h : power.shareToday;
}

export type TrajectoryInput = {
  startYear: number;
  series?: YearValue[];
  historyFrom?: number;
  claims: WeightedClaim[];
  /** weight of the sources that have published something usable */
  totalPanelWeight: number;
  /** weight of the whole panel, speaking or not; tempers confidence */
  allPanelWeight?: number;
  /** the power layer; when absent the unconditional history is used */
  power?: PowerInput | null;
};

export function taxTrajectory(input: TrajectoryInput): TrajectoryPoint[] {
  const series = input.series ?? TOP_MARGINAL_RATE;
  const current = series.find((p) => p.year === input.startYear)?.value ?? series[series.length - 1]!.value ?? 37;
  return HORIZONS.map((h) => {
    const hist = windowStats(series, h, input.historyFrom ?? 1946);
    const cons = consensusAt(input.claims, input.startYear, h, input.totalPanelWeight);
    // History carries the base rate; the panel moves it in proportion to how
    // much of the speaking panel addressed this horizon (up to 80%).
    const wHist = 1 - 0.8 * cons.coverage;
    // The power layer: the history term becomes the base rate of the windows
    // during which the expected holders of the levers held them, when the
    // record has enough such windows; otherwise the unconditional rate.
    const from = input.historyFrom ?? 1946;
    let pUp = hist.pUp, relMove = hist.meanAbsRelChange, power: PowerPoint | null = null;
    if (input.power) {
      const share = expectedShareOver(input.power, input.startYear, h);
      const br = baseRateFor(series, h, share, from);
      if (!br.fellBack) { pUp = br.used.pUp; relMove = br.used.meanAbsRelChange; }
      const blend = (p: number) => wHist * p + (1 - wHist) * ((cons.direction + 1) / 2);
      const leftP = br.left.windows >= MIN_WINDOWS ? br.left.pUp : hist.pUp, rightP = br.right.windows >= MIN_WINDOWS ? br.right.pUp : hist.pUp;
      power = { leverShareExpected: r3(share), bucket: br.bucket, pUpConditional: br.used.pUp, windows: br.used.windows, fellBack: br.fellBack, pHigherIfLeft: r3(blend(leftP)), pHigherIfRight: r3(blend(rightP)), powerSwing: r3(blend(leftP) - blend(rightP)) };
    }
    // History gives the odds a rate is higher after h years and the typical
    // size of a move relative to where the rate stood; the panel shifts the
    // odds where it has spoken and, where it offers a burden multiplier,
    // supplies it directly. The expected rate follows the burden, so the
    // number a client reads is the same one the projection charges them.
    const pHigher = wHist * pUp + (1 - wHist) * ((cons.direction + 1) / 2);
    const histMultiplier = Math.max(0.25, 1 + (2 * pHigher - 1) * relMove);
    const burden = cons.burdenMultiplier != null ? wHist * histMultiplier + (1 - wHist) * cons.burdenMultiplier : histMultiplier;
    const topRate = clamp(current * burden, 10, 94);
    const expected = topRate - current;
    const dispersion = hist.stdevChange / Math.max(1, Math.abs(current));
    const histConf = 1 / (1 + dispersion * 2);
    const panelConf = cons.coverage * cons.agreement;
    // A panel where most members have not spoken yet cannot be fully confident.
    const completeness = input.allPanelWeight && input.allPanelWeight > 0 ? Math.min(1, input.totalPanelWeight / input.allPanelWeight) : 1;
    const confidence = clamp((wHist * histConf + (1 - wHist) * panelConf) * (0.5 + 0.5 * completeness), 0, 1);
    return { horizonYears: h, year: input.startYear + h, history: hist, consensus: cons, pHigher: r3(pHigher), expectedChangePoints: r3(expected), expectedTopRate: r3(topRate), burdenMultiplier: r3(burden), confidence: r3(confidence), weightOnHistory: r3(wHist), power };
  });
}

/** Linear interpolation of the burden multiplier for a year between horizons (1.0 at year 0). */
export function burdenAt(traj: TrajectoryPoint[], yearsOut: number): number {
  if (yearsOut <= 0) return 1;
  let prev = { y: 0, m: 1 };
  for (const p of traj) {
    if (yearsOut <= p.horizonYears) {
      const t = (yearsOut - prev.y) / (p.horizonYears - prev.y);
      return prev.m + t * (p.burdenMultiplier - prev.m);
    }
    prev = { y: p.horizonYears, m: p.burdenMultiplier };
  }
  return prev.m;
}

// ─── Inflation ladder ────────────────────────────────────────────────────────
export const LADDER_YEARS = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40] as const;

export type CategoryRates = { id: string; label: string; asOf: string; rates: Partial<Record<(typeof LADDER_YEARS)[number], number>> };

/** Compound annual rate between two index levels n years apart. */
export function annualised(startLevel: number, endLevel: number, years: number): number {
  if (startLevel <= 0 || endLevel <= 0 || years <= 0) return NaN;
  return r4((endLevel / startLevel) ** (1 / years) - 1);
}

/** What a dollar today buys after n years at rate i. */
export function purchasingPower(rate: number, years: number): number {
  return r4(1 / (1 + rate) ** years);
}

/** The nominal return needed to grow purchasing power by `realTarget` after inflation `i` and tax `t` on the growth. */
export function hurdleRate(realTarget: number, inflation: number, taxOnGrowth: number): number {
  if (taxOnGrowth >= 1) return NaN;
  return r4(((1 + realTarget) * (1 + inflation) - 1) / (1 - taxOnGrowth));
}

export type BasketItem = { categoryId: string; weight: number };

/** The client's own inflation rate: category rates weighted by what they actually spend on. */
export function basketRate(items: BasketItem[], categories: CategoryRates[], years: (typeof LADDER_YEARS)[number]): { rate: number | null; covered: number } {
  let num = 0, den = 0, covered = 0;
  for (const it of items) {
    const c = categories.find((x) => x.id === it.categoryId);
    const r = c?.rates[years];
    if (r == null || !Number.isFinite(r) || it.weight <= 0) continue;
    num += it.weight * r; den += it.weight; covered += it.weight;
  }
  const total = items.reduce((s, it) => s + Math.max(0, it.weight), 0);
  return { rate: den > 0 ? r4(num / den) : null, covered: total > 0 ? r3(covered / total) : 0 };
}

// ─── Two projections ─────────────────────────────────────────────────────────
export type ProjectionInput = {
  startYear: number;
  years: number;              // default 40
  income: number;             // gross income today
  incomeGrowth: number;       // nominal, e.g. 0.03
  filing: FilingKey;
  savingsRate: number;        // share of after-tax income saved, e.g. 0.20
  savings: number;            // starting invested assets
  nominalReturn: number;      // on savings, e.g. 0.07
  taxOnGrowth: number;        // effective rate on investment growth, e.g. 0.25
  inflation: number;          // the client's basket rate (or CPI), e.g. 0.03
  bracketIndexation?: number; // how brackets index, default = inflation
  rules?: TaxRuleSet;
  trajectory: TrajectoryPoint[];
};

export type ProjectionYear = {
  year: number; t: number;
  income: number; effectiveRate: number; federalTax: number; afterTax: number; saved: number; wealth: number;
  realAfterTax: number; realWealth: number; burdenMultiplier: number;
};

export type Projection = { label: string; years: ProjectionYear[]; at: Record<number, ProjectionYear> };

export function project(input: ProjectionInput, alternate: boolean): Projection {
  const rules = input.rules ?? currentRules(new Date(input.startYear, 0, 1));
  const idx = input.bracketIndexation ?? input.inflation;
  let income = input.income, wealth = input.savings;
  const years: ProjectionYear[] = [];
  for (let t = 0; t <= input.years; t += 1) {
    const year = input.startYear + t;
    // Current law: brackets and deductions index; express income in start-year dollars for the rule set.
    const deflated = income / (1 + idx) ** t;
    const pic = computeTaxPicture({ filing: input.filing, agi: deflated }, rules);
    const baseRate = deflated > 0 ? pic.federalTax / deflated : 0;
    const mult = alternate ? burdenAt(input.trajectory, t) : 1;
    const effectiveRate = clamp(baseRate * mult, 0, 0.9);
    const federalTax = income * effectiveRate;
    const afterTax = income - federalTax;
    const saved = afterTax * input.savingsRate;
    if (t > 0) wealth = wealth * (1 + input.nominalReturn * (1 - input.taxOnGrowth)) + saved;
    const deflator = (1 + input.inflation) ** t;
    years.push({ year, t, income: r0(income), effectiveRate: r4(effectiveRate), federalTax: r0(federalTax), afterTax: r0(afterTax), saved: r0(saved), wealth: r0(wealth), realAfterTax: r0(afterTax / deflator), realWealth: r0(wealth / deflator), burdenMultiplier: r3(mult) });
    income *= 1 + input.incomeGrowth;
  }
  const at: Record<number, ProjectionYear> = {};
  for (const h of HORIZONS) { const y = years.find((x) => x.t === h); if (y) at[h] = y; }
  return { label: alternate ? "Expected tax path" : "Current law", years, at };
}

export type ErosionSummary = {
  baseline: Projection; alternate: Projection;
  realWealthGap: Record<number, number>; // alternate − baseline real wealth at each horizon
  cumulativeExtraTax: number;
  hurdle: { realTarget: number; inflation: number; taxOnGrowth: number; nominalNeeded: number };
  dollarIn40Years: number;
};

export function erosionSummary(input: ProjectionInput, realTarget = 0.03): ErosionSummary {
  const baseline = project(input, false), alternate = project(input, true);
  const gap: Record<number, number> = {};
  for (const h of HORIZONS) if (baseline.at[h] && alternate.at[h]) gap[h] = r0(alternate.at[h]!.realWealth - baseline.at[h]!.realWealth);
  const extra = alternate.years.reduce((s, y, i) => s + (y.federalTax - (baseline.years[i]?.federalTax ?? 0)), 0);
  return {
    baseline, alternate, realWealthGap: gap, cumulativeExtraTax: r0(extra),
    hurdle: { realTarget, inflation: input.inflation, taxOnGrowth: input.taxOnGrowth, nominalNeeded: hurdleRate(realTarget, input.inflation, input.taxOnGrowth) },
    dollarIn40Years: purchasingPower(input.inflation, 40),
  };
}

function clamp(n: number, lo: number, hi: number): number { return Math.min(hi, Math.max(lo, n)); }
function r0(n: number): number { return Math.round(n); }
function r3(n: number): number { return Math.round(n * 1000) / 1000; }
function r4(n: number): number { return Math.round(n * 10_000) / 10_000; }

/** The conditional odds table for the page: P(higher) at every horizon under left / divided / right control, with sample sizes. */
export function conditionalOddsTable(series: YearValue[] = TOP_MARGINAL_RATE, from = 1946) {
  return HORIZONS.map((h) => ({ horizonYears: h, all: windowStats(series, h, from), left: conditionalWindowStats(series, h, "left", from), divided: conditionalWindowStats(series, h, "divided", from), right: conditionalWindowStats(series, h, "right", from), minWindows: MIN_WINDOWS }));
}
