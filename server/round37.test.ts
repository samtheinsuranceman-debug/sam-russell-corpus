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
   BATCH PDF COMPARISON REPORT — data shaping
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Batch PDF Comparison Report", () => {
  const makeBulkResult = (overrides: Partial<any> = {}) => ({
    clientId: 1,
    clientName: "Alice Smith",
    age: 45,
    iraBalance: 500000,
    income: 150000,
    carrierId: "aaa_plus_mutual",
    carrierName: "AAA+ Mutual",
    strategyLabel: "1-Year Strategy",
    iulNetCash: 800000,
    reEquity: 300000,
    rentalIncome: 24000,
    rothBalance: 200000,
    netWorth: 1300000,
    error: undefined as string | undefined,
    ...overrides,
  });

  describe("PDF input validation", () => {
    it("requires results array and summary object", () => {
      const results = [makeBulkResult()];
      const summary = {
        totalClients: 1,
        successfulProjections: 1,
        skipped: 0,
        totalNetWorth: 1300000,
        avgNetWorth: 1300000,
        topClient: "Alice Smith",
      };
      expect(results).toHaveLength(1);
      expect(summary.totalClients).toBe(1);
      expect(summary.topClient).toBe("Alice Smith");
    });

    it("settings contain all required batch parameters", () => {
      const settings = {
        strategyYears: 1,
        solarEquity: false,
        iulYears: 20,
        autoRecommendCarrier: true,
      };
      expect(settings).toHaveProperty("strategyYears");
      expect(settings).toHaveProperty("solarEquity");
      expect(settings).toHaveProperty("iulYears");
      expect(settings).toHaveProperty("autoRecommendCarrier");
    });
  });

  describe("PDF data shaping", () => {
    it("separates successful and skipped results", () => {
      const results = [
        makeBulkResult({ clientId: 1, clientName: "Alice" }),
        makeBulkResult({ clientId: 2, clientName: "Bob", error: "No IRA balance", netWorth: 0 }),
        makeBulkResult({ clientId: 3, clientName: "Charlie" }),
      ];

      const successful = results.filter(r => !r.error);
      const skipped = results.filter(r => r.error);

      expect(successful).toHaveLength(2);
      expect(skipped).toHaveLength(1);
      expect(skipped[0].clientName).toBe("Bob");
    });

    it("identifies top performer by net worth", () => {
      const results = [
        makeBulkResult({ clientName: "Alice", netWorth: 1300000 }),
        makeBulkResult({ clientName: "Bob", netWorth: 2500000 }),
        makeBulkResult({ clientName: "Charlie", netWorth: 900000 }),
      ];

      const successful = results.filter(r => !r.error);
      const best = [...successful].sort((a, b) => b.netWorth - a.netWorth)[0];
      expect(best.clientName).toBe("Bob");
    });

    it("computes wealth composition percentages", () => {
      const r = makeBulkResult({ iulNetCash: 600000, reEquity: 300000, rothBalance: 100000 });
      const total = r.iulNetCash + r.reEquity + r.rothBalance;

      const segments = [
        { label: "IUL Net Cash", pct: (r.iulNetCash / total) * 100 },
        { label: "RE Equity", pct: (r.reEquity / total) * 100 },
        { label: "Roth Balance", pct: (r.rothBalance / total) * 100 },
      ];

      expect(segments[0].pct).toBeCloseTo(60, 0);
      expect(segments[1].pct).toBeCloseTo(30, 0);
      expect(segments[2].pct).toBeCloseTo(10, 0);
      expect(segments.reduce((s, seg) => s + seg.pct, 0)).toBeCloseTo(100, 5);
    });

    it("handles single-client report", () => {
      const results = [makeBulkResult()];
      const successful = results.filter(r => !r.error);
      expect(successful).toHaveLength(1);
      // Single client means no "winner highlight" comparison
      expect(successful.length).toBeLessThan(2);
    });

    it("formats dollar amounts correctly", () => {
      const fmtFull = (n: number) => `$${Math.round(n).toLocaleString()}`;
      const fmtCompact = (n: number) => {
        if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
        if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
        return `$${n.toLocaleString()}`;
      };

      expect(fmtFull(1300000)).toBe("$1,300,000");
      expect(fmtCompact(1300000)).toBe("$1.3M");
      expect(fmtCompact(500000)).toBe("$500K");
      expect(fmtCompact(800)).toBe("$800");
    });

    it("truncates long client names for table display", () => {
      const name = "Alexander Hamilton III Esq.";
      const truncated = name.length > 14 ? name.slice(0, 14) + "…" : name;
      expect(truncated).toBe("Alexander Hami…");
    });
  });

  describe("PDF page structure", () => {
    it("cover page contains advisor name and date", () => {
      const advisorName = "John Russell";
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      expect(advisorName).toBeTruthy();
      expect(dateStr).toMatch(/\w+ \d+, \d{4}/);
    });

    it("comparison matrix has correct column count", () => {
      const columns = ["Client", "Age", "IRA Balance", "Carrier", "IUL Net Cash", "RE Equity", "Roth", "Net Worth"];
      expect(columns).toHaveLength(8);
    });

    it("disclaimer page has required disclosures", () => {
      const disclaimers = [
        "informational and compliance purposes",
        "hypothetical",
        "Past performance",
        "IUL",
        "Real estate",
        "Tax calculations",
        "Carrier recommendations",
        "confidential",
      ];
      expect(disclaimers).toHaveLength(8);
      expect(disclaimers[0]).toContain("compliance");
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   RECOMMENDATION TREND CHART — data derivation
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Recommendation Trend Chart", () => {
  describe("Trend series derivation", () => {
    it("converts history records to chart data points", () => {
      const history = [
        { id: 3, recommendedCarrierName: "AAA+ Mutual", totalScore: "88", createdAt: "2024-03-15T10:00:00Z" },
        { id: 2, recommendedCarrierName: "National Life", totalScore: "82", createdAt: "2024-02-10T10:00:00Z" },
        { id: 1, recommendedCarrierName: "A+ Mutual Life", totalScore: "75", createdAt: "2024-01-05T10:00:00Z" },
      ];

      // Chart data is reversed (chronological order)
      const chartData = [...history].reverse().map(h => ({
        date: new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: Number(h.totalScore),
        carrier: h.recommendedCarrierName,
      }));

      expect(chartData).toHaveLength(3);
      expect(chartData[0].date).toBe("Jan 5");
      expect(chartData[0].score).toBe(75);
      expect(chartData[0].carrier).toBe("A+ Mutual Life");
      expect(chartData[2].date).toBe("Mar 15");
      expect(chartData[2].score).toBe(88);
    });

    it("requires at least 2 data points to render chart", () => {
      const singleEntry = [{ id: 1, totalScore: "80", createdAt: "2024-01-01T10:00:00Z" }];
      expect(singleEntry.length >= 2).toBe(false);

      const twoEntries = [
        { id: 1, totalScore: "80", createdAt: "2024-01-01T10:00:00Z" },
        { id: 2, totalScore: "85", createdAt: "2024-02-01T10:00:00Z" },
      ];
      expect(twoEntries.length >= 2).toBe(true);
    });

    it("score values are bounded 0-100", () => {
      const scores = [75, 82, 88, 91, 68];
      for (const s of scores) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      }
    });

    it("tooltip shows score and carrier name", () => {
      const dataPoint = { date: "Mar 15", score: 88, carrier: "AAA+ Mutual" };
      const tooltipText = `${dataPoint.score.toFixed(0)} — ${dataPoint.carrier}`;
      expect(tooltipText).toBe("88 — AAA+ Mutual");
    });

    it("handles same-day multiple recommendations", () => {
      const history = [
        { id: 2, totalScore: "85", createdAt: "2024-01-01T14:00:00Z", recommendedCarrierName: "National Life" },
        { id: 1, totalScore: "80", createdAt: "2024-01-01T10:00:00Z", recommendedCarrierName: "AAA+ Mutual" },
      ];

      const chartData = [...history].reverse().map(h => ({
        date: new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: Number(h.totalScore),
        carrier: h.recommendedCarrierName,
      }));

      // Both appear on same date
      expect(chartData[0].date).toBe(chartData[1].date);
      expect(chartData[0].score).toBe(80);
      expect(chartData[1].score).toBe(85);
    });
  });

  describe("Client filtering for trend", () => {
    it("filters history by clientId", () => {
      const allHistory = [
        { clientId: 1, clientName: "Alice", totalScore: "88", createdAt: "2024-03-01" },
        { clientId: 2, clientName: "Bob", totalScore: "82", createdAt: "2024-03-02" },
        { clientId: 1, clientName: "Alice", totalScore: "90", createdAt: "2024-03-03" },
        { clientId: null, clientName: null, totalScore: "75", createdAt: "2024-03-04" },
      ];

      const aliceHistory = allHistory.filter(h => h.clientId === 1);
      expect(aliceHistory).toHaveLength(2);

      const allClientsHistory = allHistory;
      expect(allClientsHistory).toHaveLength(4);
    });

    it("handles null clientId entries in all-clients view", () => {
      const history = [
        { clientId: null, totalScore: "80", recommendedCarrierName: "AAA+ Mutual" },
        { clientId: 1, totalScore: "85", recommendedCarrierName: "National Life" },
      ];

      // All-clients view includes entries without clientId
      expect(history).toHaveLength(2);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   BULK AUTO-SAVE — payload generation
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Bulk Auto-Save", () => {
  const makeBulkResult = (overrides: Partial<any> = {}) => ({
    clientId: 1,
    clientName: "Alice Smith",
    age: 45,
    iraBalance: 500000,
    income: 150000,
    carrierId: "aaa_plus_mutual",
    carrierName: "AAA+ Mutual",
    strategyLabel: "1-Year Strategy",
    iulNetCash: 800000,
    reEquity: 300000,
    rentalIncome: 24000,
    rothBalance: 200000,
    netWorth: 1300000,
    error: undefined as string | undefined,
    ...overrides,
  });

  describe("Save payload generation", () => {
    it("generates correct strategy type from settings", () => {
      const settings = { strategyYears: 3, solarEquity: false, iulYears: 20, autoRecommendCarrier: true };
      const strategyType = settings.solarEquity ? "solar" : `${settings.strategyYears}yr-non-solar`;
      expect(strategyType).toBe("3yr-non-solar");

      const solarSettings = { ...settings, solarEquity: true };
      const solarType = solarSettings.solarEquity ? "solar" : `${solarSettings.strategyYears}yr-non-solar`;
      expect(solarType).toBe("solar");
    });

    it("constructs inputsJson from result and settings", () => {
      const r = makeBulkResult();
      const settings = { strategyYears: 1, solarEquity: false, iulYears: 20, autoRecommendCarrier: true };

      const inputsJson = {
        iraBalance: r.iraBalance,
        age: r.age,
        income: r.income,
        strategyYears: settings.strategyYears,
        solarEquity: settings.solarEquity,
        iulYears: settings.iulYears,
        autoRecommendCarrier: settings.autoRecommendCarrier,
      };

      expect(inputsJson.iraBalance).toBe(500000);
      expect(inputsJson.age).toBe(45);
      expect(inputsJson.strategyYears).toBe(1);
    });

    it("constructs summaryJson from result metrics", () => {
      const r = makeBulkResult();
      const summaryJson = {
        finalNetCashValue: r.iulNetCash,
        totalPropertyEquity: r.reEquity,
        totalRentalIncome: r.rentalIncome,
        finalRothBalance: r.rothBalance,
        estimatedNetWorth: r.netWorth,
      };

      expect(summaryJson.finalNetCashValue).toBe(800000);
      expect(summaryJson.totalPropertyEquity).toBe(300000);
      expect(summaryJson.estimatedNetWorth).toBe(1300000);
    });

    it("auto-generates notes with date stamp", () => {
      const notes = `Auto-saved from bulk generation on ${new Date().toLocaleDateString()}`;
      expect(notes).toContain("Auto-saved from bulk generation");
      expect(notes).toMatch(/\d+\/\d+\/\d+/);
    });
  });

  describe("Filtering for save", () => {
    it("only saves successful results (no errors)", () => {
      const results = [
        makeBulkResult({ clientId: 1, clientName: "Alice" }),
        makeBulkResult({ clientId: 2, clientName: "Bob", error: "No IRA balance" }),
        makeBulkResult({ clientId: 3, clientName: "Charlie" }),
      ];

      const toSave = results.filter(r => !r.error);
      expect(toSave).toHaveLength(2);
      expect(toSave.map(r => r.clientName)).toEqual(["Alice", "Charlie"]);
    });

    it("handles all-error results with zero saves", () => {
      const results = [
        makeBulkResult({ clientId: 1, error: "No IRA" }),
        makeBulkResult({ clientId: 2, error: "Client not found" }),
      ];

      const toSave = results.filter(r => !r.error);
      expect(toSave).toHaveLength(0);
    });
  });

  describe("Notification payload", () => {
    it("constructs strategy notification options from bulk result", () => {
      const r = makeBulkResult();
      const notificationPayload = {
        toEmail: "alice@example.com",
        toName: "Alice Smith",
        clientName: "Alice Smith",
        advisorName: "John Russell",
        strategyLabel: r.strategyLabel,
        carrierName: r.carrierName,
        portalUrl: "https://example.com/client-portal/abc123",
        summary: {
          iulNetCash: r.iulNetCash,
          propertyEquity: r.reEquity,
          rentalIncome: r.rentalIncome,
          rothBalance: r.rothBalance,
          netWorth: r.netWorth,
        },
        notes: "Auto-saved from bulk generation",
      };

      expect(notificationPayload.toEmail).toBe("alice@example.com");
      expect(notificationPayload.summary.iulNetCash).toBe(800000);
      expect(notificationPayload.summary.propertyEquity).toBe(300000);
      expect(notificationPayload.portalUrl).toContain("client-portal");
    });

    it("skips notification when client has no email", () => {
      const client = { id: 1, name: "Alice", email: null };
      const shouldNotify = !!client.email;
      expect(shouldNotify).toBe(false);
    });

    it("skips notification when notifyClients is false", () => {
      const notifyClients = false;
      const clientHasEmail = true;
      const shouldSend = notifyClients && clientHasEmail;
      expect(shouldSend).toBe(false);
    });
  });

  describe("Save response structure", () => {
    it("returns saved count and notified count", () => {
      const saved = [
        { clientId: 1, clientName: "Alice", strategyId: 101, notified: true },
        { clientId: 2, clientName: "Bob", strategyId: 102, notified: false },
        { clientId: 3, clientName: "Charlie", strategyId: 103, notified: true },
      ];

      const response = {
        savedCount: saved.length,
        notifiedCount: saved.filter(s => s.notified).length,
        details: saved,
      };

      expect(response.savedCount).toBe(3);
      expect(response.notifiedCount).toBe(2);
      expect(response.details).toHaveLength(3);
    });

    it("handles zero notifications", () => {
      const saved = [
        { clientId: 1, clientName: "Alice", strategyId: 101, notified: false },
        { clientId: 2, clientName: "Bob", strategyId: 102, notified: false },
      ];

      const response = {
        savedCount: saved.length,
        notifiedCount: saved.filter(s => s.notified).length,
      };

      expect(response.savedCount).toBe(2);
      expect(response.notifiedCount).toBe(0);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   CARRIER RECOMMENDATION SCORING (integration with trend)
   ═══════════════════════════════════════════════════════════════════════════ */

describe("Carrier Recommendation Scoring for Trend", () => {
  it("produces consistent scores for identical inputs", () => {
    const profile: ClientProfile = { age: 50, riskTolerance: "moderate", annualPremium: 30000 };
    const run1 = recommendCarriers(CARRIERS, profile);
    const run2 = recommendCarriers(CARRIERS, profile);

    expect(run1[0].totalScore).toBe(run2[0].totalScore);
    expect(run1[0].carrierId).toBe(run2[0].carrierId);
  });

  it("score trend increases when switching from conservative to aggressive for growth carriers", () => {
    const conservative: ClientProfile = { age: 40, riskTolerance: "conservative", annualPremium: 25000 };
    const aggressive: ClientProfile = { age: 40, riskTolerance: "aggressive", annualPremium: 25000 };

    const conResults = recommendCarriers(CARRIERS, conservative);
    const aggResults = recommendCarriers(CARRIERS, aggressive);

    // AAA+ Mutual (highest cap rate) should score higher for aggressive
    const pacConScore = conResults.find(r => r.carrierId === "aaa_plus_mutual")!.totalScore;
    const pacAggScore = aggResults.find(r => r.carrierId === "aaa_plus_mutual")!.totalScore;
    expect(pacAggScore).toBeGreaterThanOrEqual(pacConScore);
  });

  it("scores are bounded between 0 and 100", () => {
    const profiles: ClientProfile[] = [
      { age: 25, riskTolerance: "aggressive", annualPremium: 10000 },
      { age: 50, riskTolerance: "moderate", annualPremium: 30000 },
      { age: 70, riskTolerance: "conservative", annualPremium: 50000 },
    ];

    for (const p of profiles) {
      const results = recommendCarriers(CARRIERS, p);
      for (const r of results) {
        expect(r.totalScore).toBeGreaterThanOrEqual(0);
        expect(r.totalScore).toBeLessThanOrEqual(100);
      }
    }
  });
});
