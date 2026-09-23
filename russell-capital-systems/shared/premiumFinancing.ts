/**
 * Premium Financing Calculator
 * Models loan-to-premium ratio, collateral requirements, interest cost,
 * and break-even year for large IUL policies ($1M+ premiums).
 */

// ─── Where these numbers come from ──────────────────────────────────────────
// The loan rate, collateral share and credited rate are typed in by the user;
// the sources below are the market references for them. The policy charges and
// the discount rate inside calculatePremiumFinancing are the firm's assumptions,
// declared in words. None of these objects is read by the arithmetic.

/** loanInterestRate is typed in. Premium finance loans are usually priced at SOFR plus a lender spread. */
const SOFR_SOURCE = {
  label: "Federal Reserve Bank of New York, Secured Overnight Financing Rate (SOFR, via FRED): 3.62% on 2026-09-11",
  url: "https://fred.stlouisfed.org/series/SOFR",
  asOf: "2026-09-11 observation, read 2026-09-23",
  note: "Reference for the typed-in loan rate; the lender's spread over SOFR is set in the loan agreement.",
};
const PRIME_RATE_SOURCE = {
  label: "Board of Governors of the Federal Reserve System, H.15 Selected Interest Rates, Bank Prime Loan Rate (DPRIME, via FRED): 6.75% on 2026-09-02",
  url: "https://fred.stlouisfed.org/series/DPRIME",
  asOf: "2026-09-02 observation, read 2026-09-23",
  note: "Some premium finance lenders price off prime instead of SOFR.",
};

/** Section 7872 below-market loan test and the 5% discount rate: the IRS rates for the month. */
const AFR_SOURCE = {
  label: "Internal Revenue Service, Rev. Rul. 2026-17, Applicable Federal Rates for September 2026, Table 1 (also used for Section 7872): short-term 4.18%, mid-term 4.49%, long-term 5.12%, annual compounding",
  url: "https://www.irs.gov/pub/irs-drop/rr-26-17.pdf",
  asOf: "September 2026 rates, read 2026-09-23",
  note: "Applies when a family member or trust lends the premium (Section 7872 below-market loan rules). The 5% discount rate in this engine is close to the long-term AFR but is the firm's assumption, not read from this ruling.",
};

/** illustratedRate is typed in; the interface comment calls 7.5% the AG 49 maximum, which the guideline does not state. */
const AG49_SOURCE = {
  label: "NAIC, Actuarial Guideline XLIX-A, The Application of the Life Illustrations Model Regulation to Policies with Index-Based Interest, Section 4 (illustrated scale)",
  url: "https://content.naic.org/sites/default/files/inline-files/AG%2049A%28posted%29.pdf",
  asOf: "guideline effective for policies sold on or after 2020-12-14, read 2026-09-23",
  note: "AG 49-A caps the illustrated rate by formula (the lesser of the benchmark index account lookback average and 145% of the insurer's net investment earnings rate), per carrier and per year. It names no 7.5% figure; the carrier's own maximum governs.",
};

const PREMIUM_FINANCING_ASSUMPTIONS = [
  { label: "Assumption: face amount = 10 times the annual premium, chosen by the firm as a generic funding ratio for a financed IUL; no external source" },
  { label: "Assumption: premium load of 8% in year 1 and 6% in years 2 to 5, then none, chosen by the firm as a generic illustration, not any carrier's filed charges; no external source" },
  { label: "Assumption: $120 per-policy charge a year and $7.78 per $1,000 of face for years 1 to 10, chosen by the firm as a generic illustration; no external source" },
  { label: "Assumption: cost of insurance of 0.12% of net amount at risk to age 50, 0.28% to 60, 0.65% to 70 and 1.0% after, on a net amount at risk of 1.5 times face, chosen by the firm as a generic curve; no external source" },
  { label: "Assumption: persistency credit of 0.2% of cash value from year 11, chosen by the firm as a generic illustration; no external source" },
  { label: "Assumption: opportunity cost of capital = 5% a year (discountRate), chosen by the firm because it sits near the long-term applicable federal rate; no external source for the figure itself" },
];

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

/** Every source and declared assumption behind the typed-in numbers in this engine, for the page to print. */
export const PREMIUM_FINANCING_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  SOFR_SOURCE,
  PRIME_RATE_SOURCE,
  AFR_SOURCE,
  AG49_SOURCE,
  ...PREMIUM_FINANCING_ASSUMPTIONS,
];
