import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("system health and route isolation", () => {
  it("removes the website-usage password and uses managed admin authorization", () => {
    const router = readFileSync("server/routers.ts", "utf8");
    const start = router.indexOf("websiteUsage: router({");
    const end = router.indexOf("household: router({", start);
    const block = router.slice(start, end);
    expect(block).not.toMatch(/===\s*["'][^"']{6,}["']/); // no hard-coded password comparison
    expect(block).toContain("verifyPassword: adminProcedure");
    expect(block).toContain("listUsers: adminProcedure");
    expect(block).toContain("getSummary: adminProcedure");
  });

  it("keeps error reporting public but protects error history with adminProcedure", () => {
    const router = readFileSync("server/experienceRouter.ts", "utf8");
    const start = router.indexOf("export const errorLogRouter");
    const block = router.slice(start);
    expect(block).toContain("report: publicProcedure");
    expect(block).toContain("list: adminProcedure");
    expect(block).toContain("stats: adminProcedure");
  });

  it("reports page errors to the active tRPC endpoint and isolates each route", () => {
    const boundary = readFileSync("client/src/components/ErrorBoundary.tsx", "utf8");
    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(boundary).toContain('/api/trpc/errorLog.report?batch=1');
    expect(app).toContain("const [location] = useLocation()");
    expect(app).toContain("<ErrorBoundary key={location}");
  });

  it("registers and exposes the admin System Health dashboard", async () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    const shell = readFileSync("client/src/components/AppShell.tsx", "utf8");
    const summary = (await import("../client/src/data/pageAuditSummary")).PAGE_AUDIT_SUMMARY;
    const page = await import("../client/src/pages/portal/SystemHealth");
    expect(app).toContain('path="/portal/system-health"');
    expect(shell).toContain('path: "/portal/system-health"');
    expect(page.default).toBeTypeOf("function");
    expect(summary.routeCount).toBe(231);
    expect(summary.belowFiveCount).toBe(78);
  });
});
