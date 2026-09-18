import { describe, expect, it } from "vitest";
import {
  MATERIAL_PARTICIPATION_HOURS, PARTICIPATION_SOURCES, candidateFromSeries, loanSchedule, pickPlans, purchasingPower, runEnterprise, runProperty, scoreCandidates, trustLoop,
  type Capacity, type IulAssumption, type PropertyPlan, type ZipCandidate,
} from "@shared/rentalEnterprise";
import { amortisation } from "@shared/zipEngine";

const capacity: Capacity = { annualIncome: 300_000, cashAvailable: 200_000, monthlyDebts: 2_500, creditScore: 760, maxDti: 0.45, minDownPct: 20, closingPct: 3, reservesMonths: 6, ratePct: 7, termYears: 30 };

describe("purchasing power", () => {
  it("names the binding rule and neither limit exceeds what the arithmetic allows", () => {
    const r = purchasingPower(capacity);
    expect(r.cashLimitedPrice).toBeGreaterThan(0);
    expect(r.incomeLimitedPrice).toBeGreaterThan(0);
    expect(r.purchasingPower).toBe(Math.min(r.cashLimitedPrice, r.incomeLimitedPrice));
    // The cash rule at the limit spends no more than the cash.
    const p = r.cashLimitedPrice;
    const pay = amortisation(p * 0.8, 7, 30).monthlyPayment + p * 0.015 / 12;
    expect(p * 0.23 + 6 * pay).toBeLessThanOrEqual(capacity.cashAvailable + 1);
    // The income rule at the limit stays under the DTI cap.
    const q = r.incomeLimitedPrice;
    const payQ = amortisation(q * 0.8, 7, 30).monthlyPayment + q * 0.015 / 12;
    expect(capacity.monthlyDebts + payQ).toBeLessThanOrEqual(0.45 * capacity.annualIncome / 12 + 1);
    expect(r.lines.some((l) => l.includes(`the ${r.bindingConstraint} rule binds`))).toBe(true);
  });
  it("more cash raises the cash limit; rent credited raises the income limit", () => {
    const a = purchasingPower(capacity), b = purchasingPower({ ...capacity, cashAvailable: 400_000 });
    expect(b.cashLimitedPrice).toBeGreaterThan(a.cashLimitedPrice);
    const c = purchasingPower(capacity, { estRentPerMonth: 4_000 });
    expect(c.incomeLimitedPrice).toBeGreaterThan(a.incomeLimitedPrice);
  });
});

const cand = (zip: string, value: number, rent: number | null, app: number, hazard?: string, dd: number | null = null): ZipCandidate => ({
  zip, state: "NC", value, valueYear: 2025, rent, rentYear: rent == null ? null : 2025, appreciationWindow: app, appreciationRecord: app, windowYears: 6, rentGrowth: 0.03, worstDrawdown: dd,
  hazard: hazard ? { rating: hazard, expectedAnnualLossBuilding: null, hail: null, wildfire: null, riverineFlood: null, coastalFlood: null, hurricane: null, tornado: null, source: "FEMA NRI", asOf: "2025-12" } : null,
});

describe("scoring and the two plans", () => {
  it("scores yield plus appreciation, docks hazard and drawdown, and leaves unrented zips unscored", () => {
    const s = scoreCandidates([cand("28401", 400_000, 2_400, 0.05), cand("28403", 400_000, 2_400, 0.05, "Very High", -0.3), cand("28405", 400_000, null, 0.08)]);
    expect(s[0]!.zip).toBe("28401");
    expect(s[0]!.score).toBeCloseTo(0.072 + 0.05, 6);
    expect(s[1]!.zip).toBe("28403");
    expect(s[1]!.score).toBeCloseTo(0.122 - 0.02 - 0.005, 6);
    expect(s[1]!.reasons.join(" ")).toContain("FEMA risk Very High");
    expect(s[2]!.score).toBeNull();
    expect(s[2]!.reasons[0]).toContain("no rent record");
  });
  it("Plan A takes one zip near the whole budget; Plan B spreads the same money over four zips near a quarter each", () => {
    const big = cand("10001", 1_600_000, 7_000, 0.04);
    const smalls = ["28401", "28403", "28405", "28409", "28411"].map((z, i) => cand(z, 380_000 + i * 10_000, 2_500, 0.06 - i * 0.002));
    const scored = scoreCandidates([big, ...smalls]);
    const plans = pickPlans(scored, 1_600_000, { count: 4 });
    expect(plans.one?.zip).toBe("10001");
    expect(plans.several).toHaveLength(4);
    expect(new Set(plans.several.map((c) => c.zip)).size).toBe(4);
    for (const c of plans.several) expect(Math.abs(c.value - 400_000) / 400_000).toBeLessThanOrEqual(0.3);
    expect(plans.several.map((c) => c.zip)).not.toContain("10001");
    expect(plans.note).toContain("wider pool of buyers");
  });
});

describe("the loan, year by year", () => {
  it("interest-only years pay interest alone, then the level payment amortises; extra principal shortens the loan", () => {
    const t = { principal: 400_000, ratePct: 6, termYears: 30, interestOnlyYears: 2, startYear: 2027, startMonth: 1 };
    const plain = loanSchedule(t, 30);
    expect(plain.years[0]!.principal).toBe(0);
    expect(plain.years[0]!.interest).toBeCloseTo(400_000 * 0.06, 2);
    expect(plain.years[1]!.balance).toBeCloseTo(400_000, 2);
    expect(plain.years[2]!.principal).toBeGreaterThan(0);
    expect(plain.monthlyPaymentAmortising).toBeCloseTo(amortisation(400_000, 6, 28).monthlyPayment, 6);
    expect(plain.paidOffYear).toBe(2056);
    expect(plain.years[29]!.balance).toBeLessThan(1);
    const extra: Record<number, number> = {}; for (let y = 2029; y <= 2056; y++) extra[y] = 20_000;
    const faster = loanSchedule(t, 30, extra);
    expect(faster.paidOffYear!).toBeLessThan(plain.paidOffYear!);
    expect(faster.totalInterest).toBeLessThan(plain.totalInterest);
    expect(faster.years[2]!.extraPrincipal).toBe(20_000);
    expect(faster.years[2]!.principal).toBeGreaterThan(plain.years[2]!.principal + 19_999);
  });
});

const plan = (over: Partial<PropertyPlan> = {}): PropertyPlan => ({
  zip: "28401", label: "Wilmington", price: 500_000, purchaseYear: 2027, purchaseMonth: 7, downPct: 20, closingPct: 3, furnishing: 25_000,
  loan: { principal: 400_000, ratePct: 6.5, termYears: 30, interestOnlyYears: 0, startYear: 2027, startMonth: 7 },
  income: { kind: "str", nightlyRate: 300, occupancyPct: 60, source: "typed", asOf: "2026-09-07" },
  rentGrowthPct: 3, appreciationPct: 4, expenseGrowthPct: 3,
  costs: { propertyTaxPct: 0.8, insurancePerYear: 3_000, hoaPerYear: 0, maintenancePct: 1, managementPct: 10, utilitiesPerYear: 4_000, platformFeePct: 3, cleaningPerYear: 6_000 },
  tax: { buildingSharePct: 80, costSegSharePct: 25, bonusPct: 100, marginalRatePct: 37, depreciationYears: 27.5 },
  ...over,
});

describe("one property", () => {
  it("prorates the purchase year by month, takes bonus depreciation on the segregated share and the furnishing in year one, then straight-line", () => {
    const r = runProperty(plan(), 30, 2056);
    const y0 = r.years[0]!, y1 = r.years[1]!;
    expect(y0.year).toBe(2027);
    expect(y0.gross).toBeCloseTo(365 * 0.6 * 300 * (6 / 12), 2);
    const depreciable = 400_000, segregated = 100_000, straight = 300_000 / 27.5;
    expect(y0.depreciation).toBeCloseTo(segregated + 25_000 + straight * 0.5, 2);
    expect(y1.depreciation).toBeCloseTo(straight, 2);
    expect(y0.taxable).toBeLessThan(0);
    expect(y0.taxEffect).toBeCloseTo(y0.taxable * 0.37, 2);
    expect(y0.afterTax).toBeCloseTo(y0.cashFlow - y0.taxEffect, 2);
    expect(r.cashInvested).toBe(100_000 + 15_000 + 25_000);
    expect(r.years).toHaveLength(30);
    expect(r.years[29]!.depreciation).toBe(0); // 27.5 years exhausted
    void depreciable;
  });
  it("long-term rent runs on the monthly figure", () => {
    const r = runProperty(plan({ purchaseMonth: 1, income: { kind: "ltr", monthlyRent: 2_800, source: "Zillow ZORI", asOf: "2025" } }), 5, 2031);
    expect(r.years[0]!.gross).toBeCloseTo(2_800 * 12, 2);
    expect(r.years[1]!.gross).toBeCloseTo(2_800 * 12 * 1.03, 2);
  });
});

const iul: IulAssumption = { creditedByYear: () => 0.06, premiumLoadPct: 8, annualChargePctOfValue: 1, loanRatePct: 5, firstLoanYear: 2, maxLoanPctOfValue: 90, newPolicyThreshold: 250_000 };

describe("the trust loop", () => {
  it("credits premiums, lends from the first allowed policy year, and routes every loan dollar to principal", () => {
    const years = [2027, 2028, 2029, 2030];
    const r = trustLoop(years, () => 50_000, iul);
    expect(r.years[0]!.loansTaken).toBe(0);            // policy year 1: no loan
    expect(r.years[0]!.cashValue).toBeCloseTo(50_000 * 0.92 * 1.06 * 0.99, 2);
    expect(r.years[1]!.loansTaken).toBeGreaterThan(0); // policy year 2: loan allowed
    expect(r.extraPrincipalByYear[2028]).toBeCloseTo(r.years[1]!.toPrincipal, 6);
    expect(r.years[3]!.loanBalance).toBeLessThanOrEqual(r.years[3]!.cashValue * 0.9 + 1);
    expect(r.policies).toHaveLength(1);
  });
  it("opens a new policy when a year's premium crosses the threshold", () => {
    const r = trustLoop([2027, 2028, 2029], (y) => (y === 2029 ? 300_000 : 50_000), iul);
    expect(r.years[2]!.policies).toBe(2);
    expect(r.policies[1]!.openedYear).toBe(2029);
  });
});

describe("the enterprise", () => {
  it("runs the loop on the tax saved, pays principal with the loans, and saves interest against the same plan without the loop", () => {
    const x = { properties: [plan(), plan({ zip: "28403", label: "Second", price: 450_000, loan: { principal: 360_000, ratePct: 6.5, termYears: 30, interestOnlyYears: 0, startYear: 2028, startMonth: 3 }, purchaseYear: 2028, purchaseMonth: 3 })], horizonYears: 30, startYear: 2027, iul, assignAfterTaxCashPct: 0 };
    const e = runEnterprise(x);
    expect(e.years).toHaveLength(30);
    expect(e.years[0]!.taxSaved).toBeGreaterThan(0);
    expect(e.totals.taxSaved).toBeGreaterThan(0);
    expect(e.loop).not.toBeNull();
    expect(e.totals.interestSaved).toBeGreaterThan(0);
    expect(e.totals.interestPaidWithLoop).toBeLessThan(e.totals.interestPaidWithoutLoop);
    expect(e.totals.firstPayoffYear).not.toBeNull();
    expect(e.totals.firstPayoffYear!).toBeLessThan(2056);
    expect(e.totals.hoursPerYear).toBe(MATERIAL_PARTICIPATION_HOURS);
    const last = e.years[29]!;
    expect(last.netWorth).toBeCloseTo(last.equity + last.policyValue - last.policyLoans, 2);
    // Without the loop, nothing changes but the loop columns.
    const plain = runEnterprise({ ...x, iul: null });
    expect(plain.loop).toBeNull();
    expect(plain.totals.interestSaved).toBe(0);
    expect(plain.years[0]!.premiumIn).toBe(0);
  });
  it("cites the participation and depreciation rules", () => {
    expect(PARTICIPATION_SOURCES.map((s) => s.url)).toEqual(expect.arrayContaining(["https://www.law.cornell.edu/cfr/text/26/1.469-5T", "https://www.law.cornell.edu/uscode/text/26/168"]));
  });
});

describe("a candidate from the stored series", () => {
  it("reads value, rent, the window rate and the record rate from the series the Zip Engine stores", () => {
    const levels = { startYear: 2015, values: [200_000, 210_000, 220_000, 235_000, 250_000, 270_000, 310_000, 340_000, 350_000, 360_000, 372_000] }; // 2015..2025
    const rent = { startYear: 2015, values: [1_400, 1_450, 1_500, 1_560, 1_600, 1_650, 1_800, 2_000, 2_100, 2_150, 2_200] };
    const c = candidateFromSeries("28401", { levels, rent, meta: { state: "NC", county: "New Hanover County" }, worstDrawdown: -0.05 }, 6);
    expect(c).not.toBeNull();
    expect(c!.value).toBe(372_000); expect(c!.valueYear).toBe(2025);
    expect(c!.rent).toBe(2_200);
    expect(c!.appreciationWindow).toBeCloseTo(Math.pow(372_000 / 250_000, 1 / 6) - 1, 6);
    expect(c!.appreciationRecord).toBeCloseTo(Math.pow(372_000 / 200_000, 1 / 10) - 1, 6);
    expect(c!.rentGrowth).toBeCloseTo(Math.pow(2_200 / 1_400, 1 / 10) - 1, 6);
    expect(c!.county).toBe("New Hanover County");
    expect(candidateFromSeries("00000", { levels: null, rent: null }, 6)).toBeNull();
  });
});
