/**
 * finance.readiness is the one finance procedure that reads clinical data,
 * so it is clinical-edition-only. The calculators and the fact finder never
 * call the server at all.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

function ctxFor(role: "user" | "admin" | null): TrpcContext {
  const user = role
    ? { id: 7, openId: "u7", email: "u7@example.com", name: "U", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }
    : null;
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("finance.readiness release gating", () => {
  it("is registered as a clinical procedure by exact path, not by prefix", async () => {
    const { isClinicalProcedure, CLINICAL_TRPC_PROCEDURES } = await import("./compliance/releasePolicy");
    expect(CLINICAL_TRPC_PROCEDURES.has("finance.readiness")).toBe(true);
    expect(isClinicalProcedure("finance.readiness")).toBe(true);
    // Nothing else under finance. exists today; if one is added it must be
    // registered deliberately rather than swept up by a prefix.
    expect(isClinicalProcedure("finance.somethingElse")).toBe(false);
  });

  it("is FORBIDDEN in the public wellness edition even for a signed-in admin", async () => {
    vi.stubEnv("PUBLIC_WELLNESS_MODE", "true");
    vi.stubEnv("ENABLE_CLINICAL_TOOLS", "false");
    const { appRouter } = await import("./routers");
    for (const role of ["user", "admin"] as const) {
      const caller = appRouter.createCaller(ctxFor(role));
      await expect(caller.finance.readiness({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("requires a signed-in user in the clinical edition", async () => {
    vi.stubEnv("PUBLIC_WELLNESS_MODE", "false");
    vi.stubEnv("ENABLE_CLINICAL_TOOLS", "true");
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(ctxFor(null));
    await expect(caller.finance.readiness({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns a neutral profile for a signed-in clinical user with no records and no database", async () => {
    vi.stubEnv("PUBLIC_WELLNESS_MODE", "false");
    vi.stubEnv("ENABLE_CLINICAL_TOOLS", "true");
    vi.stubEnv("DATABASE_URL", "");
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(ctxFor("user"));
    const result = await caller.finance.readiness({ monthlyExpenses: 6_000 });
    expect(result.snapshot.sources).toEqual([]);
    expect(result.profile.decisionCapacity).toBeGreaterThan(0);
    expect(result.profile.guardrails.liquidityFloorDollars).toBeGreaterThan(0);
  });

  it("rejects non-finite or negative money", async () => {
    vi.stubEnv("PUBLIC_WELLNESS_MODE", "false");
    vi.stubEnv("ENABLE_CLINICAL_TOOLS", "true");
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(ctxFor("user"));
    await expect(caller.finance.readiness({ monthlyExpenses: -1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.readiness({ liquidAssets: Number.POSITIVE_INFINITY })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
