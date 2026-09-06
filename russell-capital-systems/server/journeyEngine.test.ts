// ============================================================
// The Financial Librarian's deterministic core: fact-finder completeness,
// question distillation, the emergent question, and journey composition.
// ============================================================
import { describe, expect, it } from "vitest";
import { FACT_FINDER_SECTIONS, emptyFactFinder, factFinderCompleteness, factFinderFieldCount, factFinderSummary, fieldVisible, type ClientFactFinder } from "@shared/clientFactFinder";
import { CATALOG_BY_ID, JOURNEY_CATALOG } from "@shared/journeyCatalog";
import { buildJourney, detectTags, distillQuestions, emergentQuestion, factFinderSignals, validateJourney, JOURNEY_MAX, JOURNEY_MIN } from "@shared/journeyEngine";

/** Fill every required, visible field with a plausible value (no real client). */
export function completeFactFinder(overrides: Record<string, Record<string, string | number | boolean | null>> = {}): ClientFactFinder {
  const ff = emptyFactFinder();
  for (const s of FACT_FINDER_SECTIONS) {
    const data = ff.sections[s.id]!;
    // Two passes so showIf-gated required fields become visible.
    for (let pass = 0; pass < 2; pass++) {
      for (const f of s.fields) {
        if (!f.required || !fieldVisible(f, data) || data[f.key] !== undefined) continue;
        data[f.key] = f.type === "money" || f.type === "number" || f.type === "percent" ? 1 : f.type === "boolean" ? true : f.type === "select" ? f.options![0]! : f.type === "date" ? "1980-01-01" : "test";
      }
    }
  }
  for (const [sec, vals] of Object.entries(overrides)) Object.assign(ff.sections[sec]!, vals);
  return ff;
}

const PHYSICIAN = completeFactFinder({
  household: { firstName: "Dana", lastName: "Doe", dateOfBirth: "1981-04-02", occupation: "Surgeon", specialty: "Orthopedic surgery", dependents: 2, stateOfResidence: "Texas" },
  income: { w2Income: 650000, spouseIncome: 0, incomeTrajectory: "Rising modestly" },
  taxes: { adjustedGrossIncome: 640000, federalTaxPaid: 205000, filingStatus: "Married filing jointly", priorReturnsAvailable: true, taxPain: "I pay too much" },
  realEstate: { ownsPrimaryHome: true, primaryHomeValue: 1400000, primaryMortgageBalance: 900000, primaryMortgageRate: 6.5, primaryMortgageYearsRemaining: 26, homeEquity: 500000 },
  debts: { studentLoanBalance: 180000 },
  investments: { taxableBrokerage: 150000, employerPlanBalance: 700000, rothIra: 40000, concentratedPosition: false, riskTolerance: "Moderate", worstYearReaction: "Sell to stop the losses" },
  cash: { checking: 20000, savings: 15000, emergencyFundMonths: 2 },
  cashFlow: { monthlyTakeHome: 30000, monthlyFixedExpenses: 18000, monthlyDiscretionary: 6000, monthlySavings: 6000, retirementLifestyle: "Travel" },
  insurance: { termLifeDeathBenefit: 2000000, disabilityMonthlyBenefit: 0, malpracticeLimits: "1M/3M" },
  practice: { ownsPractice: false },
  estate: { hasWill: false, hasRevocableTrust: false, heirs: "Kids, in trust", legacyGoals: "Fund education" },
  protection: { divorceProtectionPriority: "5 — Essential", creditorProtectionPriority: "4", taxFreeIncomePriority: "5 — Essential" },
  retirement: { targetRetirementAge: 58, desiredRetirementIncomeMonthly: 25000, retirementConcern: "A market crash right when I retire" },
  goals: { topGoals: "Retire at 58\nPay off the house\nProtect the kids", biggestConcern: "Taxes", timelineToAct: "Immediately" },
});

describe("fact finder completeness", () => {
  it("is empty and incomplete to start, and lists every required field as missing", () => {
    const c = factFinderCompleteness(emptyFactFinder());
    expect(c.percent).toBe(0);
    expect(c.complete).toBe(false);
    expect(c.missing.length).toBe(c.required);
    expect(c.required).toBeGreaterThanOrEqual(40);
  });
  it("is complete once every required visible field is answered", () => {
    const c = factFinderCompleteness(PHYSICIAN);
    expect(c.missing).toEqual([]);
    expect(c.percent).toBe(100);
    expect(c.complete).toBe(true);
  });
  it("asks more than 150 questions in total and has 15 sections", () => {
    expect(FACT_FINDER_SECTIONS).toHaveLength(15);
    expect(factFinderFieldCount()).toBeGreaterThan(150);
  });
  it("summarises answered fields as plain text with formatted money", () => {
    const text = factFinderSummary(PHYSICIAN);
    expect(text).toContain("## Household");
    expect(text).toContain("W-2 salary (annual): $650,000");
    expect(text).toContain("Own your primary home?: Yes");
    expect(factFinderSummary(emptyFactFinder())).toBe("");
  });
});

describe("question distillation", () => {
  it("detects topics in plain questions", () => {
    expect(detectTags("How do I pay less in taxes?")).toContain("tax");
    expect(detectTags("Should I pay off my mortgage early?")).toEqual(expect.arrayContaining(["mortgage", "home"]));
    expect(detectTags("What if the market crashes when I retire?")).toEqual(expect.arrayContaining(["volatility", "retirement"]));
  });
  it("boils many questions down to 3–5 core questions", () => {
    const qs = [
      "How do I lower my taxes?", "Is a Roth conversion smart for me?", "Should I pay the mortgage off early?",
      "What about my student loans?", "Can I retire at 58?", "What if the market crashes?", "How do I protect my kids?",
      "Is IUL a scam?", "How much cash should I keep?", "What order do I do all this in?",
    ];
    const d = distillQuestions(qs, factFinderSignals(PHYSICIAN));
    expect(d.length).toBeGreaterThanOrEqual(3);
    expect(d.length).toBeLessThanOrEqual(5);
    expect(new Set(d.map((x) => x.tag)).size).toBe(d.length);
  });
  it("pads a single question up to three using assessment signals", () => {
    const d = distillQuestions(["How do I lower my taxes?"], factFinderSignals(PHYSICIAN));
    expect(d.length).toBeGreaterThanOrEqual(3);
    expect(d[0]!.tag).toBe("tax");
    expect(d.slice(1).every((x) => x.from[0]!.startsWith("from your assessment"))).toBe(true);
  });
});

describe("assessment signals and the emergent question", () => {
  it("reads the physician's facts into weighted signals", () => {
    const tags = factFinderSignals(PHYSICIAN).map((s) => s.tag);
    for (const t of ["tax", "mortgage", "equity", "student-loans", "roth", "volatility", "disability", "estate", "divorce", "retirement", "liquidity"]) expect(tags).toContain(t);
  });
  it("names a question the client did not ask, drawn from their facts", () => {
    const signals = factFinderSignals(PHYSICIAN);
    const asked = distillQuestions(["How do I lower my taxes?", "Should I pay off the mortgage?"], signals);
    const e = emergentQuestion(asked, signals);
    expect(["tax", "mortgage"]).not.toContain(e.tag);
    expect(e.question.length).toBeGreaterThan(40);
    expect(e.reason.length).toBeGreaterThan(5);
  });
});

describe("journey composition", () => {
  const qs = ["How do I lower my taxes?", "Should I pay off my mortgage early?", "What if the market crashes when I retire?"];
  const j = buildJourney(qs, PHYSICIAN);

  it("produces 10–15 real pages, each building on the last, ending in a review", () => {
    expect(j.steps.length).toBeGreaterThanOrEqual(JOURNEY_MIN);
    expect(j.steps.length).toBeLessThanOrEqual(JOURNEY_MAX);
    for (const s of j.steps) expect(CATALOG_BY_ID[s.id]?.path).toBe(s.path);
    expect(new Set(j.steps.map((s) => s.id)).size).toBe(j.steps.length);
    expect(j.steps[0]!.id).toBe("mirror");
    expect(j.steps[j.steps.length - 1]!.kind).toBe("review");
    const builds = j.steps.map((s) => CATALOG_BY_ID[s.id]!.builds);
    expect([...builds].sort((a, b) => a - b)).toEqual(builds);
    expect(j.steps[1]!.why).toContain("Builds on");
  });
  it("covers every core question with at least one page and includes a calculator", () => {
    j.coreQuestions.forEach((_, i) => expect(j.steps.some((s) => s.serves.includes(`Q${i + 1}`))).toBe(true));
    expect(j.steps.some((s) => s.kind === "calculator")).toBe(true);
    expect(j.steps.some((s) => s.serves.includes("emergent"))).toBe(true);
  });
  it("brings in protection pages when the client rated protection essential", () => {
    expect(j.steps.some((s) => s.kind === "protection" || s.kind === "legacy")).toBe(true);
  });
  it("validates, and rejects a journey with an unknown page or the wrong size", () => {
    expect(validateJourney(j).ok).toBe(true);
    expect(validateJourney({ ...j, steps: [...j.steps, { id: "nope", path: "/x", title: "x", why: "", kind: "education", serves: [] }] }).ok).toBe(false);
    expect(validateJourney({ ...j, steps: j.steps.slice(0, 4) }).ok).toBe(false);
    expect(validateJourney({ ...j, coreQuestions: [] }).ok).toBe(false);
  });
  it("every catalog page is unique and lives under the portal", () => {
    expect(new Set(JOURNEY_CATALOG.map((p) => p.id)).size).toBe(JOURNEY_CATALOG.length);
    expect(new Set(JOURNEY_CATALOG.map((p) => p.path)).size).toBe(JOURNEY_CATALOG.length);
    for (const p of JOURNEY_CATALOG) expect(p.path.startsWith("/portal/")).toBe(true);
  });
});
