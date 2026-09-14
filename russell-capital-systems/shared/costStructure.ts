/**
 * The cost machine: charges read off a cost summary, expressed as percentages
 * that carry forward into any projection.
 *
 * An illustration's Annual Cost Summary itemises what the carrier takes, year
 * by year, in named columns. That table is the whole answer to what a policy
 * costs — no fitting, no solving, no reference curve. Read the columns and the
 * charge structure is simply known.
 *
 * This module holds the taxonomy, the derived baselines, and the arithmetic
 * that turns a cost summary into percentages a future projection can use.
 *
 * ## Carriers are de-identified
 *
 * Mutual Company A, B and C. The terms below are real and sourced; the names
 * are not attached because an unsourced figure under a real company's name is
 * a factual claim nobody can check, and because the illustrations these came
 * from are client documents.
 *
 * ## Two findings that change the engine
 *
 * **1. The surrender charge is not a percentage of account value.**
 *
 * On Mutual Company A it is a fixed dollar amount per $1,000 of specified
 * amount — $37.68 flat for policy years 1-3, then declining in equal steps to
 * zero at year 11. Read as a percentage of account value the same schedule
 * runs 38.97%, 19.40%, 13.64%, 9.08% ... 0.85%, which is a completely
 * different shape and is not a property of the product at all — it is a
 * property of how fast that particular policy happened to accumulate.
 *
 * Modelling it as a percentage of account value therefore gets the early years
 * badly wrong in whichever direction the funding happens to run.
 * `PolicyCharges` now carries `surrenderChargePerThousandByYear` and the
 * engine prefers it.
 *
 * **2. Where the interest lands differs by carrier.**
 *
 * Mutual Company A credits interest to the accumulated value, and the
 * surrender value is that figure less the surrender charge. Mutual Company B
 * credits to the cash value. The distinction matters because it decides what
 * the surrender charge is subtracted from and what the next year's interest
 * compounds on. `creditingTarget` records it per carrier.
 */

export type CreditingTarget = 'accumulated-value' | 'cash-value';

/**
 * The columns an Annual Cost Summary itemises. Named as the illustration names
 * them, so a transcription can be checked against the page it came from.
 */
export interface CostSummaryYear {
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly premium: number;
  /** "Percent Of Premium Charge". */
  readonly percentOfPremiumCharge: number;
  /** "Per Policy Charge" — the flat monthly administrative charge, annualised. */
  readonly perPolicyCharge: number;
  /** "Per $1000 of Specified Amount Charge" — the per-unit charge. */
  readonly perThousandCharge: number;
  readonly riderCharges: number;
  /** "COI Charges" — on the net amount at risk. */
  readonly costOfInsurance: number;
  /** "Indexed Strategy Charge" — a percentage of account value in the strategy. */
  readonly indexedStrategyCharge: number;
  /** "Conditional Credit/Interest Endorsement" — what the carrier adds back. */
  readonly conditionalCredit: number;
  readonly interestEarned: number;
  readonly accountValue: number;
  readonly surrenderValue: number;
  readonly deathBenefit: number;
}

export interface CostBaseline {
  readonly carrierId: 'mutual-a' | 'mutual-b' | 'mutual-c';
  readonly carrierLabel: string;
  readonly product: string;
  readonly source: string;
  readonly creditingTarget: CreditingTarget;
  /** True when the figures came from a cost summary rather than a rate sheet. */
  readonly fromCostSummary: boolean;

  /** Percent-of-premium charge by policy year. Last value repeats. */
  readonly percentOfPremiumByYear: readonly number[];
  /** Flat administrative charge per month. */
  readonly perPolicyMonthly: number;
  /** Per $1,000 of specified amount, per year, and the years it runs. */
  readonly perThousandAnnual: number;
  readonly perThousandYears: number;
  /** Indexed strategy charge as a percentage of account value, and its start year. */
  readonly indexedStrategyPctOfAv: number;
  readonly indexedStrategyFromYear: number;
  /**
   * Surrender charge in DOLLARS per $1,000 of specified amount, by policy
   * year. This is the product's own basis; a percentage of account value is
   * not.
   */
  readonly surrenderPerThousandByYear: readonly number[];
  /** Cost of insurance per $1,000 of net amount at risk, by attained age. */
  readonly coiPerThousandByAge: readonly { readonly age: number; readonly perThousand: number }[];
  /** The case the figures were read from, de-identified. */
  readonly derivedFrom: {
    readonly sex: 'female' | 'male';
    readonly issueAge: number;
    readonly riskClass: string;
    readonly specifiedAmount: number;
    readonly totalPremiumOutlay: number;
    readonly deathBenefitOption: string;
    readonly definitionalTest: 'CVAT' | 'GPT';
  };
  readonly caveats: readonly string[];
}

/**
 * Mutual Company A — read off an Annual Cost Summary, every figure.
 *
 * Case: female, issue age 63, preferred non-tobacco, specified amount
 * $4,755,883, total outlay $2,100,000 over five years, death benefit Option 2
 * (increasing) switching to Option 1 (level) in year 6, CVAT.
 *
 * The cost of insurance curve below is the most valuable thing on this
 * platform: twenty real points from ages 64 to 83, for a named risk class,
 * derived as the printed COI charge divided by the net amount at risk (death
 * benefit less account value, both printed on the same row).
 */
export const MUTUAL_A_BASELINE: CostBaseline = {
  carrierId: 'mutual-a',
  carrierLabel: 'Mutual Company A',
  product: 'Indexed UL Accumulator III',
  source: 'Annual Cost Summary, illustration prepared 4/9/2026, software 4.89.0.7',
  // The surrender value column equals the accumulated value less the surrender
  // charge in every year, so the credit lands on accumulated value.
  creditingTarget: 'accumulated-value',
  fromCostSummary: true,

  // Year 1 is 2.00% and years 2-5 are 6.00%. The year-1 figure is recorded as
  // observed and NOT explained: a first-year load below the renewal load is
  // unusual, and nothing in the held pages says why. It may be a first-year
  // concession, or the charge may apply to only part of the premium. Do not
  // extrapolate it to another case without checking that case's own summary.
  percentOfPremiumByYear: [2.0, 6.0, 6.0, 6.0, 6.0, 0],
  perPolicyMonthly: 10,
  perThousandAnnual: 7.783,
  perThousandYears: 10,
  indexedStrategyPctOfAv: 0.189,
  indexedStrategyFromYear: 11,

  // $37.68 flat for years 1-3, then down in equal steps of $4.71 to zero at
  // year 11. Derived as (accumulated value - surrender value) per $1,000 of
  // specified amount, which is exact.
  surrenderPerThousandByYear: [37.68, 37.68, 37.68, 32.97, 28.26, 23.55, 18.84, 14.13, 9.42, 4.71, 0],

  coiPerThousandByAge: [
    { age: 64, perThousand: 0.546 }, { age: 65, perThousand: 0.981 },
    { age: 66, perThousand: 1.864 }, { age: 67, perThousand: 2.353 },
    { age: 68, perThousand: 2.766 }, { age: 69, perThousand: 3.330 },
    { age: 70, perThousand: 3.556 }, { age: 71, perThousand: 3.936 },
    { age: 72, perThousand: 4.494 }, { age: 73, perThousand: 5.317 },
    { age: 74, perThousand: 6.535 }, { age: 75, perThousand: 7.982 },
    { age: 76, perThousand: 9.526 }, { age: 77, perThousand: 11.185 },
    { age: 78, perThousand: 12.999 }, { age: 79, perThousand: 15.070 },
    { age: 80, perThousand: 17.747 }, { age: 81, perThousand: 20.617 },
    { age: 82, perThousand: 24.944 }, { age: 83, perThousand: 28.336 },
  ],

  derivedFrom: {
    sex: 'female',
    issueAge: 63,
    riskClass: 'preferred non-tobacco',
    specifiedAmount: 4_755_883,
    totalPremiumOutlay: 2_100_000,
    deathBenefitOption: 'Option 2 (increasing), switching to Option 1 (level) in year 6',
    definitionalTest: 'CVAT',
  },

  caveats: [
    'The cost of insurance curve is for ONE sex, ONE issue age and ONE risk class. A standard smoker at the same ages pays more than double. It is a real curve, not a universal one.',
    'The implied per-$1,000 rates use the year-end account value, while the carrier charges monthly against a net amount at risk that falls through the year. The rates are therefore a slight overstatement — the true monthly rate is marginally lower.',
    'The year-1 percent-of-premium charge of 2.00% against 6.00% thereafter is recorded as observed and is not explained by anything in the held pages.',
    'Riders cost $3,415 a year in policy years 2 to 10 on this case. Rider charges are case-specific and are deliberately excluded from the baseline percentages below.',
  ],
};

/**
 * Mutual Company B and C have no cost summary yet.
 *
 * B's brochure names its charges — cost of insurance, cash extra, additional
 * agreements, premium, monthly policy, policy issue, transaction, index
 * segment, surrender — and gives not one rate. That is a complete taxonomy and
 * zero data, which is exactly the situation the cost summary resolves.
 *
 * The one thing recorded for B is where the interest lands, because the owner
 * states it and it is a structural fact rather than a rate: B credits to the
 * cash value where A credits to the accumulated value. Flagged as owner-stated
 * until an illustration confirms it.
 */
export const PENDING_BASELINES = [
  {
    carrierId: 'mutual-b' as const,
    carrierLabel: 'Mutual Company B',
    creditingTarget: 'cash-value' as CreditingTarget,
    creditingTargetSource: 'owner-stated, pending confirmation from a cost summary',
    chargeNamesKnown: [
      'Cost of Insurance', 'Cash Extra', 'Additional Agreements',
      'Premium Charge', 'Monthly Policy Charge', 'Policy Issue Charge',
      'Transaction Charge', 'Index Segment Charge', 'Surrender Charge',
    ],
    ratesKnown: [] as string[],
  },
  {
    carrierId: 'mutual-c' as const,
    carrierLabel: 'Mutual Company C',
    creditingTarget: null,
    creditingTargetSource: 'not established',
    chargeNamesKnown: [] as string[],
    ratesKnown: [] as string[],
  },
];

export interface ChargeShare {
  readonly label: string;
  readonly dollars: number;
  /** As a percentage of total premium outlay — the baseline Sam asked for. */
  readonly pctOfPremiumOutlay: number;
}

export interface CostProfile {
  readonly throughYear: number;
  readonly totalPremiumOutlay: number;
  readonly shares: readonly ChargeShare[];
  readonly totalCharges: number;
  readonly totalChargesPctOfOutlay: number;
  readonly interestCredited: number;
  readonly interestPctOfOutlay: number;
  /** Charges net of what the carrier credited back. */
  readonly netChargesPctOfOutlay: number;
}

/**
 * Every charge as a percentage of total premium outlay — the baseline.
 *
 * Premium outlay is the denominator because it is the number the client
 * actually recognises: what they put in. A charge quoted as a percentage of
 * account value moves every year and tells them nothing; a charge quoted
 * against what they paid is a figure they can hold on to.
 *
 * The caveat that has to travel with it: these percentages are a property of
 * THIS funding pattern, not of the product. Charges that scale with the
 * specified amount — the per-$1,000 charge and the cost of insurance — are
 * fixed dollars regardless of how much premium goes in, so paying half as much
 * premium into the same face amount roughly doubles every percentage here.
 */
export function costProfile(rows: readonly CostSummaryYear[], throughYear: number): CostProfile {
  const within = rows.filter((r) => r.policyYear <= throughYear);
  const sum = (f: (r: CostSummaryYear) => number) => within.reduce((a, r) => a + f(r), 0);
  const outlay = sum((r) => r.premium);
  const pct = (v: number) => (outlay > 0 ? (v / outlay) * 100 : 0);

  const shares: ChargeShare[] = [
    { label: 'Percent of premium', dollars: sum((r) => r.percentOfPremiumCharge), pctOfPremiumOutlay: pct(sum((r) => r.percentOfPremiumCharge)) },
    { label: 'Per policy', dollars: sum((r) => r.perPolicyCharge), pctOfPremiumOutlay: pct(sum((r) => r.perPolicyCharge)) },
    { label: 'Per $1,000 of specified amount', dollars: sum((r) => r.perThousandCharge), pctOfPremiumOutlay: pct(sum((r) => r.perThousandCharge)) },
    { label: 'Riders', dollars: sum((r) => r.riderCharges), pctOfPremiumOutlay: pct(sum((r) => r.riderCharges)) },
    { label: 'Cost of insurance', dollars: sum((r) => r.costOfInsurance), pctOfPremiumOutlay: pct(sum((r) => r.costOfInsurance)) },
    { label: 'Indexed strategy', dollars: sum((r) => r.indexedStrategyCharge), pctOfPremiumOutlay: pct(sum((r) => r.indexedStrategyCharge)) },
  ];

  const totalCharges = shares.reduce((a, s) => a + s.dollars, 0);
  const credited = sum((r) => r.conditionalCredit);
  const interest = sum((r) => r.interestEarned);

  return {
    throughYear,
    totalPremiumOutlay: outlay,
    shares,
    totalCharges,
    totalChargesPctOfOutlay: pct(totalCharges),
    interestCredited: interest,
    interestPctOfOutlay: pct(interest),
    netChargesPctOfOutlay: pct(totalCharges - credited),
  };
}

/** The cost of insurance a cost summary implies, exactly — no fitting. */
export function impliedCoiPerThousand(
  rows: readonly CostSummaryYear[]
): readonly { age: number; netAmountAtRisk: number; perThousand: number }[] {
  return rows.map((r) => {
    const nar = r.deathBenefit - r.accountValue;
    return {
      age: r.attainedAge,
      netAmountAtRisk: nar,
      perThousand: nar > 0 ? r.costOfInsurance / (nar / 1000) : 0,
    };
  });
}

/**
 * The surrender charge a cost summary implies, in dollars per $1,000 of
 * specified amount — the product's own basis.
 */
export function impliedSurrenderPerThousand(
  rows: readonly CostSummaryYear[],
  specifiedAmount: number
): readonly number[] {
  return rows.map((r) =>
    Math.round(((r.accountValue - r.surrenderValue) / (specifiedAmount / 1000)) * 100) / 100
  );
}

/**
 * Mutual Company A's multi-index blend, from the illustration's own note.
 *
 * "50% of best performing index, 30% of the next best, and 20% of the third
 * best performing index are used. In the event that only two of the indexes
 * have a historical change rate, the performance weighting would be 65/35...
 * If only one index has a historical change rate then 100% of that index is
 * used."
 *
 * The fallback rules were not in the rate guide and are new here. The blend is
 * the contract, not hindsight — the weighting is defined by outcome rank
 * because that is what the policy says, and a reader who assumes otherwise
 * will model it wrong.
 */
export const MULTI_INDEX_BLEND = {
  weightsForThree: [0.50, 0.30, 0.20],
  weightsForTwo: [0.65, 0.35],
  weightsForOne: [1.0],
  indices: ['S&P 500', 'Dow Jones Industrial Average', 'NASDAQ-100'],
  /** Ranked by that year's own return, best first. */
  rankedByOutcome: true,
} as const;

/** Weighted blend of a year's index returns, per the contract's own rule. */
export function blendMultiIndex(returns: readonly number[]): number {
  const present = returns.filter((r) => Number.isFinite(r));
  if (present.length === 0) return 0;
  const sorted = [...present].sort((a, b) => b - a);
  const w =
    sorted.length >= 3 ? MULTI_INDEX_BLEND.weightsForThree
      : sorted.length === 2 ? MULTI_INDEX_BLEND.weightsForTwo
      : MULTI_INDEX_BLEND.weightsForOne;
  return sorted.slice(0, w.length).reduce((a, r, i) => a + r * w[i]!, 0);
}
