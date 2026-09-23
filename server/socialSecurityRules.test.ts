import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { TAX_RULES_2025, TAX_RULES_2026, currentRules } from "@shared/taxRules";

describe("socialSecurity block on the rule sets", () => {
  it("pins the 2025 figures to the SSA 2025 COLA fact sheet", () => {
    expect(TAX_RULES_2025.socialSecurity).toMatchObject({ wageBase: 176_100, cola: 0.025, quarterOfCoverage: 1_810, earningsTestUnderFra: 23_400, earningsTestFraYear: 62_160, maxBenefitAtFraMonthly: 4_018 });
    expect(TAX_RULES_2025.socialSecurity.source).toMatch(/colafacts2025/);
  });
  it("pins the 2026 figures to the SSA 2026 COLA fact sheet and OACT base", () => {
    expect(TAX_RULES_2026.socialSecurity).toMatchObject({ wageBase: 184_500, cola: 0.028, quarterOfCoverage: 1_890, earningsTestUnderFra: 24_480, earningsTestFraYear: 65_160, maxBenefitAtFraMonthly: 4_152 });
    expect(TAX_RULES_2026.socialSecurity.source).toMatch(/factsheets\/2026/);
  });
  it("statutory rates are the same in both years", () => {
    for (const r of [TAX_RULES_2025, TAX_RULES_2026]) {
      expect(r.socialSecurity.oasdiRate).toBe(0.062);
      expect(r.socialSecurity.hiRate).toBe(0.0145);
      expect(r.socialSecurity.additionalMedicareRate).toBe(0.009);
      expect(r.socialSecurity.additionalMedicareThreshold).toEqual({ single: 200_000, hoh: 200_000, joint: 250_000, separate: 125_000 });
    }
  });
  it("the FICA step no longer carries a wage-base literal", () => {
    const src = readFileSync(new URL("../shared/advancedAnalytics.ts", import.meta.url), "utf8");
    expect(src).not.toMatch(/168600|168_600|176100|184500/);
    expect(src).toMatch(/currentRules\(\)\.socialSecurity/);
  });
  it("currentRules() for 2026 carries the 2026 base", () => {
    expect(currentRules(new Date("2026-09-22")).socialSecurity.wageBase).toBe(184_500);
    expect(currentRules(new Date("2025-03-01")).socialSecurity.wageBase).toBe(176_100);
  });
});
