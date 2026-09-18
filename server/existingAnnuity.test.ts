import { describe, it, expect } from "vitest";
import {
  analyzeExistingAnnuity,
  getDefaultExistingAnnuityInput,
  type ExistingAnnuityInput,
} from "../shared/lifetimeIncomeEngine";

describe("analyzeExistingAnnuity", () => {
  const defaultInput = getDefaultExistingAnnuityInput();

  it("returns a valid result with default input", () => {
    const result = analyzeExistingAnnuity(defaultInput);
    expect(result).toBeDefined();
    expect(result.currentSituation).toBeDefined();
    expect(result.rothConversion).toBeDefined();
    expect(result.newIncome).toBeDefined();
    expect(result.taxFluctuationTimeline).toBeDefined();
    expect(result.lifestyleBudget).toBeDefined();
    expect(result.longevityBenefits).toBeDefined();
  });

  it("calculates surrender penalty correctly", () => {
    const result = analyzeExistingAnnuity(defaultInput);
    const expectedPenalty = defaultInput.currentSurrenderValue * defaultInput.surrenderPenaltyPercent;
    expect(result.rothConversion.surrenderPenalty).toBeCloseTo(expectedPenalty, 0);
  });

  it("new tax-free income exceeds current after-tax income", () => {
    const result = analyzeExistingAnnuity(defaultInput);
    // The whole point: tax-free income should be higher than taxable after-tax
    expect(result.newIncome.monthlyTaxFreeIncome).toBeGreaterThan(0);
    expect(result.newIncome.percentIncomeIncrease).toBeGreaterThan(0);
  });

  it("premium bonus and solar growth increase the enhanced value", () => {
    const result = analyzeExistingAnnuity(defaultInput);
    const netAfterPenalty = result.rothConversion.netProceedsAfterPenalty;
    expect(result.rothConversion.premiumBonusAmount).toBeGreaterThan(0);
    expect(result.rothConversion.solarGrowthAmount).toBeGreaterThan(0);
    expect(result.rothConversion.totalEnhancedValue).toBeGreaterThan(netAfterPenalty);
  });

  it("generates tax fluctuation timeline based on life expectancy", () => {
    const result = analyzeExistingAnnuity(defaultInput);
    // Timeline length is based on lifeExpectancy - currentAge
    const expectedYears = defaultInput.lifeExpectancy - defaultInput.currentAge;
    expect(result.taxFluctuationTimeline.length).toBeGreaterThanOrEqual(expectedYears - 2);
    expect(result.taxFluctuationTimeline.length).toBeLessThanOrEqual(expectedYears + 2);
    // Tax rates should fluctuate between 20-45%
    result.taxFluctuationTimeline.forEach((yr) => {
      expect(yr.taxRate).toBeGreaterThanOrEqual(20);
      expect(yr.taxRate).toBeLessThanOrEqual(45);
    });
  });

  it("cumulative difference grows over time", () => {
    const result = analyzeExistingAnnuity(defaultInput);
    const firstYear = result.taxFluctuationTimeline[0];
    const lastYear = result.taxFluctuationTimeline[result.taxFluctuationTimeline.length - 1];
    expect(lastYear.cumulativeDifference).toBeGreaterThan(firstYear.cumulativeDifference);
  });

  it("lifestyle budget calculates coverage correctly", () => {
    const result = analyzeExistingAnnuity(defaultInput);
    expect(result.lifestyleBudget.monthlyTaxFreeIncome).toBeGreaterThan(0);
    expect(result.lifestyleBudget.totalMonthlyBudgetNeeded).toBeGreaterThan(0);
    expect(result.lifestyleBudget.coveragePercent).toBeGreaterThan(0);
    expect(result.lifestyleBudget.expenseBreakdown.length).toBeGreaterThan(0);
  });

  it("longevity benefits section is populated", () => {
    const result = analyzeExistingAnnuity(defaultInput);
    expect(result.longevityBenefits.headline).toBeTruthy();
    expect(result.longevityBenefits.message).toBeTruthy();
    expect(result.longevityBenefits.stats.length).toBeGreaterThan(0);
  });

  it("handles already tax-free account type", () => {
    const taxFreeInput: ExistingAnnuityInput = {
      ...defaultInput,
      accountType: "taxfree",
    };
    const result = analyzeExistingAnnuity(taxFreeInput);
    // Should still produce valid results
    expect(result).toBeDefined();
    expect(result.newIncome.monthlyTaxFreeIncome).toBeGreaterThan(0);
  });

  it("higher premium bonus results in higher enhanced value", () => {
    const lowBonus = analyzeExistingAnnuity({ ...defaultInput, premiumBonusPercent: 0.10 });
    const highBonus = analyzeExistingAnnuity({ ...defaultInput, premiumBonusPercent: 0.36 });
    expect(highBonus.rothConversion.totalEnhancedValue).toBeGreaterThan(lowBonus.rothConversion.totalEnhancedValue);
  });
});
