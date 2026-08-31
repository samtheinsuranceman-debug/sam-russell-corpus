// ============================================================
// VERIFIED ACHIEVEMENT FLOOR ENGINE — software embodiment.
// Patent family L1-07 / AQAL-012 (Verified Achievement Floor Tracking).
//
// A per-line "floor" is the highest level a user has DEMONSTRATED,
// evidenced by time-logged hours. The floor can only rise — never
// fall — producing a ratchet-like, longitudinally stable lower bound
// that pure point-estimate psychometrics cannot provide.
//
// HONEST SCOPE:
// - Software embodiment: a conditional UPDATE that only writes when
//   the new demonstrated level exceeds the stored floor, plus a
//   tamper-evident ledger entry for every accepted raise.
// - The hardware-signed / HSM anchoring named in the patent spec is
//   an operational upgrade (sign exportChainHead()), not a schema
//   change. Nothing here claims hardware that is not built.
// ============================================================
import { and, eq, sql } from "drizzle-orm";

export type FloorRow = {
  userId: number;
  axisIndex: number;
  floor: number;
  evidenceHours: number;
  updatedAt: Date;
};

/**
 * Record a demonstrated achievement. The floor only moves UP.
 * Returns { raised, newFloor } — raised=false when the evidence did
 * not exceed the existing floor (the ratchet held).
 */
export async function recordFloorEvent(
  userId: number,
  axisIndex: number,
  demonstratedLevel: number,
  evidenceHours: number,
): Promise<{ raised: boolean; newFloor: number } | null> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return null;
  const { achievementFloors } = await import("../../drizzle/schema");
  const level = Math.max(0, Math.min(1, demonstratedLevel));
  try {
    // Read the pre-existing floor FIRST so `raised` reports the truth:
    // raised=true only when this evidence actually moved the ratchet.
    const before = await db
      .select({ floor: achievementFloors.floor })
      .from(achievementFloors)
      .where(and(eq(achievementFloors.userId, userId), eq(achievementFloors.axisIndex, axisIndex)))
      .limit(1);
    const previousFloor = before[0]?.floor ?? 0;

    // Ratchet: insert at the demonstrated level, but on conflict only
    // raise — GREATEST(existing, incoming) — and accumulate evidence hours.
    await db
      .insert(achievementFloors)
      .values({ userId, axisIndex, floor: level, evidenceHours })
      .onDuplicateKeyUpdate({
        set: {
          floor: sql`GREATEST(${achievementFloors.floor}, ${level})`,
          evidenceHours: sql`${achievementFloors.evidenceHours} + ${evidenceHours}`,
        },
      });
    const rows = await db
      .select()
      .from(achievementFloors)
      .where(and(eq(achievementFloors.userId, userId), eq(achievementFloors.axisIndex, axisIndex)))
      .limit(1);
    const newFloor = rows[0]?.floor ?? level;
    const raised = newFloor > previousFloor;
    // Every accepted floor state is committed to the tamper-evident ledger.
    const { appendLedgerEntry } = await import("./ledger");
    await appendLedgerEntry("floor_event", { userId, axisIndex, demonstratedLevel: level, evidenceHours, newFloor, raised });
    return { raised, newFloor };
  } catch (error) {
    console.warn("[achievementFloors] recordFloorEvent failed:", String(error).slice(0, 200));
    return null;
  }
}

/** Read all 32 floors for a user (sparse — only lines with evidence). */
export async function getFloors(userId: number): Promise<FloorRow[]> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return [];
  const { achievementFloors } = await import("../../drizzle/schema");
  const { asc } = await import("drizzle-orm");
  const rows = await db
    .select()
    .from(achievementFloors)
    .where(eq(achievementFloors.userId, userId))
    .orderBy(asc(achievementFloors.axisIndex));
  return rows as FloorRow[];
}
