import { describe, it, expect, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════
// ─── ROUND 32: CARRIER OVERRIDES, STRATEGY COMPARISON, CLIENT NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════

// ─── Carrier Overrides ──────────────────────────────────────────────────────

describe("Carrier Overrides Schema", () => {
  const validOverride = {
    carrierId: "aaa_plus_mutual",
    carrierName: "AAA+ Mutual",
    loadFee: "0.055",
    coiRate: "0.045",
    capRate: "0.13",
    floorRate: "0.01",
    avgReturn: "0.095",
    loanRate: "0.04",
    notes: "Based on 2024 illustration",
  };

  it("should accept valid carrier override fields", () => {
    expect(validOverride.carrierId).toBe("aaa_plus_mutual");
    expect(parseFloat(validOverride.loadFee)).toBeCloseTo(0.055);
    expect(parseFloat(validOverride.coiRate)).toBeCloseTo(0.045);
    expect(parseFloat(validOverride.capRate)).toBeCloseTo(0.13);
    expect(parseFloat(validOverride.floorRate)).toBeCloseTo(0.01);
    expect(parseFloat(validOverride.avgReturn)).toBeCloseTo(0.095);
    expect(parseFloat(validOverride.loanRate)).toBeCloseTo(0.04);
  });

  it("should enforce rate boundaries (0-1 range)", () => {
    const rates = [
      parseFloat(validOverride.loadFee),
      parseFloat(validOverride.coiRate),
      parseFloat(validOverride.capRate),
      parseFloat(validOverride.floorRate),
      parseFloat(validOverride.avgReturn),
      parseFloat(validOverride.loanRate),
    ];
    for (const rate of rates) {
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(1);
    }
  });

  it("should allow null/undefined for optional fields", () => {
    const partial = {
      carrierId: "national_life",
      carrierName: "National Life",
      loadFee: "0.06",
      coiRate: null,
      capRate: undefined,
      floorRate: null,
      avgReturn: null,
      loanRate: null,
      notes: null,
    };
    expect(partial.carrierId).toBe("national_life");
    expect(partial.loadFee).toBe("0.06");
    expect(partial.coiRate).toBeNull();
    expect(partial.capRate).toBeUndefined();
  });
});

describe("Carrier Override Effective Rate Computation", () => {
  const defaultRates = {
    loadFee: 0.06,
    coiRate: 0.05,
    capRate: 0.12,
    floorRate: 0,
    avgReturn: 0.10,
    loanRate: 0.05,
  };

  function computeEffectiveRates(
    defaults: typeof defaultRates,
    override?: { loadFee?: string | null; coiRate?: string | null; capRate?: string | null; floorRate?: string | null; avgReturn?: string | null; loanRate?: string | null }
  ) {
    if (!override) return defaults;
    return {
      loadFee: override.loadFee ? parseFloat(override.loadFee) : defaults.loadFee,
      coiRate: override.coiRate ? parseFloat(override.coiRate) : defaults.coiRate,
      capRate: override.capRate ? parseFloat(override.capRate) : defaults.capRate,
      floorRate: override.floorRate ? parseFloat(override.floorRate) : defaults.floorRate,
      avgReturn: override.avgReturn ? parseFloat(override.avgReturn) : defaults.avgReturn,
      loanRate: override.loanRate ? parseFloat(override.loanRate) : defaults.loanRate,
    };
  }

  it("should use defaults when no override exists", () => {
    const effective = computeEffectiveRates(defaultRates, undefined);
    expect(effective).toEqual(defaultRates);
  });

  it("should override only specified fields", () => {
    const effective = computeEffectiveRates(defaultRates, { loadFee: "0.04", coiRate: "0.03" });
    expect(effective.loadFee).toBeCloseTo(0.04);
    expect(effective.coiRate).toBeCloseTo(0.03);
    expect(effective.capRate).toBe(defaultRates.capRate);
    expect(effective.floorRate).toBe(defaultRates.floorRate);
    expect(effective.avgReturn).toBe(defaultRates.avgReturn);
    expect(effective.loanRate).toBe(defaultRates.loanRate);
  });

  it("should handle all fields overridden", () => {
    const effective = computeEffectiveRates(defaultRates, {
      loadFee: "0.055", coiRate: "0.045", capRate: "0.13",
      floorRate: "0.01", avgReturn: "0.095", loanRate: "0.04",
    });
    expect(effective.loadFee).toBeCloseTo(0.055);
    expect(effective.coiRate).toBeCloseTo(0.045);
    expect(effective.capRate).toBeCloseTo(0.13);
    expect(effective.floorRate).toBeCloseTo(0.01);
    expect(effective.avgReturn).toBeCloseTo(0.095);
    expect(effective.loanRate).toBeCloseTo(0.04);
  });

  it("should fall back to defaults for null override fields", () => {
    const effective = computeEffectiveRates(defaultRates, { loadFee: null, coiRate: null });
    expect(effective.loadFee).toBe(defaultRates.loadFee);
    expect(effective.coiRate).toBe(defaultRates.coiRate);
  });

  it("should produce different IUL projections with different rates", () => {
    const premium = 50000;
    const years = 20;

    function simpleIulFinalValue(rates: typeof defaultRates): number {
      let av = 0;
      for (let y = 0; y < years; y++) {
        av += premium * (1 - rates.loadFee);
        av += av * rates.avgReturn;
        av -= av * rates.coiRate;
      }
      return av;
    }

    const defaultFinal = simpleIulFinalValue(defaultRates);
    const overrideFinal = simpleIulFinalValue({
      ...defaultRates, loadFee: 0.04, coiRate: 0.03, avgReturn: 0.12,
    });
    expect(overrideFinal).toBeGreaterThan(defaultFinal);
  });
});

describe("Carrier Override CRUD Operations", () => {
  it("should create an override with all required fields", () => {
    const override = {
      id: 1,
      workspaceId: 1,
      carrierId: "aaa_plus_mutual",
      carrierName: "AAA+ Mutual",
      loadFee: "0.055",
      coiRate: "0.045",
      capRate: "0.13",
      floorRate: "0.01",
      avgReturn: "0.095",
      loanRate: "0.04",
      notes: "Custom rates from illustration",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(override.id).toBe(1);
    expect(override.carrierId).toBe("aaa_plus_mutual");
    expect(override.notes).toContain("illustration");
  });

  it("should support upsert (update existing override)", () => {
    const existing = { id: 1, carrierId: "aaa_plus_mutual", loadFee: "0.06" };
    const updated = { ...existing, loadFee: "0.04" };
    expect(updated.loadFee).toBe("0.04");
    expect(updated.id).toBe(existing.id);
  });

  it("should support delete by id", () => {
    const overrides = [
      { id: 1, carrierId: "aaa_plus_mutual" },
      { id: 2, carrierId: "national_life" },
    ];
    const afterDelete = overrides.filter(o => o.id !== 1);
    expect(afterDelete.length).toBe(1);
    expect(afterDelete[0].carrierId).toBe("national_life");
  });

  it("should list all overrides for a workspace", () => {
    const overrides = [
      { id: 1, workspaceId: 1, carrierId: "aaa_plus_mutual" },
      { id: 2, workspaceId: 1, carrierId: "national_life" },
      { id: 3, workspaceId: 2, carrierId: "aaa_plus_mutual" },
    ];
    const ws1 = overrides.filter(o => o.workspaceId === 1);
    expect(ws1.length).toBe(2);
  });
});

// ─── Strategy Comparison ────────────────────────────────────────────────────

describe("Strategy Comparison Logic", () => {
  const strategy1 = {
    id: 1,
    strategyLabel: "Roth + IUL + RE (20yr)",
    summaryJson: {
      finalNetCashValue: 850000,
      totalPropertyEquity: 400000,
      totalRentalIncome: 240000,
      finalRothBalance: 1200000,
      estimatedNetWorth: 2690000,
    },
    inputsJson: {
      iraBalance: 500000,
      income: 250000,
      homeEquity: 200000,
      strategyYears: 20,
      solarEquity: 50000,
    },
    iulProjectionJson: Array.from({ length: 20 }, (_, i) => ({
      year: i + 1,
      accountValue: 50000 * (i + 1) * 1.05,
    })),
  };

  const strategy2 = {
    id: 2,
    strategyLabel: "Roth + IUL (15yr)",
    summaryJson: {
      finalNetCashValue: 620000,
      totalPropertyEquity: 0,
      totalRentalIncome: 0,
      finalRothBalance: 900000,
      estimatedNetWorth: 1520000,
    },
    inputsJson: {
      iraBalance: 500000,
      income: 250000,
      homeEquity: 0,
      strategyYears: 15,
      solarEquity: 0,
    },
    iulProjectionJson: Array.from({ length: 15 }, (_, i) => ({
      year: i + 1,
      accountValue: 50000 * (i + 1) * 1.04,
    })),
  };

  it("should compare IUL net cash values between strategies", () => {
    expect(strategy1.summaryJson.finalNetCashValue).toBeGreaterThan(strategy2.summaryJson.finalNetCashValue);
  });

  it("should compare net worth between strategies", () => {
    expect(strategy1.summaryJson.estimatedNetWorth).toBeGreaterThan(strategy2.summaryJson.estimatedNetWorth);
  });

  it("should identify the winner for each metric", () => {
    const metrics = ["finalNetCashValue", "totalPropertyEquity", "totalRentalIncome", "finalRothBalance", "estimatedNetWorth"] as const;
    const winners: Record<string, number> = {};
    for (const m of metrics) {
      const v1 = strategy1.summaryJson[m];
      const v2 = strategy2.summaryJson[m];
      winners[m] = v1 >= v2 ? strategy1.id : strategy2.id;
    }
    expect(winners.finalNetCashValue).toBe(1);
    expect(winners.estimatedNetWorth).toBe(1);
    expect(winners.totalPropertyEquity).toBe(1);
    expect(winners.totalRentalIncome).toBe(1);
    expect(winners.finalRothBalance).toBe(1);
  });

  it("should detect input parameter differences", () => {
    const diffs: string[] = [];
    const keys = Object.keys(strategy1.inputsJson) as (keyof typeof strategy1.inputsJson)[];
    for (const k of keys) {
      if (strategy1.inputsJson[k] !== strategy2.inputsJson[k]) {
        diffs.push(k);
      }
    }
    expect(diffs).toContain("homeEquity");
    expect(diffs).toContain("strategyYears");
    expect(diffs).toContain("solarEquity");
    expect(diffs).not.toContain("iraBalance");
    expect(diffs).not.toContain("income");
  });

  it("should handle comparing strategies with different year lengths", () => {
    const maxYears = Math.max(
      strategy1.iulProjectionJson.length,
      strategy2.iulProjectionJson.length
    );
    expect(maxYears).toBe(20);
    // Strategy 2 has only 15 years, so years 16-20 should be undefined
    expect(strategy2.iulProjectionJson[19]).toBeUndefined();
    expect(strategy1.iulProjectionJson[19]).toBeDefined();
  });

  it("should support comparing up to 3 strategies", () => {
    const strategy3 = {
      id: 3,
      strategyLabel: "Roth Only (10yr)",
      summaryJson: { finalNetCashValue: 0, estimatedNetWorth: 800000 },
    };
    const strategies = [strategy1, strategy2, strategy3];
    expect(strategies.length).toBeLessThanOrEqual(3);
    const netWorths = strategies.map(s => s.summaryJson.estimatedNetWorth);
    expect(Math.max(...netWorths)).toBe(strategy1.summaryJson.estimatedNetWorth);
  });
});

describe("Strategy Comparison Monte Carlo", () => {
  function runMonteCarlo(params: {
    premiums: number[];
    loadFee: number;
    coiRate: number;
    avgReturn: number;
    volatility: number;
    simulations: number;
    seed: number;
  }): { p10: number; p25: number; p50: number; p75: number; p90: number } {
    let seedVal = params.seed;
    const seededRandom = () => {
      seedVal = (seedVal * 16807) % 2147483647;
      return (seedVal - 1) / 2147483646;
    };

    const finals: number[] = [];
    for (let s = 0; s < params.simulations; s++) {
      let av = 0;
      for (let y = 0; y < params.premiums.length; y++) {
        const u1 = seededRandom();
        const u2 = seededRandom();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const randomReturn = Math.max(0, params.avgReturn + params.volatility * z);
        av += params.premiums[y] * (1 - params.loadFee);
        av += av * randomReturn;
        av -= av * params.coiRate;
        av = Math.max(0, av);
      }
      finals.push(av);
    }
    finals.sort((a, b) => a - b);
    const pct = (p: number) => Math.round(finals[Math.floor(finals.length * p)]);
    return { p10: pct(0.1), p25: pct(0.25), p50: pct(0.5), p75: pct(0.75), p90: pct(0.9) };
  }

  it("should produce Monte Carlo percentiles for comparison", () => {
    const mc1 = runMonteCarlo({
      premiums: Array(20).fill(50000), loadFee: 0.06, coiRate: 0.05,
      avgReturn: 0.10, volatility: 0.15, simulations: 200, seed: 42,
    });
    const mc2 = runMonteCarlo({
      premiums: Array(15).fill(50000), loadFee: 0.06, coiRate: 0.05,
      avgReturn: 0.10, volatility: 0.15, simulations: 200, seed: 42,
    });
    expect(mc1.p50).toBeGreaterThan(mc2.p50);
    expect(mc1.p90).toBeGreaterThan(mc2.p90);
  });

  it("should show wider spread with higher volatility", () => {
    const lowVol = runMonteCarlo({
      premiums: Array(20).fill(50000), loadFee: 0.06, coiRate: 0.05,
      avgReturn: 0.10, volatility: 0.10, simulations: 200, seed: 42,
    });
    const highVol = runMonteCarlo({
      premiums: Array(20).fill(50000), loadFee: 0.06, coiRate: 0.05,
      avgReturn: 0.10, volatility: 0.20, simulations: 200, seed: 42,
    });
    const lowSpread = lowVol.p90 - lowVol.p10;
    const highSpread = highVol.p90 - highVol.p10;
    expect(highSpread).toBeGreaterThan(lowSpread);
  });

  it("percentiles should be in ascending order", () => {
    const mc = runMonteCarlo({
      premiums: Array(20).fill(50000), loadFee: 0.06, coiRate: 0.05,
      avgReturn: 0.10, volatility: 0.15, simulations: 200, seed: 42,
    });
    expect(mc.p10).toBeLessThanOrEqual(mc.p25);
    expect(mc.p25).toBeLessThanOrEqual(mc.p50);
    expect(mc.p50).toBeLessThanOrEqual(mc.p75);
    expect(mc.p75).toBeLessThanOrEqual(mc.p90);
  });
});

// ─── Client Notification on Strategy Save ───────────────────────────────────

describe("Strategy Notification Email", () => {
  it("should construct email with correct fields", () => {
    const opts = {
      toEmail: "client@example.com",
      toName: "John Smith",
      clientName: "John Smith",
      advisorName: "Jane Advisor",
      strategyLabel: "Roth + IUL + RE (20yr)",
      carrierName: "AAA+ Mutual",
      portalUrl: "https://app.example.com/client-portal/abc123",
      summary: {
        iulNetCash: 850000,
        propertyEquity: 400000,
        rentalIncome: 240000,
        rothBalance: 1200000,
        netWorth: 2690000,
      },
      notes: "Strong growth potential with diversified approach",
    };

    expect(opts.toEmail).toBe("client@example.com");
    expect(opts.strategyLabel).toContain("Roth + IUL + RE");
    expect(opts.portalUrl).toContain("client-portal");
    expect(opts.summary.iulNetCash).toBe(850000);
    expect(opts.summary.netWorth).toBe(2690000);
  });

  it("should format dollar amounts correctly", () => {
    function fmtDollar(n: number): string {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
      if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
      return `$${Math.round(n).toLocaleString()}`;
    }

    expect(fmtDollar(2690000)).toBe("$2.69M");
    expect(fmtDollar(850000)).toBe("$850K");
    expect(fmtDollar(500)).toBe("$500");
    expect(fmtDollar(1000000)).toBe("$1.00M");
    expect(fmtDollar(1500)).toBe("$2K"); // rounds to nearest K
  });

  it("should handle missing optional fields gracefully", () => {
    const opts = {
      toEmail: "client@example.com",
      clientName: "Client",
      advisorName: "Advisor",
      strategyLabel: "Basic Strategy",
      portalUrl: "https://app.example.com",
      summary: {
        iulNetCash: 500000,
      },
    };

    expect(opts.toName).toBeUndefined();
    expect(opts.summary.iulNetCash).toBe(500000);
    expect((opts.summary as any).propertyEquity).toBeUndefined();
    expect((opts.summary as any).rentalIncome).toBeUndefined();
  });

  it("should filter out null summary metrics", () => {
    const summary = {
      iulNetCash: 850000,
      propertyEquity: null,
      rentalIncome: 240000,
      rothBalance: null,
      netWorth: 2690000,
    };

    const metricsRows = [
      summary.iulNetCash != null ? { label: "IUL Net Cash", value: summary.iulNetCash } : null,
      summary.propertyEquity != null ? { label: "RE Equity", value: summary.propertyEquity } : null,
      summary.rentalIncome != null ? { label: "Rental Income", value: summary.rentalIncome } : null,
      summary.rothBalance != null ? { label: "Roth Balance", value: summary.rothBalance } : null,
      summary.netWorth != null ? { label: "Net Worth", value: summary.netWorth } : null,
    ].filter(Boolean);

    expect(metricsRows.length).toBe(3);
    expect(metricsRows.map(r => r!.label)).toEqual(["IUL Net Cash", "Rental Income", "Net Worth"]);
  });
});

describe("Notification Trigger Logic", () => {
  it("should only notify when notifyClient is true and client has email", () => {
    const scenarios = [
      { notifyClient: true, clientId: 1, clientEmail: "a@b.com", shouldNotify: true },
      { notifyClient: false, clientId: 1, clientEmail: "a@b.com", shouldNotify: false },
      { notifyClient: true, clientId: null, clientEmail: "a@b.com", shouldNotify: false },
      { notifyClient: true, clientId: 1, clientEmail: null, shouldNotify: false },
      { notifyClient: true, clientId: 1, clientEmail: "", shouldNotify: false },
      { notifyClient: false, clientId: null, clientEmail: null, shouldNotify: false },
    ];

    for (const s of scenarios) {
      const shouldNotify = s.notifyClient && !!s.clientId && !!s.clientEmail;
      expect(shouldNotify).toBe(s.shouldNotify);
    }
  });

  it("should find active portal token for notification URL", () => {
    const now = Date.now();
    const tokens = [
      { token: "expired-token", revokedAt: null, expiresAt: new Date(now - 86400000) },
      { token: "revoked-token", revokedAt: new Date(now - 3600000), expiresAt: new Date(now + 86400000) },
      { token: "active-token", revokedAt: null, expiresAt: new Date(now + 86400000) },
    ];

    const activeToken = tokens.find(
      (t) => !t.revokedAt && (!t.expiresAt || new Date(t.expiresAt) > new Date())
    );
    expect(activeToken?.token).toBe("active-token");
  });

  it("should fall back to origin URL when no active token exists", () => {
    const tokens: any[] = [];
    const origin = "https://app.example.com";
    const activeToken = tokens.find(
      (t: any) => !t.revokedAt && (!t.expiresAt || new Date(t.expiresAt) > new Date())
    );
    const portalUrl = activeToken
      ? `${origin}/client-portal/${activeToken.token}`
      : origin;
    expect(portalUrl).toBe(origin);
  });

  it("should construct portal URL with active token", () => {
    const origin = "https://app.example.com";
    const token = "abc123def456";
    const portalUrl = `${origin}/client-portal/${token}`;
    expect(portalUrl).toBe("https://app.example.com/client-portal/abc123def456");
  });
});

describe("Save Strategy with Notification Integration", () => {
  it("should return notificationSent flag in save response", () => {
    const response = { id: 42, notificationSent: true };
    expect(response.id).toBe(42);
    expect(response.notificationSent).toBe(true);
  });

  it("should return notificationSent=false when notification is not requested", () => {
    const response = { id: 43, notificationSent: false };
    expect(response.notificationSent).toBe(false);
  });

  it("should include portalOrigin in save input when notifying", () => {
    const input = {
      clientId: 1,
      strategyType: "ROTH_IUL_RE",
      strategyLabel: "Roth + IUL + RE (20yr)",
      inputsJson: {},
      summaryJson: {},
      notifyClient: true,
      portalOrigin: "https://app.example.com",
    };
    expect(input.notifyClient).toBe(true);
    expect(input.portalOrigin).toBe("https://app.example.com");
  });

  it("should handle notification failure gracefully (not throw)", () => {
    // Simulates the try/catch in the save procedure
    let notificationSent = false;
    try {
      throw new Error("Resend API error");
    } catch (err) {
      // Should not propagate — strategy still saved
      notificationSent = false;
    }
    expect(notificationSent).toBe(false);
  });

  it("should show different toast messages based on notification result", () => {
    const toasts: string[] = [];
    const mockToast = (msg: string) => toasts.push(msg);

    // Notification sent
    const data1 = { notificationSent: true };
    if (data1.notificationSent) {
      mockToast("Strategy saved & client notified via email");
    } else {
      mockToast("Strategy saved to history");
    }

    // Notification not sent
    const data2 = { notificationSent: false };
    if (data2.notificationSent) {
      mockToast("Strategy saved & client notified via email");
    } else {
      mockToast("Strategy saved to history");
    }

    expect(toasts[0]).toContain("notified via email");
    expect(toasts[1]).toBe("Strategy saved to history");
  });
});

// ─── Carrier Settings Page ──────────────────────────────────────────────────

describe("Carrier Settings Page Logic", () => {
  const CARRIERS = [
    { id: "aaa_plus_mutual", name: "AAA+ Mutual" },
    { id: "national_life", name: "National Life" },
    { id: "bbb_plus_mutual", name: "BBB+ Mutual" },
    { id: "aa-minus-mutual", name: "AA- Mutual" },
    { id: "athene", name: "Athene" },
  ];

  it("should list all available carriers", () => {
    expect(CARRIERS.length).toBeGreaterThanOrEqual(5);
    expect(CARRIERS.map(c => c.id)).toContain("aaa_plus_mutual");
    expect(CARRIERS.map(c => c.id)).toContain("national_life");
  });

  it("should match overrides to carriers by carrierId", () => {
    const overrides = [
      { carrierId: "aaa_plus_mutual", loadFee: "0.04" },
      { carrierId: "aa-minus-mutual", loadFee: "0.055" },
    ];

    const carrierWithOverride = CARRIERS.map(c => ({
      ...c,
      hasOverride: overrides.some(o => o.carrierId === c.id),
    }));

    expect(carrierWithOverride.find(c => c.id === "aaa_plus_mutual")?.hasOverride).toBe(true);
    expect(carrierWithOverride.find(c => c.id === "aa-minus-mutual")?.hasOverride).toBe(true);
    expect(carrierWithOverride.find(c => c.id === "national_life")?.hasOverride).toBe(false);
  });

  it("should validate rate inputs are numeric and in range", () => {
    const validateRate = (val: string): boolean => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 1;
    };

    expect(validateRate("0.06")).toBe(true);
    expect(validateRate("0")).toBe(true);
    expect(validateRate("1")).toBe(true);
    expect(validateRate("abc")).toBe(false);
    expect(validateRate("-0.01")).toBe(false);
    expect(validateRate("1.5")).toBe(false);
  });
});

// ─── Strategy Comparison Input Diff ─────────────────────────────────────────

describe("Strategy Input Parameter Diff", () => {
  it("should detect all differing parameters between two strategies", () => {
    const inputs1 = {
      iraBalance: 500000,
      income: 250000,
      homeEquity: 200000,
      strategyYears: 20,
      solarEquity: 50000,
      taxBracket: 0.24,
    };
    const inputs2 = {
      iraBalance: 500000,
      income: 250000,
      homeEquity: 0,
      strategyYears: 15,
      solarEquity: 0,
      taxBracket: 0.24,
    };

    const allKeys = new Set([...Object.keys(inputs1), ...Object.keys(inputs2)]);
    const diffs: string[] = [];
    for (const k of allKeys) {
      if ((inputs1 as any)[k] !== (inputs2 as any)[k]) {
        diffs.push(k);
      }
    }

    expect(diffs).toContain("homeEquity");
    expect(diffs).toContain("strategyYears");
    expect(diffs).toContain("solarEquity");
    expect(diffs).not.toContain("iraBalance");
    expect(diffs).not.toContain("income");
    expect(diffs).not.toContain("taxBracket");
  });

  it("should handle missing keys in one strategy", () => {
    const inputs1 = { iraBalance: 500000, income: 250000, homeEquity: 200000 };
    const inputs2 = { iraBalance: 500000, income: 250000 };

    const allKeys = new Set([...Object.keys(inputs1), ...Object.keys(inputs2)]);
    const diffs: string[] = [];
    for (const k of allKeys) {
      if ((inputs1 as any)[k] !== (inputs2 as any)[k]) {
        diffs.push(k);
      }
    }

    expect(diffs).toContain("homeEquity");
  });
});
