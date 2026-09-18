// ============================================================
// AI WHISPERER — reading the room.
//
// A video frame (from the Zoom stream or the advisor's own screen share)
// goes to a vision model, which returns body language in plain words and
// a score from −1 (closed, disengaged) to +1 (open, engaged). Audio energy
// becomes a tone signal without any model. Both feed the coach as Signals.
//
// Frames are throttled to one read every FRAME_INTERVAL_MS per session,
// so a one-hour call costs about 180 vision calls, not 3,600.
// ============================================================
import { anthropicHeaders } from "./_core/anthropic";
import type { Signal } from "@shared/whispererEngine";

export const FRAME_INTERVAL_MS = 20_000;

const VISION_SYSTEM =
  "You read body language on video sales calls for a financial advisor's coach. Look at the person on screen (the client, not the advisor). " +
  "Describe in under 25 words their posture, facial expression, eye contact and engagement, then judge openness. " +
  "Reply with JSON only: {\"summary\": string, \"score\": number between -1 (closed, distracted, irritated) and 1 (open, leaning in, engaged), \"attention\": number 0..1}. " +
  "If no face is visible, reply {\"summary\":\"no face visible\",\"score\":0,\"attention\":0}.";

export function visionConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY);
}

async function readWithClaude(jpegBase64: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", ...anthropicHeaders(apiKey) },
    body: JSON.stringify({
      model: "claude-sonnet-4-5", max_tokens: 200, system: VISION_SYSTEM,
      messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpegBase64 } }, { type: "text", text: "Read this frame." }] }],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`vision HTTP ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  return data.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n") ?? "";
}

async function readWithOpenAI(jpegBase64: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o", max_tokens: 200,
      messages: [{ role: "system", content: VISION_SYSTEM }, { role: "user", content: [{ type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpegBase64}`, detail: "low" } }, { type: "text", text: "Read this frame." }] }],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`vision HTTP ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

export function parseVisionReply(text: string): { summary: string; score: number; attention: number } | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]) as { summary?: string; score?: number; attention?: number };
    const score = Math.max(-1, Math.min(1, Number(j.score ?? 0)));
    const attention = Math.max(0, Math.min(1, Number(j.attention ?? 0)));
    return { summary: String(j.summary ?? "").slice(0, 200), score: Number.isFinite(score) ? score : 0, attention: Number.isFinite(attention) ? attention : 0 };
  } catch {
    return null;
  }
}

/** Turn a frame into a body-language signal, or null when no model is configured or the frame is unreadable. */
export async function readFrame(jpegBase64: string, at: number, source: Signal["source"] = "vision-model", env: NodeJS.ProcessEnv = process.env): Promise<Signal[] | null> {
  let text = "";
  try {
    if (env.ANTHROPIC_API_KEY) text = await readWithClaude(jpegBase64, env.ANTHROPIC_API_KEY);
    else if (env.OPENAI_API_KEY) text = await readWithOpenAI(jpegBase64, env.OPENAI_API_KEY);
    else return null;
  } catch (e) {
    console.warn("[whisperer] vision read failed", String(e).slice(0, 120));
    return null;
  }
  const parsed = parseVisionReply(text);
  if (!parsed || parsed.summary === "no face visible") return null;
  const out: Signal[] = [{ at, kind: "body", value: parsed.summary, score: parsed.score, source }];
  out.push({ at, kind: "attention", value: parsed.attention >= 0.7 ? "attentive" : parsed.attention >= 0.4 ? "partly attentive" : "distracted", score: parsed.attention * 2 - 1, source });
  return out;
}

/**
 * Tone from audio energy alone: a steady, moderate level reads as engaged;
 * long near-silence from the client reads as withdrawn; spikes read as
 * heat. `history` is the last minute of RMS readings for the same speaker.
 */
export function toneFromEnergy(history: number[], at: number, source: Signal["source"] = "zoom-audio"): Signal | null {
  if (history.length < 5) return null;
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const max = Math.max(...history);
  const variance = history.reduce((a, b) => a + (b - mean) ** 2, 0) / history.length;
  const sd = Math.sqrt(variance);
  if (mean < 0.01) return { at, kind: "energy", value: "near silent, withdrawn", score: -0.4, source };
  if (max > 0.35 && sd > 0.12) return { at, kind: "tone", value: "sharp spikes, heated or emphatic", score: -0.3, source };
  if (mean > 0.06 && sd < 0.08) return { at, kind: "tone", value: "steady, even, engaged", score: 0.4, source };
  if (mean > 0.03) return { at, kind: "tone", value: "moderate, conversational", score: 0.2, source };
  return { at, kind: "energy", value: "low, flat", score: -0.1, source };
}
