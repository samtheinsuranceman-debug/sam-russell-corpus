// ============================================================
// THE 2026 RETIREMENT LIMITS — sourced, dated, and not typed from memory.
//
// Every figure here is quoted from IRS Notice 2025-67 (13 November 2025),
// "2026 Amounts Relating to Retirement Plans and IRAs, as Adjusted for Changes
// in Cost-of-Living", announced in IR-2025-111. Where the notice gives both
// the new and the prior amount, both are kept, because the change is often the
// thing worth pointing at.
//
// These feed the cash balance, backdoor Roth, and contribution pages. They are
// deliberately in one file: a limit that appears in three calculators must be
// one number, or the three will eventually disagree and nobody will notice.
//
// WHEN THIS GOES STALE. `taxYear` is 2026. The IRS publishes the following
// year's notice each November. `isStale(new Date())` returns true once the
// calendar has moved past the year these cover, so a page can say "these are
// last year's figures" instead of quietly using them.
// ============================================================

export const LIMITS_SOURCE = {
  taxYear: 2026,
  notice: "IRS Notice 2025-67 (13 November 2025)",
  release: "IR-2025-111",
  url: "https://www.irs.gov/pub/irs-drop/n-25-67.pdf",
  effective: "1 January 2026",
} as const;

export type Limit = {
  id: string;
  /** The Code section the notice cites for this amount. */
  code: string;
  label: string;
  amount: number;
  /** The 2025 amount, where Notice 2025-67 states it. null where it does not. */
  prior: number | null;
  /** What it actually governs, in the client's language. */
  what: string;
};

export const RETIREMENT_LIMITS_2026: readonly Limit[] = [
  { id: "db-annual-benefit", code: "§ 415(b)(1)(A)", label: "Defined benefit annual benefit limit",
    amount: 290_000, prior: 280_000,
    what: "The largest annual benefit a defined benefit or cash balance plan may promise. This is the ceiling that makes a cash balance plan the biggest shelter available to a high earner in their fifties." },
  { id: "dc-annual-additions", code: "§ 415(c)(1)(A)", label: "Defined contribution annual additions limit",
    amount: 72_000, prior: 70_000,
    what: "Everything that can go into a defined contribution account for one person in one year — deferrals, match, profit sharing and after-tax together." },
  { id: "elective-deferral", code: "§ 402(g)(1)", label: "401(k) / 403(b) / 457(b) elective deferral",
    amount: 24_500, prior: 23_500,
    what: "What you may defer from your own pay into a workplace plan." },
  { id: "govt-457-deferral", code: "§ 457(e)(15)", label: "Governmental 457(b) deferral",
    amount: 24_500, prior: 23_500,
    what: "The same figure for a state, local government or tax-exempt employer's 457(b)." },
  { id: "catchup-50", code: "§ 414(v)(2)(B)(i)", label: "Catch-up, age 50 and over",
    amount: 8_000, prior: 7_500,
    what: "Extra deferral once you reach 50, on top of the ordinary limit." },
  { id: "catchup-60-63", code: "§ 414(v)(2)(E)(i)", label: "Catch-up, age 60 to 63",
    amount: 11_250, prior: 11_250,
    what: "The enhanced SECURE 2.0 catch-up for those who reach 60, 61, 62 or 63 during the year. Unchanged for 2026 — and it is a four-year window, not a permanent step up." },
  { id: "ira", code: "IRA contribution", label: "IRA contribution limit",
    amount: 7_500, prior: 7_000,
    what: "What may go into a traditional or Roth IRA for the year, across both combined." },
  { id: "ira-catchup", code: "IRA catch-up (SECURE 2.0)", label: "IRA catch-up, age 50 and over",
    amount: 1_100, prior: 1_000,
    what: "Extra IRA contribution once you reach 50. Now cost-of-living adjusted, which it was not before SECURE 2.0." },
] as const;

/**
 * The traditional IRA deduction phase-out for a single filer covered by a
 * workplace plan, from IR-2025-111. This is the number that sends a high
 * earner to the back door: above the top of this range, a traditional IRA
 * contribution is not deductible, which is the whole premise of the
 * non-deductible-then-convert route.
 */
export const IRA_DEDUCTION_PHASEOUT_2026 = {
  singleCoveredByPlan: { start: 81_000, end: 91_000, prior: { start: 79_000, end: 89_000 } },
} as const;

export function limit(id: string): Limit | undefined {
  return RETIREMENT_LIMITS_2026.find((l) => l.id === id);
}

export function amount(id: string): number {
  const l = limit(id);
  if (!l) throw new Error(`Unknown retirement limit "${id}" — add it from the IRS notice rather than inlining a number.`);
  return l.amount;
}

/** Which limits actually moved this year. The most useful thing to show an owner in January. */
export function changedThisYear(): Limit[] {
  return RETIREMENT_LIMITS_2026.filter((l) => l.prior != null && l.prior !== l.amount);
}

/** True once the calendar has passed the year these figures cover. */
export function isStale(now: Date = new Date()): boolean {
  return now.getUTCFullYear() > LIMITS_SOURCE.taxYear;
}

export function staleNote(now: Date = new Date()): string | null {
  if (!isStale(now)) return null;
  return `These are the ${LIMITS_SOURCE.taxYear} limits from ${LIMITS_SOURCE.notice}. It is now ${now.getUTCFullYear()}; the IRS publishes each year's notice in November, and this file has not been updated since.`;
}

/**
 * The most a single person can have put into defined contribution accounts,
 * given their age. Catch-ups sit OUTSIDE the § 415(c) annual additions limit
 * — 26 CFR 1.415(c)-1(b)(2)(i)(B): "A catch-up contribution made in accordance
 * with section 414(v) ... does not give rise to an annual addition."
 */
export function maxDefinedContribution(age: number): { base: number; catchUp: number; total: number; which: string } {
  const base = amount("dc-annual-additions");
  if (age >= 60 && age <= 63) {
    const catchUp = amount("catchup-60-63");
    return { base, catchUp, total: base + catchUp, which: "§ 414(v)(2)(E)(i), ages 60 to 63" };
  }
  if (age >= 50) {
    const catchUp = amount("catchup-50");
    return { base, catchUp, total: base + catchUp, which: "§ 414(v)(2)(B)(i), age 50 and over" };
  }
  return { base, catchUp: 0, total: base, which: "no catch-up below 50" };
}
