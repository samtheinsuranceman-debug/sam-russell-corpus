/**
 * Securian / Minnesota Life — Annual Policy Review, 11/27/2023 through 11/27/2024.
 *
 * Source: a 21-page carrier-issued annual review, read page by page from the
 * owner's own screen recording. This is the first SOURCE DOCUMENT in this
 * repository for how a Balanced Indexed Account policy actually credits. Every
 * number below was read off the statement; nothing here is inferred from the
 * web portal, and nothing here is printed to a client.
 *
 * Why it matters more than everything that came before it:
 *
 *   The twelve-modal regression in segmentAudit.ts had to solve for a crediting
 *   rule from outcomes alone, because the portal never showed its working. This
 *   statement shows the working. It prints, for each segment, the starting and
 *   ending index values, the index growth rate, the cap, the participation
 *   rate, THE SEGMENT CREDITING RATE, and the accumulation value the credit was
 *   struck against. The transaction ledger on a later page then prints the
 *   dollar credit that was actually posted.
 *
 *   Two independent records of the same three events, and they reconcile to the
 *   cent. That is evidence of a different order than a regression.
 *
 * The finding that changes the engine:
 *
 *   On all three Indexed Loan Account segments the statement prints
 *   "Part. Rate 105%". On none of them is 105% the operative factor. The
 *   operative factor is 1.47, exactly, on both segments that credited.
 *
 *   This is the second proof, from a second and better source, of what the
 *   PRISM row in segmentAudit.ts showed: the participation field Securian
 *   prints is a CONSTANT, not a reported fact. The portal printing it was not
 *   a portal bug. The carrier prints it the same way on the statement.
 *
 * Statement identifiers are deliberately omitted. This is the owner's in-force
 * policy; the file records behaviour, not the contract holder.
 */

/** Policy-level facts, page 4 and page 6. */
export const STATEMENT_PERIOD = {
  from: '2023-11-27',
  to: '2024-11-27',
  policyAnniversary: '11-27',
  /** Page 4 — Premium Summary. */
  plannedAnnualPremium: 2676.0,
  plannedPremiumFrequency: 'Quarterly',
  premiumPaidInPeriod: 24981.76,
  guidelinePremiumMaxThrough20251127: 21894.18,
  mecMaxThrough20251127: 23702.98,
  accumulationValueAtPeriodStart: 95811.69,
  chargesInPeriod: -4068.79,
} as const;

/**
 * Page 6 — Allocation Summary and Important Policyowner Information.
 *
 * The loan rate is the one number this whole exercise most needed and could
 * never reach by inference. It is READ here, not derived. None of the three
 * candidate charges the twelve-modal audit produced (4.51% / 6.29% / 7.16%)
 * is this rate, which is the correct outcome: a variable POLICY LOAN interest
 * rate is what the carrier charges on borrowed money, and it is a different
 * quantity from whatever is deducted inside a segment before crediting.
 */
export const POLICY_STATE = {
  loanAsPercentOfAccumulationValue: 86.6,
  currentAllocation: [
    { account: 'Balanced Indexed Account 2', percent: 90 },
    { account: 'Balanced Indexed Account 7', percent: 10 },
    { account: 'Fixed Account(s)', percent: 0 },
  ],
  /** Verbatim from "Important Policyowner Information". */
  variablePolicyLoanRate: {
    before: 4.0,
    after: 4.25,
    effective: '2024-10-01',
    quoted:
      'Effective 10/01/2024 the variable policy loan interest rate changed from 4.00% to 4.25%.',
  },
  /** Page 8 — the fixed side is effectively empty. */
  interimAccountValueAtPeriodEnd: 64.4,
} as const;

/**
 * Page 9 — "Growth Rate and Index Credit Detail 11/27/2023 - 11/27/2024".
 *
 * Read exactly as printed. `indexCreditOnThisRow` is $0.00 on every row
 * INCLUDING the two that credited, because on this policy an Indexed Loan
 * Account credit is posted to the Interim Account rather than back into the
 * segment. The transaction ledger (page 20) is where the money appears. A
 * reader who stopped at this table would conclude nothing was credited, and
 * would be wrong — which is itself a rule the engine has to carry.
 */
export interface StatementSegmentRow {
  account: string;
  segmentStart: string;
  startingIndexValue: number;
  endingIndexValue: number;
  /** As printed, in percent. */
  indexGrowthRatePct: number;
  growthCap: 'N/A' | 'Unlimited' | number;
  /** As printed. Not the operative factor — see OPERATIVE_MULTIPLIER. */
  participationRatePrintedPct: number;
  /** As printed, in percent. */
  segmentCreditingRatePct: number;
  segmentAccumulationValueBeforeCredit: number;
  indexCreditOnThisRow: number;
}

export const GROWTH_RATE_AND_INDEX_CREDIT_DETAIL: readonly StatementSegmentRow[] = [
  {
    account: 'Balanced Indexed Account 8',
    segmentStart: '2022-12-16',
    startingIndexValue: 5583.71,
    endingIndexValue: 5574.13,
    indexGrowthRatePct: -0.17157,
    growthCap: 'N/A',
    participationRatePrintedPct: 105,
    segmentCreditingRatePct: 0.0,
    segmentAccumulationValueBeforeCredit: 5026.89,
    indexCreditOnThisRow: 0.0,
  },
  {
    account: 'Indexed Loan Account',
    segmentStart: '2023-04-21',
    startingIndexValue: 5601.84,
    endingIndexValue: 5565.89,
    indexGrowthRatePct: -0.64175,
    growthCap: 'Unlimited',
    participationRatePrintedPct: 105,
    segmentCreditingRatePct: 0.0,
    segmentAccumulationValueBeforeCredit: 67425.1,
    indexCreditOnThisRow: 0.0,
  },
  {
    account: 'Indexed Loan Account',
    segmentStart: '2023-10-20',
    startingIndexValue: 5409.32,
    endingIndexValue: 5847.76,
    indexGrowthRatePct: 8.10527,
    growthCap: 'Unlimited',
    participationRatePrintedPct: 105,
    segmentCreditingRatePct: 11.91475,
    segmentAccumulationValueBeforeCredit: 9114.97,
    indexCreditOnThisRow: 0.0,
  },
  {
    account: 'Indexed Loan Account',
    segmentStart: '2023-11-17',
    startingIndexValue: 5456.12,
    endingIndexValue: 5833.4,
    indexGrowthRatePct: 6.9148,
    growthCap: 'Unlimited',
    participationRatePrintedPct: 105,
    segmentCreditingRatePct: 10.16478,
    segmentAccumulationValueBeforeCredit: 3700.88,
    indexCreditOnThisRow: 0.0,
  },
];

/**
 * Page 20 — Account Transaction Detail. The dollar credits that the page 9
 * table reports as $0.00, posted to the Interim Account on the segment end
 * dates. These are the settlement records for rows 3 and 4 above.
 */
export const POSTED_INDEX_CREDITS = [
  { date: '2024-10-18', amount: 1086.03, accountAffected: 'Interim Account' },
  { date: '2024-11-15', amount: 376.19, accountAffected: 'Interim Account' },
] as const;

/**
 * Page 14 and page 20 — Monthly Charges, identical in both months read.
 * Deducted pro rata across the three Balanced accounts, not from one.
 */
export const MONTHLY_CHARGES = {
  costOfInsurance: 62.56,
  monthlyPolicyCharge: 5.0,
  policyIssueCharge: 156.17,
  total: 223.73,
  annualised: 223.73 * 12,
  deductedAcross: ['Balanced Indexed Account 2', 'Balanced Indexed Account 7', 'Balanced Indexed Account 8'],
} as const;

/* ------------------------------------------------------------------ *
 * The solved rule
 * ------------------------------------------------------------------ */

/**
 * The factor that reproduces both printed crediting rates exactly, and both
 * posted dollar credits to the cent.
 *
 * 8.10527% x 1.47 = 11.91475%  ->  $9,114.97 x 11.91475% = $1,086.03  (posted)
 * 6.91480% x 1.47 = 10.16476%  ->  $3,700.88 x 10.16478% = $376.19    (posted)
 *
 * 1.470000 and 1.470003. Two segments, four independent numbers, one factor.
 */
export const OPERATIVE_MULTIPLIER = 1.47;

/** What the statement prints in the participation column regardless. */
export const PRINTED_PARTICIPATION_PCT = 105;

export function indexGrowthPct(startingIndexValue: number, endingIndexValue: number): number {
  return (endingIndexValue / startingIndexValue - 1) * 100;
}

/**
 * Segment crediting rate for an Indexed Loan Account segment, in percent.
 * Floored at zero — row 2 above grew -0.64175% and credited 0.00000%.
 */
export function indexedLoanAccountCreditingPct(growthPct: number): number {
  return Math.max(growthPct, 0) * OPERATIVE_MULTIPLIER;
}

/** Dollar credit for a segment, given the accumulation value it is struck against. */
export function indexedLoanAccountCredit(
  growthPct: number,
  segmentAccumulationValueBeforeCredit: number,
): number {
  const rate = indexedLoanAccountCreditingPct(growthPct) / 100;
  return Math.round(segmentAccumulationValueBeforeCredit * rate * 100) / 100;
}

/* ------------------------------------------------------------------ *
 * What this does and does not license
 * ------------------------------------------------------------------ */

export const WHAT_THIS_ESTABLISHES = [
  'Index Growth Rate on this contract is plain point-to-point: endingIndexValue / startingIndexValue - 1. All four printed rates reproduce to five decimal places.',
  'The Indexed Loan Account credits at 1.47x index growth, uncapped, floored at zero. Two printed rates and two posted dollar amounts agree exactly.',
  'The participation rate Securian prints is a constant. 105% appears on every row of this statement while the operative factor is 1.47. This is the second proof, now from the carrier\'s own document rather than the portal.',
  'A $0.00 in the Index Credit column of the Growth Rate detail table does not mean no credit was paid. On this policy the Indexed Loan Account credit posts to the Interim Account and appears only in the transaction ledger.',
  'The variable policy loan interest rate is 4.00% rising to 4.25% effective 10/01/2024. This is read, not inferred.',
  'Monthly charges are $223.73 and are deducted pro rata across all funded Balanced accounts.',
] as const;

export const WHAT_THIS_DOES_NOT_ESTABLISH = [
  'Where 1.47 comes from. It reproduces the arithmetic exactly, but the statement never names it, and a factor fitted to two segments of one account is not a declared contractual rate. It is not a participation rate to quote, and it must not be illustrated.',
  'That 1.47 applies to Balanced Indexed Account 2, 7 or 8. It is observed only on the Indexed Loan Account, which the statement gives an Unlimited cap while Account 8 is capped N/A. They are different accounts with different mechanics.',
  'The Balanced account formula. The footnote defining Partial Segment Growth Rate describes an index allocation plus a declared-rate allocation minus a segment spread, which is what makes these accounts "Balanced" - the credit applies to part of the money, not all of it. The statement prints the footnote but this reading of it is not yet legible enough to encode.',
  'Any link between this policy and the twelve segments audited in segmentAudit.ts. That ledger showed Balanced Indexed Accounts 2, 6 and 8; this statement shows 2, 7 and 8 plus an Indexed Loan Account. Account 6 versus Account 7 is one character at low resolution and the two sets have not been reconciled. Until they are, do not carry a finding from one across to the other.',
] as const;

/** Nothing in this module is client-facing. It is evidence, not illustration. */
export const NEVER_PRINTED = true as const;
