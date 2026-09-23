// ============================================================
// ARRIVAL SOUND — renders the sonic signature plan (shared/sonicSignature.ts) and
// the page soundscapes (shared/soundscapes.ts) with the Web Audio API.
// Oscillators only; no audio files.
//
// Rules this renderer keeps:
//   - Silent by default. Nothing is created until start() is called from a user
//     gesture ("Enter with sound" or the sound toggle). Never at login.
//   - The choice is remembered in localStorage ("on" / "off"); a remembered "on"
//     still waits for the button on each visit, it only changes the label.
//   - Mute is always available while sound plays and takes effect at once;
//     WCAG 2.2 1.4.2: anything longer than 3 s can be stopped.
//   - Silent pages (consent, intake, voice, money decisions) and the spoken intake
//     pause everything; sound comes back when the household leaves them, unless
//     they muted.
//   - Master ceiling -24 dBFS (a unity-gain clip curve at the end of the chain); cue, pad,
//     accent and texture levels come from shared/sonicSignature.ts; 1 s fades,
//     1.5 s crossfades between pages.
//   - Pauses when the tab is hidden; stops when the app unmounts.
// ============================================================
import {
  FADE_IN_S,
  FADE_OUT_S,
  MASTER_DBFS,
  MIN_ATTACK_S,
  MUTE_RAMP_S,
  TEXTURE_HEADPHONES_DBFS,
  TEXTURE_SPEAKERS_DBFS,
  accentVoices,
  ceilingCurve,
  cueVoices,
  dbToGain,
  padVoices,
  type Cue,
  type SessionSoundPlan,
  type Voice,
} from "@shared/sonicSignature";
import {
  LOCK_BED_DURING_SIGNATURE,
  SOUNDSCAPE_CROSSFADE_S,
  accentDelays,
  beatTones,
  streamGapS,
  type BeatTextureMode,
  type Soundscape,
} from "@shared/soundscapes";

export const SOUND_PREF_KEY = "rcs-arrival-sound";
export const TEXTURE_PREF_KEY = "rcs-arrival-texture";
export type SoundPref = "on" | "off" | null;

export function readSoundPref(): SoundPref {
  try {
    const v = localStorage.getItem(SOUND_PREF_KEY);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

export function writeSoundPref(v: "on" | "off"): void {
  try { localStorage.setItem(SOUND_PREF_KEY, v); } catch { /* private mode */ }
}

export function readTexturePref(): BeatTextureMode {
  try {
    const v = localStorage.getItem(TEXTURE_PREF_KEY);
    return v === "headphones" || v === "speakers" ? v : "off";
  } catch {
    return "off";
  }
}

export function writeTexturePref(v: BeatTextureMode): void {
  try { localStorage.setItem(TEXTURE_PREF_KEY, v); } catch { /* private mode */ }
}

export type ArrivalSoundState = "idle" | "playing" | "paused" | "stopped";

type Ctor = typeof AudioContext;
function audioContextCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export function audioSupported(): boolean {
  return audioContextCtor() !== null;
}

/** A wide, fine-pointer screen: the one place the octave-down pad voice is offered. */
export function isDesktopAudio(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches;
}

type Layer = { oscs: OscillatorNode[]; gain: GainNode };

export class ArrivalSoundEngine {
  private ctx: AudioContext | null = null;
  private fader: GainNode | null = null;
  private sigBus: GainNode | null = null;
  private streamFilter: BiquadFilterNode | null = null;
  private pad: Layer | null = null;
  private texture: Layer | null = null;
  private cueTimer: ReturnType<typeof setTimeout> | null = null;
  private accentTimer: ReturnType<typeof setTimeout> | null = null;
  private accentIndex = 0;
  private cueIndex: number;
  private state: ArrivalSoundState = "idle";
  private listeners = new Set<(s: ArrivalSoundState) => void>();
  private silenced = false;
  private autoPaused = false;
  private scape: Soundscape;
  private textureMode: BeatTextureMode;
  private desktop: boolean;
  private onCue?: (index: number) => void;

  private onVisibility = () => {
    if (document.hidden) { if (this.state === "playing") { this.autoPaused = true; this.pause(FADE_OUT_S); } }
    else if (this.autoPaused && !this.silenced) { void this.resume(); }
  };

  /**
   * `startIndex` resumes a session after a reload: cues already heard (the signature,
   * and any stream cues) are skipped rather than played again.
   */
  constructor(private plan: SessionSoundPlan, opts: { soundscape: Soundscape; texture?: BeatTextureMode; desktop?: boolean; startIndex?: number; onCue?: (index: number) => void }) {
    this.scape = opts.soundscape;
    this.textureMode = opts.texture ?? "off";
    this.desktop = Boolean(opts.desktop);
    this.onCue = opts.onCue;
    const start = Math.max(0, Math.floor(opts.startIndex ?? 0));
    const skipStream = start - plan.signature.length;
    if (skipStream > 0) plan.stream.take(skipStream);
    this.cueIndex = start;
  }

  getState(): ArrivalSoundState { return this.state; }
  getCueIndex(): number { return this.cueIndex; }
  inSignature(): boolean { return this.cueIndex < this.plan.signature.length; }
  getTexture(): BeatTextureMode { return this.textureMode; }

  subscribe(cb: (s: ArrivalSoundState) => void): () => void {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }

  private set(s: ArrivalSoundState) {
    this.state = s;
    this.listeners.forEach((cb) => cb(s));
  }

  /** Call only from a user gesture. Builds the graph, fades in over 1 s, plays the signature then the stream. */
  async start(): Promise<boolean> {
    if (this.state === "playing") return true;
    if (this.state === "paused") { this.autoPaused = false; return this.resume(); }
    const C = audioContextCtor();
    if (!C) return false;
    const ctx = new C();
    this.ctx = ctx;

    // Chain: layers → fader (fades, mute) → ceiling at MASTER_DBFS → speakers.
    // The ceiling is a WaveShaper that is exactly unity below -24 dBFS and holds
    // anything above it there. (The Web Audio compressor is not used: its automatic
    // make-up gain would lift the output well above the ceiling.)
    const ceiling = ctx.createWaveShaper();
    ceiling.curve = ceilingCurve(MASTER_DBFS);
    ceiling.oversample = "none";
    ceiling.connect(ctx.destination);

    const fader = ctx.createGain();
    fader.gain.value = 0;
    fader.connect(ceiling);
    this.fader = fader;

    // The signature bypasses the page texture so it sounds the same everywhere.
    this.sigBus = ctx.createGain();
    this.sigBus.connect(fader);
    this.streamFilter = ctx.createBiquadFilter();
    this.streamFilter.type = "lowpass";
    this.streamFilter.frequency.value = this.scape.brightnessHz;
    this.streamFilter.connect(fader);

    this.setPad(this.bedVoicing(), FADE_IN_S);
    this.setTextureLayer(FADE_IN_S);

    if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
    const now = ctx.currentTime;
    fader.gain.setValueAtTime(0, now);
    fader.gain.linearRampToValueAtTime(this.silenced ? 0 : 1, now + FADE_IN_S);

    document.addEventListener("visibilitychange", this.onVisibility);
    this.set("playing");
    if (this.silenced) { this.autoPaused = true; this.pause(MUTE_RAMP_S); return true; }
    this.scheduleCue(FADE_IN_S * 0.6);
    if (!this.inSignature()) this.scheduleAccent();
    return true;
  }

  /** Pause: fade out, stop scheduling, suspend the context. resume() picks up at the same cue. */
  pause(rampS: number = FADE_OUT_S): void {
    if (this.state !== "playing" || !this.ctx || !this.fader) return;
    this.clearTimers();
    const t = this.ctx.currentTime;
    this.fader.gain.cancelScheduledValues(t);
    this.fader.gain.setValueAtTime(this.fader.gain.value, t);
    this.fader.gain.linearRampToValueAtTime(0, t + rampS);
    const ctx = this.ctx;
    setTimeout(() => { if (this.state === "paused") void ctx.suspend().catch(() => undefined); }, rampS * 1000 + 50);
    this.set("paused");
  }

  /** The household's mute: at once (a 60 ms ramp only to avoid a click), and never undone automatically. */
  mute(): void {
    this.autoPaused = false;
    this.pause(MUTE_RAMP_S);
  }

  async resume(): Promise<boolean> {
    if (this.state !== "paused" || !this.ctx || !this.fader || this.silenced) return false;
    this.autoPaused = false;
    await this.ctx.resume().catch(() => undefined);
    const t = this.ctx.currentTime;
    this.fader.gain.cancelScheduledValues(t);
    this.fader.gain.setValueAtTime(0, t);
    this.fader.gain.linearRampToValueAtTime(1, t + FADE_IN_S);
    this.set("playing");
    this.scheduleCue(FADE_IN_S * 0.6);
    if (!this.inSignature()) this.scheduleAccent();
    return true;
  }

  /** Silent pages and the spoken intake. Lifting the silence resumes only what it paused, never a mute. */
  setSilenced(on: boolean): void {
    if (on === this.silenced) return;
    this.silenced = on;
    if (on && this.state === "playing") { this.autoPaused = true; this.pause(FADE_OUT_S); }
    else if (!on && this.autoPaused && this.state === "paused" && !document.hidden) void this.resume();
  }

  /** A new page: crossfade (1.5 s) to its soundscape. During the signature the bed holds the house voicing. */
  setSoundscape(s: Soundscape): void {
    if (s.id === this.scape.id && s.voicing.join() === this.scape.voicing.join()) return;
    this.scape = s;
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.streamFilter) {
      const t = ctx.currentTime;
      this.streamFilter.frequency.setValueAtTime(this.streamFilter.frequency.value, t);
      this.streamFilter.frequency.linearRampToValueAtTime(s.brightnessHz, t + SOUNDSCAPE_CROSSFADE_S);
    }
    if (!(LOCK_BED_DURING_SIGNATURE && this.inSignature())) this.setPad(this.bedVoicing(), SOUNDSCAPE_CROSSFADE_S);
    this.setTextureLayer(SOUNDSCAPE_CROSSFADE_S);
    this.accentIndex = 0;
    if (this.state === "playing" && !this.inSignature()) this.scheduleAccent();
  }

  /** The optional beat texture: off, one tone per ear (headphones), or both tones mixed (speakers). */
  setTexture(mode: BeatTextureMode): void {
    if (mode === this.textureMode) return;
    this.textureMode = mode;
    if (this.ctx) this.setTextureLayer(FADE_IN_S);
  }

  /** Tear everything down. The engine cannot be restarted after this. */
  stop(): void {
    this.clearTimers();
    document.removeEventListener("visibilitychange", this.onVisibility);
    const ctx = this.ctx;
    this.ctx = null;
    this.fader = null;
    this.sigBus = null;
    this.streamFilter = null;
    this.pad = null;
    this.texture = null;
    if (ctx) void ctx.close().catch(() => undefined);
    this.set("stopped");
  }

  private clearTimers() {
    if (this.cueTimer) clearTimeout(this.cueTimer);
    if (this.accentTimer) clearTimeout(this.accentTimer);
    this.cueTimer = null;
    this.accentTimer = null;
  }

  private bedVoicing(): Voice[] {
    return this.inSignature() && LOCK_BED_DURING_SIGNATURE ? this.plan.housePad : padVoices(this.scape.voicing, { desktop: this.desktop });
  }

  /** Fade a layer out over `fadeS` and stop its oscillators afterwards. */
  private retire(layer: Layer | null, fadeS: number) {
    const ctx = this.ctx;
    if (!ctx || !layer) return;
    const t = ctx.currentTime;
    layer.gain.gain.cancelScheduledValues(t);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, t);
    layer.gain.gain.linearRampToValueAtTime(0, t + fadeS);
    for (const o of layer.oscs) { try { o.stop(t + fadeS + 0.05); } catch { /* already stopped */ } }
  }

  private fadeIn(gain: GainNode, fadeS: number) {
    const t = this.ctx!.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + fadeS);
  }

  /** Swap the pad voicing with a crossfade. */
  private setPad(voices: Voice[], fadeS: number) {
    const ctx = this.ctx;
    const out = this.fader;
    if (!ctx || !out) return;
    this.retire(this.pad, fadeS);
    const gain = ctx.createGain();
    gain.connect(out);
    const oscs = voices.map((v) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = v.hz;
      const g = ctx.createGain();
      g.gain.value = v.gain;
      o.connect(g).connect(gain);
      o.start();
      return o;
    });
    this.fadeIn(gain, fadeS);
    this.pad = { oscs, gain };
  }

  private setTextureLayer(fadeS: number) {
    const ctx = this.ctx;
    const out = this.fader;
    if (!ctx || !out) return;
    this.retire(this.texture, fadeS);
    this.texture = null;
    if (this.textureMode === "off") return;
    const [lo, hi] = beatTones(this.scape);
    const gain = ctx.createGain();
    gain.connect(out);
    const make = (hz: number, level: number) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = hz;
      const g = ctx.createGain();
      g.gain.value = level;
      o.connect(g);
      o.start();
      return { o, g };
    };
    let oscs: OscillatorNode[];
    if (this.textureMode === "headphones") {
      // One tone in each ear.
      const level = dbToGain(TEXTURE_HEADPHONES_DBFS);
      const left = make(lo, level);
      const right = make(hi, level);
      const merger = ctx.createChannelMerger(2);
      left.g.connect(merger, 0, 0);
      right.g.connect(merger, 0, 1);
      merger.connect(gain);
      oscs = [left.o, right.o];
    } else {
      // Both tones mixed, sent to both speakers; the pair sums to TEXTURE_SPEAKERS_DBFS.
      const level = dbToGain(TEXTURE_SPEAKERS_DBFS) / 2;
      const a = make(lo, level);
      const b = make(hi, level);
      a.g.connect(gain);
      b.g.connect(gain);
      oscs = [a.o, b.o];
    }
    this.fadeIn(gain, fadeS);
    this.texture = { oscs, gain };
  }

  private scheduleCue(delayS: number) {
    if (this.cueTimer) clearTimeout(this.cueTimer);
    this.cueTimer = setTimeout(() => {
      if (this.state !== "playing" || !this.ctx) return;
      const cue = this.cueIndex < this.plan.signature.length ? this.plan.signature[this.cueIndex] : this.plan.stream.next();
      this.play(cue);
      this.cueIndex++;
      this.onCue?.(this.cueIndex);
      if (this.cueIndex === this.plan.signature.length) {
        // The signature is done: the page's own bed takes over, and its accents begin.
        this.setPad(this.bedVoicing(), SOUNDSCAPE_CROSSFADE_S);
        this.scheduleAccent();
      }
      this.scheduleCue(cue.phase === "signature" ? cue.nextInS : streamGapS(cue, this.scape));
    }, delayS * 1000);
  }

  private scheduleAccent() {
    if (this.accentTimer) clearTimeout(this.accentTimer);
    const scape = this.scape;
    const delays = accentDelays(scape, this.accentIndex + 1);
    const delay = delays[delays.length - 1];
    this.accentTimer = setTimeout(() => {
      if (this.state !== "playing" || !this.ctx || this.scape.id !== scape.id) return;
      const midi = scape.accentNotes[this.accentIndex % scape.accentNotes.length];
      this.voice(accentVoices(midi), "sine", MIN_ATTACK_S, 0.9, 0, this.fader!);
      this.accentIndex++;
      this.scheduleAccent();
    }, delay * 1000);
  }

  private play(cue: Cue) {
    const ctx = this.ctx;
    if (!ctx || !this.sigBus || !this.streamFilter) return;
    const bus = cue.phase === "signature" ? this.sigBus : this.streamFilter;
    const wave: OscillatorType = cue.kind === "bell" ? "sine" : cue.phase === "signature" ? "triangle" : this.scape.wave;
    this.voice(cueVoices(cue), wave, cue.attackS, cue.durationS, cue.pan, bus);
  }

  private voice(voices: Voice[], wave: OscillatorType, attackS: number, durationS: number, pan: number, out: AudioNode) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    let dest: AudioNode = out;
    if (typeof ctx.createStereoPanner === "function" && pan !== 0) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      p.connect(out);
      dest = p;
    }
    for (const v of voices) {
      const o = ctx.createOscillator();
      o.type = wave;
      o.frequency.value = v.hz;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v.gain, t + attackS);
      g.gain.exponentialRampToValueAtTime(Math.max(1e-6, v.gain * dbToGain(-40)), t + durationS);
      o.connect(g).connect(dest);
      o.start(t);
      o.stop(t + durationS + 0.05);
    }
  }
}
