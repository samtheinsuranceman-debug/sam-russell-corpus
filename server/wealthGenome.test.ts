// ============================================================
// Wealth Genome — eight dimensions computed from the assessment, explainable.
// ============================================================
import { describe, expect, it } from "vitest";
import { completeFactFinder } from "./journeyEngine.test";
import { emptyFactFinder } from "@shared/clientFactFinder";
import { computeWealthGenome, tierFor } from "@shared/wealthGenome";

const STRONG = completeFactFinder({
  household: { dateOfBirth: "1981-04-02", dependents: 2 },
  income: { employmentType: "W-2 employee", w2Income: 650000, spouseIncome: 150000, incomeTrajectory: "Rising modestly", rentalIncome: 24000 },
  taxes: { adjustedGrossIncome: 800000, federalTaxPaid: 120000, retirementContributionsPretax: 46000, deductionMethod: "Itemized", charitableGiving: 20000 },
  realEstate: { ownsPrimaryHome: true, primaryMortgageBalance: 400000, primaryMortgageYearsRemaining: 12, primaryMortgageRate: 3.1, homeEquity: 900000 },
  debts: { studentLoanBalance: 0 },
  investments: { taxableBrokerage: 900000, employerPlanBalance: 1400000, rothIra: 300000, hsaBalance: 60000, plan529: 120000, concentratedPosition: false, allocationStocks: 70, allocationBonds: 25, allocationCash: 5, riskTolerance: "Moderate", worstYearReaction: "Hold and wait", employerMatchPct: 4, backdoorRoth: "Yes", currentAdvisor: "Custodian" },
  cash: { emergencyFundMonths: 8 },
  cashFlow: { monthlyTakeHome: 40000, monthlySavings: 12000 },
  insurance: { termLifeDeathBenefit: 8000000, disabilityMonthlyBenefit: 25000, disabilityOwnOccupation: "Yes", malpracticeLimits: "1M/3M", tailCoverage: "Yes", umbrellaLimit: 2000000, ltcCoverage: "Hybrid life/LTC" },
  practice: { ownsPractice: false },
  estate: { hasWill: true, hasRevocableTrust: true, poaFinancial: true, healthcareDirective: true, beneficiariesReviewed: "Yes", guardianNamed: "Yes", hasIrrevocableTrust: true },
  protection: { divorceProtectionPriority: "5 — Essential", creditorProtectionPriority: "5 — Essential", prenup: "Yes", existingStructures: "LLC + ILIT" },
  retirement: { targetRetirementAge: 62, desiredRetirementIncomeMonthly: 20000, socialSecuritySelf: 3500, socialSecuritySpouse: 2500 },
});

const FRAGILE = completeFactFinder({
  household: { dateOfBirth: "1975-04-02", dependents: 3 },
  income: { employmentType: "1099 / independent contractor", w2Income: 0, contractorIncome: 400000, spouseIncome: 0, incomeTrajectory: "Declining" },
  taxes: { adjustedGrossIncome: 400000, federalTaxPaid: 130000, niitExposure: "Yes" },
  realEstate: { ownsPrimaryHome: true, primaryMortgageBalance: 1100000, primaryMortgageYearsRemaining: 29, primaryMortgageRate: 7.4, primaryInterestOnly: true, homeEquity: 100000 },
  debts: { studentLoanBalance: 350000, creditCardBalance: 40000, autoLoans: 60000 },
  investments: { taxableBrokerage: 0, employerPlanBalance: 120000, rothIra: 0, concentratedPosition: true, concentratedPositionDetail: "Employer stock", riskTolerance: "Aggressive", worstYearReaction: "Sell to stop the losses" },
  cash: { emergencyFundMonths: 0 },
  cashFlow: { monthlyTakeHome: 22000, monthlySavings: 0 },
  insurance: { termLifeDeathBenefit: 0, disabilityMonthlyBenefit: 0, malpracticeLimits: "1M/3M", malpracticeType: "Claims-made", umbrellaLimit: 0 },
  practice: { ownsPractice: true, buySellAgreement: "No" },
  estate: { hasWill: false, hasRevocableTrust: false, poaFinancial: false, healthcareDirective: false, beneficiariesReviewed: "No", guardianNamed: "No" },
  protection: { divorceProtectionPriority: "5 — Essential", creditorProtectionPriority: "5 — Essential", prenup: "No", litigationExposure: "A pending claim" },
  retirement: { targetRetirementAge: 60, desiredRetirementIncomeMonthly: 25000 },
});

describe("Wealth Genome", () => {
  it("has eight named dimensions scored 0–100 with reasons", () => {
    const g = computeWealthGenome(STRONG);
    expect(g.dimensions).toHaveLength(8);
    expect(g.dimensions.map((d) => d.name)).toEqual(["Income Stability", "Tax Efficiency", "Insurance Coverage", "Retirement Readiness", "Estate Planning", "Debt Management", "Investment Diversification", "Risk Mitigation"]);
    for (const d of g.dimensions) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(d.rationale.length).toBeGreaterThan(0);
    }
    expect(g.complete).toBe(true);
    expect(g.assessmentPercent).toBe(100);
  });

  it("scores a well-protected, well-funded household far above a fragile one — on every dimension", () => {
    const strong = computeWealthGenome(STRONG);
    const fragile = computeWealthGenome(FRAGILE);
    expect(strong.overall).toBeGreaterThan(fragile.overall + 30);
    strong.dimensions.forEach((d, i) => expect(d.score, d.name).toBeGreaterThan(fragile.dimensions[i]!.score));
    expect(strong.tier).toMatch(/Strong|Exceptional/);
    expect(fragile.tier).toMatch(/Fragile|Developing/);
  });

  it("explains what would raise a weak dimension, using the client's own facts", () => {
    const g = computeWealthGenome(FRAGILE);
    const estate = g.dimensions.find((d) => d.key === "estate")!;
    expect(estate.score).toBe(0);
    expect(estate.raise).toEqual(expect.arrayContaining([expect.stringMatching(/will/i), expect.stringMatching(/guardian/i)]));
    const insurance = g.dimensions.find((d) => d.key === "insurance")!;
    expect(insurance.rationale.join(" ")).toMatch(/no life insurance/i);
    expect(insurance.raise.join(" ")).toMatch(/disability/i);
    const debt = g.dimensions.find((d) => d.key === "debt")!;
    expect(debt.rationale.join(" ")).toMatch(/\$450,000/);
    expect(debt.rationale.join(" ")).toMatch(/interest-only/i);
    const risk = g.dimensions.find((d) => d.key === "risk")!;
    expect(risk.rationale.join(" ")).toMatch(/sell in a 30% drop/i);
    expect(risk.raise.join(" ")).toMatch(/buy-sell/i);
  });

  it("never invents figures: every dollar amount in the rationale comes from the assessment", () => {
    const g = computeWealthGenome(STRONG);
    const text = g.dimensions.flatMap((d) => d.rationale).join(" ");
    const amounts = [...text.matchAll(/\$([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, "")));
    const inputs = new Set<number>();
    for (const sec of Object.values(STRONG.sections)) for (const v of Object.values(sec)) if (typeof v === "number") inputs.add(v);
    // allowed: raw inputs, and the documented derived totals (life coverage sum, investable sum, retirement need)
    const derived = new Set([8000000, 2600000, 2660000, 4200000, 46000, 2000000, 24000]);
    for (const a of amounts) expect(inputs.has(a) || derived.has(a), `${a} appears in rationale`).toBe(true);
  });

  it("works on an empty assessment (all dimensions at their floors, reported as incomplete)", () => {
    const g = computeWealthGenome(emptyFactFinder());
    expect(g.complete).toBe(false);
    expect(g.assessmentPercent).toBe(0);
    expect(g.dimensions.every((d) => d.score >= 0 && d.score <= 100)).toBe(true);
    expect(computeWealthGenome(null).dimensions).toHaveLength(8);
  });

  it("maps scores to tiers", () => {
    expect(tierFor(90)).toBe("Exceptional");
    expect(tierFor(72)).toBe("Strong");
    expect(tierFor(60)).toBe("Solid");
    expect(tierFor(45)).toBe("Developing");
    expect(tierFor(20)).toBe("Fragile");
  });
});
