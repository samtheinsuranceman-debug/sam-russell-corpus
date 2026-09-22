import { describe, expect, it } from "vitest";
import {
  applyForecastOverlay,
  flatForecast,
  impliedGrowth,
  normaliseHorizon,
  unavailableForecast,
  type ProjectionPoint,
} from "@shared/forecastOverlay";

function grow(start: number, rate: number, years: number, flow = 0): ProjectionPoint[] {
  const out: ProjectionPoint[] = [{ year: 1, value: start }];
  for (let y = 2; y <= years; y++) out.push({ year: y, value: out[y - 2].value * (1 + rate) + flow });
  return out;
}

const ledger = { source: "test", asOf: "2026-09-22", method: "flat" };

describe("forecastOverlay", () => {
  it("is off by default in spirit: an unavailable forecast leaves the base untouched and says why", () => {
    const base = grow(100_000, 0.06, 30);
    const r = applyForecastOverlay(base, unavailableForecast("equities", 30, "FRED dark"), 30);
    expect(r.applied).toBe(false);
    expect(r.reason).toBe("FRED dark");
    expect(r.points.map(p => p.overlay)).toEqual(base.map(p => p.value));
    expect(r.ledger).toBeNull();
  });

  it("with the calculator's own rate supplied, the same forecast rate reproduces the base and flows are preserved", () => {
    const base = grow(100_000, 0.06, 30, 10_000);
    const r = applyForecastOverlay(base, flatForecast("equities", 0.06, 30, ledger), 30, { baseRate: 0.06 });
    expect(r.applied).toBe(true);
    r.points.forEach(p => expect(Math.abs(p.overlay - p.base)).toBeLessThan(1e-6));
    expect(Math.abs(r.deltaAtHorizon)).toBeLessThan(1e-6);
    expect(r.ledger?.source).toBe("test");
    expect(r.ledger?.method).toContain("flows preserved");
  });

  it("without the calculator's rate it says so in the ledger rather than guessing flows", () => {
    const base = grow(100_000, 0.06, 30, 10_000);
    const r = applyForecastOverlay(base, flatForecast("equities", 0.06, 30, ledger), 30);
    expect(r.ledger?.method).toContain("flows not isolated");
  });

  it("a lower forecast produces a lower horizon value; a higher one a higher value", () => {
    const base = grow(100_000, 0.06, 40, 5_000);
    const low = applyForecastOverlay(base, flatForecast("equities", 0.04, 40, ledger), 40);
    const high = applyForecastOverlay(base, flatForecast("equities", 0.08, 40, ledger), 40);
    expect(low.deltaAtHorizon).toBeLessThan(0);
    expect(high.deltaAtHorizon).toBeGreaterThan(0);
    expect(low.points).toHaveLength(40);
  });

  it("bands come from the forecast's p10/p90 and bracket the median path", () => {
    const base = grow(50_000, 0.05, 20);
    const r = applyForecastOverlay(base, flatForecast("housing", 0.05, 20, ledger, { p10: 0.01, p90: 0.09 }), 20);
    const last = r.points[r.points.length - 1];
    expect(last.p10).toBeLessThan(last.overlay);
    expect(last.p90).toBeGreaterThan(last.overlay);
  });

  it("extends a short base series to the horizon at its last implied growth, and trims a long one", () => {
    const short = normaliseHorizon(grow(1_000, 0.10, 5), 20);
    expect(short).toHaveLength(20);
    expect(short[19].value).toBeCloseTo(1_000 * 1.1 ** 19, 6);
    const long = normaliseHorizon(grow(1_000, 0.10, 50), 30);
    expect(long).toHaveLength(30);
    expect(long[29].year).toBe(30);
  });

  it("implied growth is the year-over-year ratio and never divides by zero", () => {
    expect(impliedGrowth(grow(100, 0.1, 3)).map(g => Number(g.toFixed(6)))).toEqual([0.1, 0.1]);
    expect(impliedGrowth([{ year: 1, value: 0 }, { year: 2, value: 10 }])).toEqual([0]);
  });

  it("an empty base yields nothing rather than a fabricated path", () => {
    const r = applyForecastOverlay([], flatForecast("rates", 0.05, 30, ledger), 30);
    expect(r.applied).toBe(false);
    expect(r.points).toEqual([]);
  });
});
