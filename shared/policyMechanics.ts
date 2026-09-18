/**
 * How a premium becomes cash value. One path, so every tool agrees.
 *
 * Before this, the charge sequence lived inline in whichever engine needed it
 * and the three copies disagreed. policyLoanOptimizer.ts used five crude age
 * bands for cost of insurance, from 0.0012 to 0.0220. iulCarriers.ts carried a
 * single flat coiRate per carrier ranging 0.008 to 0.05 — a sixfold spread
 * between carriers that no mortality table supports. carrierRecommendation.ts
 * had a third. A policy value is the accumulation of twelve small deductions a
 * year over forty years; three different opinions about those deductions is
 * three different answers to the only question the client asked.
 *
 * ## The order is not decorative
 *
 * Charges come out in a fixed sequence and the sequence changes the answer:
 *
 *   1. Premium arrives, less the premium load
 *   2. The monthly policy fee is deducted
 *   3. The per-unit charge is deducted (per $1,000 of face, early years)
 *   4. Cost of insurance is deducted on the NET AMOUNT AT RISK
 *   5. Interest or index credit is applied to what is left
 *
 * Cost of insurance is charged on the net amount at risk — the death benefit
 * less the account value — not on the face amount. As cash value grows the
 * amount at risk shrinks and the charge falls, which is most of why a
 * well-funded policy behaves so differently from a thin one. Charging on face
 * overstates the cost by a wide margin in later years; crediting before
 * deducting understates it.
 *
 * ## Nothing here is invented
 *
 * Cost of insurance is a table by age, sex and underwriting class, published
 * in the policy. It is an input. So are the loads, the fee, the per-unit
 * charge, the surrender schedule and the corridor factors. Where a table is
 * missing the result says so and marks itself unreliable rather than
 * substituting a plausible number — a projection built on an invented COI
 * curve is wrong in a way nobody can see by looking at it.
 */

import { CORRIDOR_FACTOR_BY_AGE, VERIFIED_AGAINST_PRIMARY_TEXT } from './irc7702';

export interface CoiRate {
  /** Attained age this rate applies from. */
  readonly age: number;
  /** Annual cost per $1,000 of net amount at risk. */
  readonly perThousand: number;
}

export interface PolicyCharges {
  /** Premium load by policy year, as a percentage. Last value repeats. */
  readonly premiumLoadPctByYear: readonly number[];
  /** Flat policy fee per month. */
  readonly monthlyPolicyFee: number;
  /** Per $1,000 of face, per month. */
  readonly perUnitMonthlyPerThousand: number;
  /** Policy years the per-unit charge applies for. */
  readonly perUnitYears: number;
  /** Cost of insurance table, ascending by age. Empty means none supplied. */
  readonly coiTable: readonly CoiRate[];
  /**
   * Where the cost of insurance table came from — the document and its date.
   * The literal string 'illustrative' marks ILLUSTRATIVE_COI_TABLE below, which
   * is not any carrier's schedule; the result then reports itself unreliable.
   */
  readonly coiTableSource?: string;
  /** Surrender charge by policy year, as a percentage of account value. */
  readonly surrenderChargePctByYear: readonly number[];
  /**
   * Surrender charge in DOLLARS per $1,000 of specified amount, by policy year.
   *
   * This is how a real product states it, and the engine prefers it when both
   * are present. A cost summary showed the same schedule reading 38.97%,
   * 19.40%, 13.64% ... of account value while being a flat $37.68 per $1,000
   * for three years — as a percentage it is not a property of the product at
   * all, only of how fast that policy happened to accumulate.
   */
  readonly surrenderChargePerThousandByYear?: readonly number[];
  /**
   * Persistency or asset credit added to the account value annually from a
   * given year, as a percentage. Several designs carry one.
   */
  readonly persistencyCreditPct?: number;
  readonly persistencyCreditFromYear?: number;
}

export interface PolicyMechanicsInput {
  readonly issueAge: number;
  readonly faceAmount: number;
  readonly annualPremium: number;
  readonly premiumYears: number;
  readonly years: number;
  readonly charges: PolicyCharges;
  /** Credited rate per policy year, as a percentage. */
  readonly creditedRatePctByYear: readonly number[];
  /**
   * Minimum ratio of death benefit to account value, by attained age — the
   * IRC section 7702 corridor.
   *
   * Omitted, the statutory schedule from shared/irc7702.ts is used, because
   * 7702(d)(2) is the same for every carrier and every product and there is no
   * honest reason to run without it. Pass an empty object to model a contract
   * with no corridor at all.
   */
  readonly corridorFactorByAge?: Readonly<Record<number, number>>;
}

export interface PolicyYear {
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly premium: number;
  readonly premiumLoad: number;
  readonly policyFee: number;
  readonly perUnitCharge: number;
  readonly netAmountAtRisk: number;
  readonly costOfInsurance: number;
  readonly interestCredited: number;
  readonly persistencyCredit: number;
  readonly accountValue: number;
  readonly surrenderValue: number;
  readonly deathBenefit: number;
}

export interface PolicyMechanicsResult {
  readonly years: readonly PolicyYear[];
  readonly summary: {
    readonly totalPremiums: number;
    readonly totalCharges: number;
    readonly totalInterest: number;
    readonly finalAccountValue: number;
    readonly finalSurrenderValue: number;
    readonly lapseYear: number | null;
    /** False when a required table was missing; the figures are then indicative only. */
    readonly reliable: boolean;
  };
  readonly missing: readonly string[];
  readonly notes: readonly string[];
}

/** Annual cost per $1,000 at an attained age, from the table. */
export function coiPerThousand(table: readonly CoiRate[], age: number): number | null {
  if (table.length === 0) return null;
  let found: CoiRate | null = null;
  for (const row of table) {
    if (row.age <= age) found = row;
    else break;
  }
  return found ? found.perThousand : table[0]!.perThousand;
}

/**
 * The generic age bands that used to sit inline in policyLoanOptimizer.ts.
 *
 * They are kept — unchanged, so no projection silently moved when the engines
 * were joined — but they are not a mortality table. Nobody sourced them. A real
 * cost of insurance schedule varies by age, sex, underwriting class and policy
 * year, is published in the contract, and moves by more than a factor of two
 * between a preferred non-smoker and a standard smoker at the same age. These
 * five bands cannot represent that and are not offered as though they could.
 *
 * Anything built on them reports `reliable: false` and says why. They exist so
 * that a tool with no carrier data charges *something* for mortality rather
 * than nothing, because a projection with no cost of insurance at all is wrong
 * in the flattering direction, which is the worse of the two ways to be wrong.
 */
export const ILLUSTRATIVE_COI_TABLE: readonly CoiRate[] = [
  { age: 0, perThousand: 1.2 },
  { age: 51, perThousand: 2.8 },
  { age: 61, perThousand: 6.5 },
  { age: 71, perThousand: 16.0 },
  { age: 81, perThousand: 22.0 },
];

/** Marks charges as carrying the illustrative table rather than a carrier's. */
export const ILLUSTRATIVE_SOURCE = 'illustrative';

function atYear(list: readonly number[], year: number): number {
  if (list.length === 0) return 0;
  return list[Math.min(year, list.length) - 1]!;
}

/** One policy year's state going in. */
export interface PolicyYearStep {
  /** Account value at the start of the year, before this year's premium. */
  readonly accountValue: number;
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly premium: number;
  readonly faceAmount: number;
  readonly charges: PolicyCharges;
  /** This year's credited rate, as a percentage. */
  readonly creditedRatePct: number;
  /** This year's IRC 7702 corridor factor, if the schedule is held. */
  readonly corridorFactor?: number;
}

export interface PolicyYearResult {
  readonly row: PolicyYear;
  /** Account value carried into the next year. */
  readonly accountValue: number;
  /** True when charges took the account value to zero or below this year. */
  readonly exhausted: boolean;
}

/**
 * One year, charged in order. Every engine on the platform walks its own loop —
 * loans, distributions, multipliers, whole life — but they all step the policy
 * through this function, so the deductions are the same deductions.
 */
export function stepPolicyYear(s: PolicyYearStep): PolicyYearResult {
  const c = s.charges;
  let accountValue = s.accountValue;

  // 1. Premium in, less its load.
  const premiumLoad = s.premium * (atYear(c.premiumLoadPctByYear, s.policyYear) / 100);
  accountValue += s.premium - premiumLoad;

  // 2 and 3. Fixed charges.
  const policyFee = c.monthlyPolicyFee * 12;
  const perUnitCharge =
    s.policyYear <= c.perUnitYears
      ? (s.faceAmount / 1000) * c.perUnitMonthlyPerThousand * 12
      : 0;
  accountValue -= policyFee + perUnitCharge;

  // 4. Cost of insurance, on the net amount at risk.
  //
  // The corridor matters here: where 7702 forces the death benefit up above
  // the specified amount, the amount at risk rises with it and so does the
  // charge. Without corridor factors the specified amount is used and the
  // result says the figure is indicative.
  const deathBenefit = s.corridorFactor
    ? Math.max(s.faceAmount, accountValue * s.corridorFactor)
    : s.faceAmount;
  const netAmountAtRisk = Math.max(0, deathBenefit - accountValue);
  const rate = coiPerThousand(c.coiTable, s.attainedAge);
  const costOfInsurance = rate === null ? 0 : (netAmountAtRisk / 1000) * rate;
  accountValue -= costOfInsurance;

  const exhausted = accountValue <= 0;
  accountValue = Math.max(0, accountValue);

  // 5. Credit what is left.
  const interestCredited = accountValue * (s.creditedRatePct / 100);
  accountValue += interestCredited;

  const persistencyCredit =
    c.persistencyCreditPct && s.policyYear >= (c.persistencyCreditFromYear ?? 11)
      ? accountValue * (c.persistencyCreditPct / 100)
      : 0;
  accountValue += persistencyCredit;

  const accountValueRounded = Math.round(accountValue);
  // Dollars per $1,000 of face is the product's own basis; prefer it.
  const surrenderCharge =
    c.surrenderChargePerThousandByYear && c.surrenderChargePerThousandByYear.length > 0
      ? (s.faceAmount / 1000) * atYear(c.surrenderChargePerThousandByYear, s.policyYear)
      : accountValue * (atYear(c.surrenderChargePctByYear, s.policyYear) / 100);
  const surrenderValue = Math.max(0, accountValueRounded - Math.round(surrenderCharge));

  return {
    accountValue,
    exhausted,
    row: {
      policyYear: s.policyYear,
      attainedAge: s.attainedAge,
      premium: Math.round(s.premium),
      premiumLoad: Math.round(premiumLoad),
      policyFee: Math.round(policyFee),
      perUnitCharge: Math.round(perUnitCharge),
      netAmountAtRisk: Math.round(netAmountAtRisk),
      costOfInsurance: Math.round(costOfInsurance),
      interestCredited: Math.round(interestCredited),
      persistencyCredit: Math.round(persistencyCredit),
      accountValue: accountValueRounded,
      surrenderValue,
      deathBenefit: Math.round(deathBenefit),
    },
  };
}

export function runPolicyMechanics(input: PolicyMechanicsInput): PolicyMechanicsResult {
  const { charges: c } = input;
  const missing: string[] = [];
  if (c.coiTable.length === 0) missing.push('cost of insurance table');
  else if (c.coiTableSource === ILLUSTRATIVE_SOURCE) missing.push('a carrier cost of insurance table');
  if (c.surrenderChargePctByYear.length === 0 &&
      !(c.surrenderChargePerThousandByYear && c.surrenderChargePerThousandByYear.length > 0)) {
    missing.push('surrender charge schedule');
  }
  // The corridor is law, not pricing, so it is never missing — it defaults to
  // the statutory schedule. It stays on `missing` only until somebody has read
  // 26 U.S.C. 7702(d)(2) beside our transcription of it.
  const corridor = input.corridorFactorByAge ?? CORRIDOR_FACTOR_BY_AGE;
  if (!VERIFIED_AGAINST_PRIMARY_TEXT && !input.corridorFactorByAge) {
    missing.push('a primary-text check of the IRC 7702 corridor table');
  }

  let accountValue = 0;
  let totalPremiums = 0;
  let totalCharges = 0;
  let totalInterest = 0;
  let lapseYear: number | null = null;
  const rows: PolicyYear[] = [];

  for (let y = 1; y <= input.years; y++) {
    const age = input.issueAge + y - 1;
    const premium = y <= input.premiumYears ? input.annualPremium : 0;
    totalPremiums += premium;

    const step = stepPolicyYear({
      accountValue,
      policyYear: y,
      attainedAge: age,
      premium,
      faceAmount: input.faceAmount,
      charges: c,
      creditedRatePct: atYear(input.creditedRatePctByYear, y),
      corridorFactor: corridor[age],
    });

    if (step.exhausted && lapseYear === null && premium === 0) lapseYear = y;
    accountValue = step.accountValue;

    const r = step.row;
    totalCharges += r.premiumLoad + r.policyFee + r.perUnitCharge + r.costOfInsurance;
    totalInterest += r.interestCredited + r.persistencyCredit;
    rows.push(r);
  }

  const last = rows[rows.length - 1];
  const notes: string[] = [];
  if (missing.includes('cost of insurance table')) {
    notes.push(
      'No cost of insurance table was supplied, so no mortality charge was deducted at all. ' +
      'Every figure here is therefore far too high. The table is published in the policy and is a ' +
      'schedule by age, sex and underwriting class; it cannot be approximated.'
    );
  }
  if (missing.includes('a carrier cost of insurance table')) {
    notes.push(
      'Mortality was charged from the generic age bands in ILLUSTRATIVE_COI_TABLE, not from a ' +
      'carrier schedule. Five bands cannot represent a table that varies by age, sex, underwriting ' +
      'class and policy year, so treat the cost of insurance line as an order of magnitude only.'
    );
  }
  if (missing.includes('surrender charge schedule')) {
    notes.push('No surrender charge schedule was supplied, so surrender value equals account value. A real policy carries one for the first several years.');
  }
  if (missing.includes('a primary-text check of the IRC 7702 corridor table')) {
    notes.push(
      'The corridor came from the statutory schedule in shared/irc7702.ts, transcribed from 26 U.S.C. 7702(d)(2) and confirmed against two independent sources, but not yet read beside the primary text. It is law rather than carrier pricing, so it applies to every product; the flag is about our transcription, not about the rule.'
    );
  }
  if (lapseYear !== null) {
    notes.push(`The account value reached zero in policy year ${lapseYear}. Beyond that the policy has lapsed and the figures are not meaningful.`);
  }

  return {
    years: rows,
    summary: {
      totalPremiums: Math.round(totalPremiums),
      totalCharges: Math.round(totalCharges),
      totalInterest: Math.round(totalInterest),
      finalAccountValue: last?.accountValue ?? 0,
      finalSurrenderValue: last?.surrenderValue ?? 0,
      lapseYear,
      reliable: missing.length === 0,
    },
    missing,
    notes,
  };
}
