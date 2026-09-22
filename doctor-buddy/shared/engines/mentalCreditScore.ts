/**
 * Mental Credit Score.
 *
 * A longitudinal composite of the signals a patient actually generates over
 * time — check-ins, journal, medication adherence, the digital twin, and crisis
 * history. Unlike the intake score, which reads a single questionnaire, this is
 * meant to move week to week.
 *
 * Three properties it must hold, all learned from breaking the same rules
 * elsewhere in this codebase:
 *
 *   1. Absent data is absent, not healthy. A component with no observations
 *      contributes nothing and is excluded from the weighting, rather than
 *      defaulting to a good value and quietly inflating the total. Coverage is
 *      reported so a score built on one signal cannot pass for one built on five.
 *
 *   2. Disclosure outranks behaviour. A crisis event in the window caps the
 *      score regardless of how good the behavioural signals look. The cap can
 *      only lower it, and the raw score is kept so the adjustment is auditable.
 *
 *   3. It is pure. No database, no model, no clock of its own — the caller
 *      passes observations and `now`. That is what makes it testable.
 */

export type RiskZone = "critical" | "elevated" | "guarded" | "resilient" | "optimal";

export interface MCSComponent {
  key: string;
  label: string;
  value: number | null;
  weight: number;
  observed: boolean;
  detail: string;
}

export interface MCSBreakdown {
  components: MCSComponent[];
  coverage: number;
  cappedBy: string | null;
  rawScore: number;
}

export interface MCSResult {
  score: number;
  riskZone: RiskZone;
  breakdown: MCSBreakdown;
}

/** Raw observations, as the DB layer reads them. Every field is optional. */
export interface MCSObservations {
  /** Recent progress check-ins, newest first. */
  checkins?: Array<{ overallScore: number | null; checkinDate: Date | string }>;
  /** Recent journal entries, newest first. */
  journal?: Array<{ moodScore: number | null; riskFlagged?: boolean | null; createdAt: Date | string }>;
  /** Medication log entries in the window. */
  medicationLogs?: Array<{ skipped: boolean | null; takenAt: Date | string }>;
  /** Digital twin composite, 0-100 where higher is better. */
  twinComposite?: number | null;
  /** Crisis events in the window, newest first. */
  crisisEvents?: Array<{ tier: string | null; createdAt: Date | string }>;
  /** Latest diagnostic report PRS, 0-1000. */
  prsScore?: number | null;
}

/** Observation window. Signals older than this do not describe the present. */
export const WINDOW_DAYS = 90;

/** Component weights. These sum to 1 only when every component is observed. */
export const WEIGHTS = {
  checkins: 0.26,
  journal: 0.18,
  adherence: 0.22,
  twin: 0.2,
  prs: 0.14,
} as const;

/**
 * Score caps by worst crisis tier in the window.
 *
 * tier1 is an emergency-level disclosure; tier2 high risk. A patient who
 * disclosed a crisis three weeks ago should not be reading "optimal" because
 * they have since logged their medication reliably.
 */
export const CRISIS_CAPS: Record<string, number> = {
  tier1_emergency: 380,
  tier2_high_risk: 560,
  tier3_elevated: 700,
};

const ZONES: Array<{ zone: RiskZone; min: number }> = [
  { zone: "optimal", min: 800 },
  { zone: "resilient", min: 600 },
  { zone: "guarded", min: 450 },
  { zone: "elevated", min: 300 },
  { zone: "critical", min: 0 },
];

export function zoneFor(score: number): RiskZone {
  for (const z of ZONES) if (score >= z.min) return z.zone;
  return "critical";
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000;
}

function inWindow(when: Date | string, now: Date): boolean {
  if (!(when instanceof Date) && typeof when !== "string" && typeof when !== "number") return false;
  const d = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(d.getTime())) return false;
  return daysBetween(d, now) <= WINDOW_DAYS;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Rows only, never a scalar or a null entry. */
function rows<T>(list: unknown): T[] {
  return Array.isArray(list) ? (list.filter(x => x && typeof x === "object") as T[]) : [];
}

/** A finite number in range, or null when the value cannot be read. */
function num(v: unknown, lo: number, hi: number): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : null;
}

export function computeMCS(input: MCSObservations, now: Date = new Date()): MCSResult {
  const components: MCSComponent[] = [];
  const obs: MCSObservations = input && typeof input === "object" ? input : {};
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) now = new Date();

  // ── Check-ins: self-reported overall wellbeing, 0-100, higher better.
  const checkins = rows<NonNullable<MCSObservations["checkins"]>[number]>(obs.checkins)
    .filter(c => num(c.overallScore, 0, 100) !== null && inWindow(c.checkinDate, now))
    .map(c => num(c.overallScore, 0, 100) as number);
  components.push({
    key: "checkins",
    label: "Daily check-ins",
    value: checkins.length > 0 ? Math.round(mean(checkins)) : null,
    weight: WEIGHTS.checkins,
    observed: checkins.length > 0,
    detail: checkins.length > 0
      ? `${checkins.length} check-in${checkins.length === 1 ? "" : "s"} in the last ${WINDOW_DAYS} days`
      : "No check-ins in the window",
  });

  // ── Journal: mood scores, with flagged entries pulling the component down.
  const entries = rows<NonNullable<MCSObservations["journal"]>[number]>(obs.journal).filter(j => inWindow(j.createdAt, now));
  // Journal moods are 0-10; the score is 0-100.
  const moods = entries.filter(j => num(j.moodScore, 0, 10) !== null).map(j => (num(j.moodScore, 0, 10) as number) * 10);
  const flagged = entries.filter(j => j.riskFlagged).length;
  let journalValue: number | null = null;
  if (moods.length > 0) {
    const base = mean(moods);
    // Each flagged entry costs 8 points, floored at zero. A journal that keeps
    // tripping risk indicators is not a healthy signal however the mood reads.
    journalValue = Math.max(0, Math.round(base - flagged * 8));
  }
  components.push({
    key: "journal",
    label: "Mood journal",
    value: journalValue,
    weight: WEIGHTS.journal,
    observed: journalValue !== null,
    detail: journalValue === null
      ? "No scored journal entries in the window"
      : `${moods.length} entr${moods.length === 1 ? "y" : "ies"}${flagged > 0 ? `, ${flagged} risk-flagged` : ""}`,
  });

  // ── Adherence: taken vs. logged doses.
  const logs = rows<NonNullable<MCSObservations["medicationLogs"]>[number]>(obs.medicationLogs).filter(l => inWindow(l.takenAt, now));
  let adherence: number | null = null;
  if (logs.length > 0) {
    const taken = logs.filter(l => !l.skipped).length;
    adherence = Math.round((taken / logs.length) * 100);
  }
  components.push({
    key: "adherence",
    label: "Medication adherence",
    value: adherence,
    weight: WEIGHTS.adherence,
    observed: adherence !== null,
    detail: adherence === null
      ? "No medication logs in the window"
      : `${logs.filter(l => !l.skipped).length} of ${logs.length} doses taken`,
  });

  // ── Digital twin composite.
  const twin = num(obs.twinComposite, 0, 100);
  components.push({
    key: "twin",
    label: "Digital twin composite",
    value: twin === null ? null : Math.round(twin),
    weight: WEIGHTS.twin,
    observed: twin !== null,
    detail: twin === null ? "No twin state recorded" : `Composite ${Math.round(twin)}/100`,
  });

  // ── PRS from the latest diagnostic report, rescaled 0-1000 -> 0-100.
  const prs = num(obs.prsScore, 0, 1000);
  components.push({
    key: "prs",
    label: "Psychiatric risk score",
    value: prs === null ? null : Math.round(prs / 10),
    weight: WEIGHTS.prs,
    observed: prs !== null,
    detail: prs === null ? "No scored diagnostic report" : `PRS ${prs}/1000`,
  });

  // ── Combine. Only observed components carry weight; the divisor is their
  // weight sum, not the full 1.0, so absent data neither helps nor hurts.
  const observed = components.filter(c => c.observed && c.value !== null);
  const weightSum = observed.reduce((a, c) => a + c.weight, 0);
  const coverage = Math.round(weightSum * 100) / 100;

  // With nothing observed there is no score to report. Returning a midpoint
  // would be inventing one.
  if (observed.length === 0) {
    return {
      score: 0,
      riskZone: "critical",
      breakdown: { components, coverage: 0, cappedBy: null, rawScore: 0 },
    };
  }

  const weighted = observed.reduce((a, c) => a + (c.value as number) * c.weight, 0) / weightSum;
  const rawScore = Math.max(0, Math.min(1000, Math.round(weighted * 10))); // 0-100 -> 0-1000

  // ── Crisis cap. Worst tier in the window wins, and it can only lower.
  let cappedBy: string | null = null;
  let score = rawScore;
  for (const ev of rows<NonNullable<MCSObservations["crisisEvents"]>[number]>(obs.crisisEvents).filter(e => inWindow(e.createdAt, now))) {
    const cap = typeof ev.tier === "string" ? CRISIS_CAPS[ev.tier] : undefined;
    if (cap === undefined) continue;
    if (cap < score) {
      score = cap;
      cappedBy = ev.tier;
    }
  }

  return {
    score,
    riskZone: zoneFor(score),
    breakdown: { components, coverage, cappedBy, rawScore },
  };
}
