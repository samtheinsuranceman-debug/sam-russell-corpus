// ============================================================
// COPY GUARD — the promise discipline for the first-login and Wealth
// Genome screens (RCS-INTRO-75-CONTROLS, controls 42/43 and factor F10).
//
// Some sentences must never appear on these screens: "the best place",
// "the best product", "guaranteed", "diagnosis", "we treat anxiety", any
// hormone or neurotransmitter word, or a yearly percentage value of advice.
// Each is a claim the firm cannot stand behind.
//
// A disclaimer is not a claim. The consent screen has to say in writing
// that the genome is NOT a diagnosis, so a phrase preceded closely by a
// negation ("not a diagnosis", "nothing here is guaranteed") passes. An
// affirmative use ("your diagnosis", "guaranteed returns") fails.
//
// "Guaranteed" is banned as a sales claim only. Labelling a contract's own
// guaranteed values is required disclosure and passes: "guaranteed minimum
// interest rate", "guaranteed values", "contractual guarantee", "the
// guaranteed column of the illustration".
//
// Every string the new screens print is run through assertCleanCopy() in
// server/copyGuard.test.ts, so a banned sentence fails the build instead
// of reaching a visitor.
// ============================================================

/** Phrases that must not be asserted on the genome and first-login screens. */
export const BANNED_COPY_PHRASES: readonly string[] = [
  "best place",
  "best product",
  "guaranteed",
  "guarantee",
  "diagnosis",
  "diagnose",
  "we treat anxiety",
  "treats anxiety",
];

/**
 * Banned outright, negated or not. A yearly percentage value of advice
 * ("worth ~3% per year") — the research the claim usually cites does not
 * describe an annual figure. And hormone words, which have no place in a
 * financial product's copy even as a denial.
 */
export const BANNED_COPY_PATTERNS: readonly RegExp[] = [
  // No hormone or neurotransmitter words at all — not as a claim, not as a denial,
  // not as a name. Written as stems so the words themselves appear nowhere in code.
  /\b(?:dopamin|oxytoc|serotoni|endorphi|cortiso|adrenali|noradrenali|melatoni)\w*/i,
  /\d+(?:\.\d+)?\s*(?:%|percent)\s*(?:per|a|each|every|\/)\s*(?:year|yr|annum)\b/i,
  /\d+(?:\.\d+)?\s*(?:%|percent)\s*(?:annually|yearly|p\.a\.)/i,
];

/** Words that turn a banned phrase into a disclaimer when they come just before it. */
const NEGATIONS = ["not", "no", "never", "nothing", "without", "isn't", "is not", "cannot", "can't", "neither", "nor"];

/** How many words before the phrase a negation may sit and still govern it. */
const NEGATION_REACH = 4;

export type CopyViolation = { phrase: string; index: number; excerpt: string };

/** Words that, right after "guaranteed", make it the label of a contract value rather than a promise. */
const CONTRACT_VALUE_WORDS = [
  "minimum", "value", "values", "rate", "rates", "floor", "column", "surrender", "cash", "death", "crediting",
  "interest", "element", "elements", "portion", "amount", "amounts", "maximum", "charges",
];

/** True when "guarantee(d)" at `index` labels a contract's guaranteed value, not a sales promise. */
function isContractLabel(text: string, index: number, phrase: string): boolean {
  if (!phrase.startsWith("guarantee")) return false;
  const sentenceStart = Math.max(text.lastIndexOf(".", index), text.lastIndexOf("!", index), text.lastIndexOf("?", index)) + 1;
  const sentenceEnd = (() => {
    const ends = [".", "!", "?"].map((c) => text.indexOf(c, index)).filter((i) => i >= 0);
    return ends.length ? Math.min(...ends) : text.length;
  })();
  const sentence = text.slice(sentenceStart, sentenceEnd).toLowerCase();
  if (/\bcontract(ual|ually)?\b/.test(sentence)) return true;
  const after = text.slice(index).toLowerCase().split(/[^a-z']+/).filter(Boolean);
  const next = after[1];
  return next !== undefined && CONTRACT_VALUE_WORDS.includes(next);
}

function wordsBefore(text: string, index: number, n: number): string[] {
  return text.slice(0, index).toLowerCase().split(/[^a-z']+/).filter(Boolean).slice(-n);
}

function isNegated(text: string, index: number): boolean {
  const before = wordsBefore(text, index, NEGATION_REACH);
  const joined = before.join(" ");
  return NEGATIONS.some((neg) => (neg.includes(" ") ? joined.includes(neg) : before.includes(neg)));
}

/** Every affirmative use of a banned phrase in `text`. Empty when the copy is clean. */
export function copyViolations(text: string): CopyViolation[] {
  const lower = text.toLowerCase();
  const out: CopyViolation[] = [];
  const seen = new Set<number>();
  for (const re of BANNED_COPY_PATTERNS) {
    const m = re.exec(text);
    if (m) out.push({ phrase: m[0], index: m.index, excerpt: text.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20) });
  }
  for (const phrase of BANNED_COPY_PHRASES) {
    let from = 0;
    for (;;) {
      const at = lower.indexOf(phrase, from);
      if (at === -1) break;
      from = at + phrase.length;
      // "guarantee" also sits inside "guaranteed": report one violation per place.
      if (seen.has(at)) continue;
      if (isNegated(text, at)) continue;
      if (isContractLabel(text, at, phrase)) continue;
      seen.add(at);
      out.push({ phrase, index: at, excerpt: text.slice(Math.max(0, at - 20), at + phrase.length + 20) });
    }
  }
  return out;
}

export function isCleanCopy(text: string): boolean {
  return copyViolations(text).length === 0;
}

/** Throws with every offending excerpt, so a test failure names the sentence to fix. */
export function assertCleanCopy(texts: readonly string[], where = "copy"): void {
  const bad: string[] = [];
  for (const t of texts) for (const v of copyViolations(t)) bad.push(`"${v.phrase}" in …${v.excerpt}…`);
  if (bad.length) throw new Error(`${where}: banned promise language:\n  ${bad.join("\n  ")}`);
}
