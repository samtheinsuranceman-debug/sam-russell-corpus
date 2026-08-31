/**
 * Premium Financing Calculator
 * Models loan-to-premium ratio, collateral requirements, interest cost,
 * and break-even year for large IUL policies ($1M+ premiums).
 */

export interface PremiumFinancingInput {
  annualPremium: number;
  premiumYears: number;
  loanInterestRate: number; // e.g. 0.065 for 6.5%
  collateralRequirement: number; // e.g. 0.20 for 20% of loan
  illustratedRate: number; // IUL credited rate e.g. 0.075 (AG 49 max: 7.5%)
  issueAge: number;
  loanTermYears: number; // how long the financing loan runs
  projectionYears: number; // total projection horizon
}

export interface PremiumFinancingYear {
  year: number;
  age: number;
  premium: number;
  loanBalance: number;
  loanInterest: number;
  cumulativeLoanCost: number;
  policyCashValue: number;
  netEquity: number; // CV - loan balance
  loanToValueRatio: number;
  collateralRequired: number;
}

export interface PremiumFinancingResult {
  years: PremiumFinancingYear[];
  breakEvenYear: number | null;
  totalPremiums: number;
  totalLoanInterest: number;
  totalLoanCost: number;
  finalCashValue: number;
  finalLoanBalance: number;
  finalNetEquity: number;
  npvAdvantage: number; // NPV of financing vs self-funding
  selfFundedFinalCV: number;
}

/**
 * Run premium financing projection
 */
export function calculatePremiumFinancing(input: PremiumFinancingInput): PremiumFinancingResult {
  const years: PremiumFinancingYear[] = [];
  let loanBalance = 0;
  let cumulativeLoanCost = 0;
  let cv = 0;
  let selfFundedCV = 0;
  let breakEvenYear: number | null = null;

  // Simplified IUL projection (matches main engine logic)
  const specifiedAmount = input.annualPremium * 10;

  for (let y = 1; y <= input.projectionYears; y++) {
    const age = input.issueAge + y;
    const premium = y <= input.premiumYears ? input.annualPremium : 0;

    // Financing: bank pays the premium, adds to loan balance
    if (premium > 0) {
      loanBalance += premium;
    }

    // Loan interest accrues on outstanding balance
    const loanInterest = loanBalance * input.loanInterestRate;
    if (y <= input.loanTermYears) {
      // During loan term, interest capitalizes (added to loan balance)
      loanBalance += loanInterest;
    } else if (loanBalance > 0) {
      // After loan term, assume loan is repaid from CV or external funds
      // For modeling, we keep the balance static after term ends
    }
    cumulativeLoanCost += loanInterest;

    // IUL cash value growth (simplified)
    const premiumLoad = y === 1 ? premium * 0.08 : (y <= 5 ? premium * 0.06 : 0);
    const netPremium = premium - premiumLoad;
    const coiRate = age <= 50 ? 0.0012 : age <= 60 ? 0.0028 : age <= 70 ? 0.0065 : 0.0100;
    const nar = Math.max(0, specifiedAmount * 1.5 - cv);
    const coi = nar * coiRate;
    const charges = 120 + (y <= 10 ? (specifiedAmount / 1000) * 7.78 : 0) + coi;
    const afterCharges = Math.max(0, cv + netPremium - charges + (y >= 11 ? cv * 0.002 : 0));
    cv = afterCharges * (1 + input.illustratedRate);

    // Self-funded comparison (same IUL, no financing cost)
    const sfPremiumLoad = y === 1 ? premium * 0.08 : (y <= 5 ? premium * 0.06 : 0);
    const sfNet = premium - sfPremiumLoad;
    const sfNar = Math.max(0, specifiedAmount * 1.5 - selfFundedCV);
    const sfCoi = sfNar * coiRate;
    const sfCharges = 120 + (y <= 10 ? (specifiedAmount / 1000) * 7.78 : 0) + sfCoi;
    const sfAfter = Math.max(0, selfFundedCV + sfNet - sfCharges + (y >= 11 ? selfFundedCV * 0.002 : 0));
    selfFundedCV = sfAfter * (1 + input.illustratedRate);

    const netEquity = cv - loanBalance;
    const ltv = cv > 0 ? loanBalance / cv : 0;
    const collateralRequired = loanBalance * input.collateralRequirement;

    if (breakEvenYear === null && netEquity > 0 && y > 1) {
      breakEvenYear = y;
    }

    years.push({
      year: y,
      age,
      premium,
      loanBalance: Math.round(loanBalance),
      loanInterest: Math.round(loanInterest),
      cumulativeLoanCost: Math.round(cumulativeLoanCost),
      policyCashValue: Math.round(cv),
      netEquity: Math.round(netEquity),
      loanToValueRatio: Math.round(ltv * 10000) / 10000,
      collateralRequired: Math.round(collateralRequired),
    });
  }

  // NPV advantage: compare financing vs self-funding
  // Financing advantage = final CV is the same, but you didn't deploy capital upfront
  const discountRate = 0.05; // opportunity cost of capital
  let npvSelfFundPremiums = 0;
  for (let y = 1; y <= input.premiumYears; y++) {
    npvSelfFundPremiums += input.annualPremium / Math.pow(1 + discountRate, y);
  }
  const npvAdvantage = npvSelfFundPremiums - cumulativeLoanCost / Math.pow(1 + discountRate, input.projectionYears);

  return {
    years,
    breakEvenYear,
    totalPremiums: input.annualPremium * input.premiumYears,
    totalLoanInterest: Math.round(cumulativeLoanCost),
    totalLoanCost: Math.round(loanBalance),
    finalCashValue: Math.round(cv),
    finalLoanBalance: Math.round(loanBalance),
    finalNetEquity: Math.round(cv - loanBalance),
    npvAdvantage: Math.round(npvAdvantage),
    selfFundedFinalCV: Math.round(selfFundedCV),
  };
}
