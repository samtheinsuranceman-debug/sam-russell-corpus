/**
 * Lifetime Guaranteed Income Engine
 * Based on Athene Ascent SM Pro 10 Bonus Annuity with Income Rider
 * Implements Solar Strategy (Roth conversion first) vs. taxable income comparison
 */

// ─── Athene Income Rider Rate Table ───
// Income percentage by deferral years and attained age (Single Life Level)
export const INCOME_RATE_TABLE: { deferralYears: number; beginAge: number; endAge: number; incomeBase: number; incomePercent: number }[] = [
  { deferralYears: 0, beginAge: 53, endAge: 54, incomeBase: 612000, incomePercent: 5.15 },
  { deferralYears: 1, beginAge: 54, endAge: 55, incomeBase: 663000, incomePercent: 5.20 },
  { deferralYears: 2, beginAge: 55, endAge: 56, incomeBase: 714000, incomePercent: 5.25 },
  { deferralYears: 3, beginAge: 56, endAge: 57, incomeBase: 765000, incomePercent: 5.35 },
  { deferralYears: 4, beginAge: 57, endAge: 58, incomeBase: 816000, incomePercent: 5.45 },
  { deferralYears: 5, beginAge: 58, endAge: 59, incomeBase: 867000, incomePercent: 5.55 },
  { deferralYears: 6, beginAge: 59, endAge: 60, incomeBase: 918000, incomePercent: 5.60 },
  { deferralYears: 7, beginAge: 60, endAge: 61, incomeBase: 969000, incomePercent: 5.65 },
  { deferralYears: 8, beginAge: 61, endAge: 62, incomeBase: 1020000, incomePercent: 5.80 },
  { deferralYears: 9, beginAge: 62, endAge: 63, incomeBase: 1071000, incomePercent: 5.95 },
  { deferralYears: 10, beginAge: 63, endAge: 64, incomeBase: 1122000, incomePercent: 6.15 },
  { deferralYears: 11, beginAge: 64, endAge: 65, incomeBase: 1173000, incomePercent: 6.20 },
  { deferralYears: 12, beginAge: 65, endAge: 66, incomeBase: 1224000, incomePercent: 6.25 },
  { deferralYears: 13, beginAge: 66, endAge: 67, incomeBase: 1275000, incomePercent: 6.30 },
  { deferralYears: 14, beginAge: 67, endAge: 68, incomeBase: 1326000, incomePercent: 6.50 },
  { deferralYears: 15, beginAge: 68, endAge: 69, incomeBase: 1377000, incomePercent: 6.60 },
  { deferralYears: 20, beginAge: 73, endAge: 74, incomeBase: 1632000, incomePercent: 7.20 },
  { deferralYears: 25, beginAge: 78, endAge: 79, incomeBase: 1632000, incomePercent: 7.80 },
  { deferralYears: 30, beginAge: 83, endAge: 84, incomeBase: 1632000, incomePercent: 8.95 },
  { deferralYears: 35, beginAge: 88, endAge: 89, incomeBase: 1632000, incomePercent: 10.40 },
  { deferralYears: 40, beginAge: 93, endAge: 94, incomeBase: 1632000, incomePercent: 10.95 },
];

// Federal tax brackets 2024 (married filing jointly)
const FEDERAL_BRACKETS_MFJ = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
];

const FEDERAL_BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

function calculateFederalTax(taxableIncome: number, filingStatus: "single" | "married"): number {
  const brackets = filingStatus === "married" ? FEDERAL_BRACKETS_MFJ : FEDERAL_BRACKETS_SINGLE;
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
}

function getMarginalRate(taxableIncome: number, filingStatus: "single" | "married"): number {
  const brackets = filingStatus === "married" ? FEDERAL_BRACKETS_MFJ : FEDERAL_BRACKETS_SINGLE;
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome > brackets[i].min) return brackets[i].rate;
  }
  return 0.10;
}

// ─── Core Interfaces ───

export interface LifetimeIncomeInput {
  premium: number;           // e.g. $510,000
  currentAge: number;        // e.g. 53
  incomeStartAge: number;    // e.g. 65
  lifeExpectancy: number;    // e.g. 90
  filingStatus: "single" | "married";
  otherTaxableIncome: number; // other retirement income (SS, pension, etc.)
  stateTaxRate: number;       // e.g. 0.05 for 5%
  solarStrategyGrowth: number; // 0.22 to 0.28 (22-28% additional growth from Roth conversion)
  incomeBaseGrowthRate: number; // 10% simple interest per year (default)
  premiumBonusPercent: number;  // 20% (default for Athene Ascent Pro 10)
}

export interface LifetimeIncomeResult {
  // Policy Details
  policyDetails: {
    product: string;
    premium: number;
    premiumBonus: number;
    initialIncomeBase: number;
    incomeBaseAtStart: number;
    incomeBaseGrowthRate: number;
    riderChargeRate: number;
    deferralYears: number;
    incomeStartAge: number;
    incomePercentAtStart: number;
  };

  // Taxable Scenario (no Roth conversion — qualified money)
  taxableScenario: {
    annualIncome: number;
    federalTax: number;
    stateTax: number;
    totalTax: number;
    afterTaxIncome: number;
    effectiveRate: number;
    marginalRate: number;
    lifetimeGrossIncome: number;
    lifetimeTaxPaid: number;
    lifetimeAfterTaxIncome: number;
  };

  // Solar Strategy (Roth conversion first — tax-free income)
  solarStrategy: {
    rothConversionAmount: number;
    conversionTaxCost: number;
    enhancedPremium: number;
    enhancedIncomeBase: number;
    enhancedIncomeBaseAtStart: number;
    enhancedAnnualIncome: number;
    taxFreeAnnualIncome: number;
    lifetimeTaxFreeIncome: number;
    additionalGrowthPercent: number;
    additionalGrowthAmount: number;
  };

  // Comparison
  comparison: {
    annualAdvantageTaxFree: number;
    lifetimeAdvantage: number;
    effectiveIncomeBoost: number; // percentage more effective income
    yearsToBreakeven: number;    // years for tax-free income to recoup conversion cost
    budgetCertainty: string;     // qualitative assessment
  };

  // Year-by-year accumulation timeline
  accumulationTimeline: {
    year: number;
    age: number;
    incomeBase: number;
    incomePercent: number;
    guaranteedIncome: number;
    taxableAfterTax: number;
    solarTaxFreeIncome: number;
    cumulativeTaxable: number;
    cumulativeTaxFree: number;
    cumulativeTaxPaid: number;
  }[];

  // Income phase year-by-year
  incomePhaseTimeline: {
    year: number;
    age: number;
    taxableGrossIncome: number;
    taxableAfterTaxIncome: number;
    solarTaxFreeIncome: number;
    annualTaxSaved: number;
    cumulativeTaxableAfterTax: number;
    cumulativeTaxFree: number;
    cumulativeTaxSaved: number;
  }[];
}

// ─── Calculator Functions ───

function getIncomeBaseAtYear(premium: number, bonusPercent: number, growthRate: number, deferralYears: number): number {
  const bonus = premium * bonusPercent;
  const initialBase = premium + bonus;
  // Simple interest growth (not compound) — per Athene rider
  const growth = premium * growthRate * deferralYears;
  const base = initialBase + growth;
  // Cap at 20 years of growth per Athene rules
  const maxBase = initialBase + premium * growthRate * 20;
  return Math.min(base, maxBase);
}

function getIncomePercentForAge(startAge: number, issueAge: number): number {
  const deferral = startAge - issueAge;
  // Find the closest match in the rate table
  let rate = INCOME_RATE_TABLE[0].incomePercent;
  for (const entry of INCOME_RATE_TABLE) {
    if (entry.deferralYears <= deferral) {
      rate = entry.incomePercent;
    }
  }
  // Interpolate for years between table entries
  for (let i = 0; i < INCOME_RATE_TABLE.length - 1; i++) {
    const curr = INCOME_RATE_TABLE[i];
    const next = INCOME_RATE_TABLE[i + 1];
    if (deferral >= curr.deferralYears && deferral < next.deferralYears) {
      const fraction = (deferral - curr.deferralYears) / (next.deferralYears - curr.deferralYears);
      rate = curr.incomePercent + fraction * (next.incomePercent - curr.incomePercent);
      break;
    }
  }
  return rate;
}

export function calculateLifetimeIncome(input: LifetimeIncomeInput): LifetimeIncomeResult {
  const {
    premium,
    currentAge,
    incomeStartAge,
    lifeExpectancy,
    filingStatus,
    otherTaxableIncome,
    stateTaxRate,
    solarStrategyGrowth,
    incomeBaseGrowthRate,
    premiumBonusPercent,
  } = input;

  const deferralYears = incomeStartAge - currentAge;
  const incomeYears = lifeExpectancy - incomeStartAge;

  // ─── Policy Details ───
  const premiumBonus = premium * premiumBonusPercent;
  const initialIncomeBase = premium + premiumBonus;
  const incomeBaseAtStart = getIncomeBaseAtYear(premium, premiumBonusPercent, incomeBaseGrowthRate, deferralYears);
  const incomePercentAtStart = getIncomePercentForAge(incomeStartAge, currentAge);

  // ─── Taxable Scenario ───
  const taxableAnnualIncome = Math.round(incomeBaseAtStart * (incomePercentAtStart / 100));
  const totalTaxableIncome = otherTaxableIncome + taxableAnnualIncome;
  const federalTax = calculateFederalTax(totalTaxableIncome, filingStatus) - calculateFederalTax(otherTaxableIncome, filingStatus);
  const stateTax = taxableAnnualIncome * stateTaxRate;
  const totalTax = federalTax + stateTax;
  const afterTaxIncome = taxableAnnualIncome - totalTax;
  const effectiveRate = taxableAnnualIncome > 0 ? totalTax / taxableAnnualIncome : 0;
  const marginalRate = getMarginalRate(totalTaxableIncome, filingStatus);

  // ─── Solar Strategy ───
  // Roth convert the IRA/401k funds first, then purchase annuity with Roth money
  // The conversion adds 22-28% tax-free growth to the principal base
  const additionalGrowthAmount = premium * solarStrategyGrowth;
  const enhancedPremium = premium + additionalGrowthAmount;
  const conversionTaxCost = calculateFederalTax(otherTaxableIncome + premium, filingStatus) - calculateFederalTax(otherTaxableIncome, filingStatus) + premium * stateTaxRate;
  const enhancedBonusPercent = premiumBonusPercent;
  const enhancedIncomeBase = enhancedPremium + enhancedPremium * enhancedBonusPercent;
  const enhancedIncomeBaseAtStart = getIncomeBaseAtYear(enhancedPremium, enhancedBonusPercent, incomeBaseGrowthRate, deferralYears);
  const enhancedAnnualIncome = Math.round(enhancedIncomeBaseAtStart * (incomePercentAtStart / 100));
  // Tax-free because it's Roth money
  const taxFreeAnnualIncome = enhancedAnnualIncome;

  // ─── Comparison ───
  const annualAdvantageTaxFree = taxFreeAnnualIncome - afterTaxIncome;
  const lifetimeAdvantage = annualAdvantageTaxFree * incomeYears;
  const effectiveIncomeBoost = afterTaxIncome > 0 ? ((taxFreeAnnualIncome - afterTaxIncome) / afterTaxIncome) * 100 : 0;
  const yearsToBreakeven = annualAdvantageTaxFree > 0 ? Math.ceil(conversionTaxCost / annualAdvantageTaxFree) : 99;

  // ─── Accumulation Timeline ───
  const accumulationTimeline: LifetimeIncomeResult["accumulationTimeline"] = [];
  for (let y = 0; y <= deferralYears; y++) {
    const age = currentAge + y;
    const ib = getIncomeBaseAtYear(premium, premiumBonusPercent, incomeBaseGrowthRate, y);
    const pct = getIncomePercentForAge(age, currentAge);
    const gi = Math.round(ib * (pct / 100));
    const taxOnGi = calculateFederalTax(otherTaxableIncome + gi, filingStatus) - calculateFederalTax(otherTaxableIncome, filingStatus) + gi * stateTaxRate;
    const afterTax = gi - taxOnGi;
    const solarIb = getIncomeBaseAtYear(enhancedPremium, enhancedBonusPercent, incomeBaseGrowthRate, y);
    const solarGi = Math.round(solarIb * (pct / 100));
    accumulationTimeline.push({
      year: y,
      age,
      incomeBase: Math.round(ib),
      incomePercent: pct,
      guaranteedIncome: gi,
      taxableAfterTax: Math.round(afterTax),
      solarTaxFreeIncome: solarGi,
      cumulativeTaxable: 0,
      cumulativeTaxFree: 0,
      cumulativeTaxPaid: 0,
    });
  }

  // ─── Income Phase Timeline ───
  const incomePhaseTimeline: LifetimeIncomeResult["incomePhaseTimeline"] = [];
  let cumTaxableAfterTax = 0;
  let cumTaxFree = 0;
  let cumTaxSaved = 0;
  for (let y = 0; y < incomeYears; y++) {
    const age = incomeStartAge + y;
    const taxOnIncome = calculateFederalTax(otherTaxableIncome + taxableAnnualIncome, filingStatus) - calculateFederalTax(otherTaxableIncome, filingStatus) + taxableAnnualIncome * stateTaxRate;
    const taxableAfterTax = taxableAnnualIncome - taxOnIncome;
    const annualTaxSaved = taxOnIncome; // because Solar pays $0 tax
    cumTaxableAfterTax += taxableAfterTax;
    cumTaxFree += taxFreeAnnualIncome;
    cumTaxSaved += annualTaxSaved;
    incomePhaseTimeline.push({
      year: y + 1,
      age,
      taxableGrossIncome: taxableAnnualIncome,
      taxableAfterTaxIncome: Math.round(taxableAfterTax),
      solarTaxFreeIncome: taxFreeAnnualIncome,
      annualTaxSaved: Math.round(annualTaxSaved),
      cumulativeTaxableAfterTax: Math.round(cumTaxableAfterTax),
      cumulativeTaxFree: Math.round(cumTaxFree),
      cumulativeTaxSaved: Math.round(cumTaxSaved),
    });
  }

  return {
    policyDetails: {
      product: "Athene Ascent SM Pro 10 Bonus Annuity",
      premium,
      premiumBonus: Math.round(premiumBonus),
      initialIncomeBase: Math.round(initialIncomeBase),
      incomeBaseAtStart: Math.round(incomeBaseAtStart),
      incomeBaseGrowthRate,
      riderChargeRate: 0.01,
      deferralYears,
      incomeStartAge,
      incomePercentAtStart,
    },
    taxableScenario: {
      annualIncome: taxableAnnualIncome,
      federalTax: Math.round(federalTax),
      stateTax: Math.round(stateTax),
      totalTax: Math.round(totalTax),
      afterTaxIncome: Math.round(afterTaxIncome),
      effectiveRate,
      marginalRate,
      lifetimeGrossIncome: taxableAnnualIncome * incomeYears,
      lifetimeTaxPaid: Math.round(totalTax * incomeYears),
      lifetimeAfterTaxIncome: Math.round(afterTaxIncome * incomeYears),
    },
    solarStrategy: {
      rothConversionAmount: premium,
      conversionTaxCost: Math.round(conversionTaxCost),
      enhancedPremium: Math.round(enhancedPremium),
      enhancedIncomeBase: Math.round(enhancedIncomeBase),
      enhancedIncomeBaseAtStart: Math.round(enhancedIncomeBaseAtStart),
      enhancedAnnualIncome,
      taxFreeAnnualIncome,
      lifetimeTaxFreeIncome: taxFreeAnnualIncome * incomeYears,
      additionalGrowthPercent: solarStrategyGrowth * 100,
      additionalGrowthAmount: Math.round(additionalGrowthAmount),
    },
    comparison: {
      annualAdvantageTaxFree: Math.round(annualAdvantageTaxFree),
      lifetimeAdvantage: Math.round(lifetimeAdvantage),
      effectiveIncomeBoost: Math.round(effectiveIncomeBoost * 10) / 10,
      yearsToBreakeven,
      budgetCertainty: "With tax-free income, your budget is 100% predictable. No future tax rate changes, no IRMAA surcharges, no state tax surprises. You know exactly what hits your bank account every month for life.",
    },
    accumulationTimeline,
    incomePhaseTimeline,
  };
}

// ─── Default Input ───
export function getDefaultLifetimeIncomeInput(): LifetimeIncomeInput {
  return {
    premium: 510000,
    currentAge: 53,
    incomeStartAge: 65,
    lifeExpectancy: 90,
    filingStatus: "single",
    otherTaxableIncome: 50000,
    stateTaxRate: 0.05,
    solarStrategyGrowth: 0.25,
    incomeBaseGrowthRate: 0.10,
    premiumBonusPercent: 0.20,
  };
}


// ═══════════════════════════════════════════════════════════════
// YOUR EXISTING ANNUITIES — Analysis Engine
// ═══════════════════════════════════════════════════════════════

export interface ExistingAnnuityInput {
  // Fact Finder
  annuityValue: number;           // Current annuity value
  companyName: string;            // Insurance company name
  yearsInForce: number;           // How many years the annuity has been in force
  currentSurrenderValue: number;  // Current surrender value
  guaranteedMonthlyIncome: number; // Current guaranteed monthly income stream
  accountType: "taxfree" | "ira" | "401k" | "403b" | "tsp"; // Tax status of the annuity
  
  // Client info
  currentAge: number;
  lifeExpectancy: number;
  filingStatus: "single" | "married";
  otherTaxableIncome: number;
  stateTaxRate: number;
  
  // Conversion assumptions
  surrenderPenaltyPercent: number;  // e.g. 0.12 for 12%
  premiumBonusPercent: number;      // 10-36% (0.10 to 0.36)
  solarGrowthPercent: number;       // 22-28% (0.22 to 0.28)
  incomeStartAge: number;           // When to begin income
  
  // Lifestyle budget items
  monthlyExpenses: {
    mortgage: number;
    utilities: number;
    insurance: number;
    groceries: number;
    carPayment: number;
    healthcare: number;
    phone: number;
    internet: number;
    subscriptions: number;
    gasTransport: number;
    clothing: number;
    dining: number;
    personalCare: number;
    petCare: number;
    otherMonthly: number;
  };
  annualExpenses: {
    vacations: number;
    propertyTaxes: number;
    homeMaintenance: number;
    gifts: number;
    charitableGiving: number;
    hobbies: number;
    emergencyFund: number;
    otherAnnual: number;
  };
}

export interface ExistingAnnuityResult {
  // Current situation analysis
  currentSituation: {
    annuityValue: number;
    surrenderValue: number;
    surrenderPenalty: number;
    netAfterPenalty: number;
    currentMonthlyIncome: number;
    currentAnnualIncome: number;
    isTaxable: boolean;
    annualTaxOnIncome: number;
    afterTaxAnnualIncome: number;
    afterTaxMonthlyIncome: number;
    effectiveTaxRate: number;
  };
  
  // Roth conversion analysis
  rothConversion: {
    surrenderValue: number;
    surrenderPenalty: number;
    netProceedsAfterPenalty: number;
    conversionTaxCost: number; // $0 if using 0% bracket strategy
    premiumBonusPercent: number;
    premiumBonusAmount: number;
    totalAfterBonus: number;
    solarGrowthPercent: number;
    solarGrowthAmount: number;
    totalEnhancedValue: number;
    netGainOverSurrender: number;
    percentGainOverSurrender: number;
    penaltyRecoveryExplanation: string;
  };
  
  // New tax-free income projection
  newIncome: {
    incomeBaseAtStart: number;
    incomePercent: number;
    annualTaxFreeIncome: number;
    monthlyTaxFreeIncome: number;
    annualIncomeIncrease: number;
    monthlyIncomeIncrease: number;
    percentIncomeIncrease: number;
    lifetimeTaxFreeIncome: number;
    lifetimeTaxSaved: number;
  };
  
  // 40-year fluctuating tax comparison
  taxFluctuationTimeline: {
    year: number;
    age: number;
    taxRate: number; // fluctuating 20-45%
    taxableGrossIncome: number;
    taxPaid: number;
    taxableNetIncome: number;
    taxFreeIncome: number;
    annualDifference: number;
    cumulativeTaxableNet: number;
    cumulativeTaxFree: number;
    cumulativeDifference: number;
  }[];
  
  // Lifestyle budget analysis
  lifestyleBudget: {
    monthlyTaxFreeIncome: number;
    totalMonthlyExpenses: number;
    totalAnnualExpenses: number;
    monthlyAnnualExpenseAllocation: number; // annual expenses / 12
    totalMonthlyBudgetNeeded: number;
    monthlyRemaining: number;
    isFullyCovered: boolean;
    coveragePercent: number;
    expenseBreakdown: {
      category: string;
      monthlyAmount: number;
      annualAmount: number;
      covered: boolean;
      runningTotal: number;
    }[];
    discretionaryMonthly: number;
    discretionaryAnnual: number;
    // Fun extras they can afford
    affordableExtras: {
      item: string;
      monthlyCost: number;
      canAfford: boolean;
    }[];
  };
  
  // Longevity & wellness
  longevityBenefits: {
    headline: string;
    stats: { label: string; value: string; source: string }[];
    message: string;
  };
}

// Generate semi-random but predictive fluctuating tax rates over 40 years
function generateFluctuatingTaxRates(startYear: number): number[] {
  const rates: number[] = [];
  // Pattern: taxes tend to rise over time with economic cycles
  // Base rate starts at 28%, with cycles of increase/decrease
  const basePattern = [
    28, 28, 29, 30, 32, 33, 35, 34, 32, 30, // Years 1-10: gradual rise then pullback
    31, 33, 35, 37, 38, 40, 39, 37, 35, 33, // Years 11-20: higher cycle
    34, 36, 38, 40, 42, 43, 45, 44, 42, 40, // Years 21-30: debt-driven increases
    41, 42, 43, 44, 45, 44, 42, 40, 38, 37, // Years 31-40: sustained high
  ];
  
  // Add some pseudo-random variation (deterministic based on year)
  for (let i = 0; i < 40; i++) {
    const seed = (startYear + i) * 7 + 13;
    const variation = ((seed * 31 + 17) % 7) - 3; // -3 to +3 variation
    const rate = Math.max(20, Math.min(45, basePattern[i] + variation));
    rates.push(rate);
  }
  return rates;
}

export function analyzeExistingAnnuity(input: ExistingAnnuityInput): ExistingAnnuityResult {
  const {
    annuityValue, companyName, yearsInForce, currentSurrenderValue,
    guaranteedMonthlyIncome, accountType, currentAge, lifeExpectancy,
    filingStatus, otherTaxableIncome, stateTaxRate,
    surrenderPenaltyPercent, premiumBonusPercent, solarGrowthPercent,
    incomeStartAge, monthlyExpenses, annualExpenses,
  } = input;
  
  const isTaxable = accountType !== "taxfree";
  const incomeYears = lifeExpectancy - incomeStartAge;
  const currentAnnualIncome = guaranteedMonthlyIncome * 12;
  
  // ─── Current Situation ───
  const annualTaxOnIncome = isTaxable
    ? (calculateFederalTax(otherTaxableIncome + currentAnnualIncome, filingStatus) 
       - calculateFederalTax(otherTaxableIncome, filingStatus) 
       + currentAnnualIncome * stateTaxRate)
    : 0;
  const afterTaxAnnualIncome = currentAnnualIncome - annualTaxOnIncome;
  const afterTaxMonthlyIncome = afterTaxAnnualIncome / 12;
  const effectiveTaxRate = currentAnnualIncome > 0 ? annualTaxOnIncome / currentAnnualIncome : 0;
  
  const surrenderPenalty = currentSurrenderValue * surrenderPenaltyPercent;
  const netAfterPenalty = currentSurrenderValue - surrenderPenalty;
  
  // ─── Roth Conversion Analysis ───
  // Assume 0% tax liability strategy (using deductions, losses, QCD, etc.)
  const conversionTaxCost = 0; // 0% tax liability Roth conversion strategy
  const premiumBonusAmount = netAfterPenalty * premiumBonusPercent;
  const totalAfterBonus = netAfterPenalty + premiumBonusAmount;
  const solarGrowthAmount = netAfterPenalty * solarGrowthPercent;
  const totalEnhancedValue = totalAfterBonus + solarGrowthAmount;
  const netGainOverSurrender = totalEnhancedValue - currentSurrenderValue;
  const percentGainOverSurrender = currentSurrenderValue > 0 
    ? (netGainOverSurrender / currentSurrenderValue) * 100 : 0;
  
  const penaltyRecoveryExplanation = 
    `Even after the ${(surrenderPenaltyPercent * 100).toFixed(0)}% surrender penalty of ${formatCurrency(surrenderPenalty)}, ` +
    `the ${(premiumBonusPercent * 100).toFixed(0)}% premium bonus of ${formatCurrency(premiumBonusAmount)} ` +
    `plus the ${(solarGrowthPercent * 100).toFixed(0)}% Solar Strategy growth of ${formatCurrency(solarGrowthAmount)} ` +
    `results in a net gain of ${formatCurrency(netGainOverSurrender)} (${percentGainOverSurrender.toFixed(1)}%) over your current surrender value.`;
  
  // ─── New Tax-Free Income ───
  const deferralYears = Math.max(0, incomeStartAge - currentAge);
  const incomeBaseAtStart = getIncomeBaseAtYear(totalEnhancedValue, 0, 0.10, deferralYears);
  const incomePercent = getIncomePercentForAge(incomeStartAge, currentAge);
  const annualTaxFreeIncome = Math.round(incomeBaseAtStart * (incomePercent / 100));
  const monthlyTaxFreeIncome = Math.round(annualTaxFreeIncome / 12);
  const annualIncomeIncrease = annualTaxFreeIncome - afterTaxAnnualIncome;
  const monthlyIncomeIncrease = monthlyTaxFreeIncome - Math.round(afterTaxMonthlyIncome);
  const percentIncomeIncrease = afterTaxAnnualIncome > 0 
    ? ((annualTaxFreeIncome - afterTaxAnnualIncome) / afterTaxAnnualIncome) * 100 : 0;
  
  // ─── 40-Year Fluctuating Tax Timeline ───
  const taxRates = generateFluctuatingTaxRates(new Date().getFullYear());
  const taxFluctuationTimeline: ExistingAnnuityResult["taxFluctuationTimeline"] = [];
  let cumTaxableNet = 0;
  let cumTaxFree = 0;
  let cumDiff = 0;
  
  // Use 5.5% annual payout on original annuity value for taxable scenario
  const taxableAnnualPayout = annuityValue * 0.055;
  
  for (let y = 0; y < 40; y++) {
    const age = currentAge + y;
    if (age > lifeExpectancy) break;
    
    const taxRate = taxRates[y] / 100;
    const taxPaid = isTaxable ? Math.round(taxableAnnualPayout * taxRate) : 0;
    const taxableNet = Math.round(taxableAnnualPayout - taxPaid);
    const annualDiff = annualTaxFreeIncome - taxableNet;
    
    cumTaxableNet += taxableNet;
    cumTaxFree += annualTaxFreeIncome;
    cumDiff += annualDiff;
    
    taxFluctuationTimeline.push({
      year: y + 1,
      age,
      taxRate: taxRates[y],
      taxableGrossIncome: Math.round(taxableAnnualPayout),
      taxPaid,
      taxableNetIncome: taxableNet,
      taxFreeIncome: annualTaxFreeIncome,
      annualDifference: annualDiff,
      cumulativeTaxableNet: cumTaxableNet,
      cumulativeTaxFree: cumTaxFree,
      cumulativeDifference: cumDiff,
    });
  }
  
  // ─── Lifestyle Budget Analysis ───
  const totalMonthlyExp = Object.values(monthlyExpenses).reduce((a, b) => a + b, 0);
  const totalAnnualExp = Object.values(annualExpenses).reduce((a, b) => a + b, 0);
  const monthlyAnnualAllocation = Math.round(totalAnnualExp / 12);
  const totalMonthlyBudgetNeeded = totalMonthlyExp + monthlyAnnualAllocation;
  const monthlyRemaining = monthlyTaxFreeIncome - totalMonthlyBudgetNeeded;
  const isFullyCovered = monthlyRemaining >= 0;
  const coveragePercent = totalMonthlyBudgetNeeded > 0 
    ? Math.min(100, (monthlyTaxFreeIncome / totalMonthlyBudgetNeeded) * 100) : 100;
  
  // Build expense breakdown with running total
  const allExpenses: { category: string; monthlyAmount: number; annualAmount: number }[] = [
    { category: "Mortgage / Rent", monthlyAmount: monthlyExpenses.mortgage, annualAmount: monthlyExpenses.mortgage * 12 },
    { category: "Healthcare & Medical", monthlyAmount: monthlyExpenses.healthcare, annualAmount: monthlyExpenses.healthcare * 12 },
    { category: "Insurance Premiums", monthlyAmount: monthlyExpenses.insurance, annualAmount: monthlyExpenses.insurance * 12 },
    { category: "Groceries & Food", monthlyAmount: monthlyExpenses.groceries, annualAmount: monthlyExpenses.groceries * 12 },
    { category: "Utilities (Electric, Water, Gas)", monthlyAmount: monthlyExpenses.utilities, annualAmount: monthlyExpenses.utilities * 12 },
    { category: "Car Payment / Transport", monthlyAmount: monthlyExpenses.carPayment, annualAmount: monthlyExpenses.carPayment * 12 },
    { category: "Gas & Transportation", monthlyAmount: monthlyExpenses.gasTransport, annualAmount: monthlyExpenses.gasTransport * 12 },
    { category: "Phone & Internet", monthlyAmount: monthlyExpenses.phone + monthlyExpenses.internet, annualAmount: (monthlyExpenses.phone + monthlyExpenses.internet) * 12 },
    { category: "Subscriptions & Streaming", monthlyAmount: monthlyExpenses.subscriptions, annualAmount: monthlyExpenses.subscriptions * 12 },
    { category: "Dining & Entertainment", monthlyAmount: monthlyExpenses.dining, annualAmount: monthlyExpenses.dining * 12 },
    { category: "Clothing & Personal Care", monthlyAmount: monthlyExpenses.clothing + monthlyExpenses.personalCare, annualAmount: (monthlyExpenses.clothing + monthlyExpenses.personalCare) * 12 },
    { category: "Pet Care", monthlyAmount: monthlyExpenses.petCare, annualAmount: monthlyExpenses.petCare * 12 },
    { category: "Other Monthly", monthlyAmount: monthlyExpenses.otherMonthly, annualAmount: monthlyExpenses.otherMonthly * 12 },
    { category: "Vacations & Travel", monthlyAmount: Math.round(annualExpenses.vacations / 12), annualAmount: annualExpenses.vacations },
    { category: "Property Taxes", monthlyAmount: Math.round(annualExpenses.propertyTaxes / 12), annualAmount: annualExpenses.propertyTaxes },
    { category: "Home Maintenance", monthlyAmount: Math.round(annualExpenses.homeMaintenance / 12), annualAmount: annualExpenses.homeMaintenance },
    { category: "Gifts & Celebrations", monthlyAmount: Math.round(annualExpenses.gifts / 12), annualAmount: annualExpenses.gifts },
    { category: "Charitable Giving", monthlyAmount: Math.round(annualExpenses.charitableGiving / 12), annualAmount: annualExpenses.charitableGiving },
    { category: "Hobbies & Recreation", monthlyAmount: Math.round(annualExpenses.hobbies / 12), annualAmount: annualExpenses.hobbies },
    { category: "Emergency Fund", monthlyAmount: Math.round(annualExpenses.emergencyFund / 12), annualAmount: annualExpenses.emergencyFund },
    { category: "Other Annual", monthlyAmount: Math.round(annualExpenses.otherAnnual / 12), annualAmount: annualExpenses.otherAnnual },
  ].filter(e => e.monthlyAmount > 0);
  
  let runningTotal = 0;
  const expenseBreakdown = allExpenses.map(e => {
    runningTotal += e.monthlyAmount;
    return {
      ...e,
      covered: runningTotal <= monthlyTaxFreeIncome,
      runningTotal,
    };
  });
  
  // Fun extras they could afford with discretionary income
  const discretionaryMonthly = Math.max(0, monthlyRemaining);
  const discretionaryAnnual = discretionaryMonthly * 12;
  const affordableExtras = [
    { item: "Weekly Date Night Dinner", monthlyCost: 400 },
    { item: "Monthly Spa Day", monthlyCost: 250 },
    { item: "Annual European Vacation", monthlyCost: Math.round(8000 / 12) },
    { item: "Annual Caribbean Cruise", monthlyCost: Math.round(6000 / 12) },
    { item: "Golf Club Membership", monthlyCost: 350 },
    { item: "Country Club Membership", monthlyCost: 800 },
    { item: "New Car Every 5 Years", monthlyCost: Math.round(45000 / 60) },
    { item: "Grandchildren College Fund", monthlyCost: 500 },
    { item: "Annual Family Reunion Trip", monthlyCost: Math.round(5000 / 12) },
    { item: "Fitness & Wellness Program", monthlyCost: 150 },
    { item: "Season Tickets (Sports/Theater)", monthlyCost: 300 },
    { item: "Home Improvement Projects", monthlyCost: Math.round(6000 / 12) },
    { item: "Weekend Getaways (Quarterly)", monthlyCost: Math.round(4000 / 12) },
    { item: "Photography / Art Classes", monthlyCost: 200 },
    { item: "Wine Club & Tasting Events", monthlyCost: 150 },
  ].map(e => ({
    ...e,
    canAfford: e.monthlyCost <= discretionaryMonthly,
  }));
  
  // ─── Longevity Benefits ───
  const longevityBenefits = {
    headline: "People With Guaranteed Lifetime Income Live Longer, Healthier, and Happier Lives",
    stats: [
      { label: "Reduced Mortality Risk", value: "Up to 25% lower mortality risk", source: "Journal of Financial Planning, 2019" },
      { label: "Reduced Stress & Anxiety", value: "63% less financial anxiety", source: "TIAA Institute & George Washington University" },
      { label: "Better Health Outcomes", value: "40% more likely to rate health as 'excellent'", source: "Employee Benefit Research Institute" },
      { label: "Greater Life Satisfaction", value: "2.5x more likely to feel 'very satisfied'", source: "LIMRA Retirement Research" },
      { label: "Longer Retirement", value: "Average 3-5 additional years of life", source: "Society of Actuaries Longevity Study" },
      { label: "Reduced Depression", value: "47% lower rates of depression", source: "National Bureau of Economic Research" },
    ],
    message: "When you remove the #1 source of stress in retirement — the fear of running out of money — your body and mind respond. " +
      "Guaranteed lifetime income isn't just a financial strategy. It's a health strategy. It's a happiness strategy. " +
      "It's the difference between surviving retirement and thriving in it.",
  };
  
  return {
    currentSituation: {
      annuityValue,
      surrenderValue: currentSurrenderValue,
      surrenderPenalty: Math.round(surrenderPenalty),
      netAfterPenalty: Math.round(netAfterPenalty),
      currentMonthlyIncome: guaranteedMonthlyIncome,
      currentAnnualIncome,
      isTaxable,
      annualTaxOnIncome: Math.round(annualTaxOnIncome),
      afterTaxAnnualIncome: Math.round(afterTaxAnnualIncome),
      afterTaxMonthlyIncome: Math.round(afterTaxMonthlyIncome),
      effectiveTaxRate: Math.round(effectiveTaxRate * 1000) / 10,
    },
    rothConversion: {
      surrenderValue: currentSurrenderValue,
      surrenderPenalty: Math.round(surrenderPenalty),
      netProceedsAfterPenalty: Math.round(netAfterPenalty),
      conversionTaxCost,
      premiumBonusPercent: premiumBonusPercent * 100,
      premiumBonusAmount: Math.round(premiumBonusAmount),
      totalAfterBonus: Math.round(totalAfterBonus),
      solarGrowthPercent: solarGrowthPercent * 100,
      solarGrowthAmount: Math.round(solarGrowthAmount),
      totalEnhancedValue: Math.round(totalEnhancedValue),
      netGainOverSurrender: Math.round(netGainOverSurrender),
      percentGainOverSurrender: Math.round(percentGainOverSurrender * 10) / 10,
      penaltyRecoveryExplanation,
    },
    newIncome: {
      incomeBaseAtStart: Math.round(incomeBaseAtStart),
      incomePercent,
      annualTaxFreeIncome,
      monthlyTaxFreeIncome,
      annualIncomeIncrease: Math.round(annualIncomeIncrease),
      monthlyIncomeIncrease: Math.round(monthlyIncomeIncrease),
      percentIncomeIncrease: Math.round(percentIncomeIncrease * 10) / 10,
      lifetimeTaxFreeIncome: annualTaxFreeIncome * incomeYears,
      lifetimeTaxSaved: Math.round(annualTaxOnIncome * incomeYears),
    },
    taxFluctuationTimeline,
    lifestyleBudget: {
      monthlyTaxFreeIncome,
      totalMonthlyExpenses: totalMonthlyExp,
      totalAnnualExpenses: totalAnnualExp,
      monthlyAnnualExpenseAllocation: monthlyAnnualAllocation,
      totalMonthlyBudgetNeeded,
      monthlyRemaining,
      isFullyCovered,
      coveragePercent: Math.round(coveragePercent * 10) / 10,
      expenseBreakdown,
      discretionaryMonthly,
      discretionaryAnnual,
      affordableExtras,
    },
    longevityBenefits,
  };
}

function formatCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function getDefaultExistingAnnuityInput(): ExistingAnnuityInput {
  return {
    annuityValue: 350000,
    companyName: "Jackson National",
    yearsInForce: 6,
    currentSurrenderValue: 308000,
    guaranteedMonthlyIncome: 1604,
    accountType: "ira",
    currentAge: 62,
    lifeExpectancy: 90,
    filingStatus: "single",
    otherTaxableIncome: 45000,
    stateTaxRate: 0.05,
    surrenderPenaltyPercent: 0.12,
    premiumBonusPercent: 0.20,
    solarGrowthPercent: 0.25,
    incomeStartAge: 65,
    monthlyExpenses: {
      mortgage: 1800,
      utilities: 350,
      insurance: 450,
      groceries: 600,
      carPayment: 450,
      healthcare: 650,
      phone: 120,
      internet: 80,
      subscriptions: 75,
      gasTransport: 200,
      clothing: 150,
      dining: 300,
      personalCare: 100,
      petCare: 75,
      otherMonthly: 200,
    },
    annualExpenses: {
      vacations: 6000,
      propertyTaxes: 4200,
      homeMaintenance: 3000,
      gifts: 2400,
      charitableGiving: 1200,
      hobbies: 1800,
      emergencyFund: 2400,
      otherAnnual: 1000,
    },
  };
}
