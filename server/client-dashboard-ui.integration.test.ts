import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("client and dashboard UI integration", () => {
  it("loads the client directory and detail modules", async () => {
    const [directory, detail] = await Promise.all([
      import("../client/src/pages/portal/Clients"),
      import("../client/src/pages/portal/ClientDetail"),
    ]);
    expect(directory.default).toBeTypeOf("function");
    expect(detail.default).toBeTypeOf("function");
  });

  it("wires the directory to real client list and create procedures with complete states", () => {
    const directory = readFileSync("client/src/pages/portal/Clients.tsx", "utf8");
    expect(directory).toContain("trpc.clients.list.useQuery");
    expect(directory).toContain("trpc.clients.create.useMutation");
    expect(directory).toContain("clientsQuery.isLoading");
    expect(directory).toContain("clientsQuery.isError");
    expect(directory).toContain("clientsQuery.refetch()");
    expect(directory).toContain("No clients yet. Add your first client");
    expect(directory).toContain("Full name is required");
    expect(directory).toContain('toast.success("Client added")');
    expect(directory).toContain("onError: (e) => toast.error(e.message)");
  });

  it("wires profile load and update to persistence confirmation after refetch", () => {
    const detail = readFileSync("client/src/pages/portal/ClientDetail.tsx", "utf8");
    expect(detail).toContain("trpc.clients.get.useQuery");
    expect(detail).toContain("trpc.clients.update.useMutation");
    expect(detail).toContain("clientQuery.isLoading");
    expect(detail).toContain("clientQuery.isError");
    expect(detail).toContain("await clientQuery.refetch()");
    expect(detail).toContain("Client profile saved and reloaded");
    expect(detail).toContain("Client profile was not saved");
    expect(detail).toContain("Financial values must be valid non-negative numbers");
  });

  it("handles every dashboard source as loading, empty, or failed and omits live AUM", () => {
    const dashboard = readFileSync("client/src/pages/portal/Dashboard.tsx", "utf8");
    for (const source of [
      "practice metrics",
      "planning cases",
      "analytics",
      "net-worth history",
      "recent activity",
      "top clients",
      "allocation",
      "goals",
      "meetings",
      "coaching",
    ]) expect(dashboard).toContain(source);
    expect(dashboard).toContain("failedSources");
    expect(dashboard).toContain("loadingSources");
    expect(dashboard).toContain("emptySources");
    expect(dashboard).toContain("Retry all");
    expect(dashboard).not.toMatch(/Total AUM|Live AUM/i);
  });

  it("keeps actual client procedures protected and workspace-scoped", () => {
    const router = readFileSync("server/routers.ts", "utf8");
    const clientsBlock = router.slice(router.indexOf("clients: router({"), router.indexOf("pipeline: router({"));
    expect(clientsBlock).toContain("list: protectedProcedure");
    expect(clientsBlock).toContain("create: protectedProcedure");
    expect(clientsBlock).toContain("update: protectedProcedure");
    expect(clientsBlock).toContain("getWorkspaceForUser(ctx.user.id)");
    expect(clientsBlock).toContain("createClient({ ...input, workspaceId: ws.id }");
    expect(clientsBlock).toContain("updateClient(input.id, ws.id");
  });
});
