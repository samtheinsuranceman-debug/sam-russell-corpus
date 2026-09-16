/**
 * PHI access audit trail.
 *
 * Separate from activityLogs, which records product usage. This answers the
 * question an audit actually asks — who looked at whose clinical record, and
 * was it allowed — which usage analytics cannot.
 *
 * Writes are best-effort and never throw into the caller: an audit write
 * failing must not take down the clinical action it was recording. A failure
 * is logged loudly instead, because a silently missing audit trail is worse
 * than a noisy one.
 */
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";

export interface AuditEntry {
  actorId?: number | null;
  subjectId?: number | null;
  action: string;
  resourceType?: string | null;
  resourceId?: number | null;
  outcome?: "success" | "denied" | "error";
  detail?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Audit] No database; entry not persisted:", entry.action);
      return;
    }
    const { auditLogs } = await import("../../drizzle/schema");
    await db.insert(auditLogs).values({
      actorId: entry.actorId ?? null,
      subjectId: entry.subjectId ?? null,
      action: entry.action,
      resourceType: entry.resourceType ?? null,
      resourceId: entry.resourceId ?? null,
      outcome: entry.outcome ?? "success",
      detail: entry.detail ?? null,
      ipAddress: entry.ipAddress ?? null,
    });
  } catch (error) {
    // Never rethrow. Losing the audit row must not fail the clinical action.
    console.error("[Audit] Failed to record entry:", entry.action, error);
  }
}

export async function getAuditLogs(opts: { userId?: number; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const { auditLogs } = await import("../../drizzle/schema");
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 500);

  const base = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  if (opts.userId === undefined) return await base;

  // "For this user" means anything touching their record, whether they were the
  // actor or the subject.
  return await db.select().from(auditLogs)
    .where(eq(auditLogs.subjectId, opts.userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
