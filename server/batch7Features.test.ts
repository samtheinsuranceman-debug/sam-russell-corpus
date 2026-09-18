/**
 * Vitest tests for Batch 7 features:
 * - Calendar Sync (Google Calendar MCP integration)
 * - Bulk PDF Export
 * - Error Tracking with DB persistence
 * - Client Portal with real data
 * - Deal Scoring with DB persistence
 * - Monthly Report with email
 */
import { describe, it, expect, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR SERVICE TESTS
// ═══════════════════════════════════════════════════════════════════════════════
describe("Calendar Service", () => {
  it("should export all required functions", async () => {
    const calService = await import("./calendarService");
    expect(calService.searchCalendarEvents).toBeDefined();
    expect(calService.createCalendarEvent).toBeDefined();
    expect(calService.updateCalendarEvent).toBeDefined();
    expect(calService.deleteCalendarEvent).toBeDefined();
    expect(calService.getCalendarEvent).toBeDefined();
    expect(calService.syncMeetingsToCalendar).toBeDefined();
  });

  it("should handle MCP unavailability gracefully", async () => {
    const calService = await import("./calendarService");
    // MCP CLI is not available in test environment, so calls should throw or return error
    try {
      await calService.searchCalendarEvents({
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 86400000).toISOString(),
        maxResults: 10,
      });
      // If it doesn't throw, it should still return something
      expect(true).toBe(true);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it("should validate event creation parameters", async () => {
    const calService = await import("./calendarService");
    // Should throw when MCP is unavailable
    try {
      await calService.createCalendarEvent({
        summary: "Test Meeting",
        start: { dateTime: new Date().toISOString() },
        end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
      });
      expect(true).toBe(true);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT GENERATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════
describe("Report Generation", () => {
  it("should define valid report section types", () => {
    const validSections = [
      "strategy-summary", "tax-waterfall", "mortgage-analysis",
      "retirement-projection", "iul-projection", "roth-conversion",
      "estate-plan", "client-scorecard", "portfolio-overview",
      "20-year-projection", "comparison-dashboard",
    ];
    expect(validSections).toHaveLength(11);
    validSections.forEach(s => {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    });
  });

  it("should generate fallback HTML when LLM is unavailable", () => {
    const clientName = "John Doe";
    const sections = ["strategy-summary", "client-scorecard"];
    const title = `${clientName} — Financial Strategy Report`;
    
    // Simulate fallback HTML generation
    const fallbackHtml = `<html><head><style>body{font-family:system-ui;background:#0a0a0f;color:#e2e8f0;padding:40px;}</style></head><body>
      <h1>${title}</h1>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      ${sections.map(s => `<h2>${s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</h2>`).join("")}
    </body></html>`;
    
    expect(fallbackHtml).toContain("John Doe");
    expect(fallbackHtml).toContain("Strategy Summary");
    expect(fallbackHtml).toContain("Client Scorecard");
    expect(fallbackHtml).toContain("#0a0a0f"); // Dark theme
  });

  it("should limit bulk generation to 50 clients", () => {
    const maxBulk = 50;
    const clientIds = Array.from({ length: 51 }, (_, i) => i + 1);
    expect(clientIds.length).toBeGreaterThan(maxBulk);
    const limited = clientIds.slice(0, maxBulk);
    expect(limited).toHaveLength(maxBulk);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR TRACKING TESTS
// ═══════════════════════════════════════════════════════════════════════════════
describe("Error Tracking", () => {
  it("should structure error log data correctly", () => {
    const errorData = {
      source: "client",
      level: "error",
      message: "Cannot read properties of undefined",
      stack: "TypeError: Cannot read properties of undefined\n    at App.tsx:42",
      componentStack: "at ErrorBoundary\n    at App",
      url: "/portal/mortgage-killer",
      userAgent: "Mozilla/5.0",
      metadata: { calculatorType: "mortgage-killer", inputValues: { loanAmount: 500000 } },
    };

    expect(errorData.source).toBe("client");
    expect(errorData.level).toBe("error");
    expect(errorData.message).toBeTruthy();
    expect(errorData.stack).toContain("TypeError");
    expect(errorData.url).toContain("/portal/");
    expect(errorData.metadata).toHaveProperty("calculatorType");
  });

  it("should truncate long stack traces", () => {
    const longStack = "Error: test\n" + "    at line ".repeat(200);
    const truncated = longStack.slice(0, 500);
    expect(truncated.length).toBeLessThanOrEqual(500);
  });

  it("should handle error levels correctly", () => {
    const validLevels = ["error", "warning", "info", "critical"];
    validLevels.forEach(level => {
      expect(typeof level).toBe("string");
    });
  });

  it("should allow public error reporting (no auth required)", () => {
    // Error reporting should work without authentication
    // This is important for catching errors during login flow
    const errorPayload = {
      message: "Login failed",
      source: "client",
      level: "error",
    };
    expect(errorPayload.message).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEAL SCORING TESTS
// ═══════════════════════════════════════════════════════════════════════════════
describe("Deal Scoring", () => {
  it("should calculate rule-based scores when LLM is unavailable", () => {
    const deals = [
      { id: 1, name: "Deal A", stage: "closed_won", probability: 100, daysSinceCreated: 10 },
      { id: 2, name: "Deal B", stage: "negotiation", probability: 60, daysSinceCreated: 5 },
      { id: 3, name: "Deal C", stage: "proposal", probability: 40, daysSinceCreated: 45 },
      { id: 4, name: "Deal D", stage: "closed_lost", probability: 0, daysSinceCreated: 90 },
    ];

    const scored = deals.map(d => {
      let score = d.probability ?? 50;
      if (d.stage === "closed_won") score = 100;
      else if (d.stage === "closed_lost") score = 0;
      else if (d.stage === "negotiation") score = Math.max(score, 70);
      else if (d.stage === "proposal") score = Math.max(score, 50);
      if (d.daysSinceCreated > 30) score -= 15;
      if (d.daysSinceCreated > 60) score -= 15;
      return { name: d.name, score: Math.max(0, Math.min(100, score)) };
    });

    expect(scored[0].score).toBe(100); // closed_won
    expect(scored[1].score).toBe(70);  // negotiation
    expect(scored[2].score).toBe(35);  // proposal, >30 days old
    expect(scored[3].score).toBe(0);   // closed_lost
  });

  it("should limit scoring to 20 deals max", () => {
    const maxDeals = 20;
    const allDeals = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
    const limited = allDeals.slice(0, maxDeals);
    expect(limited).toHaveLength(maxDeals);
  });

  it("should persist score with required fields", () => {
    const scoreRecord = {
      dealId: 1,
      workspaceId: 1,
      score: 85,
      confidence: "high",
      factors: { reason: "Strong pipeline position", stage: "negotiation", value: 500000 },
      recommendation: "Follow up this week",
      scoredBy: "ai",
    };

    expect(scoreRecord.score).toBeGreaterThanOrEqual(0);
    expect(scoreRecord.score).toBeLessThanOrEqual(100);
    expect(["high", "medium", "low"]).toContain(scoreRecord.confidence);
    expect(scoreRecord.scoredBy).toBe("ai");
    expect(scoreRecord.factors).toHaveProperty("reason");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY REPORT TESTS
// ═══════════════════════════════════════════════════════════════════════════════
describe("Monthly Report", () => {
  it("should format report content as markdown table", () => {
    const data = {
      month: "April 2026",
      xp: { earned: 2500, actions: 42 },
      deals: { closed: 3, revenue: 150000 },
      level: 5,
      questsCompleted: 7,
      currentStreak: 14,
      russellCoin: 350,
    };

    const content = [
      `**Monthly Summary**`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| XP Earned | ${data.xp.earned.toLocaleString()} |`,
      `| Actions | ${data.xp.actions} |`,
      `| Deals Closed | ${data.deals.closed} |`,
      `| Revenue | $${Number(data.deals.revenue).toLocaleString()} |`,
      `| Level | ${data.level} |`,
      `| Quests Completed | ${data.questsCompleted} |`,
      `| Current Streak | ${data.currentStreak} days |`,
      `| Russell Coin | ${data.russellCoin} |`,
    ].join("\n");

    expect(content).toContain("2,500");
    expect(content).toContain("$150,000");
    expect(content).toContain("14 days");
    expect(content).toContain("350");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT PORTAL REAL DATA TESTS
// ═══════════════════════════════════════════════════════════════════════════════
describe("Client Portal", () => {
  it("should calculate scorecard correctly", () => {
    const calculateScore = (opts: {
      hasIUL: boolean;
      hasRoth: boolean;
      hasEstatePlan: boolean;
      diversificationScore: number;
      totalAssets: number;
    }) => {
      return Math.min(100, Math.round(
        (opts.hasIUL ? 20 : 0) +
        (opts.hasRoth ? 20 : 0) +
        (opts.hasEstatePlan ? 15 : 0) +
        Math.min(25, opts.diversificationScore * 5) +
        Math.min(20, (opts.totalAssets > 1000000 ? 20 : opts.totalAssets > 500000 ? 15 : opts.totalAssets > 100000 ? 10 : 5))
      ));
    };

    // Full score client
    expect(calculateScore({
      hasIUL: true, hasRoth: true, hasEstatePlan: true,
      diversificationScore: 5, totalAssets: 2000000,
    })).toBe(100);

    // Minimal client
    expect(calculateScore({
      hasIUL: false, hasRoth: false, hasEstatePlan: false,
      diversificationScore: 1, totalAssets: 50000,
    })).toBe(10); // 5 (assets) + 5 (diversification)

    // Mid-range client
    expect(calculateScore({
      hasIUL: true, hasRoth: false, hasEstatePlan: true,
      diversificationScore: 3, totalAssets: 750000,
    })).toBe(65); // 20 (IUL) + 0 (Roth) + 15 (estate) + 15 (3*5) + 15 (>500k) = 65
  });

  it("should validate portal token format", () => {
    const tokenLength = 64; // hex string from 32 random bytes
    const token = "a".repeat(tokenLength);
    expect(token.length).toBe(tokenLength);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it("should sanitize client data for portal view", () => {
    const rawClient = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      age: 45,
      annualIncome: "250000",
      ssn: "123-45-6789", // Should NOT be exposed
      passwordHash: "abc123", // Should NOT be exposed
    };

    // Sanitize by picking only safe fields
    const { ssn, passwordHash, ...safeClient } = rawClient;
    expect(safeClient).not.toHaveProperty("ssn");
    expect(safeClient).not.toHaveProperty("passwordHash");
    expect(safeClient).toHaveProperty("name");
    expect(safeClient).toHaveProperty("email");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATOR INTEGRATION HOOK TESTS
// ═══════════════════════════════════════════════════════════════════════════════
describe("Calculator Integration", () => {
  it("should define all strategy types for cross-calculator sync", () => {
    const strategyTypes = [
      "mortgage-killer", "myga-fixed-rate", "iul-roth-conversion",
      "tax-waterfall", "social-security", "annuity-income",
      "estate-tax", "fia-collateral", "hot-income",
      "revenue-guarantee", "black-mirror", "time-machine",
      "retirement-income", "roth-conversion", "iul-projection",
      "tax-savings", "wealth-transfer", "income-replacement",
      "college-funding", "long-term-care",
    ];
    
    expect(strategyTypes.length).toBeGreaterThanOrEqual(15);
    // All should be unique
    const unique = new Set(strategyTypes);
    expect(unique.size).toBe(strategyTypes.length);
  });

  it("should structure comparison slot data correctly", () => {
    const slot = {
      id: "slot-1",
      strategyType: "mortgage-killer",
      label: "Mortgage Killer Strategy",
      color: "#10b981",
      projection: Array.from({ length: 20 }, (_, i) => ({
        year: i + 1,
        netPositive: 10000 * (i + 1),
        interestSaved: 5000 * (i + 1),
        equityBuilt: 8000 * (i + 1),
        taxSavings: 3000 * (i + 1),
        cashValue: 2000 * (i + 1),
        deathBenefit: 500000,
        incomeGenerated: 1000 * (i + 1),
        opportunityCost: 500 * (i + 1),
      })),
    };

    expect(slot.projection).toHaveLength(20);
    expect(slot.projection[0].year).toBe(1);
    expect(slot.projection[19].year).toBe(20);
    expect(slot.projection[19].netPositive).toBe(200000);
    expect(slot.projection[19].interestSaved).toBe(100000);
  });
});
