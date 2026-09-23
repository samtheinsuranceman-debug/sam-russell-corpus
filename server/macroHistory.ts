/**
 * Macro History — full-length keyless series for the factor panel (W8).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The factor rows in `shared/macro/indicators.ts` name a series key each
 * ("fred:T10Y3M", "nyfed:acm", …). This file turns a key into one keyless URL,
 * parses the whole history the publisher offers, drops implausible readings,
 * and hands back the points plus the coverage the brief prints
 * (`earliestAsOf`, `coverageYears`). Storage is month-end downsampled plus the
 * latest reading, so forty years of a daily series is ~500 rows, not 10,000.
 *
 * Degradation rule: a source that stops answering leaves the stored rows in
 * place (`cached`); a source that answers with something the parser cannot
 * use, or with more than 5 % implausible readings, is `unavailable` with the
 * reason — nothing is backfilled from memory or from the seed.
 *
 * Transport: `getText` in macroConnectors.ts (allow-list, 15 s, 5 MB,
 * redirects on the list only). Parse only; raw bodies are never stored.
 *
 * PORT TO THE TRUNK: copies unchanged with `macroConnectors.ts`; on the
 * trunk the FRED branch may call `_core/fred.ts` instead of `fredgraph.csv`
 * once that module exposes full-history reads (today it returns one value).
 */
import {
  A,
  ALL_FACTORS,
  FACTOR_TARGET_SERIES,
  SOURCE_BY_ID,
  backtestFactor,
  transformSeries,
  coverageYears,
  type FactorVerdict,
  type Indicator,
  type SeriesMeta,
  type MonthlyPoint,
} from "@shared/macro";
import { getText, parseFredCsv, type FetchLike } from "./macroConnectors";

// ─── Series keys → URLs ───────────────────────────────────────────────────────

export type SeriesSpec = { series: string; url: string; sourceId: string; parse: (text: string) => MonthlyPoint[] };

/** Resolve a series key to its keyless endpoint and parser, or null when the key is unknown. */
export function seriesSpec(series: string): SeriesSpec | null {
  const [kind, ...rest] = series.split(":");
  const key = rest.join(":");
  switch (kind) {
    case "fred":
      return { series, sourceId: "fred", url: `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(key)}`, parse: t => parseFredCsv(t, series, "fred").map(o => ({ asOf: o.asOf, value: o.value })) };
    case "nyfed":
      if (key === "acm") return { series, sourceId: "nyfed-acm", url: "https://www.newyorkfed.org/medialibrary/media/research/data_indicators/ACMTermPremium.csv", parse: parseAcmCsv };
      if (key === "soma") return { series, sourceId: "nyfed-soma", url: "https://markets.newyorkfed.org/api/soma/summary.json", parse: parseSomaSummary };
      return null;
    case "fiscaldata":
      if (key === "avg_interest_rates") return { series, sourceId: "fiscaldata-debt", url: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?filter=security_desc:eq:Total%20Marketable&sort=record_date&page[size]=10000", parse: parseFiscalAvgRates };
      return null;
    case "worldbank":
      return { series, sourceId: "wb-wdi-api", url: `https://api.worldbank.org/v2/country/WLD/indicator/${encodeURIComponent(key)}?format=json&per_page=200`, parse: parseWorldBankSeries };
    case "tic":
      if (rest[0] === "history") return { series, sourceId: "us-tic-mfh", url: "https://ticdata.treasury.gov/Publish/mfhhis01.txt", parse: t => parseTicHistory(t, rest.slice(1).join(":")) };
      return null;
    default:
      return null;
  }
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map(c => c.trim());
}

/** NY Fed ACM CSV: header names the columns (DATE, ACMTP10, …); dates are MM/DD/YYYY. Takes ACMTP10. */
export function parseAcmCsv(csv: string): MonthlyPoint[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]);
  const di = header.findIndex(h => /^date$/i.test(h));
  const vi = header.findIndex(h => /^ACMTP10$/i.test(h));
  if (di < 0 || vi < 0) return [];
  const out: MonthlyPoint[] = [];
  for (const line of lines.slice(1)) {
    const c = splitCsvLine(line);
    const asOf = usDateToIso(c[di] ?? "");
    const v = Number(c[vi]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || !Number.isFinite(v)) continue;
    out.push({ asOf, value: v });
  }
  return out;
}

function usDateToIso(d: string): string {
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return d.slice(0, 10);
}

/** NY Fed Markets API SOMA summary: { soma: { summary: [ { asOfDate, bills, notesbonds, tips, frn, … } ] } }, USD. Sums the Treasury lines into USD bn. */
export function parseSomaSummary(json: string): MonthlyPoint[] {
  const data = JSON.parse(json) as { soma?: { summary?: Array<Record<string, string | number>> } };
  const rows = data.soma?.summary ?? [];
  const out: MonthlyPoint[] = [];
  for (const r of rows) {
    const asOf = String(r.asOfDate ?? "").slice(0, 10);
    const parts = ["bills", "notesbonds", "tips", "frn"].map(k => Number(String(r[k] ?? "0").replace(/,/g, "")));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || parts.some(p => !Number.isFinite(p))) continue;
    const total = parts.reduce((s, p) => s + p, 0);
    if (total <= 0) continue;
    out.push({ asOf, value: Math.round(total / 1e9 * 1000) / 1000 });
  }
  return out.sort((a, b) => (a.asOf < b.asOf ? -1 : 1));
}

/** Fiscal Data avg_interest_rates: { data: [ { record_date, security_desc, avg_interest_rate_amt } ] }, filtered to Total Marketable. */
export function parseFiscalAvgRates(json: string): MonthlyPoint[] {
  const data = JSON.parse(json) as { data?: Array<Record<string, string>> };
  return (data.data ?? [])
    .filter(r => /total marketable/i.test(r.security_desc ?? ""))
    .map(r => ({ asOf: (r.record_date ?? "").slice(0, 10), value: Number(r.avg_interest_rate_amt) }))
    .filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.asOf) && Number.isFinite(p.value))
    .sort((a, b) => (a.asOf < b.asOf ? -1 : 1));
}

/** World Bank API: [ meta, [ { date: "2024", value: 2.7 | null } ] ]; annual, dated to year end. */
export function parseWorldBankSeries(json: string): MonthlyPoint[] {
  const data = JSON.parse(json) as [unknown, Array<{ date: string; value: number | null }> | null];
  const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
  return rows
    .filter(r => r.value !== null && Number.isFinite(Number(r.value)) && /^\d{4}$/.test(r.date))
    .map(r => ({ asOf: `${r.date}-12-31`, value: Number(r.value) }))
    .sort((a, b) => (a.asOf < b.asOf ? -1 : 1));
}

const MONTHS: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

/**
 * TIC historical major-foreign-holders file (mfhhis01.txt): blocks of a header
 * line with month columns ("Jul 2026  Jun 2026 …") followed by one line per
 * holder ("Japan   1103.9  1116.7 …"). Every block is read; the named row's
 * values are dated to the month-end of their column.
 */
export function parseTicHistory(text: string, rowLabel: string): MonthlyPoint[] {
  const out = new Map<string, number>();
  let months: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const heads = Array.from(line.matchAll(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/g));
    if (heads.length >= 3) {
      months = heads.map(m => `${m[2]}-${MONTHS[m[1]]}`);
      continue;
    }
    if (!months.length) continue;
    if (!line.toLowerCase().startsWith(rowLabel.toLowerCase())) continue;
    const nums = line.slice(rowLabel.length).match(/-?\d[\d,]*\.?\d*/g) ?? [];
    for (let i = 0; i < Math.min(nums.length, months.length); i++) {
      const v = Number(nums[i].replace(/,/g, ""));
      if (!Number.isFinite(v)) continue;
      const [y, m] = months[i].split("-").map(Number);
      const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
      out.set(`${months[i]}-${String(last).padStart(2, "0")}`, v);
    }
  }
  return Array.from(out.entries()).map(([asOf, value]) => ({ asOf, value })).sort((a, b) => (a.asOf < b.asOf ? -1 : 1));
}

// ─── Plausibility and coverage ────────────────────────────────────────────────

export function plausibleSeries(points: MonthlyPoint[], min: number, max: number): { kept: MonthlyPoint[]; dropped: number } {
  const kept = points.filter(p => p.value >= min && p.value <= max && /^\d{4}-\d{2}-\d{2}$/.test(p.asOf));
  return { kept, dropped: points.length - kept.length };
}

/** The first reading (so earliestAsOf is the publisher's), then the last reading of every month, including the latest (which may be mid-month). */
export function downsampleForStorage(points: MonthlyPoint[]): MonthlyPoint[] {
  const byMonth = new Map<string, MonthlyPoint>();
  const sorted = [...points].sort((a, b) => (a.asOf < b.asOf ? -1 : 1));
  for (const p of sorted) byMonth.set(p.asOf.slice(0, 7), p);
  const out = Array.from(byMonth.values());
  if (sorted.length && out[0]?.asOf !== sorted[0].asOf) out.unshift(sorted[0]);
  return out;
}

export type HistoryPull = {
  indicatorId: string;
  series: string;
  sourceId: string;
  status: "live" | "unavailable";
  reason?: string;
  points: MonthlyPoint[];
  dropped: number;
  earliestAsOf: string | null;
  latestAsOf: string | null;
  coverageYears: number;
  ms: number;
};

/** Which series the factor panel needs stored: every factor's base (and denominator) and every target. */
export function historyManifest(): Array<{ indicatorId: string; series: string; sourceId: string; min: number; max: number; publishedFrom: string }> {
  const rows: Array<{ indicatorId: string; series: string; sourceId: string; min: number; max: number; publishedFrom: string }> = [];
  const seen = new Set<string>();
  for (const f of ALL_FACTORS) {
    const spec = f.factor!;
    const baseId = spec.transform === "level" ? f.id : `${f.id}:base`;
    if (!seen.has(spec.series)) {
      seen.add(spec.series);
      rows.push({ indicatorId: baseId, series: spec.series, sourceId: f.sourceIds[0], min: spec.min, max: spec.max, publishedFrom: spec.publishedFrom });
    }
    if (spec.denominator && !seen.has(spec.denominator)) {
      seen.add(spec.denominator);
      rows.push({ indicatorId: `${f.id}:denominator`, series: spec.denominator, sourceId: f.sourceIds[0], min: 0, max: Number.MAX_SAFE_INTEGER, publishedFrom: spec.publishedFrom });
    }
  }
  for (const t of FACTOR_TARGET_SERIES) {
    if (seen.has(t.series)) continue;
    seen.add(t.series);
    rows.push({ indicatorId: t.indicatorId, series: t.series, sourceId: t.sourceId, min: t.min, max: t.max, publishedFrom: t.publishedFrom });
  }
  return rows;
}

/** Pull one series. Never throws: the result carries the status and the reason. */
export async function pullHistory(fetchImpl: FetchLike, row: { indicatorId: string; series: string; min: number; max: number }): Promise<HistoryPull> {
  const t0 = Date.now();
  const spec = seriesSpec(row.series);
  const base = { indicatorId: row.indicatorId, series: row.series, sourceId: spec?.sourceId ?? "unknown", points: [] as MonthlyPoint[], dropped: 0, earliestAsOf: null, latestAsOf: null, coverageYears: 0 };
  if (!spec) return { ...base, status: "unavailable", reason: `unknown series key ${row.series}`, ms: Date.now() - t0 };
  if (!SOURCE_BY_ID.has(spec.sourceId)) return { ...base, status: "unavailable", reason: `source ${spec.sourceId} not registered`, ms: Date.now() - t0 };
  let parsed: MonthlyPoint[];
  try {
    parsed = spec.parse(await getText(fetchImpl, spec.url));
  } catch (e) {
    return { ...base, status: "unavailable", reason: (e as Error).message.slice(0, 480), ms: Date.now() - t0 };
  }
  if (!parsed.length) return { ...base, status: "unavailable", reason: "answered with no parseable rows", ms: Date.now() - t0 };
  const { kept, dropped } = plausibleSeries(parsed, row.min, row.max);
  if (dropped / parsed.length > A("history.maxDroppedShare")) {
    return { ...base, dropped, status: "unavailable", reason: `${dropped} of ${parsed.length} readings outside [${row.min}, ${row.max}]; format change suspected, nothing stored`, ms: Date.now() - t0 };
  }
  const stored = downsampleForStorage(kept);
  const earliestAsOf = stored[0]?.asOf ?? null;
  const latestAsOf = stored[stored.length - 1]?.asOf ?? null;
  return { ...base, status: "live", points: stored, dropped, earliestAsOf, latestAsOf, coverageYears: coverageYears(earliestAsOf, latestAsOf), ms: Date.now() - t0 };
}

// ─── Storage (the only database code in this file) ───────────────────────────

type Db = NonNullable<Awaited<ReturnType<typeof import("./db").getDb>>>;

/** Insert the points that are not already stored for the indicator; upsert the series meta. */
export async function storeHistory(db: Db, pull: HistoryPull, priorMeta?: { status: string; points: number } | null): Promise<{ inserted: number }> {
  const { macroObservations, macroSeriesMeta } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  let inserted = 0;
  if (pull.status === "live") {
    const existing = await db.select({ asOf: macroObservations.asOf }).from(macroObservations).where(eq(macroObservations.indicatorId, pull.indicatorId));
    const have = new Set(existing.map(r => r.asOf));
    const fresh = pull.points.filter(p => !have.has(p.asOf));
    for (let i = 0; i < fresh.length; i += 500) {
      const chunk = fresh.slice(i, i + 500).map(p => ({ indicatorId: pull.indicatorId, sourceId: pull.sourceId, asOf: p.asOf, value: String(p.value), origin: "history", note: pull.series.slice(0, 500) }));
      if (chunk.length) await db.insert(macroObservations).values(chunk);
      inserted += chunk.length;
    }
  }
  // Status: live when it answered; cached when it did not but rows exist; unavailable otherwise.
  const status: SeriesMeta["status"] = pull.status === "live" ? "live" : (priorMeta?.points ?? 0) > 0 ? "cached" : "unavailable";
  const [row] = await db.select().from(macroSeriesMeta).where(eq(macroSeriesMeta.indicatorId, pull.indicatorId)).limit(1);
  const values = {
    indicatorId: pull.indicatorId,
    sourceId: pull.sourceId,
    series: pull.series.slice(0, 120),
    earliestAsOf: pull.status === "live" ? pull.earliestAsOf : row?.earliestAsOf ?? null,
    latestAsOf: pull.status === "live" ? pull.latestAsOf : row?.latestAsOf ?? null,
    coverageYears: String(pull.status === "live" ? pull.coverageYears : Number(row?.coverageYears ?? 0)),
    points: pull.status === "live" ? pull.points.length : row?.points ?? 0,
    status,
    reason: pull.reason?.slice(0, 500) ?? null,
    droppedLastRun: pull.dropped,
  };
  if (row) await db.update(macroSeriesMeta).set(values).where(eq(macroSeriesMeta.indicatorId, pull.indicatorId));
  else await db.insert(macroSeriesMeta).values(values);
  return { inserted };
}

/** Stored points for one indicator, oldest first. */
export async function loadSeries(db: Db, indicatorId: string): Promise<MonthlyPoint[]> {
  const { macroObservations } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select({ asOf: macroObservations.asOf, value: macroObservations.value }).from(macroObservations).where(eq(macroObservations.indicatorId, indicatorId));
  return rows.map(r => ({ asOf: r.asOf, value: Number(r.value) })).filter(p => Number.isFinite(p.value)).sort((a, b) => (a.asOf < b.asOf ? -1 : 1));
}

export async function loadSeriesMeta(db: Db): Promise<SeriesMeta[]> {
  const { macroSeriesMeta } = await import("../drizzle/schema");
  const rows = await db.select().from(macroSeriesMeta);
  return rows.map(r => ({ indicatorId: r.indicatorId, sourceId: r.sourceId, earliestAsOf: r.earliestAsOf, latestAsOf: r.latestAsOf, coverageYears: Number(r.coverageYears), points: r.points, status: r.status as SeriesMeta["status"], reason: r.reason ?? undefined }));
}

// ─── Orchestration ────────────────────────────────────────────────────────────

export type HistoryRunResult = {
  pulls: Array<Pick<HistoryPull, "indicatorId" | "series" | "sourceId" | "status" | "reason" | "dropped" | "earliestAsOf" | "latestAsOf" | "coverageYears" | "ms"> & { inserted: number; points: number }>;
  live: number;
  unavailable: number;
  inserted: number;
};

/** Pull and store every series in the manifest. Never throws. */
export async function runHistoryRefresh(opts: { fetchImpl?: FetchLike; only?: string[]; db?: Db | null } = {}): Promise<HistoryRunResult> {
  const fetchImpl = opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const db = opts.db === undefined ? await (await import("./db")).getDb() : opts.db;
  const pulls: HistoryRunResult["pulls"] = [];
  let inserted = 0;
  for (const row of historyManifest()) {
    if (opts.only && !opts.only.includes(row.series) && !opts.only.includes(row.indicatorId)) continue;
    const pull = await pullHistory(fetchImpl, row);
    let ins = 0;
    if (db) {
      try {
        ins = (await storeHistory(db, pull)).inserted;
      } catch (e) {
        pull.status = "unavailable";
        pull.reason = `store failed: ${(e as Error).message.slice(0, 300)}`;
      }
    }
    inserted += ins;
    const { points, ...rest } = pull;
    pulls.push({ ...rest, inserted: ins, points: points.length });
  }
  return { pulls, live: pulls.filter(p => p.status === "live").length, unavailable: pulls.filter(p => p.status !== "live").length, inserted };
}

/** The factor's transformed monthly series from stored base rows (and denominator), or [] when nothing is stored. */
export async function factorSeries(db: Db, factor: Indicator): Promise<MonthlyPoint[]> {
  const spec = factor.factor;
  if (!spec) return [];
  const baseId = spec.transform === "level" ? factor.id : `${factor.id}:base`;
  const base = await loadSeries(db, baseId);
  const den = spec.denominator ? await loadSeries(db, `${factor.id}:denominator`) : [];
  return transformSeries(spec.transform, base, den);
}

/** Backtest every factor against its stored target. Pure arithmetic on stored rows; verdicts are returned, the caller persists. */
export async function backtestAllFactors(db: Db, today: string): Promise<FactorVerdict[]> {
  const out: FactorVerdict[] = [];
  const targetCache = new Map<string, MonthlyPoint[]>();
  for (const f of ALL_FACTORS) {
    const spec = f.factor!;
    let target = targetCache.get(spec.target);
    if (!target) {
      const targetFactor = ALL_FACTORS.find(x => x.id === spec.target);
      target = targetFactor ? await factorSeries(db, targetFactor) : await loadSeries(db, spec.target);
      targetCache.set(spec.target, target);
    }
    const points = await factorSeries(db, f);
    out.push(
      backtestFactor(f.id, points, target, {
        horizonMonths: spec.horizonMonths,
        direction: f.direction,
        neutral: spec.neutral,
        span: spec.span,
        targetKind: spec.targetKind,
        minN: A("factor.backtest.minN"),
        minAbsR: A("factor.backtest.minAbsR"),
        minHitRate: A("factor.backtest.minHitRate"),
        neutralBand: A("factor.backtest.neutralBand"),
        today,
      }),
    );
  }
  return out;
}
