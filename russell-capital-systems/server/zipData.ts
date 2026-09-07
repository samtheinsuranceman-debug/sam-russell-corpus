// ============================================================
// THE ZIP ENGINE — data side. Reads the published files, folds them to one
// annual series per zip, and keeps them in zip_series with their source and
// as-of date. Four sources, all public, none keyed:
//   hpi  — FHFA House Price Index, five-digit zip, annual (XLSX)
//   zhvi — Zillow Home Value Index by zip, monthly (CSV, wide)
//   zori — Zillow Observed Rent Index by zip, monthly (CSV, wide)
//   pmms — Freddie Mac 30-year rate, weekly, national (FRED)
// Nothing is typed in by hand. A file that does not answer leaves the last
// stored series in place with its old as-of date, and the status says so.
// ============================================================
import { inflateRawSync } from "node:zlib";
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { zipSeries, type ZipSeriesRow } from "../drizzle/schema";
import { fetchFredObservationsSince } from "./_core/fred";
import { ZIP_SOURCES, annualAverage, annualFromMonthly, backcastLevels, cohortSummary, zipReport, type AnnualSeries, type CohortSummary, type ZipReport } from "@shared/zipEngine";

export type SeriesId = "hpi" | "zhvi" | "zori" | "pmms";
export type Parsed = { zip: string; series: SeriesId; data: AnnualSeries; asOf: string; meta?: { state?: string; city?: string; county?: string; metro?: string } };

// ─── Transport ──────────────────────────────────────────────────────────────
type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; text: () => Promise<string>; arrayBuffer: () => Promise<ArrayBuffer> }>;
const UA = "RussellCapitalSystems/1.0 (+https://www.russellcapitalsystems.com; public-data reader)";
const realFetch: Fetcher = (url) => fetch(url, { signal: AbortSignal.timeout(120_000), headers: { "user-agent": UA, accept: "text/csv, application/octet-stream, */*" } });
let _fetch: Fetcher = realFetch;
export function _setZipFetchForTests(f: Fetcher | null) { _fetch = f ?? realFetch; }

// ─── A minimal ZIP-container reader (XLSX is a zip of XML); no dependency ───
/** Returns the named entries of a .zip/.xlsx buffer, inflated. */
export function unzipEntries(buf: Buffer, wanted: (name: string) => boolean): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  // End of central directory record.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66_000); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("not a zip container");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let k = 0; k < count; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    p += 46 + nlen + elen + clen;
    if (!wanted(name)) continue;
    const lnlen = buf.readUInt16LE(off + 26), lelen = buf.readUInt16LE(off + 28);
    const start = off + 30 + lnlen + lelen;
    const raw = buf.subarray(start, start + csize);
    out.set(name, method === 8 ? inflateRawSync(raw) : Buffer.from(raw));
  }
  return out;
}

const decodeXml = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

/** The first worksheet of an XLSX as rows of strings/numbers (shared strings resolved, inline strings read). */
export function xlsxRows(buf: Buffer): Array<Array<string | number | null>> {
  const entries = unzipEntries(buf, (n) => n === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet1\.xml$/.test(n));
  const sharedXml = entries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const shared: string[] = [];
  for (const m of Array.from(sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g))) shared.push(decodeXml(Array.from(m[1]!.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map((t) => t[1]).join("")));
  const sheet = entries.get("xl/worksheets/sheet1.xml")?.toString("utf8");
  if (!sheet) throw new Error("xlsx has no sheet1");
  const rows: Array<Array<string | number | null>> = [];
  for (const row of Array.from(sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g))) {
    const cells: Array<string | number | null> = [];
    for (const c of Array.from(row[1]!.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g))) {
      const col = c[1]!.split("").reduce((n: number, ch: string) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
      const attrs = c[2] ?? "", inner = c[3] ?? "";
      let v: string | number | null = null;
      const vm = inner.match(/<v>([\s\S]*?)<\/v>/);
      if (/t="s"/.test(attrs)) v = vm ? shared[Number(vm[1])] ?? null : null;
      else if (/t="inlineStr"/.test(attrs)) { const t = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/); v = t ? decodeXml(t[1]!) : null; }
      else if (/t="str"/.test(attrs)) v = vm ? decodeXml(vm[1]!) : null;
      else if (vm) { const n = Number(vm[1]); v = Number.isFinite(n) ? n : vm[1]!; }
      while (cells.length < col) cells.push(null);
      cells[col] = v;
    }
    rows.push(cells);
  }
  return rows;
}

// ─── Parsers ────────────────────────────────────────────────────────────────
const zip5 = (v: unknown): string | null => { const s = String(v ?? "").trim().replace(/\.0$/, ""); return /^\d{1,5}$/.test(s) ? s.padStart(5, "0") : null; };

/** FHFA hpi_at_zip5.xlsx: long format, one row per zip per year. Uses the 2000-based index where present, else the plain HPI. */
export function parseFhfaZip5(rows: Array<Array<string | number | null>>): Parsed[] {
  const head = rows.findIndex((r) => r.some((c) => /five-digit zip/i.test(String(c ?? ""))) && r.some((c) => /^year$/i.test(String(c ?? "").trim())));
  if (head < 0) throw new Error("FHFA zip5: header row not found");
  const h = rows[head]!.map((c) => String(c ?? "").trim().toLowerCase());
  const iZip = h.findIndex((c) => c.includes("five-digit zip")), iYear = h.findIndex((c) => c === "year");
  let iIdx = h.findIndex((c) => c.includes("hpi with 2000 base"));
  if (iIdx < 0) iIdx = h.findIndex((c) => c === "hpi");
  if (iIdx < 0) throw new Error("FHFA zip5: index column not found");
  const byZip = new Map<string, Map<number, number>>();
  let maxYear = 0;
  for (let i = head + 1; i < rows.length; i++) {
    const r = rows[i]!;
    const z = zip5(r[iZip]), y = Number(r[iYear]), v = Number(r[iIdx]);
    if (!z || !Number.isFinite(y) || !Number.isFinite(v) || v <= 0) continue;
    let m = byZip.get(z); if (!m) { m = new Map(); byZip.set(z, m); }
    m.set(y, v); if (y > maxYear) maxYear = y;
  }
  const out: Parsed[] = [];
  byZip.forEach((m, z) => {
    const ys = Array.from(m.keys()).sort((a, b) => a - b);
    const values: Array<number | null> = [];
    for (let y = ys[0]!; y <= ys[ys.length - 1]!; y++) values.push(m.get(y) ?? null);
    out.push({ zip: z, series: "hpi", data: { startYear: ys[0]!, values }, asOf: String(ys[ys.length - 1]) });
  });
  return out;
}

/** Zillow wide CSV: identifier columns, then one column per month. Streams line by line; RFC-4180 quotes handled. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseZillowWide(text: string, series: "zhvi" | "zori"): Parsed[] {
  const lines = text.split(/\r?\n/);
  const header = splitCsvLine(lines[0] ?? "");
  const iName = header.indexOf("RegionName"), iType = header.indexOf("RegionType"), iState = header.indexOf("State"), iCity = header.indexOf("City"), iMetro = header.indexOf("Metro"), iCounty = header.indexOf("CountyName");
  if (iName < 0) throw new Error(`Zillow ${series}: RegionName column not found`);
  const dateCols = header.map((c, i) => (/^\d{4}-\d{2}(-\d{2})?$/.test(c) ? i : -1)).filter((i) => i >= 0);
  if (!dateCols.length) throw new Error(`Zillow ${series}: no month columns`);
  const asOf = header[dateCols[dateCols.length - 1]!]!;
  const out: Parsed[] = [];
  for (let li = 1; li < lines.length; li++) {
    const line = lines[li]; if (!line) continue;
    const cells = splitCsvLine(line);
    if (iType >= 0 && cells[iType] && cells[iType] !== "zip") continue;
    const z = zip5(cells[iName]); if (!z) continue;
    const monthly: Record<string, number | null> = {};
    for (const i of dateCols) { const v = cells[i]; if (v && v !== "") { const n = Number(v); if (Number.isFinite(n)) monthly[header[i]!] = n; } }
    const data = annualFromMonthly(monthly);
    if (!data) continue;
    out.push({ zip: z, series, data, asOf, meta: { state: cells[iState] || undefined, city: cells[iCity] || undefined, county: cells[iCounty] || undefined, metro: cells[iMetro] || undefined } });
  }
  return out;
}

// ─── Fetch each source ──────────────────────────────────────────────────────
const SRC = Object.fromEntries(ZIP_SOURCES.map((s) => [s.id, s])) as Record<SeriesId, (typeof ZIP_SOURCES)[number]>;

export async function readFhfa(): Promise<Parsed[]> {
  const res = await _fetch(SRC.hpi.url);
  if (!res.ok) throw new Error(`FHFA responded ${res.status}`);
  return parseFhfaZip5(xlsxRows(Buffer.from(await res.arrayBuffer())));
}
export async function readZillow(series: "zhvi" | "zori"): Promise<Parsed[]> {
  const res = await _fetch(SRC[series].url);
  if (!res.ok) throw new Error(`Zillow ${series} responded ${res.status}`);
  return parseZillowWide(await res.text(), series);
}
export async function readPmms(env: NodeJS.ProcessEnv = process.env): Promise<Parsed[]> {
  const obs = await fetchFredObservationsSince("MORTGAGE30US", "1971-01-01", env);
  const data = annualAverage(obs);
  if (!data) return [];
  return [{ zip: "US", series: "pmms", data, asOf: obs[obs.length - 1]!.date }];
}

// ─── Storage ────────────────────────────────────────────────────────────────
export async function storeParsed(rows: Parsed[]): Promise<number> {
  const db = await getDb();
  if (!db || !rows.length) return 0;
  let n = 0;
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH).map((r) => ({ zip: r.zip, series: r.series, startYear: r.data.startYear, values: r.data.values, asOf: r.asOf.slice(0, 10), source: SRC[r.series].url.slice(0, 200), meta: r.meta ?? null, fetchedAt: new Date() }));
    try {
      await db.insert(zipSeries).values(chunk).onDuplicateKeyUpdate({ set: { startYear: sql`VALUES(startYear)`, values: sql`VALUES(\`values\`)`, asOf: sql`VALUES(asOf)`, source: sql`VALUES(source)`, meta: sql`VALUES(meta)`, fetchedAt: new Date() } });
      n += chunk.length;
    } catch (e) { console.warn("[zip] store failed at", i, String((e as { cause?: { sqlMessage?: string } })?.cause?.sqlMessage ?? e).slice(0, 200)); }
  }
  memo.clear();
  return n;
}

export type SweepResult = { hpi: number | string; zhvi: number | string; zori: number | string; pmms: number | string; stored: number; ms: number };
let sweeping: Promise<SweepResult> | null = null;
/** Read every source and store what answered. Each source fails on its own; the others still land. */
export function zipSweep(env: NodeJS.ProcessEnv = process.env): Promise<SweepResult> {
  if (sweeping) return sweeping;
  sweeping = (async () => {
    const t0 = Date.now();
    const out: SweepResult = { hpi: 0, zhvi: 0, zori: 0, pmms: 0, stored: 0, ms: 0 };
    const jobs: Array<[SeriesId, () => Promise<Parsed[]>]> = [["pmms", () => readPmms(env)], ["hpi", readFhfa], ["zhvi", () => readZillow("zhvi")], ["zori", () => readZillow("zori")]];
    for (const [id, job] of jobs) {
      try { const rows = await job(); out[id] = rows.length; out.stored += await storeParsed(rows); }
      catch (e) { out[id] = String(e).slice(0, 160); console.warn("[zip]", id, out[id]); }
    }
    out.ms = Date.now() - t0;
    console.log("[zip] sweep", JSON.stringify(out));
    return out;
  })().finally(() => { sweeping = null; });
  return sweeping;
}

/** Opt-in schedule: ZIP_DATA_DAYS=30 re-reads the files monthly (first pass two minutes after boot). Off unless set. */
export function startZipSchedule(env: NodeJS.ProcessEnv = process.env): boolean {
  const days = Number(env.ZIP_DATA_DAYS ?? 0);
  if (!Number.isFinite(days) || days <= 0) return false;
  setTimeout(() => { zipSweep(env).catch(() => undefined); }, 120_000).unref();
  setInterval(() => { zipSweep(env).catch(() => undefined); }, days * 86_400_000).unref();
  return true;
}

// ─── Reads ──────────────────────────────────────────────────────────────────
const memo = new Map<string, { at: number; value: unknown }>();
const MEMO_TTL = 6 * 60 * 60 * 1000;
async function memoised<T>(key: string, f: () => Promise<T>): Promise<T> {
  const m = memo.get(key);
  if (m && Date.now() - m.at < MEMO_TTL) return m.value as T;
  const value = await f();
  memo.set(key, { at: Date.now(), value });
  return value;
}
const toSeries = (r: ZipSeriesRow): AnnualSeries => ({ startYear: r.startYear, values: (typeof r.values === "string" ? JSON.parse(r.values) : r.values) as Array<number | null> });

export async function seriesFor(zip: string, series: SeriesId): Promise<{ data: AnnualSeries; asOf: string; source: string; meta: ZipSeriesRow["meta"] } | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(zipSeries).where(sql`${zipSeries.zip} = ${zip} and ${zipSeries.series} = ${series}`).limit(1);
  const r = rows[0];
  return r ? { data: toSeries(r), asOf: r.asOf, source: r.source, meta: r.meta } : null;
}

/** Every zip's dollar levels (Zillow, back-cast with FHFA) — the cohort is computed from this in memory. */
export async function allLevels(): Promise<Map<string, AnnualSeries>> {
  return memoised("levels", async () => {
    const db = await getDb();
    const out = new Map<string, AnnualSeries>();
    if (!db) return out;
    const hpi = new Map<string, AnnualSeries>();
    for (const r of await db.select().from(zipSeries).where(eq(zipSeries.series, "hpi"))) hpi.set(r.zip, toSeries(r));
    for (const r of await db.select().from(zipSeries).where(eq(zipSeries.series, "zhvi"))) { const b = backcastLevels(toSeries(r), hpi.get(r.zip) ?? null); if (b) out.set(r.zip, b.levels); }
    return out;
  });
}

export async function pmms(): Promise<{ data: AnnualSeries; asOf: string } | null> {
  return memoised("pmms", async () => { const s = await seriesFor("US", "pmms"); return s ? { data: s.data, asOf: s.asOf } : null; });
}

export type ZipStatus = { series: Array<{ id: SeriesId; name: string; publisher: string; url: string; note: string; zips: number; asOf: string | null; fetchedAt: string | null }>; ready: boolean };
export async function zipStatus(): Promise<ZipStatus> {
  const db = await getDb();
  const series: ZipStatus["series"] = [];
  for (const s of ZIP_SOURCES) {
    let zips = 0, asOf: string | null = null, fetchedAt: string | null = null;
    if (db) {
      const rows = await db.select({ n: sql<number>`count(*)`, asOf: sql<string>`max(${zipSeries.asOf})`, fetchedAt: sql<Date>`max(${zipSeries.fetchedAt})` }).from(zipSeries).where(eq(zipSeries.series, s.id));
      zips = Number(rows[0]?.n ?? 0); asOf = rows[0]?.asOf ?? null; fetchedAt = rows[0]?.fetchedAt ? new Date(rows[0].fetchedAt).toISOString() : null;
    }
    series.push({ id: s.id, name: s.name, publisher: s.publisher, url: s.url, note: s.note, zips, asOf, fetchedAt });
  }
  return { series, ready: series.some((s) => s.id === "zhvi" && s.zips > 0) };
}

export type ZipAnswer = { report: ZipReport; sources: Partial<Record<SeriesId, { asOf: string; url: string }>>; meta: ZipSeriesRow["meta"] };
export async function reportFor(zip: string, opts: { startYear: number; threshold: number; yearsAhead?: number }): Promise<ZipAnswer> {
  const [z, h, r] = await Promise.all([seriesFor(zip, "zhvi"), seriesFor(zip, "hpi"), seriesFor(zip, "zori")]);
  const report = zipReport(zip, { zhvi: z?.data ?? null, hpi: h?.data ?? null, rent: r?.data ?? null }, opts);
  const sources: ZipAnswer["sources"] = {};
  if (z) sources.zhvi = { asOf: z.asOf, url: z.source };
  if (h) sources.hpi = { asOf: h.asOf, url: h.source };
  if (r) sources.zori = { asOf: r.asOf, url: r.source };
  return { report, sources, meta: z?.meta ?? r?.meta ?? null };
}

export async function cohortFor(threshold: number, startYear: number): Promise<CohortSummary> {
  return memoised(`cohort:${threshold}:${startYear}`, async () => cohortSummary(await allLevels(), threshold, startYear));
}

/** The earliest and latest years any zip covers — the slider's range. */
export async function yearRange(): Promise<{ min: number; max: number } | null> {
  return memoised("range", async () => {
    const levels = await allLevels();
    let min = Infinity, max = -Infinity;
    levels.forEach((s) => { min = Math.min(min, s.startYear); max = Math.max(max, s.startYear + s.values.length - 1); });
    return Number.isFinite(min) ? { min, max } : null;
  });
}

export function _clearZipMemoForTests() { memo.clear(); }
