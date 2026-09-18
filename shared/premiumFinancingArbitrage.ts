/**
 * SISTER INVENTION SI-004: Premium Financing Arbitrage Calculator
 * Patent Reference: Extends PAT-005 (Premium Financing Optimization)
 * 
 * Models leveraged IUL strategies using bank financing with dynamic
 * interest rate scenarios. Calculates arbitrage spread between
 * IUL credited rate and financing cost across multiple rate environments.
 */

export interface ArbitrageScenario {
  name: string;
  loanRate: number;       // Bank financing rate
  iulCreditRate: number;  // IUL credited rate
  spread: number;         // Arbitrage spread
}

export interface ArbitrageInput {
  premiumAmount: number;
  premiumYears: number;
  issueAge: number;
  projectionYears: number;
  collateralPercent: number;  // e.g. 0.20
  scenarios: ArbitrageScenario[];
  inflationRate: number;      // For real-return calculation
  taxBracket: number;         // For after-tax comparison
}

export interface ArbitrageYearResult {
  year: number;
  age: number;
  loanBalance: number;
  loanInterestCost: number;
  policyCashValue: number;
  netArbitrageValue: number;
  cumulativeArbitrage: number;
  roi: number;
  loanToValue: number;
}

export interface ArbitrageScenarioResult {
  scenario: ArbitrageScenario;
  years: ArbitrageYearResult[];
  breakEvenYear: number | null;
  totalArbitrageGain: number;
  peakLoanToValue: number;
  irr: number;
  npvAt5Pct: number;
  riskScore: number;       // 1-100 (higher = riskier)
  recommendation: string;
}

export interface ArbitrageResult {
  scenarios: ArbitrageScenarioResult[];
  optimalScenario: string;
  collateralRequired: number;
  totalPremiumDeployed: number;
  maxArbitrageGain: number;
  riskAdjustedReturn: number;
}

const RATE_ENVIRONMENTS: ArbitrageScenario[] = [
  { name: "Bull Market", loanRate: 0.055, iulCreditRate: 0.095, spread: 0.040 },
  { name: "Normal Market", loanRate: 0.065, iulCreditRate: 0.075, spread: 0.010 },
  { name: "Bear Market", loanRate: 0.075, iulCreditRate: 0.020, spread: -0.055 },
  { name: "Rising Rates", loanRate: 0.085, iulCreditRate: 0.065, spread: -0.020 },
  { name: "Low Rate Era", loanRate: 0.040, iulCreditRate: 0.080, spread: 0.040 },
];

export function getDefaultArbitrageScenarios(): ArbitrageScenario[] {
  return [...RATE_ENVIRONMENTS];
}

/**
 * Calculate premium financing arbitrage across multiple rate scenarios
 */
export function calculateArbitrage(input: ArbitrageInput): ArbitrageResult {
  const scenarios = input.scenarios.length > 0 ? input.scenarios : RATE_ENVIRONMENTS;
  const totalPremium = input.premiumAmount * input.premiumYears;
  const collateralRequired = totalPremium * input.collateralPercent;

  const scenarioResults: ArbitrageScenarioResult[] = scenarios.map(scenario => {
    const years: ArbitrageYearResult[] = [];
    let loanBalance = 0;
    let policyCashValue = 0;
    let cumulativeArbitrage = 0;
    let peakLtv = 0;
    let breakEvenYear: number | null = null;

    for (let y = 1; y <= input.projectionYears; y++) {
      const age = input.issueAge + y;
      // Add premium to loan in premium years
      if (y <= input.premiumYears) {
        loanBalance += input.premiumAmount;
        policyCashValue += input.premiumAmount * 0.85; // ~85% goes to cash value after COI
      }

      // Interest accrues on loan
      const loanInterest = loanBalance * scenario.loanRate;
      loanBalance += loanInterest;

      // IUL credits on cash value (floor at 0% for most IUL)
      const creditRate = Math.max(0, scenario.iulCreditRate + (Math.random() - 0.5) * 0.02);
      policyCashValue *= (1 + creditRate);

      // COI deduction (increases with age)
      const coiRate = 0.003 + (age - input.issueAge) * 0.0002;
      policyCashValue *= (1 - coiRate);

      const netArbitrage = policyCashValue - loanBalance;
      cumulativeArbitrage = netArbitrage;
      const ltv = loanBalance / Math.max(policyCashValue, 1);
      peakLtv = Math.max(peakLtv, ltv);

      if (breakEvenYear === null && netArbitrage > 0 && y > input.premiumYears) {
        breakEvenYear = y;
      }

      years.push({
        year: y,
        age,
        loanBalance: Math.round(loanBalance),
        loanInterestCost: Math.round(loanInterest),
        policyCashValue: Math.round(policyCashValue),
        netArbitrageValue: Math.round(netArbitrage),
        cumulativeArbitrage: Math.round(cumulativeArbitrage),
        roi: totalPremium > 0 ? (netArbitrage / totalPremium) * 100 : 0,
        loanToValue: ltv,
      });
    }

    const finalYear = years[years.length - 1];
    const totalArbitrage = finalYear?.netArbitrageValue ?? 0;

    // Simple IRR approximation
    const irr = totalPremium > 0
      ? Math.pow(Math.max(1, (finalYear?.policyCashValue ?? 0)) / totalPremium, 1 / input.projectionYears) - 1
      : 0;

    // NPV at 5%
    let npv = 0;
    years.forEach(yr => {
      npv += yr.netArbitrageValue / Math.pow(1.05, yr.year);
    });

    // Risk score: higher spread volatility + higher LTV = higher risk
    const riskScore = Math.min(100, Math.round(
      peakLtv * 40 +
      Math.abs(scenario.spread) * 200 +
      (scenario.loanRate > 0.07 ? 20 : 0)
    ));

    const recommendation = riskScore < 30
      ? "Strong opportunity — favorable arbitrage with manageable risk"
      : riskScore < 60
      ? "Moderate opportunity — positive spread but monitor LTV closely"
      : "High risk — negative or thin spread, consider alternative structures";

    return {
      scenario,
      years,
      breakEvenYear,
      totalArbitrageGain: totalArbitrage,
      peakLoanToValue: peakLtv,
      irr,
      npvAt5Pct: Math.round(npv),
      riskScore,
      recommendation,
    };
  });

  const optimal = scenarioResults.reduce((best, s) =>
    s.totalArbitrageGain > best.totalArbitrageGain ? s : best
  );

  const maxGain = Math.max(...scenarioResults.map(s => s.totalArbitrageGain));
  const avgRiskAdj = scenarioResults.reduce((sum, s) =>
    sum + (s.totalArbitrageGain * (1 - s.riskScore / 100)), 0
  ) / scenarioResults.length;

  return {
    scenarios: scenarioResults,
    optimalScenario: optimal.scenario.name,
    collateralRequired: Math.round(collateralRequired),
    totalPremiumDeployed: Math.round(totalPremium),
    maxArbitrageGain: Math.round(maxGain),
    riskAdjustedReturn: Math.round(avgRiskAdj),
  };
}
