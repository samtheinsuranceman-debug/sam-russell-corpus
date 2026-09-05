import { describe, it, expect } from "vitest";
import { ALL_AXES } from "./axisModes";
import {
  complementarityScore,
  matchTier,
  topComplementaryAxes,
  MATCH_AXIS_INDICES,
  MATCH_FLOOR,
} from "./matching";

const N = ALL_AXES.length;
const flat = (v: number) => Array(N).fill(v);

describe("complementarityScore", () => {
  it("uses only the 28 amount-scored lines (stance lines excluded)", () => {
    expect(MATCH_AXIS_INDICES.length).toBe(28);
  });

  it("two perfect profiles: full coverage + foundation, no gaps to fill", () => {
    const r = complementarityScore(flat(1), flat(1));
    expect(r.strengthCoverage).toBeCloseTo(1);
    expect(r.sharedFoundation).toBeCloseTo(1);
    expect(r.gapFilling).toBe(0);
    expect(r.growthPotential).toBe(0);
  });

  it("perfect opposites score high on gap filling, zero on shared foundation", () => {
    const a = ALL_AXES.map((_, i) => (i % 2 === 0 ? 0.9 : 0.2));
    const b = ALL_AXES.map((_, i) => (i % 2 === 0 ? 0.2 : 0.9));
    const r = complementarityScore(a, b);
    expect(r.gapFilling).toBeGreaterThan(0.6);
    expect(r.sharedFoundation).toBe(0);
    expect(r.score).toBeGreaterThan(MATCH_FLOOR);
  });

  it("two uniformly weak profiles never clear the quality floor", () => {
    const r = complementarityScore(flat(0.3), flat(0.3));
    expect(r.score).toBeLessThan(MATCH_FLOOR);
    expect(matchTier(r.score)).toBeNull();
  });

  it("is symmetric", () => {
    const a = ALL_AXES.map((_, i) => ((i * 7) % 10) / 10);
    const b = ALL_AXES.map((_, i) => ((i * 3 + 4) % 10) / 10);
    expect(complementarityScore(a, b).score).toBeCloseTo(complementarityScore(b, a).score, 10);
  });

  it("stance lines cannot move the score", () => {
    const a = flat(0.6);
    const b = flat(0.6);
    const bTweaked = [...b];
    const stanceIdx = ALL_AXES.indexOf("Parenting");
    bTweaked[stanceIdx] = 0.05;
    expect(complementarityScore(a, b).score).toBeCloseTo(complementarityScore(a, bTweaked).score, 10);
  });
});

describe("matchTier", () => {
  it("maps the schematic's bands", () => {
    expect(matchTier(0.9)?.label).toBe("Exceptional Match");
    expect(matchTier(0.75)?.label).toBe("Strong Match");
    expect(matchTier(0.6)?.label).toBe("Good Match");
    expect(matchTier(0.5)).toBeNull();
  });
});

describe("topComplementaryAxes", () => {
  it("finds where their strength fills my gap, most dramatic first", () => {
    const mine = flat(0.6);
    const theirs = flat(0.6);
    const logical = ALL_AXES.indexOf("Logical");
    const musical = ALL_AXES.indexOf("Musical");
    mine[logical] = 0.1; theirs[logical] = 0.95; // delta .85
    mine[musical] = 0.3; theirs[musical] = 0.8;  // delta .5
    const top = topComplementaryAxes(mine, theirs, 3);
    expect(top[0]).toMatchObject({ axis: "Logical", direction: "they_fill" });
    expect(top[1]).toMatchObject({ axis: "Musical", direction: "they_fill" });
  });
});
