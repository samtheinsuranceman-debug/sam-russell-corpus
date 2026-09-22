// ============================================================
// FORECAST OVERLAY — apply a predictive engine's *current* forecast to any
// calculator's year-by-year projection, as an optional toggle, over 20/30/40
// years. Pure and deterministic: no I/O, no randomness, no vendor. The
// forecast itself comes from the trunk's own predictive modules through
// `forecast.current` (server/forecastRouter.ts) and carries {source, asOf}.
// A page that cannot obtain a forecast shows the base series and the reason;
// it never invents a path. (Page contract rules 4 Sourced, 5 Toggled, 6 Simulated.)
// ============================================================

export type ForecastHorizon = 20 | 30 | 40;

/** One year of a calculator's projection. `value` is whatever the page charts (balance, cash value, net worth). */
export interface ProjectionPoint {
  year: number;
  value: number;
}

/** One year of a predictive engine's current forecast for its domain, as annual growth rates. */
export interface ForecastPoint {
  year: number;
  /** Median annual rate the engine expects (e.g. 0.062 = 6.2%). */
  rate: number;
  /** Optional pessimistic / optimistic annual rates for the band. */
  p10?: number;
  p90?: number;
}

export type ForecastDomain =
  | "equities"        // index crediting, portfolio growth
  | "rates"           // loan rates, MYGA/annuity crediting, benchmarks
  | "inflation"       // real-dollar overlay
  | "housing"         // property appreciation, rents
  | "wages";          // income growth

export interface CurrentForecast {
  domain: ForecastDomain;
  horizonYears: number;
  points: ForecastPoint[];
  /** Where the forecast came from and when: the evidence ledger fields. */
  source: string;
  asOf: string;
  method: string;
  /** Present only when the engine could not produce a forecast; `points` is then empty. */
  unavailableReason?: string;
}

export interface OverlayPoint {
  year: number;
  base: number;
  overlay: number;
  p10: number;
  p90: number;
}

export interface OverlayResult {
  horizonYears: ForecastHorizon;
  applied: boolean;
  reason?: string;
  points: OverlayPoint[];
  /** Cumulative difference at the horizon, overlay minus base. */
  deltaAtHorizon: number;
  ledger: { source: string; asOf: string; method: string } | null;
}

/**
 * The base series' implied annual growth between consecutive points. The overlay
 * replaces that implied growth with the forecast's rate, year by year, so the
 * calculator's own contributions/withdrawals pattern is preserved and only the
 * return assumption changes. Years beyond the base series are extended at the
 * forecast rate from the last base value.
 */
export function impliedGrowth(series: ProjectionPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].value;
    const next = series[i].value;
    out.push(prev > 0 ? next / prev - 1 : 0);
  }
  return out;
}

function rateFor(points: ForecastPoint[], year: number, key: "rate" | "p10" | "p90"): number | undefined {
  const exact = points.find(p => p.year === year);
  if (exact) return exact[key] ?? exact.rate;
  const last = points[points.length - 1];
  if (!last) return undefined;
  return last[key] ?? last.rate;
}

/** Trim or extend a base series to exactly `horizon` years starting at year 1. */
export function normaliseHorizon(series: ProjectionPoint[], horizon: ForecastHorizon): ProjectionPoint[] {
  const sorted = [...series].filter(p => Number.isFinite(p.value)).sort((a, b) => a.year - b.year);
  const trimmed = sorted.filter(p => p.year >= 1 && p.year <= horizon);
  if (trimmed.length === 0) return [];
  const growth = impliedGrowth(trimmed);
  const lastGrowth = growth.length ? growth[growth.length - 1] : 0;
  let last = trimmed[trimmed.length - 1];
  const extended = [...trimmed];
  while (last.year < horizon) {
    last = { year: last.year + 1, value: last.value * (1 + lastGrowth) };
    extended.push(last);
  }
  return extended;
}

export interface OverlayOptions {
  /**
   * The growth assumption the calculator used to build `base` (e.g. 0.06). With it, the
   * calculator's own net flows (contributions minus withdrawals) are isolated year by year
   * and preserved; only the return assumption is swapped for the forecast. Without it the
   * overlay must treat every change in the base as growth (flows = 0), which is honest but
   * cruder; the result says which mode was used.
   */
  baseRate?: number;
}

/**
 * Apply `forecast` to `base` over `horizon` years.
 * - If the forecast is unavailable (no points), returns the base series unchanged with `applied: false` and the reason.
 * - Otherwise each year's growth is replaced by the forecast rate; p10/p90 bands use the forecast's own bands when present.
 */
export function applyForecastOverlay(
  base: ProjectionPoint[],
  forecast: CurrentForecast | null | undefined,
  horizon: ForecastHorizon = 30,
  options: OverlayOptions = {},
): OverlayResult {
  const series = normaliseHorizon(base, horizon);
  if (series.length === 0) {
    return { horizonYears: horizon, applied: false, reason: "no base projection", points: [], deltaAtHorizon: 0, ledger: null };
  }
  if (!forecast || forecast.points.length === 0) {
    const reason = forecast?.unavailableReason ?? "forecast unavailable";
    return {
      horizonYears: horizon,
      applied: false,
      reason,
      points: series.map(p => ({ year: p.year, base: p.value, overlay: p.value, p10: p.value, p90: p.value })),
      deltaAtHorizon: 0,
      ledger: null,
    };
  }

  const points: OverlayPoint[] = [];
  let overlay = series[0].value;
  let low = series[0].value;
  let high = series[0].value;
  points.push({ year: series[0].year, base: series[0].value, overlay, p10: low, p90: high });

  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].value;
    const curr = series[i].value;
    // The calculator's own net flow this year (contributions minus withdrawals):
    // isolated only when the page tells us the growth rate it assumed.
    const implied = prev > 0 ? curr / prev - 1 : 0;
    const flow = options.baseRate === undefined ? 0 : curr - prev * (1 + options.baseRate);
    const year = series[i].year;
    const r = rateFor(forecast.points, year, "rate") ?? implied;
    const r10 = rateFor(forecast.points, year, "p10") ?? r;
    const r90 = rateFor(forecast.points, year, "p90") ?? r;
    overlay = overlay * (1 + r) + flow;
    low = low * (1 + Math.min(r10, r)) + flow;
    high = high * (1 + Math.max(r90, r)) + flow;
    points.push({ year, base: curr, overlay, p10: low, p90: high });
  }

  const last = points[points.length - 1];
  const mode = options.baseRate === undefined ? "flows not isolated (no baseRate supplied)" : "flows preserved";
  return {
    horizonYears: horizon,
    applied: true,
    points,
    deltaAtHorizon: last.overlay - last.base,
    ledger: { source: forecast.source, asOf: forecast.asOf, method: `${forecast.method}; ${mode}` },
  };
}

/** Build a flat forecast (one rate for every year) from a single benchmark, e.g. a FRED series' latest value. */
export function flatForecast(
  domain: ForecastDomain,
  rate: number,
  horizon: ForecastHorizon,
  ledger: { source: string; asOf: string; method: string },
  band?: { p10: number; p90: number },
): CurrentForecast {
  const points: ForecastPoint[] = [];
  for (let y = 1; y <= horizon; y++) points.push({ year: y, rate, p10: band?.p10, p90: band?.p90 });
  return { domain, horizonYears: horizon, points, ...ledger };
}

/** The honest empty forecast: the page shows the base and says why. */
export function unavailableForecast(domain: ForecastDomain, horizon: ForecastHorizon, reason: string): CurrentForecast {
  return { domain, horizonYears: horizon, points: [], source: "", asOf: "", method: "none", unavailableReason: reason };
}
