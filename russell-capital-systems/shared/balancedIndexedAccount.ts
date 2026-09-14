/**
 * Multi-year index segments, and the 40% that is real but is not annual.
 *
 * ## The claim, checked
 *
 * "From 2020-2026 the index returned 40%+ four out of the last six years."
 *
 * Read as ANNUAL returns that is not what happened. The S&P 500 price index in
 * this platform's own series returned, for 2020 through 2025: 29.01%, 14.77%,
 * -9.23%, 28.36%, 16.84%, 15.52%. Not one year reached 40%, and the best was
 * 29.01%.
 *
 * Read as what the Balanced Indexed Account actually credits — a TWO-YEAR
 * segment — it is close to right, and that is the point worth keeping. Every
 * two-year segment that fits in 2019-2025, stepped one year at a time:
 *
 *     2019-2020   index 36.88%   credited 36.22%   annualized 16.71%
 *     2020-2021   index 48.06%   credited 47.97%   annualized 21.64%
 *     2021-2022   index  4.18%   credited  1.89%   annualized  0.94%
 *     2022-2023   index 16.51%   credited 14.84%   annualized  7.16%
 *     2023-2024   index 49.98%   credited 49.97%   annualized 22.46%
 *     2024-2025   index 34.97%   credited 34.22%   annualized 15.85%
 *
 * So, precisely: TWO of those six segments credited 40% or more, and FOUR of
 * the six credited 34% or more. "40%+ four out of the last six" is right about
 * the shape and one notch high on the threshold — at 34% the count of four
 * holds exactly. The weak segment, 2021-2022 at 1.89%, is listed here on
 * purpose: leave it out and four good segments out of five looks like a
 * different product than four out of six.
 *
 * ## Why the distinction is not pedantry
 *
 * Put "40%" next to a row labelled with a single year and a reader will take it
 * as an annual return. A 48% two-year credit is 21.64% a year — excellent, and
 * less than half of what "48%" suggests if the two-year term is not stated
 * beside it. Every figure this module produces therefore carries its segment
 * term and its annualized equivalent together, and the annualized figure is
 * what any comparison against an annual strategy must use.
 *
 * ## The account, from the carrier's own flier
 *
 * Balanced Growth Accumulator II IUL, Minnesota Life Insurance Company.
 * Document F94327-15 DOFU 10-2022 Rev 08-2023 (2446408). The 2-Year Balanced
 * Indexed Account: 100% S&P 500 Price Index allocation, 2.50% segment spread,
 * 105% participation rate, interest credits never less than zero, segments
 * established monthly. Back-test source given as Genesis Financial, 3 January
 * 1951 to 31 December 2022.
 *
 * Note the participation is **105%**, not 110%, and there is a **2.50%
 * spread** that the headline participation rate does not mention. The spread
 * is deducted after participation is applied, so it costs a flat 2.5 points of
 * the segment credit — most painful in a weak segment, where it can take a
 * small positive credit to near zero.
 *
 * The 110% figure that gets quoted belongs to a different carrier's account
 * (a five-year term at 110% current / 105% guaranteed), not to this one.
 */

export interface SegmentTerms {
  readonly id: string;
  readonly name: string;
  readonly carrierLabel: string;
  /** 1 for annual, 2 for a two-year segment, and so on. */
  readonly termYears: number;
  readonly participationPct: number;
  /** Deducted from the participated return, in points, over the whole segment. */
  readonly spreadPct: number;
  /** Cap over the whole segment term. Null = uncapped. */
  readonly capPct: number | null;
  readonly floorPct: number;
  readonly source: string;
  readonly sourced: boolean;
  readonly note?: string;
}

/**
 * The sourced account, and the annual comparators beside it.
 *
 * Only the first is transcribed from a carrier document. The others are
 * parameter sets for comparison and say so — a participation rate typed into
 * a calculator is not a quote from anybody.
 */
export const SEGMENT_ACCOUNTS: readonly SegmentTerms[] = [
  {
    id: 'bia-2yr',
    name: '2-Year Balanced Indexed Account',
    carrierLabel: 'Mutual Company B',
    termYears: 2,
    participationPct: 105,
    spreadPct: 2.5,
    capPct: null,
    floorPct: 0,
    source: 'Balanced Growth Accumulator II IUL flier, F94327-15 DOFU 10-2022 Rev 08-2023 (2446408)',
    sourced: true,
    note: 'Segments are established monthly on a two-year term. The 2.50% spread is deducted after the 105% participation is applied.',
  },
  {
    id: 'par110-annual',
    name: '110% participation, annual, uncapped',
    carrierLabel: 'Comparison parameter',
    termYears: 1,
    participationPct: 110,
    spreadPct: 0,
    capPct: null,
    floorPct: 0,
    source: 'Not a carrier quote — a parameter set for comparison',
    sourced: false,
    note: 'No held document offers 110% participation on an annual uncapped S&P segment. The nearest real thing is a five-year account at 110% current and 105% guaranteed, which is a different term and a different risk.',
  },
  {
    id: 'par105-annual',
    name: '105% participation, annual, uncapped',
    carrierLabel: 'Comparison parameter',
    termYears: 1,
    participationPct: 105,
    spreadPct: 0,
    capPct: null,
    floorPct: 0,
    source: 'Not a carrier quote — a parameter set for comparison',
    sourced: false,
  },
  {
    id: 'cap10-annual',
    name: '10% cap, annual, 100% participation',
    carrierLabel: 'Comparison parameter',
    termYears: 1,
    participationPct: 100,
    spreadPct: 0,
    capPct: 10,
    floorPct: 0,
    source: 'The capped strategy the carrier flier compares against',
    sourced: false,
  },
];

export interface SegmentResult {
  readonly startYear: number;
  readonly endYear: number;
  readonly termYears: number;
  /** The index's cumulative move across the whole segment, as a percentage. */
  readonly indexCumulativePct: number;
  /** What the account credits for the segment, after participation, spread, cap and floor. */
  readonly creditedPct: number;
  /**
   * The credited figure expressed per year. This is the ONLY figure that
   * compares with an annual strategy, and the one a reader should be shown
   * beside any multi-year credit.
   */
  readonly annualizedPct: number;
  /** True when the floor caught a segment the index took negative. */
  readonly floorSaved: boolean;
  /** True when the cap truncated the credit. */
  readonly capBit: boolean;
}

/** Credit one segment from the index's year-by-year returns across its term. */
export function creditSegment(
  terms: SegmentTerms,
  yearlyIndexPct: readonly number[],
  startYear: number
): SegmentResult {
  const growth = yearlyIndexPct.reduce((acc, r) => acc * (1 + r / 100), 1);
  const cumulative = (growth - 1) * 100;

  let credited = cumulative * (terms.participationPct / 100) - terms.spreadPct;
  const capBit = terms.capPct !== null && credited > terms.capPct;
  if (capBit) credited = terms.capPct!;
  const floorSaved = credited < terms.floorPct;
  if (floorSaved) credited = terms.floorPct;

  const annualized = (Math.pow(1 + credited / 100, 1 / terms.termYears) - 1) * 100;

  return {
    startYear,
    endYear: startYear + terms.termYears - 1,
    termYears: terms.termYears,
    indexCumulativePct: Math.round(cumulative * 100) / 100,
    creditedPct: Math.round(credited * 100) / 100,
    annualizedPct: Math.round(annualized * 100) / 100,
    floorSaved,
    capBit,
  };
}

/**
 * Every segment of this account's term that fits in the window, stepped one
 * year at a time.
 *
 * Stepping annually rather than by the term is deliberate: the carrier
 * establishes segments monthly, so a client's segments do not line up with
 * calendar pairs, and showing only 2020-21 / 2022-23 / 2024-25 would hide that
 * 2021-22 credited almost nothing. Overlapping windows show the whole shape.
 */
export function rollingSegments(
  terms: SegmentTerms,
  indexByYear: Readonly<Record<number, number>>,
  fromYear: number,
  toYear: number
): readonly SegmentResult[] {
  const out: SegmentResult[] = [];
  for (let start = fromYear; start + terms.termYears - 1 <= toYear; start++) {
    const years: number[] = [];
    let complete = true;
    for (let k = 0; k < terms.termYears; k++) {
      const r = indexByYear[start + k];
      if (r === undefined) { complete = false; break; }
      years.push(r);
    }
    if (complete) out.push(creditSegment(terms, years, start));
  }
  return out;
}

export interface WindowSummary {
  readonly fromYear: number;
  readonly toYear: number;
  readonly segments: readonly SegmentResult[];
  /** Segments whose CREDIT (not annual return) reached the threshold. */
  readonly segmentsAtOrAboveThreshold: number;
  readonly thresholdPct: number;
  /** Mean of the annualized figures — the comparable number. */
  readonly meanAnnualizedPct: number;
  readonly bestAnnualizedPct: number;
  readonly worstAnnualizedPct: number;
  readonly floorSavedCount: number;
  readonly capBitCount: number;
  /** Stated so a multi-year credit is never read as an annual return. */
  readonly readingNote: string;
}

export function summarizeWindow(
  terms: SegmentTerms,
  indexByYear: Readonly<Record<number, number>>,
  fromYear: number,
  toYear: number,
  thresholdPct = 40
): WindowSummary {
  const segments = rollingSegments(terms, indexByYear, fromYear, toYear);
  const ann = segments.map((s) => s.annualizedPct);
  const mean = ann.length ? ann.reduce((a, b) => a + b, 0) / ann.length : 0;

  return {
    fromYear,
    toYear,
    segments,
    segmentsAtOrAboveThreshold: segments.filter((s) => s.creditedPct >= thresholdPct).length,
    thresholdPct,
    meanAnnualizedPct: Math.round(mean * 100) / 100,
    bestAnnualizedPct: ann.length ? Math.max(...ann) : 0,
    worstAnnualizedPct: ann.length ? Math.min(...ann) : 0,
    floorSavedCount: segments.filter((s) => s.floorSaved).length,
    capBitCount: segments.filter((s) => s.capBit).length,
    readingNote:
      terms.termYears > 1
        ? `Every credit below is for a ${terms.termYears}-year segment, not a year. A ${terms.termYears}-year credit of 48% is ${(Math.pow(1.48, 1 / terms.termYears) - 1) * 100 >= 0 ? ((Math.pow(1.48, 1 / terms.termYears) - 1) * 100).toFixed(2) : "0"}% a year. Compare the annualized column against any annual strategy, never the segment credit.`
        : 'Segments are annual, so the credit and the annualized figure are the same.',
  };
}
