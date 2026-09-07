// ============================================================
// THE CAREER LEDGER — data side. Reads the published files and keeps what a
// specialist needs to see beside their own numbers:
//   BLS OEWS  — employment and wages (mean, 10/25/50/75/90th) for every
//               physician, surgeon, dentist, veterinarian and lawyer
//               occupation, national and by state, one file per year from
//               May 2014 (the first year BLS published XLSX; earlier years
//               are XLS and wait for a reader), plus each state's fifteen
//               best-paid occupations that year.
//   NCES      — Digest table 330.10, tuition, fees, room and board since
//               1963-64 (national), and table 330.20, the same by state for
//               the two latest years.
// Nothing is typed in by hand. A file that does not answer leaves the last
// stored rows in place with their old as-of, and the status says so.
// ============================================================
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { careerSeries, careerStats, type CareerSeriesRow, type CareerStatRow } from "../drizzle/schema";
import { forEachXlsxRow, unzipEntries } from "./zipData";
import { sweepAllowed } from "./_core/memory";
import { DAY_MS, longInterval } from "./_core/schedule";
import { CAREER_PATHS, SOURCES } from "@shared/careerEngine";

// ─── Transport ──────────────────────────────────────────────────────────────
type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; arrayBuffer: () => Promise<ArrayBuffer> }>;
const UA = "RussellCapitalSystems/1.0 (+https://www.russellcapitalsystems.com; public-data reader)";
const realFetch: Fetcher = (url) => fetch(url, { signal: AbortSignal.timeout(180_000), headers: { "user-agent": UA, accept: "application/zip, application/octet-stream, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*" } });
let _fetch: Fetcher = realFetch;
export function _setCareerFetchForTests(f: Fetcher | null) { _fetch = f ?? realFetch; }

// ─── The files ──────────────────────────────────────────────────────────────
/** BLS publishes one zip per year per level; the path spelling changed in 2019 and both are tried. */
export function blsUrls(year: number, level: "nat" | "st"): string[] {
  const yy = String(year).slice(2);
  return [`https://www.bls.gov/oes/special-requests/oesm${yy}${level}.zip`, `https://www.bls.gov/oes/special.requests/oesm${yy}${level}.zip`];
}
export const BLS_FIRST_XLSX_YEAR = 2014;
export const NCES_URLS = {
  national: "https://nces.ed.gov/programs/digest/d23/tables/xls/tabn330.10.xlsx",
  byState: "https://nces.ed.gov/programs/digest/d23/tables/xls/tabn330.20.xlsx",
} as const;

/** Every SOC code the ledger keeps: the 2018 codes and the 2010 codes the 2014–2018 files used. */
export const KEPT_CODES: ReadonlySet<string> = new Set(CAREER_PATHS.flatMap((p) => [p.soc.code, ...(p.soc.legacy ? [p.soc.legacy.code] : [])]));
export const TOP_EARNERS_PER_AREA = 15;

export const US_STATES: Record<string, string> = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming" };
const ABBR_BY_NAME = new Map(Object.entries(US_STATES).map(([a, n]) => [n.toLowerCase(), a]));
export function stateAbbr(name: string): string | null { const s = name.trim(); if (/^[A-Z]{2}$/.test(s) && US_STATES[s]) return s; return ABBR_BY_NAME.get(s.toLowerCase()) ?? null; }

// ─── Parsers ────────────────────────────────────────────────────────────────
export type StatRow = Omit<CareerStatRow, "id" | "fetchedAt" | "hourlyMean"> & { hourlyMean: number | null };

/** A BLS cell: numbers with commas; "*" (not available) → null; "#" (at or above the top code) → null with the flag. */
export function blsNumber(v: unknown): { value: number | null; topCoded: boolean } {
  if (v == null) return { value: null, topCoded: false };
  if (typeof v === "number") return { value: Number.isFinite(v) ? v : null, topCoded: false };
  const s = String(v).trim();
  if (s === "#") return { value: null, topCoded: true };
  const n = Number(s.replace(/[,$\s]/g, ""));
  return { value: s && Number.isFinite(n) ? n : null, topCoded: false };
}

/** Reads one BLS OEWS workbook: keeps the ledger's occupations in every area and each area's top-paid occupations by annual mean. Header names are matched case-insensitively across the 2014–2025 layouts. */
export function parseOews(buf: Buffer, year: number, level: "nat" | "st", source: string): StatRow[] {
  let h: Record<string, number> | null = null;
  const kept: StatRow[] = [];
  const candidates = new Map<string, Array<{ row: StatRow; mean: number }>>();
  forEachXlsxRow(buf, (cells) => {
    if (!h) {
      const names = cells.map((c) => String(c ?? "").trim().toUpperCase());
      if (names.includes("OCC_CODE") && (names.includes("A_MEAN") || names.includes("A_MEDIAN"))) { h = {}; names.forEach((n, i) => { if (n) h![n] = i; }); }
      return;
    }
    const at = (k: string) => { const i = h![k]; return i == null ? null : cells[i] ?? null; };
    const occCode = String(at("OCC_CODE") ?? "").trim();
    if (!/^\d{2}-\d{4}$/.test(occCode)) return;
    const group = String(at("O_GROUP") ?? at("OCC_GROUP") ?? "").toLowerCase();
    if (group && !/detailed|^$/.test(group)) return; // majors and totals are not occupations
    const ownCode = String(at("OWN_CODE") ?? "").trim();
    if (ownCode && ownCode !== "1235") return;       // cross-ownership estimates only
    const naics = String(at("NAICS") ?? "").trim();
    if (naics && !/^0+$/.test(naics)) return;         // all-industry rows only
    let area = "US", areaTitle = "United States";
    if (level === "st") {
      const abbr = String(at("PRIM_STATE") ?? at("ST") ?? "").trim().toUpperCase();
      const title = String(at("AREA_TITLE") ?? at("STATE") ?? "").trim();
      const a = stateAbbr(abbr) ?? stateAbbr(title);
      if (!a) return;
      area = a; areaTitle = US_STATES[a]!;
    }
    const emp = blsNumber(at("TOT_EMP")), hMean = blsNumber(at("H_MEAN")), aMean = blsNumber(at("A_MEAN"));
    const p10 = blsNumber(at("A_PCT10")), p25 = blsNumber(at("A_PCT25")), p50 = blsNumber(at("A_MEDIAN")), p75 = blsNumber(at("A_PCT75")), p90 = blsNumber(at("A_PCT90"));
    const row: StatRow = { year, area, areaTitle, occCode, occTitle: String(at("OCC_TITLE") ?? "").trim().slice(0, 140), employment: emp.value == null ? null : Math.round(emp.value), hourlyMean: hMean.value, annualMean: aMean.value == null ? null : Math.round(aMean.value), p10: r(p10.value), p25: r(p25.value), p50: r(p50.value), p75: r(p75.value), p90: r(p90.value), topCoded: [p10, p25, p50, p75, p90, aMean].some((x) => x.topCoded), rankInArea: null, source };
    if (KEPT_CODES.has(occCode)) kept.push(row);
    if (row.annualMean != null) { let list = candidates.get(area); if (!list) { list = []; candidates.set(area, list); } list.push({ row, mean: row.annualMean }); }
  });
  if (!h) throw new Error(`BLS ${year} ${level}: header row not found`);
  // The area's best-paid occupations that year, ranked by annual mean.
  candidates.forEach((list) => {
    list.sort((a, b) => b.mean - a.mean).slice(0, TOP_EARNERS_PER_AREA).forEach((c, i) => {
      const existing = kept.find((k) => k.area === c.row.area && k.occCode === c.row.occCode);
      if (existing) existing.rankInArea = i + 1; else kept.push({ ...c.row, rankInArea: i + 1 });
    });
  });
  return kept;
}

export type SeriesRow = Omit<CareerSeriesRow, "id" | "fetchedAt">;
const r = (v: number | null) => (v == null ? null : Math.round(v));
const academicYear = (v: unknown): number | null => { const m = String(v ?? "").trim().match(/^(\d{4})-(\d{2,4})/); return m ? Number(m[1]) : null; };
const num = (v: unknown): number | null => { if (typeof v === "number") return v; const n = Number(String(v ?? "").replace(/[,$\s†‡]/g, "")); return String(v ?? "").trim() && Number.isFinite(n) ? n : null; };

/** NCES table 330.10: three sections (all, public, private), one row per academic year, current dollars first: total / tuition / room / board, each for all, 4-year, 2-year. Keeps the 4-year columns. */
export function parseNces33010(rows: Array<Array<string | number | null>>, source: string): SeriesRow[] {
  const sections: Array<{ key: string; test: RegExp }> = [{ key: "all", test: /^all institutions/i }, { key: "pub", test: /^public institutions/i }, { key: "priv", test: /^private/i }];
  const measures = [["total4", 2], ["tuit4", 5], ["room4", 8], ["board4", 11]] as const;
  const data = new Map<string, Map<number, number>>();
  let section: string | null = null, asOf = 0;
  for (const row of rows) {
    const label = String(row[0] ?? "").trim();
    const sec = sections.find((s) => s.test.test(label));
    if (sec) { section = sec.key; continue; }
    const y = academicYear(label);
    if (y == null || !section) continue;
    for (const [m, col] of measures) {
      const v = num(row[col]);
      if (v == null) continue;
      const key = `nces_${section}_${m}`;
      let mm = data.get(key); if (!mm) { mm = new Map(); data.set(key, mm); }
      mm.set(y, v); if (y > asOf) asOf = y;
    }
  }
  const out: SeriesRow[] = [];
  data.forEach((mm, series) => {
    const ys = Array.from(mm.keys()).sort((a, b) => a - b);
    const values: Array<number | null> = [];
    for (let y = ys[0]!; y <= ys[ys.length - 1]!; y++) values.push(mm.get(y) ?? null);
    out.push({ series, area: "US", startYear: ys[0]!, values, asOf: String(asOf), source });
  });
  return out;
}

/** NCES table 330.20: one row per state; public 4-year in-state total and tuition for two years, then out-of-state tuition, then private 4-year the same, then public 2-year. Keeps public and private 4-year total and tuition for the two years. */
export function parseNces33020(rows: Array<Array<string | number | null>>, source: string): SeriesRow[] {
  const years = new Set<number>();
  for (const row of rows.slice(0, 12)) for (const c of row) { const y = academicYear(c); if (y != null) years.add(y); }
  const ys = Array.from(years).sort((a, b) => a - b);
  if (ys.length < 1) throw new Error("NCES 330.20: no academic years in the header");
  const start = ys[0]!, asOf = String(ys[ys.length - 1]);
  const out: SeriesRow[] = [];
  for (const row of rows) {
    const abbr = stateAbbr(String(row[0] ?? ""));
    const area = abbr ?? (/^united states/i.test(String(row[0] ?? "").trim()) ? "US" : null);
    if (!area) continue;
    const v = (i: number) => num(row[i]);
    const push = (series: string, a: number | null, b: number | null) => { if (a != null || b != null) out.push({ series, area, startYear: start, values: ys.length >= 2 ? [a, b] : [b ?? a], asOf, source }); };
    push("nces_pub_total4", v(1), v(3)); push("nces_pub_tuit4", v(2), v(4)); push("nces_pub_room4", null, v(5)); push("nces_pub_board4", null, v(6));
    push("nces_priv_total4", v(8), v(10)); push("nces_priv_tuit4", v(9), v(11)); push("nces_priv_room4", null, v(12)); push("nces_priv_board4", null, v(13));
  }
  return out;
}

// ─── Reads ──────────────────────────────────────────────────────────────────
async function getBuffer(urls: string[]): Promise<{ buf: Buffer; url: string }> {
  let last = "";
  for (const url of urls) {
    try { const res = await _fetch(url); if (res.ok) return { buf: Buffer.from(await res.arrayBuffer()), url }; last = `HTTP ${res.status}`; }
    catch (e) { last = String(e).slice(0, 80); }
  }
  throw new Error(`${urls[0]} → ${last}`);
}

/** The workbook inside a BLS zip: the largest .xlsx entry (the others are field descriptions). */
export function workbookFromZip(zip: Buffer): Buffer {
  const entries = unzipEntries(zip, (n) => /\.xlsx$/i.test(n) && !/field|descr/i.test(n));
  let best: Buffer | null = null;
  entries.forEach((b) => { if (!best || b.length > best.length) best = b; });
  if (!best) throw new Error("zip holds no workbook");
  return best;
}

export async function readBls(year: number, level: "nat" | "st"): Promise<StatRow[]> {
  const { buf, url } = await getBuffer(blsUrls(year, level));
  return parseOews(workbookFromZip(buf), year, level, url);
}
export async function readNces(which: "national" | "byState"): Promise<SeriesRow[]> {
  const url = NCES_URLS[which];
  const { buf } = await getBuffer([url]);
  const rows: Array<Array<string | number | null>> = [];
  forEachXlsxRow(buf, (c) => { rows.push(c); });
  return which === "national" ? parseNces33010(rows, url) : parseNces33020(rows, url);
}

// ─── Store ──────────────────────────────────────────────────────────────────
export async function storeStats(rows: StatRow[]): Promise<number> {
  const db = await getDb();
  if (!db || !rows.length) return 0;
  let n = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500).map((x) => ({ ...x, hourlyMean: x.hourlyMean == null ? null : x.hourlyMean.toFixed(2), source: x.source.slice(0, 200), fetchedAt: new Date() }));
    try {
      await db.insert(careerStats).values(chunk).onDuplicateKeyUpdate({ set: { occTitle: sql`VALUES(occTitle)`, employment: sql`VALUES(employment)`, hourlyMean: sql`VALUES(hourlyMean)`, annualMean: sql`VALUES(annualMean)`, p10: sql`VALUES(p10)`, p25: sql`VALUES(p25)`, p50: sql`VALUES(p50)`, p75: sql`VALUES(p75)`, p90: sql`VALUES(p90)`, topCoded: sql`VALUES(topCoded)`, rankInArea: sql`VALUES(rankInArea)`, source: sql`VALUES(source)`, fetchedAt: new Date() } });
      n += chunk.length;
    } catch (e) { console.warn("[career] stats store failed at", i, String((e as { cause?: { sqlMessage?: string } })?.cause?.sqlMessage ?? e).slice(0, 200)); }
  }
  memo.clear();
  return n;
}
export async function storeSeries(rows: SeriesRow[]): Promise<number> {
  const db = await getDb();
  if (!db || !rows.length) return 0;
  const chunk = rows.map((x) => ({ ...x, source: x.source.slice(0, 200), fetchedAt: new Date() }));
  await db.insert(careerSeries).values(chunk).onDuplicateKeyUpdate({ set: { startYear: sql`VALUES(startYear)`, values: sql`VALUES(\`values\`)`, asOf: sql`VALUES(asOf)`, source: sql`VALUES(source)`, fetchedAt: new Date() } });
  memo.clear();
  return chunk.length;
}

export type CareerSweepResult = { bls: Record<string, number | string>; nces: Record<string, number | string>; stored: number; ms: number };
let sweeping: Promise<CareerSweepResult> | null = null;
/** Read every file and store what answered. Each file fails on its own; the others still land. BLS years run from the first XLSX year to this year. */
export function careerSweep(opts: { years?: number[]; now?: Date } = {}): Promise<CareerSweepResult> {
  if (sweeping) return sweeping;
  sweeping = (async () => {
    const t0 = Date.now();
    const out: CareerSweepResult = { bls: {}, nces: {}, stored: 0, ms: 0 };
    for (const which of ["national", "byState"] as const) {
      try { const rows = await readNces(which); out.nces[which] = rows.length; out.stored += await storeSeries(rows); }
      catch (e) { out.nces[which] = String(e).slice(0, 160); console.warn("[career] nces", which, out.nces[which]); }
    }
    const thisYear = (opts.now ?? new Date()).getFullYear();
    const years = opts.years ?? Array.from({ length: thisYear - BLS_FIRST_XLSX_YEAR + 1 }, (_, i) => thisYear - i); // newest first
    for (const y of years) for (const level of ["nat", "st"] as const) {
      try { const rows = await readBls(y, level); out.bls[`${y}${level}`] = rows.length; out.stored += await storeStats(rows); }
      catch (e) { out.bls[`${y}${level}`] = String(e).slice(0, 120); }
    }
    out.ms = Date.now() - t0;
    console.log("[career] sweep", JSON.stringify(out));
    return out;
  })().finally(() => { sweeping = null; });
  return sweeping;
}

/** Opt-in schedule: CAREER_DATA_DAYS=90 re-reads the files quarterly (first pass four minutes after boot). Off unless set. */
export function startCareerSchedule(env: NodeJS.ProcessEnv = process.env): boolean {
  const days = Number(env.CAREER_DATA_DAYS ?? 0);
  if (!Number.isFinite(days) || days <= 0) return false;
  const mem = sweepAllowed(env);
  if (!mem.ok) { console.warn(`[career] automatic sweep skipped: this box allows ${mem.haveMb} MB and the sweep asks for ${mem.needMb} MB (SWEEP_MIN_MEMORY_MB); the owner's refresh still works`); return false; }
  setTimeout(() => { careerSweep().catch(() => undefined); }, 240_000).unref();
  longInterval(() => { careerSweep().catch(() => undefined); }, days * DAY_MS);
  return true;
}

// ─── Queries ────────────────────────────────────────────────────────────────
const memo = new Map<string, { at: number; value: unknown }>();
const MEMO_TTL = 6 * 60 * 60 * 1000;
async function memoised<T>(key: string, f: () => Promise<T>): Promise<T> {
  const m = memo.get(key);
  if (m && Date.now() - m.at < MEMO_TTL) return m.value as T;
  const value = await f();
  memo.set(key, { at: Date.now(), value });
  return value;
}
const statView = (x: CareerStatRow) => ({ year: x.year, area: x.area, areaTitle: x.areaTitle, occCode: x.occCode, occTitle: x.occTitle, employment: x.employment, hourlyMean: x.hourlyMean == null ? null : Number(x.hourlyMean), annualMean: x.annualMean, p10: x.p10, p25: x.p25, p50: x.p50, p75: x.p75, p90: x.p90, topCoded: x.topCoded, rankInArea: x.rankInArea, source: x.source, fetchedAt: x.fetchedAt.toISOString() });
export type StatView = ReturnType<typeof statView>;

/** Every stored year for an occupation code in an area, oldest first. */
export async function statsFor(occCodes: string[], area: string): Promise<StatView[]> {
  return memoised(`stats:${occCodes.join(",")}:${area}`, async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(careerStats).where(and(eq(careerStats.area, area), sql`${careerStats.occCode} in (${sql.join(occCodes.map((c) => sql`${c}`), sql`, `)})`));
    return rows.sort((a, b) => a.year - b.year).map(statView);
  });
}
/** The latest year's rows for one code across every area (the state table). */
export async function latestByArea(occCode: string): Promise<StatView[]> {
  return memoised(`latest:${occCode}`, async () => {
    const db = await getDb();
    if (!db) return [];
    const [top] = await db.select({ y: sql<number>`max(${careerStats.year})` }).from(careerStats).where(eq(careerStats.occCode, occCode));
    const year = Number(top?.y ?? 0);
    if (!year) return [];
    return (await db.select().from(careerStats).where(and(eq(careerStats.occCode, occCode), eq(careerStats.year, year)))).map(statView);
  });
}
/** The area's fifteen best-paid occupations in its latest stored year. */
export async function topEarners(area: string): Promise<StatView[]> {
  return memoised(`top:${area}`, async () => {
    const db = await getDb();
    if (!db) return [];
    const [top] = await db.select({ y: sql<number>`max(${careerStats.year})` }).from(careerStats).where(eq(careerStats.area, area));
    const year = Number(top?.y ?? 0);
    if (!year) return [];
    const rows = await db.select().from(careerStats).where(and(eq(careerStats.area, area), eq(careerStats.year, year), sql`${careerStats.rankInArea} is not null`)).orderBy(careerStats.rankInArea);
    return rows.map(statView);
  });
}
export async function seriesFor(area: string): Promise<Array<{ series: string; startYear: number; values: Array<number | null>; asOf: string; source: string }>> {
  return memoised(`series:${area}`, async () => {
    const db = await getDb();
    if (!db) return [];
    return (await db.select().from(careerSeries).where(eq(careerSeries.area, area))).map((x) => ({ series: x.series, startYear: x.startYear, values: (typeof x.values === "string" ? JSON.parse(x.values) : x.values) as Array<number | null>, asOf: x.asOf, source: x.source }));
  });
}

export type CareerStatus = { bls: { years: number[]; rows: number; areas: number; latest: number | null; fetchedAt: string | null; source: string }; nces: { series: number; areas: number; national: { from: number; to: number } | null; fetchedAt: string | null; source: string }; ready: boolean; occupations: number };
export async function careerStatus(): Promise<CareerStatus> {
  return memoised("status", async () => {
    const db = await getDb();
    const out: CareerStatus = { bls: { years: [], rows: 0, areas: 0, latest: null, fetchedAt: null, source: SOURCES.blsOews.url }, nces: { series: 0, areas: 0, national: null, fetchedAt: null, source: SOURCES.nces33010.url }, ready: false, occupations: KEPT_CODES.size };
    if (!db) return out;
    const yrs = await db.select({ y: careerStats.year, n: sql<number>`count(*)`, f: sql<Date>`max(${careerStats.fetchedAt})` }).from(careerStats).groupBy(careerStats.year).orderBy(desc(careerStats.year));
    out.bls.years = yrs.map((x) => x.y); out.bls.rows = yrs.reduce((s, x) => s + Number(x.n), 0); out.bls.latest = yrs[0]?.y ?? null; out.bls.fetchedAt = yrs[0]?.f ? new Date(yrs[0].f).toISOString() : null;
    const [areas] = await db.select({ n: sql<number>`count(distinct ${careerStats.area})` }).from(careerStats); out.bls.areas = Number(areas?.n ?? 0);
    const ser = await db.select().from(careerSeries);
    out.nces.series = ser.length; out.nces.areas = new Set(ser.map((s) => s.area)).size;
    const nat = ser.find((s) => s.area === "US" && s.series === "nces_pub_total4");
    if (nat) { const vals = (typeof nat.values === "string" ? JSON.parse(nat.values) : nat.values) as unknown[]; out.nces.national = { from: nat.startYear, to: nat.startYear + vals.length - 1 }; out.nces.fetchedAt = nat.fetchedAt.toISOString(); }
    out.ready = out.bls.rows > 0;
    return out;
  });
}
