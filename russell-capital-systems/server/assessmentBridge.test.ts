// ============================================================
// Assessment → calculator bridge: the flat inputs every calculator reads are
// derived from the assessment, never invented; gaps are named.
// ============================================================
import { describe, expect, it } from "vitest";
import { completeFactFinder } from "./journeyEngine.test";
import { emptyFactFinder } from "@shared/clientFactFinder";
import { assessmentToClientData, remainingMortgageInterest, riskToleranceScore } from "@shared/assessmentBridge";

const NOW = new Date("2026-09-06T00:00:00Z");
const FF = completeFactFinder({
  household: { firstName: "Dana", lastName: "Doe", dateOfBirth: "1981-04-02", stateOfResidence: "Texas", dependents: 2, email: "dana@example.test", phone: "555-0100", maritalStatus: "Married", spouseFirstName: "Sam", spouseDateOfBirth: "1983-06-15" },
  income: { w2Income: 650000, bonusIncome: 50000, spouseIncome: 90000 },
  taxes: { filingStatus: "Married filing jointly" },
  realEstate: { ownsPrimaryHome: true, primaryHomeValue: 1400000, primaryMortgageBalance: 900000, primaryMortgageRate: 6.5, primaryMortgageYearsRemaining: 26, homeEquity: 500000, helocRate: 8.25 },
  debts: { studentLoanBalance: 180000, creditCardBalance: 5000 },
  investments: { taxableBrokerage: 150000, employerPlanBalance: 700000, traditionalIra: 60000, rothIra: 40000, roth401k: 25000, annuities: 100000, riskTolerance: "Moderately aggressive" },
  cash: { checking: 20000, savings: 15000, moneyMarketCds: 50000 },
  cashFlow: { monthlyFixedExpenses: 18000, monthlyDiscretionary: 6000 },
  insurance: { termLifeDeathBenefit: 2000000, permanentLifeDeathBenefit: 500000, permanentLifeCashValue: 80000, lifePremiumAnnual: 24000, ltcCoverage: "Hybrid life/LTC" },
  retirement: { targetRetirementAge: 58, desiredRetirementIncomeMonthly: 25000, socialSecuritySelf: 3800, pensionIncome: 1000 },
});

describe("assessment → calculator inputs", () => {
  it("maps the assessment onto the calculator data shape without inventing numbers", () => {
    const { data, missing } = assessmentToClientData(FF, { now: NOW });
    expect(missing).toEqual([]);
    expect(data).toMatchObject({
      clientId: -1, clientName: "Dana Doe", email: "dana@example.test", phone: "555-0100",
      age: 45, spouseAge: 43, state: "Texas", filingStatus: "joint", spouseName: "Sam", dependents: 2,
      annualIncome: 700000, spouseIncome: 90000, monthlyExpenses: 24000,
      cashSavings: 85000, taxableInvestments: 150000, realEstateEquity: 500000, homeValue: 1400000,
      iraBalance: 60000, rothBalance: 65000, k401Balance: 700000, pensionIncome: 12000, socialSecurityEstimate: 3800,
      lifeInsuranceCv: 80000, lifeInsuranceDb: 2500000, annualPremium: 24000, annuityValue: 100000, hasLTC: true,
      mortgageBalance: 900000, mortgageRate: 6.5, mortgageYearsLeft: 26, otherDebt: 185000, helocRate: 8.25,
      retirementAge: 58, annualIncomeNeeded: 300000, riskTolerance: 7,
    });
    expect(data.totalMortgageInterest).toBeGreaterThan(900000); // 26 years at 6.5% costs more than the principal
    expect(data.children).toEqual([]);
  });

  it("names the inputs an incomplete assessment could not supply, and leaves them at zero", () => {
    const { data, missing } = assessmentToClientData(emptyFactFinder(), { fallbackName: "Owner", now: NOW });
    expect(data.clientName).toBe("Owner");
    expect(data.annualIncome).toBe(0);
    expect(missing).toEqual(expect.arrayContaining(["Annual income", "Monthly expenses", "Target retirement age", "Retirement income target", "Age (date of birth)"]));
    expect(data.filingStatus).toBe("single");
    expect(data.riskTolerance).toBe(5);
  });

  it("computes remaining mortgage interest from balance, rate and term", () => {
    expect(remainingMortgageInterest(0, 6.5, 26)).toBe(0);
    expect(remainingMortgageInterest(300000, 0, 30)).toBe(0);
    const i = remainingMortgageInterest(300000, 6, 30);
    expect(i).toBeGreaterThan(340000);
    expect(i).toBeLessThan(350000);
  });

  it("maps risk tolerance labels to the 1–10 scale calculators use", () => {
    expect(riskToleranceScore("Conservative")).toBe(2);
    expect(riskToleranceScore("Moderate")).toBe(5);
    expect(riskToleranceScore("Aggressive")).toBe(9);
    expect(riskToleranceScore(undefined)).toBe(5);
  });
});
