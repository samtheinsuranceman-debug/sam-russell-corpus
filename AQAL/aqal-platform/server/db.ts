import { eq, sql, and, desc, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, waitlist, assessments, responses, scores, powerCombinations, promoCodes, evidence, referralPayments, leaderboardEntries, challengeInvites, nlpProfiles, coachingLetters, videoAssessments, analyticsEvents, marketingSpend } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Waitlist
export async function addToWaitlist(email: string, tier?: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(waitlist).values({ email, tier: tier || null }).onDuplicateKeyUpdate({ set: { tier: tier || null } });
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to add to waitlist:", error);
    return null;
  }
}

export async function getWaitlistCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`COUNT(*)` }).from(waitlist);
  return Number(result[0]?.count || 0);
}

// ============================================================
// ASSESSMENT HELPERS
// ============================================================

export async function createAssessment(userId: number, promoCode?: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(assessments).values({
    userId,
    totalQuestions: 24,
    promoCode: promoCode || null,
  });
  return { id: Number(result[0].insertId) };
}

export async function getAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return result[0] || null;
}

export async function getLatestAssessment(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(assessments)
    .where(eq(assessments.userId, userId))
    .orderBy(sql`createdAt DESC`)
    .limit(1);
  return result[0] || null;
}

export async function updateAssessmentStatus(id: number, status: "in_progress" | "processing" | "complete" | "failed", compositeRarity?: number, normingVersion?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (compositeRarity !== undefined) updateData.compositeRarity = compositeRarity;
  if (normingVersion !== undefined) updateData.normingVersion = normingVersion;
  await db.update(assessments).set(updateData).where(eq(assessments.id, id));
}

export async function incrementCompletedQuestions(assessmentId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(assessments)
    .set({ completedQuestions: sql`completedQuestions + 1` })
    .where(eq(assessments.id, assessmentId));
}

// ============================================================
// RESPONSE HELPERS
// ============================================================

export async function saveResponse(data: {
  assessmentId: number;
  questionIndex: number;
  audioUrl?: string;
  audioKey?: string;
  transcript?: string;
  durationMs?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(responses).values({
    assessmentId: data.assessmentId,
    questionIndex: data.questionIndex,
    audioUrl: data.audioUrl || null,
    audioKey: data.audioKey || null,
    transcript: data.transcript || null,
    durationMs: data.durationMs || null,
  });
  return { id: Number(result[0].insertId) };
}

export async function getResponsesByAssessment(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(responses).where(eq(responses.assessmentId, assessmentId));
}

// ============================================================
// SCORE HELPERS
// ============================================================

export async function saveScores(assessmentId: number, scoreData: Array<{ axisIndex: number; axisName: string; score: number; confidence?: number; reasoning?: string }>) {
  const db = await getDb();
  if (!db) return;
  const values = scoreData.map((s) => ({
    assessmentId,
    axisIndex: s.axisIndex,
    axisName: s.axisName,
    score: s.score,
    confidence: s.confidence || null,
    reasoning: s.reasoning || null,
  }));
  await db.insert(scores).values(values);
}

export async function getScoresByAssessment(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scores).where(eq(scores.assessmentId, assessmentId));
}

// ============================================================
// POWER COMBINATION HELPERS
// ============================================================

export async function savePowerCombinations(assessmentId: number, combos: Array<{ name: string; description?: string; axes: number[]; rarityMultiplier?: number }>) {
  const db = await getDb();
  if (!db) return;
  const values = combos.map((c) => ({
    assessmentId,
    name: c.name,
    description: c.description || null,
    axes: JSON.stringify(c.axes),
    rarityMultiplier: c.rarityMultiplier || null,
  }));
  await db.insert(powerCombinations).values(values);
}

export async function getPowerCombinationsByAssessment(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(powerCombinations).where(eq(powerCombinations.assessmentId, assessmentId));
}

// ============================================================
// PROMO CODE HELPERS
// ============================================================

export async function validatePromoCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(promoCodes)
    .where(and(eq(promoCodes.code, code), eq(promoCodes.isActive, 1)))
    .limit(1);
  const promo = result[0];
  if (!promo) return null;
  if (promo.maxUses && promo.usageCount >= promo.maxUses) return null;
  return promo;
}

export async function incrementPromoCodeUsage(code: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(promoCodes)
    .set({ usageCount: sql`usageCount + 1` })
    .where(eq(promoCodes.code, code));
}

export async function createPromoCode(data: { code: string; influencerName: string; influencerEmail?: string; discountPercent?: number; commissionPercent?: number; maxUses?: number }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(promoCodes).values({
    code: data.code,
    influencerName: data.influencerName,
    influencerEmail: data.influencerEmail || null,
    discountPercent: data.discountPercent || 0,
    commissionPercent: data.commissionPercent || 10,
    maxUses: data.maxUses || null,
  });
  return { id: Number(result[0].insertId) };
}

export async function getAllPromoCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promoCodes);
}

// ============================================================
// EVIDENCE HELPERS
// ============================================================

export async function saveEvidence(data: {
  assessmentId: number;
  userId: number;
  fileUrl: string;
  fileKey: string;
  fileName?: string;
  fileType?: string;
  description?: string;
  axisTargets?: number[];
  category?: string;
  institution?: string;
  evidenceDate?: string;
  significance?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(evidence).values({
    assessmentId: data.assessmentId,
    userId: data.userId,
    fileUrl: data.fileUrl,
    fileKey: data.fileKey,
    fileName: data.fileName || null,
    fileType: data.fileType || null,
    description: data.description || null,
    axisTargets: data.axisTargets ? JSON.stringify(data.axisTargets) : null,
    category: data.category || null,
    institution: data.institution || null,
    evidenceDate: data.evidenceDate || null,
    significance: data.significance || null,
  });
  return { id: Number(result[0].insertId) };
}

export async function getEvidenceByAssessment(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidence).where(eq(evidence.assessmentId, assessmentId));
}

export async function getAllEvidence() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: evidence.id,
    assessmentId: evidence.assessmentId,
    userId: evidence.userId,
    fileUrl: evidence.fileUrl,
    fileName: evidence.fileName,
    fileType: evidence.fileType,
    description: evidence.description,
    status: evidence.status,
    createdAt: evidence.createdAt,
  }).from(evidence).orderBy(sql`createdAt DESC`);
}

export async function updateEvidenceStatus(evidenceId: number, status: "pending" | "reviewed" | "accepted" | "rejected") {
  const db = await getDb();
  if (!db) return null;
  await db.update(evidence).set({ status }).where(eq(evidence.id, evidenceId));
  return { success: true };
}

// ============================================================
// ADMIN HELPERS
// ============================================================

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    membershipTier: users.membershipTier,
    createdAt: users.createdAt,
  }).from(users).orderBy(sql`createdAt DESC`);
}

export async function getAllAssessments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: assessments.id,
    userId: assessments.userId,
    status: assessments.status,
    completedQuestions: assessments.completedQuestions,
    totalQuestions: assessments.totalQuestions,
    compositeRarity: assessments.compositeRarity,
    createdAt: assessments.createdAt,
  }).from(assessments).orderBy(sql`createdAt DESC`);
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}

export async function updateUserTier(userId: number, tier: "free" | "silver" | "gold" | "platinum") {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ membershipTier: tier }).where(eq(users.id, userId));
  return { success: true };
}

export async function togglePromoCode(promoId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return null;
  await db.update(promoCodes).set({ isActive: isActive ? 1 : 0 }).where(eq(promoCodes.id, promoId));
  return { success: true };
}

async function estimateRevenue(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Calculate based on membership tiers: assessment=$499, silver=$99/mo, gold=$499/mo, platinum=$2999/mo
  const tierPrices: Record<string, number> = { assessment: 499, silver: 99, gold: 499, platinum: 2999 };
  const members = await db.select({ membershipTier: users.membershipTier }).from(users).where(sql`membershipTier IS NOT NULL AND membershipTier != 'free'`);
  let total = 0;
  for (const m of members) {
    total += tierPrices[m.membershipTier || ""] || 0;
  }
  return total;
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalAssessments: 0, activeMembers: 0, estimatedRevenue: 0 };
  
  const userCount = await db.select({ count: sql`COUNT(*)` }).from(users);
  const assessmentCount = await db.select({ count: sql`COUNT(*)` }).from(assessments);
  const memberCount = await db.select({ count: sql`COUNT(*)` }).from(users).where(sql`membershipTier IS NOT NULL AND membershipTier != 'free'`);
  
  return {
    totalUsers: Number(userCount[0]?.count || 0),
    totalAssessments: Number(assessmentCount[0]?.count || 0),
    activeMembers: Number(memberCount[0]?.count || 0),
    estimatedRevenue: await estimateRevenue()
  };
}

// ============================================================
// REVENUE SHARE / REFERRAL PAYMENT HELPERS
// ============================================================

/**
 * Track a referral payment when a user who used a promo code completes checkout.
 * Looks up the user's most recent assessment to find the promo code used,
 * then records the commission owed to the influencer.
 */
export async function trackReferralPayment(data: {
  userId: string;
  amountCents: number;
  stripePaymentIntentId: string | null;
}) {
  const db = await getDb();
  if (!db) return;

  // Find the user by openId to get their internal id
  const userResult = await db.select().from(users).where(eq(users.openId, data.userId)).limit(1);
  const user = userResult[0];
  if (!user) return;

  // Find the user's most recent assessment with a promo code
  const assessmentResult = await db.select().from(assessments)
    .where(and(eq(assessments.userId, user.id), sql`promoCode IS NOT NULL`))
    .orderBy(sql`createdAt DESC`)
    .limit(1);
  const assessment = assessmentResult[0];
  if (!assessment || !assessment.promoCode) return;

  // Look up the promo code to get commission rate
  const promoResult = await db.select().from(promoCodes)
    .where(eq(promoCodes.code, assessment.promoCode))
    .limit(1);
  const promo = promoResult[0];
  if (!promo) return;

  // Calculate commission
  const commissionCents = Math.round(data.amountCents * (promo.commissionPercent / 100));

  // Record the referral payment
  await db.insert(referralPayments).values({
    promoCodeId: promo.id,
    userId: user.id,
    stripePaymentIntentId: data.stripePaymentIntentId,
    amountCents: data.amountCents,
    commissionCents,
    commissionPercent: promo.commissionPercent,
  });

  console.log(`[Revenue] Tracked referral: promo=${promo.code}, amount=$${(data.amountCents / 100).toFixed(2)}, commission=$${(commissionCents / 100).toFixed(2)}`);
}

/**
 * Track a referral payment using the promo code directly from Stripe metadata.
 * More accurate than trackReferralPayment because it doesn't guess from assessment history.
 */
export async function trackReferralPaymentByCode(data: {
  promoCode: string;
  userId: string;
  amountCents: number;
  stripePaymentIntentId: string | null;
}) {
  const db = await getDb();
  if (!db) return;

  // Find the user by openId
  const userResult = await db.select().from(users).where(eq(users.openId, data.userId)).limit(1);
  const user = userResult[0];
  if (!user) return;

  // Look up the promo code directly
  const promoResult = await db.select().from(promoCodes)
    .where(eq(promoCodes.code, data.promoCode))
    .limit(1);
  const promo = promoResult[0];
  if (!promo) return;

  // Calculate commission
  const commissionCents = Math.round(data.amountCents * (promo.commissionPercent / 100));

  // Record the referral payment
  await db.insert(referralPayments).values({
    promoCodeId: promo.id,
    userId: user.id,
    stripePaymentIntentId: data.stripePaymentIntentId,
    amountCents: data.amountCents,
    commissionCents,
    commissionPercent: promo.commissionPercent,
  });

  console.log(`[Revenue] Tracked referral (direct): promo=${promo.code}, amount=$${(data.amountCents / 100).toFixed(2)}, commission=$${(commissionCents / 100).toFixed(2)}`);
}

/**
 * Get influencer dashboard stats for a specific promo code
 */
export async function getInfluencerStats(promoCodeId: number) {
  const db = await getDb();
  if (!db) return null;

  const payments = await db.select().from(referralPayments)
    .where(eq(referralPayments.promoCodeId, promoCodeId));

  const totalRevenue = payments.reduce((sum, p) => sum + p.amountCents, 0);
  const totalCommission = payments.reduce((sum, p) => sum + p.commissionCents, 0);
  const pendingCommission = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.commissionCents, 0);
  const paidCommission = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.commissionCents, 0);

  return {
    totalReferrals: payments.length,
    totalRevenue,
    totalCommission,
    pendingCommission,
    paidCommission,
    recentPayments: payments.slice(-10).reverse(),
  };
}

/**
 * Get influencer stats by promo code string (for public influencer dashboard)
 */
export async function getInfluencerStatsByCode(code: string) {
  const db = await getDb();
  if (!db) return null;

  const promoResult = await db.select().from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);
  const promo = promoResult[0];
  if (!promo) return null;

  const stats = await getInfluencerStats(promo.id);
  return {
    ...stats,
    promoCode: promo.code,
    influencerName: promo.influencerName,
    discountPercent: promo.discountPercent,
    commissionPercent: promo.commissionPercent,
    usageCount: promo.usageCount,
  };
}

// ============================================================
// LEADERBOARD HELPERS
// ============================================================

export async function addToLeaderboard(data: {
  userId: number;
  assessmentId: number;
  displayName: string;
  compositeRarity: number;
  topPowerCombo?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  // Upsert — one entry per user
  const existing = await db.select().from(leaderboardEntries)
    .where(eq(leaderboardEntries.userId, data.userId))
    .limit(1);

  if (existing[0]) {
    await db.update(leaderboardEntries).set({
      assessmentId: data.assessmentId,
      compositeRarity: data.compositeRarity,
      displayName: data.displayName,
      topPowerCombo: data.topPowerCombo || null,
    }).where(eq(leaderboardEntries.userId, data.userId));
    return { id: existing[0].id };
  }

  const result = await db.insert(leaderboardEntries).values({
    userId: data.userId,
    assessmentId: data.assessmentId,
    displayName: data.displayName,
    compositeRarity: data.compositeRarity,
    topPowerCombo: data.topPowerCombo || null,
  });
  return { id: Number(result[0].insertId) };
}

export async function getLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: leaderboardEntries.id,
    displayName: leaderboardEntries.displayName,
    compositeRarity: leaderboardEntries.compositeRarity,
    topPowerCombo: leaderboardEntries.topPowerCombo,
    createdAt: leaderboardEntries.createdAt,
  }).from(leaderboardEntries)
    .where(eq(leaderboardEntries.isPublic, 1))
    .orderBy(sql`compositeRarity DESC`)
    .limit(limit);
}

export async function toggleLeaderboardVisibility(userId: number, isPublic: boolean) {
  const db = await getDb();
  if (!db) return null;
  await db.update(leaderboardEntries)
    .set({ isPublic: isPublic ? 1 : 0 })
    .where(eq(leaderboardEntries.userId, userId));
  return { success: true };
}

export async function getUserLeaderboardEntry(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leaderboardEntries)
    .where(eq(leaderboardEntries.userId, userId))
    .limit(1);
  return result[0] || null;
}

// ============================================================
// CHALLENGE INVITE HELPERS
// ============================================================

export async function createChallengeInvite(data: {
  senderId: number;
  senderName: string;
  senderRarity: number;
  recipientEmail?: string;
  token: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(challengeInvites).values({
    senderId: data.senderId,
    senderName: data.senderName,
    senderRarity: data.senderRarity,
    recipientEmail: data.recipientEmail || null,
    token: data.token,
  });
  return { id: Number(result[0].insertId), token: data.token };
}

export async function getChallengeByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(challengeInvites)
    .where(eq(challengeInvites.token, token))
    .limit(1);
  return result[0] || null;
}

export async function acceptChallenge(token: string, recipientId: number, recipientName: string) {
  const db = await getDb();
  if (!db) return null;
  await db.update(challengeInvites).set({
    status: "accepted",
    acceptedAt: Date.now(),
    recipientId,
    recipientName,
  }).where(eq(challengeInvites.token, token));
  return { success: true };
}

export async function completeChallenge(token: string, recipientRarity?: number) {
  const db = await getDb();
  if (!db) return null;
  const updateData: Record<string, unknown> = {
    status: "completed",
    completedAt: Date.now(),
  };
  if (recipientRarity !== undefined) {
    updateData.recipientRarity = recipientRarity;
  }
  await db.update(challengeInvites).set(updateData as any).where(eq(challengeInvites.token, token));
  return { success: true };
}

export async function getChallengesBySender(senderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(challengeInvites)
    .where(eq(challengeInvites.senderId, senderId))
    .orderBy(sql`createdAt DESC`);
}

// ============================================================
// PROFILE COMPARISON — Anonymous aggregate statistics
// ============================================================

export async function getPopulationAverages() {
  const db = await getDb();
  if (!db) return [];
  // Get average score per axis across all completed assessments
  const result = await db.select({
    axisIndex: scores.axisIndex,
    axisName: scores.axisName,
    avgScore: sql<number>`AVG(${scores.score})`,
    minScore: sql<number>`MIN(${scores.score})`,
    maxScore: sql<number>`MAX(${scores.score})`,
    count: sql<number>`COUNT(DISTINCT ${scores.assessmentId})`,
  })
    .from(scores)
    .innerJoin(assessments, eq(scores.assessmentId, assessments.id))
    .where(eq(assessments.status, "complete"))
    .groupBy(scores.axisIndex, scores.axisName);
  return result;
}

export async function getPercentileForScore(axisIndex: number, userScore: number) {
  const db = await getDb();
  if (!db) return 50; // default to median if no data
  // Count how many completed scores are below the user's score on this axis
  const [below] = await db.select({
    count: sql<number>`COUNT(*)`,
  })
    .from(scores)
    .innerJoin(assessments, eq(scores.assessmentId, assessments.id))
    .where(
      sql`${assessments.status} = 'complete' AND ${scores.axisIndex} = ${axisIndex} AND ${scores.score} < ${userScore}`
    );
  const [total] = await db.select({
    count: sql<number>`COUNT(*)`,
  })
    .from(scores)
    .innerJoin(assessments, eq(scores.assessmentId, assessments.id))
    .where(
      sql`${assessments.status} = 'complete' AND ${scores.axisIndex} = ${axisIndex}`
    );
  if (!total?.count || total.count === 0) return 50;
  return Math.round((below!.count / total.count) * 100);
}

export async function getUserComparison(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get the user's latest completed assessment
  const [latestAssessment] = await db.select()
    .from(assessments)
    .where(sql`${assessments.userId} = ${userId} AND ${assessments.status} = 'complete'`)
    .orderBy(sql`createdAt DESC`)
    .limit(1);
  
  if (!latestAssessment) return null;
  
  // Get user's scores
  const userScores = await db.select()
    .from(scores)
    .where(eq(scores.assessmentId, latestAssessment.id));
  
  // Get population averages
  const populationAvgs = await getPopulationAverages();
  
  // Calculate percentiles for each axis
  const comparison = await Promise.all(
    userScores.map(async (s) => {
      const percentile = await getPercentileForScore(s.axisIndex, s.score);
      const popAvg = populationAvgs.find(p => p.axisIndex === s.axisIndex);
      return {
        axisIndex: s.axisIndex,
        axisName: s.axisName,
        userScore: s.score,
        populationAvg: popAvg?.avgScore ?? 0.5,
        percentile,
        totalAssessed: popAvg?.count ?? 0,
      };
    })
  );
  
  return {
    assessmentId: latestAssessment.id,
    compositeRarity: latestAssessment.compositeRarity,
    axes: comparison,
    totalPopulation: populationAvgs[0]?.count ?? 0,
  };
}

// ============================================================
// NLP PROFILES — Sensory predicate detection + meta-programs
// ============================================================

export async function saveNlpProfile(data: {
  userId: number;
  assessmentId: number;
  visualPercent: number;
  auditoryPercent: number;
  kinestheticPercent: number;
  olfactoryGustatoryPercent: number;
  primaryRepSystem: "visual" | "auditory" | "kinesthetic" | "olfactory_gustatory";
  repSystemSequence: string;
  towardAway?: number;
  internalExternal?: number;
  optionsProcedures?: number;
  bigPictureDetail?: number;
  proactiveReactive?: number;
  matcherMismatcher?: number;
  selfOther?: number;
  possibilityNecessity?: number;
  wordsPerMinute?: number;
  avgPauseDurationMs?: number;
  hesitationFrequency?: number;
  confidenceScore?: number;
  sensoryPredicates?: any;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(nlpProfiles).values(data);
}

export async function getNlpProfile(userId: number, assessmentId?: number) {
  const db = await getDb();
  if (!db) return null;
  const conditions = assessmentId
    ? and(eq(nlpProfiles.userId, userId), eq(nlpProfiles.assessmentId, assessmentId))
    : eq(nlpProfiles.userId, userId);
  const rows = await db.select().from(nlpProfiles).where(conditions).orderBy(desc(nlpProfiles.createdAt)).limit(1);
  return rows[0] || null;
}

// ============================================================
// COACHING LETTERS — Peter's NLP-mirrored letters (Gold+)
// ============================================================

export async function saveCoachingLetter(data: {
  userId: number;
  tier: "silver" | "gold" | "platinum";
  subject: string;
  body: string;
  repSystemUsed?: string;
  sensoryPredicatesUsed?: any;
  metaProgramsAddressed?: any;
  sentAt?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(coachingLetters).values(data);
  return Number(result[0].insertId);
}

export async function getCoachingLetters(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachingLetters).where(eq(coachingLetters.userId, userId)).orderBy(desc(coachingLetters.createdAt)).limit(limit);
}

export async function markLetterRead(letterId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(coachingLetters).set({ readAt: Date.now() }).where(eq(coachingLetters.id, letterId));
}

// ============================================================
// NETWORK MATCHING — Get candidate profiles for complementarity engine
// ============================================================

/**
 * Returns all users with completed assessments and their latest scores,
 * formatted as Profile objects for the match engine.
 * Excludes the requesting user.
 */
export async function getNetworkCandidates(excludeUserId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all completed assessments (latest per user)
  const allAssessments = await db.select({
    id: assessments.id,
    userId: assessments.userId,
  }).from(assessments)
    .where(eq(assessments.status, "complete"))
    .orderBy(sql`createdAt DESC`);

  // Deduplicate: keep only the latest assessment per user
  const latestByUser = new Map<number, number>();
  for (const a of allAssessments) {
    if (a.userId !== excludeUserId && !latestByUser.has(a.userId)) {
      latestByUser.set(a.userId, a.id);
    }
  }

  if (latestByUser.size === 0) return [];

  // Fetch scores for all candidate assessments
  const assessmentIds = Array.from(latestByUser.values());
  const allScores = await db.select()
    .from(scores)
    .where(sql`${scores.assessmentId} IN (${sql.raw(assessmentIds.join(","))})`);

  // Fetch user names
  const userIds = Array.from(latestByUser.keys());
  const userRows = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(sql`${users.id} IN (${sql.raw(userIds.join(","))})`);
  const nameMap = new Map(userRows.map(u => [u.id, u.name]));

  // Build Profile objects
  const profiles: Array<{ id: string; name: string; scores: Record<string, number> }> = [];
  for (const [userId, assessmentId] of Array.from(latestByUser.entries())) {
    const userScores = allScores.filter(s => s.assessmentId === assessmentId);
    if (userScores.length === 0) continue;
    const scoreMap: Record<string, number> = {};
    for (const s of userScores) {
      scoreMap[s.axisName] = s.score;
    }
    profiles.push({
      id: String(userId),
      name: nameMap.get(userId) || "Anonymous",
      scores: scoreMap,
    });
  }

  return profiles;
}

// ============================================================
// VIDEO ASSESSMENTS — Platinum-tier multimodal analysis
// ============================================================

export async function createVideoAssessment(data: {
  userId: number;
  assessmentId?: number;
  videoUrl: string;
  durationMs?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(videoAssessments).values({
    userId: data.userId,
    assessmentId: data.assessmentId ?? null,
    videoUrl: data.videoUrl,
    durationMs: data.durationMs ?? null,
    status: "pending",
  });
  return Number(result[0].insertId);
}

export async function getVideoAssessment(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(videoAssessments).where(eq(videoAssessments.id, id)).limit(1);
  return rows[0] || null;
}

export async function getUserVideoAssessments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoAssessments)
    .where(eq(videoAssessments.userId, userId))
    .orderBy(desc(videoAssessments.createdAt));
}

export async function updateVideoAssessmentStatus(id: number, status: "processing" | "complete" | "failed", errorMessage?: string) {
  const db = await getDb();
  if (!db) return;
  const updates: any = { status };
  if (status === "processing") updates.processingStartedAt = Date.now();
  if (status === "complete") updates.completedAt = Date.now();
  if (errorMessage) updates.errorMessage = errorMessage;
  await db.update(videoAssessments).set(updates).where(eq(videoAssessments.id, id));
}

export async function saveVideoAnalysisResults(id: number, results: {
  bodyLanguage?: any;
  gesturePatterns?: any;
  postureShifts?: any;
  microExpressions?: any;
  eyePatterns?: any;
  dominantAccessPattern?: string;
  eyeMovementSequences?: any;
  leadSystem?: string;
  congruenceScore?: number;
  authenticityMarkers?: any;
  stressIndicators?: any;
  rapportSignals?: any;
  behavioralProfile?: any;
  axisAdjustments?: any;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(videoAssessments).set({
    ...results,
    status: "complete",
    completedAt: Date.now(),
  }).where(eq(videoAssessments.id, id));
}

// ============================================================
// ANALYTICS (Stage 6) — event recording + aggregate reads
// ============================================================

// Fire-and-forget: never let instrumentation break a request.
export async function recordEvent(input: {
  type: string;
  userId?: number | null;
  sessionId?: string | null;
  numericValue?: number | null;
  ok?: boolean | null;
  meta?: unknown;
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(analyticsEvents).values({
      type: input.type,
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      numericValue: input.numericValue ?? null,
      ok: input.ok ?? null,
      meta: (input.meta ?? null) as any,
    });
  } catch (err) {
    console.warn("[analytics] recordEvent failed:", err);
  }
}

// Raw events since a cutoff, normalized to the pure-metrics shape (epoch ms).
export async function getAnalyticsEventsSince(sinceMs: number): Promise<Array<{
  type: string; userId: number | null; numericValue: number | null; ok: boolean | null; createdAt: number;
}>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(analyticsEvents).where(gte(analyticsEvents.createdAt, new Date(sinceMs)));
  return rows.map((r) => ({
    type: r.type,
    userId: r.userId ?? null,
    numericValue: r.numericValue ?? null,
    ok: r.ok ?? null,
    createdAt: new Date(r.createdAt as unknown as string).getTime(),
  }));
}

// Subscription created/canceled events (all time) for retention math.
export async function getSubscriptionEvents(): Promise<{
  created: Array<{ userId: number; at: number }>;
  canceled: Array<{ userId: number; at: number }>;
}> {
  const db = await getDb();
  if (!db) return { created: [], canceled: [] };
  const rows = await db.select().from(analyticsEvents);
  const created: Array<{ userId: number; at: number }> = [];
  const canceled: Array<{ userId: number; at: number }> = [];
  for (const r of rows) {
    if (r.userId == null) continue;
    const at = new Date(r.createdAt as unknown as string).getTime();
    if (r.type === "subscription_created") created.push({ userId: r.userId, at });
    else if (r.type === "subscription_canceled") canceled.push({ userId: r.userId, at });
  }
  return { created, canceled };
}

export async function addMarketingSpend(input: {
  periodStart: number; amountCents: number; channel?: string; note?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(marketingSpend).values({
    periodStart: new Date(input.periodStart),
    amountCents: input.amountCents,
    channel: input.channel ?? null,
    note: input.note ?? null,
  });
}

export async function getMarketingSpendSince(sinceMs: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(marketingSpend).where(gte(marketingSpend.periodStart, new Date(sinceMs)));
  return rows.reduce((sum, r) => sum + (r.amountCents ?? 0), 0);
}
