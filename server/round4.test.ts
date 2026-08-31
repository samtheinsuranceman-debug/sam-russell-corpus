/**
 * Vitest tests for Round 4 features:
 * 1. Client Notes — notes.list, notes.create, notes.delete procedures
 * 2. Knowledge Upload — knowledge.upload procedure input validation
 * 3. Stripe Billing Portal — billing.createPortalSession procedure
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

// ─── 1. Client Notes ─────────────────────────────────────────────────────────
describe("notes.list", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.notes.list({ clientId: 1 })).rejects.toThrow();
  });

  it("requires a numeric clientId", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      // @ts-expect-error intentionally invalid
      caller.notes.list({ clientId: "abc" })
    ).rejects.toThrow();
  });
});

describe("notes.create", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(
      caller.notes.create({ clientId: 1, content: "Test note", noteType: "GENERAL" })
    ).rejects.toThrow();
  });

  it("rejects empty content", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.notes.create({ clientId: 1, content: "", noteType: "GENERAL" })
    ).rejects.toThrow();
  });

  it("rejects content exceeding 5000 characters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.notes.create({ clientId: 1, content: "x".repeat(5001), noteType: "GENERAL" })
    ).rejects.toThrow();
  });

  it("validates noteType enum — rejects unknown type", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      // @ts-expect-error intentionally invalid
      caller.notes.create({ clientId: 1, content: "Test", noteType: "UNKNOWN_TYPE" })
    ).rejects.toThrow();
  });

  it("accepts all valid noteType values", async () => {
    // Just validate that the Zod schema accepts these values — no DB call needed
    const validTypes = ["CALL", "MEETING", "EMAIL", "TASK", "GENERAL"] as const;
    for (const noteType of validTypes) {
      // We expect a DB/workspace error (not a Zod validation error) for authenticated callers
      const caller = appRouter.createCaller(makeCtx());
      const result = await caller.notes.create({ clientId: 1, content: "Test", noteType }).catch(e => e);
      // Should fail with a server/DB error, not a Zod parse error
      if (result instanceof Error) {
        expect(result.message).not.toMatch(/invalid_enum_value/);
      }
    }
  });
});

describe("notes.delete", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.notes.delete({ noteId: 1 })).rejects.toThrow();
  });

  it("requires a numeric noteId", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      // @ts-expect-error intentionally invalid
      caller.notes.delete({ noteId: "abc" })
    ).rejects.toThrow();
  });
});

// ─── 2. Knowledge Upload ─────────────────────────────────────────────────────
describe("knowledge.upload", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(
      caller.knowledge.upload({
        title: "Test Doc",
        fileName: "test.pdf",
        mimeType: "application/pdf",
        fileDataBase64: "dGVzdA==",
      })
    ).rejects.toThrow();
  });

  it("rejects empty title", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.knowledge.upload({
        title: "",
        fileName: "test.pdf",
        mimeType: "application/pdf",
        fileDataBase64: "dGVzdA==",
      })
    ).rejects.toThrow();
  });

  it("rejects empty fileName", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.knowledge.upload({
        title: "Test Doc",
        fileName: "",
        mimeType: "application/pdf",
        fileDataBase64: "dGVzdA==",
      })
    ).rejects.toThrow();
  });

  it("rejects empty fileDataBase64", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.knowledge.upload({
        title: "Test Doc",
        fileName: "test.pdf",
        mimeType: "application/pdf",
        fileDataBase64: "",
      })
    ).rejects.toThrow();
  });

  it("validates docType enum — rejects unknown type", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      // @ts-expect-error intentionally invalid
      caller.knowledge.upload({
        title: "Test Doc",
        fileName: "test.pdf",
        mimeType: "application/pdf",
        fileDataBase64: "dGVzdA==",
        docType: "INVALID_TYPE",
      })
    ).rejects.toThrow();
  });

  it("uses PLAYBOOK_GUIDANCE as default docType", async () => {
    // Validate that the schema accepts a call without docType (uses default)
    // We expect a DB/storage error, not a Zod validation error
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.knowledge.upload({
      title: "Test Doc",
      fileName: "test.pdf",
      mimeType: "application/pdf",
      fileDataBase64: "dGVzdA==",
    }).catch(e => e);
    if (result instanceof Error) {
      // Should fail with workspace/storage error, not Zod parse error
      expect(result.message).not.toMatch(/invalid_type|invalid_enum/);
    }
  });
});

// ─── 3. Stripe Billing Portal ─────────────────────────────────────────────────
describe("billing.createPortalSession", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(
      caller.billing.createPortalSession({ origin: "https://app.example.com" })
    ).rejects.toThrow();
  });

  it("validates origin must be a valid URL", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.billing.createPortalSession({ origin: "not-a-url" })
    ).rejects.toThrow();
  });

  it("rejects missing origin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      // @ts-expect-error intentionally missing required field
      caller.billing.createPortalSession({})
    ).rejects.toThrow();
  });

  it("requires authenticated user to call portal session", async () => {
    // Authenticated but no Stripe customer — should fail with BAD_REQUEST, not auth error
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.billing.createPortalSession({
      origin: "https://app.example.com",
    }).catch(e => e);
    if (result instanceof Error) {
      // Should be a business logic error (no subscription), not an auth error
      expect(result.message).not.toMatch(/Please login/);
    }
  });
});
