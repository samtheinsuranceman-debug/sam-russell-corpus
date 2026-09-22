/**
 * Regression tests for the crisis screening upgrade.
 *
 * The originally shipped detector was a boolean substring match. These tests pin
 * the two classes of failure it had, so neither can come back.
 */
import { describe, it, expect } from "vitest";
import { screenCrisis, detectCrisis } from "./drBuddy";
import { detectCrisisTier } from "../client/src/components/CrisisDetectionBanner";

describe("Crisis screening — severity grading", () => {
  it("separates a wish to die from a stated plan", () => {
    const passive = screenCrisis("Some days I think everyone would be better off without me.");
    const plan = screenCrisis("I have a plan and I'm going to end my life tonight.");

    expect(passive.cssrsLevel).toBe(1);
    expect(passive.urgent).toBe(false);

    expect(plan.cssrsLevel).toBe(5);
    expect(plan.urgent).toBe(true);

    // The old detector returned the same boolean for both.
    expect(plan.cssrsLevel).toBeGreaterThan(passive.cssrsLevel);
  });

  it("catches plan and intent language the original tier-1 list missed entirely", () => {
    // None of these appeared in the shipped tier1_emergency keyword list.
    for (const text of [
      "I have a plan.",
      "I'm going to do it.",
      "I intend to kill myself.",
      "I wrote a note.",
    ]) {
      const screen = screenCrisis(text);
      expect(screen.cssrsLevel).toBeGreaterThanOrEqual(4);
      expect(screen.urgent).toBe(true);
      expect(detectCrisisTier(text).tier).toBe("tier1_emergency");
    }
  });

  it("does not raise a suicide alert on ordinary depressive language", () => {
    const screen = screenCrisis("I feel hopeless and exhausted and I can't cope with work.");
    // Still flagged — sensitivity is preserved...
    expect(screen.crisisDetected).toBe(true);
    expect(screen.distressMarkers.length).toBeGreaterThan(0);
    // ...but it is NOT ideation, and must not be presented as one.
    expect(screen.cssrsLevel).toBe(0);
    expect(screen.urgent).toBe(false);
  });

  it("stays silent on genuinely neutral text", () => {
    const screen = screenCrisis("Slept well, went to the gym, work was fine.");
    expect(screen.cssrsLevel).toBe(0);
    expect(screen.crisisDetected).toBe(false);
    expect(detectCrisisTier("Slept well, went to the gym, work was fine.").tier).toBeNull();
  });

  it("surfaces the triggering phrase so the call can be audited", () => {
    const screen = screenCrisis("I want to die.");
    expect(screen.triggers.length).toBeGreaterThan(0);
    expect(screen.triggers[0].phrase.toLowerCase()).toContain("want to die");
  });

  it("keeps the boolean API working for existing call sites", () => {
    expect(detectCrisis("I want to die")).toBe(true);
    expect(detectCrisis("I feel hopeless")).toBe(true);
    expect(detectCrisis("Had a good day")).toBe(false);
  });
});

describe("Crisis banner tiering", () => {
  it("maps C-SSRS severity onto the existing three tiers", () => {
    expect(detectCrisisTier("I have a plan for tonight.").tier).toBe("tier1_emergency");
    expect(detectCrisisTier("I want to die.").tier).toBe("tier1_emergency");
    expect(detectCrisisTier("Everyone would be better off without me.").tier).toBe("tier2_high_risk");
    expect(detectCrisisTier("I feel numb and exhausted.").tier).toBe("tier3_elevated");
    expect(detectCrisisTier("Good session today, thanks.").tier).toBeNull();
  });

  it("returns the phrase that fired, not an opaque keyword", () => {
    const r = detectCrisisTier("I intend to kill myself.");
    expect(r.tier).toBe("tier1_emergency");
    expect(r.matchedKeywords.length).toBeGreaterThan(0);
    expect(r.matchedKeywords[0].toLowerCase()).toContain("kill myself");
  });
});
