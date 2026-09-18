// Ultra Calculator engine contracts: window chaining, the mortgage-killer
// recycle cycle, STR income, IUL income + chronic-illness access, equity
// deployment, and the honesty disclosure.
import { describe, expect, it } from "vitest";
import { defaultModules, runUltraScenario, type ClientProfile } from "@shared/ultraEngine";
import { ruleBasedPlan as ruleBasedFacts } from "./ultraAI";

describe("ultra engine", () => {
  const baseProfile = (): ClientProfile => ({
    clientAge: 45,
    spouseAge: 45,
    incomeSelfAnnual: 150000,
    incomeSpouseAnnual: 90000,
    otherIncomeAnnual: 0,
    incomeGrowthPct: 3,
    baseHouseholdExpensesAnnual: 80000,
    expenseChanges: [{ atYear: 10, newAnnualExpenses: 70000 }],
    effectiveTaxRatePct: 24,
    taxableAssets: 100000,
    qualifiedAssets: 300000,
    cashReserves: 50000,
    home: { value: 400000, mortgageBalance: 200000, mortgageRatePct: 6, mortgagePaymentAnnual: 24000 },
    otherDebts: [{ name: "Student", balance: 40000, ratePct: 5, paymentAnnual: 6000 }],
  });

  it("chains windows: window N+1 starts exactly where window N ended", () => {
    const m = defaultModules();
    const res = runUltraScenario(baseProfile(), m, [
      { years: 10, goal: "first" },
      { years: 10, goal: "second" },
    ]);
    expect(res.windows.length).toBe(2);
    const lastOfW1 = res.windows[0].rows[res.windows[0].rows.length - 1];
    const firstOfW2 = res.windows[1].rows[0];
    expect(firstOfW2.year).toBe(lastOfW1.year + 1);
    // Continuity: net worth doesn't teleport between windows (bounded change).
    expect(Math.abs(firstOfW2.netWorth - lastOfW1.netWorth) / Math.max(1, lastOfW1.netWorth)).toBeLessThan(0.5);
  });

  it("mortgage-killer cycles add paid-off properties roughly every cycleYears", () => {
    const m = defaultModules();
    m.mortgageKiller.enabled = true;
    m.mortgageKiller.cycleYears = 6;
    m.realEstate.enabled = true;
    const res = runUltraScenario(baseProfile(), m, [{ years: 24, goal: "recycle" }]);
    expect(res.final.propertiesOwned).toBeGreaterThanOrEqual(2);
    expect(res.moduleNotes.some((n) => n.includes("cycle 1 complete"))).toBe(true);
  });

  it("STR gross receipts % of value produces rental income net of expenses", () => {
    const m = defaultModules();
    m.mortgageKiller.enabled = true;
    m.mortgageKiller.cycleYears = 5;
    m.realEstate.enabled = true;
    m.realEstate.rentalMode = "str";
    m.realEstate.strGrossReceiptsPctOfValue = 10;
    m.realEstate.strExpenseRatioPct = 40;
    const res = runUltraScenario(baseProfile(), m, [{ years: 20, goal: "str" }]);
    const withRentals = res.windows[0].rows.find((r) => r.propertiesOwned > 0 && r.rentalIncome > 0);
    expect(withRentals).toBeTruthy();
    // Net = gross × (1 − expense ratio): 10% of value × 60% = 6% of earning-
    // property value. A property acquired within the final year holds value
    // but hasn't earned yet, so the lower bound allows one non-earning unit.
    const r = res.final;
    if (r.propertiesOwned > 0) {
      const propValue = r.realEstateValue - r.homeValue;
      expect(r.rentalIncome).toBeGreaterThan(propValue * 0.06 * ((r.propertiesOwned - 1) / r.propertiesOwned) * 0.9);
      expect(r.rentalIncome).toBeLessThan(propValue * 0.07);
    }
  });

  it("'live' mode adds the property but produces zero rental income", () => {
    const m = defaultModules();
    m.mortgageKiller.enabled = true;
    m.mortgageKiller.cycleYears = 5;
    m.realEstate.enabled = true;
    m.realEstate.rentalMode = "live";
    const res = runUltraScenario(baseProfile(), m, [{ years: 15, goal: "live" }]);
    expect(res.final.propertiesOwned).toBeGreaterThanOrEqual(1);
    expect(res.final.rentalIncome).toBe(0);
  });

  it("IUL: premiums build cash value, income draws start on schedule at 4% or 2%", () => {
    const m = defaultModules();
    m.trustIUL.enabled = true;
    m.trustIUL.premiumAnnual = 30000;
    m.trustIUL.premiumYears = 5;
    m.trustIUL.incomeStartYear = 8;
    m.trustIUL.incomeRatePct = 4;
    const res = runUltraScenario(baseProfile(), m, [{ years: 12, goal: "iul" }]);
    const rows = res.windows[0].rows;
    expect(rows[6].iulIncome).toBe(0); // year 7: before income starts
    expect(rows[7].iulIncome).toBeGreaterThan(0); // year 8: draws begin
    // Draw ≈ 4% of pre-draw cash value.
    expect(rows[7].iulIncome / (rows[7].iulCashValue + rows[7].iulIncome)).toBeCloseTo(0.04, 2);
  });

  it("chronic-illness access = multiple × annual premium, only when IUL is on", () => {
    const m = defaultModules();
    m.trustIUL.enabled = true;
    m.trustIUL.premiumAnnual = 25000;
    const res = runUltraScenario(baseProfile(), m, [{ years: 5, goal: "" }]);
    expect(res.chronicIllnessBenefit.available).toBe(true);
    expect(res.chronicIllnessBenefit.accessibleAmount).toBe(25000 * 12);
    m.trustIUL.enabled = false;
    const off = runUltraScenario(baseProfile(), m, [{ years: 5, goal: "" }]);
    expect(off.chronicIllnessBenefit.available).toBe(false);
    expect(off.chronicIllnessBenefit.accessibleAmount).toBe(0);
  });

  it("equity deployment draws a lien and routes through IUL when configured", () => {
    const m = defaultModules();
    m.equityDeployment.enabled = true;
    m.equityDeployment.pctOfHomeEquityDeployed = 50;
    m.equityDeployment.flowsThroughTrustIUL = true;
    m.trustIUL.enabled = true;
    const p = baseProfile(); // equity = 200k → deploys 100k
    const res = runUltraScenario(p, m, [{ years: 3, goal: "" }]);
    const y1 = res.windows[0].rows[0];
    expect(y1.iulCashValue).toBeGreaterThan(100000); // deployed equity + premium, credited
    expect(res.moduleNotes.some((n) => n.includes("trust-owned IUL"))).toBe(true);
  });

  it("expense-change schedule applies at the stated year", () => {
    const m = defaultModules();
    const res = runUltraScenario(baseProfile(), m, [{ years: 12, goal: "" }]);
    const rows = res.windows[0].rows;
    expect(rows[8].expenses).toBe(80000);
    expect(rows[9].expenses).toBe(70000); // atYear 10
  });

  it("every result carries the projection disclosure", () => {
    const res = runUltraScenario(baseProfile(), defaultModules(), [{ years: 5, goal: "" }]);
    expect(res.disclosure).toMatch(/not guarantees/i);
  });

  it("rule-based module triage: mortgage + cashflow makes the killer necessary", () => {
    const plan = ruleBasedFacts({
      hasMortgage: true, hasPositiveCashflow: true, homeEquity: 200000,
      wantsRentalIncome: true, wantsProtection: true, wantsGuaranteedIncome: false,
    });
    const killer = plan.find((p) => p.module === "mortgageKiller");
    expect(killer?.status).toBe("necessary");
    const annuity = plan.find((p) => p.module === "incomeAnnuity");
    expect(annuity?.status).toBe("optional");
  });
});
