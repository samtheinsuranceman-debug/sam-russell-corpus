/**
 * SISTER INVENTION SI-025: Automated Annuity Comparison with Hidden Fee Detection
 * Patent Reference: Extends PAT-009 (Growth Annuity Engine)
 * 
 * Reverse-engineers annuity contracts to expose all embedded fees,
 * surrender charges, MVA risks, and true cost of ownership.
 */

export interface AnnuityContract {
  name: string;
  carrier: string;
  type: "fixed" | "variable" | "indexed" | "fia" | "spia" | "dia";
  premium: number;
  guaranteedRate: number;
  capRate: number;
  participationRate: number;
  spreadFee: number;
  annualFee: number;           // M&E + admin
  riderFees: RiderFee[];
  surrenderSchedule: number[]; // Array of surrender charge % by year
  mvaApplies: boolean;
  bonusRate: number;           // First-year bonus %
  bonusVestingYears: number;
  freeWithdrawalPercent: number;
  projectionYears: number;
}

export interface RiderFee {
  name: string;
  annualCost: number;    // As % of account value
  benefit: string;
}

export interface HiddenFee {
  name: string;
  type: "explicit" | "implicit" | "structural" | "opportunity";
  annualCost: number;         // Dollar amount per year
  annualCostPercent: number;  // As % of premium
  cumulativeCost: number;     // Over projection period
  severity: "low" | "medium" | "high" | "critical";
  explanation: string;
  irsReference?: string;
}

export interface AnnuityYearProjection {
  year: number;
  accountValue: number;
  surrenderValue: number;
  totalFeesThisYear: number;
  cumulativeFees: number;
  netReturn: number;
  surrenderCharge: number;
  effectiveYield: number;
}

export interface AnnuityAnalysis {
  contract: AnnuityContract;
  hiddenFees: HiddenFee[];
  totalHiddenFeeCost: number;
  totalExplicitFeeCost: number;
  totalAllInCost: number;
  allInCostPercent: number;
  projections: AnnuityYearProjection[];
  trueAnnualizedReturn: number;
  statedReturn: number;
  returnDrag: number;
  surrenderBreakEvenYear: number;
  recommendation: string;
  riskScore: number;           // 1-100
  transparencyScore: number;   // 1-100 (higher = more transparent)
}

export interface ComparisonResult {
  analyses: AnnuityAnalysis[];
  bestValue: string;
  lowestFees: string;
  highestReturn: string;
  recommendation: string;
}

/**
 * Analyze a single annuity contract for hidden fees
 */
export function analyzeAnnuity(contract: AnnuityContract): AnnuityAnalysis {
  const hiddenFees: HiddenFee[] = [];
  let totalHidden = 0;
  let totalExplicit = 0;

  // 1. Explicit M&E and admin fees
  const explicitAnnual = contract.premium * contract.annualFee;
  totalExplicit += explicitAnnual * contract.projectionYears;

  // 2. Rider fees
  contract.riderFees.forEach(rider => {
    const riderCost = contract.premium * rider.annualCost;
    totalExplicit += riderCost * contract.projectionYears;
    if (rider.annualCost > 0.01) {
      hiddenFees.push({
        name: `Rider: ${rider.name}`,
        type: "explicit",
        annualCost: Math.round(riderCost),
        annualCostPercent: rider.annualCost * 100,
        cumulativeCost: Math.round(riderCost * contract.projectionYears),
        severity: rider.annualCost > 0.015 ? "high" : "medium",
        explanation: `${rider.name} charges ${(rider.annualCost * 100).toFixed(2)}% annually — ${rider.benefit}`,
      });
    }
  });

  // 3. Spread fee (hidden in indexed crediting)
  if (contract.spreadFee > 0) {
    const spreadCost = contract.premium * contract.spreadFee;
    totalHidden += spreadCost * contract.projectionYears;
    hiddenFees.push({
      name: "Index Spread/Margin Fee",
      type: "implicit",
      annualCost: Math.round(spreadCost),
      annualCostPercent: contract.spreadFee * 100,
      cumulativeCost: Math.round(spreadCost * contract.projectionYears),
      severity: contract.spreadFee > 0.02 ? "high" : "medium",
      explanation: `A ${(contract.spreadFee * 100).toFixed(1)}% spread is deducted from index gains before crediting — this is often buried in the contract and not disclosed as a "fee"`,
    });
  }

  // 4. Cap rate drag (opportunity cost vs uncapped)
  if (contract.capRate > 0 && contract.capRate < 1) {
    const avgMarketReturn = 0.10;
    const cappedReturn = Math.min(contract.capRate, avgMarketReturn);
    const capDrag = (avgMarketReturn - cappedReturn) * contract.premium;
    if (capDrag > 0) {
      totalHidden += capDrag * contract.projectionYears;
      hiddenFees.push({
        name: "Cap Rate Opportunity Cost",
        type: "opportunity",
        annualCost: Math.round(capDrag),
        annualCostPercent: (avgMarketReturn - cappedReturn) * 100,
        cumulativeCost: Math.round(capDrag * contract.projectionYears),
        severity: contract.capRate < 0.06 ? "critical" : contract.capRate < 0.08 ? "high" : "medium",
        explanation: `With a ${(contract.capRate * 100).toFixed(0)}% cap, you lose all gains above that threshold. In a 10% market year, you'd only receive ${(contract.capRate * 100).toFixed(0)}%`,
      });
    }
  }

  // 5. Participation rate drag
  if (contract.participationRate < 1) {
    const partDrag = (1 - contract.participationRate) * 0.08 * contract.premium;
    totalHidden += partDrag * contract.projectionYears;
    hiddenFees.push({
      name: "Participation Rate Reduction",
      type: "structural",
      annualCost: Math.round(partDrag),
      annualCostPercent: (1 - contract.participationRate) * 8,
      cumulativeCost: Math.round(partDrag * contract.projectionYears),
      severity: contract.participationRate < 0.7 ? "critical" : contract.participationRate < 0.85 ? "high" : "medium",
      explanation: `Only ${(contract.participationRate * 100).toFixed(0)}% of index gains are credited. In a 10% year, you'd receive ${(contract.participationRate * 10).toFixed(1)}%`,
    });
  }

  // 6. Surrender charges
  const avgSurrender = contract.surrenderSchedule.reduce((s, v) => s + v, 0) / Math.max(contract.surrenderSchedule.length, 1);
  if (avgSurrender > 0.02) {
    hiddenFees.push({
      name: "Surrender Charge Lock-In",
      type: "structural",
      annualCost: 0,
      annualCostPercent: 0,
      cumulativeCost: Math.round(contract.premium * contract.surrenderSchedule[0] / 100),
      severity: contract.surrenderSchedule[0] > 8 ? "critical" : "high",
      explanation: `Surrender charges start at ${contract.surrenderSchedule[0]}% and last ${contract.surrenderSchedule.length} years. Early withdrawal penalty: $${(contract.premium * contract.surrenderSchedule[0] / 100).toLocaleString()}`,
    });
  }

  // 7. Bonus recapture (if bonus exists)
  if (contract.bonusRate > 0) {
    const bonusAmount = contract.premium * contract.bonusRate;
    const recaptureCost = bonusAmount * 0.6; // Most bonuses are recaptured through higher fees
    totalHidden += recaptureCost;
    hiddenFees.push({
      name: "Bonus Recapture via Higher Fees",
      type: "implicit",
      annualCost: Math.round(recaptureCost / contract.bonusVestingYears),
      annualCostPercent: (contract.bonusRate * 0.6 / contract.bonusVestingYears) * 100,
      cumulativeCost: Math.round(recaptureCost),
      severity: "high",
      explanation: `The ${(contract.bonusRate * 100).toFixed(0)}% bonus ($${bonusAmount.toLocaleString()}) is typically recaptured through higher M&E charges and lower caps over ${contract.bonusVestingYears} years`,
      irsReference: "IRC §72(q) — 10% penalty on pre-59½ withdrawals applies to bonus amounts",
    });
  }

  // 8. MVA risk
  if (contract.mvaApplies) {
    hiddenFees.push({
      name: "Market Value Adjustment (MVA) Risk",
      type: "structural",
      annualCost: 0,
      annualCostPercent: 0,
      cumulativeCost: Math.round(contract.premium * 0.05),
      severity: "high",
      explanation: "If interest rates rise, surrendering could reduce your value by 3-8% beyond the surrender charge. This is a hidden downside risk not reflected in illustrations",
    });
  }

  // Year-by-year projections
  const projections: AnnuityYearProjection[] = [];
  let accountValue = contract.premium;
  let cumulativeFees = 0;

  // Effective crediting rate after all drags
  const effectiveCredit = Math.max(contract.guaranteedRate,
    Math.min(contract.capRate || 0.10, 0.08) * contract.participationRate - contract.spreadFee
  );

  let surrenderBreakEven = contract.projectionYears;

  for (let y = 1; y <= contract.projectionYears; y++) {
    // Credit interest
    accountValue *= (1 + effectiveCredit);

    // Deduct fees
    const yearFees = accountValue * (contract.annualFee + contract.riderFees.reduce((s, r) => s + r.annualCost, 0));
    accountValue -= yearFees;
    cumulativeFees += yearFees;

    // Surrender value
    const surrenderPct = y <= contract.surrenderSchedule.length ? contract.surrenderSchedule[y - 1] / 100 : 0;
    const surrenderCharge = accountValue * surrenderPct;
    const surrenderValue = accountValue - surrenderCharge;

    if (surrenderValue >= contract.premium && y < surrenderBreakEven) {
      surrenderBreakEven = y;
    }

    projections.push({
      year: y,
      accountValue: Math.round(accountValue),
      surrenderValue: Math.round(surrenderValue),
      totalFeesThisYear: Math.round(yearFees),
      cumulativeFees: Math.round(cumulativeFees),
      netReturn: Math.round(accountValue - contract.premium),
      surrenderCharge: Math.round(surrenderCharge),
      effectiveYield: ((accountValue / contract.premium) ** (1 / y) - 1) * 100,
    });
  }

  const finalProjection = projections[projections.length - 1];
  const trueReturn = finalProjection
    ? ((finalProjection.accountValue / contract.premium) ** (1 / contract.projectionYears) - 1) * 100
    : 0;
  const statedReturn = effectiveCredit * 100;
  const allInCost = totalExplicit + totalHidden;

  // Scores
  const riskScore = Math.min(100, Math.round(
    (contract.surrenderSchedule[0] ?? 0) * 3 +
    (contract.mvaApplies ? 15 : 0) +
    (1 - contract.participationRate) * 30 +
    contract.riderFees.length * 8 +
    (contract.annualFee > 0.02 ? 20 : 0)
  ));

  const transparencyScore = Math.max(10, 100 - Math.round(
    hiddenFees.filter(f => f.type === "implicit" || f.type === "structural").length * 15 +
    (contract.spreadFee > 0 ? 10 : 0) +
    (contract.bonusRate > 0 ? 10 : 0) +
    (contract.mvaApplies ? 10 : 0)
  ));

  const recommendation = riskScore > 60
    ? "HIGH RISK — Significant hidden costs erode returns. Consider alternatives."
    : riskScore > 35
    ? "MODERATE RISK — Some hidden fees present. Compare with lower-cost options."
    : "ACCEPTABLE — Relatively transparent fee structure.";

  return {
    contract,
    hiddenFees,
    totalHiddenFeeCost: Math.round(totalHidden),
    totalExplicitFeeCost: Math.round(totalExplicit),
    totalAllInCost: Math.round(allInCost),
    allInCostPercent: contract.premium > 0 ? Math.round((allInCost / contract.premium) * 10000) / 100 : 0,
    projections,
    trueAnnualizedReturn: Math.round(trueReturn * 100) / 100,
    statedReturn: Math.round(statedReturn * 100) / 100,
    returnDrag: Math.round((statedReturn - trueReturn) * 100) / 100,
    surrenderBreakEvenYear: surrenderBreakEven,
    recommendation,
    riskScore,
    transparencyScore,
  };
}

/**
 * Compare multiple annuity contracts side-by-side
 */
export function compareAnnuities(contracts: AnnuityContract[]): ComparisonResult {
  const analyses = contracts.map(c => analyzeAnnuity(c));

  const bestValue = analyses.reduce((b, a) => a.trueAnnualizedReturn > b.trueAnnualizedReturn ? a : b);
  const lowestFees = analyses.reduce((b, a) => a.totalAllInCost < b.totalAllInCost ? a : b);
  const highestReturn = analyses.reduce((b, a) => a.trueAnnualizedReturn > b.trueAnnualizedReturn ? a : b);

  return {
    analyses,
    bestValue: bestValue.contract.name,
    lowestFees: lowestFees.contract.name,
    highestReturn: highestReturn.contract.name,
    recommendation: `Best overall value: ${bestValue.contract.name} (${bestValue.trueAnnualizedReturn.toFixed(2)}% true return, $${bestValue.totalAllInCost.toLocaleString()} total cost)`,
  };
}
