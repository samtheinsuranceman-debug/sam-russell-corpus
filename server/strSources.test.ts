import { describe, expect, it } from "vitest";
import { STR_PROTOCOL, STR_SOURCES, affordabilityFromFactFinder, configuredStrApis, depreciableBasis, placesFromText, strApiLine, strLookupUrl, strSource } from "@shared/strSources";
import { parseStrReadReply, readStrPage, strFigureVerified, suggestStr } from "./strSources";

describe("the short-term rental source registry", () => {
  it("carries five to twelve sites, each verified on a dated page, with Rabbu first", () => {
    expect(STR_SOURCES.length).toBeGreaterThanOrEqual(5);
    expect(STR_SOURCES.length).toBeLessThanOrEqual(12);
    expect(STR_SOURCES[0]!.id).toBe("rabbu");
    for (const s of STR_SOURCES) {
      expect(s.verifiedAt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.verifiedAt.url).toMatch(/^https:\/\//);
      expect(s.home).toMatch(/^https:\/\//);
      expect(s.publishes.length).toBeGreaterThan(40);
      expect(s.api.note.length).toBeGreaterThan(40);
      if ("envKey" in s.api) expect(s.api.envKey).toMatch(/^[A-Z][A-Z0-9_]+$/); // the host panel's naming rule
      if (s.lookup && s.lookupBy === "place") expect(s.lookup).toContain("{place}");
    }
    const ids = STR_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("has at least three sites with a real developer API and says which are self-serve", () => {
    const withApi = STR_SOURCES.filter((s) => s.api.status === "self-serve" || s.api.status === "contract" || s.api.status === "own-listings");
    expect(withApi.length).toBeGreaterThanOrEqual(3);
    expect(STR_SOURCES.filter((s) => s.api.status === "self-serve").map((s) => s.id)).toEqual(expect.arrayContaining(["mashvisor", "airroi"]));
    expect(strSource("rabbu")!.api.status).toBe("none");
    expect(strSource("airbnb")!.api.status).toBe("none");
  });
  it("fills the lookup link with the client's place, and falls back to the home page", () => {
    expect(strLookupUrl(strSource("airbnb")!, { place: "Asheville, NC" })).toBe("https://www.airbnb.com/s/Asheville%2C%20NC/homes");
    expect(strLookupUrl(strSource("vrbo")!, { zip: "28401" })).toBe("https://www.vrbo.com/search?destination=28401");
    expect(strLookupUrl(strSource("vrbo")!, {})).toBe("https://www.vrbo.com");
    expect(strLookupUrl(strSource("rabbu")!, { address: "1 Main St" })).toBe("https://rabbu.com/airbnb-calculator");
  });
  it("reports which APIs the host has keys for by name only", () => {
    expect(configuredStrApis({})).toEqual([]);
    const on = configuredStrApis({ AIRROI_API_KEY: "x", MASHVISOR_API_KEY: "y" });
    expect(on.map((a) => a.id).sort()).toEqual(["airroi", "mashvisor"]);
    expect(JSON.stringify(on)).not.toContain("x\"");
    expect(strApiLine({})).toContain("No short-term rental API key");
    expect(strApiLine({ AIRROI_API_KEY: "x" })).toContain("AirROI");
  });
  it("the protocol names Rabbu first and forbids invented figures", () => {
    expect(STR_PROTOCOL.indexOf("Rabbu")).toBeGreaterThan(0);
    expect(STR_PROTOCOL.indexOf("Rabbu")).toBeLessThan(STR_PROTOCOL.indexOf("AirDNA"));
    expect(STR_PROTOCOL).toMatch(/Never state a nightly rate/);
  });
});

describe("places from the client's own words", () => {
  it("finds City, ST pairs, places after in/to/near/love, and zips, without the stop words", () => {
    const r = placesFromText("We love Asheville, NC and go to the Outer Banks every summer. Maybe retire in Sedona. Our beach place is 32459. In summer we visit Lake Tahoe.");
    expect(r.places).toEqual(expect.arrayContaining(["Asheville, NC", "Outer Banks", "Sedona", "Lake Tahoe"]));
    expect(r.places).not.toContain("Summer");
    expect(r.places).not.toContain("Sedona. Our");
    expect(r.zips).toEqual(["32459"]);
    expect(placesFromText("Florida, maybe Destin").places).toEqual(["Destin", "Florida"]);
  });
  it("returns nothing for text with no places", () => {
    expect(placesFromText("I want to pay less tax and retire at 60.")).toEqual({ places: [], zips: [] });
  });
});

describe("affordability from the Fact Finder", () => {
  it("adds the income lines, adds the cash lines, and divides cash by down plus closing", () => {
    const a = affordabilityFromFactFinder({ sections: { income: { w2Income: "250000", spouseIncome: 50000 }, cash: { checking: 20000, savings: "80,000", moneyMarketCds: 15000 } } });
    expect(a.annualIncome).toBe(300_000);
    expect(a.cashAvailable).toBe(115_000);
    expect(a.cashLimitedPrice).toBe(Math.floor(115_000 / 0.23));
    expect(depreciableBasis(500_000, 80)).toBe(400_000);
    expect(a.lines[2]).toContain("debt-to-income");
  });
  it("is zero, not a guess, when the Fact Finder is empty", () => {
    const a = affordabilityFromFactFinder(null);
    expect(a.cashLimitedPrice).toBe(0);
  });
});

describe("suggesting where to look", () => {
  it("takes places from goals, relocation plans and spoken notes, and gives every registry site a link per place", () => {
    const s = suggestStr({ sections: { goals: { topGoals: "A cabin near Gatlinburg, TN we can rent out" }, retirement: { relocationPlans: "Florida, maybe Destin" }, income: { w2Income: 200000 }, cash: { savings: 100000 } } }, { notes: "we keep going to Sedona", zips: [{ zip: "28401", label: "Primary home" }], env: { AIRROI_API_KEY: "k" } });
    expect(s.places).toEqual(expect.arrayContaining(["Gatlinburg, TN", "Destin", "Sedona"]));
    expect(s.readFrom).toEqual(["Fact Finder top goals", "Fact Finder relocation plans", "what you just said"]);
    expect(s.zips[0]).toEqual({ zip: "28401", label: "Primary home" });
    expect(s.apisConfigured.map((a) => a.id)).toEqual(["airroi"]);
    const airbnb = s.sources.find((x) => x.id === "airbnb")!;
    expect(airbnb.links.map((l) => l.place)).toEqual(s.places);
    expect(airbnb.links[0]!.url).toContain("airbnb.com/s/");
    expect(s.sources.find((x) => x.id === "airroi")!.apiConfigured).toBe(true);
    expect(s.affordability.cashLimitedPrice).toBe(Math.floor(100_000 / 0.23));
  });
});

describe("reading a source page", () => {
  const page = "Airbnb calculator for Sedona, AZ. The average daily rate in Sedona is $312 per night. Occupancy over the next 30 days is 61%. The projected monthly revenue is $5,700. Nothing else here. ".repeat(3);
  it("keeps only figures whose sentence is on the page and whose number is in that sentence", () => {
    const parsed = parseStrReadReply(`Sure: {"figures":[{"metric":"nightly_rate","value":312,"unit":"USD/night","place":"Sedona, AZ","quote":"The average daily rate in Sedona is $312 per night."},{"metric":"occupancy_pct","value":61,"unit":"%","place":null,"quote":"Occupancy over the next 30 days is 61%."},{"metric":"annual_revenue","value":68400,"unit":"USD","place":null,"quote":"The projected annual revenue is $68,400."},{"metric":"monthly_revenue","value":5900,"unit":"USD","place":null,"quote":"The projected monthly revenue is $5,700."},{"metric":"cap_rate","value":7,"unit":"%","place":null,"quote":"x"}]}`);
    expect(parsed).toHaveLength(4); // cap_rate is not a metric the platform reads
    const kept = parsed.filter((f) => strFigureVerified(page, f));
    expect(kept.map((f) => f.metric)).toEqual(["nightly_rate", "occupancy_pct"]); // the annual figure is not on the page; the monthly number does not match its sentence
  });
  it("opens only registry sources, reports the URL and date, and stores nothing", async () => {
    const calls: string[] = [];
    const r = await readStrPage({ sourceId: "awning", place: "Sedona, AZ" }, {
      today: "2026-09-07",
      fetchText: async (u) => { calls.push(u); return page; },
      ask: async () => ({ text: `{"figures":[{"metric":"nightly_rate","value":312,"unit":"USD/night","place":"Sedona, AZ","quote":"The average daily rate in Sedona is $312 per night."}]}`, via: "test" }),
    });
    expect(calls).toEqual(["https://www.awning.com/airbnb-calculator"]);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.figures).toHaveLength(1); expect(r.readAt).toBe("2026-09-07"); expect(r.note).toContain("read on 2026-09-07"); expect(r.via).toBe("test"); }
    const bad = await readStrPage({ sourceId: "not-a-site" }, { fetchText: async () => page, ask: async () => null });
    expect(bad.ok).toBe(false);
  });
  it("says so when a page is unreadable or the AI is off", async () => {
    const empty = await readStrPage({ sourceId: "rabbu" }, { fetchText: async () => "", ask: async () => null });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.reason).toContain("open it with the button");
    const noAi = await readStrPage({ sourceId: "awning" }, { fetchText: async () => page, ask: async () => null });
    expect(noAi.ok).toBe(false);
    if (!noAi.ok) expect(noAi.reason).toContain("did not answer");
  });
});
