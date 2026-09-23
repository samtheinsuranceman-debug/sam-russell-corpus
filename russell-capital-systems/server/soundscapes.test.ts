import { describe, expect, it } from "vitest";
import {
  BEAT_DIFF_MAX_HZ,
  BEAT_DIFF_MIN_HZ,
  PAGE_VOICINGS,
  SOUNDSCAPE_CROSSFADE_S,
  accentDelays,
  beatTones,
  normalizeRoute,
  silenceReasonFor,
  soundscapeFor,
  streamGapS,
} from "@shared/soundscapes";
import { hashSeed, midiToHz, noteToMidi } from "@shared/arrivalSkins";
import { CueStream, TEXTURE_HEADPHONES_DBFS, TEXTURE_SPEAKERS_DBFS, signatureCues } from "@shared/sonicSignature";

const seed = hashSeed("signature-user:42");
const PAGES = ["/portal/client", "/portal/physician", "/portal/advisor", "/portal/chain", "/portal/mortgage-killer", "/portal/my-journey", "/portal/income-for-life", "/portal/zip-engine", "/portal/outside-forces", "/portal/dashboard", "/portal/clients", "/portal/strategy", "/portal/the-mirror", "/portal/site-map", "/calculators", "/ultra-calculator"];

describe("routes", () => {
  it("normalises query, hash, case, trailing slash and ids", () => {
    expect(normalizeRoute("/Portal/Client/?talk=1#x")).toBe("/portal/client");
    expect(normalizeRoute("/portal/clients/123")).toBe("/portal/clients/:id");
    expect(normalizeRoute("/portal/clients/3f2b8c1e-1234-4abc-9def-001122334455")).toBe("/portal/clients/:id");
    expect(normalizeRoute("")).toBe("/");
  });
});

describe("page soundscapes", () => {
  it("are deterministic per household and page", () => {
    for (const p of PAGES) expect(soundscapeFor(p, seed)).toEqual(soundscapeFor(p, seed));
    expect(soundscapeFor("/portal/clients/1", seed)).toEqual(soundscapeFor("/portal/clients/99", seed));
  });

  it("give each page its own character", () => {
    const ids = PAGES.map((p) => soundscapeFor(p, seed).id);
    expect(new Set(ids).size).toBe(PAGES.length);
    const characters = PAGES.map((p) => { const s = soundscapeFor(p, seed); return JSON.stringify([s.voicing, s.restScale, s.wave, s.brightnessHz, s.accentEveryS, s.beat]); });
    expect(new Set(characters).size).toBeGreaterThanOrEqual(PAGES.length - 1);
    // Pads, rhythms and textures all vary across the site.
    expect(new Set(PAGES.map((p) => soundscapeFor(p, seed).voicing.join())).size).toBeGreaterThan(4);
    expect(new Set(PAGES.map((p) => soundscapeFor(p, seed).restScale)).size).toBeGreaterThan(2);
    expect(new Set(PAGES.map((p) => soundscapeFor(p, seed).wave)).size).toBe(2);
  });

  it("differ between households on the same page", () => {
    const other = hashSeed("signature-user:43");
    const differing = PAGES.filter((p) => soundscapeFor(p, seed).id !== soundscapeFor(p, other).id);
    expect(differing.length).toBe(PAGES.length);
  });

  it("let the arrival page wear the skin's voicing", () => {
    expect(soundscapeFor("/portal/client", seed, { voicing: ["A3", "C4", "E4"] }).voicing).toEqual(["A3", "C4", "E4"]);
  });

  it("use only C-major pad voicings with no note under 150 Hz", () => {
    for (const v of PAGE_VOICINGS) for (const n of v) {
      expect([0, 2, 4, 5, 7, 9, 11]).toContain(noteToMidi(n) % 12);
      expect(midiToHz(noteToMidi(n))).toBeGreaterThanOrEqual(150);
    }
  });

  it("crossfade over 1.5 s", () => {
    expect(SOUNDSCAPE_CROSSFADE_S).toBe(1.5);
  });

  it("space accents irregularly around the page's interval", () => {
    const s = soundscapeFor("/portal/chain", seed);
    const d = accentDelays(s, 12);
    expect(d).toEqual(accentDelays(s, 12));
    for (const x of d) { expect(x).toBeGreaterThanOrEqual(s.accentEveryS * 0.8 - 0.01); expect(x).toBeLessThanOrEqual(s.accentEveryS * 1.2 + 0.01); }
    expect(new Set(d).size).toBeGreaterThan(1);
  });

  it("change the rhythm without ever letting stream cues overlap", () => {
    const sig = signatureCues(seed);
    const cues = new CueStream(seed, 1, sig).take(300);
    for (const p of PAGES) {
      const s = soundscapeFor(p, seed);
      for (const c of cues) expect(streamGapS(c, s)).toBeGreaterThan(c.durationS);
    }
  });
});

describe("beat texture", () => {
  it("uses carriers between 200 and 450 Hz, 4 to 12 Hz apart", () => {
    for (let u = 0; u < 40; u++) for (const p of PAGES) {
      const [lo, hi] = beatTones(soundscapeFor(p, hashSeed(`signature-user:${u}`)));
      expect(lo).toBeGreaterThanOrEqual(200);
      expect(hi).toBeLessThanOrEqual(450);
      expect(hi - lo).toBeGreaterThanOrEqual(BEAT_DIFF_MIN_HZ);
      expect(hi - lo).toBeLessThanOrEqual(BEAT_DIFF_MAX_HZ);
      expect(Number.isInteger(hi - lo) || Math.abs(Math.round(hi - lo) - (hi - lo)) < 1e-9).toBe(true);
    }
  });

  it("is quieter on speakers than on headphones", () => {
    expect(TEXTURE_SPEAKERS_DBFS).toBeLessThan(TEXTURE_HEADPHONES_DBFS);
  });
});

describe("silent pages", () => {
  it("sign-in, consent and intake", () => {
    for (const p of ["/login", "/register", "/forgot-password", "/trial", "/onboarding", "/portal/onboarding", "/portal/welcome", "/portal/client-intake", "/fact-finder", "/portal/financial-assessment", "/portal/wealth-genome", "/portal/onboarding-quiz"]) {
      expect(silenceReasonFor(p), p).not.toBeNull();
    }
    expect(silenceReasonFor("/login")).toBe("sign-in");
    expect(silenceReasonFor("/portal/client-intake")).toBe("consent-intake");
  });

  it("money-decision pages", () => {
    for (const p of ["/pricing", "/portal/billing", "/portal/quotes", "/portal/quick-quote", "/portal/deal-room", "/portal/fee-transparency", "/portal/tax-waterfall", "/portal/nii-surtax", "/portal/legal-payment-folder", "/portal/cross-purchase"]) {
      expect(silenceReasonFor(p), p).toBe("money-decision");
    }
  });

  it("voice pages, where the advisor speaks", () => {
    for (const p of ["/portal/whisperer", "/portal/voice", "/portal/ai-advisor", "/portal/advisor-chat"]) expect(silenceReasonFor(p), p).toBe("voice");
  });

  it("leaves ordinary pages, including the three dashboards, free to carry sound", () => {
    for (const p of PAGES) expect(silenceReasonFor(p), p).toBeNull();
  });
});
