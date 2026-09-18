import { describe, expect, it } from "vitest";
import { applyPreset, defaultMacro, macroNarrative, macroPath, M2_PRESETS } from "@shared/macroEngine";

describe("macro engine", () => {
  it("with every toggle off the path is flat: baseline CPI, no boosts, base rate, start tax", () => {
    const a = defaultMacro(2026);
    const p = macroPath(10, a);
    expect(p).toHaveLength(10);
    expect(p.every((y) => y.cpiPct === a.baselineCpiPct)).toBe(true);
    expect(p.every((y) => y.realEstateBoostPct === 0 && y.equityBoostPct === 0 && y.cryptoBoostPct === 0)).toBe(true);
    expect(p.every((y) => y.mortgageRatePct === a.credit.baseMortgageRatePct && y.creditAvailability === 1)).toBe(true);
    expect(p.every((y) => y.effectiveTaxRatePct === a.futureTaxation.startEffectiveRatePct)).toBe(true);
    expect(p[9].calendarYear).toBe(2035);
    expect(p[9].priceLevel).toBeCloseTo(1.025 ** 10, 3);
  });

  it("money printing raises consumer prices after the lag and hard-asset boosts scale with the excess", () => {
    let a = applyPreset(defaultMacro(2026), "print-2020-2021");
    a = { ...a, moneyPrinting: { ...a.moneyPrinting, enabled: true }, hardAssets: { ...a.hardAssets, enabled: true } };
    const p = macroPath(5, a);
    // Year 1 has no lagged excess yet; year 2 onward does.
    expect(p[0].cpiPct).toBe(a.baselineCpiPct);
    expect(p[1].cpiPct).toBeGreaterThan(a.baselineCpiPct);
    const excess = M2_PRESETS["print-2020-2021"].m2GrowthPct - a.moneyPrinting.trendM2GrowthPct;
    expect(p[1].cpiPct).toBeCloseTo(a.baselineCpiPct + a.moneyPrinting.passThrough * excess, 2);
    expect(p[0].realEstateBoostPct).toBeCloseTo(a.hardAssets.betaRealEstate * excess, 2);
    expect(p[0].cryptoBoostPct).toBeGreaterThan(p[0].equityBoostPct);
    expect(p[0].equityBoostPct).toBeGreaterThan(p[0].realEstateBoostPct);
  });

  it("tightening lowers boosts below zero and raises the mortgage rate; printing lowers it and widens availability", () => {
    const base = defaultMacro(2026);
    const tight = macroPath(3, { ...applyPreset(base, "tightening-2022-2023"), moneyPrinting: { ...base.moneyPrinting, enabled: true, preset: "tightening-2022-2023", m2GrowthPct: -2 }, hardAssets: { ...base.hardAssets, enabled: true }, credit: { ...base.credit, enabled: true } });
    const loose = macroPath(3, { ...base, moneyPrinting: { ...base.moneyPrinting, enabled: true, m2GrowthPct: 18 }, hardAssets: { ...base.hardAssets, enabled: true }, credit: { ...base.credit, enabled: true } });
    expect(tight[0].realEstateBoostPct).toBeLessThan(0);
    expect(tight[0].mortgageRatePct).toBeGreaterThan(base.credit.baseMortgageRatePct);
    expect(loose[0].mortgageRatePct).toBeLessThan(base.credit.baseMortgageRatePct);
    expect(loose[0].creditAvailability).toBeGreaterThan(1);
    expect(tight[0].creditAvailability).toBeLessThan(1);
  });

  it("future taxation drifts linearly and respects the cap", () => {
    const a = { ...defaultMacro(2026), futureTaxation: { enabled: true, startEffectiveRatePct: 30, driftPctPointsPerYear: 1, capPct: 35 } };
    const p = macroPath(10, a);
    expect(p[0].effectiveTaxRatePct).toBe(30);
    expect(p[4].effectiveTaxRatePct).toBe(34);
    expect(p[9].effectiveTaxRatePct).toBe(35);
  });

  it("a shock sampler perturbs M2 growth by the stated volatility and the narrative names every toggle", () => {
    const a = { ...defaultMacro(2026), moneyPrinting: { ...defaultMacro().moneyPrinting, enabled: true, m2GrowthPct: 7, m2VolPct: 2 }, hardAssets: { ...defaultMacro().hardAssets, enabled: true }, credit: { ...defaultMacro().credit, enabled: true }, futureTaxation: { ...defaultMacro().futureTaxation, enabled: true } };
    const p = macroPath(2, a, () => 1.5);
    expect(p[0].m2GrowthPct).toBeCloseTo(10, 2);
    const lines = macroNarrative(a, p);
    expect(lines.join(" ")).toMatch(/Money printing ON/);
    expect(lines.join(" ")).toMatch(/Hard-asset inflation ON/);
    expect(lines.join(" ")).toMatch(/Loan availability ON/);
    expect(lines.join(" ")).toMatch(/Future taxation ON/);
  });
});
