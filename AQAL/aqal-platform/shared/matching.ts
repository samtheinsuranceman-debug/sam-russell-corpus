// ============================================================
// COMPLEMENTARY MATCHING — the schematic's formula, made honest
// ============================================================
// ComplementarityScore(A,B) = α·StrengthCoverage + β·GapFilling
//                           + γ·SharedFoundation + δ·GrowthPotential
//
// Vectors are aligned to ALL_AXES (32 entries, 0..1). One correction to the
// schematic: the four STANCE lines (Parenting, Seduction, Community-Founding,
// Financial-Self-Management) are developmental stages, not amounts — treating
// stage-4 as "less than" stage-6 numerically would poison every component. So
// the formula runs on the 28 amount-scored lines only (same rule the rarity
// composite already follows).

import { ALL_AXES, axisFeedsRarity } from "./axisModes";

export const MATCH_WEIGHTS = {
  strengthCoverage: 0.35,
  gapFilling: 0.3,
  sharedFoundation: 0.2,
  growthPotential: 0.15,
} as const;

// Indices (into ALL_AXES) actually used by the formula.
export const MATCH_AXIS_INDICES = ALL_AXES.map((a, i) => (axisFeedsRarity(a) ? i : -1)).filter(
  (i) => i >= 0,
);

export type ComplementarityBreakdown = {
  score: number; // 0..1
  strengthCoverage: number;
  gapFilling: number;
  sharedFoundation: number;
  growthPotential: number;
};

export function complementarityScore(a: number[], b: number[]): ComplementarityBreakdown {
  let coverageSum = 0;
  let gapSum = 0;
  let gapCount = 0;
  let sharedSum = 0;
  let sharedCount = 0;
  let growthSum = 0;
  let growthCount = 0;

  for (const i of MATCH_AXIS_INDICES) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;

    // 1. Strength coverage — together, how much of the spectrum is covered?
    coverageSum += Math.max(ai, bi);

    // 2. Gap filling — one is weak (<0.4) exactly where the other is strong (>0.7).
    if ((ai < 0.4 && bi > 0.7) || (bi < 0.4 && ai > 0.7)) {
      gapSum += Math.abs(ai - bi);
      gapCount++;
    }

    // 3. Shared foundation — where both are solid, how similar are they?
    if (ai > 0.5 && bi > 0.5) {
      sharedSum += 1 - Math.abs(ai - bi);
      sharedCount++;
    }

    // 4. Growth potential — mentorship headroom, both directions.
    if (ai < 0.5 && bi > 0.6) {
      growthSum += bi - ai;
      growthCount++;
    }
    if (bi < 0.5 && ai > 0.6) {
      growthSum += ai - bi;
      growthCount++;
    }
  }

  const n = MATCH_AXIS_INDICES.length;
  const strengthCoverage = coverageSum / n;
  const gapFilling = gapCount > 0 ? gapSum / gapCount : 0;
  const sharedFoundation = sharedCount > 0 ? sharedSum / sharedCount : 0;
  const growthPotential = growthCount > 0 ? growthSum / growthCount : 0;

  const score =
    MATCH_WEIGHTS.strengthCoverage * strengthCoverage +
    MATCH_WEIGHTS.gapFilling * gapFilling +
    MATCH_WEIGHTS.sharedFoundation * sharedFoundation +
    MATCH_WEIGHTS.growthPotential * growthPotential;

  return { score, strengthCoverage, gapFilling, sharedFoundation, growthPotential };
}

// Quality floor + display tiers, straight from the schematic.
export const MATCH_FLOOR = 0.55;

export function matchTier(score: number): { label: string; blurb: string } | null {
  if (score >= 0.85)
    return {
      label: "Exceptional Match",
      blurb: "Rare complementarity — together, significantly stronger than either alone.",
    };
  if (score >= 0.7)
    return { label: "Strong Match", blurb: "Meaningful complementarity with good shared foundation." };
  if (score >= MATCH_FLOOR)
    return { label: "Good Match", blurb: "Solid potential — some gaps filled, some shared ground." };
  return null; // never surface weak matches
}

// The card copy: the axes where their strength most dramatically fills your gap
// (and vice versa), sorted by how dramatic the fill is.
export type ComplementAxis = { axis: string; direction: "they_fill" | "you_fill"; delta: number };

export function topComplementaryAxes(mine: number[], theirs: number[], limit = 3): ComplementAxis[] {
  const out: ComplementAxis[] = [];
  for (const i of MATCH_AXIS_INDICES) {
    const m = mine[i] ?? 0;
    const t = theirs[i] ?? 0;
    if (m < 0.4 && t > 0.7) out.push({ axis: ALL_AXES[i], direction: "they_fill", delta: t - m });
    else if (t < 0.4 && m > 0.7) out.push({ axis: ALL_AXES[i], direction: "you_fill", delta: m - t });
  }
  return out.sort((a, b) => b.delta - a.delta).slice(0, limit);
}
