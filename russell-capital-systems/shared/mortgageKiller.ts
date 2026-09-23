/**
 * Mortgage Killer Engine v4 — IUL-Funded HELOC Mortgage Acceleration
 *
 * Strategy:
 * 1. Take 70% LTV HELOC to fund IUL premium years 1-2
 * 2. At end of year 2, take 80% life loan of surrender value → principal-only mortgage payment
 * 3. Take new 70% LTV HELOC (based on appreciated home value) to fund IUL year 3
 * 4. At end of year 3, take 80% life loan → principal-only mortgage payment
 * 5. Repeat through year 5 (max IUL payment schedule)
 * 6. After year 5: IUL interest credits applied as principal-only payments each year
 * 7. Home appreciates 5% annually, updating HELOC capacity
 * 8. Track all values for 30-year cascading projection
 *
 * AG 49 Compliance: 7.5% max illustrated rate
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MortgageKillerInput {
  mortgageBalance: number;
  mortgageRate: number;
  mortgageTermMonths: number;
  monthlyMortgagePayment: number;
  monthlyInterestOnlyPayment: number;
  totalInterestPayments: number;
  homeEquityValue: number;
  homeMarketValue: number;
  iraValue: number;
  cashValue: number;
  investments: number;
  annuities: number;
  otherInvestments: number;
  cryptocurrency: number;
  annualIncome: number;
  incomeAllocationPct?: number;
  iulCreditRate?: number;
  premiumYears?: number;
  helocRate?: number;
  helocLtvPct?: number;
  helocDrawPct?: number;
  policyLoanPct?: number;
  policyLoanDragRate?: number;
  interestReinvestRate?: number;
  interestReinvestYears?: number;
  clientAge?: number;

  // ── Evidence-driven paths (optional). When absent the engine falls back to its flat
  // constants, so every existing caller and test is unchanged. The server builds these
  // from zip_series / market_data_points and passes them in; the engine stays pure. ──
  /** Which appreciation the projection uses. Default "flat". */
  appreciationMode?: "flat" | "zip-history" | "zip-history-real";
  /** Annual home-appreciation rate for projection years 1..N (decimal, e.g. 0.042). Used when appreciationMode !== "flat". Shorter than 30 → last value carries forward. */
  appreciationPath?: number[];
  /** Monetary-inflation overlay: annual CPI (or M2-implied) inflation for years 1..N. When appreciationMode is "zip-history-real" the path is deflated by this so the answer is in today's dollars. */
  inflationPath?: number[];
  /** Annual property tax as a share of home value for years 1..N (e.g. 0.0112). Carried into the cascading projection as a carrying cost when present. */
  propertyTaxRatePath?: number[];
  /** Annual HELOC rate for years 1..N (decimal). When present it replaces the single helocRate year by year. */
  helocRatePath?: number[];
}

/** Rate for projection year `y` (1-based) from a path, carrying the last value forward; `fallback` when no path. */
export function rateForYear(path: number[] | undefined, y: number, fallback: number): number {
  if (!path || path.length === 0) return fallback;
  const i = Math.min(Math.max(y - 1, 0), path.length - 1);
  const v = path[i];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Cumulative growth factor after `y` years along a path (∏(1+r)), or (1+flat)^y when no path. */
export function growthFactor(path: number[] | undefined, y: number, flat: number): number {
  if (!path || path.length === 0) return Math.pow(1 + flat, y);
  let f = 1;
  for (let k = 1; k <= y; k++) f *= 1 + rateForYear(path, k, flat);
  return f;
}

/** Build the effective appreciation path from the input's mode: flat → undefined; zip-history → the path; zip-history-real → path deflated by inflationPath. */
export function effectiveAppreciationPath(input: Pick<MortgageKillerInput, "appreciationMode" | "appreciationPath" | "inflationPath">): number[] | undefined {
  const mode = input.appreciationMode ?? "flat";
  if (mode === "flat" || !input.appreciationPath || input.appreciationPath.length === 0) return undefined;
  if (mode === "zip-history") return input.appreciationPath;
  // real: (1+nominal)/(1+inflation) − 1, year by year
  return input.appreciationPath.map((r, i) => {
    const infl = rateForYear(input.inflationPath, i + 1, 0);
    return (1 + r) / (1 + infl) - 1;
  });
}

export interface AmortizationRow {
  month: number;
  year: number;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  extraPrincipal?: number;
  source?: "regular" | "iul_loan" | "iul_credit" | "heloc";
}

export interface IULPolicyYear {
  year: number;
  premium: number;
  premiumSource: "heloc" | "income" | "none";
  cashValue: number;
  surrenderValue: number;
  policyLoan: number;
  policyLoanAppliedTo: "mortgage_principal";
  netCashValue: number;
  cumulativePolicyLoans: number;
  loanDragCost: number;
  loanableValue: number;
  interestCredit: number;
  interestCreditAppliedToPrincipal: number;
}

export interface HELOCYear {
  year: number;
  drawAmount: number;
  purpose: string;
  balance: number;
  interestPaid: number;
  cumulativeInterest: number;
  repaymentFromSavings: number;
}

export interface CascadingProjectionYear {
  year: number;
  homeValue: number;
  homeEquity: number;
  helocBalance: number;
  helocInterestPaid: number;
  helocInterestOnlyPayment: number;
  iulPremium: number;
  iulCashValue: number;
  iulSurrenderValue: number;
  iulInterestCredit: number;
  lifeLoanAmount: number;
  lifeLoanCumulative: number;
  mortgageBalance: number;
  mortgageInterestPaid: number;
  principalOnlyPayment: number;
  principalPaymentSource: string;
  mortgageMonthlyPayment: number;
  homeAppreciation: number;
  netWorth: number;
  /** Property tax for the year when a propertyTaxRatePath was supplied; 0 otherwise. Reduces cash flow and net-worth build. */
  propertyTax: number;
}

export interface InterestSavingsRow {
  year: number;
  interestSaved: number;
  cumulativeSaved: number;
  compoundedValue: number;
  mgaAnnuityValue: number;
}

export interface MortgageKillerResult {
  currentPlan: {
    schedule: AmortizationRow[];
    totalInterest: number;
    totalPayments: number;
    payoffMonths: number;
    monthlyPayment: number;
  };
  recommendedPlan: {
    schedule: AmortizationRow[];
    totalInterest: number;
    totalPayments: number;
    payoffMonths: number;
    monthlyPayment: number;
    extraPayments: { month: number; amount: number; source: string }[];
  };
  iulPolicy: IULPolicyYear[];
  helocSchedule: HELOCYear[];
  cascadingProjection: CascadingProjectionYear[];
  interestSavings: {
    totalInterestSaved: number;
    compoundedValue20yr: number;
    mgaAnnuityValue30yr: number;
    yearByYear: InterestSavingsRow[];
  };
  summary: {
    yearsSaved: number;
    monthsSaved: number;
    totalInterestSaved: number;
    totalWealthCreated: number;
    /** The same saved-interest dollars if parked in a MYGA instead — an alternative, never additive. */
    alternativeMygaDeployment: number;
    mortgageFreeDate: string;
    originalPayoffDate: string;
    annualIulPremium: number;
    totalIulPremiums: number;
    totalPolicyLoans: number;
    totalHelocDrawn: number;
    totalHelocInterest: number;
    finalPolicyCashValue: number;
    totalAssets: number;
    debtFreeYear: number;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** The flat appreciation assumption the projection uses when no ZIP path is supplied. Exported so the forecast overlay can preserve it. */
export const HOME_APPRECIATION_RATE = 0.05;
const MAX_PREMIUM_YEARS = 5;
const HELOC_LTV_DEFAULT = 0.70;
const LIFE_LOAN_PCT = 0.80;
const MGA_RATE = 0.0625;

// ─── Where these numbers come from ──────────────────────────────────────────
// Every typed-in number in this file is listed here: either a named, dated
// source, or an assumption the firm chose and says it chose. None of these
// objects is read by the arithmetic; they exist so the page can print them.

/** HOME_APPRECIATION_RATE = 0.05. FHFA all-transactions index 60.04 (1975 Q1) to 719.87 (2026 Q2) compounds to 4.97% a year. */
const HOME_APPRECIATION_SOURCE = {
  label: "U.S. Federal Housing Finance Agency, All-Transactions House Price Index for the United States (USSTHPI, via FRED): 60.04 in 1975 Q1 to 719.87 in 2026 Q2, a compound 4.97% a year, which rounds to the 5% used here",
  url: "https://fred.stlouisfed.org/series/USSTHPI",
  asOf: "2026 Q2 observation, read 2026-09-23",
  note: "The same index compounds to 3.36% a year over the 20 years to 2026 Q2 and 6.81% over the 10 years to 2026 Q2; 5% is the full-history figure, not a recent one.",
};

/** helocRate default 0.085. Compared with the Bankrate national HELOC average and the prime rate it is priced from. */
const HELOC_RATE_SOURCE = {
  label: "Bankrate Monitor National Index, Home Equity Line of Credit rate (BRMHELOC01, via FRED): 7.29% for the week of 2026-09-02",
  url: "https://fred.stlouisfed.org/series/BRMHELOC01",
  asOf: "2026-09-02 observation, read 2026-09-23",
  note: "The default HELOC rate here is 8.5%, 1.21 points above this national average. Not changed; flagged for review.",
};
const PRIME_RATE_SOURCE = {
  label: "Board of Governors of the Federal Reserve System, H.15 Selected Interest Rates, Bank Prime Loan Rate (DPRIME, via FRED): 6.75% on 2026-09-02",
  url: "https://fred.stlouisfed.org/series/DPRIME",
  asOf: "2026-09-02 observation, read 2026-09-23",
  note: "HELOCs are usually priced as prime plus a margin; the 8.5% default equals prime plus 1.75 points, and that margin is the firm's assumption.",
};

/** mortgageRate is typed in by the client; this is the market reference for it, not a literal in this file. */
const MORTGAGE_RATE_REFERENCE_SOURCE = {
  label: "Freddie Mac, Primary Mortgage Market Survey, 30-Year Fixed Rate Mortgage Average in the United States (MORTGAGE30US, via FRED): 6.66% for the week ending 2026-08-27",
  url: "https://fred.stlouisfed.org/series/MORTGAGE30US",
  asOf: "2026-08-27 observation, read 2026-09-23",
  note: "Reference only: the engine uses the mortgage rate the client enters.",
};

/** MGA_RATE = 0.0625. A dated 5-year MYGA rate table built from the CANNEX feed. */
const MGA_RATE_SOURCE = {
  label: "AnnuityRatesHQ, 5-Year MYGA Rates full rate table (CANNEX feed, $100,000 premium, 118 rates across 59 carriers): top rate 6.45%, market average 5.16%, median 5.20%, with 6.25% declared by two carriers",
  url: "https://annuityrateshq.com/myga/rates/5-year",
  asOf: "table as of 2026-09-18, read 2026-09-23",
  note: "6.25% is a real declared rate near the top of the market, about 1.1 points above the market average; it is not a typical rate.",
};

/** iulCreditRate default 0.075. The header calls 7.5% the AG 49 maximum; the guideline states a formula, not a number. */
const AG49_SOURCE = {
  label: "NAIC, Actuarial Guideline XLIX-A, The Application of the Life Illustrations Model Regulation to Policies with Index-Based Interest, Section 4 (illustrated scale) and Section 6 (policy loan leverage)",
  url: "https://content.naic.org/sites/default/files/inline-files/AG%2049A%28posted%29.pdf",
  asOf: "guideline effective for policies sold on or after 2020-12-14, read 2026-09-23",
  note: "AG 49-A caps the illustrated rate at the lesser of the benchmark index account lookback average and 145% of the insurer's net investment earnings rate, set per carrier and per year. It names no 7.5% figure; 7.5% is the firm's assumed credit rate and must not exceed the carrier's own AG 49-A maximum.",
};

const MORTGAGE_KILLER_ASSUMPTIONS = [
  { label: "Assumption: maximum IUL premium years = 5 (MAX_PREMIUM_YEARS), chosen by the firm because the strategy funds premiums from the HELOC only over a short, fixed schedule; no external source" },
  { label: "Assumption: HELOC loan-to-value = 70% (HELOC_LTV_DEFAULT), chosen by the firm because it leaves headroom below the 80% combined LTV most lenders quote; no external source" },
  { label: "Assumption: policy loan = 80% of surrender value (LIFE_LOAN_PCT), chosen by the firm because it keeps a cushion against lapse; the carrier's contract sets the true limit; no external source" },
  { label: "Assumption: IUL credit rate = 7.5% a year (iulCreditRate default), chosen by the firm as an illustration rate; see the NAIC AG 49-A note, the carrier's filed maximum governs; no external source for the figure itself" },
  { label: "Assumption: IUL premium = 20% of annual income (incomeAllocationPct default), chosen by the firm because it is a planning share of income, not a carrier or regulatory figure; no external source" },
  { label: "Assumption: policy loan carrying cost = 5% a year (policyLoanDragRate default), chosen by the firm to approximate a carrier loan rate; no external source" },
  { label: "Assumption: saved interest reinvested at 7% a year for 20 years (interestReinvestRate, interestReinvestYears defaults), chosen by the firm as a long-run balanced return; no external source" },
  { label: "Assumption: client age = 45 when none is entered (clientAge default), chosen by the firm as a mid-career default; no external source" },
  { label: "Assumption: IUL charges are 8% premium load in year 1 and 6% in later premium years, $120 per-policy charge a year, $7.78 per $1,000 of face for years 1 to 10, face = 10 times premium, net amount at risk on 1.5 times face; chosen by the firm as a generic illustration, not any carrier's filed charges; no external source" },
  { label: "Assumption: cost of insurance rates of 0.08% (age 40 and under) rising to 2.2% (age 81 to 85), then 1.8% (86 to 90), 0.8% (91 to 95) and 0 after; chosen by the firm as a generic curve; no external source", note: "The rates fall after age 85, which no mortality table does. Not changed; flagged for review." },
  { label: "Assumption: 0.2% persistency credit on cash value from year 11, surrender charge of 37.6% of one premium in years 1 to 3 falling to zero by year 11, and 80% of each year's interest credit applied to principal after the premium years; chosen by the firm as a generic illustration; no external source" },
  { label: "Assumption: 30-year projection horizon, chosen by the firm because it matches the term of a standard mortgage; no external source" },
];

// ─── Current Plan: Standard Amortization ─────────────────────────────────────

export function buildStandardAmortization(
  balance: number,
  annualRate: number,
  termMonths: number,
  monthlyPayment?: number
): AmortizationRow[] {
  const monthlyRate = annualRate / 12;
  if (!monthlyPayment || monthlyPayment <= 0) {
    monthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
  }
  const rows: AmortizationRow[] = [];
  let remaining = balance;
  let cumInterest = 0;
  let cumPrincipal = 0;
  for (let m = 1; m <= termMonths && remaining > 0.01; m++) {
    const interest = remaining * monthlyRate;
    const principal = Math.min(monthlyPayment - interest, remaining);
    const payment = interest + principal;
    cumInterest += interest;
    cumPrincipal += principal;
    remaining = Math.max(0, remaining - principal);
    rows.push({
      month: m,
      year: Math.ceil(m / 12),
      beginningBalance: Math.round((remaining + principal) * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      endingBalance: Math.round(remaining * 100) / 100,
      cumulativeInterest: Math.round(cumInterest * 100) / 100,
      cumulativePrincipal: Math.round(cumPrincipal * 100) / 100,
    });
  }
  return rows;
}

// ─── IUL Policy Projection (v4) ─────────────────────────────────────────────

function projectIulPolicy(
  annualPremium: number,
  projectionYears: number,
  creditRate: number,
  premiumYears: number,
  lifeLoanPct: number,
  loanDragRate: number,
  issueAge: number,
  mortgagePaidOffYear: number
): IULPolicyYear[] {
  let cv = 0;
  let cumulativePolicyLoans = 0;
  // The carrying cost of policy loans, accumulated. Before this was wired the
  // per-year figure was computed, written into the row, displayed — and
  // subtracted from nothing. A cost that reduces no total is not a cost.
  let cumulativeLoanDrag = 0;
  const rows: IULPolicyYear[] = [];
  const specifiedAmount = annualPremium * 10;
  const perUnitCharge = (specifiedAmount / 1000) * 7.78;

  for (let y = 1; y <= projectionYears; y++) {
    const age = issueAge + y;
    const premium = y <= premiumYears ? annualPremium : 0;
    const premiumLoadRate = y === 1 ? 0.08 : (y <= premiumYears ? 0.06 : 0);
    const premiumLoad = premium * premiumLoadRate;
    const perPolicyCharge = 120;
    const perUnitCost = y <= 10 ? perUnitCharge : 0;
    const netAmountAtRisk = Math.max(0, specifiedAmount * 1.5 - cv);
    const baseCOIRate = age <= 40 ? 0.0008 : age <= 50 ? 0.0012 : age <= 55 ? 0.0018 :
      age <= 60 ? 0.0028 : age <= 65 ? 0.0042 : age <= 70 ? 0.0065 :
      age <= 75 ? 0.0100 : age <= 80 ? 0.0160 : age <= 85 ? 0.0220 :
      age <= 90 ? 0.0180 : age <= 95 ? 0.0080 : 0;
    const coiCharge = netAmountAtRisk * baseCOIRate;
    const conditionalCredit = y >= 11 ? cv * 0.002 : 0;
    const netPremium = premium - premiumLoad;
    const beginningValue = cv + netPremium;
    const totalCharges = perPolicyCharge + perUnitCost + coiCharge;
    const afterCharges = Math.max(0, beginningValue - totalCharges + conditionalCredit);
    const interestEarned = afterCharges * creditRate;
    cv = afterCharges + interestEarned;

    const baseCharge = annualPremium * 0.376;
    let surrenderCharge = 0;
    if (y <= 3) surrenderCharge = baseCharge;
    else if (y < 11) surrenderCharge = baseCharge * ((11 - y) / 7);
    const surrenderValue = Math.max(0, cv - surrenderCharge);

    const loanDragCost = cumulativePolicyLoans * loanDragRate;
    cumulativeLoanDrag += loanDragCost;

    // Life loan strategy:
    // Year 2: take 80% of surrender value as life loan → principal-only mortgage payment
    // Years 3-5: take 80% of NEW surrender value (incremental) → principal-only
    // After year 5: interest credits applied to principal-only mortgage payment
    let policyLoan = 0;
    let loanableValue = 0;
    let interestCreditAppliedToPrincipal = 0;

    if (y <= mortgagePaidOffYear) {
      if (y >= 2 && y <= premiumYears) {
        // During premium years (starting year 2): take 80% of surrender value as life loan
        const grossLoanable = surrenderValue * lifeLoanPct;
        const netLoanable = Math.max(0, grossLoanable - cumulativePolicyLoans);
        if (netLoanable > 0) {
          policyLoan = Math.round(netLoanable);
          loanableValue = policyLoan;
        }
      } else if (y > premiumYears) {
        // After premium years: apply interest credits + incremental life loan
        const grossLoanable = surrenderValue * lifeLoanPct;
        const netLoanable = Math.max(0, grossLoanable - cumulativePolicyLoans);
        if (netLoanable > 0) {
          policyLoan = Math.round(netLoanable);
          loanableValue = policyLoan;
        }
        // Interest credit portion applied to mortgage principal
        interestCreditAppliedToPrincipal = Math.round(interestEarned * 0.80);
      }
    }

    cumulativePolicyLoans += policyLoan;
    const premiumSource: "heloc" | "income" | "none" = y <= premiumYears ? "heloc" : "none";

    rows.push({
      year: y,
      premium: Math.round(premium),
      premiumSource,
      cashValue: Math.round(cv),
      surrenderValue: Math.round(surrenderValue),
      policyLoan,
      policyLoanAppliedTo: "mortgage_principal",
      netCashValue: Math.round(cv - cumulativePolicyLoans - cumulativeLoanDrag),
      cumulativePolicyLoans: Math.round(cumulativePolicyLoans),
      loanDragCost: Math.round(loanDragCost),
      loanableValue,
      interestCredit: Math.round(interestEarned),
      interestCreditAppliedToPrincipal,
    });
  }
  return rows;
}

// ─── HELOC Schedule (v4: 70% LTV, fund IUL yr 1-2, then yr 3+) ─────────────

function buildHelocSchedule(
  initialHomeValue: number,
  existingMortgageBalance: number,
  helocLtvPct: number,
  helocRate: number,
  annualIulPremium: number,
  premiumYears: number,
  mortgageBalanceByYear: number[],
  freedMortgagePayment: number,
  appreciationPath?: number[],
  helocRatePath?: number[]
): HELOCYear[] {
  const rows: HELOCYear[] = [];
  let helocBalance = 0;
  let cumulativeHelocInterest = 0;

  for (let y = 1; y <= 30; y++) {
    const homeValue = initialHomeValue * growthFactor(appreciationPath, y, HOME_APPRECIATION_RATE);
    const helocRateY = rateForYear(helocRatePath, y, helocRate);
    const mortgageBal = y <= mortgageBalanceByYear.length ? mortgageBalanceByYear[y - 1] : 0;
    const maxHelocCapacity = homeValue * helocLtvPct;
    const availableEquity = Math.max(0, maxHelocCapacity - mortgageBal - helocBalance);

    let draw = 0;
    let purpose = "";

    if (y <= premiumYears) {
      draw = Math.min(annualIulPremium, availableEquity);
      if (y <= 2) {
        purpose = `Fund Year ${y} IUL Premium (70% LTV HELOC)`;
      } else {
        purpose = `Fund Year ${y} IUL Premium (New 70% LTV HELOC — appreciated home)`;
      }
    }

    helocBalance += draw;
    const interestPaid = helocBalance * helocRateY;
    cumulativeHelocInterest += interestPaid;

    let repayment = 0;
    if (mortgageBal <= 0 && helocBalance > 0) {
      repayment = Math.min(helocBalance, freedMortgagePayment * 12);
      helocBalance = Math.max(0, helocBalance - repayment);
    }

    rows.push({
      year: y,
      drawAmount: Math.round(draw),
      purpose: purpose || (helocBalance > 0 ? "Interest-only — paydown from freed mortgage payment" : "Paid off"),
      balance: Math.round(helocBalance),
      interestPaid: Math.round(interestPaid),
      cumulativeInterest: Math.round(cumulativeHelocInterest),
      repaymentFromSavings: Math.round(repayment),
    });

    if (helocBalance <= 0 && y > premiumYears) break;
  }
  return rows;
}

// ─── Accelerated Amortization (v4) ──────────────────────────────────────────

function buildAcceleratedAmortization(
  balance: number,
  annualRate: number,
  termMonths: number,
  monthlyPayment: number,
  iulPolicy: IULPolicyYear[]
): { schedule: AmortizationRow[]; extraPayments: { month: number; amount: number; source: string }[]; mortgageBalanceByYear: number[] } {
  const monthlyRate = annualRate / 12;
  const rows: AmortizationRow[] = [];
  const extraPayments: { month: number; amount: number; source: string }[] = [];
  const mortgageBalanceByYear: number[] = [];
  let remaining = balance;
  let cumInterest = 0;
  let cumPrincipal = 0;

  for (let m = 1; m <= termMonths && remaining > 0.01; m++) {
    const interest = remaining * monthlyRate;
    let principal = Math.min(monthlyPayment - interest, remaining);
    const regularPayment = interest + principal;
    let extraPrincipal = 0;
    let source: "regular" | "iul_loan" | "iul_credit" | "heloc" = "regular";
    const currentYear = Math.ceil(m / 12);

    // Year 2 end (month 24): first 80% life loan → principal-only
    const isYear2End = m === 24;
    // Years 3-5 start: 80% life loan → principal-only
    const isSubsequentYearStart = m > 24 && m % 12 === 1 && currentYear <= 5;
    // After year 5: interest credits + incremental life loan → principal-only
    const isPostPremiumYearStart = m > 60 && m % 12 === 1;

    if (isYear2End) {
      const policyYear = iulPolicy.find(p => p.year === 2);
      if (policyYear && policyYear.policyLoan > 0) {
        extraPrincipal = Math.min(policyYear.policyLoan, remaining - principal);
        source = "iul_loan";
        if (extraPrincipal > 0) {
          extraPayments.push({
            month: m,
            amount: Math.round(extraPrincipal),
            source: `Year 2 Life Loan (80% of Surrender Value $${Math.round(policyYear.surrenderValue).toLocaleString()})`,
          });
        }
      }
    } else if (isSubsequentYearStart) {
      const policyYear = iulPolicy.find(p => p.year === currentYear);
      if (policyYear && policyYear.policyLoan > 0) {
        extraPrincipal = Math.min(policyYear.policyLoan, remaining - principal);
        source = "iul_loan";
        if (extraPrincipal > 0) {
          extraPayments.push({
            month: m,
            amount: Math.round(extraPrincipal),
            source: `Year ${currentYear} Life Loan (80% of Surrender Value $${Math.round(policyYear.surrenderValue).toLocaleString()})`,
          });
        }
      }
    } else if (isPostPremiumYearStart) {
      const policyYear = iulPolicy.find(p => p.year === currentYear);
      if (policyYear) {
        const totalExtra = policyYear.policyLoan + policyYear.interestCreditAppliedToPrincipal;
        if (totalExtra > 0) {
          extraPrincipal = Math.min(totalExtra, remaining - principal);
          source = "iul_credit";
          if (extraPrincipal > 0) {
            extraPayments.push({
              month: m,
              amount: Math.round(extraPrincipal),
              source: `Year ${currentYear} IUL Interest Credit + Life Loan → Principal Only`,
            });
          }
        }
      }
    }

    principal += extraPrincipal;
    cumInterest += interest;
    cumPrincipal += principal;
    remaining = Math.max(0, remaining - principal);

    rows.push({
      month: m,
      year: currentYear,
      beginningBalance: Math.round((remaining + principal) * 100) / 100,
      payment: Math.round((regularPayment + extraPrincipal) * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      endingBalance: Math.round(remaining * 100) / 100,
      cumulativeInterest: Math.round(cumInterest * 100) / 100,
      cumulativePrincipal: Math.round(cumPrincipal * 100) / 100,
      extraPrincipal: Math.round(extraPrincipal * 100) / 100,
      source,
    });

    if (m % 12 === 0 || remaining <= 0) {
      mortgageBalanceByYear.push(Math.round(remaining));
    }
    if (remaining <= 0) break;
  }

  while (mortgageBalanceByYear.length < 30) {
    mortgageBalanceByYear.push(0);
  }
  return { schedule: rows, extraPayments, mortgageBalanceByYear };
}

// ─── Cascading 30-Year Projection ───────────────────────────────────────────

function buildCascadingProjection(
  initialHomeValue: number,
  initialMortgageBalance: number,
  mortgageRate: number,
  monthlyMortgagePayment: number,
  iulPolicy: IULPolicyYear[],
  helocSchedule: HELOCYear[],
  mortgageBalanceByYear: number[],
  appreciationPath?: number[],
  propertyTaxRatePath?: number[]
): CascadingProjectionYear[] {
  const projection: CascadingProjectionYear[] = [];
  let cumulativePropertyTax = 0;

  for (let y = 1; y <= 30; y++) {
    const homeValue = initialHomeValue * growthFactor(appreciationPath, y, HOME_APPRECIATION_RATE);
    const prevHomeValue = y === 1 ? initialHomeValue : initialHomeValue * growthFactor(appreciationPath, y - 1, HOME_APPRECIATION_RATE);
    const propertyTax = propertyTaxRatePath ? homeValue * rateForYear(propertyTaxRatePath, y, 0) : 0;
    const homeAppreciation = homeValue - prevHomeValue;
    const mortgageBalance = y <= mortgageBalanceByYear.length ? mortgageBalanceByYear[y - 1] : 0;
    const helocRow = helocSchedule.find(h => h.year === y);
    const helocBalance = helocRow?.balance ?? 0;
    const helocInterestPaid = helocRow?.interestPaid ?? 0;
    const homeEquity = homeValue - mortgageBalance - helocBalance;
    const iulRow = iulPolicy.find(p => p.year === y);

    const prevMortBal = y === 1 ? initialMortgageBalance : (mortgageBalanceByYear[y - 2] ?? 0);
    const avgMortBal = (prevMortBal + mortgageBalance) / 2;
    const mortgageInterestPaid = avgMortBal > 0 ? avgMortBal * mortgageRate : 0;

    let principalPayment = 0;
    let principalSource = "—";
    if (iulRow) {
      if (iulRow.policyLoan > 0 && y >= 2 && y <= 5) {
        principalPayment = iulRow.policyLoan;
        principalSource = `80% Life Loan ($${iulRow.policyLoan.toLocaleString()})`;
      } else if (y > 5 && (iulRow.policyLoan > 0 || iulRow.interestCreditAppliedToPrincipal > 0)) {
        principalPayment = iulRow.policyLoan + iulRow.interestCreditAppliedToPrincipal;
        principalSource = `IUL Credit + Loan ($${principalPayment.toLocaleString()})`;
      }
    }

    cumulativePropertyTax += propertyTax;
    const netWorth = (homeEquity + (iulRow?.netCashValue ?? 0)) - cumulativePropertyTax;

    projection.push({
      year: y,
      homeValue: Math.round(homeValue),
      homeEquity: Math.round(homeEquity),
      helocBalance: Math.round(helocBalance),
      helocInterestPaid: Math.round(helocInterestPaid),
      helocInterestOnlyPayment: Math.round(helocInterestPaid),
      iulPremium: iulRow?.premium ?? 0,
      iulCashValue: iulRow?.cashValue ?? 0,
      iulSurrenderValue: iulRow?.surrenderValue ?? 0,
      iulInterestCredit: iulRow?.interestCredit ?? 0,
      lifeLoanAmount: iulRow?.policyLoan ?? 0,
      lifeLoanCumulative: iulRow?.cumulativePolicyLoans ?? 0,
      mortgageBalance: Math.round(mortgageBalance),
      mortgageInterestPaid: Math.round(mortgageInterestPaid),
      principalOnlyPayment: Math.round(principalPayment),
      principalPaymentSource: principalSource,
      mortgageMonthlyPayment: mortgageBalance > 0 ? monthlyMortgagePayment : 0,
      homeAppreciation: Math.round(homeAppreciation),
      netWorth: Math.round(netWorth),
      propertyTax: Math.round(propertyTax),
    });
  }

  return projection;
}

// ─── Interest Savings Compound Calculator ────────────────────────────────────

export function calculateInterestSavings(
  currentSchedule: AmortizationRow[],
  acceleratedSchedule: AmortizationRow[],
  reinvestRate: number,
  _reinvestYears: number
): { totalInterestSaved: number; compoundedValue20yr: number; mgaAnnuityValue30yr: number; yearByYear: InterestSavingsRow[] } {
  const currentTotalInterest = currentSchedule.length > 0
    ? currentSchedule[currentSchedule.length - 1].cumulativeInterest : 0;
  const accelTotalInterest = acceleratedSchedule.length > 0
    ? acceleratedSchedule[acceleratedSchedule.length - 1].cumulativeInterest : 0;
  const totalInterestSaved = currentTotalInterest - accelTotalInterest;

  const yearByYear: InterestSavingsRow[] = [];
  let cumulativeSaved = 0;
  let compoundedValue = 0;
  let mgaAnnuityValue = 0;

  for (let y = 1; y <= 30; y++) {
    const currentYearInterest = currentSchedule.filter(r => r.year === y).reduce((s, r) => s + r.interest, 0);
    const accelYearInterest = acceleratedSchedule.filter(r => r.year === y).reduce((s, r) => s + r.interest, 0);
    const yearSaved = Math.max(0, currentYearInterest - accelYearInterest);
    cumulativeSaved += yearSaved;
    compoundedValue = (compoundedValue + yearSaved) * (1 + reinvestRate);
    mgaAnnuityValue = (mgaAnnuityValue + yearSaved) * (1 + MGA_RATE);
    yearByYear.push({
      year: y,
      interestSaved: Math.round(yearSaved),
      cumulativeSaved: Math.round(cumulativeSaved),
      compoundedValue: Math.round(compoundedValue),
      mgaAnnuityValue: Math.round(mgaAnnuityValue),
    });
  }

  return {
    totalInterestSaved: Math.round(totalInterestSaved),
    compoundedValue20yr: Math.round(compoundedValue),
    mgaAnnuityValue30yr: Math.round(mgaAnnuityValue),
    yearByYear,
  };
}

// ─── Main Orchestrator (v4) ─────────────────────────────────────────────────

export function runMortgageKillerAnalysis(input: MortgageKillerInput): MortgageKillerResult {
  const {
    mortgageBalance, mortgageRate, mortgageTermMonths, monthlyMortgagePayment,
    homeMarketValue, annualIncome,
    iraValue = 0, cashValue = 0, investments = 0, annuities = 0,
    otherInvestments = 0, cryptocurrency = 0,
    incomeAllocationPct = 0.20, iulCreditRate = 0.075,
    premiumYears = MAX_PREMIUM_YEARS,
    helocRate = 0.085, helocLtvPct = HELOC_LTV_DEFAULT,
    policyLoanPct = LIFE_LOAN_PCT, policyLoanDragRate = 0.05,
    interestReinvestRate = 0.07, interestReinvestYears = 20, clientAge = 45,
  } = input;

  // helocDrawPct is accepted for backward compat but not used in v4
  const totalAssets = iraValue + cashValue + investments + annuities + otherInvestments + cryptocurrency;
  const annualIulPremium = Math.round(annualIncome * incomeAllocationPct);
  const effectivePremiumYears = Math.min(premiumYears, MAX_PREMIUM_YEARS);

  // 1. Current Plan (do nothing)
  const currentSchedule = buildStandardAmortization(mortgageBalance, mortgageRate, mortgageTermMonths, monthlyMortgagePayment);
  const currentTotalInterest = currentSchedule.length > 0 ? currentSchedule[currentSchedule.length - 1].cumulativeInterest : 0;
  const currentTotalPayments = currentSchedule.reduce((s, r) => s + r.payment, 0);

  // 2. IUL Policy first pass (project 30 years)
  const iulPolicyFirstPass = projectIulPolicy(
    annualIulPremium, 30, iulCreditRate, effectivePremiumYears, policyLoanPct, policyLoanDragRate, clientAge, 30
  );

  // 3. Accelerated amortization with life loans + interest credits
  const { schedule: accelSchedule, extraPayments, mortgageBalanceByYear } = buildAcceleratedAmortization(
    mortgageBalance, mortgageRate, mortgageTermMonths, monthlyMortgagePayment, iulPolicyFirstPass
  );

  // 4. Rebuild IUL with actual payoff year
  const mortgagePaidOffYear = Math.ceil(accelSchedule.length / 12);
  const iulPolicy = projectIulPolicy(
    annualIulPremium, 30, iulCreditRate, effectivePremiumYears, policyLoanPct, policyLoanDragRate, clientAge, mortgagePaidOffYear
  );

  // Evidence paths (undefined → the flat constants; see MortgageKillerInput)
  const appreciationPath = effectiveAppreciationPath(input);

  // 5. HELOC schedule (70% LTV draws to fund IUL premiums)
  const helocSchedule = buildHelocSchedule(
    homeMarketValue, mortgageBalance, helocLtvPct, helocRate, annualIulPremium, effectivePremiumYears, mortgageBalanceByYear, monthlyMortgagePayment,
    appreciationPath, input.helocRatePath
  );

  // 6. Cascading 30-year projection
  const cascadingProjection = buildCascadingProjection(
    homeMarketValue, mortgageBalance, mortgageRate, monthlyMortgagePayment,
    iulPolicy, helocSchedule, mortgageBalanceByYear,
    appreciationPath, input.propertyTaxRatePath
  );

  const accelTotalInterest = accelSchedule.length > 0 ? accelSchedule[accelSchedule.length - 1].cumulativeInterest : 0;
  const accelTotalPayments = accelSchedule.reduce((s, r) => s + r.payment, 0);

  // 7. Interest savings
  const interestSavings = calculateInterestSavings(currentSchedule, accelSchedule, interestReinvestRate, interestReinvestYears);

  // 8. Summary
  const currentPayoffMonths = currentSchedule.length;
  const accelPayoffMonths = accelSchedule.length;
  const monthsSaved = currentPayoffMonths - accelPayoffMonths;
  const yearsSaved = Math.floor(monthsSaved / 12);

  const now = new Date();
  const originalPayoffDate = new Date(now);
  originalPayoffDate.setMonth(originalPayoffDate.getMonth() + currentPayoffMonths);
  const mortgageFreeDate = new Date(now);
  mortgageFreeDate.setMonth(mortgageFreeDate.getMonth() + accelPayoffMonths);

  const totalPolicyLoans = iulPolicy.reduce((s, p) => s + p.policyLoan, 0);
  const totalHelocDrawn = helocSchedule.reduce((s, h) => s + h.drawAmount, 0);
  const totalHelocInterest = helocSchedule.reduce((s, h) => s + h.interestPaid, 0);
  const finalPolicyCv = iulPolicy.length > 0 ? iulPolicy[iulPolicy.length - 1].cashValue : 0;

  const helocPaidOffYear = helocSchedule.length > 0
    ? helocSchedule.findIndex(h => h.balance <= 0 && h.year > effectivePremiumYears) + 1 || helocSchedule.length : 0;
  const debtFreeYear = Math.max(mortgagePaidOffYear, helocPaidOffYear);

  return {
    currentPlan: {
      schedule: currentSchedule,
      totalInterest: Math.round(currentTotalInterest),
      totalPayments: Math.round(currentTotalPayments),
      payoffMonths: currentPayoffMonths,
      monthlyPayment: monthlyMortgagePayment,
    },
    recommendedPlan: {
      schedule: accelSchedule,
      totalInterest: Math.round(accelTotalInterest),
      totalPayments: Math.round(accelTotalPayments),
      payoffMonths: accelPayoffMonths,
      monthlyPayment: monthlyMortgagePayment,
      extraPayments,
    },
    iulPolicy,
    helocSchedule,
    cascadingProjection,
    interestSavings,
    summary: {
      yearsSaved, monthsSaved,
      totalInterestSaved: interestSavings.totalInterestSaved,
      // The saved-interest dollars are reinvested ONCE. compoundedValue20yr and
      // mgaAnnuityValue30yr are two alternative deployments of the same dollars
      // (reinvest at the client's rate, or park in a MYGA); summing both counted
      // every saved dollar twice. Wealth created = the reinvested savings plus
      // the policy's cash value; the MYGA path is reported beside it, not added.
      totalWealthCreated: interestSavings.compoundedValue20yr + finalPolicyCv,
      alternativeMygaDeployment: interestSavings.mgaAnnuityValue30yr,
      mortgageFreeDate: mortgageFreeDate.toISOString().slice(0, 10),
      originalPayoffDate: originalPayoffDate.toISOString().slice(0, 10),
      annualIulPremium,
      totalIulPremiums: annualIulPremium * effectivePremiumYears,
      totalPolicyLoans, totalHelocDrawn, totalHelocInterest,
      finalPolicyCashValue: finalPolicyCv,
      totalAssets, debtFreeYear,
    },
  };
}

// ─── Sources ─────────────────────────────────────────────────────────────────

/** Every source and declared assumption behind the typed-in numbers in this engine, for the page to print. */
export const MORTGAGE_KILLER_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  HOME_APPRECIATION_SOURCE,
  HELOC_RATE_SOURCE,
  PRIME_RATE_SOURCE,
  MORTGAGE_RATE_REFERENCE_SOURCE,
  MGA_RATE_SOURCE,
  AG49_SOURCE,
  ...MORTGAGE_KILLER_ASSUMPTIONS,
];
