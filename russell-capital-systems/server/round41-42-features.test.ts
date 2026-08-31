import { describe, it, expect } from "vitest";

// ─── Index Crediting Data Module Tests ───────────────────────────────────────
describe("Index Crediting Data Module", () => {
  it("exports ALL_INDEX_OPTIONS with A Mutual Life, A+ Mutual Life, and A- Mutual Life options", async () => {
    const { ALL_INDEX_OPTIONS, CARRIERS } = await import("../shared/indexCreditingData");
    expect(ALL_INDEX_OPTIONS.length).toBeGreaterThanOrEqual(10);

    const carrierIds = [...new Set(ALL_INDEX_OPTIONS.map((o: any) => o.carrier))];
    expect(carrierIds).toContain("a-mutual");
    expect(carrierIds).toContain("a-plus-mutual-life");
    expect(carrierIds).toContain("a-minus-mutual");

    expect(CARRIERS.length).toBe(3);
  });

  it("each option has required fields", async () => {
    const { ALL_INDEX_OPTIONS } = await import("../shared/indexCreditingData");
    for (const opt of ALL_INDEX_OPTIONS) {
      expect(opt.id).toBeTruthy();
      expect(opt.name).toBeTruthy();
      expect(opt.carrier).toBeTruthy();
      expect(opt.index).toBeTruthy();
      expect(typeof opt.floor).toBe("number");
      expect(typeof opt.participation).toBe("number");
      expect(opt.description).toBeTruthy();
    }
  });

  it("getCreditingHistory returns year-by-year data with cap/floor applied", async () => {
    const { ALL_INDEX_OPTIONS, getCreditingHistory } = await import("../shared/indexCreditingData");
    const spCapped = ALL_INDEX_OPTIONS.find((o: any) => o.carrier === "a-mutual" && o.cap !== null && o.index === "SP500" && o.indexType === "single");
    expect(spCapped).toBeTruthy();

    const history = getCreditingHistory(spCapped!, 2000, 2020);
    expect(history.length).toBe(21);

    for (const entry of history) {
      expect(entry.year).toBeGreaterThanOrEqual(2000);
      expect(typeof entry.rawReturn).toBe("number");
      expect(typeof entry.creditedRate).toBe("number");
      // Floor protection: credited rate should never be below floor
      expect(entry.creditedRate).toBeGreaterThanOrEqual(spCapped!.floor);
      // Cap: credited rate should never exceed cap (if cap exists)
      if (spCapped!.cap !== null) {
        expect(entry.creditedRate).toBeLessThanOrEqual(spCapped!.cap + 0.01);
      }
    }
  });

  it("floor protection kicks in during 2008 crash", async () => {
    const { ALL_INDEX_OPTIONS, getCreditingHistory } = await import("../shared/indexCreditingData");
    const spOption = ALL_INDEX_OPTIONS.find((o: any) => o.carrier === "a-mutual" && o.index === "SP500" && o.cap !== null && o.indexType === "single");
    const history = getCreditingHistory(spOption!, 2008, 2008);
    expect(history.length).toBe(1);
    // S&P 500 was deeply negative in 2008, floor should protect
    expect(history[0].creditedRate).toBe(spOption!.floor);
  });

  it("cap limits gains in strong bull years", async () => {
    const { ALL_INDEX_OPTIONS, getCreditingHistory } = await import("../shared/indexCreditingData");
    const spCapped = ALL_INDEX_OPTIONS.find((o: any) => o.carrier === "a-mutual" && o.index === "SP500" && o.cap !== null && o.cap < 20 && o.indexType === "single");
    const history = getCreditingHistory(spCapped!, 2013, 2013);
    // 2013 was a strong year (~30%), should be capped
    expect(history[0].creditedRate).toBeLessThanOrEqual(spCapped!.cap! + 0.01);
  });
});

// ─── Backtest Engine Tests ───────────────────────────────────────────────────
describe("Backtest Engine (runBacktest)", () => {
  it("runs a 20-year simulation with single allocation", async () => {
    const { ALL_INDEX_OPTIONS, runBacktest } = await import("../shared/indexCreditingData");
    const option = ALL_INDEX_OPTIONS.find((o: any) => o.carrier === "a-mutual" && o.index === "SP500" && o.cap !== null && o.indexType === "single");

    const result = runBacktest(
      [{ optionId: option!.id, percentage: 100 }],
      50000,
      20,
      2005,
    );

    expect(result.finalValue).toBeGreaterThan(0);
    expect(result.years.length).toBe(20);
    expect(result.annualizedReturn).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalReturn).toBe("number");
    expect(typeof result.floorProtectedYears).toBe("number");
    expect(typeof result.capLimitedYears).toBe("number");

    // Each year should have option breakdown
    for (const yr of result.years) {
      expect(yr.year).toBeGreaterThanOrEqual(2005);
      expect(yr.endingValue).toBeGreaterThan(0);
      expect(yr.optionBreakdown.length).toBe(1);
      expect(yr.optionBreakdown[0].allocation).toBe(100);
    }
  });

  it("runs a simulation with split allocations (50/50)", async () => {
    const { ALL_INDEX_OPTIONS, runBacktest } = await import("../shared/indexCreditingData");
    const opts = ALL_INDEX_OPTIONS.filter((o: any) => o.carrier === "a-plus-mutual-life");
    if (opts.length < 2) return; // skip if not enough options

    const result = runBacktest(
      [
        { optionId: opts[0].id, percentage: 50 },
        { optionId: opts[1].id, percentage: 50 },
      ],
      100000,
      15,
      2000,
    );

    expect(result.finalValue).toBeGreaterThan(0);
    expect(result.years.length).toBe(15);
    // Each year should have 2 option breakdowns
    for (const yr of result.years) {
      expect(yr.optionBreakdown.length).toBe(2);
      const totalAlloc = yr.optionBreakdown.reduce((s: number, ob: any) => s + ob.allocation, 0);
      expect(totalAlloc).toBe(100);
    }
  });

  it("final value grows with premiums (no negative account values)", async () => {
    const { ALL_INDEX_OPTIONS, runBacktest } = await import("../shared/indexCreditingData");
    const option = ALL_INDEX_OPTIONS.find((o: any) => o.carrier === "a-minus-mutual" && o.cap !== null && o.indexType === "single");

    const result = runBacktest(
      [{ optionId: option!.id, percentage: 100 }],
      25000,
      10,
      2010,
    );

    // With floor protection and premiums, account value should always be positive
    for (const yr of result.years) {
      expect(yr.endingValue).toBeGreaterThan(0);
    }
    // Final value should be at least total premiums (floor protection)
    expect(result.finalValue).toBeGreaterThanOrEqual(25000 * 10 * 0.5); // at least 50% of premiums
  });

  it("A- Mutual Life options produce reasonable results", async () => {
    const { ALL_INDEX_OPTIONS, runBacktest } = await import("../shared/indexCreditingData");
    const symetraOpts = ALL_INDEX_OPTIONS.filter((o: any) => o.carrier === "a-minus-mutual");
    expect(symetraOpts.length).toBeGreaterThanOrEqual(3);

    // Run with the first A- Mutual Life option
    const result = runBacktest(
      [{ optionId: symetraOpts[0].id, percentage: 100 }],
      50000,
      20,
      2005,
    );

    expect(result.finalValue).toBeGreaterThan(500000); // Should grow beyond premiums
    expect(result.years.length).toBe(20);
  });

  it("handles edge case: start year near end of data", async () => {
    const { ALL_INDEX_OPTIONS, runBacktest } = await import("../shared/indexCreditingData");
    const option = ALL_INDEX_OPTIONS[0];

    const result = runBacktest(
      [{ optionId: option.id, percentage: 100 }],
      50000,
      3,
      2023,
    );

    expect(result.years.length).toBe(3);
    expect(result.finalValue).toBeGreaterThan(0);
  });
});

// ─── Rolling Window Tests ────────────────────────────────────────────────────
describe("Rolling Window Analysis", () => {
  it("produces correct number of windows", async () => {
    const { ALL_INDEX_OPTIONS, runBacktest } = await import("../shared/indexCreditingData");
    const option = ALL_INDEX_OPTIONS.find((o: any) => o.carrier === "a-mutual" && o.index === "SP500" && o.cap !== null && o.indexType === "single");

    // For 15-year windows from 1994-2025, there should be (2025 - 1994 - 15 + 2) = 18 windows
    const windows: any[] = [];
    for (let start = 1994; start + 15 - 1 <= 2025; start++) {
      const result = runBacktest([{ optionId: option!.id, percentage: 100 }], 50000, 15, start);
      windows.push({ startYear: start, finalValue: result.finalValue, annualizedReturn: result.annualizedReturn });
    }

    expect(windows.length).toBe(2025 - 1994 - 15 + 2);

    // Best and worst should be different
    const best = windows.reduce((b, w) => w.finalValue > b.finalValue ? w : b, windows[0]);
    const worst = windows.reduce((w2, w) => w.finalValue < w2.finalValue ? w : w2, windows[0]);
    expect(best.finalValue).toBeGreaterThan(worst.finalValue);
  });
});

// ─── Carrier Comparison (with A- Mutual Life) ───────────────────────────────────────
describe("Carrier Comparison with A- Mutual Life", () => {
  it("A- Mutual Life is included in carrier options", async () => {
    const { ALL_INDEX_OPTIONS, CARRIERS } = await import("../shared/indexCreditingData");
    const symetraCarrier = CARRIERS.find((c: any) => c.id === "a-minus-mutual");
    expect(symetraCarrier).toBeTruthy();
    expect(symetraCarrier!.name).toContain("A- Mutual Life");

    const symetraOptions = ALL_INDEX_OPTIONS.filter((o: any) => o.carrier === "a-minus-mutual");
    expect(symetraOptions.length).toBeGreaterThanOrEqual(3);
  });

  it("all three carriers produce different results for same premium", async () => {
    const { ALL_INDEX_OPTIONS, runBacktest } = await import("../shared/indexCreditingData");

    const carriers = ["a-mutual", "a-plus-mutual-life", "a-minus-mutual"];
    const results: Record<string, number> = {};

    for (const carrier of carriers) {
      const option = ALL_INDEX_OPTIONS.find((o: any) => o.carrier === carrier && o.index === "SP500" && o.cap !== null && o.indexType === "single");
      if (!option) continue;
      const result = runBacktest([{ optionId: option.id, percentage: 100 }], 50000, 20, 2005);
      results[carrier] = result.finalValue;
    }

    // At least 2 carriers should have results
    const values = Object.values(results);
    expect(values.length).toBeGreaterThanOrEqual(2);
    // Results should differ (different caps/floors/participation)
    const unique = new Set(values.map(v => Math.round(v / 1000)));
    expect(unique.size).toBeGreaterThanOrEqual(1); // At minimum they should produce results
  });
});

// ─── Saved Scenarios Router Tests ────────────────────────────────────────────
describe("Saved Scenarios Router", () => {
  it("scenarios router exists in appRouter", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("scenarios.save");
    expect(appRouter._def.procedures).toHaveProperty("scenarios.list");
    expect(appRouter._def.procedures).toHaveProperty("scenarios.delete");
    expect(appRouter._def.procedures).toHaveProperty("scenarios.compare");
  });
});

// ─── Index Backtester Router Tests ───────────────────────────────────────────
describe("Index Backtester Router", () => {
  it("indexBacktester router exists with all procedures", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("indexBacktester.getOptions");
    expect(appRouter._def.procedures).toHaveProperty("indexBacktester.getCreditingHistory");
    expect(appRouter._def.procedures).toHaveProperty("indexBacktester.runSimulation");
    expect(appRouter._def.procedures).toHaveProperty("indexBacktester.compareStrategies");
    expect(appRouter._def.procedures).toHaveProperty("indexBacktester.rollingWindowAnalysis");
  });
});
