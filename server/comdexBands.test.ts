import { describe, it, expect } from "vitest";
import { COMDEX_BANDS, getComdexLabel, getComdexDescription } from "../shared/carrierRatings";

// Comdex is a 1-100 percentile ranking of rated insurers (VitalSigns, Ebix); 50 is the middle.
describe("Comdex bands", () => {
  it("labels each published band", () => {
    const cases: [number, string][] = [
      [100, "Excellent"], [95, "Excellent"], [90, "Excellent"],
      [89, "Very Good"], [80, "Very Good"],
      [79, "Good"], [70, "Good"],
      [69, "Above Average"], [60, "Above Average"],
      [59, "Average"], [50, "Average"],
      [49, "Below Average"], [40, "Below Average"],
      [39, "Weak"], [20, "Weak"], [1, "Weak"],
    ];
    for (const [score, label] of cases) expect(getComdexLabel(score), `Comdex ${score}`).toBe(label);
  });

  it("no longer calls every score under 70 average", () => {
    expect(getComdexLabel(65)).not.toBe(getComdexLabel(30));
    expect(getComdexDescription(30)).toMatch(/^Weak/);
    expect(getComdexDescription(45)).toMatch(/^Below Average/);
    expect(getComdexDescription(55)).toMatch(/^Average/);
    expect(getComdexDescription(65)).toMatch(/^Above Average/);
  });

  it("descriptions carry the percentile meaning", () => {
    expect(getComdexDescription(92)).toBe("Excellent — Top 10% of rated insurers");
    expect(getComdexDescription(84)).toBe("Very Good — Top 20% of rated insurers");
    expect(getComdexDescription(72)).toBe("Good — Top 30% of rated insurers");
  });

  it("bands are ordered and cover every score", () => {
    const mins = COMDEX_BANDS.map((b) => b.min);
    for (let i = 1; i < mins.length; i++) expect(mins[i]).toBeLessThan(mins[i - 1]);
    expect(COMDEX_BANDS).toHaveLength(7);
    expect(getComdexLabel(0)).toBe("Weak");
  });
});
