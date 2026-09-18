/**
 * Policy Loan Optimization Engine
 * Models optimal loan timing, amounts, tax-free income streams,
 * and lapse risk thresholds for IUL policies.
 *
 * The loan logic is this file's own. The policy underneath it is not: every
 * year is stepped through `stepPolicyYear` in shared/policyMechanics.ts, which
 * is the one place the charge order lives. This file used to carry its own
 * copy — five age bands for cost of insurance, an 8%/6% premium load and a flat
 * $120 fee, written inline — and two other engines carried different copies.
 * The numbers below are those same defaults, moved behind a name that says what
 * they are, so a projection built on them reports itself unreliable instead of
 * looking like a carrier illustration.
 */
import {
  stepPolicyYear,
  ILLUSTRATIVE_COI_TABLE,
  ILLUSTRATIVE_SOURCE,
  type PolicyCharges,
} from './policyMechanics';

/**
 * The charges this engine assumed before it had anywhere to read them from.
 * Not a carrier's schedule — see ILLUSTRATIVE_COI_TABLE. Callers with a real
 * rate sheet pass their own and the result stops flagging itself.
 */
export const DEFAULT_LOAN_MODEL_CHARGES: PolicyCharges = {
  premiumLoadPctByYear: [8, 6, 6, 6, 6, 0],
  monthlyPolicyFee: 10,
  perUnitMonthlyPerThousand: 0,
  perUnitYears: 0,
  coiTable: ILLUSTRATIVE_COI_TABLE,
  coiTableSource: ILLUSTRATIVE_SOURCE,
  surrenderChargePctByYear: [],
};

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
  /** Carrier charges. Omitted, DEFAULT_LOAN_MODEL_CHARGES is used and said so. */
  charges?: PolicyCharges;
  /**
   * The carrier's AG 49 maximum illustrated rate, as a percentage. It is a
   * published figure derived from the product's own index parameters; there is
   * no universal value and none is assumed. Supplied, the result says when the
   * illustrated rate exceeds it. Absent, the result says no ceiling was checked.
   */
  maximumIllustratedRate?: number;
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
  /** What the policy model was missing, and whether to trust the columns. */
  mechanics: {
    reliable: boolean;
    missing: string[];
    notes: string[];
  };
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
  const charges = input.charges ?? DEFAULT_LOAN_MODEL_CHARGES;
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

    // The policy year itself — premium load, fee, cost of insurance on the net
    // amount at risk, then the credit. One implementation, shared.
    const specifiedAmount = input.deathBenefit;
    const step = stepPolicyYear({
      accountValue: cv,
      policyYear: y,
      attainedAge: age,
      premium,
      faceAmount: specifiedAmount,
      charges,
      creditedRatePct: input.illustratedRate * 100,
    });
    const chargesThisYear = step.row.premiumLoad + step.row.policyFee + step.row.perUnitCharge + step.row.costOfInsurance;
    const interest = step.row.interestCredited;
    cv = step.accountValue;

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
      charges: Math.round(chargesThisYear),
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

  const missing: string[] = [];
  const notes: string[] = [];
  if (charges.coiTable.length === 0) {
    missing.push('cost of insurance table');
    notes.push('No cost of insurance table was supplied, so no mortality charge was deducted. Every value here is too high.');
  } else if (charges.coiTableSource === ILLUSTRATIVE_SOURCE) {
    missing.push('a carrier cost of insurance table');
    notes.push('Mortality came from generic age bands, not a carrier schedule. Treat the charge column as an order of magnitude.');
  }
  if (charges.surrenderChargePctByYear.length === 0) {
    missing.push('surrender charge schedule');
    notes.push('No surrender charge schedule was supplied. Loans in the early years are shown against a cash value a real policy would not yet have.');
  }
  const illustratedPct = input.illustratedRate * 100;
  if (typeof input.maximumIllustratedRate === 'number') {
    if (illustratedPct > input.maximumIllustratedRate) {
      missing.push('an illustrated rate within the AG 49 maximum');
      notes.push(
        `The projection credits ${illustratedPct.toFixed(2)}% against a maximum illustrated rate of ` +
        `${input.maximumIllustratedRate.toFixed(2)}%. Under NAIC AG 49, as amended by AG 49-A and ` +
        `AG 49-B, a carrier may not illustrate above that rate. These columns could not be shown to a client.`
      );
    }
  } else {
    missing.push('the carrier AG 49 maximum illustrated rate');
    notes.push(
      'No AG 49 maximum illustrated rate was supplied, so the credited rate was not checked against a ' +
      'ceiling. That figure is published per product and derived from its own index parameters; it is ' +
      'not a constant and is not assumed here.'
    );
  }

  return {
    years,
    mechanics: { reliable: missing.length === 0, missing, notes },
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
