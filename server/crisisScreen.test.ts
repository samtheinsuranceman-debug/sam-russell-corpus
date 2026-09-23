/**
 * The crisis screen used by the genome intake (ported from Doctor Buddy's
 * C-SSRS lexical screen; its regression cases are kept). A disclosure stops
 * the intake; ordinary money stress does not.
 */
import { describe, expect, it } from "vitest";
import { CRISIS_LIFELINE, CRISIS_MESSAGE, screenForCrisis } from "@shared/crisisScreen";

describe("crisis screen", () => {
  it.each([
    "I have a plan.",
    "I'm going to do it.",
    "I intend to kill myself.",
    "I wrote a note.",
    "I want to die.",
    "Some days I think everyone would be better off without me.",
    "I don't want to wake up anymore.",
    "I've been thinking about self-harm again.",
  ])("stops on: %s", (text) => {
    expect(screenForCrisis(text).stop).toBe(true);
  });

  it.each([
    "Slept well, went to the gym, work was fine.",
    "There is nothing left at the end of the month.",
    "I'm exhausted and the market is killing my portfolio.",
    "I feel trapped by the mortgage.",
    "",
  ])("does not stop on: %s", (text) => {
    expect(screenForCrisis(text).stop).toBe(false);
  });

  it("never returns the phrase itself — only whether to stop", () => {
    expect(Object.keys(screenForCrisis("I want to die."))).toEqual(["stop", "markers"]);
  });

  it("points to the 988 Suicide & Crisis Lifeline, with 911 for immediate danger", () => {
    expect(CRISIS_LIFELINE).toMatchObject({ phone: "988", url: "https://988lifeline.org" });
    expect(CRISIS_MESSAGE.join(" ")).toContain("988");
    expect(CRISIS_MESSAGE.join(" ")).toContain("911");
  });

  it("ignores anything that is not text", () => {
    expect(screenForCrisis(undefined).stop).toBe(false);
    expect(screenForCrisis({ toString: () => "I want to die" }).stop).toBe(false);
  });
});
