// ============================================================
// CONSTRAINT-SATISFACTION TEAM FORMATION — MatchForge's upper layer.
// Assembles an N-person team from a candidate pool of 32-dim
// profiles under explicit constraints:
//   - no two members share the same controlling weakness (the
//     team never has a doubled weakest link), and
//   - the team's per-axis coverage (best member on each line) is
//     maximized, so members' strengths shield each other's gaps.
//
// HONEST SCOPE: a deterministic greedy optimizer over real score
// vectors — the reduction to practice of the claimed method. It is
// a heuristic (greedy, not exhaustive); it reports its own coverage
// number and never asserts global optimality.
// ============================================================
import { VECTOR_WIDTH } from "../../shared/vector32";

export type TeamCandidate = { id: number | string; vector: number[] };

export type TeamResult = {
  members: Array<{ id: number | string; controllingWeaknessAxis: number }>;
  // Per-axis best score across the assembled team (the "coverage profile").
  coverage: number[];
  // Mean of the coverage profile — the objective the greedy pass maximizes.
  coverageScore: number;
  satisfied: boolean; // all constraints met at the requested size
  method: "greedy-complementary";
};

function argmin(vector: number[]): number {
  let idx = 0;
  for (let i = 1; i < vector.length; i++) if (vector[i] < vector[idx]) idx = i;
  return idx;
}

function coverageOf(vectors: number[][]): number[] {
  const cov = new Array(VECTOR_WIDTH).fill(0);
  for (const v of vectors) for (let i = 0; i < VECTOR_WIDTH; i++) cov[i] = Math.max(cov[i], v[i] ?? 0);
  return cov;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * Greedy complementary assembly: seed with the strongest overall candidate,
 * then repeatedly add the candidate that (a) does not duplicate any selected
 * member's controlling weakness and (b) raises team coverage the most.
 * Falls back to satisfied=false (partial team) when the pool cannot fill the
 * requested size under the constraint.
 */
export function assembleTeam(candidates: TeamCandidate[], teamSize: number): TeamResult {
  const pool = candidates.filter((c) => Array.isArray(c.vector) && c.vector.length === VECTOR_WIDTH);
  const empty: TeamResult = { members: [], coverage: new Array(VECTOR_WIDTH).fill(0), coverageScore: 0, satisfied: false, method: "greedy-complementary" };
  if (pool.length === 0 || teamSize < 1) return empty;

  const weaknessOf = new Map(pool.map((c) => [c.id, argmin(c.vector)]));
  const selected: TeamCandidate[] = [];
  const usedWeaknesses = new Set<number>();

  // Seed: strongest mean profile.
  const seed = [...pool].sort((a, b) => mean(b.vector) - mean(a.vector))[0];
  selected.push(seed);
  usedWeaknesses.add(weaknessOf.get(seed.id)!);

  while (selected.length < teamSize) {
    const chosenIds = new Set(selected.map((s) => s.id));
    let best: TeamCandidate | null = null;
    let bestGain = -Infinity;
    for (const c of pool) {
      if (chosenIds.has(c.id)) continue;
      if (usedWeaknesses.has(weaknessOf.get(c.id)!)) continue; // constraint: no doubled weakest link
      const gain = mean(coverageOf([...selected.map((s) => s.vector), c.vector]));
      if (gain > bestGain) { bestGain = gain; best = c; }
    }
    if (!best) break; // pool exhausted under the constraint
    selected.push(best);
    usedWeaknesses.add(weaknessOf.get(best.id)!);
  }

  const coverage = coverageOf(selected.map((s) => s.vector));
  return {
    members: selected.map((s) => ({ id: s.id, controllingWeaknessAxis: weaknessOf.get(s.id)! })),
    coverage,
    coverageScore: mean(coverage),
    satisfied: selected.length === teamSize,
    method: "greedy-complementary",
  };
}
