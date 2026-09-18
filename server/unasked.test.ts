// ============================================================
// The questions you haven't asked: the candidates a profile raises, their
// scales from the client's own figures, the count options, the scripts, and
// the cadence gate.
// ============================================================
import { describe, expect, it } from "vitest";
import { COUNT_OPTIONS, candidateQuestions, pickQuestions, proposeScript, revealScript, shouldOffer } from "@shared/unaskedQuestions";
import type { ClientFactFinder } from "@shared/clientFactFinder";

const ff = (sections: Record<string, Record<string, unknown>>): ClientFactFinder => ({ sections, lists: {} } as unknown as ClientFactFinder);
const surgeon = ff({
  household: { dateOfBirth: "1978-04-02", maritalStatus: "Married" },
  income: { employmentType: "Practice owner / partner", w2Income: 350_000, practiceDistributions: 550_000, spouseIncome: 90_000 },
  taxes: { federalTaxPaid: 290_000 },
  realEstate: { homeEquity: 900_000 },
  debts: { studentLoanBalance: 180_000 },
  investments: { employerPlanBalance: 1_200_000, traditionalIra: 400_000, taxableBrokerage: 800_000 },
  cash: { checkingSavings: 600_000 },
  insurance: {},
  practice: { practiceValue: 3_000_000 },
  estate: { estimatedNetWorth: 9_000_000 },
  goals: { topGoals: "Retire at 58 with the house paid off\nFund the kids' school" },
});

describe("candidate questions", () => {
  it("raises the questions the profile supports, scaled from the client's own figures, and ranks by scale", () => {
    const qs = candidateQuestions(surgeon, { inflation: 0.03, pHigherTaxes30: 0.82 });
    const ids = qs.map((q) => q.id);
    for (const id of ["erosion.hurdle", "erosion.taxpath", "tax.roth", "forgiveness.path", "tax.equity", "tax.cashbalance", "protect.disability", "estate.exemption", "controls.authority", "tax.exit", "erosion.cash", "journey.goal"]) expect(ids, id).toContain(id);
    for (let i = 1; i < qs.length; i += 1) expect(qs[i - 1]!.scale).toBeGreaterThanOrEqual(qs[i]!.scale);
    const roth = qs.find((q) => q.id === "tax.roth")!;
    expect(roth.scale).toBe(Math.round(1_600_000 * 0.13));
    expect(roth.why).toMatch(/\$1,600,000/);
    const exit = qs.find((q) => q.id === "tax.exit")!;
    expect(exit.scale).toBe(Math.round(3_000_000 * 0.238));
    expect(qs.find((q) => q.id === "erosion.taxpath")!.question).toMatch(/82%/);
    expect(qs.find((q) => q.id === "journey.goal")!.question).toMatch(/Retire at 58/);
    expect(qs.every((q) => q.path.startsWith("/portal/"))).toBe(true);
  });
  it("raises nothing it cannot support, and says what it needs", () => {
    const thin = candidateQuestions(ff({ income: { w2Income: 120_000 } }));
    expect(thin.map((q) => q.id)).toEqual(["erosion.hurdle", "controls.authority"]);
    expect(candidateQuestions(null)).toEqual([{ ...candidateQuestions(null)[0]! }].filter((q) => q.id === "controls.authority"));
    const withLoans = candidateQuestions(ff({ income: { w2Income: 250_000 }, debts: { studentLoanBalance: 200_000 } }));
    expect(withLoans.find((q) => q.id === "forgiveness.path")!.needs).toContain("income.employmentType");
  });
  it("picks by the count the client chose and scripts the two consent moments", () => {
    const qs = candidateQuestions(surgeon);
    expect(pickQuestions(qs, "3-5").length).toBe(5);
    expect(pickQuestions(qs, "5-7").length).toBe(7);
    expect(pickQuestions(qs, "5-10").length).toBe(10);
    expect(COUNT_OPTIONS["5-10"].max).toBe(10);
    expect(pickQuestions(qs.slice(0, 4), "5-10").length).toBe(4); // never more than exist
    expect(proposeScript(10, 3)).toMatch(/May I show you 3 to 10 of them/);
    expect(proposeScript(4, 4)).toMatch(/May I show you them/);
    const reveal = revealScript(pickQuestions(qs, "3-5"));
    expect(reveal).toMatch(/1\. /); expect(reveal).toMatch(/anything else you want me to know/);
  });
  it("offers on the first visit, after the interval, when the profile changes, or when a stronger question appears — otherwise waits", () => {
    const qs = candidateQuestions(surgeon);
    const now = new Date("2026-09-06");
    expect(shouldOffer(null, now, "h1", qs).offer).toBe(true);
    const recent = { at: new Date("2026-08-30"), questionIds: qs.slice(0, 5).map((q) => q.id), profileHash: "h1" };
    expect(shouldOffer(recent, now, "h1", qs)).toMatchObject({ offer: false });
    expect(shouldOffer(recent, now, "h2", qs)).toMatchObject({ offer: true, reason: "the profile has changed" });
    expect(shouldOffer({ ...recent, at: new Date("2026-07-01") }, now, "h1", qs).offer).toBe(true);
    expect(shouldOffer({ ...recent, questionIds: ["something.else"] }, now, "h1", qs)).toMatchObject({ offer: true, reason: "a stronger question has appeared" });
  });
});
