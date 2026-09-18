// ============================================================
// SEQUENCE ORDERINGS — the same mechanisms, put in a different order.
//
// ## Why this file exists separately from cycleScenarios.ts
//
// cycleScenarios.ts answers "which mechanisms, and for whom". It carries one
// canonical order per scenario. That is the right answer to the wrong half of
// the question, because the mechanisms are not commutative: velocity → BRRRR
// and BRRRR → velocity use the same two tools and are different plans with
// different failure modes, and an equity-share taken AFTER a line of credit is
// not a worse plan — it is a plan the covenant forbids outright.
//
// So this file models ORDER as its own object, with three ideas.
//
// ## 1. Position is a role, not a number
//
// A mechanism first in a sequence is a SOURCE: it has to produce capital from
// a standing start. In the middle it is a CONVERTER: it takes capital in and
// hands more capital on. Last it is a SINK: it is where the household ends up
// living, and it has to be somewhere worth living.
//
// The same mechanism is good at different roles. Velocity banking is the best
// source on the list — no ramp, no new asset, no underwriting beyond the line
// — and close to useless as a sink, because it is an income-compression engine
// and there is nothing left to compress once the sequence ends. An equity
// share is an excellent source and the worst possible sink: ending a plan on a
// ten-year balloon is ending it on a date you did not choose.
//
// That asymmetry is why reordering changes the answer, and ROLE_FITNESS is
// where it is written down.
//
// ## 2. Some orders are not merely worse — they are illegal
//
// HARD rules encode contract terms, not preferences. A home equity investment
// agreement carries a no-further-encumbrance covenant, so a HELOC opened
// behind one needs the provider's consent and usually does not get it. The
// same agreement settles on sale, so a property carrying one cannot be sold on
// a wrap without settling first. Both are in the paperwork; neither is in the
// marketing. legalOrderings() removes the permutations they forbid, which is
// why several combinations below have far fewer live orderings than their
// factorial suggests.
//
// ## 3. What we assert, and how sure we are
//
// Each annotated ordering carries three numbers that are deliberately
// different from one another:
//
//   sharePct   — of the households that run THIS combination, what fraction
//                should run it in THIS order. Shares within a combination sum
//                to 100 with the rest carried as `residualPct`, so the file
//                cannot quietly claim every ordering is the best one.
//   confidence — 1–10, how well-supported the claim is. A contract term is a
//                9; a judgement about sequencing preference is a 5.
//   likelihood — 1–10, the chance a normal household under ordinary
//                circumstances ever needs this ordering at all. Low is not an
//                insult: the rescue orderings are 2s because most people are
//                not in a rescue.
//
// A high sharePct with a low likelihood is the common and correct shape: "if
// you are in this situation, do it this way — and you are probably not in this
// situation." Marketing collapses those two numbers into one. They are not one.
//
// The derived plausibility() score is computed from the rules alone and never
// reads sharePct. A test asserts the hand-written top pick is not one the rules
// rank in the bottom half, so a judgement that contradicts the encoded contract
// terms fails the build instead of shipping.
// ============================================================

import { type MechanismId, MECHANISMS } from './cycleEngine';

/** Where a mechanism sits, which is what it is being asked to do. */
export type Role = 'source' | 'converter' | 'sink';

export const ROLE_MEANING: Record<Role, string> = {
  source: 'First. Must produce capital from a standing start, with nothing upstream to draw on.',
  converter: 'In the middle. Takes capital in and hands more capital on; judged on throughput, not on where it leaves you.',
  sink: 'Last. Where the household actually ends up living, so it has to be somewhere worth living.',
};

/** The role a position carries in a sequence of the given length. */
export function roleAt(index: number, length: number): Role {
  if (index === 0) return 'source';
  if (index === length - 1) return 'sink';
  return 'converter';
}

export interface RoleFit {
  /** 0–10. How well this mechanism performs this role. */
  readonly fit: number;
  /** What the mechanism is actually doing when it sits here. */
  readonly meaning: string;
}

export const ROLE_FITNESS: Record<MechanismId, Record<Role, RoleFit>> = {
  'policy-loan': {
    source: {
      fit: 5,
      meaning:
        'Starting the funding period. Produces nothing usable for ten to fifteen years, so as a source it only works when the sequence is explicitly a long one and the next step is not waiting on it.',
    },
    converter: {
      fit: 6,
      meaning:
        'Borrowing against accumulated cash value to fund the next step while the full balance keeps being credited. The only converter on the list that does not remove capital from the thing that was producing.',
    },
    sink: {
      fit: 9,
      meaning:
        'Where proceeds come to rest. Liquid, not correlated to the property market, and the death benefit reprices the whole plan as an estate rather than a portfolio. The best terminal state here.',
    },
  },
  'velocity-heloc': {
    source: {
      fit: 9,
      meaning:
        'The cheapest possible start: no new asset, no ramp, no underwriting beyond the line itself, and the effect is computable from a bank statement before anything is signed.',
    },
    converter: {
      fit: 7,
      meaning:
        'Compressing the gap between turns. Holds acquisition capital at a falling balance instead of a static one, which is worth roughly the line rate on the average daily balance.',
    },
    sink: {
      fit: 3,
      meaning:
        'Nearly pointless. Velocity compresses an income stream against a balance; at the end of a sequence the balance is what you were trying to eliminate. Ending here means the plan never arrived anywhere.',
    },
  },
  'brrrr-dscr': {
    source: {
      fit: 4,
      meaning:
        'Self-funded acquisition. Possible only with reserve already in hand, which is exactly the constraint the rest of the list exists to relieve — so as a source it usually means the sequence did not need a sequence.',
    },
    converter: {
      fit: 9,
      meaning:
        'The engine of the middle. Takes capital in, returns roughly 75% of the after-repair value out, and leaves behind an obligation a tenant retires. The only converter that amortises.',
    },
    sink: {
      fit: 7,
      meaning:
        'Ending on held property. Solid, but illiquid and rate-exposed at every future refinance, so it is a good ending rather than the best one.',
    },
  },
  'equity-share': {
    source: {
      fit: 9,
      meaning:
        'The unlock. No payment means no debt-service test, which reaches a household no lender will underwrite. As a first move for the documentation-poor it is often the only move.',
    },
    converter: {
      fit: 3,
      meaning:
        'Poor. The no-further-encumbrance covenant closes off the tools that would normally come next, so it narrows the sequence at the exact point a converter is supposed to widen it.',
    },
    sink: {
      fit: 2,
      meaning:
        'The worst ending available. A ten-year settlement on a date you do not choose, sized to a share of a value you do not control, with nothing amortising in the meantime.',
    },
  },
  'seller-wrap': {
    source: {
      fit: 6,
      meaning:
        'Acquiring on paper with no institution involved — fast, and available when nothing else is. Carries due-on-sale exposure from day one of the sequence rather than late in it.',
    },
    converter: {
      fit: 7,
      meaning:
        'Turning a carried note back into capital by hypothecating or partially selling it, without ending the instrument. Genuinely useful throughput with a counterparty attached.',
    },
    sink: {
      fit: 6,
      meaning:
        'Ending as the note holder. Income without management, which is a real outcome — undercut by the balloon most seller notes carry and by a payer who has to keep paying.',
    },
  },
};

export interface OrderRule {
  readonly id: string;
  /** This mechanism must (hard) or should (soft) come before the other. */
  readonly before: MechanismId;
  readonly after: MechanismId;
  /** hard = the paperwork forbids the reverse. soft = the reverse is legal and usually worse. */
  readonly strength: 'hard' | 'soft';
  /** Penalty applied to plausibility when a soft rule is violated. Hard rules are not scored; they prune. */
  readonly penalty: number;
  readonly why: string;
}

/**
 * HARD rules are contract terms. Both live ones come off the same instrument,
 * which is the honest headline about equity-share agreements: the cost is not
 * only the settlement multiple, it is that the agreement closes doors behind
 * it. Neither term appears in any provider's marketing.
 */
export const ORDER_RULES: readonly OrderRule[] = [
  {
    id: 'hei-before-line',
    before: 'equity-share',
    after: 'velocity-heloc',
    strength: 'hard',
    penalty: 0,
    why: 'A home equity investment agreement carries a no-further-encumbrance covenant. A line of credit opened against the same property afterwards requires the provider\'s written consent, and is routinely refused. Take the line first or do not take it.',
  },
  {
    id: 'hei-before-wrap',
    before: 'equity-share',
    after: 'seller-wrap',
    strength: 'hard',
    penalty: 0,
    why: 'The agreement settles on sale. A property carrying one cannot be sold on a wrap without settling first, which consumes the proceeds the wrap was supposed to create.',
  },
  {
    id: 'hei-funds-acquisition',
    before: 'equity-share',
    after: 'brrrr-dscr',
    strength: 'soft',
    penalty: 9,
    why: 'The equity share exists to produce the capital the acquisition needs. Taking it after the property is already financed means paying an equity-share cost for money the DSCR loan had already provided.',
  },
  {
    id: 'surplus-before-paper',
    before: 'velocity-heloc',
    after: 'seller-wrap',
    strength: 'soft',
    penalty: 5,
    why: 'Velocity produces the surplus that covers a carried note\'s bad month. Carrying paper first means discovering the surplus was needed on the month it is not there.',
  },
  {
    id: 'note-income-funds-premium',
    before: 'seller-wrap',
    after: 'policy-loan',
    strength: 'soft',
    penalty: 4,
    why: 'Note income is the cleanest premium source there is: contractual, monthly, and not dependent on a tenant or an appraisal. Funding a policy first and carrying paper later reverses a dependency for no gain.',
  },
];

/** Hard rules only — the ones that make an ordering impossible rather than unwise. */
export function hardRules(): readonly OrderRule[] {
  return ORDER_RULES.filter((r) => r.strength === 'hard');
}

/** Rules an ordering violates. An ordering violating any hard rule is not legal. */
export function violations(order: readonly MechanismId[]): readonly OrderRule[] {
  const at = new Map(order.map((m, i) => [m, i]));
  return ORDER_RULES.filter((r) => {
    const b = at.get(r.before);
    const a = at.get(r.after);
    return b !== undefined && a !== undefined && b > a;
  });
}

export function isLegal(order: readonly MechanismId[]): boolean {
  return !violations(order).some((r) => r.strength === 'hard');
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [items.slice()];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) out.push([item, ...p]);
  });
  return out;
}

/** Every ordering of a combination that no contract term forbids. */
export function legalOrderings(members: readonly MechanismId[]): MechanismId[][] {
  return permutations(members).filter(isLegal);
}

/**
 * How plausible an ordering is, from the rules alone — role fitness for every
 * position, less the penalty for each soft rule it runs against. Never reads
 * sharePct, so it is an independent check on the hand-written judgement.
 */
export function plausibility(order: readonly MechanismId[]): number {
  if (order.length === 0) return 0;
  if (!isLegal(order)) return 0;
  const fitness =
    order.reduce((sum, m, i) => sum + ROLE_FITNESS[m][roleAt(i, order.length)].fit, 0) / order.length;
  const penalty = violations(order)
    .filter((r) => r.strength === 'soft')
    .reduce((sum, r) => sum + r.penalty, 0);
  return Math.max(0, Math.min(100, Math.round(fitness * 10 - penalty)));
}

/** Legal orderings, best first by the derived score. */
export function rankedOrderings(members: readonly MechanismId[]): Array<{ order: MechanismId[]; plausibility: number }> {
  return legalOrderings(members)
    .map((order) => ({ order, plausibility: plausibility(order) }))
    .sort((a, b) => b.plausibility - a.plausibility || a.order.join().localeCompare(b.order.join()));
}

export function sequenceKey(order: readonly MechanismId[]): string {
  return order.join(' → ');
}

export function shortLabel(order: readonly MechanismId[]): string {
  return order.map((m) => MECHANISMS.find((x) => x.id === m)?.shortName ?? m).join(' → ');
}

// ============================================================
// THE COMBINATIONS AND THEIR ANNOTATED ORDERINGS
// ============================================================

export interface Combination {
  readonly id: string;
  readonly name: string;
  readonly members: readonly MechanismId[];
  /** What this set of tools is collectively for. */
  readonly premise: string;
  /**
   * Share of households running this combination that land on an ordering we
   * have NOT annotated. Kept explicit so the file cannot imply the annotated
   * orderings are exhaustive — they never are.
   */
  readonly residualPct: number;
}

export interface Ordering {
  readonly comboId: string;
  readonly order: readonly MechanismId[];
  /** Rank within the combination by our judgement, 1 = most likely to be right. */
  readonly rank: number;
  /** Of households running this combination, the fraction that should run it this way. */
  readonly sharePct: number;
  /** 1–10. How well-supported the claim is. Contract terms score high; sequencing taste scores low. */
  readonly confidence: number;
  /** 1–10. Chance a normal household under ordinary circumstances ever needs this ordering. */
  readonly likelihood: number;
  /** Concrete situations where this order is the right one. */
  readonly shinesWhen: readonly string[];
  /** The situation that makes this order the wrong one. */
  readonly failsWhen: string;
  /** What the ordering produces that no individual mechanism does. */
  readonly emergent: string;
}

export const COMBINATIONS: readonly Combination[] = [
  { id: 'T1', name: 'The Household Engine', members: ['policy-loan', 'velocity-heloc', 'brrrr-dscr'], premise: 'Turn an existing surplus into property, then park what the property throws off somewhere it cannot be lost.', residualPct: 10 },
  { id: 'T2', name: 'Unlock and Compress', members: ['policy-loan', 'velocity-heloc', 'equity-share'], premise: 'Reach capital without a debt-service test, then make the household efficient enough to never need that again.', residualPct: 8 },
  { id: 'T3', name: 'The Paper Household', members: ['policy-loan', 'velocity-heloc', 'seller-wrap'], premise: 'Skip institutions entirely: compress the household, carry paper, store the yield.', residualPct: 12 },
  { id: 'T4', name: 'Unlock and Acquire', members: ['policy-loan', 'brrrr-dscr', 'equity-share'], premise: 'Convert dead primary-residence equity into an income property, then into a store of value.', residualPct: 10 },
  { id: 'T5', name: 'The Private Bank', members: ['policy-loan', 'brrrr-dscr', 'seller-wrap'], premise: 'Own the financing on both sides — buy on paper, refinance institutionally, bank the result privately.', residualPct: 12 },
  { id: 'T6', name: 'The Documentation Exit', members: ['policy-loan', 'equity-share', 'seller-wrap'], premise: 'For a household with equity and no provable income: extract, convert to paper, store.', residualPct: 8 },
  { id: 'T7', name: 'The Documentation Escape', members: ['velocity-heloc', 'brrrr-dscr', 'equity-share'], premise: 'Escape the underwriting trap: use the one product with no income test to buy the asset that creates a provable one.', residualPct: 8 },
  { id: 'T8', name: "The Operator's Triangle", members: ['velocity-heloc', 'brrrr-dscr', 'seller-wrap'], premise: 'Three mechanisms that all amortise. The only combination here with no balloon anywhere in it.', residualPct: 12 },
  { id: 'T9', name: 'The Thin-File Ladder', members: ['velocity-heloc', 'equity-share', 'seller-wrap'], premise: 'Every tool available to a household an institution will not underwrite, in the only order the covenants permit.', residualPct: 6 },
  { id: 'T10', name: 'The Portfolio Bootstrap', members: ['brrrr-dscr', 'equity-share', 'seller-wrap'], premise: 'Start a portfolio from home equity alone, with no W-2 and no reserve.', residualPct: 10 },
  { id: 'Q1', name: 'The Unlocked Household Bank', members: ['policy-loan', 'velocity-heloc', 'brrrr-dscr', 'equity-share'], premise: 'The full household toolkit for an owner whose income will not document.', residualPct: 15 },
  { id: 'Q2', name: 'The Complete Household Bank', members: ['policy-loan', 'velocity-heloc', 'brrrr-dscr', 'seller-wrap'], premise: 'Four mechanisms, no equity-share, no balloon on the primary residence. The durable version.', residualPct: 15 },
  { id: 'Q3', name: 'The Thin-File Complete', members: ['policy-loan', 'velocity-heloc', 'equity-share', 'seller-wrap'], premise: 'Everything available without institutional underwriting, ending somewhere safe.', residualPct: 12 },
  { id: 'Q4', name: 'The Rescue Quad', members: ['policy-loan', 'brrrr-dscr', 'equity-share', 'seller-wrap'], premise: 'A household in trouble with equity: unlock it, convert it, and end holding an instrument rather than an obligation.', residualPct: 15 },
  { id: 'Q5', name: "The Operator's Unlock", members: ['velocity-heloc', 'brrrr-dscr', 'equity-share', 'seller-wrap'], premise: 'Everything but the policy — maximum throughput, no long ramp, and therefore no soft landing.', residualPct: 15 },
  { id: 'F1', name: 'The Full Stack', members: ['policy-loan', 'velocity-heloc', 'brrrr-dscr', 'equity-share', 'seller-wrap'], premise: 'All five. Rarely correct, occasionally the only path, and the clearest illustration that order is most of the plan.', residualPct: 20 },
];

export const TRIPLE_ORDERINGS: readonly Ordering[] = [
  /* ---------------- T1 · The Household Engine ---------------- */
  {
    comboId: 'T1', order: ['velocity-heloc', 'brrrr-dscr', 'policy-loan'], rank: 1, sharePct: 55, confidence: 7, likelihood: 7,
    shinesWhen: [
      'A household with a real monthly surplus it is leaving in a checking account, and no investment property yet.',
      'W-2 income that documents easily, so the DSCR loan is the easy part and the down payment is the hard part.',
      'Someone in their thirties or forties with enough working years left for a ten-year policy ramp to finish before it is needed.',
    ],
    failsWhen: 'There is no surplus. Velocity as a source produces nothing from a household spending everything it earns, and the sequence never starts.',
    emergent: 'Each stage feeds the next from a different resource — time, then leverage, then yield — so no single bad year stops the whole chain.',
  },
  {
    comboId: 'T1', order: ['velocity-heloc', 'policy-loan', 'brrrr-dscr'], rank: 2, sharePct: 20, confidence: 6, likelihood: 4,
    shinesWhen: [
      'The household wants the policy funded during peak earning years and is willing to buy property later.',
      'Property in the target market is obviously overpriced right now, so delaying acquisition by a decade is a feature.',
      'An owner over fifty-five who needs the death benefit in force before health becomes a rating problem.',
    ],
    failsWhen: 'The acquisition is time-sensitive. Putting a ten-year ramp between the surplus and the property means the property is bought at a price nobody can forecast.',
    emergent: 'Insurability is captured at the current age, which is the one input in the whole plan that only gets worse with waiting.',
  },
  {
    comboId: 'T1', order: ['brrrr-dscr', 'velocity-heloc', 'policy-loan'], rank: 3, sharePct: 15, confidence: 6, likelihood: 3,
    shinesWhen: [
      'Reserve already in hand — an inheritance, a business sale, a liquidated position — so the acquisition needs no runway.',
      'The household has no surplus yet because the rental income is what will create it.',
      'A first property bought below market where the uplift is known rather than hoped for.',
    ],
    failsWhen: 'The reserve is smaller than it looks. BRRRR as a source consumes the whole all-in cost before the refinance returns anything, and six months of seasoning sit in between.',
    emergent: 'Rent creates the surplus that velocity then compresses, so the second stage is powered by the first rather than by the household budget.',
  },

  /* ---------------- T2 · Unlock and Compress ---------------- */
  {
    comboId: 'T2', order: ['equity-share', 'velocity-heloc', 'policy-loan'], rank: 1, sharePct: 62, confidence: 9, likelihood: 4,
    shinesWhen: [
      'Substantial home equity, and income that will not document — recently self-employed, commission-only, or newly retired.',
      'A line of credit application already declined, which is the usual reason anyone reaches for an equity share at all.',
      'A settlement date ten years out that lands after a known liquidity event: a maturing note, a business sale, a downsize already planned.',
    ],
    failsWhen: 'Nothing is scheduled to arrive before the settlement. The agreement ends in a lump on a date you did not pick, and the plan has ten years to find the money or sell the house.',
    emergent: 'The one product with no debt-service test funds a decade of compression, which is what rebuilds the file the next lender will read.',
  },
  {
    comboId: 'T2', order: ['equity-share', 'policy-loan', 'velocity-heloc'], rank: 2, sharePct: 20, confidence: 6, likelihood: 2,
    shinesWhen: [
      'The proceeds are meant to become an estate rather than working capital — the household wants the money out of reach of itself.',
      'An older owner where the death benefit settles the equity-share obligation and the heirs keep the house.',
      'A health condition that makes capturing insurability now more valuable than compressing a balance now.',
    ],
    failsWhen: 'The household needs liquidity in the first decade. Money inside a young policy is the least available money in this sequence.',
    emergent: 'The death benefit becomes the settlement plan, which converts the equity share from a balloon into a funded obligation.',
  },
  {
    comboId: 'T2', order: ['policy-loan', 'equity-share', 'velocity-heloc'], rank: 3, sharePct: 10, confidence: 4, likelihood: 1,
    shinesWhen: [
      'A policy already funded years ago, so what looks like a ten-year ramp is history rather than a wait.',
      'The equity share is a late top-up to a plan already running, not the unlock that starts it.',
    ],
    failsWhen: 'The policy is new. Starting a ten-year ramp before touching the equity means the household waits a decade for the step that was supposed to relieve the pressure it is under now.',
    emergent: 'Almost none — this order mostly documents an existing policy rather than creating a plan.',
  },

  /* ---------------- T3 · The Paper Household ---------------- */
  {
    comboId: 'T3', order: ['velocity-heloc', 'seller-wrap', 'policy-loan'], rank: 1, sharePct: 58, confidence: 7, likelihood: 4,
    shinesWhen: [
      'A rate environment where institutional money is expensive and a seller with a 3% note is motivated to keep it in place.',
      'A buyer who can pay but cannot document — the classic wrap counterparty.',
      'A household that has already built the surplus and wants income without tenants, toilets or an appraisal queue.',
    ],
    failsWhen: 'The underlying lender calls the loan. The due-on-sale clause is real, and a lender holding a below-market note now has a reason to enforce it that it did not have in 2021.',
    emergent: 'The surplus built in stage one becomes the reserve that survives a missed payment in stage two, which is the failure mode wraps actually die of.',
  },
  {
    comboId: 'T3', order: ['seller-wrap', 'velocity-heloc', 'policy-loan'], rank: 2, sharePct: 18, confidence: 6, likelihood: 3,
    shinesWhen: [
      'The wrap opportunity is in front of you now and will not wait for a household to get tidy.',
      'An owner already selling a property, where carrying the paper is a decision about this transaction rather than a strategy.',
      'The note itself creates the income that velocity will then compress.',
    ],
    failsWhen: 'A payer stops paying in the first year, before any surplus exists to absorb it. Foreclosing on your own wrap while still paying the underlying note is the scenario this order walks into.',
    emergent: 'Note income arrives before the compression starts, so velocity operates on a larger stream than the household could have produced alone.',
  },
  {
    comboId: 'T3', order: ['velocity-heloc', 'policy-loan', 'seller-wrap'], rank: 3, sharePct: 12, confidence: 5, likelihood: 2,
    shinesWhen: [
      'The policy is the point and the wrap is a late yield decision on a property the household already owns.',
      'An owner approaching a sale who wants the instalment-sale tax treatment rather than a lump gain.',
    ],
    failsWhen: 'The household needed the wrap income to fund the premium. This order asks the premium to come from somewhere else for a decade first.',
    emergent: 'The instalment sale spreads a gain across years the policy is already absorbing, which flattens two tax problems into one.',
  },

  /* ---------------- T4 · Unlock and Acquire ---------------- */
  {
    comboId: 'T4', order: ['equity-share', 'brrrr-dscr', 'policy-loan'], rank: 1, sharePct: 60, confidence: 8, likelihood: 4,
    shinesWhen: [
      'Two hundred thousand or more of dead equity in a primary residence and no way to borrow against it.',
      'A self-employed owner two years from a documentable return, who needs the property working before the paperwork catches up.',
      'A market where the renovation uplift genuinely clears 1.34, because below that the acquisition shrinks the capital rather than recycling it.',
    ],
    failsWhen: 'The uplift is ordinary. An equity share costs 9–16% effective; a BRRRR returning 0.885 per turn cannot carry that, and the sequence loses money politely for a decade.',
    emergent: 'Dead equity becomes an amortising asset a tenant pays down — the single cleanest conversion available to a household with no income documentation.',
  },
  {
    comboId: 'T4', order: ['equity-share', 'policy-loan', 'brrrr-dscr'], rank: 2, sharePct: 18, confidence: 5, likelihood: 2,
    shinesWhen: [
      'The equity is extracted for safety rather than for yield — the owner wants it out of the house and somewhere it cannot be lost.',
      'A near-term health or insurability concern that makes the policy the urgent step.',
    ],
    failsWhen: 'The settlement arrives before the property does. A decade of policy ramp inside a ten-year equity-share term leaves no time for the acquisition to produce anything.',
    emergent: 'Little. The two clocks — policy ramp and equity-share settlement — are the same length, which is a coincidence this order cannot exploit.',
  },
  {
    comboId: 'T4', order: ['policy-loan', 'equity-share', 'brrrr-dscr'], rank: 3, sharePct: 12, confidence: 5, likelihood: 2,
    shinesWhen: [
      'An established policy with real cash value, where the equity share tops up a down payment the policy loan nearly covers.',
      'An owner unwilling to take the full equity-share advance and using it only to close a gap.',
    ],
    failsWhen: 'Both sources are drawn at once. Two non-amortising obligations against one household, settling on different dates, is the stack that breaks in year twelve.',
    emergent: 'A smaller equity share than the household would otherwise have taken, which is worth more than it sounds.',
  },

  /* ---------------- T5 · The Private Bank ---------------- */
  {
    comboId: 'T5', order: ['seller-wrap', 'brrrr-dscr', 'policy-loan'], rank: 1, sharePct: 50, confidence: 7, likelihood: 3,
    shinesWhen: [
      'An investor who can find off-market sellers — the whole order depends on that one skill.',
      'A rate environment where seller terms beat bank terms by more than the due-on-sale risk costs.',
      'A property acquired on paper cheaply enough that the DSCR refinance returns the entire acquisition cost.',
    ],
    failsWhen: 'No off-market flow. Without sellers willing to carry, stage one does not exist and the sequence is just a BRRRR with extra steps.',
    emergent: 'Acquisition cost is decoupled from institutional underwriting while the exit stays institutional — the buy side is private and the refinance is not.',
  },
  {
    comboId: 'T5', order: ['brrrr-dscr', 'seller-wrap', 'policy-loan'], rank: 2, sharePct: 25, confidence: 6, likelihood: 3,
    shinesWhen: [
      'An operator already holding renovated property who wants out of management without a taxable lump.',
      'A market where buyers cannot qualify but can pay, so carrying paper sells the property faster and higher.',
      'Portfolio pruning: sell the two worst doors on wraps, keep the rest.',
    ],
    failsWhen: 'The property still carries its DSCR loan. Wrapping around an institutional loan you just placed is the most exposed version of the due-on-sale problem.',
    emergent: 'The operator converts from landlord to note holder gradually, one property at a time, instead of in a single taxable event.',
  },
  {
    comboId: 'T5', order: ['policy-loan', 'brrrr-dscr', 'seller-wrap'], rank: 3, sharePct: 13, confidence: 5, likelihood: 2,
    shinesWhen: [
      'A long-funded policy already carrying enough cash value to buy a property outright.',
      'An owner who wants every acquisition financed privately and every exit to be paper.',
    ],
    failsWhen: 'The policy is young. This order asks the slowest mechanism to be the source, which is the one thing it is worst at.',
    emergent: 'The whole chain runs outside institutional credit except the refinance, which is as close to a closed loop as this list gets.',
  },

  /* ---------------- T6 · The Documentation Exit ---------------- */
  {
    comboId: 'T6', order: ['equity-share', 'seller-wrap', 'policy-loan'], rank: 1, sharePct: 64, confidence: 8, likelihood: 3,
    shinesWhen: [
      'An owner with equity, no documentable income, and no interest in becoming a landlord.',
      'A second property already owned that can be sold on terms, converting it to monthly income immediately.',
      'Someone close to retirement who wants income without management and a death benefit behind it.',
    ],
    failsWhen: 'There is only one property. The equity share is on it, and the agreement settles on sale — so the wrap has nothing to work with.',
    emergent: 'The household exits both underwriting and management in one sequence, which nothing else here does.',
  },
  {
    comboId: 'T6', order: ['equity-share', 'policy-loan', 'seller-wrap'], rank: 2, sharePct: 20, confidence: 6, likelihood: 2,
    shinesWhen: [
      'Insurability is the deadline — a diagnosis pending, an age band about to change.',
      'The sale on terms is years out and known, so the policy fills the gap.',
    ],
    failsWhen: 'Premium has to come from the equity-share proceeds and the sale is late. The policy is funded from a shrinking pot with no income yet arriving.',
    emergent: 'The death benefit covers the equity-share settlement, turning the balloon into a funded liability rather than a deadline.',
  },
  {
    comboId: 'T6', order: ['policy-loan', 'equity-share', 'seller-wrap'], rank: 3, sharePct: 8, confidence: 4, likelihood: 1,
    shinesWhen: [
      'An old policy with substantial cash value, where the equity share is a supplement rather than the unlock.',
    ],
    failsWhen: 'Almost always. Starting a decade-long ramp for a household that reached for an equity share because it needs money now inverts the urgency.',
    emergent: 'Minimal. This order usually describes a plan that already existed rather than one being built.',
  },

  /* ---------------- T7 · The Documentation Escape ---------------- */
  {
    comboId: 'T7', order: ['equity-share', 'velocity-heloc', 'brrrr-dscr'], rank: 1, sharePct: 45, confidence: 8, likelihood: 4,
    shinesWhen: [
      'A household declined for a HELOC on its own home that still needs acquisition capital.',
      'Twelve to twenty-four months of runway available before the acquisition has to happen, which the compression stage uses.',
      'A first investment property where the DSCR loan will document on the rent rather than the owner.',
    ],
    failsWhen: 'The line cannot be opened after the agreement. This is the hard rule in the file: take the line first or accept there will be no line.',
    emergent: 'The household exits the underwriting trap using the one product that does not test income, and arrives holding an asset that creates a documentable one.',
  },
  {
    comboId: 'T7', order: ['equity-share', 'brrrr-dscr', 'velocity-heloc'], rank: 2, sharePct: 40, confidence: 7, likelihood: 5,
    shinesWhen: [
      'The acquisition is time-sensitive — a specific property, a motivated seller, a closing date.',
      'The line of credit will be opened against the investment property later, not against the encumbered primary.',
      'Rental income is what will support the line, so the property has to exist before the line makes sense.',
    ],
    failsWhen: 'The line was always going to be on the primary residence. The covenant closed that door at stage one, and this order only discovers it at stage three.',
    emergent: 'Rent services the line, so the compression stage runs on tenant money rather than household surplus.',
  },
  {
    comboId: 'T7', order: ['brrrr-dscr', 'equity-share', 'velocity-heloc'], rank: 3, sharePct: 7, confidence: 7, likelihood: 1,
    shinesWhen: [
      'A property already acquired and the equity share is a rescue for a renovation that ran over budget.',
    ],
    failsWhen: 'Nearly always, and the rules say so: this scores 24 against 77 for the top order. The equity share is being used to fix a problem rather than to prevent one, and the line behind it may not open at all.',
    emergent: 'None worth the cost. This is the ordering that appears in practice by accident rather than by plan.',
  },

  /* ---------------- T8 · The Operator's Triangle ---------------- */
  {
    comboId: 'T8', order: ['velocity-heloc', 'brrrr-dscr', 'seller-wrap'], rank: 1, sharePct: 52, confidence: 7, likelihood: 5,
    shinesWhen: [
      'An operator building a portfolio who intends to sell some of it on terms rather than hold everything.',
      'A household with surplus, W-2 income and no appetite for a ten-year insurance commitment.',
      'Anyone who wants a plan with no balloon anywhere in it — this combination is the only one here that qualifies.',
    ],
    failsWhen: 'The exit market has buyers who can qualify conventionally. Carrying paper then costs yield for access nobody needed.',
    emergent: 'Every obligation in the chain amortises. There is no date on which something lands whole, which is the property that makes this stackable past three properties.',
  },
  {
    comboId: 'T8', order: ['velocity-heloc', 'seller-wrap', 'brrrr-dscr'], rank: 2, sharePct: 24, confidence: 6, likelihood: 3,
    shinesWhen: [
      'The acquisition itself is on seller terms, and the DSCR refinance is the exit that recycles the capital.',
      'A market where institutional purchase money is slow or expensive but refinance money is available.',
      'An operator buying from retiring landlords, who are the most common source of carry-back terms.',
    ],
    failsWhen: 'The DSCR refinance does not clear coverage at the rate available on the day. The wrap then has to be carried on household money instead of being refinanced away.',
    emergent: 'The seller note is retired by the institutional refinance, which removes the due-on-sale exposure instead of carrying it for years.',
  },
  {
    comboId: 'T8', order: ['seller-wrap', 'velocity-heloc', 'brrrr-dscr'], rank: 3, sharePct: 12, confidence: 5, likelihood: 2,
    shinesWhen: [
      'The wrap is already in place — inherited, or a decision made before any of this was a plan.',
      'Note income is the surplus velocity will compress, because the household has none of its own.',
    ],
    failsWhen: 'The payer is unreliable and no surplus exists yet to cover the underlying note. The sequence is at its most exposed in exactly its first year.',
    emergent: 'A surplus manufactured from paper rather than from wages, which is the only route available to a household with no wage surplus at all.',
  },

  /* ---------------- T9 · The Thin-File Ladder ---------------- */
  {
    comboId: 'T9', order: ['equity-share', 'velocity-heloc', 'seller-wrap'], rank: 1, sharePct: 70, confidence: 9, likelihood: 3,
    shinesWhen: [
      'Equity, no documentable income, and a second property that could be sold on terms.',
      'A household that has been declined everywhere and still has real assets — the most common profile that reaches an equity share.',
      'A ten-year settlement that will be covered by the note receivable created in stage three.',
    ],
    failsWhen: 'The note and the settlement are on the same property. The agreement settles on sale, so that property cannot be the one that gets wrapped.',
    emergent: 'Two of the three hard covenant problems are avoided purely by order — this is the clearest case in the file where sequence, not selection, is the plan.',
  },
  {
    comboId: 'T9', order: ['equity-share', 'seller-wrap', 'velocity-heloc'], rank: 2, sharePct: 24, confidence: 7, likelihood: 2,
    shinesWhen: [
      'The sale on terms is the urgent event and the line of credit is opened later against note income.',
      'A lender willing to underwrite a line against a documented, seasoned note receivable — which requires the note to exist first.',
    ],
    failsWhen: 'No lender will lend against the note. Twelve months of payment history is the usual minimum, and a private note is a hard collateral sell even then.',
    emergent: 'The note becomes the income document the household could not otherwise produce.',
  },

  /* ---------------- T10 · The Portfolio Bootstrap ---------------- */
  {
    comboId: 'T10', order: ['equity-share', 'brrrr-dscr', 'seller-wrap'], rank: 1, sharePct: 56, confidence: 8, likelihood: 3,
    shinesWhen: [
      'Home equity is the household\'s only capital and there is no W-2 to document.',
      'A renovation market with genuine uplift, so the DSCR refinance recycles most of the acquisition cost.',
      'An operator who intends to sell the finished property on terms rather than hold it, converting the whole chain to a note.',
    ],
    failsWhen: 'The first deal is mediocre. There is no second source of capital in this combination — the equity share fires once, and a poor first acquisition ends the sequence.',
    emergent: 'A portfolio started from nothing but home equity, ending as paper rather than as doors.',
  },
  {
    comboId: 'T10', order: ['equity-share', 'seller-wrap', 'brrrr-dscr'], rank: 2, sharePct: 30, confidence: 7, likelihood: 3,
    shinesWhen: [
      'The equity-share cash funds a down payment on a seller-financed purchase, which needs far less than a bank deal.',
      'A seller carrying most of the price, so the advance stretches across a larger acquisition than it could alone.',
      'A DSCR refinance planned to retire the seller note at the twelve-month mark.',
    ],
    failsWhen: 'The refinance is late. Most seller notes carry a balloon, and a DSCR loan that does not clear coverage leaves it with nowhere to go.',
    emergent: 'The advance buys more property than its size suggests, because the seller is carrying the rest — the highest leverage per equity-share dollar available.',
  },
  {
    comboId: 'T10', order: ['brrrr-dscr', 'equity-share', 'seller-wrap'], rank: 3, sharePct: 4, confidence: 6, likelihood: 1,
    shinesWhen: [
      'A renovation already overspent, where the equity share is emergency capital rather than a plan.',
    ],
    failsWhen: 'Nearly always. The rules score this 34 against 80 for the top order: the equity share is paying to fix a deal that should have been sized correctly.',
    emergent: 'None. This is a rescue, and it is listed so it can be recognised rather than recommended.',
  },
];

export const QUAD_ORDERINGS: readonly Ordering[] = [
  /* ---------------- Q1 · The Unlocked Household Bank ---------------- */
  {
    comboId: 'Q1', order: ['equity-share', 'brrrr-dscr', 'velocity-heloc', 'policy-loan'], rank: 1, sharePct: 50, confidence: 7, likelihood: 3,
    shinesWhen: [
      'Real primary-residence equity, no documentable income, and the intention to end up holding property rather than paper.',
      'A line of credit that will be opened against the investment property once it is stabilised, not against the encumbered home.',
      'Enough years left that a policy funded in stage four still has time to become the sink it is meant to be.',
    ],
    failsWhen: 'The equity-share settlement lands before the policy has value. Two long clocks started ten years apart end at the same time, and only one of them has money in it.',
    emergent: 'Four different capital sources, each covering the previous one\'s bottleneck: no income test, then leverage, then compression, then a store that does not correlate with any of them.',
  },
  {
    comboId: 'Q1', order: ['equity-share', 'velocity-heloc', 'brrrr-dscr', 'policy-loan'], rank: 2, sharePct: 35, confidence: 7, likelihood: 3,
    shinesWhen: [
      'A line of credit obtainable on something other than the primary residence — a second home, a vehicle, a securities account.',
      'Twelve to twenty-four months of runway before the acquisition, which compression uses to enlarge the down payment.',
      'A household that wants the surplus habit established before it takes on a tenant and a mortgage.',
    ],
    failsWhen: 'No line is available at all after the agreement. Then stage two is empty and the sequence is really the triple T4 with an extra label.',
    emergent: 'The acquisition is made from a larger and cheaper pool, which raises the odds the renovation uplift clears the 1.34 break-even.',
  },

  /* ---------------- Q2 · The Complete Household Bank ---------------- */
  {
    comboId: 'Q2', order: ['velocity-heloc', 'brrrr-dscr', 'seller-wrap', 'policy-loan'], rank: 1, sharePct: 50, confidence: 8, likelihood: 5,
    shinesWhen: [
      'A documentable household with a genuine surplus that wants the most durable version of this plan.',
      'An operator who will build a portfolio and then sell part of it on terms, converting doors into notes.',
      'Anyone who wants no equity share anywhere in the plan — this is that plan, and it is the one most people should actually run.',
    ],
    failsWhen: 'There is no surplus to start with. Every later stage in this order is funded by the first, and the first is funded by money the household does not have.',
    emergent: 'Three amortising obligations and one liquid sink, with no balloon on the primary residence at any point. The most structurally sound sequence in the file.',
  },
  {
    comboId: 'Q2', order: ['velocity-heloc', 'seller-wrap', 'brrrr-dscr', 'policy-loan'], rank: 2, sharePct: 35, confidence: 7, likelihood: 4,
    shinesWhen: [
      'Acquisition happens on seller terms and the DSCR loan is the refinance that retires the seller note.',
      'A high-rate environment where sellers carry to move property and banks are the expensive option.',
      'An operator with off-market flow, which is the skill this order monetises.',
    ],
    failsWhen: 'The refinance misses coverage and the seller\'s balloon arrives anyway. The order puts a hard date in the middle of the sequence rather than at the end.',
    emergent: 'Due-on-sale exposure exists only between stages two and three, and the refinance extinguishes it. Most wrap plans carry that risk for years; this one carries it for months.',
  },

  /* ---------------- Q3 · The Thin-File Complete ---------------- */
  {
    comboId: 'Q3', order: ['equity-share', 'velocity-heloc', 'seller-wrap', 'policy-loan'], rank: 1, sharePct: 58, confidence: 8, likelihood: 2,
    shinesWhen: [
      'Two properties, no documentable income, and equity in both.',
      'A household that will never satisfy an underwriter and has stopped trying to.',
      'A ten-year settlement that the note receivable from stage three is sized to cover.',
    ],
    failsWhen: 'There is only one property. Every stage after the first then competes for the same asset, and the covenant has already claimed it.',
    emergent: 'A complete plan built without a single institutional underwriting decision, ending in an instrument that pays monthly and a policy that settles the balloon.',
  },
  {
    comboId: 'Q3', order: ['equity-share', 'seller-wrap', 'velocity-heloc', 'policy-loan'], rank: 2, sharePct: 30, confidence: 6, likelihood: 2,
    shinesWhen: [
      'The sale on terms is the urgent event — a buyer in hand, a property that has to move.',
      'A line of credit that will be underwritten against seasoned note income rather than against the household.',
    ],
    failsWhen: 'No lender accepts the note as collateral, which is the common outcome. Stage three then does not happen and the plan is a triple.',
    emergent: 'The note becomes the household\'s income document, which is the only way this profile ever gets underwritten again.',
  },

  /* ---------------- Q4 · The Rescue Quad ---------------- */
  {
    comboId: 'Q4', order: ['equity-share', 'brrrr-dscr', 'seller-wrap', 'policy-loan'], rank: 1, sharePct: 50, confidence: 7, likelihood: 2,
    shinesWhen: [
      'A household under real pressure — job loss, a business that failed, a divorce — with equity as its only remaining asset.',
      'Enough equity that the advance funds a genuine acquisition rather than covering arrears.',
      'An owner who wants to end up holding a note rather than managing property, because capacity is the constraint as much as money.',
    ],
    failsWhen: 'The advance is consumed by living expenses before stage two. The sequence then has an equity-share settlement and nothing bought with it, which is the worst outcome available in this file.',
    emergent: 'A household with no income and no credit ends holding an amortising receivable and a death benefit. It is a long road and it is a real one.',
  },
  {
    comboId: 'Q4', order: ['equity-share', 'seller-wrap', 'brrrr-dscr', 'policy-loan'], rank: 2, sharePct: 35, confidence: 6, likelihood: 2,
    shinesWhen: [
      'A seller willing to carry most of the price, so the advance covers only a small down payment.',
      'The DSCR refinance is planned to retire the seller note and recycle the advance.',
      'A pressured household that needs the smallest possible equity-share advance, which this order permits.',
    ],
    failsWhen: 'The refinance does not clear. A pressured household then faces a seller balloon and an equity-share settlement, which is two hard dates it has no way to meet.',
    emergent: 'The smallest equity share that does the job — worth more here than anywhere else in the file, because this household can least afford the settlement.',
  },

  /* ---------------- Q5 · The Operator's Unlock ---------------- */
  {
    comboId: 'Q5', order: ['equity-share', 'brrrr-dscr', 'velocity-heloc', 'seller-wrap'], rank: 1, sharePct: 48, confidence: 7, likelihood: 2,
    shinesWhen: [
      'A full-time operator with equity, no W-2, and no interest in a ten-year insurance ramp.',
      'A portfolio intended to be traded rather than held, ending in notes rather than doors.',
      'Someone young enough to run this twice, because without a policy there is no soft landing in it.',
    ],
    failsWhen: 'It ends on a wrap. Seller notes carry balloons and payers who can stop paying, so this sequence ends on the two things a terminal state should not have.',
    emergent: 'The highest throughput per year in the file, and the weakest ending. Maximum velocity, no landing gear.',
  },
  {
    comboId: 'Q5', order: ['equity-share', 'velocity-heloc', 'brrrr-dscr', 'seller-wrap'], rank: 2, sharePct: 37, confidence: 6, likelihood: 2,
    shinesWhen: [
      'A line available on something other than the encumbered primary, used to compress before acquiring.',
      'An operator who wants a working-capital buffer in place before taking on renovation risk.',
    ],
    failsWhen: 'The compression stage delays the acquisition past the market. This order trades a year of timing for a buffer, which is right only when the buffer is what was missing.',
    emergent: 'A reserve that survives a renovation overrun, which is the single most common reason a BRRRR sequence stops.',
  },
];

export const FULL_ORDERINGS: readonly Ordering[] = [
  {
    comboId: 'F1', order: ['equity-share', 'brrrr-dscr', 'velocity-heloc', 'seller-wrap', 'policy-loan'], rank: 1, sharePct: 34, confidence: 6, likelihood: 2,
    shinesWhen: [
      'A household with substantial equity, no documentable income, a long horizon and the capacity to actually run five stages.',
      'An operator transitioning out of a business, where the income gap is temporary but long — three to seven years.',
      'A market with genuine renovation uplift above 1.34, without which the middle of this sequence loses money.',
      'A settlement date covered by the note receivable created in stage four.',
      'Someone insurable today who will not be in ten years, which makes the policy sink worth reaching.',
    ],
    failsWhen: 'Any stage is skipped or late. Five stages means five failure points, and the equity-share settlement is running the whole time regardless of how far along the household got.',
    emergent: 'Every bottleneck in the file is covered by some other stage: no income test, then leverage, then compression, then liquidity, then a store that correlates with none of them. It is also the longest exposure to a single hard date.',
  },
  {
    comboId: 'F1', order: ['equity-share', 'velocity-heloc', 'brrrr-dscr', 'seller-wrap', 'policy-loan'], rank: 2, sharePct: 28, confidence: 6, likelihood: 2,
    shinesWhen: [
      'A line of credit available against something other than the encumbered primary residence.',
      'A household that needs a working-capital buffer before it takes renovation risk.',
      'A first acquisition that will be larger and better-capitalised for the delay.',
      'An operator who has failed a renovation before and knows the buffer is the thing that was missing.',
      'A market that is not moving fast, so the year of compression costs nothing in price.',
    ],
    failsWhen: 'The market moves during the compression year. The buffer is bought with timing, and timing is the more expensive of the two in an appreciating market.',
    emergent: 'A materially higher survival rate through the renovation stage, at the cost of one year of the ten the settlement clock allows.',
  },
  {
    comboId: 'F1', order: ['equity-share', 'velocity-heloc', 'seller-wrap', 'brrrr-dscr', 'policy-loan'], rank: 3, sharePct: 18, confidence: 5, likelihood: 1,
    shinesWhen: [
      'Acquisition on seller terms, with the DSCR loan as the refinance that retires the seller note.',
      'A high-rate environment where sellers carry and banks do not.',
      'An operator whose real skill is finding off-market sellers rather than renovating.',
      'A seller note whose balloon is at least three years out, giving the refinance room to miss once.',
      'A household that wants due-on-sale exposure confined to a short, defined window.',
    ],
    failsWhen: 'The refinance misses coverage. A seller balloon and an equity-share settlement then converge, and the property has to sell into whatever market exists on that date.',
    emergent: 'The entire acquisition happens outside institutional credit and is then refinanced into it, which is the cheapest capital in the file — when it works.',
  },
];

/** Every annotated ordering, all tiers. */
export const ALL_ORDERINGS: readonly Ordering[] = [...TRIPLE_ORDERINGS, ...QUAD_ORDERINGS, ...FULL_ORDERINGS];

export function combination(id: string): Combination | undefined {
  return COMBINATIONS.find((c) => c.id === id);
}

export function orderingsFor(comboId: string): Ordering[] {
  return ALL_ORDERINGS.filter((o) => o.comboId === comboId).sort((a, b) => a.rank - b.rank);
}

/**
 * Orderings a normal household is most likely to actually need — high
 * likelihood first. Deliberately NOT sorted by sharePct, because share is
 * conditional on already running that combination and likelihood is not.
 */
export function mostLikelyOrderings(limit = 10): Ordering[] {
  return [...ALL_ORDERINGS]
    .sort((a, b) => b.likelihood - a.likelihood || b.confidence - a.confidence || b.sharePct - a.sharePct)
    .slice(0, limit);
}

/** Share of a combination's orderings we have not annotated, from the combination itself. */
export function annotatedShare(comboId: string): number {
  return orderingsFor(comboId).reduce((sum, o) => sum + o.sharePct, 0);
}

export const ORDERING_COUNT = ALL_ORDERINGS.length;
