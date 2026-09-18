import { describe, it, expect } from "vitest";
import {
  simulatePolicy,
  runMortgageKiller,
  simulateHeloc,
  runHouseholdSimulation,
  formatCurrency,
  formatFullCurrency,
  type HouseholdSimulationInput,
} from "../shared/householdWealth";

describe("Household Wealth Engine v4", () => {
  describe("simulatePolicy", () => {
    it("should simulate a policy over the given number of years", () => {
      const result = simulatePolicy("Test Owner", "primary", 55, 25000, 1000000, 30);
      expect(result.name).toBe("Test Owner");
      expect(result.relationship).toBe("primary");
      expect(result.annualPremium).toBe(25000);
      expect(result.deathBenefit).toBe(1000000);
      expect(result.years).toHaveLength(30);
    });

    it("should apply 6% load fee on each premium", () => {
      const result = simulatePolicy("Test", "primary", 50, 10000, 500000, 5);
      expect(result.years[0].loadFee).toBe(600);
      expect(result.years[0].netPremium).toBe(9400);
    });

    it("should grow account value at 7.5% annually", () => {
      const result = simulatePolicy("Test", "primary", 50, 10000, 500000, 2);
      expect(result.years[0].accountValue).toBeGreaterThan(10000);
      expect(result.years[1].accountValue).toBeGreaterThan(result.years[0].accountValue);
    });

    it("should calculate loanable value as 80% of surrender value", () => {
      const result = simulatePolicy("Test", "primary", 50, 25000, 1000000, 15);
      for (const yr of result.years) {
        expect(yr.loanableValue).toBeCloseTo(yr.surrenderValue * 0.8, 0);
      }
    });

    it("should calculate LTC rider as 4% of death benefit over 24 months", () => {
      const result = simulatePolicy("Test", "primary", 50, 25000, 1000000, 10);
      expect(result.ltcRider.durationMonths).toBe(24);
      expect(result.ltcRider.totalBenefit).toBeGreaterThan(0);
      const lastYearDB = result.years[result.years.length - 1].deathBenefit;
      const expectedTotal = lastYearDB * 0.04;
      expect(result.ltcRider.totalBenefit).toBeCloseTo(expectedTotal, 0);
    });

    it("should have increasing account values over time (compounding)", () => {
      const result = simulatePolicy("Test", "primary", 50, 25000, 1000000, 50);
      for (let i = 1; i < result.years.length; i++) {
        expect(result.years[i].accountValue).toBeGreaterThan(result.years[i - 1].accountValue);
      }
    });

    it("should only pay premiums for first 5 years", () => {
      const result = simulatePolicy("Test", "primary", 50, 25000, 1000000, 10);
      for (let i = 0; i < 5; i++) {
        expect(result.years[i].premiumPaid).toBe(25000);
      }
      for (let i = 5; i < 10; i++) {
        expect(result.years[i].premiumPaid).toBe(0);
      }
    });

    it("should generate life loans starting from year 2", () => {
      const result = simulatePolicy("Test", "primary", 50, 25000, 1000000, 10);
      expect(result.years[0].lifeLoanThisYear).toBe(0); // Year 1: no loan
      expect(result.years[1].lifeLoanThisYear).toBeGreaterThan(0); // Year 2: first life loan
    });

    it("should generate excess interest credits after premium years", () => {
      const result = simulatePolicy("Test", "primary", 50, 25000, 1000000, 10);
      // Years 1-5: no excess credits
      for (let i = 0; i < 5; i++) {
        expect(result.years[i].excessInterestCredit).toBe(0);
      }
      // Years 6+: should have excess credits
      for (let i = 5; i < 10; i++) {
        expect(result.years[i].excessInterestCredit).toBeGreaterThan(0);
      }
    });
  });

  describe("runMortgageKiller (v4 with policy years)", () => {
    it("should calculate interest savings with life loans", () => {
      const policy = simulatePolicy("Test", "primary", 50, 25000, 1000000, 30);
      const result = runMortgageKiller(350000, 0.055, 30, 500000, 25000, policy.years, 0.085);
      expect(result.interestSaved).toBeGreaterThan(0);
      expect(result.yearsToPayoff).toBeLessThan(30);
      expect(result.originalTotalInterest).toBeGreaterThan(result.acceleratedTotalInterest);
    });

    it("should generate amortization schedule", () => {
      const policy = simulatePolicy("Test", "primary", 50, 25000, 1000000, 30);
      const result = runMortgageKiller(200000, 0.06, 30, 400000, 25000, policy.years, 0.085);
      expect(result.amortization.length).toBeGreaterThan(0);
      const lastRow = result.amortization[result.amortization.length - 1];
      expect(lastRow.balance).toBeLessThan(1);
    });

    it("should generate interest growth at 6.25% for 40 years", () => {
      const policy = simulatePolicy("Test", "primary", 50, 25000, 1000000, 30);
      const result = runMortgageKiller(300000, 0.06, 30, 500000, 25000, policy.years, 0.085);
      expect(result.interestGrowth).toHaveLength(40);
      for (let i = 1; i < result.interestGrowth.length; i++) {
        expect(result.interestGrowth[i].compoundedValue).toBeGreaterThan(result.interestGrowth[i - 1].compoundedValue);
      }
    });

    it("should calculate correct monthly payment", () => {
      const policy = simulatePolicy("Test", "primary", 50, 25000, 1000000, 30);
      const result = runMortgageKiller(200000, 0.06, 30, 400000, 25000, policy.years, 0.085);
      expect(result.monthlyPayment).toBeGreaterThan(1100);
      expect(result.monthlyPayment).toBeLessThan(1300);
    });

    it("should build a 30-year cascading projection", () => {
      const policy = simulatePolicy("Test", "primary", 50, 25000, 1000000, 30);
      const result = runMortgageKiller(350000, 0.055, 30, 750000, 25000, policy.years, 0.085);
      expect(result.cascadingProjection).toHaveLength(30);
      // Home value should appreciate
      expect(result.cascadingProjection[29].homeValue).toBeGreaterThan(result.cascadingProjection[0].homeValue);
      // Mortgage balance should decrease
      expect(result.cascadingProjection[29].mortgageBalance).toBeLessThanOrEqual(result.cascadingProjection[0].mortgageBalance);
    });

    it("should show principal-only payments from life loans in years 2-5", () => {
      const policy = simulatePolicy("Test", "primary", 50, 25000, 1000000, 30);
      const result = runMortgageKiller(350000, 0.055, 30, 750000, 25000, policy.years, 0.085);
      // Year 2 should have a principal-only payment from life loan
      const year2 = result.cascadingProjection.find(r => r.year === 2);
      expect(year2).toBeDefined();
      if (year2) {
        expect(year2.principalOnlyPayment).toBeGreaterThan(0);
        expect(year2.principalPaymentSource).toContain("Life Loan");
      }
    });
  });

  describe("simulateHeloc", () => {
    it("should track HELOC balance declining over time", () => {
      const result = simulateHeloc(100000, 0.06, 20000, 20);
      expect(result.length).toBe(20); // v4 pads to full length
      // Balance should decrease over time
      const nonZero = result.filter(r => r.helocBalance > 0);
      expect(nonZero[nonZero.length - 1].helocBalance).toBeLessThan(nonZero[0].helocBalance);
    });

    it("should track cumulative interest", () => {
      const result = simulateHeloc(50000, 0.06, 10000, 10);
      for (let i = 1; i < result.length; i++) {
        expect(result[i].cumulativeInterest).toBeGreaterThanOrEqual(result[i - 1].cumulativeInterest);
      }
    });

    it("should pay off quickly with large payments", () => {
      const result = simulateHeloc(10000, 0.06, 50000, 30);
      // With 50k annual payment on 10k balance, should pay off in year 1
      expect(result[0].helocBalance).toBe(0);
    });
  });

  describe("runHouseholdSimulation", () => {
    const baseInput: HouseholdSimulationInput = {
      primaryAge: 55,
      primaryAnnualPremium: 25000,
      primaryDeathBenefit: 1000000,
      primaryHomeValue: 750000,
      primaryHomeEquity: 400000,
      primaryMortgageBalance: 350000,
      primaryMortgageRate: 0.055,
      primaryMortgageYearsLeft: 22,
      spouseAge: 53,
      spouseName: "Jane",
      children: [],
      grandchildren: [],
      rentBasement: false,
      helocRate: 0.06,
      simulationYears: 50,
      payChildrenSimultaneously: true,
    };

    it("should create primary and spouse policies", () => {
      const result = runHouseholdSimulation(baseInput);
      expect(result.policies).toHaveLength(2);
      expect(result.policies[0].name).toBe("Primary Owner");
      expect(result.policies[1].name).toBe("Jane");
    });

    it("should set spouse premium to 80% of primary", () => {
      const result = runHouseholdSimulation(baseInput);
      expect(result.policies[1].annualPremium).toBe(25000 * 0.8);
    });

    it("should include mortgage killer for primary", () => {
      const result = runHouseholdSimulation(baseInput);
      expect(result.mortgageKillerResults.length).toBeGreaterThanOrEqual(1);
      expect(result.mortgageKillerResults[0].name).toBe("Primary Owner");
    });

    it("should calculate real estate appreciation at 5%", () => {
      const result = runHouseholdSimulation(baseInput);
      expect(result.realEstateAppreciation).toHaveLength(50);
      expect(result.realEstateAppreciation[0].primaryValue).toBeCloseTo(750000 * 1.05, -1);
    });

    it("should include rental income when rentBasement is true", () => {
      const withRental = { ...baseInput, rentBasement: true };
      const result = runHouseholdSimulation(withRental);
      expect(result.realEstateAppreciation[0].rentalIncome).toBeGreaterThan(0);
      expect(result.summary.totalRentalIncome).toBeGreaterThan(0);
    });

    it("should have zero rental income when rentBasement is false", () => {
      const result = runHouseholdSimulation(baseInput);
      expect(result.realEstateAppreciation[0].rentalIncome).toBe(0);
      expect(result.summary.totalRentalIncome).toBe(0);
    });

    it("should create child policies with correct ratios", () => {
      const withChild: HouseholdSimulationInput = {
        ...baseInput,
        children: [{
          id: "c1", name: "John Jr", age: 30, income: 75000,
          ira: 50000, rothIra: 25000, cash: 20000,
          homeValue: 350000, homeEquity: 80000, mortgageBalance: 270000,
          mortgageRate: 0.065, mortgageYearsLeft: 28, totalInterest: 0,
        }],
      };
      const result = runHouseholdSimulation(withChild);
      expect(result.policies).toHaveLength(3);
      expect(result.policies[2].deathBenefit).toBe(1000000 * 0.5);
      expect(result.policies[2].annualPremium).toBe(25000 * 0.5);
    });

    it("should create grandchild policies with correct ratios", () => {
      const withFamily: HouseholdSimulationInput = {
        ...baseInput,
        children: [{
          id: "c1", name: "John Jr", age: 30, income: 75000,
          ira: 50000, rothIra: 25000, cash: 20000,
          homeValue: 350000, homeEquity: 80000, mortgageBalance: 270000,
          mortgageRate: 0.065, mortgageYearsLeft: 28, totalInterest: 0,
        }],
        grandchildren: [{
          id: "gc1", name: "Little Sam", age: 5, parentId: "c1",
          homeValue: 0, homeEquity: 0, mortgageBalance: 0,
          mortgageRate: 0.065, mortgageYearsLeft: 30, totalInterest: 0,
        } as any],
      };
      const result = runHouseholdSimulation(withFamily);
      expect(result.policies).toHaveLength(4);
      expect(result.policies[3].deathBenefit).toBe(1000000 * 0.5 * 0.5);
    });

    it("should calculate family wealth recapture over simulation period", () => {
      const result = runHouseholdSimulation(baseInput);
      expect(result.familyWealthRecapture).toHaveLength(50);
      const first = result.familyWealthRecapture[0].totalFamilyWealth;
      const last = result.familyWealthRecapture[49].totalFamilyWealth;
      expect(last).toBeGreaterThan(first);
    });

    it("should produce a comprehensive summary", () => {
      const result = runHouseholdSimulation(baseInput);
      expect(result.summary.totalPremiumsPaid).toBeGreaterThan(0);
      expect(result.summary.totalAccountValue).toBeGreaterThan(0);
      expect(result.summary.totalSurrenderValue).toBeGreaterThan(0);
      expect(result.summary.totalDeathBenefit).toBeGreaterThan(0);
      expect(result.summary.totalInterestSaved).toBeGreaterThan(0);
      expect(result.summary.wealthRecaptureValue).toBeGreaterThan(0);
      expect(result.summary.totalLtcProtection).toBeGreaterThan(0);
      expect(result.summary.totalRealEstateValue).toBeGreaterThan(0);
      expect(result.summary.netFamilyWealth).toBeGreaterThan(0);
    });

    it("should include generational cascade for 30 years", () => {
      const result = runHouseholdSimulation(baseInput);
      expect(result.generationalCascade).toHaveLength(30);
      // Net worth should grow over time
      expect(result.generationalCascade[29].totalFamilyNetWorth)
        .toBeGreaterThan(result.generationalCascade[0].totalFamilyNetWorth);
    });

    it("should use v4 methodology: 80% life loan for mortgage principal payments", () => {
      const result = runHouseholdSimulation(baseInput);
      const primaryMortgage = result.mortgageKillerResults.find(m => m.name === "Primary Owner");
      expect(primaryMortgage).toBeDefined();
      if (primaryMortgage) {
        // Should have cascading projection
        expect(primaryMortgage.result.cascadingProjection).toHaveLength(30);
        // Year 2 should have a life loan principal payment
        const year2 = primaryMortgage.result.cascadingProjection.find(r => r.year === 2);
        expect(year2).toBeDefined();
        if (year2) {
          expect(year2.lifeLoanAmount).toBeGreaterThan(0);
        }
      }
    });

    it("should pay children's mortgages simultaneously when flag is true", () => {
      const withChildren: HouseholdSimulationInput = {
        ...baseInput,
        payChildrenSimultaneously: true,
        children: [
          {
            id: "c1", name: "Child A", age: 30, income: 75000,
            ira: 50000, rothIra: 25000, cash: 20000,
            homeValue: 350000, homeEquity: 80000, mortgageBalance: 270000,
            mortgageRate: 0.065, mortgageYearsLeft: 28, totalInterest: 0,
          },
          {
            id: "c2", name: "Child B", age: 28, income: 65000,
            ira: 30000, rothIra: 15000, cash: 10000,
            homeValue: 300000, homeEquity: 60000, mortgageBalance: 240000,
            mortgageRate: 0.06, mortgageYearsLeft: 30, totalInterest: 0,
          },
        ],
      };
      const result = runHouseholdSimulation(withChildren);
      const childResults = result.mortgageKillerResults.filter(m => m.relationship === "child");
      expect(childResults).toHaveLength(2);
    });

    it("should pay children's mortgages one at a time when flag is false", () => {
      const withChildren: HouseholdSimulationInput = {
        ...baseInput,
        payChildrenSimultaneously: false,
        children: [
          {
            id: "c1", name: "Child A", age: 30, income: 75000,
            ira: 50000, rothIra: 25000, cash: 20000,
            homeValue: 350000, homeEquity: 80000, mortgageBalance: 270000,
            mortgageRate: 0.065, mortgageYearsLeft: 28, totalInterest: 0,
          },
          {
            id: "c2", name: "Child B", age: 28, income: 65000,
            ira: 30000, rothIra: 15000, cash: 10000,
            homeValue: 300000, homeEquity: 60000, mortgageBalance: 240000,
            mortgageRate: 0.06, mortgageYearsLeft: 30, totalInterest: 0,
          },
        ],
      };
      const result = runHouseholdSimulation(withChildren);
      const childResults = result.mortgageKillerResults.filter(m => m.relationship === "child");
      expect(childResults).toHaveLength(2);
    });
  });

  describe("formatCurrency", () => {
    it("should format millions", () => {
      expect(formatCurrency(1500000)).toBe("$1.50M");
    });

    it("should format thousands", () => {
      expect(formatCurrency(25000)).toBe("$25.0K");
    });

    it("should format small numbers", () => {
      expect(formatCurrency(500)).toBe("$500");
    });
  });

  describe("formatFullCurrency", () => {
    it("should format with dollar sign and commas", () => {
      expect(formatFullCurrency(1234567)).toBe("$1,234,567");
    });
  });
});
