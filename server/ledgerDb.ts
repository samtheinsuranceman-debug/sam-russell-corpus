// ============================================================
// THE PLAN LEDGER — storage. Append-only, hash-chained per subject.
// Graceful when the database is not configured (no-ops / empty).
// ============================================================
import { createHash } from "node:crypto";
import { and, asc, desc, eq, gt, inArray, lt, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { jsonColumn } from "./_core/jsonColumn";
import { planEvents, type PlanEventRow } from "../drizzle/schema";
import { canonicalEvent, ledgerSubject, type LedgerEvent, type LedgerEventInput, type LedgerKind } from "@shared/planLedger";

export const GENESIS_HASH = "0".repeat(64);

export function hashEvent(prevHash: string, e: Parameters<typeof canonicalEvent>[0]): string {
  return createHash("sha256").update(`${prevHash}|${canonicalEvent(e)}`).digest("hex");
}

function rowToEvent(r: PlanEventRow): LedgerEvent {
  return {
    id: r.id, subject: r.subject, seq: r.seq, kind: r.kind, source: r.source as LedgerEvent["source"], key: r.key, label: r.label,
    value: jsonColumn<unknown>(r.value, null), prevValue: jsonColumn<unknown>(r.prevValue, null), summary: r.summary, actorName: r.actorName,
    occurredAt: r.occurredAt, userId: r.userId, clientId: r.clientId, leadId: r.leadId, workspaceId: r.workspaceId, prevHash: r.prevHash, hash: r.hash, createdAt: r.createdAt,
  };
}

async function chainHead(subject: string): Promise<{ seq: number; hash: string }> {
  const db = await getDb();
  if (!db) return { seq: 0, hash: GENESIS_HASH };
  const rows = await db.select({ seq: planEvents.seq, hash: planEvents.hash }).from(planEvents).where(eq(planEvents.subject, subject)).orderBy(desc(planEvents.seq)).limit(1);
  return rows[0] ? { seq: rows[0].seq, hash: rows[0].hash } : { seq: 0, hash: GENESIS_HASH };
}

/**
 * Append events to their subject's chain, in order. All events in one call
 * must share a subject (derived from clientId > userId > leadId). Returns the
 * number written. Never throws on a missing database.
 */
export async function appendEvents(inputs: LedgerEventInput[]): Promise<number> {
  const db = await getDb();
  if (!db || inputs.length === 0) return 0;
  const subject = ledgerSubject(inputs[0]!);
  let { seq, hash: prevHash } = await chainHead(subject);
  const rows = inputs.map((e) => {
    seq += 1;
    // MySQL TIMESTAMP keeps whole seconds: hash exactly what will be read back.
    const occurredAt = new Date(Math.floor((e.occurredAt ?? new Date()).getTime() / 1000) * 1000);
    const hash = hashEvent(prevHash, { subject, seq, kind: e.kind, source: e.source, key: e.key ?? null, value: e.value ?? null, prevValue: e.prevValue ?? null, summary: e.summary, occurredAt });
    const row = {
      subject, seq, userId: e.userId ?? null, clientId: e.clientId ?? null, leadId: e.leadId ?? null, workspaceId: e.workspaceId ?? null,
      kind: e.kind, source: e.source, key: e.key ?? null, label: e.label?.slice(0, 200) ?? null, value: e.value ?? null, prevValue: e.prevValue ?? null,
      summary: e.summary.slice(0, 4000), actorName: e.actorName?.slice(0, 200) ?? null, occurredAt, prevHash, hash,
    };
    prevHash = hash;
    return row;
  });
  await db.insert(planEvents).values(rows);
  return rows.length;
}

export type ListOptions = { kinds?: LedgerKind[]; since?: Date; until?: Date; beforeSeq?: number; limit?: number; ascending?: boolean };

export async function listEvents(subject: string, opts: ListOptions = {}): Promise<LedgerEvent[]> {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq(planEvents.subject, subject)];
  if (opts.kinds?.length) conds.push(inArray(planEvents.kind, opts.kinds));
  if (opts.since) conds.push(gt(planEvents.occurredAt, opts.since));
  if (opts.until) conds.push(lte(planEvents.occurredAt, opts.until));
  if (opts.beforeSeq) conds.push(lt(planEvents.seq, opts.beforeSeq));
  const rows = await db.select().from(planEvents).where(and(...conds)).orderBy(opts.ascending ? asc(planEvents.seq) : desc(planEvents.seq)).limit(Math.min(2000, Math.max(1, opts.limit ?? 200)));
  return rows.map(rowToEvent);
}

export async function countEvents(subject: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ n: sql<number>`count(*)` }).from(planEvents).where(eq(planEvents.subject, subject));
  return Number(rows[0]?.n ?? 0);
}

/** Recompute every hash on a subject's chain and report the first break, if any. */
export async function verifyChain(subject: string): Promise<{ ok: boolean; events: number; brokenAtSeq: number | null }> {
  const events = await listEvents(subject, { ascending: true, limit: 2000 });
  let prevHash = GENESIS_HASH;
  let expectedSeq = 1;
  for (const e of events) {
    const h = hashEvent(prevHash, { subject: e.subject, seq: e.seq, kind: e.kind, source: e.source, key: e.key, value: e.value, prevValue: e.prevValue, summary: e.summary, occurredAt: e.occurredAt });
    if (e.seq !== expectedSeq || e.prevHash !== prevHash || e.hash !== h) return { ok: false, events: events.length, brokenAtSeq: e.seq };
    prevHash = h;
    expectedSeq += 1;
  }
  return { ok: true, events: events.length, brokenAtSeq: null };
}
