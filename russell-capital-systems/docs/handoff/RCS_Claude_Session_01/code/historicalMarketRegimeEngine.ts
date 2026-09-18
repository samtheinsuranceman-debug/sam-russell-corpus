// ============================================================
// HISTORICAL MARKET REGIME ENGINE — what the record says, with its sample size.
//
// ## What this is
//
// A front door over the four modules that hold the historical record:
// `powerHistory` (who held the presidency, Senate and House each year since
// 1946), `taxHistory` (top marginal, corporate, long-term capital gains and
// the estate exclusion by year), `historicalShocks` (the four recorded
// drawdowns and what an indexed policy credited through each), and the
// conditional-window statistics that join the first two.
//
// ## The one idea this engine exists to protect
//
// A base rate without its sample size is a guess wearing a number's clothes.
// Every figure this engine returns carries `n` — how many historical windows
// produced it — and a caller that shows the figure without the `n` is
// misrepresenting the record. `REGIME_DISCLOSURE` says so in the words the
// page should use.
//
// The second idea: a regime reading is NOT a forecast. `conditionalOdds`
// answers "of the historical windows where power sat here, how often was the
// rate higher N years later" — a conditional base rate, computed. It does not
// answer "what will happen". Nothing in this file extrapolates.
//
// ## Inflation is deliberately absent from the conditional layer
//
// The tax series supports a conditional reading against political control
// because Congress sets rates. Inflation does not: the Fed, oil and wars move
// prices more than legislation does, and a conditional-on-control inflation
// figure would imply a causal claim the record cannot carry. Inflation is
// available from the erosion engine as history with that caveat attached.
// ============================================================

import {
  CONTROL, POWER_HISTORY_SOURCES, LEVER_WEIGHTS, controlAt, demLeverShare, bucketOf,
  conditionalWindowStats, type Control, type Party, type PowerBucket, type ConditionalWindowStats,
} from './powerHistory';
import {
  TOP_MARGINAL_RATE, TOP_CORPORATE_RATE, MAX_LTCG_RATE, ESTATE_EXCLUSION, TAX_HISTORY_SOURCES,
  valueAt, windowStats, changeEvents, type YearValue, type WindowStats,
} from './taxHistory';
import { SHOCKS, runAllShocks, isAvailable, type ShockWindow, type PolicyTerms } from './historicalShocks';
import { longRunLeverShare } from './erosion';

export type { Control, Party, PowerBucket, ConditionalWindowStats, YearValue, WindowStats, ShockWindow, PolicyTerms };
export {
  CONTROL, POWER_HISTORY_SOURCES, LEVER_WEIGHTS, controlAt, demLeverShare, bucketOf, conditionalWindowStats,
  TOP_MARGINAL_RATE, TOP_CORPORATE_RATE, MAX_LTCG_RATE, ESTATE_EXCLUSION, TAX_HISTORY_SOURCES,
  valueAt, windowStats, changeEvents, SHOCKS, runAllShocks, isAvailable, longRunLeverShare,
};

/** The named series this engine can read a regime against. */
export type SeriesId = 'top-marginal' | 'corporate' | 'ltcg' | 'estate-exclusion';

export const SERIES: Record<SeriesId, { label: string; series: YearValue[]; unit: string }> = {
  'top-marginal': { label: 'Top marginal income tax rate', series: TOP_MARGINAL_RATE, unit: '%' },
  corporate: { label: 'Top corporate rate', series: TOP_CORPORATE_RATE, unit: '%' },
  ltcg: { label: 'Maximum long-term capital gains rate', series: MAX_LTCG_RATE, unit: '%' },
  'estate-exclusion': { label: 'Estate tax exclusion', series: ESTATE_EXCLUSION, unit: '$' },
};

/** Everything the record holds about one year. */
export interface RegimeReading {
  readonly year: number;
  readonly control: (Control & { trifecta: Party | null }) | null;
  /** 0–1: president ½, Senate ¼, House ¼. Null when the year is outside the record. */
  readonly leverShare: number | null;
  readonly bucket: Exclude<PowerBucket, 'all'> | null;
  /** Each series' value that year, where the record has one. */
  readonly rates: Partial<Record<SeriesId, number | null>>;
}

export function regimeAt(year: number): RegimeReading {
  const control = controlAt(year);
  const share = demLeverShare(year);
  const rates: Partial<Record<SeriesId, number | null>> = {};
  for (const id of Object.keys(SERIES) as SeriesId[]) rates[id] = valueAt(SERIES[id].series, year);
  return {
    year,
    control,
    leverShare: share,
    bucket: share === null ? null : bucketOf(share),
    rates,
  };
}

/** A conditional base rate with the sample size that produced it. */
export interface ConditionalOdds {
  readonly series: SeriesId;
  readonly label: string;
  readonly horizonYears: number;
  readonly bucket: PowerBucket;
  /** Share of windows in this bucket where the value was higher after the horizon. Null when no windows. */
  readonly pHigher: number | null;
  /** How many windows. A figure shown without this is a misrepresentation. */
  readonly n: number;
  /** True when n is too small to state — the caller should fall back to unconditional. */
  readonly thin: boolean;
  readonly unconditional: WindowStats;
}

/** Below this, a bucket's base rate is not worth stating on its own. */
export const THIN_SAMPLE = 15;

export function conditionalOdds(
  series: SeriesId,
  horizonYears: number,
  bucket: PowerBucket,
  from = 1946,
): ConditionalOdds {
  const s = SERIES[series];
  // Both stat types are fully typed: the window count is `windows` and the
  // share of windows ending higher is `pUp`. Read them directly — a defensive
  // cast here would silently return 0 windows if a field were ever renamed,
  // and a sample size that silently reads zero is the one failure this engine
  // exists to prevent.
  const c = conditionalWindowStats(s.series, horizonYears, bucket, from);
  const n = c.windows;
  return {
    series,
    label: s.label,
    horizonYears,
    bucket,
    pHigher: n > 0 ? c.pUp : null,
    n,
    thin: n < THIN_SAMPLE,
    unconditional: windowStats(s.series, horizonYears, from),
  };
}

/** The three political buckets side by side at one horizon — the table a page shows. */
export function oddsTable(series: SeriesId, horizonYears: number, from = 1946): ConditionalOdds[] {
  return (['left', 'divided', 'right'] as PowerBucket[]).map((b) => conditionalOdds(series, horizonYears, b, from));
}

/**
 * How much political control alone moves the odds at a horizon: the spread
 * between the left-held and right-held conditional rates. Null when either
 * bucket is too thin to state, which is the honest answer rather than zero.
 */
export function powerSwing(series: SeriesId, horizonYears: number, from = 1946): { swing: number | null; left: ConditionalOdds; right: ConditionalOdds } {
  const left = conditionalOdds(series, horizonYears, 'left', from);
  const right = conditionalOdds(series, horizonYears, 'right', from);
  const swing = left.thin || right.thin || left.pHigher === null || right.pHigher === null
    ? null
    : Math.round((left.pHigher - right.pHigher) * 1000) / 1000;
  return { swing, left, right };
}

/** Every recorded shock, with an indexed policy's credit through each when terms are supplied. */
export function shockReplay(terms?: PolicyTerms) {
  return terms ? runAllShocks(terms) : SHOCKS;
}

/** The record's own coverage, so a page can state what it does and does not hold. */
export function coverage(): { firstYear: number | null; lastYear: number | null; years: number; shocks: number; sources: number } {
  const years = CONTROL.map((c) => c.year).filter((y) => Number.isFinite(y));
  return {
    firstYear: years.length ? Math.min(...years) : null,
    lastYear: years.length ? Math.max(...years) : null,
    years: years.length,
    shocks: SHOCKS.length,
    sources: POWER_HISTORY_SOURCES.length + TAX_HISTORY_SOURCES.length,
  };
}

export const REGIME_DISCLOSURE =
  'These are conditional base rates computed from the record since 1946, not forecasts. Each one answers "of the historical windows in which power sat this way, how often was the rate higher N years later" — and each carries the number of windows behind it. A figure shown without its sample size misrepresents the record, and a bucket with fewer than fifteen windows is reported as thin rather than stated as a rate. Inflation is deliberately excluded from the conditional layer: the Fed, oil and wars move prices more than legislation does, and a conditional-on-control inflation figure would assert a causal claim the record cannot carry.';
