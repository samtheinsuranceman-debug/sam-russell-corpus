/**
 * The twenty-one factors, what to ask to find each one, and the shape they make.
 *
 * ## What this adds to the four durability axes
 *
 * wealthGenomeDurability.ts reads four axes — cognitive, emotional, income,
 * relational. Those answer "can this person hold a strategy?". They do not
 * answer "which strategy is even on the table?", and seventeen further factors
 * decide that. A client with thirty years of runway, no dependents and a
 * deferred-comp plan vesting in four years is in a different universe from one
 * with an eight-year horizon, a special-needs child and a concentrated position
 * in an employer they may outlive.
 *
 * All twenty-one live here together because the interesting information is in
 * how they COMBINE, and a factor kept in a separate file never combines with
 * anything.
 *
 * ## Three things every factor carries, and why the third is the unusual one
 *
 * **A question.** Not a rating scale. Each one asks for a fact or an event,
 * because "how important is legacy to you?" produces a polite answer and "if
 * you spent it all and left nothing, who would be hurt?" produces a real one.
 *
 * **A weight.** How much this factor moves strategy selection. Weights are NOT
 * global constants — see `personalWeights()`. A factor's importance depends on
 * the rest of the configuration: liquidity need matters enormously when income
 * is fragile and much less when it is not.
 *
 * **A volatility class.** This is the one most models omit. Numeracy is a
 * stable trait; liquidity need changes with the season; health can change in a
 * single afternoon. Treating a reading taken once as permanently true is how a
 * plan ends up built on a fact that expired. So each factor declares whether
 * it is `stable`, `drifting` or `episodic`, and the shape draws a variable
 * factor as a BAND rather than a point.
 *
 * ## The shape
 *
 * Twenty-one factors are placed on a sphere by the Fibonacci lattice, which
 * spaces them as evenly as any arrangement can. Each factor pushes its vertex
 * out or pulls it in by its score, so the person becomes a deformed sphere —
 * a solid, lumpy object rather than a radar chart.
 *
 * Three readable properties, none of them decoration:
 *
 *   - **Radius** is the score. Spikes are strengths, dents are exposures.
 *   - **Band thickness** is volatility. A stable factor is a crisp point; an
 *     episodic one is a thick shell, because the truthful statement is "it is
 *     somewhere in here", not "it is exactly there".
 *   - **Opacity** is confidence. A factor nobody has asked about is nearly
 *     invisible, so a genome built on three answers LOOKS like a genome built
 *     on three answers and cannot be mistaken for a finished one.
 *
 * The geometry is deterministic: the same answers always give the same solid,
 * and two different people essentially never produce the same one.
 */

import type { DurabilityAxis } from './wealthGenomeDurability';

// ─── Volatility ──────────────────────────────────────────────────────────────

export type Volatility =
  /** A trait. Re-asking next year should give the same answer. */
  | 'stable'
  /** Moves slowly and predictably — with age, tenure, the plan itself. */
  | 'drifting'
  /** Can change completely between two conversations. Diagnosis, redundancy, a birth. */
  | 'episodic';

/** How wide a band the shape draws for each class, as a fraction of radius. */
export const VOLATILITY_BAND: Record<Volatility, number> = {
  stable: 0.04,
  drifting: 0.14,
  episodic: 0.32,
};

/** How fast a reading of this kind should be treated as out of date, in months. */
export const REASK_AFTER_MONTHS: Record<Volatility, number> = {
  stable: 60,
  drifting: 24,
  episodic: 6,
};

// ─── The factors ─────────────────────────────────────────────────────────────

export type FactorGroup =
  | 'durability'
  | 'horizon'
  | 'obligation'
  | 'structure'
  | 'disposition';

export interface Factor {
  readonly id: string;
  readonly name: string;
  readonly group: FactorGroup;
  /** Plain statement of what a HIGH score means, so the sign is never ambiguous. */
  readonly highMeans: string;
  readonly lowMeans: string;
  readonly volatility: Volatility;
  /**
   * Baseline influence on strategy selection, 0-1, before the person's own
   * configuration adjusts it. A starting point, not a finding.
   */
  readonly baseWeight: number;
  /** The question that gets a real answer instead of a polite one. */
  readonly question: string;
  /** Why that question rather than the obvious one. */
  readonly questionNote: string;
  /** The durability axis this also informs, where it does. */
  readonly feedsAxis?: DurabilityAxis;
}

/**
 * Twenty-one factors: the four durability axes, and seventeen more.
 *
 * Ordered by group so a conversation can move through them in a shape that
 * makes sense to a human — not alphabetically, which makes sense to nobody.
 */
export const FACTORS: readonly Factor[] = [
  // ── The four durability axes, restated here so all twenty-one are one list
  {
    id: 'cognitive-durability',
    name: 'Cognitive durability',
    group: 'durability',
    highMeans: 'Can hold a decision they cannot fully re-derive.',
    lowMeans: 'Not understanding becomes not trusting becomes exiting.',
    volatility: 'stable',
    baseWeight: 0.7,
    question:
      'Think of a financial decision you made that you could not fully explain to someone else. Did you keep it, or did you unwind it?',
    questionNote:
      'Asks for an outcome, not a self-rating. People overrate their own tolerance for complexity and their history does not.',
    feedsAxis: 'cognitive',
  },
  {
    id: 'emotional-durability',
    name: 'Emotional durability',
    group: 'durability',
    highMeans: 'Holds through drawdowns and flat years.',
    lowMeans: 'Acts on a statement that went backwards.',
    volatility: 'drifting',
    baseWeight: 0.95,
    question:
      'When the market fell in 2008, or 2020, or 2022 — what did you actually do with your money? Not what you thought. What you did.',
    questionNote:
      'The single highest-yield question in the set. Behaviour under loss predicts behaviour under loss; stated risk tolerance predicts almost nothing.',
    feedsAxis: 'emotional',
  },
  {
    id: 'income-durability',
    name: 'Income durability',
    group: 'durability',
    highMeans: 'Income survives a funding commitment.',
    lowMeans: 'A multi-year commitment is a lapse waiting for a date.',
    volatility: 'drifting',
    baseWeight: 0.95,
    question:
      'In the last ten years, has your income ever stopped or dropped sharply? What happened, and how long before it recovered?',
    questionNote:
      'The recovery time matters more than the drop. A six-week gap and an eighteen-month gap are different products.',
    feedsAxis: 'income',
  },
  {
    id: 'relational-durability',
    name: 'Relational durability',
    group: 'durability',
    highMeans: 'The other decision-makers can hold it too.',
    lowMeans: 'A partner who was not in the room ends it in year two.',
    volatility: 'episodic',
    baseWeight: 0.8,
    question:
      'Who else has to be comfortable with this for it to survive — and what happens if they are not in the room when it is decided?',
    questionNote:
      'Episodic because a relationship can change faster than any other factor here, and the plan does not survive the change.',
    feedsAxis: 'relational',
  },

  // ── Horizon: when the money is needed
  {
    id: 'time-horizon',
    name: 'Time horizon',
    group: 'horizon',
    highMeans: 'Decades before the money is needed.',
    lowMeans: 'Needed soon; surrender periods and segment terms may outlast the plan.',
    volatility: 'drifting',
    baseWeight: 1.0,
    question:
      'What is the first date any of this money has to be available for something you already know about?',
    questionNote:
      'Asks for a date and a known use, which surfaces the tuition bill or the house purchase that a "long-term investor" forgot to mention.',
  },
  {
    id: 'liquidity-need',
    name: 'Liquidity need',
    group: 'horizon',
    highMeans: 'Needs little kept reachable.',
    lowMeans: 'Needs a great deal reachable; illiquid strategies will be broken into.',
    volatility: 'episodic',
    baseWeight: 0.9,
    question:
      'If a $25,000 bill arrived on Friday, where would the money come from? Walk me through it.',
    questionNote:
      'A concrete amount and a deadline. "Do you have an emergency fund" gets a yes; this gets the actual sequence, including the credit card.',
  },
  {
    id: 'longevity-expectation',
    name: 'Longevity expectation',
    group: 'horizon',
    highMeans: 'Long expected life; outliving the money is the live risk.',
    lowMeans: 'Shorter expectation; leaving it behind is the live question.',
    volatility: 'episodic',
    baseWeight: 0.7,
    question:
      'How long did your parents and grandparents live, and what did they die of? And how is your own health compared with theirs at your age?',
    questionNote:
      'Family history plus a self-comparison. Episodic because one diagnosis rewrites it entirely.',
  },
  {
    id: 'dependents',
    name: 'Dependent load',
    group: 'obligation',
    highMeans: 'Few or no dependants.',
    lowMeans: 'Others rely on this money now or will.',
    volatility: 'episodic',
    baseWeight: 0.85,
    question:
      'Who depends on your income today, and who will still depend on it in ten years?',
    questionNote:
      'The ten-year half catches the adult child who is not leaving and the parent who has not needed help yet.',
  },
  {
    id: 'care-obligation',
    name: 'Care obligation',
    group: 'obligation',
    highMeans: 'No open-ended care responsibility.',
    lowMeans: 'A special-needs or elder-care obligation with no end date.',
    volatility: 'episodic',
    baseWeight: 0.75,
    question:
      'Is there anyone in your family whose care might fall to you, at any point, for an indefinite period?',
    questionNote:
      'Changes the whole structure — a special-needs trust or an elder-care obligation reorders every other priority and is rarely volunteered.',
  },
  {
    id: 'legacy-intent',
    name: 'Legacy intent',
    group: 'obligation',
    highMeans: 'Intends to spend it; what remains is incidental.',
    lowMeans: 'What passes on matters a great deal.',
    volatility: 'drifting',
    baseWeight: 0.7,
    question:
      'If you spent every dollar and left nothing behind, who would be hurt by that — and would they be right to be?',
    questionNote:
      'The second clause is the useful one. It separates a real legacy intent from a habit of saying legacy matters.',
  },
  {
    id: 'spending-elasticity',
    name: 'Spending elasticity',
    group: 'obligation',
    highMeans: 'Could cut spending substantially if needed.',
    lowMeans: 'Spending is committed; there is nothing to cut.',
    volatility: 'drifting',
    baseWeight: 0.65,
    question:
      'If your income halved tomorrow and had to stay halved, what would be the first three things to go — and how long would that take?',
    questionNote:
      'Naming three specific things reveals whether the answer is real. Someone who cannot name the first one has no elasticity.',
    feedsAxis: 'income',
  },

  // ── Structure: the shape of what they already have
  {
    id: 'concentration',
    name: 'Concentration',
    group: 'structure',
    highMeans: 'Wealth is spread across uncorrelated sources.',
    lowMeans: 'One employer, one property or one position carries most of it.',
    volatility: 'drifting',
    baseWeight: 0.85,
    question:
      'If the single largest thing you own were worth half tomorrow, what fraction of your net worth would be gone?',
    questionNote:
      'Gets the number without requiring a balance sheet, and catches the case where the employer is both the job and the stock.',
  },
  {
    id: 'leverage',
    name: 'Existing leverage',
    group: 'structure',
    highMeans: 'Little debt; capacity to borrow remains.',
    lowMeans: 'Already leveraged; another commitment compounds a fragility.',
    volatility: 'drifting',
    baseWeight: 0.8,
    question:
      'What do you owe, to whom, at what rate, and which of those rates can change without your agreement?',
    questionNote:
      'The last clause finds the variable-rate exposure and the HELOC that can be frozen, which fixed-rate thinking misses.',
  },
  {
    id: 'business-ownership',
    name: 'Closely-held interest',
    group: 'structure',
    highMeans: 'No illiquid business interest.',
    lowMeans: 'A material closely-held interest that cannot be sold quickly or partly.',
    volatility: 'drifting',
    baseWeight: 0.7,
    question:
      'Do you own part of a business that is not publicly traded? Who else owns it, and what happens to your share if you die or want out?',
    questionNote:
      'The buy-sell question. Many owners discover at this point that there is no agreement, which is itself the finding.',
  },
  {
    id: 'tax-posture',
    name: 'Tax posture',
    group: 'structure',
    highMeans: 'Expects a lower bracket later; deferral favoured.',
    lowMeans: 'Expects a higher bracket later; paying tax now favoured.',
    volatility: 'drifting',
    baseWeight: 0.85,
    question:
      'Do you think your tax rate in retirement will be higher or lower than today — and what makes you think so?',
    questionNote:
      'The reason matters more than the answer. "Lower, because I will earn less" ignores required distributions and rate changes, and that gap is the conversation.',
  },
  {
    id: 'state-exposure',
    name: 'State and location exposure',
    group: 'structure',
    highMeans: 'Location is settled and tax-favourable.',
    lowMeans: 'High-tax or likely to move; state treatment may change under the plan.',
    volatility: 'drifting',
    baseWeight: 0.6,
    question:
      'Where will you actually live in retirement, and how sure are you? Have you looked at what that state does to this income?',
    questionNote:
      'State treatment of pensions, annuity income and estates varies enormously, and plans are routinely built in the wrong state.',
  },
  {
    id: 'insurability',
    name: 'Insurability',
    group: 'structure',
    highMeans: 'Would underwrite well; the door is open.',
    lowMeans: 'Health or history limits what can be issued, or the door is closing.',
    volatility: 'episodic',
    baseWeight: 0.75,
    question:
      'What medications do you take, what has a doctor investigated in the last five years, and has anyone in your family had anything significant before sixty?',
    questionNote:
      'Insurability is a door that closes and does not reopen. Episodic because one test result changes it permanently.',
  },
  {
    id: 'inflation-exposure',
    name: 'Inflation exposure',
    group: 'structure',
    highMeans: 'Income and assets adjust with prices.',
    lowMeans: 'Fixed nominal income; purchasing power erodes with no offset.',
    volatility: 'drifting',
    baseWeight: 0.7,
    question:
      'Which parts of your future income go up when prices go up, and which are fixed in dollars?',
    questionNote:
      'Forces the sorting that pensions, annuities and Social Security all require, and that most people have never done.',
  },

  // ── Disposition: how they engage
  {
    id: 'numeracy',
    name: 'Numeracy',
    group: 'disposition',
    highMeans: 'Comfortable with rates, compounding and probability.',
    lowMeans: 'Numbers do not carry meaning; explanation must be structural.',
    volatility: 'stable',
    baseWeight: 0.6,
    question:
      'If something grows 7% a year, roughly how long until it doubles? No wrong answer — I want to know how to explain things to you.',
    questionNote:
      'A real diagnostic, framed so it cannot humiliate. Distinct from cognitive durability: numeracy is about the language to use, durability is about whether they hold.',
    feedsAxis: 'cognitive',
  },
  {
    id: 'institutional-trust',
    name: 'Institutional trust',
    group: 'disposition',
    highMeans: 'Willing to rely on an institution or an adviser.',
    lowMeans: 'Has been burned; will verify everything or disengage.',
    volatility: 'drifting',
    baseWeight: 0.7,
    question:
      'How many financial advisers have you worked with, and why did each of those end?',
    questionNote:
      'The pattern of endings is the finding. Three advisers in five years predicts a fourth ending.',
    feedsAxis: 'relational',
  },
  {
    id: 'attention-budget',
    name: 'Attention budget',
    group: 'disposition',
    highMeans: 'Willing and able to engage regularly.',
    lowMeans: 'Will not look at it; anything needing annual maintenance will not get it.',
    volatility: 'drifting',
    baseWeight: 0.65,
    question:
      'Realistically, how often will you look at this once it is set up? When did you last log in to any of your accounts?',
    questionNote:
      'The second half checks the first. A strategy needing an annual crossover review and a client who logs in every other year is a lapse being scheduled.',
  },
];

export const FACTOR_COUNT = FACTORS.length;

// ─── Readings ────────────────────────────────────────────────────────────────

export interface FactorReading {
  readonly factorId: string;
  /** -2 (the low pole) to +2 (the high pole). */
  readonly score: number;
  /** 0-1. How much the reading is worth — normally from the evidence layer. */
  readonly confidence: number;
  /** Months since the answer was obtained. Drives staleness. */
  readonly ageMonths?: number;
}

export interface FactorState extends FactorReading {
  readonly factor: Factor;
  /** True when this class of factor should be re-asked by now. */
  readonly stale: boolean;
  /** Half-width of the band the shape draws, in radius units. */
  readonly band: number;
  /** Weight after the person's own configuration is taken into account. */
  readonly weight: number;
}

/**
 * Weights adjusted by the rest of the configuration.
 *
 * This is what makes a genome the person's rather than the model's. A factor's
 * importance is not fixed: liquidity need matters far more when income is
 * fragile, tax posture matters more with a long horizon, insurability matters
 * more when dependants rely on the income. Those interactions are declared
 * below and applied multiplicatively.
 *
 * Only interactions with a stated reason are included. An interaction matrix
 * across twenty-one factors has four hundred-odd cells and inventing them all
 * would produce a model that looks sophisticated and means nothing.
 */
export function personalWeights(
  readings: readonly FactorReading[]
): Readonly<Record<string, number>> {
  const by = new Map(readings.map((r) => [r.factorId, r]));
  const s = (id: string): number => by.get(id)?.score ?? 0;
  const known = (id: string): boolean => (by.get(id)?.confidence ?? 0) >= 0.3;

  const out: Record<string, number> = {};
  for (const f of FACTORS) out[f.id] = f.baseWeight;

  const bump = (id: string, mult: number) => {
    out[id] = Math.min(1, out[id] * mult);
  };

  // Fragile income makes liquidity and elasticity decisive rather than useful.
  if (known('income-durability') && s('income-durability') < 0) {
    bump('liquidity-need', 1.3);
    bump('spending-elasticity', 1.3);
  }
  // A long horizon makes tax posture and inflation dominate; a short one makes
  // them nearly irrelevant next to liquidity.
  if (known('time-horizon')) {
    if (s('time-horizon') > 0.5) {
      bump('tax-posture', 1.25);
      bump('inflation-exposure', 1.25);
    } else if (s('time-horizon') < -0.5) {
      bump('liquidity-need', 1.35);
      out['tax-posture'] *= 0.7;
      out['inflation-exposure'] *= 0.7;
    }
  }
  // Dependants make insurability and legacy load-bearing.
  if (known('dependents') && s('dependents') < 0) {
    bump('insurability', 1.3);
    bump('legacy-intent', 1.2);
  }
  // Concentration and leverage compound: either alone is a position, both
  // together is a single point of failure.
  if (known('concentration') && known('leverage') && s('concentration') < 0 && s('leverage') < 0) {
    bump('concentration', 1.3);
    bump('leverage', 1.3);
    bump('liquidity-need', 1.2);
  }
  // Someone who will not engage cannot run a strategy needing maintenance,
  // which makes the fact that they will not engage more important than most
  // of what they own.
  if (known('attention-budget') && s('attention-budget') < -0.5) {
    bump('attention-budget', 1.4);
    bump('cognitive-durability', 1.2);
  }
  // An open-ended care obligation reorders everything beneath it.
  if (known('care-obligation') && s('care-obligation') < 0) {
    bump('liquidity-need', 1.25);
    bump('longevity-expectation', 1.15);
  }

  for (const k of Object.keys(out)) out[k] = round3(Math.min(1, out[k]));
  return out;
}

export function factorStates(readings: readonly FactorReading[]): readonly FactorState[] {
  const weights = personalWeights(readings);
  const by = new Map(readings.map((r) => [r.factorId, r]));

  return FACTORS.map((factor) => {
    const r = by.get(factor.id);
    const score = clamp(r?.score ?? 0, -2, 2);
    const confidence = clamp(r?.confidence ?? 0, 0, 1);
    const ageMonths = r?.ageMonths ?? 0;

    return {
      factorId: factor.id,
      factor,
      score,
      confidence,
      ageMonths,
      stale: r ? ageMonths > REASK_AFTER_MONTHS[factor.volatility] : false,
      // A low-confidence reading widens the band too: uncertainty about the
      // measurement and variability in the thing measured both mean the same
      // thing to a reader, which is "do not treat this as a point".
      band: round3(VOLATILITY_BAND[factor.volatility] + (1 - confidence) * 0.25),
      weight: weights[factor.id],
    };
  });
}

// ─── The shape ───────────────────────────────────────────────────────────────

export interface ShapeVertex {
  readonly factorId: string;
  readonly name: string;
  readonly group: FactorGroup;
  /** Unit direction on the sphere. */
  readonly dir: readonly [number, number, number];
  /** Where the surface sits along that direction. */
  readonly radius: number;
  /** Inner and outer edge of the band — the honest extent of the claim. */
  readonly inner: number;
  readonly outer: number;
  /** 0-1, drives opacity. A factor nobody asked about is nearly invisible. */
  readonly confidence: number;
  readonly volatility: Volatility;
  readonly weight: number;
  readonly stale: boolean;
}

export interface GenomeShape {
  readonly vertices: readonly ShapeVertex[];
  /** Mean radius — overall position, not a grade. */
  readonly meanRadius: number;
  /** How far from a sphere. High means a distinctive, lopsided configuration. */
  readonly asymmetry: number;
  /** Share of the surface that is guesswork. */
  readonly unknownShare: number;
  /** A short fingerprint of the configuration, stable across runs. */
  readonly signature: string;
  readonly readingNote: string;
}

/** Neutral shell. Scores push out from here or pull in toward the core. */
export const BASE_RADIUS = 1;

/**
 * Twenty-one evenly spaced directions by the Fibonacci lattice.
 *
 * Even spacing matters: cluster the axes and neighbouring factors visually
 * reinforce each other, which invents a pattern the data does not contain.
 */
export function factorDirections(n = FACTOR_COUNT): readonly (readonly [number, number, number])[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    out.push([round4(Math.cos(theta) * r), round4(y), round4(Math.sin(theta) * r)]);
  }
  return out;
}

export function genomeShape(readings: readonly FactorReading[]): GenomeShape {
  const states = factorStates(readings);
  const dirs = factorDirections(states.length);

  const vertices: ShapeVertex[] = states.map((st, i) => {
    // Score moves the surface; weight decides how far it is allowed to move,
    // so a heavily-weighted factor deforms the solid more than a light one.
    const radius = BASE_RADIUS + (st.score / 2) * 0.6 * (0.5 + st.weight / 2);
    return {
      factorId: st.factorId,
      name: st.factor.name,
      group: st.factor.group,
      dir: dirs[i],
      radius: round3(radius),
      inner: round3(radius - st.band),
      outer: round3(radius + st.band),
      confidence: st.confidence,
      volatility: st.factor.volatility,
      weight: st.weight,
      stale: st.stale,
    };
  });

  const radii = vertices.map((v) => v.radius);
  const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
  const variance = radii.reduce((a, r) => a + (r - mean) ** 2, 0) / radii.length;
  const unknown =
    vertices.filter((v) => v.confidence < 0.3).length / vertices.length;

  return {
    vertices,
    meanRadius: round3(mean),
    asymmetry: round3(Math.sqrt(variance)),
    unknownShare: round3(unknown),
    signature: signature(vertices),
    readingNote:
      'Radius is the score, band thickness is volatility and measurement uncertainty together, opacity is confidence. A thin crisp spike is a well-evidenced stable strength. A thick faint region is something nobody has asked about, or something that changes faster than the plan does — and the two look different on purpose.',
  };
}

/**
 * A short fingerprint of the configuration.
 *
 * Deterministic, so the same answers always give the same string, and
 * sensitive enough that two people with genuinely different configurations do
 * not collide. It identifies a shape; it does not identify a person, and it
 * carries nothing that could.
 */
function signature(vertices: readonly ShapeVertex[]): string {
  let h = 2166136261;
  for (const v of vertices) {
    const q = Math.round(v.radius * 20) + Math.round(v.confidence * 4) * 97;
    h ^= q;
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
}

// ─── Interview order ─────────────────────────────────────────────────────────

export interface NextQuestion {
  readonly factorId: string;
  readonly name: string;
  readonly question: string;
  readonly why: string;
  readonly volatility: Volatility;
  /** Weight × how unknown it is — what asking this is worth. */
  readonly value: number;
}

/**
 * What to ask next, ordered by what the answer is worth.
 *
 * Weight times ignorance. A heavily-weighted factor nobody has asked about
 * outranks a light one, and a factor already well established drops out even
 * if it is important — its answer is already in hand.
 *
 * Stale readings re-enter the queue, which is why volatility is tracked: an
 * episodic factor answered eight months ago is worth re-asking ahead of a
 * stable one answered three years ago.
 */
export function interviewOrder(
  readings: readonly FactorReading[] = [],
  limit = FACTOR_COUNT
): readonly NextQuestion[] {
  const states = factorStates(readings);
  return states
    .map((st) => {
      const ignorance = st.stale ? 1 : 1 - st.confidence;
      return {
        factorId: st.factorId,
        name: st.factor.name,
        question: st.factor.question,
        why: st.factor.questionNote,
        volatility: st.factor.volatility,
        value: round3(st.weight * ignorance),
      };
    })
    .filter((q) => q.value > 0.01)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
