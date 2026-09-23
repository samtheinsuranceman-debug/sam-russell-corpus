/**
 * WHICH STRATEGIES FIT THIS GENOME — the layer that was missing.
 *
 * ## The problem this solves
 *
 * `wealthGenomeFactors.ts` reads twenty-one factors and draws a solid. It
 * answers "what is this person like?" with more precision than anything else
 * in the system. It does not answer the question the person actually came in
 * with, which is "so what should I do?".
 *
 * Without this file the genome is a beautiful object that nobody can act on.
 * A reader clicks Insurability, learns their band is 0.68–1.67, and has no
 * idea whether that means they should be funding policies or whether the door
 * is closing on them. The shape is the diagnosis; this is the formulary.
 *
 * ## How a fit is computed, and why it is not a recommendation
 *
 * Every strategy declares which factors argue FOR it and which argue AGAINST,
 * with a stated reason per signal. A reading of +2 on a factor a strategy
 * wants high contributes its full weight; a reading of -2 contributes the
 * negative of it; an unanswered factor contributes NOTHING and drags the
 * confidence down. That last property is the important one: a strategy cannot
 * score well because the questions that would have counted against it were
 * never asked.
 *
 * The output is a fit percentage AND a confidence. Both are shown, always,
 * together. A 91% fit at 20% confidence is not a finding — it is a prompt to
 * go and ask four more questions, and the page says so in those words.
 *
 * ## Gates are not signals
 *
 * Some things are not a matter of degree. You cannot fund a life insurance
 * policy you cannot be issued. You cannot take a Reg D oil and gas
 * participation without accreditation. A gate is checked separately from the
 * fit score and can mark a strategy BLOCKED at any fit level, because a
 * hundred-percent fit to something unavailable is worse than useless — it is
 * a promise nobody can keep.
 *
 * Gates marked `external` cannot be settled by any genome reading at all.
 * They are facts somebody has to go and confirm, and the page shows them as
 * open questions rather than quietly assuming them true.
 *
 * ## Allocation, for the strategies where "how much" is the real question
 *
 * "Should I own bitcoin?" is the wrong question and "how much of this person
 * should be in bitcoin?" is the right one. Strategies that are a matter of
 * proportion carry an `allocation` band derived from the genome rather than
 * from a rule of thumb, with the basis stated.
 *
 * ## What is NOT in here
 *
 * No product performance figures are asserted anywhere in this file. Where a
 * strategy is associated with a specific product claim — a bonus percentage,
 * a historical credit, a carrier's standing — that claim is recorded as a
 * `ProductClaim` with its status, and an unconfirmed claim renders as
 * unconfirmed. A fit engine that quietly repeated a sales figure would be a
 * worse thing than no fit engine.
 */

import { FACTORS, personalWeights, type FactorReading } from './wealthGenomeFactors';
// The registry is long enough to deserve its own file. It imports only TYPES
// from here, so the cycle is erased at compile time and there is none at runtime.
import { STRATEGIES } from './genomeStrategies';

// ─── Claims ──────────────────────────────────────────────────────────────────

/**
 * Something said about a product, and whether this system has established it.
 *
 * `needs-correction` exists because some claims that reach us are close to
 * true and wrong in a way that matters. Recording those as simply
 * "unconfirmed" would lose the correction, and the correction is the valuable
 * part.
 */
export interface ProductClaim {
  /** The claim as it was told to us, not as we would phrase it. */
  readonly claim: string;
  readonly status: 'confirmed' | 'unconfirmed' | 'needs-correction';
  /** What is actually established, or what the claim is missing. */
  readonly note: string;
  /** The specific document or record that would settle it. */
  readonly settledBy?: string;
}

// ─── Signals and gates ───────────────────────────────────────────────────────

export interface Signal {
  readonly factorId: string;
  /** 'high' means a high score on this factor argues FOR the strategy. */
  readonly wants: 'high' | 'low';
  /** 0–1. How strongly this factor argues, relative to the strategy's others. */
  readonly weight: number;
  readonly why: string;
}

export type GateStatus = 'open' | 'blocked' | 'unknown';

export interface Gate {
  readonly id: string;
  /** The requirement in the client's own language. */
  readonly requirement: string;
  /** The factor that settles it, where the genome can settle it at all. */
  readonly factorId?: string;
  /** Blocked when the reading is at or beyond this. */
  readonly test?: { readonly direction: 'atLeast' | 'atMost'; readonly score: number };
  /** Why this is a gate and not merely a preference. */
  readonly why: string;
  /** True when no reading can settle it — somebody has to go and find out. */
  readonly external?: boolean;
}

export interface AllocationBand {
  readonly minPct: number;
  readonly maxPct: number;
  /** Where the band came from. Shown, not hidden. */
  readonly basis: string;
}

export type StrategyFamily =
  | 'property'
  | 'insurance-structure'
  | 'credit-arbitrage'
  | 'tax-alpha'
  | 'markets'
  | 'debt-elimination'
  | 'method';

export const FAMILY_LABEL: Record<StrategyFamily, string> = {
  property: 'Property',
  'insurance-structure': 'Insurance structure',
  'credit-arbitrage': 'Credit and arbitrage',
  'tax-alpha': 'Tax',
  markets: 'Markets',
  'debt-elimination': 'Debt elimination',
  method: 'Method',
};

export const FAMILY_ORDER: readonly StrategyFamily[] = [
  'method', 'property', 'insurance-structure', 'credit-arbitrage',
  'tax-alpha', 'debt-elimination', 'markets',
];

/** Whether this firm actually does the thing. Stated, not implied. */
export type HousePosition = 'implements' | 'implements-with-conditions' | 'declines' | 'refers-out';

export interface Strategy {
  readonly id: string;
  readonly name: string;
  readonly family: StrategyFamily;
  /** One line, in the client's language, for a card. */
  readonly oneLine: string;
  /** What it actually is. Paragraphs, honest, no pitch. */
  readonly whatItIs: readonly string[];
  readonly signals: readonly Signal[];
  readonly gates: readonly Gate[];
  /**
   * Present when the real question is proportion rather than yes or no.
   * Takes the fit (0–100) and returns the band this genome supports.
   */
  readonly allocation?: (fit: number) => AllocationBand;
  /** The case against, for the person this is wrong for. Always populated. */
  readonly whenItIsWrong: string;
  readonly housePosition: HousePosition;
  readonly housePositionWhy: string;
  readonly claims: readonly ProductClaim[];
  /** Pages in this application that go deeper. */
  readonly relatedPaths: readonly string[];
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export interface Driver {
  readonly factorId: string;
  readonly name: string;
  /** Signed. Positive argues for the strategy, negative against. */
  readonly contribution: number;
  readonly why: string;
}

export interface GateResult {
  readonly gate: Gate;
  readonly status: GateStatus;
  readonly note: string;
}

export interface StrategyFit {
  readonly strategy: Strategy;
  /** 0–100. Never read without `confidence` beside it. */
  readonly fit: number;
  /** 0–1. How much of the strategy's evidence has actually been gathered. */
  readonly confidence: number;
  readonly gates: readonly GateResult[];
  readonly blocked: boolean;
  /** Names of the factors this strategy depends on that nobody has answered. */
  readonly unanswered: readonly string[];
  readonly allocation?: AllocationBand;
  /** Strongest arguments for, then strongest against. */
  readonly drivers: readonly Driver[];
}

const FACTOR_BY_ID = new Map(FACTORS.map((f) => [f.id, f]));
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round = (n: number, p = 3) => Math.round(n * 10 ** p) / 10 ** p;

/** Confidence below this means the factor has not really been answered. */
export const ANSWERED_THRESHOLD = 0.3;

function evaluateGate(gate: Gate, by: Map<string, FactorReading>): GateResult {
  if (gate.external || !gate.factorId || !gate.test) {
    return {
      gate,
      status: 'unknown',
      note: 'Nothing in the genome settles this. Somebody has to confirm it before the strategy is real.',
    };
  }
  const r = by.get(gate.factorId);
  if (!r || r.confidence < ANSWERED_THRESHOLD) {
    return { gate, status: 'unknown', note: `Not established yet — ${FACTOR_BY_ID.get(gate.factorId)?.name ?? gate.factorId} has not been read.` };
  }
  const fails = gate.test.direction === 'atMost' ? r.score <= gate.test.score : r.score >= gate.test.score;
  return {
    gate,
    status: fails ? 'blocked' : 'open',
    note: fails
      ? `Closed on the current reading. This is not a scoring penalty — the strategy is unavailable until this changes.`
      : `Open on the current reading.`,
  };
}

/**
 * Score one strategy against a genome.
 *
 * An unanswered factor contributes zero to the numerator AND zero to the
 * denominator, so it neither helps nor hurts the fit — it lowers confidence
 * instead. That is the only honest treatment: the alternative, treating
 * silence as neutral evidence, lets a strategy look well-supported because
 * the questions that would have sunk it were never asked.
 */
export function fitStrategy(strategy: Strategy, readings: readonly FactorReading[]): StrategyFit {
  const by = new Map(readings.map((r) => [r.factorId, r]));
  const personal = personalWeights(readings);

  let numerator = 0;
  let denominator = 0;
  let confWeighted = 0;
  let confTotal = 0;
  const drivers: Driver[] = [];
  const unanswered: string[] = [];

  for (const sig of strategy.signals) {
    const factor = FACTOR_BY_ID.get(sig.factorId);
    if (!factor) continue;
    const personalWeight = personal[sig.factorId] ?? 0.5;
    const effective = sig.weight * personalWeight;
    confTotal += effective;

    const r = by.get(sig.factorId);
    if (!r || r.confidence < ANSWERED_THRESHOLD) {
      unanswered.push(factor.name);
      continue;
    }

    confWeighted += effective * clamp(r.confidence, 0, 1);
    // -2..+2 becomes -1..+1, then flips when the strategy wants the low pole.
    const normalised = clamp(r.score, -2, 2) / 2;
    const aligned = sig.wants === 'high' ? normalised : -normalised;
    const contribution = aligned * effective * clamp(r.confidence, 0, 1);

    numerator += contribution;
    denominator += effective * clamp(r.confidence, 0, 1);
    drivers.push({ factorId: sig.factorId, name: factor.name, contribution: round(contribution), why: sig.why });
  }

  const balance = denominator > 0 ? numerator / denominator : 0;
  const fit = Math.round(((balance + 1) / 2) * 100);
  const confidence = confTotal > 0 ? round(confWeighted / confTotal) : 0;

  const gates = strategy.gates.map((g) => evaluateGate(g, by));
  const blocked = gates.some((g) => g.status === 'blocked');

  drivers.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    strategy,
    fit,
    confidence,
    gates,
    blocked,
    unanswered,
    allocation: strategy.allocation?.(fit),
    drivers,
  };
}

/** Every strategy scored, best fit first, with blocked ones sorted to the end. */
export function fitAll(readings: readonly FactorReading[]): readonly StrategyFit[] {
  return STRATEGIES.map((s) => fitStrategy(s, readings)).sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    return b.fit - a.fit;
  });
}

/**
 * The single most useful output: which unanswered question would move the most
 * strategy fits the furthest.
 *
 * Ranked by how much total strategy weight rides on a factor nobody has read.
 * This is what turns the genome from a picture into a conversation.
 */
export function highestValueQuestions(
  readings: readonly FactorReading[],
  limit = 5,
): ReadonlyArray<{ factorId: string; name: string; question: string; strategiesWaiting: number; leverage: number }> {
  const by = new Map(readings.map((r) => [r.factorId, r]));
  const personal = personalWeights(readings);
  const tally = new Map<string, { weight: number; count: number }>();

  for (const strategy of STRATEGIES) {
    for (const sig of strategy.signals) {
      const r = by.get(sig.factorId);
      if (r && r.confidence >= ANSWERED_THRESHOLD) continue;
      const prev = tally.get(sig.factorId) ?? { weight: 0, count: 0 };
      tally.set(sig.factorId, {
        weight: prev.weight + sig.weight * (personal[sig.factorId] ?? 0.5),
        count: prev.count + 1,
      });
    }
  }

  return Array.from(tally.entries())
    .map(([factorId, t]) => {
      const f = FACTOR_BY_ID.get(factorId)!;
      return { factorId, name: f.name, question: f.question, strategiesWaiting: t.count, leverage: round(t.weight) };
    })
    .sort((a, b) => b.leverage - a.leverage)
    .slice(0, limit);
}

export function strategy(id: string): Strategy | undefined {
  return STRATEGIES.find((s) => s.id === id);
}

export const STRATEGY_COUNT = (): number => STRATEGIES.length;

/** The standing note under every fit on the page. */
export const FIT_DISCLOSURE =
  'A fit percentage is a reading of this configuration against a strategy, not a recommendation and not an offer. ' +
  'It is only worth what the confidence beside it says it is worth: a high fit at low confidence means the questions ' +
  'that would have argued against it have not been asked yet. Gates marked unknown are facts nobody has confirmed. ' +
  'Product figures anywhere in this section are shown with their status, and an unconfirmed figure is not a figure. ' +
  'Nothing here substitutes for your own attorney, CPA and a licensed professional in the relevant product line.';

export { STRATEGIES };

/**
 * Where the typed-in numbers in this file come from. All three are the firm's
 * own scoring choices; none is a market or regulatory figure. The factor
 * weights themselves come from wealthGenomeFactors.ts.
 */
export const GENOME_STRATEGY_FIT_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "Assumption: a factor counts as answered at a confidence of 0.3 or more (ANSWERED_THRESHOLD), chosen by the firm because below that a reading is closer to a guess than an answer and should lower confidence instead of moving the fit; no external source" },
  { label: "Assumption: a factor with no personal weight yet is weighted 0.5 (used twice, in the fit and in the list of questions still to ask), chosen by the firm because the midpoint neither inflates nor hides a factor nobody has weighed; no external source" },
];
