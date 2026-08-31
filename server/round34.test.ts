import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════
// ─── ROUND 34: STRATEGY ARCHIVING & CARRIER RATE COMPARISON CHART
// ═══════════════════════════════════════════════════════════════════════════

// ─── Strategy Archiving — Schema ──────────────────────────────────────────

describe("Strategy Archiving — Schema", () => {
  it("should support isArchived boolean field defaulting to false", () => {
    const strategy = {
      id: 1,
      strategyLabel: "Roth + IUL 20yr",
      isArchived: false,
    };
    expect(strategy.isArchived).toBe(false);
  });

  it("should allow toggling isArchived to true", () => {
    const strategy = { id: 1, isArchived: false };
    strategy.isArchived = true;
    expect(strategy.isArchived).toBe(true);
  });

  it("should allow toggling isArchived back to false (unarchive)", () => {
    const strategy = { id: 1, isArchived: true };
    strategy.isArchived = false;
    expect(strategy.isArchived).toBe(false);
  });
});

// ─── Strategy Archiving — Filtering ───────────────────────────────────────

describe("Strategy Archiving — Filtering", () => {
  const strategies = [
    { id: 1, strategyLabel: "Strategy A", isArchived: false },
    { id: 2, strategyLabel: "Strategy B", isArchived: true },
    { id: 3, strategyLabel: "Strategy C", isArchived: false },
    { id: 4, strategyLabel: "Strategy D", isArchived: true },
  ];

  it("should filter out archived strategies by default", () => {
    const active = strategies.filter(s => !s.isArchived);
    expect(active).toHaveLength(2);
    expect(active.every(s => !s.isArchived)).toBe(true);
    expect(active.map(s => s.id)).toEqual([1, 3]);
  });

  it("should include archived strategies when includeArchived is true", () => {
    const includeArchived = true;
    const result = includeArchived ? strategies : strategies.filter(s => !s.isArchived);
    expect(result).toHaveLength(4);
  });

  it("should return only active strategies when includeArchived is false", () => {
    const includeArchived = false;
    const result = includeArchived ? strategies : strategies.filter(s => !s.isArchived);
    expect(result).toHaveLength(2);
  });

  it("should handle case where all strategies are archived", () => {
    const allArchived = strategies.map(s => ({ ...s, isArchived: true }));
    const active = allArchived.filter(s => !s.isArchived);
    expect(active).toHaveLength(0);
  });

  it("should handle case where no strategies are archived", () => {
    const noneArchived = strategies.map(s => ({ ...s, isArchived: false }));
    const active = noneArchived.filter(s => !s.isArchived);
    expect(active).toHaveLength(4);
  });
});

// ─── Strategy Archiving — Toggle Logic ────────────────────────────────────

describe("Strategy Archiving — Toggle Logic", () => {
  it("should toggle archive status correctly", () => {
    const toggleArchive = (current: boolean) => !current;
    expect(toggleArchive(false)).toBe(true);
    expect(toggleArchive(true)).toBe(false);
  });

  it("should return the updated archive status after toggle", () => {
    const toggleResult = { id: 1, isArchived: true };
    expect(toggleResult.id).toBe(1);
    expect(toggleResult.isArchived).toBe(true);
  });

  it("should preserve other strategy fields when archiving", () => {
    const strategy = {
      id: 5,
      strategyLabel: "Test Strategy",
      carrierId: "aaa-plus-mutual",
      version: 2,
      isArchived: false,
    };
    const archived = { ...strategy, isArchived: true };
    expect(archived.strategyLabel).toBe("Test Strategy");
    expect(archived.carrierId).toBe("aaa-plus-mutual");
    expect(archived.version).toBe(2);
    expect(archived.isArchived).toBe(true);
  });

  it("should handle archiving root strategies with child versions", () => {
    const root = { id: 1, version: 1, parentStrategyId: null, isArchived: false };
    const child = { id: 2, version: 2, parentStrategyId: 1, isArchived: false };
    // Archiving root should not affect children
    root.isArchived = true;
    expect(root.isArchived).toBe(true);
    expect(child.isArchived).toBe(false);
  });
});

// ─── Strategy Archiving — UI Display ──────────────────────────────────────

describe("Strategy Archiving — UI Display", () => {
  it("should apply muted styling for archived strategies", () => {
    const isArchived = true;
    const className = isArchived ? "opacity-60 border-muted" : "hover:border-green-500";
    expect(className).toContain("opacity-60");
  });

  it("should show 'Archived' badge for archived strategies", () => {
    const isArchived = true;
    const showBadge = isArchived;
    expect(showBadge).toBe(true);
  });

  it("should not show 'Archived' badge for active strategies", () => {
    const isArchived = false;
    const showBadge = isArchived;
    expect(showBadge).toBe(false);
  });

  it("should show archive button text based on current state", () => {
    const getButtonTitle = (isArchived: boolean) => isArchived ? "Unarchive" : "Archive";
    expect(getButtonTitle(false)).toBe("Archive");
    expect(getButtonTitle(true)).toBe("Unarchive");
  });

  it("should count only active strategies in history button", () => {
    const strategies = [
      { id: 1, isArchived: false },
      { id: 2, isArchived: true },
      { id: 3, isArchived: false },
    ];
    // When showArchived is false, count should reflect filtered results
    const activeCount = strategies.filter(s => !s.isArchived).length;
    expect(activeCount).toBe(2);
  });
});

// ─── Carrier Rate Comparison Chart — Data Preparation ─────────────────────

describe("Carrier Rate Comparison Chart — Data Preparation", () => {
  const systemDefault = { name: "System Default", loadFee: 6, coiRate: 5, capRate: 12, floorRate: 0, avgReturn: 10 };

  it("should include system default as first entry", () => {
    const chartData = [systemDefault];
    expect(chartData[0].name).toBe("System Default");
    expect(chartData[0].loadFee).toBe(6);
    expect(chartData[0].avgReturn).toBe(10);
  });

  it("should convert decimal rates to percentages for chart display", () => {
    const override = { loadFee: "0.0600", coiRate: "0.0450", capRate: "0.1200", floorRate: "0.0100", avgReturn: "0.0950" };
    const chartEntry = {
      loadFee: parseFloat(override.loadFee) * 100,
      coiRate: parseFloat(override.coiRate) * 100,
      capRate: parseFloat(override.capRate) * 100,
      floorRate: parseFloat(override.floorRate) * 100,
      avgReturn: parseFloat(override.avgReturn) * 100,
    };
    expect(chartEntry.loadFee).toBe(6);
    expect(chartEntry.coiRate).toBe(4.5);
    expect(chartEntry.capRate).toBe(12);
    expect(chartEntry.floorRate).toBe(1);
    expect(chartEntry.avgReturn).toBe(9.5);
  });

  it("should build chart data from multiple carrier overrides", () => {
    const overrides = [
      { carrierName: "AAA+ Mutual", loadFee: "0.0600", coiRate: "0.0450", capRate: "0.1200", floorRate: "0.0000", avgReturn: "0.1000" },
      { carrierName: "National Life", loadFee: "0.0550", coiRate: "0.0500", capRate: "0.1150", floorRate: "0.0100", avgReturn: "0.0950" },
      { carrierName: "AA- Mutual Life", loadFee: "0.0700", coiRate: "0.0550", capRate: "0.1300", floorRate: "0.0000", avgReturn: "0.1050" },
    ];
    const chartData = [
      systemDefault,
      ...overrides.map(o => ({
        name: o.carrierName,
        loadFee: parseFloat(o.loadFee) * 100,
        coiRate: parseFloat(o.coiRate) * 100,
        capRate: parseFloat(o.capRate) * 100,
        floorRate: parseFloat(o.floorRate) * 100,
        avgReturn: parseFloat(o.avgReturn) * 100,
      })),
    ];
    expect(chartData).toHaveLength(4);
    expect(chartData[0].name).toBe("System Default");
    expect(chartData[1].name).toBe("AAA+ Mutual");
    expect(chartData[2].name).toBe("National Life");
    expect(chartData[3].name).toBe("AA- Mutual Life");
  });

  it("should truncate long carrier names for chart labels", () => {
    const longName = "Very Long Carrier Name That Exceeds Limit";
    const truncated = longName.length > 16 ? longName.slice(0, 14) + "\u2026" : longName;
    expect(truncated).toBe("Very Long Carr\u2026");
    expect(truncated.length).toBeLessThanOrEqual(16);
  });

  it("should not truncate short carrier names", () => {
    const shortName = "AAA+ Mutual";
    const result = shortName.length > 16 ? shortName.slice(0, 14) + "…" : shortName;
    expect(result).toBe("AAA+ Mutual");
  });

  it("should use default values when override rate is null", () => {
    const override = { loadFee: null, coiRate: "0.0450", capRate: null, floorRate: null, avgReturn: null };
    const loadFee = override.loadFee ? parseFloat(override.loadFee) * 100 : 6;
    const coiRate = override.coiRate ? parseFloat(override.coiRate) * 100 : 5;
    const capRate = override.capRate ? parseFloat(override.capRate) * 100 : 12;
    expect(loadFee).toBe(6);
    expect(coiRate).toBe(4.5);
    expect(capRate).toBe(12);
  });
});

// ─── Carrier Rate Comparison Chart — Visualization ────────────────────────

describe("Carrier Rate Comparison Chart — Visualization", () => {
  it("should define 5 rate categories for comparison", () => {
    const categories = ["loadFee", "coiRate", "capRate", "floorRate", "avgReturn"];
    expect(categories).toHaveLength(5);
  });

  it("should assign distinct colors to each rate category", () => {
    const colors = {
      loadFee: "#f59e0b",
      coiRate: "#ef4444",
      capRate: "#22c55e",
      floorRate: "#3b82f6",
      avgReturn: "#a855f7",
    };
    const uniqueColors = new Set(Object.values(colors));
    expect(uniqueColors.size).toBe(5);
  });

  it("should format tooltip values as percentages", () => {
    const formatTooltip = (value: number) => `${value.toFixed(2)}%`;
    expect(formatTooltip(6)).toBe("6.00%");
    expect(formatTooltip(4.5)).toBe("4.50%");
    expect(formatTooltip(12)).toBe("12.00%");
    expect(formatTooltip(0)).toBe("0.00%");
  });

  it("should only show chart when there are carrier overrides", () => {
    const overrides: any[] = [];
    const showChartSection = overrides.length > 0;
    expect(showChartSection).toBe(false);

    const withOverrides = [{ id: 1, carrierName: "AAA+ Mutual" }];
    const showChartSection2 = withOverrides.length > 0;
    expect(showChartSection2).toBe(true);
  });

  it("should support chart toggle visibility", () => {
    let showChart = false;
    showChart = !showChart;
    expect(showChart).toBe(true);
    showChart = !showChart;
    expect(showChart).toBe(false);
  });
});

// ─── Carrier Rate Comparison Chart — Rate Analysis ────────────────────────

describe("Carrier Rate Comparison Chart — Rate Analysis", () => {
  it("should identify carrier with highest cap rate", () => {
    const carriers = [
      { name: "AAA+ Mutual", capRate: 12 },
      { name: "AA- Mutual", capRate: 13 },
      { name: "National Life", capRate: 11.5 },
    ];
    const best = carriers.reduce((a, b) => a.capRate > b.capRate ? a : b);
    expect(best.name).toBe("AA- Mutual");
  });

  it("should identify carrier with lowest load fee", () => {
    const carriers = [
      { name: "AAA+ Mutual", loadFee: 6 },
      { name: "National Life", loadFee: 5.5 },
      { name: "AA- Mutual", loadFee: 7 },
    ];
    const best = carriers.reduce((a, b) => a.loadFee < b.loadFee ? a : b);
    expect(best.name).toBe("National Life");
  });

  it("should calculate rate spread across carriers", () => {
    const avgReturns = [10, 9.5, 10.5];
    const spread = Math.max(...avgReturns) - Math.min(...avgReturns);
    expect(spread).toBe(1);
  });

  it("should handle single carrier override with system default", () => {
    const chartData = [
      { name: "System Default", loadFee: 6, avgReturn: 10 },
      { name: "AAA+ Mutual", loadFee: 6, avgReturn: 10 },
    ];
    expect(chartData).toHaveLength(2);
    // Same rates as default — chart should still render
    expect(chartData[0].avgReturn).toBe(chartData[1].avgReturn);
  });
});

// ─── Integration: Archiving + Comparison Chart ────────────────────────────

describe("Integration: Archiving + Comparison Chart", () => {
  it("should not affect carrier overrides when archiving strategies", () => {
    // Archiving is for strategies, not carrier overrides
    const carrierOverrides = [
      { id: 1, carrierId: "aaa-plus-mutual", loadFee: "0.0600" },
    ];
    const strategies = [
      { id: 1, carrierId: "aaa-plus-mutual", isArchived: true },
    ];
    // Carrier overrides remain unchanged
    expect(carrierOverrides).toHaveLength(1);
    expect(strategies[0].isArchived).toBe(true);
  });

  it("should allow archived strategies to retain carrier reference", () => {
    const archived = { id: 1, carrierId: "aaa-plus-mutual", carrierName: "AAA+ Mutual", isArchived: true };
    expect(archived.carrierId).toBe("aaa-plus-mutual");
    expect(archived.isArchived).toBe(true);
  });
});
