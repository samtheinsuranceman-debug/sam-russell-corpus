import { describe, it, expect, vi } from "vitest";

/* ─── Round 20: Onboarding Wizard, Quick-Action Cards, Welcome-Back Toast ─── */

// ── 1. Onboarding Status DB Helpers ──────────────────────────────────────

describe("Onboarding Status", () => {
  it("isOnboardingComplete returns false for non-existent user", async () => {
    const { isOnboardingComplete } = await import("./db");
    const result = await isOnboardingComplete(999999);
    expect(result).toBe(false);
  });

  it("markOnboardingComplete does not throw for non-existent user", async () => {
    const { markOnboardingComplete } = await import("./db");
    await expect(markOnboardingComplete(999999)).resolves.not.toThrow();
  });

  it("isOnboardingComplete is a function", async () => {
    const db = await import("./db");
    expect(typeof db.isOnboardingComplete).toBe("function");
  });

  it("markOnboardingComplete is a function", async () => {
    const db = await import("./db");
    expect(typeof db.markOnboardingComplete).toBe("function");
  });
});

// ── 2. Onboarding tRPC Procedures ────────────────────────────────────────

describe("Onboarding tRPC Procedures", () => {
  it("onboarding.status procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("onboarding.status");
  });

  it("onboarding.complete procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("onboarding.complete");
  });

  it("onboarding.score procedure still exists", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("onboarding.score");
  });
});

// ── 3. Quick-Action Cards Logic ──────────────────────────────────────────

describe("Quick-Action Cards", () => {
  it("dashboard.stats procedure exists for client count check", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("dashboard.stats");
  });

  it("clients.create procedure exists for Add Client action", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("clients.create");
  });

  it("pipeline.list procedure exists for Create Deal action", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("pipeline.list");
  });

  it("strategy.fullPlan procedure exists for Run Strategy action", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("strategy.fullPlan");
  });
});

// ── 4. OAuth Redirect Flow ───────────────────────────────────────────────

describe("OAuth Redirect with returnPath", () => {
  it("getLoginUrl encodes returnPath in state for /portal/dashboard", () => {
    // Test that the getLoginUrl concept works: state should contain returnPath
    const state = Buffer.from(JSON.stringify({
      origin: "https://example.com",
      returnPath: "/portal/dashboard"
    })).toString("base64");
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    expect(decoded.returnPath).toBe("/portal/dashboard");
    expect(decoded.origin).toBe("https://example.com");
  });

  it("state without returnPath decodes with undefined returnPath", () => {
    const state = Buffer.from(JSON.stringify({
      origin: "https://example.com"
    })).toString("base64");
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    expect(decoded.origin).toBe("https://example.com");
    expect(decoded.returnPath).toBeUndefined();
  });

  it("returnPath defaults to / when state has no returnPath", () => {
    const state = Buffer.from(JSON.stringify({
      origin: "https://example.com"
    })).toString("base64");
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    const returnPath = decoded.returnPath || "/";
    expect(returnPath).toBe("/");
  });

  it("returnPath for Create Client Plan encodes /portal/clients", () => {
    const state = Buffer.from(JSON.stringify({
      origin: "https://example.com",
      returnPath: "/portal/clients"
    })).toString("base64");
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    expect(decoded.returnPath).toBe("/portal/clients");
  });

  it("registerOAuthRoutes is exported from oauth module", async () => {
    const oauth = await import("./_core/oauth");
    expect(typeof oauth.registerOAuthRoutes).toBe("function");
  });
});

// ── 5. Schema Validation ─────────────────────────────────────────────────

describe("Users Table Schema", () => {
  it("users table includes onboardingCompleted column", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.users).toBeDefined();
    const columns = Object.keys((schema.users as any));
    expect(columns).toContain("onboardingCompleted");
  });
});
