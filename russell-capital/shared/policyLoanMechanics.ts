/**
 * Policy loan mechanics — the four things that break a leveraged IUL strategy.
 *
 * ## Why this file exists
 *
 * `shared/mortgageKiller.ts` models the recycling cycle correctly in one important
 * respect: it credits interest on the unreduced account value and tracks loans
 * separately with a drag cost. That is the non-direct-recognition model, and it is
 * the half of the mechanism the strategy actually depends on.
 *
 * What it cannot do is notice when the strategy fails. An adversarial actuarial
 * review of this exact design named four failure modes, none of which the engine
 * tests for. Every one of them is silent until it is catastrophic:
 *
 *  1. THE STRATEGY IS LOANS. ALWAYS LOANS. A policy loan leaves the account value
 *     intact at a non-direct-recognition carrier, which is the entire reason the
 *     recycling cycle works: the money leaves, the crediting base does not. A
 *     partial surrender would reduce the account value dollar-for-dollar and
 *     permanently, which would destroy the mechanism — so it is NOT an option the
 *     strategy offers. It exists in this file only as something to DETECT and
 *     REFUSE, never as a path a caller can select.
 *
 *  2. DIRECT RECOGNITION. Not all carriers credit on the unreduced value. A
 *     direct-recognition carrier reduces the credited base by the loan, or credits
 *     loaned money at a lower fixed rate. Running this strategy on a
 *     direct-recognition contract and projecting it as if it were not is the
 *     single easiest way to hand a client a projection that cannot happen.
 *
 *  3. LAPSE WITH A LOAN OUTSTANDING. This is the catastrophic one. If the loan
 *     balance grows past the surrender value, the policy lapses — and the entire
 *     gain becomes ordinary income in that year, on money the client no longer
 *     has, because they spent it on their mortgage a decade earlier. A 0% floor
 *     year while loan interest keeps compounding is exactly how it happens.
 *
 *  4. MEC. Max-funding on this schedule risks tripping the 7-pay test under
 *     IRC §7702A. A modified endowment contract's loans are taxable distributions
 *     (LIFO, plus a 10% penalty before 59½), which does not damage the strategy —
 *     it deletes it. The tax-free loan IS the strategy.
 *
 * ## What this file does not do
 *
 * It does not replace a carrier illustration and it is not a 7702A opinion. The
 * 7-pay figure here is a screening approximation and says so. Its job is to make
 * the engine REFUSE to show a clean projection when one of these four is live,
 * not to compute the client's exact tax.
 */

/**
 * How money comes out of the contract. There is no third option, and the two are
 * not interchangeable — which is why this is a discriminated type and not a flag.
 */
/**
 * How the strategy takes money out of the contract. There is one way, and this
 * type has one member on purpose.
 *
 * A policy LOAN leaves the account value intact at a non-direct-recognition
 * carrier. The loan balance accrues alongside it and charges interest. Tax-free
 * while the policy stays in force and is not a MEC.
 *
 * There is no 'withdrawal' member because a partial surrender is not part of this
 * strategy and never has been. Surrendering value permanently reduces the
 * crediting base, which is the one thing the recycling cycle cannot survive. See
 * `detectSurrender` below — surrenders are something this module catches, not
 * something it performs.
 */
export type DistributionKind = 'loan';

/**
 * How the carrier credits index interest while a loan is outstanding.
 *
 * nonDirect — the credited base is the full account value, unreduced by the loan.
 *             This is what the recycling strategy assumes.
 * direct    — the carrier reduces the credited base by the loan, or credits the
 *             loaned portion at a separate, usually lower, fixed rate.
 */
export type LoanRecognition = 'nonDirect' | 'direct';

export interface CarrierLoanTerms {
  readonly carrier: string;
  readonly recognition: LoanRecognition;
  /** Annual interest charged on the loan balance, as a decimal. */
  readonly loanInterestRate: number;
  /**
   * For a direct-recognition carrier: the rate credited on the loaned portion.
   * Required when recognition is 'direct', ignored otherwise.
   */
  readonly creditedRateOnLoanedPortion?: number;
  /**
   * Where these terms were read. A carrier's loan provisions are a fact about a
   * contract, so they carry a citation like every other fact on this platform.
   */
  readonly source: string;
}

export interface PolicyYearState {
  readonly year: number;
  /** Account value BEFORE this year's credit, after charges. */
  readonly accountValue: number;
  /** Surrender value, i.e. account value less any surrender charge. */
  readonly surrenderValue: number;
  /** Outstanding loan balance at the start of the year. */
  readonly loanBalance: number;
  /** Cumulative premiums paid, i.e. cost basis. */
  readonly basis: number;
}

/**
 * The credited base for a year, given the carrier's actual loan provisions.
 *
 * This is the function the whole strategy rests on. At a non-direct-recognition
 * carrier it returns the full account value, which is why 95% of the money can
 * leave and the credit still lands on the whole figure. At a direct-recognition
 * carrier it does not, and the projection must not pretend otherwise.
 */
export function creditedAmount(
  state: PolicyYearState,
  indexRate: number,
  terms: CarrierLoanTerms,
): { credited: number; basis: 'full-account-value' | 'split' } {
  if (!Number.isFinite(indexRate) || indexRate < 0) {
    throw new RangeError('indexRate must be a finite, non-negative decimal');
  }
  if (terms.recognition === 'nonDirect') {
    return { credited: state.accountValue * indexRate, basis: 'full-account-value' };
  }
  const loaned = Math.min(state.loanBalance, state.accountValue);
  const unloaned = Math.max(0, state.accountValue - loaned);
  const loanedRate = terms.creditedRateOnLoanedPortion ?? 0;
  return {
    credited: unloaned * indexRate + loaned * loanedRate,
    basis: 'split',
  };
}

/**
 * Take a policy loan. This is the only distribution the strategy performs.
 *
 * The account value is untouched — that is the point. The loan balance rises
 * beside it and accrues interest, and `checkLapseRisk` watches where that balance
 * is heading.
 */
export function takeLoan(state: PolicyYearState, amount: number): PolicyYearState {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError('loan amount must be finite and non-negative');
  }
  return { ...state, loanBalance: state.loanBalance + amount };
}

/**
 * RED FLAG ONLY. What a partial surrender would do, so a projection can show why
 * the strategy never uses one — and so an engine can detect that an account value
 * fell between two years, which at a non-direct-recognition carrier running a
 * loan-only cycle should be impossible.
 *
 * Nothing in this module calls this to advance a projection. It exists to prove a
 * negative and to catch a mistake.
 */
export function surrenderWouldCost(
  state: PolicyYearState,
  amount: number,
): { creditingBaseLost: number; why: string } {
  const lost = Math.min(Math.max(0, amount), state.accountValue);
  return {
    creditingBaseLost: lost,
    why:
      'A partial surrender removes this amount from the account value permanently, ' +
      'at every carrier. Every future index credit would then be computed on the ' +
      'smaller figure. That is why this strategy takes loans and never surrenders: ' +
      'a loan moves the money without moving the crediting base.',
  };
}

/**
 * Detect an account value that fell year over year. Under a loan-only cycle at a
 * non-direct-recognition carrier this should never happen, so if it does, either
 * a surrender was taken somewhere it should not have been or the contract is not
 * the one the projection assumes.
 */
export function detectSurrender(
  previous: PolicyYearState,
  current: PolicyYearState,
): { suspected: boolean; drop: number; message: string } {
  const drop = previous.accountValue - current.accountValue;
  if (drop <= 0) {
    return { suspected: false, drop: 0, message: 'Account value did not fall. Loan-only cycle intact.' };
  }
  return {
    suspected: true,
    drop,
    message:
      `Account value fell by ${Math.round(drop).toLocaleString()} between year ` +
      `${previous.year} and year ${current.year}. Under a loan-only cycle at a ` +
      'non-direct-recognition carrier the account value does not fall. Either a ' +
      'partial surrender was taken — which this strategy never does — or the ' +
      'contract does not behave the way this projection assumes. Stop and check ' +
      'the carrier\u2019s loan provision before showing this to anyone.',
  };
}

export type LapseSeverity = 'none' | 'watch' | 'critical' | 'lapsed';

export interface LapseCheck {
  readonly severity: LapseSeverity;
  /** loanBalance / surrenderValue. Above 1.0 the policy has lapsed. */
  readonly loanToSurrender: number;
  /**
   * Ordinary income recognised if the policy lapses THIS year: the excess of
   * (account value + loan balance) over basis. The number the client owes tax on
   * for money they spent years ago.
   */
  readonly taxableOnLapse: number;
  readonly message: string;
}

/**
 * The check the engine could not previously make.
 *
 * A leveraged IUL does not fail gradually. It runs for years looking healthy and
 * then lapses in one year, and the tax bill arrives on gain the client cannot
 * reach because it went into their mortgage. The thresholds here are deliberately
 * conservative: 'watch' at 70% and 'critical' at 90% give a client time to act,
 * which is the entire point of checking.
 */
export function checkLapseRisk(state: PolicyYearState): LapseCheck {
  const sv = state.surrenderValue;
  const ratio = sv <= 0 ? Infinity : state.loanBalance / sv;
  const gain = Math.max(0, state.accountValue + state.loanBalance - state.basis);

  if (ratio >= 1) {
    return {
      severity: 'lapsed',
      loanToSurrender: ratio,
      taxableOnLapse: gain,
      message:
        'The loan balance has reached or passed the surrender value. The policy lapses. ' +
        'The entire gain becomes ordinary income this year, on money that was spent ' +
        'on the mortgage in earlier years and is not available to pay the tax.',
    };
  }
  if (ratio >= 0.9) {
    return {
      severity: 'critical',
      loanToSurrender: ratio,
      taxableOnLapse: gain,
      message:
        'The loan balance is at or above 90% of surrender value. One 0% floor year, ' +
        'with loan interest still accruing, can push this into lapse. Stop new draws ' +
        'and fund the loan interest from outside the policy.',
    };
  }
  if (ratio >= 0.7) {
    return {
      severity: 'watch',
      loanToSurrender: ratio,
      taxableOnLapse: gain,
      message:
        'The loan balance is above 70% of surrender value. This is the point to plan ' +
        'a repayment path rather than take another draw.',
    };
  }
  return {
    severity: 'none',
    loanToSurrender: Number.isFinite(ratio) ? ratio : 0,
    taxableOnLapse: gain,
    message: 'Loan balance is within a normal range against surrender value.',
  };
}

export interface MecScreen {
  readonly isLikelyMec: boolean;
  readonly sevenPayLimitApprox: number;
  readonly cumulativePremiumPaid: number;
  readonly message: string;
}

/**
 * A SCREENING approximation of the IRC §7702A 7-pay test. Not an opinion.
 *
 * The real 7-pay premium depends on the contract's guaranteed mortality and
 * interest bases and comes from the carrier. What this catches is the obvious
 * case: a funding schedule so aggressive that the question must be asked before a
 * projection showing tax-free loans is put in front of a client. If a contract is
 * a MEC, its loans are taxable LIFO distributions with a 10% penalty before 59½ —
 * which does not weaken this strategy, it removes it.
 */
export function screenForMec(
  cumulativePremiumPaid: number,
  specifiedAmount: number,
  policyYear: number,
  sevenPayAnnualFromCarrier?: number,
): MecScreen {
  const years = Math.max(1, Math.min(7, policyYear));
  // Screening proxy only, when the carrier figure is absent. Deliberately blunt.
  const annualLimit = sevenPayAnnualFromCarrier ?? specifiedAmount * 0.075;
  const limit = annualLimit * years;
  const over = cumulativePremiumPaid > limit;
  return {
    isLikelyMec: over,
    sevenPayLimitApprox: Math.round(limit),
    cumulativePremiumPaid: Math.round(cumulativePremiumPaid),
    message: over
      ? 'Cumulative premium exceeds a screening estimate of the 7-pay limit. This ' +
        'contract may be a modified endowment contract, in which case policy loans ' +
        'are TAXABLE distributions and the tax-free income this strategy depends on ' +
        'does not exist. Get the carrier’s 7-pay figure before showing any projection.' +
        (sevenPayAnnualFromCarrier === undefined
          ? ' No carrier 7-pay figure was supplied, so this used a screening proxy.'
          : '')
      : 'Cumulative premium is within the screening estimate of the 7-pay limit.',
  };
}

/**
 * Sentences a leveraged-IUL projection must never print. Kept in code, beside the
 * arithmetic, in the same shape as the other engines' never-printed lists.
 */
export const LOAN_STRATEGY_RULES = {
  neverPrinted: [
    'That policy loans are "free money" or cost nothing. Loan interest accrues every year.',
    'Any figure produced by a partial surrender. This strategy takes loans, never surrenders \u2014 a surrender would permanently reduce the crediting base the whole cycle depends on.',
    'That crediting on the unreduced account value is how every carrier works. It is a non-direct-recognition feature and must be confirmed for the specific contract.',
    'A tax-free income figure for a contract that has not been screened for MEC status.',
    'A projection that reaches or passes lapse without showing the tax consequence of that lapse.',
  ],
} as const;
