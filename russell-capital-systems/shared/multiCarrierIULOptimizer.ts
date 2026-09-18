/**
 * SISTER INVENTION SI-002: Multi-Carrier IUL Comparison Optimizer
 * Patent Reference: Extends PAT-001 (Monte Carlo IUL Engine)
 * 
 * Normalizes disparate carrier illustration formats into unified
 * comparison framework with standardized metrics.
 */

export interface CarrierIULProduct {
  carrier: string;
  productName: string;
  capRate: number;
  floorRate: number;
  participationRate: number;
  spreadFee: number;
  monthlyCoiPer1000: number;  // Cost of insurance per $1000
  premiumLoadFactor: number;  // % of premium taken as load
  surrenderYears: number;
  hasLoanProvision: boolean;
  loanRate: number;
  loanCreditRate: number;
  hasChronicIllnessRider: boolean;
  hasTerminalIllnessRider: boolean;
  amBestRating: string;
  comdexRanking: number;      // 1-100
  financialStrengthScore: number;
}

export interface IULComparisonInput {
  carriers: CarrierIULProduct[];
  insuredAge: number;
  gender: "male" | "female";
  healthClass: "preferred_plus" | "preferred" | "standard" | "substandard";
  annualPremium: number;
  deathBenefit: number;
  projectionYears: number;
  assumedMarketReturn: number;  // For indexing calculation
}

export interface CarrierProjection {
  year: number;
  cashValue: number;
  deathBenefit: number;
  surrenderValue: number;
  netCashValueReturn: number;
  cumulativePremium: number;
}

export interface CarrierScore {
  carrier: string;
  productName: string;
  projections: CarrierProjection[];
  cashValueAt10: number;
  cashValueAt20: number;
  cashValueAt30: number;
  deathBenefitAt20: number;
  internalRateOfReturn: number;
  costEfficiencyScore: number;     // 0-100
  livingBenefitsScore: number;     // 0-100
  financialStrengthScore: number;  // 0-100
  overallScore: number;            // 0-100 weighted
  rank: number;
  strengths: string[];
  weaknesses: string[];
}

export interface IULComparisonResult {
  scores: CarrierScore[];
  bestOverall: string;
  bestCashValue: string;
  bestDeathBenefit: string;
  bestLivingBenefits: string;
  mostFinanciallySound: string;
  recommendation: string;
}

/**
 * Compare IUL products across multiple carriers
 */
export function compareCarriers(input: IULComparisonInput): IULComparisonResult {
  const scores: CarrierScore[] = input.carriers.map(carrier => {
    const projections: CarrierProjection[] = [];
    let cashValue = 0;
    let cumulativePremium = 0;

    // Mortality multiplier based on health class
    const mortalityMult = input.healthClass === "preferred_plus" ? 0.6
      : input.healthClass === "preferred" ? 0.8
      : input.healthClass === "standard" ? 1.0 : 1.4;

    const genderMult = input.gender === "female" ? 0.85 : 1.0;

    for (let y = 1; y <= input.projectionYears; y++) {
      const age = input.insuredAge + y;
      cumulativePremium += input.annualPremium;

      // Premium after load
      const netPremium = input.annualPremium * (1 - carrier.premiumLoadFactor);
      cashValue += netPremium;

      // Index credit (capped, with participation and spread)
      const rawReturn = input.assumedMarketReturn;
      const indexCredit = Math.max(carrier.floorRate,
        Math.min(carrier.capRate, rawReturn) * carrier.participationRate - carrier.spreadFee
      );
      cashValue *= (1 + indexCredit);

      // COI deduction (increases with age)
      const baseCoi = carrier.monthlyCoiPer1000 * (input.deathBenefit / 1000) * 12;
      const ageFactor = 1 + (age - 30) * 0.025;
      const coi = baseCoi * ageFactor * mortalityMult * genderMult;
      cashValue = Math.max(0, cashValue - coi);

      // Surrender value
      const surrenderPct = y <= carrier.surrenderYears
        ? Math.max(0, 1 - (carrier.surrenderYears - y + 1) * 0.01 * (10 / carrier.surrenderYears))
        : 1;
      const surrenderValue = cashValue * surrenderPct;

      // Death benefit (greater of face amount or cash value * corridor)
      const corridorFactor = age < 40 ? 2.5 : age < 60 ? 1.5 : 1.2;
      const db = Math.max(input.deathBenefit, cashValue * corridorFactor);

      projections.push({
        year: y,
        cashValue: Math.round(cashValue),
        deathBenefit: Math.round(db),
        surrenderValue: Math.round(surrenderValue),
        netCashValueReturn: cumulativePremium > 0 ? ((cashValue / cumulativePremium) - 1) * 100 : 0,
        cumulativePremium: Math.round(cumulativePremium),
      });
    }

    const cv10 = projections[9]?.cashValue ?? 0;
    const cv20 = projections[19]?.cashValue ?? 0;
    const cv30 = projections[29]?.cashValue ?? 0;
    const db20 = projections[19]?.deathBenefit ?? 0;
    const finalCV = projections[projections.length - 1]?.cashValue ?? 0;

    // IRR calculation
    const irr = cumulativePremium > 0
      ? (Math.pow(Math.max(1, finalCV) / cumulativePremium, 1 / input.projectionYears) - 1) * 100
      : 0;

    // Cost efficiency (lower COI + lower load = better)
    const costEff = Math.max(0, Math.min(100, Math.round(
      100 - carrier.premiumLoadFactor * 200 - carrier.monthlyCoiPer1000 * 50 - carrier.spreadFee * 300
    )));

    // Living benefits score
    const livingBen = Math.round(
      (carrier.hasChronicIllnessRider ? 40 : 0) +
      (carrier.hasTerminalIllnessRider ? 30 : 0) +
      (carrier.hasLoanProvision ? 20 : 0) +
      (carrier.loanCreditRate > 0.04 ? 10 : 0)
    );

    // Financial strength
    const finStrength = carrier.comdexRanking;

    // Overall weighted score
    const overall = Math.round(
      costEff * 0.30 + livingBen * 0.20 + finStrength * 0.25 +
      Math.min(100, irr * 15) * 0.25
    );

    // Strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (carrier.capRate >= 0.10) strengths.push(`High cap rate (${(carrier.capRate * 100).toFixed(0)}%)`);
    if (carrier.capRate < 0.07) weaknesses.push(`Low cap rate (${(carrier.capRate * 100).toFixed(0)}%)`);
    if (carrier.participationRate >= 1.0) strengths.push("100%+ participation rate");
    if (carrier.participationRate < 0.8) weaknesses.push(`Low participation (${(carrier.participationRate * 100).toFixed(0)}%)`);
    if (carrier.spreadFee === 0) strengths.push("No spread fee");
    if (carrier.spreadFee > 0.02) weaknesses.push(`High spread fee (${(carrier.spreadFee * 100).toFixed(1)}%)`);
    if (carrier.comdexRanking >= 90) strengths.push(`Top-tier financial strength (COMDEX ${carrier.comdexRanking})`);
    if (carrier.hasChronicIllnessRider) strengths.push("Chronic illness rider included");
    if (!carrier.hasChronicIllnessRider) weaknesses.push("No chronic illness rider");
    if (carrier.premiumLoadFactor < 0.05) strengths.push("Low premium load");
    if (carrier.premiumLoadFactor > 0.08) weaknesses.push("High premium load");

    return {
      carrier: carrier.carrier,
      productName: carrier.productName,
      projections,
      cashValueAt10: cv10,
      cashValueAt20: cv20,
      cashValueAt30: cv30,
      deathBenefitAt20: db20,
      internalRateOfReturn: Math.round(irr * 100) / 100,
      costEfficiencyScore: costEff,
      livingBenefitsScore: livingBen,
      financialStrengthScore: finStrength,
      overallScore: overall,
      rank: 0,
      strengths,
      weaknesses,
    };
  });

  // Rank
  scores.sort((a, b) => b.overallScore - a.overallScore);
  scores.forEach((s, i) => s.rank = i + 1);

  const bestOverall = scores[0];
  const bestCV = scores.reduce((b, s) => s.cashValueAt20 > b.cashValueAt20 ? s : b);
  const bestDB = scores.reduce((b, s) => s.deathBenefitAt20 > b.deathBenefitAt20 ? s : b);
  const bestLB = scores.reduce((b, s) => s.livingBenefitsScore > b.livingBenefitsScore ? s : b);
  const bestFS = scores.reduce((b, s) => s.financialStrengthScore > b.financialStrengthScore ? s : b);

  return {
    scores,
    bestOverall: `${bestOverall.carrier} ${bestOverall.productName}`,
    bestCashValue: `${bestCV.carrier} ${bestCV.productName}`,
    bestDeathBenefit: `${bestDB.carrier} ${bestDB.productName}`,
    bestLivingBenefits: `${bestLB.carrier} ${bestLB.productName}`,
    mostFinanciallySound: `${bestFS.carrier} ${bestFS.productName}`,
    recommendation: `Top pick: ${bestOverall.carrier} ${bestOverall.productName} (Score: ${bestOverall.overallScore}/100, IRR: ${bestOverall.internalRateOfReturn}%, COMDEX: ${bestOverall.financialStrengthScore})`,
  };
}

/**
 * Get default carrier products for comparison
 */
export function getDefaultCarriers(): CarrierIULProduct[] {
  return [
    { carrier: "Penn Mutual", productName: "Accumulation Builder IUL", capRate: 0.105, floorRate: 0, participationRate: 1.0, spreadFee: 0, monthlyCoiPer1000: 0.15, premiumLoadFactor: 0.05, surrenderYears: 10, hasLoanProvision: true, loanRate: 0.05, loanCreditRate: 0.045, hasChronicIllnessRider: true, hasTerminalIllnessRider: true, amBestRating: "A+", comdexRanking: 92, financialStrengthScore: 92 },
    { carrier: "National Life", productName: "FlexLife IUL", capRate: 0.12, floorRate: 0, participationRate: 1.0, spreadFee: 0.005, monthlyCoiPer1000: 0.14, premiumLoadFactor: 0.06, surrenderYears: 12, hasLoanProvision: true, loanRate: 0.05, loanCreditRate: 0.05, hasChronicIllnessRider: true, hasTerminalIllnessRider: true, amBestRating: "A+", comdexRanking: 88, financialStrengthScore: 88 },
    { carrier: "Pacific Life", productName: "Pacific Discovery IUL", capRate: 0.095, floorRate: 0, participationRate: 1.0, spreadFee: 0, monthlyCoiPer1000: 0.16, premiumLoadFactor: 0.055, surrenderYears: 15, hasLoanProvision: true, loanRate: 0.04, loanCreditRate: 0.04, hasChronicIllnessRider: true, hasTerminalIllnessRider: true, amBestRating: "A+", comdexRanking: 95, financialStrengthScore: 95 },
    { carrier: "Transamerica", productName: "Financial Foundation IUL", capRate: 0.11, floorRate: 0, participationRate: 0.95, spreadFee: 0.01, monthlyCoiPer1000: 0.13, premiumLoadFactor: 0.07, surrenderYears: 10, hasLoanProvision: true, loanRate: 0.06, loanCreditRate: 0.04, hasChronicIllnessRider: true, hasTerminalIllnessRider: true, amBestRating: "A", comdexRanking: 82, financialStrengthScore: 82 },
    { carrier: "Allianz", productName: "Life Pro+ IUL", capRate: 0.0, floorRate: 0, participationRate: 1.40, spreadFee: 0.0, monthlyCoiPer1000: 0.17, premiumLoadFactor: 0.06, surrenderYears: 10, hasLoanProvision: true, loanRate: 0.05, loanCreditRate: 0.05, hasChronicIllnessRider: true, hasTerminalIllnessRider: true, amBestRating: "A+", comdexRanking: 90, financialStrengthScore: 90 },
  ];
}
