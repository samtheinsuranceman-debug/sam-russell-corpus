/**
 * Confidence Scoring Engine.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Turns a set of sourced, dated, weighted signals into a probability with an
 * interval AND a separate confidence score. The two are deliberately distinct:
 *
 *   probability — how likely the event is, given the evidence.
 *   confidence  — how much the evidence deserves to be trusted: how much of the
 *                 model's prior weight is covered by fresh readings, from what
 *                 tier of source, corroborated by how many others.
 *
 * A model that has heard from every one of its fifteen sources this week can
 * say "5 %, confidence A". A model running on three stale wire-service reports
 * says "40 %, confidence D" — and the second number is the one a reader must
 * see first.
 *
 * Mechanics: weighted log-odds. Each piece of evidence moves the log-odds by
 * `signal × effectiveWeight × scale`, where effectiveWeight is the prior
 * weight discounted for source tier, freshness (exponential decay against the
 * indicator's cadence) and boosted, with diminishing returns, by corroboration.
 * The prior log-odds are the base rate. This is a calibrated, transparent
 * scoring rule — not a black box — so every driver can be printed with its
 * contribution, and a reader can disagree with one weight at a time.
 */
import type { ConfidenceAssessment, ConfidenceBand, Evidence, Indicator, IsoDate, ScoredDriver, SourceTier, Cadence } from "./types";
import { A } from "./assumptions";

/** Weight a source tier earns before corroboration (rules table: `conf.tier.*`). */
export const TIER_WEIGHT: Record<SourceTier, number> = {
  "primary-official": A("conf.tier.primary-official"),
  multilateral: A("conf.tier.multilateral"),
  "wire-service": A("conf.tier.wire-service"),
  research: A("conf.tier.research"),
  "state-media": A("conf.tier.state-media"),
  secondary: A("conf.tier.secondary"),
};

/** Half-life of an observation, in days, by how often the series updates (rules table: `conf.halfLife.*`). */
export const HALF_LIFE_DAYS: Record<Cadence, number> = {
  realtime: A("conf.halfLife.realtime"),
  daily: A("conf.halfLife.daily"),
  weekly: A("conf.halfLife.weekly"),
  monthly: A("conf.halfLife.monthly"),
  quarterly: A("conf.halfLife.quarterly"),
  semiannual: A("conf.halfLife.semiannual"),
  annual: A("conf.halfLife.annual"),
  irregular: A("conf.halfLife.irregular"),
};

export function daysBetween(a: IsoDate, b: IsoDate): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Math.max(0, ms / 86_400_000);
}

/** Exponential freshness discount: 1 at zero age, 0.5 at one half-life. */
export function freshness(asOf: IsoDate, today: IsoDate, cadence: Cadence): number {
  const age = daysBetween(asOf, today);
  return Math.pow(0.5, age / HALF_LIFE_DAYS[cadence]);
}

/** Corroboration boost with diminishing returns: 1 → 1.0, 2 → 1.25, 3 → 1.4, 5 → 1.55. */
export function corroborationBoost(n: number): number {
  if (n <= 1) return 1;
  return 1 + 0.6 * (1 - Math.exp(-(n - 1) / 2));
}

const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export type ConfidenceInputs = {
  modelId: string;
  /** Base rate for the event over the model's horizon, 0–1. */
  prior: number;
  indicators: Indicator[];
  evidence: Evidence[];
  today: IsoDate;
  /**
   * How far the full weight of evidence can move the log-odds. 3.0 means a
   * unanimous, fully-weighted, fresh set of signals at +1 shifts a 10 % prior
   * to roughly 70 %. Set per model from its back-test.
   */
  scale?: number;
};

export function gradeFor(confidence: number): ConfidenceBand["grade"] {
  if (confidence >= 85) return "A";
  if (confidence >= 70) return "B";
  if (confidence >= 50) return "C";
  if (confidence >= 30) return "D";
  return "F";
}

/**
 * Score one model.
 */
export function assess(input: ConfidenceInputs): ConfidenceAssessment {
  const { modelId, prior, indicators, evidence, today } = input;
  const scale = input.scale ?? 3.0;
  const byId = new Map(indicators.map(i => [i.id, i]));
  const totalPrior = indicators.reduce((s, i) => s + i.weight, 0) || 1;

  // Latest evidence per indicator wins; duplicates count as corroboration.
  const latest = new Map<string, Evidence>();
  for (const e of evidence) {
    if (!byId.has(e.indicatorId)) continue;
    const cur = latest.get(e.indicatorId);
    if (!cur || Date.parse(e.asOf) > Date.parse(cur.asOf)) latest.set(e.indicatorId, e);
  }

  const drivers: ScoredDriver[] = [];
  let logOdds = logit(clamp(prior, 0.001, 0.999));
  let covered = 0;
  let qualitySum = 0;
  const sourceIds = new Set<string>();

  for (const [id, e] of Array.from(latest.entries())) {
    const ind = byId.get(id)!;
    const fresh = freshness(e.asOf, today, ind.cadence);
    const quality = TIER_WEIGHT[e.tier] * fresh * corroborationBoost(e.corroboration);
    const effectiveWeight = (ind.weight / totalPrior) * quality;
    const directedSignal = ind.direction === "risk-up" ? e.signal : -e.signal;
    const contribution = directedSignal * effectiveWeight * scale;
    logOdds += contribution;
    covered += ind.weight * fresh;
    qualitySum += ind.weight * quality;
    drivers.push({
      indicatorId: id,
      name: ind.name,
      contribution,
      signal: e.signal,
      effectiveWeight,
      asOf: e.asOf,
      stale: fresh < 0.5,
      awareness: ind.awareness,
    });
    if (e.note) sourceIds.add(e.note);
  }

  const coverage = clamp(covered / totalPrior, 0, 1);
  const meanQuality = clamp(qualitySum / totalPrior, 0, 1);
  const missing = indicators.filter(i => !latest.has(i.id)).map(i => i.id);

  // Confidence: coverage dominates, quality refines, and a model with fewer
  // than four live indicators cannot score above C however fresh they are.
  let confidence = 100 * (0.65 * coverage + 0.35 * meanQuality);
  if (latest.size < 4) confidence = Math.min(confidence, 49);
  if (latest.size === 0) confidence = 0;
  confidence = Math.round(clamp(confidence, 0, 100));

  // Interval widens as confidence falls: at confidence 100 the band is ±5
  // points of probability space; at 0 it is ±35.
  const probability = sigmoid(logOdds);
  const halfWidth = 0.05 + 0.30 * (1 - confidence / 100);
  const band: ConfidenceBand = {
    probability: round4(probability),
    low: round4(clamp(probability - halfWidth, 0, 1)),
    high: round4(clamp(probability + halfWidth, 0, 1)),
    confidence,
    grade: gradeFor(confidence),
  };

  drivers.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    modelId,
    asOf: today,
    band,
    drivers,
    missing,
    coverage: round4(coverage),
    sourceIds: Array.from(sourceIds),
  };
}

function round4(x: number) {
  return Math.round(x * 10_000) / 10_000;
}

/**
 * Normalise a raw reading into a signal in [-1, 1] against a neutral point and
 * a span: (value − neutral) / span, clamped. A rise in treasury sales of one
 * span above neutral is a full +1.
 */
export function signalFrom(value: number, neutral: number, span: number): number {
  if (span <= 0) return 0;
  return clamp((value - neutral) / span, -1, 1);
}

/** Convert an assessment into the one-paragraph summary Thomas reads aloud. */
export function narrate(a: ConfidenceAssessment, eventLabel: string): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const top = a.drivers.slice(0, 3).map(d => `${d.name} (${d.contribution > 0 ? "+" : ""}${d.contribution.toFixed(2)})`).join("; ");
  const missing = a.missing.length ? ` ${a.missing.length} indicator(s) had no fresh reading.` : "";
  return `${eventLabel}: ${pct(a.band.probability)} (80% band ${pct(a.band.low)}–${pct(a.band.high)}), confidence ${a.band.confidence}/100 grade ${a.band.grade}, coverage ${pct(a.coverage)}. Top drivers: ${top || "none"}.${missing}`;
}
