import { describe, it, expect } from "vitest";

/* ─── Round 23: Landing page enhancements ──────────────────────────────────── */

// ── 1. clientPortal.validateToken procedure ──────────────────────────────
describe("clientPortal.validateToken procedure", () => {
  it("procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("clientPortal.validateToken");
  });

  it("validatePortalToken DB function exists", async () => {
    const db = await import("./db");
    expect(typeof db.validatePortalToken).toBe("function");
  });

  it("validatePortalToken returns null for non-existent token", async () => {
    const { validatePortalToken } = await import("./db");
    const result = await validatePortalToken("nonexistent-token-abc-xyz-123");
    expect(result).toBeNull();
  });
});

// ── 2. demo.data public procedure (landing page metrics) ────────────────
describe("demo.data public procedure", () => {
  it("procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("demo.data");
  });
});

// ── 3. billing.plans public procedure (landing page pricing) ────────────
describe("billing.plans public procedure", () => {
  it("procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("billing.plans");
  });
});

// ── 4. clientPortal.view public procedure (token-based portal access) ───
describe("clientPortal.view public procedure", () => {
  it("procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("clientPortal.view");
  });
});

// ── 5. Landing page feature completeness ────────────────────────────────
describe("Landing page feature completeness", () => {
  it("all required public procedures for landing page exist", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    // Client login needs validateToken
    expect(procedures).toContain("clientPortal.validateToken");
    // Metrics bar needs demo.data
    expect(procedures).toContain("demo.data");
    // Pricing section needs billing.plans
    expect(procedures).toContain("billing.plans");
    // Client portal view needs clientPortal.view
    expect(procedures).toContain("clientPortal.view");
  });

  it("validatePortalToken handles whitespace in token", async () => {
    const { validatePortalToken } = await import("./db");
    const result = await validatePortalToken("  spaces-around-token  ");
    // Should return null for non-existent token (even with whitespace)
    expect(result).toBeNull();
  });

  it("validatePortalToken handles very long token strings", async () => {
    const { validatePortalToken } = await import("./db");
    const longToken = "a".repeat(500);
    const result = await validatePortalToken(longToken);
    expect(result).toBeNull();
  });
});
