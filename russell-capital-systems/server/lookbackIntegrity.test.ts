// Each test pins one way a look-back figure could mislead a reader.

import { describe, it, expect } from "vitest";
import {
  arithmeticMean, averagingOverstatement, bestDefensible, classify, geometricMean,
  integrityOf, nationwideIntegrity, LOOKBACK_DISCLOSURE,
  allWindows, creditedSeries, sinceSweep, startYearIntegrity, windowOf,
  CHERRY_PICK_PERCENTILE, MIN_WINDOWS_TO_RANK, LOOKBACK_INTEGRITY_SOURCES,
} from "../shared/lookbackIntegrity";
import { isSourced } from "../shared/sourcing";
import { NATIONWIDE_PUBLISHED_LOOKBACKS, RAW_INDEX_RETURNS } from "../shared/indexCreditingData";

const byId = (id: string) => NATIONWIDE_PUBLISHED_LOOKBACKS.find((l) => l.optionId === id)!;

describe("provenance is read off the carrier's own table", () => {
  it("calls an option lived when Nationwide publishes a 25- or 30-year figure", () => {
    expect(classify(byId("am-highcap-sp500"))).toBe("lived");
    expect(classify(byId("am-multi-index"))).toBe("lived");
  });

  it("calls an option backtested when the long columns are N/A", () => {
    // Nationwide prints null for 30yr and 25yr on every 2022-established index.
    // That absence IS the disclosure; we read it rather than asking anyone to remember.
    expect(classify(byId("ma-bnpp-hfactor-select"))).toBe("backtested");
    expect(classify(byId("ma-jpm-mercury-select"))).toBe("backtested");
  });

  it("classifies every published option without exception", () => {
    for (const l of NATIONWIDE_PUBLISHED_LOOKBACKS) {
      expect(["lived", "backtested", "unknown"]).toContain(classify(l));
    }
  });
});

describe("the headline a page is allowed to print", () => {
  it("is the full published window when the history is real", () => {
    const i = integrityOf(byId("am-highcap-sp500"));
    expect(i.headlineRate).toBe(8.42);      // its 30-year figure
    expect(i.longestPublished).toBe(30);
    expect(i.hindsightGap).toBeNull();
  });

  it("is the LIVED window — not the backtest — when the index is three years old", () => {
    const i = integrityOf(byId("ma-bnpp-hfactor-select"));
    expect(i.longestRate).toBe(19.41);      // what the carrier publishes at 20 years
    expect(i.headlineRate).toBe(11.51);     // what the index actually lived, 5 years
    expect(i.provenance).toBe("backtested");
  });

  it("measures the hindsight gap, and it is large", () => {
    expect(integrityOf(byId("ma-bnpp-hfactor-select")).hindsightGap).toBeCloseTo(7.9, 1);
    // Mercury is the starker one: the simulated window looks 12 points better
    // than the only window the index lived through.
    expect(integrityOf(byId("ma-jpm-mercury-select")).hindsightGap).toBeCloseTo(12.31, 2);
  });

  it("always carries a basis sentence a page can render verbatim", () => {
    for (const i of nationwideIntegrity()) {
      expect(i.basis.length).toBeGreaterThan(20);
    }
  });
});

describe("the number that may be called Nationwide's strongest", () => {
  it("is the best LIVED option, not the best published one", () => {
    const best = bestDefensible()!;
    expect(best.provenance).toBe("lived");
    // High-Cap Multi-Index, 30-year published look-back. Not the S&P options -
    // the multi-index one publishes the strongest figure that stands on real history.
    expect(best.optionId).toBe("am-highcap-multi");
    expect(best.headlineRate).toBe(9.32);
    expect(best.longestPublished).toBe(30);
    // The tempting answer is 19.41. It is not this one, and that is the point.
    expect(best.headlineRate).toBeLessThan(19.41);
  });

  it("sorts lived options ahead of backtested ones", () => {
    const rows = nationwideIntegrity();
    const lastLived = rows.map((r) => r.provenance).lastIndexOf("lived");
    const firstBack = rows.map((r) => r.provenance).indexOf("backtested");
    expect(lastLived).toBeLessThan(firstBack);
  });
});

describe("arithmetic averaging overstates what compounded", () => {
  const sp = Object.entries(RAW_INDEX_RETURNS.SP500)
    .filter(([y]) => +y >= 2006 && +y <= 2025)
    .map(([, v]) => v as number);

  it("has twenty years of S&P 500 price returns to work with", () => {
    expect(sp).toHaveLength(20);
  });

  it("puts the geometric mean below the arithmetic mean, always", () => {
    expect(geometricMean(sp)!).toBeLessThan(arithmeticMean(sp)!);
  });

  it("reproduces the 2006-2025 figures", () => {
    expect(arithmeticMean(sp)!).toBeCloseTo(10.37, 1);
    expect(geometricMean(sp)!).toBeCloseTo(8.86, 1);
    expect(averagingOverstatement(sp)!).toBeCloseTo(1.51, 1);
  });

  it("is exact when every year is identical — the gap comes from variance, not bias", () => {
    expect(geometricMean([7, 7, 7])!).toBeCloseTo(7, 10);
    expect(averagingOverstatement([7, 7, 7])!).toBe(0);
  });

  it("handles a total loss without returning a number", () => {
    expect(geometricMean([-100, 50])).toBeNull();
  });

  it("returns null on an empty series rather than 0", () => {
    expect(geometricMean([])).toBeNull();
    expect(arithmeticMean([])).toBeNull();
  });
});

describe("the disclosure", () => {
  it("names the rate guide and the word Nationwide itself uses", () => {
    expect(LOOKBACK_DISCLOSURE).toContain("FLM-1491AO.10");
    expect(LOOKBACK_DISCLOSURE).toContain("hindsight");
  });
});

describe("start-year integrity: a window is judged against every window of its length", () => {
  const sp = RAW_INDEX_RETURNS.SP500;

  it("builds one window per start year the series can hold, and none past its end", () => {
    // 1994-2025 is 32 years: 23 ten-year windows, 28 five-year windows.
    expect(allWindows(sp, 10)).toHaveLength(23);
    expect(allWindows(sp, 5)).toHaveLength(28);
    expect(windowOf(sp, 2020, 10)).toBeNull();
    expect(windowOf(sp, 2016, 10)!.endYear).toBe(2025);
  });

  it("compounds a window geometrically and keeps the arithmetic figure beside it", () => {
    const w = windowOf(sp, 2006, 20)!;
    expect(w.compounded).toBeCloseTo(8.86, 1);
    expect(w.arithmetic).toBeCloseTo(10.37, 1);
  });

  it("flags a window from the flattering tail as cherry-picked", () => {
    // 1995-1999 is the best five-year run the series holds.
    const r = startYearIntegrity(sp, 1995, 5);
    expect(r.verdict).toBe("flattering");
    expect(r.flagged).toBe(true);
    expect(r.percentile!).toBeGreaterThanOrEqual(CHERRY_PICK_PERCENTILE);
    expect(r.best!.startYear).toBe(1995);
    expect(r.basis).toMatch(/flattering/);
  });

  it("reports the same method started at a peak as unflattering, not flagged", () => {
    const r = startYearIntegrity(sp, 2000, 10);
    expect(r.verdict).toBe("unflattering");
    expect(r.flagged).toBe(false);
    expect(r.chosen!.compounded!).toBeLessThan(r.median!);
  });

  it("shows how far the start year alone moves a ten-year result", () => {
    const r = startYearIntegrity(sp, 2009, 10);
    expect(r.worst!.compounded!).toBeLessThan(0);
    expect(r.best!.compounded!).toBeGreaterThan(14);
    // 2009 begins the year after 2008's fall; the page says so.
    expect(r.startsAfterDrop).toBe(true);
    expect(r.priorYearReturn).toBe(-38.3);
  });

  it("refuses to rank when there are too few windows", () => {
    const r = startYearIntegrity(sp, 1994, 20);
    expect(r.n).toBeLessThan(MIN_WINDOWS_TO_RANK);
    expect(r.verdict).toBe("thin");
    expect(r.flagged).toBe(false);
  });

  it("says so when the window runs outside the series", () => {
    const r = startYearIntegrity(sp, 2020, 10);
    expect(r.verdict).toBe("unplaced");
    expect(r.percentile).toBeNull();
    expect(r.basis.length).toBeGreaterThan(20);
  });

  it("reads the fall from the market series when the compounded series is credited and floored", () => {
    const credited = creditedSeries(sp, (raw) => Math.min(Math.max(raw, 0), 10));
    expect(credited[2008]).toBe(0);
    expect(startYearIntegrity(credited, 2009, 10).startsAfterDrop).toBe(false);
    expect(startYearIntegrity(credited, 2009, 10, sp).startsAfterDrop).toBe(true);
  });

  it("sweeps 'since year X' figures through one end year", () => {
    const since = sinceSweep(sp, 2025, 5);
    expect(since[0]!.startYear).toBe(1994);
    expect(since[since.length - 1]!.startYear).toBe(2021);
    expect(since.every((w) => w.endYear === 2025)).toBe(true);
  });
});

describe("the engine's sources are Sourced records", () => {
  it("names the rate guide and the index series as sourced, and its thresholds as assumptions", () => {
    const defensible = LOOKBACK_INTEGRITY_SOURCES.filter((s) => isSourced(s));
    const assumptions = LOOKBACK_INTEGRITY_SOURCES.filter((s) => s.kind === "assumption");
    expect(defensible.map((s) => s.source).join(" ")).toContain("FLM-1491AO.10");
    expect(defensible.some((s) => s.url?.startsWith("https://"))).toBe(true);
    expect(assumptions.some((s) => s.value === CHERRY_PICK_PERCENTILE)).toBe(true);
    // An assumption may be shown but never passes as a source.
    for (const a of assumptions) expect(isSourced(a)).toBe(false);
  });
});
