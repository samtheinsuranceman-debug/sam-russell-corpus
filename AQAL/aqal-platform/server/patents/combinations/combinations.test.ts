// Sister-patent combinations: the registry and the combinators must agree —
// every registered combination resolves to a real exported combinator with
// the registered engine set, and combinators produce ledger-shaped output.
import { describe, expect, it } from "vitest";
import * as combinators from "./index";
import { SISTER_COMBINATIONS, getCombination } from "./registry";

describe("sister-patent combinations", () => {
  it("registers exactly 26 active combinations (17 sister + 9 six-AI additions) with unique ids and names", () => {
    expect(SISTER_COMBINATIONS).toHaveLength(26);
    expect(new Set(SISTER_COMBINATIONS.map((c) => c.id)).size).toBe(26);
    expect(new Set(SISTER_COMBINATIONS.map((c) => c.name)).size).toBe(26);
  });

  it("every registered combinator exists as an exported function", () => {
    for (const c of SISTER_COMBINATIONS) {
      const fn = (combinators as Record<string, unknown>)[c.combinator];
      expect(typeof fn, `${c.name} -> ${c.combinator}`).toBe("function");
    }
  });

  it("a combinator returns its name, engines, and result payload", async () => {
    const out = await combinators.voiceWeakness(7, { pitchMeanHz: 180 }, { axisIndex: 3, score: 0.2 });
    expect(out.combination).toBe("Voice-Based Weakness Identification");
    expect(out.engines).toEqual(["voice", "weakness"]);
    expect((out.result as any).userId).toBe(7);
  });

  it("getCombination resolves by id", () => {
    expect(getCombination(17)?.name).toBe("Full-Spectrum Integral AI Coaching");
    expect(getCombination(99)).toBeUndefined();
  });

  it("six-AI additions carry the required safety gates in their output", async () => {
    const out = await combinators.voiceDrivenCognitiveAssessment(3, { pitchMeanHz: 200 }, [0.6, 0.7]);
    expect((out.result as any).safetyGates).toContain("non-clinical");
    expect((out.result as any).safetyGates).toContain("no medical claims");
  });
});
