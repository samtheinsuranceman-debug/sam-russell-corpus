// ============================================================
// AQAL — Matching Engine · TWO MODES (TypeScript)
// ============================================================
// The engine behind the Network. Two ways to pair people — the user chooses:
//
//   "complementary"  — iron sharpens iron / heal & complete.
//                       Each covers the OTHER's growth edges with their strengths,
//                       and sits at a compatible developmental altitude.
//                       Surfaces pairs who round each other out.
//
//   "resonance"      — peers who click.
//                       Shared PEAKS at a high level (both elite on the same lines)
//                       plus overall profile similarity.
//                       Surfaces pairs who'd love to talk for hours and be friends.
//
// Validated behaviour (tested) — the SAME pair flips by mode:
//   peer analyst (shares your intellectual peaks): complementary 67 · resonance 93
//   complementary healer (covers your weak spots): complementary 85 · resonance 25
// A "match high performers together" naive system fails complementary matching
// (returns redundant pairs); a "match opposites" system fails resonance. Two modes fix both.
//
// HONEST FRAMING: transparent heuristics for surfacing candidate pairs — NOT validated
// predictors of relationship/partnership success (no such validated model exists). Present
// as "suggested profiles," keep introductions mutual-consent gated.
//
// Scores expected as 0..1 "standing" per line. In production derive standing WITHIN each
// line's mode (percentile / stage position / achievement level) so comparisons are like-for-like.

import { generationForBirthYear, generationGap, type Generation } from "./cohort";

export type MatchMode = "complementary" | "resonance";

export interface Profile {
  name?: string;
  id?: string;
  scores: Record<string, number>;
  birthYear?: number | null;
}

export interface ComplementaryResult {
  mode: "complementary";
  score: number;
  basis: string;
  complementarity: number;
  compatibility: number;
  coversYourEdges: string[];
  theyNeedFromYou: string[];
}

export interface ResonanceResult {
  mode: "resonance";
  score: number;
  basis: string;
  sharedPeaks: string[];
  peakDepth: number;
  similarity: number;
}

export type MatchResult = ComplementaryResult | ResonanceResult;

export interface RankedMatch {
  candidate: Profile;
  mode: MatchMode;
  score: number;
  basis: string;
  [key: string]: unknown;
}

export const MODES: MatchMode[] = ["complementary", "resonance"];

export const ALTITUDE_LINES = ["Intrapersonal", "Reflective", "Existential", "Philosophical", "Integrative"];

export const WEIGHTS = {
  complementary: { complementarity: 0.65, compatibility: 0.35 },
  resonance: { peaks: 0.6, similarity: 0.4 },
};

export const THRESHOLDS = {
  edgeFraction: 1 / 3,     // bottom third of a person's own lines = growth edges
  strengthFraction: 1 / 3, // top third = strengths
  strengthAbs: 0.82,       // absolute bar to "cover an edge" or count as a shared peak
  breadthNorm: 5,          // 5+ shared peaks = full breadth
};

// Generational affinity — a GENTLE, mode-aware nudge (never dominates the
// cluster logic). Complementary matching rewards a generational GAP (different
// life stage rounds you out — a young prodigy and a seasoned elder cover
// different blind spots); resonance rewards the SAME generation (shared context,
// peers who click). Applied only when both people supplied a birth year.
export const GENERATION_MATCH = {
  complementaryMaxBonus: 8, // points added at max generational gap (0..100 scale)
  resonanceMaxBonus: 8,     // points added at zero generational gap
  gapSpan: 3,               // 3+ generations apart = full effect
};

// Signed score adjustment + a human-readable note for a (me, candidate) pair.
export function generationalAdjustment(
  me: Profile,
  candidate: Profile,
  mode: MatchMode,
): { delta: number; note: string | null; gap: number | null; sameGeneration: boolean } {
  if (me.birthYear == null || candidate.birthYear == null) {
    return { delta: 0, note: null, gap: null, sameGeneration: false };
  }
  const gap = generationGap(me.birthYear, candidate.birthYear);
  const nearness = Math.min(1, gap / GENERATION_MATCH.gapSpan); // 0 (same) → 1 (far)
  const genA: Generation = generationForBirthYear(me.birthYear);
  const genB: Generation = generationForBirthYear(candidate.birthYear);
  const sameGeneration = gap === 0;

  if (mode === "complementary") {
    const delta = Math.round(GENERATION_MATCH.complementaryMaxBonus * nearness);
    const note = sameGeneration
      ? `Same generation (${genB})`
      : `Cross-generational (${genA} × ${genB}) — different life-stage coverage`;
    return { delta, note, gap, sameGeneration };
  }
  // resonance
  const delta = Math.round(GENERATION_MATCH.resonanceMaxBonus * (1 - nearness));
  const note = sameGeneration
    ? `Same generation (${genB}) — shared context`
    : `${genA} × ${genB}`;
  return { delta, note, gap, sameGeneration };
}

function rankedLines(s: Record<string, number>): string[] {
  return Object.entries(s).sort((a, b) => a[1] - b[1]).map(([k]) => k);
}

export function growthEdges(scores: Record<string, number>): string[] {
  const r = rankedLines(scores);
  return r.slice(0, Math.max(1, Math.round(r.length * THRESHOLDS.edgeFraction)));
}

export function strengths(scores: Record<string, number>): string[] {
  const r = rankedLines(scores);
  return r.slice(-Math.max(1, Math.round(r.length * THRESHOLDS.strengthFraction)));
}

// ---------- shared helpers ----------
function coverage(edges: string[], other: Record<string, number>): number {
  if (!edges.length) return 0;
  return edges.reduce((s, l) => s + (other[l] ?? 0), 0) / edges.length;
}

function altitudeCompatibility(a: Record<string, number>, b: Record<string, number>): number {
  const ls = ALTITUDE_LINES.filter((l) => l in a && l in b);
  if (!ls.length) return 0.5;
  return 1 - ls.reduce((s, l) => s + Math.abs(a[l] - b[l]), 0) / ls.length;
}

function sharedPeaks(a: Record<string, number>, b: Record<string, number>): string[] {
  return Object.keys(a).filter((l) => l in b && a[l] >= THRESHOLDS.strengthAbs && b[l] >= THRESHOLDS.strengthAbs);
}

function overallSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  const ls = Object.keys(a).filter((l) => l in b);
  if (!ls.length) return 0;
  return 1 - ls.reduce((s, l) => s + Math.abs(a[l] - b[l]), 0) / ls.length;
}

function fmtList(arr: string[]): string {
  if (arr.length <= 2) return arr.join(" and ");
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

// ---------- MODE: complementary ----------
export function complementaryMatch(me: Profile, candidate: Profile): ComplementaryResult {
  const A = me.scores, B = candidate.scores;
  const myEdges = growthEdges(A), theirEdges = growthEdges(B);
  const covByThem = coverage(myEdges, B);
  const covByMe = coverage(theirEdges, A);
  const complementarity = (covByThem + covByMe) / 2;
  const compatibility = altitudeCompatibility(A, B);
  const w = WEIGHTS.complementary;
  const score = Math.round(100 * (w.complementarity * complementarity + w.compatibility * compatibility));

  const coversYourEdges = myEdges.filter((l) => (B[l] ?? 0) >= THRESHOLDS.strengthAbs);
  const theyNeedFromYou = theirEdges.filter((l) => (A[l] ?? 0) >= THRESHOLDS.strengthAbs);
  const basis = coversYourEdges.length
    ? `Covers your ${fmtList(coversYourEdges)}`
    : "Rounds out your profile";
  return {
    mode: "complementary", score, basis,
    complementarity: +complementarity.toFixed(3),
    compatibility: +compatibility.toFixed(3),
    coversYourEdges, theyNeedFromYou,
  };
}

// ---------- MODE: resonance ----------
export function resonanceMatch(me: Profile, candidate: Profile): ResonanceResult {
  const A = me.scores, B = candidate.scores;
  const peaks = sharedPeaks(A, B);
  const depth = peaks.length ? peaks.reduce((s, l) => s + Math.min(A[l], B[l]), 0) / peaks.length : 0;
  const breadth = Math.min(1, peaks.length / THRESHOLDS.breadthNorm);
  const peakComponent = depth * (0.5 + 0.5 * breadth);
  const similarity = overallSimilarity(A, B);
  const w = WEIGHTS.resonance;
  const score = Math.round(100 * (w.peaks * peakComponent + w.similarity * similarity));

  const topShared = [...peaks].sort((a, b) => Math.min(B[b], A[b]) - Math.min(B[a], A[a])).slice(0, 3);
  const basis = peaks.length
    ? `Shared strength in ${fmtList(topShared)}`
    : "Similar overall profile";
  return {
    mode: "resonance", score, basis,
    sharedPeaks: peaks,
    peakDepth: +depth.toFixed(3),
    similarity: +similarity.toFixed(3),
  };
}

// ---------- unified entry ----------
export function matchScore(me: Profile, candidate: Profile, mode: MatchMode = "complementary"): MatchResult {
  return mode === "resonance" ? resonanceMatch(me, candidate) : complementaryMatch(me, candidate);
}

/**
 * Rank a pool for `me` in the chosen mode, best first.
 */
export function rankMatches(
  me: Profile,
  candidates: Profile[],
  { mode = "complementary" as MatchMode, minScore = 0, limit = Infinity } = {}
): Array<{ candidate: Profile } & MatchResult> {
  return candidates
    .map((c) => {
      const base = matchScore(me, c, mode);
      const gen = generationalAdjustment(me, c, mode);
      const score = Math.max(0, Math.min(100, base.score + gen.delta));
      return {
        candidate: c,
        ...base,
        score,
        clusterScore: base.score,
        generationGap: gen.gap,
        sameGeneration: gen.sameGeneration,
        generationalNote: gen.note,
      };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Return both modes at once (e.g. to show "great to grow with" AND "great to think with").
 */
export function matchBoth(me: Profile, candidate: Profile): { complementary: ComplementaryResult; resonance: ResonanceResult } {
  return { complementary: complementaryMatch(me, candidate), resonance: resonanceMatch(me, candidate) };
}
