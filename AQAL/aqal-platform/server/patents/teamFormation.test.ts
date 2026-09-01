// Constraint-satisfaction team formation: no doubled weakest link, coverage
// maximized greedily, honest satisfied=false when the pool can't comply.
import { describe, expect, it } from "vitest";
import { assembleTeam, type TeamCandidate } from "./teamFormation";
import { validateVector32, assertVector32 } from "../../shared/vector32";
import { interventionsForAxis } from "./weaknessInterventions";
import { ALL_AXES } from "../../shared/axisModes";

const vec = (base: number, weakAxis: number, strongAxis?: number): number[] => {
  const v = new Array(32).fill(base);
  v[weakAxis] = 0.1;
  if (strongAxis !== undefined) v[strongAxis] = 0.95;
  return v;
};

describe("assembleTeam", () => {
  it("never selects two members with the same controlling weakness", () => {
    const pool: TeamCandidate[] = [
      { id: "a", vector: vec(0.6, 3) },
      { id: "b", vector: vec(0.6, 3) }, // same weakest link as a
      { id: "c", vector: vec(0.6, 7) },
      { id: "d", vector: vec(0.6, 12) },
    ];
    const team = assembleTeam(pool, 3);
    expect(team.satisfied).toBe(true);
    const weaknesses = team.members.map((m) => m.controllingWeaknessAxis);
    expect(new Set(weaknesses).size).toBe(weaknesses.length);
  });

  it("prefers candidates whose strengths raise team coverage", () => {
    const pool: TeamCandidate[] = [
      { id: "seed", vector: vec(0.7, 0) },
      { id: "covers0", vector: vec(0.5, 5, 0) }, // strong exactly where seed is weak
      { id: "redundant", vector: vec(0.5, 9) },
    ];
    const team = assembleTeam(pool, 2);
    expect(team.members.map((m) => m.id)).toContain("covers0");
    expect(team.coverage[0]).toBeCloseTo(0.95);
  });

  it("reports satisfied=false when the constraint exhausts the pool", () => {
    const pool: TeamCandidate[] = [
      { id: 1, vector: vec(0.6, 2) },
      { id: 2, vector: vec(0.6, 2) },
      { id: 3, vector: vec(0.6, 2) },
    ];
    const team = assembleTeam(pool, 3);
    expect(team.satisfied).toBe(false);
    expect(team.members.length).toBe(1);
  });

  it("ignores malformed candidates (non-32-dim vectors)", () => {
    const team = assembleTeam([{ id: "bad", vector: [0.5, 0.5] }], 1);
    expect(team.members.length).toBe(0);
    expect(team.satisfied).toBe(false);
  });
});

describe("vector32 fixed-width contract", () => {
  const good = Array.from({ length: 32 }, (_, i) => ({ axisIndex: i, score: 0.5 }));

  it("accepts exactly 32 well-formed lines", () => {
    expect(validateVector32(good)).toEqual({ ok: true });
    expect(() => assertVector32(good)).not.toThrow();
  });

  it("rejects a 33rd line, a skipped line, and a duplicate line", () => {
    expect(validateVector32([...good, { axisIndex: 32, score: 0.5 }]).ok).toBe(false);
    expect(validateVector32(good.slice(0, 31)).ok).toBe(false);
    const dup = [...good.slice(0, 31), { axisIndex: 0, score: 0.5 }];
    expect(validateVector32(dup).ok).toBe(false);
  });

  it("rejects out-of-range scores and indices", () => {
    const bad = good.map((e, i) => (i === 4 ? { ...e, score: 1.2 } : e));
    expect(validateVector32(bad).ok).toBe(false);
    const badIdx = good.map((e, i) => (i === 4 ? { ...e, axisIndex: -1 } : e));
    expect(validateVector32(badIdx).ok).toBe(false);
  });
});

describe("weakness interventions lookup", () => {
  it("returns evidence-carrying protocols for mapped lines, PRIMARY first", () => {
    const adaptiveIdx = ALL_AXES.indexOf("Adaptive");
    const out = interventionsForAxis(adaptiveIdx);
    expect(out.length).toBeGreaterThan(0);
    for (const i of out) {
      expect(i.therapy.length).toBeGreaterThan(2);
      expect(i.cite.length).toBeGreaterThan(20); // real citation text, not a stub
      expect(typeof i.doi).toBe("string"); // DOI passes through from the audited map (may be empty on some source rows — never invented)
    }
    expect(out.some((i) => i.doi.length > 5)).toBe(true);
    const firstSecondary = out.findIndex((i) => i.role !== "PRIMARY");
    if (firstSecondary !== -1) {
      expect(out.slice(firstSecondary).every((i) => i.role !== "PRIMARY")).toBe(true);
    }
  });

  it("returns an empty list for an unknown axis instead of inventing anything", () => {
    expect(interventionsForAxis(99)).toEqual([]);
  });
});
