import { describe, expect, it } from "vitest";
import { computeLeadAnalysis } from "./leadStrategy";

describe("lead strategy engine (illustrative, advisor-only)", () => {
  it("computes assumption-based reference figures from the fact-finder", () => {
    const a = computeLeadAnalysis({
      w2Income: 500_000, estimatedTaxes: 185_000,
      spouseIncome: 100_000, spouseTaxes: 25_000,
      taxDeferredSelf: 800_000, taxDeferredSpouse: 200_000,
      liquidInvestments: 300_000, liquidTaxability: "taxable",
      homeEquity: 600_000,
      mortgageInterestOnlyMonthly: 4_000, mortgageYearsRemaining: 25,
    });
    // Roth base = tax-deferred (1,000,000) + taxable liquid (300,000).
    expect(a.advisorFigures.rothConversionBase).toBe(1_300_000);
    expect(a.advisorFigures.illustrativeRothTaxValue).toBe(Math.round(1_300_000 * 0.47));
    // Interest-only exposure = 4000*12*25.
    expect(a.advisorFigures.lifetimeInterestOnlyExposure).toBe(4_000 * 12 * 25);
    // Avoided years beyond the 7-year payoff window.
    expect(a.advisorFigures.illustrativeInterestPotentiallySaved).toBe(4_000 * 12 * (25 - 7));
    // Equity first step = 50% of 50% of equity.
    expect(a.advisorFigures.equityDeployedFirstStep).toBe(600_000 * 0.5 * 0.5);
    // Oil & gas fixed assumption.
    expect(a.advisorFigures.oilGasInvestmentAssumed).toBe(150_000);
    expect(a.advisorFigures.oilGasDeduction).toBe(Math.round(150_000 * 0.95));
    // Blended rate is between the floor and cap, drawn from stated taxes.
    expect(a.advisorFigures.blendedTaxRateUsed).toBeGreaterThanOrEqual(0.22);
    expect(a.advisorFigures.blendedTaxRateUsed).toBeLessThanOrEqual(0.5);
  });

  it("nontaxable liquid is excluded from the Roth base", () => {
    const a = computeLeadAnalysis({ taxDeferredSelf: 100_000, liquidInvestments: 500_000, liquidTaxability: "nontaxable" });
    expect(a.advisorFigures.rothConversionBase).toBe(100_000);
  });

  it("keeps the honest Roth caveat and never treats a conversion as tax-free", () => {
    const a = computeLeadAnalysis({ taxDeferredSelf: 100_000 });
    expect(a.rothCaveat.toLowerCase()).toContain("taxable in the year");
    expect(a.rothCaveat.toLowerCase()).toContain("not tax-free");
    expect(a.disclaimer.toLowerCase()).toContain("not a projection or guarantee");
  });

  it("the visitor-facing teaser carries the pillars but no dollar figures", () => {
    const a = computeLeadAnalysis({ w2Income: 400_000, taxDeferredSelf: 500_000, homeEquity: 300_000, mortgageInterestOnlyMonthly: 3_000, mortgageYearsRemaining: 20 });
    expect(a.teaser.pillars.length).toBe(5);
    expect(a.teaser.headline.toLowerCase()).toContain("divorce-proof");
    const teaserText = JSON.stringify(a.teaser);
    // No large dollar numbers leaked into the qualitative teaser.
    expect(teaserText).not.toMatch(/\d{4,}/);
  });

  it("is robust to an empty fact-finder", () => {
    const a = computeLeadAnalysis({});
    expect(a.advisorFigures.rothConversionBase).toBe(0);
    expect(a.advisorFigures.lifetimeInterestOnlyExposure).toBe(0);
    expect(a.advisorFigures.blendedTaxRateUsed).toBe(0.37);
  });
});
