import { describe, expect, it } from "vitest";
import { optimizeMultiCurrency, type MultiCurrencyInput } from "../shared/multiCurrencyWealthEngine";

const base: MultiCurrencyInput = {
  baseCurrency: "USD",
  assets: [
    { currency: "USD", amount: 500_000, assetType: "equity", annualReturn: 0.06, taxRate: 0.2 },
    { currency: "EUR", amount: 300_000, assetType: "equity", annualReturn: 0.05, taxRate: 0.2 },
  ],
  currencyPairs: [{ from: "EUR", to: "USD", exchangeRate: 1.08, volatility: 0.08, correlation: 0.6 }],
  projectionYears: 10,
  rebalanceFrequency: "annually",
  hedgingCostPercent: 0.005,
};

describe("multi-currency engine: FX drift is a stated, visitor-set assumption", () => {
  it("is deterministic (no random draws)", () => {
    expect(optimizeMultiCurrency(base)).toEqual(optimizeMultiCurrency(base));
  });

  it("defaults to flat rates, labelled as an assumption", () => {
    const r = optimizeMultiCurrency(base);
    expect(r.projections.every((p) => p.currencyGainLoss === 0)).toBe(true);
    expect(r.fxAssumption.driftPerYear).toBe(0);
    expect(r.fxAssumption.label).toMatch(/^Assumption:/);
  });

  it("a set drift flows into currency gain/loss and the hedged vs unhedged comparison", () => {
    const up = optimizeMultiCurrency({ ...base, assumedFxDriftPerYear: 0.02 });
    const down = optimizeMultiCurrency({ ...base, assumedFxDriftPerYear: -0.02 });
    const last = (r: typeof up) => r.projections[r.projections.length - 1]!;
    expect(last(up).currencyGainLoss).toBeGreaterThan(0);
    expect(last(down).currencyGainLoss).toBeLessThan(0);
    expect(last(up).unhedgedValue).toBeGreaterThan(last(up).hedgedValue);
    expect(last(down).hedgedValue).toBeGreaterThan(last(down).unhedgedValue);
    // EUR sleeve: 300k × 1.08 × 1.05^10 × (1.02^10 − 1)
    const eur = 300_000 * 1.08 * Math.pow(1.05, 10);
    expect(last(up).currencyGainLoss).toBe(Math.round(eur * (Math.pow(1.02, 10) - 1)));
    expect(up.fxAssumption.label).toContain("2.00 %");
  });

  it("a per-pair drift overrides the default, and absurd values are clamped", () => {
    const r = optimizeMultiCurrency({ ...base, assumedFxDriftPerYear: 0.02, currencyPairs: [{ ...base.currencyPairs[0]!, assumedDriftPerYear: 0 }] });
    expect(r.projections.every((p) => p.currencyGainLoss === 0)).toBe(true);
    expect(r.fxAssumption.perPair).toEqual({ EUR: 0 });
    expect(optimizeMultiCurrency({ ...base, assumedFxDriftPerYear: 5 }).fxAssumption.driftPerYear).toBe(0.5);
  });
});
