/**
 * S&P PRISM index accounts — solved from nine portal segment modals.
 *
 * The most informative document set in the audit, because it corrects two
 * things the rest of the session had concluded and then exposes a structure
 * that explains three accounts at once.
 *
 * ## Correction 1: the printed participation rate IS operative here
 *
 * Every earlier account contradicted its printed participation. These do not.
 * On all nine segments the printed rate reproduces the printed Segment
 * crediting rate exactly — 105% on eight of them, 100% on the ninth:
 *
 *     1.86538% x 1.05 = 1.95865%   printed 1.96%
 *     2.97910% x 1.05 = 3.12805%   printed 3.13%
 *     4.13375% x 1.00 = 4.13375%   printed 4.13%
 *    -0.45382%         floored     printed 0.00%
 *
 * So "the participation field is a constant that means nothing" was too strong.
 * Here it means exactly what it says. The accurate claim is narrower: the
 * printed participation cannot be ASSUMED operative. It is now confirmed on
 * two accounts and contradicted on three.
 *
 * ## Correction 2: but the crediting rate column understates the money
 *
 * The dollar credit is not the accumulation value times the printed crediting
 * rate. It is that times a further multiplier, and seven credited segments
 * reconcile to under half a cent:
 *
 *     $3,684.27 x 1.86538% x 1.05 x 1.25 =  $90.20   printed  $90.20
 *     $3,652.17 x 2.02190% x 1.05 x 1.25 =  $96.92   printed  $96.92
 *     $3,611.43 x 2.49200% x 1.05 x 1.25 = $118.12   printed $118.12
 *     $4,568.71 x 1.19190% x 1.05 x 1.25 =  $71.47   printed  $71.47
 *       $751.26 x 2.97910% x 1.05 x 1.25 =  $29.37   printed  $29.37
 *     $3,713.02 x 0.04219% x 1.05 x 1.25 =   $2.06   printed   $2.06
 *     $7,994.42 x 4.13375% x 1.00 x 1.60 = $528.75   printed $528.75
 *
 * A client reconciling their own statement would find the rate column and the
 * dollars disagree — by 25% on the 105% account, by 60% on the 100% one — with
 * nothing on the page explaining why.
 *
 * ## The structure this exposes
 *
 * Participation and multiplier travel together as a tier, and the multipliers
 * are clean. The Indexed Loan Account's 1.47x, which never decomposed, now
 * lands in the same scheme:
 *
 *     105% x 1.25 = 1.3125   PRISM, six credited segments
 *     105% x 1.40 = 1.47     Indexed Loan Account, two segments
 *     100% x 1.60 = 1.60     PRISM, one segment
 *
 * Nine credited segments, three accounts, three round multipliers. Note what
 * the third row does to the headline: the 100% account pays MORE per unit of
 * index growth than the 105% one. A participation rate on its own tells you
 * nothing about what an account pays, and that is now demonstrated rather than
 * argued.
 *
 * It remains a hypothesis. No carrier document in hand names a multiplier, so
 * 1.25, 1.40 and 1.60 are fitted numbers that reproduce the money exactly and
 * that nobody declared. They may not be illustrated.
 *
 * ## What PRISM actually did, which is the part worth selling
 *
 * Segment D runs Sep 2021 to Sep 2022 and the index rose 2.98%. Over the same
 * window the S&P 500 fell roughly 13%. That is a volatility-controlled index
 * doing precisely what it is built to do, in the worst equity year of the
 * decade, and the segment credited 3.13% and paid $29.37.
 *
 * Segment H starts exactly where D ends, at 5,604.38 — consecutive one-year
 * segments of the same account, which confirms these modals are one rolling
 * annual account rather than an assortment.
 *
 * The honest PRISM story is that drawdown year, not a participation rate: not
 * "we get 171% of the index" but "in a year the market lost 13%, this account
 * credited positive". It also sets the expectation correctly for the other
 * direction — a damped index gives up upside in strong years, which is the
 * trade being made.
 */

export interface PrismSegment {
  readonly label: string;
  readonly startingIndexValue: number;
  readonly endingIndexValue: number;
  /** As printed, rounded to two decimals by the portal. */
  readonly indexGrowthRatePctPrinted: number;
  /** As printed. Equals growth x participation, floored at zero. */
  readonly segmentCreditingRatePctPrinted: number;
  readonly segmentAccumulationValueBeforeCredit: number;
  readonly participationRatePrintedPct: number;
  readonly indexCredit: number;
  /** Where the portal named the account and window. */
  readonly window?: string;
}

/**
 * The four modals. Only the fourth carried a legible account and date footer
 * ("...unt 6 - S&P", "Sep 2021 - Sep 2022"); the other three are the same
 * account and layout and are grouped with it on that basis, which is an
 * inference and is recorded as one.
 */
export const PRISM_SEGMENTS: readonly PrismSegment[] = [
  { label: 'A', startingIndexValue: 5481.46, endingIndexValue: 5583.71, indexGrowthRatePctPrinted: 1.87, segmentCreditingRatePctPrinted: 1.96, segmentAccumulationValueBeforeCredit: 3684.27, participationRatePrintedPct: 105, indexCredit: 90.2 },
  { label: 'B', startingIndexValue: 5569.6, endingIndexValue: 5571.95, indexGrowthRatePctPrinted: 0.04, segmentCreditingRatePctPrinted: 0.04, segmentAccumulationValueBeforeCredit: 3713.02, participationRatePrintedPct: 105, indexCredit: 2.06 },
  { label: 'C', startingIndexValue: 5488.94, endingIndexValue: 5464.03, indexGrowthRatePctPrinted: -0.45, segmentCreditingRatePctPrinted: 0.0, segmentAccumulationValueBeforeCredit: 3735.05, participationRatePrintedPct: 105, indexCredit: 0.0 },
  { label: 'D', startingIndexValue: 5442.25, endingIndexValue: 5604.38, indexGrowthRatePctPrinted: 2.98, segmentCreditingRatePctPrinted: 3.13, segmentAccumulationValueBeforeCredit: 751.26, participationRatePrintedPct: 105, indexCredit: 29.37, window: 'Sep 2021 - Sep 2022' },
  { label: 'E', startingIndexValue: 5484.39, endingIndexValue: 5595.28, indexGrowthRatePctPrinted: 2.02, segmentCreditingRatePctPrinted: 2.12, segmentAccumulationValueBeforeCredit: 3652.17, participationRatePrintedPct: 105, indexCredit: 96.92 },
  { label: 'F', startingIndexValue: 4473.75, endingIndexValue: 4505.1, indexGrowthRatePctPrinted: 0.7, segmentCreditingRatePctPrinted: 0.74, segmentAccumulationValueBeforeCredit: 2967.73, participationRatePrintedPct: 105, indexCredit: 0.0 },
  { label: 'G', startingIndexValue: 5497.6, endingIndexValue: 5634.6, indexGrowthRatePctPrinted: 2.49, segmentCreditingRatePctPrinted: 2.62, segmentAccumulationValueBeforeCredit: 3611.43, participationRatePrintedPct: 105, indexCredit: 118.12 },
  { label: 'H', startingIndexValue: 5604.38, endingIndexValue: 5671.18, indexGrowthRatePctPrinted: 1.19, segmentCreditingRatePctPrinted: 1.25, segmentAccumulationValueBeforeCredit: 4568.71, participationRatePrintedPct: 105, indexCredit: 71.47 },
  { label: 'I', startingIndexValue: 5574.13, endingIndexValue: 5804.55, indexGrowthRatePctPrinted: 4.13, segmentCreditingRatePctPrinted: 4.13, segmentAccumulationValueBeforeCredit: 7994.42, participationRatePrintedPct: 100, indexCredit: 528.75, window: 'Aug 2023 - Aug 2024' },
];

/**
 * The multiplier tiers. Participation and multiplier travel together: the
 * 105% account carries 1.25, the 100% account carries 1.60. Both reconcile
 * exactly, and the 100% account pays MORE per unit of index growth despite the
 * lower headline participation - which is the clearest possible demonstration
 * that a participation rate alone tells you nothing about an account.
 */
export const MULTIPLIER_TIERS = [
  { participationPrintedPct: 105, multiplier: 1.25, effectiveFactor: 1.3125, segmentsCredited: 6 },
  { participationPrintedPct: 100, multiplier: 1.6, effectiveFactor: 1.6, segmentsCredited: 1 },
] as const;

export function tierFor(participationPrintedPct: number) {
  const hit = MULTIPLIER_TIERS.filter((t) => t.participationPrintedPct === participationPrintedPct);
  return hit.length ? hit[0] : null;
}

/**
 * Segment D ends at 5,604.38 and segment H starts at 5,604.38. Consecutive
 * one-year segments of the same account, which is independent confirmation
 * that these modals are one account on a rolling annual term rather than an
 * assortment.
 */
export const CONSECUTIVE_SEGMENT_PROOF = {
  first: 'D',
  second: 'H',
  sharedIndexValue: 5604.38,
  meaning: 'one account, rolling one-year segments',
} as const;

/**
 * Segment F does not fit, and is recorded rather than dropped.
 *
 * It shows positive index growth of 0.70%, a printed crediting rate of 0.74%
 * (which is exactly 105% of the growth, so the rate arithmetic is normal), an
 * accumulation value of $2,967.73 - and an index credit of $0.00.
 *
 * Its index values are also in a different range entirely: 4,473.75 to
 * 4,505.10, where every other segment sits between 5,442 and 5,805.
 *
 * Two readings fit and nothing on the modal separates them. Either the segment
 * had not reached its end date when the page was captured, so the crediting
 * rate is a running figure and no credit has been posted - which is exactly the
 * behaviour the annual statements showed for unmatured segments - or the money
 * left the segment before it matured. The same ambiguity applies to segment C,
 * which could be the 0% floor holding or could equally be unmatured.
 */
export const UNEXPLAINED_SEGMENT = {
  label: 'F',
  growthPct: 0.7008,
  printedCreditingRatePct: 0.74,
  accumulationValue: 2967.73,
  creditPaid: 0.0,
  wouldHavePaidAtTier: 27.3,
  indexRangeAnomaly: 'index values 4,473-4,505 against 5,442-5,805 on every other segment',
  readings: [
    'the segment had not matured when the page was captured, so the rate is running and no credit is posted',
    'value left the segment before its end date',
  ],
  resolved: false,
} as const;

export const PRISM_SOLVE = {
  account: 'Balanced Indexed Account 6',
  index: 'S&P PRISM',
  segmentYears: 1,
  /** Confirmed operative: reproduces the printed crediting rate on all four. */
  participationOperative: 1.05,
  /** Applied to dollars on top of the printed crediting rate. */
  /** The 105% tier. A second tier at 100% carries 1.60 - see MULTIPLIER_TIERS. */
  creditMultiplier: 1.25,
  /** The factor that turns index growth into the dollar credit. */
  effectiveFactor: 1.3125,
  floorPct: 0,
  /** The portal's uncapped sentinel on these modals. */
  growthCapSentinelPrinted: 10000000000.0,
  segmentsObserved: 9,
  segmentsCredited: 7,
  largestResidualDollars: 0.005,
} as const;

/** Index growth, as the portal computes it: plain point-to-point. */
export function prismGrowthPct(startingIndexValue: number, endingIndexValue: number): number {
  return (endingIndexValue / startingIndexValue - 1) * 100;
}

/** The crediting rate the portal PRINTS: growth x participation, floored. */
export function prismPrintedCreditingPct(
  growthPct: number,
  participationPrintedPct: number = 105,
): number {
  return Math.max(growthPct * (participationPrintedPct / 100), PRISM_SOLVE.floorPct);
}

/** The dollar credit the account actually PAYS. */
export function prismCredit(
  growthPct: number,
  segmentAccumulationValue: number,
  participationPrintedPct: number = 105,
): number {
  const tier = tierFor(participationPrintedPct);
  if (!tier) return NaN;
  const factor = Math.max(growthPct, 0) * tier.effectiveFactor;
  return Math.round(segmentAccumulationValue * (factor / 100) * 100) / 100;
}

/**
 * How far the printed crediting rate understates the money, as a percentage.
 * Constant at 25% wherever the floor does not bind.
 */
export function printedRateUnderstatementPct(growthPct: number): number {
  if (growthPct <= 0) return 0;
  return (PRISM_SOLVE.creditMultiplier - 1) * 100;
}

/* ------------------------------------------------------------------ *
 * The multiplier hypothesis
 * ------------------------------------------------------------------ */

export const MULTIPLIER_HYPOTHESIS = {
  claim: 'Securian applies a flat 105% participation across these accounts and differentiates them with a per-account credit multiplier applied to the dollar credit.',
  fits: [
    { account: 'PRISM 1-year, 105% tier', participation: 1.05, multiplier: 1.25, effective: 1.3125, segments: 6 },
    { account: 'PRISM 1-year, 100% tier', participation: 1.0, multiplier: 1.6, effective: 1.6, segments: 1 },
    { account: 'Indexed Loan Account', participation: 1.05, multiplier: 1.4, effective: 1.47, segments: 2 },
  ],
  doesNotFit: [
    'Balanced Indexed Account 8 (PRISM 1-year), read earlier at 1.71x index growth on a single segment. 1.71 / 1.05 = 1.6286, which is not a round multiplier. Either that reading is wrong, or Account 8 works differently, or the multiplier is not always round. One segment from a lower-quality source cannot decide which.',
    'Balanced Indexed Account 2 on BGA II, where the printed 110% overstates and the observed slope is 0.84. A multiplier above 1 cannot produce a factor below the printed participation, so that account is a different mechanism entirely.',
  ],
  status: 'hypothesis',
  wouldBeSettledBy:
    'Any carrier document naming a credit multiplier or index credit enhancement per account. Nine credited segments across three accounts, with three clean multipliers - 1.25, 1.40, 1.60 - is strong. A product factsheet would make it a fact.',
} as const;

/**
 * The claim about PRISM that is both true and worth making, stated so it does
 * not turn into the claim that is neither.
 */
export const PRISM_POSITIONING = {
  supportable:
    'Over the Sep 2021 - Sep 2022 segment this account credited 3.13% and paid a positive index credit, in a window when the S&P 500 fell by roughly 13%.',
  whyItWorks:
    'S&P PRISM is volatility-controlled. It is designed to move less than an equity index in both directions, which is what produced a positive year in a badly negative equity year.',
  theTradeToDisclose:
    'The same damping gives up upside in strong equity years. An account that protects in 2022 will not keep pace in 2023. Selling the first without the second is how the product gets blamed later.',
  doNotSay: [
    'A participation rate comparison against an S&P 500 account. Different indices with different volatility are not comparable on participation.',
    'That the account returns 131.25% of the market. It returns 131.25% of a damped index, which is a different and usually smaller number.',
  ],
} as const;

export const NEVER_PRINTED = true as const;
