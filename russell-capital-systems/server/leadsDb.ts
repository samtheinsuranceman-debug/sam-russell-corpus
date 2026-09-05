// ============================================================
// PUBLIC LEADS — data access for homepage fact-finder prospects.
// Graceful when the DB is not configured (returns null / no-ops) so the
// homepage still works before `pnpm db:push` has been run.
// ============================================================
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { publicLeads, type InsertPublicLead, type PublicLead } from "../drizzle/schema";

export async function getLeadByPublicId(publicId: string): Promise<PublicLead | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(publicLeads).where(eq(publicLeads.publicId, publicId)).limit(1);
  return rows[0] ?? null;
}

/**
 * Upsert by first-party publicId. Merges IP history and never overwrites a
 * stored non-empty field with an empty one (so a returning visitor who only
 * asks a question doesn't wipe the financials they entered earlier).
 */
export async function upsertLead(publicId: string, patch: Partial<InsertPublicLead>, ip: string | null): Promise<PublicLead | null> {
  const db = await getDb();
  if (!db) return null;
  const existing = await getLeadByPublicId(publicId);

  const ipHistory = new Set<string>(existing?.ipHistory ?? []);
  if (ip) ipHistory.add(ip);

  if (existing) {
    const merged: Partial<InsertPublicLead> = {
      firstName: patch.firstName || existing.firstName,
      lastName: patch.lastName || existing.lastName,
      email: patch.email || existing.email,
      phone: patch.phone || existing.phone,
      bestTimeToContact: patch.bestTimeToContact || existing.bestTimeToContact,
      consentedAt: patch.consentedAt ?? existing.consentedAt,
      consentVersion: patch.consentVersion || existing.consentVersion,
      question: patch.question || existing.question,
      factFinder: patch.factFinder ?? existing.factFinder,
      analysis: patch.analysis ?? existing.analysis,
      lastIp: ip || existing.lastIp,
      ipHistory: Array.from(ipHistory),
      lastSeenAt: new Date(),
    };
    await db.update(publicLeads).set(merged).where(eq(publicLeads.id, existing.id));
    return getLeadByPublicId(publicId);
  }

  await db.insert(publicLeads).values({
    publicId,
    ...patch,
    lastIp: ip ?? undefined,
    ipHistory: Array.from(ipHistory),
  });
  return getLeadByPublicId(publicId);
}
