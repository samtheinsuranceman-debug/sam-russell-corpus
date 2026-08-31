/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LIVING RISK PROFILE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Turns a one-time risk questionnaire into a longitudinal intelligence system.
 * 
 * The insight: A client's risk tolerance is NOT static. It drifts based on:
 *   - Market conditions (people get conservative after crashes)
 *   - Life events (marriage, kids, inheritance, health scares)
 *   - Age (natural risk aversion increases with age)
 *   - Portfolio performance (winners get greedy, losers get scared)
 *
 * This engine:
 *   1. Stores each assessment as a snapshot in a timeline
 *   2. Detects drift patterns across snapshots
 *   3. Flags when drift exceeds thresholds (advisor alert)
 *   4. Generates a "Risk DNA" fingerprint unique to each client
 *   5. Predicts where the client's risk tolerance is heading
 *
 * Usage:
 *   import { analyzeRiskDrift, generateRiskDNA } from "@shared/livingRiskProfile";
 *   const drift = analyzeRiskDrift(snapshots);
 *   const dna = generateRiskDNA(latestSnapshot);
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface CategoryScore {
  key: string;
  label: string;
  score: number; // 0-100
}

export interface RiskSnapshot {
  /** When this assessment was taken */
  timestamp: number; // Unix ms
  /** Overall score 0-99 */
  overallScore: number;
  /** Per-category breakdown */
  categories: CategoryScore[];
  /** Depth level chosen (1-5) */
  depthLevel: number;
  /** Number of questions answered */
  questionsAnswered: number;
  /** Optional: market context at time of assessment */
  marketContext?: {
    sp500YTD: number;
    vixLevel: number;
    fedRate: number;
  };
  /** Optional: life event that triggered reassessment */
  triggerEvent?: string;
}

export type DriftDirection = "more_aggressive" | "more_conservative" | "stable" | "volatile";

export interface CategoryDrift {
  key: string;
  label: string;
  currentScore: number;
  previousScore: number;
  allTimeHigh: number;
  allTimeLow: number;
  delta: number;
  direction: DriftDirection;
  /** How many standard deviations from the client's own mean */
  zScore: number;
  /** Human-readable insight */
  insight: string;
}

export interface DriftAlert {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  recommendation: string;
}

export interface DriftAnalysis {
  /** Overall drift direction */
  overallDirection: DriftDirection;
  /** Magnitude of drift (0-100 scale) */
  driftMagnitude: number;
  /** Per-category drift details */
  categoryDrifts: CategoryDrift[];
  /** Actionable alerts for the advisor */
  alerts: DriftAlert[];
  /** Predicted score in 6 months based on trend */
  predictedScore6Mo: number;
  /** Confidence in prediction (0-100) */
  predictionConfidence: number;
  /** Number of assessments analyzed */
  assessmentCount: number;
  /** Time span covered */
  timeSpanDays: number;
  /** Overall trend narrative */
  narrative: string;
}

/** Risk DNA: a fingerprint of the client's risk personality */
export interface RiskDNA {
  /** Primary archetype */
  archetype: string;
  /** Archetype description */
  archetypeDescription: string;
  /** Dominant risk dimension (highest category) */
  dominantDimension: string;
  /** Weakest risk dimension (lowest category) */
  weakestDimension: string;
  /** Consistency score: how stable are they across categories (0-100) */
  consistencyScore: number;
  /** Conviction score: how extreme are their positions (0-100) */
  convictionScore: number;
  /** Adaptability: how much do they change over time (0-100, from drift) */
  adaptabilityScore: number;
  /** 3-word personality tag */
  personalityTag: string;
  /** Color hex for UI rendering */
  color: string;
  /** Emoji for quick identification */
  emoji: string;
}

// ── Risk Archetypes ──────────────────────────────────────────────────────

const ARCHETYPES = [
  {
    name: "The Fortress Builder",
    description: "Prioritizes capital preservation above all. Sleeps well at night knowing their money is protected. Ideal for guaranteed income products and conservative IUL designs.",
    scoreRange: [0, 20] as const,
    emoji: "🏰",
    color: "#3b82f6",
    tag: "Protective · Steady · Cautious",
  },
  {
    name: "The Calculated Guardian",
    description: "Accepts modest risk for moderate growth. Wants to see their money work but needs the safety net. Sweet spot for balanced annuity portfolios with income riders.",
    scoreRange: [21, 40] as const,
    emoji: "🛡️",
    color: "#8b5cf6",
    tag: "Balanced · Methodical · Grounded",
  },
  {
    name: "The Strategic Allocator",
    description: "Comfortable with market participation through structured products. Understands caps and floors. Ideal for FIA with participation rates and IUL with aggressive indexing.",
    scoreRange: [41, 60] as const,
    emoji: "⚖️",
    color: "#f59e0b",
    tag: "Strategic · Adaptive · Informed",
  },
  {
    name: "The Growth Architect",
    description: "Actively seeks upside while maintaining some downside protection. Willing to accept higher caps and longer surrender periods for better growth potential.",
    scoreRange: [61, 80] as const,
    emoji: "📐",
    color: "#10b981",
    tag: "Ambitious · Analytical · Forward-looking",
  },
  {
    name: "The Opportunity Hunter",
    description: "Maximum growth orientation. Comfortable with market volatility and longer time horizons. Best served by high-participation products and aggressive IUL designs.",
    scoreRange: [81, 99] as const,
    emoji: "🎯",
    color: "#ef4444",
    tag: "Bold · Visionary · Aggressive",
  },
];

// ── Drift Analysis ───────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, r2: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const yMean = sumY / n;
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

function getDriftDirection(delta: number, zScore: number): DriftDirection {
  if (Math.abs(zScore) > 2) return delta > 0 ? "more_aggressive" : "more_conservative";
  if (Math.abs(delta) < 3) return "stable";
  return delta > 0 ? "more_aggressive" : "more_conservative";
}

export function analyzeRiskDrift(snapshots: RiskSnapshot[]): DriftAnalysis {
  if (snapshots.length === 0) {
    return {
      overallDirection: "stable",
      driftMagnitude: 0,
      categoryDrifts: [],
      alerts: [],
      predictedScore6Mo: 50,
      predictionConfidence: 0,
      assessmentCount: 0,
      timeSpanDays: 0,
      narrative: "No assessments recorded yet. Complete the risk tolerance questionnaire to establish a baseline.",
    };
  }

  if (snapshots.length === 1) {
    const snap = snapshots[0];
    return {
      overallDirection: "stable",
      driftMagnitude: 0,
      categoryDrifts: snap.categories.map(c => ({
        key: c.key,
        label: c.label,
        currentScore: c.score,
        previousScore: c.score,
        allTimeHigh: c.score,
        allTimeLow: c.score,
        delta: 0,
        direction: "stable" as DriftDirection,
        zScore: 0,
        insight: "Baseline established. Take another assessment in 3-6 months to begin tracking drift.",
      })),
      alerts: [{
        severity: "info",
        category: "Overall",
        message: "First assessment recorded",
        recommendation: "Schedule a follow-up assessment in 3-6 months to begin tracking how the client's risk tolerance evolves.",
      }],
      predictedScore6Mo: snap.overallScore,
      predictionConfidence: 10,
      assessmentCount: 1,
      timeSpanDays: 0,
      narrative: `Baseline risk profile established at ${snap.overallScore}/99. One assessment is not enough to detect drift — schedule a follow-up in 3-6 months.`,
    };
  }

  // Sort chronologically
  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const first = sorted[0];
  const timeSpanDays = Math.round((latest.timestamp - first.timestamp) / (1000 * 60 * 60 * 24));

  // Overall score trend
  const overallScores = sorted.map(s => s.overallScore);
  const overallDelta = latest.overallScore - previous.overallScore;
  const overallStd = stddev(overallScores);
  const overallMean = mean(overallScores);
  const overallZ = overallStd > 0 ? (latest.overallScore - overallMean) / overallStd : 0;

  // Linear regression for prediction
  const regressionPoints = sorted.map((s, i) => ({ x: i, y: s.overallScore }));
  const regression = linearRegression(regressionPoints);
  const predictedScore6Mo = Math.max(0, Math.min(99, Math.round(
    regression.slope * (sorted.length + 2) + regression.intercept
  )));
  const predictionConfidence = Math.min(90, Math.round(regression.r2 * 100 * Math.min(1, sorted.length / 5)));

  // Per-category drift
  const allCategoryKeys = latest.categories.map(c => c.key);
  const categoryDrifts: CategoryDrift[] = allCategoryKeys.map(key => {
    const catScores = sorted
      .map(s => s.categories.find(c => c.key === key)?.score ?? 0);
    const currentScore = catScores[catScores.length - 1];
    const previousScore = catScores.length >= 2 ? catScores[catScores.length - 2] : currentScore;
    const catMean = mean(catScores);
    const catStd = stddev(catScores);
    const delta = currentScore - previousScore;
    const zScore = catStd > 0 ? (currentScore - catMean) / catStd : 0;
    const direction = getDriftDirection(delta, zScore);
    const label = latest.categories.find(c => c.key === key)?.label ?? key;

    let insight: string;
    if (Math.abs(zScore) > 2) {
      insight = `Significant shift detected. Score moved ${delta > 0 ? "up" : "down"} ${Math.abs(delta)} points to ${currentScore}% — ${Math.abs(zScore).toFixed(1)} standard deviations from the client's historical mean. Investigate what changed.`;
    } else if (Math.abs(delta) > 10) {
      insight = `Notable movement of ${delta > 0 ? "+" : ""}${delta} points. ${direction === "more_aggressive" ? "Client is becoming more comfortable with risk in this area." : "Client is pulling back from risk in this area."}`;
    } else {
      insight = `Stable at ${currentScore}% (±${Math.abs(delta)} from last assessment). Consistent with historical pattern.`;
    }

    return {
      key,
      label,
      currentScore,
      previousScore,
      allTimeHigh: Math.max(...catScores),
      allTimeLow: Math.min(...catScores),
      delta,
      direction,
      zScore: +zScore.toFixed(2),
      insight,
    };
  });

  // Generate alerts
  const alerts: DriftAlert[] = [];

  // Critical: overall score shifted dramatically
  if (Math.abs(overallDelta) > 15) {
    alerts.push({
      severity: "critical",
      category: "Overall",
      message: `Risk score shifted ${overallDelta > 0 ? "+" : ""}${overallDelta} points (${previous.overallScore} → ${latest.overallScore})`,
      recommendation: overallDelta > 0
        ? "Client has become significantly more aggressive. Verify this reflects genuine conviction, not recency bias from recent market gains. Review allocation alignment."
        : "Client has become significantly more conservative. Check for life events (health, family, market losses). May need to shift toward more guaranteed products.",
    });
  }

  // Warning: any category shifted > 2 standard deviations
  categoryDrifts.filter(d => Math.abs(d.zScore) > 2).forEach(d => {
    alerts.push({
      severity: "warning",
      category: d.label,
      message: `${d.label} is ${Math.abs(d.zScore).toFixed(1)}σ from historical mean (${d.currentScore}% vs avg ${mean(sorted.map(s => s.categories.find(c => c.key === d.key)?.score ?? 0)).toFixed(0)}%)`,
      recommendation: `This dimension is behaving unusually. Dig deeper in the next client meeting — something specific may have changed in their ${d.label.toLowerCase()} outlook.`,
    });
  });

  // Info: trend is consistently moving one direction
  if (Math.abs(regression.slope) > 2 && regression.r2 > 0.5 && sorted.length >= 3) {
    alerts.push({
      severity: "info",
      category: "Trend",
      message: `Consistent ${regression.slope > 0 ? "upward" : "downward"} trend detected across ${sorted.length} assessments (R²=${regression.r2.toFixed(2)})`,
      recommendation: regression.slope > 0
        ? "Client is trending more aggressive over time. If this continues, consider gradually shifting allocation toward growth-oriented products."
        : "Client is trending more conservative over time. Natural age-related shift or response to life changes. Proactively discuss guaranteed income options.",
    });
  }

  // Determine overall direction
  const volatileCats = categoryDrifts.filter(d => d.direction !== "stable").length;
  let overallDirection: DriftDirection;
  if (volatileCats > allCategoryKeys.length * 0.6 && categoryDrifts.some(d => d.direction === "more_aggressive") && categoryDrifts.some(d => d.direction === "more_conservative")) {
    overallDirection = "volatile";
  } else if (overallDelta > 5) {
    overallDirection = "more_aggressive";
  } else if (overallDelta < -5) {
    overallDirection = "more_conservative";
  } else {
    overallDirection = "stable";
  }

  const driftMagnitude = Math.min(100, Math.round(
    Math.abs(overallDelta) * 2 + categoryDrifts.reduce((s, d) => s + Math.abs(d.delta), 0) / categoryDrifts.length
  ));

  // Narrative
  const directionLabel = {
    more_aggressive: "becoming more aggressive",
    more_conservative: "becoming more conservative",
    stable: "holding steady",
    volatile: "showing mixed signals",
  }[overallDirection];

  const biggestShift = [...categoryDrifts].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  const narrative = `Over ${timeSpanDays} days and ${sorted.length} assessments, this client is ${directionLabel}. Overall score: ${latest.overallScore}/99 (${overallDelta > 0 ? "+" : ""}${overallDelta} from last). ${biggestShift && Math.abs(biggestShift.delta) > 5 ? `Biggest movement in ${biggestShift.label} (${biggestShift.delta > 0 ? "+" : ""}${biggestShift.delta}).` : "No single category dominates the shift."} ${alerts.length > 0 ? `${alerts.filter(a => a.severity === "critical").length} critical alert(s).` : "No alerts triggered."}`;

  return {
    overallDirection,
    driftMagnitude,
    categoryDrifts,
    alerts,
    predictedScore6Mo,
    predictionConfidence,
    assessmentCount: sorted.length,
    timeSpanDays,
    narrative,
  };
}

// ── Risk DNA Generator ───────────────────────────────────────────────────

export function generateRiskDNA(
  latestSnapshot: RiskSnapshot,
  driftAnalysis?: DriftAnalysis,
): RiskDNA {
  const score = latestSnapshot.overallScore;
  const archetype = ARCHETYPES.find(a => score >= a.scoreRange[0] && score <= a.scoreRange[1]) ?? ARCHETYPES[2];

  const sorted = [...latestSnapshot.categories].sort((a, b) => b.score - a.score);
  const dominantDimension = sorted[0]?.label ?? "Unknown";
  const weakestDimension = sorted[sorted.length - 1]?.label ?? "Unknown";

  // Consistency: how uniform are the category scores (low variance = high consistency)
  const catScores = latestSnapshot.categories.map(c => c.score);
  const catStd = stddev(catScores);
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - catStd * 2)));

  // Conviction: how extreme are the positions (distance from 50)
  const avgDistFrom50 = mean(catScores.map(s => Math.abs(s - 50)));
  const convictionScore = Math.min(100, Math.round(avgDistFrom50 * 2.5));

  // Adaptability: how much drift over time
  const adaptabilityScore = driftAnalysis
    ? Math.min(100, Math.round(driftAnalysis.driftMagnitude * 1.5))
    : 50;

  return {
    archetype: archetype.name,
    archetypeDescription: archetype.description,
    dominantDimension,
    weakestDimension,
    consistencyScore,
    convictionScore,
    adaptabilityScore,
    personalityTag: archetype.tag,
    color: archetype.color,
    emoji: archetype.emoji,
  };
}

// ── Reassessment Scheduler ───────────────────────────────────────────────

export interface ReassessmentRecommendation {
  urgency: "overdue" | "due_soon" | "on_schedule" | "not_needed";
  daysUntilDue: number;
  reason: string;
}

export function getReassessmentRecommendation(
  snapshots: RiskSnapshot[],
  clientAge: number,
): ReassessmentRecommendation {
  if (snapshots.length === 0) {
    return {
      urgency: "overdue",
      daysUntilDue: 0,
      reason: "No risk assessment on file. Complete one immediately to establish a baseline.",
    };
  }

  const latest = [...snapshots].sort((a, b) => b.timestamp - a.timestamp)[0];
  const daysSinceLast = Math.round((Date.now() - latest.timestamp) / (1000 * 60 * 60 * 24));

  // Frequency based on age and volatility
  const baseInterval = clientAge >= 65 ? 90 : clientAge >= 55 ? 120 : 180;

  // If there's been drift, shorten the interval
  const drift = snapshots.length >= 2 ? analyzeRiskDrift(snapshots) : null;
  const driftMultiplier = drift && drift.driftMagnitude > 30 ? 0.5 : drift && drift.driftMagnitude > 15 ? 0.75 : 1;
  const interval = Math.round(baseInterval * driftMultiplier);

  const daysUntilDue = interval - daysSinceLast;

  if (daysUntilDue < -30) {
    return {
      urgency: "overdue",
      daysUntilDue,
      reason: `Last assessment was ${daysSinceLast} days ago — ${Math.abs(daysUntilDue)} days overdue. ${drift && drift.alerts.length > 0 ? "Previous drift alerts make this especially urgent." : "Schedule immediately."}`,
    };
  }

  if (daysUntilDue <= 14) {
    return {
      urgency: "due_soon",
      daysUntilDue,
      reason: `Assessment due in ${Math.max(0, daysUntilDue)} days. ${clientAge >= 60 ? "Clients approaching retirement benefit from more frequent check-ins." : "Regular cadence keeps the risk profile current."}`,
    };
  }

  return {
    urgency: "on_schedule",
    daysUntilDue,
    reason: `Next assessment in ${daysUntilDue} days. Profile is current.`,
  };
}
