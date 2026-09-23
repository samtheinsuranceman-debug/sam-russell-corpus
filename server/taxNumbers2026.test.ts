import { describe, it, expect } from "vitest";
import { IRMAA_2026, PART_B_STANDARD_MONTHLY_2026, irmaaTier, irmaaAnnualSurchargePerPerson } from "../shared/irmaa";
import { calculateTax, federalMarginalRateFor, getStateTaxRate, getStateCodes } from "../shared/taxBracketEngine";
import { getStateList } from "../shared/advancedAnalytics";
import { TAX_RULES_2026, federalTax } from "../shared/taxRules";
import { getDefaultMultiPropertyInput, runMultiPropertyMyga } from "../shared/multiPropertyMyga";

// Figures checked 2026-09-23:
// - IRS 2026 inflation adjustments (Rev. Proc. 2025-32 as amended by OBBBA)
// - SSA POMS HI 01101.031, 2026 IRMAA tables (2024 MAGI)
// - Tax Foundation, State Individual Income Tax Rates and Brackets, as of January 1, 2026

describe("2026 federal brackets", () => {
  it("joint table is 24,800 / 100,800 / 211,400 / 403,550 / 512,450 / 768,700", () => {
    expect(TAX_RULES_2026.brackets.joint.map((b) => b.upTo)).toEqual([24_800, 100_800, 211_400, 403_550, 512_450, 768_700, null]);
    expect(TAX_RULES_2026.brackets.joint.map((b) => b.rate)).toEqual([0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37]);
  });

  it("single table is 12,400 / 50,400 / 105,700 / 201,775 / 256,225 / 640,600", () => {
    expect(TAX_RULES_2026.brackets.single.map((b) => b.upTo)).toEqual([12_400, 50_400, 105_700, 201_775, 256_225, 640_600, null]);
  });

  it("a $250,000 married-filing-jointly household is in the 24% bracket, not 32%", () => {
    expect(calculateTax(250_000, "joint").federalMarginalRate).toBe(0.24);
    expect(federalMarginalRateFor(250_000, "Married Filing Jointly")).toBe(0.24);
    expect(federalMarginalRateFor(250_000, "married")).toBe(0.24);
    expect(federalTax(250_000 - 32_200, "joint", TAX_RULES_2026).marginalRate).toBe(0.24);
  });

  it("the same $250,000 filed single is 32%", () => {
    expect(federalMarginalRateFor(250_000, "single")).toBe(0.32);
  });

  it("the multi-property MYGA default household ($250k, married) defaults to 24%", () => {
    const input = getDefaultMultiPropertyInput();
    expect(input.household.filingStatus).toBe("married");
    expect(input.household.annualIncome).toBe(250_000);
    expect(input.household.federalTaxRate).toBe(24);
  });
});

describe("2026 IRMAA (2024 MAGI)", () => {
  it("standard Part B premium is $202.90", () => {
    expect(PART_B_STANDARD_MONTHLY_2026).toBe(202.9);
  });

  it("joint and single tables match SSA POMS HI 01101.031", () => {
    expect(IRMAA_2026.married.map((t) => t.maxMagi)).toEqual([218_000, 274_000, 342_000, 410_000, 750_000, Infinity]);
    expect(IRMAA_2026.single.map((t) => t.maxMagi)).toEqual([109_000, 137_000, 171_000, 205_000, 500_000, Infinity]);
    expect(IRMAA_2026.married.map((t) => t.partBMonthly)).toEqual([0, 81.2, 202.9, 324.6, 446.3, 487.0]);
    expect(IRMAA_2026.married.map((t) => t.partDMonthly)).toEqual([0, 14.5, 37.5, 60.4, 83.3, 91.0]);
    expect(IRMAA_2026.single.map((t) => t.partBMonthly)).toEqual(IRMAA_2026.married.map((t) => t.partBMonthly));
  });

  it("$500,000 joint MAGI lands in tier 5", () => {
    const t = irmaaTier(500_000, "married");
    expect(t.tier).toBe(5);
    expect(t.partBMonthly).toBe(446.3);
    expect(t.partDMonthly).toBe(83.3);
  });

  it("tier edges: <= for tiers 1-4, < for tier 5", () => {
    expect(irmaaTier(218_000, "married").tier).toBe(1);
    expect(irmaaTier(218_001, "married").tier).toBe(2);
    expect(irmaaTier(410_000, "married").tier).toBe(4);
    expect(irmaaTier(749_999, "married").tier).toBe(5);
    expect(irmaaTier(750_000, "married").tier).toBe(6);
    expect(irmaaTier(109_000, "single").tier).toBe(1);
    expect(irmaaTier(499_999, "single").tier).toBe(5);
    expect(irmaaTier(500_000, "single").tier).toBe(6);
  });

  it("annual per-person surcharge at tier 6 is (487 + 91) x 12", () => {
    expect(irmaaAnnualSurchargePerPerson(1_000_000, "married")).toBeCloseTo((487 + 91) * 12, 2);
    expect(irmaaAnnualSurchargePerPerson(200_000, "married")).toBe(0);
  });

  it("the multi-property engine prices IRMAA from the 2026 table", () => {
    const input = getDefaultMultiPropertyInput();
    input.household.annualIncome = 500_000;
    input.projectionYears = 1;
    const r = runMultiPropertyMyga(input);
    const y1 = r.summary.irmaaImpact[0]!;
    expect(y1.tier).toBe("Tier 5");
    expect(y1.partBSurcharge).toBeCloseTo(446.3 * 12, 2);
    expect(y1.partDSurcharge).toBeCloseTo(83.3 * 12, 2);
  });
});

describe("2026 state top rates (Tax Foundation, as of January 1, 2026)", () => {
  const expected: Record<string, number> = {
    AL: 0.05, AK: 0, AZ: 0.025, AR: 0.039, CA: 0.133, CO: 0.044, CT: 0.0699,
    DE: 0.066, FL: 0, GA: 0.0519, HI: 0.11, ID: 0.053, IL: 0.0495, IN: 0.0295,
    IA: 0.038, KS: 0.0558, KY: 0.035, LA: 0.03, ME: 0.0715, MD: 0.065,
    MA: 0.09, MI: 0.0425, MN: 0.0985, MS: 0.04, MO: 0.047, MT: 0.0565,
    NE: 0.0455, NV: 0, NH: 0, NJ: 0.1075, NM: 0.059, NY: 0.109, NC: 0.0399,
    ND: 0.025, OH: 0.0275, OK: 0.045, OR: 0.099, PA: 0.0307, RI: 0.0599,
    SC: 0.06, SD: 0, TN: 0, TX: 0, UT: 0.045, VT: 0.0875, VA: 0.0575,
    WA: 0, WV: 0.0482, WI: 0.0765, WY: 0, DC: 0.1075,
  };

  it("covers all 50 states and DC", () => {
    expect(getStateCodes()).toHaveLength(51);
    expect(getStateCodes().sort()).toEqual(Object.keys(expected).sort());
  });

  it("every state matches the 2026 table", () => {
    for (const [code, rate] of Object.entries(expected)) expect(getStateTaxRate(code), code).toBe(rate);
  });

  it("the tax waterfall's state list reads the same table", () => {
    const list = getStateList();
    expect(list).toHaveLength(51);
    for (const s of list) expect(s.rate, s.code).toBe(expected[s.code]);
  });
});
