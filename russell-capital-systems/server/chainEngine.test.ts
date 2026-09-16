import { describe, expect, it } from "vitest";
import { buildWindows, CHAIN_CALCULATORS, chainCalculatorForPath, defaultChain, defaultProfile, modulesForStep, newStep, profileFromClientData, runChain, runChainMonteCarlo, startNetWorth } from "@shared/chainEngine";
import { applyPreset, defaultMacro } from "@shared/macroEngine";

describe("chain engine", () => {
  it("runs the default row and hands off between every consecutive step", () => {
    const steps = defaultChain();
    const res = runChain(defaultProfile(), steps);
    expect(res.steps).toHaveLength(4);
    expect(res.ultra.transfers).toHaveLength(3); // last step hands off to nobody
    for (let i = 0; i < 3; i++) {
      const t = res.ultra.transfers[i];
      expect(t.year).toBe(res.steps[i].endYear); // atYear null = last year of the step
      expect(t.amount).toBeGreaterThan(0);
    }
    expect(res.aggregate.years).toBe(30);
    expect(res.aggregate.sumOfStepContributions).toBe(res.aggregate.finalNetWorth - res.aggregate.startNetWorth);
    expect(res.disclosure).toMatch(/hypothetical/);
  });

  it("the hand-off moves exactly pct% of the named cash value at the named year", () => {
    const a = newStep("trust-iul", 6, "a");
    a.params = { trustIUL: { premiumAnnual: 50_000, premiumYears: 5, creditRatePct: 6, incomeStartYear: 99 } };
    a.handoff = { enabled: true, atYear: 4, pctOfCashValue: 25, target: null };
    const b = newStep("income-annuity", 4, "b");
    b.params = { incomeAnnuity: { premium: 0, startYear: 99, payoutRatePct: 6 } };
    const res = runChain(defaultProfile(), [a, b]);
    const t = res.ultra.transfers[0];
    expect(t.year).toBe(4);
    expect(t.from).toBe("iulCashValue");
    expect(t.to).toBe("incomeAnnuity");
    // Rebuild the pre-transfer cash value: row 4 shows the post-transfer balance, so amount = 25% of (row + amount).
    const row4 = res.steps[0].rows[3];
    expect(Math.abs(t.amount - 0.25 * (row4.iulCashValue + t.amount))).toBeLessThan(2);
    // The annuity then pays 6% of what it received, from the next step on.
    const firstB = res.steps[1].rows[0];
    expect(firstB.annuityIncome).toBeCloseTo(t.amount * 0.06, -1);
  });

  it("a step with hand-off disabled moves nothing; a zero percentage moves nothing", () => {
    const steps = defaultChain();
    steps[0].handoff.enabled = false;
    steps[1].handoff.pctOfCashValue = 0;
    const res = runChain(defaultProfile(), steps);
    // Step 3 (real estate) also has nothing to hand off: no property was ever bought because nothing arrived.
    expect(res.ultra.transfers).toHaveLength(0);
    expect(res.aggregate.totalHandedOff).toBe(0);
    // Give it a property and the third hand-off appears.
    steps[2].params = { ...steps[2].params, realEstate: { ...(steps[2].params?.realEstate ?? {}), rentalMode: "ltr" } };
    steps[1].handoff.pctOfCashValue = 30;
    const res2 = runChain(defaultProfile(), steps);
    expect(res2.ultra.transfers.map((t) => t.windowIndex)).toEqual([1, 2]);
  });

  it("modulesForStep turns on exactly the calculator's modules plus investment growth, with parameters applied", () => {
    const s = newStep("house-recycling", 10);
    s.params = { realEstate: { rentalMode: "str", strGrossReceiptsPctOfValue: 15 } };
    const m = modulesForStep(s);
    expect(m.investmentGrowth.enabled && m.mortgageKiller.enabled && m.realEstate.enabled).toBe(true);
    expect(m.trustIUL.enabled || m.incomeAnnuity.enabled || m.crypto.enabled || m.equityDeployment.enabled).toBe(false);
    expect(m.realEstate.strGrossReceiptsPctOfValue).toBe(15);
    // ZIP window rate overrides the appreciation assumption.
    s.zip = { zip: "28429", fromYear: 2000, toYear: 2025, appreciationPct: 4.2, rentGrowthPct: 3.1 };
    expect(modulesForStep(s).realEstate.appreciationPctDefault).toBe(4.2);
  });

  it("money printing with hard-asset inflation on raises final real-estate value and lowers real net worth vs nominal", () => {
    const steps = [newStep("real-estate-rentals", 15)];
    steps[0].params = { realEstate: { appreciationPctDefault: 3 } };
    const off = runChain(defaultProfile(), steps, defaultMacro(2026));
    let on = applyPreset(defaultMacro(2026), "print-2020-2021");
    on = { ...on, moneyPrinting: { ...on.moneyPrinting, enabled: true }, hardAssets: { ...on.hardAssets, enabled: true } };
    const res = runChain(defaultProfile(), steps, on);
    expect(res.aggregate.finalRealEstateValue).toBeGreaterThan(off.aggregate.finalRealEstateValue);
    expect(res.aggregate.priceLevel).toBeGreaterThan(off.aggregate.priceLevel);
    expect(res.aggregate.finalNetWorthReal).toBeLessThan(res.aggregate.finalNetWorth);
    expect(res.narrative.join(" ")).toMatch(/Money printing ON/);
  });

  it("future taxation drift raises total taxes paid", () => {
    const steps = [newStep("investment-growth", 20)];
    const base = runChain(defaultProfile(), steps, defaultMacro(2026));
    const taxed = runChain(defaultProfile(), steps, { ...defaultMacro(2026), futureTaxation: { enabled: true, startEffectiveRatePct: 32, driftPctPointsPerYear: 0.5, capPct: 50 } });
    expect(taxed.aggregate.totalTaxesPaid).toBeGreaterThan(base.aggregate.totalTaxesPaid);
  });

  it("Monte Carlo runs 10,000 simulations by default, is deterministic for a seed, and brackets the deterministic path", () => {
    const steps = defaultChain();
    const t0 = Date.now();
    const mc = runChainMonteCarlo(defaultProfile(), steps, defaultMacro(2026), { simulations: 10_000, seed: 7 });
    const elapsed = Date.now() - t0;
    expect(mc.simulations).toBe(10_000);
    expect(mc.years).toBe(30);
    expect(mc.netWorth).toHaveLength(30);
    expect(mc.final.netWorth.p10).toBeLessThanOrEqual(mc.final.netWorth.p50);
    expect(mc.final.netWorth.p50).toBeLessThanOrEqual(mc.final.netWorth.p90);
    expect(mc.deterministic.finalNetWorth).toBeGreaterThan(mc.final.netWorth.p5);
    expect(mc.deterministic.finalNetWorth).toBeLessThan(mc.final.netWorth.p95);
    expect(mc.samplePaths).toHaveLength(20);
    expect(elapsed).toBeLessThan(60_000);
    const again = runChainMonteCarlo(defaultProfile(), steps, defaultMacro(2026), { simulations: 300, seed: 7 });
    const again2 = runChainMonteCarlo(defaultProfile(), steps, defaultMacro(2026), { simulations: 300, seed: 7 });
    expect(again.final.netWorth.p50).toBe(again2.final.netWorth.p50);
  }, 90_000);

  it("maps every catalogued page to a chain calculator and builds a window per step", () => {
    expect(chainCalculatorForPath("/portal/mortgage-killer")).toBe("mortgage-killer");
    expect(chainCalculatorForPath("/portal/crypto-corner")).toBe("crypto");
    expect(chainCalculatorForPath("/portal/unknown-page")).toBe("investment-growth");
    const w = buildWindows(defaultChain());
    expect(w).toHaveLength(4);
    expect(w.map((x) => x.calculatorId)).toEqual(["mortgage-killer", "equity-deployment", "real-estate-rentals", "retirement-income"]);
    expect(CHAIN_CALCULATORS.length).toBeGreaterThanOrEqual(9);
  });

  it("profileFromClientData maps the shared fact finder and derives the mortgage payment", () => {
    const p = profileFromClientData({ age: 50, annualIncome: 400_000, monthlyExpenses: 12_000, homeValue: 900_000, mortgageBalance: 600_000, mortgageRate: 6, mortgageYearsLeft: 25, iraBalance: 100_000, k401Balance: 300_000, taxableInvestments: 250_000, cashSavings: 80_000 });
    expect(p.clientAge).toBe(50);
    expect(p.baseHouseholdExpensesAnnual).toBe(144_000);
    expect(p.qualifiedAssets).toBe(400_000);
    expect(p.home.mortgagePaymentAnnual).toBeGreaterThan(40_000);
    expect(p.home.mortgagePaymentAnnual).toBeLessThan(50_000);
    expect(startNetWorth(p)).toBe(250_000 + 400_000 + 80_000 + 900_000 - 600_000);
  });
});
