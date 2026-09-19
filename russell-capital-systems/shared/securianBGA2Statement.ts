/**
 * Securian / Minnesota Life — Annual Policy Review, 08/28/2025 through 08/28/2026.
 * Product: Balanced Growth Accumulator II IUL (flexible premium adjustable
 * indexed universal life). A second, independent statement, on a DIFFERENT
 * policy and a DIFFERENT product generation from securianAnnualPolicyReview.ts.
 *
 * De-identified deliberately. This is a client's in-force policy, not the
 * agency's own. Nothing here records the insured, the policy number, the
 * address, or the issue details. What is recorded is product mechanics — how
 * the carrier computes a credit — which is what the engine needs and the only
 * thing it is entitled to keep.
 *
 * ## Why this statement matters more than the first one
 *
 * The first statement solved the Indexed Loan Account: a 1.47x factor on an
 * uncapped account, printed alongside a "Part. Rate" of 105% that had nothing
 * to do with it. A reasonable objection to that finding was that the Indexed
 * Loan Account is an odd, uncapped, loan-collateral account, and that the
 * participation column might well be meaningful on the ordinary Balanced
 * accounts people are actually sold.
 *
 * It is not. This statement is a Balanced Indexed Account 2 — the mainstream
 * account — on a different policy, and its printed participation rate is wrong
 * too. Wrong in the opposite direction, which is the part that closes the
 * argument:
 *
 *     first statement   printed 105%   operative 1.47x     UNDERSTATES
 *     this statement    printed 110%   operative 0.84x     OVERSTATES
 *
 * At the printed 110%, the first segment below would have credited 51.93%. It
 * credited 34.41%. Had it been sold on the printed rate, the illustration would
 * have been out by roughly half again on the crediting assumption, compounding.
 *
 * Same carrier, same column, two policies, two product generations, two errors
 * in opposite directions. No theory survives in which the printed participation
 * rate is close enough to use.
 */

/** Statement-level facts, pages 1 and 4. No identifiers. */
export const BGA2_STATEMENT = {
  carrier: 'Minnesota Life Insurance Company, a Securian Financial company',
  product: 'Balanced Growth Accumulator II IUL',
  productKind: 'flexible premium adjustable indexed universal life',
  periodFrom: '2025-08-28',
  periodTo: '2026-08-28',
  plannedAnnualPremium: 48000.0,
  plannedPremiumFrequency: 'Annual',
  /** The policy is paid-up in practice for this period. */
  premiumPaidInPeriod: 0.0,
  accumulationValueAtPeriodStart: 133390.73,
  chargesInPeriod: -5477.29,
  /** Page 8 — the fixed side is effectively empty here too. */
  interimAccountValue: 93.06,
  totalIndexedAccountValue: 130914.6,
  accountsInForce: ['Balanced Indexed Account 2', 'Balanced Indexed Account 7'],
} as const;

/**
 * Page 9 — "Growth Rate and Index Credit Detail 08/28/2025 - 08/28/2026",
 * Balanced Indexed Account 2. Six segments, all matured in the period.
 *
 * Read at magnification. Every figure below was checked three ways: the growth
 * rate reproduces from the two index values, the crediting rate reproduces from
 * the growth rate, and the dollar credit reproduces from the crediting rate and
 * the accumulation value. All three reconcile on all six rows.
 */
export interface BGA2SegmentRow {
  readonly segmentStart: string;
  readonly startingIndexValue: number;
  readonly endingIndexValue: number;
  /** As printed, in percent. */
  readonly indexGrowthRatePct: number;
  readonly growthCap: 'Unlimited';
  /** As printed. Not operative — see BGA2_TRANSFER_FUNCTION. */
  readonly participationRatePrintedPct: number;
  /** As printed, in percent. */
  readonly segmentCreditingRatePct: number;
  readonly segmentAccumulationValueBeforeCredit: number;
  /** As printed, in dollars. */
  readonly indexCredit: number;
}

export const BGA2_ACCOUNT_2_SEGMENTS: readonly BGA2SegmentRow[] = [
  {
    segmentStart: '2023-09-15',
    startingIndexValue: 4505.1,
    endingIndexValue: 6631.96,
    indexGrowthRatePct: 47.21005,
    growthCap: 'Unlimited',
    participationRatePrintedPct: 110,
    segmentCreditingRatePct: 34.40644,
    segmentAccumulationValueBeforeCredit: 2967.73,
    indexCredit: 1021.09,
  },
  {
    segmentStart: '2024-04-19',
    startingIndexValue: 5011.12,
    endingIndexValue: 7041.28,
    indexGrowthRatePct: 40.5131,
    growthCap: 'Unlimited',
    participationRatePrintedPct: 110,
    segmentCreditingRatePct: 28.781,
    segmentAccumulationValueBeforeCredit: 1525.72,
    indexCredit: 439.12,
  },
  {
    segmentStart: '2024-05-17',
    startingIndexValue: 5297.1,
    endingIndexValue: 7501.24,
    indexGrowthRatePct: 41.61032,
    growthCap: 'Unlimited',
    participationRatePrintedPct: 110,
    segmentCreditingRatePct: 29.70267,
    segmentAccumulationValueBeforeCredit: 1513.54,
    indexCredit: 449.56,
  },
  {
    segmentStart: '2024-06-21',
    startingIndexValue: 5473.17,
    endingIndexValue: 7500.58,
    indexGrowthRatePct: 37.0427,
    growthCap: 'Unlimited',
    participationRatePrintedPct: 110,
    segmentCreditingRatePct: 25.86587,
    segmentAccumulationValueBeforeCredit: 1405.06,
    indexCredit: 363.43,
  },
  {
    segmentStart: '2024-07-19',
    startingIndexValue: 5544.59,
    endingIndexValue: 7533.77,
    indexGrowthRatePct: 35.87605,
    growthCap: 'Unlimited',
    participationRatePrintedPct: 110,
    segmentCreditingRatePct: 24.88588,
    segmentAccumulationValueBeforeCredit: 1320.4,
    indexCredit: 328.59,
  },
  {
    segmentStart: '2024-08-16',
    startingIndexValue: 5543.22,
    endingIndexValue: 7641.16,
    indexGrowthRatePct: 37.84696,
    growthCap: 'Unlimited',
    participationRatePrintedPct: 110,
    segmentCreditingRatePct: 26.54144,
    segmentAccumulationValueBeforeCredit: 1062.76,
    indexCredit: 282.07,
  },
];

/* ------------------------------------------------------------------ *
 * The solved rule
 * ------------------------------------------------------------------ */

/**
 * creditingRatePct = 0.84 x indexGrowthPct - 5.25
 *
 * Least squares across all six segments returns slope 0.840000 and intercept
 * -5.250003, with a maximum residual of 0.00000 percentage points. Six
 * independent segments, spanning index growth from 35.88% to 47.21%, and the
 * line passes through every one of them to five decimal places.
 *
 * The segments are two years long (09/15/23 segments credit 09/15/25;
 * 04/19/24 segments credit 04/17/26), so the 5.25 points is 2.625 a year.
 */
export const BGA2_TRANSFER_FUNCTION = {
  slope: 0.84,
  interceptPoints: -5.25,
  segmentYears: 2,
  interceptPerYear: -2.625,
  segmentsFitted: 6,
  maxResidualPoints: 0.0,
  printedParticipationPct: 110,
} as const;

export function bga2IndexGrowthPct(startingIndexValue: number, endingIndexValue: number): number {
  return (endingIndexValue / startingIndexValue - 1) * 100;
}

/** Segment crediting rate for Balanced Indexed Account 2 on this product, in percent. */
export function bga2CreditingPct(growthPct: number): number {
  const credited =
    BGA2_TRANSFER_FUNCTION.slope * growthPct + BGA2_TRANSFER_FUNCTION.interceptPoints;
  // The 0% floor is printed on page 6, in its own column, for every segment.
  // No observed segment tests it — all six grew strongly — but it is a read
  // term rather than an assumed one.
  return Math.max(credited, 0);
}

/** Dollar credit for a segment, given the value the credit is struck against. */
export function bga2Credit(growthPct: number, segmentAccumulationValueBeforeCredit: number): number {
  return Math.round(segmentAccumulationValueBeforeCredit * (bga2CreditingPct(growthPct) / 100) * 100) / 100;
}

/** What the segment would have credited if the printed 110% were operative. */
export function creditedIfPrintedParticipationWereReal(growthPct: number): number {
  return growthPct * (BGA2_TRANSFER_FUNCTION.printedParticipationPct / 100);
}

/* ------------------------------------------------------------------ *
 * Cross-statement conclusions
 * ------------------------------------------------------------------ */

export const CROSS_STATEMENT_FINDING = {
  claim: 'The participation rate Securian prints on a statement does not determine the credit, on either an Indexed Loan Account or a mainstream Balanced Indexed Account.',
  evidence: [
    'Annual Policy Review 11/27/2023-11/27/2024, Indexed Loan Account: printed 105%, operative factor 1.47, two segments, dollar credits reconciled to the cent.',
    'Annual Policy Review 08/28/2025-08/28/2026, Balanced Indexed Account 2: printed 110%, operative slope 0.84 with a 5.25 point deduction, six segments, zero residual, dollar credits reconciled to the cent.',
  ],
  whyTheDirectionsMatter:
    'The two errors run opposite ways. A single understating case could be explained by an unrecorded bonus; a single overstating case by an unrecorded charge. Both at once, on the same printed field, means the field is not reporting the quantity it names.',
  /** This is the part that costs money if ignored. */
  salesConsequence:
    'An illustration built on the printed 110% would have assumed 51.93% on the first segment below. The account paid 34.41%. That is not a rounding difference; it is the crediting assumption out by half again, compounding for the life of the case.',
} as const;

/**
 * The twelve-modal regression in segmentAudit.ts solved a different policy
 * (Balanced Growth Accumulator 3) and reached the form
 * `credited = growth x participation - constant`, with a constant of 4.0939
 * points per segment. This statement, on Balanced Growth Accumulator II,
 * independently reaches the same FORM with different coefficients: a
 * multiplicative term and a flat per-segment deduction.
 *
 * That is a real structural confirmation, and it is worth being precise about
 * what it does and does not confirm. It confirms the shape of the rule. It does
 * not transfer the coefficients: 0.84 and 5.25 belong to this account on this
 * product, and 4.0939 belongs to that one.
 */
export const STRUCTURAL_AGREEMENT_WITH_SEGMENT_AUDIT = {
  sharedForm: 'credited = multiplier x indexGrowth - flatDeductionPerSegment',
  thisStatement: { product: 'Balanced Growth Accumulator II', multiplier: 0.84, deductionPoints: 5.25, segmentYears: 2 },
  segmentAudit: { product: 'Balanced Growth Accumulator 3', multiplier: null, deductionPoints: 4.0939, segmentYears: 2 },
  transfersAcross: 'the functional form only',
  doesNotTransfer: 'the coefficients, the segment term, or the participation groups',
} as const;

/* ------------------------------------------------------------------ *
 * Page 6 (Accumulation Value Detail) and page 15 (Current Growth Caps)
 * ------------------------------------------------------------------ *
 *
 * Both pages were found only after the agent was challenged on whether it had
 * read the whole statement. It had not — it had sampled. The correction is
 * recorded here rather than quietly folded in, because three of the four
 * "still open" items above were answered by a page that was sitting in the
 * same document the whole time.
 */

/** Page 15 — "Current Growth Caps ... as of the date of this statement". */
export const CURRENT_GROWTH_CAPS = [
  { account: 'Balanced Indexed Account 2', cap: 'Unlimited' },
  { account: 'Balanced Indexed Account 6', cap: 'Unlimited' },
  { account: 'Balanced Indexed Account 7', cap: 'Unlimited' },
  { account: 'Balanced Indexed Account 9', cap: 'N/A' },
  { account: 'Index A - S&P 500 100% Participation', cap: '8.50%' },
  { account: 'Indexed Loan Account', cap: 'Unlimited' },
] as const;

/**
 * The index, now named rather than inferred. Page 15 lists an
 * "Index A - S&P 500 100% Participation" account, which settles what index
 * this product's accounts track and incidentally shows what a 100%
 * participation account looks like on the same page: capped at 8.50%, where
 * the Balanced accounts are uncapped. The uncapped accounts buy their lack of
 * a cap with the slope and the deduction solved above.
 */
export const INDEX_NAMED = 'S&P 500' as const;

/**
 * Page 6 — segment terms and printed participation per account. The two
 * Balanced accounts in force run on DIFFERENT terms, which the crediting page
 * alone did not reveal.
 */
export const ACCOUNT_TERMS = [
  {
    account: 'Balanced Indexed Account 2',
    segmentYears: 2,
    participationPrintedPct: 110,
    cap: 'Unlimited',
    /** Printed on page 6, not assumed. */
    floorPrintedPct: 0,
    creditedInThisPeriod: true,
  },
  {
    account: 'Balanced Indexed Account 7',
    segmentYears: 3,
    participationPrintedPct: 115,
    cap: 'Unlimited',
    floorPrintedPct: 0,
    /** Earliest segment starts 05/2024 and matures 05/2027. Nothing yet. */
    creditedInThisPeriod: false,
  },
] as const;

/**
 * What the owner raised, and the statement bears out: a multi-year segment
 * credits ONCE, at its end date, and pays nothing before then.
 *
 * Of the segments listed on page 6, only six reached an end date inside this
 * statement period, and those six are exactly the six on the crediting page.
 * Every other segment — the whole of Account 7, and most of Account 2 — shows
 * no credit because it has not matured, not because it performed badly.
 *
 * The practical consequence for a client conversation is the part worth
 * keeping: on a 2-year account nothing credits until month 25, and on a 3-year
 * account nothing credits until month 37. A statement read in between shows
 * zeros that mean "not yet", and a client reading it unaided will hear
 * "not earning".
 */
export const MATURITY_RULE = {
  creditsOnlyAtSegmentEnd: true,
  account2FirstCreditMonth: 25,
  account7FirstCreditMonth: 37,
  segmentsMaturedInPeriod: 6,
  totalCreditedInPeriod: 2883.86,
  accountsWithNoCreditYet: ['Balanced Indexed Account 7'],
  note: 'A zero in the Index Credit column of an unmatured segment is a timing fact, not a performance fact. Nothing on the statement distinguishes the two for the reader.',
} as const;

/**
 * Pages 15 and 19 — the same six credits, posted into Balanced Indexed
 * Account 2 on the segment end dates. A third independent confirmation, after
 * the crediting rates and the accumulation-value arithmetic.
 *
 * Note the contrast with the other statement on file: there, Indexed Loan
 * Account credits posted to the Interim Account. Here they post straight back
 * into the indexed account. Where a credit lands is per-account behaviour and
 * cannot be generalised from one policy.
 */
export const POSTED_CREDITS_LEDGER = [
  { date: '2025-09-19', amount: 1021.09, accountAffected: 'Balanced Indexed Account 2' },
  { date: '2026-07-17', amount: 328.59, accountAffected: 'Balanced Indexed Account 2' },
  { date: '2026-08-21', amount: 282.07, accountAffected: 'Balanced Indexed Account 2' },
] as const;

/** Page 15 — monthly charges on this policy. */
export const BGA2_MONTHLY_CHARGES = {
  costOfInsurance: 103.66,
  monthlyPolicyCharge: 5.0,
  agreementsCharge: 52.51,
  policyIssueCharge: 294.88,
  total: 456.05,
  deductedAcross: ['Balanced Indexed Account 2', 'Balanced Indexed Account 7'],
} as const;

export const WHAT_IS_STILL_OPEN = [
  'What 0.84 and 5.25 are made of. A Balanced account blends an index allocation with a declared-rate allocation and charges a segment spread, so the slope is (index allocation x some participation) and the intercept nets the declared-rate credit against the spread. Two unknowns, one equation. The decomposition needs the account factsheet or the contract form, not more statements.',
  'Whether Balanced Indexed Account 7 obeys the same functional form. Its terms are now known — 3-year segments, 115% printed, uncapped — but not one of its segments has matured, so there is no observed credit to fit. The first will come due 05/2027.',
  'Accounts 6 and 9. Page 15 confirms both exist on this product, which bears on the unreconciled account-set question in segmentAudit.ts, but neither is funded on this policy and neither has a segment here.',
  'Whether the 8.50% cap on the Index A - S&P 500 100% Participation account moves with the same re-rating cycle as the Balanced accounts. One statement shows one date.',
] as const;

/**
 * Read coverage, stated plainly so nobody later mistakes a sample for a full
 * reading. The source is a 72-second phone recording of a 21-page PDF on a
 * monitor, extracted at 2 frames a second: 145 frames, 480x360.
 *
 * Pages confidently read: 1, 4, 5, 6, 8, 9, 12, 14, 15, 19, 20.
 * Pages not read: the remainder, including the narrative and disclosure pages.
 *
 * The three corrections above came from page 6 and page 15, both of which the
 * first pass missed. Anything asserted here rests on a page that was actually
 * read; nothing rests on the assumption that the unread pages agree.
 */
export const READ_COVERAGE = {
  sourceFrames: 145,
  frameResolution: '480x360',
  pagesInDocument: 21,
  pagesRead: [1, 4, 5, 6, 8, 9, 12, 14, 15, 19, 20],
  complete: false,
  caveat: 'A sample, not a full reading. Corrections arrived from pages the first pass skipped.',
} as const;

export const NEVER_PRINTED = true as const;
