/**
 * Uniform Lifetime Table and RMD start age — the one copy every page uses.
 *
 * Divisors: Treas. Reg. § 1.401(a)(9)-9(c), the table in force for distribution
 * calendar years beginning on or after 1 January 2022 (T.D. 9930, 85 FR 72472,
 * 12 Nov 2020). Replaced the pre-2022 table, whose age-73 divisor was 24.7
 * and whose age-70 divisor was 27.4; under the current table 27.4 is age 72,
 * and age 73 is 26.5.
 *   https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/subject-group-ECFR6f8c3724b50e44d/section-1.401(a)(9)-9
 *   https://www.federalregister.gov/documents/2020/11/12/2020-24723/updated-life-expectancy-and-distribution-period-tables-used-for-purposes-of-determining-minimum
 *   (read 23 Sep 2026)
 *
 * Start age: IRC § 401(a)(9)(C)(v) as amended by SECURE 2.0 (P.L. 117-328,
 * Div. T, § 107): 73 for those born 1951–1959, 75 for those born 1960 or later.
 * Those born before 1951 had already started under the old 70½ / 72 rules.
 *   https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-required-minimum-distributions-rmds
 *   (read 23 Sep 2026)
 */

export const UNIFORM_LIFETIME_TABLE_SOURCES = [
  "Treas. Reg. § 1.401(a)(9)-9(c), Uniform Lifetime Table (T.D. 9930, effective 1 Jan 2022) — https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/subject-group-ECFR6f8c3724b50e44d/section-1.401(a)(9)-9 (read 23 Sep 2026)",
  "SECURE 2.0 Act § 107 (P.L. 117-328): RMDs begin at 73 (born 1951–1959) or 75 (born 1960+) — https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-required-minimum-distributions-rmds (read 23 Sep 2026)",
] as const;

/** Distribution period by age of the account owner, ages 72–120 (120 and older use 2.0). */
export const UNIFORM_LIFETIME_TABLE: Readonly<Record<number, number>> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4,
  88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2,
  104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4,
  112: 3.3, 113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3,
  120: 2.0,
};

/** First-year divisor at 73, the earliest start age under current law. */
export const FIRST_RMD_DIVISOR_AT_73 = UNIFORM_LIFETIME_TABLE[73];

/**
 * Uniform Lifetime Table divisor for an owner's age. Ages below 72 are not in
 * the table (no lifetime RMD is due); they return the age-72 value so callers
 * that divide never divide by zero. Ages above 120 use the age-120 value.
 */
export function uniformLifetimeDivisor(age: number): number {
  const a = Math.floor(age);
  if (a >= 120) return UNIFORM_LIFETIME_TABLE[120];
  if (a <= 72) return UNIFORM_LIFETIME_TABLE[72];
  return UNIFORM_LIFETIME_TABLE[a];
}

/** Age at which RMDs begin for someone born in `birthYear` (SECURE 2.0 § 107). */
export function rmdStartAge(birthYear: number): number {
  if (birthYear >= 1960) return 75;
  if (birthYear >= 1951) return 73;
  // Born before 1951: already in RMD status under the prior rules — 72 for those
  // born 1 Jul 1949 – 1950 (SECURE Act 2019), 70½ before that. Without a birth
  // month, 1949 is treated as 70½.
  return birthYear >= 1950 ? 72 : 70.5;
}

/** RMD start age for someone who is `age` in `year` (birth year taken as year − age). */
export function rmdStartAgeForAge(age: number, year: number = new Date().getFullYear()): number {
  return rmdStartAge(year - Math.floor(age));
}

/** Required minimum distribution for the year: prior year-end balance ÷ divisor, or 0 before the start age. */
export function requiredMinimumDistribution(age: number, priorYearEndBalance: number, startAge = 73): number {
  if (age < startAge || priorYearEndBalance <= 0) return 0;
  return priorYearEndBalance / uniformLifetimeDivisor(age);
}
