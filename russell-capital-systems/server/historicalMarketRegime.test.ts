import { describe, it, expect } from "vitest";
import {
  classifyRegimes, regimeConditionedPaths, transitionMatrix, summarize,
  mostRecentRegime, percentilePath, compound,
  DEFAULT_THRESHOLDS, MIN_OBSERVATIONS, REGIME_PRECEDENCE,
  type RegimeYear,
} from "../shared/historicalMarketRegimeEngine";
import type { AnnualSeries } from "../shared/rentalMarketEngine";

const S = (startYear: number, values: Array<number | null>): AnnualSeries => ({ startYear, values });

/** Index levels from a list of annual growth rates, starting at 100. */
function levels(startYear: number, growths: number[]): AnnualSeries {
  const values: number[] = [100];
  for (let i = 0; i < growths.length; i++) values.push(values[values.length - 1] * (1 + growths[i]));
  return { startYear, values };
}

describe("regime classification — each label is checkable against the year it describes", () => {
  it("calls falling prices deflation, ahead of every other rule", () => {
    const c = classifyRegimes({
      cpi: levels(2000, [-0.02, -0.01]),
      assetIndex: levels(2000, [-0.10, 0.03]),
    });
    expect(c.years[0].regime).toBe("deflation");
    expect(c.years[0].basis).toContain("fell outright");
  });

  it("separates stagflation from an inflation shock by real growth", () => {
    // 8% inflation, asset up 2% → real growth negative → stagflation.
    const stag = classifyRegimes({ cpi: levels(1975, [0.08]), assetIndex: levels(1975, [0.02]) });
    expect(stag.years[0].regime).toBe("stagflation");
    // 8% inflation, asset up 15% → real growth positive → inflation shock.
    const shock = classifyRegimes({ cpi: levels(1975, [0.08]), assetIndex: levels(1975, [0.15]) });
    expect(shock.years[0].regime).toBe("inflation-shock");
  });

  it("labels a rate shock only when a rate series is supplied", () => {
    const cpi = levels(2020, [0.02, 0.02, 0.02]);
    const asset = levels(2020, [0.04, 0.04, 0.04]);
    const withRate = classifyRegimes({ cpi, assetIndex: asset, policyRate: S(2020, [0.0025, 0.01, 0.0475, 0.0533]) });
    expect(withRate.years.some((y) => y.regime === "rate-shock")).toBe(true);
    const withoutRate = classifyRegimes({ cpi, assetIndex: asset });
    expect(withoutRate.years.some((y) => y.regime === "rate-shock")).toBe(false);
    expect(withoutRate.evidence.method).toContain("no rate series supplied");
  });

  it("calls a nominal fall a contraction and the years after it recovery", () => {
    const c = classifyRegimes({
      cpi: levels(2006, [0.03, 0.02, 0.01, 0.02, 0.02]),
      assetIndex: levels(2006, [0.05, -0.12, -0.06, 0.04, 0.06]),
    });
    const byYear: Record<number, RegimeYear> = {};
    c.years.forEach((y) => { byYear[y.year] = y; });
    expect(byYear[2008].regime).toBe("contraction");
    expect(byYear[2009].regime).toBe("contraction");
    expect(byYear[2010].regime).toBe("recovery");
    expect(byYear[2010].basis).toContain("within");
  });

  it("never invents a label where the record is blank — unclassified, and excluded", () => {
    const c = classifyRegimes({
      cpi: S(2000, [100, 102, null, 106, 108]),
      assetIndex: levels(2000, [0.04, 0.04, 0.04, 0.04]),
    });
    expect(c.unclassifiedYears.length).toBeGreaterThan(0);
    const u = c.years.filter((y) => y.regime === "unclassified");
    expect(u[0].basis).toContain("excluded from sampling");
  });

  it("returns an empty, honest classification when the series do not overlap", () => {
    const c = classifyRegimes({ cpi: levels(1950, [0.02, 0.02]), assetIndex: levels(2020, [0.03, 0.03]) });
    expect(c.years).toHaveLength(0);
    expect(c.evidence.method).toContain("do not overlap");
  });

  it("states every threshold it used in the evidence, so a reader can disagree with a number", () => {
    const c = classifyRegimes({ cpi: levels(2000, [0.02, 0.03]), assetIndex: levels(2000, [0.04, 0.05]) });
    expect(c.evidence.method).toContain("precedence");
    expect(c.evidence.method).toContain(REGIME_PRECEDENCE[0]);
    expect(c.evidence.method).toContain("5.0%"); // the inflation-shock threshold
    expect(c.evidence.window).toEqual({ from: 2001, to: 2002 });
  });
});

describe("statistics and transitions", () => {
  const long = classifyRegimes({
    cpi: levels(1980, Array.from({ length: 40 }, (_, i) => (i % 9 === 0 ? 0.07 : 0.025))),
    assetIndex: levels(1980, Array.from({ length: 40 }, (_, i) => (i % 7 === 0 ? -0.05 : 0.05))),
  });

  it("summarises each regime with its years, mean and worst", () => {
    const stats = summarize(long.years);
    const contraction = stats.filter((s) => s.regime === "contraction")[0];
    expect(contraction).toBeDefined();
    expect(contraction.yearsList.length).toBe(contraction.years);
    expect(contraction.worstAssetGrowth).toBeLessThan(0);
  });

  it("flags a regime seen fewer than the minimum as sparse rather than treating it as a rate", () => {
    const short = classifyRegimes({
      cpi: levels(2000, [0.02, 0.02, 0.07, 0.02]),
      assetIndex: levels(2000, [0.04, 0.04, 0.10, 0.04]),
    });
    const shockStat = summarize(short.years).filter((s) => s.regime === "inflation-shock")[0];
    expect(shockStat.years).toBeLessThan(MIN_OBSERVATIONS);
    expect(shockStat.sparse).toBe(true);
  });

  it("transition rows are probabilities that sum to one", () => {
    for (const row of long.transitions) {
      const total = Object.keys(row.to).reduce((a, k) => a + row.to[k as keyof typeof row.to], 0);
      expect(total).toBeCloseTo(1, 6);
    }
  });

  it("does not bridge a gap in the record with a transition", () => {
    const years: RegimeYear[] = [
      { year: 2000, regime: "expansion", basis: "", cpiGrowth: 0.02, assetGrowth: 0.05, realAssetGrowth: 0.03, policyRate: null, rateRise: null },
      { year: 2001, regime: "unclassified", basis: "", cpiGrowth: null, assetGrowth: null, realAssetGrowth: null, policyRate: null, rateRise: null },
      { year: 2002, regime: "contraction", basis: "", cpiGrowth: 0.02, assetGrowth: -0.05, realAssetGrowth: -0.07, policyRate: null, rateRise: null },
    ];
    const rows = transitionMatrix(years);
    // 2000 → 2002 is not an observation; no row may claim it.
    const exp = rows.filter((r) => r.from === "expansion")[0];
    expect(exp).toBeUndefined();
  });

  it("reports the regime the record actually ends in", () => {
    expect(mostRecentRegime(long)).not.toBeNull();
    expect(mostRecentRegime({ ...long, years: [] })).toBeNull();
  });
});

describe("regime-conditioned resampling", () => {
  const c = classifyRegimes({
    cpi: levels(1975, Array.from({ length: 50 }, (_, i) => (i % 8 === 0 ? 0.07 : 0.028))),
    assetIndex: levels(1975, Array.from({ length: 50 }, (_, i) => (i % 6 === 0 ? -0.04 : 0.06))),
  });

  it("is deterministic for a seed", () => {
    const a = regimeConditionedPaths(c, { horizon: 20, paths: 200, seed: 7 });
    const b = regimeConditionedPaths(c, { horizon: 20, paths: 200, seed: 7 });
    expect(a.paths).toEqual(b.paths);
    expect(a.regimeTrace).toEqual(b.regimeTrace);
  });

  it("produces the requested shape and a regime trace per path", () => {
    const r = regimeConditionedPaths(c, { horizon: 30, paths: 100, seed: 1 });
    expect(r.paths).toHaveLength(100);
    expect(r.paths[0]).toHaveLength(30);
    expect(r.regimeTrace).toHaveLength(100);
    expect(r.regimeTrace[0].length).toBeGreaterThan(0);
  });

  it("opens in the regime the caller names", () => {
    const r = regimeConditionedPaths(c, { horizon: 10, paths: 50, seed: 3, startRegime: "contraction" });
    expect(r.regimeTrace[0][0]).toBe("contraction");
    expect(r.evidence.method).toContain("opening in contraction");
  });

  it("reports the fallback share rather than hiding an unconditioned draw", () => {
    const r = regimeConditionedPaths(c, { horizon: 20, paths: 50, seed: 5 });
    expect(r.evidence.method).toContain("fell back to the unconditioned record");
  });

  it("refuses, with a reason, when the record is too short to draw blocks", () => {
    const tiny = classifyRegimes({ cpi: levels(2020, [0.02, 0.02]), assetIndex: levels(2020, [0.03, 0.03]) });
    const r = regimeConditionedPaths(tiny, { horizon: 10, paths: 10 });
    expect(r.paths).toHaveLength(0);
    expect(r.reason).toContain("usable years");
  });

  it("percentile paths are ordered, and compound to a rising level path", () => {
    const r = regimeConditionedPaths(c, { horizon: 15, paths: 400, seed: 11 });
    const p10 = percentilePath(r.paths, 0.1), p50 = percentilePath(r.paths, 0.5), p90 = percentilePath(r.paths, 0.9);
    for (let i = 0; i < 15; i++) {
      expect(p10[i]).toBeLessThanOrEqual(p50[i]);
      expect(p50[i]).toBeLessThanOrEqual(p90[i]);
    }
    const lvl = compound(p50);
    expect(lvl).toHaveLength(15);
    expect(lvl[14]).toBeGreaterThan(0);
  });
});

describe("thresholds are data, not folklore", () => {
  it("honours a caller's thresholds over the defaults", () => {
    const series = { cpi: levels(2000, [0.04]), assetIndex: levels(2000, [0.10]) };
    expect(classifyRegimes(series).years[0].regime).toBe("expansion");
    const stricter = classifyRegimes(series, { ...DEFAULT_THRESHOLDS, highCpi: 0.035 });
    expect(stricter.years[0].regime).toBe("inflation-shock");
  });
});
