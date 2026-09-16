import { describe, expect, it } from "vitest";
import {
  INTAKE_STEPS, applyIntakeToFactFinder, buildRecap, buildThreeQuestions, intakeTotals, nextStep,
  parseAnswer, parseMoney, parsePercent, parseYesNo, type Answers,
} from "@shared/aiIntakeScript";
import { emptyFactFinder, factFinderCompleteness } from "@shared/clientFactFinder";

describe("spoken answer parsing", () => {
  it("hears money in every common form", () => {
    expect(parseMoney("about 250k")).toBe(250_000);
    expect(parseMoney("$1.2 million")).toBe(1_200_000);
    expect(parseMoney("two hundred thousand")).toBe(200_000);
    expect(parseMoney("half a million")).toBe(500_000);
    expect(parseMoney("none")).toBe(0);
    expect(parseMoney("I don't have any")).toBe(0);
    expect(parseMoney("12,500 dollars")).toBe(12_500);
    expect(parseMoney("hmm")).toBeNull();
  });
  it("hears percentages and yes/no", () => {
    expect(parsePercent("about four and a half percent")).toBe(4);
    expect(parsePercent("4.5%")).toBe(4.5);
    expect(parsePercent("not sure")).toBe(0);
    expect(parseYesNo("yeah we do")).toBe(true);
    expect(parseYesNo("nope")).toBe(false);
    expect(parseYesNo("I own three of them")).toBe(true);
    expect(parseYesNo("maybe")).toBeNull();
  });
  it("turns 'years ago' into a purchase year", () => {
    const step = INTAKE_STEPS.find((s) => s.id === "annuity.yearBought")!;
    expect(parseAnswer(step, "about 12 years ago")).toBe(new Date().getFullYear() - 12);
    expect(parseAnswer(step, "2014")).toBe(2014);
  });
  it("matches the manager choice from loose speech", () => {
    const step = INTAKE_STEPS.find((s) => s.id === "stocks.manager")!;
    expect(parseAnswer(step, "my guy at Edward Jones")).toBe("A financial advisor");
    expect(parseAnswer(step, "I do it myself")).toBe("Myself");
  });
});

describe("the script", () => {
  it("branches: no stocks skips the advisor questions, no annuity skips the annuity block", () => {
    const a: Answers = {};
    for (const s of INTAKE_STEPS.slice(0, 5)) a[s.id] = 0;
    expect(nextStep(a)?.id).toBe("stocks.has");
    a["stocks.has"] = false;
    expect(nextStep(a)?.id).toBe("bonds.has");
    a["bonds.has"] = false; a["funds.has"] = false; a["annuity.has"] = false;
    expect(nextStep(a)?.id).toBe("home.owns");
  });
  it("asks for the guaranteed monthly income only when the annuity guarantees it", () => {
    const a: Answers = { "annuity.has": true, "annuity.company": "Athene", "annuity.yearBought": 2015, "annuity.value": 200_000, "annuity.guaranteed": true };
    const base: Answers = {};
    for (const s of INTAKE_STEPS) if (s.phase !== "annuity") base[s.id] = s.kind === "yesno" ? false : 0;
    expect(nextStep({ ...base, ...a })?.id).toBe("annuity.monthlyIncome");
    expect(nextStep({ ...base, ...a, "annuity.guaranteed": false })?.id).toBe("annuity.avgReturn");
  });
});

const FULL: Answers = {
  "cash.moneyMarket": 50_000, "cash.cds": 25_000, "cash.checking": 20_000, "cash.savings": 105_000, "cash.rate": 4,
  "stocks.has": true, "stocks.value": 400_000, "stocks.manager": "A financial advisor", "stocks.advisorName": "Mark", "stocks.advisorYears": 9,
  "bonds.has": true, "bonds.value": 100_000, "bonds.rate": 5,
  "funds.has": false,
  "annuity.has": true, "annuity.company": "Athene", "annuity.yearBought": 2016, "annuity.value": 250_000, "annuity.guaranteed": true, "annuity.monthlyIncome": 1_800,
  "home.owns": true, "home.value": 900_000, "home.mortgage": 400_000, "home.zip": "28429",
  "rentals.has": true, "rentals.count": 3, "rentals.mortgageTotal": 600_000, "rentals.interestOnly": 3_200, "rentals.equity": 350_000, "rentals.rent": 4_500,
  "retire.employer": 800_000, "retire.ira": 150_000, "retire.roth": 60_000, "retire.spouseHas": true, "retire.spouseValue": 300_000,
  "unusual.crypto": 40_000, "unusual.metals": 15_000, "unusual.hard": 90_000, "unusual.detail": "two classic Mustangs and a gun collection",
};

describe("recap, mapping and the three questions", () => {
  it("totals and re-explains everything back", () => {
    const t = intakeTotals(FULL);
    expect(t.cash).toBe(200_000);
    expect(t.homeEquity).toBe(500_000);
    expect(t.retirement).toBe(1_310_000);
    expect(t.netWorth).toBe(200_000 + 500_000 + 250_000 + 500_000 + 350_000 + 1_310_000 + 145_000);
    const recap = buildRecap(FULL).join(" ");
    expect(recap).toContain("Mark");
    expect(recap).toContain("Athene");
    expect(recap).toContain("$1,800");
    expect(recap).toContain("Did I get that right?");
  });
  it("maps into the Financial Assessment without erasing what was already there", () => {
    const existing = emptyFactFinder();
    existing.sections.household = { firstName: "Sam" };
    const ff = applyIntakeToFactFinder(existing, FULL, { priorities: "Kill the mortgage", wishes: { account: "no fees", future: "paid-off rentals", outcomes: "kids inherit an engine" } });
    expect(ff.sections.household.firstName).toBe("Sam");
    expect(ff.sections.cash.checking).toBe(20_000);
    expect(ff.sections.cash.moneyMarketCds).toBe(75_000);
    expect(ff.sections.investments.taxableBrokerage).toBe(400_000);
    expect(ff.sections.investments.currentAdvisor).toContain("Mark");
    expect(ff.sections.investments.annuities).toBe(250_000);
    expect(String(ff.sections.investments.annuityDetail)).toContain("guaranteed lifetime income");
    expect(ff.sections.realEstate.homeEquity).toBe(500_000);
    expect(ff.sections.realEstate.primaryHomeZip).toBe("28429");
    expect(ff.lists.properties).toHaveLength(1);
    expect(ff.lists.properties[0].mortgageBalance).toBe(600_000);
    expect(ff.sections.income.rentalIncome).toBe(54_000);
    expect(ff.sections.goals.topGoals).toBe("Kill the mortgage");
    expect(String(ff.sections.goals.tenYearGoals)).toContain("paid-off rentals");
    expect(String(ff.sections.documents.notes)).toContain("Mustangs");
    expect(factFinderCompleteness(ff).answered).toBeGreaterThan(5);
  });
  it("builds three horizon questions from the person's own figures", () => {
    const qs = buildThreeQuestions(FULL, { priorities: "Kill the mortgage", wishes: { future: "paid-off rentals" } });
    expect(qs.map((q) => q.horizon)).toEqual([5, 10, 15]);
    expect(qs[0].question).toContain("$200,000");
    expect(qs[0].question).toContain("Kill the mortgage");
    expect(qs[1].question).toContain("Mark");
    expect(qs[1].question).toContain("Athene");
    expect(qs[1].strategies.some((s) => /1031/.test(s))).toBe(true);
    expect(qs[2].question).toContain("paid-off rentals");
    for (const q of qs) {
      expect(q.strategies.length).toBeGreaterThanOrEqual(6);
      expect(q.calculators.some((c) => c.path === "/portal/chain")).toBe(true);
      expect(q.evidence.length).toBeGreaterThanOrEqual(3);
    }
  });
});
