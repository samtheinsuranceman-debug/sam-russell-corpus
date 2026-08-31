// ============================================================
// TRUE MULTIPLICATIVE RARITY — L1-04 / AQAL-002.
// Computes the PRODUCT of independence-weighted per-line rarity,
// gated below by each line's verified achievement floor. This is the
// patent embodiment; the legacy geometric-mean is kept as a fallback.
// ============================================================
import { axisFeedsRarity, axisIndep } from "@shared/axisModes";

export type RarityInput = { axisIndex?: number; axisName?: string; score: number; confidence?: number };
export type FloorInput = { axisIndex: number; floor: number };

// Per-line rarity from a 0..1 score (same curve the platform launched on).
function lineRarity(score: number): number {
  const s = Math.max(0, Math.min(1, score));
  return 1 / Math.max(1e-6, 1 - s); // higher score -> larger rarity
}

/**
 * Multiplicative joint rarity, floor-gated. Each term is bounded below by
 * the line's verified floor so a soft estimate can never drag a proven
 * capability below its floor.
 *
 * HONESTY LIMITS — read before wiring this to anything user-visible:
 * - "16 lines independent of g" does NOT mean the lines are mutually
 *   independent of each other; the 0.5-exponent damping on g-correlated
 *   lines is a heuristic, not a measured correlation structure. Until the
 *   founding cohort provides real inter-line correlations, the product
 *   OVERSTATES joint rarity.
 * - With ~32 terms, typical profiles saturate the 1,000,000 cap — a capped
 *   value is a ceiling artifact, not a defensible "1 in a million" claim.
 * For both reasons this engine is NOT wired to any displayed number; the
 * displayed composite continues to use the calibrated legacy curve. See
 * docs/PATENT_IMPLEMENTATION_STATUS.md.
 */
export function multiplicativeRarity(scores: RarityInput[], floors: FloorInput[]): number {
  const floorByAxis = new Map(floors.map((f) => [f.axisIndex, f.floor]));
  let product = 1;
  for (const s of scores) {
    if (s.axisName && !axisFeedsRarity(s.axisName)) continue; // stance lines never feed rarity
    const indep = s.axisName ? axisIndep(s.axisName) : false;
    const floor = s.axisIndex !== undefined ? floorByAxis.get(s.axisIndex) ?? 0 : 0;
    const gated = Math.max(s.score, floor); // floor gate: never below proven level
    const r = lineRarity(gated);
    // Independence weighting: independent (low-g) lines count fully;
    // g-correlated lines are damped so they don't double-count shared variance.
    const weight = indep ? 1.0 : 0.5;
    product *= Math.pow(r, weight);
  }
  return Math.max(1, Math.min(1_000_000, Math.round(product)));
}

/** Legacy fallback — preserved exactly as before. */
export function geometricMeanRarityFallback(scores: RarityInput[]): number {
  if (!scores || scores.length === 0) return 1;
  const rs = scores.filter((s) => !s.axisName || axisFeedsRarity(s.axisName)).map((s) => lineRarity(s.score));
  if (rs.length === 0) return 1;
  const logSum = rs.reduce((a, r) => a + Math.log(Math.max(1, r)), 0);
  return Math.max(1, Math.min(1_000_000, Math.round(Math.exp(logSum / rs.length))));
}
