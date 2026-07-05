// ============================================================
// AQAL — Axis Measurement Modes (32-line model)
// ============================================================
// Each of the 32 axes is scored — and must be REPORTED — in exactly one mode,
// fixed by what reference data actually exists, NOT by how strong a user's evidence is.
//
//   measured     — a normed, representative population distribution exists AND a user can
//                  realistically supply the normed input (e.g. standardized test scores).
//                  → Carries a real percentile. Render as "Top X% vs. general population".
//
//   calibration  — objectively tested on its own scale (distance from perfect calibration).
//                  Not a population percentile; scored against a fixed mathematical anchor.
//                  → Render as "X / 100" (Brier-based calibration index).
//
//   altitude     — a developmental / meaning-making construct. Structure is readable, but no
//                  representative population census exists (stage distributions come from
//                  non-representative convenience samples).
//                  → Render a stage band ("Integral", "Self-authoring"), NEVER a population percentile.
//
//   demonstrated — achievement is documentable, but no normed population distribution exists for
//                  the trait. Uploaded evidence raises and VERIFIES a floor.
//                  → Render "demonstrated [level], verified", NEVER a percentage.
//
//   stance       — a developmental STANCE scored by the nine-stage Spiral Dynamics ladder.
//                  Not a numeric score, not a percentile, NEVER fed into the rarity composite.
//                  → Render as "Stage X (Color / label) — qualitative read".
//                  These are capacities graded by the relationship to the capacity, not by amount.
//
// WHY THIS MATTERS:
// Uploads fix "we couldn't collect the input." They do NOT fix "no population was ever normed
// for this construct." Better evidence raises CONFIDENCE on every line; it only produces a
// PERCENTILE on lines where the comparison population was actually measured. Keeping these
// verbs distinct in the UI is what lets the report survive scrutiny — and, for a sophisticated
// audience, that restraint reads as rigor.
//
// INDEPENDENT DIMENSIONS (indep: true):
// Lines genuinely uncorrelated with g and with each other. These widen the effective-dimension
// base that drives the composite rarity estimate. The cognitive lines share g and collapse
// toward one factor; the independent lines do not.
//
// STANCE LINES (mode: "stance"):
// These are developmental capacities graded by stage, not amount. They show in the profile
// but NEVER inflate the 1-in-X rarity number. Each has its own elicitation module and
// nine-stage rubric documented in references/.

export type AxisMode = "measured" | "calibration" | "altitude" | "demonstrated" | "stance";

// Classification of all 32 axes.
// indep: true = genuinely low-g-correlation line that widens the effective-dimension base
// feedsRarity: false = explicitly excluded from the rarity composite (all stance lines)
export const AXIS_MODE: Record<string, { mode: AxisMode; indep: boolean; feedsRarity: boolean }> = {
  // ─── MEASURED — CHC-normed cognitive lines ───────────────────────────────────
  // A real percentile is available once the user uploads a standardized score.
  // These share variance (g), so the composite must account for their correlation.
  Logical:       { mode: "measured", indep: false, feedsRarity: true },
  Mathematical:  { mode: "measured", indep: false, feedsRarity: true },
  Spatial:       { mode: "measured", indep: false, feedsRarity: true },
  Linguistic:    { mode: "measured", indep: false, feedsRarity: true },
  Volitional:    { mode: "measured", indep: true, feedsRarity: true },  // Conscientiousness — genuinely independent of g

  // ─── CALIBRATION — objectively tested, own scale ────────────────────────────
  "Meta-Cognitive": { mode: "calibration", indep: true, feedsRarity: true },

  // ─── ALTITUDE — developmental / meaning-making ──────────────────────────────
  // Stage band only; never a population percentile.
  Intrapersonal:  { mode: "altitude", indep: false, feedsRarity: true },
  Reflective:     { mode: "altitude", indep: false, feedsRarity: true },
  Existential:    { mode: "altitude", indep: false, feedsRarity: true },
  Philosophical:  { mode: "altitude", indep: false, feedsRarity: true },
  Integrative:    { mode: "altitude", indep: false, feedsRarity: true },

  // ─── DEMONSTRATED — verified achievement floor ──────────────────────────────
  // No normed population distribution exists.
  Interpersonal:  { mode: "demonstrated", indep: false, feedsRarity: true },
  Empathic:       { mode: "demonstrated", indep: false, feedsRarity: true },
  Intuitive:      { mode: "demonstrated", indep: false, feedsRarity: true },
  Musical:        { mode: "demonstrated", indep: false, feedsRarity: true },
  Kinesthetic:    { mode: "demonstrated", indep: false, feedsRarity: true },
  Naturalistic:   { mode: "demonstrated", indep: false, feedsRarity: true },
  Strategic:      { mode: "demonstrated", indep: false, feedsRarity: true },
  Tactical:       { mode: "demonstrated", indep: false, feedsRarity: true },
  Adaptive:       { mode: "demonstrated", indep: false, feedsRarity: true },
  Resilient:      { mode: "demonstrated", indep: false, feedsRarity: true },
  Systematic:     { mode: "demonstrated", indep: false, feedsRarity: true },
  Architectural:  { mode: "demonstrated", indep: false, feedsRarity: true },
  Adversarial:    { mode: "demonstrated", indep: true, feedsRarity: true },   // genuinely independent of g
  Interoceptive:  { mode: "demonstrated", indep: true, feedsRarity: true },   // genuinely independent of g
  Aesthetic:      { mode: "demonstrated", indep: true, feedsRarity: true },   // genuinely independent of g
  Influence:      { mode: "demonstrated", indep: false, feedsRarity: true },

  // Humor — Claude confirmed as a real independent line (not g-loaded), scored like demonstrated.
  Humor:                { mode: "demonstrated", indep: true, feedsRarity: true },

  // ─── STANCE — developmental stage-graded lines ──────────────────────────────
  // Graded by the nine-stage Spiral Dynamics ladder (3 Red → 7+ Integral).
  // NEVER a percentile. NEVER fed into rarity. Shown as qualitative developmental band.
  Parenting:            { mode: "stance", indep: false, feedsRarity: false },
  Seduction:            { mode: "stance", indep: false, feedsRarity: false },
  "Community-Founding": { mode: "stance", indep: false, feedsRarity: false },
  "Financial-Self-Management": { mode: "stance", indep: false, feedsRarity: false },
};

export const MODE_META: Record<
  AxisMode,
  { label: string; color: string; verb: string; note: string }
> = {
  measured: {
    label: "Measured",
    color: "#C9A24B", // brass
    verb: "percentile vs. general population",
    note: "Normed against a representative population.",
  },
  calibration: {
    label: "Calibration",
    color: "#9FB98C", // sage green
    verb: "distance from perfect calibration",
    note: "Objectively tested against a fixed mathematical anchor.",
  },
  altitude: {
    label: "Developmental",
    color: "#7FB0CE", // celestial blue
    verb: "developmental stage estimate",
    note: "A developmental estimate, not a population percentile.",
  },
  demonstrated: {
    label: "Demonstrated",
    color: "#C67E5A", // terracotta
    verb: "verified achievement level",
    note: "A verified floor from real-world evidence, not a population percentile.",
  },
  stance: {
    label: "Stance",
    color: "#B08DBF", // muted violet
    verb: "developmental stage (Spiral Dynamics)",
    note: "A developmental stance graded by stage, not amount. Not fed into rarity.",
  },
};

// Stage labels for stance lines (Spiral Dynamics ladder)
export const STAGE_LABELS: Record<number, { color: string; name: string; short: string }> = {
  3: { color: "Red", name: "Power / Safety", short: "Red" },
  4: { color: "Blue", name: "Order / Conformity", short: "Blue" },
  5: { color: "Orange", name: "Achievement", short: "Orange" },
  6: { color: "Green", name: "Communitarian", short: "Green" },
  7: { color: "Teal", name: "Integral", short: "Teal" },
  8: { color: "Turquoise", name: "Holistic", short: "Turquoise" },
  9: { color: "Coral", name: "Transcendent", short: "Coral" },
};

// Which axes are stance lines (for UI filtering)
export const STANCE_AXES = Object.entries(AXIS_MODE)
  .filter(([, v]) => v.mode === "stance")
  .map(([k]) => k);

// Which axes feed the rarity composite
export const RARITY_AXES = Object.entries(AXIS_MODE)
  .filter(([, v]) => v.feedsRarity)
  .map(([k]) => k);

export function axisMode(axis: string): AxisMode {
  return AXIS_MODE[axis]?.mode ?? "demonstrated";
}

export function axisIndep(axis: string): boolean {
  return AXIS_MODE[axis]?.indep ?? false;
}

export function axisFeedsRarity(axis: string): boolean {
  return AXIS_MODE[axis]?.feedsRarity ?? true;
}

export function modeColor(axis: string): string {
  return MODE_META[axisMode(axis)].color;
}

export function modeLabel(axis: string): string {
  return MODE_META[axisMode(axis)].label;
}

export function modeVerb(axis: string): string {
  return MODE_META[axisMode(axis)].verb;
}

// Count of genuinely independent dimensions (only those that feed rarity)
export const INDEPENDENT_COUNT = Object.values(AXIS_MODE).filter((a) => a.indep && a.feedsRarity).length;

// All axis names in display order (27 scored + 5 stance = 32 total)
export const ALL_AXES = Object.keys(AXIS_MODE);

// Total line count
export const TOTAL_LINES = ALL_AXES.length;
