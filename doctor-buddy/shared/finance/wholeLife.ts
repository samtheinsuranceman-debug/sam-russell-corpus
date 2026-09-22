/**
 * Participating whole life, and the thing people call infinite banking.
 *
 * Ported from the Russell Capital `wholeLifeBanking.ts` engine and extended
 * with the two things that turn a demonstration into a plan: cost basis, and a
 * distribution sequence that spends it before it borrows.
 *
 * ── The mechanism, without the mythology ────────────────────────────────────
 *
 * You are not becoming your own bank. You lend yourself nothing. The insurer
 * lends you ITS money and holds your cash value as collateral, and it charges
 * interest for that. The advantage, where there is one, is that the collateral
 * keeps earning while the loan is outstanding — not that the loan is free.
 *
 * Two contract terms decide whether the advantage exists at all:
 *
 *   1. **Direct recognition.** A non-direct-recognition carrier pays the same
 *      dividend whether or not a loan is outstanding. That is the entire basis
 *      of "your money keeps working while you spend it". A direct-recognition
 *      carrier adjusts the dividend on the borrowed portion, and the claim
 *      weakens by exactly that adjustment.
 *
 *   2. **The base / PUA split.** Premium into the base policy buys a
 *      guaranteed cash value schedule slowly, because first-year acquisition
 *      cost comes out of it. Premium into a paid-up additions rider buys cash
 *      value almost immediately, less a load of roughly 5-10%. A design that
 *      is mostly base is a life insurance policy. A design that is mostly PUA
 *      is a banking instrument. The difference is not the carrier; it is how
 *      the contract was written.
 *
 * ── Cost basis, which almost every presentation omits ───────────────────────
 *
 * Dividends taken in CASH are a return of premium and are not taxable until
 * cumulative dividends received exceed the cost basis — the premiums paid.
 * Beyond that point the excess is ordinary income. Dividends taken as paid-up
 * additions are not a taxable event at all and do not touch the basis.
 *
 * This creates a window nobody uses. A policy funded with $500,000 of premium
 * carries $500,000 of basis. Cash dividends can be drawn against that basis for
 * years, entirely tax-free, with NO loan and therefore no loan interest, before
 * a single dollar needs to be borrowed.
 *
 * The standard presentation skips it and goes straight to loans. That leaves
 * the basis unused — and since the death benefit is income-tax-free anyway, an
 * unused basis is worth nothing to anyone. `sequencedIncome` below spends the
 * basis first and only then borrows, which is why it produces less lifetime
 * loan interest and a later, smaller loan balance than the usual design.
 *
 * ── What is not in here ─────────────────────────────────────────────────────
 *
 * No carrier's numbers. A participating whole life policy is defined by two
 * tables only the carrier publishes — the guaranteed cash value schedule and
 * the dividend scale — and neither can be derived. Both are inputs. Bring the
 * illustration and they drop straight in.
 */

export type DividendOptionKind = 'paidUpAdditions' | 'cash' | 'accumulateAtInterest' | 'reducePremium';

export interface WholeLifeTerms {
  /** Annual base policy premium. */
  basePremium: number;
  /** Annual paid-up additions rider premium. */
  puaPremium: number;
  payYears: number;
  /**
   * Guaranteed cash value at the end of each policy year, from the contract.
   * Index 0 is policy year 1. Empty means none was supplied, and the engine
   * says so rather than inventing one.
   *
   * IMPORTANT: a carrier's guaranteed net cash value column already includes
   * the guaranteed value of the paid-up additions bought by the PUA RIDER
   * premium. When this schedule is supplied the engine must not build that
   * value a second time from `puaPremium` — see `scheduleIncludesRiderPua`.
   */
  guaranteedCashValueByYear: number[];
  /**
   * Whether the supplied schedule already contains the rider's paid-up
   * additions. True for every real carrier illustration.
   *
   * Getting this wrong is not a rounding error. Against the Lafayette Patriot
   * 2022 illustration, double-counting the rider overstated year-10 cash value
   * by 60% and year-40 by 118%. The illustration is what caught it, which is
   * the entire argument for insisting on one.
   */
  scheduleIncludesRiderPua: boolean;
  /**
   * Where no guaranteed schedule is supplied, the base premium is modelled as
   * building cash value on this curve. Clearly an approximation, reported as
   * one, and only used to keep the shape of the first decade visible.
   */
  approximateBaseIfNoSchedule: boolean;
  /** Current dividend interest rate. Not guaranteed. */
  dividendScalePct: number;
  /** Share of a PUA premium that becomes cash value at once. Typically 88-95%. */
  puaEfficiencyPct: number;
  /** Does the carrier adjust the dividend on the borrowed portion? */
  directRecognition: boolean;
  /** Dividend rate applied to the borrowed portion under direct recognition. */
  dividendOnLoanedPortionPct?: number;
  loanRatePct: number;
}

export interface WholeLifeYear {
  year: number;
  age: number;
  premium: number;
  cumulativePremium: number;
  /** Premiums paid less tax-free amounts already taken out. */
  costBasis: number;
  guaranteedCashValue: number;
  puaCashValue: number;
  dividend: number;
  /** Dividend taken in cash this year, if any. */
  dividendTakenInCash: number;
  /** Of that cash, the part still inside basis and therefore not taxable. */
  taxFreeCash: number;
  /** The part beyond basis, taxable as ordinary income. */
  taxableCash: number;
  loanDrawn: number;
  loanBalance: number;
  loanInterest: number;
  totalCashValue: number;
  netSurrenderValue: number;
  /** Everything that reached the policyholder this year, after tax. */
  spendableIncome: number;
  lapsed: boolean;
}

export interface WholeLifeResult {
  rows: WholeLifeYear[];
  totalPremium: number;
  totalDividends: number;
  totalLoanInterest: number;
  totalTaxFreeCash: number;
  totalTaxableCash: number;
  totalTaxPaid: number;
  totalSpendable: number;
  breakEvenYear: number | null;
  yearsUnderwater: number;
  lapseYear: number | null;
  finalCashValue: number;
  finalNetSurrenderValue: number;
  finalLoanBalance: number;
  notes: string[];
}

/**
 * Base-policy cash value approximation, used only when no contract schedule is
 * supplied.
 *
 * Two things are modelled here, and the second one is easy to get wrong.
 *
 * **The first decade.** Year one is near zero because acquisition cost comes
 * out of it. The curve climbs steeply and levels off around year ten. This is
 * the part that makes a base-heavy design illiquid early, and it is the
 * clearest difference between a base dollar and a PUA dollar.
 *
 * **The permanent gap.** A base premium dollar buys materially more death
 * benefit than a PUA dollar does, and it carries that mortality cost for the
 * life of the contract. So base cash value does not converge on premiums paid
 * — it settles below them. An earlier version of this curve converged on 1.0,
 * which made a 100%-base design and a 10%-base design produce almost the same
 * cash value after a decade. That is false, and it quietly contradicted the
 * whole reason the split is the design decision.
 *
 * `BASE_CV_CEILING` is where the curve settles. It is a shape, not a carrier's
 * table, and anything built on it is reported as approximate. Supply the
 * contract's guaranteed cash value schedule and none of this is used.
 */
const BASE_CV_CURVE = [0.02, 0.20, 0.36, 0.49, 0.58, 0.65, 0.70, 0.74, 0.77, 0.80];
const BASE_CV_CEILING = 0.86;

function approximateBaseCashValue(basePremium: number, year: number, payYears: number): number {
  const cumulative = basePremium * Math.min(year, payYears);
  const factor = year <= BASE_CV_CURVE.length
    ? BASE_CV_CURVE[year - 1]
    : Math.min(BASE_CV_CEILING, BASE_CV_CURVE[BASE_CV_CURVE.length - 1] + (year - BASE_CV_CURVE.length) * 0.006);
  return cumulative * factor;
}

export interface IncomePlan {
  /** Policy year income begins. */
  startYear: number;
  /** Target annual income, before tax. */
  annualTarget: number;
  years: number;
  /**
   * How income is taken.
   *
   *  - `loansOnly`      the usual presentation: borrow from day one.
   *  - `basisFirst`     take cash dividends while they are inside basis and
   *                     tax-free, then switch to loans. Fewer loan-years,
   *                     less interest, a later and smaller loan balance.
   *  - `dividendsOnly`  live on the cash dividend alone, whatever it is, and
   *                     never borrow. The most conservative version.
   */
  mode: 'loansOnly' | 'basisFirst' | 'dividendsOnly';
  /** Marginal rate applied to any dividend taken beyond basis. */
  marginalRatePct: number;
}

export interface WholeLifeInput {
  terms: WholeLifeTerms;
  issueAge: number;
  years: number;
  income?: IncomePlan;
}

export function runWholeLife(input: WholeLifeInput): WholeLifeResult {
  const { terms, issueAge, years, income } = input;

  let puaCashValue = 0;
  let loanBalance = 0;
  let cumulativePremium = 0;
  let costBasis = 0;
  let totalDividends = 0;
  let totalLoanInterest = 0;
  let totalTaxFreeCash = 0;
  let totalTaxableCash = 0;
  let totalTaxPaid = 0;
  let totalSpendable = 0;
  let breakEvenYear: number | null = null;
  let yearsUnderwater = 0;
  let lapseYear: number | null = null;

  const rows: WholeLifeYear[] = [];

  for (let y = 1; y <= years; y++) {
    const age = issueAge + y - 1;

    if (lapseYear !== null) {
      rows.push({
        year: y, age, premium: 0, cumulativePremium, costBasis: 0,
        guaranteedCashValue: 0, puaCashValue: 0, dividend: 0, dividendTakenInCash: 0,
        taxFreeCash: 0, taxableCash: 0, loanDrawn: 0, loanBalance, loanInterest: 0,
        totalCashValue: 0, netSurrenderValue: 0, spendableIncome: 0, lapsed: true,
      });
      continue;
    }

    // ── Premium in. Basis rises by every dollar paid.
    const premium = y <= terms.payYears ? terms.basePremium + terms.puaPremium : 0;
    cumulativePremium += premium;
    costBasis += premium;

    // Rider PUAs are added here ONLY when the supplied schedule does not
    // already carry them. With a real illustration it does, and adding them
    // again double-counts the largest component of the design.
    const riderPuaAlreadyInSchedule =
      terms.guaranteedCashValueByYear.length > 0 && terms.scheduleIncludesRiderPua;
    if (premium > 0 && terms.puaPremium > 0 && !riderPuaAlreadyInSchedule) {
      puaCashValue += terms.puaPremium * (terms.puaEfficiencyPct / 100);
    }

    const guaranteed = terms.guaranteedCashValueByYear[y - 1]
      ?? (terms.approximateBaseIfNoSchedule ? approximateBaseCashValue(terms.basePremium, y, terms.payYears) : 0);

    // Dividends are credited on the whole contract — the scheduled value and
    // the additions bought by earlier dividends alike.
    const cashValueBeforeDividend = guaranteed + puaCashValue;

    // ── The dividend.
    let dividend: number;
    if (terms.directRecognition && loanBalance > 0) {
      const borrowed = Math.min(loanBalance, cashValueBeforeDividend);
      const unborrowed = Math.max(0, cashValueBeforeDividend - borrowed);
      const loanedRate = (terms.dividendOnLoanedPortionPct ?? terms.dividendScalePct) / 100;
      dividend = unborrowed * (terms.dividendScalePct / 100) + borrowed * loanedRate;
    } else {
      // Non-direct recognition: the loan is invisible to the dividend. The full
      // cash value is credited, collateral included.
      dividend = cashValueBeforeDividend * (terms.dividendScalePct / 100);
    }
    totalDividends += dividend;

    // ── Income, if this year is in the distribution window.
    const drawing = !!income && y >= income.startYear && y < income.startYear + income.years;
    let dividendTakenInCash = 0, taxFreeCash = 0, taxableCash = 0, loanDrawn = 0;

    if (drawing && income) {
      let remaining = income.annualTarget;

      if (income.mode === 'dividendsOnly' || income.mode === 'basisFirst') {
        // Take the dividend in cash. It is tax-free while it is inside basis.
        const takeable = income.mode === 'dividendsOnly'
          ? dividend
          : Math.min(dividend, Math.max(0, remaining));
        // Under basisFirst we stop taking cash once basis is gone, because past
        // that point a cash dividend is ordinary income and a loan is not.
        const withinBasis = Math.min(takeable, Math.max(0, costBasis));
        dividendTakenInCash = income.mode === 'dividendsOnly' ? takeable : withinBasis;
        taxFreeCash = Math.min(dividendTakenInCash, Math.max(0, costBasis));
        taxableCash = dividendTakenInCash - taxFreeCash;
        costBasis = Math.max(0, costBasis - taxFreeCash);
        remaining -= dividendTakenInCash;
      }

      if (income.mode !== 'dividendsOnly' && remaining > 0) {
        // Borrow the rest, capped so the loan cannot outrun the collateral.
        const capacity = Math.max(0, cashValueBeforeDividend * 0.92 - loanBalance);
        loanDrawn = Math.min(remaining, capacity);
        loanBalance += loanDrawn;
      }
    }

    // Dividends not taken in cash buy paid-up additions.
    const dividendToPua = dividend - dividendTakenInCash;
    if (dividendToPua > 0) puaCashValue += dividendToPua * (terms.puaEfficiencyPct / 100);

    // ── Loan interest accrues on the balance.
    const loanInterest = loanBalance * (terms.loanRatePct / 100);
    loanBalance += loanInterest;
    totalLoanInterest += loanInterest;

    const totalCashValue = Math.round(guaranteed + puaCashValue);
    const loanBalanceRounded = Math.round(loanBalance);
    const netSurrenderValue = Math.max(0, totalCashValue - loanBalanceRounded);

    // A loan that has eaten the collateral ends the policy — and with it the
    // tax treatment, which is the catastrophic outcome in this product.
    if (loanBalanceRounded >= totalCashValue && loanBalanceRounded > 0) lapseYear = y;

    const tax = taxableCash * ((income?.marginalRatePct ?? 0) / 100);
    const spendable = dividendTakenInCash + loanDrawn - tax;
    totalTaxFreeCash += taxFreeCash;
    totalTaxableCash += taxableCash;
    totalTaxPaid += tax;
    totalSpendable += spendable;

    if (totalCashValue < cumulativePremium) yearsUnderwater++;
    if (breakEvenYear === null && totalCashValue >= cumulativePremium && cumulativePremium > 0) {
      breakEvenYear = y;
    }

    rows.push({
      year: y, age, premium: Math.round(premium),
      cumulativePremium: Math.round(cumulativePremium),
      costBasis: Math.round(costBasis),
      guaranteedCashValue: Math.round(guaranteed),
      puaCashValue: Math.round(puaCashValue),
      dividend: Math.round(dividend),
      dividendTakenInCash: Math.round(dividendTakenInCash),
      taxFreeCash: Math.round(taxFreeCash),
      taxableCash: Math.round(taxableCash),
      loanDrawn: Math.round(loanDrawn),
      loanBalance: loanBalanceRounded,
      loanInterest: Math.round(loanInterest),
      totalCashValue,
      netSurrenderValue,
      spendableIncome: Math.round(spendable),
      lapsed: lapseYear !== null,
    });
  }

  const last = rows[rows.length - 1];
  const notes: string[] = [
    'Dividends are not guaranteed. They are a return of surplus declared annually at the carrier\'s discretion. An unbroken payment record is history, not a promise, and the scale used here is the current one.',
  ];
  if (terms.guaranteedCashValueByYear.length === 0) {
    notes.push(terms.approximateBaseIfNoSchedule
      ? 'No contract cash value schedule was supplied, so the base policy is modelled on an approximate curve. It shows the SHAPE of the first decade, not a carrier\'s figures. Bring the illustration and the real table drops in.'
      : 'No contract cash value schedule was supplied, so the guaranteed column is zero throughout and only paid-up additions appear.');
  }
  if (breakEvenYear !== null) {
    notes.push(`Cash value first covered the premiums paid in policy year ${breakEvenYear}. For the ${yearsUnderwater} years before that, surrendering would have returned less than was paid in.`);
  } else {
    notes.push('Cash value never reached the premiums paid over this run. On a PUA-heavy design that usually means the base is too large or the horizon too short.');
  }
  notes.push(terms.directRecognition
    ? 'This carrier uses direct recognition: the borrowed portion of cash value earns a different dividend while a loan is outstanding.'
    : 'This carrier does not use direct recognition: the dividend is unaffected by the loan. That is the basis of the claim that the money keeps working while it is borrowed — the loan still accrues interest, shown in its own column.');
  if (lapseYear !== null) {
    notes.push(`The loan balance overtook the cash value in policy year ${lapseYear}. A policy that lapses with a loan outstanding converts the entire gain to ordinary income in that year, with no cash arriving to pay it.`);
  }

  return {
    rows,
    totalPremium: Math.round(cumulativePremium),
    totalDividends: Math.round(totalDividends),
    totalLoanInterest: Math.round(totalLoanInterest),
    totalTaxFreeCash: Math.round(totalTaxFreeCash),
    totalTaxableCash: Math.round(totalTaxableCash),
    totalTaxPaid: Math.round(totalTaxPaid),
    totalSpendable: Math.round(totalSpendable),
    breakEvenYear, yearsUnderwater, lapseYear,
    finalCashValue: last?.totalCashValue ?? 0,
    finalNetSurrenderValue: last?.netSurrenderValue ?? 0,
    finalLoanBalance: last?.loanBalance ?? 0,
    notes,
  };
}

/**
 * Minimum base premium that keeps a design inside the 7-pay limit.
 *
 * Loading the PUA rider is what makes a banking design work, and loading it
 * too far is what turns the contract into a Modified Endowment Contract —
 * after which loans are taxable LIFO distributions with a 10% penalty before
 * 59½, irreversibly. The carrier runs the real 7-pay test; this is the
 * planning guide that says whether a split is even in the right territory.
 *
 * The usual well-designed range is 10-25% base. Below roughly 10% most
 * carriers will not issue it, and the MEC line is close.
 */
export function mecGuidance(basePremium: number, puaPremium: number): {
  basePct: number; verdict: 'too-base-heavy' | 'well-designed' | 'mec-risk'; message: string;
} {
  const total = basePremium + puaPremium;
  const basePct = total > 0 ? (basePremium / total) * 100 : 100;
  if (basePct > 40) {
    return { basePct, verdict: 'too-base-heavy',
      message: 'This is a life insurance policy with a rider, not a banking design. Most of the premium is buying death benefit slowly instead of cash value quickly, and early liquidity will be poor.' };
  }
  if (basePct < 10) {
    return { basePct, verdict: 'mec-risk',
      message: 'Below roughly 10% base, the contract is close to the 7-pay limit and most carriers will not issue it. Crossing that line makes it a Modified Endowment Contract — loans become taxable LIFO distributions, and the classification is irreversible.' };
  }
  return { basePct, verdict: 'well-designed',
    message: 'This split is in the usual well-designed range. The carrier runs the actual 7-pay test; ask for the MEC premium on the illustration and stay under it.' };
}

/**
 * Internal rate of return on a policy's cash value, solved numerically.
 *
 * Whole life is frequently sold on a dividend "rate" that is an interest rate
 * applied to a reserve, not a return on what you paid. This is the number a
 * client should actually compare against an alternative.
 */
export function cashValueIrr(rows: WholeLifeYear[]): number {
  if (rows.length === 0) return 0;
  const flows = rows.map(r => -r.premium);
  flows[flows.length - 1] += rows[rows.length - 1].netSurrenderValue;
  const npv = (rate: number) => flows.reduce((a, f, i) => a + f / Math.pow(1 + rate, i + 1), 0);
  let lo = -0.5, hi = 0.5;
  if (npv(lo) * npv(hi) > 0) return 0;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
  }
  return ((lo + hi) / 2) * 100;
}
