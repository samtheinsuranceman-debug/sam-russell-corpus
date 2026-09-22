/**
 * Regression: the flagship once summed two alternative deployments of the same
 * saved-interest dollars (reinvested compounding AND a MYGA) into "total
 * wealth created", counting every saved dollar twice. This pins the corrected
 * identity and proves the MYGA figure is reported beside the total, not in it.
 */
import { describe, expect, it } from "vitest";
import { runMortgageKillerAnalysis, type MortgageKillerInput } from "../shared/mortgageKiller";

describe("Mortgage Killer: saved interest is counted once", () => {
  const input: MortgageKillerInput = {
    mortgageBalance: 400_000,
    mortgageRate: 0.065,
    mortgageTermMonths: 360,
    monthlyMortgagePayment: 2_528,
    monthlyInterestOnlyPayment: 2_167,
    totalInterestPayments: 510_000,
    homeEquityValue: 200_000,
    homeMarketValue: 600_000,
    iraValue: 150_000,
    cashValue: 50_000,
    investments: 100_000,
    annuities: 0,
    otherInvestments: 0,
    cryptocurrency: 0,
    annualIncome: 300_000,
  };
  const result = runMortgageKillerAnalysis(input);

  it("total wealth = reinvested savings + policy cash value, and nothing else", () => {
    expect(result.summary.totalWealthCreated).toBe(
      result.interestSavings.compoundedValue20yr + result.summary.finalPolicyCashValue,
    );
  });

  it("the MYGA path is an alternative reported beside the total, never added on top", () => {
    expect(result.summary.alternativeMygaDeployment).toBe(result.interestSavings.mgaAnnuityValue30yr);
    if (result.interestSavings.totalInterestSaved > 0) {
      expect(result.summary.totalWealthCreated).toBeLessThan(
        result.interestSavings.compoundedValue20yr + result.summary.finalPolicyCashValue + result.interestSavings.mgaAnnuityValue30yr,
      );
    }
  });
});
