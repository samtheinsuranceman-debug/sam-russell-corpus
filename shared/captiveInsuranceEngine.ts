/**
 * SISTER INVENTION SI-011: Captive Insurance + IUL Integration
 * Patent Reference: Extends PAT-012 (Business Owner Optimization)
 * 
 * Models 831(b) micro-captive structures with IUL investment
 * of underwriting profits for tax-advantaged wealth building.
 */

export interface CaptiveInput {
  businessRevenue: number;
  businessIncome: number;
  currentInsurancePremiums: number;
  riskProfile: "low" | "moderate" | "high";
  industry: string;
  ownerAge: number;
  ownerTaxBracket: number;
  iulPremiumPercent: number;  // % of captive profits to IUL
  projectionYears: number;
}

export interface CaptiveYear {
  year: number;
  captivePremium: number;
  taxDeduction: number;
  claimsPaid: number;
  underwritingProfit: number;
  iulContribution: number;
  iulCashValue: number;
  cumulativeTaxSavings: number;
  totalWealthCreated: number;
}

export interface CaptiveResult {
  years: CaptiveYear[];
  totalTaxSavings: number;
  totalWealthCreated: number;
  iulFinalCashValue: number;
  iulFinalDeathBenefit: number;
  roi: number;
  complianceRequirements: string[];
  irsReferences: string[];
  recommendation: string;
  riskWarnings: string[];
}

/**
 * Calculate captive insurance + IUL strategy
 */
export function calculateCaptiveStrategy(input: CaptiveInput): CaptiveResult {
  const years: CaptiveYear[] = [];

  // 831(b) election: max $2.65M premium (2024)
  const maxPremium = 2650000;
  const captivePremium = Math.min(input.currentInsurancePremiums * 1.5, maxPremium);

  // Loss ratio by risk profile
  const lossRatio = input.riskProfile === "low" ? 0.15 : input.riskProfile === "moderate" ? 0.30 : 0.50;

  let iulCV = 0;
  let cumulativeTaxSavings = 0;

  for (let y = 1; y <= input.projectionYears; y++) {
    const premium = captivePremium * Math.pow(1.03, y - 1);
    const taxDeduction = premium * input.ownerTaxBracket;
    cumulativeTaxSavings += taxDeduction;

    const claims = premium * lossRatio;
    const profit = premium - claims - premium * 0.10; // 10% admin costs
    const iulContrib = profit * input.iulPremiumPercent;

    iulCV += iulContrib;
    iulCV *= 1.065; // IUL growth
    const coi = iulCV * 0.005 * (1 + (input.ownerAge + y - 40) * 0.01);
    iulCV = Math.max(0, iulCV - coi);

    years.push({
      year: y,
      captivePremium: Math.round(premium),
      taxDeduction: Math.round(taxDeduction),
      claimsPaid: Math.round(claims),
      underwritingProfit: Math.round(profit),
      iulContribution: Math.round(iulContrib),
      iulCashValue: Math.round(iulCV),
      cumulativeTaxSavings: Math.round(cumulativeTaxSavings),
      totalWealthCreated: Math.round(iulCV + cumulativeTaxSavings),
    });
  }

  const finalYear = years[years.length - 1];
  const totalWealth = finalYear?.totalWealthCreated ?? 0;
  const iulDB = Math.max(iulCV * 2, iulCV + 500000);
  const totalInvested = years.reduce((s, y) => s + y.iulContribution, 0);
  const roi = totalInvested > 0 ? ((totalWealth / totalInvested) - 1) * 100 : 0;

  return {
    years,
    totalTaxSavings: Math.round(cumulativeTaxSavings),
    totalWealthCreated: Math.round(totalWealth),
    iulFinalCashValue: Math.round(iulCV),
    iulFinalDeathBenefit: Math.round(iulDB),
    roi: Math.round(roi),
    complianceRequirements: [
      "Captive must insure legitimate business risks (not investment risks)",
      "Premiums must be arm's-length (actuarially justified)",
      "Captive must have adequate capitalization",
      "Risk distribution: insure 3+ related entities or use risk pool",
      "Annual actuarial report required",
      "Separate books, board meetings, and governance required",
    ],
    irsReferences: [
      "IRC §831(b) — Micro-captive election ($2.65M premium limit)",
      "IRC §162 — Business expense deduction for insurance premiums",
      "IRC §501(c)(15) — Tax-exempt status for small insurance companies",
      "IRS Notice 2016-66 — Micro-captive listed transaction reporting",
      "IRC §7702 — IUL tax-free growth and death benefit",
    ],
    recommendation: `831(b) captive with IUL creates $${totalWealth.toLocaleString()} in wealth over ${input.projectionYears} years (${Math.round(roi)}% ROI). Tax savings: $${Math.round(cumulativeTaxSavings).toLocaleString()}. IUL death benefit: $${Math.round(iulDB).toLocaleString()}.`,
    riskWarnings: [
      "IRS has increased scrutiny of micro-captives (Notice 2016-66)",
      "Captive must demonstrate genuine risk transfer and risk distribution",
      "Excessive premiums without actuarial basis may trigger audit",
      "Consult with captive insurance specialist and tax attorney",
    ],
  };
}
