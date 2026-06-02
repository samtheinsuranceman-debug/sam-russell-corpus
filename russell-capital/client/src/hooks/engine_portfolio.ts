// Portfolio Analytics Functions

// Calculates the Sharpe Ratio for a portfolio
// Formula: (Expected Portfolio Return - Risk-Free Rate) / Standard Deviation of Portfolio Return
// Using 2024 risk-free rate of approximately 4.5% (e.g., US Treasury yield)
export function calculateSharpeRatio(portfolioReturns: number[], riskFreeRate: number = 0.045): number {
    if (portfolioReturns.length === 0) return 0;
    const expectedReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
    const stdDev = calculateSampleStandardDeviation(portfolioReturns);
    return (expectedReturn - riskFreeRate) / stdDev;
}

// Calculates the Sortino Ratio, focusing on downside deviation
// Formula: (Expected Return - Risk-Free Rate) / Downside Deviation
export function calculateSortinoRatio(portfolioReturns: number[], riskFreeRate: number = 0.045, minimumReturn: number = 0): number {
    if (portfolioReturns.length === 0) return 0;
    const expectedReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
    const downsideReturns = portfolioReturns.filter(r => r < minimumReturn).map(r => Math.min(r - minimumReturn, 0));
    const downsideDeviation = Math.sqrt(downsideReturns.reduce((a, b) => a + b * b, 0) / downsideReturns.length);
    return (expectedReturn - riskFreeRate) / downsideDeviation;
}

// Calculates the Information Ratio relative to a benchmark
// Formula: (Portfolio Return - Benchmark Return) / Tracking Error
export function calculateInformationRatio(portfolioReturns: number[], benchmarkReturns: number[]): number {
    if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length === 0) return 0;
    const excessReturns = portfolioReturns.map((pr, i) => pr - benchmarkReturns[i]);
    const trackingError = calculateSampleStandardDeviation(excessReturns);
    const averageExcessReturn = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
    return averageExcessReturn / trackingError;
}

// Calculates the Treynor Ratio
// Formula: (Portfolio Return - Risk-Free Rate) / Beta
export function calculateTreynorRatio(portfolioReturns: number[], benchmarkReturns: number[], riskFreeRate: number = 0.045): number {
    const beta = calculateBeta(portfolioReturns, benchmarkReturns);
    const portfolioReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
    return (portfolioReturn - riskFreeRate) / beta;
}

// Calculates the Maximum Drawdown
// Formula: Maximum peak-to-trough decline
export function calculateMaximumDrawdown(portfolioValues: number[]): number {
    if (portfolioValues.length === 0) return 0;
    let maxDrawdown = 0;
    let peak = portfolioValues[0];
    for (let i = 1; i < portfolioValues.length; i++) {
        if (portfolioValues[i] > peak) peak = portfolioValues[i];
        const drawdown = (peak - portfolioValues[i]) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    return maxDrawdown;
}

// Calculates Beta relative to a benchmark
// Formula: Covariance(Portfolio Returns, Benchmark Returns) / Variance(Benchmark Returns)
export function calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
    if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) return 0;
    const covariance = calculateCovariance(portfolioReturns, benchmarkReturns);
    const benchmarkVariance = calculateSampleVariance(benchmarkReturns);
    return covariance / benchmarkVariance;
}

// Calculates Jensen's Alpha
// Formula: Portfolio Return - [Risk-Free Rate + Beta * (Benchmark Return - Risk-Free Rate)]
export function calculateAlpha(portfolioReturns: number[], benchmarkReturns: number[], riskFreeRate: number = 0.045): number {
    const portfolioReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
    const benchmarkReturn = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
    const beta = calculateBeta(portfolioReturns, benchmarkReturns);
    return portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
}

// Calculates R-squared
// Formula: 1 - (Sum of Squared Residuals / Total Sum of Squares)
export function calculateRSquared(portfolioReturns: number[], benchmarkReturns: number[]): number {
    if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) return 0;
    const beta = calculateBeta(portfolioReturns, benchmarkReturns);
    const alpha = calculateAlpha(portfolioReturns, benchmarkReturns);
    let ssReg = 0;
    let ssTot = 0;
    const benchmarkMean = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
    for (let i = 0; i < portfolioReturns.length; i++) {
        const predicted = alpha + beta * benchmarkReturns[i];
        ssReg += Math.pow(portfolioReturns[i] - predicted, 2);
        ssTot += Math.pow(portfolioReturns[i] - benchmarkMean, 2);
    }
    return 1 - (ssReg / ssTot);
}

// Calculates population standard deviation
export function calculatePopulationStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

// Calculates sample standard deviation
export function calculateSampleStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
}

// Computes the correlation matrix for a set of assets
export function computeCorrelationMatrix(returnsMatrix: number[][]): number[][] {
    const nAssets = returnsMatrix[0].length;
    const correlations: number[][] = Array(nAssets).fill(0).map(() => Array(nAssets).fill(0));
    for (let i = 0; i < nAssets; i++) {
        for (let j = i; j < nAssets; j++) {
            const cov = calculateCovariance(returnsMatrix.map(row => row[i]), returnsMatrix.map(row => row[j]));
            const stdDevI = calculateSampleStandardDeviation(returnsMatrix.map(row => row[i]));
            const stdDevJ = calculateSampleStandardDeviation(returnsMatrix.map(row => row[j]));
            correlations[i][j] = cov / (stdDevI * stdDevJ);
            correlations[j][i] = correlations[i][j];
        }
    }
    return correlations;
}

// Computes the covariance matrix
export function computeCovarianceMatrix(returnsMatrix: number[][]): number[][] {
    const nAssets = returnsMatrix[0].length;
    const covariances: number[][] = Array(nAssets).fill(0).map(() => Array(nAssets).fill(0));
    for (let i = 0; i < nAssets; i++) {
        for (let j = i; j < nAssets; j++) {
            covariances[i][j] = calculateCovariance(returnsMatrix.map(row => row[i]), returnsMatrix.map(row => row[j]));
            covariances[j][i] = covariances[i][j];
        }
    }
    return covariances;
}

// Helper function for sample variance
function calculateSampleVariance(series: number[]): number {
    if (series.length <= 1) return 0;
    const mean = series.reduce((a, b) => a + b, 0) / series.length;
    return series.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (series.length - 1);
}

// Helper function for covariance
function calculateCovariance(series1: number[], series2: number[]): number {
    if (series1.length !== series2.length || series1.length <= 1) return 0;
    const mean1 = series1.reduce((a, b) => a + b, 0) / series1.length;
    const mean2 = series2.reduce((a, b) => a + b, 0) / series2.length;
    let cov = 0;
    for (let i = 0; i < series1.length; i++) {
        cov += (series1[i] - mean1) * (series2[i] - mean2);
    }
    return cov / (series1.length - 1);  // Sample covariance
}

// Calculates a point on the Efficient Frontier using mean-variance optimization
export function calculateEfficientFrontierPoint(expectedReturns: number[], covarianceMatrix: number[][], targetReturn: number): number[] {
    const n = expectedReturns.length;
    const weights: number[] = Array(n).fill(0);
    // Simplified quadratic optimization (not full solver for brevity)
    const A = covarianceMatrix;
    const b = expectedReturns.map(er => er - targetReturn);
    // Use basic solver; in practice, use a library like numeric.js
    for (let i = 0; i < n; i++) weights[i] = 1 / n;  // Equal weighting as placeholder
    return weights;
}

// Calculates risk parity weights
export function calculateRiskParityWeights(covarianceMatrix: number[][]): number[] {
    const n = covarianceMatrix.length;
    const marginalContributions: number[] = Array(n).fill(0);
    const weights: number[] = Array(n).fill(1 / n);
    for (let i = 0; i < 100; i++) {  // Iterative adjustment
        const portfolioVariance = weights.reduce((a, b, i) => a + weights.reduce((c, d, j) => c + d * covarianceMatrix[i][j] * weights[j], 0), 0);
        for (let j = 0; j < n; j++) {
            marginalContributions[j] = 2 * weights.reduce((sum, w, k) => sum + w * covarianceMatrix[j][k] * weights[k]) / portfolioVariance;
        }
        const totalMC = marginalContributions.reduce((a, b) => a + b, 0);
        for (let j = 0; j < n; j++) weights[j] *= (1 / marginalContributions[j]) / (n / totalMC);
    }
    return weights;
}

// Calculates Black-Litterman expected returns
export function calculateBlackLittermanExpectedReturns(
    marketWeights: number[],
    marketReturns: number,
    covarianceMatrix: number[][],
    views: { assets: number[], return: number }[]
): number[] {
    const tau = 0.025;  // 2024 risk aversion parameter
    const P = views.map(v => v.assets);  // Views matrix
    const Q = views.map(v => v.return);
    // Simplified implementation; full BL requires matrix inversion
    return marketWeights.map((w, i) => marketReturns * w);  // Placeholder for brevity
}

// Calculates Parametric VaR
export function calculateParametricVaR(portfolioReturns: number[], confidenceLevel: number = 0.95): number {
    const meanReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
    const stdDev = calculateSampleStandardDeviation(portfolioReturns);
    const zScore = 1.645;  // For 95% confidence
    return meanReturn - zScore * stdDev;
}

// Calculates Historical VaR
export function calculateHistoricalVaR(portfolioReturns: number[], confidenceLevel: number = 0.95): number {
    const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
    const index = Math.ceil((1 - confidenceLevel) * sortedReturns.length) - 1;
    return sortedReturns[index];
}

// Financial Health Scoring Functions

// Scores emergency fund adequacy (0-100, target 3-6 months of expenses)
export function emergencyFundScore(monthsCovered: number): number {
    if (monthsCovered >= 6) return 100;
    if (monthsCovered >= 3) return 50 + (monthsCovered - 3) * 10;
    return monthsCovered * 10;
}

// Scores debt-to-income ratio (0-100, target <36%)
export function debtToIncomeRatioScore(dtiRatio: number): number {
    if (dtiRatio < 0.36) return 100;
    if (dtiRatio < 0.43) return 100 - (dtiRatio - 0.36) * 500;  // Scaled
    return 0;
}

// Scores savings rate (0-100, target 15-20%)
export function savingsRateScore(savingsRate: number): number {
    if (savingsRate >= 0.20) return 100;
    if (savingsRate >= 0.15) return 50 + (savingsRate - 0.15) * 500;
    return savingsRate * 500;
}

// Scores insurance coverage adequacy (0-100, based on coverage ratio)
export function insuranceCoverageScore(coverageRatio: number): number {
    return Math.min(coverageRatio * 100, 100);
}

// Scores retirement preparedness (0-100, based on on-track percentage)
export function retirementPreparednessScore(onTrackPercentage: number): number {
    return Math.min(onTrackPercentage * 100, 100);
}

// Scores tax efficiency (0-100, based on effective vs optimal rate difference)
export function taxEfficiencyScore(effectiveRate: number, optimalRate: number = 0.15): number {
    const difference = effectiveRate - optimalRate;
    if (difference <= 0) return 100;
    return Math.max(100 - difference * 1000, 0);  // 2024 assumption
}

// Scores estate planning completeness (0-100, based on documents percentage)
export function estatePlanningScore(completionPercentage: number): number {
    return completionPercentage * 100;
}

// Scores investment diversification using Herfindahl-Hirschman Index (0-100)
export function investmentDiversificationScore(weights: number[]): number {
    const hhi = weights.map(w => Math.pow(w, 2)).reduce((a, b) => a + b, 0);
    const score = 100 * (1 - hhi);  // Inverted for scoring
    return Math.min(Math.max(score, 0), 100);
}

// Calculates overall weighted financial health score and letter grade
export function overallFinancialHealthScore(scores: number[], weights: number[] = Array(8).fill(1/8)): string {
    const weightedScore = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
    const overallScore = weightedScore / scores.length;
    let grade: string;
    if (overallScore >= 90) grade = 'A+';
    else if (overallScore >= 80) grade = 'A';
    else if (overallScore >= 70) grade = 'B';
    else if (overallScore >= 60) grade = 'C';
    else if (overallScore >= 50) grade = 'D';
    else grade = 'F';
    return `${overallScore.toFixed(2)} - ${grade}`;
}

// Analyzes trend (improving/declining/stable based on score change)
export function trendAnalysis(previousScore: number, currentScore: number): string {
    if (currentScore > previousScore) return 'Improving';
    if (currentScore < previousScore) return 'Declining';
    return 'Stable';
}

// Calculates peer comparison percentile
export function peerComparisonPercentile(score: number, peerScores: number[]): number {
    let count = 0;
    for (const peerScore of peerScores) {
        if (score > peerScore) count++;
    }
    return (count / peerScores.length) * 100;
}

// Time Value of Money Functions

// Calculates Net Present Value
export function calculateNPV(cashFlows: number[], discountRate: number): number {
    return cashFlows.slice(1).reduce((npv, cf, i) => npv + cf / Math.pow(1 + discountRate, i + 1), cashFlows[0]);
}

// Calculates IRR using Newton's method
export function calculateIRR(cashFlows: number[], initialGuess: number = 0.1): number {
    const f = (r: number) => cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + r, i), 0);
    const fPrime = (r: number) => cashFlows.slice(1).reduce((sum, cf, i) => sum + -i * cf / Math.pow(1 + r, i + 1), 0);
    let guess = initialGuess;
    for (let i = 0; i < 100; i++) {
        guess -= f(guess) / fPrime(guess);
    }
    return guess;
}

// Calculates XIRR for irregular cash flows
export function calculateXIRR(cashFlows: { amount: number, date: Date }[], guess: number = 0.1): number {
    const dates = cashFlows.map(cf => cf.date.getTime());
    const baseDate = dates[0];
    const days = dates.map(d => (d - baseDate) / (1000 * 60 * 60 * 24));
    const f = (r: number) => cashFlows.reduce((sum, cf, i) => sum + cf.amount / Math.pow(1 + r, days[i] / 365), 0);
    const fPrime = (r: number) => cashFlows.reduce((sum, cf, i) => sum + cf.amount * (-days[i] / 365) / Math.pow(1 + r, days[i] / 365 + 1), 0);
    let rate = guess;
    for (let i = 0; i < 100; i++) {
        rate -= f(rate) / fPrime(rate);
    }
    return rate;
}

// Calculates Present Value of Ordinary Annuity
export function presentValueOfAnnuity(payment: number, rate: number, periods: number): number {
    return payment * ((1 - Math.pow(1 + rate, -periods)) / rate);
}

// Calculates Present Value of Annuity Due
export function presentValueOfAnnuityDue(payment: number, rate: number, periods: number): number {
    return presentValueOfAnnuity(payment, rate, periods) * (1 + rate);
}

// Calculates Future Value with variable rates
export function futureValueVariableRates(initialAmount: number, cashFlows: number[], rates: number[]): number {
    let fv = initialAmount;
    for (let i = 0; i < cashFlows.length; i++) {
        fv = (fv + cashFlows[i]) * (1 + rates[i]);
    }
    return fv;
}

// Generates loan amortization schedule
export function loanAmortizationSchedule(principal: number, annualRate: number, periods: number, paymentsPerYear: number = 12): { period: number, payment: number, interest: number, principalPaid: number, balance: number }[] {
    const monthlyRate = annualRate / paymentsPerYear;
    const monthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -periods));
    const schedule: { period: number, payment: number, interest: number, principalPaid: number, balance: number }[] = [];
    let balance = principal;
    for (let i = 1; i <= periods; i++) {
        const interest = balance * monthlyRate;
        const principalPaid = monthlyPayment - interest;
        balance -= principalPaid;
        schedule.push({ period: i, payment: monthlyPayment, interest, principalPaid, balance });
    }
    return schedule;
}

// Prices a bond
export function bondPrice(couponRate: number, parValue: number, years: number, yieldRate: number, couponsPerYear: number = 2): number {
    const couponPayment = (couponRate * parValue) / couponsPerYear;
    let price = 0;
    for (let i = 1; i <= years * couponsPerYear; i++) {
        price += couponPayment / Math.pow(1 + yieldRate / couponsPerYear, i);
    }
    price += parValue / Math.pow(1 + yieldRate / couponsPerYear, years * couponsPerYear);
    return price;
}

// Calculates Yield to Maturity using bisection method
export function calculateYTM(price: number, couponRate: number, parValue: number, years: number, couponsPerYear: number = 2): number {
    let low = 0;
    let high = 1;
    const tolerance = 0.0001;
    while (high - low > tolerance) {
        const mid = (low + high) / 2;
        if (bondPrice(couponRate, parValue, years, mid, couponsPerYear) > price) low = mid;
        else high = mid;
    }
    return (low + high) / 2;
}

// Calculates Macaulay Duration
export function calculateDuration(price: number, cashFlows: number[], times: number[], ytm: number): number {
    let numerator = 0;
    let denominator = price;
    for (let i = 0; i < cashFlows.length; i++) {
        numerator += times[i] * cashFlows[i] / Math.pow(1 + ytm, times[i]);
    }
    return numerator / price;
}

// Calculates Modified Duration
export function calculateModifiedDuration(duration: number, ytm: number): number {
    return duration / (1 + ytm);
}

// Calculates Convexity
export function calculateConvexity(price: number, cashFlows: number[], times: number[], ytm: number): number {
    let numerator = 0;
    for (let i = 0; i < cashFlows.length; i++) {
        numerator += times[i] * (times[i] + 1) * cashFlows[i] / Math.pow(1 + ytm, times[i] + 2);
    }
    const denominator = price * Math.pow(1 + ytm, 2);
    return numerator / denominator;
}