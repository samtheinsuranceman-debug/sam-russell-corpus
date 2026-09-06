// ============================================================
// The tax optimisation schedule: the catalogue's citations, the map from the
// site's hundred combinations to families, the year loop's ordering and
// caps, the goal switches, and the panel seeds.
// ============================================================
import { describe, expect, it } from "vitest";
import { FAMILIES, FAMILY_BY_ID, familiesForTitle } from "@shared/taxStrategies";
import { buildSchedule, type ClientTaxProfile } from "@shared/taxSchedule";
import { TAX_CLAIM_SEEDS, TAX_SOURCES } from "./taxSources";
import combos from "../client/src/data/strategies.json";

const surgeon: ClientTaxProfile = {
  filing: "joint", state: "WV", age: 48, spouseAge: 46, children: 2, childrenUnder18: 2,
  w2Income: 0, practiceIncome: 900_000, otherIncome: 20_000, incomeGrowth: 0.03, entity: "s_corp",
  hasHdhp: true, employerPlanDeferralRoom: 0, ownsPractice: true,
  homeEquity: 900_000, mortgageRate: 0.055, rentalProperties: 1, canRunShortTermRental: true,
  taxableInvestments: 1_500_000, unrealizedGains: 600_000, plannedSaleGain: 1_200_000, saleYear: 2028,
  pretaxRetirement: 1_800_000, rothBalances: 200_000, cashValueLife: 0,
  charitableIntentPerYear: 30_000, liquidityReserveMonths: 9, riskCapacity: "high", netWorth: 7_000_000,
  goals: ["lower_this_year", "tax_free_retirement", "real_estate", "estate", "charity"], years: 10, targetBracket: 0.24,
};

describe("the catalogue", () => {
  it("cites every parameter and marks the unverified ones", () => {
    expect(FAMILIES.length).toBeGreaterThanOrEqual(25);
    for (const f of FAMILIES) {
      expect(f.statute.length).toBeGreaterThan(5); expect(f.citations.length).toBeGreaterThan(0);
      for (const [k, p] of Object.entries(f.params)) { expect(p.source.length, `${f.id}.${k}`).toBeGreaterThan(5); expect(typeof p.verified).toBe("boolean"); }
    }
    expect(FAMILY_BY_ID.oil_gas_idc!.params.idcShareOfInvestment!.verified).toBe(false); // an industry range, not an IRS figure
    expect(FAMILY_BY_ID.qcd!.params.limit!.verified).toBe(false);
    expect(FAMILY_BY_ID.bonus_depreciation!.params.s179Limit!.value).toBe(2_560_000);
    expect(FAMILY_BY_ID.captive_831b!.params.premiumLimit2026!.value).toBe(2_900_000);
    expect(FAMILY_BY_ID.retirement_max!.params.deferral!.value).toBe(24_500);
    expect(FAMILY_BY_ID.excess_business_loss!.params.joint2026!.value).toBe(512_000);
    expect(FAMILY_BY_ID.qsbs!.params.perIssuerCap!.value).toBe(15_000_000);
  });
  it("maps every one of the site's hundred combinations to at least one family", () => {
    const list = combos as Array<{ id: number; title: string }>;
    expect(list.length).toBe(100);
    const unmapped = list.filter((c) => familiesForTitle(c.title).length === 0);
    expect(unmapped.map((c) => c.title)).toEqual([]);
    expect(familiesForTitle("The IUL-HELOC Velocity Vortex").map((f) => f.id)).toContain("iul_recycling");
    expect(familiesForTitle("The Roth Conversion Cost Segregation Loop").map((f) => f.id)).toEqual(expect.arrayContaining(["roth_conversion", "bonus_depreciation"]));
  });
});

describe("the schedule", () => {
  const s = buildSchedule(surgeon, new Date("2026-09-06"));
  it("runs the years in order: plan first, engines to the headroom under the target bracket, Roth last, structure once", () => {
    expect(s.years.length).toBe(10);
    const y0 = s.years[0]!;
    const ids = y0.steps.map((x) => x.familyId);
    expect(ids[0]).toBe("retirement_max");
    expect(ids.indexOf("oil_gas_idc")).toBeGreaterThan(ids.indexOf("retirement_max"));
    expect(ids.indexOf("roth_conversion") === -1 || ids.indexOf("roth_conversion") > ids.indexOf("oil_gas_idc")).toBe(true);
    for (const st of y0.steps) { expect(st.statute.length).toBeGreaterThan(3); expect(st.reason.length).toBeGreaterThan(20); expect(st.confidence).toBeGreaterThan(0); expect(st.confidence).toBeLessThanOrEqual(1); }
    expect(y0.plannedTax).toBeLessThan(y0.baselineTax);
    expect(s.totals.saved).toBeGreaterThan(0);
  });
  it("caps the deduction engines by risk capacity and the §461(l) limit", () => {
    const og = s.years[0]!.steps.find((x) => x.familyId === "oil_gas_idc");
    expect(og).toBeDefined();
    expect(og!.amount).toBeLessThanOrEqual(surgeon.practiceIncome * 0.2 + 1); // 20% of income at high risk capacity
    const low = buildSchedule({ ...surgeon, riskCapacity: "low" }, new Date("2026-09-06"));
    expect(low.years[0]!.steps.some((x) => x.familyId === "oil_gas_idc")).toBe(false);
    const deductions = s.years[0]!.steps.filter((x) => ["oil_gas_idc", "str_loophole"].includes(x.familyId)).reduce((a, x) => a + (x.familyId === "oil_gas_idc" ? x.amount * 0.8 : x.amount), 0);
    expect(deductions).toBeLessThanOrEqual(512_000 + 1);
  });
  it("uses once-only structures once and repeats the annual ones every year at amounts that move with income", () => {
    const captiveYears = s.years.filter((y) => y.steps.some((x) => x.familyId === "captive_831b")).map((y) => y.year);
    expect(captiveYears.length).toBeLessThanOrEqual(1);
    const idgtYears = s.years.filter((y) => y.steps.some((x) => x.familyId === "idgt")).length;
    expect(idgtYears).toBeLessThanOrEqual(1);
    const rm = s.years.map((y) => y.steps.find((x) => x.familyId === "retirement_max")?.amount ?? 0);
    expect(rm.every((a) => a > 0)).toBe(true);
    const og = s.years.map((y) => y.steps.find((x) => x.familyId === "oil_gas_idc")?.amount ?? 0);
    expect(new Set(og.filter(Boolean)).size).toBeGreaterThan(1); // different amounts in different years
  });
  it("routes the sale year by goal and switches the objective for 'zero federal tax this year'", () => {
    const sale = s.years.find((y) => y.year === 2028)!;
    expect(sale.steps.some((x) => x.familyId === "like_kind")).toBe(true); // real_estate goal → 1031
    const charity = buildSchedule({ ...surgeon, goals: ["charity", "capital_gain_event"] }, new Date("2026-09-06")).years.find((y) => y.year === 2028)!;
    expect(charity.steps.some((x) => x.familyId === "crt")).toBe(true);
    const oz = buildSchedule({ ...surgeon, goals: ["capital_gain_event"] }, new Date("2026-09-06")).years.find((y) => y.year === 2028)!;
    expect(oz.steps.some((x) => x.familyId === "opportunity_zone")).toBe(true);
    const base = buildSchedule({ ...surgeon, goals: ["lower_this_year", "real_estate", "charity"] }, new Date("2026-09-06")).years[0]!;
    const z0 = buildSchedule({ ...surgeon, goals: ["zero_federal_this_year", "real_estate", "charity"] }, new Date("2026-09-06")).years[0]!;
    const og = (y: typeof base) => y.steps.find((x) => x.familyId === "oil_gas_idc")?.amount ?? 0;
    expect(og(z0)).toBeGreaterThanOrEqual(og(base)); // the zero objective fills the engine further, within the same caps
    expect(z0.taxableIncomeAfter).toBeLessThanOrEqual(base.taxableIncomeAfter + 1);
    expect(z0.notes.length === 0 || /could not be taken to zero/.test(z0.notes[0]!)).toBe(true);
  });
  it("prints its assumptions", () => {
    expect(s.assumptions.some((a) => /Federal only/.test(a))).toBe(true);
    expect(s.assumptions.some((a) => /461\(l\)/.test(a))).toBe(true);
  });
});

describe("the tax authority panel", () => {
  it("has 5–15 authorities and cited, dated seeds that name a known source", () => {
    expect(TAX_SOURCES.length).toBeGreaterThanOrEqual(5); expect(TAX_SOURCES.length).toBeLessThanOrEqual(15);
    const ids = new Set(TAX_SOURCES.map((s) => s.id));
    for (const c of TAX_CLAIM_SEEDS) { expect(ids.has(c.sourceId), c.sourceId).toBe(true); expect(c.citation!.length).toBeGreaterThan(10); expect(c.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
    expect(TAX_CLAIM_SEEDS.find((c) => c.metric === "s831b_premium_limit_usd")!.value).toBe("2900000");
    expect(TAX_SOURCES.find((s) => s.id === "tax-irc")!.defaults.evidence).toBe(1);
  });
});
