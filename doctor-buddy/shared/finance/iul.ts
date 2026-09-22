/**
 * Indexed Universal Life policy mechanics.
 *
 * The point of this module is to be honest about where the money actually
 * goes, because that is the single thing most IUL marketing gets wrong.
 *
 * An index credit does NOT land on "all the premiums paid in." It lands on the
 * **indexed account value** — what is left after the premium load is taken off
 * the top, and after the cost of insurance, the policy fee and the per-thousand
 * administrative charge come out. Those three deductions are why a policy
 * funded at $200,000/yr does not have $1,000,000 earning interest in year five.
 *
 * Every projection this site shows runs through `projectPolicy`, so the
 * crediting base is always visible next to the premium total rather than
 * quietly conflated with it.
 *
 * Mortality is an illustrative 2017 CSO-shaped ultimate curve with a carrier
 * loading. It is not any specific carrier's rate book. Nothing here is an
 * illustration; only a carrier can issue one.
 */

/** Approximate 2017 CSO ultimate mortality, annual cost per $1,000 at risk. */
const COI_ANCHORS: Array<[age: number, per1000: number]> = [
  [25, 0.62], [30, 0.70], [35, 0.79], [40, 1.02], [45, 1.47],
  [50, 2.24], [55, 3.47], [60, 5.48], [65, 8.79], [70, 14.02],
  [75, 23.0], [80, 38.43], [85, 65.18], [90, 112.0], [95, 185.0], [100, 280.0],
];

/** Carriers charge above raw mortality; this is the loading on the table. */
export const COI_LOAD_FACTOR = 1.15;

/** Annual cost of insurance per $1,000 of net amount at risk at an attained age. */
export function coiPerThousand(age: number): number {
  if (age <= COI_ANCHORS[0][0]) return COI_ANCHORS[0][1] * COI_LOAD_FACTOR;
  const last = COI_ANCHORS[COI_ANCHORS.length - 1];
  if (age >= last[0]) return last[1] * COI_LOAD_FACTOR;
  for (let i = 1; i < COI_ANCHORS.length; i++) {
    const [a1, r1] = COI_ANCHORS[i];
    if (age <= a1) {
      const [a0, r0] = COI_ANCHORS[i - 1];
      // Geometric interpolation — mortality compounds, it does not step.
      const t = (age - a0) / (a1 - a0);
      return r0 * Math.pow(r1 / r0, t) * COI_LOAD_FACTOR;
    }
  }
  return last[1] * COI_LOAD_FACTOR;
}

export interface PolicyInputs {
  issueAge: number;
  /** Annual premium while funding. */
  premium: number;
  /** Number of years premium is paid. */
  premiumYears: number;
  /** Projection horizon in policy years. */
  years: number;
  /** Initial face amount. Minimum non-MEC face is roughly 7x-12x premium. */
  deathBenefit: number;
  dbOption: 'level' | 'increasing';
  /** Percentage of each premium taken before anything reaches the account. */
  premiumLoadPct: number;
  /** Flat annual policy fee. */
  policyFeeAnnual: number;
  /** Annual charge per $1,000 of face, typically only for the first 10 years. */
  perThousandCharge: number;
  perThousandYears: number;
  /** Credited rate(s), in percent. A single number, or a per-year series. */
  creditingRate: number | number[];
  /** Years a surrender charge applies. */
  surrenderChargeYears: number;
  /** Surrender charge in year 1, as a percent of account value; grades to zero. */
  surrenderChargePctYear1: number;
}

export interface PolicyYear {
  year: number;
  age: number;
  premium: number;
  premiumLoad: number;
  netPremium: number;
  /** Account value the index credit is actually applied to, after all charges. */
  creditingBase: number;
  creditedRate: number;
  indexCredit: number;
  costOfInsurance: number;
  policyFee: number;
  adminCharge: number;
  totalCharges: number;
  accountValue: number;
  surrenderCharge: number;
  surrenderValue: number;
  deathBenefit: number;
  cumulativePremium: number;
  /** Account value minus premiums paid. Negative early — that is normal. */
  netGain: number;
  lapsed: boolean;
}

export interface PolicyResult {
  rows: PolicyYear[];
  lapseYear: number | null;
  /** First policy year in which surrender value exceeds cumulative premium. */
  breakEvenYear: number | null;
  totalPremium: number;
  totalCharges: number;
  totalCredits: number;
  finalAccountValue: number;
  finalSurrenderValue: number;
  finalDeathBenefit: number;
}

export const DEFAULT_POLICY: Omit<PolicyInputs, 'creditingRate'> = {
  issueAge: 45,
  premium: 200_000,
  premiumYears: 5,
  years: 40,
  deathBenefit: 2_400_000,
  dbOption: 'increasing',
  premiumLoadPct: 6,
  policyFeeAnnual: 120,
  perThousandCharge: 0.35,
  perThousandYears: 10,
  surrenderChargeYears: 10,
  surrenderChargePctYear1: 18,
};

function rateForYear(rate: number | number[], year: number): number {
  if (typeof rate === 'number') return rate;
  if (rate.length === 0) return 0;
  // Repeat the series if the horizon is longer than the history supplied.
  return rate[(year - 1) % rate.length];
}

function surrenderChargeFor(inputs: PolicyInputs, year: number, accountValue: number): number {
  if (year > inputs.surrenderChargeYears || inputs.surrenderChargeYears <= 0) return 0;
  // Straight-line grade from the year-1 percentage down to zero.
  const remaining = (inputs.surrenderChargeYears - year + 1) / inputs.surrenderChargeYears;
  return accountValue * (inputs.surrenderChargePctYear1 / 100) * remaining;
}

export function projectPolicy(inputs: PolicyInputs): PolicyResult {
  const rows: PolicyYear[] = [];
  let accountValue = 0;
  let cumulativePremium = 0;
  let lapseYear: number | null = null;
  let breakEvenYear: number | null = null;
  let totalCharges = 0;
  let totalCredits = 0;

  for (let year = 1; year <= inputs.years; year++) {
    const age = inputs.issueAge + year - 1;

    if (lapseYear !== null) {
      rows.push({
        year, age, premium: 0, premiumLoad: 0, netPremium: 0, creditingBase: 0,
        creditedRate: 0, indexCredit: 0, costOfInsurance: 0, policyFee: 0,
        adminCharge: 0, totalCharges: 0, accountValue: 0, surrenderCharge: 0,
        surrenderValue: 0, deathBenefit: 0, cumulativePremium, netGain: -cumulativePremium,
        lapsed: true,
      });
      continue;
    }

    // 1. Premium in, load off the top.
    const premium = year <= inputs.premiumYears ? inputs.premium : 0;
    const premiumLoad = premium * (inputs.premiumLoadPct / 100);
    const netPremium = premium - premiumLoad;
    cumulativePremium += premium;
    accountValue += netPremium;

    // 2. Death benefit for the year. Option B adds the account value on top.
    const deathBenefit =
      inputs.dbOption === 'increasing' ? inputs.deathBenefit + accountValue : inputs.deathBenefit;

    // 3. Charges. COI is on the net amount at risk — the piece of the death
    //    benefit the carrier is actually on the hook for beyond your own money.
    const netAmountAtRisk = Math.max(0, deathBenefit - accountValue);
    const costOfInsurance = (netAmountAtRisk / 1000) * coiPerThousand(age);
    const policyFee = inputs.policyFeeAnnual;
    const adminCharge =
      year <= inputs.perThousandYears ? (inputs.deathBenefit / 1000) * inputs.perThousandCharge : 0;
    const charges = costOfInsurance + policyFee + adminCharge;

    accountValue -= charges;
    totalCharges += charges;

    if (accountValue <= 0) {
      lapseYear = year;
      rows.push({
        year, age, premium, premiumLoad, netPremium, creditingBase: 0, creditedRate: 0,
        indexCredit: 0, costOfInsurance, policyFee, adminCharge, totalCharges: charges,
        accountValue: 0, surrenderCharge: 0, surrenderValue: 0, deathBenefit: 0,
        cumulativePremium, netGain: -cumulativePremium, lapsed: true,
      });
      continue;
    }

    // 4. The index credit. This is the number the whole product turns on, and
    //    it lands HERE — on what survived steps 1-3, not on premiums paid.
    const creditingBase = accountValue;
    const creditedRate = Math.max(0, rateForYear(inputs.creditingRate, year));
    const indexCredit = creditingBase * (creditedRate / 100);
    accountValue += indexCredit;
    totalCredits += indexCredit;

    const surrenderCharge = surrenderChargeFor(inputs, year, accountValue);
    const surrenderValue = Math.max(0, accountValue - surrenderCharge);

    if (breakEvenYear === null && surrenderValue >= cumulativePremium && cumulativePremium > 0) {
      breakEvenYear = year;
    }

    rows.push({
      year, age, premium, premiumLoad, netPremium, creditingBase, creditedRate, indexCredit,
      costOfInsurance, policyFee, adminCharge, totalCharges: charges, accountValue,
      surrenderCharge, surrenderValue,
      deathBenefit: inputs.dbOption === 'increasing' ? inputs.deathBenefit + accountValue : inputs.deathBenefit,
      cumulativePremium, netGain: accountValue - cumulativePremium, lapsed: false,
    });
  }

  const last = rows[rows.length - 1];
  return {
    rows,
    lapseYear,
    breakEvenYear,
    totalPremium: cumulativePremium,
    totalCharges,
    totalCredits,
    finalAccountValue: last?.accountValue ?? 0,
    finalSurrenderValue: last?.surrenderValue ?? 0,
    finalDeathBenefit: last?.deathBenefit ?? 0,
  };
}

// ─── Policy loans ───────────────────────────────────────────────────────────

export interface LoanInputs {
  /** Policy year the distributions begin. */
  startYear: number;
  /** Years of distributions. */
  drawYears: number;
  /** Annual amount taken out. */
  annualDraw: number;
  /** Interest the carrier charges on the loan, in percent. */
  loanRate: number;
  /**
   * Participating (a.k.a. "wash" or "index") loan: the collateral stays in the
   * indexed account and keeps earning credits. This is the whole trick — the
   * money does not have to leave the account to be spendable.
   *
   * A standard/fixed loan moves the collateral to a fixed bucket at a declared
   * rate instead, so you give up the index credit on the borrowed portion.
   */
  participating: boolean;
  /** Declared rate on the collateral in a standard loan, in percent. */
  fixedCollateralRate: number;
}

export interface LoanYear {
  year: number;
  age: number;
  draw: number;
  loanBalance: number;
  loanInterest: number;
  /** Credits earned on the portion of the account value pledged as collateral. */
  collateralCredits: number;
  accountValue: number;
  netEquity: number;
  deathBenefit: number;
  /** Net death benefit after the outstanding loan is settled. */
  netDeathBenefit: number;
  lapsed: boolean;
}

export interface LoanResult {
  rows: LoanYear[];
  totalDrawn: number;
  /** Loan interest minus credits earned on the collateral. Negative is arbitrage. */
  netLoanCost: number;
  lapseYear: number | null;
  finalNetEquity: number;
  finalNetDeathBenefit: number;
}

/**
 * Layer a distribution strategy on top of a funded policy.
 *
 * The policy keeps running its own mechanics — charges still come out, credits
 * still go in — while the loan balance compounds alongside it. Lapse with an
 * outstanding loan is the real risk here and it is reported, not hidden: the
 * gain in a lapsed policy becomes taxable income in that year with no cash
 * arriving to pay the bill.
 */
export function projectLoans(policy: PolicyInputs, loan: LoanInputs): LoanResult {
  const base = projectPolicy(policy);
  const rows: LoanYear[] = [];
  let loanBalance = 0;
  let accountValue = 0;
  let totalDrawn = 0;
  let totalInterest = 0;
  let totalCollateralCredits = 0;
  let lapseYear: number | null = null;

  for (const r of base.rows) {
    if (lapseYear !== null) {
      rows.push({
        year: r.year, age: r.age, draw: 0, loanBalance, loanInterest: 0,
        collateralCredits: 0, accountValue: 0, netEquity: 0, deathBenefit: 0,
        netDeathBenefit: 0, lapsed: true,
      });
      continue;
    }

    // Re-run the year using the base projection's charges and rate, so the two
    // views cannot drift apart.
    accountValue += r.netPremium;
    accountValue -= r.totalCharges;

    const drawing =
      r.year >= loan.startYear && r.year < loan.startYear + loan.drawYears;
    const draw = drawing ? Math.min(loan.annualDraw, Math.max(0, accountValue * 0.95 - loanBalance)) : 0;
    totalDrawn += draw;

    if (accountValue <= 0) {
      lapseYear = r.year;
      rows.push({
        year: r.year, age: r.age, draw: 0, loanBalance, loanInterest: 0,
        collateralCredits: 0, accountValue: 0, netEquity: 0, deathBenefit: 0,
        netDeathBenefit: 0, lapsed: true,
      });
      continue;
    }

    // Credits. Under a participating loan the FULL account value is credited,
    // collateral included — the borrowed dollars never left. Under a standard
    // loan only the unencumbered part gets the index rate.
    const collateral = Math.min(loanBalance, accountValue);
    const unencumbered = Math.max(0, accountValue - collateral);
    const indexCredit = loan.participating
      ? accountValue * (r.creditedRate / 100)
      : unencumbered * (r.creditedRate / 100) + collateral * (loan.fixedCollateralRate / 100);
    const collateralCredits = loan.participating
      ? collateral * (r.creditedRate / 100)
      : collateral * (loan.fixedCollateralRate / 100);

    accountValue += indexCredit;
    totalCollateralCredits += collateralCredits;

    // Loan mechanics: new draw added, then interest accrues on the balance.
    loanBalance += draw;
    const loanInterest = loanBalance * (loan.loanRate / 100);
    loanBalance += loanInterest;
    totalInterest += loanInterest;

    const netEquity = accountValue - loanBalance;
    if (netEquity <= 0 && loanBalance > 0) {
      lapseYear = r.year;
    }

    const deathBenefit =
      policy.dbOption === 'increasing' ? policy.deathBenefit + accountValue : policy.deathBenefit;

    rows.push({
      year: r.year, age: r.age, draw, loanBalance, loanInterest, collateralCredits,
      accountValue, netEquity, deathBenefit,
      netDeathBenefit: Math.max(0, deathBenefit - loanBalance),
      lapsed: lapseYear !== null,
    });
  }

  const last = rows[rows.length - 1];
  return {
    rows,
    totalDrawn,
    netLoanCost: totalInterest - totalCollateralCredits,
    lapseYear,
    finalNetEquity: last?.netEquity ?? 0,
    finalNetDeathBenefit: last?.netDeathBenefit ?? 0,
  };
}

/**
 * Minimum non-MEC face amount, very roughly, by issue age.
 *
 * The 7-pay test is a carrier calculation and this is only a planning guide:
 * fund above this ratio and the contract becomes a Modified Endowment Contract,
 * which is what turns tax-free loans into taxable LIFO distributions.
 */
export function minimumNonMecFace(issueAge: number, annualPremium: number, premiumYears: number): number {
  const ratio =
    issueAge < 35 ? 14 : issueAge < 45 ? 11.5 : issueAge < 55 ? 9 : issueAge < 65 ? 7 : 5.5;
  // Shorter funding periods concentrate premium and need more face to stay clear.
  const compression = premiumYears >= 10 ? 1 : premiumYears >= 7 ? 1.1 : premiumYears >= 5 ? 1.2 : 1.45;
  return Math.round((annualPremium * ratio * compression) / 10_000) * 10_000;
}
