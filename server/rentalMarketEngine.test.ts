import { describe, it, expect } from "vitest";
import { rentByConfiguration, configurationMatrix, propertyTaxRatePath, evictionRisk, monetaryOverlay, appreciationPaths, blockBootstrapPaths, percentilePath, worstRollingCagr, cagr, NO_BATHROOM_SOURCE, BEDROOM_CONFIGS, type RentSeriesSet } from "../shared/rentalMarketEngine";

const S = (startYear: number, values: Array<number | null>) => ({ startYear, values });

describe("rent by configuration — bedrooms are real, bathrooms are null by design", () => {
  const set: RentSeriesSet = { safmr: { "2": S(2018, [1200, 1250, 1300, 1400, 1500, 1600, 1700, 1750]) }, fmr: { "2": S(1983, Array.from({ length: 43 }, (_, i) => 300 + i * 30)), "3": S(1983, Array.from({ length: 43 }, (_, i) => 380 + i * 35)) }, sources: { safmr: { url: "hud-safmr", asOf: "2025" }, fmr: { url: "hud-fmr", asOf: "2025" } } };
  it("prefers the finest geography that has a value", () => { const r = rentByConfiguration(set, "2", 2, 2024); expect(r.monthlyRent.value).toBe(1700); expect(r.monthlyRent.evidence.source).toContain("Small Area"); });
  it("falls back to the county FMR when the zip has no series for that bedroom count", () => { const r = rentByConfiguration(set, "3", 1, 2020); expect(r.monthlyRent.value).toBe(380 + 37 * 35); expect(r.monthlyRent.evidence.source).toContain("county"); });
  it("never invents a bathroom adjustment — null with the reason, every row", () => { for (const row of configurationMatrix(set, 2024, [1, 2, 3, 4, 5])) { expect(row.bathroomAdjustment.value).toBeNull(); expect(row.bathroomAdjustment.reason).toBe(NO_BATHROOM_SOURCE); } });
  it("produces the full 6 × 5 matrix", () => { expect(configurationMatrix(set, 2024)).toHaveLength(BEDROOM_CONFIGS.length * 5); });
  it("is null, with a reason, where the record is blank", () => { const r = rentByConfiguration(set, "5+", 3, 2024); expect(r.monthlyRent.value).toBeNull(); expect(r.monthlyRent.reason).toContain("blank"); });
});

describe("property tax path", () => {
  it("carries the last effective rate forward with the observed drift", () => { const p = propertyTaxRatePath(S(2015, [3000, 3150, 3300, 3450]), S(2015, [300000, 300000, 300000, 300000]), 5); expect(p.value).not.toBeNull(); expect(p.value![0]).toBeCloseTo(0.0115 + 0.0005, 4); expect(p.evidence.method).toContain("bp/yr"); });
  it("is null with a reason when either series is missing", () => { expect(propertyTaxRatePath(null, S(2015, [1]), 5).value).toBeNull(); });
});

describe("eviction exposure", () => {
  it("reports filing and eviction rates as shares, with the record's window and the undercount flag", () => {
    const e = evictionRisk({ filingRate: S(2000, [5.0, 5.5, 6.0]), evictionRate: S(2000, [2.0, 2.2, 2.4]), lowFlag: true, source: { url: "evictionlab", asOf: "2002" } });
    expect(e.filingRate.value).toBeCloseTo(0.06); expect(e.evictionRate.value).toBeCloseTo(0.024); expect(e.window).toEqual({ from: 2000, to: 2002 }); expect(e.filingRate.evidence.method).toContain("undercounted");
  });
  it("owners-suing share is the filing rate, stated as such", () => { const e = evictionRisk({ filingRate: S(2010, [4]), source: { url: "x", asOf: "2010" } }); expect(e.ownersSuingShare.value).toBeCloseTo(0.04); expect(e.ownersSuingShare.evidence.method).toContain("landlord suing"); });
  it("is null with reasons when there is no county series", () => { const e = evictionRisk(null); expect(e.filingRate.value).toBeNull(); expect(e.filingRate.reason).toBeDefined(); });
});

describe("resampling", () => {
  it("is deterministic for a seed and preserves block structure", () => { const a = blockBootstrapPaths([0.01, 0.02, 0.03, 0.04, 0.05, -0.1], 12, 50, 7), b = blockBootstrapPaths([0.01, 0.02, 0.03, 0.04, 0.05, -0.1], 12, 50, 7); expect(a).toEqual(b); expect(a[0]).toHaveLength(12); });
  it("percentile paths are ordered", () => { const paths = blockBootstrapPaths([0.1, -0.2, 0.05, 0.3, -0.05], 10, 500); const p10 = percentilePath(paths, 0.1), p50 = percentilePath(paths, 0.5), p90 = percentilePath(paths, 0.9); for (let i = 0; i < 10; i++) { expect(p10[i]).toBeLessThanOrEqual(p50[i]); expect(p50[i]).toBeLessThanOrEqual(p90[i]); } });
  it("appreciation paths refuse a record shorter than ten growth years, with the reason", () => { const a = appreciationPaths(S(2020, [100, 105, 110]), 30); expect(a.median).toBeNull(); expect(a.reason).toContain("ten required"); });
  it("appreciation paths come with a window and a method naming the path count", () => { const a = appreciationPaths(S(1990, Array.from({ length: 36 }, (_, i) => 100 * Math.pow(1.04, i))), 30, 500); expect(a.median).toHaveLength(30); expect(a.evidence.window).toEqual({ from: 1990, to: 2025 }); expect(a.evidence.method).toContain("500"); });
});

describe("history summaries", () => {
  it("worst rolling decade is found, and CAGR spans the non-null window", () => { const s = S(2000, [100, 110, 90, 80, 85, 95, 120, 130, 125, 140, 150, 160]); const w = worstRollingCagr(s, 5); expect(w).not.toBeNull(); expect(w!.rate).toBeLessThan(cagr(s)!); });
  it("monetary overlay returns CPI and M2 paths separately and never blends them", () => { const cpi = S(1990, Array.from({ length: 36 }, (_, i) => 100 * Math.pow(1.03, i))), m2 = S(1990, Array.from({ length: 36 }, (_, i) => 100 * Math.pow(1.06, i))); const o = monetaryOverlay(cpi, m2, 10); expect(o.cpiPath.value).toHaveLength(10); expect(o.m2Path.value).toHaveLength(10); expect(o.m2Path.value![0]).toBeGreaterThan(o.cpiPath.value![0]); });
});
