/**
 * API origin and session bridge for the static front door.
 *
 * When this bundle is served from https://russellcapitalsystems.com (GitHub
 * Pages) it is built with VITE_API_ORIGIN pointing at the Railway app, and
 * every `/api/...` call goes there with credentials. Browsers that refuse
 * third-party cookies (Safari, and any browser with them switched off) would
 * lose the session, so the server mirrors each cookie it sets into an
 * `X-Set-Session` response header; this module keeps those values in
 * localStorage and sends them back as `X-Session` (or `_session` on an
 * EventSource URL). Served same-origin, with no VITE_API_ORIGIN, all of this
 * is inert and `apiFetch` is a plain `fetch` with credentials.
 */

export const API_ORIGIN = String(import.meta.env.VITE_API_ORIGIN ?? "").trim().replace(/\/$/, "");
export const CROSS_SITE = !!API_ORIGIN && typeof location !== "undefined" && API_ORIGIN !== location.origin;

const STORAGE_KEY = "rcs.session.v1";

function load(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function save(store: Record<string, string>) {
  try {
    if (Object.keys(store).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable */ }
}

/** "name=value; name2=value2" with values URL-encoded, or "" when nothing is stored. */
export function sessionHeaderValue(): string {
  return Object.entries(load()).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; ");
}

export function clearBridgedSession() {
  save({});
}

function absorb(res: Response) {
  if (!CROSS_SITE) return;
  const set = res.headers.get("x-set-session");
  const clear = res.headers.get("x-clear-session");
  if (!set && !clear) return;
  const store = load();
  for (const part of (set ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    const name = part.slice(0, i).trim();
    let value = part.slice(i + 1).trim();
    try { value = decodeURIComponent(value); } catch { /* keep raw */ }
    if (name) store[name] = value;
  }
  for (const name of (clear ?? "").split(";").map(s => s.trim()).filter(Boolean)) delete store[name];
  save(store);
}

/** Prefix an `/api` path with the API origin when one is configured. */
export function apiUrl(path: string): string {
  return API_ORIGIN && path.startsWith("/api") ? `${API_ORIGIN}${path}` : path;
}

/** An EventSource cannot carry headers, so the bridged session rides the URL. */
export function eventsUrl(path: string): string {
  const url = apiUrl(path);
  if (!CROSS_SITE) return url;
  const s = sessionHeaderValue();
  if (!s) return url;
  return `${url}${url.includes("?") ? "&" : "?"}_session=${encodeURIComponent(s)}`;
}

/** `fetch` for API calls: origin-aware, always with credentials, session-bridged when cross-site. */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const target = typeof input === "string" ? apiUrl(input) : input;
  const headers = new Headers(init.headers ?? {});
  if (CROSS_SITE) {
    const s = sessionHeaderValue();
    if (s) headers.set("X-Session", s);
  }
  const res = await fetch(target, { ...init, headers, credentials: "include" });
  absorb(res);
  return res;
}
