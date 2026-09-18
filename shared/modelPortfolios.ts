/**
 * Model Portfolio Presets for Index Backtester
 * Pre-built allocation templates that advisors can one-click load
 */

export interface ModelPortfolio {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'moderate' | 'moderate-high' | 'high' | 'very-high' | 'custom';
  riskScore: number; // 1-10
  /** Carrier-specific allocations: carrier -> optionId -> percentage */
  allocations: Record<string, Array<{ optionId: string; percentage: number }>>;
  /** Generic allocation strategy when carrier options don't match exactly */
  strategy: {
    fixedPct: number;
    cappedPct: number;
    uncappedPct: number;
    highGrowthPct: number;
  };
  targetReturn: string;
  suitableFor: string;
}

export const MODEL_PORTFOLIOS: ModelPortfolio[] = [
  {
    id: "conservative",
    name: "Conservative Shield",
    description: "Capital preservation with steady growth. Heavy fixed account allocation with capped S&P 500 exposure for downside protection.",
    riskLevel: "low",
    riskScore: 2,
    allocations: {
      nationwide: [
        { optionId: "nw-sp500-1yr-cap", percentage: 35 },
        { optionId: "nw-fixed", percentage: 50 },
        { optionId: "nw-multiindex-monthly", percentage: 15 },
      ],
      securian: [
        { optionId: "sec-sp500-1yr-cap", percentage: 35 },
        { optionId: "sec-fixed", percentage: 50 },
        { optionId: "sec-bia6-prism", percentage: 15 },
      ],
      symetra: [
        { optionId: "sym-sp500-1yr-cap", percentage: 40 },
        { optionId: "sym-fixed", percentage: 50 },
        { optionId: "sym-nasdaq-bonus", percentage: 10 },
      ],
    },
    strategy: { fixedPct: 50, cappedPct: 35, uncappedPct: 0, highGrowthPct: 15 },
    targetReturn: "4-6%",
    suitableFor: "Clients nearing retirement or with low risk tolerance who prioritize capital preservation over growth.",
  },
  {
    id: "balanced",
    name: "Balanced Growth",
    description: "Equal mix of growth and protection. Diversified across capped, uncapped, and fixed strategies for steady accumulation.",
    riskLevel: "moderate",
    riskScore: 5,
    allocations: {
      nationwide: [
        { optionId: "nw-sp500-1yr-cap", percentage: 30 },
        { optionId: "nw-sp500-5yr-par", percentage: 25 },
        { optionId: "nw-multiindex-monthly", percentage: 25 },
        { optionId: "nw-fixed", percentage: 20 },
      ],
      securian: [
        { optionId: "sec-sp500-1yr-cap", percentage: 30 },
        { optionId: "sec-sp500-5yr-par", percentage: 25 },
        { optionId: "sec-bia6-prism", percentage: 25 },
        { optionId: "sec-fixed", percentage: 20 },
      ],
      symetra: [
        { optionId: "sym-sp500-1yr-cap", percentage: 30 },
        { optionId: "sym-nasdaq-bonus", percentage: 30 },
        { optionId: "sym-sp500-par", percentage: 20 },
        { optionId: "sym-fixed", percentage: 20 },
      ],
    },
    strategy: { fixedPct: 20, cappedPct: 30, uncappedPct: 25, highGrowthPct: 25 },
    targetReturn: "6-8%",
    suitableFor: "Clients with 10-20 year time horizons seeking balanced growth with moderate downside protection.",
  },
  {
    id: "growth",
    name: "Growth Accelerator",
    description: "Tilted toward uncapped and high-participation strategies. Minimal fixed allocation for maximum long-term accumulation.",
    riskLevel: "moderate-high",
    riskScore: 7,
    allocations: {
      nationwide: [
        { optionId: "nw-sp500-5yr-par", percentage: 40 },
        { optionId: "nw-multiindex-monthly", percentage: 30 },
        { optionId: "nw-sp500-1yr-cap", percentage: 20 },
        { optionId: "nw-fixed", percentage: 10 },
      ],
      securian: [
        { optionId: "sec-sp500-5yr-par", percentage: 40 },
        { optionId: "sec-bia6-prism", percentage: 30 },
        { optionId: "sec-sp500-1yr-cap", percentage: 20 },
        { optionId: "sec-fixed", percentage: 10 },
      ],
      symetra: [
        { optionId: "sym-nasdaq-bonus", percentage: 40 },
        { optionId: "sym-sp500-par", percentage: 30 },
        { optionId: "sym-sp500-1yr-cap", percentage: 20 },
        { optionId: "sym-fixed", percentage: 10 },
      ],
    },
    strategy: { fixedPct: 10, cappedPct: 20, uncappedPct: 40, highGrowthPct: 30 },
    targetReturn: "8-10%",
    suitableFor: "Clients with 15+ year time horizons willing to accept more volatility for higher potential returns.",
  },
  {
    id: "aggressive-growth",
    name: "Aggressive Nasdaq Heavy",
    description: "Maximum growth allocation concentrated in Nasdaq-100 and uncapped strategies. No fixed account exposure.",
    riskLevel: "high",
    riskScore: 9,
    allocations: {
      nationwide: [
        { optionId: "nw-sp500-5yr-par", percentage: 50 },
        { optionId: "nw-multiindex-monthly", percentage: 35 },
        { optionId: "nw-sp500-1yr-cap", percentage: 15 },
      ],
      securian: [
        { optionId: "sec-sp500-5yr-par", percentage: 50 },
        { optionId: "sec-bia6-prism", percentage: 35 },
        { optionId: "sec-sp500-1yr-cap", percentage: 15 },
      ],
      symetra: [
        { optionId: "sym-nasdaq-bonus", percentage: 55 },
        { optionId: "sym-sp500-par", percentage: 30 },
        { optionId: "sym-sp500-1yr-cap", percentage: 15 },
      ],
    },
    strategy: { fixedPct: 0, cappedPct: 15, uncappedPct: 50, highGrowthPct: 35 },
    targetReturn: "10-12%",
    suitableFor: "Young clients with 20+ year horizons and high risk tolerance seeking maximum cash value accumulation.",
  },
  {
    id: "income-focus",
    name: "Income Focus",
    description: "Designed for policy loan income at retirement. Heavy fixed and capped allocation to maintain stable cash values for loan collateral.",
    riskLevel: "low",
    riskScore: 3,
    allocations: {
      nationwide: [
        { optionId: "nw-fixed", percentage: 40 },
        { optionId: "nw-sp500-1yr-cap", percentage: 40 },
        { optionId: "nw-multiindex-monthly", percentage: 20 },
      ],
      securian: [
        { optionId: "sec-fixed", percentage: 40 },
        { optionId: "sec-sp500-1yr-cap", percentage: 40 },
        { optionId: "sec-bia6-prism", percentage: 20 },
      ],
      symetra: [
        { optionId: "sym-fixed", percentage: 40 },
        { optionId: "sym-sp500-1yr-cap", percentage: 40 },
        { optionId: "sym-nasdaq-bonus", percentage: 20 },
      ],
    },
    strategy: { fixedPct: 40, cappedPct: 40, uncappedPct: 0, highGrowthPct: 20 },
    targetReturn: "5-7%",
    suitableFor: "Clients planning to use policy loans for retirement income who need stable, predictable cash value growth.",
  },
  {
    id: "sams-pick",
    name: "RCS Optimized Blend",
    description: "Proprietary allocation based on 30-year backtesting analysis. Optimized for the best risk-adjusted return across all rolling windows.",
    riskLevel: "moderate-high",
    riskScore: 6,
    allocations: {
      nationwide: [
        { optionId: "nw-sp500-5yr-par", percentage: 35 },
        { optionId: "nw-sp500-1yr-cap", percentage: 25 },
        { optionId: "nw-multiindex-monthly", percentage: 25 },
        { optionId: "nw-fixed", percentage: 15 },
      ],
      securian: [
        { optionId: "sec-bia6-prism", percentage: 35 },
        { optionId: "sec-sp500-1yr-cap", percentage: 25 },
        { optionId: "sec-sp500-5yr-par", percentage: 25 },
        { optionId: "sec-fixed", percentage: 15 },
      ],
      symetra: [
        { optionId: "sym-nasdaq-bonus", percentage: 35 },
        { optionId: "sym-sp500-1yr-cap", percentage: 25 },
        { optionId: "sym-sp500-par", percentage: 25 },
        { optionId: "sym-fixed", percentage: 15 },
      ],
    },
    strategy: { fixedPct: 15, cappedPct: 25, uncappedPct: 35, highGrowthPct: 25 },
    targetReturn: "7-9%",
    suitableFor: "The recommended allocation — backtested to deliver the best Sharpe ratio across 30 years of market data.",
  },
];

/**
 * Get allocations for a specific carrier from a model portfolio.
 * Falls back to a generic strategy-based allocation using available options.
 */
export function getPortfolioAllocations(
  portfolioId: string,
  carrier: string,
  availableOptions: Array<{ id: string; cap: number | null; participation: number; spread: number; floor: number }>,
): Array<{ optionId: string; percentage: number }> {
  const portfolio = MODEL_PORTFOLIOS.find(p => p.id === portfolioId);
  if (!portfolio) return [];

  // Try carrier-specific allocations first
  const carrierAllocs = portfolio.allocations[carrier];
  if (carrierAllocs) {
    // Verify all option IDs exist in available options
    const validAllocs = carrierAllocs.filter(a => availableOptions.some(o => o.id === a.optionId));
    if (validAllocs.length > 0) {
      // Normalize to 100% if some options were filtered out
      const total = validAllocs.reduce((s, a) => s + a.percentage, 0);
      if (total === 100) return validAllocs;
      return validAllocs.map(a => ({ ...a, percentage: Math.round(a.percentage * 100 / total) }));
    }
  }

  // Fallback: use strategy-based allocation with available options
  const fixed = availableOptions.find(o => o.participation === 0);
  const capped = availableOptions.filter(o => o.cap !== null && o.participation > 0 && o.spread === 0);
  const uncapped = availableOptions.filter(o => o.cap === null && o.participation > 0);
  const highGrowth = availableOptions.filter(o => (o.cap === null || (o.cap ?? 0) > 12) && o.participation > 0);

  const allocs: Array<{ optionId: string; percentage: number }> = [];
  const { fixedPct, cappedPct, uncappedPct, highGrowthPct } = portfolio.strategy;

  if (fixed && fixedPct > 0) allocs.push({ optionId: fixed.id, percentage: fixedPct });
  if (capped.length > 0 && cappedPct > 0) allocs.push({ optionId: capped[0].id, percentage: cappedPct });
  if (uncapped.length > 0 && uncappedPct > 0) allocs.push({ optionId: uncapped[0].id, percentage: uncappedPct });
  if (highGrowth.length > 0 && highGrowthPct > 0) {
    const target = highGrowth.find(o => !allocs.some(a => a.optionId === o.id)) ?? highGrowth[0];
    allocs.push({ optionId: target.id, percentage: highGrowthPct });
  }

  // Normalize
  const total = allocs.reduce((s, a) => s + a.percentage, 0);
  if (total > 0 && total !== 100) {
    return allocs.map(a => ({ ...a, percentage: Math.round(a.percentage * 100 / total) }));
  }
  return allocs;
}
