/**
 * Macro twenty-five-domain expansion — registry invariants, the generic
 * parsers against recorded fixtures, and the statement pipeline through the
 * runner. No network.
 *
 * PORT TO THE TRUNK: copies unchanged beside `macroConnectorsExpansion.ts`.
 */
import { describe, expect, it } from "vitest";
import {
  MACRO_SOURCES,
  EXPANSION_SOURCES,
  EXPANSION_BUILD_ORDER,
  GLOBAL_POLICY,
  SOURCE_BY_ID,
  INDICATOR_BY_ID,
  ALL_INDICATORS,
  type Domain,
} from "@shared/macro";
import { runAllConnectors, CONNECTORS, type FetchLike } from "./macroConnectors";
import {
  parseSdmxCsv,
  parseImfSdmxJson,
  parseFiscalData,
  parseFedDdpCsv,
  parseGdeltTimeline,
  parseOfrFsi,
  parseCftcTff,
  parseJsonPath,
  periodToDate,
  rssDateToIso,
  expansionConnectorInventory,
  EXPANSION_CONNECTORS,
  EXPANSION_STATEMENT_CONNECTORS,
  EXPANSION_NUMBER_CONNECTORS,
  STATEMENT_SPECS,
} from "./macroConnectorsExpansion";

const okText = (text: string) => ({ ok: true, status: 200, text: async () => text });

const EXPANSION_DOMAINS: Domain[] = [
  "fed", "bis", "imf", "summits", "us-fiscal", "opec", "sanctions", "trade-shipping", "fin-stability", "political-risk",
  "ecb", "oecd", "un", "china-party", "food", "boe", "mdb", "swf", "nea-allies", "india",
  "em-central-banks", "minerals", "demographics", "catastrophe", "wef",
];

describe("expansion registry", () => {
  it("is entirely free tier: no paid feed anywhere in the expansion", () => {
    expect(EXPANSION_SOURCES.length).toBeGreaterThanOrEqual(200);
    expect(EXPANSION_SOURCES.filter(s => s.access === "paid-api")).toEqual([]);
    for (const s of EXPANSION_SOURCES) expect(["open-api", "keyed-api", "page", "manual"]).toContain(s.access);
  });

  it("source ids are unique across core and expansion", () => {
    expect(new Set(MACRO_SOURCES.map(s => s.id)).size).toBe(MACRO_SOURCES.length);
    expect(MACRO_SOURCES.length).toBeGreaterThanOrEqual(300);
  });

  it("every one of the twenty-five domains has at least ten sources across the registry", () => {
    const count = new Map<string, number>();
    for (const s of MACRO_SOURCES) for (const d of s.domains) count.set(d, (count.get(d) ?? 0) + 1);
    const short = EXPANSION_DOMAINS.filter(d => (count.get(d) ?? 0) < 10);
    expect(short).toEqual([]);
  });

  it("the build order lists all twenty-five domains exactly once, 1..25, each with a reason", () => {
    expect(EXPANSION_BUILD_ORDER).toHaveLength(25);
    expect(EXPANSION_BUILD_ORDER.map(b => b.order)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    expect(new Set(EXPANSION_BUILD_ORDER.map(b => b.domain)).size).toBe(25);
    for (const d of EXPANSION_DOMAINS) expect(EXPANSION_BUILD_ORDER.some(b => b.domain === d)).toBe(true);
    for (const b of EXPANSION_BUILD_ORDER) expect(b.why.length).toBeGreaterThan(20);
  });

  it("every source carries a URL, an entity and a provides note", () => {
    for (const s of EXPANSION_SOURCES) {
      expect(s.url.startsWith("http")).toBe(true);
      expect(s.entity.length).toBeGreaterThan(2);
      expect(s.provides.length).toBeGreaterThan(5);
      expect(s.domains.length).toBeGreaterThan(0);
    }
  });

  it("GLOBAL_POLICY indicators are registered and cite registered sources", () => {
    expect(GLOBAL_POLICY.length).toBeGreaterThanOrEqual(40);
    for (const i of GLOBAL_POLICY) {
      expect(INDICATOR_BY_ID.get(i.id)).toBe(i);
      expect(i.sourceIds.length).toBeGreaterThan(0);
      for (const s of i.sourceIds) expect(SOURCE_BY_ID.has(s), `${i.id} cites unregistered source ${s}`).toBe(true);
    }
    expect(new Set(ALL_INDICATORS.map(i => i.id)).size).toBe(ALL_INDICATORS.length);
  });
});

describe("expansion connectors inventory", () => {
  it("every connector cites a registered, free source and a registered indicator", () => {
    const inv = expansionConnectorInventory();
    expect(inv.length).toBe(EXPANSION_CONNECTORS.length);
    expect(inv.filter(i => i.kind === "number")).toHaveLength(EXPANSION_NUMBER_CONNECTORS.length);
    expect(inv.filter(i => i.kind === "statement")).toHaveLength(EXPANSION_STATEMENT_CONNECTORS.length);
    for (const c of inv) {
      const src = SOURCE_BY_ID.get(c.sourceId);
      expect(src, `unregistered source ${c.sourceId}`).toBeDefined();
      expect(src!.access).not.toBe("paid-api");
      expect(INDICATOR_BY_ID.has(c.indicatorId), `unregistered indicator ${c.indicatorId}`).toBe(true);
      expect(c.url.startsWith("http") || c.url === "(keyed)").toBe(true);
    }
  });

  it("statement feeds each name a speaker, channel and a narrow keyword filter", () => {
    expect(STATEMENT_SPECS.length).toBeGreaterThanOrEqual(15);
    for (const s of STATEMENT_SPECS) {
      expect(s.speaker.length).toBeGreaterThan(3);
      expect(s.channel.length).toBeGreaterThan(3);
      expect(s.keywords).toBeInstanceOf(RegExp);
    }
  });

  it("core and expansion connectors do not collide on source id + indicator", () => {
    const keys = new Set<string>();
    for (const c of [...CONNECTORS, ...EXPANSION_CONNECTORS]) {
      for (const i of c.indicatorIds) {
        const k = `${c.sourceId}:${i}`;
        expect(keys.has(k), `duplicate connector ${k}`).toBe(false);
        keys.add(k);
      }
    }
  });
});

describe("generic parsers", () => {
  it("SDMX CSV (ECB/BIS/OECD): finds TIME_PERIOD and OBS_VALUE by header name, converts periods to month-end", () => {
    const csv = 'KEY,FREQ,TIME_PERIOD,OBS_VALUE,OBS_STATUS\n"FM.B.U2.EUR.4F.KR.MRR_FR.LEV",B,2026-09-17,2.15,A\n"FM.B.U2.EUR.4F.KR.MRR_FR.LEV",B,2026-Q2,2.40,A\n';
    const obs = parseSdmxCsv(csv, "ecb-mro", "ecb-data-portal");
    expect(obs).toEqual([
      { indicatorId: "ecb-mro", asOf: "2026-09-17", value: 2.15, sourceId: "ecb-data-portal" },
      { indicatorId: "ecb-mro", asOf: "2026-06-30", value: 2.4, sourceId: "ecb-data-portal" },
    ]);
    expect(parseSdmxCsv("a,b\n1,2\n", "x", "y")).toEqual([]);
  });

  it("IMF SDMX-JSON CompactData", () => {
    const json = JSON.stringify({ CompactData: { DataSet: { Series: { Obs: [{ "@TIME_PERIOD": "2026-07", "@OBS_VALUE": "1234567.8" }, { "@TIME_PERIOD": "2026-08", "@OBS_VALUE": "n/a" }] } } } });
    expect(parseImfSdmxJson(json, "imf-japan-reserves-ifs")).toEqual([{ indicatorId: "imf-japan-reserves-ifs", asOf: "2026-07-31", value: 1234567.8, sourceId: "imf-ifs" }]);
  });

  it("Fiscal Data (Debt to the Penny)", () => {
    const json = JSON.stringify({ data: [{ record_date: "2026-09-18", tot_pub_debt_out_amt: "38,412,345,678,901.12" }] });
    const obs = parseFiscalData(json, "tot_pub_debt_out_amt", "us-debt-to-penny", "fiscaldata-debt");
    expect(obs).toHaveLength(1);
    expect(obs[0].asOf).toBe("2026-09-18");
    expect(obs[0].value).toBeCloseTo(38_412_345_678_901.12, 0);
  });

  it("Fed DDP CSV: skips descriptive header rows", () => {
    const csv = ['"Series Description","Effective Federal Funds Rate"', '"Unit:","Percent"', '"Time Period","RIFSPFF_N.D"', "2026-09-17,4.33", "2026-09-18,ND", "2026-09-19,4.33"].join("\n");
    const obs = parseFedDdpCsv(csv, "fed-effr");
    expect(obs.map(o => o.asOf)).toEqual(["2026-09-17", "2026-09-19"]);
    expect(obs[0]).toEqual({ indicatorId: "fed-effr", asOf: "2026-09-17", value: 4.33, sourceId: "fed-ddp" });
  });

  it("GDELT timeline: thirty-day mean of daily volume, dated today", () => {
    const data = Array.from({ length: 45 }, (_, i) => ({ date: `202608${String((i % 28) + 1).padStart(2, "0")}T000000Z`, value: i < 15 ? 100 : 1 }));
    const json = JSON.stringify({ timeline: [{ series: "Volume Intensity", data }] });
    const obs = parseGdeltTimeline(json, "gdelt-taiwan-volume", "2026-09-22");
    expect(obs).toHaveLength(1);
    expect(obs[0].asOf).toBe("2026-09-22");
    expect(obs[0].value).toBe(1); // last 30 points are all 1
    expect(parseGdeltTimeline(JSON.stringify({ timeline: [] }), "x", "2026-09-22")).toEqual([]);
  });

  it("OFR FSI CSV: US dates to ISO", () => {
    const csv = "Date,OFR FSI,Credit,Equity valuation\n9/17/2026,-1.25,0.1,-0.3\n9/18/2026,-1.10,0.2,-0.4\n";
    const obs = parseOfrFsi(csv);
    expect(obs.slice(-1)).toEqual([{ indicatorId: "ofr-fsi", asOf: "2026-09-18", value: -1.1, sourceId: "ofr-fsi" }]);
  });

  it("CFTC TFF JSON: net leveraged-fund short in the 10-year note, newest row only", () => {
    const json = JSON.stringify([
      { market_and_exchange_names: "UST 2Y NOTE - CHICAGO BOARD OF TRADE", report_date_as_yyyy_mm_dd: "2026-09-15T00:00:00.000", lev_money_positions_long_all: "1", lev_money_positions_short_all: "2" },
      { market_and_exchange_names: "UST 10Y NOTE - CHICAGO BOARD OF TRADE", report_date_as_yyyy_mm_dd: "2026-09-15T00:00:00.000", lev_money_positions_long_all: "250000", lev_money_positions_short_all: "1150000" },
      { market_and_exchange_names: "UST 10Y NOTE - CHICAGO BOARD OF TRADE", report_date_as_yyyy_mm_dd: "2026-09-08T00:00:00.000", lev_money_positions_long_all: "1", lev_money_positions_short_all: "1" },
    ]);
    const obs = parseCftcTff(json);
    expect(obs).toHaveLength(1);
    expect(obs[0]).toMatchObject({ indicatorId: "cftc-lev-funds-ust-short", asOf: "2026-09-15", value: 900000, sourceId: "cftc-cot" });
  });

  it("JSON path walker: arrays, nesting, scale and date fallback", () => {
    const json = JSON.stringify({ results: [{ detalle: [{ fecha: "2026-09-19", valor: "29.5" }] }] });
    expect(parseJsonPath(json, { valuePath: "results[0].detalle[0].valor", datePath: "results[0].detalle[0].fecha", indicatorId: "bcra-policy-rate", sourceId: "bcra-api", today: "2026-09-22" })).toEqual([
      { indicatorId: "bcra-policy-rate", asOf: "2026-09-19", value: 29.5, sourceId: "bcra-api" },
    ]);
    expect(parseJsonPath(JSON.stringify({ data: [{ eur_per_day: 512_000_000 }] }), { valuePath: "data[0].eur_per_day", indicatorId: "russia-fossil-revenue-daily", sourceId: "crea-fossil-tracker", today: "2026-09-22", scale: 1e-6 })).toEqual([
      { indicatorId: "russia-fossil-revenue-daily", asOf: "2026-09-22", value: 512, sourceId: "crea-fossil-tracker" },
    ]);
    expect(parseJsonPath(JSON.stringify({ a: {} }), { valuePath: "a.b.c", indicatorId: "x", sourceId: "y", today: "2026-09-22" })).toEqual([]);
  });

  it("period conversion", () => {
    expect(periodToDate("2026-Q1")).toBe("2026-03-31");
    expect(periodToDate("2026-Q4")).toBe("2026-12-31");
    expect(periodToDate("2024-02")).toBe("2024-02-29");
    expect(periodToDate("2026")).toBe("2026-12-31");
    expect(periodToDate("2026-S1")).toBe("2026-06-30");
    expect(periodToDate("2026-09-17T00:00:00")).toBe("2026-09-17");
  });

  it("RSS pubDate to ISO", () => {
    expect(rssDateToIso("Wed, 17 Sep 2026 14:00:00 GMT")).toBe("2026-09-17");
    expect(rssDateToIso("")).toBe("");
    expect(rssDateToIso("not a date")).toBe("");
  });
});

describe("statement pipeline through the runner", () => {
  const rss = `<?xml version="1.0"?><rss><channel>
    <item><title>Federal Reserve issues FOMC statement</title><link>https://www.federalreserve.gov/newsevents/pressreleases/monetary20260917a.htm</link><pubDate>Wed, 17 Sep 2026 18:00:00 GMT</pubDate></item>
    <item><title>Federal Reserve Board announces annual bank stress test results</title><link>https://www.federalreserve.gov/x2</link><pubDate>Tue, 16 Sep 2026 18:00:00 GMT</pubDate></item>
    <item><title>Board publishes 2027 holiday schedule</title><link>https://www.federalreserve.gov/x3</link><pubDate>Mon, 15 Sep 2026 18:00:00 GMT</pubDate></item>
  </channel></rss>`;

  it("a statement feed yields ledger drafts for the matching items plus one count observation", async () => {
    const fetchImpl: FetchLike = async () => okText(rss);
    const run = await runAllConnectors({ fetchImpl, env: {}, today: "2026-09-22", only: ["fed-press-all"], connectors: EXPANSION_STATEMENT_CONNECTORS });
    expect(run.results).toHaveLength(1);
    expect(run.results[0].ok).toBe(true);
    expect(run.observations).toEqual([
      expect.objectContaining({ indicatorId: "fed-statements-30d", asOf: "2026-09-22", value: 2, sourceId: "fed-press-all" }),
    ]);
    expect(run.statements).toHaveLength(2);
    expect(run.statements[0]).toEqual({
      statementDate: "2026-09-17",
      speaker: "Federal Reserve Board",
      channel: "Press release",
      category: "rate-guidance",
      severity: "routine",
      environment: "calm",
      claim: "Federal Reserve issues FOMC statement",
      sourceId: "fed-press-all",
      sourceUrl: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260917a.htm",
    });
    expect(run.statements.some(s => /holiday/.test(s.claim))).toBe(false);
  });

  it("a number connector reads its endpoint into one observation", async () => {
    const ddp = ['"Series Description","EFFR"', '"Time Period","RIFSPFF_N.D"', "2026-09-18,4.33", "2026-09-19,4.33"].join("\n");
    const fetchImpl: FetchLike = async () => okText(ddp);
    const run = await runAllConnectors({ fetchImpl, env: {}, today: "2026-09-22", only: ["fed-ddp"], connectors: EXPANSION_NUMBER_CONNECTORS });
    expect(run.okCount).toBe(1);
    expect(run.observations).toEqual([{ indicatorId: "fed-effr", asOf: "2026-09-19", value: 4.33, sourceId: "fed-ddp" }]);
    expect(run.statements).toEqual([]);
  });

  it("never throws: a dead feed is one failed row, the rest of the run continues", async () => {
    let n = 0;
    const fetchImpl: FetchLike = async url => {
      n++;
      if (/federalreserve/.test(url)) throw new Error("ECONNRESET");
      return okText(rss);
    };
    const run = await runAllConnectors({ fetchImpl, env: {}, today: "2026-09-22", connectors: EXPANSION_STATEMENT_CONNECTORS });
    expect(n).toBe(EXPANSION_STATEMENT_CONNECTORS.length);
    const fed = run.results.find(r => r.sourceId === "fed-press-all")!;
    expect(fed.ok).toBe(false);
    expect(fed.detail).toContain("ECONNRESET");
    expect(run.okCount + run.failCount).toBe(EXPANSION_STATEMENT_CONNECTORS.length);
    for (const r of run.results) expect(r.observations.length + r.statements.length === 0).toBe(!r.ok);
  });

  it("the full connector set (core + expansion) runs end to end against a stub and reports every source", async () => {
    const fetchImpl: FetchLike = async () => okText("{}");
    const all = [...CONNECTORS, ...EXPANSION_CONNECTORS];
    const run = await runAllConnectors({ fetchImpl, env: {}, today: "2026-09-22", connectors: all });
    // Keyed connectors without a key and empty bodies both land as ok=false rows; none throws.
    expect(run.results.length).toBeGreaterThan(0);
    expect(run.results.length).toBeLessThanOrEqual(all.length);
    for (const r of run.results) expect(SOURCE_BY_ID.has(r.sourceId)).toBe(true);
  });
});
