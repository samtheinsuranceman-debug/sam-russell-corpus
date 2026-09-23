/**
 * Projection confidence — how far a calculator can project with confidence,
 * graded year by year, with the reasoning and the citations behind the grade.
 *
 * The owner's ask (23 Sep 2026): a predictive engine and an optional toggle on
 * every calculator, a statement of how long the projection can be trusted, a
 * confidence grade on the report, and the references and reasoning behind it.
 *
 * The horizons are rows in the rules table (`projection.horizon.*`), stated so
 * they can be argued with:
 *
 *   years 1–2    the layer's live signals lead 3–24 months, so current readings
 *                reach this far and no further
 *   years 3–10   sourced, dated rules and published outlooks; they decay by
 *                cadence but stay citable
 *   years 11–30  long-run averages, reported as a 10th–90th percentile band
 *   beyond 30    shape only; no figure is cited
 *
 * The grade inside the first band comes from the evidence actually applied:
 * the macro adjustments' own confidence score when a scenario is on, the
 * forecast's provenance when the overlay is on, and A when both are live and
 * fresh. Everything below is pure: no I/O, no randomness.
 */
import { A, assumption, MACRO_ASSUMPTIONS, type Assumption } from "./assumptions";
import { gradeFor } from "./confidence";
import { SOURCE_BY_ID } from "./sources";
import { NEUTRAL_ADJUSTMENTS } from "./adjustments";
import type { MacroAdjustments } from "./types";

export type ConfidenceGrade = "A" | "B" | "C" | "D" | "E";

export type HorizonBand = {
  /** First and last projection year of the band, inclusive. */
  fromYear: number;
  toYear: number;
  grade: ConfidenceGrade;
  label: string;
  why: string;
};

export type Citation = {
  id: string;
  title: string;
  kind: "source" | "assumption" | "forecast";
  url?: string;
  asOf?: string;
  note?: string;
};

export type ForecastProvenance = {
  source: string;
  asOf: string;
  method: string;
  unavailableReason?: string;
};

export type ProjectionConfidenceInput = {
  /** How many years the calculator projects. */
  years: number;
  /** The macro scenario adjustments in force, if the toggle is on. */
  adjustments?: MacroAdjustments | null;
  /** The forecast overlay's provenance, if the toggle is on. */
  forecast?: ForecastProvenance | null;
};

export type ProjectionConfidence = {
  years: number;
  /** The last year a figure can be cited on current readings. */
  confidentYears: number;
  /** The last year a figure rests on sourced, dated rules. */
  moderateYears: number;
  /** The last year a band is reported; beyond it, shape only. */
  bandYears: number;
  bands: HorizonBand[];
  /** One grade per projection year, index 0 = year 1. */
  byYear: ConfidenceGrade[];
  /** The grade a report should print for the projection as a whole. */
  overall: ConfidenceGrade;
  statement: string;
  reasoning: string[];
  citations: Citation[];
};

const GRADE_LABEL: Record<ConfidenceGrade, string> = {
  A: "high confidence",
  B: "good confidence",
  C: "moderate confidence",
  D: "a band, not a number",
  E: "shape only",
};

function worse(a: ConfidenceGrade, b: ConfidenceGrade): ConfidenceGrade {
  return a > b ? a : b;
}

function citationForId(id: string): Citation | null {
  const src = SOURCE_BY_ID.get(id);
  if (src) return { id, title: `${src.name} (${src.entity})`, kind: "source", url: src.url };
  const asm = MACRO_ASSUMPTIONS.get(id);
  if (asm) return citationForAssumption(asm);
  return null;
}

function citationForAssumption(a: Assumption): Citation {
  const url = a.basis.match(/https?:\/\/\S+/)?.[0]?.replace(/[.,)]+$/, "");
  const src = SOURCE_BY_ID.get(a.source);
  return {
    id: a.id,
    title: `${a.id} = ${a.value} ${a.unit}`,
    kind: "assumption",
    url: url ?? src?.url,
    asOf: a.asOf,
    note: `${src ? src.name : a.source}: ${a.basis}`,
  };
}

/**
 * The grade for the first band, from what is actually applied. Nothing on:
 * the calculator's own assumptions stand, which is B (sourced, but not
 * refreshed against today's readings). A macro scenario on: the adjustments'
 * confidence score, graded by the confidence engine's own bands. A forecast
 * applied: at least B; unavailable: unchanged.
 */
export function nearTermGrade(adjustments?: MacroAdjustments | null, forecast?: ForecastProvenance | null): ConfidenceGrade {
  const scenarioOn = Boolean(adjustments) && adjustments !== NEUTRAL_ADJUSTMENTS && (adjustments!.rationale[0] !== NEUTRAL_ADJUSTMENTS.rationale[0]);
  const forecastOn = Boolean(forecast && !forecast.unavailableReason);
  if (!scenarioOn && !forecastOn) return "B";
  let grade: ConfidenceGrade = forecastOn ? "A" : "B";
  if (scenarioOn) {
    // The confidence engine's lowest band is F; this scale ends at E (shape only).
    const g = gradeFor(adjustments!.confidence);
    grade = worse(grade, g === "F" ? "E" : g);
  }
  return grade;
}

export function projectionConfidence(input: ProjectionConfidenceInput): ProjectionConfidence {
  const years = Math.max(1, Math.round(input.years));
  const confidentYears = A("projection.horizon.confident");
  const moderateYears = A("projection.horizon.moderate");
  const bandYears = A("projection.horizon.band");

  const near = nearTermGrade(input.adjustments, input.forecast);
  // Each later band is at least one grade below the one before it.
  const mid = worse(near, "C");
  const bands: HorizonBand[] = [
    {
      fromYear: 1,
      toYear: confidentYears,
      grade: near,
      label: GRADE_LABEL[near],
      why: "Current readings reach this far: the layer's measurable signals lead their targets by 3 to 24 months.",
    },
    {
      fromYear: confidentYears + 1,
      toYear: moderateYears,
      grade: mid,
      label: GRADE_LABEL[mid],
      why: "Sourced, dated rules and published outlooks carry these years; nothing live reaches them.",
    },
    {
      fromYear: moderateYears + 1,
      toYear: bandYears,
      grade: "D",
      label: GRADE_LABEL.D,
      why: "Long-run averages only. Read the 10th to 90th percentile band, not the line.",
    },
    {
      fromYear: bandYears + 1,
      toYear: Number.POSITIVE_INFINITY,
      grade: "E",
      label: GRADE_LABEL.E,
      why: "Beyond the record the platform holds. The curve shows the shape of compounding; cite no figure from it.",
    },
  ];

  const byYear: ConfidenceGrade[] = [];
  for (let y = 1; y <= years; y++) byYear.push(bands.find(b => y >= b.fromYear && y <= b.toYear)!.grade);
  const overall = byYear[byYear.length - 1]!;

  const statement =
    `Confident for ${confidentYears} year${confidentYears === 1 ? "" : "s"} (${GRADE_LABEL[near]}); ` +
    `${GRADE_LABEL[mid]} to year ${moderateYears}; a band to year ${bandYears}` +
    (years > bandYears ? `; years ${bandYears + 1} to ${years} are shape only.` : ".") +
    ` This projection runs ${years} year${years === 1 ? "" : "s"}, so cite it as ${GRADE_LABEL[overall]}.`;

  const reasoning: string[] = [];
  if (input.forecast && !input.forecast.unavailableReason) {
    reasoning.push(`Forecast overlay applied: ${input.forecast.source}, as of ${input.forecast.asOf}; method: ${input.forecast.method}.`);
  } else if (input.forecast?.unavailableReason) {
    reasoning.push(`Forecast overlay not applied: ${input.forecast.unavailableReason}. The calculator's own assumptions stand.`);
  }
  if (input.adjustments && input.adjustments !== NEUTRAL_ADJUSTMENTS) {
    for (const line of input.adjustments.rationale) reasoning.push(line);
    reasoning.push(`Scenario model confidence ${input.adjustments.confidence}/100, graded ${gradeFor(input.adjustments.confidence)}.`);
  }
  if (reasoning.length === 0) reasoning.push("No scenario or forecast is applied; the figures are the calculator's own sourced assumptions.");
  reasoning.push(`Horizon rule: ${assumption("projection.horizon.confident").basis}`);

  const citations: Citation[] = [];
  const seen = new Set<string>();
  const add = (c: Citation | null) => { if (c && !seen.has(c.id)) { seen.add(c.id); citations.push(c); } };
  if (input.forecast && !input.forecast.unavailableReason) {
    add({ id: `forecast:${input.forecast.source}`, title: input.forecast.source, kind: "forecast", asOf: input.forecast.asOf, note: input.forecast.method });
  }
  for (const id of input.adjustments?.sourceIds ?? []) add(citationForId(id));
  for (const id of ["projection.horizon.confident", "projection.horizon.moderate", "projection.horizon.band"]) add(citationForAssumption(assumption(id)));

  return { years, confidentYears, moderateYears, bandYears, bands, byYear, overall, statement, reasoning, citations };
}
