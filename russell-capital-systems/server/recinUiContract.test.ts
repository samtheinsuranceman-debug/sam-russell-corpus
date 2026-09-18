/**
 * UI contract test.
 *
 * The RECIN Workspace renders directly from engine output, so the failure mode
 * that actually bites is silent drift: an engine field gets renamed and a
 * screen quietly shows "—" or crashes in production. TypeScript does not catch
 * it because the tRPC result is consumed as `any` at the render boundary.
 *
 * This asserts that every field path the seven screens read exists, with the
 * right shape, on real engine output. If a rename breaks a screen, it breaks
 * here first.
 */
import { describe, it, expect } from "vitest";
import {
  analyzeRealEstateCapitalScenario,
  compareStrategies,
} from "../shared/realEstateCapacityEngine";
import { channelStatus } from "./realEstateDataAdapters";
import {
  clientReleaseGate,
  groupByReviewer,
  prioritizeReviewQueue,
  type ReviewableFinding,
} from "./realEstateSourceLedger";
import type {
  DebtOption,
  PropertyInput,
  RealEstateCapitalScenarioInput,
} from "../shared/realEstateCapitalTypes";

/* The same scenario the workspace ships as its demo. */
const propA: PropertyInput = {
  id: "propA", name: "Maple Duplex", value: 500_000,
  valueAsOf: "2026-08-01", valueSource: "appraisal",
  annualGrossRent: 48_000, annualOperatingExpenses: 9_000,
  annualTaxes: 5_000, annualInsurance: 2_000, annualMaintenanceReserve: 2_400,
  occupancy: 0.95, ownershipType: "llc", useType: "rental_1_4",
  liens: [], adjustedBasis: 320_000, accumulatedDepreciation: 60_000,
};
const propB: PropertyInput = {
  id: "propB", name: "Cedar Fourplex", value: 400_000,
  valueAsOf: "2026-08-01", valueSource: "appraisal",
  annualGrossRent: 39_000, annualOperatingExpenses: 7_500,
  annualTaxes: 4_200, annualInsurance: 1_800, annualMaintenanceReserve: 1_950,
  occupancy: 0.95, ownershipType: "llc", useType: "rental_1_4",
  liens: [], earmarkedForSuccession: true,
};
const bridge: DebtOption = {
  id: "bridge", label: "Bridge to DSCR", category: "bridge", rate: 0.115,
  rateType: "variable", termMonths: 18, interestOnlyMonths: 18,
  maxLtv: 0.75, maxLtc: 0.8, maxArv: 0.7, pointsPct: 0.02, closingCostsPct: 0.015,
  prepayment: { kind: "flat_pct", flatPct: 0.01 },
  recourse: "full", collateralMode: "single", paymentMode: "interest_only",
  termsSource: { status: "illustrative" },
};
const dscr: DebtOption = {
  id: "dscr", label: "DSCR cash-out refinance", category: "dscr", rate: 0.075,
  rateType: "fixed", termMonths: 360, amortizationMonths: 360,
  maxLtv: 0.75, maxCltv: 0.75, minDscr: 1.25, pointsPct: 0.01, closingCostsPct: 0.02,
  prepayment: { kind: "step_down", stepDownPctByYear: [0.05, 0.04, 0.03] },
  recourse: "limited", collateralMode: "single", paymentMode: "amortizing",
  termsSource: { status: "illustrative" },
};

const scenario: RealEstateCapitalScenarioInput = {
  properties: [propA, propB],
  debtOptions: [dscr, bridge],
  assumptions: {
    vacancyRate: 0.07, rentGrowth: 0.03, expenseGrowth: 0.03, propertyValueGrowth: 0.03,
    rateShockBps: 0, exitMonths: 18, saleCostPct: 0.07,
    refinanceRate: 0.075, refinanceMaxLtv: 0.75, refinanceMinDscr: 1.25,
    taxReviewRequired: true,
  },
  liquidity: {
    totalLiquidReserves: 120_000,
    earmarkedRetirementBuffer: 60_000,
    monthlyFixedCostsOutsideProperty: 4_000,
  },
  requestedProceeds: 400_000,
  acquisition: {
    purchasePrice: 300_000, verifiedRehab: 75_000, eligibleClosingCosts: 10_000,
    afterRepairValue: 450_000, projectedAnnualGrossRent: 54_000,
    projectedAnnualOperatingExpenses: 20_000,
  },
};

const result = analyzeRealEstateCapitalScenario(scenario);
const ranked = compareStrategies(result);

const isNum = (v: unknown) => typeof v === "number" && !Number.isNaN(v);

describe("Portfolio Map reads", () => {
  it("has every portfolio field the screen renders", () => {
    const p = result.metrics.portfolioMetrics;
    for (const k of [
      "totalValue", "totalNoi", "totalExistingDebt", "portfolioLtv",
      "crossCollateralizedCount", "crossCollateralExposureValue",
    ] as const) {
      expect(isNum(p[k]), `portfolioMetrics.${k}`).toBe(true);
    }
  });

  it("has every property-row field the table renders", () => {
    expect(result.metrics.propertyMetrics.length).toBeGreaterThan(0);
    for (const m of result.metrics.propertyMetrics) {
      expect(typeof m.propertyId).toBe("string");
      expect(typeof m.name).toBe("string");
      expect(typeof m.isFreeAndClear).toBe("boolean");
      expect(typeof m.crossCollateralized).toBe("boolean");
      expect(typeof m.bindingConstraint).toBe("string");
      for (const k of [
        "value", "noi", "existingSeniorBalance", "existingJuniorBalance",
        "undrawnAvailability", "currentLtv", "bindingCapacity",
      ] as const) {
        expect(isNum(m[k]), `propertyMetrics.${k}`).toBe(true);
      }
      // currentDscr is Infinity for an unencumbered property — the UI must
      // handle that, so assert it is a number rather than finite.
      expect(typeof m.currentDscr).toBe("number");
    }
  });
});

describe("Capital Capacity reads", () => {
  it("has every summary field", () => {
    const s = result.summary;
    expect(isNum(s.maximumCollateralCapacity)).toBe(true);
    expect(isNum(s.recommendedMaximumPrudentCapacity)).toBe(true);
    expect(isNum(s.minimumReserveMonths)).toBe(true);
    expect(typeof s.bindingConstraint).toBe("string");
    // Nullable by contract — the screen branches on both.
    expect(s.maximumIncomeSupportedCapacity === null || isNum(s.maximumIncomeSupportedCapacity)).toBe(true);
    expect(s.shortfallAgainstRequest === null || isNum(s.shortfallAgainstRequest)).toBe(true);
  });

  it("exposes the policy threshold the reserve stat compares against", () => {
    expect(isNum(result.policyUsed.targetReserveMonths)).toBe(true);
  });

  it("never reports prudent capacity above the collateral maximum", () => {
    expect(result.summary.recommendedMaximumPrudentCapacity).toBeLessThanOrEqual(
      result.summary.maximumCollateralCapacity + 1,
    );
  });
});

describe("Strategy Compare reads", () => {
  it("ranks every option with the fields the card renders", () => {
    expect(ranked).toHaveLength(scenario.debtOptions.length);
    for (const r of ranked) {
      expect(typeof r.optionId).toBe("string");
      expect(typeof r.label).toBe("string");
      expect(isNum(r.rank)).toBe(true);
      expect(isNum(r.fragility)).toBe(true);
      expect(isNum(r.prudentCapacity)).toBe(true);
    }
  });

  it("can join every ranked row back to an option", () => {
    const byId = new Set(result.options.map((o) => o.optionId));
    for (const r of ranked) expect(byId.has(r.optionId), `orphan row ${r.optionId}`).toBe(true);
  });

  it("gives every option all three scenario columns", () => {
    for (const o of result.options) {
      for (const k of ["base", "conservative", "severe"] as const) {
        const sc = o.scenarios[k];
        expect(sc.label).toBe(k);
        expect(isNum(sc.supportedProceeds)).toBe(true);
        expect(typeof sc.dscr).toBe("number");
        expect(isNum(sc.ltv)).toBe(true);
        expect(typeof sc.reserveMonths).toBe("number");
        expect(typeof sc.passesPolicy).toBe("boolean");
        expect(Array.isArray(sc.failures)).toBe(true);
      }
      expect(Array.isArray(o.ineligibleReasons)).toBe(true);
      expect(typeof o.eligible).toBe("boolean");
    }
  });
});

describe("Exit Map reads", () => {
  it("attaches exit analysis to the bridge option", () => {
    const b = result.options.find((o) => o.optionId === "bridge")!;
    expect(b.exitAnalysis).toBeDefined();
    const e = b.exitAnalysis!;
    expect(isNum(e.payoffAtExit)).toBe(true);
    expect(typeof e.exitCoverage).toBe("number");
    const t = e.takeoutReadiness;
    expect(isNum(t.refinanceProceeds)).toBe(true);
    expect(isNum(t.score)).toBe(true);
    expect(typeof t.passesLtv).toBe("boolean");
    expect(typeof t.passesDscr).toBe("boolean");
    expect(typeof t.passesDebtYield).toBe("boolean");
    expect(Array.isArray(t.blockers)).toBe(true);
  });

  it("omits exit analysis for permanent debt, which the screen handles", () => {
    expect(result.options.find((o) => o.optionId === "dscr")!.exitAnalysis).toBeUndefined();
  });
});

describe("Risk Radar reads", () => {
  it("gives every finding the fields the card and 'why this exists' panel render", () => {
    expect(result.findings.length).toBeGreaterThan(0);
    for (const f of result.findings) {
      expect(typeof f.code).toBe("string");
      expect(typeof f.severity).toBe("string");
      expect(typeof f.category).toBe("string");
      expect(typeof f.title).toBe("string");
      expect(typeof f.detail).toBe("string");
      expect(typeof f.recommendation).toBe("string");
      expect(Object.keys(f.evidence).length).toBeGreaterThan(0);
      // The panel renders these three; they must be present on capacity findings.
      expect(isNum(f.confidence)).toBe(true);
      expect(isNum(f.materiality)).toBe(true);
      expect(typeof f.requiredReviewer).toBe("string");
      expect(typeof f.invalidatedBy).toBe("string");
    }
  });

  it("uses only severities the screen has a style for", () => {
    const styled = ["critical", "high", "medium", "low", "info"];
    for (const f of result.findings) expect(styled).toContain(f.severity);
  });
});

describe("Evidence Ledger reads", () => {
  it("renders policy as flat, printable key/values", () => {
    for (const [k, v] of Object.entries(result.policyUsed)) {
      expect(typeof k).toBe("string");
      expect(["number", "string", "boolean"]).toContain(typeof v);
    }
  });

  it("has disclaimers and typed missing inputs", () => {
    expect(result.disclaimers.length).toBeGreaterThan(0);
    for (const m of result.requiredInputs) {
      expect(typeof m.field).toBe("string");
      expect(typeof m.whyItMatters).toBe("string");
      expect(typeof m.blocksCalculation).toBe("boolean");
    }
  });

  it("has every channel field the status list renders", () => {
    const channels = channelStatus({});
    expect(channels.length).toBeGreaterThan(0);
    for (const c of channels) {
      expect(typeof c.channel).toBe("string");
      expect(typeof c.label).toBe("string");
      expect(isNum(c.phase)).toBe(true);
      expect(typeof c.enabled).toBe("boolean");
      expect(typeof c.operational).toBe("boolean");
    }
  });
});

describe("Review Queue reads", () => {
  /** Exactly the mapping the screen performs before calling the procedure. */
  const reviewable: ReviewableFinding[] = result.findings.map((f, i) => ({
    id: `${f.code}-${i}`,
    scenarioRunId: "current",
    findingCode: f.code,
    severity: f.severity,
    title: f.title,
    confidence: f.confidence ?? 0.8,
    materiality: f.materiality ?? 0.5,
    requiredReviewer: f.requiredReviewer ?? "advisor",
    advisorStatus: "pending",
  }));

  it("maps findings into the review shape without losing any", () => {
    expect(reviewable).toHaveLength(result.findings.length);
    for (const r of reviewable) {
      expect(isNum(r.confidence)).toBe(true);
      expect(isNum(r.materiality)).toBe(true);
    }
  });

  it("produces a queue, a grouping and a gate", () => {
    const queue = prioritizeReviewQueue(reviewable);
    const grouped = groupByReviewer(reviewable);
    const gate = clientReleaseGate(reviewable);

    expect(queue.length).toBeGreaterThan(0);
    expect(Object.keys(grouped).length).toBeGreaterThan(0);
    expect(typeof gate.releasable).toBe("boolean");
    expect(typeof gate.reason).toBe("string");
    expect(Array.isArray(gate.blockers)).toBe(true);
  });

  it("holds a scenario with unreviewed material findings back from a client", () => {
    const gate = clientReleaseGate(reviewable);
    const material = reviewable.filter(
      (r) => r.severity === "critical" || r.severity === "high",
    );
    if (material.length > 0) expect(gate.releasable).toBe(false);
  });
});
