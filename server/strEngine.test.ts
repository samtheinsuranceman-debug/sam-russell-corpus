import { describe, expect, it } from "vitest";
import { STR_DEFAULTS, loanSchedule, runStr } from "@shared/strEngine";
import { amortisation } from "@shared/zipEngine";

describe("loan schedule", () => {
  it("splits each year into interest and principal and ends at zero", () => {
    const s = loanSchedule(400_000, 6, 30, 30);
    expect(s).toHaveLength(30);
    const { monthlyPayment } = amortisation(400_000, 6, 30);
    expect(s[0]!.interest + s[0]!.principal).toBeCloseTo(monthlyPayment * 12, 4);
    expect(s[0]!.interest).toBeGreaterThan(s[0]!.principal); // early years are mostly interest
    expect(s[29]!.balance).toBeCloseTo(0, 2);
    expect(s.reduce((a, y) => a + y.principal, 0)).toBeCloseTo(400_000, 2);
  });
});

describe("the short-term rental pro-forma", () => {
  it("computes gross from nights × rate, operating costs, NOI, debt service, tax and equity year by year", () => {
    const r = runStr({ ...STR_DEFAULTS, years: 3 });
    expect(r.loan).toBe(400_000);
    expect(r.cashInvested).toBe(100_000 + 15_000 + 25_000);
    const y1 = r.years[0]!;
    expect(y1.nightsBooked).toBeCloseTo(219, 6);
    expect(y1.grossRevenue).toBeCloseTo(219 * 250, 4);
    const value1 = 500_000 * 1.035;
    const expectedOperating = y1.grossRevenue * 0.03 + (219 / 3) * 150 + 4_800 + 3_000 + value1 * 0.02;
    expect(y1.operating).toBeCloseTo(expectedOperating, 4);
    expect(y1.noi).toBeCloseTo(y1.grossRevenue - expectedOperating, 4);
    expect(y1.cashFlow).toBeCloseTo(y1.noi - y1.debtService, 6);
    expect(y1.depreciation).toBeCloseTo((400_000 + 25_000) / 27.5, 6);
    expect(y1.taxableIncome).toBeCloseTo(y1.noi - y1.interest - y1.depreciation, 6);
    expect(y1.equity).toBeCloseTo(value1 - y1.loanBalance, 6);
    expect(r.years[2]!.value).toBeCloseTo(500_000 * Math.pow(1.035, 3), 4);
    expect(r.years[2]!.grossRevenue).toBeCloseTo(219 * 250 * Math.pow(1.03, 2), 4);
    expect(r.capRateYear1).toBeCloseTo(y1.noi / 500_000, 10);
    expect(r.cashOnCashYear1).toBeCloseTo(y1.cashFlow / r.cashInvested, 10);
  });
  it("a paper loss shelters other income at the marginal rate (the STR rule the tax page explains)", () => {
    const r = runStr({ ...STR_DEFAULTS, nightlyRate: 120, occupancyPct: 45, years: 1 });
    const y = r.years[0]!;
    expect(y.taxableIncome).toBeLessThan(0);
    expect(y.taxEffect).toBeLessThan(0);
    expect(y.afterTaxCashFlow).toBeGreaterThan(y.cashFlow);
  });
  it("reports the equity multiple and annualised return on the cash actually invested", () => {
    const r = runStr({ ...STR_DEFAULTS, years: 10 });
    const last = r.years[9]!;
    expect(r.equityMultiple).toBeCloseTo((last.equity + last.cumulativeCash) / r.cashInvested, 10);
    expect(r.annualisedReturn).not.toBeNull();
    expect(runStr({ ...STR_DEFAULTS, downPct: 100, purchasePrice: 0, furnishing: 0, closingPct: 0 }).annualisedReturn).toBeNull();
  });
});
