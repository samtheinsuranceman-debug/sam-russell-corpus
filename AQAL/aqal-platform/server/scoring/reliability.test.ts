import { describe, it, expect } from "vitest";
import { stats, runTestRetest, type Scorer } from "./reliability";

describe("reliability — stats math", () => {
  it("computes mean, sd, cv on a known set", () => {
    const s = stats([2, 4, 4, 4, 5, 5, 7, 9]); // classic population-SD example
    expect(s.mean).toBe(5);
    expect(s.sd).toBeCloseTo(2, 6); // population SD
    expect(s.cv).toBeCloseTo(0.4, 6);
    expect(s.min).toBe(2);
    expect(s.max).toBe(9);
    expect(s.n).toBe(8);
  });

  it("is NaN-safe on empty and zero-mean inputs", () => {
    expect(stats([]).sd).toBe(0);
    expect(stats([0, 0, 0]).cv).toBe(0);
  });
});

describe("reliability — test-retest harness", () => {
  it("reports zero variance for a perfectly stable scorer", async () => {
    const stable: Scorer = async () => [
      { axisName: "Logical", score: 0.6, confidence: 0.8 },
      { axisName: "Spatial", score: 0.4, confidence: 0.7 },
    ];
    const r = await runTestRetest(stable, 5);
    expect(r.runs).toBe(5);
    expect(r.summary.axes).toBe(2);
    expect(r.summary.maxScoreSd).toBe(0);
    expect(r.summary.unstableAxes).toEqual([]);
    expect(r.perAxis.Logical.score.mean).toBeCloseTo(0.6, 6);
  });

  it("flags an unstable axis and leaves a stable one alone", async () => {
    let i = 0;
    // "Wobble" alternates 0.2/0.8 (high SD); "Steady" is constant 0.5 (SD 0).
    const scorer: Scorer = async () => {
      const wobble = i++ % 2 === 0 ? 0.2 : 0.8;
      return [
        { axisName: "Wobble", score: wobble, confidence: 0.5 },
        { axisName: "Steady", score: 0.5, confidence: 0.9 },
      ];
    };
    const r = await runTestRetest(scorer, 6, { unstableSdThreshold: 0.1 });
    expect(r.summary.unstableAxes).toContain("Wobble");
    expect(r.summary.unstableAxes).not.toContain("Steady");
    expect(r.perAxis.Steady.score.sd).toBe(0);
    expect(r.perAxis.Wobble.score.sd).toBeGreaterThan(0.25);
  });
});
