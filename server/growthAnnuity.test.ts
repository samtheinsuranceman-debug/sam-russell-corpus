import { describe, it, expect } from "vitest";
import {
  FG_PRODUCT_DATA,
  INDEX_STRATEGIES,
  PRECIOUS_METALS_DATA,
  ETF_VS_TRADITIONAL,
  calculateGrowthProjection,
  calculateRothConversion,
  runGrowthAnnuityAnalysis,
  FIAT_CURRENCY_DATA,
  formatCurrency,
  formatPct,
  GrowthAnnuityInput,
} from "../shared/growthAnnuityEngine";

const baseInput: GrowthAnnuityInput = {
  initialPremium: 500000,
  annualReturnRate: 22,
  projectionYears: 20,
  existingAnnuityValue: 300000,
  currentSurrenderValue: 270000,
  existingAnnuityCompany: "Athene",
  yearsInForce: 5,
  accountType: "ira",
  surrenderPenaltyPct: 15,
  doRothConversion: true,
  premiumBonusPct: 25,
  currentTaxBracket: 28,
};

describe("Growth Annuity Engine", () => {
  it("should have valid F&G product data", () => {
    expect(FG_PRODUCT_DATA.product).toBe("F&G Power Accumulator");
    expect(FG_PRODUCT_DATA.carrier).toContain("Fidelity");
    expect(FG_PRODUCT_DATA.productType).toContain("Fixed Index Annuity");
    expect(FG_PRODUCT_DATA.amBestRating).toBeTruthy();
  });

  it("should have index strategies with valid data", () => {
    expect(INDEX_STRATEGIES.length).toBeGreaterThan(0);
    INDEX_STRATEGIES.forEach((s) => {
      expect(s.name).toBeTruthy();
      expect(s.participationRate).toBeGreaterThan(0);
      expect(s.term).toBeTruthy();
    });
  });

  it("should have precious metals performance data", () => {
    expect(PRECIOUS_METALS_DATA.gold.currentPrice).toBeGreaterThan(0);
    expect(PRECIOUS_METALS_DATA.silver.currentPrice).toBeGreaterThan(0);
    expect(PRECIOUS_METALS_DATA.gold.performance.length).toBeGreaterThan(0);
  });

  it("should have ETF vs Traditional comparison points", () => {
    expect(ETF_VS_TRADITIONAL.length).toBeGreaterThan(0);
    ETF_VS_TRADITIONAL.forEach((p) => {
      expect(p.category).toBeTruthy();
      expect(p.managedETF).toBeTruthy();
      expect(p.traditionalIndex).toBeTruthy();
    });
  });

  it("should have fiat currency data", () => {
    expect(FIAT_CURRENCY_DATA.usNationalDebt).toBeGreaterThan(0);
    expect(FIAT_CURRENCY_DATA.m2MoneySupply2025).toBeGreaterThan(0);
    expect(FIAT_CURRENCY_DATA.federalDeficit2025).toBeGreaterThan(0);
  });

  it("should calculate growth projections with positional args", () => {
    // calculateGrowthProjection(premium, annualReturn, years, startAge)
    const projections = calculateGrowthProjection(500000, 22, 20, 60);
    expect(projections.length).toBe(20);
    expect(projections[0].year).toBe(1);
    expect(projections[0].startValue).toBe(500000);
    expect(projections[0].endValue).toBeGreaterThan(500000);
    // Each year should grow
    for (let i = 1; i < projections.length; i++) {
      expect(projections[i].startValue).toBeCloseTo(projections[i - 1].endValue, 0);
      expect(projections[i].endValue).toBeGreaterThan(projections[i].startValue);
    }
  });

  it("should calculate Roth conversion correctly", () => {
    const roth = calculateRothConversion(baseInput);
    expect(roth.originalValue).toBe(270000);
    // Surrender penalty = 15% of 270000 = 40500
    expect(roth.surrenderPenalty).toBe(40500);
    expect(roth.afterPenaltyValue).toBe(229500);
    // Premium bonus = 25% of 229500 = 57375
    expect(roth.premiumBonus).toBe(57375);
    expect(roth.enhancedValue).toBe(286875);
    // Net gain over original
    expect(roth.netGainOverOriginal).toBe(286875 - 270000);
  });

  it("should run full analysis", () => {
    const result = runGrowthAnnuityAnalysis(baseInput);
    expect(result.projections.length).toBe(20);
    expect(result.traditionalProjections.length).toBe(20);
    expect(result.preciousMetalsProjections.length).toBe(20);
    expect(result.finalValue).toBeGreaterThan(500000);
    expect(result.totalGrowth).toBeGreaterThan(0);
    expect(result.averageAnnualReturn).toBeGreaterThan(0);
    // Roth conversion should be present since doRothConversion is true
    expect(result.rothConversion).toBeDefined();
    expect(result.rothProjections).toBeDefined();
    expect(result.rothProjections!.length).toBe(20);
  });

  it("should not include Roth conversion when disabled", () => {
    const input = { ...baseInput, doRothConversion: false };
    const result = runGrowthAnnuityAnalysis(input);
    // Engine uses null for disabled, not undefined
    expect(result.rothConversion).toBeNull();
    expect(result.rothProjections).toBeNull();
  });

  it("should format currency with abbreviations for large numbers", () => {
    expect(formatCurrency(1234567)).toBe("$1.23M");
    expect(formatCurrency(0)).toBe("$0");
    expect(formatCurrency(500)).toContain("$");
  });

  it("should format percentage with sign", () => {
    expect(formatPct(22.5)).toBe("+22.5%");
    expect(formatPct(0)).toBe("+0.0%");
    expect(formatPct(-5)).toContain("-");
  });
});
