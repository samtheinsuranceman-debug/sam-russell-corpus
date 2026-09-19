/**
 * Balanced Indexed Account 6 — S&P PRISM, 1-Year — solved from four portal
 * segment modals.
 *
 * This account is the most informative document set in the whole audit, because
 * it corrects two things the rest of the session had concluded.
 *
 * ## Correction 1: the printed participation rate IS operative here
 *
 * Every earlier account contradicted its printed participation. This one does
 * not. On all four segments the printed 105.00% reproduces the printed Segment
 * crediting rate exactly:
 *
 *     1.86538% x 1.05 = 1.95865%   printed 1.96%
 *     0.04219% x 1.05 = 0.04430%   printed 0.04%
 *     2.97910% x 1.05 = 3.12805%   printed 3.13%
 *    -0.45382%         floored     printed 0.00%
 *
 * So "the participation field is a constant that means nothing" was too strong.
 * On this account it means exactly what it says. The correct statement is
 * narrower: the printed participation cannot be ASSUMED operative, because it
 * has been confirmed on one account and contradicted on three.
 *
 * ## Correction 2: but the crediting rate column understates the money by 25%
 *
 * The dollar credit is not the segment accumulation value times the printed
 * crediting rate. It is that times 1.25, exactly, on every credited segment:
 *
 *     $3,684.27 x 1.86538% x 1.05 x 1.25 = $90.20    printed $90.20
 *     $3,713.02 x 0.04219% x 1.05 x 1.25 =  $2.06    printed  $2.06
 *       $751.26 x 2.97910% x 1.05 x 1.25 = $29.37    printed $29.37
 *
 * Three segments, three exact matches, largest residual under half a cent. So
 * the account credits at 1.05 x 1.25 = 1.3125 times index growth, while the
 * page shows a crediting rate of 1.05 times it. A client reconciling their own
 * statement would find the rate column and the dollars disagree by a quarter,
 * in their favour, with nothing on the page explaining why.
 *
 * ## The pattern this exposes
 *
 * The Indexed Loan Account was solved earlier at 1.47x against a printed 105%.
 * That number never decomposed cleanly. It does now:
 *
 *     Account 6            1.05 x 1.25 = 1.3125
 *     Indexed Loan Account 1.05 x 1.40 = 1.47
 *
 * Same 105% participation on both, different per-account multiplier. Two
 * accounts and five credited segments support it. It is a hypothesis, not a
 * contract term — no carrier document in hand names a multiplier — but it is
 * the first structure that explains two accounts at once.
 *
 * ## What PRISM actually did, which is the part worth selling
 *
 * The fourth segment runs Sep 2021 to Sep 2022 and the index rose 2.98%. Over
 * the same window the S&P 500 fell roughly 13%. That is a volatility-controlled
 * index doing precisely what it is built to do, in the worst equity year of the
 * decade, and the segment credited 3.13% and paid $29.37.
 *
 * That is the honest PRISM story, and it is stronger than any participation
 * rate: not "we get 171% of the index" but "in a year the market lost 13%, this
 * account credited positive". It also sets the expectation correctly for the
 * other direction — a damped index gives up upside in strong years, which is
 * the trade being made.
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
  {
    label: 'A',
    startingIndexValue: 5481.46,
    endingIndexValue: 5583.71,
    indexGrowthRatePctPrinted: 1.87,
    segmentCreditingRatePctPrinted: 1.96,
    segmentAccumulationValueBeforeCredit: 3684.27,
    participationRatePrintedPct: 105,
    indexCredit: 90.2,
  },
  {
    label: 'B',
    startingIndexValue: 5569.6,
    endingIndexValue: 5571.95,
    indexGrowthRatePctPrinted: 0.04,
    segmentCreditingRatePctPrinted: 0.04,
    segmentAccumulationValueBeforeCredit: 3713.02,
    participationRatePrintedPct: 105,
    indexCredit: 2.06,
  },
  {
    label: 'C',
    startingIndexValue: 5488.94,
    endingIndexValue: 5464.03,
    indexGrowthRatePctPrinted: -0.45,
    segmentCreditingRatePctPrinted: 0.0,
    segmentAccumulationValueBeforeCredit: 3735.05,
    participationRatePrintedPct: 105,
    indexCredit: 0.0,
  },
  {
    label: 'D',
    startingIndexValue: 5442.25,
    endingIndexValue: 5604.38,
    indexGrowthRatePctPrinted: 2.98,
    segmentCreditingRatePctPrinted: 3.13,
    segmentAccumulationValueBeforeCredit: 751.26,
    participationRatePrintedPct: 105,
    indexCredit: 29.37,
    window: 'Sep 2021 - Sep 2022',
  },
];

export const PRISM_SOLVE = {
  account: 'Balanced Indexed Account 6',
  index: 'S&P PRISM',
  segmentYears: 1,
  /** Confirmed operative: reproduces the printed crediting rate on all four. */
  participationOperative: 1.05,
  /** Applied to dollars on top of the printed crediting rate. */
  creditMultiplier: 1.25,
  /** The factor that turns index growth into the dollar credit. */
  effectiveFactor: 1.3125,
  floorPct: 0,
  /** The portal's uncapped sentinel on these modals. */
  growthCapSentinelPrinted: 10000000000.0,
  segmentsObserved: 4,
  segmentsCredited: 3,
  largestResidualDollars: 0.005,
} as const;

/** Index growth, as the portal computes it: plain point-to-point. */
export function prismGrowthPct(startingIndexValue: number, endingIndexValue: number): number {
  return (endingIndexValue / startingIndexValue - 1) * 100;
}

/** The crediting rate the portal PRINTS: growth x participation, floored. */
export function prismPrintedCreditingPct(growthPct: number): number {
  return Math.max(growthPct * PRISM_SOLVE.participationOperative, PRISM_SOLVE.floorPct);
}

/** The dollar credit the account actually PAYS. */
export function prismCredit(growthPct: number, segmentAccumulationValue: number): number {
  const factor = Math.max(growthPct, 0) * PRISM_SOLVE.effectiveFactor;
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
    { account: 'Balanced Indexed Account 6 (PRISM 1-year)', participation: 1.05, multiplier: 1.25, effective: 1.3125, segments: 3 },
    { account: 'Indexed Loan Account', participation: 1.05, multiplier: 1.4, effective: 1.47, segments: 2 },
  ],
  doesNotFit: [
    'Balanced Indexed Account 8 (PRISM 1-year), read earlier at 1.71x index growth on a single segment. 1.71 / 1.05 = 1.6286, which is not a round multiplier. Either that reading is wrong, or Account 8 works differently, or the multiplier is not always round. One segment from a lower-quality source cannot decide which.',
    'Balanced Indexed Account 2 on BGA II, where the printed 110% overstates and the observed slope is 0.84. A multiplier above 1 cannot produce a factor below the printed participation, so that account is a different mechanism entirely.',
  ],
  status: 'hypothesis',
  wouldBeSettledBy:
    'Any carrier document naming a credit multiplier or index credit enhancement per account. Five segments across two accounts is suggestive; a product factsheet would make it a fact.',
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
