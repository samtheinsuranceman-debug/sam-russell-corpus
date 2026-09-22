// Each test pins one way a look-back figure could mislead a reader.

import { describe, it, expect } from "vitest";
import {
  arithmeticMean, averagingOverstatement, bestDefensible, classify, geometricMean,
  integrityOf, nationwideIntegrity, LOOKBACK_DISCLOSURE,
} from "../shared/lookbackIntegrity";
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
