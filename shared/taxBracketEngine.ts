/**
 * Russell Capital Systems™ — Tax Bracket Engine
 * 2026 Federal & State tax bracket modeling with marginal/effective rate calculations.
 * Used across all financial calculators for Tax Alpha Visibility.
 */

// ── 2026 Federal Tax Brackets (projected from TCJA sunset provisions) ──
export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export type FilingStatus = "single" | "joint" | "hoh";

const FEDERAL_BRACKETS_2026: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  joint: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
  hoh: [
    { min: 0, max: 17000, rate: 0.10 },
    { min: 17000, max: 64850, rate: 0.12 },
    { min: 64850, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250500, rate: 0.32 },
    { min: 250500, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
};

// ── State Income Tax Rates (simplified top marginal rates) ──
const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.05, AK: 0, AZ: 0.025, AR: 0.044, CA: 0.133, CO: 0.044, CT: 0.0699,
  DE: 0.066, FL: 0, GA: 0.0549, HI: 0.11, ID: 0.058, IL: 0.0495, IN: 0.0305,
  IA: 0.06, KS: 0.057, KY: 0.04, LA: 0.0425, ME: 0.0715, MD: 0.0575,
  MA: 0.09, MI: 0.0425, MN: 0.0985, MS: 0.05, MO: 0.048, MT: 0.0675,
  NE: 0.0664, NV: 0, NH: 0, NJ: 0.1075, NM: 0.059, NY: 0.109, NC: 0.045,
  ND: 0.025, OH: 0.035, OK: 0.0475, OR: 0.099, PA: 0.0307, RI: 0.0599,
  SC: 0.065, SD: 0, TN: 0, TX: 0, UT: 0.0465, VT: 0.0875, VA: 0.0575,
  WA: 0, WV: 0.0512, WI: 0.0765, WY: 0, DC: 0.1075,
};

// ── Standard Deductions 2026 ──
const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 15700,
  joint: 31400,
  hoh: 23550,
};

export interface TaxResult {
  grossIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  federalTax: number;
  federalEffectiveRate: number;
  federalMarginalRate: number;
  federalMarginalBracket: TaxBracket;
  stateTax: number;
  stateRate: number;
  stateName: string;
  totalTax: number;
  totalEffectiveRate: number;
  afterTaxIncome: number;
  bracketBreakdown: Array<{ bracket: TaxBracket; taxableInBracket: number; taxInBracket: number }>;
  // Bracket-crossing analysis
  nextBracketThreshold: number | null;
  incomeToNextBracket: number | null;
  nextBracketRate: number | null;
}

export interface TaxSavingsResult {
  currentScenario: TaxResult;
  proposedScenario: TaxResult;
  federalSavings: number;
  stateSavings: number;
  totalSavings: number;
  effectiveRateReduction: number;
  bracketDropped: boolean;
  lifetimeSavings: number; // projected over given years
}

/**
 * Calculate federal + state taxes with full bracket breakdown.
 */
export function calculateTax(
  grossIncome: number,
  filingStatus: FilingStatus = "single",
  stateCode: string = "TX",
  customDeduction?: number,
): TaxResult {
  const standardDeduction = customDeduction ?? STANDARD_DEDUCTIONS[filingStatus];
  const taxableIncome = Math.max(0, grossIncome - standardDeduction);
  const brackets = FEDERAL_BRACKETS_2026[filingStatus];

  let federalTax = 0;
  let marginalRate = 0.10;
  let marginalBracket = brackets[0];
  const breakdown: TaxResult["bracketBreakdown"] = [];

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    const taxInBracket = taxableInBracket * bracket.rate;
    federalTax += taxInBracket;
    breakdown.push({ bracket, taxableInBracket, taxInBracket });
    marginalRate = bracket.rate;
    marginalBracket = bracket;
  }

  // Bracket-crossing analysis
  let nextBracketThreshold: number | null = null;
  let incomeToNextBracket: number | null = null;
  let nextBracketRate: number | null = null;
  const currentBracketIdx = brackets.indexOf(marginalBracket);
  if (currentBracketIdx < brackets.length - 1) {
    const nextBracket = brackets[currentBracketIdx + 1];
    nextBracketThreshold = nextBracket.min + standardDeduction;
    incomeToNextBracket = Math.max(0, nextBracketThreshold - grossIncome);
    nextBracketRate = nextBracket.rate;
  }

  const stateRate = STATE_TAX_RATES[stateCode.toUpperCase()] ?? 0;
  const stateTax = taxableIncome * stateRate;
  const totalTax = federalTax + stateTax;

  return {
    grossIncome,
    standardDeduction,
    taxableIncome,
    federalTax,
    federalEffectiveRate: grossIncome > 0 ? federalTax / grossIncome : 0,
    federalMarginalRate: marginalRate,
    federalMarginalBracket: marginalBracket,
    stateTax,
    stateRate,
    stateName: stateCode.toUpperCase(),
    totalTax,
    totalEffectiveRate: grossIncome > 0 ? totalTax / grossIncome : 0,
    afterTaxIncome: grossIncome - totalTax,
    bracketBreakdown: breakdown,
    nextBracketThreshold,
    incomeToNextBracket,
    nextBracketRate,
  };
}

/**
 * Compare two tax scenarios and calculate savings.
 */
export function calculateTaxSavings(
  currentIncome: number,
  proposedIncome: number,
  filingStatus: FilingStatus = "single",
  stateCode: string = "TX",
  projectionYears: number = 20,
): TaxSavingsResult {
  const current = calculateTax(currentIncome, filingStatus, stateCode);
  const proposed = calculateTax(proposedIncome, filingStatus, stateCode);

  const federalSavings = current.federalTax - proposed.federalTax;
  const stateSavings = current.stateTax - proposed.stateTax;
  const totalSavings = federalSavings + stateSavings;
  const bracketDropped = proposed.federalMarginalRate < current.federalMarginalRate;

  return {
    currentScenario: current,
    proposedScenario: proposed,
    federalSavings,
    stateSavings,
    totalSavings,
    effectiveRateReduction: current.totalEffectiveRate - proposed.totalEffectiveRate,
    bracketDropped,
    lifetimeSavings: totalSavings * projectionYears,
  };
}

/**
 * Get the state tax rate for a given state code.
 */
export function getStateTaxRate(stateCode: string): number {
  return STATE_TAX_RATES[stateCode.toUpperCase()] ?? 0;
}

/**
 * Get all available state codes.
 */
export function getStateCodes(): string[] {
  return Object.keys(STATE_TAX_RATES).sort();
}

/**
 * Format currency for display.
 */
export function formatTaxCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

/**
 * Format percentage for display.
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// DYNAMIC TAX BRACKET PROJECTION ENGINE
// Year-over-year bracket adjustment based on income changes & O&G deductions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Annual income event that modifies taxable income for a given year.
 * Positive amounts increase income; negative amounts are deductions.
 */
export interface IncomeEvent {
  year: number;
  label: string;
  amount: number;
  category: "earned" | "investment" | "roth-conversion" | "social-security" | "pension" | "annuity" | "rental" | "og-deduction" | "iul-loan" | "other-deduction" | "other";
  recurring: boolean;
  /** If recurring, annual growth rate (e.g. 0.03 = 3%) */
  growthRate?: number;
}

/**
 * O&G deduction schedule — models the depreciation curve of an oil & gas investment.
 * Year 1 gets the large IDC (intangible drilling costs) write-off, then ongoing depletion.
 */
export interface OGDeductionSchedule {
  /** Investment amount */
  investmentAmount: number;
  /** Year the investment was made (1-indexed within projection) */
  startYear: number;
  /** Year 1 depreciation as percentage of investment (e.g. 80 = 80%) */
  y1DepreciationPct: number;
  /** Ongoing annual depreciation as percentage (e.g. 8 = 8%) */
  ongoingDepreciationPct: number;
  /** Total term in years (e.g. 12) */
  term: number;
  /** Label for this tranche */
  label: string;
}

/**
 * One year in the dynamic tax projection.
 */
export interface DynamicTaxYear {
  year: number;
  /** Gross income before any deductions */
  grossIncome: number;
  /** Itemized/custom deductions this year */
  totalDeductions: number;
  /** O&G depreciation deductions this year (subset of totalDeductions) */
  ogDeductions: number;
  /** Standard or itemized deduction used */
  appliedDeduction: number;
  /** Adjusted gross income */
  agi: number;
  /** Taxable income after all deductions */
  taxableIncome: number;
  /** Federal tax owed */
  federalTax: number;
  /** Federal marginal bracket rate */
  federalMarginalRate: number;
  /** Federal effective rate */
  federalEffectiveRate: number;
  /** State tax owed */
  stateTax: number;
  /** Total tax (federal + state) */
  totalTax: number;
  /** Total effective rate */
  totalEffectiveRate: number;
  /** After-tax income */
  afterTaxIncome: number;
  /** Tax savings vs. no-deduction baseline */
  taxSavingsVsBaseline: number;
  /** Cumulative tax savings vs. baseline */
  cumulativeTaxSavings: number;
  /** Bracket the taxpayer is in */
  bracketLabel: string;
  /** Whether bracket dropped from previous year */
  bracketDropped: boolean;
  /** Income events active this year */
  activeEvents: string[];
  /** O&G tranches active this year */
  activeOGTranches: string[];
  /** Full bracket breakdown for this year */
  bracketBreakdown: Array<{ rate: number; taxableInBracket: number; taxInBracket: number }>;
}

/**
 * Input for the dynamic tax projection.
 */
export interface DynamicTaxProjectionInput {
  /** Base annual earned income (year 1) */
  baseIncome: number;
  /** Annual income growth rate (e.g. 0.03 = 3%) */
  incomeGrowthRate: number;
  /** Filing status */
  filingStatus: FilingStatus;
  /** State code */
  stateCode: string;
  /** Projection years (default 20) */
  years: number;
  /** Additional income events (Roth conversions, Social Security start, pension, etc.) */
  incomeEvents: IncomeEvent[];
  /** O&G investment tranches with depreciation schedules */
  ogSchedules: OGDeductionSchedule[];
  /** Additional itemized deductions per year (mortgage interest, charitable, SALT, etc.) */
  annualItemizedDeductions: number;
  /** Whether to use itemized or standard deduction (auto = pick higher) */
  deductionMethod: "standard" | "itemized" | "auto";
  /** Annual inflation adjustment for brackets (default 2.5%) */
  bracketInflationRate?: number;
}

/**
 * Full output of the dynamic tax projection.
 */
export interface DynamicTaxProjectionResult {
  years: DynamicTaxYear[];
  summary: {
    totalTaxPaid: number;
    totalTaxSaved: number;
    averageEffectiveRate: number;
    lowestBracketYear: number;
    highestBracketYear: number;
    totalOGDeductions: number;
    totalIncomeEarned: number;
    totalAfterTaxIncome: number;
    bracketChanges: number;
    /** Year-over-year bracket trajectory */
    bracketTrajectory: Array<{ year: number; rate: number }>;
  };
}

/**
 * Inflate bracket thresholds by a given rate for a given number of years.
 */
function inflateBrackets(brackets: TaxBracket[], inflationRate: number, years: number): TaxBracket[] {
  const factor = Math.pow(1 + inflationRate, years);
  return brackets.map(b => ({
    min: Math.round(b.min * factor),
    max: b.max === Infinity ? Infinity : Math.round(b.max * factor),
    rate: b.rate,
  }));
}

/**
 * Get the bracket label string for a given marginal rate.
 */
function bracketLabel(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/**
 * Run a 20-year (or custom) dynamic tax projection with year-over-year
 * bracket adjustments based on income changes and O&G deductions.
 *
 * Key behaviors:
 * - Brackets inflate annually (default 2.5%) to model IRS adjustments
 * - O&G deductions reduce taxable income, potentially dropping brackets
 * - Income events (Roth conversions, SS start, pension) push income up/down
 * - Each year recalculates from scratch — no static rate assumption
 */
export function runDynamicTaxProjection(input: DynamicTaxProjectionInput): DynamicTaxProjectionResult {
  const {
    baseIncome,
    incomeGrowthRate,
    filingStatus,
    stateCode,
    years = 20,
    incomeEvents,
    ogSchedules,
    annualItemizedDeductions,
    deductionMethod,
    bracketInflationRate = 0.025,
  } = input;

  const baseBrackets = FEDERAL_BRACKETS_2026[filingStatus];
  const baseStdDeduction = STANDARD_DEDUCTIONS[filingStatus];
  const stateRate = STATE_TAX_RATES[stateCode.toUpperCase()] ?? 0;

  const yearResults: DynamicTaxYear[] = [];
  let cumulativeTaxSavings = 0;
  let prevMarginalRate = 0;

  // Baseline: what taxes would be with NO deductions strategy (just standard deduction + growing income)
  const baselineTaxes: number[] = [];

  for (let y = 1; y <= years; y++) {
    // ── 1. Inflate brackets for this year ──
    const yearBrackets = inflateBrackets(baseBrackets, bracketInflationRate, y - 1);
    const yearStdDeduction = Math.round(baseStdDeduction * Math.pow(1 + bracketInflationRate, y - 1));

    // ── 2. Calculate gross income from base + growth ──
    let grossIncome = baseIncome * Math.pow(1 + incomeGrowthRate, y - 1);

    // ── 3. Apply income events ──
    const activeEventLabels: string[] = [];
    for (const evt of incomeEvents) {
      let applies = false;
      if (evt.recurring) {
        applies = y >= evt.year;
      } else {
        applies = y === evt.year;
      }
      if (applies) {
        const yearsActive = y - evt.year;
        const eventAmount = evt.recurring && evt.growthRate
          ? evt.amount * Math.pow(1 + evt.growthRate, yearsActive)
          : evt.amount;

        // Deduction categories reduce income; income categories add
        if (evt.category === "og-deduction" || evt.category === "other-deduction") {
          // These are handled separately — don't add to gross
        } else if (evt.category === "iul-loan") {
          // Tax-free policy loans don't add to gross income
        } else {
          grossIncome += eventAmount;
        }
        activeEventLabels.push(evt.label);
      }
    }

    // ── 4. Calculate O&G depreciation deductions for this year ──
    let ogDeductions = 0;
    const activeOGLabels: string[] = [];
    for (const og of ogSchedules) {
      const ogYear = y - og.startYear + 1; // year within this tranche
      if (ogYear < 1 || ogYear > og.term) continue;
      activeOGLabels.push(og.label);
      if (ogYear === 1) {
        ogDeductions += og.investmentAmount * (og.y1DepreciationPct / 100);
      } else {
        ogDeductions += og.investmentAmount * (og.ongoingDepreciationPct / 100);
      }
    }

    // ── 5. Calculate total deductions ──
    const totalItemized = annualItemizedDeductions + ogDeductions;

    // Also add event-based deductions
    for (const evt of incomeEvents) {
      let applies = false;
      if (evt.recurring) applies = y >= evt.year;
      else applies = y === evt.year;
      if (applies && (evt.category === "og-deduction" || evt.category === "other-deduction")) {
        const yearsActive = y - evt.year;
        const eventAmount = evt.recurring && evt.growthRate
          ? Math.abs(evt.amount) * Math.pow(1 + evt.growthRate, yearsActive)
          : Math.abs(evt.amount);
        // Already counted in ogDeductions if it's an OG schedule; this is for standalone deduction events
      }
    }

    // ── 6. Choose deduction method ──
    let appliedDeduction: number;
    if (deductionMethod === "itemized") {
      appliedDeduction = totalItemized;
    } else if (deductionMethod === "standard") {
      appliedDeduction = yearStdDeduction;
    } else {
      // auto: pick whichever is higher
      appliedDeduction = Math.max(yearStdDeduction, totalItemized);
    }

    // ── 7. Calculate AGI and taxable income ──
    const agi = Math.max(0, grossIncome);
    const taxableIncome = Math.max(0, agi - appliedDeduction);

    // ── 8. Calculate federal tax with this year's inflated brackets ──
    let federalTax = 0;
    let marginalRate = yearBrackets[0].rate;
    const breakdown: DynamicTaxYear["bracketBreakdown"] = [];

    for (const bracket of yearBrackets) {
      if (taxableIncome <= bracket.min) break;
      const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
      const taxInBracket = taxableInBracket * bracket.rate;
      federalTax += taxInBracket;
      breakdown.push({ rate: bracket.rate, taxableInBracket, taxInBracket });
      marginalRate = bracket.rate;
    }

    // ── 9. State tax ──
    const stateTax = taxableIncome * stateRate;
    const totalTax = federalTax + stateTax;
    const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;
    const afterTaxIncome = grossIncome - totalTax;

    // ── 10. Calculate baseline tax (no O&G, no extra deductions) ──
    const baselineTaxableIncome = Math.max(0, grossIncome - yearStdDeduction);
    let baselineFedTax = 0;
    for (const bracket of yearBrackets) {
      if (baselineTaxableIncome <= bracket.min) break;
      const taxableInBracket = Math.min(baselineTaxableIncome, bracket.max) - bracket.min;
      baselineFedTax += taxableInBracket * bracket.rate;
    }
    const baselineStateTax = baselineTaxableIncome * stateRate;
    const baselineTotalTax = baselineFedTax + baselineStateTax;
    baselineTaxes.push(baselineTotalTax);

    const taxSavingsVsBaseline = baselineTotalTax - totalTax;
    cumulativeTaxSavings += taxSavingsVsBaseline;

    const bracketDropped = y > 1 && marginalRate < prevMarginalRate;

    yearResults.push({
      year: y,
      grossIncome: Math.round(grossIncome),
      totalDeductions: Math.round(totalItemized),
      ogDeductions: Math.round(ogDeductions),
      appliedDeduction: Math.round(appliedDeduction),
      agi: Math.round(agi),
      taxableIncome: Math.round(taxableIncome),
      federalTax: Math.round(federalTax),
      federalMarginalRate: marginalRate,
      federalEffectiveRate: grossIncome > 0 ? federalTax / grossIncome : 0,
      stateTax: Math.round(stateTax),
      totalTax: Math.round(totalTax),
      totalEffectiveRate: effectiveRate,
      afterTaxIncome: Math.round(afterTaxIncome),
      taxSavingsVsBaseline: Math.round(taxSavingsVsBaseline),
      cumulativeTaxSavings: Math.round(cumulativeTaxSavings),
      bracketLabel: bracketLabel(marginalRate),
      bracketDropped,
      activeEvents: activeEventLabels,
      activeOGTranches: activeOGLabels,
      bracketBreakdown: breakdown,
    });

    prevMarginalRate = marginalRate;
  }

  // ── Summary ──
  const totalTaxPaid = yearResults.reduce((s, y) => s + y.totalTax, 0);
  const totalTaxSaved = yearResults.reduce((s, y) => s + y.taxSavingsVsBaseline, 0);
  const totalIncomeEarned = yearResults.reduce((s, y) => s + y.grossIncome, 0);
  const totalAfterTaxIncome = yearResults.reduce((s, y) => s + y.afterTaxIncome, 0);
  const totalOGDeductions = yearResults.reduce((s, y) => s + y.ogDeductions, 0);
  const averageEffectiveRate = totalIncomeEarned > 0 ? totalTaxPaid / totalIncomeEarned : 0;
  const bracketChanges = yearResults.filter(y => y.bracketDropped).length;

  const lowestBracketYear = yearResults.reduce((min, y) =>
    y.federalMarginalRate < min.federalMarginalRate ? y : min, yearResults[0]).year;
  const highestBracketYear = yearResults.reduce((max, y) =>
    y.federalMarginalRate > max.federalMarginalRate ? y : max, yearResults[0]).year;

  return {
    years: yearResults,
    summary: {
      totalTaxPaid,
      totalTaxSaved,
      averageEffectiveRate,
      lowestBracketYear,
      highestBracketYear,
      totalOGDeductions,
      totalIncomeEarned,
      totalAfterTaxIncome,
      bracketChanges,
      bracketTrajectory: yearResults.map(y => ({ year: y.year, rate: y.federalMarginalRate })),
    },
  };
}

/**
 * Quick helper: generate O&G deduction schedules from MYGA waterfall cycles.
 * Each MYGA cycle spawns a new O&G tranche with its own depreciation curve.
 */
export function generateOGSchedulesFromMYGA(
  mygaCycles: number,
  mygaTerm: number,
  ogInvestmentPerCycle: number,
  y1DepPct: number = 80,
  ongoingDepPct: number = 8,
  ogTerm: number = 12,
): OGDeductionSchedule[] {
  const schedules: OGDeductionSchedule[] = [];
  for (let c = 0; c < mygaCycles; c++) {
    schedules.push({
      investmentAmount: ogInvestmentPerCycle,
      startYear: c * mygaTerm + 1,
      y1DepreciationPct: y1DepPct,
      ongoingDepreciationPct: ongoingDepPct,
      term: ogTerm,
      label: `O&G Tranche ${c + 1} (Cycle ${c + 1})`,
    });
  }
  return schedules;
}

/**
 * Run a comparison of multiple strategies side by side.
 * Each strategy is a different DynamicTaxProjectionInput.
 * Returns all results plus a delta analysis.
 */
export interface StrategyComparisonResult {
  strategies: Array<{
    label: string;
    result: DynamicTaxProjectionResult;
  }>;
  bestStrategy: string;
  worstStrategy: string;
  maxTaxSavings: number;
  yearByYearDelta: Array<{
    year: number;
    strategies: Array<{ label: string; totalTax: number; effectiveRate: number; bracketLabel: string }>;
  }>;
}

export function compareStrategies(
  strategies: Array<{ label: string; input: DynamicTaxProjectionInput }>,
): StrategyComparisonResult {
  const results = strategies.map(s => ({
    label: s.label,
    result: runDynamicTaxProjection(s.input),
  }));

  const bestIdx = results.reduce((best, r, i) =>
    r.result.summary.totalTaxSaved > results[best].result.summary.totalTaxSaved ? i : best, 0);
  const worstIdx = results.reduce((worst, r, i) =>
    r.result.summary.totalTaxSaved < results[worst].result.summary.totalTaxSaved ? i : worst, 0);

  const maxYears = Math.max(...results.map(r => r.result.years.length));
  const yearByYearDelta: StrategyComparisonResult["yearByYearDelta"] = [];
  for (let y = 0; y < maxYears; y++) {
    yearByYearDelta.push({
      year: y + 1,
      strategies: results.map(r => {
        const yr = r.result.years[y];
        return {
          label: r.label,
          totalTax: yr?.totalTax ?? 0,
          effectiveRate: yr?.totalEffectiveRate ?? 0,
          bracketLabel: yr?.bracketLabel ?? "N/A",
        };
      }),
    });
  }

  return {
    strategies: results,
    bestStrategy: results[bestIdx].label,
    worstStrategy: results[worstIdx].label,
    maxTaxSavings: results[bestIdx].result.summary.totalTaxSaved,
    yearByYearDelta,
  };
}
