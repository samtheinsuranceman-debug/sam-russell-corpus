// ============================================================
// MESSAGING + AUTOMATION — data access for opt-outs, the outbound message
// log, lead follow-up sequences, and cached market benchmarks. Graceful when
// the DB is not configured (returns empty / no-ops), like leadsDb.ts.
// ============================================================
import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { getDb } from "./db";
import { emailOptOuts, leadFollowups, marketDataPoints, outboundMessages, smsOptOuts, type LeadFollowup, type OutboundMessage } from "../drizzle/schema";

// ─── Opt-outs ────────────────────────────────────────────────────────────────
export async function isSmsOptedOut(phone: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: smsOptOuts.id }).from(smsOptOuts).where(eq(smsOptOuts.phone, phone)).limit(1);
  return rows.length > 0;
}
export async function recordSmsOptOut(phone: string, source = "reply"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  if (await isSmsOptedOut(phone)) return;
  await db.insert(smsOptOuts).values({ phone, source });
}
export async function clearSmsOptOut(phone: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(smsOptOuts).where(eq(smsOptOuts.phone, phone));
}

export async function isEmailOptedOut(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: emailOptOuts.id }).from(emailOptOuts).where(eq(emailOptOuts.email, email.trim().toLowerCase())).limit(1);
  return rows.length > 0;
}
export async function recordEmailOptOut(email: string, source = "link"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const normalized = email.trim().toLowerCase();
  if (await isEmailOptedOut(normalized)) return;
  await db.insert(emailOptOuts).values({ email: normalized, source });
}

// ─── Outbound message log ────────────────────────────────────────────────────
export type LogMessageInput = Omit<typeof outboundMessages.$inferInsert, "id" | "createdAt">;
export async function logOutboundMessage(entry: LogMessageInput): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(outboundMessages).values({ ...entry, body: entry.body.slice(0, 20000) });
  const id = Number((result as unknown as [{ insertId?: number }])[0]?.insertId ?? 0);
  return id || null;
}
export async function listMessagesForClient(clientId: number, workspaceId: number, limit = 100): Promise<OutboundMessage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(outboundMessages)
    .where(and(eq(outboundMessages.clientId, clientId), eq(outboundMessages.workspaceId, workspaceId)))
    .orderBy(desc(outboundMessages.createdAt)).limit(limit);
}
export async function listMessagesForLead(leadId: number, limit = 100): Promise<OutboundMessage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(outboundMessages).where(eq(outboundMessages.leadId, leadId)).orderBy(desc(outboundMessages.createdAt)).limit(limit);
}

// ─── Lead follow-up sequence ─────────────────────────────────────────────────
export type FollowupPlanStep = { step: string; channel: "email" | "sms"; scheduledFor: Date };

/** Create the pending rows for a lead; a lead only ever gets one sequence. */
export async function scheduleFollowups(leadId: number, plan: FollowupPlanStep[]): Promise<number> {
  const db = await getDb();
  if (!db || plan.length === 0) return 0;
  const existing = await db.select({ id: leadFollowups.id }).from(leadFollowups).where(eq(leadFollowups.leadId, leadId)).limit(1);
  if (existing.length) return 0;
  await db.insert(leadFollowups).values(plan.map((p) => ({ leadId, step: p.step, channel: p.channel, scheduledFor: p.scheduledFor })));
  return plan.length;
}
export async function dueFollowups(now = new Date(), limit = 50): Promise<LeadFollowup[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadFollowups)
    .where(and(eq(leadFollowups.status, "pending"), lte(leadFollowups.scheduledFor, now)))
    .orderBy(leadFollowups.scheduledFor).limit(limit);
}
/** Flip a pending row to its final state. Returns false if it was no longer pending (another worker took it). */
export async function settleFollowup(id: number, status: "sent" | "skipped" | "failed", reason?: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(leadFollowups)
    .set({ status, reason: reason?.slice(0, 300), sentAt: status === "sent" ? new Date() : null })
    .where(and(eq(leadFollowups.id, id), eq(leadFollowups.status, "pending")));
  const affected = Number((result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
  return affected > 0;
}
export async function cancelFollowupsForLead(leadId: number, reason: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(leadFollowups).set({ status: "cancelled", reason: reason.slice(0, 300) })
    .where(and(eq(leadFollowups.leadId, leadId), eq(leadFollowups.status, "pending")));
}
export async function listFollowupsForLead(leadId: number): Promise<LeadFollowup[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadFollowups).where(eq(leadFollowups.leadId, leadId)).orderBy(leadFollowups.scheduledFor);
}
export async function listFollowupsForLeads(leadIds: number[]): Promise<LeadFollowup[]> {
  const db = await getDb();
  if (!db || leadIds.length === 0) return [];
  return db.select().from(leadFollowups).where(inArray(leadFollowups.leadId, leadIds)).orderBy(leadFollowups.scheduledFor);
}

// ─── Market benchmarks cache ─────────────────────────────────────────────────
export type MarketPoint = { series: string; value: number; asOf: string; source: string; fetchedAt: Date };
export async function upsertMarketPoint(p: { series: string; value: number; asOf: string; source?: string }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: marketDataPoints.id }).from(marketDataPoints).where(eq(marketDataPoints.series, p.series)).limit(1);
  const row = { value: p.value.toFixed(4), asOf: p.asOf, source: p.source ?? "fred", fetchedAt: new Date() };
  if (existing[0]) await db.update(marketDataPoints).set(row).where(eq(marketDataPoints.id, existing[0].id));
  else await db.insert(marketDataPoints).values({ series: p.series, ...row });
}
export async function getMarketPoints(series: string[]): Promise<MarketPoint[]> {
  const db = await getDb();
  if (!db || series.length === 0) return [];
  const rows = await db.select().from(marketDataPoints).where(inArray(marketDataPoints.series, series));
  return rows.map((r) => ({ series: r.series, value: Number(r.value), asOf: r.asOf, source: r.source, fetchedAt: r.fetchedAt }));
}
