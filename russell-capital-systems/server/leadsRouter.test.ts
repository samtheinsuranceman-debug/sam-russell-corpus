import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerSrc = readFileSync(resolve("server/leadsRouter.ts"), "utf8");
const appRouter = readFileSync(resolve("server/routers.ts"), "utf8");
const app = readFileSync(resolve("client/src/App.tsx"), "utf8");
const inbox = readFileSync(resolve("client/src/pages/portal/LeadInbox.tsx"), "utf8");

describe("public leads router + advisor inbox", () => {
  it("registers the leads router on the app router", () => {
    expect(appRouter).toContain("leads: leadsRouter");
    expect(appRouter).toContain('import { leadsRouter } from "./leadsRouter"');
  });

  it("exposes public capture/recognize and owner-gated inbox procedures", () => {
    expect(routerSrc).toContain("recognize: publicProcedure");
    expect(routerSrc).toContain("capture: publicProcedure");
    expect(routerSrc).toContain("list: protectedProcedure");
    expect(routerSrc).toContain("get: protectedProcedure");
    expect(routerSrc).toContain("updateStatus: protectedProcedure");
    // Inbox reads must be owner-gated.
    expect(routerSrc).toContain("assertOwner");
    expect(routerSrc).toContain("ownerOpenId");
  });

  it("notifies the owner on capture without leaking figures, best-effort", () => {
    expect(routerSrc).toContain("notifyOwner");
    expect(routerSrc).toContain("New homepage lead captured");
    // Notification is wrapped so it never blocks capture.
    expect(routerSrc).toMatch(/try \{[\s\S]*notifyOwner[\s\S]*catch/);
  });

  it("mounts the owner lead inbox route and page", () => {
    expect(app).toContain('path="/portal/leads"');
    expect(app).toContain("LeadInbox");
    expect(inbox).toContain("trpc.leads.list");
    expect(inbox).toContain("trpc.leads.updateStatus");
    expect(inbox).toContain("Illustrative advisor figures");
    // CSV export is available and self-documents its illustrative nature.
    expect(inbox).toContain("Export CSV");
    expect(inbox).toContain("text/csv");
    expect(inbox).toContain("for advisor review only");
  });
});
