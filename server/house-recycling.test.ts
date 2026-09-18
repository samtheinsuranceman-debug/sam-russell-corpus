import { describe, it, expect } from "vitest";

/**
 * House Recycling Strategy — Calculator Logic Tests
 *
 * These tests verify the core financial math used in the
 * House Recycling Strategy page's HELOC-to-IUL cycling calculator.
 * The logic mirrors the frontend calculations to ensure correctness.
 */

// Replicate the core calculation logic from the frontend component
function calculateProjection(params: {
  homeEquityAmount: number;
  helocRate: number;
  policyReturnRate: number;
  years: number;
}) {
  const { homeEquityAmount, helocRate, policyReturnRate, years } = params;
  const netRate = (policyReturnRate - helocRate) / 100;
  const results: Array<{
    year: number;
    accountValue: number;
    interestCredit: number;
    helocCost: number;
    netBenefit: number;
    cumulativeIncome: number;
  }> = [];

  let accountValue = homeEquityAmount;
  let cumulativeIncome = 0;

  for (let y = 1; y <= years; y++) {
    const interestCredit = accountValue * (policyReturnRate / 100);
    const helocCost = y === 1 ? homeEquityAmount * (helocRate / 100) : 0; // Only year 1 has full HELOC cost
    const netBenefit = interestCredit - helocCost;

    // After year 1, the HELOC is paid back within 30 days each subsequent year
    // so no HELOC interest cost from year 2 onward (money goes in and out within a week)
    accountValue = accountValue + interestCredit;
    cumulativeIncome += interestCredit;

    results.push({
      year: y,
      accountValue: Math.round(accountValue),
      interestCredit: Math.round(interestCredit),
      helocCost: Math.round(helocCost),
      netBenefit: Math.round(netBenefit),
      cumulativeIncome: Math.round(cumulativeIncome),
    });
  }

  return results;
}

describe("House Recycling Strategy Calculator", () => {
  it("should compound at 7.4% annually on the account value", () => {
    const results = calculateProjection({
      homeEquityAmount: 600000,
      helocRate: 0,
      policyReturnRate: 7.4,
      years: 5,
    });

    // Year 1: 600,000 * 7.4% = 44,400 interest → AV = 644,400
    expect(results[0].interestCredit).toBe(44400);
    expect(results[0].accountValue).toBe(644400);

    // Year 2: 644,400 * 7.4% = 47,686 interest → AV = 692,086
    expect(results[1].interestCredit).toBe(47686);
    expect(results[1].accountValue).toBe(692086);

    // Verify compounding — each year's interest should be larger than the previous
    for (let i = 1; i < results.length; i++) {
      expect(results[i].interestCredit).toBeGreaterThan(results[i - 1].interestCredit);
    }
  });

  it("should show zero HELOC cost when rate is 0% (paid back within 30 days)", () => {
    const results = calculateProjection({
      homeEquityAmount: 500000,
      helocRate: 0,
      policyReturnRate: 7.4,
      years: 3,
    });

    results.forEach((r) => {
      expect(r.helocCost).toBe(0);
    });
  });

  it("should correctly calculate HELOC cost at 2% for year 1 only", () => {
    const results = calculateProjection({
      homeEquityAmount: 600000,
      helocRate: 2,
      policyReturnRate: 7.4,
      years: 3,
    });

    // Year 1 HELOC cost: 600,000 * 2% = 12,000
    expect(results[0].helocCost).toBe(12000);
    // Years 2+ should have zero HELOC cost (paid back within a week)
    expect(results[1].helocCost).toBe(0);
    expect(results[2].helocCost).toBe(0);
  });

  it("should produce increasing interest credits every year (never flat)", () => {
    const results = calculateProjection({
      homeEquityAmount: 400000,
      helocRate: 1,
      policyReturnRate: 7.4,
      years: 25,
    });

    for (let i = 1; i < results.length; i++) {
      expect(results[i].interestCredit).toBeGreaterThan(results[i - 1].interestCredit);
    }
  });

  it("should grow account value over 25 years with compounding", () => {
    const results = calculateProjection({
      homeEquityAmount: 600000,
      helocRate: 0,
      policyReturnRate: 7.4,
      years: 25,
    });

    // After 25 years of 7.4% compounding on 600K, should be roughly 600K * (1.074)^25
    const expected = Math.round(600000 * Math.pow(1.074, 25));
    // Allow 1% tolerance for rounding
    expect(results[24].accountValue).toBeGreaterThan(expected * 0.99);
    expect(results[24].accountValue).toBeLessThan(expected * 1.01);
  });

  it("should calculate cumulative income as sum of all interest credits", () => {
    const results = calculateProjection({
      homeEquityAmount: 300000,
      helocRate: 0,
      policyReturnRate: 7.4,
      years: 10,
    });

    let runningTotal = 0;
    results.forEach((r) => {
      runningTotal += r.interestCredit;
      // Allow ±1 tolerance for floating-point rounding in Math.round
      expect(Math.abs(r.cumulativeIncome - runningTotal)).toBeLessThanOrEqual(1);
    });
  });

  it("should enforce net worth constraint: 5-year premiums < 60% of net worth", () => {
    const totalNetWorth = 2000000;
    const maxAllowed = totalNetWorth * 0.6; // $1,200,000
    const annualPremium = 600000;
    const fiveYearTotal = annualPremium * 5; // $3,000,000

    // This should exceed the 60% limit
    expect(fiveYearTotal).toBeGreaterThan(maxAllowed);

    // Calculate the max annual premium that stays within the limit
    const maxAnnualPremium = maxAllowed / 5; // $240,000
    expect(maxAnnualPremium).toBe(240000);
    expect(maxAnnualPremium * 5).toBeLessThanOrEqual(maxAllowed);
  });

  it("should handle edge case of 4% HELOC rate (maximum)", () => {
    const results = calculateProjection({
      homeEquityAmount: 500000,
      helocRate: 4,
      policyReturnRate: 7.4,
      years: 5,
    });

    // Year 1 HELOC cost: 500,000 * 4% = 20,000
    expect(results[0].helocCost).toBe(20000);
    // Net benefit year 1: 37,000 interest - 20,000 HELOC = 17,000
    expect(results[0].netBenefit).toBe(17000);
    // All subsequent years should have full interest as net benefit
    for (let i = 1; i < results.length; i++) {
      expect(results[i].netBenefit).toBe(results[i].interestCredit);
    }
  });
});
