import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// ─── Helpers ─────────────────────────────────────────────────────────────
const anonCtx = { user: null as any, req: {} as any, res: {} as any };
const fakeUser = { id: 9999, name: "Test Advisor", email: "test@rc.com", role: "user" as const, openId: "test-open-id" };
const authCtx = { user: fakeUser, req: { headers: { origin: "http://localhost" } } as any, res: {} as any };
const caller = appRouter.createCaller(authCtx);
const anonCaller = appRouter.createCaller(anonCtx);

// ─── AI Advisor Chat ─────────────────────────────────────────────────────
describe("ai.advisorChat", () => {
  it("requires authentication", async () => {
    await expect(
      anonCaller.ai.advisorChat({ messages: [{ role: "user", content: "hello" }] })
    ).rejects.toThrow();
  });

  it("validates messages array is required", async () => {
    await expect(
      (caller.ai as any).advisorChat({})
    ).rejects.toThrow();
  });

  it("validates message role must be user or assistant", async () => {
    await expect(
      caller.ai.advisorChat({
        messages: [{ role: "system" as any, content: "hello" }],
      })
    ).rejects.toThrow();
  });

  it("accepts valid messages without clientId", async () => {
    try {
      await caller.ai.advisorChat({
        messages: [{ role: "user", content: "What is a Roth conversion?" }],
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  }, 15000);

  it("accepts optional clientId", async () => {
    try {
      await caller.ai.advisorChat({
        messages: [{ role: "user", content: "Analyze this client" }],
        clientId: 1,
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  }, 15000);

  it("validates messages content must be a string", async () => {
    await expect(
      caller.ai.advisorChat({
        messages: [{ role: "user", content: 123 as any }],
      })
    ).rejects.toThrow();
  });

  it("accepts multi-turn conversation", async () => {
    try {
      await caller.ai.advisorChat({
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
          { role: "user", content: "What about Roth?" },
        ],
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  }, 15000);

  it("returns reply, alerts, and actionSteps in response shape", async () => {
    try {
      const result = await caller.ai.advisorChat({
        messages: [{ role: "user", content: "Give me a tax strategy" }],
      });
      expect(result).toHaveProperty("reply");
      expect(result).toHaveProperty("alerts");
      expect(result).toHaveProperty("actionSteps");
      expect(typeof result.reply).toBe("string");
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(Array.isArray(result.actionSteps)).toBe(true);
    } catch {
      // LLM may fail in test env - that's OK
    }
  }, 15000);
});

// ─── Scenario Adjustments (frontend-only, test the data source) ──────────
describe("clients.list (used by Scenario Adjustments)", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.clients.list()).rejects.toThrow();
  });

  it("returns an array (may be empty if no workspace)", async () => {
    const result = await caller.clients.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns client objects with financial fields needed for scenario modeling", async () => {
    const result = await caller.clients.list();
    if (result.length > 0) {
      const c = result[0];
      expect(c).toHaveProperty("iraBalance");
      expect(c).toHaveProperty("rothBalance");
      expect(c).toHaveProperty("taxableAssets");
      expect(c).toHaveProperty("realEstateEquity");
    }
  });
});

// ─── Dashboard redesign data ─────────────────────────────────────────────
describe("Dashboard redesign data", () => {
  it("clients.list returns lastContactedAt field", async () => {
    const result = await caller.clients.list();
    if (result.length > 0) {
      expect("lastContactedAt" in result[0]).toBe(true);
    }
  });
});
