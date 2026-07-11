// ============================================================
// Cohort norming — rarity within your generation, not just the whole population
// ============================================================
// A whole-population rarity silently rewards ACCUMULATED TIME: developmental
// lines (meaning-making, wisdom, achievement) compound with age, so by
// construction elders look rarest and the young look average — even a
// 25-year-old who is 1-in-2,000 for their age reads as ordinary against a
// population dominated by people who have had 40 more years to climb.
//
// Cohort norming fixes this by scoring a person against their OWN age band. The
// same absolute score is rarer for a younger person (their peers score lower on
// developmental lines) and less rare for an older person (their peers score
// higher). We do NOT touch age-normed lines: CHC / IQ-style "measured" lines are
// already deviation-normed to age peers, so they get zero cohort adjustment.
//
// This v1 uses a THEORETICAL age-expectation curve. It becomes empirical — and
// far sharper — as real assessments fill each generation band. Versioned like
// the population norming so historical results stay reproducible.

import { AXIS_MODE, type AxisMode } from "./axisModes";

export const COHORT_NORMING_VERSION = "2026.07-cohort-theoretical-v1";

export type Generation =
  | "Gen Alpha"
  | "Gen Z"
  | "Millennial"
  | "Gen X"
  | "Boomer"
  | "Silent";

// Standard US generational boundaries (by birth year).
export function generationForBirthYear(year: number): Generation {
  if (year >= 2013) return "Gen Alpha";
  if (year >= 1997) return "Gen Z";
  if (year >= 1981) return "Millennial";
  if (year >= 1965) return "Gen X";
  if (year >= 1946) return "Boomer";
  return "Silent";
}

export function ageFromBirthYear(birthYear: number, currentYear: number): number {
  return Math.max(0, currentYear - birthYear);
}

// Oldest → youngest. Used to measure generational distance between two people.
export const GENERATION_ORDER: Generation[] = [
  "Silent",
  "Boomer",
  "Gen X",
  "Millennial",
  "Gen Z",
  "Gen Alpha",
];

export function generationIndex(g: Generation): number {
  return GENERATION_ORDER.indexOf(g);
}

// Number of generations between two birth years (0 = same generation).
export function generationGap(birthYearA: number, birthYearB: number): number {
  return Math.abs(
    generationIndex(generationForBirthYear(birthYearA)) -
      generationIndex(generationForBirthYear(birthYearB)),
  );
}

// How strongly each measurement MODE compounds with age/experience — the
// per-axis "developmental weight" for cohort norming.
//   altitude     — meaning-making / developmental stage: compounds the most.
//   demonstrated — real-world achievement: accumulates with time & opportunity.
//   calibration  — self-knowledge / wisdom: improves somewhat with age.
//   measured     — CHC / IQ-style: ALREADY age-normed by construction → no shift.
//   stance       — not fed into rarity at all.
export const DEV_WEIGHT: Record<AxisMode, number> = {
  altitude: 1.0,
  demonstrated: 0.5,
  calibration: 0.3,
  measured: 0.0,
  stance: 0.0,
};

// The whole-population curve is anchored to a mid-life reference age; cohort
// norming measures a person's developmental level relative to THIS anchor.
export const COHORT_ANCHOR_AGE = 45;

// Concave-increasing maturation curve on [0,1]: the population's expected
// developmental level rises quickly in early adulthood, then plateaus.
//   age 18 → ~0.11   age 30 → ~0.35   age 45 → ~0.60   age 65 → ~0.84   age 75+ → 1.0
export function maturation(age: number): number {
  const a = Math.max(0, Math.min(1, (age - 15) / 60)); // 15y..75y active span
  return Math.pow(a, 0.75);
}

// Signed score shift that converts an ABSOLUTE 0..1 score into a WITHIN-COHORT
// score for one axis. Positive for people younger than the anchor (peers score
// lower → same score is rarer), negative for older. Zero for age-normed lines.
export function cohortScoreShift(axisName: string, age: number): number {
  const mode: AxisMode = AXIS_MODE[axisName]?.mode ?? "demonstrated";
  const w = DEV_WEIGHT[mode];
  if (w === 0) return 0; // age-normed line — no cohort adjustment (avoids -0 too)
  return w * (maturation(COHORT_ANCHOR_AGE) - maturation(age));
}

// Apply the shift and clamp back into [0,1]. Feed the result through the SAME
// population scoreToRarity curve to get the cohort-relative rarity.
export function cohortAdjustedScore(
  score: number,
  axisName: string,
  age: number,
): number {
  return Math.max(0, Math.min(1, score + cohortScoreShift(axisName, age)));
}
