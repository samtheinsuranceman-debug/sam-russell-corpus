/**
 * Advanced Analytics Shared Module
 * Tax Bracket Waterfall, Estate Tax Impact, Income Timeline,
 * Competitive Analysis, Inflation Adjustments, IUL vs Roth comparison
 */

// ─── Tax Bracket Waterfall ───────────────────────────────────────────────────

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  label: string;
}

export const FEDERAL_BRACKETS_2024_MFJ: TaxBracket[] = [
  { min: 0, max: 23200, rate: 0.10, label: "10%" },
  { min: 23200, max: 94300, rate: 0.12, label: "12%" },
  { min: 94300, max: 201050, rate: 0.22, label: "22%" },
  { min: 201050, max: 383900, rate: 0.24, label: "24%" },
  { min: 383900, max: 487450, rate: 0.32, label: "32%" },
  { min: 487450, max: 731200, rate: 0.35, label: "35%" },
  { min: 731200, max: Infinity, rate: 0.37, label: "37%" },
];

export const FEDERAL_BRACKETS_2024_SINGLE: TaxBracket[] = [
  { min: 0, max: 11600, rate: 0.10, label: "10%" },
  { min: 11600, max: 47150, rate: 0.12, label: "12%" },
  { min: 47150, max: 100525, rate: 0.22, label: "22%" },
  { min: 100525, max: 191950, rate: 0.24, label: "24%" },
  { min: 191950, max: 243725, rate: 0.32, label: "32%" },
  { min: 243725, max: 609350, rate: 0.35, label: "35%" },
  { min: 609350, max: Infinity, rate: 0.37, label: "37%" },
];

export interface BracketWaterfallRow {
  bracket: string;
  rate: number;
  bracketMin: number;
  bracketMax: number;
  incomeInBracket: number;
  conversionInBracket: number;
  taxOnConversion: number;
  cumulativeConversion: number;
  cumulativeTax: number;
  fillPercentage: number;
}

export function calculateBracketWaterfall(
  taxableIncome: number,
  conversionAmount: number,
  filingStatus: 'single' | 'married' | 'hoh'
): { rows: BracketWaterfallRow[]; optimalConversion: number; marginalRate: number; effectiveRate: number; totalTax: number } {
  const brackets = filingStatus === 'single' ? FEDERAL_BRACKETS_2024_SINGLE : FEDERAL_BRACKETS_2024_MFJ;
  const rows: BracketWaterfallRow[] = [];
  let remainingConversion = conversionAmount;
  let cumulativeConversion = 0;
  let cumulativeTax = 0;
  let marginalRate = 0;
  let optimalConversion = 0;

  for (const bracket of brackets) {
    const bracketWidth = bracket.max === Infinity ? 1000000 : bracket.max - bracket.min;
    const incomeInBracket = Math.max(0, Math.min(taxableIncome - bracket.min, bracketWidth));
    const spaceInBracket = Math.max(0, bracketWidth - incomeInBracket);
    const conversionInBracket = Math.min(remainingConversion, spaceInBracket);
    const taxOnConversion = conversionInBracket * bracket.rate;

    cumulativeConversion += conversionInBracket;
    cumulativeTax += taxOnConversion;
    remainingConversion -= conversionInBracket;

    if (conversionInBracket > 0) {
      marginalRate = bracket.rate;
    }

    // Optimal conversion: stay within 24% bracket
    if (bracket.rate <= 0.24) {
      optimalConversion = cumulativeConversion;
    }

    const totalInBracket = incomeInBracket + conversionInBracket;
    const fillPercentage = bracketWidth > 0 ? (totalInBracket / bracketWidth) * 100 : 0;

    rows.push({
      bracket: bracket.label,
      rate: bracket.rate,
      bracketMin: bracket.min,
      bracketMax: bracket.max === Infinity ? bracket.min + 1000000 : bracket.max,
      incomeInBracket: Math.round(incomeInBracket),
      conversionInBracket: Math.round(conversionInBracket),
      taxOnConversion: Math.round(taxOnConversion),
      cumulativeConversion: Math.round(cumulativeConversion),
      cumulativeTax: Math.round(cumulativeTax),
      fillPercentage: Math.round(fillPercentage * 10) / 10,
    });
  }

  const effectiveRate = cumulativeConversion > 0 ? cumulativeTax / cumulativeConversion : 0;

  return {
    rows,
    optimalConversion: Math.round(optimalConversion),
    marginalRate,
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    totalTax: Math.round(cumulativeTax),
  };
}

// ─── Estate Tax Impact ───────────────────────────────────────────────────────

export interface EstateTaxResult {
  grossEstate: number;
  exemption: number;
  taxableEstate: number;
  estateTax: number;
  effectiveRate: number;
  withIULStrategy: {
    grossEstate: number;
    iulDeathBenefit: number;
    ilitExclusion: number;
    taxableEstate: number;
    estateTax: number;
    effectiveRate: number;
    taxSavings: number;
  };
  sunsetImpact: {
    currentExemption: number;
    postSunsetExemption: number;
    additionalTaxExposure: number;
  };
}

export function calculateEstateTax(
  grossEstate: number,
  iulDeathBenefit: number,
  useILIT: boolean,
  year: number = 2024,
): EstateTaxResult {
  // Federal estate tax exemption
  const currentExemption = 13610000; // 2024
  const postSunsetExemption = 7000000; // approximate 2026 reversion
  const exemption = year >= 2026 ? postSunsetExemption : currentExemption;

  // Without IUL strategy
  const taxableEstate = Math.max(0, grossEstate - exemption);
  const estateTax = taxableEstate * 0.40; // 40% flat rate (simplified)
  const effectiveRate = grossEstate > 0 ? estateTax / grossEstate : 0;

  // With IUL strategy
  const ilitExclusion = useILIT ? iulDeathBenefit : 0;
  const withIULGross = grossEstate + iulDeathBenefit;
  const withIULTaxable = Math.max(0, withIULGross - exemption - ilitExclusion);
  const withIULTax = withIULTaxable * 0.40;
  const withIULEffective = withIULGross > 0 ? withIULTax / withIULGross : 0;
  const taxSavings = estateTax - withIULTax + (ilitExclusion > 0 ? iulDeathBenefit * 0.40 : 0);

  return {
    grossEstate,
    exemption,
    taxableEstate,
    estateTax: Math.round(estateTax),
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    withIULStrategy: {
      grossEstate: withIULGross,
      iulDeathBenefit,
      ilitExclusion,
      taxableEstate: withIULTaxable,
      estateTax: Math.round(withIULTax),
      effectiveRate: Math.round(withIULEffective * 10000) / 10000,
      taxSavings: Math.round(taxSavings),
    },
    sunsetImpact: {
      currentExemption,
      postSunsetExemption,
      additionalTaxExposure: Math.round((currentExemption - postSunsetExemption) * 0.40),
    },
  };
}

// ─── Income Timeline ─────────────────────────────────────────────────────────

export interface IncomeSource {
  name: string;
  startAge: number;
  endAge: number;
  annualAmount: number;
  growthRate: number;
  taxable: boolean;
  color: string;
}

export interface IncomeTimelineYear {
  year: number;
  age: number;
  sources: Record<string, number>;
  totalIncome: number;
  taxableIncome: number;
  estimatedTax: number;
  afterTaxIncome: number;
  targetIncome: number;
  gap: number;
}

export function buildIncomeTimeline(
  currentAge: number,
  retirementAge: number,
  endAge: number,
  targetAnnualIncome: number,
  inflationRate: number,
  sources: IncomeSource[],
): {
  years: IncomeTimelineYear[];
  totalGapYears: number;
  totalSurplusYears: number;
  lifetimeIncome: number;
  totalRetirementIncome: number;
  avgAnnualIncome: number;
  taxFreePercentage: number;
  shortfallYears: number;
  totalTaxableIncome: number;
  totalTaxFreeIncome: number;
  totalEstimatedTax: number;
  peakIncome: number;
  peakIncomeAge: number;
  sourceBreakdown: { name: string; totalLifetime: number; taxable: boolean; color: string; avgAnnual: number }[];
} {
  const years: IncomeTimelineYear[] = [];
  let totalGapYears = 0;
  let totalSurplusYears = 0;
  let lifetimeIncome = 0;
  let totalTaxableIncome = 0;
  let totalTaxFreeIncome = 0;
  let totalEstimatedTax = 0;
  let peakIncome = 0;
  let peakIncomeAge = retirementAge;
  const sourceLifetimeTotals: Record<string, number> = {};

  for (let age = retirementAge; age <= endAge; age++) {
    const year = age - retirementAge + 1;
    const inflationFactor = Math.pow(1 + inflationRate, year - 1);
    const adjustedTarget = targetAnnualIncome * inflationFactor;

    const sourcesForYear: Record<string, number> = {};
    let totalIncome = 0;
    let taxableIncome = 0;

    for (const source of sources) {
      if (age >= source.startAge && age <= source.endAge) {
        const yearsActive = age - source.startAge;
        const amount = Math.round(source.annualAmount * Math.pow(1 + source.growthRate, yearsActive));
        sourcesForYear[source.name] = amount;
        totalIncome += amount;
        if (source.taxable) taxableIncome += amount;
      }
    }

    // Simplified tax estimate
    const estimatedTax = Math.round(taxableIncome * 0.22); // effective rate approximation
    const afterTaxIncome = totalIncome - estimatedTax;
    const gap = afterTaxIncome - adjustedTarget;

    if (gap < 0) totalGapYears++;
    else totalSurplusYears++;
    lifetimeIncome += totalIncome;
    totalTaxableIncome += taxableIncome;
    totalTaxFreeIncome += (totalIncome - taxableIncome);
    totalEstimatedTax += estimatedTax;
    if (totalIncome > peakIncome) { peakIncome = totalIncome; peakIncomeAge = age; }
    for (const [sName, sAmt] of Object.entries(sourcesForYear)) {
      sourceLifetimeTotals[sName] = (sourceLifetimeTotals[sName] || 0) + sAmt;
    }

    years.push({
      year,
      age,
      sources: sourcesForYear,
      totalIncome: Math.round(totalIncome),
      taxableIncome: Math.round(taxableIncome),
      estimatedTax,
      afterTaxIncome: Math.round(afterTaxIncome),
      targetIncome: Math.round(adjustedTarget),
      gap: Math.round(gap),
    });
  }

  const retirementYears = endAge - retirementAge + 1;
  const totalRetirementIncome = Math.round(lifetimeIncome);
  const avgAnnualIncome = retirementYears > 0 ? Math.round(lifetimeIncome / retirementYears) : 0;
  const taxFreePercentage = lifetimeIncome > 0 ? totalTaxFreeIncome / lifetimeIncome : 0;
  const sourceBreakdown = sources.map(s => ({
    name: s.name,
    totalLifetime: Math.round(sourceLifetimeTotals[s.name] || 0),
    taxable: s.taxable,
    color: s.color,
    avgAnnual: retirementYears > 0 ? Math.round((sourceLifetimeTotals[s.name] || 0) / retirementYears) : 0,
  }));

  return {
    years,
    totalGapYears,
    totalSurplusYears,
    lifetimeIncome: totalRetirementIncome,
    totalRetirementIncome,
    avgAnnualIncome,
    taxFreePercentage,
    shortfallYears: totalGapYears,
    totalTaxableIncome: Math.round(totalTaxableIncome),
    totalTaxFreeIncome: Math.round(totalTaxFreeIncome),
    totalEstimatedTax: Math.round(totalEstimatedTax),
    peakIncome: Math.round(peakIncome),
    peakIncomeAge,
    sourceBreakdown,
  };
}

// ─── Competitive Analysis ────────────────────────────────────────────────────

export interface CompetitiveResult {
  strategy: string;
  year20Value: number;
  year30Value: number;
  totalContributions: number;
  taxDragYear20: number;
  taxDragYear30: number;
  afterTaxYear20: number;
  afterTaxYear30: number;
  deathBenefit: number;
  accessRules: string;
  pros: string[];
  cons: string[];
}

export function runCompetitiveAnalysis(
  annualContribution: number,
  years: number,
  taxBracket: number,
  iulRate: number,
  marketRate: number,
): CompetitiveResult[] {
  const results: CompetitiveResult[] = [];

  // 1. IUL Strategy
  let iulCV = 0;
  for (let y = 1; y <= years; y++) {
    const prem = y <= 5 ? annualContribution : 0;
    const load = y === 1 ? prem * 0.08 : (y <= 5 ? prem * 0.06 : 0);
    const net = prem - load;
    iulCV = (iulCV + net) * (1 + iulRate) * 0.985; // approximate charges
  }
  results.push({
    strategy: "IUL (Indexed Universal Life)",
    year20Value: Math.round(iulCV * (20 / years)),
    year30Value: Math.round(iulCV),
    totalContributions: annualContribution * Math.min(5, years),
    taxDragYear20: 0,
    taxDragYear30: 0,
    afterTaxYear20: Math.round(iulCV * (20 / years)),
    afterTaxYear30: Math.round(iulCV),
    deathBenefit: Math.round(annualContribution * 10),
    accessRules: "Tax-free policy loans after year 1. No contribution limits. No RMDs.",
    pros: ["Tax-free growth", "Tax-free income via loans", "Death benefit", "No contribution limits", "No RMDs", "Creditor protection"],
    cons: ["Higher fees than index funds", "Complexity", "Surrender charges early years", "Requires health underwriting"],
  });

  // 2. Buy Term Invest the Difference (BTID)
  const termCost = annualContribution * 0.02; // approximate term cost
  const investAmount = annualContribution - termCost;
  let btidValue = 0;
  for (let y = 1; y <= years; y++) {
    btidValue = (btidValue + (y <= 5 ? investAmount : 0)) * (1 + marketRate);
  }
  const btidTax20 = btidValue * (20 / years) * 0.15; // LTCG
  const btidTax30 = btidValue * 0.15;
  results.push({
    strategy: "Buy Term + Invest the Difference",
    year20Value: Math.round(btidValue * (20 / years)),
    year30Value: Math.round(btidValue),
    totalContributions: investAmount * Math.min(5, years),
    taxDragYear20: Math.round(btidTax20),
    taxDragYear30: Math.round(btidTax30),
    afterTaxYear20: Math.round(btidValue * (20 / years) - btidTax20),
    afterTaxYear30: Math.round(btidValue - btidTax30),
    deathBenefit: Math.round(annualContribution * 10),
    accessRules: "Taxable gains on withdrawal. Term expires at end of level period. No loan access.",
    pros: ["Lower fees", "Simple", "Flexible investments", "No health underwriting for investments"],
    cons: ["Taxable gains", "Term expires", "No permanent death benefit", "Market risk", "Sequence of returns risk"],
  });

  // 3. Max 401(k)
  const max401k = 23500; // 2024 limit
  let val401k = 0;
  for (let y = 1; y <= years; y++) {
    val401k = (val401k + max401k) * (1 + marketRate);
  }
  const tax401k20 = val401k * (20 / years) * taxBracket;
  const tax401k30 = val401k * taxBracket;
  results.push({
    strategy: "Max 401(k) Contributions",
    year20Value: Math.round(val401k * (20 / years)),
    year30Value: Math.round(val401k),
    totalContributions: max401k * years,
    taxDragYear20: Math.round(tax401k20),
    taxDragYear30: Math.round(tax401k30),
    afterTaxYear20: Math.round(val401k * (20 / years) - tax401k20),
    afterTaxYear30: Math.round(val401k - tax401k30),
    deathBenefit: 0,
    accessRules: "Taxed as ordinary income on withdrawal. 10% penalty before 59½. RMDs at 73.",
    pros: ["Tax-deferred growth", "Employer match potential", "High contribution limits", "Simple"],
    cons: ["Fully taxable withdrawals", "RMDs required", "10% early withdrawal penalty", "No death benefit", "Limited investment options"],
  });

  // 4. Taxable Brokerage
  let brokerageVal = 0;
  for (let y = 1; y <= years; y++) {
    const afterTaxReturn = marketRate * (1 - 0.15); // annual tax drag on dividends
    brokerageVal = (brokerageVal + (y <= 5 ? annualContribution : 0)) * (1 + afterTaxReturn);
  }
  const brokTax20 = brokerageVal * (20 / years) * 0.15;
  const brokTax30 = brokerageVal * 0.15;
  results.push({
    strategy: "Taxable Brokerage Account",
    year20Value: Math.round(brokerageVal * (20 / years)),
    year30Value: Math.round(brokerageVal),
    totalContributions: annualContribution * Math.min(5, years),
    taxDragYear20: Math.round(brokTax20),
    taxDragYear30: Math.round(brokTax30),
    afterTaxYear20: Math.round(brokerageVal * (20 / years) - brokTax20),
    afterTaxYear30: Math.round(brokerageVal - brokTax30),
    deathBenefit: 0,
    accessRules: "No contribution limits. LTCG rates on gains. Step-up in basis at death. Full liquidity.",
    pros: ["Full liquidity", "No contribution limits", "Step-up in basis at death", "LTCG rates"],
    cons: ["Annual tax drag on dividends", "Capital gains tax", "No death benefit", "No creditor protection"],
  });

  return results;
}

// ─── Inflation Adjustment ────────────────────────────────────────────────────

export function adjustForInflation(nominalValue: number, years: number, inflationRate: number): number {
  return Math.round(nominalValue / Math.pow(1 + inflationRate, years));
}

export function inflationImpactSummary(
  currentValue: number,
  years: number,
  inflationRates: number[],
): Array<{ rate: number; futureNominal: number; realPurchasingPower: number; erosion: number }> {
  return inflationRates.map(rate => {
    const realPP = adjustForInflation(currentValue, years, rate);
    return {
      rate,
      futureNominal: currentValue,
      realPurchasingPower: realPP,
      erosion: Math.round(((currentValue - realPP) / currentValue) * 10000) / 100,
    };
  });
}

// ─── IUL vs Roth IRA Comparison ──────────────────────────────────────────────

export interface IULvsRothYear {
  year: number;
  age: number;
  iulCashValue: number;
  rothBalance: number;
  iulDeathBenefit: number;
  rothDeathBenefit: number;
  iulTaxFreeIncome: number;
  rothTaxFreeIncome: number;
}

export function compareIULvsRoth(
  age: number,
  annualContribution: number,
  years: number,
  iulRate: number,
  rothRate: number,
): { years: IULvsRothYear[]; iulAdvantage: number; rothAdvantage: number; winner: string; reasoning: string } {
  const rows: IULvsRothYear[] = [];
  let iulCV = 0;
  let rothBal = 0;
  const rothLimit = 7000; // 2024 Roth IRA limit (under 50)
  const iulPremium = annualContribution;
  const iulDB = iulPremium * 10;

  for (let y = 1; y <= years; y++) {
    const currentAge = age + y;
    // IUL
    const prem = y <= 5 ? iulPremium : 0;
    const load = y === 1 ? prem * 0.08 : (y <= 5 ? prem * 0.06 : 0);
    iulCV = (iulCV + prem - load) * (1 + iulRate) * 0.985;

    // Roth IRA
    const rothContrib = Math.min(annualContribution, rothLimit + (currentAge >= 50 ? 1000 : 0));
    rothBal = (rothBal + rothContrib) * (1 + rothRate);

    rows.push({
      year: y,
      age: currentAge,
      iulCashValue: Math.round(iulCV),
      rothBalance: Math.round(rothBal),
      iulDeathBenefit: Math.round(Math.max(iulDB, iulCV)),
      rothDeathBenefit: Math.round(rothBal),
      iulTaxFreeIncome: y > 10 ? Math.round(iulCV * 0.04) : 0,
      rothTaxFreeIncome: currentAge >= 59.5 && y >= 5 ? Math.round(rothBal * 0.04) : 0,
    });
  }

  const finalIUL = rows[rows.length - 1]?.iulCashValue ?? 0;
  const finalRoth = rows[rows.length - 1]?.rothBalance ?? 0;
  const iulAdvantage = finalIUL - finalRoth;
  const rothAdvantage = finalRoth - finalIUL;

  let winner: string;
  let reasoning: string;
  if (annualContribution > rothLimit) {
    winner = "IUL";
    reasoning = `With $${annualContribution.toLocaleString()}/yr contributions, IUL accepts the full amount while Roth IRA is capped at $${rothLimit.toLocaleString()}/yr. IUL also provides a ${(iulDB).toLocaleString()} death benefit.`;
  } else if (finalIUL > finalRoth) {
    winner = "IUL";
    reasoning = `At ${(iulRate * 100).toFixed(0)}% illustrated rate, IUL outperforms Roth by $${iulAdvantage.toLocaleString()} over ${years} years, plus provides a death benefit.`;
  } else {
    winner = "Roth IRA";
    reasoning = `Roth IRA outperforms by $${rothAdvantage.toLocaleString()} due to lower fees and ${(rothRate * 100).toFixed(0)}% market returns. However, IUL provides a death benefit that Roth does not.`;
  }

  return { years: rows, iulAdvantage, rothAdvantage, winner, reasoning };
}

// ─── Client Onboarding Scoring ───────────────────────────────────────────────

export interface OnboardingProfile {
  age: number;
  income: number;
  iraBalance: number;
  homeEquity: number;
  filingStatus: 'single' | 'married' | 'hoh';
  retirementAge: number;
  annualIncomeNeeded: number;
  legacyGoal: number;
  riskTolerance: number; // 1-10
}

export interface StrategyRecommendation {
  strategy: string;
  score: number;
  description: string;
  keyBenefits: string[];
  suggestedPremium: number;
  suggestedConversion: number;
}

export function generateRecommendation(profile: OnboardingProfile): StrategyRecommendation {
  const yearsToRetirement = profile.retirementAge - profile.age;
  const conversionCapacity = profile.iraBalance > 200000 ? Math.min(profile.iraBalance * 0.15, 200000) : profile.iraBalance * 0.10;
  const suggestedPremium = Math.round(conversionCapacity * 0.6 / 1000) * 1000;

  let strategy: string;
  let description: string;
  let keyBenefits: string[];
  let score: number;

  if (profile.iraBalance > 500000 && profile.homeEquity > 300000 && yearsToRetirement >= 10) {
    strategy = "Full Roth + IUL + STR Strategy";
    description = "Maximum tax-free wealth building combining Roth conversions, IUL cash value accumulation, and short-term rental depreciation offsets.";
    keyBenefits = ["Zero-tax Roth conversions via STR depreciation", "Tax-free IUL policy loans at retirement", "Real estate equity appreciation", "Death benefit for legacy planning"];
    score = 95;
  } else if (profile.iraBalance > 300000 && yearsToRetirement >= 10) {
    strategy = "Roth Conversion + IUL Strategy";
    description = "Strategic Roth conversions funded by IUL policy, creating dual tax-free income streams at retirement.";
    keyBenefits = ["Tax-bracket-optimized conversions", "IUL cash value growth at AG 49 max illustrated rate (7.5%)", "Tax-free retirement income", "Death benefit protection"];
    score = 85;
  } else if (profile.iraBalance > 100000) {
    strategy = "Accelerated Roth Conversion";
    description = "Focus on converting IRA to Roth within the current low-tax window before potential rate increases.";
    keyBenefits = ["Lock in current tax rates", "Eliminate future RMDs", "Tax-free growth", "Estate planning flexibility"];
    score = 75;
  } else {
    strategy = "IUL Cash Value Accumulation";
    description = "Build tax-free wealth through IUL policy with competitive index crediting and policy loan access.";
    keyBenefits = ["Tax-free growth", "Downside protection (0% floor)", "Policy loan income", "Death benefit"];
    score = 65;
  }

  return {
    strategy,
    score,
    description,
    keyBenefits,
    suggestedPremium,
    suggestedConversion: Math.round(conversionCapacity),
  };
}
// ─── Comprehensive Tax Waterfall ────────────────────────────────────────────

const STATE_TAX_RATES: Record<string, { rate: number; name: string }> = {
  AL: { rate: 0.05, name: "Alabama" }, AK: { rate: 0, name: "Alaska" },
  AZ: { rate: 0.025, name: "Arizona" }, AR: { rate: 0.047, name: "Arkansas" },
  CA: { rate: 0.133, name: "California" }, CO: { rate: 0.044, name: "Colorado" },
  CT: { rate: 0.0699, name: "Connecticut" }, DE: { rate: 0.066, name: "Delaware" },
  FL: { rate: 0, name: "Florida" }, GA: { rate: 0.055, name: "Georgia" },
  HI: { rate: 0.11, name: "Hawaii" }, ID: { rate: 0.058, name: "Idaho" },
  IL: { rate: 0.0495, name: "Illinois" }, IN: { rate: 0.0305, name: "Indiana" },
  IA: { rate: 0.06, name: "Iowa" }, KS: { rate: 0.057, name: "Kansas" },
  KY: { rate: 0.04, name: "Kentucky" }, LA: { rate: 0.0425, name: "Louisiana" },
  ME: { rate: 0.0715, name: "Maine" }, MD: { rate: 0.0575, name: "Maryland" },
  MA: { rate: 0.09, name: "Massachusetts" }, MI: { rate: 0.0425, name: "Michigan" },
  MN: { rate: 0.0985, name: "Minnesota" }, MS: { rate: 0.05, name: "Mississippi" },
  MO: { rate: 0.048, name: "Missouri" }, MT: { rate: 0.0675, name: "Montana" },
  NE: { rate: 0.0664, name: "Nebraska" }, NV: { rate: 0, name: "Nevada" },
  NH: { rate: 0, name: "New Hampshire" }, NJ: { rate: 0.1075, name: "New Jersey" },
  NM: { rate: 0.059, name: "New Mexico" }, NY: { rate: 0.109, name: "New York" },
  NC: { rate: 0.0475, name: "North Carolina" }, ND: { rate: 0.025, name: "North Dakota" },
  OH: { rate: 0.04, name: "Ohio" }, OK: { rate: 0.0475, name: "Oklahoma" },
  OR: { rate: 0.099, name: "Oregon" }, PA: { rate: 0.0307, name: "Pennsylvania" },
  RI: { rate: 0.0599, name: "Rhode Island" }, SC: { rate: 0.065, name: "South Carolina" },
  SD: { rate: 0, name: "South Dakota" }, TN: { rate: 0, name: "Tennessee" },
  TX: { rate: 0, name: "Texas" }, UT: { rate: 0.0465, name: "Utah" },
  VT: { rate: 0.0875, name: "Vermont" }, VA: { rate: 0.0575, name: "Virginia" },
  WA: { rate: 0, name: "Washington" }, WV: { rate: 0.065, name: "West Virginia" },
  WI: { rate: 0.0765, name: "Wisconsin" }, WY: { rate: 0, name: "Wyoming" },
  DC: { rate: 0.0975, name: "Washington DC" },
};

export function getStateList() {
  return Object.entries(STATE_TAX_RATES)
    .map(([code, info]) => ({ code, ...info }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface ComprehensiveTaxInput {
  income: {
    w2: number; selfEmployment: number; capitalGains: number;
    rentalIncome: number; socialSecurity: number; pension: number;
    iraDistributions: number; otherIncome: number;
  };
  deductions: {
    standardOrItemized: 'standard' | 'itemized';
    mortgageInterest: number; saltDeduction: number; charitableGiving: number;
    medicalExpenses: number; businessExpenses: number;
    hsaContribution: number; retirementContribution: number;
  };
  rothConversion: number;
  iulTaxFreeIncome: number;
  filingStatus: 'single' | 'married' | 'hoh';
  state: string;
  age: number;
}

export interface WaterfallStep {
  label: string;
  value: number;
  cumulative: number;
  type: 'income' | 'deduction' | 'tax' | 'conversion' | 'net' | 'taxfree';
  color: string;
}

export interface ComprehensiveTaxResult {
  grossIncome: number;
  adjustedGrossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxableIncomeWithConversion: number;
  federalTax: number;
  federalTaxWithConversion: number;
  stateTax: number;
  ficaTax: number;
  niitTax: number;
  totalTax: number;
  totalTaxWithConversion: number;
  effectiveRate: number;
  marginalRate: number;
  takeHomePay: number;
  takeHomeWithIUL: number;
  bracketBreakdown: Array<{
    rate: number;
    label: string;
    bracketMin: number;
    bracketMax: number;
    incomeInBracket: number;
    conversionInBracket: number;
    taxInBracket: number;
    fillPct: number;
    spaceRemaining: number;
  }>;
  waterfallSteps: WaterfallStep[];
  conversionAnalysis: {
    conversionAmount: number;
    taxOnConversion: number;
    effectiveConversionRate: number;
    marginalConversionRate: number;
    optimalConversion24: number;
    optimalConversion22: number;
    taxAt24: number;
    taxAt22: number;
    savingsVsMarginal: number;
  };
  iulComparison: {
    iulTaxFreeAmount: number;
    taxableEquivalent: number;
    taxSaved: number;
    effectiveBenefit: number;
    annualAdvantage: number;
  };
  stateTaxInfo: { name: string; rate: number; amount: number };
  incomeBreakdown: Array<{ source: string; amount: number; taxable: boolean; note: string }>;
  deductionBreakdown: Array<{ item: string; amount: number; note: string }>;
  scenarioComparison: {
    currentScenario: { totalTax: number; effectiveRate: number; takeHome: number };
    withRothConversion: { totalTax: number; effectiveRate: number; takeHome: number; futureTaxSavings: number };
    withIULIncome: { totalTax: number; effectiveRate: number; takeHome: number; taxFreeBonus: number };
    optimizedStrategy: { totalTax: number; effectiveRate: number; takeHome: number; totalBenefit: number };
  };
}

export function calculateComprehensiveTaxWaterfall(input: ComprehensiveTaxInput): ComprehensiveTaxResult {
  const { income, deductions, rothConversion, iulTaxFreeIncome, filingStatus, state, age } = input;

  // ── Step 1: Calculate Gross Income ──
  const ssaTaxable = income.socialSecurity * 0.85; // up to 85% taxable
  const grossIncome = income.w2 + income.selfEmployment + income.capitalGains +
    income.rentalIncome + ssaTaxable + income.pension +
    income.iraDistributions + income.otherIncome;

  // ── Step 2: Above-the-line deductions (AGI adjustments) ──
  const selfEmploymentTaxDeduction = income.selfEmployment * 0.0765; // half of SE tax
  const agiAdjustments = deductions.hsaContribution + deductions.retirementContribution +
    selfEmploymentTaxDeduction + deductions.businessExpenses;
  const adjustedGrossIncome = Math.max(0, grossIncome - agiAdjustments);

  // ── Step 3: Standard or Itemized deductions ──
  const standardDeduction = filingStatus === 'married' ? 29200 :
    filingStatus === 'hoh' ? 21900 : 14600;
  // Extra deduction for age 65+
  const extraStandard = age >= 65 ? (filingStatus === 'married' ? 3100 : 3850) : 0;
  const totalStandardDeduction = standardDeduction + extraStandard;

  const saltCapped = Math.min(deductions.saltDeduction, 10000); // SALT cap
  const agiThreshold = adjustedGrossIncome * 0.075;
  const medicalAllowed = Math.max(0, deductions.medicalExpenses - agiThreshold);
  const totalItemized = deductions.mortgageInterest + saltCapped +
    deductions.charitableGiving + medicalAllowed;

  let totalDeductions: number;
  let usingItemized: boolean;
  if (deductions.standardOrItemized === 'itemized' && totalItemized > totalStandardDeduction) {
    totalDeductions = totalItemized;
    usingItemized = true;
  } else {
    totalDeductions = totalStandardDeduction;
    usingItemized = false;
  }

  // ── Step 4: Taxable Income ──
  const taxableIncome = Math.max(0, adjustedGrossIncome - totalDeductions);
  const taxableIncomeWithConversion = taxableIncome + rothConversion;

  // ── Step 5: Federal Tax Calculation ──
  const brackets = filingStatus === 'single' ? FEDERAL_BRACKETS_2024_SINGLE : FEDERAL_BRACKETS_2024_MFJ;

  function calcFederalTax(income: number) {
    let tax = 0;
    let marginal = 0.10;
    const breakdown: ComprehensiveTaxResult['bracketBreakdown'] = [];

    for (const bracket of brackets) {
      const bracketWidth = bracket.max === Infinity ? 1_000_000 : bracket.max - bracket.min;
      const incomeInBracket = Math.max(0, Math.min(income - bracket.min, bracketWidth));
      const taxInBracket = incomeInBracket * bracket.rate;
      tax += taxInBracket;
      if (incomeInBracket > 0) marginal = bracket.rate;

      breakdown.push({
        rate: bracket.rate,
        label: bracket.label,
        bracketMin: bracket.min,
        bracketMax: bracket.max === Infinity ? bracket.min + 1_000_000 : bracket.max,
        incomeInBracket: Math.round(incomeInBracket),
        conversionInBracket: 0,
        taxInBracket: Math.round(taxInBracket),
        fillPct: bracketWidth > 0 ? Math.round((incomeInBracket / bracketWidth) * 1000) / 10 : 0,
        spaceRemaining: Math.round(Math.max(0, bracketWidth - incomeInBracket)),
      });
    }
    return { tax: Math.round(tax), marginal, breakdown };
  }

  const baseTax = calcFederalTax(taxableIncome);
  const withConversionTax = calcFederalTax(taxableIncomeWithConversion);

  // Add conversion amounts to bracket breakdown
  const bracketBreakdown = withConversionTax.breakdown.map((b, i) => {
    const baseIncome = baseTax.breakdown[i]?.incomeInBracket ?? 0;
    const conversionInBracket = Math.max(0, b.incomeInBracket - baseIncome);
    return {
      ...b,
      incomeInBracket: baseIncome,
      conversionInBracket,
    };
  });

  // ── Step 6: FICA Tax ──
  const ficaWages = Math.min(income.w2, 168600); // 2024 SS wage base
  const ssTax = ficaWages * 0.062;
  const medicareTax = income.w2 * 0.0145;
  const additionalMedicare = Math.max(0, income.w2 - (filingStatus === 'married' ? 250000 : 200000)) * 0.009;
  const seTax = income.selfEmployment > 0 ? income.selfEmployment * 0.9235 * 0.153 : 0;
  const ficaTax = Math.round(ssTax + medicareTax + additionalMedicare + seTax);

  // ── Step 7: NIIT (Net Investment Income Tax) ──
  const niitThreshold = filingStatus === 'married' ? 250000 : 200000;
  const investmentIncome = income.capitalGains + income.rentalIncome;
  const niitTax = Math.round(Math.max(0, Math.min(investmentIncome, adjustedGrossIncome - niitThreshold)) * 0.038);

  // ── Step 8: State Tax ──
  const stateInfo = STATE_TAX_RATES[state] || { rate: 0, name: "No State Selected" };
  const stateTax = Math.round(taxableIncome * stateInfo.rate);

  // ── Step 9: Totals ──
  const federalTax = baseTax.tax;
  const federalTaxWithConversion = withConversionTax.tax;
  const totalTax = federalTax + stateTax + ficaTax + niitTax;
  const totalTaxWithConversion = federalTaxWithConversion + Math.round(rothConversion * stateInfo.rate) + ficaTax + niitTax;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;
  const takeHomePay = grossIncome - totalTax;
  const takeHomeWithIUL = takeHomePay + iulTaxFreeIncome; // IUL income is tax-free

  // ── Conversion Analysis ──
  const taxOnConversion = federalTaxWithConversion - federalTax + Math.round(rothConversion * stateInfo.rate);
  const effectiveConversionRate = rothConversion > 0 ? taxOnConversion / rothConversion : 0;

  // Optimal conversion to stay within 24% bracket
  const bracket24 = brackets.find(b => b.rate === 0.24);
  const bracket22 = brackets.find(b => b.rate === 0.22);
  const optimalConversion24 = bracket24 ? Math.max(0, bracket24.max - taxableIncome) : 0;
  const optimalConversion22 = bracket22 ? Math.max(0, bracket22.max - taxableIncome) : 0;
  const taxAt24 = calcFederalTax(taxableIncome + optimalConversion24).tax - federalTax;
  const taxAt22 = calcFederalTax(taxableIncome + optimalConversion22).tax - federalTax;

  // ── IUL Comparison ──
  const marginalRate = baseTax.marginal;
  const taxableEquivalent = iulTaxFreeIncome > 0 ? iulTaxFreeIncome / (1 - marginalRate - stateInfo.rate) : 0;
  const taxSaved = Math.round(iulTaxFreeIncome * (marginalRate + stateInfo.rate));

  // ── Waterfall Steps ──
  const waterfallSteps: WaterfallStep[] = [];
  let cumulative = 0;

  // Income sources
  const incomeSources = [
    { label: "W-2 Wages", amount: income.w2 },
    { label: "Self-Employment", amount: income.selfEmployment },
    { label: "Capital Gains", amount: income.capitalGains },
    { label: "Rental Income", amount: income.rentalIncome },
    { label: "Social Security", amount: ssaTaxable },
    { label: "Pension", amount: income.pension },
    { label: "IRA Distributions", amount: income.iraDistributions },
    { label: "Other Income", amount: income.otherIncome },
  ].filter(s => s.amount > 0);

  for (const src of incomeSources) {
    cumulative += src.amount;
    waterfallSteps.push({ label: src.label, value: src.amount, cumulative, type: 'income', color: '#22c55e' });
  }

  // Deductions (negative)
  waterfallSteps.push({ label: usingItemized ? "Itemized Deductions" : "Standard Deduction", value: -totalDeductions, cumulative: cumulative - totalDeductions, type: 'deduction', color: '#3b82f6' });
  cumulative -= totalDeductions;

  if (agiAdjustments > 0) {
    waterfallSteps.push({ label: "AGI Adjustments", value: -agiAdjustments, cumulative: cumulative - agiAdjustments, type: 'deduction', color: '#6366f1' });
    cumulative -= agiAdjustments;
  }

  // Taxes (negative)
  waterfallSteps.push({ label: "Federal Tax", value: -federalTax, cumulative: cumulative - federalTax, type: 'tax', color: '#ef4444' });
  cumulative -= federalTax;

  if (stateTax > 0) {
    waterfallSteps.push({ label: `State Tax (${stateInfo.name})`, value: -stateTax, cumulative: cumulative - stateTax, type: 'tax', color: '#f97316' });
    cumulative -= stateTax;
  }

  if (ficaTax > 0) {
    waterfallSteps.push({ label: "FICA / SE Tax", value: -ficaTax, cumulative: cumulative - ficaTax, type: 'tax', color: '#f59e0b' });
    cumulative -= ficaTax;
  }

  if (niitTax > 0) {
    waterfallSteps.push({ label: "NIIT (3.8%)", value: -niitTax, cumulative: cumulative - niitTax, type: 'tax', color: '#ec4899' });
    cumulative -= niitTax;
  }

  // Net take-home
  waterfallSteps.push({ label: "Take-Home Pay", value: cumulative, cumulative, type: 'net', color: '#10b981' });

  // IUL tax-free income bonus
  if (iulTaxFreeIncome > 0) {
    waterfallSteps.push({ label: "IUL Tax-Free Income", value: iulTaxFreeIncome, cumulative: cumulative + iulTaxFreeIncome, type: 'taxfree', color: '#8b5cf6' });
  }

  // ── Income Breakdown ──
  const incomeBreakdown = [
    { source: "W-2 Wages", amount: income.w2, taxable: true, note: "Subject to federal, state, and FICA" },
    { source: "Self-Employment", amount: income.selfEmployment, taxable: true, note: "Subject to SE tax (15.3%)" },
    { source: "Capital Gains", amount: income.capitalGains, taxable: true, note: "Long-term taxed at preferential rates" },
    { source: "Rental Income", amount: income.rentalIncome, taxable: true, note: "Net of depreciation deductions" },
    { source: "Social Security", amount: income.socialSecurity, taxable: true, note: `Up to 85% taxable ($${Math.round(ssaTaxable).toLocaleString()})` },
    { source: "Pension", amount: income.pension, taxable: true, note: "Fully taxable as ordinary income" },
    { source: "IRA Distributions", amount: income.iraDistributions, taxable: true, note: "Taxed as ordinary income + 10% penalty if under 59.5" },
    { source: "Other Income", amount: income.otherIncome, taxable: true, note: "Interest, dividends, etc." },
    { source: "IUL Policy Loans", amount: iulTaxFreeIncome, taxable: false, note: "Tax-free — not reported as income" },
  ].filter(s => s.amount > 0);

  // ── Deduction Breakdown ──
  const deductionBreakdown = usingItemized ? [
    { item: "Mortgage Interest", amount: deductions.mortgageInterest, note: "Up to $750K loan limit" },
    { item: "SALT (Capped)", amount: saltCapped, note: deductions.saltDeduction > 10000 ? `Capped at $10K (lost $${(deductions.saltDeduction - 10000).toLocaleString()})` : "State and local taxes" },
    { item: "Charitable Giving", amount: deductions.charitableGiving, note: "Up to 60% of AGI" },
    { item: "Medical Expenses", amount: medicalAllowed, note: `Exceeding 7.5% AGI threshold ($${Math.round(agiThreshold).toLocaleString()})` },
  ].filter(d => d.amount > 0) : [
    { item: "Standard Deduction", amount: totalStandardDeduction, note: age >= 65 ? `Includes $${extraStandard.toLocaleString()} extra for age 65+` : `${filingStatus === 'married' ? 'MFJ' : filingStatus === 'hoh' ? 'HOH' : 'Single'} standard deduction` },
  ];

  if (deductions.hsaContribution > 0) deductionBreakdown.push({ item: "HSA Contribution", amount: deductions.hsaContribution, note: "Above-the-line deduction" });
  if (deductions.retirementContribution > 0) deductionBreakdown.push({ item: "Retirement Contribution", amount: deductions.retirementContribution, note: "401(k)/IRA deduction" });
  if (deductions.businessExpenses > 0) deductionBreakdown.push({ item: "Business Expenses", amount: deductions.businessExpenses, note: "Qualified business deductions" });

  // ── Scenario Comparison ──
  const currentScenario = { totalTax, effectiveRate: Math.round(effectiveRate * 10000) / 10000, takeHome: takeHomePay };

  const withRothConversion = {
    totalTax: totalTaxWithConversion,
    effectiveRate: (grossIncome + rothConversion) > 0 ? Math.round((totalTaxWithConversion / (grossIncome + rothConversion)) * 10000) / 10000 : 0,
    takeHome: grossIncome + rothConversion - totalTaxWithConversion,
    futureTaxSavings: Math.round(rothConversion * 0.30), // estimated future tax savings at 30%
  };

  const withIULIncome = {
    totalTax, // same tax since IUL is tax-free
    effectiveRate: (grossIncome + iulTaxFreeIncome) > 0 ? Math.round((totalTax / (grossIncome + iulTaxFreeIncome)) * 10000) / 10000 : 0,
    takeHome: takeHomeWithIUL,
    taxFreeBonus: iulTaxFreeIncome,
  };

  const optimizedStrategy = {
    totalTax: totalTaxWithConversion,
    effectiveRate: (grossIncome + rothConversion + iulTaxFreeIncome) > 0 ? Math.round((totalTaxWithConversion / (grossIncome + rothConversion + iulTaxFreeIncome)) * 10000) / 10000 : 0,
    takeHome: grossIncome + rothConversion - totalTaxWithConversion + iulTaxFreeIncome,
    totalBenefit: taxSaved + Math.round(rothConversion * 0.30),
  };

  return {
    grossIncome,
    adjustedGrossIncome: Math.round(adjustedGrossIncome),
    totalDeductions: Math.round(totalDeductions),
    taxableIncome: Math.round(taxableIncome),
    taxableIncomeWithConversion: Math.round(taxableIncomeWithConversion),
    federalTax,
    federalTaxWithConversion,
    stateTax,
    ficaTax,
    niitTax,
    totalTax,
    totalTaxWithConversion,
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    marginalRate,
    takeHomePay: Math.round(takeHomePay),
    takeHomeWithIUL: Math.round(takeHomeWithIUL),
    bracketBreakdown,
    waterfallSteps,
    conversionAnalysis: {
      conversionAmount: rothConversion,
      taxOnConversion,
      effectiveConversionRate: Math.round(effectiveConversionRate * 10000) / 10000,
      marginalConversionRate: withConversionTax.marginal,
      optimalConversion24: Math.round(optimalConversion24),
      optimalConversion22: Math.round(optimalConversion22),
      taxAt24: Math.round(taxAt24),
      taxAt22: Math.round(taxAt22),
      savingsVsMarginal: rothConversion > 0 ? Math.round((withConversionTax.marginal - effectiveConversionRate) * rothConversion) : 0,
    },
    iulComparison: {
      iulTaxFreeAmount: iulTaxFreeIncome,
      taxableEquivalent: Math.round(taxableEquivalent),
      taxSaved,
      effectiveBenefit: marginalRate + stateInfo.rate,
      annualAdvantage: taxSaved,
    },
    stateTaxInfo: { name: stateInfo.name, rate: stateInfo.rate, amount: stateTax },
    incomeBreakdown,
    deductionBreakdown,
    scenarioComparison: { currentScenario, withRothConversion, withIULIncome, optimizedStrategy },
  };
}
