import { describe, it, expect } from "vitest";
import { calculateCrisisScore, TIER_INFO } from "./crisisScoring";
import type { CrisisInput } from "./crisisScoring";

describe("Crisis Scoring Algorithm", () => {
  it("scores a critical-tier case (elderly, behind on bills, 3 pressures)", () => {
    const input: CrisisInput = {
      weaknesses: ["financial", "volitional", "emotional"],
      strengths: ["strategic", "analytical"],
      age: 75,
      financialStatus: "behind_on_bills",
      pressureSources: ["landlord", "ex-partner", "creditor"],
      worstCaseFear: "eviction",
    };
    const result = calculateCrisisScore(input);
    expect(result.tier).toBe("CRITICAL");
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.interventionWindow).toBe("7 days");
  });

  it("scores a stable-tier case (young, saving, no pressures)", () => {
    const input: CrisisInput = {
      weaknesses: ["spatial", "musical"],
      strengths: ["verbal", "linguistic", "humor", "persuasion"],
      age: 28,
      financialStatus: "some_extra_money",
      pressureSources: [],
    };
    const result = calculateCrisisScore(input);
    expect(result.tier).toBe("STABLE");
    expect(result.score).toBeLessThan(14);
    expect(result.interventionWindow).toBe("60 days");
  });

  it("applies age vulnerability for elderly (70+)", () => {
    const base: CrisisInput = {
      weaknesses: ["somatic", "logical"],
      strengths: ["attachment", "volitional"],
      financialStatus: "living_paycheck_to_paycheck",
      pressureSources: ["sibling"],
    };
    const elderly = calculateCrisisScore({ ...base, age: 75 });
    const middle = calculateCrisisScore({ ...base, age: 42 });
    expect(elderly.score).toBeGreaterThan(middle.score);
  });

  it("applies age vulnerability for adolescents (15-19)", () => {
    const base: CrisisInput = {
      weaknesses: ["financial", "numerical"],
      strengths: ["creative"],
      financialStatus: "volatile_cash_flow",
      pressureSources: ["sibling", "creditor"],
    };
    const teen = calculateCrisisScore({ ...base, age: 17 });
    const adult = calculateCrisisScore({ ...base, age: 35 });
    expect(teen.score).toBeGreaterThan(adult.score);
  });

  it("generates delay flags for recent life events", () => {
    const input: CrisisInput = {
      weaknesses: ["emotional", "interpersonal"],
      strengths: ["analytical"],
      recentLifeEvents: ["bereavement", "job_loss"],
    };
    const result = calculateCrisisScore(input);
    expect(result.delayFlags.length).toBe(2);
    expect(result.delayFlags[0]).toContain("bereavement");
    expect(result.delayFlags[1]).toContain("job loss");
  });

  it("selects body regulation protocol for somatic weakness", () => {
    const input: CrisisInput = {
      weaknesses: ["somatic", "interoceptive", "emotional"],
      strengths: ["strategic", "analytical"],
    };
    const result = calculateCrisisScore(input);
    expect(result.recommendedProtocol).toContain("body regulation");
  });

  it("selects survival protocol for financial + volitional weakness", () => {
    const input: CrisisInput = {
      weaknesses: ["financial", "volitional", "numerical"],
      strengths: ["interpersonal", "community"],
    };
    const result = calculateCrisisScore(input);
    expect(result.recommendedProtocol).toContain("sleep, food, transport");
  });

  it("provides a strength lever recommendation", () => {
    const input: CrisisInput = {
      weaknesses: ["financial", "emotional"],
      strengths: ["strategic", "analytical", "numerical"],
    };
    const result = calculateCrisisScore(input);
    expect(result.strengthLever).not.toBeNull();
    expect(result.strengthLever!.use).toBe("strategic");
    expect(result.strengthLever!.toSupport).toBe("financial");
  });

  it("caps score at 50", () => {
    const input: CrisisInput = {
      weaknesses: ["financial", "volitional", "emotional", "intrapersonal", "somatic"],
      strengths: ["humor"],
      age: 75,
      financialStatus: "behind_on_bills",
      pressureSources: ["landlord", "ex-partner", "creditor"],
      worstCaseFear: "eviction",
      recentLifeEvents: ["bereavement", "job_loss"],
    };
    const result = calculateCrisisScore(input);
    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.tier).toBe("CRITICAL");
  });

  it("handles minimal input gracefully", () => {
    const input: CrisisInput = {
      weaknesses: ["spatial"],
      strengths: ["verbal"],
    };
    const result = calculateCrisisScore(input);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.tier).toBe("STABLE");
    expect(result.topRisks.length).toBe(0);
    expect(result.delayFlags.length).toBe(0);
  });

  it("TIER_INFO has all required tiers with colors", () => {
    expect(TIER_INFO.CRITICAL.color).toBe("#EF4444");
    expect(TIER_INFO.HIGH.color).toBe("#F59E0B");
    expect(TIER_INFO.MODERATE.color).toBe("#E0C68C");
    expect(TIER_INFO.STABLE.color).toBe("#22C55E");
  });

  it("isolation penalty applies for single people with no pressures", () => {
    const single = calculateCrisisScore({
      weaknesses: ["emotional"],
      strengths: ["analytical"],
      pressureSources: [],
      familyStructure: "single",
    });
    const partnered = calculateCrisisScore({
      weaknesses: ["emotional"],
      strengths: ["analytical"],
      pressureSources: [],
      familyStructure: "married",
    });
    expect(single.score).toBeGreaterThan(partnered.score);
  });
});
