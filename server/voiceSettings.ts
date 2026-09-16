// ============================================================
// THE SITE'S VOICE — which ElevenLabs voice speaks for the advisor.
//
// Resolution order: the voice the owner picked in the Voice Studio
// (stored in site_settings), then ELEVENLABS_VOICE_ID from the host's
// environment. Every place that speaks (ultra.speak, the founder message,
// the journey guides) asks activeVoiceId() instead of reading the
// environment, so a change in the studio takes effect at once, with no
// redeploy. The table creates itself on first use.
// ============================================================
import { sql } from "drizzle-orm";
import { getDb } from "./db";

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

const VOICE_KEY = "elevenlabs.voiceId";
let voiceCache: { id: string | null; at: number } | null = null;

/** The voice the site speaks with right now: the studio's pick, else the environment's. */
export async function activeVoiceId(): Promise<string | null> {
  if (voiceCache && Date.now() - voiceCache.at < 30_000) return voiceCache.id ?? (process.env.ELEVENLABS_VOICE_ID ?? null);
  const picked = await getSiteSetting(VOICE_KEY).catch(() => null);
  voiceCache = { id: picked, at: Date.now() };
  return picked ?? process.env.ELEVENLABS_VOICE_ID ?? null;
}

export async function setActiveVoiceId(id: string | null): Promise<boolean> {
  const ok = await setSiteSetting(VOICE_KEY, id);
  voiceCache = { id, at: Date.now() };
  return ok;
}

export async function voiceOutConfigured(): Promise<boolean> {
  return Boolean(process.env.ELEVENLABS_API_KEY && (await activeVoiceId()));
}

/** Where the active id came from, for the studio's status line. */
export async function voiceSource(): Promise<"studio" | "environment" | "none"> {
  const picked = await getSiteSetting(VOICE_KEY).catch(() => null);
  if (picked) return "studio";
  return process.env.ELEVENLABS_VOICE_ID ? "environment" : "none";
}
