// ============================================================
// MEDIA AND DATA KEYS ON THE HOST — the non-chat services the Brain Hub's
// "Test the Railway keys" button also checks: voice, transcription, video,
// embeddings and the vector store.
//
// Each check is one cheap call that proves the key (a voices, projects,
// organization or credits read; Voyage has no read endpoint, so it embeds
// the single word "ping"). Only the variable's name and the outcome are
// returned, never the key.
// ============================================================
import { CARTESIA_VERSION } from "./speech";
import { RUNWAY_VERSION } from "./videoGen";
import { PINECONE_API_VERSION } from "./pinecone";
import { VOYAGE_DEFAULT_MODEL } from "./voyage";

type Check = { url: string; method?: "POST"; body?: string; headers: (key: string) => Record<string, string> };

export type MediaService = { id: string; name: string; envNames: string[]; check: Check };

export const MEDIA_SERVICES: MediaService[] = [
  { id: "cartesia", name: "Cartesia (text to speech)", envNames: ["CARTESIA_API_KEY"], check: { url: "https://api.cartesia.ai/voices?limit=1", headers: (k) => ({ authorization: `Bearer ${k}`, "cartesia-version": CARTESIA_VERSION }) } },
  { id: "deepgram", name: "Deepgram (speech to text)", envNames: ["DEEPGRAM_API_KEY"], check: { url: "https://api.deepgram.com/v1/projects", headers: (k) => ({ authorization: `Token ${k}` }) } },
  { id: "assemblyai", name: "AssemblyAI (speech to text)", envNames: ["ASSEMBLYAI_API_KEY"], check: { url: "https://api.assemblyai.com/v2/transcript?limit=1", headers: (k) => ({ authorization: k }) } },
  { id: "runway", name: "Runway (video)", envNames: ["RUNWAYML_API_SECRET", "RUNWAY_API_KEY"], check: { url: "https://api.dev.runwayml.com/v1/organization", headers: (k) => ({ authorization: `Bearer ${k}`, "x-runway-version": RUNWAY_VERSION }) } },
  { id: "luma", name: "Luma AI (video)", envNames: ["LUMAAI_API_KEY", "LUMA_API_KEY"], check: { url: "https://api.lumalabs.ai/dream-machine/v1/credits", headers: (k) => ({ authorization: `Bearer ${k}` }) } },
  {
    id: "voyage", name: "Voyage AI (embeddings)", envNames: ["VOYAGE_API_KEY"],
    check: { url: "https://api.voyageai.com/v1/embeddings", method: "POST", body: JSON.stringify({ input: ["ping"], model: VOYAGE_DEFAULT_MODEL }), headers: (k) => ({ authorization: `Bearer ${k}`, "content-type": "application/json" }) },
  },
  { id: "pinecone", name: "Pinecone (vector store)", envNames: ["PINECONE_API_KEY"], check: { url: "https://api.pinecone.io/indexes", headers: (k) => ({ "api-key": k, "x-pinecone-api-version": PINECONE_API_VERSION }) } },
];

/** The variable that keys a service on this host, in precedence order, or null. */
export function mediaEnvName(s: MediaService, env: NodeJS.ProcessEnv = process.env): string | null {
  return s.envNames.find((n) => env[n]?.trim()) ?? null;
}

/** Services keyed on this host: id, display name and the variable's name. */
export function mediaFromEnvironment(env: NodeJS.ProcessEnv = process.env): Array<{ id: string; name: string; envName: string }> {
  return MEDIA_SERVICES.flatMap((s) => {
    const envName = mediaEnvName(s, env);
    return envName ? [{ id: s.id, name: s.name, envName }] : [];
  });
}

export type MediaKeyTest = { providerId: string; envName: string; model: string; ok: boolean; message: string; latencyMs?: number };

export async function testMediaKey(s: MediaService, env: NodeJS.ProcessEnv = process.env): Promise<MediaKeyTest | null> {
  const envName = mediaEnvName(s, env);
  if (!envName) return null;
  const key = env[envName]!.trim();
  const started = Date.now();
  try {
    const res = await fetch(s.check.url, { method: s.check.method ?? "GET", headers: s.check.headers(key), body: s.check.body, signal: AbortSignal.timeout(15_000) });
    const latencyMs = Date.now() - started;
    if (res.ok) return { providerId: s.id, envName, model: "", ok: true, message: `Key accepted in ${latencyMs}ms`, latencyMs };
    if (res.status === 401 || res.status === 403) return { providerId: s.id, envName, model: "", ok: false, message: `Refused the key (HTTP ${res.status}): wrong, revoked, or pasted with a stray character.` };
    if (res.status === 429) return { providerId: s.id, envName, model: "", ok: true, message: "Key accepted; the service is rate-limiting right now.", latencyMs };
    return { providerId: s.id, envName, model: "", ok: false, message: `The service answered HTTP ${res.status}; try again in a minute.` };
  } catch (e) {
    return { providerId: s.id, envName, model: "", ok: false, message: `Could not reach the service: ${String((e as Error).message ?? e).slice(0, 160)}` };
  }
}

/** One check per keyed service, in parallel. Never returns a key. */
export async function testMediaKeys(env: NodeJS.ProcessEnv = process.env): Promise<MediaKeyTest[]> {
  const results = await Promise.all(MEDIA_SERVICES.map((s) => testMediaKey(s, env)));
  return results.filter((r): r is MediaKeyTest => r !== null);
}
