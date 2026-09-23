/**
 * Macro Connectors — the daily pull from the source registry.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * ─── PORT TO THE TRUNK ──────────────────────────────────────────────────────
 * The trunk already has `server/_core/fred.ts` (keyed JSON + keyless CSV,
 * memoised, persisted to `market_data_points`). Do not carry a second FRED
 * transport onto it. On the trunk:
 *
 *   1. In `server/_core/index.ts` (or wherever the app boots), call
 *        setBenchmarkProvider(async s => { const b = await getBenchmark(s as FredSeries); return b.source === "unavailable" ? null : { value: b.value, asOf: b.asOf }; });
 *      with `getBenchmark` imported from `./_core/fred`.
 *   2. Delete `parseFredCsv`, `parseFredJson` and the two `getText` branches
 *      inside `fredConnector.run` marked "LOCAL TRANSPORT"; keep the
 *      provider branch. The tests for those two parsers go with them
 *      (`macroConnectors.test.ts` → "parsers" → the first two cases).
 *   3. `FRED_SERIES` here lists three ids the trunk's `FredSeries` union lacks
 *      (`DTWEXBGS`, `T10YIE`, `GFDEGDQ188S`, `FDHBFIN`, `DEXJPUS`, `DEXCHUS`,
 *      `DCOILBRENTEU`): add them to the trunk's `FRED_SERIES` map in
 *      `_core/fred.ts` (one line each; the transport is generic).
 *
 * Every other connector here is new to the trunk and ports unchanged.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Each connector turns one source into observations (indicator id, as-of,
 * value, source id). They share three rules:
 *
 *   1. Twelve-second timeout, one attempt, never throw out of `runAll`. A dead
 *      feed is recorded in `macro_source_health` and the engines keep running
 *      on the last-good row.
 *   2. Keyless where possible. FRED has a CSV path that needs no key; Treasury
 *      TIC publishes a plain-text table; IMF's datamapper is open JSON. Keys
 *      are read from the environment variable the registry names.
 *   3. Every observation carries the source's own as-of date, not the fetch
 *      date. A July TIC figure fetched in September is a July observation.
 *
 * `fetchImpl` is injectable so the tests run against recorded fixtures and
 * never touch the network.
 */
import { SOURCE_BY_ID, MACRO_SOURCES, A, type Observation } from "@shared/macro";
import { TREASURY_HOLDINGS } from "@shared/macro";

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal; redirect?: "manual" | "follow" | "error" },
) => Promise<{ ok: boolean; status: number; text(): Promise<string>; headers?: { get(name: string): string | null } }>;

/** A declared position pulled from an official feed, landing in `macro_statements` as `pending` until an outcome is coded. */
export type StatementDraft = {
  statementDate: string;
  speaker: string;
  channel: string;
  category: string;
  severity: "routine" | "warning" | "threat" | "ultimatum";
  environment: string;
  claim: string;
  sourceId: string;
  /** Citation. Required for anything that reaches the ledger (W8). */
  sourceUrl?: string;
  /** W8 — office held when the claim was made; Wikidata item of the speaker when resolved. */
  office?: string;
  speakerQid?: string;
};

export type ConnectorOutput = Observation[] | { observations: Observation[]; statements?: StatementDraft[] };

export type ConnectorResult = {
  sourceId: string;
  ok: boolean;
  observations: Observation[];
  statements: StatementDraft[];
  detail: string;
  ms: number;
};

export type Connector = {
  sourceId: string;
  /** Which indicators this connector can fill. */
  indicatorIds: string[];
  run(fetchImpl: FetchLike, env: NodeJS.ProcessEnv, today: string): Promise<ConnectorOutput>;
};

// ─── Transport rules (packet W8) ──────────────────────────────────────────────
// Every fetch: allow-listed host only, no private addresses, redirects
// followed only onto the allow-list (three hops), fifteen seconds, five
// megabytes, parse only. Raw bodies are never stored; the caller keeps the
// parsed rows and the health row.

const TIMEOUT_MS = A("history.timeoutMs");
const MAX_BYTES = A("history.maxBytes");
const MAX_REDIRECTS = 3;

/** Data hosts the connectors use that a registry landing page does not name. */
export const EXTRA_ALLOWED_HOSTS = [
  "fred.stlouisfed.org", "api.stlouisfed.org",
  "ticdata.treasury.gov", "home.treasury.gov", "api.fiscaldata.treasury.gov",
  "www.federalreserve.gov", "markets.newyorkfed.org", "www.newyorkfed.org",
  "www.financialresearch.gov", "publicreporting.cftc.gov",
  "stats.bis.org", "www.bis.org",
  "dataservices.imf.org", "www.imf.org",
  "api.worldbank.org", "search.worldbank.org",
  "sdmx.oecd.org", "data-api.ecb.europa.eu", "www.ecb.europa.eu",
  "www.stat-search.boj.or.jp", "www.boj.or.jp",
  "api.eia.gov", "comtradeapi.un.org",
  "api.gdeltproject.org", "query.wikidata.org", "www.wikidata.org",
  "api.bcb.gov.br", "api.bcra.gob.ar", "www.nhc.noaa.gov", "api.unhcr.org", "api.russiafossiltracker.com",
  "www.opec.org", "www.whitehouse.gov", "ustr.gov", "www.bankofengland.co.uk",
  "press.un.org", "www.iaea.org", "www.rbi.org.in", "news.ambest.com", "www.gao.gov", "www.weforum.org",
];

let allowed: Set<string> | null = null;
/** Registry hosts (landing page and API endpoint of every source) plus the explicit data hosts. */
export function allowedHosts(): Set<string> {
  if (allowed) return allowed;
  const set = new Set<string>(EXTRA_ALLOWED_HOSTS);
  for (const s of MACRO_SOURCES) {
    for (const u of [s.url, s.apiUrl]) {
      if (!u) continue;
      try {
        set.add(new URL(u.replace("{KEY}", "key")).hostname.toLowerCase());
      } catch {
        /* a registry URL that does not parse is not a host */
      }
    }
  }
  allowed = set;
  return set;
}

/** Loopback, link-local, RFC 1918, unique-local, metadata and bare-IP hosts are refused before any DNS happens. */
export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || h === "metadata.google.internal") return true;
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return true; // any other bare IPv4 literal: the allow-list is by name, so a literal is refused too
  }
  if (h.includes(":")) return true; // IPv6 literals: refused for the same reason
  return false;
}

export function checkUrl(url: string): { ok: true; host: string } | { ok: false; reason: string } {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, reason: "malformed URL" };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false, reason: `scheme ${u.protocol} refused` };
  const host = u.hostname.toLowerCase();
  if (isPrivateHost(host)) return { ok: false, reason: `private or literal address refused: ${host}` };
  if (!allowedHosts().has(host)) return { ok: false, reason: `host not on the allow-list: ${host}` };
  return { ok: true, host };
}

export async function getText(fetchImpl: FetchLike, url: string, headers: Record<string, string> = {}, hop = 0): Promise<string> {
  const check = checkUrl(url);
  if (!check.ok) throw new Error(check.reason);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { headers: { "User-Agent": "RussellCapitalSystems-Macro/1.0", ...headers }, signal: ctl.signal, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers?.get("location") ?? "";
      if (!loc) throw new Error(`HTTP ${res.status} redirect without a location`);
      if (hop >= MAX_REDIRECTS) throw new Error(`too many redirects (${hop})`);
      const next = new URL(loc, url).toString();
      const nextCheck = checkUrl(next);
      if (!nextCheck.ok) throw new Error(`redirect refused: ${nextCheck.reason}`);
      return getText(fetchImpl, next, headers, hop + 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const declared = Number(res.headers?.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > MAX_BYTES) throw new Error(`response too large: ${declared} bytes (cap ${MAX_BYTES})`);
    const text = await res.text();
    if (text.length > MAX_BYTES) throw new Error(`response too large: ${text.length} bytes (cap ${MAX_BYTES})`);
    return text;
  } finally {
    clearTimeout(t);
  }
}

// ─── FRED ─────────────────────────────────────────────────────────────────────

/** FRED series → indicator id. */
export const FRED_SERIES: Record<string, { indicatorId: string; unit: string }> = {
  DGS10: { indicatorId: "ust10y", unit: "%" },
  DGS30: { indicatorId: "fred:DGS30", unit: "%" },
  MORTGAGE30US: { indicatorId: "mortgage30y", unit: "%" },
  DTWEXBGS: { indicatorId: "dxy", unit: "index" },
  T10YIE: { indicatorId: "breakeven10y", unit: "%" },
  GFDEGDQ188S: { indicatorId: "fred:GFDEGDQ188S", unit: "% of GDP" },
  FDHBFIN: { indicatorId: "fred:FDHBFIN", unit: "USD bn" },
  DEXJPUS: { indicatorId: "fred:DEXJPUS", unit: "JPY per USD" },
  DEXCHUS: { indicatorId: "usdcny", unit: "CNY per USD" },
  DCOILBRENTEU: { indicatorId: "fred:DCOILBRENTEU", unit: "USD/bbl" },
};

/** Parse FRED's keyless CSV: header `observation_date,VALUE` (or `DATE,VALUE`), `.` for missing. */
export function parseFredCsv(csv: string, indicatorId: string, sourceId = "fred"): Observation[] {
  const lines = csv.trim().split(/\r?\n/);
  const out: Observation[] = [];
  for (const line of lines.slice(1)) {
    const [date, raw] = line.split(",");
    if (!date || raw === undefined || raw.trim() === ".") continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    out.push({ indicatorId, asOf: date.trim(), value, sourceId });
  }
  return out;
}

/** Parse FRED's JSON API response. */
export function parseFredJson(json: string, indicatorId: string, sourceId = "fred"): Observation[] {
  const data = JSON.parse(json) as { observations?: Array<{ date: string; value: string }> };
  return (data.observations ?? [])
    .filter(o => o.value !== ".")
    .map(o => ({ indicatorId, asOf: o.date, value: Number(o.value), sourceId }))
    .filter(o => Number.isFinite(o.value));
}

/**
 * A benchmark provider: the trunk's `_core/fred.ts` `getBenchmark`, adapted.
 * When set, `fredConnector` asks it first and only falls back to the local
 * transports when it returns null. On the trunk the local transports are
 * deleted and the provider is the only path.
 */
export type BenchmarkProvider = (series: string) => Promise<{ value: number; asOf: string } | null>;
let benchmarkProvider: BenchmarkProvider | null = null;
export function setBenchmarkProvider(p: BenchmarkProvider | null) {
  benchmarkProvider = p;
}

export const fredConnector: Connector = {
  sourceId: "fred",
  indicatorIds: Object.values(FRED_SERIES).map(s => s.indicatorId),
  async run(fetchImpl, env) {
    const key = env.FRED_API_KEY?.trim();
    const out: Observation[] = [];
    for (const [series, meta] of Object.entries(FRED_SERIES)) {
      try {
        if (benchmarkProvider) {
          const b = await benchmarkProvider(series);
          if (b) {
            out.push({ indicatorId: meta.indicatorId, asOf: b.asOf, value: b.value, sourceId: "fred", note: `FRED ${series} (trunk _core/fred)` });
            continue;
          }
        }
        // LOCAL TRANSPORT — delete on the trunk (see header).
        if (key) {
          const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${key}&file_type=json&sort_order=desc&limit=5`;
          const obs = parseFredJson(await getText(fetchImpl, url), meta.indicatorId);
          if (obs[0]) out.push({ ...obs[0], note: `FRED ${series} (keyed)` });
        } else {
          const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`;
          const obs = parseFredCsv(await getText(fetchImpl, url), meta.indicatorId);
          const last = obs[obs.length - 1];
          if (last) out.push({ ...last, note: `FRED ${series} (keyless CSV)` });
        }
      } catch (e) {
        // One dead series must not sink the rest.
        console.warn(`[macro] FRED ${series}: ${(e as Error).message}`);
      }
    }
    return out;
  },
};

// ─── Treasury TIC — Major Foreign Holders (mfh.txt) ───────────────────────────

/**
 * Parse the plain-text TIC table. Rows look like:
 *   Japan               1103.9  1116.7  1136.0 ...
 * Columns run newest-first; the header row carries the months.
 */
export function parseTicMfh(text: string, sourceId = "us-tic-mfh"): Observation[] {
  const lines = text.split(/\r?\n/);
  const header = lines.find(l => /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(l) && /\d{4}/.test(l));
  let asOf = "";
  if (header) {
    const m = header.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/);
    if (m) {
      const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(m[1]) + 1;
      const y = Number(m[2]);
      const lastDay = new Date(Date.UTC(y, month, 0)).getUTCDate();
      asOf = `${y}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }
  }
  if (!asOf) return [];
  const want: Array<{ re: RegExp; id: string }> = [
    { re: /^\s*Japan\b/i, id: "tic:japan" },
    { re: /^\s*China,?\s*Mainland\b/i, id: "tic:china" },
    { re: /^\s*United Kingdom\b/i, id: "tic:uk" },
    { re: /^\s*Hong Kong\b/i, id: "tic:hongkong" },
    { re: /^\s*Belgium\b/i, id: "tic:belgium" },
    { re: /^\s*Saudi Arabia\b/i, id: "tic:saudi" },
    { re: /^\s*India\b/i, id: "tic:india" },
    { re: /^\s*Grand Total\b/i, id: "tic:total" },
  ];
  const out: Observation[] = [];
  for (const line of lines) {
    for (const w of want) {
      if (!w.re.test(line)) continue;
      const nums = line.replace(w.re, "").trim().split(/\s+/).map(Number).filter(n => Number.isFinite(n));
      if (nums.length >= 4) {
        out.push({ indicatorId: w.id, asOf, value: nums[0], sourceId, note: "TIC Table 5, USD bn" });
        // Three-month change, the panel indicator.
        const threeMonthChange = nums[0] - nums[3];
        if (w.id === "tic:japan") out.push({ indicatorId: "jp-tic-mom", asOf, value: threeMonthChange, sourceId, note: `${nums[3]} → ${nums[0]}` });
        if (w.id === "tic:china") out.push({ indicatorId: "cn-tic-mom", asOf, value: threeMonthChange, sourceId, note: `${nums[3]} → ${nums[0]}` });
      }
    }
  }
  return out;
}

export const ticConnector: Connector = {
  sourceId: "us-tic-mfh",
  indicatorIds: ["jp-tic-mom", "cn-tic-mom", "tic:japan", "tic:china", "tic:total"],
  async run(fetchImpl) {
    const text = await getText(fetchImpl, "https://ticdata.treasury.gov/Publish/mfh.txt");
    return parseTicMfh(text);
  },
};

// ─── IMF WEO datamapper ───────────────────────────────────────────────────────

export function parseImfDatamapper(json: string, indicatorCode: string, year: number, sourceId = "imf-weo"): Observation[] {
  const data = JSON.parse(json) as { values?: Record<string, Record<string, Record<string, number>>> };
  const byCountry = data.values?.[indicatorCode] ?? {};
  const out: Observation[] = [];
  for (const [iso3, years] of Object.entries(byCountry)) {
    const v = years?.[String(year)];
    if (typeof v === "number" && Number.isFinite(v)) {
      out.push({ indicatorId: `imf:${indicatorCode}:${iso3}`, asOf: `${year}-12-31`, value: v, sourceId, note: `WEO ${year}` });
    }
  }
  return out;
}

export const imfConnector: Connector = {
  sourceId: "imf-weo",
  indicatorIds: ["imf:GGXWDG_NGDP:*"],
  async run(fetchImpl, _env, today) {
    const year = Number(today.slice(0, 4));
    const json = await getText(fetchImpl, `https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP?periods=${year - 1},${year}`);
    return [...parseImfDatamapper(json, "GGXWDG_NGDP", year - 1), ...parseImfDatamapper(json, "GGXWDG_NGDP", year)];
  },
};

// ─── EIA Brent ────────────────────────────────────────────────────────────────

export function parseEia(json: string, indicatorId: string, sourceId = "eia-api"): Observation[] {
  const data = JSON.parse(json) as { response?: { data?: Array<{ period: string; value: number | string }> } };
  return (data.response?.data ?? [])
    .map(d => ({ indicatorId, asOf: d.period.length === 10 ? d.period : `${d.period}-01`, value: Number(d.value), sourceId }))
    .filter(o => Number.isFinite(o.value));
}

export const eiaConnector: Connector = {
  sourceId: "eia-api",
  indicatorIds: ["eia:brent"],
  async run(fetchImpl, env) {
    const key = env.EIA_API_KEY?.trim();
    if (!key) throw new Error("EIA_API_KEY not set");
    const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${key}&frequency=daily&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&length=1`;
    return parseEia(await getText(fetchImpl, url), "eia:brent");
  },
};

// ─── World Bank ───────────────────────────────────────────────────────────────

export function parseWorldBank(json: string, indicatorId: string, sourceId = "worldbank-ids"): Observation[] {
  const data = JSON.parse(json) as [unknown, Array<{ countryiso3code: string; date: string; value: number | null }>];
  const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
  const out: Observation[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (r.value === null || !r.countryiso3code || seen.has(r.countryiso3code)) continue;
    seen.add(r.countryiso3code);
    out.push({ indicatorId: `${indicatorId}:${r.countryiso3code}`, asOf: `${r.date}-12-31`, value: r.value, sourceId });
  }
  return out;
}

export const worldBankConnector: Connector = {
  sourceId: "worldbank-ids",
  indicatorIds: ["wb:GC.DOD.TOTL.GD.ZS:*"],
  async run(fetchImpl) {
    const json = await getText(fetchImpl, "https://api.worldbank.org/v2/country/all/indicator/GC.DOD.TOTL.GD.ZS?format=json&mrv=1&per_page=400");
    return parseWorldBank(json, "wb:GC.DOD.TOTL.GD.ZS");
  },
};

// ─── RSS parsing (statement ledger feeds) ─────────────────────────────────────

export type FeedItem = { title: string; link: string; pubDate: string; sourceId: string };

export function parseRss(xml: string, sourceId: string): FeedItem[] {
  const items: FeedItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) ?? [])[1]?.trim() ?? "";
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) ?? [])[1]?.trim() ?? "";
    const pub = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ?? [])[1]?.trim() ?? "";
    if (title) items.push({ title, link, pubDate: pub, sourceId });
  }
  return items;
}

// No Chinese government, Party or state-media feed is read (owner's order,
// 23 Sep 2026). The Xinhua connector that counted state-media headlines is gone.

// ─── Registry and runner ──────────────────────────────────────────────────────

export const CONNECTORS: Connector[] = [fredConnector, ticConnector, imfConnector, worldBankConnector, eiaConnector];

export type RunAllResult = {
  today: string;
  results: ConnectorResult[];
  observations: Observation[];
  statements: StatementDraft[];
  okCount: number;
  failCount: number;
};

function normalise(out: ConnectorOutput): { observations: Observation[]; statements: StatementDraft[] } {
  if (Array.isArray(out)) return { observations: out, statements: [] };
  return { observations: out.observations ?? [], statements: out.statements ?? [] };
}

/**
 * Run every connector, never throw. The caller persists `observations`,
 * `statements` and `results`; the engines read whatever landed plus the seed
 * snapshot. `connectors` defaults to the core set; the router passes the core
 * plus the expansion (`macroConnectorsExpansion.ts`).
 */
export async function runAllConnectors(opts: { fetchImpl?: FetchLike; env?: NodeJS.ProcessEnv; today?: string; only?: string[]; connectors?: Connector[] } = {}): Promise<RunAllResult> {
  const fetchImpl = opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const env = opts.env ?? process.env;
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const results: ConnectorResult[] = [];
  const observations: Observation[] = [];
  const statements: StatementDraft[] = [];
  for (const c of opts.connectors ?? CONNECTORS) {
    if (opts.only && !opts.only.includes(c.sourceId)) continue;
    if (!SOURCE_BY_ID.has(c.sourceId)) continue;
    const t0 = Date.now();
    try {
      const out = normalise(await c.run(fetchImpl, env, today));
      const n = out.observations.length + out.statements.length;
      results.push({
        sourceId: c.sourceId,
        ok: n > 0,
        observations: out.observations,
        statements: out.statements,
        detail: n ? `${out.observations.length} observation(s), ${out.statements.length} statement(s)` : "answered with no rows",
        ms: Date.now() - t0,
      });
      observations.push(...out.observations);
      statements.push(...out.statements);
    } catch (e) {
      results.push({ sourceId: c.sourceId, ok: false, observations: [], statements: [], detail: (e as Error).message.slice(0, 480), ms: Date.now() - t0 });
    }
  }
  return {
    today,
    results,
    observations,
    statements,
    okCount: results.filter(r => r.ok).length,
    failCount: results.filter(r => !r.ok).length,
  };
}

/** Sanity: a TIC pull that disagrees with the snapshot by more than 30 % is a parse fault, not news. */
export function plausibleTic(obs: Observation[]): boolean {
  const jp = obs.find(o => o.indicatorId === "tic:japan");
  const cn = obs.find(o => o.indicatorId === "tic:china");
  const within = (v: number | undefined, ref: number) => v === undefined || Math.abs(v - ref) / ref < 0.3;
  return within(jp?.value, TREASURY_HOLDINGS.japan) && within(cn?.value, TREASURY_HOLDINGS.chinaMainland);
}
