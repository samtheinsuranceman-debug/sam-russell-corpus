/**
 * The maximum-extraction strategy: full premium in, 80% of surrender value out, every year.
 *
 * ## The strategy as described
 *
 * Pay the full planned premium every year. Every year, also borrow 80% of the available
 * surrender value. The loan is participating — the borrowed money stays in the indexed
 * account and keeps earning credit — so the client is paying loan interest while the
 * same dollars continue to be credited.
 *
 * When the credited rate beats the loan rate, this works and it works beautifully. The
 * spread is free money on borrowed dollars, and it compounds.
 *
 * ## The thing that has to be modeled honestly, or this is a trap
 *
 * The product has a 0% floor. The loan does not.
 *
 * In a floor year the indexed account credits zero and the loan still accrues at its
 * contractual rate. The client pays, say, 5% on a balance that earned 0%. The spread is
 * not merely absent that year — it is negative by the full loan rate, on a balance that
 * has been compounding since year one.
 *
 * And because the strategy draws 80% of surrender value EVERY year, the loan balance
 * grows faster than the account value in any year where the credit does not exceed the
 * draw plus interest. Two or three floor years in the wrong place and the loan balance
 * closes on the account value.
 *
 * If it reaches it, the policy lapses. A lapse with an outstanding loan is the worst
 * outcome in this entire platform: the loan is treated as a distribution to the extent
 * of gain, and the client owes ordinary income tax on money they already spent — with
 * no policy left and no cash to pay it. `lapseRisk` tracks the margin every year and
 * `phantomIncomeIfLapsed` prices the bill.
 *
 * So this engine reports the average return, as asked, and it reports the three things
 * that decide whether the average was ever available: how close the loan came to the
 * account value, in which years the spread went negative, and what the tax bill would
 * be if it broke.
 *
 * A 30-year average return computed without showing the lapse margin is not a result.
 * It is survivorship bias with a percentage sign on it.
 */

import { creditRate } from './multiplierDecision';
import type { IndexOption } from './indexCreditingData';
import { RAW_INDEX_RETURNS } from './indexCreditingData';

export type LoanType =
  /** Borrowed funds stay in the indexed account and keep earning the credited rate. */
  | 'participating'
  /** Borrowed funds are moved to a fixed account at a declared rate. */
  | 'fixed-declared';

export interface StrategyInputs {
  readonly annualPremium: number;
  readonly premiumYears: number;
  readonly years: number;
  readonly issueAge: number;
  /** Fraction of available surrender value borrowed each year. The ask was 0.80. */
  readonly drawFraction: number;
  readonly loanType: LoanType;
  /** Annual loan interest rate as a decimal. */
  readonly loanRate: number;
  /** Credited rate applied to loaned funds under a fixed-declared loan, as a decimal. */
  readonly declaredCreditRate?: number;
  readonly option: IndexOption;
  /** Premium load as a decimal, taken off each premium before it reaches the account. */
  readonly premiumLoad: number;
  /** Annual policy charge as a decimal of account value, standing in for COI and expenses. */
  readonly accountChargeRate: number;
  /** Surrender charge as a decimal of account value, declining to zero. */
  readonly surrenderChargeYears: number;
  /** First policy year a loan is permitted. */
  readonly firstLoanYear: number;
  /** Start year of the historical window to run. */
  readonly startYear: number;
}

export interface StrategyYear {
  readonly policyYear: number;
  readonly calendarYear: number;
  readonly attainedAge: number;
  readonly rawIndexPct: number;
  readonly creditedPct: number;
  readonly premiumPaid: number;
  readonly accountValueBefore: number;
  readonly indexCredit: number;
  readonly policyCharge: number;
  readonly costOfInsurance: number;
  readonly accountValueAfter: number;
  readonly surrenderValue: number;
  readonly loanDrawn: number;
  readonly loanInterest: number;
  readonly loanBalance: number;
  /** Account value minus loan balance. The client's actual equity. */
  readonly netEquity: number;
  /** Credited rate minus loan rate on the borrowed balance, in dollars. */
  readonly spreadOnBorrowed: number;
  /** How close the loan is to the account value. 1.0 means lapse. */
  readonly lapseRatio: number;
  readonly floorYear: boolean;
}

export interface StrategyResult {
  readonly years: readonly StrategyYear[];
  readonly totalPremiumPaid: number;
  readonly totalLoanDrawn: number;
  readonly totalLoanInterest: number;
  readonly endingAccountValue: number;
  readonly endingLoanBalance: number;
  readonly endingNetEquity: number;
  /** Money-weighted return on premiums paid, accounting for loans taken as cash received. */
  readonly internalRateOfReturn: number | null;
  readonly averageCreditedPct: number;
  readonly floorYearCount: number;
  /** Years where the loan cost more than the credit earned on the borrowed balance. */
  readonly negativeSpreadYears: number;
  /** Highest loan-to-account ratio reached. Above ~0.90 the policy is in danger. */
  readonly peakLapseRatio: number;
  readonly lapsed: boolean;
  readonly lapseYear: number | null;
  readonly phantomIncomeIfLapsed: number;
  readonly warnings: readonly string[];
  readonly plain: string;
}

/**
 * Cost of insurance as a fraction of net amount at risk, rising with attained age.
 *
 * Gompertz-shaped and deliberately approximate — real COI comes from the carrier's rate
 * table, which is not in this repository (see `stillMissing` in pacificHorizonEcv.ts).
 * It is here so that the model does not pretend insurance is free, which is the error
 * that makes these projections look better than they are. Replace with the real table
 * before anything goes in front of a client.
 */
export function approximateCoiRate(attainedAge: number): number {
  return 0.0006 * Math.exp(0.082 * (attainedAge - 35));
}

function irr(cashflows: readonly number[]): number | null {
  const npv = (r: number) => cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + r, i), 0);
  let lo = -0.9999;
  let hi = 2;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function runAnnualLoanStrategy(input: StrategyInputs): StrategyResult {
  if (input.drawFraction < 0 || input.drawFraction > 1) {
    throw new RangeError('Draw fraction must be between 0 and 1.');
  }
  if (input.years <= 0) throw new RangeError('Years must be positive.');
  if (input.loanType === 'fixed-declared' && input.declaredCreditRate === undefined) {
    throw new Error(
      'A fixed-declared loan needs a declared credit rate. Without it the model would be ' +
        'guessing at the one number that decides whether the strategy works.',
    );
  }

  const rows: StrategyYear[] = [];
  const warnings: string[] = [];
  let accountValue = 0;
  let loanBalance = 0;
  let totalPremium = 0;
  let totalDrawn = 0;
  let totalInterest = 0;
  let lapsed = false;
  let lapseYear: number | null = null;
  let peakLapseRatio = 0;

  // Cashflows for IRR: premiums are outflows, loans are inflows the client actually spends.
  const cashflows: number[] = [];

  for (let py = 1; py <= input.years; py++) {
    const calendarYear = input.startYear + py - 1;
    const attainedAge = input.issueAge + py - 1;
    const raw = RAW_INDEX_RETURNS[input.option.index]?.[calendarYear];
    if (raw === undefined) break;

    const premium = py <= input.premiumYears ? input.annualPremium : 0;
    totalPremium += premium;
    accountValue += premium * (1 - input.premiumLoad);
    const accountValueBefore = accountValue;

    // Credit. Under a participating loan the borrowed balance is still credited, which is
    // the whole premise of the strategy.
    const creditedPct = creditRate(input.option, raw);
    const creditableBase =
      input.loanType === 'participating' ? accountValue : Math.max(0, accountValue - loanBalance);
    const indexCredit = creditableBase * (creditedPct / 100);
    const declaredCredit =
      input.loanType === 'fixed-declared'
        ? Math.min(loanBalance, accountValue) * (input.declaredCreditRate ?? 0)
        : 0;
    accountValue += indexCredit + declaredCredit;

    // Charges. Cost of insurance is on the net amount at risk, which is why a policy
    // drained by loans gets MORE expensive to carry, not less.
    const policyCharge = accountValue * input.accountChargeRate;
    const netAmountAtRisk = Math.max(0, input.annualPremium * input.premiumYears * 4 - accountValue);
    const coi = netAmountAtRisk * approximateCoiRate(attainedAge);
    accountValue = Math.max(0, accountValue - policyCharge - coi);

    // Loan interest accrues on last year's balance before this year's draw.
    const loanInterest = loanBalance * input.loanRate;
    loanBalance += loanInterest;
    totalInterest += loanInterest;

    // Surrender value net of any remaining surrender charge.
    const scFraction =
      py <= input.surrenderChargeYears
        ? (input.surrenderChargeYears - py + 1) / input.surrenderChargeYears * 0.10
        : 0;
    const surrenderValue = Math.max(0, accountValue * (1 - scFraction));

    // The draw: a fraction of surrender value not already borrowed.
    let loanDrawn = 0;
    if (py >= input.firstLoanYear && !lapsed) {
      const available = Math.max(0, surrenderValue - loanBalance);
      loanDrawn = available * input.drawFraction;
      loanBalance += loanDrawn;
      totalDrawn += loanDrawn;
    }

    const spreadOnBorrowed =
      input.loanType === 'participating'
        ? loanBalance * (creditedPct / 100 - input.loanRate)
        : loanBalance * ((input.declaredCreditRate ?? 0) - input.loanRate);

    const lapseRatio = accountValue > 0 ? loanBalance / accountValue : 1;
    peakLapseRatio = Math.max(peakLapseRatio, lapseRatio);

    if (!lapsed && lapseRatio >= 1) {
      lapsed = true;
      lapseYear = py;
      warnings.push(
        `The policy lapses in year ${py} (age ${attainedAge}). The loan balance reached the ` +
          'account value. Every dollar of gain becomes taxable income in that year, and there ' +
          'is no policy left and no cash to pay it with.',
      );
    }

    cashflows.push(loanDrawn - premium);

    rows.push({
      policyYear: py,
      calendarYear,
      attainedAge,
      rawIndexPct: raw,
      creditedPct: Number(creditedPct.toFixed(4)),
      premiumPaid: Math.round(premium),
      accountValueBefore: Math.round(accountValueBefore),
      indexCredit: Math.round(indexCredit + declaredCredit),
      policyCharge: Math.round(policyCharge),
      costOfInsurance: Math.round(coi),
      accountValueAfter: Math.round(accountValue),
      surrenderValue: Math.round(surrenderValue),
      loanDrawn: Math.round(loanDrawn),
      loanInterest: Math.round(loanInterest),
      loanBalance: Math.round(loanBalance),
      netEquity: Math.round(accountValue - loanBalance),
      spreadOnBorrowed: Math.round(spreadOnBorrowed),
      lapseRatio: Number(lapseRatio.toFixed(4)),
      floorYear: creditedPct <= 0.0001,
    });

    if (lapsed) break;
  }

  // Terminal value is the net equity the client could actually walk away with.
  const endingNet = rows.length ? rows[rows.length - 1].netEquity : 0;
  const terminalFlows = [...cashflows];
  terminalFlows[terminalFlows.length - 1] = (terminalFlows[terminalFlows.length - 1] ?? 0) + endingNet;

  const floorYearCount = rows.filter((r) => r.floorYear).length;
  const negativeSpreadYears = rows.filter((r) => r.spreadOnBorrowed < 0).length;
  const avgCredited = rows.length
    ? rows.reduce((s, r) => s + r.creditedPct, 0) / rows.length
    : 0;

  const gain = Math.max(0, (rows[rows.length - 1]?.accountValueAfter ?? 0) - totalPremium + totalDrawn);
  const phantom = lapsed ? gain : 0;

  if (peakLapseRatio > 0.9 && !lapsed) {
    warnings.push(
      `The loan reached ${(peakLapseRatio * 100).toFixed(0)}% of account value. That is inside ` +
        'the band where one floor year forces a repayment the client has not planned for.',
    );
  }
  if (negativeSpreadYears > 0) {
    warnings.push(
      `${negativeSpreadYears} of ${rows.length} years had a negative spread — the loan cost more ` +
        'than the borrowed balance earned. The floor protects the account value; it does not ' +
        'protect against the loan rate.',
    );
  }
  if (input.drawFraction >= 0.8) {
    warnings.push(
      `Drawing ${(input.drawFraction * 100).toFixed(0)}% of surrender value every year leaves ` +
        'almost no buffer. This run happens to work or not on the particular order of returns ' +
        'in this window; run the sequence stress test before presenting it.',
    );
  }

  return {
    years: rows,
    totalPremiumPaid: Math.round(totalPremium),
    totalLoanDrawn: Math.round(totalDrawn),
    totalLoanInterest: Math.round(totalInterest),
    endingAccountValue: rows[rows.length - 1]?.accountValueAfter ?? 0,
    endingLoanBalance: rows[rows.length - 1]?.loanBalance ?? 0,
    endingNetEquity: endingNet,
    internalRateOfReturn: irr(terminalFlows),
    averageCreditedPct: Number(avgCredited.toFixed(4)),
    floorYearCount,
    negativeSpreadYears,
    peakLapseRatio: Number(peakLapseRatio.toFixed(4)),
    lapsed,
    lapseYear,
    phantomIncomeIfLapsed: Math.round(phantom),
    warnings,
    plain: lapsed
      ? `LAPSED in year ${lapseYear}. ${Math.round(totalDrawn).toLocaleString()} was drawn out, ` +
        `and a ${Math.round(phantom).toLocaleString()} taxable event lands with no policy and ` +
        'no cash to pay it. This is the failure mode this strategy has, and it is not remote.'
      : `Drew ${Math.round(totalDrawn).toLocaleString()} over ${rows.length} years against ` +
        `${Math.round(totalPremium).toLocaleString()} of premium, ending with ` +
        `${endingNet.toLocaleString()} of net equity. ` +
        `Average credit ${avgCredited.toFixed(2)}%. ` +
        `${floorYearCount} floor years, ${negativeSpreadYears} negative-spread years. ` +
        `Loan peaked at ${(peakLapseRatio * 100).toFixed(0)}% of account value.`,
  };
}

/**
 * Run the strategy across every available start year to see how much the answer depended
 * on when it began.
 *
 * This is the check that separates a strategy from a lucky window. If the same plan
 * lapses starting in one year and thrives starting two years later, the average return
 * across all windows is not the story — the dispersion is.
 */
export function startYearSensitivity(
  base: Omit<StrategyInputs, 'startYear'>,
  candidateStartYears: readonly number[],
): {
  readonly runs: readonly { startYear: number; irr: number | null; lapsed: boolean; peakLapseRatio: number; endingNetEquity: number }[];
  readonly lapseCount: number;
  readonly plain: string;
} {
  const runs = candidateStartYears.map((startYear) => {
    const r = runAnnualLoanStrategy({ ...base, startYear });
    return {
      startYear,
      irr: r.internalRateOfReturn,
      lapsed: r.lapsed,
      peakLapseRatio: r.peakLapseRatio,
      endingNetEquity: r.endingNetEquity,
    };
  });
  const lapseCount = runs.filter((r) => r.lapsed).length;
  const irrs = runs.map((r) => r.irr).filter((x): x is number => x !== null);

  return {
    runs,
    lapseCount,
    plain:
      `${runs.length} start years tested. ${lapseCount} lapsed. ` +
      (irrs.length
        ? `Surviving returns ranged ${(Math.min(...irrs) * 100).toFixed(2)}% to ` +
          `${(Math.max(...irrs) * 100).toFixed(2)}%. `
        : 'No run produced a computable return. ') +
      (lapseCount > 0
        ? 'A strategy that lapses in some start years and not others is a strategy whose outcome ' +
          'is decided by the calendar, not by the plan.'
        : 'No start year lapsed in this window, which is evidence but not a guarantee.'),
  };
}

export const LOAN_STRATEGY_RULES = {
  neverPrinted: [
    'An average return without the peak loan-to-account ratio beside it.',
    'A loan strategy result from a single start year, presented as the strategy’s return.',
    'A participating-loan spread shown only in years it was positive.',
    'A lapse projection without the phantom income figure.',
    'Any suggestion that the 0% floor protects the client against the loan rate. It does not.',
  ],
} as const;
