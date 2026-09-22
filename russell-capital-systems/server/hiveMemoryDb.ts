// ============================================================
// HIVE MEMORY DB — the advisor's working memory and the site-map visit
// record, keyed by users.id. Degrades to an in-process buffer when the
// database is absent (dev, tests), so nothing that informs the hive ever
// throws at the caller. Same null-check discipline as factFinderDb.ts.
// ============================================================
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { jsonColumn } from "./_core/jsonColumn";
import { calculationAuditLogs, hiveMemoryEvents, pageActivityLogs, siteMapVisits, type HiveMemoryPayloadJson } from "../drizzle/schema";
import type { HiveMemoryEvent } from "@shared/hiveMind";
import type { StoredHiveEvent } from "@shared/hiveContext";

const MEMORY_BUFFER_LIMIT = 500;
const memoryBuffer = new Map<number, StoredHiveEvent[]>();
const visitBuffer = new Map<number, Map<string, { visitCount: number; firstVisitedAt: string; lastVisitedAt: string }>>();
let bufferSeq = 0;

/** Record one working-memory event. Returns the stored row (or the buffered one). Never throws. */
export async function recordHiveEvent(userId: number, event: HiveMemoryEvent): Promise<StoredHiveEvent> {
  const now = new Date();
  const db = await getDb();
  if (db) {
    try {
      const res = await db.insert(hiveMemoryEvents).values({
        userId,
        kind: event.kind,
        routePath: event.routePath ?? null,
        engine: event.engine ?? null,
        payload: (event.payload ?? null) as HiveMemoryPayloadJson | null,
        source: event.source ?? null,
        asOf: event.asOf ?? null,
        outcome: event.outcome ?? null,
      });
      const insertId = (res as unknown as Array<{ insertId?: number }>)[0]?.insertId;
      return { id: typeof insertId === "number" ? insertId : 0, createdAt: now.toISOString(), ...event };
    } catch (e) {
      console.warn("[hiveMemory] insert failed, buffering:", String(e).slice(0, 120));
    }
  }
  bufferSeq += 1;
  const stored: StoredHiveEvent = { id: -bufferSeq, createdAt: now.toISOString(), ...event };
  const list = memoryBuffer.get(userId) ?? [];
  list.push(stored);
  if (list.length > MEMORY_BUFFER_LIMIT) list.splice(0, list.length - MEMORY_BUFFER_LIMIT);
  memoryBuffer.set(userId, list);
  return stored;
}

/** Newest `limit` events for a user, newest first. */
export async function recentHiveEvents(userId: number, limit = 50): Promise<StoredHiveEvent[]> {
  const db = await getDb();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(hiveMemoryEvents)
        .where(eq(hiveMemoryEvents.userId, userId))
        .orderBy(desc(hiveMemoryEvents.createdAt), desc(hiveMemoryEvents.id))
        .limit(limit);
      return rows.map(r => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        kind: r.kind,
        routePath: r.routePath ?? undefined,
        engine: r.engine ?? undefined,
        payload: r.payload ? jsonColumn<Record<string, unknown>>(r.payload, {}) : undefined,
        source: r.source ?? undefined,
        asOf: r.asOf ?? undefined,
        outcome: r.outcome ?? undefined,
      }));
    } catch (e) {
      console.warn("[hiveMemory] select failed, using buffer:", String(e).slice(0, 120));
    }
  }
  const list = memoryBuffer.get(userId) ?? [];
  return [...list].reverse().slice(0, limit);
}

/**
 * The trunk already records every route change (`page_activity_logs`, written by
 * ComplianceGate) and every calculation (`calculation_audit_logs`), but no AI
 * procedure has ever read them. Fold them in as working-memory events so the
 * hive is informed by what the site already knows on day one.
 */
export async function legacyActivityEvents(userId: number, limit = 40): Promise<StoredHiveEvent[]> {
  const db = await getDb();
  if (!db) return [];
  const out: StoredHiveEvent[] = [];
  try {
    const pages = await db
      .select()
      .from(pageActivityLogs)
      .where(eq(pageActivityLogs.userId, userId))
      .orderBy(desc(pageActivityLogs.enteredAt))
      .limit(limit);
    for (const p of pages) {
      out.push({ id: -1_000_000 - p.id, createdAt: p.enteredAt.toISOString(), kind: "page_visit", routePath: p.pagePath, payload: { title: p.pageTitle, durationSecs: p.durationSecs ?? undefined, legacy: true } });
    }
  } catch (e) {
    console.warn("[hiveMemory] page_activity_logs read failed:", String(e).slice(0, 120));
  }
  try {
    const calcs = await db
      .select()
      .from(calculationAuditLogs)
      .where(eq(calculationAuditLogs.userId, userId))
      .orderBy(desc(calculationAuditLogs.createdAt))
      .limit(limit);
    for (const c of calcs) {
      const outputs = c.outputs ? jsonColumn<Record<string, unknown>>(c.outputs, {}) : {};
      out.push({ id: -2_000_000 - c.id, createdAt: c.createdAt.toISOString(), kind: "calc_result", routePath: c.pagePath ?? undefined, engine: c.calculationType, payload: { ...outputs, summary: c.summary ?? undefined, legacy: true } });
    }
  } catch (e) {
    console.warn("[hiveMemory] calculation_audit_logs read failed:", String(e).slice(0, 120));
  }
  return out;
}

export type VisitRecord = { routePath: string; visitCount: number; firstVisitedAt: string; lastVisitedAt: string };

/** Mark a route visited for the map (the neon-green record). Upsert; never throws. */
export async function markRouteVisited(userId: number, routePath: string): Promise<VisitRecord> {
  const nowIso = new Date().toISOString();
  const db = await getDb();
  if (db) {
    try {
      await db
        .insert(siteMapVisits)
        .values({ userId, routePath })
        .onDuplicateKeyUpdate({ set: { visitCount: sql`${siteMapVisits.visitCount} + 1` } });
      const rows = await db
        .select()
        .from(siteMapVisits)
        .where(and(eq(siteMapVisits.userId, userId), eq(siteMapVisits.routePath, routePath)))
        .limit(1);
      const r = rows[0];
      if (r) return { routePath, visitCount: r.visitCount, firstVisitedAt: r.firstVisitedAt.toISOString(), lastVisitedAt: r.lastVisitedAt.toISOString() };
    } catch (e) {
      console.warn("[siteMap] upsert failed, buffering:", String(e).slice(0, 120));
    }
  }
  const map = visitBuffer.get(userId) ?? new Map();
  const prev = map.get(routePath);
  const rec = prev
    ? { visitCount: prev.visitCount + 1, firstVisitedAt: prev.firstVisitedAt, lastVisitedAt: nowIso }
    : { visitCount: 1, firstVisitedAt: nowIso, lastVisitedAt: nowIso };
  map.set(routePath, rec);
  visitBuffer.set(userId, map);
  return { routePath, ...rec };
}

/** Every route this user has ever closed from the map: what turns green on login. */
export async function visitedRoutes(userId: number): Promise<VisitRecord[]> {
  const db = await getDb();
  if (db) {
    try {
      const rows = await db.select().from(siteMapVisits).where(eq(siteMapVisits.userId, userId));
      return rows.map(r => ({ routePath: r.routePath, visitCount: r.visitCount, firstVisitedAt: r.firstVisitedAt.toISOString(), lastVisitedAt: r.lastVisitedAt.toISOString() }));
    } catch (e) {
      console.warn("[siteMap] select failed, using buffer:", String(e).slice(0, 120));
    }
  }
  const map = visitBuffer.get(userId) ?? new Map();
  return Array.from(map.entries()).map(([routePath, rec]) => ({ routePath, ...rec }));
}

/** Tests only. */
export function _resetHiveBuffersForTests(): void {
  memoryBuffer.clear();
  visitBuffer.clear();
  bufferSeq = 0;
}
