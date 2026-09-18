// ============================================================
// THE RENTAL-MARKET ENGINE — what the public record says a home in one place has
// rented for, cost in tax, and how often its tenants were taken to court; and what
// the same record implies for the years ahead. Pure functions over annual series.
//
// Every figure returned carries its source, as-of date and window. Where the record
// is blank the value is null and the reason is stated — nothing is estimated where
// no public series exists. In particular:
//   - Rents by BEDROOM count are real (HUD FMR 1983→ by county/metro; Small Area FMR
//     by zip 2018→; ACS 2009→ by ZCTA). Rents by BATHROOM count are NOT: no public
//     national source splits rent that way, so `bathrooms` is accepted, echoed, and
//     answered with null + reason.
//   - Security deposits have no public time series. They are governed by state
//     statute (caps in months of rent, interest, return deadlines) — a rules table,
//     not a history. Not modelled here.
//   - Evictions exist as a national public series only for 2000–2018 (Eviction Lab,
//     county); earlier years do not exist in any public dataset.
// ============================================================

export type AnnualSeries = { startYear: number; values: Array<number | null> };
export type Evidence = { source: string; asOf: string; window: { from: number; to: number } | null; method: string };
export type Figure<T> = { value: T; evidence: Evidence; reason?: string };

export type Bedrooms = "0" | "1" | "2" | "3" | "4" | "5+";
export type Bathrooms = number; // accepted for the configuration matrix; never used to compute
export const BEDROOM_CONFIGS: readonly Bedrooms[] = ["0", "1", "2", "3", "4", "5+"];
export const NO_BATHROOM_SOURCE = "No public national dataset splits residential rent by bathroom count (HUD FMR, ACS and Zillow report by bedrooms only). Reported as null rather than estimated.";

export function valueAt(s: AnnualSeries | null | undefined, year: number): number | null {
  if (!s) return null;
  const i = year - s.startYear;
  return i >= 0 && i < s.values.length ? s.values[i] ?? null : null;
}
export function windowOf(s: AnnualSeries | null | undefined): { from: number; to: number } | null {
  if (!s) return null;
  let a = -1, b = -1;
  s.values.forEach((v, i) => { if (v != null) { if (a < 0) a = i; b = i; } });
  return a < 0 ? null : { from: s.startYear + a, to: s.startYear + b };
}
/** Annual growth rates between consecutive non-null years; null where either side is blank. */
export function growthRates(s: AnnualSeries): Array<number | null> {
  const out: Array<number | null> = [];
  for (let i = 1; i < s.values.length; i++) {
    const a = s.values[i - 1], b = s.values[i];
    out.push(a != null && b != null && a > 0 ? b / a - 1 : null);
  }
  return out;
}
/** Compound annual growth over the non-null window; null when fewer than two points. */
export function cagr(s: AnnualSeries): number | null {
  const w = windowOf(s); if (!w || w.to <= w.from) return null;
  const a = valueAt(s, w.from)!, b = valueAt(s, w.to)!;
  return a > 0 ? Math.pow(b / a, 1 / (w.to - w.from)) - 1 : null;
}
/** Worst rolling N-year CAGR in the record — the number a projection must survive. */
export function worstRollingCagr(s: AnnualSeries, years: number): { rate: number; from: number } | null {
  let worst: { rate: number; from: number } | null = null;
  for (let y = s.startYear; y + years <= s.startYear + s.values.length - 1; y++) {
    const a = valueAt(s, y), b = valueAt(s, y + years);
    if (a == null || b == null || a <= 0) continue;
    const r = Math.pow(b / a, 1 / years) - 1;
    if (!worst || r < worst.rate) worst = { rate: r, from: y };
  }
  return worst;
}

/** Block-bootstrap resample of an annual growth series: contiguous blocks preserve autocorrelation. Deterministic for a given seed. */
export function blockBootstrapPaths(rates: number[], horizon: number, paths: number, seed = 42, block = 5): number[][] {
  let x = seed >>> 0;
  const rnd = () => { x = (x + 0x6D2B79F5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out: number[][] = [];
  if (rates.length === 0) return out;
  for (let p = 0; p < paths; p++) {
    const path: number[] = [];
    while (path.length < horizon) {
      const start = Math.floor(rnd() * rates.length);
      for (let k = 0; k < block && path.length < horizon; k++) path.push(rates[(start + k) % rates.length]);
    }
    out.push(path);
  }
  return out;
}
export function percentilePath(paths: number[][], q: number): number[] {
  if (paths.length === 0) return [];
  const h = paths[0].length, out: number[] = [];
  for (let i = 0; i < h; i++) {
    const col = paths.map((p) => p[i]).sort((a, b) => a - b);
    out.push(col[Math.min(col.length - 1, Math.max(0, Math.floor(q * (col.length - 1))))]);
  }
  return out;
}

// ─── Rents by configuration ─────────────────────────────────────────────────
export interface RentSeriesSet { fmr?: Partial<Record<Bedrooms, AnnualSeries>>; safmr?: Partial<Record<Bedrooms, AnnualSeries>>; acs?: Partial<Record<Bedrooms, AnnualSeries>>; sources: Record<string, { url: string; asOf: string }> }

/** Rent for a bedroom/bathroom configuration. Bedrooms resolve from the finest source with a value; bathrooms are echoed and answered with null. */
export function rentByConfiguration(set: RentSeriesSet, bedrooms: Bedrooms, bathrooms: Bathrooms | null, year: number):
  { bedrooms: Bedrooms; bathrooms: Bathrooms | null; monthlyRent: Figure<number | null>; bathroomAdjustment: Figure<null> } {
  const order: Array<["safmr" | "fmr" | "acs", string]> = [["safmr", "HUD Small Area FMR (zip)"], ["acs", "Census ACS B25031 (ZCTA, 5-yr)"], ["fmr", "HUD FMR (county/metro)"]];
  for (const [k, label] of order) {
    const s = set[k]?.[bedrooms]; const v = valueAt(s, year);
    if (v != null) return { bedrooms, bathrooms, monthlyRent: { value: v, evidence: { source: `${label}: ${set.sources[k]?.url ?? ""}`, asOf: set.sources[k]?.asOf ?? "", window: windowOf(s), method: "reported value for the year, finest geography first" } },
      bathroomAdjustment: { value: null, evidence: { source: "none", asOf: "", window: null, method: "not computed" }, reason: NO_BATHROOM_SOURCE } };
  }
  return { bedrooms, bathrooms, monthlyRent: { value: null, evidence: { source: "none", asOf: "", window: null, method: "no source has a value for this geography, bedroom count and year" }, reason: "blank in every public series" },
    bathroomAdjustment: { value: null, evidence: { source: "none", asOf: "", window: null, method: "not computed" }, reason: NO_BATHROOM_SOURCE } };
}

/** Full configuration matrix for a place and year: every bedroom count × the requested bathroom counts (bathrooms always null, by design). */
export function configurationMatrix(set: RentSeriesSet, year: number, bathroomCounts: number[] = [1, 2, 3, 4, 5]) {
  const rows: ReturnType<typeof rentByConfiguration>[] = [];
  for (const b of BEDROOM_CONFIGS) for (const ba of bathroomCounts) rows.push(rentByConfiguration(set, b, ba, year));
  return rows;
}

// ─── Property tax, evictions, tenure, money ──────────────────────────────────
/** Effective property-tax rate path (tax ÷ value) for projection years, from ACS median tax and a value series; carries the last observed rate forward. */
export function propertyTaxRatePath(tax: AnnualSeries | null, value: AnnualSeries | null, horizon: number): Figure<number[] | null> {
  if (!tax || !value) return { value: null, evidence: { source: "Census ACS B25103 / B25077", asOf: "", window: null, method: "unavailable" }, reason: "no ACS tax or value series for this geography" };
  const rates: number[] = [];
  for (let y = tax.startYear; y < tax.startYear + tax.values.length; y++) { const t = valueAt(tax, y), v = valueAt(value, y); if (t != null && v != null && v > 0) rates.push(t / v); }
  if (rates.length === 0) return { value: null, evidence: { source: "Census ACS", asOf: "", window: null, method: "unavailable" }, reason: "no overlapping tax and value years" };
  const last = rates[rates.length - 1]; const drift = rates.length > 1 ? (rates[rates.length - 1] - rates[0]) / (rates.length - 1) : 0;
  const path = Array.from({ length: horizon }, (_, i) => Math.max(0, last + drift * (i + 1)));
  return { value: path, evidence: { source: "Census ACS 5-yr B25103 (median real-estate tax) ÷ B25077 (median value)", asOf: String(tax.startYear + tax.values.length - 1), window: windowOf(tax), method: `effective rate ${(last * 100).toFixed(2)}% carried forward with the observed drift of ${(drift * 10000).toFixed(1)} bp/yr` } };
}

export interface EvictionSet { filings?: AnnualSeries; judgments?: AnnualSeries; filingRate?: AnnualSeries; evictionRate?: AnnualSeries; renterHouseholds?: AnnualSeries; lowFlag?: boolean; source: { url: string; asOf: string } }
/** Eviction exposure for a county: the share of renter households sued (filing rate) and removed (eviction rate), with the record's own window and its low-count flag. */
export function evictionRisk(e: EvictionSet | null): { filingRate: Figure<number | null>; evictionRate: Figure<number | null>; ownersSuingShare: Figure<number | null>; window: { from: number; to: number } | null } {
  const none = (why: string): Figure<number | null> => ({ value: null, evidence: { source: "Eviction Lab (Princeton)", asOf: "", window: null, method: "unavailable" }, reason: why });
  if (!e) return { filingRate: none("no county series"), evictionRate: none("no county series"), ownersSuingShare: none("no county series"), window: null };
  const w = windowOf(e.filingRate ?? e.filings ?? null);
  const last = (s?: AnnualSeries) => { const ww = windowOf(s); return ww ? valueAt(s, ww.to) : null; };
  const ev = (m: string): Evidence => ({ source: `Eviction Lab: ${e.source.url}`, asOf: e.source.asOf, window: w, method: m + (e.lowFlag ? " — county flagged as likely undercounted" : "") });
  const fr = last(e.filingRate), er = last(e.evictionRate);
  return {
    filingRate: fr == null ? none("no filing-rate value") : { value: fr / 100, evidence: ev("eviction filings per renter household, last year in the record") },
    evictionRate: er == null ? none("no eviction-rate value") : { value: er / 100, evidence: ev("eviction judgments (single address per year) per renter household, last year in the record") },
    ownersSuingShare: fr == null ? none("no filing-rate value") : { value: fr / 100, evidence: ev("share of renter households that received at least one filing — the same quantity as the filing rate; a filing is a landlord suing a tenant") },
    window: w,
  };
}

/** Monetary-inflation overlay: CPI rent-of-primary-residence growth, with M2 growth beside it as the money-printing lens. Not blended — both are returned. */
export function monetaryOverlay(cpiRent: AnnualSeries | null, m2: AnnualSeries | null, horizon: number): { cpiPath: Figure<number[] | null>; m2Path: Figure<number[] | null> } {
  const mk = (s: AnnualSeries | null, label: string): Figure<number[] | null> => {
    if (!s) return { value: null, evidence: { source: label, asOf: "", window: null, method: "unavailable" }, reason: "series not loaded" };
    const r = growthRates(s).filter((x): x is number => x != null);
    if (r.length < 5) return { value: null, evidence: { source: label, asOf: "", window: windowOf(s), method: "unavailable" }, reason: "fewer than five growth observations" };
    const p10 = percentilePath(blockBootstrapPaths(r, horizon, 2000), 0.5);
    return { value: p10, evidence: { source: label, asOf: String(s.startYear + s.values.length - 1), window: windowOf(s), method: "median of 2,000 block-bootstrap paths over the recorded annual growth rates (5-year blocks)" } };
  };
  return { cpiPath: mk(cpiRent, "FRED CUSR0000SEHA — CPI rent of primary residence, 1947→"), m2Path: mk(m2, "FRED M2SL — M2 money stock, 1959→") };
}

/** Appreciation path for the mortgage engine from a zip value series: median, and the worst decile, of block-bootstrap paths over the recorded annual growth. */
export function appreciationPaths(value: AnnualSeries | null, horizon: number, paths = 10000): { median: number[] | null; p10: number[] | null; p90: number[] | null; evidence: Evidence; reason?: string } {
  const ev = (m: string): Evidence => ({ source: "FHFA HPI (zip5) back-cast to Zillow ZHVI levels — zip_series", asOf: value ? String(value.startYear + value.values.length - 1) : "", window: windowOf(value), method: m });
  if (!value) return { median: null, p10: null, p90: null, evidence: ev("unavailable"), reason: "no value series for this zip" };
  const r = growthRates(value).filter((x): x is number => x != null);
  if (r.length < 10) return { median: null, p10: null, p90: null, evidence: ev("unavailable"), reason: `only ${r.length} annual growth observations; ten required` };
  const bs = blockBootstrapPaths(r, horizon, paths);
  return { median: percentilePath(bs, 0.5), p10: percentilePath(bs, 0.1), p90: percentilePath(bs, 0.9), evidence: ev(`${paths.toLocaleString()} block-bootstrap paths over ${r.length} recorded annual growth rates (5-year blocks); median, 10th and 90th percentile by year`) };
}
