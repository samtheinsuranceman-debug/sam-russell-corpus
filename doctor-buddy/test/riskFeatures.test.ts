/**
 * Deriving patent-04 risk features from the intake.
 *
 * The intake cannot observe most of what the risk engine consumes — days since
 * last contact, adherence, prior hospitalizations. Those default to
 * population-typical, which is to say healthy. That is a safe default only if
 * the caller knows it happened, so these tests hold the reporting contract as
 * firmly as the arithmetic.
 */
import { describe, it, expect } from "vitest";
import { DSM5_QUESTIONS } from "../shared/intake/questions";
import {
  deriveRiskFeatures,
  cssrsFloorFromIntake,
  NEUTRAL_FEATURES,
} from "../shared/intake/riskFeatures";
import { scoreIntake } from "../shared/intake/scoring";
import { FEATURE_KEYS } from "../shared/engines/riskScoring";

function mild(q: (typeof DSM5_QUESTIONS)[number]): string {
  return q.type === "yesno" ? "No" : q.options[0];
}
function allMild(): Record<string, string> {
  const a: Record<string, string> = {};
  for (const q of DSM5_QUESTIONS) a[q.id.toString()] = mild(q);
  return a;
}

describe("deriveRiskFeatures", () => {
  it("names every feature as either observed or unobserved", () => {
    const d = deriveRiskFeatures(allMild());
    const seen = [...d.observed, ...d.unobserved].sort();
    expect(seen).toEqual([...FEATURE_KEYS].sort());
  });

  it("never silently assumes a feature it cannot observe", () => {
    const d = deriveRiskFeatures(allMild());
    // These require longitudinal or historical data the intake never collects.
    for (const key of ["daysSinceContact", "socialRatio", "adherence", "priorHospitalizations"] as const) {
      expect(d.unobserved, `${key} must be declared unobserved`).toContain(key);
      expect(d.features[key]).toBe(NEUTRAL_FEATURES[key]);
    }
  });

  it("derives symptom severity from the highest scoring domain", () => {
    const answers = allMild();
    // Drive depression high; it should become the peak.
    for (const q of DSM5_QUESTIONS.filter(x => x.domain === "Depression")) {
      answers[q.id.toString()] = q.type === "yesno" ? "Yes" : q.options[q.options.length - 1];
    }
    const d = deriveRiskFeatures(answers);
    expect(d.observed).toContain("symptomSeverity");
    expect(d.features.symptomSeverity).toBeGreaterThan(60);
  });

  it("does not dilute one severe domain with many healthy ones", () => {
    const answers = allMild();
    for (const q of DSM5_QUESTIONS.filter(x => x.domain === "Depression")) {
      answers[q.id.toString()] = q.type === "yesno" ? "Yes" : q.options[q.options.length - 1];
    }
    const d = deriveRiskFeatures(answers);
    const intake = scoreIntake(answers);
    const mean =
      intake.candidates.reduce((s, c) => s + c.severity, 0) / Math.max(1, intake.candidates.length);
    // Peak, not mean — averaging would mask a single severe presentation.
    expect(d.features.symptomSeverity).toBeGreaterThan(mean);
  });
});

describe("C-SSRS floor", () => {
  it("is zero for a completed intake with no endorsement", () => {
    const intake = scoreIntake(allMild());
    expect(cssrsFloorFromIntake(intake)).toBe(0);
  });

  it("maps passive ideation to a low but non-zero level", () => {
    const intake = scoreIntake({ ...allMild(), "9": "Several days" });
    expect(cssrsFloorFromIntake(intake)).toBe(1);
  });

  it("maps daily ideation to a high level", () => {
    const intake = scoreIntake({ ...allMild(), "9": "Nearly every day" });
    expect(cssrsFloorFromIntake(intake)).toBe(4);
  });

  it("never claims level 5, which the intake cannot establish", () => {
    // Level 5 is a stated plan. The intake asks about ideation and behaviour,
    // not plans, so claiming it would assert something never asked.
    for (const answer of ["Several days", "More than half the days", "Nearly every day"]) {
      const intake = scoreIntake({ ...allMild(), "9": answer });
      expect(cssrsFloorFromIntake(intake)).toBeLessThan(5);
    }
  });

  it("raises the derived cssrsLevel feature on disclosure", () => {
    const clean = deriveRiskFeatures(allMild());
    const disclosed = deriveRiskFeatures({ ...allMild(), "9": "Nearly every day" });
    expect(disclosed.features.cssrsLevel).toBeGreaterThan(clean.features.cssrsLevel);
    expect(disclosed.observed).toContain("cssrsLevel");
  });
});

describe("safety cap on the displayed score", () => {
  // Mirrors the cap applied in PsychiatricRiskScore.tsx. With six of eight
  // features defaulted healthy, a patient reporting daily suicidal ideation
  // scored 833/1000 and was shown "Optimal — exceptional mental health
  // resilience". Assumed-healthy inputs must not outvote a stated one.
  const SAFETY_CAP = { immediate: 380, same_day: 560 } as const;

  function displayed(answers: Record<string, string>): number {
    const intake = scoreIntake(answers);
    // Stand-in for the engine score; the cap is what is under test.
    const engineScore = 833;
    const urgency = intake.safety.urgency;
    return urgency === "none" ? engineScore : Math.min(engineScore, SAFETY_CAP[urgency]);
  }

  it("leaves the score alone with no disclosure", () => {
    expect(displayed(allMild())).toBe(833);
  });

  it("caps hard on an immediate-urgency disclosure", () => {
    const score = displayed({ ...allMild(), "9": "Nearly every day" });
    expect(score).toBe(380);
    // Well below any band that would read as reassuring.
    expect(score).toBeLessThan(600);
  });

  it("caps on a same-day disclosure", () => {
    expect(displayed({ ...allMild(), "9": "Several days" })).toBe(560);
  });

  it("only ever lowers the score", () => {
    const withDisclosure = displayed({ ...allMild(), "9": "Nearly every day" });
    const without = displayed(allMild());
    expect(withDisclosure).toBeLessThanOrEqual(without);
  });
});
