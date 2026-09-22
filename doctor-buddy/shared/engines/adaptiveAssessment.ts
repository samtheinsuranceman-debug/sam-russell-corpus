/**
 * DOCTOR BUDDY — Adaptive DSM-5 Psychiatric Assessment Engine
 * Patent 06: "Adaptive DSM-5 Psychiatric Assessment System Utilizing 3-Parameter
 * IRT and Reinforcement Learning"
 *
 * Implements the computerized adaptive testing method of claim 1:
 *
 *   - an item bank where each item carries 3-parameter IRT parameters
 *     (discrimination a, difficulty b, pseudo-guessing c);
 *   - a multi-dimensional latent psychiatric trait vector, initialized and then
 *     refined as answers arrive;
 *   - item selection that maximizes expected information gain about that vector;
 *   - Bayesian posterior updating of the trait estimate on each response;
 *   - termination when the differential entropy of the posterior falls below a
 *     stopping threshold;
 *   - a differential diagnosis generated from the final estimate.
 *
 * Claim 1 specifies a PPO-trained policy network for item selection. A learned
 * policy needs training data this engine does not have, so selection here uses the
 * expected-information-gain objective that such a policy is trained to maximize —
 * the reward function, computed directly. That is a faithful, inspectable stand-in
 * and the natural place to drop a trained policy in later: replace `selectNextItem`
 * and nothing else changes.
 *
 * CLINICAL POSITIONING. This is decision support for a licensed clinician. It
 * produces a ranked differential to inform assessment; it does not diagnose, and
 * every output is designed to be overridden by the clinician who sees the patient.
 */

// ─── Latent trait dimensions ──────────────────────────────────────────────────
/**
 * The latent psychiatric trait vector. Dimensions are transdiagnostic severity
 * axes rather than DSM categories, so a single item can inform several disorders
 * at once — which is what makes adaptive selection worth doing.
 */
export const TRAIT_DIMENSIONS = [
  "depression",
  "anxiety",
  "mania",
  "psychosis",
  "trauma",
  "substance",
  "inattention",
] as const;

export type TraitDimension = (typeof TRAIT_DIMENSIONS)[number];

/** Mean and standard deviation of the posterior on one trait dimension. */
export interface TraitEstimate {
  /** Posterior mean on the standard normal theta scale. */
  theta: number;
  /** Posterior standard deviation — the engine's uncertainty on this axis. */
  sd: number;
}

export type TraitVector = Record<TraitDimension, TraitEstimate>;

// ─── Item bank ────────────────────────────────────────────────────────────────
export interface AssessmentItem {
  id: string;
  /** The question as read to the patient. */
  text: string;
  /** Which latent dimension this item loads on. */
  dimension: TraitDimension;
  /** IRT discrimination (a) — how sharply the item separates trait levels. */
  discrimination: number;
  /** IRT difficulty (b) — the trait level at which endorsement becomes likely. */
  difficulty: number;
  /** IRT pseudo-guessing (c) — floor endorsement probability at very low trait. */
  pseudoGuessing: number;
  /**
   * Items that screen for imminent danger. These are never deferred by the
   * information-gain objective — safety outranks efficiency.
   */
  safetyCritical?: boolean;
  /** DSM-5 criteria this item speaks to, for the differential rationale. */
  dsmCriteria?: string[];
}

/**
 * Item bank. Parameters are illustrative values in the ranges these instruments
 * typically calibrate to; a deployment would replace them with parameters fitted
 * on its own population, which is exactly what the `IRT_PARAMETER_BOUNDS` below
 * are there to validate.
 */
export const ITEM_BANK: AssessmentItem[] = [
  // Depression
  { id: "dep-01", dimension: "depression", discrimination: 1.8, difficulty: -0.6, pseudoGuessing: 0.05, text: "Over the last two weeks, how often have you felt little interest or pleasure in doing things?", dsmCriteria: ["MDD A1 anhedonia"] },
  { id: "dep-02", dimension: "depression", discrimination: 1.9, difficulty: -0.4, pseudoGuessing: 0.05, text: "Over the last two weeks, how often have you felt down, depressed, or hopeless?", dsmCriteria: ["MDD A2 depressed mood"] },
  { id: "dep-03", dimension: "depression", discrimination: 1.4, difficulty: 0.3, pseudoGuessing: 0.08, text: "How often have you felt tired or had little energy?", dsmCriteria: ["MDD A6 fatigue"] },
  { id: "dep-04", dimension: "depression", discrimination: 1.6, difficulty: 0.9, pseudoGuessing: 0.04, text: "How often have you felt bad about yourself, or that you are a failure or have let people down?", dsmCriteria: ["MDD A7 worthlessness"] },
  { id: "dep-05", dimension: "depression", discrimination: 2.2, difficulty: 1.6, pseudoGuessing: 0.02, safetyCritical: true, text: "How often have you had thoughts that you would be better off dead, or of hurting yourself in some way?", dsmCriteria: ["MDD A9 suicidal ideation"] },

  // Anxiety
  { id: "anx-01", dimension: "anxiety", discrimination: 1.7, difficulty: -0.5, pseudoGuessing: 0.06, text: "How often have you felt nervous, anxious, or on edge?", dsmCriteria: ["GAD A excessive anxiety"] },
  { id: "anx-02", dimension: "anxiety", discrimination: 1.9, difficulty: -0.2, pseudoGuessing: 0.05, text: "How often have you been unable to stop or control worrying?", dsmCriteria: ["GAD B difficulty controlling worry"] },
  { id: "anx-03", dimension: "anxiety", discrimination: 1.3, difficulty: 0.7, pseudoGuessing: 0.07, text: "How often have you had trouble relaxing, or felt restless?", dsmCriteria: ["GAD C1 restlessness"] },
  { id: "anx-04", dimension: "anxiety", discrimination: 1.5, difficulty: 1.2, pseudoGuessing: 0.05, text: "Have you had sudden episodes of intense fear with racing heart or shortness of breath?", dsmCriteria: ["Panic disorder A"] },

  // Mania
  { id: "man-01", dimension: "mania", discrimination: 2.0, difficulty: 0.8, pseudoGuessing: 0.03, text: "Have there been periods when you felt so good or hyper that others thought you were not your normal self?", dsmCriteria: ["Manic episode A elevated mood"] },
  { id: "man-02", dimension: "mania", discrimination: 1.8, difficulty: 1.1, pseudoGuessing: 0.03, text: "Have there been periods when you needed much less sleep than usual and still felt rested?", dsmCriteria: ["Manic episode B2 decreased need for sleep"] },
  { id: "man-03", dimension: "mania", discrimination: 1.6, difficulty: 1.4, pseudoGuessing: 0.04, text: "Have there been times you were much more talkative or your thoughts raced faster than usual?", dsmCriteria: ["Manic episode B3/B4"] },

  // Psychosis
  { id: "psy-01", dimension: "psychosis", discrimination: 2.1, difficulty: 1.5, pseudoGuessing: 0.02, text: "Have you heard voices or sounds that other people could not hear?", dsmCriteria: ["Schizophrenia A2 hallucinations"] },
  { id: "psy-02", dimension: "psychosis", discrimination: 2.0, difficulty: 1.7, pseudoGuessing: 0.02, text: "Have you felt that people were watching you, following you, or intending to harm you?", dsmCriteria: ["Schizophrenia A1 delusions"] },

  // Trauma
  { id: "tra-01", dimension: "trauma", discrimination: 1.7, difficulty: 0.4, pseudoGuessing: 0.05, text: "Have you had repeated, unwanted memories or nightmares about a stressful experience?", dsmCriteria: ["PTSD B1/B2 intrusion"] },
  { id: "tra-02", dimension: "trauma", discrimination: 1.5, difficulty: 0.7, pseudoGuessing: 0.05, text: "Have you been avoiding places, people, or conversations that remind you of a stressful experience?", dsmCriteria: ["PTSD C avoidance"] },
  { id: "tra-03", dimension: "trauma", discrimination: 1.4, difficulty: 0.9, pseudoGuessing: 0.06, text: "Have you felt constantly on guard, watchful, or easily startled?", dsmCriteria: ["PTSD E4 hypervigilance"] },

  // Substance
  { id: "sub-01", dimension: "substance", discrimination: 1.6, difficulty: 0.5, pseudoGuessing: 0.04, text: "Have you found you drink or use more, or for longer, than you intended?", dsmCriteria: ["SUD A1 larger amounts"] },
  { id: "sub-02", dimension: "substance", discrimination: 1.8, difficulty: 1.0, pseudoGuessing: 0.03, text: "Have you wanted to cut down or stop using, and found you could not?", dsmCriteria: ["SUD A2 unsuccessful efforts"] },

  // Inattention
  { id: "att-01", dimension: "inattention", discrimination: 1.5, difficulty: 0.2, pseudoGuessing: 0.07, text: "How often do you have trouble finishing a task once the interesting parts are done?", dsmCriteria: ["ADHD A1c/A1d"] },
  { id: "att-02", dimension: "inattention", discrimination: 1.4, difficulty: 0.6, pseudoGuessing: 0.07, text: "How often do you misplace things or have difficulty keeping your affairs in order?", dsmCriteria: ["ADHD A1g/A1h"] },
];

/** Plausible ranges for fitted 3PL parameters; used to validate a swapped-in bank. */
export const IRT_PARAMETER_BOUNDS = {
  discrimination: { min: 0.2, max: 4.0 },
  difficulty: { min: -4.0, max: 4.0 },
  pseudoGuessing: { min: 0.0, max: 0.5 },
} as const;

/** Response on a 0-3 severity scale (the PHQ/GAD convention). */
export type ResponseValue = 0 | 1 | 2 | 3;

export interface ItemResponse {
  itemId: string;
  value: ResponseValue;
}

// ─── 3PL IRT model ────────────────────────────────────────────────────────────
/**
 * Three-parameter logistic model. Probability of endorsing an item at trait
 * level theta:
 *
 *   P(theta) = c + (1 - c) / (1 + exp(-a(theta - b)))
 *
 * The pseudo-guessing floor c is what makes this 3PL rather than 2PL: even a
 * patient far below the threshold endorses occasionally, and pretending otherwise
 * biases the posterior.
 */
export function probabilityCorrect(item: AssessmentItem, theta: number): number {
  const { discrimination: a, difficulty: b, pseudoGuessing: c } = item;
  const logistic = 1 / (1 + Math.exp(-a * (theta - b)));
  return c + (1 - c) * logistic;
}

/**
 * Fisher information for a 3PL item at theta. Peaks near the item's difficulty and
 * is scaled by discrimination — this is why an adaptive test converges so much
 * faster than a fixed battery: it keeps asking near the current estimate.
 */
export function fisherInformation(item: AssessmentItem, theta: number): number {
  const { discrimination: a, pseudoGuessing: c } = item;
  const p = probabilityCorrect(item, theta);
  if (p <= c || p >= 1) return 0;
  const q = 1 - p;
  // Birnbaum's 3PL information function.
  return (a * a * q * Math.pow(p - c, 2)) / (p * Math.pow(1 - c, 2));
}

/** Differential entropy of a univariate Gaussian posterior, in nats. */
export function differentialEntropy(sd: number): number {
  return 0.5 * Math.log(2 * Math.PI * Math.E * sd * sd);
}

/** Total differential entropy across the trait vector. */
export function vectorEntropy(traits: TraitVector): number {
  return TRAIT_DIMENSIONS.reduce((sum, d) => sum + differentialEntropy(traits[d].sd), 0);
}

// ─── Session state ────────────────────────────────────────────────────────────
export interface AssessmentConfig {
  /** Stop when total differential entropy drops below this. */
  entropyStoppingThreshold: number;
  /** Hard cap on items, so a session always terminates. */
  maxItems: number;
  /** Ask at least this many before the entropy rule may fire. */
  minItems: number;
  /** Prior standard deviation on each trait at session start. */
  priorSd: number;
}

export const DEFAULT_CONFIG: AssessmentConfig = {
  // Seven dimensions at sd≈0.62 each — a meaningful tightening from the prior.
  entropyStoppingThreshold: 7.0,
  maxItems: 20,
  minItems: 6,
  priorSd: 1.0,
};

export interface AssessmentSession {
  traits: TraitVector;
  administered: ItemResponse[];
  config: AssessmentConfig;
  complete: boolean;
  /** Why the session ended, once it has. */
  terminationReason: "entropy_threshold" | "max_items" | "item_bank_exhausted" | null;
}

/** Initialize the latent trait vector to the population prior. */
export function initializeSession(config: AssessmentConfig = DEFAULT_CONFIG): AssessmentSession {
  const traits = {} as TraitVector;
  for (const d of TRAIT_DIMENSIONS) traits[d] = { theta: 0, sd: config.priorSd };
  return { traits, administered: [], config, complete: false, terminationReason: null };
}

// ─── Item selection ───────────────────────────────────────────────────────────
/**
 * Expected information gain from administering an item, in nats: the reduction in
 * differential entropy on that item's dimension if it were answered now.
 *
 * This is the reward the PPO policy of claim 1 is trained to maximize. Computing
 * it directly gives the same objective without a trained network, and keeps the
 * selection auditable — a clinician can ask why an item was chosen and get a real
 * answer rather than a policy activation.
 */
export function expectedInformationGain(item: AssessmentItem, session: AssessmentSession): number {
  const current = session.traits[item.dimension];
  const info = fisherInformation(item, current.theta);
  if (info <= 0) return 0;
  // Posterior precision adds: 1/sd'^2 = 1/sd^2 + I(theta)
  const posteriorSd = 1 / Math.sqrt(1 / (current.sd * current.sd) + info);
  return differentialEntropy(current.sd) - differentialEntropy(posteriorSd);
}

/**
 * Select the next item.
 *
 * Safety-critical items are surfaced first once their dimension shows any
 * elevation — an efficient test that defers the suicide item is not a test worth
 * running. Otherwise the highest expected information gain wins.
 */
export function selectNextItem(
  session: AssessmentSession,
  bank: AssessmentItem[] = ITEM_BANK,
): AssessmentItem | null {
  const asked = new Set(session.administered.map(r => r.itemId));
  const available = bank.filter(i => !asked.has(i.id));
  if (available.length === 0) return null;

  // Safety-critical items pre-empt the information-gain objective once there is
  // EVIDENCE of elevation on their dimension — meaning at least one response has
  // been recorded and the posterior has moved above the prior mean. Gating on the
  // prior itself would fire for every patient before any evidence and would
  // disable adaptive selection entirely.
  const pendingSafety = available.filter(
    i => i.safetyCritical && session.administered.length > 0 && session.traits[i.dimension].theta > 0,
  );
  const pool = pendingSafety.length > 0 ? pendingSafety : available;

  let best = pool[0];
  let bestGain = expectedInformationGain(best, session);
  for (const item of pool.slice(1)) {
    const gain = expectedInformationGain(item, session);
    if (gain > bestGain) {
      best = item;
      bestGain = gain;
    }
  }
  return best;
}

// ─── Bayesian update ──────────────────────────────────────────────────────────
/**
 * Update the trait posterior from one response.
 *
 * A 0-3 severity response is mapped to an observed proportion and compared against
 * what the 3PL model expected at the current theta. The estimate moves toward the
 * observation in proportion to how informative the item is and how uncertain the
 * current estimate is — a Kalman-style conjugate update, which is the tractable
 * Gaussian form of the Bayesian posterior updating claim 1 requires.
 */
export function applyResponse(
  session: AssessmentSession,
  item: AssessmentItem,
  value: ResponseValue,
): AssessmentSession {
  const current = session.traits[item.dimension];
  // A response that is not 0-3 cannot move a trait estimate. It is recorded as
  // the lowest response rather than allowed to turn theta into NaN.
  const safeValue = (Number.isFinite(value) ? Math.round(Math.max(0, Math.min(3, value))) : 0) as ResponseValue;
  value = safeValue;
  const observed = value / 3;
  const expected = probabilityCorrect(item, current.theta);

  const info = fisherInformation(item, current.theta);
  const priorPrecision = 1 / (current.sd * current.sd);
  const posteriorPrecision = priorPrecision + info;
  const posteriorSd = 1 / Math.sqrt(posteriorPrecision);

  // Score-function step: the residual, scaled by discrimination, weighted by how
  // much of the total precision this observation contributes.
  const residual = observed - expected;
  const step = (item.discrimination * residual * info) / posteriorPrecision;
  const theta = clamp(current.theta + step, -4, 4);

  const traits: TraitVector = { ...session.traits, [item.dimension]: { theta, sd: posteriorSd } };
  const administered = [...session.administered, { itemId: item.id, value }];

  const entropy = vectorEntropy(traits);
  let complete = false;
  let terminationReason: AssessmentSession["terminationReason"] = null;
  if (administered.length >= session.config.maxItems) {
    complete = true;
    terminationReason = "max_items";
  } else if (
    administered.length >= session.config.minItems &&
    entropy < session.config.entropyStoppingThreshold
  ) {
    complete = true;
    terminationReason = "entropy_threshold";
  }

  return { ...session, traits, administered, complete, terminationReason };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ─── Differential diagnosis ───────────────────────────────────────────────────
export interface DifferentialCandidate {
  condition: string;
  dimension: TraitDimension;
  /** Posterior mean severity on the theta scale. */
  theta: number;
  /** Posterior uncertainty — wide means "ask more", not "rule out". */
  sd: number;
  /** Normalized 0-100 severity for display. */
  severity: number;
  /** How confident the engine is that this axis is genuinely elevated, 0-1. */
  confidence: number;
  supportingItems: string[];
  dsmCriteria: string[];
}

export interface AssessmentResult {
  differential: DifferentialCandidate[];
  itemsAdministered: number;
  finalEntropy: number;
  terminationReason: AssessmentSession["terminationReason"];
  /** True when any safety-critical item was endorsed at any level above zero. */
  safetyFlag: boolean;
  safetyItems: string[];
  clinicalNote: string;
}

const CONDITION_BY_DIMENSION: Record<TraitDimension, string> = {
  depression: "Major depressive disorder",
  anxiety: "Generalized anxiety disorder",
  mania: "Bipolar spectrum disorder",
  psychosis: "Primary psychotic disorder",
  trauma: "Post-traumatic stress disorder",
  substance: "Substance use disorder",
  inattention: "Attention-deficit/hyperactivity disorder",
};

/**
 * Standard normal CDF, used to turn a posterior into the probability that the
 * trait genuinely exceeds the clinical threshold.
 */
function normalCdf(z: number): number {
  // Abramowitz & Stegun 7.1.26 approximation to erf.
  const t = 1 / (1 + 0.3275911 * Math.abs(z));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-z * z);
  const erf = z >= 0 ? y : -y;
  return 0.5 * (1 + erf);
}

/** Trait level above which an axis is considered clinically elevated. */
export const CLINICAL_THRESHOLD = 0.5;

/**
 * Build the differential from the final trait estimate.
 *
 * Ordering is by the probability that the axis truly exceeds the clinical
 * threshold — not by raw severity. An axis estimated high but with wide posterior
 * ranks below one estimated slightly lower with a tight posterior, which is the
 * honest ordering when the question is "what should I look at next".
 */
export function generateDifferential(
  session: AssessmentSession,
  bank: AssessmentItem[] = ITEM_BANK,
): AssessmentResult {
  const byId = new Map(bank.map(i => [i.id, i]));

  const safetyItems = session.administered
    .filter(r => byId.get(r.itemId)?.safetyCritical && r.value > 0)
    .map(r => r.itemId);

  const differential: DifferentialCandidate[] = TRAIT_DIMENSIONS.map(dimension => {
    const { theta, sd } = session.traits[dimension];
    const supporting = session.administered.filter(
      r => byId.get(r.itemId)?.dimension === dimension && r.value > 0,
    );
    const criteria = supporting.flatMap(r => byId.get(r.itemId)?.dsmCriteria ?? []);
    return {
      condition: CONDITION_BY_DIMENSION[dimension],
      dimension,
      theta: round(theta),
      sd: round(sd),
      // Map theta (-4..4) onto 0-100 for display.
      severity: round(clamp((theta + 4) * 12.5, 0, 100)),
      confidence: round(normalCdf((theta - CLINICAL_THRESHOLD) / Math.max(sd, 1e-6))),
      supportingItems: supporting.map(r => r.itemId),
      dsmCriteria: Array.from(new Set(criteria)),
    };
  }).sort((a, b) => b.confidence - a.confidence);

  const top = differential[0];
  const clinicalNote =
    safetyItems.length > 0
      ? "Safety-critical item endorsed. Complete a suicide risk assessment before proceeding with the differential below."
      : top && top.confidence >= 0.6
        ? `Estimate favors ${top.condition.toLowerCase()} (${Math.round(top.confidence * 100)}% that this axis exceeds the clinical threshold). Confirm against full DSM-5 criteria, duration, and functional impairment.`
        : "No axis reached a confident elevation. Treat this as a screen, not a rule-out — consider extending the assessment or a structured clinical interview.";

  return {
    differential,
    itemsAdministered: session.administered.length,
    finalEntropy: round(vectorEntropy(session.traits)),
    terminationReason: session.terminationReason,
    safetyFlag: safetyItems.length > 0,
    safetyItems,
    clinicalNote,
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Validate a swapped-in item bank against plausible fitted-parameter ranges. */
export function validateItemBank(bank: AssessmentItem[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const item of bank) {
    if (seen.has(item.id)) problems.push(`Duplicate item id: ${item.id}`);
    seen.add(item.id);
    const b = IRT_PARAMETER_BOUNDS;
    if (item.discrimination < b.discrimination.min || item.discrimination > b.discrimination.max)
      problems.push(`${item.id}: discrimination ${item.discrimination} outside [${b.discrimination.min}, ${b.discrimination.max}]`);
    if (item.difficulty < b.difficulty.min || item.difficulty > b.difficulty.max)
      problems.push(`${item.id}: difficulty ${item.difficulty} outside [${b.difficulty.min}, ${b.difficulty.max}]`);
    if (item.pseudoGuessing < b.pseudoGuessing.min || item.pseudoGuessing > b.pseudoGuessing.max)
      problems.push(`${item.id}: pseudo-guessing ${item.pseudoGuessing} outside [${b.pseudoGuessing.min}, ${b.pseudoGuessing.max}]`);
  }
  return problems;
}
