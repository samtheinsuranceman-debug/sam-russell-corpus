import { describe, it, expect } from "vitest";
import { THERAPY_LINE_MAP, therapiesForLine, THERAPY_GAP_LINES } from "./therapyLineMap";
import { ALL_AXES } from "./axisModes";

describe("therapy-line map", () => {
  it("every mapped line is a real axis", () => {
    for (const e of THERAPY_LINE_MAP) expect(ALL_AXES).toContain(e.line);
  });
  it("gap lines are real axes with no mappings", () => {
    for (const g of THERAPY_GAP_LINES) {
      expect(ALL_AXES).toContain(g);
      expect(therapiesForLine(g)).toHaveLength(0);
    }
  });
  it("PRIMARY entries sort first", () => {
    const v = therapiesForLine("Volitional", 20);
    expect(v.length).toBeGreaterThan(5);
    const roles = v.map((x) => x.role);
    expect(roles.indexOf("PRIMARY")).toBe(0);
  });
  it("no duplicate (line, therapy) pairs", () => {
    const keys = THERAPY_LINE_MAP.map((e) => `${e.line}|${e.therapy.toLowerCase()}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
