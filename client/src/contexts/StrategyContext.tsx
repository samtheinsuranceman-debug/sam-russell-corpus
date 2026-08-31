// @ts-nocheck
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/**
 * StrategyContext — Cross-tool integration framework.
 *
 * Any calculator/projection tool can "publish" its results here,
 * and any other tool can "consume" them to pre-fill inputs or
 * chain strategies together.
 *
 * v2: Expanded with ALL calculator types, 5-slot comparison, and sync bar.
 */

// ── Typed strategy result shapes ─────────────────────────────────────────────

export interface MortgageKillerResult {
  interestSaved: number;
  yearsReduced: number;
  iulCashValue: number;
  iulDeathBenefit: number;
  totalOpportunityCost: number;
  monthlyPayment: number;
  originalBalance: number;
  helocUsed: boolean;
  helocAmount: number;
}

export interface IULProjectionResult {
  cashValue: number;
  deathBenefit: number;
  surrenderValue: number;
  annualPremium: number;
  years: number;
  avgReturn: number;
  projectionData: Array<{ year: number; cashValue: number; deathBenefit: number }>;
}

export interface RothConversionResult {
  totalConverted: number;
  taxPaid: number;
  endingRothBalance: number;
  endingIraBalance: number;
  yearsOfConversion: number;
  targetBracket: number;
  irmaaSurcharge: number;
  ladderData: Array<{ year: number; conversion: number; tax: number; iraBalance: number; rothBalance: number }>;
}

export interface MYGAWaterfallResult {
  totalMygaValue: number;
  totalOilGasValue: number;
  netWealth: number;
  mygaRate: number;
  cycles: number;
  annualTaxSavings: number;
  projectionData: Array<{ year: number; mygaValue: number; oilGasValue: number; netWealth: number }>;
}

export interface TaxWaterfallResult {
  effectiveRate: number;
  totalTaxSaved: number;
  bracketReduction: string;
  deductions: Array<{ source: string; amount: number }>;
}

export interface RetirementIncomeResult {
  monthlyIncome: number;
  annualIncome: number;
  incomeGap: number;
  socialSecurity: number;
  pensionIncome: number;
  annuityIncome: number;
  portfolioWithdrawal: number;
  yearsOfIncome: number;
}

export interface PremiumFinancingResult {
  loanAmount: number;
  annualLoanCost: number;
  breakEvenYear: number;
  netBenefit: number;
  deathBenefitLeverage: number;
  cashValueAtBreakEven: number;
}

export interface RealEstateMogulResult {
  totalEquity: number;
  cashFlow: number;
  appreciation: number;
  properties: number;
  leverageRatio: number;
  projectionData: Array<{ year: number; equity: number; cashFlow: number }>;
}

export interface InflationResult {
  currentPurchasingPower: number;
  futureValue: number;
  inflationRate: number;
  yearsProjected: number;
  realReturn: number;
}

// ── NEW: Additional calculator result types ──────────────────────────────────

export interface SocialSecurityResult {
  monthlyBenefitAge62: number;
  monthlyBenefitFRA: number;
  monthlyBenefitAge70: number;
  optimalClaimAge: number;
  lifetimeValueDifference: number;
  breakEvenAge: number;
  spousalBenefit: number;
}

export interface AnnuityIncomeResult {
  guaranteedMonthlyIncome: number;
  guaranteedAnnualIncome: number;
  accumulationValue: number;
  incomeStartAge: number;
  rollUpRate: number;
  withdrawalRate: number;
  lifetimeIncomeTotal: number;
}

export interface EstateTaxResult {
  grossEstate: number;
  taxableEstate: number;
  estateTaxOwed: number;
  effectiveEstateTaxRate: number;
  exemptionUsed: number;
  strategySavings: number;
  netToHeirs: number;
}

export interface FIACollateralResult {
  fiaAccountValue: number;
  collateralLoanAmount: number;
  netArbitrage: number;
  annualCrediting: number;
  loanInterestRate: number;
  projectionData: Array<{ year: number; accountValue: number; loanBalance: number; netValue: number }>;
}

export interface HotIncomeResult {
  totalAnnualIncome: number;
  taxFreeIncome: number;
  taxableIncome: number;
  incomeStreams: Array<{ source: string; amount: number; taxFree: boolean }>;
  effectiveTaxRate: number;
}

export interface TimeMachineResult {
  ag49CompliantReturn: number;
  historicalReturn: number;
  cashValueYear20: number;
  deathBenefitYear20: number;
  totalPremiumsPaid: number;
  internalRateOfReturn: number;
  projectionData: Array<{ year: number; cashValue: number; deathBenefit: number }>;
}

export interface LifetimeIncomeResult {
  totalGuaranteedIncome: number;
  incomeStartAge: number;
  monthlyIncome: number;
  annualIncome: number;
  incomeDuration: number;
  principalProtected: boolean;
}

export interface BlackMirrorResult {
  doNothingOutcome: number;
  withStrategyOutcome: number;
  netDifference: number;
  yearsAnalyzed: number;
  riskScore: number;
}

export interface EndgameResult {
  totalWealth: number;
  taxFreeWealth: number;
  legacyValue: number;
  incomeReplacement: number;
  protectionScore: number;
}

export interface DynamicTaxResult {
  yearlyProjection: Array<{
    year: number;
    grossIncome: number;
    taxableIncome: number;
    federalTax: number;
    marginalRate: number;
    effectiveRate: number;
    ogDeductions: number;
    taxSavings: number;
  }>;
  totalTaxSaved: number;
  averageEffectiveRate: number;
  bracketChanges: number;
}

export interface AdvisorIncomeResult {
  annualGrossIncome: number;
  annualNetIncome: number;
  effectiveTaxRate: number;
  retirementContributions: number;
  businessExpenses: number;
}

export interface LiveCoPilotResult {
  conversationsCount: number;
  topicsDiscussed: string[];
  insightsGenerated: number;
  closingScriptUsed: boolean;
  confidenceScore: number;
}

export interface SocialNarcoticResult {
  contentShared: number;
  influenceScore: number;
  memesCreated: number;
  bragsPosted: number;
  audienceReach: number;
}

export interface WarRoomResult {
  storiesShared: number;
  challengesCompleted: number;
  predictionsAccuracy: number;
  communityRank: number;
  warScore: number;
}

// ── Union of ALL strategy types ──────────────────────────────────────────────

export type StrategyType =
  | "mortgage-killer"
  | "iul-projection"
  | "roth-conversion"
  | "myga-waterfall"
  | "tax-waterfall"
  | "retirement-income"
  | "premium-financing"
  | "real-estate-mogul"
  | "inflation-analysis"
  | "social-security"
  | "annuity-income"
  | "estate-tax"
  | "fia-collateral"
  | "hot-income"
  | "time-machine"
  | "lifetime-income"
  | "black-mirror"
  | "endgame"
  | "dynamic-tax"
  | "advisor-income"
  | "live-copilot"
  | "social-narcotic"
  | "war-room";

export type StrategyResult =
  | { type: "mortgage-killer"; data: MortgageKillerResult }
  | { type: "iul-projection"; data: IULProjectionResult }
  | { type: "roth-conversion"; data: RothConversionResult }
  | { type: "myga-waterfall"; data: MYGAWaterfallResult }
  | { type: "tax-waterfall"; data: TaxWaterfallResult }
  | { type: "retirement-income"; data: RetirementIncomeResult }
  | { type: "premium-financing"; data: PremiumFinancingResult }
  | { type: "real-estate-mogul"; data: RealEstateMogulResult }
  | { type: "inflation-analysis"; data: InflationResult }
  | { type: "social-security"; data: SocialSecurityResult }
  | { type: "annuity-income"; data: AnnuityIncomeResult }
  | { type: "estate-tax"; data: EstateTaxResult }
  | { type: "fia-collateral"; data: FIACollateralResult }
  | { type: "hot-income"; data: HotIncomeResult }
  | { type: "time-machine"; data: TimeMachineResult }
  | { type: "lifetime-income"; data: LifetimeIncomeResult }
  | { type: "black-mirror"; data: BlackMirrorResult }
  | { type: "endgame"; data: EndgameResult }
  | { type: "dynamic-tax"; data: DynamicTaxResult }
  | { type: "advisor-income"; data: AdvisorIncomeResult }
  | { type: "live-copilot"; data: LiveCoPilotResult }
  | { type: "social-narcotic"; data: SocialNarcoticResult }
  | { type: "war-room"; data: WarRoomResult };

// ── Cross-tool data flow definitions ─────────────────────────────────────────

export interface DataFlowLink {
  from: StrategyType;
  to: StrategyType;
  label: string;
  description: string;
  mapData: (source: any) => Record<string, any>;
}

export const DATA_FLOW_LINKS: DataFlowLink[] = [
  // Original flows
  {
    from: "mortgage-killer",
    to: "myga-waterfall",
    label: "Interest Saved → MYGA Principal",
    description: "Use mortgage interest savings as the initial MYGA investment to compound through the waterfall strategy.",
    mapData: (src: MortgageKillerResult) => ({ initialInvestment: src.interestSaved, source: "Mortgage Interest Saved" }),
  },
  {
    from: "mortgage-killer",
    to: "tax-waterfall",
    label: "HELOC Interest → Tax Deductions",
    description: "HELOC interest payments may be tax-deductible, feeding into your tax optimization waterfall.",
    mapData: (src: MortgageKillerResult) => ({ helocDeduction: src.helocAmount * 0.085, source: "Mortgage Killer HELOC" }),
  },
  {
    from: "iul-projection",
    to: "premium-financing",
    label: "Cash Value → Loan Collateral",
    description: "Use projected IUL cash value as collateral basis for premium financing analysis.",
    mapData: (src: IULProjectionResult) => ({ collateralValue: src.cashValue, annualPremium: src.annualPremium }),
  },
  {
    from: "iul-projection",
    to: "retirement-income",
    label: "Cash Value → Retirement Income",
    description: "IUL cash value distributions supplement retirement income projections.",
    mapData: (src: IULProjectionResult) => ({ iulIncome: src.cashValue * 0.04, source: "IUL Policy Distributions" }),
  },
  {
    from: "roth-conversion",
    to: "tax-waterfall",
    label: "Conversion → Tax Bracket Impact",
    description: "Roth conversion amounts directly impact your tax bracket waterfall analysis.",
    mapData: (src: RothConversionResult) => ({ conversionIncome: src.totalConverted / src.yearsOfConversion, targetBracket: src.targetBracket }),
  },
  {
    from: "roth-conversion",
    to: "retirement-income",
    label: "Roth Balance → Tax-Free Income",
    description: "Ending Roth balance provides tax-free retirement income, improving income projections.",
    mapData: (src: RothConversionResult) => ({ rothIncome: src.endingRothBalance * 0.04, taxFree: true }),
  },
  {
    from: "myga-waterfall",
    to: "tax-waterfall",
    label: "O&G Deductions → Tax Savings",
    description: "Oil & gas depreciation deductions from the MYGA waterfall feed into tax savings calculations.",
    mapData: (src: MYGAWaterfallResult) => ({ oilGasDeduction: src.annualTaxSavings, source: "MYGA Waterfall O&G" }),
  },
  {
    from: "myga-waterfall",
    to: "retirement-income",
    label: "MYGA Income → Guaranteed Income",
    description: "MYGA guaranteed returns provide a reliable income floor for retirement projections.",
    mapData: (src: MYGAWaterfallResult) => ({ mygaIncome: src.totalMygaValue * (src.mygaRate / 100), guaranteed: true }),
  },
  {
    from: "retirement-income",
    to: "inflation-analysis",
    label: "Income Need → Inflation Impact",
    description: "Analyze how inflation erodes your projected retirement income over time.",
    mapData: (src: RetirementIncomeResult) => ({ baseIncome: src.annualIncome, incomeGap: src.incomeGap }),
  },
  {
    from: "real-estate-mogul",
    to: "retirement-income",
    label: "Cash Flow → Retirement Income",
    description: "Real estate cash flow supplements retirement income projections.",
    mapData: (src: RealEstateMogulResult) => ({ realEstateIncome: src.cashFlow, source: "Real Estate Portfolio" }),
  },
  {
    from: "premium-financing",
    to: "iul-projection",
    label: "Financed Premium → IUL Growth",
    description: "Premium financing loan feeds into IUL projection to model leveraged growth.",
    mapData: (src: PremiumFinancingResult) => ({ annualPremium: src.loanAmount / 10, leveraged: true }),
  },
  // NEW: Extended cross-calculator flows
  {
    from: "social-security",
    to: "retirement-income",
    label: "SS Benefit → Retirement Income",
    description: "Social Security claiming strategy feeds into total retirement income projections.",
    mapData: (src: SocialSecurityResult) => ({ socialSecurity: src.monthlyBenefitFRA * 12, claimAge: src.optimalClaimAge }),
  },
  {
    from: "social-security",
    to: "roth-conversion",
    label: "SS Gap Years → Conversion Window",
    description: "Years before SS starts are optimal Roth conversion windows with lower income.",
    mapData: (src: SocialSecurityResult) => ({ gapYears: src.optimalClaimAge - 62, lowerIncomeWindow: true }),
  },
  {
    from: "annuity-income",
    to: "retirement-income",
    label: "Annuity Income → Guaranteed Floor",
    description: "Guaranteed annuity income provides a reliable floor for retirement projections.",
    mapData: (src: AnnuityIncomeResult) => ({ annuityIncome: src.guaranteedAnnualIncome, guaranteed: true }),
  },
  {
    from: "annuity-income",
    to: "tax-waterfall",
    label: "Annuity Income → Tax Impact",
    description: "Annuity distributions create taxable income affecting bracket positioning.",
    mapData: (src: AnnuityIncomeResult) => ({ annuityTaxableIncome: src.guaranteedAnnualIncome * 0.85 }),
  },
  {
    from: "estate-tax",
    to: "iul-projection",
    label: "Estate Tax → IUL Need",
    description: "Estate tax liability determines the death benefit needed from IUL coverage.",
    mapData: (src: EstateTaxResult) => ({ targetDeathBenefit: src.estateTaxOwed, estatePlanning: true }),
  },
  {
    from: "fia-collateral",
    to: "premium-financing",
    label: "FIA Value → Collateral",
    description: "FIA account value serves as collateral for premium financing strategies.",
    mapData: (src: FIACollateralResult) => ({ collateralValue: src.fiaAccountValue, arbitrageRate: src.netArbitrage }),
  },
  {
    from: "hot-income",
    to: "tax-waterfall",
    label: "Income Mix → Tax Optimization",
    description: "Tax-free vs taxable income mix from HOT Income feeds into tax bracket optimization.",
    mapData: (src: HotIncomeResult) => ({ taxFreeIncome: src.taxFreeIncome, taxableIncome: src.taxableIncome }),
  },
  {
    from: "hot-income",
    to: "retirement-income",
    label: "HOT Income → Retirement Floor",
    description: "Combined income streams from HOT Income supplement retirement projections.",
    mapData: (src: HotIncomeResult) => ({ hotIncome: src.totalAnnualIncome, taxFreeRatio: src.taxFreeIncome / src.totalAnnualIncome }),
  },
  {
    from: "time-machine",
    to: "iul-projection",
    label: "AG49 Returns → IUL Projection",
    description: "Time Machine AG49-compliant returns feed into IUL projection modeling.",
    mapData: (src: TimeMachineResult) => ({ avgReturn: src.ag49CompliantReturn, cashValue: src.cashValueYear20 }),
  },
  {
    from: "time-machine",
    to: "premium-financing",
    label: "Cash Value → Financing Basis",
    description: "Time Machine projected cash values inform premium financing collateral.",
    mapData: (src: TimeMachineResult) => ({ projectedCashValue: src.cashValueYear20, irr: src.internalRateOfReturn }),
  },
  {
    from: "lifetime-income",
    to: "retirement-income",
    label: "Lifetime Income → Income Floor",
    description: "Guaranteed lifetime income provides a protected floor for retirement.",
    mapData: (src: LifetimeIncomeResult) => ({ guaranteedIncome: src.annualIncome, protected: src.principalProtected }),
  },
  {
    from: "dynamic-tax",
    to: "tax-waterfall",
    label: "Dynamic Brackets → Tax Strategy",
    description: "Year-over-year bracket projections inform the tax optimization waterfall.",
    mapData: (src: DynamicTaxResult) => ({ projectedSavings: src.totalTaxSaved, bracketChanges: src.bracketChanges }),
  },
  {
    from: "dynamic-tax",
    to: "roth-conversion",
    label: "Low-Bracket Years → Conversion Timing",
    description: "Dynamic tax projections identify optimal low-bracket years for Roth conversions.",
    mapData: (src: DynamicTaxResult) => ({
      lowBracketYears: src.yearlyProjection.filter(y => y.marginalRate <= 0.22).map(y => y.year),
      averageRate: src.averageEffectiveRate,
    }),
  },
  {
    from: "myga-waterfall",
    to: "dynamic-tax",
    label: "O&G Schedule → Dynamic Brackets",
    description: "O&G depreciation schedule from MYGA waterfall feeds into dynamic tax bracket projections.",
    mapData: (src: MYGAWaterfallResult) => ({ annualOGDeduction: src.annualTaxSavings / 0.37, cycles: src.cycles }),
  },
  {
    from: "mortgage-killer",
    to: "dynamic-tax",
    label: "Interest Deduction → Bracket Impact",
    description: "Mortgage interest deductions affect year-over-year bracket positioning.",
    mapData: (src: MortgageKillerResult) => ({ interestDeduction: src.originalBalance * 0.065, helocDeduction: src.helocAmount * 0.085 }),
  },
];

// ── 5-Slot Comparison System ─────────────────────────────────────────────────

export interface ComparisonSlot {
  id: number;
  strategyType: StrategyType | null;
  label: string;
  data: any | null;
  /** 20-year projection data for this slot */
  projection: ComparisonProjectionYear[] | null;
  color: string;
}

export interface ComparisonProjectionYear {
  year: number;
  netPositive: number;
  interestPaid: number;
  interestSaved: number;
  equityBuilt: number;
  taxSavings: number;
  cashValue: number;
  deathBenefit: number;
  incomeGenerated: number;
  opportunityCost: number;
  cumulativeNetPositive: number;
}

export interface ComparisonSummary {
  slotId: number;
  label: string;
  strategyType: StrategyType;
  totalNetPositive: number;
  totalInterestPaid: number;
  totalInterestSaved: number;
  totalEquityBuilt: number;
  totalTaxSavings: number;
  finalCashValue: number;
  finalDeathBenefit: number;
  totalIncomeGenerated: number;
  totalOpportunityCost: number;
  /** Best metric for this strategy */
  bestMetric: string;
  bestMetricValue: number;
}

const SLOT_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"];

// ── Context type ─────────────────────────────────────────────────────────────

interface StrategyContextType {
  /** All published strategy results keyed by type */
  results: Partial<Record<StrategyType, any>>;
  /** Publish a strategy result from any tool */
  publishResult: (result: StrategyResult) => void;
  /** Clear a specific result */
  clearResult: (type: StrategyType) => void;
  /** Clear all results */
  clearAll: () => void;
  /** Get available data flows FROM a given strategy */
  getOutboundFlows: (from: StrategyType) => DataFlowLink[];
  /** Get available data flows TO a given strategy (with data) */
  getInboundFlows: (to: StrategyType) => Array<DataFlowLink & { sourceData: any; mappedData: Record<string, any> }>;
  /** Check if a strategy has published results */
  hasResult: (type: StrategyType) => boolean;
  /** Get the mapped data for a specific flow */
  getFlowData: (from: StrategyType, to: StrategyType) => Record<string, any> | null;
  /** Get count of active (published) strategies */
  activeCount: number;
  /** Get all active strategy types */
  activeStrategies: StrategyType[];

  // ── 5-Slot Comparison ──
  /** The 5 comparison slots */
  comparisonSlots: ComparisonSlot[];
  /** Assign a strategy to a comparison slot */
  setComparisonSlot: (slotId: number, strategyType: StrategyType, label?: string) => void;
  /** Clear a comparison slot */
  clearComparisonSlot: (slotId: number) => void;
  /** Clear all comparison slots */
  clearAllComparisons: () => void;
  /** Generate 20-year projection for a slot */
  generateProjection: (slotId: number) => void;
  /** Get comparison summaries for all filled slots */
  getComparisonSummaries: () => ComparisonSummary[];
}

const defaultSlots: ComparisonSlot[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  strategyType: null,
  label: `Strategy ${i + 1}`,
  data: null,
  projection: null,
  color: SLOT_COLORS[i],
}));

const StrategyContext = createContext<StrategyContextType>({
  results: {},
  publishResult: () => {},
  clearResult: () => {},
  clearAll: () => {},
  getOutboundFlows: () => [],
  getInboundFlows: () => [],
  hasResult: () => false,
  getFlowData: () => null,
  activeCount: 0,
  activeStrategies: [],
  comparisonSlots: defaultSlots,
  setComparisonSlot: () => {},
  clearComparisonSlot: () => {},
  clearAllComparisons: () => {},
  generateProjection: () => {},
  getComparisonSummaries: () => [],
});

/**
 * Generate a 20-year projection from strategy result data.
 * Each strategy type has its own projection logic.
 */
function generate20YearProjection(strategyType: StrategyType, data: any): ComparisonProjectionYear[] {
  const years: ComparisonProjectionYear[] = [];
  let cumulativeNetPositive = 0;

  for (let y = 1; y <= 20; y++) {
    let row: ComparisonProjectionYear = {
      year: y,
      netPositive: 0,
      interestPaid: 0,
      interestSaved: 0,
      equityBuilt: 0,
      taxSavings: 0,
      cashValue: 0,
      deathBenefit: 0,
      incomeGenerated: 0,
      opportunityCost: 0,
      cumulativeNetPositive: 0,
    };

    switch (strategyType) {
      case "mortgage-killer": {
        const d = data as MortgageKillerResult;
        const annualInterestSaved = d.interestSaved / 20;
        const annualEquity = d.originalBalance / 20;
        row.interestSaved = annualInterestSaved * (1 + y * 0.02);
        row.equityBuilt = annualEquity * y;
        row.cashValue = d.iulCashValue * (y / 20) * (1 + y * 0.015);
        row.deathBenefit = d.iulDeathBenefit;
        row.taxSavings = d.helocUsed ? d.helocAmount * 0.085 * 0.32 : 0;
        row.opportunityCost = d.totalOpportunityCost * (y / 20);
        row.netPositive = row.interestSaved + row.taxSavings + row.cashValue * 0.05;
        break;
      }
      case "iul-projection": {
        const d = data as IULProjectionResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.cashValue = projYear?.cashValue ?? d.cashValue * (y / d.years);
        row.deathBenefit = projYear?.deathBenefit ?? d.deathBenefit;
        row.interestPaid = d.annualPremium;
        row.netPositive = row.cashValue - (d.annualPremium * y);
        break;
      }
      case "roth-conversion": {
        const d = data as RothConversionResult;
        const ladderYear = d.ladderData?.find(l => l.year === y);
        row.taxSavings = y <= d.yearsOfConversion ? 0 : (d.endingRothBalance * 0.04 * d.targetBracket / 100);
        row.interestPaid = ladderYear?.tax ?? 0;
        row.cashValue = ladderYear?.rothBalance ?? d.endingRothBalance * Math.min(1, y / d.yearsOfConversion);
        row.incomeGenerated = y > d.yearsOfConversion ? d.endingRothBalance * 0.04 : 0;
        row.netPositive = row.cashValue - (d.taxPaid * Math.min(1, y / d.yearsOfConversion));
        break;
      }
      case "myga-waterfall": {
        const d = data as MYGAWaterfallResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.cashValue = projYear?.mygaValue ?? d.totalMygaValue * (1 + d.mygaRate / 100) ** y;
        row.incomeGenerated = projYear?.oilGasValue ?? d.totalOilGasValue * (y / 20);
        row.taxSavings = d.annualTaxSavings;
        row.interestPaid = d.totalMygaValue * 0.07 * 0.7; // bank loan interest
        row.netPositive = row.cashValue + row.incomeGenerated + row.taxSavings - row.interestPaid;
        row.opportunityCost = row.netPositive * 1.03; // compounded
        break;
      }
      case "tax-waterfall": {
        const d = data as TaxWaterfallResult;
        row.taxSavings = d.totalTaxSaved;
        row.netPositive = d.totalTaxSaved * y;
        break;
      }
      case "retirement-income": {
        const d = data as RetirementIncomeResult;
        row.incomeGenerated = d.annualIncome;
        row.taxSavings = d.annuityIncome * 0.15; // exclusion ratio
        row.netPositive = d.annualIncome * y;
        break;
      }
      case "premium-financing": {
        const d = data as PremiumFinancingResult;
        row.interestPaid = d.annualLoanCost;
        row.deathBenefit = d.deathBenefitLeverage;
        row.cashValue = y >= d.breakEvenYear ? d.cashValueAtBreakEven * (1 + (y - d.breakEvenYear) * 0.06) : 0;
        row.netPositive = y >= d.breakEvenYear ? d.netBenefit * ((y - d.breakEvenYear + 1) / 10) : -d.annualLoanCost * y;
        break;
      }
      case "real-estate-mogul": {
        const d = data as RealEstateMogulResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.equityBuilt = projYear?.equity ?? d.totalEquity * (1.05 ** y);
        row.incomeGenerated = projYear?.cashFlow ?? d.cashFlow * (1.03 ** y);
        row.netPositive = row.equityBuilt + row.incomeGenerated * y;
        break;
      }
      case "social-security": {
        const d = data as SocialSecurityResult;
        row.incomeGenerated = y >= (d.optimalClaimAge - 62) ? d.monthlyBenefitFRA * 12 : 0;
        row.netPositive = row.incomeGenerated;
        break;
      }
      case "annuity-income": {
        const d = data as AnnuityIncomeResult;
        row.incomeGenerated = d.guaranteedAnnualIncome;
        row.cashValue = d.accumulationValue * (1 + d.rollUpRate / 100) ** y;
        row.netPositive = row.incomeGenerated * y;
        break;
      }
      case "estate-tax": {
        const d = data as EstateTaxResult;
        row.taxSavings = d.strategySavings / 20;
        row.deathBenefit = d.netToHeirs;
        row.netPositive = d.strategySavings * (y / 20);
        break;
      }
      case "fia-collateral": {
        const d = data as FIACollateralResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.cashValue = projYear?.accountValue ?? d.fiaAccountValue * (1 + d.annualCrediting / 100) ** y;
        row.interestPaid = d.collateralLoanAmount * (d.loanInterestRate / 100);
        row.netPositive = (projYear?.netValue ?? row.cashValue - d.collateralLoanAmount) + d.netArbitrage * y;
        break;
      }
      case "hot-income": {
        const d = data as HotIncomeResult;
        row.incomeGenerated = d.totalAnnualIncome;
        row.taxSavings = d.taxFreeIncome * d.effectiveTaxRate;
        row.netPositive = (d.totalAnnualIncome + row.taxSavings) * y;
        break;
      }
      case "time-machine": {
        const d = data as TimeMachineResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.cashValue = projYear?.cashValue ?? d.cashValueYear20 * (y / 20);
        row.deathBenefit = projYear?.deathBenefit ?? d.deathBenefitYear20;
        row.interestPaid = d.totalPremiumsPaid / 20;
        row.netPositive = row.cashValue - (d.totalPremiumsPaid * y / 20);
        break;
      }
      case "lifetime-income": {
        const d = data as LifetimeIncomeResult;
        row.incomeGenerated = d.annualIncome;
        row.netPositive = d.annualIncome * y;
        break;
      }
      case "dynamic-tax": {
        const d = data as DynamicTaxResult;
        const projYear = d.yearlyProjection?.find(p => p.year === y);
        row.taxSavings = projYear?.taxSavings ?? d.totalTaxSaved / 20;
        row.netPositive = d.yearlyProjection?.slice(0, y).reduce((s, p) => s + p.taxSavings, 0) ?? row.taxSavings * y;
        break;
      }
      default: {
        // Generic fallback
        row.netPositive = 0;
        break;
      }
    }

    cumulativeNetPositive += row.netPositive;
    row.cumulativeNetPositive = cumulativeNetPositive;
    years.push(row);
  }

  return years;
}

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<Partial<Record<StrategyType, any>>>({});
  const [comparisonSlots, setComparisonSlots] = useState<ComparisonSlot[]>(defaultSlots);

  const publishResult = useCallback((result: StrategyResult) => {
    setResults((prev) => ({ ...prev, [result.type]: result.data }));
    // Auto-update any comparison slot that references this strategy
    setComparisonSlots(prev => prev.map(slot => {
      if (slot.strategyType === result.type) {
        const projection = generate20YearProjection(result.type, result.data);
        return { ...slot, data: result.data, projection };
      }
      return slot;
    }));
  }, []);

  const clearResult = useCallback((type: StrategyType) => {
    setResults((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setResults({}), []);

  const getOutboundFlows = useCallback(
    (from: StrategyType) => DATA_FLOW_LINKS.filter((l) => l.from === from),
    []
  );

  const getInboundFlows = useCallback(
    (to: StrategyType) =>
      DATA_FLOW_LINKS.filter((l) => l.to === to && results[l.from])
        .map((l) => ({
          ...l,
          sourceData: results[l.from],
          mappedData: l.mapData(results[l.from]),
        })),
    [results]
  );

  const hasResult = useCallback((type: StrategyType) => !!results[type], [results]);

  const getFlowData = useCallback(
    (from: StrategyType, to: StrategyType) => {
      const link = DATA_FLOW_LINKS.find((l) => l.from === from && l.to === to);
      if (!link || !results[from]) return null;
      return link.mapData(results[from]);
    },
    [results]
  );

  const activeStrategies = Object.keys(results) as StrategyType[];
  const activeCount = activeStrategies.length;

  // ── Comparison slot management ──
  const setComparisonSlot = useCallback((slotId: number, strategyType: StrategyType, label?: string) => {
    setComparisonSlots(prev => prev.map(slot => {
      if (slot.id !== slotId) return slot;
      const data = results[strategyType] ?? null;
      const projection = data ? generate20YearProjection(strategyType, data) : null;
      return {
        ...slot,
        strategyType,
        label: label ?? STRATEGY_LABELS[strategyType],
        data,
        projection,
      };
    }));
  }, [results]);

  const clearComparisonSlot = useCallback((slotId: number) => {
    setComparisonSlots(prev => prev.map(slot =>
      slot.id === slotId ? { ...defaultSlots[slotId] } : slot
    ));
  }, []);

  const clearAllComparisons = useCallback(() => {
    setComparisonSlots([...defaultSlots]);
  }, []);

  const generateProjection = useCallback((slotId: number) => {
    setComparisonSlots(prev => prev.map(slot => {
      if (slot.id !== slotId || !slot.strategyType || !slot.data) return slot;
      const projection = generate20YearProjection(slot.strategyType, slot.data);
      return { ...slot, projection };
    }));
  }, []);

  const getComparisonSummaries = useCallback((): ComparisonSummary[] => {
    return comparisonSlots
      .filter(s => s.strategyType && s.projection)
      .map(slot => {
        const proj = slot.projection!;
        const last = proj[proj.length - 1];
        const totals = {
          totalNetPositive: last.cumulativeNetPositive,
          totalInterestPaid: proj.reduce((s, y) => s + y.interestPaid, 0),
          totalInterestSaved: proj.reduce((s, y) => s + y.interestSaved, 0),
          totalEquityBuilt: last.equityBuilt,
          totalTaxSavings: proj.reduce((s, y) => s + y.taxSavings, 0),
          finalCashValue: last.cashValue,
          finalDeathBenefit: last.deathBenefit,
          totalIncomeGenerated: proj.reduce((s, y) => s + y.incomeGenerated, 0),
          totalOpportunityCost: last.opportunityCost,
        };
        // Find best metric
        const metrics = [
          { name: "Net Positive", value: totals.totalNetPositive },
          { name: "Interest Saved", value: totals.totalInterestSaved },
          { name: "Tax Savings", value: totals.totalTaxSavings },
          { name: "Cash Value", value: totals.finalCashValue },
          { name: "Death Benefit", value: totals.finalDeathBenefit },
          { name: "Income Generated", value: totals.totalIncomeGenerated },
        ];
        const best = metrics.reduce((b, m) => m.value > b.value ? m : b, metrics[0]);

        return {
          slotId: slot.id,
          label: slot.label,
          strategyType: slot.strategyType!,
          ...totals,
          bestMetric: best.name,
          bestMetricValue: best.value,
        };
      });
  }, [comparisonSlots]);

  return (
    <StrategyContext.Provider
      value={{
        results, publishResult, clearResult, clearAll,
        getOutboundFlows, getInboundFlows, hasResult, getFlowData,
        activeCount, activeStrategies,
        comparisonSlots, setComparisonSlot, clearComparisonSlot,
        clearAllComparisons, generateProjection, getComparisonSummaries,
      }}
    >
      {children}
    </StrategyContext.Provider>
  );
}

/** Hook to access the cross-tool strategy context */
export function useStrategy() {
  return useContext(StrategyContext);
}

// ── Strategy type display names ──────────────────────────────────────────────

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  "mortgage-killer": "Mortgage Killer",
  "iul-projection": "IUL Projection",
  "roth-conversion": "Roth Conversion",
  "myga-waterfall": "MYGA Waterfall",
  "tax-waterfall": "Tax Waterfall",
  "retirement-income": "Retirement Income",
  "premium-financing": "Premium Financing",
  "real-estate-mogul": "Real Estate Mogul",
  "inflation-analysis": "Inflation Analysis",
  "social-security": "Social Security",
  "annuity-income": "Annuity Income",
  "estate-tax": "Estate Tax",
  "fia-collateral": "FIA Collateral",
  "hot-income": "HOT Income",
  "time-machine": "Time Machine",
  "lifetime-income": "Lifetime Income",
  "black-mirror": "Black Mirror",
  "endgame": "Endgame",
  "dynamic-tax": "Dynamic Tax",
  "advisor-income": "Advisor Income",
  "live-copilot": "Live Co-Pilot",
  "social-narcotic": "Social Narcotic",
  "war-room": "War Room",
};

export const STRATEGY_COLORS: Record<StrategyType, string> = {
  "mortgage-killer": "emerald",
  "iul-projection": "blue",
  "roth-conversion": "purple",
  "myga-waterfall": "amber",
  "tax-waterfall": "red",
  "retirement-income": "cyan",
  "premium-financing": "indigo",
  "real-estate-mogul": "orange",
  "inflation-analysis": "rose",
  "social-security": "teal",
  "annuity-income": "lime",
  "estate-tax": "fuchsia",
  "fia-collateral": "sky",
  "hot-income": "yellow",
  "time-machine": "violet",
  "lifetime-income": "emerald",
  "black-mirror": "slate",
  "endgame": "gold",
  "dynamic-tax": "red",
  "advisor-income": "blue",
  "live-copilot": "violet",
  "social-narcotic": "pink",
  "war-room": "red",
};
/** Map strategy type to its calculator page path */
export const STRATEGY_PATHS: Record<StrategyType, string> = {
  "mortgage-killer": "/portal/mortgage-killer",
  "iul-projection": "/portal/iul-historical",
  "roth-conversion": "/portal/roth-conversion",
  "myga-waterfall": "/portal/myga-fixed-rate",
  "tax-waterfall": "/portal/tax-waterfall",
  "retirement-income": "/portal/retirement-income",
  "premium-financing": "/portal/premium-financing",
  "real-estate-mogul": "/portal/real-estate-mogul",
  "inflation-analysis": "/portal/inflation-analysis",
  "social-security": "/portal/social-security",
  "annuity-income": "/portal/athene-guaranteed-income",
  "estate-tax": "/portal/estate-tax",
  "fia-collateral": "/portal/fia-collateral-strategy",
  "hot-income": "/portal/hot-income",
  "time-machine": "/portal/time-machine",
  "lifetime-income": "/portal/lifetime-income",
  "black-mirror": "/portal/black-mirror",
  "endgame": "/portal/endgame",
  "dynamic-tax": "/portal/tax-waterfall",
  "advisor-income": "/portal/advisor-income-calculator",
  "live-copilot": "/portal/live-copilot",
  "social-narcotic": "/portal/social-narcotic",
  "war-room": "/portal/war-room",
};
