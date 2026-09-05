// ─── Estate Tax Calculation Engine ──────────────────────────────────────────
// Comprehensive federal estate tax calculator with progressive brackets,
// ILIT planning, gifting strategies, 2026 sunset analysis, wealth projections
// to age 100, and life insurance coverage needs analysis.

export interface EstateAssets {
  realEstate: number;
  investments: number;       // stocks, bonds, mutual funds
  retirementAccounts: number; // IRA, 401k (fully taxable to estate)
  businessInterests: number;
  lifeInsurance: number;     // death benefit if not in ILIT
  cashAndSavings: number;
  personalProperty: number;  // vehicles, jewelry, art, collectibles
  otherAssets: number;
}

export interface EstateDeductions {
  maritalDeduction: number;        // unlimited marital deduction
  charitableDeduction: number;
  debtsAndMortgages: number;
  funeralExpenses: number;
  adminExpenses: number;           // executor fees, legal, accounting
  stateDeathTaxDeduction: number;
}

export interface GiftingStrategy {
  annualGiftsPerRecipient: number; // $18,000 for 2024
  numberOfRecipients: number;
  yearsOfGifting: number;
  lifetimeGiftsUsed: number;       // amount of lifetime exemption already used
}

export interface EstateTaxInput {
  assets: EstateAssets;
  deductions: EstateDeductions;
  iulDeathBenefit: number;
  useILIT: boolean;
  gifting: GiftingStrategy;
  filingStatus: "single" | "married";
  spouseEstateValue: number;
  year: number;
  // New fields for enhanced projections
  currentAge: number;           // client's current age
  growthRate: number;           // annual growth rate (default 0.08 = 8%)
  spouseAge: number;            // spouse's current age
  numberOfBeneficiaries: number; // number of beneficiaries
}

// Federal estate tax brackets (2024)
const FEDERAL_BRACKETS = [
  { min: 0,       max: 10000,    rate: 0.18 },
  { min: 10000,   max: 20000,    rate: 0.20 },
  { min: 20000,   max: 40000,    rate: 0.22 },
  { min: 40000,   max: 60000,    rate: 0.24 },
  { min: 60000,   max: 80000,    rate: 0.26 },
  { min: 80000,   max: 100000,   rate: 0.28 },
  { min: 100000,  max: 150000,   rate: 0.30 },
  { min: 150000,  max: 250000,   rate: 0.32 },
  { min: 250000,  max: 500000,   rate: 0.34 },
  { min: 500000,  max: 750000,   rate: 0.37 },
  { min: 750000,  max: 1000000,  rate: 0.39 },
  { min: 1000000, max: Infinity, rate: 0.40 },
];

export const CURRENT_EXEMPTION = 13610000; // 2024/2025
export const SUNSET_EXEMPTION = 7000000;   // 2026+ (approximate)
export const ANNUAL_GIFT_EXCLUSION = 18000; // 2024

export interface BracketBreakdown {
  bracket: string;
  rate: number;
  taxableInBracket: number;
  taxInBracket: number;
}

export interface WealthProjectionYear {
  age: number;
  year: number;
  grossEstate: number;
  exemption: number;
  taxableEstate: number;
  estateTax: number;
  netToHeirs: number;
  effectiveRate: number;
  cumulativeGifts: number;
  insuranceNeeded: number; // exact life insurance to zero out tax
  insuranceCoverage: number; // current IUL/ILIT coverage
  netWithInsurance: number; // net to heirs after insurance pays tax
}

export interface EstateTaxResult {
  // Gross estate
  grossEstate: number;
  assetBreakdown: { label: string; value: number; color: string }[];

  // Deductions
  totalDeductions: number;
  adjustedGrossEstate: number;

  // Gifting impact
  totalGiftingReduction: number;
  lifetimeExemptionRemaining: number;

  // Tax calculation
  exemption: number;
  taxableEstate: number;
  tentativeTax: number;
  unifiedCredit: number;
  federalEstateTax: number;
  effectiveRate: number;
  bracketBreakdown: BracketBreakdown[];

  // Net to heirs
  netToHeirs: number;
  estateShrinkagePercent: number;

  // ILIT analysis
  ilitSavings: number;
  withoutILIT: { taxableEstate: number; estateTax: number; netToHeirs: number };
  withILIT: { taxableEstate: number; estateTax: number; netToHeirs: number };

  // 2026 sunset comparison
  sunsetAnalysis: {
    currentExemption: number;
    sunsetExemption: number;
    currentTax: number;
    sunsetTax: number;
    additionalExposure: number;
  };

  // Gifting strategy impact
  giftingAnalysis: {
    annualExclusion: number;
    totalAnnualGifts: number;
    totalGiftingOverYears: number;
    estateReduction: number;
    taxSavingsFromGifting: number;
  };

  // Combined strategies
  combinedStrategySavings: number;

  // Pie chart data
  shrinkagePie: { label: string; value: number; color: string }[];

  // Wealth projections to age 100 (8% growth)
  wealthProjections: WealthProjectionYear[];

  // Insurance needs analysis
  insuranceAnalysis: {
    currentCoverage: number;
    coverageNeededToday: number;
    coverageNeededAtPeak: number;
    peakTaxAge: number;
    peakTaxAmount: number;
    peakEstateValue: number;
    coverageGap: number;
    yearsUntilTaxable: number; // years until estate exceeds exemption
    ageWhenTaxable: number;
  };

  // Legacy: keep old projections for backward compat
  projections: {
    year: number;
    grossEstate: number;
    exemption: number;
    taxableEstate: number;
    estateTax: number;
    netToHeirs: number;
  }[];
}

function calculateTentativeTax(taxableEstate: number): { tax: number; brackets: BracketBreakdown[] } {
  let tax = 0;
  const brackets: BracketBreakdown[] = [];

  for (const b of FEDERAL_BRACKETS) {
    if (taxableEstate <= b.min) break;
    const amountInBracket = Math.min(taxableEstate, b.max) - b.min;
    const taxInBracket = amountInBracket * b.rate;
    tax += taxInBracket;
    if (amountInBracket > 0) {
      brackets.push({
        bracket: b.max === Infinity ? `$${(b.min / 1000).toFixed(0)}K+` : `$${(b.min / 1000).toFixed(0)}K - $${(b.max / 1000).toFixed(0)}K`,
        rate: b.rate,
        taxableInBracket: Math.round(amountInBracket),
        taxInBracket: Math.round(taxInBracket),
      });
    }
  }

  return { tax: Math.round(tax), brackets };
}

function calculateUnifiedCredit(exemption: number): number {
  return calculateTentativeTax(exemption).tax;
}

/** Calculate estate tax for a given gross estate, deductions, gifting, and exemption */
function computeTaxForEstate(
  gross: number,
  deductions: number,
  giftingReduction: number,
  exemptionRemaining: number,
): number {
  const adj = Math.max(0, gross - deductions);
  const afterGifting = Math.max(0, adj - giftingReduction);
  const tentative = calculateTentativeTax(afterGifting).tax;
  const credit = calculateUnifiedCredit(exemptionRemaining);
  return Math.max(0, tentative - credit);
}

export function calculateComprehensiveEstateTax(input: EstateTaxInput): EstateTaxResult {
  const { assets, deductions, iulDeathBenefit, useILIT, gifting, year } = input;
  const currentAge = input.currentAge || 55;
  const growthRate = input.growthRate || 0.08;
  const numberOfBeneficiaries = input.numberOfBeneficiaries || 2;

  // 1. Gross estate
  const grossEstate =
    assets.realEstate +
    assets.investments +
    assets.retirementAccounts +
    assets.businessInterests +
    (useILIT ? 0 : assets.lifeInsurance) +
    assets.cashAndSavings +
    assets.personalProperty +
    assets.otherAssets +
    (useILIT ? 0 : iulDeathBenefit);

  const assetBreakdown = [
    { label: "Real Estate", value: assets.realEstate, color: "#3b82f6" },
    { label: "Investments", value: assets.investments, color: "#8b5cf6" },
    { label: "Retirement Accounts", value: assets.retirementAccounts, color: "#f59e0b" },
    { label: "Business Interests", value: assets.businessInterests, color: "#06b6d4" },
    { label: "Life Insurance", value: useILIT ? 0 : (assets.lifeInsurance + iulDeathBenefit), color: "#ef4444" },
    { label: "Cash & Savings", value: assets.cashAndSavings, color: "#22c55e" },
    { label: "Personal Property", value: assets.personalProperty, color: "#ec4899" },
    { label: "Other Assets", value: assets.otherAssets, color: "#f97316" },
  ].filter(a => a.value > 0);

  // 2. Deductions
  const totalDeductions =
    deductions.maritalDeduction +
    deductions.charitableDeduction +
    deductions.debtsAndMortgages +
    deductions.funeralExpenses +
    deductions.adminExpenses +
    deductions.stateDeathTaxDeduction;

  const adjustedGrossEstate = Math.max(0, grossEstate - totalDeductions);

  // 3. Gifting strategy
  const totalAnnualGifts = gifting.annualGiftsPerRecipient * gifting.numberOfRecipients;
  const totalGiftingOverYears = totalAnnualGifts * gifting.yearsOfGifting;
  const totalGiftingReduction = totalGiftingOverYears;

  // 4. Exemption
  const exemption = year >= 2026 ? SUNSET_EXEMPTION : CURRENT_EXEMPTION;
  const lifetimeExemptionRemaining = Math.max(0, exemption - gifting.lifetimeGiftsUsed);

  // 5. Taxable estate
  const estateAfterGifting = Math.max(0, adjustedGrossEstate - totalGiftingReduction);
  const taxableEstate = Math.max(0, estateAfterGifting - lifetimeExemptionRemaining);

  // 6. Tax calculation
  const { tax: tentativeTax, brackets: bracketBreakdown } = calculateTentativeTax(estateAfterGifting);
  const unifiedCredit = calculateUnifiedCredit(lifetimeExemptionRemaining);
  const federalEstateTax = Math.max(0, tentativeTax - unifiedCredit);
  const effectiveRate = grossEstate > 0 ? federalEstateTax / grossEstate : 0;

  // 7. Net to heirs
  const netToHeirs = grossEstate - federalEstateTax - totalDeductions + (useILIT ? (assets.lifeInsurance + iulDeathBenefit) : 0);
  const estateShrinkagePercent = grossEstate > 0 ? (federalEstateTax / grossEstate) * 100 : 0;

  // 8. ILIT analysis
  const grossWithoutILIT = grossEstate + (useILIT ? (assets.lifeInsurance + iulDeathBenefit) : 0);
  const taxNoILIT = computeTaxForEstate(grossWithoutILIT, totalDeductions, totalGiftingReduction, lifetimeExemptionRemaining);
  const netNoILIT = grossWithoutILIT - taxNoILIT - totalDeductions;

  const grossWithILIT = grossEstate - (useILIT ? 0 : (assets.lifeInsurance + iulDeathBenefit));
  const taxILIT = computeTaxForEstate(grossWithILIT, totalDeductions, totalGiftingReduction, lifetimeExemptionRemaining);
  const netILIT = grossWithILIT - taxILIT - totalDeductions + assets.lifeInsurance + iulDeathBenefit;

  const ilitSavings = Math.max(0, taxNoILIT - taxILIT);

  // 9. 2026 sunset comparison
  const sunsetExemptionRemaining = Math.max(0, SUNSET_EXEMPTION - gifting.lifetimeGiftsUsed);
  const sunsetTax = computeTaxForEstate(grossEstate, totalDeductions, totalGiftingReduction, sunsetExemptionRemaining);
  const currentExemptionRemaining = Math.max(0, CURRENT_EXEMPTION - gifting.lifetimeGiftsUsed);
  const currentTax = computeTaxForEstate(grossEstate, totalDeductions, totalGiftingReduction, currentExemptionRemaining);

  // 10. Gifting analysis
  const taxWithoutGifting = computeTaxForEstate(grossEstate, totalDeductions, 0, lifetimeExemptionRemaining);
  const taxSavingsFromGifting = Math.max(0, taxWithoutGifting - federalEstateTax);

  // 11. Combined strategy savings
  const combinedStrategySavings = ilitSavings + taxSavingsFromGifting;

  // 12. Shrinkage pie
  const shrinkagePie = [
    { label: "Net to Heirs", value: Math.max(0, netToHeirs), color: "#22c55e" },
    { label: "Federal Estate Tax", value: federalEstateTax, color: "#ef4444" },
    { label: "Debts & Expenses", value: deductions.debtsAndMortgages + deductions.funeralExpenses + deductions.adminExpenses, color: "#f59e0b" },
    { label: "Charitable", value: deductions.charitableDeduction, color: "#8b5cf6" },
  ].filter(s => s.value > 0);

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. WEALTH PROJECTIONS TO AGE 100 (8% compound growth)
  // ═══════════════════════════════════════════════════════════════════════════
  const currentYear = new Date().getFullYear();
  const targetAge = 100;
  const yearsToProject = targetAge - currentAge;
  const insuranceCoverage = useILIT ? (assets.lifeInsurance + iulDeathBenefit) : 0;

  const wealthProjections: WealthProjectionYear[] = [];
  let peakTaxAge = currentAge;
  let peakTaxAmount = 0;
  let peakEstateValue = grossEstate;
  let yearsUntilTaxable = -1;
  let ageWhenTaxable = 0;

  for (let i = 0; i <= yearsToProject; i++) {
    const age = currentAge + i;
    const projYear = currentYear + i;
    const growthFactor = Math.pow(1 + growthRate, i);
    const projGross = Math.round(grossEstate * growthFactor);

    // Determine exemption based on projected year
    const projExemption = projYear >= 2026 ? SUNSET_EXEMPTION : CURRENT_EXEMPTION;
    const projExemptionRemaining = Math.max(0, projExemption - gifting.lifetimeGiftsUsed);

    // Cumulative gifting grows each year
    const cumulativeGifts = Math.min(totalAnnualGifts * Math.min(i, gifting.yearsOfGifting), projGross);

    // Calculate tax for this projected year
    const projTax = computeTaxForEstate(projGross, totalDeductions, cumulativeGifts, projExemptionRemaining);
    const projTaxableEstate = Math.max(0, Math.max(0, projGross - totalDeductions) - cumulativeGifts - projExemptionRemaining);
    const projEffRate = projGross > 0 ? projTax / projGross : 0;
    const projNet = projGross - projTax - totalDeductions + insuranceCoverage;

    // Insurance needed to zero out tax
    const insuranceNeeded = projTax;
    const netWithInsurance = projGross - totalDeductions + insuranceCoverage;

    // Track peak tax
    if (projTax > peakTaxAmount) {
      peakTaxAmount = projTax;
      peakTaxAge = age;
      peakEstateValue = projGross;
    }

    // Track when estate first becomes taxable
    if (projTax > 0 && yearsUntilTaxable === -1) {
      yearsUntilTaxable = i;
      ageWhenTaxable = age;
    }

    wealthProjections.push({
      age,
      year: projYear,
      grossEstate: projGross,
      exemption: projExemption,
      taxableEstate: projTaxableEstate,
      estateTax: projTax,
      netToHeirs: Math.round(projNet),
      effectiveRate: Math.round(projEffRate * 10000) / 10000,
      cumulativeGifts: Math.round(cumulativeGifts),
      insuranceNeeded: Math.round(insuranceNeeded),
      insuranceCoverage: Math.round(insuranceCoverage),
      netWithInsurance: Math.round(netWithInsurance),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. INSURANCE NEEDS ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  const coverageNeededToday = federalEstateTax;
  const coverageNeededAtPeak = peakTaxAmount;
  const coverageGap = Math.max(0, coverageNeededAtPeak - insuranceCoverage);

  const insuranceAnalysis = {
    currentCoverage: insuranceCoverage,
    coverageNeededToday,
    coverageNeededAtPeak,
    peakTaxAge,
    peakTaxAmount,
    peakEstateValue,
    coverageGap,
    yearsUntilTaxable: yearsUntilTaxable === -1 ? 999 : yearsUntilTaxable,
    ageWhenTaxable: ageWhenTaxable || 0,
  };

  // Legacy 10-year projections (keep for backward compat)
  const projections = wealthProjections.filter((_, i) => i <= 10).map(p => ({
    year: p.year,
    grossEstate: p.grossEstate,
    exemption: p.exemption,
    taxableEstate: p.taxableEstate,
    estateTax: p.estateTax,
    netToHeirs: p.netToHeirs,
  }));

  return {
    grossEstate,
    assetBreakdown,
    totalDeductions,
    adjustedGrossEstate,
    totalGiftingReduction,
    lifetimeExemptionRemaining,
    exemption,
    taxableEstate,
    tentativeTax,
    unifiedCredit,
    federalEstateTax,
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    bracketBreakdown,
    netToHeirs: Math.round(netToHeirs),
    estateShrinkagePercent: Math.round(estateShrinkagePercent * 100) / 100,
    ilitSavings,
    withoutILIT: { taxableEstate: Math.max(0, Math.max(0, grossWithoutILIT - totalDeductions) - totalGiftingReduction - lifetimeExemptionRemaining), estateTax: taxNoILIT, netToHeirs: Math.round(netNoILIT) },
    withILIT: { taxableEstate: Math.max(0, Math.max(0, grossWithILIT - totalDeductions) - totalGiftingReduction - lifetimeExemptionRemaining), estateTax: taxILIT, netToHeirs: Math.round(netILIT) },
    sunsetAnalysis: {
      currentExemption: CURRENT_EXEMPTION,
      sunsetExemption: SUNSET_EXEMPTION,
      currentTax,
      sunsetTax,
      additionalExposure: Math.max(0, sunsetTax - currentTax),
    },
    giftingAnalysis: {
      annualExclusion: ANNUAL_GIFT_EXCLUSION,
      totalAnnualGifts,
      totalGiftingOverYears,
      estateReduction: totalGiftingReduction,
      taxSavingsFromGifting,
    },
    combinedStrategySavings,
    shrinkagePie,
    wealthProjections,
    insuranceAnalysis,
    projections,
  };
}

export function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function formatFullCurrency(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
