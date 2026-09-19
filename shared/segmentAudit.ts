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
    // A KNOWN segment length collapses the list to one row. That is the whole
    // value of supplying it: the ambiguity was never in the arithmetic, it was
    // in the one fact the screen did not carry.
    const lo = seg.segmentYears ?? 1;
    const hi = seg.segmentYears ?? maxYears;
    for (let n = lo; n <= hi; n++) {
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

/* ═══ Ledgers ══════════════════════════════════════════════════════════════
 * One segment is an anecdote. A column of them on a single named account is a
 * dataset, and it can falsify a formula rather than merely fail to confirm it. */

export interface LedgerRow {
  readonly label: string;
  readonly valueBeforeCredit: number;
  readonly indexCredit: number;
  readonly endValue: number;
}

export interface LedgerAudit {
  /** Rows where end value is not value-before-credit plus the credit. */
  readonly identityFailures: readonly string[];
  /** Credited rate per row, as a percentage, in the order supplied. */
  readonly creditedRatesPct: readonly number[];
  readonly minPct: number;
  readonly maxPct: number;
  readonly meanPct: number;
  readonly summary: string;
}

/**
 * Check a column of credited segments off a carrier's system.
 *
 * The identity is the point: a carrier's end value must be the value before
 * crediting plus the credit. It held on all twelve rows of the Balanced Indexed
 * Account 2 ledger, which is what made those rows usable as evidence — a table
 * that does not add up cannot be reasoned from, however interesting it looks.
 *
 * Takes dollars and returns rates. The dollars are somebody's policy; the rates
 * are what the product did.
 */
export function auditLedger(rows: readonly LedgerRow[]): LedgerAudit {
  const failures: string[] = [];
  const rates: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (Math.abs(r.valueBeforeCredit + r.indexCredit - r.endValue) > 0.005) {
      failures.push(
        `${r.label}: ${r.valueBeforeCredit} + ${r.indexCredit} is not ${r.endValue}`
      );
    }
    rates.push(r.valueBeforeCredit > 0 ? (r.indexCredit / r.valueBeforeCredit) * 100 : NaN);
  }

  const clean = rates.filter((x) => Number.isFinite(x));
  const min = clean.length ? Math.min(...clean) : NaN;
  const max = clean.length ? Math.max(...clean) : NaN;
  const mean = clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : NaN;

  return {
    identityFailures: failures,
    creditedRatesPct: rates,
    minPct: min,
    maxPct: max,
    meanPct: mean,
    summary: failures.length
      ? `${failures.length} of ${rows.length} rows do not add up; the ledger cannot be reasoned from until they do.`
      : `${rows.length} rows, all adding up. Credited ${min.toFixed(2)}% to ${max.toFixed(2)}%, mean ${mean.toFixed(2)}%.`,
  };
}

/**
 * Credited rates observed on Minnesota Life Balanced Indexed Account 2
 * (S&P 500, 2-year segment term), read off the Securian advisor portal's
 * index-details ledger on 19 September 2026.
 *
 * Rates only. The policy's balances are not product evidence and are not kept.
 *
 * Twelve rolling 2-year segments maturing through 2021. Every row's end value
 * equalled its value before crediting plus its credit, so the column is
 * internally sound.
 */
export const BGA3_BALANCED_2_OBSERVED_PCT: readonly { segment: string; creditedPct: number }[] = [
  { segment: 'Jan 2019 – Jan 2021', creditedPct: 42.10 },
  { segment: 'Feb 2019 – Feb 2021', creditedPct: 36.11 },
  { segment: 'Mar 2019 – Mar 2021', creditedPct: 33.15 },
  { segment: 'Apr 2019 – Apr 2021', creditedPct: 37.07 },
  { segment: 'May 2019 – May 2021', creditedPct: 42.73 },
  { segment: 'Jun 2019 – Jun 2021', creditedPct: 40.96 },
  { segment: 'Jul 2019 – Jul 2021', creditedPct: 43.75 },
  { segment: 'Aug 2019 – Aug 2021', creditedPct: 53.36 },
  { segment: 'Sep 2019 – Sep 2021', creditedPct: 49.69 },
  { segment: 'Oct 2019 – Oct 2021', creditedPct: 48.87 },
  { segment: 'Nov 2019 – Nov 2021', creditedPct: 53.15 },
  { segment: 'Dec 2019 – Dec 2021', creditedPct: 46.24 },
];

/**
 * What the ledger settles about the 26.96% segment.
 *
 * The first screenshot showed a segment crediting 26.96% on 45.25% index
 * growth, and the gap could not be explained without knowing the segment
 * length. The ledger supplies something better than a length: a control group.
 *
 * Twelve segments on this same named account credited 33.15% to 53.36% over two
 * years. Under 110% participation less a 2.50% segment spread, each implies an
 * index movement of 32% to 51% — entirely ordinary for rolling two-year windows
 * maturing in 2021, and consistent across all twelve.
 *
 * The Dec 2019 – Dec 2021 segment is the one that settles it. It credited
 * 46.24%, which under that formula implies an index movement of 44.30% — within
 * a point of the 45.25% on the 26.96% segment. Near-identical index movement,
 * same product, same account family: 46.24% against 26.96%.
 *
 * So the 20-point shortfall is not the formula, not the participation rate and
 * not the spread, because eleven other segments run through the same formula
 * and land where it predicts. Something is charged against that one segment
 * that is not charged against these — which is what the owner said it was from
 * the start, and at 24 months it prices at roughly 7.7% a year compounding.
 *
 * ## Two things that could void this, both unresolved
 *
 * The comparison only means anything if the subject segment is the same account
 * as the controls, and two signals say it may not be.
 *
 * The modal never named its index. Every level-based inference about it — that
 * 4,780.94 looks like where the S&P 500 closed 2021 — assumed the S&P 500, and
 * that assumption was never checked. This same policy holds at least two
 * indices: S&P 500 on Balanced Indexed Account 2, and S&P PRISM on Balanced
 * Indexed Account 8. If the subject segment is a PRISM segment then 4,780.94 is
 * a PRISM level, no S&P reasoning about it holds, and the controls are a
 * different account measured against a different index.
 *
 * And the participation rates disagree. The ledger account is 110%; the modal
 * printed 105.00%. On the same account in the same system those should match.
 *
 * So the deduction is conditional: IF the subject segment is Balanced Indexed
 * Account 2, the controls isolate a charge of roughly 7.7% a year at 24 months.
 * If it is a different account, they isolate nothing and the gap is simply that
 * account's own parameters, which are not on file.
 *
 * It remains a deduction rather than a reading either way. What would make it a
 * reading is the loan charge printed on the policy's own statement, and what
 * would make it applicable at all is the subject segment's account name — which
 * the index-details ledger prints in its first column.
 */
export const LOAN_CHARGE_DEDUCTION = {
  controlSegment: 'Dec 2019 – Dec 2021',
  controlCreditedPct: 46.24,
  controlImpliedIndexPct: 44.30,
  subjectCreditedPct: 26.96,
  subjectIndexPct: 45.2532,
  differenceInCreditedPct: 19.28,
  differenceInIndexPct: 0.95,
  impliedAnnualChargePct: 7.7,
  segmentMonths: 24,
  stillNeeded:
    'The loan charge as the policy statement prints it. The deduction is strong — eleven control segments agree with the formula and this one does not — but a charge inferred from a residual is still inferred.',
  /** Conditions the whole deduction depends on, neither of them settled. */
  conditionalOn: [
    'That the subject segment is Balanced Indexed Account 2. Its modal never named an account or an index, and this policy holds at least two indices. The ledger prints the account name in its first column, which settles it in one look.',
    'That the participation rates can be reconciled. The ledger account is 110%; the subject modal printed 105.00%. On one account in one system those should agree, and they do not.',
  ],
} as const;

/* ═══ The four modals ══════════════════════════════════════════════════════
 * Balanced Indexed Account 2 — S&P 500 — 2 Year, segment year 2021, read off
 * the Securian advisor portal on 19 September 2026.
 *
 * Index values are public market data and are kept. Policy balances are not. */

export interface ModalSegment {
  readonly segment: string;
  readonly startIndexValue: number;
  readonly endIndexValue: number;
  readonly statedGrowthPct: number;
  readonly statedParticipationPct: number;
  readonly creditedPct: number;
}

export const BGA_BALANCED_2_MODALS: readonly ModalSegment[] = [
  { segment: 'Jan 2019 – Jan 2021', startIndexValue: 2635.96, endIndexValue: 3795.54, statedGrowthPct: 43.99, statedParticipationPct: 105, creditedPct: 42.10 },
  { segment: 'Feb 2019 – Feb 2021', startIndexValue: 2745.73, endIndexValue: 3913.97, statedGrowthPct: 42.55, statedParticipationPct: 105, creditedPct: 36.11 },
  { segment: 'Mar 2019 – Mar 2021', startIndexValue: 2808.48, endIndexValue: 3915.46, statedGrowthPct: 39.42, statedParticipationPct: 105, creditedPct: 33.15 },
  { segment: 'Apr 2019 – Apr 2021', startIndexValue: 2905.03, endIndexValue: 4170.42, statedGrowthPct: 43.56, statedParticipationPct: 105, creditedPct: 37.07 },
];

/**
 * What the four modals settle, and the one thing they open up.
 *
 * ## Settled
 *
 * The account is named: Balanced Indexed Account 2 — S&P 500 — 2 Year. The
 * subject segment shares its participation rate and its sentinel cap, so the
 * account-identity condition the deduction was hanging on is met in substance.
 *
 * Every modal is internally sound. Each stated growth rate is exactly its own
 * end/start − 1, and each index credit is exactly its crediting rate times its
 * segment value. Four for four.
 *
 * ## The stated participation rate does not reproduce a single credit
 *
 * All four print 105.00%. None of the four credits is 105% of its growth:
 *
 *   Jan  43.99% × 105% = 46.19%   credited 42.10%   short 4.09 pp
 *   Feb  42.55% × 105% = 44.68%   credited 36.11%   short 8.57 pp
 *   Mar  39.42% × 105% = 41.39%   credited 33.15%   short 8.24 pp
 *   Apr  43.56% × 105% = 45.74%   credited 37.07%   short 8.67 pp
 *
 * A shortfall is expected — there is a spread on this account. What is not
 * expected is that the shortfall is not constant.
 *
 * ## Three segments agree with each other to a thirteenth of a point
 *
 * Taken as a multiplicative segment fee at the stated 105%, February, March and
 * April imply 6.29%, 6.19% and 6.32% — a spread of 0.13 points across three
 * independent segments, which is about as tight as four-significant-figure
 * inputs allow. Roughly 3.1% a year.
 *
 * January implies 2.88%, which sits 3.39 points away — twenty-five times the
 * others' own spread. January is doing something the other three are not, and
 * nothing on its modal says what. Segments are created monthly and declared
 * rates are set at creation, so the most ordinary explanation is that January's
 * segment was struck on a different participation rate and the modal is
 * printing today's rather than that segment's. That is a question for the
 * carrier, not an answer from here.
 *
 * ## And this is what it does to the 26.96% segment
 *
 * Run the subject segment through the account's OWN observed behaviour rather
 * than through any brochure: 45.25% growth at 105%, less the 6.27% segment fee
 * the three consistent modals imply, predicts 38.81% credited.
 *
 * It credited 26.96%. Still short by 11.85 points, and over 24 months that
 * residual prices at 4.56% a year compounding.
 *
 * The carrier's published indexed loan charge is 4.75%.
 *
 * Those agree to within a fifth of a point, on a figure derived from three
 * unrelated segments and never fitted to it. That is what the owner said it was
 * in the first message, and it is now the reading the evidence actually
 * supports rather than one of eight candidates.
 *
 * It is still not a reading off a statement. The 6.27% fee is itself a residual
 * — the stated participation reproduces nothing, so that number absorbs
 * whatever else the true formula contains — and a residual computed on top of a
 * residual can land on 4.75% by coincidence. What ends the argument is the loan
 * charge printed on the policy's own statement. Everything else is now
 * consistent with it.
 */
export const FOUR_MODAL_FINDINGS = {
  accountIdentified: 'Balanced Indexed Account 2 — S&P 500 — 2 Year',
  allFourInternallySound: true,
  statedParticipationPct: 105,
  statedParticipationReproducesNoCredit: true,
  consistentTrioFeePct: [6.29, 6.19, 6.32],
  consistentTrioSpreadPct: 0.13,
  januaryFeePct: 2.88,
  januaryDeviationPct: 3.39,
  subjectPredictedCreditedPct: 38.81,
  subjectActualCreditedPct: 26.96,
  residualAnnualPct: 4.56,
  publishedIndexedLoanChargePct: 4.75,
  agreementPct: 0.19,
  stillNotSettled:
    'The 6.27% segment fee is itself a residual, because the stated 105% participation reproduces none of the four credits. A residual computed on top of a residual can land on 4.75% by coincidence. The loan charge printed on the policy statement is what ends it.',
  openQuestion:
    'Why January behaves differently from February, March and April. Twenty-five times their mutual spread is not rounding. Segments are struck monthly on rates declared at creation, so the modal may be printing the current participation rate rather than the one that segment was struck on — which would mean the 105.00% on the subject segment is also not necessarily its own rate.',
} as const;
