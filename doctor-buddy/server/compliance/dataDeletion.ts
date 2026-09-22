/**
 * Right-to-delete workflow.
 *
 * Three steps — request, approve, execute — not one. Erasing a patient's
 * clinical record is irreversible, and in a clinical context it can collide
 * with retention obligations, so it takes a reviewer who is not the requester
 * and it leaves a record that survives the data.
 *
 * Every transition is audited. The audit row is written *before* the
 * destructive step, so a purge that fails partway is still attributable.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { recordAudit } from "./auditLog";

/**
 * Tables purged for a deleted user, in dependency order — children first, so
 * foreign keys stay satisfied as rows go.
 *
 * `deletionRequests` is deliberately absent: the request itself outlives the
 * data it removed, which is what makes the deletion provable afterwards.
 * `auditLogs` is absent for the same reason.
 */
const PURGE_ORDER = [
  "medicationLogs",
  "medications",
  "moodJournalEntries",
  "journalEntries",
  "progressCheckins",
  "wellnessPlans",
  "mentalCreditScores",
  "personalityResponses",
  "personalityProfiles",
  "digitalTwins",
  "crisisEvents",
  "diagnosticReports",
  "assessments",
  "advisorySessions",
  "drBuddySessions",
  "activityLogs",
  "hipaaConsents",
] as const;

export async function requestDeletion(userId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { deletionRequests } = await import("../../drizzle/schema");

  // One open request at a time, so approval cannot race itself.
  const open = await db.select().from(deletionRequests)
    .where(and(eq(deletionRequests.userId, userId), eq(deletionRequests.status, "pending")))
    .limit(1);
  if (open.length > 0) {
    return { requestId: open[0].id, status: open[0].status, alreadyOpen: true };
  }

  const result = await db.insert(deletionRequests).values({ userId, reason, status: "pending" });
  const requestId = (result as unknown as { insertId?: number }).insertId ?? null;

  await recordAudit({
    actorId: userId, subjectId: userId,
    action: "deletion.requested", resourceType: "deletionRequest", resourceId: requestId,
    detail: { reason },
  });

  return { requestId, status: "pending" as const, alreadyOpen: false };
}

export async function getDeletionRequests() {
  const db = await getDb();
  if (!db) return [];
  const { deletionRequests } = await import("../../drizzle/schema");
  return await db.select().from(deletionRequests).orderBy(desc(deletionRequests.requestedAt)).limit(200);
}

export async function cancelDeletion(requestId: number, userId: number, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { deletionRequests } = await import("../../drizzle/schema");

  // Scope to the requester, so one user cannot cancel another's request.
  const rows = await db.select().from(deletionRequests)
    .where(and(eq(deletionRequests.id, requestId), eq(deletionRequests.userId, userId))).limit(1);
  if (rows.length === 0) throw new Error("Deletion request not found");
  if (rows[0].status === "executed") throw new Error("Deletion has already been executed");

  await db.update(deletionRequests)
    .set({ status: "cancelled", resolutionNotes: notes, reviewedAt: new Date() })
    .where(eq(deletionRequests.id, requestId));

  await recordAudit({
    actorId: userId, subjectId: userId,
    action: "deletion.cancelled", resourceType: "deletionRequest", resourceId: requestId,
  });
  return { success: true };
}

export async function approveDeletion(requestId: number, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { deletionRequests } = await import("../../drizzle/schema");

  const rows = await db.select().from(deletionRequests).where(eq(deletionRequests.id, requestId)).limit(1);
  if (rows.length === 0) throw new Error("Deletion request not found");
  const req = rows[0];
  if (req.status !== "pending") throw new Error(`Request is ${req.status}, not pending`);

  // The reviewer must not be the requester. A single account approving its own
  // irreversible deletion is not a review.
  if (req.userId === adminId) throw new Error("A deletion request cannot be approved by its requester");

  await db.update(deletionRequests)
    .set({ status: "approved", reviewedBy: adminId, reviewedAt: new Date() })
    .where(eq(deletionRequests.id, requestId));

  await recordAudit({
    actorId: adminId, subjectId: req.userId,
    action: "deletion.approved", resourceType: "deletionRequest", resourceId: requestId,
  });
  return { success: true, status: "approved" as const };
}

/**
 * Execute an approved deletion.
 *
 * Requires an approved request; there is no path from "pending" straight to
 * a purge. Counts are collected per table and written back onto the request so
 * the deletion remains provable once the rows are gone.
 */
export async function executeDeletion(userId: number, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const schema = await import("../../drizzle/schema");
  const { deletionRequests } = schema;

  const approved = await db.select().from(deletionRequests)
    .where(and(eq(deletionRequests.userId, userId), eq(deletionRequests.status, "approved")))
    .orderBy(desc(deletionRequests.requestedAt)).limit(1);
  if (approved.length === 0) {
    throw new Error("No approved deletion request for this user");
  }
  const requestId = approved[0].id;

  // Audit before destroying, so a partial failure is still attributable.
  await recordAudit({
    actorId: adminId, subjectId: userId,
    action: "deletion.executing", resourceType: "user", resourceId: userId,
    detail: { requestId },
  });

  const recordsAffected: Record<string, number> = {};
  for (const name of PURGE_ORDER) {
    const table = (schema as Record<string, unknown>)[name];
    if (!table) continue;
    try {
      const rows = await db.select().from(table as never)
        .where(eq((table as { userId: never }).userId, userId as never));
      if (rows.length === 0) continue;
      await db.delete(table as never).where(eq((table as { userId: never }).userId, userId as never));
      recordsAffected[name] = rows.length;
    } catch (error) {
      console.error(`[Deletion] Failed purging ${name} for user ${userId}:`, error);
      recordsAffected[name] = -1; // -1 marks a table that could not be purged.
    }
  }

  await db.update(deletionRequests)
    .set({ status: "executed", executedAt: new Date(), recordsAffected })
    .where(eq(deletionRequests.id, requestId));

  await recordAudit({
    actorId: adminId, subjectId: userId,
    action: "deletion.executed", resourceType: "user", resourceId: userId,
    detail: { requestId, recordsAffected },
  });

  const failures = Object.entries(recordsAffected).filter(([, n]) => n === -1).map(([t]) => t);
  return {
    success: failures.length === 0,
    recordsAffected,
    failedTables: failures,
  };
}

/**
 * Direct-to-consumer health-data deletion.
 *
 * The public wellness edition is not a clinical medical record system. Users
 * therefore do not have to wait for an administrator to approve deletion of
 * the consumer health information they supplied to the app. The account shell
 * and a minimal deletion receipt remain so access control and the fact of the
 * deletion can be proved without retaining the deleted health content.
 */
export async function deleteConsumerHealthDataNow(userId: number) {
  const { PUBLIC_WELLNESS_MODE } = await import("./releasePolicy");
  if (!PUBLIC_WELLNESS_MODE) {
    throw new Error("Immediate consumer deletion is only available in the public wellness edition.");
  }

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const schema = await import("../../drizzle/schema");
  const { deletionRequests, doctorPatients, privacyRequests } = schema;

  const insertResult = await db.insert(deletionRequests).values({
    userId,
    reason: "Self-service deletion of consumer health data",
    status: "pending",
  });
  const requestId = (insertResult as unknown as { insertId?: number }).insertId;
  if (!requestId) throw new Error("Could not create deletion receipt");

  await recordAudit({
    actorId: userId,
    subjectId: userId,
    action: "consumer_health_data.deletion_started",
    resourceType: "deletionRequest",
    resourceId: requestId,
  });

  const recordsAffected: Record<string, number> = {};

  // doctorPatients keys the consumer as patientUserId rather than userId.
  const careLinks = await db.select().from(doctorPatients).where(eq(doctorPatients.patientUserId, userId));
  if (careLinks.length) {
    await db.delete(doctorPatients).where(eq(doctorPatients.patientUserId, userId));
    recordsAffected.doctorPatients = careLinks.length;
  }

  // Privacy-request text may itself contain sensitive health details. Preserve
  // the minimum request/status receipt while redacting free-text content.
  const privacyRows = await db.select().from(privacyRequests).where(eq(privacyRequests.userId, userId));
  if (privacyRows.length) {
    await db.update(privacyRequests).set({ details: null, resolutionNotes: null }).where(eq(privacyRequests.userId, userId));
    recordsAffected.privacyRequestsRedacted = privacyRows.length;
  }

  // All consumer-generated/sensitive tables with a direct userId key.
  const consumerTables = [
    "medicationLogs", "medications", "moodJournalEntries", "journalEntries",
    "progressCheckins", "wellnessPlans", "mentalCreditScores", "personalityResponses",
    "personalityProfiles", "brainEvents", "digitalTwins", "crisisEvents",
    "diagnosticReports", "assessments", "advisorySessions", "drBuddySessions",
    "activityLogs", "hipaaConsents", "clientLeads",
  ] as const;

  for (const name of consumerTables) {
    const table = (schema as Record<string, unknown>)[name] as { userId: never } | undefined;
    if (!table) continue;
    try {
      const rows = await db.select().from(table as never).where(eq(table.userId, userId as never));
      if (!rows.length) continue;
      await db.delete(table as never).where(eq(table.userId, userId as never));
      recordsAffected[name] = rows.length;
    } catch (error) {
      console.error(`[ConsumerDeletion] Failed purging ${name} for user ${userId}:`, error);
      recordsAffected[name] = -1;
    }
  }

  await db.update(deletionRequests).set({
    status: "executed",
    executedAt: new Date(),
    reviewedAt: new Date(),
    recordsAffected,
    resolutionNotes: "Executed automatically at authenticated consumer request in public wellness mode.",
  }).where(eq(deletionRequests.id, requestId));

  // Preserve only a minimal audit receipt; do not include deleted health details.
  await recordAudit({
    actorId: userId,
    subjectId: userId,
    action: "consumer_health_data.deleted",
    resourceType: "deletionRequest",
    resourceId: requestId,
    detail: { tableCount: Object.keys(recordsAffected).length },
  });

  return {
    success: !Object.values(recordsAffected).some(n => n === -1),
    requestId,
    recordsAffected,
    failedTables: Object.entries(recordsAffected).filter(([, n]) => n === -1).map(([name]) => name),
  };
}
