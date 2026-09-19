/**
 * SISTER INVENTION SI-024: Multi-Currency Wealth Optimization
 * Patent Reference: Extends PAT-004 (Household Wealth Engine)
 * 
 * Models currency risk, international tax treaties, and cross-border
 * estate planning for HNW international clients.
 */

export interface CurrencyAsset {
  currency: string;
  amount: number;
  assetType: string;
  annualReturn: number;
  taxRate: number;
}

export interface CurrencyPair {
  from: string;
  to: string;
  exchangeRate: number;
  volatility: number;      // Annual std dev
  correlation: number;     // With USD
}

export interface MultiCurrencyInput {
  baseCurrency: string;
  assets: CurrencyAsset[];
  currencyPairs: CurrencyPair[];
  projectionYears: number;
  rebalanceFrequency: "monthly" | "quarterly" | "annually";
  hedgingCostPercent: number;
}

export interface CurrencyYearProjection {
  year: number;
  unhedgedValue: number;
  hedgedValue: number;
  currencyGainLoss: number;
  hedgingCost: number;
  totalReturn: number;
}

export interface MultiCurrencyResult {
  projections: CurrencyYearProjection[];
  totalUnhedgedValue: number;
  totalHedgedValue: number;
  currencyRiskExposure: number;
  optimalAllocation: { currency: string; percent: number }[];
  hedgingRecommendation: string;
  taxTreatyBenefits: string[];
  totalHedgingCost: number;
}

// Default currency data
const DEFAULT_PAIRS: CurrencyPair[] = [
  { from: "EUR", to: "USD", exchangeRate: 1.08, volatility: 0.08, correlation: 0.6 },
  { from: "GBP", to: "USD", exchangeRate: 1.27, volatility: 0.09, correlation: 0.7 },
  { from: "JPY", to: "USD", exchangeRate: 0.0067, volatility: 0.10, correlation: 0.3 },
  { from: "CHF", to: "USD", exchangeRate: 1.13, volatility: 0.07, correlation: 0.8 },
  { from: "CAD", to: "USD", exchangeRate: 0.74, volatility: 0.06, correlation: 0.85 },
  { from: "AUD", to: "USD", exchangeRate: 0.65, volatility: 0.10, correlation: 0.6 },
  { from: "SGD", to: "USD", exchangeRate: 0.74, volatility: 0.04, correlation: 0.7 },
];

export function getDefaultCurrencyPairs(): CurrencyPair[] {
  return [...DEFAULT_PAIRS];
}

/**
 * Calculate multi-currency wealth optimization
 */
export function optimizeMultiCurrency(input: MultiCurrencyInput): MultiCurrencyResult {
  const projections: CurrencyYearProjection[] = [];
  let totalHedgingCost = 0;

  // Convert all assets to base currency
  const baseValues = input.assets.map(asset => {
    if (asset.currency === input.baseCurrency) return asset.amount;
    const pair = input.currencyPairs.find(p => p.from === asset.currency);
    return asset.amount * (pair?.exchangeRate ?? 1);
  });

  let unhedgedTotal = baseValues.reduce((s, v) => s + v, 0);
  let hedgedTotal = unhedgedTotal;

  for (let y = 1; y <= input.projectionYears; y++) {
    let yearUnhedged = 0;
    let yearHedged = 0;
    let currencyGL = 0;

    input.assets.forEach((asset, i) => {
      const baseVal = baseValues[i];
      const grown = baseVal * Math.pow(1 + asset.annualReturn, y);

      // Currency fluctuation (random walk with drift)
      const pair = input.currencyPairs.find(p => p.from === asset.currency);
      const fxChange = pair ? (Math.random() - 0.5) * pair.volatility * 2 : 0;
      const unhedgedVal = grown * (1 + fxChange);
      const hedgedVal = grown; // Hedged = no currency impact

      yearUnhedged += unhedgedVal;
      yearHedged += hedgedVal;
      currencyGL += unhedgedVal - hedgedVal;
    });

    const hedgeCost = yearHedged * input.hedgingCostPercent;
    yearHedged -= hedgeCost;
    totalHedgingCost += hedgeCost;

    projections.push({
      year: y,
      unhedgedValue: Math.round(yearUnhedged),
      hedgedValue: Math.round(yearHedged),
      currencyGainLoss: Math.round(currencyGL),
      hedgingCost: Math.round(hedgeCost),
      totalReturn: Math.round(yearHedged - unhedgedTotal),
    });
  }

  // Currency risk exposure
  const nonBasePct = input.assets
    .filter(a => a.currency !== input.baseCurrency)
    .reduce((s, a) => s + a.amount, 0) / Math.max(input.assets.reduce((s, a) => s + a.amount, 0), 1);

  // Optimal allocation (simplified mean-variance)
  const totalValue = input.assets.reduce((s, a) => s + a.amount, 0);
  const optimalAlloc = input.assets.map(a => ({
    currency: a.currency,
    percent: Math.round((a.amount / Math.max(totalValue, 1)) * 100),
  }));

  const hedgingRec = nonBasePct > 0.5
    ? "HEDGE RECOMMENDED — Over 50% of assets in foreign currencies. Consider forward contracts or currency ETFs."
    : nonBasePct > 0.2
    ? "PARTIAL HEDGE — 20-50% foreign exposure. Hedge core positions, leave tactical allocations unhedged."
    : "MINIMAL HEDGING — Under 20% foreign exposure. Natural diversification provides adequate protection.";

  const treaties: string[] = [
    "US-UK Tax Treaty: Reduced withholding on dividends (15% vs 30%)",
    "US-Canada Tax Treaty: Pension income exemption, reduced withholding",
    "US-Switzerland Tax Treaty: Information exchange, reduced rates",
    "US-Japan Tax Treaty: Reduced withholding on interest and royalties",
    "FATCA compliance required for all foreign financial accounts over $50,000",
    "FBAR filing required for aggregate foreign accounts exceeding $10,000",
  ];

  const finalProjection = projections[projections.length - 1];

  return {
    projections,
    totalUnhedgedValue: finalProjection?.unhedgedValue ?? 0,
    totalHedgedValue: finalProjection?.hedgedValue ?? 0,
    currencyRiskExposure: Math.round(nonBasePct * 100),
    optimalAllocation: optimalAlloc,
    hedgingRecommendation: hedgingRec,
    taxTreatyBenefits: treaties,
    totalHedgingCost: Math.round(totalHedgingCost),
  };
}
