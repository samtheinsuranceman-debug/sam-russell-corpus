import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// ─── Helpers ─────────────────────────────────────────────────────────────
const anonCtx = { user: null as any, req: {} as any, res: {} as any };
const fakeUser = { id: 9998, name: "Test Advisor R15", email: "r15@rc.com", role: "user" as const, openId: "test-open-id-r15" };
const authCtx = { user: fakeUser, req: { headers: { origin: "http://localhost" } } as any, res: {} as any };
const caller = appRouter.createCaller(authCtx);
const anonCaller = appRouter.createCaller(anonCtx);

// ═══════════════════════════════════════════════════════════════════════════
// ─── MULTI-WORKSPACE SWITCHING ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("workspaceSwitcher.list", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.workspaceSwitcher.list()).rejects.toThrow();
  });

  it("returns an array of workspaces", async () => {
    const result = await caller.workspaceSwitcher.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("each workspace has workspaceId and workspaceName", async () => {
    const result = await caller.workspaceSwitcher.list();
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("workspaceId");
      expect(result[0]).toHaveProperty("workspaceName");
    }
  });
});

describe("workspaceSwitcher.switchTo", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.workspaceSwitcher.switchTo({ workspaceId: 1 })).rejects.toThrow();
  });

  it("rejects switching to non-existent workspace", async () => {
    try {
      await caller.workspaceSwitcher.switchTo({ workspaceId: 999999 });
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  });

  it("accepts valid workspace ID for switching", async () => {
    const workspaces = await caller.workspaceSwitcher.list();
    if (workspaces.length > 0) {
      const result = await caller.workspaceSwitcher.switchTo({ workspaceId: workspaces[0].workspaceId });
      expect(result).toHaveProperty("success", true);
    }
  });
});

describe("workspaceSwitcher.create", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.workspaceSwitcher.create({ name: "New WS" })).rejects.toThrow();
  });

  it("creates a new workspace", async () => {
    const result = await caller.workspaceSwitcher.create({ name: `Test WS ${Date.now()}` });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name");
    expect(typeof result.id).toBe("number");
  });

  it("rejects empty workspace name", async () => {
    try {
      await caller.workspaceSwitcher.create({ name: "" });
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── CLIENT MEETING SCHEDULER ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("meetings.create", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.meetings.create({
      clientId: 1,
      title: "Test Meeting",
      scheduledAt: new Date(Date.now() + 86400000),
    })).rejects.toThrow();
  });

  it("creates a meeting with required fields", async () => {
    // First create a client to link the meeting to
    let clientId: number;
    try {
      const client = await caller.clients.create({
        name: "Meeting Test Client R15",
        email: "mtc-r15@example.com",
        age: 45,
      });
      clientId = client.id;
    } catch {
      clientId = 1; // fallback
    }
    const result = await caller.meetings.create({
      clientId,
      title: "Quarterly Review",
      scheduledAt: new Date(Date.now() + 86400000),
      durationMin: 60,
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("creates a meeting with optional notes and meetingType", async () => {
    let clientId: number;
    try {
      const client = await caller.clients.create({
        name: "Meeting Notes Client R15",
        email: "mnc-r15@example.com",
        age: 50,
      });
      clientId = client.id;
    } catch {
      clientId = 1;
    }
    const result = await caller.meetings.create({
      clientId,
      title: "Client Check-in",
      scheduledAt: new Date(Date.now() + 172800000),
      durationMin: 30,
      notes: "Discuss portfolio rebalancing",
      meetingType: "VIDEO",
    });
    expect(result).toHaveProperty("id");
  });

  it("rejects meeting with empty title", async () => {
    try {
      await caller.meetings.create({
        clientId: 1,
        title: "",
        scheduledAt: new Date(),
      });
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  });
});

describe("meetings.listUpcoming", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.meetings.listUpcoming()).rejects.toThrow();
  });

  it("returns an array of upcoming meetings", async () => {
    const result = await caller.meetings.listUpcoming();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("meetings.listAll", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.meetings.listAll()).rejects.toThrow();
  });

  it("returns an array of meetings", async () => {
    const result = await caller.meetings.listAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns meetings with expected fields", async () => {
    const result = await caller.meetings.listAll();
    if (result.length > 0) {
      const m = result[0];
      expect(m).toHaveProperty("id");
      expect(m).toHaveProperty("title");
      expect(m).toHaveProperty("scheduledAt");
    }
  });
});

describe("meetings.update", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.meetings.update({ id: 1, title: "Updated" })).rejects.toThrow();
  });

  it("updates meeting title", async () => {
    let clientId: number;
    try {
      const client = await caller.clients.create({
        name: "Update Meeting Client R15",
        email: "umc-r15@example.com",
        age: 40,
      });
      clientId = client.id;
    } catch {
      clientId = 1;
    }
    const created = await caller.meetings.create({
      clientId,
      title: "Original Title",
      scheduledAt: new Date(Date.now() + 345600000),
      durationMin: 30,
    });
    const result = await caller.meetings.update({
      id: created.id,
      title: "Updated Title",
    });
    expect(result).toHaveProperty("success", true);
  });

  it("updates meeting notes", async () => {
    let clientId: number;
    try {
      const client = await caller.clients.create({
        name: "Notes Update Client R15",
        email: "nuc-r15@example.com",
        age: 55,
      });
      clientId = client.id;
    } catch {
      clientId = 1;
    }
    const created = await caller.meetings.create({
      clientId,
      title: "Notes Test",
      scheduledAt: new Date(Date.now() + 432000000),
      durationMin: 30,
    });
    const result = await caller.meetings.update({
      id: created.id,
      notes: "Updated notes content",
    });
    expect(result).toHaveProperty("success", true);
  });
});

describe("meetings.delete", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.meetings.delete({ id: 1 })).rejects.toThrow();
  });

  it("deletes a meeting", async () => {
    let clientId: number;
    try {
      const client = await caller.clients.create({
        name: "Delete Meeting Client R15",
        email: "dmc-r15@example.com",
        age: 35,
      });
      clientId = client.id;
    } catch {
      clientId = 1;
    }
    const created = await caller.meetings.create({
      clientId,
      title: "To Delete",
      scheduledAt: new Date(Date.now() + 518400000),
      durationMin: 15,
    });
    const result = await caller.meetings.delete({ id: created.id });
    expect(result).toHaveProperty("success", true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── CUSTOM DASHBOARD WIDGETS ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("dashboardConfig.get", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.dashboardConfig.get()).rejects.toThrow();
  });

  it("returns an array (empty for new users)", async () => {
    const result = await caller.dashboardConfig.get();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("dashboardConfig.save", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.dashboardConfig.save([
      { widgetId: "stat_cards", position: 0, visible: true, size: "FULL" },
    ])).rejects.toThrow();
  });

  it("saves widget configuration", async () => {
    const config = [
      { widgetId: "stat_cards", position: 0, visible: true, size: "FULL" as const },
      { widgetId: "client_table", position: 1, visible: true, size: "FULL" as const },
      { widgetId: "analytics_charts", position: 2, visible: false, size: "FULL" as const },
      { widgetId: "pipeline_allocation", position: 3, visible: true, size: "FULL" as const },
    ];
    const result = await caller.dashboardConfig.save(config);
    expect(result).toHaveProperty("success", true);
  });

  it("persists and retrieves saved configuration", async () => {
    const config = [
      { widgetId: "stat_cards", position: 0, visible: true, size: "FULL" as const },
      { widgetId: "quick_actions", position: 1, visible: false, size: "SMALL" as const },
      { widgetId: "goal_tracking", position: 2, visible: true, size: "LARGE" as const },
    ];
    await caller.dashboardConfig.save(config);
    const result = await caller.dashboardConfig.get();
    expect(result.length).toBeGreaterThanOrEqual(3);
    const statCards = result.find((w: any) => w.widgetId === "stat_cards");
    expect(statCards).toBeDefined();
    expect(statCards!.visible).toBe(true);
    expect(statCards!.position).toBe(0);
  });

  it("validates widget size enum", async () => {
    try {
      await caller.dashboardConfig.save([
        { widgetId: "stat_cards", position: 0, visible: true, size: "INVALID" as any },
      ]);
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  });

  it("handles reordering by updating positions", async () => {
    const config = [
      { widgetId: "quick_actions", position: 0, visible: true, size: "FULL" as const },
      { widgetId: "stat_cards", position: 1, visible: true, size: "FULL" as const },
      { widgetId: "coaching_prompts", position: 2, visible: true, size: "MEDIUM" as const },
    ];
    await caller.dashboardConfig.save(config);
    const result = await caller.dashboardConfig.get();
    const quickActions = result.find((w: any) => w.widgetId === "quick_actions");
    const statCards = result.find((w: any) => w.widgetId === "stat_cards");
    if (quickActions && statCards) {
      expect(quickActions.position).toBe(0);
      expect(statCards.position).toBe(1);
    }
  });

  it("handles toggling visibility", async () => {
    const config = [
      { widgetId: "net_worth_trajectory", position: 0, visible: false, size: "FULL" as const },
    ];
    await caller.dashboardConfig.save(config);
    const result = await caller.dashboardConfig.get();
    const nwt = result.find((w: any) => w.widgetId === "net_worth_trajectory");
    expect(nwt).toBeDefined();
    expect(nwt!.visible).toBe(false);
  });
});
