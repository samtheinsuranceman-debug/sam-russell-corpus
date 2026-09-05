// ============================================================
// Tests for the integrated patent modules delivered in the
// AQAL_Integrated_Codebase drop: controlling-weakness argmin,
// multiplicative rarity (incl. its documented saturation limit),
// and the pure-DSP voice feature pipeline on synthetic audio.
// ============================================================
import { describe, expect, it } from "vitest";
import { controllingWeakness } from "../scoring/controllingWeakness";
import { multiplicativeRarity, geometricMeanRarityFallback } from "../scoring/multiplicativeRarity";
import { extractVoiceFeatures } from "./voiceFeatures";

describe("controlling-weakness argmin", () => {
  it("finds the minimum line and its constraint impact", () => {
    const vector = Array(32).fill(0.7);
    vector[13] = 0.2;
    const r = controllingWeakness(vector)!;
    expect(r.axisIndex).toBe(13);
    expect(r.score).toBe(0.2);
    expect(r.constraintImpact).toBeCloseTo(vector.reduce((a, b) => a + b, 0) / 32 - 0.2, 6);
  });

  it("handles empty input", () => {
    expect(controllingWeakness([])).toBeNull();
  });
});

describe("multiplicative rarity (unwired engine)", () => {
  const scores32 = Array.from({ length: 32 }, (_, i) => ({ axisIndex: i, score: 0.6, confidence: 0.8 }));

  it("floor-gates: a verified floor lifts a lower soft estimate", () => {
    const low = multiplicativeRarity([{ axisIndex: 0, score: 0.3 }], []);
    const floored = multiplicativeRarity([{ axisIndex: 0, score: 0.3 }], [{ axisIndex: 0, floor: 0.8 }]);
    expect(floored).toBeGreaterThan(low);
  });

  it("documents its own saturation: a typical full profile hits the cap", () => {
    // This is the reason the engine is NOT wired to any displayed number.
    expect(multiplicativeRarity(scores32, [{ axisIndex: 0, floor: 0.1 }])).toBe(1_000_000);
  });

  it("fallback stays bounded and modest for the same profile", () => {
    const fb = geometricMeanRarityFallback(scores32);
    expect(fb).toBeGreaterThanOrEqual(1);
    expect(fb).toBeLessThan(10);
  });
});

describe("voice feature extractor (gated, pure-DSP path)", () => {
  function sine(freq: number, seconds: number, sampleRate = 16000): Float32Array {
    const n = Math.floor(seconds * sampleRate);
    const pcm = new Float32Array(n);
    for (let i = 0; i < n; i++) pcm[i] = 0.5 * Math.sin((2 * Math.PI * freq * i) / sampleRate);
    return pcm;
  }

  it("recovers the pitch of a synthetic 220 Hz tone within 10%", async () => {
    const f = await extractVoiceFeatures(sine(220, 1.0), 16000, "one two three four");
    expect(f.pitchMeanHz).toBeGreaterThan(198);
    expect(f.pitchMeanHz).toBeLessThan(242);
    expect(f.rmsEnergyMean).toBeGreaterThan(0.1);
  });

  it("silence produces no voiced pitch and near-zero energy", async () => {
    const f = await extractVoiceFeatures(new Float32Array(16000), 16000, "");
    expect(f.rmsEnergyMean).toBeLessThan(0.01);
    expect(f.pitchMeanHz).toBe(0);
  });
});
