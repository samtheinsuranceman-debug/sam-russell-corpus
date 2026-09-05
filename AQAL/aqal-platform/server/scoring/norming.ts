// ============================================================
// Scoring — versioned norming snapshots
// ============================================================
// A "norming snapshot" is the frozen mapping from a 0..1 axis score to a
// within-population rarity. Versioning it makes every historical assessment
// REPRODUCIBLE: a score stored under a given norming version always yields the
// same rarity, even after the active curve is later re-estimated from real users.
//
// v1 is the theoretical Spiral-Dynamics curve the platform launched on. When
// enough real assessments exist, add a v2 snapshot re-estimated from that
// population (continuous norming) and bump ACTIVE_NORMING_VERSION — old rows
// keep their recorded version and reproduce exactly.

export type NormingMethod = "theoretical-spiral-dynamics" | "empirical-continuous";

export type NormingSnapshot = {
  version: string;
  createdAt: string; // ISO date (stamped when the snapshot is authored)
  method: NormingMethod;
  description: string;
  // Frozen score -> rarity (1 in N) mapping for this snapshot.
  scoreToRarity: (score: number) => number;
};

// ---- v1: theoretical Spiral-Dynamics population bands --------
// Piecewise curve anchored to Spiral-Dynamics population distributions:
//   Blue ~40%, Orange ~30%, Green ~10%, Yellow ~1%, Turquoise ~0.1%, Coral ~0.01%.
function v1ScoreToRarity(score: number): number {
  const s = Math.max(0, Math.min(1, score));
  if (s <= 0.3) {
    return 1.0 + (s / 0.3) * 2.0; // Blue: 1 → 3
  } else if (s <= 0.5) {
    const t = (s - 0.3) / 0.2;
    return 3.0 + t * 7.0; // Orange: 3 → 10
  } else if (s <= 0.7) {
    const t = (s - 0.5) / 0.2;
    return 10.0 * Math.pow(10, t); // Green: 10 → 100
  } else if (s <= 0.85) {
    const t = (s - 0.7) / 0.15;
    return 100.0 * Math.pow(10, t); // Yellow: 100 → 1,000
  } else if (s <= 0.95) {
    const t = (s - 0.85) / 0.1;
    return 1000.0 * Math.pow(10, t); // Turquoise: 1,000 → 10,000
  } else {
    const t = (s - 0.95) / 0.05;
    return 10000.0 * Math.pow(10, t); // Coral: 10,000 → 100,000
  }
}

const V1: NormingSnapshot = {
  version: "2026.07-spiral-theoretical-v1",
  createdAt: "2026-07-06",
  method: "theoretical-spiral-dynamics",
  description:
    "Launch norming: theoretical Spiral-Dynamics population bands (Blue ~40% … Coral ~0.01%). " +
    "To be superseded by an empirical continuous-norming snapshot once real assessments accumulate.",
  scoreToRarity: v1ScoreToRarity,
};

export const NORMING_SNAPSHOTS: Record<string, NormingSnapshot> = {
  [V1.version]: V1,
};

// The version new assessments are stamped with.
export const ACTIVE_NORMING_VERSION = V1.version;

export function getNorming(version: string = ACTIVE_NORMING_VERSION): NormingSnapshot {
  return NORMING_SNAPSHOTS[version] ?? V1;
}

// Reproducible score → rarity under a specific norming version (defaults to active).
export function scoreToRarity(score: number, version: string = ACTIVE_NORMING_VERSION): number {
  return getNorming(version).scoreToRarity(score);
}
