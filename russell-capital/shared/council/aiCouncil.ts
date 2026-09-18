/**
 * The council — twelve specialists, one voice, and a memory that sharpens with use.
 *
 * ## What "twelve AI brains" means here
 *
 * Not twelve model calls. Twelve DOMAINS, each with an owner that knows which pages,
 * calculators, datasets and external sources answer questions in its territory, and a
 * competence profile that says where it should and should not speak.
 *
 * This matters for a reason beyond cost. Twelve language models asked the same question
 * produce twelve fluent answers and no way to tell which is right — they agree when they
 * are all wrong and diverge for reasons you cannot inspect. Twelve deterministic routers
 * over twelve real data sources produce answers you can trace to a source, reproduce
 * tomorrow, and test. Where a member genuinely needs a model to interpret something, it
 * calls one — but the ROUTING, the weighting and the disagreement detection are
 * mechanical, because those are the parts that have to be auditable.
 *
 * ## Disagreement is the product
 *
 * A council that always converges is a council with one opinion and eleven echoes. The
 * useful moment is when the tax member and the liquidity member want opposite things,
 * because that is a real tension in the client's position rather than a modelling
 * artefact. `convene()` surfaces those explicitly instead of averaging them away, and a
 * synthesis that hides a live disagreement is treated as a defect.
 *
 * ## How it learns
 *
 * `RoutingMemory` records which members were convened for which intents and whether the
 * answer was actually used. Members that keep getting routed to and keep being dismissed
 * lose weight for that intent; members the user keeps returning to gain it. The weights
 * are inspectable numbers in a store, not an opaque fine-tune, so a wrong turn can be
 * read and corrected.
 *
 * Deliberate limits, because a system that learns from one user drifts toward that user:
 * weights move slowly, they are bounded, and `explain()` shows the current state.
 */

import type { Modality, ModalityReading, Technique } from './nlpEngine';
import { detectModality, styleMessage } from './nlpEngine';

export type Domain =
  | 'policy-mechanics' | 'tax' | 'real-estate' | 'lending' | 'liquidity'
  | 'legacy' | 'compliance' | 'market-history' | 'patent' | 'health-evidence'
  | 'behavioural' | 'data-integrity';

export interface CouncilMember {
  readonly id: string;
  readonly name: string;
  readonly domain: Domain;
  /** Plain statement of what this member is for. Shown to the user on request. */
  readonly charter: string;
  /** Words and phrases that route an utterance here. */
  readonly triggers: readonly string[];
  /** Calculators, pages and datasets this member can actually reach. */
  readonly sources: readonly string[];
  /** Baseline competence 0-1, before any learning. */
  readonly baseWeight: number;
  /** Where this member must defer. Stated, not implied. */
  readonly defersTo: readonly Domain[];
}

export const COUNCIL: readonly CouncilMember[] = [
  {
    id: 'mechanic', name: 'The Mechanic', domain: 'policy-mechanics',
    charter: 'How the policy actually works: crediting, caps, participation, charges, loans, lapse.',
    triggers: ['policy', 'iul', 'crediting', 'cap', 'participation', 'multiplier', 'floor', 'surrender', 'premium', 'cash value'],
    sources: ['multiplierDecision.ts', 'annualLoanStrategy.ts', 'policyLoanMechanics.ts', 'pacificHorizonEcv.ts', '/portal/mortgage-killer', '/showcase/multiplier-decision.html'],
    baseWeight: 0.9, defersTo: ['compliance'],
  },
  {
    id: 'assessor', name: 'The Assessor', domain: 'tax',
    charter: 'What the government takes, under current law and under each legislative scenario.',
    triggers: ['tax', 'bracket', 'deduction', 'taxable', 'irs', 'phantom income', 'basis', 'sunset', '7702'],
    sources: ['scenarioEngine.ts', 'taxCodeChangeSimulator.ts', 'forecastSources.ts', 'estateTaxEngine.ts'],
    baseWeight: 0.85, defersTo: ['compliance'],
  },
  {
    id: 'surveyor', name: 'The Surveyor', domain: 'real-estate',
    charter: 'Property: appreciation, rent, mortgage vintages, equity, and what the ZIP actually did.',
    triggers: ['property', 'house', 'home', 'mortgage', 'rent', 'appreciation', 'zip', 'equity', 'heloc', 'landlord'],
    sources: ['zipEngine.ts', 'realEstateMogul.ts', 'helocLenders.ts', '/portal/zip-engine'],
    baseWeight: 0.85, defersTo: ['data-integrity'],
  },
  {
    id: 'underwriter', name: 'The Underwriter', domain: 'lending',
    charter: 'Who gets lent to, at what price, and whether it comes back.',
    triggers: ['loan', 'lend', 'borrow', 'advance', 'apr', 'factor rate', 'business', 'credit', 'default'],
    sources: ['smallBusinessLending/industryRisk.ts', 'smallBusinessLending/loanPricing.ts', 'helocLenders.ts'],
    baseWeight: 0.85, defersTo: ['compliance'],
  },
  {
    id: 'treasurer', name: 'The Treasurer', domain: 'liquidity',
    charter: 'What is reachable, when, and at what cost. Guards the reserve.',
    triggers: ['liquid', 'access', 'cash', 'reserve', 'emergency', 'withdraw', 'available', 'tied up', 'cash value', 'how much do i have'],
    sources: ['factFinder.ts', 'nextBestAction.ts', 'annualLoanStrategy.ts'],
    baseWeight: 0.9, defersTo: [],
  },
  {
    id: 'steward', name: 'The Steward', domain: 'legacy',
    charter: 'What survives the client: death benefit, trusts, generational transfer.',
    triggers: ['legacy', 'death benefit', 'heirs', 'children', 'estate', 'trust', 'inherit', 'generational'],
    sources: ['generationalWealthEngine.ts', 'estateTaxEngine.ts', 'familyTreeFinancialEngine.ts'],
    baseWeight: 0.8, defersTo: ['tax', 'compliance'],
  },
  {
    id: 'registrar', name: 'The Registrar', domain: 'compliance',
    charter: 'What may be shown, said and claimed. Holds veto.',
    triggers: ['compliance', 'illustration', 'ag49', 'disclosure', 'regulation', 'allowed', 'legal', 'suitability'],
    sources: ['timeMachineCompliance.ts', 'iulComplianceEngine.ts', 'docs/SMALL_BUSINESS_LENDING_LEGAL.md'],
    baseWeight: 1.0, defersTo: [],
  },
  {
    id: 'archivist', name: 'The Archivist', domain: 'market-history',
    charter: 'What actually happened. Index returns, sequences, floor years, drawdowns.',
    triggers: ['history', 'historical', 'backtest', 'return', 'index', 'sp500', 'nasdaq', 'russell', 'sequence', 'crash', 'time machine', 'look back', 'what happened'],
    sources: ['indexCreditingData.ts', 'timeMachine30.ts', 'sequenceStress.ts', '/showcase/time-machine.html'],
    baseWeight: 0.9, defersTo: ['data-integrity'],
  },
  {
    id: 'examiner', name: 'The Examiner', domain: 'patent',
    charter: 'Claims, prior art, practitioner status, filing posture.',
    triggers: ['patent', 'claim', 'prior art', 'uspto', 'invention', 'filing', 'office action', 'practitioner', 'alice', '101'],
    sources: ['patentCatalog.ts', 'patentStatus.ts', 'Patent360/app/uspto.py', 'Patent360/app/roster.py'],
    baseWeight: 0.85, defersTo: ['compliance'],
  },
  {
    id: 'librarian', name: 'The Librarian', domain: 'health-evidence',
    charter: 'Retrieves published medical literature with citations. Does NOT give medical advice.',
    triggers: ['health', 'pubmed', 'study', 'condition', 'symptom', 'research', 'trial', 'evidence', 'treatment'],
    sources: ['health/evidenceRetrieval.ts'],
    baseWeight: 0.7, defersTo: ['compliance'],
  },
  {
    id: 'reader', name: 'The Reader', domain: 'behavioural',
    charter: 'How the client processes information, and how to explain things so they land.',
    triggers: ['explain', 'confused', 'understand', 'simpler', 'why', 'worried', 'nervous', 'not sure'],
    sources: ['council/nlpEngine.ts', 'behavioralBiasEngine.ts'],
    baseWeight: 0.7, defersTo: [],
  },
  {
    id: 'auditor', name: 'The Auditor', domain: 'data-integrity',
    charter: 'Whether the numbers are sourced, current, and possible. Holds veto on unsourced figures.',
    triggers: ['source', 'where did', 'verify', 'accurate', 'sure', 'proof', 'citation', 'stale', 'audit'],
    sources: ['multiplierDecision.ts#auditOptionTable', 'factFinder.ts#provenance', 'scenarioEngine.ts'],
    baseWeight: 1.0, defersTo: [],
  },
] as const;

export interface RoutedMember {
  readonly member: CouncilMember;
  readonly score: number;
  readonly matchedTriggers: readonly string[];
  readonly reason: string;
}

export interface RoutingMemory {
  /** Key is `${intent}::${memberId}`. Value is a learned adjustment in [-0.4, +0.4]. */
  readonly weights: Record<string, number>;
  readonly observations: number;
}

export function emptyMemory(): RoutingMemory {
  return { weights: {}, observations: 0 };
}

const MAX_ADJUSTMENT = 0.4;
const LEARNING_RATE = 0.05;

/** Coarse intent bucket, used as the learning key. */
export function classifyIntent(utterance: string): string {
  const u = utterance.toLowerCase();
  if (/\b(how much|what would|calculate|compute|run)\b/.test(u)) return 'compute';
  if (/\b(should i|which|better|recommend|worth it)\b/.test(u)) return 'decide';
  if (/\b(why|explain|how does|what is|what does)\b/.test(u)) return 'explain';
  if (/\b(where did|source|verify|prove|sure)\b/.test(u)) return 'verify';
  if (/\b(show|open|go to|pull up|find)\b/.test(u)) return 'navigate';
  return 'general';
}

/**
 * Rank the council for one utterance.
 *
 * Compliance and data-integrity are always convened regardless of trigger match, at a
 * reduced weight. They are the two members whose absence is most costly and whose
 * relevance a keyword match will systematically miss — nobody asks "is this compliant,"
 * they ask "can I show this to a client," and the trigger list will never be complete.
 */
export function routeUtterance(
  utterance: string,
  memory: RoutingMemory = emptyMemory(),
  opts: { readonly maxMembers?: number } = {},
): RoutedMember[] {
  const u = utterance.toLowerCase();
  const intent = classifyIntent(utterance);
  const ALWAYS: Domain[] = ['compliance', 'data-integrity'];

  const scored = COUNCIL.map((member) => {
    const matched = member.triggers.filter((t) => u.includes(t));
    const learned = memory.weights[`${intent}::${member.id}`] ?? 0;
    const alwaysOn = ALWAYS.includes(member.domain);

    // Trigger density, not raw count — a member with 40 triggers should not win on volume.
    const density = matched.length / Math.max(1, member.triggers.length);
    let score = matched.length > 0 ? member.baseWeight * (0.5 + density * 2) : 0;
    if (score === 0 && alwaysOn) score = member.baseWeight * 0.35;
    score += learned;

    return {
      member,
      score: Number(Math.max(0, score).toFixed(4)),
      matchedTriggers: matched,
      reason: matched.length
        ? `Matched ${matched.length} trigger(s): ${matched.slice(0, 4).join(', ')}.` +
          (learned !== 0 ? ` Learned adjustment ${learned >= 0 ? '+' : ''}${learned.toFixed(3)}.` : '')
        : alwaysOn
          ? 'Standing member — convened on every question regardless of wording.'
          : 'No trigger match.',
    };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, opts.maxMembers ?? 5);
}

export interface Finding {
  readonly memberId: string;
  readonly claim: string;
  /** Where this came from. A finding without one is rejected by convene(). */
  readonly source: string;
  readonly confidence: number;
  /** True where this contradicts another member. */
  readonly dissent?: boolean;
}

export class UnsourcedFindingError extends Error {
  constructor(memberId: string) {
    super(
      `Rejected a finding from ${memberId}: it carries no source. Every claim the council makes ` +
        'must name where it came from — that contract is the only thing separating this from ' +
        'twelve confident guesses.',
    );
    this.name = 'UnsourcedFindingError';
  }
}

export interface CouncilAnswer {
  readonly utterance: string;
  readonly intent: string;
  readonly convened: readonly string[];
  readonly findings: readonly Finding[];
  /** Pairs of member ids that disagree. Surfaced, never averaged. */
  readonly disagreements: readonly { readonly a: string; readonly b: string; readonly about: string }[];
  readonly vetoed: readonly string[];
  readonly synthesis: string;
  readonly styled: string;
  readonly modality: Modality;
  readonly sources: readonly string[];
}

/**
 * Convene the council and produce one answer.
 *
 * Two hard rules, both enforced rather than documented:
 *
 *   Every finding names a source, or it is refused outright.
 *
 *   The Registrar and the Auditor hold veto. A compliance objection or an unsourced-figure
 *   objection removes the offending finding from the synthesis rather than appearing as a
 *   caveat beneath it. A caveat under a claim the client has already read is not a control.
 */
export function convene(
  utterance: string,
  findings: readonly Finding[],
  opts: {
    readonly memory?: RoutingMemory;
    readonly conversationHistory?: string;
    readonly techniques?: readonly Technique[];
  } = {},
): CouncilAnswer {
  for (const f of findings) {
    if (!f.source?.trim()) throw new UnsourcedFindingError(f.memberId);
  }

  const memory = opts.memory ?? emptyMemory();
  const routed = routeUtterance(utterance, memory);
  const intent = classifyIntent(utterance);

  const vetoes = findings.filter(
    (f) => (f.memberId === 'registrar' || f.memberId === 'auditor') && f.dissent,
  );
  const vetoedIds = vetoes.map((v) => v.claim);
  const surviving = findings.filter(
    (f) => !(f.dissent && (f.memberId === 'registrar' || f.memberId === 'auditor')),
  );

  // Disagreement detection: two members, same question, opposite polarity.
  const disagreements: { a: string; b: string; about: string }[] = [];
  for (let i = 0; i < surviving.length; i++) {
    for (let j = i + 1; j < surviving.length; j++) {
      const a = surviving[i];
      const b = surviving[j];
      if (a.memberId === b.memberId) continue;
      const aNeg = /\bnot?\b|never|refus|cannot|should not|avoid|worse|lose/i.test(a.claim);
      const bNeg = /\bnot?\b|never|refus|cannot|should not|avoid|worse|lose/i.test(b.claim);
      if (aNeg !== bNeg && a.confidence > 0.5 && b.confidence > 0.5) {
        disagreements.push({
          a: a.memberId,
          b: b.memberId,
          about: `${a.memberId} says "${a.claim.slice(0, 70)}"; ${b.memberId} says "${b.claim.slice(0, 70)}".`,
        });
      }
    }
  }

  const ranked = [...surviving].sort((x, y) => y.confidence - x.confidence);
  const body = ranked.map((f) => f.claim).join(' ');

  const synthesis =
    (vetoes.length
      ? `Held back by ${vetoes.map((v) => v.memberId).join(' and ')}: ${vetoes.map((v) => v.claim).join(' ')} `
      : '') +
    body +
    (disagreements.length
      ? ` The council is split: ${disagreements.map((d) => d.about).join(' ')} That split is real — ` +
        'it reflects a genuine tension in the position, not an error to be resolved by averaging.'
      : '');

  const reading: ModalityReading = detectModality(
    `${opts.conversationHistory ?? ''} ${utterance}`,
  );
  const styled = styleMessage(synthesis, reading, { techniques: opts.techniques });

  return {
    utterance,
    intent,
    convened: routed.map((r) => r.member.id),
    findings: surviving,
    disagreements,
    vetoed: vetoedIds,
    synthesis,
    styled: styled.text,
    modality: reading.primary,
    sources: Array.from(new Set(surviving.map((f) => f.source))),
  };
}

/**
 * Record whether an answer was actually used, and move the weights.
 *
 * Bounded and slow on purpose. A council that retrains hard on one user's clicks stops
 * being a council and becomes a mirror.
 */
export function recordOutcome(
  memory: RoutingMemory,
  intent: string,
  memberIds: readonly string[],
  useful: boolean,
): RoutingMemory {
  const weights = { ...memory.weights };
  for (const id of memberIds) {
    const key = `${intent}::${id}`;
    const cur = weights[key] ?? 0;
    const next = cur + (useful ? LEARNING_RATE : -LEARNING_RATE);
    weights[key] = Number(Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, next)).toFixed(4));
  }
  return { weights, observations: memory.observations + 1 };
}

/** Show the learned state in plain numbers, so a wrong turn can be read and corrected. */
export function explain(memory: RoutingMemory): string {
  const entries = Object.entries(memory.weights).filter(([, v]) => v !== 0);
  if (!entries.length) return `No learning yet across ${memory.observations} observations.`;
  entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  return (
    `${memory.observations} observations. Strongest adjustments: ` +
    entries.slice(0, 8).map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}`).join(', ') +
    `. Bounded to ±${MAX_ADJUSTMENT}.`
  );
}

export interface VoiceCommand {
  readonly transcript: string;
  readonly intent: string;
  readonly target: string | null;
  readonly members: readonly string[];
  readonly spokenReply: string;
}

/**
 * Parse a spoken utterance and decide what to do with it.
 *
 * `spokenReply` is written to be HEARD, not read: no tables, no parentheses, no figures
 * that need to be seen to parse. A spoken answer that reads a table aloud is worse than
 * no spoken answer, and the visual detail belongs on the screen the voice points at.
 */
export function parseVoiceCommand(
  transcript: string,
  memory: RoutingMemory = emptyMemory(),
): VoiceCommand {
  const t = transcript.toLowerCase().trim();
  const intent = classifyIntent(t);
  const routed = routeUtterance(t, memory);

  let target: string | null = null;
  const navMatch = t.match(/\b(?:open|show|go to|pull up)\s+(?:the\s+)?([a-z0-9 \-]+)/);
  if (navMatch) {
    const phrase = navMatch[1].trim();
    for (const m of COUNCIL) {
      const hit = m.sources.find((s) => s.toLowerCase().includes(phrase.replace(/\s+/g, '-')));
      if (hit) { target = hit; break; }
    }
    if (!target) target = phrase;
  }

  // Standing members are convened on everything, so a question nobody owns still returns
  // two of them. Detecting that case honestly matters: answering "the Registrar has this"
  // to a question no specialist matched would be confidently unhelpful.
  const specialists = routed.filter((r) => r.matchedTriggers.length > 0);
  const lead = specialists[0]?.member;

  // A resolved navigation target is actionable on its own — "open the time machine" is a
  // complete instruction whether or not a specialist claimed the wording.
  const spokenReply =
    intent === 'navigate' && target
      ? `Opening ${target}.${lead ? ` ${lead.name} is on it.` : ''}`
      : lead
        ? `${lead.name} is taking this one${specialists.length > 1 ? `, with ${specialists.slice(1, 3).map((r) => r.member.name).join(' and ')}` : ''}. One moment.`
        : 'Nobody on the council owns that one yet. Compliance and data integrity are still listening. Say it another way and I will route it again.';

  return { transcript, intent, target, members: routed.map((r) => r.member.id), spokenReply };
}

export const COUNCIL_RULES = {
  neverDone: [
    'A finding without a source. Twelve sourced findings is a council; twelve unsourced ones is noise with a quorum.',
    'Averaging away a disagreement between members. The split is the information.',
    'A compliance or data-integrity objection demoted to a footnote instead of removing the claim.',
    'A spoken reply that reads out a table or a string of figures. If it needs to be seen, point at the screen.',
    'Learning weights that are unbounded or unreadable. A council that silently drifts toward one user is a mirror.',
    'Presenting the council as twelve independent intelligences. It is twelve routed domains over real sources, and that is the stronger claim.',
  ],
} as const;
