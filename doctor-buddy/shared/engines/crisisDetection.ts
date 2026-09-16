/**
 * DOCTOR BUDDY — Predictive Psychiatric Crisis Detection & Escalation
 * Patent 09: "Predictive Psychiatric Crisis Detection and Escalation System with
 * Multimodal Signal Fusion"
 *
 * Implements the system of claim 1:
 *
 *   - a multimodal input interface taking text streams and behavioral telemetry,
 *     where telemetry includes temporal app-usage patterns indicating severe
 *     sleep disturbance;
 *   - a fusion engine producing a continuous crisis risk score;
 *   - an automated Columbia-Suicide Severity Rating Scale (C-SSRS) module over
 *     the text streams;
 *   - time-series forecasting of the risk trajectory;
 *   - identification of a future temporal crisis window when the forecast crosses
 *     a crisis threshold;
 *   - an escalation cascade with at least four distinct intervention levels,
 *     including automated dispatch to an emergency lifeline service.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SAFETY POSITION — read before changing anything in this file.
 *
 * This engine supports a clinician. It does not replace one, and it must never be
 * the only thing standing between a patient and help.
 *
 * Claim 1 describes "automated dispatch to an emergency lifeline service". This
 * implementation deliberately does NOT place calls or dispatch responders on its
 * own. At the highest level it raises an immediate, unmissable alert to the
 * responsible clinician and surfaces the lifeline for a human to act on. Automated
 * dispatch on an algorithmic score can send police to a patient's home and is a
 * decision with real physical risk — it belongs to a person, not a function.
 *
 * `requiresHumanConfirmation` is set on the levels where that matters, and the UI
 * is expected to honor it. If a deployment later adds true auto-dispatch, it needs
 * clinical governance, an audit trail, and a licensed human in the loop — not a
 * change to this constant.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Lifeline ─────────────────────────────────────────────────────────────────
/** US 988 Suicide & Crisis Lifeline. Surfaced to humans, never auto-dialed here. */
export const CRISIS_LIFELINE = {
  name: "988 Suicide & Crisis Lifeline",
  phone: "988",
  text: "Text 988",
  url: "https://988lifeline.org",
  available: "24/7",
} as const;

// ─── C-SSRS ───────────────────────────────────────────────────────────────────
/**
 * Columbia-Suicide Severity Rating Scale ideation severity, 1-5. Levels 4 and 5
 * (active ideation with intent, and with a specific plan) are the ones that drive
 * urgent action in standard practice.
 */
export type CSSRSLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const CSSRS_DESCRIPTIONS: Record<CSSRSLevel, string> = {
  0: "No ideation reported",
  1: "Wish to be dead",
  2: "Nonspecific active suicidal thoughts",
  3: "Active ideation, any methods considered, without intent to act",
  4: "Active ideation with some intent to act, without specific plan",
  5: "Active ideation with specific plan and intent",
};

/**
 * Lexical markers for automated C-SSRS screening of free text.
 *
 * This is a transparent, auditable screen — deliberately not a black-box
 * classifier. It is tuned to over-refer rather than under-refer: in this domain a
 * false positive costs a conversation, and a false negative can cost a life.
 * Every hit is surfaced with the phrase that triggered it so a clinician can
 * immediately see why, and dismiss it if the context is benign.
 */
const CSSRS_MARKERS: Array<{ level: CSSRSLevel; patterns: RegExp[]; label: string }> = [
  {
    level: 5,
    label: "Active ideation with plan and intent",
    patterns: [
      /\bi (have|'ve got|got) a plan\b/i,
      /\b(going to (kill|end) (myself|my life))\b/i,
      /\b(tonight|tomorrow|this weekend).{0,30}\b(end it|kill myself|not be here)\b/i,
      /\b(wrote|writing|written) (a )?(suicide )?note\b/i,
      /\b(saved up|stockpil\w+|bought).{0,25}\b(pills|rounds|ammunition)\b/i,
    ],
  },
  {
    level: 4,
    // C-SSRS level 4 is active ideation with INTENT TO ACT. A wish to die
    // ("I want to die") is level 2 — it is active ideation without intent, and
    // labelling it 4 inflates every downstream urgency signal.
    label: "Active ideation with intent",
    patterns: [
      /\bi (intend|plan) to (die|kill myself|end my life)\b/i,
      /\bi('m| am) going to (die|do it)\b/i,
      /\bready to (die|end it)\b/i,
    ],
  },
  {
    level: 3,
    label: "Active ideation, methods considered",
    patterns: [
      /\b(thought about|thinking about|considered) (how|ways) (to )?(die|kill myself|end)\b/i,
      /\b(researching|looked up).{0,20}\b(overdose|lethal|methods)\b/i,
    ],
  },
  {
    level: 2,
    label: "Nonspecific active suicidal thoughts",
    patterns: [
      /\b(want to die|wish i (was|were) dead|kill myself)\b/i,
      /\b(suicidal)\b/i,
    ],
  },
  {
    level: 1,
    label: "Wish to be dead",
    patterns: [
      /\b(better off (dead|without me))\b/i,
      /\b(don'?t want to (be here|wake up|live)( anymore)?)\b/i,
      /\b(tired of (living|being alive))\b/i,
      /\b(no (point|reason) (in )?(living|going on))\b/i,
    ],
  },
];

/** Protective factors, which lower urgency but never zero it out. */
const PROTECTIVE_MARKERS: RegExp[] = [
  /\b(my (kids|children|family|dog|cat) need me)\b/i,
  /\b(i would never (actually|really) (do it|act on))\b/i,
  /\b(called|calling) (my )?(therapist|doctor|sponsor|the hotline)\b/i,
  /\b(safety plan)\b/i,
];

export interface CSSRSAssessment {
  level: CSSRSLevel;
  description: string;
  /** The exact phrases that triggered each hit, so a clinician can audit it. */
  triggers: Array<{ level: CSSRSLevel; label: string; phrase: string }>;
  protectiveFactors: string[];
  /** True when the screen cannot be trusted alone — always true at level >= 1. */
  requiresClinicianReview: boolean;
}

/**
 * Automated C-SSRS module over a text stream.
 *
 * Returns the HIGHEST matched level. It never averages: someone who mentions a
 * plan once and is otherwise calm is a level 5, not a level 2.
 */
export function assessCSSRS(input: string): CSSRSAssessment {
  // Anything that is not a string carries no language to screen. Do not
  // stringify objects: a record with an own "toString" field would throw.
  const text = typeof input === "string" ? input : "";
  const triggers: CSSRSAssessment["triggers"] = [];
  let highest: CSSRSLevel = 0;

  for (const marker of CSSRS_MARKERS) {
    for (const pattern of marker.patterns) {
      const match = text.match(pattern);
      if (match) {
        triggers.push({ level: marker.level, label: marker.label, phrase: match[0] });
        if (marker.level > highest) highest = marker.level;
      }
    }
  }

  const protectiveFactors: string[] = [];
  for (const p of PROTECTIVE_MARKERS) {
    const m = text.match(p);
    if (m) protectiveFactors.push(m[0]);
  }

  return {
    level: highest,
    description: CSSRS_DESCRIPTIONS[highest],
    triggers,
    protectiveFactors,
    requiresClinicianReview: highest >= 1,
  };
}

// ─── Behavioral telemetry ─────────────────────────────────────────────────────
/**
 * Behavioral telemetry for one day. `nightUsageMinutes` is the app-usage signal
 * claim 1 calls out: sustained overnight activity is a proxy for severe sleep
 * disturbance, which is among the more reliable near-term crisis precursors.
 */
export interface DailyTelemetry {
  date: string;
  /** Minutes of app usage between 00:00 and 05:00 — the sleep-disturbance proxy. */
  nightUsageMinutes: number;
  /** Self-reported or device-estimated sleep, in hours. */
  sleepHours: number;
  /** Outbound messages, calls — a social withdrawal proxy when it collapses. */
  socialInteractions: number;
  /** Step count or equivalent; psychomotor retardation shows up here. */
  activityLevel: number;
  /** Optional free text from journaling or messaging, for the C-SSRS module. */
  text?: string;
}

export interface CrisisRiskPoint {
  date: string;
  /** Continuous crisis risk score, 0-100. */
  score: number;
  components: {
    cssrs: number;
    sleepDisturbance: number;
    socialWithdrawal: number;
    activityChange: number;
  };
  cssrsLevel: CSSRSLevel;
}

/** Baseline the patient is compared against — their own history, not a population. */
export interface PatientBaseline {
  meanSleepHours: number;
  meanSocialInteractions: number;
  meanActivityLevel: number;
}

/**
 * Fusion engine: combine C-SSRS, sleep disturbance, social withdrawal and activity
 * change into one continuous score.
 *
 * C-SSRS dominates by design. A level 4 or 5 produces a high score regardless of
 * how good the behavioral signals look, because a patient can sleep and exercise
 * normally right up until they act — the behavioral channels add sensitivity for
 * patients who are not disclosing, but they can never mask disclosure.
 */
/** A finite, non-negative reading, or the fallback. */
function reading(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : fallback;
}

/** Telemetry with every number finite, so no day can poison the trajectory. */
function cleanDay(day: DailyTelemetry, baseline: PatientBaseline): DailyTelemetry {
  const d = (day && typeof day === "object" ? day : {}) as Partial<DailyTelemetry>;
  return {
    date: typeof d.date === "string" ? d.date : "",
    nightUsageMinutes: reading(d.nightUsageMinutes, 0),
    sleepHours: reading(d.sleepHours, baseline.meanSleepHours),
    socialInteractions: reading(d.socialInteractions, baseline.meanSocialInteractions),
    activityLevel: reading(d.activityLevel, baseline.meanActivityLevel),
    text: typeof d.text === "string" ? d.text : undefined,
  };
}

export function fuseRiskScore(rawDay: DailyTelemetry, rawBaseline: PatientBaseline): CrisisRiskPoint {
  const baseline = cleanBaseline(rawBaseline);
  const day = cleanDay(rawDay, baseline);
  const cssrs = day.text ? assessCSSRS(day.text) : { level: 0 as CSSRSLevel };

  // C-SSRS contribution. Calibrated so that levels 4 and 5 clear CRISIS_THRESHOLD
  // on their own: a patient who states intent or a plan is in crisis even if they
  // slept well, exercised, and answered their messages. Behavioral channels add
  // sensitivity for patients who are not disclosing — they must never be able to
  // drag a disclosure back below the threshold.
  const cssrsScore = [0, 8, 20, 45, 72, 88][cssrs.level];

  // Sleep disturbance, 0-15. Night usage and short sleep both count.
  const nightPenalty = Math.min(1, day.nightUsageMinutes / 120);
  const sleepDeficit = Math.max(0, baseline.meanSleepHours - day.sleepHours) / Math.max(1, baseline.meanSleepHours);
  const sleepDisturbance = Math.min(15, (nightPenalty * 0.6 + Math.min(1, sleepDeficit) * 0.4) * 15);

  // Social withdrawal, 0-15, relative to the patient's own baseline.
  const socialDrop = baseline.meanSocialInteractions > 0
    ? Math.max(0, 1 - day.socialInteractions / baseline.meanSocialInteractions)
    : 0;
  const socialWithdrawal = Math.min(15, socialDrop * 15);

  // Activity change, 0-10.
  const activityDrop = baseline.meanActivityLevel > 0
    ? Math.max(0, 1 - day.activityLevel / baseline.meanActivityLevel)
    : 0;
  const activityChange = Math.min(10, activityDrop * 10);

  const score = Math.min(100, cssrsScore + sleepDisturbance + socialWithdrawal + activityChange);

  return {
    date: day.date,
    score: round(score),
    components: {
      cssrs: round(cssrsScore),
      sleepDisturbance: round(sleepDisturbance),
      socialWithdrawal: round(socialWithdrawal),
      activityChange: round(activityChange),
    },
    cssrsLevel: cssrs.level,
  };
}

// ─── Trajectory forecasting ───────────────────────────────────────────────────
/** Score above which a forecast point counts as a predicted crisis. */
export const CRISIS_THRESHOLD = 65;

export interface ForecastPoint {
  dayOffset: number;
  predictedScore: number;
  /** Widening band — forecast confidence decays with horizon. */
  lower: number;
  upper: number;
  exceedsThreshold: boolean;
}

export interface CrisisWindow {
  /** Days from now when the trajectory is first predicted to cross. */
  startsInDays: number;
  endsInDays: number;
  peakScore: number;
  confidence: number;
}

/**
 * Forecast the risk trajectory.
 *
 * Uses double exponential smoothing (Holt's linear trend) over the recent score
 * history: level plus trend, so a patient whose score is climbing steadily is
 * projected to keep climbing. Prediction bands widen with the square root of the
 * horizon, which keeps day-7 predictions from being read with day-1 confidence.
 */
export function forecastTrajectory(history: CrisisRiskPoint[], horizonDays = 7): ForecastPoint[] {
  if (history.length === 0) return [];
  if (history.length === 1) {
    return Array.from({ length: horizonDays }, (_, i) => ({
      dayOffset: i + 1,
      predictedScore: round(history[0].score),
      lower: round(Math.max(0, history[0].score - 15)),
      upper: round(Math.min(100, history[0].score + 15)),
      exceedsThreshold: history[0].score >= CRISIS_THRESHOLD,
    }));
  }

  const alpha = 0.5; // level smoothing
  const beta = 0.3; // trend smoothing

  let level = history[0].score;
  let trend = history[1].score - history[0].score;
  const residuals: number[] = [];

  for (let i = 1; i < history.length; i += 1) {
    const forecast = level + trend;
    residuals.push(history[i].score - forecast);
    const prevLevel = level;
    level = alpha * history[i].score + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // Residual spread drives the band width.
  const sigma =
    residuals.length > 1
      ? Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length)
      : 8;

  return Array.from({ length: horizonDays }, (_, i) => {
    const h = i + 1;
    const predicted = clamp(level + trend * h, 0, 100);
    const band = sigma * Math.sqrt(h) * 1.28; // ~80% interval
    return {
      dayOffset: h,
      predictedScore: round(predicted),
      lower: round(clamp(predicted - band, 0, 100)),
      upper: round(clamp(predicted + band, 0, 100)),
      exceedsThreshold: predicted >= CRISIS_THRESHOLD,
    };
  });
}

/**
 * Identify the future temporal crisis window — the contiguous run of forecast days
 * predicted to sit above the crisis threshold.
 */
export function identifyCrisisWindow(forecast: ForecastPoint[]): CrisisWindow | null {
  const first = forecast.findIndex(f => f.exceedsThreshold);
  if (first === -1) return null;

  let last = first;
  while (last + 1 < forecast.length && forecast[last + 1].exceedsThreshold) last += 1;

  const inWindow = forecast.slice(first, last + 1);
  const peak = Math.max(...inWindow.map(f => f.predictedScore));

  // Confidence: how far the lower bound sits above the threshold. A window whose
  // lower band is still under the threshold is a maybe, and should read as one.
  const lowerMargin = Math.min(...inWindow.map(f => f.lower)) - CRISIS_THRESHOLD;
  const confidence = clamp(0.5 + lowerMargin / 40, 0.05, 0.95);

  return {
    startsInDays: forecast[first].dayOffset,
    endsInDays: forecast[last].dayOffset,
    peakScore: round(peak),
    confidence: round(confidence),
  };
}

// ─── Escalation cascade ───────────────────────────────────────────────────────
export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

export interface EscalationAction {
  level: EscalationLevel;
  label: string;
  /** What the system does on its own. */
  automatedActions: string[];
  /** What it asks a human to do. */
  clinicianActions: string[];
  /**
   * True when no automated step may proceed without a clinician confirming.
   * The UI must honor this — see the safety note at the top of this file.
   */
  requiresHumanConfirmation: boolean;
  /** Surfaced to the clinician, and to the patient where appropriate. */
  lifeline: typeof CRISIS_LIFELINE | null;
  /** How quickly a human needs to be looking at this. */
  responseTarget: string;
}

/**
 * Five graduated levels — claim 1 requires at least four. Level 4 is the one that
 * surfaces the lifeline for immediate human action.
 */
export function escalationFor(
  currentScore: number,
  cssrsLevel: CSSRSLevel,
  window: CrisisWindow | null,
): EscalationAction {
  // C-SSRS 4-5 goes straight to the top regardless of the composite score.
  const imminent = cssrsLevel >= 4 || currentScore >= 85;
  const acute = cssrsLevel === 3 || currentScore >= CRISIS_THRESHOLD;
  const elevated =
    cssrsLevel === 2 ||
    currentScore >= 45 ||
    (window !== null && window.startsInDays <= 3) ||
    // Any ideation alongside marked behavioral deterioration. Passive ideation in
    // an otherwise-well patient is a watch; the same words from a patient who has
    // stopped sleeping, stopped moving and stopped talking to anyone is not. The
    // combination is what carries the signal, and neither term reaches this bar
    // on its own.
    (cssrsLevel >= 1 && currentScore >= 35);
  const watch = cssrsLevel === 1 || currentScore >= 25 || window !== null;

  if (imminent) {
    return {
      level: 4,
      label: "Imminent risk — immediate human response required",
      automatedActions: [
        "Page the responsible clinician now, and continue paging until acknowledged",
        "Surface the 988 Lifeline to the patient in-app with one-tap connect",
        "Assemble the chart summary, recent C-SSRS triggers, and risk trajectory for the responding clinician",
        "Lock the record to preserve the audit trail",
      ],
      clinicianActions: [
        "Contact the patient directly now",
        "Complete a full C-SSRS interview and safety assessment",
        "Determine level of care; arrange transport or emergency services if indicated",
        "Restrict access to lethal means with the patient and their support people",
        "Document the assessment and disposition",
      ],
      // Emergency dispatch stays a human decision. See the safety note above.
      requiresHumanConfirmation: true,
      lifeline: CRISIS_LIFELINE,
      responseTarget: "Immediate — within minutes",
    };
  }

  if (acute) {
    return {
      level: 3,
      label: "Acute risk — same-day clinical contact",
      automatedActions: [
        "Alert the responsible clinician with the trajectory and triggering evidence",
        "Surface crisis resources including the 988 Lifeline in-app",
        "Offer the patient's existing safety plan if one is on file",
      ],
      clinicianActions: [
        "Contact the patient today",
        "Complete a C-SSRS interview",
        "Review or create a safety plan and means-restriction steps",
        "Consider increasing visit frequency",
      ],
      requiresHumanConfirmation: true,
      lifeline: CRISIS_LIFELINE,
      responseTarget: "Same day",
    };
  }

  if (elevated) {
    return {
      level: 2,
      label: "Elevated risk — clinician review within 24 hours",
      automatedActions: [
        "Flag the patient on the clinician dashboard",
        "Surface the trajectory and the signals driving it",
        "Offer a check-in prompt to the patient",
      ],
      clinicianActions: [
        "Review the trajectory and recent telemetry",
        "Reach out at the next scheduled contact or sooner",
        "Consider a structured risk assessment",
      ],
      requiresHumanConfirmation: false,
      lifeline: CRISIS_LIFELINE,
      responseTarget: "Within 24 hours",
    };
  }

  if (watch) {
    return {
      level: 1,
      label: "Watch — monitoring with increased sensitivity",
      automatedActions: [
        "Increase monitoring sensitivity",
        "Note the change on the dashboard without paging",
      ],
      clinicianActions: ["Review at the next scheduled contact"],
      requiresHumanConfirmation: false,
      lifeline: null,
      responseTarget: "Next scheduled contact",
    };
  }

  return {
    level: 0,
    label: "Routine — no escalation indicated",
    automatedActions: ["Continue routine monitoring"],
    clinicianActions: [],
    requiresHumanConfirmation: false,
    lifeline: null,
    responseTarget: "Routine",
  };
}

// ─── Orchestration ────────────────────────────────────────────────────────────
export interface CrisisAssessment {
  history: CrisisRiskPoint[];
  current: CrisisRiskPoint;
  forecast: ForecastPoint[];
  crisisWindow: CrisisWindow | null;
  escalation: EscalationAction;
  cssrs: CSSRSAssessment | null;
  /** Plain-language summary for the clinician's eye, not the patient's. */
  summary: string;
}

/** Derive a patient's own baseline from their telemetry history. */
const DEFAULT_BASELINE: PatientBaseline = { meanSleepHours: 7.5, meanSocialInteractions: 10, meanActivityLevel: 5000 };

function cleanBaseline(b: PatientBaseline | null | undefined): PatientBaseline {
  const src = (b && typeof b === "object" ? b : {}) as Partial<PatientBaseline>;
  return {
    meanSleepHours: reading(src.meanSleepHours, DEFAULT_BASELINE.meanSleepHours),
    meanSocialInteractions: reading(src.meanSocialInteractions, DEFAULT_BASELINE.meanSocialInteractions),
    meanActivityLevel: reading(src.meanActivityLevel, DEFAULT_BASELINE.meanActivityLevel),
  };
}

/** Mean of the finite readings of one field, or the default when there are none. */
function meanOf(history: DailyTelemetry[], key: "sleepHours" | "socialInteractions" | "activityLevel", fallback: number): number {
  const values = history.map(d => (d && typeof d === "object" ? d[key] : undefined)).filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0);
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : fallback;
}

export function deriveBaseline(history: DailyTelemetry[]): PatientBaseline {
  if (!Array.isArray(history) || history.length === 0) return { ...DEFAULT_BASELINE };
  return {
    meanSleepHours: meanOf(history, "sleepHours", DEFAULT_BASELINE.meanSleepHours),
    meanSocialInteractions: meanOf(history, "socialInteractions", DEFAULT_BASELINE.meanSocialInteractions),
    meanActivityLevel: meanOf(history, "activityLevel", DEFAULT_BASELINE.meanActivityLevel),
  };
}

/**
 * Run the full crisis pipeline over a telemetry history.
 *
 * The most recent day is treated as "now"; everything before it forms the
 * trajectory the forecast extends.
 */
export function assessCrisisRisk(
  telemetry: DailyTelemetry[],
  baseline?: PatientBaseline,
): CrisisAssessment {
  if (telemetry.length === 0) {
    throw new Error("Crisis assessment requires at least one day of telemetry.");
  }

  const base = baseline ?? deriveBaseline(telemetry);
  const history = telemetry.map(d => fuseRiskScore(d, base));
  const current = history[history.length - 1];

  const forecast = forecastTrajectory(history);
  const crisisWindow = identifyCrisisWindow(forecast);
  const escalation = escalationFor(current.score, current.cssrsLevel, crisisWindow);

  const latestText = telemetry[telemetry.length - 1]?.text;
  const cssrs = typeof latestText === "string" && latestText ? assessCSSRS(latestText) : null;

  const parts: string[] = [`Current crisis risk ${Math.round(current.score)}/100.`];
  if (cssrs && cssrs.level > 0) {
    parts.push(`C-SSRS screen: level ${cssrs.level} — ${cssrs.description.toLowerCase()}.`);
  }
  if (crisisWindow) {
    parts.push(
      `Trajectory predicts a crisis window beginning in ${crisisWindow.startsInDays} day(s), ` +
        `peaking near ${Math.round(crisisWindow.peakScore)}/100 (confidence ${Math.round(crisisWindow.confidence * 100)}%).`,
    );
  } else {
    parts.push("No crisis window predicted in the next 7 days.");
  }
  const driver = Object.entries(current.components).sort((a, b) => b[1] - a[1])[0];
  parts.push(`Largest contributor: ${driver[0].replace(/([A-Z])/g, " $1").toLowerCase().trim()}.`);

  return { history, current, forecast, crisisWindow, escalation, cssrs, summary: parts.join(" ") };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
