import { describe, expect, it } from "vitest";
import strategiesData from "../client/src/data/strategies.json";
import combosData from "../client/src/data/combos.json";

describe("strategies.json data integrity", () => {
  const strategies = strategiesData as any[];

  it("has exactly 100 strategies", () => {
    expect(strategies).toHaveLength(100);
  });

  it("each strategy has required fields", () => {
    for (const s of strategies) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("title");
      expect(s).toHaveProperty("description");
      expect(s).toHaveProperty("clientProfile");
      expect(s.clientProfile).toHaveProperty("name");
      expect(s.clientProfile).toHaveProperty("profession");
      expect(s.clientProfile).toHaveProperty("age");
      expect(s.clientProfile).toHaveProperty("state");
      expect(s.clientProfile).toHaveProperty("startingNetWorth");
    }
  });

  it("all net worths are between $4M and $50M (randomized, independent)", () => {
    for (const s of strategies) {
      const nw = s.clientProfile.startingNetWorth;
      expect(nw).toBeGreaterThanOrEqual(4_000_000);
      expect(nw).toBeLessThanOrEqual(50_000_000);
    }
  });

  it("net worths are NOT sequential/chained — they vary wildly", () => {
    // Check that consecutive strategies don't have matching start/end NW
    let chainedCount = 0;
    for (let i = 1; i < strategies.length; i++) {
      if (strategies[i].clientProfile.startingNetWorth === strategies[i - 1].finalNetWorth) {
        chainedCount++;
      }
    }
    // Allow a few coincidental matches but not systematic chaining
    expect(chainedCount).toBeLessThan(10);
  });

  it("net worths have real variety (std dev > $5M)", () => {
    const nws = strategies.map((s: any) => s.clientProfile.startingNetWorth);
    const mean = nws.reduce((a: number, b: number) => a + b, 0) / nws.length;
    const variance = nws.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) / nws.length;
    const stdDev = Math.sqrt(variance);
    expect(stdDev).toBeGreaterThan(5_000_000);
  });

  it("each strategy has unique family names", () => {
    const names = strategies.map((s: any) => s.clientProfile.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(100);
  });

  it("each strategy has house value, original mortgage, and home equity", () => {
    for (const s of strategies) {
      expect(s.clientProfile.houseValue).toBeGreaterThan(0);
      expect(s.clientProfile.originalMortgage).toBeGreaterThan(0);
      expect(s.clientProfile.homeEquity).toBeGreaterThan(0);
    }
  });

  it("each strategy has 5-12 financial steps with aggressive deployments", () => {
    for (const s of strategies) {
      expect(s.steps).toBeDefined();
      expect(s.steps.length).toBeGreaterThanOrEqual(5);
      expect(s.steps.length).toBeLessThanOrEqual(12);
      for (const step of s.steps) {
        expect(step).toHaveProperty("stepNumber");
        expect(step).toHaveProperty("dollarAmount");
        expect(step).toHaveProperty("taxSaved");
        expect(step).toHaveProperty("netWorthAfter");
        expect(step.dollarAmount).toBeGreaterThanOrEqual(750_000);
        expect(step.taxSaved).toBeGreaterThan(0);
        expect(step.netWorthAfter).toBeGreaterThan(0);
      }
    }
  });

  it("each step has HELOC draw and mortgage balance fields", () => {
    for (const s of strategies) {
      for (const step of s.steps) {
        expect(step).toHaveProperty("helocDraw");
        expect(step).toHaveProperty("mortgageBalance");
        expect(step.helocDraw).toBeGreaterThanOrEqual(0);
        expect(step.mortgageBalance).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("every strategy ends with mortgage at $0 (paid off)", () => {
    for (const s of strategies) {
      const lastStep = s.steps[s.steps.length - 1];
      expect(lastStep.mortgageBalance).toBe(0);
    }
  });

  it("finalNetWorth equals the last step's netWorthAfter", () => {
    for (const s of strategies) {
      const lastStep = s.steps[s.steps.length - 1];
      expect(s.finalNetWorth).toBe(lastStep.netWorthAfter);
    }
  });

  it("totalTaxSaved is the sum of all step taxSaved values", () => {
    for (const s of strategies) {
      const sumTax = s.steps.reduce((acc: number, st: any) => acc + st.taxSaved, 0);
      expect(s.totalTaxSaved).toBe(sumTax);
    }
  });

  it("average deployment per step is above $750K", () => {
    let totalDeployed = 0;
    let totalSteps = 0;
    for (const s of strategies) {
      for (const step of s.steps) {
        totalDeployed += step.dollarAmount;
        totalSteps++;
      }
    }
    expect(totalDeployed / totalSteps).toBeGreaterThan(750_000);
  });
});

describe("combos.json data integrity", () => {
  const combos = combosData as any[];

  it("has exactly 100 combos", () => {
    expect(combos).toHaveLength(100);
  });

  it("each combo has required fields", () => {
    for (const c of combos) {
      expect(c).toHaveProperty("id");
      expect(c).toHaveProperty("comboName");
      expect(c).toHaveProperty("clientProfile");
      expect(c.clientProfile).toHaveProperty("name");
      expect(c.clientProfile).toHaveProperty("profession");
      expect(c.clientProfile).toHaveProperty("startingNetWorth");
      expect(c).toHaveProperty("steps");
      expect(c).toHaveProperty("finalNetWorth");
      expect(c).toHaveProperty("totalTaxSaved");
    }
  });

  it("each combo has unique family names", () => {
    const names = combos.map((c: any) => c.clientProfile.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(100);
  });

  it("each combo has 8-12 sequential steps with financial data", () => {
    for (const c of combos) {
      expect(c.steps.length).toBeGreaterThanOrEqual(8);
      expect(c.steps.length).toBeLessThanOrEqual(12);
      for (const step of c.steps) {
        expect(step).toHaveProperty("stepNumber");
        expect(step).toHaveProperty("amountDeployed");
        expect(step).toHaveProperty("taxSaved");
        expect(step).toHaveProperty("netWorthBefore");
        expect(step).toHaveProperty("netWorthAfter");
      }
    }
  });
});
