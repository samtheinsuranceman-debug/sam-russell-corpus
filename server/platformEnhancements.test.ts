import { describe, it, expect } from "vitest";
import { runMonteCarlo, MONTE_CARLO_PRESETS, compareScenarios } from "../shared/monteCarloEngine";

describe("Monte Carlo Engine", () => {
  it("runs a basic simulation with default preset", () => {
    const result = runMonteCarlo({
      simulations: 100,
      years: 10,
      initialValue: 100000,
      ...MONTE_CARLO_PRESETS.balanced,
      annualContribution: 0,
    });
    expect(result).toBeDefined();
    expect(result.bands).toHaveLength(11); // years + 1 (includes year 0)
    expect(result.bands[0]).toHaveProperty("year");
    expect(result.bands[0]).toHaveProperty("p10");
    expect(result.bands[0]).toHaveProperty("p50");
    expect(result.bands[0]).toHaveProperty("p90");
    expect(result.summary).toBeDefined();
    expect(result.summary.median).toBeGreaterThan(0);
    expect(result.config.simulations).toBe(100);
  });

  it("respects floor and cap returns for IUL preset", () => {
    const result = runMonteCarlo({
      simulations: 50,
      years: 5,
      initialValue: 100000,
      ...MONTE_CARLO_PRESETS.iulConservative,
      annualContribution: 0,
    });
    // With 0% floor, p10 should stay reasonably close to initial
    expect(result.bands[4].p10).toBeGreaterThanOrEqual(80000);
  });

  it("handles annual contributions increasing median", () => {
    const withContrib = runMonteCarlo({
      simulations: 200,
      years: 10,
      initialValue: 100000,
      ...MONTE_CARLO_PRESETS.mygaFixed,
      annualContribution: 10000,
    });
    const withoutContrib = runMonteCarlo({
      simulations: 200,
      years: 10,
      initialValue: 100000,
      ...MONTE_CARLO_PRESETS.mygaFixed,
      annualContribution: 0,
    });
    expect(withContrib.summary.median).toBeGreaterThan(withoutContrib.summary.median);
  });

  it("all presets produce valid results", () => {
    for (const [name, preset] of Object.entries(MONTE_CARLO_PRESETS)) {
      const result = runMonteCarlo({
        simulations: 50,
        years: 5,
        initialValue: 100000,
        ...preset,
        annualContribution: 0,
      });
      expect(result.bands.length, `${name} should have 6 bands (years+1)`).toBe(6);
      expect(result.summary.median, `${name} median should be > 0`).toBeGreaterThan(0);
    }
  });

  it("compareScenarios returns array of scenario results", () => {
    const configs = [
      { name: "Conservative", config: { simulations: 50, years: 10, initialValue: 100000, ...MONTE_CARLO_PRESETS.iulConservative, annualContribution: 0 } },
      { name: "Aggressive", config: { simulations: 50, years: 10, initialValue: 100000, ...MONTE_CARLO_PRESETS.aggressiveGrowth, annualContribution: 0 } },
    ];
    const comparison = compareScenarios(configs);
    expect(Array.isArray(comparison)).toBe(true);
    expect(comparison).toHaveLength(2);
    expect(comparison[0].name).toBe("Conservative");
    expect(comparison[1].name).toBe("Aggressive");
    expect(comparison[0].result).toBeDefined();
    expect(comparison[1].result).toBeDefined();
  });

  it("samplePaths are included in result", () => {
    const result = runMonteCarlo({
      simulations: 50,
      years: 5,
      initialValue: 100000,
      ...MONTE_CARLO_PRESETS.sp500,
      annualContribution: 0,
    });
    expect(result.samplePaths).toBeDefined();
    expect(result.samplePaths.length).toBeGreaterThan(0);
    expect(result.samplePaths.length).toBeLessThanOrEqual(20);
  });
});

describe("Data Feed Service", () => {
  it("module exports expected functions", async () => {
    const mod = await import("../server/dataFeedService");
    expect(typeof mod.getCPIData).toBe("function");
    expect(typeof mod.getTreasuryRates).toBe("function");
    expect(typeof mod.getCommodityPrices).toBe("function");
    expect(typeof mod.getMYGARates).toBe("function");
  });
});
