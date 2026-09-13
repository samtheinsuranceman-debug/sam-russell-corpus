/**
 * Participating whole life, and the thing people call infinite banking.
 *
 * This models the mechanism. It contains no carrier's numbers, because a
 * participating whole life policy is defined by two tables that only the
 * carrier publishes — the guaranteed cash value schedule and the dividend
 * scale — and neither can be guessed. Both are inputs. Bring the Lafayette
 * Life illustration and they drop straight in.
 *
 * ## What actually happens
 *
 * Premium buys a base policy with a contractually guaranteed cash value that
 * grows on a fixed schedule. Each year the carrier may declare a dividend.
 * Dividends are NOT guaranteed — they are a return of surplus, declared
 * annually at the board's discretion, and a carrier that has paid one every
 * year for a century is still not obliged to pay one next year.
 *
 * Taking the dividend as paid-up additions is what makes the design work for
 * banking: each dividend buys a small, fully paid-up slice of insurance that
 * carries its own cash value and earns its own dividends. That is where the
 * compounding comes from, and it is why a design with a large PUA rider
 * behaves so differently from a plain whole life policy.
 *
 * ## The two things a banking pitch usually leaves out
 *
 * **Direct recognition.** When you borrow against the policy, some carriers
 * pay a different dividend on the borrowed portion and some do not. A
 * non-direct-recognition carrier pays the same dividend whether or not you
 * have a loan, which is the whole basis of the "your money keeps working while
 * you spend it" claim. A direct-recognition carrier adjusts it. Which one you
 * are dealing with changes the arithmetic materially, and it is a contract
 * term, so this engine requires it to be stated.
 *
 * **The early years.** Cash value is far below premiums paid for the first
 * several years, because the first year's commission and issue costs come out
 * of it. Break-even on a well-designed PUA-heavy policy is commonly somewhere
 * between years 5 and 12. An illustration that opens at year 20 hides the
 * shape of the first decade, so this reports the break-even year explicitly
 * and reports it as null when it never arrives.
 *
 * ## On the phrase
 *
 * You are not becoming your own bank. You are lending nothing to yourself: the
 * insurer lends you ITS money and holds your cash value as collateral, and it
 * charges interest for that. The advantage, where there is one, is that the
 * collateral keeps earning while the loan is outstanding — not that the loan
 * is free. This engine shows the loan interest as its own column for that
 * reason.
 */

export interface DividendOption {
  /** What the dividend does. Paid-up additions is the banking design. */
  readonly kind: 'paidUpAdditions' | 'cash' | 'reducePremium' | 'accumulateAtInterest';
  /** Rate paid on accumulated dividends, if that option is chosen. */
  readonly accumulationRatePct?: number;
}

export interface WholeLifeTerms {
  /** Annual base premium. */
  readonly basePremium: number;
  /** Annual paid-up additions rider premium, if any. */
  readonly puaPremium: number;
  readonly payYears: number;
  /**
   * Guaranteed cash value at the end of each policy year, from the contract's
   * own table. Index 0 is policy year 1. This is the one number in a whole
   * life policy that cannot change, and it is not derivable from anything else.
   */
  readonly guaranteedCashValueByYear: readonly number[];
  /** Current dividend scale, as an interest rate on cash value. Not guaranteed. */
  readonly dividendScalePct: number;
  /**
   * Share of a PUA premium that becomes cash value immediately. Typically
   * 85-95% — the rest is the rider's load. From the illustration.
   */
  readonly puaCashValueEfficiencyPct: number;
  /** Whether the carrier adjusts dividends on the borrowed portion. */
  readonly directRecognition: boolean;
  /** Loan interest rate charged by the carrier. */
  readonly loanRatePct: number;
  /**
   * Under direct recognition, the dividend rate applied to the borrowed
   * portion. Ignored when directRecognition is false.
   */
  readonly dividendOnLoanedPortionPct?: number;
}

export interface BankingLoan {
  /** Policy year the loan is taken. */
  readonly year: number;
  readonly amount: number;
  /** Annual repayment; 0 means the loan and its interest accrue. */
  readonly annualRepayment: number;
}

export interface WholeLifeYear {
  readonly policyYear: number;
  readonly premiumPaid: number;
  readonly cumulativePremiums: number;
  readonly guaranteedCashValue: number;
  readonly dividend: number;
  readonly paidUpAdditionsCashValue: number;
  readonly totalCashValue: number;
  /** Cash value less any loan outstanding. What could actually be taken. */
  readonly netSurrenderValue: number;
  readonly loanBalance: number;
  readonly loanInterestThisYear: number;
}

export interface WholeLifeResult {
  readonly years: readonly WholeLifeYear[];
  readonly summary: {
    readonly totalPremiums: number;
    readonly totalDividends: number;
    readonly totalLoanInterest: number;
    readonly finalCashValue: number;
    readonly finalNetSurrenderValue: number;
    readonly finalLoanBalance: number;
    /** First year total cash value covers cumulative premiums. Null if never. */
    readonly breakEvenYear: number | null;
    /** Years where cash value was below premiums paid. */
    readonly yearsUnderwater: number;
  };
  readonly notes: readonly string[];
}

export interface WholeLifeInput {
  readonly terms: WholeLifeTerms;
  readonly years: number;
  readonly dividendOption: DividendOption;
  readonly loans?: readonly BankingLoan[];
}

export function runWholeLifeBanking(input: WholeLifeInput): WholeLifeResult {
  const { terms, years, dividendOption, loans = [] } = input;

  let puaCashValue = 0;
  let accumulatedDividends = 0;
  let loanBalance = 0;
  let cumulativePremiums = 0;
  let totalDividends = 0;
  let totalLoanInterest = 0;
  let breakEvenYear: number | null = null;
  let yearsUnderwater = 0;

  const rows: WholeLifeYear[] = [];

  for (let y = 1; y <= years; y++) {
    const premium = y <= terms.payYears ? terms.basePremium + terms.puaPremium : 0;
    cumulativePremiums += premium;

    // The PUA rider's premium buys paid-up insurance immediately, less its load.
    if (y <= terms.payYears && terms.puaPremium > 0) {
      puaCashValue += terms.puaPremium * (terms.puaCashValueEfficiencyPct / 100);
    }

    const guaranteed = terms.guaranteedCashValueByYear[y - 1] ?? 0;
    const cashValueBeforeDividend = guaranteed + puaCashValue + accumulatedDividends;

    // A new loan this year.
    for (const l of loans) {
      if (l.year === y) loanBalance += l.amount;
    }

    // The dividend. Under direct recognition the borrowed portion earns a
    // different rate; under non-direct recognition the loan is invisible to
    // the dividend, which is the claim the whole design rests on.
    let dividend: number;
    if (terms.directRecognition && loanBalance > 0) {
      const borrowed = Math.min(loanBalance, cashValueBeforeDividend);
      const unborrowed = Math.max(0, cashValueBeforeDividend - borrowed);
      const loanedRate = (terms.dividendOnLoanedPortionPct ?? terms.dividendScalePct) / 100;
      dividend = unborrowed * (terms.dividendScalePct / 100) + borrowed * loanedRate;
    } else {
      dividend = cashValueBeforeDividend * (terms.dividendScalePct / 100);
    }
    totalDividends += dividend;

    switch (dividendOption.kind) {
      case 'paidUpAdditions':
        puaCashValue += dividend * (terms.puaCashValueEfficiencyPct / 100);
        break;
      case 'accumulateAtInterest':
        accumulatedDividends =
          accumulatedDividends * (1 + (dividendOption.accumulationRatePct ?? 0) / 100) + dividend;
        break;
      case 'cash':
      case 'reducePremium':
        // Leaves the policy. Nothing is added to cash value.
        break;
    }

    // Loan interest accrues on the balance, then any repayment is applied.
    const loanInterest = loanBalance * (terms.loanRatePct / 100);
    loanBalance += loanInterest;
    totalLoanInterest += loanInterest;
    for (const l of loans) {
      if (y > l.year && l.annualRepayment > 0) {
        loanBalance = Math.max(0, loanBalance - l.annualRepayment);
      }
    }

    const totalCashValue = guaranteed + puaCashValue + accumulatedDividends;

    // Reported from the ROUNDED figures, not the raw ones. A reader who
    // subtracts the loan column from the cash value column must get the net
    // column; a one-dollar disagreement on screen reads as a bug in the
    // illustration, and an illustration nobody trusts is worse than none.
    const totalCashValueRounded = Math.round(totalCashValue);
    const loanBalanceRounded = Math.round(loanBalance);
    const netSurrenderValue = Math.max(0, totalCashValueRounded - loanBalanceRounded);

    if (totalCashValue < cumulativePremiums) yearsUnderwater++;
    if (breakEvenYear === null && totalCashValue >= cumulativePremiums && cumulativePremiums > 0) {
      breakEvenYear = y;
    }

    rows.push({
      policyYear: y,
      premiumPaid: Math.round(premium),
      cumulativePremiums: Math.round(cumulativePremiums),
      guaranteedCashValue: Math.round(guaranteed),
      dividend: Math.round(dividend),
      paidUpAdditionsCashValue: Math.round(puaCashValue),
      totalCashValue: totalCashValueRounded,
      netSurrenderValue,
      loanBalance: loanBalanceRounded,
      loanInterestThisYear: Math.round(loanInterest),
    });
  }

  const last = rows[rows.length - 1];
  const notes: string[] = [
    "Dividends are not guaranteed. They are a return of surplus declared annually at the carrier's discretion; " +
    "an unbroken payment record is history, not a promise, and the scale used here is the current one.",
  ];
  if (terms.guaranteedCashValueByYear.length === 0) {
    notes.push(
      "No guaranteed cash value schedule was supplied, so the guaranteed column is zero throughout. " +
      "That schedule is a contract table only the carrier publishes and it cannot be derived — this run shows " +
      "paid-up additions and dividends alone."
    );
  }
  if (breakEvenYear === null && rows.length > 0) {
    notes.push("Cash value never reached the premiums paid over this run.");
  } else if (breakEvenYear !== null) {
    notes.push(
      `Cash value first covered the premiums paid in policy year ${breakEvenYear}. ` +
      `For the ${yearsUnderwater} years before that, surrendering would have returned less than was paid in.`
    );
  }
  if (loans.length > 0) {
    notes.push(
      terms.directRecognition
        ? "This carrier uses direct recognition: the borrowed portion of cash value earns a different dividend while " +
          "the loan is outstanding."
        : "This carrier does not use direct recognition: the dividend is unaffected by the loan. That is the basis of " +
          "the claim that the money keeps working while it is borrowed — but the loan still accrues interest, shown " +
          "in its own column."
    );
  }

  return {
    years: rows,
    summary: {
      totalPremiums: Math.round(cumulativePremiums),
      totalDividends: Math.round(totalDividends),
      totalLoanInterest: Math.round(totalLoanInterest),
      finalCashValue: last?.totalCashValue ?? 0,
      finalNetSurrenderValue: last?.netSurrenderValue ?? 0,
      finalLoanBalance: last?.loanBalance ?? 0,
      breakEvenYear,
      yearsUnderwater,
    },
    notes,
  };
}
