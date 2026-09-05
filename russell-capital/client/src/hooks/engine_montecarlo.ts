// Interfaces for parameters and results

export interface AssetParams {
  initialPrice: number; // Initial asset price
  drift: number; // Annual drift (e.g., 0.07 for stocks in 2024)
  volatility: number; // Annual volatility (e.g., 0.15 for stocks)
}

export interface SimulationParams {
  initialPortfolio: number; // Starting portfolio value, e.g., $1,000,000
  assets: AssetParams[]; // Array of assets
  correlationMatrix: number[][]; // Correlation matrix for assets
  years: number; // Number of years to simulate, e.g., 30
  inflationRate: number; // Annual inflation rate, e.g., 0.025 (2.5% in 2024)
  withdrawalSchedule: number[]; // Annual withdrawals, adjusted for inflation
  contributionSchedule: number[]; // Annual contributions, adjusted for inflation
  numTrials: number; // Number of Monte Carlo trials, e.g., 10000
  safeWithdrawalRateParams: { initialRate: number; maxRate: number; step: number }; // For SWR calc
  sensitivityParams: { paramToVary: string; varyValues: number[] }; // For sensitivity analysis
}

export interface SimulationResult {
  finalPortfolioValues: number[]; // Array of final portfolio values per trial
  probabilityOfRuin: number; // Probability portfolio reaches zero
  percentileBands: { p5: number; p10: number; p25: number; p50: number; p75: number; p90: number; p95: number };
  sequenceReturnsRisk: number[]; // Volatility of returns sequence impact
  safeWithdrawalRates: { rate: number; failureRate: number }[]; // Array of rates and failures
  sensitivityOutcomes: { [key: string]: number[] }; // Outcomes for varied parameters
}

// Helper: Box-Muller transform for normal random variables
export function boxMuller(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0;  // Standard normal (mean 0, std dev 1)
}

// Helper: Generate correlated normals using Cholesky decomposition
export function generateCorrelatedNormals(mean: number[], covariance: number[][], correlationMatrix: number[][]): number[] {
  const n = mean.length;
  const L: number[][] = choleskyDecomposition(correlationMatrix);  // Assume covariance derived from correlation
  const independents: number[] = Array(n).fill(0).map(() => mean[0] + boxMuller() * Math.sqrt(covariance[0][0]));  // For 2024, use realistic std dev

  const correlated: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    correlated[i] = mean[i];
    for (let j = 0; j <= i; j++) {
      correlated[i] += L[i][j] * independents[j];
    }
  }
  return correlated;
}

// Cholesky decomposition function
export function choleskyDecomposition(A: number[][]): number[][] {
  const n = A.length;
  const L: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        L[i][j] = Math.sqrt(A[i][i] - sum);
      } else {
        L[i][j] = (1.0 / L[j][j] * (A[i][j] - sum));
      }
    }
  }
  return L;
}

// Geometric Brownian Motion simulation for a single asset
export function simulateGBM(initialPrice: number, drift: number, volatility: number, years: number, stepsPerYear: number = 12): number[] {
  const dt = 1.0 / stepsPerYear;  // For 2024, use monthly steps
  const paths: number[][] = Array(1).fill(0).map(() => Array(years * stepsPerYear).fill(0));
  paths[0][0] = initialPrice;  // Initial price

  for (let t = 1; t < years * stepsPerYear; t++) {
    const z = boxMuller();  // Normal random variable
    paths[0][t] = paths[0][t-1] * Math.exp((drift - 0.5 * volatility ** 2) * dt + volatility * Math.sqrt(dt) * z);
  }
  return paths[0];  // Return the price path
}

// Multi-asset simulation with correlations
export function simulateMultiAsset(assets: AssetParams[], correlationMatrix: number[][], years: number): number[][][] {
  const numAssets = assets.length;
  const covariance: number[][] = Array(numAssets).fill(0).map(() => Array(numAssets).fill(0));
  
  // Build covariance matrix using 2024 estimates (e.g., volatilities and correlations)
  for (let i = 0; i < numAssets; i++) {
    for (let j = 0; j < numAssets; j++) {
      covariance[i][j] = assets[i].volatility * assets[j].volatility * correlationMatrix[i][j];
    }
  }

  const trials: number[][][] = Array(1).fill(0).map(() => Array(years).fill(0).map(() => Array(numAssets).fill(0)));
  
  for (let year = 0; year < years; year++) {
    const means: number[] = assets.map(asset => asset.drift);  // Annual drifts
    const correlatedReturns = generateCorrelatedNormals(means, covariance, correlationMatrix);
    for (let assetIdx = 0; assetIdx < numAssets; assetIdx++) {
      trials[0][year][assetIdx] = correlatedReturns[assetIdx];  // Simulated return for year
    }
  }
  return trials;  // 1 trial of asset returns over years
}

// Adjust for inflation
export function adjustForInflation(value: number, years: number, inflationRate: number): number {
  return value * Math.pow(1 + inflationRate, years);  // Compound inflation
}

// Apply contributions and withdrawals with schedules
export function applyCashFlows(portfolio: number[], contributions: number[], withdrawals: number[], inflationRate: number): number[] {
  const adjustedPortfolio: number[] = portfolio.slice();  // Copy
  for (let year = 0; year < adjustedPortfolio.length; year++) {
    adjustedPortfolio[year] += adjustForInflation(contributions[year], year, inflationRate);
    adjustedPortfolio[year] -= adjustForInflation(withdrawals[year], year, inflationRate);
  }
  return adjustedPortfolio;
}

// Full portfolio simulation over trials
export function runPortfolioSimulation(params: SimulationParams): number[] {
  const { initialPortfolio, assets, correlationMatrix, years, inflationRate, withdrawalSchedule, contributionSchedule } = params;
  const trials: number[] = Array(params.numTrials).fill(0).map(() => initialPortfolio);
  
  for (let trial = 0; trial < params.numTrials; trial++) {
    let portfolioValue = initialPortfolio;
    const assetSimulations = simulateMultiAsset(assets, correlationMatrix, years);
    
    for (let year = 0; year < years; year++) {
      let yearlyReturn = 0;
      for (let assetIdx = 0; assetIdx < assets.length; assetIdx++) {
        yearlyReturn += assetSimulations[trial][year][assetIdx] * (initialPortfolio / assets.length);  // Simple allocation
      }
      portfolioValue *= (1 + yearlyReturn);  // Apply return
      portfolioValue += contributionSchedule[year];  // Add contribution
      portfolioValue -= withdrawalSchedule[year];  // Subtract withdrawal
      if (portfolioValue < 0) portfolioValue = 0;  // Ruin
    }
    trials[trial] = portfolioValue;  // Final value after adjustments
  }
  return trials;  // Array of final values per trial
}

// Calculate probability of ruin
export function calculateProbabilityOfRuin(finalValues: number[]): number {
  const ruinedTrials = finalValues.filter(value => value <= 0).length;
  return ruinedTrials / finalValues.length;  // Fraction ruined
}

// Calculate percentile bands
export function calculatePercentiles(finalValues: number[]): { p5: number; p10: number; p25: number; p50: number; p75: number; p90: number; p95: number } {
  const sorted = [...finalValues].sort((a, b) => a - b);
  return {
    p5: sorted[Math.floor(0.05 * sorted.length)],
    p10: sorted[Math.floor(0.10 * sorted.length)],
    p25: sorted[Math.floor(0.25 * sorted.length)],
    p50: sorted[Math.floor(0.50 * sorted.length)],
    p75: sorted[Math.floor(0.75 * sorted.length)],
    p90: sorted[Math.floor(0.90 * sorted.length)],
    p95: sorted[Math.floor(0.95 * sorted.length)],
  };
}

// Sequence of returns risk analysis (simulate return volatility impact)
export function analyzeSequenceOfReturns(finalValues: number[], initialPortfolio: number = 1000000, years: number = 30): number[] {
  const yearlyReturns: number[] = [];  // Extract from simulations, simplified
  for (let i = 0; i < finalValues.length; i++) {
    yearlyReturns.push((finalValues[i] / initialPortfolio) / years - 1);  // Approx annual return
  }
  const stdDev = mathStdDev(yearlyReturns);  // Custom std dev calc
  return [stdDev * 100];  // Return as percentage array for risk
}

function mathStdDev(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.map(x => (x - mean) ** 2).reduce((a, b) => a + b) / arr.length);
}

// Safe withdrawal rate calculator using historical failure rates (based on 2024 S&P 500 data)
export function calculateSafeWithdrawalRates(params: SimulationParams): { rate: number; failureRate: number }[] {
  const results: { rate: number; failureRate: number }[] = [];
  const { safeWithdrawalRateParams, years, numTrials } = params;
  const initialRate = safeWithdrawalRateParams.initialRate;  // e.g., 0.03
  const maxRate = safeWithdrawalRateParams.maxRate;  // e.g., 0.07
  const step = safeWithdrawalRateParams.step;  // e.g., 0.005
  
  for (let rate = initialRate; rate <= maxRate; rate += step) {
    const withdrawalScheduleAdjusted = params.withdrawalSchedule.map(w => w * rate * params.initialPortfolio);
    const simParamsCopy = { ...params, withdrawalSchedule: withdrawalScheduleAdjusted };
    const finalValues = runPortfolioSimulation(simParamsCopy);
    const failureRate = calculateProbabilityOfRuin(finalValues);
    results.push({ rate, failureRate });
  }
  return results;  // Array of rates and their failure rates
}

// Sensitivity analysis: Vary one parameter and return outcomes
export function performSensitivityAnalysis(baseParams: SimulationParams): { [key: string]: number[] } {
  const outcomes: { [key: string]: number[] } = {};
  const { sensitivityParams } = baseParams;
  const paramToVary = sensitivityParams.paramToVary;  // e.g., "inflationRate"
  const varyValues = sensitivityParams.varyValues;  // e.g., [0.02, 0.03, 0.04]
  
  for (const value of varyValues) {
    const variedParams = { ...baseParams };
    if (paramToVary === "inflationRate") variedParams.inflationRate = value;
    else if (paramToVary === "initialPortfolio") variedParams.initialPortfolio = value;
    // Add more as needed
    const finalValues = runPortfolioSimulation(variedParams);
    outcomes[value] = finalValues;  // Store array of final values for this variation
  }
  return outcomes;
}

// Convenience function to run full simulation
export function runFullSimulation(params: SimulationParams): SimulationResult {
  const finalValues = runPortfolioSimulation(params);
  const probabilityOfRuin = calculateProbabilityOfRuin(finalValues);
  const percentileBands = calculatePercentiles(finalValues);
  const sequenceReturnsRisk = analyzeSequenceOfReturns(finalValues);
  const safeWithdrawalRates = calculateSafeWithdrawalRates(params);
  const sensitivityOutcomes = performSensitivityAnalysis(params);
  
  return {
    finalPortfolioValues: finalValues,
    probabilityOfRuin,
    percentileBands,
    sequenceReturnsRisk,
    safeWithdrawalRates,
    sensitivityOutcomes,
  };
}