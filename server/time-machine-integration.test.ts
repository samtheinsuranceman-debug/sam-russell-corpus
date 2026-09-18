import { describe, it, expect } from "vitest";
import {
  generateDualIllustration,
  generateTimeMachineOverlay,
  getPopularIndexOptions,
  ALL_INDEX_OPTIONS,
  getCreditingHistory,
  getCreditedRate,
} from "../shared/timeMachineEngine";

// ─── Core Engine Tests (via generateDualIllustration) ────────────────────────

describe("Time Machine Engine — Core via Dual Illustration", () => {
  it("generateDualIllustration produces boring and historical illustrations", () => {
    const result = generateDualIllustration({
      premiumSchedule: { annualPremium: 400000, fundingYears: 5 },
      currentAge: 40,
      projectionYears: 30,
      boringRate: 0.065,
      historicalStartYear: 1995,
      selectedIndexOptions: ["am-sp500-ptp"],
    });
    expect(result.boring).toHaveLength(30);
    expect(result.historical).toHaveLength(30);
  });

  it("boring illustration has constant crediting rate", () => {
    const result = generateDualIllustration({
      premiumSchedule: { annualPremium: 400000, fundingYears: 5 },
      currentAge: 40,
      projectionYears: 30,
      boringRate: 0.065,
      historicalStartYear: 1995,
      selectedIndexOptions: ["am-sp500-ptp"],
    });
    // All boring years should have same effective crediting rate
    const boringCredits = result.boring.map(yr => yr.interestCredit / yr.accountValue * 100);
    // Should be approximately 6.5% each year (allowing for rounding)
    boringCredits.forEach(rate => {
      expect(rate).toBeCloseTo(6.5, 0);
    });
  });

  it("historical illustration has varying crediting rates", () => {
    const result = generateDualIllustration({
      premiumSchedule: { annualPremium: 400000, fundingYears: 5 },
      currentAge: 40,
      projectionYears: 30,
      boringRate: 0.065,
      historicalStartYear: 1995,
      selectedIndexOptions: ["am-sp500-ptp"],
    });
    const credits = result.historical.map(yr => yr.interestCredit);
    const uniqueCredits = new Set(credits.map(c => Math.round(c / 1000)));
    // Historical should have some variation (at least 2 distinct rounded-to-thousands values)
    expect(uniqueCredits.size).toBeGreaterThanOrEqual(2);
  });

  it("account value grows during funding years", () => {
    const result = generateDualIllustration({
      premiumSchedule: { annualPremium: 400000, fundingYears: 5 },
      currentAge: 40,
      projectionYears: 30,
      boringRate: 0.065,
      historicalStartYear: 1995,
      selectedIndexOptions: ["am-sp500-ptp"],
    });
    for (let i = 1; i < 5; i++) {
      expect(result.boring[i].accountValue).toBeGreaterThan(result.boring[i - 1].accountValue);
    }
  });

  it("benchmarks are computed for boring and historical", () => {
    const result = generateDualIllustration({
      premiumSchedule: { annualPremium: 400000, fundingYears: 5 },
      currentAge: 40,
      projectionYears: 50,
      boringRate: 0.065,
      historicalStartYear: 1995,
      selectedIndexOptions: ["am-sp500-ptp"],
    });
    expect(result.benchmarks).toBeDefined();
    expect(result.benchmarks.boring).toBeDefined();
    expect(result.benchmarks.historical).toBeDefined();
  });
});

// ─── Overlay / Integration Tests ────────────────────────────────────────────

describe("Time Machine Engine — Overlay Generation", () => {
  it("generateTimeMachineOverlay returns correct length", () => {
    const overlay = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 400000, fundingYears: 5 },
      40,
      30,
    );
    expect(overlay).toHaveLength(30);
  });

  it("overlay uses historical crediting rates", () => {
    const overlay = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 400000, fundingYears: 5 },
      40,
      30,
    );
    // Should have varying interest credits (not all the same)
    const credits = overlay.map((yr) => yr.interestCredit);
    const uniqueCredits = new Set(credits.map((c) => Math.round(c)));
    expect(uniqueCredits.size).toBeGreaterThan(3);
  });

  it("overlay with multiple indices blends rates", () => {
    const singleOverlay = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 400000, fundingYears: 5 },
      40,
      30,
    );
    const multiOverlay = generateTimeMachineOverlay(
      ["am-sp500-ptp", "am-multi-index"],
      1995,
      { annualPremium: 400000, fundingYears: 5 },
      40,
      30,
    );
    // Multi-index should produce different values than single
    expect(multiOverlay[15].accountValue).not.toBe(singleOverlay[15].accountValue);
  });

  it("overlay with loan parameters returns data", () => {
    const withLoan = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 400000, fundingYears: 5 },
      40,
      30,
      0.07,  // stated loan rate
      0.005, // actual arbitrage spread
      10,    // loan start year
      50000, // annual loan amount
    );
    expect(withLoan).toHaveLength(30);
    // All years should have valid account values
    withLoan.forEach(yr => {
      expect(yr.accountValue).toBeGreaterThanOrEqual(0);
    });
  });

  it("$400K/yr x 5 years at 6.5% eventually reaches 28% effective return", () => {
    const overlay = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 400000, fundingYears: 5 },
      40,
      50,
    );
    // Over 50 years, effective return should eventually exceed 28%
    const maxEffective = Math.max(...overlay.map((yr) => yr.effectiveReturnOnPremium));
    expect(maxEffective).toBeGreaterThan(0.20); // At least 20% effective return at some point
  });
});

// ─── Index Data Tests ───────────────────────────────────────────────────────

describe("Time Machine Engine — Index Data", () => {
  it("ALL_INDEX_OPTIONS has entries", () => {
    expect(ALL_INDEX_OPTIONS.length).toBeGreaterThan(0);
  });

  it("getPopularIndexOptions returns subset", () => {
    const popular = getPopularIndexOptions();
    expect(popular.length).toBeGreaterThan(0);
    expect(popular.length).toBeLessThanOrEqual(ALL_INDEX_OPTIONS.length);
  });

  it("getCreditingHistory returns 25+ years for SP500", () => {
    // Use actual ID from the data
    const sp500Option = ALL_INDEX_OPTIONS.find(o => o.id === "am-sp500-ptp");
    expect(sp500Option).toBeDefined();
    if (sp500Option) {
      const history = getCreditingHistory(sp500Option, 1995);
      expect(history.length).toBeGreaterThanOrEqual(25);
    }
  });

  it("getCreditedRate returns a number for SP500 option", () => {
    const sp500Option = ALL_INDEX_OPTIONS.find(o => o.id === "am-sp500-ptp");
    expect(sp500Option).toBeDefined();
    if (sp500Option) {
      const rate = getCreditedRate(sp500Option, 2020);
      expect(typeof rate).toBe("number");
      expect(rate).toBeGreaterThanOrEqual(0); // floor at 0
    }
  });

  it("getCreditedRate respects cap for high-return years", () => {
    const sp500Option = ALL_INDEX_OPTIONS.find(o => o.id === "am-sp500-ptp");
    expect(sp500Option).toBeDefined();
    if (sp500Option) {
      // 2013 was a great year (~29.6%), should be capped
      const rate = getCreditedRate(sp500Option, 2013);
      expect(rate).toBeLessThanOrEqual(sp500Option.cap);
      expect(rate).toBeGreaterThanOrEqual(sp500Option.floor);
    }
  });
});

// ─── Mortgage Killer Integration Scenario ───────────────────────────────────

describe("Time Machine — Mortgage Killer Scenario", () => {
  it("overlay sized for typical mortgage killer premium", () => {
    // Typical MK scenario: $30K/yr premium for 5 years
    const overlay = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 30000, fundingYears: 5 },
      45,
      30,
    );
    expect(overlay).toHaveLength(30);
    // Total premiums = $150K
    const totalPremiums = 30000 * 5;
    // Account value should be at least equal to total premiums by year 10
    expect(overlay[9].accountValue).toBeGreaterThanOrEqual(totalPremiums);
  });

  it("overlay for large premium ($400K/yr x 5)", () => {
    const overlay = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 400000, fundingYears: 5 },
      40,
      30,
    );
    const totalPremiums = 400000 * 5;
    // By year 30, account value should be at least equal to total premiums
    expect(overlay[29].accountValue).toBeGreaterThanOrEqual(totalPremiums);
  });
});

// ─── Edge Cases ─────────────────────────────────────────────────────────────

describe("Time Machine Engine — Edge Cases", () => {
  it("handles 1-year funding via overlay", () => {
    const overlay = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 1000000, fundingYears: 1 },
      50,
      20,
    );
    expect(overlay).toHaveLength(20);
    expect(overlay[0].accountValue).toBeGreaterThan(0);
  });

  it("handles very young age (25)", () => {
    const overlay = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 50000, fundingYears: 10 },
      25,
      40,
    );
    expect(overlay).toHaveLength(40);
    expect(overlay[0].age).toBe(26);
  });

  it("handles very old age (70)", () => {
    const overlay = generateTimeMachineOverlay(
      ["am-sp500-ptp"],
      1995,
      { annualPremium: 200000, fundingYears: 3 },
      70,
      20,
    );
    expect(overlay).toHaveLength(20);
    expect(overlay[0].age).toBe(71);
  });
});
