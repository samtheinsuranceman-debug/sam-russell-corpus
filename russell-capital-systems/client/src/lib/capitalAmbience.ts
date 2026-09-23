/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE SOUND OF CAPITAL — Engineered C-Major Ambience Engine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A fully synthesized (zero audio files) ambient wealth layer built on three
 * consonant voices, every one of them locked to the key of C major:
 *
 *   1. THE CHIME  — a cash-register "cha-ching" whose bell rings a C-major
 *                   triad in the bright register (C5–C7). Fires roughly every
 *                   10s and is *never* identical twice: velocity, voicing,
 *                   inversion, octave, stereo position and micro-timing are
 *                   all re-rolled on every strike.
 *   2. THE GEARS  — filtered noise + a meshing tooth-click train, band-passed
 *                   so its resonant peaks sit on C3/G3. Machine texture that
 *                   stays consonant instead of reading as noise. It swells
 *                   just before each chime — the machine works, then it pays.
 *   3. THE HUM    — a faint energy drone two-to-three octaves BELOW the chime
 *                   (C2 / C3 / G3), lightly detuned so it beats slowly and
 *                   feels alive. Electrical, not musical-foreground.
 *
 * Tuning: equal temperament, A4 = 440 Hz.
 * Chime register C5–C7 · Hum register C2–G3 — deliberately separated octaves
 * so the hum supports the chime instead of muddying it.
 *
 * BROWSER AUTOPLAY: every modern browser blocks audio until a real user
 * gesture. The engine therefore starts suspended and only ever runs after an
 * explicit opt-in, which is persisted so returning visitors resume on their
 * first interaction. Nothing plays uninvited.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ── Equal-tempered C-major chord tones (A4 = 440) ────────────────────────── */
const C2 = 65.406;
const C3 = 130.813;
const G3 = 195.998;

/** Ascending C-major chord tones. Any 3 consecutive entries form a triad
 *  voicing (root position / 1st inversion / 2nd inversion), which is how the
 *  chime gets free harmonic variety without ever leaving the key. */
const CHORD_TONES = [
  261.626, // C4
  329.628, // E4
  391.995, // G4
  523.251, // C5
  659.255, // E5
  783.991, // G5
  1046.502, // C6
  1318.51, // E6
  1567.982, // G6
  2093.005, // C7
];

/** Bell partial structure. Slightly inharmonic upper partials give the strike
 *  a struck-metal character while the low partials stay true to the pitch. */
const BELL_PARTIALS: ReadonlyArray<{ ratio: number; gain: number; decay: number }> = [
  { ratio: 1.0, gain: 1.0, decay: 1.0 },
  { ratio: 2.0, gain: 0.5, decay: 0.72 },
  { ratio: 3.0, gain: 0.26, decay: 0.54 },
  { ratio: 4.16, gain: 0.13, decay: 0.4 },
  { ratio: 5.43, gain: 0.07, decay: 0.3 },
];

const STORAGE_KEY = "rcs-ambience";
const STORAGE_VOL = "rcs-ambience-vol";

const rand = (min: number, max: number) => min + Math.random() * (max - min); // decorative
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]; // decorative

export interface AmbienceState {
  enabled: boolean;
  volume: number;
  /** True once an AudioContext exists and is actually running. */
  running: boolean;
}

class CapitalAmbienceEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private humGain: GainNode | null = null;
  private gearGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private voices: Array<OscillatorNode | AudioBufferSourceNode> = [];
  private chimeTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  private state: AmbienceState = { enabled: false, volume: 0.55, running: false };
  private snapshot: AmbienceState = { ...this.state };

  constructor() {
    if (typeof window === "undefined") return;
    try {
      this.state.enabled = localStorage.getItem(STORAGE_KEY) === "on";
      const v = parseFloat(localStorage.getItem(STORAGE_VOL) ?? "");
      if (Number.isFinite(v)) this.state.volume = Math.min(1, Math.max(0, v));
    } catch {
      /* private mode — fall back to defaults */
    }
    this.snapshot = { ...this.state };

    // Pause the machine when the tab is hidden: polite, and saves CPU.
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  /* ── External store plumbing (for useSyncExternalStore) ─────────────────── */
  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getSnapshot = (): AmbienceState => this.snapshot;

  private emit() {
    this.snapshot = { ...this.state };
    this.listeners.forEach((cb) => cb());
  }

  /* ── Lifecycle ──────────────────────────────────────────────────────────── */

  private handleVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) {
      this.stopChimeLoop();
      void this.ctx.suspend().catch(() => {});
    } else if (this.state.enabled) {
      void this.ctx.resume().catch(() => {});
      this.scheduleNextChime(rand(2500, 5000));
    }
  };

  /** Must be called from inside a user-gesture handler. */
  async enable(): Promise<void> {
    this.state.enabled = true;
    try {
      localStorage.setItem(STORAGE_KEY, "on");
    } catch {
      /* ignore */
    }

    try {
      if (!this.ctx || this.ctx.state === "closed") this.buildGraph();
      if (this.ctx?.state === "suspended") await this.ctx.resume();
      this.state.running = this.ctx?.state === "running";
      // First chime lands soon after switch-on so the intent is obvious.
      this.scheduleNextChime(rand(900, 1800));
    } catch (e) {
      console.warn("[CapitalAmbience] enable failed:", e);
      this.state.running = false;
    }
    this.emit();
  }

  disable(): void {
    this.state.enabled = false;
    this.state.running = false;
    try {
      localStorage.setItem(STORAGE_KEY, "off");
    } catch {
      /* ignore */
    }
    this.stopChimeLoop();
    this.teardownGraph();
    this.emit();
  }

  toggle(): void {
    if (this.state.enabled) this.disable();
    else void this.enable();
  }

  setVolume(v: number): void {
    const vol = Math.min(1, Math.max(0, v));
    this.state.volume = vol;
    try {
      localStorage.setItem(STORAGE_VOL, String(vol));
    } catch {
      /* ignore */
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.12);
    }
    this.emit();
  }

  /** True when the user previously opted in — lets the app resume on the
   *  first gesture of a return visit without ever auto-starting cold. */
  get wantsSound(): boolean {
    return this.state.enabled;
  }

  dispose(): void {
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.stopChimeLoop();
    this.teardownGraph();
    this.listeners.clear();
  }

  /* ── Graph construction ─────────────────────────────────────────────────── */

  private buildGraph() {
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    // Fade the whole machine up rather than snapping on.
    this.master.gain.setTargetAtTime(this.state.volume, ctx.currentTime, 0.6);

    this.noiseBuffer = this.createNoiseBuffer(ctx);
    this.buildHum(ctx);
    this.buildGears(ctx);
  }

  private teardownGraph() {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      this.master?.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    } catch {
      /* ignore */
    }
    const voices = this.voices;
    this.voices = [];
    setTimeout(() => {
      voices.forEach((v) => {
        try {
          v.stop();
        } catch {
          /* already stopped */
        }
      });
      try {
        void ctx.close();
      } catch {
        /* ignore */
      }
    }, 900);
    this.ctx = null;
    this.master = null;
    this.humGain = null;
    this.gearGain = null;
    this.noiseBuffer = null;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Brown-ish noise: softer and warmer than white, reads as "machine room".
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1; // decorative
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buf;
  }

  /* ── Voice 1: the faint energy hum (C2 / C3 / G3, low register) ─────────── */
  private buildHum(ctx: AudioContext) {
    const hum = ctx.createGain();
    hum.gain.value = 0;
    this.humGain = hum;

    // Gentle lowpass keeps the buzz felt rather than heard.
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    lp.Q.value = 0.7;
    hum.connect(lp);
    lp.connect(this.master!);

    // Detuned pairs → slow beating = "alive electrical energy".
    const layers: Array<{ freq: number; type: OscillatorType; gain: number; detune: number }> = [
      { freq: C2, type: "sine", gain: 0.5, detune: 0 },
      { freq: C2, type: "sine", gain: 0.42, detune: 5 },
      { freq: C3, type: "triangle", gain: 0.3, detune: -4 },
      { freq: G3, type: "sine", gain: 0.16, detune: 3 },
      // A whisper of saw for the electrical buzz — heavily filtered above.
      { freq: C3, type: "sawtooth", gain: 0.05, detune: 7 },
    ];

    layers.forEach(({ freq, type, gain, detune }) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(hum);
      osc.start();
      this.voices.push(osc);
    });

    // Slow filter drift so the hum breathes instead of sitting static.
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.055; // ~18s cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);
    lfo.start();
    this.voices.push(lfo);

    hum.gain.setTargetAtTime(0.055, ctx.currentTime, 2.2);
  }

  /* ── Voice 2: gears grinding (band-passed onto C3 / G3) ─────────────────── */
  private buildGears(ctx: AudioContext) {
    const gears = ctx.createGain();
    gears.gain.value = 0;
    this.gearGain = gears;
    gears.connect(this.master!);

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    // Two resonant peaks parked on C3 and G3 — the grind stays in key.
    const bpA = ctx.createBiquadFilter();
    bpA.type = "bandpass";
    bpA.frequency.value = C3;
    bpA.Q.value = 5.5;

    const bpB = ctx.createBiquadFilter();
    bpB.type = "bandpass";
    bpB.frequency.value = G3;
    bpB.Q.value = 7;

    const aGain = ctx.createGain();
    aGain.gain.value = 0.85;
    const bGain = ctx.createGain();
    bGain.gain.value = 0.45;

    src.connect(bpA);
    bpA.connect(aGain);
    aGain.connect(gears);
    src.connect(bpB);
    bpB.connect(bGain);
    bGain.connect(gears);
    src.start();
    this.voices.push(src);

    // Meshing-teeth modulation: slow tremolo on the grind bed.
    const teeth = ctx.createOscillator();
    teeth.type = "sine";
    teeth.frequency.value = 3.1;
    const teethGain = ctx.createGain();
    teethGain.gain.value = 0.35;
    teeth.connect(teethGain);
    teethGain.connect(aGain.gain);
    teeth.start();
    this.voices.push(teeth);

    gears.gain.setTargetAtTime(0.03, ctx.currentTime, 3);
  }

  /* ── Voice 3: the C-major cash-register chime ───────────────────────────── */

  private stopChimeLoop() {
    if (this.chimeTimer) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
  }

  private scheduleNextChime(delayMs: number) {
    this.stopChimeLoop();
    this.chimeTimer = setTimeout(() => {
      if (!this.state.enabled || !this.ctx || this.ctx.state !== "running") return;
      this.strike();
      // "Every 10 seconds or so" — jittered so it never feels metronomic.
      this.scheduleNextChime(rand(8500, 13500));
    }, delayMs);
  }

  /** One complete, never-identical cash-register event. */
  private strike(velocityScale = 1) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;

    const t = ctx.currentTime;

    // ── Re-roll the performance on every single strike ──
    const velocity = rand(0.55, 1.0) * velocityScale; // volume varies
    const voicingRoot = Math.floor(rand(2, 6.999)); // which inversion / octave
    const pan = rand(-0.35, 0.35);
    const chaToChing = rand(0.045, 0.085); // mechanical → bell gap
    const sparkle = Math.random() < 0.65; // decorative

    const panner = ctx.createStereoPanner?.();
    const out = ctx.createGain();
    out.gain.value = 1;
    if (panner) {
      panner.pan.value = pan;
      out.connect(panner);
      panner.connect(this.master);
    } else {
      out.connect(this.master);
    }

    // The gears lean in just before the payout.
    if (this.gearGain) {
      this.gearGain.gain.setTargetAtTime(0.075, t, 0.18);
      this.gearGain.gain.setTargetAtTime(0.03, t + 0.5, 0.7);
    }

    /* "CHA" — the drawer/lever transient */
    if (this.noiseBuffer) {
      const n = ctx.createBufferSource();
      n.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = rand(2600, 3600);
      bp.Q.value = 1.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16 * velocity, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.075);
      n.connect(bp);
      bp.connect(g);
      g.connect(out);
      n.start(t, rand(0, 1));
      n.stop(t + 0.12);
    }

    // Low mechanical thunk, pitched to the C-major root so it stays in key.
    const thunk = ctx.createOscillator();
    const thunkGain = ctx.createGain();
    thunk.type = "sine";
    thunk.frequency.setValueAtTime(C3, t);
    thunk.frequency.exponentialRampToValueAtTime(C2, t + 0.09);
    thunkGain.gain.setValueAtTime(0, t);
    thunkGain.gain.linearRampToValueAtTime(0.11 * velocity, t + 0.008);
    thunkGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.13);
    thunk.connect(thunkGain);
    thunkGain.connect(out);
    thunk.start(t);
    thunk.stop(t + 0.18);

    /* "CHING" — the C-major bell triad */
    const triad = [
      CHORD_TONES[voicingRoot],
      CHORD_TONES[voicingRoot + 1],
      CHORD_TONES[voicingRoot + 2],
    ];
    const bellStart = t + chaToChing;
    const ring = rand(1.1, 1.9);

    triad.forEach((freq, idx) => {
      // Top note slightly louder: that's the note people actually "hear".
      const noteGain = (idx === 2 ? 0.95 : idx === 1 ? 0.7 : 0.8) * velocity;
      const noteDelay = idx * rand(0.004, 0.012); // human-ish strum, not a block

      BELL_PARTIALS.forEach((p) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq * p.ratio;
        // Micro-detune keeps repeated strikes from sounding cloned.
        osc.detune.value = rand(-6, 6);

        const start = bellStart + noteDelay;
        const dur = ring * p.decay;
        const peak = 0.075 * noteGain * p.gain;

        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(peak, start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(g);
        g.connect(out);
        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    });

    /* Sparkle tail — two octaves up, the "money shimmer" */
    if (sparkle) {
      const shimmerFreqs = [CHORD_TONES[8], CHORD_TONES[9]];
      shimmerFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq * 2;
        const start = bellStart + 0.09 + i * 0.05;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.014 * velocity, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + rand(0.5, 0.9));
        osc.connect(g);
        g.connect(out);
        osc.start(start);
        osc.stop(start + 1.1);
      });
    }

    // Now and then the register rings twice — a bigger sale.
    if (velocityScale === 1 && Math.random() < 0.18) { // decorative
      setTimeout(() => {
        if (this.state.enabled && this.ctx?.state === "running") this.strike(0.72);
      }, rand(260, 400));
    }
  }

  /** Fire a chime on demand (CTA clicks, milestone reveals). No-op when off. */
  ping(): void {
    if (!this.state.enabled || !this.ctx || this.ctx.state !== "running") return;
    this.strike(rand(0.8, 1));
  }
}

/** Module-level singleton — one machine for the whole site. */
export const capitalAmbience: CapitalAmbienceEngine =
  typeof window !== "undefined"
    ? ((window as unknown as { __rcsAmbience?: CapitalAmbienceEngine }).__rcsAmbience ??=
        new CapitalAmbienceEngine())
    : (null as unknown as CapitalAmbienceEngine);
