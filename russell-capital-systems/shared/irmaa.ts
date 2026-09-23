// ============================================================
// MEDICARE IRMAA — one table for every page and engine that prices the
// income-related monthly adjustment amount. Premium year 2026, which SSA
// determines from the 2024 tax return (two-year lookback).
//
// Tiers 1 to 4 include their upper edge (MAGI "less than or equal to");
// tier 5 excludes it (joint MAGI below $750,000, single below $500,000),
// so exactly $500,000 single or $750,000 joint is tier 6, and $500,000
// joint is tier 5.
// ============================================================

export type IrmaaFiling = "single" | "married";

export type IrmaaTier = {
  /** 1 = no surcharge ... 6 = top tier */
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  /** Upper MAGI edge for this tier; Infinity for the top tier. */
  maxMagi: number;
  /** true: MAGI equal to maxMagi is in this tier; false: it is in the next tier. */
  maxInclusive: boolean;
  /** Part B IRMAA added to the standard premium, per person per month. */
  partBMonthly: number;
  /** Part D IRMAA added to the plan premium, per person per month. */
  partDMonthly: number;
};

/**
 * SSA POMS HI 01101.031, IRMAA sliding scale tables for 2026 (2024 MAGI).
 * Standard Part B premium $202.90/month; the top Part B total is
 * $202.90 + $487.00 = $689.90/month.
 */
export const IRMAA_SOURCE = {
  label: "Social Security Administration, POMS HI 01101.031, 2026 IRMAA sliding scale tables (premium year 2026, based on 2024 MAGI): joint thresholds $218,000 / $274,000 / $342,000 / $410,000 / under $750,000; single $109,000 / $137,000 / $171,000 / $205,000 / under $500,000; Part B IRMAA $81.20 / $202.90 / $324.60 / $446.30 / $487.00; Part D IRMAA $14.50 / $37.50 / $60.40 / $83.30 / $91.00 per month; standard Part B premium $202.90",
  url: "https://secure.ssa.gov/poms.nsf/lnx/0601101031",
  asOf: "2026 premium year, read 2026-09-23",
} as const;

/** Standard Part B monthly premium for 2026 (IRMAA_SOURCE). */
export const PART_B_STANDARD_MONTHLY_2026 = 202.9;

const B = [0, 81.2, 202.9, 324.6, 446.3, 487.0] as const;
const D = [0, 14.5, 37.5, 60.4, 83.3, 91.0] as const;

function build(edges: readonly [number, number, number, number, number]): IrmaaTier[] {
  const maxes = [...edges, Infinity];
  return maxes.map((maxMagi, i) => ({
    tier: (i + 1) as IrmaaTier["tier"],
    maxMagi,
    maxInclusive: i !== 4,
    partBMonthly: B[i]!,
    partDMonthly: D[i]!,
  }));
}

export const IRMAA_2026: Record<IrmaaFiling, IrmaaTier[]> = {
  married: build([218_000, 274_000, 342_000, 410_000, 750_000]),
  single: build([109_000, 137_000, 171_000, 205_000, 500_000]),
};

/** Index (0-based) into IRMAA_2026[filing] of the tier a MAGI falls in. */
export function irmaaTierIndex(magi: number, filing: IrmaaFiling): number {
  const table = IRMAA_2026[filing];
  for (let i = 0; i < table.length; i++) {
    const t = table[i]!;
    if (t.maxInclusive ? magi <= t.maxMagi : magi < t.maxMagi) return i;
  }
  return table.length - 1;
}

export function irmaaTier(magi: number, filing: IrmaaFiling): IrmaaTier {
  return IRMAA_2026[filing][irmaaTierIndex(magi, filing)]!;
}

/** Annual Part B + Part D IRMAA for one Medicare enrollee. */
export function irmaaAnnualSurchargePerPerson(magi: number, filing: IrmaaFiling): number {
  const t = irmaaTier(magi, filing);
  return Math.round((t.partBMonthly + t.partDMonthly) * 12 * 100) / 100;
}

export const IRMAA_SOURCES = [IRMAA_SOURCE] as const;
