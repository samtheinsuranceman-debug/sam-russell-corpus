import { describe, it, expect } from "vitest";
import {
  LINE_CUES,
  UNDERWRITING_GUIDE_VERSION,
  underwritingGuideText,
  withUnderwritingGuide,
} from "./underwritingGuide";
import { ALL_AXES } from "@shared/axisModes";

// The underwriting guide is the private manual the scoring panel follows. These
// tests lock its integrity: one cue per line, in canonical order, and the honesty
// disciplines present in the injected system text.
describe("underwriting guide", () => {
  it("has exactly one cue per intelligence line, in ALL_AXES order", () => {
    expect(LINE_CUES.length).toBe(ALL_AXES.length);
    expect(LINE_CUES.map((c) => c.line)).toEqual(ALL_AXES);
  });

  it("gives every line both a HIGH and a STARVED marker", () => {
    for (const c of LINE_CUES) {
      expect(c.high.trim().length).toBeGreaterThan(10);
      expect(c.starved.trim().length).toBeGreaterThan(10);
    }
  });

  it("renders the guide text with version, every line, and the honesty disciplines", () => {
    const text = underwritingGuideText();
    expect(text).toContain(`v${UNDERWRITING_GUIDE_VERSION}`);
    for (const line of ALL_AXES) expect(text).toContain(line);
    // core honesty rules must survive any future edit
    expect(text).toContain("Never inflate");
    expect(text).toContain("UNEVEN");
    expect(text).toContain("lowers your CONFIDENCE");
    expect(text).toContain("INDIRECTLY");
  });

  it("prepends the guide ahead of the base system instruction", () => {
    const base = "You are a rigorous developmental psychologist.";
    const merged = withUnderwritingGuide(base);
    expect(merged.indexOf("UNDERWRITING GUIDE")).toBeLessThan(merged.indexOf(base));
    expect(merged).toContain(base);
  });

  it("injects the AQAL stage-development ladder alongside the line cues", () => {
    const merged = withUnderwritingGuide("BASE");
    expect(merged).toContain("STAGE-DEVELOPMENT FRAMEWORK");
    expect(merged).toContain("Achiever");
    expect(merged).toContain("Strategist");
  });
});
