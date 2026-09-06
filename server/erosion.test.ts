// ============================================================
// The erosion engine: the historical record and its base rates, the
// forecaster consensus and weighting, the tax trajectory, the inflation
// ladder maths, the hurdle rate, the two projections, the claim seeds, and
// the Sphere's coordinates. Pure logic and mocked transports.
// ============================================================
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ESTATE_EXCLUSION, MAX_LTCG_RATE, TOP_CORPORATE_RATE, TOP_MARGINAL_RATE, changeEvents, valueAt, windowStats } from "@shared/taxHistory";
import { HORIZONS, annualised, basketRate, burdenAt, consensusAt, erosionSummary, hurdleRate, project, purchasingPower, taxTrajectory, type WeightedClaim } from "@shared/erosion";
import { CLAIM_SEEDS, SOURCES, sourceWeight } from "./forecastSources";
import { ladderFrom } from "./inflation";
import { LATITUDES, MERIDIANS, SPHERE_POINTS, pointsAt, projectPoint } from "@shared/sphere";

describe("tax history", () => {
  it("carries the published statutory record", () => {
    expect(valueAt(TOP_MARGINAL_RATE, 1944)).toBe(94);
    expect(valueAt(TOP_MARGINAL_RATE, 1963)).toBe(91);
    expect(valueAt(TOP_MARGINAL_RATE, 1981)).toBe(70);
    expect(valueAt(TOP_MARGINAL_RATE, 1988)).toBe(28);
    expect(valueAt(TOP_MARGINAL_RATE, 2013)).toBe(39.6);
    expect(valueAt(TOP_MARGINAL_RATE, 2026)).toBe(37);
    expect(valueAt(TOP_CORPORATE_RATE, 2017)).toBe(35);
    expect(valueAt(TOP_CORPORATE_RATE, 2018)).toBe(21);
    expect(valueAt(MAX_LTCG_RATE, 1975)).toBeNull(); // not verified: left out, not guessed
    expect(valueAt(ESTATE_EXCLUSION, 2026)).toBe(15_000_000);
    // one entry per year, no gaps, no duplicates
    for (const s of [TOP_MARGINAL_RATE, TOP_CORPORATE_RATE, MAX_LTCG_RATE, ESTATE_EXCLUSION]) {
      for (let i = 1; i < s.length; i += 1) expect(s[i]!.year - s[i - 1]!.year).toBe(1);
    }
  });
  it("derives base rates from every window, and lists the change events", () => {
    const w10 = windowStats(TOP_MARGINAL_RATE, 10, 1946);
    expect(w10.windows).toBe(2026 - 10 - 1946 + 1);
    expect(w10.pUp + w10.pDown + w10.pFlat).toBeCloseTo(1, 2);
    expect(w10.largestFall).toBeLessThan(0);
    expect(w10.meanAbsChange).toBeGreaterThan(0);
    expect(w10.meanAbsRelChange).toBeGreaterThan(0);
    expect(w10.meanAbsRelChange).toBeLessThan(1);
    const ev = changeEvents(TOP_MARGINAL_RATE, 1946);
    expect(ev.find((e) => e.year === 1982)).toMatchObject({ from: 70, to: 50, change: -20 });
    expect(ev.find((e) => e.year === 2013)).toMatchObject({ from: 35, to: 39.6 });
    expect(ev.at(-1)!.year).toBe(2018);
  });
});

describe("forecaster consensus and the tax trajectory", () => {
  const claims: WeightedClaim[] = [
    { sourceId: "cbo", metric: "revenue_pct_gdp", horizonYear: 2035, direction: 1, burdenMultiplier: 1.07, weight: 0.8 },
    { sourceId: "cbo", metric: "revenue_pct_gdp", horizonYear: 2055, direction: 1, burdenMultiplier: 1.129, weight: 0.8 },
    { sourceId: "pwbm", metric: "debt", horizonYear: 2055, direction: 1, burdenMultiplier: null, weight: 0.6 },
    { sourceId: "contrarian", metric: "x", horizonYear: 2055, direction: -1, burdenMultiplier: null, weight: 0.2 },
  ];
  it("weights sources, measures coverage and agreement, and blends with history", () => {
    expect(sourceWeight(0.9, 0.5, 0.7)).toBeCloseTo(0.9 * 0.75 * 0.85, 3);
    const c30 = consensusAt(claims, 2026, 30, 2.4);
    expect(c30.claims).toBe(3);
    expect(c30.direction).toBeGreaterThan(0.5);
    expect(c30.agreement).toBeLessThan(1);
    expect(c30.burdenMultiplier).toBeCloseTo(1.129, 3);
    expect(consensusAt(claims, 2026, 5, 2.4).claims).toBe(0);
    const traj = taxTrajectory({ startYear: 2026, claims, totalPanelWeight: 2.4 });
    expect(traj.map((p) => p.horizonYears)).toEqual([...HORIZONS]);
    const p5 = traj[0]!, p30 = traj.find((p) => p.horizonYears === 30)!;
    expect(p5.weightOnHistory).toBe(1); // nothing published at five years → history alone
    expect(p30.weightOnHistory).toBeLessThan(1);
    expect(p30.pHigher).toBeGreaterThan(p5.pHigher);
    expect(p30.burdenMultiplier).toBeGreaterThan(1);
    expect(p30.confidence).toBeGreaterThan(0);
    expect(p30.confidence).toBeLessThanOrEqual(1);
    expect(p30.expectedTopRate).toBeCloseTo(37 * p30.burdenMultiplier, 1); // the rate a client reads is the one the projection charges
    const tempered = taxTrajectory({ startYear: 2026, claims, totalPanelWeight: 2.4, allPanelWeight: 9.6 }).find((p) => p.horizonYears === 30)!;
    expect(tempered.confidence).toBeLessThan(p30.confidence); // a mostly silent panel is less sure
    expect(burdenAt(traj, 0)).toBe(1);
    expect(burdenAt(traj, 2.5)).toBeCloseTo(1 + (p5.burdenMultiplier - 1) / 2, 6);
    expect(burdenAt(traj, 60)).toBe(traj.at(-1)!.burdenMultiplier);
  });
  it("ships only verified, cited seeds and every source has a definition", () => {
    for (const c of CLAIM_SEEDS) {
      expect(SOURCES.some((s) => s.id === c.sourceId), c.sourceId).toBe(true);
      expect(c.citation).toBeTruthy();
      expect(c.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const cbo55 = CLAIM_SEEDS.find((c) => c.sourceId === "cbo" && c.metric === "revenue_pct_gdp" && c.horizonYear === 2055)!;
    expect(cbo55.value).toBe("19.3");
    expect(Number(cbo55.burdenMultiplier)).toBeCloseTo(19.3 / 17.1, 3);
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    expect(SOURCES.length).toBeGreaterThanOrEqual(10);
  });
});

describe("inflation ladder, purchasing power, hurdle", () => {
  it("annualises index levels, decays a dollar, and finds the nominal return needed", () => {
    expect(annualised(100, 200, 10)).toBeCloseTo(0.0718, 3);
    expect(purchasingPower(0.03, 40)).toBeCloseTo(0.3066, 3);
    // the owner's intuition: with 7% inflation, 3% real target and 40% tax on growth you need about 17%
    expect(hurdleRate(0.03, 0.07, 0.4)).toBeCloseTo(0.1702, 3);
    expect(hurdleRate(0, 0.03, 0)).toBeCloseTo(0.03, 6);
    const obs = [{ date: "2016-08-01", value: 100 }, { date: "2021-08-01", value: 120 }, { date: "2025-08-01", value: 130 }, { date: "2026-08-01", value: 133 }];
    const l = ladderFrom(obs)!;
    expect(l.asOf).toBe("2026-08-01");
    expect(l.rates[1]).toBeCloseTo(133 / 130 - 1, 4);
    expect(l.rates[5]).toBeCloseTo((133 / 120) ** 0.2 - 1, 4);
    expect(l.rates[10]).toBeCloseTo((133 / 100) ** 0.1 - 1, 4);
    expect(l.rates[20]).toBeUndefined();
    const cats = [{ id: "shelter", label: "Shelter", asOf: "2026-08-01", rates: { 20: 0.04 } }, { id: "tuition", label: "Tuition", asOf: "2026-08-01", rates: { 20: 0.05 } }, { id: "gasoline", label: "Gas", asOf: "2026-08-01", rates: {} }];
    const b = basketRate([{ categoryId: "shelter", weight: 3 }, { categoryId: "tuition", weight: 1 }, { categoryId: "gasoline", weight: 1 }], cats, 20);
    expect(b.rate).toBeCloseTo(0.0425, 4);
    expect(b.covered).toBeCloseTo(0.8, 3);
  });
});

describe("two projections", () => {
  const claims: WeightedClaim[] = [2035, 2045, 2055].map((y, i) => ({ sourceId: "cbo", metric: "revenue_pct_gdp", horizonYear: y, direction: 1 as const, burdenMultiplier: [1.07, 1.105, 1.129][i]!, weight: 0.8 }));
  const trajectory = taxTrajectory({ startYear: 2026, claims, totalPanelWeight: 0.8 });
  const input = { startYear: 2026, years: 40, income: 650_000, incomeGrowth: 0.03, filing: "joint" as const, savingsRate: 0.2, savings: 500_000, nominalReturn: 0.07, taxOnGrowth: 0.25, inflation: 0.03, trajectory };
  it("projects current law and the expected path in today's dollars, and the gap is the tax drag", () => {
    const base = project(input, false), alt = project(input, true);
    expect(base.years).toHaveLength(41);
    expect(base.years[0]!.effectiveRate).toBeGreaterThan(0.2);
    expect(base.years[0]!.effectiveRate).toBe(alt.years[0]!.effectiveRate);
    expect(alt.at[30]!.effectiveRate).toBeGreaterThan(base.at[30]!.effectiveRate);
    expect(alt.at[30]!.realWealth).toBeLessThan(base.at[30]!.realWealth);
    // real income grows at (1.03/1.03) → flat real income, so real after-tax under current law is roughly flat
    expect(Math.abs(base.at[20]!.realAfterTax / base.years[0]!.afterTax - 1)).toBeLessThan(0.05);
    const s = erosionSummary(input, 0.03);
    expect(s.realWealthGap[40]).toBeLessThan(0);
    expect(s.cumulativeExtraTax).toBeGreaterThan(0);
    expect(s.hurdle.nominalNeeded).toBeCloseTo(hurdleRate(0.03, 0.03, 0.25), 6);
    expect(s.dollarIn40Years).toBeCloseTo(purchasingPower(0.03, 40), 6);
  });
});

describe("the sphere", () => {
  it("places every point on a real route, evenly around twelve meridians and four latitudes", () => {
    const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
    const routes = new Set(Array.from(app.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), (m) => m[1]));
    for (const p of SPHERE_POINTS) expect(routes.has(p.path), p.path).toBe(true);
    expect(MERIDIANS).toHaveLength(12);
    expect(new Set(MERIDIANS.map((m) => m.degree)).size).toBe(12);
    expect(LATITUDES.map((l) => l.id)).toEqual(["facts", "erosion", "moves", "proof"]);
    for (const m of MERIDIANS) expect(SPHERE_POINTS.some((p) => p.meridian === m.id), m.id).toBe(true);
    for (const l of LATITUDES) expect(SPHERE_POINTS.some((p) => p.latitude === l.id), l.id).toBe(true);
    expect(pointsAt("taxes", "erosion").some((p) => p.path === "/portal/erosion")).toBe(true);
    const xy = projectPoint(SPHERE_POINTS.find((p) => p.path === "/portal/plan-ledger")!);
    expect(Math.hypot(xy.x, xy.y)).toBeLessThan(0.2); // Proof sits near the centre
    const rim = projectPoint(SPHERE_POINTS.find((p) => p.path === "/portal/financial-assessment")!);
    expect(Math.hypot(rim.x, rim.y)).toBeGreaterThan(0.8);
  });
});

describe("keyless FRED and the harvest guards", () => {
  it("parses FRED's CSV download and serves it when no key is set", async () => {
    const { parseFredCsv, fetchFredObservations, fetchFredObservationsSince, _setFetchForTests, fredMode } = await import("./_core/fred");
    const csv = "observation_date,CPIAUCSL\n2024-06-01,313.049\n2024-07-01,.\n2025-06-01,321.5\nbad,line\n";
    const rows = parseFredCsv(csv);
    expect(rows).toEqual([{ date: "2024-06-01", value: 313.049 }, { date: "2025-06-01", value: 321.5 }]);
    const seen: string[] = [];
    _setFetchForTests(async (url) => { seen.push(url); return { ok: true, status: 200, json: async () => ({}), text: async () => csv }; });
    try {
      const env = {} as NodeJS.ProcessEnv;
      expect(fredMode(env)).toBe("csv");
      const since = await fetchFredObservationsSince("CPIAUCSL", "1985-01-01", env);
      expect(since.map((o) => o.date)).toEqual(["2024-06-01", "2025-06-01"]);
      const latest = await fetchFredObservations("CPIAUCSL", 1, env);
      expect(latest).toEqual([{ date: "2025-06-01", value: 321.5 }]);
      expect(seen.every((u) => u.startsWith("https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL&cosd="))).toBe(true);
      expect(seen.some((u) => u.includes("api_key"))).toBe(false);
    } finally { _setFetchForTests(null); }
  });

  it("reads each metric deterministically and admits a figure only with its verbatim sentence", async () => {
    const { readingFor, quoteVerified, parseHarvestReply } = await import("./forecastSources");
    expect(readingFor("revenue_pct_gdp", 19.3, 17.1)).toEqual({ direction: 1, burdenMultiplier: 1.1287 });
    expect(readingFor("revenue_pct_gdp", 16, 17.1)).toEqual({ direction: -1, burdenMultiplier: 0.9357 });
    expect(readingFor("debt_pct_gdp", 156, 100)).toEqual({ direction: 1, burdenMultiplier: null });
    expect(readingFor("debt_pct_gdp", 156, null)).toEqual({ direction: 0, burdenMultiplier: null }); // no base, no reading
    expect(readingFor("ss_oasi_depletion_year", 2033, null)).toEqual({ direction: 1, burdenMultiplier: null });
    expect(readingFor("gdp_effect_pct_30y", 0.7, null)).toEqual({ direction: 0, burdenMultiplier: null });
    expect(readingFor("made_up_metric", 1, 2)).toBeNull();
    const page = "In CBO’s projections, federal debt held by the public rises from 100 percent of GDP in 2025 to 156 percent in 2055.  Revenues total 19.3 percent of GDP in 2055.";
    expect(quoteVerified(page, { metric: "debt_pct_gdp", horizonYear: 2055, value: 156, unit: "% GDP", baseValue: 100, asOf: null, quote: "federal debt held by the public rises from 100 percent of GDP in 2025 to 156 percent in 2055" })).toBe(true);
    expect(quoteVerified(page, { metric: "debt_pct_gdp", horizonYear: 2055, value: 156, unit: "% GDP", baseValue: 100, asOf: null, quote: "In CBO's projections, federal debt held by the public rises from 100 percent of GDP in 2025 to 156 percent in 2055." })).toBe(true); // curly vs straight quote, whitespace
    expect(quoteVerified(page, { metric: "debt_pct_gdp", horizonYear: 2055, value: 166, unit: "% GDP", baseValue: 100, asOf: null, quote: "federal debt held by the public rises from 100 percent of GDP in 2025 to 156 percent in 2055" })).toBe(false); // number not in the sentence
    expect(quoteVerified(page, { metric: "debt_pct_gdp", horizonYear: 2055, value: 156, unit: "% GDP", baseValue: 100, asOf: null, quote: "debt reaches 156 percent of GDP by 2055 under current law" })).toBe(false); // sentence not on the page
    expect(parseHarvestReply('Sure. {"claims":[{"metric":"revenue_pct_gdp","horizonYear":2055,"value":"19.3","unit":"% GDP","baseValue":null,"asOf":"2025-03-27","quote":"Revenues total 19.3 percent of GDP in 2055."},{"metric":"x","horizonYear":1999,"quote":"no"}]}')).toEqual([{ metric: "revenue_pct_gdp", horizonYear: 2055, value: 19.3, unit: "% GDP", baseValue: null, asOf: "2025-03-27", quote: "Revenues total 19.3 percent of GDP in 2055." }]);
    expect(parseHarvestReply("no json here")).toEqual([]);
  });

  it("harvests with the council, keeps only verified readable figures, and corroborates across voices", async () => {
    const { harvestSource, SOURCES } = await import("./forecastSources");
    const cbo = SOURCES.find((s) => s.id === "cbo")!;
    const text = "The Long-Term Budget Outlook: 2025 to 2055. In CBO’s projections, federal debt held by the public rises from 100 percent of GDP in 2025 to 156 percent in 2055. Revenues total 19.3 percent of GDP in 2055, up from 17.1 percent in 2025. Outlays reach 26.6 percent of GDP in 2055. ".repeat(3);
    const replies: Record<string, string> = {
      A: JSON.stringify({ claims: [
        { metric: "revenue_pct_gdp", horizonYear: 2055, value: 19.3, unit: "% GDP", baseValue: 17.1, asOf: null, quote: "Revenues total 19.3 percent of GDP in 2055, up from 17.1 percent in 2025." },
        { metric: "debt_pct_gdp", horizonYear: 2055, value: 156, unit: "% GDP", baseValue: 100, asOf: null, quote: "federal debt held by the public rises from 100 percent of GDP in 2025 to 156 percent in 2055" },
        { metric: "deficit_pct_gdp", horizonYear: 2055, value: 7.3, unit: "% GDP", baseValue: 6.2, asOf: null, quote: "Deficits reach 7.3 percent of GDP in 2055" }, // not on the page: hallucinated
      ] }),
      B: JSON.stringify({ claims: [
        { metric: "revenue_pct_gdp", horizonYear: 2055, value: 19.3, unit: "percent of GDP", baseValue: null, asOf: null, quote: "Revenues total 19.3 percent of GDP in 2055" },
        { metric: "outlays_pct_gdp", horizonYear: 2055, value: 26.6, unit: "% GDP", baseValue: null, asOf: null, quote: "Outlays reach 26.6 percent of GDP in 2055." }, // no base: reads flat, kept for the record
      ] }),
      C: "I could not find projections.",
    };
    const r = await harvestSource(cbo, { text, voices: [{ label: "A" }, { label: "B" }, { label: "C" }], ask: async (v) => replies[v.label]!, today: "2026-09-06" });
    expect(r.harvested).toBe(true);
    if (!r.harvested) return;
    expect(r.voices).toEqual(["A", "B", "C"]);
    expect(r.reported).toBe(5);
    expect(r.verified).toBe(4);   // the deficit sentence is not on the page
    expect(r.stored).toBe(3);     // revenue (A+B corroborated), debt, outlays — no database in tests, so "stored" is what would be queued
    const none = await harvestSource(cbo, { text, voices: [], ask: async () => "" });
    expect(none.harvested).toBe(false);
  });
});
