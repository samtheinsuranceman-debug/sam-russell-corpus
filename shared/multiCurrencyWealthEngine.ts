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
  /**
   * ASSUMPTION, set by the visitor: the yearly drift of this currency against the base
   * (0.01 = the foreign currency gains 1 % a year). Overrides the input-level
   * assumedFxDriftPerYear for this pair. Not a forecast.
   */
  assumedDriftPerYear?: number;
}

export interface MultiCurrencyInput {
  baseCurrency: string;
  assets: CurrencyAsset[];
  currencyPairs: CurrencyPair[];
  projectionYears: number;
  rebalanceFrequency: "monthly" | "quarterly" | "annually";
  hedgingCostPercent: number;
  /**
   * ASSUMPTION, set by the visitor: the yearly drift of every foreign currency against the
   * base currency, as a decimal (-0.02 = foreign currencies lose 2 % a year). Default 0:
   * no direction is forecast. It drives the currency gain/loss and so the hedged vs
   * unhedged comparison. Deterministic: the same inputs always give the same figures.
   */
  assumedFxDriftPerYear?: number;
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
  /** The FX drift used, stated as the assumption it is. */
  fxAssumption: { driftPerYear: number; perPair: Record<string, number>; label: string };
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
  // Clamp to a sane band so a typo (e.g. 5 for 5 %) cannot compound into nonsense.
  const clampDrift = (v: unknown) => { const n = Number(v ?? 0); return Number.isFinite(n) ? Math.max(-0.5, Math.min(0.5, n)) : 0; };
  const defaultDrift = clampDrift(input.assumedFxDriftPerYear);
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

      // Currency movement: the visitor's assumed drift, compounded. Deterministic — never a
      // random draw that changes on every call. Base-currency assets have no FX movement.
      const pair = asset.currency === input.baseCurrency ? undefined : input.currencyPairs.find(p => p.from === asset.currency);
      const drift = asset.currency === input.baseCurrency ? 0 : (pair?.assumedDriftPerYear != null ? clampDrift(pair.assumedDriftPerYear) : defaultDrift);
      const fxChange = Math.pow(1 + drift, y) - 1;
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
    fxAssumption: {
      driftPerYear: defaultDrift,
      perPair: Object.fromEntries(input.currencyPairs.filter(p => p.assumedDriftPerYear != null).map(p => [p.from, clampDrift(p.assumedDriftPerYear)])),
      label: defaultDrift === 0 && input.currencyPairs.every(p => p.assumedDriftPerYear == null)
        ? "Assumption: exchange rates held flat (0 % drift a year). No currency direction is forecast; set assumedFxDriftPerYear to test one."
        : `Assumption: foreign currencies drift ${(defaultDrift * 100).toFixed(2)} % a year against ${input.baseCurrency}${input.currencyPairs.some(p => p.assumedDriftPerYear != null) ? " (some pairs overridden)" : ""}. Set by you, not a forecast.`,
    },
  };
}
