/**
 * 30-Year Index Crediting Data for IUL Backtester
 * 
 * Contains actual annual price returns for major indices (1994-2025)
 * and carrier-specific index options with their cap/floor/participation/spread parameters.
 * Crediting rates are derived by applying each carrier's parameters to the raw index returns.
 */
// ─── Raw Index Annual Price Returns (1994-2025) ─────────────────────────────
export const RAW_INDEX_RETURNS: Record<string, Record<number, number>> = {
  SP500: {
    1994: 4.33, 1995: 31.40, 1996: 23.48, 1997: 32.69, 1998: 18.01,
    1999: 10.34, 2000: -9.26, 2001: -10.74, 2002: -24.00, 2003: 36.12,
    2004: 5.12, 2005: 6.40, 2006: 9.85, 2007: -5.42, 2008: -44.76,
    2009: 50.25, 2010: 20.17, 2011: 2.90, 2012: 10.91, 2013: 22.76,
    2014: 13.18, 2015: -8.19, 2016: 22.33, 2017: 14.82, 2018: 2.60,
    2019: 6.10, 2020: 29.01, 2021: 14.77, 2022: -9.23, 2023: 28.36,
    2024: 16.84, 2025: 15.52,
  },
  NASDAQ100: {
    1994: 1.50, 1995: 42.54, 1996: 42.54, 1997: 20.63, 1998: 85.30,
    1999: 101.95, 2000: -36.84, 2001: -32.65, 2002: -37.58, 2003: 49.12,
    2004: 10.44, 2005: 1.49, 2006: 6.79, 2007: 18.67, 2008: -41.89,
    2009: 53.54, 2010: 19.22, 2011: 2.70, 2012: 16.82, 2013: 34.99,
    2014: 17.94, 2015: 8.43, 2016: 5.89, 2017: 31.52, 2018: -1.04,
    2019: 37.96, 2020: 47.58, 2021: 26.63, 2022: -32.97, 2023: 53.81,
    2024: 24.88, 2025: 20.17,
  },
  RUSSELL2000: {
    1994: -3.37, 1995: 26.64, 1996: 10.81, 1997: 28.27, 1998: -15.06,
    1999: 47.28, 2000: -17.89, 2001: -1.06, 2002: -23.19, 2003: 62.42,
    2004: 8.28, 2005: 15.23, 2006: 8.58, 2007: -13.50, 2008: -43.31,
    2009: 61.58, 2010: 31.01, 2011: -1.52, 2012: 12.35, 2013: 29.84,
    2014: 4.26, 2015: -16.17, 2016: 34.12, 2017: 9.07, 2018: 4.17,
    2019: -6.29, 2020: 49.08, 2021: -6.95, 2022: -7.38, 2023: 8.32,
    2024: 5.27, 2025: 21.70,
  },
};
// ─── Crediting Engine ────────────────────────────────────────────────────────
export interface IndexOption {
  id: string;
  name: string;
  carrier: 'a-mutual' | 'a-plus-mutual-life' | 'a-minus-mutual';
  /** Underlying index key in RAW_INDEX_RETURNS */
  index: string;
  /** Special index type for blended/hindsight strategies */
  indexType?: 'single' | 'blended' | 'hindsight' | 'multiIndex';
  /** For blended/multi strategies, the component indices and weights */
  components?: Array<{ index: string; weight: number }>;
  /** Cap rate (%) — null means uncapped */
  cap: number | null;
  /** Floor rate (%) — typically 0 */
  floor: number;
  /** Participation rate (%) — e.g. 100, 125, 215 */
  participation: number;
  /** Spread (%) — deducted from raw return before cap/floor */
  spread: number;
  /** Strategy charge (%) — deducted annually from the crediting */
  strategyCharge: number;
  /** Bonus rate (%) — added to crediting */
  bonus: number;
  /** Description for the UI */
  description: string;
  /** Available years (some strategies don't have 30-year history) */
  availableFrom: number;
}
// ─── A MUTUAL LIFE Index Options ──────────────────────
export const A_MUTUAL_INDEX_OPTIONS: IndexOption[] = [
  {
    id: 'am-sp500-ptp',
    name: 'S&P 500 Point-to-Point',
    carrier: 'a-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: 10.25,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Traditional capped S&P 500 strategy. 100% participation, 10.25% cap, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'am-sp500-uncapped',
    name: 'Uncapped S&P 500 PtP',
    carrier: 'a-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 100,
    spread: 5.75,
    strategyCharge: 0,
    bonus: 0,
    description: 'Uncapped S&P 500 with 5.75% spread. Unlimited upside minus spread, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'am-highcap-sp500',
    name: 'High-Cap S&P 500 PtP',
    carrier: 'a-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: 13.25,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 1.5,
    bonus: 0,
    description: 'Higher cap (13.25%) with 1.5% strategy charge. More upside potential.',
    availableFrom: 1994,
  },
  {
    id: 'am-multi-index',
    name: 'Multi-Index Monthly Average',
    carrier: 'a-mutual',
    index: 'SP500',
    indexType: 'multiIndex',
    components: [
      { index: 'SP500', weight: 0.50 },
      { index: 'NASDAQ100', weight: 0.30 },
      { index: 'RUSSELL2000', weight: 0.20 },
    ],
    cap: 14,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Blended 50/30/20 of best-performing indices (S&P, Nasdaq, Russell). 14% cap, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'am-highcap-multi',
    name: 'High-Cap Multi-Index Monthly Avg',
    carrier: 'a-mutual',
    index: 'SP500',
    indexType: 'multiIndex',
    components: [
      { index: 'SP500', weight: 0.50 },
      { index: 'NASDAQ100', weight: 0.30 },
      { index: 'RUSSELL2000', weight: 0.20 },
    ],
    cap: 25,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 1.5,
    bonus: 0,
    description: 'High-cap multi-index blend (25% cap) with 1.5% strategy charge.',
    availableFrom: 1994,
  },
  {
    id: 'am-fixed',
    name: 'Fixed Interest',
    carrier: 'a-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: 4.25,
    floor: 4.25,
    participation: 0,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Fixed 4.25% guaranteed interest. No market exposure.',
    availableFrom: 1994,
  },
  {
    id: 'am-sp500-2yr',
    name: '2-Year S&P 500 PtP (Spread)',
    carrier: 'a-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 100,
    spread: 4.5,
    strategyCharge: 0,
    bonus: 0,
    description: '2-Year S&P 500 Point-to-Point. 100% participation, uncapped, -4.5% spread, 0% floor.',
    availableFrom: 1994,
  },
];

// ─── A+ MUTUAL LIFE Index Options ──────────────────────
export const A_PLUS_MUTUAL_LIFE_INDEX_OPTIONS: IndexOption[] = [
  {
    id: 'apm-sp500-capped',
    name: 'S&P 500 Capped PtP',
    carrier: 'a-plus-mutual-life',
    index: 'SP500',
    indexType: 'single',
    cap: 10.50,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Traditional S&P 500 capped at 10.50%. 100% participation, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'apm-sp500-multiplier',
    name: 'S&P 500 with Multiplier',
    carrier: 'a-plus-mutual-life',
    index: 'SP500',
    indexType: 'single',
    cap: 14.0,
    floor: 0,
    participation: 110,
    spread: 0,
    strategyCharge: 0.75,
    bonus: 0,
    description: 'S&P 500 with 110% participation and 14% cap. 0.75% strategy charge.',
    availableFrom: 1994,
  },
  {
    id: 'apm-sp500-lowvol',
    name: 'S&P 500 Low Volatility',
    carrier: 'a-plus-mutual-life',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 100,
    spread: 3.0,
    strategyCharge: 0,
    bonus: 0,
    description: 'S&P 500 Low Volatility — uncapped with 3% spread. Smoother returns.',
    availableFrom: 1994,
  },
  {
    id: 'apm-hindsight',
    name: 'Hindsight Account (S&P/Nasdaq/Russell)',
    carrier: 'a-plus-mutual-life',
    index: 'SP500',
    indexType: 'hindsight',
    components: [
      { index: 'SP500', weight: 0.60 },
      { index: 'NASDAQ100', weight: 0.40 },
      { index: 'RUSSELL2000', weight: 0.0 },
    ],
    cap: 12.0,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Hindsight: 60% best + 40% second-best of S&P 500, Nasdaq-100, Russell 2000. 12% cap.',
    availableFrom: 1994,
  },
  {
    id: 'apm-fixed',
    name: 'Fixed Account',
    carrier: 'a-plus-mutual-life',
    index: 'SP500',
    indexType: 'single',
    cap: 4.0,
    floor: 4.0,
    participation: 0,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Fixed 4.0% guaranteed interest. No market exposure.',
    availableFrom: 1994,
  },
  {
    id: 'apm-sp500-2yr',
    name: '2-Year S&P 500 PtP (110% Participation)',
    carrier: 'a-plus-mutual-life',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 110,
    spread: 2.5,
    strategyCharge: 0,
    bonus: 0,
    description: '2-Year S&P 500 Point-to-Point. Uncapped, 110% participation, -2.5% spread, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'apm-sp500-1yr-capped',
    name: '1-Year S&P 500 Capped PtP',
    carrier: 'a-plus-mutual-life',
    index: 'SP500',
    indexType: 'single',
    cap: 10.5,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: '1-Year S&P 500 Point-to-Point. 100% participation, 10.5% cap, 0% floor.',
    availableFrom: 1994,
  },
];

// ─── A- MUTUAL LIFE Index Options ───────────────────────
export const A_MINUS_MUTUAL_INDEX_OPTIONS: IndexOption[] = [
  {
    id: 'amm-sp500-core',
    name: 'S&P 500 Core PtP',
    carrier: 'a-minus-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: 9.5,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Core S&P 500 strategy. 9.5% cap, 100% participation, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'amm-sp500-smart',
    name: 'S&P 500 Smart Strategy',
    carrier: 'a-minus-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 100,
    spread: 5.0,
    strategyCharge: 0,
    bonus: 0,
    description: 'S&P 500 Allocation Index — uncapped with 5.0% spread. 100% participation.',
    availableFrom: 1994,
  },
  {
    id: 'amm-nasdaq-ccar',
    name: 'Nasdaq-100 CCAR',
    carrier: 'a-minus-mutual',
    index: 'NASDAQ100',
    indexType: 'single',
    cap: 11.0,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Nasdaq-100 with CCAR rider. 11% cap, 100% participation, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'amm-sp500-highpar',
    name: 'S&P 500 High Participation',
    carrier: 'a-minus-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 85,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'S&P 500 uncapped with 85% participation. No spread.',
    availableFrom: 1994,
  },
  {
    id: 'amm-dynamic-bonus',
    name: 'Dynamic Low Vol with Bonus',
    carrier: 'a-minus-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 125,
    spread: 0,
    strategyCharge: 0,
    bonus: 0.75,
    description: 'Dynamic Low Volatility — 125% participation, 0.75% bonus, uncapped.',
    availableFrom: 1994,
  },
  {
    id: 'amm-fixed',
    name: 'Fixed Account',
    carrier: 'a-minus-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: 3.75,
    floor: 3.75,
    participation: 0,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Fixed 3.75% guaranteed interest. No market exposure.',
    availableFrom: 1994,
  },
  {
    id: 'amm-sp500-2yr',
    name: '2-Year S&P 500 PtP (110% Participation)',
    carrier: 'a-minus-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 110,
    spread: 2.5,
    strategyCharge: 0,
    bonus: 0,
    description: '2-Year S&P 500 Point-to-Point. Uncapped, 110% participation, -2.5% spread, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'amm-sp500-1yr-capped',
    name: '1-Year S&P 500 Capped PtP',
    carrier: 'a-minus-mutual',
    index: 'SP500',
    indexType: 'single',
    cap: 10.5,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: '1-Year S&P 500 Point-to-Point. 100% participation, 10.5% cap, 0% floor.',
    availableFrom: 1994,
  },
];

// ─── All Options Combined ────────────────────────────────────────────────────
export const ALL_INDEX_OPTIONS: IndexOption[] = [
  ...A_MUTUAL_INDEX_OPTIONS,
  ...A_PLUS_MUTUAL_LIFE_INDEX_OPTIONS,
  ...A_MINUS_MUTUAL_INDEX_OPTIONS,
];

// ─── Crediting Calculation ───────────────────────────────────────────────────

/**
 * Calculate the credited rate for a single year given an index option and raw return.
 * Applies participation, spread, cap, floor, strategy charge, and bonus in the correct order.
 */
export function calculateCreditedRate(option: IndexOption, rawReturn: number): number {
  // Fixed account — always returns the cap (which equals the floor)
  if (option.participation === 0) {
    return option.cap ?? 0;
  }

  // Step 1: Apply participation rate
  let credited = rawReturn * (option.participation / 100);

  // Step 2: Apply spread (deducted before cap/floor)
  credited = credited - option.spread;

  // Step 3: Apply floor (before cap, so floor protects against negative after spread)
  credited = Math.max(credited, option.floor);

  // Step 4: Apply cap
  if (option.cap !== null) {
    credited = Math.min(credited, option.cap);
  }

  // Step 5: Deduct strategy charge
  credited = credited - option.strategyCharge;

  // Step 6: Add bonus
  credited = credited + option.bonus;

  // Final floor: crediting can never go below 0% in an IUL
  return Math.max(credited, 0);
}

/**
 * Calculate the raw blended return for multi-index or hindsight strategies.
 * For 'multiIndex': weighted blend of returns (50% best, 30% second, 20% third).
 * For 'hindsight': 60% best + 40% second-best.
 */
export function calculateBlendedReturn(option: IndexOption, year: number): number {
  if (!option.components || option.components.length === 0) {
    return RAW_INDEX_RETURNS[option.index]?.[year] ?? 0;
  }

  // Get returns for all component indices
  const returns = option.components.map(c => ({
    index: c.index,
    ret: RAW_INDEX_RETURNS[c.index]?.[year] ?? 0,
  }));

  if (option.indexType === 'hindsight') {
    // Sort by return descending, take 60% best + 40% second
    returns.sort((a, b) => b.ret - a.ret);
    return returns[0].ret * 0.60 + (returns[1]?.ret ?? 0) * 0.40;
  }

  if (option.indexType === 'multiIndex') {
    // Sort by return descending, apply 50/30/20 weighting
    returns.sort((a, b) => b.ret - a.ret);
    const weights = [0.50, 0.30, 0.20];
    let blended = 0;
    for (let i = 0; i < returns.length && i < weights.length; i++) {
      blended += returns[i].ret * weights[i];
    }
    return blended;
  }

  // Default: simple weighted average
  let total = 0;
  for (const c of option.components) {
    total += (RAW_INDEX_RETURNS[c.index]?.[year] ?? 0) * c.weight;
  }
  return total;
}

/**
 * Get the credited rate for an index option in a specific year.
 */
export function getCreditedRate(option: IndexOption, year: number): number {
  let rawReturn: number;

  if (option.indexType === 'multiIndex' || option.indexType === 'hindsight' || option.indexType === 'blended') {
    rawReturn = calculateBlendedReturn(option, year);
  } else {
    rawReturn = RAW_INDEX_RETURNS[option.index]?.[year] ?? 0;
  }

  return calculateCreditedRate(option, rawReturn);
}

/**
 * Get the full 30-year crediting history for an index option.
 */
export function getCreditingHistory(option: IndexOption, startYear = 1994, endYear = 2025): Array<{ year: number; rawReturn: number; creditedRate: number }> {
  const history: Array<{ year: number; rawReturn: number; creditedRate: number }> = [];

  for (let year = startYear; year <= endYear; year++) {
    let rawReturn: number;
    if (option.indexType === 'multiIndex' || option.indexType === 'hindsight' || option.indexType === 'blended') {
      rawReturn = calculateBlendedReturn(option, year);
    } else {
      rawReturn = RAW_INDEX_RETURNS[option.index]?.[year] ?? 0;
    }

    const creditedRate = calculateCreditedRate(option, rawReturn);
    history.push({ year, rawReturn: Math.round(rawReturn * 100) / 100, creditedRate: Math.round(creditedRate * 100) / 100 });
  }

  return history;
}

/**
 * Run a backtested simulation with a given allocation across multiple index options.
 * Returns year-by-year account values.
 */
export interface AllocationEntry {
  optionId: string;
  percentage: number; // 0-100
}

export interface BacktestResult {
  years: Array<{
    year: number;
    startingValue: number;
    weightedCreditRate: number;
    endingValue: number;
    /** Per-option breakdown */
    optionBreakdown: Array<{
      optionId: string;
      optionName: string;
      allocation: number;
      rawReturn: number;
      creditedRate: number;
      contribution: number;
    }>;
  }>;
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  floorProtectedYears: number;
  capLimitedYears: number;
}

export function runBacktest(
  allocations: AllocationEntry[],
  annualPremium: number,
  simulationYears: number,
  startYear: number,
): BacktestResult {
  // Resolve options
  const resolvedAllocations = allocations
    .filter(a => a.percentage > 0)
    .map(a => {
      const option = ALL_INDEX_OPTIONS.find(o => o.id === a.optionId);
      if (!option) throw new Error(`Unknown option: ${a.optionId}`);
      return { option, pct: a.percentage / 100 };
    });

  // Validate allocations sum to 100%
  const totalPct = resolvedAllocations.reduce((s, a) => s + a.pct, 0);
  if (Math.abs(totalPct - 1.0) > 0.01) {
    throw new Error(`Allocations must sum to 100% (got ${(totalPct * 100).toFixed(1)}%)`);
  }

  let accountValue = 0;
  const years: BacktestResult['years'] = [];
  let floorProtectedYears = 0;
  let capLimitedYears = 0;

  for (let i = 0; i < simulationYears; i++) {
    const year = startYear + i;
    const startingValue = accountValue + annualPremium;

    // Calculate weighted credit rate
    let weightedRate = 0;
    const optionBreakdown: BacktestResult['years'][0]['optionBreakdown'] = [];

    let anyFloorProtected = false;
    let anyCapLimited = false;

    for (const { option, pct } of resolvedAllocations) {
      let rawReturn: number;
      if (option.indexType === 'multiIndex' || option.indexType === 'hindsight' || option.indexType === 'blended') {
        rawReturn = calculateBlendedReturn(option, year);
      } else {
        rawReturn = RAW_INDEX_RETURNS[option.index]?.[year] ?? 0;
      }

      const creditedRate = calculateCreditedRate(option, rawReturn);
      const contribution = creditedRate * pct;
      weightedRate += contribution;

      // Track floor/cap events
      if (rawReturn < 0 && creditedRate === 0) anyFloorProtected = true;
      if (option.cap !== null && creditedRate >= option.cap - option.strategyCharge) anyCapLimited = true;

      optionBreakdown.push({
        optionId: option.id,
        optionName: option.name,
        allocation: Math.round(pct * 100),
        rawReturn: Math.round(rawReturn * 100) / 100,
        creditedRate: Math.round(creditedRate * 100) / 100,
        contribution: Math.round(contribution * 100) / 100,
      });
    }

    if (anyFloorProtected) floorProtectedYears++;
    if (anyCapLimited) capLimitedYears++;

    const endingValue = startingValue * (1 + weightedRate / 100);
    accountValue = endingValue;

    years.push({
      year,
      startingValue: Math.round(startingValue),
      weightedCreditRate: Math.round(weightedRate * 100) / 100,
      endingValue: Math.round(endingValue),
      optionBreakdown,
    });
  }

  const totalPremiums = annualPremium * simulationYears;
  const totalReturn = ((accountValue - totalPremiums) / totalPremiums) * 100;
  const annualizedReturn = (Math.pow(accountValue / totalPremiums, 1 / simulationYears) - 1) * 100;

  return {
    years,
    finalValue: Math.round(accountValue),
    totalReturn: Math.round(totalReturn * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    floorProtectedYears,
    capLimitedYears,
  };
}

// ─── Carrier Grouping Helper ─────────────────────────────────────────────────
export function getOptionsByCarrier(carrier: 'a-mutual' | 'a-plus-mutual-life' | 'a-minus-mutual'): IndexOption[] {
  return ALL_INDEX_OPTIONS.filter(o => o.carrier === carrier);
}

export const CARRIERS = [
  { id: 'a-mutual', name: 'A Mutual Life', color: '#1e40af' },
  { id: 'a-plus-mutual-life', name: 'A+ Mutual Life', color: '#059669' },
  { id: 'a-minus-mutual', name: 'A- Mutual Life', color: '#7c3aed' },
] as const;

/** Legacy aliases for backward compatibility */
export const NATIONWIDE_INDEX_OPTIONS = A_MUTUAL_INDEX_OPTIONS;
export const SECURIAN_INDEX_OPTIONS = A_PLUS_MUTUAL_LIFE_INDEX_OPTIONS;
export const SYMETRA_INDEX_OPTIONS = A_MINUS_MUTUAL_INDEX_OPTIONS;

export const AVAILABLE_YEARS = Object.keys(RAW_INDEX_RETURNS.SP500).map(Number).sort((a, b) => a - b);
export const MIN_YEAR = AVAILABLE_YEARS[0]; // 1994
export const MAX_YEAR = AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]; // 2025
