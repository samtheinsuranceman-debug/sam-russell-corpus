import { describe, it, expect } from "vitest";
import { practicesForGoals, corePractices, KEYSTONE_PRACTICES, buildProjections, confidenceFromEvidence } from "@shared/keystonePractices";

describe("keystone practices — goal-matched prescriptions", () => {
  it("surfaces the couples practices for a marriage goal", () => {
    const p = practicesForGoals("I want to save my marriage and be a better husband");
    const ids = p.map((x) => x.id);
    expect(ids).toContain("relationship-media");
    expect(ids).toContain("relationship-education");
  });

  it("surfaces parenting practice for a parenting goal", () => {
    const ids = practicesForGoals("be a more present parent to my kids").map((x) => x.id);
    expect(ids).toContain("parenting");
  });

  it("returns nothing for empty goals (falls back to core elsewhere)", () => {
    expect(practicesForGoals("")).toEqual([]);
  });

  it("core practices are always available and non-empty", () => {
    const core = corePractices();
    expect(core.length).toBeGreaterThanOrEqual(3);
    expect(core.map((p) => p.id)).toContain("sleep");
  });

  it("every practice references a real library section and carries an evidence tier", () => {
    for (const p of KEYSTONE_PRACTICES) {
      expect(["Strong", "Moderate", "Emerging"]).toContain(p.evidence);
      expect(p.section.length).toBeGreaterThan(0);
      expect(p.prescription.length).toBeGreaterThan(10);
    }
  });

  it("the psychedelic entry is documented, not action-prescribed", () => {
    const psy = KEYSTONE_PRACTICES.find((p) => p.id === "psychedelic");
    expect(psy?.prescription.toLowerCase()).toContain("not prescribe");
  });

  it("confidence maps honestly: Strong->High, Moderate->Moderate, Emerging->Low", () => {
    expect(confidenceFromEvidence("Strong")).toBe("High");
    expect(confidenceFromEvidence("Moderate")).toBe("Moderate");
    expect(confidenceFromEvidence("Emerging")).toBe("Low");
  });

  it("projections for a marriage goal are research-grounded and confidence-tiered", () => {
    const proj = buildProjections("save my marriage");
    expect(proj.length).toBeGreaterThan(0);
    const media = proj.find((p) => p.practice.includes("relationship media"));
    expect(media).toBeTruthy();
    expect(media!.confidence).toBe("High"); // Rogge is Strong evidence
    expect(media!.researchBasis.length).toBeGreaterThan(20);
    expect(media!.horizon.length).toBeGreaterThan(0);
  });

  it("empty goals fall back to core practices in projections (never empty)", () => {
    const proj = buildProjections("");
    expect(proj.length).toBeGreaterThan(0);
  });
});
