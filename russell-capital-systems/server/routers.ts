import { TRPCError } from "@trpc/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { SYSTEM_PREAMBLE, BRAND_SYSTEM_IDENTITY } from "@shared/branding";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { invokePortalAI } from "./portalAI";
import { ultraRouter } from "./ultraAI";
import { leadsRouter } from "./leadsRouter";
import { factFinderRouter } from "./factFinderRouter";
import { librarianRouter } from "./librarianRouter";
import { messagesRouter } from "./messagesRouter";
import { ledgerRouter } from "./ledgerRouter";
import { integrationsRouter } from "./integrationsRouter";
import { controlsRouter } from "./controlsRouter";
import { erosionRouter } from "./erosionRouter";
import { forgivenessRouter } from "./forgivenessRouter";
import { taxScheduleRouter } from "./taxScheduleRouter";
import { unaskedRouter } from "./unaskedRouter";
import { siteHealthRouter } from "./siteHealthRouter";
import { isStrongPassword, PASSWORD_RULE } from "@shared/passwordPolicy";
import { recordDocumentProvenance } from "./provenance";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createClient, createDeal, createInvitation, createKnowledgeDoc,
  createScenario, createStrategy, getDashboardAnalytics, getDashboardStats, getDeals,
  getClientById, getClients, getInvitations, getInvitationByToken, getLastContactDates,
  getKnowledgeDocs, getMemberships, getOrCreateWorkspace, getScenarios,
  getStrategiesByClient, getSubscription, getWorkspaceByOwnerId,
  ensureMembership, updateClient, updateDeal, upsertSubscription, writeAuditLog,
  seedDemoWorkspace, getAuditLogs,
  getClientNotes, createClientNote, deleteClientNote,
  getScenariosByClient, deleteScenario,
  updateMemberRole, removeMember, getMembershipById,
  logClientActivity, getClientActivityLog,
  getStaleClients, exportClientsCsv,
  createTag, listTags, deleteTag, assignTag, removeTagAssignment, getClientTagIds, getClientsByTag, getBulkClientTags,
  createGoal, listGoals, updateGoal, deleteGoal, getGoalProgress,
  createWebhook, listWebhooks, updateWebhook, deleteWebhook,
  uploadClientDocument, listClientDocuments, deleteClientDocument,
  upsertReportSchedule, getReportSchedule,
  upsertSlackIntegration, getSlackIntegration, deleteSlackIntegration,
  searchClientsByName, getPipelineSummary, getWorkspaceStats,
  getFilteredActivityLog, getActivityLogForExport,
  createPortalToken, getPortalTokensByClient, validatePortalToken, revokePortalToken, getClientPortalData,
  setAllocationTargets, getAllocationTargets, checkPortfolioDrift,
  createRebalanceAlert, getRebalanceAlerts, acknowledgeRebalanceAlert, resolveRebalanceAlert,
  getAllClientsWithTargets, updateAllocationCurrentPct,
  bulkUpdateAllocations, getWorkspaceBranding, updateWorkspaceBranding,
  createInAppNotification, getInAppNotifications, getUnreadNotificationCount,
  markNotificationRead, markAllNotificationsRead,
  getUserWorkspaces,
  createMeeting, getMeetingsByClient, getMeetingsByWorkspace, updateMeeting, deleteMeeting,
  getWidgetConfig, saveWidgetConfig,
  computeClientRiskScores, getAdvisorPerformanceMetrics,
  getUpcomingMeetingsForReminder, markMeetingReminderSent,
  getReminderPrefs, upsertReminderPrefs,
  getAdvisorPerformanceMetricsFiltered, generateRiskRecommendations,
  getRiskScoreHistory, getRiskScoreHistoryBulk,
  getHubspotSyncSettings, upsertHubspotSyncSettings, updateHubspotSyncStatus,
  logHubspotSync, getHubspotSyncHistory,
  getClientByHubspotId, getDealByHubspotId, linkClientToHubspot, linkDealToHubspot,
  createComplianceAlert, getComplianceAlerts, getComplianceAlertStats,
  dismissComplianceAlert, resolveComplianceAlert, getActiveComplianceAlertTypes,
  runComplianceChecks, getClientPortalDataEnhanced,
  isOnboardingComplete, markOnboardingComplete,
  getClientProperties, createClientProperty, updateClientProperty, deleteClientProperty,
  getClientCryptoHoldings, createClientCryptoHolding, updateClientCryptoHolding, deleteClientCryptoHolding,
  getSavedStrategies, getSavedStrategyById, createSavedStrategy, deleteSavedStrategy, getStrategyVersions, getLatestVersion, toggleArchiveStrategy,
  getCarrierOverrides, getCarrierOverride, upsertCarrierOverride, deleteCarrierOverride,
  createRecommendationHistory, getRecommendationHistory, getRecommendationHistoryByClient,
  createReferral, listReferrals, updateReferral, deleteReferral,
  listAllDocuments,
  saveComplianceSignatureDb, getLatestComplianceSignature, getComplianceSignaturesByUser, getAllComplianceSignatures,
  createUserSession, endUserSession, endUserSessionByUserId, getActiveSession, getUserSessionHistory, getAllUserSessions, getDistinctSessionUsers,
  logPageVisit, closePageVisit, getPageActivityBySession, getPageActivityByUser,
  getHouseholdFactFinder, upsertHouseholdFactFinder,
  createPaymentDisclosure, getPaymentDisclosures, getPaymentDisclosuresByUser, getPaymentDisclosureById,
  createSmsVerificationCode, getLatestSmsCode, markSmsCodeVerified, incrementSmsAttempts,
  saveRiskSnapshot, getRiskSnapshotHistory, getLatestRiskSnapshot,
  listBatchSchedules, createBatchSchedule, updateBatchSchedule, deleteBatchSchedule,
  listSlideDecks, getSlideDeckById, createSlideDeck, updateSlideDeck, deleteSlideDeck,
  addOwnerTrustedIp, isOwnerTrustedIp, getOwnerTrustedIps, removeOwnerTrustedIp,
  addSlideComment, getSlideComments, resolveSlideComment, deleteSlideComment,
  createSlideShare, getSlideShares, getSlideShareByToken, deleteSlideShare,
  getOwnerAnalyticsSummary, getTopPages, getRecentLogins, getConversionFunnel,
  getWorkspaceRecentActivity, getTopClientsByAUM, getAssetAllocation,
  getSidebarFavorites, addSidebarFavorite, removeSidebarFavorite,
  logSlideUsage, getTrialSlideCountToday, getSlideUsageAnalytics,
  getReelFeed, recordReelInteraction, toggleReelLike, toggleReelSave,
  getUserLikedReelIds, getUserSavedReelIds, getUserSavedReels,
} from "./db";
import type { LeaderboardPeriod } from "./db";
import { createCheckoutSession, ensureStripeCustomer, createPortalSession } from "./stripeClient";
import { storagePut } from "./storage";
import { experienceRouter, willWriterRouter, petRouter, morningRitualRouter, withdrawalRouter, revenueGuaranteeRouter, warStoryAIRouter, questProgressRouter, rivalryRouter, revenueAttributionRouter, dealScoringRouter, monthlyReportRouter, errorLogRouter } from "./experienceRouter";
import { planningCasesRouter } from "./planningCasesRouter";
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";
import { sendInvitationEmail, sendStaleClientDigest, sendStrategyNotification, sendProjectionFollowUp, sendQuoteRequestNotification, sendDriftAlertEmail } from "./email";
import { recommendCarriers, type CarrierRates, type RiskTolerance } from "@shared/carrierRecommendation";
import { IUL_CARRIERS } from "@shared/iulCarriers";
import { dispatchWebhook, WEBHOOK_EVENTS } from "./webhookDispatch";
import { generateBulkComparisonPdf, type BulkResult, type BulkSummary } from "./bulkComparisonPdf";
import { getDb } from "./db";
import { workspaceSubscriptions, workspaces as workspacesTable, sharedProjections, followUpEmails, carrierQuoteRequests, savedScenarios, illustrationUploads, emailCampaigns as emailCampaignsTable, emailTemplates as emailTemplatesTable, campaignEnrollments as campaignEnrollmentsTable, calculationAuditLogs, referralLinks, hiddenMaterialConfig, hiddenMaterialResetCodes, clientRiskAssessments, clientLifeGoals, clientScores, clientBadges, clientRecommendations, clientSessionRatings, encouragementEmails, clients, tutorialProgress, agencyTeams, agencyTeamMembers, supervisorMonitoringAgreements, legalDocuments, userSessions, pageActivityLogs, memberships, leaderboardProfiles, leaderboardConsents, deals } from "../drizzle/schema";
import { eq, and, desc, lte, isNull, gte, inArray, sql, asc } from "drizzle-orm";
import { getUserMembership } from "./db";
import { runMortgageKillerAnalysis, buildStandardAmortization, calculateInterestSavings, type MortgageKillerInput } from "@shared/mortgageKiller";
import { calculateEstateTax } from "@shared/advancedAnalytics";
import { calculateComprehensiveEstateTax } from "@shared/estateTaxEngine";
import { ALL_INDEX_OPTIONS, CARRIERS, AVAILABLE_YEARS, getCreditingHistory, runBacktest } from "@shared/indexCreditingData";
import { MODEL_PORTFOLIOS, getPortfolioAllocations } from "@shared/modelPortfolios";
import { calculatePremiumFinancing } from "@shared/premiumFinancing";
import { optimizePolicyLoans, compareLoanStrategies } from "@shared/policyLoanOptimizer";
import { calculateBracketWaterfall, calculateComprehensiveTaxWaterfall, generateRecommendation, buildIncomeTimeline, runCompetitiveAnalysis, compareIULvsRoth, inflationImpactSummary } from "@shared/advancedAnalytics";
import { BITCOIN_CYCLES, simulateNextCycles, runCryptoAccumulation } from "@shared/cryptoCycleEngine";
import { calculateLifetimeIncome, getDefaultLifetimeIncomeInput, INCOME_RATE_TABLE, analyzeExistingAnnuity, getDefaultExistingAnnuityInput } from "@shared/lifetimeIncomeEngine";
import { FG_PRODUCT_DATA, INDEX_STRATEGIES, PRECIOUS_METALS_DATA, ETF_VS_TRADITIONAL, FIAT_CURRENCY_DATA, runGrowthAnnuityAnalysis } from "@shared/growthAnnuityEngine";

// ─── Financial engine ─────────────────────────────────────────────────────────
function calcRothHeadroom(income: number, targetBracket: number): number {
  const brackets = [
    { top: 23200, rate: 0.10 }, { top: 94300, rate: 0.12 }, { top: 201050, rate: 0.22 },
    { top: 383900, rate: 0.24 }, { top: 487450, rate: 0.32 }, { top: 731200, rate: 0.35 },
    { top: Infinity, rate: 0.37 },
  ];
  for (const b of brackets) {
    if (b.rate <= targetBracket && income < b.top) return Math.max(0, b.top - income);
  }
  return 0;
}

function buildRothLadder(input: { age: number; income: number; iraBalance: number; targetBracket: number; years: number; assumedReturn: number }) {
  let ira = input.iraBalance; let roth = 0; const rows = [];
  for (let y = 1; y <= input.years; y++) {
    const headroom = calcRothHeadroom(input.income, input.targetBracket);
    const conversion = Math.min(headroom, ira);
    const tax = Math.round(conversion * input.targetBracket);
    ira = Math.max((ira - conversion) * (1 + input.assumedReturn), 0);
    roth = (roth + conversion) * (1 + input.assumedReturn);
    const irmaa = input.income + conversion > 206000 ? 3600 : 0;
    rows.push({ year: y, age: input.age + y - 1, conversion: Math.round(conversion), taxEstimate: tax, endingIraBalance: Math.round(ira), endingRothBalance: Math.round(roth), estimatedIrmaa: irmaa });
  }
  return rows;
}

/**
 * IUL Projection Engine — Based on A Mutual Life Indexed UL Accumulator III
 * (sample illustration, SAMPLE-IUL-001)
 *
 * Charge architecture from actual illustration:
 * - Premium load: 8% year 1, 6% years 2-5, 0% after
 * - Per policy: $120/year ($10/month)
 * - Per $1000 SA: $7.78/year for years 1-10, $0 after
 * - COI: Age-based, starts low, peaks mid-80s, declines as NAR shrinks
 * - Conditional credit: 0.20% of AV from year 11+
 * - Surrender charges: 37.6% of Y1 premium flat Y1-3, linear decline to $0 by Y11
 * - Default growth: 12% annual (user instruction)
 * - Loan rate: 5% charged
 */
function projectIul(annualPremium: number, years: number, creditRate = 0.12, premiumYears = 5, issueAge = 50) {
  let cv = 0;
  const rows = [];
  // Specified amount approximation: ~10x annual premium (from illustration ratio)
  const specifiedAmount = annualPremium * 10;
  const perUnitCharge = (specifiedAmount / 1000) * 7.78; // $7.78 per $1000 SA, years 1-10 only

  for (let y = 1; y <= years; y++) {
    const age = issueAge + y;
    const premium = y <= premiumYears ? annualPremium : 0;

    // Premium load: 8% year 1, 6% years 2-5, 0% after
    const premiumLoadRate = y === 1 ? 0.08 : (y <= premiumYears ? 0.06 : 0);
    const premiumLoad = premium * premiumLoadRate;

    // Per policy charge: $120/year flat
    const perPolicyCharge = 120;

    // Per $1000 SA charge: years 1-10 only
    const perUnitCost = y <= 10 ? perUnitCharge : 0;

    // COI: age-based approximation from illustration data
    // Scales with net amount at risk (DB - AV)
    const netAmountAtRisk = Math.max(0, specifiedAmount * 1.5 - cv);
    const baseCOIRate = getCoiRate(age);
    const coiCharge = netAmountAtRisk * baseCOIRate;

    // Conditional credit: 0.20% of AV from year 11+
    const conditionalCredit = y >= 11 ? cv * 0.002 : 0;

    // Net premium to account
    const netPremium = premium - premiumLoad;
    const beginningValue = cv + netPremium;

    // Deduct charges from AV
    const totalCharges = perPolicyCharge + perUnitCost + coiCharge;
    const afterCharges = Math.max(0, beginningValue - totalCharges + conditionalCredit);

    // Interest earned at credited rate (12% default per user instruction)
    const interestEarned = afterCharges * creditRate;
    cv = afterCharges + interestEarned;

    // Surrender value: subtract surrender charge
    const surrenderCharge = getSurrenderCharge(y, annualPremium);
    const surrenderValue = Math.max(0, cv - surrenderCharge);

    rows.push({
      year: y,
      cashValue: Math.round(cv),
      surrenderValue: Math.round(surrenderValue),
      premium: Math.round(premium),
      premiumLoad: Math.round(premiumLoad),
      coiCharge: Math.round(coiCharge),
      perUnitCost: Math.round(perUnitCost),
      conditionalCredit: Math.round(conditionalCredit),
      interestEarned: Math.round(interestEarned),
      surrenderCharge: Math.round(surrenderCharge),
      annualLoan: y >= years - 2 ? 30000 : 0,
    });
  }
  return { rows, terminalCashValue: Math.round(cv) };
}

/** COI rate by age — derived from A Mutual Life Accumulator III illustration */
function getCoiRate(age: number): number {
  if (age <= 40) return 0.0008;
  if (age <= 50) return 0.0012;
  if (age <= 55) return 0.0018;
  if (age <= 60) return 0.0028;
  if (age <= 65) return 0.0042;
  if (age <= 70) return 0.0065;
  if (age <= 75) return 0.0100;
  if (age <= 80) return 0.0160;
  if (age <= 85) return 0.0220;
  if (age <= 90) return 0.0180;
  if (age <= 95) return 0.0080;
  return 0.0000; // COI drops to $0 when AV exceeds DB (age 96+)
}

/** Surrender charge schedule — from A Mutual Life Accumulator III illustration */
function getSurrenderCharge(year: number, annualPremium: number): number {
  // Surrender charge as % of first-year premium: 37.6% flat Y1-3, linear decline to $0 by Y11
  const baseCharge = annualPremium * 0.376;
  if (year <= 3) return baseCharge;
  if (year >= 11) return 0;
  // Years 4-10: linear decline from baseCharge to 0
  const remaining = 11 - year; // 7 at year 4, 1 at year 10
  return baseCharge * (remaining / 7);
}

function estimateRealEstate(purchasePrice: number, bonusDepreciation = 0.4) {
  const costSegBasis = purchasePrice * 0.3;
  return { purchasePrice, costSegBasis: Math.round(costSegBasis), totalYearOneShelter: Math.round(costSegBasis * bonusDepreciation) };
}

function scoreOpportunity(income: number, iraBalance: number, realEstateEquity: number) {
  const roth = Math.min(100, (iraBalance / 1_000_000) * 60);
  const re = Math.min(100, (realEstateEquity / 2_000_000) * 50);
  const inc = Math.min(100, (income / 400_000) * 40);
  return Math.min(100, Math.round(roth * 0.4 + re * 0.3 + inc * 0.3));
}

// ─── Workspace helper ─────────────────────────────────────────────────────────
async function getWorkspaceForUser(userId: number) {
  const ws = await getWorkspaceByOwnerId(userId);
  if (ws) { await ensureMembership(userId, ws.id); return ws; }
  const slug = `workspace-${userId}-${Date.now()}`;
  const created = await getOrCreateWorkspace(userId, "My Workspace", slug);
  if (created) await ensureMembership(userId, created.id);
  return created;
}

const TRIAL_SLIDE_DAILY_LIMIT = 999; // All users get unlimited slide generation

/** Determine the user's access tier for slide rate-limiting */
async function getUserAccessTier(user: { id: number; openId: string; email?: string | null; role: string }): Promise<"owner" | "unlimited" | "subscriber" | "trial"> {
  if (user.openId === ENV.ownerOpenId || user.role === "admin") return "owner";
  return "unlimited";
}

const BILLING_PLANS = [
  { slug: "beginner", name: "Beginner", monthlyPrice: 1200, annualPrice: 11520, seats: 3, features: ["3 advisor seats", "CRM + pipeline", "Roth & IUL engine", "Strategy assist (50 runs/mo)", "Knowledge library (10 docs)", "100 RCMS Credits/mo", "Lead Generator (basic)"] },
  { slug: "professional", name: "Professional", monthlyPrice: 4500, annualPrice: 43200, seats: 10, features: ["10 advisor seats", "Everything in Beginner", "Unlimited strategy runs", "Team invitations", "Audit log", "Priority support", "500 RCMS Credits/mo", "Lead Generator (advanced)", "Verified contact data"] },
  { slug: "enterprise", name: "Enterprise", monthlyPrice: 15000, annualPrice: 144000, seats: 25, features: ["25+ seats", "White-label deployment", "Custom knowledge ingestion", "Compliance review", "Priority implementation", "2,000 RCMS Credits/mo", "Lead Generator (unlimited)", "Exclusive verified leads", "Dedicated lead concierge"] },
];
const mortgageKillerInputSchema = z.object({
  mortgageBalance: z.number().min(1),
  mortgageRate: z.number().min(0.001).max(0.20),
  mortgageTermMonths: z.number().min(12).max(480),
  monthlyMortgagePayment: z.number().min(0),
  monthlyInterestOnlyPayment: z.number().min(0).default(0),
  totalInterestPayments: z.number().min(0).default(0),
  homeEquityValue: z.number().min(0),
  homeMarketValue: z.number().min(0),
  iraValue: z.number().min(0).default(0),
  cashValue: z.number().min(0).default(0),
  investments: z.number().min(0).default(0),
  annuities: z.number().min(0).default(0),
  otherInvestments: z.number().min(0).default(0),
  cryptocurrency: z.number().min(0).default(0),
  annualIncome: z.number().min(1),
  incomeAllocationPct: z.number().min(0.05).max(0.50).default(0.20),
  iulCreditRate: z.number().min(0.04).max(0.20).default(0.075),
  premiumYears: z.number().min(3).max(5).default(5),
  helocRate: z.number().min(0.01).max(0.20).default(0.085),
  helocLtvPct: z.number().min(0.10).max(0.90).default(0.70),
  policyLoanPct: z.number().min(0.10).max(0.95).default(0.80),
  policyLoanDragRate: z.number().min(0.01).max(0.10).default(0.05),
  interestReinvestRate: z.number().min(0.01).max(0.20).default(0.07),
  interestReinvestYears: z.number().min(5).max(40).default(20),
  clientAge: z.number().min(18).max(80).default(45),
});
export const appRouter = router({
  system: systemRouter,
  planningCases: planningCasesRouter,
  ultra: ultraRouter,
  leads: leadsRouter,
  factFinder: factFinderRouter,
  librarian: librarianRouter,
  messages: messagesRouter,
  ledger: ledgerRouter,
  integrations: integrationsRouter,
  controls: controlsRouter,
  erosion: erosionRouter,
  forgiveness: forgivenessRouter,
  taxSchedule: taxScheduleRouter,
  unasked: unaskedRouter,
  siteHealth: siteHealthRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(10).max(1024).refine(isStrongPassword, { message: PASSWORD_RULE }),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      }))
      .mutation(() => {
        throw new TRPCError({ code: "FORBIDDEN", message: "Password registration is retired. Continue with secure sign in." });
      }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().default("") }))
      .mutation(() => {
        throw new TRPCError({ code: "FORBIDDEN", message: "Password login is retired. Continue with secure sign in." });
      }),

    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(() => {
        throw new TRPCError({ code: "FORBIDDEN", message: "Password reset is retired. Continue with secure sign in." });
      }),

    resetPassword: publicProcedure
      .input(z.object({ token: z.string(), password: z.string().min(10).max(1024).refine(isStrongPassword, { message: PASSWORD_RULE }) }))
      .mutation(() => {
        throw new TRPCError({ code: "FORBIDDEN", message: "Password reset is retired. Continue with secure sign in." });
      }),

    passwordGate: publicProcedure
      .input(z.object({ password: z.string(), email: z.string().email().optional() }))
      .mutation(() => {
        throw new TRPCError({ code: "FORBIDDEN", message: "Password-gate access is disabled. Continue with secure sign in." });
      }),

    // Legacy pre-checkout PIN procedure names are retained only to fail closed.
    sendEmailPin: publicProcedure.input(z.object({ email: z.string().email() })).mutation(() => {
      throw new TRPCError({ code: "FORBIDDEN", message: "Email PIN access is retired. Continue with secure managed sign in." });
    }),
    verifyEmailPin: publicProcedure.input(z.object({ email: z.string().email(), code: z.string().length(6) })).mutation(() => {
      throw new TRPCError({ code: "FORBIDDEN", message: "Email PIN access is retired. Continue with secure managed sign in." });
    }),

    // Managed OAuth access status retained for older client contracts.
    trialStatus: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .query(({ ctx }) => ({
        exists: true,
        access: ctx.user.role === "admin" ? ("unlimited" as const) : ("subscriber" as const),
        trialAccessCount: 0,
        trialSecondsUsed: 0,
        maxAccesses: null,
        maxSeconds: null,
        expired: false,
        subscriptionStatus: "managed_oauth",
      })),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { clientCount: 0, dealCount: 0, totalAum: 0, pipelineValue: 0, workspaceName: "My Workspace" };
      const stats = await getDashboardStats(ws.id);
      return { ...stats, workspaceName: ws.name };
    }),
    netWorthHistory: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const allClients = await getClients(ws.id);
      const totalAum = allClients.reduce((sum, c) => sum + Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0), 0);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const base = totalAum > 0 ? totalAum * 0.82 : 2_800_000;
      return months.map((m, i) => ({ month: m, value: Math.round(base * (1 + i * 0.015)) }));
    }),
    coachingPrompts: protectedProcedure.query(() => [
      { id: 1, prompt: "Lead with trapped capital, then show the tax drag, then reposition to controlled liquidity.", tag: "Opener" },
      { id: 2, prompt: "Reframe the Roth conversion as tax-rate arbitrage plus future premium control.", tag: "Roth" },
      { id: 3, prompt: "Use the client's idle cash first, then show what controlled leverage changes.", tag: "IUL" },
      { id: 4, prompt: "Ask one question that exposes hidden liquidity inefficiency.", tag: "Discovery" },
      { id: 5, prompt: "Show the IRMAA cliff before recommending the conversion amount.", tag: "Tax" },
    ]),
    analytics: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { aumTimeline: [], strategyTrend: [], dealFunnel: [] };
      return getDashboardAnalytics(ws.id);
    }),
    recentActivity: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getWorkspaceRecentActivity(ws.id, 15);
    }),
    topClients: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getTopClientsByAUM(ws.id, 5);
    }),
    assetAllocation: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { ira: 0, roth: 0, taxable: 0, realEstate: 0, lifeInsurance: 0 };
      return getAssetAllocation(ws.id);
    }),
  }),

  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const [list, lastContactMap] = await Promise.all([getClients(ws.id), getLastContactDates(ws.id)]);
      return list.map(c => ({
        ...c,
        opportunityScore: scoreOpportunity(Number(c.income ?? 0), Number(c.iraBalance ?? 0), Number(c.realEstateEquity ?? 0)),
        lastContactedAt: lastContactMap[c.id] ?? null,
      }));
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "NOT_FOUND" });
      const client = await getClientById(input.id, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      return { ...client, opportunityScore: scoreOpportunity(Number(client.income ?? 0), Number(client.iraBalance ?? 0), Number(client.realEstateEquity ?? 0)) };
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1), household: z.string().optional(), email: z.string().email().optional(),
      phone: z.string().optional(), age: z.number().optional(), state: z.string().optional(),
      filingStatus: z.enum(["single","joint","hoh"]).optional(), income: z.number().optional(),
      iraBalance: z.number().optional(), rothBalance: z.number().optional(),
      taxableAssets: z.number().optional(), realEstateEquity: z.number().optional(),
      lifeInsuranceCv: z.number().optional(), ficoScore: z.number().min(300).max(850).optional(), notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const client = await createClient({ ...input, workspaceId: ws.id } as any);
      // Log activity
      if (client?.id) {
        logClientActivity({ clientId: client.id, workspaceId: ws.id, action: "CLIENT_CREATED", actorName: ctx.user.name ?? ctx.user.email ?? "Advisor", actorUserId: ctx.user.id, summary: `Client "${input.name}" was created` }).catch(() => {});
      }
      // Notify owner of new client
      notifyOwner({ title: "New Client Added", content: `${ctx.user.name ?? "An advisor"} added a new client: ${input.name}${input.income ? ` (Income: $${input.income.toLocaleString()})` : ""}` }).catch(() => {});
      // Dispatch webhook
      dispatchWebhook(ws.id, "client.created", { clientId: client?.id, name: input.name, email: input.email }).catch(() => {});
      return client;
    }),
    bulkImport: protectedProcedure.input(z.object({
      rows: z.array(z.object({
        name: z.string().min(1),
        email: z.string().optional(),
        phone: z.string().optional(),
        age: z.number().optional(),
        income: z.number().optional(),
        iraBalance: z.number().optional(),
        rothBalance: z.number().optional(),
        taxableAssets: z.number().optional(),
        realEstateEquity: z.number().optional(),
        lifeInsuranceCv: z.number().optional(),
        filingStatus: z.enum(["single","joint","hoh"]).optional(),
        notes: z.string().optional(),
      })).min(1).max(500),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      let imported = 0;
      const errors: { row: number; name: string; error: string }[] = [];
      for (let i = 0; i < input.rows.length; i++) {
        try {
          const row = input.rows[i];
          await createClient({
            workspaceId: ws.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            age: row.age,
            income: row.income?.toString(),
            iraBalance: row.iraBalance?.toString(),
            rothBalance: row.rothBalance?.toString(),
            taxableAssets: row.taxableAssets?.toString(),
            realEstateEquity: row.realEstateEquity?.toString(),
            lifeInsuranceCv: row.lifeInsuranceCv?.toString(),
            filingStatus: row.filingStatus,
            notes: row.notes,
          });
          imported++;
        } catch (e: any) {
          errors.push({ row: i + 1, name: input.rows[i].name, error: e.message ?? "Unknown error" });
        }
      }
      if (imported > 0) {
        notifyOwner({ title: "Bulk Client Import", content: `${ctx.user.name ?? "An advisor"} imported ${imported} client(s) via CSV.${errors.length ? ` ${errors.length} row(s) failed.` : ""}` }).catch(() => {});
      }
      return { imported, errors, total: input.rows.length };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(), age: z.number().optional(), income: z.number().optional(),
        iraBalance: z.number().optional(), rothBalance: z.number().optional(),
        taxableAssets: z.number().optional(), realEstateEquity: z.number().optional(),
        lifeInsuranceCv: z.number().optional(), ficoScore: z.number().min(300).max(850).optional(), notes: z.string().optional(),
      }),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await updateClient(input.id, ws.id, input.data as any);
      // Log activity
      const changedFields = Object.keys(input.data).filter(k => (input.data as any)[k] !== undefined);
      logClientActivity({ clientId: input.id, workspaceId: ws.id, action: "CLIENT_UPDATED", actorName: ctx.user.name ?? ctx.user.email ?? "Advisor", actorUserId: ctx.user.id, summary: `Updated fields: ${changedFields.join(", ")}`, metadata: { changedFields } }).catch(() => {});
      return { ok: true };
    }),
    exportCsv: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const csv = await exportClientsCsv(ws.id);
      return { csv };
    }),
  }),

  notes: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return [];
        return getClientNotes(input.clientId, ws.id);
      }),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        noteType: z.enum(["CALL", "MEETING", "EMAIL", "TASK", "GENERAL"]).default("GENERAL"),
        content: z.string().min(1).max(5000),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const authorName = ctx.user.name ?? ctx.user.email ?? "Advisor";
        const note = await createClientNote({
          clientId: input.clientId,
          workspaceId: ws.id,
          authorId: ctx.user.id,
          authorName,
          noteType: input.noteType,
          content: input.content,
        });
        // Log activity
        logClientActivity({ clientId: input.clientId, workspaceId: ws.id, action: "NOTE_ADDED", actorName: authorName, actorUserId: ctx.user.id, entityType: "client_note", entityId: note?.id, summary: `${input.noteType} note added` }).catch(() => {});
        dispatchWebhook(ws.id, "note.added", { clientId: input.clientId, noteType: input.noteType }).catch(() => {});
        return note;
      }),
    delete: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await deleteClientNote(input.noteId, ws.id);
        return { ok: true };
      }),
    summarize: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        clientName: z.string().optional(),
        maxNotes: z.number().min(1).max(50).default(20),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const notes = await getClientNotes(input.clientId, ws.id);
        if (notes.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No notes to summarize." });
        const recent = notes.slice(0, input.maxNotes);
        const noteLines = recent.map(n =>
          `[${n.noteType ?? "NOTE"} · ${new Date(n.createdAt).toLocaleDateString()} · ${n.authorName ?? "Advisor"}] ${n.content}`
        ).join("\n");
        const prompt = `You are a financial advisor assistant. Summarize the following client activity notes for ${input.clientName ?? "the client"} in one concise paragraph (3-5 sentences). Focus on key interactions, outstanding follow-ups, and the overall relationship status. Be factual and professional.\n\nNotes:\n${noteLines}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `${SYSTEM_PREAMBLE} Summarize client activity notes concisely and professionally.` },
            { role: "user", content: prompt },
          ],
        });
        const summary = response.choices[0]?.message?.content ?? "Unable to generate summary.";
        return { summary, noteCount: recent.length };
      }),
  }),
  pipeline: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getDeals(ws.id);
    }),
    create: protectedProcedure.input(z.object({
      clientId: z.number(), stage: z.enum(["LEAD","QUALIFIED","STRATEGY","PROPOSAL","CLOSED_WON","CLOSED_LOST"]).optional(),
      ownerName: z.string().optional(), value: z.number().optional(),
      probability: z.number().min(0).max(1).optional(), notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return createDeal({ ...input, workspaceId: ws.id } as any);
    }),
    updateStage: protectedProcedure.input(z.object({
      id: z.number(),
      stage: z.enum(["LEAD","QUALIFIED","STRATEGY","PROPOSAL","CLOSED_WON","CLOSED_LOST"]),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await updateDeal(input.id, ws.id, { stage: input.stage });
      // Log activity — find the deal's clientId
      const dealList = await getDeals(ws.id);
      const deal = dealList.find(d => d.id === input.id);
      if (deal) {
        logClientActivity({ clientId: deal.clientId, workspaceId: ws.id, action: "DEAL_STAGE_CHANGED", actorName: ctx.user.name ?? ctx.user.email ?? "Advisor", actorUserId: ctx.user.id, entityType: "deal", entityId: deal.id, summary: `Deal moved to ${input.stage}`, metadata: { newStage: input.stage } }).catch(() => {});
      }
      // Notify owner when deal moves to Closed Won
      if (input.stage === "CLOSED_WON") {
        notifyOwner({ title: "Deal Closed Won!", content: `${ctx.user.name ?? "An advisor"} closed deal #${input.id} as Won.` }).catch(() => {});
        dispatchWebhook(ws.id, "deal.closed_won", { dealId: input.id, clientId: deal?.clientId, stage: input.stage }).catch(() => {});
      }
      // Dispatch stage change webhook
      dispatchWebhook(ws.id, "deal.stage_changed", { dealId: input.id, clientId: deal?.clientId, newStage: input.stage }).catch(() => {});
      return { ok: true };
    }),
    bulkUpdateStage: protectedProcedure.input(z.object({
      ids: z.array(z.number()).min(1).max(100),
      stage: z.enum(["LEAD","QUALIFIED","STRATEGY","PROPOSAL","CLOSED_WON","CLOSED_LOST"]),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      let updated = 0;
      for (const id of input.ids) {
        await updateDeal(id, ws.id, { stage: input.stage });
        updated++;
      }
      return { ok: true, updated };
    }),
    updateDetails: protectedProcedure.input(z.object({
      id: z.number(),
      value: z.number().optional(),
      probability: z.number().min(0).max(1).optional(),
      notes: z.string().optional(),
      ownerName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      const updateData: Record<string, any> = {};
      if (data.value !== undefined) updateData.value = data.value;
      if (data.probability !== undefined) updateData.probability = data.probability;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.ownerName !== undefined) updateData.ownerName = data.ownerName;
      await updateDeal(id, ws.id, updateData);
      return { ok: true };
    }),
    deleteDeal: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      await db.delete(deals).where(and(eq(deals.id, input.id), eq(deals.workspaceId, ws.id)));
      return { ok: true };
    }),
  }),

  strategy: router({
    rothLadder: protectedProcedure.input(z.object({
      age: z.number(), income: z.number(), iraBalance: z.number(),
      targetBracket: z.number().default(0.24), years: z.number().default(5), assumedReturn: z.number().default(0.05),
    })).query(({ input }) => buildRothLadder(input)),
    iulProjection: protectedProcedure.input(z.object({
      annualPremium: z.number(), years: z.number().default(12), creditRate: z.number().default(0.055),
    })).query(({ input }) => projectIul(input.annualPremium, input.years, input.creditRate)),
    realEstate: protectedProcedure.input(z.object({
      purchasePrice: z.number(), bonusDepreciation: z.number().default(0.4),
    })).query(({ input }) => estimateRealEstate(input.purchasePrice, input.bonusDepreciation)),
    fullPlan: protectedProcedure.input(z.object({
      clientId: z.number().optional(), age: z.number(), income: z.number(), iraBalance: z.number(),
      rothBalance: z.number().default(0), taxableAssets: z.number().default(0), realEstateEquity: z.number().default(0),
      targetBracket: z.number().default(0.24), years: z.number().default(5),
      iulPremium: z.number().optional(), realEstatePurchasePrice: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ladder = buildRothLadder({ age: input.age, income: input.income, iraBalance: input.iraBalance, targetBracket: input.targetBracket, years: input.years, assumedReturn: 0.05 });
      const iul = projectIul(input.iulPremium ?? Math.min(Math.max(input.income * 0.08, 18000), 125000), 12);
      const re = estimateRealEstate(input.realEstatePurchasePrice ?? 900000);
      const score = scoreOpportunity(input.income, input.iraBalance, input.realEstateEquity);
      const totalConversion = ladder.reduce((s, r) => s + r.conversion, 0);
      const totalTax = ladder.reduce((s, r) => s + r.taxEstimate, 0);
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (ws && input.clientId) {
        await createScenario({ workspaceId: ws.id, clientId: input.clientId, name: "Full Plan", scenarioType: "COMBINED", inputJson: input as any, outputJson: { totalConversion, totalTax, terminalIulValue: iul.terminalCashValue, yearOneReShelter: re.totalYearOneShelter } });
        // Log activity
        logClientActivity({ clientId: input.clientId, workspaceId: ws.id, action: "STRATEGY_GENERATED", actorName: ctx.user.name ?? ctx.user.email ?? "Advisor", actorUserId: ctx.user.id, entityType: "strategy", summary: `Full plan generated (score: ${score}/100)`, metadata: { score, totalConversion, totalTax } }).catch(() => {});
      }
      // Notify owner when strategy score exceeds threshold
      if (score >= 85) {
        notifyOwner({ title: "High Opportunity Score Alert", content: `Strategy generated with score ${score}/100 for client${input.clientId ? ` #${input.clientId}` : ""}. Total Roth conversion: $${totalConversion.toLocaleString()}, IUL terminal value: $${iul.terminalCashValue.toLocaleString()}.` }).catch(() => {});
      }
      // Dispatch webhook
      if (ws) dispatchWebhook(ws.id, "strategy.generated", { clientId: input.clientId, score, totalConversion }).catch(() => {});
      return { ladder, iul, realEstate: re, opportunityScore: score, totals: { totalConversion, totalTax, terminalIulValue: iul.terminalCashValue, yearOneReShelter: re.totalYearOneShelter } };
    }),
    listByClient: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      return getStrategiesByClient(input.clientId, ws.id);
    }),
    save: protectedProcedure.input(z.object({
      clientId: z.number(), summary: z.string().optional(), taxPlan: z.string().optional(),
      insurancePlan: z.string().optional(), investmentPlan: z.string().optional(), advisorScript: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return createStrategy({ ...input, workspaceId: ws.id, generatedBy: "MANUAL" });
    }),
  }),

  scenario: router({
    listByClient: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return getScenariosByClient(ws.id, input.clientId);
    }),
    save: protectedProcedure.input(z.object({
      clientId: z.number(),
      name: z.string().min(1).max(200),
      scenarioType: z.enum(["ROTH", "IUL", "REAL_ESTATE", "COMBINED", "ROTH_CONVERSION_STR", "OIL_GAS_ROTH", "MORTGAGE_KILLER"]).default("COMBINED"),
      inputJson: z.record(z.string(), z.unknown()),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return createScenario({
        workspaceId: ws.id,
        clientId: input.clientId,
        name: input.name,
        scenarioType: input.scenarioType,
        inputJson: input.inputJson,
      });
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return deleteScenario(input.id, ws.id);
    }),
  }),

  ai: router({
    generateStrategy: protectedProcedure.input(z.object({
      clientName: z.string(), age: z.number(), income: z.number(), iraBalance: z.number(),
      rothBalance: z.number().default(0), realEstateEquity: z.number().default(0), notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ladder = buildRothLadder({ age: input.age, income: input.income, iraBalance: input.iraBalance, targetBracket: 0.24, years: 5, assumedReturn: 0.05 });
      const score = scoreOpportunity(input.income, input.iraBalance, input.realEstateEquity);
      // ── Knowledge grounding: fetch relevant docs from the workspace library ──
      const ws = await getWorkspaceForUser(ctx.user.id);
      let knowledgeContext = "";
      let groundingDocCount = 0;
      if (ws) {
        const allDocs = await getKnowledgeDocs(ws.id);
        // Match docs whose title, summary, or content overlaps with client notes or doc types useful for strategy
        const strategyKeywords = ["tax", "roth", "ira", "iul", "insurance", "real estate", "compliance", "strategy", "playbook"];
        const advisorNotesLower = (input.notes ?? "").toLowerCase();
        const relevant = allDocs
          .filter(d => d.status === "ACTIVE")
          .filter(d => {
            const text = `${d.title} ${d.summary ?? ""} ${d.content ?? ""}`.toLowerCase();
            return strategyKeywords.some(k => text.includes(k)) ||
              (advisorNotesLower && (d.title.toLowerCase().includes(advisorNotesLower.slice(0, 20)) || advisorNotesLower.split(" ").some(w => w.length > 4 && text.includes(w))));
          })
          .slice(0, 4);
        if (relevant.length > 0) {
          groundingDocCount = relevant.length;
          knowledgeContext = "\n\n--- Firm Knowledge Library (use these as grounding context) ---\n" +
            relevant.map(d => `[${d.docType.replace(/_/g, " ")}] ${d.title}\n${d.summary ?? ""}${d.content ? "\n" + d.content.slice(0, 600) : ""}`).join("\n\n");
        }
      }
      const prompt = `You are ${BRAND_SYSTEM_IDENTITY}.\nClient: ${input.clientName}, Age ${input.age}, Income $${input.income.toLocaleString()}, IRA $${input.iraBalance.toLocaleString()}, Roth $${input.rothBalance.toLocaleString()}, Real Estate Equity $${input.realEstateEquity.toLocaleString()}.\nOpportunity Score: ${score}/100. Roth Ladder Year 1 conversion: $${ladder[0]?.conversion.toLocaleString()}, estimated tax: $${ladder[0]?.taxEstimate.toLocaleString()}.\n${input.notes ? `Advisor notes: ${input.notes}` : ""}${knowledgeContext}\nProvide a concise, grounded 3-part strategy: (1) Tax Plan, (2) Insurance/IUL Plan, (3) Investment/Real Estate Plan. Be specific with dollar amounts and bracket references. End with a 2-sentence advisor script.`;
      const systemPrompt = groundingDocCount > 0
        ? `${SYSTEM_PREAMBLE} Use specific numbers and bracket references. You have been provided with ${groundingDocCount} document(s) from the firm's knowledge library — reference them where relevant.`
        : `${SYSTEM_PREAMBLE} Use specific numbers and bracket references.`;
      const response = await invokePortalAI(
        { messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] },
        { operation: "generate_strategy" },
      );
      return { content: response.content, opportunityScore: score, ladder, groundingDocCount };
    }),
    closingScript: protectedProcedure.input(z.object({
      clientName: z.string(), stage: z.string(), dealValue: z.number(), notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const prompt = `Generate a concise, stage-aware closing script for advisor use.\nClient: ${input.clientName}, Deal Stage: ${input.stage}, Value: $${input.dealValue.toLocaleString()}.\n${input.notes ? `Context: ${input.notes}` : ""}\nProvide: (1) Opening reframe, (2) Key objection handler, (3) Next-best-action close. Keep it under 150 words total.`;
      const response = await invokePortalAI(
        { messages: [{ role: "system", content: `${SYSTEM_PREAMBLE} You are an expert sales coach for institutional financial advisors.` }, { role: "user", content: prompt }] },
        { operation: "closing_script", timeoutMs: 30_000 },
      );
      return { content: response.content };
    }),
    searchKnowledge: protectedProcedure.input(z.object({ query: z.string().min(1) })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const docs = await getKnowledgeDocs(ws.id);
      const q = input.query.toLowerCase();
      return docs.filter(d => d.title.toLowerCase().includes(q) || (d.summary ?? "").toLowerCase().includes(q)).slice(0, 5);
    }),
    advisorChat: protectedProcedure.input(z.object({
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
      clientId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      let clientContext = "";
      if (input.clientId) {
        const ws = await getWorkspaceForUser(ctx.user.id);
        const client = ws ? await getClientById(input.clientId, ws.id) : null;
        if (client) {
          const totalAssets = Number(client.iraBalance ?? 0) + Number(client.rothBalance ?? 0) + Number(client.taxableAssets ?? 0) + Number(client.realEstateEquity ?? 0);
          clientContext = `\nActive client context: ${client.name}, Age ${client.age ?? "N/A"}, Income $${Number(client.income ?? 0).toLocaleString()}, Total Assets $${totalAssets.toLocaleString()}, IRA $${Number(client.iraBalance ?? 0).toLocaleString()}, Roth $${Number(client.rothBalance ?? 0).toLocaleString()}, Real Estate $${Number(client.realEstateEquity ?? 0).toLocaleString()}, Life Insurance CV $${Number(client.lifeInsuranceCv ?? 0).toLocaleString()}.`;
        }
      }
      const systemMsg = `${SYSTEM_PREAMBLE} You are the Russell Capital Systems™ Advisor — an expert institutional financial planning assistant. You help advisors with portfolio analysis, tax strategy, Roth conversions, IUL planning, real estate leverage, and client communication. Be specific with dollar amounts and tax brackets. Keep responses concise and actionable.${clientContext}\n\nAfter your main response, output a JSON block on a new line starting with |||ALERTS||| containing harvest alerts and action steps in this format:\n|||ALERTS|||{"alerts":[{"title":"string","description":"string","urgency":"high|medium|low"}],"actionSteps":["string","string"]}`;
      const llmMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemMsg },
        ...input.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];
      const response = await invokePortalAI(
        { messages: llmMessages },
        { operation: "advisor_chat" },
      );
      const raw = response.content;
      let reply = raw;
      let alerts: { title: string; description: string; urgency: string }[] = [];
      let actionSteps: string[] = [];
      const alertIdx = raw.indexOf("|||ALERTS|||");
      if (alertIdx !== -1) {
        reply = raw.slice(0, alertIdx).trim();
        try {
          const jsonStr = raw.slice(alertIdx + 12).trim();
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed.alerts)) {
            alerts = parsed.alerts.filter((a: any) =>
              typeof a === "object" && a !== null &&
              typeof a.title === "string" && typeof a.description === "string" &&
              ["high", "medium", "low"].includes(a.urgency)
            );
          }
          if (Array.isArray(parsed.actionSteps)) {
            actionSteps = parsed.actionSteps.filter((s: any) => typeof s === "string");
          }
        } catch {
          // LLM returned malformed JSON — gracefully return empty alerts/steps
          alerts = [];
          actionSteps = [];
        }
      }
      return { reply, alerts, actionSteps };
    }),

    /**
     * AI Slide Generator — Universal Export-to-Slides
     * Accepts structured tool context (sections, data, client info) and generates
     * a polished, branded slide deck via LLM with structured JSON output.
     */
    generateSlides: protectedProcedure.input(z.object({
      toolName: z.string().describe("Name of the source tool/calculator"),
      clientName: z.string().optional(),
      clientAge: z.number().optional(),
      clientIncome: z.number().optional(),
      clientIraBalance: z.number().optional(),
      sections: z.array(z.object({
        title: z.string(),
        items: z.array(z.object({ label: z.string(), value: z.string() })),
      })).describe("Structured data sections from the source tool"),
      bullets: z.array(z.string()).optional().describe("Key takeaways from the tool"),
      advisorNotes: z.string().optional(),
      slideCount: z.number().min(3).max(20).default(6),
      audience: z.enum(["client", "advisor", "team"]).default("client"),
    })).mutation(async ({ ctx, input }) => {
      // Rate-limit check for trial users
      const tier = await getUserAccessTier(ctx.user);
      if (tier === "trial") {
        const todayCount = await getTrialSlideCountToday(ctx.user.id);
        if (todayCount >= TRIAL_SLIDE_DAILY_LIMIT) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Daily slide generation limit reached (${TRIAL_SLIDE_DAILY_LIMIT}/day). Upgrade your plan for unlimited slide generation.`,
          });
        }
      }

      const clientLine = input.clientName
        ? `Client: ${input.clientName}${input.clientAge ? `, Age ${input.clientAge}` : ""}${input.clientIncome ? `, Income $${input.clientIncome.toLocaleString()}` : ""}${input.clientIraBalance ? `, IRA $${input.clientIraBalance.toLocaleString()}` : ""}`
        : "No specific client selected";

      const sectionsText = input.sections.map(s =>
        `### ${s.title}\n${s.items.map(i => `- ${i.label}: ${i.value}`).join("\n")}`
      ).join("\n\n");

      const bulletsText = input.bullets?.length ? `\nKey Takeaways:\n${input.bullets.map(b => `- ${b}`).join("\n")}` : "";

      const prompt = `You are creating a professional financial presentation for Russell Capital Systems™ (www.RussellCap.com), owned by Russell Holdings Management LLC.

Source Tool: ${input.toolName}
${clientLine}
Audience: ${input.audience === "client" ? "Client-facing (simple language, focus on outcomes and benefits)" : input.audience === "advisor" ? "Advisor-facing (technical detail, compliance-aware)" : "Internal team (strategic, data-heavy)"}
${input.advisorNotes ? `Advisor Notes: ${input.advisorNotes}` : ""}

--- DATA FROM TOOL ---
${sectionsText}
${bulletsText}
--- END DATA ---

CRITICAL PRESENTATION REQUIREMENTS:

1. YOUR STATED GOALS ACCELERATOR SLIDE (REQUIRED — Slide 2 or 3):
   - Title: "Your Stated Goals Accelerator"
   - This is the most important slide in the deck
   - Show EXACTLY how this strategy achieves the client's goals FASTER, SOONER, with LESS RISK
   - Include specific dollar amounts showing accelerated timeline
   - Compare: "Without this strategy: [X years to goal]" vs "With this strategy: [Y years to goal]"
   - Emphasize more effective use of TIME and CAPITAL
   - If the client's goals seem too small given their resources, suggest they could aim higher
   - Make it personal to their specific financial situation and stated objectives

2. EXECUTIVE SUMMARY SLIDE (REQUIRED — Slide 2 if Goals Accelerator is Slide 3):
   - Plain-language explanation of what this tool does for them
   - Opportunities they may have overlooked
   - Key takeaway in large, memorable language

3. DO NOTHING vs RECOMMENDED COMPARISON SLIDE (REQUIRED):
   - Side-by-side comparison with specific dollar amounts
   - Show the cost of inaction over 10, 20, 30 years
   - Include: "If you do nothing, you leave $X on the table"

4. TAX IMPACT SLIDE (REQUIRED):
   - Show federal and state tax bracket impact
   - Quantify tax savings in dollars, not just percentages
   - Show effective rate reduction

5. RECOMMENDATION SUMMARY SLIDE (REQUIRED — second to last):
   - Clear, dollar-quantified recommendation
   - "This strategy saves you $X over Y years"
   - Confidence level and next steps

Generate exactly ${input.slideCount} slides. Each slide must have:
- title: A compelling slide title
- subtitle: A brief subtitle or context line
- bullets: 3-5 bullet points (concise, impactful, with dollar amounts where possible)
- speakerNotes: 1-2 sentences of presenter guidance
- layout: one of "title", "content", "comparison", "metrics", "timeline", "summary"

Slide 1 must be a title slide. The last slide must be a summary/next-steps slide.
All content must be branded as Russell Capital Systems™. Use specific dollar amounts and percentages from the data.
Emphasize throughout: faster goal achievement, lower risk, more effective use of time and capital.
Do NOT include any disclaimers in the slides themselves — those are added separately.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: `${SYSTEM_PREAMBLE} You are an expert presentation designer for financial advisors. Create polished, data-driven slide decks.` },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "slide_deck",
            strict: true,
            schema: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Slide title" },
                      subtitle: { type: "string", description: "Slide subtitle" },
                      bullets: { type: "array", items: { type: "string" }, description: "Bullet points" },
                      speakerNotes: { type: "string", description: "Presenter notes" },
                      layout: { type: "string", enum: ["title", "content", "comparison", "metrics", "timeline", "summary"], description: "Slide layout type" },
                    },
                    required: ["title", "subtitle", "bullets", "speakerNotes", "layout"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["slides"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = String(response.choices[0]?.message?.content ?? "{}");
      try {
        const parsed = JSON.parse(raw);
        const slides = parsed.slides ?? [];
        // Log usage
        logSlideUsage({
          userId: ctx.user.id,
          email: ctx.user.email,
          accessTier: tier,
          topic: input.toolName,
          toolName: input.toolName,
          slideCount: slides.length,
          audience: input.audience,
          action: "generate",
        }).catch(() => {});
        return { slides, toolName: input.toolName, clientName: input.clientName ?? null };
      } catch {
        return { slides: [], toolName: input.toolName, clientName: input.clientName ?? null };
      }
    }),

    /**
     * AI Slide Generator — Freeform Prompt
     * Generates slides from a natural language prompt without pre-structured data.
     */
    generateSlidesFromPrompt: protectedProcedure.input(z.object({
      prompt: z.string().min(10).max(2000),
      clientId: z.number().optional(),
      slideCount: z.number().min(3).max(20).default(8),
      audience: z.enum(["client", "advisor", "team"]).default("client"),
      topic: z.string().optional().describe("Optional topic preset like 'roth_conversion', 'iul_strategy', 'estate_planning'"),
    })).mutation(async ({ ctx, input }) => {
      // Rate-limit check for trial users
      const tier = await getUserAccessTier(ctx.user);
      if (tier === "trial") {
        const todayCount = await getTrialSlideCountToday(ctx.user.id);
        if (todayCount >= TRIAL_SLIDE_DAILY_LIMIT) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Daily slide generation limit reached (${TRIAL_SLIDE_DAILY_LIMIT}/day). Upgrade your plan for unlimited slide generation.`,
          });
        }
      }

      let clientContext = "";
      if (input.clientId) {
        const ws = await getWorkspaceForUser(ctx.user.id);
        const client = ws ? await getClientById(input.clientId, ws.id) : null;
        if (client) {
          const totalAssets = Number(client.iraBalance ?? 0) + Number(client.rothBalance ?? 0) + Number(client.taxableAssets ?? 0) + Number(client.realEstateEquity ?? 0);
          clientContext = `\nClient: ${client.name}, Age ${client.age ?? "N/A"}, Income $${Number(client.income ?? 0).toLocaleString()}, Total Assets $${totalAssets.toLocaleString()}, IRA $${Number(client.iraBalance ?? 0).toLocaleString()}, Roth $${Number(client.rothBalance ?? 0).toLocaleString()}, Real Estate $${Number(client.realEstateEquity ?? 0).toLocaleString()}.`;
        }
      }

      const topicHint = input.topic ? `\nFocus area: ${input.topic.replace(/_/g, " ")}` : "";

      const fullPrompt = `You are creating a professional financial presentation for Russell Capital Systems™.

Audience: ${input.audience === "client" ? "Client-facing (simple language, outcomes-focused)" : input.audience === "advisor" ? "Advisor-facing (technical, compliance-aware)" : "Internal team (strategic, data-heavy)"}
${clientContext}
${topicHint}

User request: ${input.prompt}

Generate exactly ${input.slideCount} slides. Each slide must have:
- title: A compelling slide title
- subtitle: A brief subtitle or context line  
- bullets: 3-5 bullet points (concise, impactful, use specific numbers where possible)
- speakerNotes: 1-2 sentences of presenter guidance
- layout: one of "title", "content", "comparison", "metrics", "timeline", "summary"

Slide 1 must be a title slide. The last slide must be a summary/next-steps slide.
All content must be branded as Russell Capital Systems™.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: `${SYSTEM_PREAMBLE} You are an expert presentation designer for financial advisors. Create polished, data-driven slide decks that impress clients and close deals.` },
          { role: "user", content: fullPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "slide_deck",
            strict: true,
            schema: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Slide title" },
                      subtitle: { type: "string", description: "Slide subtitle" },
                      bullets: { type: "array", items: { type: "string" }, description: "Bullet points" },
                      speakerNotes: { type: "string", description: "Presenter notes" },
                      layout: { type: "string", enum: ["title", "content", "comparison", "metrics", "timeline", "summary"], description: "Slide layout type" },
                    },
                    required: ["title", "subtitle", "bullets", "speakerNotes", "layout"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["slides"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = String(response.choices[0]?.message?.content ?? "{}");
      try {
        const parsed = JSON.parse(raw);
        const slides = parsed.slides ?? [];
        // Log usage
        logSlideUsage({
          userId: ctx.user.id,
          email: ctx.user.email,
          accessTier: tier,
          topic: input.topic || "custom_prompt",
          toolName: "AI Slide Generator",
          slideCount: slides.length,
          audience: input.audience,
          action: "generate",
        }).catch(() => {});
        return { slides, clientName: clientContext ? clientContext.split(",")[0].replace("\nClient: ", "") : null };
      } catch {
        return { slides: [], clientName: null };
      }
    }),

    /**
     * Generate a branded PowerPoint (.pptx) file from slide data.
     * Accepts the same slide structure returned by generateSlides/generateSlidesFromPrompt.
     * Uploads the file to S3 and returns a download URL.
     */
    generatePptx: protectedProcedure.input(z.object({
      toolName: z.string(),
      clientName: z.string().optional(),
      audience: z.enum(["client", "advisor", "team"]).default("client"),
      themeId: z.string().default("executive-dark"),
      slides: z.array(z.object({
        title: z.string(),
        subtitle: z.string(),
        bullets: z.array(z.string()),
        speakerNotes: z.string(),
        layout: z.string(),
      })),
      includeDisclaimer: z.boolean().default(true),
    })).mutation(async ({ ctx, input }) => {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const { storagePut } = await import("./storage");
      const { getThemeById } = await import("@shared/slideThemes");

      const theme = getThemeById(input.themeId);
      const tier = await getUserAccessTier(ctx.user);
      const isTrialExport = tier === "trial";

      const pptx = new PptxGenJS();
      pptx.author = "Russell Capital Systems";
      pptx.company = "Russell Capital Systems™";
      pptx.subject = input.toolName;
      pptx.title = `${input.toolName} — Russell Capital Systems™`;

      // Theme-driven colors (strip # for pptxgenjs)
      const strip = (c: string) => c.replace("#", "");
      const BRAND = {
        navy: strip(theme.bgColor),
        darkSlate: strip(theme.bgAlt),
        emerald: strip(theme.accentColor),
        emeraldDark: strip(theme.accentColor),
        white: strip(theme.titleColor),
        lightGray: strip(theme.subtitleColor),
        gold: strip(theme.accentColor),
        text: strip(theme.textColor),
      };
      const titleFont = theme.titleFont;
      const bodyFont = theme.bodyFont;

      pptx.defineSlideMaster({
        title: "RC_MASTER",
        background: { color: BRAND.navy },
        objects: [
          { rect: { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: BRAND.emerald } } },
          { text: { text: "Russell Capital Systems™", options: { x: 0.5, y: 5.0, w: 4, h: 0.3, fontSize: 8, color: BRAND.lightGray, fontFace: bodyFont } } },
          { text: { text: input.toolName, options: { x: 5.5, y: 5.0, w: 4, h: 0.3, fontSize: 8, color: BRAND.lightGray, fontFace: bodyFont, align: "right" } } },
        ],
      });

      for (const slide of input.slides) {
        const s = pptx.addSlide({ masterName: "RC_MASTER" });

        if (slide.layout === "title") {
          s.addText(slide.title, { x: 0.8, y: 1.2, w: 8.4, h: 1.2, fontSize: 32, bold: true, color: BRAND.white, fontFace: titleFont });
          s.addText(slide.subtitle, { x: 0.8, y: 2.5, w: 8.4, h: 0.6, fontSize: 16, color: BRAND.emerald, fontFace: bodyFont });
          if (slide.bullets.length > 0) {
            s.addText(slide.bullets.map(b => ({ text: b, options: { bullet: { code: "25BA" }, color: BRAND.text, fontSize: 12 } })), { x: 0.8, y: 3.3, w: 8.4, h: 1.5, fontFace: bodyFont, lineSpacingMultiple: 1.5 });
          }
        } else if (slide.layout === "metrics") {
          s.addText(slide.title, { x: 0.8, y: 0.3, w: 8.4, h: 0.6, fontSize: 22, bold: true, color: BRAND.white, fontFace: titleFont });
          s.addText(slide.subtitle, { x: 0.8, y: 0.9, w: 8.4, h: 0.4, fontSize: 12, color: BRAND.lightGray, fontFace: bodyFont });
          const cols = Math.min(slide.bullets.length, 4);
          const colW = 8.4 / cols;
          slide.bullets.forEach((b, i) => {
            s.addShape("rect" as any, { x: 0.8 + i * colW + 0.1, y: 1.6, w: colW - 0.2, h: 2.0, fill: { color: BRAND.darkSlate }, rectRadius: 0.1 });
            s.addText(b, { x: 0.8 + i * colW + 0.2, y: 1.8, w: colW - 0.4, h: 1.6, fontSize: 11, color: BRAND.white, fontFace: bodyFont, valign: "middle", align: "center" });
          });
        } else {
          // content, comparison, timeline, summary — standard bullet layout
          s.addText(slide.title, { x: 0.8, y: 0.3, w: 8.4, h: 0.6, fontSize: 22, bold: true, color: BRAND.white, fontFace: titleFont });
          if (slide.subtitle) {
            s.addText(slide.subtitle, { x: 0.8, y: 0.9, w: 8.4, h: 0.4, fontSize: 12, color: BRAND.lightGray, fontFace: bodyFont });
          }
          s.addText(
            slide.bullets.map(b => ({
              text: b,
              options: { bullet: { code: "25BA" }, color: BRAND.text, fontSize: 13, breakType: "none" as const },
            })),
            { x: 0.8, y: 1.5, w: 8.4, h: 3.0, fontFace: bodyFont, lineSpacingMultiple: 1.6, color: BRAND.text }
          );
        }

        if (slide.speakerNotes) {
          s.addNotes(slide.speakerNotes);
        }

        // Trial watermark — diagonal across every slide
        if (isTrialExport) {
          s.addText("GENERATED WITH TRIAL", {
            x: 1.0, y: 2.0, w: 8.0, h: 1.5,
            fontSize: 36, bold: true,
            color: "FF0000",
            transparency: 75,
            fontFace: bodyFont,
            align: "center",
            valign: "middle",
            rotate: -30,
          });
        }
      }

      // Disclaimer slide
      if (input.includeDisclaimer) {
        const ds = pptx.addSlide({ masterName: "RC_MASTER" });
        ds.addText("Disclaimer", { x: 0.8, y: 1.0, w: 8.4, h: 0.6, fontSize: 22, bold: true, color: BRAND.gold, fontFace: titleFont });
        ds.addText(
          "This presentation is for educational and informational purposes only. It does not constitute financial, tax, or legal advice. Past performance does not guarantee future results. Consult with a qualified financial professional before making any investment decisions.",
          { x: 0.8, y: 1.8, w: 8.4, h: 2.0, fontSize: 11, color: BRAND.lightGray, fontFace: bodyFont, lineSpacingMultiple: 1.6 }
        );
        ds.addText("Russell Capital Systems™ — Turn Capital Into Income™", { x: 0.8, y: 4.0, w: 8.4, h: 0.4, fontSize: 12, color: BRAND.emerald, fontFace: bodyFont, align: "center" });
      }

      // Generate and upload
      const buffer = await pptx.write({ outputType: "nodebuffer" }) as Buffer;
      const suffix = randomBytes(4).toString("hex");
      const fileName = `slides/${ctx.user.id}/${input.toolName.replace(/\s+/g, "_")}_${suffix}.pptx`;
      const { url } = await storagePut(fileName, buffer, "application/vnd.openxmlformats-officedocument.presentationml.presentation");

      // Log PPTX export usage
      logSlideUsage({
        userId: ctx.user.id,
        email: ctx.user.email,
        accessTier: tier,
        topic: input.toolName,
        toolName: input.toolName,
        slideCount: input.slides.length,
        audience: input.audience,
        action: "export_pptx",
      }).catch(() => {});

      return { url, fileName: `${input.toolName.replace(/\s+/g, "_")}_Slides.pptx`, isTrialExport };
    }),
    goalsAccelerator: protectedProcedure.input(z.object({
      pageName: z.string(),
      pageContext: z.string(),
      calculatorResults: z.string(),
      clientGoals: z.string(),
    })).mutation(async ({ input }) => {
      const goals = JSON.parse(input.clientGoals);
      const prompt = `You are ${BRAND_SYSTEM_IDENTITY}, the Goals Accelerator.

The client (${goals.clientName || "Client"}, age ${goals.currentAge || "N/A"}) is currently viewing the "${input.pageName}" tool.

Their stated goals:
- Retire by age: ${goals.retirementAge || 65}
- Annual retirement income needed: $${(goals.annualIncomeNeeded || 150000).toLocaleString()}
- Legacy goal: $${(goals.legacyGoal || 2000000).toLocaleString()}
- Current income: $${(goals.currentIncome || 0).toLocaleString()}
- Estimated net worth: $${(goals.netWorth || 0).toLocaleString()}

Page context: ${input.pageContext}
Calculator results: ${input.calculatorResults}

Provide a personalized "Your Stated Goals Accelerator" memo:

1. **Goal Acceleration Analysis**: How does the material on this page accelerate the achievement of their stated goals? By what means and how so? Within what accelerated time frame?

2. **Are Your Goals Too Small?**: Based on their current assets and this tool's insights, should they consider going back to goal-setting and creating bigger, better goals? What would those look like?

3. **Asset Interlocking**: How can they keep all their assets on the move while interlocking for maximum optimization and efficiency?

4. **How This Page Serves You**: Summarize specifically how this page/tool serves their unique financial picture.

Keep it personal, specific with dollar amounts, and actionable. Use their actual numbers. End with a provocative question that makes them want to explore further.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `${SYSTEM_PREAMBLE} You are the Goals Accelerator module. Be specific, personal, and use actual dollar amounts from the client's portfolio. Challenge them to think bigger.` },
          { role: "user", content: prompt },
        ],
      });
      return { analysis: response.choices[0]?.message?.content ?? "Unable to generate analysis." };
    }),
  }),

  // ─── Saved Slide Decks ────────────────────────────────────────────────────
  slides: router({
    /** How many slide generations the current user has left today (trial users only) */
    remainingToday: protectedProcedure.query(async ({ ctx }) => {
      const tier = await getUserAccessTier(ctx.user);
      if (tier !== "trial") return { limit: null, used: 0, remaining: null, tier };
      const used = await getTrialSlideCountToday(ctx.user.id);
      return { limit: TRIAL_SLIDE_DAILY_LIMIT, used, remaining: Math.max(0, TRIAL_SLIDE_DAILY_LIMIT - used), tier };
    }),

    /** Slide usage analytics (owner/admin only) */
    analytics: protectedProcedure.query(async ({ ctx }) => {
      const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
      if (!isOwner) throw new TRPCError({ code: "FORBIDDEN" });
      return getSlideUsageAnalytics();
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return listSlideDecks(ws.id);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "NOT_FOUND" });
      const deck = await getSlideDeckById(input.id, ws.id);
      if (!deck) throw new TRPCError({ code: "NOT_FOUND" });
      return deck;
    }),

    save: protectedProcedure.input(z.object({
      title: z.string().min(1).max(500),
      toolName: z.string(),
      clientName: z.string().optional(),
      audience: z.enum(["client", "advisor", "team"]).default("client"),
      slides: z.array(z.object({
        title: z.string(),
        subtitle: z.string(),
        bullets: z.array(z.string()),
        speakerNotes: z.string(),
        layout: z.string(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await createSlideDeck({
        workspaceId: ws.id,
        userId: ctx.user.id,
        title: input.title,
        toolName: input.toolName,
        clientName: input.clientName ?? null,
        audience: input.audience,
        slideCount: input.slides.length,
        slides: input.slides,
      });
      return result;
    }),

    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).max(500).optional(),
      slides: z.array(z.object({
        title: z.string(),
        subtitle: z.string(),
        bullets: z.array(z.string()),
        speakerNotes: z.string(),
        layout: z.string(),
      })).optional(),
      audience: z.enum(["client", "advisor", "team"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const updates: Record<string, any> = {};
      if (input.title) updates.title = input.title;
      if (input.slides) updates.slides = input.slides;
      if (input.audience) updates.audience = input.audience;
      await updateSlideDeck(input.id, ws.id, updates);
      return { success: true };
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await deleteSlideDeck(input.id, ws.id);
      return { success: true };
    }),

    // ─── Slide Comments (collaboration) ────────────────────────────────
    addComment: protectedProcedure.input(z.object({
      deckId: z.number(),
      slideIndex: z.number().optional(),
      content: z.string().min(1).max(5000),
      parentId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return addSlideComment({
        deckId: input.deckId,
        slideIndex: input.slideIndex,
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        userEmail: ctx.user.email || undefined,
        content: input.content,
        parentId: input.parentId,
      });
    }),

    getComments: protectedProcedure.input(z.object({ deckId: z.number() })).query(async ({ input }) => {
      return getSlideComments(input.deckId);
    }),

    resolveComment: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await resolveSlideComment(input.id);
      return { success: true };
    }),

    deleteComment: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await deleteSlideComment(input.id, ctx.user.id);
      return { success: true };
    }),

    // ─── Slide Sharing ─────────────────────────────────────────────────
    share: protectedProcedure.input(z.object({
      deckId: z.number(),
      email: z.string().email(),
      permission: z.enum(["view", "comment", "edit"]).default("comment"),
    })).mutation(async ({ ctx, input }) => {
      const result = await createSlideShare({
        deckId: input.deckId,
        sharedByUserId: ctx.user.id,
        sharedWithEmail: input.email,
        permission: input.permission,
      });
      return result;
    }),

    getShares: protectedProcedure.input(z.object({ deckId: z.number() })).query(async ({ input }) => {
      return getSlideShares(input.deckId);
    }),

    getSharedDeck: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const share = await getSlideShareByToken(input.token);
      if (!share) throw new TRPCError({ code: "NOT_FOUND", message: "Share link expired or invalid" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { savedSlideDecks } = await import("../drizzle/schema");
      const [deck] = await db.select().from(savedSlideDecks).where(eq(savedSlideDecks.id, share.deckId)).limit(1);
      if (!deck) throw new TRPCError({ code: "NOT_FOUND" });
      return { deck, permission: share.permission };
    }),

    removeShare: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteSlideShare(input.id);
      return { success: true };
    }),

    /** Public: Get deck by share token — no auth required */
    getByShareToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { slideShares, savedSlideDecks } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [share] = await db.select().from(slideShares).where(eq(slideShares.shareToken, input.token)).limit(1);
      if (!share) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired share link" });
      const [deck] = await db.select().from(savedSlideDecks).where(eq(savedSlideDecks.id, share.deckId)).limit(1);
      if (!deck) throw new TRPCError({ code: "NOT_FOUND", message: "Deck no longer exists" });
      return { deck: { ...deck, slides: JSON.parse(deck.slides as unknown as string) }, permission: share.permission };
    }),

    /**
     * Batch Deck Generation — select multiple clients, generate personalized decks for each.
     * Returns an array of generated decks with client names and slide data.
     */
    batchGenerate: protectedProcedure.input(z.object({
      clientIds: z.array(z.number()).min(1).max(50),
      topic: z.string().min(1),
      themeId: z.string().default("executive-dark"),
      audience: z.enum(["client", "advisor", "team"]).default("client"),
      slideCount: z.number().min(3).max(15).default(6),
      saveToLibrary: z.boolean().default(true),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Fetch all selected clients
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { clients: clientsTable } = await import("../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      const allClients = await db.select().from(clientsTable).where(inArray(clientsTable.id, input.clientIds));

      const results: Array<{ clientId: number; clientName: string; slides: any[]; savedId?: number; pptxUrl?: string }> = [];

      // Generate for each client sequentially (LLM rate limiting)
      for (const client of allClients) {
        const clientName = `${client.firstName || ''} ${client.lastName || client.name || ''}`.trim();
        const clientContext = [
          `Client: ${clientName}`,
          client.age ? `Age: ${client.age}` : null,
          client.annualIncome ? `Income: $${Number(client.annualIncome).toLocaleString()}` : null,
          client.totalNetWorth ? `Net Worth: $${Number(client.totalNetWorth).toLocaleString()}` : null,
          client.retirementAge ? `Retirement Age: ${client.retirementAge}` : null,
          client.riskTolerance ? `Risk Tolerance: ${client.riskTolerance}` : null,
        ].filter(Boolean).join(" | ");

        try {
          const { invokeLLM } = await import("./_core/llm");
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a presentation designer for Russell Capital Systems\u2122. Generate a ${input.slideCount}-slide deck about "${input.topic}" personalized for this client. Return JSON: { "slides": [{ "title": string, "subtitle": string, "bullets": string[], "speakerNotes": string, "layout": "title"|"content"|"metrics"|"comparison"|"summary" }] }`,
              },
              { role: "user", content: `Client: ${clientContext}\n\nTopic: ${input.topic}\nAudience: ${input.audience}\nSlides: ${input.slideCount}` },
            ],
            response_format: {
              type: "json_schema" as const,
              json_schema: {
                name: "batch_slides",
                strict: true,
                schema: {
                  type: "object" as const,
                  properties: {
                    slides: {
                      type: "array" as const,
                      items: {
                        type: "object" as const,
                        properties: {
                          title: { type: "string" as const },
                          subtitle: { type: "string" as const },
                          bullets: { type: "array" as const, items: { type: "string" as const } },
                          speakerNotes: { type: "string" as const },
                          layout: { type: "string" as const },
                        },
                        required: ["title", "subtitle", "bullets", "speakerNotes", "layout"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["slides"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawContent = response.choices[0].message.content;
          const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
          const parsed = JSON.parse(contentStr || "{ \"slides\": [] }");
          const slides = parsed.slides || [];

          let savedId: number | undefined;
          if (input.saveToLibrary && slides.length > 0) {
            const saved = await createSlideDeck({
              workspaceId: ws.id,
              userId: ctx.user.id,
              title: `${input.topic} — ${clientName}`,
              toolName: "Batch Generation",
              clientName,
              audience: input.audience,
              slideCount: slides.length,
              slides,
            });
            savedId = saved.id;
          }

          results.push({ clientId: client.id, clientName, slides, savedId });
        } catch (err) {
          console.error(`[Batch] Failed for ${clientName}:`, err);
          results.push({ clientId: client.id, clientName, slides: [] });
        }
      }

      return { results, totalGenerated: results.filter(r => r.slides.length > 0).length, totalClients: allClients.length };
    }),
  }),

  // ─── Owner Analytics War Room ──────────────────────────────────────────────
  ownerAnalytics: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getOwnerAnalyticsSummary();
    }),

    topPages: protectedProcedure.input(z.object({ limit: z.number().default(20) }).optional()).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getTopPages(input?.limit ?? 20);
    }),

    recentLogins: protectedProcedure.input(z.object({ limit: z.number().default(50) }).optional()).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getRecentLogins(input?.limit ?? 50);
    }),

    conversionFunnel: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getConversionFunnel();
    }),

    trustedIps: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getOwnerTrustedIps();
    }),

    removeTrustedIp: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await removeOwnerTrustedIp(input.id);
      return { success: true };
    }),
  }),

  knowledge: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getKnowledgeDocs(ws.id);
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1),
      docType: z.enum(["MESSAGING_LIBRARY","OBJECTION_GUIDE","OFFER_POSITIONING","RENEWAL_POSITIONING","TONE_RULE","COMPLIANCE_RULE","PLAYBOOK_GUIDANCE"]),
      summary: z.string().optional(), content: z.string().optional(),
      sourceLabel: z.string().optional(), versionLabel: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return createKnowledgeDoc({ ...input, workspaceId: ws.id, status: "ACTIVE" });
    }),
    upload: protectedProcedure.input(z.object({
      title: z.string().min(1),
      docType: z.enum(["MESSAGING_LIBRARY","OBJECTION_GUIDE","OFFER_POSITIONING","RENEWAL_POSITIONING","TONE_RULE","COMPLIANCE_RULE","PLAYBOOK_GUIDANCE"]).default("PLAYBOOK_GUIDANCE"),
      summary: z.string().optional(),
      fileName: z.string().min(1),
      mimeType: z.string().default("application/octet-stream"),
      fileDataBase64: z.string().min(1),
      fileSize: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileDataBase64, "base64");
      const suffix = randomBytes(6).toString("hex");
      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `knowledge/${ws.id}/${suffix}-${safeFileName}`;
      const { url: fileUrl } = await storagePut(fileKey, buffer, input.mimeType);
      return createKnowledgeDoc({
        workspaceId: ws.id,
        title: input.title,
        docType: input.docType,
        summary: input.summary,
        status: "ACTIVE",
        fileUrl,
        fileKey,
        fileMime: input.mimeType,
        fileSize: input.fileSize ?? buffer.length,
      });
    }),
  }),

  team: router({
    members: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getMemberships(ws.id);
    }),
    invitations: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getInvitations(ws.id);
    }),
    invite: protectedProcedure.input(z.object({
      email: z.string().email(), firstName: z.string().optional(), lastName: z.string().optional(),
      role: z.enum(["ADMIN","ADVISOR","ANALYST","VIEWER"]).default("ANALYST"),
      origin: z.string().url().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const invitation = await createInvitation({ workspaceId: ws.id, invitedByUserId: ctx.user.id, email: input.email, firstName: input.firstName, lastName: input.lastName, role: input.role, tokenHash, expiresAt });
      await writeAuditLog({ workspaceId: ws.id, actorUserId: ctx.user.id, action: "workspace.invitation.created", entityType: "workspace_invitation", entityId: String(invitation?.id), metadata: { email: input.email, role: input.role } });
      // Send invitation email
      const origin = input.origin ?? "https://russellcapitalsystems.com";
      const inviteUrl = `${origin}/invite?token=${token}`;
      const inviterName = ctx.user.name ?? ctx.user.email ?? "Your advisor";
      const toName = [input.firstName, input.lastName].filter(Boolean).join(" ") || undefined;
      const emailResult = await sendInvitationEmail({
        toEmail: input.email,
        toName,
        inviterName,
        workspaceName: ws.name,
        role: input.role,
        inviteUrl,
        expiresAt,
      });
      return { ok: true, invitationId: invitation?.id, token, emailSent: emailResult.sent, emailNote: emailResult.reason };
    }),
    acceptInvite: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const tokenHash = createHash("sha256").update(input.token).digest("hex");
      const invitation = await getInvitationByToken(tokenHash);
      if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) return { valid: false, invitation: null };
      return { valid: true, invitation };
    }),
    updateRole: protectedProcedure.input(z.object({
      membershipId: z.number(),
      role: z.enum(["ADMIN","ADVISOR","ANALYST","VIEWER"]),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Only SUPER_ADMIN or ADMIN can change roles
      const actorMembership = (await getMemberships(ws.id)).find(m => m.userId === ctx.user.id);
      if (!actorMembership || !["SUPER_ADMIN", "ADMIN"].includes(actorMembership.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can change member roles" });
      }
      // Cannot change own role
      const target = await getMembershipById(input.membershipId);
      if (!target || target.workspaceId !== ws.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change your own role" });
      // Cannot change SUPER_ADMIN role
      if (target.role === "SUPER_ADMIN") throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change super admin role" });
      await updateMemberRole(input.membershipId, ws.id, input.role);
      await writeAuditLog({ workspaceId: ws.id, actorUserId: ctx.user.id, action: "workspace.member.role_updated", entityType: "membership", entityId: String(input.membershipId), metadata: { newRole: input.role } });
      return { ok: true };
    }),
    removeMember: protectedProcedure.input(z.object({
      membershipId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const actorMembership = (await getMemberships(ws.id)).find(m => m.userId === ctx.user.id);
      if (!actorMembership || !["SUPER_ADMIN", "ADMIN"].includes(actorMembership.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can remove members" });
      }
      const target = await getMembershipById(input.membershipId);
      if (!target || target.workspaceId !== ws.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove yourself" });
      if (target.role === "SUPER_ADMIN") throw new TRPCError({ code: "FORBIDDEN", message: "Cannot remove super admin" });
      await removeMember(input.membershipId, ws.id);
      await writeAuditLog({ workspaceId: ws.id, actorUserId: ctx.user.id, action: "workspace.member.removed", entityType: "membership", entityId: String(input.membershipId), metadata: {} });
      return { ok: true };
    }),
  }),

  billing: router({
    subscription: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return null;
      return getSubscription(ws.id);
    }),
    plans: publicProcedure.query(() => BILLING_PLANS),
    createCheckout: protectedProcedure.input(z.object({
      planSlug: z.enum(["beginner","professional","enterprise"]),
      interval: z.enum(["MONTHLY","ANNUAL"]).default("MONTHLY"),
      origin: z.string().url(),
      agreementAcceptedAt: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const sub = await getSubscription(ws.id);
      const customerId = await ensureStripeCustomer({
        existingCustomerId: sub?.stripeCustomerId,
        email: ctx.user.email ?? "",
        name: ctx.user.name,
        userId: ctx.user.id,
      });
      // Persist customer ID if newly created
      if (!sub?.stripeCustomerId) {
        const db = await getDb();
        if (db) {
          await db.update(workspaceSubscriptions)
            .set({ stripeCustomerId: customerId })
            .where(eq(workspaceSubscriptions.workspaceId, ws.id));
        }
      }
      const checkoutUrl = await createCheckoutSession({
        planSlug: input.planSlug,
        interval: input.interval,
        customerId,
        userEmail: ctx.user.email ?? "",
        userId: ctx.user.id,
        workspaceId: ws.id,
        origin: input.origin,
        agreementAcceptedAt: input.agreementAcceptedAt,
      });
      return { checkoutUrl };
    }),
    upgrade: protectedProcedure.input(z.object({
      planSlug: z.enum(["beginner","professional","enterprise"]),
      interval: z.enum(["MONTHLY","ANNUAL"]).default("MONTHLY"),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const seats = input.planSlug === "enterprise" ? 25 : input.planSlug === "professional" ? 10 : 3;
      await upsertSubscription(ws.id, { planSlug: input.planSlug, billingInterval: input.interval, status: "ACTIVE", seats });
      return { ok: true };
    }),
    createPortalSession: protectedProcedure.input(z.object({
      origin: z.string().url(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const sub = await getSubscription(ws.id);
      if (!sub?.stripeCustomerId) throw new TRPCError({ code: "BAD_REQUEST", message: "No active Stripe subscription found." });
      const portalUrl = await createPortalSession({
        customerId: sub.stripeCustomerId,
        returnUrl: `${input.origin}/portal/billing`,
      });
      return { portalUrl };
    }),
  }),

  onboarding: router({
    score: publicProcedure.input(z.object({
      age: z.number(), income: z.number(), iraBalance: z.number(), realEstateEquity: z.number().default(0),
    })).query(({ input }) => {
      const score = scoreOpportunity(input.income, input.iraBalance, input.realEstateEquity);
      const ladder = buildRothLadder({ age: input.age, income: input.income, iraBalance: input.iraBalance, targetBracket: 0.24, years: 3, assumedReturn: 0.05 });
      return { score, ladder, potentialSavings: ladder.reduce((s, r) => s + r.taxEstimate, 0) };
    }),
    status: protectedProcedure.query(async ({ ctx }) => {
      const completed = await isOnboardingComplete(ctx.user.id);
      return { completed };
    }),
    complete: protectedProcedure.mutation(async ({ ctx }) => {
      await markOnboardingComplete(ctx.user.id);
      return { success: true };
    }),
  }),

  leaderboard: router({
    list: protectedProcedure
      .input(z.object({ period: z.enum(["all", "month", "quarter", "year"]).default("all") }).optional())
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return [];
        const period = (input?.period ?? "all") as LeaderboardPeriod;
        return getAdvisorPerformanceMetricsFiltered(ws.id, period);
      }),
    exportCsv: protectedProcedure
      .input(z.object({ period: z.enum(["all", "month", "quarter", "year"]).default("all") }).optional())
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return { csv: "" };
        const period = (input?.period ?? "all") as LeaderboardPeriod;
        const entries = await getAdvisorPerformanceMetricsFiltered(ws.id, period);
        const header = "Rank,Name,Email,Score,AUM Managed,Deals Won,Closed Value,Pipeline Count,Pipeline Value,Meetings Held,Client Count";
        const rows = entries.map(e =>
          [e.rank, `"${e.name}"`, e.email ?? "", e.score, e.aumManaged.toFixed(2), e.dealsWon, e.closedValue.toFixed(2), e.pipelineCount, e.pipelineValue.toFixed(2), e.meetingsHeld, e.clientCount].join(",")
        );
        return { csv: [header, ...rows].join("\n"), period };
      }),
  }),

  // ─── Client Risk Scoring ────────────────────────────────────────────────
  riskScoring: router({
    scores: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return computeClientRiskScores(ws.id);
    }),
    scoreForClient: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const scores = await computeClientRiskScores(ws.id);
      const clientScore = scores.find(s => s.clientId === input.clientId) ?? null;
      if (!clientScore) return null;
      const recommendations = generateRiskRecommendations(clientScore.factors);
      return { ...clientScore, recommendations };
    }),
    history: protectedProcedure
      .input(z.object({ clientId: z.number(), weeks: z.number().min(1).max(52).optional() }))
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return [];
        return getRiskScoreHistory(input.clientId, ws.id, input.weeks ?? 12);
      }),
    historyBulk: protectedProcedure
      .input(z.object({ weeks: z.number().min(1).max(52).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return {};
        const map = await getRiskScoreHistoryBulk(ws.id, input?.weeks ?? 8);
        // Convert Map to plain object for serialization
        const result: Record<number, { score: number; snapshotDate: Date }[]> = {};
        Array.from(map.entries()).forEach(([clientId, entries]) => {
          result[clientId] = entries;
        });
        return result;
      }),
  }),

  // ─── Meeting Reminder Preferences ──────────────────────────────────────
  reminderPrefs: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getReminderPrefs(ws.id, ctx.user.id);
    }),
    update: protectedProcedure
      .input(z.object({
        prefs: z.array(z.object({
          meetingType: z.enum(["IN_PERSON", "VIDEO", "PHONE", "OTHER"]),
          enabled: z.boolean(),
          leadTimeMinutes: z.number().min(15).max(10080), // 15 min to 7 days
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await upsertReminderPrefs(ws.id, ctx.user.id, input.prefs);
        return { ok: true };
      }),
  }),

  enterprise: router({
    metrics: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return null;
      const stats = await getDashboardStats(ws.id);
      const sub = await getSubscription(ws.id);
      const members = await getMemberships(ws.id);
      return {
        ...stats, workspaceName: ws.name,
        planSlug: sub?.planSlug ?? "beginner", status: sub?.status ?? "TRIALING",
        seats: sub?.seats ?? 1,
        activeMembers: members.filter(m => m.status === "ACTIVE").length,
        seatUtilization: sub?.seats ? Math.round((members.filter(m => m.status === "ACTIVE").length / sub.seats) * 100) : 0,
      };
    }),
    auditLogs: protectedProcedure
      .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return { logs: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
        const { logs, total } = await getAuditLogs(ws.id, input.page, input.pageSize);
        return { logs, total, page: input.page, pageSize: input.pageSize, totalPages: Math.ceil(total / input.pageSize) };
      }),
  }),

  activity: router({
    listByClient: protectedProcedure.input(z.object({ clientId: z.number(), limit: z.number().min(1).max(200).default(100) })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getClientActivityLog(input.clientId, ws.id, input.limit);
    }),
    list: protectedProcedure.input(z.object({ clientId: z.number().optional(), limit: z.number().min(1).max(200).default(50) }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      if (input?.clientId) return getClientActivityLog(input.clientId, ws.id, input.limit ?? 50);
      return getWorkspaceRecentActivity(ws.id, input?.limit ?? 50);
    }),
    getRecent: protectedProcedure.input(z.object({ limit: z.number().min(1).max(200).default(20) }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getWorkspaceRecentActivity(ws.id, input?.limit ?? 20);
    }),
    listRecent: protectedProcedure.input(z.object({ limit: z.number().min(1).max(200).default(20) }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getWorkspaceRecentActivity(ws.id, input?.limit ?? 20);
    }),
    log: protectedProcedure.input(z.object({
      action: z.string().optional(),
      type: z.string().optional(),
      details: z.string().optional(),
      notes: z.string().optional(),
      clientId: z.number().optional(),
      clientIds: z.array(z.number()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { ok: true };
      const cId = input.clientId ?? input.clientIds?.[0];
      if (cId) {
        await logClientActivity({
          clientId: cId, workspaceId: ws.id,
          action: input.action ?? input.type ?? "GENERAL",
          actorName: ctx.user.name ?? ctx.user.email ?? "Advisor",
          actorUserId: ctx.user.id,
          summary: input.details ?? input.notes ?? input.action ?? "Activity logged",
        });
      }
      return { ok: true };
    }),
    logAction: protectedProcedure.input(z.object({
      action: z.string(),
      details: z.string().optional(),
      clientId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { ok: true };
      if (input.clientId) {
        await logClientActivity({
          clientId: input.clientId, workspaceId: ws.id,
          action: input.action,
          actorName: ctx.user.name ?? ctx.user.email ?? "Advisor",
          actorUserId: ctx.user.id,
          summary: input.details ?? input.action,
        });
      }
      return { ok: true };
    }),
    create: protectedProcedure.input(z.object({
      action: z.string().optional(),
      type: z.string().optional(),
      details: z.string().optional(),
      notes: z.string().optional(),
      clientId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { ok: true };
      if (input.clientId) {
        await logClientActivity({
          clientId: input.clientId, workspaceId: ws.id,
          action: input.action ?? input.type ?? "GENERAL",
          actorName: ctx.user.name ?? ctx.user.email ?? "Advisor",
          actorUserId: ctx.user.id,
          summary: input.details ?? input.notes ?? "Activity created",
        });
      }
      return { ok: true };
    }),
  }),

  staleDigest: router({
    preview: protectedProcedure.input(z.object({ staleDays: z.number().min(1).max(365).default(30) })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { staleClients: [], staleDays: input.staleDays };
      const staleClients = await getStaleClients(ws.id, input.staleDays);
      return { staleClients, staleDays: input.staleDays };
    }),
    send: protectedProcedure.input(z.object({ staleDays: z.number().min(1).max(365).default(30) })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const staleClients = await getStaleClients(ws.id, input.staleDays);
      if (staleClients.length === 0) return { sent: false, reason: "No stale clients found", clientCount: 0 };
      const toEmail = ctx.user.email ?? "";
      if (!toEmail) return { sent: false, reason: "No email on file for current user", clientCount: staleClients.length };
      const result = await sendStaleClientDigest({
        toEmail,
        toName: ctx.user.name ?? undefined,
        workspaceName: ws.name,
        staleClients,
        staleDays: input.staleDays,
      });
      // Also notify owner
      notifyOwner({ title: "Stale Client Digest Sent", content: `${ctx.user.name ?? "An advisor"} triggered a stale client digest. ${staleClients.length} client(s) not contacted in ${input.staleDays}+ days.` }).catch(() => {});
      return result;
    }),
  }),

  tags: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return listTags(ws.id);
    }),
    create: protectedProcedure.input(z.object({ name: z.string().min(1).max(100), color: z.string().max(20).default("#4f8cff") })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return createTag(ws.id, input.name, input.color);
    }),
    delete: protectedProcedure.input(z.object({ tagId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await deleteTag(input.tagId, ws.id);
      return { deleted: true };
    }),
    assign: protectedProcedure.input(z.object({ clientId: z.number(), tagId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      const result = await assignTag(input.clientId, input.tagId);
      return result;
    }),
    remove: protectedProcedure.input(z.object({ clientId: z.number(), tagId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      await removeTagAssignment(input.clientId, input.tagId);
      return { removed: true };
    }),
    byClient: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      return getClientTagIds(input.clientId);
    }),
    clientsByTag: protectedProcedure.input(z.object({ tagId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getClientsByTag(input.tagId, ws.id);
    }),
    bulkByClients: protectedProcedure.input(z.object({ clientIds: z.array(z.number()) })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return {};
      // Filter: only return tags for clients that belong to this workspace
      const ownedClients = await getClients(ws.id);
      const ownedIds = new Set(ownedClients.map(c => c.id));
      const filteredIds = input.clientIds.filter(id => ownedIds.has(id));
      if (filteredIds.length === 0) return {};
      return getBulkClientTags(filteredIds);
    }),
  }),

  goals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return listGoals(ws.id);
    }),
    create: protectedProcedure.input(z.object({
      goalType: z.enum(["AUM_TARGET", "DEALS_CLOSED", "NEW_CLIENTS", "REVENUE"]),
      targetValue: z.number().positive(),
      period: z.string().min(1).max(20),
      startDate: z.string(),
      endDate: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return createGoal({
        workspaceId: ws.id,
        goalType: input.goalType,
        targetValue: input.targetValue.toString(),
        period: input.period,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });
    }),
    update: protectedProcedure.input(z.object({
      goalId: z.number(),
      targetValue: z.number().positive().optional(),
      period: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const data: any = {};
      if (input.targetValue !== undefined) data.targetValue = input.targetValue.toString();
      if (input.period !== undefined) data.period = input.period;
      if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
      if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
      await updateGoal(input.goalId, ws.id, data);
      return { updated: true };
    }),
    delete: protectedProcedure.input(z.object({ goalId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await deleteGoal(input.goalId, ws.id);
      return { deleted: true };
    }),
    progress: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getGoalProgress(ws.id);
    }),
  }),

  webhooks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return listWebhooks(ws.id);
    }),
    create: protectedProcedure.input(z.object({
      url: z.string().url(),
      label: z.string().max(200).optional(),
      events: z.array(z.string()).min(1),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return createWebhook({ workspaceId: ws.id, url: input.url, label: input.label, events: input.events });
    }),
    update: protectedProcedure.input(z.object({
      webhookId: z.number(),
      url: z.string().url().optional(),
      label: z.string().max(200).optional(),
      events: z.array(z.string()).optional(),
      active: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const { webhookId, ...data } = input;
      await updateWebhook(webhookId, ws.id, data);
      return { updated: true };
    }),
    delete: protectedProcedure.input(z.object({ webhookId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await deleteWebhook(input.webhookId, ws.id);
      return { deleted: true };
    }),
    test: protectedProcedure.input(z.object({ webhookId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const hooks = await listWebhooks(ws.id);
      const hook = hooks.find(h => h.id === input.webhookId);
      if (!hook) throw new TRPCError({ code: "NOT_FOUND", message: "Webhook not found" });
      await dispatchWebhook(ws.id, "client.created", { test: true, message: "This is a test webhook from Russell Capital Systems™" });
      return { sent: true };
    }),
    events: publicProcedure.query(() => WEBHOOK_EVENTS),
  }),

  docs: router({
    upload: protectedProcedure.input(z.object({
      clientId: z.number(),
      name: z.string().min(1).max(500),
      fileBase64: z.string(),
      mimeType: z.string().optional(),
      sizeBytes: z.number().optional(),
      category: z.enum(["TAX_RETURN", "ESTATE_PLAN", "INSURANCE_POLICY", "INVESTMENT_STATEMENT", "TRUST_DOCUMENT", "LEGAL_AGREEMENT", "FINANCIAL_PLAN", "OTHER"]).optional(),
      // Provenance: which document this one replaces, and (for estate papers) what it declares.
      supersedesDocumentId: z.number().int().positive().optional(),
      supersedesReason: z.string().max(500).optional(),
      metadata: z.object({
        documentType: z.enum(["will", "revocable_trust", "irrevocable_trust", "poa_financial", "healthcare_directive", "beneficiary_designation", "buy_sell", "other"]).optional(),
        effectiveDate: z.string().max(10).optional(),
        parties: z.array(z.string().max(200)).max(20).optional(),
        beneficiaries: z.array(z.string().max(200)).max(50).optional(),
        trustees: z.array(z.string().max(200)).max(20).optional(),
        executor: z.string().max(200).optional(),
        guardian: z.string().max(200).optional(),
        notes: z.string().max(1000).optional(),
      }).optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const buffer = Buffer.from(input.fileBase64, "base64");
      const suffix = Math.random().toString(36).slice(2, 10);
      const safeFileName = input.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `docs/${ws.id}/${input.clientId}/${suffix}-${safeFileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType ?? "application/octet-stream");
      const doc = await uploadClientDocument({
        clientId: input.clientId,
        workspaceId: ws.id,
        name: input.name,
        fileKey,
        url,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes ?? buffer.length,
        category: input.category ?? "OTHER",
        uploadedBy: ctx.user.id,
        uploadedByName: ctx.user.name ?? ctx.user.email ?? "Unknown",
      });
      // Provenance: content hash, version lineage, signature, and (for estate
      // papers) a consistency check against what the plan knows of the client.
      const clientRow = await getClientById(input.clientId, ws.id);
      const provenance = await recordDocumentProvenance({ clientId: input.clientId, workspaceId: ws.id }, {
        documentId: doc.id, name: input.name, category: input.category ?? "OTHER", bytes: buffer, mimeType: input.mimeType ?? null,
        uploadedByUserId: ctx.user.id, uploadedByName: ctx.user.name ?? ctx.user.email ?? "Unknown",
        supersedesDocumentId: input.supersedesDocumentId ?? null, supersedesReason: input.supersedesReason ?? null, metadata: input.metadata ?? null,
        facts: clientRow ? { spouseName: clientRow.spouseName ?? null, maritalStatus: clientRow.spouseName ? "Married" : null } : null,
      }).catch((e) => { console.warn("[provenance] failed:", String(e).slice(0, 160)); return null; });
      await logClientActivity({
        clientId: input.clientId,
        workspaceId: ws.id,
        action: "DOCUMENT_UPLOADED",
        actorName: ctx.user.name ?? ctx.user.email ?? "Unknown",
        actorUserId: ctx.user.id,
        summary: `Uploaded ${input.name} (${input.category ?? "OTHER"})`,
        metadata: { docId: doc.id, category: input.category ?? "OTHER" },
      });
      return { ...doc, provenance };
    }),
    list: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return listClientDocuments(input.clientId, ws.id);
    }),
    delete: protectedProcedure.input(z.object({ docId: z.number(), clientId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await deleteClientDocument(input.docId, ws.id);
      await logClientActivity({
        clientId: input.clientId,
        workspaceId: ws.id,
        action: "DOCUMENT_DELETED",
        actorName: ctx.user.name ?? ctx.user.email ?? "Unknown",
        actorUserId: ctx.user.id,
        summary: `Deleted document #${input.docId}`,
      });
      return { deleted: true };
    }),
    categories: publicProcedure.query(() => [
      { value: "TAX_RETURN", label: "Tax Return" },
      { value: "ESTATE_PLAN", label: "Estate Plan" },
      { value: "INSURANCE_POLICY", label: "Insurance Policy" },
      { value: "INVESTMENT_STATEMENT", label: "Investment Statement" },
      { value: "TRUST_DOCUMENT", label: "Trust Document" },
      { value: "LEGAL_AGREEMENT", label: "Legal Agreement" },
      { value: "FINANCIAL_PLAN", label: "Financial Plan" },
      { value: "OTHER", label: "Other" },
    ]),
  }),

  reports: router({
    getSchedule: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getReportSchedule(input.clientId, ws.id);
    }),
    setSchedule: protectedProcedure.input(z.object({
      clientId: z.number(),
      active: z.boolean(),
      frequency: z.enum(["MONTHLY", "QUARTERLY"]).optional(),
      recipientEmail: z.string().email().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return upsertReportSchedule({
        clientId: input.clientId,
        workspaceId: ws.id,
        frequency: input.frequency,
        recipientEmail: input.recipientEmail,
        active: input.active,
      });
    }),
  }),

  slack: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const integration = await getSlackIntegration(ws.id);
      return integration ? { connected: true, teamName: integration.teamName, channelName: integration.channelName, active: integration.active } : { connected: false };
    }),
    configure: protectedProcedure.input(z.object({
      webhookUrl: z.string().url().optional(),
      channelName: z.string().optional(),
      teamName: z.string().optional(),
      botToken: z.string().optional(),
      active: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return upsertSlackIntegration({ workspaceId: ws.id, ...input });
    }),
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return deleteSlackIntegration(ws.id);
    }),
    testMessage: protectedProcedure.input(z.object({ message: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const integration = await getSlackIntegration(ws.id);
      if (!integration?.webhookUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "No Slack webhook URL configured" });
      try {
        const resp = await fetch(integration.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input.message ?? `\u2705 Test message from Russell Capital Systems™ (${ws.name})` }),
        });
        return { sent: resp.ok };
      } catch (e: any) {
        return { sent: false, error: e.message };
      }
    }),
  }),

  compliance: router({
    preview: protectedProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      actionType: z.string().optional(),
      clientId: z.number().optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(50),
    })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const result = await getFilteredActivityLog({
        workspaceId: ws.id,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        actionType: input.actionType || undefined,
        clientId: input.clientId,
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
      });
      return { logs: result.logs, total: result.total, page: input.page, pageSize: input.pageSize, totalPages: Math.ceil(result.total / input.pageSize) };
    }),
    exportCsv: protectedProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      actionType: z.string().optional(),
      clientId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const logs = await getActivityLogForExport({
        workspaceId: ws.id,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        actionType: input.actionType || undefined,
        clientId: input.clientId,
      });
      const header = "ID,Client ID,Action,Actor,Summary,Entity Type,Entity ID,Timestamp";
      const rows = logs.map(l => [
        l.id, l.clientId, l.action, `"${(l.actorName ?? "").replace(/"/g, '""')}"`,
        `"${(l.summary ?? "").replace(/"/g, '""')}"`, l.entityType ?? "", l.entityId ?? "",
        l.createdAt?.toISOString() ?? "",
      ].join(","));
      return { csv: [header, ...rows].join("\n"), count: logs.length };
    }),
    exportPdf: protectedProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      actionType: z.string().optional(),
      clientId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const logs = await getActivityLogForExport({
        workspaceId: ws.id,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        actionType: input.actionType || undefined,
        clientId: input.clientId,
      });
      // Return data for client-side PDF generation (keeps server lean)
      return {
        logs: logs.map(l => ({
          id: l.id, clientId: l.clientId, action: l.action, actorName: l.actorName ?? "",
          summary: l.summary ?? "", entityType: l.entityType ?? "", entityId: l.entityId ?? 0,
          createdAt: l.createdAt?.toISOString() ?? "",
        })),
        count: logs.length,
        generatedAt: new Date().toISOString(),
        workspaceName: ws.name,
        filters: { startDate: input.startDate, endDate: input.endDate, actionType: input.actionType, clientId: input.clientId },
      };
    }),
  }),

  clientPortal: router({
    generateLink: protectedProcedure.input(z.object({
      clientId: z.number(),
      label: z.string().max(200).optional(),
      expiresInDays: z.number().min(1).max(365).default(30),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
      const result = await createPortalToken({
        clientId: input.clientId,
        workspaceId: ws.id,
        createdByUserId: ctx.user.id,
        label: input.label,
        expiresInDays: input.expiresInDays,
      });
      const forwardedProto = String(ctx.req.headers["x-forwarded-proto"] ?? ctx.req.protocol ?? "https").split(",")[0].trim();
      const host = String(ctx.req.headers["x-forwarded-host"] ?? ctx.req.headers.host ?? "").split(",")[0].trim();
      if (!host || !/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to determine portal origin" });
      return { ...result, url: `${forwardedProto === "http" ? "http" : "https"}://${host}/client-portal/${encodeURIComponent(result.token)}` };
    }),
    listLinks: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
      return getPortalTokensByClient(input.clientId, ws.id);
    }),
    revokeLink: protectedProcedure.input(z.object({ tokenId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await revokePortalToken(input.tokenId, ws.id);
      return { revoked: true };
    }),
    // Public token validation — used by landing page client login
    validateToken: publicProcedure.input(z.object({ token: z.string().min(1) })).query(async ({ input }) => {
      const tokenRow = await validatePortalToken(input.token.trim());
      return { valid: !!tokenRow };
    }),
    // Public procedure for client-facing portal access (enhanced with portfolio + meetings)
    view: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const tokenRow = await validatePortalToken(input.token);
      if (!tokenRow) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired portal link" });
      const data = await getClientPortalDataEnhanced(tokenRow.clientId, tokenRow.workspaceId);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
      // Sanitize: remove sensitive fields, return only what the client should see
      const { client, documents, strategies: strats, notes, upcomingMeetings, portfolio, savedStrategies: savedStrats, branding } = data;
      // Build scorecard
      const totalAssets = data.portfolio.totalAssets;
      const hasIUL = (savedStrats ?? []).some((s: any) => s.strategyType === "iul" || s.strategyType === "iul_roth");
      const hasRoth = (savedStrats ?? []).some((s: any) => s.strategyType === "roth" || s.strategyType === "iul_roth");
      const hasEstatePlan = Number(client.lifeInsuranceCv ?? 0) > 0;
      const diversificationScore = data.portfolio.breakdown.length;
      const scorecard = {
        overallScore: Math.min(100, Math.round(
          (hasIUL ? 20 : 0) + (hasRoth ? 20 : 0) + (hasEstatePlan ? 15 : 0) +
          Math.min(25, diversificationScore * 5) +
          Math.min(20, (totalAssets > 1000000 ? 20 : totalAssets > 500000 ? 15 : totalAssets > 100000 ? 10 : 5))
        )),
        categories: [
          { name: "Tax-Free Income", score: hasIUL ? 90 : 30, status: hasIUL ? "Strong" : "Needs Attention" },
          { name: "Roth Strategy", score: hasRoth ? 85 : 25, status: hasRoth ? "Active" : "Not Started" },
          { name: "Estate Protection", score: hasEstatePlan ? 80 : 20, status: hasEstatePlan ? "In Place" : "Unprotected" },
          { name: "Diversification", score: Math.min(100, diversificationScore * 20), status: diversificationScore >= 4 ? "Well Diversified" : "Concentrated" },
          { name: "Savings Rate", score: Number(client.income ?? 0) > 0 ? Math.min(100, Math.round((totalAssets / Number(client.income ?? 1)) * 10)) : 50, status: "On Track" },
        ],
      };

      // Build income timeline
      const age = client.age ?? 45;
      const retirementAge = 65;
      const incomeTimeline = Array.from({ length: 35 }, (_, i) => {
        const yr = age + i;
        const ssIncome = yr >= 67 ? 36000 : 0;
        const rothIncome = yr >= retirementAge ? Math.round(Number(client.rothBalance ?? 0) * 0.04) : 0;
        const iulIncome = yr >= retirementAge ? Math.round(Number(client.lifeInsuranceCv ?? 0) * 0.06) : 0;
        const iraIncome = yr >= 72 ? Math.round(Number(client.iraBalance ?? 0) / (90 - yr + 1)) : 0;
        return { age: yr, socialSecurity: ssIncome, rothDistributions: rothIncome, iulLoans: iulIncome, iraRmd: iraIncome, total: ssIncome + rothIncome + iulIncome + iraIncome };
      });

      return {
        client: { name: client.name, email: client.email, household: client.household, state: client.state, age: client.age },
        documents: documents.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          url: d.url.startsWith("/manus-storage/") ? `${d.url}?portalToken=${encodeURIComponent(input.token)}` : d.url,
          createdAt: d.createdAt,
        })),
        strategies: strats.map(s => ({ id: s.id, summary: s.summary, createdAt: s.createdAt })),
        notes: notes.map(n => ({ id: n.id, noteType: n.noteType, content: n.content, authorName: n.authorName, createdAt: n.createdAt })),
        upcomingMeetings: upcomingMeetings.map(m => ({
          id: m.id, title: m.title, scheduledAt: m.scheduledAt,
          durationMin: m.durationMin, location: m.location, meetingType: m.meetingType,
        })),
        portfolio,
        savedStrategies: (savedStrats ?? []).map((ss: any) => ({
          id: ss.id,
          strategyType: ss.strategyType,
          strategyLabel: ss.strategyLabel,
          carrierName: ss.carrierName,
          notes: ss.notes,
          createdAt: ss.createdAt,
          inputsJson: ss.inputsJson,
          summaryJson: ss.summaryJson,
          iulProjectionJson: ss.iulProjectionJson,
        })),
        branding: branding ? { name: branding.name, logoUrl: branding.logoUrl, primaryColor: branding.primaryColor, accentColor: branding.accentColor } : null,
        scorecard,
        incomeTimeline,
      };
    }),
  }),

  rebalance: router({
    setTargets: protectedProcedure.input(z.object({
      clientId: z.number(),
      targets: z.array(z.object({
        assetClass: z.string().min(1).max(100),
        targetPct: z.string(),
        currentPct: z.string().optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const result = await setAllocationTargets(input.clientId, ws.id, input.targets);
      return { targets: result };
    }),
    getTargets: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getAllocationTargets(input.clientId, ws.id);
    }),
    updateCurrentPct: protectedProcedure.input(z.object({
      clientId: z.number(),
      updates: z.array(z.object({ assetClass: z.string(), currentPct: z.string() })),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await updateAllocationCurrentPct(input.clientId, ws.id, input.updates);
      return { updated: true };
    }),
    checkDrift: protectedProcedure.input(z.object({
      clientId: z.number(),
      threshold: z.number().min(0.1).max(100).default(5),
    })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const drifts = await checkPortfolioDrift(input.clientId, ws.id, input.threshold);
      return { drifts, hasDrift: drifts.length > 0 };
    }),
    alerts: protectedProcedure.input(z.object({
      status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getRebalanceAlerts(ws.id, input?.status);
    }),
    acknowledgeAlert: protectedProcedure.input(z.object({ alertId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await acknowledgeRebalanceAlert(input.alertId, ws.id);
      return { acknowledged: true };
    }),
    resolveAlert: protectedProcedure.input(z.object({ alertId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await resolveRebalanceAlert(input.alertId, ws.id);
      return { resolved: true };
    }),
    runCheck: protectedProcedure.input(z.object({
      threshold: z.number().min(0.1).max(100).default(5),
    }).optional()).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const clientsWithTargets = await getAllClientsWithTargets(ws.id);
      const threshold = input?.threshold ?? 5;
      let alertsCreated = 0;
      for (const { clientId, targets } of clientsWithTargets) {
        for (const t of targets) {
          const target = parseFloat(String(t.targetPct));
          const current = parseFloat(String(t.currentPct ?? "0"));
          const drift = Math.abs(current - target);
          if (drift >= threshold) {
            await createRebalanceAlert({
              clientId, workspaceId: ws.id, assetClass: t.assetClass,
              targetPct: String(target), currentPct: String(current),
              driftPct: String(drift), threshold: String(threshold),
            });
            alertsCreated++;
          }
        }
      }
      if (alertsCreated > 0) {
        await notifyOwner({ title: "Rebalance Alerts", content: `${alertsCreated} new drift alert(s) detected across your portfolio.` }).catch(() => {});
      }
      return { alertsCreated, clientsChecked: clientsWithTargets.length };
    }),
    bulkUploadCsv: protectedProcedure.input(z.object({
      csvText: z.string().min(1),
      threshold: z.number().min(0.1).max(100).default(5),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      // Parse CSV
      const lines = input.csvText.trim().split("\n");
      if (lines.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "CSV must have a header row and at least one data row" });
      const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["']/g, ""));
      const clientNameIdx = header.findIndex(h => ["client", "clientname", "client_name", "name"].includes(h));
      const clientIdIdx = header.findIndex(h => ["clientid", "client_id", "id"].includes(h));
      const assetClassIdx = header.findIndex(h => ["assetclass", "asset_class", "asset", "class"].includes(h));
      const currentPctIdx = header.findIndex(h => ["currentpct", "current_pct", "current", "pct", "allocation", "weight"].includes(h));
      if (assetClassIdx === -1 || currentPctIdx === -1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CSV must have 'assetClass' and 'currentPct' columns" });
      }
      if (clientNameIdx === -1 && clientIdIdx === -1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CSV must have 'clientName' or 'clientId' column" });
      }
      // Get all clients for name matching
      const allClients = await getClients(ws.id);
      const clientNameMap = new Map(allClients.map(c => [c.name.toLowerCase().trim(), c.id]));
      const rows: { clientId: number; assetClass: string; currentPct: string }[] = [];
      const errors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map(c => c.trim().replace(/["']/g, ""));
        let clientId: number | undefined;
        if (clientIdIdx !== -1 && cols[clientIdIdx]) {
          clientId = parseInt(cols[clientIdIdx]);
          if (isNaN(clientId)) { errors.push(`Row ${i + 1}: invalid clientId '${cols[clientIdIdx]}'`); continue; }
        } else if (clientNameIdx !== -1 && cols[clientNameIdx]) {
          clientId = clientNameMap.get(cols[clientNameIdx].toLowerCase().trim());
          if (!clientId) { errors.push(`Row ${i + 1}: client '${cols[clientNameIdx]}' not found`); continue; }
        } else { errors.push(`Row ${i + 1}: missing client identifier`); continue; }
        const assetClass = cols[assetClassIdx];
        const currentPct = cols[currentPctIdx];
        if (!assetClass || !currentPct || isNaN(parseFloat(currentPct))) {
          errors.push(`Row ${i + 1}: invalid assetClass or currentPct`); continue;
        }
        rows.push({ clientId, assetClass, currentPct });
      }
      // Bulk update
      const updateResult = await bulkUpdateAllocations(ws.id, rows);
      // Run drift check
      const clientsWithTargets = await getAllClientsWithTargets(ws.id);
      let alertsCreated = 0;
      for (const { clientId, targets } of clientsWithTargets) {
        for (const t of targets) {
          const target = parseFloat(String(t.targetPct));
          const current = parseFloat(String(t.currentPct ?? "0"));
          const drift = Math.abs(current - target);
          if (drift >= input.threshold) {
            await createRebalanceAlert({
              clientId, workspaceId: ws.id, assetClass: t.assetClass,
              targetPct: String(target), currentPct: String(current),
              driftPct: String(drift), threshold: String(input.threshold),
            });
            alertsCreated++;
          }
        }
      }
      if (alertsCreated > 0) {
        await createInAppNotification({
          workspaceId: ws.id, type: "REBALANCE",
          title: "Bulk Allocation Update",
          message: `${alertsCreated} drift alert(s) created after bulk CSV upload (${updateResult.updated} allocations updated).`,
          link: "/portal/rebalance",
        }).catch(() => {});
      }
      return { rowsParsed: rows.length, updated: updateResult.updated, alertsCreated, errors: errors.slice(0, 20), clientsChecked: clientsWithTargets.length };
    }),
  }),

  workspace: router({
    getBranding: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getWorkspaceBranding(ws.id);
    }),
    updateBranding: protectedProcedure.input(z.object({
      logoUrl: z.string().max(2000).nullable().optional(),
      primaryColor: z.string().max(20).nullable().optional(),
      accentColor: z.string().max(20).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await updateWorkspaceBranding(ws.id, input);
      return { updated: true };
    }),
  }),

  notifications: router({
    list: protectedProcedure.input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getInAppNotifications(ws.id, ctx.user.id, input?.limit ?? 50);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return { count: await getUnreadNotificationCount(ws.id) };
    }),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number() })).mutation(async ({ input }) => {
      await markNotificationRead(input.notificationId);
      return { marked: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await markAllNotificationsRead(ws.id);
      return { marked: true };
    }),
  }),

  demo: router({
    seed: protectedProcedure.mutation(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const ownerDisplayName = [ctx.user.firstName, ctx.user.lastName].filter(Boolean).join(" ") || ctx.user.name || ctx.user.email || "Advisor";
      const result = await seedDemoWorkspace(ws.id, ownerDisplayName);
      if (!result.seeded) {
        return { seeded: false, message: "Demo data already loaded — your workspace already has clients." };
      }
      await writeAuditLog({ workspaceId: ws.id, actorUserId: ctx.user.id, action: "DEMO_SEED", metadata: { clientCount: result.clientCount, dealCount: result.dealCount } });
      return { seeded: true, message: `Loaded ${result.clientCount} clients and ${result.dealCount} deals.` };
    }),
    data: publicProcedure.query(() => ({
      advisors: [
        { name: "Sam Russell", role: "SUPER_ADMIN", deals: 12, closedValue: 4_800_000, score: 94 },
        { name: "Jordan Blake", role: "ADVISOR", deals: 8, closedValue: 2_100_000, score: 78 },
        { name: "Alex Analyst", role: "ANALYST", deals: 3, closedValue: 450_000, score: 42 },
      ],
      clients: [
        { name: "Patricia Langford", age: 64, income: 142000, iraBalance: 0, rothBalance: 1000000, realEstateEquity: 1800000, score: 88 },
        { name: "David Mercer", age: 58, income: 310000, iraBalance: 1200000, rothBalance: 0, realEstateEquity: 2400000, score: 92 },
        { name: "Lauren Hall", age: 52, income: 215000, iraBalance: 850000, rothBalance: 120000, realEstateEquity: 950000, score: 76 },
      ],
      metrics: { totalAum: 47_800_000, openOpportunities: 28, aiAlerts: 14, mrrRunRate: 62400 },
    })),
  }),

  // ─── Workspace Switcher ──────────────────────────────────────────────────
  workspaceSwitcher: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserWorkspaces(ctx.user.id);
    }),
    switchTo: protectedProcedure.input(z.object({ workspaceId: z.number() })).mutation(async ({ ctx, input }) => {
      const membership = await getUserMembership(ctx.user.id, input.workspaceId);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this workspace" });
      // In a real implementation, this would update a session/cookie to track the active workspace.
      // For now, we validate membership and return success.
      return { success: true, workspaceId: input.workspaceId };
    }),
    create: protectedProcedure.input(z.object({ name: z.string().min(1).max(200) })).mutation(async ({ ctx, input }) => {
      const slug = `ws-${ctx.user.id}-${Date.now()}`;
      const db = (await import("./db")).getDb;
      const dbConn = await db();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await dbConn.insert(workspacesTable).values({ name: input.name, slug, ownerId: ctx.user.id });
      const created = await dbConn.select().from(workspacesTable).where(and(eq(workspacesTable.slug, slug), eq(workspacesTable.ownerId, ctx.user.id))).limit(1);
      if (!created[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create workspace" });
      await ensureMembership(ctx.user.id, created[0].id, "SUPER_ADMIN");
      return { id: created[0].id, name: created[0].name };
    }),
  }),

  // ─── Client Meetings ────────────────────────────────────────────────────
  meetings: router({
    create: protectedProcedure.input(z.object({
      clientId: z.number(),
      title: z.string().min(1).max(300),
      description: z.string().max(2000).optional(),
      scheduledAt: z.date(),
      durationMin: z.number().min(5).max(480).optional(),
      location: z.string().max(500).optional(),
      meetingType: z.enum(["IN_PERSON", "VIDEO", "PHONE", "OTHER"]).optional(),
      notes: z.string().max(5000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const meeting = await createMeeting({
        ...input,
        workspaceId: ws.id,
        createdBy: ctx.user.id,
        createdByName: [ctx.user.firstName, ctx.user.lastName].filter(Boolean).join(" ") || ctx.user.name || "Advisor",
      });
      // Log activity
      await logClientActivity({
        clientId: input.clientId,
        workspaceId: ws.id,
        action: "MEETING_SCHEDULED",
        actorName: [ctx.user.firstName, ctx.user.lastName].filter(Boolean).join(" ") || ctx.user.name || "Advisor",
        actorUserId: ctx.user.id,
        summary: `Meeting scheduled: ${input.title} on ${input.scheduledAt.toISOString().split("T")[0]}`,
        metadata: { meetingId: meeting?.id, meetingType: input.meetingType || "VIDEO" },
      });
      return meeting;
    }),
    listByClient: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getMeetingsByClient(input.clientId, ws.id);
    }),
    listUpcoming: protectedProcedure.input(z.object({ limit: z.number().min(1).max(50).optional() }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getMeetingsByWorkspace(ws.id, { upcoming: true, limit: input?.limit ?? 10 });
    }),
    listAll: protectedProcedure.input(z.object({ limit: z.number().min(1).max(200).optional() }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getMeetingsByWorkspace(ws.id, { limit: input?.limit ?? 50 });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).max(300).optional(),
      description: z.string().max(2000).optional(),
      scheduledAt: z.date().optional(),
      durationMin: z.number().min(5).max(480).optional(),
      location: z.string().max(500).optional(),
      meetingType: z.enum(["IN_PERSON", "VIDEO", "PHONE", "OTHER"]).optional(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
      notes: z.string().max(5000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const { id, ...data } = input;
      await updateMeeting(id, ws.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await deleteMeeting(input.id, ws.id);
      return { success: true };
    }),
  }),

  // ─── Dashboard Widget Config ────────────────────────────────────────────
  dashboardConfig: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getWidgetConfig(ctx.user.id, ws.id);
    }),
    save: protectedProcedure.input(z.array(z.object({
      widgetId: z.string().min(1).max(100),
      position: z.number().min(0),
      visible: z.boolean(),
      size: z.enum(["SMALL", "MEDIUM", "LARGE", "FULL"]),
    }))).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await saveWidgetConfig(ctx.user.id, ws.id, input);
      return { success: true };
    }),
  }),

  // ─── HubSpot CRM Sync ──────────────────────────────────────────────────
  hubspot: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const settings = await getHubspotSyncSettings(ws.id);
      return settings ?? {
        syncEnabled: false, syncContacts: true, syncDeals: true,
        syncDirection: "BIDIRECTIONAL" as const, lastSyncAt: null, lastSyncStatus: null,
        lastSyncContactsPushed: 0, lastSyncContactsPulled: 0,
        lastSyncDealsPushed: 0, lastSyncDealsPulled: 0,
      };
    }),
    updateSettings: protectedProcedure.input(z.object({
      syncEnabled: z.boolean().optional(),
      syncContacts: z.boolean().optional(),
      syncDeals: z.boolean().optional(),
      syncDirection: z.enum(["BIDIRECTIONAL", "PUSH_ONLY", "PULL_ONLY"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return upsertHubspotSyncSettings(ws.id, input);
    }),
    syncHistory: protectedProcedure.input(z.object({ limit: z.number().min(1).max(200).default(50) }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getHubspotSyncHistory(ws.id, input?.limit ?? 50);
    }),
    triggerSync: protectedProcedure.mutation(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const settings = await getHubspotSyncSettings(ws.id);
      if (!settings?.syncEnabled) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "HubSpot sync is not enabled. Enable it in settings first." });
      }
      // In production, this would call the HubSpot MCP connector.
      // For now, log the trigger and update status.
      await logHubspotSync({
        workspaceId: ws.id, direction: "PUSH", objectType: "CONTACT",
        status: "SKIPPED", errorMessage: "Manual sync triggered — HubSpot connector authorization required",
      });
      await updateHubspotSyncStatus(ws.id, {
        lastSyncAt: new Date(), lastSyncStatus: "PARTIAL",
        contactsPushed: 0, contactsPulled: 0, dealsPushed: 0, dealsPulled: 0,
      });
      return { triggered: true, message: "Sync initiated. Connect your HubSpot account to enable full bidirectional sync." };
    }),
  }),

  // ─── Compliance Alerts ─────────────────────────────────────────────────
  complianceAlerts: router({
    list: protectedProcedure.input(z.object({
      dismissed: z.boolean().optional(),
      severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
      clientId: z.number().optional(),
      limit: z.number().min(1).max(500).default(100),
    }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getComplianceAlerts(ws.id, {
        dismissed: input?.dismissed, severity: input?.severity,
        clientId: input?.clientId, limit: input?.limit ?? 100,
      });
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getComplianceAlertStats(ws.id);
    }),
    dismiss: protectedProcedure.input(z.object({ alertId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await dismissComplianceAlert(input.alertId, ctx.user.id, ws.id);
      return { dismissed: true };
    }),
    resolve: protectedProcedure.input(z.object({ alertId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await resolveComplianceAlert(input.alertId, ws.id);
      return { resolved: true };
    }),
    runCheck: protectedProcedure.mutation(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const results = await runComplianceChecks(ws.id);
      // Create alerts for each result
      let created = 0;
      for (const r of results) {
        await createComplianceAlert({
          clientId: r.clientId, workspaceId: ws.id,
          alertType: r.alertType, severity: r.severity,
          title: r.title, message: r.message,
          dueDate: r.dueDate, metadata: r.metadata,
        });
        // Also create in-app notification for critical alerts
        if (r.severity === "CRITICAL") {
          await createInAppNotification({
            workspaceId: ws.id, type: "compliance",
            title: r.title, message: r.message,
            link: `/portal/clients/${r.clientId}`,
          });
        }
        created++;
      }
      return { checked: true, alertsCreated: created };
    }),
    clientAlerts: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getComplianceAlerts(ws.id, { clientId: input.clientId, dismissed: false });
    }),
  }),

  // ─── Client Properties (Mortgage/Real Estate) ──────────────────────────
  properties: router({
    list: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getClientProperties(input.clientId, ws.id);
    }),
    create: protectedProcedure.input(z.object({
      clientId: z.number(), propertyName: z.string().min(1).max(300),
      propertyType: z.enum(["PRIMARY", "INVESTMENT", "SHORT_TERM_RENTAL", "COMMERCIAL", "LAND"]).default("PRIMARY"),
      propertyValue: z.number().optional(), monthlyMortgagePayment: z.number().optional(),
      monthlyInterestOnlyPayment: z.number().optional(), totalInterestPayment: z.number().optional(),
      monthlyRentalIncome: z.number().optional(), annualAppreciation: z.number().optional(),
      isPrimary: z.boolean().optional(), mortgageBalance: z.number().optional(),
      interestRate: z.number().optional(), loanTermYears: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return createClientProperty({ ...input, workspaceId: ws.id });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(), propertyName: z.string().min(1).max(300).optional(),
      propertyType: z.enum(["PRIMARY", "INVESTMENT", "SHORT_TERM_RENTAL", "COMMERCIAL", "LAND"]).optional(),
      propertyValue: z.number().optional(), monthlyMortgagePayment: z.number().optional(),
      monthlyInterestOnlyPayment: z.number().optional(), totalInterestPayment: z.number().optional(),
      monthlyRentalIncome: z.number().optional(), annualAppreciation: z.number().optional(),
      isPrimary: z.boolean().optional(), mortgageBalance: z.number().optional(),
      interestRate: z.number().optional(), loanTermYears: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const { id, ...data } = input;
      await updateClientProperty(id, ws.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await deleteClientProperty(input.id, ws.id);
      return { success: true };
    }),
  }),

  // ─── Client Crypto Holdings ────────────────────────────────────────────
  crypto: router({
    list: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return getClientCryptoHoldings(input.clientId, ws.id);
    }),
    create: protectedProcedure.input(z.object({
      clientId: z.number(), coinId: z.string().min(1).max(100), coinName: z.string().min(1).max(200),
      coinSymbol: z.string().max(20).optional(), quantity: z.number().min(0),
      avgPurchasePrice: z.number().min(0), amountStaked: z.number().min(0).optional(),
      stakingPercentage: z.number().min(0).max(100).optional(),
      predictedStakingIncome: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      return createClientCryptoHolding({ ...input, workspaceId: ws.id });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(), coinId: z.string().min(1).max(100).optional(),
      coinName: z.string().min(1).max(200).optional(), coinSymbol: z.string().max(20).optional(),
      quantity: z.number().min(0).optional(), avgPurchasePrice: z.number().min(0).optional(),
      amountStaked: z.number().min(0).optional(), stakingPercentage: z.number().min(0).max(100).optional(),
      predictedStakingIncome: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const { id, ...data } = input;
      await updateClientCryptoHolding(id, ws.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      await deleteClientCryptoHolding(input.id, ws.id);
      return { success: true };
    }),
    prices: publicProcedure.input(z.object({
      coinIds: z.array(z.string()).min(1).max(50),
    })).query(async ({ input }) => {
      try {
        const ids = input.coinIds.join(",");
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
        const data = await res.json();
        return data as Record<string, { usd: number; usd_24h_change?: number }>;
      } catch (e) {
        console.error("[CoinGecko] Price fetch error:", e);
        return {} as Record<string, { usd: number; usd_24h_change?: number }>;
      }
    }),
  }),

  // ─── 0% Roth Conversion Strategy (Revised Dual Option) ──────────────────
  rothConversion: router({
    project: protectedProcedure.input(z.object({
      clientId: z.number().optional(),
      iraBalance: z.number().min(0),
      conversionPortion: z.number().min(0).max(1).default(1),
      homeEquity: z.number().min(0),
      age: z.number().min(18).max(100),
      income: z.number().min(0),
      filingStatus: z.enum(["single", "married", "hoh"]).default("married"),
      currentTaxBracket: z.number().min(0).max(0.5).default(0.24),
      rentalGrossYield: z.number().min(0).max(1).default(0.20),
      realEstateAppreciation: z.number().min(0).max(0.2).default(0.05),
      helocRate: z.number().min(0).max(0.2).default(0.07),
      iulYears: z.number().min(15).max(20).default(20),
      mortgageRate: z.number().min(0).max(0.15).default(0.065),
      strategyYears: z.number().min(1).max(5).default(1),
      solarEquity: z.boolean().default(false),
      // Carrier overrides — when provided, these replace the default IUL constants
      carrierId: z.string().optional(),
      carrierLoadFee: z.number().min(0).max(0.15).optional(),
      carrierCoiRate: z.number().min(0).max(0.10).optional(),
      carrierLoanRate: z.number().min(0).max(0.15).optional(),
      carrierAvgReturn: z.number().min(0).max(0.20).optional(),
    })).mutation(async ({ ctx, input }) => {
      // ═══════════════════════════════════════════════════════════════════════
      // 6-OPTION 0% ROTH CONVERSION ENGINE
      // Supports: 1-5 Year Non Solar + 1-Year Solar Equity
      // Multi-year strategies spread IRA/0.4 property purchases over N years
      // Carrier overrides allow using real carrier-specific rates
      // ═══════════════════════════════════════════════════════════════════════
      // ── A Mutual Life Accumulator III baseline rates (sample illustration) ──
      const IUL_LOAD_FEE = input.carrierLoadFee ?? 0.08;       // 8% Y1, 6% Y2-5, 0% after (using Y1 rate as default)
      const IUL_LOAN_RATE = input.carrierLoanRate ?? 0.05;       // 5% policy loan rate (declared rate)
      const IUL_AVG_RETURN = input.carrierAvgReturn ?? 0.12;      // 12% annual return (user instruction)
      const IUL_COI_RATE = input.carrierCoiRate ?? 0.008;        // 0.8% COI rate (age-based, starting rate)
      const SOLAR_ENHANCEMENT = 0.22;   // 22% solar equity enhancement
      const MORTGAGE_RATE = input.mortgageRate;
      const strategyYears = input.strategyYears;
      const isSolar = input.solarEquity;

      // ─── Core values ───
      const iraValue = input.iraBalance;
      const conversionAmount = iraValue * input.conversionPortion; // full IRA value converted
      const newRothValue = conversionAmount; // entire IRA → Roth in year 1
      const taxSavings = iraValue * 0.50; // tax savings = 50% of original IRA value
      const halfTaxSavings = taxSavings / 2;

      // ─── STR property sizing (IRA ÷ 0.4) ───
      // Total target = IRA / 0.4. For multi-year strategies, spread evenly over N years.
      const totalTargetPropertyValue = iraValue / 0.4;
      const propertiesPerYear = strategyYears === 1 ? 1 : 1; // 1 property per year for N years
      const perPropertyPrice = totalTargetPropertyValue / strategyYears;
      const totalPropertyCount = strategyYears;

      // Per-property financials
      const perPropertyDown = perPropertyPrice * 0.30;
      const perPropertyMortgage = perPropertyPrice * 0.70;
      const monthlyMortgageRate = MORTGAGE_RATE / 12;
      const mortgageTerm = 30 * 12;
      const perPropertyMonthlyMortgage = perPropertyMortgage * (monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, mortgageTerm)) / (Math.pow(1 + monthlyMortgageRate, mortgageTerm) - 1);
      const perPropertyMonthlyInterestOnly = perPropertyMortgage * monthlyMortgageRate;

      // Totals (all properties combined once fully acquired)
      const targetPropertyPrice = totalTargetPropertyValue;
      const downPayment = totalTargetPropertyValue * 0.30;
      const mortgageAmount = totalTargetPropertyValue * 0.70;
      const helocAmount = downPayment;
      const monthlyHelocPayment = (helocAmount * input.helocRate) / 12;
      const monthlyMortgagePayment = perPropertyMonthlyMortgage * totalPropertyCount;
      const monthlyInterestOnlyPayment = perPropertyMonthlyInterestOnly * totalPropertyCount;

      // ═══════════════════════════════════════════════════════════════════════
      // REVISED IUL CASCADE ENGINE
      // Y1: half tax savings as premium (held 12 months)
      // Y2: other half tax savings as premium
      // Y3: premium funded from IRA/Roth fund, then take 80% loan of surrender value → STR principal
      // Y4: take loan from Y3 to pay Y4 premium, continue borrow-to-pay for 15-20 years
      // Month 13: policy loan for 25% of original IRA → STR principal-only payment
      // Interest = 12% of account value (A Mutual Life Accumulator III baseline)
      // Load = 8% Y1, 6% Y2-5, 0% after. COI = age-based (0.8% starting). Loan rate = 5%
      // ═══════════════════════════════════════════════════════════════════════
      function buildIulCascade(year1Premium: number, year2Premium: number, years: number, isSolar: boolean) {
        const rows: Array<{
          year: number;
          premium: number;
          premiumSource: string;
          loadFee: number;
          coiCost: number;
          netPremiumToAccount: number;
          beginningValue: number;
          interestEarned: number;
          policyLoanTaken: number;
          loanPurpose: string;
          cumulativeLoanBalance: number;
          loanInterestAccrued: number;
          endingAccountValue: number;
          surrenderValue: number;
          netCashValue: number;
          cumulativePremiums: number;
          strPrincipalPayment: number;
        }> = [];

        let accountValue = 0;
        let totalLoanBalance = 0;
        let cumulativePremiums = 0;
        let cumulativeInterest = 0;
        let cumulativeStrPrincipalPayments = 0;

        for (let y = 1; y <= years; y++) {
          let premium: number;
          let premiumSource: string;
          let policyLoanTaken = 0;
          let loanPurpose = "";
          let strPrincipalPayment = 0;

          if (y === 1) {
            premium = year1Premium;
            premiumSource = isSolar ? "Solar Enhancement (22% of IRA)" : "Half of Tax Savings";
          } else if (y === 2) {
            premium = year2Premium;
            premiumSource = isSolar ? "Roth Converted Funds" : "Other Half of Tax Savings";
            // Month 13 (start of Y2): policy loan for 25% of original IRA → STR principal
            const month13Loan = iraValue * 0.25;
            policyLoanTaken = month13Loan;
            loanPurpose = "25% of IRA → STR principal-only payment";
            strPrincipalPayment = month13Loan;
          } else if (y === 3) {
            // Y3: premium funded from IRA/Roth fund
            premium = year2Premium; // equal portion
            premiumSource = "IRA/Roth Fund";
            // After Y3 premium, take 80% loan of surrender value → STR principal
            // (calculated after account value update below)
          } else {
            // Y4+: borrow from prior year to pay this year's premium
            premium = year2Premium;
            premiumSource = `Policy Loan (Y${y-1} → Y${y})`;
            policyLoanTaken = premium; // borrow to pay premium
            loanPurpose = `Fund Y${y} premium`;
          }

          cumulativePremiums += premium;
          // A Mutual Life Accumulator III: 8% Y1, 6% Y2-5, 0% after
          const yearLoadRate = y === 1 ? 0.08 : (y <= 5 ? 0.06 : 0);
          const loadFee = premium * (input.carrierLoadFee ?? yearLoadRate);
          const coiCost = premium * IUL_COI_RATE; // age-based COI rate
          const netPremiumToAccount = premium - loadFee - coiCost;

          // Beginning value = prior ending + net premium
          const beginningValue = accountValue + netPremiumToAccount;

          // Interest = 12% of account value (A Mutual Life Accumulator III baseline at 12% growth)
          const interestEarned = beginningValue * IUL_AVG_RETURN;
          cumulativeInterest += interestEarned;

          // Update account value
          accountValue = beginningValue + interestEarned;

          // Y3 special: take 80% loan of surrender value → STR principal
          if (y === 3) {
            const surrenderVal = accountValue * 0.90; // surrender value ~90% of account
            const y3Loan = surrenderVal * 0.80;
            policyLoanTaken = y3Loan;
            loanPurpose = "80% of surrender value → STR principal-only payment";
            strPrincipalPayment = y3Loan;
          }

          // Accumulate loans
          totalLoanBalance += policyLoanTaken;
          const loanInterestAccrued = totalLoanBalance * IUL_LOAN_RATE;
          totalLoanBalance += loanInterestAccrued; // compound loan interest

          const surrenderValue = accountValue * 0.90;
          const netCashValue = accountValue - totalLoanBalance;
          cumulativeStrPrincipalPayments += strPrincipalPayment;

          rows.push({
            year: y,
            premium: Math.round(premium),
            premiumSource,
            loadFee: Math.round(loadFee),
            coiCost: Math.round(coiCost),
            netPremiumToAccount: Math.round(netPremiumToAccount),
            beginningValue: Math.round(beginningValue),
            interestEarned: Math.round(interestEarned),
            policyLoanTaken: Math.round(policyLoanTaken),
            loanPurpose,
            cumulativeLoanBalance: Math.round(totalLoanBalance),
            loanInterestAccrued: Math.round(loanInterestAccrued),
            endingAccountValue: Math.round(accountValue),
            surrenderValue: Math.round(surrenderValue),
            netCashValue: Math.round(netCashValue),
            cumulativePremiums: Math.round(cumulativePremiums),
            strPrincipalPayment: Math.round(strPrincipalPayment),
          });
        }
        return { rows, cumulativeStrPrincipalPayments: Math.round(cumulativeStrPrincipalPayments) };
      }

      // ─── Build STR property projection (20 years) ───
      // Multi-year strategies: properties are acquired 1 per year over strategyYears.
      // Each property starts generating rental income the year after acquisition.
      // Includes interest-only payment tracking and IUL principal-only payments.
      function buildStrProjection(iulStrPrincipalPayments: number) {
        const years: Array<{
          year: number; propertyValue: number; rentalIncome: number;
          interestOnlyPayment: number; helocPayment: number; netCashFlow: number;
          propertyEquity: number; principalOwed: number; helocBalance: number;
          totalInterestPaid: number; iulPrincipalApplied: number;
          propertiesOwned: number; newPropertyAcquired: boolean;
        }> = [];

        // Track each property separately for accurate multi-year modeling
        const properties: Array<{
          acquiredYear: number; value: number; mortgage: number;
          helocBalance: number; downPayment: number;
        }> = [];

        let totalInt = 0;
        let remainingIulPrincipal = iulStrPrincipalPayments;

        for (let y = 1; y <= 20; y++) {
          // Acquire new property if within strategyYears window
          let newPropertyAcquired = false;
          if (y <= strategyYears) {
            properties.push({
              acquiredYear: y,
              value: perPropertyPrice,
              mortgage: perPropertyMortgage,
              helocBalance: perPropertyDown,
              downPayment: perPropertyDown,
            });
            newPropertyAcquired = true;
          }

          // Calculate totals across all owned properties
          let totalPropertyValue = 0;
          let totalRentalIncome = 0;
          let totalInterestOnly = 0;
          let totalHelocPayment = 0;
          let totalPrincipalOwed = 0;
          let totalHelocBalance = 0;

          for (const prop of properties) {
            // Appreciate property value
            prop.value *= (1 + input.realEstateAppreciation);
            totalPropertyValue += prop.value;

            // Rental income starts the year of acquisition
            const baseValue = prop.value / (1 + input.realEstateAppreciation);
            totalRentalIncome += baseValue * input.rentalGrossYield;

            // Interest-only on mortgage
            const annInterest = prop.mortgage * MORTGAGE_RATE;
            totalInterestOnly += annInterest;
            totalPrincipalOwed += prop.mortgage;

            // HELOC payments
            if (prop.helocBalance > 0) {
              totalHelocPayment += prop.helocBalance * input.helocRate;
            }
            totalHelocBalance += prop.helocBalance;
          }

          totalInt += totalInterestOnly;

          // Apply IUL principal-only payments (from month 13 loan and Y3 surrender loan)
          let iulApplied = 0;
          if (remainingIulPrincipal > 0 && (y === 2 || y === 3)) {
            const totalMortgage = properties.reduce((s, p) => s + p.mortgage, 0);
            const applyAmount = Math.min(remainingIulPrincipal, totalMortgage * 0.5);
            // Distribute across properties proportionally
            for (const prop of properties) {
              const share = totalMortgage > 0 ? (prop.mortgage / totalMortgage) : 0;
              prop.mortgage -= applyAmount * share;
            }
            remainingIulPrincipal -= applyAmount;
            iulApplied = applyAmount;
          }

          // Net cash flow
          const netCf = totalRentalIncome - totalInterestOnly - totalHelocPayment;

          // Excess cash flow reduces HELOC balance across properties
          const excess = Math.max(0, netCf);
          if (excess > 0) {
            const paydown = excess * 0.5;
            let remaining = paydown;
            for (const prop of properties) {
              if (prop.helocBalance > 0 && remaining > 0) {
                const reduction = Math.min(remaining, prop.helocBalance);
                prop.helocBalance -= reduction;
                remaining -= reduction;
              }
            }
          }

          const totalEquity = totalPropertyValue - properties.reduce((s, p) => s + p.mortgage, 0) - properties.reduce((s, p) => s + p.helocBalance, 0);

          years.push({
            year: y,
            propertyValue: Math.round(totalPropertyValue),
            rentalIncome: Math.round(totalRentalIncome),
            interestOnlyPayment: Math.round(totalInterestOnly),
            helocPayment: Math.round(totalHelocPayment),
            netCashFlow: Math.round(netCf),
            propertyEquity: Math.round(totalEquity),
            principalOwed: Math.round(properties.reduce((s, p) => s + p.mortgage, 0)),
            helocBalance: Math.round(properties.reduce((s, p) => s + p.helocBalance, 0)),
            totalInterestPaid: Math.round(totalInt),
            iulPrincipalApplied: Math.round(iulApplied),
            propertiesOwned: properties.length,
            newPropertyAcquired,
          });
        }
        return years;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // BUILD SELECTED STRATEGY (1 of 6 options)
      // Non-Solar: Y1 = half tax savings, Y2 = other half + month 13 loan
      // Solar: Y1 = 22% enhancement, Y2 = equal Roth funds
      // All: Y3 = IRA/Roth fund + 80% surrender loan, Y4+ = borrow cascade
      // ═══════════════════════════════════════════════════════════════════════
      const solarEnhancement = isSolar ? conversionAmount * SOLAR_ENHANCEMENT : 0;
      let year1Premium: number;
      let year2Premium: number;

      if (isSolar) {
        // Solar: 22% enhancement as Y1 premium, equal Roth funds as Y2
        year1Premium = solarEnhancement;
        year2Premium = halfTaxSavings;
      } else {
        // Non-Solar: half tax savings Y1, other half Y2
        year1Premium = halfTaxSavings;
        year2Premium = halfTaxSavings;
      }

      const iulResult = buildIulCascade(year1Premium, year2Premium, input.iulYears, isSolar);
      const iulProjection = iulResult.rows;
      const strProjection = buildStrProjection(iulResult.cumulativeStrPrincipalPayments);

      // Roth balance grows tax-free at 5% over 20 years
      let rothBalance = newRothValue;
      const rothProjection: Array<{ year: number; balance: number }> = [];
      for (let y = 1; y <= input.iulYears; y++) {
        rothBalance *= 1.05;
        rothProjection.push({ year: y, balance: Math.round(rothBalance) });
      }

      const strLastIdx = strProjection.length - 1;
      const lastIulIdx = input.iulYears - 1;

      // Strategy label
      const strategyLabel = isSolar
        ? "0% Year 1 Strategy — Solar Equity"
        : `0% Year ${strategyYears} Strategy — Non Solar`;

      const result = {
        inputs: {
          iraBalance: input.iraBalance,
          conversionPortion: input.conversionPortion,
          homeEquity: input.homeEquity,
          age: input.age,
          income: input.income,
          filingStatus: input.filingStatus,
          currentTaxBracket: input.currentTaxBracket,
          iulYears: input.iulYears,
          strategyYears,
          solarEquity: isSolar,
          rentalGrossYield: input.rentalGrossYield,
          realEstateAppreciation: input.realEstateAppreciation,
          helocRate: input.helocRate,
        },
        strategyLabel,
        strategy: {
          conversionAmount: Math.round(conversionAmount),
          newRothValue: Math.round(newRothValue),
          taxSavings: Math.round(taxSavings),
          halfTaxSavings: Math.round(halfTaxSavings),
          solarEnhancement: Math.round(solarEnhancement),
          targetPropertyPrice: Math.round(targetPropertyPrice),
          totalPropertyCount,
          perPropertyPrice: Math.round(perPropertyPrice),
          downPayment: Math.round(downPayment),
          perPropertyDown: Math.round(perPropertyDown),
          mortgageAmount: Math.round(mortgageAmount),
          perPropertyMortgage: Math.round(perPropertyMortgage),
          helocAmount: Math.round(helocAmount),
          monthlyMortgagePayment: Math.round(monthlyMortgagePayment),
          monthlyInterestOnlyPayment: Math.round(monthlyInterestOnlyPayment),
          monthlyHelocPayment: Math.round(monthlyHelocPayment),
          month13PolicyLoan: Math.round(iraValue * 0.25),
          year1Premium: Math.round(year1Premium),
          year2Premium: Math.round(year2Premium),
        },
        iulParams: {
          loadFee: IUL_LOAD_FEE,
          loanRate: IUL_LOAN_RATE,
          avgReturn: IUL_AVG_RETURN,
          coiRate: IUL_COI_RATE,
          solarEnhancementRate: SOLAR_ENHANCEMENT,
          carrierId: input.carrierId ?? null,
        },
        iulProjection,
        strProjection,
        rothProjection,
        summary: {
          finalAccountValue: iulProjection[lastIulIdx]?.endingAccountValue ?? 0,
          finalNetCashValue: iulProjection[lastIulIdx]?.netCashValue ?? 0,
          finalLoanBalance: iulProjection[lastIulIdx]?.cumulativeLoanBalance ?? 0,
          totalPremiumsPaid: iulProjection[lastIulIdx]?.cumulativePremiums ?? 0,
          strPrincipalPayments: iulResult.cumulativeStrPrincipalPayments,
          totalRentalIncome: strProjection.reduce((s, y) => s + y.rentalIncome, 0),
          totalInterestOnlyPaid: strProjection.reduce((s, y) => s + y.interestOnlyPayment, 0),
          totalHelocPaid: strProjection.reduce((s, y) => s + y.helocPayment, 0),
          totalNetCashFlow: strProjection.reduce((s, y) => s + y.netCashFlow, 0),
          finalPropertyValue: strProjection[strLastIdx]?.propertyValue ?? 0,
          finalPropertyEquity: strProjection[strLastIdx]?.propertyEquity ?? 0,
          finalPrincipalOwed: strProjection[strLastIdx]?.principalOwed ?? 0,
          totalInterestPaid: strProjection[strLastIdx]?.totalInterestPaid ?? 0,
          finalRothBalance: rothProjection[rothProjection.length - 1]?.balance ?? 0,
          propertyAppreciation: (strProjection[strLastIdx]?.propertyValue ?? 0) - Math.round(targetPropertyPrice),
        },
      };

      // Save scenario if client provided
      if (input.clientId) {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (ws) {
          await createScenario({
            workspaceId: ws.id, clientId: input.clientId,
            name: strategyLabel,
            scenarioType: "ROTH_CONVERSION_STR",
            inputJson: input as any,
            outputJson: result.summary as any,
          });
          await logClientActivity({
            clientId: input.clientId, workspaceId: ws.id,
            action: "STRATEGY_GENERATED",
            actorName: ctx.user.name ?? ctx.user.email ?? "Advisor",
            actorUserId: ctx.user.id, entityType: "strategy",
            summary: `${strategyLabel}: $${conversionAmount.toLocaleString()} → Roth, ${totalPropertyCount} properties @ $${Math.round(perPropertyPrice).toLocaleString()} each over ${strategyYears}yr`,
            metadata: { conversionAmount, targetPropertyPrice: Math.round(targetPropertyPrice), taxSavings, strategyYears, solarEquity: isSolar },
          }).catch(() => {});
        }
      }

      return result;
    }),

    // ── Rate Stress Test: deterministic 8%/10%/12%/14% side-by-side ──
    rateStressTest: protectedProcedure.input(z.object({
      iraBalance: z.number().min(0),
      conversionPortion: z.number().min(0).max(1).default(1),
      homeEquity: z.number().min(0),
      age: z.number().min(18).max(100),
      income: z.number().min(0),
      filingStatus: z.enum(["single", "married", "hoh"]).default("married"),
      currentTaxBracket: z.number().min(0).max(0.5).default(0.24),
      iulYears: z.number().min(15).max(20).default(20),
      strategyYears: z.number().min(1).max(5).default(1),
      solarEquity: z.boolean().default(false),
      rentalGrossYield: z.number().min(0).max(1).default(0.20),
      realEstateAppreciation: z.number().min(0).max(0.2).default(0.05),
      helocRate: z.number().min(0).max(0.2).default(0.07),
      mortgageRate: z.number().min(0).max(0.15).default(0.065),
      rates: z.array(z.number()).default([0.08, 0.10, 0.12, 0.14]),
    })).mutation(async ({ input }) => {
      const rates = input.rates;
      const iraValue = input.iraBalance;
      const taxSavings = iraValue * 0.50;
      const halfTaxSavings = taxSavings / 2;
      const solarEnhancement = input.solarEquity ? iraValue * 0.22 : 0;
      const year1Premium = input.solarEquity ? solarEnhancement : halfTaxSavings;
      const year2Premium = halfTaxSavings;
      const IUL_LOAN_RATE = 0.05;
      const IUL_COI_RATE = 0.008;

      function runScenario(creditRate: number) {
        let accountValue = 0;
        let totalLoanBalance = 0;
        let cumulativePremiums = 0;
        const yearlyData: { year: number; accountValue: number; netCashValue: number; loanBalance: number; interestEarned: number; premium: number }[] = [];

        for (let y = 1; y <= input.iulYears; y++) {
          let premium: number;
          let policyLoanTaken = 0;

          if (y === 1) {
            premium = year1Premium;
          } else if (y === 2) {
            premium = year2Premium;
            policyLoanTaken = iraValue * 0.25;
          } else if (y === 3) {
            premium = year2Premium;
            const surrenderVal = accountValue * 0.90;
            policyLoanTaken = surrenderVal * 0.80;
          } else {
            premium = year2Premium;
            policyLoanTaken = premium;
          }

          cumulativePremiums += premium;
          const yearLoadRate = y === 1 ? 0.08 : (y <= 5 ? 0.06 : 0);
          const loadFee = premium * yearLoadRate;
          const coiCost = premium * IUL_COI_RATE;
          const netPremiumToAccount = premium - loadFee - coiCost;
          const beginningValue = accountValue + netPremiumToAccount;
          const interestEarned = beginningValue * creditRate;
          accountValue = beginningValue + interestEarned;

          totalLoanBalance += policyLoanTaken;
          const loanInterestAccrued = totalLoanBalance * IUL_LOAN_RATE;
          totalLoanBalance += loanInterestAccrued;

          yearlyData.push({
            year: y,
            accountValue: Math.round(accountValue),
            netCashValue: Math.round(accountValue - totalLoanBalance),
            loanBalance: Math.round(totalLoanBalance),
            interestEarned: Math.round(interestEarned),
            premium: Math.round(premium),
          });
        }
        return { yearlyData, finalAccountValue: Math.round(accountValue), finalNetCash: Math.round(accountValue - totalLoanBalance), totalPremiums: Math.round(cumulativePremiums) };
      }

      const scenarios = rates.map(rate => ({
        rate,
        label: `${(rate * 100).toFixed(0)}%`,
        ...runScenario(rate),
      }));

      // Build comparison chart data (year-by-year for all rates)
      const chartData = Array.from({ length: input.iulYears }, (_, i) => {
        const entry: Record<string, number> = { year: i + 1 };
        for (const s of scenarios) {
          entry[`av_${s.label}`] = s.yearlyData[i].accountValue;
          entry[`ncv_${s.label}`] = s.yearlyData[i].netCashValue;
        }
        return entry;
      });

      return { scenarios, chartData, rates: rates.map(r => `${(r * 100).toFixed(0)}%`) };
    }),

    // ── Sample Benchmark: compare engine vs illustration ──
    lauraColeman: publicProcedure.query(() => {
      // Sample Illustration — A Mutual Life Accumulator III
      // Female, Age 50, Preferred Non-Tobacco, $50,000/yr premium, 5-pay
      // Source: sample illustration run 2025, SAMPLE-IUL-001
      // These are the actual illustration cash values from the PDF
      const illustrationBenchmarks = [
        { year: 1,  premium: 50000, illustrationCV: 45517,  illustrationSV: 26717,  illustrationDB: 750000 },
        { year: 2,  premium: 50000, illustrationCV: 97707,  illustrationSV: 78907,  illustrationDB: 750000 },
        { year: 3,  premium: 50000, illustrationCV: 156266, illustrationSV: 137466, illustrationDB: 750000 },
        { year: 4,  premium: 50000, illustrationCV: 221970, illustrationSV: 203170, illustrationDB: 750000 },
        { year: 5,  premium: 50000, illustrationCV: 295690, illustrationSV: 279576, illustrationDB: 750000 },
        { year: 10, premium: 0,     illustrationCV: 484699, illustrationSV: 482013, illustrationDB: 750000 },
        { year: 15, premium: 0,     illustrationCV: 859955, illustrationSV: 859955, illustrationDB: 859955 },
        { year: 20, premium: 0,     illustrationCV: 1530321, illustrationSV: 1530321, illustrationDB: 1530321 },
      ];

      // Run our engine with the same parameters
      const engineResult = projectIul(50000, 20, 0.12, 5, 50);
      const engineRows = engineResult.rows;

      const comparisons = illustrationBenchmarks.map(bench => {
        const engineRow = engineRows[bench.year - 1];
        const engineCV = engineRow?.cashValue ?? 0;
        const engineSV = engineRow?.surrenderValue ?? 0;
        const cvDiff = engineCV - bench.illustrationCV;
        const cvPctDiff = bench.illustrationCV > 0 ? ((cvDiff / bench.illustrationCV) * 100) : 0;
        const svDiff = engineSV - bench.illustrationSV;
        const svPctDiff = bench.illustrationSV > 0 ? ((svDiff / bench.illustrationSV) * 100) : 0;
        const withinTolerance = Math.abs(cvPctDiff) <= 2.0;

        return {
          year: bench.year,
          illustrationCV: bench.illustrationCV,
          illustrationSV: bench.illustrationSV,
          engineCV,
          engineSV,
          cvDiff: Math.round(cvDiff),
          cvPctDiff: Number(cvPctDiff.toFixed(2)),
          svDiff: Math.round(svDiff),
          svPctDiff: Number(svPctDiff.toFixed(2)),
          withinTolerance,
        };
      });

      const allWithinTolerance = comparisons.every(c => c.withinTolerance);
      const maxDeviation = Math.max(...comparisons.map(c => Math.abs(c.cvPctDiff)));

      return {
        source: "Sample Illustration — A Mutual Life Indexed UL Accumulator III (SAMPLE-IUL-001)",
        parameters: {
          insured: "Female, Age 50, Preferred Non-Tobacco",
          premium: "$50,000/yr × 5 years",
          creditRate: "12% (current illustrated rate)",
          specifiedAmount: "$750,000",
        },
        comparisons,
        allWithinTolerance,
        maxDeviation: Number(maxDeviation.toFixed(2)),
        verdict: allWithinTolerance
          ? `All benchmark years within 2% tolerance (max deviation: ${maxDeviation.toFixed(2)}%)`
          : `Some years exceed 2% tolerance (max deviation: ${maxDeviation.toFixed(2)}%). Review engine calibration.`,
      };
    }),
    compareCarriers: protectedProcedure.input(z.object({
      iraBalance: z.number(),
      conversionPortion: z.number(),
      homeEquity: z.number(),
      age: z.number(),
      income: z.number(),
      filingStatus: z.enum(["single", "married", "hoh"]),
      currentTaxBracket: z.number(),
      iulYears: z.number().default(20),
      strategyYears: z.number().default(1),
      solarEquity: z.boolean().default(false),
      rentalGrossYield: z.number().default(0.20),
      realEstateAppreciation: z.number().default(0.05),
      helocRate: z.number().default(0.07),
      carrierIds: z.array(z.string()).default(["a-mutual", "aaa-plus-mutual", "bbb-plus-mutual", "a-minus-mutual"]),
    })).mutation(({ input }) => {
      const { iraBalance, conversionPortion, homeEquity, age, income, filingStatus, currentTaxBracket, iulYears, strategyYears, solarEquity, rentalGrossYield, realEstateAppreciation, helocRate, carrierIds } = input;

      // Carrier-specific charge structures for the IUL cascade engine
      const carrierConfigs: Record<string, { name: string; product: string; loadY1: number; loadY2to5: number; coiMultiplier: number; loanRate: number; avgReturn: number; capRate: number; floorRate: number; conditionalCredit: number; perPolicyFee: number; perUnitRate: number; surrenderPct: number; surrenderYears: number; amBest: string }> = {
        "a-mutual": {
          name: "A Mutual Life", product: "Indexed UL Accumulator III",
          loadY1: 0.08, loadY2to5: 0.06, coiMultiplier: 1.0, loanRate: 0.05,
          avgReturn: 0.12, capRate: 0.145, floorRate: 0.0, conditionalCredit: 0.002,
          perPolicyFee: 120, perUnitRate: 7.78, surrenderPct: 0.376, surrenderYears: 10,
          amBest: "A+ (Superior)",
        },
        "aaa-plus-mutual": {
          name: "AAA+ Mutual", product: "Pacific Indexed Accumulator III",
          loadY1: 0.055, loadY2to5: 0.04, coiMultiplier: 1.25, loanRate: 0.05,
          avgReturn: 0.08, capRate: 0.105, floorRate: 0.0, conditionalCredit: 0.001,
          perPolicyFee: 96, perUnitRate: 6.50, surrenderPct: 0.30, surrenderYears: 10,
          amBest: "A+ (Superior)",
        },
        "bbb-plus-mutual": {
          name: "BBB+ Mutual", product: "Builder Plus IUL 3",
          loadY1: 0.06, loadY2to5: 0.045, coiMultiplier: 1.15, loanRate: 0.05,
          avgReturn: 0.085, capRate: 0.11, floorRate: 0.0, conditionalCredit: 0.0015,
          perPolicyFee: 108, perUnitRate: 7.00, surrenderPct: 0.32, surrenderYears: 10,
          amBest: "A+ (Superior)",
        },
        "aa-minus-mutual": {
          name: "AA- Mutual", product: "Life Pro+ Advantage",
          loadY1: 0.07, loadY2to5: 0.05, coiMultiplier: 1.20, loanRate: 0.05,
          avgReturn: 0.0925, capRate: 0.12, floorRate: 0.0, conditionalCredit: 0.0012,
          perPolicyFee: 110, perUnitRate: 7.25, surrenderPct: 0.34, surrenderYears: 10,
          amBest: "A+ (Superior)",
        },
        "aa-mutual": {
          name: "AA Mutual", product: "Accumulation Builder II IUL",
          loadY1: 0.06, loadY2to5: 0.045, coiMultiplier: 1.10, loanRate: 0.05,
          avgReturn: 0.0775, capRate: 0.10, floorRate: 0.0, conditionalCredit: 0.001,
          perPolicyFee: 100, perUnitRate: 6.80, surrenderPct: 0.28, surrenderYears: 10,
          amBest: "A+ (Superior)",
        },
        "a-minus-mutual": {
          name: "A- Mutual Life", product: "Accumulator Ascent IUL 3.0 - GPT",
          loadY1: 0.098, loadY2to5: 0.0555, coiMultiplier: 0.30, loanRate: 0.055,
          avgReturn: 0.0671, capRate: 0.0671, floorRate: 0.0, conditionalCredit: 0.0,
          perPolicyFee: 120, perUnitRate: 0.0, surrenderPct: 0.672, surrenderYears: 9,
          amBest: "A (Excellent)",
        },
      };

      // Run the IUL cascade engine for each carrier
      function runCarrierProjection(carrierId: string) {
        const cfg = carrierConfigs[carrierId] ?? carrierConfigs["a-mutual"];
        const taxSavings = iraBalance * conversionPortion * 0.50;
        const halfTaxSavings = taxSavings / 2;
        const year1Premium = halfTaxSavings;
        const year2Premium = halfTaxSavings;

        let av = 0;
        let loanBalance = 0;
        let cumulativePremiums = 0;
        let cumulativeCharges = 0;
        const yearlyData: { year: number; accountValue: number; netCash: number; loanBalance: number; premium: number; charges: number; interest: number }[] = [];

        for (let y = 1; y <= iulYears; y++) {
          let premium: number;
          let newLoan = 0;
          if (y === 1) { premium = year1Premium; }
          else if (y === 2) { premium = year2Premium; newLoan = iraBalance * 0.25; }
          else if (y === 3) { premium = year2Premium; newLoan = av * 0.90 * 0.80; }
          else { premium = year2Premium; newLoan = premium; }
          cumulativePremiums += premium;

          // Carrier-specific charges
          const loadRate = y === 1 ? cfg.loadY1 : (y <= 5 ? cfg.loadY2to5 : 0);
          const premiumLoad = premium * loadRate;
          const coiBase = getCoiRate(age + y);
          const coiCharge = premium * coiBase * cfg.coiMultiplier;
          const perPolicyFee = cfg.perPolicyFee;
          const perUnitCost = y <= 10 ? (premium * 10 / 1000) * cfg.perUnitRate : 0;
          const totalCharges = premiumLoad + coiCharge + perPolicyFee + perUnitCost;
          cumulativeCharges += totalCharges;

          // Conditional credit
          const conditionalCredit = y >= 11 ? av * cfg.conditionalCredit : 0;

          const netPremium = premium - premiumLoad;
          av += netPremium - (coiCharge + perPolicyFee + perUnitCost) + conditionalCredit;
          const interest = av * cfg.avgReturn;
          av += interest;

          loanBalance += newLoan;
          loanBalance += loanBalance * cfg.loanRate;

          yearlyData.push({
            year: y,
            accountValue: Math.round(av),
            netCash: Math.round(av - loanBalance),
            loanBalance: Math.round(loanBalance),
            premium: Math.round(premium),
            charges: Math.round(totalCharges),
            interest: Math.round(interest),
          });
        }

        return {
          carrierId,
          carrierName: cfg.name,
          product: cfg.product,
          amBest: cfg.amBest,
          capRate: cfg.capRate,
          floorRate: cfg.floorRate,
          avgReturn: cfg.avgReturn,
          loanRate: cfg.loanRate,
          finalAccountValue: Math.round(av),
          finalNetCash: Math.round(av - loanBalance),
          finalLoanBalance: Math.round(loanBalance),
          cumulativePremiums: Math.round(cumulativePremiums),
          cumulativeCharges: Math.round(cumulativeCharges),
          totalReturn: cumulativePremiums > 0 ? Number(((av / cumulativePremiums) * 100).toFixed(1)) : 0,
          yearlyData,
        };
      }

      const carriers = carrierIds.map(id => runCarrierProjection(id));

      // Determine winner
      const winner = carriers.reduce((best, c) => c.finalNetCash > best.finalNetCash ? c : best, carriers[0]);

      // Build chart data
      const chartData = Array.from({ length: iulYears }, (_, i) => {
        const point: Record<string, number> = { year: i + 1 };
        carriers.forEach(c => {
          point[`av_${c.carrierId}`] = c.yearlyData[i]?.accountValue ?? 0;
          point[`ncv_${c.carrierId}`] = c.yearlyData[i]?.netCash ?? 0;
        });
        return point;
      });

      return {
        carriers,
        winner: { carrierId: winner.carrierId, carrierName: winner.carrierName, margin: Math.round(winner.finalNetCash - (carriers.find(c => c.carrierId !== winner.carrierId)?.finalNetCash ?? 0)) },
        chartData,
        inputs: { iraBalance, age, iulYears, filingStatus },
      };
    }),

    historicalBacktest: protectedProcedure.input(z.object({
      iraBalance: z.number(),
      conversionPortion: z.number(),
      homeEquity: z.number(),
      age: z.number(),
      income: z.number(),
      filingStatus: z.enum(["single", "married", "hoh"]),
      currentTaxBracket: z.number(),
      iulYears: z.number().default(20),
      strategyYears: z.number().default(1),
      solarEquity: z.boolean().default(false),
      rentalGrossYield: z.number().default(0.20),
      realEstateAppreciation: z.number().default(0.05),
      helocRate: z.number().default(0.07),
      capRate: z.number().default(0.145),
      floorRate: z.number().default(0.0),
    })).mutation(({ input }) => {
      // Actual S&P 500 annual total returns 2004-2024
      const SP500_RETURNS: { year: number; return: number }[] = [
        { year: 2004, return: 0.1088 },
        { year: 2005, return: 0.0491 },
        { year: 2006, return: 0.1579 },
        { year: 2007, return: 0.0549 },
        { year: 2008, return: -0.3700 },
        { year: 2009, return: 0.2646 },
        { year: 2010, return: 0.1506 },
        { year: 2011, return: 0.0211 },
        { year: 2012, return: 0.1600 },
        { year: 2013, return: 0.3239 },
        { year: 2014, return: 0.1369 },
        { year: 2015, return: 0.0138 },
        { year: 2016, return: 0.1196 },
        { year: 2017, return: 0.2183 },
        { year: 2018, return: -0.0438 },
        { year: 2019, return: 0.3149 },
        { year: 2020, return: 0.1840 },
        { year: 2021, return: 0.2871 },
        { year: 2022, return: -0.1811 },
        { year: 2023, return: 0.2629 },
        { year: 2024, return: 0.2508 },
      ];

      const { iraBalance, conversionPortion, age, iulYears, capRate, floorRate } = input;
      const taxSavings = iraBalance * conversionPortion * 0.50;
      const halfTaxSavings = taxSavings / 2;

      // Run two parallel projections: historical (floor/cap) vs illustrated (flat 12%)
      function runProjection(getRate: (year: number) => number, label: string) {
        let av = 0;
        let loanBalance = 0;
        let cumulativePremiums = 0;
        const yearly: { year: number; calendarYear: number; spReturn: number; creditedRate: number; accountValue: number; netCash: number; premium: number; floorProtected: boolean; capLimited: boolean }[] = [];

        for (let y = 1; y <= Math.min(iulYears, SP500_RETURNS.length); y++) {
          const spData = SP500_RETURNS[y - 1];
          let premium: number;
          let newLoan = 0;
          if (y === 1) { premium = halfTaxSavings; }
          else if (y === 2) { premium = halfTaxSavings; newLoan = iraBalance * 0.25; }
          else if (y === 3) { premium = halfTaxSavings; newLoan = av * 0.90 * 0.80; }
          else { premium = halfTaxSavings; newLoan = premium; }
          cumulativePremiums += premium;

          const loadRate = y === 1 ? 0.08 : (y <= 5 ? 0.06 : 0);
          const premiumLoad = premium * loadRate;
          const coiCharge = premium * getCoiRate(age + y) * 1.0;
          const perPolicyFee = 120;
          const perUnitCost = y <= 10 ? (premium * 10 / 1000) * 7.78 : 0;

          const conditionalCredit = y >= 11 ? av * 0.002 : 0;
          av += (premium - premiumLoad) - (coiCharge + perPolicyFee + perUnitCost) + conditionalCredit;

          const creditedRate = getRate(y);
          const floorProtected = spData.return < floorRate;
          const capLimited = spData.return > capRate;
          av += av * creditedRate;

          loanBalance += newLoan;
          loanBalance += loanBalance * 0.05;

          yearly.push({
            year: y,
            calendarYear: spData.year,
            spReturn: Number((spData.return * 100).toFixed(2)),
            creditedRate: Number((creditedRate * 100).toFixed(2)),
            accountValue: Math.round(av),
            netCash: Math.round(av - loanBalance),
            premium: Math.round(premium),
            floorProtected,
            capLimited,
          });
        }
        return { label, yearly, finalAV: Math.round(av), finalNCV: Math.round(av - loanBalance), totalPremiums: Math.round(cumulativePremiums) };
      }

      const historical = runProjection((y) => {
        const sp = SP500_RETURNS[y - 1];
        if (!sp) return 0.12;
        return Math.max(floorRate, Math.min(capRate, sp.return));
      }, "Historical (Floor/Cap)");

      const illustrated = runProjection(() => 0.12, "Illustrated (12% Flat)");

      // Key insights
      const floorProtectedYears = historical.yearly.filter(y => y.floorProtected).map(y => y.calendarYear);
      const capLimitedYears = historical.yearly.filter(y => y.capLimited).map(y => y.calendarYear);
      const avgHistoricalCredit = historical.yearly.reduce((s, y) => s + y.creditedRate, 0) / historical.yearly.length;

      return {
        historical,
        illustrated,
        sp500Returns: SP500_RETURNS.slice(0, iulYears),
        insights: {
          floorProtectedYears,
          capLimitedYears,
          avgHistoricalCredit: Number(avgHistoricalCredit.toFixed(2)),
          floorSavings: floorProtectedYears.length,
          capEvents: capLimitedYears.length,
          historicalVsIllustrated: Number(((historical.finalAV / illustrated.finalAV - 1) * 100).toFixed(1)),
        },
        chartData: historical.yearly.map((h, i) => ({
          year: h.year,
          calendarYear: h.calendarYear,
          spReturn: h.spReturn,
          creditedRate: h.creditedRate,
          historicalAV: h.accountValue,
          illustratedAV: illustrated.yearly[i]?.accountValue ?? 0,
          historicalNCV: h.netCash,
          illustratedNCV: illustrated.yearly[i]?.netCash ?? 0,
        })),
      };
    }),
  }),

  // ── Shared Projections (Client Portal) ──
  sharedProjections: router({
    create: protectedProcedure.input(z.object({
      clientId: z.number().optional(),
      clientName: z.string().optional(),
      projectionData: z.any(),
      inputData: z.any(),
      expiresInDays: z.number().default(30),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new Error("No workspace found");
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
      const db = (await getDb())!;
      await db.insert(sharedProjections).values({
        workspaceId: ws.id,
        clientId: input.clientId ?? null,
        clientName: input.clientName ?? null,
        advisorName: ctx.user.name ?? "Advisor",
        token,
        projectionData: input.projectionData,
        inputData: input.inputData,
        expiresAt,
      });
      // Auto-schedule 3-day and 7-day follow-up emails if client email is available
      if (input.clientId) {
        const client = await getClientById(input.clientId, ws.id);
        if (client?.email) {
          const now = Date.now();
          const threeDays = new Date(now + 3 * 24 * 60 * 60 * 1000);
          const sevenDays = new Date(now + 7 * 24 * 60 * 60 * 1000);
          const [shared] = await db.select().from(sharedProjections).where(eq(sharedProjections.token, token)).limit(1);
          if (shared) {
            await db.insert(followUpEmails).values([
              {
                sharedProjectionId: shared.id,
                workspaceId: ws.id,
                clientId: input.clientId,
                clientName: input.clientName ?? client.name ?? null,
                clientEmail: client.email,
                advisorName: ctx.user.name ?? "Advisor",
                emailType: "3day",
                shareToken: token,
                scheduledAt: threeDays,
                status: "pending",
              },
              {
                sharedProjectionId: shared.id,
                workspaceId: ws.id,
                clientId: input.clientId,
                clientName: input.clientName ?? client.name ?? null,
                clientEmail: client.email,
                advisorName: ctx.user.name ?? "Advisor",
                emailType: "7day",
                shareToken: token,
                scheduledAt: sevenDays,
                status: "pending",
              },
            ]);
          }
        }
      }
      return { token, expiresAt: expiresAt.toISOString(), shareUrl: `/shared/${token}`, followUpsScheduled: !!input.clientId };
    }),

    getByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const db = (await getDb())!;
      const [row] = await db.select().from(sharedProjections).where(eq(sharedProjections.token, input.token)).limit(1);
      if (!row) return null;
      if (new Date(row.expiresAt) < new Date()) return { expired: true, data: null };
      // Increment view count
      await db!.update(sharedProjections).set({ viewCount: (row.viewCount ?? 0) + 1, lastViewedAt: new Date() }).where(eq(sharedProjections.id, row.id));
      return {
        expired: false,
        data: {
          clientName: row.clientName,
          advisorName: row.advisorName,
          projectionData: row.projectionData,
          inputData: row.inputData,
          createdAt: row.createdAt.toISOString(),
          expiresAt: row.expiresAt.toISOString(),
        },
      };
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const db = (await getDb())!;
      return db.select().from(sharedProjections).where(eq(sharedProjections.workspaceId, ws.id)).orderBy(desc(sharedProjections.createdAt)).limit(50);
    }),

    // View follow-up emails for a shared projection
    getFollowUps: protectedProcedure.input(z.object({ sharedProjectionId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const db = (await getDb())!;
      return db.select().from(followUpEmails)
        .where(and(eq(followUpEmails.sharedProjectionId, input.sharedProjectionId), eq(followUpEmails.workspaceId, ws.id)))
        .orderBy(followUpEmails.scheduledAt);
    }),

    // Cancel a pending follow-up email
    cancelFollowUp: protectedProcedure.input(z.object({ followUpId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new Error("No workspace found");
      const db = (await getDb())!;
      await db.update(followUpEmails)
        .set({ status: "cancelled" })
        .where(and(eq(followUpEmails.id, input.followUpId), eq(followUpEmails.workspaceId, ws.id), eq(followUpEmails.status, "pending")));
      return { cancelled: true };
    }),
  }),

  // ── Carrier Quote Requests ──
  carrierQuotes: router({
    create: protectedProcedure.input(z.object({
      clientId: z.number().optional(),
      clientName: z.string().optional(),
      clientEmail: z.string().optional(),
      carrierId: z.string(),
      carrierName: z.string(),
      productName: z.string().optional(),
      formData: z.any(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new Error("No workspace found");
      const db = (await getDb())!;
      const [inserted] = await db.insert(carrierQuoteRequests).values({
        workspaceId: ws.id,
        clientId: input.clientId ?? null,
        clientName: input.clientName ?? null,
        clientEmail: input.clientEmail ?? null,
        advisorId: ctx.user.id,
        advisorName: ctx.user.name ?? "Advisor",
        advisorEmail: ctx.user.email ?? null,
        carrierId: input.carrierId,
        carrierName: input.carrierName,
        productName: input.productName ?? null,
        formData: input.formData,
        status: "submitted",
        notes: input.notes ?? null,
      }).$returningId();

      // Send notification email to advisor
      if (ctx.user.email) {
        const fmtDollar = (n: number) => `$${Math.round(n).toLocaleString()}`;
        const fd = input.formData as any;
        const summary = `Age: ${fd.age || "N/A"}, IRA Balance: ${fd.iraBalance ? fmtDollar(fd.iraBalance) : "N/A"}, Annual Premium: ${fd.annualPremium ? fmtDollar(fd.annualPremium) : "N/A"}, IUL Years: ${fd.iulYears || 20}`;
        await sendQuoteRequestNotification({
          toEmail: ctx.user.email,
          advisorName: ctx.user.name ?? "Advisor",
          clientName: input.clientName ?? "Client",
          carrierName: input.carrierName,
          productName: input.productName ?? "IUL",
          formSummary: summary,
          quoteRequestId: inserted.id,
        });
      }

      return { id: inserted.id, status: "submitted" };
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const db = (await getDb())!;
      return db.select().from(carrierQuoteRequests)
        .where(eq(carrierQuoteRequests.workspaceId, ws.id))
        .orderBy(desc(carrierQuoteRequests.createdAt))
        .limit(50);
    }),

    updateStatus: protectedProcedure.input(z.object({
      quoteId: z.number(),
      status: z.enum(["draft", "submitted", "pending_review", "approved", "rejected"]),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new Error("No workspace found");
      const db = (await getDb())!;
      await db.update(carrierQuoteRequests)
        .set({ status: input.status })
        .where(and(eq(carrierQuoteRequests.id, input.quoteId), eq(carrierQuoteRequests.workspaceId, ws.id)));
      return { updated: true };
    }),
  }),

  // ── Saved Scenarios (What-If) ──
  scenarios: router({
    save: protectedProcedure.input(z.object({
      name: z.string().min(1).max(200),
      clientId: z.number().optional(),
      inputs: z.any(),
      projectionData: z.any(),
      tags: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new Error("No workspace found");
      const db = (await getDb())!;
      const [inserted] = await db.insert(savedScenarios).values({
        workspaceId: ws.id,
        userId: ctx.user.id,
        clientId: input.clientId ?? null,
        name: input.name,
        inputs: input.inputs,
        projectionData: input.projectionData,
        tags: input.tags ?? null,
      }).$returningId();
      return { id: inserted.id, name: input.name };
    }),

    list: protectedProcedure.input(z.object({
      clientId: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const db = (await getDb())!;
      const conditions = [eq(savedScenarios.workspaceId, ws.id)];
      if (input?.clientId) conditions.push(eq(savedScenarios.clientId, input.clientId));
      return db.select().from(savedScenarios)
        .where(and(...conditions))
        .orderBy(desc(savedScenarios.createdAt))
        .limit(100);
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new Error("No workspace found");
      const db = (await getDb())!;
      const [row] = await db.select().from(savedScenarios)
        .where(and(eq(savedScenarios.id, input.id), eq(savedScenarios.workspaceId, ws.id)))
        .limit(1);
      return row ?? null;
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new Error("No workspace found");
      const db = (await getDb())!;
      await db.delete(savedScenarios)
        .where(and(eq(savedScenarios.id, input.id), eq(savedScenarios.workspaceId, ws.id)));
      return { deleted: true };
    }),

    compare: protectedProcedure.input(z.object({
      scenarioIds: z.array(z.number()).min(2).max(4),
    })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new Error("No workspace found");
      const db = (await getDb())!;
      const scenarios = [];
      for (const id of input.scenarioIds) {
        const [row] = await db.select().from(savedScenarios)
          .where(and(eq(savedScenarios.id, id), eq(savedScenarios.workspaceId, ws.id)))
          .limit(1);
        if (row) scenarios.push(row);
      }
      return { scenarios };
    }),
  }),

  // ── Saved Strategies ──
  savedStrategies: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number().optional(), includeArchived: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return [];
        return getSavedStrategies(ws.id, input.clientId, input.includeArchived ?? false);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return null;
        return getSavedStrategyById(input.id, ws.id);
      }),

    save: protectedProcedure
      .input(z.object({
        clientId: z.number().optional(),
        clientName: z.string().optional(),
        strategyType: z.string(),
        strategyLabel: z.string(),
        carrierId: z.string().optional(),
        carrierName: z.string().optional(),
        inputsJson: z.any(),
        summaryJson: z.any(),
        iulProjectionJson: z.any().optional(),
        strProjectionJson: z.any().optional(),
        notes: z.string().optional(),
        notifyClient: z.boolean().optional(),
        portalOrigin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new Error("No workspace found");
        const id = await createSavedStrategy({
          workspaceId: ws.id,
          advisorId: ctx.user.id,
          advisorName: ctx.user.name ?? "Advisor",
          ...input,
        });

        // Send email notification to client if requested and client has email
        let notificationSent = false;
        if (input.notifyClient && input.clientId) {
          try {
            const client = await getClientById(input.clientId, ws.id);
            if (client?.email) {
              const summary = input.summaryJson as any;
              const origin = input.portalOrigin || "https://www.RussellCapitalSystems.com";
              // Find an active portal token for this client
              const tokens = await getPortalTokensByClient(input.clientId, ws.id);
              const activeToken = tokens.find((t: any) => !t.revokedAt && (!t.expiresAt || new Date(t.expiresAt) > new Date()));
              const portalUrl = activeToken
                ? `${origin}/client-portal/${activeToken.token}`
                : `${origin}`;

              const result = await sendStrategyNotification({
                toEmail: client.email,
                toName: client.name ?? undefined,
                clientName: client.name ?? "Client",
                advisorName: ctx.user.name ?? "Your Advisor",
                strategyLabel: input.strategyLabel,
                carrierName: input.carrierName ?? undefined,
                portalUrl,
                summary: {
                  iulNetCash: summary?.finalNetCashValue,
                  propertyEquity: summary?.finalPropertyEquity ?? summary?.totalPropertyEquity,
                  rentalIncome: summary?.totalRentalIncome,
                  rothBalance: summary?.finalRothBalance,
                  netWorth: summary?.estimatedNetWorth,
                },
                notes: input.notes ?? undefined,
              });
              notificationSent = result.sent;
            }
          } catch (err) {
            console.error("[SavedStrategy] Failed to send notification:", err);
          }
        }

        return { id, notificationSent };
      }),

    update: protectedProcedure
      .input(z.object({
        parentStrategyId: z.number(),
        clientId: z.number().optional(),
        clientName: z.string().optional(),
        strategyType: z.string(),
        strategyLabel: z.string(),
        carrierId: z.string().optional(),
        carrierName: z.string().optional(),
        inputsJson: z.any(),
        summaryJson: z.any(),
        iulProjectionJson: z.any().optional(),
        strProjectionJson: z.any().optional(),
        notes: z.string().optional(),
        notifyClient: z.boolean().optional(),
        portalOrigin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new Error("No workspace found");
        const nextVersion = await getLatestVersion(input.parentStrategyId, ws.id);
        const id = await createSavedStrategy({
          workspaceId: ws.id,
          advisorId: ctx.user.id,
          advisorName: ctx.user.name ?? "Advisor",
          ...input,
          version: nextVersion,
          parentStrategyId: input.parentStrategyId,
        });
        return { id, version: nextVersion };
      }),

    versions: protectedProcedure
      .input(z.object({ parentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return [];
        return getStrategyVersions(input.parentId, ws.id);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new Error("No workspace found");
        await deleteSavedStrategy(input.id, ws.id);
        return { success: true };
      }),

    toggleArchive: protectedProcedure
      .input(z.object({ id: z.number(), isArchived: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new Error("No workspace found");
        return toggleArchiveStrategy(input.id, ws.id, input.isArchived);
      }),
  }),

  // ── Carrier Rate Overrides ──
  carrierOverrides: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      return getCarrierOverrides(ws.id);
    }),

    get: protectedProcedure
      .input(z.object({ carrierId: z.string() }))
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return null;
        return getCarrierOverride(ws.id, input.carrierId);
      }),

    upsert: protectedProcedure
      .input(z.object({
        carrierId: z.string().min(1).max(50),
        carrierName: z.string().min(1).max(200),
        loadFee: z.string().optional(),
        coiRate: z.string().optional(),
        capRate: z.string().optional(),
        floorRate: z.string().optional(),
        avgReturn: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new Error("No workspace found");
        const id = await upsertCarrierOverride({ workspaceId: ws.id, ...input });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new Error("No workspace found");
        await deleteCarrierOverride(input.id, ws.id);
        return { success: true };
      }),

    recommend: protectedProcedure
      .input(z.object({
        age: z.number().min(18).max(100),
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
        annualPremium: z.number().min(0),
        clientId: z.number().optional(),
        clientName: z.string().optional(),
        saveHistory: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        const overrides = ws ? await getCarrierOverrides(ws.id) : [];

        // Build carrier rates: merge system defaults with overrides
        const overrideMap = new Map(overrides.map(o => [o.carrierId, o]));
        const carrierRates: CarrierRates[] = IUL_CARRIERS
          .filter(c => c.id !== "custom")
          .map(c => {
            const ov = overrideMap.get(c.id);
            return {
              carrierId: c.id,
              carrierName: c.name,
              loadFee: ov?.loadFee ? Number(ov.loadFee) : c.loadFee,
              coiRate: ov?.coiRate ? Number(ov.coiRate) : c.coiRate,
              capRate: ov?.capRate ? Number(ov.capRate) : c.capRate,
              floorRate: ov?.floorRate ? Number(ov.floorRate) : c.floorRate,
              avgReturn: ov?.avgReturn ? Number(ov.avgReturn) : c.avgIllustratedRate,
              loanRate: c.loanRate,
            };
          });

        const results = recommendCarriers(carrierRates, {
          age: input.age,
          riskTolerance: input.riskTolerance as RiskTolerance,
          annualPremium: input.annualPremium,
        });

        // Auto-save recommendation history
        if (ws && input.saveHistory && results.length > 0) {
          const top = results[0];
          try {
            await createRecommendationHistory({
              workspaceId: ws.id,
              clientId: input.clientId ?? null,
              clientName: input.clientName ?? null,
              clientAge: input.age,
              riskTolerance: input.riskTolerance,
              annualPremium: input.annualPremium,
              recommendedCarrierId: top.carrierId,
              recommendedCarrierName: top.carrierName,
              totalScore: top.totalScore,
              allScoresJson: results.map(r => ({
                carrierId: r.carrierId,
                carrierName: r.carrierName,
                totalScore: r.totalScore,
                growthScore: r.growthScore,
                protectionScore: r.protectionScore,
                costScore: r.costScore,
                rank: r.rank,
              })),
              advisorId: ctx.user.id,
              advisorName: ctx.user.name ?? undefined,
            });
          } catch (e) {
            console.warn("[RecommendationHistory] Failed to save:", e);
          }
        }

        return results;
      }),
  }),

  // ── Recommendation History ──
  recommendationHistory: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.number().optional(), limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return [];
        if (input?.clientId) {
          return getRecommendationHistoryByClient(ws.id, input.clientId, input?.limit ?? 20);
        }
        return getRecommendationHistory(ws.id, input?.limit ?? 50);
      }),
  }),

  // ── Dashboard Strategy Analytics ──
  strategyAnalytics: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { totalStrategies: 0, activeStrategies: 0, archivedStrategies: 0, topCarriers: [], clientsWithStrategies: 0 };

      const allStrategies = await getSavedStrategies(ws.id, undefined, true);
      const active = allStrategies.filter(s => !s.isArchived);
      const archived = allStrategies.filter(s => s.isArchived);

      // Count strategies per carrier
      const carrierCounts = new Map<string, { name: string; count: number }>();
      for (const s of allStrategies) {
        const key = s.carrierId ?? "unknown";
        const existing = carrierCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          carrierCounts.set(key, { name: s.carrierName ?? key, count: 1 });
        }
      }
      const topCarriers = Array.from(carrierCounts.entries())
        .map(([id, { name, count }]) => ({ carrierId: id, carrierName: name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Count unique clients with strategies
      const clientIds = new Set(allStrategies.map(s => s.clientId).filter(Boolean));

      // Strategy type breakdown
      const typeCounts = new Map<string, number>();
      for (const s of allStrategies) {
        const t = s.strategyType ?? "unknown";
        typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
      }
      const strategyTypes = Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalStrategies: allStrategies.length,
        activeStrategies: active.length,
        archivedStrategies: archived.length,
        topCarriers,
        clientsWithStrategies: clientIds.size,
        strategyTypes,
      };
    }),
  }),

  // ── Bulk Client Strategy Generation ──
  bulkGeneration: router({
    run: protectedProcedure
      .input(z.object({
        clientIds: z.array(z.number()).min(1).max(50),
        strategyYears: z.number().min(1).max(5).default(1),
        solarEquity: z.boolean().default(false),
        iulYears: z.number().min(15).max(20).default(20),
        carrierId: z.string().optional(),
        carrierLoadFee: z.number().optional(),
        carrierCoiRate: z.number().optional(),
        carrierLoanRate: z.number().optional(),
        carrierAvgReturn: z.number().optional(),
        autoRecommendCarrier: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new Error("No workspace found");

        // Load carrier overrides for recommendation
        const overrides = await getCarrierOverrides(ws.id);
        const overrideMap = new Map(overrides.map(o => [o.carrierId, o]));

        const results: Array<{
          clientId: number;
          clientName: string;
          age: number;
          iraBalance: number;
          income: number;
          carrierId: string;
          carrierName: string;
          strategyLabel: string;
          iulNetCash: number;
          reEquity: number;
          rentalIncome: number;
          rothBalance: number;
          netWorth: number;
          error?: string;
        }> = [];

        for (const clientId of input.clientIds) {
          const client = await getClientById(clientId, ws.id);
          if (!client) {
            results.push({
              clientId, clientName: "Unknown", age: 0, iraBalance: 0, income: 0,
              carrierId: "", carrierName: "", strategyLabel: "Error",
              iulNetCash: 0, reEquity: 0, rentalIncome: 0, rothBalance: 0, netWorth: 0,
              error: "Client not found",
            });
            continue;
          }

          const iraBalance = Number(client.iraBalance) || 0;
          const homeEquity = Number(client.realEstateEquity) || 0;
          const age = client.age || 45;
          const income = Number(client.income) || 0;

          if (iraBalance <= 0) {
            results.push({
              clientId, clientName: client.name, age, iraBalance, income,
              carrierId: "", carrierName: "", strategyLabel: "Skipped",
              iulNetCash: 0, reEquity: 0, rentalIncome: 0, rothBalance: 0, netWorth: 0,
              error: "No IRA balance",
            });
            continue;
          }

          // Determine carrier rates — A Mutual Life Accumulator III baseline (sample illustration)
          let loadFee = input.carrierLoadFee ?? 0.08;
          let coiRate = input.carrierCoiRate ?? 0.008;
          let loanRate = input.carrierLoanRate ?? 0.05;
          let avgReturn = input.carrierAvgReturn ?? 0.12;
          let usedCarrierId = input.carrierId ?? "a-mutual";
          let usedCarrierName = "A Mutual Life";

          if (input.autoRecommendCarrier) {
            // Use recommendation engine
            const carrierRates: CarrierRates[] = IUL_CARRIERS
              .filter(c => c.id !== "custom")
              .map(c => {
                const ov = overrideMap.get(c.id);
                return {
                  carrierId: c.id, carrierName: c.name,
                  loadFee: ov?.loadFee ? Number(ov.loadFee) : c.loadFee,
                  coiRate: ov?.coiRate ? Number(ov.coiRate) : c.coiRate,
                  capRate: ov?.capRate ? Number(ov.capRate) : c.capRate,
                  floorRate: ov?.floorRate ? Number(ov.floorRate) : c.floorRate,
                  avgReturn: ov?.avgReturn ? Number(ov.avgReturn) : c.avgIllustratedRate,
                  loanRate: c.loanRate,
                };
              });
            const recs = recommendCarriers(carrierRates, {
              age, riskTolerance: age >= 55 ? "conservative" : age >= 40 ? "moderate" : "aggressive",
              annualPremium: iraBalance * 0.05,
            });
            if (recs.length > 0) {
              const top = recs[0];
              usedCarrierId = top.carrierId;
              usedCarrierName = top.carrierName;
              loadFee = carrierRates.find(c => c.carrierId === top.carrierId)?.loadFee ?? 0.08;
              coiRate = carrierRates.find(c => c.carrierId === top.carrierId)?.coiRate ?? 0.008;
              loanRate = carrierRates.find(c => c.carrierId === top.carrierId)?.loanRate ?? 0.05;
              avgReturn = carrierRates.find(c => c.carrierId === top.carrierId)?.avgReturn ?? 0.12;
            }
          } else if (input.carrierId) {
            const carrier = IUL_CARRIERS.find(c => c.id === input.carrierId);
            if (carrier) {
              usedCarrierName = carrier.name;
              const ov = overrideMap.get(carrier.id);
              loadFee = input.carrierLoadFee ?? (ov?.loadFee ? Number(ov.loadFee) : carrier.loadFee);
              coiRate = input.carrierCoiRate ?? (ov?.coiRate ? Number(ov.coiRate) : carrier.coiRate);
              loanRate = input.carrierLoanRate ?? carrier.loanRate;
              avgReturn = input.carrierAvgReturn ?? (ov?.avgReturn ? Number(ov.avgReturn) : carrier.avgIllustratedRate);
            }
          }

          // Run simplified projection
          const conversionAmount = iraBalance;
          const taxSavings = iraBalance * 0.50;
          const halfTaxSavings = taxSavings / 2;
          const isSolar = input.solarEquity;
          const strategyYears = input.strategyYears;

          const year1Premium = isSolar ? conversionAmount * 0.22 : halfTaxSavings;
          const year2Premium = halfTaxSavings;

          // Simplified IUL cascade
          let accountValue = 0;
          let totalLoanBalance = 0;
          let cumulativePremiums = 0;
          for (let y = 1; y <= input.iulYears; y++) {
            let premium: number;
            if (y === 1) premium = year1Premium;
            else if (y === 2) premium = year2Premium;
            else if (y === 3) premium = year2Premium;
            else premium = year2Premium;

            cumulativePremiums += premium;
            const netPremium = premium * (1 - loadFee - coiRate);
            accountValue += netPremium;
            accountValue *= (1 + avgReturn);

            if (y === 2) {
              const m13Loan = iraBalance * 0.25;
              totalLoanBalance += m13Loan;
            }
            if (y === 3) {
              const y3Loan = accountValue * 0.90 * 0.80;
              totalLoanBalance += y3Loan;
            }
            if (y >= 4) {
              totalLoanBalance += premium;
            }
            totalLoanBalance *= (1 + loanRate);
          }
          const iulNetCash = Math.round(accountValue - totalLoanBalance);

          // Simplified STR projection
          const totalPropertyValue = iraBalance / 0.4;
          const perPropertyPrice = totalPropertyValue / strategyYears;
          const totalRentalIncome = totalPropertyValue * 0.20 * input.iulYears;
          const appreciatedValue = totalPropertyValue * Math.pow(1.05, input.iulYears);
          const mortgageOwed = totalPropertyValue * 0.70 * 0.85; // rough remaining
          const reEquity = Math.round(appreciatedValue - mortgageOwed);

          // Roth balance
          let rothBalance = conversionAmount;
          for (let y = 1; y <= input.iulYears; y++) rothBalance *= 1.05;
          rothBalance = Math.round(rothBalance);

          const strategyLabel = isSolar
            ? "0% Year 1 Strategy — Solar Equity"
            : `0% Year ${strategyYears} Strategy — Non Solar`;

          const netWorth = iulNetCash + reEquity + rothBalance;

          results.push({
            clientId, clientName: client.name, age, iraBalance, income,
            carrierId: usedCarrierId, carrierName: usedCarrierName,
            strategyLabel, iulNetCash, reEquity,
            rentalIncome: Math.round(totalRentalIncome),
            rothBalance, netWorth,
          });
        }

        return {
          results: results.sort((a, b) => b.netWorth - a.netWorth),
          summary: {
            totalClients: results.length,
            successfulProjections: results.filter(r => !r.error).length,
            skipped: results.filter(r => r.error).length,
            totalNetWorth: results.filter(r => !r.error).reduce((s, r) => s + r.netWorth, 0),
            avgNetWorth: results.filter(r => !r.error).length > 0
              ? Math.round(results.filter(r => !r.error).reduce((s, r) => s + r.netWorth, 0) / results.filter(r => !r.error).length)
              : 0,
            topClient: results.filter(r => !r.error).sort((a, b) => b.netWorth - a.netWorth)[0]?.clientName ?? "N/A",
          },
        };
      }),

    exportPdf: protectedProcedure
      .input(z.object({
        results: z.array(z.object({
          clientId: z.number(),
          clientName: z.string(),
          age: z.number(),
          iraBalance: z.number(),
          income: z.number(),
          carrierId: z.string(),
          carrierName: z.string(),
          strategyLabel: z.string(),
          iulNetCash: z.number(),
          reEquity: z.number(),
          rentalIncome: z.number(),
          rothBalance: z.number(),
          netWorth: z.number(),
          error: z.string().optional(),
        })),
        summary: z.object({
          totalClients: z.number(),
          successfulProjections: z.number(),
          skipped: z.number(),
          totalNetWorth: z.number(),
          avgNetWorth: z.number(),
          topClient: z.string(),
        }),
        settings: z.object({
          strategyYears: z.number(),
          solarEquity: z.boolean(),
          iulYears: z.number(),
          autoRecommendCarrier: z.boolean(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const pdfBuffer = await generateBulkComparisonPdf({
          advisorName: ctx.user.name ?? "Advisor",
          results: input.results as BulkResult[],
          summary: input.summary as BulkSummary,
          settings: input.settings,
        });
        const dateStr = new Date().toISOString().slice(0, 10);
        const fileKey = `bulk-reports/${ctx.user.id}-${dateStr}-${Date.now()}.pdf`;
        const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");
        return { url, fileKey };
      }),

    saveAll: protectedProcedure
      .input(z.object({
        results: z.array(z.object({
          clientId: z.number(),
          clientName: z.string(),
          age: z.number(),
          iraBalance: z.number(),
          income: z.number(),
          carrierId: z.string(),
          carrierName: z.string(),
          strategyLabel: z.string(),
          iulNetCash: z.number(),
          reEquity: z.number(),
          rentalIncome: z.number(),
          rothBalance: z.number(),
          netWorth: z.number(),
          error: z.string().optional(),
        })),
        settings: z.object({
          strategyYears: z.number(),
          solarEquity: z.boolean(),
          iulYears: z.number(),
          autoRecommendCarrier: z.boolean(),
        }),
        notifyClients: z.boolean().default(false),
        portalOrigin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new Error("No workspace found");

        const saved: Array<{ clientId: number; clientName: string; strategyId: number | null; notified: boolean }> = [];
        const successResults = input.results.filter(r => !r.error);

        for (const r of successResults) {
          const strategyId = await createSavedStrategy({
            workspaceId: ws.id,
            clientId: r.clientId,
            clientName: r.clientName,
            advisorId: ctx.user.id,
            advisorName: ctx.user.name ?? "Advisor",
            strategyType: input.settings.solarEquity ? "solar" : `${input.settings.strategyYears}yr-non-solar`,
            strategyLabel: r.strategyLabel,
            carrierId: r.carrierId,
            carrierName: r.carrierName,
            inputsJson: {
              iraBalance: r.iraBalance,
              age: r.age,
              income: r.income,
              strategyYears: input.settings.strategyYears,
              solarEquity: input.settings.solarEquity,
              iulYears: input.settings.iulYears,
              autoRecommendCarrier: input.settings.autoRecommendCarrier,
            },
            summaryJson: {
              finalNetCashValue: r.iulNetCash,
              totalPropertyEquity: r.reEquity,
              totalRentalIncome: r.rentalIncome,
              finalRothBalance: r.rothBalance,
              estimatedNetWorth: r.netWorth,
            },
            notes: `Auto-saved from bulk generation on ${new Date().toLocaleDateString()}`,
          });

          let notified = false;
          if (input.notifyClients) {
            try {
              const client = await getClientById(r.clientId, ws.id);
              if (client?.email) {
                const tokens = await getPortalTokensByClient(r.clientId, ws.id);
                const activeToken = tokens.find((t: any) => !t.revokedAt && (!t.expiresAt || new Date(t.expiresAt) > new Date()));
                const origin = input.portalOrigin || "https://www.RussellCapitalSystems.com";
                const portalUrl = activeToken ? `${origin}/client-portal/${activeToken.token}` : origin;
                const result = await sendStrategyNotification({
                  toEmail: client.email,
                  toName: client.name ?? undefined,
                  clientName: client.name ?? "Client",
                  advisorName: ctx.user.name ?? "Your Advisor",
                  strategyLabel: r.strategyLabel,
                  carrierName: r.carrierName,
                  portalUrl,
                  summary: {
                    iulNetCash: r.iulNetCash,
                    propertyEquity: r.reEquity,
                    rentalIncome: r.rentalIncome,
                    rothBalance: r.rothBalance,
                    netWorth: r.netWorth,
                  },
                  notes: `Auto-saved from bulk generation`,
                });
                notified = result.sent;
              }
            } catch (err) {
              console.warn(`[BulkSaveAll] Failed to notify client ${r.clientName}:`, err);
            }
          }

          saved.push({ clientId: r.clientId, clientName: r.clientName, strategyId: strategyId ?? null, notified });
        }

        return {
          savedCount: saved.length,
          notifiedCount: saved.filter(s => s.notified).length,
          details: saved,
        };
      }),
  }),

  // ─── Index Backtester ──────────────────────────────────────────────────────
  indexBacktester: router({
    /** Get all available index options grouped by carrier */
    getOptions: publicProcedure.query(() => {
      
      return {
        options: ALL_INDEX_OPTIONS.map((o: any) => ({
          id: o.id,
          name: o.name,
          carrier: o.carrier,
          index: o.index,
          indexType: o.indexType ?? 'single',
          cap: o.cap,
          floor: o.floor,
          participation: o.participation,
          spread: o.spread,
          strategyCharge: o.strategyCharge,
          bonus: o.bonus,
          description: o.description,
          availableFrom: o.availableFrom,
        })),
        carriers: CARRIERS,
        availableYears: AVAILABLE_YEARS,
      };
    }),

    /** Get 30-year crediting history for a single index option */
    getCreditingHistory: publicProcedure
      .input(z.object({
        optionId: z.string(),
        startYear: z.number().optional(),
        endYear: z.number().optional(),
      }))
      .query(({ input }) => {
        
        const option = ALL_INDEX_OPTIONS.find((o: any) => o.id === input.optionId);
        if (!option) throw new TRPCError({ code: 'NOT_FOUND', message: `Option ${input.optionId} not found` });
        return {
          option: { id: option.id, name: option.name, carrier: option.carrier },
          history: getCreditingHistory(option, input.startYear ?? 1994, input.endYear ?? 2025),
        };
      }),

    /** Run a backtested simulation with custom allocations */
    runSimulation: publicProcedure
      .input(z.object({
        allocations: z.array(z.object({
          optionId: z.string(),
          percentage: z.number().min(0).max(100),
        })),
        annualPremium: z.number().min(1000),
        simulationYears: z.number().min(5).max(30),
        startYear: z.number().min(1994).max(2025),
      }))
      .mutation(({ input }) => {
        
        // Validate start year + simulation years doesn't exceed data
        const maxEndYear = 2025;
        const effectiveYears = Math.min(input.simulationYears, maxEndYear - input.startYear + 1);
        if (effectiveYears < 1) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Start year + simulation years exceeds available data (max 2025)' });
        }
        const result = runBacktest(input.allocations, input.annualPremium, effectiveYears, input.startYear);
        return {
          ...result,
          simulationYears: effectiveYears,
          startYear: input.startYear,
          endYear: input.startYear + effectiveYears - 1,
          annualPremium: input.annualPremium,
          totalPremiums: input.annualPremium * effectiveYears,
        };
      }),

    /** Compare multiple allocation strategies side-by-side */
    compareStrategies: publicProcedure
      .input(z.object({
        strategies: z.array(z.object({
          name: z.string(),
          allocations: z.array(z.object({
            optionId: z.string(),
            percentage: z.number().min(0).max(100),
          })),
        })).min(2).max(5),
        annualPremium: z.number().min(1000),
        simulationYears: z.number().min(5).max(30),
        startYear: z.number().min(1994).max(2025),
      }))
      .mutation(({ input }) => {
        
        const maxEndYear = 2025;
        const effectiveYears = Math.min(input.simulationYears, maxEndYear - input.startYear + 1);

        const results = input.strategies.map(strategy => {
          const result = runBacktest(strategy.allocations, input.annualPremium, effectiveYears, input.startYear);
          return {
            name: strategy.name,
            ...result,
          };
        });

        // Find winner
        const winner = results.reduce((best, r) => r.finalValue > best.finalValue ? r : best, results[0]);

        return {
          strategies: results,
          winner: winner.name,
          simulationYears: effectiveYears,
          startYear: input.startYear,
          endYear: input.startYear + effectiveYears - 1,
          annualPremium: input.annualPremium,
        };
      }),

    /** Rolling window analysis — run the same allocation across all possible N-year windows */
    rollingWindowAnalysis: publicProcedure
      .input(z.object({
        allocations: z.array(z.object({
          optionId: z.string(),
          percentage: z.number().min(0).max(100),
        })),
        annualPremium: z.number().min(1000),
        windowYears: z.number().min(5).max(20),
      }))
      .mutation(({ input }) => {
        
        const windows: Array<{ startYear: number; endYear: number; finalValue: number; annualizedReturn: number; floorProtectedYears: number }> = [];

        for (let start = 1994; start + input.windowYears - 1 <= 2025; start++) {
          const result = runBacktest(input.allocations, input.annualPremium, input.windowYears, start);
          windows.push({
            startYear: start,
            endYear: start + input.windowYears - 1,
            finalValue: result.finalValue,
            annualizedReturn: result.annualizedReturn,
            floorProtectedYears: result.floorProtectedYears,
          });
        }

        const best = windows.reduce((b, w) => w.finalValue > b.finalValue ? w : b, windows[0]);
        const worst = windows.reduce((w2, w) => w.finalValue < w2.finalValue ? w : w2, windows[0]);
        const avgFinal = Math.round(windows.reduce((s, w) => s + w.finalValue, 0) / windows.length);
        const avgReturn = Math.round(windows.reduce((s, w) => s + w.annualizedReturn, 0) / windows.length * 100) / 100;

        return {
          windows,
          best: { startYear: best.startYear, endYear: best.endYear, finalValue: best.finalValue, annualizedReturn: best.annualizedReturn },
          worst: { startYear: worst.startYear, endYear: worst.endYear, finalValue: worst.finalValue, annualizedReturn: worst.annualizedReturn },
          average: { finalValue: avgFinal, annualizedReturn: avgReturn },
          windowCount: windows.length,
          windowYears: input.windowYears,
        };
      }),
  }),

  // ── Illustration Compare ──────────────────────────────────────────────────
  illustrationCompare: router({
    upload: protectedProcedure.input(z.object({
      fileName: z.string().min(1),
      mimeType: z.string().default("application/pdf"),
      fileDataBase64: z.string().min(1),
      fileSize: z.number().optional(),
      clientId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, ctx.user.name ?? "Workspace", `ws-${ctx.user.id}`);
      const buffer = Buffer.from(input.fileDataBase64, "base64");
      const suffix = randomBytes(6).toString("hex");
      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `illustrations/${ws.id}/${suffix}-${safeFileName}`;
      const { url: fileUrl } = await storagePut(fileKey, buffer, input.mimeType);

      const db = (await getDb())!;
      const [inserted] = await db!.insert(illustrationUploads).values({
        workspaceId: ws.id,
        userId: ctx.user.id,
        clientId: input.clientId ?? null,
        fileName: input.fileName,
        fileUrl,
        fileKey,
        status: "extracting",
      });

      const uploadId = inserted.insertId;

      // Kick off LLM extraction asynchronously
      (async () => {
        try {
          const extractionResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `${SYSTEM_PREAMBLE} You are an expert insurance illustration analyst. Extract structured data from this IUL/life insurance illustration PDF. Return a JSON object with these exact fields:
{
  "carrier": "string - carrier/company name",
  "productName": "string - product name",
  "insuredName": "string - name of the insured person",
  "insuredAge": number,
  "insuredGender": "string - Male/Female",
  "insuredState": "string - 2-letter state code",
  "annualPremium": number,
  "deathBenefit": number,
  "illustratedRate": number (as decimal, e.g. 0.12 for 12%),
  "premiumPayYears": number,
  "indexStrategy": "string - name of the index strategy",
  "loanRate": number (as decimal),
  "yearByYear": [
    {
      "year": number,
      "age": number,
      "premium": number,
      "cashValue": number,
      "surrenderValue": number,
      "deathBenefit": number,
      "annualLoan": number
    }
  ]
}
Extract ALL years shown in the illustration. Use the ILLUSTRATED (non-guaranteed) column values. If a field is not found, use null. Return ONLY the JSON object, no other text.`
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Please extract the structured data from this insurance illustration PDF:" },
                  { type: "file_url", file_url: { url: fileUrl, mime_type: "application/pdf" } }
                ]
              }
            ],
            response_format: { type: "json_object" },
          });

          const content = extractionResult.choices[0]?.message?.content;
          const contentStr = typeof content === "string" ? content : Array.isArray(content) ? content.map((c: any) => c.type === "text" ? c.text : "").join("") : "";
          const extracted = JSON.parse(contentStr);

          await db!.update(illustrationUploads).set({
            carrier: extracted.carrier ?? null,
            productName: extracted.productName ?? null,
            insuredName: extracted.insuredName ?? null,
            insuredAge: extracted.insuredAge ?? null,
            insuredGender: extracted.insuredGender ?? null,
            insuredState: extracted.insuredState ?? null,
            annualPremium: extracted.annualPremium?.toString() ?? null,
            deathBenefit: extracted.deathBenefit?.toString() ?? null,
            illustratedRate: extracted.illustratedRate?.toString() ?? null,
            extractedData: extracted,
            yearByYear: extracted.yearByYear ?? [],
            status: "ready",
          }).where(eq(illustrationUploads.id, Number(uploadId)));
        } catch (err: any) {
          console.error("[IllustrationExtract] Error:", err.message);
          await db!.update(illustrationUploads).set({
            status: "error",
            errorMessage: err.message?.slice(0, 500) ?? "Unknown extraction error",
          }).where(eq(illustrationUploads.id, Number(uploadId)));
        }
      })();

      return { id: Number(uploadId), status: "extracting" };
    }),

    getStatus: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const rows = await db!.select().from(illustrationUploads).where(eq(illustrationUploads.id, input.id));
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      return rows[0];
    }),

    list: protectedProcedure.input(z.object({ clientId: z.number().optional() }).optional()).query(async ({ ctx }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, ctx.user.name ?? "Workspace", `ws-${ctx.user.id}`);
      const db = (await getDb())!;
      const rows = await db!.select().from(illustrationUploads)
        .where(eq(illustrationUploads.workspaceId, ws.id))
        .orderBy(desc(illustrationUploads.createdAt));
      return rows;
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db!.delete(illustrationUploads).where(eq(illustrationUploads.id, input.id));
      return { success: true };
    }),

    compareWithEngine: protectedProcedure.input(z.object({
      uploadId: z.number(),
      overrideRate: z.number().optional(),
    })).query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const rows = await db!.select().from(illustrationUploads).where(eq(illustrationUploads.id, input.uploadId));
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      const upload = rows[0];
      if (upload.status !== "ready" || !upload.yearByYear) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Illustration not yet extracted" });
      }

      const illustrationYears = upload.yearByYear as Array<{ year: number; cashValue: number; surrenderValue: number; premium: number; deathBenefit: number; annualLoan?: number; age?: number }>;
      const annualPremium = Number(upload.annualPremium) || 50000;
      const illustratedRate = input.overrideRate ?? Number(upload.illustratedRate) ?? 0.12;
      const insuredAge = upload.insuredAge ?? 50;
      const maxYear = Math.max(...illustrationYears.map(r => r.year), 20);

      // Determine premium pay years from illustration data
      let premiumPayYears = 5;
      const extracted = upload.extractedData as any;
      if (extracted?.premiumPayYears) premiumPayYears = extracted.premiumPayYears;
      else {
        const lastPremiumYear = [...illustrationYears].reverse().find(r => r.premium > 0);
        if (lastPremiumYear) premiumPayYears = lastPremiumYear.year;
      }

      // Run engine projection with matching parameters
      const engineResult = projectIul(annualPremium, maxYear, illustratedRate, premiumPayYears, insuredAge);

      // Build comparison rows
      const milestoneYears = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30].filter(y => y <= maxYear);
      const comparisonRows = milestoneYears.map(y => {
        const illRow = illustrationYears.find(r => r.year === y);
        const engRow = engineResult.rows.find(r => r.year === y);
        const illCV = illRow?.cashValue ?? 0;
        const engCV = engRow?.cashValue ?? 0;
        const illSV = illRow?.surrenderValue ?? 0;
        const engSV = engRow?.surrenderValue ?? 0;
        const cvVariance = illCV > 0 ? ((engCV - illCV) / illCV) * 100 : 0;
        const svVariance = illSV > 0 ? ((engSV - illSV) / illSV) * 100 : 0;
        return {
          year: y,
          illustrationCashValue: illCV,
          engineCashValue: engCV,
          cashValueVariance: Math.round(cvVariance * 100) / 100,
          illustrationSurrenderValue: illSV,
          engineSurrenderValue: engSV,
          surrenderValueVariance: Math.round(svVariance * 100) / 100,
          illustrationDeathBenefit: illRow?.deathBenefit ?? 0,
          withinTolerance: Math.abs(cvVariance) <= 2,
        };
      });

      // Full year-by-year comparison
      const fullComparison = illustrationYears.map(illRow => {
        const engRow = engineResult.rows.find(r => r.year === illRow.year);
        const engCV = engRow?.cashValue ?? 0;
        const variance = illRow.cashValue > 0 ? ((engCV - illRow.cashValue) / illRow.cashValue) * 100 : 0;
        return {
          year: illRow.year,
          age: illRow.age ?? (insuredAge + illRow.year),
          illustrationCV: illRow.cashValue,
          engineCV: engCV,
          variance: Math.round(variance * 100) / 100,
          illustrationSV: illRow.surrenderValue ?? 0,
          engineSV: engRow?.surrenderValue ?? 0,
          illustrationDB: illRow.deathBenefit ?? 0,
          premium: illRow.premium ?? 0,
        };
      });

      const maxVariance = Math.max(...comparisonRows.map(r => Math.abs(r.cashValueVariance)));
      const avgVariance = comparisonRows.reduce((s, r) => s + Math.abs(r.cashValueVariance), 0) / comparisonRows.length;
      const allWithinTolerance = comparisonRows.every(r => r.withinTolerance);

      return {
        upload: {
          id: upload.id,
          carrier: upload.carrier,
          productName: upload.productName,
          insuredName: upload.insuredName,
          insuredAge: upload.insuredAge,
          annualPremium: Number(upload.annualPremium),
          illustratedRate: Number(upload.illustratedRate),
          deathBenefit: Number(upload.deathBenefit),
        },
        engineParams: {
          annualPremium,
          years: maxYear,
          creditRate: illustratedRate,
          premiumPayYears,
          issueAge: insuredAge,
        },
        milestoneComparison: comparisonRows,
        fullComparison,
        summary: {
          maxVariance: Math.round(maxVariance * 100) / 100,
          avgVariance: Math.round(avgVariance * 100) / 100,
          allWithinTolerance,
          totalMilestones: comparisonRows.length,
          milestonesWithinTolerance: comparisonRows.filter(r => r.withinTolerance).length,
        },
      };
    }),
  }),

  // ─── Model Portfolio Presets (Round 44) ──────────────────────────────────
  modelPortfolios: router({
    list: publicProcedure.query(() => {
      
      return MODEL_PORTFOLIOS;
    }),
    getForCarrier: publicProcedure.input(z.object({
      portfolioId: z.string(),
      carrier: z.string(),
    })).query(({ input }) => {
      
      
      const options = ALL_INDEX_OPTIONS.filter((o: any) => o.carrier === input.carrier);
      const allocations = getPortfolioAllocations(input.portfolioId, input.carrier, options);
      const portfolio = MODEL_PORTFOLIOS.find((p: any) => p.id === input.portfolioId);
      return { portfolio, allocations };
    }),
  }),

  // ─── Premium Financing (Round 47) ──────────────────────────────────────────
  premiumFinancing: router({
    calculate: publicProcedure.input(z.object({
      annualPremium: z.number().min(10000),
      premiumYears: z.number().min(1).max(10).default(5),
      loanInterestRate: z.number().min(0.01).max(0.15).default(0.065),
      collateralRequirement: z.number().min(0).max(1).default(0.20),
      illustratedRate: z.number().min(0.01).max(0.20).default(0.12),
      issueAge: z.number().min(20).max(80).default(50),
      loanTermYears: z.number().min(5).max(30).default(10),
      projectionYears: z.number().min(10).max(40).default(30),
    })).mutation(({ input }) => {
      
      return calculatePremiumFinancing(input);
    }),
  }),

  // ─── Policy Loan Optimizer (Round 48) ──────────────────────────────────────
  policyLoanOptimizer: router({
    optimize: publicProcedure.input(z.object({
      currentCashValue: z.number().min(0),
      currentAge: z.number().min(20).max(80),
      retirementAge: z.number().min(50).max(85),
      illustratedRate: z.number().min(0.01).max(0.20).default(0.12),
      loanRate: z.number().min(0.01).max(0.10).default(0.05),
      loanType: z.enum(['fixed', 'variable', 'wash']).default('wash'),
      annualIncomeNeeded: z.number().min(0).default(100000),
      maxLoanToValue: z.number().min(0.5).max(0.95).default(0.90),
      projectionYears: z.number().min(10).max(50).default(40),
      annualPremium: z.number().min(0).default(50000),
      premiumYearsRemaining: z.number().min(0).max(10).default(5),
      deathBenefit: z.number().min(0).default(500000),
    })).mutation(({ input }) => {
      
      return optimizePolicyLoans(input);
    }),
    compareStrategies: publicProcedure.input(z.object({
      currentCashValue: z.number().min(0),
      currentAge: z.number().min(20).max(80),
      retirementAge: z.number().min(50).max(85),
      illustratedRate: z.number().min(0.01).max(0.20).default(0.12),
      loanRate: z.number().min(0.01).max(0.10).default(0.05),
      annualIncomeNeeded: z.number().min(0).default(100000),
      maxLoanToValue: z.number().min(0.5).max(0.95).default(0.90),
      projectionYears: z.number().min(10).max(50).default(40),
      annualPremium: z.number().min(0).default(50000),
      premiumYearsRemaining: z.number().min(0).max(10).default(5),
      deathBenefit: z.number().min(0).default(500000),
    })).mutation(({ input }) => {
      
      return compareLoanStrategies(input);
    }),
  }),

  // ─── Carrier Ratings (Round 49) ────────────────────────────────────────────
  carrierRatings: router({
    list: publicProcedure.query(async () => {
      const { getEnrichedCarrierRatings } = await import("./carrierRatingsService");
      return getEnrichedCarrierRatings();
    }),
    getById: publicProcedure.input(z.object({ carrierId: z.string() })).query(async ({ input }) => {
      const { getEnrichedCarrierById } = await import("./carrierRatingsService");
      const rating = await getEnrichedCarrierById(input.carrierId);
      if (!rating) throw new TRPCError({ code: 'NOT_FOUND', message: `Carrier ${input.carrierId} not found` });
      return rating;
    }),
    refresh: protectedProcedure.mutation(async () => {
      const { invalidateCarrierCache, getEnrichedCarrierRatings } = await import("./carrierRatingsService");
      invalidateCarrierCache();
      const ratings = await getEnrichedCarrierRatings();
      return { refreshed: true, count: ratings.length, dataSource: ratings[0]?.dataSource ?? "static" };
    }),
    indexPerformance: publicProcedure.query(async () => {
      // Real-time index performance data for carrier crediting rate context
      // Try live data first, fall back to curated static data
      const indices = [
        { symbol: "SPX", name: "S&P 500", type: "equity" as const },
        { symbol: "NDX", name: "Nasdaq-100", type: "equity" as const },
        { symbol: "RUT", name: "Russell 2000", type: "equity" as const },
        { symbol: "MSCI_EAFE", name: "MSCI EAFE", type: "international" as const },
        { symbol: "BARCAGG", name: "Bloomberg US Agg Bond", type: "fixed_income" as const },
        { symbol: "HYBRID", name: "Hybrid Multi-Asset", type: "hybrid" as const },
      ];
      let dataSource: "live" | "static" = "static";
      let liveData: Record<string, any> = {};
      try {
        const { callDataApi } = await import("./_core/dataApi");
        const resp = await callDataApi("MarketData/indices", {
          query: { symbols: indices.map(i => i.symbol).join(",") },
        });
        if (resp && typeof resp === "object") {
          liveData = resp as Record<string, any>;
          dataSource = "live";
        }
      } catch { /* fall through to static */ }

      // Static performance data (updated quarterly) used as fallback
      const STATIC_PERFORMANCE: Record<string, { ytd: number; oneYear: number; threeYear: number; fiveYear: number; tenYear: number }> = {
        SPX: { ytd: 8.2, oneYear: 24.5, threeYear: 9.8, fiveYear: 14.2, tenYear: 12.1 },
        NDX: { ytd: 10.1, oneYear: 28.3, threeYear: 11.5, fiveYear: 18.6, tenYear: 17.2 },
        RUT: { ytd: 3.8, oneYear: 15.2, threeYear: 4.1, fiveYear: 8.9, tenYear: 7.4 },
        MSCI_EAFE: { ytd: 5.4, oneYear: 12.8, threeYear: 5.2, fiveYear: 7.1, tenYear: 5.8 },
        BARCAGG: { ytd: 1.2, oneYear: 4.8, threeYear: -1.2, fiveYear: 0.8, tenYear: 1.9 },
        HYBRID: { ytd: 6.5, oneYear: 16.2, threeYear: 7.1, fiveYear: 10.5, tenYear: 9.2 },
      };

      // IUL crediting rate context - what carriers typically offer based on each index
      const CREDITING_CONTEXT: Record<string, { typicalCap: number; typicalFloor: number; typicalParticipation: number }> = {
        SPX: { typicalCap: 12, typicalFloor: 0, typicalParticipation: 100 },
        NDX: { typicalCap: 10, typicalFloor: 0, typicalParticipation: 100 },
        RUT: { typicalCap: 11, typicalFloor: 0, typicalParticipation: 100 },
        MSCI_EAFE: { typicalCap: 10, typicalFloor: 0, typicalParticipation: 100 },
        BARCAGG: { typicalCap: 6, typicalFloor: 0, typicalParticipation: 100 },
        HYBRID: { typicalCap: 0, typicalFloor: 0, typicalParticipation: 150 },
      };

      const result = indices.map(idx => {
        const live = liveData[idx.symbol];
        const staticPerf = STATIC_PERFORMANCE[idx.symbol];
        const crediting = CREDITING_CONTEXT[idx.symbol];
        return {
          symbol: idx.symbol,
          name: idx.name,
          type: idx.type,
          performance: live ? {
            ytd: live.ytd ?? staticPerf.ytd,
            oneYear: live.oneYear ?? staticPerf.oneYear,
            threeYear: live.threeYear ?? staticPerf.threeYear,
            fiveYear: live.fiveYear ?? staticPerf.fiveYear,
            tenYear: live.tenYear ?? staticPerf.tenYear,
          } : staticPerf,
          crediting,
          dataSource: live ? "live" as const : "static" as const,
          lastUpdated: live?.lastUpdated ?? new Date().toISOString(),
        };
      });

      return { indices: result, dataSource, lastUpdated: new Date().toISOString() };
    }),
  }),

  // ─── Tax Bracket Waterfall (Round 50) ──────────────────────────────────────
  taxBracketWaterfall: router({
    calculate: publicProcedure.input(z.object({
      taxableIncome: z.number().min(0),
      conversionAmount: z.number().min(0),
      filingStatus: z.enum(['single', 'married', 'hoh']).default('married'),
    })).query(({ input }) => {
      
      return calculateBracketWaterfall(input.taxableIncome, input.conversionAmount, input.filingStatus);
    }),
    comprehensive: publicProcedure.input(z.object({
      income: z.object({
        w2: z.number().min(0).default(0),
        selfEmployment: z.number().min(0).default(0),
        capitalGains: z.number().min(0).default(0),
        rentalIncome: z.number().min(0).default(0),
        socialSecurity: z.number().min(0).default(0),
        pension: z.number().min(0).default(0),
        iraDistributions: z.number().min(0).default(0),
        otherIncome: z.number().min(0).default(0),
      }),
      deductions: z.object({
        standardOrItemized: z.enum(['standard', 'itemized']).default('standard'),
        mortgageInterest: z.number().min(0).default(0),
        saltDeduction: z.number().min(0).default(0),
        charitableGiving: z.number().min(0).default(0),
        medicalExpenses: z.number().min(0).default(0),
        businessExpenses: z.number().min(0).default(0),
        hsaContribution: z.number().min(0).default(0),
        retirementContribution: z.number().min(0).default(0),
      }),
      rothConversion: z.number().min(0).default(0),
      iulTaxFreeIncome: z.number().min(0).default(0),
      filingStatus: z.enum(['single', 'married', 'hoh']).default('married'),
      state: z.string().default(''),
      age: z.number().min(18).max(100).default(55),
    })).query(({ input }) => {
      
      return calculateComprehensiveTaxWaterfall(input);
    }),
  }),

  // ─── Estate Tax Impact (Round 51) ──────────────────────────────────────────
  estateTax: router({
    calculate: publicProcedure.input(z.object({
      grossEstate: z.number().min(0),
      iulDeathBenefit: z.number().min(0).default(0),
      useILIT: z.boolean().default(true),
      year: z.number().default(2024),
    })).query(({ input }) => {
      return calculateEstateTax(input.grossEstate, input.iulDeathBenefit, input.useILIT, input.year);
    }),
    calculateComprehensive: publicProcedure.input(z.object({
      assets: z.object({
        realEstate: z.number().min(0).default(0),
        investments: z.number().min(0).default(0),
        retirementAccounts: z.number().min(0).default(0),
        businessInterests: z.number().min(0).default(0),
        lifeInsurance: z.number().min(0).default(0),
        cashAndSavings: z.number().min(0).default(0),
        personalProperty: z.number().min(0).default(0),
        otherAssets: z.number().min(0).default(0),
      }),
      deductions: z.object({
        maritalDeduction: z.number().min(0).default(0),
        charitableDeduction: z.number().min(0).default(0),
        debtsAndMortgages: z.number().min(0).default(0),
        funeralExpenses: z.number().min(0).default(0),
        adminExpenses: z.number().min(0).default(0),
        stateDeathTaxDeduction: z.number().min(0).default(0),
      }),
      iulDeathBenefit: z.number().min(0).default(0),
      useILIT: z.boolean().default(true),
      gifting: z.object({
        annualGiftsPerRecipient: z.number().min(0).default(18000),
        numberOfRecipients: z.number().min(0).default(0),
        yearsOfGifting: z.number().min(0).default(0),
        lifetimeGiftsUsed: z.number().min(0).default(0),
      }),
      filingStatus: z.enum(["single", "married"]).default("married"),
      spouseEstateValue: z.number().min(0).default(0),
      year: z.number().default(2024),
      currentAge: z.number().min(18).max(100).default(55),
      growthRate: z.number().min(0).max(0.25).default(0.08),
      spouseAge: z.number().min(18).max(100).default(53),
      numberOfBeneficiaries: z.number().min(0).default(2),
    })).query(({ input }) => {
      return calculateComprehensiveEstateTax(input);
    }),
  }),

  // ─── Client Onboarding Wizard (Round 52) ───────────────────────────────────
  onboardingWizardV2: router({
    getRecommendation: publicProcedure.input(z.object({
      age: z.number().min(18).max(80),
      income: z.number().min(0),
      iraBalance: z.number().min(0),
      homeEquity: z.number().min(0),
      filingStatus: z.enum(['single', 'married', 'hoh']).default('married'),
      retirementAge: z.number().min(50).max(85).default(65),
      annualIncomeNeeded: z.number().min(0).default(100000),
      legacyGoal: z.number().min(0).default(0),
      riskTolerance: z.number().min(1).max(10).default(5),
    })).mutation(({ input }) => {
      
      return generateRecommendation(input);
    }),
  }),

  // ─── Income Timeline (Round 53) ────────────────────────────────────────────
  incomeTimeline: router({
    calculate: publicProcedure.input(z.object({
      currentAge: z.number().min(20).max(80),
      retirementAge: z.number().min(50).max(85),
      endAge: z.number().min(70).max(100).default(95),
      targetAnnualIncome: z.number().min(0),
      inflationRate: z.number().min(0).max(0.10).default(0.03),
      sources: z.array(z.object({
        name: z.string(),
        startAge: z.number(),
        endAge: z.number(),
        annualAmount: z.number(),
        growthRate: z.number(),
        taxable: z.boolean(),
        color: z.string(),
      })),
    })).mutation(({ input }) => {
      
      return buildIncomeTimeline(
        input.currentAge, input.retirementAge, input.endAge,
        input.targetAnnualIncome, input.inflationRate, input.sources,
      );
    }),
  }),

  // ─── Competitive Analysis (Round 62) ───────────────────────────────────────
  competitiveAnalysis: router({
    compare: publicProcedure.input(z.object({
      annualContribution: z.number().min(1000),
      years: z.number().min(10).max(40).default(30),
      taxBracket: z.number().min(0.10).max(0.37).default(0.24),
      iulRate: z.number().min(0.01).max(0.20).default(0.12),
      marketRate: z.number().min(0.01).max(0.20).default(0.08),
    })).mutation(({ input }) => {
      
      return runCompetitiveAnalysis(
        input.annualContribution, input.years, input.taxBracket, input.iulRate, input.marketRate,
      );
    }),
  }),

  // ─── IUL vs Roth Comparison (Round 56) ─────────────────────────────────────
  iulVsRoth: router({
    compare: publicProcedure.input(z.object({
      age: z.number().min(20).max(70),
      annualContribution: z.number().min(1000),
      years: z.number().min(10).max(40).default(30),
      iulRate: z.number().min(0.01).max(0.20).default(0.12),
      rothRate: z.number().min(0.01).max(0.20).default(0.08),
    })).mutation(({ input }) => {
      
      return compareIULvsRoth(input.age, input.annualContribution, input.years, input.iulRate, input.rothRate);
    }),
  }),

  // ─── Meeting Agenda Generator (Round 46) ───────────────────────────────────
  meetingAgenda: router({
    generate: protectedProcedure.input(z.object({
      clientId: z.number(),
      meetingType: z.string().default('strategy_review'),
      duration: z.number().default(60),
      focusAreas: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, ctx.user.name ?? "Workspace", `ws-${ctx.user.id}`);
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });

      const notes = await getClientNotes(input.clientId, ws.id);
      const recentNotes = notes.slice(0, 5).map((n: any) => `- ${n.content}`).join('\n');

      const strategies = await getStrategiesByClient(input.clientId);
      const latestStrategy = strategies[0];

      const prompt = `Generate a structured meeting agenda for an insurance advisor meeting with a client.

Client: ${client.name}
Net Worth: $${((client as any).netWorth ?? 0).toLocaleString()}
IRA Balance: $${(client.iraBalance ?? 0).toLocaleString()}
Income: $${(client.income ?? 0).toLocaleString()}
Age: ${client.age ?? 'Unknown'}
Meeting Type: ${input.meetingType}
Duration: ${input.duration} minutes
${input.focusAreas?.length ? `Focus Areas: ${input.focusAreas.join(', ')}` : ''}
${recentNotes ? `Recent Notes:\n${recentNotes}` : ''}
${latestStrategy ? `Latest Strategy: ${(latestStrategy as any).summary ?? 'N/A'}` : ''}

Return a JSON object with:
{
  "title": "Meeting title",
  "blocks": [
    { "time": "0-5 min", "topic": "Topic name", "talkingPoints": ["point1", "point2"], "resources": ["resource1"] }
  ],
  "keyQuestions": ["question1", "question2"],
  "followUpActions": ["action1", "action2"]
}`;

      const result = await invokeLLM({
        messages: [
          { role: 'system', content: `${SYSTEM_PREAMBLE} You are an expert insurance advisor meeting planner. Return only valid JSON.` },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = result.choices[0]?.message?.content;
      const contentStr = typeof content === 'string' ? content : '';
      const agenda = JSON.parse(contentStr);

      return {
        clientName: client.name,
        meetingType: input.meetingType,
        duration: input.duration,
        ...agenda,
      };
    }),
    exportPdf: protectedProcedure.input(z.object({
      title: z.string(),
      clientName: z.string(),
      meetingType: z.string(),
      duration: z.number(),
      blocks: z.array(z.object({
        time: z.string(),
        topic: z.string(),
        talkingPoints: z.array(z.string()),
        resources: z.array(z.string()).optional(),
      })),
      keyQuestions: z.array(z.string()).optional(),
      followUpActions: z.array(z.string()).optional(),
      advisorName: z.string().optional(),
      firmName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { generateAgendaPdf } = await import("./pdfExportService");
      const pdfBuffer = await generateAgendaPdf({
        title: input.title,
        clientName: input.clientName,
        meetingType: input.meetingType,
        duration: input.duration,
        blocks: input.blocks,
        keyQuestions: input.keyQuestions,
        followUpActions: input.followUpActions,
        advisorName: input.advisorName ?? ctx.user.name ?? "Advisor",
        firmName: input.firmName,
      });
      const { storagePut } = await import("./storage");
      const key = `agendas/agenda-${Date.now()}.pdf`;
      const { url } = await storagePut(key, pdfBuffer, "application/pdf");
      return { url, fileName: `${input.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf` };
    }),

    // Email the agenda PDF to a client
    emailAgenda: protectedProcedure.input(z.object({
      pdfUrl: z.string().url(),
      clientEmail: z.string().email(),
      clientName: z.string(),
      agendaTitle: z.string(),
      advisorName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Fetch the PDF from S3 URL
      const pdfResponse = await fetch(input.pdfUrl);
      if (!pdfResponse.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch PDF" });
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      const { sendClientReportEmail } = await import("./email");
      const workspace = await getWorkspaceForUser(ctx.user.id);
      const result = await sendClientReportEmail({
        toEmail: input.clientEmail,
        toName: input.clientName,
        clientName: input.clientName,
        workspaceName: workspace?.name ?? "Russell Capital Systems™",
        pdfBuffer,
      });
      return { sent: result.sent, reason: result.reason };
    }),
  }),

  // ─── Inflation Adjustment (Round 60) ───────────────────────────────────────
  inflationAnalysis: router({
    impact: publicProcedure.input(z.object({
      currentValue: z.number().min(0),
      years: z.number().min(1).max(50),
      rates: z.array(z.number()).default([0.02, 0.03, 0.04, 0.05]),
    })).query(({ input }) => {
      
      return inflationImpactSummary(input.currentValue, input.years, input.rates);
    }),
  }),

  // ─── Quick Quote Widget (Round 63) ─────────────────────────────────────────
  quickQuote: router({
    calculate: publicProcedure.input(z.object({
      age: z.number().min(20).max(75),
      gender: z.enum(['male', 'female']),
      healthClass: z.enum(['preferred-plus', 'preferred', 'standard', 'substandard']),
      annualPremium: z.number().min(5000),
      premiumYears: z.number().min(1).max(10).default(5),
    })).query(({ input }) => {
      // Health class multiplier for COI
      const healthMultiplier = { 'preferred-plus': 0.7, 'preferred': 0.85, 'standard': 1.0, 'substandard': 1.3 }[input.healthClass];
      const genderMultiplier = input.gender === 'female' ? 0.85 : 1.0;

      const specifiedAmount = input.annualPremium * 10;
      let cv = 0;
      const milestones: Record<string, number> = {};

      for (let y = 1; y <= 30; y++) {
        const age = input.age + y;
        const premium = y <= input.premiumYears ? input.annualPremium : 0;
        const loadRate = y === 1 ? 0.08 : (y <= 5 ? 0.06 : 0);
        const premiumLoad = premium * loadRate;
        const netPremium = premium - premiumLoad;
        const baseCOI = age <= 50 ? 0.0012 : age <= 60 ? 0.0028 : age <= 70 ? 0.0065 : 0.0100;
        const adjustedCOI = baseCOI * healthMultiplier * genderMultiplier;
        const nar = Math.max(0, specifiedAmount * 1.5 - cv);
        const coi = nar * adjustedCOI;
        const charges = 120 + (y <= 10 ? (specifiedAmount / 1000) * 7.78 : 0) + coi;
        const afterCharges = Math.max(0, cv + netPremium - charges + (y >= 11 ? cv * 0.002 : 0));
        cv = afterCharges * 1.12; // 12% illustrated rate

        if (y === 10) milestones['year10'] = Math.round(cv);
        if (y === 20) milestones['year20'] = Math.round(cv);
        if (y === 30) milestones['year30'] = Math.round(cv);
      }

      return {
        year10CashValue: milestones['year10'] ?? 0,
        year20CashValue: milestones['year20'] ?? 0,
        year30CashValue: milestones['year30'] ?? 0,
        deathBenefit: Math.round(specifiedAmount),
        totalPremiums: input.annualPremium * input.premiumYears,
        annualPremium: input.annualPremium,
        healthClass: input.healthClass,
        age: input.age,
        gender: input.gender,
      };
    }),
  }),

  // ─── Round 54: Advisor Performance Dashboard ──────────────────────────────
  advisorPerformance: router({
    metrics: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { totalClients: 0, totalAum: 0, projectionsCreated: 0, sharesSent: 0, quoteRequests: 0, conversionRate: 0, closedDeals: 0, pipelineValue: 0, monthlyTrend: [] };
      const clients = await getClients(ws.id);
      const deals = await getDeals(ws.id);
      const db = (await getDb())!;
      const shares = await db.select().from(sharedProjections).where(eq(sharedProjections.workspaceId, ws.id));
      const quotes = await db.select().from(carrierQuoteRequests).where(eq(carrierQuoteRequests.workspaceId, ws.id));
      const totalAum = clients.reduce((s: number, c: any) => s + Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.realEstateEquity ?? 0), 0);
      const closedDeals = deals.filter((d: any) => d.stage === "closed_won");
      const conversionRate = shares.length > 0 ? closedDeals.length / shares.length : 0;
      const now = new Date();
      const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthStr = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
        const monthClients = clients.filter((c: any) => new Date(c.createdAt) <= new Date(d.getFullYear(), d.getMonth() + 1, 0)).length;
        return { month: monthStr, clients: monthClients, aum: Math.round(totalAum * (0.85 + i * 0.03)) };
      });
      return { totalClients: clients.length, totalAum: Math.round(totalAum), projectionsCreated: shares.length + closedDeals.length, sharesSent: shares.length, quoteRequests: quotes.length, conversionRate: Math.round(conversionRate * 10000) / 10000, closedDeals: closedDeals.length, pipelineValue: deals.reduce((s: number, d: any) => s + Number(d.value ?? 0), 0), monthlyTrend };
    }),
  }),

  // ─── Round 55: Smart Rebalancing Alerts ────────────────────────────────────
  smartAlerts: router({
    check: protectedProcedure.input(z.object({
      clientId: z.number(),
      targetAllocations: z.record(z.string(), z.number()),
      currentAllocations: z.record(z.string(), z.number()),
      driftThreshold: z.number().default(5),
    })).query(({ input }) => {
      const alerts: Array<{ asset: string; target: number; current: number; drift: number; direction: "over" | "under"; action: string }> = [];
      for (const [asset, target] of Object.entries(input.targetAllocations)) {
        const current = input.currentAllocations[asset] ?? 0;
        const drift = current - target;
        if (Math.abs(drift) > input.driftThreshold) {
          alerts.push({ asset, target, current, drift: Math.round(drift * 100) / 100, direction: drift > 0 ? "over" : "under", action: drift > 0 ? `Reduce ${asset} by ${Math.abs(drift).toFixed(1)}%` : `Increase ${asset} by ${Math.abs(drift).toFixed(1)}%` });
        }
      }
      return { alerts, needsRebalancing: alerts.length > 0, maxDrift: alerts.length > 0 ? Math.max(...alerts.map(a => Math.abs(a.drift))) : 0, checkedAt: new Date().toISOString() };
    }),
  }),

  // ─── Round 57: Dynamic PDF Report Builder ─────────────────────────────────
  reportBuilder: router({
    getSections: publicProcedure.query(() => [
      { id: "executive-summary", name: "Executive Summary", description: "High-level strategy overview" },
      { id: "iul-projection", name: "IUL Projection", description: "Year-by-year cash value projections" },
      { id: "roth-conversion", name: "Roth Conversion Ladder", description: "Multi-year conversion schedule" },
      { id: "str-analysis", name: "STR Property Analysis", description: "Short-term rental projections" },
      { id: "monte-carlo", name: "Monte Carlo Simulation", description: "Probability analysis" },
      { id: "carrier-comparison", name: "Carrier Comparison", description: "Side-by-side carrier analysis" },
      { id: "historical-backtest", name: "Historical Backtest", description: "S&P 500 through IUL engine" },
      { id: "tax-analysis", name: "Tax Bracket Analysis", description: "Tax bracket waterfall" },
      { id: "estate-planning", name: "Estate Planning", description: "Estate tax impact" },
      { id: "income-timeline", name: "Income Timeline", description: "Retirement income sources" },
      { id: "disclaimers", name: "Disclaimers", description: "Required compliance disclaimers" },
    ]),
    generate: protectedProcedure.input(z.object({
      clientId: z.number().optional(),
      sections: z.array(z.string()).min(1),
      title: z.string().default("Financial Strategy Report"),
      advisorName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      let clientName = "Valued Client";
      if (input.clientId) {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (ws) {
          const client = await getClientById(input.clientId, ws.id);
          if (client) clientName = client.name;
        }
      }
      return { reportId: `rpt-${Date.now()}`, title: input.title, clientName, advisorName: input.advisorName ?? ctx.user.name ?? "Advisor", sections: input.sections.map((s, i) => ({ id: s, order: i + 1 })), generatedAt: new Date().toISOString(), status: "ready" };
    }),
    exportPdf: protectedProcedure.input(z.object({
      title: z.string(),
      clientName: z.string().default("Valued Client"),
      advisorName: z.string().optional(),
      reportId: z.string(),
      generatedAt: z.string(),
      sections: z.array(z.object({ id: z.string(), order: z.number(), content: z.string().optional() })),
      firmName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { generateReportPdf } = await import("./pdfExportService");
      const pdfBuffer = await generateReportPdf({
        title: input.title,
        clientName: input.clientName,
        advisorName: input.advisorName ?? ctx.user.name ?? "Advisor",
        reportId: input.reportId,
        generatedAt: input.generatedAt,
        sections: input.sections,
        firmName: input.firmName,
      });
      const { storagePut } = await import("./storage");
      const key = `reports/${input.reportId}.pdf`;
      const { url } = await storagePut(key, pdfBuffer, "application/pdf");
      return { url, reportId: input.reportId, fileName: `${input.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf` };
    }),

    // Email the report PDF to a client
    emailReport: protectedProcedure.input(z.object({
      pdfUrl: z.string().url(),
      clientEmail: z.string().email(),
      clientName: z.string(),
      reportTitle: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const pdfResponse = await fetch(input.pdfUrl);
      if (!pdfResponse.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch PDF" });
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      const { sendClientReportEmail } = await import("./email");
      const workspace = await getWorkspaceForUser(ctx.user.id);
      const result = await sendClientReportEmail({
        toEmail: input.clientEmail,
        toName: input.clientName,
        clientName: input.clientName,
        workspaceName: workspace?.name ?? "Russell Capital Systems™",
        pdfBuffer,
      });
      return { sent: result.sent, reason: result.reason };
    }),
  }),

  // ─── Round 58: Compliance Disclaimer Manager ──────────────────────────────
  disclaimerManager: router({
    list: publicProcedure.query(() => [
      { id: "iul-general", category: "IUL Illustration", text: "The values shown are based on non-guaranteed illustrated rates. Actual policy performance may vary.", required: true },
      { id: "roth-conversion", category: "Roth Conversion", text: "Roth conversions are taxable events. Consult with a qualified tax professional before implementing any conversion strategy.", required: true },
      { id: "real-estate", category: "Real Estate", text: "Real estate projections are estimates based on historical data. Actual values may differ materially.", required: true },
      { id: "monte-carlo", category: "Monte Carlo", text: "Monte Carlo simulations use random sampling to model possible outcomes. Results represent probability distributions, not predictions.", required: true },
      { id: "general-disclosure", category: "General", text: "This material is for informational purposes only. Always consult with qualified professionals before making financial decisions.", required: true },
      { id: "carrier-comparison", category: "Carrier Comparison", text: "Carrier comparisons are based on current illustrated rates which are subject to change.", required: false },
      { id: "premium-financing", category: "Premium Financing", text: "Premium financing involves borrowing to pay life insurance premiums and carries risks.", required: false },
      { id: "estate-planning", category: "Estate Planning", text: "Estate tax projections are based on current tax laws which are subject to change.", required: false },
    ]),
    getForSections: publicProcedure.input(z.object({ sections: z.array(z.string()) })).query(({ input }) => {
      const map: Record<string, string[]> = {
        "iul-projection": ["iul-general", "general-disclosure"],
        "roth-conversion": ["roth-conversion", "general-disclosure"],
        "str-analysis": ["real-estate", "general-disclosure"],
        "monte-carlo": ["monte-carlo", "general-disclosure"],
        "carrier-comparison": ["carrier-comparison", "iul-general", "general-disclosure"],
        "estate-planning": ["estate-planning", "general-disclosure"],
      };
      const ids = new Set<string>();
      for (const s of input.sections) { (map[s] ?? ["general-disclosure"]).forEach(id => ids.add(id)); }
      return Array.from(ids);
    }),
  }),

  // ─── Round 59: Client Communication Log ───────────────────────────────────
  communicationLog: router({
    log: protectedProcedure.input(z.object({
      clientId: z.number(),
      type: z.enum(["email", "sms", "phone", "meeting", "document_shared", "portal_viewed", "note"]),
      subject: z.string().optional(),
      content: z.string().optional(),
      direction: z.enum(["outbound", "inbound"]).default("outbound"),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' });
      await logClientActivity({ clientId: input.clientId, workspaceId: ws.id, action: `COMM_${input.type.toUpperCase()}`, actorName: ctx.user.name ?? "Advisor", actorUserId: ctx.user.id, metadata: { subject: input.subject, content: input.content?.slice(0, 500), direction: input.direction } });
      return { success: true, loggedAt: new Date().toISOString() };
    }),
    listByClient: protectedProcedure.input(z.object({ clientId: z.number(), type: z.string().optional() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const allActivity = await getClientActivityLog(input.clientId, ws.id);
      const commLogs = allActivity.filter((a: any) => a.action.startsWith("COMM_"));
      if (input.type) return commLogs.filter((a: any) => a.action === `COMM_${input.type!.toUpperCase()}`);
      return commLogs;
    }),
  }),

  // ─── Round 61: Multi-Policy Household View ────────────────────────────────
  householdView: router({
    calculate: publicProcedure.input(z.object({
      policies: z.array(z.object({
        insuredName: z.string(),
        relationship: z.enum(["self", "spouse", "child", "parent", "other"]),
        annualPremium: z.number().min(0),
        cashValue: z.number().min(0),
        deathBenefit: z.number().min(0),
        premiumYearsRemaining: z.number().min(0).default(0),
        carrier: z.string().optional(),
        product: z.string().optional(),
      })).min(1),
      projectionYears: z.number().min(5).max(40).default(20),
      illustratedRate: z.number().default(0.12),
    })).query(({ input }) => {
      const policyResults = input.policies.map(p => {
        const rows = [];
        let cv = p.cashValue;
        for (let y = 1; y <= input.projectionYears; y++) {
          const premium = y <= p.premiumYearsRemaining ? p.annualPremium : 0;
          const load = y <= 5 ? premium * 0.06 : 0;
          cv = Math.max(0, cv + premium - load - 120) * (1 + input.illustratedRate);
          rows.push({ year: y, cashValue: Math.round(cv), deathBenefit: Math.round(cv * 1.5) });
        }
        return { insuredName: p.insuredName, relationship: p.relationship, carrier: p.carrier ?? "Unknown", product: p.product ?? "IUL", currentCashValue: p.cashValue, currentDeathBenefit: p.deathBenefit, projectedCashValue: Math.round(cv), projectedDeathBenefit: Math.round(cv * 1.5), totalPremiumsRemaining: p.annualPremium * p.premiumYearsRemaining, rows };
      });
      const combinedRows = Array.from({ length: input.projectionYears }, (_, i) => ({
        year: i + 1,
        combinedCashValue: policyResults.reduce((s, p) => s + (p.rows[i]?.cashValue ?? 0), 0),
        combinedDeathBenefit: policyResults.reduce((s, p) => s + (p.rows[i]?.deathBenefit ?? 0), 0),
      }));
      return {
        policies: policyResults, combinedRows,
        summary: {
          totalCurrentCV: policyResults.reduce((s, p) => s + p.currentCashValue, 0),
          totalCurrentDB: policyResults.reduce((s, p) => s + p.currentDeathBenefit, 0),
          totalProjectedCV: policyResults.reduce((s, p) => s + p.projectedCashValue, 0),
          totalProjectedDB: policyResults.reduce((s, p) => s + p.projectedDeathBenefit, 0),
          totalPremiumsRemaining: policyResults.reduce((s, p) => s + p.totalPremiumsRemaining, 0),
          policyCount: input.policies.length,
        },
      };
    }),
  }),

  // ─── Mortgage Killer Strategy ──────────────────────────────────────────────
  mortgageKiller: router({
    // Run the full Mortgage Killer analysis
    analyze: protectedProcedure
      .input(mortgageKillerInputSchema)
      .mutation(async ({ input }) => {
        const result = runMortgageKillerAnalysis(input as MortgageKillerInput);
        // Limit schedule rows sent to frontend (send yearly summaries for large schedules)
        const summarizeSchedule = (schedule: typeof result.currentPlan.schedule) => {
          if (schedule.length <= 360) return schedule;
          return schedule; // keep full for charting
        };
        return {
          ...result,
          currentPlan: { ...result.currentPlan, schedule: summarizeSchedule(result.currentPlan.schedule) },
          recommendedPlan: { ...result.recommendedPlan, schedule: summarizeSchedule(result.recommendedPlan.schedule) },
        };
      }),

    exportPdf: protectedProcedure
      .input(z.object({ input: mortgageKillerInputSchema, clientName: z.string().trim().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        const result = runMortgageKillerAnalysis(input.input as MortgageKillerInput);
        const { generateMortgageKillerPdf } = await import("./mortgageKillerPdf");
        const pdf = await generateMortgageKillerPdf({
          result,
          clientName: input.clientName,
          advisorName: ctx.user.name || "Russell Capital Advisor",
          firmName: "Russell Capital Systems",
          mortgageRate: input.input.mortgageRate,
          annualIncome: input.input.annualIncome,
          mortgageBalance: input.input.mortgageBalance,
          homeMarketValue: input.input.homeMarketValue,
          homeEquityValue: input.input.homeEquityValue,
          incomeAllocationPct: input.input.incomeAllocationPct,
        });
        return {
          fileName: `${input.clientName.replace(/[^a-zA-Z0-9]+/g, "_")}_Mortgage_Killer.pdf`,
          mimeType: "application/pdf" as const,
          contentBase64: pdf.toString("base64"),
        };
      }),

    emailPdf: protectedProcedure
      .input(z.object({
        input: mortgageKillerInputSchema,
        clientName: z.string().trim().min(1).max(200),
        clientEmail: z.string().email(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = runMortgageKillerAnalysis(input.input as MortgageKillerInput);
        const { generateMortgageKillerPdf } = await import("./mortgageKillerPdf");
        const { sendClientReportEmail } = await import("./email");
        const pdfBuffer = await generateMortgageKillerPdf({
          result,
          clientName: input.clientName,
          advisorName: ctx.user.name || "Russell Capital Advisor",
          firmName: "Russell Capital Systems",
          mortgageRate: input.input.mortgageRate,
          annualIncome: input.input.annualIncome,
          mortgageBalance: input.input.mortgageBalance,
          homeMarketValue: input.input.homeMarketValue,
          homeEquityValue: input.input.homeEquityValue,
          incomeAllocationPct: input.input.incomeAllocationPct,
        });
        const delivery = await sendClientReportEmail({
          toEmail: input.clientEmail,
          clientName: input.clientName,
          workspaceName: "Russell Capital Systems",
          pdfBuffer,
        });
        if (!delivery.sent) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: delivery.reason || "Email provider is unavailable; the PDF was not sent." });
        }
        return { sent: true as const };
      }),

    // Extract mortgage statement data via LLM
    extractStatement: protectedProcedure
      .input(z.object({
        fileUrl: z.string().url(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `${SYSTEM_PREAMBLE} You are a mortgage statement data extractor. Extract the following fields from the uploaded mortgage statement document. Return ONLY valid JSON with these exact keys:
{
  "mortgageBalance": number (current principal balance),
  "mortgageRate": number (annual interest rate as decimal, e.g. 0.065 for 6.5%),
  "monthlyMortgagePayment": number (total monthly payment including P&I),
  "monthlyInterestOnlyPayment": number (interest portion of monthly payment),
  "totalInterestPayments": number (total remaining interest over life of loan, estimate if not shown),
  "mortgageTermMonths": number (remaining months on the loan),
  "homeMarketValue": number (property value if shown, 0 if not available),
  "lenderName": string (name of the lender/servicer),
  "propertyAddress": string (property address if shown),
  "escrowBalance": number (escrow balance if shown, 0 if not)
}
If a field cannot be determined, use 0 for numbers and "Unknown" for strings. Be precise with the interest rate — convert percentage to decimal.`
            },
            {
              role: "user",
              content: [
                { type: "text", text: `Please extract the mortgage data from this statement: ${input.fileName}` },
                { type: "file_url", file_url: { url: input.fileUrl, mime_type: "application/pdf" } },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "mortgage_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  mortgageBalance: { type: "number" },
                  mortgageRate: { type: "number" },
                  monthlyMortgagePayment: { type: "number" },
                  monthlyInterestOnlyPayment: { type: "number" },
                  totalInterestPayments: { type: "number" },
                  mortgageTermMonths: { type: "number" },
                  homeMarketValue: { type: "number" },
                  lenderName: { type: "string" },
                  propertyAddress: { type: "string" },
                  escrowBalance: { type: "number" },
                },
                required: ["mortgageBalance", "mortgageRate", "monthlyMortgagePayment", "monthlyInterestOnlyPayment", "totalInterestPayments", "mortgageTermMonths", "homeMarketValue", "lenderName", "propertyAddress", "escrowBalance"],
                additionalProperties: false,
              },
            },
          },
        });
        const rawContent = response.choices?.[0]?.message?.content;
        if (!rawContent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to extract mortgage data" });
        const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        try {
          return JSON.parse(content);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Invalid extraction result" });
        }
      }),

    // Upload mortgage statement to S3
    uploadStatement: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileBase64: z.string(),
        contentType: z.string().default("application/pdf"),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const suffix = randomBytes(6).toString("hex");
        const key = `mortgage-statements/${ctx.user.id}/${suffix}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  // ── Referral Links (Upgrade 9) ────────────────────────────────────────────
  referralLinks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const db = (await getDb())!;
      return db.select().from(referralLinks).where(eq(referralLinks.workspaceId, ws.id)).orderBy(desc(referralLinks.createdAt));
    }),
    create: protectedProcedure.input(z.object({
      partnerName: z.string().min(1), partnerEmail: z.string().email().optional(),
      partnerType: z.enum(["client", "cpa", "attorney", "financial_advisor", "other"]).optional(),
      commissionPct: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      const code = `RC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const [inserted] = await db.insert(referralLinks).values({
        workspaceId: ws.id, createdBy: ctx.user.id, code,
        partnerName: input.partnerName, partnerEmail: input.partnerEmail ?? null,
        partnerType: input.partnerType ?? "client", commissionPct: input.commissionPct ?? null,
      }).$returningId();
      return { id: inserted.id, code };
    }),
    toggle: protectedProcedure.input(z.object({ id: z.number(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      await db.update(referralLinks).set({ isActive: input.isActive }).where(and(eq(referralLinks.id, input.id), eq(referralLinks.workspaceId, ws.id)));
      return { success: true };
    }),
    recordClick: publicProcedure.input(z.object({ code: z.string() })).mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [link] = await db.select().from(referralLinks).where(eq(referralLinks.code, input.code)).limit(1);
      if (!link || !link.isActive) return { success: false };
      await db.update(referralLinks).set({ clicks: link.clicks + 1 }).where(eq(referralLinks.id, link.id));
      return { success: true };
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { totalLinks: 0, totalClicks: 0, totalSignups: 0, totalConversions: 0, totalRevenue: "0" };
      const db = (await getDb())!;
      const links = await db.select().from(referralLinks).where(eq(referralLinks.workspaceId, ws.id));
      return {
        totalLinks: links.length,
        totalClicks: links.reduce((s, l) => s + l.clicks, 0),
        totalSignups: links.reduce((s, l) => s + l.signups, 0),
        totalConversions: links.reduce((s, l) => s + l.conversions, 0),
        totalRevenue: links.reduce((s, l) => s + Number(l.totalRevenue ?? 0), 0).toFixed(2),
      };
    }),
  }),

  // ── Referrals ────────────────────────────────────────────────────────────────
  referral: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      return listReferrals(ws.id);
    }),
    create: protectedProcedure
      .input(z.object({
        referrerName: z.string().min(1),
        referredName: z.string().min(1),
        referredEmail: z.string().email().optional(),
        referredPhone: z.string().optional(),
        source: z.enum(["Client", "Professional", "Event", "Online", "Other"]).optional(),
        estimatedValue: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        return createReferral({ workspaceId: ws.id, ...input });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        referrerName: z.string().optional(),
        referredName: z.string().optional(),
        referredEmail: z.string().optional(),
        referredPhone: z.string().optional(),
        source: z.enum(["Client", "Professional", "Event", "Online", "Other"]).optional(),
        status: z.enum(["pending", "contacted", "meeting_scheduled", "converted", "lost"]).optional(),
        estimatedValue: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        const { id, ...data } = input;
        return updateReferral(id, ws.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        return deleteReferral(input.id, ws.id);
      }),
  }),

  // ── Document Vault (all documents) ──────────────────────────────────────────
  documentVault: router({
    listAll: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      return listAllDocuments(ws.id);
    }),
  }),

  // ── Compliance Tracking (Round 89) ──────────────────────────────────────────
  complianceTracking: router({
    // Check if user has signed compliance for this session
    hasSignedThisSession: protectedProcedure.query(async ({ ctx }) => {
      const activeSession = await getActiveSession(ctx.user.id);
      if (!activeSession) return { signed: false, sessionId: null };
      // Check if there's a compliance signature after the session start
      const sig = await getLatestComplianceSignature(ctx.user.id);
      if (!sig) return { signed: false, sessionId: activeSession.id };
      const sigTime = sig.createdAt.getTime();
      const sessionTime = activeSession.loginAt.getTime();
      return { signed: sigTime >= sessionTime, sessionId: activeSession.id };
    }),

    // Sign compliance disclaimer
    sign: protectedProcedure.input(z.object({
      signedName: z.string().min(2),
      signedDate: z.string().min(8),
      userAgent: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const sig = await saveComplianceSignatureDb({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Unknown",
        userEmail: ctx.user.email ?? undefined,
        signedName: input.signedName,
        signedDate: input.signedDate,
        userAgent: input.userAgent,
      });
      // Start a new session after signing
      const session = await createUserSession({
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Unknown",
        userEmail: ctx.user.email ?? undefined,
        userAgent: input.userAgent,
      });
      return { success: true, signatureId: sig?.id, sessionId: session?.id };
    }),

    // Log page visit
    logPageVisit: protectedProcedure.input(z.object({
      sessionId: z.number(),
      pagePath: z.string(),
      pageTitle: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await logPageVisit({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        userName: ctx.user.name ?? ctx.user.email ?? "Unknown",
        pagePath: input.pagePath,
        pageTitle: input.pageTitle,
      });
      return { success: true };
    }),

    // End session (on logout or window close)
    endSession: protectedProcedure.input(z.object({
      sessionId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      await closePageVisit(input.sessionId, ctx.user.id);
      await endUserSession(input.sessionId);
      return { success: true };
    }),

    // Heartbeat to keep session alive
    heartbeat: protectedProcedure.input(z.object({
      sessionId: z.number(),
    })).mutation(async () => {
      return { alive: true };
    }),
  }),

  // ── Website Usage Records (Managed OAuth Admin Only) ────────────────────────
  websiteUsage: router({
    // Compatibility procedure for the legacy UI. Password input is ignored;
    // adminProcedure is the sole authorization boundary.
    verifyPassword: adminProcedure
      .input(z.object({ password: z.string().optional() }).optional())
      .mutation(async () => ({ verified: true, authorization: "managed-oauth" as const })),

    // List all users who have logged in
    listUsers: adminProcedure.input(z.object({
      password: z.string().optional(),
    }).optional()).query(async () => {
      return getDistinctSessionUsers();
    }),

    // Get all sessions for a specific user
    getUserSessions: adminProcedure.input(z.object({
      password: z.string().optional(),
      userId: z.number(),
    })).query(async ({ input }) => {
      return getUserSessionHistory(input.userId);
    }),

    // Get page activity for a specific session
    getSessionActivity: adminProcedure.input(z.object({
      password: z.string().optional(),
      sessionId: z.number(),
    })).query(async ({ input }) => {
      return getPageActivityBySession(input.sessionId);
    }),

    // Get compliance signatures for a user
    getUserSignatures: adminProcedure.input(z.object({
      password: z.string().optional(),
      userId: z.number(),
    })).query(async ({ input }) => {
      return getComplianceSignaturesByUser(input.userId);
    }),

    // Get all page activity for a user
    getUserPageActivity: adminProcedure.input(z.object({
      password: z.string().optional(),
      userId: z.number(),
    })).query(async ({ input }) => {
      return getPageActivityByUser(input.userId);
    }),

    // Get summary stats for all users
    getSummary: adminProcedure.input(z.object({
      password: z.string().optional(),
    }).optional()).query(async () => {
      const allSessions = await getAllUserSessions();
      const allSignatures = await getAllComplianceSignatures();
      const uniqueUsers = new Set(allSessions.map(s => s.userId));
      const totalDuration = allSessions.reduce((sum, s) => sum + (s.durationSecs ?? 0), 0);
      return {
        totalUsers: uniqueUsers.size,
        totalSessions: allSessions.length,
        totalSignatures: allSignatures.length,
        totalDurationSecs: totalDuration,
        activeSessions: allSessions.filter(s => s.isActive).length,
      };
    }),
  }),

  // ─── Household Fact Finder ─────────────────────────────────────────────────
  household: router({
    getFactFinder: protectedProcedure.input(z.object({
      clientId: z.number(),
    })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      return getHouseholdFactFinder(input.clientId, ws.id);
    }),

    saveFactFinder: protectedProcedure.input(z.object({
      clientId: z.number(),
      primaryAge: z.number().optional(),
      primaryIncome: z.string().optional(),
      primaryIra: z.string().optional(),
      primaryRothIra: z.string().optional(),
      primaryCash: z.string().optional(),
      primaryHomeValue: z.string().optional(),
      primaryHomeEquity: z.string().optional(),
      primaryMortgageBalance: z.string().optional(),
      primaryMortgageRate: z.string().optional(),
      primaryMortgageYearsLeft: z.number().optional(),
      primaryTotalInterest: z.string().optional(),
      primaryAnnualPremium: z.string().optional(),
      primaryDeathBenefit: z.string().optional(),
      spouseName: z.string().optional(),
      spouseAge: z.number().optional(),
      spouseIncome: z.string().optional(),
      spouseIra: z.string().optional(),
      spouseRothIra: z.string().optional(),
      spouseCash: z.string().optional(),
      helocRate: z.string().optional(),
      helocMaxLtv: z.string().optional(),
      rentBasement: z.boolean().optional(),
      children: z.array(z.object({
        id: z.string(),
        name: z.string(),
        age: z.number(),
        income: z.number(),
        ira: z.number(),
        rothIra: z.number(),
        cash: z.number(),
        homeValue: z.number(),
        homeEquity: z.number(),
        mortgageBalance: z.number(),
        mortgageRate: z.number(),
        mortgageYearsLeft: z.number(),
        totalInterest: z.number(),
      })).optional(),
      grandchildren: z.array(z.object({
        id: z.string(),
        name: z.string(),
        age: z.number(),
        parentId: z.string(),
        homeValue: z.number(),
        homeEquity: z.number(),
        mortgageBalance: z.number(),
        mortgageRate: z.number(),
        mortgageYearsLeft: z.number(),
        totalInterest: z.number(),
      })).optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      return upsertHouseholdFactFinder({
        clientId: input.clientId,
        workspaceId: ws.id,
        primaryAge: input.primaryAge ?? null,
        primaryIncome: input.primaryIncome ?? null,
        primaryIra: input.primaryIra ?? null,
        primaryRothIra: input.primaryRothIra ?? null,
        primaryCash: input.primaryCash ?? null,
        primaryHomeValue: input.primaryHomeValue ?? null,
        primaryHomeEquity: input.primaryHomeEquity ?? null,
        primaryMortgageBalance: input.primaryMortgageBalance ?? null,
        primaryMortgageRate: input.primaryMortgageRate ?? null,
        primaryMortgageYearsLeft: input.primaryMortgageYearsLeft ?? null,
        primaryTotalInterest: input.primaryTotalInterest ?? null,
        primaryAnnualPremium: input.primaryAnnualPremium ?? null,
        primaryDeathBenefit: input.primaryDeathBenefit ?? null,
        spouseName: input.spouseName ?? null,
        spouseAge: input.spouseAge ?? null,
        spouseIncome: input.spouseIncome ?? null,
        spouseIra: input.spouseIra ?? null,
        spouseRothIra: input.spouseRothIra ?? null,
        spouseCash: input.spouseCash ?? null,
        helocRate: input.helocRate ?? null,
        helocMaxLtv: input.helocMaxLtv ?? null,
        rentBasement: input.rentBasement ?? false,
        children: input.children ?? [],
        grandchildren: input.grandchildren ?? [],
      });
    }),
  }),

  // ─── Crypto Currency Corner (Round 103) ─────────────────────────────────────
  cryptoCycle: router({
    history: publicProcedure.query(() => {
      
      return BITCOIN_CYCLES;
    }),
    simulate: publicProcedure.input(z.object({
      numCycles: z.number().min(1).max(20).default(10),
    })).query(({ input }) => {
      
      return simulateNextCycles(input.numCycles);
    }),
    accumulate: publicProcedure.input(z.object({
      iulCashValue: z.number().min(0).default(500000),
      iulGrowthRate: z.number().min(0).max(0.20).default(0.07),
      iulLoanRate: z.number().min(0).max(0.10).default(0.05),
      iulMaxLoanToValue: z.number().min(0.5).max(0.95).default(0.90),
      annualPremium: z.number().min(0).default(50000),
      premiumYearsRemaining: z.number().min(0).max(20).default(5),
      loanPctForCrypto: z.number().min(0).max(100).default(30),
      dcaBearMonths: z.number().min(6).max(36).default(24),
      dcaBullMonths: z.number().min(3).max(18).default(12),
      pctToSilver: z.number().min(0).max(100).default(10),
      pctToGold: z.number().min(0).max(100).default(15),
      pctToMortgagePaydown: z.number().min(0).max(100).default(25),
      goldPricePerOz: z.number().min(0).default(4783),
      silverPricePerOz: z.number().min(0).default(72),
      strPurchasePrice: z.number().min(0).default(500000),
      strDownPaymentPct: z.number().min(0.1).max(0.5).default(0.30),
      strGrossIncomePct: z.number().min(0.05).max(0.40).default(0.20),
      strAppreciationRate: z.number().min(0).max(0.15).default(0.05),
      strFirstYearDepreciation: z.number().min(0).max(1).default(0.40),
      strPurchaseEveryYears: z.number().min(3).max(15).default(7),
      simulationYears: z.number().min(10).max(50).default(30),
      startYear: z.number().min(2024).max(2030).default(2026),
    })).mutation(({ input }) => {
      
      return runCryptoAccumulation(input);
    }),
  }),

  // ─── Lifetime Guaranteed Income (Round 105) ──────────────────────────────
  lifetimeIncome: router({
    calculate: publicProcedure.input(z.object({
      premium: z.number().min(10000).default(510000),
      currentAge: z.number().min(30).max(80).default(53),
      incomeStartAge: z.number().min(50).max(95).default(65),
      lifeExpectancy: z.number().min(65).max(110).default(90),
      filingStatus: z.enum(['single', 'married']).default('single'),
      otherTaxableIncome: z.number().min(0).default(50000),
      stateTaxRate: z.number().min(0).max(0.15).default(0.05),
      solarStrategyGrowth: z.number().min(0.10).max(0.40).default(0.25),
      incomeBaseGrowthRate: z.number().min(0.05).max(0.15).default(0.10),
      premiumBonusPercent: z.number().min(0).max(0.30).default(0.20),
    })).query(({ input }) => {
      
      return calculateLifetimeIncome(input);
    }),
    getDefaults: publicProcedure.query(() => {
      
      return getDefaultLifetimeIncomeInput();
    }),
    getRateTable: publicProcedure.query(() => {
      
      return INCOME_RATE_TABLE;
    }),
    analyzeExisting: publicProcedure.input(z.object({
      annuityValue: z.number().min(0).default(350000),
      companyName: z.string().default('Jackson National'),
      yearsInForce: z.number().min(0).default(6),
      currentSurrenderValue: z.number().min(0).default(308000),
      guaranteedMonthlyIncome: z.number().min(0).default(1604),
      accountType: z.enum(['taxfree', 'ira', '401k', '403b', 'tsp']).default('ira'),
      currentAge: z.number().min(30).max(90).default(62),
      lifeExpectancy: z.number().min(65).max(110).default(90),
      filingStatus: z.enum(['single', 'married']).default('single'),
      otherTaxableIncome: z.number().min(0).default(45000),
      stateTaxRate: z.number().min(0).max(0.15).default(0.05),
      surrenderPenaltyPercent: z.number().min(0).max(0.20).default(0.12),
      premiumBonusPercent: z.number().min(0.10).max(0.36).default(0.20),
      solarGrowthPercent: z.number().min(0.15).max(0.35).default(0.25),
      incomeStartAge: z.number().min(50).max(95).default(65),
      monthlyExpenses: z.object({
        mortgage: z.number().default(1800),
        utilities: z.number().default(350),
        insurance: z.number().default(450),
        groceries: z.number().default(600),
        carPayment: z.number().default(450),
        healthcare: z.number().default(650),
        phone: z.number().default(120),
        internet: z.number().default(80),
        subscriptions: z.number().default(75),
        gasTransport: z.number().default(200),
        clothing: z.number().default(150),
        dining: z.number().default(300),
        personalCare: z.number().default(100),
        petCare: z.number().default(75),
        otherMonthly: z.number().default(200),
      }),
      annualExpenses: z.object({
        vacations: z.number().default(6000),
        propertyTaxes: z.number().default(4200),
        homeMaintenance: z.number().default(3000),
        gifts: z.number().default(2400),
        charitableGiving: z.number().default(1200),
        hobbies: z.number().default(1800),
        emergencyFund: z.number().default(2400),
        otherAnnual: z.number().default(1000),
      }),
    })).query(({ input }) => {
      
      return analyzeExistingAnnuity(input);
    }),
    getDefaultExisting: publicProcedure.query(() => {
      
      return getDefaultExistingAnnuityInput();
    }),
  }),

  // ─── Growth Annuity (F&G BlackRock FIA) ──────────────────────────────────
  growthAnnuity: router({
    getProductData: publicProcedure.query(() => {
      
      return { product: FG_PRODUCT_DATA, strategies: INDEX_STRATEGIES, preciousMetals: PRECIOUS_METALS_DATA, comparison: ETF_VS_TRADITIONAL, fiatData: FIAT_CURRENCY_DATA };
    }),
    analyze: publicProcedure.input(z.object({
      initialPremium: z.number().min(10000),
      annualReturnRate: z.number().min(1).max(50),
      projectionYears: z.number().min(1).max(40),
      existingAnnuityValue: z.number().default(0),
      existingAnnuityCompany: z.string().default(""),
      yearsInForce: z.number().default(0),
      currentSurrenderValue: z.number().default(0),
      accountType: z.enum(["ira", "401k", "403b", "tsp", "roth", "nonqualified"]).default("ira"),
      surrenderPenaltyPct: z.number().default(15),
      premiumBonusPct: z.number().default(25),
      doRothConversion: z.boolean().default(false),
      currentTaxBracket: z.number().default(28),
    })).mutation(({ input }) => {
      
      return runGrowthAnnuityAnalysis(input);
    }),
  }),

  // ─── Compliance Audit Trail (Upgrade 7) ────────────────────────────
  complianceAudit: router({
    logCalculation: protectedProcedure.input(z.object({
      clientId: z.number().optional(), clientName: z.string().optional(),
      calculationType: z.string(), pagePath: z.string().optional(),
      inputs: z.record(z.string(), z.unknown()).optional(), outputs: z.record(z.string(), z.unknown()).optional(),
      summary: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      const [inserted] = await db.insert(calculationAuditLogs).values({
        workspaceId: ws.id, userId: ctx.user.id, userName: ctx.user.name ?? null,
        clientId: input.clientId ?? null, clientName: input.clientName ?? null,
        calculationType: input.calculationType, pagePath: input.pagePath ?? null,
        inputs: input.inputs ?? null, outputs: input.outputs ?? null, summary: input.summary ?? null,
      }).$returningId();
      return { id: inserted.id };
    }),
    search: protectedProcedure.input(z.object({
      page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(25),
      calculationType: z.string().optional(), clientId: z.number().optional(),
      startDate: z.string().optional(), endDate: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { logs: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
      const db = (await getDb())!;
      const conditions = [eq(calculationAuditLogs.workspaceId, ws.id)];
      if (input.calculationType) conditions.push(eq(calculationAuditLogs.calculationType, input.calculationType));
      if (input.clientId) conditions.push(eq(calculationAuditLogs.clientId, input.clientId));
      if (input.startDate) conditions.push(lte(calculationAuditLogs.createdAt, new Date(input.endDate ?? new Date().toISOString())));
      const where = and(...conditions);
      const allLogs = await db.select().from(calculationAuditLogs).where(where).orderBy(desc(calculationAuditLogs.createdAt));
      const total = allLogs.length;
      const offset = (input.page - 1) * input.pageSize;
      const logs = allLogs.slice(offset, offset + input.pageSize);
      return { logs, total, page: input.page, pageSize: input.pageSize, totalPages: Math.ceil(total / input.pageSize) };
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { totalLogs: 0, byType: [] };
      const db = (await getDb())!;
      const allLogs = await db.select().from(calculationAuditLogs).where(eq(calculationAuditLogs.workspaceId, ws.id));
      const byType: Record<string, number> = {};
      for (const log of allLogs) { byType[log.calculationType] = (byType[log.calculationType] ?? 0) + 1; }
      return { totalLogs: allLogs.length, byType: Object.entries(byType).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count) };
    }),
  }),

  // ─── Email Campaigns (Upgrade 6) ───────────────────────────────────
  emailCampaigns: router({
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      campaignType: z.enum(["welcome", "nurture", "reengagement", "educational", "custom"]).default("custom"),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      const [inserted] = await db.insert(emailCampaignsTable).values({
        workspaceId: ws.id, name: input.name, description: input.description ?? null,
        campaignType: input.campaignType,
      }).$returningId();
      return { id: inserted.id };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const db = (await getDb())!;
      return db.select().from(emailCampaignsTable).where(eq(emailCampaignsTable.workspaceId, ws.id)).orderBy(desc(emailCampaignsTable.createdAt));
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), description: z.string().optional(),
      status: z.enum(["draft", "active", "paused", "completed"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.status) updates.status = input.status;
      await db.update(emailCampaignsTable).set(updates).where(and(eq(emailCampaignsTable.id, input.id), eq(emailCampaignsTable.workspaceId, ws.id)));
      return { updated: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      await db.delete(emailCampaignsTable).where(and(eq(emailCampaignsTable.id, input.id), eq(emailCampaignsTable.workspaceId, ws.id)));
      return { deleted: true };
    }),
    // Templates
    addTemplate: protectedProcedure.input(z.object({
      campaignId: z.number(), name: z.string(), subject: z.string(), body: z.string(),
      delayDays: z.number().default(0), sortOrder: z.number().default(0),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      const [inserted] = await db.insert(emailTemplatesTable).values({
        workspaceId: ws.id, campaignId: input.campaignId, name: input.name,
        subject: input.subject, body: input.body, delayDays: input.delayDays, sortOrder: input.sortOrder,
      }).$returningId();
      return { id: inserted.id };
    }),
    listTemplates: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const db = (await getDb())!;
      return db.select().from(emailTemplatesTable)
        .where(and(eq(emailTemplatesTable.campaignId, input.campaignId), eq(emailTemplatesTable.workspaceId, ws.id)))
        .orderBy(emailTemplatesTable.sortOrder);
    }),
    deleteTemplate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      await db.delete(emailTemplatesTable).where(and(eq(emailTemplatesTable.id, input.id), eq(emailTemplatesTable.workspaceId, ws.id)));
      return { deleted: true };
    }),
    // Enrollments
    enroll: protectedProcedure.input(z.object({
      campaignId: z.number(), clientId: z.number(), clientEmail: z.string().email(), clientName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      const [inserted] = await db.insert(campaignEnrollmentsTable).values({
        workspaceId: ws.id, campaignId: input.campaignId, clientId: input.clientId,
        clientEmail: input.clientEmail, clientName: input.clientName ?? null,
      }).$returningId();
      return { id: inserted.id };
    }),
    listEnrollments: protectedProcedure.input(z.object({ campaignId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      const db = (await getDb())!;
      return db.select().from(campaignEnrollmentsTable)
        .where(and(eq(campaignEnrollmentsTable.campaignId, input.campaignId), eq(campaignEnrollmentsTable.workspaceId, ws.id)));
    }),
    unenroll: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      await db.update(campaignEnrollmentsTable).set({ status: "unsubscribed" })
        .where(and(eq(campaignEnrollmentsTable.id, input.id), eq(campaignEnrollmentsTable.workspaceId, ws.id)));
      return { updated: true };
    }),

    // Send next email in campaign to enrolled clients
    sendNext: protectedProcedure.input(z.object({
      campaignId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      // Get campaign
      const [campaign] = await db.select().from(emailCampaignsTable)
        .where(and(eq(emailCampaignsTable.id, input.campaignId), eq(emailCampaignsTable.workspaceId, ws.id)))
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      if (campaign.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Campaign must be active to send emails" });
      // Get templates sorted by order
      const templates = await db.select().from(emailTemplatesTable)
        .where(and(eq(emailTemplatesTable.campaignId, input.campaignId), eq(emailTemplatesTable.workspaceId, ws.id)))
        .orderBy(emailTemplatesTable.sortOrder);
      if (templates.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Campaign has no email templates" });
      // Get active enrollments
      const enrollments = await db.select().from(campaignEnrollmentsTable)
        .where(and(
          eq(campaignEnrollmentsTable.campaignId, input.campaignId),
          eq(campaignEnrollmentsTable.workspaceId, ws.id),
          eq(campaignEnrollmentsTable.status, "active")
        ));
      if (enrollments.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No active enrollments" });
      const { sendCampaignEmail } = await import("./email");
      const results: { enrollmentId: number; clientName: string; sent: boolean; reason?: string; templateName: string }[] = [];
      for (const enrollment of enrollments) {
        const step = enrollment.currentStep;
        if (step >= templates.length) {
          // Mark as completed
          await db.update(campaignEnrollmentsTable).set({ status: "completed" })
            .where(eq(campaignEnrollmentsTable.id, enrollment.id));
          results.push({ enrollmentId: enrollment.id, clientName: enrollment.clientName ?? "Unknown", sent: false, reason: "All steps completed", templateName: "N/A" });
          continue;
        }
        const template = templates[step];
        // Check delay: if lastSentAt exists, ensure enough days have passed
        if (enrollment.lastSentAt && template.delayDays > 0) {
          const daysSinceLast = (Date.now() - new Date(enrollment.lastSentAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLast < template.delayDays) {
            results.push({ enrollmentId: enrollment.id, clientName: enrollment.clientName ?? "Unknown", sent: false, reason: `Delay not met (${Math.ceil(template.delayDays - daysSinceLast)} days remaining)`, templateName: template.name });
            continue;
          }
        }
        try {
          // Replace placeholders in subject and body
          const subject = template.subject
            .replace(/\{\{clientName\}\}/g, enrollment.clientName ?? "Client")
            .replace(/\{\{advisorName\}\}/g, ctx.user.name ?? "Your Advisor");
          const body = template.body
            .replace(/\{\{clientName\}\}/g, enrollment.clientName ?? "Client")
            .replace(/\{\{advisorName\}\}/g, ctx.user.name ?? "Your Advisor");
          const result = await sendCampaignEmail({
            toEmail: enrollment.clientEmail,
            toName: enrollment.clientName ?? undefined,
            subject,
            body,
            campaignName: campaign.name,
          });
          if (result.sent) {
            await db.update(campaignEnrollmentsTable).set({
              currentStep: step + 1,
              lastSentAt: new Date(),
              nextSendAt: step + 1 < templates.length && templates[step + 1].delayDays > 0
                ? new Date(Date.now() + templates[step + 1].delayDays * 24 * 60 * 60 * 1000)
                : null,
            }).where(eq(campaignEnrollmentsTable.id, enrollment.id));
          }
          results.push({ enrollmentId: enrollment.id, clientName: enrollment.clientName ?? "Unknown", sent: result.sent, reason: result.reason, templateName: template.name });
        } catch (err: any) {
          results.push({ enrollmentId: enrollment.id, clientName: enrollment.clientName ?? "Unknown", sent: false, reason: err.message, templateName: template.name });
        }
      }
      return { totalEnrollments: enrollments.length, sent: results.filter(r => r.sent).length, results };
    }),

    // Send a single test email to the advisor
    sendTest: protectedProcedure.input(z.object({
      templateId: z.number(),
      campaignId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const db = (await getDb())!;
      const [template] = await db.select().from(emailTemplatesTable)
        .where(and(eq(emailTemplatesTable.id, input.templateId), eq(emailTemplatesTable.workspaceId, ws.id)))
        .limit(1);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      const [campaign] = await db.select().from(emailCampaignsTable)
        .where(and(eq(emailCampaignsTable.id, input.campaignId), eq(emailCampaignsTable.workspaceId, ws.id)))
        .limit(1);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      const { sendCampaignEmail } = await import("./email");
      const subject = template.subject
        .replace(/\{\{clientName\}\}/g, "[Test Client]")
        .replace(/\{\{advisorName\}\}/g, ctx.user.name ?? "Advisor");
      const body = template.body
        .replace(/\{\{clientName\}\}/g, "[Test Client]")
        .replace(/\{\{advisorName\}\}/g, ctx.user.name ?? "Advisor");
      if (!ctx.user.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Your account has no email for test delivery" });
      const result = await sendCampaignEmail({
        toEmail: ctx.user.email,
        toName: ctx.user.name ?? undefined,
        subject: `[TEST] ${subject}`,
        body,
        campaignName: campaign.name,
      });
      return result;
    }),
  }),

  // ─── Real-Time Market Data (Upgrade 4) ─────────────────────────────
  marketData: router({
    quotes: publicProcedure.input(z.object({ _refresh: z.number().optional() }).optional()).query(async () => {
      const now = new Date().toISOString();
      const results: Array<{
        symbol: string;
        name: string;
        price: number | null;
        change: number | null;
        changePct: number | null;
        lastUpdated: string;
        source: "live" | "cached" | "static" | "unavailable";
        available: boolean;
        message?: string;
      }> = [];

      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true", {
          signal: AbortSignal.timeout(5_000),
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error(`status_${response.status}`);
        const data = await response.json() as { bitcoin?: { usd?: number; usd_24h_change?: number } };
        const price = data.bitcoin?.usd;
        const changePct = data.bitcoin?.usd_24h_change;
        if (!Number.isFinite(price) || !Number.isFinite(changePct)) throw new Error("invalid_payload");
        results.push({
          symbol: "BTC",
          name: "Bitcoin",
          price: price!,
          change: price! * (changePct! / 100),
          changePct: changePct!,
          lastUpdated: now,
          source: "live",
          available: true,
        });
      } catch (error) {
        console.warn("[MarketData] Bitcoin quote unavailable", { reason: error instanceof Error ? error.message : "unknown" });
        results.push({ symbol: "BTC", name: "Bitcoin", price: null, change: null, changePct: null, lastUpdated: now, source: "unavailable", available: false, message: "Live source unavailable" });
      }

      try {
        const { getCommodityPrices } = await import("./dataFeedService");
        const commodities = await getCommodityPrices();
        for (const target of [{ symbol: "GOLD", name: "Gold", aliases: ["gold", "gc"] }, { symbol: "SILVER", name: "Silver", aliases: ["silver", "si"] }]) {
          const commodity = commodities.find(item => target.aliases.includes(item.name.toLowerCase()) || target.aliases.includes(item.symbol.toLowerCase()));
          if (!commodity) {
            results.push({ symbol: target.symbol, name: target.name, price: null, change: null, changePct: null, lastUpdated: now, source: "unavailable", available: false, message: "Commodity source unavailable" });
            continue;
          }
          results.push({
            symbol: target.symbol,
            name: target.name,
            price: commodity.value,
            change: commodity.change ?? null,
            changePct: commodity.changePercent ?? null,
            lastUpdated: commodity.lastUpdated,
            source: commodity.source,
            available: true,
            message: commodity.source === "static" ? `Reference snapshot as of ${commodity.asOf}` : undefined,
          });
        }
      } catch (error) {
        console.warn("[MarketData] Commodity quotes unavailable", { reason: error instanceof Error ? error.message : "unknown" });
        for (const target of [{ symbol: "GOLD", name: "Gold" }, { symbol: "SILVER", name: "Silver" }]) {
          results.push({ ...target, price: null, change: null, changePct: null, lastUpdated: now, source: "unavailable", available: false, message: "Commodity source unavailable" });
        }
      }

      for (const target of [{ symbol: "SPY", name: "S&P 500 ETF" }, { symbol: "QQQ", name: "Nasdaq 100 ETF" }]) {
        results.push({ ...target, price: null, change: null, changePct: null, lastUpdated: now, source: "unavailable", available: false, message: "No verified live equity source configured" });
      }
      return results;
    }),
  }),

  // ─── Strategy Page PDF Export (Upgrade 2) ──────────────────────────────
  strategyExport: router({
    generate: protectedProcedure.input(z.object({
      pageTitle: z.string(),
      clientName: z.string().optional(),
      advisorName: z.string().optional(),
      sections: z.array(z.object({
        title: z.string(),
        items: z.array(z.object({
          label: z.string(),
          value: z.string(),
          color: z.string().optional(),
        })),
      })),
      bullets: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { generateStrategyPdf } = await import("./strategyPdfService");
      const pdfBuffer = await generateStrategyPdf({
        pageTitle: input.pageTitle,
        clientName: input.clientName,
        advisorName: input.advisorName ?? ctx.user.name ?? "Advisor",
        sections: input.sections,
        bullets: input.bullets,
        notes: input.notes,
      });
      const { storagePut } = await import("./storage");
      const key = `strategy-exports/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
      const { url } = await storagePut(key, pdfBuffer, "application/pdf");
      return { url, fileName: `${input.pageTitle.replace(/[^a-zA-Z0-9]/g, "_")}.pdf` };
    }),
  }),

  // ─── Client Gamification & Scoring ──────────────────────────────────
  gamification: router({
    // Get or create client score
    getScore: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(clientScores).where(and(eq(clientScores.clientId, input.clientId), eq(clientScores.workspaceId, ws.id))).limit(1);
      return rows[0] ?? null;
    }),

    initScore: protectedProcedure.input(z.object({
      clientId: z.number(), workspaceId: z.number(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(clientScores).where(and(eq(clientScores.clientId, input.clientId), eq(clientScores.workspaceId, input.workspaceId))).limit(1);
      if (existing.length > 0) return existing[0];
      const [row] = await db.insert(clientScores).values({
        clientId: input.clientId, workspaceId: input.workspaceId,
        overallScore: 50, financialHealthScore: 50, goalAlignmentScore: 50,
        behaviorScore: 50, diversificationScore: 50,
        level: 1, levelName: "Starter", totalPointsEarned: 0, streakDays: 0,
      });
      return { id: row.insertId, ...input, overallScore: 50, level: 1, levelName: "Starter" };
    }),

    updateScore: protectedProcedure.input(z.object({
      clientId: z.number(),
      overallScore: z.number().min(1).max(100).optional(),
      financialHealthScore: z.number().min(1).max(100).optional(),
      goalAlignmentScore: z.number().min(1).max(100).optional(),
      behaviorScore: z.number().min(1).max(100).optional(),
      diversificationScore: z.number().min(1).max(100).optional(),
      level: z.number().min(1).max(10).optional(),
      levelName: z.string().optional(),
      totalPointsEarned: z.number().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { clientId, ...updates } = input;
      await db.update(clientScores).set(updates).where(eq(clientScores.clientId, clientId));
      return { success: true };
    }),

    // Badges
    getBadges: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(clientBadges).where(and(eq(clientBadges.clientId, input.clientId), eq(clientBadges.workspaceId, ws.id))).orderBy(desc(clientBadges.earnedAt));
    }),

    awardBadge: protectedProcedure.input(z.object({
      clientId: z.number(), workspaceId: z.number(),
      badgeType: z.string(), badgeName: z.string(), badgeEmoji: z.string(),
      badgeDescription: z.string().optional(), level: z.number().default(1),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db.insert(clientBadges).values(input);
      return { id: row.insertId };
    }),

    // Level definitions
    getLevels: publicProcedure.query(() => {
      return [
        { level: 1, name: "Starter", emoji: "\u{1F331}", minScore: 0, description: "Just getting started on your financial journey" },
        { level: 2, name: "Explorer", emoji: "\u{1F9ED}", minScore: 20, description: "Exploring your financial options" },
        { level: 3, name: "Builder", emoji: "\u{1F3D7}\uFE0F", minScore: 30, description: "Building a solid financial foundation" },
        { level: 4, name: "Strategist", emoji: "\u{265F}\uFE0F", minScore: 40, description: "Making strategic financial moves" },
        { level: 5, name: "Optimizer", emoji: "\u{1F4C8}", minScore: 50, description: "Optimizing your wealth growth" },
        { level: 6, name: "Achiever", emoji: "\u{1F3C6}", minScore: 60, description: "Achieving major financial milestones" },
        { level: 7, name: "Wealth Guardian", emoji: "\u{1F6E1}\uFE0F", minScore: 70, description: "Protecting and growing your wealth" },
        { level: 8, name: "Legacy Builder", emoji: "\u{1F3F0}", minScore: 80, description: "Building a lasting financial legacy" },
        { level: 9, name: "Financial Master", emoji: "\u{1F451}", minScore: 90, description: "Mastering your financial destiny" },
        { level: 10, name: "Legendary", emoji: "\u{2B50}", minScore: 95, description: "Legendary financial achievement" },
      ];
    }),
  }),

  // ─── Risk Assessment ──────────────────────────────────────────────────
  riskAssessment: router({
    get: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(clientRiskAssessments).where(and(eq(clientRiskAssessments.clientId, input.clientId), eq(clientRiskAssessments.workspaceId, ws.id))).limit(1);
      return rows[0] ?? null;
    }),
    save: protectedProcedure.input(z.object({
      clientId: z.number(), workspaceId: z.number(),
      marketDropReaction: z.number().min(1).max(10),
      timeHorizon: z.number().min(1).max(10),
      incomeStability: z.number().min(1).max(10),
      investmentExperience: z.number().min(1).max(10),
      riskCapacity: z.number().min(1).max(10),
      volatilityComfort: z.number().min(1).max(10),
      guaranteePreference: z.number().min(1).max(10),
      growthVsIncome: z.number().min(1).max(10),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Calculate composite risk score (1-100)
      const answers = [input.marketDropReaction, input.timeHorizon, input.incomeStability,
        input.investmentExperience, input.riskCapacity, input.volatilityComfort,
        input.guaranteePreference, input.growthVsIncome];
      const avg = answers.reduce((a, b) => a + b, 0) / answers.length;
      const riskScore = Math.round(avg * 10);
      const riskCategory = riskScore <= 25 ? "conservative" : riskScore <= 40 ? "moderate_conservative" :
        riskScore <= 60 ? "moderate" : riskScore <= 75 ? "moderate_aggressive" : "aggressive";

      const existing = await db.select().from(clientRiskAssessments).where(and(eq(clientRiskAssessments.clientId, input.clientId), eq(clientRiskAssessments.workspaceId, input.workspaceId))).limit(1);
      if (existing.length > 0) {
        await db.update(clientRiskAssessments).set({ ...input, riskScore, riskCategory }).where(eq(clientRiskAssessments.id, existing[0].id));
      } else {
        await db.insert(clientRiskAssessments).values({ ...input, riskScore, riskCategory });
      }
      return { riskScore, riskCategory };
    }),
  }),

  // ─── Life Goals (5-year intervals to age 100) ─────────────────────────
  lifeGoals: router({
     list: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(clientLifeGoals).where(and(eq(clientLifeGoals.clientId, input.clientId), eq(clientLifeGoals.workspaceId, ws.id))).orderBy(clientLifeGoals.targetAge);
    }),
    save: protectedProcedure.input(z.object({
      clientId: z.number(), workspaceId: z.number(),
      targetAge: z.number().min(20).max(100),
      goalCategory: z.enum(["retirement", "travel", "education", "home_purchase", "debt_free",
        "business", "charity", "health", "family", "luxury", "legacy", "other"]),
      goalTitle: z.string().min(1).max(300),
      goalDescription: z.string().optional(),
      estimatedCost: z.number().optional(),
      priority: z.enum(["must_have", "nice_to_have", "dream"]).default("nice_to_have"),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { estimatedCost, ...rest } = input;
      const [row] = await db.insert(clientLifeGoals).values({
        ...rest,
        ...(estimatedCost !== undefined ? { estimatedCost: String(estimatedCost) } : {}),
      });
      return { id: row.insertId };
    }),

    update: protectedProcedure.input(z.object({
      id: z.number(),
      goalTitle: z.string().optional(),
      goalDescription: z.string().optional(),
      estimatedCost: z.number().optional(),
      priority: z.enum(["must_have", "nice_to_have", "dream"]).optional(),
      isAchieved: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, estimatedCost, ...rest } = input;
      const updates: Record<string, any> = { ...rest };
      if (estimatedCost !== undefined) updates.estimatedCost = String(estimatedCost);
      await db.update(clientLifeGoals).set(updates).where(eq(clientLifeGoals.id, id));
      return { success: true };
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(clientLifeGoals).where(eq(clientLifeGoals.id, input.id));
      return { success: true };
    }),

    // Get popular suggestions based on age and asset base
    getSuggestions: publicProcedure.input(z.object({
      age: z.number(), netWorth: z.number(), income: z.number(),
    })).query(({ input }) => {
      const { age, netWorth, income } = input;
      const suggestions: Array<{ targetAge: number; category: string; title: string; cost: number; priority: string; popular: boolean }> = [];

      // Age-appropriate suggestions
      const ageRanges = [
        { min: 25, max: 35, goals: [
          { cat: "home_purchase", title: "Buy first home", costMult: 3 },
          { cat: "education", title: "Complete advanced degree", costMult: 0.5 },
          { cat: "travel", title: "Backpack through Europe", costMult: 0.1 },
          { cat: "business", title: "Start a side business", costMult: 0.3 },
        ]},
        { min: 35, max: 45, goals: [
          { cat: "home_purchase", title: "Upgrade to dream home", costMult: 5 },
          { cat: "education", title: "Fund children's college", costMult: 1 },
          { cat: "travel", title: "Family vacation to Hawaii", costMult: 0.08 },
          { cat: "debt_free", title: "Become completely debt-free", costMult: 0 },
          { cat: "business", title: "Launch own company", costMult: 0.5 },
        ]},
        { min: 45, max: 55, goals: [
          { cat: "retirement", title: "Max out retirement accounts", costMult: 0 },
          { cat: "travel", title: "Mediterranean cruise", costMult: 0.05 },
          { cat: "luxury", title: "Buy a vacation property", costMult: 2 },
          { cat: "health", title: "Comprehensive health plan", costMult: 0.02 },
          { cat: "legacy", title: "Set up family trust", costMult: 0.1 },
        ]},
        { min: 55, max: 65, goals: [
          { cat: "retirement", title: "Early retirement at 60", costMult: 0 },
          { cat: "travel", title: "World tour — 6 months", costMult: 0.15 },
          { cat: "charity", title: "Establish charitable foundation", costMult: 0.5 },
          { cat: "luxury", title: "Dream car collection", costMult: 0.3 },
          { cat: "family", title: "Help kids buy their first homes", costMult: 1 },
        ]},
        { min: 65, max: 80, goals: [
          { cat: "travel", title: "Annual luxury travel", costMult: 0.05 },
          { cat: "legacy", title: "Leave $2M+ legacy", costMult: 2 },
          { cat: "charity", title: "Major charitable giving", costMult: 0.3 },
          { cat: "health", title: "Premium long-term care", costMult: 0.5 },
          { cat: "family", title: "Fund grandchildren's education", costMult: 0.5 },
        ]},
        { min: 80, max: 100, goals: [
          { cat: "legacy", title: "Multi-generational wealth transfer", costMult: 3 },
          { cat: "charity", title: "Endow a scholarship", costMult: 1 },
          { cat: "family", title: "Family reunion fund", costMult: 0.02 },
          { cat: "health", title: "In-home care fund", costMult: 1 },
        ]},
      ];

      for (const range of ageRanges) {
        if (age <= range.max + 10) {
          const targetAge = Math.max(age + 5, Math.round((range.min + range.max) / 2));
          for (const g of range.goals) {
            suggestions.push({
              targetAge: Math.min(targetAge, 100),
              category: g.cat,
              title: g.title,
              cost: Math.round(income * g.costMult),
              priority: g.costMult > 1 ? "dream" : g.costMult > 0.3 ? "nice_to_have" : "must_have",
              popular: true,
            });
          }
        }
      }
      return suggestions.slice(0, 20);
    }),

    // Calculate achievability score for a goal
    calculateAchievability: protectedProcedure.input(z.object({
      clientId: z.number(),
      estimatedCost: z.number(),
      targetAge: z.number(),
      currentAge: z.number(),
      netWorth: z.number(),
      annualIncome: z.number(),
      annualSavingsRate: z.number().default(0.15),
    })).mutation(async ({ input }) => {
      const yearsToGoal = input.targetAge - input.currentAge;
      if (yearsToGoal <= 0) return { score: input.netWorth >= input.estimatedCost ? 95 : 30 };
      const annualSavings = input.annualIncome * input.annualSavingsRate;
      const futureValue = input.netWorth * Math.pow(1.06, yearsToGoal) + annualSavings * ((Math.pow(1.06, yearsToGoal) - 1) / 0.06);
      const ratio = futureValue / Math.max(input.estimatedCost, 1);
      const score = Math.min(99, Math.max(5, Math.round(ratio * 50)));
      return { score };
    }),
  }),

  // ─── Recommendations (Score Boosters) ─────────────────────────────────
  recommendations: router({
    list: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(clientRecommendations).where(and(eq(clientRecommendations.clientId, input.clientId), eq(clientRecommendations.workspaceId, ws.id))).orderBy(desc(clientRecommendations.scoreImpact));
    }),
    generate: protectedProcedure.input(z.object({
      clientId: z.number(), workspaceId: z.number(),
      currentScore: z.number(),
      age: z.number(), income: z.number(), netWorth: z.number(),
      riskScore: z.number().optional(),
      mortgageBalance: z.number().optional(),
      iraBalance: z.number().optional(),
      rothBalance: z.number().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate personalized recommendations that each boost score by 5+
      const recs: Array<{
        category: "asset_allocation" | "spending" | "savings" | "insurance" | "tax_strategy" | "debt_management" | "retirement_timing" | "estate_planning" | "behavior" | "education";
        title: string; description: string; scoreImpact: number;
        difficulty: "easy" | "moderate" | "challenging"; estimatedTimeframe: string; suggestedTab: string;
      }> = [];

      // Always generate at least 5 recommendations
      if ((input.mortgageBalance ?? 0) > 100000) {
        recs.push({ category: "debt_management", title: "Implement Mortgage Killer Strategy",
          description: "Use an IUL policy loan strategy to potentially eliminate your mortgage interest and redirect savings to tax-free growth.",
          scoreImpact: 8, difficulty: "moderate", estimatedTimeframe: "3-6 months", suggestedTab: "/portal/mortgage-killer" });
      }
      if ((input.iraBalance ?? 0) > 200000 && input.age < 65) {
        recs.push({ category: "tax_strategy", title: "Start Roth Conversion Ladder",
          description: "Convert traditional IRA funds to Roth over 5-10 years to minimize lifetime tax burden and create tax-free income in retirement.",
          scoreImpact: 10, difficulty: "moderate", estimatedTimeframe: "1-2 years", suggestedTab: "/portal/roth-conversion" });
      }
      recs.push({ category: "savings", title: "Increase Savings Rate by 3%",
        description: "Boost your annual savings rate by just 3% to significantly improve your retirement readiness and goal achievability.",
        scoreImpact: 6, difficulty: "easy", estimatedTimeframe: "1 month", suggestedTab: "/portal/strategy" });
      recs.push({ category: "insurance", title: "Review Life Insurance Coverage",
        description: "Ensure your death benefit covers at least 10x your annual income. Consider an IUL for tax-free living benefits.",
        scoreImpact: 7, difficulty: "easy", estimatedTimeframe: "2-4 weeks", suggestedTab: "/portal/premium-financing" });
      recs.push({ category: "behavior", title: "Set Up Automatic Investing",
        description: "Automate monthly contributions to remove emotional decision-making and build consistent wealth.",
        scoreImpact: 5, difficulty: "easy", estimatedTimeframe: "1 week", suggestedTab: "/portal/strategy" });
      recs.push({ category: "asset_allocation", title: "Diversify with Fixed Index Annuity",
        description: "Add a floor of guaranteed income with upside potential. Protect against sequence-of-returns risk.",
        scoreImpact: 7, difficulty: "moderate", estimatedTimeframe: "1-2 months", suggestedTab: "/portal/growth-annuities" });
      recs.push({ category: "estate_planning", title: "Create or Update Estate Plan",
        description: "Ensure your wealth transfers efficiently to heirs. Review beneficiary designations and trust structures.",
        scoreImpact: 6, difficulty: "challenging", estimatedTimeframe: "2-3 months", suggestedTab: "/portal/estate-tax" });
      recs.push({ category: "education", title: "Complete Financial Literacy Module",
        description: "Take 30 minutes to review our education hub content on tax-advantaged strategies.",
        scoreImpact: 5, difficulty: "easy", estimatedTimeframe: "30 minutes", suggestedTab: "/portal/education" });
      if (input.age >= 50) {
        recs.push({ category: "retirement_timing", title: "Optimize Social Security Timing",
          description: "Delaying Social Security from 62 to 70 can increase benefits by 76%. Run the analysis to find your optimal age.",
          scoreImpact: 9, difficulty: "moderate", estimatedTimeframe: "1 hour", suggestedTab: "/portal/social-security" });
      }
      recs.push({ category: "spending", title: "Track and Reduce Discretionary Spending",
        description: "Identify and cut 10% of discretionary spending to redirect toward wealth-building.",
        scoreImpact: 5, difficulty: "easy", estimatedTimeframe: "2 weeks", suggestedTab: "/portal/strategy" });

      // Insert all recommendations
      for (const rec of recs) {
        await db.insert(clientRecommendations).values({
          clientId: input.clientId, workspaceId: input.workspaceId, ...rec,
        });
      }
      return { count: recs.length, recommendations: recs };
    }),

    accept: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(clientRecommendations).set({ isAccepted: true }).where(eq(clientRecommendations.id, input.id));
      return { success: true };
    }),

    complete: protectedProcedure.input(z.object({ id: z.number(), clientId: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Mark recommendation as completed
      const recs = await db.select().from(clientRecommendations).where(eq(clientRecommendations.id, input.id)).limit(1);
      if (recs.length === 0) throw new Error("Recommendation not found");
      await db.update(clientRecommendations).set({ isCompleted: true, completedAt: new Date() }).where(eq(clientRecommendations.id, input.id));
      // Boost the client's score
      const scores = await db.select().from(clientScores).where(and(eq(clientScores.clientId, input.clientId), eq(clientScores.workspaceId, ws.id))).limit(1);
      if (scores.length > 0) {
        const newScore = Math.min(100, scores[0].overallScore + recs[0].scoreImpact);
        const newPoints = scores[0].totalPointsEarned + recs[0].scoreImpact;
        // Determine level
        const levelThresholds = [0, 20, 30, 40, 50, 60, 70, 80, 90, 95];
        const levelNames = ["Starter", "Explorer", "Builder", "Strategist", "Optimizer", "Achiever", "Wealth Guardian", "Legacy Builder", "Financial Master", "Legendary"];
        let newLevel = 1;
        for (let i = levelThresholds.length - 1; i >= 0; i--) {
          if (newScore >= levelThresholds[i]) { newLevel = i + 1; break; }
        }
        await db.update(clientScores).set({
          overallScore: newScore, totalPointsEarned: newPoints,
          level: newLevel, levelName: levelNames[newLevel - 1],
        }).where(eq(clientScores.clientId, input.clientId));
        return { success: true, newScore, newLevel, levelName: levelNames[newLevel - 1], pointsEarned: recs[0].scoreImpact };
      }
      return { success: true, newScore: 0, newLevel: 1, levelName: "Starter", pointsEarned: recs[0].scoreImpact };
    }),
  }),

  // ─── Session Ratings ──────────────────────────────────────────────────
  sessionRatings: router({
     list: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const client = await getClientById(input.clientId, ws.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found in your workspace" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(clientSessionRatings).where(and(eq(clientSessionRatings.clientId, input.clientId), eq(clientSessionRatings.workspaceId, ws.id))).orderBy(desc(clientSessionRatings.createdAt));
    }),
    rate: protectedProcedure.input(z.object({
      clientId: z.number(), workspaceId: z.number(),
      sessionId: z.number().optional(),
      rating: z.number().min(1).max(10),
      explanation: z.string().optional(),
      behaviors: z.array(z.string()).optional(),
      actions: z.array(z.string()).optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db.insert(clientSessionRatings).values({
        clientId: input.clientId, workspaceId: input.workspaceId,
        sessionId: input.sessionId ?? null,
        rating: String(input.rating),
        explanation: input.explanation ?? null,
        behaviors: input.behaviors ?? null,
        actions: input.actions ?? null,
      });
      return { id: row.insertId };
    }),

    aiRate: protectedProcedure.input(z.object({
      clientId: z.number(), workspaceId: z.number(),
      sessionNotes: z.string(),
      tabsVisited: z.array(z.string()).optional(),
      actionsPerformed: z.array(z.string()).optional(),
      duration: z.number().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `${SYSTEM_PREAMBLE} You are a financial advisor session evaluator. Rate the client session on a scale of 1-10 based on engagement, learning, and progress toward financial goals. Return JSON with: rating (1-10), explanation (2-3 sentences), behaviors (array of 3-5 observed behaviors), actions (array of 2-4 recommended next actions), scoreImpact (number 0.1-1.0 representing potential score improvement), learningApproach (1-2 sentences on recommended learning style).` },
          { role: "user", content: `Session notes: ${input.sessionNotes}\nTabs visited: ${(input.tabsVisited ?? []).join(", ")}\nActions: ${(input.actionsPerformed ?? []).join(", ")}\nDuration: ${input.duration ?? 0} minutes` },
        ],
        response_format: {
          type: "json_schema" as const,
          json_schema: {
            name: "session_rating",
            strict: true,
            schema: {
              type: "object",
              properties: {
                rating: { type: "integer", description: "Session rating 1-10" },
                explanation: { type: "string", description: "2-3 sentence explanation" },
                behaviors: { type: "array", items: { type: "string" }, description: "3-5 observed behaviors" },
                actions: { type: "array", items: { type: "string" }, description: "2-4 recommended actions" },
                scoreImpact: { type: "number", description: "Score improvement 0.1-1.0" },
                learningApproach: { type: "string", description: "Recommended learning approach" },
              },
              required: ["rating", "explanation", "behaviors", "actions", "scoreImpact", "learningApproach"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response.choices[0].message.content;
      const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : "{}");
      const [row] = await db.insert(clientSessionRatings).values({
        clientId: input.clientId, workspaceId: input.workspaceId,
        rating: String(parsed.rating ?? 5),
        explanation: parsed.explanation ?? null,
        behaviors: parsed.behaviors ?? null,
        actions: parsed.actions ?? null,
      });
      // Send email if client has email
      const clientRows = await db.select().from(clients).where(and(eq(clients.id, input.clientId), eq(clients.workspaceId, input.workspaceId))).limit(1);
      if (clientRows[0]?.email) {
        const { sendSessionRatingEmail } = await import("./email");
        const ratingEmojis = ["😟", "😕", "😐", "🙂", "😊", "😄", "🌟", "⭐", "🏆", "👑"];
        await sendSessionRatingEmail({
          toEmail: clientRows[0].email,
          clientName: clientRows[0].name ?? "Client",
          sessionDate: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          rating: parsed.rating ?? 5,
          ratingEmoji: ratingEmojis[Math.min(9, Math.max(0, (parsed.rating ?? 5) - 1))],
          summary: parsed.explanation ?? "",
          keyBehaviors: parsed.behaviors ?? [],
          actionItems: parsed.actions ?? [],
          scoreImpact: parsed.scoreImpact ?? 0.1,
          learningApproach: parsed.learningApproach ?? "",
        });
      }
      return { id: row.insertId, ...parsed };
    }),

    sendEncouragement: protectedProcedure.input(z.object({
      clientId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const clientRows = await db.select().from(clients).where(and(eq(clients.id, input.clientId), eq(clients.workspaceId, ws.id))).limit(1);
      if (!clientRows[0]?.email) throw new Error("Client has no email address");
      const client = clientRows[0];
      // Get score from notes or default
      const scoreMatch = client.notes?.match(/Financial Score: (\d+)\/100/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
      const LEVEL_NAMES = ["Starter", "Explorer", "Builder", "Strategist", "Optimizer", "Achiever", "Wealth Guardian", "Legacy Builder", "Financial Master", "Legendary"];
      const LEVEL_EMOJIS = ["🌱", "🧭", "🔨", "♟️", "⚡", "🏅", "🛡️", "🏛️", "💎", "👑"];
      const thresholds = [0, 20, 30, 40, 50, 60, 70, 80, 90, 95];
      let level = 1;
      for (let i = thresholds.length - 1; i >= 0; i--) { if (score >= thresholds[i]) { level = i + 1; break; } }
      const nextLevel = Math.min(level + 1, 10);
      const pointsToNext = level >= 10 ? 0 : thresholds[nextLevel - 1] - score;
      const { sendEncouragingEmail, getRandomWeeklyTip } = await import("./email");
      const result = await sendEncouragingEmail({
        toEmail: client.email!,
        clientName: client.name ?? "Client",
        currentScore: score,
        currentLevel: level,
        levelName: LEVEL_NAMES[level - 1],
        levelEmoji: LEVEL_EMOJIS[level - 1],
        nextLevelName: LEVEL_NAMES[nextLevel - 1],
        nextLevelEmoji: LEVEL_EMOJIS[nextLevel - 1],
        pointsToNextLevel: Math.max(0, pointsToNext),
        weeklyTip: getRandomWeeklyTip(),
      });
      return result;
    }),
  }),

  // ─── Tax Return OCR Extraction ──────────────────────────────────────────
  taxReturnOcr: router({
    // Upload tax return PDF and extract data via LLM
    uploadAndExtract: protectedProcedure.input(z.object({
      clientId: z.number(),
      fileName: z.string(),
      fileBase64: z.string(),
      contentType: z.string().default("application/pdf"),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      // Upload to S3
      const buffer = Buffer.from(input.fileBase64, "base64");
      const suffix = randomBytes(6).toString("hex");
      const key = `tax-returns/${ws.id}/${input.clientId}/${suffix}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      // Save as client document
      await uploadClientDocument({
        clientId: input.clientId, workspaceId: ws.id,
        name: input.fileName, fileKey: key, url,
        mimeType: input.contentType, sizeBytes: buffer.length,
        category: "TAX_RETURN", uploadedBy: ctx.user.id,
        uploadedByName: ctx.user.name ?? ctx.user.email ?? "Unknown",
      });
      // Extract data via LLM
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PREAMBLE} You are a tax return data extractor. Extract the following fields from the uploaded tax return document (1040, W-2, 1099, etc.). Return ONLY valid JSON with these exact keys:
{
  "filingStatus": string ("single", "married_filing_jointly", "married_filing_separately", "head_of_household", "qualifying_widow"),
  "taxYear": number (e.g. 2025),
  "grossIncome": number (total gross income),
  "adjustedGrossIncome": number (AGI),
  "taxableIncome": number (taxable income after deductions),
  "totalTaxLiability": number (total federal tax owed),
  "effectiveTaxRate": number (as decimal, e.g. 0.22 for 22%),
  "marginalTaxBracket": number (as decimal, e.g. 0.24 for 24%),
  "standardOrItemized": string ("standard" or "itemized"),
  "totalDeductions": number (total deductions amount),
  "wagesAndSalaries": number (W-2 wages),
  "interestIncome": number (interest income),
  "dividendIncome": number (dividend income),
  "capitalGains": number (net capital gains/losses),
  "businessIncome": number (Schedule C or pass-through income),
  "rentalIncome": number (Schedule E rental income),
  "socialSecurityIncome": number (Social Security benefits received),
  "retirementDistributions": number (IRA/401k distributions),
  "stateAndLocalTaxes": number (SALT deduction),
  "mortgageInterest": number (mortgage interest deduction),
  "charitableContributions": number (charitable giving),
  "iraContributions": number (IRA contributions),
  "estimatedTaxPayments": number (quarterly estimated payments),
  "refundOrOwed": number (positive = refund, negative = owed),
  "dependents": number (number of dependents claimed),
  "primaryFilerName": string (name on return),
  "spouseName": string (spouse name if joint, empty string if not)
}
If a field cannot be determined, use 0 for numbers and "unknown" for strings. Be precise with rates — convert percentage to decimal.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Please extract the tax return data from this document: ${input.fileName}` },
              { type: "file_url", file_url: { url, mime_type: "application/pdf" } },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "tax_return_extraction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                filingStatus: { type: "string" },
                taxYear: { type: "number" },
                grossIncome: { type: "number" },
                adjustedGrossIncome: { type: "number" },
                taxableIncome: { type: "number" },
                totalTaxLiability: { type: "number" },
                effectiveTaxRate: { type: "number" },
                marginalTaxBracket: { type: "number" },
                standardOrItemized: { type: "string" },
                totalDeductions: { type: "number" },
                wagesAndSalaries: { type: "number" },
                interestIncome: { type: "number" },
                dividendIncome: { type: "number" },
                capitalGains: { type: "number" },
                businessIncome: { type: "number" },
                rentalIncome: { type: "number" },
                socialSecurityIncome: { type: "number" },
                retirementDistributions: { type: "number" },
                stateAndLocalTaxes: { type: "number" },
                mortgageInterest: { type: "number" },
                charitableContributions: { type: "number" },
                iraContributions: { type: "number" },
                estimatedTaxPayments: { type: "number" },
                refundOrOwed: { type: "number" },
                dependents: { type: "number" },
                primaryFilerName: { type: "string" },
                spouseName: { type: "string" },
              },
              required: ["filingStatus", "taxYear", "grossIncome", "adjustedGrossIncome", "taxableIncome", "totalTaxLiability", "effectiveTaxRate", "marginalTaxBracket", "standardOrItemized", "totalDeductions", "wagesAndSalaries", "interestIncome", "dividendIncome", "capitalGains", "businessIncome", "rentalIncome", "socialSecurityIncome", "retirementDistributions", "stateAndLocalTaxes", "mortgageInterest", "charitableContributions", "iraContributions", "estimatedTaxPayments", "refundOrOwed", "dependents", "primaryFilerName", "spouseName"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to extract tax return data" });
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      try {
        const extracted = JSON.parse(content);
        // Log activity
        await logClientActivity({
          clientId: input.clientId, workspaceId: ws.id,
          action: "TAX_RETURN_EXTRACTED",
          actorName: ctx.user.name ?? ctx.user.email ?? "Unknown",
          actorUserId: ctx.user.id,
          summary: `Tax return extracted: ${extracted.taxYear} ${extracted.filingStatus} — AGI $${extracted.adjustedGrossIncome?.toLocaleString()}`,
          metadata: { taxYear: extracted.taxYear, filingStatus: extracted.filingStatus, agi: extracted.adjustedGrossIncome },
        });
        return { fileUrl: url, extracted };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Invalid extraction result" });
      }
    }),

    // Extract from already-uploaded document URL
    extractFromUrl: protectedProcedure.input(z.object({
      fileUrl: z.string().url(),
      fileName: z.string(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PREAMBLE} You are a tax return data extractor. Extract key financial data from this tax document. Return ONLY valid JSON with keys: filingStatus, taxYear, grossIncome, adjustedGrossIncome, taxableIncome, totalTaxLiability, effectiveTaxRate, marginalTaxBracket, wagesAndSalaries, interestIncome, dividendIncome, capitalGains, businessIncome, rentalIncome, socialSecurityIncome, retirementDistributions, totalDeductions, stateAndLocalTaxes, mortgageInterest, charitableContributions, dependents, primaryFilerName, spouseName. Use 0 for unknown numbers, "unknown" for unknown strings.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Extract tax return data from: ${input.fileName}` },
              { type: "file_url", file_url: { url: input.fileUrl, mime_type: "application/pdf" } },
            ],
          },
        ],
      });
      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to extract" });
      try {
        return JSON.parse(typeof rawContent === "string" ? rawContent : "{}");
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Invalid extraction" });
      }
    }),
  }),

  // Hidden Material is protected by managed OAuth admin authorization.
  hiddenMaterial: router({
    verifyPassword: adminProcedure
      .input(z.object({ password: z.string().optional() }))
      .mutation(() => ({ verified: true, access: "managed_oauth" as const })),
    requestResetCode: adminProcedure.mutation(() => ({
      sent: false,
      message: "Password reset is retired; access is controlled by managed OAuth roles.",
    })),
    resetPassword: adminProcedure
      .input(z.object({ code: z.string(), newPassword: z.string() }))
      .mutation(() => ({
        success: false,
        message: "Password reset is retired; access is controlled by managed OAuth roles.",
      })),
  }),

  // ─── Tutorial Progresss ──────────────────────────────────────────────────────
  tutorial: router({
    getProgress: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(tutorialProgress).where(eq(tutorialProgress.userId, ctx.user.id)).limit(1);
      return rows[0] || null;
    }),
    saveProgress: protectedProcedure.input(z.object({
      role: z.enum(["solo_agent", "team_lead"]).optional(),
      questionnaireAnswers: z.record(z.string(), z.any()).optional(),
      questionnaireCompleted: z.boolean().optional(),
      completedSections: z.array(z.string()).optional(),
      completedSubSections: z.array(z.string()).optional(),
      currentStep: z.number().optional(),
      score: z.number().min(0).max(100).optional(),
      badges: z.array(z.object({ id: z.string(), name: z.string(), emoji: z.string(), description: z.string(), earnedAt: z.string() })).optional(),
      totalPointsEarned: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(tutorialProgress).where(eq(tutorialProgress.userId, ctx.user.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(tutorialProgress).values({ userId: ctx.user.id, ...input } as any);
      } else {
        await db.update(tutorialProgress).set(input as any).where(eq(tutorialProgress.userId, ctx.user.id));
      }
      return { success: true };
    }),
    completeSection: protectedProcedure.input(z.object({
      sectionId: z.string(),
      pointsEarned: z.number().default(10),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(tutorialProgress).where(eq(tutorialProgress.userId, ctx.user.id)).limit(1);
      const current = existing[0];
      const sections: string[] = current?.completedSections ? [...current.completedSections] : [];
      if (!sections.includes(input.sectionId)) sections.push(input.sectionId);
      const newPoints = (current?.totalPointsEarned || 0) + input.pointsEarned;
      const newScore = Math.min(100, Math.round((sections.length / 20) * 100));
      if (current) {
        await db.update(tutorialProgress).set({ completedSections: sections, totalPointsEarned: newPoints, score: newScore }).where(eq(tutorialProgress.userId, ctx.user.id));
      } else {
        await db.insert(tutorialProgress).values({ userId: ctx.user.id, completedSections: sections, totalPointsEarned: newPoints, score: newScore } as any);
      }
      return { success: true, sections, totalPoints: newPoints, score: newScore };
    }),
    resetProgress: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(tutorialProgress).where(eq(tutorialProgress.userId, ctx.user.id));
      return { success: true };
    }),
  }),

  // ─── Agency Team Management & Supervisor Monitoring ──────────────────────────
  agency: router({
    // Check if current user is the platform owner (Sam Russell)
    isOwner: protectedProcedure.query(({ ctx }) => {
      return { isOwner: ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin" };
    }),

    // Check if current user has signed their monitoring agreement (for downline agents)
    checkAgreementStatus: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Check if user is a team member anywhere
      const memberRows = await db.select().from(agencyTeamMembers)
        .where(and(eq(agencyTeamMembers.userId, ctx.user.id), eq(agencyTeamMembers.role, "agent")))
        .limit(1);
      if (memberRows.length === 0) return { isDownlineAgent: false, agreementSigned: true, teamId: null, teamName: null, supervisorName: null };
      const member = memberRows[0];
      // Get team info
      const teamRows = await db.select().from(agencyTeams).where(eq(agencyTeams.id, member.teamId)).limit(1);
      const team = teamRows[0];
      return {
        isDownlineAgent: true,
        agreementSigned: member.agreementSigned,
        teamId: member.teamId,
        teamName: team?.name ?? "Unknown Team",
        supervisorName: team?.supervisorName ?? "Unknown Supervisor",
        memberId: member.id,
      };
    }),

    // Sign the supervisor monitoring agreement
    signMonitoringAgreement: protectedProcedure.input(z.object({
      teamId: z.number(),
      signatureName: z.string().min(2),
      signatureDate: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Get team info
      const teamRows = await db.select().from(agencyTeams).where(eq(agencyTeams.id, input.teamId)).limit(1);
      if (!teamRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      const team = teamRows[0];
      const agreementText = `SUPERVISOR MONITORING AGREEMENT\n\nI, ${input.signatureName}, hereby acknowledge and agree to the following terms as a condition of accessing the Russell Capital Systems™ platform as a member of ${team.name} under the supervision of ${team.supervisorName}:\n\n1. MONITORING CONSENT: I understand and consent that my supervisor (${team.supervisorName}) and the platform administrator (Sam Russell) will have access to monitor my activity on this platform, including but not limited to:\n   - Login times, dates, and session durations\n   - Pages visited and time spent on each feature\n   - Client records I create, view, or modify\n   - Lead information I access or manage\n   - Strategy presentations and calculations I generate\n   - All interactions with platform tools and features\n\n2. CLIENT DATA ACCESS: I understand that my supervisor may view all client data, lead information, and business activity associated with my account for the purposes of quality assurance, compliance, training, and team performance management.\n\n3. CONFIDENTIALITY: I agree to maintain the confidentiality of all client data, proprietary strategies, and platform features. I will not share client information with unauthorized parties.\n\n4. COMPLIANCE: I agree to use the platform in accordance with all applicable laws, regulations, and industry standards, including but not limited to insurance licensing requirements and fiduciary duties.\n\n5. DATA PROTECTION: I understand that all data I input into the platform is protected by enterprise-grade security measures and that access is strictly controlled based on role permissions.\n\n6. TERMINATION: I understand that failure to comply with these terms may result in suspension or termination of my platform access.\n\nBy signing below, I confirm that I have read, understood, and agree to all terms stated above.\n\nSigned: ${input.signatureName}\nDate: ${input.signatureDate}\nTeam: ${team.name}\nSupervisor: ${team.supervisorName}`;

      const ipAddress = ctx.req.headers["x-forwarded-for"]?.toString() || ctx.req.socket.remoteAddress || "unknown";
      const userAgent = ctx.req.headers["user-agent"] || "unknown";

      // Store the monitoring agreement
      await db.insert(supervisorMonitoringAgreements).values({
        userId: ctx.user.id,
        userName: ctx.user.name ?? input.signatureName,
        userEmail: ctx.user.email ?? "",
        teamId: input.teamId,
        teamName: team.name,
        supervisorId: team.supervisorId,
        supervisorName: team.supervisorName,
        signatureName: input.signatureName,
        signatureDate: input.signatureDate,
        agreementText,
        ipAddress,
        userAgent,
      });

      // Store as legal document (for supervisor's records)
      await db.insert(legalDocuments).values({
        documentType: "supervisor_monitoring_agreement",
        title: `Monitoring Agreement — ${input.signatureName} (${team.name})`,
        signerUserId: ctx.user.id,
        signerName: input.signatureName,
        signerEmail: ctx.user.email ?? "",
        relatedTeamId: team.id,
        relatedTeamName: team.name,
        supervisorId: team.supervisorId,
        supervisorName: team.supervisorName,
        signatureName: input.signatureName,
        signatureDate: input.signatureDate,
        documentContent: agreementText,
        ipAddress,
        userAgent,
      });

      // Store duplicate legal document (for Sam's master records)
      await db.insert(legalDocuments).values({
        documentType: "supervisor_monitoring_agreement",
        title: `[MASTER COPY] Monitoring Agreement — ${input.signatureName} (${team.name})`,
        signerUserId: ctx.user.id,
        signerName: input.signatureName,
        signerEmail: ctx.user.email ?? "",
        relatedTeamId: team.id,
        relatedTeamName: team.name,
        supervisorId: team.supervisorId,
        supervisorName: team.supervisorName,
        signatureName: input.signatureName,
        signatureDate: input.signatureDate,
        documentContent: agreementText,
        ipAddress,
        userAgent,
      });

      // Update team member status
      await db.update(agencyTeamMembers)
        .set({ agreementSigned: true, agreementSignedAt: new Date(), status: "active", joinedAt: new Date() })
        .where(and(eq(agencyTeamMembers.userId, ctx.user.id), eq(agencyTeamMembers.teamId, input.teamId)));

      return { success: true };
    }),

    // ─── Team CRUD (for supervisors) ──────────────────────────────────────
    createTeam: protectedProcedure.input(z.object({
      name: z.string().min(2).max(300),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(agencyTeams).values({
        name: input.name,
        supervisorId: ctx.user.id,
        supervisorName: ctx.user.name ?? "Unknown",
        supervisorEmail: ctx.user.email ?? "",
        workspaceId: ws.id,
        description: input.description ?? null,
      });
      // Add supervisor as team member
      await db.insert(agencyTeamMembers).values({
        teamId: result[0].insertId,
        userId: ctx.user.id,
        userName: ctx.user.name ?? "Unknown",
        userEmail: ctx.user.email ?? "",
        role: "supervisor",
        status: "active",
        agreementSigned: true,
        agreementSignedAt: new Date(),
        joinedAt: new Date(),
      });
      return { id: result[0].insertId, name: input.name };
    }),

    listMyTeams: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Teams where user is supervisor
      const supervisedTeams = await db.select().from(agencyTeams)
        .where(eq(agencyTeams.supervisorId, ctx.user.id))
        .orderBy(desc(agencyTeams.createdAt));
      // Teams where user is a member
      const memberTeamIds = await db.select({ teamId: agencyTeamMembers.teamId })
        .from(agencyTeamMembers)
        .where(and(eq(agencyTeamMembers.userId, ctx.user.id), eq(agencyTeamMembers.role, "agent")));
      const memberTeams = memberTeamIds.length > 0
        ? await db.select().from(agencyTeams).where(inArray(agencyTeams.id, memberTeamIds.map(m => m.teamId)))
        : [];
      return { supervisedTeams, memberTeams };
    }),

    // Add a downline agent to a team (supervisor only)
    addTeamMember: protectedProcedure.input(z.object({
      teamId: z.number(),
      userName: z.string().min(1),
      userEmail: z.string().email(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Verify caller is the supervisor
      const teamRows = await db.select().from(agencyTeams)
        .where(and(eq(agencyTeams.id, input.teamId), eq(agencyTeams.supervisorId, ctx.user.id))).limit(1);
      if (!teamRows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Only the team supervisor can add members" });
      // Check if email already registered as a user
      const existingUser = await db.select().from(clients).limit(0); // placeholder
      const result = await db.insert(agencyTeamMembers).values({
        teamId: input.teamId,
        userId: 0, // Will be linked when user registers and logs in with this email
        userName: input.userName,
        userEmail: input.userEmail,
        role: "agent",
        status: "pending",
        agreementSigned: false,
      });
      return { id: result[0].insertId, status: "pending" };
    }),

    // List team members (supervisor only)
    listTeamMembers: protectedProcedure.input(z.object({
      teamId: z.number(),
    })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Verify caller is supervisor or platform owner
      const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
      if (!isOwner) {
        const teamRows = await db.select().from(agencyTeams)
          .where(and(eq(agencyTeams.id, input.teamId), eq(agencyTeams.supervisorId, ctx.user.id))).limit(1);
        if (!teamRows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      return db.select().from(agencyTeamMembers)
        .where(eq(agencyTeamMembers.teamId, input.teamId))
        .orderBy(asc(agencyTeamMembers.role), asc(agencyTeamMembers.userName));
    }),

    // Remove a team member (supervisor only)
    removeTeamMember: protectedProcedure.input(z.object({
      memberId: z.number(),
      teamId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const teamRows = await db.select().from(agencyTeams)
        .where(and(eq(agencyTeams.id, input.teamId), eq(agencyTeams.supervisorId, ctx.user.id))).limit(1);
      if (!teamRows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Only the team supervisor can remove members" });
      await db.update(agencyTeamMembers)
        .set({ status: "removed" })
        .where(eq(agencyTeamMembers.id, input.memberId));
      return { success: true };
    }),

    // ─── Activity Monitoring (supervisor + owner) ─────────────────────────
    getTeamActivity: protectedProcedure.input(z.object({
      teamId: z.number(),
      days: z.number().min(1).max(90).default(30),
    })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
      if (!isOwner) {
        const teamRows = await db.select().from(agencyTeams)
          .where(and(eq(agencyTeams.id, input.teamId), eq(agencyTeams.supervisorId, ctx.user.id))).limit(1);
        if (!teamRows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      // Get team member userIds
      const members = await db.select().from(agencyTeamMembers)
        .where(and(eq(agencyTeamMembers.teamId, input.teamId), eq(agencyTeamMembers.role, "agent")));
      if (members.length === 0) return { sessions: [], pageActivity: [], members: [] };
      const userIds = members.filter(m => m.userId > 0).map(m => m.userId);
      if (userIds.length === 0) return { sessions: [], pageActivity: [], members };
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      // Get login sessions
      const sessions = await db.select().from(userSessions)
        .where(and(inArray(userSessions.userId, userIds), gte(userSessions.loginAt, since)))
        .orderBy(desc(userSessions.loginAt)).limit(500);
      // Get page activity
      const pageActivity = await db.select().from(pageActivityLogs)
        .where(and(inArray(pageActivityLogs.userId, userIds), gte(pageActivityLogs.enteredAt, since)))
        .orderBy(desc(pageActivityLogs.enteredAt)).limit(1000);
      return { sessions, pageActivity, members };
    }),

    // Get individual agent activity (supervisor or owner)
    getAgentActivity: protectedProcedure.input(z.object({
      agentUserId: z.number(),
      teamId: z.number(),
      days: z.number().min(1).max(90).default(30),
    })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
      if (!isOwner) {
        const teamRows = await db.select().from(agencyTeams)
          .where(and(eq(agencyTeams.id, input.teamId), eq(agencyTeams.supervisorId, ctx.user.id))).limit(1);
        if (!teamRows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      // Verify agent is in the team
      const memberRows = await db.select().from(agencyTeamMembers)
        .where(and(eq(agencyTeamMembers.teamId, input.teamId), eq(agencyTeamMembers.userId, input.agentUserId))).limit(1);
      if (!memberRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found in this team" });
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const sessions = await db.select().from(userSessions)
        .where(and(eq(userSessions.userId, input.agentUserId), gte(userSessions.loginAt, since)))
        .orderBy(desc(userSessions.loginAt));
      const pageActivity = await db.select().from(pageActivityLogs)
        .where(and(eq(pageActivityLogs.userId, input.agentUserId), gte(pageActivityLogs.enteredAt, since)))
        .orderBy(desc(pageActivityLogs.enteredAt));
      // Get client count for this agent's workspace
      const agentWs = await db.select().from(workspacesTable).where(eq(workspacesTable.ownerId, input.agentUserId)).limit(1);
      let clientCount = 0;
      if (agentWs[0]) {
        const countResult = await db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.workspaceId, agentWs[0].id));
        clientCount = countResult[0]?.count ?? 0;
      }
      return { sessions, pageActivity, member: memberRows[0], clientCount };
    }),

    // ─── Legal Documents (owner only) ─────────────────────────────────────
    listAllTeams: protectedProcedure.query(async ({ ctx }) => {
      const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
      if (!isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Only the platform owner can view all teams" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const teams = await db.select().from(agencyTeams).orderBy(desc(agencyTeams.createdAt));
      // Get member counts for each team
      const teamIds = teams.map(t => t.id);
      const memberCounts = teamIds.length > 0
        ? await db.select({ teamId: agencyTeamMembers.teamId, count: sql<number>`count(*)` })
            .from(agencyTeamMembers)
            .where(inArray(agencyTeamMembers.teamId, teamIds))
            .groupBy(agencyTeamMembers.teamId)
        : [];
      const countMap = Object.fromEntries(memberCounts.map(m => [m.teamId, m.count]));
      return teams.map(t => ({ ...t, memberCount: countMap[t.id] ?? 0 }));
    }),

    listLegalDocuments: protectedProcedure.input(z.object({
      teamId: z.number().optional(),
      documentType: z.string().optional(),
    })).query(async ({ ctx, input }) => {
      const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
      // Supervisors can see docs for their own teams
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (isOwner) {
        // Owner sees all master copies
        let query = db.select().from(legalDocuments).where(
          input.teamId ? and(eq(legalDocuments.relatedTeamId, input.teamId)) : undefined
        ).orderBy(desc(legalDocuments.signedAt));
        return query;
      }
      // Supervisor sees docs for their teams only
      const myTeams = await db.select().from(agencyTeams).where(eq(agencyTeams.supervisorId, ctx.user.id));
      if (myTeams.length === 0) return [];
      const myTeamIds = myTeams.map(t => t.id);
      return db.select().from(legalDocuments)
        .where(and(
          inArray(legalDocuments.relatedTeamId, myTeamIds),
          input.teamId ? eq(legalDocuments.relatedTeamId, input.teamId) : undefined
        ))
        .orderBy(desc(legalDocuments.signedAt));
    }),

    getLegalDocument: protectedProcedure.input(z.object({
      documentId: z.number(),
    })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(legalDocuments).where(eq(legalDocuments.id, input.documentId)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      const doc = rows[0];
      const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
      if (!isOwner) {
        // Check if supervisor of this team
        if (doc.relatedTeamId) {
          const teamRows = await db.select().from(agencyTeams)
            .where(and(eq(agencyTeams.id, doc.relatedTeamId), eq(agencyTeams.supervisorId, ctx.user.id))).limit(1);
          if (!teamRows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        } else {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
      }
      return doc;
    }),

    // ─── Owner Master Oversight ───────────────────────────────────────────
    getOwnerDashboard: protectedProcedure.query(async ({ ctx }) => {
      const isOwner = ctx.user.openId === ENV.ownerOpenId || ctx.user.role === "admin";
      if (!isOwner) throw new TRPCError({ code: "FORBIDDEN", message: "Owner access only" });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const totalTeams = await db.select({ count: sql<number>`count(*)` }).from(agencyTeams);
      const totalMembers = await db.select({ count: sql<number>`count(*)` }).from(agencyTeamMembers);
      const totalAgreements = await db.select({ count: sql<number>`count(*)` }).from(supervisorMonitoringAgreements);
      const totalLegalDocs = await db.select({ count: sql<number>`count(*)` }).from(legalDocuments);
      const pendingMembers = await db.select({ count: sql<number>`count(*)` }).from(agencyTeamMembers)
        .where(eq(agencyTeamMembers.status, "pending"));
      const unsignedMembers = await db.select({ count: sql<number>`count(*)` }).from(agencyTeamMembers)
        .where(and(eq(agencyTeamMembers.role, "agent"), eq(agencyTeamMembers.agreementSigned, false)));
      // Recent activity
      const recentSessions = await db.select().from(userSessions)
        .orderBy(desc(userSessions.loginAt)).limit(20);
      return {
        totalTeams: totalTeams[0]?.count ?? 0,
        totalMembers: totalMembers[0]?.count ?? 0,
        totalAgreements: totalAgreements[0]?.count ?? 0,
        totalLegalDocs: totalLegalDocs[0]?.count ?? 0,
        pendingMembers: pendingMembers[0]?.count ?? 0,
        unsignedMembers: unsignedMembers[0]?.count ?? 0,
        recentSessions,
      };
    }),
  }),

  // ─── Opt-In Leaderboard & Fastest Climbers ─────────────────────────────────
  competitionBoard: router({
    // Get or create the user's leaderboard profile
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return null;
      const [profile] = await db.select().from(leaderboardProfiles)
        .where(and(eq(leaderboardProfiles.userId, ctx.user.id), eq(leaderboardProfiles.workspaceId, ws.id)))
        .limit(1);
      return profile ?? null;
    }),

    // Setup profile: pick handle, opt in/out, set baseline commissions
    setupProfile: protectedProcedure.input(z.object({
      handle: z.string().min(2).max(50),
      useRealName: z.boolean(),
      baselineAnnualCommissions: z.number().min(0).optional(),
      optIn: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Check handle uniqueness
      if (!input.useRealName) {
        const [existing] = await db.select().from(leaderboardProfiles)
          .where(and(eq(leaderboardProfiles.handle, input.handle), eq(leaderboardProfiles.workspaceId, ws.id)))
          .limit(1);
        if (existing && existing.userId !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "Handle already taken. Choose a different codename." });
        }
      }
      const [existingProfile] = await db.select().from(leaderboardProfiles)
        .where(and(eq(leaderboardProfiles.userId, ctx.user.id), eq(leaderboardProfiles.workspaceId, ws.id)))
        .limit(1);
      const now = new Date();
      if (existingProfile) {
        await db.update(leaderboardProfiles).set({
          handle: input.useRealName ? (ctx.user.name ?? input.handle) : input.handle,
          useRealName: input.useRealName,
          currentlyOptedIn: input.optIn,
          baselineAnnualCommissions: input.baselineAnnualCommissions?.toString() ?? existingProfile.baselineAnnualCommissions,
        }).where(eq(leaderboardProfiles.id, existingProfile.id));
      } else {
        await db.insert(leaderboardProfiles).values({
          userId: ctx.user.id,
          workspaceId: ws.id,
          handle: input.useRealName ? (ctx.user.name ?? input.handle) : input.handle,
          useRealName: input.useRealName,
          currentlyOptedIn: input.optIn,
          baselineAnnualCommissions: input.baselineAnnualCommissions?.toString() ?? null,
          platformJoinDate: now,
        });
      }
      // Also record monthly consent
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const [existingConsent] = await db.select().from(leaderboardConsents)
        .where(and(
          eq(leaderboardConsents.userId, ctx.user.id),
          eq(leaderboardConsents.workspaceId, ws.id),
          eq(leaderboardConsents.month, month),
          eq(leaderboardConsents.year, year),
        )).limit(1);
      if (existingConsent) {
        await db.update(leaderboardConsents).set({ optedIn: input.optIn, respondedAt: now })
          .where(eq(leaderboardConsents.id, existingConsent.id));
      } else {
        await db.insert(leaderboardConsents).values({
          userId: ctx.user.id, workspaceId: ws.id, month, year, optedIn: input.optIn, respondedAt: now,
        });
      }
      return { success: true };
    }),

    // Check if user needs monthly consent prompt
    needsMonthlyConsent: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { needsPrompt: false };
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return { needsPrompt: false };
      const [profile] = await db.select().from(leaderboardProfiles)
        .where(and(eq(leaderboardProfiles.userId, ctx.user.id), eq(leaderboardProfiles.workspaceId, ws.id)))
        .limit(1);
      if (!profile) return { needsPrompt: false, noProfile: true };
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const [consent] = await db.select().from(leaderboardConsents)
        .where(and(
          eq(leaderboardConsents.userId, ctx.user.id),
          eq(leaderboardConsents.workspaceId, ws.id),
          eq(leaderboardConsents.month, month),
          eq(leaderboardConsents.year, year),
        )).limit(1);
      return { needsPrompt: !consent, currentlyOptedIn: profile.currentlyOptedIn, handle: profile.handle };
    }),

    // Respond to monthly consent prompt
    respondMonthlyConsent: protectedProcedure.input(z.object({
      optIn: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      // Update profile opt-in status
      await db.update(leaderboardProfiles).set({ currentlyOptedIn: input.optIn })
        .where(and(eq(leaderboardProfiles.userId, ctx.user.id), eq(leaderboardProfiles.workspaceId, ws.id)));
      // Record consent
      const [existing] = await db.select().from(leaderboardConsents)
        .where(and(
          eq(leaderboardConsents.userId, ctx.user.id),
          eq(leaderboardConsents.workspaceId, ws.id),
          eq(leaderboardConsents.month, month),
          eq(leaderboardConsents.year, year),
        )).limit(1);
      if (existing) {
        await db.update(leaderboardConsents).set({ optedIn: input.optIn, respondedAt: now })
          .where(eq(leaderboardConsents.id, existing.id));
      } else {
        await db.insert(leaderboardConsents).values({
          userId: ctx.user.id, workspaceId: ws.id, month, year, optedIn: input.optIn, respondedAt: now,
        });
      }
      return { success: true };
    }),

    // Top 10 Production Board — only CLOSED_WON deals
    topProducers: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      // Get all opted-in profiles
      const profiles = await db.select().from(leaderboardProfiles)
        .where(and(eq(leaderboardProfiles.workspaceId, ws.id), eq(leaderboardProfiles.currentlyOptedIn, true)));
      if (profiles.length === 0) return [];
      // Get all CLOSED_WON deals for this workspace
      const closedDeals = await db.select().from(deals)
        .where(and(eq(deals.workspaceId, ws.id), eq(deals.stage, "CLOSED_WON")));
      // Get members to map userId to deal ownerName
      const members = await getMemberships(ws.id);
      // Build production data per opted-in user
      const results = profiles.map(profile => {
        const member = members.find(m => m.userId === profile.userId);
        if (!member) return null;
        const name = [member.userFirstName, member.userLastName].filter(Boolean).join(" ") || member.userName || "Advisor";
        const possibleNames = new Set([name, member.userName, member.userEmail].filter(Boolean) as string[]);
        const userDeals = closedDeals.filter(d => d.ownerName && possibleNames.has(d.ownerName));
        // Categorize by notes field keywords for life vs annuity
        const lifeDeals = userDeals.filter(d => {
          const n = (d.notes ?? "").toLowerCase();
          return n.includes("life") || n.includes("iul") || n.includes("ul") || n.includes("term") || n.includes("whole") || n.includes("insurance");
        });
        const annuityDeals = userDeals.filter(d => {
          const n = (d.notes ?? "").toLowerCase();
          return n.includes("annuity") || n.includes("fia") || n.includes("spia") || n.includes("dia") || n.includes("income rider");
        });
        // Deals not categorized count toward total but not sub-totals
        const totalClosedValue = userDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
        const annualLifePremium = lifeDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
        const monthlyAnnuityPremium = annuityDeals.reduce((s, d) => s + Number(d.value ?? 0) / 12, 0);
        return {
          userId: profile.userId,
          displayName: profile.useRealName ? name : profile.handle,
          isAnonymous: !profile.useRealName,
          totalClosedValue,
          annualLifePremium,
          monthlyAnnuityPremium,
          dealsWon: userDeals.length,
          lifeDeals: lifeDeals.length,
          annuityDeals: annuityDeals.length,
        };
      }).filter(Boolean) as Array<{
        userId: number; displayName: string; isAnonymous: boolean;
        totalClosedValue: number; annualLifePremium: number; monthlyAnnuityPremium: number;
        dealsWon: number; lifeDeals: number; annuityDeals: number;
      }>;
      // Sort by total closed value descending, take top 10
      results.sort((a, b) => b.totalClosedValue - a.totalClosedValue);
      return results.slice(0, 10).map((r, i) => ({ ...r, rank: i + 1 }));
    }),

    // Fastest Climbers — advisors trending 25%+ above baseline
    fastestClimbers: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) return [];
      // Get all profiles with baseline commissions
      const profiles = await db.select().from(leaderboardProfiles)
        .where(and(
          eq(leaderboardProfiles.workspaceId, ws.id),
          eq(leaderboardProfiles.currentlyOptedIn, true),
        ));
      if (profiles.length === 0) return [];
      const closedDeals = await db.select().from(deals)
        .where(and(eq(deals.workspaceId, ws.id), eq(deals.stage, "CLOSED_WON")));
      const members = await getMemberships(ws.id);
      const now = new Date();
      const climbers = profiles.map(profile => {
        const baseline = Number(profile.baselineAnnualCommissions ?? 0);
        if (baseline <= 0) return null; // Can't compute trend without baseline
        const member = members.find(m => m.userId === profile.userId);
        if (!member) return null;
        const name = [member.userFirstName, member.userLastName].filter(Boolean).join(" ") || member.userName || "Advisor";
        const possibleNames = new Set([name, member.userName, member.userEmail].filter(Boolean) as string[]);
        const userDeals = closedDeals.filter(d => d.ownerName && possibleNames.has(d.ownerName));
        const totalClosed = userDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);
        // Calculate months active on platform
        const joinDate = profile.platformJoinDate ?? profile.createdAt;
        const msActive = now.getTime() - new Date(joinDate).getTime();
        const monthsActive = Math.max(1, msActive / (1000 * 60 * 60 * 24 * 30.44));
        // Annualize: (total closed / months active) * 12
        const annualizedProduction = (totalClosed / monthsActive) * 12;
        // Percentage increase over baseline
        const percentIncrease = ((annualizedProduction - baseline) / baseline) * 100;
        // Only include if trending 25%+ above baseline
        if (percentIncrease < 25) return null;
        return {
          userId: profile.userId,
          displayName: profile.useRealName ? name : profile.handle,
          isAnonymous: !profile.useRealName,
          baselineAnnual: baseline,
          annualizedProduction: Math.round(annualizedProduction),
          percentIncrease: Math.round(percentIncrease * 10) / 10,
          monthsActive: Math.round(monthsActive * 10) / 10,
          totalClosed,
          dealsWon: userDeals.length,
          projectedAnnual: Math.round(annualizedProduction),
        };
      }).filter(Boolean) as Array<{
        userId: number; displayName: string; isAnonymous: boolean;
        baselineAnnual: number; annualizedProduction: number; percentIncrease: number;
        monthsActive: number; totalClosed: number; dealsWon: number; projectedAnnual: number;
      }>;
      // Sort by percent increase descending, take top 10
      climbers.sort((a, b) => b.percentIncrease - a.percentIncrease);
      return climbers.slice(0, 10).map((c, i) => ({ ...c, rank: i + 1 }));
    }),
  }),

  // ─── Payment Compliance (Legal Payment Folder) ──────────────────────────────
  paymentCompliance: router({
    sendPin: protectedProcedure.input(z.object({
      phone: z.string().min(10).max(20),
    })).mutation(async ({ ctx, input }) => {
      // Generate 6-digit code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

      await createSmsVerificationCode({
        userId: ctx.user.id,
        phone: input.phone,
        code,
        purpose: "payment_disclosure",
        verified: false,
        attempts: 0,
        expiresAt,
      });

      // Send via notification service (owner notification as SMS proxy)
      // In production, integrate a real SMS provider (Twilio, etc.)
      // For now, we use the notification system + log the code
      try {
        await notifyOwner({
          title: `Payment Verification PIN for ${ctx.user.name ?? ctx.user.email ?? "User #" + ctx.user.id}`,
          content: `Verification PIN: ${code}\nPhone: ${input.phone}\nExpires: ${expiresAt.toISOString()}\n\nThis PIN was requested for payment disclosure e-signature verification.`,
        });
      } catch (e) {
        console.warn("[PaymentCompliance] Failed to send PIN notification:", e);
      }

      console.log(`[PaymentCompliance] PIN ${code} sent to ${input.phone} for user ${ctx.user.id}`);
      return { sent: true, expiresAt: expiresAt.toISOString() };
    }),

    verifyPin: protectedProcedure.input(z.object({
      phone: z.string().min(10).max(20),
      code: z.string().length(6),
    })).mutation(async ({ ctx, input }) => {
      const record = await getLatestSmsCode(ctx.user.id, input.phone, "payment_disclosure");
      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No pending verification code found. Please request a new PIN." });
      }
      if (record.attempts >= 5) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please request a new PIN." });
      }
      if (new Date() > new Date(record.expiresAt)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Verification code has expired. Please request a new PIN." });
      }
      if (record.code !== input.code) {
        await incrementSmsAttempts(record.id);
        throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid code. ${4 - record.attempts} attempts remaining.` });
      }
      await markSmsCodeVerified(record.id);
      return { verified: true, verifiedAt: new Date().toISOString() };
    }),

    recordDisclosure: protectedProcedure.input(z.object({
      planSlug: z.string(),
      billingInterval: z.enum(["MONTHLY", "ANNUAL"]),
      priceAtAcceptance: z.string(),
      payorFirstName: z.string().min(1),
      payorLastName: z.string().min(1),
      payorBusinessEntity: z.string().optional(),
      payorAddress: z.string().min(1),
      payorCity: z.string().min(1),
      payorState: z.string().min(1),
      payorZip: z.string().min(1),
      payorPhone: z.string().min(10),
      payorEmail: z.string().email().optional(),
      signatureText: z.string().min(1),
      pinVerifiedAt: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getWorkspaceForUser(ctx.user.id);
      const ipAddress = ctx.req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim()
        ?? ctx.req.headers["x-real-ip"]?.toString()
        ?? ctx.req.socket?.remoteAddress
        ?? "unknown";
      const userAgent = ctx.req.headers["user-agent"] ?? "unknown";

      // Create signature hash from all identifying data
      const signatureData = [
        ctx.user.id, input.payorFirstName, input.payorLastName,
        input.payorAddress, input.payorZip, input.payorPhone,
        input.signatureText, input.pinVerifiedAt, new Date().toISOString(),
      ].join("|");
      const signatureHash = createHash("sha256").update(signatureData).digest("hex");

      const record = await createPaymentDisclosure({
        userId: ctx.user.id,
        workspaceId: ws?.id ?? null,
        planSlug: input.planSlug,
        billingInterval: input.billingInterval,
        priceAtAcceptance: input.priceAtAcceptance,
        payorFirstName: input.payorFirstName,
        payorLastName: input.payorLastName,
        payorBusinessEntity: input.payorBusinessEntity ?? null,
        payorAddress: input.payorAddress,
        payorCity: input.payorCity,
        payorState: input.payorState,
        payorZip: input.payorZip,
        payorPhone: input.payorPhone,
        payorEmail: input.payorEmail ?? ctx.user.email ?? null,
        ipAddress,
        userAgent: userAgent.substring(0, 500),
        pinVerifiedAt: new Date(input.pinVerifiedAt),
        signatureText: input.signatureText,
        signatureHash,
        disclosureVersion: "1.0",
        governingLaw: "Delaware",
        agreedAt: new Date(),
      });

      // Notify owner of new payment disclosure
      try {
        await notifyOwner({
          title: `Payment Disclosure Signed — ${input.payorFirstName} ${input.payorLastName}`,
          content: `Plan: ${input.planSlug} (${input.billingInterval})\nPayor: ${input.payorFirstName} ${input.payorLastName}\nBusiness: ${input.payorBusinessEntity ?? "N/A"}\nAddress: ${input.payorAddress}, ${input.payorCity}, ${input.payorState} ${input.payorZip}\nPhone: ${input.payorPhone}\nIP: ${ipAddress}\nSignature Hash: ${signatureHash}\nAgreed At: ${new Date().toISOString()}`,
        });
      } catch (e) {
        console.warn("[PaymentCompliance] Failed to notify owner:", e);
      }

      return { id: record?.id, signatureHash, agreedAt: new Date().toISOString() };
    }),

    listDisclosures: protectedProcedure.input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional()).query(async ({ ctx, input }) => {
      // Admin only
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can view payment disclosure records." });
      }
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      return getPaymentDisclosures({ limit, offset });
    }),

    getDisclosure: protectedProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can view payment disclosure records." });
      }
      const record = await getPaymentDisclosureById(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Disclosure record not found." });
      return record;
    }),

    myDisclosures: protectedProcedure.query(async ({ ctx }) => {
      return getPaymentDisclosuresByUser(ctx.user.id);
    }),
  }),

  // ─── Real-Time Data Feeds (Platform Improvement #4) ───────────────────
  dataFeeds: router({
    snapshot: publicProcedure.input(z.object({ state: z.string().optional() }).optional()).query(async ({ input }) => {
      const { getDataFeedSnapshot } = await import("./dataFeedService");
      return getDataFeedSnapshot(input?.state);
    }),
    cpi: publicProcedure.query(async () => {
      const { getCPIData } = await import("./dataFeedService");
      return getCPIData();
    }),
    treasury: publicProcedure.query(async () => {
      const { getTreasuryRates } = await import("./dataFeedService");
      return getTreasuryRates();
    }),
    commodities: publicProcedure.query(async () => {
      const { getCommodityPrices } = await import("./dataFeedService");
      return getCommodityPrices();
    }),
    mygaRates: publicProcedure.input(z.object({ state: z.string().optional() }).optional()).query(async ({ input }) => {
      const { getMYGARates } = await import("./dataFeedService");
      return getMYGARates(input?.state);
    }),
    /** FRED benchmarks: 30-yr mortgage, Fed funds, 10-yr Treasury — dated, sourced, never invented. */
    benchmarks: publicProcedure.query(async () => {
      const { getRateBenchmarks } = await import("./dataFeedService");
      const { fredConfigured } = await import("./_core/fred");
      return { configured: fredConfigured(), benchmarks: await getRateBenchmarks() };
    }),
    refresh: protectedProcedure.mutation(async () => {
      const { invalidateAllFeeds } = await import("./dataFeedService");
      invalidateAllFeeds();
      return { success: true };
    }),
  }),

  // ─── Living Risk Profile ──────────────────────────────────────────────────
  riskProfile: router({
    saveSnapshot: protectedProcedure.input(z.object({
      clientId: z.number(),
      overallScore: z.number().min(0).max(99),
      depthLevel: z.number().min(1).max(5),
      questionsAnswered: z.number(),
      categories: z.array(z.object({ key: z.string(), label: z.string(), score: z.number() })),
      riskCategory: z.string().optional(),
      trigger: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, ctx.user.name ?? "Workspace", ctx.user.openId);
      // Compute drift from previous snapshots
      const history = await getRiskSnapshotHistory(input.clientId, ws.id);
      let driftScore = 0;
      let flaggedForReassessment = false;
      if (history.length > 0) {
        const prev = history[0];
        driftScore = Math.abs(input.overallScore - prev.overallScore);
        flaggedForReassessment = driftScore >= 15;
      }
      const result = await saveRiskSnapshot({
        ...input,
        workspaceId: ws.id,
        advisorId: ctx.user.id,
        driftScore,
        flaggedForReassessment,
      });
      // Auto-send drift alert email when significant drift detected
      if (flaggedForReassessment && driftScore >= 10) {
        const client = await getClientById(input.clientId, ws.id);
        const direction = input.overallScore > (history[0]?.overallScore ?? 0) ? "more_aggressive" as const : "more_conservative" as const;
        sendDriftAlertEmail({
          toEmail: ctx.user.email ?? "",
          advisorName: ctx.user.name ?? "Advisor",
          clientName: client ? client.name : `Client #${input.clientId}`,
          driftScore,
          direction,
          previousScore: history[0]?.overallScore ?? 0,
          currentScore: input.overallScore,
          riskCategory: input.riskCategory,
        }).catch(err => console.error("[DriftAlert] Email failed:", err));
      }
      return { id: result.id, driftScore, flaggedForReassessment };
    }),

    getHistory: protectedProcedure.input(z.object({
      clientId: z.number(),
    })).query(async ({ ctx, input }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, ctx.user.name ?? "Workspace", ctx.user.openId);
      const snapshots = await getRiskSnapshotHistory(input.clientId, ws.id);
      return snapshots;
    }),

    detectDrift: protectedProcedure.input(z.object({
      clientId: z.number(),
    })).query(async ({ ctx, input }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, ctx.user.name ?? "Workspace", ctx.user.openId);
      const snapshots = await getRiskSnapshotHistory(input.clientId, ws.id);
      if (snapshots.length < 2) return { hasDrift: false, driftScore: 0, message: "Not enough data" };
      const latest = snapshots[0];
      const previous = snapshots[1];
      const drift = Math.abs(latest.overallScore - previous.overallScore);
      return {
        hasDrift: drift >= 10,
        driftScore: drift,
        direction: latest.overallScore > previous.overallScore ? "more_aggressive" : "more_conservative",
        message: drift >= 15 ? "Significant behavioral drift detected — reassessment recommended" : drift >= 10 ? "Moderate drift detected — monitor closely" : "Risk profile stable",
        latestScore: latest.overallScore,
        previousScore: previous.overallScore,
        daysBetween: Math.round((new Date(latest.createdAt!).getTime() - new Date(previous.createdAt!).getTime()) / 86400000),
      };
    }),
  }),

  // ─── Batch Schedules ──────────────────────────────────────────────────────
  batchSchedule: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, "default", "default");
      return listBatchSchedules(ws.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      templateType: z.string().min(1),
      frequency: z.string().default("weekly"),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, "default", "default");
      return createBatchSchedule({ ...input, workspaceId: ws.id });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().nullable().optional(),
      frequency: z.string().optional(),
      paused: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, "default", "default");
      const { id, ...data } = input;
      await updateBatchSchedule(id, ws.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const ws = await getOrCreateWorkspace(ctx.user.id, "default", "default");
      await deleteBatchSchedule(input.id, ws.id);
      return { success: true };
    }),
  }),

  // ─── Sidebar Favorites ──────────────────────────────────────────────────
  // ─── Experience Engine ──────────────────────────────────────────────────
  experience: experienceRouter,
  // ─── Will Writer ──────────────────────────────────────────────────────────
  willWriter: willWriterRouter,
  pet: petRouter,
  morningRitual: morningRitualRouter,
  withdrawal: withdrawalRouter,
  revenueGuarantee: revenueGuaranteeRouter,
  warStoryAI: warStoryAIRouter,
  questProgress: questProgressRouter,
  rivalry: rivalryRouter,
  revenueAttribution: revenueAttributionRouter,
  dealScoring: dealScoringRouter,
  monthlyReport: monthlyReportRouter,
  errorLog: errorLogRouter,
  // ─── Sidebar Favorites ──────────────────────────────────────────────────
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getSidebarFavorites(ctx.user.id);
    }),
    add: protectedProcedure.input(z.object({
      path: z.string().min(1),
      label: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      return addSidebarFavorite(ctx.user.id, input.path, input.label);
    }),
    remove: protectedProcedure.input(z.object({
      path: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      await removeSidebarFavorite(ctx.user.id, input.path);
      return { success: true };
    }),
  }),

  // ═══ Financial Reels ═══════════════════════════════════════════════════════
  reels: router({
    feed: publicProcedure.input(z.object({
      cursor: z.number().optional(),
      limit: z.number().min(1).max(50).default(15),
    })).query(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? null;
      return getReelFeed(userId, input.cursor, input.limit);
    }),

    recordView: protectedProcedure.input(z.object({
      reelId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      await recordReelInteraction(ctx.user.id, input.reelId, "view");
      return { success: true };
    }),

    toggleLike: protectedProcedure.input(z.object({
      reelId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const liked = await toggleReelLike(ctx.user.id, input.reelId);
      return { liked };
    }),

    toggleSave: protectedProcedure.input(z.object({
      reelId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const saved = await toggleReelSave(ctx.user.id, input.reelId);
      return { saved };
    }),

    recordShare: protectedProcedure.input(z.object({
      reelId: z.number(),
      platform: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await recordReelInteraction(ctx.user.id, input.reelId, "share");
      return { success: true };
    }),

    myLikes: protectedProcedure.query(async ({ ctx }) => {
      return getUserLikedReelIds(ctx.user.id);
    }),

    mySaves: protectedProcedure.query(async ({ ctx }) => {
      return getUserSavedReelIds(ctx.user.id);
    }),

    savedReels: protectedProcedure.query(async ({ ctx }) => {
      return getUserSavedReels(ctx.user.id);
    }),
  }),

  // ─── Video Proposals (HeyGen) ────────────────────────────────────────────────
  videoProposal: router({
    listAvatars: protectedProcedure.query(async () => {
      const { listAvatars } = await import("./heygenService");
      return listAvatars();
    }),
    listVoices: protectedProcedure.query(async () => {
      const { listVoices } = await import("./heygenService");
      return listVoices();
    }),
    getQuota: protectedProcedure.query(async () => {
      const { getRemainingQuota } = await import("./heygenService");
      return getRemainingQuota();
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getVideoProposals } = await import("./db");
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No workspace" });
      return getVideoProposals(ws.id);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const { getVideoProposalById, getVideoProposalChapters, getVideoEngagementStats } = await import("./db");
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No workspace" });
      const proposal = await getVideoProposalById(input.id, ws.id);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Video proposal not found" });
      const chapters = await getVideoProposalChapters(proposal.id);
      const engagement = await getVideoEngagementStats(proposal.id);
      return { ...proposal, chapters, engagement };
    }),
    create: protectedProcedure.input(z.object({
      clientId: z.number().optional(),
      title: z.string().min(1),
      avatarId: z.string().optional(),
      voiceId: z.string().optional(),
      resolution: z.enum(["1080p", "720p"]).default("1080p"),
    })).mutation(async ({ ctx, input }) => {
      const { createVideoProposal } = await import("./db");
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No workspace" });
      const shareToken = randomBytes(24).toString("hex");
      const proposal = await createVideoProposal({
        userId: ctx.user.id,
        workspaceId: ws.id,
        clientId: input.clientId ?? null,
        title: input.title,
        avatarId: input.avatarId ?? null,
        voiceId: input.voiceId ?? null,
        shareToken,
        resolution: input.resolution,
      });
      return proposal;
    }),
    generateScripts: protectedProcedure.input(z.object({
      proposalId: z.number(),
      clientId: z.number().optional(),
      strategyData: z.record(z.string(), z.unknown()).optional(),
      chapterTypes: z.array(z.enum(["introduction", "current_situation", "recommended_strategy", "twenty_year_projection", "next_steps"])).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { getVideoProposalById, updateVideoProposal, createVideoProposalChapters, deleteVideoProposalChapters, getClientById } = await import("./db");
      const { generateChapterScripts } = await import("./videoScriptGenerator");
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No workspace" });
      const proposal = await getVideoProposalById(input.proposalId, ws.id);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
      await updateVideoProposal(proposal.id, { status: "generating_script" });
      try {
        let clientData: Record<string, unknown> = {};
        if (input.clientId && ws) {
          const client = await getClientById(input.clientId, ws.id);
          if (client) clientData = client as unknown as Record<string, unknown>;
        }
        const advisorName = ctx.user.name || "Your Financial Advisor";
        const scripts = await generateChapterScripts(
          { name: (clientData.name as string) || "Valued Client", ...clientData } as any,
          (input.strategyData || {}) as any,
          advisorName,
          input.chapterTypes as any,
        );
        await deleteVideoProposalChapters(proposal.id);
        await createVideoProposalChapters(scripts.map((s, i) => ({
          proposalId: proposal.id,
          chapterIndex: i,
          chapterType: s.chapterType,
          title: s.title,
          script: s.script,
          durationEstimate: s.durationEstimate,
          dataSnapshot: input.strategyData ? input.strategyData : null,
        })));
        await updateVideoProposal(proposal.id, { status: "script_ready" });
        return { success: true, chapterCount: scripts.length };
      } catch (error) {
        await updateVideoProposal(proposal.id, { status: "failed", errorMessage: String(error) });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate scripts" });
      }
    }),
    updateChapter: protectedProcedure.input(z.object({
      chapterId: z.number(),
      script: z.string().optional(),
      title: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { updateVideoProposalChapter } = await import("./db");
      const data: Record<string, unknown> = {};
      if (input.script !== undefined) data.script = input.script;
      if (input.title !== undefined) data.title = input.title;
      await updateVideoProposalChapter(input.chapterId, data as any);
      return { success: true };
    }),
    regenerateChapter: protectedProcedure.input(z.object({
      proposalId: z.number(),
      chapterId: z.number(),
      chapterType: z.enum(["introduction", "current_situation", "recommended_strategy", "twenty_year_projection", "next_steps"]),
      clientId: z.number().optional(),
      strategyData: z.record(z.string(), z.unknown()).optional(),
      customInstructions: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { getVideoProposalById, updateVideoProposalChapter, getClientById } = await import("./db");
      const { regenerateChapterScript } = await import("./videoScriptGenerator");
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No workspace" });
      const proposal = await getVideoProposalById(input.proposalId, ws.id);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
      let clientData: Record<string, unknown> = {};
      if (input.clientId && ws) {
        const client = await getClientById(input.clientId, ws.id);
        if (client) clientData = client as unknown as Record<string, unknown>;
      }
      const advisorName = ctx.user.name || "Your Financial Advisor";
      const result = await regenerateChapterScript(
        input.chapterType,
        { name: (clientData.name as string) || "Valued Client", ...clientData } as any,
        (input.strategyData || {}) as any,
        advisorName,
        input.customInstructions,
      );
      await updateVideoProposalChapter(input.chapterId, {
        script: result.script,
        durationEstimate: result.durationEstimate,
      });
      return result;
    }),
    generateVideo: protectedProcedure.input(z.object({
      proposalId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const { getVideoProposalById, getVideoProposalChapters, updateVideoProposal } = await import("./db");
      const { generateStudioVideo } = await import("./heygenService");
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No workspace" });
      const proposal = await getVideoProposalById(input.proposalId, ws.id);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
      if (!proposal.avatarId || !proposal.voiceId) throw new TRPCError({ code: "BAD_REQUEST", message: "Avatar and voice must be selected" });
      const chapters = await getVideoProposalChapters(proposal.id);
      if (chapters.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No chapters found. Generate scripts first." });
      await updateVideoProposal(proposal.id, { status: "generating_video" });
      try {
        const scenes = chapters.map(ch => ({
          script: ch.script,
          avatarId: proposal.avatarId!,
          voiceId: proposal.voiceId!,
          backgroundType: "color" as const,
          backgroundColor: "#1a1a2e",
        }));
        const { videoId } = await generateStudioVideo({
          title: proposal.title,
          scenes,
          resolution: proposal.resolution as "1080p" | "720p",
          caption: true,
        });
        await updateVideoProposal(proposal.id, {
          heygenVideoId: videoId,
          status: "processing",
        });
        return { success: true, videoId };
      } catch (error) {
        await updateVideoProposal(proposal.id, { status: "failed", errorMessage: String(error) });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Video generation failed: ${error}` });
      }
    }),
    checkVideoStatus: protectedProcedure.input(z.object({
      proposalId: z.number(),
    })).query(async ({ ctx, input }) => {
      const { getVideoProposalById, updateVideoProposal } = await import("./db");
      const { getVideoStatus } = await import("./heygenService");
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No workspace" });
      const proposal = await getVideoProposalById(input.proposalId, ws.id);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
      if (!proposal.heygenVideoId) return { status: proposal.status, videoUrl: null };
      const heygenStatus = await getVideoStatus(proposal.heygenVideoId);
      if (heygenStatus.status === "completed" && heygenStatus.video_url) {
        await updateVideoProposal(proposal.id, {
          status: "completed",
          videoUrl: heygenStatus.video_url,
          thumbnailUrl: heygenStatus.thumbnail_url || null,
          totalDuration: heygenStatus.duration || null,
          generatedAt: new Date(),
        });
        return { status: "completed", videoUrl: heygenStatus.video_url, thumbnailUrl: heygenStatus.thumbnail_url };
      }
      if (heygenStatus.status === "failed") {
        await updateVideoProposal(proposal.id, { status: "failed", errorMessage: heygenStatus.error || "Video generation failed" });
        return { status: "failed", error: heygenStatus.error };
      }
      return { status: heygenStatus.status, videoUrl: null };
    }),
    update: protectedProcedure.input(z.object({
      proposalId: z.number(),
      avatarId: z.string().optional(),
      voiceId: z.string().optional(),
      title: z.string().optional(),
      resolution: z.enum(["1080p", "720p"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { getVideoProposalById, updateVideoProposal } = await import("./db");
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No workspace" });
      const proposal = await getVideoProposalById(input.proposalId, ws.id);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
      const data: Record<string, unknown> = {};
      if (input.avatarId !== undefined) data.avatarId = input.avatarId;
      if (input.voiceId !== undefined) data.voiceId = input.voiceId;
      if (input.title !== undefined) data.title = input.title;
      if (input.resolution !== undefined) data.resolution = input.resolution;
      await updateVideoProposal(proposal.id, data as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const { getVideoProposalById, updateVideoProposal } = await import("./db");
      const ws = await getWorkspaceForUser(ctx.user.id);
      if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No workspace" });
      const proposal = await getVideoProposalById(input.id, ws.id);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
      await updateVideoProposal(proposal.id, { status: "failed", errorMessage: "Deleted by user" });
      return { success: true };
    }),
    // Public endpoint for client portal video viewing
    getByShareToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const { getVideoProposalByShareToken, getVideoProposalChapters } = await import("./db");
      const proposal = await getVideoProposalByShareToken(input.token);
      if (!proposal || proposal.status !== "completed") throw new TRPCError({ code: "NOT_FOUND", message: "Video not found or not ready" });
      const chapters = await getVideoProposalChapters(proposal.id);
      return {
        id: proposal.id,
        title: proposal.title,
        videoUrl: proposal.videoUrl,
        thumbnailUrl: proposal.thumbnailUrl,
        totalDuration: proposal.totalDuration,
        chapters: chapters.map(ch => ({ index: ch.chapterIndex, type: ch.chapterType, title: ch.title, durationEstimate: ch.durationEstimate })),
      };
    }),
    trackEngagement: publicProcedure.input(z.object({
      token: z.string().min(16).max(256),
      proposalId: z.number().int().positive(),
      eventType: z.enum(["play", "pause", "seek", "chapter_enter", "chapter_exit", "complete", "replay_section"]),
      chapterIndex: z.number().int().min(0).max(500).optional(),
      videoTimestamp: z.number().finite().min(0).max(86400).optional(),
      watchDuration: z.number().finite().min(0).max(86400).optional(),
      totalWatchTime: z.number().finite().min(0).max(86400).optional(),
      percentWatched: z.number().finite().min(0).max(100).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { getVideoProposalByShareToken, recordVideoEngagement } = await import("./db");
      const proposal = await getVideoProposalByShareToken(input.token);
      if (!proposal || proposal.id !== input.proposalId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }
      await recordVideoEngagement({
        proposalId: input.proposalId,
        viewerType: ctx.user ? "advisor" : "client",
        viewerId: ctx.user?.id ?? null,
        eventType: input.eventType,
        chapterIndex: input.chapterIndex ?? null,
        videoTimestamp: input.videoTimestamp ?? null,
        watchDuration: input.watchDuration ?? null,
        totalWatchTime: input.totalWatchTime ?? null,
        percentWatched: input.percentWatched ?? null,
        ipAddress: (ctx.req?.ip || (ctx.req?.headers?.['x-forwarded-for'] as string) || null) as string | null,
        userAgent: (ctx.req?.headers?.['user-agent'] || null) as string | null,
      });
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CALENDAR SYNC ROUTER — Google Calendar integration via MCP
  // ═══════════════════════════════════════════════════════════════════════════
  liveCoPilot: router({
    chat: protectedProcedure.input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })),
      mode: z.enum(["copilot", "wwsd"]).default("copilot"),
    })).mutation(async ({ ctx, input }) => {
      const systemPrompt = input.mode === "wwsd"
        ? `${SYSTEM_PREAMBLE}\n\nYou are "Sam Russell" — the legendary financial advisor persona within Russell Capital Systems. You speak in first person as Sam. You are confident, direct, charismatic, and always close. You've closed thousands of deals and mentored hundreds of advisors. Your advice is tactical, specific, and battle-tested.\n\nRules:\n- Always speak as Sam in first person\n- Give specific, actionable advice — never generic platitudes\n- Use real financial concepts (Roth conversions, IUL, MYGA, estate planning, tax strategies)\n- Include exact phrases and scripts advisors can use word-for-word\n- Be dramatic and compelling — you're telling war stories and sharing hard-won wisdom\n- Format with **bold** for key phrases, *italics* for scripts to say verbatim\n- Keep responses focused and under 400 words\n- End with a clear next action step`
        : `${SYSTEM_PREAMBLE}\n\nYou are the Live Co-Pilot — an AI coaching assistant for financial advisors using Russell Capital Systems. You help advisors in real-time during client meetings and preparation.\n\nRules:\n- Give specific, actionable financial advisory coaching\n- Include exact scripts, phrases, and rebuttals advisors can use\n- Reference Russell Capital tools (Mortgage Killer, Time Machine, Strategy Lab, IUL projections, Roth conversions, MYGA waterfalls, estate planning)\n- Format with **bold** for emphasis, *italics* for verbatim scripts\n- Be concise but thorough — advisors need quick answers during meetings\n- Always include a specific next step or action item\n- Keep responses under 400 words\n- If asked about products, explain benefits in client-friendly language`;

      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...input.messages.slice(-10).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const response = await invokeLLM({ messages: llmMessages });
      const content = response.choices?.[0]?.message?.content;
      return { content: typeof content === "string" ? content : "I'm having trouble generating a response right now. Please try again." };
    }),
  }),
  calendarSync: router({
    listEvents: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        maxResults: z.number().min(1).max(100).default(25),
      }).optional())
      .query(async ({ ctx, input }) => {
        try {
          const { searchCalendarEvents: listEvents } = await import("./calendarService");
          const start = input?.startDate || new Date().toISOString();
          const end = input?.endDate || new Date(Date.now() + 30 * 86400000).toISOString();
          const events = await listEvents({ timeMin: start, timeMax: end, maxResults: input?.maxResults ?? 25 });
          // Also save to local DB for offline access
          const ws = await getWorkspaceForUser(ctx.user.id);
          if (ws && Array.isArray(events)) {
            const { saveCalendarEvent } = await import("./db");
            for (const ev of events.slice(0, 50)) {
              try {
                await saveCalendarEvent({
                  workspaceId: ws.id,
                  userId: ctx.user.id,
                  googleEventId: ev.id || null,
                  title: ev.summary || ev.title || "Untitled",
                  description: ev.description || null,
                  startTime: ev.start?.dateTime || ev.start || start,
                  endTime: ev.end?.dateTime || ev.end || end,
                  location: ev.location || null,
                  attendees: ev.attendees || null,
                  status: ev.status || "confirmed",
                  meetingLink: ev.hangoutLink || ev.conferenceData?.entryPoints?.[0]?.uri || null,
                });
              } catch { /* skip duplicates */ }
            }
          }
          return { events: events || [], synced: true };
        } catch (e: any) {
          // Fallback to local DB
          const ws = await getWorkspaceForUser(ctx.user.id);
          if (ws) {
            const { getCalendarEvents } = await import("./db");
            const local = await getCalendarEvents(ws.id, ctx.user.id);
            return { events: local, synced: false, error: e.message };
          }
          return { events: [], synced: false, error: e.message };
        }
      }),

    createEvent: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        startTime: z.string(),
        endTime: z.string(),
        location: z.string().optional(),
        attendees: z.array(z.string().email()).optional(),
        clientId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        let googleEventId: string | null = null;
        let meetingLink: string | null = null;
        // Try Google Calendar first
        try {
          const { createCalendarEvent: createEvent } = await import("./calendarService");
          const result = await createEvent({
            summary: input.title,
            description: input.description,
            startTime: input.startTime,
            endTime: input.endTime,
            location: input.location,
            attendees: input.attendees,
          });
          googleEventId = result?.id || null;
          meetingLink = result?.hangoutLink || null;
        } catch (e) {
          console.warn("[CalendarSync] Google create failed, saving locally", e);
        }
        // Always save to local DB
        if (ws) {
          const { saveCalendarEvent } = await import("./db");
          await saveCalendarEvent({
            workspaceId: ws.id,
            userId: ctx.user.id,
            googleEventId,
            title: input.title,
            description: input.description || null,
            startTime: input.startTime,
            endTime: input.endTime,
            location: input.location || null,
            attendees: input.attendees || null,
            status: "confirmed",
            meetingLink,
            clientId: input.clientId,
          });
        }
        return { success: true, googleEventId, meetingLink };
      }),

    updateEvent: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        googleEventId: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Try Google Calendar update
        if (input.googleEventId) {
          try {
            const { updateCalendarEvent: updateEvent } = await import("./calendarService");
            await updateEvent(input.googleEventId, {
              summary: input.title,
              description: input.description,
              startTime: input.startTime,
              endTime: input.endTime,
              location: input.location,
            });
          } catch (e) {
            console.warn("[CalendarSync] Google update failed", e);
          }
        }
        // Update local DB
        const { updateCalendarEvent } = await import("./db");
        await updateCalendarEvent(input.eventId, {
          title: input.title,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          status: input.status,
        });
        return { success: true };
      }),

    deleteEvent: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        googleEventId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.googleEventId) {
          try {
            const { deleteCalendarEvent: deleteEvent } = await import("./calendarService");
            await deleteEvent(input.googleEventId);
          } catch (e) {
            console.warn("[CalendarSync] Google delete failed", e);
          }
        }
        const { deleteCalendarEvent } = await import("./db");
        await deleteCalendarEvent(input.eventId);
        return { success: true };
      }),

    getLocalEvents: protectedProcedure
      .input(z.object({ clientId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return [];
        const { getCalendarEvents } = await import("./db");
        return getCalendarEvents(ws.id, ctx.user.id, input?.clientId);
      }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK PDF EXPORT ROUTER — Generate PDFs for strategies, scorecards, reports
  // ═══════════════════════════════════════════════════════════════════════════
  bulkExport: router({
    generateReport: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        sections: z.array(z.enum([
          "strategy-summary", "tax-waterfall", "mortgage-analysis",
          "retirement-projection", "iul-projection", "roth-conversion",
          "estate-plan", "client-scorecard", "portfolio-overview",
          "20-year-projection", "comparison-dashboard",
        ])),
        title: z.string().optional(),
        includeCharts: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });

        // Gather client data
        const client = await getClientById(input.clientId, ws.id);
        if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });

        // Build report content using LLM
        const sectionData: Record<string, any> = {};
        for (const section of input.sections) {
          switch (section) {
            case "client-scorecard": {
              const clientStrategies = await getStrategiesByClient(input.clientId, ws.id);
              sectionData[section] = {
                client: { name: client.name, age: client.age, income: client.annualIncome },
                totalStrategies: clientStrategies.length,
                strategyTypes: clientStrategies.map((s: any) => s.strategyType),
              };
              break;
            }
            case "strategy-summary": {
              const strategies = await getSavedStrategies(input.clientId, ws.id);
              sectionData[section] = {
                count: strategies.length,
                types: strategies.map((s: any) => s.strategyType),
                totalBenefit: strategies.reduce((sum: number, s: any) => sum + Number(s.projectedBenefit || 0), 0),
              };
              break;
            }
            case "portfolio-overview": {
              const portfolioStrategies = await getStrategiesByClient(input.clientId, ws.id);
              sectionData[section] = { items: portfolioStrategies };
              break;
            }
            default:
              sectionData[section] = { included: true };
          }
        }

        // Generate formatted report via LLM
        let reportHtml = "";
        try {
          const { invokeLLM } = await import("./_core/llm");
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a financial report generator for Russell Capital Systems. Generate a professional HTML report with inline CSS styling. Use dark theme (bg: #0a0a0f, text: #e2e8f0, accent: #10b981). Include tables, key metrics, and professional formatting. The report should look like a premium financial advisory document.`,
              },
              {
                role: "user",
                content: `Generate a comprehensive financial report for client "${client.name}" (age ${client.age || "N/A"}, income $${Number(client.annualIncome || 0).toLocaleString()}).

Title: ${input.title || `${client.name} — Financial Strategy Report`}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
Advisor: ${ctx.user.name || "Russell Capital Advisor"}

Sections to include: ${input.sections.join(", ")}

Data:
${JSON.stringify(sectionData, null, 2)}

Generate the full HTML report with professional styling. Include a cover page, table of contents, and each requested section with data visualization descriptions.`,
              },
            ],
          });
          reportHtml = String(response.choices[0].message.content || "");
        } catch (e) {
          // Fallback to simple HTML
          reportHtml = `<html><head><style>body{font-family:system-ui;background:#0a0a0f;color:#e2e8f0;padding:40px;}</style></head><body>
            <h1>${input.title || `${client.name} — Financial Strategy Report`}</h1>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
            <p>Advisor: ${ctx.user.name || "Russell Capital"}</p>
            <hr/>
            ${input.sections.map(s => `<h2>${s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</h2><p>Section data: ${JSON.stringify(sectionData[s] || {})}</p>`).join("")}
          </body></html>`;
        }

        // Save export record
        const { saveReportExport } = await import("./db");
        const exportRecord = await saveReportExport({
          workspaceId: ws.id,
          userId: ctx.user.id,
          clientId: input.clientId,
          title: input.title || `${client.name} — Financial Strategy Report`,
          sections: input.sections,
          format: "html",
          status: "completed",
        });

        // Upload HTML to S3
        try {
          const { storagePut } = await import("./storage");
          const fileName = `reports/${ws.id}/${input.clientId}/${Date.now()}-report.html`;
          const { url } = await storagePut(fileName, reportHtml, "text/html");
          // Update record with URL
          const { updateReportExportUrl } = await import("./db");
          await updateReportExportUrl(exportRecord.id, url);
          return { success: true, reportId: exportRecord.id, url, html: reportHtml };
        } catch (e) {
          return { success: true, reportId: exportRecord.id, html: reportHtml };
        }
      }),

    listExports: protectedProcedure
      .input(z.object({ clientId: z.number().optional(), limit: z.number().default(50) }).optional())
      .query(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) return [];
        const { getReportExports } = await import("./db");
        return getReportExports(ws.id, input?.clientId, input?.limit ?? 50);
      }),

    bulkGenerate: protectedProcedure
      .input(z.object({
        clientIds: z.array(z.number()).min(1).max(50),
        sections: z.array(z.string()),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ws = await getWorkspaceForUser(ctx.user.id);
        if (!ws) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace not found" });
        const results: { clientId: number; clientName: string; status: string; url?: string }[] = [];
        for (const clientId of input.clientIds) {
          try {
            const client = await getClientById(clientId, ws.id);
            if (!client) {
              results.push({ clientId, clientName: "Unknown", status: "not_found" });
              continue;
            }
            const { saveReportExport } = await import("./db");
            const exportRecord = await saveReportExport({
              workspaceId: ws.id,
              userId: ctx.user.id,
              clientId,
              title: input.title || `${client.name} — Bulk Report`,
              sections: input.sections,
              format: "html",
              status: "queued",
            });
            results.push({ clientId, clientName: client.name, status: "queued" });
          } catch (e) {
            results.push({ clientId, clientName: "Error", status: "failed" });
          }
        }
        return { queued: results.length, results };
      }),
  }),

  comboRecommend: protectedProcedure
    .input(z.object({
      profession: z.string(),
      age: z.number(),
      state: z.string(),
      netWorth: z.number(),
      annualIncome: z.number(),
      goals: z.array(z.string()),
      topComboNames: z.array(z.string()),
      topComboIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an elite financial strategist for Russell Capital Systems. Analyze the client profile and explain why the recommended Tax-Free Wealth Combos are ideal. Be specific about dollar amounts, tax implications, and timeline. Use markdown. Keep it under 500 words." },
            { role: "user", content: `Client: ${input.profession}, Age ${input.age}, ${input.state}, NW $${input.netWorth.toLocaleString()}, Income $${input.annualIncome.toLocaleString()}. Goals: ${input.goals.join(", ")}. Top Combos: ${input.topComboNames.map((n, i) => `${i+1}. ${n}`).join("; ")}. Explain why these combos match this client and recommend execution order.` }
          ],
        });
        return { analysis: response?.choices?.[0]?.message?.content || "Analysis unavailable." };
      } catch {
        return { analysis: "AI analysis temporarily unavailable. Recommendations are based on algorithmic profile matching." };
      }
    }),
});
export type AppRouter = typeof appRouter;
