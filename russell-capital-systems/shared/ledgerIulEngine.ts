/**
 * Ledger-driven IUL engine — policy MECHANICS, year by year, from the caller's
 * own charge dollars.
 *
 * ## Mechanics, not an illustration
 *
 * This engine is arithmetic. It takes the charge dollars a carrier prints on
 * its policy-charges page (or any other dollars the caller supplies), an
 * assumed crediting rate that the visitor chooses, and the rider and loan terms
 * the caller states, and it rolls the account forward one policy year at a
 * time. It does not know any carrier's cost of insurance, loads or surrender
 * charges, and it never infers them: every charge comes in as dollars from the
 * caller. It never back-solves a cost-of-insurance rate from a ledger.
 *
 * Its output is therefore NOT an illustration. An illustration is a document a
 * carrier produces under NAIC Model 582 and Actuarial Guideline 49-A, on the
 * carrier's software, at a rate no higher than the product's AG 49-A maximum.
 * The crediting rate here may be set anywhere from 0% to 12% so the visitor can
 * see how the mechanics respond; a rate above the product's illustrated maximum
 * is flagged (`exceedsIllustratedMaximum`), never hidden. Nothing here is
 * guaranteed, and a projection is not a promise.
 *
 * ## What the recursion reproduces, and its limits
 *
 * Fed a carrier's printed annual charges, premiums, bonus credits and the
 * illustrated rate, the recursion reproduces the printed cash values closely
 * (see server/ledgerEngines.test.ts: within 0.5% on a Securian BGA III case,
 * 1.5% on a Symetra case and 4% on a Securian term-blend case, the tolerances
 * the engine red-team's reference recursion achieved). That is a check of the
 * arithmetic, not a licence to project. Charges are held at the caller's
 * dollars: a real policy's cost of insurance moves with the net amount at risk,
 * so a different premium, rate, loan or death benefit changes the charges, and
 * this engine does not move them. Re-running a design means asking the carrier
 * for a new charges report.
 *
 * ## Order of operations in a year
 *
 *   1. Premium in at the start of the year.
 *   2. Charges out: premium charge (dollars, or load % × premium), cost of
 *      insurance, policy/issue fees, rider and term-rider charges, other. They
 *      come out of the unloaned indexed value, pro rata across its segments;
 *      loaned (collateral) value is not available for charges.
 *   3. Loan: repayment, then any new loan, limited by the loan limit.
 *      Fixed and wash loans move collateral out of the indexed accounts into a
 *      loan collateral account; participating loans leave it indexed.
 *   4. Credits at the end of the year. A one-year segment credits every year.
 *      A two-year segment credits once, at its maturity, as the product of the
 *      two years' rates, and nothing in its first year — the same timing rule
 *      as `iulPolicyEngine.runPolicy` (a segment credits only at its end date,
 *      and a multi-year credit is the geometric compound of the annual rate).
 *      Collateral credits at the credited-on-loaned rate. Bonus credit dollars
 *      are added.
 *   5. Loan interest at the end of the year: capitalised, or paid by the owner.
 *   6. Surrender charge, surrender value, death benefit, lapse test.
 */
import { corridorFactor, IRC_7702_CORRIDOR_SOURCE } from './irc7702';

/* ------------------------------------------------------------------ *
 * Year series: an array by policy year, or a schedule by year band
 * ------------------------------------------------------------------ */

/** One band of a schedule. Years are policy years, 1-based and inclusive. */
export interface YearBand {
  readonly fromYear: number;
  readonly toYear: number;
  readonly value: number;
}

/**
 * A per-year input. Either an array where index 0 is policy year 1, or a list
 * of year bands. Years a band list does not cover are "not supplied".
 */
export type YearSeries = readonly number[] | readonly YearBand[];

export interface ResolvedSeries {
  /** values[y - 1] for policy year y. Uncovered years are `fill`. */
  readonly values: number[];
  /** covered[y - 1] is true when the caller supplied a value for year y. */
  readonly covered: boolean[];
}

function isBandList(s: YearSeries): s is readonly YearBand[] {
  return s.length > 0 && typeof s[0] === 'object';
}

/** Expand a YearSeries to `years` values. Later bands override earlier ones. */
export function resolveYearSeries(series: YearSeries | undefined, years: number, fill = 0): ResolvedSeries {
  const values = new Array<number>(years).fill(fill);
  const covered = new Array<boolean>(years).fill(false);
  if (!series || series.length === 0) return { values, covered };
  if (isBandList(series)) {
    for (const b of series) {
      for (let y = Math.max(1, b.fromYear); y <= Math.min(years, b.toYear); y += 1) {
        values[y - 1] = b.value;
        covered[y - 1] = true;
      }
    }
  } else {
    for (let y = 1; y <= years && y <= series.length; y += 1) {
      values[y - 1] = (series as readonly number[])[y - 1];
      covered[y - 1] = true;
    }
  }
  return { values, covered };
}

function seriesProblem(name: string, s: YearSeries | undefined): string | null {
  if (!s) return null;
  if (isBandList(s)) {
    for (const b of s) {
      if (!Number.isFinite(b.value)) return `${name}: a band value is not a finite number.`;
      if (!Number.isInteger(b.fromYear) || !Number.isInteger(b.toYear) || b.fromYear < 1 || b.toYear < b.fromYear) {
        return `${name}: band ${b.fromYear}-${b.toYear} is not a valid range of policy years.`;
      }
    }
  } else {
    for (let i = 0; i < s.length; i += 1) {
      if (!Number.isFinite((s as readonly number[])[i])) return `${name}: year ${i + 1} is not a finite number.`;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

/**
 * Annual charge DOLLARS by policy year, as the carrier prints them. Enter each
 * as a positive number (a printed "-4,800" is 4800). Supply at least one
 * component for every year of the run; the engine refuses otherwise rather
 * than treat a missing year as free.
 */
export interface LedgerIulCharges {
  /** Premium charge in dollars. Alternative: `premiumLoadPct`. */
  readonly premiumCharge?: YearSeries;
  /** Premium load as % of that year's premium. Used only where `premiumCharge` is not supplied. */
  readonly premiumLoadPct?: YearSeries;
  /** Cost of insurance, dollars. Never a rate; never back-solved. */
  readonly costOfInsurance?: YearSeries;
  /** Policy, issue, administration and per-unit charges, dollars. */
  readonly policyFees?: YearSeries;
  /** Rider charges (including an early-value rider's own charge), dollars. */
  readonly riderCharges?: YearSeries;
  /** Term rider / term insurance agreement charges, dollars. */
  readonly termRiderCharges?: YearSeries;
  /** Anything else the charges page deducts, dollars. */
  readonly other?: YearSeries;
}

export interface IndexAllocation {
  /** Share of new money and of each year's credits, in percent. Shares must sum to 100. */
  readonly sharePct: number;
  /** Segment term. 1 = annual point-to-point; 2 = two-year point-to-point, credited at maturity. */
  readonly termYears: 1 | 2;
  readonly label?: string;
}

export interface TermRider {
  readonly faceAmount: number;
  /** Last policy year the term rider is in force. The death benefit drops after it. */
  readonly endYear: number;
}

export interface DeathBenefitTerms {
  /** 'A' = level (face). 'B' = increasing (face + account value). */
  readonly option: 'A' | 'B';
  readonly faceAmount: number;
  /** Policy year from which an Option B policy is treated as Option A. */
  readonly switchToOptionAInYear?: number;
  readonly termRider?: TermRider;
  /** Apply the IRC 7702(d) cash value corridor. Default true. */
  readonly applyCorridor?: boolean;
}

/**
 * Early-value riders. They change what a walk-away owner gets, and — only
 * where the contract says so — what an owner can borrow.
 *
 *   'sve'    — Nationwide-style Surrender Value Enhancement. An adjusted
 *              (lower) surrender charge applies to a full surrender that is
 *              not a 1035 exchange. Loans, partial surrenders and the lapse
 *              test keep the UNADJUSTED charge.
 *   'waiver' — Securian EVA / Pacific SVER style. The surrender charge is
 *              waived for a surrender. Whether the waiver also raises the
 *              LOAN value is a contract question: 'yes' applies it, 'no' keeps
 *              the unadjusted charge for loans, and 'unconfirmed' (the honest
 *              default for EVA, whose loan clause no illustration prints)
 *              computes loans on the unadjusted charge and flags it.
 */
export type EarlyValueRider =
  | { readonly kind: 'none' }
  | { readonly kind: 'sve'; readonly adjustedSurrenderCharges: YearSeries }
  | { readonly kind: 'waiver'; readonly raisesLoanValue: 'yes' | 'no' | 'unconfirmed' };

export type LoanType = 'fixed' | 'wash' | 'participating';

export type LoanLimitBasis =
  /** Account value, ignoring surrender charges. */
  | 'accountValue'
  /** Account value less the surrender charge that governs loans (the unadjusted charge under SVE). */
  | 'loanValue';

export interface LoanTerms {
  readonly type: LoanType;
  /** New loan requested at the start of each year, dollars. */
  readonly requests?: YearSeries;
  /** Repayment at the start of each year, dollars. */
  readonly repayments?: YearSeries;
  /** Rate charged on the loan balance, % a year, by year (variable rates are just a schedule). */
  readonly chargedRatePct: YearSeries;
  /**
   * Rate credited on loaned (collateral) value, % a year, by year. Used by
   * fixed loans (e.g. 3% in years 1-10 and 4% from year 11). Wash loans default
   * to the charged rate. Ignored for participating loans, whose collateral
   * stays indexed.
   */
  readonly creditedOnLoanedPct?: YearSeries;
  /** Loan limit = limitPct % × basis value − existing loan. */
  readonly limit: { readonly basis: LoanLimitBasis; readonly limitPct: number };
  /** 'capitalize' adds unpaid interest to the loan each year; 'paid' means the owner pays it in cash. */
  readonly interest: 'capitalize' | 'paid';
}

export interface LedgerIulInput {
  readonly years: number;
  readonly issueAge: number;
  /** Premium paid at the start of each year, dollars. */
  readonly premiums: YearSeries;
  readonly charges: LedgerIulCharges;
  /** The visitor's assumed crediting rate, % a year. Allowed 0-12. Not capped at AG 49-A. */
  readonly assumedCreditingRatePct: number;
  /** Multiplier on the crediting rate by year (default 1). */
  readonly indexMultiplier?: YearSeries;
  /** Index bonus / additional index credit, percentage points added after the multiplier (default 0). */
  readonly indexBonusPct?: YearSeries;
  /** Bonus and additional policy credits in dollars, added at the end of the year. */
  readonly bonusCreditDollars?: YearSeries;
  /** Index allocation. Default: 100% one-year segments. */
  readonly allocation?: readonly IndexAllocation[];
  readonly deathBenefit: DeathBenefitTerms;
  /** Contract (unadjusted) surrender charge in dollars by year. Default none. */
  readonly surrenderCharges?: YearSeries;
  readonly earlyValueRider?: EarlyValueRider;
  readonly loans?: LoanTerms;
  /**
   * Timing conventions. Defaults ('annual', 'endingValue') deduct the year's
   * charges at the start of the year and credit the value left at maturity,
   * which is the reference recursion the engine red-team used. 'monthly'
   * deducts non-premium charges in twelve equal amounts at each month start;
   * 'averageMonthlyValue' credits a segment on the average of its twelve
   * month-start values in the year it matures (for a one-year segment, its
   * whole life; for a two-year segment, its second year), times the segment's
   * compounded rate. Securian BGA III ledgers are reproduced to within 0.01%
   * (one-year account) and 0.9% (50% one-year / 50% two-year) on that
   * convention. It is an inference from printed ledger lines, not a contract
   * statement: the contract's averaging rule was NOT FOUND in the illustrations.
   */
  readonly timing?: {
    readonly chargeDeduction?: 'annual' | 'monthly';
    readonly creditBase?: 'endingValue' | 'averageMonthlyValue';
  };
  /** The product's AG 49-A maximum illustrated rate, if the caller knows it. Used only to flag. */
  readonly illustratedMaximumRatePct?: number;
}

/* ------------------------------------------------------------------ *
 * Output
 * ------------------------------------------------------------------ */

export interface LedgerIulYear {
  readonly year: number;
  readonly attainedAge: number;
  readonly premium: number;
  readonly totalCharges: number;
  /** Effective annual rate for the year after multiplier and bonus, %. */
  readonly effectiveRatePct: number;
  readonly indexCredits: number;
  readonly collateralCredits: number;
  readonly bonusCredits: number;
  /** Value in two-year segments that have not matured at year end. */
  readonly valueAwaitingMaturity: number;
  readonly accountValue: number;
  /** Contract (unadjusted) surrender charge. */
  readonly surrenderCharge: number;
  /** Surrender charge on a full, non-1035 walk-away surrender after any early-value rider. */
  readonly walkAwaySurrenderCharge: number;
  /** Account value − walk-away surrender charge. */
  readonly surrenderValue: number;
  /** Account value − the surrender charge that governs loans. */
  readonly loanValue: number;
  readonly loanTaken: number;
  readonly loanRepaid: number;
  readonly loanInterestCharged: number;
  readonly loanInterestPaidInCash: number;
  readonly loanBalance: number;
  /** Collateral held outside the index (fixed and wash loans). */
  readonly loanCollateral: number;
  /** Surrender value − loan balance. */
  readonly netSurrenderValue: number;
  readonly deathBenefit: number;
  /** Death benefit − loan balance. */
  readonly netDeathBenefit: number;
  readonly termRiderInForce: boolean;
  /** The loan request was cut back to the loan limit this year. */
  readonly loanLimited: boolean;
  readonly lapsed: boolean;
}

export interface LedgerIulResult {
  readonly ok: true;
  readonly years: readonly LedgerIulYear[];
  /** First policy year in which the policy lapsed, or null. */
  readonly lapseYear: number | null;
  readonly lapseReason: string | null;
  readonly exceedsIllustratedMaximum: boolean | null;
  /** True when an EVA/SVER waiver's effect on the loan value is not confirmed and loans used the unadjusted charge. */
  readonly loanValueBasisUnconfirmed: boolean;
  readonly notes: readonly string[];
}

export type LedgerIulRun = LedgerIulResult | { readonly ok: false; readonly reason: string };

/* ------------------------------------------------------------------ *
 * The engine
 * ------------------------------------------------------------------ */

export const ASSUMED_RATE_MIN_PCT = 0;
export const ASSUMED_RATE_MAX_PCT = 12;

interface Segment {
  value: number;
  /** Policy year it was struck (start of year). */
  startYear: number;
  termYears: 1 | 2;
  allocationIndex: number;
  /** Sum of the segment's month-start values, for an average-balance credit. */
  monthlySum: number;
  monthsCounted: number;
}

const CHARGE_KEYS = ['premiumCharge', 'premiumLoadPct', 'costOfInsurance', 'policyFees', 'riderCharges', 'termRiderCharges', 'other'] as const;

function validate(input: LedgerIulInput): string | null {
  if (!Number.isInteger(input.years) || input.years < 1 || input.years > 121) return 'A run needs a whole number of policy years between 1 and 121.';
  if (!Number.isFinite(input.issueAge) || input.issueAge < 0 || input.issueAge > 121) return 'Issue age must be between 0 and 121.';
  const r = input.assumedCreditingRatePct;
  if (!Number.isFinite(r) || r < ASSUMED_RATE_MIN_PCT || r > ASSUMED_RATE_MAX_PCT) {
    return `The assumed crediting rate must be between ${ASSUMED_RATE_MIN_PCT}% and ${ASSUMED_RATE_MAX_PCT}%.`;
  }
  const named: [string, YearSeries | undefined][] = [
    ['premiums', input.premiums],
    ['indexMultiplier', input.indexMultiplier],
    ['indexBonusPct', input.indexBonusPct],
    ['bonusCreditDollars', input.bonusCreditDollars],
    ['surrenderCharges', input.surrenderCharges],
    ...CHARGE_KEYS.map((k) => [`charges.${k}`, input.charges[k]] as [string, YearSeries | undefined]),
  ];
  if (input.loans) {
    named.push(['loans.requests', input.loans.requests], ['loans.repayments', input.loans.repayments], ['loans.chargedRatePct', input.loans.chargedRatePct], ['loans.creditedOnLoanedPct', input.loans.creditedOnLoanedPct]);
  }
  if (input.earlyValueRider?.kind === 'sve') named.push(['earlyValueRider.adjustedSurrenderCharges', input.earlyValueRider.adjustedSurrenderCharges]);
  for (const [n, s] of named) {
    const p = seriesProblem(n, s);
    if (p) return p;
  }
  // Charges must be supplied for every year. A carrier that prints no charges
  // page (Nationwide prints its COI rate report only on request) cannot be run.
  const supplied = CHARGE_KEYS.filter((k) => input.charges[k] && input.charges[k]!.length > 0);
  if (supplied.length === 0) {
    return 'No charges were supplied. This engine runs only on the carrier\'s own charge dollars; ask the carrier for its policy charges report (or cost of insurance report) for this illustration. It will not estimate them.';
  }
  const coveredAny = new Array<boolean>(input.years).fill(false);
  for (const k of supplied) {
    const res = resolveYearSeries(input.charges[k], input.years);
    res.covered.forEach((c, i) => { if (c) coveredAny[i] = true; });
    if (res.values.some((v) => v < 0)) return `charges.${k}: enter charges as positive dollars (or percent), not negatives.`;
  }
  const gap = coveredAny.indexOf(false);
  if (gap >= 0) return `No charge was supplied for policy year ${gap + 1}. Supply the carrier's charges for every year of the run; a missing year is not a free year.`;
  if (resolveYearSeries(input.premiums, input.years).values.some((v) => v < 0)) return 'A premium cannot be negative.';
  const alloc = input.allocation ?? [{ sharePct: 100, termYears: 1 }];
  if (alloc.length === 0) return 'The allocation is empty.';
  const total = alloc.reduce((t, a) => t + a.sharePct, 0);
  if (alloc.some((a) => !(a.sharePct >= 0)) || Math.abs(total - 100) > 1e-6) return 'Allocation shares must be non-negative and sum to 100%.';
  if (alloc.some((a) => a.termYears !== 1 && a.termYears !== 2)) return 'Segment terms of 1 or 2 years are supported.';
  const db = input.deathBenefit;
  if (!(db.faceAmount >= 0)) return 'The face amount must be zero or more.';
  if (db.termRider && (!(db.termRider.faceAmount >= 0) || !Number.isInteger(db.termRider.endYear))) return 'A term rider needs a face amount and a whole-number end year.';
  if (input.loans) {
    const l = input.loans;
    if (!(l.limit.limitPct >= 0 && l.limit.limitPct <= 100)) return 'The loan limit percentage must be between 0 and 100.';
    if (resolveYearSeries(l.chargedRatePct, input.years).values.some((v) => v < 0)) return 'A loan rate cannot be negative.';
  }
  return null;
}

/**
 * Run the ledger recursion. Refuses (ok: false) rather than approximating a
 * missing input.
 */
export function runLedgerIul(input: LedgerIulInput): LedgerIulRun {
  const problem = validate(input);
  if (problem) return { ok: false, reason: problem };

  const N = input.years;
  const s = (x: YearSeries | undefined, fill = 0) => resolveYearSeries(x, N, fill).values;
  const premiums = s(input.premiums);
  const premCharge = resolveYearSeries(input.charges.premiumCharge, N);
  const premLoad = s(input.charges.premiumLoadPct);
  const coi = s(input.charges.costOfInsurance);
  const fees = s(input.charges.policyFees);
  const riders = s(input.charges.riderCharges);
  const term = s(input.charges.termRiderCharges);
  const other = s(input.charges.other);
  const mult = s(input.indexMultiplier, 1);
  const bonusPct = s(input.indexBonusPct);
  const bonusDollars = s(input.bonusCreditDollars);
  const sc = s(input.surrenderCharges);
  const rider: EarlyValueRider = input.earlyValueRider ?? { kind: 'none' };
  const adjustedSc = rider.kind === 'sve' ? resolveYearSeries(rider.adjustedSurrenderCharges, N) : null;
  const alloc = input.allocation ?? [{ sharePct: 100, termYears: 1 as const }];
  const monthly = input.timing?.chargeDeduction === 'monthly';
  const averageBase = input.timing?.creditBase === 'averageMonthlyValue';
  const loans = input.loans;
  const loanReq = s(loans?.requests);
  const loanRepay = s(loans?.repayments);
  const loanRate = s(loans?.chargedRatePct);
  const collateralRate = loans
    ? loans.type === 'wash' && !loans.creditedOnLoanedPct
      ? loanRate
      : s(loans.creditedOnLoanedPct)
    : [];
  const movesCollateral = loans ? loans.type !== 'participating' : false;

  const rates = Array.from({ length: N }, (_, i) => input.assumedCreditingRatePct * mult[i] + bonusPct[i]);

  const notes: string[] = [
    'Mechanics from caller-supplied charge dollars and an assumed rate. Not an illustration; not guaranteed.',
    'Charges are held at the supplied dollars and do not respond to changes in the net amount at risk.',
  ];
  let loanValueBasisUnconfirmed = false;
  if (rider.kind === 'waiver' && rider.raisesLoanValue === 'unconfirmed') {
    loanValueBasisUnconfirmed = true;
    notes.push("The early-value waiver's effect on the loan value is not confirmed by the contract; loans were limited on the unadjusted surrender charge.");
  }
  if (rider.kind === 'sve') notes.push('SVE: the adjusted surrender charge applies only to a full, non-1035 surrender. Loans, partial surrenders and the lapse test use the unadjusted charge.');
  if (movesCollateral) notes.push('Fixed and wash loans move the loaned value out of the indexed accounts; it earns the credited-on-loaned rate, not the index.');

  let segments: Segment[] = [];
  let collateral = 0;
  let loan = 0;
  let lapseYear: number | null = null;
  let lapseReason: string | null = null;
  const rows: LedgerIulYear[] = [];

  const indexedValue = () => segments.reduce((t, x) => t + x.value, 0);
  /** Remove `amount` from the indexed segments pro rata. Returns what was removed. */
  const takeProRata = (amount: number): number => {
    const total = indexedValue();
    if (amount <= 0 || total <= 0) return 0;
    const take = Math.min(amount, total);
    for (const seg of segments) seg.value -= (seg.value / total) * take;
    return take;
  };
  const strike = (amount: number, year: number) => {
    if (amount <= 0) return;
    alloc.forEach((a, k) => {
      if (a.sharePct > 0) segments.push({ value: (amount * a.sharePct) / 100, startYear: year, termYears: a.termYears, allocationIndex: k, monthlySum: 0, monthsCounted: 0 });
    });
  };
  const lapse = (y: number, age: number, reason: string) => {
    lapseYear = y;
    lapseReason = reason;
    segments = [];
    collateral = 0;
    rows.push(lapsedRow(y, age));
  };

  for (let y = 1; y <= N; y += 1) {
    const i = y - 1;
    const age = input.issueAge + i;
    if (lapseYear !== null) {
      rows.push(lapsedRow(y, age));
      continue;
    }

    // 1. Premium in, split by allocation into segments struck this year.
    const premium = premiums[i];
    strike(premium, y);

    // 2a. The premium charge comes out with the premium.
    const premiumChargeDollars = premCharge.covered[i] ? premCharge.values[i] : (premium * premLoad[i]) / 100;
    const deductions = coi[i] + fees[i] + riders[i] + term[i] + other[i];
    const charges = premiumChargeDollars + deductions;
    const upFront = premiumChargeDollars + (monthly ? 0 : deductions);
    if (upFront > indexedValue() + 1e-9) {
      lapse(y, age, `Year ${y}: the charges due exceed the unloaned account value.`);
      continue;
    }
    takeProRata(upFront);

    // 3. Loans at the start of the year: repayment, then new money against the limit.
    let loanTaken = 0;
    let loanRepaid = 0;
    let loanLimited = false;
    if (loans) {
      loanRepaid = Math.min(loanRepay[i], loan);
      if (loanRepaid > 0) {
        loan -= loanRepaid;
        if (movesCollateral) {
          const back = Math.min(loanRepaid, collateral);
          collateral -= back;
          strike(back, y); // released collateral returns to the index in the default allocation
        }
      }
      const av = indexedValue() + collateral;
      const basis = loans.limit.basis === 'accountValue' ? av : av - loanScFor(i);
      const available = Math.max(0, (loans.limit.limitPct / 100) * basis - loan);
      const req = loanReq[i];
      loanTaken = Math.min(req, available);
      loanLimited = req > available + 1e-9;
      if (loanTaken > 0) {
        loan += loanTaken;
        if (movesCollateral) collateral += takeProRata(loanTaken);
      }
    }

    // 2b. Monthly deductions (monthly timing), and each segment's monthly values for an average-balance credit.
    let lapsedInYear = false;
    for (let m = 1; m <= 12; m += 1) {
      if (monthly && deductions > 0) {
        if (deductions / 12 > indexedValue() + 1e-9) {
          lapse(y, age, `Year ${y}, month ${m}: the monthly deduction exceeds the unloaned account value.`);
          lapsedInYear = true;
          break;
        }
        takeProRata(deductions / 12);
      }
      for (const seg of segments) {
        // Only the maturity year's twelve month-start values enter the average.
        if (seg.startYear + seg.termYears - 1 !== y) continue;
        seg.monthlySum += seg.value;
        seg.monthsCounted += 1;
      }
    }
    if (lapsedInYear) continue;

    // 4. Credits at the end of the year. A segment credits only in the year it matures.
    let indexCredits = 0;
    const stillOpen: Segment[] = [];
    const matured: Segment[] = [];
    for (const seg of segments) {
      if (seg.startYear + seg.termYears - 1 !== y) {
        stillOpen.push(seg);
        continue;
      }
      let factor = 1;
      for (let yy = seg.startYear; yy <= y; yy += 1) factor *= 1 + rates[yy - 1] / 100;
      const base = averageBase && seg.monthsCounted > 0 ? seg.monthlySum / seg.monthsCounted : seg.value;
      const credit = Math.max(0, base) * (factor - 1);
      indexCredits += credit;
      matured.push({ ...seg, value: seg.value + credit });
    }
    // Matured value re-enters its own account in a fresh segment next year.
    segments = stillOpen;
    for (const m of matured) segments.push({ value: m.value, startYear: y + 1, termYears: m.termYears, allocationIndex: m.allocationIndex, monthlySum: 0, monthsCounted: 0 });
    const collateralCredits = movesCollateral ? collateral * ((collateralRate[i] ?? 0) / 100) : 0;
    collateral += collateralCredits;
    const bonusCredits = bonusDollars[i];
    strike(bonusCredits, y + 1);

    // 5. Loan interest at the end of the year.
    let interestCharged = 0;
    let interestPaid = 0;
    if (loans && loan > 0) {
      interestCharged = loan * (loanRate[i] / 100);
      if (loans.interest === 'capitalize') {
        loan += interestCharged;
        if (movesCollateral) collateral += takeProRata(interestCharged);
      } else {
        interestPaid = interestCharged;
      }
    }
    // The collateral account holds the loan balance. Interest credited on it
    // beyond the balance returns to the indexed accounts at the anniversary.
    if (movesCollateral && collateral > loan + 1e-9) {
      const excess = collateral - loan;
      collateral = loan;
      strike(excess, y + 1);
    }

    // 6. Values.
    const awaiting = segments.filter((x) => x.startYear <= y).reduce((t, x) => t + x.value, 0);
    const accountValue = indexedValue() + collateral;
    const contractSc = Math.min(sc[i], Math.max(0, accountValue));
    const walkSc = walkAwayScFor(i, contractSc);
    const surrenderValue = Math.max(0, accountValue - walkSc);
    const loanValue = Math.max(0, accountValue - Math.min(loanScFor(i), accountValue));
    const db = deathBenefitFor(y, age, accountValue);
    const row: LedgerIulYear = {
      year: y,
      attainedAge: age,
      premium,
      totalCharges: charges,
      effectiveRatePct: rates[i],
      indexCredits,
      collateralCredits,
      bonusCredits,
      valueAwaitingMaturity: awaiting,
      accountValue,
      surrenderCharge: contractSc,
      walkAwaySurrenderCharge: walkSc,
      surrenderValue,
      loanValue,
      loanTaken,
      loanRepaid,
      loanInterestCharged: interestCharged,
      loanInterestPaidInCash: interestPaid,
      loanBalance: loan,
      loanCollateral: movesCollateral ? collateral : 0,
      netSurrenderValue: surrenderValue - loan,
      deathBenefit: db.deathBenefit,
      netDeathBenefit: db.deathBenefit - loan,
      termRiderInForce: db.termInForce,
      loanLimited,
      lapsed: false,
    };
    // Lapse test: the loan may not exceed the value that governs loans.
    if (loan > 0 && loan > loanValue + 1e-6) {
      lapseYear = y;
      lapseReason = `Year ${y}: the loan balance exceeds the account value less the surrender charge that governs loans.`;
      rows.push({ ...row, lapsed: true });
      segments = [];
      collateral = 0;
      continue;
    }
    rows.push(row);
  }

  function loanScFor(i: number): number {
    if (rider.kind === 'waiver' && rider.raisesLoanValue === 'yes') return 0;
    return sc[i];
  }
  function walkAwayScFor(i: number, contractSc: number): number {
    if (rider.kind === 'waiver') return 0;
    if (rider.kind === 'sve' && adjustedSc) return Math.min(contractSc, adjustedSc.covered[i] ? adjustedSc.values[i] : contractSc);
    return contractSc;
  }
  function deathBenefitFor(y: number, age: number, av: number): { deathBenefit: number; termInForce: boolean } {
    const d = input.deathBenefit;
    const optionB = d.option === 'B' && !(d.switchToOptionAInYear !== undefined && y >= d.switchToOptionAInYear);
    const termInForce = !!d.termRider && y <= d.termRider.endYear;
    let db = d.faceAmount + (optionB ? Math.max(0, av) : 0) + (termInForce ? d.termRider!.faceAmount : 0);
    if (d.applyCorridor !== false) db = Math.max(db, Math.max(0, av) * corridorFactor(age));
    return { deathBenefit: db, termInForce };
  }
  function lapsedRow(year: number, age: number): LedgerIulYear {
    return {
      year, attainedAge: age, premium: 0, totalCharges: 0, effectiveRatePct: rates[year - 1], indexCredits: 0, collateralCredits: 0, bonusCredits: 0,
      valueAwaitingMaturity: 0, accountValue: 0, surrenderCharge: 0, walkAwaySurrenderCharge: 0, surrenderValue: 0, loanValue: 0, loanTaken: 0, loanRepaid: 0,
      loanInterestCharged: 0, loanInterestPaidInCash: 0, loanBalance: 0, loanCollateral: 0, netSurrenderValue: 0, deathBenefit: 0, netDeathBenefit: 0,
      termRiderInForce: false, loanLimited: false, lapsed: true,
    };
  }

  const max = input.illustratedMaximumRatePct;
  return {
    ok: true,
    years: rows,
    lapseYear,
    lapseReason,
    exceedsIllustratedMaximum: max === undefined ? null : input.assumedCreditingRatePct > max,
    loanValueBasisUnconfirmed,
    notes,
  };
}

/** Where the engine's non-caller inputs come from, in the shape the provenance census reads. */
export const LEDGER_IUL_ENGINE_SOURCES = [
  IRC_7702_CORRIDOR_SOURCE,
  {
    label: 'NAIC Actuarial Guideline 49-A: the maximum illustrated rate and the 0.50% cap on illustrated loan spread; this engine flags a rate above the caller-supplied product maximum rather than capping the visitor\'s assumption',
    url: 'https://content.naic.org/sites/default/files/inline-files/AG%2049A%28posted%29.pdf',
  },
] as const;
