import { describe, it, expect } from "vitest";
import {
  analyzeRealEstateCapitalScenario,
  annualDebtConstant,
  buildPaymentSchedule,
  compareStrategies,
  computeExitAnalysis,
  computeSaleAnalysis,
  getDefaultScenarioAssumptions,
  operatingExpenses,
  prepaymentPenalty,
  reserveMonths,
  unallocatedReserves,
  underwrittenNoi,
} from "../shared/realEstateCapacityEngine";
import {
  DEFAULT_REAL_ESTATE_POLICY,
  type DebtOption,
  type PropertyInput,
  type RealEstateCapitalScenarioInput,
} from "../shared/realEstateCapitalTypes";

/* ═══ Fixtures — the §15 workflow ═══════════════════════════════════════════
   A client with two PAID-OFF rentals choosing between a HELOC, a DSCR
   cash-out, a blanket DSCR loan, and a bridge-to-DSCR sequence.
   ═══════════════════════════════════════════════════════════════════════════ */

const paidOffA: PropertyInput = {
  id: "propA",
  name: "Maple Duplex",
  value: 500_000,
  valueAsOf: "2026-08-01",
  valueSource: "appraisal",
  annualGrossRent: 48_000,
  annualOperatingExpenses: 9_000,
  annualTaxes: 5_000,
  annualInsurance: 2_000,
  annualMaintenanceReserve: 2_400,
  occupancy: 0.95,
  ownershipType: "llc",
  useType: "rental_1_4",
  liens: [],
  adjustedBasis: 320_000,
  accumulatedDepreciation: 60_000,
};

const paidOffB: PropertyInput = {
  id: "propB",
  name: "Cedar Fourplex",
  value: 400_000,
  valueAsOf: "2026-08-01",
  valueSource: "appraisal",
  annualGrossRent: 39_000,
  annualOperatingExpenses: 7_500,
  annualTaxes: 4_200,
  annualInsurance: 1_800,
  annualMaintenanceReserve: 1_950,
  occupancy: 0.95,
  ownershipType: "llc",
  useType: "rental_1_4",
  liens: [],
};

const helocOption: DebtOption = {
  id: "heloc",
  label: "HELOC",
  category: "heloc",
  rate: 0.0875,
  rateType: "variable",
  marginToIndex: 0.01,
  termMonths: 120,
  interestOnlyMonths: 120,
  maxLtv: 0.8,
  maxCltv: 0.8,
  pointsPct: 0,
  closingCostsPct: 0.005,
  prepayment: { kind: "none" },
  recourse: "full",
  collateralMode: "single",
  paymentMode: "interest_only",
  termsSource: { status: "illustrative" },
};

const dscrOption: DebtOption = {
  id: "dscr",
  label: "DSCR cash-out refinance",
  category: "dscr",
  rate: 0.075,
  rateType: "fixed",
  termMonths: 360,
  amortizationMonths: 360,
  maxLtv: 0.75,
  maxCltv: 0.75,
  minDscr: 1.25,
  pointsPct: 0.01,
  closingCostsPct: 0.02,
  prepayment: { kind: "step_down", stepDownPctByYear: [0.05, 0.04, 0.03, 0.02, 0.01] },
  recourse: "limited",
  collateralMode: "single",
  paymentMode: "amortizing",
  termsSource: { status: "illustrative" },
};

const blanketOption: DebtOption = {
  ...dscrOption,
  id: "blanket",
  label: "Blanket DSCR",
  category: "blanket_dscr",
  maxLtv: 0.7,
  maxCltv: 0.7,
  minimumDebtYield: 0.09,
  collateralMode: "blanket",
};

const bridgeOption: DebtOption = {
  id: "bridge",
  label: "Bridge to DSCR",
  category: "bridge",
  rate: 0.115,
  rateType: "variable",
  termMonths: 18,
  interestOnlyMonths: 18,
  maxLtc: 0.8,
  maxArv: 0.7,
  maxLtv: 0.75,
  pointsPct: 0.02,
  closingCostsPct: 0.015,
  prepayment: { kind: "flat_pct", flatPct: 0.01 },
  recourse: "full",
  collateralMode: "single",
  paymentMode: "interest_only",
  termsSource: { status: "illustrative" },
};

const baseScenario: RealEstateCapitalScenarioInput = {
  scenarioId: "s1",
  properties: [paidOffA, paidOffB],
  debtOptions: [helocOption, dscrOption, blanketOption],
  assumptions: getDefaultScenarioAssumptions(),
  liquidity: {
    totalLiquidReserves: 120_000,
    monthlyFixedCostsOutsideProperty: 4_000,
  },
  requestedProceeds: 400_000,
};

/* ═══ Property math ════════════════════════════════════════════════════════ */

describe("underwritten NOI", () => {
  it("includes taxes, insurance and reserves in operating expenses", () => {
    // 9,000 + 5,000 + 2,000 + 2,400 — the reserve is the line pro formas drop.
    expect(operatingExpenses(paidOffA)).toBe(18_400);
  });

  it("uses the lesser of reported occupancy and assumed vacancy", () => {
    // Reported 95% occupancy, assumed 7% vacancy → underwrite at 93%.
    const { egi, noi } = underwrittenNoi(paidOffA, 0.07);
    expect(egi).toBeCloseTo(48_000 * 0.93, 6);
    expect(noi).toBeCloseTo(48_000 * 0.93 - 18_400, 6);
  });

  it("does not let a reported 100% occupancy override a vacancy stress", () => {
    const full = { ...paidOffA, occupancy: 1 };
    const { egi } = underwrittenNoi(full, 0.2);
    expect(egi).toBeCloseTo(48_000 * 0.8, 6);
  });

  it("applies an expense multiplier for stress", () => {
    const { opex } = underwrittenNoi(paidOffA, 0.07, 1.2);
    expect(opex).toBeCloseTo(18_400 * 1.2, 6);
  });
});

describe("annual debt constant", () => {
  it("equals the rate for interest-only paper", () => {
    expect(annualDebtConstant(helocOption)).toBeCloseTo(0.0875, 9);
  });

  it("exceeds the rate for amortizing paper", () => {
    const k = annualDebtConstant(dscrOption);
    expect(k).toBeGreaterThan(dscrOption.rate);
    expect(k).toBeCloseTo(0.08391, 4); // 7.5%, 30-year
  });

  it("is zero for deferred payment modes", () => {
    expect(annualDebtConstant({ ...bridgeOption, paymentMode: "deferred" })).toBe(0);
  });
});

/* ═══ §13.5 required cases ═════════════════════════════════════════════════ */

describe("paid-off property", () => {
  const r = analyzeRealEstateCapitalScenario(baseScenario);
  const a = r.metrics.propertyMetrics.find((m) => m.propertyId === "propA")!;

  it("is recognised as free and clear", () => {
    expect(a.isFreeAndClear).toBe(true);
    expect(a.currentLtv).toBe(0);
    expect(a.currentDscr).toBe(Infinity);
  });

  it("sizes collateral capacity off the full value", () => {
    // Reference option is the HELOC at 80% LTV with no liens to deduct.
    expect(a.capacityByLtv).toBeCloseTo(500_000 * 0.8, 0);
  });
});

describe("existing first lien", () => {
  it("reduces capacity by the outstanding balance", () => {
    const encumbered: PropertyInput = {
      ...paidOffA,
      liens: [
        {
          id: "first",
          lienPosition: 1,
          currentBalance: 200_000,
          rate: 0.045,
          rateType: "fixed",
          annualDebtService: 14_000,
          category: "commercial_bank",
        },
      ],
    };
    const r = analyzeRealEstateCapitalScenario({
      ...baseScenario,
      properties: [encumbered],
      debtOptions: [helocOption],
    });
    const m = r.metrics.propertyMetrics[0];
    expect(m.existingSeniorBalance).toBe(200_000);
    expect(m.capacityByLtv).toBeCloseTo(500_000 * 0.8 - 200_000, 0);
    expect(m.currentLtv).toBeCloseTo(0.4, 4);
    expect(m.isFreeAndClear).toBe(false);
  });
});

describe("second lien / HELOC undrawn availability", () => {
  it("counts the whole line against CLTV, not just the drawn balance", () => {
    const withLine: PropertyInput = {
      ...paidOffA,
      liens: [
        {
          id: "heloc-existing",
          lienPosition: 2,
          currentBalance: 50_000,
          availableLine: 100_000,
          rate: 0.0875,
          rateType: "variable",
          annualDebtService: 4_375,
          category: "heloc",
        },
      ],
    };
    const r = analyzeRealEstateCapitalScenario({
      ...baseScenario,
      properties: [withLine],
      debtOptions: [helocOption],
    });
    const m = r.metrics.propertyMetrics[0];
    expect(m.existingJuniorBalance).toBe(50_000);
    expect(m.undrawnAvailability).toBe(100_000);
    // LTV ignores the undrawn line; CLTV does not. That gap is the point.
    expect(m.capacityByLtv).toBeCloseTo(400_000 - 50_000, 0);
    expect(m.capacityByCltv).toBeCloseTo(400_000 - 50_000 - 100_000, 0);
    expect(m.capacityByCltv).toBeLessThan(m.capacityByLtv);

    // Here income binds tighter still: the existing line already consumes
    // coverage, so DSCR capacity (~190k) undercuts CLTV capacity (250k).
    expect(m.capacityByDscr!).toBeLessThan(m.capacityByCltv);
    expect(m.bindingConstraint).toBe("dscr");
  });
});

describe("rental income and DSCR sizing", () => {
  const r = analyzeRealEstateCapitalScenario({
    ...baseScenario,
    debtOptions: [dscrOption],
  });

  it("sizes on total coverage, not incremental coverage", () => {
    const a = r.metrics.propertyMetrics.find((m) => m.propertyId === "propA")!;
    const noi = 48_000 * 0.93 - 18_400;
    const k = annualDebtConstant(dscrOption);
    expect(a.capacityByDscr).toBeCloseTo(noi / 1.25 / k, 0);
  });

  it("lets income bind before collateral on a modest-yield rental", () => {
    const a = r.metrics.propertyMetrics.find((m) => m.propertyId === "propA")!;
    expect(a.capacityByDscr!).toBeLessThan(a.capacityByLtv);
    expect(a.bindingConstraint).toBe("dscr");
  });

  it("subtracts existing debt service from available coverage", () => {
    const encumbered: PropertyInput = {
      ...paidOffA,
      liens: [
        {
          id: "first",
          lienPosition: 1,
          currentBalance: 150_000,
          rate: 0.045,
          rateType: "fixed",
          annualDebtService: 12_000,
          category: "commercial_bank",
        },
      ],
    };
    const enc = analyzeRealEstateCapitalScenario({
      ...baseScenario,
      properties: [encumbered],
      debtOptions: [dscrOption],
    });
    const noi = 48_000 * 0.93 - 18_400;
    const k = annualDebtConstant(dscrOption);
    expect(enc.metrics.propertyMetrics[0].capacityByDscr).toBeCloseTo(
      (noi / 1.25 - 12_000) / k,
      0,
    );
  });

  it("returns zero rather than negative capacity when coverage is exhausted", () => {
    const overlevered: PropertyInput = {
      ...paidOffA,
      liens: [
        {
          id: "first",
          lienPosition: 1,
          currentBalance: 350_000,
          rate: 0.09,
          rateType: "fixed",
          annualDebtService: 40_000,
          category: "commercial_bank",
        },
      ],
    };
    const r2 = analyzeRealEstateCapitalScenario({
      ...baseScenario,
      properties: [overlevered],
      debtOptions: [dscrOption],
    });
    expect(r2.metrics.propertyMetrics[0].capacityByDscr).toBe(0);
  });
});

describe("debt yield sizing", () => {
  it("caps total debt at NOI divided by the minimum debt yield", () => {
    const r = analyzeRealEstateCapitalScenario({
      ...baseScenario,
      debtOptions: [blanketOption],
    });
    const a = r.metrics.propertyMetrics.find((m) => m.propertyId === "propA")!;
    const noi = 48_000 * 0.93 - 18_400;
    expect(a.capacityByDebtYield).toBeCloseTo(noi / 0.09, 0);
  });
});

describe("cross-collateralization", () => {
  it("raises a contagion finding when several assets share collateral", () => {
    const crossed = (p: PropertyInput): PropertyInput => ({
      ...p,
      liens: [
        {
          id: `${p.id}-blanket`,
          lienPosition: 1,
          currentBalance: 100_000,
          rate: 0.07,
          rateType: "fixed",
          annualDebtService: 8_000,
          category: "blanket_dscr",
          crossCollateralized: true,
        },
      ],
    });
    const r = analyzeRealEstateCapitalScenario({
      ...baseScenario,
      properties: [crossed(paidOffA), crossed(paidOffB)],
      debtOptions: [blanketOption],
    });
    expect(r.metrics.portfolioMetrics.crossCollateralizedCount).toBe(2);
    expect(r.metrics.portfolioMetrics.crossCollateralExposureValue).toBe(900_000);
    expect(r.findings.some((f) => f.code === "COLLATERAL_CONTAGION")).toBe(true);
  });
});

describe("hard money LTC and ARV", () => {
  const hardMoney: DebtOption = { ...bridgeOption, id: "hm", category: "hard_money" };
  const acquisitionScenario: RealEstateCapitalScenarioInput = {
    ...baseScenario,
    debtOptions: [hardMoney],
    acquisition: {
      purchasePrice: 300_000,
      verifiedRehab: 75_000,
      eligibleClosingCosts: 10_000,
      afterRepairValue: 450_000,
      projectedAnnualGrossRent: 54_000,
      projectedAnnualOperatingExpenses: 20_000,
    },
    assumptions: { ...getDefaultScenarioAssumptions(), exitMonths: 18 },
  };

  it("constrains to loan-to-cost", () => {
    const r = analyzeRealEstateCapitalScenario(acquisitionScenario);
    const o = r.options[0];
    // LTC: 80% of (300k + 75k + 10k) = 308,000
    // ARV: 70% of 450,000 = 315,000 → LTC binds
    expect(o.bindingConstraint).toBe("ltc");
  });

  it("constrains to ARV when that is tighter", () => {
    const r = analyzeRealEstateCapitalScenario({
      ...acquisitionScenario,
      acquisition: { ...acquisitionScenario.acquisition!, afterRepairValue: 380_000 },
    });
    // ARV: 70% of 380,000 = 266,000 < LTC 308,000
    expect(r.options[0].bindingConstraint).toBe("arv");
  });

  it("asks for after-repair value when it is missing", () => {
    const r = analyzeRealEstateCapitalScenario({
      ...acquisitionScenario,
      acquisition: { purchasePrice: 300_000, verifiedRehab: 75_000 },
    });
    const missing = r.requiredInputs.find((m) => m.field === "acquisition.afterRepairValue");
    expect(missing).toBeDefined();
    expect(missing!.blocksCalculation).toBe(true);
  });
});

describe("bridge exit and takeout readiness", () => {
  it("scores zero when no stabilized NOI supports the take-out", () => {
    const exit = computeExitAnalysis(
      300_000,
      bridgeOption,
      { ...getDefaultScenarioAssumptions(), exitMonths: 18 },
      DEFAULT_REAL_ESTATE_POLICY,
      { exitValue: 450_000, stabilizedNoi: 0, saleMode: "refinance" },
    );
    expect(exit.takeoutReadiness.score).toBe(0);
    expect(exit.takeoutReadiness.blockers).toContain(
      "No stabilized NOI supplied for the take-out",
    );
  });

  it("passes when the take-out clears LTV, DSCR and debt yield", () => {
    const exit = computeExitAnalysis(
      250_000,
      bridgeOption,
      { ...getDefaultScenarioAssumptions(), exitMonths: 18 },
      DEFAULT_REAL_ESTATE_POLICY,
      { exitValue: 500_000, stabilizedNoi: 40_000, saleMode: "refinance" },
    );
    expect(exit.takeoutReadiness.passesLtv).toBe(true);
    expect(exit.exitCoverage).toBeGreaterThan(1);
    expect(exit.takeoutReadiness.score).toBeGreaterThan(0.5);
  });

  it("fails when the take-out cannot cover the payoff", () => {
    const exit = computeExitAnalysis(
      400_000,
      bridgeOption,
      { ...getDefaultScenarioAssumptions(), exitMonths: 18 },
      DEFAULT_REAL_ESTATE_POLICY,
      { exitValue: 420_000, stabilizedNoi: 18_000, saleMode: "refinance" },
    );
    expect(exit.exitCoverage).toBeLessThan(1);
    expect(exit.takeoutReadiness.blockers.length).toBeGreaterThan(0);
  });

  it("raises a finding for an untested bridge exit", () => {
    const r = analyzeRealEstateCapitalScenario({
      ...baseScenario,
      debtOptions: [bridgeOption],
      acquisition: {
        purchasePrice: 300_000,
        afterRepairValue: 400_000,
        projectedAnnualGrossRent: 20_000,
        projectedAnnualOperatingExpenses: 16_000,
      },
      assumptions: { ...getDefaultScenarioAssumptions(), exitMonths: 18 },
    });
    expect(
      r.findings.some(
        (f) => f.code === "UNTESTED_BRIDGE_EXIT" || f.code === "EXIT_COVERAGE_BELOW_POLICY",
      ),
    ).toBe(true);
  });
});

/* ═══ Tax guardrails ═══════════════════════════════════════════════════════ */

describe("tax guardrails", () => {
  const r = analyzeRealEstateCapitalScenario(baseScenario);
  const codes = r.metrics.taxFlags.map((f) => f.code);

  it("states that interest is a deduction, never a credit", () => {
    expect(codes).toContain("INTEREST_IS_DEDUCTION_NOT_CREDIT");
    const flag = r.metrics.taxFlags.find((f) => f.code === "INTEREST_IS_DEDUCTION_NOT_CREDIT")!;
    expect(flag.message).toMatch(/not a tax credit/i);
    expect(flag.message).toMatch(/not.*tax-free/i);
  });

  it("requires use-of-proceeds tracing for equity lines", () => {
    expect(codes).toContain("TRACING_REQUIRED");
    expect(r.findings.some((f) => f.code === "TAX_USE_OF_PROCEEDS_INTEGRITY")).toBe(true);
  });

  it("always warns that debt payoff does not reduce taxable gain", () => {
    expect(codes).toContain("DEBT_PAYOFF_IS_NOT_GAIN_REDUCTION");
  });

  it("flags depreciation recapture when depreciation was taken", () => {
    expect(codes).toContain("DEPRECIATION_RECAPTURE_APPLIES");
  });

  it("flags entity characterization for non-personal ownership", () => {
    expect(codes).toContain("ENTITY_CHARACTERIZATION_REVIEW");
  });

  it("marks every tax flag as requiring CPA review", () => {
    expect(r.metrics.taxFlags.every((f) => f.requiresCpaReview)).toBe(true);
    expect(codes).toContain("CPA_REVIEW_REQUIRED");
  });

  it("never claims a strategy is approved, tax-free, or suitable", () => {
    // Scan only the CLAIM-bearing output. Disclaimers and tax flags exist to
    // state these denials, so including them would match their own wording.
    const claims = [
      JSON.stringify(r.summary),
      JSON.stringify(r.options.map((o) => ({ l: o.label, r: o.ineligibleReasons }))),
      JSON.stringify(r.findings),
    ]
      .join(" ")
      .toLowerCase();

    expect(claims).not.toMatch(/tax-free/);
    expect(claims).not.toMatch(/tax free/);
    expect(claims).not.toMatch(/approved/);
    expect(claims).not.toMatch(/guaranteed/);
    expect(claims).not.toMatch(/\bsuitable\b/);
  });

  it("carries the denials in the disclaimers, where they belong", () => {
    const text = r.disclaimers.join(" ");
    expect(text).toMatch(/not a loan approval/i);
    expect(text).toMatch(/tax-free/i);
    expect(text).toMatch(/illustrative/i);
    expect(text).toMatch(/cpa/i);
  });
});

describe("sale analysis", () => {
  const sale = computeSaleAnalysis(paidOffA, getDefaultScenarioAssumptions());

  it("computes taxable gain without reference to debt", () => {
    const gross = 500_000;
    const costs = gross * 0.07;
    const basis = 320_000 - 60_000; // basis reduced by depreciation taken
    expect(sale.adjustedBasis).toBeCloseTo(basis, 2);
    expect(sale.depreciationRecaptured + sale.capitalGain).toBeCloseTo(
      gross - costs - basis,
      2,
    );
  });

  it("separates recapture from capital gain", () => {
    expect(sale.depreciationRecaptured).toBeCloseTo(60_000, 2);
    expect(sale.capitalGain).toBeGreaterThan(0);
  });

  it("does not net debt payoff against taxable gain", () => {
    const encumbered = {
      ...paidOffA,
      liens: [
        {
          id: "l",
          lienPosition: 1,
          currentBalance: 300_000,
          rate: 0.05,
          rateType: "fixed" as const,
          annualDebtService: 20_000,
          category: "dscr" as const,
        },
      ],
    };
    const withDebt = computeSaleAnalysis(encumbered, getDefaultScenarioAssumptions());
    // Cash column moves with debt...
    expect(withDebt.netCashToOwner).toBeCloseTo(sale.netCashToOwner - 300_000, 2);
    // ...the tax column does not.
    expect(withDebt.capitalGain).toBeCloseTo(sale.capitalGain, 2);
    expect(withDebt.depreciationRecaptured).toBeCloseTo(sale.depreciationRecaptured, 2);
    expect(withDebt.note).toMatch(/does NOT reduce taxable gain/);
  });
});

/* ═══ Liquidity ════════════════════════════════════════════════════════════ */

describe("liquidity", () => {
  it("detects a reserve counted for more than one job", () => {
    const { unallocated, overcommitted } = unallocatedReserves({
      totalLiquidReserves: 150_000,
      earmarkedVacancyReserve: 60_000,
      earmarkedBridgeInterestReserve: 60_000,
      earmarkedRetirementBuffer: 60_000,
    });
    expect(overcommitted).toBe(true);
    expect(unallocated).toBeCloseTo(-30_000, 2);
  });

  it("raises a critical liquidity-collision finding", () => {
    const r = analyzeRealEstateCapitalScenario({
      ...baseScenario,
      liquidity: {
        totalLiquidReserves: 150_000,
        earmarkedVacancyReserve: 60_000,
        earmarkedBridgeInterestReserve: 60_000,
        earmarkedRetirementBuffer: 60_000,
        monthlyFixedCostsOutsideProperty: 4_000,
      },
    });
    const collision = r.findings.find((f) => f.code === "LIQUIDITY_COLLISION");
    expect(collision).toBeDefined();
    expect(collision!.severity).toBe("critical");
    expect(collision!.requiredReviewer).toBe("advisor");
  });

  it("counts only unallocated cash toward runway", () => {
    const months = reserveMonths(
      {
        totalLiquidReserves: 120_000,
        earmarkedRetirementBuffer: 60_000,
        monthlyFixedCostsOutsideProperty: 2_000,
      },
      48_000,
    );
    // (120k − 60k) / (4k debt service + 2k fixed) = 10 months
    expect(months).toBeCloseTo(10, 2);
  });
});

/* ═══ Payment schedules and prepayment ═════════════════════════════════════ */

describe("payment schedule", () => {
  it("pays interest only for an interest-only line", () => {
    const s = buildPaymentSchedule(100_000, helocOption, 12);
    expect(s).toHaveLength(12);
    expect(s.every((p) => p.principal === 0)).toBe(true);
    expect(s[0].interest).toBeCloseTo((100_000 * 0.0875) / 12, 2);
    expect(s[11].endingBalance).toBeCloseTo(100_000, 2);
  });

  it("amortizes principal for an amortizing loan", () => {
    const s = buildPaymentSchedule(300_000, dscrOption, 12);
    expect(s[0].principal).toBeGreaterThan(0);
    expect(s[11].endingBalance).toBeLessThan(300_000);
  });

  it("accrues interest to the balance when deferred", () => {
    const s = buildPaymentSchedule(100_000, { ...helocOption, paymentMode: "deferred" }, 12);
    expect(s[0].payment).toBe(0);
    expect(s[11].endingBalance).toBeGreaterThan(100_000);
  });
});

describe("prepayment", () => {
  it("prices a step-down penalty by loan year", () => {
    expect(prepaymentPenalty(dscrOption, 200_000, 6)).toBeCloseTo(200_000 * 0.05, 2);
    expect(prepaymentPenalty(dscrOption, 200_000, 18)).toBeCloseTo(200_000 * 0.04, 2);
    expect(prepaymentPenalty(dscrOption, 200_000, 120)).toBe(0);
  });

  it("returns zero for yield maintenance rather than inventing a number", () => {
    const ym: DebtOption = { ...dscrOption, prepayment: { kind: "yield_maintenance" } };
    expect(prepaymentPenalty(ym, 200_000, 24)).toBe(0);
  });
});

/* ═══ Stress and prudence ══════════════════════════════════════════════════ */

describe("stress scenarios", () => {
  const r = analyzeRealEstateCapitalScenario(baseScenario);
  const dscr = r.options.find((o) => o.optionId === "dscr")!;

  it("produces base, conservative and severe", () => {
    expect(dscr.scenarios.base.label).toBe("base");
    expect(dscr.scenarios.conservative.label).toBe("conservative");
    expect(dscr.scenarios.severe.label).toBe("severe");
  });

  it("reduces supported proceeds monotonically as stress increases", () => {
    expect(dscr.scenarios.conservative.supportedProceeds).toBeLessThanOrEqual(
      dscr.scenarios.base.supportedProceeds,
    );
    expect(dscr.scenarios.severe.supportedProceeds).toBeLessThanOrEqual(
      dscr.scenarios.conservative.supportedProceeds,
    );
  });

  it("does not shock fixed-rate paper", () => {
    expect(dscr.scenarios.severe.assumptions.rateShockBps).toBe(0);
  });

  it("shocks variable-rate paper", () => {
    const heloc = r.options.find((o) => o.optionId === "heloc")!;
    expect(heloc.scenarios.severe.assumptions.rateShockBps).toBe(
      DEFAULT_REAL_ESTATE_POLICY.rateShockBpsSevere,
    );
  });

  it("explains policy failures rather than just failing", () => {
    const failing = [dscr.scenarios.severe, dscr.scenarios.conservative].find(
      (s) => !s.passesPolicy,
    );
    if (failing) {
      expect(failing.failures.length).toBeGreaterThan(0);
      expect(failing.failures[0]).toMatch(/policy/i);
    }
  });
});

describe("lender maximum versus prudent maximum", () => {
  const r = analyzeRealEstateCapitalScenario(baseScenario);

  it("never reports prudent capacity above the lender maximum", () => {
    for (const o of r.options) {
      expect(o.recommendedMaximumPrudentCapacity).toBeLessThanOrEqual(
        o.maximumCollateralCapacity + 1,
      );
    }
  });

  it("reports the binding constraint", () => {
    expect(r.summary.bindingConstraint).not.toBe("unknown");
  });

  it("flags the shortfall against the requested proceeds", () => {
    expect(r.summary.shortfallAgainstRequest).not.toBeNull();
    if (r.summary.shortfallAgainstRequest! > 0) {
      expect(r.findings.some((f) => f.code === "CAPACITY_SHORTFALL")).toBe(true);
    }
  });
});

/* ═══ Strategy comparison — the §15 deliverable ════════════════════════════ */

describe("compareStrategies", () => {
  const r = analyzeRealEstateCapitalScenario(baseScenario);
  const ranked = compareStrategies(r);

  it("ranks every option", () => {
    expect(ranked).toHaveLength(baseScenario.debtOptions.length);
    expect(ranked.map((x) => x.rank)).toEqual([1, 2, 3]);
  });

  it("ranks by fragility first, not by how much can be borrowed", () => {
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].fragility).toBeLessThanOrEqual(ranked[i].fragility);
    }
    // The top-ranked option is not automatically the largest loan.
    const biggest = [...ranked].sort((a, b) => b.prudentCapacity - a.prudentCapacity)[0];
    expect(ranked[0].fragility).toBeLessThanOrEqual(biggest.fragility);
  });

  it("keeps fragility inside 0..1", () => {
    for (const x of ranked) {
      expect(x.fragility).toBeGreaterThanOrEqual(0);
      expect(x.fragility).toBeLessThanOrEqual(1);
    }
  });
});

/* ═══ Contract and determinism ═════════════════════════════════════════════ */

describe("scenario result contract", () => {
  const r = analyzeRealEstateCapitalScenario(baseScenario);

  it("stamps a calculation version", () => {
    expect(r.calculationVersion).toMatch(/^recin-capacity-/);
  });

  it("echoes the policy actually used", () => {
    expect(r.policyUsed.targetMinimumDscr).toBe(1.25);
  });

  it("honours policy overrides", () => {
    const strict = analyzeRealEstateCapitalScenario({
      ...baseScenario,
      policy: { targetMinimumDscr: 1.6, targetReserveMonths: 18 },
    });
    expect(strict.policyUsed.targetMinimumDscr).toBe(1.6);
    expect(strict.policyUsed.targetReserveMonths).toBe(18);
    // A stricter policy cannot increase prudent capacity.
    expect(strict.summary.recommendedMaximumPrudentCapacity).toBeLessThanOrEqual(
      r.summary.recommendedMaximumPrudentCapacity,
    );
  });

  it("carries disclaimers on every result", () => {
    expect(r.disclaimers.length).toBeGreaterThan(0);
  });

  it("attaches evidence and a reviewer to every capacity finding", () => {
    for (const f of r.findings) {
      expect(Object.keys(f.evidence).length).toBeGreaterThan(0);
      expect(f.recommendation.length).toBeGreaterThan(0);
      expect(f.requiredReviewer).toBeDefined();
      expect(f.invalidatedBy).toBeDefined();
      expect(f.confidence).toBeGreaterThan(0);
      expect(f.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("sorts findings most severe first", () => {
    const rank = { info: 0, low: 1, medium: 2, high: 3, critical: 4 } as const;
    for (let i = 1; i < r.findings.length; i++) {
      expect(rank[r.findings[i - 1].severity]).toBeGreaterThanOrEqual(
        rank[r.findings[i].severity],
      );
    }
  });

  it("is deterministic", () => {
    const a = analyzeRealEstateCapitalScenario(baseScenario);
    const b = analyzeRealEstateCapitalScenario(baseScenario);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("does not mutate its input", () => {
    const before = JSON.stringify(baseScenario);
    analyzeRealEstateCapitalScenario(baseScenario);
    expect(JSON.stringify(baseScenario)).toBe(before);
  });
});
