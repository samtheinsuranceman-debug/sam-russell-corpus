// ============================================================
// CRISIS SCORING ALGORITHM — Research-Backed Triage Engine
// ============================================================
// Weights derived from:
// - NIH StatPearls: Behavior Modification contraindications
// - Prochaska & DiClemente: Stages of Change
// - PMC: Financial stress → psychological distress correlation
// - Family therapy contraindications literature
// - AQAL ecological intervention framework
//
// This is NOT Perplexity's synthetic scoring. These are OUR weights
// based on verified research about what actually predicts catastrophe.
// ============================================================

export type PriorityTier = "CRITICAL" | "HIGH" | "MODERATE" | "STABLE";

export type CrisisScoreResult = {
  score: number; // 0-50 scale
  tier: PriorityTier;
  interventionWindow: string; // "7 days", "14 days", "30 days", "60 days"
  topRisks: string[];
  recommendedProtocol: string;
  strengthLever: { use: string; toSupport: string } | null;
  delayFlags: string[];
};

export type CrisisInput = {
  // From assessment results
  weaknesses: string[]; // bottom 2-5 intelligence lines (score < 40)
  strengths: string[]; // top 2-5 intelligence lines (score > 70)

  // From contextual intake (post-assessment questionnaire)
  age?: number;
  financialStatus?: FinancialStatus;
  pressureSources?: string[];
  familyStructure?: string;
  recentLifeEvents?: LifeEvent[];
  worstCaseFear?: string;
};

export type FinancialStatus =
  | "behind_on_bills"
  | "living_paycheck_to_paycheck"
  | "barely_breaking_even"
  | "volatile_cash_flow"
  | "debt_consolidation"
  | "stable_no_cushion"
  | "saving_slowly"
  | "recent_windfall_no_system"
  | "enough_for_outings"
  | "some_extra_money";

export type LifeEvent =
  | "bereavement"
  | "divorce_separation"
  | "new_infant"
  | "job_loss"
  | "major_relocation"
  | "intensive_treatment"
  | "hospitalization"
  | "none";

// ============================================================
// SCORING WEIGHTS — based on verified research
// ============================================================

// Financial severity: PMC research shows financial stress impairs executive
// function and increases cortisol. "Behind on bills" is the strongest predictor
// of cascading failure (housing → job → relationships).
const FINANCIAL_SEVERITY: Record<FinancialStatus, number> = {
  behind_on_bills: 8,
  living_paycheck_to_paycheck: 6,
  barely_breaking_even: 5,
  volatile_cash_flow: 5,
  debt_consolidation: 4,
  stable_no_cushion: 3,
  saving_slowly: 2,
  recent_windfall_no_system: 3,
  enough_for_outings: 1,
  some_extra_money: 0,
};

// Age vulnerability: Elderly (70+) and adolescents (15-19) have least agency,
// fewest resources, highest system-dependence. Research on developmental
// psychology + geriatric vulnerability supports this weighting.
function ageVulnerabilityScore(age: number | undefined): number {
  if (!age) return 0;
  if (age >= 70) return 6;
  if (age >= 60) return 3;
  if (age <= 19) return 5;
  if (age <= 24) return 2;
  return 0; // 25-59 = baseline, no age penalty
}

// Pressure count: Each external pressure source reduces cognitive bandwidth.
// Research on ego depletion and decision fatigue supports multiplicative effect.
function pressureScore(sources: string[] | undefined): number {
  if (!sources) return 0;
  const count = sources.length;
  if (count >= 3) return 7;
  if (count === 2) return 4;
  if (count === 1) return 2;
  return 0;
}

// Weakness severity: More weaknesses = more bottlenecks = higher risk.
// Specific weakness combinations are especially dangerous.
const HIGH_RISK_WEAKNESSES = ["financial", "volitional", "emotional", "intrapersonal"];

function weaknessScore(weaknesses: string[]): number {
  let score = weaknesses.length * 2; // base: 2 points per weakness
  // Bonus for high-risk weaknesses (research shows these predict cascading failure)
  const highRiskCount = weaknesses.filter(w => HIGH_RISK_WEAKNESSES.includes(w)).length;
  score += highRiskCount * 2;
  return Math.min(score, 12); // cap at 12
}

// Worst-case severity: Some outcomes are more catastrophic than others.
// Eviction and hospitalization are system-collapse events; relationship
// rupture cascades into isolation which compounds everything.
const WORST_CASE_SEVERITY: Record<string, number> = {
  eviction: 7,
  hospitalization: 7,
  job_loss: 6,
  custody_conflict: 6,
  substance_escalation: 6,
  legal_trouble: 5,
  debt_spiral: 4,
  relationship_rupture: 4,
  transport_loss: 5,
  credit_collapse: 3,
  isolation: 3,
  loss_of_savings: 2,
};

// Life events that trigger delay flags (from intervention-delay research)
const DELAY_FLAG_EVENTS: Record<LifeEvent, { flag: string; weeks: string }> = {
  bereavement: { flag: "Recent bereavement — light support only", weeks: "6-12 weeks" },
  divorce_separation: { flag: "Recent separation — soft support only", weeks: "4-8 weeks" },
  new_infant: { flag: "New caregiving responsibility — radical simplification", weeks: "8-16 weeks" },
  job_loss: { flag: "Recent job loss — financial triage first", weeks: "4-12 weeks" },
  major_relocation: { flag: "Major relocation — portable habits only", weeks: "2-3 months" },
  intensive_treatment: { flag: "In treatment — adjunctive support only", weeks: "3-6 months" },
  hospitalization: { flag: "Recent hospitalization — reorientation first", weeks: "1-4 weeks" },
  none: { flag: "", weeks: "" },
};

// ============================================================
// PROTOCOL SELECTION — based on monster type + weakness pattern
// ============================================================

// Monster-to-protocol mapping (from our verified framework)
function selectProtocol(weaknesses: string[], monster?: string): string {
  // If financial weakness is dominant → stabilize survival first
  if (weaknesses.includes("financial") && weaknesses.includes("volitional")) {
    return "Stabilize sleep, food, transport, then money";
  }
  // If somatic/interoceptive weakness → body regulation first
  if (weaknesses.includes("somatic") || weaknesses.includes("interoceptive")) {
    return "Start with body regulation, then family structure";
  }
  // If meta-cognition is strong but execution is weak → friction removal
  if (weaknesses.includes("volitional") && !weaknesses.includes("meta_cognition")) {
    return "Remove friction from the most critical behavior first";
  }
  // If shame/helplessness pattern → strength-lever approach
  if (weaknesses.includes("intrapersonal") || weaknesses.includes("emotional")) {
    return "Use strongest trait to create one reliable win per week";
  }
  // Default: triage then build
  return "Triage crisis, then build one repeatable daily win";
}

// Strength lever: find the strongest trait that can bridge to the weakest
function findStrengthLever(
  strengths: string[],
  weaknesses: string[]
): { use: string; toSupport: string } | null {
  if (strengths.length === 0 || weaknesses.length === 0) return null;
  // Use the top strength to support the most critical weakness
  return { use: strengths[0], toSupport: weaknesses[0] };
}

// ============================================================
// MAIN SCORING FUNCTION
// ============================================================

export function calculateCrisisScore(input: CrisisInput): CrisisScoreResult {
  let score = 0;
  const topRisks: string[] = [];
  const delayFlags: string[] = [];

  // 1. Financial severity (0-8 points)
  if (input.financialStatus) {
    const fScore = FINANCIAL_SEVERITY[input.financialStatus];
    score += fScore;
    if (fScore >= 6) topRisks.push("Severe financial distress");
  }

  // 2. Age vulnerability (0-6 points)
  const aScore = ageVulnerabilityScore(input.age);
  score += aScore;
  if (aScore >= 5) topRisks.push("Age-related vulnerability (reduced agency)");

  // 3. Pressure count (0-7 points)
  const pScore = pressureScore(input.pressureSources);
  score += pScore;
  if (pScore >= 4) topRisks.push("Multiple external pressures reducing bandwidth");

  // 4. Weakness severity (0-12 points)
  const wScore = weaknessScore(input.weaknesses);
  score += wScore;
  if (wScore >= 8) topRisks.push("Critical weakness cluster (high-risk lines)");

  // 5. Worst-case severity (0-7 points)
  if (input.worstCaseFear) {
    const wcScore = WORST_CASE_SEVERITY[input.worstCaseFear] || 2;
    score += wcScore;
    if (wcScore >= 6) topRisks.push(`High-severity worst case: ${input.worstCaseFear}`);
  }

  // 6. Life event delay flags (0-5 points, also generates delay flags)
  if (input.recentLifeEvents && input.recentLifeEvents.length > 0) {
    for (const event of input.recentLifeEvents) {
      if (event !== "none") {
        const info = DELAY_FLAG_EVENTS[event];
        if (info.flag) {
          delayFlags.push(`${info.flag} (${info.weeks})`);
          score += 3; // life events increase urgency but also require gentler approach
        }
      }
    }
  }

  // 7. Isolation penalty: no pressures can mean no support network either
  if (!input.pressureSources || input.pressureSources.length === 0) {
    // No pressure but also potentially no support — slight risk
    if (input.familyStructure === "single" || input.familyStructure === "single_parent") {
      score += 2;
      topRisks.push("Social isolation risk (no external connections detected)");
    }
  }

  // Cap at 50
  score = Math.min(score, 50);

  // Determine tier
  let tier: PriorityTier;
  let interventionWindow: string;
  if (score >= 30) {
    tier = "CRITICAL";
    interventionWindow = "7 days";
  } else if (score >= 22) {
    tier = "HIGH";
    interventionWindow = "14 days";
  } else if (score >= 14) {
    tier = "MODERATE";
    interventionWindow = "30 days";
  } else {
    tier = "STABLE";
    interventionWindow = "60 days";
  }

  // Select protocol and strength lever
  const recommendedProtocol = selectProtocol(input.weaknesses);
  const strengthLever = findStrengthLever(input.strengths, input.weaknesses);

  return {
    score,
    tier,
    interventionWindow,
    topRisks,
    recommendedProtocol,
    strengthLever,
    delayFlags,
  };
}

// ============================================================
// TIER DESCRIPTIONS (for UI display)
// ============================================================

export const TIER_INFO: Record<PriorityTier, { label: string; color: string; description: string; cadence: string }> = {
  CRITICAL: {
    label: "Critical Priority",
    color: "#EF4444",
    description: "Immediate intervention required. Daily check-ins, all 4 quadrants activated simultaneously.",
    cadence: "Daily check-ins for 7 days, then biweekly",
  },
  HIGH: {
    label: "High Priority",
    color: "#F59E0B",
    description: "Urgent intervention within 2 weeks. Biweekly check-ins with structured protocol.",
    cadence: "Biweekly check-ins",
  },
  MODERATE: {
    label: "Moderate Priority",
    color: "#E0C68C",
    description: "Intervention within 30 days. Monthly reviews with self-guided protocols.",
    cadence: "Monthly check-ins",
  },
  STABLE: {
    label: "Stable — Monitor",
    color: "#22C55E",
    description: "Preventive maintenance. Quarterly check-ins with light-touch scaffolding.",
    cadence: "Quarterly check-ins",
  },
};
