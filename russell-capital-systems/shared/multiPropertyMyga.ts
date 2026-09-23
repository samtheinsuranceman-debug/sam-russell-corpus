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

import { IRMAA_SOURCE, irmaaTier } from "./irmaa";
import { TAX_RULES_2026, federalTax } from "./taxRules";
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

/* ─── IRMAA BRACKETS 2026 ─── */
// The 2026 table (2024 MAGI) lives in shared/irmaa.ts, sourced to SSA POMS
// HI 01101.031. Surcharges here are annual, per enrollee.
function irmaaBracketLabel(tier: number): string {
  return tier === 1 ? "No surcharge" : `Tier ${tier}`;
}

/* ─── WHERE THESE NUMBERS COME FROM ─── */
// The IRMAA table (shared/irmaa.ts), the defaults below, and the shared MYGA, oil and gas
// and HELOC defaults (sourced in mygaWaterfall.ts) are listed here. None of
// these objects is read by the arithmetic.

/** household.federalTaxRate default: the 2026 joint marginal rate on the default $250,000 household. */
const FEDERAL_BRACKET_SOURCE = {
  label: "Internal Revenue Service, 2026 tax inflation adjustments (Rev. Proc. 2025-32 as amended by OBBBA), married filing jointly: 10% to $24,800; 12% to $100,800; 22% to $211,400; 24% to $403,550; 32% to $512,450; 35% to $768,700; 37% above",
  url: "https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill",
  asOf: "tax year 2026, read 2026-09-23",
  note: "The default household is married with $250,000 of income; less the $32,200 joint standard deduction that is $217,800 taxable, in the 24% bracket. The default rate is computed from shared/taxRules.ts, not typed.",
};

const MULTI_PROPERTY_ASSUMPTIONS = [
  { label: "Assumption: default property worth $500,000 with a $200,000 mortgage, entering in year 1, chosen by the firm as an example; no external source" },
  { label: "Assumption: default household income = $250,000, married filing jointly, chosen by the firm as an example; no external source" },
  { label: "Assumption: state income tax rate = 5%, chosen by the firm as a mid-range state rate; no external source" },
  { label: "Assumption: MYGA rate 6.3% compounding, 5-year term, bank advance 70% at 7%, oil and gas 12 years at 15% income with 80% then 8% deductions, 25-year projection, HELOC 7.09% up to 80% of home value; the same defaults as the single-property waterfall; the MYGA and HELOC rates are sourced market readings (see the MYGA waterfall sources), the rest chosen by the firm" },
];

function getIrmaaBracket(magi: number, status: "single" | "married") {
  const t = irmaaTier(magi, status);
  return { partB: t.partBMonthly * 12, partD: t.partDMonthly * 12, tier: irmaaBracketLabel(t.tier) };
}

/** The 2026 marginal federal rate (percent) for a household, from the versioned bracket table. */
function defaultFederalRatePct(income: number, status: "single" | "married"): number {
  const filing = status === "married" ? "joint" : "single";
  const taxable = Math.max(0, income - TAX_RULES_2026.standardDeduction[filing]);
  return Math.round(federalTax(taxable, filing, TAX_RULES_2026).marginalRate * 100);
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
      federalTaxRate: defaultFederalRatePct(250000, "married"), // 24 for 2026 (FEDERAL_BRACKET_SOURCE)
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
  IRMAA_SOURCE,
  FEDERAL_BRACKET_SOURCE,
  ...MULTI_PROPERTY_ASSUMPTIONS,
  ...MYGA_WATERFALL_SOURCES,
];
