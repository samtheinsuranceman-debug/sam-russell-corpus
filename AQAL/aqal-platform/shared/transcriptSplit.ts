// ============================================================
// TRANSCRIPT SPLITTER — one .txt file, many spoken answers
// ============================================================
// Members who answer offline (tape recorder / voice-memo transcription) are
// told to say "Question one…" before each answer. This parses that continuous
// transcript into per-question segments.
//
// DETECTION METHODS (in priority order):
// 1. Explicit markers: "Question 1", "question one", "Q3:", "question number seven"
// 2. Question title read aloud: "The Theme Park", "the superpower trial", etc.
// 3. Key phrase from question text: "theme park and a blank check", "superpower every day"
//
// If the user reads the question aloud before answering, the parser detects it.

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20,
  "twenty one": 21, "twenty-one": 21, "twenty two": 22, "twenty-two": 22,
  "twenty three": 23, "twenty-three": 23, "twenty four": 24, "twenty-four": 24,
  "twenty five": 25, "twenty-five": 25, "twenty six": 26, "twenty-six": 26,
  "twenty seven": 27, "twenty-seven": 27,
};

// Longest alternatives first so "twenty seven" wins over "twenty".
const WORD_ALTS = Object.keys(NUMBER_WORDS)
  .sort((a, b) => b.length - a.length)
  .map((w) => w.replace(/[- ]/g, "[\\s-]"))
  .join("|");

const MARKER_RE = new RegExp(
  `(?:^|[\\s.,;!?()\\[\\]"'])(?:question|q)\\s*(?:number\\s*)?(\\d{1,2}|${WORD_ALTS})\\b[.:,]?`,
  "gi",
);

function toNumber(raw: string): number | null {
  const cleaned = raw.toLowerCase().replace(/[\s-]+/g, " ").trim();
  if (/^\d{1,2}$/.test(cleaned)) return parseInt(cleaned, 10);
  return NUMBER_WORDS[cleaned] ?? NUMBER_WORDS[cleaned.replace(" ", "-")] ?? null;
}

export type TranscriptSegment = { question: number; text: string; words: number };

// ============================================================
// QUESTION SIGNATURES — titles and key phrases for fuzzy matching
// These are the actual question titles and distinctive phrases that a user
// would read aloud before answering. Ordered by QUESTION_ORDER (display order).
// ============================================================
type QuestionSignature = {
  displayIndex: number; // 1-based position in the assessment (what the user sees)
  id: number;          // internal QUESTIONS_SOURCE id
  title: string;       // e.g. "The Theme Park"
  keyPhrases: string[]; // distinctive phrases from the question text
};

// Display order (matches QUESTION_ORDER in Assessment.tsx)
const DISPLAY_ORDER = [1, 2, 3, 4, 10, 13, 14, 15, 5, 7, 11, 9, 8, 12, 16, 19, 18, 17, 6, 21, 22, 20, 23, 24, 25, 26, 27];

const QUESTION_SIGNATURES: QuestionSignature[] = [
  { displayIndex: 1, id: 1, title: "The Theme Park", keyPhrases: ["theme park", "blank check", "three rides that don't exist", "add three rides"] },
  { displayIndex: 2, id: 2, title: "The Superpower Trial", keyPhrases: ["superpower every day", "test drive a different superpower", "test-drive a different superpower", "flight invisibility", "healing touch", "invent for sunday", "invent one for sunday"] },
  { displayIndex: 3, id: 3, title: "The Jet", keyPhrases: ["25 million and a private jet", "private jet for 72 hours", "$25 million", "72 hours with zero consequences"] },
  { displayIndex: 4, id: 4, title: "The Road Trip", keyPhrases: ["unlimited money one month", "any vehicle you want", "who's riding shotgun", "first detour"] },
  { displayIndex: 5, id: 10, title: "The Zoo of Impossible Animals", keyPhrases: ["zoo that only holds animals", "animals that don't exist", "impossible animals", "zoo of impossible"] },
  { displayIndex: 6, id: 13, title: "The Blueprint", keyPhrases: ["dream out loud", "could not fail", "what are you actually chasing", "if you literally could not fail"] },
  { displayIndex: 7, id: 14, title: "The Seven Perfect Things", keyPhrases: ["seven things are just completely dialed", "seven perfect things", "your version of perfect"] },
  { displayIndex: 8, id: 15, title: "The Dream Concert", keyPhrases: ["impossible concert", "any artists any era", "alive or dead", "dream concert", "who opens who headlines"] },
  { displayIndex: 9, id: 5, title: "The App That Prints Money", keyPhrases: ["app that prints money", "product everyone's obsessed with", "pitch it to me", "write the check"] },
  { displayIndex: 10, id: 7, title: "The Island", keyPhrases: ["private island the size of manhattan", "80 million", "180 days before the first guests", "the island"] },
  { displayIndex: 11, id: 11, title: "The Half-Million Build", keyPhrases: ["500,000", "half million", "48 hours and one other person", "half-million build", "build or make something real"] },
  { displayIndex: 12, id: 9, title: "System Redesign", keyPhrases: ["redesign one major system", "money dating cities time education", "system redesign"] },
  { displayIndex: 13, id: 8, title: "The Casino Night", keyPhrases: ["games are rigged in your favor", "casino night", "which table do you sit at", "how do you bet"] },
  { displayIndex: 14, id: 12, title: "One Hundred Million", keyPhrases: ["100 million", "hundred million", "spent or given away within 30 days", "no investing no saving"] },
  { displayIndex: 15, id: 16, title: "The Mentor Windfall", keyPhrases: ["20 million and one year", "young person with raw talent", "mentor windfall", "zero resources"] },
  { displayIndex: 16, id: 19, title: "The Charm Offensive", keyPhrases: ["inner circle", "wary of outsiders", "one dinner to win them over", "charm offensive"] },
  { displayIndex: 17, id: 18, title: "The Negotiation", keyPhrases: ["tough sharp negotiator", "across the table", "the negotiation", "opening move"] },
  { displayIndex: 18, id: 17, title: "Two People You Love", keyPhrases: ["two people you love", "in conflict", "wants you on their side"] },
  { displayIndex: 19, id: 6, title: "Parallel Dinner", keyPhrases: ["secret midnight dinner for six", "parallel dinner", "different version of you from a parallel life"] },
  { displayIndex: 20, id: 21, title: "The Peak-You Year", keyPhrases: ["peak-you year", "absolute peak", "strongest sharpest most alive", "one year from today"] },
  { displayIndex: 21, id: 22, title: "The Underdog Bet", keyPhrases: ["everyone says the thing you want", "impossible too late too risky", "underdog bet", "prove them dead wrong"] },
  { displayIndex: 22, id: 20, title: "The Goal Pre-Mortem", keyPhrases: ["top five", "real goals right now", "pre-mortem", "goal pre-mortem", "sabotage it"] },
  { displayIndex: 23, id: 23, title: "The Signature Move", keyPhrases: ["thing they do better", "signature move", "your absolute best", "how'd you get that good"] },
  { displayIndex: 24, id: 24, title: "The Founder's Grip", keyPhrases: ["built something real from nothing", "founder's grip", "loosen their grip"] },
  { displayIndex: 25, id: 25, title: "The Unsaid Thing", keyPhrases: ["something you've been carrying", "unsaid thing", "need to say to someone", "weight of it in your body"] },
  { displayIndex: 26, id: 26, title: "The Standing Ovation", keyPhrases: ["whole room is on its feet", "standing ovation", "applauding you", "what are they clapping for"] },
  { displayIndex: 27, id: 27, title: "The Torch You Pass", keyPhrases: ["end of a long full life", "torch you pass", "pass the torch", "hand one thing to the people who come after"] },
];

// Build a lookup: for each signature, create regex patterns for title and key phrases
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type DetectedHit = { displayIndex: number; position: number; endPosition: number; method: "marker" | "title" | "phrase" };

/**
 * Split a continuous transcript into per-question segments by spoken markers,
 * question titles read aloud, or key phrases from the question text.
 * Returns [] when no valid markers are found (caller decides the fallback).
 * Repeated markers for the same question are concatenated (people restart).
 * maxQuestion bounds accepted numbers (default 27).
 */
export function splitTranscript(text: string, maxQuestion = 27): TranscriptSegment[] {
  const hits: DetectedHit[] = [];
  const textLower = text.toLowerCase();

  // Method 1: Explicit "Question N" markers (highest priority)
  MARKER_RE.lastIndex = 0;
  for (let m = MARKER_RE.exec(text); m; m = MARKER_RE.exec(text)) {
    const q = toNumber(m[1]);
    if (q !== null && q >= 1 && q <= maxQuestion) {
      hits.push({ displayIndex: q, position: m.index, endPosition: m.index + m[0].length, method: "marker" });
    }
  }

  // Method 2: Question titles read aloud (e.g., "the theme park", "the superpower trial")
  for (const sig of QUESTION_SIGNATURES) {
    if (sig.displayIndex > maxQuestion) continue;
    // Look for the title (case-insensitive)
    const titleLower = sig.title.toLowerCase();
    let idx = textLower.indexOf(titleLower);
    while (idx !== -1) {
      // Only count if not already covered by a marker hit within 50 chars
      const alreadyCovered = hits.some(h => Math.abs(h.position - idx) < 50 && h.displayIndex === sig.displayIndex);
      if (!alreadyCovered) {
        hits.push({ displayIndex: sig.displayIndex, position: idx, endPosition: idx + sig.title.length, method: "title" });
      }
      idx = textLower.indexOf(titleLower, idx + 1);
    }
  }

  // Method 3: Key phrases from question text (fuzzy — allows transcription variations)
  for (const sig of QUESTION_SIGNATURES) {
    if (sig.displayIndex > maxQuestion) continue;
    for (const phrase of sig.keyPhrases) {
      const phraseLower = phrase.toLowerCase();
      let idx = textLower.indexOf(phraseLower);
      while (idx !== -1) {
        // Only add if no hit for this question within 200 chars already
        const alreadyCovered = hits.some(h => Math.abs(h.position - idx) < 200 && h.displayIndex === sig.displayIndex);
        if (!alreadyCovered) {
          hits.push({ displayIndex: sig.displayIndex, position: idx, endPosition: idx + phrase.length, method: "phrase" });
        }
        idx = textLower.indexOf(phraseLower, idx + phrase.length + 100);
      }
    }
  }

  if (hits.length === 0) return [];

  // Deduplicate: for each question, keep only the EARLIEST hit (the first time they start that question)
  const earliestByQuestion = new Map<number, DetectedHit>();
  // Sort by position first
  hits.sort((a, b) => a.position - b.position);

  for (const hit of hits) {
    const existing = earliestByQuestion.get(hit.displayIndex);
    if (!existing) {
      earliestByQuestion.set(hit.displayIndex, hit);
    } else {
      // Prefer marker > title > phrase; if same method, keep earliest
      const priority = { marker: 3, title: 2, phrase: 1 };
      if (priority[hit.method] > priority[existing.method]) {
        earliestByQuestion.set(hit.displayIndex, hit);
      }
    }
  }

  // Sort by position in text to determine segment boundaries
  const sortedHits = Array.from(earliestByQuestion.values()).sort((a, b) => a.position - b.position);

  if (sortedHits.length === 0) return [];

  // Extract text between each hit
  const segments: TranscriptSegment[] = [];
  for (let i = 0; i < sortedHits.length; i++) {
    const start = sortedHits[i].endPosition;
    const end = i + 1 < sortedHits.length ? sortedHits[i + 1].position : text.length;
    const body = text.slice(start, end).trim();
    if (!body) continue;
    const words = body.split(/\s+/).filter(Boolean).length;
    if (words > 0) {
      segments.push({ question: sortedHits[i].displayIndex, text: body, words });
    }
  }

  // Also capture any text BEFORE the first detected question as potential preamble
  // (only if the first hit isn't at the very beginning)
  if (sortedHits[0].position > 100) {
    const preamble = text.slice(0, sortedHits[0].position).trim();
    const preambleWords = preamble.split(/\s+/).filter(Boolean).length;
    // If there's substantial text before the first question and it looks like an answer,
    // try to figure out which question it belongs to. If the first detected question is Q2+,
    // assign preamble to Q1 (common: user starts talking without saying "Question 1")
    if (preambleWords > 50 && sortedHits[0].displayIndex > 1) {
      segments.unshift({ question: 1, text: preamble, words: preambleWords });
    }
  }

  return segments
    .filter((s) => s.words > 0)
    .sort((a, b) => a.question - b.question);
}
