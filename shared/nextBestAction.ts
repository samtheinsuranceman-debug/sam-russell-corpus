/**
 * The green button.
 *
 * Every calculator gets one. Pressing it answers the question the client actually has,
 * which is never "what does this one calculator say" — it is "given everything you know
 * about me, what should I do next, and what does it cost me to be wrong."
 *
 * ## The twelve lenses
 *
 * The brief was a panel of minds that argue it out. Implemented honestly, that is twelve
 * scoring lenses, each looking at one thing and refusing to look at anything else. They
 * disagree by construction: the liquidity lens hates what the growth lens loves, and the
 * reversibility lens is suspicious of both. A strategy's score is the weighted vote, and
 * the weights are what the risk appetite actually changes. Nothing is hidden in a blend —
 * `lensScores` is returned so the advisor can see which mind objected and why.
 *
 * This is not a model of twelve language models. It is twelve deterministic scorers, which
 * is better: it produces the same answer twice, it can be tested, and when it recommends
 * something you can find out exactly which lens carried the vote.
 *
 * ## The part that matters most
 *
 * `transferRisk()` — what it costs to move money from one strategy to another. This is
 * the question the platform exists to answer and the one a stack of separate calculators
 * structurally cannot. Moving $200k from a policy into a lending book is not "reallocating."
 * It is giving up a floor, giving up a tax treatment, giving up a death benefit, and taking
 * on a credit risk that did not previously exist, in exchange for a spread. Sometimes that
 * is right. It is never free, and nothing should print it as though it were.
 */

import type { ClientFacts, DerivedPosition, Provenance } from './factFinder';
import { derive } from './factFinder';

export type RiskAppetite = 'conservative' | 'moderate' | 'aggressive';

export type LensId =
  | 'liquidity'
  | 'tax-efficiency'
  | 'growth'
  | 'downside-protection'
  | 'legacy'
  | 'simplicity'
  | 'reversibility'
  | 'timing'
  | 'concentration'
  | 'leverage-safety'
  | 'cash-flow'
  | 'compliance';

export const LENSES: readonly LensId[] = [
  'liquidity',
  'tax-efficiency',
  'growth',
  'downside-protection',
  'legacy',
  'simplicity',
  'reversibility',
  'timing',
  'concentration',
  'leverage-safety',
  'cash-flow',
  'compliance',
] as const;

/**
 * How much each lens counts, by appetite.
 *
 * Note what changes and what does not. Compliance and leverage-safety carry the same
 * weight at every appetite — an aggressive client does not get to down-weight the lens
 * that asks whether a strategy is legal or whether the leverage can margin-call him.
 * Appetite moves the growth/liquidity trade. It does not move the floor.
 */
export const LENS_WEIGHTS: Record<RiskAppetite, Record<LensId, number>> = {
  conservative: {
    liquidity: 3.0, 'tax-efficiency': 1.5, growth: 0.5, 'downside-protection': 3.0,
    legacy: 1.5, simplicity: 2.0, reversibility: 2.5, timing: 1.0,
    concentration: 2.0, 'leverage-safety': 2.0, 'cash-flow': 2.0, compliance: 2.0,
  },
  moderate: {
    liquidity: 2.0, 'tax-efficiency': 2.0, growth: 1.5, 'downside-protection': 2.0,
    legacy: 1.5, simplicity: 1.0, reversibility: 1.5, timing: 1.5,
    concentration: 1.5, 'leverage-safety': 2.0, 'cash-flow': 1.5, compliance: 2.0,
  },
  aggressive: {
    liquidity: 1.0, 'tax-efficiency': 2.5, growth: 3.0, 'downside-protection': 1.0,
    legacy: 1.0, simplicity: 0.5, reversibility: 0.5, timing: 2.0,
    concentration: 1.0, 'leverage-safety': 2.0, 'cash-flow': 1.0, compliance: 2.0,
  },
};

export interface Strategy {
  readonly id: string;
  readonly name: string;
  /** Which calculator models this. */
  readonly calculator: string;
  /** Capital required to start. */
  readonly minimumCapital: number;
  /** Fraction of committed capital reachable within 30 days. */
  readonly liquidityFactor: number;
  /** Years before the strategy is expected to be net-positive. */
  readonly yearsToBenefit: number;
  readonly taxTreatment: 'tax-free' | 'tax-deferred' | 'ordinary' | 'capital-gain';
  /** Cost to unwind in year one, as a fraction of capital committed. */
  readonly unwindCostYearOne: number;
  /** True where a loss is floored rather than open-ended. */
  readonly hasFloor: boolean;
  /** True where the strategy creates a death benefit. */
  readonly createsDeathBenefit: boolean;
  /** True where borrowed money is involved. */
  readonly usesLeverage: boolean;
  /** Operational burden, 0 (set and forget) to 10 (a second job). */
  readonly complexity: number;
  /** Months of the year the strategy is best initiated. Empty means any time. */
  readonly bestMonths: readonly number[];
  /** Strategy ids that should be in place first. */
  readonly prerequisites: readonly string[];
  /** Regulatory exposure, 0 (none) to 10 (licensed activity with per-violation penalties). */
  readonly regulatoryLoad: number;
  /** Expected annual return, as a decimal. Required to be sourced upstream. */
  readonly expectedReturn: number;
  /** Set when the strategy repeats on a cycle — an IUL every two years, say. */
  readonly repeatEveryYears?: number;
  readonly plainDescription: string;
}

export interface LensScore {
  readonly lens: LensId;
  /** 0-10. */
  readonly score: number;
  readonly reason: string;
}

export interface RankedStrategy {
  readonly strategyId: string;
  readonly name: string;
  readonly rank: number;
  readonly weightedScore: number;
  readonly lensScores: readonly LensScore[];
  /** The lens that most objected. This is the one to address in the meeting. */
  readonly loudestObjection: LensScore;
  readonly affordable: boolean;
  readonly blockedBy: readonly string[];
  readonly plain: string;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(10, n));
}

/** Score one strategy through all twelve lenses against this client's actual position. */
export function scoreThroughLenses(
  s: Strategy,
  facts: ClientFacts,
  d: DerivedPosition,
): LensScore[] {
  const capitalShare = d.deployableCapital > 0 ? s.minimumCapital / d.deployableCapital : 1;

  return [
    {
      lens: 'liquidity',
      score: clamp(s.liquidityFactor * 10),
      reason: `${(s.liquidityFactor * 100).toFixed(0)}% of committed capital reachable in 30 days.`,
    },
    {
      lens: 'tax-efficiency',
      score: clamp(
        s.taxTreatment === 'tax-free' ? 10
          : s.taxTreatment === 'tax-deferred' ? 7
            : s.taxTreatment === 'capital-gain' ? 5 : 2,
      ),
      reason: `Proceeds are taxed as ${s.taxTreatment}. Client's marginal rate is ${(facts.marginalTaxRate.value * 100).toFixed(0)}%.`,
    },
    {
      lens: 'growth',
      score: clamp(s.expectedReturn * 100),
      reason: `Expected ${(s.expectedReturn * 100).toFixed(1)}% annually.`,
    },
    {
      lens: 'downside-protection',
      score: clamp(s.hasFloor ? 9 : s.usesLeverage ? 1 : 4),
      reason: s.hasFloor
        ? 'Loss is floored.'
        : s.usesLeverage
          ? 'Leveraged and unfloored. Loss is not bounded by the capital committed.'
          : 'Unfloored but unleveraged. Loss is bounded by the capital committed.',
    },
    {
      lens: 'legacy',
      score: clamp(s.createsDeathBenefit ? 9 : s.taxTreatment === 'tax-free' ? 6 : 3),
      reason: s.createsDeathBenefit
        ? 'Creates a death benefit that passes income-tax-free.'
        : 'No death benefit created.',
    },
    {
      lens: 'simplicity',
      score: clamp(10 - s.complexity),
      reason: `Operational complexity ${s.complexity}/10.`,
    },
    {
      lens: 'reversibility',
      score: clamp(10 - s.unwindCostYearOne * 100),
      reason: `Unwinding in year one costs ${(s.unwindCostYearOne * 100).toFixed(0)}% of capital committed.`,
    },
    {
      lens: 'timing',
      score: clamp(s.bestMonths.length === 0 ? 7 : s.bestMonths.length <= 3 ? 9 : 6),
      reason: s.bestMonths.length
        ? `Best initiated in month(s) ${s.bestMonths.join(', ')} — a narrow window is an edge, not a constraint.`
        : 'No timing edge. Can start any time.',
    },
    {
      lens: 'concentration',
      score: clamp(10 - capitalShare * 10),
      reason: `Consumes ${(capitalShare * 100).toFixed(0)}% of deployable capital.`,
    },
    {
      lens: 'leverage-safety',
      score: clamp(s.usesLeverage ? (d.debtToIncome > 0.43 ? 1 : 5) : 10),
      reason: s.usesLeverage
        ? `Uses borrowed money at a ${(d.debtToIncome * 100).toFixed(0)}% debt-to-income.`
        : 'No borrowed money involved.',
    },
    {
      lens: 'cash-flow',
      score: clamp(d.annualSurplus > 0 ? Math.min(10, (d.annualSurplus / Math.max(1, s.minimumCapital)) * 40) : 0),
      reason: `Annual surplus of ${d.annualSurplus.toLocaleString()} against ${s.minimumCapital.toLocaleString()} required.`,
    },
    {
      lens: 'compliance',
      score: clamp(10 - s.regulatoryLoad),
      reason: `Regulatory load ${s.regulatoryLoad}/10.`,
    },
  ];
}

export function rankStrategies(
  strategies: readonly Strategy[],
  facts: ClientFacts,
  appetite: RiskAppetite,
): RankedStrategy[] {
  const d = derive(facts);
  const weights = LENS_WEIGHTS[appetite];
  const inPlace = new Set<string>();

  const ranked = strategies.map((s) => {
    const lensScores = scoreThroughLenses(s, facts, d);
    const totalWeight = LENSES.reduce((acc, l) => acc + weights[l], 0);
    const weighted =
      lensScores.reduce((acc, ls) => acc + ls.score * weights[ls.lens], 0) / totalWeight;

    const blockedBy: string[] = [];
    if (d.emergencyMonths < 6) {
      blockedBy.push('A six-month cash reserve is not in place. Nothing is funded ahead of it.');
    }
    for (const pre of s.prerequisites) {
      if (!inPlace.has(pre)) {
        const preName = strategies.find((x) => x.id === pre)?.name ?? pre;
        blockedBy.push(`Requires "${preName}" first.`);
      }
    }
    const affordable = d.deployableCapital >= s.minimumCapital;
    if (!affordable) {
      blockedBy.push(
        `Needs ${s.minimumCapital.toLocaleString()}; ${d.deployableCapital.toLocaleString()} is deployable after reserve.`,
      );
    }

    const loudest = lensScores.reduce((worst, ls) =>
      ls.score * weights[ls.lens] < worst.score * weights[worst.lens] ? ls : worst,
    );

    return {
      strategyId: s.id,
      name: s.name,
      rank: 0,
      weightedScore: Number(weighted.toFixed(2)),
      lensScores,
      loudestObjection: loudest,
      affordable,
      blockedBy,
      plain:
        `${s.name}: ${weighted.toFixed(1)}/10 on a ${appetite} weighting. ` +
        (blockedBy.length ? `BLOCKED — ${blockedBy[0]} ` : 'Available now. ') +
        `Loudest objection is ${loudest.lens}: ${loudest.reason}`,
    };
  });

  return ranked
    .sort((a, b) => {
      if (a.blockedBy.length !== b.blockedBy.length) return a.blockedBy.length - b.blockedBy.length;
      return b.weightedScore - a.weightedScore;
    })
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export interface TransferRisk {
  readonly fromId: string;
  readonly toId: string;
  readonly amount: number;
  /** Annual return given up, in dollars. */
  readonly returnSurrendered: number;
  /** Annual return acquired, in dollars. */
  readonly returnAcquired: number;
  readonly netAnnualSpread: number;
  /** One-time cost of getting out of the source position. */
  readonly exitCost: number;
  /** Years for the spread to repay the exit cost. Infinite if it never does. */
  readonly yearsToRecoverExitCost: number;
  readonly protectionsLost: readonly string[];
  readonly risksAcquired: readonly string[];
  readonly verdict: 'accretive' | 'marginal' | 'dilutive';
  readonly plain: string;
}

/**
 * What it actually costs to move money from one strategy to another.
 *
 * The spread is the easy half. The half that gets skipped is what stops protecting the
 * client the moment the money leaves — the floor, the tax treatment, the death benefit,
 * the creditor position. Those are itemized, not netted into the number, because a
 * client who understands he is trading a floor for two points of spread can make that
 * decision. One shown only the two points cannot.
 */
export function transferRisk(
  from: Strategy,
  to: Strategy,
  amount: number,
  facts: ClientFacts,
): TransferRisk {
  if (amount <= 0) throw new RangeError('Transfer amount must be positive.');

  const returnSurrendered = amount * from.expectedReturn;
  const returnAcquired = amount * to.expectedReturn;
  const exitCost = amount * from.unwindCostYearOne;
  const netAnnualSpread = returnAcquired - returnSurrendered;

  const protectionsLost: string[] = [];
  if (from.hasFloor && !to.hasFloor) {
    protectionsLost.push(
      'The floor. The source position could not lose principal to market movement; the ' +
        'destination can.',
    );
  }
  if (from.createsDeathBenefit && !to.createsDeathBenefit) {
    protectionsLost.push(
      'The death benefit. Moving this money reduces what passes income-tax-free at death.',
    );
  }
  if (from.taxTreatment === 'tax-free' && to.taxTreatment !== 'tax-free') {
    protectionsLost.push(
      `Tax-free access. Growth in the destination is taxed as ${to.taxTreatment} at a ` +
        `${(facts.marginalTaxRate.value * 100).toFixed(0)}% marginal rate, so the headline spread ` +
        'overstates what the client keeps.',
    );
  }
  if (from.liquidityFactor > to.liquidityFactor) {
    protectionsLost.push(
      `Liquidity. ${(from.liquidityFactor * 100).toFixed(0)}% was reachable in 30 days; ` +
        `${(to.liquidityFactor * 100).toFixed(0)}% will be.`,
    );
  }

  const risksAcquired: string[] = [];
  if (to.usesLeverage && !from.usesLeverage) {
    risksAcquired.push('Borrowed money. Loss is no longer bounded by the capital committed.');
  }
  if (to.regulatoryLoad > from.regulatoryLoad + 3) {
    risksAcquired.push(
      `Regulatory exposure rises from ${from.regulatoryLoad}/10 to ${to.regulatoryLoad}/10. ` +
        'That is a real cost in licensing, disclosure, and per-violation penalty risk.',
    );
  }
  if (to.complexity > from.complexity + 3) {
    risksAcquired.push(
      `Operational complexity rises from ${from.complexity}/10 to ${to.complexity}/10. ` +
        'Strategies that require attention fail when the client stops paying attention.',
    );
  }
  if (to.yearsToBenefit > from.yearsToBenefit + 2) {
    risksAcquired.push(
      `Time to benefit extends from ${from.yearsToBenefit} to ${to.yearsToBenefit} years.`,
    );
  }

  // After-tax spread, because that is what the client actually keeps.
  const taxDrag = to.taxTreatment === 'tax-free' ? 0 : facts.marginalTaxRate.value;
  const afterTaxSpread = returnAcquired * (1 - taxDrag) - returnSurrendered *
    (from.taxTreatment === 'tax-free' ? 1 : 1 - facts.marginalTaxRate.value);

  const yearsToRecover =
    afterTaxSpread > 0 ? exitCost / afterTaxSpread : Number.POSITIVE_INFINITY;

  const verdict: TransferRisk['verdict'] =
    afterTaxSpread <= 0 || yearsToRecover > to.yearsToBenefit * 2
      ? 'dilutive'
      : yearsToRecover > 3 || protectionsLost.length >= 3
        ? 'marginal'
        : 'accretive';

  return {
    fromId: from.id,
    toId: to.id,
    amount: Math.round(amount),
    returnSurrendered: Math.round(returnSurrendered),
    returnAcquired: Math.round(returnAcquired),
    netAnnualSpread: Math.round(netAnnualSpread),
    exitCost: Math.round(exitCost),
    yearsToRecoverExitCost: Number.isFinite(yearsToRecover) ? Number(yearsToRecover.toFixed(1)) : Infinity,
    protectionsLost,
    risksAcquired,
    verdict,
    plain:
      `Moving ${Math.round(amount).toLocaleString()} from ${from.name} to ${to.name}: ` +
      `${Math.round(netAnnualSpread).toLocaleString()} more per year before tax, ` +
      `${Math.round(afterTaxSpread).toLocaleString()} after. ` +
      `Exit costs ${Math.round(exitCost).toLocaleString()}, recovered in ` +
      `${Number.isFinite(yearsToRecover) ? yearsToRecover.toFixed(1) + ' years' : 'never'}. ` +
      `${protectionsLost.length} protection(s) given up, ${risksAcquired.length} risk(s) taken on. ` +
      `Verdict: ${verdict.toUpperCase()}.`,
  };
}

export interface SequencedStep {
  readonly order: number;
  /** Months from today. */
  readonly startMonth: number;
  readonly strategyId: string;
  readonly name: string;
  readonly capitalRequired: number;
  readonly repeats: boolean;
  readonly rationale: string;
}

/**
 * Lay the strategies out on a calendar rather than a list.
 *
 * Two things a ranking alone cannot express and this can. First, prerequisites: a policy
 * has to exist before it can be borrowed against, so the borrow cannot be scheduled in
 * the same month as the funding. Second, repetition: the pattern that actually compounds
 * is a new policy every couple of years, each one entering its own surrender schedule on
 * its own clock, so that by the time the first is free the third is funded. `repeatEveryYears`
 * drives that, and the horizon decides how many cycles get laid down.
 */
export function sequence(
  ranked: readonly RankedStrategy[],
  strategies: readonly Strategy[],
  facts: ClientFacts,
  horizonYears = 20,
): SequencedStep[] {
  const d = derive(facts);
  const byId = new Map(strategies.map((s) => [s.id, s]));
  const steps: SequencedStep[] = [];
  const placedAtMonth = new Map<string, number>();
  let capitalFree = d.deployableCapital;
  let annualSurplus = Math.max(0, d.annualSurplus);
  let cursorMonth = 0;
  let order = 1;

  for (const r of ranked) {
    const s = byId.get(r.strategyId);
    if (!s) continue;
    if (r.blockedBy.some((b) => b.startsWith('A six-month cash reserve'))) continue;

    // A prerequisite must be not just present but seasoned — you cannot borrow against
    // a policy the month it is funded.
    let earliest = cursorMonth;
    for (const pre of s.prerequisites) {
      const preMonth = placedAtMonth.get(pre);
      if (preMonth === undefined) { earliest = -1; break; }
      const preStrategy = byId.get(pre);
      earliest = Math.max(earliest, preMonth + (preStrategy?.yearsToBenefit ?? 1) * 12);
    }
    if (earliest < 0) continue;

    // Wait until surplus has accumulated enough, if capital on hand is short.
    let startMonth = earliest;
    if (capitalFree < s.minimumCapital) {
      if (annualSurplus <= 0) continue;
      const shortfall = s.minimumCapital - capitalFree;
      startMonth = Math.max(startMonth, earliest + Math.ceil((shortfall / annualSurplus) * 12));
    }
    if (startMonth > horizonYears * 12) continue;

    capitalFree = Math.max(0, capitalFree - s.minimumCapital);
    placedAtMonth.set(s.id, startMonth);

    // Bump the cursor so independent strategies stagger instead of stacking on month zero.
    if (s.bestMonths.length === 0) cursorMonth = startMonth + 3;

    steps.push({
      order: order++,
      startMonth,
      strategyId: s.id,
      name: s.name,
      capitalRequired: s.minimumCapital,
      repeats: Boolean(s.repeatEveryYears),
      rationale:
        s.prerequisites.length
          ? `Follows ${s.prerequisites.join(', ')}, seasoned ${s.yearsToBenefit} year(s).`
          : 'No prerequisites. Starts as soon as capital allows.',
    });

    // Lay down the repeating cycles.
    if (s.repeatEveryYears) {
      for (
        let m = startMonth + s.repeatEveryYears * 12;
        m <= horizonYears * 12;
        m += s.repeatEveryYears * 12
      ) {
        steps.push({
          order: order++,
          startMonth: m,
          strategyId: s.id,
          name: `${s.name} (cycle ${Math.round((m - startMonth) / (s.repeatEveryYears * 12)) + 1})`,
          capitalRequired: s.minimumCapital,
          repeats: true,
          rationale:
            `Repeats every ${s.repeatEveryYears} years. Each cycle enters its own surrender ` +
            'schedule on its own clock, so an earlier one is always coming free while a later ' +
            'one is still funding.',
        });
      }
    }
  }

  return steps.sort((a, b) => a.startMonth - b.startMonth || a.order - b.order);
}

export interface GreenButtonResult {
  readonly appetite: RiskAppetite;
  readonly position: DerivedPosition;
  readonly ranked: readonly RankedStrategy[];
  readonly plan: readonly SequencedStep[];
  readonly provenance: Provenance;
  readonly headline: string;
}

/** What the green button returns. One call, from any calculator. */
export function greenButton(
  facts: ClientFacts,
  strategies: readonly Strategy[],
  appetite: RiskAppetite,
  horizonYears = 20,
): GreenButtonResult {
  const position = derive(facts);
  const ranked = rankStrategies(strategies, facts, appetite);
  const plan = sequence(ranked, strategies, facts, horizonYears);
  const top = ranked.find((r) => r.blockedBy.length === 0);

  return {
    appetite,
    position,
    ranked,
    plan,
    provenance: position.weakestProvenance,
    headline: top
      ? `Next step on a ${appetite} weighting: ${top.name}. ${top.plain}`
      : `Nothing is available yet. ${position.warnings[0] ?? 'Deployable capital is zero after reserve.'}`,
  };
}
