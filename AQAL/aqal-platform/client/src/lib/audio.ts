// ============================================================
// PREMIUM AUDIO CUES — Subtle, sophisticated interaction sounds
// Mark 10/10: "A critical missing sensory layer for a premium product"
// Uses Web Audio API to synthesize short, elegant tones
// No external files needed — pure synthesis for instant response
// ============================================================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume suspended context (browser autoplay policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Subtle click — for CTA buttons and primary actions
export function playClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.03);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

// Score reveal chime — ascending tone for the rarity score reveal
export function playScoreReveal() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6 — major chord ascent
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);

    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.4);
  });
}

// Assessment completion — warm, satisfying resolution tone
export function playComplete() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Two-note resolution: fifth → root
  const freqs = [392, 523]; // G4 → C5
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);

    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + i * 0.2 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.6);

    osc.start(ctx.currentTime + i * 0.2);
    osc.stop(ctx.currentTime + i * 0.2 + 0.6);
  });
}

// Navigation transition — very subtle whoosh
export function playTransition() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}
