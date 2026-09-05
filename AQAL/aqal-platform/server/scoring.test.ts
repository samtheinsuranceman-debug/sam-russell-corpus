import { describe, it, expect } from "vitest";
import { scoreToRarity, calculateCompositeRarity } from "./routers";
import { ALL_AXES, RARITY_AXES, STANCE_AXES, axisFeedsRarity } from "@shared/axisModes";

// Build a fixture of rarity-eligible line scores, all at the same score/confidence.
function rarityFixture(score: number, confidence: number) {
  return RARITY_AXES.map((axisName, i) => ({ axisIndex: i, axisName, score, confidence }));
}

describe("scoreToRarity — calibrated to Spiral Dynamics population distributions", () => {
  it("returns 1 for score of 0 (everyone is at least this)", () => {
    expect(scoreToRarity(0)).toBe(1);
  });

  it("returns 3 for score of 0.3 (Blue/Orange boundary = top ~33%)", () => {
    const rarity = scoreToRarity(0.3);
    expect(rarity).toBeCloseTo(3.0, 1);
  });

  it("returns ~6.5 for score of 0.4 (mid-Orange = top ~15%)", () => {
    const rarity = scoreToRarity(0.4);
    expect(rarity).toBeGreaterThan(5);
    expect(rarity).toBeLessThan(8);
  });

  it("returns 10 for score of 0.5 (Orange/Green boundary = top 10%)", () => {
    const rarity = scoreToRarity(0.5);
    expect(rarity).toBeCloseTo(10.0, 1);
  });

  it("returns ~31 for score of 0.6 (mid-Green = top ~3%)", () => {
    const rarity = scoreToRarity(0.6);
    expect(rarity).toBeGreaterThan(20);
    expect(rarity).toBeLessThan(50);
  });

  it("returns 100 for score of 0.7 (Green/Yellow boundary = top 1%)", () => {
    const rarity = scoreToRarity(0.7);
    expect(rarity).toBeCloseTo(100.0, 0);
  });

  it("returns 1000 for score of 0.85 (Yellow/Turquoise boundary = top 0.1%)", () => {
    const rarity = scoreToRarity(0.85);
    expect(rarity).toBeCloseTo(1000.0, -1);
  });

  it("returns 10000 for score of 0.95 (Turquoise/Coral boundary = top 0.01%)", () => {
    const rarity = scoreToRarity(0.95);
    expect(rarity).toBeCloseTo(10000.0, -2);
  });

  it("returns 100000 for score of 1.0 (peak Coral = top 0.001%)", () => {
    const rarity = scoreToRarity(1.0);
    expect(rarity).toBeCloseTo(100000.0, -3);
  });

  it("clamps negative scores to 0", () => {
    expect(scoreToRarity(-0.5)).toBe(1);
  });

  it("clamps scores above 1 to 1", () => {
    expect(scoreToRarity(1.5)).toBeCloseTo(100000, -3);
  });

  it("is monotonically increasing", () => {
    let prev = scoreToRarity(0);
    for (let s = 0.05; s <= 1.0; s += 0.05) {
      const current = scoreToRarity(s);
      expect(current).toBeGreaterThanOrEqual(prev);
      prev = current;
    }
  });

  it("population distribution sanity check: rarity matches claimed percentages", () => {
    // If Blue = 40% of pop, rarity at Blue ceiling should be ~2.5 (1/0.4)
    expect(scoreToRarity(0.3)).toBeCloseTo(3.0, 0); // ~top 33%

    // If Orange = top 30%, rarity at Orange ceiling should be ~3.3-10
    expect(scoreToRarity(0.5)).toBeCloseTo(10.0, 0); // top 10%

    // If Green = top 10%, rarity at Green ceiling should be ~100
    expect(scoreToRarity(0.7)).toBeCloseTo(100.0, 0); // top 1%

    // If Yellow = top 1%, rarity at Yellow ceiling should be ~1000
    expect(scoreToRarity(0.85)).toBeCloseTo(1000.0, -1); // top 0.1%

    // If Turquoise = top 0.1%, rarity at Turquoise ceiling should be ~10000
    expect(scoreToRarity(0.95)).toBeCloseTo(10000.0, -2); // top 0.01%
  });
});

describe("calculateCompositeRarity — with 0.7 LLM confidence discount", () => {
  it("returns 1 for empty scores array", () => {
    expect(calculateCompositeRarity([])).toBe(1);
  });

  it("returns low rarity (~3-7) for all-Orange scores (0.4)", () => {
    // Someone who gives typical Orange-level answers across all rarity-eligible lines
    const scores = rarityFixture(0.4, 0.8);
    const rarity = calculateCompositeRarity(scores);
    // Orange = 30% of population, with 0.7 confidence discount
    // Raw rarity at 0.4 = ~6.5, discounted by confidence → ~4-5
    expect(rarity).toBeGreaterThanOrEqual(2);
    expect(rarity).toBeLessThanOrEqual(8);
  });

  it("returns moderate rarity (~10-40) for all-Green scores (0.6)", () => {
    const scores = rarityFixture(0.6, 0.8);
    const rarity = calculateCompositeRarity(scores);
    // Green = 10% of population, raw rarity ~31, discounted
    expect(rarity).toBeGreaterThanOrEqual(8);
    expect(rarity).toBeLessThanOrEqual(50);
  });

  it("returns high rarity (~50-300) for all-Yellow scores (0.75)", () => {
    const scores = rarityFixture(0.75, 0.8);
    const rarity = calculateCompositeRarity(scores);
    // Yellow = 1% of population, raw rarity at 0.75 ~215, discounted
    expect(rarity).toBeGreaterThanOrEqual(30);
    expect(rarity).toBeLessThanOrEqual(400);
  });

  it("returns very high rarity for all-Turquoise scores (0.9)", () => {
    const scores = rarityFixture(0.9, 0.9);
    const rarity = calculateCompositeRarity(scores);
    // Turquoise = 0.1% of population, raw rarity at 0.9 ~3162, discounted
    expect(rarity).toBeGreaterThanOrEqual(500);
    expect(rarity).toBeLessThanOrEqual(5000);
  });

  it("CRITICAL: bullshit answers (capped at 0.25) produce rarity < 2", () => {
    // This is the Sam test: "I pooped in my pants" → should NOT get 1 in 37,000
    const scores = rarityFixture(0.25, 0.3);
    const rarity = calculateCompositeRarity(scores);
    expect(rarity).toBeLessThanOrEqual(2);
  });

  it("CRITICAL: typical professional answers produce rarity < 10", () => {
    // A smart professional giving decent but not extraordinary answers
    const scores = rarityFixture(0.45, 0.7); // Solid Orange
    const rarity = calculateCompositeRarity(scores);
    // Should be "1 in 4-7" — NOT "1 in 37,000"
    expect(rarity).toBeLessThanOrEqual(10);
  });

  it("low confidence reduces rarity toward 1", () => {
    const highConfRarity = calculateCompositeRarity(rarityFixture(0.7, 0.9));
    const lowConfRarity = calculateCompositeRarity(rarityFixture(0.7, 0.2));
    expect(highConfRarity).toBeGreaterThan(lowConfRarity);
  });

  it("is capped at 1,000,000", () => {
    const scores = rarityFixture(1.0, 1.0);
    const rarity = calculateCompositeRarity(scores);
    expect(rarity).toBeLessThanOrEqual(1_000_000);
  });

  it("mixed scores produce reasonable composite", () => {
    // Some lines strong, some weak — realistic profile across the rarity-eligible set.
    const pattern = [0.7, 0.6, 0.3, 0.8, 0.5, 0.7, 0.2, 0.3, 0.4, 0.6, 0.5, 0.6, 0.5, 0.7];
    const confPattern = [0.9, 0.8, 0.5, 0.9, 0.7, 0.8, 0.4, 0.5, 0.6, 0.8, 0.7, 0.8, 0.7, 0.8];
    const scores = RARITY_AXES.map((axisName, i) => ({
      axisIndex: i,
      axisName,
      score: pattern[i % pattern.length],
      confidence: confPattern[i % confPattern.length],
    }));
    const rarity = calculateCompositeRarity(scores);
    // Mixed profile with some Yellow peaks, many Green, some Blue/Orange
    // Average score ~0.55, so composite should be in Green range (~10-50)
    expect(rarity).toBeGreaterThanOrEqual(5);
    expect(rarity).toBeLessThanOrEqual(80);
  });

  it("Coral-level scores produce appropriately extreme rarity", () => {
    const scores = rarityFixture(0.97, 0.95);
    const rarity = calculateCompositeRarity(scores);
    // Coral = 0.01% of population, should be very high
    expect(rarity).toBeGreaterThanOrEqual(5000);
    expect(rarity).toBeLessThanOrEqual(100000);
  });
});

describe("32-line reconciliation — the model is the single source of truth", () => {
  it("ALL_AXES has exactly 32 lines", () => {
    expect(ALL_AXES.length).toBe(32);
  });

  it("RARITY_AXES contains no stance line", () => {
    for (const stance of STANCE_AXES) {
      expect(RARITY_AXES).not.toContain(stance);
    }
    // And every rarity-eligible line reports feedsRarity: true
    for (const axis of RARITY_AXES) {
      expect(axisFeedsRarity(axis)).toBe(true);
    }
  });

  it("feeding a stance-line score into the composite changes the result by 0", () => {
    const base = rarityFixture(0.6, 0.8);
    const withStance = [
      ...base,
      { axisIndex: 99, axisName: STANCE_AXES[0], score: 0.99, confidence: 0.99 },
    ];
    expect(calculateCompositeRarity(withStance)).toBe(calculateCompositeRarity(base));
  });

  it("geometric-mean + 0.7-discount behavior is unchanged for the rarity-eligible set", () => {
    // A uniform-score fixture must land in the same band regardless of line count:
    // the geometric mean of identical values is that value, discounted by confidence.
    expect(calculateCompositeRarity(rarityFixture(0.5, 0.8))).toBeCloseTo(
      calculateCompositeRarity([
        { axisIndex: 0, axisName: RARITY_AXES[0], score: 0.5, confidence: 0.8 },
      ]),
      0,
    );
  });
});
