// ============================================================
// PREFERENTIAL-RATE STACKING — federal tax when a return carries ordinary
// income, unrecaptured §1250 gain and long-term capital gain together.
//
// Why this exists: three calculators (crypto tax, depreciation recapture,
// divorce recovery) each need "tax on this gain, stacked on top of this
// income". Before this module each page either printed a fixed number or
// multiplied the gain by one flat rate, which is wrong at every bracket edge.
//
// Method (the Schedule D Tax Worksheet, simplified to the three layers that
// matter here):
//   1. Ordinary taxable income is taxed on the rate schedule.
//   2. Unrecaptured §1250 gain sits on top of it and is taxed at the ordinary
//      rate of each slice it occupies, but never above 25% (IRC §1(h)(1)(E)).
//   3. Long-term capital gain sits on top of both and is taxed 0 / 15 / 20 %
//      by where it lands against the 2026 breakpoints (IRC §1(h), Rev. Proc.
//      2025-32 §4.03, carried in taxRules.LTCG_THRESHOLDS_2026).
//   4. The result is never more than regular tax on the whole taxable income.
//
// Every figure is read from shared/taxRules.ts. The LTCG breakpoints exist for
// tax year 2026 only, so this module computes 2026; it refuses other years
// rather than borrowing 2026 breakpoints for them.
//
// PORT STEPS: pure module, no imports outside shared/. Copy to shared/, run
// `pnpm vitest run server/a25Calculators.test.ts`.
// ============================================================

import { TAX_RULES_2026, LTCG_THRESHOLDS_2026, federalTax, type FilingKey, type TaxRuleSet } from "./taxRules";

/** IRC §1(h)(1)(E): unrecaptured §1250 gain is taxed at no more than 25%. Statutory, not indexed. */
export const UNRECAPTURED_1250_MAX_RATE = 0.25;

export interface PreferentialStackInput {
  /** Taxable income that is taxed at ordinary rates (after deductions). */
  ordinaryTaxable: number;
  /** Unrecaptured §1250 gain included in taxable income. */
  unrecaptured1250?: number;
  /** Net long-term capital gain (and qualified dividends) included in taxable income. */
  longTermGain: number;
  filing: FilingKey;
}

export interface PreferentialStackResult {
  taxYear: number;
  taxableIncome: number;
  ordinaryTax: number;
  unrecaptured1250Tax: number;
  longTermGainTax: number;
  /** Federal income tax (before NIIT and credits). */
  totalTax: number;
  /** Ordinary rate at the top of the ordinary layer. */
  marginalOrdinaryRate: number;
  /** Rate on the last dollar of long-term gain (0, 0.15 or 0.20); null if there is none. */
  marginalGainRate: number | null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Tax on the slice of taxable income between `from` and `to`, each bracket's rate capped at `cap`. */
export function bracketTaxOnRange(from: number, to: number, filing: FilingKey, rules: TaxRuleSet = TAX_RULES_2026, cap = 1): number {
  if (to <= from) return 0;
  let lower = 0;
  let tax = 0;
  for (const b of rules.brackets[filing]) {
    const upper = b.upTo ?? Infinity;
    const lo = Math.max(from, lower);
    const hi = Math.min(to, upper);
    if (hi > lo) tax += (hi - lo) * Math.min(b.rate, cap);
    if (upper >= to) break;
    lower = upper;
  }
  return tax;
}

export function taxWithPreferentialIncome(input: PreferentialStackInput, rules: TaxRuleSet = TAX_RULES_2026): PreferentialStackResult {
  if (rules.taxYear !== 2026) {
    throw new Error(`Capital-gain breakpoints are on file for tax year 2026 only (got ${rules.taxYear}).`);
  }
  const ord = Math.max(0, input.ordinaryTaxable);
  const u = Math.max(0, input.unrecaptured1250 ?? 0);
  const lt = Math.max(0, input.longTermGain);
  const total = ord + u + lt;

  const ordinaryTax = federalTax(ord, input.filing, rules).tax;
  const unrecaptured1250Tax = bracketTaxOnRange(ord, ord + u, input.filing, rules, UNRECAPTURED_1250_MAX_RATE);

  const t = LTCG_THRESHOLDS_2026[input.filing];
  const start = ord + u;
  const end = start + lt;
  const band = (lo: number, hi: number) => Math.max(0, Math.min(end, hi) - Math.max(start, lo));
  const at0 = band(0, t.zeroUpTo);
  const at15 = band(t.zeroUpTo, t.fifteenUpTo);
  const at20 = band(t.fifteenUpTo, Infinity);
  const longTermGainTax = at15 * 0.15 + at20 * 0.2;

  const stacked = ordinaryTax + unrecaptured1250Tax + longTermGainTax;
  const regular = federalTax(total, input.filing, rules).tax;
  const totalTax = Math.min(stacked, regular);

  return {
    taxYear: rules.taxYear,
    taxableIncome: r2(total),
    ordinaryTax: r2(ordinaryTax),
    unrecaptured1250Tax: r2(unrecaptured1250Tax),
    longTermGainTax: r2(longTermGainTax),
    totalTax: r2(totalTax),
    marginalOrdinaryRate: federalTax(ord, input.filing, rules).marginalRate,
    marginalGainRate: lt <= 0 ? null : at20 > 0 ? 0.2 : at15 > 0 ? 0.15 : 0,
  };
}

/** Net investment income tax (IRC §1411), rate and thresholds from taxRules. */
export function niitFor(netInvestmentIncome: number, magi: number, filing: FilingKey, rules: TaxRuleSet = TAX_RULES_2026): number {
  const base = Math.min(Math.max(0, netInvestmentIncome), Math.max(0, magi - rules.niit.threshold[filing]));
  return r2(base * rules.niit.rate);
}

export const PREFERENTIAL_RATE_TAX_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "IRS Rev. Proc. 2025-32 — 2026 rate schedules (§4.01), standard deduction (§4.14) and maximum capital gains rate breakpoints (§4.03), via shared/taxRules.ts", url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf", asOf: "read 2026-09-23 per shared/taxRules.ts" },
  { label: "26 U.S.C. §1(h)(1)(E) — 25% maximum rate on unrecaptured §1250 gain", url: "https://www.law.cornell.edu/uscode/text/26/1", asOf: "statutory" },
  { label: "26 U.S.C. §1411 — 3.8% net investment income tax; thresholds $200,000 / $250,000 / $125,000 (not indexed)", url: "https://www.law.cornell.edu/uscode/text/26/1411", asOf: "statutory" },
];
