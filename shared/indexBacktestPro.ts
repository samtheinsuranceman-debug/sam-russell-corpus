// ============================================================
// INDEX BACKTEST (PRO) — /portal/index-backtester-pro
//
// Why: the page was a shell. Its two inputs were uncontrolled with
// placeholders, and every tab said "will be displayed here" or
// "Placeholder: Historical Data Loaded for S&P 500". Nothing was computed.
//
// What this computes: an annual point-to-point indexed crediting backtest on
// the S&P 500 PRICE return (indexCreditingData.RAW_INDEX_RETURNS.SP500,
// 1994–2025, ChartRow, reconciled to carrier-published 30-year figures by
// shared/sp500SeriesAudit.ts). Price, not total return, because indexed
// crediting tracks the index level and pays no dividends.
//
//   credited = max(floor, min(cap, participation × (raw − spread)))
//
// with cap, floor, participation and spread as the user's inputs (they are
// product terms, not published facts; the page labels them). Years outside
// the sourced series are reported as unavailable, never filled with zero.
//
// PORT STEPS: pure module; imports indexCreditingData and sp500SeriesAudit.
// Test: server/a25Calculators.test.ts.
// ============================================================

import { RAW_INDEX_RETURNS, INDEX_RETURN_SOURCES, MIN_YEAR, MAX_YEAR, ALL_INDEX_OPTIONS, getCreditingHistory, type IndexOption } from "./indexCreditingData";
import { UNSOURCED_SERIES } from "./sp500SeriesAudit";

export interface BacktestTerms {
  /** Cap in percent, or null for uncapped. */
  capPct: number | null;
  floorPct: number;
  participationPct: number;
  spreadPct: number;
}

export interface BacktestProInput {
  startYear: number;
  years: number;
  terms: BacktestTerms;
  /** Opening deposit. */
  initial: number;
  /** Deposit at the start of every year, including the first. */
  annualDeposit: number;
}

export interface BacktestProYear {
  year: number;
  indexPriceReturnPct: number;
  creditedPct: number;
  capBound: boolean;
  floorBound: boolean;
  accountValue: number;
  /** Same deposits compounded at the raw price return, for comparison. */
  indexValue: number;
}

export interface BacktestProResult {
  rows: BacktestProYear[];
  /** Years asked for that the sourced series does not cover. */
  unavailableYears: number[];
  deposits: number;
  endingValue: number;
  endingIndexValue: number;
  /** Geometric mean credited rate, percent. */
  geometricCreditedPct: number | null;
  geometricIndexPct: number | null;
  capYears: number;
  floorYears: number;
  source: typeof INDEX_RETURN_SOURCES;
}

export function creditRate(rawPct: number, t: BacktestTerms): { credited: number; capBound: boolean; floorBound: boolean } {
  const adjusted = (t.participationPct / 100) * (rawPct - t.spreadPct);
  const capped = t.capPct == null ? adjusted : Math.min(adjusted, t.capPct);
  const credited = Math.max(t.floorPct, capped);
  return { credited, capBound: t.capPct != null && adjusted > t.capPct, floorBound: capped < t.floorPct };
}

export function runBacktestPro(input: BacktestProInput): BacktestProResult {
  const series = RAW_INDEX_RETURNS.SP500 ?? {};
  const n = Math.max(0, Math.round(input.years));
  const rows: BacktestProYear[] = [];
  const unavailableYears: number[] = [];
  let acct = Math.max(0, input.initial);
  let idx = acct;
  let deposits = acct;
  let growthCredited = 1;
  let growthIndex = 1;
  let capYears = 0;
  let floorYears = 0;

  for (let i = 0; i < n; i++) {
    const year = input.startYear + i;
    const raw = series[year];
    if (raw === undefined) { unavailableYears.push(year); continue; }
    const dep = Math.max(0, input.annualDeposit);
    acct += dep; idx += dep; deposits += dep;
    const c = creditRate(raw, input.terms);
    acct *= 1 + c.credited / 100;
    idx *= 1 + raw / 100;
    growthCredited *= 1 + c.credited / 100;
    growthIndex *= 1 + raw / 100;
    if (c.capBound) capYears++;
    if (c.floorBound) floorYears++;
    rows.push({ year, indexPriceReturnPct: raw, creditedPct: Math.round(c.credited * 100) / 100, capBound: c.capBound, floorBound: c.floorBound, accountValue: Math.round(acct), indexValue: Math.round(idx) });
  }
  const k = rows.length;
  return {
    rows,
    unavailableYears,
    deposits: Math.round(deposits),
    endingValue: Math.round(acct),
    endingIndexValue: Math.round(idx),
    geometricCreditedPct: k ? Math.round((Math.pow(growthCredited, 1 / k) - 1) * 10000) / 100 : null,
    geometricIndexPct: k ? Math.round((Math.pow(growthIndex, 1 / k) - 1) * 10000) / 100 : null,
    capYears,
    floorYears,
    source: INDEX_RETURN_SOURCES,
  };
}

/**
 * Trailing-window statistics for one carrier index option, for
 * /portal/index-backtester's option cards (which printed random numbers here).
 * Returns `available: false` with the reason when the option rests on a series
 * this build has not sourced (sp500SeriesAudit.UNSOURCED_SERIES) or on no series.
 */
export type OptionHistoryStats =
  | { available: true; fromYear: number; toYear: number; averageCreditedPct: number; bestCreditedPct: number; bestYear: number; zeroYears: number; basis: string }
  | { available: false; reason: string };

function seriesOf(option: IndexOption): string[] {
  return option.components?.length ? option.components.map(c => c.index) : [option.index];
}

export function optionHistoryStats(optionId: string, windowYears = 10): OptionHistoryStats {
  const option = ALL_INDEX_OPTIONS.find(o => o.id === optionId);
  if (!option) return { available: false, reason: "Option not found in shared/indexCreditingData.ts." };
  if (option.participation === 0) return { available: false, reason: "Fixed account: no index history applies." };
  const series = seriesOf(option);
  const missing = series.filter(s => !RAW_INDEX_RETURNS[s]);
  if (missing.length) return { available: false, reason: `No return series on file for ${missing.join(", ")}.` };
  const unsourced = series.filter(s => (UNSOURCED_SERIES as readonly string[]).includes(s));
  if (unsourced.length) return { available: false, reason: `${unsourced.join(", ")} series is not yet sourced; history not shown.` };
  const toYear = MAX_YEAR;
  const fromYear = Math.max(MIN_YEAR, option.availableFrom ?? MIN_YEAR, toYear - windowYears + 1);
  const h = getCreditingHistory(option, fromYear, toYear);
  if (!h.length) return { available: false, reason: "No years in the window." };
  const best = h.reduce((b, r) => (r.creditedRate > b.creditedRate ? r : b), h[0]!);
  return {
    available: true,
    fromYear,
    toYear,
    averageCreditedPct: Math.round((h.reduce((s, r) => s + r.creditedRate, 0) / h.length) * 100) / 100,
    bestCreditedPct: best.creditedRate,
    bestYear: best.year,
    zeroYears: h.filter(r => r.creditedRate <= 0).length,
    basis: `Arithmetic mean of annual credits, ${fromYear}–${toYear}, on ${INDEX_RETURN_SOURCES.basis}; option terms as held in shared/indexCreditingData.ts${option.sourced ? " (transcribed from a carrier document)" : " (terms not transcribed from a carrier document — illustrative)"}`,
  };
}

/**
 * The same premiums compounded at the S&P 500 price return: the honest benchmark
 * for a backtest chart. Null for a year with no sourced return.
 */
export function sp500PriceBenchmark(years: number[], annualPremium: number): (number | null)[] {
  const series = RAW_INDEX_RETURNS.SP500 ?? {};
  let v = 0;
  let broken = false;
  return years.map(y => {
    const r = series[y];
    if (r === undefined || broken) { broken = true; return null; }
    v = (v + annualPremium) * (1 + r / 100);
    return Math.round(v);
  });
}

export const BACKTEST_FIRST_YEAR = MIN_YEAR;
export const BACKTEST_LAST_YEAR = MAX_YEAR;

export const INDEX_BACKTEST_PRO_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: `S&P 500 calendar-year PRICE return ${INDEX_RETURN_SOURCES.firstYear}–${INDEX_RETURN_SOURCES.lastYear}: ${INDEX_RETURN_SOURCES.perIndex.SP500}`, url: "https://chartrow.com/sp500/returns", asOf: `verified ${INDEX_RETURN_SOURCES.verifiedOn} per shared/indexCreditingData.ts` },
  { label: "Cap, floor, participation and spread are the user's inputs (product terms), not published figures." },
];
