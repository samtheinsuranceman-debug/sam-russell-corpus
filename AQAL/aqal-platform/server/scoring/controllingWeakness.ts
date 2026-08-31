// ============================================================
// CONTROLLING-WEAKNESS ARGMIN — L1-08 / AQAL-004.
// Deterministically finds the single dimension that most constrains
// the profile (the min over the 32-vector) and estimates how much it
// drags the composite rarity. Writes the result to the ledger.
// ============================================================
import { ALL_AXES } from "@shared/axisModes";

export type WeaknessResult = { axisIndex: number; axisName: string; score: number; constraintImpact: number };

export function controllingWeakness(vector: number[]): WeaknessResult | null {
  if (!vector || vector.length === 0) return null;
  let minIdx = 0;
  for (let i = 1; i < vector.length; i++) if (vector[i] < vector[minIdx]) minIdx = i;
  const score = vector[minIdx];
  const mean = vector.reduce((a, b) => a + b, 0) / vector.length;
  // Constraint impact: how far below the mean the weakest line sits (0..1).
  const constraintImpact = Math.max(0, Math.min(1, mean - score));
  return { axisIndex: minIdx, axisName: ALL_AXES[minIdx] ?? `axis_${minIdx}`, score, constraintImpact };
}

export async function persistControllingWeakness(userId: number, result: WeaknessResult): Promise<void> {
  const { appendLedgerEntry } = await import("../patents/ledger");
  await appendLedgerEntry("score", { kind: "controlling_weakness", userId, ...result });
}
