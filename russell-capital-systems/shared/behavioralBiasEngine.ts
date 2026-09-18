/**
 * SISTER INVENTION SI-007: Behavioral Finance Bias Detection Engine
 * Patent Reference: Extends PAT-003 (AI Whisper Coaching)
 * 
 * Detects cognitive biases in client financial decisions and
 * generates counter-framing strategies for advisors.
 */

export interface ClientDecision {
  type: "investment" | "insurance" | "withdrawal" | "allocation" | "purchase" | "estate";
  description: string;
  amount: number;
  emotionalState: "fearful" | "greedy" | "neutral" | "anxious" | "overconfident";
  marketCondition: "bull" | "bear" | "volatile" | "stable";
  recentLoss: boolean;
  recentGain: boolean;
  timeHorizon: "short" | "medium" | "long";
}

export interface DetectedBias {
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;        // 0-100
  description: string;
  clientImpact: string;
  counterFraming: string;    // What advisor should say
  academicReference: string;
}

export interface BiasDetectionResult {
  detectedBiases: DetectedBias[];
  overallRiskLevel: "low" | "moderate" | "high" | "critical";
  advisorScript: string;
  recommendedApproach: string;
  decisionQualityScore: number;  // 0-100
}

// Bias detection rules
const BIAS_RULES: {
  name: string;
  detect: (d: ClientDecision) => { detected: boolean; confidence: number; severity: DetectedBias["severity"] };
  description: string;
  counterFraming: string;
  reference: string;
}[] = [
  {
    name: "Loss Aversion",
    detect: (d) => ({
      detected: d.emotionalState === "fearful" && d.recentLoss && d.type === "withdrawal",
      confidence: 85,
      severity: "high",
    }),
    description: "Client is overweighting recent losses and making fear-based withdrawal decisions. Losses feel 2.5x more painful than equivalent gains (Kahneman & Tversky).",
    counterFraming: "I understand the recent decline feels concerning. Let me show you how your portfolio has performed over 10-year rolling periods — in every case, patience was rewarded. Let's focus on your 20-year goal, not the last 20 days.",
    reference: "Kahneman & Tversky (1979) — Prospect Theory",
  },
  {
    name: "Recency Bias",
    detect: (d) => ({
      detected: (d.recentGain && d.emotionalState === "greedy") || (d.recentLoss && d.emotionalState === "fearful"),
      confidence: 80,
      severity: "medium",
    }),
    description: "Client is extrapolating recent market performance into future expectations. Recent events are being weighted disproportionately in decision-making.",
    counterFraming: "Recent performance — whether up or down — is a poor predictor of future returns. Let me show you how the market has behaved after similar periods historically. The data tells a very different story than our emotions.",
    reference: "Tversky & Kahneman (1973) — Availability Heuristic",
  },
  {
    name: "Anchoring Bias",
    detect: (d) => ({
      detected: d.type === "investment" && d.marketCondition === "bear" && d.emotionalState !== "neutral",
      confidence: 70,
      severity: "medium",
    }),
    description: "Client is anchored to a previous portfolio high-water mark and making decisions based on that reference point rather than current fundamentals.",
    counterFraming: "Instead of comparing to the peak value, let's look at where you started and where your plan says you need to be. You're actually ahead of your retirement target by 12%. The 'loss' you're feeling is from an unrealized peak, not from your actual plan.",
    reference: "Tversky & Kahneman (1974) — Anchoring and Adjustment",
  },
  {
    name: "Overconfidence Bias",
    detect: (d) => ({
      detected: d.emotionalState === "overconfident" && d.amount > 100000,
      confidence: 75,
      severity: "high",
    }),
    description: "Client is overestimating their ability to time the market or pick winners. Overconfident investors trade 45% more and earn 2.65% less annually (Barber & Odean).",
    counterFraming: "Your conviction is admirable, but let me share something: 92% of professional fund managers fail to beat the index over 15 years. Let's stress-test this idea against three scenarios — best case, expected case, and worst case — before committing.",
    reference: "Barber & Odean (2001) — Boys Will Be Boys: Gender, Overconfidence, and Common Stock Investment",
  },
  {
    name: "Status Quo Bias",
    detect: (d) => ({
      detected: d.type === "allocation" && d.emotionalState === "neutral" && d.timeHorizon === "long",
      confidence: 65,
      severity: "low",
    }),
    description: "Client prefers to keep current allocation unchanged despite changed circumstances. Inertia may be costing them optimization opportunities.",
    counterFraming: "Your current allocation was perfect when we set it up 5 years ago. But your life has changed — you're closer to retirement, tax laws have shifted, and new products offer better protection. Let's review whether 'staying the same' is actually the best active choice.",
    reference: "Samuelson & Zeckhauser (1988) — Status Quo Bias in Decision Making",
  },
  {
    name: "Herd Mentality",
    detect: (d) => ({
      detected: d.marketCondition === "volatile" && (d.emotionalState === "fearful" || d.emotionalState === "greedy"),
      confidence: 72,
      severity: "medium",
    }),
    description: "Client wants to follow what 'everyone else' is doing — buying in euphoria or selling in panic. Herd behavior amplifies market extremes.",
    counterFraming: "When everyone is running for the exits, that's historically been the best time to buy. Warren Buffett built his fortune by being greedy when others were fearful. Your plan was designed for exactly this moment. Let's stick to it.",
    reference: "Banerjee (1992) — A Simple Model of Herd Behavior",
  },
  {
    name: "Endowment Effect",
    detect: (d) => ({
      detected: d.type === "insurance" && d.emotionalState === "anxious",
      confidence: 68,
      severity: "medium",
    }),
    description: "Client overvalues their existing policy simply because they own it. The pain of 'giving up' the current policy exceeds rational assessment of the replacement's benefits.",
    counterFraming: "I understand the attachment to your current policy — you've had it for years and it feels like 'yours.' But let me show you side-by-side: the new policy gives you $200,000 more in living benefits, costs $50/month less, and is with a stronger carrier. If you were buying fresh today, which would you choose?",
    reference: "Thaler (1980) — Toward a Positive Theory of Consumer Choice",
  },
  {
    name: "Confirmation Bias",
    detect: (d) => ({
      detected: d.emotionalState === "overconfident" && d.type === "investment",
      confidence: 70,
      severity: "medium",
    }),
    description: "Client is selectively seeking information that confirms their pre-existing belief about an investment while ignoring contradictory evidence.",
    counterFraming: "You've done great research supporting this position. Now let me play devil's advocate — here are three strong arguments against it. If you can address each one, I'll feel much more confident in this decision. This isn't doubt; it's due diligence.",
    reference: "Nickerson (1998) — Confirmation Bias: A Ubiquitous Phenomenon in Many Guises",
  },
];

/**
 * Detect biases in a client's financial decision
 */
export function detectBiases(decision: ClientDecision): BiasDetectionResult {
  const detected: DetectedBias[] = [];

  for (const rule of BIAS_RULES) {
    const result = rule.detect(decision);
    if (result.detected) {
      detected.push({
        name: rule.name,
        severity: result.severity,
        confidence: result.confidence,
        description: rule.description,
        clientImpact: `May lead to suboptimal ${decision.type} decision worth $${decision.amount.toLocaleString()}`,
        counterFraming: rule.counterFraming,
        academicReference: rule.reference,
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  detected.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const overallRisk = detected.some(b => b.severity === "critical") ? "critical"
    : detected.some(b => b.severity === "high") ? "high"
    : detected.some(b => b.severity === "medium") ? "moderate" : "low";

  const qualityScore = Math.max(0, 100 - detected.reduce((s, b) => {
    return s + (b.severity === "critical" ? 30 : b.severity === "high" ? 20 : b.severity === "medium" ? 10 : 5);
  }, 0));

  // Generate advisor script
  const script = detected.length > 0
    ? `ADVISOR APPROACH: ${detected[0].counterFraming}\n\nKEY BIASES TO ADDRESS: ${detected.map(b => b.name).join(", ")}\n\nRECOMMENDED TONE: Empathetic but data-driven. Acknowledge the emotion, then redirect to evidence.`
    : "No significant biases detected. Proceed with standard advisory approach.";

  const approach = detected.length > 2
    ? "Schedule a dedicated meeting to address multiple biases before proceeding with decision"
    : detected.length > 0
    ? "Address primary bias in current conversation using counter-framing technique"
    : "Client appears to be making a rational, well-considered decision";

  return {
    detectedBiases: detected,
    overallRiskLevel: overallRisk,
    advisorScript: script,
    recommendedApproach: approach,
    decisionQualityScore: qualityScore,
  };
}
