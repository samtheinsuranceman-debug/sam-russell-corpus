/**
 * WEAPONIZE Engines W5-W12
 * 
 * Shared pure-logic modules that power the 9 remaining WEAPONIZE upgrades.
 * Each engine is self-contained, typed, and ready to be consumed by the UI layer.
 * No React imports — these are pure TypeScript computation engines.
 */

// ═══════════════════════════════════════════════════════════════════════════
// W5: Hot Income / O&G → Client View Mode
// Transforms advisor-facing data into a simplified, signable client presentation
// ═══════════════════════════════════════════════════════════════════════════

export interface ClientViewConfig {
  mode: "advisor" | "client";
  showDisclosures: boolean;
  showInternalNotes: boolean;
  showCommissions: boolean;
  simplifiedLanguage: boolean;
  brandingOverride?: {
    firmName: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

export interface ClientPresentableSection {
  id: string;
  title: string;
  clientTitle: string;           // Simplified title for client view
  advisorContent: string;        // Full technical content
  clientContent: string;         // Simplified, jargon-free version
  visualType: "chart" | "table" | "summary" | "comparison";
  acknowledgmentRequired: boolean;
  signatureField?: boolean;
}

export function transformToClientView(
  sections: ClientPresentableSection[],
  config: ClientViewConfig
): ClientPresentableSection[] {
  if (config.mode === "advisor") return sections;

  return sections.map((s) => ({
    ...s,
    title: s.clientTitle,
    // In client mode, swap to simplified content
  })).filter((s) => {
    // Remove internal-only sections
    if (!config.showInternalNotes && s.id.startsWith("internal_")) return false;
    if (!config.showCommissions && s.id.startsWith("commission_")) return false;
    return true;
  });
}

export const DEFAULT_CLIENT_VIEW: ClientViewConfig = {
  mode: "client",
  showDisclosures: true,
  showInternalNotes: false,
  showCommissions: false,
  simplifiedLanguage: true,
};

export const DEFAULT_ADVISOR_VIEW: ClientViewConfig = {
  mode: "advisor",
  showDisclosures: true,
  showInternalNotes: true,
  showCommissions: true,
  simplifiedLanguage: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// W6: Advisor Income Calculator → Practice Revenue Simulator
// What-if modeling for practice growth with revenue projections
// ═══════════════════════════════════════════════════════════════════════════

export interface PracticeMetrics {
  totalClients: number;
  avgAUM: number;
  avgFeeRate: number;              // basis points
  annualPremiumVolume: number;
  avgCommissionRate: number;       // percentage
  trailingRevenue: number;         // annual recurring
  newClientsPerMonth: number;
  clientRetentionRate: number;     // percentage
  avgRevenuePerClient: number;
}

export interface PracticeProjection {
  year: number;
  totalClients: number;
  totalAUM: number;
  feeRevenue: number;
  commissionRevenue: number;
  trailingRevenue: number;
  totalRevenue: number;
  growthRate: number;
}

export interface RevenueGoal {
  targetRevenue: number;
  currentRevenue: number;
  gap: number;
  pathways: RevenuePathway[];
}

export interface RevenuePathway {
  name: string;
  description: string;
  additionalRevenue: number;
  effort: "low" | "medium" | "high";
  timeToImpact: string;            // e.g., "3-6 months"
  actionSteps: string[];
}

export function simulatePracticeGrowth(
  metrics: PracticeMetrics,
  years: number = 5,
  assumptions: {
    aumGrowthRate?: number;       // annual market growth (default 7%)
    feeCompression?: number;      // annual fee compression (default 0.5%)
    inflationRate?: number;       // expense inflation (default 3%)
  } = {}
): PracticeProjection[] {
  const aumGrowth = assumptions.aumGrowthRate ?? 0.07;
  const feeCompression = assumptions.feeCompression ?? 0.005;
  const projections: PracticeProjection[] = [];

  let clients = metrics.totalClients;
  let aum = metrics.totalClients * metrics.avgAUM;
  let feeRate = metrics.avgFeeRate;
  let trailing = metrics.trailingRevenue;

  for (let y = 1; y <= years; y++) {
    // Client growth (new - attrition)
    const newClients = metrics.newClientsPerMonth * 12;
    const lostClients = Math.round(clients * (1 - metrics.clientRetentionRate / 100));
    clients = clients + newClients - lostClients;

    // AUM growth (market + new money)
    aum = aum * (1 + aumGrowth) + newClients * metrics.avgAUM;

    // Fee compression
    feeRate = Math.max(feeRate - feeCompression, 0.005);

    // Revenue streams
    const feeRevenue = aum * (feeRate / 100);
    const commissionRevenue = metrics.annualPremiumVolume * (metrics.avgCommissionRate / 100);
    trailing = trailing * 1.03; // trailing grows with renewals

    const totalRevenue = feeRevenue + commissionRevenue + trailing;
    const prevTotal = projections.length > 0 ? projections[projections.length - 1].totalRevenue : metrics.avgRevenuePerClient * metrics.totalClients;

    projections.push({
      year: y,
      totalClients: clients,
      totalAUM: Math.round(aum),
      feeRevenue: Math.round(feeRevenue),
      commissionRevenue: Math.round(commissionRevenue),
      trailingRevenue: Math.round(trailing),
      totalRevenue: Math.round(totalRevenue),
      growthRate: prevTotal > 0 ? (totalRevenue - prevTotal) / prevTotal : 0,
    });
  }

  return projections;
}

export function generateRevenuePathways(
  metrics: PracticeMetrics,
  targetRevenue: number
): RevenueGoal {
  const currentRevenue = metrics.avgRevenuePerClient * metrics.totalClients;
  const gap = Math.max(0, targetRevenue - currentRevenue);

  const pathways: RevenuePathway[] = [
    {
      name: "Increase AUM per Client",
      description: "Deepen wallet share with existing clients through comprehensive planning",
      additionalRevenue: Math.round(metrics.totalClients * metrics.avgAUM * 0.15 * (metrics.avgFeeRate / 10000)),
      effort: "medium",
      timeToImpact: "6-12 months",
      actionSteps: [
        "Run Retirement DNA reports for top 20 clients",
        "Identify rollover opportunities using Replacement Radar",
        "Schedule annual review meetings with Solar Strategy presentation",
      ],
    },
    {
      name: "Accelerate Client Acquisition",
      description: "Double new client flow through referral programs and seminar campaigns",
      additionalRevenue: Math.round(metrics.newClientsPerMonth * 12 * metrics.avgRevenuePerClient),
      effort: "high",
      timeToImpact: "3-6 months",
      actionSteps: [
        "Launch referral incentive program",
        "Run monthly educational seminars",
        "Activate Lead Generator with targeted campaigns",
      ],
    },
    {
      name: "Improve Retention",
      description: "Reduce attrition by 50% through proactive engagement and Stale Digest alerts",
      additionalRevenue: Math.round(metrics.totalClients * (1 - metrics.clientRetentionRate / 100) * 0.5 * metrics.avgRevenuePerClient),
      effort: "low",
      timeToImpact: "1-3 months",
      actionSteps: [
        "Enable Stale Digest automated outreach",
        "Set up Client Health Alerts for at-risk accounts",
        "Implement quarterly touchpoint automation",
      ],
    },
    {
      name: "Add Annuity Premium Volume",
      description: "Increase annuity placements using Replacement Radar and Solar Strategy",
      additionalRevenue: Math.round(metrics.annualPremiumVolume * 0.3 * (metrics.avgCommissionRate / 100)),
      effort: "medium",
      timeToImpact: "3-6 months",
      actionSteps: [
        "Run Replacement Radar on all existing annuity clients",
        "Present Solar Strategy to clients with taxable annuities",
        "Use Top 10 Income/FIA tools to identify best replacement products",
      ],
    },
  ];

  return {
    targetRevenue,
    currentRevenue: Math.round(currentRevenue),
    gap: Math.round(gap),
    pathways: pathways.sort((a, b) => b.additionalRevenue - a.additionalRevenue),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// W7: Sales Story Builder → AI Rehearsal Mode
// Branching conversation scripts with objection handling
// ═══════════════════════════════════════════════════════════════════════════

export interface ConversationNode {
  id: string;
  type: "advisor_says" | "client_response" | "objection" | "close";
  content: string;
  emotionalTone: "neutral" | "interested" | "skeptical" | "resistant" | "enthusiastic";
  branches: ConversationBranch[];
}

export interface ConversationBranch {
  label: string;                   // e.g., "Client asks about fees"
  nextNodeId: string;
  probability: number;             // 0-1, how likely this branch is
}

export interface ConversationScript {
  id: string;
  name: string;
  scenario: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: string;       // e.g., "8-12 minutes"
  nodes: ConversationNode[];
  entryNodeId: string;
  successCriteria: string[];
}

export interface RehearsalResult {
  scriptId: string;
  pathTaken: string[];             // node IDs in order
  objectionsFaced: number;
  objectionsHandled: number;
  confidenceScore: number;         // 0-100
  feedback: RehearsalFeedback[];
  duration: number;                // seconds
}

export interface RehearsalFeedback {
  nodeId: string;
  type: "strength" | "improvement" | "critical";
  message: string;
}

export const PRESET_SCRIPTS: Omit<ConversationScript, "nodes">[] = [
  {
    id: "first_meeting_retirement",
    name: "First Meeting: Retirement Planning",
    scenario: "New prospect, age 58, $800K in 401(k), worried about running out of money",
    difficulty: "beginner",
    estimatedDuration: "10-15 minutes",
    entryNodeId: "intro",
    successCriteria: [
      "Establish rapport and understand their concerns",
      "Present Retirement DNA concept",
      "Schedule follow-up meeting with full analysis",
    ],
  },
  {
    id: "solar_strategy_pitch",
    name: "Solar Strategy Presentation",
    scenario: "Existing client, $500K in traditional IRA, 62 years old, wants guaranteed income",
    difficulty: "intermediate",
    estimatedDuration: "15-20 minutes",
    entryNodeId: "intro",
    successCriteria: [
      "Explain tax drag on current IRA",
      "Present Solar Strategy multi-stage pathway",
      "Show before/after income comparison",
      "Handle 'sounds too good to be true' objection",
    ],
  },
  {
    id: "annuity_replacement",
    name: "Annuity Replacement Conversation",
    scenario: "Client has old variable annuity with 3% surrender charge, poor performance, high fees",
    difficulty: "advanced",
    estimatedDuration: "20-25 minutes",
    entryNodeId: "intro",
    successCriteria: [
      "Acknowledge their original purchase decision positively",
      "Present Replacement Radar analysis objectively",
      "Handle 'but I'll lose money on surrender' objection",
      "Show breakeven timeline with new product bonus",
      "Discuss 1035 exchange tax implications",
    ],
  },
  {
    id: "objection_gauntlet",
    name: "Objection Gauntlet",
    scenario: "Skeptical prospect who has been burned before. Every response includes an objection.",
    difficulty: "advanced",
    estimatedDuration: "15-20 minutes",
    entryNodeId: "intro",
    successCriteria: [
      "Stay calm and empathetic through 5+ objections",
      "Acknowledge each concern before responding",
      "Use data and third-party validation",
      "End with a clear next step",
    ],
  },
];

export const COMMON_OBJECTIONS = [
  { id: "too_good", text: "That sounds too good to be true.", category: "skepticism" },
  { id: "need_to_think", text: "I need to think about it.", category: "stall" },
  { id: "happy_current", text: "I'm happy with my current advisor.", category: "loyalty" },
  { id: "market_timing", text: "I'll wait until the market settles.", category: "timing" },
  { id: "fees", text: "What are the fees? How do you get paid?", category: "transparency" },
  { id: "annuity_bad", text: "I've heard annuities are bad investments.", category: "misconception" },
  { id: "surrender", text: "I don't want to pay surrender charges.", category: "cost" },
  { id: "spouse", text: "I need to talk to my spouse first.", category: "stall" },
  { id: "diy", text: "I can do this myself with index funds.", category: "diy" },
  { id: "age", text: "I'm too young/old for this.", category: "timing" },
  { id: "complexity", text: "This is too complicated for me.", category: "confusion" },
  { id: "guarantee", text: "How can they guarantee income for life?", category: "education" },
];

// ═══════════════════════════════════════════════════════════════════════════
// W8: Competitive Analysis → Crowd-Sourced Intel Feed
// Anonymous rate reporting and win/loss tracking
// ═══════════════════════════════════════════════════════════════════════════

export interface CompetitiveIntel {
  id: string;
  reportedAt: Date;
  category: "rate" | "product" | "service" | "fee" | "technology";
  carrier: string;
  product?: string;
  detail: string;
  source: "field_report" | "marketing" | "client_feedback" | "public";
  verificationStatus: "unverified" | "confirmed" | "disputed";
  relevanceScore: number;          // 0-100
}

export interface WinLossRecord {
  id: string;
  date: Date;
  outcome: "win" | "loss";
  competitorName?: string;
  productCategory: string;
  clientProfile: string;           // anonymized
  winReason?: string;
  lossReason?: string;
  lessonsLearned: string;
  premiumAmount?: number;
}

export interface CompetitivePulse {
  period: string;                  // e.g., "March 2026"
  topTrends: string[];
  rateChanges: { carrier: string; product: string; direction: "up" | "down"; detail: string }[];
  winRate: number;                 // percentage
  totalDeals: number;
  topWinReasons: string[];
  topLossReasons: string[];
}

export function calculateWinRate(records: WinLossRecord[]): number {
  if (records.length === 0) return 0;
  const wins = records.filter((r) => r.outcome === "win").length;
  return Math.round((wins / records.length) * 100);
}

export function generateCompetitivePulse(
  intel: CompetitiveIntel[],
  records: WinLossRecord[],
  period: string
): CompetitivePulse {
  const wins = records.filter((r) => r.outcome === "win");
  const losses = records.filter((r) => r.outcome === "loss");

  // Count reasons
  const winReasons = countReasons(wins.map((w) => w.winReason).filter(Boolean) as string[]);
  const lossReasons = countReasons(losses.map((l) => l.lossReason).filter(Boolean) as string[]);

  // Extract rate changes
  const rateIntel = intel.filter((i) => i.category === "rate");
  const rateChanges = rateIntel.map((i) => ({
    carrier: i.carrier,
    product: i.product || "General",
    direction: i.detail.toLowerCase().includes("increase") ? "up" as const : "down" as const,
    detail: i.detail,
  }));

  // Top trends from high-relevance intel
  const topTrends = intel
    .filter((i) => i.relevanceScore >= 70)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5)
    .map((i) => i.detail);

  return {
    period,
    topTrends,
    rateChanges,
    winRate: calculateWinRate(records),
    totalDeals: records.length,
    topWinReasons: winReasons.slice(0, 3),
    topLossReasons: lossReasons.slice(0, 3),
  };
}

function countReasons(reasons: string[]): string[] {
  const counts: Record<string, number> = {};
  for (const r of reasons) {
    counts[r] = (counts[r] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason]) => reason);
}

// ═══════════════════════════════════════════════════════════════════════════
// W9: Client Snapshot → Territory Strategy Tool
// Wealth density analysis and white space identification
// ═══════════════════════════════════════════════════════════════════════════

export interface TerritoryMetrics {
  totalClients: number;
  totalAUM: number;
  avgClientAge: number;
  concentrationByZip: Record<string, number>;   // zip → client count
  concentrationByAge: Record<string, number>;    // age range → count
  concentrationByAsset: Record<string, number>;  // asset range → count
}

export interface WhiteSpaceOpportunity {
  id: string;
  type: "geographic" | "demographic" | "product" | "lifecycle";
  title: string;
  description: string;
  estimatedPotential: number;      // $ revenue opportunity
  confidence: "high" | "medium" | "low";
  suggestedActions: string[];
}

export function analyzeTerritory(
  clients: Array<{ age: number; totalAssets: number; zipCode: string; products: string[] }>
): TerritoryMetrics {
  const byZip: Record<string, number> = {};
  const byAge: Record<string, number> = {};
  const byAsset: Record<string, number> = {};

  for (const c of clients) {
    byZip[c.zipCode] = (byZip[c.zipCode] || 0) + 1;

    const ageRange = c.age < 45 ? "35-44" : c.age < 55 ? "45-54" : c.age < 65 ? "55-64" : "65+";
    byAge[ageRange] = (byAge[ageRange] || 0) + 1;

    const assetRange = c.totalAssets < 250000 ? "Under $250K" : c.totalAssets < 500000 ? "$250K-$500K" : c.totalAssets < 1000000 ? "$500K-$1M" : "$1M+";
    byAsset[assetRange] = (byAsset[assetRange] || 0) + 1;
  }

  return {
    totalClients: clients.length,
    totalAUM: clients.reduce((s, c) => s + c.totalAssets, 0),
    avgClientAge: clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.age, 0) / clients.length) : 0,
    concentrationByZip: byZip,
    concentrationByAge: byAge,
    concentrationByAsset: byAsset,
  };
}

export function identifyWhiteSpace(metrics: TerritoryMetrics): WhiteSpaceOpportunity[] {
  const opportunities: WhiteSpaceOpportunity[] = [];

  // Check age distribution gaps
  const ageRanges = ["35-44", "45-54", "55-64", "65+"];
  for (const range of ageRanges) {
    const count = metrics.concentrationByAge[range] || 0;
    const pct = count / Math.max(1, metrics.totalClients);
    if (pct < 0.1 && range !== "35-44") {
      opportunities.push({
        id: `age_gap_${range}`,
        type: "demographic",
        title: `Underserved: Ages ${range}`,
        description: `Only ${Math.round(pct * 100)}% of your book is ages ${range}. This cohort typically has ${range === "55-64" ? "peak accumulation and rollover opportunities" : "income distribution and legacy planning needs"}.`,
        estimatedPotential: Math.round(metrics.totalAUM * 0.05),
        confidence: "medium",
        suggestedActions: [
          `Run targeted seminar for ${range} age group`,
          "Create age-specific marketing content",
          "Partner with CPAs serving this demographic",
        ],
      });
    }
  }

  // Check asset concentration
  const highNet = metrics.concentrationByAsset["$1M+"] || 0;
  if (highNet < metrics.totalClients * 0.15) {
    opportunities.push({
      id: "upmarket_opportunity",
      type: "demographic",
      title: "Upmarket Growth Opportunity",
      description: "Less than 15% of your book is $1M+ — there's significant room to move upmarket through referral networks and professional partnerships.",
      estimatedPotential: Math.round(metrics.totalAUM * 0.15),
      confidence: "high",
      suggestedActions: [
        "Identify top 10 clients for referral conversations",
        "Join local estate planning attorney network",
        "Create high-net-worth specific service tier",
      ],
    });
  }

  // Product gap analysis
  opportunities.push({
    id: "product_cross_sell",
    type: "product",
    title: "Cross-Sell Opportunity",
    description: "Run Replacement Radar across your entire book to identify annuity upgrade opportunities.",
    estimatedPotential: Math.round(metrics.totalAUM * 0.02),
    confidence: "high",
    suggestedActions: [
      "Batch-run Replacement Radar for all clients with existing annuities",
      "Identify clients without any guaranteed income source",
      "Present Solar Strategy to clients with large taxable accounts",
    ],
  });

  return opportunities.sort((a, b) => b.estimatedPotential - a.estimatedPotential);
}

// ═══════════════════════════════════════════════════════════════════════════
// W10: Income Timeline → Drag-and-Drop Meeting Tool
// Real-time income recalculation on source repositioning
// ═══════════════════════════════════════════════════════════════════════════

export interface IncomeSource {
  id: string;
  name: string;
  type: "social_security" | "pension" | "annuity" | "iul" | "rental" | "part_time" | "rmd" | "other";
  startAge: number;
  endAge: number | null;           // null = lifetime
  monthlyAmount: number;
  taxable: boolean;
  guaranteed: boolean;
  adjustable: boolean;             // can the start age be moved?
  cola: number;                    // annual cost-of-living adjustment %
}

export interface TimelineState {
  sources: IncomeSource[];
  clientAge: number;
  retirementAge: number;
  targetMonthlyIncome: number;
  inflationRate: number;
}

export interface TimelineProjection {
  age: number;
  totalIncome: number;
  guaranteedIncome: number;
  nonGuaranteedIncome: number;
  taxableIncome: number;
  taxFreeIncome: number;
  incomeGap: number;               // negative = surplus
  sources: { id: string; amount: number }[];
}

export function projectTimeline(state: TimelineState, throughAge: number = 95): TimelineProjection[] {
  const projections: TimelineProjection[] = [];

  for (let age = state.retirementAge; age <= throughAge; age++) {
    const yearsFromNow = age - state.clientAge;
    const inflatedTarget = state.targetMonthlyIncome * Math.pow(1 + state.inflationRate / 100, yearsFromNow);

    let total = 0;
    let guaranteed = 0;
    let nonGuaranteed = 0;
    let taxable = 0;
    let taxFree = 0;
    const sourceAmounts: { id: string; amount: number }[] = [];

    for (const src of state.sources) {
      if (age < src.startAge) continue;
      if (src.endAge !== null && age > src.endAge) continue;

      const yearsActive = age - src.startAge;
      const amount = src.monthlyAmount * Math.pow(1 + src.cola / 100, yearsActive);

      total += amount;
      sourceAmounts.push({ id: src.id, amount: Math.round(amount) });

      if (src.guaranteed) guaranteed += amount;
      else nonGuaranteed += amount;

      if (src.taxable) taxable += amount;
      else taxFree += amount;
    }

    projections.push({
      age,
      totalIncome: Math.round(total),
      guaranteedIncome: Math.round(guaranteed),
      nonGuaranteedIncome: Math.round(nonGuaranteed),
      taxableIncome: Math.round(taxable),
      taxFreeIncome: Math.round(taxFree),
      incomeGap: Math.round(total - inflatedTarget),
      sources: sourceAmounts,
    });
  }

  return projections;
}

export function simulateSourceMove(
  state: TimelineState,
  sourceId: string,
  newStartAge: number
): TimelineProjection[] {
  const updatedSources = state.sources.map((s) =>
    s.id === sourceId ? { ...s, startAge: newStartAge } : s
  );
  return projectTimeline({ ...state, sources: updatedSources });
}

// ═══════════════════════════════════════════════════════════════════════════
// W11: Stale Digest → Automated Outreach Engine
// Monday morning digest with pre-written re-engagement messages
// ═══════════════════════════════════════════════════════════════════════════

export interface StaleClient {
  id: string;
  name: string;
  email: string;
  lastContactDate: Date;
  daysSinceContact: number;
  totalAssets: number;
  riskLevel: "low" | "medium" | "high";
  staleTrigger: StaleTrigger;
  suggestedOutreach: OutreachTemplate;
}

export type StaleTrigger =
  | "no_contact_30"
  | "no_contact_60"
  | "no_contact_90"
  | "birthday_upcoming"
  | "anniversary_upcoming"
  | "market_event"
  | "policy_renewal"
  | "rmd_deadline"
  | "life_event";

export interface OutreachTemplate {
  subject: string;
  body: string;
  callToAction: string;
  channel: "email" | "phone" | "text";
  urgency: "routine" | "timely" | "urgent";
}

export interface MondayDigest {
  generatedAt: Date;
  weekOf: string;
  totalStaleClients: number;
  urgentCount: number;
  timelyCount: number;
  routineCount: number;
  topPriority: StaleClient[];      // top 5 by risk/asset combo
  revenueAtRisk: number;
  suggestedActions: string[];
}

const OUTREACH_TEMPLATES: Record<StaleTrigger, (client: { name: string }) => OutreachTemplate> = {
  no_contact_30: (c) => ({
    subject: `Checking in, ${c.name.split(" ")[0]}`,
    body: `Hi ${c.name.split(" ")[0]}, I wanted to touch base and see how things are going. The markets have been active lately, and I want to make sure your plan is still aligned with your goals. Do you have 15 minutes this week for a quick check-in?`,
    callToAction: "Schedule a 15-minute call",
    channel: "email",
    urgency: "routine",
  }),
  no_contact_60: (c) => ({
    subject: `${c.name.split(" ")[0]}, it's been a while — let's reconnect`,
    body: `Hi ${c.name.split(" ")[0]}, I noticed it's been a couple of months since we last spoke. I've been working on some new strategies that could benefit your situation, and I'd love to share them with you. Can we find a time to connect?`,
    callToAction: "Book a review meeting",
    channel: "email",
    urgency: "timely",
  }),
  no_contact_90: (c) => ({
    subject: `Important: Your financial review is overdue`,
    body: `Hi ${c.name.split(" ")[0]}, it's been over 90 days since our last review. A lot can change in that time — tax laws, market conditions, and your personal situation. I want to make sure nothing has fallen through the cracks. Let's schedule your quarterly review this week.`,
    callToAction: "Schedule quarterly review",
    channel: "phone",
    urgency: "urgent",
  }),
  birthday_upcoming: (c) => ({
    subject: `Happy Birthday, ${c.name.split(" ")[0]}! 🎂`,
    body: `Hi ${c.name.split(" ")[0]}, wishing you a wonderful birthday! As you enter a new year, it's a great time to review your financial goals and make sure everything is on track. I'd love to catch up soon.`,
    callToAction: "Schedule a birthday review",
    channel: "email",
    urgency: "timely",
  }),
  anniversary_upcoming: (c) => ({
    subject: `Celebrating our partnership, ${c.name.split(" ")[0]}`,
    body: `Hi ${c.name.split(" ")[0]}, it's almost the anniversary of when we started working together! I'd love to review how far we've come and discuss what's ahead. Let's schedule a quick review.`,
    callToAction: "Schedule anniversary review",
    channel: "email",
    urgency: "routine",
  }),
  market_event: (c) => ({
    subject: `Market update: What it means for you`,
    body: `Hi ${c.name.split(" ")[0]}, given recent market activity, I wanted to reach out proactively. Your portfolio is designed to handle volatility, but I want to make sure you're comfortable with your current positioning. Let's talk.`,
    callToAction: "Schedule a market review call",
    channel: "phone",
    urgency: "urgent",
  }),
  policy_renewal: (c) => ({
    subject: `Your policy renewal is coming up`,
    body: `Hi ${c.name.split(" ")[0]}, your policy renewal is approaching. This is a good time to review your coverage and make sure it still fits your needs. I've also identified some new options that might offer better value.`,
    callToAction: "Review renewal options",
    channel: "email",
    urgency: "timely",
  }),
  rmd_deadline: (c) => ({
    subject: `Action needed: RMD deadline approaching`,
    body: `Hi ${c.name.split(" ")[0]}, your Required Minimum Distribution deadline is approaching. We need to ensure your distribution is processed on time to avoid the 25% penalty. Let's confirm your distribution plan this week.`,
    callToAction: "Confirm RMD distribution",
    channel: "phone",
    urgency: "urgent",
  }),
  life_event: (c) => ({
    subject: `Thinking of you, ${c.name.split(" ")[0]}`,
    body: `Hi ${c.name.split(" ")[0]}, I understand you've had some changes recently. Life events often have financial implications, and I want to make sure your plan adapts accordingly. I'm here whenever you're ready to talk.`,
    callToAction: "Schedule a life event review",
    channel: "email",
    urgency: "timely",
  }),
};

export function generateOutreachTemplate(trigger: StaleTrigger, client: { name: string }): OutreachTemplate {
  return OUTREACH_TEMPLATES[trigger](client);
}

export function generateMondayDigest(staleClients: StaleClient[]): MondayDigest {
  const urgent = staleClients.filter((c) => c.suggestedOutreach.urgency === "urgent");
  const timely = staleClients.filter((c) => c.suggestedOutreach.urgency === "timely");
  const routine = staleClients.filter((c) => c.suggestedOutreach.urgency === "routine");

  // Top priority: urgent first, then by assets
  const topPriority = [...staleClients]
    .sort((a, b) => {
      const urgencyOrder = { urgent: 0, timely: 1, routine: 2 };
      const urgDiff = urgencyOrder[a.suggestedOutreach.urgency] - urgencyOrder[b.suggestedOutreach.urgency];
      if (urgDiff !== 0) return urgDiff;
      return b.totalAssets - a.totalAssets;
    })
    .slice(0, 5);

  const revenueAtRisk = staleClients
    .filter((c) => c.daysSinceContact > 60)
    .reduce((s, c) => s + c.totalAssets * 0.01, 0); // ~1% AUM fee at risk

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday

  return {
    generatedAt: now,
    weekOf: weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    totalStaleClients: staleClients.length,
    urgentCount: urgent.length,
    timelyCount: timely.length,
    routineCount: routine.length,
    topPriority,
    revenueAtRisk: Math.round(revenueAtRisk),
    suggestedActions: [
      urgent.length > 0 ? `Call ${urgent.length} urgent client(s) today` : "",
      timely.length > 0 ? `Send ${timely.length} timely email(s) this week` : "",
      routine.length > 0 ? `Schedule ${routine.length} routine check-in(s)` : "",
    ].filter(Boolean),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// W12: Workflow Automations → Platform Nervous System
// Trigger events from all tools, recommended automations wizard
// ═══════════════════════════════════════════════════════════════════════════

export type PlatformEvent =
  | "client.created"
  | "client.updated"
  | "client.stale"
  | "meeting.scheduled"
  | "meeting.completed"
  | "meeting.missed"
  | "risk.score_changed"
  | "risk.drift_detected"
  | "replacement.high_score"
  | "replacement.solar_eligible"
  | "retirement_dna.generated"
  | "income.gap_detected"
  | "tax.opportunity_found"
  | "tax.rmd_approaching"
  | "compliance.review_due"
  | "compliance.alert"
  | "policy.renewal_approaching"
  | "payment.received"
  | "payment.failed"
  | "onboarding.completed"
  | "onboarding.stalled"
  | "scenario.saved"
  | "report.generated";

export interface AutomationTrigger {
  event: PlatformEvent;
  conditions?: Record<string, unknown>;  // e.g., { score: { gte: 80 } }
}

export interface AutomationAction {
  type: "email" | "notification" | "task" | "webhook" | "update_field" | "generate_report";
  config: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled: boolean;
  category: "engagement" | "compliance" | "revenue" | "operations";
  createdAt: Date;
}

export const RECOMMENDED_AUTOMATIONS: Omit<AutomationRule, "id" | "createdAt">[] = [
  {
    name: "New Client Welcome Sequence",
    description: "When a client completes onboarding, send welcome email and schedule first review meeting",
    trigger: { event: "onboarding.completed" },
    actions: [
      { type: "email", config: { template: "welcome_sequence" } },
      { type: "task", config: { title: "Schedule first review meeting", dueInDays: 7 } },
    ],
    enabled: true,
    category: "engagement",
  },
  {
    name: "High Replacement Score Alert",
    description: "When Replacement Radar scores a client above 80, notify advisor immediately",
    trigger: { event: "replacement.high_score", conditions: { score: { gte: 80 } } },
    actions: [
      { type: "notification", config: { title: "Replacement Opportunity", urgency: "high" } },
      { type: "task", config: { title: "Review replacement analysis", dueInDays: 3 } },
    ],
    enabled: true,
    category: "revenue",
  },
  {
    name: "Solar Strategy Eligible",
    description: "When a client with taxable annuity is identified as Solar Strategy eligible, flag for review",
    trigger: { event: "replacement.solar_eligible" },
    actions: [
      { type: "notification", config: { title: "Solar Strategy Candidate", urgency: "medium" } },
      { type: "task", config: { title: "Prepare Solar Strategy presentation", dueInDays: 7 } },
    ],
    enabled: true,
    category: "revenue",
  },
  {
    name: "Risk Drift Alert",
    description: "When a client's risk profile drifts significantly, trigger a review",
    trigger: { event: "risk.drift_detected" },
    actions: [
      { type: "notification", config: { title: "Risk Drift Detected" } },
      { type: "email", config: { template: "risk_review_invitation" } },
    ],
    enabled: true,
    category: "compliance",
  },
  {
    name: "RMD Deadline Reminder",
    description: "60 days before RMD deadline, create urgent task and notify advisor",
    trigger: { event: "tax.rmd_approaching" },
    actions: [
      { type: "notification", config: { title: "RMD Deadline Approaching", urgency: "urgent" } },
      { type: "task", config: { title: "Process RMD distribution", dueInDays: 14 } },
      { type: "email", config: { template: "rmd_reminder" } },
    ],
    enabled: true,
    category: "compliance",
  },
  {
    name: "Stale Client Escalation",
    description: "When a client has no contact for 90+ days, escalate to manager and create urgent task",
    trigger: { event: "client.stale", conditions: { daysSinceContact: { gte: 90 } } },
    actions: [
      { type: "notification", config: { title: "Client At Risk", urgency: "urgent" } },
      { type: "task", config: { title: "Re-engage stale client immediately", dueInDays: 2 } },
    ],
    enabled: true,
    category: "engagement",
  },
  {
    name: "Meeting Follow-Up",
    description: "After a meeting is marked complete, create follow-up task and send summary email",
    trigger: { event: "meeting.completed" },
    actions: [
      { type: "task", config: { title: "Send meeting summary and next steps", dueInDays: 1 } },
      { type: "generate_report", config: { type: "meeting_summary" } },
    ],
    enabled: true,
    category: "operations",
  },
  {
    name: "Compliance Review Scheduler",
    description: "When compliance review is due, create task and block client modifications",
    trigger: { event: "compliance.review_due" },
    actions: [
      { type: "task", config: { title: "Complete compliance review", dueInDays: 5 } },
      { type: "notification", config: { title: "Compliance Review Due", urgency: "high" } },
    ],
    enabled: true,
    category: "compliance",
  },
];

export const ALL_PLATFORM_EVENTS: { event: PlatformEvent; label: string; category: string }[] = [
  { event: "client.created", label: "New Client Created", category: "Clients" },
  { event: "client.updated", label: "Client Profile Updated", category: "Clients" },
  { event: "client.stale", label: "Client Becomes Stale", category: "Clients" },
  { event: "meeting.scheduled", label: "Meeting Scheduled", category: "Meetings" },
  { event: "meeting.completed", label: "Meeting Completed", category: "Meetings" },
  { event: "meeting.missed", label: "Meeting Missed/No-Show", category: "Meetings" },
  { event: "risk.score_changed", label: "Risk Score Changed", category: "Risk" },
  { event: "risk.drift_detected", label: "Risk Drift Detected", category: "Risk" },
  { event: "replacement.high_score", label: "High Replacement Score", category: "Annuities" },
  { event: "replacement.solar_eligible", label: "Solar Strategy Eligible", category: "Annuities" },
  { event: "retirement_dna.generated", label: "Retirement DNA Generated", category: "Planning" },
  { event: "income.gap_detected", label: "Income Gap Detected", category: "Planning" },
  { event: "tax.opportunity_found", label: "Tax Opportunity Found", category: "Tax" },
  { event: "tax.rmd_approaching", label: "RMD Deadline Approaching", category: "Tax" },
  { event: "compliance.review_due", label: "Compliance Review Due", category: "Compliance" },
  { event: "compliance.alert", label: "Compliance Alert Triggered", category: "Compliance" },
  { event: "policy.renewal_approaching", label: "Policy Renewal Approaching", category: "Insurance" },
  { event: "payment.received", label: "Payment Received", category: "Billing" },
  { event: "payment.failed", label: "Payment Failed", category: "Billing" },
  { event: "onboarding.completed", label: "Onboarding Completed", category: "Onboarding" },
  { event: "onboarding.stalled", label: "Onboarding Stalled", category: "Onboarding" },
  { event: "scenario.saved", label: "Scenario Saved", category: "Strategy" },
  { event: "report.generated", label: "Report Generated", category: "Reports" },
];
