/**
 * DOCTOR BUDDY — Psychiatric Risk Scoring with Conformal Prediction
 * Patent 04: "Ensemble Gradient-Boosted Psychiatric Risk Scoring with Conformal
 * Prediction and Drift Detection"
 *
 * Implements the system of claim 1:
 *
 *   - ingestion of continuous patient telemetry;
 *   - an ensemble of gradient-boosted survival models producing a continuous risk
 *     score that predicts time-to-event for an acute psychiatric crisis;
 *   - a conformal prediction algorithm over that ensemble producing a prediction
 *     interval with guaranteed coverage, independent of the data distribution;
 *   - CUSUM drift detection on the telemetry producing a covariate shift metric;
 *   - automatic triggering of a retraining protocol when shift exceeds threshold;
 *   - output of the score and its interval to a clinical dashboard.
 *
 * WHY CONFORMAL PREDICTION MATTERS HERE. A bare probability ("68% risk") invites a
 * clinician to trust a number the model cannot actually justify. A conformal
 * interval is a distribution-free guarantee: at 90% confidence, the true value
 * falls in the returned interval at least 90% of the time, whatever the underlying
 * distribution. A wide interval is the model saying "I do not know" — which is
 * information a clinician can act on, and a point estimate can never convey.
 *
 * The trained boosted ensemble of claim 1 requires a fitted model this engine does
 * not ship. What it ships instead is the full inference-time apparatus — ensemble
 * aggregation, split-conformal calibration, and CUSUM drift — operating over
 * pluggable base learners. `RiskModel` is the seam: drop in trained predictors and
 * nothing downstream changes.
 */

// ─── Feature vector ───────────────────────────────────────────────────────────
/** One observation of patient telemetry. */
export interface RiskFeatures {
  /** Days since the patient's last clinical contact. */
  daysSinceContact: number;
  /** Deviation from the patient's own sleep baseline, in hours (negative = less). */
  sleepDelta: number;
  /** Social interaction count relative to baseline, as a ratio. */
  socialRatio: number;
  /** Medication adherence over the trailing window, 0-1. */
  adherence: number;
  /** Prior psychiatric hospitalizations. */
  priorHospitalizations: number;
  /** Most recent automated C-SSRS level, 0-5. */
  cssrsLevel: number;
  /** Substance use days in the trailing 30. */
  substanceUseDays: number;
  /** Self-reported symptom severity, 0-100. */
  symptomSeverity: number;
}

export const FEATURE_KEYS: Array<keyof RiskFeatures> = [
  "daysSinceContact",
  "sleepDelta",
  "socialRatio",
  "adherence",
  "priorHospitalizations",
  "cssrsLevel",
  "substanceUseDays",
  "symptomSeverity",
];

// ─── Base learners ────────────────────────────────────────────────────────────
/**
 * A single model in the ensemble. Returns predicted days until an acute crisis
 * event — the time-to-event quantity claim 1 specifies. Lower means sooner.
 */
export interface RiskModel {
  id: string;
  predict(features: RiskFeatures): number;
}

/**
 * Reference base learners standing in for boosted survival trees.
 *
 * Each is a shallow additive model over a different feature emphasis, which is
 * what gives the ensemble its spread: when the learners disagree, the conformal
 * interval widens, and that disagreement is exactly the signal a clinician needs.
 * Replace these with trained predictors and the rest of the file is unchanged.
 */
export const REFERENCE_MODELS: RiskModel[] = [
  {
    id: "clinical-history",
    predict: f =>
      baseHorizon
      - f.priorHospitalizations * 12
      - f.cssrsLevel * 14
      - Math.max(0, f.daysSinceContact - 30) * 0.4,
  },
  {
    id: "behavioral-telemetry",
    predict: f =>
      baseHorizon
      - Math.max(0, -f.sleepDelta) * 9
      - Math.max(0, 1 - f.socialRatio) * 40
      - f.substanceUseDays * 1.6,
  },
  {
    id: "treatment-engagement",
    predict: f =>
      baseHorizon
      - (1 - f.adherence) * 55
      - Math.max(0, f.daysSinceContact - 14) * 0.7
      - f.cssrsLevel * 8,
  },
  {
    id: "symptom-burden",
    predict: f =>
      baseHorizon
      - (f.symptomSeverity / 100) * 60
      - f.cssrsLevel * 10
      - Math.max(0, -f.sleepDelta) * 5,
  },
];

/** Horizon in days against which shortening is measured. */
const baseHorizon = 120;

// ─── Ensemble ─────────────────────────────────────────────────────────────────
export interface EnsemblePrediction {
  /** Mean predicted days-to-event across the ensemble. */
  daysToEvent: number;
  /** Per-model predictions, so disagreement is inspectable. */
  perModel: Array<{ id: string; daysToEvent: number }>;
  /** Spread across the ensemble — the raw disagreement signal. */
  ensembleSd: number;
  /** Continuous risk score 0-100, derived from time-to-event. */
  riskScore: number;
}

/**
 * Convert predicted days-to-event into a 0-100 risk score.
 *
 * Uses exponential decay so the scale is meaningful where it matters: the
 * difference between 7 and 14 days moves the score far more than the difference
 * between 90 and 120, which matches how urgency actually behaves.
 */
export function daysToRiskScore(days: number): number {
  const clamped = Math.max(0, days);
  return round(100 * Math.exp(-clamped / 45));
}

/** Neutral values for a feature that is missing or not a finite number. */
const FEATURE_FALLBACK: RiskFeatures = {
  daysSinceContact: 14,
  sleepDelta: 0,
  socialRatio: 1,
  adherence: 0.9,
  priorHospitalizations: 0,
  cssrsLevel: 0,
  substanceUseDays: 0,
  symptomSeverity: 30,
};

const FEATURE_RANGE: Record<keyof RiskFeatures, [number, number]> = {
  daysSinceContact: [0, 3650],
  sleepDelta: [-24, 24],
  socialRatio: [0, 100],
  adherence: [0, 1],
  priorHospitalizations: [0, 1000],
  cssrsLevel: [0, 5],
  substanceUseDays: [0, 30],
  symptomSeverity: [0, 100],
};

/**
 * A feature vector the models can trust: every field a finite number in its
 * range, missing or malformed ones at their neutral value. Nothing that reaches
 * a model from a form, a database row, or a fuzzer can make it emit NaN.
 */
export function sanitizeFeatures(features: Partial<RiskFeatures> | null | undefined): RiskFeatures {
  const out = { ...FEATURE_FALLBACK };
  const src = (features && typeof features === "object" ? features : {}) as Record<string, unknown>;
  for (const key of FEATURE_KEYS) {
    const v = src[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      const [lo, hi] = FEATURE_RANGE[key];
      out[key] = Math.max(lo, Math.min(hi, v));
    }
  }
  return out;
}

export function predictEnsemble(
  features: RiskFeatures,
  models: RiskModel[] = REFERENCE_MODELS,
): EnsemblePrediction {
  if (models.length === 0) throw new Error("Risk ensemble requires at least one model.");
  const safe = sanitizeFeatures(features);

  const perModel = models.map(m => {
    const raw = m.predict(safe);
    // A model that cannot answer says "the base horizon", never NaN.
    return { id: m.id, daysToEvent: round(Math.max(0, Number.isFinite(raw) ? raw : baseHorizon)) };
  });
  const values = perModel.map(p => p.daysToEvent);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;

  return {
    daysToEvent: round(mean),
    perModel,
    ensembleSd: round(Math.sqrt(variance)),
    riskScore: daysToRiskScore(mean),
  };
}

// ─── Conformal prediction ─────────────────────────────────────────────────────
/** A calibration example: features plus the observed days-to-event. */
export interface CalibrationExample {
  features: RiskFeatures;
  observedDaysToEvent: number;
}

export interface ConformalInterval {
  /** Point estimate, in days. */
  daysToEvent: number;
  lowerDays: number;
  upperDays: number;
  /** The same interval expressed on the 0-100 risk scale. */
  riskScore: number;
  riskLower: number;
  riskUpper: number;
  /** Requested coverage, e.g. 0.9. */
  coverage: number;
  /** The conformal quantile used, in days. */
  quantile: number;
  /** Calibration set size — small sets cannot support tight guarantees. */
  calibrationSize: number;
  /** True when the interval is too wide to act on without more information. */
  tooUncertainToAct: boolean;
}

/**
 * Split-conformal prediction.
 *
 * Nonconformity is absolute residual on a held-out calibration set. The interval
 * is the point prediction plus or minus the ceil((n+1)(1-alpha))/n empirical
 * quantile of those residuals. That finite-sample correction is what makes the
 * coverage guarantee hold without assuming anything about the distribution — the
 * property claim 1 requires.
 */
export function conformalInterval(
  features: RiskFeatures,
  calibration: CalibrationExample[],
  coverage = 0.9,
  models: RiskModel[] = REFERENCE_MODELS,
): ConformalInterval {
  // An impossible coverage request gets the documented default rather than an
  // exception in the middle of a clinical page.
  if (!(Number.isFinite(coverage) && coverage > 0 && coverage < 1)) coverage = 0.9;

  const prediction = predictEnsemble(features, models);

  // Nonconformity scores on the calibration set. Examples without a finite
  // observed outcome carry no information and are dropped.
  const residuals = (Array.isArray(calibration) ? calibration : [])
    .filter(ex => ex && typeof ex === "object" && Number.isFinite(ex.observedDaysToEvent))
    .map(ex => Math.abs(predictEnsemble(ex.features, models).daysToEvent - ex.observedDaysToEvent))
    .sort((a, b) => a - b);

  const n = residuals.length;
  let quantile: number;
  if (n === 0) {
    // No calibration data: fall back to ensemble spread and say so through the
    // width. Never return a tight interval we cannot justify.
    quantile = Math.max(20, prediction.ensembleSd * 3);
  } else {
    const rank = Math.ceil((n + 1) * coverage);
    // When rank exceeds n the guarantee cannot be met at this coverage; use the
    // widest residual, which is the most conservative honest answer.
    quantile = residuals[Math.min(rank, n) - 1];
  }

  const lowerDays = Math.max(0, prediction.daysToEvent - quantile);
  const upperDays = prediction.daysToEvent + quantile;

  // Risk scale inverts: fewer days means higher risk.
  const riskUpper = daysToRiskScore(lowerDays);
  const riskLower = daysToRiskScore(upperDays);

  return {
    daysToEvent: prediction.daysToEvent,
    lowerDays: round(lowerDays),
    upperDays: round(upperDays),
    riskScore: prediction.riskScore,
    riskLower: round(riskLower),
    riskUpper: round(riskUpper),
    coverage,
    quantile: round(quantile),
    calibrationSize: n,
    // A band spanning more than half the scale is not decision-grade.
    tooUncertainToAct: riskUpper - riskLower > 50,
  };
}

// ─── CUSUM drift detection ────────────────────────────────────────────────────
export interface DriftResult {
  /** Per-feature CUSUM statistics. */
  perFeature: Array<{ feature: keyof RiskFeatures; cusum: number; drifted: boolean }>;
  /** Covariate shift metric — the largest standardized CUSUM across features. */
  covariateShift: number;
  /** True once shift exceeds the threshold. */
  retrainingTriggered: boolean;
  /** Features responsible, for the retraining ticket. */
  driftedFeatures: string[];
  message: string;
}

/** Shift above which claim 1's automatic retraining protocol fires. */
export const DRIFT_THRESHOLD = 5.0;

/**
 * Two-sided CUSUM over incoming telemetry against the training distribution.
 *
 * CUSUM accumulates small standardized deviations, so it catches slow covariate
 * drift that a per-observation test never would — a population gradually getting
 * sicker, or a sensor slowly miscalibrating. `slack` (k) is the allowance below
 * which deviations are treated as noise.
 */
export function detectDrift(
  observations: RiskFeatures[],
  trainingMean: RiskFeatures,
  trainingSd: RiskFeatures,
  slack = 0.5,
): DriftResult {
  const perFeature = FEATURE_KEYS.map(feature => {
    const sd = Math.abs(trainingSd[feature]) < 1e-9 ? 1 : trainingSd[feature];
    let high = 0;
    let low = 0;
    for (const obs of observations) {
      const z = (obs[feature] - trainingMean[feature]) / sd;
      high = Math.max(0, high + z - slack);
      low = Math.max(0, low - z - slack);
    }
    const cusum = Math.max(high, low);
    return { feature, cusum: round(cusum), drifted: cusum > DRIFT_THRESHOLD };
  });

  const covariateShift = perFeature.reduce((max, f) => Math.max(max, f.cusum), 0);
  const driftedFeatures = perFeature.filter(f => f.drifted).map(f => String(f.feature));
  const retrainingTriggered = covariateShift > DRIFT_THRESHOLD;

  return {
    perFeature,
    covariateShift: round(covariateShift),
    retrainingTriggered,
    driftedFeatures,
    message: retrainingTriggered
      ? `Covariate shift ${round(covariateShift)} exceeds threshold ${DRIFT_THRESHOLD}. Retraining protocol triggered. ` +
        `Drifted features: ${driftedFeatures.join(", ")}. Until retrained, widen intervals and treat scores as provisional.`
      : `Covariate shift ${round(covariateShift)} within tolerance. No retraining indicated.`,
  };
}

// ─── Dashboard output ─────────────────────────────────────────────────────────
export interface RiskAssessment {
  interval: ConformalInterval;
  ensemble: EnsemblePrediction;
  drift: DriftResult | null;
  /** Feature contributions, so the clinician sees what drove the score. */
  drivers: Array<{ feature: string; contribution: number; direction: "raises" | "lowers" }>;
  band: "low" | "moderate" | "high" | "severe";
  clinicalNote: string;
}

/**
 * Attribute the score to features by leave-one-out: re-predict with each feature
 * reset to its population-typical value and measure how far the score moves.
 * Model-agnostic, so it keeps working when the reference learners are replaced.
 */
function computeDrivers(
  features: RiskFeatures,
  models: RiskModel[],
): RiskAssessment["drivers"] {
  const baseline = predictEnsemble(features, models).riskScore;
  const neutral: RiskFeatures = {
    daysSinceContact: 14,
    sleepDelta: 0,
    socialRatio: 1,
    adherence: 0.9,
    priorHospitalizations: 0,
    cssrsLevel: 0,
    substanceUseDays: 0,
    symptomSeverity: 30,
  };

  return FEATURE_KEYS.map(key => {
    const counterfactual = { ...features, [key]: neutral[key] };
    const without = predictEnsemble(counterfactual, models).riskScore;
    const contribution = round(baseline - without);
    return {
      feature: String(key),
      contribution: Math.abs(contribution),
      direction: (contribution >= 0 ? "raises" : "lowers") as "raises" | "lowers",
    };
  })
    .filter(d => d.contribution > 0.5)
    .sort((a, b) => b.contribution - a.contribution);
}

export function assessRisk(
  features: RiskFeatures,
  calibration: CalibrationExample[] = [],
  options: {
    coverage?: number;
    models?: RiskModel[];
    driftObservations?: RiskFeatures[];
    trainingMean?: RiskFeatures;
    trainingSd?: RiskFeatures;
  } = {},
): RiskAssessment {
  const models = options.models ?? REFERENCE_MODELS;
  features = sanitizeFeatures(features);
  const interval = conformalInterval(features, calibration, options.coverage ?? 0.9, models);
  const ensemble = predictEnsemble(features, models);

  const drift =
    options.driftObservations && options.trainingMean && options.trainingSd
      ? detectDrift(options.driftObservations, options.trainingMean, options.trainingSd)
      : null;

  const band: RiskAssessment["band"] =
    interval.riskScore >= 75 ? "severe" : interval.riskScore >= 50 ? "high" : interval.riskScore >= 25 ? "moderate" : "low";

  const drivers = computeDrivers(features, models);

  const notes: string[] = [
    `Risk ${Math.round(interval.riskScore)}/100 (${band}); predicted time to acute event ` +
      `${Math.round(interval.daysToEvent)} days, ${Math.round(interval.coverage * 100)}% conformal interval ` +
      `${Math.round(interval.lowerDays)}-${Math.round(interval.upperDays)} days.`,
  ];
  if (interval.calibrationSize === 0) {
    notes.push(
      "No calibration data supplied — the interval is a conservative fallback from ensemble spread, not a coverage guarantee. Treat the score as indicative only.",
    );
  } else if (interval.calibrationSize < 20) {
    notes.push(
      `Calibration set is small (${interval.calibrationSize}); the coverage guarantee is weak at this size.`,
    );
  }
  if (interval.tooUncertainToAct) {
    notes.push("Interval spans more than half the scale. The model does not have enough signal here — rely on clinical assessment.");
  }
  if (drivers.length > 0) {
    notes.push(`Largest driver: ${drivers[0].feature} (${drivers[0].direction} risk).`);
  }
  if (drift?.retrainingTriggered) {
    notes.push(drift.message);
  }

  return { interval, ensemble, drift, drivers, band, clinicalNote: notes.join(" ") };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
