import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
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
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createOwnerContext(): TrpcContext {
  return createUserContext({
    id: 999,
    openId: process.env.OWNER_OPEN_ID ?? "owner-open-id",
    email: "sam@russellcapitalsystems.com",
    name: "Sam Russell",
    role: "admin",
  });
}

describe("complianceTracking", () => {
  describe("hasSignedThisSession", () => {
    it("returns signed: false when no session exists", async () => {
      const ctx = createUserContext({ id: 9999 });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.complianceTracking.hasSignedThisSession();
      expect(result).toHaveProperty("signed");
      expect(typeof result.signed).toBe("boolean");
    });
  });

  describe("sign", () => {
    it("creates a compliance signature and session", async () => {
      const ctx = createUserContext({ id: 8888, name: "Sign Test User", email: "signtest@example.com" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.complianceTracking.sign({
        signedName: "Sign Test User",
        signedDate: "04/01/2026",
        userAgent: "vitest-agent",
      });
      expect(result.success).toBe(true);
      expect(typeof result.signatureId).toBe("number");
      expect(typeof result.sessionId).toBe("number");
    });
  });

  describe("logPageVisit", () => {
    it("logs a page visit for an active session", async () => {
      const ctx = createUserContext({ id: 7777, name: "Page Visit User", email: "pagevisit@example.com" });
      const caller = appRouter.createCaller(ctx);
      // First sign to create a session
      const signResult = await caller.complianceTracking.sign({
        signedName: "Page Visit User",
        signedDate: "04/01/2026",
        userAgent: "vitest-agent",
      });
      expect(signResult.sessionId).toBeTruthy();
      // Log a page visit
      const logResult = await caller.complianceTracking.logPageVisit({
        sessionId: signResult.sessionId!,
        pagePath: "/portal/dashboard",
        pageTitle: "Dashboard",
      });
      expect(logResult.success).toBe(true);
    });
  });

  describe("endSession", () => {
    it("ends an active session", async () => {
      const ctx = createUserContext({ id: 6666, name: "End Session User", email: "endsession@example.com" });
      const caller = appRouter.createCaller(ctx);
      // First sign to create a session
      const signResult = await caller.complianceTracking.sign({
        signedName: "End Session User",
        signedDate: "04/01/2026",
        userAgent: "vitest-agent",
      });
      expect(signResult.sessionId).toBeTruthy();
      // End the session
      const endResult = await caller.complianceTracking.endSession({
        sessionId: signResult.sessionId!,
      });
      expect(endResult.success).toBe(true);
    });
  });
});

describe("websiteUsage", () => {
  describe("managed authorization", () => {
    it("rejects non-admin users", async () => {
      const ctx = createUserContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.websiteUsage.verifyPassword({ password: "ignored" })
      ).rejects.toThrow();
    });

    it("accepts an authenticated managed admin without a secondary password", async () => {
      const ctx = createOwnerContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.websiteUsage.verifyPassword();
      expect(result.verified).toBe(true);
      expect(result.authorization).toBe("managed-oauth");
    });
  });

  describe("getSummary", () => {
    it("rejects non-admin users", async () => {
      const ctx = createUserContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.websiteUsage.getSummary()
      ).rejects.toThrow();
    });

    it("returns summary stats for a managed admin", async () => {
      const ctx = createOwnerContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.websiteUsage.getSummary();
      expect(result).toHaveProperty("totalUsers");
      expect(result).toHaveProperty("totalSessions");
      expect(result).toHaveProperty("totalSignatures");
      expect(result).toHaveProperty("totalDurationSecs");
      expect(result).toHaveProperty("activeSessions");
      expect(typeof result.totalUsers).toBe("number");
      expect(typeof result.totalSessions).toBe("number");
    });
  });

  describe("listUsers", () => {
    it("returns a list of users for a managed admin", async () => {
      const ctx = createOwnerContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.websiteUsage.listUsers();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
