/**
 * What the rate guide could not tell us, and what each gap is worth.
 *
 * The Nationwide IUL Accumulator II rate guide (FLM-1491AO.10 (02/25), rates as
 * of 15 March 2025) is a complete document about *crediting*: twelve strategies
 * with caps, participation rates, spreads, floors and strategy charges, current
 * and guaranteed, plus the carrier's own published look-backs over six windows.
 * All of that is transcribed in docs/carriers/ and drives the engine today.
 *
 * It says nothing about what the policy costs. A rate guide is not an
 * illustration, and cost is most of the answer.
 *
 * ## The bands below are not claims about any carrier
 *
 * Each entry carries a low and a high. That pair is **not** a statement that
 * the product's charge falls in that range. It is the range over which we are
 * declining to guess — the width of our own ignorance, stated in dollars so it
 * can be argued with. The `swingPct` figures beside them are measured, not
 * asserted: each is the difference in the thirty-year account value produced by
 * running shared/policyMechanics.ts at the low end and again at the high end,
 * holding everything else fixed.
 *
 * ## The finding that matters most
 *
 * Which gap dominates depends entirely on how funded the design is, and it
 * inverts. On a max-funded policy the premium load is the biggest unknown and
 * mortality barely matters, because the account value climbs into the death
 * benefit and the amount at risk collapses. On a thin protection design it is
 * the reverse, and not by a little:
 *
 *   $50k × 10 into $1.0M face   COI uncertainty moves the 30-year value   5%
 *   $25k × 20 into $1.5M face   COI uncertainty moves the 30-year value  33%
 *   $8k  × 30 into $1.0M face   COI uncertainty moves the 30-year value 131%
 *
 * That last row is $518,548 against $28,484 on the same premium — the range
 * spans "comfortable" and "lapsed". A thin design cannot be projected at all
 * without a real mortality table, and no caveat makes that acceptable. The
 * max-funded designs this practice actually sells are far more forgiving, which
 * is why the platform can run at all today.
 *
 * ## How each gap closes
 *
 * Not by transcription. `shared/illustrationCalibration.ts` reads the charges
 * back out of an illustration ledger: total charges per year, the surrender
 * schedule and the corridor factors all come out exactly, by arithmetic, and
 * the split into load, fixed charge and mortality is fitted with an explicit
 * report of which components the ledger could and could not determine. Upload a
 * ledger and the band collapses on its own.
 */

export type GapStatus =
  /** No document held. The engine runs on a stated band and says so. */
  | 'unpriced'
  /** Recoverable exactly from any illustration ledger, by arithmetic. */
  | 'recoverable-from-ledger'
  /** Fixed by statute, not by the carrier — needs transcription, not a quote. */
  | 'statutory';

export interface UnpricedParameter {
  readonly id: string;
  readonly label: string;
  readonly status: GapStatus;
  /** The range over which we decline to guess. Not a claim about the product. */
  readonly band: { readonly low: number; readonly high: number; readonly unit: string };
  /**
   * Measured swing in the thirty-year account value across that band, by
   * funding design. Produced by running the engine at each end.
   */
  readonly swingPct: {
    readonly maxFunded: number;
    readonly midFunded: number;
    readonly thin: number;
  };
  /** What closes it. Named precisely enough to go and get. */
  readonly closedBy: string;
  /** Why it cannot simply be looked up or reasoned to. */
  readonly whyNotGuessable: string;
}

/**
 * Ordered by what an upload buys, worst case first — the thin-design column,
 * because that is where a wrong answer does real damage.
 */
export const UNPRICED_PARAMETERS: readonly UnpricedParameter[] = [
  {
    id: 'coi-table',
    label: 'Cost of insurance, per $1,000 of net amount at risk by attained age',
    status: 'recoverable-from-ledger',
    band: { low: 0.5, high: 2.0, unit: '× a reference mortality curve' },
    swingPct: { maxFunded: 5.0, midFunded: 33.1, thin: 131.5 },
    closedBy:
      'One illustration ledger on the product, max-funded, showing account value by year. The mortality charge is then fitted against a reference curve and the scale factor comes back with a confidence grade.',
    whyNotGuessable:
      'It is a schedule by age, sex, underwriting class and policy year, published in the contract. Preferred non-smoker to standard smoker is more than a factor of two at the same age, which is most of the band above. No single number represents it and no reasoning produces it.',
  },
  {
    id: 'premium-load',
    label: 'Premium load, by policy year',
    status: 'recoverable-from-ledger',
    band: { low: 0, high: 10, unit: '% of premium' },
    swingPct: { maxFunded: 11.6, midFunded: 15.1, thin: 22.8 },
    closedBy:
      'An illustration ledger with years after the premiums stop. While the premium is level a percentage of it is arithmetically identical to a flat annual fee; the years with no premium are what separate them.',
    whyNotGuessable:
      'It is a contractual percentage that usually steps down after the early years. The step pattern is as consequential as the level and is not inferable from crediting terms.',
  },
  {
    id: 'per-unit-charge',
    label: 'Per-unit charge, per $1,000 of face per month, and its duration',
    status: 'recoverable-from-ledger',
    band: { low: 0.02, high: 0.12, unit: '$ per $1,000 per month' },
    swingPct: { maxFunded: 2.8, midFunded: 7.2, thin: 19.3 },
    closedBy:
      'Two illustrations at different face amounts, same age and class. This one never separates from the policy fee on a single ledger at any funding level, because both are flat dollars per year — only the per-unit charge scales with face.',
    whyNotGuessable:
      'It is the charge that makes a large face amount expensive, and it is the reason two designs with the same premium can behave completely differently. A single illustration cannot isolate it however good the fit looks.',
  },
  {
    id: 'surrender-charges',
    label: 'Surrender charge schedule, by policy year',
    status: 'recoverable-from-ledger',
    band: { low: 0, high: 40, unit: '% of account value in year 1' },
    // It does not move the account value at all — it moves the number a client
    // can actually take, which is a different and often more important column.
    swingPct: { maxFunded: 0, midFunded: 0, thin: 0 },
    closedBy:
      'Any illustration showing the surrender value column beside the account value. The schedule is their printed difference — no fitting at all.',
    whyNotGuessable:
      'It varies by issue age, sex, rating class and state, so it is one schedule per illustrated case rather than one per product. It also matters more than its zero swing above suggests: it does not touch the account value, but it is the number a client can actually withdraw, and any strategy that borrows against surrender value in the early years depends on it entirely.',
  },
  {
    id: 'corridor-factors',
    label: 'IRC 7702 corridor factors, by attained age',
    status: 'statutory',
    band: { low: 1.0, high: 2.5, unit: '× account value' },
    swingPct: { maxFunded: 0, midFunded: 0, thin: 0 },
    closedBy:
      'Transcription from 26 U.S.C. 7702(d)(2). This one is not a carrier quote and does not need an illustration — it is the same table for every company. An illustration ledger with a death benefit column serves as a check on the transcription.',
    whyNotGuessable:
      'Fixed by statute, so it is knowable now and simply has not been transcribed. Where the corridor binds it raises the death benefit above the face amount, which raises the amount at risk and the mortality charge with it — so its effect runs entirely through the cost of insurance rather than showing up on its own.',
  },
  {
    id: 'policy-fee',
    label: 'Monthly policy fee',
    status: 'recoverable-from-ledger',
    band: { low: 5, high: 20, unit: '$ per month' },
    swingPct: { maxFunded: 0.7, midFunded: 1.3, thin: 5.1 },
    closedBy:
      'Two illustrations at different face amounts — the same pair that separates the per-unit charge, since the fee is whatever is left when the per-unit part is removed.',
    whyNotGuessable:
      'Small enough not to matter on a funded design and large enough to matter on a thin one. The band above is the smallest of the six and is listed last for that reason.',
  },
  {
    id: 'loan-terms',
    label: 'Policy loan rates and how loaned values are credited',
    status: 'unpriced',
    band: { low: 0, high: 2, unit: '% net cost of borrowing' },
    swingPct: { maxFunded: 0, midFunded: 0, thin: 0 },
    closedBy:
      'The product guide section on loans: the fixed rate, the variable rate, whether a wash loan is offered and at what spread, and the rate credited to the loaned portion of the account value.',
    whyNotGuessable:
      'Every distribution figure on this platform is a loan. A wash loan and a loan at a 1% net spread produce very different income over thirty years, and no part of the rate guide addresses it. The swing is shown as zero only because this is not an accumulation-phase charge — it is not measurable on the same test.',
  },
  {
    id: 'djia-series',
    label: 'Dow Jones Industrial Average annual returns',
    status: 'unpriced',
    band: { low: 0, high: 0, unit: 'series absent' },
    swingPct: { maxFunded: 0, midFunded: 0, thin: 0 },
    closedBy:
      'A sourced DJIA annual price-return series, excluding dividends, matching the rate guide\'s stated basis.',
    whyNotGuessable:
      'The Multi-Index strategies blend 50% of the best-performing index, 30% of the second and 20% of the third across the S&P 500, Nasdaq-100 and DJIA. We hold the first two. Without the third the blend cannot be computed at all, which is why those strategies are refused rather than approximated.',
  },
  {
    id: 'monthly-average-mechanic',
    label: 'The monthly average crediting mechanic',
    status: 'unpriced',
    band: { low: 0, high: 0, unit: 'method undefined' },
    swingPct: { maxFunded: 0, midFunded: 0, thin: 0 },
    closedBy:
      'The contract language defining which monthly figure is taken and how it is averaged.',
    whyNotGuessable:
      'Averaging strips the peak, which is precisely why the carrier can afford a 25% cap on a monthly-average strategy where a point-to-point strategy gets 13%. Modelling it as annual point-to-point produced 12.93% compound over 1996-2025 against the carrier\'s published 9.32% arithmetic — and an arithmetic average runs higher than a compound one, so the true gap is wider than the 3.6 points it looks.',
  },
];

/** The gaps a single illustration ledger closes, exactly, with no fitting. */
export const CLOSED_BY_ONE_LEDGER: readonly string[] = [
  'Total charges for every policy year',
  'The surrender charge schedule',
  'The corridor factors wherever the corridor binds',
];

/** The gaps that need a second illustration, and why one is not enough. */
export const NEEDS_TWO_ILLUSTRATIONS: readonly string[] = [
  'Splitting the policy fee from the per-unit charge — both are flat dollars per year, and only the per-unit charge scales with face, so it takes two face amounts',
  'Separating the premium load from the fixed charges when the first illustration runs a level premium for its whole term',
];

export function parameterById(id: string): UnpricedParameter | null {
  return UNPRICED_PARAMETERS.find((p) => p.id === id) ?? null;
}

/** Ranked by what closing it is worth on the design given. */
export function rankedFor(design: 'maxFunded' | 'midFunded' | 'thin'): readonly UnpricedParameter[] {
  return [...UNPRICED_PARAMETERS].sort((a, b) => b.swingPct[design] - a.swingPct[design]);
}
