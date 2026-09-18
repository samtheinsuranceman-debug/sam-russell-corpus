import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADVISOR_MODES, HORIZON_FACTS, MODE_IDS, SINGLE_MODES, horizonQuestion, modeDef } from "../shared/advisorModes";
import { buildAnswerPdf } from "./answerPdf";

describe("advisor answer modes", () => {
  it("offers the six ways to answer, plus the twenty-year questions with permission, with the NFL frame and the citation rule in the prompts", () => {
    expect(MODE_IDS).toEqual(["surface", "deeper", "integrated", "wiifm", "legal", "all", "horizon"]);
    expect(modeDef("horizon").instruction).toMatch(/fifteen or twenty years/);
    expect(modeDef("horizon").instruction).toMatch(/THREE TO FIVE questions/);
    expect(modeDef("horizon").instruction).not.toMatch(/smarter/);
    expect(HORIZON_FACTS).toHaveLength(5);
    expect(horizonQuestion({ age: "41" })).toContain("Your age: 41");
    const advisor = readFileSync(resolve("client/src/components/VoiceAdvisor.tsx"), "utf8");
    expect(advisor).toContain("two to five more minutes");
    expect(advisor).toContain("Yes, ask me");
    expect(advisor).toContain("Not now");
    expect(advisor).toContain('data-testid="horizon-offer"');
    expect(advisor).toContain("PICKABLE_MODES");
    expect(SINGLE_MODES).toHaveLength(5);
    expect(modeDef("wiifm").instruction).toMatch(/NFL/);
    expect(modeDef("wiifm").instruction).toMatch(/little league/i);
    expect(modeDef("legal").instruction).toMatch(/Internal Revenue Code/);
    expect(modeDef("legal").instruction).toMatch(/not certain of a citation, say so/);
    expect(modeDef("all").instruction).toMatch(/DIRECT ANSWER/);
    for (const m of ADVISOR_MODES) { expect(m.maxWords).toBeGreaterThan(0); expect(m.blurb.length).toBeGreaterThan(10); }
    expect(modeDef("nope" as never).id).toBe("surface");
  });
});

describe("answer PDF", () => {
  it("renders the question and every section into a real PDF", async () => {
    const pdf = await buildAnswerPdf({
      question: "Should I convert my IRA to a Roth this year?",
      pagePath: "/portal/tax-schedule",
      generatedAt: new Date("2026-09-06T12:00:00Z"),
      recipient: "doctor@example.com",
      sections: SINGLE_MODES.map((m) => ({ id: m, title: modeDef(m).label, text: `Answer in the ${m} mode. `.repeat(40), via: "claude" })),
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(4000);
    expect(pdf.toString("latin1")).toContain("/Title");
  });
});
