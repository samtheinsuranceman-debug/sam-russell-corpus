import { describe, expect, it } from "vitest";
import { CAREER_PATHS, FEDERAL_LOAN_RATES, LOAN_FEES, PEER_FIELDS, VISION_QUESTIONS, careerPath, loanRateFor, opportunityCost, peerCompare, percentileOf, repayment, trainingCost, trainingYears, trueHourly } from "@shared/careerEngine";
import { PUBLIC_PAGES } from "@shared/seo";

describe("the registry of paths", () => {
  it("names every kind of doctor asked for, each with a cited degree and residency length and a BLS code", () => {
    expect(CAREER_PATHS.length).toBeGreaterThanOrEqual(35);
    const families = new Set(CAREER_PATHS.map((p) => p.family));
    for (const f of ["physician", "surgeon", "psychiatry", "dentist", "dental-specialist", "veterinarian", "attorney"]) expect(families.has(f as never), f).toBe(true);
    for (const p of CAREER_PATHS) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.degree.source.url).toMatch(/^https:\/\//);
      expect(p.residency.source.url).toMatch(/^https:\/\//);
      expect(p.soc.code).toMatch(/^\d{2}-\d{4}$/);
      if (p.fellowship) expect(p.fellowship.source.url).toMatch(/^https:\/\//);
    }
    expect(new Set(CAREER_PATHS.map((p) => p.slug)).size).toBe(CAREER_PATHS.length);
  });
  it("carries the lengths the AMA, ACGME and CODA publish", () => {
    expect(trainingYears(careerPath("neurosurgery")!)).toBe(11);      // 4 + 7
    expect(trainingYears(careerPath("cardiology")!)).toBe(10);        // 4 + 3 + 3 (ACGME 36 months)
    expect(trainingYears(careerPath("family-medicine")!)).toBe(7);
    expect(trainingYears(careerPath("oral-maxillofacial-surgery")!)).toBe(8); // CODA minimum four years
    expect(trainingYears(careerPath("endodontics")!)).toBe(6);        // CODA 24 months
    expect(trainingYears(careerPath("law")!)).toBe(3);
    expect(careerPath("psychiatry")!.soc.code).toBe("29-1223");      // BLS May 2025 structure: 29-1222 pathologists, 29-1223 psychiatrists, 29-1224 radiologists
    expect(careerPath("radiology")!.soc.code).toBe("29-1224");
    expect(careerPath("pathology")!.soc.code).toBe("29-1222");
  });
  it("gives every path a public page with a unique title and a description in the sitemap's range", () => {
    for (const p of CAREER_PATHS) {
      const pg = PUBLIC_PAGES.find((x) => x.path === `/for/${p.slug}`);
      expect(pg, p.slug).toBeTruthy();
      expect(pg!.description.length).toBeGreaterThanOrEqual(60);
      expect(pg!.description.length).toBeLessThanOrEqual(170);
    }
    expect(PUBLIC_PAGES.find((x) => x.path === "/for")).toBeTruthy();
  });
});

describe("federal loan rates", () => {
  it("runs from the first fixed-rate year to the current one, graduate below PLUS every year, with the statutory margins from 2013", () => {
    expect(FEDERAL_LOAN_RATES[0]!.year).toBe(2006);
    expect(FEDERAL_LOAN_RATES[FEDERAL_LOAN_RATES.length - 1]!.year).toBe(2026);
    for (let i = 1; i < FEDERAL_LOAN_RATES.length; i++) expect(FEDERAL_LOAN_RATES[i]!.year).toBe(FEDERAL_LOAN_RATES[i - 1]!.year + 1);
    for (const r of FEDERAL_LOAN_RATES) { expect(r.plus).toBeGreaterThan(r.gradUnsub); if (r.year >= 2013) expect(r.plus - r.gradUnsub).toBeCloseTo(1.0, 6); }
    expect(loanRateFor(2006)).toBe(6.8);
    expect(loanRateFor(2020)).toBe(4.3);
    expect(loanRateFor(2026, "plus")).toBe(9.07);
    expect(loanRateFor(1999)).toBeNull();
    expect(LOAN_FEES.gradUnsub).toBe(1.057);
  });
});

describe("the arithmetic", () => {
  it("costs a degree year by year with the year's rate and capitalises interest", () => {
    const c = trainingCost({ startYear: 2020, degreeYears: 2, tuitionPerYear: 50_000, livingPerYear: 20_000, costGrowthPct: 0, borrowedShare: 1 });
    expect(c.years.map((y) => y.ratePct)).toEqual([4.3, 5.28]);
    const fee = 70_000 * 0.01057;
    const y1 = (70_000 + fee) * 1.043;
    expect(c.years[0]!.balance).toBeCloseTo(y1, 4);
    expect(c.years[1]!.balance).toBeCloseTo((y1 + 70_000 + fee) * 1.0528, 4);
    expect(c.totalCost).toBe(140_000);
    expect(c.balanceAtGraduation).toBeGreaterThan(c.totalBorrowed);
  });
  it("compounds what training years forgo and grows the loan meanwhile, and reports years to recover", () => {
    const o = opportunityCost({ trainingYears: 3, stipendPerYear: 60_000, attendingSalary: 300_000, alternativeSalary: 100_000, investReturnPct: 10, loanBalance: 200_000, loanRatePct: 5 });
    expect(o.forgoneTotal).toBe(120_000);
    expect(o.forgoneCompounded).toBeCloseTo(40_000 * 1.1 * 1.1 + 40_000 * 1.1 + 40_000, 6);
    expect(o.loanBalanceAfter).toBeCloseTo(200_000 * Math.pow(1.05, 3), 6);
    expect(o.yearsToRecoverAtAttendingPremium).toBeCloseTo(o.forgoneCompounded / 200_000, 10);
    expect(opportunityCost({ trainingYears: 0, stipendPerYear: 0, attendingSalary: 1, alternativeSalary: 2, investReturnPct: 0 }).yearsToRecoverAtAttendingPremium).toBeNull();
  });
  it("prices a level repayment", () => {
    const p = repayment(100_000, 6, 10);
    expect(p.monthly).toBeCloseTo(1110.21, 1);
    expect(p.totalInterest).toBeCloseTo(p.monthly * 120 - 100_000, 6);
    expect(repayment(0, 6, 10).monthly).toBe(0);
  });
  it("finds the hour's true worth, commute and travel included", () => {
    const h = trueHourly({ grossIncome: 400_000, incomeTaxes: 120_000, loanPayments: 30_000, practiceExpenses: 20_000, vehicleCosts: 10_000, commuteHoursPerWeek: 5, hoursPerWeek: 50, weeksPerYear: 48, travelDaysPerYear: 10 });
    expect(h.net).toBe(220_000);
    expect(h.hoursWorked).toBe(2400);
    expect(h.hoursCommittedIncludingTravel).toBe(2400 + 240 + 80);
    expect(h.grossHourly).toBeCloseTo(400_000 / 2400, 6);
    expect(h.netHourlyAllIn).toBeCloseTo(220_000 / 2720, 6);
  });
  it("places a value on a BLS distribution and skips suppressed points", () => {
    const d = { p10: 100, p25: 150, p50: 200, p75: 300, p90: 400 };
    expect(percentileOf(200, d)).toBe(50);
    expect(percentileOf(250, d)).toBeCloseTo(62.5, 6);
    expect(percentileOf(50, d)).toBe(7.5);
    expect(percentileOf(0, d)).toBe(5);
    expect(percentileOf(1_000, d)).toBe(95);
    const above = percentileOf(350, { ...d, p75: null, p90: null })!; // top-coded: the page says "at least" the last published point
    expect(above).toBeGreaterThan(50);
    expect(above).toBeLessThanOrEqual(55);
    expect(percentileOf(1, { p10: null, p25: null, p50: 200, p75: null, p90: null })).toBeNull();
  });
  it("compares with peers only when five or more entered the line", () => {
    expect(peerCompare(10, [1, 2, 3])).toEqual({ median: null, percentile: null, n: 3 });
    const c = peerCompare(30, [10, 20, 30, 40, 50]);
    expect(c).toEqual({ median: 30, percentile: 50, n: 5 });
  });
  it("asks the vision questions at six horizons and the odds three ways, and the peer form carries the lines asked for", () => {
    expect(VISION_QUESTIONS.filter((q) => q.key.startsWith("perfect")).map((q) => q.key)).toEqual(["perfect5", "perfect10", "perfect15", "perfect20", "perfect30", "perfect40"]);
    expect(VISION_QUESTIONS.map((q) => q.key)).toEqual(expect.arrayContaining(["knowAnyone", "rarity", "likelihoodNow", "likelihoodAfter"]));
    expect(PEER_FIELDS.map((f) => f.key)).toEqual(expect.arrayContaining(["grossIncome", "studentDebt", "appreciationPct", "kids", "familyHealth", "hoursPerWeek", "satisfaction", "savingsTaxable", "savingsTaxFree", "vehicleCosts", "travelDaysPerYear"]));
  });
});
