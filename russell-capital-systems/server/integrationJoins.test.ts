import { describe, it, expect } from "vitest";
import {
  allRulesTables, rulesTable, rowsBelowEvidence, allNeverPrinted, evidenceCoverage,
  EVIDENCE_SCALE,
} from "../shared/rulesTable";
import { ensureRulesTablesRegistered, thresholdsTable, divorceRulesTable, ag49Table } from "../shared/rulesTableAdapters";
import { capFor, checkRate, AG49_PRODUCTS, AG49_VERSION } from "../shared/ag49Products";
import { contextFor, contextForAll, recoveredWindows, seriesInput, BRIDGE_DISCLOSURE } from "../shared/shockRegimeBridge";
import { SHOCKS, runAllShocks, type PolicyTerms } from "../shared/historicalShocks";
import { reconcile, RECORDED_DIVERGENCE } from "../shared/indexSeriesReconciliation";
import type { AnnualSeries } from "../shared/rentalMarketEngine";

ensureRulesTablesRegistered();

/** Index levels from annual growth rates, starting at 100. */
function levels(startYear: number, growths: number[]): AnnualSeries {
  const values: number[] = [100];
  for (let i = 0; i < growths.length; i++) values.push(values[values.length - 1] * (1 + growths[i]));
  return { startYear, values };
}

describe("the rules-table contract — one shape for every table that holds law", () => {
  it("registers every adapted table exactly once", () => {
    const ids = allRulesTables().map((t) => t.id);
    expect(ids).toContain("thresholds");
    expect(ids).toContain("divorce-state-rules");
    expect(ids).toContain("ag49-products");
    // Re-registering must replace, not duplicate.
    ensureRulesTablesRegistered();
    const after = allRulesTables().map((t) => t.id);
    expect(after.filter((i) => i === "thresholds")).toHaveLength(1);
  });

  it("every table carries a version, an as-of date and a never-print list", () => {
    for (const t of allRulesTables()) {
      expect(t.version, t.id).toBeTruthy();
      expect(t.asOf, t.id).toBeTruthy();
      expect(t.neverPrinted.length, t.id).toBeGreaterThan(0);
      expect(t.rows.length, t.id).toBeGreaterThan(0);
    }
  });

  it("reuses the divorce table's own never-print list rather than restating it", async () => {
    const { RULES_VERSION } = await import("../shared/divorceStateRules");
    expect(divorceRulesTable.neverPrinted).toBe(RULES_VERSION.neverPrinted);
    expect(divorceRulesTable.version).toBe(RULES_VERSION.version);
  });

  it("resolves a source for a row, and null for a row that has none", () => {
    const anyThreshold = thresholdsTable.rows[0];
    const src = thresholdsTable.sourceFor(thresholdsTable.idOf(anyThreshold));
    expect(src).not.toBeNull();
    expect(src!.url).toBeTruthy();
    expect(src!.evidence).toBeGreaterThanOrEqual(1);
    expect(src!.evidence).toBeLessThanOrEqual(10);
    expect(thresholdsTable.sourceFor("no-such-row-id")).toBeNull();
  });

  it("names the rows that would block publication at a given evidence bar", () => {
    const weak = rowsBelowEvidence(thresholdsTable, EVIDENCE_SCALE.primaryParty);
    // The shape is what matters; the count moves as research lands.
    for (const row of weak) {
      expect(typeof row.id).toBe("string");
      expect(row.evidence === null || row.evidence < EVIDENCE_SCALE.primaryParty).toBe(true);
    }
  });

  it("collects every never-print line across tables without duplicates", () => {
    const lines = allNeverPrinted();
    expect(lines.length).toBeGreaterThan(0);
    expect(new Set(lines).size).toBe(lines.length);
  });

  it("summarises coverage per table for the scorecard", () => {
    const cov = evidenceCoverage();
    expect(cov.length).toBe(allRulesTables().length);
    for (const c of cov) {
      expect(c.below).toBeLessThanOrEqual(c.rows);
      expect(rulesTable(c.id)).not.toBeNull();
    }
  });
});

describe("AG 49-A maxima are product-specific, and an absent product is a refusal", () => {
  it("carries the one product whose figure has actually been read", () => {
    expect(AG49_PRODUCTS.length).toBeGreaterThanOrEqual(1);
    expect(capFor("pacific-horizon-ecv")).toBeCloseTo(0.0635, 6);
  });

  it("returns null — never a default — for a product with no verified figure", () => {
    expect(capFor("some-unverified-product")).toBeNull();
  });

  it("refuses a rate above the product's own maximum, naming both numbers", () => {
    const r = checkRate("pacific-horizon-ecv", 0.075);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.cap).toBeCloseTo(0.0635, 6);
      expect(r.reason).toContain("7.50%");
      expect(r.reason).toContain("6.35%");
    }
  });

  it("accepts a rate at or below the maximum", () => {
    expect(checkRate("pacific-horizon-ecv", 0.0635).ok).toBe(true);
    expect(checkRate("pacific-horizon-ecv", 0.05).ok).toBe(true);
  });

  it("refuses when no product is named, because a maximum cannot exist without one", () => {
    const r = checkRate(null, 0.06);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("product-specific");
  });

  it("forbids printing an industry-wide maximum", () => {
    expect(AG49_VERSION.neverPrinted.join(" ")).toContain("industry-wide");
  });
});

describe("shock ↔ regime bridge — more information, honestly bounded", () => {
  const terms: PolicyTerms = { cap: 10, floor: 0, participation: 100 };

  // CPI and an asset index reaching back before the index series does.
  const longCpi = levels(1970, Array.from({ length: 56 }, (_, i) => (i < 6 ? 0.09 : 0.028)));
  const longAsset = levels(1970, Array.from({ length: 56 }, (_, i) => (i < 6 ? 0.01 : 0.055)));

  it("attaches a regime reading to a window the index series cannot cover", () => {
    const results = runAllShocks(terms);
    const contexts = contextForAll(results, seriesInput(longCpi, longAsset));
    const oil = contexts.filter((c) => c.shock.id === "oil-1973")[0];
    expect(oil).toBeDefined();
    expect(oil.credited).toBeNull();
    expect(oil.creditedUnavailableReason).toBeTruthy();
    expect(oil.regimes.length).toBeGreaterThan(0);
    expect(oil.dominantRegime).not.toBeNull();
  });

  it("never invents a credited rate for a window with no index series", () => {
    const results = runAllShocks(terms);
    const contexts = contextForAll(results, seriesInput(longCpi, longAsset));
    for (const c of contexts) {
      if (c.credited === null) {
        expect(c.summary).toContain("no credited rate is shown");
      }
    }
    expect(BRIDGE_DISCLOSURE).toContain("never substitutes");
  });

  it("says so plainly when neither the index nor the supplied series reach", () => {
    const shortCpi = levels(2015, [0.02, 0.02, 0.02]);
    const shortAsset = levels(2015, [0.04, 0.04, 0.04]);
    const results = runAllShocks(terms);
    const contexts = contextForAll(results, seriesInput(shortCpi, shortAsset));
    const oil = contexts.filter((c) => c.shock.id === "oil-1973")[0];
    expect(oil.regimes).toHaveLength(0);
    expect(oil.regimeUnavailableReason).toContain("No supplied series covers");
  });

  it("counts what was actually recovered rather than assuming it", () => {
    const results = runAllShocks(terms);
    const rich = recoveredWindows(contextForAll(results, seriesInput(longCpi, longAsset)));
    const poor = recoveredWindows(contextForAll(results, seriesInput(null, null)));
    expect(rich.total).toBe(SHOCKS.length);
    expect(rich.regimeOnly).toBeGreaterThan(0);
    expect(poor.regimeOnly).toBe(0);
    expect(poor.stillDark).toBeGreaterThan(0);
  });

  it("leaves an available window's credited result intact", () => {
    const results = runAllShocks(terms);
    const contexts = contextForAll(results, seriesInput(longCpi, longAsset));
    const gfc = contexts.filter((c) => c.shock.id === "gfc-2008")[0];
    if (gfc && gfc.credited) {
      expect(gfc.credited.available).toBe(true);
      expect(gfc.creditedUnavailableReason).toBeNull();
    }
  });

  it("contextFor handles a single result as well as the batch", () => {
    const one = runAllShocks(terms)[0];
    const c = contextFor(one, seriesInput(longCpi, longAsset));
    expect(c.shock).toBe(one.shock);
    expect(c.summary.length).toBeGreaterThan(0);
  });
});

describe("index-series reconciliation — two S&P series, and they disagree", () => {
  const report = reconcile();

  it("finds an overlap between the two series", () => {
    expect(report.overlapYears).toBeGreaterThan(10);
    expect(report.overlapFrom).not.toBeNull();
    expect(report.overlapTo).not.toBeNull();
  });

  it("detects that they measure different things", () => {
    expect(report.agrees).toBe(false);
    expect(report.divergences.length).toBeGreaterThan(0);
    expect(report.maxGap).not.toBeNull();
  });

  it("the total-return series sits above the price series on average, as dividends imply", () => {
    expect(report.meanGap).not.toBeNull();
    // Dividends have contributed roughly 1.8–2.0 points a year over the long run.
    expect(report.meanGap!).toBeGreaterThan(0.005);
    expect(report.meanGap!).toBeLessThan(0.05);
  });

  it("normalises the unit mismatch rather than comparing percent against decimal", () => {
    // 2009: price 23.5% vs total 26.46% — a gap of about three points, not of 26.
    const y2009 = report.divergences.filter((d) => d.year === 2009)[0];
    expect(y2009).toBeDefined();
    expect(y2009.priceReturn).toBeCloseTo(0.235, 3);
    expect(y2009.totalReturn).toBeCloseTo(0.2646, 4);
    expect(y2009.gap).toBeGreaterThan(0.02);
    expect(y2009.gap).toBeLessThan(0.04);
  });

  it("records the unit hazard, because the types do not distinguish the two", () => {
    expect(RECORDED_DIVERGENCE.unitMismatch.hazard).toContain("Record<number, number>");
  });

  it("records the consumers still running on the unaudited series", () => {
    expect(RECORDED_DIVERGENCE.consumersOnTheUnauditedSeries.length).toBeGreaterThan(0);
    expect(RECORDED_DIVERGENCE.ownerDecision).toContain("republication");
  });

  it("states that crediting belongs on the price series", () => {
    expect(report.disclosure).toContain("price index");
  });
});
