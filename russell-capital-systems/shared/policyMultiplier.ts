/**
 * The interest multiplier, and what it actually costs.
 *
 * Several carriers offer a rider that multiplies the index credit — 1.5x, 1.6x
 * — in exchange for an annual charge taken as a percentage of account value.
 * Pacific Life's is the one usually asked about, but the mechanism is the same
 * wherever it appears, so this models the mechanism rather than a product.
 *
 * ## The thing most illustrations bury
 *
 * The multiplier only pays in years the index credits something. The charge is
 * taken every year regardless.
 *
 * In a year the index falls, the floor holds the credit at 0%, the multiplier
 * multiplies zero, and the charge comes out of account value anyway. Over
 * 1996-2025 a capped S&P strategy credited zero in seven years out of thirty.
 * On those seven the rider is pure cost, and an illustration that shows only
 * the enhanced value never says so.
 *
 * So this returns both columns — with the rider and without — plus the count
 * of years the charge bought nothing, the cumulative charges, and the year the
 * rider first turns net positive. Whether it is worth it is the client's
 * decision. Whether they can see the trade is ours.
 *
 * ## Surrender value
 *
 * Surrender value is account value less any surrender charge still in force.
 * The schedule is a contract term that differs by carrier, product and issue
 * age, and is not invented here: pass one, or the result reports surrender
 * value as equal to account value and says plainly that no schedule was
 * supplied. A surrender value that silently equals account value in year three
 * is wrong by a large amount and wrong in the flattering direction.
 */

export interface MultiplierTerms {
  /** e.g. 160 means the credit is multiplied by 1.6. */
  readonly factorPct: number;
  /** Annual charge, as a percentage of account value, e.g. 0.6. */
  readonly annualChargePct: number;
  /**
   * Whether the charge is taken in a year the index credits nothing. For every
   * such rider we have seen it is, which is the whole point of this model —
   * but it is a term, not a law, so it is a field.
   */
  readonly chargedInZeroCreditYears?: boolean;
}

export interface MultiplierYear {
  readonly policyYear: number;
  readonly calendarYear: number;
  readonly creditedRatePct: number;
  /** Account value at year end without the rider. */
  readonly accountValueBase: number;
  /** Account value at year end with the rider. */
  readonly accountValueWithRider: number;
  readonly surrenderValueBase: number;
  readonly surrenderValueWithRider: number;
  /** Interest the multiplier added this year, before its charge. */
  readonly extraInterest: number;
  /** Charge taken this year. */
  readonly charge: number;
  /** extraInterest - charge. Negative means the rider cost more than it gave. */
  readonly netThisYear: number;
  /** True when the charge was taken and the multiplier added nothing. */
  readonly chargePaidForNothing: boolean;
}

export interface MultiplierResult {
  readonly years: readonly MultiplierYear[];
  readonly summary: {
    readonly finalAccountValueBase: number;
    readonly finalAccountValueWithRider: number;
    readonly finalSurrenderValueBase: number;
    readonly finalSurrenderValueWithRider: number;
    /** Positive means the rider was worth it over this run. */
    readonly accountValueDifference: number;
    readonly surrenderValueDifference: number;
    readonly totalExtraInterest: number;
    readonly totalCharges: number;
    readonly yearsChargePaidForNothing: number;
    /** First policy year where the rider is ahead, or null if never. */
    readonly breakEvenYear: number | null;
    readonly surrenderScheduleSupplied: boolean;
  };
  readonly notes: readonly string[];
}

export interface MultiplierInput {
  /** Credited rate per year, in percent, in policy-year order. */
  readonly creditHistory: readonly { readonly year: number; readonly creditedRatePct: number }[];
  readonly annualPremium: number;
  readonly fundingYears: number;
  readonly terms: MultiplierTerms;
  /**
   * Surrender charge by policy year, as a percentage of account value.
   * Index 0 is policy year 1. Absent means none is known.
   */
  readonly surrenderChargePctByYear?: readonly number[];
}

function surrenderValue(
  accountValue: number,
  policyYear: number,
  schedule?: readonly number[]
): number {
  if (!schedule || schedule.length === 0) return accountValue;
  const pct = schedule[policyYear - 1] ?? 0;
  return Math.max(0, accountValue * (1 - pct / 100));
}

export function runMultiplierComparison(input: MultiplierInput): MultiplierResult {
  const { creditHistory, annualPremium, fundingYears, terms, surrenderChargePctByYear } = input;
  const chargedInZero = terms.chargedInZeroCreditYears ?? true;
  const factor = terms.factorPct / 100;

  let base = 0;
  let rider = 0;
  let totalExtraInterest = 0;
  let totalCharges = 0;
  let yearsChargePaidForNothing = 0;
  let breakEvenYear: number | null = null;

  const years: MultiplierYear[] = [];

  creditHistory.forEach((h, i) => {
    const policyYear = i + 1;
    const premium = policyYear <= fundingYears ? annualPremium : 0;
    base += premium;
    rider += premium;

    const rate = h.creditedRatePct / 100;
    const baseInterest = base * rate;

    // The multiplier applies to the interest credited, so what it adds is the
    // interest times (factor - 1). A zero credit multiplies to zero however
    // large the factor: that is the whole point of this comparison.
    const riderInterestPlain = rider * rate;
    const extraInterest = rider * rate * (factor - 1);

    base += baseInterest;
    rider += riderInterestPlain + extraInterest;

    const creditedNothing = h.creditedRatePct <= 0;
    const charge = creditedNothing && !chargedInZero ? 0 : rider * (terms.annualChargePct / 100);
    rider -= charge;

    totalExtraInterest += extraInterest;
    totalCharges += charge;
    if (creditedNothing && charge > 0) yearsChargePaidForNothing++;

    if (breakEvenYear === null && rider > base) breakEvenYear = policyYear;

    years.push({
      policyYear,
      calendarYear: h.year,
      creditedRatePct: h.creditedRatePct,
      accountValueBase: Math.round(base),
      accountValueWithRider: Math.round(rider),
      surrenderValueBase: Math.round(surrenderValue(base, policyYear, surrenderChargePctByYear)),
      surrenderValueWithRider: Math.round(surrenderValue(rider, policyYear, surrenderChargePctByYear)),
      extraInterest: Math.round(extraInterest),
      charge: Math.round(charge),
      netThisYear: Math.round(extraInterest - charge),
      chargePaidForNothing: creditedNothing && charge > 0,
    });
  });

  const last = years[years.length - 1];
  const notes: string[] = [];
  if (!surrenderChargePctByYear || surrenderChargePctByYear.length === 0) {
    notes.push(
      "No surrender charge schedule was supplied, so surrender value is shown equal to account value. " +
      "A real policy carries a surrender charge for the first several years, and the true surrender value is lower."
    );
  }
  if (yearsChargePaidForNothing > 0) {
    notes.push(
      `In ${yearsChargePaidForNothing} of ${years.length} years the index credited nothing, the multiplier multiplied ` +
      "nothing, and the charge was taken anyway."
    );
  }
  if (breakEvenYear === null) {
    notes.push("Over this run the rider never overtook the same policy without it.");
  }

  return {
    years,
    summary: {
      finalAccountValueBase: last?.accountValueBase ?? 0,
      finalAccountValueWithRider: last?.accountValueWithRider ?? 0,
      finalSurrenderValueBase: last?.surrenderValueBase ?? 0,
      finalSurrenderValueWithRider: last?.surrenderValueWithRider ?? 0,
      accountValueDifference: (last?.accountValueWithRider ?? 0) - (last?.accountValueBase ?? 0),
      surrenderValueDifference: (last?.surrenderValueWithRider ?? 0) - (last?.surrenderValueBase ?? 0),
      totalExtraInterest: Math.round(totalExtraInterest),
      totalCharges: Math.round(totalCharges),
      yearsChargePaidForNothing,
      breakEvenYear,
      surrenderScheduleSupplied: Boolean(surrenderChargePctByYear?.length),
    },
    notes,
  };
}
