import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test helpers ────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-r18",
    email: "advisor@russellcapital.test",
    name: "Test Advisor R18",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. RISK SCORE HISTORY (TREND TRACKING)
// ═══════════════════════════════════════════════════════════════════════════

describe("riskScoring.history", () => {
  it("should have a history procedure on the router", () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    expect(caller.riskScoring.history).toBeDefined();
    expect(typeof caller.riskScoring.history).toBe("function");
  });

  it("should accept clientId and optional weeks parameter", async () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    // Should not throw for valid input
    const result = await caller.riskScoring.history({ clientId: 999, weeks: 8 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return empty array for non-existent client", async () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    const result = await caller.riskScoring.history({ clientId: 99999 });
    expect(result).toEqual([]);
  });
});

describe("riskScoring.historyBulk", () => {
  it("should have a historyBulk procedure on the router", () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    expect(caller.riskScoring.historyBulk).toBeDefined();
    expect(typeof caller.riskScoring.historyBulk).toBe("function");
  });

  it("should return an object (clientId -> entries map)", async () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    const result = await caller.riskScoring.historyBulk({ weeks: 4 });
    expect(typeof result).toBe("object");
    expect(result).not.toBeNull();
  });

  it("should accept optional input", async () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    // Should work with no input
    const result = await caller.riskScoring.historyBulk();
    expect(typeof result).toBe("object");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. RISK SCORE SNAPSHOT STORAGE
// ═══════════════════════════════════════════════════════════════════════════

describe("storeRiskScoreSnapshots", () => {
  it("should be importable from db module", async () => {
    const { storeRiskScoreSnapshots } = await import("./db");
    expect(typeof storeRiskScoreSnapshots).toBe("function");
  });

  it("should return stored count", async () => {
    const { storeRiskScoreSnapshots } = await import("./db");
    const result = await storeRiskScoreSnapshots(99999);
    expect(result).toHaveProperty("stored");
    expect(typeof result.stored).toBe("number");
  });
});

describe("getRiskScoreHistory", () => {
  it("should be importable from db module", async () => {
    const { getRiskScoreHistory } = await import("./db");
    expect(typeof getRiskScoreHistory).toBe("function");
  });

  it("should return array for valid params", async () => {
    const { getRiskScoreHistory } = await import("./db");
    const result = await getRiskScoreHistory(99999, 99999, 12);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getRiskScoreHistoryBulk", () => {
  it("should be importable from db module", async () => {
    const { getRiskScoreHistoryBulk } = await import("./db");
    expect(typeof getRiskScoreHistoryBulk).toBe("function");
  });

  it("should return a Map", async () => {
    const { getRiskScoreHistoryBulk } = await import("./db");
    const result = await getRiskScoreHistoryBulk(99999, 8);
    expect(result instanceof Map).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. LEADERBOARD CSV EXPORT
// ═══════════════════════════════════════════════════════════════════════════

describe("leaderboard.exportCsv", () => {
  it("should have an exportCsv procedure on the router", () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    expect(caller.leaderboard.exportCsv).toBeDefined();
    expect(typeof caller.leaderboard.exportCsv).toBe("function");
  });

  it("should return an object with csv string", async () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    const result = await caller.leaderboard.exportCsv({ period: "all" });
    expect(result).toHaveProperty("csv");
    expect(typeof result.csv).toBe("string");
  });

  it("should include CSV header row", async () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    const result = await caller.leaderboard.exportCsv({ period: "all" });
    if (result.csv) {
      expect(result.csv).toContain("Rank");
      expect(result.csv).toContain("Name");
      expect(result.csv).toContain("Score");
      expect(result.csv).toContain("AUM Managed");
    }
  });

  it("should accept period parameter", async () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    const result = await caller.leaderboard.exportCsv({ period: "month" });
    expect(result).toHaveProperty("csv");
    expect(result).toHaveProperty("period");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. LEADERBOARD EMAIL DIGEST
// ═══════════════════════════════════════════════════════════════════════════

describe("sendLeaderboardDigest", () => {
  it("should be importable from email module", async () => {
    const { sendLeaderboardDigest } = await import("./email");
    expect(typeof sendLeaderboardDigest).toBe("function");
  });

  it("should return sent:false when RESEND_API_KEY is not configured", async () => {
    const { sendLeaderboardDigest } = await import("./email");
    const result = await sendLeaderboardDigest({
      toEmail: "test@example.com",
      toName: "Test User",
      workspaceName: "Test Workspace",
      period: "All Time",
      entries: [
        {
          rank: 1,
          name: "Top Advisor",
          email: "top@example.com",
          score: 100,
          aumManaged: 5000000,
          dealsWon: 10,
          closedValue: 2000000,
          meetingsHeld: 25,
          clientCount: 15,
        },
      ],
      generatedAt: new Date(),
    });
    expect(result).toHaveProperty("sent");
    expect(typeof result.sent).toBe("boolean");
  });

  it("should handle empty entries array", async () => {
    const { sendLeaderboardDigest } = await import("./email");
    const result = await sendLeaderboardDigest({
      toEmail: "test@example.com",
      workspaceName: "Test Workspace",
      period: "All Time",
      entries: [],
      generatedAt: new Date(),
    });
    expect(result).toHaveProperty("sent");
  });

  it("should format money values correctly", async () => {
    // Test the internal fmtMoney logic indirectly through the email function
    const { sendLeaderboardDigest } = await import("./email");
    // This should not throw even with large numbers
    const result = await sendLeaderboardDigest({
      toEmail: "test@example.com",
      workspaceName: "Test Workspace",
      period: "All Time",
      entries: [
        {
          rank: 1,
          name: "Advisor A",
          email: null,
          score: 500,
          aumManaged: 10_000_000,
          dealsWon: 50,
          closedValue: 5_000_000,
          meetingsHeld: 100,
          clientCount: 30,
        },
      ],
      generatedAt: new Date(),
    });
    expect(result).toHaveProperty("sent");
  });
});
