import { describe, expect, it } from "vitest";
import { CARE_SETTINGS, LTC_LAW, NEED_STATS, coverageFor, escalate, premiumCompare, riderBenefit, type PersonPlan } from "@shared/ltcEngine";

describe("the survey and the need figures", () => {
  it("carries the six settings with the 2025 national medians as the survey prints them, each with attributes rather than a score", () => {
    expect(CARE_SETTINGS.map((s) => s.id)).toEqual(["in_home_aide", "in_home_nurse", "adult_day", "assisted_living", "nursing_semi", "nursing_private"]);
    expect(CARE_SETTINGS.find((s) => s.id === "assisted_living")).toMatchObject({ monthly2025: 6_200, annual2025: 74_400, yoy: 0.05 });
    expect(CARE_SETTINGS.find((s) => s.id === "nursing_private")).toMatchObject({ monthly2025: 10_798, annual2025: 129_575 });
    for (const s of CARE_SETTINGS) { expect(s.keeps.length).toBeGreaterThan(0); expect(s.givesUp.length).toBeGreaterThan(0); expect((s as { score?: number }).score).toBeUndefined(); }
    expect(NEED_STATS).toMatchObject({ chanceAt65: 0.7, yearsWomen: 3.7, yearsMen: 2.2, shareOverFiveYears: 0.2 });
    for (const l of LTC_LAW) expect(l.url).toMatch(/^https:\/\//);
  });
});

describe("the rider", () => {
  it("pays the form's monthly percentage of the death benefit until the form's cap or the death benefit is used up", () => {
    expect(riderBenefit({ deathBenefit: 1_000_000, monthlyPctOfDeathBenefit: 2, maxMonths: null, eliminationDays: 90, riderChargePerYear: null, formName: "", asOf: "" })).toEqual({ monthly: 20_000, monthsAvailable: 50, total: 1_000_000 });
    expect(riderBenefit({ deathBenefit: 1_000_000, monthlyPctOfDeathBenefit: 4, maxMonths: 24, eliminationDays: 90, riderChargePerYear: null, formName: "", asOf: "" })).toEqual({ monthly: 40_000, monthsAvailable: 24, total: 960_000 });
    expect(riderBenefit({ deathBenefit: 0, monthlyPctOfDeathBenefit: 4, maxMonths: null, eliminationDays: 0, riderChargePerYear: null, formName: "", asOf: "" }).total).toBe(0);
  });
  it("escalates a cost to the year care begins", () => {
    expect(escalate(1000, 0.03, 0)).toBe(1000);
    expect(escalate(1000, 0.03, 10)).toBeCloseTo(1000 * 1.03 ** 10, 8);
  });
});

describe("coverage for a person", () => {
  const person: PersonPlan = { label: "You", sex: "female", yearsUntilCare: 10, yearsOfNeed: null, rider: { deathBenefit: 1_000_000, monthlyPctOfDeathBenefit: 2, maxMonths: null, eliminationDays: 90, riderChargePerYear: 3_000, formName: "R-1", asOf: "2026-09-07" }, stateMonthly: { assisted_living: 7_000 } };
  it("uses the state figure where typed, the federal years by sex, escalates to the start of care, and reports covered and shortfall", () => {
    const lines = coverageFor(person, 0.03);
    const al = lines.find((l) => l.setting.id === "assisted_living")!;
    expect(al.stateFigureUsed).toBe(true);
    expect(al.monthlyCostNow).toBe(7_000);
    expect(al.monthlyCostThen).toBeCloseTo(7_000 * 1.03 ** 10, 6);
    expect(al.yearsOfNeed).toBe(3.7);
    const months = Math.round(3.7 * 12);
    expect(al.totalCost).toBeCloseTo(al.monthlyCostThen * months, 4);
    expect(al.riderMonthly).toBe(20_000);
    expect(al.covered).toBeCloseTo(Math.min(al.totalCost, 20_000 * months), 4);
    expect(al.shortfall).toBeCloseTo(Math.max(0, al.totalCost - al.covered), 4);
    const np = lines.find((l) => l.setting.id === "nursing_private")!;
    expect(np.stateFigureUsed).toBe(false);
    expect(np.monthlyCostNow).toBe(10_798);
    expect(np.monthsCoveredAtCost).toBe(Math.floor(1_000_000 / np.monthlyCostThen));
  });
  it("a man without a rider gets the federal years for men and a full shortfall", () => {
    const lines = coverageFor({ ...person, sex: "male", rider: null, stateMonthly: {} }, 0.03);
    expect(lines[0]!.yearsOfNeed).toBe(2.2);
    expect(lines[0]!.covered).toBe(0);
    expect(lines[0]!.shortfall).toBeCloseTo(lines[0]!.totalCost, 4);
  });
});

describe("the standalone quote beside the rider", () => {
  it("prints the ratio only when both premiums are typed, and totals both benefits", () => {
    const r = premiumCompare({ standalonePremiumPerYear: 6_000, standaloneBenefitMonthly: 6_000, standaloneBenefitMonths: 36, riderChargePerYear: 3_000, riderMonthly: 20_000, riderMonths: 50 });
    expect(r.ratio).toBeCloseTo(0.5, 10);
    expect(r.standaloneTotalBenefit).toBe(216_000);
    expect(r.riderTotalBenefit).toBe(1_000_000);
    expect(premiumCompare({ standalonePremiumPerYear: null, standaloneBenefitMonthly: null, standaloneBenefitMonths: null, riderChargePerYear: 3_000, riderMonthly: 20_000, riderMonths: null }).ratio).toBeNull();
    expect(r.note).toMatch(/Neither is 'cheaper'/);
  });
});
