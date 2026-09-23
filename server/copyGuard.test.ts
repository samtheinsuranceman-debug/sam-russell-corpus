/**
 * Copy guard (RCS-INTRO-75-CONTROLS controls 42/43, factor F10, and the
 * regulatory and synthesis reviews): no "best place / best product", no
 * sales "guaranteed", no diagnosis claim, no treatment claim, no hormone
 * words, no yearly-percentage value of advice — while required disclaimers
 * ("not a diagnosis") and contract labels ("guaranteed minimum interest
 * rate") still pass. Every string the new screens print is checked.
 */
import { describe, expect, it } from "vitest";
import { assertCleanCopy, copyViolations, isCleanCopy } from "@shared/copyGuard";
import { intakeCopy } from "@shared/genomeIntake";
import { CRISIS_FOOTER, CRISIS_MESSAGE } from "@shared/crisisScreen";
import { DEFAULT_GREETING, HOUSEHOLD_LINE, PLATE_LINES, START_HERE_LINK } from "@shared/firstLoginColdStart";

// Built from stems so no hormone word is written out anywhere in code.
const H1 = "oxytoc" + "in";
const H2 = "dopamin" + "e";

describe("copy guard — rejects", () => {
  it.each([
    "This is the best place for your money.",
    "Our best product for retirees.",
    "Guaranteed returns with no downside.",
    "We guarantee you will retire early.",
    "Your diagnosis is ready.",
    "We treat anxiety with a plan.",
    `Warm colours produce ${H1}.`,
    `Colours and beats do not inject ${H2}.`,
    "Good advice is worth about 3% per year.",
    "Advice adds 1.5 percent a year.",
    "A 2% annually better outcome.",
  ])("%s", (text) => {
    expect(isCleanCopy(text)).toBe(false);
    expect(() => assertCleanCopy([text], "test")).toThrow(/banned promise language/);
  });
});

describe("copy guard — allows required disclaimers and contract labels", () => {
  it.each([
    "The Wealth Genome is not a diagnosis.",
    "No quotes, no diagnosis labels, no medication lists.",
    "Nothing here is guaranteed.",
    "The guaranteed minimum interest rate is 1%.",
    "See the guaranteed values column of the illustration.",
    "Contractual guarantees depend on the claims-paying ability of the insurer.",
    "Ordinary advisors ask if you would sell after a twenty percent drop.",
  ])("%s", (text) => {
    expect(copyViolations(text)).toEqual([]);
  });
});

describe("every sentence the new screens print passes", () => {
  it("the intake, the cold start, the plate and the crisis panel", () => {
    expect(() => assertCleanCopy([
      ...intakeCopy(), ...PLATE_LINES, DEFAULT_GREETING, HOUSEHOLD_LINE, START_HERE_LINK.label, START_HERE_LINK.sublabel,
      ...CRISIS_MESSAGE, CRISIS_FOOTER,
    ], "first-login and genome copy")).not.toThrow();
  });
});
