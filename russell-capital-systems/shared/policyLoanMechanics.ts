/**
 * What happens to a policy loan, which is mostly arithmetic and statute.
 *
 * Two rates on this page are carrier quotes and have to be read off a product
 * guide: what the loan is charged, and what the collateral earns while it sits
 * as security. Everything else — how the balance compounds, when it overtakes
 * the cash value, what the tax code does when it does — follows mechanically
 * and can be built now.
 *
 * `policyLoanOptimizer.ts` answers "how much can be taken". This answers "what
 * happens to what was taken", which is the question that ends badly.
 *
 * ## The three loan types are three different bets
 *
 * A loan does not remove money from the policy. It is a lien: the carrier
 * lends its own money and holds part of the account value as security. What
 * that held portion earns while it sits there is the whole difference between
 * the types.
 *
 *   - **Wash.** Charged rate equals credited rate on the collateral, by
 *     contract. Net cost zero, every year, guaranteed. Nothing to model.
 *
 *   - **Fixed / standard.** The collateral is moved to a fixed account at a
 *     declared rate. Cost is the charged rate less that declared rate — a
 *     known spread, the same in every year. Predictable and usually small.
 *
 *   - **Participating (index / variable).** The collateral stays in the index
 *     strategy and earns whatever the strategy credits. This is the one sold
 *     as free money, on the argument that the index beats the loan rate over
 *     time. It usually does — on average.
 *
 * ## Why "on average" is the wrong test for a participating loan
 *
 * An indexed strategy has a floor at zero. Over 1996-2025 a capped S&P 500
 * strategy credited exactly nothing in seven years out of thirty — this
 * platform measures that, it is not an estimate. In each of those years a
 * participating loan is charged its full rate against a collateral credit of
 * zero. That is not a tail risk that might happen; on the historical record it
 * is roughly one year in four.
 *
 * Average the thirty years and the loan looks free. Live them in order and the
 * balance ratchets up in the zero years and never comes back down, because
 * there is no mechanism that credits the collateral twice to catch up.
 * `yearsCollateralCreditedNothing` counts them, and the arithmetic below
 * charges them.
 *
 * ## The crossover is not an opinion
 *
 * The loan balance compounds at the charged rate. The cash value securing it
 * compounds at the credited rate. If the charged rate is the higher of the
 * two, the balance closes on the cash value at a fixed proportional speed and
 * the year it arrives is closed-form:
 *
 *     n = ln(cashValue / loanBalance) / ln((1 + chargedRate) / (1 + creditedRate))
 *
 * No assumption enters. `yearsToCrossover` computes it, and if the charged
 * rate is at or below the credited rate it returns null, because then the
 * balance never catches up and the loan is genuinely safe.
 *
 * ## What the tax code does at the crossover — the part nobody illustrates
 *
 * While the policy is in force and is not a modified endowment contract, a
 * loan is not income. That is the entire basis of the strategy and it is
 * correct.
 *
 * It stops being correct the moment the policy lapses. On lapse or surrender
 * the amount realised includes the loan that gets discharged out of the cash
 * value, so the gain is the whole cash value less basis — and the client
 * receives nothing, because the cash value went to repay the loan. They owe
 * ordinary income tax, at ordinary rates, on a gain they never saw, with no
 * cash from the policy to pay it.
 *
 * A policy that lapses in year 28 of a loan strategy does not merely stop
 * working. It hands the client a tax bill for the entire accumulated gain in
 * the year they can least afford it. `phantomIncomeOnLapse` computes that
 * bill, and `cashShortfall` says how much of it has to come from somewhere
 * else. No projection on this platform should show a loan stream without it.
 *
 * Authorities: IRC 72(e) for the ordering of distributions, 7702A for the
 * modified endowment contract rules, 101(a) for the death benefit exclusion
 * that survives all of this if the policy is simply held to death.
 */

/**
 * Four kinds, not three. The taxonomy is "where does the collateral sit", and
 * the fourth exists because Securian has a loan everybody miscategorises.
 *
 *   wash             charged === credited by contract. Zero cost, guaranteed.
 *   fixed            collateral MOVES OUT to a declared-rate account.
 *                    (Nationwide calls this the Declared Rate Loan.)
 *   indexed_account  collateral MOVES to a separate Indexed Loan Account and
 *                    earns THAT account's performance — not the policy's.
 *                    Securian's "indexed loan". It reads like a participating
 *                    loan and is not one: the money still leaves.
 *   participating    collateral STAYS in the policy's own strategies and earns
 *                    whatever they credit. Nationwide's Alternative Loan;
 *                    Securian's VARIABLE loan. Nothing moves.
 */
export type LoanType = 'wash' | 'fixed' | 'indexed_account' | 'participating';

/** The name Nationwide's illustrations use for a `fixed` loan. */
export const DECLARED_RATE_IS = 'fixed' satisfies LoanType;

export interface LoanTerms {
  readonly type: LoanType;
  /**
   * The rate the carrier charges on the loan balance, as a percentage.
   * CARRIER QUOTE — from the product guide, not derivable.
   *
   * A function of policy year when the rate steps, which is the common case
   * and which a single number cannot express: Nationwide charges 3.90% for ten
   * years and 3.00% thereafter, so a flat rate is wrong in one half of the
   * projection whichever value you pick.
   */
  readonly chargedRatePct: number | ((policyYear: number) => number);
  /**
   * The highest rate the contract permits, as a percentage. Used by the
   * guaranteed column. Absent means the current rate is the contractual one.
   */
  readonly chargedGuaranteedMaxPct?: number;
  /** What the collateral earns in the guaranteed column. Usually the floor. */
  readonly collateralCreditGuaranteedPct?: number;
  /** Where these figures were read. Required by `sourcing.ts` downstream. */
  readonly source?: string;
  /** ISO date the source document was prepared or transcribed. */
  readonly asOf?: string;
  /** Carrier's own name for this loan, for a page to print verbatim. */
  readonly label?: string;
  /**
   * What the held collateral earns, as a percentage. CARRIER QUOTE for a fixed
   * loan. Ignored for a wash loan (equal to the charged rate by contract) and
   * for a participating loan (the year's own index credit).
   */
  readonly collateralCreditRatePct?: number;
  /**
   * What a separate Indexed Loan Account credits, as a percentage. Used only by
   * `indexed_account`. CARRIER QUOTE — it is that account's own performance,
   * not the policy's crediting rate, and the two are not the same number.
   */
  readonly indexedLoanAccountRatePct?: number;
  /**
   * Interest charged at the end of the year (the default) rather than deducted
   * from the loan proceeds when the loan is made.
   *
   * This is not a presentational detail on an income strategy. Charged in
   * advance, the client receives the draw LESS the year's interest — so a
   * $60,000 draw at 5% hands over $57,000 and the illustration's "income"
   * column is not what arrives in the bank.
   */
  readonly inArrears?: boolean;
}

export interface TaxContext {
  /** Premiums paid into the contract to date. Basis starts here. */
  readonly cumulativePremiumsPaid: number;
  /**
   * A modified endowment contract under 7702A. The seven-pay limit is printed
   * on every illustration, so this is knowable rather than guessable — but it
   * is a fact about the case, not something this module can infer.
   */
  readonly isMec: boolean;
  /** The owner's age when the projection starts, for the 10% additional tax. */
  readonly ownerAgeAtStart: number;
  /** Ordinary rate used to price the tax consequences, as a percentage. */
  readonly ordinaryIncomeRatePct: number;
}

export interface PolicyYearState {
  readonly policyYear: number;
  readonly attainedAge: number;
  /** Account value from the policy engine, before the loan overlay. */
  readonly accountValue: number;
  /** Surrender value from the policy engine, before the loan overlay. */
  readonly surrenderValue: number;
  /** The rate actually credited this year, as a percentage. */
  readonly creditedRatePct: number;
  /** New borrowing drawn this year. */
  readonly loanTaken: number;
}

export interface LoanYear {
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly loanTaken: number;
  /** What the client actually receives — the draw, less interest if in advance. */
  readonly cashReceived: number;
  readonly interestCharged: number;
  /** The rate charged in THIS year, after resolving a stepped schedule. */
  readonly chargedRatePct: number;
  readonly collateralCredit: number;
  /** The rate the collateral earned this year. */
  readonly collateralCreditRatePct: number;
  /** collateralCreditRatePct − chargedRatePct. The number that decides it. */
  readonly netSpreadPct: number;
  /** Interest charged less what the collateral earned. The real cost. */
  readonly netCost: number;
  readonly loanBalance: number;
  readonly accountValue: number;
  readonly surrenderValue: number;
  /** Surrender value less the loan. What the client could actually walk with. */
  readonly netSurrenderValue: number;
  readonly loanToValuePct: number;
  /** True in a year the collateral earned nothing and the interest ran anyway. */
  readonly collateralCreditedNothing: boolean;
  /** Taxable this year — only ever non-zero for a modified endowment contract. */
  readonly taxableDistribution: number;
  readonly penaltyTax: number;
  readonly lapsed: boolean;
}

export interface LoanMechanicsResult {
  readonly years: readonly LoanYear[];
  readonly summary: {
    readonly totalBorrowed: number;
    /** What reached the client. Below totalBorrowed for a loan charged in advance. */
    readonly totalCashReceived: number;
    readonly totalInterestCharged: number;
    readonly totalCollateralCredit: number;
    readonly totalNetCost: number;
    readonly yearsCollateralCreditedNothing: number;
    readonly finalLoanBalance: number;
    readonly finalNetSurrenderValue: number;
    readonly lapseYear: number | null;
    /** Closed-form year the balance overtakes the cash value, if it does. */
    readonly projectedCrossoverYear: number | null;
  };
  /** What lapsing costs, whether or not this projection lapses. */
  readonly lapseConsequence: {
    readonly occurred: boolean;
    readonly policyYear: number | null;
    readonly amountRealized: number;
    readonly basis: number;
    readonly phantomIncomeOnLapse: number;
    readonly taxOwed: number;
    readonly cashToClient: number;
    /** Tax owed that no policy money covers. The cheque they have to write. */
    readonly cashShortfall: number;
  };
  /**
   * First policy year the Overloan Lapse Protection backstop can be invoked,
   * or null when the projection never reaches it. Null also when no issueAge
   * was supplied — absent, not "never".
   */
  readonly overloanEligibleYear: number | null;
  /** Which inputs were carrier quotes rather than mechanics. */
  readonly carrierQuoted: readonly string[];
  /** Where the terms came from, echoed so a page never prints a bare figure. */
  readonly provenance: { readonly source: string | null; readonly asOf: string | null; readonly label: string | null; readonly guaranteedColumn: boolean };
  readonly notes: readonly string[];
}

/**
 * The year the loan balance overtakes the cash value, from the compounding
 * alone. Null when the charged rate does not exceed the credited rate, because
 * then it never does.
 */
export function yearsToCrossover(
  loanBalance: number,
  cashValue: number,
  chargedRatePct: number,
  creditedRatePct: number
): number | null {
  if (loanBalance <= 0) return null;
  if (loanBalance >= cashValue) return 0;
  const charged = 1 + chargedRatePct / 100;
  const credited = 1 + creditedRatePct / 100;
  if (charged <= credited) return null;
  return Math.log(cashValue / loanBalance) / Math.log(charged / credited);
}

/** The charged rate in a given policy year, resolving a stepped schedule. */
export function chargedRateAt(terms: LoanTerms, policyYear: number, guaranteed = false): number {
  if (guaranteed) return terms.chargedGuaranteedMaxPct ?? resolveCharged(terms, policyYear);
  return resolveCharged(terms, policyYear);
}

function resolveCharged(terms: LoanTerms, policyYear: number): number {
  return typeof terms.chargedRatePct === 'function'
    ? terms.chargedRatePct(policyYear)
    : terms.chargedRatePct;
}

/**
 * What the collateral earns this year, by loan type.
 *
 * `indexed_account` takes `indexedLoanAccountRatePct` rather than the policy's
 * own credited rate, because the money went to a different account. Falling
 * back to the policy's rate would quietly turn Securian's indexed loan into a
 * participating loan on the page — the exact confusion this type exists to
 * stop — so the fallback is the fixed-collateral rate instead, and zero last.
 */
function collateralRatePct(
  terms: LoanTerms,
  creditedThisYearPct: number,
  policyYear: number,
  guaranteed: boolean
): number {
  if (guaranteed && terms.type !== 'wash') {
    return terms.collateralCreditGuaranteedPct ?? 0;
  }
  switch (terms.type) {
    case 'wash':
      return chargedRateAt(terms, policyYear, guaranteed);
    case 'fixed':
      return terms.collateralCreditRatePct ?? 0;
    case 'indexed_account':
      return terms.indexedLoanAccountRatePct ?? terms.collateralCreditRatePct ?? 0;
    case 'participating':
      return creditedThisYearPct;
  }
}

export interface RunOptions {
  /** Run the contract's guaranteed column instead of the current one. */
  readonly guaranteed?: boolean;
  /**
   * Age at issue. Supplying it turns on the Overloan Lapse Protection gate,
   * which needs an age and a policy year and cannot be inferred from either.
   */
  readonly issueAge?: number;
}

/**
 * True when the borrowed money never leaves the policy's own strategies.
 *
 * Exactly one of the four types. `indexed_account` returns false on purpose:
 * the money moved, it just landed somewhere that also tracks an index.
 */
export function collateralStaysIndexed(t: LoanType): boolean {
  return t === 'participating';
}

/**
 * Overloan Lapse Protection Rider II gate: age 65 AND the 15th anniversary,
 * both, and a trigger point by attained age that the carrier sets.
 *
 * Returned as a year rather than a boolean because the gap is the point — a
 * plan that borrows from year 2 has no backstop for thirteen years minimum,
 * and longer if the insured is under 50 at issue.
 */
export function overloanEligibleYear(issueAge: number, years: number): number | null {
  for (let y = 1; y <= years; y++) {
    if (issueAge + y - 1 >= 65 && y >= 15) return y;
  }
  return null;
}

export function runPolicyLoanMechanics(
  states: readonly PolicyYearState[],
  terms: LoanTerms,
  tax: TaxContext,
  options: RunOptions = {}
): LoanMechanicsResult {
  const guaranteed = options.guaranteed === true;
  const rows: LoanYear[] = [];
  let balance = 0;
  let totalBorrowed = 0;
  let totalCash = 0;
  let totalInterest = 0;
  let totalCollateral = 0;
  let lapseYear: number | null = null;
  let basis = tax.cumulativePremiumsPaid;
  let lapseAt: PolicyYearState | null = null;

  for (const s of states) {
    if (lapseYear !== null) {
      rows.push({
        policyYear: s.policyYear, attainedAge: s.attainedAge, loanTaken: 0,
        cashReceived: 0, interestCharged: 0, chargedRatePct: 0, collateralCredit: 0,
        collateralCreditRatePct: 0, netSpreadPct: 0, netCost: 0,
        loanBalance: 0, accountValue: 0, surrenderValue: 0, netSurrenderValue: 0,
        loanToValuePct: 0, collateralCreditedNothing: false,
        taxableDistribution: 0, penaltyTax: 0, lapsed: true,
      });
      continue;
    }

    const draw = Math.max(0, s.loanTaken);

    // Draws are taken at the start of the policy year, which is how a
    // distribution illustration works — the client wants the income in
    // January, not the following December. So this year's draw is on loan for
    // the whole year and is charged for the whole year, and the collateral
    // securing it is held for the whole year and credited for the whole year.
    // Using the opening balance instead would let the first year of every loan
    // run free, which is wrong by a year's interest on every draw.
    const base = balance + draw;
    const chargedThisYear = chargedRateAt(terms, s.policyYear, guaranteed);
    const interestCharged = base * (chargedThisYear / 100);
    const collRate = collateralRatePct(terms, s.creditedRatePct, s.policyYear, guaranteed);
    const collateralCredit = base * (collRate / 100);

    // Charged in advance, the interest comes out of the proceeds and the
    // client receives less; charged in arrears it is added to the balance and
    // compounds. Same rate, different damage.
    const chargedInAdvance = terms.inArrears === false;
    const cashReceived = chargedInAdvance ? Math.max(0, draw - interestCharged) : draw;
    balance += draw + (chargedInAdvance ? 0 : interestCharged);

    totalBorrowed += draw;
    totalCash += cashReceived;
    totalInterest += interestCharged;
    totalCollateral += collateralCredit;

    // A modified endowment contract taxes distributions gain-first, and a
    // loan from one is a distribution. A non-MEC loan is not income while the
    // contract stays in force — which is the whole strategy, and which the
    // lapse block below is the price of.
    let taxableDistribution = 0;
    let penaltyTax = 0;
    if (tax.isMec && draw > 0) {
      const gain = Math.max(0, s.accountValue - basis);
      taxableDistribution = Math.min(draw, gain);
      const ageNow = tax.ownerAgeAtStart + (s.policyYear - states[0]!.policyYear);
      if (ageNow < 59.5) penaltyTax = taxableDistribution * 0.1;
      basis = Math.max(0, basis - Math.max(0, draw - taxableDistribution));
    }

    const netSurrender = s.surrenderValue - balance;
    const ltv = s.surrenderValue > 0 ? (balance / s.surrenderValue) * 100 : 100;

    // The policy lapses when the loan exceeds the value securing it.
    const lapsed = balance >= s.surrenderValue && s.surrenderValue >= 0 && balance > 0;
    if (lapsed) {
      lapseYear = s.policyYear;
      lapseAt = s;
    }

    rows.push({
      policyYear: s.policyYear,
      attainedAge: s.attainedAge,
      loanTaken: Math.round(draw),
      cashReceived: Math.round(cashReceived),
      interestCharged: Math.round(interestCharged),
      chargedRatePct: chargedThisYear,
      collateralCredit: Math.round(collateralCredit),
      collateralCreditRatePct: collRate,
      netSpreadPct: Number((collRate - chargedThisYear).toFixed(2)),
      netCost: Math.round(interestCharged - collateralCredit),
      loanBalance: Math.round(balance),
      accountValue: Math.round(s.accountValue),
      surrenderValue: Math.round(s.surrenderValue),
      netSurrenderValue: Math.round(netSurrender),
      loanToValuePct: Math.round(ltv * 10) / 10,
      collateralCreditedNothing: balance > 0 && collRate <= 0,
      taxableDistribution: Math.round(taxableDistribution),
      penaltyTax: Math.round(penaltyTax),
      lapsed,
    });
  }

  // The consequence of lapsing, computed whether or not this run lapses — a
  // projection that stays in force still needs to show what the failure costs.
  const at = lapseAt ?? states[states.length - 1] ?? null;
  const atBalance = lapseAt
    ? rows.find((r) => r.policyYear === lapseAt!.policyYear)!.loanBalance
    : rows[rows.length - 1]?.loanBalance ?? 0;
  const amountRealized = at ? at.surrenderValue : 0;
  const gain = Math.max(0, amountRealized - basis);
  const taxOwed = gain * (tax.ordinaryIncomeRatePct / 100);
  const cashToClient = Math.max(0, amountRealized - atBalance);

  const first = states[0];
  const projectedCrossoverYear = first
    ? (() => {
        const seed = rows.find((r) => r.loanBalance > 0);
        if (!seed) return null;
        const st = states.find((s) => s.policyYear === seed.policyYear)!;
        const n = yearsToCrossover(
          seed.loanBalance,
          st.surrenderValue,
          chargedRateAt(terms, st.policyYear, guaranteed),
          st.creditedRatePct
        );
        return n === null ? null : Math.ceil(seed.policyYear + n);
      })()
    : null;

  const zeroYears = rows.filter((r) => r.collateralCreditedNothing).length;

  const chargedDescription =
    typeof terms.chargedRatePct === 'function'
      ? `the charged loan rate (a schedule: ${chargedRateAt(terms, 1, guaranteed)}% in year 1, ${chargedRateAt(terms, states[states.length - 1]?.policyYear ?? 1, guaranteed)}% at the end)`
      : `the charged loan rate (${terms.chargedRatePct}%)`;

  const carrierQuoted = [
    chargedDescription,
    ...(terms.type === 'fixed'
      ? [`the rate credited to held collateral (${terms.collateralCreditRatePct ?? 0}%)`]
      : []),
    ...(terms.type === 'indexed_account'
      ? [`the Indexed Loan Account's own crediting rate (${terms.indexedLoanAccountRatePct ?? terms.collateralCreditRatePct ?? 0}%) — that account's performance, not the policy's`]
      : []),
    ...(guaranteed && terms.chargedGuaranteedMaxPct !== undefined
      ? [`the guaranteed maximum charged rate (${terms.chargedGuaranteedMaxPct}%)`]
      : []),
    ...(tax.isMec !== undefined ? ['whether the contract is a modified endowment contract — printed on the illustration as the seven-pay limit'] : []),
  ];

  const overloanYear =
    options.issueAge === undefined ? null : overloanEligibleYear(options.issueAge, rows.length);

  const notes: string[] = [];
  if (terms.type === 'indexed_account') {
    notes.push(
      'This is an indexed LOAN ACCOUNT loan: the borrowed amount is moved into a separate account that tracks an index. It is not a participating loan — the money leaves the policy\'s own strategies, and that account\'s crediting rate is its own. Read as participating it flatters the plan by the difference between the two rates.'
    );
  }
  if (overloanYear !== null && lapseYear !== null && lapseYear < overloanYear) {
    notes.push(
      `The lapse lands in policy year ${lapseYear}, before the Overloan Lapse Protection backstop becomes available in year ${overloanYear} — it requires age 65 AND the 15th anniversary, both. The backstop does not exist yet when it is needed.`
    );
  }
  if (overloanYear !== null) {
    notes.push(
      'Overloan lapse protection is not a settled tax answer. Nationwide\'s own illustration states that neither the IRS nor the courts have ruled on the treatment, and that the indebtedness could be asserted to be a taxable distribution.'
    );
  }
  if (guaranteed) {
    notes.push(
      'This is the GUARANTEED column: the worst the contract permits, not a forecast. It charges the contractual maximum and credits the floor in every year. Nothing here is what the carrier currently declares.'
    );
  }
  if (terms.type === 'participating' && zeroYears > 0) {
    notes.push(
      `In ${zeroYears} of ${rows.length} years the collateral earned nothing and the loan was charged its full rate anyway. A participating loan is only cheap on the average of the years; it is charged in every one of them, and the floor means the good years cannot credit twice to make up for the flat ones.`
    );
  }
  if (terms.type === 'wash') {
    notes.push('A wash loan costs nothing by contract. Confirm it is contractually guaranteed rather than a current declared practice the carrier can change.');
  }
  if (lapseYear !== null) {
    notes.push(
      `The loan overtook the surrender value in policy year ${lapseYear}. On lapse the discharged loan is part of the amount realised, so the gain of $${Math.round(gain).toLocaleString()} is ordinary income — while the cash value goes to repay the loan and the client receives $${Math.round(cashToClient).toLocaleString()}.`
    );
  } else if (projectedCrossoverYear !== null) {
    notes.push(
      `The charged rate exceeds the credited rate, so the balance closes on the cash value every year. On this run it does not arrive within the projection, but the compounding puts the crossover around policy year ${projectedCrossoverYear}. Nothing reverses it; only paying the loan down does.`
    );
  }
  notes.push(
    'Held to death, none of this happens: the death benefit repays the loan and the remainder passes income-tax-free under IRC 101(a). The lapse consequence is the price of the strategy failing, not of using it.'
  );

  return {
    years: rows,
    summary: {
      totalBorrowed: Math.round(totalBorrowed),
      totalCashReceived: Math.round(totalCash),
      totalInterestCharged: Math.round(totalInterest),
      totalCollateralCredit: Math.round(totalCollateral),
      totalNetCost: Math.round(totalInterest - totalCollateral),
      yearsCollateralCreditedNothing: zeroYears,
      finalLoanBalance: rows[rows.length - 1]?.loanBalance ?? 0,
      finalNetSurrenderValue: rows[rows.length - 1]?.netSurrenderValue ?? 0,
      lapseYear,
      projectedCrossoverYear,
    },
    lapseConsequence: {
      occurred: lapseYear !== null,
      policyYear: lapseYear,
      amountRealized: Math.round(amountRealized),
      basis: Math.round(basis),
      phantomIncomeOnLapse: Math.round(gain),
      taxOwed: Math.round(taxOwed),
      cashToClient: Math.round(cashToClient),
      cashShortfall: Math.round(Math.max(0, taxOwed - cashToClient)),
    },
    overloanEligibleYear: overloanYear,
    carrierQuoted,
    provenance: {
      source: terms.source ?? null,
      asOf: terms.asOf ?? null,
      label: terms.label ?? null,
      guaranteedColumn: guaranteed,
    },
    notes,
  };
}


// ============================================================
// CARRIER TERM PRESETS — the rates, read off the illustrations.
//
// `LoanTerms` is the shape; these are the only values in this file that came
// from a document rather than from arithmetic. Every one carries the sentence
// it was read from, because a rate without a source is the thing that gets
// quoted back to a client two years later with nobody able to say where it
// came from.
//
// Note what is NOT here: Pacific Life. Its illustration runs "Policy
// Distributions 0", so no loan rate table is populated. An absent preset is
// the honest representation of an absent table.
// ============================================================

/** Nationwide Accumulator III — Declared Rate Loan. Collateral moves out. */
export const NATIONWIDE_DECLARED: LoanTerms = {
  type: 'fixed',
  label: 'Declared Rate Loan',
  chargedRatePct: (y) => (y <= 10 ? 3.90 : 3.00),
  chargedGuaranteedMaxPct: 3.90,
  collateralCreditRatePct: 3.00,
  collateralCreditGuaranteedPct: 1.00,
  source:
    "Nationwide Indexed UL Accumulator III illustration, Form ICC25-NWLA-692, prepared 19 Mar 2026 — 'Any Policy Loan will be charged interest at the following rates' and 'The loaned portion of the Accumulated Value will be credited interest at the following rates'",
  asOf: '2026-03-19',
};

/** Nationwide Accumulator III — Alternative Policy Loan. Collateral stays put. */
export const NATIONWIDE_PARTICIPATING: LoanTerms = {
  type: 'participating',
  label: 'Alternative Policy Loan',
  chargedRatePct: 5.00,
  chargedGuaranteedMaxPct: 8.00,
  collateralCreditGuaranteedPct: 0,   // the floor, which is 0%
  source:
    "Nationwide Indexed UL Accumulator III illustration, Form ICC25-NWLA-692, prepared 19 Mar 2026 — 'Alternative Policy Loans ... the money borrowed remains allocated to the selected interest crediting strategies and continues to receive the interest credited to those strategies'; charged Current 5.00% / Guaranteed Maximum 8.00%, set quarterly in advance",
  asOf: '2026-03-19',
};

/**
 * Securian BGA III — Fixed rate loan. A TRUE wash from year 11, not merely
 * cheap: charged 4.00% flat against 4.00% credited. Typed as `fixed` rather
 * than `wash` because it is only a wash from year 11 — before that it runs
 * −1.00%, and `wash` means zero in every year by contract.
 */
export const SECURIAN_FIXED: LoanTerms = {
  type: 'fixed',
  label: 'Fixed interest rate loan',
  chargedRatePct: 4.00,
  collateralCreditRatePct: 3.00,      // years 1-10; see SECURIAN_FIXED_LATE
  source:
    'Securian / Minnesota Life Balanced Growth Accumulator III illustration, Case ID 29335303 — fixed loan charged 4.00% constant, credited 3.00% years 1-10 and 4.00% years 11+',
  asOf: '2026-09-15',
};

/** The same loan from year 11, where it becomes exactly zero cost. */
export const SECURIAN_FIXED_LATE: LoanTerms = {
  ...SECURIAN_FIXED,
  label: 'Fixed interest rate loan (year 11 onward)',
  collateralCreditRatePct: 4.00,
};

/**
 * Securian BGA III — Indexed loan. The one everybody miscategorises: the money
 * is transferred INTO a separate Indexed Loan Account. It still moves.
 */
export const SECURIAN_INDEXED: LoanTerms = {
  type: 'indexed_account',
  label: 'Indexed loan',
  chargedRatePct: 4.75,
  source:
    'Securian / Minnesota Life Balanced Growth Accumulator III illustration, Case ID 29335303 — indexed loan charged 4.75% constant, loan amount transferred into a separate Indexed Loan Account and credited at that account\'s performance',
  asOf: '2026-09-15',
};

/**
 * Securian BGA III — Variable rate loan. This is the true participating loan
 * here: the amount REMAINS in the current fixed or indexed accounts.
 *
 * `chargedRatePct` is left at the illustration's own ceiling rather than a
 * quoted number, because the contract sets it by formula — Moody's Corporate
 * Bond Yield Average, capped at 1.5% above the current fixed account crediting
 * rate — and the formula, not a rate, is what the document contains.
 */
export const SECURIAN_VARIABLE: LoanTerms = {
  type: 'participating',
  label: 'Variable interest rate loan',
  chargedRatePct: 4.75,
  collateralCreditGuaranteedPct: 0,
  source:
    "Securian / Minnesota Life Balanced Growth Accumulator III illustration, Case ID 29335303 — 'the loan amount remains in your current fixed or indexed accounts'; charged rate varies with the Moody's Corporate Bond Yield Average, capped at 1.5% above the current fixed account crediting rate. The 4.75% here is a placeholder at the indexed-loan rate: confirm the live Moody's-derived rate before quoting it.",
  asOf: '2026-09-15',
};

/**
 * Run several sets of terms over the same policy and the same sequence, so the
 * comparison is like for like.
 *
 * The verdict is deliberately two-sided. A participating loan beating a
 * declared loan over one sequence is not evidence that it wins; it is the same
 * mechanism that loses by the same margin over a worse one, and a page that
 * prints only the winner is selling rather than modelling.
 */
export function compareLoanTypes(
  states: readonly PolicyYearState[],
  termsList: readonly LoanTerms[],
  tax: TaxContext,
  options: RunOptions = {}
) {
  const runs = termsList.map((terms) => ({
    terms,
    result: runPolicyLoanMechanics(states, terms, tax, options),
  }));
  const ranked = [...runs].sort((a, b) => a.result.summary.totalNetCost - b.result.summary.totalNetCost);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const anyParticipating = runs.some((r) => collateralStaysIndexed(r.terms.type));

  return {
    runs,
    cheapest: best?.terms.label ?? best?.terms.type ?? null,
    costliest: worst?.terms.label ?? worst?.terms.type ?? null,
    spread: best && worst ? worst.result.summary.totalNetCost - best.result.summary.totalNetCost : 0,
    verdict: anyParticipating
      ? 'These are the costs over this one sequence of index credits. A participating loan that wins here loses by the same mechanism over a worse sequence — its collateral is charged in every year and credited only in the good ones. Compare the guaranteed column before treating any of this as a plan.'
      : 'None of these loans leaves the collateral in the index, so each one costs a known spread rather than taking a market bet. The comparison is therefore stable across sequences.',
  };
}

export const LOAN_DISCLOSURE =
  'Loan terms are transcribed from carrier illustrations supplied by the operator, each named in its own source field. ' +
  'Nationwide Declared Rate: charged 3.90% years 1-10 / 3.00% years 11+, credited 3.00% (guaranteed 3.90% charged / 1.00% credited). ' +
  'Nationwide Alternative (participating): charged 5.00% current, 8.00% guaranteed maximum, set quarterly by the carrier in advance, ' +
  'with the borrowed amount remaining allocated to the index strategies. ' +
  "Securian: fixed 4.00% charged against 3.00% then 4.00% credited; indexed 4.75% into a separate loan account; variable capped 1.5% above the fixed account rate. " +
  'Neither the charged nor the credited rate is fixed for the life of the policy on any of these products.';

// ============================================================
// CARRIER REGISTRY — four carriers, four different machines.
//
// Transcribed 23 September 2026 from illustrations supplied by the operator.
// Where a figure is not in the document it is `null` and says so. Nothing here
// is filled in from memory or from a competitor's terms.
// ============================================================

export interface CarrierLoanProfile {
  carrier: string;
  product: string;
  kind: "iul" | "whole_life";
  /** The conservative loan: what it charges and what it credits back. */
  declaredCharged: string;
  declaredCredited: string;
  /** The participating loan, where the collateral keeps index exposure. */
  participatingCharged: string | null;
  participatingCredited: string | null;
  /**
   * True when THIS ILLUSTRATION contains a clause reserving the carrier's right
   * to change which accounts are eligible for participating loans.
   *
   * A fact about the document, not about the contract. Absence here does not
   * mean the carrier lacks the right — it may sit in the policy form rather
   * than the illustration. Saying "the illustration does not contain it" is
   * checkable; saying "the carrier cannot do it" would not be.
   */
  illustrationReservesAccountEligibility: boolean;
  notes: readonly string[];
  source: string;
  asOf: string;
}

export const CARRIER_LOAN_PROFILES: readonly CarrierLoanProfile[] = [
  {
    carrier: "Nationwide",
    product: "Indexed UL Accumulator III",
    kind: "iul",
    declaredCharged: "3.90% years 1–10, 3.00% years 11+ (current); 3.90% guaranteed",
    declaredCredited: "3.00% current; 1.00% guaranteed",
    participatingCharged: "5.00% current; 8.00% guaranteed maximum; set quarterly, declared in advance",
    participatingCredited: "the index strategy's own credit — 0% floor",
    illustrationReservesAccountEligibility: true,
    notes: [
      "'Alternative Policy Loans — the money borrowed remains allocated to the selected interest crediting strategies and continues to receive the interest credited to those strategies.'",
      "'Nationwide reserves the right to designate which indexed interest strategies are available for new alternative loans in the future.'",
      "'Alternative Loans are more volatile than Declared Rate Loans because the interest charged and credited both can vary more.'",
      "Overloan Lapse Protection Rider II gate: age 65 AND 15th anniversary AND a trigger point by attained age. Neither the IRS nor the courts have ruled on its treatment.",
    ],
    source: "Nationwide Indexed UL Accumulator III illustration, Form ICC25-NWLA-692, prepared 19 Mar 2026",
    asOf: "2026-03-19",
  },
  {
    carrier: "Pacific Life",
    product: "Pacific Horizon ECV IUL (GPT)",
    kind: "iul",
    declaredCharged: null as unknown as string,
    declaredCredited: null as unknown as string,
    participatingCharged: null,
    participatingCredited: null,
    illustrationReservesAccountEligibility: true,
    notes: [
      "RATES NOT IN THE DOCUMENT. This illustration runs 'Policy Distributions 0' — no loans are illustrated — so no loan rate table is populated. The same gap appeared on the Securian BGA III run for this client.",
      "Loan types exist and are configurable: 'Switch Loan Debt from Standard to Alternate' and back, both set to No here.",
      "'All policy charges, Standard Policy Loans and Withdrawals will be deducted from the Fixed Account. If the Fixed Account is depleted, any remaining deductions are taken proportionate to each Segment Value across all segments in the Indexed Accounts.' — a standard loan pulls money OUT of the index.",
      "'The Alternate Interest Rate applies only to eligible accounts ... Pacific Life Insurance Company may change the eligible accounts at any time.'",
      "Illustrated interest rate 4.50% years 1–52; guaranteed 1.00%.",
      "Carries SVER coverage and a year-8 conversion rider at no cost, surrender charges waived, no evidence of insurability.",
    ],
    source: "Pacific Horizon ECV IUL illustration, Form Series ICC21 P21IUL, run 16 Sep 2026 for M. Corrales",
    asOf: "2026-09-16",
  },
  {
    carrier: "Securian / Minnesota Life",
    product: "Balanced Growth Accumulator III IUL",
    kind: "iul",
    declaredCharged: "Fixed rate loan: 4.00%, charged rate remains constant",
    declaredCredited: "3.00% years 1-10, 4.00% years 11+ - so the fixed loan is a TRUE WASH from year 11, not merely cheap",
    participatingCharged: "Variable interest rate loan: varies with the Moody's Corporate Bond Yield Average, capped at 1.5% above the current fixed account crediting rate",
    participatingCredited: "the loan amount REMAINS in your current fixed or indexed accounts and is credited at their performance",
    illustrationReservesAccountEligibility: false,
    notes: [
      "THREE loan types, not two - the only carrier in this set with a third option.",
      "Fixed: the loan amount is transferred out of your accounts into the Fixed Account. Charged 4.00% constant; credited 3.00% yrs 1-10 and 4.00% yrs 11+. Net -1.00% early, 0.00% from year 11.",
      "Indexed: the loan amount is transferred into a separate INDEXED LOAN ACCOUNT and credited at that account's performance. Charged 4.75% constant. This is not the same as Nationwide's alternative loan - the money still moves, just into a different bucket.",
      "Variable: the loan amount REMAINS in your current fixed or indexed accounts. This is the true participating loan here. Charged rate floats with Moody's, capped at 1.5% above the current fixed account crediting rate.",
      "12-MONTH LOCKOUT, and it is triggered by the FIXED loan specifically: 'When you take a fixed interest rate loan a 12 month lockout period begins, during which no transfers are allowed from Fixed Account A to the indexed/balanced indexed accounts. Changes from a fixed interest rate loan to an indexed loan, or to a variable interest rate loan will not be allowed while the policy is in a lockout period.' Taking the safe loan locks you out of the other two for a year.",
      "Growth floor 0% on the indexed accounts - there is no 2% floor.",
      "No clause in this illustration reserving the right to change which accounts are eligible for loans. It DOES reserve discretion over the growth cap: 'We reserve the right to [change it]' and 'may be changed at our discretion but cannot be less favorable to you than the policy's guarantees.' Different clause, same direction of travel.",
    ],
    source: "Securian / Minnesota Life Balanced Growth Accumulator III illustration, Case ID 29335303, for M. Corrales age 65 Preferred Non-Tobacco",
    asOf: "2026-09-15",
  },
  {
    carrier: "Lafayette Life",
    product: "Patriot 2022 Level Premium Whole Life",
    kind: "whole_life",
    declaredCharged: "adjustable, changed year to year by the carrier; minimum 0.00%, maximum 8.00%",
    declaredCredited: "none — 'Interest that you pay to us is not credited to the cash value of the policy and it does not increase the cash value of the policy.'",
    participatingCharged: null,
    participatingCredited: null,
    illustrationReservesAccountEligibility: false,
    notes: [
      "Whole life, not IUL. There is no index, no cap and no floor — growth comes from guaranteed cash value plus a dividend that is NOT guaranteed.",
      "No participating-loan mechanism. The IUL arbitrage does not exist on this product.",
      "'Any interest that is not paid at the end of a policy year is added to the loan balance, which will also be charged interest.'",
      "'A policy dividend, if any, may not be sufficient to pay loan interest.'",
      "Illustrated at 100% of the current dividend scale — the top of the range, and the scale can fall.",
    ],
    source: "Lafayette Life Patriot 2022 illustration, Policy Form LL-01 2104 CA",
    asOf: "2026-09-23",
  },
];

/** Carriers whose participating-loan terms are documented well enough to model. */
export function modellableCarriers(): CarrierLoanProfile[] {
  return CARRIER_LOAN_PROFILES.filter((c) => c.participatingCharged !== null);
}

/**
 * Every carrier loan term the engine carries, as a source list for the app
 * shell's "Where these numbers come from" footer. Read off the presets
 * themselves, so a new preset is listed the moment it is added. Pacific Life
 * has no preset: its illustration runs no distributions, so it prints no
 * loan rate table to read.
 */
export const POLICY_LOAN_SOURCES: readonly { label: string; asOf?: string }[] = [
  NATIONWIDE_DECLARED,
  NATIONWIDE_PARTICIPATING,
  SECURIAN_FIXED,
  SECURIAN_FIXED_LATE,
  SECURIAN_INDEXED,
  SECURIAN_VARIABLE,
]
  .filter(t => Boolean(t.source))
  .map(t => ({ label: `${t.label ?? t.type}: ${t.source}`, asOf: t.asOf ?? undefined }));
