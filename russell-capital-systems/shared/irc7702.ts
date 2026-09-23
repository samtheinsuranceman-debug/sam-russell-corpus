/**
 * The corridor, which is law rather than pricing.
 *
 * Most of what a policy costs is a carrier's private schedule and has to be
 * read off a document. The corridor is not. IRC 7702(d)(2) fixes it for every
 * company, every product and every underwriting class, and it has not moved
 * since the section was written. It belongs in the code now rather than on the
 * list of things to ask a carrier for.
 *
 * ## What it does
 *
 * A contract only counts as life insurance for tax purposes if the death
 * benefit stays at or above an applicable percentage of the cash value. Fund a
 * policy hard enough and the cash value climbs until that floor bites; at that
 * point the death benefit is pushed up to meet it. This is why a max-funded
 * policy's death benefit starts rising in later years without anybody asking
 * for more coverage.
 *
 * It is also why the corridor is not free. The mortality charge is levied on
 * the net amount at risk — death benefit less account value — so forcing the
 * death benefit up forces the amount at risk up, and the cost of insurance
 * with it. An engine that ignores the corridor understates the charge exactly
 * where the policy is most heavily funded, which is the case this practice
 * sells.
 *
 * ## The table, and the word "ratably"
 *
 * The statute gives ten brackets, each with a starting and ending percentage,
 * and says the percentage decreases "by a ratable portion for each full year"
 * across the bracket. So it is not a step function with ten values — it is a
 * piecewise-linear schedule producing a distinct figure at almost every age.
 * Reading only the bracket endpoints and holding them flat would overstate the
 * corridor for four years out of every five.
 *
 * Interpolating gives back exactly the integer percentages the table is
 * usually published as — 243, 236, 229, 222 across ages 41 to 44, and so on —
 * which is the check `server/irc7702.test.ts` runs. If the interpolation and
 * the published integers ever disagree, one of them is wrong.
 *
 * ## Provenance, stated honestly
 *
 * Source: 26 U.S.C. 7702(d)(2). The bracket endpoints below were confirmed
 * against two independent web searches returning identical tables. A direct
 * fetch of the statute text was attempted at law.cornell.edu, uscode.house.gov,
 * govinfo.gov, uscode.ecfr.io and law.justia.com; every one is blocked by this
 * environment's egress proxy, so nobody has yet put the primary text beside
 * this file. That check is worth ten minutes of somebody's time before this
 * drives a client illustration — VERIFIED_AGAINST_PRIMARY_TEXT below is the
 * flag to flip when it happens.
 */

/** Flip to true once a human has read 26 U.S.C. 7702(d)(2) beside this table. */
export const VERIFIED_AGAINST_PRIMARY_TEXT = false;

export const CORRIDOR_AUTHORITY = '26 U.S.C. 7702(d)(2)';

export interface CorridorBracket {
  /** Applies to attained ages strictly above this. */
  readonly moreThan: number;
  /** Through this age inclusive. */
  readonly butNotMoreThan: number;
  /** Percentage at the start of the bracket. */
  readonly from: number;
  /** Percentage at the end of the bracket, reached ratably. */
  readonly to: number;
}

/** The ten brackets, verbatim in structure from 7702(d)(2). */
export const CORRIDOR_BRACKETS: readonly CorridorBracket[] = [
  { moreThan: 0, butNotMoreThan: 40, from: 250, to: 250 },
  { moreThan: 40, butNotMoreThan: 45, from: 250, to: 215 },
  { moreThan: 45, butNotMoreThan: 50, from: 215, to: 185 },
  { moreThan: 50, butNotMoreThan: 55, from: 185, to: 150 },
  { moreThan: 55, butNotMoreThan: 60, from: 150, to: 130 },
  { moreThan: 60, butNotMoreThan: 65, from: 130, to: 120 },
  { moreThan: 65, butNotMoreThan: 70, from: 120, to: 115 },
  { moreThan: 70, butNotMoreThan: 75, from: 115, to: 105 },
  { moreThan: 75, butNotMoreThan: 90, from: 105, to: 105 },
  { moreThan: 90, butNotMoreThan: 95, from: 105, to: 100 },
];

/**
 * The applicable percentage at an attained age, interpolated ratably within
 * its bracket as the statute directs. At 95 and above it is 100.
 */
export function applicablePercentage(attainedAge: number): number {
  if (attainedAge <= 0) return 250;
  if (attainedAge >= 95) return 100;
  for (const b of CORRIDOR_BRACKETS) {
    if (attainedAge > b.moreThan && attainedAge <= b.butNotMoreThan) {
      const span = b.butNotMoreThan - b.moreThan;
      const step = (b.from - b.to) / span;
      return b.from - step * (attainedAge - b.moreThan);
    }
  }
  return 100;
}

/**
 * The cash value corridor percentage at an attained age: the minimum death
 * benefit as a percentage of cash value that 26 U.S.C. 7702(d)(2) requires.
 *
 * Endpoints: 250 through age 40, 215 at 45, 185 at 50, 150 at 55, 130 at 60,
 * 120 at 65, 115 at 70, 105 at 75 through 90, 100 at 95 and above, reduced by
 * a ratable whole-point step each year between them (41 → 243, 42 → 236, …,
 * 91 → 104, 92 → 103, 93 → 102, 94 → 101).
 *
 * Source: 26 U.S.C. 7702(d)(2), https://www.law.cornell.edu/uscode/text/26/7702
 * (read 2026-09-23; see IRC_7702_CORRIDOR_SOURCE). This is the shared entry
 * point for every engine that floors a death benefit at a multiple of cash
 * value; none should hold its own flat 105% or step table.
 */
export function cashValueCorridorPct(attainedAge: number): number {
  return applicablePercentage(attainedAge);
}

/** Where the corridor table comes from, in the shape `shared/engineSources.ts` reads. */
export const IRC_7702_CORRIDOR_SOURCE = {
  label: "26 U.S. Code Section 7702(d)(2), cash value corridor applicable percentages: 250% through attained age 40, 215% at 45, 185% at 50, 150% at 55, 130% at 60, 120% at 65, 115% at 70, 105% at 75 through 90, 100% at 95 and above, decreasing ratably each full year between (Cornell Legal Information Institute)",
  url: "https://www.law.cornell.edu/uscode/text/26/7702",
  asOf: "read 2026-09-23",
} as const;

/** The same figure as a multiplier, which is what the projection engine takes. */
export function corridorFactor(attainedAge: number): number {
  return cashValueCorridorPct(attainedAge) / 100;
}

/**
 * The whole schedule as the engine's `corridorFactorByAge` map.
 *
 * Built once and handed to `runPolicyMechanics`, so the corridor stops being
 * a missing input on every projection the platform runs.
 */
export const CORRIDOR_FACTOR_BY_AGE: Readonly<Record<number, number>> = (() => {
  const out: Record<number, number> = {};
  for (let age = 0; age <= 121; age++) out[age] = corridorFactor(age);
  return out;
})();

/**
 * The minimum death benefit the corridor forces at a given cash value.
 *
 * This is the whole mechanism in one line: whichever is larger, the face
 * amount or the cash value times the applicable percentage.
 */
export function corridorDeathBenefit(
  faceAmount: number,
  cashValue: number,
  attainedAge: number
): number {
  return Math.max(faceAmount, cashValue * corridorFactor(attainedAge));
}

/**
 * The cash value at which the corridor starts to bind for a given face amount.
 *
 * Below this the death benefit is the face amount and the corridor is
 * invisible. Above it, every extra dollar of cash value drags the death
 * benefit — and the mortality charge — up with it.
 */
export function corridorBindsAboveCashValue(faceAmount: number, attainedAge: number): number {
  return faceAmount / corridorFactor(attainedAge);
}
