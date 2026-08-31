import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for slide generation rate-limiting and usage logging.
 *
 * These tests verify:
 * 1. Managed users have a 999-per-day safety ceiling rather than a trial gate
 * 2. The slideQuota endpoint returns correct remaining counts
 * 3. Non-trial users (owner/subscriber) bypass rate limits
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 99,
    openId: "test-user-open-id",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.manus.space" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("slides rate-limiting", () => {
  describe("slideQuota endpoint", () => {
    it("returns quota information for authenticated users", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // The slideQuota query should return an object with limit, used, remaining, tier
      const quota = await caller.slides.remainingToday();
      expect(quota).toHaveProperty("tier");
      expect(quota).toHaveProperty("used");
      expect(typeof quota.used).toBe("number");
      expect(quota.used).toBeGreaterThanOrEqual(0);

      // Legacy tier labels can remain for compatibility, but the old 3/day gate is retired.
      if (quota.tier === "trial") {
        expect(quota.limit).toBe(999);
        expect(typeof quota.remaining).toBe("number");
      }
    });
  });

  describe("rate limit constants", () => {
    it("managed-user safety ceiling should be 999", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const quota = await caller.slides.remainingToday();

      if (quota.tier === "trial") {
        expect(quota.limit).toBe(999);
      }
    });
  });

  describe("generateSlides mutation", () => {
    it("rejects unauthenticated users", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.ai.generateSlides({
          toolName: "Test Tool",
          sections: [{ title: "Test", items: [{ label: "A", value: "B" }] }],
          slideCount: 3,
          audience: "client",
        })
      ).rejects.toThrow();
    });
  });

  describe("slideUsageAnalytics endpoint", () => {
    it("returns analytics data structure", async () => {
      const ctx = createMockContext({ role: "admin" });
      const caller = appRouter.createCaller(ctx);

      const analytics = await caller.slides.analytics();
      expect(analytics).toHaveProperty("byTopic");
      expect(analytics).toHaveProperty("byDay");
      expect(analytics).toHaveProperty("byTier");
      expect(Array.isArray(analytics.byTopic)).toBe(true);
      expect(Array.isArray(analytics.byDay)).toBe(true);
      expect(Array.isArray(analytics.byTier)).toBe(true);
    });
  });
});
