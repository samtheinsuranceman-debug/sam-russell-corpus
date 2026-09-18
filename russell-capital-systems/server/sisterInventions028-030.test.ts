import { describe, it, expect } from "vitest";
import {
  optimizePhysicianLoanRefi,
  analyzePSLF,
  analyzeCollateral,
  amortizedPayment,
  idrAnnualPayment,
  IDR_PLANS,
  PSLF_QUALIFYING_PAYMENTS,
  type PLROInput,
} from "@shared/physicianLoanRefiEngine";
import {
  optimizeIULLoans,
  analyzeRateHedge,
  detectWashArbitrage,
  coordinateLoans,
  findCrossPolicyMoves,
  netCostRate,
  washVested,
  borrowingCapacity,
  type IPLOEInput,
  type PolicyPosition,
} from "@shared/iulLoanOptimizationEngine";
import {
  buildHybridIncomeFloor,
  layerGuaranteedIncome,
  optimizeUpsideCapture,
  sequenceDistributions,
  RMD_AGE,
  type IAIULInput,
} from "@shared/hybridIncomeFloorEngine";

// ─── SI-028: Physician Loan Refinancing Optimizer ─────────────────────────────
describe("SI-028 · Physician Loan Refinancing Optimizer (PLRO)", () => {
  const base = (over: Partial<PLROInput> = {}): PLROInput => ({
    loanBalance: 320_000,
    currentRate: 0.068,
    annualIncome: 240_000,
    incomeGrowthRate: 0.04,
    marginalTaxRate: 0.37,
    householdSize: 3,
    paymentsAlreadyMade: 36,
    inQualifyingEmployment: true,
    employmentContinuityProbability: 0.85,
    programContinuationProbability: 0.8,
    certificationComplianceProbability: 0.95,
    refinanceRate: 0.059,
    refinanceTermYears: 10,
    iulCashValue: 90_000,
    iulCreditingRate: 0.06,
    discountRate: 0.05,
    ...over,
  });

  it("amortizes correctly, including the zero-rate edge case", () => {
    // $100k at 6% over 10 years is a well-known ~$1,110.21/mo.
    expect(amortizedPayment(100_000, 0.06, 10)).toBeCloseTo(1110.21, 1);
    expect(amortizedPayment(120_000, 0, 10)).toBeCloseTo(1000, 6);
    expect(amortizedPayment(100_000, 0.06, 0)).toBe(0);
  });

  it("computes IDR payments off discretionary income, not gross", () => {
    const payment = idrAnnualPayment("save", 240_000, 3, 320_000, 0.068);
    // SAVE protects 225% of the household poverty guideline, then takes 10%.
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBeLessThan(240_000 * 0.10);

    // A lower income yields a lower payment under the same plan.
    expect(idrAnnualPayment("save", 120_000, 3, 320_000, 0.068)).toBeLessThan(payment);
    // IBR takes 15% of a smaller protected base, so it exceeds SAVE at this income.
    expect(idrAnnualPayment("ibr", 240_000, 3, 320_000, 0.068)).toBeGreaterThan(payment);
  });

  it("projects every IDR plan to the 120-payment mark", () => {
    const pslf = analyzePSLF(base());
    expect(pslf.monthsRemaining).toBe(PSLF_QUALIFYING_PAYMENTS - 36);
    expect(pslf.projections).toHaveLength(Object.keys(IDR_PLANS).length);
    for (const p of pslf.projections) {
      expect(p.totalPaidToForgiveness).toBeGreaterThanOrEqual(0);
      expect(p.presentValueOfPayments).toBeLessThanOrEqual(p.totalPaidToForgiveness);
    }
  });

  it("shows negative amortization — the balance grows under IDR", () => {
    const pslf = analyzePSLF(base());
    const best = pslf.projections.find(p => p.plan === pslf.recommendedPlan)!;
    // A physician's IDR payment is below monthly interest accrual, so the balance
    // forgiven exceeds the balance borrowed.
    expect(best.balanceForgiven).toBeGreaterThan(0);
    const result = optimizePhysicianLoanRefi(base());
    if (best.balanceForgiven > 320_000) {
      expect(result.criticalFindings.join(" ")).toContain("negative amortization");
    }
  });

  it("compounds the three PSLF risks rather than using any one alone", () => {
    const pslf = analyzePSLF(base());
    expect(pslf.jointProbability).toBeCloseTo(0.8 * 0.85 * 0.95, 4);
    // Joint probability is strictly below the most optimistic single factor.
    expect(pslf.jointProbability).toBeLessThan(0.95);
    // Risk adjustment pulls the NPV below the raw figure.
    expect(pslf.riskAdjustedNPV).toBeLessThan(pslf.rawNPV);
  });

  it("zeroes PSLF probability outside qualifying employment", () => {
    const pslf = analyzePSLF(base({ inQualifyingEmployment: false }));
    expect(pslf.jointProbability).toBe(0);
    const result = optimizePhysicianLoanRefi(base({ inQualifyingEmployment: false }));
    expect(["refinance", "refinance_with_collateral"]).toContain(result.recommendation);
    expect(result.criticalFindings.join(" ")).toContain("not in qualifying public-service employment");
  });

  it("taxes nothing on forgiveness — IRC 108(f)(1)", () => {
    const pslf = analyzePSLF(base());
    expect(pslf.forgivenessTax).toBe(0);
    expect(optimizePhysicianLoanRefi(base()).irsReferences.join(" ")).toContain("108(f)(1)");
  });

  it("scales the collateral rate reduction between 25 and 75 basis points", () => {
    const none = analyzeCollateral(base({ iulCashValue: 0 }));
    expect(none.rateReduction).toBe(0);

    const small = analyzeCollateral(base({ iulCashValue: 16_000 })); // 5% of balance
    expect(small.rateReduction).toBeGreaterThanOrEqual(0.0025);
    expect(small.rateReduction).toBeLessThan(0.0075);

    const large = analyzeCollateral(base({ iulCashValue: 200_000 })); // >50% of balance
    expect(large.rateReduction).toBeCloseTo(0.0075, 6);
    expect(large.collateralizedRate).toBeCloseTo(0.059 - 0.0075, 6);
  });

  it("models the reinforcing cycle from freed cash flow", () => {
    const c = analyzeCollateral(base({ iulCashValue: 200_000 }));
    expect(c.monthlyPaymentCollateralized).toBeLessThan(c.monthlyPaymentBase);
    expect(c.monthlyFreedCashFlow).toBeGreaterThan(0);
    // Compounded at the crediting rate, the freed payments exceed their raw sum.
    expect(c.reinforcingCycleCashValue).toBeGreaterThan(c.monthlyFreedCashFlow * 120);
  });

  it("lists what refinancing permanently forfeits", () => {
    const result = optimizePhysicianLoanRefi(base());
    expect(result.refinance.forfeited.join(" ")).toContain("PSLF eligibility");
    expect(result.refinance.forfeited.length).toBeGreaterThanOrEqual(4);
  });

  it("favors staying federal when the two paths are near-tied", () => {
    const result = optimizePhysicianLoanRefi(base());
    if (result.recommendation === "too_close_to_call") {
      expect(result.criticalFindings.join(" ")).toContain("asymmetry");
    }
    expect(["pursue_pslf", "refinance", "refinance_with_collateral", "too_close_to_call"]).toContain(result.recommendation);
  });

  it("computes the dual-benefit structure", () => {
    const result = optimizePhysicianLoanRefi(base());
    expect(result.dualBenefit.combinedBenefit).toBeGreaterThanOrEqual(0);
    if (result.dualBenefit.monthlyDifferential > 0) {
      expect(result.dualBenefit.iulValueAtForgiveness).toBeGreaterThan(0);
    }
  });

  it("warns below the $100k calibration", () => {
    const result = optimizePhysicianLoanRefi(base({ loanBalance: 40_000 }));
    expect(result.criticalFindings.join(" ")).toContain("calibrated for balances above $100,000");
  });
});

// ─── SI-029: IUL Policy Loan Optimization ─────────────────────────────────────
describe("SI-029 · IUL Policy Loan Optimization Engine (IPLOE)", () => {
  const policy = (over: Partial<PolicyPosition> = {}): PolicyPosition => ({
    id: "p1",
    label: "Policy 1",
    carrier: "Carrier A",
    cashValue: 400_000,
    deathBenefit: 1_200_000,
    creditingRate: 0.065,
    loanRate: 0.05,
    loanType: "fixed",
    hasWashProvision: false,
    policyYear: 12,
    maxLoanToValue: 0.9,
    existingLoanBalance: 0,
    annualPremium: 0,
    ...over,
  });

  const base = (policies: PolicyPosition[]): IPLOEInput => ({
    policies,
    currentAge: 55,
    retirementAge: 65,
    annualIncomeNeeded: 60_000,
    projectionYears: 20,
    marginalTaxRate: 0.35,
    rateCycleAmplitude: 0.04,
    rateCycleYears: 7,
  });

  const twoPolicy = () => [
    policy({ id: "a", label: "Wash Policy", hasWashProvision: true, washAvailableAtYear: 10, policyYear: 12, loanType: "wash" }),
    policy({ id: "b", label: "Growth Policy", cashValue: 350_000, creditingRate: 0.072, loanRate: 0.055, annualPremium: 24_000 }),
  ];

  it("treats a vested wash provision as zero net borrowing cost", () => {
    const washed = policy({ hasWashProvision: true, washAvailableAtYear: 10, policyYear: 12 });
    const unvested = policy({ hasWashProvision: true, washAvailableAtYear: 10, policyYear: 4 });
    expect(washVested(washed)).toBe(true);
    expect(netCostRate(washed)).toBe(0);
    expect(washVested(unvested)).toBe(false);
    expect(netCostRate(unvested)).toBeGreaterThan(0);
  });

  it("computes borrowing capacity net of existing loans and the LTV cap", () => {
    expect(borrowingCapacity(policy({ cashValue: 400_000, maxLoanToValue: 0.9, existingLoanBalance: 0 }))).toBe(360_000);
    expect(borrowingCapacity(policy({ cashValue: 400_000, maxLoanToValue: 0.9, existingLoanBalance: 100_000 }))).toBe(260_000);
    expect(borrowingCapacity(policy({ cashValue: 100_000, maxLoanToValue: 0.9, existingLoanBalance: 500_000 }))).toBe(0);
  });

  it("models a rate cycle and flags windows clearing the 2% spread", () => {
    const hedge = analyzeRateHedge(base(twoPolicy()));
    expect(hedge.windows).toHaveLength(20);
    expect(hedge.bestSpread).toBeGreaterThan(hedge.worstSpread);
    for (const w of hedge.windows) {
      expect(w.favorable).toBe(w.spread >= 0.02);
      expect(w.variableLoanRate).toBeGreaterThanOrEqual(0);
    }
  });

  it("values timing draws into favorable windows over a flat schedule", () => {
    const hedge = analyzeRateHedge(base(twoPolicy()));
    if (hedge.favorableYears.length > 0 && hedge.favorableYears.length < 20) {
      expect(hedge.timedIncomeAdvantage).toBeGreaterThan(0);
    }
  });

  it("detects wash arbitrage only where the provision has vested", () => {
    const opportunities = detectWashArbitrage(
      base([
        policy({ id: "vested", hasWashProvision: true, washAvailableAtYear: 10, policyYear: 12 }),
        policy({ id: "pending", hasWashProvision: true, washAvailableAtYear: 10, policyYear: 6 }),
        policy({ id: "none", hasWashProvision: false }),
      ]),
    );
    expect(opportunities).toHaveLength(2); // Only policies with the provision at all.
    const vested = opportunities.find(o => o.policyId === "vested")!;
    const pending = opportunities.find(o => o.policyId === "pending")!;
    expect(vested.currentlyAvailable).toBe(true);
    expect(vested.netBorrowingCost).toBe(0);
    expect(vested.annualArbitrageValue).toBeGreaterThan(0);
    expect(pending.currentlyAvailable).toBe(false);
    expect(pending.availableInYears).toBe(4);
    expect(pending.annualArbitrageValue).toBe(0);
  });

  it("draws from the cheapest source first, beating a naive even split", () => {
    const { allocations, coordinatedAnnualCost, naiveAnnualCost } = coordinateLoans(base(twoPolicy()));
    // The zero-cost wash policy is ranked first.
    expect(allocations[0].policyId).toBe("a");
    expect(allocations[0].netCostRate).toBe(0);
    expect(coordinatedAnnualCost).toBeLessThanOrEqual(naiveAnnualCost);
  });

  it("finds the cross-policy move: borrow from wash, fund the higher-crediting policy", () => {
    const moves = findCrossPolicyMoves(base(twoPolicy()));
    expect(moves.length).toBeGreaterThan(0);
    const move = moves[0];
    expect(move.fromPolicyId).toBe("a");
    expect(move.toPolicyId).toBe("b");
    expect(move.borrowCost).toBe(0);
    expect(move.netAnnualGain).toBeGreaterThan(0);
  });

  it("finds no cross-policy move without a zero-cost source", () => {
    const moves = findCrossPolicyMoves(base([policy({ id: "x" }), policy({ id: "y", annualPremium: 20_000 })]));
    expect(moves).toHaveLength(0);
  });

  it("delegates per-policy projection to the SI-024 single-policy engine", () => {
    const result = optimizeIULLoans(base(twoPolicy()));
    expect(result.perPolicyProjections).toHaveLength(2);
    for (const p of result.perPolicyProjections) {
      expect(p.result.years.length).toBeGreaterThan(0);
    }
  });

  it("reports coordination savings and the tax advantage of the draw", () => {
    const result = optimizeIULLoans(base(twoPolicy()));
    expect(result.coordinationSavings).toBeGreaterThanOrEqual(0);
    expect(result.taxAdvantageValue).toBeCloseTo(60_000 * 20 * 0.35, 2);
    expect(result.irsReferences.join(" ")).toContain("72(e)");
  });

  it("flags lapse risk, which triggers taxation of the whole gain", () => {
    // A small policy asked to carry a large draw blows through the LTV cap.
    const result = optimizeIULLoans({
      ...base([policy({ id: "small", cashValue: 120_000, maxLoanToValue: 0.9 })]),
      annualIncomeNeeded: 100_000,
      projectionYears: 20,
    });
    const findings = result.criticalFindings.join(" ");
    expect(findings).toMatch(/short of the income target|loan-to-value/);
  });

  it("warns below the 2-policy / $500k calibration and rejects an empty portfolio", () => {
    const result = optimizeIULLoans(base([policy({ cashValue: 100_000 })]));
    expect(result.criticalFindings.join(" ")).toContain("calibrated for 2+ policies");
    expect(() => optimizeIULLoans(base([]))).toThrow(/at least one policy/i);
  });
});

// ─── SI-030: Hybrid Annuity + IUL Income Floor ────────────────────────────────
describe("SI-030 · Hybrid Income Floor Engine (IAIUL)", () => {
  const base = (over: Partial<IAIULInput> = {}): IAIULInput => ({
    currentAge: 58,
    retirementAge: 65,
    lifeExpectancyAge: 90,
    totalAssets: 2_400_000,
    essentialExpenses: 90_000,
    discretionaryExpenses: 50_000,
    legacyTarget: 500_000,
    annuityPayoutRate: 0.055,
    annuityRollupRate: 0.07,
    annuityRiderFee: 0.011,
    annuityExclusionRatio: 0.35,
    iulCreditingRate: 0.065,
    iulCap: 0.10,
    iulFloor: 0,
    iulPolicyCharges: 0.012,
    qualifiedBalance: 800_000,
    marginalTaxRate: 0.28,
    inflationRate: 0.025,
    ...over,
  });

  it("sizes the annuity backward from essential expenses, not as a fixed share", () => {
    const modest = layerGuaranteedIncome(base({ essentialExpenses: 60_000 }));
    const heavy = layerGuaranteedIncome(base({ essentialExpenses: 140_000 }));
    // A larger floor requirement pulls more assets into the annuity.
    expect(heavy.annuityAllocation).toBeGreaterThan(modest.annuityAllocation);
    expect(modest.iulAllocation).toBeGreaterThan(heavy.iulAllocation);
  });

  it("caps the annuity at 75% of assets so the tax-free layer stays funded", () => {
    const layering = layerGuaranteedIncome(base({ essentialExpenses: 400_000 }));
    expect(layering.annuityAllocation).toBeCloseTo(2_400_000 * 0.75, 2);
    expect(layering.iulAllocation).toBeGreaterThan(0);
    expect(layering.floorCoversEssentials).toBe(false);
    expect(layering.floorShortfall).toBeGreaterThan(0);
  });

  it("rolls the benefit base up through deferral", () => {
    const layering = layerGuaranteedIncome(base());
    expect(layering.deferralYears).toBe(7);
    expect(layering.benefitBaseAtIncome).toBeCloseTo(layering.annuityAllocation * Math.pow(1.07, 7), 0);
    expect(layering.guaranteedAnnualIncome).toBeCloseTo(layering.benefitBaseAtIncome * 0.055, 2);
  });

  it("produces three layers that allocate the full asset base", () => {
    const layering = layerGuaranteedIncome(base());
    expect(layering.layers).toHaveLength(3);
    const total = layering.layers.reduce((s, l) => s + l.allocation, 0);
    expect(total).toBeCloseTo(2_400_000, 0);
  });

  it("applies the cap and floor to indexed crediting", () => {
    const input = base();
    const upside = optimizeUpsideCapture(input, layerGuaranteedIncome(input));
    for (const y of upside.years) {
      expect(y.creditedRate).toBeLessThanOrEqual(input.iulCap + 1e-9);
      expect(y.creditedRate).toBeGreaterThanOrEqual(input.iulFloor - 1e-9);
    }
    expect(upside.floorProtectedYears).toBeGreaterThan(0);
    expect(upside.capTruncatedYears).toBeGreaterThan(0);
  });

  it("protects more years as the floor rises", () => {
    const zeroFloor = base({ iulFloor: 0 });
    const highFloor = base({ iulFloor: 0.02 });
    const a = optimizeUpsideCapture(zeroFloor, layerGuaranteedIncome(zeroFloor));
    const b = optimizeUpsideCapture(highFloor, layerGuaranteedIncome(highFloor));
    expect(b.floorProtectedYears).toBeGreaterThanOrEqual(a.floorProtectedYears);
  });

  it("sequences three retirement phases", () => {
    const result = buildHybridIncomeFloor(base());
    const phases = new Set(result.sequencing.years.map(y => y.phase));
    expect(phases).toEqual(new Set(["early", "mid", "late"]));
  });

  it("shifts from annuity-heavy to IUL-heavy across the phases", () => {
    const result = buildHybridIncomeFloor(base());
    const early = result.sequencing.years.filter(y => y.phase === "early");
    const late = result.sequencing.years.filter(y => y.phase === "late");
    const avgEarlyIUL = early.reduce((s, y) => s + y.iulDistribution, 0) / early.length;
    const avgLateIUL = late.reduce((s, y) => s + y.iulDistribution, 0) / late.length;
    // Late retirement leans on the tax-free layer to offset RMDs.
    expect(avgLateIUL).toBeGreaterThan(avgEarlyIUL);
  });

  it("starts RMDs at 75 and taxes them fully", () => {
    const result = buildHybridIncomeFloor(base());
    const beforeRMD = result.sequencing.years.filter(y => y.age < RMD_AGE);
    const afterRMD = result.sequencing.years.filter(y => y.age >= RMD_AGE);
    expect(beforeRMD.every(y => y.rmd === 0)).toBe(true);
    expect(afterRMD.some(y => y.rmd > 0)).toBe(true);
  });

  it("keeps IUL loans out of taxable income", () => {
    const result = buildHybridIncomeFloor(base());
    for (const y of result.sequencing.years) {
      // Taxable income is the taxable annuity portion plus RMD — never the IUL draw.
      // Each field is rounded independently, so allow a cent of reassembly noise.
      expect(Math.abs(y.taxableIncome - (y.annuityTaxable + y.rmd))).toBeLessThan(0.02);
      expect(y.taxableIncome).toBeLessThanOrEqual(y.totalIncome + 1e-6);
      // The tax-free draw is genuinely excluded, not merely netted out.
      if (y.iulDistribution > 0) {
        expect(y.taxableIncome).toBeLessThan(y.totalIncome);
      }
    }
  });

  it("saves lifetime tax against an all-taxable equivalent", () => {
    const result = buildHybridIncomeFloor(base());
    expect(result.sequencing.totalLifetimeTax).toBeLessThan(result.sequencing.annuityOnlyLifetimeTax);
    expect(result.sequencing.taxSavings).toBeGreaterThan(0);
    expect(result.sequencing.taxSavingsPercent).toBeGreaterThan(0);
  });

  it("compares the hybrid against both single-product strategies", () => {
    const result = buildHybridIncomeFloor(base());
    expect(result.hybridAdvantage.bestSingleProduct).toBe(
      Math.max(result.hybridAdvantage.annuityOnlyAfterTaxIncome, result.hybridAdvantage.iulOnlyAfterTaxIncome),
    );
    expect(result.hybridAdvantage.advantage).toBeCloseTo(
      result.hybridAdvantage.hybridAfterTaxIncome - result.hybridAdvantage.bestSingleProduct,
      2,
    );
  });

  it("reports whether the floor covers essentials", () => {
    const covered = buildHybridIncomeFloor(base({ essentialExpenses: 60_000 }));
    expect(covered.layering.floorCoversEssentials).toBe(true);
    expect(covered.criticalFindings.join(" ")).toContain("fully covers");

    const short = buildHybridIncomeFloor(base({ essentialExpenses: 400_000 }));
    expect(short.criticalFindings.join(" ")).toContain("short of essential");
  });

  it("warns outside the 55-65 / $1M calibration and rejects zero assets", () => {
    const young = buildHybridIncomeFloor(base({ currentAge: 42 }));
    expect(young.criticalFindings.join(" ")).toContain("calibrated for pre-retirees aged 55-65");

    const small = buildHybridIncomeFloor(base({ totalAssets: 300_000 }));
    expect(small.criticalFindings.join(" ")).toContain("Calibrated for $1M+");

    expect(() => buildHybridIncomeFloor(base({ totalAssets: 0 }))).toThrow(/greater than zero/i);
  });
});
