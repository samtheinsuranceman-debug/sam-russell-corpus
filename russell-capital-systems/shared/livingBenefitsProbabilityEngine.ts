/**
 * SISTER INVENTION SI-005: Living Benefits Probability Engine
 * Patent Reference: Extends PAT-001 (Monte Carlo IUL Engine)
 * 
 * Calculates probability-weighted value of chronic/critical/terminal
 * illness riders across demographics using actuarial data.
 */

export interface LivingBenefitsInput {
  age: number;
  gender: "male" | "female";
  healthClass: "preferred" | "standard" | "substandard";
  deathBenefit: number;
  chronicRiderPercent: number;   // % of DB accessible (typically 0.50-1.0)
  criticalRiderPercent: number;
  terminalRiderPercent: number;
  projectionYears: number;
}

export interface ConditionProbability {
  condition: string;
  category: "chronic" | "critical" | "terminal";
  annualProbability: number;
  cumulativeProbability: number;
  expectedBenefitValue: number;
  peakRiskAge: number;
  description: string;
}

export interface LivingBenefitsYear {
  year: number;
  age: number;
  chronicProbability: number;
  criticalProbability: number;
  terminalProbability: number;
  anyClaimProbability: number;
  expectedBenefitValue: number;
  cumulativeExpectedValue: number;
}

export interface LivingBenefitsResult {
  conditions: ConditionProbability[];
  yearlyProjections: LivingBenefitsYear[];
  totalExpectedValue: number;
  probabilityOfAnyClaim: number;
  riderCostBreakEvenYear: number | null;
  riderValueRatio: number;          // Expected value / rider cost
  recommendation: string;
  keyInsights: string[];
}

// Actuarial probability data (per 1000 lives, annual incidence by age band)
const CHRONIC_ILLNESS_RATES: Record<string, { base: number; ageMultiplier: number; genderMultF: number }> = {
  "Heart Disease": { base: 2.5, ageMultiplier: 0.08, genderMultF: 0.7 },
  "Cancer": { base: 3.0, ageMultiplier: 0.06, genderMultF: 0.95 },
  "Stroke": { base: 1.2, ageMultiplier: 0.09, genderMultF: 0.85 },
  "Diabetes (Type 2)": { base: 4.0, ageMultiplier: 0.04, genderMultF: 0.9 },
  "Alzheimer's/Dementia": { base: 0.5, ageMultiplier: 0.12, genderMultF: 1.2 },
  "Chronic Kidney Disease": { base: 1.8, ageMultiplier: 0.05, genderMultF: 0.85 },
  "COPD": { base: 1.5, ageMultiplier: 0.06, genderMultF: 0.9 },
  "Parkinson's Disease": { base: 0.3, ageMultiplier: 0.10, genderMultF: 0.6 },
};

const CRITICAL_ILLNESS_RATES: Record<string, { base: number; ageMultiplier: number; genderMultF: number }> = {
  "Heart Attack": { base: 1.5, ageMultiplier: 0.07, genderMultF: 0.5 },
  "Major Organ Transplant": { base: 0.2, ageMultiplier: 0.03, genderMultF: 0.9 },
  "Coronary Bypass": { base: 0.8, ageMultiplier: 0.06, genderMultF: 0.4 },
  "Invasive Cancer": { base: 2.0, ageMultiplier: 0.05, genderMultF: 1.0 },
};

const TERMINAL_ILLNESS_RATES: Record<string, { base: number; ageMultiplier: number; genderMultF: number }> = {
  "Terminal Cancer": { base: 0.8, ageMultiplier: 0.07, genderMultF: 0.9 },
  "End-Stage Organ Failure": { base: 0.3, ageMultiplier: 0.08, genderMultF: 0.8 },
  "ALS/Motor Neuron Disease": { base: 0.05, ageMultiplier: 0.02, genderMultF: 0.7 },
};

function getAnnualProbability(
  base: number,
  ageMultiplier: number,
  genderMultF: number,
  age: number,
  gender: "male" | "female",
  healthClass: string
): number {
  const genderMult = gender === "female" ? genderMultF : 1.0;
  const healthMult = healthClass === "preferred" ? 0.7 : healthClass === "standard" ? 1.0 : 1.5;
  const ageFactor = Math.max(0.1, 1 + (age - 40) * ageMultiplier);
  return (base / 1000) * ageFactor * genderMult * healthMult;
}

/**
 * Calculate living benefits probability and expected value
 */
export function calculateLivingBenefits(input: LivingBenefitsInput): LivingBenefitsResult {
  const conditions: ConditionProbability[] = [];
  const yearlyProjections: LivingBenefitsYear[] = [];

  // Calculate condition-level probabilities
  for (const [name, rates] of Object.entries(CHRONIC_ILLNESS_RATES)) {
    let cumProb = 0;
    for (let y = 0; y < input.projectionYears; y++) {
      const annProb = getAnnualProbability(rates.base, rates.ageMultiplier, rates.genderMultF, input.age + y, input.gender, input.healthClass);
      cumProb = 1 - (1 - cumProb) * (1 - annProb);
    }
    conditions.push({
      condition: name,
      category: "chronic",
      annualProbability: getAnnualProbability(rates.base, rates.ageMultiplier, rates.genderMultF, input.age, input.gender, input.healthClass),
      cumulativeProbability: cumProb,
      expectedBenefitValue: Math.round(cumProb * input.deathBenefit * input.chronicRiderPercent),
      peakRiskAge: Math.round(40 + (1 / rates.ageMultiplier) * 2),
      description: `${(cumProb * 100).toFixed(1)}% chance over ${input.projectionYears} years`,
    });
  }

  for (const [name, rates] of Object.entries(CRITICAL_ILLNESS_RATES)) {
    let cumProb = 0;
    for (let y = 0; y < input.projectionYears; y++) {
      const annProb = getAnnualProbability(rates.base, rates.ageMultiplier, rates.genderMultF, input.age + y, input.gender, input.healthClass);
      cumProb = 1 - (1 - cumProb) * (1 - annProb);
    }
    conditions.push({
      condition: name,
      category: "critical",
      annualProbability: getAnnualProbability(rates.base, rates.ageMultiplier, rates.genderMultF, input.age, input.gender, input.healthClass),
      cumulativeProbability: cumProb,
      expectedBenefitValue: Math.round(cumProb * input.deathBenefit * input.criticalRiderPercent),
      peakRiskAge: Math.round(40 + (1 / rates.ageMultiplier) * 2),
      description: `${(cumProb * 100).toFixed(1)}% chance over ${input.projectionYears} years`,
    });
  }

  for (const [name, rates] of Object.entries(TERMINAL_ILLNESS_RATES)) {
    let cumProb = 0;
    for (let y = 0; y < input.projectionYears; y++) {
      const annProb = getAnnualProbability(rates.base, rates.ageMultiplier, rates.genderMultF, input.age + y, input.gender, input.healthClass);
      cumProb = 1 - (1 - cumProb) * (1 - annProb);
    }
    conditions.push({
      condition: name,
      category: "terminal",
      annualProbability: getAnnualProbability(rates.base, rates.ageMultiplier, rates.genderMultF, input.age, input.gender, input.healthClass),
      cumulativeProbability: cumProb,
      expectedBenefitValue: Math.round(cumProb * input.deathBenefit * input.terminalRiderPercent),
      peakRiskAge: Math.round(40 + (1 / rates.ageMultiplier) * 2),
      description: `${(cumProb * 100).toFixed(1)}% chance over ${input.projectionYears} years`,
    });
  }

  // Year-by-year projections
  let cumulativeEV = 0;
  for (let y = 1; y <= input.projectionYears; y++) {
    const age = input.age + y;

    let chronicProb = 0;
    for (const rates of Object.values(CHRONIC_ILLNESS_RATES)) {
      chronicProb += getAnnualProbability(rates.base, rates.ageMultiplier, rates.genderMultF, age, input.gender, input.healthClass);
    }

    let criticalProb = 0;
    for (const rates of Object.values(CRITICAL_ILLNESS_RATES)) {
      criticalProb += getAnnualProbability(rates.base, rates.ageMultiplier, rates.genderMultF, age, input.gender, input.healthClass);
    }

    let terminalProb = 0;
    for (const rates of Object.values(TERMINAL_ILLNESS_RATES)) {
      terminalProb += getAnnualProbability(rates.base, rates.ageMultiplier, rates.genderMultF, age, input.gender, input.healthClass);
    }

    const anyProb = 1 - (1 - chronicProb) * (1 - criticalProb) * (1 - terminalProb);
    const ev = anyProb * input.deathBenefit * 0.5; // Average 50% benefit utilization
    cumulativeEV += ev;

    yearlyProjections.push({
      year: y,
      age,
      chronicProbability: Math.round(chronicProb * 10000) / 100,
      criticalProbability: Math.round(criticalProb * 10000) / 100,
      terminalProbability: Math.round(terminalProb * 10000) / 100,
      anyClaimProbability: Math.round(anyProb * 10000) / 100,
      expectedBenefitValue: Math.round(ev),
      cumulativeExpectedValue: Math.round(cumulativeEV),
    });
  }

  const totalEV = conditions.reduce((s, c) => s + c.expectedBenefitValue, 0);
  const totalAnyClaimProb = 1 - conditions.reduce((p, c) => p * (1 - c.cumulativeProbability), 1);

  // Rider cost break-even (assume rider costs ~0.5% of DB annually)
  const annualRiderCost = input.deathBenefit * 0.005;
  const totalRiderCost = annualRiderCost * input.projectionYears;
  const breakEvenYear = totalEV > 0 ? Math.ceil(totalRiderCost / (totalEV / input.projectionYears)) : null;
  const valueRatio = totalRiderCost > 0 ? totalEV / totalRiderCost : 0;

  const recommendation = valueRatio > 2
    ? "STRONGLY RECOMMENDED — Expected benefit value significantly exceeds rider cost"
    : valueRatio > 1
    ? "RECOMMENDED — Expected benefit value exceeds rider cost"
    : valueRatio > 0.5
    ? "CONSIDER — Marginal expected value, but provides valuable protection"
    : "OPTIONAL — Low probability of claim at current age/health";

  const keyInsights: string[] = [
    `${(totalAnyClaimProb * 100).toFixed(1)}% probability of triggering at least one living benefit over ${input.projectionYears} years`,
    `Expected benefit value: $${totalEV.toLocaleString()} vs rider cost: $${Math.round(totalRiderCost).toLocaleString()}`,
    `Top risk: ${conditions.sort((a, b) => b.cumulativeProbability - a.cumulativeProbability)[0]?.condition ?? "N/A"}`,
    `Peak risk period: ages ${input.age + 15}-${input.age + 30}`,
    `Value ratio: ${valueRatio.toFixed(1)}x (${valueRatio > 1 ? "favorable" : "unfavorable"})`,
  ];

  return {
    conditions: conditions.sort((a, b) => b.expectedBenefitValue - a.expectedBenefitValue),
    yearlyProjections,
    totalExpectedValue: Math.round(totalEV),
    probabilityOfAnyClaim: Math.round(totalAnyClaimProb * 10000) / 100,
    riderCostBreakEvenYear: breakEvenYear,
    riderValueRatio: Math.round(valueRatio * 100) / 100,
    recommendation,
    keyInsights,
  };
}
