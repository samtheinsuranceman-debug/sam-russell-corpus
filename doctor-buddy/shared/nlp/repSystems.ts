/**
 * Representational systems — how a person codes experience, read from the
 * sensory predicates they use, and how to speak back in the same system.
 *
 * Source: Bandler & Grinder, The Structure of Magic I–II (the 4-tuple and
 * representational systems), and Hall, The Spirit of NLP / The Sourcebook of
 * Magic (predicate matching, "languaging" in the listener's system).
 *
 * People are not "visual people". They use a lead system, a primary system
 * for a given context, and their predicates drift with state, so this module
 * reads a text, a turn, or a window of turns and reports proportions with a
 * confidence, never a label stamped on a person. The output is used to phrase
 * the companion's questions in the words the person is already using: a
 * question in the listener's own system is heard; one in a foreign system is
 * translated first, and translation costs rapport.
 *
 * Pure functions, no I/O. Runs in the browser and on the server.
 */

export type RepSystem = "visual" | "auditory" | "kinesthetic" | "auditoryDigital" | "olfactoryGustatory";

export const REP_SYSTEMS: readonly RepSystem[] = ["visual", "auditory", "kinesthetic", "auditoryDigital", "olfactoryGustatory"];

export const REP_SYSTEM_LABEL: Record<RepSystem, string> = {
  visual: "Visual",
  auditory: "Auditory",
  kinesthetic: "Kinesthetic",
  auditoryDigital: "Auditory digital (words and logic)",
  olfactoryGustatory: "Smell and taste",
};

/**
 * Sensory predicates by system. Each entry is a stem matched at a word
 * boundary; a trailing `*` allows inflection (see/sees/seeing/seen…).
 * Words that belong to more than one system by ordinary usage are left out
 * rather than guessed.
 */
export const PREDICATES: Record<RepSystem, readonly string[]> = {
  visual: [
    "see*", "look*", "view*", "appear*", "show*", "picture*", "image*", "imagine*", "vision*", "visual*",
    "clear*", "clarity", "foggy", "fog", "hazy", "haze", "blur*", "bright*", "dim*", "dark*", "light*",
    "focus*", "perspective*", "outlook", "insight*", "illustrat*", "reveal*", "glimpse*", "glance*",
    "watch*", "observ*", "notice*", "envision*", "visualiz*", "horizon", "scene*", "colorful", "colourful",
    "vivid*", "sight*", "eye*", "spot*", "scan*", "survey*", "reflect*", "mirror*", "shine*", "sparkl*",
    "flash*", "big picture", "point of view", "in light of", "crystal clear", "tunnel vision", "shed light",
    "paint a picture", "looks like", "looks as if", "can't see", "cannot see", "out of sight", "short-sighted", "shortsighted",
    "overview", "frame*", "angle*", "pattern*", "dawn*", "glow*", "gleam*", "glare*", "cloud*", "screen*", "display*",
    "graphic*", "diagram*", "map out", "zoom*", "blind*", "invisible", "visible", "transparent", "opaque", "illuminat*",
  ],
  auditory: [
    "hear*", "listen*", "sound*", "tell*", "talk*", "say*", "said", "speak*", "spoke*", "voice*", "loud*", "quiet*",
    "silence", "silent", "noise*", "noisy", "ring*", "rang", "resonat*", "resonan*", "tone*", "tune*", "harmon*", "melod*",
    "rhythm*", "click*", "tick*", "buzz*", "hum*", "echo*", "shout*", "yell*", "scream*", "whisper*", "mutter*",
    "mumbl*", "chatter*", "discuss*", "mention*", "announc*", "pronounc*", "call*", "ask*", "remark*",
    "rumor*", "rumour*", "word for word", "loud and clear", "rings a bell", "sounds like", "sounds as if", "tongue-tied",
    "unheard", "all ears", "tune in", "tune out", "in tune", "out of tune", "music to my ears", "static", "deaf*",
    "amplif*", "volume", "pitch*", "accent*", "dialogue", "monologue", "conversation*", "audible", "inaudible", "outspoken",
    "articulat*", "vocal*", "sing*", "sang", "song*", "chime*", "rattle*", "bang*", "crash*", "hush*", "roar*", "growl*",
  ],
  kinesthetic: [
    "feel*", "felt", "touch*", "grasp*", "grip*", "hold*", "held", "handle*", "hard", "soft*", "rough*", "smooth*",
    "warm*", "cold*", "cool*", "hot", "heat*", "heavy", "heaviness", "light-hearted", "weight*", "pressure*", "press*",
    "tense*", "tension", "tight*", "loose*", "relax*", "calm*", "solid*", "firm*", "shak*", "shook", "tremble*",
    "numb*", "ache*", "hurt*", "pain*", "sting*", "sharp", "dull", "stuck", "stiff*", "flow*", "move*", "moving", "moved",
    "push*", "pull*", "drag*", "carry*", "carried", "lift*", "drop*", "fall*", "fell", "sink*", "sank", "float*", "drift*",
    "run*", "ran", "walk*", "step*", "climb*", "crawl*", "jump*", "throw*", "threw", "catch*", "caught", "hit*",
    "struck", "strike*", "slip*", "stumbl*", "shiver*", "sweat*", "breath*", "breathe*", "gut", "stomach", "chest",
    "heart", "shoulder*", "throat", "knot*", "butterflies", "get a handle", "get a grip", "hang in there", "hold on",
    "pull together", "pull it together", "come to grips", "feels like", "feels as if", "can't handle", "cannot handle",
    "get in touch", "lay it on", "sort of", "hands-on", "hands on", "boils down", "underneath", "foundation*", "ground*",
    "concrete", "comfort*", "uncomfortable", "at ease", "pressured", "overwhelm*", "exhaust*", "energy", "energi*",
    "drain*", "burn*", "crushed", "crush*", "broken", "break*", "shatter*", "cling*", "clutch*", "squeeze*", "wrestl*",
    "steady", "unsteady", "balance*", "off balance", "settle*", "unsettl*", "rush*", "sluggish", "restless", "tired",
  ],
  auditoryDigital: [
    "think*", "thought*", "know*", "knew", "understand*", "understood", "consider*", "decide*", "decision*", "logic*",
    "reason*", "rational*", "analy*", "process*", "sense", "makes sense", "make sense", "conceive*", "concept*", "learn*",
    "remember*", "recall*", "memor*", "compute*", "figure out", "figured out", "work out", "worked out", "plan*", "believe*",
    "belief*", "assume*", "assumption*", "evaluate*", "judg*", "criteria", "principle*", "theor*", "explain*", "describe*",
    "define*", "definition*", "meaning*", "mean*", "matter*", "fact*", "data", "information", "detail*", "specific*",
    "question*", "answer*", "structure*", "system*", "order*", "sequence*", "step by step", "in other words", "that is to say",
    "motivate*", "motivation*", "distinct*", "differen*", "compar*", "categor*", "classif*", "conclude*", "conclusion*",
    "hypothes*", "probab*", "possib*", "certain*", "uncertain*", "doubt*", "wonder*", "curious", "interest*", "aware*",
    "realiz*", "realis*", "recogni*", "identif*", "acknowledg*", "appreciat*", "comprehend*", "insightful",
  ],
  olfactoryGustatory: [
    "smell*", "scent*", "stink*", "stench", "fragran*", "aroma*", "odor*", "odour*", "whiff", "sniff*", "taste*", "tasty",
    "flavor*", "flavour*", "sweet*", "sour*", "bitter*", "salty", "spicy", "savor*", "savour*", "delicious", "bland",
    "rotten", "fresh", "stale", "fishy", "smells like", "tastes like", "leaves a bad taste", "sweet taste", "sour note",
    "chew on", "digest*", "swallow*", "bite*", "bit off", "nauseat*", "sick to my stomach", "appetite", "hungry", "hunger",
    "thirst*", "juicy", "mouth-watering", "mouthwatering",
  ],
};

/**
 * Predicate translation. When the companion must reflect a phrase back in a
 * different system, these are the swaps. Keyed by a canonical meaning, each
 * row gives one rendering per system (auditory digital gets the neutral,
 * non-sensory word). From Hall's translation exercise (Sourcebook, "Languaging"
 * chapter) with additions.
 */
export interface Translation {
  meaning: string;
  visual: string;
  auditory: string;
  kinesthetic: string;
  auditoryDigital: string;
}

export const TRANSLATIONS: readonly Translation[] = [
  { meaning: "understand", visual: "see what you mean", auditory: "hear what you're saying", kinesthetic: "grasp what you mean", auditoryDigital: "understand what you mean" },
  { meaning: "unclear", visual: "hazy", auditory: "muffled", kinesthetic: "unsettled", auditoryDigital: "unclear" },
  { meaning: "clear", visual: "clear as day", auditory: "loud and clear", kinesthetic: "solid", auditoryDigital: "well defined" },
  { meaning: "consider", visual: "look at it", auditory: "talk it over", kinesthetic: "walk through it", auditoryDigital: "think it through" },
  { meaning: "notice", visual: "see", auditory: "hear", kinesthetic: "feel", auditoryDigital: "notice" },
  { meaning: "imagine", visual: "picture", auditory: "tell yourself", kinesthetic: "get a feel for", auditoryDigital: "consider" },
  { meaning: "explain", visual: "show me", auditory: "tell me", kinesthetic: "walk me through", auditoryDigital: "explain" },
  { meaning: "remember", visual: "see it again", auditory: "hear it again", kinesthetic: "go back into it", auditoryDigital: "recall" },
  { meaning: "attend", visual: "focus on", auditory: "tune in to", kinesthetic: "get in touch with", auditoryDigital: "attend to" },
  { meaning: "recognize", visual: "spot", auditory: "rings a bell", kinesthetic: "gets a hold of you", auditoryDigital: "recognize" },
  { meaning: "confused", visual: "foggy", auditory: "static", kinesthetic: "stuck", auditoryDigital: "confused" },
  { meaning: "overwhelmed", visual: "can't see past it", auditory: "too much noise", kinesthetic: "crushed under it", auditoryDigital: "over capacity" },
  { meaning: "hopeful", visual: "a brighter picture", auditory: "sounds promising", kinesthetic: "a lighter load", auditoryDigital: "a reasonable expectation" },
  { meaning: "decide", visual: "see which way to go", auditory: "sounds right", kinesthetic: "feels right", auditoryDigital: "makes sense" },
  { meaning: "perspective", visual: "point of view", auditory: "how it sounds from here", kinesthetic: "where you stand", auditoryDigital: "frame" },
  { meaning: "agree", visual: "we see eye to eye", auditory: "we're in tune", kinesthetic: "we're on solid ground together", auditoryDigital: "we agree" },
];

// ─── Matching ────────────────────────────────────────────────────────────────

interface Compiled { system: RepSystem; stem: string; re: RegExp; weight: number }

function compile(stem: string, system: RepSystem): Compiled {
  const phrase = stem.includes(" ") || stem.includes("-");
  const body = stem.endsWith("*")
    ? `${escape(stem.slice(0, -1))}[a-z]*`
    : escape(stem);
  // Multi-word idioms weigh double: they are rarely accidental.
  return { system, stem, re: new RegExp(`\\b${body}\\b`, "g"), weight: phrase ? 2 : 1 };
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let COMPILED: Compiled[] | null = null;
function compiled(): Compiled[] {
  if (!COMPILED) {
    COMPILED = [];
    for (const system of REP_SYSTEMS) for (const stem of PREDICATES[system]) COMPILED.push(compile(stem, system));
    // Longest stems first so "sounds like" is claimed before "sound*".
    COMPILED.sort((a, b) => b.stem.length - a.stem.length);
  }
  return COMPILED;
}

export interface PredicateHit { word: string; system: RepSystem; index: number }

export interface RepReading {
  /** Weighted predicate counts per system. */
  counts: Record<RepSystem, number>;
  /** Share of all sensory predicates, 0–100, summing to 100 when any were found. */
  percent: Record<RepSystem, number>;
  /** The system with the largest share, or null when nothing sensory was said. */
  primary: RepSystem | null;
  secondary: RepSystem | null;
  /** 0–1: rises with the number of predicates and the margin between first and second. */
  confidence: number;
  /** Total sensory predicates found (unweighted). */
  total: number;
  /** Words found, in order, for display and for explaining the reading. */
  hits: PredicateHit[];
}

function emptyCounts(): Record<RepSystem, number> {
  return { visual: 0, auditory: 0, kinesthetic: 0, auditoryDigital: 0, olfactoryGustatory: 0 };
}

/** Normalize text for matching: lower case, straight quotes, single spaces. */
export function normalizeText(text: unknown): string {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Read one text. Each character is claimed by at most one predicate. */
export function readRepSystem(text: unknown): RepReading {
  const t = normalizeText(text);
  const counts = emptyCounts();
  const hits: PredicateHit[] = [];
  const claimed: boolean[] = new Array(t.length).fill(false);
  if (t.length > 0) {
    for (const c of compiled()) {
      c.re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = c.re.exec(t)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        if (end === start) { c.re.lastIndex++; continue; }
        let free = true;
        for (let i = start; i < end; i++) if (claimed[i]) { free = false; break; }
        if (!free) continue;
        for (let i = start; i < end; i++) claimed[i] = true;
        counts[c.system] += c.weight;
        hits.push({ word: m[0], system: c.system, index: start });
      }
    }
  }
  hits.sort((a, b) => a.index - b.index);
  return summarize(counts, hits);
}

function summarize(counts: Record<RepSystem, number>, hits: PredicateHit[]): RepReading {
  const weighted = REP_SYSTEMS.reduce((a, s) => a + counts[s], 0);
  const percent = emptyCounts();
  if (weighted > 0) for (const s of REP_SYSTEMS) percent[s] = Math.round((counts[s] / weighted) * 100);
  const ranked = [...REP_SYSTEMS].sort((a, b) => counts[b] - counts[a]);
  const primary = counts[ranked[0]] > 0 ? ranked[0] : null;
  const secondary = counts[ranked[1]] > 0 ? ranked[1] : null;
  const margin = weighted > 0 ? (counts[ranked[0]] - counts[ranked[1]]) / weighted : 0;
  const volume = Math.min(1, hits.length / 12);
  const confidence = primary ? Math.round(Math.min(1, 0.15 + 0.55 * volume + 0.3 * margin) * 100) / 100 : 0;
  return { counts, percent, primary, secondary, confidence, total: hits.length, hits };
}

/**
 * Read a window of turns, most recent weighted highest, so the companion
 * follows the person's current system rather than an average of the hour.
 * `halfLife` is in turns.
 */
export function readRepSystemOverTurns(texts: readonly unknown[], halfLife = 6): RepReading {
  const counts = emptyCounts();
  const hits: PredicateHit[] = [];
  const list = Array.isArray(texts) ? texts : [];
  const n = list.length;
  list.forEach((text, i) => {
    const r = readRepSystem(text);
    const age = n - 1 - i;
    const w = Math.pow(0.5, age / Math.max(1, halfLife));
    for (const s of REP_SYSTEMS) counts[s] += r.counts[s] * w;
    if (age === 0) hits.push(...r.hits);
  });
  for (const s of REP_SYSTEMS) counts[s] = Math.round(counts[s] * 100) / 100;
  const r = summarize(counts, hits);
  // Confidence over a window also rises with how many turns carried predicates.
  const carrying = list.filter(t => readRepSystem(t).total > 0).length;
  r.confidence = r.primary ? Math.round(Math.min(1, r.confidence + 0.05 * Math.min(carrying, 6)) * 100) / 100 : 0;
  return r;
}

// ─── Languaging ──────────────────────────────────────────────────────────────

export interface LanguagingGuide {
  system: RepSystem;
  /** Openers to reflect back with ("It sounds like…"). */
  openers: string[];
  /** Verbs for questions in this system. */
  questionVerbs: string[];
  /** A short line for a server-owned prompt. */
  promptLine: string;
  /** One example question phrased in this system. */
  exampleQuestion: string;
}

const GUIDES: Record<RepSystem, Omit<LanguagingGuide, "system">> = {
  visual: {
    openers: ["It looks like", "From where you're standing, it seems", "The picture you're painting is", "I can see that"],
    questionVerbs: ["see", "picture", "look at", "imagine", "focus on", "show me"],
    promptLine: "Speak in visual language: see, picture, look, clear, focus, perspective, bright, show. Offer images and views, and ask what they see.",
    exampleQuestion: "When you picture this a month from now, what do you see that looks different?",
  },
  auditory: {
    openers: ["It sounds like", "What I'm hearing is", "The way you tell it,", "That rings true:"],
    questionVerbs: ["hear", "sounds", "tell me", "say", "listen to", "tune in to"],
    promptLine: "Speak in auditory language: hear, sound, tell, say, listen, tone, quiet, rings true. Reflect their words and ask how things sound to them.",
    exampleQuestion: "When you tell yourself that, what tone does the voice have, and whose is it?",
  },
  kinesthetic: {
    openers: ["It feels like", "What's coming through is", "You're carrying", "I can feel that"],
    questionVerbs: ["feel", "sense", "hold", "get a grip on", "walk through", "get in touch with"],
    promptLine: "Speak in kinesthetic language: feel, sense, touch, hold, solid, heavy, light, warm, grounded, move. Ask where in the body it sits and what would feel steadier.",
    exampleQuestion: "Where do you feel that most right now, and what would it take to set it down for a moment?",
  },
  auditoryDigital: {
    openers: ["What I understand is", "It makes sense that", "The way you've laid it out,", "Considering everything,"],
    questionVerbs: ["think", "understand", "consider", "figure out", "make sense of", "decide"],
    promptLine: "Speak in plain, logical language: think, understand, consider, know, makes sense, reason, step by step. Be precise; give structure and one clear next question.",
    exampleQuestion: "If you break this into its parts, which part matters most, and what do you know for certain about it?",
  },
  olfactoryGustatory: {
    openers: ["There's something about this that", "You can almost taste", "It has the flavor of", "Something in this"],
    questionVerbs: ["taste", "savor", "chew on", "digest", "sense"],
    promptLine: "Use taste and smell language where natural: fresh, stale, sweet, bitter, chew on, digest. Otherwise fall back to kinesthetic language.",
    exampleQuestion: "What would make this easier to digest, one bite at a time?",
  },
};

export function languagingGuide(system: RepSystem): LanguagingGuide {
  return { system, ...GUIDES[system] };
}

/** The guide for a reading, defaulting to plain language when nothing sensory was said. */
export function guideFor(reading: RepReading): LanguagingGuide {
  return languagingGuide(reading.primary ?? "auditoryDigital");
}

/** Render a meaning in a system: translate("understand", "kinesthetic") → "grasp what you mean". */
export function translate(meaning: string, to: RepSystem): string | null {
  const row = TRANSLATIONS.find(t => t.meaning === meaning);
  if (!row) return null;
  if (to === "olfactoryGustatory") return row.kinesthetic;
  return row[to];
}

/**
 * Re-render a phrase in another system by swapping known idioms. Only
 * whole-idiom swaps are made, so the sentence stays grammatical; words the
 * table does not know are left alone.
 */
export function restate(text: unknown, to: RepSystem): string {
  let out = String(text ?? "");
  const target = to === "olfactoryGustatory" ? "kinesthetic" : to;
  for (const row of TRANSLATIONS) {
    for (const from of ["visual", "auditory", "kinesthetic", "auditoryDigital"] as const) {
      if (from === target) continue;
      const phrase = row[from];
      if (!phrase.includes(" ")) continue; // single words are too ambiguous to swap blindly
      const re = new RegExp(`\\b${escape(phrase)}\\b`, "gi");
      out = out.replace(re, row[target]);
    }
  }
  return out;
}

/**
 * A reflection opener in the person's system: mirror(reading) → "It sounds like".
 * Cycles through the openers so the companion does not repeat itself.
 */
export function mirrorOpener(reading: RepReading, turnIndex = 0): string {
  const g = guideFor(reading);
  const i = Math.abs(Math.floor(Number(turnIndex) || 0)) % g.openers.length;
  return g.openers[i];
}

/** A compact prompt block a server-owned system prompt can include verbatim. */
export function repSystemPromptBlock(reading: RepReading): string {
  if (!reading.primary) {
    return "REPRESENTATIONAL SYSTEM: not enough sensory language yet. Use plain, concrete words and notice which of see / hear / feel the person reaches for.";
  }
  const g = guideFor(reading);
  const mix = REP_SYSTEMS.filter(s => reading.percent[s] > 0).map(s => `${REP_SYSTEM_LABEL[s]} ${reading.percent[s]}%`).join(", ");
  const sample = reading.hits.slice(-6).map(h => `"${h.word}"`).join(", ");
  return [
    `REPRESENTATIONAL SYSTEM (confidence ${reading.confidence}): ${mix}.`,
    `Their recent predicates: ${sample || "none"}.`,
    `${g.promptLine}`,
    `Open reflections with phrases like "${g.openers[0]}…" and ask questions with verbs like ${g.questionVerbs.slice(0, 3).join(", ")}. Example: "${g.exampleQuestion}"`,
  ].join("\n");
}
