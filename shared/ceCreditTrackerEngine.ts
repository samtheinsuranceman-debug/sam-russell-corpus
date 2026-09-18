/**
 * SISTER INVENTION SI-020: Automated CE Credit Tracker & Recommendation Engine
 * Patent Reference: Extends PAT-015 (Practice Management Platform)
 * 
 * Tracks continuing education requirements across states and licenses,
 * recommends optimal CE courses, and alerts on upcoming deadlines.
 */

export interface License {
  type: "life" | "health" | "securities" | "ria" | "cfp" | "clu" | "chfc";
  state: string;
  expirationDate: string;  // ISO date
  creditsRequired: number;
  creditsCompleted: number;
  ethicsRequired: number;
  ethicsCompleted: number;
  renewalCycleDays: number;
}

export interface CECourse {
  id: string;
  title: string;
  provider: string;
  credits: number;
  isEthics: boolean;
  category: string;
  estimatedHours: number;
  cost: number;
  relevanceScore: number;   // 0-100
  states: string[];          // Approved states
}

export interface CEDeadline {
  license: string;
  state: string;
  dueDate: string;
  creditsNeeded: number;
  ethicsNeeded: number;
  urgency: "critical" | "warning" | "ok";
  daysRemaining: number;
}

export interface CERecommendation {
  course: CECourse;
  reason: string;
  coversLicenses: string[];
  priority: number;
}

export interface CETrackerResult {
  totalCreditsRequired: number;
  totalCreditsCompleted: number;
  totalCreditsRemaining: number;
  completionPercent: number;
  deadlines: CEDeadline[];
  recommendations: CERecommendation[];
  estimatedCost: number;
  estimatedHours: number;
  complianceStatus: "compliant" | "at-risk" | "non-compliant";
}

// State CE requirements (simplified — key states)
const STATE_CE_REQUIREMENTS: Record<string, { credits: number; ethics: number; cycleDays: number }> = {
  VA: { credits: 24, ethics: 3, cycleDays: 730 },
  CA: { credits: 24, ethics: 4, cycleDays: 730 },
  TX: { credits: 24, ethics: 2, cycleDays: 730 },
  FL: { credits: 24, ethics: 5, cycleDays: 730 },
  NY: { credits: 15, ethics: 1, cycleDays: 730 },
  IL: { credits: 24, ethics: 3, cycleDays: 730 },
  PA: { credits: 24, ethics: 3, cycleDays: 730 },
  NJ: { credits: 24, ethics: 3, cycleDays: 730 },
  MD: { credits: 24, ethics: 3, cycleDays: 730 },
  NC: { credits: 24, ethics: 3, cycleDays: 730 },
  GA: { credits: 24, ethics: 3, cycleDays: 730 },
  OH: { credits: 24, ethics: 3, cycleDays: 730 },
  AZ: { credits: 24, ethics: 3, cycleDays: 730 },
  MA: { credits: 24, ethics: 2, cycleDays: 730 },
  WA: { credits: 24, ethics: 3, cycleDays: 730 },
  CO: { credits: 24, ethics: 3, cycleDays: 730 },
  TN: { credits: 24, ethics: 3, cycleDays: 730 },
  NV: { credits: 24, ethics: 3, cycleDays: 730 },
};

// Sample CE course catalog
const CE_CATALOG: CECourse[] = [
  { id: "CE001", title: "Advanced IUL Strategies for HNW Clients", provider: "NAILBA", credits: 4, isEthics: false, category: "Insurance", estimatedHours: 4, cost: 49, relevanceScore: 95, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ", "MD", "NC"] },
  { id: "CE002", title: "Ethics in Financial Planning", provider: "CFP Board", credits: 2, isEthics: true, category: "Ethics", estimatedHours: 2, cost: 35, relevanceScore: 90, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ", "MD", "NC", "GA", "OH", "AZ", "MA", "WA", "CO", "TN", "NV"] },
  { id: "CE003", title: "Tax Planning with Life Insurance", provider: "AALU", credits: 3, isEthics: false, category: "Tax", estimatedHours: 3, cost: 45, relevanceScore: 92, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ", "MD", "NC"] },
  { id: "CE004", title: "Estate Planning Fundamentals Update", provider: "NAIFA", credits: 4, isEthics: false, category: "Estate", estimatedHours: 4, cost: 55, relevanceScore: 88, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ", "MD", "NC", "GA", "OH", "AZ"] },
  { id: "CE005", title: "Annuity Suitability Standards", provider: "LIMRA", credits: 3, isEthics: false, category: "Insurance", estimatedHours: 3, cost: 40, relevanceScore: 85, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ", "MD", "NC"] },
  { id: "CE006", title: "Fiduciary Duty & Best Interest", provider: "FPA", credits: 2, isEthics: true, category: "Ethics", estimatedHours: 2, cost: 30, relevanceScore: 93, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ", "MD", "NC", "GA", "OH", "AZ", "MA", "WA", "CO", "TN", "NV"] },
  { id: "CE007", title: "Premium Financing Strategies", provider: "NAILBA", credits: 3, isEthics: false, category: "Insurance", estimatedHours: 3, cost: 50, relevanceScore: 90, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ"] },
  { id: "CE008", title: "Retirement Income Planning", provider: "RIIA", credits: 4, isEthics: false, category: "Retirement", estimatedHours: 4, cost: 60, relevanceScore: 87, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ", "MD", "NC", "GA", "OH", "AZ", "MA"] },
  { id: "CE009", title: "Long-Term Care Insurance Update", provider: "NAIFA", credits: 2, isEthics: false, category: "Insurance", estimatedHours: 2, cost: 35, relevanceScore: 80, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ", "MD", "NC"] },
  { id: "CE010", title: "Anti-Money Laundering Compliance", provider: "FINRA", credits: 2, isEthics: true, category: "Ethics", estimatedHours: 2, cost: 25, relevanceScore: 75, states: ["VA", "CA", "TX", "FL", "NY", "IL", "PA", "NJ", "MD", "NC", "GA", "OH", "AZ", "MA", "WA", "CO", "TN", "NV"] },
];

/**
 * Calculate CE credit status and recommendations
 */
export function trackCECredits(licenses: License[]): CETrackerResult {
  const now = new Date();
  let totalRequired = 0;
  let totalCompleted = 0;

  const deadlines: CEDeadline[] = licenses.map(lic => {
    const expDate = new Date(lic.expirationDate);
    const daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const creditsNeeded = Math.max(0, lic.creditsRequired - lic.creditsCompleted);
    const ethicsNeeded = Math.max(0, lic.ethicsRequired - lic.ethicsCompleted);

    totalRequired += lic.creditsRequired;
    totalCompleted += lic.creditsCompleted;

    return {
      license: lic.type.toUpperCase(),
      state: lic.state,
      dueDate: lic.expirationDate,
      creditsNeeded,
      ethicsNeeded,
      urgency: daysRemaining < 60 ? "critical" : daysRemaining < 180 ? "warning" : "ok",
      daysRemaining,
    };
  });

  // Sort by urgency
  deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Find needed states
  const neededStates = new Set(deadlines.filter(d => d.creditsNeeded > 0).map(d => d.state));
  const needsEthics = deadlines.some(d => d.ethicsNeeded > 0);

  // Recommend courses
  const recommendations: CERecommendation[] = CE_CATALOG
    .filter(course => {
      if (needsEthics && course.isEthics) return true;
      return course.states.some(s => neededStates.has(s));
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8)
    .map((course, i) => ({
      course,
      reason: course.isEthics
        ? "Fulfills ethics requirement across multiple licenses"
        : `High-relevance ${course.category} course approved in ${course.states.filter(s => neededStates.has(s)).length} of your states`,
      coversLicenses: deadlines.filter(d => course.states.includes(d.state) && d.creditsNeeded > 0).map(d => `${d.license} (${d.state})`),
      priority: i + 1,
    }));

  const remaining = Math.max(0, totalRequired - totalCompleted);
  const completionPct = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 100;

  const estimatedCost = recommendations.reduce((s, r) => s + r.course.cost, 0);
  const estimatedHours = recommendations.reduce((s, r) => s + r.course.estimatedHours, 0);

  const criticalCount = deadlines.filter(d => d.urgency === "critical").length;
  const complianceStatus = criticalCount > 0 ? "non-compliant" : remaining > 0 ? "at-risk" : "compliant";

  return {
    totalCreditsRequired: totalRequired,
    totalCreditsCompleted: totalCompleted,
    totalCreditsRemaining: remaining,
    completionPercent: Math.round(completionPct * 10) / 10,
    deadlines,
    recommendations,
    estimatedCost,
    estimatedHours,
    complianceStatus,
  };
}
