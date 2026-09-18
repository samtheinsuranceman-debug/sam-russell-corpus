// ============================================================
// THE LONGEVITY ENGINE — how long one person, and a couple, are likely to
// live, from the Social Security Administration's 2023 period life table
// (the one the 2026 Trustees Report uses), read from ssa.gov on
// 7 September 2026. Survival to an age is the product of one-year survival
// probabilities; a couple's "at least one alive" is one minus the product
// of their deaths. Every number is arithmetic on that table; the page names
// the other tables an actuary would also read.
// ============================================================

export type Sex = "male" | "female";

/** One-year death probability q(x) by exact age, SSA period life table 2023 (2026 TR), ages 50–119. */
const Q_MALE: number[] = [
  0.005126, 0.005496, 0.005917, 0.006404, 0.006923, 0.007491, 0.008173, 0.008938, 0.009714, 0.010494, // 50–59
  0.011337, 0.012232, 0.013196, 0.014229, 0.015316, 0.016455, 0.017574, 0.018735, 0.019981, 0.021366, // 60–69
  0.022903, 0.024615, 0.026504, 0.028648, 0.031071, 0.033802, 0.037010, 0.041158, 0.045461, 0.050346, // 70–79
  0.055633, 0.061757, 0.068358, 0.075420, 0.083364, 0.092680, 0.103459, 0.115502, 0.129018, 0.143810, // 80–89
  0.159458, 0.176551, 0.195360, 0.216286, 0.238799, 0.262268, 0.286291, 0.310944, 0.332325, 0.349036, // 90–99
  0.366568, 0.384960, 0.404252, 0.424488, 0.445712, 0.467998, 0.491398, 0.515968, 0.541766, 0.568854, // 100–109
  0.597297, 0.627162, 0.658520, 0.691446, 0.726018, 0.762319, 0.800435, 0.840457, 0.882480, 0.926604, // 110–119
];
const Q_FEMALE: number[] = [
  0.003030, 0.003288, 0.003554, 0.003847, 0.004172, 0.004532, 0.004923, 0.005365, 0.005815, 0.006333, // 50–59
  0.006923, 0.007555, 0.008220, 0.008881, 0.009514, 0.010188, 0.010880, 0.011659, 0.012543, 0.013581, // 60–69
  0.014769, 0.016153, 0.017705, 0.019495, 0.021533, 0.023846, 0.026458, 0.029700, 0.033135, 0.036982, // 70–79
  0.041183, 0.045959, 0.051282, 0.057262, 0.064107, 0.071752, 0.080490, 0.090566, 0.102204, 0.115178, // 80–89
  0.129176, 0.144229, 0.160353, 0.177635, 0.196502, 0.216846, 0.238750, 0.261359, 0.283899, 0.306491, // 90–99
  0.329680, 0.353333, 0.377300, 0.401416, 0.425501, 0.451031, 0.478092, 0.506778, 0.537185, 0.568854, // 100–109
  0.597297, 0.627162, 0.658520, 0.691446, 0.726018, 0.762319, 0.800435, 0.840457, 0.882480, 0.926604, // 110–119
];
export const TABLE_FIRST_AGE = 50, TABLE_LAST_AGE = 119;
export const LIFE_TABLE_SOURCE = { label: "Social Security Administration, Period Life Table 2023, as used in the 2026 Trustees Report (ssa.gov/oact/STATS/table4c6.html)", url: "https://www.ssa.gov/oact/STATS/table4c6.html", asOf: "2023 table, read 2026-09-07" };

export function q(sex: Sex, age: number): number {
  if (age >= TABLE_LAST_AGE) return 1;
  const i = Math.max(0, Math.floor(age) - TABLE_FIRST_AGE);
  return (sex === "male" ? Q_MALE : Q_FEMALE)[Math.min(i, Q_MALE.length - 1)]!;
}

/** Probability a person of `fromAge` is alive at exact age `toAge`. */
export function survivalTo(sex: Sex, fromAge: number, toAge: number): number {
  if (toAge <= fromAge) return 1;
  let p = 1;
  for (let a = Math.floor(fromAge); a < toAge; a++) p *= 1 - q(sex, a);
  return p;
}

/** Curtate expected remaining years: the sum of survival probabilities to each later age. */
export function expectedRemainingYears(sex: Sex, age: number): number {
  let e = 0;
  for (let a = Math.floor(age) + 1; a <= TABLE_LAST_AGE; a++) e += survivalTo(sex, age, a);
  return e;
}

export type Person = { age: number; sex: Sex };
export type JointPoint = { age: number; yearsFromNow: number; first: number; second: number | null; either: number | null; both: number | null };

/** For a person, or a couple, the chance of being alive at each milestone age (first person's age scale), with "either" and "both" for the couple. */
export function survivalTable(first: Person, second: Person | null, milestones: number[] = [80, 85, 90, 95, 100]): JointPoint[] {
  return milestones.filter((m) => m > first.age).map((m) => {
    const years = m - first.age;
    const p1 = survivalTo(first.sex, first.age, m);
    if (!second) return { age: m, yearsFromNow: years, first: p1, second: null, either: null, both: null };
    const p2 = survivalTo(second.sex, second.age, second.age + years);
    return { age: m, yearsFromNow: years, first: p1, second: p2, either: 1 - (1 - p1) * (1 - p2), both: p1 * p2 };
  });
}

/** Expected number of years at least one of the two is alive, from now. */
export function expectedYearsEitherAlive(first: Person, second: Person | null): number {
  let e = 0;
  for (let t = 1; t <= TABLE_LAST_AGE - first.age; t++) {
    const p1 = survivalTo(first.sex, first.age, first.age + t);
    const p2 = second ? survivalTo(second.sex, second.age, second.age + t) : 0;
    e += 1 - (1 - p1) * (1 - p2);
  }
  return e;
}

/** Expected total of a level payment made every year while at least one of the two is alive (no discounting: the record's dollars). */
export function expectedLifetimePayments(annual: number, first: Person, second: Person | null): { expectedTotal: number; expectedYears: number } {
  const years = expectedYearsEitherAlive(first, second);
  return { expectedTotal: annual * years, expectedYears: years };
}

/** The tables an actuary would also read before pricing a life; the first two were read for this engine, the rest are named for the client to open. */
export const LONGEVITY_SOURCES = [
  LIFE_TABLE_SOURCE,
  { label: "Actuaries Longevity Illustrator (American Academy of Actuaries and Society of Actuaries Research Institute): probabilities of living to each age for one person or a couple, adjusted for health and smoking", url: "https://www.longevityillustrator.org/", asOf: "read 2026-09-07" },
  { label: "CDC/NCHS, United States Life Tables, 2021 (NVSR 72-12) and U.S. State Life Tables, 2020 (NVSR 71-2)", url: "https://www.cdc.gov/nchs/products/life_tables.htm", asOf: "index read 2026-09-07" },
  { label: "LongTermCare.gov (ACL): how much care people need at 65 (70%; women 3.7 years, men 2.2)", url: "https://acl.gov/ltc/basic-needs/how-much-care-will-you-need", asOf: "read 2026-09-07" },
  { label: "The carrier's own mortality basis (the annuity 2012 IAM table or its successor) as printed in the contract's illustration; typed from the illustration, not assumed", url: "", asOf: "" },
];
