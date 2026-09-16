import { eq, desc, and, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  hipaaConsents, InsertHipaaConsent,
  activityLogs, InsertActivityLog,
  assessments, InsertAssessment,
  diagnosticReports, InsertDiagnosticReport,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── HIPAA Consent ────────────────────────────────────────────────────────────
export async function saveHipaaConsent(data: InsertHipaaConsent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(hipaaConsents).values(data);
  return result;
}

export async function getConsentBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(hipaaConsents)
    .where(eq(hipaaConsents.sessionId, sessionId))
    .orderBy(desc(hipaaConsents.signedAt)).limit(1);
  const latest = result[0] ?? null;
  return latest?.withdrawnAt ? null : latest;
}

export async function getConsentByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(hipaaConsents)
    .where(eq(hipaaConsents.userId, userId))
    .orderBy(desc(hipaaConsents.signedAt)).limit(1);
  const latest = result[0] ?? null;
  return latest?.withdrawnAt ? null : latest;
}

export async function getAllConsents(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(hipaaConsents)
    .orderBy(desc(hipaaConsents.signedAt))
    .limit(limit)
    .offset(offset);
}

// ─── Activity Logs ────────────────────────────────────────────────────────────
export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(activityLogs).values(data);
  } catch (err) {
    console.warn("[ActivityLog] Failed to write log:", err);
  }
}

export async function getActivityBySession(sessionId: string, limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.sessionId, sessionId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function getActivityByUser(userId: number, limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function getAllActivityLogs(limit = 500, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getActivityStats() {
  const db = await getDb();
  if (!db) return { totalEvents: 0, uniqueSessions: 0, authenticatedUsers: 0, hipaaConsents: 0, totalAssessments: 0 };
  const [logCount] = await db.select({ value: count() }).from(activityLogs);
  const [consentCount] = await db.select({ value: count() }).from(hipaaConsents);
  const [assessmentCount] = await db.select({ value: count() }).from(assessments);
  // Count distinct sessions and authenticated users from activity logs
  const allLogs = await db.select({ sessionId: activityLogs.sessionId, userId: activityLogs.userId }).from(activityLogs);
  const uniqueSessions = new Set(allLogs.map(l => l.sessionId).filter(Boolean)).size;
  const authenticatedUsers = new Set(allLogs.map(l => l.userId).filter(Boolean)).size;
  return {
    totalEvents: logCount?.value ?? 0,
    uniqueSessions,
    authenticatedUsers,
    hipaaConsents: consentCount?.value ?? 0,
    totalAssessments: assessmentCount?.value ?? 0,
  };
}

// ─── Assessments ──────────────────────────────────────────────────────────────
export async function createAssessment(data: InsertAssessment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assessments).values(data);
  return result;
}

export async function getAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateAssessment(id: number, data: Partial<InsertAssessment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(assessments).set(data).where(eq(assessments.id, id));
}

export async function getAssessmentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(assessments)
    .where(eq(assessments.userId, userId))
    .orderBy(desc(assessments.createdAt));
}

// ─── Diagnostic Reports ───────────────────────────────────────────────────────
export async function createDiagnosticReport(data: InsertDiagnosticReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(diagnosticReports).values(data);
  return result;
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(diagnosticReports).where(eq(diagnosticReports.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getReportByShareToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(diagnosticReports).where(eq(diagnosticReports.shareToken, token)).limit(1);
  return result[0] ?? null;
}

export async function getReportsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(diagnosticReports)
    .where(eq(diagnosticReports.userId, userId))
    .orderBy(desc(diagnosticReports.createdAt));
}

export async function updateReport(id: number, data: Partial<InsertDiagnosticReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(diagnosticReports).set(data).where(eq(diagnosticReports.id, id));
}

// ─── Digital Twin ─────────────────────────────────────────────────────────────
import {
  digitalTwins, InsertDigitalTwin,
  DigitalTwinSnapshot, DigitalTwinAlert,
} from "../drizzle/schema";

export async function getDigitalTwinByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(digitalTwins).where(eq(digitalTwins.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function createDigitalTwin(data: InsertDigitalTwin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(digitalTwins).values(data);
  return result;
}

export async function updateDigitalTwin(userId: number, data: Partial<InsertDigitalTwin>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(digitalTwins).set({ ...data, updatedAt: new Date() }).where(eq(digitalTwins.userId, userId));
}

export async function upsertDigitalTwin(userId: number, data: Partial<InsertDigitalTwin>) {
  const existing = await getDigitalTwinByUserId(userId);
  if (existing) {
    await updateDigitalTwin(userId, data);
  } else {
    await createDigitalTwin({
      userId,
      domainScores: data.domainScores ?? {},
      compositeScore: data.compositeScore ?? 50,
      currentState: data.currentState ?? "stable",
      trajectoryHistory: data.trajectoryHistory ?? [],
      alertThresholds: data.alertThresholds ?? null,
      activeAlerts: data.activeAlerts ?? [],
      lastUpdateSource: data.lastUpdateSource ?? "system",
      lastAssessmentId: data.lastAssessmentId ?? null,
      lastUpdated: new Date(),
    });
  }
}

// ─── Mood Journal ─────────────────────────────────────────────────────────────
import {
  moodJournalEntries, InsertMoodJournalEntry,
  wellnessPlans, InsertWellnessPlan,
  medications, InsertMedication,
  medicationLogs,
} from "../drizzle/schema";
type InsertMedicationLog = typeof medicationLogs.$inferInsert;

export async function createJournalEntry(data: InsertMoodJournalEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(moodJournalEntries).values(data);
  return result.insertId as number;
}

export async function getJournalEntriesByUser(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moodJournalEntries)
    .where(eq(moodJournalEntries.userId, userId))
    .orderBy(desc(moodJournalEntries.createdAt))
    .limit(limit);
}

export async function getJournalEntryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(moodJournalEntries).where(eq(moodJournalEntries.id, id)).limit(1);
  return rows[0] ?? null;
}

// ─── Wellness Plans ───────────────────────────────────────────────────────────
export async function createWellnessPlan(data: InsertWellnessPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(wellnessPlans).values(data);
  return result.insertId as number;
}

export async function getActiveWellnessPlan(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(wellnessPlans)
    .where(eq(wellnessPlans.userId, userId))
    .orderBy(desc(wellnessPlans.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateWellnessPlan(id: number, data: Partial<InsertWellnessPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(wellnessPlans).set({ ...data, updatedAt: new Date() }).where(eq(wellnessPlans.id, id));
}

// ─── Medications ──────────────────────────────────────────────────────────────
export async function createMedication(data: InsertMedication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(medications).values(data);
  return result.insertId as number;
}

export async function getMedicationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(medications)
    .where(eq(medications.userId, userId))
    .orderBy(desc(medications.createdAt));
}

export async function updateMedication(id: number, data: Partial<InsertMedication>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(medications).set({ ...data, updatedAt: new Date() }).where(eq(medications.id, id));
}

export async function deleteMedication(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(medications).set({ isActive: false, updatedAt: new Date() }).where(eq(medications.id, id));
}

export async function logMedicationTaken(data: InsertMedicationLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(medicationLogs).values(data);
  return result.insertId as number;
}

export async function getMedicationLogs(userId: number, limit = 60) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(medicationLogs)
    .where(eq(medicationLogs.userId, userId))
    .orderBy(desc(medicationLogs.takenAt))
    .limit(limit);
}

// ─── Mental Credit Score ──────────────────────────────────────────────────────

/**
 * Gather the observations the MCS engine needs and score them.
 *
 * The computation itself lives in `shared/engines/mentalCreditScore.ts` and is
 * pure; this function's only job is reading. With no database it returns a
 * zero-coverage result rather than throwing, so callers degrade the same way
 * the rest of this layer does.
 */
export async function calculateMCS(userId: number) {
  const { computeMCS, WINDOW_DAYS } = await import("@shared/engines/mentalCreditScore");
  const db = await getDb();
  if (!db) return computeMCS({});

  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);

  const {
    progressCheckins, moodJournalEntries, medicationLogs, digitalTwins,
    crisisEvents, diagnosticReports,
  } = await import("../drizzle/schema");
  const { gte } = await import("drizzle-orm");

  const [checkins, journal, medLogs, twins, crises, reports] = await Promise.all([
    db.select().from(progressCheckins)
      .where(and(eq(progressCheckins.userId, userId), gte(progressCheckins.createdAt, since))).limit(200),
    db.select().from(moodJournalEntries)
      .where(and(eq(moodJournalEntries.userId, userId), gte(moodJournalEntries.createdAt, since))).limit(200),
    db.select().from(medicationLogs)
      .where(and(eq(medicationLogs.userId, userId), gte(medicationLogs.takenAt, since))).limit(500),
    db.select().from(digitalTwins).where(eq(digitalTwins.userId, userId)).limit(1),
    db.select().from(crisisEvents)
      .where(and(eq(crisisEvents.userId, userId), gte(crisisEvents.createdAt, since)))
      .orderBy(desc(crisisEvents.createdAt)).limit(50),
    db.select().from(diagnosticReports)
      .where(eq(diagnosticReports.userId, userId))
      .orderBy(desc(diagnosticReports.createdAt)).limit(1),
  ]);

  return computeMCS({
    checkins: checkins.map(c => ({ overallScore: c.overallScore, checkinDate: c.createdAt })),
    journal: journal.map(j => ({ moodScore: j.moodScore, riskFlagged: j.riskFlagged, createdAt: j.createdAt })),
    medicationLogs: medLogs.map(l => ({ skipped: l.skipped, takenAt: l.takenAt })),
    twinComposite: twins[0]?.compositeScore ?? null,
    crisisEvents: crises.map(c => ({ tier: c.tier, createdAt: c.createdAt })),
    prsScore: reports[0]?.prsScore ?? null,
  });
}

export async function saveMentalCreditScore(row: {
  userId: number;
  score: number;
  riskZone: "critical" | "elevated" | "guarded" | "resilient" | "optimal";
  breakdown: unknown;
  triggerSource: string;
  referenceId: number | null;
  referenceType: string | null;
  delta: number;
}) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot save MCS: database not available"); return null; }
  const { mentalCreditScores } = await import("../drizzle/schema");
  const result = await db.insert(mentalCreditScores).values(row as never);
  return (result as unknown as { insertId?: number }).insertId ?? null;
}

export async function getLatestMCS(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const { mentalCreditScores } = await import("../drizzle/schema");
  const rows = await db.select().from(mentalCreditScores)
    .where(eq(mentalCreditScores.userId, userId))
    .orderBy(desc(mentalCreditScores.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function getMCSHistory(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  const { mentalCreditScores } = await import("../drizzle/schema");
  return await db.select().from(mentalCreditScores)
    .where(eq(mentalCreditScores.userId, userId))
    .orderBy(desc(mentalCreditScores.createdAt)).limit(limit);
}
