import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("planning workspace integration", () => {
  it("loads the Planning Cases page module", async () => {
    const module = await import("../client/src/pages/portal/PlanningCases");
    expect(module.default).toBeTypeOf("function");
  });

  it("registers the planning route and primary sidebar destination", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    const shell = readFileSync("client/src/components/AppShell.tsx", "utf8");
    expect(app).toContain('path="/portal/planning-cases"');
    expect(shell).toContain('path: "/portal/planning-cases"');
    expect(shell).toContain('label: "Planning Cases"');
  });

  it("uses real queries and mutations with loading, empty, and failure states", () => {
    const page = readFileSync("client/src/pages/portal/PlanningCases.tsx", "utf8");
    for (const contract of [
      "trpc.planningCases.list.useQuery",
      "trpc.planningCases.get.useQuery",
      "trpc.planningCases.notes.useQuery",
      "trpc.planningCases.create.useMutation",
      "trpc.planningCases.update.useMutation",
      "trpc.planningCases.addNote.useMutation",
    ]) expect(page).toContain(contract);
    expect(page).toContain("casesQuery.isLoading");
    expect(page).toContain("casesQuery.isError");
    expect(page).toContain("No planning cases yet");
  });

  it("shows persisted planning counts on the dashboard without live AUM", () => {
    const dashboard = readFileSync("client/src/pages/portal/Dashboard.tsx", "utf8");
    expect(dashboard).toContain("trpc.planningCases.list.useQuery");
    expect(dashboard).toContain("Active Planning Cases");
    expect(dashboard).toContain("Some dashboard data could not be loaded");
    expect(dashboard).not.toMatch(/Total AUM|Live AUM/i);
  });
});
