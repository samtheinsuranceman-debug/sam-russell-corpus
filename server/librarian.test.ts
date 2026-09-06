// ============================================================
// Financial Librarian router: the assessment gate, offline answers, and the
// journey — with the database and the AI team mocked.
// ============================================================
import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeFactFinder } from "./journeyEngine.test";
import { emptyFactFinder, type ClientFactFinder } from "@shared/clientFactFinder";

const state: { stored: { data: ClientFactFinder; completeness: number; completedAt: Date | null; updatedAt: Date } | null; journeys: unknown[] } = { stored: null, journeys: [] };
vi.mock("./factFinderDb", () => ({
  getFactFinderForUser: vi.fn(async () => state.stored),
  saveFactFinderForUser: vi.fn(async () => null),
  deleteFactFinderForUser: vi.fn(async () => undefined),
  saveJourneyForUser: vi.fn(async (_u: number, _q: string[], j: unknown) => { state.journeys.push(j); return 7; }),
  getLatestJourneyForUser: vi.fn(async () => null),
}));
const providers: Array<{ id: string; label: string; envKey: string; call: (k: string, s: string, u: string) => Promise<string> }> = [];
const leadModelMock = vi.fn(async (_s: string, _u: string) => null as { text: string; via: string } | null);
vi.mock("./ledger", () => ({ recordEvent: vi.fn(async () => 1), recordAssessmentChange: vi.fn(async () => 0), assessmentResetEvent: vi.fn(() => ({ kind: "status", source: "client", summary: "reset" })) }));
vi.mock("./ultraAI", () => ({
  ADVISOR_SYSTEM: "BASE RULES.",
  configuredProviders: () => providers,
  leadModel: (s: string, u: string) => leadModelMock(s, u),
}));

import { librarianRouter } from "./librarianRouter";
import { factFinderRouter } from "./factFinderRouter";

const ctx = () => ({ user: { id: 1, openId: "u1", role: "user" }, req: { headers: {} }, res: {} }) as never;

beforeEach(() => { state.stored = null; state.journeys = []; providers.length = 0; leadModelMock.mockReset(); leadModelMock.mockResolvedValue(null); process.env.K1 = "k"; process.env.K2 = "k"; });

describe("the assessment gate", () => {
  it("refuses to answer, and says how far along the assessment is, until it is complete", async () => {
    const partial = emptyFactFinder();
    partial.sections.household!.firstName = "Dana";
    state.stored = { data: partial, completeness: 2, completedAt: null, updatedAt: new Date() };
    const r = await librarianRouter.createCaller(ctx()).ask({ question: "Should I convert to Roth?", history: [] });
    expect(r.gated).toBe(true);
    expect(r.answer).toBeNull();
    expect(r.spoken).toMatch(/Financial Assessment is \d+% complete/);
    expect(r.missingSections.length).toBeGreaterThan(0);
    const j = await librarianRouter.createCaller(ctx()).journey({ questions: ["Should I convert to Roth?"] });
    expect(j.gated).toBe(true);
    expect(j.journey).toBeNull();
  });
  it("reports status with no assessment at all", async () => {
    const s = await librarianRouter.createCaller(ctx()).status();
    expect(s.complete).toBe(false);
    expect(s.percent).toBe(0);
    expect(s.configured).toBe(false);
  });
});

describe("answering once complete", () => {
  beforeEach(() => { state.stored = { data: completeFactFinder({ income: { w2Income: 650000, spouseIncome: 0 }, taxes: { federalTaxPaid: 205000 } }), completeness: 100, completedAt: new Date(), updatedAt: new Date() }; });

  it("answers from the assessment alone when no AI provider is configured — no invented numbers", async () => {
    const r = await librarianRouter.createCaller(ctx()).ask({ question: "How do I lower my taxes?", history: [] });
    expect(r.gated).toBe(false);
    expect(r.answer).toContain("$650,000");
    expect(r.answer).toContain("$205,000");
    expect(r.answer).toContain("/portal/");
    expect(r.answer).not.toMatch(/\d+(\.\d+)?%/);
    expect(r.contributorCount).toBe(0);
  });

  it("fans the question out to every configured provider with the fact finder, then synthesizes", async () => {
    const seen: string[] = [];
    providers.push(
      { id: "a", label: "Alpha", envKey: "K1", call: async (_k, _s, u) => { seen.push(u); return "alpha says"; } },
      { id: "b", label: "Beta", envKey: "K2", call: async (_k, _s, u) => { seen.push(u); return "beta says"; } },
    );
    leadModelMock.mockResolvedValue({ text: "synthesized answer", via: "claude" });
    const r = await librarianRouter.createCaller(ctx()).ask({ question: "How do I lower my taxes?", history: [{ role: "user", text: "earlier q" }] });
    expect(r.gated).toBe(false);
    expect(r.answer).toBe("synthesized answer");
    expect(r.contributors).toEqual(["Alpha", "Beta"]);
    expect(seen).toHaveLength(2);
    expect(seen[0]).toContain("CLIENT FACT FINDER");
    expect(seen[0]).toContain("$650,000");
    expect(seen[0]).toContain("/portal/tax-waterfall");
    expect(seen[0]).toContain("earlier q");
  });

  it("composes and stores a 10–15 page journey with 3–5 core questions and an emergent question", async () => {
    const r = await librarianRouter.createCaller(ctx()).journey({ questions: ["How do I lower my taxes?", "Should I pay off the mortgage?", "What if the market crashes?", "How do I protect the kids?"] });
    expect(r.gated).toBe(false);
    const j = r.journey!;
    expect(j.coreQuestions.length).toBeGreaterThanOrEqual(3);
    expect(j.coreQuestions.length).toBeLessThanOrEqual(5);
    expect(j.emergentQuestion.length).toBeGreaterThan(40);
    expect(j.steps.length).toBeGreaterThanOrEqual(10);
    expect(j.steps.length).toBeLessThanOrEqual(15);
    expect(j.steps.every((s) => s.path.startsWith("/portal/"))).toBe(true);
    expect(r.journeyId).toBe(7);
    expect(state.journeys).toHaveLength(1);
    expect(r.spoken).toContain("you haven't asked yet");
    expect(r.spoken).toMatch(/you control \d+ variables/);
    expect(j.controls.youControl.length).toBeGreaterThan(0);
    expect(j.steps.every((s) => s.guide.length > 40)).toBe(true);
    const stored = state.journeys[0] as { steps: Array<{ guide?: string }>; controls?: unknown };
    expect(stored.steps[0]!.guide).toBeTruthy();
    expect(stored.controls).toBeTruthy();
  });

  it("keeps the engine's pages even when the AI polish returns something invalid", async () => {
    providers.push({ id: "a", label: "Alpha", envKey: "K1", call: async () => "x" });
    leadModelMock.mockResolvedValue({ text: '{"coreQuestions":["only one"],"emergentQuestion":"short","steps":[{"id":"nope","why":"?"}]}', via: "claude" });
    const r = await librarianRouter.createCaller(ctx()).journey({ questions: ["How do I lower my taxes?"] });
    expect(r.journey!.generatedBy).toBe("journey-engine");
    expect(r.journey!.coreQuestions.length).toBeGreaterThanOrEqual(3);
  });
});

describe("fact finder router (no database)", () => {
  it("returns an empty assessment and reports saves as not persisted", async () => {
    const g = await factFinderRouter.createCaller(ctx()).get();
    expect(g.persisted).toBe(false);
    expect(g.completeness.percent).toBe(0);
    const s = await factFinderRouter.createCaller(ctx()).save({ data: completeFactFinder() });
    expect(s.saved).toBe(false);
    expect(s.completeness.complete).toBe(true);
  });
  it("rejects malformed assessments", async () => {
    await expect(factFinderRouter.createCaller(ctx()).save({ data: { version: 2, sections: {}, lists: {} } as never })).rejects.toThrow();
    await expect(factFinderRouter.createCaller(ctx()).save({ data: { version: 1, sections: { household: { firstName: { nested: true } } }, lists: {} } as never })).rejects.toThrow();
  });
});
