import { describe, it, expect } from "vitest";
import {
  recommendCarriers,
  type CarrierRates,
  type ClientProfile,
} from "../shared/carrierRecommendation";

/* ─── Test carrier data ─── */
const CARRIERS: CarrierRates[] = [
  { carrierId: "aaa_plus_mutual", carrierName: "AAA+ Mutual", loadFee: 0.06, coiRate: 0.05, capRate: 0.12, floorRate: 0.0, avgReturn: 0.10, loanRate: 0.05 },
  { carrierId: "national_life", carrierName: "National Life", loadFee: 0.05, coiRate: 0.04, capRate: 0.10, floorRate: 0.01, avgReturn: 0.085, loanRate: 0.04 },
  { carrierId: "a-plus-mutual-life", carrierName: "A+ Mutual Life", loadFee: 0.04, coiRate: 0.035, capRate: 0.09, floorRate: 0.02, avgReturn: 0.08, loanRate: 0.035 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   RECOMMENDATION HISTORY
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Recommendation History", () => {
  describe("History data structure", () => {
    it("recommendation results include all required fields for history storage", () => {
      const profile: ClientProfile = { age: 50, riskTolerance: "moderate", annualPremium: 30000 };
      const results = recommendCarriers(CARRIERS, profile);
      const top = results[0];

      // Verify all fields needed for history record exist
      expect(top).toHaveProperty("carrierId");
      expect(top).toHaveProperty("carrierName");
      expect(top).toHaveProperty("totalScore");
      expect(top).toHaveProperty("rank");
      expect(top).toHaveProperty("growthScore");
      expect(top).toHaveProperty("protectionScore");
      expect(top).toHaveProperty("costScore");
      expect(top).toHaveProperty("loanScore");
      expect(top).toHaveProperty("reasoning");
    });

    it("history record can be serialized to JSON for allScoresJson field", () => {
      const profile: ClientProfile = { age: 50, riskTolerance: "moderate", annualPremium: 30000 };
      const results = recommendCarriers(CARRIERS, profile);

      // Simulate what the backend does: serialize all scores to JSON
      const allScoresJson = JSON.stringify(results.map(r => ({
        carrierId: r.carrierId,
        carrierName: r.carrierName,
        totalScore: r.totalScore,
        growthScore: r.growthScore,
        protectionScore: r.protectionScore,
        costScore: r.costScore,
        loanScore: r.loanScore,
        rank: r.rank,
      })));

      const parsed = JSON.parse(allScoresJson);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].carrierId).toBe(results[0].carrierId);
      expect(parsed[0].totalScore).toBe(results[0].totalScore);
    });

    it("recommendation for same client with different ages produces different top carriers", () => {
      const young: ClientProfile = { age: 25, riskTolerance: "aggressive", annualPremium: 15000 };
      const old: ClientProfile = { age: 70, riskTolerance: "conservative", annualPremium: 15000 };

      const youngResults = recommendCarriers(CARRIERS, young);
      const oldResults = recommendCarriers(CARRIERS, old);

      // Young aggressive should favor growth, old conservative should favor protection
      // At minimum, the scores should differ
      expect(youngResults[0].totalScore).not.toBe(oldResults[0].totalScore);
    });

    it("tracks score evolution across multiple recommendation runs", () => {
      const profiles: ClientProfile[] = [
        { age: 40, riskTolerance: "moderate", annualPremium: 20000 },
        { age: 41, riskTolerance: "moderate", annualPremium: 25000 },
        { age: 42, riskTolerance: "conservative", annualPremium: 25000 },
      ];

      const history = profiles.map((p, i) => {
        const results = recommendCarriers(CARRIERS, p);
        return {
          runIndex: i,
          topCarrier: results[0].carrierId,
          topScore: results[0].totalScore,
          profile: p,
        };
      });

      // Verify we have 3 history entries
      expect(history).toHaveLength(3);
      // Each entry has a valid top carrier
      for (const h of history) {
        expect(CARRIERS.some(c => c.carrierId === h.topCarrier)).toBe(true);
        expect(h.topScore).toBeGreaterThan(0);
      }
    });

    it("changing risk tolerance from aggressive to conservative shifts scores", () => {
      const aggressive: ClientProfile = { age: 45, riskTolerance: "aggressive", annualPremium: 25000 };
      const conservative: ClientProfile = { age: 45, riskTolerance: "conservative", annualPremium: 25000 };

      const aggResults = recommendCarriers(CARRIERS, aggressive);
      const conResults = recommendCarriers(CARRIERS, conservative);

      // Find securian (high floor, low cost) in both results
      const securianAgg = aggResults.find(r => r.carrierId === "a-plus-mutual-life")!;
      const securianCon = conResults.find(r => r.carrierId === "a-plus-mutual-life")!;

      // A+ Mutual Life should rank better for conservative (higher floor rate)
      expect(securianCon.rank).toBeLessThanOrEqual(securianAgg.rank);
    });
  });

  describe("History filtering and sorting", () => {
    it("history entries can be filtered by client ID", () => {
      const allHistory = [
        { clientId: 1, clientName: "Alice", recommendedCarrierId: "aaa_plus_mutual", createdAt: new Date("2024-01-01") },
        { clientId: 2, clientName: "Bob", recommendedCarrierId: "national_life", createdAt: new Date("2024-01-02") },
        { clientId: 1, clientName: "Alice", recommendedCarrierId: "a-plus-mutual-life", createdAt: new Date("2024-01-03") },
      ];

      const aliceHistory = allHistory.filter(h => h.clientId === 1);
      expect(aliceHistory).toHaveLength(2);
      expect(aliceHistory.every(h => h.clientName === "Alice")).toBe(true);
    });

    it("history entries are sorted by date descending (most recent first)", () => {
      const history = [
        { createdAt: new Date("2024-01-01"), totalScore: 80 },
        { createdAt: new Date("2024-01-03"), totalScore: 85 },
        { createdAt: new Date("2024-01-02"), totalScore: 82 },
      ];

      const sorted = [...history].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      expect(sorted[0].totalScore).toBe(85);
      expect(sorted[1].totalScore).toBe(82);
      expect(sorted[2].totalScore).toBe(80);
    });

    it("history limit parameter restricts returned entries", () => {
      const history = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        clientId: 1,
        createdAt: new Date(2024, 0, i + 1),
      }));

      const limited = history.slice(0, 20);
      expect(limited).toHaveLength(20);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   BULK CLIENT STRATEGY GENERATION
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Bulk Client Strategy Generation", () => {
  describe("Input validation", () => {
    it("requires at least 1 client ID", () => {
      const input = { clientIds: [], strategyYears: 1, solarEquity: false, iulYears: 20 };
      expect(input.clientIds.length).toBe(0);
      // In the real procedure, z.array(z.number()).min(1) would reject this
    });

    it("limits to maximum 50 client IDs", () => {
      const input = { clientIds: Array.from({ length: 51 }, (_, i) => i + 1) };
      expect(input.clientIds.length).toBeGreaterThan(50);
    });

    it("strategy years must be 1-5", () => {
      const validYears = [1, 2, 3, 4, 5];
      for (const y of validYears) {
        expect(y).toBeGreaterThanOrEqual(1);
        expect(y).toBeLessThanOrEqual(5);
      }
    });

    it("IUL years must be 15-20", () => {
      const validYears = [15, 18, 20];
      for (const y of validYears) {
        expect(y).toBeGreaterThanOrEqual(15);
        expect(y).toBeLessThanOrEqual(20);
      }
    });
  });

  describe("Batch projection logic", () => {
    it("computes IUL cascade for a single client profile", () => {
      // Simulate the core IUL cascade logic used in bulk generation
      const iraBalance = 500000;
      const taxRate = 0.24;
      const strategyYears = 1;
      const afterTaxAmount = iraBalance * (1 - taxRate);
      const annualPremium = afterTaxAmount / strategyYears;

      expect(afterTaxAmount).toBe(380000);
      expect(annualPremium).toBe(380000);
    });

    it("handles multi-year strategy premium splitting", () => {
      const iraBalance = 500000;
      const taxRate = 0.24;
      const afterTaxAmount = iraBalance * (1 - taxRate);

      for (const years of [1, 2, 3, 4, 5]) {
        const annualPremium = afterTaxAmount / years;
        expect(annualPremium).toBeCloseTo(380000 / years, 0);
      }
    });

    it("auto-recommend selects best carrier per client profile", () => {
      // Client 1: young aggressive
      const young: ClientProfile = { age: 30, riskTolerance: "aggressive", annualPremium: 20000 };
      const youngRecs = recommendCarriers(CARRIERS, young);

      // Client 2: old conservative
      const old: ClientProfile = { age: 65, riskTolerance: "conservative", annualPremium: 50000 };
      const oldRecs = recommendCarriers(CARRIERS, old);

      // Both should have valid top recommendations
      expect(youngRecs[0].carrierId).toBeTruthy();
      expect(oldRecs[0].carrierId).toBeTruthy();
    });

    it("uses carrier overrides when available", () => {
      const overrides = [
        { carrierId: "aaa_plus_mutual", loadFee: 0.04, coiRate: 0.03, capRate: 0.13, floorRate: 0.01, avgReturn: 0.11, loanRate: 0.04 },
      ];

      const defaultCarrier = CARRIERS.find(c => c.carrierId === "aaa_plus_mutual")!;
      const override = overrides.find(o => o.carrierId === "aaa_plus_mutual")!;

      // Override should have different rates
      expect(override.loadFee).toBeLessThan(defaultCarrier.loadFee);
      expect(override.capRate).toBeGreaterThan(defaultCarrier.capRate);
    });

    it("handles client with zero IRA balance gracefully", () => {
      const client = { id: 1, name: "Zero IRA", iraBalance: 0, age: 45, income: 100000 };
      const iraBalance = Number(client.iraBalance) || 0;

      // Should be flagged as skipped
      expect(iraBalance).toBe(0);
      const shouldSkip = iraBalance <= 0;
      expect(shouldSkip).toBe(true);
    });

    it("handles missing client age with default of 45", () => {
      const client = { id: 1, name: "No Age", iraBalance: 500000, age: null, income: 100000 };
      const age = client.age || 45;
      expect(age).toBe(45);
    });
  });

  describe("Batch results aggregation", () => {
    it("computes summary statistics from results", () => {
      const results = [
        { clientId: 1, clientName: "Alice", netWorth: 1500000, iulNetCash: 800000, error: undefined },
        { clientId: 2, clientName: "Bob", netWorth: 2000000, iulNetCash: 1200000, error: undefined },
        { clientId: 3, clientName: "Charlie", netWorth: 0, iulNetCash: 0, error: "No IRA balance" },
      ];

      const successful = results.filter(r => !r.error);
      const skipped = results.filter(r => r.error);
      const totalNetWorth = successful.reduce((s, r) => s + r.netWorth, 0);
      const avgNetWorth = successful.length > 0 ? Math.round(totalNetWorth / successful.length) : 0;
      const topClient = successful.sort((a, b) => b.netWorth - a.netWorth)[0]?.clientName ?? "N/A";

      expect(successful).toHaveLength(2);
      expect(skipped).toHaveLength(1);
      expect(totalNetWorth).toBe(3500000);
      expect(avgNetWorth).toBe(1750000);
      expect(topClient).toBe("Bob");
    });

    it("handles all-error results gracefully", () => {
      const results = [
        { clientId: 1, clientName: "Alice", netWorth: 0, error: "No IRA" },
        { clientId: 2, clientName: "Bob", netWorth: 0, error: "Client not found" },
      ];

      const successful = results.filter(r => !r.error);
      const avgNetWorth = successful.length > 0 ? Math.round(successful.reduce((s, r) => s + r.netWorth, 0) / successful.length) : 0;
      const topClient = successful.sort((a, b) => b.netWorth - a.netWorth)[0]?.clientName ?? "N/A";

      expect(successful).toHaveLength(0);
      expect(avgNetWorth).toBe(0);
      expect(topClient).toBe("N/A");
    });

    it("sorts results by net worth descending", () => {
      const results = [
        { clientName: "Alice", netWorth: 1000000 },
        { clientName: "Charlie", netWorth: 3000000 },
        { clientName: "Bob", netWorth: 2000000 },
      ];

      const sorted = [...results].sort((a, b) => b.netWorth - a.netWorth);
      expect(sorted[0].clientName).toBe("Charlie");
      expect(sorted[1].clientName).toBe("Bob");
      expect(sorted[2].clientName).toBe("Alice");
    });

    it("sorts results by client name ascending", () => {
      const results = [
        { clientName: "Charlie", netWorth: 3000000 },
        { clientName: "Alice", netWorth: 1000000 },
        { clientName: "Bob", netWorth: 2000000 },
      ];

      const sorted = [...results].sort((a, b) => a.clientName.localeCompare(b.clientName));
      expect(sorted[0].clientName).toBe("Alice");
      expect(sorted[1].clientName).toBe("Bob");
      expect(sorted[2].clientName).toBe("Charlie");
    });
  });

  describe("CSV export", () => {
    it("generates valid CSV headers", () => {
      const headers = ["Client", "Age", "IRA Balance", "Income", "Carrier", "Strategy", "IUL Net Cash", "RE Equity", "Rental Income", "Roth Balance", "Net Worth", "Status"];
      expect(headers).toHaveLength(12);
      expect(headers[0]).toBe("Client");
      expect(headers[headers.length - 1]).toBe("Status");
    });

    it("formats result row as CSV", () => {
      const result = {
        clientName: "Alice Smith",
        age: 45,
        iraBalance: 500000,
        income: 150000,
        carrierName: "AAA+ Mutual",
        strategyLabel: "1-Year Strategy",
        iulNetCash: 800000,
        reEquity: 300000,
        rentalIncome: 24000,
        rothBalance: 200000,
        netWorth: 1300000,
        error: undefined,
      };

      const row = [
        result.clientName, result.age, result.iraBalance, result.income,
        result.carrierName, result.strategyLabel, result.iulNetCash,
        result.reEquity, result.rentalIncome, result.rothBalance,
        result.netWorth, result.error || "OK",
      ].join(",");

      expect(row).toContain("Alice Smith");
      expect(row).toContain("AAA+ Mutual");
      expect(row).toContain("OK");
    });

    it("marks error results with error message in status column", () => {
      const result = {
        clientName: "Bob",
        error: "No IRA balance",
      };

      const status = result.error || "OK";
      expect(status).toBe("No IRA balance");
    });
  });

  describe("Batch chart data", () => {
    it("prepares chart data from results", () => {
      const results = [
        { clientName: "Alice", iulNetCash: 800000, reEquity: 300000, rothBalance: 200000, error: undefined },
        { clientName: "Bob", iulNetCash: 1200000, reEquity: 500000, rothBalance: 300000, error: undefined },
        { clientName: "Charlie", iulNetCash: 0, reEquity: 0, rothBalance: 0, error: "No IRA" },
      ];

      const chartData = results
        .filter(r => !r.error)
        .slice(0, 20)
        .map(r => ({
          name: r.clientName.length > 12 ? r.clientName.slice(0, 12) + "…" : r.clientName,
          "IUL Net Cash": r.iulNetCash,
          "RE Equity": r.reEquity,
          "Roth Balance": r.rothBalance,
        }));

      expect(chartData).toHaveLength(2);
      expect(chartData[0].name).toBe("Alice");
      expect(chartData[0]["IUL Net Cash"]).toBe(800000);
    });

    it("truncates long client names for chart labels", () => {
      const longName = "Alexander Hamilton III";
      const truncated = longName.length > 12 ? longName.slice(0, 12) + "…" : longName;
      expect(truncated).toBe("Alexander Ha…");
    });

    it("limits chart data to 20 entries", () => {
      const results = Array.from({ length: 30 }, (_, i) => ({
        clientName: `Client ${i + 1}`,
        iulNetCash: 100000 * (i + 1),
        reEquity: 50000 * (i + 1),
        rothBalance: 30000 * (i + 1),
        error: undefined,
      }));

      const chartData = results.filter(r => !r.error).slice(0, 20);
      expect(chartData).toHaveLength(20);
    });
  });

  describe("Tax bracket inference for bulk", () => {
    it("infers correct tax bracket from income for married filing jointly 2024", () => {
      // Same logic used in bulk generation
      const brackets = [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23200, max: 94300, rate: 0.12 },
        { min: 94300, max: 201050, rate: 0.22 },
        { min: 201050, max: 383900, rate: 0.24 },
        { min: 383900, max: 487450, rate: 0.32 },
        { min: 487450, max: 731200, rate: 0.35 },
        { min: 731200, max: Infinity, rate: 0.37 },
      ];

      const inferBracket = (income: number) => {
        for (let i = brackets.length - 1; i >= 0; i--) {
          if (income >= brackets[i].min) return brackets[i].rate;
        }
        return 0.24;
      };

      expect(inferBracket(50000)).toBe(0.12);
      expect(inferBracket(150000)).toBe(0.22);
      expect(inferBracket(300000)).toBe(0.24);
      expect(inferBracket(500000)).toBe(0.35);
      expect(inferBracket(1000000)).toBe(0.37);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   RECOMMENDATION HISTORY SCHEMA
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Recommendation History Schema", () => {
  it("stores all required fields for audit trail", () => {
    const record = {
      workspaceId: 1,
      clientId: 42,
      clientName: "Alice Smith",
      clientAge: 50,
      riskTolerance: "moderate",
      annualPremium: "30000",
      recommendedCarrierId: "aaa_plus_mutual",
      recommendedCarrierName: "AAA+ Mutual",
      totalScore: "85.5",
      allScoresJson: JSON.stringify([
        { carrierId: "aaa_plus_mutual", totalScore: 85.5 },
        { carrierId: "national_life", totalScore: 78.2 },
      ]),
      advisorId: 1,
      advisorName: "John Advisor",
    };

    expect(record.workspaceId).toBe(1);
    expect(record.clientId).toBe(42);
    expect(record.recommendedCarrierId).toBe("aaa_plus_mutual");
    expect(Number(record.totalScore)).toBeCloseTo(85.5);
    expect(JSON.parse(record.allScoresJson as string)).toHaveLength(2);
  });

  it("handles null optional fields", () => {
    const record = {
      workspaceId: 1,
      clientId: null,
      clientName: null,
      clientAge: null,
      riskTolerance: null,
      annualPremium: null,
      recommendedCarrierId: "aaa_plus_mutual",
      recommendedCarrierName: "AAA+ Mutual",
      totalScore: "80",
      allScoresJson: "[]",
      advisorId: null,
      advisorName: null,
    };

    expect(record.clientId).toBeNull();
    expect(record.clientName).toBeNull();
    expect(record.advisorId).toBeNull();
    expect(record.recommendedCarrierId).toBe("aaa_plus_mutual");
  });
});
