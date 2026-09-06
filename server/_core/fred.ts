// ============================================================
// FRED — the Federal Reserve Bank of St. Louis economic data API. Free key
// (FRED_API_KEY). This is where the platform's benchmark rates come from on
// any host: Treasury yields, the 30-year mortgage rate, the Fed funds rate,
// and the Consumer Price Index. Every value carries its own as-of date and
// source; nothing here is invented. Last-good values persist in
// market_data_points so a restart or an outage never blanks the numbers.
// ============================================================
import { getMarketPoints, upsertMarketPoint } from "../messagingDb";

export type FredSeries = "DGS3MO" | "DGS2" | "DGS5" | "DGS10" | "DGS30" | "MORTGAGE30US" | "FEDFUNDS" | "CPIAUCSL" | "CPILFESL";
export const FRED_SERIES: Record<FredSeries, { name: string; unit: string }> = {
  DGS3MO: { name: "3-Month Treasury", unit: "%" },
  DGS2: { name: "2-Year Treasury", unit: "%" },
  DGS5: { name: "5-Year Treasury", unit: "%" },
  DGS10: { name: "10-Year Treasury", unit: "%" },
  DGS30: { name: "30-Year Treasury", unit: "%" },
  MORTGAGE30US: { name: "30-Year Fixed Mortgage (Freddie Mac PMMS)", unit: "%" },
  FEDFUNDS: { name: "Effective Federal Funds Rate", unit: "%" },
  CPIAUCSL: { name: "CPI, All Urban Consumers", unit: "index" },
  CPILFESL: { name: "Core CPI (less food and energy)", unit: "index" },
};

export type Observation = { date: string; value: number };
export type Benchmark = { series: FredSeries; name: string; unit: string; value: number; asOf: string; source: "live" | "cached" | "unavailable"; fetchedAt: string };

export function fredConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.FRED_API_KEY);
}

type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;
let _fetch: Fetcher = (url) => fetch(url, { signal: AbortSignal.timeout(8000) });
export function _setFetchForTests(f: Fetcher | null) { _fetch = f ?? ((url) => fetch(url, { signal: AbortSignal.timeout(8000) })); }

/** Every observation from `observationStart` (YYYY-MM-DD), oldest first, blanks dropped. Any FRED series id. */
export async function fetchFredObservationsSince(seriesId: string, observationStart: string, env: NodeJS.ProcessEnv = process.env): Promise<Observation[]> {
  const key = env.FRED_API_KEY;
  if (!key) return [];
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(key)}&file_type=json&sort_order=asc&observation_start=${observationStart}`;
  const res = await _fetch(url);
  if (!res.ok) throw new Error(`FRED ${seriesId} responded ${res.status}`);
  const data = (await res.json()) as { observations?: Array<{ date?: string; value?: string }> };
  return (data.observations ?? []).flatMap((o) => {
    const v = Number(o.value);
    return o.date && Number.isFinite(v) && o.value !== "." ? [{ date: o.date, value: v }] : [];
  });
}

/** Latest `limit` observations, newest first, blanks ("." on FRED) dropped. */
export async function fetchFredObservations(series: FredSeries, limit = 1, env: NodeJS.ProcessEnv = process.env): Promise<Observation[]> {
  const key = env.FRED_API_KEY;
  if (!key) return [];
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${encodeURIComponent(key)}&file_type=json&sort_order=desc&limit=${Math.max(1, Math.min(120, limit + 5))}`;
  const res = await _fetch(url);
  if (!res.ok) throw new Error(`FRED ${series} responded ${res.status}`);
  const data = (await res.json()) as { observations?: Array<{ date?: string; value?: string }> };
  const rows = (data.observations ?? []).flatMap((o) => {
    const v = Number(o.value);
    return o.date && Number.isFinite(v) && o.value !== "." ? [{ date: o.date, value: v }] : [];
  });
  return rows.slice(0, limit);
}

const memo: Partial<Record<FredSeries, { at: number; obs: Observation[] }>> = {};
const MEMO_TTL = 4 * 60 * 60 * 1000;

/** Live → memo → database last-good → unavailable. Never a made-up number. */
export async function getBenchmark(series: FredSeries, env: NodeJS.ProcessEnv = process.env): Promise<Benchmark> {
  const meta = FRED_SERIES[series];
  const now = Date.now();
  const m = memo[series];
  if (m && now - m.at < MEMO_TTL && m.obs[0]) return { series, ...meta, value: m.obs[0].value, asOf: m.obs[0].date, source: "cached", fetchedAt: new Date(m.at).toISOString() };
  if (fredConfigured(env)) {
    try {
      const obs = await fetchFredObservations(series, 1, env);
      if (obs[0]) {
        memo[series] = { at: now, obs };
        await upsertMarketPoint({ series, value: obs[0].value, asOf: obs[0].date, source: "fred" }).catch(() => undefined);
        return { series, ...meta, value: obs[0].value, asOf: obs[0].date, source: "live", fetchedAt: new Date(now).toISOString() };
      }
    } catch (error) {
      console.warn("[FRED]", series, "unavailable:", String(error).slice(0, 120));
    }
  }
  const stored = (await getMarketPoints([series]).catch(() => []))[0];
  if (stored) return { series, ...meta, value: stored.value, asOf: stored.asOf, source: "cached", fetchedAt: stored.fetchedAt.toISOString() };
  return { series, ...meta, value: NaN, asOf: "", source: "unavailable", fetchedAt: new Date(now).toISOString() };
}

export async function getBenchmarks(series: FredSeries[] = ["DGS3MO", "DGS2", "DGS5", "DGS10", "DGS30", "MORTGAGE30US", "FEDFUNDS"], env: NodeJS.ProcessEnv = process.env): Promise<Benchmark[]> {
  return Promise.all(series.map((s) => getBenchmark(s, env)));
}

/** CPI index plus the inflation rates the calculators actually use, from 13 months of observations. */
export async function getCpiFromFred(env: NodeJS.ProcessEnv = process.env): Promise<{ index: number; annualRate: number; monthlyRate: number; coreAnnualRate: number | null; asOf: string } | null> {
  if (!fredConfigured(env)) return null;
  try {
    const [all, core] = await Promise.all([fetchFredObservations("CPIAUCSL", 13, env), fetchFredObservations("CPILFESL", 13, env).catch(() => [] as Observation[])]);
    const latest = all[0];
    const prev = all[1];
    const yearAgo = all[12];
    if (!latest || !prev || !yearAgo) return null;
    const annualRate = ((latest.value / yearAgo.value) - 1) * 100;
    const monthlyRate = ((latest.value / prev.value) - 1) * 100;
    const coreAnnualRate = core[0] && core[12] ? ((core[0].value / core[12].value) - 1) * 100 : null;
    await upsertMarketPoint({ series: "CPIAUCSL", value: latest.value, asOf: latest.date, source: "fred" }).catch(() => undefined);
    return { index: latest.value, annualRate: Number(annualRate.toFixed(2)), monthlyRate: Number(monthlyRate.toFixed(2)), coreAnnualRate: coreAnnualRate == null ? null : Number(coreAnnualRate.toFixed(2)), asOf: latest.date };
  } catch (error) {
    console.warn("[FRED] CPI unavailable:", String(error).slice(0, 120));
    return null;
  }
}

export function _clearFredMemoForTests() { for (const k of Object.keys(memo)) delete memo[k as FredSeries]; }
