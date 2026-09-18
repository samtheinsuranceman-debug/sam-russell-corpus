/**
 * SISTER INVENTION SI-022: Predictive Client Retention Engine
 * Patent Reference: Extends PAT-015 (Practice Management Platform)
 * 
 * Predicts client churn risk using behavioral signals and
 * generates proactive retention strategies.
 */

export interface ClientBehavior {
  clientId: string;
  clientName: string;
  clientSince: string;          // ISO date
  lastContactDate: string;
  lastReviewDate: string;
  totalPolicies: number;
  totalPremium: number;
  missedPayments: number;
  latePayments: number;
  serviceRequests: number;
  complaints: number;
  referralsGiven: number;
  emailOpenRate: number;        // 0-1
  meetingCancellations: number;
  lifeEvents: string[];         // Recent life events
  satisfactionScore: number;    // 1-10 from last survey
  competitorMentions: number;
  portfolioPerformance: number; // % vs benchmark
}

export interface ChurnPrediction {
  clientId: string;
  clientName: string;
  churnProbability: number;     // 0-100
  riskLevel: "low" | "moderate" | "high" | "critical";
  topRiskFactors: string[];
  retentionStrategies: string[];
  estimatedRevenueAtRisk: number;
  recommendedAction: string;
  urgency: "immediate" | "this_week" | "this_month" | "quarterly";
}

export interface RetentionResult {
  predictions: ChurnPrediction[];
  totalRevenueAtRisk: number;
  criticalCount: number;
  highCount: number;
  avgChurnProbability: number;
  topRetentionActions: string[];
}

/**
 * Predict client churn and generate retention strategies
 */
export function predictChurn(clients: ClientBehavior[]): RetentionResult {
  const now = new Date();

  const predictions: ChurnPrediction[] = clients.map(client => {
    let churnScore = 0;
    const riskFactors: string[] = [];
    const strategies: string[] = [];

    // Days since last contact
    const daysSinceContact = Math.floor((now.getTime() - new Date(client.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceContact > 180) {
      churnScore += 25;
      riskFactors.push(`No contact in ${daysSinceContact} days`);
      strategies.push("Schedule immediate check-in call");
    } else if (daysSinceContact > 90) {
      churnScore += 12;
      riskFactors.push(`${daysSinceContact} days since last contact`);
      strategies.push("Send personalized market update email");
    }

    // Days since last review
    const daysSinceReview = Math.floor((now.getTime() - new Date(client.lastReviewDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceReview > 365) {
      churnScore += 15;
      riskFactors.push("Annual review overdue");
      strategies.push("Schedule comprehensive portfolio review");
    }

    // Payment behavior
    if (client.missedPayments > 0) {
      churnScore += client.missedPayments * 10;
      riskFactors.push(`${client.missedPayments} missed payment(s)`);
      strategies.push("Offer premium payment flexibility or restructuring");
    }
    if (client.latePayments > 2) {
      churnScore += 8;
      riskFactors.push("Pattern of late payments");
    }

    // Complaints
    if (client.complaints > 0) {
      churnScore += client.complaints * 12;
      riskFactors.push(`${client.complaints} unresolved complaint(s)`);
      strategies.push("Personal call from senior advisor to address concerns");
    }

    // Low engagement
    if (client.emailOpenRate < 0.1) {
      churnScore += 8;
      riskFactors.push("Very low email engagement");
      strategies.push("Switch to phone/text communication");
    }

    // Meeting cancellations
    if (client.meetingCancellations > 2) {
      churnScore += 10;
      riskFactors.push("Multiple meeting cancellations");
      strategies.push("Offer virtual meeting or home visit");
    }

    // Competitor mentions
    if (client.competitorMentions > 0) {
      churnScore += client.competitorMentions * 15;
      riskFactors.push("Has mentioned competitor products");
      strategies.push("Prepare competitive comparison showing your value advantage");
    }

    // Satisfaction score
    if (client.satisfactionScore <= 5) {
      churnScore += 20;
      riskFactors.push(`Low satisfaction score (${client.satisfactionScore}/10)`);
      strategies.push("Conduct in-depth satisfaction interview");
    } else if (client.satisfactionScore <= 7) {
      churnScore += 8;
    }

    // Portfolio underperformance
    if (client.portfolioPerformance < -5) {
      churnScore += 12;
      riskFactors.push(`Portfolio underperforming benchmark by ${Math.abs(client.portfolioPerformance).toFixed(1)}%`);
      strategies.push("Schedule performance review with rebalancing recommendations");
    }

    // Life events (may trigger policy changes)
    if (client.lifeEvents.length > 0) {
      const highRiskEvents = client.lifeEvents.filter(e =>
        ["divorce", "job_loss", "retirement", "relocation"].includes(e)
      );
      if (highRiskEvents.length > 0) {
        churnScore += highRiskEvents.length * 8;
        riskFactors.push(`Life event(s): ${highRiskEvents.join(", ")}`);
        strategies.push("Proactive outreach to discuss life event impact on financial plan");
      }
    }

    // Positive factors (reduce churn score)
    if (client.referralsGiven > 0) churnScore -= 10;
    if (client.totalPolicies >= 3) churnScore -= 8;
    const tenureYears = Math.floor((now.getTime() - new Date(client.clientSince).getTime()) / (1000 * 60 * 60 * 24 * 365));
    if (tenureYears > 10) churnScore -= 10;

    churnScore = Math.max(0, Math.min(100, churnScore));

    const riskLevel = churnScore >= 70 ? "critical" as const
      : churnScore >= 45 ? "high" as const
      : churnScore >= 25 ? "moderate" as const
      : "low" as const;

    const urgency = riskLevel === "critical" ? "immediate" as const
      : riskLevel === "high" ? "this_week" as const
      : riskLevel === "moderate" ? "this_month" as const
      : "quarterly" as const;

    const revenueAtRisk = client.totalPremium * (churnScore / 100);

    // Default strategies if none generated
    if (strategies.length === 0) {
      strategies.push("Continue regular touchpoints");
      strategies.push("Send quarterly market insights");
    }

    return {
      clientId: client.clientId,
      clientName: client.clientName,
      churnProbability: churnScore,
      riskLevel,
      topRiskFactors: riskFactors.slice(0, 5),
      retentionStrategies: strategies.slice(0, 5),
      estimatedRevenueAtRisk: Math.round(revenueAtRisk),
      recommendedAction: strategies[0] ?? "Maintain regular contact",
      urgency,
    };
  });

  predictions.sort((a, b) => b.churnProbability - a.churnProbability);

  const totalRevAtRisk = predictions.reduce((s, p) => s + p.estimatedRevenueAtRisk, 0);
  const criticalCount = predictions.filter(p => p.riskLevel === "critical").length;
  const highCount = predictions.filter(p => p.riskLevel === "high").length;
  const avgChurn = predictions.reduce((s, p) => s + p.churnProbability, 0) / Math.max(predictions.length, 1);

  const topActions: string[] = [
    `${criticalCount} clients need immediate attention`,
    `$${totalRevAtRisk.toLocaleString()} in annual revenue at risk`,
    "Schedule reviews for all clients not contacted in 90+ days",
    "Address all open complaints within 48 hours",
    "Implement quarterly satisfaction surveys",
  ];

  return {
    predictions,
    totalRevenueAtRisk: totalRevAtRisk,
    criticalCount,
    highCount,
    avgChurnProbability: Math.round(avgChurn),
    topRetentionActions: topActions,
  };
}
