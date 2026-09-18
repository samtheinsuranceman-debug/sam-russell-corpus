/**
 * Carrier Recommendation Engine
 *
 * Scores carriers based on client profile (age, risk tolerance, premium budget)
 * to suggest the optimal IUL carrier from configured overrides + system defaults.
 *
 * Scoring dimensions:
 *  1. Growth potential (cap rate, avg return) — weighted higher for younger/aggressive clients
 *  2. Downside protection (floor rate) — weighted higher for older/conservative clients
 *  3. Cost efficiency (load fee, COI rate) — weighted higher for budget-constrained clients
 *  4. Loan flexibility (loan rate) — moderate weight for all profiles
 */

export interface CarrierRates {
  carrierId: string;
  carrierName: string;
  loadFee: number;   // decimal e.g. 0.06
  coiRate: number;    // decimal e.g. 0.05
  capRate: number;    // decimal e.g. 0.12
  floorRate: number;  // decimal e.g. 0.00
  avgReturn: number;  // decimal e.g. 0.10
  loanRate: number;   // decimal e.g. 0.05
}

export type RiskTolerance = "conservative" | "moderate" | "aggressive";

export interface ClientProfile {
  age: number;
  riskTolerance: RiskTolerance;
  annualPremium: number;  // dollar amount
}

export interface CarrierScore {
  carrierId: string;
  carrierName: string;
  totalScore: number;       // 0-100
  growthScore: number;      // 0-100
  protectionScore: number;  // 0-100
  costScore: number;        // 0-100
  loanScore: number;        // 0-100
  rank: number;
  reasoning: string[];
}

/**
 * Weight profiles by risk tolerance and age
 */
function getWeights(profile: ClientProfile): { growth: number; protection: number; cost: number; loan: number } {
  const ageWeight = Math.min(1, Math.max(0, (profile.age - 25) / 40)); // 0 at 25, 1 at 65+

  const baseWeights = {
    conservative: { growth: 0.15, protection: 0.45, cost: 0.25, loan: 0.15 },
    moderate:     { growth: 0.30, protection: 0.25, cost: 0.25, loan: 0.20 },
    aggressive:   { growth: 0.50, protection: 0.10, cost: 0.20, loan: 0.20 },
  };

  const base = baseWeights[profile.riskTolerance];

  // Age adjustments: older clients shift toward protection, younger toward growth
  const ageShift = ageWeight * 0.15;
  return {
    growth:     Math.max(0.05, base.growth - ageShift),
    protection: Math.min(0.60, base.protection + ageShift),
    cost:       base.cost,
    loan:       base.loan,
  };
}

/**
 * Normalize a value to 0-100 scale within a range
 */
function normalize(value: number, min: number, max: number, invert = false): number {
  if (max === min) return 50;
  const raw = ((value - min) / (max - min)) * 100;
  const clamped = Math.max(0, Math.min(100, raw));
  return invert ? 100 - clamped : clamped;
}

/**
 * Score and rank carriers for a given client profile
 */
export function recommendCarriers(
  carriers: CarrierRates[],
  profile: ClientProfile,
): CarrierScore[] {
  if (carriers.length === 0) return [];

  const weights = getWeights(profile);

  // Find ranges for normalization
  const capRates = carriers.map(c => c.capRate);
  const avgReturns = carriers.map(c => c.avgReturn);
  const floorRates = carriers.map(c => c.floorRate);
  const loadFees = carriers.map(c => c.loadFee);
  const coiRates = carriers.map(c => c.coiRate);
  const loanRates = carriers.map(c => c.loanRate);

  const capMin = Math.min(...capRates), capMax = Math.max(...capRates);
  const avgMin = Math.min(...avgReturns), avgMax = Math.max(...avgReturns);
  const floorMin = Math.min(...floorRates), floorMax = Math.max(...floorRates);
  const loadMin = Math.min(...loadFees), loadMax = Math.max(...loadFees);
  const coiMin = Math.min(...coiRates), coiMax = Math.max(...coiRates);
  const loanMin = Math.min(...loanRates), loanMax = Math.max(...loanRates);

  const scored = carriers.map(c => {
    // Growth score: higher cap rate and avg return = better
    const capScore = normalize(c.capRate, capMin, capMax);
    const avgScore = normalize(c.avgReturn, avgMin, avgMax);
    const growthScore = capScore * 0.6 + avgScore * 0.4;

    // Protection score: higher floor rate = better
    const protectionScore = normalize(c.floorRate, floorMin, floorMax);

    // Cost score: lower load fee and COI = better (inverted)
    const loadScore = normalize(c.loadFee, loadMin, loadMax, true);
    const coiScore = normalize(c.coiRate, coiMin, coiMax, true);
    const costScore = loadScore * 0.5 + coiScore * 0.5;

    // Loan score: lower loan rate = better (inverted)
    const loanScore = normalize(c.loanRate, loanMin, loanMax, true);

    // Weighted total
    const totalScore = Math.round(
      growthScore * weights.growth +
      protectionScore * weights.protection +
      costScore * weights.cost +
      loanScore * weights.loan
    );

    // Generate reasoning
    const reasoning: string[] = [];
    if (growthScore >= 75) reasoning.push(`Strong growth potential (${(c.capRate * 100).toFixed(1)}% cap rate)`);
    if (costScore >= 75) reasoning.push(`Low internal costs (${(c.loadFee * 100).toFixed(1)}% load, ${(c.coiRate * 100).toFixed(1)}% COI)`);
    if (protectionScore >= 75) reasoning.push(`Good downside protection (${(c.floorRate * 100).toFixed(1)}% floor)`);
    if (loanScore >= 75) reasoning.push(`Competitive loan rate (${(c.loanRate * 100).toFixed(1)}%)`);
    if (profile.age >= 55 && costScore >= 60) reasoning.push("Cost-efficient for shorter accumulation horizon");
    if (profile.age < 40 && growthScore >= 60) reasoning.push("Strong growth for long accumulation period");
    if (reasoning.length === 0) reasoning.push("Balanced carrier with moderate characteristics");

    return {
      carrierId: c.carrierId,
      carrierName: c.carrierName,
      totalScore,
      growthScore: Math.round(growthScore),
      protectionScore: Math.round(protectionScore),
      costScore: Math.round(costScore),
      loanScore: Math.round(loanScore),
      rank: 0,
      reasoning,
    };
  });

  // Sort by total score descending and assign ranks
  scored.sort((a, b) => b.totalScore - a.totalScore);
  scored.forEach((s, i) => { s.rank = i + 1; });

  return scored;
}

/**
 * Get the top N recommended carriers
 */
export function getTopRecommendations(
  carriers: CarrierRates[],
  profile: ClientProfile,
  topN = 3,
): CarrierScore[] {
  return recommendCarriers(carriers, profile).slice(0, topN);
}
