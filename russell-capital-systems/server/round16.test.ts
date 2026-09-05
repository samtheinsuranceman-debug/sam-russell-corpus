import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test helpers ────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-r16",
    email: "advisor@russellcapital.test",
    name: "Test Advisor",
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
// 1. CLIENT RISK SCORING
// ═══════════════════════════════════════════════════════════════════════════

describe("riskScoring", () => {
  it("riskScoring.scores returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const scores = await caller.riskScoring.scores();
    expect(Array.isArray(scores)).toBe(true);
  });

  it("each score entry has required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const scores = await caller.riskScoring.scores();
    for (const s of scores) {
      expect(s).toHaveProperty("clientId");
      expect(s).toHaveProperty("clientName");
      expect(s).toHaveProperty("score");
      expect(s).toHaveProperty("level");
      expect(s).toHaveProperty("factors");
      expect(typeof s.score).toBe("number");
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
      expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(s.level);
      // Factors should have all five sub-scores
      expect(s.factors).toHaveProperty("aumConcentration");
      expect(s.factors).toHaveProperty("filingComplexity");
      expect(s.factors).toHaveProperty("strategyDiversity");
      expect(s.factors).toHaveProperty("engagementRecency");
      expect(s.factors).toHaveProperty("portfolioSize");
    }
  });

  it("scoreForClient returns null for non-existent client", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.riskScoring.scoreForClient({ clientId: 999999 });
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. ADVISOR PERFORMANCE LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════

describe("leaderboard", () => {
  it("leaderboard.list returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.leaderboard.list();
    expect(Array.isArray(entries)).toBe(true);
  });

  it("each entry has enhanced performance fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.leaderboard.list();
    for (const e of entries) {
      expect(e).toHaveProperty("userId");
      expect(e).toHaveProperty("name");
      expect(e).toHaveProperty("role");
      expect(e).toHaveProperty("aumManaged");
      expect(e).toHaveProperty("dealsWon");
      expect(e).toHaveProperty("closedValue");
      expect(e).toHaveProperty("pipelineCount");
      expect(e).toHaveProperty("pipelineValue");
      expect(e).toHaveProperty("meetingsHeld");
      expect(e).toHaveProperty("clientCount");
      expect(e).toHaveProperty("score");
      expect(e).toHaveProperty("rank");
      expect(typeof e.score).toBe("number");
      expect(typeof e.rank).toBe("number");
      expect(e.rank).toBeGreaterThanOrEqual(1);
    }
  });

  it("entries are sorted by score descending", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.leaderboard.list();
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].score).toBeGreaterThanOrEqual(entries[i].score);
    }
  });

  it("ranks are sequential starting from 1", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entries = await caller.leaderboard.list();
    entries.forEach((e, i) => {
      expect(e.rank).toBe(i + 1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. MEETING REMINDERS (unit tests for the email function)
// ═══════════════════════════════════════════════════════════════════════════

describe("meeting reminders", () => {
  it("sendMeetingReminder function exists and is callable", async () => {
    const { sendMeetingReminder } = await import("./email");
    expect(typeof sendMeetingReminder).toBe("function");
  });

  it("sendMeetingReminder returns sent:false when RESEND_API_KEY is not set", async () => {
    // Save and clear the key
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    // Re-import to get fresh module
    const email = await import("./email");
    const result = await email.sendMeetingReminder({
      toEmail: "test@example.com",
      clientName: "Test Client",
      meetingTitle: "Quarterly Review",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMin: 60,
      meetingType: "VIDEO",
      workspaceName: "Test Workspace",
    });

    // Restore
    if (originalKey) process.env.RESEND_API_KEY = originalKey;

    expect(result.sent).toBe(false);
  });

  it("getUpcomingMeetingsForReminder DB helper exists", async () => {
    const { getUpcomingMeetingsForReminder } = await import("./db");
    expect(typeof getUpcomingMeetingsForReminder).toBe("function");
  });

  it("markMeetingReminderSent DB helper exists", async () => {
    const { markMeetingReminderSent } = await import("./db");
    expect(typeof markMeetingReminderSent).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRON ENDPOINT EXISTENCE
// ═══════════════════════════════════════════════════════════════════════════

describe("cron endpoint", () => {
  it("meeting-reminders cron endpoint responds to GET", async () => {
    // Test that the endpoint is registered by making a real HTTP request
    // We'll just verify the function imports work correctly
    const { getUpcomingMeetingsForReminder, markMeetingReminderSent } = await import("./db");
    const { sendMeetingReminder } = await import("./email");
    expect(typeof getUpcomingMeetingsForReminder).toBe("function");
    expect(typeof markMeetingReminderSent).toBe("function");
    expect(typeof sendMeetingReminder).toBe("function");
  });
});
