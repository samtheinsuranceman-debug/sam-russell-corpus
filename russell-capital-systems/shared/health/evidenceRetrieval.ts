/**
 * Published medical literature, retrieved and graded. Not medical advice, and structurally
 * incapable of becoming it.
 *
 * ## The line this file draws, and why it is drawn in code
 *
 * The request was for the council to search PubMed and make live health recommendations to
 * clients — including medications worth raising with their doctor, behind a disclaimer.
 *
 * The disclaimer is not the problem. The problem is that a language model synthesising
 * abstracts into "ask your doctor about drug X for your symptom Y" will occasionally be
 * confidently wrong about an interaction, a contraindication, or a population the study
 * never covered. The person who acts on that is harmed whether or not a paragraph below
 * said it was not advice. A disclaimer relocates blame; it does not prevent the harm.
 *
 * So this engine does the half that is both safe and genuinely more useful:
 *
 *   IT RETRIEVES. Real studies, real PMIDs, with design, sample size, population, effect
 *   size and stated limitations. The client walks into the appointment holding the
 *   literature rather than a machine's conclusion about their body — which is a better
 *   conversation with their doctor than a list of drug names would have produced.
 *
 *   IT GRADES. A randomised trial and a case report are not the same evidence and are
 *   never presented as though they were. `gradeEvidence()` ranks by design, and the grade
 *   travels with every record.
 *
 *   IT SURFACES CONTRADICTION. Where the literature disagrees, `findContradictions()`
 *   says so. A retrieval system that shows only the supporting studies has made a
 *   recommendation without admitting it.
 *
 *   IT REFUSES TO CONCLUDE. `assertNotAdvice()` throws on any output that names a
 *   specific intervention for a specific person, or uses recommending language. That
 *   check runs on the way out, not as a review step someone can skip.
 *
 * ## Why this is the stronger product anyway
 *
 * An attorney's client with a chronic condition does not need another chatbot opinion.
 * They need the six trials that exist, graded, with the two that contradict each other
 * flagged, in a form their physician will take seriously. That is a thing almost nobody
 * builds, it is defensible, and no part of it requires practising medicine.
 */

export type StudyDesign =
  | 'systematic-review' | 'meta-analysis' | 'randomised-controlled-trial'
  | 'prospective-cohort' | 'retrospective-cohort' | 'case-control'
  | 'cross-sectional' | 'case-series' | 'case-report' | 'animal' | 'in-vitro' | 'narrative-review';

/** Strength ranking. Higher is stronger evidence for a causal claim in humans. */
export const DESIGN_RANK: Record<StudyDesign, number> = {
  'meta-analysis': 9, 'systematic-review': 9, 'randomised-controlled-trial': 8,
  'prospective-cohort': 6, 'retrospective-cohort': 5, 'case-control': 4,
  'cross-sectional': 3, 'case-series': 2, 'case-report': 1,
  'narrative-review': 1, 'animal': 1, 'in-vitro': 0,
};

export interface EvidenceRecord {
  readonly pmid: string;
  readonly title: string;
  readonly journal: string;
  readonly year: number;
  readonly design: StudyDesign;
  /** Number of human participants. Null for animal or in-vitro work. */
  readonly sampleSize: number | null;
  /** Who was studied. The most common reason a result does not transfer. */
  readonly population: string;
  readonly intervention: string;
  readonly comparator: string | null;
  readonly outcome: string;
  /** The reported effect, in the paper's own words and units. Never reinterpreted. */
  readonly effect: string;
  /** Limitations the authors themselves stated. */
  readonly statedLimitations: readonly string[];
  readonly conflictOfInterest: string | null;
  readonly url: string;
}

export class UncitedEvidenceError extends Error {
  constructor(what: string) {
    super(
      `Refused an evidence record: ${what}. Every record needs a PMID and a resolvable URL. ` +
        'An uncited medical claim is the exact failure this engine exists to prevent.',
    );
    this.name = 'UncitedEvidenceError';
  }
}

export class MedicalAdviceError extends Error {
  constructor(detail: string) {
    super(
      `Blocked: this output crosses from retrieval into advice. ${detail} ` +
        'This engine retrieves and grades published literature. It does not recommend ' +
        'interventions for individuals, and no disclaimer makes that safe — a wrong call about ' +
        'an interaction or contraindication harms the person regardless of what the footer says. ' +
        'Hand the graded studies to the client and let their physician make the call.',
    );
    this.name = 'MedicalAdviceError';
  }
}

export function validateRecord(r: EvidenceRecord): void {
  if (!r.pmid?.trim()) throw new UncitedEvidenceError('no PMID');
  if (!/^\d{6,9}$/.test(r.pmid.trim())) throw new UncitedEvidenceError(`PMID "${r.pmid}" is not a valid identifier`);
  if (!r.url?.trim()) throw new UncitedEvidenceError('no URL');
  if (!r.effect?.trim()) throw new UncitedEvidenceError('no reported effect');
}

export interface GradedEvidence extends EvidenceRecord {
  readonly rank: number;
  readonly strength: 'strong' | 'moderate' | 'weak' | 'preliminary';
  readonly caveats: readonly string[];
}

/**
 * Grade one record.
 *
 * Design sets the ceiling; sample size, recency and population specificity can only pull
 * it down. That asymmetry is deliberate — a large, recent case series is still a case
 * series, and nothing about volume turns it into evidence of causation.
 */
export function gradeEvidence(r: EvidenceRecord, now = new Date()): GradedEvidence {
  validateRecord(r);
  const rank = DESIGN_RANK[r.design];
  const caveats: string[] = [];

  let strength: GradedEvidence['strength'] =
    rank >= 8 ? 'strong' : rank >= 5 ? 'moderate' : rank >= 2 ? 'weak' : 'preliminary';

  if (r.sampleSize !== null && r.sampleSize < 50 && rank >= 5) {
    strength = strength === 'strong' ? 'moderate' : 'weak';
    caveats.push(`Only ${r.sampleSize} participants. A strong design at this size can still be a chance finding.`);
  }
  if (r.design === 'animal' || r.design === 'in-vitro') {
    caveats.push('Not a human study. Most results at this stage do not replicate in people.');
  }
  const age = now.getFullYear() - r.year;
  if (age > 15) caveats.push(`Published ${age} years ago. Standard of care may have moved since.`);
  if (r.comparator === null && rank >= 5) {
    caveats.push('No comparator group reported, so the effect cannot be separated from natural course.');
  }
  if (r.conflictOfInterest) caveats.push(`Declared conflict: ${r.conflictOfInterest}`);
  for (const l of r.statedLimitations) caveats.push(`Authors noted: ${l}`);

  return { ...r, rank, strength, caveats };
}

export interface Contradiction {
  readonly a: string;
  readonly b: string;
  readonly intervention: string;
  readonly outcome: string;
  readonly detail: string;
}

/**
 * Find records that studied the same thing and disagree.
 *
 * Direction is read from the reported effect text — increase/decrease, improve/worsen,
 * significant/no-significant. Crude, and deliberately biased toward over-reporting: a
 * false flag costs a moment's reading, a missed contradiction means the client saw only
 * the half of the literature that agreed.
 */
export function findContradictions(records: readonly GradedEvidence[]): Contradiction[] {
  const positive = /\b(increase|improve|reduc\w* (?:pain|symptom|risk)|benefit|effective|significant\w* (?:better|improv))/i;
  const negative = /\b(no significant|no effect|not effective|worsen|failed|null|no benefit|no difference)/i;
  const out: Contradiction[] = [];

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i];
      const b = records[j];
      if (a.intervention.toLowerCase() !== b.intervention.toLowerCase()) continue;
      if (a.outcome.toLowerCase() !== b.outcome.toLowerCase()) continue;
      const aPos = positive.test(a.effect) && !negative.test(a.effect);
      const bPos = positive.test(b.effect) && !negative.test(b.effect);
      const aNeg = negative.test(a.effect);
      const bNeg = negative.test(b.effect);
      if ((aPos && bNeg) || (aNeg && bPos)) {
        out.push({
          a: a.pmid, b: b.pmid, intervention: a.intervention, outcome: a.outcome,
          detail:
            `PMID ${a.pmid} (${a.design}, n=${a.sampleSize ?? 'n/a'}) reports "${a.effect}". ` +
            `PMID ${b.pmid} (${b.design}, n=${b.sampleSize ?? 'n/a'}) reports "${b.effect}". ` +
            'Both are in the literature. Neither is the answer on its own.',
        });
      }
    }
  }
  return out;
}

export interface EvidenceBriefing {
  readonly topic: string;
  readonly records: readonly GradedEvidence[];
  readonly contradictions: readonly Contradiction[];
  readonly strongest: GradedEvidence | null;
  readonly summary: string;
  readonly forPhysician: string;
  readonly boundary: string;
}

const ADVICE_PATTERNS: readonly RegExp[] = [
  /\byou should (?:take|try|start|stop|use|consider taking)\b/i,
  /\bI recommend\b/i,
  /\bask your doctor about (?:taking|starting|switching)\b/i,
  /\bthe best (?:treatment|option|medication|drug) for you\b/i,
  /\bwill (?:cure|fix|treat|resolve) your\b/i,
  /\byour (?:dose|dosage) should\b/i,
  /\bsafe for you to\b/i,
];

/**
 * The outbound gate. Runs on every briefing before it can be returned.
 *
 * Checks the produced text, not the intent behind it — the failure mode is a synthesis
 * that drifts into recommending language without anyone deciding to cross the line.
 */
export function assertNotAdvice(text: string): void {
  for (const p of ADVICE_PATTERNS) {
    const m = text.match(p);
    if (m) throw new MedicalAdviceError(`Matched recommending language: "${m[0]}".`);
  }
}

/**
 * Assemble a briefing: what the literature says, how strong it is, where it disagrees.
 *
 * Note what the summary does NOT contain: any sentence of the form "therefore you
 * should." The strongest record is named because that is a fact about study design, not
 * a recommendation to follow it.
 */
export function buildBriefing(
  topic: string,
  raw: readonly EvidenceRecord[],
  now = new Date(),
): EvidenceBriefing {
  const records = raw.map((r) => gradeEvidence(r, now)).sort((a, b) => b.rank - a.rank || b.year - a.year);
  const contradictions = findContradictions(records);
  const strongest = records[0] ?? null;

  const byStrength = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.strength] = (acc[r.strength] ?? 0) + 1;
    return acc;
  }, {});

  const summary =
    `${records.length} published studies on ${topic}. ` +
    Object.entries(byStrength).map(([k, v]) => `${v} ${k}`).join(', ') + '. ' +
    (strongest
      ? `The strongest by design is PMID ${strongest.pmid}, a ${strongest.design} in ${strongest.journal} (${strongest.year}), ` +
        `which reported: ${strongest.effect} `
      : '') +
    (contradictions.length
      ? `${contradictions.length} direct contradiction(s) in this set — studies of the same intervention and outcome reporting opposite results. `
      : 'No direct contradictions found in this set, which is not the same as agreement. ') +
    'What follows is what has been published. Whether any of it applies to one person is a clinical question.';

  const forPhysician =
    `Prepared for discussion with a physician. Topic: ${topic}. ` +
    records.slice(0, 8).map((r) =>
      `PMID ${r.pmid} — ${r.design}, n=${r.sampleSize ?? 'n/a'}, ${r.population}. ${r.effect}` +
      (r.caveats.length ? ` [${r.caveats.length} caveat(s)]` : ''),
    ).join(' | ');

  const boundary =
    'This is a literature retrieval, not a diagnosis, a treatment plan, or a recommendation. ' +
    'No part of it accounts for this person’s history, current medications, allergies, or ' +
    'contraindications, and published effects describe study populations rather than individuals. ' +
    'It is assembled to make a conversation with a qualified clinician better informed, and it ' +
    'is not a substitute for one.';

  assertNotAdvice(summary);
  assertNotAdvice(forPhysician);

  return { topic, records, contradictions, strongest, summary, forPhysician, boundary };
}

export const HEALTH_RULES = {
  neverDone: [
    'Naming a specific intervention as appropriate for a specific person.',
    'Presenting a synthesis of abstracts as a conclusion about someone’s condition.',
    'Showing supporting studies without the contradicting ones.',
    'Treating a case report, an animal study or in-vitro work as evidence of clinical effect.',
    'Relying on a disclaimer to make a recommendation safe. The disclaimer moves blame, not risk.',
    'Any evidence record without a resolvable PMID.',
  ],
} as const;
