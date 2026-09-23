/**
 * The projection horizon: confidence by year, the apply threshold, the decay,
 * the report. Offline.
 */
import { describe, expect, it } from "vitest";
import {
  projectionHorizon,
  projectionReport,
  measuredConfidence,
  decayedConfidence,
  scaleAdjustments,
  applyMacroYear,
  averageAdjustments,
  sliceProjection,
  isNeutral,
  NO_EVIDENCE,
  NEUTRAL_ADJUSTMENTS,
  macroAdjustments,
  MACRO_ASSUMPTIONS,
  A,
  gradeFor,
  type ProjectionEvidence,
  type MacroAdjustments,
} from "@shared/macro";

const TODAY = "2026-09-23";
const liq: MacroAdjustments = macroAdjustments({ treasuryLiquidation: { holder: "CN", fraction: 0.5, months: 12 } }, { runs: 300 });

describe("measured-state confidence", () => {
  it("is the no-history base with nothing measured, grows with signal factors and leads, is capped, and is penalised in a draining pool", () => {
    expect(measuredConfidence(NO_EVIDENCE).value).toBe(A("proj.measured.noHistory"));
    const ten: ProjectionEvidence = { ...NO_EVIDENCE, signalFactors: 10, longestSignalHorizonMonths: 12 };
    expect(measuredConfidence(ten).value).toBe(A("proj.measured.noHistory") + 10 * A("proj.measured.perSignalFactor"));
    const many: ProjectionEvidence = { ...NO_EVIDENCE, signalFactors: 50, measuredLeads: 100, storedCoverageYears: 70 };
    expect(measuredConfidence(many).value).toBe(Math.min(A("proj.measured.cap"), A("proj.measured.noHistory") + A("proj.measured.signalCap") + A("proj.measured.leadCap") + A("proj.measured.longHistoryBonus")));
    const stressed: ProjectionEvidence = { ...ten, dryUpRegime: "draining" };
    expect(measuredConfidence(stressed).value).toBe(measuredConfidence(ten).value - A("proj.measured.stressPenalty"));
    expect(measuredConfidence(stressed).lines.some(l => /draining/.test(l))).toBe(true);
  });

  it("every constant is a rules-table row with a source and a basis", () => {
    for (const id of ["proj.measured.noHistory", "proj.halfLifeYears", "proj.floorConfidence", "proj.applyThreshold", "proj.maxYears"]) {
      const row = MACRO_ASSUMPTIONS.get(id)!;
      expect(row, id).toBeTruthy();
      expect(row.basis.length).toBeGreaterThan(20);
    }
  });
});

describe("decay", () => {
  it("holds through the measured horizon, halves every half-life after it, and never falls below the floor", () => {
    const ev: ProjectionEvidence = { ...NO_EVIDENCE, longestSignalHorizonMonths: 12 };
    expect(decayedConfidence(70, 1, ev)).toBe(70);
    const floor = A("proj.floorConfidence");
    const hl = A("proj.halfLifeYears");
    expect(decayedConfidence(70, 1 + hl, ev)).toBe(Math.round(floor + (70 - floor) / 2));
    expect(decayedConfidence(70, 60, ev)).toBe(floor);
    expect(decayedConfidence(70, 3, ev)).toBeLessThan(decayedConfidence(70, 2, ev));
  });
});

describe("the horizon", () => {
  it("with nothing toggled, nothing is applied and every year says so", () => {
    const h = projectionHorizon(NEUTRAL_ADJUSTMENTS, NO_EVIDENCE, 30, TODAY);
    expect(h.path).toHaveLength(30);
    expect(h.path.every(p => !p.applied && p.weight === 0)).toBe(true);
    expect(h.year1.scenario).toBe(100);
    expect(h.year1.confidence).toBe(A("proj.measured.noHistory"));
    expect(h.path[0].adjustments.tenYearYieldDelta).toBe(0);
    expect(isNeutral(h.path[10].adjustments)).toBe(true);
  });

  it("with a scenario, year 1 takes the lower of measured and scenario confidence, applies fully, and fades to the calculator's own assumptions", () => {
    expect(isNeutral(liq)).toBe(false);
    const h = projectionHorizon(liq, NO_EVIDENCE, 40, TODAY);
    expect(h.year1.confidence).toBe(Math.min(A("proj.measured.noHistory"), liq.confidence));
    expect(h.path[0].applied).toBe(true);
    expect(h.path[0].weight).toBe(1);
    expect(h.path[0].adjustments.tenYearYieldDelta).toBe(liq.tenYearYieldDelta);
    const last = h.path[h.path.length - 1];
    expect(last.applied).toBe(false);
    expect(last.adjustments.tenYearYieldDelta).toBe(0);
    expect(last.adjustments.equityReturnMultiplier).toBe(1);
    // Monotone: confidence and weight never rise with the year.
    for (let i = 1; i < h.path.length; i++) {
      expect(h.path[i].confidence).toBeLessThanOrEqual(h.path[i - 1].confidence);
      expect(h.path[i].weight).toBeLessThanOrEqual(h.path[i - 1].weight);
    }
    expect(h.confidentYears).toBe(h.path.filter(p => p.confidence >= A("proj.applyThreshold")).length);
    expect(h.confidentYears).toBeGreaterThanOrEqual(1);
    expect(h.confidentYears).toBeLessThan(15);
    expect(h.sourceIds.length).toBeGreaterThan(0);
    expect(h.rationale.some(r => /Year-1 confidence/.test(r))).toBe(true);
  });

  it("more measured evidence projects further, and a draining pool projects less", () => {
    const base = projectionHorizon(liq, NO_EVIDENCE, 30, TODAY);
    const strong = projectionHorizon(liq, { ...NO_EVIDENCE, signalFactors: 12, measuredLeads: 10, storedCoverageYears: 60, longestSignalHorizonMonths: 12 }, 30, TODAY);
    // Year-1 is bounded by the scenario's own confidence; the extra evidence shows in the decay start and the measured component.
    expect(strong.year1.measured).toBeGreaterThan(base.year1.measured);
    expect(strong.confidentYears).toBeGreaterThanOrEqual(base.confidentYears);
    const drained = projectionHorizon(liq, { ...NO_EVIDENCE, dryUpRegime: "dried-up" }, 30, TODAY);
    expect(drained.year1.confidence).toBeLessThan(base.year1.confidence);
  });

  it("clamps the horizon to the rules-table maximum", () => {
    expect(projectionHorizon(liq, NO_EVIDENCE, 500, TODAY).path).toHaveLength(A("proj.maxYears"));
  });
});

describe("applying a projected year", () => {
  it("scales deltas and multipliers toward neutral, applies by year, and averages over the horizon", () => {
    const half = scaleAdjustments(liq, 0.5);
    expect(half.tenYearYieldDelta).toBeCloseTo(liq.tenYearYieldDelta / 2, 4);
    expect(half.equityReturnMultiplier).toBeCloseTo(1 + (liq.equityReturnMultiplier - 1) / 2, 4);
    expect(scaleAdjustments(liq, 0).tenYearYieldDelta).toBe(0);
    const h = projectionHorizon(liq, NO_EVIDENCE, 30, TODAY);
    const y1 = applyMacroYear({ mortgageRate: 0.065, expectedReturn: 0.07 }, h, 1);
    expect(y1.mortgageRate).toBeCloseTo(0.065 + liq.mortgageRateDelta / 100, 6);
    const y30 = applyMacroYear({ mortgageRate: 0.065, expectedReturn: 0.07 }, h, 30);
    expect(y30.mortgageRate).toBe(0.065);
    expect(applyMacroYear({ mortgageRate: 0.065 }, h, 999).mortgageRate).toBe(0.065);
    const avg = averageAdjustments(h);
    expect(Math.abs(avg.tenYearYieldDelta)).toBeLessThan(Math.abs(liq.tenYearYieldDelta));
    expect(Math.abs(avg.tenYearYieldDelta)).toBeGreaterThan(0);
    expect(avg.rationale.some(r => /Averaged over 30 projected years/.test(r))).toBe(true);
  });
});

describe("the report", () => {
  it("carries the year table, the reasoning, the rules rows, the evidence and the references with URLs", () => {
    const h = projectionHorizon(liq, NO_EVIDENCE, 10, TODAY);
    const md = projectionReport(h, { calculator: "Mortgage Killer", baseAssumptions: { mortgageRate: "6.5 %", expectedReturn: "7 %" } });
    expect(md).toMatch(/^# Projection confidence report/);
    expect(md).toMatch(/Calculator: Mortgage Killer/);
    expect(md).toMatch(/\| 1 \| \d+ \| [A-F] \| yes \| 100 % \|/);
    expect(md).toMatch(/\| 10 \| \d+ \| [A-F] \| no \| 0 % \|/);
    expect(md).toMatch(/## How the confidence was formed/);
    expect(md).toMatch(/`proj\.halfLifeYears` = 3/);
    expect(md).toMatch(/no backtest has run in this deployment yet/);
    expect(md).toMatch(/## References\n\n- .+: https?:\/\//);
    expect(md).toMatch(/\| mortgageRate \| 6\.5 % \|/);
    const neutral = projectionReport(projectionHorizon(NEUTRAL_ADJUSTMENTS, NO_EVIDENCE, 5, TODAY));
    expect(neutral).toMatch(/No scenario toggled, so no engine sources were consulted/);
    expect(gradeFor(h.year1.confidence)).toBe(h.year1.grade);
  });
});

describe("slicing the portal's path to a calculator's horizon (production port, A22)", () => {
  it("cuts the path, recounts the confident years, and averages over the slice only", () => {
    const ev: ProjectionEvidence = { ...NO_EVIDENCE, signalFactors: 10, longestSignalHorizonMonths: 12 };
    const full = projectionHorizon(liq, ev, 60, TODAY);
    const ten = sliceProjection(full, 10);
    expect(ten.years).toBe(10);
    expect(ten.path).toHaveLength(10);
    expect(ten.path).toEqual(full.path.slice(0, 10));
    expect(ten.confidentYears).toBe(full.path.slice(0, 10).filter(p => p.confidence >= A("proj.applyThreshold")).length);
    expect(ten.confidentYears).toBeLessThanOrEqual(full.confidentYears);
    // Averaging a slice equals averaging a path computed to that horizon directly.
    expect(averageAdjustments(ten)).toEqual(averageAdjustments(projectionHorizon(liq, ev, 10, TODAY)));
    // Out-of-range horizons clamp to [1, path length]; the input is not mutated.
    expect(sliceProjection(full, 0).path).toHaveLength(1);
    expect(sliceProjection(full, 500).path).toHaveLength(60);
    expect(full.path).toHaveLength(60);
  });
});
