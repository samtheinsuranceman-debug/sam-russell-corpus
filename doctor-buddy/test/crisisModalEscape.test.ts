/**
 * The tier-1 crisis modal must be escapable.
 *
 * It rendered its close control behind `!isTier1`, so a patient who disclosed
 * daily suicidal ideation during the intake hit a full-screen overlay with no
 * way out. The intake restores its draft on reload, so refreshing returned them
 * to the same question and the same wall: the patient at highest risk was the
 * only one who could not complete the assessment.
 *
 * Being unmissable and being inescapable are different properties. These tests
 * hold the first and forbid the second.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";

const SRC = fs.readFileSync("client/src/components/CrisisDetectionBanner.tsx", "utf-8");

describe("tier-1 crisis modal", () => {
  it("does not gate its close control on tier", () => {
    // The exact shape of the original bug.
    expect(SRC).not.toMatch(/\{\s*!isTier1\s*&&\s*onDismiss\s*&&/);
  });

  it("offers an explicit way to continue", () => {
    expect(SRC).toMatch(/continue/i);
  });

  it("still renders as a blocking full-screen overlay", () => {
    // The alert must remain unmissable — this is not a licence to soften it
    // into an ignorable banner.
    expect(SRC).toContain("fixed inset-0");
    expect(SRC).toMatch(/z-\[9999\]/);
  });

  it("keeps the 988 lifeline as the primary action", () => {
    expect(SRC).toContain('href="tel:988"');
  });

  it("logs the crisis event before any dismissal is possible", () => {
    // Dismissal must not be a way to avoid the record. The logging effect runs
    // on mount, ahead of the render that draws the close control.
    const logIdx = SRC.indexOf("logCrisis.mutate");
    const returnIdx = SRC.indexOf("fixed inset-0");
    expect(logIdx).toBeGreaterThan(-1);
    expect(logIdx).toBeLessThan(returnIdx);
  });

  it("never claims to contact emergency services on the patient's behalf", () => {
    expect(SRC).not.toMatch(/we (have )?(called|contacted|dispatched|notified) (911|emergency)/i);
  });
});
