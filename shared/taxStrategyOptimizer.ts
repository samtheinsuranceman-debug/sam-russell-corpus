// ============================================================
// TAX STRATEGY OPTIMIZER — /portal/tax-optimizer
//
// Why: every input on the page was `readOnly` with a fixed value (850,000
// income, 50,000 deductions), the filing-status and state selects were not
// bound to state, and "Current Tax $335.4K / Optimized $199.4K / Savings
// $136K", the waterfall and the ten-year line were typed-in constants. The
// tax-year select changed nothing.
//
// What this computes, for the tax year chosen (2025 or 2026 rule sets in
// shared/taxRules.ts):
//   baseline  : the return as entered, no strategies;
//   optimized : the same return with the strategies the user turns on, applied
//               in a fixed order (pre-tax 401(k) → charitable → cost
//               segregation → Roth conversion), each strategy's saving being
//               the tax difference it makes on top of the ones before it.
//
//   Federal income tax — computeTaxPicture (standard vs itemized, SALT cap and
//     phase-down) then less the §199A deduction (shared/qbiDeduction.ts, 2026
//     thresholds; not applied for 2025, where this build carries no thresholds).
//   FICA on wages — 6.2% to the wage base, 1.45% uncapped, 0.9% additional
//     Medicare above the threshold (taxRules.socialSecurity).
//   Self-employment tax — 92.35% of net earnings; 12.4% to the wage base left
//     after wages, 2.9% uncapped; half deductible (IRC §1402, §164(f)).
//   State — the state's top marginal rate (taxBracketEngine, Tax Foundation
//     2026 table) applied flat to federal taxable income: an approximation the
//     page labels.
//
// Not modelled (stated on the page): AMT; the 2026 OBBBA charitable changes
// (0.5%-of-AGI floor, 35% cap on the value of itemized deductions, the
// non-itemizer charitable deduction); passive-activity carryforwards beyond
// the year; state deductions and credits.
//
// PORT STEPS: pure module; imports taxRules, qbiDeduction, taxBracketEngine.
// Test: server/a25Calculators.test.ts.
// ============================================================

import { rulesForYear, computeTaxPicture, federalTax, retirementLimits, type FilingKey, type TaxRuleSet } from "./taxRules";
import { computeQbiDeduction, type FilingStatus as QbiFiling } from "./qbiDeduction";
import { getStateTaxRate, STATE_TAX_RATES_SOURCE, FEDERAL_RATES_SOURCE } from "./taxBracketEngine";

/** IRC §1402(a)(12): net earnings from self-employment are 92.35% of net profit. */
export const SE_EARNINGS_FACTOR = 0.9235;
/** IRC §170(b)(1)(G): cash gifts to public charities limited to 60% of AGI. */
export const CHARITABLE_CASH_AGI_LIMIT = 0.6;

export interface TaxOptimizerInput {
  taxYear: 2025 | 2026;
  filing: FilingKey;
  age: number;
  stateCode: string;
  wages: number;
  /** Net Schedule C / self-employment profit. */
  businessIncome: number;
  businessIsSSTB: boolean;
  /** Net rental income before any additional depreciation. */
  rentalIncome: number;
  realEstateProfessional: boolean;
  otherOrdinaryIncome: number;
  itemizedOther: number;
  saltPaid: number;
  strategies: {
    pretax401k: number;
    charitableCash: number;
    costSegDepreciation: number;
    rothConversion: number;
  };
}

export interface TaxBreakdown {
  agi: number;
  deductionMethod: "standard" | "itemized";
  deduction: number;
  qbiDeduction: number;
  taxableIncome: number;
  federalIncomeTax: number;
  marginalRate: number;
  ficaWages: number;
  selfEmploymentTax: number;
  stateTax: number;
  total: number;
  effectiveRate: number;
}

export interface StrategyStep {
  key: "pretax401k" | "charitableCash" | "costSegDepreciation" | "rothConversion";
  label: string;
  authority: string;
  amountApplied: number;
  /** Positive = tax saved; negative = tax cost (Roth conversion). */
  saving: number;
  note?: string;
}

export interface TaxOptimizerResult {
  rulesVersion: string;
  taxYear: number;
  stateRate: number;
  baseline: TaxBreakdown;
  optimized: TaxBreakdown;
  steps: StrategyStep[];
  totalSaving: number;
  notes: string[];
}

const r0 = (n: number) => Math.round(n);

function qbiFiling(f: FilingKey): QbiFiling {
  return f === "joint" ? "mfj" : f === "separate" ? "mfs" : f;
}

type Applied = { k401: number; charity: number; costSeg: number; roth: number };

function compute(input: TaxOptimizerInput, rules: TaxRuleSet, a: Applied): TaxBreakdown {
  const ss = rules.socialSecurity;
  const wages = Math.max(0, input.wages);
  const business = Math.max(0, input.businessIncome);

  const seEarnings = business * SE_EARNINGS_FACTOR;
  const oasdiRoom = Math.max(0, ss.wageBase - wages);
  const seTaxCore = 2 * ss.oasdiRate * Math.min(seEarnings, oasdiRoom) + 2 * ss.hiRate * seEarnings;
  const addlThreshold = ss.additionalMedicareThreshold[input.filing];
  const addlMedicare = ss.additionalMedicareRate * Math.max(0, wages + seEarnings - addlThreshold);
  const ficaWages = ss.oasdiRate * Math.min(wages, ss.wageBase) + ss.hiRate * wages;
  const halfSe = seTaxCore / 2;

  const rentalAfterDep = Math.max(0, input.rentalIncome) - a.costSeg;
  const rentalIncluded = input.realEstateProfessional ? rentalAfterDep : Math.max(0, rentalAfterDep);

  const agi = Math.max(0, wages - a.k401 + business - halfSe + rentalIncluded + Math.max(0, input.otherOrdinaryIncome) + a.roth);
  const charityAllowed = Math.min(a.charity, CHARITABLE_CASH_AGI_LIMIT * agi);
  const picture = computeTaxPicture({
    filing: input.filing,
    agi,
    itemizedOtherThanSalt: Math.max(0, input.itemizedOther) + charityAllowed,
    saltPaid: Math.max(0, input.saltPaid),
    age: input.age,
  }, rules);

  let qbi = 0;
  if (business > 0 && rules.taxYear === 2026) {
    qbi = computeQbiDeduction({
      filingStatus: qbiFiling(input.filing),
      taxableIncomeBeforeQbi: picture.taxableIncome,
      netCapitalGain: 0,
      businesses: [{ name: "Business", qbi: business - halfSe, w2Wages: 0, ubia: 0, isSSTB: input.businessIsSSTB }],
    }).deduction;
  }
  const taxable = Math.max(0, picture.taxableIncome - qbi);
  const ft = federalTax(taxable, input.filing, rules);
  const stateTax = getStateTaxRate(input.stateCode) * picture.taxableIncome;
  const selfEmploymentTax = seTaxCore + addlMedicare;
  const total = ft.tax + ficaWages + selfEmploymentTax + stateTax;
  const grossIncome = wages + business + Math.max(0, input.rentalIncome) + Math.max(0, input.otherOrdinaryIncome) + a.roth;

  return {
    agi: r0(agi),
    deductionMethod: picture.deductionMethod,
    deduction: r0(picture.deduction),
    qbiDeduction: r0(qbi),
    taxableIncome: r0(taxable),
    federalIncomeTax: r0(ft.tax),
    marginalRate: ft.marginalRate,
    ficaWages: r0(ficaWages),
    selfEmploymentTax: r0(selfEmploymentTax),
    stateTax: r0(stateTax),
    total: r0(total),
    effectiveRate: grossIncome > 0 ? total / grossIncome : 0,
  };
}

export function optimizeTaxes(input: TaxOptimizerInput): TaxOptimizerResult {
  const rules = rulesForYear(input.taxYear);
  const s = input.strategies;
  const limits = retirementLimits(input.age, rules);
  const k401 = Math.min(Math.max(0, s.pretax401k), limits.total401k, Math.max(0, input.wages));
  const charity = Math.max(0, s.charitableCash);
  const costSeg = Math.max(0, s.costSegDepreciation);
  const roth = Math.max(0, s.rothConversion);

  const zero: Applied = { k401: 0, charity: 0, costSeg: 0, roth: 0 };
  const baseline = compute(input, rules, zero);
  const order: { key: StrategyStep["key"]; label: string; authority: string; patch: Partial<Applied>; amount: number; note?: string }[] = [
    { key: "pretax401k", label: "Pre-tax 401(k) deferral", authority: "IRC §402(g); limit from taxRules", patch: { k401 }, amount: k401,
      note: s.pretax401k > k401 ? `Capped at the ${rules.taxYear} limit of $${limits.total401k.toLocaleString("en-US")} for age ${input.age} (or wages).` : "Reduces income tax, not FICA." },
    { key: "charitableCash", label: "Charitable cash gifts", authority: "IRC §170(b)(1)(G): 60% of AGI", patch: { charity }, amount: charity,
      note: "Saves tax only when itemizing beats the standard deduction." },
    { key: "costSegDepreciation", label: "Additional depreciation (cost segregation)", authority: "IRC §§167, 168; passive limits §469", patch: { costSeg }, amount: costSeg,
      note: input.realEstateProfessional ? "Real estate professional: rental losses offset other income." : "Not a real estate professional: depreciation offsets rental income only; any excess is a suspended passive loss (§469)." },
    { key: "rothConversion", label: "Roth conversion", authority: "IRC §408A(d)(3)", patch: { roth }, amount: roth,
      note: "Adds taxable income this year in exchange for no tax on qualified withdrawals later; shown as a cost." },
  ];

  let applied: Applied = { ...zero };
  let prev = baseline;
  const steps: StrategyStep[] = [];
  for (const o of order) {
    if (o.amount <= 0) continue;
    applied = { ...applied, ...o.patch };
    const next = compute(input, rules, applied);
    steps.push({ key: o.key, label: o.label, authority: o.authority, amountApplied: r0(o.amount), saving: prev.total - next.total, note: o.note });
    prev = next;
  }
  const optimized = prev;

  const notes = [
    "State tax is the state's top marginal rate applied flat to federal taxable income; state brackets, deductions and credits are not modelled.",
    "Not modelled: alternative minimum tax; the 2026 charitable floor (0.5% of AGI), the 35% cap on the value of itemized deductions and the non-itemizer charitable deduction under P.L. 119-21. Charitable savings for top-bracket filers are therefore an upper bound.",
    "Strategy savings are sequential: each is the difference it makes after the ones listed above it.",
  ];
  if (input.taxYear === 2025 && input.businessIncome > 0) notes.push("§199A deduction not applied for 2025: this build carries 2026 thresholds only.");

  return {
    rulesVersion: rules.version,
    taxYear: rules.taxYear,
    stateRate: getStateTaxRate(input.stateCode),
    baseline,
    optimized,
    steps,
    totalSaving: baseline.total - optimized.total,
    notes,
  };
}

export const TAX_OPTIMIZER_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: FEDERAL_RATES_SOURCE.label, url: FEDERAL_RATES_SOURCE.url, asOf: FEDERAL_RATES_SOURCE.asOf },
  { label: "shared/taxRules.ts — 2025 (Rev. Proc. 2024-40, P.L. 119-21) and 2026 (Rev. Proc. 2025-32, Notice 2025-67) rule sets: brackets, standard deduction, SALT cap, retirement limits, Social Security wage base", asOf: "per shared/taxRules.ts" },
  { label: STATE_TAX_RATES_SOURCE.label, url: STATE_TAX_RATES_SOURCE.url, asOf: STATE_TAX_RATES_SOURCE.asOf },
  { label: "shared/qbiDeduction.ts — §199A thresholds, Rev. Proc. 2025-32 §3.26", url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf", asOf: "per shared/qbiDeduction.ts" },
  { label: "26 U.S.C. §1401, §1402(a)(12), §164(f) — self-employment tax rates, 92.35% factor, deduction of one-half", url: "https://www.law.cornell.edu/uscode/text/26/1402", asOf: "statutory" },
  { label: "26 U.S.C. §170(b)(1)(G) — 60% of AGI limit on cash gifts to public charities", url: "https://www.law.cornell.edu/uscode/text/26/170", asOf: "statutory" },
];
