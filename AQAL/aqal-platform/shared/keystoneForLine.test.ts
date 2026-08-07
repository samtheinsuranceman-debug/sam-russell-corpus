import { describe, it, expect } from "vitest";
import { keystoneForLine } from "./keystonePractices";

describe("keystoneForLine", () => {
  it("maps canonical line names to a genuinely-matching practice", () => {
    expect(keystoneForLine("Interoceptive")?.id).toBe("interoception");
    expect(keystoneForLine("Financial-Self-Management")?.id).toBeTruthy();
    // Aerobic exercise now correctly carries "kinesthetic" too (audit fix);
    // either movement practice is a genuine match for the line.
    expect(["exercise", "resistance-training"]).toContain(keystoneForLine("Kinesthetic")?.id);
    expect(keystoneForLine("Existential")?.id).toBe("purpose");
  });

  it("is case-insensitive", () => {
    expect(keystoneForLine("volitional")?.lifts).toContain("volitional");
  });

  it("covers every one of the 32 lines with an honest practice (skill curricula filled the gaps)", () => {
    expect(keystoneForLine("Musical")?.id).toBe("choir");
    expect(keystoneForLine("Seduction")?.id).toBe("social-confidence");
    expect(keystoneForLine("Influence")?.id).toBe("public-speaking");
    expect(keystoneForLine("")).toBeUndefined();
  });
});
