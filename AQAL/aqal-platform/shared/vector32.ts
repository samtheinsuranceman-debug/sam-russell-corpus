// ============================================================
// FIXED-WIDTH 32-VECTOR CONTRACT — VectorCore's validation layer.
// The canonical cognitive profile is EXACTLY 32 lines, axis indices
// 0..31, each scored on 0..1. This module is the single enforcement
// point: it rejects a 33rd line, a skipped line, a duplicated line,
// and out-of-range values — so no write path can quietly bend the
// fixed-width contract the patents claim.
// ============================================================

export const VECTOR_WIDTH = 32;

export type Vector32Entry = { axisIndex: number; score: number };

export type Vector32Verdict = { ok: true } | { ok: false; reason: string };

export function validateVector32(entries: Vector32Entry[]): Vector32Verdict {
  if (entries.length !== VECTOR_WIDTH) {
    return { ok: false, reason: `expected exactly ${VECTOR_WIDTH} lines, got ${entries.length}` };
  }
  const seen = new Set<number>();
  for (const e of entries) {
    if (!Number.isInteger(e.axisIndex) || e.axisIndex < 0 || e.axisIndex >= VECTOR_WIDTH) {
      return { ok: false, reason: `axisIndex ${e.axisIndex} is outside 0..${VECTOR_WIDTH - 1}` };
    }
    if (seen.has(e.axisIndex)) {
      return { ok: false, reason: `axisIndex ${e.axisIndex} appears more than once` };
    }
    seen.add(e.axisIndex);
    if (typeof e.score !== "number" || !Number.isFinite(e.score) || e.score < 0 || e.score > 1) {
      return { ok: false, reason: `score ${e.score} on axis ${e.axisIndex} is outside 0..1` };
    }
  }
  return { ok: true };
}

/** Throwing form for write paths: violating the contract is a hard error. */
export function assertVector32(entries: Vector32Entry[]): void {
  const verdict = validateVector32(entries);
  if (!verdict.ok) throw new Error(`32-vector contract violated: ${verdict.reason}`);
}
