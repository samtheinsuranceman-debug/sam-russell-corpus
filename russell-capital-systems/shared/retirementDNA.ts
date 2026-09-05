/**
 * W4: Retirement DNA — First-Meeting Branded Report Generator
 * 
 * Transforms the Ecological Drivers page from a data-entry form into a
 * diagnostic engine that produces a "Retirement DNA" profile — a branded,
 * client-facing document that advisors hand to prospects in the first meeting.
 * 
 * The DNA profile distills 8 ecological drivers into a single-page visual
 * fingerprint that makes the client feel *understood* before a single product
 * is mentioned. This is the switching-cost moat: once a client sees their DNA,
 * they associate that insight with the advisor who showed it to them.
 */

// ── Driver Definitions ──────────────────────────────────────────────────────

export type DriverId =
  | "health"
  | "longevity"
  | "lifestyle"
  | "legacy"
  | "income_stability"
  | "tax_exposure"
  | "inflation_sensitivity"
  | "market_vulnerability";

export interface DriverScore {
  id: DriverId;
  label: string;
  score: number;        // 0-100
  percentile: number;   // vs peer cohort
  insight: string;      // one-sentence plain-English takeaway
  color: string;        // hex for radar chart segment
}

export interface RetirementDNAProfile {
  clientName: string;
  advisorName: string;
  generatedAt: Date;
  overallReadiness: number;       // 0-100 composite
  readinessLabel: string;         // "Strong", "Moderate", "Needs Attention", "Critical"
  archetype: RetirementArchetype;
  drivers: DriverScore[];
  topStrength: DriverScore;
  topVulnerability: DriverScore;
  actionItems: ActionItem[];
  peerComparison: PeerComparison;
}

export interface RetirementArchetype {
  name: string;
  emoji: string;
  description: string;
  commonTraits: string[];
  strategicFocus: string;
}

export interface ActionItem {
  priority: 1 | 2 | 3;
  title: string;
  description: string;
  estimatedImpact: string;  // e.g., "+$1,200/mo income" or "−15% tax exposure"
  relatedDriver: DriverId;
}

export interface PeerComparison {
  cohortLabel: string;       // e.g., "Ages 55-64, $500K-$1M assets"
  cohortSize: number;
  percentileRank: number;    // 0-100
  aboveAverageDrivers: DriverId[];
  belowAverageDrivers: DriverId[];
}

// ── Driver Metadata ─────────────────────────────────────────────────────────

const DRIVER_META: Record<DriverId, { label: string; color: string; weight: number }> = {
  health:                { label: "Health & Longevity Planning",   color: "#10b981", weight: 0.15 },
  longevity:             { label: "Longevity Risk Awareness",      color: "#06b6d4", weight: 0.12 },
  lifestyle:             { label: "Lifestyle Sustainability",      color: "#8b5cf6", weight: 0.13 },
  legacy:                { label: "Legacy & Estate Readiness",     color: "#f59e0b", weight: 0.10 },
  income_stability:      { label: "Income Stability",              color: "#3b82f6", weight: 0.18 },
  tax_exposure:          { label: "Tax Exposure Management",       color: "#ef4444", weight: 0.12 },
  inflation_sensitivity: { label: "Inflation Resilience",          color: "#f97316", weight: 0.10 },
  market_vulnerability:  { label: "Market Vulnerability Shield",   color: "#ec4899", weight: 0.10 },
};

// ── Archetypes ──────────────────────────────────────────────────────────────

const ARCHETYPES: RetirementArchetype[] = [
  {
    name: "The Guardian",
    emoji: "🛡️",
    description: "Conservative protector focused on guaranteed income and capital preservation. Values certainty over growth.",
    commonTraits: ["High income stability", "Low market exposure", "Strong legacy planning"],
    strategicFocus: "Guaranteed income products, fixed annuities, and estate protection",
  },
  {
    name: "The Builder",
    emoji: "🏗️",
    description: "Growth-oriented planner still in accumulation mode. Willing to accept volatility for higher long-term returns.",
    commonTraits: ["High market tolerance", "Growth-focused", "Active tax planning"],
    strategicFocus: "IUL strategies, Roth conversions, and indexed products with upside participation",
  },
  {
    name: "The Optimizer",
    emoji: "⚡",
    description: "Tax-efficiency maximizer who sees every dollar through a tax lens. Sophisticated and detail-oriented.",
    commonTraits: ["Tax-aware", "Multi-strategy", "Data-driven decisions"],
    strategicFocus: "Solar Strategy (Roth conversion), tax-loss harvesting, and multi-account sequencing",
  },
  {
    name: "The Steward",
    emoji: "🌳",
    description: "Legacy-first planner whose primary concern is wealth transfer and family protection.",
    commonTraits: ["Strong legacy focus", "Estate planning priority", "Multi-generational thinking"],
    strategicFocus: "Estate flow optimization, ILIT strategies, and beneficiary structuring",
  },
  {
    name: "The Navigator",
    emoji: "🧭",
    description: "Balanced planner who needs guidance across multiple dimensions. Open to comprehensive planning.",
    commonTraits: ["Moderate across all drivers", "Seeks professional guidance", "Holistic approach"],
    strategicFocus: "Comprehensive financial plan with balanced allocation across income, growth, and protection",
  },
];

// ── Core Scoring Engine ─────────────────────────────────────────────────────

export interface EcologicalInputs {
  age: number;
  retirementAge: number;
  currentIncome: number;
  totalAssets: number;
  guaranteedIncome: number;        // SS + pensions + annuity income
  healthStatus: "excellent" | "good" | "fair" | "poor";
  familyLongevity: number;         // avg age of parents/grandparents at death
  desiredLifestyle: "modest" | "comfortable" | "affluent" | "luxury";
  legacyGoal: number;              // $ amount to leave behind
  taxableAccountPct: number;       // % of assets in taxable accounts
  fixedIncomePct: number;          // % of portfolio in fixed income
  inflationConcern: 1 | 2 | 3 | 4 | 5;
  marketLossTolerance: number;     // max % drawdown before panic
  hasEstatePlan: boolean;
  hasLongTermCare: boolean;
  monthlyExpenses: number;
  debtTotal: number;
  stateOfResidence: string;
}

export function generateRetirementDNA(
  inputs: EcologicalInputs,
  clientName: string,
  advisorName: string
): RetirementDNAProfile {
  const drivers = scoreAllDrivers(inputs);
  const overall = computeOverallReadiness(drivers);
  const archetype = determineArchetype(drivers);
  const sorted = [...drivers].sort((a, b) => b.score - a.score);
  const topStrength = sorted[0];
  const topVulnerability = sorted[sorted.length - 1];
  const actionItems = generateActionItems(drivers, inputs);
  const peerComparison = generatePeerComparison(drivers, inputs);

  return {
    clientName,
    advisorName,
    generatedAt: new Date(),
    overallReadiness: overall.score,
    readinessLabel: overall.label,
    archetype,
    drivers,
    topStrength,
    topVulnerability,
    actionItems,
    peerComparison,
  };
}

function scoreAllDrivers(inputs: EcologicalInputs): DriverScore[] {
  const driverIds: DriverId[] = [
    "health", "longevity", "lifestyle", "legacy",
    "income_stability", "tax_exposure", "inflation_sensitivity", "market_vulnerability",
  ];

  return driverIds.map((id) => {
    const meta = DRIVER_META[id];
    const score = scoreDriver(id, inputs);
    const percentile = estimatePercentile(score, id);
    const insight = generateInsight(id, score, inputs);

    return {
      id,
      label: meta.label,
      score,
      percentile,
      insight,
      color: meta.color,
    };
  });
}

function scoreDriver(id: DriverId, inputs: EcologicalInputs): number {
  switch (id) {
    case "health": {
      const healthMap = { excellent: 90, good: 70, fair: 45, poor: 20 };
      const base = healthMap[inputs.healthStatus];
      const ltcBonus = inputs.hasLongTermCare ? 10 : 0;
      return Math.min(100, base + ltcBonus);
    }
    case "longevity": {
      const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.age);
      const planningHorizon = inputs.familyLongevity - inputs.age;
      const horizonScore = planningHorizon > 30 ? 40 : planningHorizon > 20 ? 60 : planningHorizon > 10 ? 80 : 95;
      const prepScore = yearsToRetirement > 15 ? 90 : yearsToRetirement > 10 ? 75 : yearsToRetirement > 5 ? 55 : 35;
      return Math.round((horizonScore + prepScore) / 2);
    }
    case "lifestyle": {
      const incomeReplacement = inputs.guaranteedIncome / Math.max(1, inputs.monthlyExpenses);
      const lifestyleMap = { modest: 0.7, comfortable: 0.85, affluent: 1.0, luxury: 1.2 };
      const target = lifestyleMap[inputs.desiredLifestyle];
      const ratio = incomeReplacement / target;
      return Math.min(100, Math.round(ratio * 80));
    }
    case "legacy": {
      if (inputs.legacyGoal === 0) return 80; // No legacy goal = no gap
      const legacyFunded = inputs.totalAssets / Math.max(1, inputs.legacyGoal);
      const estatePlanBonus = inputs.hasEstatePlan ? 15 : 0;
      return Math.min(100, Math.round(legacyFunded * 60 + estatePlanBonus));
    }
    case "income_stability": {
      const guaranteedRatio = inputs.guaranteedIncome / Math.max(1, inputs.monthlyExpenses);
      const debtBurden = inputs.debtTotal / Math.max(1, inputs.totalAssets);
      const incomeScore = Math.min(100, guaranteedRatio * 100);
      const debtPenalty = Math.min(30, debtBurden * 100);
      return Math.max(0, Math.round(incomeScore - debtPenalty));
    }
    case "tax_exposure": {
      // Lower taxable account % = better score (less tax exposure)
      const taxableScore = 100 - inputs.taxableAccountPct;
      return Math.max(0, Math.round(taxableScore));
    }
    case "inflation_sensitivity": {
      // Higher concern + lower fixed income = more vulnerable
      const concernPenalty = inputs.inflationConcern * 10;
      const fixedIncomePenalty = inputs.fixedIncomePct * 0.3;
      return Math.max(0, Math.round(100 - concernPenalty - fixedIncomePenalty));
    }
    case "market_vulnerability": {
      // Higher loss tolerance = better score (less vulnerable to panic selling)
      const toleranceScore = inputs.marketLossTolerance * 3;
      const equityExposure = 100 - inputs.fixedIncomePct;
      const balanceBonus = Math.abs(equityExposure - 60) < 20 ? 15 : 0; // balanced portfolio bonus
      return Math.min(100, Math.round(toleranceScore + balanceBonus));
    }
    default:
      return 50;
  }
}

function estimatePercentile(score: number, _driverId: DriverId): number {
  // Simplified percentile estimation based on normal distribution assumption
  // In production, this would query actual cohort data
  if (score >= 90) return 95;
  if (score >= 80) return 85;
  if (score >= 70) return 70;
  if (score >= 60) return 55;
  if (score >= 50) return 40;
  if (score >= 40) return 25;
  return 10;
}

function computeOverallReadiness(drivers: DriverScore[]): { score: number; label: string } {
  let weighted = 0;
  let totalWeight = 0;

  for (const d of drivers) {
    const meta = DRIVER_META[d.id];
    weighted += d.score * meta.weight;
    totalWeight += meta.weight;
  }

  const score = Math.round(weighted / totalWeight);
  const label =
    score >= 80 ? "Strong" :
    score >= 60 ? "Moderate" :
    score >= 40 ? "Needs Attention" :
    "Critical";

  return { score, label };
}

function determineArchetype(drivers: DriverScore[]): RetirementArchetype {
  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d.score])) as Record<DriverId, number>;

  // Score each archetype based on driver alignment
  const archetypeScores = ARCHETYPES.map((arch) => {
    let alignment = 0;

    switch (arch.name) {
      case "The Guardian":
        alignment = driverMap.income_stability * 0.4 + (100 - driverMap.market_vulnerability) * 0.3 + driverMap.legacy * 0.3;
        break;
      case "The Builder":
        alignment = driverMap.market_vulnerability * 0.4 + (100 - driverMap.tax_exposure) * 0.3 + driverMap.lifestyle * 0.3;
        break;
      case "The Optimizer":
        alignment = (100 - driverMap.tax_exposure) * 0.5 + driverMap.income_stability * 0.25 + driverMap.inflation_sensitivity * 0.25;
        break;
      case "The Steward":
        alignment = driverMap.legacy * 0.5 + driverMap.health * 0.25 + driverMap.longevity * 0.25;
        break;
      case "The Navigator":
        // Balanced = low variance across drivers
        const avg = drivers.reduce((s, d) => s + d.score, 0) / drivers.length;
        const variance = drivers.reduce((s, d) => s + Math.pow(d.score - avg, 2), 0) / drivers.length;
        alignment = Math.max(0, 100 - variance);
        break;
    }

    return { archetype: arch, alignment };
  });

  archetypeScores.sort((a, b) => b.alignment - a.alignment);
  return archetypeScores[0].archetype;
}

function generateInsight(id: DriverId, score: number, inputs: EcologicalInputs): string {
  const level = score >= 75 ? "strong" : score >= 50 ? "moderate" : "weak";

  const insights: Record<DriverId, Record<string, string>> = {
    health: {
      strong: "Your health planning is well-positioned with proactive coverage in place.",
      moderate: "Consider strengthening your health safety net with long-term care planning.",
      weak: "Health-related expenses could significantly impact your retirement — prioritize LTC coverage.",
    },
    longevity: {
      strong: "Your planning horizon accounts for a long, fulfilling retirement.",
      moderate: "You may need to extend your income planning to cover a longer retirement than expected.",
      weak: `With ${inputs.familyLongevity - inputs.age} potential years ahead, your current plan may fall short.`,
    },
    lifestyle: {
      strong: "Your guaranteed income covers your desired lifestyle comfortably.",
      moderate: "There's a gap between your desired lifestyle and guaranteed income sources.",
      weak: "Your lifestyle expectations significantly exceed your guaranteed income — this is the #1 priority.",
    },
    legacy: {
      strong: "Your estate plan is well-funded and structured for efficient wealth transfer.",
      moderate: "Your legacy goals are partially funded — consider estate optimization strategies.",
      weak: "Your legacy goals require significant planning to avoid estate tax erosion.",
    },
    income_stability: {
      strong: "Your income foundation is rock-solid with strong guaranteed sources.",
      moderate: "Adding guaranteed income sources would strengthen your retirement floor.",
      weak: "Your retirement income relies too heavily on market-dependent sources.",
    },
    tax_exposure: {
      strong: "Your tax positioning is excellent — most assets are in tax-advantaged accounts.",
      moderate: `${inputs.taxableAccountPct}% of your assets face ongoing tax drag — Roth conversion could help.`,
      weak: `${inputs.taxableAccountPct}% taxable exposure is a significant drag — the Solar Strategy could save substantially.`,
    },
    inflation_sensitivity: {
      strong: "Your portfolio has built-in inflation protection through growth-oriented holdings.",
      moderate: "Some inflation vulnerability exists — consider inflation-indexed income sources.",
      weak: "High fixed-income allocation combined with inflation concern creates purchasing power risk.",
    },
    market_vulnerability: {
      strong: "You have the temperament and allocation to weather market storms.",
      moderate: "A market correction could test your resolve — consider adding a guaranteed income floor.",
      weak: "A significant market downturn could trigger panic selling — protection strategies are essential.",
    },
  };

  return insights[id][level];
}

function generateActionItems(drivers: DriverScore[], inputs: EcologicalInputs): ActionItem[] {
  const items: ActionItem[] = [];
  const sorted = [...drivers].sort((a, b) => a.score - b.score);

  // Generate action items for the 3 weakest drivers
  for (const driver of sorted.slice(0, 3)) {
    switch (driver.id) {
      case "income_stability":
        items.push({
          priority: 1,
          title: "Establish Guaranteed Income Floor",
          description: "Add a lifetime income annuity to cover essential expenses regardless of market conditions.",
          estimatedImpact: `+$${Math.round(inputs.monthlyExpenses * 0.3).toLocaleString()}/mo guaranteed`,
          relatedDriver: "income_stability",
        });
        break;
      case "tax_exposure":
        items.push({
          priority: 1,
          title: "Implement Solar Strategy (Roth Conversion)",
          description: "Convert taxable assets through the Solar ITC pathway to create tax-free lifetime income.",
          estimatedImpact: `−${inputs.taxableAccountPct}% tax exposure + 22-28% bonus`,
          relatedDriver: "tax_exposure",
        });
        break;
      case "market_vulnerability":
        items.push({
          priority: 2,
          title: "Add Market Protection Layer",
          description: "Shift a portion of market-exposed assets into indexed products with downside protection.",
          estimatedImpact: `Protect ${Math.round(inputs.totalAssets * 0.3).toLocaleString()} from drawdowns`,
          relatedDriver: "market_vulnerability",
        });
        break;
      case "legacy":
        items.push({
          priority: 2,
          title: "Optimize Estate Transfer Strategy",
          description: "Structure beneficiary designations and consider ILIT for tax-efficient wealth transfer.",
          estimatedImpact: `Save up to ${Math.round(inputs.legacyGoal * 0.4).toLocaleString()} in estate taxes`,
          relatedDriver: "legacy",
        });
        break;
      case "health":
        items.push({
          priority: 2,
          title: "Secure Long-Term Care Coverage",
          description: "Add hybrid LTC/life insurance to protect against catastrophic health expenses.",
          estimatedImpact: "Protect $200K+ in potential LTC costs",
          relatedDriver: "health",
        });
        break;
      case "inflation_sensitivity":
        items.push({
          priority: 3,
          title: "Add Inflation-Protected Income",
          description: "Incorporate TIPS, I-bonds, or inflation-indexed annuity riders into your income plan.",
          estimatedImpact: "Maintain purchasing power over 30+ year horizon",
          relatedDriver: "inflation_sensitivity",
        });
        break;
      case "lifestyle":
        items.push({
          priority: 1,
          title: "Close the Lifestyle Income Gap",
          description: "Your desired lifestyle requires more guaranteed income than currently planned.",
          estimatedImpact: `+$${Math.round((inputs.monthlyExpenses - inputs.guaranteedIncome) * 0.5).toLocaleString()}/mo needed`,
          relatedDriver: "lifestyle",
        });
        break;
      case "longevity":
        items.push({
          priority: 3,
          title: "Extend Income Planning Horizon",
          description: "Plan for income lasting to age 95+ to avoid running out of money in late retirement.",
          estimatedImpact: `Cover ${Math.max(0, 95 - inputs.retirementAge)} additional years`,
          relatedDriver: "longevity",
        });
        break;
    }
  }

  return items.sort((a, b) => a.priority - b.priority);
}

function generatePeerComparison(drivers: DriverScore[], inputs: EcologicalInputs): PeerComparison {
  // Determine cohort
  const ageRange =
    inputs.age < 45 ? "35-44" :
    inputs.age < 55 ? "45-54" :
    inputs.age < 65 ? "55-64" :
    "65+";

  const assetRange =
    inputs.totalAssets < 250000 ? "Under $250K" :
    inputs.totalAssets < 500000 ? "$250K-$500K" :
    inputs.totalAssets < 1000000 ? "$500K-$1M" :
    inputs.totalAssets < 3000000 ? "$1M-$3M" :
    "$3M+";

  const avgScore = drivers.reduce((s, d) => s + d.score, 0) / drivers.length;
  const percentileRank = estimatePercentile(avgScore, "income_stability");

  return {
    cohortLabel: `Ages ${ageRange}, ${assetRange} assets`,
    cohortSize: Math.round(Math.random() * 500 + 200), // placeholder
    percentileRank,
    aboveAverageDrivers: drivers.filter((d) => d.percentile >= 70).map((d) => d.id),
    belowAverageDrivers: drivers.filter((d) => d.percentile <= 30).map((d) => d.id),
  };
}

// ── Export all archetypes for UI rendering ───────────────────────────────────
export const ALL_ARCHETYPES = ARCHETYPES;
export const ALL_DRIVER_META = DRIVER_META;
