/**
 * SISTER INVENTION SI-003: Automated Policy Review & Replacement Analyzer
 * Patent Reference: Extends PAT-006 (Replacement Scoring)
 * 
 * Evaluates existing life insurance policies against replacement options
 * with 1035 exchange optimization and suitability analysis.
 */

export interface ExistingPolicy {
  carrier: string;
  productType: "whole_life" | "universal_life" | "variable_ul" | "iul" | "term";
  issueAge: number;
  currentAge: number;
  deathBenefit: number;
  annualPremium: number;
  cashValue: number;
  surrenderValue: number;
  surrenderCharge: number;
  loanBalance: number;
  guaranteedRate: number;
  currentCreditRate: number;
  costOfInsurance: number;     // Annual COI
  riderCosts: number;          // Annual rider costs
  yearsInForce: number;
  inContestabilityPeriod: boolean;
}

export interface ReplacementOption {
  carrier: string;
  productName: string;
  type: "iul" | "fia" | "whole_life";
  projectedRate: number;
  capRate: number;
  floorRate: number;
  monthlyCoiPer1000: number;
  premiumLoad: number;
  hasChronicRider: boolean;
  hasTerminalRider: boolean;
  comdexRanking: number;
}

export interface ReplacementAnalysis {
  existingPolicy: ExistingPolicy;
  replacementOption: ReplacementOption;
  suitabilityScore: number;       // 0-100
  financialBenefit: number;       // Dollar advantage over 20 years
  riskFactors: string[];
  benefits: string[];
  exchange1035: Exchange1035Analysis;
  projectionComparison: ProjectionYear[];
  recommendation: "replace" | "keep" | "review";
  recommendationReason: string;
  complianceFlags: string[];
}

export interface Exchange1035Analysis {
  eligible: boolean;
  transferableAmount: number;
  taxConsequences: number;
  loanTaxBomb: number;           // Taxable gain if loan exceeds basis
  netTransferAmount: number;
  irsReference: string;
}

export interface ProjectionYear {
  year: number;
  existingCV: number;
  existingDB: number;
  replacementCV: number;
  replacementDB: number;
  cumulativeAdvantage: number;
}

export interface PolicyReviewResult {
  analyses: ReplacementAnalysis[];
  bestReplacement: string | null;
  keepRecommendation: boolean;
  overallAssessment: string;
}

/**
 * Analyze policy replacement suitability
 */
export function analyzeReplacement(
  existing: ExistingPolicy,
  replacement: ReplacementOption,
  projectionYears: number = 30
): ReplacementAnalysis {
  // 1035 Exchange analysis
  const costBasis = existing.annualPremium * existing.yearsInForce;
  const gain = existing.cashValue - costBasis;
  const loanTaxBomb = existing.loanBalance > costBasis
    ? (existing.loanBalance - costBasis) * 0.37 : 0;
  const transferable = existing.surrenderValue - existing.loanBalance;

  const exchange1035: Exchange1035Analysis = {
    eligible: existing.productType !== "term" && transferable > 0,
    transferableAmount: Math.max(0, Math.round(transferable)),
    taxConsequences: existing.loanBalance > 0 ? Math.round(loanTaxBomb) : 0,
    loanTaxBomb: Math.round(loanTaxBomb),
    netTransferAmount: Math.round(Math.max(0, transferable - loanTaxBomb)),
    irsReference: "IRC §1035 — Tax-free exchange of life insurance policies",
  };

  // Projection comparison
  const projections: ProjectionYear[] = [];
  let existingCV = existing.cashValue;
  let replacementCV = exchange1035.netTransferAmount;

  for (let y = 1; y <= projectionYears; y++) {
    const age = existing.currentAge + y;

    // Existing policy projection
    existingCV += existing.annualPremium;
    existingCV *= (1 + existing.currentCreditRate);
    const existingCoi = existing.costOfInsurance * (1 + (age - existing.currentAge) * 0.03);
    existingCV = Math.max(0, existingCV - existingCoi - existing.riderCosts);

    // Replacement projection
    replacementCV += existing.annualPremium;
    const replCredit = Math.max(replacement.floorRate,
      Math.min(replacement.capRate || 0.10, replacement.projectedRate)
    );
    replacementCV *= (1 + replCredit);
    const replCoi = replacement.monthlyCoiPer1000 * (existing.deathBenefit / 1000) * 12 * (1 + (age - existing.currentAge) * 0.025);
    replacementCV = Math.max(0, replacementCV - replCoi);

    const existingDB = Math.max(existing.deathBenefit, existingCV * 1.2);
    const replacementDB = Math.max(existing.deathBenefit, replacementCV * 1.2);

    projections.push({
      year: y,
      existingCV: Math.round(existingCV),
      existingDB: Math.round(existingDB),
      replacementCV: Math.round(replacementCV),
      replacementDB: Math.round(replacementDB),
      cumulativeAdvantage: Math.round(replacementCV - existingCV),
    });
  }

  const finalAdvantage = projections[projections.length - 1]?.cumulativeAdvantage ?? 0;

  // Suitability scoring
  let suitability = 50;

  // Financial benefit
  if (finalAdvantage > 100000) suitability += 20;
  else if (finalAdvantage > 50000) suitability += 10;
  else if (finalAdvantage < -50000) suitability -= 20;

  // Living benefits upgrade
  if (replacement.hasChronicRider && existing.productType !== "iul") suitability += 10;
  if (replacement.hasTerminalRider) suitability += 5;

  // Financial strength
  if (replacement.comdexRanking >= 90) suitability += 5;
  if (replacement.comdexRanking < 70) suitability -= 10;

  // Contestability risk
  if (existing.inContestabilityPeriod) suitability -= 15;

  // Loan tax bomb risk
  if (loanTaxBomb > 10000) suitability -= 10;

  suitability = Math.max(0, Math.min(100, suitability));

  // Risk factors
  const risks: string[] = [];
  if (existing.inContestabilityPeriod) risks.push("New contestability period (2 years)");
  if (loanTaxBomb > 0) risks.push(`Loan tax bomb: $${loanTaxBomb.toLocaleString()} taxable gain on exchange`);
  if (existing.surrenderCharge > 0) risks.push(`Surrender charge: $${existing.surrenderCharge.toLocaleString()}`);
  if (existing.yearsInForce > 15) risks.push("Long-held policy — significant accumulated benefits may be lost");

  // Benefits
  const benefits: string[] = [];
  if (finalAdvantage > 0) benefits.push(`$${finalAdvantage.toLocaleString()} higher cash value over ${projectionYears} years`);
  if (replacement.hasChronicRider) benefits.push("Chronic illness living benefit rider");
  if (replacement.capRate > existing.currentCreditRate) benefits.push(`Higher growth potential (${(replacement.capRate * 100).toFixed(0)}% cap vs ${(existing.currentCreditRate * 100).toFixed(1)}% current rate)`);
  if (replacement.comdexRanking > 85) benefits.push(`Strong carrier (COMDEX ${replacement.comdexRanking})`);

  // Compliance flags
  const complianceFlags: string[] = [];
  complianceFlags.push("NAIC Model Regulation 613 — Replacement disclosure required");
  complianceFlags.push("State-specific replacement forms must be filed");
  if (existing.yearsInForce < 3) complianceFlags.push("WARNING: Early replacement — heightened suitability scrutiny");

  const recommendation = suitability >= 70 ? "replace" : suitability >= 40 ? "review" : "keep";
  const reason = recommendation === "replace"
    ? `Strong replacement candidate — ${benefits[0] ?? "improved benefits"}`
    : recommendation === "review"
    ? `Marginal benefit — weigh ${benefits.length} benefits against ${risks.length} risks`
    : `Keep existing policy — replacement risks outweigh benefits`;

  return {
    existingPolicy: existing,
    replacementOption: replacement,
    suitabilityScore: suitability,
    financialBenefit: finalAdvantage,
    riskFactors: risks,
    benefits,
    exchange1035,
    projectionComparison: projections,
    recommendation,
    recommendationReason: reason,
    complianceFlags,
  };
}

/**
 * Review multiple replacement options for a single existing policy
 */
export function reviewPolicy(
  existing: ExistingPolicy,
  options: ReplacementOption[],
  projectionYears: number = 30
): PolicyReviewResult {
  const analyses = options.map(opt => analyzeReplacement(existing, opt, projectionYears));
  analyses.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  const bestAnalysis = analyses[0];
  const keepRec = !bestAnalysis || bestAnalysis.suitabilityScore < 60;

  return {
    analyses,
    bestReplacement: keepRec ? null : `${bestAnalysis.replacementOption.carrier} ${bestAnalysis.replacementOption.productName}`,
    keepRecommendation: keepRec,
    overallAssessment: keepRec
      ? "Current policy is adequate — no compelling replacement found"
      : `Recommend replacing with ${bestAnalysis.replacementOption.carrier} ${bestAnalysis.replacementOption.productName} (suitability: ${bestAnalysis.suitabilityScore}/100, benefit: $${bestAnalysis.financialBenefit.toLocaleString()})`,
  };
}
