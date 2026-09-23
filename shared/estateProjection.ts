// ============================================================
// ESTATE PROJECTION — /portal/estate-planning and /portal/estate-timeline
//
// Why: /portal/estate-planning printed "Placeholder: Estimated Tax Exposure -
// $1.2M" and a 50-year grid of the literal text "[Estate Value]"; its inputs
// were uncontrolled and fed nothing. /portal/estate-timeline had a year box
// and a gifting box wired to nothing, and a "50-year evolution" chart drawn
// from seven fixed points (500,000 → 2,000,000).
//
// What this computes:
//   • Federal estate tax: tentative tax on (taxable estate + adjusted taxable
//     gifts) at the IRC §2001(c) rate schedule, less the applicable credit on
//     the basic exclusion amount (IRC §2010(c)). The exclusion is read from
//     shared/taxHistory.ts / shared/taxRules.ts for the years published
//     (1987–2026). For later years it is HELD at the 2026 figure: P.L. 119-21
//     indexes it for inflation after 2026, and future indexing is not
//     projected (this overstates tax, it never understates the exclusion's
//     published value).
//   • Married couples: the first death passes everything under the unlimited
//     marital deduction (IRC §2056) and the survivor's exclusion includes the
//     deceased spouse's unused exclusion (portability, IRC §2010(c)(4)),
//     assuming the portability election is made. The projection is of the
//     survivor's estate at the horizon.
//   • Gifts: each donee's gift up to the annual exclusion (IRC §2503(b), read
//     from taxRules) leaves the estate tax-free; any excess is an adjusted
//     taxable gift that uses exclusion (Form 709).
//   • An ILIT-owned death benefit is outside the gross estate (it is added to
//     what heirs receive, never to the taxable estate).
//   • The growth rate is the client's own assumption.
//
// PORT STEPS: pure module; imports taxRules and taxHistory.
// Test: server/a25Calculators.test.ts.
// ============================================================

import { rulesForYear } from "./taxRules";
import { ESTATE_EXCLUSION, valueAt } from "./taxHistory";

/** IRC §2001(c) rate schedule: [bracket floor, rate]. Statutory; unchanged since 2013 (P.L. 112-240). */
export const ESTATE_RATE_SCHEDULE: readonly { over: number; rate: number }[] = [
  { over: 0, rate: 0.18 }, { over: 10_000, rate: 0.20 }, { over: 20_000, rate: 0.22 }, { over: 40_000, rate: 0.24 },
  { over: 60_000, rate: 0.26 }, { over: 80_000, rate: 0.28 }, { over: 100_000, rate: 0.30 }, { over: 150_000, rate: 0.32 },
  { over: 250_000, rate: 0.34 }, { over: 500_000, rate: 0.37 }, { over: 750_000, rate: 0.39 }, { over: 1_000_000, rate: 0.40 },
];

export const LAST_PUBLISHED_EXCLUSION_YEAR = 2026;

/** Tentative tax under §2001(c). */
export function tentativeTax(amount: number): number {
  const a = Math.max(0, amount);
  let tax = 0;
  for (let i = 0; i < ESTATE_RATE_SCHEDULE.length; i++) {
    const lo = ESTATE_RATE_SCHEDULE[i]!.over;
    const hi = ESTATE_RATE_SCHEDULE[i + 1]?.over ?? Infinity;
    if (a <= lo) break;
    tax += (Math.min(a, hi) - lo) * ESTATE_RATE_SCHEDULE[i]!.rate;
  }
  return tax;
}

/** Published basic exclusion amount for a year of death, or null when none is published for that year. */
export function publishedExclusion(year: number): number | null {
  if (year === 2026 || year === 2025) return rulesForYear(year).estateBasicExclusion;
  return valueAt(ESTATE_EXCLUSION, year);
}

/** Exclusion used for a projected year: the published figure, else the latest published figure held flat. */
export function exclusionForProjection(year: number): { amount: number; published: boolean } {
  const p = publishedExclusion(year);
  if (p != null) return { amount: p, published: true };
  return { amount: rulesForYear(LAST_PUBLISHED_EXCLUSION_YEAR).estateBasicExclusion, published: false };
}

export function annualGiftExclusion(year: number): number {
  return rulesForYear(year).annualGiftExclusion;
}

/** Federal estate tax: tentative tax on (taxable estate + adjusted taxable gifts) less the credit on the exclusion. */
export function federalEstateTax(taxableEstate: number, adjustedTaxableGifts: number, exclusion: number): number {
  const tt = tentativeTax(Math.max(0, taxableEstate) + Math.max(0, adjustedTaxableGifts));
  const credit = tentativeTax(Math.max(0, exclusion));
  return Math.max(0, Math.round(tt - credit));
}

export interface EstateProjectionInput {
  startYear: number;
  estateValue: number;
  /** Client's assumed annual growth, decimal. */
  growthRate: number;
  horizonYears: number;
  married: boolean;
  charitableBequest: number;
  /** Death benefit owned by an ILIT; outside the estate. */
  ilitDeathBenefit: number;
  annualGiftPerDonee: number;
  donees: number;
  giftYears: number;
  /** Taxable gifts already made (adjusted taxable gifts to date). */
  priorTaxableGifts: number;
}

export interface EstateProjectionRow {
  year: number;
  yearsFromNow: number;
  grossEstate: number;
  exclusion: number;
  exclusionPublished: boolean;
  adjustedTaxableGifts: number;
  estateTax: number;
  estateTaxWithoutGifting: number;
  netToHeirs: number;
  cumulativeGiftsOut: number;
}

export interface EstateProjectionResult {
  rows: EstateProjectionRow[];
  today: EstateProjectionRow;
  atHorizon: EstateProjectionRow;
  annualExclusionUsed: number;
  taxableGiftPerYear: number;
  notes: string[];
}

export function projectEstate(input: EstateProjectionInput): EstateProjectionResult {
  const years = Math.max(0, Math.min(50, Math.round(input.horizonYears)));
  const g = input.growthRate;
  const donees = Math.max(0, Math.round(input.donees));
  const giftYears = Math.max(0, Math.round(input.giftYears));
  const perDonee = Math.max(0, input.annualGiftPerDonee);
  const annualExcl = annualGiftExclusion(input.startYear);
  const taxablePerDonee = Math.max(0, perDonee - annualExcl);
  const couple = input.married ? 2 : 1;

  let withGifts = Math.max(0, input.estateValue);
  let noGifts = withGifts;
  let adjTaxableGifts = Math.max(0, input.priorTaxableGifts);
  let giftsOut = 0;
  const rows: EstateProjectionRow[] = [];

  for (let t = 0; t <= years; t++) {
    const year = input.startYear + t;
    if (t > 0) {
      const giving = t <= giftYears;
      const gift = giving ? Math.min(withGifts, perDonee * donees) : 0;
      if (giving) {
        giftsOut += gift;
        adjTaxableGifts += taxablePerDonee * donees;
      }
      withGifts = (withGifts - gift) * (1 + g);
      noGifts = noGifts * (1 + g);
    }
    const ex = exclusionForProjection(year);
    const exclusion = ex.amount * couple;
    const charity = Math.max(0, input.charitableBequest);
    const tax = federalEstateTax(withGifts - charity, adjTaxableGifts, exclusion);
    const taxNoGifts = federalEstateTax(noGifts - charity, Math.max(0, input.priorTaxableGifts), exclusion);
    rows.push({
      year,
      yearsFromNow: t,
      grossEstate: Math.round(withGifts),
      exclusion,
      exclusionPublished: ex.published,
      adjustedTaxableGifts: Math.round(adjTaxableGifts),
      estateTax: tax,
      estateTaxWithoutGifting: taxNoGifts,
      netToHeirs: Math.round(Math.max(0, withGifts - tax - Math.min(withGifts, charity)) + Math.max(0, input.ilitDeathBenefit) + giftsOut),
      cumulativeGiftsOut: Math.round(giftsOut),
    });
  }

  const notes: string[] = [];
  if (rows.some(r => !r.exclusionPublished)) notes.push(`Exclusion after ${LAST_PUBLISHED_EXCLUSION_YEAR} is held at the ${LAST_PUBLISHED_EXCLUSION_YEAR} figure; P.L. 119-21 indexes it for inflation, which is not projected, so later-year tax is overstated rather than understated.`);
  if (input.married) notes.push("Married: assumes everything passes to the survivor under the marital deduction and the portability election is made, so the survivor's exclusion is doubled.");
  if (taxablePerDonee > 0) notes.push(`Gifts above the ${annualExcl.toLocaleString("en-US")} annual exclusion per donee are taxable gifts: they use lifetime exclusion and require Form 709.`);
  notes.push("Gifts are counted at their value when given; their growth outside the estate is not added to heirs' totals.");
  notes.push("Growth is the client's own assumption, not a forecast. State estate and inheritance taxes are not modelled.");

  return { rows, today: rows[0]!, atHorizon: rows[rows.length - 1]!, annualExclusionUsed: annualExcl, taxableGiftPerYear: taxablePerDonee * donees, notes };
}

export const ESTATE_PROJECTION_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "26 U.S.C. §2001(c) — estate and gift tax rate schedule (18% to 40%)", url: "https://www.law.cornell.edu/uscode/text/26/2001", asOf: "statutory" },
  { label: "26 U.S.C. §2010(c) — basic exclusion amount; §2010(c)(4) portability; $15,000,000 for 2026 per P.L. 119-21 and Rev. Proc. 2025-32, via shared/taxRules.ts", url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf", asOf: "read 2026-09-23 per shared/taxRules.ts" },
  { label: "IRS estate tax basic exclusion amounts by year of death, 1987–2025, via shared/taxHistory.ts", asOf: "per shared/taxHistory.ts" },
  { label: "26 U.S.C. §2503(b) — annual gift exclusion, $19,000 per donee for 2025 and 2026 (Rev. Proc. 2024-40, 2025-32), via shared/taxRules.ts", url: "https://www.law.cornell.edu/uscode/text/26/2503", asOf: "read 2026-09-23 per shared/taxRules.ts" },
  { label: "26 U.S.C. §2056 — unlimited marital deduction", url: "https://www.law.cornell.edu/uscode/text/26/2056", asOf: "statutory" },
];
