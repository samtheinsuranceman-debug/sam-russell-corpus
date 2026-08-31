/**
 * Policy Loan Optimization Engine
 * Models optimal loan timing, amounts, tax-free income streams,
 * and lapse risk thresholds for IUL policies.
 */

export interface PolicyLoanInput {
  currentCashValue: number;
  currentAge: number;
  retirementAge: number;
  illustratedRate: number; // e.g. 0.075 (AG 49 max: 7.5%)
  loanRate: number; // e.g. 0.05 (5% loan rate, +0.5% positive arbitrage)
  loanType: 'fixed' | 'variable' | 'wash';
  annualIncomeNeeded: number;
  maxLoanToValue: number; // e.g. 0.90 (90%)
  projectionYears: number;
  annualPremium: number; // ongoing premium if any
  premiumYearsRemaining: number;
  deathBenefit: number;
}

export interface PolicyLoanYear {
  year: number;
  age: number;
  beginningCV: number;
  premium: number;
  interest: number;
  charges: number;
  loanTaken: number;
  loanInterestCharged: number;
  endingCV: number;
  cumulativeLoans: number;
  outstandingLoanBalance: number;
  loanToValueRatio: number;
  netDeathBenefit: number;
  lapseRisk: 'safe' | 'caution' | 'danger';
  taxFreeIncome: number;
}

export interface PolicyLoanResult {
  years: PolicyLoanYear[];
  totalTaxFreeIncome: number;
  maxSafeLoanPerYear: number;
  optimalStartAge: number;
  optimalAnnualLoan: number;
  yearsOfIncome: number;
  lapseYear: number | null;
  effectiveTaxRate: number; // vs taxable withdrawal
  summary: {
    phase1: string; // accumulation
    phase2: string; // distribution
    totalIncome: number;
    avgAnnualIncome: number;
  };
}

/**
 * Calculate the optimal policy loan strategy
 */
export function optimizePolicyLoans(input: PolicyLoanInput): PolicyLoanResult {
  const years: PolicyLoanYear[] = [];
  let cv = input.currentCashValue;
  let outstandingLoan = 0;
  let cumulativeLoans = 0;
  let totalTaxFreeIncome = 0;
  let lapseYear: number | null = null;

  // Wash loan: loan rate = credited rate (net zero cost)
  const effectiveLoanRate = input.loanType === 'wash' ? 0 : input.loanRate;
  const creditOnLoans = input.loanType === 'wash' ? input.illustratedRate : 0;

  for (let y = 1; y <= input.projectionYears; y++) {
    const age = input.currentAge + y;
    const isRetired = age >= input.retirementAge;
    const premium = y <= input.premiumYearsRemaining ? input.annualPremium : 0;

    // Beginning of year
    const beginningCV = cv;

    // Add premium
    const premiumLoad = y === 1 ? premium * 0.08 : (y <= 5 ? premium * 0.06 : 0);
    cv += premium - premiumLoad;

    // Charges
    const specifiedAmount = input.deathBenefit;
    const nar = Math.max(0, specifiedAmount - cv);
    const coiRate = age <= 50 ? 0.0012 : age <= 60 ? 0.0028 : age <= 70 ? 0.0065 : age <= 80 ? 0.0160 : 0.0220;
    const coi = nar * coiRate;
    const charges = 120 + coi;
    cv = Math.max(0, cv - charges);

    // Interest earned on full CV (including loaned portion for wash loans)
    const interest = cv * input.illustratedRate;
    cv += interest;

    // Loan interest charged on outstanding balance
    const loanInterestCharged = outstandingLoan * effectiveLoanRate;
    outstandingLoan += loanInterestCharged;

    // Determine loan amount for this year
    let loanTaken = 0;
    if (isRetired && lapseYear === null) {
      // Calculate max safe loan
      const maxLoan = cv * input.maxLoanToValue - outstandingLoan;
      loanTaken = Math.min(input.annualIncomeNeeded, Math.max(0, maxLoan));
      outstandingLoan += loanTaken;
      cumulativeLoans += loanTaken;
      totalTaxFreeIncome += loanTaken;
    }

    // Check loan-to-value ratio
    const ltv = cv > 0 ? outstandingLoan / cv : 1;

    // Determine lapse risk
    let lapseRisk: 'safe' | 'caution' | 'danger' = 'safe';
    if (ltv > 0.95) {
      lapseRisk = 'danger';
      if (lapseYear === null) lapseYear = y;
    } else if (ltv > 0.80) {
      lapseRisk = 'caution';
    }

    const netDeathBenefit = Math.max(0, specifiedAmount - outstandingLoan);

    years.push({
      year: y,
      age,
      beginningCV: Math.round(beginningCV),
      premium: Math.round(premium),
      interest: Math.round(interest),
      charges: Math.round(charges),
      loanTaken: Math.round(loanTaken),
      loanInterestCharged: Math.round(loanInterestCharged),
      endingCV: Math.round(cv),
      cumulativeLoans: Math.round(cumulativeLoans),
      outstandingLoanBalance: Math.round(outstandingLoan),
      loanToValueRatio: Math.round(ltv * 10000) / 10000,
      netDeathBenefit: Math.round(netDeathBenefit),
      lapseRisk,
      taxFreeIncome: Math.round(loanTaken),
    });
  }

  // Calculate optimal annual loan (max sustainable without lapse)
  const incomeYears = years.filter(y => y.taxFreeIncome > 0);
  const yearsOfIncome = incomeYears.length;
  const avgAnnualIncome = yearsOfIncome > 0 ? Math.round(totalTaxFreeIncome / yearsOfIncome) : 0;

  // Max safe loan: use 80% LTV threshold
  const retirementCV = years.find(y => y.age === input.retirementAge)?.endingCV ?? cv;
  const maxSafeLoanPerYear = Math.round(retirementCV * 0.04); // 4% safe withdrawal equivalent

  // Effective tax rate comparison: if this were taxable, what would the tax be?
  const assumedTaxRate = 0.37; // top bracket
  const effectiveTaxRate = 0; // policy loans are tax-free

  return {
    years,
    totalTaxFreeIncome: Math.round(totalTaxFreeIncome),
    maxSafeLoanPerYear,
    optimalStartAge: input.retirementAge,
    optimalAnnualLoan: avgAnnualIncome,
    yearsOfIncome,
    lapseYear,
    effectiveTaxRate,
    summary: {
      phase1: `Accumulation: Age ${input.currentAge} to ${input.retirementAge} (${input.retirementAge - input.currentAge} years)`,
      phase2: `Distribution: Age ${input.retirementAge} to ${input.currentAge + input.projectionYears} (${input.projectionYears - (input.retirementAge - input.currentAge)} years)`,
      totalIncome: Math.round(totalTaxFreeIncome),
      avgAnnualIncome,
    },
  };
}

/**
 * Compare different loan strategies (fixed vs variable vs wash)
 */
export function compareLoanStrategies(baseInput: Omit<PolicyLoanInput, 'loanType'>): {
  fixed: PolicyLoanResult;
  variable: PolicyLoanResult;
  wash: PolicyLoanResult;
  recommendation: string;
} {
  const fixed = optimizePolicyLoans({ ...baseInput, loanType: 'fixed' });
  const variable = optimizePolicyLoans({ ...baseInput, loanType: 'variable', loanRate: baseInput.loanRate + 0.01 });
  const wash = optimizePolicyLoans({ ...baseInput, loanType: 'wash' });

  let recommendation = 'wash';
  if (wash.totalTaxFreeIncome >= fixed.totalTaxFreeIncome && wash.totalTaxFreeIncome >= variable.totalTaxFreeIncome) {
    recommendation = 'Wash Loan — Zero net cost, maximum income stream. Best for long-term policy holders.';
  } else if (fixed.totalTaxFreeIncome >= variable.totalTaxFreeIncome) {
    recommendation = 'Fixed Loan — Predictable cost, good for conservative planning. Lower income than wash but more certainty.';
  } else {
    recommendation = 'Variable Loan — May cost less in low-rate environments but carries rate risk.';
  }

  return { fixed, variable, wash, recommendation };
}
