// ============================================================
// PAGE SOUNDSCAPES — each page has its own sound character, fixed per household.
//
// Once a household has chosen sound on the arrival field, opening a different page
// crossfades (1.5 s) to that page's soundscape: its own C-major pad voicing, rhythm
// (how far apart the cues fall), texture (tone colour and brightness) and an
// occasional accent. The mapping is a seeded hash of (user seed, normalised route),
// so the same page always sounds the same for the same household, and two pages
// almost never sound alike. It stays until they leave the page.
//
// Some pages are silent whatever the choice: sign-in, consent and intake, the
// voice pages (the advisor speaks there), and money-decision pages (pricing,
// billing, quotes, deals, fees, tax). The rules are data below so the owner can
// adjust them.
//
// The optional beat texture: two steady tones a few hertz apart (4-12 Hz) on
// carriers between 200 and 450 Hz. The household picks how it is delivered:
// "headphones" puts one tone in each ear; "speakers" mixes both tones, at a lower
// level. It is a sound texture only; nothing is claimed for it.
// ============================================================
import { hashSeed, noteToMidi, midiToHz } from "./arrivalSkins";
import { mulberry32 } from "./macro/random";

/** Crossfade between page soundscapes. */
export const SOUNDSCAPE_CROSSFADE_S = 1.5;

/**
 * While the signature is still playing, the bed stays the house voicing so the
 * first N cues sound the same on every return; the page soundscape takes over the
 * moment the signature ends.
 */
export const LOCK_BED_DURING_SIGNATURE = true;

export type SoundWave = "sine" | "triangle";
export type BeatTextureMode = "off" | "headphones" | "speakers";

export interface Soundscape {
  route: string;
  id: string;
  /** Pad voicing, C major, every note at or above F3. */
  voicing: string[];
  /** Rhythm: multiplies the gap between stream cues (0.7 = busier, 1.6 = sparser). */
  restScale: number;
  /** Texture: the stream cues' tone colour and brightness (low-pass cutoff). */
  wave: SoundWave;
  brightnessHz: number;
  /** Occasional accent: roughly every `accentEveryS` seconds, one short high note. */
  accentEveryS: number;
  accentNotes: number[];
  /** Beat texture parameters for this page (used only if the household turns it on). */
  beat: { carrierHz: number; diffHz: number };
}

/** Diatonic C-major voicings for page beds (triads and sevenths, all white keys). */
export const PAGE_VOICINGS: readonly string[][] = [
  ["C4", "E4", "G4"], ["E4", "G4", "C5"], ["G3", "C4", "E4"], ["A3", "C4", "E4"],
  ["D4", "F4", "A4"], ["E4", "G4", "B4"], ["F3", "A3", "C4"], ["G3", "B3", "D4"],
  ["C4", "E4", "G4", "B4"], ["A3", "C4", "E4", "G4"], ["D4", "F4", "A4", "C5"],
  ["F4", "A4", "C5", "E5"], ["G3", "B3", "D4", "F4"], ["E4", "A4", "C5"],
];

const REST_SCALES = [0.7, 0.85, 1.0, 1.2, 1.4, 1.6];
const WAVES: readonly SoundWave[] = ["sine", "triangle"];
const BRIGHTNESS = [1400, 1900, 2500, 3200, 4200];
const ACCENT_EVERY = [12, 15, 18, 22, 26];
const ACCENT_SETS = [[79, 84], [81, 84], [83, 84], [76, 79], [79, 83], [77, 81]];
/** C-major notes whose pitch sits between 200 and 450 Hz with room for a 12 Hz partner. */
export const BEAT_CARRIERS_HZ: readonly number[] = ["A3", "B3", "C4", "D4", "E4", "F4", "G4"].map((n) => midiToHz(noteToMidi(n)));
export const BEAT_DIFF_MIN_HZ = 4;
export const BEAT_DIFF_MAX_HZ = 12;

/** Strip query, hash and trailing slash; fold numeric ids so /clients/12 and /clients/40 sound alike. */
export function normalizeRoute(path: string): string {
  const bare = (path || "/").split(/[?#]/)[0].toLowerCase().replace(/\/+$/, "") || "/";
  return bare.split("/").map((seg) => (/^\d+$/.test(seg) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(seg) ? ":id" : seg)).join("/");
}

export type SilenceReason = "sign-in" | "consent-intake" | "voice" | "money-decision";

/** Pages that stay silent. Tokens are the words of the path split on "/" and "-". */
export const SILENT_ROUTE_RULES: ReadonlyArray<{ reason: SilenceReason; firstSegment?: readonly string[]; tokens?: readonly string[]; phrases?: readonly string[] }> = [
  { reason: "sign-in", firstSegment: ["login", "register", "forgot-password", "reset-password", "invite", "trial", "administrator", "executive"] },
  { reason: "consent-intake", tokens: ["onboarding", "welcome", "intake", "consent", "assessment", "genome", "buddy", "quiz", "questionnaire"], phrases: ["fact-finder"] },
  { reason: "voice", tokens: ["whisperer", "whisper", "voice", "chat", "talk", "goldman"], phrases: ["ai-advisor"] },
  { reason: "money-decision", tokens: ["pricing", "checkout", "billing", "subscription", "subscribe", "payment", "pay", "quote", "quotes", "deal", "deals", "fee", "fees", "purchase", "tax", "surtax", "contract", "esign", "application", "apply", "trade", "order"] },
];

/** Why a page is silent, or null when it may carry a soundscape. */
export function silenceReasonFor(path: string): SilenceReason | null {
  const route = normalizeRoute(path);
  const segments = route.split("/").filter(Boolean);
  const tokens = new Set(route.split(/[/-]/).filter(Boolean));
  for (const rule of SILENT_ROUTE_RULES) {
    if (rule.firstSegment && segments[0] && rule.firstSegment.includes(segments[0])) return rule.reason;
    if (rule.tokens?.some((t) => tokens.has(t))) return rule.reason;
    if (rule.phrases?.some((p) => route.includes(p))) return rule.reason;
  }
  return null;
}

const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

/**
 * The soundscape for a page, fixed per (household seed, route). `voicing` overrides
 * the pad (the arrival page wears the session skin's voicing).
 */
export function soundscapeFor(path: string, seed: number, opts: { voicing?: readonly string[] } = {}): Soundscape {
  const route = normalizeRoute(path);
  const h = hashSeed(`soundscape|${seed >>> 0}|${route}`);
  const rng = mulberry32(h);
  const voicing = [...pick(rng, PAGE_VOICINGS)];
  const restScale = pick(rng, REST_SCALES);
  const wave = pick(rng, WAVES);
  const brightnessHz = pick(rng, BRIGHTNESS);
  const accentEveryS = pick(rng, ACCENT_EVERY);
  const accentNotes = [...pick(rng, ACCENT_SETS)];
  const carrierHz = Math.round(pick(rng, BEAT_CARRIERS_HZ) * 100) / 100;
  const diffHz = BEAT_DIFF_MIN_HZ + Math.floor(rng() * (BEAT_DIFF_MAX_HZ - BEAT_DIFF_MIN_HZ + 1));
  return {
    route,
    id: `ss-${h.toString(16).padStart(8, "0")}`,
    voicing: opts.voicing ? [...opts.voicing] : voicing,
    restScale,
    wave,
    brightnessHz,
    accentEveryS,
    accentNotes,
    beat: { carrierHz, diffHz },
  };
}

/** Seconds between accents on a page: the page's interval with a seeded +/-20% so accents do not tick like a clock. */
export function accentDelays(s: Soundscape, count: number): number[] {
  const rng = mulberry32(hashSeed(`accent|${s.id}`));
  return Array.from({ length: count }, () => Math.round(s.accentEveryS * (0.8 + 0.4 * rng()) * 100) / 100);
}

/** The gap to the next stream cue on this page (always longer than the cue itself). */
export function streamGapS(cue: { durationS: number; nextInS: number }, s: Pick<Soundscape, "restScale">): number {
  return Math.max(cue.durationS + 0.3, Math.round(cue.nextInS * s.restScale * 100) / 100);
}

/** The two beat-texture tones for a page: [low, high], `diffHz` apart. */
export function beatTones(s: Pick<Soundscape, "beat">): [number, number] {
  return [s.beat.carrierHz, s.beat.carrierHz + s.beat.diffHz];
}
