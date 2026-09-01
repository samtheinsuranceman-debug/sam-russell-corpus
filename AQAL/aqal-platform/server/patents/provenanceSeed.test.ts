// Contract tests for the research-provenance seed: every one of the 32 lines
// maps to a real research tradition, and the honesty rules hold — no invented
// DOIs, no empty author lists, no duplicate or out-of-range axis indices.
import { describe, expect, it } from "vitest";
import { PROVENANCE_SEED } from "./provenanceSeed";
import { ALL_AXES } from "../../shared/axisModes";

describe("research provenance seed", () => {
  it("covers exactly the 32 lines, one row per axis", () => {
    expect(ALL_AXES.length).toBe(32);
    expect(PROVENANCE_SEED.length).toBe(32);
    const indices = PROVENANCE_SEED.map((r) => r.axisIndex).sort((a, b) => a - b);
    expect(indices).toEqual(Array.from({ length: 32 }, (_, i) => i));
  });

  it("names a real tradition and scholars on every row", () => {
    for (const row of PROVENANCE_SEED) {
      expect(row.theoryName.length).toBeGreaterThan(10);
      expect(row.authors.length).toBeGreaterThan(0);
      for (const a of row.authors) expect(a.trim().length).toBeGreaterThan(2);
    }
  });

  it("never invents a DOI — doi is strictly null on every row", () => {
    for (const row of PROVENANCE_SEED) expect(row.doi).toBeNull();
  });

  it("marks every tradition as resting on peer-reviewed literature", () => {
    for (const row of PROVENANCE_SEED) expect(row.peerReviewed).toBe(true);
  });
});
