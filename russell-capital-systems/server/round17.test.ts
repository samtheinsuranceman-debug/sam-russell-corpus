import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test helpers ────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-r17",
    email: "advisor@russellcapital.test",
    name: "Test Advisor R17",
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
// 1. RISK CARD WITH RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("riskScoring with recommendations", () => {
  it("scoreForClient returns recommendations array when client exists", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const scores = await caller.riskScoring.scores();
    if (scores.length === 0) return; // skip if no clients

    const result = await caller.riskScoring.scoreForClient({ clientId: scores[0].clientId });
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("recommendations");
    expect(Array.isArray(result!.recommendations)).toBe(true);
  });

  it("each recommendation has factor, label, score, maxScore, recommendation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const scores = await caller.riskScoring.scores();
    if (scores.length === 0) return;

    const result = await caller.riskScoring.scoreForClient({ clientId: scores[0].clientId });
    if (!result) return;

    for (const rec of result.recommendations) {
      expect(rec).toHaveProperty("factor");
      expect(rec).toHaveProperty("label");
      expect(rec).toHaveProperty("score");
      expect(rec).toHaveProperty("maxScore");
      expect(rec).toHaveProperty("recommendation");
      expect(typeof rec.factor).toBe("string");
      expect(typeof rec.label).toBe("string");
      expect(typeof rec.score).toBe("number");
      expect(typeof rec.maxScore).toBe("number");
      expect(typeof rec.recommendation).toBe("string");
    }
  });

  it("scoreForClient returns null for non-existent client", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.riskScoring.scoreForClient({ clientId: 999999 });
    expect(result).toBeNull();
  });

  it("generateRiskRecommendations produces correct structure", async () => {
    const { generateRiskRecommendations } = await import("./db");
    const factors = {
      aumConcentration: 15,
      filingComplexity: 8,
      strategyDiversity: 20,
      engagementRecency: 10,
      portfolioSize: 12,
    };
    const recs = generateRiskRecommendations(factors);
    expect(recs).toHaveLength(5);
    expect(recs[0]).toHaveProperty("factor");
    expect(recs[0]).toHaveProperty("label");
    expect(recs[0]).toHaveProperty("score");
    expect(recs[0]).toHaveProperty("maxScore");
    expect(recs[0]).toHaveProperty("recommendation");
  });

  it("generateRiskRecommendations gives non-empty recommendations for high scores", async () => {
    const { generateRiskRecommendations } = await import("./db");
    const highRiskFactors = {
      aumConcentration: 25,
      filingComplexity: 15,
      strategyDiversity: 25,
      engagementRecency: 25,
      portfolioSize: 10,
    };
    const recs = generateRiskRecommendations(highRiskFactors);
    const withRecs = recs.filter(r => r.recommendation.length > 0);
    expect(withRecs.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. LEADERBOARD TIME-PERIOD FILTERING
// ═══════════════════════════════════════════════════════════════════════════

describe("leaderboard with period filtering", () => {
  it("leaderboard.list accepts period=all", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.leaderboard.list({ period: "all" });
    expect(Array.isArray(entries)).toBe(true);
  });

  it("leaderboard.list accepts period=month", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.leaderboard.list({ period: "month" });
    expect(Array.isArray(entries)).toBe(true);
  });

  it("leaderboard.list accepts period=quarter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.leaderboard.list({ period: "quarter" });
    expect(Array.isArray(entries)).toBe(true);
  });

  it("leaderboard.list accepts period=year", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.leaderboard.list({ period: "year" });
    expect(Array.isArray(entries)).toBe(true);
  });

  it("leaderboard.list defaults to all when no input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.leaderboard.list();
    expect(Array.isArray(entries)).toBe(true);
  });

  it("all period results have correct structure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    for (const period of ["all", "month", "quarter", "year"] as const) {
      const entries = await caller.leaderboard.list({ period });
      for (const e of entries) {
        expect(e).toHaveProperty("userId");
        expect(e).toHaveProperty("name");
        expect(e).toHaveProperty("aumManaged");
        expect(e).toHaveProperty("dealsWon");
        expect(e).toHaveProperty("closedValue");
        expect(e).toHaveProperty("meetingsHeld");
        expect(e).toHaveProperty("clientCount");
        expect(e).toHaveProperty("score");
        expect(e).toHaveProperty("rank");
      }
    }
  });

  it("getAdvisorPerformanceMetricsFiltered helper exists and is callable", async () => {
    const { getAdvisorPerformanceMetricsFiltered } = await import("./db");
    expect(typeof getAdvisorPerformanceMetricsFiltered).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. MEETING REMINDER PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════

describe("reminderPrefs", () => {
  it("reminderPrefs.get returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const prefs = await caller.reminderPrefs.get();
    expect(Array.isArray(prefs)).toBe(true);
  });

  it("reminderPrefs.get returns 4 entries (one per meeting type)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const prefs = await caller.reminderPrefs.get();
    expect(prefs.length).toBe(4);
    const types = prefs.map(p => p.meetingType);
    expect(types).toContain("IN_PERSON");
    expect(types).toContain("VIDEO");
    expect(types).toContain("PHONE");
    expect(types).toContain("OTHER");
  });

  it("each pref entry has meetingType, enabled, leadTimeMinutes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const prefs = await caller.reminderPrefs.get();
    for (const p of prefs) {
      expect(p).toHaveProperty("meetingType");
      expect(p).toHaveProperty("enabled");
      expect(p).toHaveProperty("leadTimeMinutes");
      expect(typeof p.enabled).toBe("boolean");
      expect(typeof p.leadTimeMinutes).toBe("number");
    }
  });

  it("reminderPrefs.update saves preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reminderPrefs.update({
      prefs: [
        { meetingType: "VIDEO", enabled: true, leadTimeMinutes: 60 },
        { meetingType: "PHONE", enabled: false, leadTimeMinutes: 1440 },
        { meetingType: "IN_PERSON", enabled: true, leadTimeMinutes: 2880 },
        { meetingType: "OTHER", enabled: true, leadTimeMinutes: 120 },
      ],
    });
    expect(result).toEqual({ ok: true });

    // Verify the saved prefs
    const prefs = await caller.reminderPrefs.get();
    const videoPref = prefs.find(p => p.meetingType === "VIDEO");
    expect(videoPref?.enabled).toBe(true);
    expect(videoPref?.leadTimeMinutes).toBe(60);

    const phonePref = prefs.find(p => p.meetingType === "PHONE");
    expect(phonePref?.enabled).toBe(false);
    expect(phonePref?.leadTimeMinutes).toBe(1440);

    const inPersonPref = prefs.find(p => p.meetingType === "IN_PERSON");
    expect(inPersonPref?.enabled).toBe(true);
    expect(inPersonPref?.leadTimeMinutes).toBe(2880);
  });

  it("reminderPrefs.update rejects invalid lead time", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.reminderPrefs.update({
        prefs: [
          { meetingType: "VIDEO", enabled: true, leadTimeMinutes: 5 }, // too low (min 15)
        ],
      })
    ).rejects.toThrow();
  });

  it("getAllReminderPrefsForWorkspace helper exists", async () => {
    const { getAllReminderPrefsForWorkspace } = await import("./db");
    expect(typeof getAllReminderPrefsForWorkspace).toBe("function");
  });
});
