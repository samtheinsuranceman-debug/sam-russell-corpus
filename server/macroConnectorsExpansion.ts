/**
 * Macro Connectors — the twenty-five-domain expansion, free tier.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Two kinds of connector, both keyless unless the registry names a key:
 *
 *   • NUMBER connectors — one machine-readable endpoint → observations. The
 *     parsers are generic by wire format (SDMX CSV, IMF SDMX-JSON, Fiscal Data
 *     JSON, Fed DDP CSV, GDELT timeline JSON, Socrata JSON, plain JSON paths)
 *     so a new series is a table row, not a new parser.
 *
 *   • STATEMENT connectors — an official RSS feed → `StatementDraft`s for the
 *     ledger (pending until an outcome is coded on the 36-hour review) plus one
 *     observation: how many relevant items landed today. The relevance filter
 *     is a keyword regex per feed, stated in the table.
 *
 * PORT TO THE TRUNK: copies unchanged with `macroConnectors.ts`. Nothing here
 * touches a database; the router persists.
 */
import type { Observation } from "@shared/macro";
import { getText, parseRss, type Connector, type FetchLike, type StatementDraft } from "./macroConnectors";

// ─── Generic parsers ──────────────────────────────────────────────────────────

/** SDMX CSV (ECB, BIS, OECD): header names the columns; we want TIME_PERIOD and OBS_VALUE. */
export function parseSdmxCsv(csv: string, indicatorId: string, sourceId: string): Observation[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const ti = header.findIndex(h => /^TIME_PERIOD$/i.test(h));
  const vi = header.findIndex(h => /^OBS_VALUE$/i.test(h));
  if (ti < 0 || vi < 0) return [];
  const out: Observation[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line);
    const t = cells[ti]?.trim();
    const v = Number(cells[vi]);
    if (!t || !Number.isFinite(v)) continue;
    out.push({ indicatorId, asOf: periodToDate(t), value: v, sourceId });
  }
  return out;
}

/** IMF SDMX-JSON CompactData: DataSet.Series.Obs[] with @TIME_PERIOD / @OBS_VALUE. */
export function parseImfSdmxJson(json: string, indicatorId: string, sourceId = "imf-ifs"): Observation[] {
  const data = JSON.parse(json) as { CompactData?: { DataSet?: { Series?: { Obs?: Array<Record<string, string>> } | Array<{ Obs?: Array<Record<string, string>> }> } } };
  const series = data.CompactData?.DataSet?.Series;
  const first = Array.isArray(series) ? series[0] : series;
  const obs = first?.Obs ?? [];
  return obs
    .map(o => ({ indicatorId, asOf: periodToDate(o["@TIME_PERIOD"] ?? ""), value: Number(o["@OBS_VALUE"]), sourceId }))
    .filter(o => o.asOf && Number.isFinite(o.value));
}

/** Fiscal Data API: { data: [ { record_date, <field> } ] }. */
export function parseFiscalData(json: string, field: string, indicatorId: string, sourceId: string): Observation[] {
  const data = JSON.parse(json) as { data?: Array<Record<string, string>> };
  return (data.data ?? [])
    .map(r => ({ indicatorId, asOf: r.record_date, value: Number(String(r[field] ?? "").replace(/,/g, "")), sourceId }))
    .filter(o => o.asOf && Number.isFinite(o.value));
}

/** Fed Data Download Program CSV: several descriptive header rows, then "Time Period,<series>" rows. */
export function parseFedDdpCsv(csv: string, indicatorId: string, sourceId = "fed-ddp"): Observation[] {
  const out: Observation[] = [];
  for (const line of csv.split(/\r?\n/)) {
    const cells = splitCsv(line);
    if (cells.length < 2) continue;
    const t = cells[0].trim().replace(/^"|"$/g, "");
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(t)) continue;
    const v = Number(cells[1]);
    if (!Number.isFinite(v)) continue;
    out.push({ indicatorId, asOf: periodToDate(t), value: v, sourceId });
  }
  return out;
}

/** GDELT DOC API timelinevol: { timeline: [ { series, data: [ { date: "YYYYMMDDTHHMMSSZ", value } ] } ] }. Returns the 30-day mean. */
export function parseGdeltTimeline(json: string, indicatorId: string, today: string, sourceId = "gdelt-doc-api"): Observation[] {
  const data = JSON.parse(json) as { timeline?: Array<{ data?: Array<{ date: string; value: number }> }> };
  const points = (data.timeline?.[0]?.data ?? []).filter(p => Number.isFinite(p.value));
  if (!points.length) return [];
  const last30 = points.slice(-30);
  const mean = last30.reduce((s, p) => s + p.value, 0) / last30.length;
  return [{ indicatorId, asOf: today, value: Math.round(mean * 10_000) / 10_000, sourceId, note: `${last30.length}-day mean of daily volume` }];
}

/** OFR FSI CSV: "Date,OFR FSI,..." newest last. */
export function parseOfrFsi(csv: string, sourceId = "ofr-fsi"): Observation[] {
  const lines = csv.trim().split(/\r?\n/);
  const header = splitCsv(lines[0] ?? "");
  const di = header.findIndex(h => /date/i.test(h));
  const vi = header.findIndex(h => /^OFR FSI$/i.test(h.trim()));
  if (di < 0 || vi < 0) return [];
  const out: Observation[] = [];
  for (const line of lines.slice(1)) {
    const c = splitCsv(line);
    const v = Number(c[vi]);
    const d = c[di]?.trim();
    if (!d || !Number.isFinite(v)) continue;
    out.push({ indicatorId: "ofr-fsi", asOf: usDateToIso(d), value: v, sourceId });
  }
  return out;
}

/** CFTC Socrata JSON (Traders in Financial Futures): pick 10-year note rows and net leveraged-fund position. */
export function parseCftcTff(json: string, sourceId = "cftc-cot"): Observation[] {
  const rows = JSON.parse(json) as Array<Record<string, string>>;
  const out: Observation[] = [];
  for (const r of rows) {
    const name = (r.market_and_exchange_names ?? r.contract_market_name ?? "").toUpperCase();
    if (!/10-YEAR|10 YEAR|UST 10Y/.test(name)) continue;
    const long = Number(r.lev_money_positions_long_all ?? r.lev_money_positions_long ?? "");
    const short = Number(r.lev_money_positions_short_all ?? r.lev_money_positions_short ?? "");
    const date = (r.report_date_as_yyyy_mm_dd ?? "").slice(0, 10);
    if (!date || !Number.isFinite(long) || !Number.isFinite(short)) continue;
    out.push({ indicatorId: "cftc-lev-funds-ust-short", asOf: date, value: short - long, sourceId, note: name.slice(0, 80) });
    break;
  }
  return out;
}

/** Generic JSON: walk `path` (dot-separated, [n] allowed) to a value and a date. */
export function parseJsonPath(json: string, spec: { valuePath: string; datePath?: string; indicatorId: string; sourceId: string; today: string; scale?: number }): Observation[] {
  const data = JSON.parse(json);
  const v = Number(walk(data, spec.valuePath));
  if (!Number.isFinite(v)) return [];
  const rawDate = spec.datePath ? String(walk(data, spec.datePath) ?? "") : "";
  const asOf = rawDate ? periodToDate(rawDate.slice(0, 10)) : spec.today;
  return [{ indicatorId: spec.indicatorId, asOf, value: v * (spec.scale ?? 1), sourceId: spec.sourceId }];
}

function walk(obj: unknown, path: string): unknown {
  let cur: any = obj;
  for (const part of path.split(".").filter(Boolean)) {
    const m = part.match(/^([^[]*)(?:\[(\d+)\])?$/);
    if (!m) return undefined;
    if (m[1]) cur = cur?.[m[1]];
    if (m[2] !== undefined) cur = cur?.[Number(m[2])];
    if (cur === undefined) return undefined;
  }
  return cur;
}

function splitCsv(line: string): string[] {
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
  return out;
}

/** "2026-Q2" → 2026-06-30; "2026-07" → 2026-07-31; "2026" → 2026-12-31; dates pass through. */
export function periodToDate(p: string): string {
  const s = p.trim();
  let m = s.match(/^(\d{4})-Q([1-4])$/);
  if (m) {
    const month = Number(m[2]) * 3;
    return `${m[1]}-${String(month).padStart(2, "0")}-${lastDay(Number(m[1]), month)}`;
  }
  m = s.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${lastDay(Number(m[1]), Number(m[2]))}`;
  if (/^\d{4}$/.test(s)) return `${s}-12-31`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{4}-S[12]$/.test(s)) return s.endsWith("1") ? `${s.slice(0, 4)}-06-30` : `${s.slice(0, 4)}-12-31`;
  return s;
}
function lastDay(y: number, m: number) {
  return String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0");
}
function usDateToIso(d: string): string {
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return d.slice(0, 10);
}

// ─── Number connectors ────────────────────────────────────────────────────────

type NumberSpec = {
  sourceId: string;
  indicatorId: string;
  url: string | ((env: NodeJS.ProcessEnv) => string | null);
  parse: (text: string, today: string) => Observation[];
};

const NUMBER_SPECS: NumberSpec[] = [
  { sourceId: "fed-ddp", indicatorId: "fed-effr", url: "https://www.federalreserve.gov/datadownload/Output.aspx?rel=H15&series=c27939ee810cb2e929a920a6bd77d9f6&lastobs=5&from=&to=&filetype=csv&label=include&layout=seriescolumn", parse: t => parseFedDdpCsv(t, "fed-effr").slice(-1) },
  { sourceId: "fiscaldata-debt", indicatorId: "us-debt-to-penny", url: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1", parse: t => parseFiscalData(t, "tot_pub_debt_out_amt", "us-debt-to-penny", "fiscaldata-debt").map(o => ({ ...o, value: o.value / 1e9, note: "USD bn, Debt to the Penny" })) },
  { sourceId: "ecb-data-portal", indicatorId: "ecb-mro", url: "https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.MRR_FR.LEV?format=csvdata&lastNObservations=1", parse: t => parseSdmxCsv(t, "ecb-mro", "ecb-data-portal") },
  { sourceId: "target2-balances", indicatorId: "target2-de", url: "https://data-api.ecb.europa.eu/service/data/TGB/M.DE.N.A094T.U2.EUR.E?format=csvdata&lastNObservations=1", parse: t => parseSdmxCsv(t, "target2-de", "target2-balances") },
  { sourceId: "bis-stats-api", indicatorId: "bis-credit-gap-us", url: "https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CREDIT_GAP/1.0/Q.US.P.A.C?format=csv&lastNObservations=1", parse: t => parseSdmxCsv(t, "bis-credit-gap-us", "bis-stats-api") },
  { sourceId: "imf-ifs", indicatorId: "imf-japan-reserves-ifs", url: "https://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/M.JP.RAFA_USD?startPeriod=2025", parse: t => parseImfSdmxJson(t, "imf-japan-reserves-ifs").slice(-1).map(o => ({ ...o, value: o.value / 1e3 })) },
  { sourceId: "gdelt-doc-api", indicatorId: "gdelt-taiwan-volume", url: "https://api.gdeltproject.org/api/v2/doc/doc?query=%22Taiwan%20blockade%22&mode=timelinevol&format=json&timespan=90d", parse: (t, today) => parseGdeltTimeline(t, "gdelt-taiwan-volume", today) },
  { sourceId: "gdelt-doc-api", indicatorId: "gdelt-treasury-dump-volume", url: "https://api.gdeltproject.org/api/v2/doc/doc?query=%22China%22%20%22Treasury%22%20(sell%20OR%20dump)&mode=timelinevol&format=json&timespan=90d", parse: (t, today) => parseGdeltTimeline(t, "gdelt-treasury-dump-volume", today) },
  { sourceId: "ofr-fsi", indicatorId: "ofr-fsi", url: "https://www.financialresearch.gov/financial-stress-index/data/fsi.csv", parse: t => parseOfrFsi(t).slice(-1) },
  { sourceId: "fred-hy-oas", indicatorId: "hy-oas", url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=BAMLH0A0HYM2", parse: t => fredCsvLast(t, "hy-oas", "fred-hy-oas", 100) },
  { sourceId: "cftc-cot", indicatorId: "cftc-lev-funds-ust-short", url: "https://publicreporting.cftc.gov/resource/gpe5-46if.json?$limit=200&$order=report_date_as_yyyy_mm_dd%20DESC", parse: t => parseCftcTff(t) },
  { sourceId: "bcb-sgs", indicatorId: "bcb-selic", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json", parse: (t, today) => parseJsonPath(t, { valuePath: "[0].valor", datePath: "[0].data", indicatorId: "bcb-selic", sourceId: "bcb-sgs", today }).map(o => ({ ...o, asOf: brDateToIso(o.asOf) })) },
  { sourceId: "bcra-api", indicatorId: "bcra-policy-rate", url: "https://api.bcra.gob.ar/estadisticas/v3.0/monetarias/1", parse: (t, today) => parseJsonPath(t, { valuePath: "results[0].detalle[0].valor", datePath: "results[0].detalle[0].fecha", indicatorId: "bcra-policy-rate", sourceId: "bcra-api", today }) },
  { sourceId: "nhc-hurricanes", indicatorId: "nhc-active-storms", url: "https://www.nhc.noaa.gov/CurrentStorms.json", parse: (t, today) => { const d = JSON.parse(t) as { activeStorms?: unknown[] }; return [{ indicatorId: "nhc-active-storms", asOf: today, value: (d.activeStorms ?? []).length, sourceId: "nhc-hurricanes" }]; } },
  { sourceId: "unhcr-data", indicatorId: "unhcr-displaced", url: "https://api.unhcr.org/population/v1/population/?limit=1&yearFrom=2024", parse: (t, today) => parseJsonPath(t, { valuePath: "items[0].refugees", datePath: "items[0].year", indicatorId: "unhcr-displaced", sourceId: "unhcr-data", today, scale: 1e-6 }) },
  { sourceId: "crea-fossil-tracker", indicatorId: "russia-fossil-revenue-daily", url: "https://api.russiafossiltracker.com/v0/counter_last", parse: (t, today) => parseJsonPath(t, { valuePath: "data[0].eur_per_day", indicatorId: "russia-fossil-revenue-daily", sourceId: "crea-fossil-tracker", today, scale: 1e-6 }) },
];

function fredCsvLast(csv: string, indicatorId: string, sourceId: string, scale = 1): Observation[] {
  const lines = csv.trim().split(/\r?\n/).slice(1);
  for (let i = lines.length - 1; i >= 0; i--) {
    const [d, v] = lines[i].split(",");
    if (d && v && v.trim() !== "." && Number.isFinite(Number(v))) return [{ indicatorId, asOf: d.trim(), value: Number(v) * scale, sourceId }];
  }
  return [];
}
function brDateToIso(d: string): string {
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
}

function numberConnector(spec: NumberSpec): Connector {
  return {
    sourceId: spec.sourceId,
    indicatorIds: [spec.indicatorId],
    async run(fetchImpl, env, today) {
      const url = typeof spec.url === "function" ? spec.url(env) : spec.url;
      if (!url) throw new Error("key not set");
      return spec.parse(await getText(fetchImpl, url), today);
    },
  };
}

// ─── Statement connectors ─────────────────────────────────────────────────────

type StatementSpec = {
  sourceId: string;
  indicatorId: string;
  url: string;
  speaker: string;
  channel: string;
  category: string;
  /** Headlines that count. */
  keywords: RegExp;
  severity?: StatementDraft["severity"];
};

/** The feeds, in build order. Keywords are deliberately narrow: a ledger of everything is a ledger of nothing. */
export const STATEMENT_SPECS: StatementSpec[] = [
  { sourceId: "fed-press-all", indicatorId: "fed-statements-30d", url: "https://www.federalreserve.gov/feeds/press_all.xml", speaker: "Federal Reserve Board", channel: "Press release", category: "rate-guidance", keywords: /FOMC|federal funds|balance sheet|rate|inflation|guidance|facility|stress/i },
  { sourceId: "fed-speeches", indicatorId: "fed-statements-30d", url: "https://www.federalreserve.gov/feeds/speeches.xml", speaker: "Federal Reserve official", channel: "Speech", category: "rate-guidance", keywords: /inflation|rate|outlook|policy|balance sheet|financial stability|Treasury/i },
  { sourceId: "bis-speeches", indicatorId: "bis-speeches-30d", url: "https://www.bis.org/doclist/cbspeeches.rss", speaker: "Central bank governor (via BIS)", channel: "Speech", category: "rate-guidance", keywords: /./ },
  { sourceId: "imf-press", indicatorId: "imf-programmes-active", url: "https://www.imf.org/en/news/rss?language=eng", speaker: "International Monetary Fund", channel: "Press release", category: "programme-condition", keywords: /Executive Board|approves|Article IV|arrangement|disbursement|review/i },
  { sourceId: "opec-press", indicatorId: "opec-statements-90d", url: "https://www.opec.org/opec_web/en/pressreleases.rss", speaker: "OPEC Secretariat", channel: "Communiqué", category: "quota-decision", keywords: /production|Ministerial|JMMC|adjust|cut|barrels|Declaration of Cooperation/i, severity: "warning" },
  { sourceId: "whitehouse-briefing", indicatorId: "us-presidential-docs-30d", url: "https://www.whitehouse.gov/feed/", speaker: "President of the United States", channel: "Statement / executive order", category: "trade-measure", keywords: /tariff|China|Taiwan|sanction|Treasury|debt|trade|export control/i },
  { sourceId: "ustr-notices", indicatorId: "gta-harmful-measures-30d", url: "https://ustr.gov/rss.xml", speaker: "U.S. Trade Representative", channel: "Notice", category: "trade-measure", keywords: /Section 301|tariff|China|investigation|exclusion/i, severity: "warning" },
  { sourceId: "ecb-press", indicatorId: "ecb-mro", url: "https://www.ecb.europa.eu/rss/press.html", speaker: "European Central Bank", channel: "Press release", category: "rate-guidance", keywords: /Monetary policy decision|rate|asset purchase|TPI|inflation|Governing Council/i },
  { sourceId: "boe-mpc", indicatorId: "boe-bank-rate", url: "https://www.bankofengland.co.uk/rss/news", speaker: "Bank of England", channel: "Press release", category: "rate-guidance", keywords: /Bank Rate|Monetary Policy|Financial Policy|gilt|inflation/i },
  { sourceId: "un-press-rss", indicatorId: "unhcr-displaced", url: "https://press.un.org/en/rss.xml", speaker: "United Nations", channel: "Press release", category: "security-commitment", keywords: /Security Council|sanction|resolution|ceasefire|Taiwan|Iran|Russia/i },
  { sourceId: "iaea-statements", indicatorId: "ucdp-active-conflicts", url: "https://www.iaea.org/feeds/topnews", speaker: "International Atomic Energy Agency", channel: "Statement", category: "security-commitment", keywords: /Iran|enrichment|safeguards|Director General|Board of Governors/i },
  { sourceId: "rbi-mpc", indicatorId: "rbi-repo-rate", url: "https://www.rbi.org.in/pressreleases_rss.xml", speaker: "Reserve Bank of India", channel: "Press release", category: "rate-guidance", keywords: /Monetary Policy|repo rate|rupee|reserves|Governor/i },
  { sourceId: "ambest-actions", indicatorId: "ambest-downgrades-30d", url: "https://news.ambest.com/rss/pressreleases.aspx", speaker: "AM Best", channel: "Rating action", category: "regulatory-rule", keywords: /downgrade|under review|negative|withdraw/i, severity: "warning" },
  { sourceId: "gao", indicatorId: "us-net-interest-mts", url: "https://www.gao.gov/rss/reports.xml", speaker: "Government Accountability Office", channel: "Report", category: "fiscal-forecast", keywords: /debt|fiscal|Treasury|deficit|Social Security|Medicare/i },
  { sourceId: "wef-davos", indicatorId: "wef-top-risk-rank-geoeconomic", url: "https://www.weforum.org/feeds/press.rss", speaker: "World Economic Forum", channel: "Press release", category: "consensus-forecast", keywords: /risk|outlook|economists|growth|recession|geoeconomic/i },
  { sourceId: "cn-politburo-readouts", indicatorId: "cn-politburo-tone", url: "https://english.news.cn/rss/china.xml", speaker: "CCP Politburo (via Xinhua)", channel: "Readout", category: "growth-target", keywords: /Politburo|economic work|Central Economic Work Conference|growth target|Xi Jinping.*econom/i },
];

function statementConnector(spec: StatementSpec): Connector {
  return {
    sourceId: spec.sourceId,
    indicatorIds: [spec.indicatorId],
    async run(fetchImpl, _env, today) {
      const xml = await getText(fetchImpl, spec.url);
      const items = parseRss(xml, spec.sourceId).filter(i => spec.keywords.test(i.title));
      const statements: StatementDraft[] = items.slice(0, 40).map(i => ({
        statementDate: rssDateToIso(i.pubDate) || today,
        speaker: spec.speaker,
        channel: spec.channel,
        category: spec.category,
        severity: spec.severity ?? "routine",
        environment: "calm",
        claim: i.title.slice(0, 500),
        sourceId: spec.sourceId,
        sourceUrl: i.link || undefined,
      }));
      return {
        observations: [{ indicatorId: spec.indicatorId, asOf: today, value: items.length, sourceId: spec.sourceId, note: items.slice(0, 5).map(i => i.title).join(" | ").slice(0, 480) }],
        statements,
      };
    },
  };
}

export function rssDateToIso(pub: string): string {
  if (!pub) return "";
  const t = Date.parse(pub);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : "";
}

export const EXPANSION_NUMBER_CONNECTORS: Connector[] = NUMBER_SPECS.map(numberConnector);
export const EXPANSION_STATEMENT_CONNECTORS: Connector[] = STATEMENT_SPECS.map(statementConnector);
export const EXPANSION_CONNECTORS: Connector[] = [...EXPANSION_NUMBER_CONNECTORS, ...EXPANSION_STATEMENT_CONNECTORS];

/** For tests and the status page: every feed the expansion pulls, with its wire format. */
export function expansionConnectorInventory(): Array<{ sourceId: string; indicatorId: string; kind: "number" | "statement"; url: string }> {
  return [
    ...NUMBER_SPECS.map(s => ({ sourceId: s.sourceId, indicatorId: s.indicatorId, kind: "number" as const, url: typeof s.url === "string" ? s.url : "(keyed)" })),
    ...STATEMENT_SPECS.map(s => ({ sourceId: s.sourceId, indicatorId: s.indicatorId, kind: "statement" as const, url: s.url })),
  ];
}
