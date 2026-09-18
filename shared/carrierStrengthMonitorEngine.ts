/**
 * SISTER INVENTION SI-016: Carrier Financial Strength Monitoring
 * Patent Reference: Extends PAT-009 (Growth Annuity Engine)
 * 
 * Real-time monitoring of carrier financial health with
 * early warning system for policy holder protection.
 */

export interface CarrierProfile {
  name: string;
  amBestRating: string;
  spRating: string;
  moodysRating: string;
  fitchRating: string;
  comdexRanking: number;
  totalAssets: number;          // In billions
  surplusRatio: number;         // Surplus / liabilities
  rbc: number;                  // Risk-based capital ratio
  lossRatio: number;
  investmentYield: number;
  claimPayingAbility: number;   // 0-100
  yearFounded: number;
  stateOfDomicile: string;
}

export interface CarrierAlert {
  carrier: string;
  alertType: "downgrade" | "watch" | "improvement" | "critical";
  message: string;
  actionRequired: string;
  urgency: "immediate" | "soon" | "monitor";
}

export interface CarrierScore {
  carrier: string;
  overallScore: number;         // 0-100
  financialStrength: number;
  claimPaying: number;
  stability: number;
  recommendation: "strong_buy" | "buy" | "hold" | "caution" | "avoid";
  alerts: CarrierAlert[];
}

export interface CarrierMonitorResult {
  carriers: CarrierScore[];
  alerts: CarrierAlert[];
  topCarriers: string[];
  watchList: string[];
  industryAvgScore: number;
}

// Rating conversion tables
const AM_BEST_SCORES: Record<string, number> = {
  "A++": 100, "A+": 95, "A": 85, "A-": 80,
  "B++": 70, "B+": 65, "B": 55, "B-": 50,
  "C++": 40, "C+": 35, "C": 25, "C-": 20,
  "D": 10, "E": 5, "F": 0, "S": 0,
};

const SP_SCORES: Record<string, number> = {
  "AAA": 100, "AA+": 97, "AA": 93, "AA-": 90,
  "A+": 85, "A": 80, "A-": 75,
  "BBB+": 65, "BBB": 60, "BBB-": 55,
  "BB+": 45, "BB": 40, "BB-": 35,
};

/**
 * Score and monitor carrier financial strength
 */
export function monitorCarriers(carriers: CarrierProfile[]): CarrierMonitorResult {
  const scored: CarrierScore[] = carriers.map(carrier => {
    const alerts: CarrierAlert[] = [];

    // Financial strength score
    const amBestScore = AM_BEST_SCORES[carrier.amBestRating] ?? 50;
    const spScore = SP_SCORES[carrier.spRating] ?? 50;
    const financialStrength = Math.round((amBestScore + spScore + carrier.comdexRanking) / 3);

    // Claim paying ability
    const claimPaying = carrier.claimPayingAbility;

    // Stability score
    const age = new Date().getFullYear() - carrier.yearFounded;
    const ageFactor = Math.min(100, age * 0.8);
    const rbcFactor = Math.min(100, carrier.rbc * 20);
    const surplusFactor = Math.min(100, carrier.surplusRatio * 500);
    const stability = Math.round((ageFactor + rbcFactor + surplusFactor) / 3);

    // Overall score
    const overall = Math.round(financialStrength * 0.40 + claimPaying * 0.30 + stability * 0.30);

    // Generate alerts
    if (amBestScore < 70) {
      alerts.push({
        carrier: carrier.name,
        alertType: amBestScore < 50 ? "critical" : "downgrade",
        message: `AM Best rating ${carrier.amBestRating} is below A- threshold`,
        actionRequired: "Review all policies with this carrier. Consider 1035 exchange.",
        urgency: amBestScore < 50 ? "immediate" : "soon",
      });
    }

    if (carrier.rbc < 3) {
      alerts.push({
        carrier: carrier.name,
        alertType: carrier.rbc < 2 ? "critical" : "watch",
        message: `Risk-based capital ratio (${carrier.rbc.toFixed(1)}) is below industry standard`,
        actionRequired: "Monitor quarterly. Below 2.0 triggers regulatory action.",
        urgency: carrier.rbc < 2 ? "immediate" : "monitor",
      });
    }

    if (carrier.surplusRatio < 0.05) {
      alerts.push({
        carrier: carrier.name,
        alertType: "watch",
        message: `Low surplus ratio (${(carrier.surplusRatio * 100).toFixed(1)}%) indicates thin capital cushion`,
        actionRequired: "Monitor for further deterioration",
        urgency: "monitor",
      });
    }

    const recommendation = overall >= 85 ? "strong_buy" as const
      : overall >= 70 ? "buy" as const
      : overall >= 55 ? "hold" as const
      : overall >= 40 ? "caution" as const
      : "avoid" as const;

    return {
      carrier: carrier.name,
      overallScore: overall,
      financialStrength,
      claimPaying,
      stability,
      recommendation,
      alerts,
    };
  });

  scored.sort((a, b) => b.overallScore - a.overallScore);

  const allAlerts = scored.flatMap(s => s.alerts);
  const topCarriers = scored.filter(s => s.overallScore >= 80).map(s => s.carrier);
  const watchList = scored.filter(s => s.alerts.length > 0).map(s => s.carrier);
  const avgScore = scored.reduce((s, c) => s + c.overallScore, 0) / Math.max(scored.length, 1);

  return {
    carriers: scored,
    alerts: allAlerts,
    topCarriers,
    watchList,
    industryAvgScore: Math.round(avgScore),
  };
}

/**
 * Get default carrier profiles for monitoring
 */
export function getDefaultCarrierProfiles(): CarrierProfile[] {
  return [
    { name: "Penn Mutual", amBestRating: "A+", spRating: "A+", moodysRating: "A1", fitchRating: "A+", comdexRanking: 92, totalAssets: 28, surplusRatio: 0.12, rbc: 4.8, lossRatio: 0.45, investmentYield: 0.042, claimPayingAbility: 95, yearFounded: 1847, stateOfDomicile: "PA" },
    { name: "Pacific Life", amBestRating: "A+", spRating: "AA-", moodysRating: "Aa3", fitchRating: "AA-", comdexRanking: 95, totalAssets: 200, surplusRatio: 0.15, rbc: 5.2, lossRatio: 0.40, investmentYield: 0.045, claimPayingAbility: 97, yearFounded: 1868, stateOfDomicile: "NE" },
    { name: "National Life", amBestRating: "A+", spRating: "A+", moodysRating: "A1", fitchRating: "A+", comdexRanking: 88, totalAssets: 45, surplusRatio: 0.10, rbc: 4.5, lossRatio: 0.48, investmentYield: 0.041, claimPayingAbility: 90, yearFounded: 1848, stateOfDomicile: "VT" },
    { name: "Transamerica", amBestRating: "A", spRating: "A+", moodysRating: "A1", fitchRating: "A+", comdexRanking: 82, totalAssets: 110, surplusRatio: 0.09, rbc: 4.0, lossRatio: 0.50, investmentYield: 0.040, claimPayingAbility: 85, yearFounded: 1904, stateOfDomicile: "IA" },
    { name: "Allianz Life", amBestRating: "A+", spRating: "AA", moodysRating: "Aa3", fitchRating: "AA-", comdexRanking: 90, totalAssets: 160, surplusRatio: 0.14, rbc: 5.0, lossRatio: 0.42, investmentYield: 0.043, claimPayingAbility: 93, yearFounded: 1896, stateOfDomicile: "MN" },
    { name: "Nationwide", amBestRating: "A+", spRating: "A+", moodysRating: "A1", fitchRating: "A+", comdexRanking: 86, totalAssets: 280, surplusRatio: 0.11, rbc: 4.6, lossRatio: 0.47, investmentYield: 0.039, claimPayingAbility: 88, yearFounded: 1926, stateOfDomicile: "OH" },
  ];
}
