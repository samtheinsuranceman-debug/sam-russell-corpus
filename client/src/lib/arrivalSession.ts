// ============================================================
// ARRIVAL SESSION — which skin this browser session wears, and the owner preview.
//
// One arrival per browser session: the first time the arrival field mounts in a
// tab session it asks the server (arrival.begin), which advances the household's
// history. Reloads in the same session reuse the answer from sessionStorage, so a
// refresh does not burn a skin. If the server cannot answer, the browser's own
// history in localStorage runs the same picker (same seed), so the 7-session rule
// still holds on this device.
// ============================================================
import {
  EMPTY_HISTORY,
  SKIN_REGISTRY,
  selectSkin,
  signatureSeedFor,
  skinById,
  userSkinSeed,
  type ArrivalSkin,
  type SkinHistory,
} from "@shared/arrivalSkins";

export const SESSION_KEY = "rcs-arrival-session";
export const LOCAL_HISTORY_KEY = "rcs-arrival-history";
export const OWNER_PREVIEW_KEY = "rcs-arrival-preview";

export interface ArrivalSession {
  skin: ArrivalSkin;
  sessionNumber: number;
  signatureSeed: number;
  houseVoicing: string[];
  stored: "database" | "memory" | "browser";
}

type Stored = { userId: number; skinId: string; sessionNumber: number; signatureSeed: number; houseVoicing: string[]; stored: ArrivalSession["stored"] };

function readJson<T>(store: Storage | undefined, key: string): T | null {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(store: Storage | undefined, key: string, value: unknown): void {
  try { store?.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

const session = () => (typeof window === "undefined" ? undefined : window.sessionStorage);
const local = () => (typeof window === "undefined" ? undefined : window.localStorage);

/** This tab session's arrival, if one was already begun for this user. */
export function cachedArrival(userId: number): ArrivalSession | null {
  const s = readJson<Stored>(session(), SESSION_KEY);
  if (!s || s.userId !== userId) return null;
  const skin = skinById(SKIN_REGISTRY, s.skinId);
  if (!skin) return null;
  return { skin, sessionNumber: s.sessionNumber, signatureSeed: s.signatureSeed, houseVoicing: s.houseVoicing, stored: s.stored };
}

function remember(userId: number, a: ArrivalSession): void {
  writeJson(session(), SESSION_KEY, { userId, skinId: a.skin.id, sessionNumber: a.sessionNumber, signatureSeed: a.signatureSeed, houseVoicing: a.houseVoicing, stored: a.stored } satisfies Stored);
  // Mirror into the device history so the fallback continues from the server's count.
  const all = readJson<Record<string, SkinHistory>>(local(), LOCAL_HISTORY_KEY) ?? {};
  const prev = all[String(userId)] ?? EMPTY_HISTORY;
  all[String(userId)] = { sessionCount: Math.max(prev.sessionCount, a.sessionNumber), recent: [...prev.recent, a.skin.id].slice(-64) };
  writeJson(local(), LOCAL_HISTORY_KEY, all);
}

/** The browser-only pick, used when the server cannot answer. */
export function localArrival(userId: number): ArrivalSession {
  const all = readJson<Record<string, SkinHistory>>(local(), LOCAL_HISTORY_KEY) ?? {};
  const history = all[String(userId)] ?? EMPTY_HISTORY;
  const pick = selectSkin(SKIN_REGISTRY, userSkinSeed(userId), history);
  all[String(userId)] = pick.history;
  writeJson(local(), LOCAL_HISTORY_KEY, all);
  const a: ArrivalSession = { skin: pick.skin, sessionNumber: pick.sessionNumber, signatureSeed: signatureSeedFor(userId), houseVoicing: SKIN_REGISTRY.houseVoicing, stored: "browser" };
  writeJson(session(), SESSION_KEY, { userId, skinId: a.skin.id, sessionNumber: a.sessionNumber, signatureSeed: a.signatureSeed, houseVoicing: a.houseVoicing, stored: a.stored } satisfies Stored);
  return a;
}

/** Record the server's answer for this session. */
export function acceptServerArrival(userId: number, r: { skin: ArrivalSkin; sessionNumber: number; signatureSeed: number; houseVoicing: string[]; stored: "database" | "memory" }): ArrivalSession {
  // Prefer the roster entry the client ships (same JSON); fall back to what the server sent.
  const skin = skinById(SKIN_REGISTRY, r.skin.id) ?? r.skin;
  const a: ArrivalSession = { skin, sessionNumber: r.sessionNumber, signatureSeed: r.signatureSeed, houseVoicing: r.houseVoicing, stored: r.stored };
  remember(userId, a);
  return a;
}

export function readOwnerPreview(): boolean {
  try { return local()?.getItem(OWNER_PREVIEW_KEY) === "on"; } catch { return false; }
}

export function writeOwnerPreview(on: boolean): void {
  try { local()?.setItem(OWNER_PREVIEW_KEY, on ? "on" : "off"); } catch { /* private mode */ }
}
