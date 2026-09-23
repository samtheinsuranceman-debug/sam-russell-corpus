// ============================================================
// THE SITE'S VOICE — which voice, on which provider, speaks for the
// advisor.
//
// Resolution order:
//   1. the Voice Studio's pick (site_settings: voice.provider + voice.id)
//   2. the environment: VOICE_PROVIDER=heygen with HEYGEN_VOICE_ID, or
//      HEYGEN_VOICE_NAME resolved against the workspace's private voices;
//      VOICE_PROVIDER=cartesia with CARTESIA_VOICE_ID
//   3. ELEVENLABS_VOICE_ID
//   4. CARTESIA_VOICE_ID (with CARTESIA_API_KEY)
// Every place that speaks asks activeVoice() at call time, so a change
// in the studio takes effect at once, with no redeploy. The settings
// table creates itself on first use.
// ============================================================
import { sql } from "drizzle-orm";
import { getDb } from "./db";

export type VoiceProvider = "elevenlabs" | "heygen" | "cartesia";
export const VOICE_PROVIDERS = ["elevenlabs", "heygen", "cartesia"] as const satisfies readonly VoiceProvider[];

/** The key each provider needs on the host. */
export function providerKeySet(provider: VoiceProvider, env: NodeJS.ProcessEnv = process.env): boolean {
  if (provider === "heygen") return Boolean(env.HEYGEN_API_KEY);
  if (provider === "cartesia") return Boolean(env.CARTESIA_API_KEY);
  return Boolean(env.ELEVENLABS_API_KEY);
}
export type VoiceRef = { provider: VoiceProvider; voiceId: string; name?: string };

const BOOTSTRAP = `CREATE TABLE IF NOT EXISTS \`site_settings\` (
  \`key\` varchar(64) NOT NULL,
  \`value\` text,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`key\`)
)`;

let ready: Promise<boolean> | null = null;
function ensure(): Promise<boolean> {
  if (!ready) {
    ready = (async () => {
      const db = await getDb();
      if (!db) return false;
      await db.execute(sql.raw(BOOTSTRAP));
      return true;
    })().catch((e) => { console.warn("[voice] settings bootstrap failed", String(e).slice(0, 120)); ready = null; return false; });
  }
  return ready;
}

export async function getSiteSetting(key: string): Promise<string | null> {
  if (!(await ensure())) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = (await db.execute(sql`select \`value\` from \`site_settings\` where \`key\` = ${key} limit 1`)) as unknown as Array<Array<{ value: string | null }>> | { rows?: Array<{ value: string | null }> };
  const first = Array.isArray(rows) ? rows[0]?.[0] : (rows as { rows?: Array<{ value: string | null }> }).rows?.[0];
  return first?.value ?? null;
}

export async function setSiteSetting(key: string, value: string | null): Promise<boolean> {
  if (!(await ensure())) return false;
  const db = await getDb();
  if (!db) return false;
  if (value === null) await db.execute(sql`delete from \`site_settings\` where \`key\` = ${key}`);
  else await db.execute(sql`insert into \`site_settings\` (\`key\`, \`value\`) values (${key}, ${value}) on duplicate key update \`value\` = ${value}`);
  return true;
}

const PROVIDER_KEY = "voice.provider";
const ID_KEY = "voice.id";
const LEGACY_KEY = "elevenlabs.voiceId";

let pickCache: { ref: VoiceRef | null; at: number } | null = null;

/** The studio's pick, if any. */
export async function studioVoice(): Promise<VoiceRef | null> {
  if (pickCache && Date.now() - pickCache.at < 30_000) return pickCache.ref;
  let ref: VoiceRef | null = null;
  try {
    const [provider, id, legacy] = await Promise.all([getSiteSetting(PROVIDER_KEY), getSiteSetting(ID_KEY), getSiteSetting(LEGACY_KEY)]);
    if (id && (VOICE_PROVIDERS as readonly string[]).includes(provider ?? "")) ref = { provider: provider as VoiceProvider, voiceId: id };
    else if (legacy) ref = { provider: "elevenlabs", voiceId: legacy };
  } catch { /* no database */ }
  pickCache = { ref, at: Date.now() };
  return ref;
}

/** The environment's voice, when no studio pick exists. */
export async function environmentVoice(env: NodeJS.ProcessEnv = process.env): Promise<VoiceRef | null> {
  const wantHeygen = (env.VOICE_PROVIDER ?? "").toLowerCase() === "heygen" || Boolean(env.HEYGEN_VOICE_ID) || Boolean(env.HEYGEN_VOICE_NAME);
  if (wantHeygen && env.HEYGEN_API_KEY) {
    if (env.HEYGEN_VOICE_ID) return { provider: "heygen", voiceId: env.HEYGEN_VOICE_ID, name: env.HEYGEN_VOICE_NAME };
    if (env.HEYGEN_VOICE_NAME) {
      const { heygenVoiceByName } = await import("./speech");
      const found = await heygenVoiceByName(env.HEYGEN_VOICE_NAME, env);
      if (found) return found;
      console.warn(`[voice] HEYGEN_VOICE_NAME "${env.HEYGEN_VOICE_NAME}" not found among private HeyGen voices; using ElevenLabs`);
    }
  }
  const wantCartesia = (env.VOICE_PROVIDER ?? "").toLowerCase() === "cartesia";
  if (wantCartesia && env.CARTESIA_API_KEY && env.CARTESIA_VOICE_ID) return { provider: "cartesia", voiceId: env.CARTESIA_VOICE_ID };
  if (env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID) return { provider: "elevenlabs", voiceId: env.ELEVENLABS_VOICE_ID };
  if (env.CARTESIA_API_KEY && env.CARTESIA_VOICE_ID) return { provider: "cartesia", voiceId: env.CARTESIA_VOICE_ID };
  return null;
}

/** The voice the site speaks with right now. */
export async function activeVoice(env: NodeJS.ProcessEnv = process.env): Promise<VoiceRef | null> {
  const picked = await studioVoice();
  if (picked) return picked;
  return environmentVoice(env);
}

/** Back-compat: the active voice id regardless of provider. */
export async function activeVoiceId(): Promise<string | null> {
  return (await activeVoice())?.voiceId ?? null;
}

export async function setActiveVoice(ref: VoiceRef | null): Promise<boolean> {
  const ok = ref
    ? (await setSiteSetting(PROVIDER_KEY, ref.provider)) && (await setSiteSetting(ID_KEY, ref.voiceId))
    : (await setSiteSetting(PROVIDER_KEY, null)) && (await setSiteSetting(ID_KEY, null)) && (await setSiteSetting(LEGACY_KEY, null));
  pickCache = { ref, at: Date.now() };
  return ok;
}

/** Back-compat for callers that only know ElevenLabs ids. */
export async function setActiveVoiceId(id: string | null): Promise<boolean> {
  return setActiveVoice(id ? { provider: "elevenlabs", voiceId: id } : null);
}

export async function voiceOutConfigured(env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const ref = await activeVoice(env);
  if (!ref) return false;
  return providerKeySet(ref.provider, env);
}

/** Where the active voice came from, for the studio's status line. */
export async function voiceSource(): Promise<"studio" | "environment" | "none"> {
  if (await studioVoice()) return "studio";
  return (await environmentVoice()) ? "environment" : "none";
}
