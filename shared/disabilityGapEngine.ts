/**
 * SISTER INVENTION SI-013: Disability Income Gap Analysis
 * Patent Reference: Extends PAT-008 (Income Replacement)
 * 
 * Calculates true disability income gap including group coverage
 * limitations, tax impact, and benefit period analysis.
 */

export interface DisabilityInput {
  annualIncome: number;
  monthlyExpenses: number;
  groupLTDPercent: number;       // % of income covered
  groupLTDBenefitCap: number;    // Monthly max
  groupLTDDefinition: "own_occupation" | "any_occupation" | "split";
  groupLTDBenefitPeriod: number; // Months
  groupLTDEliminationPeriod: number; // Days
  taxBracket: number;
  employerPaidPremium: boolean;  // If employer pays, benefits are taxable
  age: number;
  occupation: string;
  occupationClass: 1 | 2 | 3 | 4 | 5 | 6; // 1=most hazardous, 6=professional
  emergencyFundMonths: number;
  spouseIncome: number;
  dependents: number;
}

export interface DisabilityGap {
  monthlyIncomeNeeded: number;
  groupBenefitGross: number;
  groupBenefitAfterTax: number;
  monthlyGap: number;
  annualGap: number;
  gapPercent: number;
  eliminationPeriodCost: number;
  lifetimeExposure: number;
}

export interface IndividualDIRecommendation {
  monthlyBenefit: number;
  eliminationPeriod: number;
  benefitPeriod: string;
  definition: string;
  estimatedPremium: number;
  riders: string[];
  carrier: string;
}

export interface DisabilityResult {
  gap: DisabilityGap;
  recommendation: IndividualDIRecommendation;
  probabilityOfDisability: number;
  criticalFindings: string[];
  costOfInaction: number;
  irsReferences: string[];
}

/**
 * Analyze disability income gap
 */
export function analyzeDisabilityGap(input: DisabilityInput): DisabilityResult {
  const monthlyIncome = input.annualIncome / 12;
  const monthlyNeed = Math.max(input.monthlyExpenses, monthlyIncome * 0.70);

  // Group LTD benefit calculation
  const groupGross = Math.min(monthlyIncome * input.groupLTDPercent, input.groupLTDBenefitCap);
  const groupAfterTax = input.employerPaidPremium ? groupGross * (1 - input.taxBracket) : groupGross;

  const monthlyGap = Math.max(0, monthlyNeed - groupAfterTax - input.spouseIncome / 12);
  const annualGap = monthlyGap * 12;
  const gapPercent = monthlyIncome > 0 ? (monthlyGap / monthlyIncome) * 100 : 0;

  // Elimination period cost
  const elimCost = input.monthlyExpenses * (input.groupLTDEliminationPeriod / 30);
  const emergencyCoverage = input.emergencyFundMonths * input.monthlyExpenses;
  const elimGap = Math.max(0, elimCost - emergencyCoverage);

  // Lifetime exposure
  const workingYearsLeft = Math.max(0, 65 - input.age);
  const lifetimeExposure = annualGap * workingYearsLeft;

  // Probability of disability (actuarial data by age)
  const baseProbability = input.age < 35 ? 0.25 : input.age < 45 ? 0.30 : input.age < 55 ? 0.36 : 0.43;
  const occMult = input.occupationClass <= 2 ? 1.5 : input.occupationClass <= 4 ? 1.0 : 0.7;
  const probability = Math.min(0.60, baseProbability * occMult);

  // Individual DI recommendation
  const recBenefit = Math.min(monthlyGap, monthlyIncome * 0.60); // Max individual DI is ~60% of income
  const elimPeriod = input.emergencyFundMonths >= 6 ? 180 : input.emergencyFundMonths >= 3 ? 90 : 30;
  const benefitPeriod = input.age < 50 ? "To age 65" : "5 years";

  // Premium estimate (per $100 of monthly benefit)
  const premiumPer100 = input.occupationClass >= 5 ? 2.50 : input.occupationClass >= 3 ? 3.50 : 5.00;
  const annualPremium = (recBenefit / 100) * premiumPer100 * 12;

  const riders: string[] = [];
  if (input.age < 50) riders.push("Future Increase Option (FIO)");
  riders.push("Cost of Living Adjustment (COLA)");
  if (input.occupationClass >= 4) riders.push("Own-Occupation to age 65");
  riders.push("Residual/Partial Disability");
  if (input.annualIncome > 200000) riders.push("Catastrophic Disability Benefit");

  const criticalFindings: string[] = [];
  if (gapPercent > 30) {
    criticalFindings.push(`CRITICAL: ${Math.round(gapPercent)}% income gap during disability — $${monthlyGap.toLocaleString()}/month shortfall`);
  }
  if (input.employerPaidPremium) {
    criticalFindings.push(`WARNING: Group LTD benefits are TAXABLE (employer-paid premium). After-tax benefit: $${Math.round(groupAfterTax).toLocaleString()}/month vs gross $${Math.round(groupGross).toLocaleString()}`);
  }
  if (input.groupLTDDefinition === "any_occupation") {
    criticalFindings.push("WARNING: Group LTD uses 'any occupation' definition — benefits stop if you can work ANY job, not just your current one");
  }
  if (input.groupLTDBenefitCap < monthlyIncome * 0.6) {
    criticalFindings.push(`Group LTD cap ($${input.groupLTDBenefitCap.toLocaleString()}/month) is below 60% of your income`);
  }
  if (elimGap > 0) {
    criticalFindings.push(`Elimination period gap: $${Math.round(elimGap).toLocaleString()} not covered by emergency fund`);
  }

  const costOfInaction = Math.round(lifetimeExposure * probability);

  return {
    gap: {
      monthlyIncomeNeeded: Math.round(monthlyNeed),
      groupBenefitGross: Math.round(groupGross),
      groupBenefitAfterTax: Math.round(groupAfterTax),
      monthlyGap: Math.round(monthlyGap),
      annualGap: Math.round(annualGap),
      gapPercent: Math.round(gapPercent),
      eliminationPeriodCost: Math.round(elimCost),
      lifetimeExposure: Math.round(lifetimeExposure),
    },
    recommendation: {
      monthlyBenefit: Math.round(recBenefit),
      eliminationPeriod: elimPeriod,
      benefitPeriod,
      definition: input.occupationClass >= 4 ? "True own-occupation" : "Modified own-occupation",
      estimatedPremium: Math.round(annualPremium),
      riders,
      carrier: input.occupationClass >= 5 ? "Guardian / Principal" : "Mutual of Omaha / Unum",
    },
    probabilityOfDisability: Math.round(probability * 100),
    criticalFindings,
    costOfInaction,
    irsReferences: [
      "IRC §105(a) — Employer-paid disability benefits are taxable income",
      "IRC §104(a)(3) — Personally-paid disability benefits are tax-free",
      "IRC §162 — Business deduction for employer-paid premiums",
      "IRC §213 — Medical expense deduction for DI premiums (limited)",
    ],
  };
}
