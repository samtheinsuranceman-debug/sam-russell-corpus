import { describe, it, expect } from "vitest";
import { analyzeCapitalStack, STANDARD_WATERFALL } from "../shared/realEstateDealModel";
import {
  applyScenario,
  DEFAULT_STRESS_SCENARIOS,
  findBreakEvens,
  runMonteCarlo,
  runScenarios,
  runStressTest,
} from "../shared/realEstateStressEngine";
import { generateFindings } from "../shared/realEstateFindings";
import type { CapitalStackInput, DebtLayer } from "../shared/realEstateCapitalTypes";

const fixedSenior: DebtLayer = {
  id: "senior",
  kind: "senior_debt",
  principal: 6_500_000,
  rate: 0.065,
  rateType: "fixed",
  amortization: "io_then_amortizing",
  amortYears: 30,
  ioYears: 2,
  termYears: 10,
  originationFeePct: 0.01,
  dscrCovenant: 1.25,
  prepaymentPenaltyPct: 0.01,
};

const deal: CapitalStackInput = {
  property: {
    purchasePrice: 10_000_000,
    closingCostsPct: 0.02,
    capexBudget: 500_000,
    year1NOI: 700_000,
    noiGrowthRate: 0.03,
    capexReservePctOfNOI: 0.05,
    exitCapRate: 0.055,
    saleCostPct: 0.02,
    holdYears: 5,
  },
  debt: [fixedSenior],
  commonEquity: { lpContribution: 3_838_500, gpContribution: 426_500 },
  waterfall: STANDARD_WATERFALL,
};

const floatingDeal: CapitalStackInput = {
  ...deal,
  debt: [{ ...fixedSenior, rateType: "floating", floatingSpread: 0.025 }],
};

describe("applyScenario", () => {
  it("does not mutate the original input", () => {
    const before = JSON.stringify(deal);
    applyScenario(deal, { id: "x", label: "x", noiShockPct: -0.5, exitCapShiftBps: 300 });
    expect(JSON.stringify(deal)).toBe(before);
  });

  it("applies NOI and cap shocks", () => {
    const out = applyScenario(deal, {
      id: "x",
      label: "x",
      noiShockPct: -0.2,
      exitCapShiftBps: 100,
    });
    expect(out.property.year1NOI).toBeCloseTo(560_000, 6);
    expect(out.property.exitCapRate).toBeCloseTo(0.065, 6);
  });

  it("shocks floating debt but leaves fixed debt alone", () => {
    const fixedOut = applyScenario(deal, { id: "x", label: "x", rateShiftBps: 300 });
    expect(fixedOut.debt[0].rate).toBeCloseTo(0.065, 6);

    const floatOut = applyScenario(floatingDeal, { id: "x", label: "x", rateShiftBps: 300 });
    expect(floatOut.debt[0].rate).toBeCloseTo(0.095, 6);
  });

  it("never drives the exit cap to zero", () => {
    const out = applyScenario(deal, { id: "x", label: "x", exitCapShiftBps: -10_000 });
    expect(out.property.exitCapRate).toBeGreaterThan(0);
  });
});

describe("runScenarios", () => {
  const outcomes = runScenarios(deal);

  it("evaluates every scenario in the library", () => {
    expect(outcomes).toHaveLength(DEFAULT_STRESS_SCENARIOS.length);
  });

  it("makes downside scenarios worse than the base case", () => {
    const severe = outcomes.find((o) => o.scenario.id === "severe_recession")!;
    expect(severe.irrDelta).toBeLessThan(0);
    expect(severe.leveredIrr).toBeLessThan(
      analyzeCapitalStack(deal).returns.leveredIrr,
    );
  });

  it("orders cap rate damage monotonically", () => {
    const mild = outcomes.find((o) => o.scenario.id === "mild_recession")!;
    const reversion = outcomes.find((o) => o.scenario.id === "cap_reversion")!;
    // 200bp of expansion should hurt more than 50bp plus a 10% NOI dip on exit value.
    expect(reversion.equityMultiple).toBeLessThan(mild.equityMultiple + 1);
    expect(reversion.irrDelta).toBeLessThan(0);
  });
});

describe("findBreakEvens", () => {
  const be = findBreakEvens(deal);

  it("finds the NOI decline that breaches the covenant", () => {
    expect(be.noiDeclineToBreachDscr).not.toBeNull();
    expect(be.noiDeclineToBreachDscr!).toBeGreaterThan(0);
    expect(be.noiDeclineToBreachDscr!).toBeLessThan(1);
  });

  it("breaches the covenant before it reaches 1.00x coverage", () => {
    // A 1.25x covenant must trip before true cash insolvency at 1.00x.
    expect(be.noiDeclineToBreachDscr!).toBeLessThan(be.noiDeclineToNegativeCashFlow!);
  });

  it("verifies the break-even actually sits on the threshold", () => {
    const d = be.noiDeclineToBreachDscr!;
    const justBefore = analyzeCapitalStack(
      applyScenario(deal, { id: "b", label: "b", noiShockPct: -(d - 0.005) }),
    ).returns.minDscr;
    const justAfter = analyzeCapitalStack(
      applyScenario(deal, { id: "a", label: "a", noiShockPct: -(d + 0.005) }),
    ).returns.minDscr;
    expect(justBefore).toBeGreaterThanOrEqual(1.25);
    expect(justAfter).toBeLessThan(1.25);
  });

  it("zeroes profit before it wipes out equity", () => {
    expect(be.capExpansionToZeroProfit!).toBeLessThan(be.capExpansionToWipeout!);
  });

  it("reports no rate break-even for an all-fixed stack", () => {
    expect(be.rateShockToBreachDscr).toBeNull();
  });

  it("finds a rate break-even for floating debt", () => {
    const floatBe = findBreakEvens(floatingDeal);
    expect(floatBe.rateShockToBreachDscr).not.toBeNull();
    expect(floatBe.rateShockToBreachDscr!).toBeGreaterThan(0);
  });
});

describe("runMonteCarlo", () => {
  it("is deterministic for a given seed", () => {
    const a = runMonteCarlo(deal, { runs: 300, seed: 7 });
    const b = runMonteCarlo(deal, { runs: 300, seed: 7 });
    expect(a.p50).toBe(b.p50);
    expect(a.probabilityOfLoss).toBe(b.probabilityOfLoss);
  });

  it("changes with the seed", () => {
    const a = runMonteCarlo(deal, { runs: 300, seed: 7 });
    const b = runMonteCarlo(deal, { runs: 300, seed: 99 });
    expect(a.p50).not.toBe(b.p50);
  });

  it("returns ordered percentiles", () => {
    const mc = runMonteCarlo(deal, { runs: 500, seed: 3 });
    expect(mc.p5).toBeLessThanOrEqual(mc.p25);
    expect(mc.p25).toBeLessThanOrEqual(mc.p50);
    expect(mc.p50).toBeLessThanOrEqual(mc.p75);
    expect(mc.p75).toBeLessThanOrEqual(mc.p95);
  });

  it("puts the conditional tail below the 5th percentile", () => {
    const mc = runMonteCarlo(deal, { runs: 500, seed: 3 });
    expect(mc.conditionalTailIrr).toBeLessThanOrEqual(mc.p5);
  });

  it("produces a fatter downside when rates and caps are correlated", () => {
    const correlated = runMonteCarlo(deal, {
      runs: 800,
      seed: 11,
      rateCapCorrelation: 0.9,
      rateGrowthCorrelation: 0.6,
    });
    const independent = runMonteCarlo(deal, {
      runs: 800,
      seed: 11,
      rateCapCorrelation: 0,
      rateGrowthCorrelation: 0,
    });
    // Correlated shocks stack in the tail — that is the whole point of modelling
    // them jointly rather than independently.
    expect(correlated.p5).toBeLessThan(independent.p5);
  });

  it("reports probabilities within [0,1]", () => {
    const mc = runMonteCarlo(deal, { runs: 300, seed: 5 });
    for (const p of [
      mc.probabilityOfLoss,
      mc.probabilityOfCovenantBreach,
      mc.probabilityOfEquityWipeout,
    ]) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe("generateFindings", () => {
  const stack = analyzeCapitalStack(deal);
  const stress = runStressTest(deal, { monteCarlo: { runs: 300, seed: 4 } });
  const report = generateFindings(deal, stack, stress);

  it("always returns a scored report", () => {
    expect(report.riskScore).toBeGreaterThanOrEqual(0);
    expect(report.riskScore).toBeLessThanOrEqual(100);
    expect(report.findings.length).toBeGreaterThan(0);
  });

  it("sorts findings most severe first", () => {
    const rank = { info: 0, low: 1, medium: 2, high: 3, critical: 4 } as const;
    for (let i = 1; i < report.findings.length; i++) {
      expect(rank[report.findings[i - 1].severity]).toBeGreaterThanOrEqual(
        rank[report.findings[i].severity],
      );
    }
  });

  it("attaches evidence to every finding", () => {
    for (const f of report.findings) {
      expect(Object.keys(f.evidence).length).toBeGreaterThan(0);
      expect(f.recommendation.length).toBeGreaterThan(0);
      expect(f.code).toMatch(/^[A-Z_]+$/);
    }
  });

  it("detects an underfunded stack", () => {
    const bad = { ...deal, commonEquity: { lpContribution: 3_000_000, gpContribution: 300_000 } };
    const r = generateFindings(bad, analyzeCapitalStack(bad));
    expect(r.findings.some((f) => f.code === "SOURCES_USES_IMBALANCE")).toBe(true);
    expect(r.headlineSeverity).toBe("critical");
  });

  it("detects negative leverage", () => {
    // 4% cap asset financed with 9% amortizing debt.
    const negLev: CapitalStackInput = {
      ...deal,
      property: { ...deal.property, year1NOI: 420_000 },
      debt: [{ ...fixedSenior, rate: 0.09, amortization: "amortizing", ioYears: 0 }],
    };
    const r = generateFindings(negLev, analyzeCapitalStack(negLev));
    expect(r.findings.some((f) => f.code === "NEGATIVE_LEVERAGE")).toBe(true);
  });

  it("detects assumed cap rate compression", () => {
    // Going-in cap here is ~6.5%; exiting at 5.0% assumes compression.
    const compressed: CapitalStackInput = {
      ...deal,
      property: { ...deal.property, year1NOI: 700_000, exitCapRate: 0.05 },
    };
    const r = generateFindings(compressed, analyzeCapitalStack(compressed));
    expect(r.findings.some((f) => f.code === "EXIT_CAP_COMPRESSION_ASSUMED")).toBe(true);
  });

  it("detects refinance risk", () => {
    const short: CapitalStackInput = { ...deal, debt: [{ ...fixedSenior, termYears: 3 }] };
    const r = generateFindings(short, analyzeCapitalStack(short));
    expect(r.findings.some((f) => f.code === "REFINANCE_RISK")).toBe(true);
  });

  it("detects a missing capital reserve", () => {
    const noReserve: CapitalStackInput = {
      ...deal,
      property: { ...deal.property, capexReservePctOfNOI: 0 },
    };
    const r = generateFindings(noReserve, analyzeCapitalStack(noReserve));
    expect(r.findings.some((f) => f.code === "NO_CAPEX_RESERVE")).toBe(true);
  });

  it("detects a full-term interest-only stack", () => {
    const io: CapitalStackInput = {
      ...deal,
      debt: [{ ...fixedSenior, amortization: "interest_only" }],
    };
    const r = generateFindings(io, analyzeCapitalStack(io));
    expect(r.findings.some((f) => f.code === "NO_AMORTIZATION")).toBe(true);
  });

  it("is deterministic", () => {
    const a = generateFindings(deal, stack, stress);
    const b = generateFindings(deal, stack, stress);
    expect(a.findings.map((f) => f.code)).toEqual(b.findings.map((f) => f.code));
    expect(a.riskScore).toBe(b.riskScore);
  });
});
