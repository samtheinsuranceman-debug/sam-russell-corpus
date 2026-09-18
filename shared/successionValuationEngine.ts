/**
 * SISTER INVENTION SI-017: Automated Succession Planning Valuation Engine
 * Patent Reference: Extends PAT-015 (Practice Management Platform)
 * 
 * Values advisor practices using revenue multiples, client demographics,
 * retention probability models, and growth trajectory analysis.
 */

export interface PracticeMetrics {
  annualRevenue: number;
  recurringRevenue: number;      // % that is recurring (0-1)
  clientCount: number;
  avgClientAge: number;
  avgClientAssets: number;
  retentionRate: number;         // Annual client retention (0-1)
  growthRate: number;            // Annual revenue growth (0-1)
  yearsInBusiness: number;
  staffCount: number;
  ownerAge: number;
  ownerDependency: number;       // How dependent on owner (0-1, 1=fully dependent)
}

export interface ValuationResult {
  revenueMultiple: number;
  adjustedMultiple: number;
  baseValuation: number;
  adjustedValuation: number;
  discountedCashFlow: number;
  comparableValuation: number;
  weightedValuation: number;
  valuationRange: { low: number; high: number };
  riskFactors: RiskFactor[];
  enhancementOpportunities: Enhancement[];
  transitionTimeline: TransitionYear[];
  buyerProfiles: BuyerProfile[];
}

export interface RiskFactor {
  name: string;
  impact: number;      // -1 to 0 (negative impact on value)
  description: string;
  mitigation: string;
}

export interface Enhancement {
  name: string;
  potentialIncrease: number;  // Dollar amount
  effort: "low" | "medium" | "high";
  timeframe: string;
}

export interface TransitionYear {
  year: number;
  ownerRole: string;
  revenueRetained: number;
  clientsTransitioned: number;
  paymentToSeller: number;
}

export interface BuyerProfile {
  type: string;
  typicalMultiple: number;
  pros: string[];
  cons: string[];
  likelihood: number;  // 0-100
}

/**
 * Calculate practice valuation using multiple methodologies
 */
export function valuatePractice(metrics: PracticeMetrics): ValuationResult {
  // Base revenue multiple (industry standard 1.5-3.5x)
  let baseMultiple = 2.0;

  // Adjust for recurring revenue (higher = better)
  baseMultiple += metrics.recurringRevenue * 1.0;

  // Adjust for retention
  baseMultiple += (metrics.retentionRate - 0.90) * 5;

  // Adjust for growth
  baseMultiple += metrics.growthRate * 2;

  // Adjust for owner dependency (higher dependency = lower multiple)
  baseMultiple -= metrics.ownerDependency * 0.8;

  // Adjust for client demographics
  if (metrics.avgClientAge < 55) baseMultiple += 0.3;
  if (metrics.avgClientAssets > 1000000) baseMultiple += 0.2;

  // Clamp
  baseMultiple = Math.max(1.0, Math.min(4.5, baseMultiple));

  const baseVal = metrics.annualRevenue * baseMultiple;

  // DCF (10-year, 12% discount rate)
  let dcf = 0;
  const discountRate = 0.12;
  for (let y = 1; y <= 10; y++) {
    const projRevenue = metrics.annualRevenue * Math.pow(1 + metrics.growthRate, y);
    const projProfit = projRevenue * 0.35; // ~35% profit margin
    const retentionAdj = Math.pow(metrics.retentionRate, y);
    dcf += (projProfit * retentionAdj) / Math.pow(1 + discountRate, y);
  }
  // Terminal value
  const terminalValue = (metrics.annualRevenue * Math.pow(1 + metrics.growthRate, 10) * 0.35) / (discountRate - metrics.growthRate);
  dcf += terminalValue / Math.pow(1 + discountRate, 10);

  // Comparable valuation (peer benchmarks)
  const comparableMultiple = metrics.recurringRevenue > 0.7 ? 3.0 : metrics.recurringRevenue > 0.4 ? 2.5 : 2.0;
  const comparableVal = metrics.annualRevenue * comparableMultiple;

  // Weighted average (40% DCF, 35% multiple, 25% comparable)
  const weighted = dcf * 0.40 + baseVal * 0.35 + comparableVal * 0.25;

  // Risk factors
  const risks: RiskFactor[] = [];
  if (metrics.ownerDependency > 0.7) {
    risks.push({ name: "High Owner Dependency", impact: -0.15, description: "Practice value heavily tied to owner relationships", mitigation: "Hire associate advisors and transition client relationships over 2-3 years" });
  }
  if (metrics.retentionRate < 0.90) {
    risks.push({ name: "Below-Average Retention", impact: -0.10, description: `${(metrics.retentionRate * 100).toFixed(0)}% retention is below industry 92% benchmark`, mitigation: "Implement client engagement scoring and proactive outreach" });
  }
  if (metrics.avgClientAge > 65) {
    risks.push({ name: "Aging Client Base", impact: -0.12, description: "Clients may draw down assets or pass away, reducing AUM", mitigation: "Target next-gen wealth transfer and younger client acquisition" });
  }
  if (metrics.recurringRevenue < 0.5) {
    risks.push({ name: "Low Recurring Revenue", impact: -0.08, description: "Transaction-based revenue is less predictable", mitigation: "Shift to AUM-based or subscription fee models" });
  }

  // Enhancement opportunities
  const enhancements: Enhancement[] = [
    { name: "Increase recurring revenue to 80%+", potentialIncrease: metrics.annualRevenue * 0.3, effort: "medium", timeframe: "12-18 months" },
    { name: "Reduce owner dependency below 40%", potentialIncrease: metrics.annualRevenue * 0.25, effort: "high", timeframe: "24-36 months" },
    { name: "Improve retention to 95%+", potentialIncrease: metrics.annualRevenue * 0.15, effort: "low", timeframe: "6-12 months" },
    { name: "Add 2+ associate advisors", potentialIncrease: metrics.annualRevenue * 0.20, effort: "high", timeframe: "12-24 months" },
    { name: "Implement technology stack (CRM, planning)", potentialIncrease: metrics.annualRevenue * 0.10, effort: "medium", timeframe: "3-6 months" },
  ];

  // 5-year transition timeline
  const timeline: TransitionYear[] = [];
  for (let y = 1; y <= 5; y++) {
    timeline.push({
      year: y,
      ownerRole: y <= 2 ? "Full-time advisor" : y <= 3 ? "Part-time advisor" : y <= 4 ? "Consultant" : "Retired",
      revenueRetained: Math.round((1 - y * 0.15) * 100),
      clientsTransitioned: Math.round(y * 20),
      paymentToSeller: Math.round(weighted * (y <= 3 ? 0.25 : y === 4 ? 0.15 : 0.10)),
    });
  }

  // Buyer profiles
  const buyers: BuyerProfile[] = [
    { type: "Individual Advisor", typicalMultiple: 2.0, pros: ["Personal relationship continuity", "Flexible terms"], cons: ["Limited capital", "Longer transition"], likelihood: 60 },
    { type: "RIA Aggregator", typicalMultiple: 2.8, pros: ["Higher multiples", "Quick close"], cons: ["Culture change", "Less control"], likelihood: 75 },
    { type: "Private Equity", typicalMultiple: 3.2, pros: ["Highest valuation", "Growth capital"], cons: ["Performance pressure", "Exit timeline"], likelihood: 40 },
    { type: "Bank/Wirehouse", typicalMultiple: 2.5, pros: ["Stable platform", "Benefits"], cons: ["Bureaucracy", "Product restrictions"], likelihood: 30 },
  ];

  return {
    revenueMultiple: Math.round(baseMultiple * 100) / 100,
    adjustedMultiple: Math.round((weighted / metrics.annualRevenue) * 100) / 100,
    baseValuation: Math.round(baseVal),
    adjustedValuation: Math.round(weighted),
    discountedCashFlow: Math.round(dcf),
    comparableValuation: Math.round(comparableVal),
    weightedValuation: Math.round(weighted),
    valuationRange: { low: Math.round(weighted * 0.80), high: Math.round(weighted * 1.25) },
    riskFactors: risks,
    enhancementOpportunities: enhancements,
    transitionTimeline: timeline,
    buyerProfiles: buyers,
  };
}
