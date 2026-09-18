import { describe, it, expect } from "vitest";
import {
  optimizeExchangeChain,
  monitorDeadlines,
  accumulatedDepreciation,
  profileProperty,
  IDENTIFICATION_DAYS,
  EXCHANGE_DAYS,
  DEPRECIATION_RECAPTURE_RATE,
  type ExchangeChainInput,
  type ExchangeProperty,
} from "@shared/exchangeChainEngine";
import {
  valuateKeyPersonCoverage,
  attributeRevenue,
  type PracticeProfile,
  type Physician,
} from "@shared/keyPersonValuationEngine";
import {
  analyzeDisabilityGapAdvanced,
  modelDisabilityProbability,
  findOccupation,
  OCCUPATION_CATEGORIES,
  type DIGAInput,
} from "@shared/disabilityGapAnalyzerEngine";
import {
  simulateMultiGenerationalTransfer,
  optimizeGSTAllocation,
  modelDynastyTrust,
  type MGWTSEInput,
} from "@shared/multiGenTransferEngine";
import {
  evaluatePracticeAcquisition,
  scoreClientBook,
  type TargetPractice,
  type AcquirerProfile,
  type ClientRecord,
} from "@shared/practiceAcquisitionEngine";

// ─── SI-034: 1031 Exchange Chain Optimization ─────────────────────────────────
describe("SI-034 · 1031 Exchange Chain Optimization Engine", () => {
  const property = (over: Partial<ExchangeProperty> = {}): ExchangeProperty => ({
    id: "p1",
    label: "Property 1",
    type: "commercial",
    marketValue: 3_000_000,
    purchasePrice: 1_500_000,
    landAllocationPercent: 0.2,
    yearsHeld: 10,
    appreciationRate: 0.04,
    mortgageBalance: 0,
    ...over,
  });

  const baseInput = (properties: ExchangeProperty[]): ExchangeChainInput => ({
    properties,
    capitalGainsRate: 0.2,
    stateRate: 0.05,
    subjectToNIIT: true,
    horizonYears: 24,
    currentAge: 60,
    lifeExpectancyAge: 82,
  });

  it("computes straight-line depreciation on the depreciable basis only", () => {
    // $1.5M × 80% depreciable = $1.2M over 39 years × 10 years held.
    const dep = accumulatedDepreciation(property());
    expect(dep).toBeCloseTo((1_500_000 * 0.8 / 39) * 10, 2);
  });

  it("caps depreciation at the depreciable basis past the recovery period", () => {
    const dep = accumulatedDepreciation(property({ yearsHeld: 60 }));
    expect(dep).toBeCloseTo(1_500_000 * 0.8, 2);
  });

  it("splits gain into 25% recapture and capital gain buckets", () => {
    const input = baseInput([property()]);
    const profile = profileProperty(property(), input);
    expect(profile.recaptureGain + profile.appreciationGain).toBeCloseTo(profile.totalGain, 2);

    const recaptureRate = DEPRECIATION_RECAPTURE_RATE + 0.05 + 0.038;
    const ltcgRate = 0.2 + 0.05 + 0.038;
    expect(profile.taxIfSoldToday).toBeCloseTo(
      profile.recaptureGain * recaptureRate + profile.appreciationGain * ltcgRate,
      2,
    );
  });

  it("carries deferred gain forward so the chain compounds past independent exchanges", () => {
    const properties = Array.from({ length: 6 }, (_, i) =>
      property({ id: `p${i}`, label: `Property ${i}`, marketValue: 3_000_000 + i * 250_000 }),
    );
    const result = optimizeExchangeChain(baseInput(properties));

    expect(result.chain).toHaveLength(5); // Final property is held, not exchanged.
    expect(result.compoundingMultiple).toBeGreaterThan(1);
    expect(result.chainAdvantage).toBeGreaterThan(0);

    // Cumulative deferral is monotonically increasing down the chain.
    for (let i = 1; i < result.chain.length; i += 1) {
      expect(result.chain[i].cumulativeGainDeferred).toBeGreaterThan(result.chain[i - 1].cumulativeGainDeferred);
    }
  });

  it("eliminates gain permanently when the chain reaches the section 1014 step-up", () => {
    const properties = Array.from({ length: 5 }, (_, i) => property({ id: `p${i}`, label: `Property ${i}` }));
    const result = optimizeExchangeChain(baseInput(properties));
    expect(result.stepUp.reachesStepUp).toBe(true);
    expect(result.stepUp.taxPermanentlyEliminated).toBeGreaterThan(0);
    expect(result.criticalFindings.join(" ")).toContain("1014");
  });

  it("flags a horizon that never reaches the step-up", () => {
    const properties = Array.from({ length: 5 }, (_, i) => property({ id: `p${i}` }));
    const result = optimizeExchangeChain({ ...baseInput(properties), horizonYears: 10, lifeExpectancyAge: 95 });
    expect(result.stepUp.reachesStepUp).toBe(false);
    expect(result.criticalFindings.join(" ")).toContain("remains deferred");
  });

  it("flags mortgage boot when relinquished debt must be replaced", () => {
    const properties = Array.from({ length: 5 }, (_, i) =>
      property({ id: `p${i}`, label: `Property ${i}`, mortgageBalance: 800_000 }),
    );
    const result = optimizeExchangeChain(baseInput(properties));
    expect(result.criticalFindings.join(" ")).toContain("mortgage boot");
  });

  it("warns when the portfolio is below the 5-property / $5M calibration", () => {
    const result = optimizeExchangeChain(baseInput([property({ marketValue: 400_000 })]));
    expect(result.criticalFindings.join(" ")).toContain("below the profile");
  });

  it("rejects an empty portfolio", () => {
    expect(() => optimizeExchangeChain(baseInput([]))).toThrow(/at least one property/i);
  });

  describe("DCM — deadline compliance", () => {
    const closing = new Date("2026-01-01T00:00:00Z");

    it("computes the statutory 45-day and 180-day windows", () => {
      const [id, ex] = monitorDeadlines(closing, "p1", "Property 1", closing);
      expect(id.daysRemaining).toBe(IDENTIFICATION_DAYS);
      expect(ex.daysRemaining).toBe(EXCHANGE_DAYS);
      expect(id.status).toBe("clear");
    });

    it("escalates as the identification window closes", () => {
      const asOf = new Date("2026-02-08T00:00:00Z"); // 7 days left of 45.
      const [id] = monitorDeadlines(closing, "p1", "Property 1", asOf);
      expect(id.status).toBe("critical");
      expect(id.contingency).toContain("3-property rule");
    });

    it("reports a blown window as a failed exchange", () => {
      const asOf = new Date("2026-03-01T00:00:00Z");
      const [id] = monitorDeadlines(closing, "p1", "Property 1", asOf);
      expect(id.status).toBe("blown");
      expect(id.contingency).toContain("full gain");
    });
  });
});

// ─── SI-035: Key Person Insurance Valuation ───────────────────────────────────
describe("SI-035 · Key Person Insurance Valuation Engine", () => {
  const physician = (over: Partial<Physician> = {}): Physician => ({
    id: "d1",
    name: "Dr. One",
    directBillings: 1_400_000,
    patientPanelSize: 1800,
    procedureMix: "surgical",
    payerMix: { commercial: 0.6, medicare: 0.25, medicaid: 0.1, selfPay: 0.05 },
    referralsGeneratedPerYear: 120,
    avgRevenuePerReferral: 2_400,
    ancillaryRevenue: 380_000,
    tenureYears: 12,
    ownershipPercent: 0.34,
    age: 52,
    ...over,
  });

  const practice = (physicians: Physician[]): PracticeProfile => ({
    name: "Cape Fear Surgical Associates",
    physicians,
    totalCollections: physicians.reduce((s, p) => s + p.directBillings + p.ancillaryRevenue, 0),
    annualFixedOverhead: 2_200_000,
    ebitdaMultiple: 4.5,
    annualEbitda: 2_800_000,
    specialty: "General Surgery",
    recruitmentDifficulty: 0.65,
  });

  const threeDoc = () => [
    physician(),
    physician({ id: "d2", name: "Dr. Two", directBillings: 950_000, patientPanelSize: 1400, procedureMix: "mixed", referralsGeneratedPerYear: 40, ancillaryRevenue: 120_000, ownershipPercent: 0.33, age: 46 }),
    physician({ id: "d3", name: "Dr. Three", directBillings: 880_000, patientPanelSize: 1300, procedureMix: "primary_care", referralsGeneratedPerYear: 15, ancillaryRevenue: 60_000, ownershipPercent: 0.33, age: 41, tenureYears: 4 }),
  ];

  it("attributes revenue beyond direct billings via referrals and ancillary revenue", () => {
    const attribution = attributeRevenue(practice(threeDoc()));
    const lead = attribution.find(a => a.physicianId === "d1")!;
    expect(lead.referralRevenue).toBeCloseTo(120 * 2_400, 2);
    expect(lead.ancillaryRevenue).toBeCloseTo(380_000, 2);
    expect(lead.trueContribution).toBeGreaterThan(lead.yieldAdjustedBillings);
    expect(attribution.reduce((s, a) => s + a.contributionShare, 0)).toBeCloseTo(1, 4);
  });

  it("penalizes a Medicaid-heavy payer mix against identical billings", () => {
    const commercial = physician({ id: "c", payerMix: { commercial: 1, medicare: 0, medicaid: 0, selfPay: 0 } });
    const medicaid = physician({ id: "m", payerMix: { commercial: 0, medicare: 0, medicaid: 1, selfPay: 0 } });
    const attribution = attributeRevenue(practice([commercial, medicaid, physician({ id: "x" })]));
    const c = attribution.find(a => a.physicianId === "c")!;
    const m = attribution.find(a => a.physicianId === "m")!;
    expect(c.yieldAdjustedBillings).toBeGreaterThan(m.yieldAdjustedBillings);
  });

  it("models a ramp that starts at zero capacity and reaches full", () => {
    const result = valuateKeyPersonCoverage(practice(threeDoc()));
    const repl = result.replacementCosts.find(r => r.physicianId === "d1")!;
    expect(repl.replacementMonths).toBeGreaterThanOrEqual(6);
    expect(repl.replacementMonths).toBeLessThanOrEqual(18);
    expect(repl.monthlyImpact[0].capacityPercent).toBe(0);
    expect(repl.monthlyImpact[repl.monthlyImpact.length - 1].capacityPercent).toBe(100);
    expect(repl.totalReplacementCost).toBeGreaterThan(0);
  });

  it("surfaces the cascade multiple — valuation falls by a multiple of direct revenue", () => {
    const result = valuateKeyPersonCoverage(practice(threeDoc()));
    const impact = result.continuityImpacts.find(c => c.physicianId === "d1")!;
    expect(impact.workloadIncreasePercent).toBeGreaterThan(0);
    expect(impact.cascadeMultiple).toBeGreaterThan(1);
  });

  it("treats a solo practice loss as total", () => {
    const solo = practice([physician()]);
    const result = valuateKeyPersonCoverage(solo);
    expect(result.continuityImpacts[0].workloadIncreasePercent).toBe(100);
    expect(result.criticalFindings.join(" ")).toContain("3-20 physicians");
  });

  it("recommends coverage and ranks the dominant physician as critical", () => {
    const result = valuateKeyPersonCoverage(practice(threeDoc()));
    const rec = result.recommendations.find(r => r.physicianId === "d1")!;
    expect(rec.recommendedCoverage).toBeGreaterThan(0);
    expect(rec.recommendedCoverage % 50_000).toBe(0);
    expect(rec.priority).toBe("critical");
    expect(rec.estimatedAnnualPremium).toBeGreaterThan(0);
    expect(result.totalRecommendedCoverage).toBeGreaterThanOrEqual(rec.recommendedCoverage);
  });

  it("cites the section 101(j) employer-owned life insurance rules", () => {
    const result = valuateKeyPersonCoverage(practice(threeDoc()));
    expect(result.irsReferences.join(" ")).toContain("101(j)");
  });
});

// ─── SI-031: Disability Insurance Gap Analyzer ────────────────────────────────
describe("SI-031 · Disability Insurance Gap Analyzer (DIGA)", () => {
  const baseInput = (over: Partial<DIGAInput> = {}): DIGAInput => ({
    annualIncome: 800_000,
    age: 45,
    occupationKey: "surgeon",
    healthStatus: "good",
    marginalTaxRate: 0.42,
    monthlyExpenses: 28_000,
    retirementAge: 65,
    groupPolicy: {
      replacementPercent: 0.6,
      monthlyCap: 15_000,
      definition: "any_occupation",
      eliminationPeriodDays: 90,
      benefitPeriodMonths: 24,
      employerPaid: true,
    },
    ...over,
  });

  it("exposes 25 occupation categories for the OSDPM", () => {
    expect(OCCUPATION_CATEGORIES.length).toBeGreaterThanOrEqual(20);
    expect(findOccupation("surgeon").occupationClass).toBe(6);
    expect(() => findOccupation("astronaut")).toThrow(/unknown occupation/i);
  });

  it("raises disability probability with age, manual intensity and poor health", () => {
    const young = modelDisabilityProbability(baseInput({ age: 35 }));
    const older = modelDisabilityProbability(baseInput({ age: 60 }));
    expect(older.annualProbability).toBeGreaterThan(young.annualProbability);

    const desk = modelDisabilityProbability(baseInput({ occupationKey: "software_engineer" }));
    const manual = modelDisabilityProbability(baseInput({ occupationKey: "construction" }));
    expect(manual.annualProbability).toBeGreaterThan(desk.annualProbability);

    const healthy = modelDisabilityProbability(baseInput({ healthStatus: "excellent" }));
    const unhealthy = modelDisabilityProbability(baseInput({ healthStatus: "poor" }));
    expect(unhealthy.annualProbability).toBeGreaterThan(healthy.annualProbability);
  });

  it("keeps cumulative probability a valid probability", () => {
    const p = modelDisabilityProbability(baseInput({ age: 30, retirementAge: 70, occupationKey: "construction", healthStatus: "poor" }));
    expect(p.cumulativeToRetirement).toBeGreaterThan(0);
    expect(p.cumulativeToRetirement).toBeLessThanOrEqual(1);
  });

  it("reveals the tax blind spot: employer-paid group benefits are taxable", () => {
    const result = analyzeDisabilityGapAdvanced(baseInput());
    // $15,000 capped group benefit, employer-paid, at a 42% marginal rate.
    expect(result.taxAware.grossMonthlyBenefit).toBeCloseTo(15_000, 2);
    expect(result.taxAware.netMonthlyBenefit).toBeCloseTo(15_000 * 0.58, 2);
    expect(result.taxAware.taxBlindSpot).toBeCloseTo(15_000 * 0.42, 2);
    expect(result.taxAware.afterTaxGap).toBeGreaterThan(0);
    expect(result.criticalFindings.join(" ")).toContain("105(a)");
  });

  it("shows tax-free coverage replacing more income than its face amount suggests", () => {
    // Same $15,000/mo of benefit, but paid for with after-tax dollars.
    const taxFree = analyzeDisabilityGapAdvanced(
      baseInput({
        groupPolicy: undefined,
        individualPolicy: {
          monthlyBenefit: 15_000,
          definition: "own_occupation",
          eliminationPeriodDays: 90,
          benefitPeriodMonths: 240,
          afterTaxPremium: true,
          annualPremium: 8_000,
        },
      }),
    );
    const taxable = analyzeDisabilityGapAdvanced(baseInput());

    // Identical advertised replacement ratio...
    expect(taxFree.taxAware.apparentReplacementRatio).toBeCloseTo(taxable.taxAware.apparentReplacementRatio, 4);
    // ...but the tax-free dollar actually replaces far more spendable income.
    expect(taxFree.taxAware.actualReplacementRatio).toBeGreaterThan(taxable.taxAware.actualReplacementRatio);
    expect(taxFree.taxAware.taxBlindSpot).toBe(0);
    expect(taxFree.taxAware.afterTaxGap).toBeLessThan(taxable.taxAware.afterTaxGap);
  });

  it("does not tax benefits from after-tax individual premiums", () => {
    const result = analyzeDisabilityGapAdvanced(
      baseInput({
        groupPolicy: undefined,
        individualPolicy: {
          monthlyBenefit: 20_000,
          definition: "own_occupation",
          eliminationPeriodDays: 90,
          benefitPeriodMonths: 240,
          afterTaxPremium: true,
          annualPremium: 9_000,
        },
      }),
    );
    const individual = result.allocations.find(a => a.source === "individual")!;
    expect(individual.netMonthlyBenefit).toBeCloseTo(individual.grossMonthlyBenefit, 2);
    expect(individual.taxTreatment).toContain("104(a)(3)");
  });

  it("identifies all three gap types", () => {
    const result = analyzeDisabilityGapAdvanced(baseInput());
    const types = result.gaps.map(g => g.type);
    expect(types).toContain("income_replacement");
    expect(types).toContain("benefit_period");
    expect(types).toContain("definition_of_disability");
  });

  it("prices the definition gap for a surgeon on an any-occupation policy", () => {
    const result = analyzeDisabilityGapAdvanced(baseInput());
    const defGap = result.gaps.find(g => g.type === "definition_of_disability")!;
    expect(defGap.severity).toBe("critical");
    expect(defGap.monthlyGap).toBeGreaterThan(0);
  });

  it("closes the definition gap when own-occupation coverage is in force", () => {
    const result = analyzeDisabilityGapAdvanced(
      baseInput({
        individualPolicy: {
          monthlyBenefit: 10_000,
          definition: "own_occupation",
          eliminationPeriodDays: 90,
          benefitPeriodMonths: 240,
          afterTaxPremium: true,
          annualPremium: 6_000,
        },
      }),
    );
    const defGap = result.gaps.find(g => g.type === "definition_of_disability")!;
    expect(defGap.severity).toBe("none");
    expect(defGap.monthlyGap).toBe(0);
  });

  it("flags the group cap truncating stated replacement for a high earner", () => {
    const result = analyzeDisabilityGapAdvanced(baseInput());
    expect(result.criticalFindings.join(" ")).toContain("truncates");
    expect(result.recommendedAdditionalBenefit).toBeGreaterThan(0);
    expect(result.probabilityWeightedExposure).toBeGreaterThan(0);
  });

  it("warns below the $300k calibration", () => {
    const result = analyzeDisabilityGapAdvanced(baseInput({ annualIncome: 120_000 }));
    expect(result.criticalFindings.join(" ")).toContain("calibrated for incomes");
  });
});

// ─── SI-032: Multi-Generational Wealth Transfer ───────────────────────────────
describe("SI-032 · Multi-Generational Wealth Transfer Engine (MGWTSE)", () => {
  const baseInput = (over: Partial<MGWTSEInput> = {}): MGWTSEInput => ({
    familyName: "Russell",
    netWorth: 60_000_000,
    trusts: [
      { id: "t1", label: "Dynasty Trust A", fundingAmount: 20_000_000, trusteeType: "private_family_trust_company", distributionPolicy: "income_only", grossReturn: 0.07, gstEligible: true, generationSpan: 4 },
      { id: "t2", label: "Marital Trust", fundingAmount: 12_000_000, trusteeType: "corporate", distributionPolicy: "full_discretion", grossReturn: 0.06, gstEligible: false, generationSpan: 1 },
      { id: "t3", label: "Dynasty Trust B", fundingAmount: 15_000_000, trusteeType: "directed_with_advisor", distributionPolicy: "ascertainable_standard", grossReturn: 0.068, gstEligible: true, generationSpan: 3 },
    ],
    gstExemptionAvailable: 15_000_000,
    exemptionHolders: 2,
    generationLength: 25,
    horizonYears: 100,
    inflationRate: 0.025,
    annualFamilySpending: 900_000,
    ...over,
  });

  it("projects a dynasty trust across the full horizon", () => {
    const input = baseInput();
    const projection = modelDynastyTrust(input.trusts[0], input);
    expect(projection.years).toHaveLength(100);
    expect(projection.years[0].generation).toBe(1);
    expect(projection.finalValue).toBeGreaterThan(0);
    expect(projection.totalDistributions).toBeGreaterThan(0);
    // Real value is always below nominal under positive inflation.
    expect(projection.finalRealValue).toBeLessThan(projection.finalValue);
  });

  it("charges trustee fees only where the trustee profile carries them", () => {
    const input = baseInput();
    const corporate = modelDynastyTrust(input.trusts[1], input);
    const family = modelDynastyTrust({ ...input.trusts[1], trusteeType: "individual_family" }, input);
    expect(corporate.totalTrusteeFees).toBeGreaterThan(0);
    expect(family.totalTrusteeFees).toBe(0);
  });

  it("allocates GST exemption only to eligible trusts, highest leverage first", () => {
    const gst = optimizeGSTAllocation(baseInput());
    expect(gst.allocations.map(a => a.trustId)).not.toContain("t2"); // Not GST-eligible.
    expect(gst.totalExemptionUsed).toBeGreaterThan(0);
    expect(gst.totalExemptionUsed).toBeLessThanOrEqual(gst.totalExemptionAvailable);
    // Greedy fill means the first-ranked trust absorbs exemption before the second.
    expect(gst.allocations[0].exemptionAllocated).toBeGreaterThanOrEqual(
      gst.allocations[gst.allocations.length - 1].exemptionAllocated,
    );
  });

  it("computes the section 2642 inclusion ratio", () => {
    const gst = optimizeGSTAllocation(baseInput());
    for (const a of gst.allocations) {
      expect(a.inclusionRatio).toBeGreaterThanOrEqual(0);
      expect(a.inclusionRatio).toBeLessThanOrEqual(1);
    }
    // A fully-exempted trust has an inclusion ratio of zero.
    const fully = optimizeGSTAllocation(
      baseInput({
        trusts: [{ id: "t1", label: "Small Dynasty", fundingAmount: 5_000_000, trusteeType: "corporate", distributionPolicy: "income_only", grossReturn: 0.07, gstEligible: true, generationSpan: 4 }],
      }),
    );
    expect(fully.allocations[0].inclusionRatio).toBe(0);
  });

  it("beats equal allocation — the GST leverage discovery", () => {
    const gst = optimizeGSTAllocation(baseInput());
    expect(gst.totalGstTaxAvoided).toBeGreaterThanOrEqual(gst.equalAllocationTaxAvoided);
    expect(gst.optimizationAdvantage).toBeGreaterThanOrEqual(1);
  });

  it("projects all three tax-law scenarios", () => {
    const result = simulateMultiGenerationalTransfer(baseInput());
    expect(result.scenarios.map(s => s.scenario).sort()).toEqual(
      ["current_law_sunset", "increased_rates", "permanent_extension"],
    );
    for (const s of result.scenarios) {
      expect(s.generationEndValues).toHaveLength(4); // 100 years / 25-year generations.
      expect(s.totalTransferTaxPaid).toBeGreaterThanOrEqual(0);
    }
  });

  it("leaves more wealth under a permanent exemption than under a sunset", () => {
    const result = simulateMultiGenerationalTransfer(baseInput());
    const sunset = result.scenarios.find(s => s.scenario === "current_law_sunset")!;
    const permanent = result.scenarios.find(s => s.scenario === "permanent_extension")!;
    expect(permanent.finalWealth).toBeGreaterThanOrEqual(sunset.finalWealth);
  });

  it("compares at least five trustee succession scenarios", () => {
    const result = simulateMultiGenerationalTransfer(baseInput());
    expect(result.successionComparisons.length).toBeGreaterThanOrEqual(5);
  });

  it("quantifies the fee-drag compounding effect across four generations", () => {
    const result = simulateMultiGenerationalTransfer(baseInput());
    expect(result.feeDragImpact.annualFeeDifference).toBeGreaterThan(0);
    expect(result.feeDragImpact.lowCostFinalWealth).toBeGreaterThan(result.feeDragImpact.highCostFinalWealth);
    expect(result.feeDragImpact.spread).toBeGreaterThan(0);
    expect(result.criticalFindings.join(" ")).toContain("compounds to a");
  });

  it("warns below the $25M calibration and rejects a trustless family", () => {
    const result = simulateMultiGenerationalTransfer(baseInput({ netWorth: 8_000_000 }));
    expect(result.criticalFindings.join(" ")).toContain("calibrated for families above $25M");
    expect(() => simulateMultiGenerationalTransfer(baseInput({ trusts: [] }))).toThrow(/at least one trust/i);
  });
});

// ─── SI-033: Practice Acquisition Due Diligence ───────────────────────────────
describe("SI-033 · Practice Acquisition Due Diligence Engine (PADDA)", () => {
  const client = (over: Partial<ClientRecord> = {}): ClientRecord => ({
    id: "c1",
    age: 54,
    annualRevenue: 4_000,
    tenureYears: 7,
    products: ["IUL", "Annuity"],
    persistency: 0.91,
    referralsLast12Months: 1,
    satisfactionScore: 82,
    ...over,
  });

  const healthyBook = () =>
    Array.from({ length: 150 }, (_, i) =>
      client({ id: `c${i}`, age: 44 + (i % 25), tenureYears: 2 + (i % 12), annualRevenue: 3_000 + (i % 9) * 400 }),
    );

  const practice = (over: Partial<TargetPractice> = {}): TargetPractice => {
    const clients = over.clients ?? healthyBook();
    return {
      name: "Coastal Advisory Group",
      clients,
      annualRevenue: clients.reduce((s, c) => s + c.annualRevenue, 0),
      trailRevenuePercent: 0.68,
      yearsInOperation: 18,
      principalAge: 63,
      principalRetained: true,
      principalTransitionMonths: 18,
      russellNumber: 74,
      askingPrice: 1_400_000,
      ...over,
    };
  };

  const acquirer = (over: Partial<AcquirerProfile> = {}): AcquirerProfile => ({
    technologyPlatform: "Redtail",
    targetTechnologyPlatform: "Redtail",
    serviceModel: "hybrid",
    targetServiceModel: "hybrid",
    compensationStructure: "hybrid",
    targetCompensationStructure: "hybrid",
    geographicOverlap: 0.7,
    integrationExperience: 0.6,
    ...over,
  });

  it("scores exactly 15 book dimensions with weights summing to 1", () => {
    const quality = scoreClientBook(practice());
    expect(quality.dimensions).toHaveLength(15);
    expect(quality.dimensions.reduce((s, d) => s + d.weight, 0)).toBeCloseTo(1, 6);
    expect(quality.compositeScore).toBeGreaterThanOrEqual(0);
    expect(quality.compositeScore).toBeLessThanOrEqual(100);
  });

  it("surfaces premium concentration invisible in financial statements", () => {
    const concentrated = [
      client({ id: "whale1", annualRevenue: 200_000 }),
      client({ id: "whale2", annualRevenue: 180_000 }),
      client({ id: "whale3", annualRevenue: 150_000 }),
      ...Array.from({ length: 60 }, (_, i) => client({ id: `s${i}`, annualRevenue: 2_000 })),
    ];
    const quality = scoreClientBook(practice({ clients: concentrated }));
    expect(quality.concentrationRisks.length).toBeGreaterThanOrEqual(3);
    expect(quality.top5ConcentrationShare).toBeGreaterThan(40);
    expect(quality.redFlags.join(" ")).toContain("5% of revenue");
  });

  it("grades a weak book lower than a strong one", () => {
    const weak = Array.from({ length: 80 }, (_, i) =>
      client({ id: `w${i}`, age: 76, tenureYears: 1, persistency: 0.62, satisfactionScore: 48, products: ["Term"], referralsLast12Months: 0 }),
    );
    const strong = scoreClientBook(practice());
    const poor = scoreClientBook(practice({ clients: weak }));
    expect(poor.compositeScore).toBeLessThan(strong.compositeScore);
    expect(poor.redFlags.length).toBeGreaterThan(0);
  });

  it("projects five years of revenue that declines without the principal", () => {
    const retained = evaluatePracticeAcquisition(practice(), acquirer());
    const departing = evaluatePracticeAcquisition(practice({ principalRetained: false, principalTransitionMonths: 0 }), acquirer());

    expect(retained.sustainability.projectedRevenue).toHaveLength(5);
    expect(departing.sustainability.year1AttritionRate).toBeGreaterThan(retained.sustainability.year1AttritionRate);
    expect(departing.sustainability.fiveYearSurvivalRate).toBeLessThan(retained.sustainability.fiveYearSurvivalRate);
    expect(departing.criticalFindings.join(" ")).toContain("retention agreement");
  });

  it("scores all five integration dimensions and prices remediation", () => {
    const result = evaluatePracticeAcquisition(practice(), acquirer());
    expect(result.integrationRisk.dimensions).toHaveLength(5);
    expect(result.integrationRisk.dimensions.map(d => d.key).sort()).toEqual(
      ["client_communication", "compensation", "geographic", "service_model", "technology"],
    );
    expect(result.integrationRisk.totalIntegrationCost).toBeGreaterThan(0);
    expect(result.integrationRisk.estimatedIntegrationMonths).toBeGreaterThanOrEqual(6);
  });

  it("raises integration risk and cost on a platform mismatch", () => {
    const aligned = evaluatePracticeAcquisition(practice(), acquirer());
    const mismatched = evaluatePracticeAcquisition(
      practice(),
      acquirer({ targetTechnologyPlatform: "Salesforce", targetServiceModel: "high_touch", targetCompensationStructure: "commission", geographicOverlap: 0.1 }),
    );
    expect(mismatched.integrationRisk.compositeRisk).toBeGreaterThan(aligned.integrationRisk.compositeRisk);
    expect(mismatched.integrationRisk.totalIntegrationCost).toBeGreaterThan(aligned.integrationRisk.totalIntegrationCost);
  });

  it("corrects the standard revenue multiple downward — integration-adjusted valuation", () => {
    const result = evaluatePracticeAcquisition(practice(), acquirer());
    expect(result.adjustedValuation).toBeLessThan(result.standardValuation);
    expect(result.valuationCorrectionPercent).toBeGreaterThan(0);
    expect(result.criticalFindings.join(" ")).toContain("Integration-adjusted valuation");
  });

  it("recommends walking away when the ask far exceeds adjusted value", () => {
    const result = evaluatePracticeAcquisition(practice({ askingPrice: 25_000_000 }), acquirer());
    expect(result.bidGap).toBeLessThan(0);
    expect(result.recommendation).toBe("walk_away");
  });

  it("warns below the $500k revenue calibration and rejects an empty book", () => {
    const tiny = evaluatePracticeAcquisition(
      practice({ clients: [client({ annualRevenue: 3_000 })], annualRevenue: 3_000, askingPrice: 6_000 }),
      acquirer(),
    );
    expect(tiny.criticalFindings.join(" ")).toContain("calibrated for acquisitions above $500,000");
    expect(() => scoreClientBook(practice({ clients: [] }))).toThrow(/no clients/i);
  });
});
