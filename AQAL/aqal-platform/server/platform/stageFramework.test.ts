import { describe, it, expect } from "vitest";
import {
  STAGE_LADDER,
  STAGE_FRAMEWORK_VERSION,
  stageFrameworkText,
  loadFrameworkCorpus,
  frameworkCorpusAvailable,
} from "./stageFramework";

// The stage ladder is the developmental-altitude manual the panel uses to place
// each of the 32 lines. These tests lock its structural integrity.
describe("AQAL stage-development framework", () => {
  it("has the nine action logics, low → high", () => {
    expect(STAGE_LADDER.length).toBe(9);
    expect(STAGE_LADDER[0].name).toBe("Impulsive");
    expect(STAGE_LADDER[STAGE_LADDER.length - 1].name).toBe("Unitive");
  });

  it("has strictly monotonic, non-overlapping score bands spanning 0..1", () => {
    let prevHi = 0;
    for (const s of STAGE_LADDER) {
      const [lo, hi] = s.band;
      expect(hi).toBeGreaterThan(lo);
      expect(lo).toBeGreaterThanOrEqual(prevHi - 1e-9); // bands ascend, no backtracking
      prevHi = hi;
    }
    expect(STAGE_LADDER[0].band[0]).toBeGreaterThanOrEqual(0);
    expect(STAGE_LADDER[STAGE_LADDER.length - 1].band[1]).toBe(1.0);
  });

  it("gives every stage an action logic, spiral band, and an underwriting cue", () => {
    for (const s of STAGE_LADDER) {
      expect(s.actionLogic.length).toBeGreaterThan(2);
      expect(s.spiral.length).toBeGreaterThan(2);
      expect(s.cue.trim().length).toBeGreaterThan(15);
    }
  });

  it("renders rubric text with version, all stages, and the no-inflation rules", () => {
    const t = stageFrameworkText();
    expect(t).toContain(`v${STAGE_FRAMEWORK_VERSION}`);
    for (const s of STAGE_LADDER) expect(t).toContain(s.name);
    expect(t).toContain("Do not inflate");
    expect(t).toContain("A person is not one stage");
  });

  it("loads the full private corpus from disk in this repo", () => {
    // The corpus file is committed under server/platform/data; in the repo it must resolve.
    expect(frameworkCorpusAvailable()).toBe(true);
    const corpus = loadFrameworkCorpus();
    expect(corpus).toBeTruthy();
    expect((corpus as string).length).toBeGreaterThan(100000);
    expect(corpus as string).toContain("ego development");
  });
});
