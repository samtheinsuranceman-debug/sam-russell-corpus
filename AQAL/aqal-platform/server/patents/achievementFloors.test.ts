// Pure-rule tests for the repeated-demonstration floor engine: a floor is
// what the member has shown TWICE — the MINIMUM of the two demonstrations,
// gated by confidence, silently skipping lines missing from either run.
import { describe, expect, it } from "vitest";
import { repeatedFloorLevels, type RepeatedScore } from "./achievementFloors";

const s = (axisIndex: number, score: number, confidence = 0.9): RepeatedScore => ({ axisIndex, score, confidence });

describe("repeatedFloorLevels", () => {
  it("floors at the MIN of the two demonstrated scores, never the max or mean", () => {
    const out = repeatedFloorLevels([s(0, 0.8), s(1, 0.4)], [s(0, 0.6), s(1, 0.7)]);
    expect(out).toEqual([
      { axisIndex: 0, level: 0.6 },
      { axisIndex: 1, level: 0.4 },
    ]);
  });

  it("skips lines below the confidence gate on either run", () => {
    const out = repeatedFloorLevels(
      [s(0, 0.8, 0.5), s(1, 0.8, 0.9)],
      [s(0, 0.7, 0.9), s(1, 0.7, 0.55)],
    );
    expect(out).toEqual([]);
  });

  it("treats missing confidence as zero (never assumes confidence it lacks)", () => {
    const out = repeatedFloorLevels(
      [{ axisIndex: 0, score: 0.8 }],
      [{ axisIndex: 0, score: 0.7, confidence: 0.9 }],
    );
    expect(out).toEqual([]);
  });

  it("only floors lines present in BOTH assessments", () => {
    const out = repeatedFloorLevels([s(0, 0.8)], [s(0, 0.75), s(5, 0.9)]);
    expect(out).toEqual([{ axisIndex: 0, level: 0.75 }]);
  });

  it("returns nothing when there is no prior evidence at all", () => {
    expect(repeatedFloorLevels([], [s(0, 0.9)])).toEqual([]);
  });
});
