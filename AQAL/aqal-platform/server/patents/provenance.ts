// ============================================================
// PER-LINE RESEARCH PROVENANCE — L1-10.
// A foreign key from each of the 32 intelligence lines to the published
// sources that ground it, so every measurement is externally traceable.
// ============================================================
import { eq } from "drizzle-orm";

export type ProvenanceRow = {
  axisIndex: number;
  theoryName: string;
  authors: string[];
  doi: string | null;
  peerReviewed: boolean;
};

export async function getProvenance(axisIndex: number): Promise<ProvenanceRow | null> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return null;
  const { researchProvenance } = await import("../../drizzle/schema");
  const rows = await db.select().from(researchProvenance).where(eq(researchProvenance.axisIndex, axisIndex)).limit(1);
  return (rows[0] as ProvenanceRow) ?? null;
}

export async function getAllProvenance(): Promise<ProvenanceRow[]> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return [];
  const { researchProvenance } = await import("../../drizzle/schema");
  const { asc } = await import("drizzle-orm");
  return (await db.select().from(researchProvenance).orderBy(asc(researchProvenance.axisIndex))) as ProvenanceRow[];
}
