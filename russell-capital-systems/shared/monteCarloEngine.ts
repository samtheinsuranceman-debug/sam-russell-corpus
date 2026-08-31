/**
 * Monte Carlo Simulation Engine
 *
 * Provides a reusable simulation framework for any projection tool.
 * Generates confidence bands (10th, 25th, 50th, 75th, 90th percentile)
 * across N simulations using configurable return distributions.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface MonteCarloConfig {
  /** Number of simulation runs (default: 1000) */
  simulations?: number;
  /** Number of projection years */
  years: number;
  /** Starting value */
  initialValue: number;
  /** Expected annual return (decimal, e.g. 0.07 for 7%) */
  expectedReturn: number;
  /** Annual standard deviation (decimal, e.g. 0.15 for 15%) */
  volatility: number;
  /** Annual contribution (positive = inflow, negative = withdrawal) */
  annualContribution?: number;
  /** Annual contribution growth rate (decimal) */
  contributionGrowthRate?: number;
  /** Floor return (for IUL-style products with 0% floor) */
  floorReturn?: number;
  /** Cap return (for IUL-style products with cap) */
  capReturn?: number;
  /** Annual fees/charges as decimal */
  annualFees?: number;
  /** Inflation rate for real-return calculations */
  inflationRate?: number;
}

export interface PercentileBand {
  year: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  mean: number;
}

export interface MonteCarloResult {
  /** Percentile bands for each year */
  bands: PercentileBand[];
  /** Summary statistics at final year */
  summary: {
    median: number;
    mean: number;
    best: number;
    worst: number;
    p10: number;
    p90: number;
    probabilityOfSuccess: number; // % of sims ending above 0
    probabilityAboveTarget: number; // % above initial value
  };
  /** Individual simulation paths (first 20 for visualization) */
  samplePaths: number[][];
  /** Configuration used */
  config: MonteCarloConfig;
}

// ── Seeded PRNG (Mulberry32) for reproducibility ─────────────────────────────

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller transform for normal distribution */
function normalRandom(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ── Core simulation ──────────────────────────────────────────────────────────

export function runMonteCarlo(config: MonteCarloConfig): MonteCarloResult {
  const {
    simulations = 1000,
    years,
    initialValue,
    expectedReturn,
    volatility,
    annualContribution = 0,
    contributionGrowthRate = 0,
    floorReturn,
    capReturn,
    annualFees = 0,
    inflationRate = 0,
  } = config;

  const rng = mulberry32(42); // Deterministic seed for reproducibility
  const allPaths: number[][] = [];

  // Run simulations
  for (let sim = 0; sim < simulations; sim++) {
    const path: number[] = [initialValue];
    let value = initialValue;
    let contribution = annualContribution;

    for (let y = 1; y <= years; y++) {
      // Generate random return using log-normal model
      const z = normalRandom(rng);
      let annualReturn = expectedReturn + volatility * z;

      // Apply floor and cap if specified (IUL-style)
      if (floorReturn !== undefined) annualReturn = Math.max(annualReturn, floorReturn);
      if (capReturn !== undefined) annualReturn = Math.min(annualReturn, capReturn);

      // Apply fees
      annualReturn -= annualFees;

      // Apply inflation adjustment for real returns
      const realReturn = inflationRate > 0 ? (1 + annualReturn) / (1 + inflationRate) - 1 : annualReturn;

      // Grow value
      value = value * (1 + realReturn) + contribution;
      value = Math.max(value, 0); // Can't go below zero

      // Grow contribution
      contribution *= 1 + contributionGrowthRate;

      path.push(Math.round(value));
    }

    allPaths.push(path);
  }

  // Calculate percentile bands for each year
  const bands: PercentileBand[] = [];
  for (let y = 0; y <= years; y++) {
    const values = allPaths.map((p) => p[y]).sort((a, b) => a - b);
    const n = values.length;
    bands.push({
      year: y,
      p10: values[Math.floor(n * 0.1)],
      p25: values[Math.floor(n * 0.25)],
      p50: values[Math.floor(n * 0.5)],
      p75: values[Math.floor(n * 0.75)],
      p90: values[Math.floor(n * 0.9)],
      mean: Math.round(values.reduce((a, b) => a + b, 0) / n),
    });
  }

  // Final year statistics
  const finalValues = allPaths.map((p) => p[years]).sort((a, b) => a - b);
  const n = finalValues.length;

  const summary = {
    median: finalValues[Math.floor(n * 0.5)],
    mean: Math.round(finalValues.reduce((a, b) => a + b, 0) / n),
    best: finalValues[n - 1],
    worst: finalValues[0],
    p10: finalValues[Math.floor(n * 0.1)],
    p90: finalValues[Math.floor(n * 0.9)],
    probabilityOfSuccess: Math.round((finalValues.filter((v) => v > 0).length / n) * 100),
    probabilityAboveTarget: Math.round((finalValues.filter((v) => v > initialValue).length / n) * 100),
  };

  // Return first 20 paths for visualization
  const samplePaths = allPaths.slice(0, 20);

  return { bands, summary, samplePaths, config };
}

// ── Preset configurations ────────────────────────────────────────────────────

export const MONTE_CARLO_PRESETS = {
  /** Conservative IUL with 0% floor, 8% cap */
  iulConservative: {
    expectedReturn: 0.065,
    volatility: 0.12,
    floorReturn: 0,
    capReturn: 0.08,
    annualFees: 0.01,
  },
  /** Moderate IUL with 0% floor, 12% cap */
  iulModerate: {
    expectedReturn: 0.075,
    volatility: 0.14,
    floorReturn: 0,
    capReturn: 0.12,
    annualFees: 0.01,
  },
  /** S&P 500 historical */
  sp500: {
    expectedReturn: 0.10,
    volatility: 0.16,
    annualFees: 0.001,
  },
  /** MYGA fixed rate (very low volatility) */
  mygaFixed: {
    expectedReturn: 0.055,
    volatility: 0.005,
    annualFees: 0,
  },
  /** Real estate appreciation */
  realEstate: {
    expectedReturn: 0.04,
    volatility: 0.08,
    annualFees: 0.01,
  },
  /** Balanced portfolio (60/40) */
  balanced: {
    expectedReturn: 0.07,
    volatility: 0.10,
    annualFees: 0.005,
  },
  /** Aggressive growth */
  aggressiveGrowth: {
    expectedReturn: 0.12,
    volatility: 0.22,
    annualFees: 0.008,
  },
  /** Retirement withdrawal (negative contribution) */
  retirementWithdrawal: {
    expectedReturn: 0.06,
    volatility: 0.10,
    annualFees: 0.005,
    inflationRate: 0.03,
  },
} as const;

// ── Scenario comparison helper ───────────────────────────────────────────────

export interface ScenarioComparison {
  name: string;
  result: MonteCarloResult;
}

export function compareScenarios(
  scenarios: Array<{ name: string; config: MonteCarloConfig }>
): ScenarioComparison[] {
  return scenarios.map((s) => ({
    name: s.name,
    result: runMonteCarlo(s.config),
  }));
}
