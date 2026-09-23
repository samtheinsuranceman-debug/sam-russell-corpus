/**
 * A25 — known-answer tests for the eight calculators whose results never
 * changed (02_GAP_AUDIT.md §3) and the shared stacking helper they use.
 *
 * Every expected figure below is worked by hand from the 2026 rule set in
 * shared/taxRules.ts (Rev. Proc. 2025-32) or from the statute named beside it,
 * so a change to a rule table shows up here as a failing line, not silently.
 * Each block also checks the one property the audit failed: changing an input
 * changes the result.
 */
import { describe, it, expect } from "vitest";
import { taxWithPreferentialIncome, bracketTaxOnRange, niitFor } from "../shared/preferentialRateTax";
import { computeCryptoTax, isLongTerm, compareLotMethods, type CryptoTaxInput } from "../shared/cryptoTaxEngine";
import { characterize, recognize, computeRecapture, type RecaptureProperty, type RecaptureInput } from "../shared/depreciationRecapture";
import { computeDivorceRecovery, type DivorceRecoveryInput } from "../shared/divorceRecovery";
import { tentativeTax, federalEstateTax, projectEstate, publishedExclusion, type EstateProjectionInput } from "../shared/estateProjection";
import { projectIncentiveTrust, type IncentiveTrustInput } from "../shared/incentiveTrust";
import { optimizeTaxes, type TaxOptimizerInput } from "../shared/taxStrategyOptimizer";
import { creditRate, runBacktestPro } from "../shared/indexBacktestPro";

describe("preferentialRateTax (2026, single)", () => {
  it("taxes long-term gain 0% then 15% above ordinary income", () => {
    // ordinary 40,000: 1,240 + 12% × 27,600 = 4,552. LTCG 40,000→60,000: 9,450 at 0%, 10,550 at 15% = 1,582.50.
    const r = taxWithPreferentialIncome({ ordinaryTaxable: 40_000, longTermGain: 20_000, filing: "single" });
    expect(r.ordinaryTax).toBe(4_552);
    expect(r.longTermGainTax).toBe(1_582.5);
    expect(r.totalTax).toBe(6_134.5);
    expect(r.marginalGainRate).toBe(0.15);
  });
  it("caps unrecaptured §1250 gain at 25% and keeps lower bracket rates below it", () => {
    expect(bracketTaxOnRange(250_000, 300_000, "single", undefined, 0.25)).toBe(12_500);
    // 100,000→105,700 at 22% = 1,254; 105,700→110,000 at 24% = 1,032.
    expect(bracketTaxOnRange(100_000, 110_000, "single", undefined, 0.25)).toBeCloseTo(2_286, 6);
  });
  it("NIIT is 3.8% of the lesser of NII and MAGI over the threshold", () => {
    expect(niitFor(100_000, 250_000, "single")).toBe(1_900);
    expect(niitFor(100_000, 150_000, "single")).toBe(0);
  });
});

describe("cryptoTaxEngine — /portal/crypto-tax-strategy", () => {
  const base: CryptoTaxInput = {
    filing: "single",
    otherIncome: 100_000,
    stakingIncome: 0,
    miningIncome: 0,
    lots: [
      { id: "A", acquired: "2024-01-10", quantity: 1, costPerUnit: 20_000 },
      { id: "B", acquired: "2026-03-01", quantity: 1, costPerUnit: 60_000 },
    ],
    sale: { date: "2026-09-01", quantity: 1, pricePerUnit: 70_000 },
    method: "FIFO",
  };
  it("holding period is more than one year: the anniversary itself is short-term", () => {
    expect(isLongTerm("2025-09-01", "2026-09-01")).toBe(false);
    expect(isLongTerm("2025-09-01", "2026-09-02")).toBe(true);
  });
  it("FIFO sells lot A long-term; the crypto tax is 15% of the 50,000 gain", () => {
    // Baseline taxable 83,900 (100,000 − 16,100). Gain stacks above it, wholly in the 15% band.
    const r = computeCryptoTax(base);
    expect(r.longTermGain).toBe(50_000);
    expect(r.shortTermGain).toBe(0);
    expect(r.baselineFederal).toBe(13_170);
    expect(r.cryptoTax).toBe(7_500);
  });
  it("lot method changes the result (the audit's C2 failure)", () => {
    const [fifo, lifo, hifo] = compareLotMethods(base);
    expect(lifo!.shortTermGain).toBe(10_000);
    expect(hifo!.shortTermGain).toBe(10_000);
    expect(fifo!.cryptoTax).not.toBe(lifo!.cryptoTax);
  });
  it("staking income changes the result", () => {
    const a = computeCryptoTax(base).totalFederal;
    const b = computeCryptoTax({ ...base, stakingIncome: 5_000 }).totalFederal;
    expect(b).toBeGreaterThan(a);
  });
  it("net capital loss: $3,000 deducted, the rest carried forward", () => {
    const r = computeCryptoTax({ ...base, method: "LIFO", sale: { date: "2026-09-01", quantity: 1, pricePerUnit: 50_000 } });
    expect(r.shortTermGain).toBe(-10_000);
    expect(r.capitalLossDeducted).toBe(3_000);
    expect(r.capitalLossCarryforward).toBe(7_000);
  });
});

describe("depreciationRecapture — /portal/depreciation-recapture", () => {
  const building: RecaptureProperty = { id: "1", name: "Building", recaptureClass: "1250", costBasis: 1_000_000, accumulatedDepreciation: 300_000, salePrice: 1_200_000, sellingCosts: 0 };
  const equipment: RecaptureProperty = { id: "2", name: "Equipment", recaptureClass: "1245", costBasis: 150_000, accumulatedDepreciation: 120_000, salePrice: 50_000, sellingCosts: 0 };
  it("§1250: gain 500,000 = 300,000 unrecaptured §1250 + 200,000 §1231", () => {
    const c = characterize(building);
    expect(c.adjustedBasis).toBe(700_000);
    expect(c.realizedGain).toBe(500_000);
    expect(c.unrecaptured1250).toBe(300_000);
    expect(c.section1231Gain).toBe(200_000);
    expect(c.ordinaryRecapture).toBe(0);
  });
  it("§1245: recapture is capped at the gain, not the depreciation", () => {
    const c = characterize(equipment);
    expect(c.realizedGain).toBe(20_000);
    expect(c.ordinaryRecapture).toBe(20_000);
  });
  it("§1031 recognises gain only to the boot; §1245 property is not eligible", () => {
    const r = recognize(building, { disposition: "exchange1031", installmentFirstYearShare: 0, boot: 50_000 });
    expect(r.recognized.total).toBe(50_000);
    expect(r.recognized.unrecaptured1250).toBe(50_000);
    expect(r.deferred).toBe(450_000);
    const e = recognize(equipment, { disposition: "exchange1031", installmentFirstYearShare: 0, boot: 0 });
    expect(e.recognized.ordinary).toBe(20_000);
  });
  it("installment sale: unrecaptured §1250 gain comes first (Reg. §1.453-12)", () => {
    const r = recognize(building, { disposition: "installment", installmentFirstYearShare: 0.2, boot: 0 });
    expect(r.recognized.unrecaptured1250).toBe(100_000);
    expect(r.recognized.section1231).toBe(0);
    expect(r.deferred).toBe(400_000);
  });
  it("sale price and state rate move the tax", () => {
    const input: RecaptureInput = { properties: [building], filing: "single", otherTaxableIncome: 100_000, otherMagi: 116_100, disposition: "sale", installmentFirstYearShare: 1, boot: 0, stateRate: 0.05, niitApplies: true };
    const a = computeRecapture(input);
    expect(a.stateTax).toBe(25_000);
    const b = computeRecapture({ ...input, properties: [{ ...building, salePrice: 1_300_000 }] });
    expect(b.totalTax).toBeGreaterThan(a.totalTax);
  });
});

describe("divorceRecovery — /portal/divorce-recovery", () => {
  const input: DivorceRecoveryInput = {
    state: "CA",
    assets: [
      { id: "c", label: "Cash", kind: "cash", value: 200_000, clientShare: 0.5 },
      { id: "p", label: "401(k)", kind: "pretax", value: 400_000, clientShare: 0.5 },
      { id: "h", label: "Home", kind: "home", value: 800_000, basis: 300_000, debt: 400_000, clientShare: 0.5 },
    ],
    otherDebts: 0,
    clientDebtShare: 0.5,
    clientIncome: 100_000,
    filing: "single",
    assumedReturn: 0,
    annualSavings: 10_000,
    horizonYears: 3,
  };
  it("community property: 50/50 presumption from the rules table", () => {
    const r = computeDivorceRecovery(input);
    expect(r.regime).toBe("community");
    expect(r.presumptiveShare).toBe(0.5);
    expect(r.netMaritalEstate).toBe(1_000_000);
    expect(r.clientNominal).toBe(500_000);
  });
  it("pre-tax 401(k) carries embedded ordinary tax; home gain within §121 carries none", () => {
    // 200,000 withdrawn on top of 83,900 taxable: tax(283,900) − tax(83,900) = 68,134.25 − 13,170.
    const r = computeDivorceRecovery(input);
    expect(r.assets.find(a => a.id === "p")!.embeddedTax).toBe(54_964);
    expect(r.assets.find(a => a.id === "h")!.embeddedTax).toBe(0);
  });
  it("equitable state carries no presumption; savings move the projection", () => {
    const r = computeDivorceRecovery({ ...input, state: "NY" });
    expect(r.presumptiveShare).toBeNull();
    const a = computeDivorceRecovery(input).projection.at(-1)!.netWorth;
    const b = computeDivorceRecovery({ ...input, annualSavings: 20_000 }).projection.at(-1)!.netWorth;
    expect(b - a).toBe(30_000);
  });
});

describe("estateProjection — /portal/estate-planning, /portal/estate-timeline", () => {
  it("§2001(c) tentative tax", () => {
    expect(tentativeTax(1_000_000)).toBe(345_800);
    expect(tentativeTax(15_000_000)).toBe(5_945_800);
  });
  it("tax is 40% of the estate above the exclusion", () => {
    expect(federalEstateTax(20_000_000, 0, 15_000_000)).toBe(2_000_000);
    expect(publishedExclusion(2026)).toBe(15_000_000);
    expect(publishedExclusion(2027)).toBeNull();
  });
  const base: EstateProjectionInput = { startYear: 2026, estateValue: 20_000_000, growthRate: 0, horizonYears: 1, married: false, charitableBequest: 0, ilitDeathBenefit: 0, annualGiftPerDonee: 0, donees: 0, giftYears: 0, priorTaxableGifts: 0 };
  it("married couple with portability doubles the exclusion", () => {
    expect(projectEstate(base).today.estateTax).toBe(2_000_000);
    expect(projectEstate({ ...base, married: true }).today.estateTax).toBe(0);
  });
  it("annual-exclusion gifts reduce the tax; excess gifts become adjusted taxable gifts", () => {
    const g = projectEstate({ ...base, annualGiftPerDonee: 19_000, donees: 2, giftYears: 1 }).atHorizon;
    expect(g.estateTax).toBe(1_984_800);
    expect(g.estateTaxWithoutGifting).toBe(2_000_000);
    expect(g.exclusionPublished).toBe(false);
    const x = projectEstate({ ...base, annualGiftPerDonee: 29_000, donees: 1, giftYears: 1 }).atHorizon;
    expect(x.adjustedTaxableGifts).toBe(10_000);
    expect(x.estateTax).toBe(1_992_400);
  });
  it("growth input moves the horizon estate", () => {
    const a = projectEstate({ ...base, horizonYears: 10, growthRate: 0.03 }).atHorizon.grossEstate;
    const b = projectEstate({ ...base, horizonYears: 10, growthRate: 0.05 }).atHorizon.grossEstate;
    expect(b).toBeGreaterThan(a);
  });
});

describe("incentiveTrust — /portal/incentive-trust", () => {
  const base: IncentiveTrustInput = { funding: 1_000_000, assumedReturn: 0, trusteeFeeRate: 0, inflation: 0, years: 3, provisions: [{ id: "e", category: "Education", annualAmount: 100_000, startYear: 1, endYear: 3 }], matchingRate: 0, beneficiaryEarnedIncome: 0, matchingStartYear: 1, matchingEndYear: 0 };
  it("pays the scheduled provisions from the balance", () => {
    const r = projectIncentiveTrust(base);
    expect(r.endingBalance).toBe(700_000);
    expect(r.totalDistributed).toBe(300_000);
    expect(r.depletedInYear).toBeNull();
  });
  it("reports the year the trust can no longer pay in full", () => {
    const r = projectIncentiveTrust({ ...base, funding: 150_000 });
    expect(r.depletedInYear).toBe(2);
    expect(r.endingBalance).toBe(0);
  });
  it("matching program pays a share of earned income", () => {
    const r = projectIncentiveTrust({ ...base, provisions: [], matchingRate: 0.5, beneficiaryEarnedIncome: 60_000, matchingStartYear: 1, matchingEndYear: 2 });
    expect(r.totalsByCategory).toEqual([{ category: "Matching", total: 60_000 }]);
  });
});

describe("taxStrategyOptimizer — /portal/tax-optimizer", () => {
  const base: TaxOptimizerInput = { taxYear: 2026, filing: "single", age: 40, stateCode: "TX", wages: 200_000, businessIncome: 0, businessIsSSTB: false, rentalIncome: 0, realEstateProfessional: false, otherOrdinaryIncome: 0, itemizedOther: 0, saltPaid: 0, strategies: { pretax401k: 0, charitableCash: 0, costSegDepreciation: 0, rothConversion: 0 } };
  it("baseline: federal 36,734 + FICA 14,339 on 200,000 wages, single, 2026", () => {
    const r = optimizeTaxes(base);
    expect(r.baseline.taxableIncome).toBe(183_900);
    expect(r.baseline.federalIncomeTax).toBe(36_734);
    expect(r.baseline.ficaWages).toBe(14_339);
    expect(r.baseline.total).toBe(51_073);
  });
  it("401(k) deferral saves 24% of the 24,500 limit and is capped at it", () => {
    const r = optimizeTaxes({ ...base, strategies: { ...base.strategies, pretax401k: 40_000 } });
    expect(r.steps[0]!.amountApplied).toBe(24_500);
    expect(r.steps[0]!.saving).toBe(5_880);
  });
  it("state and tax year are live inputs", () => {
    const ca = optimizeTaxes({ ...base, stateCode: "CA" });
    expect(ca.baseline.stateTax).toBe(24_459);
    const y2025 = optimizeTaxes({ ...base, taxYear: 2025 });
    expect(y2025.baseline.federalIncomeTax).not.toBe(36_734);
  });
});

describe("indexBacktestPro — /portal/index-backtester-pro", () => {
  it("credits cap, floor and participation", () => {
    expect(creditRate(20, { capPct: 10, floorPct: 0, participationPct: 100, spreadPct: 0 }).credited).toBe(10);
    expect(creditRate(-38.3, { capPct: 10, floorPct: 0, participationPct: 100, spreadPct: 0 }).credited).toBe(0);
    expect(creditRate(5, { capPct: null, floorPct: 0, participationPct: 150, spreadPct: 0 }).credited).toBe(7.5);
  });
  it("2008–2009 on the sourced price series: 0% then the 10% cap", () => {
    const r = runBacktestPro({ startYear: 2008, years: 2, initial: 1_000, annualDeposit: 0, terms: { capPct: 10, floorPct: 0, participationPct: 100, spreadPct: 0 } });
    expect(r.rows.map(x => x.creditedPct)).toEqual([0, 10]);
    expect(r.endingValue).toBe(1_100);
    expect(r.endingIndexValue).toBe(762);
  });
  it("years outside the sourced series are unavailable, never zero", () => {
    const r = runBacktestPro({ startYear: 2024, years: 4, initial: 1_000, annualDeposit: 0, terms: { capPct: 10, floorPct: 0, participationPct: 100, spreadPct: 0 } });
    expect(r.unavailableYears).toEqual([2026, 2027]);
    expect(r.rows).toHaveLength(2);
  });
});
