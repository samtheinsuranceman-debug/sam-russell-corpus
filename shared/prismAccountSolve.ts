/**
 * S&P PRISM index accounts — solved from fourteen portal segment modals.
 *
 * The largest single-account evidence set in the audit, and the one that
 * corrected the most. Three findings, one of which overturns a claim this file
 * made two commits ago.
 *
 * ## 1. The printed participation rate IS operative here
 *
 * Every earlier account contradicted its printed participation. These do not.
 * On all fourteen segments the printed rate reproduces the printed Segment
 * crediting rate exactly — 105% on eight, 100% on six:
 *
 *     1.86538% x 1.05 = 1.95865%   printed 1.96%
 *     8.10530% x 1.00 = 8.10530%   printed 8.11%
 *    -0.45382%         floored     printed 0.00%
 *
 * "The participation field is a constant that means nothing" was too strong.
 * Here it means what it says. The accurate claim is that it cannot be ASSUMED
 * operative: confirmed on these accounts, contradicted on three others.
 *
 * ## 2. But the money carries a further multiplier the page never shows
 *
 * Twelve credited segments reconcile to under half a cent on three exact
 * (participation, multiplier) pairs:
 *
 *     105% x 1.25 = 1.3125     six segments
 *     100% x 1.60 = 1.6000     four segments
 *     100% x 1.40 = 1.4000     two segments
 *
 * The crediting rate column understates the dollars by 25%, 60% and 40%
 * respectively. Nothing on the modal explains the gap.
 *
 * ## 3. CORRECTION: the multiplier is per-vintage, not per-account
 *
 * Two commits ago this file claimed a per-ACCOUNT multiplier — 1.25 for PRISM,
 * 1.40 for the Indexed Loan Account — and called it "the first structure that
 * explains two accounts at once". That is wrong.
 *
 * Segments M and N share an account and a printed participation with J, K and
 * L, and carry a different multiplier: 1.40 against 1.60. Segment N's own
 * footer names it — "Account 6 - S&P", "Jun 2023 - Jun 2024".
 *
 * So the multiplier moves WITHIN an account across segment vintages, exactly as
 * the participation rate did on Balanced Indexed Account 2 in the BGA3 audit,
 * where twelve segments solved to three declared groups inside one year. It is
 * a declared rate the carrier resets, not a fixed property of an account.
 *
 * For the engine: a multiplier read off one segment may not be applied to that
 * account's other segments, and may certainly not be projected forward.
 *
 * ## What this does to participation as a comparison tool
 *
 * It destroys it. The 100% account pays 1.60 per unit of index growth where the
 * 105% account pays 1.3125 — about 22% more on a LOWER headline rate — and the
 * same 100% account pays 1.40 on other segments. The printed participation
 * spans five points; the unprinted multiplier spans twenty-eight percent. The
 * page shows the less important half of the calculation.
 *
 * ## What PRISM actually did, which is the part worth selling
 *
 * Segment D runs Sep 2021 to Sep 2022 and the index rose 2.98%, in a window
 * when the S&P 500 fell roughly 13%. That is a volatility-controlled index
 * doing what it is built to do in the worst equity year of the decade.
 *
 * D ends where H starts, at 5,604.38, and H ends where L starts, at 5,671.18 —
 * three consecutive one-year segments of one rolling account. Since H is a 105%
 * vintage and L a 100% one, that chain is also direct evidence that both
 * participation and multiplier are redeclared between vintages.
 *
 * The other half of the trade is in the same data and must be sold with it: Jun
 * 2023 to Jun 2024 the index gained 1.31% while equities ran hard. A damped
 * index protects in a drawdown and lags badly in a rally.
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
  /** Where the portal named the account or window. */
  readonly window?: string;
}

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
  { label: 'J', startingIndexValue: 5456.12, endingIndexValue: 5833.4, indexGrowthRatePctPrinted: 6.91, segmentCreditingRatePctPrinted: 6.91, segmentAccumulationValueBeforeCredit: 8009.94, participationRatePrintedPct: 100, indexCredit: 886.19 },
  { label: 'K', startingIndexValue: 5409.32, endingIndexValue: 5847.76, indexGrowthRatePctPrinted: 8.11, segmentCreditingRatePctPrinted: 8.11, segmentAccumulationValueBeforeCredit: 8096.07, participationRatePrintedPct: 100, indexCredit: 1049.93 },
  { label: 'L', startingIndexValue: 5671.18, endingIndexValue: 5956.62, indexGrowthRatePctPrinted: 5.03, segmentCreditingRatePctPrinted: 5.03, segmentAccumulationValueBeforeCredit: 5272.61, participationRatePrintedPct: 100, indexCredit: 424.61 },
  { label: 'M', startingIndexValue: 5615.79, endingIndexValue: 5888.24, indexGrowthRatePctPrinted: 4.85, segmentCreditingRatePctPrinted: 4.85, segmentAccumulationValueBeforeCredit: 4916.9, participationRatePrintedPct: 100, indexCredit: 333.96 },
  { label: 'N', startingIndexValue: 5734.28, endingIndexValue: 5809.28, indexGrowthRatePctPrinted: 1.31, segmentCreditingRatePctPrinted: 1.31, segmentAccumulationValueBeforeCredit: 6355.47, participationRatePrintedPct: 100, indexCredit: 116.37, window: 'Jun 2023 - Jun 2024, Account 6 - S&P' },
];

/**
 * The three observed (participation, multiplier) pairs. These are VINTAGES, not
 * accounts: the two 100% rows are the same account on different segment
 * vintages, carrying different multipliers.
 */
export const OBSERVED_VINTAGES = [
  { participationPrintedPct: 105, multiplier: 1.25, effectiveFactor: 1.3125, segments: ['A', 'B', 'D', 'E', 'G', 'H'] },
  { participationPrintedPct: 100, multiplier: 1.6, effectiveFactor: 1.6, segments: ['I', 'J', 'K', 'L'] },
  { participationPrintedPct: 100, multiplier: 1.4, effectiveFactor: 1.4, segments: ['M', 'N'] },
] as const;

export function vintageForSegment(label: string) {
  const hit = OBSERVED_VINTAGES.filter((v) => (v.segments as readonly string[]).indexOf(label) !== -1);
  return hit.length ? hit[0] : null;
}

export const PRISM_SOLVE = {
  account: 'Balanced Indexed Account 6, and a 105% sibling on the same index',
  index: 'S&P PRISM',
  segmentYears: 1,
  segmentsObserved: 14,
  segmentsCredited: 12,
  /** Confirmed operative: reproduces the printed crediting rate on all fourteen. */
  participationOperativeValues: [1.0, 1.05],
  /** Never printed anywhere. All land on a twentieth. */
  multipliersObserved: [1.25, 1.4, 1.6],
  effectiveFactorRange: [1.3125, 1.6],
  floorPct: 0,
  growthCapSentinelPrinted: 10000000000.0,
  largestResidualDollars: 0.005,
  multiplierIsPerVintage: true,
} as const;

/** Index growth, as the portal computes it: plain point-to-point. */
export function prismGrowthPct(startingIndexValue: number, endingIndexValue: number): number {
  return (endingIndexValue / startingIndexValue - 1) * 100;
}

/** The crediting rate the portal PRINTS: growth x participation, floored. */
export function prismPrintedCreditingPct(growthPct: number, participationPrintedPct: number): number {
  return Math.max(growthPct * (participationPrintedPct / 100), PRISM_SOLVE.floorPct);
}

/**
 * The dollar credit an account actually PAYS.
 *
 * The multiplier must be supplied, because it cannot be looked up from the
 * participation rate: 100% has been observed with both 1.40 and 1.60. A caller
 * that does not know the vintage's multiplier does not know the credit, and the
 * signature says so rather than guessing a default.
 */
export function prismCredit(
  growthPct: number,
  segmentAccumulationValue: number,
  participationPrintedPct: number,
  multiplier: number,
): number {
  const factor = Math.max(growthPct, 0) * (participationPrintedPct / 100) * multiplier;
  return Math.round(segmentAccumulationValue * (factor / 100) * 100) / 100;
}

/** How far the printed crediting rate understates the money, for a vintage. */
export function printedRateUnderstatementPct(multiplier: number): number {
  return (multiplier - 1) * 100;
}

/**
 * Three consecutive one-year segments of one rolling account: D ends where H
 * starts, H ends where L starts. Independent proof these modals are one account
 * — and since H is a 105% vintage and L a 100% one, direct evidence that both
 * participation and multiplier are redeclared between vintages.
 */
export const CONSECUTIVE_CHAIN = [
  { from: 'D', to: 'H', sharedIndexValue: 5604.38 },
  { from: 'H', to: 'L', sharedIndexValue: 5671.18 },
] as const;

/**
 * Segment F, recorded rather than dropped. Positive growth of 0.70%, a normal
 * printed crediting rate of 0.74%, $2,967.73 in the segment, and $0.00
 * credited. Its index values also sit in a different range entirely:
 * 4,473-4,505 against 5,409-5,957 on every other segment.
 *
 * Two readings fit and the modal does not separate them. Either the segment had
 * not reached its end date when the page was captured, so the rate is a running
 * figure and no credit has posted — the behaviour the annual statements showed
 * for unmatured segments — or value left the segment before it matured. Segment
 * C carries the same ambiguity: the 0% floor holding, or simply unmatured.
 */
export const UNEXPLAINED_SEGMENT = {
  label: 'F',
  growthPct: 0.7008,
  printedCreditingRatePct: 0.74,
  accumulationValue: 2967.73,
  creditPaid: 0.0,
  indexRangeAnomaly: 'index values 4,473-4,505 against 5,409-5,957 on every other segment',
  readings: [
    'the segment had not matured when the page was captured, so the rate is running and no credit is posted',
    'value left the segment before its end date',
  ],
  resolved: false,
} as const;

/* ------------------------------------------------------------------ *
 * The multiplier finding
 * ------------------------------------------------------------------ */

export const MULTIPLIER_FINDING = {
  claim: 'Securian applies an undisclosed credit multiplier on top of the printed participation rate, and redeclares it by segment vintage.',
  evidence: [
    'Twelve credited segments across three vintages reconcile to under half a cent: 105% x 1.25, 100% x 1.60, 100% x 1.40.',
    'The Indexed Loan Account, solved separately at 1.47x against a printed 105%, decomposes as 105% x 1.40 — the same 1.40 that appears on PRISM segments M and N.',
    'All three multipliers land on a twentieth, which a fitted artefact has no reason to do.',
  ],
  supersedes:
    'The earlier per-ACCOUNT multiplier hypothesis. Segments M and N share an account and a printed participation with J, K and L and carry a different multiplier, so the multiplier belongs to the vintage.',
  doesNotFit: [
    'Balanced Indexed Account 8, read earlier at 1.71x on a single segment. Neither 1.71 / 1.05 = 1.6286 nor 1.71 / 1.00 = 1.71 is one of the observed multipliers. That reading came from a lower-quality source and one segment; it is more likely wrong than the pattern is.',
    'Balanced Indexed Account 2 on BGA II, where the printed 110% overstates and the observed slope is 0.84. A multiplier above 1 cannot produce a factor below the printed participation, so that account is a different mechanism.',
  ],
  status: 'strong hypothesis',
  wouldBeSettledBy:
    'Any carrier document naming a credit multiplier, index credit enhancement or bonus by account and vintage. Twelve segments landing on three round numbers is close to proof of the arithmetic; only a document makes it a term.',
} as const;

/** What this does to comparing accounts on their participation rate. */
export const PARTICIPATION_IS_NOT_A_RANKING = {
  printedRange: [100, 105],
  printedSpreadPoints: 5,
  multiplierRange: [1.25, 1.6],
  multiplierSpreadPct: 28,
  demonstration:
    'The 100% account pays 1.60 per unit of index growth where the 105% account pays 1.3125 — about 22% more on a lower headline rate. The same 100% account pays 1.40 on other segments.',
  consequence:
    'Ranking accounts by printed participation gets the order wrong. The printed number spans five points; the unprinted multiplier spans twenty-eight percent. The page shows the less important half of the calculation.',
} as const;

export const PRISM_POSITIONING = {
  supportable:
    'Over the Sep 2021 - Sep 2022 segment this account credited 3.13% and paid a positive index credit, in a window when the S&P 500 fell by roughly 13%.',
  whyItWorks:
    'S&P PRISM is volatility-controlled. It is designed to move less than an equity index in both directions, which is what produced a positive year in a badly negative equity year.',
  theTradeToDisclose:
    'The same damping gives up upside in strong equity years, and this data shows it: Jun 2023 to Jun 2024 the index gained 1.31% while equities ran hard. An account that protects in 2022 will lag badly in a rally. Selling the first without the second is how the product gets blamed later.',
  doNotSay: [
    'A participation rate comparison against an S&P 500 account. Different indices with different volatility are not comparable on participation.',
    'That the account returns 160% of the market. It returns 160% of a damped index, which is a different and usually smaller number.',
    'Any multiplier as a rate. 1.25, 1.40 and 1.60 are fitted, undeclared, and redeclared by vintage.',
  ],
} as const;

export const NEVER_PRINTED = true as const;
