/**
 * Real Estate Mogul — portfolio-scale mortgage destruction and equity recycling.
 *
 * ## What this engine is for
 *
 * A client with thirty rentals is not thirty single-property problems. The
 * question is not "should I pay this one off" — it is "given thirty mortgages,
 * thirty rent rolls, a finite amount of borrowable equity and a policy structure
 * that lets a dollar do more than one job, what ORDER destroys the most interest
 * for the least risk, and where does that put me in twenty years."
 *
 * That is a sequencing problem, and sequencing problems have optimal answers.
 *
 * ## The cycle being modelled
 *
 *   1. Draw a HELOC against equity in properties that have it.
 *   2. Fund one or more IUL policies with the draw.
 *   3. Take policy LOANS back out (never surrenders — see policyLoanMechanics.ts).
 *   4. Apply the loan proceeds as PRINCIPAL-ONLY payments against a targeted
 *      mortgage, chosen by one of the strategies below.
 *   5. The principal reduction creates new equity in that property.
 *   6. Draw against the new equity, usually at a different lender, and repeat.
 *
 * ## Threading, and the thing about it nobody models
 *
 * A dollar can be routed through several policies before it reaches the mortgage:
 * fund policy 1, loan it out, fund policy 2 with the same dollar, loan it out,
 * and so on. Each pass adds that dollar to another policy's account value, and
 * because a non-direct-recognition carrier credits on the unreduced account value,
 * each of those account values earns.
 *
 * What is usually left out of that story is the other side of the ledger. Every
 * pass also creates a LOAN, and every loan accrues interest for as long as it is
 * outstanding. Threading through four policies builds four account values and
 * three loan balances, all compounding. The account values compound at the
 * credited rate; the loans compound at the loan rate. The strategy works while the
 * first exceeds the second and fails when a run of floor years reverses it.
 *
 * `threadingPlan` below models both sides. It reports the account-value multiple
 * AND the loan stack, and it computes the credited rate at which the two break
 * even — the number that decides whether a given thread depth is worth doing.
 *
 * ## What this engine will not do
 *
 * It will not report a single "optimal" answer with no alternative and no risk
 * figure. Three strategies are computed, each with an explicit weighting, and they
 * are returned ranked with the trade-off named. A portfolio strategy presented
 * without its downside is a sales tool, not an engine.
 */

import { coiRateForAge } from './timeMachineCompliance';

// ─── Properties ─────────────────────────────────────────────────────────────

export type LienType = 'first' | 'heloc' | 'second';

export interface PropertyLoan {
  readonly lender: string;
  readonly type: LienType;
  readonly originalBalance: number;
  readonly currentBalance: number;
  /** Annual nominal rate as a decimal, e.g. 0.0675. */
  readonly rate: number;
  /** Scheduled monthly principal-and-interest. Zero for interest-only. */
  readonly monthlyPI: number;
  /** Monthly interest-only payment, where the loan is interest-only. */
  readonly monthlyInterestOnly?: number;
  readonly termMonths: number;
  readonly monthsElapsed: number;
  readonly interestOnly: boolean;
  /**
   * Monthly private mortgage insurance, where it is being charged.
   *
   * PMI is the most reversible cost in a portfolio and the most often forgotten.
   * It buys the borrower nothing — it insures the LENDER — and on a conventional
   * loan it comes off once the balance reaches a threshold share of original
   * value. So a principal payment that crosses that line does two things at once:
   * it kills interest and it kills the premium. `pmiRemovalLtv` is where the line
   * sits; 0.80 is the conventional request threshold and 0.78 the automatic one.
   */
  readonly monthlyPmi?: number;
  readonly pmiRemovalLtv?: number;
}

export interface RentalYear {
  readonly year: number;
  readonly grossRent: number;
  readonly expenses: number;
}

export interface Property {
  readonly id: string;
  readonly label: string;
  readonly marketValue: number;
  readonly loans: readonly PropertyLoan[];
  /** Two to five years of history. The caller decides how many. */
  readonly rentalHistory: readonly RentalYear[];
  /** Combined loan-to-value a lender will go to on this property. */
  readonly maxCltv?: number;
}

export const MAX_PROPERTIES = 150;

// ─── Per-property arithmetic ────────────────────────────────────────────────

export interface LoanAnalysis {
  readonly lender: string;
  readonly type: LienType;
  readonly currentBalance: number;
  readonly rate: number;
  readonly monthlyPayment: number;
  /** Months remaining at the scheduled payment. Infinity for interest-only. */
  readonly monthsToPayoff: number;
  readonly remainingInterest: number;
  /** Interest as a share of all remaining payments. The "55%" figure, computed. */
  readonly interestShareOfPayments: number;
  /**
   * What the remaining interest would have become if it had instead been saved
   * annually into a 6% compounding account over the same period.
   */
  readonly lostPurchasingPower: number;
  readonly firstYearInterest: number;
  /** Annual PMI, where it is being charged. Pure cost — it insures the lender. */
  readonly annualPmi: number;
  /**
   * Balance at which PMI comes off, computed from the loan's original balance
   * and its removal threshold. Null when no PMI is being charged.
   */
  readonly pmiRemovalBalance: number | null;
  /** Principal needed to reach that threshold. Null when no PMI is charged. */
  readonly principalToKillPmi: number | null;
}

/**
 * Months to payoff at a fixed payment, and the interest paid getting there.
 *
 * Returns Infinity for a payment that does not cover the monthly interest — which
 * is exactly the interest-only case, and the reason it deserves its own answer
 * rather than a number that looks like progress.
 */
export function amortize(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  maxMonths = 1200,
): { months: number; totalInterest: number } {
  if (balance <= 0) return { months: 0, totalInterest: 0 };
  const r = annualRate / 12;
  const firstMonthInterest = balance * r;
  if (monthlyPayment <= firstMonthInterest + 1e-9) {
    return { months: Number.POSITIVE_INFINITY, totalInterest: Number.POSITIVE_INFINITY };
  }
  let b = balance;
  let interest = 0;
  let m = 0;
  while (b > 0.01 && m < maxMonths) {
    const i = b * r;
    interest += i;
    b = b + i - monthlyPayment;
    m += 1;
  }
  return { months: m, totalInterest: Math.round(interest) };
}

/**
 * The opportunity cost of interest, as a future value rather than a total.
 *
 * Interest paid in year one has had the whole term to compound; interest paid in
 * the final year has had none. Summing the interest and applying one growth factor
 * would overstate it badly, so this compounds each year's interest for only the
 * years remaining after it was paid.
 */
export function lostPurchasingPower(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  opportunityRate = 0.06,
): number {
  const r = annualRate / 12;
  if (monthlyPayment <= balance * r + 1e-9) {
    // Interest-only: the payment IS the loss, every year, forever until refinanced.
    const annualInterest = balance * annualRate;
    let fv = 0;
    for (let y = 0; y < 30; y += 1) fv = (fv + annualInterest) * (1 + opportunityRate);
    return Math.round(fv);
  }
  let b = balance;
  const yearlyInterest: number[] = [];
  let m = 0;
  while (b > 0.01 && m < 1200) {
    let yearInterest = 0;
    for (let k = 0; k < 12 && b > 0.01; k += 1) {
      const i = b * r;
      yearInterest += i;
      b = b + i - monthlyPayment;
      m += 1;
    }
    yearlyInterest.push(yearInterest);
  }
  const term = yearlyInterest.length;
  let fv = 0;
  for (let y = 0; y < term; y += 1) {
    fv += yearlyInterest[y] * Math.pow(1 + opportunityRate, term - y - 1);
  }
  return Math.round(fv);
}

export function analyzeLoan(loan: PropertyLoan, opportunityRate = 0.06): LoanAnalysis {
  const payment = loan.interestOnly
    ? (loan.monthlyInterestOnly ?? (loan.currentBalance * loan.rate) / 12)
    : loan.monthlyPI;
  const { months, totalInterest } = amortize(loan.currentBalance, loan.rate, payment);
  const totalPayments = Number.isFinite(months) ? payment * months : Number.POSITIVE_INFINITY;
  return {
    lender: loan.lender,
    type: loan.type,
    currentBalance: loan.currentBalance,
    rate: loan.rate,
    monthlyPayment: Math.round(payment),
    monthsToPayoff: months,
    remainingInterest: totalInterest,
    interestShareOfPayments: Number.isFinite(totalPayments) && totalPayments > 0
      ? Number((totalInterest / totalPayments).toFixed(4))
      : 1,
    lostPurchasingPower: lostPurchasingPower(loan.currentBalance, loan.rate, payment, opportunityRate),
    firstYearInterest: Math.round(loan.currentBalance * loan.rate),
    annualPmi: Math.round((loan.monthlyPmi ?? 0) * 12),
    // PMI comes off at a share of the loan's ORIGINAL balance, not of today's
    // market value — which is why an appreciating property does not shed it on
    // its own and a principal payment is the only thing that does.
    pmiRemovalBalance: loan.monthlyPmi
      ? Math.round(loan.originalBalance * (loan.pmiRemovalLtv ?? 0.8))
      : null,
    principalToKillPmi: loan.monthlyPmi
      ? Math.max(0, Math.round(loan.currentBalance - loan.originalBalance * (loan.pmiRemovalLtv ?? 0.8)))
      : null,
  };
}

export interface PropertyAnalysis {
  readonly id: string;
  readonly label: string;
  readonly marketValue: number;
  readonly totalDebt: number;
  readonly equity: number;
  readonly ltv: number;
  /** Equity a lender would lend against, net of existing liens. */
  readonly borrowableEquity: number;
  readonly loans: readonly LoanAnalysis[];
  readonly blendedRate: number;
  readonly annualInterestCost: number;
  readonly netOperatingIncome: number;
  readonly cashFlowAfterDebt: number;
  readonly capRate: number;
  readonly anyInterestOnly: boolean;
}

export function analyzeProperty(p: Property, opportunityRate = 0.06): PropertyAnalysis {
  const loans = p.loans.map((l) => analyzeLoan(l, opportunityRate));
  const totalDebt = p.loans.reduce((s, l) => s + l.currentBalance, 0);
  const equity = p.marketValue - totalDebt;
  const cltv = p.maxCltv ?? 0.8;
  const annualInterest = loans.reduce((s, l) => s + l.firstYearInterest, 0);
  const blended = totalDebt > 0 ? annualInterest / totalDebt : 0;

  const years = p.rentalHistory.length;
  const noi = years > 0
    ? p.rentalHistory.reduce((s, r) => s + (r.grossRent - r.expenses), 0) / years
    : 0;
  const debtService = loans.reduce((s, l) => s + l.monthlyPayment * 12, 0);

  return {
    id: p.id,
    label: p.label,
    marketValue: p.marketValue,
    totalDebt: Math.round(totalDebt),
    equity: Math.round(equity),
    ltv: p.marketValue > 0 ? Number((totalDebt / p.marketValue).toFixed(4)) : 0,
    borrowableEquity: Math.max(0, Math.round(p.marketValue * cltv - totalDebt)),
    loans,
    blendedRate: Number(blended.toFixed(4)),
    annualInterestCost: Math.round(annualInterest),
    netOperatingIncome: Math.round(noi),
    cashFlowAfterDebt: Math.round(noi - debtService),
    capRate: p.marketValue > 0 ? Number((noi / p.marketValue).toFixed(4)) : 0,
    anyInterestOnly: p.loans.some((l) => l.interestOnly),
  };
}

export interface PortfolioSummary {
  readonly propertyCount: number;
  readonly totalValue: number;
  readonly totalDebt: number;
  readonly totalEquity: number;
  readonly totalBorrowableEquity: number;
  readonly portfolioLtv: number;
  readonly annualInterestCost: number;
  readonly annualNoi: number;
  readonly annualCashFlow: number;
  readonly remainingInterestIfNothingChanges: number;
  readonly lostPurchasingPowerIfNothingChanges: number;
  readonly interestOnlyCount: number;
  readonly properties: readonly PropertyAnalysis[];
  readonly plain: string;
}

export function summarizePortfolio(
  properties: readonly Property[],
  opportunityRate = 0.06,
): PortfolioSummary {
  if (properties.length > MAX_PROPERTIES) {
    throw new RangeError(`This engine holds up to ${MAX_PROPERTIES} properties; received ${properties.length}.`);
  }
  const analyses = properties.map((p) => analyzeProperty(p, opportunityRate));
  const totalValue = analyses.reduce((s, a) => s + a.marketValue, 0);
  const totalDebt = analyses.reduce((s, a) => s + a.totalDebt, 0);
  const finiteInterest = analyses.flatMap((a) => a.loans)
    .map((l) => l.remainingInterest)
    .filter((v) => Number.isFinite(v));
  const remainingInterest = Math.round(finiteInterest.reduce((s, v) => s + v, 0));
  const lost = analyses.flatMap((a) => a.loans)
    .map((l) => l.lostPurchasingPower)
    .filter((v) => Number.isFinite(v))
    .reduce((s, v) => s + v, 0);
  const io = analyses.filter((a) => a.anyInterestOnly).length;

  return {
    propertyCount: analyses.length,
    totalValue: Math.round(totalValue),
    totalDebt,
    totalEquity: Math.round(totalValue - totalDebt),
    totalBorrowableEquity: analyses.reduce((s, a) => s + a.borrowableEquity, 0),
    portfolioLtv: totalValue > 0 ? Number((totalDebt / totalValue).toFixed(4)) : 0,
    annualInterestCost: analyses.reduce((s, a) => s + a.annualInterestCost, 0),
    annualNoi: analyses.reduce((s, a) => s + a.netOperatingIncome, 0),
    annualCashFlow: analyses.reduce((s, a) => s + a.cashFlowAfterDebt, 0),
    remainingInterestIfNothingChanges: remainingInterest,
    lostPurchasingPowerIfNothingChanges: Math.round(lost),
    interestOnlyCount: io,
    properties: analyses,
    plain:
      `${analyses.length} properties, ${Math.round(totalValue).toLocaleString()} in value against ` +
      `${totalDebt.toLocaleString()} of debt — ${Math.round(totalValue - totalDebt).toLocaleString()} ` +
      `in equity, of which ${analyses.reduce((s, a) => s + a.borrowableEquity, 0).toLocaleString()} ` +
      `is borrowable today. Interest costs ` +
      `${analyses.reduce((s, a) => s + a.annualInterestCost, 0).toLocaleString()} a year. ` +
      (io > 0 ? `${io} properties carry interest-only debt that never amortises. ` : '') +
      `Left alone, the remaining interest is ${remainingInterest.toLocaleString()}, and had that ` +
      `money been saved instead at ${(opportunityRate * 100).toFixed(0)}% it would have become ` +
      `${Math.round(lost).toLocaleString()}.`,
  };
}

// ─── Threading: one dollar, several policies ────────────────────────────────

export interface ThreadingInputs {
  /** The HELOC draw being threaded. */
  readonly amount: number;
  /** How many policies the dollar passes through. */
  readonly policyCount: number;
  /** Fraction of each premium recoverable as a policy loan the following year. */
  readonly loanableFraction: number;
  /** Annual interest charged on each policy loan. */
  readonly policyLoanRate: number;
  /** Annual interest on the HELOC itself. */
  readonly helocRate: number;
  /** Credited rate assumed on account value. */
  readonly creditedRate: number;
}

export interface ThreadingPlan {
  readonly policyCount: number;
  readonly amountDeployed: number;
  /** Sum of account values created across all policies. */
  readonly totalAccountValue: number;
  /** Account value per dollar deployed. The multiplier being sought. */
  readonly accountValueMultiple: number;
  /** Policy loans created by threading. One fewer than the policy count. */
  readonly policyLoanStack: number;
  readonly amountReachingMortgage: number;
  /** First-year cost of carrying the policy loans plus the HELOC. */
  readonly annualCarryCost: number;
  /** First-year credit on the stacked account value. */
  readonly annualCredit: number;
  readonly netFirstYear: number;
  /**
   * The credited rate at which carry cost equals credit. Below this, threading
   * this deep loses money every year it is held.
   */
  readonly breakEvenCreditedRate: number;
  readonly verdict: 'accretive' | 'marginal' | 'dilutive';
  readonly plain: string;
}

/**
 * Model threading a draw through N policies, both sides of the ledger.
 *
 * Each pass adds the amount to another policy's account value, and each pass after
 * the first requires a loan out of the previous policy, which accrues. The
 * multiple is real; so is the stack. The break-even rate is the number that says
 * whether a given depth is worth carrying.
 */
export function threadingPlan(i: ThreadingInputs): ThreadingPlan {
  if (i.policyCount < 1) throw new RangeError('policyCount must be at least 1');
  if (i.amount <= 0) throw new RangeError('amount must be positive');

  // Pass 1 funds policy 1 with the full draw. Each later pass funds the next
  // policy with what could be loaned back out of the one before it.
  const accountValues: number[] = [];
  let carried = i.amount;
  for (let n = 0; n < i.policyCount; n += 1) {
    accountValues.push(carried);
    carried = carried * i.loanableFraction;
  }
  const totalAv = accountValues.reduce((s, v) => s + v, 0);

  // Every pass after the first was funded by a loan against the previous policy.
  const loanStack = accountValues.slice(0, -1).reduce((s, v) => s + v * i.loanableFraction, 0);
  // What is left after the final pass is what reaches the mortgage.
  const reaching = carried;

  const annualCarry = loanStack * i.policyLoanRate + i.amount * i.helocRate;
  const annualCredit = totalAv * i.creditedRate;
  const net = annualCredit - annualCarry;
  const breakEven = totalAv > 0 ? annualCarry / totalAv : 0;

  return {
    policyCount: i.policyCount,
    amountDeployed: Math.round(i.amount),
    totalAccountValue: Math.round(totalAv),
    accountValueMultiple: Number((totalAv / i.amount).toFixed(3)),
    policyLoanStack: Math.round(loanStack),
    amountReachingMortgage: Math.round(reaching),
    annualCarryCost: Math.round(annualCarry),
    annualCredit: Math.round(annualCredit),
    netFirstYear: Math.round(net),
    breakEvenCreditedRate: Number(breakEven.toFixed(4)),
    verdict: net > annualCarry * 0.25 ? 'accretive' : net > 0 ? 'marginal' : 'dilutive',
    plain:
      `Threading ${Math.round(i.amount).toLocaleString()} through ${i.policyCount} ` +
      `${i.policyCount === 1 ? 'policy' : 'policies'} builds ` +
      `${Math.round(totalAv).toLocaleString()} of account value — ` +
      `${(totalAv / i.amount).toFixed(2)}x the money deployed — and leaves ` +
      `${Math.round(reaching).toLocaleString()} to hit the mortgage. It also creates ` +
      `${Math.round(loanStack).toLocaleString()} of policy loans. Carrying those plus the ` +
      `HELOC costs ${Math.round(annualCarry).toLocaleString()} a year against ` +
      `${Math.round(annualCredit).toLocaleString()} of credit at ` +
      `${(i.creditedRate * 100).toFixed(2)}%. Break-even is ` +
      `${(breakEven * 100).toFixed(2)}% — below that, this depth loses money every year ` +
      `it is held, and a floor year is exactly that.`,
  };
}

// ─── Targeting: which mortgage dies first ───────────────────────────────────

export type StrategyKey =
  | 'bleed-rate'
  | 'equity-unlock'
  | 'free-and-clear'
  | 'ladder-down';

export interface TargetScore {
  readonly propertyId: string;
  readonly label: string;
  readonly lender: string;
  readonly score: number;
  readonly reason: string;
}

export interface Strategy {
  readonly key: StrategyKey;
  readonly name: string;
  readonly weighting: string;
  readonly order: readonly TargetScore[];
  readonly firstYearInterestKilled: number;
  readonly riskNote: string;
}

/**
 * Three strategies, each with its weighting stated, ranked by the caller's goal.
 *
 * bleed-rate     — attack the dollars of interest bleeding out fastest. Kills the
 *                  most interest per dollar applied. Ignores how long a property
 *                  takes to free up.
 * equity-unlock  — attack where a principal payment unlocks the most new
 *                  borrowable equity, which funds the next cycle soonest. Fastest
 *                  compounding of the strategy itself, at the cost of carrying
 *                  more total debt for longer.
 * free-and-clear — attack the smallest balances first and take properties fully
 *                  unencumbered. Slowest on interest, but each completed property
 *                  removes a lender, a payment and a covenant. The conservative
 *                  path and the one that survives a credit tightening.
 */
export function buildStrategies(
  portfolio: PortfolioSummary,
  annualPrincipalAvailable: number,
): Strategy[] {
  const rows = portfolio.properties.flatMap((p) =>
    p.loans.map((l) => ({ p, l })),
  );

  const bleed = rows
    .map(({ p, l }) => ({
      propertyId: p.id,
      label: p.label,
      lender: l.lender,
      score: l.firstYearInterest,
      reason:
        `${l.firstYearInterest.toLocaleString()} of interest in the next twelve months at ` +
        `${(l.rate * 100).toFixed(2)}%${l.type === 'heloc' || l.monthsToPayoff === Infinity ? ', interest-only and never amortising' : ''}.`,
    }))
    .sort((a, b) => b.score - a.score);

  const unlock = rows
    .map(({ p, l }) => {
      const cltv = 0.8;
      const headroom = Math.max(0, p.marketValue * cltv - p.totalDebt);
      const unlocked = Math.min(annualPrincipalAvailable, l.currentBalance);
      return {
        propertyId: p.id,
        label: p.label,
        lender: l.lender,
        score: unlocked + headroom * 0.25,
        reason:
          `A ${Math.round(unlocked).toLocaleString()} principal payment here converts directly ` +
          `into borrowable equity, on top of ${Math.round(headroom).toLocaleString()} already ` +
          `available at 80% CLTV — the fastest route back to the next cycle.`,
      };
    })
    .sort((a, b) => b.score - a.score);

  const clear = rows
    .map(({ p, l }) => ({
      propertyId: p.id,
      label: p.label,
      lender: l.lender,
      score: -l.currentBalance,
      reason:
        `${l.currentBalance.toLocaleString()} outstanding — the smallest remaining balances ` +
        'clear first, and each one removes a lender, a payment and a covenant.',
    }))
    .sort((a, b) => b.score - a.score);

  // The owner's own instruction, and it is the right one: go after the biggest
  // balance carrying the highest rate, kill it, then the next biggest at the next
  // highest rate, and walk down the ladder eliminating them as fast as possible.
  //
  // Mathematically this is rate times balance — which is what `bleed` already
  // ranks — but the two differ in an important way. `bleed` ranks every LOAN in
  // the portfolio by annual interest, so it will happily spread a budget across
  // six properties and finish none of them. This ranks the same way and then
  // spends the whole budget on ONE target before moving to the next, so balances
  // actually reach zero and lenders actually go away.
  //
  // PMI is folded into the score where it is being charged. A premium that buys
  // the borrower nothing is pure annual cost, and a principal payment that
  // crosses the removal threshold kills it permanently — so the loans still
  // paying it are worth attacking sooner than their rate alone suggests.
  const ladder = rows
    .map(({ p, l }) => {
      const pmiAnnual = l.annualPmi;
      const interestAnnual = l.currentBalance * l.rate;
      return {
        propertyId: p.id,
        label: p.label,
        lender: l.lender,
        score: interestAnnual + pmiAnnual,
        reason:
          `${l.currentBalance.toLocaleString()} at ${(l.rate * 100).toFixed(2)}% — ` +
          `${Math.round(interestAnnual).toLocaleString()} of interest a year` +
          (pmiAnnual > 0
            ? ` plus ${Math.round(pmiAnnual).toLocaleString()} of PMI that insures the lender and ` +
              'buys the borrower nothing. ' +
              (l.principalToKillPmi !== null
                ? `${l.principalToKillPmi.toLocaleString()} of principal ends the premium permanently.`
                : 'Paying this one down past the removal threshold ends both costs at once.')
            : '. Biggest balance at the highest rate goes first, and the budget stays on it ' +
              'until the balance is zero.'),
      };
    })
    .sort((a, b) => b.score - a.score);

  const killed = (order: TargetScore[]) => {
    let budget = annualPrincipalAvailable;
    let interest = 0;
    for (const t of order) {
      if (budget <= 0) break;
      const row = rows.find((r) => r.p.id === t.propertyId && r.l.lender === t.lender)!;
      const applied = Math.min(budget, row.l.currentBalance);
      interest += applied * row.l.rate;
      budget -= applied;
    }
    return Math.round(interest);
  };

  return [
    {
      key: 'bleed-rate',
      name: 'Stop the Bleed',
      weighting: '100% weight on interest dollars per year. Rate times balance, highest first.',
      order: bleed,
      firstYearInterestKilled: killed(bleed),
      riskNote:
        'Kills the most interest per dollar, but can leave every property partially ' +
        'encumbered for years. Nothing becomes free and clear early, so a credit ' +
        'tightening finds the portfolio fully levered.',
    },
    {
      key: 'equity-unlock',
      name: 'Compound the Cycle',
      weighting: 'Weighted toward new borrowable equity created per dollar applied, plus existing CLTV headroom at 25%.',
      order: unlock,
      firstYearInterestKilled: killed(unlock),
      riskNote:
        'Fastest compounding of the strategy itself, and the highest total debt held ' +
        'for the longest. This is the aggressive path: it depends on lenders ' +
        'continuing to extend credit against re-created equity, which is the ' +
        'assumption that failed for everyone in 2008.',
    },
    {
      key: 'free-and-clear',
      name: 'Take Them Outright',
      weighting: 'Smallest balance first. Weighted entirely toward completed, unencumbered properties.',
      order: clear,
      firstYearInterestKilled: killed(clear),
      riskNote:
        'Slowest on interest by design. Every completed property is a lender removed, ' +
        'a payment gone and an asset no longer callable. The path that survives a ' +
        'credit market that stops cooperating.',
    },
    {
      key: 'ladder-down',
      name: 'Ladder Down',
      weighting:
        'Annual interest plus any PMI, highest first — biggest balance at the highest rate. ' +
        'Unlike Stop the Bleed, the whole budget stays on one target until its balance ' +
        'reaches zero before moving to the next.',
      order: ladder,
      firstYearInterestKilled: killed(ladder),
      riskNote:
        'Destroys the most cost per dollar AND finishes what it starts, so lenders come ' +
        'off the list instead of every property sitting half-paid. The trade is ' +
        'concentration: the budget is committed to one property at a time, so a cash ' +
        'need elsewhere in the portfolio has to wait for the current target to clear.',
    },
  ];
}

export interface RankedStrategy extends Strategy {
  readonly rank: number;
  readonly recommendation: string;
}

/**
 * Rank the three by a stated appetite, and say why — never silently.
 */
export function rankStrategies(
  strategies: readonly Strategy[],
  appetite: 'aggressive' | 'balanced' | 'conservative',
): RankedStrategy[] {
  const order: Record<typeof appetite, StrategyKey[]> = {
    aggressive: ['equity-unlock', 'ladder-down', 'bleed-rate', 'free-and-clear'],
    balanced: ['ladder-down', 'bleed-rate', 'equity-unlock', 'free-and-clear'],
    conservative: ['free-and-clear', 'ladder-down', 'bleed-rate', 'equity-unlock'],
  };
  const seq = order[appetite];
  const why: Record<StrategyKey, string> = {
    'bleed-rate': 'Most interest destroyed per dollar. The default when the goal is to stop losing money.',
    'equity-unlock': 'Fastest recycling, highest sustained leverage. Only where credit access is reliable.',
    'free-and-clear': 'Fewest lenders, most owned outright. The one that still works when credit does not.',
    'ladder-down':
      'Biggest balance at the highest rate, killed outright before moving on. Destroys the most ' +
      'cost per dollar and actually finishes properties, so lenders come off the list.',
  };
  return seq.map((key, idx) => {
    const s = strategies.find((x) => x.key === key)!;
    return { ...s, rank: idx + 1, recommendation: why[key] };
  });
}

// ─── Twenty-year projection and the growth path ─────────────────────────────

export interface GrowthAssumptions {
  /**
   * Annual home-price appreciation. The default is a long-run national figure and
   * is deliberately conservative; a client's own zip history should replace it,
   * and the source should travel with it.
   */
  readonly appreciation: number;
  /** Annual rent growth. */
  readonly rentGrowth: number;
  /** Annual operating-expense growth. */
  readonly expenseGrowth: number;
  /** Credited rate on policy account value. */
  readonly creditedRate: number;
  readonly helocRate: number;
  readonly policyLoanRate: number;
  /** Combined loan-to-value lenders will extend to. */
  readonly maxCltv: number;
  readonly source: string;
}

export const CONSERVATIVE_ASSUMPTIONS: GrowthAssumptions = {
  appreciation: 0.035,
  rentGrowth: 0.030,
  expenseGrowth: 0.035,
  creditedRate: 0.0554,
  helocRate: 0.0800,
  policyLoanRate: 0.0500,
  maxCltv: 0.75,
  source:
    'Conservative defaults. Replace appreciation and rent growth with the client’s own ' +
    'zip-level history before this is shown, and carry the source with the number.',
};

export interface ProjectionYear {
  readonly year: number;
  readonly portfolioValue: number;
  readonly portfolioDebt: number;
  readonly equity: number;
  readonly borrowableEquity: number;
  readonly annualNoi: number;
  readonly annualInterestCost: number;
  readonly policyAccountValue: number;
  readonly policyLoanBalance: number;
  readonly principalApplied: number;
  readonly propertiesOwned: number;
  readonly propertiesFreeAndClear: number;
}

export interface ProjectionResult {
  readonly years: readonly ProjectionYear[];
  readonly assumptions: GrowthAssumptions;
  readonly totalPrincipalApplied: number;
  readonly totalInterestAvoided: number;
  readonly endingEquity: number;
  readonly endingPolicyValue: number;
  readonly endingNetWorth: number;
  readonly plain: string;
  readonly caution: string;
}

/**
 * Run the cycle forward. Debt falls as principal is applied; values and rents
 * grow; policy account value accrues while its loan balance accrues too.
 *
 * A property is counted free and clear only when debt actually reaches zero, and
 * borrowable equity is recomputed every year against the CLTV ceiling — so the
 * strategy slows on its own when lenders would stop extending, rather than
 * compounding forever on paper.
 */
export function projectPortfolio(params: {
  portfolio: PortfolioSummary;
  assumptions: GrowthAssumptions;
  years: number;
  /** Annual HELOC draw deployed into the cycle. */
  annualDraw: number;
  policyCount: number;
  loanableFraction: number;
}): ProjectionResult {
  const a = params.assumptions;
  let value = params.portfolio.totalValue;
  let debt = params.portfolio.totalDebt;
  let noi = params.portfolio.annualNoi;
  let policyAv = 0;
  let policyLoan = 0;
  let totalPrincipal = 0;
  let totalInterestAvoided = 0;
  const n = params.portfolio.propertyCount;

  const rows: ProjectionYear[] = [];
  const blended = params.portfolio.totalDebt > 0
    ? params.portfolio.annualInterestCost / params.portfolio.totalDebt
    : 0;

  for (let y = 1; y <= params.years; y += 1) {
    value = value * (1 + a.appreciation);
    noi = noi * (1 + a.rentGrowth) - noi * a.expenseGrowth * 0.35;

    const headroom = Math.max(0, value * a.maxCltv - debt);
    const draw = Math.min(params.annualDraw, headroom);

    const thread = draw > 0
      ? threadingPlan({
          amount: draw,
          policyCount: params.policyCount,
          loanableFraction: params.loanableFraction,
          policyLoanRate: a.policyLoanRate,
          helocRate: a.helocRate,
          creditedRate: a.creditedRate,
        })
      : null;

    policyAv = policyAv * (1 + a.creditedRate) + (thread?.totalAccountValue ?? 0);
    policyLoan = policyLoan * (1 + a.policyLoanRate) + (thread?.policyLoanStack ?? 0);

    const principal = thread?.amountReachingMortgage ?? 0;
    const applied = Math.min(principal, debt);
    debt = Math.max(0, debt - applied + draw); // the draw itself is new debt
    totalPrincipal += applied;
    totalInterestAvoided += applied * blended;

    const interestCost = debt * blended;
    const freeAndClear = debt <= 0 ? n : Math.floor(n * Math.max(0, 1 - debt / Math.max(1, params.portfolio.totalDebt)));

    rows.push({
      year: y,
      portfolioValue: Math.round(value),
      portfolioDebt: Math.round(debt),
      equity: Math.round(value - debt),
      borrowableEquity: Math.round(Math.max(0, value * a.maxCltv - debt)),
      annualNoi: Math.round(noi),
      annualInterestCost: Math.round(interestCost),
      policyAccountValue: Math.round(policyAv),
      policyLoanBalance: Math.round(policyLoan),
      principalApplied: Math.round(applied),
      propertiesOwned: n,
      propertiesFreeAndClear: freeAndClear,
    });
  }

  const last = rows[rows.length - 1];
  return {
    years: rows,
    assumptions: a,
    totalPrincipalApplied: Math.round(totalPrincipal),
    totalInterestAvoided: Math.round(totalInterestAvoided),
    endingEquity: last.equity,
    endingPolicyValue: last.policyAccountValue,
    endingNetWorth: last.equity + last.policyAccountValue - last.policyLoanBalance,
    plain:
      `Over ${params.years} years: equity ${params.portfolio.totalEquity.toLocaleString()} to ` +
      `${last.equity.toLocaleString()}, debt ${params.portfolio.totalDebt.toLocaleString()} to ` +
      `${last.portfolioDebt.toLocaleString()}, policy account value ` +
      `${last.policyAccountValue.toLocaleString()} against ` +
      `${last.policyLoanBalance.toLocaleString()} of policy loans. Net of those loans, ` +
      `${(last.equity + last.policyAccountValue - last.policyLoanBalance).toLocaleString()}.`,
    caution:
      'Every year of this assumes lenders keep extending against re-created equity at ' +
      `${(a.maxCltv * 100).toFixed(0)}% CLTV, and that the credited rate holds at ` +
      `${(a.creditedRate * 100).toFixed(2)}% while policy loans accrue at ` +
      `${(a.policyLoanRate * 100).toFixed(2)}%. Run the sequence stress and survival tests ` +
      'in sequenceStress.ts against this loan schedule before presenting it — a run of ' +
      'floor years reverses the spread and the loan stack keeps compounding regardless.',
  };
}

export interface GrowthStep {
  readonly targetCount: number;
  readonly yearReached: number | null;
  readonly equityRequired: number;
  readonly equityAvailableThatYear: number;
  readonly feasible: boolean;
  readonly note: string;
}

/**
 * 30 to 60 to 120 to 240 — when each doubling becomes fundable, or why it does not.
 *
 * A doubling is fundable when borrowable equity covers the down payments the new
 * properties require. This reports the year each tier is reached and says plainly
 * when a tier is not reached inside the horizon, rather than extending the horizon
 * until the answer flatters.
 */
export function growthPath(params: {
  projection: ProjectionResult;
  startingCount: number;
  /** Average acquisition price of the next property. */
  averagePrice: number;
  /** Down payment fraction required. */
  downPaymentFraction: number;
  tiers?: readonly number[];
}): GrowthStep[] {
  const tiers = params.tiers ?? [
    params.startingCount * 2,
    params.startingCount * 4,
    params.startingCount * 8,
  ];
  return tiers.map((target) => {
    const additional = target - params.startingCount;
    const required = additional * params.averagePrice * params.downPaymentFraction;
    const hit = params.projection.years.find((y) => y.borrowableEquity >= required);
    return {
      targetCount: target,
      yearReached: hit ? hit.year : null,
      equityRequired: Math.round(required),
      equityAvailableThatYear: hit ? hit.borrowableEquity : params.projection.years[params.projection.years.length - 1].borrowableEquity,
      feasible: Boolean(hit),
      note: hit
        ? `${additional} more properties at ${params.averagePrice.toLocaleString()} each needs ` +
          `${Math.round(required).toLocaleString()} down. Borrowable equity crosses that in year ` +
          `${hit.year}.`
        : `${additional} more properties needs ${Math.round(required).toLocaleString()} down. ` +
          `Borrowable equity does not reach that inside the ${params.projection.years.length}-year ` +
          'horizon on these assumptions. Either the draw is too small, appreciation too low, ' +
          'or this tier needs outside capital rather than recycled equity.',
    };
  });
}

export const MOGUL_RULES = {
  neverPrinted: [
    'A projection that assumes lenders extend credit without limit. Every year is capped at the CLTV ceiling.',
    'A policy account value shown without the policy loan balance standing against it.',
    'An acquisition tier presented as reached when borrowable equity never covers its down payments.',
    'A single "optimal" sequence with no alternative and no risk note beside it.',
    'Any suggestion that a lender may be kept unaware of a borrower’s other liens. Loan applications ask, and the answer is a representation.',
  ],
} as const;
