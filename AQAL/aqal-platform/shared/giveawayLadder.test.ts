import { describe, it, expect } from "vitest";
import {
  COHORT_SIZE,
  GIVEAWAY_TIERS,
  giveawayTierFor,
  giveawayPriceCents,
  spotsLeftInTier,
} from "./giveawayLadder";

describe("launch giveaway ladder", () => {
  it("covers signup numbers with contiguous, ascending-price tiers", () => {
    // cohort boundaries
    expect(giveawayTierFor(1).discount).toBe(1.0);
    expect(giveawayTierFor(COHORT_SIZE).discount).toBe(1.0);
    expect(giveawayTierFor(COHORT_SIZE + 1).discount).toBe(0.75);
    expect(giveawayTierFor(COHORT_SIZE * 2).discount).toBe(0.75);
    expect(giveawayTierFor(COHORT_SIZE * 2 + 1).discount).toBe(0.5);
    expect(giveawayTierFor(COHORT_SIZE * 3 + 1).discount).toBe(0.25);
    expect(giveawayTierFor(COHORT_SIZE * 4 + 1).discount).toBe(0.0);
    expect(giveawayTierFor(9_999_999).discount).toBe(0.0);
  });

  it("prices a $39 base correctly at each tier", () => {
    const base = 3900;
    expect(giveawayPriceCents(base, 1)).toBe(0); // free
    expect(giveawayPriceCents(base, COHORT_SIZE + 1)).toBe(975); // 75% off
    expect(giveawayPriceCents(base, COHORT_SIZE * 2 + 1)).toBe(1950); // 50% off
    expect(giveawayPriceCents(base, COHORT_SIZE * 3 + 1)).toBe(2925); // 25% off
    expect(giveawayPriceCents(base, COHORT_SIZE * 4 + 1)).toBe(3900); // full
  });

  it("clamps and floors bad signup numbers to the first tier", () => {
    expect(giveawayTierFor(0).discount).toBe(1.0);
    expect(giveawayTierFor(-5).discount).toBe(1.0);
    expect(giveawayTierFor(1.9).discount).toBe(1.0);
  });

  it("reports spots left within a bounded tier and null when unbounded", () => {
    expect(spotsLeftInTier(1)).toBe(COHORT_SIZE); // whole first cohort ahead
    expect(spotsLeftInTier(COHORT_SIZE)).toBe(1); // last free spot
    expect(spotsLeftInTier(COHORT_SIZE * 4 + 100)).toBeNull(); // full-price tier is unbounded
  });

  it("has exactly five tiers, discounts strictly descending", () => {
    expect(GIVEAWAY_TIERS.length).toBe(5);
    for (let i = 1; i < GIVEAWAY_TIERS.length; i++) {
      expect(GIVEAWAY_TIERS[i].discount).toBeLessThan(GIVEAWAY_TIERS[i - 1].discount);
    }
  });
});
