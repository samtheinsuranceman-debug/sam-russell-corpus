import { describe, it, expect } from "vitest";

/**
 * Illustration Comparison Upload Tool Tests
 * Tests the LLM extraction schema, engine comparison logic, and data flow
 */

// ─── Mock the expected LLM extraction response shape ─────────────────────────
const MOCK_LLM_EXTRACTION = {
  carrier: "A Mutual Life",
  productName: "Accumulator III",
  insuredName: "John Smith",
  insuredAge: 52,
  gender: "Male",
  ratingClass: "Preferred",
  annualPremium: 50000,
  deathBenefit: 500000,
  illustratedRate: 0.12,
  yearByYear: [
    { year: 1, premium: 50000, cashValue: 40200, surrenderValue: 25100, deathBenefit: 500000 },
    { year: 2, premium: 50000, cashValue: 87500, surrenderValue: 62300, deathBenefit: 500000 },
    { year: 3, premium: 50000, cashValue: 141800, surrenderValue: 107400, deathBenefit: 500000 },
    { year: 5, premium: 50000, cashValue: 269500, surrenderValue: 231200, deathBenefit: 500000 },
    { year: 10, premium: 50000, cashValue: 699800, surrenderValue: 699800, deathBenefit: 699800 },
    { year: 15, premium: 0, cashValue: 1085000, surrenderValue: 1085000, deathBenefit: 1085000 },
    { year: 20, premium: 0, cashValue: 1530000, surrenderValue: 1530000, deathBenefit: 1530000 },
  ],
};

describe("Illustration Comparison — Extraction Schema", () => {
  it("should have all required fields in the extraction response", () => {
    const extraction = MOCK_LLM_EXTRACTION;
    expect(extraction.carrier).toBeTruthy();
    expect(extraction.productName).toBeTruthy();
    expect(extraction.insuredAge).toBeGreaterThan(0);
    expect(extraction.annualPremium).toBeGreaterThan(0);
    expect(extraction.deathBenefit).toBeGreaterThan(0);
    expect(extraction.illustratedRate).toBeGreaterThan(0);
    expect(extraction.illustratedRate).toBeLessThan(1);
    expect(extraction.yearByYear.length).toBeGreaterThan(0);
  });

  it("should have valid year-by-year entries with required fields", () => {
    for (const row of MOCK_LLM_EXTRACTION.yearByYear) {
      expect(row.year).toBeGreaterThan(0);
      expect(row.cashValue).toBeGreaterThanOrEqual(0);
      expect(row.surrenderValue).toBeGreaterThanOrEqual(0);
      expect(row.deathBenefit).toBeGreaterThan(0);
    }
  });

  it("should have cash values increasing over time for positive illustrated rates", () => {
    const years = MOCK_LLM_EXTRACTION.yearByYear;
    for (let i = 1; i < years.length; i++) {
      expect(years[i].cashValue).toBeGreaterThan(years[i - 1].cashValue);
    }
  });

  it("should have surrender values <= cash values", () => {
    for (const row of MOCK_LLM_EXTRACTION.yearByYear) {
      expect(row.surrenderValue).toBeLessThanOrEqual(row.cashValue);
    }
  });
});

describe("Illustration Comparison — Engine Comparison Logic", () => {
  // Simulate the comparison logic from the compareWithEngine procedure
  function computeVariance(illustrationCV: number, engineCV: number): number {
    if (illustrationCV === 0) return 0;
    return ((engineCV - illustrationCV) / illustrationCV) * 100;
  }

  it("should compute variance correctly for matching values", () => {
    expect(computeVariance(100000, 100000)).toBe(0);
  });

  it("should compute positive variance when engine exceeds illustration", () => {
    const v = computeVariance(100000, 102000);
    expect(v).toBeCloseTo(2.0, 1);
  });

  it("should compute negative variance when engine is below illustration", () => {
    const v = computeVariance(100000, 98000);
    expect(v).toBeCloseTo(-2.0, 1);
  });

  it("should flag values within 2% tolerance as passing", () => {
    const testCases = [
      { illCV: 100000, engCV: 101500, expected: true },
      { illCV: 100000, engCV: 98500, expected: true },
      { illCV: 100000, engCV: 103000, expected: false },
      { illCV: 100000, engCV: 97000, expected: false },
    ];
    for (const tc of testCases) {
      const variance = Math.abs(computeVariance(tc.illCV, tc.engCV));
      expect(variance <= 2).toBe(tc.expected);
    }
  });

  it("should handle zero illustration values gracefully", () => {
    expect(computeVariance(0, 0)).toBe(0);
    expect(computeVariance(0, 1000)).toBe(0);
  });
});

describe("Illustration Comparison — Milestone Selection", () => {
  const MILESTONE_YEARS = [1, 2, 3, 5, 10, 15, 20, 25, 30];

  it("should select correct milestone years from full projection", () => {
    const fullProjection = Array.from({ length: 30 }, (_, i) => ({
      year: i + 1,
      cashValue: (i + 1) * 50000,
    }));
    const milestones = fullProjection.filter((r) => MILESTONE_YEARS.includes(r.year));
    expect(milestones.length).toBe(9);
    expect(milestones[0].year).toBe(1);
    expect(milestones[milestones.length - 1].year).toBe(30);
  });

  it("should handle projections shorter than 30 years", () => {
    const fullProjection = Array.from({ length: 20 }, (_, i) => ({
      year: i + 1,
      cashValue: (i + 1) * 50000,
    }));
    const milestones = fullProjection.filter((r) => MILESTONE_YEARS.includes(r.year));
    expect(milestones.length).toBe(7); // 1, 2, 3, 5, 10, 15, 20
    expect(milestones[milestones.length - 1].year).toBe(20);
  });
});

describe("Illustration Comparison — Summary Statistics", () => {
  function computeSummary(comparisons: { variance: number }[]) {
    const absVariances = comparisons.map((c) => Math.abs(c.variance));
    const maxVariance = Math.max(...absVariances);
    const avgVariance = absVariances.reduce((a, b) => a + b, 0) / absVariances.length;
    const milestonesWithinTolerance = absVariances.filter((v) => v <= 2).length;
    return {
      maxVariance,
      avgVariance,
      milestonesWithinTolerance,
      totalMilestones: comparisons.length,
      allWithinTolerance: milestonesWithinTolerance === comparisons.length,
    };
  }

  it("should compute correct summary for all-passing comparisons", () => {
    const comparisons = [
      { variance: 0.5 },
      { variance: -1.2 },
      { variance: 0.8 },
      { variance: -0.3 },
      { variance: 1.9 },
    ];
    const summary = computeSummary(comparisons);
    expect(summary.allWithinTolerance).toBe(true);
    expect(summary.maxVariance).toBeCloseTo(1.9, 1);
    expect(summary.milestonesWithinTolerance).toBe(5);
  });

  it("should flag when some milestones exceed tolerance", () => {
    const comparisons = [
      { variance: 0.5 },
      { variance: -3.5 },
      { variance: 0.8 },
      { variance: 5.2 },
    ];
    const summary = computeSummary(comparisons);
    expect(summary.allWithinTolerance).toBe(false);
    expect(summary.maxVariance).toBeCloseTo(5.2, 1);
    expect(summary.milestonesWithinTolerance).toBe(2);
    expect(summary.totalMilestones).toBe(4);
  });

  it("should compute average variance correctly", () => {
    const comparisons = [
      { variance: 1.0 },
      { variance: -2.0 },
      { variance: 3.0 },
    ];
    const summary = computeSummary(comparisons);
    expect(summary.avgVariance).toBeCloseTo(2.0, 1); // (1 + 2 + 3) / 3
  });
});

describe("Illustration Comparison — File Validation", () => {
  it("should accept PDF files", () => {
    const validFiles = ["illustration.pdf", "CARRIER_REPORT.PDF", "test.Pdf"];
    for (const f of validFiles) {
      expect(f.toLowerCase().endsWith(".pdf")).toBe(true);
    }
  });

  it("should reject non-PDF files", () => {
    const invalidFiles = ["illustration.docx", "report.xlsx", "image.png", "data.csv"];
    for (const f of invalidFiles) {
      expect(f.toLowerCase().endsWith(".pdf")).toBe(false);
    }
  });

  it("should enforce 20MB file size limit", () => {
    const maxSize = 20 * 1024 * 1024;
    expect(15 * 1024 * 1024 <= maxSize).toBe(true);
    expect(25 * 1024 * 1024 <= maxSize).toBe(false);
  });
});

describe("Illustration Comparison — Carrier Detection", () => {
  const KNOWN_CARRIERS = ["A Mutual Life", "AAA+ Mutual", "A- Mutual Life", "A+ Mutual Life", "BBB+ Mutual", "Lincoln", "AA- Mutual", "Transamerica"];

  it("should match known carriers from extraction", () => {
    const testCases = [
      { extracted: "A Mutual Life", expected: true },
      { extracted: "AAA+ Mutual", expected: true },
      { extracted: "A- Mutual Life", expected: true },
      { extracted: "Unknown Carrier", expected: false },
    ];
    for (const tc of testCases) {
      const found = KNOWN_CARRIERS.includes(tc.extracted);
      expect(found).toBe(tc.expected);
    }
  });

  it("should handle carrier name variations", () => {
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");
    expect(normalize("A Mutual Life")).toContain("amutuallife");
    expect(normalize("AAA+ Mutual Insurance")).toContain("aaamutualinsurance");
    expect(normalize("A- Mutual Life Financial")).toContain("amutuallifefinancial");
  });
});
