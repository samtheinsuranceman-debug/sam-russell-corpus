/**
 * The language layer — matching how a person actually processes information.
 *
 * ## What this is, stated honestly up front
 *
 * This implements representational-system matching from NLP: detecting whether someone
 * reaches for visual, auditory, kinesthetic or digital language, and answering them in
 * the same channel.
 *
 * The honest caveat, which belongs in the code rather than buried in a footnote: the
 * strong form of this hypothesis — that people have a fixed dominant sensory channel and
 * that matching it measurably improves persuasion — has been tested repeatedly since the
 * 1980s and has largely failed to replicate. Treating it as a validated psychological
 * mechanism would be overclaiming.
 *
 * What survives, and what this engine is actually built on, is much simpler and is well
 * supported: PEOPLE FIND IT EASIER TO FOLLOW EXPLANATIONS CAST IN THE VOCABULARY THEY
 * THEMSELVES USED. If a client says "I can't see how this works," answering with "here
 * is what it looks like" lands better than "here is how it feels" — not because of
 * neurology, but because you are reusing their own frame instead of making them
 * translate yours.
 *
 * So this is a writing-style engine with a detector on the front, and it is documented as
 * one. It makes explanations easier to follow. It is not a persuasion weapon and the
 * confidence it reports is deliberately conservative.
 *
 * ## Why detection needs a floor
 *
 * Three sensory words in a paragraph is not a signal, it is noise. `detectModality()`
 * requires a minimum number of predicates AND a clear margin over the runner-up before it
 * will name a preference. Below either threshold it returns 'unknown' and the caller
 * writes in plain language, which is the correct default anyway.
 */

export type Modality = 'visual' | 'auditory' | 'kinesthetic' | 'digital' | 'unknown';

/**
 * Predicate vocabularies.
 *
 * 'digital' is the auditory-digital channel — abstract, procedural, logic-flavoured
 * language. It matters here more than the others, because it is how most attorneys,
 * engineers and analytically-minded clients actually talk, and it is the one a
 * sensory-predicate model usually misses entirely.
 */
export const PREDICATES: Record<Exclude<Modality, 'unknown'>, readonly string[]> = {
  visual: [
    'see', 'look', 'view', 'appear', 'show', 'picture', 'clear', 'focus', 'perspective',
    'bright', 'dim', 'vivid', 'imagine', 'envision', 'illustrate', 'observe', 'reveal',
    'outlook', 'horizon', 'glance', 'watch', 'colour', 'color', 'shine', 'reflect',
    'visualise', 'visualize', 'foresee', 'hazy', 'murky', 'transparent', 'snapshot',
  ],
  auditory: [
    'hear', 'listen', 'sound', 'tell', 'say', 'talk', 'discuss', 'ring', 'tone', 'loud',
    'quiet', 'resonate', 'echo', 'harmony', 'tune', 'voice', 'articulate', 'mention',
    'announce', 'call', 'noise', 'rhythm', 'amplify', 'silence', 'deaf', 'audible',
    'click', 'buzz', 'whisper', 'shout',
  ],
  kinesthetic: [
    'feel', 'touch', 'grasp', 'handle', 'solid', 'concrete', 'pressure', 'weight',
    'heavy', 'smooth', 'rough', 'grip', 'hold', 'push', 'pull', 'warm', 'cold', 'firm',
    'comfortable', 'tense', 'relax', 'hurt', 'stress', 'burden', 'lift', 'carry',
    'shaky', 'stuck', 'momentum', 'traction', 'balance',
  ],
  digital: [
    'think', 'know', 'understand', 'consider', 'process', 'decide', 'analyse', 'analyze',
    'logic', 'reason', 'sense', 'learn', 'compute', 'determine', 'evaluate', 'criteria',
    'structure', 'system', 'method', 'framework', 'parameter', 'quantify', 'assess',
    'conclude', 'infer', 'rational', 'data', 'metric', 'model', 'calculate',
  ],
};

export interface ModalityReading {
  readonly primary: Modality;
  readonly secondary: Modality;
  /** 0-1. Deliberately conservative; see the header. */
  readonly confidence: number;
  readonly counts: Readonly<Record<Exclude<Modality, 'unknown'>, number>>;
  readonly totalPredicates: number;
  readonly matched: readonly string[];
  readonly plain: string;
}

/** Below this many predicates, any apparent preference is noise. */
export const MIN_PREDICATES = 6;
/** The leader must exceed the runner-up by this share of total hits. */
export const MIN_MARGIN = 0.15;

export function detectModality(text: string): ModalityReading {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const counts = { visual: 0, auditory: 0, kinesthetic: 0, digital: 0 };
  const matched: string[] = [];

  for (const w of words) {
    for (const key of Object.keys(PREDICATES) as (keyof typeof counts)[]) {
      // Stem-tolerant: "seeing" and "sees" both count for "see".
      if (PREDICATES[key].some((p) => w === p || w === p + 's' || w === p + 'ing' || w === p + 'ed')) {
        counts[key] += 1;
        matched.push(w);
        break;
      }
    }
  }

  const total = counts.visual + counts.auditory + counts.kinesthetic + counts.digital;
  const ranked = (Object.entries(counts) as [Exclude<Modality, 'unknown'>, number][])
    .sort((a, b) => b[1] - a[1]);

  if (total < MIN_PREDICATES) {
    return {
      primary: 'unknown', secondary: 'unknown', confidence: 0, counts, totalPredicates: total,
      matched,
      plain:
        `Only ${total} sensory predicates in this sample; ${MIN_PREDICATES} are needed before a ` +
        'preference means anything. Write in plain language, which is the right default regardless.',
    };
  }

  const margin = (ranked[0][1] - ranked[1][1]) / total;
  if (margin < MIN_MARGIN) {
    return {
      primary: 'unknown', secondary: ranked[0][0], confidence: Number(margin.toFixed(3)),
      counts, totalPredicates: total, matched,
      plain:
        `No clear leader — ${ranked[0][0]} and ${ranked[1][0]} are within ` +
        `${(margin * 100).toFixed(0)} points. This person mixes channels, so match the ` +
        'sentence rather than the person.',
    };
  }

  // Confidence is capped well below 1 on purpose. This is a style signal, not a diagnosis.
  const confidence = Math.min(0.75, margin * 2 + Math.min(0.25, total / 80));

  return {
    primary: ranked[0][0],
    secondary: ranked[1][0],
    confidence: Number(confidence.toFixed(3)),
    counts,
    totalPredicates: total,
    matched,
    plain:
      `Leans ${ranked[0][0]} (${ranked[0][1]} of ${total} predicates), then ${ranked[1][0]}. ` +
      `Confidence ${(confidence * 100).toFixed(0)}% — enough to pick vocabulary, not enough to ` +
      'build a strategy on.',
  };
}

/** Phrase banks for casting the same idea in each channel. */
export const FRAMES: Record<Exclude<Modality, 'unknown'>, {
  readonly opener: readonly string[];
  readonly clarify: readonly string[];
  readonly confirm: readonly string[];
}> = {
  visual: {
    opener: ['Here is what this looks like', 'Picture the position this way', 'Let me show you the shape of it'],
    clarify: ['Look at where the lines cross', 'See how the two paths separate', 'Watch what happens at that point'],
    confirm: ['Does that look right to you?', 'Is the picture clear?', 'Can you see how that lands?'],
  },
  auditory: {
    opener: ['Here is how this sounds', 'Let me talk you through it', 'The short version goes like this'],
    clarify: ['Listen to what the numbers are telling you', 'That is the point where the story changes', 'Say it back and see if it holds'],
    confirm: ['Does that sound right?', 'How does that land when you hear it?', 'Are we in tune on that?'],
  },
  kinesthetic: {
    opener: ['Here is where this sits', 'Let me put something solid in your hands', 'Get a feel for the weight of this'],
    clarify: ['That is where the pressure builds', 'You can feel the trade-off in that number', 'This is the part that carries the load'],
    confirm: ['Does that feel solid?', 'Comfortable with where that sits?', 'Does that hold up for you?'],
  },
  digital: {
    opener: ['Here is the structure', 'The decision reduces to one threshold', 'Consider the mechanism directly'],
    clarify: ['The criterion is precisely this', 'The logic runs as follows', 'That figure determines the outcome'],
    confirm: ['Does that follow?', 'Is the reasoning sound to you?', 'Any step you want examined?'],
  },
};

export type Technique = 'future-pace' | 'reframe' | 'pace-and-lead' | 'chunk-down' | 'chunk-up';

export interface TechniqueApplication {
  readonly technique: Technique;
  readonly output: string;
  readonly whatItDoes: string;
  /** True where the technique is being used to clarify rather than to push. */
  readonly informative: boolean;
}

/**
 * Apply a communication technique to a message.
 *
 * Each of these is a legitimate explanatory device when used to help someone understand
 * a position, and manipulative when used to manufacture agreement with a position they
 * would otherwise reject. `informative` records which side of that line the call is on,
 * and `NLP_RULES` below states the line explicitly.
 *
 * The distinction is not decorative. Future-pacing a client through a decision they have
 * already made is service. Future-pacing them into one they have not is pressure, and on
 * a regulated financial product it is a suitability problem before it is an ethical one.
 */
export function applyTechnique(
  technique: Technique,
  content: string,
  ctx: { readonly horizonYears?: number; readonly objection?: string; readonly modality?: Modality } = {},
): TechniqueApplication {
  const m = (ctx.modality && ctx.modality !== 'unknown') ? ctx.modality : 'digital';

  switch (technique) {
    case 'future-pace':
      return {
        technique,
        informative: true,
        whatItDoes:
          'Walks the person forward to the point where the decision has already played out, so ' +
          'they evaluate the outcome rather than the sales moment.',
        output:
          `${ctx.horizonYears ?? 20} years from now, ${FRAMES[m].opener[0].toLowerCase()}: ${content} ` +
          `The question worth answering today is whether that is the position you want to be ` +
          `standing in then — not whether this sounds good now.`,
      };

    case 'reframe':
      return {
        technique,
        informative: true,
        whatItDoes:
          'Holds the facts constant and changes the frame they sit in, so a different feature ' +
          'of the same situation becomes visible.',
        output: ctx.objection
          ? `You said: "${ctx.objection}". That is true, and it is worth holding next to this — ` +
            `${content} Same facts, different angle. Both are real; the question is which one ` +
            `governs your decision.`
          : `${content} Worth noting the same facts support a second reading, which is worth ` +
            `seeing before you settle on the first.`,
      };

    case 'pace-and-lead':
      return {
        technique,
        informative: true,
        whatItDoes:
          'States the person’s current position accurately before offering a next step, so they ' +
          'are not asked to abandon their own reasoning to hear yours.',
        output:
          `Where you are right now: ${ctx.objection ?? 'weighing whether this is worth the cost'}. ` +
          `That is a reasonable place to be. ${content}`,
      };

    case 'chunk-down':
      return {
        technique,
        informative: true,
        whatItDoes: 'Breaks an abstraction into the specific, checkable pieces underneath it.',
        output: `${content} Concretely, that means: the exact figure, the exact year, and the exact condition under which it changes.`,
      };

    case 'chunk-up':
      return {
        technique,
        informative: true,
        whatItDoes: 'Lifts a detail to the level where its purpose is visible.',
        output: `${content} Stepping back: this matters because of what it does to the whole position, not on its own.`,
      };
  }
}

export interface StyledMessage {
  readonly text: string;
  readonly modality: Modality;
  readonly confidence: number;
  readonly techniquesApplied: readonly Technique[];
  readonly note: string;
}

/**
 * Cast a message in the reader's channel.
 *
 * When the reading is 'unknown' this returns the message unchanged, which is correct
 * rather than a fallback: plain language is the right default and dressing a message in
 * a guessed channel is worse than not dressing it at all.
 */
export function styleMessage(
  content: string,
  reading: ModalityReading,
  opts: { readonly techniques?: readonly Technique[]; readonly horizonYears?: number; readonly objection?: string } = {},
): StyledMessage {
  const applied: Technique[] = [];
  let text = content;

  for (const t of opts.techniques ?? []) {
    const r = applyTechnique(t, text, {
      horizonYears: opts.horizonYears,
      objection: opts.objection,
      modality: reading.primary,
    });
    text = r.output;
    applied.push(t);
  }

  if (reading.primary === 'unknown') {
    return {
      text,
      modality: 'unknown',
      confidence: 0,
      techniquesApplied: applied,
      note: 'No reliable channel reading, so no styling applied. Plain language is the default.',
    };
  }

  const frame = FRAMES[reading.primary];
  return {
    text: `${frame.opener[0]}. ${text} ${frame.confirm[0]}`,
    modality: reading.primary,
    confidence: reading.confidence,
    techniquesApplied: applied,
    note: `Cast in ${reading.primary} vocabulary at ${(reading.confidence * 100).toFixed(0)}% confidence.`,
  };
}

export const NLP_RULES = {
  neverDone: [
    'Presenting representational-system matching as validated science. The strong form of the hypothesis has repeatedly failed replication; this is a style tool.',
    'Reporting a modality preference from fewer than six predicates, or from a margin inside the noise.',
    'Using future-pacing, reframing or pacing-and-leading to manufacture agreement with a recommendation the client has not accepted on its merits.',
    'Styling a message when the channel reading is unknown. Plain language beats a guessed channel.',
    'Any technique applied to obscure a cost, a charge, a risk, or a figure the client is entitled to see plainly.',
  ],
} as const;
