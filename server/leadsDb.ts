// ============================================================
// PUBLIC LEADS — data access for homepage fact-finder prospects.
// Graceful when the DB is not configured (returns null / no-ops) so the
// homepage still works before `pnpm db:push` has been run.
// ============================================================
import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { jsonColumn } from "./_core/jsonColumn";
import { publicLeads, type InsertPublicLead, type PublicLead } from "../drizzle/schema";

export type LeadStatusValue = PublicLead["status"];

/** JSON columns come back as strings on MariaDB; parse them so callers see objects everywhere. */
function normalizeLead(row: PublicLead): PublicLead {
  return {
    ...row,
    factFinder: jsonColumn(row.factFinder, null),
    analysis: jsonColumn(row.analysis, null),
    ipHistory: jsonColumn<string[] | null>(row.ipHistory, null),
  };
}

export async function getLeadByPublicId(publicId: string): Promise<PublicLead | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(publicLeads).where(eq(publicLeads.publicId, publicId)).limit(1);
  return rows[0] ? normalizeLead(rows[0]) : null;
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

// ─── Advisor-side reads / triage ────────────────────────────────────────────
export async function listLeads(limit = 200): Promise<PublicLead[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(publicLeads).orderBy(desc(publicLeads.lastSeenAt)).limit(Math.min(500, Math.max(1, limit)));
  return rows.map(normalizeLead);
}

export async function getLeadById(id: number): Promise<PublicLead | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(publicLeads).where(eq(publicLeads.id, id)).limit(1);
  return rows[0] ? normalizeLead(rows[0]) : null;
}

export async function updateLeadStatus(id: number, status: LeadStatusValue): Promise<PublicLead | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(publicLeads).set({ status }).where(eq(publicLeads.id, id));
  return getLeadById(id);
}
