// ─── Real Estate Capital Stack — Shared Vocabulary ──────────────────────────
// Single source of truth for the capital stack, stress, and findings engines.
// Every rate is a decimal fraction (0.065 = 6.5%); every amount is nominal USD.
// Periods are annual and 1-indexed (year 1 = first full year of operations);
// year 0 is the closing/funding event.

/* ═══ Stack layers ═════════════════════════════════════════════════════════ */

/** Ordered by repayment priority — index order is seniority order. */
export type LayerKind =
  | "senior_debt"
  | "mezzanine"
  | "preferred_equity"
  | "common_equity";

export type AmortizationType = "interest_only" | "amortizing" | "io_then_amortizing";

export type RateType = "fixed" | "floating";

export interface DebtLayer {
  id: string;
  kind: "senior_debt" | "mezzanine";
  /** Funded principal at close. */
  principal: number;
  /** Fixed coupon, or the all-in starting rate for floating paper. */
  rate: number;
  rateType: RateType;
  /** Spread over index for floating debt. Informational for the base case;
   *  the stress engine shocks the all-in `rate` directly. */
  floatingSpread?: number;
  amortization: AmortizationType;
  /** Length of the amortization schedule. Ignored when interest-only. */
  amortYears: number;
  /** Interest-only runway before amortization begins. */
  ioYears: number;
  /** Maturity. A term shorter than the hold forces a refinance. */
  termYears: number;
  /** Origination points, as a fraction of principal. A use of funds. */
  originationFeePct: number;
  /** Minimum DSCR the lender requires. Breaching it is an event of default. */
  dscrCovenant?: number;
  /** Prepayment penalty applied to the payoff balance at sale. */
  prepaymentPenaltyPct?: number;
}

export interface PreferredEquityLayer {
  id: string;
  kind: "preferred_equity";
  contribution: number;
  /** Accruing preferred return. */
  rate: number;
  /** True = unpaid pref compounds; false = it accrues simple. */
  compounding: boolean;
  /** Current-pay portion of the rate, serviced from operating cash flow.
   *  The remainder accrues to the redemption balance. */
  currentPayRate: number;
}

export interface CommonEquityLayer {
  kind: "common_equity";
  /** Limited partner / investor capital. */
  lpContribution: number;
  /** General partner / sponsor co-invest. */
  gpContribution: number;
}

/* ═══ Promote waterfall ════════════════════════════════════════════════════ */

/**
 * An IRR-hurdle waterfall tier. Tiers are evaluated in ascending hurdle order:
 * distributions are allocated to the lowest unmet tier until the LP's realized
 * IRR reaches that tier's hurdle, then the next tier's split takes over.
 *
 * A conventional structure looks like:
 *   { irrHurdle: 0.08, lpShare: 1.00, gpShare: 0.00 }  // pref
 *   { irrHurdle: 0.15, lpShare: 0.80, gpShare: 0.20 }  // 20% promote
 *   { irrHurdle: Infinity, lpShare: 0.70, gpShare: 0.30 }  // residual
 */
export interface WaterfallTier {
  irrHurdle: number;
  lpShare: number;
  gpShare: number;
}

/* ═══ Property operations ══════════════════════════════════════════════════ */

export interface PropertyProfile {
  purchasePrice: number;
  /** Acquisition closing costs as a fraction of price. A use of funds. */
  closingCostsPct: number;
  /** Capital improvement budget funded at close. A use of funds. */
  capexBudget: number;
  /** Net operating income for year 1, after vacancy and opex. */
  year1NOI: number;
  /** Compounding annual NOI growth. */
  noiGrowthRate: number;
  /** Ongoing capital reserve, as a fraction of NOI, deducted below the line. */
  capexReservePctOfNOI: number;
  /** Cap rate applied to forward NOI at disposition. */
  exitCapRate: number;
  /** Disposition costs as a fraction of gross sale price. */
  saleCostPct: number;
  holdYears: number;
}

export interface CapitalStackInput {
  property: PropertyProfile;
  /** Seniority-ordered. Senior tranches must precede mezzanine. */
  debt: DebtLayer[];
  preferredEquity?: PreferredEquityLayer;
  commonEquity: CommonEquityLayer;
  waterfall: WaterfallTier[];
}

/* ═══ Results ══════════════════════════════════════════════════════════════ */

export interface SourcesAndUses {
  sources: { label: string; amount: number }[];
  uses: { label: string; amount: number }[];
  totalSources: number;
  totalUses: number;
  /** Positive = over-funded, negative = funding gap. */
  surplus: number;
  balanced: boolean;
}

/** One year of a single debt tranche. */
export interface DebtPeriodRow {
  layerId: string;
  year: number;
  beginningBalance: number;
  interest: number;
  principal: number;
  debtService: number;
  endingBalance: number;
  /** True once the year is past the tranche's stated maturity. */
  matured: boolean;
}

export interface PeriodRow {
  year: number;
  noi: number;
  capexReserve: number;
  netOperatingCashFlow: number;
  interest: number;
  principalAmortization: number;
  debtService: number;
  /** Cash flow after all debt service, before preferred equity. */
  cashFlowAfterDebtService: number;
  /** Current-pay preferred actually distributed this year. */
  preferredCurrentPay: number;
  /** Cash available to the common equity waterfall. */
  distributableToCommon: number;
  totalDebtBalance: number;
  /** NOI / debt service across all tranches. Infinity when debt-free. */
  dscr: number;
  /** NOI / total debt balance — the lender's leverage-independent yardstick. */
  debtYield: number;
  /** Total debt / depreciated-free asset value at the period's cap rate. */
  ltv: number;
  /** Tranches whose DSCR covenant is breached this year. */
  covenantBreaches: string[];
}

export interface ExitSummary {
  year: number;
  /** Forward NOI capitalized at the exit cap rate. */
  grossSalePrice: number;
  saleCosts: number;
  debtPayoff: number;
  prepaymentPenalties: number;
  preferredRedemption: number;
  /** Cash to the common equity waterfall at disposition. */
  netProceedsToCommon: number;
}

export interface WaterfallSplit {
  /** Total cash actually received across the hold, including exit. */
  lpDistributions: number;
  gpDistributions: number;
  lpIrr: number;
  gpIrr: number;
  lpEquityMultiple: number;
  gpEquityMultiple: number;
  /** GP's share of total profit, a promote-richness check. */
  gpProfitShare: number;
  /** Per-tier allocation detail. */
  tiers: {
    irrHurdle: number;
    lpAllocated: number;
    gpAllocated: number;
  }[];
}

export interface StackReturns {
  /** Project-level IRR on unlevered cash flows. */
  unleveredIrr: number;
  /** Levered IRR on aggregate common equity before the promote split. */
  leveredIrr: number;
  equityMultiple: number;
  /** Mean cash-on-cash across operating years. */
  averageCashOnCash: number;
  minDscr: number;
  maxLtv: number;
  minDebtYield: number;
  /** Peak equity out-of-pocket, i.e. total common contribution. */
  peakEquity: number;
}

export interface CapitalStackResult {
  sourcesAndUses: SourcesAndUses;
  schedule: PeriodRow[];
  debtSchedule: DebtPeriodRow[];
  exit: ExitSummary;
  /** Year 0 outflow followed by annual distributions, for IRR. */
  commonEquityCashFlows: number[];
  unleveredCashFlows: number[];
  returns: StackReturns;
  waterfall: WaterfallSplit;
  /** Years in which any covenant was breached. */
  covenantBreachYears: number[];
  /** True when a tranche matures before disposition. */
  refinanceRequired: boolean;
  refinanceYear: number | null;
}

/* ═══ Stress testing ═══════════════════════════════════════════════════════ */

export interface StressScenario {
  id: string;
  label: string;
  /** Multiplicative NOI shock, e.g. -0.20 for a 20% decline. */
  noiShockPct?: number;
  /** Permanent change to NOI growth, in absolute rate terms. */
  noiGrowthShift?: number;
  /** Exit cap rate expansion in basis points. Positive = value destruction. */
  exitCapShiftBps?: number;
  /** Parallel shift to every floating-rate coupon, in basis points. */
  rateShiftBps?: number;
  /** Additional years of hold, e.g. a blocked exit. */
  holdExtensionYears?: number;
  /** Multiplicative shock to the capex reserve requirement. */
  capexReserveMultiplier?: number;
}

export interface ScenarioOutcome {
  scenario: StressScenario;
  leveredIrr: number;
  equityMultiple: number;
  minDscr: number;
  maxLtv: number;
  lpIrr: number;
  /** Change in levered IRR vs. the base case, in absolute rate terms. */
  irrDelta: number;
  covenantBreached: boolean;
  /** True when common equity is wiped out at exit. */
  equityWipedOut: boolean;
  /** True when the asset is worth less than the debt at exit. */
  underwater: boolean;
}

export interface BreakEvenPoints {
  /** NOI decline (as a positive fraction) that first breaches a DSCR covenant.
   *  null when no covenant exists or none can be breached. */
  noiDeclineToBreachDscr: number | null;
  /** NOI decline that drives DSCR below 1.00x — true cash insolvency. */
  noiDeclineToNegativeCashFlow: number | null;
  /** Exit cap expansion (bps) at which common equity returns exactly its basis. */
  capExpansionToZeroProfit: number | null;
  /** Exit cap expansion (bps) at which common equity is fully wiped out. */
  capExpansionToWipeout: number | null;
  /** Rate shock (bps) that first breaches a DSCR covenant. */
  rateShockToBreachDscr: number | null;
}

export interface MonteCarloSummary {
  runs: number;
  /** Levered IRR percentiles. */
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  mean: number;
  /** Fraction of runs with a negative levered IRR. */
  probabilityOfLoss: number;
  probabilityOfCovenantBreach: number;
  probabilityOfEquityWipeout: number;
  /** Mean IRR of the worst 5% of runs — conditional tail expectation. */
  conditionalTailIrr: number;
}

export interface StressResult {
  base: {
    leveredIrr: number;
    equityMultiple: number;
    minDscr: number;
    maxLtv: number;
    lpIrr: number;
  };
  scenarios: ScenarioOutcome[];
  breakEven: BreakEvenPoints;
  monteCarlo: MonteCarloSummary | null;
}

/* ═══ Findings ═════════════════════════════════════════════════════════════ */

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type FindingCategory =
  | "leverage"
  | "coverage"
  | "structure"
  | "liquidity"
  | "market"
  | "alignment"
  | "returns";

export interface Finding {
  /** Stable machine code, e.g. "NEGATIVE_LEVERAGE". */
  code: string;
  severity: FindingSeverity;
  category: FindingCategory;
  title: string;
  /** One-paragraph plain explanation of what was detected and why it matters. */
  detail: string;
  /** The numbers the finding was derived from, for auditability. */
  evidence: Record<string, number | string | boolean>;
  recommendation: string;

  /* ── RECIN evidence fields (optional; the syndication engine omits them) ──
     A finding that reaches a client has to survive review, which means it must
     carry not just its claim but how sure it is, how much it matters, what it
     was computed from, and who has to sign off. */

  /** 0..1 confidence in the claim given input quality and data age. */
  confidence?: number;
  /** 0..1 materiality — how much this moves the client's actual outcome. */
  materiality?: number;
  /** Which computed metric this finding is about. */
  affectedMetric?: string;
  /** Source ledger / calculation-run IDs backing the claim. */
  evidenceIds?: string[];
  /** Professional who must review before this reaches a client. */
  requiredReviewer?: "advisor" | "cpa" | "attorney" | "lender" | "compliance" | "insurance";
  /** What would invalidate this finding — powers the "why this exists" panel. */
  invalidatedBy?: string;
}

export interface FindingsReport {
  findings: Finding[];
  /** 0–100. 100 = no issues detected; weighted by severity. */
  riskScore: number;
  /** Highest severity present. */
  headlineSeverity: FindingSeverity;
  countsBySeverity: Record<FindingSeverity, number>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECIN — BORROWER-SIDE CAPACITY VOCABULARY
   ═══════════════════════════════════════════════════════════════════════════

   Everything above this banner models a SPONSOR-SIDE syndication: an LP/GP
   capital stack with a promote waterfall and an exit IRR.

   Everything below models the BORROWER-SIDE question RECIN exists to answer:
   given this client's properties, liens, rents and reserves, how much debt can
   they prudently carry, through which instrument, and what breaks first?

   The two share a file because they share a domain, not an engine. They are
   deliberately separate contracts — `analyzeCapitalStack` for the former,
   `analyzeRealEstateCapitalScenario` for the latter.

   Conventions below match the section above: every rate is a decimal fraction
   (0.085 = 8.5%), every amount is nominal USD, and ratios are 0..1.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══ Property and lien inputs ═════════════════════════════════════════════ */

export interface ExistingLien {
  id: string;
  /** 1 = first mortgage, 2 = second, and so on. Drives payoff priority. */
  lienPosition: number;
  currentBalance: number;
  /** Undrawn availability on a revolving line. Counts against CLTV. */
  availableLine?: number;
  rate: number;
  rateType: RateType | "hybrid";
  /** Annual debt service actually being paid today. */
  annualDebtService: number;
  category: DebtCategory;
  crossCollateralized?: boolean;
}

export type PropertyOwnershipType =
  | "personal"
  | "llc"
  | "trust"
  | "partnership"
  | "corporation";

export type PropertyUseType =
  | "primary"
  | "second_home"
  | "rental_1_4"
  | "multifamily_5_plus"
  | "commercial";

export interface PropertyInput {
  id: string;
  name: string;
  value: number;
  /** Date the value was struck, for staleness warnings. ISO yyyy-mm-dd. */
  valueAsOf?: string;
  valueSource?: "appraisal" | "avm" | "assessment" | "user_estimate" | "broker_opinion";
  annualGrossRent: number;
  annualOperatingExpenses: number;
  annualTaxes: number;
  annualInsurance: number;
  annualHoa?: number;
  annualManagement?: number;
  annualMaintenanceReserve?: number;
  /** Physical occupancy, 0..1. */
  occupancy: number;
  ownershipType: PropertyOwnershipType;
  useType: PropertyUseType;
  liens: ExistingLien[];
  /** Owner's adjusted basis — required to separate sale cash from taxable gain. */
  adjustedBasis?: number;
  /** Depreciation taken to date, recaptured on sale at its own rate. */
  accumulatedDepreciation?: number;
  /** Flags a property earmarked for heirs, a trust, or a succession plan. */
  earmarkedForSuccession?: boolean;
}

/* ═══ Debt options ═════════════════════════════════════════════════════════ */

export type DebtCategory =
  | "heloc"
  | "home_equity_loan"
  | "dscr"
  | "bridge"
  | "hard_money"
  | "blanket_dscr"
  | "commercial_bank"
  | "cmbs"
  | "mezzanine"
  | "preferred_equity"
  | "seller_finance";

export type RecourseType = "full" | "limited" | "nonrecourse_carveout";

export type CollateralMode =
  | "single"
  | "cross_collateralized"
  | "blanket"
  | "entity_interest_pledge"
  | "equity_interest";

export type PaymentMode =
  | "amortizing"
  | "interest_only"
  | "deferred"
  | "cash_flow_waterfall";

export interface PrepaymentSchedule {
  kind:
    | "none"
    | "flat_pct"
    | "step_down"
    | "yield_maintenance"
    | "defeasance"
    | "lockout";
  /** Flat penalty as a fraction of the balance prepaid. */
  flatPct?: number;
  /** Step-down penalties by loan year, e.g. [0.05, 0.04, 0.03]. */
  stepDownPctByYear?: number[];
  /** Months during which prepayment is barred outright. */
  lockoutMonths?: number;
}

export interface DebtOption {
  id: string;
  label?: string;
  category: DebtCategory;
  rate: number;
  rateType: RateType | "hybrid";
  /** Spread over the index for variable paper, used in rate-shock stress. */
  marginToIndex?: number;
  termMonths: number;
  amortizationMonths?: number;
  interestOnlyMonths?: number;
  maxLtv?: number;
  maxCltv?: number;
  maxLtc?: number;
  maxArv?: number;
  minDscr?: number;
  minimumDebtYield?: number;
  pointsPct?: number;
  closingCostsPct?: number;
  prepayment: PrepaymentSchedule;
  recourse: RecourseType;
  collateralMode: CollateralMode;
  paymentMode: PaymentMode;
  /** Provenance. Terms without a live source are illustrative, never quotes. */
  termsSource?: {
    provider?: string;
    asOf?: string;
    status: "illustrative" | "indicative" | "quoted";
  };
}

/* ═══ Scenario assumptions and policy ══════════════════════════════════════ */

export interface ScenarioAssumptions {
  vacancyRate: number;
  rentGrowth: number;
  expenseGrowth: number;
  propertyValueGrowth: number;
  rateShockBps: number;
  /** Months until the planned bridge exit, when one is modelled. */
  exitMonths?: number;
  saleCostPct: number;
  refinanceRate: number;
  refinanceMaxLtv: number;
  refinanceMinDscr: number;
  taxReviewRequired: boolean;
}

/**
 * Policy thresholds. Every one of these is a judgement, not a law, so they are
 * configurable by an authorized advisor and MUST be printed in any report that
 * relies on them — a finding is only defensible if its threshold is visible.
 */
export interface RealEstatePolicy {
  targetMinimumDscr: number;
  minimumDebtYield: number;
  targetReserveMonths: number;
  maxPrudentPortfolioLtv: number;
  minimumBridgeExitCoverage: number;
  rateShockBpsConservative: number;
  rateShockBpsSevere: number;
  valueDeclineConservative: number;
  valueDeclineSevere: number;
  vacancyRateConservative: number;
  vacancyRateSevere: number;
  expenseIncreaseConservative: number;
  expenseIncreaseSevere: number;
}

export const DEFAULT_REAL_ESTATE_POLICY: RealEstatePolicy = {
  targetMinimumDscr: 1.25,
  minimumDebtYield: 0.085,
  targetReserveMonths: 9,
  maxPrudentPortfolioLtv: 0.65,
  minimumBridgeExitCoverage: 1.1,
  rateShockBpsConservative: 200,
  rateShockBpsSevere: 400,
  valueDeclineConservative: 0.1,
  valueDeclineSevere: 0.2,
  vacancyRateConservative: 0.12,
  vacancyRateSevere: 0.2,
  expenseIncreaseConservative: 0.1,
  expenseIncreaseSevere: 0.2,
};

/* ═══ Household liquidity ══════════════════════════════════════════════════ */

/**
 * Reserves, broken out by the job each dollar is already doing. Split this way
 * because the liquidity-collision rule depends on knowing whether one balance
 * is being counted for several purposes at once.
 */
export interface LiquidityProfile {
  totalLiquidReserves: number;
  /** Already committed as a vacancy reserve. */
  earmarkedVacancyReserve?: number;
  /** Already committed to service bridge interest. */
  earmarkedBridgeInterestReserve?: number;
  /** Already committed to insurance premiums or policy-loan servicing. */
  earmarkedInsuranceReserve?: number;
  /** Already committed as a retirement income buffer. */
  earmarkedRetirementBuffer?: number;
  /** Household fixed costs outside property debt service, monthly. */
  monthlyFixedCostsOutsideProperty?: number;
}

/* ═══ Scenario input ═══════════════════════════════════════════════════════ */

export interface RealEstateCapitalScenarioInput {
  scenarioId?: string;
  properties: PropertyInput[];
  /** The instruments being compared. */
  debtOptions: DebtOption[];
  assumptions: ScenarioAssumptions;
  liquidity: LiquidityProfile;
  /** Capital the client is trying to raise. Drives sizing and shortfall. */
  requestedProceeds?: number;
  /** Purchase economics, when the proceeds fund an acquisition. */
  acquisition?: {
    purchasePrice: number;
    verifiedRehab?: number;
    eligibleClosingCosts?: number;
    afterRepairValue?: number;
    projectedAnnualGrossRent?: number;
    projectedAnnualOperatingExpenses?: number;
  };
  /** Overrides for the default policy thresholds. */
  policy?: Partial<RealEstatePolicy>;
}

/* ═══ Metrics ══════════════════════════════════════════════════════════════ */

export interface PropertyMetric {
  propertyId: string;
  name: string;
  value: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  /** Underwritten NOI — never a seller's pro forma. */
  noi: number;
  existingSeniorBalance: number;
  existingJuniorBalance: number;
  /** Undrawn revolving availability, which still counts against CLTV. */
  undrawnAvailability: number;
  currentLtv: number;
  currentCltv: number;
  existingAnnualDebtService: number;
  /** NOI ÷ existing debt service. Infinity when the property is unencumbered. */
  currentDscr: number;
  /** Incremental proceeds this property can support, by constraint. */
  capacityByLtv: number;
  capacityByCltv: number;
  capacityByDscr: number | null;
  capacityByDebtYield: number | null;
  /** The smallest of the above — what the property can actually support. */
  bindingCapacity: number;
  bindingConstraint: BindingConstraint;
  isFreeAndClear: boolean;
  crossCollateralized: boolean;
}

export interface PortfolioMetric {
  totalValue: number;
  totalNoi: number;
  totalExistingDebt: number;
  totalUndrawnAvailability: number;
  portfolioLtv: number;
  portfolioCltv: number;
  totalExistingAnnualDebtService: number;
  portfolioDscr: number;
  /** Properties exposed to a single default through shared collateral. */
  crossCollateralizedCount: number;
  crossCollateralExposureValue: number;
}

export interface PaymentPoint {
  month: number;
  beginningBalance: number;
  interest: number;
  principal: number;
  payment: number;
  endingBalance: number;
  /** True while the option is in its interest-only period. */
  interestOnly: boolean;
}

export interface ExitAnalysis {
  exitMonths: number;
  payoffAtExit: number;
  prepaymentPenalty: number;
  /** Conservative proceeds from the modelled sale or refinance. */
  conservativeProceeds: number;
  exitCosts: number;
  /** proceeds ÷ (payoff + costs). Below 1.0 means the exit does not clear. */
  exitCoverage: number;
  /** Whether the permanent take-out passes its own LTV and DSCR tests. */
  takeoutReadiness: {
    refinanceProceeds: number;
    passesLtv: boolean;
    passesDscr: boolean;
    passesDebtYield: boolean;
    /** 0..1. A bridge with no tested take-out scores 0. */
    score: number;
    blockers: string[];
  };
}

/* ═══ Tax ══════════════════════════════════════════════════════════════════ */

export type TaxFlagCode =
  | "INTEREST_IS_DEDUCTION_NOT_CREDIT"
  | "TRACING_REQUIRED"
  | "DEBT_PAYOFF_IS_NOT_GAIN_REDUCTION"
  | "PASSIVE_LOSS_LIMITATION_MAY_APPLY"
  | "BUSINESS_INTEREST_LIMITATION_MAY_APPLY"
  | "ENTITY_CHARACTERIZATION_REVIEW"
  | "DEPRECIATION_RECAPTURE_APPLIES"
  | "PREFERRED_DISTRIBUTIONS_NOT_DEDUCTIBLE"
  | "CPA_REVIEW_REQUIRED";

export interface TaxFlag {
  code: TaxFlagCode;
  message: string;
  /** Always true on this platform: nothing here is a tax conclusion. */
  requiresCpaReview: boolean;
}

/**
 * Sale economics, deliberately split into two columns that must never be
 * netted against each other. Debt payoff is a use of cash; it does not reduce
 * taxable gain. Conflating them is the single most expensive error a client
 * can make with this analysis.
 */
export interface SaleAnalysis {
  grossSalePrice: number;
  saleCosts: number;
  /** CASH column. */
  debtPayoff: number;
  netCashToOwner: number;
  /** TAX column — computed without reference to debt. */
  adjustedBasis: number;
  depreciationRecaptured: number;
  capitalGain: number;
  /** Explicitly restated so no downstream consumer can misread the split. */
  note: string;
}

/* ═══ Sprint B placeholders (contract reserved, not yet computed) ══════════ */

export interface ControlRisk {
  instrument: "mezzanine" | "preferred_equity";
  canBlockSale: boolean;
  canBlockRefinance: boolean;
  canReplaceManagement: boolean;
  canForceRedemption: boolean;
  /** 0..1, higher means more control ceded. */
  controlAsymmetryScore: number;
  triggers: string[];
}

export interface CmbsFlexibility {
  lockoutMonths: number;
  prepaymentKind: PrepaymentSchedule["kind"];
  /** 0..1, higher means more expensive to change course. */
  flexibilityCost: number;
  expectedHoldMonths: number;
  drivers: string[];
}

/* ═══ Results ══════════════════════════════════════════════════════════════ */

export type BindingConstraint =
  | "ltv"
  | "cltv"
  | "dscr"
  | "debt_yield"
  | "ltc"
  | "arv"
  | "liquidity"
  | "exit"
  | "unknown";

/** One stress lens over a single debt option. */
export interface CapacityStressResult {
  label: "base" | "conservative" | "severe";
  assumptions: {
    vacancyRate: number;
    rateShockBps: number;
    valueDecline: number;
    expenseIncrease: number;
  };
  supportedProceeds: number;
  dscr: number;
  debtYield: number;
  ltv: number;
  cltv: number;
  annualDebtService: number;
  reserveMonths: number;
  exitCoverage: number | null;
  passesPolicy: boolean;
  failures: string[];
}

export interface MissingInput {
  field: string;
  /** Why the calculation needs it, in advisor-facing language. */
  whyItMatters: string;
  blocksCalculation: boolean;
}

/** One debt option, fully evaluated. */
export interface DebtOptionOutcome {
  optionId: string;
  label: string;
  category: DebtCategory;
  eligible: boolean;
  ineligibleReasons: string[];
  maximumCollateralCapacity: number;
  maximumIncomeSupportedCapacity: number | null;
  recommendedMaximumPrudentCapacity: number;
  bindingConstraint: BindingConstraint;
  annualDebtService: number;
  upfrontCosts: number;
  netProceedsAfterCosts: number;
  paymentSchedule: PaymentPoint[];
  exitAnalysis?: ExitAnalysis;
  scenarios: {
    base: CapacityStressResult;
    conservative: CapacityStressResult;
    severe: CapacityStressResult;
  };
  controlRisk?: ControlRisk;
  cmbsFlexibility?: CmbsFlexibility;
}

export interface RealEstateCapitalScenarioResult {
  summary: {
    maximumCollateralCapacity: number;
    maximumIncomeSupportedCapacity: number | null;
    recommendedMaximumPrudentCapacity: number;
    bindingConstraint: BindingConstraint;
    minimumReserveMonths: number;
    /** Requested proceeds minus what the strongest option prudently supports. */
    shortfallAgainstRequest: number | null;
  };
  metrics: {
    propertyMetrics: PropertyMetric[];
    portfolioMetrics: PortfolioMetric;
    taxFlags: TaxFlag[];
    saleAnalysis?: SaleAnalysis;
  };
  options: DebtOptionOutcome[];
  findings: Finding[];
  requiredInputs: MissingInput[];
  disclaimers: string[];
  policyUsed: RealEstatePolicy;
  calculationVersion: string;
}
