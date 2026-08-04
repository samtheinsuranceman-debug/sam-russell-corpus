import { describe, it, expect } from "vitest";
import { keystoneForLine } from "./keystonePractices";

describe("keystoneForLine", () => {
  it("maps canonical line names to a genuinely-matching practice", () => {
    expect(keystoneForLine("Interoceptive")?.id).toBe("interoception");
    expect(keystoneForLine("Financial-Self-Management")?.id).toBeTruthy();
    expect(keystoneForLine("Kinesthetic")?.id).toBe("resistance-training");
    expect(keystoneForLine("Existential")?.id).toBe("purpose");
  });

  it("is case-insensitive", () => {
    expect(keystoneForLine("volitional")?.lifts).toContain("volitional");
  });

  it("returns undefined for lines with no honest practice match (no forced fit)", () => {
    // These lines aren't in any practice's lifts — better to show nothing.
    expect(keystoneForLine("Musical")).toBeUndefined();
    expect(keystoneForLine("Seduction")).toBeUndefined();
    expect(keystoneForLine("")).toBeUndefined();
  });
});
