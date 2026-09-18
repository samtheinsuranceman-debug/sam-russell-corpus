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
  type MYGAWaterfallInput,
  type MYGAWaterfallResult,
  type WaterfallYearRow,
} from "./mygaWaterfall";

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
    helocRate: 8.5,
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
    mygaRate: 7,
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
