import { callDataApi } from "./_core/dataApi";

export interface DataFeedEntry {
  name: string;
  value: number;
  unit: string;
  change?: number;
  changePercent?: number;
  asOf: string;
  source: "live" | "cached" | "static";
  lastUpdated: string;
}

export interface CPIData extends DataFeedEntry {
  annualRate: number;
  monthlyRate: number;
  coreRate: number;
}

export interface TreasuryData extends DataFeedEntry {
  term: string;
  yield: number;
}

export interface CommodityData extends DataFeedEntry {
  symbol: string;
  high52w: number;
  low52w: number;
}

export interface MYGARateData {
  term: number;
  bestRate: number;
  averageRate: number;
  carrier: string;
  state: string;
  asOf: string;
  source: "live" | "cached" | "static";
}

export interface DataFeedSnapshot {
  cpi: CPIData;
  treasuryRates: TreasuryData[];
  commodities: CommodityData[];
  mygaRates: MYGARateData[];
  fetchedAt: string;
  overallSource: "live" | "cached" | "static";
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttl: number;
}

const cache: Record<string, CacheEntry<unknown>> = {};
const CACHE_TTL = {
  cpi: 24 * 60 * 60 * 1000,
  treasury: 4 * 60 * 60 * 1000,
  commodities: 30 * 60 * 1000,
};

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttl) {
    delete cache[key];
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl: number) {
  cache[key] = { data, fetchedAt: Date.now(), ttl };
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function dateText(value: unknown): value is string {
  return text(value) && Number.isFinite(Date.parse(value));
}

const STATIC_CPI: CPIData = {
  name: "Consumer Price Index",
  value: 313.2,
  unit: "index",
  annualRate: 3.2,
  monthlyRate: 0.3,
  coreRate: 3.8,
  asOf: "2026-03-01",
  source: "static",
  lastUpdated: "2026-03-01T00:00:00.000Z",
};

const STATIC_TREASURY: TreasuryData[] = [
  { name: "3-Month Treasury", value: 4.35, unit: "%", term: "3m", yield: 4.35, asOf: "2026-04-09", source: "static", lastUpdated: "2026-04-09T00:00:00.000Z" },
  { name: "2-Year Treasury", value: 3.95, unit: "%", term: "2y", yield: 3.95, asOf: "2026-04-09", source: "static", lastUpdated: "2026-04-09T00:00:00.000Z" },
  { name: "5-Year Treasury", value: 3.85, unit: "%", term: "5y", yield: 3.85, asOf: "2026-04-09", source: "static", lastUpdated: "2026-04-09T00:00:00.000Z" },
  { name: "10-Year Treasury", value: 4.10, unit: "%", term: "10y", yield: 4.10, asOf: "2026-04-09", source: "static", lastUpdated: "2026-04-09T00:00:00.000Z" },
  { name: "30-Year Treasury", value: 4.45, unit: "%", term: "30y", yield: 4.45, asOf: "2026-04-09", source: "static", lastUpdated: "2026-04-09T00:00:00.000Z" },
];

const STATIC_COMMODITIES: CommodityData[] = [
  { name: "Crude Oil (WTI)", value: 72.5, unit: "$/bbl", symbol: "CL", change: -1.2, changePercent: -1.63, high52w: 95, low52w: 63, asOf: "2026-04-09", source: "static", lastUpdated: "2026-04-09T00:00:00.000Z" },
  { name: "Gold", value: 2340, unit: "$/oz", symbol: "GC", change: 12.5, changePercent: 0.54, high52w: 2450, low52w: 1950, asOf: "2026-04-09", source: "static", lastUpdated: "2026-04-09T00:00:00.000Z" },
  { name: "Silver", value: 28.5, unit: "$/oz", symbol: "SI", change: 0.35, changePercent: 1.24, high52w: 32, low52w: 22, asOf: "2026-04-09", source: "static", lastUpdated: "2026-04-09T00:00:00.000Z" },
  { name: "Natural Gas", value: 2.85, unit: "$/MMBtu", symbol: "NG", change: -0.05, changePercent: -1.72, high52w: 4.5, low52w: 1.8, asOf: "2026-04-09", source: "static", lastUpdated: "2026-04-09T00:00:00.000Z" },
];

async function fetchLiveCPI(): Promise<CPIData | null> {
  try {
    const result = await callDataApi("EconomicIndicators/cpi", {}) as { data?: Record<string, unknown> };
    const d = result?.data;
    if (!d || ![d.value, d.annualRate, d.monthlyRate, d.coreRate].every(finite) || !dateText(d.date)) return null;
    return {
      name: "Consumer Price Index",
      value: d.value as number,
      unit: "index",
      annualRate: d.annualRate as number,
      monthlyRate: d.monthlyRate as number,
      coreRate: d.coreRate as number,
      asOf: d.date as string,
      source: "live",
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    console.warn("[DataFeed] CPI provider unavailable; using dated reference data");
    return null;
  }
}

async function fetchLiveTreasury(): Promise<TreasuryData[] | null> {
  try {
    const result = await callDataApi("TreasuryRates/yields", {}) as { data?: unknown[] };
    if (!Array.isArray(result?.data)) return null;
    const rows = result.data.flatMap((raw) => {
      const d = raw as Record<string, unknown>;
      if (!text(d.term) || !finite(d.yield) || !dateText(d.date)) return [];
      return [{ name: `${d.term} Treasury`, value: d.yield, unit: "%", term: d.term, yield: d.yield, asOf: d.date, source: "live" as const, lastUpdated: new Date().toISOString() }];
    });
    return rows.length ? rows : null;
  } catch {
    console.warn("[DataFeed] Treasury provider unavailable; using dated reference data");
    return null;
  }
}

async function fetchLiveCommodities(): Promise<CommodityData[] | null> {
  try {
    const result = await callDataApi("MarketData/commodities", {}) as { data?: unknown[] };
    if (!Array.isArray(result?.data)) return null;
    const rows = result.data.flatMap((raw) => {
      const d = raw as Record<string, unknown>;
      if (!text(d.name) || !text(d.symbol) || !text(d.unit) || ![d.price, d.high52w, d.low52w].every(finite) || !dateText(d.date)) return [];
      return [{
        name: d.name,
        value: d.price as number,
        unit: d.unit,
        symbol: d.symbol,
        change: finite(d.change) ? d.change : undefined,
        changePercent: finite(d.changePercent) ? d.changePercent : undefined,
        high52w: d.high52w as number,
        low52w: d.low52w as number,
        asOf: d.date,
        source: "live" as const,
        lastUpdated: new Date().toISOString(),
      }];
    });
    return rows.length ? rows : null;
  } catch {
    console.warn("[DataFeed] Commodity provider unavailable; using dated reference data");
    return null;
  }
}

export async function getCPIData(): Promise<CPIData> {
  const cached = getCached<CPIData>("cpi");
  if (cached) return { ...cached, source: "cached" };
  const live = await fetchLiveCPI();
  if (live) setCache("cpi", live, CACHE_TTL.cpi);
  return live ?? STATIC_CPI;
}

export async function getTreasuryRates(): Promise<TreasuryData[]> {
  const cached = getCached<TreasuryData[]>("treasury");
  if (cached) return cached.map((row) => ({ ...row, source: "cached" as const }));
  const live = await fetchLiveTreasury();
  if (live) setCache("treasury", live, CACHE_TTL.treasury);
  return live ?? STATIC_TREASURY;
}

export async function getCommodityPrices(): Promise<CommodityData[]> {
  const cached = getCached<CommodityData[]>("commodities");
  if (cached) return cached.map((row) => ({ ...row, source: "cached" as const }));
  const live = await fetchLiveCommodities();
  if (live) setCache("commodities", live, CACHE_TTL.commodities);
  return live ?? STATIC_COMMODITIES;
}

export async function getMYGARates(state?: string): Promise<MYGARateData[]> {
  void state;
  return [];
}

export async function getDataFeedSnapshot(state?: string): Promise<DataFeedSnapshot> {
  const [cpi, treasuryRates, commodities, mygaRates] = await Promise.all([
    getCPIData(), getTreasuryRates(), getCommodityPrices(), getMYGARates(state),
  ]);
  const sources = [cpi.source, ...treasuryRates.map((row) => row.source), ...commodities.map((row) => row.source)];
  const overallSource = sources.every((source) => source === "live") ? "live" : sources.some((source) => source === "live" || source === "cached") ? "cached" : "static";
  return { cpi, treasuryRates, commodities, mygaRates, fetchedAt: new Date().toISOString(), overallSource };
}

export function invalidateAllFeeds() {
  Object.keys(cache).forEach((key) => delete cache[key]);
}

export function invalidateFeed(feed: "cpi" | "treasury" | "commodities" | "mygaRates") {
  if (feed === "mygaRates") return;
  delete cache[feed];
}
