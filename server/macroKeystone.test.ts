/**
 * The keystone engine (study Q5, agents A14 + A15): rarity, PELT break dating,
 * cascade multiplier, Hawkes-style self-excitation, bear odds, critical
 * slowing down, and the per-era verdict.
 *
 * ALL DATA IN THIS FILE IS SYNTHETIC. Every series below is generated from a
 * seeded PRNG (`mulberry32`) to plant a known effect (a mean shift, a cascade,
 * a rising AR(1) coefficient) or to plant none. Nothing here is a market
 * reading and no number here may be cited as evidence about any indicator.
 */
import { describe, expect, it } from "vitest";
import {
  A,
  MACRO_ASSUMPTIONS,
  mulberry32,
  normal,
  rarity,
  pelt,
  eventsFromStates,
  toKeystoneEvents,
  cascadeMultiplier,
  cascadeProfile,
  cascadeWindows,
  selfExcitation,
  bearOdds,
  criticalSlowingDown,
  keystoneVerdict,
  keystoneAssumptions,
  kendallTau,
  lag1Autocorrelation,
  monthIndexOf,
  isoOfMonthIndex,
  type KeystoneEvent,
  type Era,
} from "@shared/macro";

// ─── Synthetic fixtures ─────────────────────────────────────────────────────

/** SYNTHETIC: a Gaussian series with planted mean shifts. */
function shiftedSeries(seed: number, n: number, shifts: Array<[number, number]>, sd = 1): number[] {
  const rng = mulberry32(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let level = 0;
    for (const [at, to] of shifts) if (i >= at) level = to;
    out.push(level + sd * normal(rng));
  }
  return out;
}

/**
 * SYNTHETIC: an event stream of `k` other indicators over [0, T). Each flips
 * at random with probability `p` a month. If `plantedMoves` is given, a share
 * `burst` of the indicators also flips 1–6 months after each move — the
 * planted cascade.
 */
function eventStream(seed: number, k: number, T: number, p: number, plantedMoves: number[] = [], burst = 0): KeystoneEvent[] {
  const rng = mulberry32(seed);
  const out: KeystoneEvent[] = [];
  for (let j = 0; j < k; j++) {
    const id = `X${String(j).padStart(2, "0")}`;
    for (let t = 0; t < T; t++) if (rng() < p) out.push({ month: t, indicatorId: id });
    for (const m of plantedMoves) {
      if (rng() < burst) out.push({ month: Math.min(T - 1, m + 1 + Math.floor(rng() * 6)), indicatorId: id });
    }
  }
  return out.sort((a, b) => a.month - b.month);
}

/** SYNTHETIC: AR(1) with a coefficient that moves linearly from phi0 to phi1. */
function ar1(seed: number, n: number, phi0: number, phi1: number): number[] {
  const rng = mulberry32(seed);
  const out: number[] = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const phi = phi0 + ((phi1 - phi0) * i) / Math.max(1, n - 1);
    x = phi * x + normal(rng);
    out.push(x);
  }
  return out;
}

const ERA: Era = { id: "SYN", start: 0, end: 360 };
const MOVES = [40, 85, 130, 175, 220, 265, 310];

// ─── Rules table ────────────────────────────────────────────────────────────

describe("keystone rules table", () => {
  it("every threshold is a sourced, dated row", () => {
    const rows = keystoneAssumptions();
    expect(rows.length).toBeGreaterThanOrEqual(24);
    for (const r of rows) {
      expect(MACRO_ASSUMPTIONS.has(r.id), r.id).toBe(true);
      expect(r.source.length, r.id).toBeGreaterThan(3);
      expect(r.asOf, r.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(A("keystone.rarity.minMedianDwellMonths")).toBe(36);
    expect(A("keystone.cascade.minMultiplier")).toBe(2);
    expect(cascadeWindows()).toEqual([3, 6, 12, 24]);
    expect([A("keystone.csd.lookbackMinMonths"), A("keystone.csd.lookbackMaxMonths")]).toEqual([24, 60]);
    const cites = rows.map(r => r.source).join(" | ");
    for (const s of ["Scheffer", "Dakos et al. (2008)", "Killick, Fearnhead & Eckley (2012)", "Hawkes (1971)"]) expect(cites).toContain(s);
  });

  it("month axis round-trips", () => {
    expect(monthIndexOf("1990-01-31")).toBe(1990 * 12);
    expect(isoOfMonthIndex(monthIndexOf("2008-09-15"))).toBe("2008-09-01");
  });
});

// ─── Test 1: rarity ─────────────────────────────────────────────────────────

describe("rarity", () => {
  it("measures dwell and flips; a slow series passes, a fast one fails, an empty one is unknown", () => {
    const slow = [...Array(40).fill("hi"), ...Array(50).fill("lo"), ...Array(44).fill("hi")];
    const r = rarity(slow);
    expect(r.flipCount).toBe(2);
    expect(r.flipMonths).toEqual([40, 90]);
    expect(r.medianDwellMonths).toBe(44);
    expect(r.medianCompletedDwellMonths).toBe(50);
    expect(r.runs[0].censored).toBe(true);
    expect(r.outcome).toBe("pass");

    const fast = Array.from({ length: 120 }, (_, i) => (Math.floor(i / 4) % 2 ? "up" : "down"));
    expect(rarity(fast).outcome).toBe("fail");
    expect(rarity([null, null]).outcome).toBe("unknown");
  });

  it("skips gaps rather than counting them as moves, and honours the axis offset", () => {
    const r = rarity(["a", "a", null, null, "a", "b"], 100);
    expect(r.flipMonths).toEqual([105]);
    expect(r.observedMonths).toBe(4);
  });

  it("converts A10-shaped events (month 'YYYY-MM', indicator) onto the month axis", () => {
    const ev = toKeystoneEvents([{ month: "1990-02", indicator: "M2", kind: "direction" }, { month: "1990-01", indicator: "CAPE", kind: "level" }]);
    expect(ev).toEqual([{ month: 1990 * 12, indicatorId: "CAPE" }, { month: 1990 * 12 + 1, indicatorId: "M2" }]);
    expect(toKeystoneEvents([{ month: "1990-02", indicator: "M2", kind: "direction" }, { month: "1990-01", indicator: "CAPE", kind: "level" }], "level")).toHaveLength(1);
  });

  it("eventsFromStates stamps each indicator's flips", () => {
    const ev = eventsFromStates({ P: ["up", "up", "down"], Q: ["flat", "up", "up"] });
    expect(ev).toEqual([{ month: 1, indicatorId: "Q" }, { month: 2, indicatorId: "P" }]);
  });
});

// ─── PELT ───────────────────────────────────────────────────────────────────

describe("PELT (Gaussian mean shift)", () => {
  it("finds a planted mean shift (SYNTHETIC)", () => {
    const x = shiftedSeries(11, 120, [[60, 3]]);
    const r = pelt(x);
    expect(r.changePoints.length).toBe(1);
    expect(Math.abs(r.changePoints[0] - 60)).toBeLessThanOrEqual(2);
    expect(r.segments[0].mean).toBeLessThan(0.6);
    expect(r.segments[1].mean).toBeGreaterThan(2.4);
    expect(r.penalty).toBeCloseTo(2 * Math.log(120), 3);
  });

  it("finds two planted shifts and none in pure noise (SYNTHETIC)", () => {
    const two = pelt(shiftedSeries(12, 240, [[80, 2.5], [170, -1]]));
    expect(two.changePoints.length).toBe(2);
    expect(Math.abs(two.changePoints[0] - 80)).toBeLessThanOrEqual(3);
    expect(Math.abs(two.changePoints[1] - 170)).toBeLessThanOrEqual(3);
    expect(pelt(shiftedSeries(13, 240, [])).changePoints).toEqual([]);
  });

  it("a huge penalty returns one segment; gaps are refused", () => {
    expect(pelt(shiftedSeries(11, 120, [[60, 3]]), 1e9).changePoints).toEqual([]);
    expect(() => pelt([1, NaN, 2])).toThrow(/finite/);
  });
});

// ─── Test 2: cascade multiplier and Hawkes ──────────────────────────────────

describe("cascade multiplier", () => {
  const planted = eventStream(21, 40, 360, 0.02, MOVES, 0.6);
  const nullStream = eventStream(22, 40, 360, 0.02);

  it("a planted cascade gives a multiplier above 2 and a small permutation p (SYNTHETIC)", () => {
    const r = cascadeMultiplier(MOVES, planted, 12, ERA, 1);
    expect(r.moves).toEqual(MOVES);
    expect(r.universeSize).toBe(40);
    expect(r.multiplier!).toBeGreaterThan(2);
    expect(r.pValue!).toBeLessThan(0.01);
    expect(r.outcome).toBe("pass");
  });

  it("a stream with no planted effect gives a multiplier near 1 (SYNTHETIC)", () => {
    const r = cascadeMultiplier(MOVES, nullStream, 12, ERA, 1);
    expect(r.multiplier!).toBeGreaterThan(0.75);
    expect(r.multiplier!).toBeLessThan(1.25);
    expect(r.pValue!).toBeGreaterThan(0.05);
    expect(r.outcome).toBe("fail");
  });

  it("reports the ceiling 1 / baseline, and reads unknown when the other indicators flip so often that 2x is unreachable (SYNTHETIC)", () => {
    const r = cascadeMultiplier(MOVES, planted, 12, ERA, 1);
    expect(r.ceiling!).toBeCloseTo(1 / r.baselineShare!, 1);
    const dense = cascadeMultiplier(MOVES, eventStream(23, 40, 360, 0.3, MOVES, 0.9), 12, ERA, 1);
    expect(dense.ceiling!).toBeLessThan(2);
    expect(dense.outcome).toBe("unknown");
  });

  it("profiles all four windows; the planted 1–6 month burst is strongest at short windows", () => {
    const prof = cascadeProfile(MOVES, planted, ERA, 1);
    expect(prof.map(p => p.windowMonths)).toEqual([3, 6, 12, 24]);
    expect(prof[1].multiplier!).toBeGreaterThan(prof[3].multiplier!);
  });

  it("is deterministic under a fixed seed; the multiplier does not depend on the seed at all", () => {
    const a = cascadeMultiplier(MOVES, planted, 6, ERA, 42);
    const b = cascadeMultiplier(MOVES, planted, 6, ERA, 42);
    const c = cascadeMultiplier(MOVES, nullStream, 6, ERA, 43);
    const d = cascadeMultiplier(MOVES, nullStream, 6, ERA, 42);
    expect(a).toEqual(b);
    expect(c.multiplier).toBe(d.multiplier);
  });

  it("removes the keystone's own events, drops moves whose window leaves the era, and reads unknown on too few moves", () => {
    const own = [...planted, ...MOVES.map(m => ({ month: m + 1, indicatorId: "KEY" }))];
    expect(cascadeMultiplier(MOVES, own, 12, ERA, 1, { keystoneId: "KEY" }).multiplier).toBe(cascadeMultiplier(MOVES, planted, 12, ERA, 1).multiplier);
    const r = cascadeMultiplier([40, 355], planted, 12, ERA, 1);
    expect(r.droppedMoves).toEqual([355]);
    expect(r.outcome).toBe("unknown");
  });
});

describe("Hawkes-style self-excitation", () => {
  it("intensity jumps after planted moves and not in a null stream (SYNTHETIC)", () => {
    const hot = selfExcitation(eventStream(21, 40, 360, 0.02, MOVES, 0.6), MOVES, { era: ERA });
    expect(hot.jumpRatio!).toBeGreaterThan(2);
    expect(hot.likelihoodRatio!).toBeGreaterThan(A("keystone.hawkes.lrCritical"));
    expect(hot.empiricalRatio!).toBeGreaterThan(1.5);
    expect(hot.outcome).toBe("pass");

    const cold = selfExcitation(eventStream(22, 40, 360, 0.02), MOVES, { era: ERA });
    expect(cold.jumpRatio!).toBeLessThan(2);
    expect(cold.outcome).toBe("fail");
  });

  it("returns unknown with no events or no moves", () => {
    expect(selfExcitation([], MOVES, { era: ERA }).outcome).toBe("unknown");
    expect(selfExcitation(eventStream(21, 5, 360, 0.02), [], { era: ERA }).outcome).toBe("unknown");
  });
});

// ─── Test 3: bear odds ──────────────────────────────────────────────────────

describe("bear odds", () => {
  it("bears planted after moves give a lift; bears unrelated to moves do not (SYNTHETIC)", () => {
    const planted = bearOdds(MOVES.slice(0, 6), MOVES.slice(0, 6).map(m => m + 8), ERA);
    expect(planted.conditional).toBe(1);
    expect(planted.lift!).toBeGreaterThan(A("combo.minLift"));
    expect(planted.distinctBears).toBe(6);
    expect(planted.outcome).toBe("pass");

    const unrelated = bearOdds(MOVES.slice(0, 6), [70, 160, 250], ERA);
    expect(unrelated.outcome).toBe("fail");
    expect(bearOdds([40], [48], ERA).outcome).toBe("unknown");
  });
});

// ─── Test 4: critical slowing down ──────────────────────────────────────────

describe("critical slowing down", () => {
  it("helpers: Kendall τ and lag-1 autocorrelation", () => {
    expect(kendallTau([1, 2, 3, 4], [10, 20, 30, 40])).toBe(1);
    expect(kendallTau([1, 2, 3, 4], [4, 3, 2, 1])).toBe(-1);
    expect(lag1Autocorrelation(ar1(5, 2000, 0.8, 0.8))).toBeGreaterThan(0.7);
  });

  it("an AR(1) whose coefficient rises shows positive τ; a stationary one does not (SYNTHETIC, 20 seeds each)", () => {
    const rising = Array.from({ length: 20 }, (_, s) => criticalSlowingDown(ar1(100 + s, 60, 0.0, 0.95), 60, 60, { seed: s }));
    const flat = Array.from({ length: 20 }, (_, s) => criticalSlowingDown(ar1(200 + s, 60, 0.3, 0.3), 60, 60, { seed: s }));
    const meanTau = (rs: typeof rising) => rs.reduce((a, r) => a + r.tauAutocorrelation!, 0) / rs.length;
    expect(meanTau(rising)).toBeGreaterThan(0.3);
    expect(Math.abs(meanTau(flat))).toBeLessThan(0.2);
    const passes = (rs: typeof rising) => rs.filter(r => r.outcome === "pass").length;
    expect(passes(rising)).toBeGreaterThanOrEqual(8);
    expect(passes(flat)).toBeLessThanOrEqual(2);
  });

  it("one series, fixed seed: deterministic numbers (and one 60-month draw can point the wrong way, which is why the verdict counts moves)", () => {
    const x = ar1(101, 60, 0.0, 0.95);
    const a = criticalSlowingDown(x, 60, 60, { seed: 9 });
    expect(a).toEqual(criticalSlowingDown(x, 60, 60, { seed: 9 }));
    expect(a.lookbackMonths).toBe(60);
    expect(a.rollingWindow).toBe(30);
    expect(Number.isFinite(a.tauAutocorrelation!)).toBe(true);
    expect(a.pValueAutocorrelation!).toBeGreaterThan(0);
  });

  it("clamps the look-back to 24–60 and reads unknown below 24 months", () => {
    const x = ar1(7, 100, 0.2, 0.2);
    expect(criticalSlowingDown(x, 100, 500).lookbackMonths).toBe(60);
    expect(criticalSlowingDown(x, 100, 5).lookbackMonths).toBe(24);
    expect(criticalSlowingDown(x, 20).outcome).toBe("unknown");
    const gap = x.map((v, i) => (i === 90 ? null : v));
    expect(criticalSlowingDown(gap, 100).outcome).toBe("unknown");
  });
});

// ─── The verdict ────────────────────────────────────────────────────────────

/**
 * SYNTHETIC keystone: a level that sits in one regime for 90 months, with an
 * AR(1) coefficient that climbs towards 0.95 over the 60 months before each
 * regime change (the planted warning), and a planted cascade and bear start
 * after every move. Two eras of 360 months each.
 */
function syntheticKeystone(seed: number) {
  const T = 720;
  const moves = [90, 180, 270, 450, 540, 630];
  const rng = mulberry32(seed);
  const values: number[] = [];
  const states: string[] = [];
  let x = 0;
  let regime = 0;
  for (let t = 0; t < T; t++) {
    if (moves.includes(t)) {
      regime = 1 - regime;
      x = 0;
    }
    const next = moves.find(m => m > t) ?? T + 90;
    const toMove = next - t;
    const phi = toMove <= 60 ? 0.95 * (1 - toMove / 60) : 0;
    x = phi * x + normal(rng);
    values.push(regime * 20 + x);
    states.push(regime ? "high" : "low");
  }
  return { T, moves, values, states };
}

describe("keystoneVerdict", () => {
  const eras: Era[] = [{ id: "E-A", start: 0, end: 360 }, { id: "E-B", start: 360, end: 720 }];

  it("a keystone planted to pass all four tests in both eras is the headline (SYNTHETIC)", () => {
    const k = syntheticKeystone(31);
    const v = keystoneVerdict({
      id: "KEY",
      states: k.states,
      values: k.values,
      eventStream: eventStream(32, 40, k.T, 0.02, k.moves, 0.6),
      eras,
      bearStarts: k.moves.map(m => m + 8),
      seed: 5,
    });
    expect(v.erasWithData).toEqual(["E-A", "E-B"]);
    for (const e of v.eras) {
      expect(e.moves.length).toBe(3);
      expect(e.rarity.outcome, e.era.id).toBe("pass");
      expect(e.cascade.outcome, e.era.id).toBe("pass");
      expect(e.cascade.hawkes.outcome, e.era.id).toBe("pass");
      expect(e.bear.outcome, e.era.id).toBe("pass");
      expect(e.warning.outcome, `${e.era.id} ${JSON.stringify(e.warning.perMove)}`).toBe("pass");
    }
    expect(v.headline).toBe(true);
    expect(v.reasons).toEqual([]);
  });

  it("unknown is never a pass: without bear dates or levels there is no headline, and the reason is named", () => {
    const k = syntheticKeystone(31);
    const v = keystoneVerdict({ id: "KEY", states: k.states, eventStream: eventStream(32, 40, k.T, 0.02, k.moves, 0.6), eras, seed: 5 });
    expect(v.headline).toBe(false);
    expect(v.reasons).toContain("E-A: bear odds unknown");
    expect(v.reasons).toContain("E-A: warning unknown");
  });

  it("no planted cascade → cascade fails and no headline (SYNTHETIC)", () => {
    const k = syntheticKeystone(31);
    const v = keystoneVerdict({ id: "KEY", states: k.states, values: k.values, eventStream: eventStream(33, 40, k.T, 0.02), eras, bearStarts: k.moves.map(m => m + 8), seed: 5 });
    expect(v.eras.every(e => e.cascade.outcome === "fail")).toBe(true);
    expect(v.headline).toBe(false);
  });

  it("one era with data is not enough for the headline", () => {
    const k = syntheticKeystone(31);
    const v = keystoneVerdict({
      id: "KEY", states: k.states, values: k.values, eventStream: eventStream(32, 40, k.T, 0.02, k.moves, 0.6),
      eras: [eras[0]], bearStarts: k.moves.map(m => m + 8), seed: 5,
    });
    expect(v.headline).toBe(false);
    expect(v.reasons.some(r => /era\(s\) with data/.test(r))).toBe(true);
  });

  it("is deterministic under a fixed seed", () => {
    const k = syntheticKeystone(31);
    const input = { id: "KEY", states: k.states, values: k.values, eventStream: eventStream(32, 40, k.T, 0.02, k.moves, 0.6), eras, bearStarts: k.moves.map(m => m + 8), seed: 5 };
    expect(JSON.stringify(keystoneVerdict(input))).toBe(JSON.stringify(keystoneVerdict(input)));
  });
});
