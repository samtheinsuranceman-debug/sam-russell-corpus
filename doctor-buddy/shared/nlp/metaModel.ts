/**
 * The Meta-Model of language — Bandler & Grinder, The Structure of Magic I
 * (1975), with the extensions Hall added in The Sourcebook of Magic and
 * Communication Magic (identification, either/or, pseudo-words).
 *
 * A person's sentences are a map of their experience. The map is produced by
 * three processes — deletion, generalization and distortion — and each leaves
 * a linguistic fingerprint. The Meta-Model names those fingerprints and pairs
 * each one with a question that recovers the deleted, generalized or
 * distorted material ("Better than what?", "What stops you?", "How do you
 * know?"). The question is the intervention: a well-formed question reconnects
 * the map to the experience it came from, and the person's own answer does
 * the work.
 *
 * This module detects the fingerprints in plain text and generates the
 * recovery questions. It is a language tool, not a diagnostic instrument; it
 * has no opinion about the person, only about the sentence. The companion
 * decides whether and when to ask (see companion.ts). Pure, no I/O.
 */

export type MetaModelCategory = "deletion" | "generalization" | "distortion";

export type MetaModelPattern =
  | "simpleDeletion"
  | "comparativeDeletion"
  | "lackOfReferentialIndex"
  | "unspecifiedVerb"
  | "universalQuantifier"
  | "modalOperatorNecessity"
  | "modalOperatorImpossibility"
  | "lostPerformative"
  | "nominalization"
  | "mindReading"
  | "causeEffect"
  | "complexEquivalence"
  | "presupposition"
  | "eitherOr"
  | "identification"
  | "pseudoWord";

export interface MetaModelDistinction {
  pattern: MetaModelPattern;
  category: MetaModelCategory;
  name: string;
  /** What the sentence has done to the experience. */
  description: string;
  example: string;
  /** Recovery questions; `{x}` is the matched phrase, `{noun}` a denominalized form when known. */
  challenges: readonly string[];
  /** 1 (worth noticing) – 3 (usually the load-bearing distortion). */
  severity: 1 | 2 | 3;
  source: string;
}

export const META_MODEL_CATALOG: readonly MetaModelDistinction[] = [
  {
    pattern: "simpleDeletion", category: "deletion", name: "Simple deletion", severity: 1,
    description: "A feeling or state is named without its object; the sentence has left out what it is about.",
    example: "I'm afraid. / I'm upset.",
    challenges: ["{x} — about what, specifically?", "{x} of what, or of whom?", "What is it that you're {x}?"],
    source: "Structure of Magic I, ch. 3–4",
  },
  {
    pattern: "comparativeDeletion", category: "deletion", name: "Comparative deletion", severity: 1,
    description: "A comparison with the other half missing: better, worse, more, less, easier, too much — than what?",
    example: "Everyone else handles it better.",
    challenges: ["{x} compared with what, or with whom?", "{x} than when?", "By what measure is it {x}?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "lackOfReferentialIndex", category: "deletion", name: "Lack of referential index", severity: 1,
    description: "The actor is a crowd or a fog: they, people, everyone, it, things. Nobody in particular is doing anything in particular.",
    example: "They say I'm overreacting. / People don't understand.",
    challenges: ["Who, specifically?", "Which people, exactly?", "When you say '{x}', who do you have in mind?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "unspecifiedVerb", category: "deletion", name: "Unspecified verb", severity: 1,
    description: "Something was done to the person, but how is left out: hurt, rejected, ignored, let down.",
    example: "She hurt me.",
    challenges: ["How, specifically, did that happen?", "What did they do, exactly, that you're calling '{x}'?", "What happened, moment by moment?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "universalQuantifier", category: "generalization", name: "Universal quantifier", severity: 2,
    description: "One or several experiences have become all of them: always, never, everyone, nothing, every time.",
    example: "Nothing I do ever works.",
    challenges: ["{x}? Has there been even one time it went differently?", "{x} — every single time, without exception?", "What would be the one exception, if there were one?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "modalOperatorNecessity", category: "generalization", name: "Modal operator of necessity", severity: 2,
    description: "A rule stated as a law of nature: must, should, have to, need to, supposed to.",
    example: "I have to keep everyone happy.",
    challenges: ["What would happen if you didn't?", "What happens if you do, and what happens if you don't?", "Who says you {x}?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "modalOperatorImpossibility", category: "generalization", name: "Modal operator of impossibility", severity: 2,
    description: "A limit stated as a fact: can't, impossible, no way, unable.",
    example: "I can't say no to him.",
    challenges: ["What stops you?", "What would happen if you did?", "'{x}' — is that can't, or won't, or haven't yet?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "lostPerformative", category: "generalization", name: "Lost performative", severity: 1,
    description: "A judgment with the judge deleted: it's wrong, it's selfish, good mothers don't. Whose standard?",
    example: "It's selfish to take time for myself.",
    challenges: ["{x} — according to whom?", "By whose standard?", "Who taught you that {x}?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "nominalization", category: "distortion", name: "Nominalization", severity: 2,
    description: "A process frozen into a thing: depression, my relationship, the decision, communication. Things are stuck; processes can move.",
    example: "My depression won't lift.",
    challenges: ["How, specifically, are you {noun} right now?", "What is happening, in verbs, when you say '{x}'?", "Who is {noun} whom, and how?"],
    source: "Structure of Magic I, ch. 4; Korzybski on static words",
  },
  {
    pattern: "mindReading", category: "distortion", name: "Mind reading", severity: 2,
    description: "Claiming to know another person's inner state without saying how: he thinks I'm weak, they don't care.",
    example: "My boss thinks I'm useless.",
    challenges: ["How do you know that?", "What did you see or hear that told you '{x}'?", "If you asked them directly, what might they actually say?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "causeEffect", category: "distortion", name: "Cause–effect", severity: 2,
    description: "Someone or something outside is given the controls of the person's feelings: makes me, forces me, because of them.",
    example: "He makes me so angry.",
    challenges: ["How, specifically, does that cause you to feel this way?", "What would have to be true for it not to have that effect?", "Between what they do and what you feel, what happens in you?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "complexEquivalence", category: "distortion", name: "Complex equivalence", severity: 2,
    description: "Two different things welded together: X means Y. She didn't call, which means she doesn't care.",
    example: "He was late, which means I don't matter to him.",
    challenges: ["How does that mean this?", "Has there ever been a time when that happened and it didn't mean this?", "What else could '{x}' mean?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "presupposition", category: "distortion", name: "Presupposition", severity: 2,
    description: "Something assumed in the grammar itself: 'still', 'again', 'why am I so…' assume the thing is true before the sentence starts.",
    example: "Why am I always the one who ruins things?",
    challenges: ["What are you assuming for that question to make sense?", "'{x}' assumes it's already settled. What if it isn't?", "What leads you to believe that?"],
    source: "Structure of Magic I, ch. 4",
  },
  {
    pattern: "eitherOr", category: "distortion", name: "Either/or (two-valued)", severity: 2,
    description: "Only two positions exist and everything in between has vanished: all or nothing, if not perfect then pointless.",
    example: "If I can't do it perfectly there's no point.",
    challenges: ["What lies between those two?", "Is it really only those two, or could there be a third?", "On a scale between them, where are you today?"],
    source: "Hall, Communication Magic; Korzybski, Science and Sanity",
  },
  {
    pattern: "identification", category: "distortion", name: "Identification", severity: 3,
    description: "A whole person equated with one behaviour or one moment: I am a failure. Behaviour can change; an identity has nowhere to go.",
    example: "I'm just a burden.",
    challenges: ["That's a label for a whole person. What did you do, or what happened, that you're summing up that way?", "Is that who you are, or something you did, or something you feel right now?", "Who would you be if that label came off for a day?"],
    source: "Hall, Communication Magic; Korzybski on identification",
  },
  {
    pattern: "pseudoWord", category: "generalization", name: "Absolute adverb", severity: 1,
    description: "Words that inflate an experience past what happened: totally, completely, absolutely, literally.",
    example: "I completely fell apart.",
    challenges: ["{x}? Or mostly?", "If it were 90% rather than {x}, what would the other 10% be?"],
    source: "Hall, Communication Magic",
  },
];

export const META_MODEL_BY_PATTERN: Record<MetaModelPattern, MetaModelDistinction> =
  Object.fromEntries(META_MODEL_CATALOG.map(d => [d.pattern, d])) as Record<MetaModelPattern, MetaModelDistinction>;

// ─── Detection ───────────────────────────────────────────────────────────────

export interface MetaModelFinding {
  pattern: MetaModelPattern;
  category: MetaModelCategory;
  name: string;
  /** The words that triggered it, as they appeared. */
  match: string;
  index: number;
  severity: 1 | 2 | 3;
  /** The recovery question, filled in. */
  challenge: string;
  why: string;
}

/**
 * Nominalizations we can turn back into verbs. Detected only when preceded
 * by a possessive, article or "of", which is how a frozen process shows up
 * ("my depression", "the decision", "lack of communication").
 */
export const DENOMINALIZE: Record<string, string> = {
  depression: "depressing yourself", anxiety: "making yourself anxious", stress: "stressing", pressure: "pressuring",
  relationship: "relating", communication: "communicating", decision: "deciding", failure: "failing", rejection: "rejecting",
  confusion: "confusing yourself", frustration: "frustrating yourself", expectation: "expecting", respect: "respecting",
  love: "loving", trust: "trusting", fear: "fearing", guilt: "blaming yourself", shame: "shaming yourself", success: "succeeding",
  freedom: "freeing yourself", control: "controlling", commitment: "committing", motivation: "motivating yourself",
  connection: "connecting", recovery: "recovering", healing: "healing", understanding: "understanding", acceptance: "accepting",
  closure: "closing", balance: "balancing", boundaries: "setting limits", "self-esteem": "esteeming yourself",
  confidence: "trusting yourself", happiness: "being happy", peace: "being at peace", anger: "angering yourself",
  loneliness: "being alone", grief: "grieving", exhaustion: "exhausting yourself", burnout: "burning out",
  procrastination: "putting things off", perfectionism: "demanding perfection", avoidance: "avoiding",
  isolation: "isolating yourself", disappointment: "disappointing", resentment: "resenting", worry: "worrying",
  panic: "panicking", obsession: "obsessing", addiction: "using", denial: "denying", judgment: "judging",
  criticism: "criticizing", support: "supporting", attention: "attending", memory: "remembering", knowledge: "knowing",
  hope: "hoping", despair: "despairing", trauma: "being hurt", insecurity: "doubting yourself", intimacy: "being close",
};

interface Detector {
  pattern: MetaModelPattern;
  re: RegExp;
  /** Which capture group is `{x}`; default whole match. */
  group?: number;
  why: string;
}

const W = "\\b";
const DETECTORS: readonly Detector[] = [
  { pattern: "identification", why: "a whole self equated with a label",
    re: /\b(?:i am|i'm|im)\s+(?:(?:a|an|such a|just a|nothing but a|a total|a complete)\s+)?(failure|loser|mess|burden|disappointment|fraud|idiot|nobody|nothing|screw-?up|waste of space|bad (?:person|mother|father|mom|dad|wife|husband|friend|parent)|worthless|useless|broken|hopeless|pathetic|weak|stupid|unlovable|toxic|damaged|defective|a lost cause|beyond help|the problem)\b/g, group: 1 },
  { pattern: "presupposition", why: "the grammar assumes what has not been examined",
    re: /\b(why (?:am i|do i|can't i|is it that i|does this)\s+(?:always|so|such|never|still|ever|keep)\b|when will i (?:ever|finally)|(?:as usual|like always|like every time|yet again|once again)|still (?:can't|haven't|don't|not|stuck|failing|struggling|the same)|another (?:failure|mistake|disaster|wasted|bad)|even (?:he|she|they|my \w+) (?:gave up|can't|couldn't|won't|doesn't))/g },
  { pattern: "universalQuantifier", why: "some experiences have become all of them",
    re: /\b(always|never|everyone|everybody|nobody|no one|no-one|everything|nothing|all the time|every time|every single (?:time|day|one)|none of (?:them|it)|all of them|not once|ever since|forever|constantly)\b/g },
  { pattern: "modalOperatorImpossibility", why: "a limit stated as a fact",
    re: /\b(can't|cannot|can not|couldn't|could not|impossible|no way (?:i|we) can|unable to|not able to|there's no way|there is no way|incapable of)\b/g },
  { pattern: "modalOperatorNecessity", why: "a rule stated as a law",
    re: /\b(have to|has to|had to|must(?:n't)?|should(?:n't)?|ought to|need to|needs to|got to|gotta|supposed to|it's my job to|it is my job to|have no choice|had no choice)\b/g },
  { pattern: "eitherOr", why: "only two positions, with the middle deleted",
    re: /\b(either .{2,40}? or\b|all or nothing|black or white|black and white|it's all or nothing|if i can't .{2,40}? (?:then )?(?:there's no point|there is no point|why bother|forget it|what's the point)|there are only two|one or the other|no middle ground|no in[- ]between)/g },
  { pattern: "mindReading", why: "another person's inner state claimed without evidence",
    re: /\b((?:he|she|they|you|everyone|everybody|people|my \w+|the \w+s?)\s+(?:(?:probably|obviously|clearly|must|just|secretly|really|all)\s+)?(?:thinks?|feels?|knows?|hates?|doesn't care|don't care|couldn't care less|is judging|are judging|wants? me to|expects? me to|is disappointed|are disappointed|is ashamed of|are ashamed of|looks? down on|is sick of|are sick of|is tired of|are tired of|thinks? i'm|think i'm|would rather|resents? me|blames? me|sees? me as|see me as)\b|i know (?:exactly )?(?:what|how) (?:he|she|they|you) (?:feel|think|really))/g },
  { pattern: "causeEffect", why: "the controls of a feeling handed to something outside",
    re: /\b((?:he|she|they|it|this|that|you|work|my \w+|the \w+)\s+(?:always |just |really |constantly )?(?:makes? me|made me|making me|forces? me|forced me|causes? me|caused me|drives? me|drove me|gets? me|got me|leaves? me|left me|puts? me|ruins? my|ruined my|destroys? my)\b|because of (?:him|her|them|you|it|that|what (?:he|she|they) (?:did|said))|that's why i\b|it's (?:his|her|their|your) fault (?:that )?i\b)/g },
  { pattern: "complexEquivalence", why: "two different things welded together as equivalent",
    re: /\b(which means|that means|it means|means that|means i|means he|means she|means they|is the same as|is proof that|proves that|that proves|that shows|shows that|obviously means|so clearly i|so i must be|so i guess i'm)\b/g },
  { pattern: "lostPerformative", why: "a judgment whose judge has been deleted",
    re: /\b((?:it's|it is|that's|that is|this is)\s+(?:just |so |really )?(?:wrong|bad|stupid|selfish|weak|pathetic|ridiculous|unacceptable|a waste|shameful|disgusting|embarrassing|lazy|childish|crazy|inappropriate)(?: to| that| of me| for me)?|(?:good|real|proper|normal|strong|decent) (?:people|men|women|mothers|fathers|moms|dads|doctors|husbands|wives|parents|adults|friends|christians|professionals) (?:should|shouldn't|don't|never|always|would|wouldn't)|one (?:should|shouldn't|ought to|must)|you're supposed to|nobody should|it isn't right to|it's not right to|it's not normal to|that's not how (?:it works|it's done|adults act))\b/g },
  { pattern: "nominalization", why: "a process frozen into a thing",
    re: new RegExp(`${W}(?:my|your|his|her|their|our|the|this|that|a|an|lack of|loss of|no|without|with|of)\\s+(${Object.keys(DENOMINALIZE).map(k => k.replace(/[-]/g, "\\-")).join("|")})${W}`, "g"), group: 1 },
  { pattern: "comparativeDeletion", why: "a comparison with its other half missing",
    re: /\b(better|worse|best|worst|easier|harder|stronger|weaker|smarter|happier|more successful|more together|too much|too little|too hard|too late|not enough|good enough|(?:the )?(?:most|least) \w+)\b(?!\s+(?:than|compared|as)\b)/g },
  { pattern: "unspecifiedVerb", why: "something was done, but how is deleted",
    re: /\b((?:he|she|they|you|my \w+|the \w+|everyone|people)\s+(?:(?:always|never|just|really|totally|completely|constantly)\s+)?(?:hurt|hurts|rejected|rejects|ignored|ignores|abandoned|abandons|let me down|lets me down|failed me|fails me|ruined|ruins|betrayed|betrays|used me|uses me|treated me|treats me|bullied|bullies|humiliated|humiliates|dismissed|dismisses|controlled|controls|manipulated|manipulates|attacked|attacks|pushed me away|pushes me away|shut me out|shuts me out)\b)/g },
  { pattern: "lackOfReferentialIndex", why: "an unnamed crowd is the actor",
    re: /\b((?:they|people|everyone|everybody|someone|some people|others|things|stuff|it all|society|the world)\s+(?:all |just |always |never )?(?:say|says|said|think|thinks|thought|want|wants|expect|expects|keep|keeps|are|is|don't|doesn't|won't|will|get|gets|feel|feels|seem|seems|treat|tell|tells|told|judge|judges|know|knows))\b/g },
  { pattern: "simpleDeletion", why: "a state named without its object",
    re: /\b((?:i'm|i am|i feel|i've been|i have been|i get|i got|feeling)\s+(?:so |really |very |just |kind of |sort of |a bit |a little |pretty |extremely |incredibly )?(?:afraid|scared|upset|worried|anxious|nervous|confused|angry|mad|frustrated|overwhelmed|ashamed|guilty|embarrassed|disappointed|hurt|lost|stuck|uncomfortable|uneasy|terrified|furious|hopeless|helpless|exhausted|drained|numb|empty))\b(?!\s+(?:of|about|by|that|because|with|at|for|when|since|over|from|to)\b)/g },
  { pattern: "pseudoWord", why: "an absolute adverb inflating the experience",
    re: /\b(totally|completely|absolutely|literally|utterly|entirely|100 ?%|a hundred percent)\b/g },
];

function normalize(text: unknown): string {
  return String(text ?? "").replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}

function fill(template: string, x: string, noun?: string): string {
  const out = template.replace(/\{x\}/g, x).replace(/\{noun\}/g, noun ?? x);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/**
 * Detect Meta-Model patterns in a text. Overlapping matches keep the earlier,
 * more specific detector (identification beats simple deletion on "I'm
 * hopeless"). Returns findings in order of appearance.
 */
export function metaModel(text: unknown): MetaModelFinding[] {
  const t = normalize(text);
  if (!t) return [];
  const lower = t.toLowerCase();
  const claimed: boolean[] = new Array(lower.length).fill(false);
  const found: MetaModelFinding[] = [];
  for (const d of DETECTORS) {
    d.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = d.re.exec(lower)) !== null && guard++ < 200) {
      if (m[0].length === 0) { d.re.lastIndex++; continue; }
      const start = m.index;
      const end = start + m[0].length;
      let free = true;
      for (let i = start; i < end; i++) if (claimed[i]) { free = false; break; }
      if (!free) continue;
      for (let i = start; i < end; i++) claimed[i] = true;
      const dist = META_MODEL_BY_PATTERN[d.pattern];
      const x = (d.group !== undefined ? m[d.group] : m[0]) ?? m[0];
      const noun = d.pattern === "nominalization" ? DENOMINALIZE[x] : undefined;
      const challenge = fill(dist.challenges[found.filter(f => f.pattern === d.pattern).length % dist.challenges.length], x.trim(), noun);
      found.push({ pattern: d.pattern, category: dist.category, name: dist.name, match: t.slice(start, end), index: start, severity: dist.severity, challenge, why: d.why });
    }
  }
  found.sort((a, b) => a.index - b.index);
  return found;
}

/** The single finding most worth a question: highest severity, then earliest. */
export function loadBearing(findings: readonly MetaModelFinding[]): MetaModelFinding | null {
  if (!findings.length) return null;
  return [...findings].sort((a, b) => b.severity - a.severity || a.index - b.index)[0];
}

/** Counts by category, for a reading panel. */
export function metaModelSummary(findings: readonly MetaModelFinding[]): { deletion: number; generalization: number; distortion: number; total: number; heaviest: MetaModelPattern | null } {
  const s = { deletion: 0, generalization: 0, distortion: 0, total: findings.length, heaviest: null as MetaModelPattern | null };
  for (const f of findings) s[f.category] += 1;
  const lb = loadBearing(findings);
  s.heaviest = lb ? lb.pattern : null;
  return s;
}

/**
 * A block for a server-owned system prompt: what the person's language did,
 * and the one question that would recover the most. The model is told to
 * ask at most one, and only after reflecting first.
 */
export function metaModelPromptBlock(findings: readonly MetaModelFinding[]): string {
  if (!findings.length) return "META-MODEL: the person's language is fairly well formed; no recovery question is needed this turn.";
  const lb = loadBearing(findings)!;
  const others = findings.filter(f => f !== lb).slice(0, 3).map(f => `${f.name} ("${f.match}")`).join("; ");
  return [
    `META-MODEL (Structure of Magic): the sentence "${lb.match}" is a ${lb.name.toLowerCase()} — ${lb.why}.`,
    `If it fits the moment, reflect first, then ask ONE recovery question such as: "${lb.challenge}"`,
    others ? `Also present, lower priority: ${others}.` : "",
    "Never stack questions. Never explain the pattern's name to the person. If they are in acute distress, skip the question and stay with them.",
  ].filter(Boolean).join("\n");
}
