import { describe, expect, it } from "vitest";
import { bootstrapForecast, currentForecast } from "./forecastRouter";
import { applyForecastOverlay } from "@shared/forecastOverlay";

const live = { series: "DGS10" as const, name: "10-Year Treasury", unit: "%", value: 4.2, asOf: "2026-09-19", source: "live" as const, fetchedAt: "2026-09-22T00:00:00Z" };

describe("forecast.current", () => {
  it("rates come from the FRED benchmark with provenance, held flat", async () => {
    const f = await currentForecast({ domain: "rates", horizon: 30 }, { benchmark: async () => live });
    expect(f.points).toHaveLength(30);
    expect(f.points[0].rate).toBeCloseTo(0.042, 6);
    expect(f.source).toContain("FRED DGS10");
    expect(f.asOf).toBe("2026-09-19");
  });

  it("an unavailable benchmark is an honest empty forecast, not a guess", async () => {
    const f = await currentForecast({ domain: "rates", horizon: 20 }, { benchmark: async () => ({ ...live, value: NaN, source: "unavailable" }) });
    expect(f.points).toEqual([]);
    expect(f.unavailableReason).toContain("unavailable");
    const r = applyForecastOverlay([{ year: 1, value: 100 }, { year: 2, value: 106 }], f, 20);
    expect(r.applied).toBe(false);
  });

  it("inflation comes from CPI", async () => {
    const f = await currentForecast({ domain: "inflation", horizon: 40 }, { cpi: async () => ({ annualRate: 0.031, asOf: "2026-08-01" }) });
    expect(f.points).toHaveLength(40);
    expect(f.points[5].rate).toBeCloseTo(0.031, 6);
  });

  it("equities need a sourced history; with one, the bootstrap is deterministic and banded", async () => {
    const none = await currentForecast({ domain: "equities", horizon: 30 });
    expect(none.points).toEqual([]);
    const history = Array.from({ length: 40 }, (_, i) => (i % 7 === 0 ? -0.2 : 0.09));
    const a = bootstrapForecast("equities", history, 30, "audited S&P price-return series", "2025-12-31");
    const b = bootstrapForecast("equities", history, 30, "audited S&P price-return series", "2025-12-31");
    expect(a.points.map(p => p.rate)).toEqual(b.points.map(p => p.rate));
    expect(a.points[0].p10!).toBeLessThanOrEqual(a.points[0].rate);
    expect(a.points[0].p90!).toBeGreaterThanOrEqual(a.points[0].rate);
    expect(a.method).toContain("10,000-path");
  });

  it("a history shorter than ten years is refused with the reason", () => {
    const f = bootstrapForecast("housing", [0.03, 0.04], 20, "x", "y");
    expect(f.unavailableReason).toContain("too short");
  });
});
