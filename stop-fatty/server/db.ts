import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, calibrationProfiles, recordings, temptationEntries } from "../drizzle/schema";
import type { InsertCalibrationProfile, InsertRecording, InsertTemptationEntry } from "../drizzle/schema";
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

// ===== CALIBRATION PROFILE =====

export async function getCalibrationProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(calibrationProfiles).where(eq(calibrationProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCalibrationProfile(data: InsertCalibrationProfile) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(calibrationProfiles).where(eq(calibrationProfiles.userId, data.userId)).limit(1);
  if (existing.length > 0) {
    await db.update(calibrationProfiles).set(data).where(eq(calibrationProfiles.userId, data.userId));
  } else {
    await db.insert(calibrationProfiles).values(data);
  }
  // Mark onboarding as completed
  await db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, data.userId));
}

export async function updateImpulseScore(userId: number, delta: number) {
  const db = await getDb();
  if (!db) return;
  const profile = await getCalibrationProfile(userId);
  if (!profile) return;
  const currentScore = profile.impulseControlScore ?? 50;
  let lockedStatus = profile.lockedStatus ?? "none";
  
  // Positive-only scoring: delta should always be >= 0, but clamp just in case
  const effectiveDelta = Math.max(0, delta);
  const newScore = Math.min(100, currentScore + effectiveDelta);
  
  // Victory lock-in: once you reach 75, you achieve royalty status
  if (newScore >= 75 && lockedStatus !== "victory_locked") {
    lockedStatus = "victory_locked";
  }
  
  // Track days at 75+
  const today = new Date();
  let daysAt75Plus = profile.daysAt75Plus ?? 0;
  const lastDate = profile.lastScoreDate;
  if (newScore >= 75) {
    if (!lastDate || today.toDateString() !== lastDate.toDateString()) {
      daysAt75Plus += 1;
    }
  }
  
  await db.update(calibrationProfiles).set({
    impulseControlScore: newScore,
    lockedStatus,
    daysAt75Plus,
    lastScoreDate: today,
  }).where(eq(calibrationProfiles.userId, userId));
  return newScore;
}

/**
 * Lock-in logic using persisted state (positive-only scoring):
 * - Score only goes up. No failure lock-in.
 * - If lockedStatus is "victory_locked", user has achieved permanent royalty identity.
 */
export function computeLockInStatus(score: number, lockedStatus?: string): {
  status: "building" | "active" | "royalty";
  lockedAvatar: "failure" | "victory" | null;
  message: string;
} {
  if (lockedStatus === "victory_locked") {
    return {
      status: "royalty",
      lockedAvatar: "victory",
      message: "You've achieved royalty status. This is your permanent identity. You are who you choose to be.",
    };
  }
  if (score >= 75) {
    return {
      status: "royalty",
      lockedAvatar: "victory",
      message: "You're in royalty territory. Keep it here to lock in your new identity.",
    };
  }
  if (score >= 50) {
    return {
      status: "active",
      lockedAvatar: null,
      message: "You're making progress. Every victory adds to your score.",
    };
  }
  return {
    status: "building",
    lockedAvatar: null,
    message: "Keep building your impulse control. Every resistance earns you points.",
  };
}

/**
 * Raffle eligibility: 6+ months subscribed AND score 75+ for 90+ consecutive days
 */
export function computeRaffleEligibility(user: {
  subscriptionStartedAt: Date | null;
  subscriptionStatus: string;
}, score: number, daysAtOrAbove75: number): {
  eligible: boolean;
  monthsSubscribed: number;
  daysAt75Plus: number;
  status: string;
} {
  const now = new Date();
  let monthsSubscribed = 0;
  if (user.subscriptionStartedAt && user.subscriptionStatus === "active") {
    const diff = now.getTime() - user.subscriptionStartedAt.getTime();
    monthsSubscribed = Math.floor(diff / (30 * 24 * 60 * 60 * 1000));
  }
  const eligible = monthsSubscribed >= 6 && daysAtOrAbove75 >= 90;
  let status = "Not Yet Eligible";
  if (eligible) status = "Qualified!";
  else if (monthsSubscribed >= 6) status = "Need 90 days at 75+";
  else if (daysAtOrAbove75 >= 90) status = "Need 6 months subscribed";
  return { eligible, monthsSubscribed, daysAt75Plus: daysAtOrAbove75, status };
}

// ===== RECORDINGS =====

export async function createRecording(data: InsertRecording) {
  const db = await getDb();
  if (!db) return;
  await db.insert(recordings).values(data);
}

export async function getRecordings(userId: number, type?: "failure" | "victory") {
  const db = await getDb();
  if (!db) return [];
  if (type) {
    return db.select().from(recordings).where(and(eq(recordings.userId, userId), eq(recordings.type, type))).orderBy(desc(recordings.createdAt));
  }
  return db.select().from(recordings).where(eq(recordings.userId, userId)).orderBy(desc(recordings.createdAt));
}

export async function getRandomFailureRecording(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const results = await db.select().from(recordings).where(and(eq(recordings.userId, userId), eq(recordings.type, "failure")));
  if (results.length === 0) return undefined;
  return results[Math.floor(Math.random() * results.length)];
}

// ===== TEMPTATION JOURNAL =====

export async function createTemptationEntry(data: InsertTemptationEntry) {
  const db = await getDb();
  if (!db) return;
  await db.insert(temptationEntries).values(data);
}

export async function getTemptationEntries(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(temptationEntries).where(eq(temptationEntries.userId, userId)).orderBy(desc(temptationEntries.createdAt)).limit(limit);
}

export async function getTemptationStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, resisted: 0, gaveIn: 0, streakDays: 0 };
  const entries = await db.select().from(temptationEntries).where(eq(temptationEntries.userId, userId)).orderBy(desc(temptationEntries.createdAt));
  const total = entries.length;
  const resisted = entries.filter(e => e.outcome === "resisted").length;
  const gaveIn = entries.filter(e => e.outcome === "gave_in").length;
  // Calculate current streak
  let streakDays = 0;
  for (const entry of entries) {
    if (entry.outcome === "resisted") streakDays++;
    else break;
  }
  return { total, resisted, gaveIn, streakDays };
}
