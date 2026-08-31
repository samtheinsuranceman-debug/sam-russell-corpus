/**
 * Growth Annuity Engine — F&G Power Accumulator with BlackRock Managed ETFs
 * Includes precious metals analysis, Roth conversion calculators, and projection models
 */

// ─── F&G Power Accumulator Product Data ───────────────────────────────────────

export const FG_PRODUCT_DATA = {
  carrier: "Fidelity & Guaranty Life Insurance Company",
  product: "F&G Power Accumulator",
  amBestRating: "A (Excellent)",
  productType: "Fixed Index Annuity (FIA)",
  versions: ["Power Accumulator 7 (7-year)", "Power Accumulator 10 (10-year)"],
  keyDifferentiator: "Only FIA that benchmarks directly to iShares ETFs from BlackRock",
  hypotheticalReturn: { premium: 100000, finalValue: 221557, years: 10, geometricAvg: 8.28 },
  sources: [
    { name: "My Annuity Store", url: "https://myannuitystore.com/annuity-review/fg-power-accumulator/", date: "March 2026" },
    { name: "BlackRock/iShares", url: "https://www.blackrock.com/us/financial-professionals/insights/gold-silver-prices-volatility", date: "March 2026" },
    { name: "Sprott Insights", url: "https://sprott.com/insights/metals-post-strong-returns-in-2025/", date: "January 2026" },
    { name: "LSEG/FTSE Russell", url: "https://www.lseg.com/en/insights/ftse-russell/precious-metals-stocks-are-back-with-a-vengeance-in-2025", date: "September 2025" },
    { name: "J.P. Morgan Research", url: "https://www.jpmorgan.com/insights/global-research/commodities/gold-prices", date: "December 2025" },
    { name: "Investing.com", url: "https://www.investing.com/news/commodities-news/gold-starts-2026-higher-after-60-surge-last-year-silver-platinum-follow-4427311", date: "February 2026" },
  ],
};

export interface IndexStrategy {
  name: string;
  ticker: string;
  participationRate: number;
  capRate: number | null;
  spreadRate: number;
  term: string;
  description: string;
  assetClasses: string[];
  volatilityTarget: number | null;
  managedBy: string;
  isETFBased: boolean;
}

export const INDEX_STRATEGIES: IndexStrategy[] = [
  {
    name: "Balanced Asset 5 Index",
    ticker: "BA5",
    participationRate: 170,
    capRate: null,
    spreadRate: 0,
    term: "1-Year PTP",
    description: "Blends iShares Core S&P 500 ETF + iShares 20+ Year Treasury Bond ETF. Targets 5% annualized volatility with daily rebalancing.",
    assetClasses: ["US Equities", "US Treasuries"],
    volatilityTarget: 5,
    managedBy: "CIBC / BlackRock iShares",
    isETFBased: true,
  },
  {
    name: "BlackRock Market Advantage Index",
    ticker: "BMAI",
    participationRate: 135,
    capRate: null,
    spreadRate: 0,
    term: "1-Year PTP",
    description: "BlackRock's proprietary multi-asset index blending 8 iShares ETFs across US equities, international equities, emerging markets, high-yield bonds, treasuries, TIPS, and commodities.",
    assetClasses: ["US Equities", "International Equities", "Emerging Markets", "High-Yield Bonds", "Treasuries", "TIPS", "Commodities"],
    volatilityTarget: 6,
    managedBy: "BlackRock",
    isETFBased: true,
  },
  {
    name: "Morgan Stanley US Equity Allocator",
    ticker: "MSEA",
    participationRate: 75,
    capRate: null,
    spreadRate: 0,
    term: "1-Year PTP",
    description: "Uses rolling futures exposure to S&P 500 and Nasdaq-100, targeting 12% volatility for higher equity/tech exposure.",
    assetClasses: ["S&P 500 Futures", "Nasdaq-100 Futures"],
    volatilityTarget: 12,
    managedBy: "Morgan Stanley",
    isETFBased: false,
  },
  {
    name: "Balanced Asset 10 Index",
    ticker: "BA10",
    participationRate: 90,
    capRate: null,
    spreadRate: 0,
    term: "1-Year PTP",
    description: "Same CIBC structure as Balanced Asset 5 but targeting 10% volatility — roughly double the equity exposure for higher potential returns.",
    assetClasses: ["US Equities", "US Treasuries"],
    volatilityTarget: 10,
    managedBy: "CIBC / BlackRock iShares",
    isETFBased: true,
  },
  {
    name: "iShares Core S&P 500 ETF (IVV)",
    ticker: "IVV",
    participationRate: 40,
    capRate: 7.25,
    spreadRate: 0,
    term: "1-Year PTP",
    description: "Most transparent option with 66-year live track record. Direct benchmark to the S&P 500 via BlackRock's flagship ETF.",
    assetClasses: ["US Large Cap Equities"],
    volatilityTarget: null,
    managedBy: "BlackRock iShares",
    isETFBased: true,
  },
  {
    name: "iShares Gold Trust (IAU)",
    ticker: "IAU",
    participationRate: 40,
    capRate: null,
    spreadRate: 0,
    term: "1-Year PTP",
    description: "Direct gold exposure — gold posted 13.1% annualized returns 2019-2024 and surged 60%+ in 2025. J.P. Morgan forecasts $5,000-$6,000/oz.",
    assetClasses: ["Gold / Precious Metals"],
    volatilityTarget: null,
    managedBy: "BlackRock iShares",
    isETFBased: true,
  },
  {
    name: "iShares MSCI EAFE (EFA)",
    ticker: "EFA",
    participationRate: 40,
    capRate: null,
    spreadRate: 0,
    term: "1-Year PTP",
    description: "International developed-market equities exposure across Europe, Japan, and Australia.",
    assetClasses: ["International Developed Markets"],
    volatilityTarget: null,
    managedBy: "BlackRock iShares",
    isETFBased: true,
  },
  {
    name: "iShares U.S. Real Estate (IYR)",
    ticker: "IYR",
    participationRate: 40,
    capRate: null,
    spreadRate: 0,
    term: "1-Year PTP",
    description: "REIT exposure providing sensitivity to commercial real estate performance.",
    assetClasses: ["US Real Estate / REITs"],
    volatilityTarget: null,
    managedBy: "BlackRock iShares",
    isETFBased: true,
  },
];

// ─── Precious Metals Performance Data ─────────────────────────────────────────

export const PRECIOUS_METALS_DATA = {
  gold: {
    currentPrice: 4783,
    performance: [
      { year: 2020, returnPct: 25.1, source: "World Gold Council" },
      { year: 2021, returnPct: -3.6, source: "World Gold Council" },
      { year: 2022, returnPct: -0.3, source: "World Gold Council" },
      { year: 2023, returnPct: 13.1, source: "World Gold Council" },
      { year: 2024, returnPct: 27.2, source: "Investing.com" },
      { year: 2025, returnPct: 64.6, source: "Sprott Insights, Jan 2026" },
    ],
    jpMorganForecast: { target: 5000, timeframe: "Q4 2026", longTerm: 6000 },
  },
  silver: {
    currentPrice: 72,
    performance: [
      { year: 2020, returnPct: 47.9, source: "Kitco" },
      { year: 2021, returnPct: -11.7, source: "Kitco" },
      { year: 2022, returnPct: -0.8, source: "Kitco" },
      { year: 2023, returnPct: 0.2, source: "Kitco" },
      { year: 2024, returnPct: 21.5, source: "Investing.com" },
      { year: 2025, returnPct: 148.0, source: "BlackRock/iShares, Mar 2026" },
    ],
  },
  ftseGlobalPreciousMetals: {
    ytd2025: 86,
    source: "LSEG/FTSE Russell, Sep 2025",
  },
  annualized2YearReturn: 45.9, // geometric average of 2024+2025 gold returns
  annualizedPreciousMetalsIndex: 22.5, // blended precious metals index
};

// ─── Managed ETF vs Traditional Index Comparison ──────────────────────────────

export interface ComparisonPoint {
  category: string;
  managedETF: string;
  traditionalIndex: string;
  advantage: "etf" | "traditional" | "neutral";
}

export const ETF_VS_TRADITIONAL: ComparisonPoint[] = [
  {
    category: "Transparency",
    managedETF: "Benchmarks to real iShares ETFs (IVV, IAU, EFA, IYR) with decades of public performance data you can verify on any financial site",
    traditionalIndex: "Custom 'black box' indices created by investment banks with limited transparency about methodology",
    advantage: "etf",
  },
  {
    category: "Active Management",
    managedETF: "BlackRock's algorithms rebalance daily across 8+ asset classes, mobilizing funds on an hourly and daily basis to optimize returns",
    traditionalIndex: "Static index formula set at creation — no active management or real-time rebalancing",
    advantage: "etf",
  },
  {
    category: "Asset Diversification",
    managedETF: "Access to US equities, international markets, emerging markets, bonds, TIPS, commodities, gold, and real estate through actual ETFs",
    traditionalIndex: "Typically limited to a single custom index with opaque asset allocation",
    advantage: "etf",
  },
  {
    category: "Participation Rates",
    managedETF: "Up to 170% participation rate on Balanced Asset 5 — you earn MORE than the index return",
    traditionalIndex: "Typically 50-100% participation with lower caps and higher spreads",
    advantage: "etf",
  },
  {
    category: "Performance Track Record",
    managedETF: "iShares ETFs have 20+ year track records. S&P 500 (IVV) has 66 years of live data",
    traditionalIndex: "Most custom indices have 5-10 years of backtested (not live) data",
    advantage: "etf",
  },
  {
    category: "Precious Metals Access",
    managedETF: "Direct gold exposure via iShares Gold Trust (IAU) — gold surged 60%+ in 2025 alone",
    traditionalIndex: "Rarely offer precious metals exposure in crediting strategies",
    advantage: "etf",
  },
  {
    category: "Downside Protection",
    managedETF: "0% floor — you never lose principal regardless of market performance",
    traditionalIndex: "0% floor — same downside protection",
    advantage: "neutral",
  },
  {
    category: "Double-Digit Return Potential",
    managedETF: "170% participation × 8% index gain = 13.6% credited. Precious metals index: 20-25% annualized recent returns",
    traditionalIndex: "Lower participation rates and caps typically limit returns to 4-7% even in strong markets",
    advantage: "etf",
  },
];

// ─── Surrender Schedule ───────────────────────────────────────────────────────

export const SURRENDER_SCHEDULE_10 = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 0];
export const SURRENDER_SCHEDULE_7 = [9, 8, 7, 6, 5, 4, 3, 0];

// ─── Growth Annuity Calculator Input/Output ───────────────────────────────────

export interface GrowthAnnuityInput {
  initialPremium: number;
  annualReturnRate: number; // e.g., 20-25%
  projectionYears: number;
  // Existing annuity for Roth conversion
  existingAnnuityValue: number;
  existingAnnuityCompany: string;
  yearsInForce: number;
  currentSurrenderValue: number;
  accountType: "ira" | "401k" | "403b" | "tsp" | "roth" | "nonqualified";
  surrenderPenaltyPct: number; // default 15%
  premiumBonusPct: number; // 20-30%
  // Roth conversion
  doRothConversion: boolean;
  currentTaxBracket: number;
}

export interface ProjectionYear {
  year: number;
  age: number;
  startValue: number;
  growth: number;
  endValue: number;
  cumulativeGrowth: number;
  cumulativeReturnPct: number;
}

export interface RothConversionResult {
  originalValue: number;
  surrenderPenalty: number;
  afterPenaltyValue: number;
  rothConversionTax: number; // 0% with proper planning
  premiumBonus: number;
  premiumBonusPct: number;
  enhancedValue: number;
  netGainOverOriginal: number;
  netGainPct: number;
  taxFreeAdvantage: string;
}

export interface GrowthAnnuityResult {
  projections: ProjectionYear[];
  totalGrowth: number;
  finalValue: number;
  averageAnnualReturn: number;
  rothConversion: RothConversionResult | null;
  rothProjections: ProjectionYear[] | null;
  traditionalProjections: ProjectionYear[];
  preciousMetalsProjections: ProjectionYear[];
}

// ─── Calculator Functions ─────────────────────────────────────────────────────

export function calculateGrowthProjection(
  premium: number,
  annualReturn: number,
  years: number,
  startAge: number = 60
): ProjectionYear[] {
  const results: ProjectionYear[] = [];
  let currentValue = premium;

  for (let y = 1; y <= years; y++) {
    const startValue = currentValue;
    const growth = startValue * (annualReturn / 100);
    currentValue = startValue + growth;
    const cumulativeGrowth = currentValue - premium;
    const cumulativeReturnPct = ((currentValue / premium) - 1) * 100;

    results.push({
      year: y,
      age: startAge + y,
      startValue: Math.round(startValue),
      growth: Math.round(growth),
      endValue: Math.round(currentValue),
      cumulativeGrowth: Math.round(cumulativeGrowth),
      cumulativeReturnPct: Math.round(cumulativeReturnPct * 10) / 10,
    });
  }

  return results;
}

export function calculateRothConversion(input: GrowthAnnuityInput): RothConversionResult {
  const surrenderPenalty = input.currentSurrenderValue * (input.surrenderPenaltyPct / 100);
  const afterPenaltyValue = input.currentSurrenderValue - surrenderPenalty;

  // Roth conversion at 0% tax liability through proper tax planning
  const rothConversionTax = 0;

  // Premium bonus applied tax-free (20-30%)
  const premiumBonus = afterPenaltyValue * (input.premiumBonusPct / 100);
  const enhancedValue = afterPenaltyValue + premiumBonus;

  const netGainOverOriginal = enhancedValue - input.currentSurrenderValue;
  const netGainPct = ((enhancedValue / input.currentSurrenderValue) - 1) * 100;

  return {
    originalValue: input.currentSurrenderValue,
    surrenderPenalty: Math.round(surrenderPenalty),
    afterPenaltyValue: Math.round(afterPenaltyValue),
    rothConversionTax,
    premiumBonus: Math.round(premiumBonus),
    premiumBonusPct: input.premiumBonusPct,
    enhancedValue: Math.round(enhancedValue),
    netGainOverOriginal: Math.round(netGainOverOriginal),
    netGainPct: Math.round(netGainPct * 10) / 10,
    taxFreeAdvantage: "All future gains are 100% tax-free — not tax-deferred like traditional annuities. Every dollar earned stays in your pocket.",
  };
}

export function runGrowthAnnuityAnalysis(input: GrowthAnnuityInput): GrowthAnnuityResult {
  // Standard projections with chosen return rate
  const projections = calculateGrowthProjection(
    input.initialPremium,
    input.annualReturnRate,
    input.projectionYears
  );

  // Traditional FIA comparison (5.5% annual)
  const traditionalProjections = calculateGrowthProjection(
    input.initialPremium,
    5.5,
    input.projectionYears
  );

  // Precious metals index projections (22.5% based on recent performance)
  const preciousMetalsProjections = calculateGrowthProjection(
    input.initialPremium,
    22.5,
    input.projectionYears
  );

  // Roth conversion analysis
  let rothConversion: RothConversionResult | null = null;
  let rothProjections: ProjectionYear[] | null = null;

  if (input.doRothConversion && input.currentSurrenderValue > 0) {
    rothConversion = calculateRothConversion(input);
    rothProjections = calculateGrowthProjection(
      rothConversion.enhancedValue,
      input.annualReturnRate,
      input.projectionYears
    );
  }

  const finalValue = projections[projections.length - 1]?.endValue ?? input.initialPremium;
  const totalGrowth = finalValue - input.initialPremium;

  return {
    projections,
    totalGrowth,
    finalValue,
    averageAnnualReturn: input.annualReturnRate,
    rothConversion,
    rothProjections,
    traditionalProjections,
    preciousMetalsProjections,
  };
}

// ─── Fiat Currency & Money Printing Data ──────────────────────────────────────

export const FIAT_CURRENCY_DATA = {
  usNationalDebt: 36_000_000_000_000, // $36 trillion+
  m2MoneySupply2020: 15_400_000_000_000,
  m2MoneySupply2025: 21_700_000_000_000,
  m2IncreasePct: 41,
  federalDeficit2025: 1_800_000_000_000,
  goldVsDollarSince1971: {
    goldPrice1971: 35,
    goldPrice2026: 4783,
    goldAppreciation: 13566, // percent
    dollarPurchasingPowerLost: 87, // percent
  },
  keyPoints: [
    "The US national debt has surpassed $36 trillion and continues to grow at an accelerating pace",
    "The M2 money supply increased 41% from 2020-2025, diluting the purchasing power of every dollar in circulation",
    "Since abandoning the gold standard in 1971, gold has appreciated over 13,500% while the dollar has lost 87% of its purchasing power",
    "Central banks worldwide are buying gold at record levels — a clear signal that even governments are hedging against their own currencies",
    "BRICS nations are actively pursuing de-dollarization, creating alternative trade settlement systems backed by gold",
    "J.P. Morgan forecasts gold reaching $5,000/oz by Q4 2026 and potentially $6,000/oz longer term",
  ],
};

// ─── Formatting Helpers ───────────────────────────────────────────────────────

export function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

export function formatPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}
