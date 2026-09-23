/**
 * Global Macro Intelligence — engine tests.
 *
 * These guard the standing orders (source minimums, sourced figures, 10,000
 * runs, reproducibility) and the arithmetic of each engine. Nothing here
 * touches the network.
 */
import { describe, expect, it } from "vitest";
import {
  MACRO_SOURCES,
  SOURCE_BY_ID,
  SOURCE_MINIMUMS,
  sourcesByJurisdiction,
  sourcesFor,
  ALL_INDICATORS,
  INDICATOR_PANELS,
  JAPAN_LIQUIDATION,
  CHINA_LIQUIDATION,
  PETRODOLLAR_RIPPLE,
  TAIWAN_STRIKE,
  SEED_OBSERVATIONS,
  TREASURY_HOLDINGS,
  DEBT_TABLE,
  assess,
  freshness,
  corroborationBoost,
  signalFrom,
  gradeFor,
  simulateLiquidation,
  forecastLiquidation,
  paceMultiplier,
  assessLiquidation,
  settlementBreakdown,
  historicalSeries,
  forecastPetrodollar,
  CORRIDORS,
  assessSovereign,
  assessAll,
  contagion,
  debtOverview,
  assessTaiwan,
  simulateTaiwanImpact,
  TAIWAN_PRIORS,
  followThroughReport,
  statementCredibility,
  STATEMENT_LEDGER,
  detectPatterns,
  illustrativeSeries,
  pearson,
  macroAdjustments,
  applyMacro,
  NEUTRAL_ADJUSTMENTS,
  MACRO_SIMULATION_RUNS,
  mulberry32,
  summarise,
} from "@shared/macro";
import type { Environment, Evidence, Statement, StatementCategory } from "@shared/macro";

const TODAY = "2026-09-22";

describe("source registry — the standing-order minimums", () => {
  it("has at least fifteen Japanese sources and no Chinese or Hong Kong one", () => {
    expect(sourcesByJurisdiction("JP").length).toBeGreaterThanOrEqual(SOURCE_MINIMUMS.JP);
    expect(sourcesByJurisdiction("CN").length).toBeLessThanOrEqual(SOURCE_MINIMUMS.CN);
    expect(sourcesByJurisdiction("HK")).toEqual([]);
  });

  it("no source is a Chinese government, Party or state-media site, or sits on a .cn/.hk/.mo host", () => {
    const host = (u?: string) => { try { return u ? new URL(u.replace("{KEY}", "k")).hostname : ""; } catch { return ""; } };
    for (const s of MACRO_SOURCES) {
      for (const u of [s.url, s.apiUrl]) expect(host(u), s.id).not.toMatch(/\.(?:cn|hk|mo)$/);
      expect(`${s.entity} ${s.name}`, s.id).not.toMatch(/Xinhua|People's Bank of China|\bPBOC\b|\bSAFE\b|State Council|\bNPC\b|Politburo|\bCCP\b|MOFCOM|Global Times|People's Daily|Shanghai (?:Futures|Gold) Exchange|China Investment Corporation|CSRC|\bNFRA\b|NDRC|National Bureau of Statistics of China/);
    }
  });

  it("has at least twenty-five oil-settlement sources, ten debt sources, ten Taiwan sources", () => {
    expect(sourcesFor("oil-settlement").length).toBeGreaterThanOrEqual(SOURCE_MINIMUMS["oil-settlement"]);
    expect(sourcesFor("sovereign-debt").length).toBeGreaterThanOrEqual(SOURCE_MINIMUMS["sovereign-debt"]);
    expect(sourcesFor("taiwan-risk").length).toBeGreaterThanOrEqual(SOURCE_MINIMUMS["taiwan-risk"]);
  });

  it("every source has a unique id, a URL, an entity and a one-line provides", () => {
    const ids = MACRO_SOURCES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of MACRO_SOURCES) {
      expect(s.url).toMatch(/^https?:\/\//);
      expect(s.entity.length).toBeGreaterThan(2);
      expect(s.provides.length).toBeGreaterThan(10);
    }
  });

  it("no source claims the state-media tier (the Chinese Party organs that held it were removed)", () => {
    expect(MACRO_SOURCES.filter(s => s.tier === "state-media")).toEqual([]);
  });

  it("keyed sources name the environment variable that holds the key", () => {
    for (const s of MACRO_SOURCES.filter(s => s.access === "keyed-api")) expect(s.keyEnv).toBeTruthy();
  });
});

describe("indicator panels", () => {
  it("Japan has fifteen indicators; the China, petrodollar and Taiwan panels keep only rows a U.S. or allied publisher can feed", () => {
    // 23 Sep 2026: rows readable only from a Chinese government, Party, state-media
    // or .cn/.hk site were removed (China 15 → 9, petrodollar 50 → 44, Taiwan 50 → 39).
    expect(JAPAN_LIQUIDATION).toHaveLength(15);
    expect(CHINA_LIQUIDATION).toHaveLength(9);
    expect(PETRODOLLAR_RIPPLE).toHaveLength(44);
    expect(TAIWAN_STRIKE).toHaveLength(39);
  });

  it("every indicator cites only registered sources and has a unique id", () => {
    const ids = ALL_INDICATORS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of ALL_INDICATORS) {
      expect(i.sourceIds.length).toBeGreaterThan(0);
      for (const sid of i.sourceIds) expect(SOURCE_BY_ID.has(sid), `${i.id} cites unknown source ${sid}`).toBe(true);
      expect(i.weight).toBeGreaterThan(0);
      expect(i.weight).toBeLessThanOrEqual(1);
    }
  });

  it("each panel carries indicators below public awareness", () => {
    for (const panel of Object.values(INDICATOR_PANELS)) {
      expect(panel.some(i => i.awareness === "latent")).toBe(true);
    }
  });

  it("every seed observation targets a real indicator and a real source", () => {
    const byId = new Set(ALL_INDICATORS.map(i => i.id));
    for (const o of SEED_OBSERVATIONS) {
      expect(byId.has(o.indicatorId), o.indicatorId).toBe(true);
      expect(SOURCE_BY_ID.has(o.sourceId), o.sourceId).toBe(true);
      expect(o.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("confidence engine", () => {
  const inds = JAPAN_LIQUIDATION;
  const ev = (id: string, signal: number, asOf = TODAY, tier: Evidence["tier"] = "primary-official", corroboration = 1): Evidence => ({
    indicatorId: id,
    signal,
    weight: inds.find(i => i.id === id)!.weight,
    tier,
    asOf,
    corroboration,
  });

  it("returns the prior with zero confidence when there is no evidence", () => {
    const a = assess({ modelId: "t", prior: 0.15, indicators: inds, evidence: [], today: TODAY });
    expect(a.band.probability).toBeCloseTo(0.15, 3);
    expect(a.band.confidence).toBe(0);
    expect(a.band.grade).toBe("F");
    expect(a.missing).toHaveLength(inds.length);
  });

  it("fresh unanimous risk-up evidence raises the probability and the confidence", () => {
    const evidence = inds.map(i => ev(i.id, i.direction === "risk-up" ? 1 : -1));
    const a = assess({ modelId: "t", prior: 0.15, indicators: inds, evidence, today: TODAY });
    expect(a.band.probability).toBeGreaterThan(0.6);
    expect(a.band.confidence).toBeGreaterThanOrEqual(85);
    expect(a.band.grade).toBe("A");
    expect(a.coverage).toBeCloseTo(1, 1);
  });

  it("stale evidence earns less confidence than fresh evidence with the same signal", () => {
    const fresh = assess({ modelId: "t", prior: 0.15, indicators: inds, evidence: inds.slice(0, 6).map(i => ev(i.id, 0.5)), today: TODAY });
    const stale = assess({ modelId: "t", prior: 0.15, indicators: inds, evidence: inds.slice(0, 6).map(i => ev(i.id, 0.5, "2025-09-22")), today: TODAY });
    expect(stale.band.confidence).toBeLessThan(fresh.band.confidence);
    expect(stale.drivers.every(d => d.stale)).toBe(true);
  });

  it("fewer than four live indicators cannot score above C", () => {
    const a = assess({ modelId: "t", prior: 0.15, indicators: inds, evidence: inds.slice(0, 3).map(i => ev(i.id, 1)), today: TODAY });
    expect(a.band.confidence).toBeLessThan(50);
  });

  it("state media weighs less than a primary source for the same reading", () => {
    const off = assess({ modelId: "t", prior: 0.15, indicators: inds, evidence: inds.slice(0, 5).map(i => ev(i.id, 1)), today: TODAY });
    const media = assess({ modelId: "t", prior: 0.15, indicators: inds, evidence: inds.slice(0, 5).map(i => ev(i.id, 1, TODAY, "state-media")), today: TODAY });
    expect(media.band.probability).toBeLessThan(off.band.probability);
  });

  it("interval widens as confidence falls and never leaves [0,1]", () => {
    const a = assess({ modelId: "t", prior: 0.9, indicators: inds, evidence: inds.slice(0, 2).map(i => ev(i.id, 1)), today: TODAY });
    expect(a.band.low).toBeGreaterThanOrEqual(0);
    expect(a.band.high).toBeLessThanOrEqual(1);
    expect(a.band.high - a.band.low).toBeGreaterThan(0.3);
  });

  it("helpers behave: freshness halves at one half-life, corroboration has diminishing returns, signals clamp", () => {
    expect(freshness("2026-08-08", "2026-09-22", "monthly")).toBeCloseTo(0.5, 2);
    expect(corroborationBoost(1)).toBe(1);
    expect(corroborationBoost(3)).toBeGreaterThan(corroborationBoost(2));
    expect(corroborationBoost(10) - corroborationBoost(9)).toBeLessThan(corroborationBoost(3) - corroborationBoost(2));
    expect(signalFrom(200, 0, 100)).toBe(1);
    expect(signalFrom(-200, 0, 100)).toBe(-1);
    expect(gradeFor(85)).toBe("A");
    expect(gradeFor(29)).toBe("F");
  });
});

describe("treasury liquidation scenario engine", () => {
  it("runs ten thousand paths by default and is reproducible", () => {
    const a = simulateLiquidation({ holder: "CN", fraction: 0.5, months: 6 });
    const b = simulateLiquidation({ holder: "CN", fraction: 0.5, months: 6 });
    expect(a.peakTenYearDeltaBp.n).toBe(MACRO_SIMULATION_RUNS);
    expect(a.peakTenYearDeltaBp.p50).toBe(b.peakTenYearDeltaBp.p50);
  });

  it("sells the right amount and reports it against the market", () => {
    const r = simulateLiquidation({ holder: "JP", fraction: 0.25, months: 12, runs: 500 });
    expect(r.holdingsUsdBn).toBe(TREASURY_HOLDINGS.japan);
    expect(r.soldUsdBn).toBeCloseTo(TREASURY_HOLDINGS.japan * 0.25, 0);
    expect(r.shareOfForeignHoldings).toBeCloseTo((TREASURY_HOLDINGS.japan * 0.25) / TREASURY_HOLDINGS.totalForeign, 3);
    expect(r.centralPath[11].cumulativeSoldUsdBn).toBeCloseTo(r.soldUsdBn, 0);
  });

  it("a dump hits harder than a glide of the same size", () => {
    const dump = simulateLiquidation({ holder: "CN", fraction: 1, months: 1, runs: 500 });
    const glide = simulateLiquidation({ holder: "CN", fraction: 1, months: 24, runs: 500 });
    expect(dump.peakTenYearDeltaBp.p50).toBeGreaterThan(glide.peakTenYearDeltaBp.p50);
    expect(paceMultiplier(1)).toBeGreaterThan(paceMultiplier(12));
    expect(paceMultiplier(12)).toBe(1);
  });

  it("selling everything from both holders is a large but bounded move, and the Fed responds", () => {
    const r = simulateLiquidation({ holder: "BOTH", fraction: 1, months: 3, runs: 2000 });
    expect(r.soldUsdBn).toBeCloseTo(TREASURY_HOLDINGS.japan + TREASURY_HOLDINGS.chinaMainland, 0);
    expect(r.peakTenYearDeltaBp.p50).toBeGreaterThan(100);
    expect(r.peakTenYearDeltaBp.p95).toBeLessThan(1500);
    expect(r.fedResponded).toBeGreaterThan(0.3);
  });

  it("transmission is monotone in the yield move and carries its assumptions", () => {
    const small = simulateLiquidation({ holder: "CN", fraction: 0.1, months: 12, runs: 200 });
    const big = simulateLiquidation({ holder: "CN", fraction: 0.9, months: 12, runs: 200 });
    expect(big.transmission.mortgageRateDeltaBp).toBeGreaterThan(small.transmission.mortgageRateDeltaBp);
    expect(big.transmission.equityIndexPct).toBeLessThan(small.transmission.equityIndexPct);
    expect(big.transmission.federalInterestCostUsdBnPerYear).toBeGreaterThan(0);
    expect(r => r.assumptions.length).toBeTruthy();
    expect(big.assumptions.some(a => /Warnock/.test(a))).toBe(true);
    expect(big.sourceIds).toContain("us-tic-mfh");
  });

  it("zero fraction is a no-op", () => {
    const r = simulateLiquidation({ holder: "JP", fraction: 0, months: 6, runs: 100 });
    expect(r.soldUsdBn).toBe(0);
    expect(r.peakTenYearDeltaBp.max).toBe(0);
  });
});

describe("treasury liquidation forecast", () => {
  it("reports cumulative sales at four horizons with exceedance probabilities", () => {
    const f = forecastLiquidation({ holder: "JP", stressProbability: 0.2, runs: 2000 });
    expect(f.horizons.map(h => h.months)).toEqual([6, 12, 18, 24]);
    expect(f.exceedance.map(e => e.share)).toEqual([0.05, 0.1, 0.25, 0.5, 0.75, 1.0]);
    for (const e of f.exceedance) {
      expect(e.probability).toBeGreaterThanOrEqual(0);
      expect(e.probability).toBeLessThanOrEqual(1);
    }
    // Exceedance is monotone non-increasing in the share.
    for (let i = 1; i < f.exceedance.length; i++) expect(f.exceedance[i].probability).toBeLessThanOrEqual(f.exceedance[i - 1].probability);
  });

  it("a higher stress probability sells more at 24 months", () => {
    const lo = forecastLiquidation({ holder: "CN", stressProbability: 0.05, runs: 2000 });
    const hi = forecastLiquidation({ holder: "CN", stressProbability: 0.6, runs: 2000 });
    expect(hi.horizons[3].sold.mean).toBeGreaterThan(lo.horizons[3].sold.mean);
  });

  it("never sells more than the holder has", () => {
    const f = forecastLiquidation({ holder: "CN", stressProbability: 1, runs: 1000 });
    expect(f.horizons[3].sold.max).toBeLessThanOrEqual(f.holdingsUsdBn + 1e-6);
  });

  it("uses the measured TIC run-rate", () => {
    const f = forecastLiquidation({ holder: "JP", stressProbability: 0.1, runs: 100 });
    expect(f.measuredRunRateUsdBnPerMonth).toBeCloseTo((TREASURY_HOLDINGS.japan - TREASURY_HOLDINGS.japanThreeMonthsAgo) / 3, 1);
  });
});

describe("daily liquidation confidence", () => {
  it("scores Japan and China from the seed observations with a narrative and a forecast", () => {
    for (const holder of ["JP", "CN"] as const) {
      const c = assessLiquidation(holder, SEED_OBSERVATIONS, TODAY);
      expect(c.stress.band.probability).toBeGreaterThan(0);
      expect(c.stress.band.probability).toBeLessThan(1);
      expect(c.narrative).toContain("confidence");
      expect(c.forecast.horizons).toHaveLength(4);
    }
    const jp = assessLiquidation("JP", SEED_OBSERVATIONS, TODAY);
    expect(jp.stress.band.confidence).toBeGreaterThan(30);
    expect(jp.stress.drivers.length).toBeGreaterThan(5);
    // China is now read only from U.S. data (TIC, OFAC): fewer drivers, and a confidence that says so.
    const cn = assessLiquidation("CN", SEED_OBSERVATIONS, TODAY);
    expect(cn.stress.drivers.length).toBeGreaterThanOrEqual(3);
  });

  it("Japan's 2026 evidence reads as elevated versus its prior", () => {
    const c = assessLiquidation("JP", SEED_OBSERVATIONS, TODAY);
    expect(c.stress.band.probability).toBeGreaterThan(0.15);
  });

  it("China carries no statement indicator: no Chinese official or state-media channel is read", () => {
    const c = assessLiquidation("CN", SEED_OBSERVATIONS, TODAY);
    expect(c.statementWeights).toEqual([]);
    for (const o of SEED_OBSERVATIONS) expect(SOURCE_BY_ID.get(o.sourceId)?.jurisdiction, `${o.indicatorId} ← ${o.sourceId}`).not.toMatch(/^(?:CN|HK)$/);
  });
});

describe("petrodollar tracker", () => {
  it("aggregates the corridor ledger into a non-USD share near the consensus", () => {
    const b = settlementBreakdown();
    expect(b.nonUsdShare).toBeGreaterThanOrEqual(0.15);
    expect(b.nonUsdShare).toBeLessThanOrEqual(0.25);
    expect(b.byCurrency[0].currency).toBe("USD");
    expect(b.byCurrency.find(c => c.currency === "CNY")!.share).toBeGreaterThan(0.03);
    expect(b.corridorCount).toBe(CORRIDORS.length);
    expect(b.concentration.length).toBeGreaterThan(0);
    expect(b.sourceIds).toContain("iea-omr");
  });

  it("every corridor cites registered sources and has a sane share range", () => {
    for (const c of CORRIDORS) {
      expect(c.shareLow).toBeLessThanOrEqual(c.share);
      expect(c.share).toBeLessThanOrEqual(c.shareHigh);
      for (const s of c.sourceIds) expect(SOURCE_BY_ID.has(s), s).toBe(true);
    }
  });

  it("produces a twenty-year history at every roll-up", () => {
    const annual = historicalSeries("annual");
    expect(annual[0].period).toBe("2006");
    expect(annual[annual.length - 1].period).toBe("2026");
    expect(annual[annual.length - 1].nonUsdShare).toBeGreaterThan(annual[0].nonUsdShare);
    expect(historicalSeries("quarterly").length).toBeGreaterThan(70);
    expect(historicalSeries("monthly").length).toBeGreaterThan(230);
    expect(historicalSeries("semiannual").some(p => p.period.endsWith("-H2"))).toBe(true);
  });

  it("observed points override interpolated ones", () => {
    const s = historicalSeries("annual", [{ period: "2024", nonUsdShare: 99, low: 90, high: 100 }]);
    expect(s.find(p => p.period === "2024")!.nonUsdShare).toBe(99);
  });

  it("forecast is an S-curve toward a ceiling with ten thousand paths", () => {
    const f = forecastPetrodollar({ years: 10 });
    expect(f.path).toHaveLength(10);
    expect(f.path[0].share.n).toBe(MACRO_SIMULATION_RUNS);
    expect(f.path[9].share.p50).toBeGreaterThan(f.startShare);
    expect(f.path[9].share.p50).toBeLessThan(60);
    expect(f.exceedance.find(e => e.threshold === 25)!.probability).toBeGreaterThan(f.exceedance.find(e => e.threshold === 50)!.probability);
  });
});

describe("global debt tracker", () => {
  it("covers sixty-plus economies including the IMF world aggregate", () => {
    expect(DEBT_TABLE.length).toBeGreaterThanOrEqual(60);
    const world = DEBT_TABLE.find(r => r.iso3 === "WLD")!;
    expect(world.debt2026).toBeCloseTo(95.3, 1);
  });

  it("Japan at 204 % scores safer than Argentina at 72 %", () => {
    const jp = assessSovereign(DEBT_TABLE.find(r => r.iso3 === "JPN")!);
    const ar = assessSovereign(DEBT_TABLE.find(r => r.iso3 === "ARG")!);
    expect(jp.score).toBeLessThan(ar.score);
    expect(jp.twoYearDefaultProbability).toBeLessThan(ar.twoYearDefaultProbability);
    expect(ar.bucket).not.toBe("safe");
  });

  it("defaulted sovereigns are marked in-default with probability one", () => {
    const ve = assessSovereign(DEBT_TABLE.find(r => r.iso3 === "VEN")!);
    expect(ve.bucket).toBe("in-default");
    expect(ve.twoYearDefaultProbability).toBe(1);
  });

  it("assessAll is sorted worst-first and every row carries five documented factors", () => {
    const all = assessAll();
    for (let i = 1; i < all.length; i++) expect(all[i].score).toBeLessThanOrEqual(all[i - 1].score);
    for (const r of all) {
      expect(r.factors).toHaveLength(5);
      expect(r.factors.reduce((s, f) => s + f.weight, 0)).toBeCloseTo(1, 5);
      expect(r.sourceId).toBe("imf-weo");
    }
  });

  it("contagion scales with the GDP share of the trigger set", () => {
    const small = contagion({ countries: ["ZMB"] });
    const big = contagion({ countries: ["ITA", "FRA"] });
    expect(big.triggerGdpShare).toBeGreaterThan(small.triggerGdpShare);
    expect(big.effects.emSpreadDeltaBp).toBeGreaterThan(small.effects.emSpreadDeltaBp);
    expect(big.effects.equityVolMultiplier).toBeGreaterThan(small.effects.equityVolMultiplier);
    expect(small.effects.usTreasuryFlightBp).toBeLessThanOrEqual(0);
  });

  it("a U.S. trigger inverts the flight-to-safety", () => {
    const us = contagion({ countries: ["USA"] });
    expect(us.effects.usTreasuryFlightBp).toBeGreaterThan(0);
    expect(us.effects.dollarIndexPct).toBeLessThan(0);
  });

  it("overview counts buckets and flags estimated rows", () => {
    const o = debtOverview();
    expect(o.countries).toBe(DEBT_TABLE.length - 1);
    expect(o.estimatedRows).toBeGreaterThan(0);
    expect(o.top10).toHaveLength(10);
    expect(o.world!.debt2031).toBeCloseTo(102.3, 1);
  });
});

describe("Taiwan strike-risk model", () => {
  it("prices four scenarios, ordered by severity, with published impact ranges", () => {
    const a = assessTaiwan(SEED_OBSERVATIONS, TODAY);
    expect(a.scenarios.map(s => s.scenario)).toEqual(["gray-zone", "quarantine", "blockade", "war"]);
    const p = a.scenarios.map(s => s.twelveMonthProbability);
    expect(p[0]).toBeGreaterThan(p[1]);
    expect(p[1]).toBeGreaterThan(p[2]);
    expect(p[2]).toBeGreaterThan(p[3]);
    expect(a.scenarios[3].firstYearWorldGdpPct.mode).toBe(9.6);
    expect(a.scenarios[2].firstYearWorldGdpPct.mode).toBe(5.3);
    expect(a.blockadeOrWorse24m).toBeGreaterThan(0);
    expect(a.blockadeOrWorse24m).toBeLessThan(0.5);
    expect(a.sourceIds).toContain("bloomberg-economics-taiwan");
  });

  it("24-month probability exceeds 12-month for every scenario", () => {
    const a = assessTaiwan(SEED_OBSERVATIONS, TODAY);
    for (const s of a.scenarios) expect(s.twentyFourMonthProbability).toBeGreaterThan(s.twelveMonthProbability);
  });

  it("surfaces latent drivers separately", () => {
    const a = assessTaiwan(SEED_OBSERVATIONS, TODAY);
    expect(a.latentDrivers.every(d => d.awareness === "latent")).toBe(true);
    expect(a.latentDrivers.length).toBeGreaterThan(0);
  });

  it("impact simulation: war costs more than a quarantine; Taiwan is hit hardest", () => {
    const war = simulateTaiwanImpact({ scenario: "war", runs: 2000 });
    const q = simulateTaiwanImpact({ scenario: "quarantine", runs: 2000 });
    expect(war.firstYearGdpPct.p50).toBeLessThan(q.firstYearGdpPct.p50);
    expect(war.chipSupplyLoss).toBe(1);
    expect(war.recessionProbability).toBeGreaterThan(q.recessionProbability);
    const tw = simulateTaiwanImpact({ scenario: "blockade", country: "TWN", runs: 1000 });
    const world = simulateTaiwanImpact({ scenario: "blockade", runs: 1000 });
    expect(tw.firstYearGdpPct.p50).toBeLessThan(world.firstYearGdpPct.p50);
  });

  it("priors sum to a plausible twelve-month escalation mass", () => {
    const sum = Object.values(TAIWAN_PRIORS).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(0.4);
    expect(sum).toBeLessThan(0.8);
  });
});

describe("statement follow-through scorer", () => {
  it("carries no statement coded from a Chinese government, Party or state-media channel", () => {
    // The 1979–2026 Beijing seed ledger was removed on 23 Sep 2026 (owner's order).
    expect(STATEMENT_LEDGER).toEqual([]);
    for (const s of STATEMENT_LEDGER) expect(SOURCE_BY_ID.has(s.sourceId), s.id).toBe(true);
  });

  /** An illustrative ledger for the arithmetic only: generic speakers, no real statement, no Chinese source. */
  const row = (id: string, category: StatementCategory, speaker: string, channel: string, environment: Environment, outcome: Statement["outcome"]): Statement =>
    ({ id, date: "2020-01-01", speaker, channel, category, severity: "threat", environment, claim: "illustrative", outcome, sourceId: "fixture" });
  const FIXTURE: Statement[] = [
    row("m1", "taiwan-military", "Theater Command", "Announcement", "us-official-visit", "followed"),
    row("m2", "taiwan-military", "Theater Command", "Announcement", "us-official-visit", "followed"),
    row("m3", "taiwan-military", "Theater Command", "Announcement", "taiwan-election", "followed"),
    row("m4", "taiwan-military", "Theater Command", "Announcement", "calm", "followed"),
    row("f1", "financial-retaliation", "Commentator", "State media", "sanctions-escalation", "not-followed"),
    row("f2", "financial-retaliation", "Commentator", "State media", "trade-dispute", "not-followed"),
    row("f3", "financial-retaliation", "Ministry", "Statement", "sanctions-escalation", "not-followed"),
    row("f4", "financial-retaliation", "Ministry", "Statement", "sanctions-escalation", "partial"),
    row("t1", "trade-retaliation", "Trade ministry", "Announcement", "trade-dispute", "followed"),
    row("t2", "trade-retaliation", "Trade ministry", "Announcement", "trade-dispute", "partial"),
    row("l1", "sanctions-countermeasure", "State Council", "Law", "sanctions-escalation", "followed"),
    row("c1", "currency-policy", "Central bank", "Statement", "domestic-stress", "reversed"),
    row("p1", "diplomatic-warning", "Ministry", "Statement", "calm", "pending"),
  ];

  it("financial threats follow through less than military announcements", () => {
    const r = followThroughReport(FIXTURE);
    const fin = r.byCategory.find(c => c.category === "financial-retaliation")!.rate;
    const mil = r.byCategory.find(c => c.category === "taiwan-military")!.rate;
    expect(fin.rate).toBeLessThan(mil.rate);
    expect(mil.rate).toBeGreaterThan(0.9);
    expect(fin.rate).toBeLessThan(0.3);
    expect(r.findings.length).toBeGreaterThanOrEqual(3);
  });

  it("channels are grouped and the least reliable one is visible", () => {
    const r = followThroughReport(FIXTURE);
    const media = r.byChannel.find(c => c.channel === "State media")!.rate;
    for (const c of r.byChannel) if (c.channel !== "State media") expect(c.rate.rate).toBeGreaterThanOrEqual(media.rate);
  });

  it("credibility multiplier is bounded and shrinks toward the overall rate in thin cells", () => {
    const fin = statementCredibility("financial-retaliation", "sanctions-escalation", FIXTURE);
    const mil = statementCredibility("taiwan-military", "us-official-visit", FIXTURE);
    expect(fin).toBeGreaterThanOrEqual(0.2);
    expect(fin).toBeLessThan(mil);
    expect(mil).toBeLessThanOrEqual(1);
    const empty = statementCredibility("domestic-economic", "leadership-transition", FIXTURE);
    expect(empty).toBeGreaterThan(0.2);
  });

  it("with no decided statement on record the multiplier is an uninformed 0.5", () => {
    expect(statementCredibility("financial-retaliation", "sanctions-escalation", [])).toBe(0.5);
    expect(statementCredibility("reserve-management", "calm")).toBe(0.5);
  });

  it("Wilson intervals contain the point estimate", () => {
    const r = followThroughReport(FIXTURE);
    expect(r.overall.low).toBeLessThanOrEqual(r.overall.rate);
    expect(r.overall.high).toBeGreaterThanOrEqual(r.overall.rate);
  });
});

describe("emergent pattern detector", () => {
  it("pearson is exact on a known pair", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 6);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 6);
    expect(pearson([1, 1, 1], [1, 2, 3])).toBe(0);
  });

  it("finds structure in the illustrative series and tags below-awareness findings", () => {
    const series = illustrativeSeries(JAPAN_LIQUIDATION.concat(CHINA_LIQUIDATION), 48);
    const r = detectPatterns(series, { minAbsR: 0.5 });
    expect(r.seriesCount).toBe(JAPAN_LIQUIDATION.length + CHINA_LIQUIDATION.length);
    expect(r.months).toBe(48);
    expect(r.correlations.length).toBeGreaterThan(0);
    for (const f of r.correlations) {
      expect(Math.abs(f.r)).toBeGreaterThanOrEqual(0.5);
      expect(f.low).toBeLessThanOrEqual(f.r);
      expect(f.high).toBeGreaterThanOrEqual(f.r);
      expect(["A", "B", "C", "D", "F"]).toContain(f.grade);
    }
    expect(r.belowAwareness.every(f => f.awareness !== "visible")).toBe(true);
    expect(r.method.length).toBeGreaterThan(3);
  });

  it("a lead-lag is only reported when it beats the contemporaneous fit", () => {
    const series = illustrativeSeries(TAIWAN_STRIKE.slice(0, 20), 60);
    const r = detectPatterns(series, { minAbsR: 0.5 });
    for (const f of r.leads) {
      expect(f.lag).toBeGreaterThanOrEqual(1);
      expect(f.leadGain!).toBeGreaterThanOrEqual(0.1);
    }
  });

  it("is silent on too little data", () => {
    const series = illustrativeSeries(JAPAN_LIQUIDATION, 6);
    const r = detectPatterns(series);
    expect(r.correlations).toHaveLength(0);
    expect(r.leads).toHaveLength(0);
    expect(r.conditionals).toHaveLength(0);
  });
});

describe("macro adjustments for calculators", () => {
  it("no toggles → neutral", () => {
    const a = macroAdjustments({});
    expect(a.tenYearYieldDelta).toBe(0);
    expect(a.equityReturnMultiplier).toBe(1);
    expect(a.confidence).toBe(100);
    expect(a.rationale).toEqual(NEUTRAL_ADJUSTMENTS.rationale);
  });

  it("a Treasury liquidation toggle raises yields and mortgage rates and lowers equity returns", () => {
    const a = macroAdjustments({ treasuryLiquidation: { holder: "CN", fraction: 0.5, months: 6 } }, { runs: 500 });
    expect(a.tenYearYieldDelta).toBeGreaterThan(0);
    expect(a.mortgageRateDelta).toBeGreaterThan(0);
    expect(a.mortgageRateDelta).toBeLessThan(a.tenYearYieldDelta + 1e-9);
    expect(a.equityReturnMultiplier).toBeLessThan(1);
    expect(a.goldPct).toBeGreaterThan(0);
    expect(a.rationale[0]).toMatch(/China sell 50 %/);
    expect(a.sourceIds).toContain("us-tic-mfh");
    expect(a.confidence).toBeLessThan(100);
  });

  it("all four toggles compose and stay bounded", () => {
    const a = macroAdjustments(
      {
        treasuryLiquidation: { holder: "BOTH", fraction: 1, months: 3 },
        petrodollarErosion: { targetNonUsdShare: 40, years: 8 },
        sovereignStress: { countries: ["ITA", "FRA", "BRA"] },
        taiwan: { scenario: "blockade" },
      },
      { runs: 500 },
    );
    expect(a.rationale).toHaveLength(4);
    expect(a.recessionProbability).toBeLessThanOrEqual(0.95);
    expect(a.equityVolMultiplier).toBeGreaterThan(1);
    expect(a.inflationDelta).toBeGreaterThan(0);
    expect(a.sourceIds.length).toBeGreaterThan(5);
  });

  it("applyMacro shifts a calculator's inputs without touching fields it does not know", () => {
    const base = { expectedReturn: 0.07, volatility: 0.15, inflationRate: 0.03, mortgageRate: 0.0685, other: "x" };
    const adj = { ...NEUTRAL_ADJUSTMENTS, equityReturnMultiplier: 0.9, equityVolMultiplier: 1.2, inflationDelta: 0.5, mortgageRateDelta: 0.75 };
    const out = applyMacro(base, adj);
    expect(out.expectedReturn).toBeCloseTo(0.063, 6);
    expect(out.volatility).toBeCloseTo(0.18, 6);
    expect(out.inflationRate).toBeCloseTo(0.035, 6);
    expect(out.mortgageRate).toBeCloseTo(0.076, 6);
    expect(out.other).toBe("x");
  });
});

describe("random helpers", () => {
  it("seeded RNG is deterministic and summarise orders percentiles", () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    expect(a()).toBe(b());
    const s = summarise([5, 1, 4, 2, 3]);
    expect(s.min).toBe(1);
    expect(s.max).toBe(5);
    expect(s.p50).toBe(3);
    expect(s.mean).toBe(3);
    expect(s.p10).toBeLessThanOrEqual(s.p90);
  });
});

// ─── Rules table and trunk bridge (standing orders §3: every rate, elasticity,
// prior and threshold carries {source, asOf}; the layer extends the trunk's
// engines rather than duplicating them) ─────────────────────────────────────
import { MACRO_ASSUMPTIONS, A, assumption, assumptionsFor, citeAssumptions, overlayMacroEngine, regimeForAdjustments } from "@shared/macro";
import type { Assumption, TrunkMacroAssumptions } from "@shared/macro";

describe("assumptions rules table", () => {
  it("every row has a non-empty source, an ISO as-of date, a basis, a unit and a kind", () => {
    expect(MACRO_ASSUMPTIONS.size).toBeGreaterThan(100);
    for (const a of Array.from(MACRO_ASSUMPTIONS.values()) as Assumption[]) {
      expect(SOURCE_BY_ID.has(a.source) || a.source.length > 3, `${a.id}: source '${a.source}'`).toBe(true);
      expect(a.asOf, a.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.basis.length, a.id).toBeGreaterThan(10);
      expect(a.unit.length, a.id).toBeGreaterThan(0);
      expect(["rate", "elasticity", "prior", "threshold", "model-choice"]).toContain(a.kind);
      expect(Number.isFinite(a.value), a.id).toBe(true);
    }
  });

  it("registry-id sources resolve to the source registry; the rest are citations with a year", () => {
    for (const a of Array.from(MACRO_ASSUMPTIONS.values()) as Assumption[]) {
      if (SOURCE_BY_ID.has(a.source) || a.source === "platform") continue;
      expect(a.source, a.id).toMatch(/\(?(19|20)\d{2}\)?|S&P|Greenspan|Bernanke|Duffie|Gatheral|Beltran|Warnock|Kaminska|Eichengreen|Reinhart|MSCI|Cboe|J\.P\. Morgan|Federal Reserve|World Gold Council|Fitch/);
    }
  });

  it("A() reads a value and throws on an unknown id", () => {
    expect(A("liq.impact.mode")).toBe(12);
    expect(A("debt.base2y.CCC")).toBe(0.4);
    expect(() => A("liq.impact.typo")).toThrow(/Unknown macro assumption/);
    expect(assumption("tw.prior.war").kind).toBe("prior");
  });

  it("prefix lookups and citations cover a section", () => {
    const tx = assumptionsFor("liq.tx");
    expect(tx.length).toBeGreaterThanOrEqual(10);
    const lines = citeAssumptions("oil.ceiling");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/as of \d{4}-\d{2}-\d{2}/);
  });

  it("engines actually read the table: changing the mortgage pass-through row would change the output", () => {
    const r = simulateLiquidation({ holder: "CN", fraction: 0.5, months: 6, runs: 100 });
    expect(r.transmission.mortgageRateDeltaBp).toBeCloseTo(r.transmission.tenYearDeltaBp * A("liq.tx.mortgagePassThrough"), 0);
    expect(r.assumptions.some(a => a.includes("liq.tx.mortgagePassThrough"))).toBe(true);
  });
});

describe("trunk bridge", () => {
  const base: TrunkMacroAssumptions = {
    baselineCpiPct: 2.5,
    moneyPrinting: { enabled: false, preset: "history-1960-2025", m2GrowthPct: 7, m2VolPct: 3.5, trendM2GrowthPct: 6, passThrough: 0.5, lagYears: 1 },
    hardAssets: { enabled: false, betaRealEstate: 0.6, betaEquities: 0.8, betaCrypto: 2.5 },
    credit: { enabled: false, baseMortgageRatePct: 6.5, rateSensitivityPer10: -1.5, availabilityFloor: 0.5, availabilityCeiling: 1.5 },
    futureTaxation: { enabled: false, startEffectiveRatePct: 24, driftPctPointsPerYear: 0.25, capPct: 50 },
  };

  it("a neutral adjustment leaves the trunk's assumptions untouched", () => {
    const o = overlayMacroEngine(base, NEUTRAL_ADJUSTMENTS);
    expect(o.assumptions).toBe(base);
    expect(o.narrative).toHaveLength(0);
  });

  it("a liquidation adjustment raises the mortgage base rate, enables the credit block, and keeps everything else", () => {
    const adj = macroAdjustments({ treasuryLiquidation: { holder: "BOTH", fraction: 1, months: 3 } }, { runs: 300 });
    const o = overlayMacroEngine(base, adj);
    expect(o.assumptions.credit.enabled).toBe(true);
    expect(o.assumptions.credit.baseMortgageRatePct).toBeCloseTo(6.5 + adj.mortgageRateDelta, 2);
    expect(o.assumptions.hardAssets.betaEquities).toBeLessThan(0.8);
    expect(o.assumptions.futureTaxation).toBe(base.futureTaxation);
    expect(o.narrative[0]).toMatch(/money-printing layer/);
    expect(o.sourceIds).toContain("us-tic-mfh");
  });

  it("maps shocks to the trunk's regime labels", () => {
    expect(regimeForAdjustments(NEUTRAL_ADJUSTMENTS).startRegime).toBeNull();
    expect(regimeForAdjustments({ ...NEUTRAL_ADJUSTMENTS, tenYearYieldDelta: 1.5 }).startRegime).toBe("rate-shock");
    expect(regimeForAdjustments({ ...NEUTRAL_ADJUSTMENTS, tenYearYieldDelta: 1.5, inflationDelta: 1 }).startRegime).toBe("inflation-shock");
    expect(regimeForAdjustments({ ...NEUTRAL_ADJUSTMENTS, tenYearYieldDelta: 1.5, inflationDelta: 1, equityReturnMultiplier: 0.8 }).startRegime).toBe("stagflation");
    expect(regimeForAdjustments({ ...NEUTRAL_ADJUSTMENTS, equityReturnMultiplier: 0.8, equityVolMultiplier: 1.4 }).startRegime).toBe("contraction");
    const rs = regimeForAdjustments({ ...NEUTRAL_ADJUSTMENTS, tenYearYieldDelta: 1.2 });
    expect(rs.thresholds.rateShockRise).toBeLessThanOrEqual(0.02);
    expect(rs.basis.length).toBeGreaterThan(10);
  });
});
