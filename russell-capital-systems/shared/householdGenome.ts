/**
 * THE PAIRING PROTOCOL — two genomes, one household, and the weighting between them.
 *
 * ## The problem, stated plainly
 *
 * A wealth genome read on one spouse and acted on for a household is a
 * recommendation engine for marital conflict. It will confidently propose a
 * strategy that one person can hold and the other cannot, and the failure will
 * arrive in year two looking like a market problem when it was a household
 * problem all along. The existing factor set already says so: relational
 * durability is defined as "a partner who was not in the room ends it in year
 * two". This file is what happens when that sentence is taken seriously.
 *
 * ## Three ideas, and the second one is the one that matters
 *
 * **One. Influence follows the asset, not the person.** How much weight each
 * partner's genome carries is not a fixed household constant — it depends on
 * which pot of money is being decided. His IRA is not the joint checking
 * account and should not be weighted as though it were.
 *
 * **Two. Factors do not all combine the same way, and averaging them all is
 * the mistake this file exists to avoid.** Averaging two emotional-durability
 * readings produces a number that describes nobody: if one partner will sell
 * in a drawdown, the household sells in a drawdown, and the mean of 2 and -2
 * is not 0, it is -2. But averaging two time horizons is also wrong in the
 * other direction — the money has to last for the survivor, so the LONGER
 * horizon governs. And numeracy is different again: one partner who can do the
 * arithmetic can do it for both. Each factor therefore declares a combination
 * rule with a stated reason, and eleven of the twenty-one are not averages.
 *
 * **Three. Nothing runs without consent to the weighting.** Both partners
 * affirm the influence split for each asset class before any paired output is
 * produced. This is not legal ceremony — it is the mechanism that keeps the
 * tool from being used by one spouse to out-argue the other with a chart.
 *
 * ## What this predicts, and what it does not
 *
 * It predicts which conversations will be hard and which strategies will fail
 * on a household objection rather than on arithmetic. It does NOT predict what
 * a marriage will do, what returns will happen, or whether anyone will change
 * their mind. `pairingConfidence()` reports how much of the picture has
 * actually been read, and the page shows it beside every output, because a
 * pairing computed from one partner's answers and four of the other's is a
 * sketch wearing a protocol's clothes.
 */

import {
  FACTORS, personalWeights, type FactorReading,
} from './wealthGenomeFactors';

// ─── Combination rules ───────────────────────────────────────────────────────

export type CombinationRule =
  /** Either partner can end it, so the lower reading governs the household. */
  | 'weakest-link'
  /** One partner can carry it for both, so the higher reading governs. */
  | 'strongest'
  /** Joint survival: the money must last for whoever lives longer. */
  | 'longest'
  /** A fact about the balance sheet, blended by stake in the asset. */
  | 'weighted'
  /** Belongs to one person; the other's reading is context, not input. */
  | 'owner'
  /** Two of something is more than one, but not twice as much. */
  | 'pooled';

export const RULE_LABEL: Record<CombinationRule, string> = {
  'weakest-link': 'Weakest link',
  strongest: 'Stronger carries',
  longest: 'Longer governs',
  weighted: 'Weighted blend',
  owner: 'Owner decides',
  pooled: 'Pooled',
};

export interface FactorCombination {
  readonly factorId: string;
  readonly rule: CombinationRule;
  /** Why this rule and not an average. Shown on the page, not buried. */
  readonly why: string;
}

/**
 * The rule for every one of the twenty-one factors.
 *
 * Ten are weighted blends. Eleven are not, and those eleven are where a naive
 * household genome goes wrong.
 */
export const COMBINATIONS: readonly FactorCombination[] = [
  { factorId: 'cognitive-durability', rule: 'weakest-link',
    why: 'A decision one partner cannot re-derive is a decision that gets reversed in year three, whoever originally made it. Understanding does not average.' },
  { factorId: 'emotional-durability', rule: 'weakest-link',
    why: 'Either partner can end a strategy in a drawdown, and the one who will is the one who governs. Averaging a holder and a seller produces a number describing neither.' },
  { factorId: 'income-durability', rule: 'pooled',
    why: 'Two incomes fail less often than one — but not independently, because households share an employer, an industry or a city more often than they think. Pooled, not added.' },
  { factorId: 'relational-durability', rule: 'weighted',
    why: 'The only factor this file can partly compute rather than ask: sustained divergence across the weakest-link factors is itself evidence about whether a joint decision will hold.' },
  { factorId: 'time-horizon', rule: 'longest',
    why: 'The money has to last for the survivor, not for the average of two people. A household planning to the shorter horizon is planning to run out on one of them.' },
  { factorId: 'liquidity-need', rule: 'weakest-link',
    why: 'The partner who needs cash reachable will reach for it, and an illiquid strategy gets broken into on their schedule rather than the plan\'s.' },
  { factorId: 'longevity-expectation', rule: 'longest',
    why: 'Joint survival. The probability that at least one of two people is alive at any age is materially higher than for either alone, and income for life has to price that.' },
  { factorId: 'dependents', rule: 'weakest-link',
    why: 'An obligation to a child or a parent is the household\'s obligation whichever partner it arrived with.' },
  { factorId: 'care-obligation', rule: 'weakest-link',
    why: 'An open-ended care responsibility reorders a household\'s liquidity whether or not both partners are providing the care.' },
  { factorId: 'legacy-intent', rule: 'weighted',
    why: 'A genuine values difference that should be surfaced and resolved, not averaged away — the blend is a starting point for that conversation, not its answer.' },
  { factorId: 'spending-elasticity', rule: 'weakest-link',
    why: 'A household cuts spending to the level the less willing partner accepts. The plan that assumed the willing one\'s number does not survive the first bad quarter.' },
  { factorId: 'concentration', rule: 'weighted',
    why: 'A fact about the balance sheet rather than about a person, so it blends by stake — though an employer concentration belongs to whoever holds the job.' },
  { factorId: 'leverage', rule: 'weighted',
    why: 'Household debt is household debt: a lender looks at both of them and a default reaches both of them, so this is a balance-sheet fact rather than a preference and it blends by stake in the asset being decided. What does NOT blend is what borrowing means to each of them, and that shows up as a divergence worth talking about rather than a number worth averaging.' },
  { factorId: 'business-ownership', rule: 'owner',
    why: 'A closely-held interest sits with whoever holds it and whoever signed the guarantees. The other partner\'s reading is context.' },
  { factorId: 'tax-posture', rule: 'weighted',
    why: 'They file one return. The bracket is the household\'s, so the expectation about it should be too.' },
  { factorId: 'state-exposure', rule: 'weighted',
    why: 'They live in one state and are taxed by it jointly, so the exposure itself is shared and blends. The divergence that matters here is rarely about the current state — it is about whether they intend to leave it, and a plan built on one partner\'s assumption about retiring somewhere cheaper is a plan with an unexamined premise in it.' },
  { factorId: 'insurability', rule: 'owner',
    why: 'Underwriting is on a body. One partner being insurable says nothing about the other, and a plan needing two policies needs two answers.' },
  { factorId: 'inflation-exposure', rule: 'weighted',
    why: 'Household purchasing power. Blended, though a pension on one life and a wage on the other is a divergence worth seeing rather than smoothing.' },
  { factorId: 'numeracy', rule: 'strongest',
    why: 'One partner who is comfortable with rates and compounding can carry the arithmetic for both — provided the other trusts the result, which is what institutional trust measures.' },
  { factorId: 'institutional-trust', rule: 'weakest-link',
    why: 'The sceptical partner vetoes. Always, and usually late. A household does not hold a strategy that one member fundamentally does not believe in.' },
  { factorId: 'attention-budget', rule: 'strongest',
    why: 'One partner can run the maintenance and in most households one already does. Name them, so the plan does not quietly assume both.' },
];

const COMBO_BY_ID = new Map(COMBINATIONS.map((c) => [c.factorId, c]));

// ─── Asset classes and where influence comes from ────────────────────────────

/**
 * How much weight a partner's genome carries is derived, not decreed.
 *
 * Three inputs, each 0–1 toward partner A:
 *   - `title`      — whose name is on it
 *   - `exposure`   — who actually bears the loss if it goes wrong
 *   - `dependence` — who relies on it for their own security
 *
 * influence(A) = title×0.50 + exposure×0.25 + dependence×0.25
 *
 * Title carries half because ownership is real and a spouse should not be able
 * to direct an account that is not theirs. The other half is split between
 * exposure and dependence because in almost every jurisdiction a retirement
 * account accumulated during a marriage is marital property in substance even
 * when it is individual in name — and because the person who will live on the
 * money has a stake in it whatever the registration says.
 *
 * Run the arithmetic on a titled IRA: title 1.0, exposure 0.5, dependence 0.5
 * gives 0.75. Seventy-five percent to the account holder, twenty-five to the
 * spouse — which is the split most couples reach on their own, arrived at here
 * from a principle rather than from a preference.
 */
export interface AssetClass {
  readonly id: string;
  readonly name: string;
  /** Plain description so a couple can tell which pot they are looking at. */
  readonly what: string;
  readonly title: number;
  readonly exposure: number;
  readonly dependence: number;
  /** The reasoning, in the couple's language. */
  readonly why: string;
}

export const ASSET_CLASSES: readonly AssetClass[] = [
  {
    id: 'individual-retirement-a', name: "Partner A's retirement account",
    what: 'An IRA, 401(k) or 403(b) registered in one name.',
    title: 1.0, exposure: 0.5, dependence: 0.5,
    why: 'Registered to one person, so title is entirely theirs — but accumulated during the marriage it is marital property in substance nearly everywhere, and the spouse will live on it too. Three-quarters to the holder, a quarter to the spouse.',
  },
  {
    id: 'individual-retirement-b', name: "Partner B's retirement account",
    what: 'An IRA, 401(k) or 403(b) registered in the other name.',
    title: 0.0, exposure: 0.5, dependence: 0.5,
    why: 'The mirror of the above. Whoever holds the account holds three-quarters of the say in it.',
  },
  {
    id: 'home-equity', name: 'Home equity',
    what: 'The equity in the residence they live in together.',
    title: 0.5, exposure: 0.5, dependence: 0.5,
    why: 'Jointly titled, jointly lost, jointly lived in. There is no defensible reading of this that is not fifty-fifty, and a plan that touches the roof over two people needs both of them in the room.',
  },
  {
    id: 'joint-cash', name: 'Joint checking and savings',
    what: 'The household operating accounts.',
    title: 0.5, exposure: 0.5, dependence: 0.5,
    why: 'Shared in every sense. Fifty-fifty, and the one place where a unilateral decision is most immediately felt by the other person.',
  },
  {
    id: 'joint-taxable', name: 'Joint taxable investments',
    what: 'A brokerage account held jointly.',
    title: 0.5, exposure: 0.5, dependence: 0.5,
    why: 'Joint title, joint exposure, and unlike the house or the chequing account nothing about it is in daily use — which makes it the pot couples argue about most, because there is no practical fact settling who decides. Fifty-fifty, and the disagreement has to be resolved rather than allocated around.',
  },
  {
    id: 'individual-taxable-a', name: "Partner A's individual brokerage",
    what: 'A taxable investment account in one name, including employer stock.',
    title: 1.0, exposure: 0.55, dependence: 0.4,
    why: 'Individually titled and more reachable than a retirement account, so the holder carries more. The spouse still has a real stake because a concentrated position here is a household risk regardless of whose name is on it.',
  },
  {
    id: 'business-a', name: "Partner A's business interest",
    what: 'A closely-held business one partner owns and operates.',
    title: 1.0, exposure: 0.85, dependence: 0.5,
    why: 'They own it, they run it, and they signed the personal guarantees — exposure is overwhelmingly theirs. Roughly five-sixths of the say, and the remaining sixth is not a formality: a business failure reaches the household balance sheet.',
  },
  {
    id: 'policy-on-a', name: 'Life policy insuring Partner A',
    what: 'A permanent policy on one life, with the spouse as beneficiary.',
    title: 1.0, exposure: 0.2, dependence: 0.15,
    why: 'The contract and the insurability are the insured\'s and cannot be anyone else\'s. But the exposure and the dependence run almost entirely the other way — the beneficiary is the one who loses if it lapses. Those pull the split back toward the middle, which is why this lands near sixty-forty rather than at ninety-ten.',
  },
  {
    id: 'inherited-a', name: "Partner A's inherited or premarital assets",
    what: 'Assets received by gift or inheritance, or owned before the marriage, kept separate.',
    title: 1.0, exposure: 0.85, dependence: 0.6,
    why: 'Separate property in most states when it has genuinely been kept separate. Heavily weighted to the owner — and the caveat that decides it is whether commingling has already occurred, which is a question for an attorney and not for this model.',
  },
  {
    id: 'rental-joint', name: 'Jointly held rental property',
    what: 'Investment property titled to both, or to an entity they own together.',
    title: 0.5, exposure: 0.5, dependence: 0.5,
    why: 'Joint title and joint liability. Fifty-fifty — with the separate and important question of who actually does the operating work, which belongs in the attention-budget reading rather than in the weighting.',
  },
];

export const assetClass = (id: string): AssetClass | undefined =>
  ASSET_CLASSES.find((a) => a.id === id);

/** Influence toward partner A, 0–1. The spouse holds the remainder. */
export function influenceA(a: AssetClass): number {
  return round(a.title * 0.5 + a.exposure * 0.25 + a.dependence * 0.25);
}

/**
 * How much force the non-owning partner's objection carries on this asset,
 * 0 (none) to 1 (absolute). This is the number a couple will actually argue
 * about, so it is computed once and shown rather than left implicit.
 */
export function vetoStrength(influence: number): number {
  return round(Math.min(1, Math.min(influence, 1 - influence) * 2));
}

// ─── Consent ─────────────────────────────────────────────────────────────────

/**
 * Both partners agree to the weighting before any paired output exists.
 *
 * The point is not paperwork. A tool that blends two people's answers and
 * produces an authoritative-looking recommendation is a tool one spouse can
 * use to win an argument, and the weighting is precisely the step where that
 * would happen invisibly. Making it explicit and mutual means the disagreement
 * happens over the weights, in the open, before anyone is holding a chart.
 */
export interface PairingConsent {
  readonly assetClassId: string;
  readonly agreedByA: boolean;
  readonly agreedByB: boolean;
  /** An override both partners agreed to, replacing the derived split. */
  readonly agreedInfluenceA?: number;
  readonly asOf?: string;
  readonly note?: string;
}

export const consentGiven = (c: PairingConsent | undefined): boolean =>
  Boolean(c?.agreedByA && c?.agreedByB);

// ─── Pairing ─────────────────────────────────────────────────────────────────

export interface Household {
  readonly labelA: string;
  readonly labelB: string;
  readonly readingsA: readonly FactorReading[];
  readonly readingsB: readonly FactorReading[];
  readonly consents: readonly PairingConsent[];
}

export interface PairedFactor {
  readonly factorId: string;
  readonly name: string;
  readonly rule: CombinationRule;
  readonly ruleWhy: string;
  readonly scoreA: number | null;
  readonly scoreB: number | null;
  /** The household reading this factor combines to. */
  readonly combined: number;
  readonly confidence: number;
  /** |A − B|, on the −2..2 scale. Null when either is unread. */
  readonly gap: number | null;
  readonly alignment: 'aligned' | 'divergent' | 'opposed' | 'unknown';
  /**
   * True where the difference is an ASSET — one partner covering for the
   * other. False where it is a friction point that will surface under stress.
   */
  readonly complementary: boolean;
  /** What this specific divergence means for this household. */
  readonly reading: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
function round(n: number, p = 3): number { return Math.round(n * 10 ** p) / 10 ** p; }

const ANSWERED = 0.3;

function readingOf(rs: readonly FactorReading[], id: string): FactorReading | undefined {
  const r = rs.find((x) => x.factorId === id);
  return r && r.confidence >= ANSWERED ? r : undefined;
}

/**
 * A veto is only as strong as the stake behind it.
 *
 * The first version of this function made `weakest-link` an unconditional
 * minimum, which produced a household reading on a titled IRA identical to the
 * one on a joint checking account — and that is wrong in a way that matters.
 * Weakest-link encodes a VETO, and a veto's force should scale with how much
 * of the asset the objecting partner actually holds. On a joint account it is
 * absolute: she can simply stop it. On his IRA she has real standing but not
 * the same standing, and the arithmetic should say so.
 *
 * So the pull toward the minimum runs from zero to full as the NON-owner's
 * influence runs from zero to a half:
 *
 *   pull = 2 × min(influenceA, 1 − influenceA)
 *   combined = ownerScore − (ownerScore − min) × pull
 *
 * On joint cash (50/50) the pull is 1.0 and this is a plain minimum, exactly
 * as before. On a titled IRA (75/25) the pull is 0.5, so the cautious spouse
 * moves the household reading halfway rather than all the way. On a business
 * one partner owns and personally guarantees (84/16) the pull is 0.32.
 *
 * Note what is NOT modulated: `strongest`, `longest` and `pooled` are untouched
 * by influence, because they encode capability and survival rather than
 * authority. If one partner can do the arithmetic, they can do it whoever owns
 * the account; if one of them will live to ninety-four, that is true of the
 * joint account and of the IRA alike.
 */
function combine(rule: CombinationRule, a: number, b: number, wA: number): number {
  const nonOwnerShare = Math.min(wA, 1 - wA);   // 0 .. 0.5
  const vetoPull = clamp(nonOwnerShare * 2, 0, 1);
  switch (rule) {
    case 'weakest-link': {
      const ownerScore = wA >= 0.5 ? a : b;
      const min = Math.min(a, b);
      return ownerScore - (ownerScore - min) * vetoPull;
    }
    case 'strongest': return Math.max(a, b);
    case 'longest': return Math.max(a, b);
    case 'owner': return wA >= 0.5 ? a : b;
    case 'pooled': {
      // Two of something beats one, but they are correlated — same city, often
      // the same industry — so the gain is a fraction of the gap, not the sum.
      const better = Math.max(a, b);
      const worse = Math.min(a, b);
      return clamp(better + (better - worse) * 0.2, -2, 2);
    }
    case 'weighted':
    default:
      return a * wA + b * (1 - wA);
  }
}

/** Where a difference helps rather than hurts. */
const COMPLEMENTARY_RULES = new Set<CombinationRule>(['strongest', 'longest', 'pooled']);

export function pairFactors(household: Household, assetClassId: string): {
  readonly paired: readonly PairedFactor[];
  readonly influence: number;
  readonly consented: boolean;
  readonly assetClass: AssetClass | undefined;
} {
  const ac = assetClass(assetClassId);
  const consent = household.consents.find((c) => c.assetClassId === assetClassId);
  const consented = consentGiven(consent);
  const derived = ac ? influenceA(ac) : 0.5;
  const influence = consent?.agreedInfluenceA ?? derived;

  const paired = FACTORS.map((factor): PairedFactor => {
    const combo = COMBO_BY_ID.get(factor.id)!;
    const rA = readingOf(household.readingsA, factor.id);
    const rB = readingOf(household.readingsB, factor.id);
    const scoreA = rA ? clamp(rA.score, -2, 2) : null;
    const scoreB = rB ? clamp(rB.score, -2, 2) : null;

    // The owner rule follows the influence: above half, partner A owns it.
    const rule = combo.rule;
    const ownerIsA = influence >= 0.5;

    let combined: number;
    let confidence: number;
    if (scoreA === null && scoreB === null) {
      combined = 0;
      confidence = 0;
    } else if (rule === 'owner') {
      // Confidence follows the owner's reading, not the household's, because
      // an owner-decides factor is only as well established as its owner's answer.
      const owner = ownerIsA ? rA : rB;
      const ownerScore = ownerIsA ? scoreA : scoreB;
      combined = ownerScore ?? (ownerIsA ? scoreB : scoreA) ?? 0;
      confidence = owner ? clamp(owner.confidence, 0, 1) : 0;
    } else if (scoreA === null || scoreB === null) {
      // One partner unread. Use what exists, and halve the confidence, because
      // a household reading taken from one person is exactly half a reading.
      const only = scoreA ?? scoreB!;
      const r = rA ?? rB!;
      combined = only;
      confidence = clamp(r.confidence, 0, 1) * 0.5;
    } else {
      combined = combine(rule, scoreA, scoreB, influence);
      confidence = clamp(Math.min(rA!.confidence, rB!.confidence), 0, 1);
    }

    const gap = scoreA !== null && scoreB !== null ? round(Math.abs(scoreA - scoreB)) : null;
    const alignment: PairedFactor['alignment'] =
      gap === null ? 'unknown' : gap >= 2 ? 'opposed' : gap >= 1 ? 'divergent' : 'aligned';
    const complementary = gap !== null && gap >= 1 && COMPLEMENTARY_RULES.has(rule);

    return {
      factorId: factor.id, name: factor.name, rule, ruleWhy: combo.why,
      scoreA, scoreB, combined: round(combined), confidence: round(confidence),
      gap, alignment, complementary,
      reading: describe(factor.name, rule, alignment, complementary, household.labelA, household.labelB, scoreA, scoreB),
    };
  });

  return { paired, influence: round(influence), consented, assetClass: ac };
}

function describe(
  name: string, rule: CombinationRule, alignment: PairedFactor['alignment'],
  complementary: boolean, labelA: string, labelB: string,
  scoreA: number | null, scoreB: number | null,
): string {
  if (alignment === 'unknown') return `Not yet read on both sides, so nothing can be said about it.`;
  if (alignment === 'aligned') return `They read this about the same way, so it is not a source of friction here.`;
  const higher = (scoreA ?? 0) > (scoreB ?? 0) ? labelA : labelB;
  const lower = higher === labelA ? labelB : labelA;
  if (complementary) {
    if (rule === 'strongest') return `A useful difference rather than a problem: ${higher} can carry this for the household. Name them as the one who does, so the plan does not quietly assume both.`;
    if (rule === 'longest') return `${higher}'s reading governs, because the household has to plan for whoever is still here. This is not a disagreement to settle — it is arithmetic about survival.`;
    return `The difference works in the household's favour here: two readings on this are more robust than one.`;
  }
  if (rule === 'weakest-link') {
    return `${lower}'s reading governs, and this is the kind of gap that surfaces under stress rather than in the meeting. A plan built to ${higher}'s tolerance will meet ${lower}'s objection at the worst possible moment, which is what "a partner who was not in the room ends it in year two" actually looks like.`;
  }
  if (rule === 'owner') return `This one belongs to whoever owns the asset. The other reading is context, not an input.`;
  return `A real difference, blended by stake in this asset rather than resolved. Worth a conversation before it is worth a strategy.`;
}

// ─── The output the strategy engine consumes ─────────────────────────────────

/**
 * The household's readings for one asset class, in the shape the strategy-fit
 * engine already takes — so the same twenty-four strategies can be scored for
 * a couple, and scored DIFFERENTLY depending on whose money is funding them.
 *
 * Returns null without consent. That is deliberate and not a formality: the
 * refusal is the feature.
 */
export function pairedReadings(household: Household, assetClassId: string): readonly FactorReading[] | null {
  const { paired, consented } = pairFactors(household, assetClassId);
  if (!consented) return null;
  return paired
    .filter((p) => p.confidence >= ANSWERED)
    .map((p) => ({ factorId: p.factorId, score: p.combined, confidence: p.confidence }));
}

export interface PairingConfidence {
  /** 0–1: how much of the joint picture has actually been read. */
  readonly value: number;
  readonly answeredA: number;
  readonly answeredB: number;
  readonly answeredBoth: number;
  readonly total: number;
  /** In plain words, what this level of confidence is worth. */
  readonly verdict: string;
}

export function pairingConfidence(household: Household): PairingConfidence {
  const total = FACTORS.length;
  const answeredA = FACTORS.filter((f) => readingOf(household.readingsA, f.id)).length;
  const answeredB = FACTORS.filter((f) => readingOf(household.readingsB, f.id)).length;
  const answeredBoth = FACTORS.filter((f) =>
    readingOf(household.readingsA, f.id) && readingOf(household.readingsB, f.id)).length;

  // Both-sided answers are what a pairing is actually made of. One-sided ones
  // count for a quarter, because they let the model guess where they do not know.
  const oneSided = answeredA + answeredB - 2 * answeredBoth;
  const value = round(clamp((answeredBoth + oneSided * 0.25) / total, 0, 1));

  const verdict =
    value >= 0.75 ? 'Enough on both sides to act on, with the divergences named.'
    : value >= 0.45 ? 'Enough to see the shape and to know which conversations matter. Not enough to commit a household to a decade-long structure.'
    : value >= 0.2 ? 'A sketch. It will show the largest divergences and miss the rest — treat every output as a question rather than a finding.'
    : 'Almost nothing has been read on both sides. Anything below is a demonstration of the mechanism, not a reading of this household.';

  return { value, answeredA, answeredB, answeredBoth, total, verdict };
}

// ─── Friction, complementarity, and what to talk about first ─────────────────

export interface FrictionPoint {
  readonly factorId: string;
  readonly name: string;
  readonly gap: number;
  readonly rule: CombinationRule;
  /** How much this gap actually costs, given how much weight the factor carries. */
  readonly severity: number;
  readonly reading: string;
  /** The question to put to both of them, together. */
  readonly conversation: string;
}

/**
 * The divergences ranked by what they will actually cost, not by size.
 *
 * A two-point gap on a weakest-link factor that carries a lot of weight is the
 * thing that ends a plan. A two-point gap on a factor where the stronger
 * partner simply carries it is worth naming and then forgetting.
 */
export function frictionPoints(household: Household, assetClassId: string, limit = 5): readonly FrictionPoint[] {
  const { paired } = pairFactors(household, assetClassId);
  const weightsA = personalWeights(household.readingsA);
  const weightsB = personalWeights(household.readingsB);

  return paired
    .filter((p) => p.gap !== null && p.gap >= 1 && !p.complementary)
    .map((p) => {
      const weight = ((weightsA[p.factorId] ?? 0.5) + (weightsB[p.factorId] ?? 0.5)) / 2;
      // Weakest-link gaps cost more than weighted ones: a blend absorbs a
      // difference, a weakest link does not.
      const multiplier = p.rule === 'weakest-link' ? 1.5 : p.rule === 'owner' ? 0.6 : 1;
      return {
        factorId: p.factorId, name: p.name, gap: p.gap!, rule: p.rule,
        severity: round(p.gap! * weight * multiplier),
        reading: p.reading,
        conversation: conversationFor(p.factorId, household.labelA, household.labelB),
      };
    })
    .sort((a, b) => b.severity - a.severity)
    .slice(0, limit);
}

export function complementarities(household: Household, assetClassId: string): readonly PairedFactor[] {
  return pairFactors(household, assetClassId).paired.filter((p) => p.complementary);
}

/** The question to put to both of them, in the room, at the same time. */
function conversationFor(factorId: string, a: string, b: string): string {
  const q: Record<string, string> = {
    'emotional-durability': `Agree now, in writing, what happens if the account falls by a third. Not whether it might — what each of you will do. ${a} and ${b} answering that separately, today, is worth more than any allocation decision.`,
    'liquidity-need': `How much has to be reachable within a week for the one of you who needs it to sleep? Set that number first and structure everything else behind it.`,
    'institutional-trust': `Find out what the sceptical one has actually been burned by. It is almost never abstract, and a plan that does not answer the specific past experience will be quietly resisted rather than argued with.`,
    'spending-elasticity': `Agree which expenses are genuinely cuttable before a bad year forces the conversation. The list one of you has in mind is not the list the other has.`,
    'cognitive-durability': `Whatever is chosen has to be explainable by both of you to a sceptical friend without notes. If one of you cannot do that, the structure is too complicated for this household regardless of its merits.`,
    'legacy-intent': `One of you is planning to spend it and one is planning to pass it on. That is a values question, not a planning question, and it should be settled between you before a strategy is chosen to serve one of the two answers.`,
    'dependents': `Name every person either of you feels responsible for, including the ones the other might not have counted. Then decide together which of those obligations the plan is actually carrying.`,
    'care-obligation': `An open-ended care responsibility usually falls harder on one partner than the other. Say out loud who expects to do it and what that will cost in time and income, not just in money.`,
    'tax-posture': `You file one return, so one of you is wrong about the bracket. Get a projection rather than continuing to hold two views.`,
    'time-horizon': `You are planning to different dates. The money has to last for whoever is still here, so the longer horizon governs — but the partner with the shorter one needs to understand why their timeline is not the one being used.`,
    'concentration': `One of you is more comfortable with the concentration than the other. Establish what proportion of the household's wealth actually sits in the single largest thing, then have the argument with the real number in front of you.`,
    'leverage': `Debt tolerance is rarely about arithmetic. Find out what borrowing means to each of you before deciding how much of it the plan should use.`,
  };
  return q[factorId] ?? `Put this one to both of you together rather than separately — the gap matters more than either answer.`;
}

// ─── Comfort and appetite ────────────────────────────────────────────────────

export interface HouseholdTemperament {
  /** 0–100. How much volatility and illiquidity this household can actually hold. */
  readonly comfort: number;
  /** 0–100. How much growth they want, before comfort constrains it. */
  readonly appetite: number;
  /**
   * Where appetite exceeds comfort, the household wants more than it can hold —
   * which is the condition that produces selling at the bottom.
   */
  readonly overreach: number;
  readonly verdict: string;
}

export function temperament(household: Household, assetClassId: string): HouseholdTemperament {
  const { paired } = pairFactors(household, assetClassId);
  const by = new Map(paired.map((p) => [p.factorId, p]));
  const v = (id: string) => by.get(id)?.combined ?? 0;

  // Comfort: what the household can hold without breaking. Weakest-link
  // factors dominate deliberately, because they are what breaks.
  const comfortRaw =
    v('emotional-durability') * 0.30 +
    v('liquidity-need') * 0.22 +
    v('income-durability') * 0.18 +
    v('spending-elasticity') * 0.15 +
    v('cognitive-durability') * 0.15;

  // Appetite: what they want. Horizon and inflation exposure push it up;
  // a short horizon and dependants pull it down.
  const appetiteRaw =
    v('time-horizon') * 0.32 +
    -v('inflation-exposure') * 0.20 +
    v('longevity-expectation') * 0.18 +
    -v('tax-posture') * 0.15 +
    v('dependents') * 0.15;

  const comfort = Math.round(((clamp(comfortRaw, -2, 2) / 2) + 1) / 2 * 100);
  const appetite = Math.round(((clamp(appetiteRaw, -2, 2) / 2) + 1) / 2 * 100);
  const overreach = Math.max(0, appetite - comfort);

  const verdict =
    overreach >= 20
      ? `This household wants more growth than it can currently hold — a gap of ${overreach} points. That is the condition that produces selling at the bottom, and it is fixed by raising comfort (a cash reserve, a guaranteed floor, a simpler structure) rather than by lowering the ambition.`
      : overreach > 0
        ? `Appetite sits slightly ahead of comfort. Workable, provided the structure has something in it that absorbs a bad year without a decision being required.`
        : `Comfort is at or ahead of appetite, which is the stable configuration. The risk here is the opposite one: a household that could take more risk than it is taking, and pays for that in purchasing power over decades.`;

  return { comfort, appetite, overreach, verdict };
}

/** The standing note on the pairing page. */
export const PAIRING_DISCLOSURE =
  'This protocol is a conversation tool, not an arbitration. It predicts which decisions will be hard for this household ' +
  'and which strategies will fail on an objection rather than on arithmetic — it does not predict what either person will do, ' +
  'what returns will happen, or who is right. The weighting between two genomes is derived from title, exposure and dependence, ' +
  'and both partners must agree to it before any paired output is produced, because a tool that blends two people\'s answers ' +
  'without their consent is a tool one of them can use to win an argument. Nothing here is legal advice about property rights: ' +
  'whether an asset is separate or marital is a question of state law and of what has actually happened to it, and it belongs ' +
  'with an attorney.';
