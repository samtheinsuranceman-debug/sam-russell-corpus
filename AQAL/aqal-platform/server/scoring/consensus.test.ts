import { describe, it, expect } from "vitest";
import { trimmedMean, agreement, consensusScores, type AxisScore } from "./consensus";

describe("multi-AI consensus", () => {
  it("trimmedMean drops one high + one low when n>=4", () => {
    // 0.1 (low) and 0.9 (high) dropped → mean of [0.5,0.5] = 0.5
    expect(trimmedMean([0.1, 0.5, 0.5, 0.9])).toBeCloseTo(0.5, 5);
    // an outlier can't dominate
    expect(trimmedMean([0.5, 0.5, 0.5, 0.5, 0.99])).toBeLessThan(0.6);
  });

  it("trimmedMean is a plain mean for <4 values", () => {
    expect(trimmedMean([0.4, 0.6])).toBeCloseTo(0.5, 5);
    expect(trimmedMean([])).toBe(0);
  });

  it("agreement is high when models cluster, low when they scatter", () => {
    expect(agreement([0.5, 0.5, 0.5])).toBeCloseTo(1, 5);
    expect(agreement([0.1, 0.9])).toBeLessThan(0.2);
    expect(agreement([0.7])).toBe(0.5); // single model = neutral
  });

  const mk = (score: number, confidence = 0.7): AxisScore[] => [
    { axisIndex: 0, axisName: "Logical", score, confidence },
    { axisIndex: 1, axisName: "Existential", score: score * 0.9, confidence },
  ];

  it("single model passes through unchanged", () => {
    const one = mk(0.8);
    expect(consensusScores([one])).toEqual(one);
  });

  it("consensus averages agreeing models and reports high confidence", () => {
    const out = consensusScores([mk(0.8), mk(0.8), mk(0.8)]);
    expect(out[0].score).toBeCloseTo(0.8, 5);
    expect(out[0].confidence).toBeGreaterThan(0.6); // agreement lifts confidence
    expect(out[0].reasoning).toContain("Consensus of 3 models");
  });

  it("divergent models pull confidence DOWN even if score is mid", () => {
    const agreeOut = consensusScores([mk(0.8), mk(0.8), mk(0.8)]);
    const divergeOut = consensusScores([mk(0.2), mk(0.5), mk(0.8)]);
    expect(divergeOut[0].confidence).toBeLessThan(agreeOut[0].confidence);
  });

  it("an outlier model can't hijack the consensus score", () => {
    const out = consensusScores([mk(0.5), mk(0.5), mk(0.5), mk(0.5), mk(0.98)]);
    expect(out[0].score).toBeLessThan(0.6); // trimmed away
  });
});
