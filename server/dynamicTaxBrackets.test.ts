import { describe, it, expect } from "vitest";
import {
  runDynamicTaxProjection,
  generateOGSchedulesFromMYGA,
  type DynamicTaxProjectionInput,
  type OGDeductionSchedule,
} from "../shared/taxBracketEngine";

describe("Dynamic Tax Bracket Projection Engine", () => {
  const baseInput: DynamicTaxProjectionInput = {
    baseIncome: 300_000,
    incomeGrowthRate: 0.03,
    filingStatus: "joint",
    stateCode: "TX",
    years: 20,
    incomeEvents: [],
    ogSchedules: [],
    annualItemizedDeductions: 30_000,
    deductionMethod: "auto",
    bracketInflationRate: 0.025,
  };

  it("should produce 20 years of projections", () => {
    const result = runDynamicTaxProjection(baseInput);
    expect(result.years).toHaveLength(20);
    expect(result.summary).toBeDefined();
    expect(result.summary.totalTaxPaid).toBeGreaterThan(0);
    expect(result.summary.totalIncomeEarned).toBeGreaterThan(0);
  });

  it("should show income growing each year", () => {
    const result = runDynamicTaxProjection(baseInput);
    for (let i = 1; i < result.years.length; i++) {
      expect(result.years[i].grossIncome).toBeGreaterThan(result.years[i - 1].grossIncome);
    }
  });

  it("should calculate after-tax income correctly", () => {
    const result = runDynamicTaxProjection(baseInput);
    for (const yr of result.years) {
      expect(yr.afterTaxIncome).toBeCloseTo(yr.grossIncome - yr.totalTax, -1);
    }
  });

  it("should have cumulative tax savings that increase monotonically", () => {
    const result = runDynamicTaxProjection(baseInput);
    for (let i = 1; i < result.years.length; i++) {
      expect(result.years[i].cumulativeTaxSavings).toBeGreaterThanOrEqual(
        result.years[i - 1].cumulativeTaxSavings
      );
    }
  });

  it("should show effective rate below marginal rate", () => {
    const result = runDynamicTaxProjection(baseInput);
    for (const yr of result.years) {
      expect(yr.totalEffectiveRate).toBeLessThanOrEqual(yr.federalMarginalRate + 0.15); // state can add
      expect(yr.totalEffectiveRate).toBeGreaterThan(0);
    }
  });

  describe("O&G Deduction Integration", () => {
    it("should reduce taxable income with O&G deductions", () => {
      const ogSchedules: OGDeductionSchedule[] = [
        {
          label: "O&G Tranche 1",
          startYear: 1,
          investmentAmount: 200_000,
          y1DepreciationPct: 80,
          ongoingDepreciationPct: 8,
          term: 12,
        },
      ];

      const withOG = runDynamicTaxProjection({ ...baseInput, ogSchedules });
      const withoutOG = runDynamicTaxProjection(baseInput);

      // Year 1 should have big O&G deduction (80% of 200K = 160K)
      expect(withOG.years[0].ogDeductions).toBe(160_000);
      // Taxable income should be lower with O&G
      expect(withOG.years[0].taxableIncome).toBeLessThan(withoutOG.years[0].taxableIncome);
      // Total tax saved should be positive
      expect(withOG.summary.totalTaxSaved).toBeGreaterThan(withoutOG.summary.totalTaxSaved);
    });

    it("should apply year 1 depreciation at 80% and ongoing at 8%", () => {
      const ogSchedules: OGDeductionSchedule[] = [
        {
          label: "O&G Tranche 1",
          startYear: 1,
          investmentAmount: 100_000,
          y1DepreciationPct: 80,
          ongoingDepreciationPct: 8,
          term: 12,
        },
      ];

      const result = runDynamicTaxProjection({ ...baseInput, ogSchedules });
      expect(result.years[0].ogDeductions).toBe(80_000); // 80% of 100K
      expect(result.years[1].ogDeductions).toBe(8_000);  // 8% of 100K
    });

    it("should handle multiple O&G tranches starting in different years", () => {
      const ogSchedules: OGDeductionSchedule[] = [
        {
          label: "Tranche 1",
          startYear: 1,
          investmentAmount: 100_000,
          y1DepreciationPct: 80,
          ongoingDepreciationPct: 8,
          term: 5,
        },
        {
          label: "Tranche 2",
          startYear: 6,
          investmentAmount: 150_000,
          y1DepreciationPct: 80,
          ongoingDepreciationPct: 8,
          term: 5,
        },
      ];

      const result = runDynamicTaxProjection({ ...baseInput, ogSchedules });
      // Year 1: only tranche 1 (80K)
      expect(result.years[0].ogDeductions).toBe(80_000);
      // Year 6: tranche 2 starts (80% of 150K = 120K), tranche 1 ended
      expect(result.years[5].ogDeductions).toBe(120_000);
      // Year 7: tranche 2 ongoing (8% of 150K = 12K)
      expect(result.years[6].ogDeductions).toBe(12_000);
    });

    it("should continuously reduce brackets when O&G deductions are active", () => {
      const ogSchedules: OGDeductionSchedule[] = [
        {
          label: "Large O&G",
          startYear: 1,
          investmentAmount: 500_000,
          y1DepreciationPct: 80,
          ongoingDepreciationPct: 15,
          term: 12,
        },
      ];

      const withOG = runDynamicTaxProjection({ ...baseInput, ogSchedules });
      const withoutOG = runDynamicTaxProjection(baseInput);

      // With large O&G deductions, marginal rate should be lower in year 1
      expect(withOG.years[0].federalMarginalRate).toBeLessThanOrEqual(
        withoutOG.years[0].federalMarginalRate
      );
    });
  });

  describe("Income Events", () => {
    it("should add income events to gross income", () => {
      const input: DynamicTaxProjectionInput = {
        ...baseInput,
        incomeEvents: [
          {
            year: 5,
            amount: 100_000,
            label: "Bonus",
            category: "bonus",
            recurring: false,
          },
        ],
      };

      const result = runDynamicTaxProjection(input);
      const baseResult = runDynamicTaxProjection(baseInput);

      // Year 5 should have higher income
      expect(result.years[4].grossIncome).toBeGreaterThan(baseResult.years[4].grossIncome);
      // Year 4 should be the same
      expect(result.years[3].grossIncome).toBe(baseResult.years[3].grossIncome);
    });

    it("should handle recurring income events with growth", () => {
      const input: DynamicTaxProjectionInput = {
        ...baseInput,
        incomeEvents: [
          {
            year: 1,
            amount: 50_000,
            label: "Rental Income",
            category: "rental",
            recurring: true,
            growthRate: 0.03,
          },
        ],
      };

      const result = runDynamicTaxProjection(input);
      // Year 1 income should include the 50K rental
      expect(result.years[0].grossIncome).toBe(baseInput.baseIncome + 50_000);
      // Year 2 rental should have grown by 3%
      const expectedY2Rental = 50_000 * 1.03;
      const expectedY2Base = baseInput.baseIncome * 1.03;
      expect(result.years[1].grossIncome).toBeCloseTo(expectedY2Base + expectedY2Rental, -1);
    });
  });

  describe("Bracket Inflation", () => {
    it("should inflate brackets over time", () => {
      const result = runDynamicTaxProjection(baseInput);
      // With 2.5% bracket inflation and 3% income growth, brackets widen
      // The effective rate should not skyrocket even as income grows
      const y1Rate = result.years[0].totalEffectiveRate;
      const y20Rate = result.years[19].totalEffectiveRate;
      // Rate should not increase dramatically (bracket creep is mitigated)
      expect(y20Rate - y1Rate).toBeLessThan(0.10); // less than 10% increase
    });
  });

  describe("Filing Status Variations", () => {
    it("should calculate different taxes for single vs married", () => {
      const single = runDynamicTaxProjection({ ...baseInput, filingStatus: "single" });
      const married = runDynamicTaxProjection({ ...baseInput, filingStatus: "joint" });

      // Single filer should pay more tax on same income
      expect(single.summary.totalTaxPaid).toBeGreaterThan(married.summary.totalTaxPaid);
    });
  });

  describe("State Tax Integration", () => {
    it("should include state tax for high-tax states", () => {
      const tx = runDynamicTaxProjection({ ...baseInput, stateCode: "TX" }); // 0%
      const ca = runDynamicTaxProjection({ ...baseInput, stateCode: "CA" }); // ~13.3%

      expect(ca.summary.totalTaxPaid).toBeGreaterThan(tx.summary.totalTaxPaid);
    });
  });

  describe("Summary Statistics", () => {
    it("should calculate correct summary totals", () => {
      const result = runDynamicTaxProjection(baseInput);

      const manualTotalTax = result.years.reduce((s, y) => s + y.totalTax, 0);
      expect(result.summary.totalTaxPaid).toBe(manualTotalTax);

      const manualTotalIncome = result.years.reduce((s, y) => s + y.grossIncome, 0);
      expect(result.summary.totalIncomeEarned).toBe(manualTotalIncome);

      expect(result.summary.averageEffectiveRate).toBeCloseTo(
        manualTotalTax / manualTotalIncome,
        4
      );
    });

    it("should track bracket trajectory", () => {
      const result = runDynamicTaxProjection(baseInput);
      expect(result.summary.bracketTrajectory).toHaveLength(20);
      for (const pt of result.summary.bracketTrajectory) {
        expect(pt.rate).toBeGreaterThan(0);
        expect(pt.rate).toBeLessThanOrEqual(0.37);
      }
    });
  });
});

describe("generateOGSchedulesFromMYGA", () => {
  it("should generate correct number of O&G schedules from MYGA cycles", () => {
    const schedules = generateOGSchedulesFromMYGA(4, 5, 200_000);
    expect(schedules).toHaveLength(4);
    expect(schedules[0].startYear).toBe(1);
    expect(schedules[1].startYear).toBe(6);
    expect(schedules[2].startYear).toBe(11);
    expect(schedules[3].startYear).toBe(16);
  });

  it("should set correct investment amounts and depreciation rates", () => {
    const schedules = generateOGSchedulesFromMYGA(2, 5, 150_000, 85, 10, 10);
    expect(schedules[0].investmentAmount).toBe(150_000);
    expect(schedules[0].y1DepreciationPct).toBe(85);
    expect(schedules[0].ongoingDepreciationPct).toBe(10);
    expect(schedules[0].term).toBe(10);
  });
});
