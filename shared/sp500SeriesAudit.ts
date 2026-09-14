/**
 * The S&P 500 series this platform runs on, checked against the carrier's own
 * published claims — and failing.
 *
 * ## Why this file exists
 *
 * Every index figure on this platform is computed from
 * `RAW_INDEX_RETURNS.SP500` in shared/indexCreditingData.ts. That series has
 * never carried a source. It was typed in, and nothing has ever tested it
 * against a number published by somebody else.
 *
 * Two carrier documents make arithmetic claims about the S&P 500 price index
 * that the series can be checked against. It does not pass.
 *
 *     Claim (BGA II IUL flier, DOFU 6-2023 Rev 3-2024, 2924526):
 *       "The S&P 500 Index averaged an 8.06% annual return over the last 30
 *        years" — i.e. 1994-2023.
 *       Our series: 8.29% geometric. Off by 0.23 points.
 *
 *     Claim (same flier):
 *       "In 18 of the last 30 years, the S&P has exceeded a hypothetical 10%
 *        cap by an average of 12.23%."
 *       Our series: 16 years, average excess 13.66%. Off by 2 years and
 *       1.43 points.
 *
 * A 30-year geometric mean that is close while the year count is wrong by two
 * is the signature of individual years being wrong in offsetting directions,
 * not of a small rounding difference. Aggregates can agree while the years
 * underneath them disagree, and every segment figure this platform reports is
 * built from the YEARS, not the aggregate.
 *
 * ## What this means for the figures already reported
 *
 * The two-year segment credits quoted from this platform — 36.22%, 47.97%,
 * 1.89%, 14.84%, 49.97%, 34.22% for the segments starting 2019 through 2024 —
 * are arithmetic performed correctly on a series that does not reconcile to
 * the carrier's own published claims. The method is right. The inputs are not
 * established, so the outputs are not either.
 *
 * They should not be shown to a client, put in a proposal, or quoted as the
 * record until the series is replaced with one that reconciles.
 *
 * ## What has NOT been done, deliberately
 *
 * The series has not been rewritten. Replacing an unsourced series with
 * another unsourced series — one recalled rather than fetched — would leave
 * the platform in exactly the same position while destroying the evidence that
 * anything was ever wrong. The fix is a fetched series from a named source
 * with an as-of date, and that requires outbound network access this
 * environment does not have.
 *
 * Until then `SP500_SERIES_VERIFIED` stays false and every surface that
 * reports an index figure is expected to say so.
 */

/**
 * False until the series reconciles to a published source. Surfaces that
 * report index-derived figures must show a provenance warning while this is
 * false.
 */
export const SP500_SERIES_VERIFIED = false;

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
  'years-over-10-cap': 0,
  'avg-excess-over-10-cap': 0.5,
};

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
