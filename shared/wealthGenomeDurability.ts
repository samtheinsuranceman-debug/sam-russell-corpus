/**
 * The Wealth Genome, durability layer — which strategies a person can actually
 * hold, and what breaks first if they cannot.
 *
 * ## How this relates to the Wealth Genome already here
 *
 * shared/wealthGenome.ts scores eight FINANCIAL dimensions from the client's
 * own assessment: income stability, tax efficiency, insurance, retirement
 * readiness, estate, debt, diversification, risk mitigation. That answers
 * "how is this plan built?".
 *
 * This file answers a different question the other one cannot: "can this
 * particular person hold the strategy the plan calls for?". The two are
 * complementary and neither replaces the other — a plan can score Strong on
 * all eight dimensions and still fail, because the person surrendered it in
 * year three.
 *
 * `signalsFromFinancialGenome()` at the bottom bridges them: the financial
 * dimensions become weak evidence on the durability axes, correctly marked
 * `inferred`, because a good income-stability score is a fact about the money
 * rather than an observation of the person.
 *
 * ## The problem this exists to solve
 *
 * Every other engine on this platform answers "what does this strategy do?".
 * None of them answer "what does this strategy demand of the person holding
 * it, and can this person meet that demand?" — which is the question that
 * decides outcomes.
 *
 * An indexed policy funded for five years and borrowed against at 73 is
 * excellent arithmetic and a poor fit for somebody who liquidates whenever a
 * statement shows a number lower than the last one. The arithmetic does not
 * fail. The holding fails, in year three, inside the surrender-charge period,
 * and the loss is real money rather than a modelling error.
 *
 * So this module does not score people. It takes what is known about a
 * person's durability, sets it against what a strategy mechanically demands,
 * and names THE SPECIFIC WAY THIS PERSON WOULD LOSE MONEY IN THIS STRATEGY.
 * A named failure mode is useful. A compatibility percentage is not.
 *
 * ## Four axes, and why these four
 *
 *   - **Cognitive durability** — whether their decision-making holds up when
 *     the instrument is complex. Not intelligence. The question is whether
 *     they can hold a decision they cannot fully re-derive, or whether
 *     not-understanding becomes not-trusting becomes surrender.
 *   - **Emotional durability** — whether it holds up through a drawdown, a
 *     zero-credit year, a statement that went backwards.
 *   - **Income durability** — whether the money coming in survives the funding
 *     period. A seven-pay commitment against income that has failed twice in
 *     ten years is a lapse waiting for a date.
 *   - **Relational durability** — whether the OTHER people in the decision can
 *     hold it. A spouse who was not in the room is the most common single
 *     cause of a policy surrendered in year two.
 *
 * ## What this is not
 *
 * The meta-program layer draws on Hall & Bodenhamer's Sourcebook of Magic,
 * which is a framework from the NLP literature, not a validated psychometric
 * instrument. It has no normed population, no test-retest reliability, no
 * predictive-validity study behind it. It is useful for structuring a
 * conversation and worthless as a diagnosis, and every reading this module
 * emits says so in its own `basis` field.
 *
 * Nothing here is a clinical assessment, and nothing here may be used to
 * decline to serve somebody. A low durability reading is not a reason to
 * refuse a strategy — it is a statement about what support that strategy needs
 * in order to survive contact with this particular person.
 *
 * ## Evidence ranks, and why self-report is the weakest
 *
 * "How do you feel about risk?" predicts almost nothing about what somebody
 * does at 2am when the account is down. What they DID last time it was down
 * predicts a great deal. So every input carries how it was obtained, the
 * engine weights behaviour above report, and a profile built only on
 * self-report is explicitly marked thin rather than quietly treated as solid.
 */

// ─── Evidence ────────────────────────────────────────────────────────────────

/**
 * How a thing about a person came to be known, strongest first.
 *
 * The ordering is the substance. Anything built mostly on `stated` is a record
 * of what somebody said about themselves under no pressure, which is a
 * different object from what they will do.
 */
export type EvidenceKind =
  /** They did it, or failed to, and there is a record. Strongest. */
  | 'observed'
  /** A third party who was present reports it. */
  | 'corroborated'
  /** They told us, unprompted and against their own interest. */
  | 'volunteered'
  /** They told us in answer to a question. */
  | 'stated'
  /** Nobody said it; the engine inferred it from something else. Weakest. */
  | 'inferred';

export const EVIDENCE_WEIGHT: Record<EvidenceKind, number> = {
  observed: 1.0,
  corroborated: 0.8,
  volunteered: 0.6,
  stated: 0.35,
  inferred: 0.2,
};

export interface Signal {
  readonly axis: DurabilityAxis;
  /** -2 to +2. Negative is a durability risk, positive is durability. */
  readonly direction: number;
  readonly kind: EvidenceKind;
  /** What was actually seen or said, in plain words. */
  readonly note: string;
  /** Calendar year, where known — old evidence decays. */
  readonly asOfYear?: number;
}

export type DurabilityAxis = 'cognitive' | 'emotional' | 'income' | 'relational';

export const AXES: readonly DurabilityAxis[] = ['cognitive', 'emotional', 'income', 'relational'];

// ─── Durability ──────────────────────────────────────────────────────────────

export interface AxisReading {
  readonly axis: DurabilityAxis;
  /** -2 (fragile) to +2 (durable), weighted by evidence. */
  readonly score: number;
  /**
   * 0 to 1. How much the score is worth. Built from evidence quality and
   * quantity, NOT from how extreme the score is.
   */
  readonly confidence: number;
  /** True when there is too little to say anything. */
  readonly insufficient: boolean;
  readonly signalCount: number;
  readonly strongestEvidence: EvidenceKind | null;
  /** One sentence naming what is known and how well. */
  readonly basis: string;
}

/** The threshold below which an axis is reported as unknown rather than low. */
export const MIN_CONFIDENCE = 0.3;

export function readAxis(
  axis: DurabilityAxis,
  signals: readonly Signal[],
  currentYear = 2026
): AxisReading {
  const mine = signals.filter((s) => s.axis === axis);

  if (mine.length === 0) {
    return {
      axis,
      score: 0,
      confidence: 0,
      insufficient: true,
      signalCount: 0,
      strongestEvidence: null,
      basis: `Nothing is known about ${axis} durability. This is not a neutral reading — it is an absent one, and any strategy whose demands fall on this axis should be treated as unassessed.`,
    };
  }

  let weighted = 0;
  let weight = 0;
  let best = 0;
  for (const s of mine) {
    // Evidence decays. What somebody did fifteen years ago says less about
    // them now than what they did last year, and a profile that never ages
    // its inputs will keep asserting a person who no longer exists.
    const age = s.asOfYear ? Math.max(0, currentYear - s.asOfYear) : 5;
    const recency = 1 / (1 + age / 10);
    const w = EVIDENCE_WEIGHT[s.kind] * recency;
    weighted += clamp(s.direction, -2, 2) * w;
    weight += w;
    if (w > best) best = w;
  }

  const score = weight > 0 ? weighted / weight : 0;

  // Confidence is ANCHORED to the best evidence and only modulated by volume.
  //
  // The obvious formulation — average quality times a volume curve — lets a
  // large enough pile of self-report overtake a single observation, and that
  // is wrong. Self-report about one's own behaviour under loss carries a
  // systematic bias, and more measurements of a biased instrument do not
  // remove the bias; they just make it look better attested. So the ceiling
  // is set by the strongest single piece of evidence, and repetition can move
  // confidence between half and all of that ceiling, never past it.
  const volume = 0.5 + 0.5 * (1 - Math.exp(-mine.length / 2.5));
  const confidence = clamp(best * volume, 0, 1);

  const ranked = [...mine].sort(
    (a, b) => EVIDENCE_WEIGHT[b.kind] - EVIDENCE_WEIGHT[a.kind]
  );
  const strongest = ranked[0].kind;
  const insufficient = confidence < MIN_CONFIDENCE;

  return {
    axis,
    score: round2(score),
    confidence: round2(confidence),
    insufficient,
    signalCount: mine.length,
    strongestEvidence: strongest,
    // The words caveat is about the KIND of evidence, so it belongs on the
    // reading whether or not there is enough of it to act on.
    basis:
      `${mine.length} signal(s) on ${axis}, strongest of kind "${strongest}".` +
      (strongest === 'stated' || strongest === 'inferred'
        ? ' Nothing here rests on observed behaviour, so it records what was said rather than what will be done.'
        : '') +
      (insufficient
        ? ' Not enough to rely on — treat this axis as unassessed rather than average.'
        : ''),
  };
}

export interface Genome {
  readonly readings: Readonly<Record<DurabilityAxis, AxisReading>>;
  /** Axes with too little evidence to use. */
  readonly unassessed: readonly DurabilityAxis[];
  /** 0 to 1 across all four axes — how much of this person is actually known. */
  readonly coverage: number;
  readonly note: string;
}

export function buildGenome(signals: readonly Signal[], currentYear = 2026): Genome {
  const readings = Object.fromEntries(
    AXES.map((a) => [a, readAxis(a, signals, currentYear)])
  ) as Record<DurabilityAxis, AxisReading>;

  const unassessed = AXES.filter((a) => readings[a].insufficient);
  const coverage = round2(
    AXES.reduce((acc, a) => acc + readings[a].confidence, 0) / AXES.length
  );

  return {
    readings,
    unassessed,
    coverage,
    note:
      unassessed.length === 0
        ? 'All four axes carry usable evidence.'
        : `${unassessed.length} of 4 axes are unassessed (${unassessed.join(', ')}). Any fit finding that depends on them is provisional, and the gap is worth closing before a recommendation is made rather than after.`,
  };
}

// ─── What a strategy demands ─────────────────────────────────────────────────

/**
 * A demand a strategy makes on the person holding it.
 *
 * `mechanism` is the point of this type. It is not "this is a complex
 * product" — it is the specific contractual or arithmetic feature that turns
 * a human limit into lost money, drawn from what the other engines on this
 * platform already model.
 */
export interface Demand {
  readonly axis: DurabilityAxis;
  /** How much durability this demands, 0 (none) to 2 (a great deal). */
  readonly severity: number;
  /** The contractual or arithmetic feature that does the damage. */
  readonly mechanism: string;
  /** What it costs when the person cannot meet it. */
  readonly failureMode: string;
  /** What makes it survivable. Never "find a different client". */
  readonly mitigation: string;
}

export interface Strategy {
  readonly id: string;
  readonly name: string;
  readonly demands: readonly Demand[];
  /** Where the mechanism claims come from. */
  readonly source: string;
}

/**
 * The strategies this platform models, and what each one asks of a person.
 *
 * Every mechanism below is something another module on this platform computes
 * — surrender schedules, segment credits, loan arbitrage, the MEC test, the
 * seven-pay period. They are not adjectives.
 */
export const STRATEGIES: readonly Strategy[] = [
  {
    id: 'iul-max-funded',
    name: 'Maximum-funded indexed life, borrowed against later',
    source: 'policyMechanics, balancedIndexedAccount, policyLoanMechanics, costStructure',
    demands: [
      {
        axis: 'emotional',
        severity: 2,
        mechanism:
          'The two-year balanced account credited 0% in two of the six segments over 2019-2025, one of them on an index that was UP over the period — the spread took it below the floor.',
        failureMode:
          'A zero on the statement reads as "this is not working" rather than "the floor did its job". Surrender inside the charge period costs real money on top of the lost strategy.',
        mitigation:
          'Show the zero years at the sale, not after one arrives. A client who was told to expect two flat segments in six behaves differently from one who is surprised by the first.',
      },
      {
        axis: 'income',
        severity: 2,
        mechanism:
          'A five-pay design carries a surrender charge running ten-plus years and a per-thousand charge that does not care whether the premium arrives.',
        failureMode:
          'Income interruption in the funding period forces either a reduced policy or a lapse. Lapse with a loan outstanding is the worst case in this entire platform: the discharged loan is part of the amount realised, so the whole gain is ordinary income with no cash to pay it.',
        mitigation:
          'Fund below capacity. A policy that survives is worth more than an optimal one that does not.',
      },
      {
        axis: 'cognitive',
        severity: 1,
        mechanism:
          'Segment credits, participation, spread, floor, the corridor, and loan arbitrage all operate at once and none of them are visible on a statement.',
        failureMode:
          'Not being able to re-derive the number becomes not trusting it, and the exit happens at the worst moment rather than a considered one.',
        mitigation:
          'One page they can hold: what is charged, what is credited, what the floor does. Re-derivable beats impressive.',
      },
      {
        axis: 'relational',
        severity: 2,
        mechanism:
          'The funding period outlives most people\'s patience for a decision their partner did not make with them.',
        failureMode:
          'A spouse who was not in the room becomes the reason for surrender in year two, and the objection surfaces as a statement question rather than as disagreement.',
        mitigation:
          'Both people at the table, or do not write it.',
      },
    ],
  },
  {
    id: 'policy-loan-income',
    name: 'Policy loans as retirement income',
    source: 'policyLoanMechanics, yearsToCrossover',
    demands: [
      {
        axis: 'cognitive',
        severity: 2,
        mechanism:
          'Loan balance compounds against cash value; the crossover year is ln(cashValue/loan) / ln((1+charged)/(1+credited)).',
        failureMode:
          'Drawing on a balance they think of as savings rather than a loan, past the crossover, until the policy lapses and the gain becomes taxable income with no cash behind it.',
        mitigation:
          'An annual crossover check with a hard stop, in writing, agreed before the first draw.',
      },
      {
        axis: 'emotional',
        severity: 1,
        mechanism:
          'A participating loan is charged the full rate in a zero-credit year.',
        failureMode:
          'Panic in a flat year leads to stopping distributions at exactly the point the plan required continuing.',
        mitigation: 'Model a flat stretch at the outset so it is expected rather than a shock.',
      },
    ],
  },
  {
    id: 'roth-conversion',
    name: 'Roth conversion',
    source: 'taxBracketEngine, erosion trajectory',
    demands: [
      {
        axis: 'emotional',
        severity: 2,
        mechanism:
          'The tax is paid now, in cash, for a benefit that arrives decades later and is never itemised on any statement.',
        failureMode:
          'Conversion regret after a market fall — the tax was real and the benefit is invisible — followed by abandoning a multi-year ladder halfway, which is the worst of both.',
        mitigation:
          'Convert in tranches with a written rule for what would legitimately stop it, so stopping is a decision rather than a reaction.',
      },
      {
        axis: 'income',
        severity: 1,
        mechanism: 'Paying the conversion tax from the converted balance destroys most of the benefit.',
        failureMode: 'Outside cash runs short and the ladder quietly becomes a wash.',
        mitigation: 'Size each tranche to the outside cash actually available, not the bracket headroom.',
      },
    ],
  },
  {
    id: 'mortgage-elimination',
    name: 'Accelerated mortgage elimination',
    source: 'mortgageKiller',
    demands: [
      {
        axis: 'income',
        severity: 2,
        mechanism: 'Acceleration converts liquid cash into illiquid equity.',
        failureMode:
          'An income interruption after the liquidity is gone forces borrowing at a worse rate than the mortgage that was just paid off.',
        mitigation: 'Reserve first, accelerate second. Never the reverse.',
      },
      {
        axis: 'cognitive',
        severity: 0,
        mechanism: 'The arithmetic is a single interest calculation.',
        failureMode: 'Rare. This is the most legible strategy on the platform.',
        mitigation: 'None needed.',
      },
    ],
  },
  {
    id: 'equity-accumulation',
    name: 'Direct market accumulation',
    source: 'monteCarloEngine, indexCreditingData',
    demands: [
      {
        axis: 'emotional',
        severity: 2,
        mechanism:
          'The S&P 500 price index fell 38.3% in 2008 and 19.5% in 2022. There is no floor.',
        failureMode:
          'Selling at the bottom. The single largest destroyer of realised return, and it is a behavioural event, not a market one.',
        mitigation:
          'Hold less equity than theory allows. A portfolio they keep beats an optimal one they sell.',
      },
      {
        axis: 'income',
        severity: 1,
        mechanism: 'Sequence-of-returns risk in the withdrawal phase.',
        failureMode: 'Drawing from a falling balance permanently impairs the capital.',
        mitigation: 'A cash buffer sized to the longest historical recovery, not the average one.',
      },
    ],
  },
];

// ─── Fit ─────────────────────────────────────────────────────────────────────

export interface UnmetDemand extends Demand {
  /** How far short of the demand this person's durability falls. */
  readonly shortfall: number;
  readonly axisScore: number;
  readonly axisConfidence: number;
  /** True when the axis had too little evidence to judge. */
  readonly unassessed: boolean;
}

export interface Fit {
  readonly strategyId: string;
  readonly strategyName: string;
  /**
   * The verdict, and deliberately not a number.
   *
   *   supported    — demands are met on the evidence available
   *   conditional  — workable if the named mitigations are actually in place
   *   strained     — a real failure mode is live; do it only with eyes open
   *   unassessed   — the axes this strategy leans on are not known
   */
  readonly verdict: 'supported' | 'conditional' | 'strained' | 'unassessed';
  readonly unmet: readonly UnmetDemand[];
  /** Every demand this person does meet, so the finding is not all warning. */
  readonly met: readonly Demand[];
  /** What would have to become true. Never "this client is unsuitable". */
  readonly whatWouldMakeItWork: readonly string[];
  readonly source: string;
  readonly caveat: string;
}

/** A demand is met when durability reaches this much of its severity. */
const MET_MARGIN = 0.0;

export function assessFit(strategy: Strategy, genome: Genome): Fit {
  const unmet: UnmetDemand[] = [];
  const met: Demand[] = [];
  let anyUnassessed = false;

  for (const d of strategy.demands) {
    if (d.severity === 0) {
      met.push(d);
      continue;
    }
    const r = genome.readings[d.axis];

    if (r.insufficient) {
      anyUnassessed = true;
      unmet.push({
        ...d,
        shortfall: d.severity,
        axisScore: r.score,
        axisConfidence: r.confidence,
        unassessed: true,
      });
      continue;
    }

    // Severity 2 wants a clearly durable reading; severity 1 wants neutral or
    // better. Required durability runs from 0 at severity 1 to +1 at severity 2.
    const required = d.severity - 1;
    if (r.score >= required + MET_MARGIN) {
      met.push(d);
    } else {
      unmet.push({
        ...d,
        shortfall: round2(required - r.score),
        axisScore: r.score,
        axisConfidence: r.confidence,
        unassessed: false,
      });
    }
  }

  const realUnmet = unmet.filter((u) => !u.unassessed);
  const severeUnmet = realUnmet.filter((u) => u.severity >= 2);

  let verdict: Fit['verdict'];
  if (severeUnmet.length > 0) verdict = 'strained';
  else if (realUnmet.length > 0) verdict = 'conditional';
  else if (anyUnassessed) verdict = 'unassessed';
  else verdict = 'supported';

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    verdict,
    unmet,
    met,
    whatWouldMakeItWork: unmet.map((u) =>
      u.unassessed
        ? `Establish ${u.axis} durability before relying on this — it is unknown, not adequate.`
        : u.mitigation
    ),
    source: strategy.source,
    caveat:
      'A strained verdict is a statement about the support this strategy needs, not about the person, and never a reason to decline to serve somebody. Nothing here is a clinical or psychometric assessment.',
  };
}

export interface GenomeReport {
  readonly genome: Genome;
  readonly fits: readonly Fit[];
  /** Ordered best-supported first, so the conversation starts where it can. */
  readonly ordered: readonly Fit[];
  /** The single most valuable thing to find out next. */
  readonly nextBestQuestion: string | null;
  readonly disclaimer: string;
}

const VERDICT_RANK: Record<Fit['verdict'], number> = {
  supported: 0,
  conditional: 1,
  unassessed: 2,
  strained: 3,
};

export function wealthGenomeReport(
  signals: readonly Signal[],
  currentYear = 2026,
  strategies: readonly Strategy[] = STRATEGIES
): GenomeReport {
  const genome = buildGenome(signals, currentYear);
  const fits = strategies.map((s) => assessFit(s, genome));

  const ordered = [...fits].sort((a, b) => {
    const r = VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict];
    return r !== 0 ? r : a.unmet.length - b.unmet.length;
  });

  return {
    genome,
    fits,
    ordered,
    nextBestQuestion: nextBestQuestion(genome, strategies),
    disclaimer:
      'The Wealth Genome structures a conversation about fit. It is built on a framework from the NLP literature (Hall & Bodenhamer, The Sourcebook of Magic) which is not a validated psychometric instrument, and on evidence whose quality it reports openly. It does not diagnose, does not score a person, and must not be used to decline service.',
  };
}

/**
 * Which unknown would change the most, measured by the severity riding on it.
 *
 * Asking the highest-value question first is the difference between a profile
 * that gets finished and one that gets abandoned half-built.
 */
export function nextBestQuestion(
  genome: Genome,
  strategies: readonly Strategy[] = STRATEGIES
): string | null {
  if (genome.unassessed.length === 0) return null;

  let bestAxis: DurabilityAxis | null = null;
  let bestWeight = -1;
  for (const axis of genome.unassessed) {
    const weight = strategies
      .flatMap((s) => s.demands)
      .filter((d) => d.axis === axis)
      .reduce((acc, d) => acc + d.severity, 0);
    if (weight > bestWeight) {
      bestWeight = weight;
      bestAxis = axis;
    }
  }
  if (!bestAxis) return null;

  return AXIS_QUESTIONS[bestAxis];
}

/**
 * The highest-yield opening question per axis.
 *
 * Each one asks for an EVENT rather than a self-assessment, because "how do
 * you feel about risk" produces a sentence and "what did you do in March 2020"
 * produces evidence.
 */
export const AXIS_QUESTIONS: Record<DurabilityAxis, string> = {
  emotional:
    'When the market fell in 2008, or in 2020, or in 2022 — what did you actually do with your money? Not what you thought. What you did.',
  income:
    'In the last ten years, has your income ever stopped or dropped sharply? What happened, and how long before it recovered?',
  cognitive:
    'Think of a financial decision you made that you could not fully explain to someone else. Did you keep it, or did you unwind it?',
  relational:
    'Who else has to be comfortable with this for it to survive — and what happens if they are not in the room when it is decided?',
};

// ─── The meta-program layer ──────────────────────────────────────────────────

/**
 * Meta-program readings that bear on durability.
 *
 * Framework, not instrument. Every entry says so, and the engine treats a
 * meta-program reading as `inferred` evidence — the weakest rank — because
 * that is what it is.
 */
export interface MetaProgramLink {
  /** Number and name as they appear in the Sourcebook reference. */
  readonly id: number;
  readonly name: string;
  readonly poles: readonly [string, string];
  readonly axis: DurabilityAxis;
  /** What the first pole implies for durability on that axis, -2..+2. */
  readonly firstPoleDirection: number;
  readonly whyItMatters: string;
}

export const META_PROGRAM_LINKS: readonly MetaProgramLink[] = [
  {
    id: 8,
    name: 'Durability',
    poles: ['Permeable', 'Impermeable'],
    axis: 'emotional',
    firstPoleDirection: -1,
    whyItMatters:
      'The reference calls this one durability outright. A permeable sort takes a drawdown personally and acts on it; an impermeable sort lets it pass.',
  },
  {
    id: 7,
    name: 'Scenario Thinking (Attribution Style)',
    poles: ['Best case (Optimist)', 'Worst case (Pessimist)'],
    axis: 'emotional',
    firstPoleDirection: -1,
    whyItMatters:
      'Best-case sorting under-provisions for the flat years and is most surprised by the first zero credit. Worst-case sorting holds better through them and needs different handling at the sale.',
  },
  {
    id: 14,
    name: 'Frame of Reference (Authority Sort)',
    poles: ['Internal/Self-Referent', 'External/Other-Referent'],
    axis: 'relational',
    firstPoleDirection: 1,
    whyItMatters:
      'An external-referent decision-maker will re-decide every time a third party comments, so the durability of the strategy depends on people who are not in the room.',
  },
  {
    id: 1,
    name: 'Chunk Size',
    poles: ['General (gestalt)', 'Specific (detail)'],
    axis: 'cognitive',
    firstPoleDirection: -1,
    whyItMatters:
      'A general sorter will accept a structure they cannot re-derive, which holds until it does not. A specific sorter needs the mechanics or will not commit at all.',
  },
  {
    id: 20,
    name: 'Motivation Direction',
    poles: ['Toward Values', 'Away From'],
    axis: 'income',
    firstPoleDirection: 0,
    whyItMatters:
      'Neither pole is more durable. Away-from motivation funds protection readily and abandons accumulation once the fear settles; toward motivation does the reverse. It changes which strategy survives, not how well.',
  },
  {
    id: 27,
    name: 'Responsibility',
    poles: ['Over-responsible', 'Under-responsible'],
    axis: 'income',
    firstPoleDirection: 1,
    whyItMatters:
      'Over-responsible sorting keeps funding a commitment through an income shock, sometimes past the point it should be reduced. Under-responsible sorting lets it lapse early.',
  },
];

/** Turn a meta-program reading into a signal, correctly marked as weak. */
export function signalFromMetaProgram(
  link: MetaProgramLink,
  pole: 0 | 1,
  note: string,
  asOfYear?: number
): Signal {
  const direction = pole === 0 ? link.firstPoleDirection : -link.firstPoleDirection;
  return {
    axis: link.axis,
    direction,
    kind: 'inferred',
    note: `Meta-program #${link.id} ${link.name} read as "${link.poles[pole]}" — ${note}. Framework reading, not a measurement.`,
    asOfYear,
  };
}

// ─── The bridge to the financial genome ──────────────────────────────────────

/**
 * Turn the eight-dimension financial genome into durability signals.
 *
 * Deliberately weak. A high Income Stability score says the money has been
 * steady; it does NOT say the person kept funding through the month it was
 * not. So every signal this produces enters as `inferred` — the lowest rank —
 * and four of them together still leave an axis unassessed. That is the
 * intended behaviour: the financial genome can point at where to look, and it
 * cannot stand in for having looked.
 *
 * Only the dimensions that actually bear on durability are mapped. Tax
 * efficiency and estate planning say nothing about whether somebody can hold a
 * position, so they are left out rather than stretched.
 */
export function signalsFromFinancialGenome(
  dimensions: readonly { key: string; name: string; score: number }[],
  asOfYear?: number
): readonly Signal[] {
  const MAP: Record<string, DurabilityAxis> = {
    income: 'income',
    risk: 'emotional',
    diversification: 'cognitive',
    debt: 'income',
  };

  const out: Signal[] = [];
  for (const d of dimensions) {
    const axis = MAP[d.key];
    if (!axis) continue;
    // 0-100 onto -2..+2, with the middle band reading as neutral rather than
    // as a weak opinion in either direction.
    const centred = (clamp(d.score, 0, 100) - 50) / 25;
    out.push({
      axis,
      direction: clamp(centred, -2, 2),
      kind: 'inferred',
      note: `Financial genome dimension "${d.name}" scored ${d.score}/100. A fact about the plan, not an observation of the person.`,
      asOfYear,
    });
  }
  return out;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
