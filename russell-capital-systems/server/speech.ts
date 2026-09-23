// ============================================================
// SPEECH — one synthesize() for the whole site, three providers.
//
//   heygen      the owner's HeyGen voice clones ("Best Voice clone Sam
//               Russell" and the rest), through POST /v3/voices/speech
//               (instant clones, Starfish engine) with a fallback to
//               POST /v3/models/audio/tts (professional clones).
//   elevenlabs  the ElevenLabs workspace voices.
//   cartesia    Cartesia Sonic, POST /tts/bytes (CARTESIA_API_KEY; the
//               voice is CARTESIA_VOICE_ID, else the workspace's own
//               first voice, else the first English stock voice).
//
// Which voice speaks is decided by activeVoice() in voiceSettings.ts:
// the Voice Studio's pick, then the environment (VOICE_PROVIDER=heygen
// with HEYGEN_VOICE_ID or HEYGEN_VOICE_NAME, VOICE_PROVIDER=cartesia with
// CARTESIA_VOICE_ID, else ELEVENLABS_VOICE_ID).
// When the active provider fails for a line, the line is spoken by the
// next one configured (ElevenLabs, then Cartesia) rather than not at all;
// the result says which, and why.
// ============================================================
import { activeVoice, type VoiceRef } from "./voiceSettings";

export type SpeechResult = { audio: Buffer; mimeType: string; via: VoiceRef["provider"]; voiceId: string; fallback?: string };

const HEYGEN = "https://api.heygen.com";

export type HeygenVoice = { voice_id: string; name: string; language?: string; gender?: string; type?: string; preview_audio_url?: string | null; support_pause?: boolean; engine?: string };

/** The workspace's private (cloned) HeyGen voices, every page. */
export async function listHeygenVoices(kind: "private" | "public" = "private", env = process.env): Promise<HeygenVoice[]> {
  const key = env.HEYGEN_API_KEY;
  if (!key) return [];
  const out: HeygenVoice[] = [];
  let token = "";
  for (let page = 0; page < 10; page++) {
    const res = await fetch(`${HEYGEN}/v3/voices?type=${kind}&limit=100${token ? `&token=${encodeURIComponent(token)}` : ""}`, { headers: { "x-api-key": key }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HeyGen voice list failed (HTTP ${res.status})`);
    const body = (await res.json()) as { data?: HeygenVoice[] | { voices?: HeygenVoice[] }; has_more?: boolean; next_token?: string };
    const list = Array.isArray(body.data) ? body.data : body.data?.voices ?? [];
    out.push(...list);
    if (!body.has_more || !body.next_token) break;
    token = body.next_token;
  }
  return out;
}

let nameCache: { name: string; ref: VoiceRef | null; at: number } | null = null;

/** Find a HeyGen private voice by (case-insensitive, trimmed) name; cached ten minutes. */
export async function heygenVoiceByName(name: string, env = process.env): Promise<VoiceRef | null> {
  const wanted = name.trim().toLowerCase();
  if (nameCache && nameCache.name === wanted && Date.now() - nameCache.at < 10 * 60_000) return nameCache.ref;
  let ref: VoiceRef | null = null;
  try {
    const voices = await listHeygenVoices("private", env);
    const hit = voices.find((v) => v.name.trim().toLowerCase() === wanted) ?? voices.find((v) => v.name.trim().toLowerCase().includes(wanted));
    if (hit) ref = { provider: "heygen", voiceId: hit.voice_id, name: hit.name };
  } catch (e) {
    console.warn("[speech] HeyGen name lookup failed", String(e).slice(0, 120));
  }
  nameCache = { name: wanted, ref, at: Date.now() };
  return ref;
}

async function heygenSpeak(voiceId: string, text: string, env = process.env): Promise<Buffer> {
  const key = env.HEYGEN_API_KEY;
  if (!key) throw new Error("HEYGEN_API_KEY is not set");
  const headers = { "content-type": "application/json", "x-api-key": key };
  const attempts: Array<{ url: string; body: Record<string, unknown> }> = [
    { url: `${HEYGEN}/v3/voices/speech`, body: { text, voice_id: voiceId } },
    { url: `${HEYGEN}/v3/models/audio/tts`, body: { text, voice_id: voiceId } },
  ];
  let lastErr = "";
  for (const a of attempts) {
    const res = await fetch(a.url, { method: "POST", headers, body: JSON.stringify(a.body), signal: AbortSignal.timeout(60_000) });
    const json = (await res.json().catch(() => ({}))) as { data?: { audio_url?: string; url?: string }; error?: { message?: string } | string; message?: string };
    const audioUrl = json.data?.audio_url ?? json.data?.url;
    if (res.ok && audioUrl) {
      const audio = await fetch(audioUrl, { signal: AbortSignal.timeout(60_000) });
      if (!audio.ok) throw new Error(`HeyGen audio download failed (HTTP ${audio.status})`);
      return Buffer.from(await audio.arrayBuffer());
    }
    lastErr = `HTTP ${res.status}${typeof json.error === "string" ? `: ${json.error}` : json.error?.message ? `: ${json.error.message}` : json.message ? `: ${json.message}` : ""}`;
  }
  throw new Error(`HeyGen speech failed (${lastErr})`);
}

async function elevenSpeak(voiceId: string, text: string, env = process.env): Promise<Buffer> {
  const key = env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: { "content-type": "application/json", "xi-api-key": key, accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`ElevenLabs speech failed (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Cartesia ────────────────────────────────────────────────────────────

const CARTESIA = "https://api.cartesia.ai";
/** Cartesia pins request shapes by date; the calls below follow this version of the API reference. */
export const CARTESIA_VERSION = "2026-08-14";
/** Sonic 3.6, Cartesia's current generally available model; CARTESIA_MODEL overrides it. */
export const CARTESIA_DEFAULT_MODEL = "sonic-3.6";

export type CartesiaVoice = { id: string; name: string; description?: string | null; language?: string; gender?: string | null; is_owner?: boolean };

function cartesiaKey(env: NodeJS.ProcessEnv): string {
  const key = env.CARTESIA_API_KEY?.trim();
  if (!key) throw new Error("Cartesia is not configured: CARTESIA_API_KEY is not set");
  return key;
}

const cartesiaHeaders = (key: string): Record<string, string> => ({ authorization: `Bearer ${key}`, "cartesia-version": CARTESIA_VERSION });

/** Voices the key can use: the workspace's own when `owned`, else the whole library (first page). */
export async function listCartesiaVoices(opts: { owned?: boolean; limit?: number } = {}, env = process.env): Promise<CartesiaVoice[]> {
  const key = cartesiaKey(env);
  const q = new URLSearchParams({ limit: String(opts.limit ?? 100) });
  if (opts.owned) q.set("is_owner", "true");
  const res = await fetch(`${CARTESIA}/voices?${q}`, { headers: cartesiaHeaders(key), signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Cartesia voice list failed (HTTP ${res.status})`);
  const body = (await res.json()) as { data?: CartesiaVoice[] };
  return body.data ?? [];
}

export async function cartesiaSpeak(voiceId: string, text: string, env = process.env): Promise<Buffer> {
  const key = cartesiaKey(env);
  const res = await fetch(`${CARTESIA}/tts/bytes`, {
    method: "POST",
    headers: { ...cartesiaHeaders(key), "content-type": "application/json" },
    body: JSON.stringify({
      model_id: env.CARTESIA_MODEL?.trim() || CARTESIA_DEFAULT_MODEL,
      transcript: text,
      voice: voiceId,
      language: "en",
      output_format: { container: "mp3", sample_rate: 44100, bit_rate: 128000 },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Cartesia speech failed (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

let cartesiaPick: { ref: VoiceRef | null; at: number } | null = null;

/** The Cartesia voice a fallback line is spoken in: CARTESIA_VOICE_ID, else the workspace's own, else a stock English voice. Cached ten minutes. */
export async function cartesiaFallbackVoice(env = process.env): Promise<VoiceRef | null> {
  if (!env.CARTESIA_API_KEY) return null;
  if (env.CARTESIA_VOICE_ID) return { provider: "cartesia", voiceId: env.CARTESIA_VOICE_ID };
  if (cartesiaPick && Date.now() - cartesiaPick.at < 10 * 60_000) return cartesiaPick.ref;
  let ref: VoiceRef | null = null;
  try {
    const own = await listCartesiaVoices({ owned: true, limit: 10 }, env);
    const pick = own[0] ?? (await listCartesiaVoices({ limit: 100 }, env)).find((v) => (v.language ?? "en").startsWith("en"));
    if (pick) ref = { provider: "cartesia", voiceId: pick.id, name: pick.name };
  } catch (e) {
    console.warn("[speech] Cartesia voice lookup failed", String(e).slice(0, 120));
  }
  cartesiaPick = { ref, at: Date.now() };
  return ref;
}

/** Test hook: forget the cached Cartesia voice. */
export function _resetCartesiaVoiceCache() { cartesiaPick = null; }

// ─── one line, any provider ──────────────────────────────────────────────

/** Speak a line in a specific voice. */
export async function synthesizeWith(ref: VoiceRef, text: string, env = process.env): Promise<SpeechResult> {
  const clean = text.trim().slice(0, 4000);
  if (ref.provider === "heygen") return { audio: await heygenSpeak(ref.voiceId, clean, env), mimeType: "audio/mpeg", via: "heygen", voiceId: ref.voiceId };
  if (ref.provider === "cartesia") return { audio: await cartesiaSpeak(ref.voiceId, clean, env), mimeType: "audio/mpeg", via: "cartesia", voiceId: ref.voiceId };
  return { audio: await elevenSpeak(ref.voiceId, clean, env), mimeType: "audio/mpeg", via: "elevenlabs", voiceId: ref.voiceId };
}

/** Who speaks when the active voice fails, in order: ElevenLabs, then Cartesia, never the provider that just failed. */
function fallbackChain(failed: VoiceRef["provider"], env: NodeJS.ProcessEnv): Array<() => Promise<VoiceRef | null>> {
  const chain: Array<() => Promise<VoiceRef | null>> = [];
  if (failed !== "elevenlabs" && env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID) chain.push(async () => ({ provider: "elevenlabs", voiceId: env.ELEVENLABS_VOICE_ID! }));
  if (failed !== "cartesia" && env.CARTESIA_API_KEY) chain.push(() => cartesiaFallbackVoice(env));
  return chain;
}

/** Speak a line in the site's voice, falling back to the next configured provider when the active one refuses the line. */
export async function synthesize(text: string, env = process.env): Promise<SpeechResult | null> {
  const ref = await activeVoice(env);
  if (!ref) return null;
  try {
    return await synthesizeWith(ref, text, env);
  } catch (e) {
    const reason = String((e as Error).message ?? e).slice(0, 160);
    for (const next of fallbackChain(ref.provider, env)) {
      const alt = await next();
      if (!alt) continue;
      try {
        const r = await synthesizeWith(alt, text, env);
        console.warn(`[speech] ${ref.provider} failed, ${alt.provider} spoke instead:`, reason);
        return { ...r, fallback: reason };
      } catch (e2) {
        console.warn(`[speech] fallback ${alt.provider} failed too:`, String((e2 as Error).message ?? e2).slice(0, 160));
      }
    }
    throw e;
  }
}
