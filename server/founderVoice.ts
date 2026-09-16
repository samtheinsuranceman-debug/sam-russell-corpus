// The founder's message, read in the owner's cloned voice.
//
// GET /api/founder-message.mp3 → audio/mpeg when ELEVENLABS_API_KEY and
// ELEVENLABS_VOICE_ID are set in the host environment; 404 otherwise, so the
// homepage player stays hidden. The synthesis is done once per process and
// cached in memory (the text lives in shared/homeManifesto.json).
import { activeVoice, voiceOutConfigured } from "./voiceSettings";
import { synthesize as speak } from "./speech";
import type { Express, Request, Response } from "express";
import { createHash } from "node:crypto";
import manifesto from "../shared/homeManifesto.json";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// A pre-rendered copy of the same message, committed to client/public so the
// homepage player works even when live synthesis is unavailable.
let staticCache: Buffer | null | undefined;
function staticFounderAudio(): Buffer | null {
  if (staticCache !== undefined) return staticCache;
  staticCache = null;
  for (const dir of [path.resolve(import.meta.dirname, "public"), path.resolve(import.meta.dirname, "..", "client", "public")]) {
    const file = path.join(dir, "founder-message.mp3");
    if (existsSync(file)) { staticCache = readFileSync(file); break; }
  }
  return staticCache;
}

let cache: { key: string; audio: Buffer } | null = null;
let inflight: Promise<Buffer | null> | null = null;

async function configured() {
  return voiceOutConfigured();
}

async function synthesizeFounder(text: string): Promise<Buffer | null> {
  try {
    const r = await speak(text);
    return r?.audio ?? null;
  } catch {
    return null;
  }
}

export async function founderMessageAudio(): Promise<Buffer | null> {
  if (!(await configured())) return null;
  const text = manifesto.founderMessage;
  const v = await activeVoice();
  const key = createHash("sha256").update(`${v?.provider}:${v?.voiceId}\n${text}`).digest("hex");
  if (cache?.key === key) return cache.audio;
  if (!inflight) {
    inflight = synthesizeFounder(text).then((audio) => {
      if (audio) cache = { key, audio };
      inflight = null;
      return audio;
    });
  }
  return inflight;
}

export function registerFounderVoice(app: Express) {
  app.get("/api/founder-message.mp3", async (_req: Request, res: Response) => {
    const audio = staticFounderAudio() ?? (await founderMessageAudio());
    if (!audio) { res.status(404).type("text/plain").send("Founder message not configured."); return; }
    res.setHeader("content-type", "audio/mpeg");
    res.setHeader("cache-control", "public, max-age=86400");
    res.setHeader("content-length", String(audio.length));
    res.end(audio);
  });
}
