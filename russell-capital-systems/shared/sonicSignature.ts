// ============================================================
// SONIC SIGNATURE — the household's "home" sound on the arrival field.
//
// The first N cues a user hears (N = 10..25, default 10, about 8 s) are the same on every
// visit: a short motif fixed per user, like a sonic logo. After the signature,
// a stream of new cues drawn from the C-major palette follows; it never repeats a
// cue within the session and is seeded by the session number, so each visit's
// stream differs from the last.
//
// This file is pure: it plans cues and levels. client/src/lib/arrivalSound.ts
// renders them with the Web Audio API (oscillators only, no audio files).
//
// Levels are stated in dBFS: master ceiling -24 dBFS, each cue peaks at or below
// -30 dBFS, the pad sits at -38 dBFS, page accents at -40 dBFS, the optional beat
// texture at -44 dBFS per ear (headphones) or -46 dBFS mixed (speakers); 1 s fades.
// Everything at once still sums under the master ceiling (worstCaseGain).
// Fundamentals stay at or above F3 (175 Hz) in pads and G3 (196 Hz) in cues, so
// phone and laptop speakers can play them; an octave-down pad
// voice is offered on desktop only. The sound is design, not therapy: no claims
// about the body or mind are made for it.
// ============================================================
import { hashSeed, midiToHz, noteToMidi } from "./arrivalSkins";
import { mulberry32 } from "./macro/random";

export const SIGNATURE_MIN = 10;
export const SIGNATURE_MAX = 25;
/** Ten short cues, about eight seconds: long enough to learn, short enough to stay a logo. */
export const SIGNATURE_DEFAULT = 10;
/** The default signature finishes within this many seconds. */
export const SIGNATURE_TARGET_S = 8;

export const MASTER_DBFS = -24;
export const CUE_PEAK_DBFS = -30;
export const PAD_DBFS = -38;
export const ACCENT_DBFS = -40;
/** Beat texture, headphones: each ear carries one tone at this level. */
export const TEXTURE_HEADPHONES_DBFS = -44;
/** Beat texture, speakers: both tones mixed; this is the level of the pair (lower than headphones). */
export const TEXTURE_SPEAKERS_DBFS = -46;
export const FADE_IN_S = 1;
export const FADE_OUT_S = 1;
/** Shortest attack on any voice: no sharp onsets. */
export const MIN_ATTACK_S = 0.02;
/** A mute is effectively instant; this short ramp only avoids a click. */
export const MUTE_RAMP_S = 0.06;
/** Lowest fundamental used on any device (G3). */
export const MIN_FUNDAMENTAL_HZ = 150;

/** C-major scale from G3 (MIDI 55, 196 Hz) to C6 (MIDI 84). */
export const PALETTE_MIDI: readonly number[] = [55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
const TONICS = [60, 72, 84];

const SIGNATURE_DURATIONS = [0.2, 0.3, 0.4, 0.5];
const SIGNATURE_RESTS = [0.1, 0.2, 0.3];
const STREAM_DURATIONS = [0.5, 0.8, 1.1, 1.5];
const STREAM_RESTS = [2.0, 3.0, 4.0, 5.5];
const PEAKS = [-30, -32, -34, -36];
const PANS = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];

export type CueKind = "tone" | "dyad" | "bell";
export type CuePhase = "signature" | "stream";

export interface Cue {
  index: number;
  phase: CuePhase;
  kind: CueKind;
  /** MIDI note numbers, all in C major. */
  notes: number[];
  durationS: number;
  attackS: number;
  peakDbfs: number;
  pan: number;
  /** Seconds from this cue's start to the next cue's start (always longer than the cue). */
  nextInS: number;
}

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

export function clampSignatureLength(n: number | undefined | null): number {
  if (n === undefined || n === null || !Number.isFinite(n)) return SIGNATURE_DEFAULT;
  return Math.min(SIGNATURE_MAX, Math.max(SIGNATURE_MIN, Math.round(n)));
}

/** Content identity of a cue: two cues with the same fingerprint sound the same. */
export function cueFingerprint(c: Pick<Cue, "kind" | "notes" | "durationS" | "pan">): string {
  return `${c.kind}:${c.notes.join(".")}:${c.durationS}:${c.pan}`;
}

const pick = <T,>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

/** A dyad partner a third or a sixth above, kept inside the palette. */
function dyadPartner(root: number, rng: () => number): number | null {
  const i = PALETTE_MIDI.indexOf(root);
  const steps = rng() < 0.6 ? [2, 5] : [5, 2];
  for (const s of steps) if (i + s < PALETTE_MIDI.length) return PALETTE_MIDI[i + s];
  return null;
}

function makeCue(rng: () => number, index: number, phase: CuePhase, root: number): Cue {
  const roll = rng();
  let kind: CueKind = roll < 0.6 ? "tone" : roll < 0.85 ? "dyad" : "bell";
  let notes = [root];
  if (kind === "dyad") {
    const partner = dyadPartner(root, rng);
    if (partner === null) kind = "tone";
    else notes = [root, partner];
  }
  const durationS = pick(rng, phase === "signature" ? SIGNATURE_DURATIONS : STREAM_DURATIONS);
  const rest = pick(rng, phase === "signature" ? SIGNATURE_RESTS : STREAM_RESTS);
  return {
    index,
    phase,
    kind,
    notes,
    durationS,
    attackS: kind === "bell" ? MIN_ATTACK_S : 0.04,
    peakDbfs: pick(rng, PEAKS),
    pan: pick(rng, PANS),
    nextInS: Math.round((durationS + rest) * 100) / 100,
  };
}

/** A melodic step: stay near the last note so the motif reads as a line, not scatter. */
function stepFrom(prev: number, rng: () => number): number {
  const i = PALETTE_MIDI.indexOf(prev);
  const delta = pick(rng, [-3, -2, -1, 1, 2, 3, 4]);
  const j = Math.min(PALETTE_MIDI.length - 1, Math.max(0, i + delta));
  return PALETTE_MIDI[j === i ? Math.max(0, i - 1) : j];
}

/**
 * The user's signature: `length` cues, identical on every visit for the same seed.
 * It opens and closes on C, the house tonic.
 */
export function signatureCues(seed: number, length: number = SIGNATURE_DEFAULT): Cue[] {
  const n = clampSignatureLength(length);
  const rng = mulberry32(hashSeed(`signature|${seed >>> 0}`));
  const cues: Cue[] = [];
  let note = pick(rng, TONICS.slice(0, 2));
  for (let i = 0; i < n; i++) {
    if (i > 0) note = i === n - 1 ? nearestTonic(note) : stepFrom(note, rng);
    cues.push(makeCue(rng, i, "signature", note));
  }
  return cues;
}

function nearestTonic(note: number): number {
  return TONICS.reduce((best, t) => (Math.abs(t - note) < Math.abs(best - note) ? t : best), TONICS[0]);
}

/**
 * The stream after the signature. Seeded by (seed, session), so each visit hears a
 * different stream; within a session no cue repeats the fingerprint of an earlier
 * cue or of any signature cue. If the palette's combinations were ever exhausted
 * (thousands of cues), the used set restarts rather than looping on one cue.
 */
export class CueStream {
  private rng: () => number;
  private used = new Set<string>();
  private reserved: Set<string>;
  private index: number;
  private last: number;

  constructor(seed: number, sessionNumber: number, signature: readonly Cue[]) {
    this.rng = mulberry32(hashSeed(`stream|${seed >>> 0}|${sessionNumber}`));
    this.reserved = new Set(signature.map(cueFingerprint));
    this.index = signature.length;
    this.last = signature.length ? signature[signature.length - 1].notes[0] : 72;
  }

  next(): Cue {
    for (let attempt = 0; attempt < 256; attempt++) {
      const root = attempt < 128 ? stepFrom(this.last, this.rng) : pick(this.rng, PALETTE_MIDI);
      const cue = makeCue(this.rng, this.index, "stream", root);
      const fp = cueFingerprint(cue);
      if (this.used.has(fp) || this.reserved.has(fp)) continue;
      this.used.add(fp);
      this.index++;
      this.last = root;
      return cue;
    }
    this.used.clear();
    return this.next();
  }

  take(count: number): Cue[] {
    return Array.from({ length: count }, () => this.next());
  }
}

export interface Voice {
  hz: number;
  gain: number;
}

/**
 * The oscillators for one cue. The gains sum to the cue's peak level, so a cue
 * never exceeds its dBFS figure however many voices it has. A bell adds a quiet
 * second partial.
 */
export function cueVoices(cue: Pick<Cue, "kind" | "notes" | "peakDbfs">): Voice[] {
  const parts: Array<{ hz: number; weight: number }> = [];
  for (const m of cue.notes) {
    parts.push({ hz: midiToHz(m), weight: 1 });
    if (cue.kind === "bell") parts.push({ hz: midiToHz(m) * 2, weight: 0.25 });
  }
  const total = parts.reduce((s, p) => s + p.weight, 0);
  const peak = dbToGain(Math.min(cue.peakDbfs, CUE_PEAK_DBFS));
  return parts.map((p) => ({ hz: p.hz, gain: (peak * p.weight) / total }));
}

/**
 * The soft pad under the cues: one sine per voicing note, summing to PAD_DBFS.
 * On desktop, the lowest note is doubled an octave down (still counted in the sum).
 */
export function padVoices(voicing: readonly string[], opts: { desktop?: boolean } = {}): Voice[] {
  const midis = voicing.map(noteToMidi).sort((a, b) => a - b);
  const hzs = midis.map(midiToHz);
  if (opts.desktop && midis.length) hzs.unshift(midiToHz(midis[0] - 12));
  const each = dbToGain(PAD_DBFS) / hzs.length;
  return hzs.map((hz) => ({ hz, gain: each }));
}

/**
 * The loudest any one output channel can get: the pad, one cue at peak (cues never
 * overlap), one accent, and the beat texture in its louder (headphones) mode.
 */
export function worstCaseGain(): number {
  return dbToGain(PAD_DBFS) + dbToGain(CUE_PEAK_DBFS) + dbToGain(ACCENT_DBFS) + Math.max(dbToGain(TEXTURE_HEADPHONES_DBFS), dbToGain(TEXTURE_SPEAKERS_DBFS));
}

/** An accent: one short bell-like high note at ACCENT_DBFS. */
export function accentVoices(midi: number): Voice[] {
  const peak = dbToGain(ACCENT_DBFS);
  return [{ hz: midiToHz(midi), gain: peak * 0.8 }, { hz: midiToHz(midi) * 2, gain: peak * 0.2 }];
}

/** Seconds from the first signature cue's start to the last one's end. */
export function signatureSpanS(cues: readonly Cue[]): number {
  if (!cues.length) return 0;
  const starts = cues.slice(0, -1).reduce((t, c) => t + c.nextInS, 0);
  return Math.round((starts + cues[cues.length - 1].durationS) * 100) / 100;
}

/**
 * The output ceiling: a WaveShaper curve that passes every sample unchanged up to
 * MASTER_DBFS and holds anything above it at MASTER_DBFS. Unlike the Web Audio
 * compressor it adds no make-up gain, so the chain's gain below the ceiling is
 * exactly 1 and its output can never exceed the ceiling.
 */
export const CEILING_CURVE_POINTS = 8193;
export function ceilingCurve(ceilingDbfs: number = MASTER_DBFS, points: number = CEILING_CURVE_POINTS): Float32Array<ArrayBuffer> {
  const t = dbToGain(ceilingDbfs);
  const curve = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    const x = (i * 2) / (points - 1) - 1;
    curve[i] = Math.max(-t, Math.min(t, x));
  }
  return curve;
}

/**
 * The renderer's gain from the layer sums to the speakers, stage by stage:
 * fader (0..1, 1 when fully up) and the ceiling (slope 1 below MASTER_DBFS).
 * Kept here so a test can hold the chain to it.
 */
export const OUTPUT_CHAIN = { faderMax: 1, ceilingSlope: 1 } as const;
export function chainGain(): number {
  return OUTPUT_CHAIN.faderMax * OUTPUT_CHAIN.ceilingSlope;
}

export interface SessionSoundPlan {
  signature: Cue[];
  stream: CueStream;
  /** Under the signature: the house C-major voicing, the same every visit. */
  housePad: Voice[];
  /** After the signature: this session's skin voicing. */
  skinPad: Voice[];
}

export function sessionSoundPlan(opts: {
  seed: number;
  sessionNumber: number;
  signatureLength?: number;
  houseVoicing: readonly string[];
  skinVoicing: readonly string[];
  desktop?: boolean;
}): SessionSoundPlan {
  const signature = signatureCues(opts.seed, clampSignatureLength(opts.signatureLength));
  return {
    signature,
    stream: new CueStream(opts.seed, opts.sessionNumber, signature),
    housePad: padVoices(opts.houseVoicing, { desktop: opts.desktop }),
    skinPad: padVoices(opts.skinVoicing, { desktop: opts.desktop }),
  };
}
