/**
 * Treasury pool, global treasuries, the archaeology scans. Offline.
 *
 * Production port (A22, 2026-09-23): the archive's fourth block ("the vault")
 * tests server/secretsDoc.ts and server/secretsRouter.ts, which are not part of
 * the macro port; it travels with the vault PR (see DECISIONS.md, D-A22-1).
 */
import { describe, expect, it } from "vitest";
import {
  TREASURY_POOL_SERIES,
  TREASURY_HYPOTHESES,
  TREASURY_EPISODES,
  LIQUIDITY_PLAYBOOK,
  treasuryStorageManifest,
  liquidityDryUp,
  predictionGrid,
  COUNTRIES,
  FLOW_INDICATORS,
  COUNTRY_FLOW_EPISODES,
  globalStorageManifest,
  globalFlowCalculus,
  dominoChains,
  turningPoints,
  loudestBeforeTurns,
  regimeSplit,
  latestZScores,
  SOURCE_BY_ID,
  MACRO_ASSUMPTIONS,
  A,
  type PairFinding,
  type MonthlyPoint,
  type Series,
} from "@shared/macro";
import { seriesSpec, historyManifest, parseImfDatamapperSeries, parseAuctionBidToCover } from "./macroHistory";
import { checkUrl } from "./macroConnectors";

const TODAY = "2026-09-23";

describe("the Treasury pool: fifty series", () => {
  it("has fifty series, each keyless with a resolvable key, a registered source, a first date and reasoning", () => {
    expect(TREASURY_POOL_SERIES).toHaveLength(50);
    expect(new Set(TREASURY_POOL_SERIES.map(s => s.id)).size).toBe(50);
    for (const s of TREASURY_POOL_SERIES) {
      expect(SOURCE_BY_ID.has(s.sourceId), s.sourceId).toBe(true);
      const spec = seriesSpec(s.series);
      expect(spec, `${s.id} ${s.series}`).not.toBeNull();
      expect(checkUrl(spec!.url).ok, spec!.url).toBe(true);
      expect(s.publishedFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.reasoning.length).toBeGreaterThan(15);
      expect(s.min).toBeLessThan(s.max);
    }
  });

  it("goes back seventy years and more: at least fifteen series publish from 1959 or earlier, the oldest from 1854 and 1919", () => {
    expect(TREASURY_POOL_SERIES.filter(s => s.publishedFrom <= "1959-12-31").length).toBeGreaterThanOrEqual(15);
    expect(TREASURY_POOL_SERIES.some(s => s.publishedFrom.startsWith("1854"))).toBe(true);
    expect(TREASURY_POOL_SERIES.filter(s => s.publishedFrom.startsWith("1919")).length).toBe(2);
    expect(TREASURY_POOL_SERIES.some(s => s.publishedFrom.startsWith("1934"))).toBe(true);
    expect(TREASURY_POOL_SERIES.some(s => s.publishedFrom.startsWith("1949"))).toBe(true);
  });

  it("covers the owner's asks: the prime rate, consumer and business lending rates, foreign holders by country, the Fed's share, the auction tape", () => {
    const ids = TREASURY_POOL_SERIES.map(s => s.id);
    for (const id of ["tp-prime", "tp-auto-loan-48m", "tp-card-rate", "tp-ci-loans", "tp-ci-standards-small", "tp-tic-japan", "tp-tic-china", "tp-fed-treasuries", "tp-foreign-total", "tp-tbill-3m"]) expect(ids).toContain(id);
    expect(treasuryStorageManifest().some(r => r.series === "fiscaldata:auctions")).toBe(true);
  });

  it("the history manifest carries the pool and the countries, deduplicated", () => {
    const m = historyManifest();
    const keys = m.map(r => r.series);
    expect(new Set(keys).size).toBe(keys.length);
    for (const s of TREASURY_POOL_SERIES) expect(keys).toContain(s.series);
    for (const r of globalStorageManifest()) expect(keys).toContain(r.series);
    // A pool series a factor already stores resolves to the factor's stored id, never to a second copy.
    expect(m.find(r => r.series === "fred:FDHBFIN")!.indicatorId).toBe("f-foreign-share-debt:base");
    expect(m.find(r => r.series === "fiscaldata:debt_to_penny")!.indicatorId).toBe("us-debt-to-penny");
    expect(m.filter(r => r.series === "fred:GFDEBTN")).toHaveLength(1);
    expect(m.length).toBeGreaterThan(200);
    for (const r of m) expect(SOURCE_BY_ID.has(r.sourceId), r.sourceId).toBe(true);
  });

  it("new series kinds resolve to keyless, allow-listed endpoints", () => {
    for (const k of ["bis:cbpol:JP", "imf:ifs:RAFA_USD:CN", "imf:ifs:FITB_PA:IN", "imf:weo:GGXWDG_NGDP:BRA", "worldbank:BN.CAB.XOKA.GD.ZS:DEU", "fiscaldata:debt_to_penny", "fiscaldata:auctions", "tic:history:Grand Total"]) {
      const spec = seriesSpec(k);
      expect(spec, k).not.toBeNull();
      expect(checkUrl(spec!.url).ok, spec!.url).toBe(true);
      expect(spec!.url).not.toMatch(/api_key|\{KEY\}/);
    }
    expect(seriesSpec("bis:nope")).toBeNull();
  });

  it("parses the IMF DataMapper and the auction tape", () => {
    const dm = parseImfDatamapperSeries(JSON.stringify({ values: { GGXWDG_NGDP: { JPN: { "1980": 48.8, "2025": 234.9, "2030": 240.1, bad: 1 } } } }), "GGXWDG_NGDP", "JPN");
    expect(dm).toEqual([{ asOf: "1980-12-31", value: 48.8 }, { asOf: "2025-12-31", value: 234.9 }, { asOf: "2030-12-31", value: 240.1 }]);
    const a = parseAuctionBidToCover(JSON.stringify({ data: [{ auction_date: "2026-09-10", bid_to_cover_ratio: "2.35" }, { auction_date: "2026-08-12", bid_to_cover_ratio: "2.60" }, { auction_date: "2026-08-05", bid_to_cover_ratio: "2.40" }, { auction_date: "bad", bid_to_cover_ratio: "x" }] }));
    expect(a).toEqual([{ asOf: "2026-08-12", value: 2.5 }, { asOf: "2026-09-10", value: 2.35 }]);
  });
});

describe("hypotheses, episodes, playbook", () => {
  it("forty hypotheses in three kinds, every variable a pool or stored series, every detector named", () => {
    expect(TREASURY_HYPOTHESES).toHaveLength(40);
    const ids = new Set([...TREASURY_POOL_SERIES.map(s => s.id), "jp-reserves-foreign-securities", "f-oil-wti-yoy", "f-dollar-broad-yoy", "h-existing-home-sales-yoy", "h-consumer-credit-yoy", "f-cpi-yoy"]);
    for (const h of TREASURY_HYPOTHESES) {
      for (const v of h.variables) expect(ids.has(v), `${h.id} ${v}`).toBe(true);
      expect(h.reasoning.length).toBeGreaterThan(20);
      expect(["correlation", "lead-lag", "conditional", "domino", "loudest", "regime"]).toContain(h.detector);
      expect(h.status).toBe("pending");
    }
    expect(TREASURY_HYPOTHESES.filter(h => h.kind === "hidden").length).toBeGreaterThanOrEqual(20);
  });

  it("fifteen documented episodes from the 1951 Accord to 2026, each sourced and tied to hypotheses", () => {
    expect(TREASURY_EPISODES).toHaveLength(15);
    expect(TREASURY_EPISODES[0].from).toBe("1951-03-04");
    for (const e of TREASURY_EPISODES) {
      expect(e.from <= e.to).toBe(true);
      for (const s of e.sourceIds) expect(SOURCE_BY_ID.has(s), `${e.id} ${s}`).toBe(true);
      for (const h of e.hypotheses) expect(TREASURY_HYPOTHESES.some(x => x.id === h), `${e.id} ${h}`).toBe(true);
      expect(e.transmission.length).toBeGreaterThan(40);
    }
  });

  it("the playbook covers every regime for every tier", () => {
    for (const regime of ["abundant", "normal", "tightening", "draining", "dried-up"]) for (const tier of ["mass-affluent", "average", "high-net-worth", "business-owner"]) {
      expect(LIQUIDITY_PLAYBOOK.some(r => r.regime === regime && r.tier === tier), `${regime}/${tier}`).toBe(true);
    }
  });
});

describe("the dry-up indicator", () => {
  it("scores a March-2020-like reading as dried-up, a 2021-like reading as abundant, and nothing as normal with zero coverage", () => {
    const dash = liquidityDryUp({ foreignHoldings3mPct: -3.5, fedTreasuries3mPct: 5, reverseRepoUsdBn: 0, termPremium3mPp: 0.7, tenYear3mBp: 90, dollar3mPct: 6, bidToCoverDeviation: -0.35, deficit3mPct: 15 }, TODAY);
    expect(dash.regime).toBe("dried-up");
    expect(dash.score).toBeGreaterThanOrEqual(A("dryup.regime.driedUp"));
    expect(dash.coverage).toBe(1);
    expect(dash.playbook.every(p => p.regime === "dried-up")).toBe(true);
    const easy = liquidityDryUp({ foreignHoldings3mPct: 2, fedTreasuries3mPct: 8, reverseRepoUsdBn: 1800, termPremium3mPp: -0.3, tenYear3mBp: -20, dollar3mPct: -2, bidToCoverDeviation: 0.2, deficit3mPct: -5 }, TODAY);
    expect(easy.regime).toBe("abundant");
    const none = liquidityDryUp({ foreignHoldings3mPct: null, fedTreasuries3mPct: null, reverseRepoUsdBn: null, termPremium3mPp: null, tenYear3mBp: null, dollar3mPct: null, bidToCoverDeviation: null, deficit3mPct: null }, TODAY);
    expect(none.regime).toBe("normal");
    expect(none.coverage).toBe(0);
    expect(none.method.some(m => /provisional/.test(m))).toBe(true);
    const partial = liquidityDryUp({ foreignHoldings3mPct: -4, fedTreasuries3mPct: null, reverseRepoUsdBn: null, termPremium3mPp: 0.6, tenYear3mBp: null, dollar3mPct: null, bidToCoverDeviation: null, deficit3mPct: null }, TODAY);
    expect(partial.coverage).toBeCloseTo(0.35, 2);
    expect(partial.score).toBeGreaterThan(70);
  });

  it("every threshold and weight is a rules-table row with a source and a basis", () => {
    for (const id of ["dryup.foreignDrop3mPct", "dryup.rrpFullUsdBn", "dryup.w.foreign", "dryup.regime.driedUp", "flow.w.reserves", "flow.span.fxWeakening12mPct", "flow.threshold.filling"]) expect(MACRO_ASSUMPTIONS.has(id), id).toBe(true);
    const w = ["foreign", "fed", "rrp", "termPremium", "tenYear", "dollar", "auction", "deficit"].reduce((s, k) => s + A(`dryup.w.${k}`), 0);
    expect(w).toBeCloseTo(1, 6);
  });
});

describe("the prediction grid", () => {
  it("is pending with no findings and directional with a measured lead", () => {
    const empty = predictionGrid([], new Map());
    expect(empty).toHaveLength(18);
    expect(empty.every(c => c.direction === "pending" && c.grade === "—")).toBe(true);
    const lead: PairFinding = { kind: "lead-lag", a: "tp-foreign-total", b: "tp-10y", aName: "foreign", bName: "10y", r: -0.6, lag: 6, leadGain: 0.3, n: 200, confidence: 80, grade: "B", low: -0.7, high: -0.5, stable: true, awareness: "structural", reading: "" };
    const z = new Map([["tp-foreign-total", -1.5]]);
    const grid = predictionGrid([lead], z);
    const cell = grid.find(c => c.target === "tp-10y" && c.horizonMonths === 6)!;
    expect(cell.direction).toBe("up"); // foreign holdings far below mean × negative lead → 10-year up
    expect(cell.grade).toBe("B");
    expect(cell.drivers[0].leader).toBe("tp-foreign-total");
    expect(grid.find(c => c.target === "tp-10y" && c.horizonMonths === 3)!.direction).toBe("pending"); // lag 6 exceeds the 3-month horizon
  });
});

describe("archaeology scans", () => {
  const n = 240;
  const mk = (start: string, f: (i: number) => number): MonthlyPoint[] => {
    const [y, m] = start.split("-").map(Number);
    return Array.from({ length: n }, (_, i) => ({ asOf: new Date(Date.UTC(y, m - 1 + i + 1, 0)).toISOString().slice(0, 10), value: f(i) }));
  };
  it("domino chains link lead-lag findings whose lags add, refusing cycles and ranking by strength", () => {
    const f = (a: string, b: string, r: number, lag: number): PairFinding => ({ kind: "lead-lag", a, b, aName: a, bName: b, r, lag, n: 100, confidence: 70, grade: "B", low: 0, high: 1, stable: true, awareness: "structural", reading: "" });
    const chains = dominoChains([f("funds", "dollar", 0.6, 2), f("dollar", "foreign", -0.5, 3), f("foreign", "premium", -0.5, 3), f("premium", "mortgage", 0.7, 2), f("mortgage", "funds", 0.4, 1)], { minAbsR: 0.3 });
    const five = chains.find(c => c.path.length === 5)!;
    expect(five.path).toEqual(["funds", "dollar", "foreign", "premium", "mortgage"]);
    expect(five.totalLagMonths).toBe(10);
    expect(five.strength).toBeCloseTo(0.6 * -0.5 * -0.5 * 0.7, 3);
    expect(chains.every(c => new Set(c.path).size === c.path.length)).toBe(true);
    expect(five.reading).toMatch(/→ \(2 m\) dollar/);
  });

  it("turning points and the loudest movers before them", () => {
    const rate = mk("2000-01", i => 2 + 3 * Math.sin(i / 12)); // peaks and troughs every ~38 months
    const tps = turningPoints(rate, { window: 6, minSwing: 1 });
    expect(tps.length).toBeGreaterThanOrEqual(4);
    expect(tps.every((t, i) => i === 0 || t.kind !== tps[i - 1].kind)).toBe(true);
    const loud = mk("2000-01", i => 3 * Math.cos(i / 12)); // a quarter-cycle ahead of the rate: falling fastest at the rate's peak
    const quiet = mk("2000-01", i => 100 + 0.01 * i); // a steady drift: every six-month change identical, so its z-score is zero
    const series: Series[] = [{ indicatorId: "tp-fed-funds", points: rate }, { indicatorId: "tp-ci-standards-small", points: loud }, { indicatorId: "tp-gold", points: quiet }];
    const reports = loudestBeforeTurns(series, "tp-fed-funds", { lookback: 6, top: 3 });
    expect(reports.length).toBe(tps.length);
    expect(reports[0].movers[0].indicatorId).toBe("tp-ci-standards-small");
    expect(Math.abs(reports[0].movers[0].z)).toBeGreaterThan(Math.abs(reports[0].movers.find(m => m.indicatorId === "tp-gold")!.z));
  });

  it("regime split finds an asymmetry a pooled correlation hides", () => {
    const ref = mk("2000-01", i => 2 + 3 * Math.sin(i / 12));
    const leader = ref;
    // Follower rises with the leader when the leader is rising, and ignores it when falling (card-rate asymmetry, H30).
    const follower = mk("2000-01", i => (i === 0 ? 0 : 0) + Array.from({ length: i }, (_, k) => Math.max(0, ref[k + 1] ? ref[k + 1].value - ref[k].value : 0)).reduce((s, x) => s + x, 0));
    const split = regimeSplit(leader, follower, ref, 1);
    expect(split.rising.n).toBeGreaterThan(20);
    expect(split.falling.n).toBeGreaterThan(20);
    expect(Math.abs(split.asymmetry)).toBeGreaterThan(0.2);
    const z = latestZScores([{ indicatorId: "x", points: mk("2000-01", i => i) }]);
    expect(z.get("x")).toBeGreaterThan(1.5);
  });
});

describe("global treasuries", () => {
  it("twenty-five countries with the owner's twelve named, series keys resolving, and ten indicators with reasoning", () => {
    expect(COUNTRIES).toHaveLength(25);
    for (const iso of ["DEU", "IND", "BRA", "RUS", "CHN", "JPN", "GBR", "CAN", "MEX", "AUS", "TWN", "VNM"]) expect(COUNTRIES.some(c => c.iso3 === iso), iso).toBe(true);
    expect(FLOW_INDICATORS).toHaveLength(10);
    for (const f of FLOW_INDICATORS) {
      expect(MACRO_ASSUMPTIONS.has(f.weightId), f.weightId).toBe(true);
      expect(f.calculus.length).toBeGreaterThan(40);
      expect(f.history.length).toBeGreaterThan(20);
    }
    const w = FLOW_INDICATORS.reduce((s, f) => s + A(f.weightId), 0);
    expect(w).toBeCloseTo(1, 6);
    for (const r of globalStorageManifest()) {
      const spec = seriesSpec(r.series);
      expect(spec, r.series).not.toBeNull();
      expect(checkUrl(spec!.url).ok).toBe(true);
    }
    for (const e of COUNTRY_FLOW_EPISODES) {
      expect(COUNTRIES.some(c => c.iso3 === e.iso3)).toBe(true);
      for (const s of e.sourceIds) expect(SOURCE_BY_ID.has(s), `${e.iso3} ${s}`).toBe(true);
      for (const i of e.indicators) expect(FLOW_INDICATORS.some(f => f.id === i), i).toBe(true);
    }
  });

  it("the calculus: a surplus accumulator fills, a currency-defending seller drains, and missing readings lower coverage not the score", () => {
    const fill = globalFlowCalculus("JPN", { rateDifferentialPp: 4, reserves12mPct: 8, currentAccountPctGdp: 3.5, fxWeakening12mPct: -2, tic12mPct: 6, debtPctGdp: 230, bondDifferentialPp: 3, dollar12mPct: 3, usStressZ: 0, sanctionsExposure: 0.02 }, TODAY);
    expect(fill.direction).toBe("filling");
    expect(fill.drivers[0].calculus.length).toBeGreaterThan(20);
    const drain = globalFlowCalculus("CHN", { rateDifferentialPp: 2, reserves12mPct: -12, currentAccountPctGdp: 2, fxWeakening12mPct: 12, tic12mPct: -15, debtPctGdp: 90, bondDifferentialPp: 2, dollar12mPct: 8, usStressZ: 0, sanctionsExposure: 0.6 }, TODAY);
    expect(drain.direction).toBe("draining");
    const partial = globalFlowCalculus("IND", { rateDifferentialPp: null, reserves12mPct: 15, currentAccountPctGdp: null, fxWeakening12mPct: null, tic12mPct: 20, debtPctGdp: null, bondDifferentialPp: null, dollar12mPct: null, usStressZ: null, sanctionsExposure: null }, TODAY);
    expect(partial.coverage).toBeCloseTo(0.3, 2);
    expect(partial.direction).toBe("filling");
    expect(() => globalFlowCalculus("XXX", partial.drivers as never, TODAY)).toThrow(/Unknown country/);
  });
});

describe("the router's new procedures without a database (production port, A22)", () => {
  it("treasuryPool, globalTreasuries, projection and projectionReport answer from definitions, pending, never invented", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const { macroRouter } = await import("./macroRouter");
      const caller = macroRouter.createCaller({ user: null, req: {}, res: {} } as never);
      const pool = await caller.treasuryPool();
      expect(pool.series).toHaveLength(TREASURY_POOL_SERIES.length);
      expect(pool.series.every(s => s.latest === null && s.points === 0)).toBe(true);
      expect(pool.dryUp.coverage).toBe(0);
      expect(pool.note).toMatch(/pending the first stored history/);
      const g = await caller.globalTreasuries();
      expect(g.countries).toHaveLength(COUNTRIES.length);
      expect(g.countries.every(c => c.readings === null && c.result === null)).toBe(true);
      const neutral = await caller.projection({ years: 10 });
      expect(neutral.years).toBe(10);
      expect(neutral.path.every(p => !p.applied)).toBe(true);
      expect(neutral.year1.measured).toBe(A("proj.measured.noHistory"));
      const scenario = await caller.projection({ toggles: { treasuryLiquidation: { holder: "CN", fraction: 0.5, months: 12 } }, years: 60 });
      expect(scenario.path).toHaveLength(60);
      expect(scenario.path[0].applied).toBe(true);
      const report = await caller.projectionReport({ years: 5, calculator: "Test" });
      expect(report.markdown).toMatch(/Test/);
      expect(report.horizon.years).toBe(5);
    } finally {
      if (saved !== undefined) process.env.DATABASE_URL = saved;
    }
  });
});
