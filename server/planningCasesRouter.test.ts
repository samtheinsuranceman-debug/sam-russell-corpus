import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createPlanningCase: vi.fn(),
  createPlanningCaseNote: vi.fn(),
  ensureMembership: vi.fn(),
  getClientById: vi.fn(),
  getOrCreateWorkspace: vi.fn(),
  getPlanningCaseById: vi.fn(),
  getUserPortalPreferences: vi.fn(),
  getWorkspaceByOwnerId: vi.fn(),
  listPlanningCaseNotes: vi.fn(),
  listPlanningCases: vi.fn(),
  resolvePlanningCaseNote: vi.fn(),
  updatePlanningCase: vi.fn(),
  upsertUserPortalPreferences: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { planningCasesRouter } from "./planningCasesRouter";

function createContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "planning-test-user",
      name: "Planning Test",
      email: "planning@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("planningCasesRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getWorkspaceByOwnerId.mockResolvedValue({ id: 7, ownerId: 42, name: "My Workspace" });
    dbMocks.ensureMembership.mockResolvedValue(undefined);
  });

  it("lists cases only for the authenticated user's workspace", async () => {
    dbMocks.listPlanningCases.mockResolvedValue([{ id: 10, workspaceId: 7, title: "Retirement plan" }]);
    const caller = planningCasesRouter.createCaller(createContext());

    const result = await caller.list();

    expect(result).toHaveLength(1);
    expect(dbMocks.listPlanningCases).toHaveBeenCalledWith(7);
    expect(dbMocks.ensureMembership).toHaveBeenCalledWith(42, 7);
  });

  it("creates a durable case only after validating the linked client workspace", async () => {
    dbMocks.getClientById.mockResolvedValue({ id: 9, workspaceId: 7, name: "Client" });
    dbMocks.createPlanningCase.mockResolvedValue({ id: 11, workspaceId: 7, userId: 42, clientId: 9, title: "Estate plan" });
    const caller = planningCasesRouter.createCaller(createContext());

    const result = await caller.create({ title: "Estate plan", clientId: 9, caseType: "comprehensive" });

    expect(result.id).toBe(11);
    expect(dbMocks.getClientById).toHaveBeenCalledWith(9, 7);
    expect(dbMocks.createPlanningCase).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId: 7,
      userId: 42,
      clientId: 9,
      status: "draft",
      currentStage: "discovery",
    }));
  });

  it("rejects updates for cases outside the authenticated workspace", async () => {
    dbMocks.getPlanningCaseById.mockResolvedValue(null);
    const caller = planningCasesRouter.createCaller(createContext());

    await expect(caller.update({ id: 999, status: "active" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMocks.updatePlanningCase).not.toHaveBeenCalled();
  });

  it("persists navigation preferences for the authenticated workspace", async () => {
    dbMocks.upsertUserPortalPreferences.mockResolvedValue({ id: 3, userId: 42, workspaceId: 7, compactSidebar: true });
    const caller = planningCasesRouter.createCaller(createContext());

    const result = await caller.savePreferences({ compactSidebar: true, openNavGroups: ["Clients", "Client Journey"] });

    expect(result.compactSidebar).toBe(true);
    expect(dbMocks.upsertUserPortalPreferences).toHaveBeenCalledWith(42, 7, expect.objectContaining({ compactSidebar: true }));
  });
});
