// The site must always know whose voice it is speaking in, and must never
// claim a confirmation it did not get.
import { describe, it, expect } from "vitest";
import {
  FOUNDER_VOICE, PROVIDER_KEYS, DEFAULT_PROVIDER, ADVISORY_VOICE_SETTINGS, MANIFESTO_VOICE_SETTINGS,
  selectedProvider, voiceIdFor, apiKeyFor, speechDelivery, nameMatches, statusMessage,
} from "@shared/voiceIdentity";

describe("the named voice", () => {
  it("is the founder, with the provenance recorded", () => {
    expect(FOUNDER_VOICE.displayName).toBe("Samuel Andrew Russell V");
    expect(FOUNDER_VOICE.provenance).toBe("heygen");
  });

  it("holds no id or key — those live in the host environment only", () => {
    const text = JSON.stringify(FOUNDER_VOICE);
    expect(text).not.toMatch(/[A-Za-z0-9]{24,}/);
  });

  it("matches the names a provider might actually have stored", () => {
    for (const n of ["Samuel Andrew Russell V", "samuel andrew russell v", "Samuel A. Russell V", "Sam Russell"]) {
      expect(nameMatches(FOUNDER_VOICE, n), n).toBe(true);
    }
  });

  it("does not match somebody else", () => {
    for (const n of ["Rachel", "Adam", "Samuel Jackson", "", null, undefined]) {
      expect(nameMatches(FOUNDER_VOICE, n as string), String(n)).toBe(false);
    }
  });

  it("uses steadier settings for an answer than for a speech", () => {
    expect(ADVISORY_VOICE_SETTINGS.stability).toBeGreaterThan(MANIFESTO_VOICE_SETTINGS.stability);
    expect(ADVISORY_VOICE_SETTINGS.style).toBeLessThan(MANIFESTO_VOICE_SETTINGS.style);
  });
});

describe("provider selection — the host carries both sets of variables", () => {
  it("defaults to ElevenLabs when VOICE_PROVIDER is unset or unrecognised", () => {
    expect(selectedProvider({})).toBe(DEFAULT_PROVIDER);
    expect(selectedProvider({ VOICE_PROVIDER: "" })).toBe("elevenlabs");
    expect(selectedProvider({ VOICE_PROVIDER: "something-else" })).toBe("elevenlabs");
  });

  it("honours heygen, case and whitespace insensitively", () => {
    expect(selectedProvider({ VOICE_PROVIDER: "heygen" })).toBe("heygen");
    expect(selectedProvider({ VOICE_PROVIDER: "  HeyGen " })).toBe("heygen");
  });

  it("reads the right variables for each provider", () => {
    const env = { ELEVENLABS_API_KEY: "e", ELEVENLABS_VOICE_ID: "ev", HEYGEN_API_KEY: "h", HEYGEN_VOICE_ID: "hv" };
    expect(apiKeyFor("elevenlabs", env)).toBe("e");
    expect(voiceIdFor("elevenlabs", env)).toBe("ev");
    expect(apiKeyFor("heygen", env)).toBe("h");
    expect(voiceIdFor("heygen", env)).toBe("hv");
  });

  it("names HEYGEN_VOICE_NAME as a HeyGen variable, so the owner's setting is not orphaned", () => {
    expect(PROVIDER_KEYS.heygen.voiceName).toBe("HEYGEN_VOICE_NAME");
  });
});

describe("speech delivery", () => {
  it("always comes from ElevenLabs, whichever provider owns the identity", () => {
    expect(speechDelivery({ ELEVENLABS_API_KEY: "k", ELEVENLABS_VOICE_ID: "v" })).toEqual({ apiKey: "k", voiceId: "v" });
  });

  it("is null when either half is missing, so the caller falls back and says so", () => {
    expect(speechDelivery({ ELEVENLABS_API_KEY: "k" })).toBeNull();
    expect(speechDelivery({ ELEVENLABS_VOICE_ID: "v" })).toBeNull();
    expect(speechDelivery({})).toBeNull();
  });

  it("is not satisfied by HeyGen variables alone", () => {
    expect(speechDelivery({ HEYGEN_API_KEY: "k", HEYGEN_VOICE_ID: "v" })).toBeNull();
  });
});

describe("what the owner is told", () => {
  const base = { intendedName: FOUNDER_VOICE.displayName, provenance: FOUNDER_VOICE.provenance } as const;

  it("names the exact variables to set when nothing is configured", () => {
    const m = statusMessage({ ...base, provider: "heygen", configured: false, canSpeak: false, providerName: null, verified: false });
    expect(m).toContain("HEYGEN_API_KEY");
    expect(m).toContain("HEYGEN_VOICE_ID");
  });

  it("explains the split when the identity is configured but nothing can speak", () => {
    const m = statusMessage({ ...base, provider: "heygen", configured: true, canSpeak: false, providerName: null, verified: false });
    expect(m).toMatch(/audio is delivered by ElevenLabs/i);
    expect(m).toMatch(/browser's own speech/i);
  });

  it("confirms a verified voice and says who delivers it", () => {
    const m = statusMessage({ ...base, provider: "heygen", configured: true, canSpeak: true, providerName: "Samuel Andrew Russell V", verified: true });
    expect(m).toContain("Samuel Andrew Russell V");
    expect(m).toMatch(/delivered by ElevenLabs/i);
  });

  it("shouts about a mismatch rather than speaking as a stranger quietly", () => {
    const m = statusMessage({ ...base, provider: "elevenlabs", configured: true, canSpeak: true, providerName: "Rachel", verified: false });
    expect(m).toContain("MISMATCH");
    expect(m).toContain("Rachel");
    expect(m).toContain("ELEVENLABS_VOICE_ID");
  });

  it("says unverified — not confirmed — when the provider could not be reached", () => {
    const m = statusMessage({ ...base, provider: "elevenlabs", configured: true, canSpeak: true, providerName: null, verified: false });
    expect(m).toMatch(/unverified/i);
    expect(m).not.toMatch(/confirmed against/i);
  });
});
