import { describe, it, expect } from "vitest";
import {
  scoreToRarity, getNorming, ACTIVE_NORMING_VERSION, NORMING_SNAPSHOTS,
} from "./norming";

describe("norming — versioned, reproducible score → rarity", () => {
  it("active version is registered", () => {
    expect(NORMING_SNAPSHOTS[ACTIVE_NORMING_VERSION]).toBeDefined();
    expect(getNorming().version).toBe(ACTIVE_NORMING_VERSION);
  });

  it("is fully reproducible: same score + version → identical rarity", () => {
    for (const s of [0, 0.15, 0.3, 0.42, 0.5, 0.63, 0.7, 0.8, 0.9, 0.97, 1]) {
      const a = scoreToRarity(s, ACTIVE_NORMING_VERSION);
      const b = scoreToRarity(s, ACTIVE_NORMING_VERSION);
      expect(a).toBe(b);
    }
  });

  it("v1 reproduces the launch Spiral-Dynamics anchors exactly", () => {
    expect(scoreToRarity(0.3)).toBeCloseTo(3.0, 6);
    expect(scoreToRarity(0.5)).toBeCloseTo(10.0, 6);
    expect(scoreToRarity(0.7)).toBeCloseTo(100.0, 6);
    expect(scoreToRarity(0.85)).toBeCloseTo(1000.0, 6);
    expect(scoreToRarity(0.95)).toBeCloseTo(10000.0, 6);
    expect(scoreToRarity(1.0)).toBeCloseTo(100000.0, 6);
  });

  it("clamps out-of-range scores", () => {
    expect(scoreToRarity(-1)).toBe(1);
    expect(scoreToRarity(2)).toBeCloseTo(100000, 6);
  });

  it("unknown version falls back to the active snapshot (never throws)", () => {
    expect(scoreToRarity(0.5, "does-not-exist")).toBe(scoreToRarity(0.5));
    expect(getNorming("nope").version).toBe(ACTIVE_NORMING_VERSION);
  });
});
