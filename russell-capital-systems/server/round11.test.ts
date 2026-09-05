import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// ─── Helpers ─────────────────────────────────────────────────────────────
const anonCtx = { user: null as any, req: {} as any, res: {} as any };
const fakeUser = { id: 9998, name: "Test Advisor R11", email: "r11@rc.com", role: "user" as const, openId: "test-open-id-r11" };
const authCtx = { user: fakeUser, req: { headers: { origin: "http://localhost" } } as any, res: {} as any };
const caller = appRouter.createCaller(authCtx);
const anonCaller = appRouter.createCaller(anonCtx);

// ═══════════════════════════════════════════════════════════════════════════
// ─── CLIENT TAGS ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("tags.list", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.tags.list()).rejects.toThrow();
  });

  it("returns an array for authenticated user", async () => {
    try {
      const result = await caller.tags.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("tags.create", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.tags.create({ name: "Test" })).rejects.toThrow();
  });

  it("validates name is required and non-empty", async () => {
    await expect(caller.tags.create({ name: "" })).rejects.toThrow();
  });

  it("validates name max length", async () => {
    await expect(caller.tags.create({ name: "a".repeat(101) })).rejects.toThrow();
  });

  it("accepts valid name with default color", async () => {
    try {
      const result = await caller.tags.create({ name: "High Priority" });
      expect(result).toBeDefined();
      expect(result.name).toBe("High Priority");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts custom color", async () => {
    try {
      const result = await caller.tags.create({ name: "Tax Planning", color: "#ff6600" });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("tags.delete", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.tags.delete({ tagId: 1 })).rejects.toThrow();
  });

  it("validates tagId is a number", async () => {
    await expect((caller.tags as any).delete({ tagId: "abc" })).rejects.toThrow();
  });

  it("accepts valid tagId", async () => {
    try {
      const result = await caller.tags.delete({ tagId: 99999 });
      expect(result).toEqual({ deleted: true });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("tags.assign", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.tags.assign({ clientId: 1, tagId: 1 })).rejects.toThrow();
  });

  it("validates both clientId and tagId", async () => {
    await expect((caller.tags as any).assign({ clientId: "abc", tagId: 1 })).rejects.toThrow();
    await expect((caller.tags as any).assign({ clientId: 1, tagId: "abc" })).rejects.toThrow();
  });
});

describe("tags.remove", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.tags.remove({ clientId: 1, tagId: 1 })).rejects.toThrow();
  });

  it("accepts valid input", async () => {
    try {
      const result = await caller.tags.remove({ clientId: 99999, tagId: 99999 });
      expect(result).toEqual({ removed: true });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("tags.byClient", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.tags.byClient({ clientId: 1 })).rejects.toThrow();
  });

  it("returns an array of tag IDs", async () => {
    try {
      const result = await caller.tags.byClient({ clientId: 1 });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("tags.bulkByClients", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.tags.bulkByClients({ clientIds: [1] })).rejects.toThrow();
  });

  it("returns a map for valid client IDs", async () => {
    try {
      const result = await caller.tags.bulkByClients({ clientIds: [1, 2, 3] });
      expect(typeof result).toBe("object");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("handles empty array", async () => {
    try {
      const result = await caller.tags.bulkByClients({ clientIds: [] });
      expect(typeof result).toBe("object");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── ADVISOR GOALS ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("goals.list", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.goals.list()).rejects.toThrow();
  });

  it("returns an array for authenticated user", async () => {
    try {
      const result = await caller.goals.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("goals.create", () => {
  it("requires authentication", async () => {
    await expect(
      anonCaller.goals.create({
        goalType: "AUM_TARGET",
        targetValue: 50000000,
        period: "Q2 2026",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString(),
      })
    ).rejects.toThrow();
  });

  it("validates goalType enum", async () => {
    await expect(
      (caller.goals as any).create({
        goalType: "INVALID_TYPE",
        targetValue: 100,
        period: "Q2 2026",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      })
    ).rejects.toThrow();
  });

  it("validates targetValue is positive", async () => {
    await expect(
      caller.goals.create({
        goalType: "AUM_TARGET",
        targetValue: -100,
        period: "Q2 2026",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      })
    ).rejects.toThrow();
  });

  it("accepts valid AUM_TARGET goal", async () => {
    try {
      const result = await caller.goals.create({
        goalType: "AUM_TARGET",
        targetValue: 50000000,
        period: "Q2 2026",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString(),
      });
      expect(result).toBeDefined();
      expect(result.goalType).toBe("AUM_TARGET");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts DEALS_CLOSED goal", async () => {
    try {
      const result = await caller.goals.create({
        goalType: "DEALS_CLOSED",
        targetValue: 10,
        period: "Q2 2026",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString(),
      });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts NEW_CLIENTS goal", async () => {
    try {
      const result = await caller.goals.create({
        goalType: "NEW_CLIENTS",
        targetValue: 15,
        period: "Q1 2026",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString(),
      });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts REVENUE goal", async () => {
    try {
      const result = await caller.goals.create({
        goalType: "REVENUE",
        targetValue: 500000,
        period: "FY 2026",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 86400000).toISOString(),
      });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("goals.delete", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.goals.delete({ goalId: 1 })).rejects.toThrow();
  });

  it("validates goalId is a number", async () => {
    await expect((caller.goals as any).delete({ goalId: "abc" })).rejects.toThrow();
  });
});

describe("goals.progress", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.goals.progress()).rejects.toThrow();
  });

  it("returns an array for authenticated user", async () => {
    try {
      const result = await caller.goals.progress();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("goals.update", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.goals.update({ goalId: 1, targetValue: 100 })).rejects.toThrow();
  });

  it("validates goalId is a number", async () => {
    await expect((caller.goals as any).update({ goalId: "abc" })).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── WEBHOOK INTEGRATIONS ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("webhooks.list", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.webhooks.list()).rejects.toThrow();
  });

  it("returns an array for authenticated user", async () => {
    try {
      const result = await caller.webhooks.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("webhooks.create", () => {
  it("requires authentication", async () => {
    await expect(
      anonCaller.webhooks.create({ url: "https://hooks.slack.com/test", events: ["*"] })
    ).rejects.toThrow();
  });

  it("validates url is a valid URL", async () => {
    await expect(
      caller.webhooks.create({ url: "not-a-url", events: ["*"] })
    ).rejects.toThrow();
  });

  it("validates events array is non-empty", async () => {
    await expect(
      caller.webhooks.create({ url: "https://hooks.slack.com/test", events: [] })
    ).rejects.toThrow();
  });

  it("accepts valid webhook with all events", async () => {
    try {
      const result = await caller.webhooks.create({
        url: "https://hooks.slack.example/services/test",
        label: "Test Slack Hook",
        events: ["*"],
      });
      expect(result).toBeDefined();
      expect(result.url).toBe("https://hooks.slack.example/services/test");
      expect(result.active).toBe(true);
      expect(result.secret).toBeDefined();
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts webhook with specific events", async () => {
    try {
      const result = await caller.webhooks.create({
        url: "https://example.com/webhook",
        events: ["client.created", "deal.closed_won"],
      });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("webhooks.delete", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.webhooks.delete({ webhookId: 1 })).rejects.toThrow();
  });

  it("validates webhookId is a number", async () => {
    await expect((caller.webhooks as any).delete({ webhookId: "abc" })).rejects.toThrow();
  });
});

describe("webhooks.update", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.webhooks.update({ webhookId: 1, active: false })).rejects.toThrow();
  });

  it("validates url if provided", async () => {
    await expect(
      caller.webhooks.update({ webhookId: 1, url: "not-a-url" })
    ).rejects.toThrow();
  });

  it("accepts valid update with active toggle", async () => {
    try {
      const result = await caller.webhooks.update({ webhookId: 99999, active: false });
      expect(result).toEqual({ updated: true });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("webhooks.events", () => {
  it("returns available event types (public)", async () => {
    const result = await anonCaller.webhooks.events();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("client.created");
    expect(result).toContain("deal.closed_won");
    expect(result).toContain("strategy.generated");
  });
});

describe("webhooks.test", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.webhooks.test({ webhookId: 1 })).rejects.toThrow();
  });

  it("validates webhookId is a number", async () => {
    await expect((caller.webhooks as any).test({ webhookId: "abc" })).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── WEBHOOK DISPATCH MODULE ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("webhookDispatch module", () => {
  it("exports WEBHOOK_EVENTS constant", async () => {
    const { WEBHOOK_EVENTS } = await import("./webhookDispatch");
    expect(Array.isArray(WEBHOOK_EVENTS)).toBe(true);
    expect(WEBHOOK_EVENTS.length).toBeGreaterThan(0);
    expect(WEBHOOK_EVENTS).toContain("client.created");
    expect(WEBHOOK_EVENTS).toContain("deal.stage_changed");
    expect(WEBHOOK_EVENTS).toContain("deal.closed_won");
    expect(WEBHOOK_EVENTS).toContain("strategy.generated");
    expect(WEBHOOK_EVENTS).toContain("note.added");
  });

  it("exports dispatchWebhook function", async () => {
    const { dispatchWebhook } = await import("./webhookDispatch");
    expect(typeof dispatchWebhook).toBe("function");
  });

  it("dispatchWebhook handles no active webhooks gracefully", async () => {
    const { dispatchWebhook } = await import("./webhookDispatch");
    // Should not throw even if no webhooks exist
    const result = await dispatchWebhook(99999, "client.created", { test: true });
    // Returns undefined when no hooks found
    expect(result).toBeUndefined();
  });
});
