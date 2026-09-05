import { describe, expect, it } from "vitest";
import { computeLockInStatus, computeRaffleEligibility } from "./db";

describe("computeLockInStatus", () => {
  it("returns victory lock when lockedStatus is victory_locked", () => {
    const result = computeLockInStatus(80, "victory_locked");
    expect(result.status).toBe("royalty");
    expect(result.lockedAvatar).toBe("victory");
    expect(result.message).toContain("permanent identity");
  });

  it("returns royalty when score is at or above 75 without persisted lock", () => {
    const result = computeLockInStatus(75, "none");
    expect(result.status).toBe("royalty");
    expect(result.lockedAvatar).toBe("victory");
    expect(result.message).toContain("royalty territory");
  });

  it("returns active for mid-range scores (50-74)", () => {
    const result = computeLockInStatus(50, "none");
    expect(result.status).toBe("active");
    expect(result.lockedAvatar).toBeNull();
    expect(result.message).toContain("progress");
  });

  it("returns building for low scores (below 50)", () => {
    const result = computeLockInStatus(25, "none");
    expect(result.status).toBe("building");
    expect(result.lockedAvatar).toBeNull();
    expect(result.message).toContain("building");
  });

  it("returns building for score of 0", () => {
    const result = computeLockInStatus(0, "none");
    expect(result.status).toBe("building");
    expect(result.lockedAvatar).toBeNull();
  });

  it("victory_locked overrides even if score is below 75", () => {
    const result = computeLockInStatus(40, "victory_locked");
    expect(result.status).toBe("royalty");
    expect(result.lockedAvatar).toBe("victory");
  });
});

describe("computeRaffleEligibility", () => {
  it("returns eligible when subscribed 6+ months and 90+ days at 75", () => {
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
    const result = computeRaffleEligibility(
      { subscriptionStartedAt: sevenMonthsAgo, subscriptionStatus: "active" },
      80,
      95
    );
    expect(result.eligible).toBe(true);
    expect(result.status).toBe("Qualified!");
    expect(result.monthsSubscribed).toBeGreaterThanOrEqual(6);
    expect(result.daysAt75Plus).toBe(95);
  });

  it("returns not eligible when subscribed less than 6 months", () => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const result = computeRaffleEligibility(
      { subscriptionStartedAt: twoMonthsAgo, subscriptionStatus: "active" },
      80,
      95
    );
    expect(result.eligible).toBe(false);
    expect(result.status).toBe("Need 6 months subscribed");
  });

  it("returns not eligible when days at 75+ is less than 90", () => {
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
    const result = computeRaffleEligibility(
      { subscriptionStartedAt: sevenMonthsAgo, subscriptionStatus: "active" },
      80,
      45
    );
    expect(result.eligible).toBe(false);
    expect(result.status).toBe("Need 90 days at 75+");
  });

  it("returns not eligible when subscription is not active", () => {
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
    const result = computeRaffleEligibility(
      { subscriptionStartedAt: sevenMonthsAgo, subscriptionStatus: "expired" },
      80,
      95
    );
    expect(result.eligible).toBe(false);
    expect(result.monthsSubscribed).toBe(0);
  });

  it("returns not eligible with no subscription start date", () => {
    const result = computeRaffleEligibility(
      { subscriptionStartedAt: null, subscriptionStatus: "free_trial" },
      80,
      0
    );
    expect(result.eligible).toBe(false);
    expect(result.monthsSubscribed).toBe(0);
  });
});
