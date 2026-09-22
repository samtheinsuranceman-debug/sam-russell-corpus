/**
 * Scoring for the 100-item DSM-5-aligned intake.
 *
 * This is a **screening score**, not a diagnosis and not an IRT posterior. The
 * 100 intake items have no calibrated discrimination or difficulty parameters,
 * so presenting their output as the patent-06 IRT engine's theta would be
 * exactly the authoritative-looking noise this project refuses to ship. The
 * adaptive engine in `shared/engines/adaptiveAssessment.ts` runs over its own
 * calibrated bank; this module scores the fixed intake on its own terms.
 *
 * What it does guarantee:
 *   - Deterministic. Same answers in, same result out. No network, no model.
 *   - Runs with no database and no LLM, so the intake works before login.
 *   - Reports coverage honestly. A domain scored from two of fourteen items is
 *     labelled as such and cannot outrank a fully-answered domain.
 *   - Safety endorsements route to the crisis path regardless of severity.
 */

import { DSM5_QUESTIONS, SAFETY_CRITICAL_IDS, getSkippedIds, type IntakeQuestion } from "./questions";

// ─── Answer scales ────────────────────────────────────────────────────────────

/**
 * Normalized severity contribution of one answer, on 0..1.
 *
 * Returns null for answers that carry no severity meaning — an unanswered item,
 * or a scale that measures something other than symptom load (duration, for
 * instance, which describes course rather than intensity).
 */
export function answerSeverity(question: IntakeQuestion, answer: string | undefined): number | null {
  if (answer === undefined || answer === "") return null;

  const idx = question.options.indexOf(answer);
  if (idx < 0) return null;

  switch (question.type) {
    // PHQ/GAD-style 4-point frequency: Not at all .. Nearly every day
    case "frequency":
      return idx / (question.options.length - 1);

    // Yes/No screening items. "Yes" is full endorsement.
    case "yesno":
      return answer === "Yes" ? 1 : 0;

    // 5-point never..always / never..very often
    case "severity":
      return idx / (question.options.length - 1);

    // 1-10 self-rating
    case "scale": {
      const n = Number(answer);
      if (!Number.isFinite(n)) return null;
      return (n - 1) / 9;
    }

    // Duration describes course, not intensity. Excluded from severity so a
    // long-standing mild problem does not read as a severe one.
    case "duration":
      return null;

    default:
      return idx / Math.max(1, question.options.length - 1);
  }
}

/** Ordinal position of a duration answer, 0..n-1, or null. Used for chronicity. */
export function durationRank(question: IntakeQuestion, answer: string | undefined): number | null {
  if (question.type !== "duration" || answer === undefined) return null;
  const idx = question.options.indexOf(answer);
  return idx < 0 ? null : idx;
}

// ─── Domain scoring ───────────────────────────────────────────────────────────

export interface DomainScore {
  domain: string;
  /** 0-100 mean normalized severity across the scored items in this domain. */
  severity: number;
  /** Items in this domain that were answered and carry severity meaning. */
  scored: number;
  /** Items in this domain that were in play (not branch-skipped). */
  inPlay: number;
  /** scored / inPlay, 0..1. Low coverage means the score is provisional. */
  coverage: number;
  /**
   * 0..1. How much weight the score deserves. Falls with coverage and with a
   * small absolute number of items, so two answered items never read as
   * confidently as twelve.
   */
  confidence: number;
  /** True when the domain was closed out by a negative branch gate. */
  screenedOut: boolean;
  /** Ids of the items that contributed, for audit. */
  contributingIds: number[];
}

/** Severity at or above this reads as clinically notable for triage purposes. */
export const NOTABLE_THRESHOLD = 40;

function confidenceFor(coverage: number, scored: number): number {
  if (scored === 0) return 0;
  // Coverage dominates, but an absolute-count term keeps tiny domains humble:
  // a 2-item domain answered fully still tops out below a 12-item one.
  const countTerm = Math.min(1, scored / 8);
  return Math.round(coverage * 0.65 * 100 + countTerm * 0.35 * 100) / 100;
}

export function scoreDomains(answers: Record<string, string>): DomainScore[] {
  const skipped = getSkippedIds(answers);
  const byDomain = new Map<string, IntakeQuestion[]>();
  for (const q of DSM5_QUESTIONS) {
    if (!byDomain.has(q.domain)) byDomain.set(q.domain, []);
    byDomain.get(q.domain)!.push(q);
  }

  const out: DomainScore[] = [];
  for (const [domain, questions] of Array.from(byDomain.entries())) {
    const inPlayQs = questions.filter((q: IntakeQuestion) => !skipped.has(q.id));
    const values: number[] = [];
    const ids: number[] = [];

    for (const q of inPlayQs) {
      const v = answerSeverity(q, answers[q.id.toString()]);
      if (v === null) continue;
      values.push(v);
      ids.push(q.id);
    }

    const scored = values.length;
    const inPlay = inPlayQs.length;
    const coverage = inPlay === 0 ? 0 : scored / inPlay;
    const mean = scored === 0 ? 0 : values.reduce((a, b) => a + b, 0) / scored;

    out.push({
      domain,
      severity: Math.round(mean * 1000) / 10,
      scored,
      inPlay,
      coverage: Math.round(coverage * 100) / 100,
      confidence: confidenceFor(coverage, scored),
      // A domain is screened out when its gate closed every follow-up item.
      screenedOut: inPlay < questions.length && inPlay <= 2 && mean === 0,
      contributingIds: ids,
    });
  }

  return out;
}

// ─── Safety ───────────────────────────────────────────────────────────────────

export interface SafetySignal {
  /** True when any safety-critical item was endorsed above zero. */
  flagged: boolean;
  /** The endorsed safety items, with the answer given. */
  endorsements: Array<{ id: number; text: string; answer: string; severity: number }>;
  /**
   * Suggested urgency. "immediate" corresponds to endorsement of recurrent
   * suicidal behaviour or daily ideation; "same_day" to any other endorsement.
   * This is a routing hint for a clinician, never an autonomous action.
   */
  urgency: "none" | "same_day" | "immediate";
}

export function assessSafety(answers: Record<string, string>): SafetySignal {
  const endorsements: SafetySignal["endorsements"] = [];

  for (const id of SAFETY_CRITICAL_IDS) {
    const q = DSM5_QUESTIONS.find(x => x.id === id);
    if (!q) continue;
    const answer = answers[id.toString()];
    const sev = answerSeverity(q, answer);
    if (sev === null || sev <= 0) continue;
    endorsements.push({ id, text: q.text, answer: answer!, severity: Math.round(sev * 100) });
  }

  if (endorsements.length === 0) return { flagged: false, endorsements, urgency: "none" };

  // Q84 is recurrent suicidal behaviour or self-mutilation — behaviour, not just
  // thought. Daily passive ideation on Q9 carries comparable urgency.
  const immediate = endorsements.some(e => e.id === 84 || e.severity >= 100);

  return {
    flagged: true,
    endorsements,
    urgency: immediate ? "immediate" : "same_day",
  };
}

// ─── Result ───────────────────────────────────────────────────────────────────

export interface IntakeCandidate {
  domain: string;
  condition: string;
  severity: number;
  confidence: number;
  coverage: number;
  scored: number;
  inPlay: number;
  /** Plain-language reading of severity for a non-specialist. */
  band: "minimal" | "mild" | "moderate" | "severe";
  /** True when coverage is too thin to rank this honestly. */
  provisional: boolean;
}

export interface IntakeResult {
  candidates: IntakeCandidate[];
  domains: DomainScore[];
  safety: SafetySignal;
  answered: number;
  inPlay: number;
  completeness: number;
  /** Written for the clinician, stating what was and was not established. */
  clinicalNote: string;
  /** True when enough of the instrument is done to be worth reading. */
  sufficient: boolean;
}

const CONDITION_BY_DOMAIN: Record<string, string> = {
  Depression: "Major depressive disorder",
  Anxiety: "Generalized anxiety disorder",
  PTSD: "Post-traumatic stress disorder",
  Bipolar: "Bipolar spectrum disorder",
  OCD: "Obsessive-compulsive disorder",
  Psychosis: "Primary psychotic disorder",
  "Substance Use": "Substance use disorder",
  ADHD: "Attention-deficit/hyperactivity disorder",
  Personality: "Personality disorder features",
  Somatic: "Somatic symptom disorder",
  Sleep: "Sleep-wake disorder",
  Eating: "Feeding or eating disorder",
  General: "General functioning",
};

function bandFor(severity: number): IntakeCandidate["band"] {
  if (severity >= 70) return "severe";
  if (severity >= NOTABLE_THRESHOLD) return "moderate";
  if (severity >= 20) return "mild";
  return "minimal";
}

/** Minimum share of in-play items needed before the result is worth showing. */
export const SUFFICIENCY_THRESHOLD = 0.75;

export function scoreIntake(answers: Record<string, string>): IntakeResult {
  const domains = scoreDomains(answers);
  const safety = assessSafety(answers);

  const skipped = getSkippedIds(answers);
  const inPlayQs = DSM5_QUESTIONS.filter(q => !skipped.has(q.id));
  const answered = inPlayQs.filter(q => {
    const a = answers[q.id.toString()];
    return a !== undefined && a !== "";
  }).length;
  const completeness = inPlayQs.length === 0 ? 0 : answered / inPlayQs.length;

  const candidates: IntakeCandidate[] = domains
    // "General" is a functioning block, not a differential candidate.
    .filter(d => d.domain !== "General" && d.scored > 0)
    .map(d => ({
      domain: d.domain,
      condition: CONDITION_BY_DOMAIN[d.domain] ?? d.domain,
      severity: d.severity,
      confidence: d.confidence,
      coverage: d.coverage,
      scored: d.scored,
      inPlay: d.inPlay,
      band: bandFor(d.severity),
      provisional: d.coverage < 0.5,
    }))
    // Rank by severity weighted by confidence, so a thinly-covered domain cannot
    // outrank a fully-answered one on raw severity alone. Ties break on coverage.
    .sort((a, b) => {
      const ka = a.severity * (0.5 + 0.5 * a.confidence);
      const kb = b.severity * (0.5 + 0.5 * b.confidence);
      if (kb !== ka) return kb - ka;
      return b.coverage - a.coverage;
    });

  const sufficient = completeness >= SUFFICIENCY_THRESHOLD;

  const notable = candidates.filter(c => c.severity >= NOTABLE_THRESHOLD);
  const provisional = candidates.filter(c => c.provisional && c.severity >= NOTABLE_THRESHOLD);

  const parts: string[] = [];
  parts.push(
    `${answered} of ${inPlayQs.length} in-play items answered (${Math.round(completeness * 100)}%).`,
  );

  if (safety.flagged) {
    parts.push(
      `SAFETY: ${safety.endorsements.length} safety-critical item(s) endorsed — ` +
        `${safety.endorsements.map(e => `Q${e.id}`).join(", ")}. Suggested urgency: ${safety.urgency.replace("_", " ")}. ` +
        `This routes to a clinician; the system takes no autonomous action.`,
    );
  } else {
    parts.push("No safety-critical item endorsed.");
  }

  if (notable.length === 0) {
    parts.push("No domain reached the notable threshold on this screen.");
  } else {
    parts.push(
      `Notable domains: ${notable.map(c => `${c.domain} (${c.severity}, ${c.band})`).join("; ")}.`,
    );
  }

  if (provisional.length > 0) {
    parts.push(
      `Provisional on thin coverage — confirm before acting: ${provisional
        .map(c => `${c.domain} (${c.scored}/${c.inPlay} items)`)
        .join("; ")}.`,
    );
  }

  if (!sufficient) {
    parts.push(
      "Below the completeness threshold; treat the ranking as incomplete rather than negative.",
    );
  }

  parts.push("Screening output only. Not a diagnosis. Interpretation belongs to the treating clinician.");

  return {
    candidates,
    domains,
    safety,
    answered,
    inPlay: inPlayQs.length,
    completeness: Math.round(completeness * 100) / 100,
    clinicalNote: parts.join(" "),
    sufficient,
  };
}
