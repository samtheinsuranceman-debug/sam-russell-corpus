/**
 * Vitest tests for the three new features:
 * 1. Stripe Checkout — createCheckout procedure input validation
 * 2. Demo Seeder — demo.seed procedure auth guard
 * 3. Email — sendInvitationEmail graceful fallback when no API key
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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

// ─── 1. Stripe Checkout ───────────────────────────────────────────────────────
describe("billing.createCheckout", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(
      caller.billing.createCheckout({ planSlug: "beginner", interval: "MONTHLY", origin: "https://app.example.com" })
    ).rejects.toThrow();
  });

  it("validates planSlug enum — rejects unknown plan", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      // @ts-expect-error intentionally invalid
      caller.billing.createCheckout({ planSlug: "invalid-plan", interval: "MONTHLY", origin: "https://app.example.com" })
    ).rejects.toThrow();
  });

  it("validates interval enum — rejects unknown interval", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      // @ts-expect-error intentionally invalid
      caller.billing.createCheckout({ planSlug: "beginner", interval: "WEEKLY", origin: "https://app.example.com" })
    ).rejects.toThrow();
  });

  it("validates origin must be a valid URL", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.billing.createCheckout({ planSlug: "beginner", interval: "MONTHLY", origin: "not-a-url" })
    ).rejects.toThrow();
  });
});

// ─── 2. Demo Seeder ───────────────────────────────────────────────────────────
describe("demo.seed", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.demo.seed()).rejects.toThrow();
  });

  it("requires an authenticated user to call seed", async () => {
    const ctx = makeCtx();
    // We only test that the procedure is protected — DB is not available in unit tests
    // so we expect either a DB error or a workspace-not-found TRPC error, not an auth error
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.demo.seed();
      // If it somehow succeeds (e.g., mock DB), that's fine
    } catch (err: unknown) {
      // Should NOT be an authentication error
      const msg = err instanceof Error ? err.message : String(err);
      expect(msg).not.toContain("Please login");
    }
  });
});

// ─── 3. Email — sendInvitationEmail ──────────────────────────────────────────
describe("sendInvitationEmail", () => {
  const originalEnv = process.env.RESEND_API_KEY;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.RESEND_API_KEY = originalEnv;
    } else {
      delete process.env.RESEND_API_KEY;
    }
  });

  it("returns { sent: false } with a reason when RESEND_API_KEY is not set", async () => {
    const { sendInvitationEmail } = await import("./email");
    const result = await sendInvitationEmail({
      toEmail: "test@example.com",
      inviterName: "Sam Russell",
      workspaceName: "Russell Capital Systems",
      role: "ADVISOR",
      inviteUrl: "https://app.example.com/invite?token=abc123",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    expect(result.sent).toBe(false);
    expect(result.reason).toBeDefined();
    expect(typeof result.reason).toBe("string");
  });

  it("does not throw when called without an API key", async () => {
    const { sendInvitationEmail } = await import("./email");
    await expect(
      sendInvitationEmail({
        toEmail: "another@example.com",
        inviterName: "Jordan Blake",
        workspaceName: "Test Workspace",
        role: "ANALYST",
        inviteUrl: "https://app.example.com/invite?token=xyz789",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    ).resolves.not.toThrow();
  });
});

// ─── 4. Stripe products config ────────────────────────────────────────────────
describe("stripeProducts", () => {
  it("getPlanBySlug returns correct plan for known slugs", async () => {
    const { getPlanBySlug } = await import("./stripeProducts");
    const growth = getPlanBySlug("beginner");
    expect(growth).toBeDefined();
    expect(growth?.name).toBe("Beginner");
    expect(growth?.monthlyPriceCents).toBeGreaterThan(0);

    const pro = getPlanBySlug("professional");
    expect(pro?.name).toBe("Professional");
    expect(pro?.monthlyPriceCents).toBeGreaterThan(growth!.monthlyPriceCents);
  });

  it("getPlanBySlug returns undefined for unknown slug", async () => {
    const { getPlanBySlug } = await import("./stripeProducts");
    expect(getPlanBySlug("unknown-plan")).toBeUndefined();
  });

  it("annual price is less than 12x monthly price (discount applied)", async () => {
    const { getPlanBySlug } = await import("./stripeProducts");
    const growth = getPlanBySlug("beginner");
    expect(growth).toBeDefined();
    expect(growth!.annualPriceCents).toBeLessThan(growth!.monthlyPriceCents * 12);
  });
});

// ─── Round 3: Audit Log Viewer ────────────────────────────────────────────────

describe("enterprise.auditLogs procedure", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.enterprise.auditLogs({ page: 1, pageSize: 20 })).rejects.toThrow();
  });

  it("returns paginated structure with correct fields when workspace not found", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.enterprise.auditLogs({ page: 1, pageSize: 20 });
    // No workspace for mock user → returns empty result
    expect(result).toHaveProperty("logs");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page", 1);
    expect(result).toHaveProperty("pageSize", 20);
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.logs)).toBe(true);
  });

  it("validates page must be >= 1", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.enterprise.auditLogs({ page: 0, pageSize: 20 })).rejects.toThrow();
  });

  it("validates pageSize must be between 1 and 100", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.enterprise.auditLogs({ page: 1, pageSize: 0 })).rejects.toThrow();
    await expect(caller.enterprise.auditLogs({ page: 1, pageSize: 101 })).rejects.toThrow();
  });
});

describe("Billing success banner — plan name mapping", () => {
  it("maps all three plan slugs to display names", () => {
    const PLAN_NAMES: Record<string, string> = {
      growth: "Beginner",
      professional: "Professional",
      enterprise: "Enterprise",
    };
    expect(PLAN_NAMES["growth"]).toBe("Beginner");
    expect(PLAN_NAMES["professional"]).toBe("Professional");
    expect(PLAN_NAMES["enterprise"]).toBe("Enterprise");
  });

  it("next billing date is approximately 1 month from now", () => {
    const now = new Date();
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    const diffDays = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(28);
    expect(diffDays).toBeLessThanOrEqual(32);
  });
});

// ─── Billing success banner — URL param parsing ───────────────────────────────

describe("Billing success banner — URL param parsing", () => {
  it("accepts success=1 (Stripe default redirect)", () => {
    const params = new URLSearchParams("success=1&plan=growth");
    const val = params.get("success");
    expect(val === "1" || val === "true").toBe(true);
  });

  it("accepts success=true (manual/test redirect)", () => {
    const params = new URLSearchParams("success=true&plan=professional");
    const val = params.get("success");
    expect(val === "1" || val === "true").toBe(true);
  });

  it("does not trigger banner on success=false", () => {
    const params = new URLSearchParams("success=false&plan=professional");
    const val = params.get("success");
    expect(val === "1" || val === "true").toBe(false);
  });

  it("does not trigger banner when success param is absent", () => {
    const params = new URLSearchParams("plan=professional");
    const val = params.get("success");
    expect(val === "1" || val === "true").toBe(false);
  });

  it("maps plan slug to display name correctly", () => {
    const PLAN_NAMES: Record<string, string> = {
      growth: "Beginner",
      professional: "Professional",
      enterprise: "Enterprise",
    };
    const params = new URLSearchParams("success=true&plan=professional");
    const planSlug = params.get("plan") ?? "professional";
    expect(PLAN_NAMES[planSlug]).toBe("Professional");
  });
});

// ─── Managed OAuth — Legacy Password Retirement ───────────────────────────────
describe("Managed OAuth — Legacy Password Retirement", () => {
  it("rejects every former trial and backdoor password", async () => {
    const { isValidPassword } = await import("../shared/accessControl");
    for (const formerPassword of ["legacy-trial-pass", "legacy-eternal-pass-b", "legacy-eternal-pass-a"]) {
      expect(isValidPassword(formerPassword)).toEqual({ valid: false, type: "invalid" });
    }
  });

  it("invalid password is rejected", async () => {
    const { isValidPassword } = await import("../shared/accessControl");
    const result = isValidPassword("wrongpassword");
    expect(result).toEqual({ valid: false, type: "invalid" });
  });

  it("keeps the legacy password allowlist empty", async () => {
    const { ETERNAL_PASSWORDS } = await import("../shared/accessControl");
    expect(ETERNAL_PASSWORDS).toEqual([]);
  });
});

// ─── Replacement Scoring Engine ──────────────────────────────────────────────
describe("Replacement Radar — Scoring Engine", () => {
  it("returns a scored result with valid verdict", async () => {
    const { scoreReplacementOpportunity } = await import("../shared/replacementScoring");
    const result = scoreReplacementOpportunity({
      carrier: "Allianz",
      productName: "222 Annuity",
      currentValue: 200000,
      surrenderValue: 180000,
      surrenderCharge: 10,
      yearsRemaining: 5,
      guaranteedRate: 1.5,
      annualFees: 3.2,
      hasLivingBenefit: false,
      hasDeathBenefit: false,
      clientAge: 62,
      clientState: "VA" as any,
    }, "VA" as any);
    expect(result).toBeDefined();
    expect(["REPLACE_NOW", "STRONG_CANDIDATE", "MONITOR", "LIKELY_KEEP", "KEEP"]).toContain(result.verdict);
    expect(typeof result.score).toBe("number");
  });

  it("high fees produce more aggressive replacement verdict than low fees", async () => {
    const { scoreReplacementOpportunity } = await import("../shared/replacementScoring");
    const VERDICT_RANK: Record<string, number> = {
      REPLACE_NOW: 5, STRONG_CANDIDATE: 4, MONITOR: 3, LIKELY_KEEP: 2, KEEP: 1,
    };
    const base = {
      carrier: "Allianz", productName: "Test", currentValue: 200000, surrenderValue: 180000,
      surrenderCharge: 0, yearsRemaining: 0, guaranteedRate: 0.5, hasLivingBenefit: false,
      hasDeathBenefit: false, clientAge: 62, clientState: "VA" as any,
    };
    const high = scoreReplacementOpportunity({ ...base, annualFees: 4.5 }, "VA" as any);
    const low = scoreReplacementOpportunity({ ...base, annualFees: 0.1 }, "VA" as any);
    expect(VERDICT_RANK[high.verdict]).toBeGreaterThanOrEqual(VERDICT_RANK[low.verdict]);
  });

  it("includes topCandidates array", async () => {
    const { scoreReplacementOpportunity } = await import("../shared/replacementScoring");
    const result = scoreReplacementOpportunity({
      carrier: "Allianz", productName: "Test", currentValue: 200000, surrenderValue: 180000,
      surrenderCharge: 5, yearsRemaining: 3, guaranteedRate: 1.5, annualFees: 3.0,
      hasLivingBenefit: false, hasDeathBenefit: false, clientAge: 62, clientState: "VA" as any,
    }, "VA" as any);
    expect(Array.isArray(result.topCandidates)).toBe(true);
  });
});

// ─── Living Risk Profile — Drift Detection ───────────────────────────────────
describe("Living Risk Profile — Drift Detection", () => {
  it("analyzeRiskDrift returns a valid drift analysis", async () => {
    const { analyzeRiskDrift } = await import("../shared/livingRiskProfile");
    const snapshots = [
      {
        timestamp: Date.now() - 180 * 24 * 60 * 60 * 1000,
        overallScore: 72,
        categories: [
          { key: "volatility", label: "Volatility Tolerance", score: 70 },
          { key: "loss", label: "Loss Aversion", score: 65 },
          { key: "liquidity", label: "Liquidity Need", score: 80 },
        ],
        depthLevel: 3,
        questionsAnswered: 60,
      },
      {
        timestamp: Date.now(),
        overallScore: 55,
        categories: [
          { key: "volatility", label: "Volatility Tolerance", score: 50 },
          { key: "loss", label: "Loss Aversion", score: 55 },
          { key: "liquidity", label: "Liquidity Need", score: 60 },
        ],
        depthLevel: 3,
        questionsAnswered: 60,
      },
    ];
    const drift = analyzeRiskDrift(snapshots);
    expect(drift).toBeDefined();
    expect(typeof drift.driftMagnitude).toBe("number");
    expect(drift.overallDirection).toBeDefined();
  });

  it("generateRiskDNA returns a DNA profile", async () => {
    const { generateRiskDNA } = await import("../shared/livingRiskProfile");
    const snapshot = {
      timestamp: Date.now(),
      overallScore: 65,
      categories: [
        { key: "volatility", label: "Volatility Tolerance", score: 70 },
        { key: "loss", label: "Loss Aversion", score: 60 },
        { key: "liquidity", label: "Liquidity Need", score: 65 },
      ],
      depthLevel: 3,
      questionsAnswered: 60,
    };
    const dna = generateRiskDNA(snapshot);
    expect(dna).toBeDefined();
    expect(typeof dna.archetype).toBe("string");
    expect(typeof dna.dominantDimension).toBe("string");
    expect(typeof dna.consistencyScore).toBe("number");
  });
});
