import { describe, expect, it } from "vitest";
import { TABLE_FIRST_AGE, TABLE_LAST_AGE, expectedLifetimePayments, expectedRemainingYears, expectedYearsEitherAlive, q, survivalTable, survivalTo } from "@shared/longevityEngine";
import { FLOW_THROUGH, INCOME_PLAN_RULES, INCOME_SOURCES, STUDIES_FRAMING, WELLBEING_STUDIES, incomePlan } from "@shared/incomeForLife";
import { ageFrom } from "./incomeForLifeRouter";

describe("the life table", () => {
  it("survival to an age is the product of one-year survivals, and nothing survives the table's last age", () => {
    expect(survivalTo("male", 65, 65)).toBe(1);
    expect(survivalTo("male", 65, 66)).toBeCloseTo(1 - q("male", 65), 12);
    expect(survivalTo("female", 65, 67)).toBeCloseTo((1 - q("female", 65)) * (1 - q("female", 66)), 12);
    expect(survivalTo("male", 65, TABLE_LAST_AGE + 1)).toBe(0);
    expect(q("male", 40)).toBe(q("male", TABLE_FIRST_AGE));
  });
  it("women outlive men at every age in the table, and remaining years fall with age", () => {
    for (const a of [55, 65, 75, 85]) expect(survivalTo("female", a, 90)).toBeGreaterThan(survivalTo("male", a, 90));
    expect(expectedRemainingYears("male", 65)).toBeGreaterThan(expectedRemainingYears("male", 75));
    expect(expectedRemainingYears("female", 65)).toBeGreaterThan(expectedRemainingYears("male", 65));
    // SSA's own 2023 table prints about 17 more years for a 65-year-old man and about 20 for a woman; the curtate sum lands within a year of each.
    expect(expectedRemainingYears("male", 65)).toBeGreaterThan(16); expect(expectedRemainingYears("male", 65)).toBeLessThan(19);
    expect(expectedRemainingYears("female", 65)).toBeGreaterThan(19); expect(expectedRemainingYears("female", 65)).toBeLessThan(22);
  });
  it("a couple's 'either' is one minus the product of the deaths, 'both' the product of the survivals, and milestones already passed are dropped", () => {
    const t = survivalTable({ age: 65, sex: "male" }, { age: 63, sex: "female" }, [60, 80, 95]);
    expect(t.map((r) => r.age)).toEqual([80, 95]);
    const r = t[0]!;
    expect(r.yearsFromNow).toBe(15);
    expect(r.first).toBeCloseTo(survivalTo("male", 65, 80), 12);
    expect(r.second).toBeCloseTo(survivalTo("female", 63, 78), 12);
    expect(r.either).toBeCloseTo(1 - (1 - r.first) * (1 - r.second!), 12);
    expect(r.both).toBeCloseTo(r.first * r.second!, 12);
    expect(r.either!).toBeGreaterThan(Math.max(r.first, r.second!));
    expect(r.both!).toBeLessThan(Math.min(r.first, r.second!));
    const single = survivalTable({ age: 65, sex: "male" }, null);
    expect(single.map((r) => r.age)).toEqual([80, 85, 90, 95, 100]);
    expect(single[0]!.either).toBeNull();
  });
  it("expected years with at least one alive exceed either life alone, and the expected total is the level payment times those years", () => {
    const first = { age: 65, sex: "male" as const }, second = { age: 65, sex: "female" as const };
    const joint = expectedYearsEitherAlive(first, second);
    expect(joint).toBeGreaterThan(expectedRemainingYears("female", 65));
    expect(expectedYearsEitherAlive(first, null)).toBeCloseTo(expectedRemainingYears("male", 65), 10);
    const p = expectedLifetimePayments(30_000, first, second);
    expect(p.expectedYears).toBeCloseTo(joint, 12);
    expect(p.expectedTotal).toBeCloseTo(30_000 * joint, 6);
  });
});

describe("the income plan", () => {
  const base = { balance: 500_000, conversionTaxPct: 0, payoutPct: 6, bonusPct: 10, startAge: 65, sex: "male" as const, spouse: null, marginalRatePct: 24, deferralYears: 0 };
  it("refuses taxable money and says why", () => {
    const r = incomePlan({ ...base, accountKind: "taxable" });
    expect(r.refused).toMatch(/taxable money/);
    expect(r.annualIncome).toBe(0);
    expect(r.lines).toEqual([]);
  });
  it("converts at the typed tax, applies the sheet's bonus and payout, and sizes the total with the life table", () => {
    const r = incomePlan({ ...base, accountKind: "pretax", conversionTaxPct: 20 });
    expect(r.refused).toBeNull();
    expect(r.afterConversion).toBe(400_000);
    expect(r.withBonus).toBeCloseTo(440_000, 6);
    expect(r.annualIncome).toBeCloseTo(26_400, 6);
    expect(r.monthlyIncome).toBeCloseTo(2_200, 6);
    expect(r.expectedYears).toBeCloseTo(expectedRemainingYears("male", 65), 10);
    expect(r.expectedTotal).toBeCloseTo(26_400 * r.expectedYears, 4);
    expect(r.ifTaxable.annualAfterTax).toBeCloseTo(26_400 * 0.76, 6);
    expect(r.ifTaxable.taxOverLife).toBeCloseTo(26_400 * 0.24 * r.expectedYears, 4);
    expect(r.lines[0]).toMatch(/20% conversion tax/);
  });
  it("a zero-percent conversion keeps the whole balance and says the pass zeroed it; an existing Roth skips conversion; deferral moves the start age", () => {
    const zero = incomePlan({ ...base, accountKind: "pretax" });
    expect(zero.afterConversion).toBe(500_000);
    expect(zero.lines[0]).toMatch(/conversion pass zeroed it/);
    const roth = incomePlan({ ...base, accountKind: "roth" });
    expect(roth.afterConversion).toBe(500_000);
    expect(roth.lines[0]).toMatch(/Already Roth/);
    const deferred = incomePlan({ ...base, accountKind: "roth", deferralYears: 5 });
    expect(deferred.expectedYears).toBeCloseTo(expectedRemainingYears("male", 70), 10);
    expect(deferred.lines[2]).toMatch(/from age 70 after 5 years of deferral/);
  });
  it("a joint plan runs for the longer of two lives", () => {
    const single = incomePlan({ ...base, accountKind: "roth" });
    const joint = incomePlan({ ...base, accountKind: "roth", spouse: { age: 62, sex: "female" } });
    expect(joint.expectedYears).toBeGreaterThan(single.expectedYears);
    expect(joint.lines[3]).toMatch(/at least one of you/);
  });
});

describe("the studies, the rules and the sources", () => {
  it("every study carries a URL, a finding in its own terms and a kind; the framing says no study measured longer life", () => {
    expect(WELLBEING_STUDIES.length).toBeGreaterThanOrEqual(4);
    for (const s of WELLBEING_STUDIES) { expect(s.url).toMatch(/^https:\/\//); expect(s.finding.length).toBeGreaterThan(40); expect(["peer-reviewed", "working paper", "book chapter", "industry survey", "company page"]).toContain(s.kind); }
    expect(WELLBEING_STUDIES.some((s) => /opposite|other way|lower subjective/.test(s.finding + (s.caveat ?? "")))).toBe(true);
    expect(STUDIES_FRAMING).toMatch(/None of the studies read here measured longer life/);
  });
  it("the exit provision names no company, and the rules list what is never printed", () => {
    expect(INCOME_PLAN_RULES.exitProvision).not.toMatch(/Athene|Allianz|Nationwide|Midland|North American|F&G|Lincoln|Prudential|MassMutual/i);
    expect(INCOME_PLAN_RULES.exitProvision).toMatch(/fourth contract year/);
    expect(INCOME_PLAN_RULES.neverPrinted).toContain("a company name beside the exit provision");
    expect(INCOME_PLAN_RULES.neverPrinted).toContain("a claim that income raises longevity");
  });
  it("the flow-through shows questions with authorities rather than a multiplier, and the sources are the Code", () => {
    expect(FLOW_THROUGH.questions.length).toBe(4);
    for (const qn of FLOW_THROUGH.questions) expect(qn.authority.label.length).toBeGreaterThan(0);
    expect(FLOW_THROUGH.questions.filter((qn) => qn.authority.url).every((qn) => /law\.cornell\.edu\/uscode\/text\/26\//.test(qn.authority.url))).toBe(true);
    expect(FLOW_THROUGH.whatThePageWillDo).toMatch(/questions, not a multiplier/);
    expect(INCOME_SOURCES.map((s) => s.url)).toEqual(expect.arrayContaining(["https://www.law.cornell.edu/uscode/text/26/408A", "https://www.law.cornell.edu/uscode/text/26/72", "https://www.law.cornell.edu/uscode/text/26/7702A"]));
  });
});

describe("ages from the Fact Finder", () => {
  it("counts whole years from a date of birth and returns null for anything that is not a date", () => {
    const today = new Date("2026-09-07T12:00:00Z");
    expect(ageFrom("1961-09-08", today)).toBe(64);
    expect(ageFrom("1961-09-07", today)).toBe(65);
    expect(ageFrom("1961-01-15", today)).toBe(65);
    expect(ageFrom("", today)).toBeNull();
    expect(ageFrom("not a date", today)).toBeNull();
    expect(ageFrom(undefined, today)).toBeNull();
  });
});
