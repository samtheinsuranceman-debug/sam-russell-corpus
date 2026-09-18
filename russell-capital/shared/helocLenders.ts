/**
 * HELOC sourcing — ranking the lines, not the brands.
 *
 * ## Why there is no built-in list of banks in this file
 *
 * The ask was a list of the top ten lenders for home equity lines. Building that
 * as a hard-coded table of names and rates would be the one thing this platform
 * refuses everywhere else: a number on a screen with no source behind it. HELOC
 * rates move weekly, draw periods and margins differ by state and by borrower,
 * and a "top ten" published today is wrong inside a month.
 *
 * So this file holds the ENGINE and the rubric. The lender rows are supplied —
 * from quotes actually pulled, each carrying who said it and when. A quote with
 * no date does not score. That is the same contract as every other engine here.
 *
 * ## What the engine knows that a rate sheet does not
 *
 * The advertised rate is the least important number on a HELOC for this strategy.
 * What decides whether a line can carry a recycling cycle is:
 *
 *   - The MARGIN over prime, because the teaser expires and the margin does not.
 *   - Whether the draw period allows interest-only, and for how long.
 *   - The rate CAP, because a variable line at an uncapped rate against a floored
 *     policy is the trade that reverses in a bad year.
 *   - Whether the lender permits a subordinate lien, which decides whether a
 *     second line can ever go behind it.
 *   - Early-closure clawbacks, which quietly tax the rotation the strategy needs.
 *
 * A line with the lowest rate and a two-year clawback is worse for this purpose
 * than one a point higher with none.
 */

export interface LenderQuote {
  readonly lender: string;
  /** Who gave the figure and when. A quote without this does not score. */
  readonly source: string;
  /** ISO date the quote was obtained. */
  readonly quotedOn: string;
  /** Introductory rate as a decimal, where one is offered. */
  readonly introRate?: number;
  readonly introMonths?: number;
  /** Margin over prime, as a decimal. This is the rate that actually persists. */
  readonly marginOverPrime: number;
  /** Lifetime rate cap as a decimal. Absent means uncapped, which is scored harshly. */
  readonly lifetimeCap?: number;
  readonly maxCltv: number;
  readonly maxLineAmount: number;
  readonly drawPeriodYears: number;
  readonly interestOnlyDuringDraw: boolean;
  /** Months during which early closure triggers a clawback of waived costs. */
  readonly earlyClosureClawbackMonths: number;
  readonly clawbackAmount?: number;
  readonly allowsSubordinateLien: boolean;
  readonly closingCostsWaived: boolean;
  readonly annualFee: number;
  /** True where the lender lends on non-owner-occupied investment property. */
  readonly lendsOnInvestmentProperty: boolean;
}

export interface ScoredLender {
  readonly lender: string;
  readonly score: number;
  readonly rank: number;
  /** Effective rate once any teaser expires, at the supplied prime. */
  readonly goingRate: number;
  readonly firstYearCost: number;
  readonly ongoingAnnualCost: number;
  readonly disqualified: boolean;
  readonly disqualifyingReason?: string;
  readonly strengths: readonly string[];
  readonly cautions: readonly string[];
  readonly plain: string;
}

export class UnsourcedQuoteError extends Error {
  constructor(lender: string) {
    super(
      `Refused to score the quote from ${lender}: every quote needs a source and a date. ` +
        'HELOC terms move weekly and an undated figure is not a quote, it is a memory.',
    );
    this.name = 'UnsourcedQuoteError';
  }
}

export interface ScoringInputs {
  readonly quotes: readonly LenderQuote[];
  /** Current prime rate as a decimal. */
  readonly primeRate: number;
  /** Line size being sought, for cost comparison. */
  readonly lineAmount: number;
  /** True when the collateral is a rental rather than a primary residence. */
  readonly investmentProperty: boolean;
  /** True when a second lien will need to go behind this one. */
  readonly needsSubordination: boolean;
  /** Expected months before the line is closed and rotated. */
  readonly expectedHoldMonths: number;
}

/**
 * Score and rank the supplied quotes for a recycling strategy specifically.
 *
 * Weighted toward what survives: the going rate after any teaser, the cap, and
 * whether rotating out of the line costs anything. Disqualifications are absolute
 * and are stated — a lender that will not lend on investment property is not
 * ranked tenth, it is out.
 */
export function rankLenders(inputs: ScoringInputs): ScoredLender[] {
  for (const q of inputs.quotes) {
    if (!q.source.trim() || !q.quotedOn.trim()) throw new UnsourcedQuoteError(q.lender);
  }
  if (inputs.quotes.length === 0) throw new Error('No quotes supplied.');

  const scored = inputs.quotes.map((q) => {
    const goingRate = inputs.primeRate + q.marginOverPrime;
    const introMonths = Math.min(q.introMonths ?? 0, inputs.expectedHoldMonths);
    const introRate = q.introRate ?? goingRate;

    const introCost = inputs.lineAmount * introRate * (introMonths / 12);
    const afterMonths = Math.max(0, inputs.expectedHoldMonths - introMonths);
    const afterCost = inputs.lineAmount * goingRate * (afterMonths / 12);
    const fees = q.annualFee * (inputs.expectedHoldMonths / 12);
    const clawback = inputs.expectedHoldMonths < q.earlyClosureClawbackMonths
      ? (q.clawbackAmount ?? 0)
      : 0;

    const firstYearCost = Math.round(
      inputs.lineAmount * (q.introRate ?? goingRate) + q.annualFee,
    );
    const ongoingAnnualCost = Math.round(inputs.lineAmount * goingRate + q.annualFee);
    const holdCost = introCost + afterCost + fees + clawback;

    const strengths: string[] = [];
    const cautions: string[] = [];
    let disqualified = false;
    let disqualifyingReason: string | undefined;

    if (inputs.investmentProperty && !q.lendsOnInvestmentProperty) {
      disqualified = true;
      disqualifyingReason = 'Does not lend on non-owner-occupied investment property.';
    }
    if (!disqualified && inputs.needsSubordination && !q.allowsSubordinateLien) {
      disqualified = true;
      disqualifyingReason =
        'Will not permit a subordinate lien, so no second line can ever go behind it.';
    }
    if (!disqualified && q.maxLineAmount < inputs.lineAmount) {
      disqualified = true;
      disqualifyingReason =
        `Maximum line of ${q.maxLineAmount.toLocaleString()} is below the ` +
        `${inputs.lineAmount.toLocaleString()} sought.`;
    }

    if (q.lifetimeCap === undefined) {
      cautions.push(
        'No lifetime rate cap. A variable line with no ceiling against a floored policy is ' +
          'the trade that reverses in a bad year.',
      );
    } else if (q.lifetimeCap <= 0.12) {
      strengths.push(`Lifetime cap of ${(q.lifetimeCap * 100).toFixed(2)}%.`);
    }
    if (clawback > 0) {
      cautions.push(
        `Closing inside ${q.earlyClosureClawbackMonths} months claws back ` +
          `${(q.clawbackAmount ?? 0).toLocaleString()} — and rotation is the strategy.`,
      );
    }
    if (q.interestOnlyDuringDraw) strengths.push(`Interest-only for a ${q.drawPeriodYears}-year draw.`);
    if (q.closingCostsWaived) strengths.push('Closing costs waived.');
    if (q.maxCltv >= 0.85) strengths.push(`Lends to ${(q.maxCltv * 100).toFixed(0)}% CLTV.`);
    if (q.introRate !== undefined && q.introRate < goingRate) {
      cautions.push(
        `The ${(q.introRate * 100).toFixed(2)}% is introductory for ${q.introMonths} months. ` +
          `The rate that persists is prime plus ${(q.marginOverPrime * 100).toFixed(2)}% = ` +
          `${(goingRate * 100).toFixed(2)}%.`,
      );
    }

    // Lower cost is better, so the score inverts it. Disqualified lines score zero.
    const score = disqualified ? 0 : Math.round(1_000_000_000 / Math.max(1, holdCost));

    return {
      lender: q.lender,
      score,
      rank: 0,
      goingRate: Number(goingRate.toFixed(5)),
      firstYearCost,
      ongoingAnnualCost,
      disqualified,
      disqualifyingReason,
      strengths,
      cautions,
      plain:
        disqualified
          ? `${q.lender}: OUT. ${disqualifyingReason}`
          : `${q.lender}: prime plus ${(q.marginOverPrime * 100).toFixed(2)}% = ` +
            `${(goingRate * 100).toFixed(2)}% once any teaser ends. ` +
            `${Math.round(holdCost).toLocaleString()} to carry ${inputs.lineAmount.toLocaleString()} ` +
            `for ${inputs.expectedHoldMonths} months, all in. Quoted ${q.quotedOn} — ${q.source}.`,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: s.disqualified ? 0 : i + 1 }));
}

/**
 * How many distinct lines the rotation needs, and whether the quotes can supply them.
 *
 * The strategy rotates lenders so no single one carries the whole pattern. That
 * only works if enough qualifying lenders exist, and this says plainly when they
 * do not rather than implying an unlimited supply.
 */
export function rotationCapacity(
  ranked: readonly ScoredLender[],
  cyclesPlanned: number,
): { qualifying: number; enough: boolean; plain: string } {
  const qualifying = ranked.filter((r) => !r.disqualified).length;
  return {
    qualifying,
    enough: qualifying >= cyclesPlanned,
    plain:
      qualifying >= cyclesPlanned
        ? `${qualifying} qualifying lenders against ${cyclesPlanned} planned cycles. The rotation has room.`
        : `Only ${qualifying} qualifying lenders against ${cyclesPlanned} planned cycles. ` +
          'Either some lenders are used twice — which is the pattern the rotation exists to ' +
          'avoid — or the plan needs more sourcing before it is presentable.',
  };
}

export const LENDER_RULES = {
  neverPrinted: [
    'A lender rate with no source and no date beside it.',
    'An introductory rate presented as the rate. The margin over prime is what persists.',
    'A ranking that omits a disqualified lender rather than showing it as disqualified and why.',
    'Any suggestion that a lender may be kept unaware of other liens or of the borrower’s pattern. Applications ask, and the answer is a representation.',
    'An implied unlimited supply of lenders. The rotation is finite and the count is knowable.',
  ],
} as const;
