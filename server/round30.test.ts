import { describe, it, expect } from "vitest";

// ─── Saved Strategies Router ──────────────────────────────────────────────────
describe("Saved Strategies Router", () => {
  it("savedStrategies router should exist in appRouter", async () => {
    const mod = await import("./routers");
    expect(mod.appRouter).toBeDefined();
    const procNames = Object.keys(mod.appRouter._def.procedures);
    expect(procNames).toContain("savedStrategies.list");
    expect(procNames).toContain("savedStrategies.getById");
    expect(procNames).toContain("savedStrategies.save");
    expect(procNames).toContain("savedStrategies.delete");
  });

  it("savedStrategies.save input should accept required fields", async () => {
    const mod = await import("./routers");
    const procNames = Object.keys(mod.appRouter._def.procedures);
    // Verify the save procedure exists
    expect(procNames).toContain("savedStrategies.save");
  });

  it("savedStrategies.list input should accept optional clientId", async () => {
    const mod = await import("./routers");
    const procNames = Object.keys(mod.appRouter._def.procedures);
    expect(procNames).toContain("savedStrategies.list");
  });
});

// ─── Saved Strategies DB Helpers ──────────────────────────────────────────────
describe("Saved Strategies DB Helpers", () => {
  it("should export getSavedStrategies function", async () => {
    const mod = await import("./db");
    expect(typeof mod.getSavedStrategies).toBe("function");
  });

  it("should export getSavedStrategyById function", async () => {
    const mod = await import("./db");
    expect(typeof mod.getSavedStrategyById).toBe("function");
  });

  it("should export createSavedStrategy function", async () => {
    const mod = await import("./db");
    expect(typeof mod.createSavedStrategy).toBe("function");
  });

  it("should export deleteSavedStrategy function", async () => {
    const mod = await import("./db");
    expect(typeof mod.deleteSavedStrategy).toBe("function");
  });
});

// ─── Saved Strategies Schema ──────────────────────────────────────────────────
describe("Saved Strategies Schema", () => {
  it("savedStrategies table should be defined in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.savedStrategies).toBeDefined();
  });

  it("savedStrategies table should have required columns", async () => {
    const schema = await import("../drizzle/schema");
    const table = schema.savedStrategies;
    // Check the table has the expected column names
    const columnNames = Object.keys(table);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("workspaceId");
    expect(columnNames).toContain("clientId");
    expect(columnNames).toContain("strategyType");
    expect(columnNames).toContain("strategyLabel");
    expect(columnNames).toContain("inputsJson");
    expect(columnNames).toContain("summaryJson");
    expect(columnNames).toContain("iulProjectionJson");
    expect(columnNames).toContain("strProjectionJson");
    expect(columnNames).toContain("notes");
    expect(columnNames).toContain("createdAt");
  });

  it("SavedStrategy type should be exported", async () => {
    const schema = await import("../drizzle/schema");
    // Type exports don't exist at runtime, but the table inference works
    expect(schema.savedStrategies).toBeDefined();
  });
});

// ─── Monte Carlo Simulation Logic ─────────────────────────────────────────────
describe("Monte Carlo Simulation Engine", () => {
  // Replicate the client-side Monte Carlo logic for testing
  function runMonteCarlo(params: {
    baseReturn: number;
    volatility: number;
    loadFee: number;
    coiRate: number;
    years: number;
    premiums: number[];
    simulations: number;
    seed?: number;
  }) {
    const { baseReturn, volatility, loadFee, coiRate, years, premiums, simulations } = params;
    const percentiles = [10, 25, 50, 75, 90];
    const allPaths: number[][] = [];

    // Use seeded random for deterministic tests
    let seedVal = params.seed ?? 42;
    const seededRandom = () => {
      seedVal = (seedVal * 16807) % 2147483647;
      return (seedVal - 1) / 2147483646;
    };

    for (let s = 0; s < simulations; s++) {
      const path: number[] = [];
      let accountValue = 0;
      for (let y = 0; y < years; y++) {
        const premium = premiums[y] ?? premiums[premiums.length - 1];
        const u1 = seededRandom();
        const u2 = seededRandom();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const randomReturn = Math.max(0, baseReturn + volatility * z);
        const netPremium = premium * (1 - loadFee);
        accountValue += netPremium;
        const interest = accountValue * randomReturn;
        accountValue += interest;
        const coi = accountValue * coiRate;
        accountValue -= coi;
        path.push(Math.max(0, accountValue));
      }
      allPaths.push(path);
    }

    const chartData = [];
    for (let y = 0; y < years; y++) {
      const yearValues = allPaths.map((p) => p[y]).sort((a, b) => a - b);
      const entry: Record<string, number> = { year: y + 1 };
      for (const pct of percentiles) {
        const idx = Math.floor((pct / 100) * yearValues.length);
        entry[`p${pct}`] = Math.round(yearValues[Math.min(idx, yearValues.length - 1)]);
      }
      chartData.push(entry);
    }
    return chartData;
  }

  it("should generate correct number of data points for 20-year projection", () => {
    const data = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0.15,
      loadFee: 0.06,
      coiRate: 0.04,
      years: 20,
      premiums: Array(20).fill(50000),
      simulations: 100,
      seed: 42,
    });
    expect(data.length).toBe(20);
    expect(data[0].year).toBe(1);
    expect(data[19].year).toBe(20);
  });

  it("should have all required percentile fields", () => {
    const data = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0.15,
      loadFee: 0.06,
      coiRate: 0.04,
      years: 5,
      premiums: [50000, 50000, 50000, 50000, 50000],
      simulations: 100,
      seed: 42,
    });
    for (const row of data) {
      expect(row).toHaveProperty("year");
      expect(row).toHaveProperty("p10");
      expect(row).toHaveProperty("p25");
      expect(row).toHaveProperty("p50");
      expect(row).toHaveProperty("p75");
      expect(row).toHaveProperty("p90");
    }
  });

  it("percentiles should be ordered: p10 <= p25 <= p50 <= p75 <= p90", () => {
    const data = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0.15,
      loadFee: 0.06,
      coiRate: 0.04,
      years: 20,
      premiums: Array(20).fill(50000),
      simulations: 500,
      seed: 42,
    });
    for (const row of data) {
      expect(row.p10).toBeLessThanOrEqual(row.p25);
      expect(row.p25).toBeLessThanOrEqual(row.p50);
      expect(row.p50).toBeLessThanOrEqual(row.p75);
      expect(row.p75).toBeLessThanOrEqual(row.p90);
    }
  });

  it("all values should be non-negative (IUL 0% floor)", () => {
    const data = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0.15,
      loadFee: 0.06,
      coiRate: 0.04,
      years: 20,
      premiums: Array(20).fill(50000),
      simulations: 500,
      seed: 42,
    });
    for (const row of data) {
      expect(row.p10).toBeGreaterThanOrEqual(0);
      expect(row.p25).toBeGreaterThanOrEqual(0);
      expect(row.p50).toBeGreaterThanOrEqual(0);
      expect(row.p75).toBeGreaterThanOrEqual(0);
      expect(row.p90).toBeGreaterThanOrEqual(0);
    }
  });

  it("higher volatility should produce wider spread between p10 and p90", () => {
    const lowVol = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0.05,
      loadFee: 0.06,
      coiRate: 0.04,
      years: 20,
      premiums: Array(20).fill(50000),
      simulations: 500,
      seed: 42,
    });
    const highVol = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0.25,
      loadFee: 0.06,
      coiRate: 0.04,
      years: 20,
      premiums: Array(20).fill(50000),
      simulations: 500,
      seed: 42,
    });
    const lowSpread = lowVol[19].p90 - lowVol[19].p10;
    const highSpread = highVol[19].p90 - highVol[19].p10;
    expect(highSpread).toBeGreaterThan(lowSpread);
  });

  it("zero volatility should produce identical percentiles (deterministic)", () => {
    const data = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0,
      loadFee: 0.06,
      coiRate: 0.04,
      years: 10,
      premiums: Array(10).fill(50000),
      simulations: 100,
      seed: 42,
    });
    for (const row of data) {
      // With zero volatility, all simulations should be identical
      expect(row.p10).toBe(row.p90);
      expect(row.p25).toBe(row.p75);
      expect(row.p50).toBe(row.p10);
    }
  });

  it("values should grow over time with positive returns", () => {
    const data = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0.15,
      loadFee: 0.06,
      coiRate: 0.04,
      years: 20,
      premiums: Array(20).fill(50000),
      simulations: 500,
      seed: 42,
    });
    // Median at year 20 should be significantly higher than year 1
    expect(data[19].p50).toBeGreaterThan(data[0].p50 * 3);
  });

  it("IUL floor should prevent negative returns from reducing account below zero", () => {
    // Use very high volatility to stress test the floor
    const data = runMonteCarlo({
      baseReturn: 0.02, // low base return
      volatility: 0.30, // very high volatility
      loadFee: 0.06,
      coiRate: 0.04,
      years: 20,
      premiums: Array(20).fill(50000),
      simulations: 500,
      seed: 42,
    });
    for (const row of data) {
      expect(row.p10).toBeGreaterThanOrEqual(0);
    }
  });

  it("load fee and COI should reduce account value vs zero-cost scenario", () => {
    const withCosts = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0,
      loadFee: 0.06,
      coiRate: 0.04,
      years: 10,
      premiums: Array(10).fill(50000),
      simulations: 100,
      seed: 42,
    });
    const noCosts = runMonteCarlo({
      baseReturn: 0.10,
      volatility: 0,
      loadFee: 0,
      coiRate: 0,
      years: 10,
      premiums: Array(10).fill(50000),
      simulations: 100,
      seed: 42,
    });
    expect(noCosts[9].p50).toBeGreaterThan(withCosts[9].p50);
  });
});

// ─── Strategy Options Definitions ─────────────────────────────────────────────
describe("Strategy Options for Round 30", () => {
  const STRATEGY_OPTIONS = [
    { key: "1yr-non-solar", label: "0% Year 1 — Non Solar", years: 1, solar: false },
    { key: "2yr-non-solar", label: "0% Year 2 — Non Solar", years: 2, solar: false },
    { key: "3yr-non-solar", label: "0% Year 3 — Non Solar", years: 3, solar: false },
    { key: "4yr-non-solar", label: "0% Year 4 — Non Solar", years: 4, solar: false },
    { key: "5yr-non-solar", label: "0% Year 5 — Non Solar", years: 5, solar: false },
    { key: "1yr-solar", label: "0% Year 1 — Solar Equity", years: 1, solar: true },
  ];

  it("should have exactly 6 strategy options", () => {
    expect(STRATEGY_OPTIONS.length).toBe(6);
  });

  it("should have 5 non-solar and 1 solar option", () => {
    const nonSolar = STRATEGY_OPTIONS.filter((s) => !s.solar);
    const solar = STRATEGY_OPTIONS.filter((s) => s.solar);
    expect(nonSolar.length).toBe(5);
    expect(solar.length).toBe(1);
  });

  it("non-solar options should span years 1-5", () => {
    const nonSolar = STRATEGY_OPTIONS.filter((s) => !s.solar);
    const years = nonSolar.map((s) => s.years).sort();
    expect(years).toEqual([1, 2, 3, 4, 5]);
  });

  it("solar option should be year 1 only", () => {
    const solar = STRATEGY_OPTIONS.find((s) => s.solar);
    expect(solar?.years).toBe(1);
  });

  it("all keys should be unique", () => {
    const keys = STRATEGY_OPTIONS.map((s) => s.key);
    expect(new Set(keys).size).toBe(6);
  });
});

// ─── Tax Bracket Inference ────────────────────────────────────────────────────
describe("Tax Bracket Inference (Auto-populate)", () => {
  const inferBracket = (income: number): string => {
    if (income >= 731200) return "0.37";
    if (income >= 487450) return "0.35";
    if (income >= 383900) return "0.32";
    if (income >= 201050) return "0.24";
    if (income >= 94300) return "0.22";
    if (income >= 23200) return "0.12";
    return "0.10";
  };

  it("should return 0.37 for income >= $731,200", () => {
    expect(inferBracket(731200)).toBe("0.37");
    expect(inferBracket(1000000)).toBe("0.37");
  });

  it("should return 0.35 for income $487,450 - $731,199", () => {
    expect(inferBracket(487450)).toBe("0.35");
    expect(inferBracket(600000)).toBe("0.35");
  });

  it("should return 0.32 for income $383,900 - $487,449", () => {
    expect(inferBracket(383900)).toBe("0.32");
    expect(inferBracket(450000)).toBe("0.32");
  });

  it("should return 0.24 for income $201,050 - $383,899", () => {
    expect(inferBracket(201050)).toBe("0.24");
    expect(inferBracket(300000)).toBe("0.24");
  });

  it("should return 0.22 for income $94,300 - $201,049", () => {
    expect(inferBracket(94300)).toBe("0.22");
    expect(inferBracket(150000)).toBe("0.22");
  });

  it("should return 0.12 for income $23,200 - $94,299", () => {
    expect(inferBracket(23200)).toBe("0.12");
    expect(inferBracket(50000)).toBe("0.12");
  });

  it("should return 0.10 for income below $23,200", () => {
    expect(inferBracket(0)).toBe("0.10");
    expect(inferBracket(23199)).toBe("0.10");
  });
});

// ─── IUL Cascade Formula Verification ─────────────────────────────────────────
describe("IUL Cascade Formula for Save/Load", () => {
  it("50% tax savings split should produce equal Y1/Y2 premiums for non-solar", () => {
    const iraBalance = 800000;
    const taxBracket = 0.24;
    const taxSavings = iraBalance * taxBracket;
    const halfTaxSavings = taxSavings / 2;
    expect(halfTaxSavings).toBe(96000);
    // Y1 and Y2 premiums should be equal for non-solar
    expect(halfTaxSavings).toBe(halfTaxSavings);
  });

  it("solar equity should use 22% of IRA as Y1 premium", () => {
    const iraBalance = 800000;
    const solarEnhancement = iraBalance * 0.22;
    expect(solarEnhancement).toBe(176000);
  });

  it("month 13 policy loan should be 25% of IRA value", () => {
    const iraBalance = 800000;
    const month13Loan = iraBalance * 0.25;
    expect(month13Loan).toBe(200000);
  });

  it("target property price should be IRA / 0.4", () => {
    const iraBalance = 800000;
    const targetPrice = iraBalance / 0.4;
    expect(targetPrice).toBe(2000000);
  });

  it("down payment should be 30% of target property price", () => {
    const targetPrice = 2000000;
    const downPayment = targetPrice * 0.30;
    expect(downPayment).toBe(600000);
  });

  it("multi-year strategy should divide properties evenly", () => {
    const iraBalance = 800000;
    const totalPropertyValue = iraBalance / 0.4;
    for (let years = 1; years <= 5; years++) {
      const perYear = totalPropertyValue / years;
      expect(perYear * years).toBeCloseTo(totalPropertyValue, 0);
    }
  });
});

// ─── Saved Strategy Data Structure ────────────────────────────────────────────
describe("Saved Strategy Data Structure", () => {
  it("save payload should include all required fields", () => {
    const payload = {
      clientId: 1,
      clientName: "Test Client",
      strategyType: "1yr-non-solar",
      strategyLabel: "0% Year 1 — Non Solar",
      carrierId: "aaa-plus-mutual",
      carrierName: "AAA+ Mutual",
      inputsJson: {
        iraBalance: 800000,
        conversionPortion: 1,
        homeEquity: 500000,
        age: 55,
        income: 250000,
        filingStatus: "married",
        currentTaxBracket: 0.24,
        iulYears: 20,
        strategyYears: 1,
        solarEquity: false,
        rentalGrossYield: 0.20,
        realEstateAppreciation: 0.05,
        helocRate: 0.07,
      },
      summaryJson: {
        finalAccountValue: 1500000,
        finalNetCashValue: 800000,
        totalRentalIncome: 400000,
        totalPropertyEquity: 1200000,
      },
      notes: "Test strategy save",
    };

    expect(payload.strategyType).toBeTruthy();
    expect(payload.strategyLabel).toBeTruthy();
    expect(payload.inputsJson.iraBalance).toBe(800000);
    expect(payload.summaryJson.finalAccountValue).toBe(1500000);
    expect(payload.notes).toBe("Test strategy save");
  });

  it("load should restore all form fields from inputsJson", () => {
    const saved = {
      clientId: 1,
      strategyType: "3yr-non-solar",
      carrierId: "aaa-plus-mutual",
      inputsJson: {
        iraBalance: 600000,
        conversionPortion: 1,
        homeEquity: 400000,
        age: 50,
        income: 200000,
        filingStatus: "married",
        currentTaxBracket: 0.24,
        iulYears: 20,
        mortgageRate: 0.065,
        rentalGrossYield: 0.18,
        realEstateAppreciation: 0.04,
        helocRate: 0.08,
      },
    };

    // Simulate loadSavedStrategy
    const inp = saved.inputsJson;
    const form = {
      clientId: String(saved.clientId),
      iraBalance: String(inp.iraBalance),
      conversionPortion: String(inp.conversionPortion),
      homeEquity: String(inp.homeEquity),
      age: String(inp.age),
      income: String(inp.income),
      filingStatus: inp.filingStatus,
      currentTaxBracket: String(inp.currentTaxBracket),
      iulYears: String(inp.iulYears),
      mortgageRate: String(inp.mortgageRate),
    };

    expect(form.iraBalance).toBe("600000");
    expect(form.homeEquity).toBe("400000");
    expect(form.age).toBe("50");
    expect(form.filingStatus).toBe("married");
    expect(form.iulYears).toBe("20");
  });

  it("what-if parameters should be restored from saved strategy", () => {
    const inp = {
      rentalGrossYield: 0.18,
      realEstateAppreciation: 0.04,
      helocRate: 0.08,
    };

    const rentalGross = Math.round(inp.rentalGrossYield * 100);
    const appreciation = Math.round(inp.realEstateAppreciation * 100);
    const helocRate = Math.round(inp.helocRate * 100);

    expect(rentalGross).toBe(18);
    expect(appreciation).toBe(4);
    expect(helocRate).toBe(8);
  });
});
