// ─── Segment audit ──────────────────────────────────────────────────────────
// Take a real credited segment off a carrier's system and work out whether the
// numbers agree — and where they do not, say precisely what would reconcile
// them rather than picking an explanation.
//
// ## Why this exists
//
// Everything else in this directory is built from brochures and illustrations,
// which describe what an account is supposed to do. An in-force segment is what
// it actually did, and it is the only kind of evidence that can falsify the
// rest. A carrier's advisor portal will show a segment's start and end index
// values, its participation rate, its cap, and the rate it credited — which is
// enough to check the arithmetic of the whole account end to end.
//
// The case this was written from is worth keeping. A Securian segment showed:
//
//   starting index 4,780.94   ending index 6,944.47   growth 45.25%
//   growth cap 9999999900.00%   participation 105.00%   credited 26.96%
//
// Three of those verify immediately. The growth rate is exactly end/start − 1.
// The index credit divided by the segment value before crediting is exactly the
// stated crediting rate, so the rate was applied to the right base. And the cap
// is a sentinel, not a cap.
//
// One does not. 45.25% at 105% participation is 47.52%, and the account credited
// 26.96% — a gap of 20.56 percentage points. No single-year charge explains
// that; a one-year charge would have to be 16% compounding or 20% simple. The
// gap only becomes ordinary once the segment is longer than a year: at two
// years it is 7.79% a year compounding, at four years 3.82%.
//
// So the segment length is the missing fact, and it is not on the screen. This
// module therefore reports every reconciliation that would work and refuses to
// choose, because choosing would mean inventing the one number nobody supplied
// — and an invented segment length silently rescales every figure derived from
// the account afterwards.
//
// ## What it will not do
//
// It will not write anything into the shape registry. An audit is evidence
// about one policy's segment; a registry row is a claim about a product. The
// bridge between them is a person deciding the segment is representative, and
// that decision is not this module's to make.

/** A credited segment, as a carrier's system reports it. Percentages. */
export interface ObservedSegment {
  /** Label for the audit line. Never a policy number — this is not a record system. */
  readonly label: string;
  readonly startIndexValue: number;
  readonly endIndexValue: number;
  /** The growth rate the carrier printed, if it printed one. */
  readonly statedGrowthRatePct?: number;
  /** Participation rate as a percentage. 105 = 105%. */
  readonly participationPct: number;
  /** Growth cap as the system gave it, including sentinels. Null for none. */
  readonly growthCapPct: number | null;
  /** The crediting rate the carrier applied to the segment. */
  readonly creditedRatePct: number;
  /** Known segment length in years, where it is actually known. */
  readonly segmentYears?: number;
  /** A spread the account is known to charge, as a percentage. */
  readonly spreadPct?: number;
}

export interface Reconciliation {
  readonly segmentYears: number;
  /** Annual charge that closes the gap, compounding. Percentage. */
  readonly compoundingChargePct: number;
  /** Annual charge that closes it if simply subtracted each year. Percentage. */
  readonly simpleChargePct: number;
  /** Implied annualised index growth at this length, for a plausibility read. */
  readonly impliedAnnualIndexGrowthPct: number;
}

export interface SegmentAudit {
  readonly label: string;
  /** Growth computed from the index values. */
  readonly computedGrowthPct: number;
  /** True when the carrier's stated growth matches the computed one. */
  readonly growthAgrees: boolean | null;
  /** True when the cap field held a sentinel rather than a cap. */
  readonly capIsSentinel: boolean;
  /** The cap after normalisation, as a percentage, or null. */
  readonly effectiveCapPct: number | null;
  /** Growth × participation, less any known spread. Percentage. */
  readonly expectedCreditedPct: number;
  readonly actualCreditedPct: number;
  /** expected − actual. Positive means the account credited LESS than expected. */
  readonly gapPct: number;
  /** True when expected and actual agree within a tenth of a point. */
  readonly reconciles: boolean;
  /**
   * Every (segment length, charge) pair that would close the gap. Empty when
   * the segment already reconciles. Deliberately plural.
   */
  readonly candidates: readonly Reconciliation[];
  /** What a person has to supply before this segment can be used for anything. */
  readonly missing: readonly string[];
  /** The audit in words. */
  readonly summary: string;
}

const SENTINEL_FLOOR = 1000; // No real growth cap reaches 1000%.

/**
 * Audit one segment.
 *
 * `maxYears` bounds the candidate search. Eight is generous — no common indexed
 * segment runs longer — and the point of returning several is that the caller
 * sees how sensitive the answer is to a fact they have not supplied.
 */
export function auditSegment(seg: ObservedSegment, maxYears = 8): SegmentAudit {
  const missing: string[] = [];

  const computedGrowth = (seg.endIndexValue / seg.startIndexValue - 1) * 100;
  const growthAgrees =
    typeof seg.statedGrowthRatePct === 'number'
      ? Math.abs(computedGrowth - seg.statedGrowthRatePct) < 0.02
      : null;

  const capIsSentinel = seg.growthCapPct !== null && seg.growthCapPct >= SENTINEL_FLOOR;
  const effectiveCapPct = capIsSentinel ? null : seg.growthCapPct;

  let expected = computedGrowth * (seg.participationPct / 100);
  if (effectiveCapPct !== null) expected = Math.min(expected, effectiveCapPct);
  if (typeof seg.spreadPct === 'number') expected -= seg.spreadPct;

  const gap = expected - seg.creditedRatePct;
  const reconciles = Math.abs(gap) < 0.1;

  const candidates: Reconciliation[] = [];
  if (!reconciles && gap > 0) {
    const ratio = (1 + expected / 100) / (1 + seg.creditedRatePct / 100);
    for (let n = 1; n <= maxYears; n++) {
      candidates.push({
        segmentYears: n,
        compoundingChargePct: (Math.pow(ratio, 1 / n) - 1) * 100,
        simpleChargePct: gap / n,
        impliedAnnualIndexGrowthPct: (Math.pow(1 + computedGrowth / 100, 1 / n) - 1) * 100,
      });
    }
  }

  if (seg.segmentYears === undefined) {
    missing.push(
      'The segment length. Without it a charge cannot be annualised, and every candidate below is equally consistent with what is on the screen.'
    );
  }
  if (!reconciles && gap > 0) {
    missing.push(
      'Which charge the gap is. A loan charge, an account charge and a spread all reduce a credited rate and none of them is visible here; they are not interchangeable, because a spread is per segment and a charge is per year.'
    );
  }
  if (gap < -0.1) {
    missing.push(
      'An explanation for crediting ABOVE participation — an account benefit, a bonus or a multiplier. Crediting more than the index times the participation rate is not something an ordinary account does.'
    );
  }

  const summary = reconciles
    ? `${seg.label}: reconciles. ${computedGrowth.toFixed(2)}% index × ${seg.participationPct.toFixed(2)}% participation` +
      `${typeof seg.spreadPct === 'number' ? ` less a ${seg.spreadPct.toFixed(2)}% spread` : ''} = ` +
      `${expected.toFixed(2)}%, credited ${seg.creditedRatePct.toFixed(2)}%.`
    : `${seg.label}: does NOT reconcile. ${computedGrowth.toFixed(2)}% index × ${seg.participationPct.toFixed(2)}% participation = ` +
      `${expected.toFixed(2)}%, but the account credited ${seg.creditedRatePct.toFixed(2)}% — a gap of ${gap.toFixed(2)} points. ` +
      (gap > 0
        ? `That gap is only ordinary once the segment is longer than a year: ${candidates
            .slice(0, 4)
            .map((c) => `${c.segmentYears}y → ${c.compoundingChargePct.toFixed(2)}%/yr`)
            .join(', ')}. The segment length decides which, and it is not on the screen.`
        : 'The account credited MORE than participation alone allows, which needs a benefit, bonus or multiplier to explain.');

  return {
    label: seg.label,
    computedGrowthPct: computedGrowth,
    growthAgrees,
    capIsSentinel,
    effectiveCapPct,
    expectedCreditedPct: expected,
    actualCreditedPct: seg.creditedRatePct,
    gapPct: gap,
    reconciles,
    candidates,
    missing,
    summary,
  };
}

/**
 * Check that a credited dollar amount matches the stated rate against the
 * segment value it was applied to.
 *
 * Separate from auditSegment because it answers a different question: not
 * "is the rate right" but "was the right rate applied to the right base". On
 * the Securian segment this passed exactly, which is what made the crediting
 * rate itself trustworthy enough to be worth reconciling.
 */
export function creditAppliedCorrectly(
  segmentValueBeforeCredit: number,
  creditAmount: number,
  statedRatePct: number,
  tolerancePct = 0.01
): { ok: boolean; impliedRatePct: number; detail: string } {
  if (!(segmentValueBeforeCredit > 0)) {
    return { ok: false, impliedRatePct: NaN, detail: 'No segment value to divide by.' };
  }
  const implied = (creditAmount / segmentValueBeforeCredit) * 100;
  const ok = Math.abs(implied - statedRatePct) <= tolerancePct;
  return {
    ok,
    impliedRatePct: implied,
    detail: ok
      ? `The credit is ${implied.toFixed(4)}% of the segment value before crediting, matching the stated ${statedRatePct.toFixed(2)}%.`
      : `The credit is ${implied.toFixed(4)}% of the segment value before crediting, against a stated rate of ${statedRatePct.toFixed(2)}%. Either the rate was applied to a different base or one of the two figures is wrong.`,
  };
}

export const SEGMENT_AUDIT_VERSION = {
  version: '2026.09.1',
  compiledOn: '2026-09-19',
  neverPrinted: [
    'A segment length chosen because it made the numbers work. It rescales every figure derived from the account afterwards, and nobody downstream can tell it was picked rather than read.',
    'A reconciliation presented as the explanation when several fit equally well.',
    'A sentinel growth cap as though it were a cap.',
    'A policy number, an insured\'s name, or a policy\'s dollar values. This module audits arithmetic, not policies; the rates are product evidence and the balances are somebody\'s private business.',
    'An audited segment promoted into the shape registry without a person deciding it is representative of the product rather than of one policy.',
  ],
} as const;
