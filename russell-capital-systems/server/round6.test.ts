/**
 * Vitest tests for Round 6 features:
 * 1. Client Last-Contacted Indicator — clients.list returns lastContactedAt
 * 2. Knowledge Doc Full-Text Viewer — knowledge.list returns content field
 * 3. Strategy Save-to-Client — strategy.save procedure
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Shared test context factory ─────────────────────────────────────────────
function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-open-id",
      email: "sam@example.com",
      name: "Sam Russell",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makeUnauthCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const caller = appRouter.createCaller;

// ─── 1. Client Last-Contacted Indicator ─────────────────────────────────────
describe("clients.list returns lastContactedAt", () => {
  it("should return an array (may be empty if no workspace)", async () => {
    const ctx = makeCtx();
    const result = await caller(ctx).clients.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("each client should have lastContactedAt field (null or Date)", async () => {
    const ctx = makeCtx();
    const result = await caller(ctx).clients.list();
    for (const c of result) {
      expect(c).toHaveProperty("lastContactedAt");
    }
  });

  it("each client should have opportunityScore field", async () => {
    const ctx = makeCtx();
    const result = await caller(ctx).clients.list();
    for (const c of result) {
      expect(c).toHaveProperty("opportunityScore");
      expect(typeof c.opportunityScore).toBe("number");
    }
  });

  it("should reject unauthenticated calls", async () => {
    const ctx = makeUnauthCtx();
    await expect(caller(ctx).clients.list()).rejects.toThrow();
  });
});

// ─── 2. Knowledge Doc Full-Text Viewer (knowledge.list returns content) ─────
describe("knowledge.list includes content field", () => {
  it("should return an array", async () => {
    const ctx = makeCtx();
    const result = await caller(ctx).knowledge.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("each doc should have content field (string or null)", async () => {
    const ctx = makeCtx();
    const result = await caller(ctx).knowledge.list();
    for (const doc of result) {
      expect(doc).toHaveProperty("content");
      expect(doc.content === null || typeof doc.content === "string").toBe(true);
    }
  });

  it("each doc should have fileUrl field for uploaded docs", async () => {
    const ctx = makeCtx();
    const result = await caller(ctx).knowledge.list();
    for (const doc of result) {
      expect(doc).toHaveProperty("fileUrl");
    }
  });

  it("should reject unauthenticated calls", async () => {
    const ctx = makeUnauthCtx();
    await expect(caller(ctx).knowledge.list()).rejects.toThrow();
  });
});

// ─── 3. Strategy Save-to-Client ─────────────────────────────────────────────
describe("strategy.save procedure", () => {
  it("should reject unauthenticated calls", async () => {
    const ctx = makeUnauthCtx();
    await expect(
      caller(ctx).strategy.save({
        clientId: 1,
        summary: "Test strategy",
      })
    ).rejects.toThrow();
  });

  it("should reject missing clientId", async () => {
    const ctx = makeCtx();
    await expect(
      caller(ctx).strategy.save({
        clientId: undefined as any,
        summary: "Test",
      })
    ).rejects.toThrow();
  });

  it("should accept valid input with summary and taxPlan", async () => {
    const ctx = makeCtx();
    // This may fail at DB level (no workspace), but should not fail at input validation
    try {
      await caller(ctx).strategy.save({
        clientId: 999,
        summary: "AI-generated strategy summary",
        taxPlan: "Full tax plan content here",
      });
    } catch (e: any) {
      // Expected: INTERNAL_SERVER_ERROR (no workspace) — not a validation error
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("should accept optional fields: insurancePlan, investmentPlan, advisorScript", async () => {
    const ctx = makeCtx();
    try {
      await caller(ctx).strategy.save({
        clientId: 999,
        summary: "Summary",
        taxPlan: "Tax plan",
        insurancePlan: "Insurance plan",
        investmentPlan: "Investment plan",
        advisorScript: "Advisor script",
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

// ─── 4. Strategy listByClient ───────────────────────────────────────────────
describe("strategy.listByClient procedure", () => {
  it("should reject access to clientId not in user's workspace (data isolation)", async () => {
    const ctx = makeCtx();
    // clientId 999 doesn't belong to the test user's workspace — security gate must block
    await expect(
      caller(ctx).strategy.listByClient({ clientId: 999 })
    ).rejects.toThrow(/Client not found in your workspace|Workspace not found/);
  });

  it("should reject unauthenticated calls", async () => {
    const ctx = makeUnauthCtx();
    await expect(
      caller(ctx).strategy.listByClient({ clientId: 1 })
    ).rejects.toThrow();
  });
});

// ─── 5. getLastContactDates helper ──────────────────────────────────────────
describe("getLastContactDates db helper", () => {
  it("should be importable and return a record", async () => {
    const { getLastContactDates } = await import("./db");
    const result = await getLastContactDates(999);
    expect(typeof result).toBe("object");
  });
});
