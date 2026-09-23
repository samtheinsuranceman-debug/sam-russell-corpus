/**
 * Multi-year index segments, and the 40% that is real but is not annual.
 *
 * ## The claim, checked
 *
 * "From 2020-2026 the index returned 40%+ four out of the last six years."
 *
 * Read as ANNUAL returns that is not what happened. The S&P 500 price index
 * returned, for 2020 through 2025: 16.1%, 27.0%, -19.5%, 24.3%, 23.3%, 16.3%.
 * Not one year reached 40%; the best was 27.0%.
 *
 * Read as what the Balanced Indexed Account actually credits — a TWO-YEAR
 * segment — the claim is exactly right. Every two-year segment that fits in
 * 2019-2025, stepped one year at a time:
 *
 *     2019-2020   index 49.54%   credited 49.51%   per year 22.28%
 *     2020-2021   index 47.45%   credited 47.32%   per year 21.38%
 *     2021-2022   index  2.23%   credited  0.00%   per year  0.00%  (floor)
 *     2022-2023   index  0.06%   credited  0.00%   per year  0.00%  (floor)
 *     2023-2024   index 53.26%   credited 53.42%   per year 23.86%
 *     2024-2025   index 43.40%   credited 43.07%   per year 19.61%
 *
 * FOUR of those six segments credited 40% or more. "40%+ four out of the last
 * six" is the record, precisely — provided "six" means six segments and not
 * six years, which is the whole of the distinction below.
 *
 * Note also what the overlapping view exposes and a headline would hide: two
 * of the six credited NOTHING. The floor did its job, and a client who bought
 * on the strength of the other four should be shown these two on the same
 * screen.
 *
 * ## An earlier version of this file said "two of six"
 *
 * It ran on an S&P 500 series that carried no source and did not reconcile to
 * the carrier's own published claims about that index. The series has since
 * been replaced with a sourced one — see shared/sp500SeriesAudit.ts — and the
 * count moved from two to four. The arithmetic never changed; the inputs did.
 *
 * ## Why the distinction is not pedantry
 *
 * Put "40%" next to a row labelled with a single year and a reader will take it
 * as an annual return. A 47% two-year credit is 21.38% a year — excellent, and
 * well under half of what "47%" suggests if the two-year term is not stated
 * beside it. Every figure this module produces therefore carries its segment
 * term and its annualized equivalent together, and the annualized figure is
 * what any comparison against an annual strategy must use.
 *
 * ## The account, from the carrier's own flier
 *
 * Balanced Growth Accumulator II IUL, Minnesota Life Insurance Company.
 * Document F94327-15 DOFU 10-2022 Rev 08-2023 (2446408).
 *
 * The chart assumptions are quoted here in full because they settle how these
 * figures must be presented, and they are easy to get wrong:
 *
 *     "The graph represents the annualized returns of two-year holds of the
 *      S&P 500 Price Index and interest credited for a hypothetical 10.00%
 *      annual point-to-point strategy (100% index participation up to 10.00%,
 *      0% index participation above 10.00% and annualized returns of two-year
 *      holds of the two-year BIA 100% S&P 500 Price Index Allocation, 2.50%
 *      Segment Spread, 105% Participation Rate), with crediting factors
 *      consistent for each new segment for every possible contract purchase
 *      date from 1/3/1951 - 12/31/2022... the vertical axis represents the
 *      annualized return for the relevant hold period, AFTER THE DEDUCTION OF
 *      THE STRATEGY SPREAD, where applicable."
 *
 * Two things follow, and both change how this module reports.
 *
 * **The carrier's own basis is annualized and net of the spread.** Every
 * number the carrier plots for this account has already had the 2.50% spread
 * taken out and has already been reduced to a per-year figure. So the
 * annualized net figure is not merely "the comparable one" by our reasoning —
 * it is the carrier's own published basis, and it is what any figure quoted
 * beside a carrier document has to match. This module therefore leads with
 * `annualizedPct`. The segment credit is still returned, because a client
 * asking "what did the segment pay" deserves an answer, but it is secondary
 * and is never valid to compare against a carrier chart.
 *
 * **Anyone reading numbers OFF that chart must not re-apply participation or
 * the spread.** Those are already in. This module builds from RAW index
 * returns instead and applies participation and spread exactly once — see
 * creditSegment. Feeding a figure taken from the carrier's chart into this
 * function would deduct the spread twice and understate the account.
 *
 * Note the participation is **105%**, not 110%. The 110% figure that gets
 * quoted belongs to a different carrier's account (a five-year term at 110%
 * current / 105% guaranteed), not to this one.
 *
 * ## Annualized means the geometric root, not the half
 *
 * "Divided by two" and "annualized" are not the same operation, and on these
 * numbers the difference is material. A 47.32% two-year credit is 21.38% a
 * year geometrically — (1.4732)^(1/2) - 1 — and 23.66% if simply halved. The
 * carrier
 * says "annualized", so this module uses the geometric root throughout. Halving
 * would overstate every segment by roughly two points.
 *
 * ## What this module does NOT model
 *
 * The flier describes the wider structure: "The Balanced Indexed Accounts
 * employ a Balanced Allocation Strategy with one-year, two-year, and
 * three-year index segments - except where noted - established monthly. The
 * Balanced Allocation Strategy blends an equity indexed component, a declared
 * rate component, a segment spread component and a participation rate
 * component."
 *
 * Two things are therefore outside what is modelled here:
 *
 *   - **The declared rate component.** A Balanced Allocation Strategy is not
 *     pure index participation; part of the allocation earns a declared rate.
 *     This module is valid only for the configuration the flier charts, which
 *     is "100% S&P 500 Price Index Allocation" — at 100% index the declared
 *     rate component carries zero weight. At any other allocation these
 *     figures do not describe the account, and nothing here knows the declared
 *     rate, which appears in no document held.
 *   - **The one-year and three-year segments.** They exist and are not
 *     modelled. Only the two-year is.
 *
 * ## A warning about the series underneath
 *
 * All of the above is about METHOD. The index series these functions run on is
 * a separate problem: it carries no source and does not reconcile to the
 * carrier's own published claims about the S&P 500. See
 * shared/sp500SeriesAudit.ts. The method here is right; the inputs are not yet
 * established.
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
    note: 'Segments are established monthly on a two-year term. The 2.50% spread is deducted after the 105% participation is applied. The carrier publishes this account on an annualized, net-of-spread basis, which is the annualized column here.',
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
    carrierLabel: 'Mutual Company B',
    termYears: 1,
    participationPct: 100,
    spreadPct: 0,
    capPct: 10,
    floorPct: 0,
    // Sourced: the flier states this comparator's terms exactly — "100% index
    // participation up to 10.00%, 0% index participation above 10.00%".
    source: 'Balanced Growth Accumulator II IUL flier, F94327-15 DOFU 10-2022 Rev 08-2023 (2446408) — the hypothetical capped strategy the flier charts against the 2-Year BIA',
    sourced: true,
    note: 'The carrier plots this beside the 2-Year BIA and states the BIA "captured 60% more upside than the capped strategy" over 1951-2022.',
  },
];

/**
 * The sources the shell prints for this engine, built from the account records
 * above so the two cannot drift apart. A comparator that is not a carrier
 * quote says so in its own `source` field, and that wording is kept.
 */
export const BALANCED_INDEXED_ACCOUNT_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  ...SEGMENT_ACCOUNTS.map((a) => ({
    label: `${a.name}: ${a.source}`,
    ...(a.note ? { note: a.note } : {}),
  })),
  { label: 'S&P 500 price-return series: audited and sourced in shared/sp500SeriesAudit.ts; this module supplies the crediting method, not the index figures' },
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
  /**
   * The figure on the carrier's own published basis: annualized, net of the
   * spread. Identical to annualizedPct — named separately because this is the
   * one that may be set beside a carrier chart, and a reader choosing a column
   * should not have to infer which.
   */
  readonly carrierBasisPct: number;
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
    carrierBasisPct: Math.round(annualized * 100) / 100,
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
