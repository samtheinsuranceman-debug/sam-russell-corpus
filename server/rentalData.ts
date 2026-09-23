// ============================================================
// THE RENTAL-MARKET ENGINE — data side. Reads the published files, folds them to one
// annual series per (geo, series, bedroom config), and keeps them in rental_series with
// their source and as-of date. Same shape and rules as zipData.ts: nothing typed in by
// hand; a file that does not answer leaves the last stored series in place.
//
// Sources and what each actually covers (the windows are the record's, not ours):
//   fmr    HUD Fair Market Rents, county/metro, 0–4 bedrooms, FY1983→ (history file)
//   safmr  HUD Small Area FMRs by ZIP, 0–4 bedrooms, FY2018→ (one xlsx per year)
//   acs    Census ACS 5-yr: B25031 median gross rent by bedrooms (0–5+), B25103 median
//          real-estate tax, B25077 median value — ZCTA, 2009→ (each vintage = 5-yr window)
//   evict  Eviction Lab (Princeton) legacy county file: filings, judgments, rates,
//          renter households, low-count flag — 2000–2016/2018. No public series before 2000.
//   fred   M2SL (1959→), WALCL (2002→), CUSR0000SEHA rent of primary residence (1947→)
// Not loaded, because no public series exists: rent by bathroom count; security deposits.
// ============================================================
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { rentalSeries, type RentalSeriesRow } from "../drizzle/schema";
import { fetchFredObservationsSince } from "./_core/fred";
import { xlsxRows, splitCsvLine as parseCsvLine } from "./zipData";
import type { AnnualSeries, Bedrooms } from "@shared/rentalMarketEngine";
import { sweepAllowed } from "./_core/memory";
import { DAY_MS, longInterval } from "./_core/schedule";

export type RentalSeriesId = "fmr" | "safmr" | "acs_rent" | "acs_tax" | "acs_value" | "evict_filings" | "evict_judgments" | "evict_filing_rate" | "evict_rate" | "evict_threat_rate" | "renter_hh" | "m2" | "fed_assets" | "cpi_rent";
export type GeoType = "zip" | "county" | "cbsa" | "us";
export type Parsed = { geo: string; geoType: GeoType; series: RentalSeriesId; config: Bedrooms | "all"; data: AnnualSeries; asOf: string; meta?: { name?: string; state?: string; lowFlag?: boolean; note?: string } };

export const RENTAL_SOURCES = [
  { id: "fmr", name: "HUD Fair Market Rents, history FY1983–present, all bedroom counts (CSV)", page: "https://www.huduser.gov/portal/datasets/fmr.html", url: "", publisher: "HUD Office of Policy Development and Research", note: "The CSV link is resolved from the FMR page at run time ('FMR History 1983 - Present: All Bedroom Unit data in CSV'), because HUD renames the file each fiscal year. County and metro FMR areas; 45th percentile through FY1994, 40th from FY1995." },
  { id: "safmr", name: "HUD Small Area Fair Market Rents by ZIP, FY2018–present (XLSX per year)", page: "https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html", url: "", publisher: "HUD PD&R", note: "One workbook per fiscal year, resolved from the page. ZIPs in metropolitan areas only; non-metro ZIPs fall back to the county FMR." },
  { id: "acs", name: "Census ACS 5-year: B25031 (rent by bedrooms), B25103 (real-estate tax), B25077 (value), ZCTA", page: "https://api.census.gov/data.html", url: "https://api.census.gov/data/{year}/acs/acs5?get=NAME,B25031_002E,B25031_003E,B25031_004E,B25031_005E,B25031_006E,B25031_007E,B25103_001E,B25077_001E&for=zip%20code%20tabulation%20area:*", publisher: "U.S. Census Bureau", note: "5-year vintages 2009-2013 onward carry ZCTA. Each vintage is a five-year window; the year stored is the vintage's end year. CENSUS_API_KEY raises the daily limit; unkeyed calls work at 500/day." },
  { id: "evict", name: "Eviction Lab — county eviction estimates 2000–2018 (modeled, every county) + proprietary observed counts (CSV)", page: "https://data-downloads.evictionlab.org/#estimating-eviction-prevalance-across-us/", url: "https://eviction-lab-data-downloads.s3.amazonaws.com/estimating-eviction-prevalance-across-us/county_eviction_estimates_2000_2018.csv", url2: "https://eviction-lab-data-downloads.s3.amazonaws.com/estimating-eviction-prevalance-across-us/county_proprietary_2000_2018.csv", publisher: "Eviction Lab, Princeton University (Gromis, Fellows, Hendrickson, Edmonds, Leung, Porton, Desmond 2022)", note: "Estimates file: state,county,FIPS_state,FIPS_county,year,renting_hh,filings_estimate,…,hh_threat_estimate,… — filing rate = filings_estimate ÷ renting_hh; households-threatened rate = hh_threat_estimate ÷ renting_hh. Proprietary file: id,name,parent_location,year,type,filings,filing_rate,threatened,threatened_rate,judgements,judgement_rate — the only public source of eviction JUDGMENTS, present only where court data were valid. No public national series exists before 2000." },
  { id: "fred", name: "FRED: M2SL, WALCL, CUSR0000SEHA", page: "https://fred.stlouisfed.org", url: "https://fred.stlouisfed.org/series/", publisher: "Federal Reserve Bank of St. Louis", note: "Annual averages of the monthly series. M2 from 1959, Fed total assets from Dec 2002, CPI rent of primary residence from 1947." },
] as const;

// ─── Transport (injectable, like zipData) ───────────────────────────────────
type Fetcher = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; text: () => Promise<string>; arrayBuffer: () => Promise<ArrayBuffer> }>;
const UA = "RussellCapitalSystems/1.0 (+https://www.russellcapitalsystems.com; public-data reader)";
const realFetch: Fetcher = (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(180_000), headers: { "user-agent": UA, accept: "text/csv, application/json, application/octet-stream, */*", ...(init?.headers as Record<string, string> | undefined) } });
let _fetch: Fetcher = realFetch;
export function _setRentalFetchForTests(f: Fetcher | null) { _fetch = f ?? realFetch; }

/** Find the first href on a page whose link text matches; HUD renames files yearly so we never hardcode them. */
export async function resolveHref(page: string, textPattern: RegExp, hrefPattern: RegExp): Promise<string> {
  const res = await _fetch(page); if (!res.ok) throw new Error(`${page} responded ${res.status}`);
  const html = await res.text();
  const re = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi; let m: RegExpExecArray | null;
  while ((m = re.exec(html))) { const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); if (textPattern.test(text) && hrefPattern.test(m[1])) return new URL(m[1], page).toString(); }
  throw new Error(`no link matching ${textPattern} on ${page}`);
}

// ─── Parsers (pure; tested with fixture strings) ────────────────────────────
const BR: Array<[Bedrooms, RegExp]> = [["0", /^fmr[_ ]?0|efficiency|^fmr0/i], ["1", /^fmr[_ ]?1|one[- ]?bed/i], ["2", /^fmr[_ ]?2|two[- ]?bed/i], ["3", /^fmr[_ ]?3|three[- ]?bed/i], ["4", /^fmr[_ ]?4|four[- ]?bed/i]];

/** HUD FMR history CSV: wide (one row per area, columns like fmr83_0..fmr26_4) or long (area, year, fmr_0..fmr_4). Handles both. */
export function parseFmrHistory(csv: string): Parsed[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim()); if (lines.length < 2) return [];
  const h = parseCsvLine(lines[0]).map((c) => c.trim().toLowerCase());
  const col = (re: RegExp) => h.findIndex((c) => re.test(c));
  const iId = col(/^(fips|cntyidfp|fips2010|id|geoid)/), iName = col(/^(areaname|area_name|name|countyname)/), iState = col(/^(state_alpha|stateabbr|state|statedc)/);
  const out = new Map<string, Parsed>();
  const put = (geo: string, br: Bedrooms, year: number, v: number, name?: string, state?: string) => {
    const key = `${geo}|${br}`; let p = out.get(key);
    if (!p) { p = { geo, geoType: geo.length === 5 && /^\d+$/.test(geo) ? "county" : "cbsa", series: "fmr", config: br, data: { startYear: year, values: [] }, asOf: String(year), meta: { name, state } }; out.set(key, p); }
    const s = p.data; if (year < s.startYear) { s.values = Array(s.startYear - year).fill(null).concat(s.values); s.startYear = year; }
    while (s.values.length <= year - s.startYear) s.values.push(null);
    s.values[year - s.startYear] = v; if (year > Number(p.asOf)) p.asOf = String(year);
  };
  // wide form: columns fmrYY_B or fmr_YYYY_B
  const wide = h.map((c, i) => { const m = /^fmr_?(\d{2}|\d{4})_?([0-4])$/.exec(c); return m ? { i, year: m[1].length === 2 ? (Number(m[1]) >= 83 ? 1900 + Number(m[1]) : 2000 + Number(m[1])) : Number(m[1]), br: m[2] as Bedrooms } : null; }).filter((x): x is NonNullable<typeof x> => !!x);
  const iYear = col(/^(year|fy|fiscal_year)$/);
  for (const line of lines.slice(1)) {
    const c = parseCsvLine(line); if (c.length < 3) continue;
    const geo = String(c[iId] ?? "").replace(/\D/g, "").slice(0, 5); if (!geo) continue;
    const name = iName >= 0 ? c[iName] : undefined, state = iState >= 0 ? c[iState] : undefined;
    if (wide.length) { for (const w of wide) { const v = Number(c[w.i]); if (Number.isFinite(v) && v > 0) put(geo, w.br, w.year, v, name, state); } }
    else if (iYear >= 0) { const year = Number(c[iYear]); if (!Number.isFinite(year)) continue; for (const [br, re] of BR) { const i = col(re); const v = i >= 0 ? Number(c[i]) : NaN; if (Number.isFinite(v) && v > 0) put(geo, br, year, v, name, state); } }
  }
  return Array.from(out.values());
}

/** Small Area FMR workbook for one fiscal year: rows by ZIP with SAFMR 0BR..4BR. */
export function parseSafmrRows(rows: Array<Array<string | number | null>>, fiscalYear: number): Parsed[] {
  const head = rows.findIndex((r) => r.some((c) => /zip/i.test(String(c ?? ""))) && r.some((c) => /safmr|0br|1br|bed/i.test(String(c ?? ""))));
  if (head < 0) throw new Error("SAFMR: header row not found");
  const h = rows[head].map((c) => String(c ?? "").trim().toLowerCase());
  const iZip = h.findIndex((c) => /^zip/.test(c));
  const cols: Array<[Bedrooms, number]> = (["0", "1", "2", "3", "4"] as Bedrooms[]).map((b) => [b, h.findIndex((c) => new RegExp(`(^|[^0-9])${b}\\s*br|safmr\\s*${b}`).test(c))]).filter((pair) => (pair[1] as number) >= 0) as Array<[Bedrooms, number]>;
  const out: Parsed[] = [];
  for (const r of rows.slice(head + 1)) {
    const zip = String(r[iZip] ?? "").replace(/\D/g, "").padStart(5, "0").slice(-5); if (!/^\d{5}$/.test(zip)) continue;
    for (const [br, i] of cols) { const v = Number(r[i]); if (Number.isFinite(v) && v > 0) out.push({ geo: zip, geoType: "zip", series: "safmr", config: br, data: { startYear: fiscalYear, values: [v] }, asOf: String(fiscalYear) }); }
  }
  return out;
}

/** Census ACS JSON (array of arrays, header first) → rent by bedrooms, tax, value per ZCTA for the vintage's end year. */
export function parseAcs(json: string[][], vintageEndYear: number): Parsed[] {
  const h = json[0]; const ix = (name: string) => h.indexOf(name);
  const rent: Array<[Bedrooms, string]> = [["0", "B25031_002E"], ["1", "B25031_003E"], ["2", "B25031_004E"], ["3", "B25031_005E"], ["4", "B25031_006E"], ["5+", "B25031_007E"]];
  const iZ = h.findIndex((c) => /zip code tabulation area/i.test(c)); const out: Parsed[] = [];
  for (const row of json.slice(1)) {
    const zcta = String(row[iZ] ?? "").padStart(5, "0"); if (!/^\d{5}$/.test(zcta)) continue;
    const num = (i: number) => { const v = Number(row[i]); return Number.isFinite(v) && v > 0 ? v : null; };
    for (const [br, code] of rent) { const v = num(ix(code)); if (v != null) out.push({ geo: zcta, geoType: "zip", series: "acs_rent", config: br, data: { startYear: vintageEndYear, values: [v] }, asOf: String(vintageEndYear) }); }
    const tax = num(ix("B25103_001E")), val = num(ix("B25077_001E"));
    if (tax != null) out.push({ geo: zcta, geoType: "zip", series: "acs_tax", config: "all", data: { startYear: vintageEndYear, values: [tax] }, asOf: String(vintageEndYear) });
    if (val != null) out.push({ geo: zcta, geoType: "zip", series: "acs_value", config: "all", data: { startYear: vintageEndYear, values: [val] }, asOf: String(vintageEndYear) });
  }
  return out;
}

/** Eviction Lab county files. Estimates layout (every county, modeled): filings_estimate and hh_threat_estimate per renting_hh.
 *  Proprietary layout (observed counties only): filings, threatened, judgements and their rates. Both fold to one series per county × measure. */
export function parseEvictionCounties(csv: string): Parsed[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim()); if (lines.length < 2) return [];
  const h = parseCsvLine(lines[0]).map((c) => c.trim().toLowerCase()); const ix = (n: string) => h.indexOf(n);
  const estimates = ix("filings_estimate") >= 0;
  const iGeo = estimates ? ix("fips_county") : ix("id"), iY = ix("year"), iName = estimates ? ix("county") : ix("name"), iState = estimates ? ix("state") : ix("parent_location");
  const map = new Map<string, Parsed>();
  const put = (geo: string, series: RentalSeriesId, year: number, v: number, name?: string, state?: string, note?: string) => {
    const key = `${geo}|${series}`; let p = map.get(key);
    if (!p) { p = { geo, geoType: "county", series, config: "all", data: { startYear: year, values: [] }, asOf: String(year), meta: { name, state, note } }; map.set(key, p); }
    const s = p.data; if (year < s.startYear) { s.values = Array(s.startYear - year).fill(null).concat(s.values); s.startYear = year; }
    while (s.values.length <= year - s.startYear) s.values.push(null);
    s.values[year - s.startYear] = v; if (year > Number(p.asOf)) p.asOf = String(year);
  };
  for (const line of lines.slice(1)) {
    const c = parseCsvLine(line); const geo = String(c[iGeo] ?? "").replace(/\D/g, "").padStart(5, "0"); const year = Number(c[iY]); if (!/^\d{5}$/.test(geo) || !Number.isFinite(year)) continue;
    const num = (n: string) => { const i = ix(n); const v = i >= 0 ? Number(c[i]) : NaN; return Number.isFinite(v) ? v : null; };
    const name = iName >= 0 ? c[iName] : undefined, state = iState >= 0 ? c[iState] : undefined;
    if (estimates) {
      const hh = num("renting_hh"), f = num("filings_estimate"), t = num("hh_threat_estimate");
      if (hh != null) put(geo, "renter_hh", year, hh, name, state);
      if (f != null) { put(geo, "evict_filings", year, f, name, state, "modeled estimate"); if (hh) put(geo, "evict_filing_rate", year, (f / hh) * 100, name, state, "filings_estimate ÷ renting_hh, in percent"); }
      if (t != null && hh) put(geo, "evict_threat_rate", year, (t / hh) * 100, name, state, "hh_threat_estimate ÷ renting_hh, in percent");
    } else {
      const f = num("filings"), fr = num("filing_rate"), j = num("judgements"), jr = num("judgement_rate");
      const note = `observed (type=${c[ix("type")] ?? ""})`;
      if (j != null) put(geo, "evict_judgments", year, j, name, state, note);
      if (jr != null) put(geo, "evict_rate", year, jr, name, state, note + " — judgments per 100 renter households");
      if (f != null && !map.has(`${geo}|evict_filings`)) put(geo, "evict_filings", year, f, name, state, note);
      if (fr != null && !map.has(`${geo}|evict_filing_rate`)) put(geo, "evict_filing_rate", year, fr, name, state, note);
    }
  }
  return Array.from(map.values());
}

/** Monthly FRED observations → annual average series. */
export function annualAverageFrom(obs: Array<{ date: string; value: number }>): AnnualSeries | null {
  if (!obs.length) return null; const by = new Map<number, number[]>();
  for (const o of obs) { const y = Number(o.date.slice(0, 4)); if (!by.has(y)) by.set(y, []); by.get(y)!.push(o.value); }
  const years = Array.from(by.keys()).sort((a, b) => a - b); const start = years[0];
  return { startYear: start, values: Array.from({ length: years[years.length - 1] - start + 1 }, (_, i) => { const v = by.get(start + i); return v ? v.reduce((a, b) => a + b, 0) / v.length : null; }) };
}

// ─── Readers ────────────────────────────────────────────────────────────────
export async function readFmrHistory(): Promise<Parsed[]> {
  const url = await resolveHref(RENTAL_SOURCES[0].page, /History.*1983.*All Bedroom.*CSV/i, /\.csv$/i);
  const res = await _fetch(url); if (!res.ok) throw new Error(`HUD FMR history responded ${res.status}`);
  return parseFmrHistory(await res.text()).map((p) => ({ ...p, meta: { ...p.meta, note: url } }));
}
export async function readSafmr(fiscalYear: number): Promise<Parsed[]> {
  const url = await resolveHref(RENTAL_SOURCES[1].page, new RegExp(`Small Area FMRs`, "i"), new RegExp(`fy${fiscalYear}|${fiscalYear}`, "i"));
  const res = await _fetch(url); if (!res.ok) throw new Error(`HUD SAFMR ${fiscalYear} responded ${res.status}`);
  return parseSafmrRows(xlsxRows(Buffer.from(await res.arrayBuffer())), fiscalYear);
}
export async function readAcs(vintageEndYear: number, env: NodeJS.ProcessEnv = process.env): Promise<Parsed[]> {
  // CENSUSDATA_API_KEY is the name the owner gave it on Railway; both work.
  const censusKey = env.CENSUS_API_KEY?.trim() || env.CENSUSDATA_API_KEY?.trim();
  const key = censusKey ? `&key=${censusKey}` : "";
  const res = await _fetch(RENTAL_SOURCES[2].url.replace("{year}", String(vintageEndYear)) + key);
  if (!res.ok) throw new Error(`Census ACS ${vintageEndYear} responded ${res.status}`);
  return parseAcs(JSON.parse(await res.text()) as string[][], vintageEndYear);
}
export async function readEvictions(): Promise<Parsed[]> {
  const src = RENTAL_SOURCES[3] as { url: string; url2: string };
  const a = await _fetch(src.url); if (!a.ok) throw new Error(`Eviction Lab estimates responded ${a.status}`);
  const rows = parseEvictionCounties(await a.text());
  try { const b = await _fetch(src.url2); if (b.ok) rows.push(...parseEvictionCounties(await b.text())); } catch (e) { console.warn("[rental] eviction proprietary file", String(e).slice(0, 120)); }
  return rows;
}
export async function readFredMoney(env: NodeJS.ProcessEnv = process.env): Promise<Parsed[]> {
  const out: Parsed[] = [];
  for (const [id, series, start] of [["M2SL", "m2", "1959-01-01"], ["WALCL", "fed_assets", "2002-12-18"], ["CUSR0000SEHA", "cpi_rent", "1947-01-01"]] as Array<[string, RentalSeriesId, string]>) {
    const obs = await fetchFredObservationsSince(id, start, env); const data = annualAverageFrom(obs);
    if (data) out.push({ geo: "US", geoType: "us", series, config: "all", data, asOf: obs[obs.length - 1]!.date, meta: { note: `https://fred.stlouisfed.org/series/${id}` } });
  }
  return out;
}

// ─── Storage, sweep, schedule ───────────────────────────────────────────────
export async function storeParsed(rows: Parsed[], source: string): Promise<number> {
  const db = await getDb(); if (!db || !rows.length) return 0; let n = 0; const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH).map((r) => ({ geo: r.geo, geoType: r.geoType, series: r.series, config: r.config, startYear: r.data.startYear, values: r.data.values, asOf: r.asOf.slice(0, 10), source: (r.meta?.note ?? source).slice(0, 200), meta: r.meta ?? null, fetchedAt: new Date() }));
    try { await db.insert(rentalSeries).values(chunk).onDuplicateKeyUpdate({ set: { startYear: sql`VALUES(startYear)`, values: sql`VALUES(\`values\`)`, asOf: sql`VALUES(asOf)`, source: sql`VALUES(source)`, meta: sql`VALUES(meta)`, fetchedAt: new Date() } }); n += chunk.length; }
    catch (e) { console.warn("[rental] store failed at", i, String(e).slice(0, 200)); }
  }
  memo.clear(); return n;
}
export type SweepResult = Record<string, number | string> & { stored: number; ms: number };
let sweeping: Promise<SweepResult> | null = null;
export function rentalSweep(env: NodeJS.ProcessEnv = process.env): Promise<SweepResult> {
  if (sweeping) return sweeping;
  sweeping = (async () => {
    const t0 = Date.now(); const out: SweepResult = { stored: 0, ms: 0 }; const thisFy = new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0);
    const jobs: Array<[string, () => Promise<Parsed[]>]> = [["fred", () => readFredMoney(env)], ["fmr", readFmrHistory], ["evict", readEvictions], ["acs", () => readAcs(new Date().getFullYear() - 2, env)], ...Array.from({ length: thisFy - 2018 + 1 }, (_, i) => [`safmr${2018 + i}`, () => readSafmr(2018 + i)] as [string, () => Promise<Parsed[]>])];
    for (const [id, job] of jobs) { try { const rows = await job(); out[id] = rows.length; out.stored += await storeParsed(rows, id); } catch (e) { out[id] = String(e).slice(0, 160); console.warn("[rental]", id, out[id]); } }
    out.ms = Date.now() - t0; console.log("[rental] sweep", JSON.stringify(out)); return out;
  })().finally(() => { sweeping = null; });
  return sweeping;
}
/** Opt-in: RENTAL_DATA_DAYS=30 re-reads monthly (first pass three minutes after boot). Off unless set. */
export function startRentalSchedule(env: NodeJS.ProcessEnv = process.env): boolean {
  const days = Number(env.RENTAL_DATA_DAYS ?? 0); if (!Number.isFinite(days) || days <= 0) return false;
  const mem = sweepAllowed(env); if (!mem.ok) { console.warn(`[rental] automatic sweep skipped: ${mem.haveMb} MB available, ${mem.needMb} MB asked`); return false; }
  setTimeout(() => { rentalSweep(env).catch(() => undefined); }, 180_000).unref();
  longInterval(() => { rentalSweep(env).catch(() => undefined); }, days * DAY_MS); return true;
}

// ─── Reads ──────────────────────────────────────────────────────────────────
const memo = new Map<string, { at: number; value: unknown }>(); const MEMO_TTL = 6 * 60 * 60 * 1000;
async function memoised<T>(key: string, f: () => Promise<T>): Promise<T> { const m = memo.get(key); if (m && Date.now() - m.at < MEMO_TTL) return m.value as T; const v = await f(); memo.set(key, { at: Date.now(), value: v }); return v; }
const toSeries = (r: RentalSeriesRow): AnnualSeries => ({ startYear: r.startYear, values: (typeof r.values === "string" ? JSON.parse(r.values) : r.values) as Array<number | null> });
export async function seriesFor(geo: string, series: RentalSeriesId, config: Bedrooms | "all" = "all"): Promise<{ data: AnnualSeries; asOf: string; source: string; meta: RentalSeriesRow["meta"] } | null> {
  return memoised(`${geo}|${series}|${config}`, async () => {
    const db = await getDb(); if (!db) return null;
    const rows = await db.select().from(rentalSeries).where(sql`${rentalSeries.geo} = ${geo} and ${rentalSeries.series} = ${series} and ${rentalSeries.config} = ${config}`).limit(1);
    return rows[0] ? { data: toSeries(rows[0]), asOf: rows[0].asOf, source: rows[0].source, meta: rows[0].meta } : null;
  });
}
export async function rentalStatus(): Promise<{ series: Array<{ series: string; rows: number; earliest: number | null; latestAsOf: string | null }> }> {
  const db = await getDb(); if (!db) return { series: [] };
  const rows = await db.select({ series: rentalSeries.series, rows: sql<number>`count(*)`, earliest: sql<number | null>`min(startYear)`, latestAsOf: sql<string | null>`max(asOf)` }).from(rentalSeries).groupBy(rentalSeries.series);
  return { series: rows.map((r) => ({ series: String(r.series), rows: Number(r.rows), earliest: r.earliest == null ? null : Number(r.earliest), latestAsOf: r.latestAsOf })) };
}
