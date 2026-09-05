// ============================================================
// AUDIO RETENTION — the zero-trace wipe.
// Raw voice recordings exist to be transcribed and scored; after
// that they are a liability the member never agreed to fund.
// 72 hours after an assessment completes, the audio files are
// deleted from storage and the pointers nulled. The TRANSCRIPT
// stays — it is the scored record (re-scoring, beliefs, goals
// suggestions all read it) and its retention is disclosed in
// Terms. Only the voice itself is wiped.
//
// No cron in this stack, so the sweep runs opportunistically:
// any hit on assessment.current triggers at most one sweep per
// SWEEP_INTERVAL_MS, capped at BATCH per pass. Best-effort by
// design — a storage failure just leaves the row for next pass.
// ============================================================
import { and, eq, isNotNull, lt, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { assessments, responses } from "../drizzle/schema";
import { storageDelete } from "./platform/storage";

const RETENTION_MS = 72 * 3600 * 1000;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
const BATCH = 50;

let lastSweepAt = 0;
let sweeping = false;

export async function purgeScoredAudio(): Promise<{ purged: number } | null> {
  const now = Date.now();
  if (sweeping || now - lastSweepAt < SWEEP_INTERVAL_MS) return null;
  sweeping = true;
  lastSweepAt = now;
  try {
    const db = await getDb();
    if (!db) return null;
    const cutoff = new Date(now - RETENTION_MS);
    // Assessments finished (complete or failed) and untouched past the window.
    // updatedAt bumps on any write, so this errs late, never early.
    const done = await db.select({ id: assessments.id }).from(assessments)
      .where(and(
        inArray(assessments.status, ["complete", "failed"]),
        lt(assessments.updatedAt, cutoff),
      ));
    if (done.length === 0) return { purged: 0 };
    const rows = await db.select({
      id: responses.id, audioKey: responses.audioKey,
    }).from(responses)
      .where(and(
        inArray(responses.assessmentId, done.map((a) => a.id)),
        isNotNull(responses.audioKey),
      ))
      .limit(BATCH);
    let purged = 0;
    for (const r of rows) {
      try {
        if (r.audioKey) await storageDelete(r.audioKey);
        await db.update(responses)
          .set({ audioKey: null, audioUrl: null })
          .where(eq(responses.id, r.id));
        purged++;
      } catch (e) {
        console.error(`[audio-retention] purge failed for response ${r.id}:`, e);
      }
    }
    if (purged > 0) console.log(`[audio-retention] wiped ${purged} raw recordings past the 72h window`);
    return { purged };
  } catch (e) {
    console.error("[audio-retention] sweep failed:", e);
    return null;
  } finally {
    sweeping = false;
  }
}
