// ============================================================
// CONTROLS — storage for consent grants, agent mandates, money movements,
// automations and their runs, document provenance and fact suggestions.
// Graceful when the database is not configured (no-ops / empty), like
// every other *Db module here.
// ============================================================
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { jsonColumn } from "./_core/jsonColumn";
import { agentMandates, automationRuns, consentGrants, documentProvenance, factSuggestions, moneyMovements, planAutomations, type AgentMandateRow, type AutomationRunRow, type ConsentGrantRow, type DocumentProvenanceRow, type FactSuggestionRow, type MoneyMovementRow, type PlanAutomationRow } from "../drizzle/schema";
import { checkConsent, type ConsentCheck, type ConsentGrantLike } from "@shared/consent";
import { isMandateActive, type MandateLike } from "@shared/mandates";

export type Ids = { userId?: number | null; clientId?: number | null; leadId?: number | null; workspaceId?: number | null };

function isDuplicate(err: unknown): boolean {
  const s = String((err as { code?: string })?.code ?? err);
  return s.includes("ER_DUP_ENTRY") || s.includes("Duplicate entry");
}

// ─── Consent ─────────────────────────────────────────────────────────────────
export type ConsentRow = ConsentGrantLike & { subject: string; purpose: string | null; grantedByName: string | null; createdAt: Date; revokedReason: string | null };

function consentRow(r: ConsentGrantRow): ConsentRow {
  return { id: r.id, subject: r.subject, granteeType: r.granteeType, granteeId: r.granteeId, granteeLabel: r.granteeLabel, scopes: jsonColumn<string[]>(r.scopes, []), purpose: r.purpose, startsAt: r.startsAt, expiresAt: r.expiresAt, revokedAt: r.revokedAt, revokedReason: r.revokedReason, grantedByName: r.grantedByName, createdAt: r.createdAt };
}

export async function insertConsent(row: Omit<typeof consentGrants.$inferInsert, "id" | "createdAt">): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.insert(consentGrants).values(row).$returningId();
  return r?.id ?? null;
}

export async function listConsents(subject: string, opts: { activeOnly?: boolean } = {}): Promise<ConsentRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(consentGrants).where(eq(consentGrants.subject, subject)).orderBy(desc(consentGrants.id)).limit(500);
  const out = rows.map(consentRow);
  return opts.activeOnly ? out.filter((g) => !g.revokedAt && (!g.expiresAt || g.expiresAt.getTime() > Date.now())) : out;
}

export async function revokeConsent(id: number, subject: string, reason: string): Promise<ConsentRow | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(consentGrants).where(and(eq(consentGrants.id, id), eq(consentGrants.subject, subject))).limit(1);
  if (!row || row.revokedAt) return null;
  await db.update(consentGrants).set({ revokedAt: new Date(), revokedReason: reason.slice(0, 500) }).where(eq(consentGrants.id, id));
  return consentRow({ ...row, revokedAt: new Date(), revokedReason: reason });
}

/** The one call every scoped read goes through. */
export async function consentFor(subject: string, granteeId: string, scope: string, now: Date = new Date()): Promise<ConsentCheck> {
  return checkConsent(await listConsents(subject), granteeId, scope, now);
}

// ─── Mandates ────────────────────────────────────────────────────────────────
export type MandateRow = MandateLike & { subject: string; grantedByName: string | null; createdAt: Date; revokedReason: string | null };

function mandateRow(r: AgentMandateRow): MandateRow {
  return { id: r.id, subject: r.subject, agentId: r.agentId, label: r.label, actions: jsonColumn<string[]>(r.actions, []), accounts: jsonColumn<string[]>(r.accounts, []), purpose: r.purpose, ceilingCents: r.ceilingCents, periodCeilingCents: r.periodCeilingCents, periodDays: r.periodDays, approvalAboveCents: r.approvalAboveCents, startsAt: r.startsAt, expiresAt: r.expiresAt, revokedAt: r.revokedAt, revokedReason: r.revokedReason, grantedByName: r.grantedByName, createdAt: r.createdAt };
}

export async function insertMandate(row: Omit<typeof agentMandates.$inferInsert, "id" | "createdAt">): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.insert(agentMandates).values(row).$returningId();
  return r?.id ?? null;
}

export async function listMandates(subject: string): Promise<MandateRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(agentMandates).where(eq(agentMandates.subject, subject)).orderBy(desc(agentMandates.id)).limit(500);
  return rows.map(mandateRow);
}

export async function revokeMandate(id: number, subject: string, reason: string): Promise<MandateRow | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(agentMandates).where(and(eq(agentMandates.id, id), eq(agentMandates.subject, subject))).limit(1);
  if (!row || row.revokedAt) return null;
  await db.update(agentMandates).set({ revokedAt: new Date(), revokedReason: reason.slice(0, 500) }).where(eq(agentMandates.id, id));
  return mandateRow({ ...row, revokedAt: new Date(), revokedReason: reason });
}

/** The newest active mandate this agent holds for this action on this subject. */
export async function activeMandate(subject: string, agentId: string, action: string, now: Date = new Date()): Promise<MandateRow | null> {
  const all = await listMandates(subject);
  return all.find((m) => m.agentId === agentId && isMandateActive(m, now) && m.actions.includes(action)) ?? null;
}

// ─── Money movements ─────────────────────────────────────────────────────────
export type MovementRow = Omit<MoneyMovementRow, "reasons" | "requiredApprovals"> & { reasons: string[]; requiredApprovals: string[] };

function movementRow(r: MoneyMovementRow): MovementRow {
  return { ...r, reasons: jsonColumn<string[]>(r.reasons, []), requiredApprovals: jsonColumn<string[]>(r.requiredApprovals, []) };
}

/** Returns null when the idempotency key was already used (the earlier movement stands). */
export async function insertMovement(row: Omit<typeof moneyMovements.$inferInsert, "id" | "createdAt">): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const [r] = await db.insert(moneyMovements).values(row).$returningId();
    return r?.id ?? null;
  } catch (err) {
    if (isDuplicate(err)) return null;
    throw err;
  }
}

export async function getMovement(id: number, subject: string): Promise<MovementRow | null> {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.select().from(moneyMovements).where(and(eq(moneyMovements.id, id), eq(moneyMovements.subject, subject))).limit(1);
  return r ? movementRow(r) : null;
}

export async function updateMovement(id: number, patch: Partial<typeof moneyMovements.$inferInsert>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(moneyMovements).set(patch).where(eq(moneyMovements.id, id));
}

export async function listMovements(subject: string, opts: { status?: MoneyMovementRow["status"][]; limit?: number } = {}): Promise<MovementRow[]> {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq(moneyMovements.subject, subject)];
  if (opts.status?.length) conds.push(inArray(moneyMovements.status, opts.status));
  const rows = await db.select().from(moneyMovements).where(and(...conds)).orderBy(desc(moneyMovements.id)).limit(Math.min(500, opts.limit ?? 100));
  return rows.map(movementRow);
}

/** What an agent has moved (approved or executed) in the rolling period. */
export async function spentInPeriod(subject: string, agentId: string, periodDays: number, now: Date = new Date()): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const since = new Date(now.getTime() - periodDays * 86_400_000);
  const rows = await db.select({ n: sql<number>`coalesce(sum(${moneyMovements.amountCents}), 0)` }).from(moneyMovements)
    .where(and(eq(moneyMovements.subject, subject), eq(moneyMovements.agentId, agentId), inArray(moneyMovements.status, ["approved", "executed"]), gte(moneyMovements.createdAt, since)));
  return Number(rows[0]?.n ?? 0);
}

/** Counterparties that have been paid before (executed, even if later reversed). */
export async function knownPayees(subject: string): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ c: moneyMovements.counterparty }).from(moneyMovements)
    .where(and(eq(moneyMovements.subject, subject), inArray(moneyMovements.status, ["executed", "reversed"])));
  return Array.from(new Set(rows.map((r) => r.c).filter((c): c is string => Boolean(c))));
}

// ─── Automations ─────────────────────────────────────────────────────────────
export type AutomationRow = Omit<PlanAutomationRow, "actionParams"> & { actionParams: Record<string, unknown> };

function automationRow(r: PlanAutomationRow): AutomationRow {
  return { ...r, actionParams: jsonColumn<Record<string, unknown>>(r.actionParams, {}) };
}

export async function insertAutomation(row: Omit<typeof planAutomations.$inferInsert, "id" | "createdAt">): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.insert(planAutomations).values(row).$returningId();
  return r?.id ?? null;
}

export async function listAutomations(subject: string, opts: { enabledOnly?: boolean } = {}): Promise<AutomationRow[]> {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq(planAutomations.subject, subject)];
  if (opts.enabledOnly) conds.push(eq(planAutomations.enabled, true));
  const rows = await db.select().from(planAutomations).where(and(...conds)).orderBy(desc(planAutomations.id)).limit(200);
  return rows.map(automationRow);
}

export async function updateAutomation(id: number, subject: string, patch: Partial<typeof planAutomations.$inferInsert>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(planAutomations).set(patch).where(and(eq(planAutomations.id, id), eq(planAutomations.subject, subject)));
  return true;
}

export async function deleteAutomation(id: number, subject: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(planAutomations).where(and(eq(planAutomations.id, id), eq(planAutomations.subject, subject)));
  return true;
}

/** Returns null when this automation already ran for this event. */
export async function insertRun(row: Omit<typeof automationRuns.$inferInsert, "id" | "createdAt">): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const [r] = await db.insert(automationRuns).values(row).$returningId();
    return r?.id ?? null;
  } catch (err) {
    if (isDuplicate(err)) return null;
    throw err;
  }
}

export async function updateRun(id: number, patch: Partial<typeof automationRuns.$inferInsert>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(automationRuns).set(patch).where(eq(automationRuns.id, id));
}

const runRow = (r: AutomationRunRow): AutomationRunRow => ({ ...r, result: jsonColumn<unknown>(r.result, null) });

export async function getRun(id: number, subject: string): Promise<AutomationRunRow | null> {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.select().from(automationRuns).where(and(eq(automationRuns.id, id), eq(automationRuns.subject, subject))).limit(1);
  return r ? runRow(r) : null;
}

export async function listRuns(subject: string, limit = 100): Promise<AutomationRunRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(automationRuns).where(eq(automationRuns.subject, subject)).orderBy(desc(automationRuns.id)).limit(Math.min(500, limit));
  return rows.map(runRow);
}

// ─── Document provenance ─────────────────────────────────────────────────────
export async function insertProvenance(row: Omit<typeof documentProvenance.$inferInsert, "id" | "createdAt">): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.insert(documentProvenance).values(row).$returningId();
  return r?.id ?? null;
}

const provenanceRow = (r: DocumentProvenanceRow): DocumentProvenanceRow => ({ ...r, metadata: jsonColumn<unknown>(r.metadata, null), consistency: jsonColumn<unknown>(r.consistency, null) });

export async function provenanceForDocument(documentId: number): Promise<DocumentProvenanceRow | null> {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.select().from(documentProvenance).where(eq(documentProvenance.documentId, documentId)).orderBy(desc(documentProvenance.id)).limit(1);
  return r ? provenanceRow(r) : null;
}

export async function listProvenance(clientId: number, workspaceId: number): Promise<DocumentProvenanceRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(documentProvenance).where(and(eq(documentProvenance.clientId, clientId), eq(documentProvenance.workspaceId, workspaceId))).orderBy(desc(documentProvenance.id)).limit(500);
  return rows.map(provenanceRow);
}

// ─── Fact suggestions ────────────────────────────────────────────────────────
export async function insertSuggestions(rows: Array<Omit<typeof factSuggestions.$inferInsert, "id" | "createdAt">>): Promise<number> {
  const db = await getDb();
  if (!db || !rows.length) return 0;
  await db.insert(factSuggestions).values(rows);
  return rows.length;
}

// JSON columns come back as text on MariaDB: parse the value the client will accept.
const suggestionRow = (r: FactSuggestionRow): FactSuggestionRow => ({ ...r, value: jsonColumn<unknown>(r.value, null), currentValue: jsonColumn<unknown>(r.currentValue, null) });

export async function listSuggestions(subject: string, opts: { status?: FactSuggestionRow["status"] } = {}): Promise<FactSuggestionRow[]> {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq(factSuggestions.subject, subject)];
  if (opts.status) conds.push(eq(factSuggestions.status, opts.status));
  const rows = await db.select().from(factSuggestions).where(and(...conds)).orderBy(desc(factSuggestions.id)).limit(500);
  return rows.map(suggestionRow);
}

export async function getSuggestion(id: number, subject: string): Promise<FactSuggestionRow | null> {
  const db = await getDb();
  if (!db) return null;
  const [r] = await db.select().from(factSuggestions).where(and(eq(factSuggestions.id, id), eq(factSuggestions.subject, subject))).limit(1);
  return r ? suggestionRow(r) : null;
}

export async function decideSuggestion(id: number, subject: string, status: "accepted" | "rejected", byUserId: number | null): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(factSuggestions).set({ status, decidedAt: new Date(), decidedByUserId: byUserId }).where(and(eq(factSuggestions.id, id), eq(factSuggestions.subject, subject), isNull(factSuggestions.decidedAt)));
  return true;
}
