import { describe, expect, it } from "vitest";
import { ASSET_CLASSES, FEDERAL_ESTATE_EXCLUSION, FOLLOW_UP, PARTNER_COPY, assetClass, exclusionFor, inheritanceReport, taxableShareOf, type InheritanceItem, type ReportContext } from "@shared/inheritanceEngine";
import type { TrajectoryPoint } from "@shared/erosion";

const traj = (mult: number[]): TrajectoryPoint[] => [5, 10, 15, 20, 25, 30, 35, 40].map((h, i) => ({ horizonYears: h, year: 2026 + h, history: {} as never, consensus: {} as never, pHigher: 0.5 + i * 0.02, expectedChangePoints: 0, expectedTopRate: 37, burdenMultiplier: mult[i] ?? mult[mult.length - 1]!, confidence: 0.5, weightOnHistory: 0.5, power: null }));

const ctx: ReportContext = { thisYear: 2026, marginalRate: 0.35, stateRate: 0.05, cpi: { id: "all", label: "All items", asOf: "2026-07-01", rates: { 1: 0.03, 2: 0.03, 5: 0.03, 10: 0.03, 15: 0.03, 20: 0.03, 25: 0.03, 30: 0.03, 35: 0.03, 40: 0.03 } }, trajectory: traj([1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8]), benefactorEstate: 16_000_000 };
const items: InheritanceItem[] = [
  { id: "a", label: "Dad's IRA", assetClass: "traditional_ira", amount: 1_000_000, expectedYear: 2036, from: "Parent", likelihood: 4 },
  { id: "b", label: "Brokerage", assetClass: "brokerage", amount: 500_000, expectedYear: 2036, from: "Parent", likelihood: 4 },
  { id: "c", label: "Policy", assetClass: "life_insurance", amount: 250_000, expectedYear: 2031, from: "Parent", likelihood: 5 },
  { id: "d", label: "Annuity", assetClass: "annuity", amount: 200_000, expectedYear: 2036, from: "Parent", likelihood: 3 },
];

describe("asset classes", () => {
  it("every class carries an authority on law.cornell.edu and a one-line summary", () => {
    expect(ASSET_CLASSES.length).toBeGreaterThanOrEqual(12);
    for (const c of ASSET_CLASSES) { expect(c.authority.url).toMatch(/^https:\/\/www\.law\.cornell\.edu\/uscode\/text\/26\//); expect(c.summary.length).toBeGreaterThan(30); }
    expect(new Set(ASSET_CLASSES.map((c) => c.id)).size).toBe(ASSET_CLASSES.length);
    expect(assetClass("traditional_ira")?.taxability).toBe("ordinary");
    expect(assetClass("life_insurance")?.taxability).toBe("tax_free");
    expect(assetClass("brokerage")?.taxability).toBe("step_up");
  });
  it("the federal exclusion table is the IRS's, through 2026, and later years fall back to 2026 flagged as extrapolated", () => {
    expect(FEDERAL_ESTATE_EXCLUSION.find((e) => e.year === 2025)?.amount).toBe(13_990_000);
    expect(FEDERAL_ESTATE_EXCLUSION.find((e) => e.year === 2026)?.amount).toBe(15_000_000);
    expect(exclusionFor(2036)).toEqual({ amount: 15_000_000, year: 2026, extrapolated: true });
    expect(exclusionFor(2019)).toEqual({ amount: 11_400_000, year: 2019, extrapolated: false });
  });
  it("sizes the taxable share by class; an annuity without its gain share is flagged, not guessed", () => {
    expect(taxableShareOf(items[0]!, assetClass("traditional_ira"))).toEqual({ share: 1, flag: null });
    expect(taxableShareOf(items[1]!, assetClass("brokerage")).share).toBe(0);
    const ann = taxableShareOf(items[3]!, assetClass("annuity"));
    expect(ann.share).toBe(0); expect(ann.flag).toMatch(/gain share not entered/);
    expect(taxableShareOf({ ...items[3]!, taxableSharePct: 40 }, assetClass("annuity"))).toEqual({ share: 0.4, flag: null });
  });
});

describe("the report", () => {
  it("taxes the IRA at today's rate, then at the horizon's burden, and discounts to today's dollars with the CPI ladder", () => {
    const r = inheritanceReport(items, ctx);
    const ira = r.items[0]!;
    expect(ira.yearsOut).toBe(10);
    expect(ira.taxNow).toBe(400_000);                     // 1,000,000 × (35% + 5%)
    expect(ira.burden).toBeCloseTo(1.2, 6);               // the 10-year point
    expect(ira.taxThen).toBe(480_000);
    expect(ira.afterTaxThen).toBe(520_000);
    expect(ira.power).toBeCloseTo(1 / 1.03 ** 10, 4);
    expect(Math.abs(ira.realAfterTax! - 520_000 / 1.03 ** 10)).toBeLessThan(60); // the engine's factor is rounded to four decimals
    expect(ira.pHigher).toBeCloseTo(0.52, 6);
    expect(ira.flags).toContain("must be withdrawn within ten years of the death");
    const brk = r.items[1]!;
    expect(brk.taxNow).toBe(0); expect(brk.taxThen).toBe(0); expect(brk.flags.join(" ")).toMatch(/basis resets/);
    const pol = r.items[2]!;
    expect(pol.taxThen).toBe(0); expect(pol.yearsOut).toBe(5); expect(pol.burden).toBeCloseTo(1.1, 6);
    expect(r.totals.nominal).toBe(1_950_000);
    expect(r.totals.taxThen).toBe(480_000);
    expect(r.totals.afterTaxThen).toBe(1_470_000);
    expect(r.totals.weighted).not.toBeNull();
    expect(r.estateCheck).toMatchObject({ estate: 16_000_000, exclusion: 15_000_000, exclusionYear: 2026, extrapolated: true, over: true });
    expect(r.assumptions.some((a) => a.includes("CPI-U ladder"))).toBe(true);
  });
  it("without a trajectory or CPI reading it says so and leaves the columns blank rather than guessing", () => {
    const r = inheritanceReport(items.slice(0, 1), { ...ctx, cpi: null, trajectory: [], benefactorEstate: null });
    const ira = r.items[0]!;
    expect(ira.burden).toBe(1); expect(ira.taxThen).toBe(ira.taxNow); expect(ira.pHigher).toBeNull(); expect(ira.realAfterTax).toBeNull();
    expect(r.totals.realAfterTax).toBeNull(); expect(r.estateCheck).toBeNull();
    expect(r.assumptions.join(" ")).toMatch(/No erosion trajectory/);
    expect(r.assumptions.join(" ")).toMatch(/No CPI reading/);
  });
  it("the tax then never exceeds the taxable amount, whatever the multiplier", () => {
    const r = inheritanceReport(items.slice(0, 1), { ...ctx, trajectory: traj([9, 9, 9, 9, 9, 9, 9, 9]) });
    expect(r.items[0]!.taxThen).toBe(1_000_000);
  });
});

describe("the follow-up and the partner copy", () => {
  it("offers three questions, three ways to test the waters and three irreversible moves, each move with its authority", () => {
    expect(FOLLOW_UP.questions).toHaveLength(3);
    expect(FOLLOW_UP.testTheWaters).toHaveLength(3);
    expect(FOLLOW_UP.reclaim).toHaveLength(3);
    for (const m of FOLLOW_UP.reclaim) expect(m.authority.url).toMatch(/^https:\/\//);
  });
  it("keeps the partner's saving figure off the page until the owner approves it, and carries the no-guarantee line", () => {
    expect(PARTNER_COPY.quote.approved).toBe(false);
    expect(PARTNER_COPY.disclaimer).toMatch(/no result is guaranteed/i);
    for (const p of PARTNER_COPY.partners) expect(p.url).toMatch(/^https:\/\//);
  });
});
