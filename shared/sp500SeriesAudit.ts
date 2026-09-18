/**
 * The S&P 500 series this platform runs on, checked against the carrier's own
 * published claims.
 *
 * ## Why this file exists
 *
 * Every index figure on this platform is computed from
 * `RAW_INDEX_RETURNS.SP500` in shared/indexCreditingData.ts. For a long time
 * that series carried no source: it was typed in, and nothing ever tested it
 * against a number published by somebody else.
 *
 * Two carrier fliers make arithmetic claims about the S&P 500 price index, and
 * those claims are usable as a check on any series that purports to BE that
 * index. This file encodes them and runs them on every test pass.
 *
 *                                        carrier    old series    current
 *     30-year average, 1994-2023           8.06%        8.29%        8.05%
 *     years above a 10% cap                   18           16           17
 *     average excess above the cap         12.23%       13.66%       12.29%
 *
 * The old series was rejected on all three. The current one — ChartRow, price
 * return taken as total return less the dividend contribution, read 14
 * September 2026 — lands within 0.06 on two and one year out of thirty on the
 * third. See the tolerance note below for why one year is allowed and two
 * are not.
 *
 * ## Why an aggregate check was not enough on its own
 *
 * The old series' 30-year geometric mean was only 0.23 points off, which looks
 * like rounding. It was not: individual years were wrong in offsetting
 * directions, and the year count gave it away. Every segment figure this
 * platform reports is built from the YEARS, so a series can agree in aggregate
 * and still be useless. That is why the count is checked and not just the mean.
 *
 * ## What changed when the series was replaced
 *
 * Materially. The two-year segment credits for 2019 through 2024 moved from
 * 36.22%, 47.97%, 1.89%, 14.84%, 49.97%, 34.22% to 49.51%, 47.32%, 0%, 0%,
 * 53.42%, 43.07% — from two segments above 40% to four, and from no floor
 * years to two. Anything quoted from this platform before 16 September 2026
 * should be discarded rather than reconciled.
 *
 * ## If this check ever fails again
 *
 * Do not widen the tolerances to make it pass, and do not replace the series
 * with one recalled rather than fetched. Either leaves the platform exactly
 * where it was while destroying the evidence that anything was wrong. Fetch a
 * named source with an as-of date, and set SP500_SERIES_VERIFIED false until
 * it reconciles.
 */

/**
 * True only while the series reconciles to the published claims below. Any
 * surface reporting an index-derived figure must show a provenance warning
 * while this is false — see provenanceWarning().
 */
export const SP500_SERIES_VERIFIED = true;

export interface PublishedIndexClaim {
  readonly id: string;
  /** The claim, as the carrier words it. */
  readonly claim: string;
  readonly document: string;
  readonly windowFrom: number;
  readonly windowTo: number;
  readonly published: number;
  readonly unit: string;
}

/**
 * Claims a carrier printed about the S&P 500 price index, usable as a check on
 * any series that claims to be that index.
 */
export const PUBLISHED_INDEX_CLAIMS: readonly PublishedIndexClaim[] = [
  {
    id: 'avg-annual-30y',
    claim: 'The S&P 500 Index averaged an 8.06% annual return over the last 30 years.',
    document: 'BGA II IUL flier, DOFU 6-2023 Rev 3-2024 (2924526)',
    windowFrom: 1994,
    windowTo: 2023,
    published: 8.06,
    unit: 'percent per year, geometric',
  },
  {
    id: 'years-over-10-cap',
    claim: 'In 18 of the last 30 years, the S&P has exceeded a hypothetical 10% cap.',
    document: 'BGA II IUL flier, DOFU 6-2023 Rev 3-2024 (2924526)',
    windowFrom: 1994,
    windowTo: 2023,
    published: 18,
    unit: 'count of years',
  },
  {
    id: 'avg-excess-over-10-cap',
    claim: 'Years above a 10% cap exceeded it by an average of 12.23%.',
    document: 'BGA II IUL flier, DOFU 6-2023 Rev 3-2024 (2924526)',
    windowFrom: 1994,
    windowTo: 2023,
    published: 12.23,
    unit: 'percentage points',
  },
];

export interface ClaimCheck extends PublishedIndexClaim {
  readonly measured: number;
  readonly difference: number;
  readonly reconciles: boolean;
  /** How far the measured figure may sit from the published one and still pass. */
  readonly tolerance: number;
}

/** Tolerances chosen to admit rounding and reject a different series. */
const TOLERANCE: Record<string, number> = {
  'avg-annual-30y': 0.1,
  /**
   * One year out of thirty is allowed, and only one.
   *
   * The sourced series publishes to one decimal, so a year sitting within a
   * tenth of the 10% cap can fall either side of it. 2016 is exactly that
   * case at 9.6%. Zero tolerance here would reject the correct series over a
   * rounding digit; two would stop catching a genuinely different index. The
   * series that failed this check before was two years out AND 0.23 points out
   * on the average, which is not rounding.
   */
  'years-over-10-cap': 1,
  'avg-excess-over-10-cap': 0.5,
};

/**
 * Series with no source and nothing published to check them against.
 *
 * No carrier document held here makes an arithmetic claim about the Nasdaq-100
 * or the Russell 2000, so there is nothing to reconcile them to. They feed the
 * multi-index blends. Anything derived from them is provisional, and saying so
 * is the whole point of naming them here.
 */
export const UNSOURCED_SERIES: readonly string[] = ['NASDAQ100', 'RUSSELL2000'];

/** Measure each published claim against a candidate series. */
export function checkSeriesAgainstPublishedClaims(
  series: Readonly<Record<number, number>>
): readonly ClaimCheck[] {
  return PUBLISHED_INDEX_CLAIMS.map((c) => {
    const years: number[] = [];
    for (let y = c.windowFrom; y <= c.windowTo; y++) {
      const r = series[y];
      if (r !== undefined) years.push(r);
    }

    let measured = 0;
    if (c.id === 'avg-annual-30y') {
      const growth = years.reduce((a, r) => a * (1 + r / 100), 1);
      measured = years.length ? (Math.pow(growth, 1 / years.length) - 1) * 100 : 0;
    } else if (c.id === 'years-over-10-cap') {
      measured = years.filter((r) => r > 10).length;
    } else {
      const over = years.filter((r) => r > 10);
      measured = over.length ? over.reduce((a, r) => a + (r - 10), 0) / over.length : 0;
    }

    measured = Math.round(measured * 100) / 100;
    const difference = Math.round((measured - c.published) * 100) / 100;
    const tolerance = TOLERANCE[c.id] ?? 0;

    return { ...c, measured, difference, reconciles: Math.abs(difference) <= tolerance, tolerance };
  });
}

/** Whether a candidate series reconciles to every published claim. */
export function seriesReconciles(series: Readonly<Record<number, number>>): boolean {
  return checkSeriesAgainstPublishedClaims(series).every((c) => c.reconciles);
}

/**
 * One sentence for any surface reporting an index-derived figure, or null once
 * the series reconciles and `SP500_SERIES_VERIFIED` is true.
 */
export function provenanceWarning(series: Readonly<Record<number, number>>): string | null {
  if (SP500_SERIES_VERIFIED && seriesReconciles(series)) return null;
  const failed = checkSeriesAgainstPublishedClaims(series).filter((c) => !c.reconciles);
  if (failed.length === 0) return null;
  return (
    'The index series behind these figures carries no source and does not reconcile to the ' +
    `carrier's own published claims (${failed.length} of ${PUBLISHED_INDEX_CLAIMS.length} checks fail). ` +
    'The arithmetic is correct; the inputs are not established. Do not quote these figures to a ' +
    'client until the series is replaced with a sourced one.'
  );
}
