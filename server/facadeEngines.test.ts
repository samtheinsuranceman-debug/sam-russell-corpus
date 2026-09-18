// The two façade engines named in the handoff template. They compute almost
// nothing of their own, so what is worth testing is that they route to the
// right owner and that the two guarantees survive: a capital-stack refusal
// always carries a reason, and a regime figure always carries its sample size.
import { describe, it, expect } from "vitest";
import {
  capitalStack, describeStack, CAPITAL_STACK_DISCLOSURE,
} from "@shared/realEstateCapitalStackEngine";
import { THIRTY_HOUSE_OPERATOR, FIRST_TIME_HOUSEHOLD, type Situation } from "@shared/sequencePlanner";
import { MECHANISMS } from "@shared/cycleEngine";
import { THRESHOLDS } from "@shared/thresholds";
import { ARCHETYPES } from "@shared/sequenceArchetypes";
import {
  regimeAt, conditionalOdds, oddsTable, powerSwing, coverage, SERIES, THIN_SAMPLE,
  REGIME_DISCLOSURE, type SeriesId,
} from "@shared/historicalMarketRegimeEngine";

describe("capital stack façade", () => {
  it("opens every mechanism for a thirty-house operator and blocks none", () => {
    const cs = capitalStack(THIRTY_HOUSE_OPERATOR, { depth: 4, top: 1 });
    expect(cs.available.length).toBe(MECHANISMS.length);
    expect(cs.blocked).toEqual([]);
  });

  it("blocks what a first-time household cannot reach, with a reason for each", () => {
    const cs = capitalStack(FIRST_TIME_HOUSEHOLD, { depth: 4, top: 1 });
    expect(cs.blocked.length).toBeGreaterThan(0);
    for (const b of cs.blocked) {
      expect(b.reasons.length, b.mechanism).toBeGreaterThan(0);
      for (const r of b.reasons) expect(r.length, b.mechanism).toBeGreaterThan(20);
    }
  });

  it("reports only thresholds that gate a mechanism the household can reach", () => {
    const first = capitalStack(FIRST_TIME_HOUSEHOLD, { depth: 4, top: 1 });
    const thirty = capitalStack(THIRTY_HOUSE_OPERATOR, { depth: 4, top: 1 });
    expect(first.bindingThresholds.length).toBeLessThan(thirty.bindingThresholds.length);
    expect(thirty.bindingThresholds.length).toBe(THRESHOLDS.length);
    for (const t of first.bindingThresholds) expect(first.available).toContain(t.mechanism);
  });

  it("marks the covenant and statutory gates as fixed, with the reason attached", () => {
    const cs = capitalStack(THIRTY_HOUSE_OPERATOR, { depth: 4, top: 1 });
    const fixed = cs.bindingThresholds.filter((t) => t.fixed);
    expect(fixed.map((t) => t.id)).toContain("seven-pay");
    expect(fixed.map((t) => t.id)).toContain("hei-no-further-encumbrance");
    for (const t of fixed) expect(t.why.length, t.id).toBeGreaterThan(60);
  });

  it("counts the legal space at a fixed depth so households are comparable", () => {
    const a = capitalStack(THIRTY_HOUSE_OPERATOR, { depth: 4, top: 1 });
    const b = capitalStack(THIRTY_HOUSE_OPERATOR, { depth: 10, top: 1 });
    expect(a.legalPlanCount).toBe(b.legalPlanCount);
    expect(a.legalPlanCount).toBeGreaterThan(1000);
  });

  it("matches each preset household to its own archetype at the top of the list", () => {
    const cs = capitalStack(THIRTY_HOUSE_OPERATOR, { depth: 4, top: 1 });
    expect(cs.nearestArchetype?.archetype.id).toBe("thirty-house-clear-and-grow");
    expect(cs.nearestArchetype?.closeness).toBeGreaterThan(90);
  });

  it("scores every archetype and sorts them best first", () => {
    const cs = capitalStack(FIRST_TIME_HOUSEHOLD, { depth: 4, top: 1 });
    expect(cs.archetypeMatches.length).toBe(ARCHETYPES.length);
    for (let i = 1; i < cs.archetypeMatches.length; i++) {
      expect(cs.archetypeMatches[i - 1].closeness).toBeGreaterThanOrEqual(cs.archetypeMatches[i].closeness);
    }
    for (const m of cs.archetypeMatches) {
      expect(m.closeness).toBeGreaterThanOrEqual(0);
      expect(m.closeness).toBeLessThanOrEqual(100);
    }
  });

  it("describes the stack in prose that names the count, the closures and the plan", () => {
    const text = describeStack(capitalStack(FIRST_TIME_HOUSEHOLD, { depth: 4, top: 1 }));
    expect(text).toMatch(/legal plans/);
    expect(text).toMatch(/Closed:/);
    expect(text.length).toBeGreaterThan(200);
  });

  it("says in its own disclosure that it computes nothing the owners compute", () => {
    expect(CAPITAL_STACK_DISCLOSURE).toMatch(/façade|facade/i);
    expect(CAPITAL_STACK_DISCLOSURE).toMatch(/prices|rank/i);
  });
});

describe("historical regime façade", () => {
  it("reads a year's control and rates out of the record", () => {
    const r = regimeAt(2025);
    expect(r.control?.president).toBe("R");
    expect(r.leverShare).not.toBeNull();
    expect(r.bucket).toBe("right");
    expect(r.rates["top-marginal"]).toBe(37);
  });

  it("returns nulls rather than guesses outside the record", () => {
    const r = regimeAt(1800);
    expect(r.control).toBeNull();
    expect(r.leverShare).toBeNull();
    expect(r.bucket).toBeNull();
  });

  it("carries the window count on every conditional figure", () => {
    for (const id of Object.keys(SERIES) as SeriesId[]) {
      for (const h of [5, 10, 20]) {
        for (const o of oddsTable(id, h)) {
          expect(typeof o.n, `${id}@${h} ${o.bucket}`).toBe("number");
          expect(o.n).toBeGreaterThanOrEqual(0);
          expect(o.thin).toBe(o.n < THIN_SAMPLE);
          if (o.n === 0) expect(o.pHigher).toBeNull();
        }
      }
    }
  });

  it("never reports a probability with a zero sample — the failure this engine exists to prevent", () => {
    const bad = (["top-marginal", "corporate", "ltcg", "estate-exclusion"] as SeriesId[])
      .flatMap((id) => [5, 10, 15, 20, 30].flatMap((h) => oddsTable(id, h)))
      .filter((o) => o.pHigher !== null && o.n === 0);
    expect(bad).toEqual([]);
  });

  it("refuses to state a power swing when either bucket is thin", () => {
    // At ten years the left bucket holds 14 windows and the right 5 — below the
    // threshold. The honest answer is null, not zero, and not a number.
    const ten = powerSwing("top-marginal", 10);
    expect(ten.left.thin || ten.right.thin).toBe(true);
    expect(ten.swing).toBeNull();
  });

  it("keeps the unconditional stats beside every conditional one, as the fallback", () => {
    const o = conditionalOdds("top-marginal", 10, "divided");
    expect(o.unconditional.windows).toBeGreaterThan(o.n);
    expect(o.unconditional.pUp).toBeGreaterThanOrEqual(0);
  });

  it("states its own coverage, so a page can say what the record does not hold", () => {
    const c = coverage();
    expect(c.firstYear).toBeLessThanOrEqual(1946);
    expect(c.lastYear).toBeGreaterThanOrEqual(2025);
    expect(c.years).toBeGreaterThan(70);
    expect(c.sources).toBeGreaterThan(3);
  });

  it("says in its own disclosure that these are base rates, not forecasts, and why inflation is excluded", () => {
    expect(REGIME_DISCLOSURE).toMatch(/not forecasts/i);
    expect(REGIME_DISCLOSURE).toMatch(/sample size/i);
    expect(REGIME_DISCLOSURE).toMatch(/[Ii]nflation/);
  });
});
