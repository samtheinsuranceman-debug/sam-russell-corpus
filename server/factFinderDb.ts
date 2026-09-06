// ============================================================
// CLIENT FACT FINDER + JOURNEYS — data access. Graceful when the database is
// not configured (returns null / no-ops), like leadsDb.ts.
// ============================================================
import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { jsonColumn } from "./_core/jsonColumn";
import { clientFactFinders, clientJourneys, type ClientJourneyJson } from "../drizzle/schema";
import { factFinderCompleteness, type ClientFactFinder, type Completeness } from "@shared/clientFactFinder";

export type StoredFactFinder = { data: ClientFactFinder; completeness: number; completedAt: Date | null; updatedAt: Date };

export async function getFactFinderForUser(userId: number): Promise<StoredFactFinder | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(clientFactFinders).where(eq(clientFactFinders.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return { data: jsonColumn<ClientFactFinder>(row.data, { version: 1, sections: {}, lists: {} }), completeness: row.completeness, completedAt: row.completedAt ?? null, updatedAt: row.updatedAt };
}

export async function saveFactFinderForUser(userId: number, data: ClientFactFinder): Promise<{ completeness: Completeness; completedAt: Date | null } | null> {
  const db = await getDb();
  if (!db) return null;
  if (data.version !== 1) throw new Error("Unsupported fact finder version");
  const completeness = factFinderCompleteness(data);
  const existing = await getFactFinderForUser(userId);
  const completedAt = completeness.complete ? (existing?.completedAt ?? new Date()) : null;
  await db
    .insert(clientFactFinders)
    .values({ userId, data, completeness: completeness.percent, completedAt })
    .onDuplicateKeyUpdate({ set: { data, completeness: completeness.percent, completedAt } });
  return { completeness, completedAt };
}

export async function deleteFactFinderForUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientFactFinders).where(eq(clientFactFinders.userId, userId));
}

export async function saveJourneyForUser(userId: number, questions: string[], journey: ClientJourneyJson): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const res = await db.insert(clientJourneys).values({ userId, questions, journey });
  const insertId = (res as unknown as Array<{ insertId?: number }>)[0]?.insertId;
  return typeof insertId === "number" ? insertId : null;
}

export async function getLatestJourneyForUser(userId: number): Promise<{ id: number; questions: string[]; journey: ClientJourneyJson; createdAt: Date } | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(clientJourneys).where(eq(clientJourneys.userId, userId)).orderBy(desc(clientJourneys.id)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, questions: jsonColumn<string[]>(row.questions, []), journey: jsonColumn<ClientJourneyJson>(row.journey, { coreQuestions: [], emergentQuestion: "", steps: [], generatedBy: "" }), createdAt: row.createdAt };
}
