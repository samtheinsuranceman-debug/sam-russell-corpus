// ============================================================
// EARLY CASH VALUE — does the Surrender Value Enhancement Rider help a loan plan?
//
// ## The short answer, and it is not the intuitive one
//
// No. Not for a distribution strategy. The rider buys walk-away value, and a
// loan plan never walks away.
//
// ## Why, in the carrier's own words
//
// Nationwide Indexed UL Accumulator II 2020 illustrations that carry the
// Surrender Value Enhancement Rider (Form# ICC21-NWLA-613, elected at 100%
// Surrender Charge Waiver / 100% Account Value Multiple) print TWO surrender
// charge schedules and say exactly which applies where:
//
//   "The 'Unadjusted' Surrender Charge schedule applies in determining the
//    amounts available for partial surrenders, policy loans, determining when
//    the policy Lapses, or a full surrender that is an exchange under section
//    1035 of the Internal Revenue Code.
//
//    The 'Adjusted' Surrender Charge schedule applies to a full surrender of
//    the policy that is not an exchange under section 1035."
//
// On the illustration this data came from, the two schedules are:
//
//     Policy year      Unadjusted        Adjusted
//         1–3          $50,991.13          $0.00
//          4           $44,617.24          $0.00
//          5           $38,243.35          $0.00
//          …            declining          $0.00
//         11             $0.00             $0.00
//
// So the rider zeroes the charge on a full surrender from day one — and leaves
// the charge that governs LOANS AND PARTIAL SURRENDERS completely untouched.
//
// ## What that means for the plan on this platform
//
// The strategy this platform models takes money out by policy loan, beginning
// at month 16. Every one of those distributions is tested against the
// UNADJUSTED schedule. The rider changes none of them. It charges a monthly
// fee for years, against a benefit the strategy never touches.
//
// The rider is genuinely valuable — for a different buyer. Executive bonus
// arrangements where the employee may leave, buy-sell funding that may need
// unwinding, any case where "what if we have to cancel this in year three"
// is a real question. That buyer should pay for it. A physician funding a
// policy to borrow against for thirty years should not.
//
// ## Why this file refuses to be vague about it
//
// This is the single most expensive misunderstanding available in this design:
// a rider elected at issue, IRREVOCABLE by its own terms, paid for monthly,
// bought for a benefit the buyer's actual plan never uses. The engine takes
// the distribution type as an input and picks the schedule the carrier says
// governs it. It cannot quietly apply the flattering one.
// ============================================================

/** How money comes out. The carrier applies a different schedule to each. */
export type DistributionType =
  /** Policy loan. UNADJUSTED schedule. The rider does not help. */
  | "loan"
  /** Partial surrender / withdrawal. UNADJUSTED schedule. The rider does not help. */
  | "partial"
  /** Full surrender, not a 1035. ADJUSTED schedule. This is what the rider buys. */
  | "full_surrender"
  /** Full surrender that IS a 1035 exchange. UNADJUSTED — the carve-out matters. */
  | "exchange_1035";

/**
 * Which schedule governs. Straight from the carrier's narrative summary.
 *
 * The 1035 case is the one people get wrong: exchanging out is a full surrender
 * in ordinary language, but the illustration puts it on the unadjusted side.
 */
export function scheduleFor(d: DistributionType): "unadjusted" | "adjusted" {
  return d === "full_surrender" ? "adjusted" : "unadjusted";
}

/** True when the Surrender Value Enhancement Rider changes this outcome at all. */
export function riderHelps(d: DistributionType): boolean {
  return scheduleFor(d) === "adjusted";
}

export interface SurrenderSchedule {
  /** Charge by policy year, index 0 = year 1. */
  readonly byYear: readonly number[];
  readonly source: string;
  readonly asOf: string;
}

/**
 * The unadjusted schedule, transcribed from the illustration.
 *
 * Flat for three years, then straight-line down to zero at year 11. Carried as
 * data rather than a formula because the formula is the carrier's, not ours,
 * and a fitted curve that happened to match these eleven points would be an
 * invention that looked like a fact.
 */
export const UNADJUSTED_EXAMPLE: SurrenderSchedule = {
  byYear: [50991.13, 50991.13, 50991.13, 44617.24, 38243.35, 31869.46, 25495.57, 19121.67, 12747.78, 6373.89, 0],
  source: "Nationwide Indexed UL Accumulator II 2020 illustration, Form ICC18-NWLA-538, prepared 29 Jan 2026, Table of Surrender Charges",
  asOf: "2026-01-29",
};

/** With the rider at 100% Surrender Charge Waiver, the adjusted schedule is zero throughout. */
export const ADJUSTED_WITH_RIDER: SurrenderSchedule = {
  byYear: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  source: "Nationwide Indexed UL Accumulator II 2020 illustration, Form ICC18-NWLA-538, prepared 29 Jan 2026, Table of Surrender Charges, Adjusted column — Surrender Value Enhancement Rider Form ICC21-NWLA-613 at 100% waiver / 100% account value multiple",
  asOf: "2026-01-29",
};

export function chargeAtYear(s: SurrenderSchedule, policyYear: number): number {
  if (policyYear < 1) return s.byYear[0] ?? 0;
  return s.byYear[Math.min(policyYear - 1, s.byYear.length - 1)] ?? 0;
}

export interface EcvInput {
  annualPremium: number;
  years: number;
  /** Crediting assumption, percent. */
  creditedRate: number;
  /** Percent of premium taken as load before anything is credited. */
  premiumLoadPct: number;
  /** First distribution, in months from issue. 16 = policy year 2, month 4. */
  firstDistributionMonth: number;
  /** Annual distribution once they begin. */
  annualDistribution: number;
  distributionType: DistributionType;
  /**
   * Annual cost of the rider as a percent of account value.
   *
   * UNVERIFIED. The illustration says only that the charge "varies by the
   * surrender charge waiver and account value multiple percentages elected"
   * and does not print a rate. 0.35% is a placeholder for shape, not a figure
   * to quote, and `riderCostVerified` stays false until someone reads the real
   * number off the cost-of-insurance pages.
   */
  riderAnnualCostPct: number;
}

export interface EcvYear {
  policyYear: number;
  premiumPaid: number;
  accountValue: number;
  riderCharge: number;
  surrenderCharge: number;
  /** Account value less the charge that governs THIS distribution type. */
  accessibleValue: number;
  distributionTaken: number;
}

export interface EcvComparison {
  withRider: EcvYear[];
  withoutRider: EcvYear[];
  /** Accessible-value difference, rider minus no-rider, by policy year. */
  accessibleDelta: number[];
  /** First policy year the rider is ahead on accessible value, or null. */
  crossoverYear: number | null;
  /** Total rider charges paid over the horizon. */
  totalRiderCost: number;
  /** Account value given up at the end by paying for the rider. */
  endingValueGivenUp: number;
  riderHelpsThisPlan: boolean;
  verdict: string;
  riderCostVerified: boolean;
}

export function getDefaultEcvInput(): EcvInput {
  return {
    annualPremium: 150000,
    years: 30,
    creditedRate: 9.32,          // best Nationwide option with real 30-year history
    premiumLoadPct: 6,
    firstDistributionMonth: 16,
    annualDistribution: 60000,
    distributionType: "loan",
    riderAnnualCostPct: 0.35,
  };
}

function project(input: EcvInput, withRider: boolean): EcvYear[] {
  const rows: EcvYear[] = [];
  const startYear = Math.max(1, Math.ceil(input.firstDistributionMonth / 12));
  let av = 0;
  // The rider is on the account-value side either way: it is a monthly charge
  // whether or not the buyer ever uses what it bought.
  const sched = withRider && scheduleFor(input.distributionType) === "adjusted"
    ? ADJUSTED_WITH_RIDER : UNADJUSTED_EXAMPLE;

  for (let y = 1; y <= input.years; y++) {
    const prem = input.annualPremium;
    av += prem * (1 - input.premiumLoadPct / 100);
    const riderCharge = withRider ? av * (input.riderAnnualCostPct / 100) : 0;
    av -= riderCharge;
    av *= 1 + input.creditedRate / 100;
    const dist = y >= startYear ? Math.min(input.annualDistribution, Math.max(0, av)) : 0;
    av -= dist;
    const sc = chargeAtYear(sched, y);
    rows.push({
      policyYear: y, premiumPaid: prem, accountValue: av,
      riderCharge, surrenderCharge: sc,
      accessibleValue: Math.max(0, av - sc),
      distributionTaken: dist,
    });
  }
  return rows;
}

export function compareEarlyCashValue(input: EcvInput): EcvComparison {
  const withRider = project(input, true);
  const withoutRider = project(input, false);
  const accessibleDelta = withRider.map((r, i) => r.accessibleValue - withoutRider[i].accessibleValue);
  const idx = accessibleDelta.findIndex((d) => d > 0);
  const totalRiderCost = withRider.reduce((a, r) => a + r.riderCharge, 0);
  const endingValueGivenUp =
    withoutRider[withoutRider.length - 1].accountValue - withRider[withRider.length - 1].accountValue;
  const helps = riderHelps(input.distributionType);

  const verdict = helps
    ? `This plan takes money out by ${input.distributionType === "full_surrender" ? "full surrender" : input.distributionType}, which the carrier puts on the ADJUSTED schedule. The rider zeroes that charge, so it does what it was bought for. Weigh its cost against the charge it removes.`
    : `This plan takes money out by ${input.distributionType === "exchange_1035" ? "1035 exchange" : input.distributionType}, and the carrier puts that on the UNADJUSTED schedule — the same schedule with or without the rider. ` +
      `The rider changes no distribution in this plan. It costs $${Math.round(totalRiderCost).toLocaleString()} over ${input.years} years and leaves $${Math.round(endingValueGivenUp).toLocaleString()} less account value at the end, in exchange for a full-surrender benefit this plan never uses. ` +
      `It must be elected at issue and cannot be revoked, so this is decided once.`;

  return {
    withRider, withoutRider, accessibleDelta,
    crossoverYear: idx === -1 ? null : idx + 1,
    totalRiderCost, endingValueGivenUp,
    riderHelpsThisPlan: helps,
    verdict,
    riderCostVerified: false,
  };
}

export const ECV_DISCLOSURE =
  "Surrender charge figures are transcribed from a Nationwide Indexed UL Accumulator II 2020 illustration " +
  "(Form ICC18-NWLA-538, prepared 29 January 2026) and are specific to that policy's face amount and insured. " +
  "The rider's own monthly cost is not printed on that illustration and the rate used here is a placeholder " +
  "for shape only — confirm it on the cost pages before quoting any figure that depends on it.";
