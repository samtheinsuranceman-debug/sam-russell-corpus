// The cycle engine's whole job is to find the year a sequence stops working.
// An engine that can never print a break year is decoration, and an engine
// that compounds without bound is a sales tool. Both of those were real bugs
// in this file's history, so both are now tests.
import { describe, it, expect } from "vitest";
import {
  MECHANISMS, MECHANISM_ORDER, mechanism, simulateCycle, DEFAULT_CYCLE,
  CYCLE_DISCLOSURE, type CycleInput, type MechanismId,
} from "@shared/cycleEngine";

const run = (over: Partial<CycleInput> = {}) => simulateCycle({ ...DEFAULT_CYCLE, ...over });

describe("the mechanisms", () => {
  it("covers all five, each explained and each with a bottleneck", () => {
    expect(MECHANISMS.length).toBe(5);
    expect(MECHANISM_ORDER.length).toBe(5);
    for (const m of MECHANISMS) {
      expect(MECHANISM_ORDER).toContain(m.id);
      expect(m.what.length, m.id).toBeGreaterThanOrEqual(3);
      expect(m.what.join(" ").split(/\s+/).length, `${m.id} is too thin`).toBeGreaterThan(120);
      expect(m.bottleneck.length, `${m.id} claims no bottleneck`).toBeGreaterThan(60);
      expect(m.relieves.length, `${m.id} does not say what it relieves`).toBeGreaterThan(60);
      expect(m.costOfCapital.note.length, m.id).toBeGreaterThan(40);
      expect(m.releaseRate).toBeGreaterThan(0);
      expect(m.releaseRate).toBeLessThanOrEqual(1);
      expect(m.turnMonths.fast).toBeLessThanOrEqual(m.turnMonths.typical);
      expect(m.turnMonths.typical).toBeLessThanOrEqual(m.turnMonths.slow);
    }
  });

  it("marks exactly the mechanisms that genuinely amortise", () => {
    // The single most consequential field in the file. BRRRR, velocity and a
    // seller note pay themselves down; an equity share and a policy loan do not.
    const amortising = MECHANISMS.filter((m) => m.amortises).map((m) => m.id).sort();
    expect(amortising).toEqual(["brrrr-dscr", "seller-wrap", "velocity-heloc"]);
  });

  it("knows which mechanisms cannot be repeated on the same asset", () => {
    expect(mechanism("equity-share")!.repeatableOnSameAsset).toBe(false);
    expect(mechanism("brrrr-dscr")!.repeatableOnSameAsset).toBe(false);
    expect(mechanism("policy-loan")!.repeatableOnSameAsset).toBe(true);
    expect(mechanism("velocity-heloc")!.repeatableOnSameAsset).toBe(true);
  });

  it("states honestly that the equity share does not amortise and settles on a clock", () => {
    const es = mechanism("equity-share")!;
    expect(es.amortises).toBe(false);
    expect(es.settlementYears).toBe(10);
    expect(es.what.join(" ")).toMatch(/balloon ladder/i);
    expect(es.bottleneck).toMatch(/one per property/i);
  });
});

describe("the simulation stays inside reality", () => {
  it("never compounds the portfolio without bound", () => {
    // The original version of this engine printed a portfolio of three hundred
    // trillion dollars because each turn credited the whole new mortgage to
    // reserve while subtracting only the down payment. Any sequence, any pace,
    // any uplift: twenty years of a $400k start cannot plausibly release more
    // than a few tens of millions.
    for (const pace of ["fast", "typical", "slow"] as const) {
      for (const uplift of [1.05, 1.18, 1.34, 1.5]) {
        for (const seq of [
          ["brrrr-dscr"], ["equity-share"], MECHANISM_ORDER,
        ] as MechanismId[][]) {
          const r = run({ sequence: seq, pace, renovationUplift: uplift });
          expect(Number.isFinite(r.totalReleased), `${seq}/${pace}/${uplift}`).toBe(true);
          expect(r.totalReleased, `${seq}/${pace}/${uplift} released ${r.totalReleased}`)
            .toBeLessThan(60_000_000);
          expect(r.totalReleased).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("makes the renovation spread decisive on a BRRRR cycle", () => {
    // Below roughly 1.34 the cycle shrinks each turn; above it, it grows. If
    // this ever stops being monotonic the arithmetic has drifted.
    const low = run({ sequence: ["brrrr-dscr"], renovationUplift: 1.10 });
    const mid = run({ sequence: ["brrrr-dscr"], renovationUplift: 1.30 });
    const high = run({ sequence: ["brrrr-dscr"], renovationUplift: 1.45 });
    expect(mid.totalReleased).toBeGreaterThan(low.totalReleased);
    expect(high.totalReleased).toBeGreaterThan(mid.totalReleased);
  });

  it("runs the equity share exactly once against a single property", () => {
    // The finding that matters most on the page. The mechanism sold as the
    // infinite one cannot repeat on the asset it just encumbered, so on a
    // one-property household it turns once and stops.
    const r = run({ sequence: ["equity-share"] });
    expect(r.turnsCompleted).toBe(1);
  });

  it("reports a break year when capital is cycled rather than held", () => {
    // The engine is useless if it cannot print this. A non-amortising sequence
    // whose proceeds are redeployed must eventually meet its own settlements
    // with nothing in hand.
    const held = run({ sequence: ["equity-share", "policy-loan"], redeployRate: 0, annualSurplus: 24_000, reserve: 30_000 });
    const cycled = run({ sequence: ["equity-share", "policy-loan"], redeployRate: 0.85, annualSurplus: 24_000, reserve: 30_000 });
    expect(held.breakYear).toBeNull();
    expect(cycled.breakYear).not.toBeNull();
    expect(cycled.breakYear!).toBeGreaterThan(5);
    expect(cycled.verdict).toMatch(/breaks in year/i);
  });

  it("puts the break in a stressed year and nowhere else", () => {
    const r = run({ sequence: ["equity-share", "policy-loan"], redeployRate: 0.9, annualSurplus: 20_000, reserve: 25_000 });
    if (r.breakYear !== null) {
      const first = r.years.find((y) => y.stressed)!;
      expect(r.breakYear).toBe(first.year);
      for (const y of r.years.filter((y) => y.year < r.breakYear!)) expect(y.stressed).toBe(false);
    }
  });

  it("grows the settlement with appreciation, because the share is of value", () => {
    const flat = run({ sequence: ["equity-share", "brrrr-dscr"], appreciation: 0 });
    const hot = run({ sequence: ["equity-share", "brrrr-dscr"], appreciation: 0.06 });
    expect(hot.totalObligations).toBeGreaterThan(flat.totalObligations);
  });

  it("computes the amortising share of a sequence correctly", () => {
    expect(run({ sequence: ["brrrr-dscr"] }).amortisingShare).toBe(1);
    expect(run({ sequence: ["equity-share"] }).amortisingShare).toBe(0);
    expect(run({ sequence: ["equity-share", "brrrr-dscr"] }).amortisingShare).toBe(0.5);
  });

  it("returns a full year-by-year ledger with no gaps", () => {
    const r = run({ years: 20 });
    expect(r.years.length).toBe(20);
    r.years.forEach((y, i) => {
      expect(y.year).toBe(i + 1);
      expect(y.reserve).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(y.capitalReleased)).toBe(true);
      expect(Number.isFinite(y.obligationsDue)).toBe(true);
    });
  });

  it("flags cluster years only where two or more settlements land together", () => {
    const r = run({ sequence: MECHANISM_ORDER });
    for (const y of r.clusterYears) {
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThanOrEqual(DEFAULT_CYCLE.years);
    }
    expect(r.clusterYears).toEqual([...r.clusterYears].sort((a, b) => a - b));
  });

  it("survives an empty sequence rather than dividing by zero", () => {
    const r = run({ sequence: [] });
    expect(Number.isFinite(r.totalReleased)).toBe(true);
    expect(r.years.length).toBe(DEFAULT_CYCLE.years);
  });

  it("always explains its verdict and never promises infinity", () => {
    for (const seq of [["brrrr-dscr"], ["equity-share"], MECHANISM_ORDER] as MechanismId[][]) {
      const r = run({ sequence: seq });
      expect(r.verdict.length).toBeGreaterThan(120);
      expect(r.verdict).not.toMatch(/\binfinite\b/i);
    }
    expect(CYCLE_DISCLOSURE).toMatch(/no sequence\s*\n?\s*is infinite|never the supply of capital/i);
    expect(CYCLE_DISCLOSURE).toMatch(/forecasts nothing/i);
  });
});
