/**
 * Macro connectors — parsers against recorded fixtures, and the runner's
 * never-throw contract. No network.
 */
import { describe, expect, it } from "vitest";
import {
  parseFredCsv,
  parseFredJson,
  parseTicMfh,
  parseImfDatamapper,
  parseEia,
  parseWorldBank,
  parseRss,
  runAllConnectors,
  plausibleTic,
  CONNECTORS,
  allowedHosts,
  type FetchLike,
} from "./macroConnectors";
import { buildMacroBrief, parseMacroLookup, stripMacroLookup, executeMacroLookup } from "./macroContext";
import { SOURCE_BY_ID } from "@shared/macro";

const okText = (text: string) => ({ ok: true, status: 200, text: async () => text });

describe("parsers", () => {
  it("FRED keyless CSV: skips missing values and keeps the source date", () => {
    const csv = "observation_date,DGS10\n2026-09-17,4.91\n2026-09-18,.\n2026-09-19,4.90\n";
    const obs = parseFredCsv(csv, "ust10y");
    expect(obs).toHaveLength(2);
    expect(obs[1]).toEqual({ indicatorId: "ust10y", asOf: "2026-09-19", value: 4.9, sourceId: "fred" });
  });

  it("FRED JSON", () => {
    const json = JSON.stringify({ observations: [{ date: "2026-09-19", value: "4.90" }, { date: "2026-09-18", value: "." }] });
    expect(parseFredJson(json, "ust10y")).toEqual([{ indicatorId: "ust10y", asOf: "2026-09-19", value: 4.9, sourceId: "fred" }]);
  });

  it("TIC mfh.txt: reads the newest column, derives the three-month change, and dates it to month-end", () => {
    const text = [
      "MAJOR FOREIGN HOLDERS OF TREASURY SECURITIES",
      "(in billions of dollars)",
      "                         Jul 2026  Jun 2026  May 2026  Apr 2026  Mar 2026",
      "Japan                     1103.9    1116.7    1128.4    1136.0    1131.2",
      "United Kingdom             998.3     939.9     920.1     900.5     888.0",
      "China, Mainland            618.0     633.4     659.3     651.1     660.2",
      "Grand Total               9248.1    9298.5    9310.0    9330.2    9400.1",
    ].join("\n");
    const obs = parseTicMfh(text);
    const jp = obs.find(o => o.indicatorId === "tic:japan")!;
    expect(jp.value).toBe(1103.9);
    expect(jp.asOf).toBe("2026-07-31");
    expect(obs.find(o => o.indicatorId === "jp-tic-mom")!.value).toBeCloseTo(1103.9 - 1136.0, 6);
    expect(obs.find(o => o.indicatorId === "cn-tic-mom")!.value).toBeCloseTo(618.0 - 651.1, 6);
    expect(obs.find(o => o.indicatorId === "tic:total")!.value).toBe(9248.1);
    expect(plausibleTic(obs)).toBe(true);
  });

  it("TIC plausibility rejects a parse that is off by an order of magnitude", () => {
    expect(plausibleTic([{ indicatorId: "tic:japan", asOf: "2026-07-31", value: 11039, sourceId: "us-tic-mfh" }])).toBe(false);
  });

  it("TIC without a dated header yields nothing rather than misdated rows", () => {
    expect(parseTicMfh("Japan 1103.9 1116.7 1128.4 1136.0")).toEqual([]);
  });

  it("IMF datamapper", () => {
    const json = JSON.stringify({ values: { GGXWDG_NGDP: { USA: { "2025": 123.9, "2026": 125.8 }, JPN: { "2026": 204.4 } } } });
    const obs = parseImfDatamapper(json, "GGXWDG_NGDP", 2026);
    expect(obs.find(o => o.indicatorId === "imf:GGXWDG_NGDP:USA")!.value).toBe(125.8);
    expect(obs.find(o => o.indicatorId === "imf:GGXWDG_NGDP:JPN")!.asOf).toBe("2026-12-31");
  });

  it("EIA and World Bank", () => {
    expect(parseEia(JSON.stringify({ response: { data: [{ period: "2026-09-19", value: "91.2" }] } }), "eia:brent")[0].value).toBe(91.2);
    const wb = parseWorldBank(JSON.stringify([{}, [{ countryiso3code: "JPN", date: "2024", value: 216.2 }, { countryiso3code: "JPN", date: "2023", value: 220 }, { countryiso3code: "ZZZ", date: "2024", value: null }]]), "wb:X");
    expect(wb).toHaveLength(1);
    expect(wb[0].indicatorId).toBe("wb:X:JPN");
  });

  it("RSS", () => {
    const xml = `<rss><channel><item><title><![CDATA[Treasury statement on Taiwan arms sale]]></title><link>https://x/1</link><pubDate>Mon, 21 Sep 2026 08:00:00 GMT</pubDate></item><item><title>Weather</title><link>https://x/2</link></item></channel></rss>`;
    const items = parseRss(xml, "whitehouse-briefing");
    expect(items).toHaveLength(2);
    expect(items[0].title).toMatch(/Taiwan/);
  });
});

describe("runner", () => {
  it("never throws: a failing fetch is recorded per source and the rest still run", async () => {
    const fetchImpl: FetchLike = async url => {
      if (url.includes("ticdata")) throw new Error("egress blocked");
      if (url.includes("fredgraph")) return okText("observation_date,X\n2026-09-19,4.9\n");
      if (url.includes("imf.org")) return okText(JSON.stringify({ values: { GGXWDG_NGDP: { USA: { "2026": 125.8 } } } }));
      if (url.includes("worldbank")) return okText(JSON.stringify([{}, [{ countryiso3code: "USA", date: "2024", value: 120 }]]));
      return { ok: false, status: 404, text: async () => "" };
    };
    const r = await runAllConnectors({ fetchImpl, env: {} as NodeJS.ProcessEnv, today: "2026-09-22" });
    expect(r.results.find(x => x.sourceId === "us-tic-mfh")!.ok).toBe(false);
    expect(r.results.find(x => x.sourceId === "us-tic-mfh")!.detail).toMatch(/egress/);
    expect(r.results.find(x => x.sourceId === "fred")!.ok).toBe(true);
    expect(r.results.find(x => x.sourceId === "eia-api")!.ok).toBe(false); // no key
    expect(r.okCount).toBeGreaterThanOrEqual(3);
    expect(r.observations.some(o => o.indicatorId === "ust10y")).toBe(true);
  });

  it("reads no Chinese government, Party, state-media or .cn/.hk host", () => {
    for (const h of allowedHosts()) expect(h, h).not.toMatch(/\.(?:cn|hk|mo)$|news\.cn|xinhua/i);
    for (const c of CONNECTORS) expect(SOURCE_BY_ID.get(c.sourceId)!.jurisdiction, c.sourceId).not.toMatch(/^(?:CN|HK)$/);
  });

  it("every connector names a registered source", () => {
    for (const c of CONNECTORS) expect(SOURCE_BY_ID.has(c.sourceId), c.sourceId).toBe(true);
  });

  it("`only` restricts the run", async () => {
    const fetchImpl: FetchLike = async () => okText("observation_date,X\n2026-09-19,4.9\n");
    const r = await runAllConnectors({ fetchImpl, env: {} as NodeJS.ProcessEnv, only: ["fred"] });
    expect(r.results.map(x => x.sourceId)).toEqual(["fred"]);
  });
});

describe("Thomas Goldman macro brief and lookup", () => {
  it("the brief is dated, sourced, and carries the four rules", () => {
    const b = buildMacroBrief(undefined, "2026-09-22");
    expect(b.text).toContain("GLOBAL MACRO INTELLIGENCE");
    expect(b.text).toContain("JAPAN LIQUIDATION");
    expect(b.text).toContain("confidence");
    expect(b.text).toContain("MACRO_LOOKUP");
    expect(b.sourceIds).toContain("us-tic-mfh");
    expect(b.text.length).toBeLessThan(6000);
  });

  it("parses a well-formed directive and clamps its arguments", () => {
    const q = parseMacroLookup('Let me check.\nMACRO_LOOKUP: {"kind":"liquidation","holder":"CN","fraction":1.7,"months":0}');
    expect(q).toEqual({ kind: "liquidation", holder: "CN", fraction: 1, months: 1 });
    expect(parseMacroLookup('MACRO_LOOKUP: {"kind":"debt","iso3":"ita"}')).toEqual({ kind: "debt", iso3: "ITA" });
    expect(parseMacroLookup("no directive")).toBeNull();
    expect(parseMacroLookup('MACRO_LOOKUP: {"kind":"nope"}')).toBeNull();
    expect(stripMacroLookup('Answer.\nMACRO_LOOKUP: {"kind":"debt","iso3":"ITA"}')).toBe("Answer.");
  });

  it("executes both lookups with sources attached", () => {
    const liq = executeMacroLookup({ kind: "liquidation", holder: "JP", fraction: 0.5, months: 6 });
    expect(liq).toContain("Sell 50% of Japan");
    expect(liq).toContain("us-tic-mfh");
    const debt = executeMacroLookup({ kind: "debt", iso3: "ITA" });
    expect(debt).toContain("Italy");
    expect(debt).toContain("imf-weo");
    expect(executeMacroLookup({ kind: "debt", iso3: "XXX" })).toMatch(/no debt row/);
  });
});

describe("benchmark provider (the trunk's _core/fred.ts seam)", () => {
  it("when a provider is set, FRED observations come from it and no local fetch is made", async () => {
    const { setBenchmarkProvider } = await import("./macroConnectors");
    let fetched = 0;
    const fetchImpl: FetchLike = async () => { fetched++; return okText(""); };
    setBenchmarkProvider(async series => (series === "DGS10" ? { value: 4.9, asOf: "2026-09-19" } : null));
    try {
      const r = await runAllConnectors({ fetchImpl, env: {} as NodeJS.ProcessEnv, only: ["fred"] });
      const obs = r.observations.find(o => o.indicatorId === "ust10y")!;
      expect(obs.value).toBe(4.9);
      expect(obs.note).toMatch(/trunk _core\/fred/);
      // The other nine series fell back to the local transport (and got nothing), so fetches happened for them only.
      expect(fetched).toBe(Object.keys((await import("./macroConnectors")).FRED_SERIES).length - 1);
    } finally {
      setBenchmarkProvider(null);
    }
  });
});
