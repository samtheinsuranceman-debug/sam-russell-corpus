// ============================================================
// ARRIVAL SKINS — per-user history (table arrival_skin_history, migration 0083).
//
// beginArrival() reads the user's history, picks this session's skin with the pure
// picker in shared/arrivalSkins.ts, and writes the new history back. If the database
// is missing or the table has not been created yet, it keeps the history in memory
// for the life of the process and says so (`stored: "memory"`); the browser keeps
// its own copy as a further fallback. Never throws.
// ============================================================
import { eq } from "drizzle-orm";
import { arrivalSkinHistory } from "../drizzle/schema";
import { getDb } from "./db";
import { jsonColumn } from "./_core/jsonColumn";
import { EMPTY_HISTORY, SKIN_REGISTRY, hashSeed, selectSkin, type ArrivalSkin, type SkinHistory, type SkinRegistry } from "@shared/arrivalSkins";

const memory = new Map<number, SkinHistory>();

export interface ArrivalBegin {
  skin: ArrivalSkin;
  sessionNumber: number;
  /** Seeds the sonic signature; a hash of the user id, not the id itself. */
  signatureSeed: number;
  houseVoicing: string[];
  stored: "database" | "memory";
}

/** The seed string the picker uses for this user. The same function serves the browser fallback's shape. */
export function userSkinSeed(userId: number): string {
  return `user:${userId}`;
}

export function signatureSeedFor(userId: number): number {
  return hashSeed(`signature-user:${userId}`);
}

function cleanHistory(raw: { sessionCount?: unknown; recent?: unknown } | undefined): SkinHistory {
  if (!raw) return EMPTY_HISTORY;
  const recent = jsonColumn<unknown>(raw.recent, []);
  return {
    sessionCount: Number.isFinite(Number(raw.sessionCount)) ? Math.max(0, Math.floor(Number(raw.sessionCount))) : 0,
    recent: Array.isArray(recent) ? recent.filter((x): x is string => typeof x === "string").slice(-64) : [],
  };
}

export async function readSkinHistory(userId: number): Promise<{ history: SkinHistory; stored: "database" | "memory" }> {
  const db = await getDb();
  if (db) {
    try {
      const rows = await db.select().from(arrivalSkinHistory).where(eq(arrivalSkinHistory.userId, userId)).limit(1);
      return { history: cleanHistory(rows[0]), stored: "database" };
    } catch (e) {
      console.warn("[arrivalSkins] read failed, using memory:", String(e).slice(0, 120));
    }
  }
  return { history: memory.get(userId) ?? EMPTY_HISTORY, stored: "memory" };
}

async function writeSkinHistory(userId: number, history: SkinHistory, lastSkinId: string): Promise<"database" | "memory"> {
  memory.set(userId, history);
  const db = await getDb();
  if (!db) return "memory";
  try {
    await db
      .insert(arrivalSkinHistory)
      .values({ userId, sessionCount: history.sessionCount, recent: history.recent, lastSkinId })
      .onDuplicateKeyUpdate({ set: { sessionCount: history.sessionCount, recent: history.recent, lastSkinId } });
    return "database";
  } catch (e) {
    console.warn("[arrivalSkins] write failed, kept in memory:", String(e).slice(0, 120));
    return "memory";
  }
}

/** One arrival: pick the skin, persist the history, return what the field needs. */
export async function beginArrival(userId: number, reg: SkinRegistry = SKIN_REGISTRY): Promise<ArrivalBegin> {
  const { history } = await readSkinHistory(userId);
  const pick = selectSkin(reg, userSkinSeed(userId), history);
  const stored = await writeSkinHistory(userId, pick.history, pick.skin.id);
  return {
    skin: pick.skin,
    sessionNumber: pick.sessionNumber,
    signatureSeed: signatureSeedFor(userId),
    houseVoicing: reg.houseVoicing,
    stored,
  };
}

/** Tests only. */
export function _resetArrivalMemoryForTests(): void {
  memory.clear();
}
