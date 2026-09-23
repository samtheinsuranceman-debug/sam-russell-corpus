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
 * Mutual Company N, B and C. The terms below are real and sourced; the names
 * are not attached because an unsourced figure under a real company's name is
 * a factual claim nobody can check, and because the illustrations these came
 * from are client documents.
 *
 * ## Two findings that change the engine
 *
 * **1. The surrender charge is not a percentage of account value.**
 *
 * On Mutual Company N it is a fixed dollar amount per $1,000 of specified
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
 * Mutual Company N credits interest to the accumulated value, and the
 * surrender value is that figure less the surrender charge. Mutual Company S
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
  readonly carrierId: 'mutual-n' | 'mutual-s' | 'mutual-pc';
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
  /**
   * A credit the carrier adds back as a percentage of cash value from a given
   * year (Mutual Company S's "bonus interest credit"). Absent where the
   * product has none.
   */
  readonly bonusInterestPctOfCashValue?: number;
  readonly bonusInterestFromYear?: number;
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
 * Mutual Company N — read off an Annual Cost Summary, every figure.
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
export const MUTUAL_N_BASELINE: CostBaseline = {
  carrierId: 'mutual-n',
  carrierLabel: 'Mutual Company N',
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
 * Mutual Company S — read off its illustration's Charges Report, every figure.
 *
 * B calls its cost summary "Your policy's current charges summary" (the
 * Charges Report). Not every B illustration carries it; this one does, and
 * every column was transcribed: premium charge, cost of insurance, policy issue
 * charge, additional charges, bonus interest credit, additional policy credits,
 * surrenders and loans, interest earned, cash value, surrender value, death
 * benefit. The transcription roll-forwards to the printed cash value in every
 * one of twenty years and reproduces the printed five-year and fifteen-year
 * totals (server/costStructure.test.ts).
 *
 * Case: female, issue age 64, preferred non-tobacco, level death benefit
 * $2,918,696 (the minimum face for the premium), $300,000 a year for five
 * years, Guideline Premium Test, not a MEC, half in a two-year S&P 500 account
 * and half in a one-year volatility-controlled account, illustrated at 6.62%
 * and 6.57%.
 *
 * Two structural facts the report settles:
 *
 *   • Interest lands on the CASH VALUE. The report's own definition: the
 *     surrender value "is equal to the cash value less any surrender charges
 *     and any policy loans". Recorded as owner-stated until now; confirmed.
 *   • The surrender charge is again dollars per $1,000 of face, not a
 *     percentage of value: $51.49 in year 1, falling about $1.73 a year to
 *     $41.14 in year 7, then $37.35, $18.67 and zero from year 10.
 *
 * A second B illustration for the same sex, issue age and class (face
 * $2,724,116, $280,000 a year) gives the same premium charge (8.0% then
 * 6.5%), the same policy issue charge per $1,000 (6.793 against 6.790) and the
 * same cost of insurance per $1,000 of net amount at risk to within one
 * percent in each of its five years, so the figures below are the product's,
 * not one case's arithmetic.
 */
export const MUTUAL_S_BASELINE: CostBaseline = {
  carrierId: 'mutual-s',
  carrierLabel: 'Mutual Company S',
  product: 'Balanced Growth Accumulator III Indexed Universal Life',
  source: 'Charges Report ("Your policy\'s current charges summary"), illustration run 4/8/2026',
  creditingTarget: 'cash-value',
  fromCostSummary: true,

  // 8.00% of premium in year 1, 6.50% in years 2-5, printed as $24,000 then
  // $19,500 on $300,000. The same two rates appear on the second case.
  percentOfPremiumByYear: [8.0, 6.5, 6.5, 6.5, 6.5, 0],
  // "Additional charges" is $60 a year in every year: the $5 monthly policy
  // charge. No cash extra, transaction, agreement or index segment charge was
  // levied on this case, so those remain named-but-unpriced.
  perPolicyMonthly: 5,
  // Policy issue charge: $19,818 a year for exactly ten years on a face of
  // $2,918,696, which is $6.79 per $1,000. The report's own note: "This charge
  // only applies for the first 10 years of the policy or for 10 years after
  // face amount increases." The rate is age- and sex-dependent (a male 70 on
  // the same product pays $8.44).
  perThousandAnnual: 6.79,
  perThousandYears: 10,
  // No indexed strategy charge on this product; B does the opposite from
  // year 11 and pays a bonus (below).
  indexedStrategyPctOfAv: 0,
  indexedStrategyFromYear: 0,
  // Bonus interest credit from the eleventh anniversary: "calculated as a
  // percentage of your policy's cash value". Observed 0.602-0.611% of the
  // prior year-end cash value in every year 11-20 (0.567% of the current
  // year-end value). Held as 0.60% of the prior year-end value.
  bonusInterestPctOfCashValue: 0.6,
  bonusInterestFromYear: 11,

  // (cash value - surrender value) per $1,000 of face, years 1-10; zero after.
  surrenderPerThousandByYear: [51.49, 49.75, 48.01, 46.28, 44.56, 42.84, 41.14, 37.35, 18.67, 0],

  // Printed cost of insurance divided by (death benefit - year-end cash
  // value), the same basis as Mutual Company N. Ages 64-73 rise as a mortality
  // curve must. From year 11 the carrier's rate steps down (the same dollars
  // on a smaller amount at risk), and from year 15 the amount at risk is small
  // enough that the year-end basis swings the implied rate: see the caveats.
  coiPerThousandByAge: [
    { age: 64, perThousand: 2.592 }, { age: 65, perThousand: 3.466 },
    { age: 66, perThousand: 3.869 }, { age: 67, perThousand: 4.381 },
    { age: 68, perThousand: 4.962 }, { age: 69, perThousand: 5.642 },
    { age: 70, perThousand: 6.263 }, { age: 71, perThousand: 7.180 },
    { age: 72, perThousand: 7.992 }, { age: 73, perThousand: 9.094 },
    { age: 74, perThousand: 8.058 }, { age: 75, perThousand: 9.417 },
    { age: 76, perThousand: 10.557 }, { age: 77, perThousand: 14.319 },
    { age: 78, perThousand: 19.805 }, { age: 79, perThousand: 19.825 },
    { age: 80, perThousand: 14.240 }, { age: 81, perThousand: 16.660 },
    { age: 82, perThousand: 19.987 }, { age: 83, perThousand: 23.544 },
  ],

  derivedFrom: {
    sex: 'female',
    issueAge: 64,
    riskClass: 'preferred non-tobacco',
    specifiedAmount: 2_918_696,
    totalPremiumOutlay: 1_500_000,
    deathBenefitOption: 'Level, at the minimum face for the premium; the corridor lifts it from year 16',
    definitionalTest: 'GPT',
  },

  caveats: [
    'The cost of insurance curve is for ONE sex, ONE issue age and ONE risk class. It is a real curve, not a universal one. A second case of the same sex, age and class reproduced it to within one percent, so it is the product\'s curve for that class.',
    'The implied per-$1,000 rates use the year-end cash value against a level death benefit. Ages 64-73 rise monotonically. From age 74 the carrier charges fewer dollars on a shrinking amount at risk and the year-end basis overstates the swing, so ages 74-83 are recorded as observed and should be read as a band, not a curve.',
    'The bonus interest credit is observed, not contractual: 0.60% of the prior year-end cash value from year 11 on this case. The report says only that it "may be credited" and is "a percentage of your policy\'s cash value".',
    'No cash extra, transaction, agreement or index segment charge was levied on this case, so those four of B\'s nine named charges remain unpriced here.',
    'A first-year premium charge of 8.00% against 6.50% thereafter is the ordinary shape for this product; both figures are printed and both recur on the second case.',
  ],
};

/** Every carrier whose charge structure was read off its own cost summary. */
export const COMPLETE_BASELINES: readonly CostBaseline[] = [MUTUAL_N_BASELINE, MUTUAL_S_BASELINE];

/**
 * Mutual Company PC has no cost summary yet.
 *
 * B's brochure once stood here with a complete taxonomy and no rates; its
 * Charges Report closed it (MUTUAL_S_BASELINE). PC's structure is not held at
 * all: one illustration carrying its charges summary resolves it the same way.
 */
export const PENDING_BASELINES = [
  {
    carrierId: 'mutual-pc' as const,
    carrierLabel: 'Mutual Company PC',
    creditingTarget: null as CreditingTarget | null,
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
 * Mutual Company N's multi-index blend, from the illustration's own note.
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
