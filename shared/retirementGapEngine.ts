/**
 * SISTER INVENTION SI-027: Inflation-Adjusted Retirement Income Gap
 * Patent Reference: Extends PAT-008 (Income Replacement)
 * 
 * Calculates true retirement income gap with inflation, healthcare
 * cost escalation, and longevity risk modeling.
 */

export interface RetirementGapInput {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentIncome: number;
  desiredReplacementRate: number;  // % of income needed
  socialSecurityBenefit: number;   // Monthly at FRA
  pension: number;                 // Monthly
  retirement401k: number;
  rothIRA: number;
  otherSavings: number;
  iulCashValue: number;
  annuityIncome: number;           // Monthly
  monthlyExpenses: number;
  healthcareCostMonthly: number;
  inflationRate: number;
  healthcareInflation: number;     // Usually 2x general inflation
  investmentReturn: number;
  taxBracket: number;
}

export interface RetirementYear {
  year: number;
  age: number;
  incomeNeeded: number;
  ssIncome: number;
  pensionIncome: number;
  withdrawalIncome: number;
  iulLoanIncome: number;
  annuityIncome: number;
  totalIncome: number;
  gap: number;
  healthcareCost: number;
  remainingAssets: number;
  assetDepletionRisk: boolean;
}

export interface RetirementGapResult {
  years: RetirementYear[];
  totalGap: number;
  monthlyGap: number;
  assetDepletionAge: number | null;
  healthcareTotalCost: number;
  additionalSavingsNeeded: number;
  iulBridgeValue: number;
  recommendations: string[];
  riskLevel: "secure" | "moderate" | "at-risk" | "critical";
}

/**
 * Calculate retirement income gap
 */
export function calculateRetirementGap(input: RetirementGapInput): RetirementGapResult {
  const years: RetirementYear[] = [];
  let totalAssets = input.retirement401k + input.rothIRA + input.otherSavings;
  let iulCV = input.iulCashValue;
  let totalGap = 0;
  let totalHealthcare = 0;
  let depletionAge: number | null = null;

  const retirementYears = input.lifeExpectancy - input.retirementAge;
  const yearsToRetirement = input.retirementAge - input.currentAge;

  // Grow assets to retirement
  totalAssets *= Math.pow(1 + input.investmentReturn, yearsToRetirement);
  iulCV *= Math.pow(1 + 0.065, yearsToRetirement);

  for (let y = 1; y <= retirementYears; y++) {
    const age = input.retirementAge + y;
    const inflationFactor = Math.pow(1 + input.inflationRate, y);
    const healthInflFactor = Math.pow(1 + input.healthcareInflation, y);

    // Income needed (inflation-adjusted)
    const baseNeed = input.currentIncome * input.desiredReplacementRate * inflationFactor;
    const healthcareCost = input.healthcareCostMonthly * 12 * healthInflFactor;
    const totalNeed = baseNeed + healthcareCost;
    totalHealthcare += healthcareCost;

    // Income sources
    const ssIncome = age >= 67 ? input.socialSecurityBenefit * 12 * inflationFactor : 0;
    const pensionIncome = input.pension * 12 * inflationFactor;
    const annuityIncome = input.annuityIncome * 12;

    // Withdrawal from retirement accounts (4% rule adjusted)
    const withdrawalRate = 0.04 * (1 + (age - input.retirementAge) * 0.001);
    const withdrawal = totalAssets > 0 ? totalAssets * withdrawalRate : 0;
    totalAssets = Math.max(0, totalAssets - withdrawal);
    totalAssets *= (1 + input.investmentReturn * 0.7); // Conservative in retirement

    // IUL loan income (tax-free bridge)
    let iulLoan = 0;
    const incomeFromOther = ssIncome + pensionIncome + withdrawal + annuityIncome;
    if (incomeFromOther < totalNeed && iulCV > 0) {
      iulLoan = Math.min(totalNeed - incomeFromOther, iulCV * 0.08);
      iulCV -= iulLoan;
      iulCV *= 1.05; // Reduced growth with loans
    }

    const totalIncome = ssIncome + pensionIncome + withdrawal + iulLoan + annuityIncome;
    const gap = Math.max(0, totalNeed - totalIncome);
    totalGap += gap;

    const depleted = totalAssets <= 0 && iulCV <= 0;
    if (depleted && !depletionAge) depletionAge = age;

    years.push({
      year: y,
      age,
      incomeNeeded: Math.round(totalNeed),
      ssIncome: Math.round(ssIncome),
      pensionIncome: Math.round(pensionIncome),
      withdrawalIncome: Math.round(withdrawal),
      iulLoanIncome: Math.round(iulLoan),
      annuityIncome: Math.round(annuityIncome),
      totalIncome: Math.round(totalIncome),
      gap: Math.round(gap),
      healthcareCost: Math.round(healthcareCost),
      remainingAssets: Math.round(totalAssets + iulCV),
      assetDepletionRisk: depleted,
    });
  }

  const monthlyGap = retirementYears > 0 ? totalGap / (retirementYears * 12) : 0;

  // Additional savings needed (PV of gap)
  const pvFactor = (1 - Math.pow(1 + input.investmentReturn, -yearsToRetirement)) / input.investmentReturn;
  const additionalNeeded = pvFactor > 0 ? totalGap / pvFactor : totalGap;

  const iulBridge = years.reduce((s, y) => s + y.iulLoanIncome, 0);

  const riskLevel = depletionAge && depletionAge < input.lifeExpectancy - 5 ? "critical" as const
    : depletionAge ? "at-risk" as const
    : totalGap > input.currentIncome * 2 ? "moderate" as const
    : "secure" as const;

  const recommendations: string[] = [];
  if (riskLevel === "critical" || riskLevel === "at-risk") {
    recommendations.push(`URGENT: Assets projected to deplete at age ${depletionAge} — ${input.lifeExpectancy - (depletionAge ?? 0)} years before life expectancy`);
  }
  if (totalGap > 0) {
    recommendations.push(`Additional savings needed: $${Math.round(additionalNeeded).toLocaleString()} (or $${Math.round(additionalNeeded / yearsToRetirement / 12).toLocaleString()}/month until retirement)`);
  }
  if (iulBridge > 0) {
    recommendations.push(`IUL policy loans provide $${Math.round(iulBridge).toLocaleString()} in tax-free bridge income`);
  }
  recommendations.push(`Healthcare costs over retirement: $${Math.round(totalHealthcare).toLocaleString()} (${(input.healthcareInflation * 100).toFixed(0)}% annual inflation)`);
  recommendations.push("Consider delaying Social Security to age 70 for maximum benefit");
  recommendations.push("Maximize Roth conversions before retirement to reduce future tax burden");

  return {
    years,
    totalGap: Math.round(totalGap),
    monthlyGap: Math.round(monthlyGap),
    assetDepletionAge: depletionAge,
    healthcareTotalCost: Math.round(totalHealthcare),
    additionalSavingsNeeded: Math.round(additionalNeeded),
    iulBridgeValue: Math.round(iulBridge),
    recommendations,
    riskLevel,
  };
}
