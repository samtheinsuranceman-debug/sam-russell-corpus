// The planner's central claim is a number: on a thirty-property household,
// the legal plans run into the thousands. That is asserted here as a count,
// so a rule change that quietly shrinks the space fails the build. The other
// things worth enforcing: covenants bind per property and nowhere else; every
// archetype's sequence is legal against its own situation; and on a payoff
// goal the planner tells the truth about selling.
import { describe, it, expect } from "vitest";
import {
  THIRTY_HOUSE_OPERATOR, FIRST_TIME_HOUSEHOLD, MOVES, initialState, refusal, legalMoves, apply, runPlan,
  enumeratePlans, rankPlans, describeSequence, type Situation, type MoveId,
} from "@shared/sequencePlanner";
import { ARCHETYPES, ARCHETYPE_COUNT, LONGEST_ARCHETYPE, byLikelihood } from "@shared/sequenceArchetypes";
import { THRESHOLDS, THRESHOLD_COUNT, VARIANT_COUNT, movable, immovable, bestVariant, threshold } from "@shared/thresholds";
import { MECHANISMS } from "@shared/cycleEngine";

describe("the legal space is counted, not claimed", () => {
  it("exceeds a thousand legal plans at depth four for a thirty-property household", () => {
    const { count } = enumeratePlans(THIRTY_HOUSE_OPERATOR, 4);
    expect(count).toBeGreaterThan(1000);
  });

  it("is far smaller for a household with one property, because covenants have nowhere to route", () => {
    const one = enumeratePlans(FIRST_TIME_HOUSEHOLD, 4).count;
    const thirty = enumeratePlans(THIRTY_HOUSE_OPERATOR, 4).count;
    expect(one).toBeLessThan(thirty / 20);
  });

  it("grows with depth — the search is not exhausting itself early", () => {
    const d3 = enumeratePlans(THIRTY_HOUSE_OPERATOR, 3).count;
    const d4 = enumeratePlans(THIRTY_HOUSE_OPERATOR, 4).count;
    expect(d4).toBeGreaterThan(d3 * 3);
  });
});

describe("covenants bind per property", () => {
  it("refuses a line on the primary after an equity share on the primary", () => {
    const s = THIRTY_HOUSE_OPERATOR;
    const st = initialState(s);
    apply(st, s, "equity:30y", 1);
    expect(refusal(st, s, "velocity:standard")?.reason).toMatch(/no-further-encumbrance/);
  });

  it("still permits every rental-side move after an equity share on the primary", () => {
    const s = THIRTY_HOUSE_OPERATOR;
    const st = initialState(s);
    apply(st, s, "equity:30y", 1);
    for (const id of ["brrrr:portfolio-blanket", "refi:single", "sale:outright", "wrap:carry", "brrrr:standard"] as MoveId[]) {
      expect(refusal(st, s, id), id).toBeNull();
    }
  });

  it("permits the line first and the equity share behind it", () => {
    const s = THIRTY_HOUSE_OPERATOR;
    const st = initialState(s);
    expect(refusal(st, s, "velocity:standard")).toBeNull();
    apply(st, s, "velocity:standard", 1);
    expect(refusal(st, s, "equity:30y")).toBeNull();
  });

  it("refuses a blanket loan while any rental carries a seller note", () => {
    const s = { ...THIRTY_HOUSE_OPERATOR, rentals: 6 };
    const st = initialState(s);
    apply(st, s, "wrap:buy-on-terms", 1);
    expect(refusal(st, s, "brrrr:portfolio-blanket")?.reason).toMatch(/seller note/);
  });

  it("gives a reason for every refusal, never a bare no", () => {
    const st = initialState(FIRST_TIME_HOUSEHOLD);
    for (const m of MOVES) {
      const r = refusal(st, FIRST_TIME_HOUSEHOLD, m.id);
      if (r) expect(r.reason.length, m.id).toBeGreaterThan(30);
    }
  });
});

describe("the numbers come from the engine and the registry", () => {
  it("delayed financing caps proceeds at cost, standard seasoning returns 75% of value", () => {
    // Reserve above the all-in cost, so the acquisition is not refused for the wrong reason.
    const s = { ...THIRTY_HOUSE_OPERATOR, renovationUplift: 1.4, reserve: 300_000 };
    const a = runPlan(s, ["brrrr:delayed-financing"])!;
    const b = runPlan(s, ["brrrr:standard"])!;
    expect(a.stages[0].capitalOut).toBeLessThanOrEqual(a.stages[0].capitalIn);
    expect(b.stages[0].capitalOut).toBeGreaterThan(b.stages[0].capitalIn);
    expect(a.stages[0].months).toBeLessThan(b.stages[0].months);
    expect(a.stages[0].via).toBe("Delayed financing exception");
  });

  it("marks the equity share as a balloon and the BRRRR as amortising", () => {
    const p = runPlan(THIRTY_HOUSE_OPERATOR, ["equity:10y", "brrrr:standard"])!;
    expect(p.stages[0].amortises).toBe(false);
    expect(p.stages[1].amortises).toBe(true);
    expect(p.balloons).toBe(1);
  });

  it("tells the truth on a payoff goal: the fastest route sells part of the portfolio", () => {
    const s: Situation = { ...THIRTY_HOUSE_OPERATOR, goal: "payoff", horizonYears: 3 };
    const [best] = rankPlans(s, { depth: 8, width: 20, top: 1 });
    expect(best.moves.filter((m) => m === "sale:outright").length).toBeGreaterThan(2);
    expect(best.final.totalDebt).toBeLessThan(initialStateDebt(s) * 0.6);
  });

  it("never returns a plan that ends with a negative reserve at the top of the ranking", () => {
    for (const s of [THIRTY_HOUSE_OPERATOR, FIRST_TIME_HOUSEHOLD]) {
      const [best] = rankPlans(s, { depth: 6, width: 20, top: 1 });
      expect(best.final.reserve).toBeGreaterThanOrEqual(0);
    }
  });

  it("runs a twenty-stage search in under three seconds", () => {
    const t = Date.now();
    rankPlans(THIRTY_HOUSE_OPERATOR, { depth: 20, width: 20, top: 2 });
    expect(Date.now() - t).toBeLessThan(3000);
  });

  it("describes a sequence with the move labels a reader recognises", () => {
    expect(describeSequence(["velocity:standard", "brrrr:standard"])).toContain("Velocity on the primary residence");
  });
});

function initialStateDebt(s: Situation): number {
  const st = initialState(s);
  return st.assets.reduce((n, a) => n + a.debt, 0);
}

describe("archetypes", () => {
  it("carries twelve, the longest over twenty stages", () => {
    expect(ARCHETYPE_COUNT).toBe(12);
    expect(LONGEST_ARCHETYPE).toBeGreaterThanOrEqual(20);
  });

  it("is legal against its own situation, every one", () => {
    const illegal = ARCHETYPES.filter((a) => runPlan(a.situation, a.sequence) === null);
    expect(illegal.map((a) => a.id)).toEqual([]);
  });

  it("names the thirty-house operator and gives it a low likelihood, because it is rare", () => {
    const a = ARCHETYPES.find((x) => x.id === "thirty-house-clear-and-grow")!;
    expect(a.situation.rentals).toBe(30);
    expect(a.likelihood).toBeLessThanOrEqual(3);
  });

  it("puts the household bank near the top by likelihood, because most people are that household", () => {
    expect(byLikelihood().slice(0, 2).map((a) => a.id)).toContain("household-bank");
  });

  it("writes real reasoning into every field", () => {
    for (const a of ARCHETYPES) {
      expect(a.who.length, a.id).toBeGreaterThan(60);
      expect(a.whyThisOrder.length, a.id).toBeGreaterThan(150);
      expect(a.shinesWhen.length, a.id).toBeGreaterThanOrEqual(2);
      expect(a.failsWhen.length, a.id).toBeGreaterThan(60);
      expect(a.emergent.length, a.id).toBeGreaterThan(60);
      expect(a.confidence).toBeGreaterThanOrEqual(1);
      expect(a.confidence).toBeLessThanOrEqual(10);
      expect(a.likelihood).toBeGreaterThanOrEqual(1);
      expect(a.likelihood).toBeLessThanOrEqual(10);
    }
  });

  it("ends the landlord exit with the most balloons, and says so in its own failsWhen", () => {
    const exit = ARCHETYPES.find((x) => x.id === "landlord-exit")!;
    const p = runPlan(exit.situation, exit.sequence)!;
    const others = ARCHETYPES.filter((x) => x.id !== "landlord-exit").map((x) => runPlan(x.situation, x.sequence)!.balloons);
    expect(p.balloons).toBeGreaterThanOrEqual(Math.max(...others));
    expect(exit.failsWhen).toMatch(/due-on-sale/);
  });
});

describe("the threshold registry", () => {
  it("covers every mechanism", () => {
    const covered = new Set(THRESHOLDS.map((t) => t.mechanism));
    for (const m of MECHANISMS) expect(covered.has(m.id), m.id).toBe(true);
  });

  it("carries a source URL on every standard figure and every variant", () => {
    for (const t of THRESHOLDS) {
      expect(t.standardSource, t.id).toMatch(/^https:\/\//);
      for (const v of t.variants) expect(v.source, `${t.id}/${v.name}`).toMatch(/^https:\/\//);
      if (t.fixed) expect(t.fixed.source, t.id).toMatch(/^https:\/\//);
    }
  });

  it("marks the equity-share covenant, the seven-pay limit and due-on-sale as fixed, with an authority", () => {
    for (const id of ["hei-no-further-encumbrance", "seven-pay", "due-on-sale-exposure"]) {
      const t = threshold(id)!;
      expect(t.fixed, id).toBeTruthy();
      expect(t.fixed!.authority.length, id).toBeGreaterThan(5);
    }
  });

  it("has at least one variant on every threshold that is not fixed, and a trade-off on every variant", () => {
    for (const t of THRESHOLDS) {
      if (!t.fixed) expect(t.variants.length, `${t.id} is neither fixed nor movable`).toBeGreaterThan(0);
      for (const v of t.variants) {
        expect(v.tradeoff.length, `${t.id}/${v.name}`).toBeGreaterThan(40);
        expect(v.evidence).toBeGreaterThanOrEqual(1);
        expect(v.evidence).toBeLessThanOrEqual(10);
      }
    }
  });

  it("picks the best variant in the right direction for the unit", () => {
    const seasoning = threshold("dscr-seasoning")!;
    expect(bestVariant(seasoning).value).toBe(0);
    const ltv = threshold("dscr-cashout-ltv")!;
    expect(bestVariant(ltv).value).toBe(80);
  });

  it("counts what it says it counts", () => {
    expect(THRESHOLD_COUNT).toBe(THRESHOLDS.length);
    expect(VARIANT_COUNT).toBe(THRESHOLDS.reduce((n, t) => n + t.variants.length, 0));
    expect(movable().length + immovable().filter((t) => t.variants.length === 0).length).toBe(THRESHOLDS.length);
  });

  it("states that no exemption covers a wrap, in the registry's own words", () => {
    expect(threshold("due-on-sale-exposure")!.fixed!.reason).toMatch(/No Garn-St Germain exemption covers a wraparound/);
  });
});
