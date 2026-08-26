import { describe, expect, it } from "vitest";
import { PRACTICE_EVIDENCE } from "./researchLibraryData";

describe("published research corrections", () => {
  it("uses the verified Marsh–Hau sample size in both description and source note", () => {
    const cluster = PRACTICE_EVIDENCE.find((entry) => entry.id === "big-fish-little-pond-rank-effect");
    expect(cluster).toBeDefined();
    expect(cluster!.description).toContain("106,579 students");
    expect(cluster!.description).not.toContain("103,558 students");
    expect(cluster!.sources.some((source) => source.note.includes("106,579 students"))).toBe(true);
    expect(cluster!.sources.every((source) => !source.note.includes("103,558 students"))).toBe(true);
  });
});
