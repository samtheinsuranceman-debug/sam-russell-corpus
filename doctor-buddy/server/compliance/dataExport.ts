import { eq } from "drizzle-orm";
import { getDb } from "../db";

/** Export data supplied by or generated for the authenticated consumer. */
export async function exportConsumerData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const schema = await import("../../drizzle/schema");

  const tableNames = [
    "hipaaConsents", "activityLogs", "assessments", "diagnosticReports",
    "progressCheckins", "journalEntries", "crisisEvents", "advisorySessions",
    "digitalTwins", "moodJournalEntries", "personalityProfiles", "personalityResponses",
    "mentalCreditScores", "wellnessPlans", "medications", "medicationLogs",
    "brainEvents", "drBuddySessions", "clientLeads", "subscriptions",
    "billingConsents", "deletionRequests", "privacyRequests",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const name of tableNames) {
    const table = (schema as Record<string, unknown>)[name] as { userId: never } | undefined;
    if (!table) continue;
    try {
      data[name] = await db.select().from(table as never).where(eq(table.userId, userId as never));
    } catch {
      data[name] = [];
    }
  }

  data.doctorPatients = await db.select().from(schema.doctorPatients)
    .where(eq(schema.doctorPatients.patientUserId, userId));

  const [account] = await db.select({
    id: schema.users.id,
    name: schema.users.name,
    email: schema.users.email,
    createdAt: schema.users.createdAt,
    updatedAt: schema.users.updatedAt,
  }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);

  return {
    format: "doctor-buddy-consumer-export-v1",
    exportedAt: new Date().toISOString(),
    account: account ?? null,
    data,
  };
}
