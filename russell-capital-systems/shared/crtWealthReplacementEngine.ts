/**
 * SISTER INVENTION SI-008: CRT + IUL Wealth Replacement Calculator
 * Patent Reference: Extends PAT-007 (Tax Bracket Optimization)
 * 
 * Models CRT income streams with IUL death benefit replacement
 * for estate tax elimination and charitable legacy optimization.
 */

export interface CRTInput {
  assetValue: number;
  assetCostBasis: number;
  crtType: "CRAT" | "CRUT";
  payoutRate: number;          // 5-50% for CRAT, 5-50% for CRUT
  trustTermYears: number;      // Or life expectancy
  trustGrowthRate: number;
  taxBracket: number;
  capitalGainsRate: number;
  estateValue: number;
  estateTaxRate: number;
  iulPremium: number;
  iulProjectedRate: number;
  iulDeathBenefit: number;
  age: number;
  projectionYears: number;
}

export interface CRTYear {
  year: number;
  age: number;
  trustValue: number;
  annualPayout: number;
  taxOnPayout: number;
  netIncome: number;
  cumulativeIncome: number;
  iulCashValue: number;
  iulDeathBenefit: number;
  totalWealth: number;
}

export interface CRTResult {
  years: CRTYear[];
  charitableDeduction: number;
  capitalGainsTaxAvoided: number;
  estateTaxAvoided: number;
  totalTaxSavings: number;
  totalIncomeReceived: number;
  charitableRemainder: number;
  iulFinalDeathBenefit: number;
  wealthReplacementRatio: number;  // IUL DB / asset value
  netAdvantageOverSelling: number;
  recommendation: string;
  irsReferences: string[];
}

/**
 * Calculate CRT + IUL wealth replacement strategy
 */
export function calculateCRTStrategy(input: CRTInput): CRTResult {
  const years: CRTYear[] = [];

  // Charitable deduction (simplified — IRS §170 present value calculation)
  const pvFactor = (1 - Math.pow(1 + 0.052, -input.trustTermYears)) / 0.052; // AFR-based
  const charitableDeduction = Math.round(input.assetValue * (1 - input.payoutRate * pvFactor));

  // Capital gains tax avoided (no recognition on transfer to CRT)
  const unrealizedGain = input.assetValue - input.assetCostBasis;
  const cgTaxAvoided = Math.round(unrealizedGain * (input.capitalGainsRate + 0.038)); // +3.8% NIIT

  // Estate tax avoided (asset removed from estate)
  const estateTaxAvoided = Math.round(input.assetValue * input.estateTaxRate);

  let trustValue = input.assetValue;
  let iulCashValue = 0;
  let cumulativeIncome = 0;

  for (let y = 1; y <= input.projectionYears; y++) {
    const age = input.age + y;

    // Trust growth
    trustValue *= (1 + input.trustGrowthRate);

    // Payout
    const payout = input.crtType === "CRAT"
      ? input.assetValue * input.payoutRate  // Fixed amount
      : trustValue * input.payoutRate;        // % of trust value

    trustValue -= payout;
    trustValue = Math.max(0, trustValue);

    // Tax on payout (blended: part ordinary, part CG, part tax-free)
    const ordinaryPortion = 0.5;
    const cgPortion = 0.3;
    const taxOnPayout = payout * (ordinaryPortion * input.taxBracket + cgPortion * input.capitalGainsRate);
    const netIncome = payout - taxOnPayout;
    cumulativeIncome += netIncome;

    // IUL growth (funded by CRT income)
    iulCashValue += input.iulPremium;
    iulCashValue *= (1 + input.iulProjectedRate);
    const coi = input.iulDeathBenefit / 1000 * 0.15 * 12 * (1 + (age - 40) * 0.02);
    iulCashValue = Math.max(0, iulCashValue - coi);

    const iulDB = Math.max(input.iulDeathBenefit, iulCashValue * 1.2);

    years.push({
      year: y,
      age,
      trustValue: Math.round(trustValue),
      annualPayout: Math.round(payout),
      taxOnPayout: Math.round(taxOnPayout),
      netIncome: Math.round(netIncome),
      cumulativeIncome: Math.round(cumulativeIncome),
      iulCashValue: Math.round(iulCashValue),
      iulDeathBenefit: Math.round(iulDB),
      totalWealth: Math.round(iulCashValue + trustValue + cumulativeIncome),
    });
  }

  const finalYear = years[years.length - 1];
  const charitableRemainder = finalYear?.trustValue ?? 0;
  const iulFinalDB = finalYear?.iulDeathBenefit ?? 0;

  // Compare to simply selling the asset
  const afterSellValue = input.assetValue - unrealizedGain * (input.capitalGainsRate + 0.038);
  const sellGrowth = afterSellValue * Math.pow(1 + 0.06, input.projectionYears);
  const crtTotalValue = cumulativeIncome + iulFinalDB + charitableRemainder;
  const netAdvantage = crtTotalValue - sellGrowth;

  const totalTaxSavings = charitableDeduction * input.taxBracket + cgTaxAvoided + estateTaxAvoided;
  const wealthRatio = input.assetValue > 0 ? iulFinalDB / input.assetValue : 0;

  const recommendation = netAdvantage > 0
    ? `CRT + IUL strategy creates $${Math.round(netAdvantage).toLocaleString()} MORE wealth than selling outright, while providing ${(input.payoutRate * 100).toFixed(0)}% annual income and a $${charitableRemainder.toLocaleString()} charitable legacy`
    : `Consider alternative structures — selling outright may produce better results in this scenario`;

  return {
    years,
    charitableDeduction: Math.max(0, charitableDeduction),
    capitalGainsTaxAvoided: cgTaxAvoided,
    estateTaxAvoided,
    totalTaxSavings: Math.round(totalTaxSavings),
    totalIncomeReceived: Math.round(cumulativeIncome),
    charitableRemainder: Math.round(charitableRemainder),
    iulFinalDeathBenefit: Math.round(iulFinalDB),
    wealthReplacementRatio: Math.round(wealthRatio * 100) / 100,
    netAdvantageOverSelling: Math.round(netAdvantage),
    recommendation,
    irsReferences: [
      "IRC §664 — Charitable Remainder Trust requirements",
      "IRC §170(f)(2)(A) — Charitable deduction for CRT contributions",
      "IRC §1001 — No gain recognition on transfer to CRT",
      "IRC §7702 — IUL tax-free death benefit",
      "IRC §2042 — ILIT excludes death benefit from estate",
      "IRC §2055 — Estate tax charitable deduction for remainder",
    ],
  };
}
