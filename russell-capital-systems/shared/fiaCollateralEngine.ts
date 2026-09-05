/**
 * FIA Collateral & Income Strategy Engine
 * ─────────────────────────────────────────
 * Mirrors the MYGA Waterfall mechanics but uses FIA products:
 * - Split-ticket: 60-75% collateral sleeve + 25-40% income sleeve
 * - 6 carrier products with specific crediting strategies, caps, participation rates
 * - LTV-constrained loan logic (never exceeds product-specific LTV bands)
 * - Waterfall compounding: end of cycle N feeds into cycle N+1
 * - O&G tax savings → HELOC principal paydown
 */

/* ─── CARRIER PRODUCT DEFINITIONS ─── */
export interface FIAProduct {
  id: string;
  carrier: string;
  name: string;
  fullName: string;
  sleeve: "collateral" | "income";
  rank: number;
  /** Annual cap rate (%) */
  annualCap: number;
  /** Participation rate (%) */
  participationRate: number;
  /** Floor rate (%) — minimum credited */
  floorRate: number;
  /** Crediting strategy description */
  creditingStrategy: string;
  /** Surrender schedule (years) */
  surrenderYears: number;
  /** Surrender charges by year (%) */
  surrenderSchedule: number[];
  /** Free withdrawal % per year (after year 1 unless noted) */
  freeWithdrawalPct: number;
  /** LTV band: [min, max] as decimals */
  ltvBand: [number, number];
  /** Whether collateral assignment form is publicly available */
  hasPublicCAForm: boolean;
  /** Has MVA (Market Value Adjustment) */
  hasMVA: boolean;
  /** Bonus rate (%) if any */
  bonusRate: number;
  /** Bonus vesting years */
  bonusVestingYears: number;
  /** Key features */
  features: string[];
  /** Warnings/considerations */
  warnings: string[];
  /** Non-qualified only */
  nonQualifiedOnly: boolean;
  /** Income rider details (for income sleeve products) */
  incomeRider?: {
    rollUpRate: number;
    rollUpType: "simple" | "compound";
    rollUpYears: number;
    payoutRateAge65: number;
    payoutRateAge70: number;
    payoutRateAge75: number;
  };
}

export const FIA_PRODUCTS: FIAProduct[] = [
  // ─── COLLATERAL SLEEVE ───
  {
    id: "sb-clearline",
    carrier: "Security Benefit",
    name: "ClearLine",
    fullName: "Security Benefit ClearLine",
    sleeve: "collateral",
    rank: 1,
    annualCap: 10.5,
    participationRate: 100,
    floorRate: 0,
    creditingStrategy: "Annual Point-to-Point with Cap, S&P 500 Index",
    surrenderYears: 0,
    surrenderSchedule: [],
    freeWithdrawalPct: 100,
    ltvBand: [0.45, 0.55],
    hasPublicCAForm: true,
    hasMVA: false,
    bonusRate: 0,
    bonusVestingYears: 0,
    features: [
      "No surrender charges — full liquidity from day 1",
      "Public collateral-assignment form (Non-Qualified)",
      "Cleanest bank-collateral setup available",
      "100% participation rate on S&P 500 PTP",
      "Rates effective March 16, 2026",
    ],
    warnings: [
      "No bonus — accumulation depends entirely on index performance",
      "Possible stretch to 60% LTV only in strong private-bank relationships",
    ],
    nonQualifiedOnly: true,
  },
  {
    id: "athene-pe-plus",
    carrier: "Athene",
    name: "Performance Elite Plus",
    fullName: "Athene Performance Elite Plus",
    sleeve: "collateral",
    rank: 2,
    annualCap: 9.0,
    participationRate: 140,
    floorRate: 0,
    creditingStrategy: "Annual PTP with Participation Rate, S&P 500 + Uncapped Strategies",
    surrenderYears: 10,
    surrenderSchedule: [10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 0],
    freeWithdrawalPct: 10,
    ltvBand: [0.35, 0.50],
    hasPublicCAForm: true,
    hasMVA: true,
    bonusRate: 8,
    bonusVestingYears: 10,
    features: [
      "8% premium bonus (vests over 10 years)",
      "140% participation rate on uncapped strategies",
      "10% free withdrawals immediately",
      "20% free withdrawal if none taken prior year",
      "Return of premium after year 4",
      "Collateral assignment form expressly allows NQ annuities",
    ],
    warnings: [
      "Athene treats NQ assignment as tax reportable event (Form 1099-R)",
      "Withdrawals above free amount subject to charges + MVA + bonus vesting adjustment",
      "Cash value not guaranteed — may end up below assigned amount",
    ],
    nonQualifiedOnly: true,
  },
  {
    id: "sb-foundations",
    carrier: "Security Benefit",
    name: "Foundations",
    fullName: "Security Benefit Foundations",
    sleeve: "collateral",
    rank: 3,
    annualCap: 8.5,
    participationRate: 100,
    floorRate: 0,
    creditingStrategy: "Annual Point-to-Point with Cap, Multiple Index Options",
    surrenderYears: 7,
    surrenderSchedule: [8, 7, 6, 5, 4, 3, 2, 0],
    freeWithdrawalPct: 10,
    ltvBand: [0.35, 0.45],
    hasPublicCAForm: true,
    hasMVA: false,
    bonusRate: 0,
    bonusVestingYears: 0,
    features: [
      "Non-qualified availability",
      "10% free withdrawals after year 1",
      "5- or 7-year surrender schedule (shorter than most)",
      "Rates effective April 13, 2026",
      "No MVA — cleaner collateral enforcement",
    ],
    warnings: [
      "Still has surrender charges (less bank-friendly than ClearLine)",
      "Lower cap than ClearLine",
    ],
    nonQualifiedOnly: true,
  },
  // ─── INCOME SLEEVE ───
  {
    id: "fg-secureincome7",
    carrier: "F&G",
    name: "SecureIncome 7",
    fullName: "F&G SecureIncome 7",
    sleeve: "income",
    rank: 1,
    annualCap: 7.5,
    participationRate: 100,
    floorRate: 0,
    creditingStrategy: "Annual PTP with Cap, Income-focused with GLWB rider",
    surrenderYears: 8,
    surrenderSchedule: [8, 8, 7, 6, 5, 4, 3, 2, 0],
    freeWithdrawalPct: 10,
    ltvBand: [0.25, 0.40],
    hasPublicCAForm: false,
    hasMVA: true,
    bonusRate: 0,
    bonusVestingYears: 0,
    features: [
      "Best rider-preservation case for collateral assignment",
      "Rider termination language does NOT list collateral assignment",
      "10% free withdrawals after year 1",
      "Non-qualified availability",
      "Strong lifetime income guarantees",
    ],
    warnings: [
      "8-year surrender schedule",
      "MVA applies when surrender charges apply",
      "Rider-heavy structure makes collateral enforcement messier",
    ],
    nonQualifiedOnly: true,
    incomeRider: {
      rollUpRate: 7.0,
      rollUpType: "compound",
      rollUpYears: 10,
      payoutRateAge65: 5.0,
      payoutRateAge70: 5.5,
      payoutRateAge75: 6.0,
    },
  },
  {
    id: "athene-ascent-pro",
    carrier: "Athene",
    name: "Ascent Pro Bonus",
    fullName: "Athene Ascent Pro Bonus",
    sleeve: "income",
    rank: 2,
    annualCap: 8.0,
    participationRate: 120,
    floorRate: 0,
    creditingStrategy: "Annual PTP with Participation Rate, Income rider with bonus",
    surrenderYears: 10,
    surrenderSchedule: [10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 0],
    freeWithdrawalPct: 10,
    ltvBand: [0.25, 0.35],
    hasPublicCAForm: true,
    hasMVA: true,
    bonusRate: 10,
    bonusVestingYears: 10,
    features: [
      "10% premium bonus",
      "120% participation rate",
      "10% free withdrawals from year 1",
      "Attractive income rider features",
      "Collateral assignment form available",
    ],
    warnings: [
      "No public language confirming collateral assignment preserves rider",
      "Would not underwrite as aggressively as accumulation chassis",
      "10-year surrender schedule",
    ],
    nonQualifiedOnly: true,
    incomeRider: {
      rollUpRate: 7.5,
      rollUpType: "compound",
      rollUpYears: 10,
      payoutRateAge65: 5.25,
      payoutRateAge70: 5.75,
      payoutRateAge75: 6.25,
    },
  },
  {
    id: "fg-safe-income",
    carrier: "F&G",
    name: "Safe Income Advantage",
    fullName: "F&G Safe Income Advantage",
    sleeve: "income",
    rank: 3,
    annualCap: 7.0,
    participationRate: 100,
    floorRate: 0,
    creditingStrategy: "Annual PTP with Cap, EGMWB rider with 7.2% compound roll-up",
    surrenderYears: 10,
    surrenderSchedule: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    freeWithdrawalPct: 10,
    ltvBand: [0.25, 0.35],
    hasPublicCAForm: false,
    hasMVA: true,
    bonusRate: 0,
    bonusVestingYears: 0,
    features: [
      "7.2% compounded EGMWB roll-up",
      "Non-qualified availability",
      "10% free withdrawals",
      "Credible income sleeve option",
    ],
    warnings: [
      "10-year surrender schedule (longest of the income options)",
      "MVA profile less attractive for bank-collateral role",
      "Less attractive than SecureIncome 7 for collateral purposes",
    ],
    nonQualifiedOnly: true,
    incomeRider: {
      rollUpRate: 7.2,
      rollUpType: "compound",
      rollUpYears: 10,
      payoutRateAge65: 4.75,
      payoutRateAge70: 5.25,
      payoutRateAge75: 5.75,
    },
  },
];

export const COLLATERAL_PRODUCTS = FIA_PRODUCTS.filter(p => p.sleeve === "collateral");
export const INCOME_PRODUCTS = FIA_PRODUCTS.filter(p => p.sleeve === "income");

/* ─── FIA WATERFALL INPUT ─── */
export interface FIAWaterfallInput {
  /** Total premium to deploy */
  totalPremium: number;
  /** Collateral sleeve allocation (0-1, e.g. 0.65 = 65%) */
  collateralAllocation: number;
  /** Selected collateral product ID */
  collateralProductId: string;
  /** Selected income product ID */
  incomeProductId: string;
  /** Assumed annual index return (%) — used to estimate FIA crediting */
  assumedIndexReturn: number;
  /** Bank loan interest rate (%) */
  bankLoanRate: number;
  /** O&G investment term (years) */
  oilGasTerm: number;
  /** O&G annual return rate (%) */
  oilGasReturnRate: number;
  /** O&G depreciation Y1 (%) */
  oilGasDepreciationY1: number;
  /** O&G depreciation ongoing (%) */
  oilGasDepreciationOngoing: number;
  /** Projection years */
  projectionYears: number;
  /** Annual earned income */
  annualIncome: number;
  /** Federal tax rate (%) */
  federalTaxRate: number;
  /** State tax rate (%) */
  stateTaxRate: number;
  /** Home value */
  homeValue: number;
  /** Mortgage balance */
  mortgageBalance: number;
  /** HELOC rate (%) */
  helocRate: number;
  /** HELOC max LTV */
  helocMaxLtv: number;
  /** Client age at start */
  clientAge: number;
}

/* ─── FIA WATERFALL OUTPUT ─── */
export interface FIAYearRow {
  year: number;
  cycle: number;
  cycleYear: number;
  // Collateral sleeve
  collateralStartValue: number;
  collateralCredited: number;
  collateralEndValue: number;
  collateralSurrenderValue: number;
  // Income sleeve
  incomeStartValue: number;
  incomeCredited: number;
  incomeEndValue: number;
  incomeRiderValue: number;
  incomeWithdrawal: number;
  // Bank loan
  bankLoanBalance: number;
  bankLoanInterestPaid: number;
  bankLoanPrincipalPaid: number;
  bankLoanEndBalance: number;
  maxLoanAllowed: number;
  // O&G
  oilGasInvestment: number;
  oilGasIncome: number;
  oilGasDepreciation: number;
  oilGasCumulativeIncome: number;
  // Tax savings
  taxDeduction: number;
  taxSavings: number;
  cumulativeTaxSavings: number;
  // HELOC
  helocBalance: number;
  helocInterestPaid: number;
  helocPrincipalPaid: number;
  // Net
  netCashFlow: number;
  cumulativeNetCashFlow: number;
  totalBenefit: number;
  isMaturityYear: boolean;
}

export interface FIAWaterfallSummary {
  totalPremiumInvested: number;
  collateralPremium: number;
  incomePremium: number;
  totalFIAGrowth: number;
  totalBankInterestPaid: number;
  totalOilGasIncome: number;
  totalTaxSavings: number;
  totalHelocPrincipalPaid: number;
  helocPayoffYear: number | null;
  totalNetBenefit: number;
  effectiveAnnualReturn: number;
  maxLoanAmount: number;
  finalCollateralValue: number;
  finalIncomeRiderValue: number;
  estimatedAnnualIncome: number;
}

export interface FIAWaterfallResult {
  input: FIAWaterfallInput;
  collateralProduct: FIAProduct;
  incomeProduct: FIAProduct;
  projection: FIAYearRow[];
  summary: FIAWaterfallSummary;
}

/* ─── HELPER: Calculate FIA credited rate for a year ─── */
function calculateCreditedRate(product: FIAProduct, indexReturn: number): number {
  // FIA crediting: min(cap, indexReturn * participationRate/100), floored at floorRate
  const effectiveReturn = indexReturn * (product.participationRate / 100);
  const cappedReturn = Math.min(effectiveReturn, product.annualCap);
  return Math.max(cappedReturn, product.floorRate);
}

/* ─── HELPER: Get surrender value ─── */
function getSurrenderValue(contractValue: number, product: FIAProduct, year: number): number {
  const chargeIdx = Math.min(year, product.surrenderSchedule.length - 1);
  const charge = product.surrenderSchedule[chargeIdx] ?? 0;
  return contractValue * (1 - charge / 100);
}

/* ─── MAIN ENGINE ─── */
export function runFIAWaterfall(input: FIAWaterfallInput): FIAWaterfallResult {
  const collateralProduct = FIA_PRODUCTS.find(p => p.id === input.collateralProductId) ?? FIA_PRODUCTS[0];
  const incomeProduct = FIA_PRODUCTS.find(p => p.id === input.incomeProductId) ?? FIA_PRODUCTS[3];

  const collateralPremium = input.totalPremium * input.collateralAllocation;
  const incomePremium = input.totalPremium * (1 - input.collateralAllocation);

  // Apply bonuses
  let collateralValue = collateralPremium * (1 + collateralProduct.bonusRate / 100);
  let incomeValue = incomePremium * (1 + incomeProduct.bonusRate / 100);
  let incomeRiderValue = incomeValue;

  // LTV: use midpoint of the product's band
  const collateralLTV = (collateralProduct.ltvBand[0] + collateralProduct.ltvBand[1]) / 2;

  // HELOC calculation
  const homeEquity = Math.max(0, input.homeValue * input.helocMaxLtv - input.mortgageBalance);
  let helocBalance = homeEquity;

  // Bank loan: constrained by LTV band
  const maxLoan = collateralValue * collateralLTV;
  let bankLoanBalance = maxLoan;
  const oilGasInvestment = bankLoanBalance;

  const combinedTaxRate = (input.federalTaxRate + input.stateTaxRate) / 100;
  const projection: FIAYearRow[] = [];
  let cumulativeOGIncome = 0;
  let cumulativeTaxSavings = 0;
  let cumulativeNetCashFlow = 0;
  let helocPayoffYear: number | null = null;
  let totalBankInterestPaid = 0;
  let totalOGIncome = 0;
  let totalTaxSavings = 0;
  let totalHelocPrincipalPaid = 0;
  let totalHelocInterestPaid = 0;

  const cycleLength = collateralProduct.surrenderYears || 5;

  for (let y = 1; y <= input.projectionYears; y++) {
    const cycle = Math.ceil(y / (cycleLength || 5));
    const cycleYear = ((y - 1) % (cycleLength || 5)) + 1;
    const isMaturityYear = cycleYear === (cycleLength || 5);

    // FIA crediting
    const collateralCredited = collateralValue * (calculateCreditedRate(collateralProduct, input.assumedIndexReturn) / 100);
    collateralValue += collateralCredited;

    const incomeCredited = incomeValue * (calculateCreditedRate(incomeProduct, input.assumedIndexReturn) / 100);
    incomeValue += incomeCredited;

    // Income rider roll-up
    if (incomeProduct.incomeRider && y <= incomeProduct.incomeRider.rollUpYears) {
      if (incomeProduct.incomeRider.rollUpType === "compound") {
        incomeRiderValue *= (1 + incomeProduct.incomeRider.rollUpRate / 100);
      } else {
        incomeRiderValue += incomePremium * (incomeProduct.incomeRider.rollUpRate / 100);
      }
    }
    incomeRiderValue = Math.max(incomeRiderValue, incomeValue);

    // Bank loan interest (interest-only)
    const bankInterest = bankLoanBalance * (input.bankLoanRate / 100);
    totalBankInterestPaid += bankInterest;

    // O&G income
    const ogIncome = y <= input.oilGasTerm ? oilGasInvestment * (input.oilGasReturnRate / 100) : 0;
    cumulativeOGIncome += ogIncome;
    totalOGIncome += ogIncome;

    // O&G depreciation
    const ogDepreciation = y === 1
      ? oilGasInvestment * (input.oilGasDepreciationY1 / 100)
      : (y <= input.oilGasTerm ? oilGasInvestment * (input.oilGasDepreciationOngoing / 100) : 0);

    // Tax savings
    const taxSavings = ogDepreciation * combinedTaxRate;
    cumulativeTaxSavings += taxSavings;
    totalTaxSavings += taxSavings;

    // HELOC interest
    const helocInterest = helocBalance > 0 ? helocBalance * (input.helocRate / 100) : 0;
    totalHelocInterestPaid += helocInterest;

    // Deploy tax savings + excess O&G to HELOC principal
    const excessOG = Math.max(0, ogIncome - bankInterest);
    const availableForHELOC = taxSavings + excessOG;
    const helocPrincipalPayment = Math.min(availableForHELOC, helocBalance);
    helocBalance = Math.max(0, helocBalance - helocPrincipalPayment);
    totalHelocPrincipalPaid += helocPrincipalPayment;

    if (helocBalance <= 0 && helocPayoffYear === null && homeEquity > 0) {
      helocPayoffYear = y;
    }

    // Bank loan principal payment on maturity
    let bankPrincipalPaid = 0;
    if (isMaturityYear && collateralProduct.surrenderYears > 0) {
      bankPrincipalPaid = Math.min(bankLoanBalance, getSurrenderValue(collateralValue, collateralProduct, y));
      bankLoanBalance = Math.max(0, bankLoanBalance - bankPrincipalPaid);
    }

    // Max loan allowed (for display)
    const currentMaxLoan = getSurrenderValue(collateralValue, collateralProduct, y) * collateralLTV;

    // Income withdrawal (if rider is active and past deferral)
    let incomeWithdrawal = 0;
    if (incomeProduct.incomeRider && y > incomeProduct.incomeRider.rollUpYears) {
      const age = input.clientAge + y;
      let payoutRate = incomeProduct.incomeRider.payoutRateAge65;
      if (age >= 75) payoutRate = incomeProduct.incomeRider.payoutRateAge75;
      else if (age >= 70) payoutRate = incomeProduct.incomeRider.payoutRateAge70;
      incomeWithdrawal = incomeRiderValue * (payoutRate / 100);
    }

    const netCashFlow = ogIncome + taxSavings + incomeWithdrawal - bankInterest - helocInterest;
    cumulativeNetCashFlow += netCashFlow;

    const totalBenefit = collateralValue + incomeValue + cumulativeOGIncome + cumulativeTaxSavings - bankLoanBalance - helocBalance;

    projection.push({
      year: y,
      cycle,
      cycleYear,
      collateralStartValue: collateralValue - collateralCredited,
      collateralCredited,
      collateralEndValue: collateralValue,
      collateralSurrenderValue: getSurrenderValue(collateralValue, collateralProduct, y),
      incomeStartValue: incomeValue - incomeCredited,
      incomeCredited,
      incomeEndValue: incomeValue,
      incomeRiderValue,
      incomeWithdrawal,
      bankLoanBalance,
      bankLoanInterestPaid: bankInterest,
      bankLoanPrincipalPaid: bankPrincipalPaid,
      bankLoanEndBalance: bankLoanBalance,
      maxLoanAllowed: currentMaxLoan,
      oilGasInvestment: y === 1 ? oilGasInvestment : 0,
      oilGasIncome: ogIncome,
      oilGasDepreciation: ogDepreciation,
      oilGasCumulativeIncome: cumulativeOGIncome,
      taxDeduction: ogDepreciation,
      taxSavings,
      cumulativeTaxSavings,
      helocBalance,
      helocInterestPaid: helocInterest,
      helocPrincipalPaid: helocPrincipalPayment,
      netCashFlow,
      cumulativeNetCashFlow,
      totalBenefit,
      isMaturityYear,
    });
  }

  // Estimated annual income at rider activation
  const lastRow = projection[projection.length - 1];
  let estimatedAnnualIncome = 0;
  if (incomeProduct.incomeRider) {
    const activationAge = input.clientAge + incomeProduct.incomeRider.rollUpYears;
    let payoutRate = incomeProduct.incomeRider.payoutRateAge65;
    if (activationAge >= 75) payoutRate = incomeProduct.incomeRider.payoutRateAge75;
    else if (activationAge >= 70) payoutRate = incomeProduct.incomeRider.payoutRateAge70;
    estimatedAnnualIncome = (lastRow?.incomeRiderValue ?? 0) * (payoutRate / 100);
  }

  const summary: FIAWaterfallSummary = {
    totalPremiumInvested: input.totalPremium,
    collateralPremium,
    incomePremium,
    totalFIAGrowth: (collateralValue - collateralPremium) + (incomeValue - incomePremium),
    totalBankInterestPaid,
    totalOilGasIncome: totalOGIncome,
    totalTaxSavings,
    totalHelocPrincipalPaid,
    helocPayoffYear,
    totalNetBenefit: lastRow?.totalBenefit ?? 0,
    effectiveAnnualReturn: input.projectionYears > 0
      ? ((lastRow?.totalBenefit ?? 0) / input.totalPremium - 1) / input.projectionYears * 100
      : 0,
    maxLoanAmount: maxLoan,
    finalCollateralValue: collateralValue,
    finalIncomeRiderValue: incomeRiderValue,
    estimatedAnnualIncome,
  };

  return {
    input,
    collateralProduct,
    incomeProduct,
    projection,
    summary,
  };
}

/* ─── DEFAULTS ─── */
export function getDefaultFIAInput(): FIAWaterfallInput {
  return {
    totalPremium: 1000000,
    collateralAllocation: 0.65,
    collateralProductId: "sb-clearline",
    incomeProductId: "fg-secureincome7",
    assumedIndexReturn: 8,
    bankLoanRate: 7,
    oilGasTerm: 12,
    oilGasReturnRate: 15,
    oilGasDepreciationY1: 80,
    oilGasDepreciationOngoing: 8,
    projectionYears: 25,
    annualIncome: 250000,
    federalTaxRate: 32,
    stateTaxRate: 5,
    homeValue: 750000,
    mortgageBalance: 300000,
    helocRate: 8.5,
    helocMaxLtv: 0.80,
    clientAge: 55,
  };
}

/* ─── COMPARISON: Run all 9 product combinations ─── */
export interface ProductCombo {
  collateralId: string;
  incomeId: string;
  label: string;
  totalBenefit: number;
  helocPayoffYear: number | null;
  estimatedIncome: number;
  maxLoan: number;
}

export function runAllCombinations(baseInput: FIAWaterfallInput): ProductCombo[] {
  const combos: ProductCombo[] = [];
  for (const cp of COLLATERAL_PRODUCTS) {
    for (const ip of INCOME_PRODUCTS) {
      const result = runFIAWaterfall({
        ...baseInput,
        collateralProductId: cp.id,
        incomeProductId: ip.id,
      });
      combos.push({
        collateralId: cp.id,
        incomeId: ip.id,
        label: `${cp.name} + ${ip.name}`,
        totalBenefit: result.summary.totalNetBenefit,
        helocPayoffYear: result.summary.helocPayoffYear,
        estimatedIncome: result.summary.estimatedAnnualIncome,
        maxLoan: result.summary.maxLoanAmount,
      });
    }
  }
  return combos.sort((a, b) => b.totalBenefit - a.totalBenefit);
}
