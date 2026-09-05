// ============================================================
// WEAKNESS → INTERVENTIONS LOOKUP — WeakLink's recommendation layer.
// Maps each of the 32 lines to the specific, evidence-carrying
// protocols that develop it, drawn from the audit-derived
// THERAPY_LINE_MAP (real citations with real DOIs — nothing here
// is invented; every row traces to a published study).
//
// HONEST SCOPE: these are educational protocol suggestions from
// peer-reviewed capacity-development literature — not medical
// advice, not a treatment plan, not a guarantee of improvement.
// ============================================================
import { ALL_AXES } from "../../shared/axisModes";
import { THERAPY_LINE_MAP, type TherapyLineEntry } from "../../shared/therapyLineMap";

export type Intervention = {
  therapy: string;
  role: TherapyLineEntry["role"];
  capacity: string;
  cite: string;
  doi: string;
};

/** All mapped interventions for one line, PRIMARY first. */
export function interventionsForAxis(axisIndex: number): Intervention[] {
  const line = ALL_AXES[axisIndex];
  if (!line) return [];
  const rank: Record<TherapyLineEntry["role"], number> = { PRIMARY: 0, SECONDARY: 1, TERTIARY: 2 };
  return THERAPY_LINE_MAP
    .filter((e) => e.line === line)
    .sort((a, b) => rank[a.role] - rank[b.role] || a.therapy.localeCompare(b.therapy))
    .map((e) => ({ therapy: e.therapy, role: e.role, capacity: e.capacity, cite: e.cite, doi: e.doi }));
}

/** The "Focus Here" payload: the controlling weakness plus what to do about it. */
export function weaknessInterventionPlan(
  axisIndex: number,
  currentScore: number,
  floor: number | null,
): {
  dimension: string;
  currentScore: number;
  floor: number | null;
  interventions: Intervention[];
  disclosure: string;
} {
  return {
    dimension: ALL_AXES[axisIndex] ?? `axis ${axisIndex}`,
    currentScore,
    floor,
    interventions: interventionsForAxis(axisIndex),
    disclosure:
      "Educational protocol suggestions from peer-reviewed capacity-development literature. " +
      "Not medical advice. Discuss clinical protocols with a licensed professional.",
  };
}
