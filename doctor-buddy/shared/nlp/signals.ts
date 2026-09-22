/**
 * Body-language and tone signals for the companion, ported from the RCS AI
 * Whisperer (server/whispererVision.ts) and turned toward the person rather
 * than a sales client. Both functions are pure; the vision call itself lives
 * on the server (server/companion.ts) and only runs with the person's
 * recorded consent.
 */

import type { CompanionSignal } from "./companion";

/** Frames are read at most this often per session; a one-hour session is ~180 reads. */
export const FRAME_INTERVAL_MS = 20_000;

/** Largest JPEG the server accepts for a frame read (base64 length). */
export const MAX_FRAME_BASE64 = 400_000;

export interface VisionReply { summary: string; score: number; attention: number }

/** Parse the model's JSON reply; null when unreadable. Scores are clamped. */
export function parseVisionReply(text: unknown): VisionReply | null {
  const m = String(text ?? "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]) as { summary?: unknown; score?: unknown; attention?: unknown };
    const score = Math.max(-1, Math.min(1, Number(j.score ?? 0)));
    const attention = Math.max(0, Math.min(1, Number(j.attention ?? 0)));
    return { summary: String(j.summary ?? "").slice(0, 200), score: Number.isFinite(score) ? score : 0, attention: Number.isFinite(attention) ? attention : 0 };
  } catch {
    return null;
  }
}

/** Turn a parsed reply into companion signals; null when no face was visible. */
export function signalsFromVision(parsed: VisionReply | null, at: number, source: CompanionSignal["source"] = "vision-model"): CompanionSignal[] | null {
  if (!parsed || !parsed.summary || /no face visible/i.test(parsed.summary)) return null;
  const out: CompanionSignal[] = [{ at, kind: "body", value: parsed.summary, score: parsed.score, source }];
  out.push({ at, kind: "attention", value: parsed.attention >= 0.7 ? "present and attentive" : parsed.attention >= 0.4 ? "partly present" : "far away", score: parsed.attention * 2 - 1, source });
  return out;
}

/**
 * Tone from microphone energy alone, no model: `history` is the last minute
 * of RMS readings (0..1) for the person. Steady moderate energy reads as
 * engaged; long near-silence as withdrawn; spikes as heat.
 */
export function toneFromEnergy(history: readonly number[], at: number, source: CompanionSignal["source"] = "browser-audio"): CompanionSignal | null {
  const h = (Array.isArray(history) ? history : []).filter(n => Number.isFinite(n)).map(n => Math.max(0, Math.min(1, n)));
  if (h.length < 5) return null;
  const mean = h.reduce((a, b) => a + b, 0) / h.length;
  const max = Math.max(...h);
  const sd = Math.sqrt(h.reduce((a, b) => a + (b - mean) ** 2, 0) / h.length);
  if (mean < 0.01) return { at, kind: "energy", value: "near silent, withdrawn", score: -0.4, source };
  if (max > 0.35 && sd > 0.12) return { at, kind: "tone", value: "sharp spikes, heated or emphatic", score: -0.3, source };
  if (mean > 0.06 && sd < 0.08) return { at, kind: "tone", value: "steady, even, engaged", score: 0.4, source };
  if (mean > 0.03) return { at, kind: "tone", value: "moderate, conversational", score: 0.2, source };
  return { at, kind: "energy", value: "low, flat", score: -0.1, source };
}
