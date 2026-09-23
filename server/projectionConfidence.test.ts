/**
 * Projection confidence: how far a calculator can project with confidence.
 * The horizons are rules-table rows; the grade inside the first band comes
 * from what is actually applied; every answer carries reasoning and citations.
 */
import { describe, expect, it } from "vitest";
import { projectionConfidence, nearTermGrade } from "../shared/macro/projectionConfidence";
import { NEUTRAL_ADJUSTMENTS, assumption, type MacroAdjustments } from "../shared/macro";
import { PREDICTIVE_CALCULATOR_PATHS, predictiveDomainFor, NON_PREDICTIVE_PATHS } from "../shared/predictiveCalculators";
import { CALCULATORS } from "../shared/calculatorCatalog";

const scenario: MacroAdjustments = {
  ...NEUTRAL_ADJUSTMENTS,
  tenYearYieldDelta: 0.8,
  mortgageRateDelta: 0.7,
  equityReturnMultiplier: 0.93,
  rationale: ["China sells 50% of its Treasuries over 12 months: +80 bp on the 10-year (liq.impact.mode)."],
  sourceIds: ["us-tic-mfh", "liq.impact.mode"],
  confidence: 62,
};

describe("the horizons are rules, not inline constants", () => {
  it("reads confident / moderate / band horizons from the assumptions table", () => {
    expect(assumption("projection.horizon.confident").value).toBe(2);
    expect(assumption("projection.horizon.moderate").value).toBe(10);
    expect(assumption("projection.horizon.band").value).toBe(30);
    for (const id of ["projection.horizon.confident", "projection.horizon.moderate", "projection.horizon.band"]) {
      expect(assumption(id).kind).toBe("model-choice");
      expect(assumption(id).basis.length).toBeGreaterThan(80);
    }
  });
});

describe("projectionConfidence", () => {
  it("grades a thirty-year projection with nothing applied as B, C, D and says so", () => {
    const c = projectionConfidence({ years: 30 });
    expect(c.confidentYears).toBe(2);
    expect(c.byYear.slice(0, 2)).toEqual(["B", "B"]);
    expect(c.byYear[2]).toBe("C");
    expect(c.byYear[9]).toBe("C");
    expect(c.byYear[10]).toBe("D");
    expect(c.byYear[29]).toBe("D");
    expect(c.byYear).toHaveLength(30);
    expect(c.overall).toBe("D");
    expect(c.statement).toMatch(/Confident for 2 years/);
    expect(c.statement).toMatch(/a band to year 30/);
    expect(c.reasoning[0]).toMatch(/No scenario or forecast is applied/);
  });

  it("marks years beyond thirty as shape only", () => {
    const c = projectionConfidence({ years: 40 });
    expect(c.byYear[30]).toBe("E");
    expect(c.overall).toBe("E");
    expect(c.statement).toMatch(/years 31 to 40 are shape only/);
  });

  it("lifts the near term to A when a forecast with provenance is applied", () => {
    const c = projectionConfidence({ years: 10, forecast: { source: "FRED DGS10", asOf: "2026-09-22", method: "latest observation held flat" } });
    expect(c.byYear[0]).toBe("A");
    expect(c.byYear[1]).toBe("A");
    expect(c.byYear[2]).toBe("C");
    expect(c.reasoning[0]).toMatch(/Forecast overlay applied: FRED DGS10/);
    expect(c.citations[0]).toMatchObject({ kind: "forecast", title: "FRED DGS10", asOf: "2026-09-22" });
  });

  it("never grades the near term above the scenario's own confidence score", () => {
    // 62/100 grades C on the confidence engine's bands, so the first band is C.
    expect(nearTermGrade(scenario, null)).toBe("C");
    const c = projectionConfidence({ years: 5, adjustments: scenario });
    expect(c.byYear[0]).toBe("C");
    expect(c.reasoning).toContain(scenario.rationale[0]);
    expect(c.reasoning.some(r => /confidence 62\/100/.test(r))).toBe(true);
  });

  it("keeps a forecast from outranking a weak scenario", () => {
    const g = nearTermGrade(scenario, { source: "FRED DGS10", asOf: "2026-09-22", method: "held flat" });
    expect(g).toBe("C");
  });

  it("does not count an unavailable forecast as applied", () => {
    const c = projectionConfidence({ years: 3, forecast: { source: "", asOf: "", method: "", unavailableReason: "no sourced history supplied for equities" } });
    expect(c.byYear[0]).toBe("B");
    expect(c.reasoning[0]).toMatch(/not applied: no sourced history/);
    expect(c.citations.find(x => x.kind === "forecast")).toBeUndefined();
  });

  it("resolves scenario source ids to the registry with links and cites the horizon rules", () => {
    const c = projectionConfidence({ years: 10, adjustments: scenario });
    const tic = c.citations.find(x => x.id === "us-tic-mfh")!;
    expect(tic.kind).toBe("source");
    expect(tic.url).toMatch(/^https:\/\//);
    const asm = c.citations.find(x => x.id === "liq.impact.mode")!;
    expect(asm.kind).toBe("assumption");
    expect(asm.asOf).toBe("2013-01-01");
    expect(asm.note).toMatch(/Beltran/);
    const rules = c.citations.filter(x => x.id.startsWith("projection.horizon."));
    expect(rules).toHaveLength(3);
    // No duplicates.
    expect(new Set(c.citations.map(x => x.id)).size).toBe(c.citations.length);
  });
});

describe("which calculators are predictive", () => {
  it("covers most of the catalogue and every path exists in it", () => {
    const paths = new Set(CALCULATORS.map(c => c.path));
    for (const p of PREDICTIVE_CALCULATOR_PATHS) expect(paths.has(p), p).toBe(true);
    expect(PREDICTIVE_CALCULATOR_PATHS.length).toBeGreaterThanOrEqual(60);
    for (const p of NON_PREDICTIVE_PATHS) expect(paths.has(p), `${p} is not in the catalogue`).toBe(true);
  });

  it("puts each page in the domain its projection moves with", () => {
    expect(predictiveDomainFor("/portal/mortgage-killer")).toBe("housing");
    expect(predictiveDomainFor("/portal/tax-waterfall")).toBe("inflation");
    expect(predictiveDomainFor("/portal/iul-projection")).toBe("equities");
    expect(predictiveDomainFor("/portal/myga-fixed-rate")).toBe("rates");
    expect(predictiveDomainFor("/portal/time-machine")).toBe("equities");
    expect(predictiveDomainFor("/portal/physicians-edge")).toBe("wages");
  });

  it("leaves lookup, reader and how-it-works pages alone", () => {
    expect(predictiveDomainFor("/portal/carrier-ratings")).toBeNull();
    expect(predictiveDomainFor("/portal/quick-quote")).toBeNull();
    expect(predictiveDomainFor("/portal/mechanism/policy-loan")).toBeNull();
    expect(predictiveDomainFor("/portal/brain-hub")).toBeNull();
    expect(predictiveDomainFor("/portal/whisper-coach")).toBeNull();
    expect(predictiveDomainFor("/portal/mortgage-killer?tab=projection")).toBe("housing");
  });
});
