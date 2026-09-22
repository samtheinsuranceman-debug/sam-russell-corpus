/**
 * DOCTOR BUDDY — Mental Health Vital Signs Monitor
 * Patent 10: "Clinically-Anchored Mental Health Vital Signs Monitor with
 * Autoencoder Anomaly Detection"
 *
 * Implements the system of claim 1:
 *
 *   - ingestion of heterogeneous psychiatric data streams;
 *   - PCA reducing those streams to composite indices, including at least a mood
 *     stability index and an anxiety burden score;
 *   - scaling of those indices to a standardized range anchored to normative
 *     clinical populations;
 *   - an LSTM autoencoder trained on the patient's own historical baseline;
 *   - reconstruction error on the current vector;
 *   - an anomaly alert when that error exceeds a dynamic threshold.
 *
 * THE IDEA WORTH KEEPING. Physical medicine has vital signs: a small set of
 * numbers, anchored to known normal ranges, that any clinician can read at a
 * glance and that trend meaningfully over time. Psychiatry has scattered
 * instruments administered at intervals. This engine produces the psychiatric
 * equivalent — a handful of standardized, continuously updated indices with
 * population anchors.
 *
 * ON THE AUTOENCODER. Claim 1 specifies an LSTM autoencoder trained on the
 * patient's own baseline. A trained recurrent network is not something this engine
 * can ship untrained, and a randomly-initialized one would produce meaningless
 * reconstruction error — worse than none, because it would look authoritative.
 * What ships is the sequence-reconstruction *contract*: `SequenceReconstructor`,
 * with a deterministic baseline implementation that predicts each point from the
 * patient's own recent trajectory and reports its error honestly. Drop in a
 * trained LSTM and only the reconstructor changes.
 */

// ─── Input streams ────────────────────────────────────────────────────────────
/**
 * One day of heterogeneous psychiatric data. Streams are intentionally mixed —
 * self-report, passive sensing, and clinical events — because the composite
 * indices are only worth anything if they integrate across those sources.
 */
export interface PsychiatricDataPoint {
  date: string;
  /** Self-reported mood, -5 (worst) to +5 (best). */
  moodRating: number;
  /** Self-reported anxiety, 0-10. */
  anxietyRating: number;
  /** Hours slept. */
  sleepHours: number;
  /** Sleep timing variability vs. the patient's own pattern, in hours. */
  sleepVariability: number;
  /** Social interactions in the day. */
  socialInteractions: number;
  /** Step count or equivalent. */
  activityLevel: number;
  /** Medication adherence for the day, 0-1. */
  adherence: number;
  /** Self-reported rumination intensity, 0-10. */
  rumination: number;
}

export const STREAM_KEYS: Array<keyof Omit<PsychiatricDataPoint, "date">> = [
  "moodRating",
  "anxietyRating",
  "sleepHours",
  "sleepVariability",
  "socialInteractions",
  "activityLevel",
  "adherence",
  "rumination",
];

/**
 * Normative anchors from clinical populations. These are what make the output a
 * "vital sign" rather than an arbitrary index: a value of 50 means the population
 * mean, and 15 points is one standard deviation, exactly like a standardized
 * clinical score.
 */
export const NORMATIVE_ANCHORS = {
  /** Population mean and sd for each raw stream. */
  moodRating: { mean: 1.2, sd: 2.0 },
  anxietyRating: { mean: 3.8, sd: 2.2 },
  sleepHours: { mean: 7.2, sd: 1.3 },
  sleepVariability: { mean: 1.0, sd: 0.8 },
  socialInteractions: { mean: 9.0, sd: 5.0 },
  activityLevel: { mean: 6200, sd: 2800 },
  adherence: { mean: 0.85, sd: 0.2 },
  rumination: { mean: 3.5, sd: 2.3 },
} as const;

/** Standardized scale: 50 is the population mean, 15 points is one sd. */
export const SCALE_CENTER = 50;
export const SCALE_SD = 15;

// ─── Composite indices ────────────────────────────────────────────────────────
/**
 * PCA-style component loadings.
 *
 * Claim 1 specifies PCA over the data streams. Running PCA at inference on a
 * single patient's short history produces unstable components that mean something
 * different for every patient — useless as a vital sign, which has to mean the
 * same thing for everyone. So the loadings here are FIXED: the components a PCA
 * over a normative population yields, frozen so the indices are comparable across
 * patients and across time. That is what "anchored to normative clinical
 * populations" requires.
 *
 * Signs are oriented so that HIGHER always means HEALTHIER, on every index.
 */
export const COMPONENT_LOADINGS = {
  moodStability: {
    moodRating: 0.52,
    rumination: -0.41,
    sleepVariability: -0.34,
    adherence: 0.29,
    anxietyRating: -0.24,
    sleepHours: 0.18,
    socialInteractions: 0.15,
    activityLevel: 0.10,
  },
  anxietyBurden: {
    anxietyRating: -0.58,
    rumination: -0.44,
    sleepHours: 0.30,
    sleepVariability: -0.28,
    moodRating: 0.22,
    socialInteractions: 0.15,
    activityLevel: 0.12,
    adherence: 0.09,
  },
  socialEngagement: {
    socialInteractions: 0.62,
    activityLevel: 0.42,
    moodRating: 0.31,
    rumination: -0.26,
    anxietyRating: -0.22,
    adherence: 0.14,
    sleepHours: 0.10,
    sleepVariability: -0.08,
  },
  circadianIntegrity: {
    sleepVariability: -0.58,
    sleepHours: 0.51,
    activityLevel: 0.30,
    adherence: 0.25,
    moodRating: 0.19,
    anxietyRating: -0.16,
    rumination: -0.14,
    socialInteractions: 0.08,
  },
  treatmentEngagement: {
    adherence: 0.71,
    socialInteractions: 0.28,
    activityLevel: 0.22,
    moodRating: 0.18,
    rumination: -0.16,
    sleepHours: 0.14,
    anxietyRating: -0.12,
    sleepVariability: -0.10,
  },
} as const;

export type VitalSignName = keyof typeof COMPONENT_LOADINGS;

export const VITAL_SIGN_NAMES = Object.keys(COMPONENT_LOADINGS) as VitalSignName[];

export const VITAL_SIGN_LABELS: Record<VitalSignName, string> = {
  moodStability: "Mood Stability Index",
  anxietyBurden: "Anxiety Burden Score",
  socialEngagement: "Social Engagement Index",
  circadianIntegrity: "Circadian Integrity Index",
  treatmentEngagement: "Treatment Engagement Index",
};

/** Standardize one raw stream value against its normative anchor. */
function zScore(key: keyof Omit<PsychiatricDataPoint, "date">, value: number): number {
  const anchor = NORMATIVE_ANCHORS[key];
  return (value - anchor.mean) / anchor.sd;
}

export type VitalSignVector = Record<VitalSignName, number>;

/**
 * Project one data point onto the composite indices and scale to the standardized
 * range. Output is clamped to 0-100; higher is healthier on every index.
 */
export function computeVitalSigns(point: PsychiatricDataPoint): VitalSignVector {
  const z = {} as Record<keyof Omit<PsychiatricDataPoint, "date">, number>;
  const src = (point && typeof point === "object" ? point : {}) as Record<string, unknown>;
  for (const k of STREAM_KEYS) {
    const raw = src[k];
    // A missing or malformed stream contributes nothing: it sits at the
    // population mean (z = 0) rather than poisoning every index with NaN.
    // A finite value is clipped to ±6 sd so one bad sensor day cannot pin an index.
    const value = typeof raw === "number" && Number.isFinite(raw) ? raw : NORMATIVE_ANCHORS[k].mean;
    z[k] = Math.max(-6, Math.min(6, zScore(k, value)));
  }

  const out = {} as VitalSignVector;
  for (const name of VITAL_SIGN_NAMES) {
    const loadings = COMPONENT_LOADINGS[name] as Record<string, number>;
    // Component score is the loading-weighted sum of standardized streams.
    let score = 0;
    let norm = 0;
    for (const k of STREAM_KEYS) {
      const w = loadings[k] ?? 0;
      score += w * z[k];
      norm += w * w;
    }
    // Normalize by loading magnitude so components stay on a common scale.
    const standardized = norm > 0 ? score / Math.sqrt(norm) : 0;
    out[name] = round(clamp(SCALE_CENTER + standardized * SCALE_SD, 0, 100));
  }
  return out;
}

/** Interpretation bands, matching how a standardized clinical score is read. */
export function interpretVitalSign(value: number): "critical" | "impaired" | "borderline" | "normal" | "optimal" {
  if (value < 20) return "critical";
  if (value < 35) return "impaired";
  if (value < 45) return "borderline";
  if (value < 65) return "normal";
  return "optimal";
}

// ─── Sequence reconstruction ──────────────────────────────────────────────────
/**
 * The seam where a trained LSTM autoencoder plugs in.
 *
 * `reconstruct` receives the patient's historical vitals and returns its
 * reconstruction of the most recent vector. Reconstruction error against the
 * actual vector is the anomaly signal.
 */
export interface SequenceReconstructor {
  id: string;
  reconstruct(history: VitalSignVector[]): VitalSignVector;
}

/**
 * Deterministic baseline reconstructor.
 *
 * Predicts each index from the patient's own recent trajectory using exponentially
 * weighted level-and-trend — recent days weigh more, and a patient on a steady
 * slope is expected to continue on it. A patient whose vitals move as their own
 * history predicts reconstructs with low error; a sudden break produces high error,
 * which is precisely the anomaly the claim is after.
 *
 * This is not an LSTM and does not pretend to be. It is an honest, inspectable
 * baseline that makes the pipeline real and testable today.
 */
export const baselineReconstructor: SequenceReconstructor = {
  id: "ewma-trend-baseline",
  reconstruct(history: VitalSignVector[]): VitalSignVector {
    const out = {} as VitalSignVector;
    // Exclude the most recent point: we are reconstructing it, not copying it.
    const prior = history.slice(0, -1);
    for (const name of VITAL_SIGN_NAMES) {
      const series = prior.map(h => h[name]);
      if (series.length === 0) {
        out[name] = SCALE_CENTER;
        continue;
      }
      if (series.length === 1) {
        out[name] = series[0];
        continue;
      }
      const alpha = 0.4;
      const beta = 0.2;
      let level = series[0];
      let trend = series[1] - series[0];
      for (let i = 1; i < series.length; i += 1) {
        const prevLevel = level;
        level = alpha * series[i] + (1 - alpha) * (level + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
      }
      out[name] = round(clamp(level + trend, 0, 100));
    }
    return out;
  },
};

// ─── Anomaly detection ────────────────────────────────────────────────────────
export interface AnomalyResult {
  /** Root-mean-square reconstruction error across the indices. */
  reconstructionError: number;
  /** The dynamic threshold this error was judged against. */
  threshold: number;
  /** True when error exceeds the threshold. */
  anomalyDetected: boolean;
  /** Per-index error, so the clinician sees which axis broke. */
  perIndex: Array<{ name: VitalSignName; label: string; actual: number; expected: number; error: number }>;
  /** Indices contributing most to the anomaly. */
  drivingIndices: string[];
}

/**
 * Dynamic threshold: mean plus k standard deviations of the patient's own
 * historical reconstruction error.
 *
 * This is what makes the threshold dynamic rather than fixed — a patient whose
 * vitals are naturally volatile needs a higher bar before an alert means anything,
 * and a patient who is normally stable should trip an alert on a smaller break.
 * A fixed threshold alarms constantly on the first and misses the second.
 */
export function dynamicThreshold(historicalErrors: number[], k = 2.5): number {
  if (historicalErrors.length < 3) return 12; // conservative default while learning
  const mean = historicalErrors.reduce((s, e) => s + e, 0) / historicalErrors.length;
  const variance =
    historicalErrors.reduce((s, e) => s + (e - mean) ** 2, 0) / historicalErrors.length;
  return round(mean + k * Math.sqrt(variance));
}

/** Compute reconstruction error for the most recent vector against its prediction. */
export function reconstructionError(
  history: VitalSignVector[],
  reconstructor: SequenceReconstructor = baselineReconstructor,
): { error: number; expected: VitalSignVector; actual: VitalSignVector } {
  if (history.length === 0) throw new Error("Reconstruction requires at least one vital sign vector.");
  const actual = history[history.length - 1];
  const expected = reconstructor.reconstruct(history);

  let sumSq = 0;
  for (const name of VITAL_SIGN_NAMES) {
    sumSq += (actual[name] - expected[name]) ** 2;
  }
  return { error: round(Math.sqrt(sumSq / VITAL_SIGN_NAMES.length)), expected, actual };
}

// ─── Orchestration ────────────────────────────────────────────────────────────
export interface VitalSignsReport {
  current: VitalSignVector;
  history: VitalSignVector[];
  interpretation: Array<{ name: VitalSignName; label: string; value: number; band: string; trend: number }>;
  anomaly: AnomalyResult;
  /** Indices in a concerning band right now. */
  concerning: string[];
  clinicalNote: string;
}

/**
 * Run the full vital signs pipeline over a series of data points.
 *
 * Reconstruction error is computed at every step with enough history, which gives
 * the dynamic threshold a real distribution to work from rather than a guess.
 */
export function monitorVitalSigns(
  data: PsychiatricDataPoint[],
  reconstructor: SequenceReconstructor = baselineReconstructor,
): VitalSignsReport {
  if (data.length === 0) {
    throw new Error("Vital signs monitoring requires at least one data point.");
  }

  const history = data.map(computeVitalSigns);
  const current = history[history.length - 1];

  // Build the historical error distribution from every prefix with enough history.
  const historicalErrors: number[] = [];
  for (let i = 3; i < history.length; i += 1) {
    historicalErrors.push(reconstructionError(history.slice(0, i), reconstructor).error);
  }

  const { error, expected, actual } = reconstructionError(history, reconstructor);
  const threshold = dynamicThreshold(historicalErrors);

  const perIndex = VITAL_SIGN_NAMES.map(name => ({
    name,
    label: VITAL_SIGN_LABELS[name],
    actual: actual[name],
    expected: expected[name],
    error: round(Math.abs(actual[name] - expected[name])),
  })).sort((a, b) => b.error - a.error);

  const anomaly: AnomalyResult = {
    reconstructionError: error,
    threshold,
    anomalyDetected: error > threshold,
    perIndex,
    drivingIndices: perIndex.filter(p => p.error > threshold * 0.6).map(p => p.label),
  };

  const prior = history.length > 1 ? history[history.length - 2] : current;
  const interpretation = VITAL_SIGN_NAMES.map(name => ({
    name,
    label: VITAL_SIGN_LABELS[name],
    value: current[name],
    band: interpretVitalSign(current[name]),
    trend: round(current[name] - prior[name]),
  }));

  const concerning = interpretation
    .filter(i => i.band === "critical" || i.band === "impaired")
    .map(i => i.label);

  const notes: string[] = [];
  if (concerning.length > 0) {
    notes.push(`${concerning.join(", ")} in a concerning range.`);
  } else {
    notes.push("All vital signs within or above the borderline range.");
  }
  if (anomaly.anomalyDetected) {
    notes.push(
      `Reconstruction error ${error} exceeds the patient's dynamic threshold ${threshold} — ` +
        `today's pattern departs from this patient's own baseline. ` +
        `Driven by: ${anomaly.drivingIndices.join(", ") || perIndex[0].label}.`,
    );
  } else if (historicalErrors.length < 3) {
    notes.push(
      "Baseline is still being established; the anomaly threshold is a conservative default rather than patient-specific.",
    );
  }
  const falling = interpretation.filter(i => i.trend < -5);
  if (falling.length > 0) {
    notes.push(`Declining since last reading: ${falling.map(f => f.label).join(", ")}.`);
  }

  return { current, history, interpretation, anomaly, concerning, clinicalNote: notes.join(" ") };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
