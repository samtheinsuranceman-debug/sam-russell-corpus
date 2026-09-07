// ============================================================
// THE ZIP ENGINE — what it has really cost to own a home in one zip code
// since the record began, and what the same record says about the years
// ahead. Pure functions over annual series; the server feeds them from
// published files (FHFA house price index by five-digit zip, Zillow home
// value and rent indexes by zip, Freddie Mac's mortgage survey on FRED) and
// stamps every figure with its source and as-of date.
//
// Design rules (the owner's):
//   - Every zip on record is kept. A "cohort" is a filter applied at query
//     time: the zips whose median home value at the START of the selected
//     window was at least the threshold (default $100,000).
//   - The start year is the client's choice. A slider from the earliest year
//     on record to last year re-averages everything from that year, so
//     "since COVID" is one motion, and the projection forward uses the rate
//     of the window the client picked. The window is printed with the figure.
//   - Dollar levels before Zillow's record (2000) are back-cast from the
//     FHFA index: level(y) = level(2000) × HPI(y) / HPI(2000). The method is
//     named wherever a back-cast figure is shown.
//   - Nothing is estimated where the record is blank. A missing year is
//     null and the statistics skip it; a zip with no record says so.
// ============================================================

/** One value per calendar year from `startYear`; null where the source is blank. */
export type AnnualSeries = { startYear: number; values: Array<number | null> };

export function valueAt(s: AnnualSeries | null | undefined, year: number): number | null {
  if (!s) return null;
  const i = year - s.startYear;
  if (i < 0 || i >= s.values.length) return null;
  const v = s.values[i];
  return v == null || !Number.isFinite(v) ? null : v;
}
export function firstYear(s: AnnualSeries): number | null { const i = s.values.findIndex((v) => v != null); return i < 0 ? null : s.startYear + i; }
export function lastYear(s: AnnualSeries): number | null { for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] != null) return s.startYear + i; return null; }
export function years(s: AnnualSeries): number[] { return s.values.map((_, i) => s.startYear + i); }

/** Monthly observations ("YYYY-MM" or "YYYY-MM-DD" → value) folded to one value per year: the last month published in that year. */
export function annualFromMonthly(monthly: Record<string, number | null | undefined>): AnnualSeries | null {
  const byYear = new Map<number, { month: string; value: number }>();
  for (const [k, v] of Object.entries(monthly)) {
    if (v == null || !Number.isFinite(v)) continue;
    const y = Number(k.slice(0, 4));
    if (!Number.isFinite(y)) continue;
    const cur = byYear.get(y);
    if (!cur || k > cur.month) byYear.set(y, { month: k, value: v });
  }
  if (!byYear.size) return null;
  const ys = Array.from(byYear.keys()).sort((a, b) => a - b);
  const start = ys[0]!, end = ys[ys.length - 1]!;
  const values: Array<number | null> = [];
  for (let y = start; y <= end; y++) values.push(byYear.get(y)?.value ?? null);
  return { startYear: start, values };
}

/** Year-over-year change for every year that has a value and a prior value. */
export function annualAppreciation(s: AnnualSeries): Array<{ year: number; pct: number }> {
  const out: Array<{ year: number; pct: number }> = [];
  for (let i = 1; i < s.values.length; i++) {
    const a = s.values[i - 1], b = s.values[i];
    if (a == null || b == null || a <= 0) continue;
    out.push({ year: s.startYear + i, pct: b / a - 1 });
  }
  return out;
}

/** Compounded annual rate between two years of the series; null when either end is blank. */
export function windowRate(s: AnnualSeries | null | undefined, fromYear: number, toYear?: number): { rate: number; from: number; to: number } | null {
  if (!s) return null;
  const to = toYear ?? lastYear(s);
  if (to == null) return null;
  const a = valueAt(s, fromYear), b = valueAt(s, to);
  if (a == null || b == null || a <= 0 || to <= fromYear) return null;
  return { rate: Math.pow(b / a, 1 / (to - fromYear)) - 1, from: fromYear, to };
}

/** The standard look-backs from the last year on record. */
export function lookbackRates(s: AnnualSeries | null | undefined, spans: number[] = [5, 10, 20, 30]): Record<number, number | null> {
  const out: Record<number, number | null> = {};
  const end = s ? lastYear(s) : null;
  for (const n of spans) out[n] = end == null ? null : (windowRate(s, end - n, end)?.rate ?? null);
  return out;
}

/** The deepest peak-to-trough fall from `fromYear` on: the 2008 test. */
export function worstDrawdown(s: AnnualSeries, fromYear?: number): { peakYear: number; troughYear: number; drawdown: number } | null {
  let peak: { year: number; value: number } | null = null;
  let worst: { peakYear: number; troughYear: number; drawdown: number } | null = null;
  for (let i = 0; i < s.values.length; i++) {
    const y = s.startYear + i, v = s.values[i];
    if (v == null || (fromYear != null && y < fromYear)) continue;
    if (!peak || v > peak.value) { peak = { year: y, value: v }; continue; }
    const dd = v / peak.value - 1;
    if (!worst || dd < worst.drawdown) worst = { peakYear: peak.year, troughYear: y, drawdown: dd };
  }
  return worst;
}

/** Carry the series forward at the selected window's rate. Labelled a projection wherever it is drawn. */
export function projectForward(s: AnnualSeries, fromYear: number, yearsAhead: number): { rate: number; window: { from: number; to: number }; points: Array<{ year: number; value: number }> } | null {
  const w = windowRate(s, fromYear);
  const last = lastYear(s);
  if (!w || last == null) return null;
  const base = valueAt(s, last)!;
  const points: Array<{ year: number; value: number }> = [];
  for (let k = 1; k <= yearsAhead; k++) points.push({ year: last + k, value: base * Math.pow(1 + w.rate, k) });
  return { rate: w.rate, window: { from: w.from, to: w.to }, points };
}

/**
 * Dollar levels for every year the index covers: Zillow's median where it
 * exists, and before that the FHFA index scaled to Zillow's first year.
 * `method` says which years are back-cast so the page can label them.
 */
export function backcastLevels(zhvi: AnnualSeries | null, hpi: AnnualSeries | null): { levels: AnnualSeries; backcastThrough: number | null; anchorYear: number | null } | null {
  if (!zhvi && !hpi) return null;
  if (!zhvi) return null; // an index alone has no dollar level to anchor
  const anchor = firstYear(zhvi);
  if (anchor == null) return null;
  const anchorLevel = valueAt(zhvi, anchor)!;
  const anchorIdx = hpi ? valueAt(hpi, anchor) : null;
  if (!hpi || anchorIdx == null || anchorIdx <= 0) return { levels: zhvi, backcastThrough: null, anchorYear: anchor };
  const start = Math.min(zhvi.startYear, hpi.startYear);
  const end = Math.max(zhvi.startYear + zhvi.values.length - 1, hpi.startYear + hpi.values.length - 1);
  const values: Array<number | null> = [];
  let backcastThrough: number | null = null;
  for (let y = start; y <= end; y++) {
    const z = valueAt(zhvi, y);
    if (z != null) { values.push(z); continue; }
    const h = y < anchor ? valueAt(hpi, y) : null;
    if (h != null) { values.push(anchorLevel * (h / anchorIdx)); backcastThrough = y; continue; }
    values.push(null);
  }
  return { levels: { startYear: start, values }, backcastThrough, anchorYear: anchor };
}

/** The zips whose level at the start of the window was at least the threshold. */
export function cohortMembers(levelsByZip: Map<string, AnnualSeries>, threshold: number, startYear: number): string[] {
  const out: string[] = [];
  levelsByZip.forEach((s, zip) => { const v = valueAt(s, startYear); if (v != null && v >= threshold) out.push(zip); });
  return out.sort();
}

export function median(xs: number[]): number | null {
  const a = xs.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m]! : (a[m - 1]! + a[m]!) / 2;
}

export type CohortSummary = { threshold: number; startYear: number; members: number; windowRate: number | null; lookback: Record<number, number | null>; worstDrawdown: number | null; sample: { windowRate: number; lookback: number } };

/** The cohort's typical experience: medians across members, with the sample size each figure rests on. */
export function cohortSummary(levelsByZip: Map<string, AnnualSeries>, threshold: number, startYear: number, spans: number[] = [5, 10, 20, 30]): CohortSummary {
  const members = cohortMembers(levelsByZip, threshold, startYear);
  const wr: number[] = [], dd: number[] = [];
  const lb: Record<number, number[]> = Object.fromEntries(spans.map((n) => [n, []]));
  for (const zip of members) {
    const s = levelsByZip.get(zip)!;
    const w = windowRate(s, startYear); if (w) wr.push(w.rate);
    const d = worstDrawdown(s, startYear); if (d) dd.push(d.drawdown);
    const r = lookbackRates(s, spans); for (const n of spans) if (r[n] != null) lb[n]!.push(r[n]!);
  }
  return { threshold, startYear, members: members.length, windowRate: median(wr), lookback: Object.fromEntries(spans.map((n) => [n, median(lb[n]!)])), worstDrawdown: median(dd), sample: { windowRate: wr.length, lookback: Math.min(...spans.map((n) => lb[n]!.length)) } };
}

// ─── The true cost of the loan ───────────────────────────────────────────────
/** Fully amortised 30-year loan at an annual rate: the payment and the interest actually paid if every payment is made. */
export function amortisation(principal: number, annualRatePct: number, termYears = 30): { monthlyPayment: number; totalPaid: number; totalInterest: number } {
  const n = termYears * 12, r = annualRatePct / 100 / 12;
  if (principal <= 0) return { monthlyPayment: 0, totalPaid: 0, totalInterest: 0 };
  const payment = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  const totalPaid = payment * n;
  return { monthlyPayment: payment, totalPaid, totalInterest: totalPaid - principal };
}

export type InterestSheetRow = { year: number; price: number; ratePct: number; downPct: number; principal: number; monthlyPayment: number; totalInterest: number; interestToPrice: number; backcast: boolean };

/** Year by year: the zip's median price, that year's average 30-year rate, and what the loan costs over its life. */
export function interestSheet(levels: AnnualSeries, pmmsByYear: AnnualSeries, opts: { fromYear: number; downPct?: number; backcastThrough?: number | null }): InterestSheetRow[] {
  const down = opts.downPct ?? 20;
  const out: InterestSheetRow[] = [];
  const end = lastYear(levels);
  if (end == null) return out;
  for (let y = opts.fromYear; y <= end; y++) {
    const price = valueAt(levels, y), rate = valueAt(pmmsByYear, y);
    if (price == null || rate == null) continue;
    const principal = price * (1 - down / 100);
    const a = amortisation(principal, rate);
    out.push({ year: y, price, ratePct: rate, downPct: down, principal, monthlyPayment: a.monthlyPayment, totalInterest: a.totalInterest, interestToPrice: a.totalInterest / price, backcast: opts.backcastThrough != null && y <= opts.backcastThrough });
  }
  return out;
}

/** Weekly or monthly rate observations folded to the calendar-year average (how Freddie Mac itself reports annual PMMS). */
export function annualAverage(obs: Array<{ date: string; value: number }>): AnnualSeries | null {
  const sums = new Map<number, { s: number; n: number }>();
  for (const o of obs) { const y = Number(o.date.slice(0, 4)); if (!Number.isFinite(y) || !Number.isFinite(o.value)) continue; const c = sums.get(y) ?? { s: 0, n: 0 }; c.s += o.value; c.n += 1; sums.set(y, c); }
  if (!sums.size) return null;
  const ys = Array.from(sums.keys()).sort((a, b) => a - b);
  const values: Array<number | null> = [];
  for (let y = ys[0]!; y <= ys[ys.length - 1]!; y++) { const c = sums.get(y); values.push(c ? c.s / c.n : null); }
  return { startYear: ys[0]!, values };
}

/** What one zip's record says, for the window the client chose. */
export type ZipReport = {
  zip: string;
  window: { from: number; to: number } | null;
  levels: AnnualSeries | null;
  backcastThrough: number | null;
  anchorYear: number | null;
  hpi: AnnualSeries | null;
  rent: AnnualSeries | null;
  appreciation: Array<{ year: number; pct: number }>;
  windowRate: number | null;
  lookback: Record<number, number | null>;
  worstDrawdown: { peakYear: number; troughYear: number; drawdown: number } | null;
  projection: { rate: number; window: { from: number; to: number }; points: Array<{ year: number; value: number }> } | null;
  rentWindowRate: number | null;
  inCohort: boolean | null;
};

export function zipReport(zip: string, src: { zhvi: AnnualSeries | null; hpi: AnnualSeries | null; rent: AnnualSeries | null }, opts: { startYear: number; threshold: number; yearsAhead?: number }): ZipReport {
  const bc = backcastLevels(src.zhvi, src.hpi);
  const levels = bc?.levels ?? null;
  const w = windowRate(levels, opts.startYear);
  const startLevel = valueAt(levels, opts.startYear);
  return {
    zip,
    window: w ? { from: w.from, to: w.to } : null,
    levels, backcastThrough: bc?.backcastThrough ?? null, anchorYear: bc?.anchorYear ?? null,
    hpi: src.hpi, rent: src.rent,
    appreciation: levels ? annualAppreciation(levels).filter((a) => a.year > opts.startYear) : [],
    windowRate: w?.rate ?? null,
    lookback: lookbackRates(levels),
    worstDrawdown: levels ? worstDrawdown(levels, opts.startYear) : null,
    projection: levels ? projectForward(levels, opts.startYear, opts.yearsAhead ?? 10) : null,
    rentWindowRate: windowRate(src.rent, Math.max(opts.startYear, src.rent ? (firstYear(src.rent) ?? opts.startYear) : opts.startYear))?.rate ?? null,
    inCohort: startLevel == null ? null : startLevel >= opts.threshold,
  };
}

export const ZIP_SOURCES = [
  { id: "hpi", name: "FHFA House Price Index, five-digit ZIP codes (annual, developmental, not seasonally adjusted)", url: "https://www.fhfa.gov/hpi/download/annual/hpi_at_zip5.xlsx", publisher: "Federal Housing Finance Agency", note: "An index (not dollars). Repeat-sales method; zips with too few sales are absent. Some zips run from the 1970s, most from the 1990s." },
  { id: "zhvi", name: "Zillow Home Value Index by ZIP (all homes, mid-tier, smoothed, seasonally adjusted, monthly)", url: "https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv", publisher: "Zillow Research", note: "Typical home value in dollars, January 2000 onward, about 26,000 zips. The year's figure here is the last month published in that year." },
  { id: "zori", name: "Zillow Observed Rent Index by ZIP (all homes plus multifamily, smoothed, monthly)", url: "https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv", publisher: "Zillow Research", note: "Typical asking rent for a whole unit, 2015 onward, about 8,400 zips where listings are dense. Per-room and basement rents have no public zip record." },
  { id: "pmms", name: "30-year fixed mortgage rate, Freddie Mac Primary Mortgage Market Survey (weekly, national)", url: "https://fred.stlouisfed.org/series/MORTGAGE30US", publisher: "Freddie Mac via FRED", note: "National average; there is no zip-level rate series. The year's figure is the average of the year's weekly readings." },
] as const;
export type ZipSourceId = (typeof ZIP_SOURCES)[number]["id"];

export const DEFAULT_THRESHOLD = 100_000;
export const COHORT_THRESHOLDS = [100_000, 200_000, 300_000, 500_000, 750_000, 1_000_000] as const;
