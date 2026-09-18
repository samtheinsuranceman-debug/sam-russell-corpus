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

export type LoanType = 'wash' | 'fixed' | 'participating';

export interface LoanTerms {
  readonly type: LoanType;
  /**
   * The rate the carrier charges on the loan balance, as a percentage.
   * CARRIER QUOTE — from the product guide, not derivable.
   */
  readonly chargedRatePct: number;
  /**
   * What the held collateral earns, as a percentage. CARRIER QUOTE for a fixed
   * loan. Ignored for a wash loan (equal to the charged rate by contract) and
   * for a participating loan (the year's own index credit).
   */
  readonly collateralCreditRatePct?: number;
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
  readonly collateralCredit: number;
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
  /** Which inputs were carrier quotes rather than mechanics. */
  readonly carrierQuoted: readonly string[];
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

/** What the collateral earns this year, by loan type. */
function collateralRatePct(terms: LoanTerms, creditedThisYearPct: number): number {
  switch (terms.type) {
    case 'wash':
      return terms.chargedRatePct;
    case 'fixed':
      return terms.collateralCreditRatePct ?? 0;
    case 'participating':
      return creditedThisYearPct;
  }
}

export function runPolicyLoanMechanics(
  states: readonly PolicyYearState[],
  terms: LoanTerms,
  tax: TaxContext
): LoanMechanicsResult {
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
        cashReceived: 0, interestCharged: 0, collateralCredit: 0, netCost: 0,
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
    const interestCharged = base * (terms.chargedRatePct / 100);
    const collRate = collateralRatePct(terms, s.creditedRatePct);
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
      collateralCredit: Math.round(collateralCredit),
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
        const n = yearsToCrossover(seed.loanBalance, st.surrenderValue, terms.chargedRatePct, st.creditedRatePct);
        return n === null ? null : Math.ceil(seed.policyYear + n);
      })()
    : null;

  const zeroYears = rows.filter((r) => r.collateralCreditedNothing).length;

  const carrierQuoted = [
    `the charged loan rate (${terms.chargedRatePct}%)`,
    ...(terms.type === 'fixed'
      ? [`the rate credited to held collateral (${terms.collateralCreditRatePct ?? 0}%)`]
      : []),
    ...(tax.isMec !== undefined ? ['whether the contract is a modified endowment contract — printed on the illustration as the seven-pay limit'] : []),
  ];

  const notes: string[] = [];
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
    carrierQuoted,
    notes,
  };
}
