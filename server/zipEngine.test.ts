import { describe, expect, it } from "vitest";
import { amortisation, annualAppreciation, annualAverage, annualFromMonthly, backcastLevels, cohortMembers, cohortSummary, interestSheet, lookbackRates, median, projectForward, valueAt, windowRate, worstDrawdown, zipReport, type AnnualSeries } from "@shared/zipEngine";

const zhvi: AnnualSeries = { startYear: 2000, values: [200_000, 220_000, 250_000, 300_000, 330_000, 360_000, 380_000, 370_000, 300_000, 280_000, 270_000, 275_000, 290_000, 320_000, 340_000, 360_000, 380_000, 400_000, 420_000, 440_000, 500_000, 600_000, 640_000, 650_000, 660_000] };
// FHFA index: 100 in 1990, 150 in 2000 (so 1990 back-casts to 200,000 × 100/150).
const hpi: AnnualSeries = { startYear: 1990, values: [100, 102, 105, 108, 112, 116, 120, 128, 136, 143, 150, 165, 187, 225, 247, 270, 285, 277, 225, 210, 202, 206, 217, 240, 255, 270, 285, 300, 315, 330, 375, 450, 480, 487, 495] };

describe("annual series helpers", () => {
  it("reads values by year and folds monthly to the last month of each year", () => {
    expect(valueAt(zhvi, 2000)).toBe(200_000);
    expect(valueAt(zhvi, 1999)).toBeNull();
    const s = annualFromMonthly({ "2019-11-30": 10, "2019-12-31": 11, "2020-01-31": 12, "2020-06-30": null, "2022-03-31": 20 })!;
    expect(s.startYear).toBe(2019);
    expect(s.values).toEqual([11, 12, null, 20]);
  });
  it("computes year-over-year appreciation and skips blanks", () => {
    const a = annualAppreciation({ startYear: 2000, values: [100, 110, null, 121] });
    expect(a).toEqual([{ year: 2001, pct: expect.closeTo(0.1, 6) }]);
  });
});

describe("windows", () => {
  it("compounds between the chosen start year and the last year on record", () => {
    const w = windowRate(zhvi, 2000)!;
    expect(w.from).toBe(2000); expect(w.to).toBe(2024);
    expect(w.rate).toBeCloseTo(Math.pow(660_000 / 200_000, 1 / 24) - 1, 8);
    expect(windowRate(zhvi, 2020)!.rate).toBeCloseTo(Math.pow(660_000 / 500_000, 1 / 4) - 1, 8);
    expect(windowRate(zhvi, 1995)).toBeNull();
  });
  it("gives the standard look-backs from the last year", () => {
    const r = lookbackRates(zhvi);
    expect(r[10]).toBeCloseTo(Math.pow(660_000 / 340_000, 1 / 10) - 1, 8);
    expect(r[30]).toBeNull();
  });
  it("finds the 2008 drawdown and respects the slider", () => {
    expect(worstDrawdown(zhvi)).toEqual({ peakYear: 2006, troughYear: 2010, drawdown: expect.closeTo(270_000 / 380_000 - 1, 8) });
    expect(worstDrawdown(zhvi, 2012)).toBeNull(); // monotonic from 2012 on
  });
  it("projects forward at the selected window's rate", () => {
    const p = projectForward(zhvi, 2020, 3)!;
    expect(p.window).toEqual({ from: 2020, to: 2024 });
    expect(p.points.map((x) => x.year)).toEqual([2025, 2026, 2027]);
    expect(p.points[0]!.value).toBeCloseTo(660_000 * (1 + p.rate), 4);
  });
});

describe("back-cast and cohort", () => {
  it("scales the FHFA index to Zillow's first year and labels the back-cast years", () => {
    const b = backcastLevels(zhvi, hpi)!;
    expect(b.anchorYear).toBe(2000);
    expect(b.backcastThrough).toBe(1999);
    expect(valueAt(b.levels, 1990)).toBeCloseTo(200_000 * 100 / 150, 4);
    expect(valueAt(b.levels, 2000)).toBe(200_000); // Zillow wins where it exists
    expect(valueAt(b.levels, 2024)).toBe(660_000);
    expect(backcastLevels(null, hpi)).toBeNull(); // an index alone has no dollar level
    expect(backcastLevels(zhvi, null)!.backcastThrough).toBeNull();
  });
  it("filters the cohort by the level at the start of the window and summarises by median", () => {
    const rich: AnnualSeries = { startYear: 1990, values: Array.from({ length: 35 }, (_, i) => 400_000 * Math.pow(1.04, i)) };
    const poor: AnnualSeries = { startYear: 1990, values: Array.from({ length: 35 }, (_, i) => 60_000 * Math.pow(1.02, i)) };
    const map = new Map([["10001", rich], ["79936", poor], ["28401", backcastLevels(zhvi, hpi)!.levels]]);
    expect(cohortMembers(map, 100_000, 1990)).toEqual(["10001", "28401"]);
    expect(cohortMembers(map, 500_000, 1990)).toEqual([]);
    const s = cohortSummary(map, 100_000, 1990);
    expect(s.members).toBe(2);
    expect(s.windowRate).toBeCloseTo(median([0.04, windowRate(map.get("28401")!, 1990)!.rate])!, 8);
    expect(s.sample.windowRate).toBe(2);
    expect(median([3, 1, 2])).toBe(2); expect(median([])).toBeNull();
  });
});

describe("the true cost of the loan", () => {
  it("amortises a 30-year loan", () => {
    const a = amortisation(400_000, 6);
    expect(a.monthlyPayment).toBeCloseTo(2398.20, 1);
    expect(a.totalInterest).toBeCloseTo(a.monthlyPayment * 360 - 400_000, 6);
    expect(amortisation(100_000, 0).monthlyPayment).toBeCloseTo(100_000 / 360, 6);
  });
  it("averages weekly rates by calendar year and builds the sheet from the slider year", () => {
    const pmms = annualAverage([{ date: "2020-01-02", value: 3.7 }, { date: "2020-07-02", value: 3.0 }, { date: "2021-01-07", value: 2.65 }, { date: "2023-10-26", value: 7.79 }])!;
    expect(pmms.startYear).toBe(2020);
    expect(pmms.values).toEqual([3.35, 2.65, null, 7.79]);
    const sheet = interestSheet(zhvi, pmms, { fromYear: 2020, downPct: 20 });
    expect(sheet.map((r) => r.year)).toEqual([2020, 2021, 2023]); // 2022 has no rate → skipped, not guessed
    const r23 = sheet[2]!;
    expect(r23.principal).toBe(650_000 * 0.8);
    expect(r23.totalInterest).toBeCloseTo(amortisation(520_000, 7.79).totalInterest, 4);
    expect(r23.interestToPrice).toBeGreaterThan(1); // at 7.79% the interest exceeds the price
  });
});

describe("zipReport", () => {
  it("assembles one zip's report for the chosen window and threshold", () => {
    const rent: AnnualSeries = { startYear: 2015, values: [1500, 1550, 1600, 1650, 1700, 1750, 1900, 2100, 2200, 2250] };
    const r = zipReport("28401", { zhvi, hpi, rent }, { startYear: 1990, threshold: 100_000, yearsAhead: 5 });
    expect(r.window).toEqual({ from: 1990, to: 2024 });
    expect(r.backcastThrough).toBe(1999);
    expect(r.inCohort).toBe(true);
    expect(r.projection!.points).toHaveLength(5);
    expect(r.rentWindowRate).toBeCloseTo(Math.pow(2250 / 1500, 1 / 9) - 1, 8);
    const none = zipReport("00000", { zhvi: null, hpi: null, rent: null }, { startYear: 2000, threshold: 100_000 });
    expect(none.levels).toBeNull(); expect(none.inCohort).toBeNull(); expect(none.appreciation).toEqual([]);
  });
});
