import { describe, expect, it } from "vitest";
import { parseVisionReply, signalsFromVision, toneFromEnergy, FRAME_INTERVAL_MS, MAX_FRAME_BASE64 } from "@shared/nlp/signals";

describe("companion signals", () => {
  it("parses a vision reply, clamps scores, and drops no-face frames", () => {
    expect(parseVisionReply('Sure: {"summary":"leaning in, relaxed","score":1.7,"attention":0.9}')).toEqual({ summary: "leaning in, relaxed", score: 1, attention: 0.9 });
    expect(parseVisionReply("no json here")).toBeNull();
    expect(parseVisionReply('{"summary":"x","score":"nope"}')!.score).toBe(0);
    const s = signalsFromVision(parseVisionReply('{"summary":"arms crossed, turned away","score":-0.6,"attention":0.3}'), 1000);
    expect(s?.length).toBe(2);
    expect(s?.[0].kind).toBe("body");
    expect(s?.[1].value).toBe("far away");
    expect(signalsFromVision(parseVisionReply('{"summary":"no face visible","score":0,"attention":0}'), 1)).toBeNull();
    expect(signalsFromVision(null, 1)).toBeNull();
  });
  it("reads tone from microphone energy without a model", () => {
    expect(toneFromEnergy([0.1, 0.1], 1)).toBeNull();
    expect(toneFromEnergy([0.001, 0.002, 0.001, 0.003, 0.002, 0.001], 1)?.value).toMatch(/silent/);
    expect(toneFromEnergy([0.08, 0.09, 0.08, 0.1, 0.09, 0.08, 0.09], 1)?.value).toMatch(/steady/);
    expect(toneFromEnergy([0.05, 0.6, 0.02, 0.7, 0.01, 0.5, 0.03], 1)?.value).toMatch(/spikes/);
    expect(toneFromEnergy([NaN, 5, -1, 0.04, 0.04, 0.04, 0.04, 0.04], 1)).not.toBeNull();
  });
  it("keeps the frame budget sane", () => {
    expect(FRAME_INTERVAL_MS).toBeGreaterThanOrEqual(10_000);
    expect(MAX_FRAME_BASE64).toBeLessThanOrEqual(500_000);
  });
});
