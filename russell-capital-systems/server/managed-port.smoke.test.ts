import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { ETERNAL_PASSWORDS, OWNER_BYPASS_EMAILS, isOwnerBypassEmail, isValidPassword } from "../shared/accessControl";

const baseUser = {
  id: 77,
  openId: "managed-smoke-user",
  email: "advisor@example.com",
  name: "Managed Advisor",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie() {}, cookie() {} } as unknown as TrpcContext["res"],
  };
}

describe("managed primary-port safeguards", () => {
  it("preserves all 222 primary paths after additive unification", () => {
    const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
    const routeSet = (source: string) => new Set(Array.from(source.matchAll(/<Route\b[^>]*\bpath=[{]?["']([^"']+)["']/g), match => match[1]));
    const currentRoutes = routeSet(app);
    const scoredAudit = JSON.parse(readFileSync(resolve("audit/page_audit_results.json"), "utf8"));
    const auditedRecords = scoredAudit.records ?? scoredAudit.pages ?? [];
    const auditedRoutes = new Set(auditedRecords.map((record: { route: string }) => record.route));
    expect(auditedRoutes.size).toBeGreaterThanOrEqual(231);
    for (const route of auditedRoutes) expect(currentRoutes.has(String(route)), String(route)).toBe(true);
    expect(currentRoutes.size).toBe(248); // 232 + ultra-calculator, fact-finder, calculators + portal/leads + financial-assessment, ai-advisor, wealth-genome, my-journey, plan-ledger, connections, controls, erosion, sphere, forgiveness, tax-schedule, site-health
  });

  it("keeps managed analytics and runtime public assets", () => {
    const html = readFileSync(resolve("client/index.html"), "utf8");
    expect(html).toContain("%VITE_ANALYTICS_ENDPOINT%/umami");
    expect(html).toContain("%VITE_ANALYTICS_WEBSITE_ID%");
    expect(existsSync(resolve("client/public/__manus__/debug-collector.js"))).toBe(true);
    // version.json is written by the managed host at deploy time; it was never a repo file.
  });

  it("retires password and email-bypass authentication", () => {
    expect(ETERNAL_PASSWORDS).toEqual([]);
    expect(OWNER_BYPASS_EMAILS).toEqual([]);
    expect(isOwnerBypassEmail("owner@example.com")).toBe(false);
    expect(isValidPassword("any-value")).toEqual({ valid: false, type: "invalid" });
  });

  it("rejects the legacy password gate", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.auth.passwordGate({ password: "legacy-password" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("requires an admin role for hidden material", async () => {
    const caller = appRouter.createCaller(context(baseUser));
    await expect(caller.hiddenMaterial.verifyPassword({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an authenticated managed admin to enter hidden material without a second password", async () => {
    const caller = appRouter.createCaller(context({ ...baseUser, role: "admin" }));
    await expect(caller.hiddenMaterial.verifyPassword({})).resolves.toEqual({
      verified: true,
      access: "managed_oauth",
    });
  });
});
