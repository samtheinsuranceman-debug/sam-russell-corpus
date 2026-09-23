import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ACCENT_DBFS,
  MIN_ATTACK_S,
  TEXTURE_HEADPHONES_DBFS,
  accentVoices,
  CUE_PEAK_DBFS,
  CueStream,
  FADE_IN_S,
  MASTER_DBFS,
  MIN_FUNDAMENTAL_HZ,
  PAD_DBFS,
  PALETTE_MIDI,
  SIGNATURE_DEFAULT,
  SIGNATURE_MAX,
  SIGNATURE_MIN,
  clampSignatureLength,
  cueFingerprint,
  cueVoices,
  dbToGain,
  padVoices,
  sessionSoundPlan,
  signatureCues,
  worstCaseGain,
  SIGNATURE_TARGET_S,
  signatureSpanS,
  ceilingCurve,
  chainGain,
} from "@shared/sonicSignature";
import { SKIN_REGISTRY, hashSeed, midiToHz } from "@shared/arrivalSkins";

const C_MAJOR_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);
const seedFor = (userId: number) => hashSeed(`user:${userId}`);

describe("signature length", () => {
  it("defaults to 10 and clamps to 10..25", () => {
    expect(SIGNATURE_DEFAULT).toBe(10);
    expect(clampSignatureLength(undefined)).toBe(10);
    expect(clampSignatureLength(Number.NaN)).toBe(10);
    expect(clampSignatureLength(3)).toBe(SIGNATURE_MIN);
    expect(clampSignatureLength(99)).toBe(SIGNATURE_MAX);
    expect(clampSignatureLength(17.4)).toBe(17);
    expect(signatureCues(1, 3)).toHaveLength(10);
    expect(signatureCues(1, 40)).toHaveLength(25);
  });
});

describe("the signature: identical on every return", () => {
  it("is the same sequence for the same user every session", () => {
    const seed = seedFor(42);
    const a = sessionSoundPlan({ seed, sessionNumber: 1, houseVoicing: SKIN_REGISTRY.houseVoicing, skinVoicing: ["A3", "C4", "E4"] }).signature;
    const b = sessionSoundPlan({ seed, sessionNumber: 57, houseVoicing: SKIN_REGISTRY.houseVoicing, skinVoicing: ["G3", "B3", "D4"] }).signature;
    expect(b).toEqual(a);
    expect(a).toHaveLength(SIGNATURE_DEFAULT);
  });

  it("differs between users", () => {
    const sigs = [1, 2, 3, 4, 5, 6].map((u) => signatureCues(seedFor(u)).map(cueFingerprint).join("|"));
    expect(new Set(sigs).size).toBe(6);
  });

  it("opens and closes on C, the house tonic", () => {
    for (let u = 0; u < 30; u++) {
      const s = signatureCues(seedFor(u), 12 + (u % 14));
      expect(s[0].notes[0] % 12).toBe(0);
      expect(s[s.length - 1].notes[0] % 12).toBe(0);
    }
  });

  it("the default signature ends within about 8 seconds", () => {
    for (let u = 0; u < 200; u++) expect(signatureSpanS(signatureCues(seedFor(u)))).toBeLessThanOrEqual(SIGNATURE_TARGET_S);
  });

  it("is stable at every configured length", () => {
    for (const n of [10, 12, 18, 25]) expect(signatureCues(seedFor(7), n)).toEqual(signatureCues(seedFor(7), n));
  });

  it("indexes cues 0..N-1 and marks them as signature", () => {
    const s = signatureCues(seedFor(3), 15);
    s.forEach((c, i) => { expect(c.index).toBe(i); expect(c.phase).toBe("signature"); });
  });
});

describe("the stream: new each visit, never repeating within a visit", () => {
  it("continues the index after the signature and marks cues as stream", () => {
    const plan = sessionSoundPlan({ seed: seedFor(1), sessionNumber: 4, houseVoicing: ["C4", "E4", "G4"], skinVoicing: ["C4", "E4", "G4"] });
    const first = plan.stream.next();
    expect(first.index).toBe(SIGNATURE_DEFAULT);
    expect(first.phase).toBe("stream");
  });

  it("never repeats a cue, nor any signature cue, within a session", () => {
    for (let u = 0; u < 10; u++) {
      const sig = signatureCues(seedFor(u));
      const stream = new CueStream(seedFor(u), 3, sig);
      const fps = stream.take(400).map(cueFingerprint);
      expect(new Set(fps).size).toBe(fps.length);
      const reserved = new Set(sig.map(cueFingerprint));
      for (const fp of fps) expect(reserved.has(fp)).toBe(false);
    }
  });

  it("is different on the next visit", () => {
    const sig = signatureCues(seedFor(11));
    for (let s = 1; s < 20; s++) {
      const a = new CueStream(seedFor(11), s, sig).take(10).map(cueFingerprint).join("|");
      const b = new CueStream(seedFor(11), s + 1, sig).take(10).map(cueFingerprint).join("|");
      expect(a).not.toBe(b);
    }
  });

  it("is reproducible for the same user and session", () => {
    const sig = signatureCues(seedFor(5));
    expect(new CueStream(seedFor(5), 9, sig).take(30)).toEqual(new CueStream(seedFor(5), 9, sig).take(30));
  });

  it("keeps going past the palette's combinations without looping on one cue", () => {
    const stream = new CueStream(seedFor(2), 1, signatureCues(seedFor(2)));
    const cues = stream.take(3000);
    for (let i = 1; i < cues.length; i++) expect(cueFingerprint(cues[i])).not.toBe(cueFingerprint(cues[i - 1]));
  });
});

describe("palette and pitch", () => {
  it("every cue note is C major and at or above G3", () => {
    const sig = signatureCues(seedFor(8), 25);
    const cues = [...sig, ...new CueStream(seedFor(8), 2, sig).take(300)];
    for (const c of cues) for (const m of c.notes) {
      expect(C_MAJOR_PITCH_CLASSES.has(m % 12)).toBe(true);
      expect(PALETTE_MIDI).toContain(m);
      expect(midiToHz(m)).toBeGreaterThanOrEqual(MIN_FUNDAMENTAL_HZ);
    }
  });

  it("no sharp onsets: every cue ramps in over at least 20 ms", () => {
    const sig = signatureCues(seedFor(9), 25);
    for (const c of [...sig, ...new CueStream(seedFor(9), 1, sig).take(300)]) expect(c.attackS).toBeGreaterThanOrEqual(MIN_ATTACK_S);
    expect(MIN_ATTACK_S).toBeGreaterThanOrEqual(0.02);
  });

  it("cues never overlap: the next cue starts after this one ends", () => {
    const sig = signatureCues(seedFor(4), 25);
    for (const c of [...sig, ...new CueStream(seedFor(4), 1, sig).take(200)]) expect(c.nextInS).toBeGreaterThan(c.durationS);
  });

  it("the pad has no voice under 150 Hz on phones; desktop may add one octave down", () => {
    const phone = padVoices(["C4", "E4", "G4"]);
    expect(phone).toHaveLength(3);
    for (const v of phone) expect(v.hz).toBeGreaterThanOrEqual(MIN_FUNDAMENTAL_HZ);
    const desktop = padVoices(["C4", "E4", "G4"], { desktop: true });
    expect(desktop).toHaveLength(4);
    expect(desktop[0].hz).toBeCloseTo(midiToHz(48), 3);
  });
});

describe("levels (dBFS)", () => {
  it("states the house levels", () => {
    expect(MASTER_DBFS).toBeLessThanOrEqual(-24);
    expect(CUE_PEAK_DBFS).toBeLessThanOrEqual(-30);
    expect(PAD_DBFS).toBeLessThan(CUE_PEAK_DBFS);
    expect(FADE_IN_S).toBe(1);
  });

  it("each cue's voices sum to no more than -30 dBFS", () => {
    const sig = signatureCues(seedFor(6), 25);
    for (const c of [...sig, ...new CueStream(seedFor(6), 1, sig).take(300)]) {
      expect(c.peakDbfs).toBeLessThanOrEqual(CUE_PEAK_DBFS);
      const sum = cueVoices(c).reduce((s, v) => s + v.gain, 0);
      expect(sum).toBeLessThanOrEqual(dbToGain(CUE_PEAK_DBFS) + 1e-12);
      expect(sum).toBeCloseTo(dbToGain(c.peakDbfs), 12);
    }
  });

  it("the pad sums to PAD_DBFS (-38) on every device", () => {
    for (const desktop of [false, true]) {
      const sum = padVoices(["G3", "B3", "D4"], { desktop }).reduce((s, v) => s + v.gain, 0);
      expect(sum).toBeCloseTo(dbToGain(PAD_DBFS), 12);
    }
  });

  it("pad + loudest cue + an accent + the beat texture stays under the -24 dBFS master ceiling", () => {
    expect(PAD_DBFS).toBe(-38);
    expect(ACCENT_DBFS).toBeLessThanOrEqual(-40);
    expect(TEXTURE_HEADPHONES_DBFS).toBeLessThanOrEqual(-44);
    expect(worstCaseGain()).toBeLessThan(dbToGain(MASTER_DBFS));
    const accent = accentVoices(84).reduce((s, v) => s + v.gain, 0);
    expect(accent).toBeCloseTo(dbToGain(ACCENT_DBFS), 12);
  });
});

describe("output chain", () => {
  it("adds no gain: fader and ceiling are unity below the ceiling", () => {
    expect(chainGain()).toBe(1);
  });

  it("the renderer uses the ceiling curve, not the Web Audio compressor (which adds make-up gain)", () => {
    const src = readFileSync(new URL("../client/src/lib/arrivalSound.ts", import.meta.url), "utf8");
    expect(src).not.toMatch(/createDynamicsCompressor/);
    expect(src).toMatch(/createWaveShaper/);
    expect(src).toMatch(/ceilingCurve\(/);
  });

  it("the ceiling passes quiet samples unchanged and holds peaks at -24 dBFS", () => {
    const t = dbToGain(MASTER_DBFS);
    const curve = ceilingCurve();
    let max = 0;
    curve.forEach((y, i) => {
      const x = (i * 2) / (curve.length - 1) - 1;
      max = Math.max(max, Math.abs(y));
      if (Math.abs(x) <= t) expect(Math.abs(y - x)).toBeLessThan(1e-6);
    });
    expect(max).toBeLessThanOrEqual(t + 1e-7);
  });

  it("measured: everything at once, through the chain, peaks under -24 dBFS", () => {
    const peakDbfs = 20 * Math.log10(worstCaseGain() * chainGain());
    expect(peakDbfs).toBeLessThanOrEqual(MASTER_DBFS);
  });
});

describe("copy discipline", () => {
  // Sound here is design. No file in the feature may claim an effect on the brain or body.
  const FILES = [
    "../shared/sonicSignature.ts",
    "../shared/soundscapes.ts",
    "../client/src/lib/arrivalSound.ts",
    "../client/src/contexts/ArrivalSoundContext.tsx",
    "../client/src/components/ArrivalField.tsx",
  ];
  const BANNED: RegExp[] = [
    /binaural/i, /brain ?waves?/i, /entrain/i, /oxytocin/i, /dopamine/i, /cortisol/i, /serotonin/i,
    /\bcalm(ing|s|er)?\b/i, /sooth/i, /\bheal/i, /anxiety/i, /\bstress\b/i, /\bsleep\b/i, /\brelax/i, /\bmood\b/i,
    /\b(alpha|beta|theta|delta|gamma) (waves?|states?|rhythms?)\b/i, /\bfocus (mode|boost|music)\b/i, /\b(improv|enhanc|boost)\w* (focus|concentration|memory)\b/i,
    /\btherapeutic\b/i, /\bmedical\b/i,
  ];

  it("makes no brain, body or health claims and uses neutral names", () => {
    for (const f of FILES) {
      // The one allowed mention: the name of the site's existing audio module, imported only to share one mute.
      const src = readFileSync(new URL(f, import.meta.url), "utf8").replace(/\b(use)?Entrainment(Engine)?\b/g, "SITE_AUDIO");
      for (const re of BANNED) expect(re.test(src), `${f} matches ${re}`).toBe(false);
      expect(src).not.toContain("Math.random");
    }
  });
});
