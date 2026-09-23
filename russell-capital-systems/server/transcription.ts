// ============================================================
// TRANSCRIPTION — speech to text for the whole site, two providers.
//
//   deepgram    POST https://api.deepgram.com/v1/listen, raw audio in the
//               body, model nova-3 with smart formatting (DEEPGRAM_API_KEY).
//   assemblyai  upload to /v2/upload, queue /v2/transcript, poll until it
//               completes (ASSEMBLYAI_API_KEY).
//
// TRANSCRIPTION_PROVIDER picks which is tried first; otherwise Deepgram
// leads because it answers in one round trip. When the first provider
// fails and the other is configured, the other transcribes instead and
// the result says so.
//
// The browser's long voice sessions (client/src/hooks/useLongVoiceSession,
// used by Thomas Goldman's intake) post each closed segment to
// POST /api/voice/transcribe; that route is registered here.
// ============================================================
import type { Express, Request, Response } from "express";
import express from "express";
import { sdk } from "./_core/sdk";

export type SttProvider = "deepgram" | "assemblyai";
export type TranscribeOptions = { mimeType?: string; language?: string; env?: NodeJS.ProcessEnv; pollMs?: number; timeoutMs?: number };
export type TranscriptResult = { text: string; provider: SttProvider; language?: string; durationSec?: number; fallback?: string };

const DEEPGRAM = "https://api.deepgram.com";
const ASSEMBLYAI = "https://api.assemblyai.com";
/** Deepgram's current flagship pre-recorded model. */
export const DEEPGRAM_MODEL = "nova-3";
/** AssemblyAI tries these in order: Universal-3.5 Pro, then Universal-2 for languages 3.5 does not cover. */
export const ASSEMBLYAI_MODELS = ["universal-3-5-pro", "universal-2"] as const;

export function sttConfigured(env: NodeJS.ProcessEnv = process.env): { deepgram: boolean; assemblyai: boolean; any: boolean } {
  const deepgram = Boolean(env.DEEPGRAM_API_KEY?.trim());
  const assemblyai = Boolean(env.ASSEMBLYAI_API_KEY?.trim());
  return { deepgram, assemblyai, any: deepgram || assemblyai };
}

/** A language hint the providers accept ("en", "en-US", "es"), or undefined. */
function cleanLanguage(lang: string | undefined): string | undefined {
  const l = (lang ?? "").trim();
  return /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(l) ? l : undefined;
}

// ─── Deepgram ─────────────────────────────────────────────────────────────

export async function deepgramTranscribe(audio: Buffer, opts: TranscribeOptions = {}): Promise<TranscriptResult> {
  const env = opts.env ?? process.env;
  const key = env.DEEPGRAM_API_KEY?.trim();
  if (!key) throw new Error("Deepgram is not configured: DEEPGRAM_API_KEY is not set");
  const q = new URLSearchParams({ model: DEEPGRAM_MODEL, smart_format: "true" });
  const language = cleanLanguage(opts.language);
  if (language) q.set("language", language);
  else q.set("detect_language", "true");
  const res = await fetch(`${DEEPGRAM}/v1/listen?${q}`, {
    method: "POST",
    headers: { authorization: `Token ${key}`, "content-type": opts.mimeType || "application/octet-stream" },
    body: new Uint8Array(audio),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
  });
  if (!res.ok) throw new Error(`Deepgram transcription failed (HTTP ${res.status})`);
  const body = (await res.json()) as {
    metadata?: { duration?: number };
    results?: { channels?: Array<{ detected_language?: string; alternatives?: Array<{ transcript?: string }> }> };
  };
  const channel = body.results?.channels?.[0];
  return { text: (channel?.alternatives?.[0]?.transcript ?? "").trim(), provider: "deepgram", language: channel?.detected_language ?? language, durationSec: body.metadata?.duration };
}

// ─── AssemblyAI ───────────────────────────────────────────────────────────

export async function assemblyaiTranscribe(audio: Buffer, opts: TranscribeOptions = {}): Promise<TranscriptResult> {
  const env = opts.env ?? process.env;
  const key = env.ASSEMBLYAI_API_KEY?.trim();
  if (!key) throw new Error("AssemblyAI is not configured: ASSEMBLYAI_API_KEY is not set");
  const auth = { authorization: key };

  const up = await fetch(`${ASSEMBLYAI}/v2/upload`, { method: "POST", headers: { ...auth, "content-type": "application/octet-stream" }, body: new Uint8Array(audio), signal: AbortSignal.timeout(120_000) });
  if (!up.ok) throw new Error(`AssemblyAI upload failed (HTTP ${up.status})`);
  const { upload_url } = (await up.json()) as { upload_url?: string };
  if (!upload_url) throw new Error("AssemblyAI upload returned no upload_url");

  const language = cleanLanguage(opts.language);
  const job = await fetch(`${ASSEMBLYAI}/v2/transcript`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/json" },
    body: JSON.stringify({ audio_url: upload_url, speech_models: ASSEMBLYAI_MODELS, ...(language ? { language_code: language } : { language_detection: true }) }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!job.ok) throw new Error(`AssemblyAI transcript request failed (HTTP ${job.status})`);
  const { id } = (await job.json()) as { id?: string };
  if (!id) throw new Error("AssemblyAI returned no transcript id");

  const pollMs = opts.pollMs ?? 1500;
  const deadline = Date.now() + (opts.timeoutMs ?? 180_000);
  for (;;) {
    const res = await fetch(`${ASSEMBLYAI}/v2/transcript/${encodeURIComponent(id)}`, { headers: auth, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`AssemblyAI status check failed (HTTP ${res.status})`);
    const t = (await res.json()) as { status?: string; text?: string | null; error?: string; language_code?: string; audio_duration?: number };
    if (t.status === "completed") return { text: (t.text ?? "").trim(), provider: "assemblyai", language: t.language_code ?? language, durationSec: t.audio_duration };
    if (t.status === "error") throw new Error(`AssemblyAI transcription failed: ${(t.error ?? "unknown error").slice(0, 160)}`);
    if (Date.now() >= deadline) throw new Error("AssemblyAI transcription timed out");
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

// ─── either ───────────────────────────────────────────────────────────────

const CLIENTS: Record<SttProvider, (audio: Buffer, opts: TranscribeOptions) => Promise<TranscriptResult>> = {
  deepgram: deepgramTranscribe,
  assemblyai: assemblyaiTranscribe,
};

/** The configured providers in the order they are tried. */
export function sttOrder(env: NodeJS.ProcessEnv = process.env): SttProvider[] {
  const c = sttConfigured(env);
  const preferred = (env.TRANSCRIPTION_PROVIDER ?? "").trim().toLowerCase();
  const order: SttProvider[] = preferred === "assemblyai" ? ["assemblyai", "deepgram"] : ["deepgram", "assemblyai"];
  return order.filter((p) => c[p]);
}

/** Transcribe one recording with the preferred provider, falling back to the other. */
export async function transcribe(audio: Buffer, opts: TranscribeOptions = {}): Promise<TranscriptResult> {
  const order = sttOrder(opts.env ?? process.env);
  if (!order.length) throw new Error("Transcription is not configured: set DEEPGRAM_API_KEY or ASSEMBLYAI_API_KEY");
  let firstError: string | undefined;
  for (const p of order) {
    try {
      const r = await CLIENTS[p](audio, opts);
      return firstError ? { ...r, fallback: firstError } : r;
    } catch (e) {
      const msg = String((e as Error).message ?? e).slice(0, 200);
      if (!firstError) firstError = msg;
      console.warn(`[transcription] ${p} failed:`, msg);
    }
  }
  throw new Error(firstError ?? "Transcription failed");
}

// ─── the browser's route ──────────────────────────────────────────────────

/** POST /api/voice/transcribe — one audio segment in the body, { text } back. Signed-in users only. */
export function registerTranscriptionRoute(app: Express) {
  app.post("/api/voice/transcribe", express.raw({ type: () => true, limit: "25mb" }), async (req: Request, res: Response) => {
    try {
      await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "Sign in to transcribe." });
      return;
    }
    if (!sttConfigured().any) {
      res.status(503).json({ error: "Transcription is not configured on this host: set DEEPGRAM_API_KEY or ASSEMBLYAI_API_KEY." });
      return;
    }
    const audio = Buffer.isBuffer(req.body) ? req.body : null;
    if (!audio?.length) {
      res.status(400).json({ error: "No audio in the request body." });
      return;
    }
    try {
      const r = await transcribe(audio, { mimeType: String(req.headers["content-type"] ?? ""), language: String(req.headers["x-language"] ?? "") || undefined });
      res.json({ text: r.text, provider: r.provider, language: r.language ?? null, fallback: r.fallback ?? null });
    } catch (e) {
      res.status(502).json({ error: String((e as Error).message ?? e).slice(0, 200) });
    }
  });
}
