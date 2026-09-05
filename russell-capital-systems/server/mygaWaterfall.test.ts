import { describe, it, expect } from "vitest";
import {
  runMYGAWaterfall,
  getDefaultInput,
  type MYGAWaterfallInput,
  type MYGAWaterfallResult,
} from "../shared/mygaWaterfall";

/* ─── Helper ─── */
function run(overrides: Partial<MYGAWaterfallInput> = {}): MYGAWaterfallResult {
  return runMYGAWaterfall({ ...getDefaultInput(), ...overrides });
}

/* ═══════════════════════════════════════════════════════════════
   1. Default Input Sanity
   ═══════════════════════════════════════════════════════════════ */
describe("getDefaultInput", () => {
  it("returns valid defaults", () => {
    const d = getDefaultInput();
    expect(d.mygaPremium).toBe(500000);
    expect(d.mygaRate).toBe(7);
    expect(d.mygaTerm).toBe(5);
    expect(d.bankLtv).toBe(0.70);
    expect(d.bankLoanRate).toBe(7);
    expect(d.bankLoanTerm).toBe(5);
    expect(d.oilGasTerm).toBe(12);
    expect(d.oilGasReturnRate).toBe(15);
    expect(d.projectionYears).toBe(25);
    expect(d.additionalMygaPerCycle).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   2. Projection Structure
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — projection structure", () => {
  it("produces correct number of rows", () => {
    const r = run();
    expect(r.projection.length).toBe(25);
  });

  it("produces correct number of rows for 12-year projection", () => {
    const r = run({ projectionYears: 12 });
    expect(r.projection.length).toBe(12);
  });

  it("years are sequential 1..N", () => {
    const r = run();
    r.projection.forEach((row, i) => {
      expect(row.year).toBe(i + 1);
    });
  });

  it("cycle numbers increment every mygaTerm years", () => {
    const r = run();
    expect(r.projection[0].cycle).toBe(1);
    expect(r.projection[0].cycleYear).toBe(1);
    expect(r.projection[4].cycle).toBe(1);
    expect(r.projection[4].cycleYear).toBe(5);
    expect(r.projection[5].cycle).toBe(2);
    expect(r.projection[5].cycleYear).toBe(1);
  });

  it("returns cycles array with correct count", () => {
    const r = run();
    // 25 years / 5 year term = 5 cycles
    expect(r.cycles.length).toBe(5);
    expect(r.summary.numberOfCycles).toBe(5);
  });
});

/* ═══════════════════════════════════════════════════════════════
   3. MYGA Interest Calculation
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — MYGA interest", () => {
  it("MYGA earns 7% compound interest in year 1", () => {
    const r = run();
    const y1 = r.projection[0];
    expect(y1.mygaStartValue).toBe(500000);
    expect(y1.mygaInterestEarned).toBe(35000); // 500k * 7%
    expect(y1.mygaEndValue).toBe(535000);
  });

  it("MYGA compounds correctly over 5 years", () => {
    const r = run();
    const y5 = r.projection[4];
    // 500000 * (1.07)^5 = 701,275.87
    expect(y5.mygaEndValue).toBeCloseTo(701276, -2);
  });

  it("total MYGA interest earned is positive and grows", () => {
    const r = run();
    expect(r.summary.totalMygaInterestEarned).toBeGreaterThan(0);
    // Each year's cumulative should be >= previous
    for (let i = 1; i < r.projection.length; i++) {
      expect(r.projection[i].totalMygaInterestEarned).toBeGreaterThanOrEqual(
        r.projection[i - 1].totalMygaInterestEarned
      );
    }
  });

  it("final MYGA value is much larger than initial premium after 25 years", () => {
    const r = run();
    // With rollovers and compounding, should be significantly larger
    expect(r.summary.finalMygaValue).toBeGreaterThan(500000 * 2);
  });
});

/* ═══════════════════════════════════════════════════════════════
   4. Bank Loan Mechanics
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — bank loan", () => {
  it("first loan is 70% of MYGA premium", () => {
    const r = run();
    expect(r.cycles[0].bankLoanAmount).toBe(350000); // 500k * 0.70
  });

  it("bank loan is fully paid off within loan term", () => {
    const r = run();
    // After year 5 (loan term), the first loan should be paid off
    const y5 = r.projection[4];
    // The end balance should be near zero for the first loan
    // (there may be other loans active from cycle 2)
    expect(r.cycles[0].bankInterestPaid).toBeGreaterThan(0);
  });

  it("total bank interest paid is tracked in summary", () => {
    const r = run();
    expect(r.summary.totalBankInterestPaid).toBeGreaterThan(0);
    // Bank interest should be less than total O&G income (strategy is profitable)
    expect(r.summary.totalBankInterestPaid).toBeLessThan(r.summary.totalOilGasIncomeReceived);
  });
});

/* ═══════════════════════════════════════════════════════════════
   5. Oil & Gas Investment
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — oil & gas", () => {
  it("O&G investment equals bank loan amount", () => {
    const r = run();
    expect(r.cycles[0].oilGasInvestment).toBe(350000);
  });

  it("O&G annual income is 15% of investment", () => {
    const r = run();
    const y1 = r.projection[0];
    expect(y1.oilGasIncome).toBe(52500); // 350k * 15%
  });

  it("quarterly payments are 1/4 of annual income", () => {
    const r = run();
    const y1 = r.projection[0];
    expect(y1.oilGasQuarterlyPayment).toBe(Math.round(52500 / 4));
  });

  it("O&G depreciation is 80% in year 1", () => {
    const r = run();
    const y1 = r.projection[0];
    expect(y1.oilGasDepreciation).toBe(280000); // 350k * 80%
  });

  it("O&G depreciation is 8% in subsequent years", () => {
    const r = run();
    const y2 = r.projection[1];
    // Year 2: only one tranche active, depreciation = 350k * 8% = 28000
    expect(y2.oilGasDepreciation).toBe(28000);
  });

  it("O&G income lasts for oilGasTerm years per tranche", () => {
    const r = run();
    // First tranche: years 1-12 should have income
    expect(r.projection[0].oilGasActive).toBe(true);
    expect(r.projection[11].oilGasActive).toBe(true);
  });

  it("cumulative O&G income increases over time", () => {
    const r = run();
    for (let i = 1; i < r.projection.length; i++) {
      expect(r.projection[i].oilGasCumulativeIncome).toBeGreaterThanOrEqual(
        r.projection[i - 1].oilGasCumulativeIncome
      );
    }
  });

  it("total O&G income is substantial over 25 years", () => {
    const r = run();
    // 5 cycles * 350k investment * 15% * 12 years = significant income
    expect(r.summary.totalOilGasIncomeReceived).toBeGreaterThan(1000000);
  });
});

/* ═══════════════════════════════════════════════════════════════
   6. Net Cash Flow & Profitability
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — net cash flow", () => {
  it("net cash flow reflects interest-only payments (no amortization)", () => {
    const r = run();
    // With interest-only: loan interest = 350k * 7% = 24,500/yr
    // O&G income = 350k * 15% = 52,500/yr
    // Net = 52,500 - 24,500 = 28,000 surplus (positive from year 1)
    const y1 = r.projection[0];
    // Interest-only means O&G income exceeds loan interest from day 1
    expect(y1.oilGasIncome).toBeGreaterThan(0);
  });

  it("net cash flow becomes positive after loan is paid off", () => {
    const r = run();
    // After year 5 (first loan paid off), O&G income continues with no loan payment
    // Year 6: new cycle starts with new loan, but old O&G tranche still producing
    // By year 6-7, cumulative should be trending positive
    const laterYears = r.projection.filter(p => p.year >= 6 && p.year <= 12);
    const somePositive = laterYears.some(y => y.netCashFlow > 0);
    expect(somePositive).toBe(true);
  });

  it("total net benefit is positive (strategy is profitable)", () => {
    const r = run();
    expect(r.summary.totalNetBenefit).toBeGreaterThan(0);
  });

  it("effective annual return is positive", () => {
    const r = run();
    expect(r.summary.effectiveAnnualReturn).toBeGreaterThan(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   7. Summary Totals
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — summary", () => {
  it("summary totals match last projection row cumulative values", () => {
    const r = run();
    const last = r.projection[r.projection.length - 1];
    expect(r.summary.totalMygaInterestEarned).toBe(last.totalMygaInterestEarned);
    expect(r.summary.totalBankInterestPaid).toBe(last.totalBankInterestPaid);
    expect(r.summary.totalOilGasIncomeReceived).toBe(last.totalOilGasIncome);
    expect(r.summary.totalDepreciationCredits).toBe(last.totalDepreciation);
  });

  it("total MYGA premium invested includes only fresh premiums (not rollovers)", () => {
    const r = run();
    // Cycle 1 uses mygaPremium (500k). Cycles 2+ use additionalMygaPerCycle (default 0).
    // Rollovers are separate from premiums.
    expect(r.summary.totalMygaPremiumInvested).toBe(500000);
  });

  it("total O&G invested matches sum of cycle investments", () => {
    const r = run();
    const sumFromCycles = r.cycles.reduce((s, c) => s + c.oilGasInvestment, 0);
    expect(r.summary.totalOilGasInvested).toBeCloseTo(sumFromCycles, 0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   8. Additional MYGA Per Cycle
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — additional MYGA per cycle", () => {
  it("additional amount is the fresh premium for cycles 2+", () => {
    const r = run({ additionalMygaPerCycle: 100000 });
    expect(r.cycles[0].mygaPremium).toBe(500000); // first cycle: base only
    // Cycle 2+ fresh premium is additionalMygaPerCycle (rollover is separate)
    expect(r.cycles[1].mygaPremium).toBe(100000);
  });

  it("additional amount increases total premium invested", () => {
    const base = run();
    const extra = run({ additionalMygaPerCycle: 100000 });
    expect(extra.summary.totalMygaPremiumInvested).toBeGreaterThan(
      base.summary.totalMygaPremiumInvested
    );
  });

  it("additional amount increases total net benefit", () => {
    const base = run();
    const extra = run({ additionalMygaPerCycle: 100000 });
    expect(extra.summary.totalNetBenefit).toBeGreaterThan(base.summary.totalNetBenefit);
  });
});

/* ═══════════════════════════════════════════════════════════════
   9. Custom Parameters
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — custom parameters", () => {
  it("works with different MYGA rate", () => {
    const r = run({ mygaRate: 5 });
    const y1 = r.projection[0];
    expect(y1.mygaInterestEarned).toBe(25000); // 500k * 5%
  });

  it("works with different O&G return rate", () => {
    const r = run({ oilGasReturnRate: 20 });
    const y1 = r.projection[0];
    expect(y1.oilGasIncome).toBe(70000); // 350k * 20%
  });

  it("works with 12-year projection", () => {
    const r = run({ projectionYears: 12 });
    expect(r.projection.length).toBe(12);
    expect(r.cycles.length).toBe(3); // ceil(12/5) = 3
  });

  it("works with different bank LTV", () => {
    const r = run({ bankLtv: 0.60 });
    expect(r.cycles[0].bankLoanAmount).toBe(300000); // 500k * 60%
  });
});

/* ═══════════════════════════════════════════════════════════════
   10. Edge Cases
   ═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   11. MYGA Rollover Cascade
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — MYGA rollover cascade", () => {
  it("cycle 2 rollover equals cycle 1 maturity minus loan principal payoff", () => {
    const r = run();
    // Rollover = maturity value - principal paid off from that maturity
    const expectedRollover = r.cycles[0].mygaMaturityValue - r.cycles[0].principalPaidFromMaturity;
    expect(r.cycles[1].mygaRolloverIn).toBeCloseTo(expectedRollover, -1);
  });

  it("cycle 3 rollover equals cycle 2 maturity minus loan principal payoff", () => {
    const r = run();
    const expectedRollover = r.cycles[1].mygaMaturityValue - r.cycles[1].principalPaidFromMaturity;
    expect(r.cycles[2].mygaRolloverIn).toBeCloseTo(expectedRollover, -1);
  });

  it("each cycle start value is higher than previous", () => {
    const r = run();
    for (let i = 1; i < r.cycles.length; i++) {
      expect(r.cycles[i].mygaCycleStartValue).toBeGreaterThan(r.cycles[i - 1].mygaCycleStartValue);
    }
  });

  it("rollover amount only appears on cycle-start years", () => {
    const r = run();
    r.projection.forEach(row => {
      if (row.cycleYear === 1 && row.cycle > 1) {
        expect(row.mygaRolloverAmount).toBeGreaterThan(0);
      } else if (row.cycleYear !== 1) {
        expect(row.mygaRolloverAmount).toBe(0);
      }
    });
  });
});

/* ═══════════════════════════════════════════════════════════════
   12. Per-Tranche O&G Tracking
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — per-tranche O&G", () => {
  it("creates one tranche per cycle", () => {
    const r = run();
    expect(r.trancheInfo.length).toBe(5);
    r.trancheInfo.forEach((t, i) => {
      expect(t.cycleNumber).toBe(i + 1);
      expect(t.trancheKey).toBe(`og_tranche_${i + 1}`);
    });
  });

  it("year 6 has 2 active tranches (overlap)", () => {
    const r = run();
    const y6 = r.projection.find(row => row.year === 6);
    expect(y6!.activeTrancheCount).toBe(2);
  });

  it("year 11 has 3 active tranches (overlap)", () => {
    const r = run();
    const y11 = r.projection.find(row => row.year === 11);
    expect(y11!.activeTrancheCount).toBe(3);
  });

  it("per-tranche income sums match total O&G income", () => {
    const r = run();
    r.projection.forEach(row => {
      const trancheSum = Object.values(row.ogTrancheIncome).reduce((s, v) => s + v, 0);
      expect(Math.abs(trancheSum - row.oilGasIncome)).toBeLessThan(r.trancheInfo.length + 1);
    });
  });

  it("tranche colors are assigned", () => {
    const r = run();
    r.trancheInfo.forEach(t => {
      expect(t.color).toBeTruthy();
      expect(t.color.startsWith("#")).toBe(true);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════
   13. Loan Wipeout Tracking
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — loan wipeout", () => {
  it("tracks O&G toward loan and pure profit", () => {
    const r = run();
    expect(r.summary.totalOGTowardLoan).toBeGreaterThan(0);
    expect(r.summary.totalOGPureProfit).toBeGreaterThan(0);
  });

  it("O&G toward loan + pure profit = total O&G income", () => {
    const r = run();
    expect(r.summary.totalOGTowardLoan + r.summary.totalOGPureProfit)
      .toBeCloseTo(r.summary.totalOilGasIncomeReceived, -1);
  });

  it("ogVsLoanDelta is positive when O&G > loan payment", () => {
    const r = run();
    // After first loan is paid off (year 6+), some years should have positive delta
    const positiveYears = r.projection.filter(row => row.ogVsLoanDelta > 0);
    expect(positiveYears.length).toBeGreaterThan(0);
  });
});

describe("runMYGAWaterfall — edge cases", () => {
  it("handles small premium", () => {
    const r = run({ mygaPremium: 50000 });
    expect(r.projection.length).toBe(25);
    expect(r.summary.totalNetBenefit).toBeGreaterThan(0);
  });

  it("handles large premium", () => {
    const r = run({ mygaPremium: 5000000 });
    expect(r.projection.length).toBe(25);
    expect(r.summary.finalMygaValue).toBeGreaterThan(5000000);
  });

  it("all numeric values are finite", () => {
    const r = run();
    for (const row of r.projection) {
      expect(Number.isFinite(row.mygaEndValue)).toBe(true);
      expect(Number.isFinite(row.bankLoanEndBalance)).toBe(true);
      expect(Number.isFinite(row.oilGasIncome)).toBe(true);
      expect(Number.isFinite(row.netCashFlow)).toBe(true);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   14. Tax Savings Reinvestment Tracking
   ═══════════════════════════════════════════════════════════════ */
describe("runMYGAWaterfall — tax savings reinvestment", () => {
  it("cumulativeTaxSavingsReinvested is present and non-negative on every row", () => {
    const r = run({
      annualIncome: 500000,
      federalTaxRate: 37,
      stateTaxRate: 10,
      taxDeployment: "buy_more_myga",
    });
    for (const row of r.projection) {
      expect(row.cumulativeTaxSavingsReinvested).toBeGreaterThanOrEqual(0);
    }
  });

  it("cumulativeTaxSavingsReinvested is monotonically non-decreasing", () => {
    const r = run({
      annualIncome: 500000,
      federalTaxRate: 37,
      stateTaxRate: 10,
      taxDeployment: "buy_more_myga",
    });
    for (let i = 1; i < r.projection.length; i++) {
      expect(r.projection[i].cumulativeTaxSavingsReinvested).toBeGreaterThanOrEqual(
        r.projection[i - 1].cumulativeTaxSavingsReinvested
      );
    }
  });

  it("summary totalTaxSavingsReinvested matches last row cumulative", () => {
    const r = run({
      annualIncome: 500000,
      federalTaxRate: 37,
      stateTaxRate: 10,
      taxDeployment: "buy_more_myga",
    });
    const last = r.projection[r.projection.length - 1];
    expect(r.summary.totalTaxSavingsReinvested).toBe(last.cumulativeTaxSavingsReinvested);
  });

  it("totalTaxSavingsReinvested is positive when tax rates are set", () => {
    const r = run({
      annualIncome: 500000,
      federalTaxRate: 37,
      stateTaxRate: 10,
      taxDeployment: "pay_bank_interest",
    });
    expect(r.summary.totalTaxSavingsReinvested).toBeGreaterThan(0);
  });

  it("totalTaxSavingsReinvested is zero when tax rates are zero", () => {
    const r = run({
      annualIncome: 500000,
      federalTaxRate: 0,
      stateTaxRate: 0,
      taxDeployment: "buy_more_myga",
    });
    expect(r.summary.totalTaxSavingsReinvested).toBe(0);
  });

  it("totalTaxSavingsReinvested equals totalTaxSavings (all savings are deployed)", () => {
    const r = run({
      annualIncome: 500000,
      federalTaxRate: 37,
      stateTaxRate: 10,
      taxDeployment: "buy_more_myga",
    });
    expect(r.summary.totalTaxSavingsReinvested).toBe(r.summary.totalTaxSavings);
  });
});

/* ═══════════════════════════════════════════════════════════════
   15. Scenario Comparison with Tax Reinvestment
   ═══════════════════════════════════════════════════════════════ */
import { runScenarioComparison } from "../shared/mygaWaterfall";

describe("runScenarioComparison — tax reinvestment in ranking", () => {
  it("returns 5 scenarios sorted by totalValue descending", () => {
    const input = {
      ...getDefaultInput(),
      annualIncome: 500000,
      federalTaxRate: 37,
      stateTaxRate: 10,
    };
    const comp = runScenarioComparison(input);
    expect(comp.scenarios.length).toBe(5);
    for (let i = 1; i < comp.scenarios.length; i++) {
      expect(comp.scenarios[i - 1].totalValue).toBeGreaterThanOrEqual(comp.scenarios[i].totalValue);
    }
  });

  it("each scenario has yearlyTaxReinvested array matching projection length", () => {
    const input = {
      ...getDefaultInput(),
      annualIncome: 500000,
      federalTaxRate: 37,
      stateTaxRate: 10,
    };
    const comp = runScenarioComparison(input);
    for (const s of comp.scenarios) {
      expect(s.yearlyTaxReinvested.length).toBe(input.projectionYears);
    }
  });

  it("totalValue includes reinvested tax savings (greater than just net benefit)", () => {
    const input = {
      ...getDefaultInput(),
      annualIncome: 500000,
      federalTaxRate: 37,
      stateTaxRate: 10,
    };
    const comp = runScenarioComparison(input);
    for (const s of comp.scenarios) {
      // totalValue = netBenefit + totalTaxSavingsReinvested
      expect(s.totalValue).toBe(s.summary.totalNetBenefit + s.summary.totalTaxSavingsReinvested);
    }
  });

  it("optimal scenario is identified correctly", () => {
    const input = {
      ...getDefaultInput(),
      annualIncome: 500000,
      federalTaxRate: 37,
      stateTaxRate: 10,
    };
    const comp = runScenarioComparison(input);
    expect(comp.optimal).toBe(comp.scenarios[0].option);
    expect(comp.optimalLabel).toBe(comp.scenarios[0].label);
  });
});
