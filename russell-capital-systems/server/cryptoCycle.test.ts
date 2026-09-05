import { describe, it, expect } from "vitest";
import {
  BITCOIN_CYCLES,
  simulateNextCycles,
  runCryptoAccumulation,
  type CryptoAccumulationInput,
} from "../shared/cryptoCycleEngine";

const defaultInput: CryptoAccumulationInput = {
  iulCashValue: 500000,
  iulGrowthRate: 0.12,
  iulLoanRate: 0.05,
  iulMaxLoanToValue: 0.90,
  annualPremium: 25000,
  premiumYearsRemaining: 10,
  loanPctForCrypto: 30,
  dcaBearMonths: 24,
  dcaBullMonths: 12,
  pctToGold: 10,
  pctToSilver: 5,
  pctToMortgagePaydown: 15,
  goldPricePerOz: 2350,
  silverPricePerOz: 28,
  strPurchasePrice: 500000,
  strDownPaymentPct: 0.30,
  strGrossIncomePct: 0.20,
  strAppreciationRate: 0.05,
  strFirstYearDepreciation: 0.40,
  strPurchaseEveryYears: 7,
  simulationYears: 30,
  startYear: 2026,
};

describe("Crypto Cycle Engine", () => {
  it("has correct historical cycle data", () => {
    expect(BITCOIN_CYCLES.length).toBeGreaterThanOrEqual(4);
    const firstCycle = BITCOIN_CYCLES[0];
    expect(firstCycle.cycle).toBe(1);
    expect(firstCycle.halvingDate).toBe("2012-11-28");
    expect(firstCycle.bullATH).toBeGreaterThan(0);
    expect(firstCycle.bearATL).toBeGreaterThan(0);
    expect(firstCycle.pctDropATHtoATL).toBeLessThan(0);
  });

  it("calculates correct drawdown percentages", () => {
    for (const cycle of BITCOIN_CYCLES) {
      expect(cycle.pctDropATHtoATL).toBeLessThan(0);
      expect(cycle.pctDropATHtoATL).toBeGreaterThan(-100);
    }
  });

  it("predicts future cycles", () => {
    const predictions = simulateNextCycles(10);
    expect(predictions.length).toBe(10);
    for (const pred of predictions) {
      expect(pred.cycle).toBeGreaterThan(4);
      expect(pred.bullATH).toBeGreaterThan(0);
      expect(pred.bearATL).toBeGreaterThan(0);
      expect(pred.bullATH).toBeGreaterThan(pred.bearATL);
    }
    // Later cycles should generally have higher ATH than first predicted cycle
    // (diminishing returns may cause some non-monotonic behavior)
    const lastPred = predictions[predictions.length - 1];
    expect(lastPred.bullATH).toBeGreaterThan(predictions[0].bullATH);
  });

  it("runs accumulation simulation with default inputs", () => {
    const result = runCryptoAccumulation(defaultInput);
    expect(result.yearlySnapshots.length).toBe(30);
    expect(result.summary.finalNetWorth).toBeGreaterThan(0);
    expect(result.summary.propertiesOwned).toBeGreaterThanOrEqual(1);
    expect(result.summary.totalCryptoProfit).toBeGreaterThanOrEqual(0);
    expect(result.realEstateSpreadsheets.length).toBeGreaterThanOrEqual(1);
    expect(result.thirtyYearSynthesis.length).toBe(30);
  });

  it("generates real estate spreadsheets with correct structure", () => {
    const result = runCryptoAccumulation(defaultInput);
    expect(result.realEstateSpreadsheets.length).toBeGreaterThanOrEqual(1);
    const firstProp = result.realEstateSpreadsheets[0];
    expect(firstProp.propertyId).toBe(1);
    expect(firstProp.purchasePrice).toBe(500000);
    expect(firstProp.downPayment).toBe(150000);
    expect(firstProp.years.length).toBeGreaterThan(0);
    const yr = firstProp.years[0];
    expect(yr.propertyValue).toBeGreaterThan(0);
    expect(yr.equity).toBeGreaterThanOrEqual(0);
    expect(yr.rentalIncome).toBeGreaterThan(0);
  });

  it("thirty year synthesis tracks all properties", () => {
    const result = runCryptoAccumulation(defaultInput);
    expect(result.thirtyYearSynthesis.length).toBe(30);
    const lastYear = result.thirtyYearSynthesis[result.thirtyYearSynthesis.length - 1];
    expect(lastYear.propertyCount).toBeGreaterThanOrEqual(1);
    expect(lastYear.totalPropertyValue).toBeGreaterThan(0);
    expect(lastYear.totalEquity).toBeGreaterThan(0);
    expect(lastYear.propertyCount).toBeGreaterThan(result.thirtyYearSynthesis[0].propertyCount);
  });
});
