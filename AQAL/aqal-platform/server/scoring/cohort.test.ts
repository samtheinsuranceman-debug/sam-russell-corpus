import { describe, it, expect } from "vitest";
import {
  generationForBirthYear,
  ageFromBirthYear,
  maturation,
  cohortScoreShift,
  cohortAdjustedScore,
  COHORT_ANCHOR_AGE,
  DEV_WEIGHT,
} from "@shared/cohort";
import { scoreToRarity } from "./norming";

describe("cohort norming — rarity within your generation", () => {
  it("maps birth years to the right generation", () => {
    expect(generationForBirthYear(2000)).toBe("Gen Z");
    expect(generationForBirthYear(1990)).toBe("Millennial");
    expect(generationForBirthYear(1970)).toBe("Gen X");
    expect(generationForBirthYear(1955)).toBe("Boomer");
    expect(generationForBirthYear(1940)).toBe("Silent");
    expect(generationForBirthYear(2015)).toBe("Gen Alpha");
  });

  it("maturation rises with age and stays in [0,1]", () => {
    expect(maturation(25)).toBeGreaterThan(maturation(18));
    expect(maturation(65)).toBeGreaterThan(maturation(25));
    expect(maturation(10)).toBe(0);
    expect(maturation(90)).toBe(1);
    for (const a of [18, 30, 45, 60, 75]) {
      expect(maturation(a)).toBeGreaterThanOrEqual(0);
      expect(maturation(a)).toBeLessThanOrEqual(1);
    }
  });

  it("age-normed 'measured' lines get NO cohort shift (already deviation-normed)", () => {
    // Logical is a "measured" CHC line → DEV_WEIGHT 0.
    expect(cohortScoreShift("Logical", 22)).toBe(0);
    expect(cohortScoreShift("Mathematical", 68)).toBe(0);
  });

  it("young high-scorers get RARER on developmental lines; elders less rare", () => {
    const score = 0.8;
    // Existential is an "altitude" (developmental) line → full weight.
    const young = cohortAdjustedScore(score, "Existential", 25);
    const anchor = cohortAdjustedScore(score, "Existential", COHORT_ANCHOR_AGE);
    const old = cohortAdjustedScore(score, "Existential", 68);

    expect(young).toBeGreaterThan(anchor); // 25yo effective score lifted
    expect(old).toBeLessThan(anchor); // 68yo effective score lowered
    expect(anchor).toBeCloseTo(score, 5); // anchor age ≈ no shift

    // …which translates to a rarer cohort rarity for the young high-scorer.
    expect(scoreToRarity(young)).toBeGreaterThan(scoreToRarity(old));
  });

  it("the shift is proportional to the mode's developmental weight", () => {
    const altitudeShift = Math.abs(cohortScoreShift("Existential", 25)); // weight 1.0
    const demoShift = Math.abs(cohortScoreShift("Strategic", 25)); // weight 0.5
    expect(altitudeShift).toBeGreaterThan(demoShift);
    expect(demoShift).toBeGreaterThan(0);
    expect(DEV_WEIGHT.altitude).toBeGreaterThan(DEV_WEIGHT.demonstrated);
  });

  it("clamps adjusted scores into [0,1]", () => {
    expect(cohortAdjustedScore(0.98, "Existential", 20)).toBeLessThanOrEqual(1);
    expect(cohortAdjustedScore(0.02, "Existential", 85)).toBeGreaterThanOrEqual(0);
  });

  it("ageFromBirthYear is non-negative", () => {
    expect(ageFromBirthYear(1998, 2026)).toBe(28);
    expect(ageFromBirthYear(2030, 2026)).toBe(0);
  });
});
