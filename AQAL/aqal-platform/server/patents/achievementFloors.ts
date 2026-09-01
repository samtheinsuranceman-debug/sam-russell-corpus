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

// ── Repeated-demonstration activation ───────────────────────────────────────
// The honest floor source available today: a level counts as DEMONSTRATED
// when the member has produced it on TWO separate completed assessments with
// adequate confidence. The floor is the MINIMUM of the two scores (what was
// shown both times), never the maximum or the average.

export type RepeatedScore = { axisIndex: number; score: number; confidence?: number | null };

/** Pure rule: floors demonstrated by two independent score sets. */
export function repeatedFloorLevels(
  previous: RepeatedScore[],
  current: RepeatedScore[],
  minConfidence = 0.6,
): Array<{ axisIndex: number; level: number }> {
  const prevByAxis = new Map(previous.filter((s) => (s.confidence ?? 0) >= minConfidence).map((s) => [s.axisIndex, s.score]));
  const out: Array<{ axisIndex: number; level: number }> = [];
  for (const s of current) {
    if ((s.confidence ?? 0) < minConfidence) continue;
    const prev = prevByAxis.get(s.axisIndex);
    if (prev === undefined) continue;
    out.push({ axisIndex: s.axisIndex, level: Math.min(prev, s.score) });
  }
  return out;
}

/**
 * Activation entry point, called after an assessment's scores are saved:
 * compares against the member's most recent PRIOR completed assessment and
 * ratchets floors for every line demonstrated both times. Evidence hours are
 * the current assessment's total recorded answer time. Best-effort.
 */
export async function recordRepeatedDemonstrationFloors(
  userId: number,
  currentAssessmentId: number,
  currentScores: RepeatedScore[],
): Promise<number> {
  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) return 0;
    const { assessments, scores: scoresTable, responses } = await import("../../drizzle/schema");
    const { and, eq, ne, desc } = await import("drizzle-orm");
    const prior = await db.select({ id: assessments.id }).from(assessments)
      .where(and(eq(assessments.userId, userId), eq(assessments.status, "complete"), ne(assessments.id, currentAssessmentId)))
      .orderBy(desc(assessments.id)).limit(1);
    if (!prior[0]) return 0;
    const prevScores = await db.select().from(scoresTable).where(eq(scoresTable.assessmentId, prior[0].id));
    const demonstrated = repeatedFloorLevels(prevScores as RepeatedScore[], currentScores);
    if (demonstrated.length === 0) return 0;
    const resp = await db.select({ durationMs: responses.durationMs }).from(responses)
      .where(eq(responses.assessmentId, currentAssessmentId));
    const hours = resp.reduce((a, r) => a + (r.durationMs ?? 0), 0) / 3_600_000;
    let raised = 0;
    for (const d of demonstrated) {
      const res = await recordFloorEvent(userId, d.axisIndex, d.level, hours / Math.max(1, demonstrated.length));
      if (res?.raised) raised++;
    }
    return raised;
  } catch (e) {
    console.warn("[achievementFloors] repeated-demonstration pass failed:", String(e).slice(0, 150));
    return 0;
  }
}
