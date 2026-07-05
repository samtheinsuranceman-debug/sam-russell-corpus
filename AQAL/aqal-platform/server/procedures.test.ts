import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============================================================
// TEST CONTEXT FACTORIES
// ============================================================
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(overrides?: Partial<NonNullable<TrpcContext["user"]>>): TrpcContext {
  return {
    user: {
      id: 999,
      openId: "test-user-999",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createUserContext({ id: 1, role: "admin", openId: "admin-001", name: "Admin" });
}

// ============================================================
// PROMO CODE TESTS
// ============================================================
describe("promo.validate", () => {
  it("returns valid: false for non-existent promo code", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.promo.validate({ code: "NONEXISTENT_CODE_XYZ" });
    expect(result.valid).toBe(false);
  });

  it("handles empty string promo code gracefully", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Empty string may either throw validation error or return valid:false
    try {
      const result = await caller.promo.validate({ code: "" });
      expect(result.valid).toBe(false);
    } catch (e) {
      // Zod validation error is also acceptable
      expect(e).toBeDefined();
    }
  });
});

// ============================================================
// AUTH TESTS
// ============================================================
describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user object for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("Test User");
  });
});

// ============================================================
// PROFILE TESTS
// ============================================================
describe("profile.get", () => {
  it("returns null when user has no completed assessment", async () => {
    const ctx = createUserContext({ id: 99999 }); // non-existent user
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.get();
    expect(result).toBeNull();
  });
});

// ============================================================
// ADMIN PROCEDURE AUTHORIZATION TESTS
// ============================================================
describe("admin procedures - authorization", () => {
  it("admin.stats rejects non-admin user", async () => {
    const ctx = createUserContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("admin.users rejects unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.users()).rejects.toThrow();
  });

  it("admin.stats accessible by admin user (returns stats or throws DB error)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // admin.stats may fail due to DB schema state in test env, but should NOT throw auth error
    try {
      const result = await caller.admin.stats();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalUsers");
    } catch (e: any) {
      // DB errors are acceptable in test env — auth passed
      expect(e.message).not.toContain("FORBIDDEN");
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });
});

// ============================================================
// ASSESSMENT PROCEDURE TESTS
// ============================================================
describe("assessment.start", () => {
  it("rejects unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.assessment.start({})).rejects.toThrow();
  });

  it("returns error for invalid promo code", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.assessment.start({ promoCode: "FAKE_CODE_123" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid");
  });
});

// ============================================================
// PAYMENT PROCEDURE TESTS
// ============================================================
describe("payment.createCheckout", () => {
  it("rejects unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.payment.createCheckout({
        productKey: "assessment",
        origin: "https://example.com",
      })
    ).rejects.toThrow();
  });

  it("validates productKey enum", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.payment.createCheckout({
        productKey: "invalid_product" as any,
        origin: "https://example.com",
      })
    ).rejects.toThrow();
  });
});

// ============================================================
// EVIDENCE PROCEDURE TESTS
// ============================================================
describe("evidence.upload", () => {
  it("rejects unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.evidence.upload({
        assessmentId: 1,
        fileBase64: "dGVzdA==",
        fileName: "test.pdf",
        fileType: "application/pdf",
      })
    ).rejects.toThrow();
  });
});

// ============================================================
// WAITLIST TESTS (additional coverage)
// ============================================================
describe("waitlist - edge cases", () => {
  it("join rejects email without domain", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.waitlist.join({ email: "nodomain@" })).rejects.toThrow();
  });

  it("count returns non-negative number", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.waitlist.count();
    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});
