// ============================================================
// TRANSCRIPT SPLITTER — one .txt file, many spoken answers
// ============================================================
// Members who answer offline (tape recorder / voice-memo transcription) are
// told to say "Question one…" before each answer. This parses that continuous
// transcript into per-question segments. Tolerant of what STT actually emits:
// "Question 1", "question one.", "Q3:", "question number seven", case noise.

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

/**
 * Split a continuous transcript into per-question segments by spoken markers.
 * Returns [] when no valid markers are found (caller decides the fallback).
 * Repeated markers for the same question are concatenated (people restart).
 * maxQuestion bounds accepted numbers (default 27).
 */
export function splitTranscript(text: string, maxQuestion = 27): TranscriptSegment[] {
  const hits: { question: number; start: number; end: number }[] = [];
  MARKER_RE.lastIndex = 0;
  for (let m = MARKER_RE.exec(text); m; m = MARKER_RE.exec(text)) {
    const q = toNumber(m[1]);
    if (q !== null && q >= 1 && q <= maxQuestion) {
      hits.push({ question: q, start: m.index, end: m.index + m[0].length });
    }
  }
  if (hits.length === 0) return [];

  const byQuestion = new Map<number, string[]>();
  for (let i = 0; i < hits.length; i++) {
    const body = text.slice(hits[i].end, i + 1 < hits.length ? hits[i + 1].start : text.length).trim();
    if (!body) continue;
    const list = byQuestion.get(hits[i].question) ?? [];
    list.push(body);
    byQuestion.set(hits[i].question, list);
  }

  return Array.from(byQuestion.entries())
    .map(([question, parts]) => {
      const joined = parts.join("\n\n");
      return { question, text: joined, words: joined.split(/\s+/).filter(Boolean).length };
    })
    .filter((s) => s.words > 0)
    .sort((a, b) => a.question - b.question);
}
