/**
 * Multi-Property MYGA Waterfall Engine
 * ─────────────────────────────────────
 * Extends the single-property MYGA waterfall to support up to 150 properties.
 * Each property has its own HELOC → MYGA → O&G → tax savings → HELOC paydown cycle.
 *
 * KEY LOGIC:
 * 1) User adds properties (up to 150), each with: home value, mortgage balance, HELOC rate
 * 2) Each property's HELOC funds a MYGA purchase → bank loan → O&G investment
 * 3) O&G depreciation generates tax savings against household income
 * 4) Tax savings (federal + state) are applied to HELOC principal payments
 * 5) O&G tax credits roll forward to offset future years' income
 * 6) Year-by-year waterfall shows compounding across ALL properties
 */

import {
  runMYGAWaterfall,
  MYGA_WATERFALL_SOURCES,
  type MYGAWaterfallInput,
  type MYGAWaterfallResult,
  type WaterfallYearRow,
} from "./mygaWaterfall";
import { HELOC_RATE_DEFAULT_PCT, MYGA_RATE_DEFAULT_PCT } from "./marketRateDefaults";

/* ─── TYPES ─── */

export interface PropertyInput {
  id: number;
  label: string;
  homeValue: number;
  mortgageBalance: number;
  helocRate: number;
  helocMaxLtv: number;
  /** Optional: custom MYGA rate per property */
  mygaRate?: number;
  /** Year this property enters the strategy (1 = immediately) */
  entryYear: number;
  /** Is this property active in the simulation? */
  active: boolean;
}

export interface HouseholdTaxInput {
  annualIncome: number;
  federalTaxRate: number;
  stateTaxRate: number;
  /** Filing status for IRMAA calculation */
  filingStatus: "single" | "married";
}

export interface MultiPropertyInput {
  properties: PropertyInput[];
  household: HouseholdTaxInput;
  /** Shared MYGA/O&G parameters */
  mygaRate: number;
  mygaTerm: number;
  bankLtv: number;
  bankLoanRate: number;
  oilGasTerm: number;
  oilGasReturnRate: number;
  oilGasDepreciationY1: number;
  oilGasDepreciationOngoing: number;
  projectionYears: number;
  taxDeployment: "payback_heloc" | "pay_bank_interest" | "buy_more_myga" | "pay_bank_principal" | "optimal_blend";
}

export interface PropertyYearRow {
  propertyId: number;
  propertyLabel: string;
  year: number;
  helocStartBalance: number;
  helocInterestPaid: number;
  helocPrincipalPaid: number;
  helocEndBalance: number;
  mygaValue: number;
  mygaInterest: number;
  bankLoanBalance: number;
  bankInterestPaid: number;
  ogIncome: number;
  ogDepreciation: number;
  taxSavingsApplied: number;
  netCashFlow: number;
}

export interface ConsolidatedYearRow {
  year: number;
  /** Total across all active properties */
  totalHelocBalance: number;
  totalHelocInterest: number;
  totalHelocPrincipalPaid: number;
  totalMygaValue: number;
  totalMygaInterest: number;
  totalBankLoanBalance: number;
  totalBankInterest: number;
  totalOGIncome: number;
  totalOGDepreciation: number;
  /** Household-level tax calculations */
  householdIncome: number;
  ogDeductionApplied: number;
  taxableIncomeReduction: number;
  federalTaxSaved: number;
  stateTaxSaved: number;
  totalTaxSaved: number;
  /** Carryforward O&G credits from prior years */
  creditCarryforwardIn: number;
  creditUsedThisYear: number;
  creditCarryforwardOut: number;
  /** Tax savings applied to HELOC principal */
  taxSavingsToHelocPrincipal: number;
  /** Net position */
  totalNetCashFlow: number;
  cumulativeTaxSaved: number;
  cumulativeHelocPrincipalPaid: number;
  /** Per-property detail */
  propertyDetails: PropertyYearRow[];
  /** Number of active properties this year */
  activePropertyCount: number;
  /** Number of properties with HELOC fully paid off */
  paidOffPropertyCount: number;
}

export interface MultiPropertyResult {
  consolidatedProjection: ConsolidatedYearRow[];
  perPropertyResults: Map<number, MYGAWaterfallResult>;
  summary: {
    totalProperties: number;
    totalHelocOriginal: number;
    totalHelocRemaining: number;
    totalMygaValue: number;
    totalOGIncome: number;
    totalTaxSaved: number;
    totalHelocPrincipalPaid: number;
    averagePayoffYear: number | null;
    propertiesPaidOff: number;
    totalNetBenefit: number;
    /** Year-by-year IRMAA impact from income changes */
    irmaaImpact: IrmaaYearImpact[];
  };
}

export interface IrmaaYearImpact {
  year: number;
  magi: number;
  adjustedMagi: number;
  partBSurcharge: number;
  partDSurcharge: number;
  totalSurcharge: number;
  surchargeReduction: number;
  tier: string;
  adjustedTier: string;
}

/* ─── IRMAA BRACKETS 2025 ─── */
const IRMAA_BRACKETS = {
  single: [
    { maxMAGI: 106000, partB: 0, partD: 0, tier: "No surcharge" },
    { maxMAGI: 133000, partB: 70.90 * 12, partD: 13.70 * 12, tier: "Tier 1" },
    { maxMAGI: 167000, partB: 176.40 * 12, partD: 35.50 * 12, tier: "Tier 2" },
    { maxMAGI: 200000, partB: 281.90 * 12, partD: 57.30 * 12, tier: "Tier 3" },
    { maxMAGI: 500000, partB: 387.30 * 12, partD: 79.00 * 12, tier: "Tier 4" },
    { maxMAGI: Infinity, partB: 422.00 * 12, partD: 85.80 * 12, tier: "Tier 5" },
  ],
  married: [
    { maxMAGI: 212000, partB: 0, partD: 0, tier: "No surcharge" },
    { maxMAGI: 266000, partB: 70.90 * 12, partD: 13.70 * 12, tier: "Tier 1" },
    { maxMAGI: 334000, partB: 176.40 * 12, partD: 35.50 * 12, tier: "Tier 2" },
    { maxMAGI: 400000, partB: 281.90 * 12, partD: 57.30 * 12, tier: "Tier 3" },
    { maxMAGI: 750000, partB: 387.30 * 12, partD: 79.00 * 12, tier: "Tier 4" },
    { maxMAGI: Infinity, partB: 422.00 * 12, partD: 85.80 * 12, tier: "Tier 5" },
  ],
};

/* ─── WHERE THESE NUMBERS COME FROM ─── */
// The IRMAA table above, the defaults below, and the shared MYGA, oil and gas
// and HELOC defaults (sourced in mygaWaterfall.ts) are listed here. None of
// these objects is read by the arithmetic.

/** IRMAA_BRACKETS: the 2025 table the code is labelled with. Thresholds match; several dollar amounts do not. */
const IRMAA_2025_SOURCE = {
  label: "Centers for Medicare & Medicaid Services, 2025 Medicare Parts A & B Premiums and Deductibles fact sheet, Part B and Part D income-related monthly adjustment amount tables",
  url: "https://www.cms.gov/newsroom/fact-sheets/2025-medicare-parts-b-premiums-and-deductibles",
  asOf: "2025 premium year, released 2024-11-08, read 2026-09-23",
  note: "Income thresholds ($106,000/$133,000/$167,000/$200,000/$500,000 single; $212,000/$266,000/$334,000/$400,000/$750,000 joint) match the code. Part B monthly adjustments in CMS are $74.00, $185.00, $295.90, $406.90, $443.90; the code has $70.90, $176.40, $281.90, $387.30, $422.00. Part D monthly adjustments in CMS are $13.70, $35.30, $57.00, $78.60, $85.80; the code has $13.70, $35.50, $57.30, $79.00, $85.80. CMS puts MAGI of exactly $500,000 ($750,000 joint) in the top tier; the code puts it in tier 4. Not changed; flagged for review.",
};
const IRMAA_2026_SOURCE = {
  label: "Social Security Administration, POMS HI 01101.020, IRMAA Sliding Scale Tables, current table based on 2024 MAGI (the 2026 premium year): surcharges begin above $109,000 (single) and $218,000 (joint)",
  url: "https://secure.ssa.gov/poms.nsf/lnx/0601101020",
  asOf: "POMS revision 2025-12-02, read 2026-09-23",
  note: "The code carries the 2025 table; 2026 is the current premium year and its thresholds and amounts are higher.",
};

/** household.federalTaxRate default 32 (percent) against household.annualIncome default $250,000, married. */
const FEDERAL_BRACKET_SOURCE = {
  label: "Internal Revenue Service, Rev. Proc. 2025-32, Section 4.01, 2026 tax rate tables: 24% applies to joint taxable income over $211,400 and 32% over $403,550",
  url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf",
  asOf: "tax year 2026, published 2025-10-09, read 2026-09-23",
  note: "The default household is married with $250,000 of income, which falls in the 24% joint bracket for 2026, not the 32% default. Not changed; flagged for review.",
};

const MULTI_PROPERTY_ASSUMPTIONS = [
  { label: "Assumption: default property worth $500,000 with a $200,000 mortgage, entering in year 1, chosen by the firm as an example; no external source" },
  { label: "Assumption: default household income = $250,000, married filing jointly, chosen by the firm as an example; no external source" },
  { label: "Assumption: state income tax rate = 5%, chosen by the firm as a mid-range state rate; no external source" },
  { label: "Assumption: MYGA rate 6.3% compounding, 5-year term, bank advance 70% at 7%, oil and gas 12 years at 15% income with 80% then 8% deductions, 25-year projection, HELOC 7.09% up to 80% of home value; the same defaults as the single-property waterfall; the MYGA and HELOC rates are sourced market readings (see the MYGA waterfall sources), the rest chosen by the firm" },
];

function getIrmaaBracket(magi: number, status: "single" | "married") {
  const brackets = IRMAA_BRACKETS[status];
  for (const b of brackets) {
    if (magi <= b.maxMAGI) return b;
  }
  return brackets[brackets.length - 1];
}

/* ─── DEFAULT PROPERTY ─── */
export function createDefaultProperty(id: number): PropertyInput {
  return {
    id,
    label: `Property ${id}`,
    homeValue: 500000,
    mortgageBalance: 200000,
    helocRate: HELOC_RATE_DEFAULT_PCT,
    helocMaxLtv: 0.80,
    entryYear: 1,
    active: true,
  };
}

export function getDefaultMultiPropertyInput(): MultiPropertyInput {
  return {
    properties: [createDefaultProperty(1)],
    household: {
      annualIncome: 250000,
      federalTaxRate: 32,
      stateTaxRate: 5,
      filingStatus: "married",
    },
    mygaRate: MYGA_RATE_DEFAULT_PCT,
    mygaTerm: 5,
    bankLtv: 0.70,
    bankLoanRate: 7,
    oilGasTerm: 12,
    oilGasReturnRate: 15,
    oilGasDepreciationY1: 80,
    oilGasDepreciationOngoing: 8,
    projectionYears: 25,
    taxDeployment: "payback_heloc",
  };
}

/* ─── MULTI-PROPERTY ENGINE ─── */
export function runMultiPropertyMyga(input: MultiPropertyInput): MultiPropertyResult {
  const {
    properties, household, mygaRate, mygaTerm, bankLtv, bankLoanRate,
    oilGasTerm, oilGasReturnRate, oilGasDepreciationY1, oilGasDepreciationOngoing,
    projectionYears, taxDeployment,
  } = input;

  const activeProperties = properties.filter(p => p.active);
  const combinedTaxRate = (household.federalTaxRate + household.stateTaxRate) / 100;
  const fedRate = household.federalTaxRate / 100;
  const stateRate = household.stateTaxRate / 100;

  // Run individual waterfall for each property
  const perPropertyResults = new Map<number, MYGAWaterfallResult>();
  for (const prop of activeProperties) {
    const propInput: MYGAWaterfallInput = {
      mygaPremium: Math.max(0, prop.homeValue * prop.helocMaxLtv - prop.mortgageBalance),
      mygaRate: prop.mygaRate ?? mygaRate,
      mygaTerm,
      bankLtv,
      bankLoanRate,
      bankLoanTerm: mygaTerm,
      oilGasTerm,
      oilGasReturnRate,
      oilGasDepreciationY1,
      oilGasDepreciationOngoing,
      projectionYears: Math.max(1, projectionYears - prop.entryYear + 1),
      cashEquivalents: { cds: 0, moneyMarkets: 0, checking: 0, savings: 0 },
      additionalMygaPerCycle: 0,
      annualIncome: household.annualIncome,
      federalTaxRate: household.federalTaxRate,
      stateTaxRate: household.stateTaxRate,
      homeValue: prop.homeValue,
      mortgageBalance: prop.mortgageBalance,
      helocRate: prop.helocRate,
      helocMaxLtv: prop.helocMaxLtv,
      taxDeployment: "payback_heloc", // Each property pays its own HELOC first
    };
    perPropertyResults.set(prop.id, runMYGAWaterfall(propInput));
  }

  // ─── Consolidated Year-by-Year Projection ───
  const consolidated: ConsolidatedYearRow[] = [];
  let creditCarryforward = 0;
  let cumulativeTaxSaved = 0;
  let cumulativeHelocPrincipal = 0;

  // Track HELOC balances per property (for tax savings allocation)
  const helocBalances = new Map<number, number>();
  for (const prop of activeProperties) {
    const helocAmount = Math.max(0, prop.homeValue * prop.helocMaxLtv - prop.mortgageBalance);
    helocBalances.set(prop.id, helocAmount);
  }

  const irmaaImpact: IrmaaYearImpact[] = [];

  for (let year = 1; year <= projectionYears; year++) {
    const propertyDetails: PropertyYearRow[] = [];
    let totalHelocBalance = 0;
    let totalHelocInterest = 0;
    let totalHelocPrincipalPaid = 0;
    let totalMygaValue = 0;
    let totalMygaInterest = 0;
    let totalBankLoanBalance = 0;
    let totalBankInterest = 0;
    let totalOGIncome = 0;
    let totalOGDepreciation = 0;
    let totalNetCashFlow = 0;
    let activeCount = 0;
    let paidOffCount = 0;

    for (const prop of activeProperties) {
      if (year < prop.entryYear) continue;
      activeCount++;

      const result = perPropertyResults.get(prop.id);
      if (!result) continue;

      const propYear = year - prop.entryYear + 1;
      const row = result.projection[propYear - 1];
      if (!row) continue;

      const helocBal = helocBalances.get(prop.id) ?? 0;
      const helocInterest = helocBal * (prop.helocRate / 100);

      propertyDetails.push({
        propertyId: prop.id,
        propertyLabel: prop.label,
        year,
        helocStartBalance: helocBal,
        helocInterestPaid: helocInterest,
        helocPrincipalPaid: row.helocPrincipalPaid,
        helocEndBalance: row.helocBalance,
        mygaValue: row.mygaEndValue,
        mygaInterest: row.mygaInterestEarned,
        bankLoanBalance: row.bankLoanEndBalance,
        bankInterestPaid: row.bankLoanInterestPaid,
        ogIncome: row.oilGasIncome,
        ogDepreciation: row.oilGasDepreciation,
        taxSavingsApplied: row.taxSavings,
        netCashFlow: row.netCashFlow,
      });

      totalHelocBalance += row.helocBalance;
      totalHelocInterest += helocInterest;
      totalHelocPrincipalPaid += row.helocPrincipalPaid;
      totalMygaValue += row.mygaEndValue;
      totalMygaInterest += row.mygaInterestEarned;
      totalBankLoanBalance += row.bankLoanEndBalance;
      totalBankInterest += row.bankLoanInterestPaid;
      totalOGIncome += row.oilGasIncome;
      totalOGDepreciation += row.oilGasDepreciation;
      totalNetCashFlow += row.netCashFlow;

      // Update HELOC balance tracking
      helocBalances.set(prop.id, row.helocBalance);
      if (row.helocBalance <= 0) paidOffCount++;
    }

    // ─── Household-Level Tax Calculations ───
    // Total O&G depreciation across all properties reduces taxable income
    const totalDeduction = totalOGDepreciation + creditCarryforward;
    const effectiveDeduction = Math.min(totalDeduction, household.annualIncome);
    const unusedDeduction = totalDeduction - effectiveDeduction;
    
    const taxableIncomeReduction = effectiveDeduction;
    const federalTaxSaved = taxableIncomeReduction * fedRate;
    const stateTaxSaved = taxableIncomeReduction * stateRate;
    const totalTaxSaved = federalTaxSaved + stateTaxSaved;

    // Carryforward unused credits
    const creditOut = unusedDeduction;
    
    cumulativeTaxSaved += totalTaxSaved;

    // ─── Apply Tax Savings to HELOC Principal ───
    // Distribute tax savings proportionally across properties with remaining HELOC balance
    let taxSavingsToHeloc = 0;
    if (taxDeployment === "payback_heloc" || taxDeployment === "optimal_blend") {
      let remaining = totalTaxSaved;
      const propsWithHeloc = activeProperties
        .filter(p => year >= p.entryYear && (helocBalances.get(p.id) ?? 0) > 0)
        .sort((a, b) => (helocBalances.get(a.id) ?? 0) - (helocBalances.get(b.id) ?? 0)); // Smallest first

      for (const prop of propsWithHeloc) {
        if (remaining <= 0) break;
        const bal = helocBalances.get(prop.id) ?? 0;
        const payment = Math.min(remaining, bal);
        helocBalances.set(prop.id, bal - payment);
        remaining -= payment;
        taxSavingsToHeloc += payment;
      }
    }
    cumulativeHelocPrincipal += totalHelocPrincipalPaid + taxSavingsToHeloc;

    // ─── IRMAA Impact ───
    const originalBracket = getIrmaaBracket(household.annualIncome, household.filingStatus);
    const adjustedMagi = Math.max(0, household.annualIncome - taxableIncomeReduction);
    const adjustedBracket = getIrmaaBracket(adjustedMagi, household.filingStatus);
    
    irmaaImpact.push({
      year,
      magi: household.annualIncome,
      adjustedMagi,
      partBSurcharge: originalBracket.partB,
      partDSurcharge: originalBracket.partD,
      totalSurcharge: originalBracket.partB + originalBracket.partD,
      surchargeReduction: (originalBracket.partB + originalBracket.partD) - (adjustedBracket.partB + adjustedBracket.partD),
      tier: originalBracket.tier,
      adjustedTier: adjustedBracket.tier,
    });

    consolidated.push({
      year,
      totalHelocBalance,
      totalHelocInterest,
      totalHelocPrincipalPaid: totalHelocPrincipalPaid + taxSavingsToHeloc,
      totalMygaValue,
      totalMygaInterest,
      totalBankLoanBalance,
      totalBankInterest,
      totalOGIncome,
      totalOGDepreciation,
      householdIncome: household.annualIncome,
      ogDeductionApplied: effectiveDeduction,
      taxableIncomeReduction,
      federalTaxSaved,
      stateTaxSaved,
      totalTaxSaved,
      creditCarryforwardIn: creditCarryforward,
      creditUsedThisYear: effectiveDeduction,
      creditCarryforwardOut: creditOut,
      taxSavingsToHelocPrincipal: taxSavingsToHeloc,
      totalNetCashFlow,
      cumulativeTaxSaved,
      cumulativeHelocPrincipalPaid: cumulativeHelocPrincipal,
      propertyDetails,
      activePropertyCount: activeCount,
      paidOffPropertyCount: paidOffCount,
    });

    creditCarryforward = creditOut;
  }

  // ─── Summary ───
  const totalHelocOriginal = activeProperties.reduce((sum, p) => {
    return sum + Math.max(0, p.homeValue * p.helocMaxLtv - p.mortgageBalance);
  }, 0);

  const lastYear = consolidated[consolidated.length - 1];
  const payoffYears = activeProperties
    .map(p => {
      const result = perPropertyResults.get(p.id);
      return result?.summary.helocPayoffYear ?? null;
    })
    .filter((y): y is number => y !== null);

  return {
    consolidatedProjection: consolidated,
    perPropertyResults,
    summary: {
      totalProperties: activeProperties.length,
      totalHelocOriginal,
      totalHelocRemaining: lastYear?.totalHelocBalance ?? 0,
      totalMygaValue: lastYear?.totalMygaValue ?? 0,
      totalOGIncome: consolidated.reduce((s, r) => s + r.totalOGIncome, 0),
      totalTaxSaved: cumulativeTaxSaved,
      totalHelocPrincipalPaid: cumulativeHelocPrincipal,
      averagePayoffYear: payoffYears.length > 0
        ? Math.round(payoffYears.reduce((s, y) => s + y, 0) / payoffYears.length)
        : null,
      propertiesPaidOff: lastYear?.paidOffPropertyCount ?? 0,
      totalNetBenefit: cumulativeTaxSaved + (totalHelocOriginal - (lastYear?.totalHelocBalance ?? 0)),
      irmaaImpact,
    },
  };
}

/* ─── SOURCES ─── */

/** Every source and declared assumption behind the typed-in numbers in this engine, for the page to print. */
export const MULTI_PROPERTY_MYGA_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  IRMAA_2025_SOURCE,
  IRMAA_2026_SOURCE,
  FEDERAL_BRACKET_SOURCE,
  ...MULTI_PROPERTY_ASSUMPTIONS,
  ...MYGA_WATERFALL_SOURCES,
];
