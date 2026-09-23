// ============================================================
// ARRIVAL SKINS — which look the signed-in arrival field wears this session.
//
// RCS-AUDIO-SKINS-VALUE.md section 2: on each return, pick a skin the household has
// not seen in its last 7 sessions; recycle after the full roster. Each skin is a
// background family + filament colour + ink + optional still set + one C-major
// voicing. The roster lives in shared/arrivalSkins.json so skins (and, later,
// real stills from /files/...) are added without touching code.
//
// Pure and deterministic: the pick is a function of (user seed, session number,
// history). No unseeded randomness: the draw is mulberry32 seeded from an FNV-1a hash.
// ============================================================
import registryJson from "./arrivalSkins.json";
import { mulberry32 } from "./macro/random";

export interface SkinStill {
  /** Served by the firm's own storage: /files/{key} (server/storage.ts FILE_URL_PREFIX). */
  url: string;
  alt: string;
}

export interface ArrivalSkin {
  id: string;
  name: string;
  family: string;
  field: string;
  filament: string;
  ink: string;
  /** Note names in C major (white keys only), e.g. ["C4", "E4", "G4"]. */
  voicing: string[];
  stills: SkinStill[];
  /** Where the colours come from in the specs. */
  source: string;
}

export interface SkinRegistry {
  version: number;
  recentWindow: number;
  houseVoicing: string[];
  skins: ArrivalSkin[];
}

/** What is persisted per user: the number of sessions so far and the recent picks, most recent last. */
export interface SkinHistory {
  sessionCount: number;
  recent: string[];
}

export const EMPTY_HISTORY: SkinHistory = { sessionCount: 0, recent: [] };

/** The prefix the firm's storage proxy serves uploads under (mirrors server/storage.ts). */
export const STILL_URL_PREFIX = "/files/";

const HEX = /^#[0-9A-Fa-f]{6}$/;
const NOTE = /^([A-G])([0-8])$/;
const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** MIDI number of a natural (C-major) note name such as "C4" (60) or "A3" (57). Throws on sharps, flats or junk. */
export function noteToMidi(note: string): number {
  const m = NOTE.exec(note.trim());
  if (!m) throw new Error(`not a C-major note name: ${note}`);
  return 12 * (Number(m[2]) + 1) + SEMITONE[m[1]];
}

/** Equal temperament, A4 = 440 Hz. */
export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** FNV-1a, 32-bit. Stable across server and browser; used only to seed the draws. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** WCAG relative luminance of a #RRGGBB colour. */
export function relativeLuminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG contrast ratio between two #RRGGBB colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every problem with a registry, as readable strings. [] means valid. */
export function validateRegistry(reg: SkinRegistry): string[] {
  const errs: string[] = [];
  if (!Array.isArray(reg.skins) || reg.skins.length === 0) return ["registry has no skins"];
  if (!Number.isInteger(reg.recentWindow) || reg.recentWindow < 0) errs.push("recentWindow must be a non-negative integer");
  const ids = new Set<string>();
  for (const s of reg.skins) {
    const at = `skin ${s.id ?? "?"}`;
    if (!s.id || !/^[a-z0-9-]+$/.test(s.id)) errs.push(`${at}: id must be kebab-case`);
    if (ids.has(s.id)) errs.push(`${at}: duplicate id`);
    ids.add(s.id);
    for (const k of ["field", "filament", "ink"] as const) if (!HEX.test(s[k] ?? "")) errs.push(`${at}: ${k} is not #RRGGBB`);
    if (HEX.test(s.field ?? "") && HEX.test(s.ink ?? "") && contrastRatio(s.field, s.ink) < 7) errs.push(`${at}: ink on field is below 7:1 contrast`);
    if (!s.name?.trim() || !s.family?.trim()) errs.push(`${at}: name and family are required`);
    if (!s.source?.trim()) errs.push(`${at}: source is required (where the colours come from)`);
    if (!Array.isArray(s.voicing) || s.voicing.length < 2) errs.push(`${at}: voicing needs at least two notes`);
    else for (const n of s.voicing) { try { noteToMidi(n); } catch { errs.push(`${at}: voicing note ${n} is not in C major`); } }
    if (!Array.isArray(s.stills)) errs.push(`${at}: stills must be an array`);
    else for (const st of s.stills) {
      if (!st?.url?.startsWith(STILL_URL_PREFIX)) errs.push(`${at}: still ${st?.url} is not served from ${STILL_URL_PREFIX}`);
      if (!st?.alt?.trim()) errs.push(`${at}: still ${st?.url} has no alt text`);
    }
  }
  for (const n of reg.houseVoicing ?? []) { try { noteToMidi(n); } catch { errs.push(`houseVoicing note ${n} is not in C major`); } }
  return errs;
}

/** Load and validate a registry. Throws with every problem listed. */
export function loadSkinRegistry(raw: unknown = registryJson): SkinRegistry {
  const reg = raw as SkinRegistry;
  const errs = validateRegistry(reg);
  if (errs.length) throw new Error(`arrival skin registry invalid:\n- ${errs.join("\n- ")}`);
  return reg;
}

export const SKIN_REGISTRY: SkinRegistry = loadSkinRegistry();

/** The effective "not seen in the last N" window: never so large that no skin qualifies. */
export function effectiveWindow(reg: SkinRegistry): number {
  return Math.max(0, Math.min(reg.recentWindow, reg.skins.length - 1));
}

/** How many recent ids to keep: enough to recover the current rotation and the window. */
export function historyCap(reg: SkinRegistry): number {
  return reg.skins.length + effectiveWindow(reg);
}

export interface SkinPick {
  skin: ArrivalSkin;
  sessionNumber: number;
  history: SkinHistory;
}

/**
 * Pick this session's skin.
 *
 * Rules, in order:
 *   1. never one of the last `recentWindow` skins seen (7 by default);
 *   2. full rotation before repeats: within a rotation of `skins.length` sessions,
 *      every skin appears once;
 *   3. among the skins left, a seeded draw on (userSeed, sessionNumber), so the same
 *      user and session always get the same skin, on the server or in the browser.
 * With at least recentWindow + 1 skins both rules can always be met.
 */
export function selectSkin(reg: SkinRegistry, userSeed: string, history: SkinHistory = EMPTY_HISTORY): SkinPick {
  const n = reg.skins.length;
  const known = new Set(reg.skins.map((s) => s.id));
  const recent = (history.recent ?? []).filter((id) => known.has(id));
  const sessionCount = Math.max(0, Math.floor(history.sessionCount ?? 0));
  const sessionNumber = sessionCount + 1;

  const window = effectiveWindow(reg);
  const blockedRecent = new Set(window > 0 ? recent.slice(-window) : []);
  const position = sessionCount % n;
  const seenThisRotation = new Set(position > 0 ? recent.slice(-position) : []);

  const tiers = [
    reg.skins.filter((s) => !blockedRecent.has(s.id) && !seenThisRotation.has(s.id)),
    reg.skins.filter((s) => !blockedRecent.has(s.id)),
    reg.skins,
  ];
  const candidates = tiers.find((t) => t.length > 0)!;
  const rng = mulberry32(hashSeed(`${userSeed}|arrival-skin|${sessionNumber}`));
  const skin = candidates[Math.floor(rng() * candidates.length)];

  const nextRecent = [...recent, skin.id].slice(-historyCap(reg));
  return { skin, sessionNumber, history: { sessionCount: sessionNumber, recent: nextRecent } };
}

export function skinById(reg: SkinRegistry, id: string): ArrivalSkin | undefined {
  return reg.skins.find((s) => s.id === id);
}

/**
 * The feature flag. Off unless the build sets VITE_ARRIVAL_SKINS=on, or the owner
 * (an admin account) switches the preview on for their own browser.
 */
export function arrivalSkinsEnabled(opts: { envFlag?: string | null; isOwner?: boolean; ownerPreview?: boolean }): boolean {
  if (String(opts.envFlag ?? "").trim().toLowerCase() === "on") return true;
  return Boolean(opts.isOwner && opts.ownerPreview);
}
