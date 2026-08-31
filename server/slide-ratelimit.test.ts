import { describe, expect, it, vi, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

/**
 * Mock the LLM to return a deterministic slide deck.
 */
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "test-model",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            slides: [
              { title: "Slide 1", subtitle: "Sub 1", bullets: ["Bullet 1"], speakerNotes: "Notes 1", layout: "title" },
              { title: "Slide 2", subtitle: "Sub 2", bullets: ["Bullet 2"], speakerNotes: "Notes 2", layout: "content" },
              { title: "Slide 3", subtitle: "Sub 3", bullets: ["Bullet 3"], speakerNotes: "Notes 3", layout: "summary" },
            ],
          }),
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

/**
 * Mock the db functions for rate-limiting and logging.
 * We control getTrialSlideCountToday to simulate different usage levels.
 */
let mockTrialCount = 0;
const mockLogSlideUsage = vi.fn().mockResolvedValue(undefined);
const mockGetSlideUsageAnalytics = vi.fn().mockResolvedValue({
  byTopic: [{ topic: "Roth Conversion", count: 5 }],
  byDay: [{ day: "2026-04-12", count: 3 }],
  byTier: [{ tier: "trial", count: 8 }, { tier: "owner", count: 12 }],
  total: 20,
});

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    getTrialSlideCountToday: vi.fn().mockImplementation(() => Promise.resolve(mockTrialCount)),
    logSlideUsage: (...args: any[]) => mockLogSlideUsage(...args),
    getSlideUsageAnalytics: (...args: any[]) => mockGetSlideUsageAnalytics(...args),
    getAdvisorAccountByEmail: vi.fn().mockImplementation((email: string) => {
      // Return trial tier for test user, unlimited for premium user
      if (email === "premium@russellcapital.com") {
        return Promise.resolve({ id: 2, email, accessTier: "unlimited", trialSecondsUsed: 0, trialAccessCount: 0 });
      }
      return Promise.resolve({ id: 1, email, accessTier: "trial", trialSecondsUsed: 0, trialAccessCount: 0 });
    }),
  };
});

function createTrialContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 100,
    openId: "trial-user-test",
    email: "trial@example.com",
    name: "Trial User",
    loginMethod: "password",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: { origin: "https://test.example.com" } } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    },
  };
}

function createOwnerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: process.env.OWNER_OPEN_ID || "owner-open-id",
    email: "owner@russellcapital.com",
    name: "Owner",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: { origin: "https://test.example.com" } } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    },
  };
}

function createPremiumContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "premium-user-test",
    email: "premium@russellcapital.com",
    name: "Premium User",
    loginMethod: "password",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: { origin: "https://test.example.com" } } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    },
  };
}

describe("Slide Rate-Limiting & Usage Tracking", () => {
  beforeAll(() => {
    mockTrialCount = 0;
    mockLogSlideUsage.mockClear();
  });

  describe("Managed user safety ceiling (999/day)", () => {
    it("allows trial user to generate when under limit", async () => {
      mockTrialCount = 0;
      const { ctx } = createTrialContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlidesFromPrompt({
        prompt: "Create a basic retirement planning overview",
        slideCount: 3,
        audience: "client",
      });

      expect(result.slides).toBeInstanceOf(Array);
      expect(result.slides.length).toBe(3);
    });

    it("allows authenticated user at low usage", async () => {
      mockTrialCount = 2;
      const { ctx } = createTrialContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlidesFromPrompt({
        prompt: "Create a Roth conversion strategy overview",
        slideCount: 3,
        audience: "client",
      });

      expect(result.slides).toBeInstanceOf(Array);
    });

    it("allows authenticated user past the retired three-slide threshold", async () => {
      mockTrialCount = 3;
      const { ctx } = createTrialContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlidesFromPrompt({
        prompt: "Create another presentation please",
        slideCount: 3,
        audience: "client",
      });
      expect(result.slides).toHaveLength(3);
    });

    it("allows authenticated user well below the 999/day safety ceiling", async () => {
      mockTrialCount = 5;
      const { ctx } = createTrialContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlidesFromPrompt({
        prompt: "One more presentation attempt",
        slideCount: 3,
        audience: "client",
      });
      expect(result.slides).toHaveLength(3);
    });
  });

  describe("Premium/Owner users bypass rate-limit", () => {
    it("owner can generate unlimited slides", async () => {
      mockTrialCount = 100; // Even if count is high, owner bypasses
      const { ctx } = createOwnerContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlidesFromPrompt({
        prompt: "Create an enterprise strategy presentation",
        slideCount: 3,
        audience: "team",
      });

      expect(result.slides).toBeInstanceOf(Array);
      expect(result.slides.length).toBe(3);
    });

    it("premium user can generate unlimited slides", async () => {
      mockTrialCount = 100;
      const { ctx } = createPremiumContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.generateSlidesFromPrompt({
        prompt: "Create a client portfolio review presentation",
        slideCount: 3,
        audience: "advisor",
      });

      expect(result.slides).toBeInstanceOf(Array);
    });
  });

  describe("slides.remainingToday", () => {
    it("returns unlimited managed-user access", async () => {
      mockTrialCount = 1;
      const { ctx } = createTrialContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.slides.remainingToday();

      expect(result.tier).toBe("unlimited");
      expect(result.limit).toBeNull();
      expect(result.used).toBe(0);
      expect(result.remaining).toBeNull();
    });

    it("returns null limit for owner (unlimited)", async () => {
      const { ctx } = createOwnerContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.slides.remainingToday();

      expect(result.tier).toBe("owner");
      expect(result.limit).toBeNull();
      expect(result.remaining).toBeNull();
    });
  });

  describe("slides.analytics (owner-only)", () => {
    it("returns analytics for owner", async () => {
      const { ctx } = createOwnerContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.slides.analytics();

      expect(result.total).toBe(20);
      expect(result.byTopic).toBeInstanceOf(Array);
      expect(result.byDay).toBeInstanceOf(Array);
      expect(result.byTier).toBeInstanceOf(Array);
    });

    it("rejects non-owner access to analytics", async () => {
      const { ctx } = createTrialContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.slides.analytics()).rejects.toThrow();
    });
  });

  describe("Usage logging", () => {
    it("logs usage after successful generation", async () => {
      mockTrialCount = 0;
      mockLogSlideUsage.mockClear();
      const { ctx } = createTrialContext();
      const caller = appRouter.createCaller(ctx);

      await caller.ai.generateSlidesFromPrompt({
        prompt: "Create a tax planning overview for clients",
        slideCount: 3,
        audience: "client",
      });

      // logSlideUsage is called fire-and-forget, so it should have been called
      expect(mockLogSlideUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 100,
          email: "trial@example.com",
          accessTier: "unlimited",
          action: "generate",
          slideCount: 3,
        })
      );
    });
  });
});
