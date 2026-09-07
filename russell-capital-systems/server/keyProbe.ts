// ============================================================
// KEY PROBE — does each key in the host's environment panel actually work?
// One cheap, read-only call per provider (a models list, a domains list, a
// one-row FRED read); the result is a status word per provider, cached for
// ten minutes so the endpoint cannot be used to run up a bill. Nothing
// about the key itself is ever returned, only whether the provider
// accepted it.
// ============================================================
import { fetchFredObservations, fredMode } from "./_core/fred";
import { anthropicHeaders } from "./_core/anthropic";

export type ProbeStatus = "ok" | "rejected" | "missing" | "error";
export type ProbeResult = { id: string; label: string; envKey: string; configured: boolean; status: ProbeStatus; httpStatus: number | null; note: string };

type Fetcher = (url: string, init: { headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; text?: () => Promise<string> }>;
const realFetch: Fetcher = (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(12_000) });

/** The provider's own explanation of a refusal, trimmed and stripped of anything key-shaped, so the note says why without saying what. */
export function safeReason(body: string, key: string): string {
  let s = body.replace(/\s+/g, " ").trim();
  try { const j = JSON.parse(body) as { error?: { type?: string; message?: string } }; if (j.error?.type || j.error?.message) s = `${j.error.type ?? ""}: ${j.error.message ?? ""}`.replace(/^: /, ""); } catch { /* not JSON */ }
  if (key) s = s.split(key).join("[key]");
  s = s.replace(/sk-[A-Za-z0-9_-]{8,}/g, "[key]").replace(/re_[A-Za-z0-9_-]{8,}/g, "[key]");
  return s.slice(0, 200);
}
let _fetch: Fetcher = realFetch;
export function _setFetchForTests(f: Fetcher | null) { _fetch = f ?? realFetch; }

const PROBES: Array<{ id: string; label: string; envKey: string; url: string; headers: (k: string, env: NodeJS.ProcessEnv) => Record<string, string> }> = [
  { id: "anthropic", label: "Claude (Anthropic)", envKey: "ANTHROPIC_API_KEY", url: "https://api.anthropic.com/v1/models", headers: (k, env) => anthropicHeaders(k, env) },
  { id: "openai", label: "ChatGPT (OpenAI)", envKey: "OPENAI_API_KEY", url: "https://api.openai.com/v1/models", headers: (k) => ({ authorization: `Bearer ${k}` }) },
  { id: "heygen", label: "HeyGen", envKey: "HEYGEN_API_KEY", url: "https://api.heygen.com/v2/user/remaining_quota", headers: (k) => ({ "x-api-key": k }) },
  { id: "resend", label: "Resend (email)", envKey: "RESEND_API_KEY", url: "https://api.resend.com/domains", headers: (k) => ({ authorization: `Bearer ${k}` }) },
];

function classify(status: number): { status: ProbeStatus; note: string } {
  if (status >= 200 && status < 300) return { status: "ok", note: "The provider accepted the key." };
  if (status === 401 || status === 403) return { status: "rejected", note: "The provider refused the key: it is wrong, revoked, or pasted with a stray character. Create a new one and paste it into the Value box under this exact name." };
  if (status === 429) return { status: "ok", note: "The key is valid but the provider is rate-limiting right now." };
  return { status: "error", note: `The provider answered ${status}; try again in a minute.` };
}

export async function probeOne(p: (typeof PROBES)[number], env: NodeJS.ProcessEnv): Promise<ProbeResult> {
  const key = env[p.envKey];
  const base = { id: p.id, label: p.label, envKey: p.envKey };
  if (!key) return { ...base, configured: false, status: "missing", httpStatus: null, note: `No variable named ${p.envKey} on this host. Add it in the environment panel with the key in the Value box.` };
  try {
    const res = await _fetch(p.url, { headers: p.headers(key, env) });
    const c = classify(res.status);
    if (c.status !== "ok" && res.text) {
      const reason = safeReason(await res.text().catch(() => ""), key);
      if (reason) c.note = `${c.note} The provider said: ${reason}`;
    }
    return { ...base, configured: true, httpStatus: res.status, ...c };
  } catch (e) {
    return { ...base, configured: true, status: "error", httpStatus: null, note: `Could not reach the provider: ${(e as Error).message}` };
  }
}

export async function probeFred(env: NodeJS.ProcessEnv): Promise<ProbeResult> {
  const mode = fredMode(env);
  const base = { id: "fred", label: "FRED (St. Louis Fed)", envKey: "FRED_API_KEY", configured: mode === "api" };
  try {
    const obs = await fetchFredObservations("CPIAUCSL", 1, env);
    if (obs.length) return { ...base, status: "ok", httpStatus: 200, note: mode === "api" ? `The keyed JSON API answered; CPI as of ${obs[0]!.date}.` : `Keyless CSV mode answered; CPI as of ${obs[0]!.date}. A FRED_API_KEY is optional and only lifts the rate limit.` };
    return { ...base, status: "error", httpStatus: null, note: "FRED answered with no rows." };
  } catch (e) {
    const msg = (e as Error).message;
    return { ...base, status: /400|401|403/.test(msg) && mode === "api" ? "rejected" : "error", httpStatus: null, note: msg };
  }
}

let cache: { at: number; results: ProbeResult[] } | null = null;
export const PROBE_TTL_MS = 10 * 60_000;

/** Every provider's status, cached ten minutes. Never returns a key. */
export async function probeKeys(env: NodeJS.ProcessEnv = process.env, now = Date.now()): Promise<{ checkedAt: string; results: ProbeResult[] }> {
  if (cache && now - cache.at < PROBE_TTL_MS) return { checkedAt: new Date(cache.at).toISOString(), results: cache.results };
  const results = await Promise.all([...PROBES.map((p) => probeOne(p, env)), probeFred(env)]);
  cache = { at: now, results };
  return { checkedAt: new Date(now).toISOString(), results };
}
export function _resetProbeCacheForTests() { cache = null; }
