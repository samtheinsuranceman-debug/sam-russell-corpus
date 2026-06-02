import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   ENTRAINMENT ENGINE + SOUND OF MONEY (Pavlovian Conditioning)
   
   VISUAL: CSS-driven breathing at 8 breaths/min — AMPLIFIED 300%.
   Scale transforms, brightness oscillation, ambient orb animations.
   
   AUDIO: Web Audio API binaural beats + Pavlovian reward tones.
   - Binaural: 40 Hz gamma (day) / 10 Hz alpha (night)
   - Pavlovian: Cash register "ka-ching" synthesized tones on key events
     * Deal closed → triumphant ascending chord
     * XP earned → quick bright ping
     * Level up → full fanfare cascade
     * Loot drop → mystery reveal shimmer
     * Streak milestone → rhythmic drum + chime
   
   The Pavlovian system creates neural associations between platform actions
   and dopamine-triggering reward sounds, driving habit formation.
   ═══════════════════════════════════════════════════════════════════════════ */

type BreathingState = "calm" | "excitement" | "alert" | "mega" | "sleep";
type BeatMode = "gamma" | "alpha";
type SoundEffect = "ka-ching" | "xp-ping" | "level-up" | "loot-reveal" | "streak-hit" | "quest-complete" | "deal-closed";
export type MusicTrack = "flow-state" | "wealth-meditation" | "morning-momentum" | "victory-march" | "deep-focus" | "power-hour";
export type MusicMood = "relaxation" | "excitement";

interface EntrainmentContextType {
  breathingState: BreathingState;
  setBreathingState: (state: BreathingState) => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
  beatMode: BeatMode;
  playSoundEffect: (effect: SoundEffect) => void;
  soundEffectsEnabled: boolean;
  toggleSoundEffects: () => void;
  // Ambient Music Player
  musicEnabled: boolean;
  toggleMusic: () => void;
  currentTrack: MusicTrack | null;
  playTrack: (track: MusicTrack) => void;
  playMood: (mood: MusicMood) => void;
  stopMusic: () => void;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
}

const EntrainmentContext = createContext<EntrainmentContextType>({
  breathingState: "calm",
  setBreathingState: () => {},
  audioEnabled: false,
  toggleAudio: () => {},
  beatMode: "gamma",
  playSoundEffect: () => {},
  soundEffectsEnabled: true,
  toggleSoundEffects: () => {},
  musicEnabled: false,
  toggleMusic: () => {},
  currentTrack: null,
  playTrack: () => {},
  playMood: () => {},
  stopMusic: () => {},
  musicVolume: 0.3,
  setMusicVolume: () => {},
});

export function useEntrainment() {
  return useContext(EntrainmentContext);
}

// ─── Binaural Beat Generator ─────────────────────────────────────────────
class BinauralBeatEngine {
  private ctx: AudioContext | null = null;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private isPlaying = false;

  start(mode: BeatMode) {
    if (this.isPlaying) this.stop();
    try {
      this.ctx = new AudioContext();
      const carrier = 200;
      const beatFreq = mode === "gamma" ? 40 : 10;
      this.merger = this.ctx.createChannelMerger(2);
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.01;
      this.leftOsc = this.ctx.createOscillator();
      this.leftOsc.type = "sine";
      this.leftOsc.frequency.value = carrier;
      this.rightOsc = this.ctx.createOscillator();
      this.rightOsc.type = "sine";
      this.rightOsc.frequency.value = carrier + beatFreq;
      const leftGain = this.ctx.createGain();
      leftGain.gain.value = 1;
      const rightGain = this.ctx.createGain();
      rightGain.gain.value = 1;
      this.leftOsc.connect(leftGain);
      leftGain.connect(this.merger, 0, 0);
      this.rightOsc.connect(rightGain);
      rightGain.connect(this.merger, 0, 1);
      this.merger.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 3);
      this.leftOsc.start();
      this.rightOsc.start();
      this.isPlaying = true;
    } catch (e) {
      console.warn("[EntrainmentEngine] Audio init failed:", e);
    }
  }

  stop() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      if (this.gainNode) {
        this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
      }
      setTimeout(() => {
        try {
          this.leftOsc?.stop();
          this.rightOsc?.stop();
          this.ctx?.close();
        } catch (_) { /* ignore */ }
        this.ctx = null;
        this.leftOsc = null;
        this.rightOsc = null;
        this.gainNode = null;
        this.merger = null;
      }, 2200);
    } catch (_) { /* ignore */ }
    this.isPlaying = false;
  }

  switchMode(mode: BeatMode) {
    if (this.isPlaying) {
      this.stop();
      setTimeout(() => this.start(mode), 2500);
    }
  }
}

// ─── Pavlovian Sound Effect Synthesizer ──────────────────────────────────
// All sounds are synthesized via Web Audio API — no external files needed.
class PavlovianSoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, volume: number, type: OscillatorType = "sine", delay = 0) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  }

  // Ka-ching! Cash register sound — the core Pavlovian trigger
  kaChing() {
    this.playTone(1200, 0.08, 0.15, "square", 0);
    this.playTone(1600, 0.08, 0.12, "square", 0.06);
    this.playTone(2400, 0.15, 0.18, "sine", 0.12);
    // Metallic shimmer
    this.playTone(4800, 0.3, 0.04, "sine", 0.15);
    this.playTone(6000, 0.25, 0.03, "sine", 0.18);
  }

  // Quick bright ping for XP earned
  xpPing() {
    this.playTone(880, 0.06, 0.1, "sine", 0);
    this.playTone(1320, 0.12, 0.12, "sine", 0.05);
  }

  // Triumphant ascending fanfare for level up
  levelUp() {
    const notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 0.12, "sine", i * 0.12);
      this.playTone(freq * 1.5, 0.15, 0.04, "triangle", i * 0.12 + 0.02); // harmonic
    });
    // Final shimmer
    this.playTone(2637, 0.5, 0.08, "sine", 0.6);
    this.playTone(3951, 0.4, 0.04, "sine", 0.65);
  }

  // Mystery reveal shimmer for loot drops
  lootReveal() {
    // Descending mystery tones
    this.playTone(2000, 0.1, 0.08, "sine", 0);
    this.playTone(1800, 0.1, 0.08, "sine", 0.08);
    this.playTone(1600, 0.1, 0.08, "sine", 0.16);
    // Then ascending reveal
    this.playTone(800, 0.12, 0.1, "sine", 0.3);
    this.playTone(1200, 0.12, 0.12, "sine", 0.38);
    this.playTone(1600, 0.15, 0.14, "sine", 0.46);
    this.playTone(2400, 0.3, 0.1, "sine", 0.54);
    // Sparkle
    this.playTone(4000, 0.2, 0.03, "sine", 0.6);
    this.playTone(5000, 0.15, 0.02, "sine", 0.65);
  }

  // Rhythmic drum + chime for streak milestones
  streakHit() {
    // Drum hits (low frequency square waves)
    this.playTone(100, 0.08, 0.15, "square", 0);
    this.playTone(100, 0.08, 0.12, "square", 0.15);
    this.playTone(100, 0.08, 0.18, "square", 0.25);
    // Chime on top
    this.playTone(1047, 0.3, 0.1, "sine", 0.3);
    this.playTone(1319, 0.25, 0.08, "sine", 0.35);
    this.playTone(1568, 0.4, 0.12, "sine", 0.4);
  }

  // Quest complete — heroic chord
  questComplete() {
    // Power chord
    this.playTone(440, 0.3, 0.12, "sawtooth", 0);
    this.playTone(554, 0.3, 0.1, "sawtooth", 0);
    this.playTone(659, 0.3, 0.1, "sawtooth", 0);
    // Resolution
    this.playTone(880, 0.4, 0.14, "sine", 0.25);
    this.playTone(1047, 0.35, 0.08, "sine", 0.3);
  }

  // Deal closed — the big one. Full triumphant sequence.
  dealClosed() {
    // Opening fanfare
    this.playTone(523, 0.15, 0.12, "sine", 0);
    this.playTone(659, 0.15, 0.12, "sine", 0.12);
    this.playTone(784, 0.15, 0.12, "sine", 0.24);
    // Ka-ching overlay
    this.playTone(1200, 0.08, 0.15, "square", 0.36);
    this.playTone(2400, 0.15, 0.18, "sine", 0.42);
    // Triumphant resolution
    this.playTone(1047, 0.4, 0.15, "sine", 0.5);
    this.playTone(1319, 0.35, 0.1, "sine", 0.55);
    this.playTone(1568, 0.5, 0.12, "sine", 0.6);
    // Sparkle tail
    this.playTone(3000, 0.3, 0.04, "sine", 0.8);
    this.playTone(4000, 0.25, 0.03, "sine", 0.85);
    this.playTone(5000, 0.2, 0.02, "sine", 0.9);
  }

  play(effect: SoundEffect) {
    try {
      switch (effect) {
        case "ka-ching": this.kaChing(); break;
        case "xp-ping": this.xpPing(); break;
        case "level-up": this.levelUp(); break;
        case "loot-reveal": this.lootReveal(); break;
        case "streak-hit": this.streakHit(); break;
        case "quest-complete": this.questComplete(); break;
        case "deal-closed": this.dealClosed(); break;
      }
    } catch (e) {
      console.warn("[PavlovianSound] Failed to play:", effect, e);
    }
  }
}

// ─── Ambient Music Track CDN URLs ────────────────────────────────────────
export const MUSIC_TRACKS: Record<MusicTrack, { url: string; mood: MusicMood; title: string }> = {
  "flow-state": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/flow-state_400d555d.mp3",
    mood: "relaxation",
    title: "Flow State",
  },
  "wealth-meditation": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/wealth-meditation_98f5edd4.mp3",
    mood: "relaxation",
    title: "Wealth Meditation",
  },
  "morning-momentum": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/morning-momentum_3ae7f7e6.mp3",
    mood: "excitement",
    title: "Morning Momentum",
  },
  "victory-march": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/victory-march_23a9b983.mp3",
    mood: "excitement",
    title: "Victory March",
  },
  "deep-focus": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/deep-focus_1ccdfb4a.mp3",
    mood: "relaxation",
    title: "Deep Focus",
  },
  "power-hour": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/power-hour_0b0df869.mp3",
    mood: "excitement",
    title: "Power Hour",
  },
};

const RELAXATION_TRACKS: MusicTrack[] = ["flow-state", "wealth-meditation", "deep-focus"];
const EXCITEMENT_TRACKS: MusicTrack[] = ["morning-momentum", "victory-march", "power-hour"];

class AmbientMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private volume = 0.3;
  private onTrackChange: ((track: MusicTrack | null) => void) | null = null;

  setOnTrackChange(cb: (track: MusicTrack | null) => void) {
    this.onTrackChange = cb;
  }

  play(track: MusicTrack) {
    if (this.currentTrack === track && this.audio && !this.audio.paused) return;
    this.stop();
    const info = MUSIC_TRACKS[track];
    if (!info) return;
    try {
      this.audio = new Audio(info.url);
      this.audio.volume = this.volume;
      this.audio.loop = true;
      this.audio.crossOrigin = "anonymous";
      // Fade in
      this.audio.volume = 0;
      this.audio.play().then(() => {
        let vol = 0;
        const fadeIn = setInterval(() => {
          vol += 0.02;
          if (vol >= this.volume) {
            vol = this.volume;
            clearInterval(fadeIn);
          }
          if (this.audio) this.audio.volume = vol;
        }, 50);
      }).catch(e => console.warn("[AmbientMusic] Autoplay blocked:", e));
      this.currentTrack = track;
      this.onTrackChange?.(track);
    } catch (e) {
      console.warn("[AmbientMusic] Failed to play:", e);
    }
  }

  playMood(mood: MusicMood) {
    const tracks = mood === "relaxation" ? RELAXATION_TRACKS : EXCITEMENT_TRACKS;
    const track = tracks[Math.floor(Math.random() * tracks.length)];
    this.play(track);
  }

  stop() {
    if (this.audio) {
      // Fade out
      const audio = this.audio;
      let vol = audio.volume;
      const fadeOut = setInterval(() => {
        vol -= 0.03;
        if (vol <= 0) {
          clearInterval(fadeOut);
          audio.pause();
          audio.src = "";
        } else {
          audio.volume = vol;
        }
      }, 50);
      this.audio = null;
    }
    this.currentTrack = null;
    this.onTrackChange?.(null);
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.audio && !this.audio.paused) {
      this.audio.volume = this.volume;
    }
  }

  getVolume() { return this.volume; }
  getCurrentTrack() { return this.currentTrack; }
  isPlaying() { return this.audio !== null && !this.audio.paused; }
}

function getCurrentBeatMode(): BeatMode {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 21) ? "gamma" : "alpha";
}

const BREATHING_CSS_VARS: Record<BreathingState, Record<string, string>> = {
  calm: {
    "--breath-duration": "7.5s",
    "--breath-scale-peak": "1.005",
    "--breath-brightness-peak": "1.012",
    "--breath-ease": "cubic-bezier(0.37, 0, 0.25, 1)",
  },
  excitement: {
    "--breath-duration": "7s",
    "--breath-scale-peak": "1.008",
    "--breath-brightness-peak": "1.018",
    "--breath-ease": "cubic-bezier(0.4, 0, 0.3, 1)",
  },
  alert: {
    "--breath-duration": "5s",
    "--breath-scale-peak": "1.012",
    "--breath-brightness-peak": "1.022",
    "--breath-ease": "cubic-bezier(0.5, 0, 0.2, 1)",
  },
  mega: {
    "--breath-duration": "6s",
    "--breath-scale-peak": "1.015",
    "--breath-brightness-peak": "1.025",
    "--breath-ease": "cubic-bezier(0.6, 0, 0.1, 1)",
  },
  sleep: {
    "--breath-duration": "12s",
    "--breath-scale-peak": "1.003",
    "--breath-brightness-peak": "1.006",
    "--breath-ease": "cubic-bezier(0.3, 0, 0.2, 1)",
  },
};

export function EntrainmentProvider({ children }: { children: ReactNode }) {
  const [breathingState, setBreathingState] = useState<BreathingState>("calm");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(() => {
    try { return localStorage.getItem("rc-sfx") !== "off"; } catch { return true; }
  });
  const [beatMode, setBeatMode] = useState<BeatMode>(getCurrentBeatMode);
  const engineRef = useRef<BinauralBeatEngine | null>(null);
  const pavlovRef = useRef<PavlovianSoundEngine | null>(null);
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const musicPlayerRef = useRef<AmbientMusicPlayer | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [musicVolume, setMusicVolumeState] = useState(() => {
    try { return parseFloat(localStorage.getItem("rc-music-vol") || "0.3"); } catch { return 0.3; }
  });

  useEffect(() => {
    engineRef.current = new BinauralBeatEngine();
    pavlovRef.current = new PavlovianSoundEngine();
    musicPlayerRef.current = new AmbientMusicPlayer();
    musicPlayerRef.current.setOnTrackChange(setCurrentTrack);
    return () => {
      engineRef.current?.stop();
      musicPlayerRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const vars = BREATHING_CSS_VARS[breathingState];
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.setAttribute("data-breathing", breathingState);
  }, [breathingState]);

  const setBreathingStateWithReturn = useCallback((state: BreathingState) => {
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    setBreathingState(state);
    if (state !== "calm" && state !== "sleep") {
      const returnDelay = state === "mega" ? 8000 : state === "alert" ? 6000 : 5000;
      returnTimerRef.current = setTimeout(() => setBreathingState("calm"), returnDelay);
    }
  }, []);

  useEffect(() => {
    const check = () => {
      const newMode = getCurrentBeatMode();
      if (newMode !== beatMode) {
        setBeatMode(newMode);
        if (audioEnabled) engineRef.current?.switchMode(newMode);
      }
    };
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [beatMode, audioEnabled]);

  const toggleAudio = useCallback(() => {
    if (audioEnabled) {
      engineRef.current?.stop();
      setAudioEnabled(false);
    } else {
      engineRef.current?.start(beatMode);
      setAudioEnabled(true);
    }
  }, [audioEnabled, beatMode]);

  const playSoundEffect = useCallback((effect: SoundEffect) => {
    if (!soundEffectsEnabled) return;
    pavlovRef.current?.play(effect);
    // Sync breathing state with sound events for visual reinforcement
    if (effect === "deal-closed" || effect === "level-up") {
      setBreathingStateWithReturn("mega");
    } else if (effect === "quest-complete" || effect === "streak-hit") {
      setBreathingStateWithReturn("excitement");
    } else if (effect === "loot-reveal") {
      setBreathingStateWithReturn("alert");
    }
  }, [soundEffectsEnabled, setBreathingStateWithReturn]);

  const toggleSoundEffects = useCallback(() => {
    setSoundEffectsEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("rc-sfx", next ? "on" : "off"); } catch {}
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    if (musicEnabled) {
      musicPlayerRef.current?.stop();
      setMusicEnabled(false);
    } else {
      // Auto-select mood based on time of day
      const hour = new Date().getHours();
      const mood: MusicMood = (hour >= 6 && hour < 14) ? "excitement" : "relaxation";
      musicPlayerRef.current?.playMood(mood);
      setMusicEnabled(true);
    }
  }, [musicEnabled]);

  const playTrack = useCallback((track: MusicTrack) => {
    musicPlayerRef.current?.play(track);
    setMusicEnabled(true);
  }, []);

  const playMood = useCallback((mood: MusicMood) => {
    musicPlayerRef.current?.playMood(mood);
    setMusicEnabled(true);
  }, []);

  const stopMusic = useCallback(() => {
    musicPlayerRef.current?.stop();
    setMusicEnabled(false);
  }, []);

  const handleSetMusicVolume = useCallback((v: number) => {
    musicPlayerRef.current?.setVolume(v);
    setMusicVolumeState(v);
    try { localStorage.setItem("rc-music-vol", v.toString()); } catch {}
  }, []);

  useEffect(() => {
    const checkSleep = () => {
      const hour = new Date().getHours();
      if (hour >= 23 || hour < 5) {
        if (breathingState === "calm") setBreathingState("sleep");
      }
    };
    checkSleep();
    const interval = setInterval(checkSleep, 300000);
    return () => clearInterval(interval);
  }, [breathingState]);

  return (
    <EntrainmentContext.Provider value={{
      breathingState,
      setBreathingState: setBreathingStateWithReturn,
      audioEnabled,
      toggleAudio,
      beatMode,
      playSoundEffect,
      soundEffectsEnabled,
      toggleSoundEffects,
      musicEnabled,
      toggleMusic,
      currentTrack,
      playTrack,
      playMood,
      stopMusic,
      musicVolume,
      setMusicVolume: handleSetMusicVolume,
    }}>
      {children}
    </EntrainmentContext.Provider>
  );
}
