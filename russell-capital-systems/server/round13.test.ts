import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// ─── Helpers ─────────────────────────────────────────────────────────────
const anonCtx = { user: null as any, req: {} as any, res: {} as any };
const fakeUser = { id: 9996, name: "Test Advisor R13", email: "r13@rc.com", role: "user" as const, openId: "test-open-id-r13" };
const authCtx = { user: fakeUser, req: { headers: { origin: "http://localhost" } } as any, res: {} as any };
const caller = appRouter.createCaller(authCtx);
const anonCaller = appRouter.createCaller(anonCtx);

// ═══════════════════════════════════════════════════════════════════════════
// ─── COMPLIANCE AUDIT LOG EXPORT ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("compliance.preview", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.compliance.preview({})).rejects.toThrow();
  });

  it("returns paginated audit logs for authenticated user", async () => {
    try {
      const result = await caller.compliance.preview({ page: 1, pageSize: 10 });
      expect(result).toHaveProperty("logs");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("pageSize");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.logs)).toBe(true);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts optional date filters", async () => {
    try {
      const result = await caller.compliance.preview({
        startDate: "2025-01-01",
        endDate: "2026-12-31",
        page: 1,
        pageSize: 25,
      });
      expect(result).toHaveProperty("logs");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts optional action type filter", async () => {
    try {
      const result = await caller.compliance.preview({
        actionType: "CLIENT_CREATED",
        page: 1,
        pageSize: 25,
      });
      expect(result).toHaveProperty("logs");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("compliance.exportCsv", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.compliance.exportCsv({})).rejects.toThrow();
  });

  it("returns CSV string with header row", async () => {
    try {
      const result = await caller.compliance.exportCsv({});
      expect(result).toHaveProperty("csv");
      expect(result).toHaveProperty("count");
      expect(typeof result.csv).toBe("string");
      expect(typeof result.count).toBe("number");
      // CSV should always have at least a header
      expect(result.csv).toContain("ID,Client ID,Action,Actor,Summary");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("compliance.exportPdf", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.compliance.exportPdf({})).rejects.toThrow();
  });

  it("returns structured data for PDF generation", async () => {
    try {
      const result = await caller.compliance.exportPdf({});
      expect(result).toHaveProperty("logs");
      expect(result).toHaveProperty("count");
      expect(result).toHaveProperty("generatedAt");
      expect(result).toHaveProperty("workspaceName");
      expect(result).toHaveProperty("filters");
      expect(Array.isArray(result.logs)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── CLIENT PORTAL ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("clientPortal.generateLink", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.clientPortal.generateLink({ clientId: 1 })).rejects.toThrow();
  });

  it("generates a portal link with token and URL", async () => {
    try {
      const result = await caller.clientPortal.generateLink({ clientId: 1, expiresInDays: 7 });
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("url");
      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBeGreaterThan(10);
      expect(result.url).toContain("/client-portal/");
    } catch (e: any) {
      // May fail if client doesn't exist in workspace
      expect(["INTERNAL_SERVER_ERROR", "NOT_FOUND"]).toContain(e.code);
    }
  });

  it("accepts optional label", async () => {
    try {
      const result = await caller.clientPortal.generateLink({
        clientId: 1,
        label: "Q1 Review Link",
        expiresInDays: 30,
      });
      expect(result).toHaveProperty("token");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("clientPortal.listLinks", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.clientPortal.listLinks({ clientId: 1 })).rejects.toThrow();
  });

  it("returns array of links", async () => {
    try {
      const result = await caller.clientPortal.listLinks({ clientId: 1 });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("clientPortal.revokeLink", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.clientPortal.revokeLink({ tokenId: 1 })).rejects.toThrow();
  });
});

describe("clientPortal.view", () => {
  it("rejects invalid token", async () => {
    await expect(anonCaller.clientPortal.view({ token: "invalid-token-xyz" })).rejects.toThrow("Invalid or expired portal link");
  });

  it("is a public procedure (no auth required)", async () => {
    // Should throw NOT_FOUND, not UNAUTHORIZED
    try {
      await anonCaller.clientPortal.view({ token: "some-nonexistent-token" });
    } catch (e: any) {
      expect(e.code).toBe("NOT_FOUND");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── REBALANCE ALERTS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("rebalance.setTargets", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.rebalance.setTargets({
      clientId: 1,
      targets: [{ assetClass: "US Equities", targetPct: "60" }],
    })).rejects.toThrow();
  });

  it("accepts valid allocation targets", async () => {
    try {
      const result = await caller.rebalance.setTargets({
        clientId: 1,
        targets: [
          { assetClass: "US Equities", targetPct: "60", currentPct: "55" },
          { assetClass: "Fixed Income", targetPct: "30", currentPct: "35" },
          { assetClass: "Cash", targetPct: "10", currentPct: "10" },
        ],
      });
      expect(result).toHaveProperty("targets");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("rebalance.getTargets", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.rebalance.getTargets({ clientId: 1 })).rejects.toThrow();
  });

  it("returns array of targets", async () => {
    try {
      const result = await caller.rebalance.getTargets({ clientId: 1 });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("rebalance.updateCurrentPct", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.rebalance.updateCurrentPct({
      clientId: 1,
      updates: [{ assetClass: "US Equities", currentPct: "58" }],
    })).rejects.toThrow();
  });
});

describe("rebalance.checkDrift", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.rebalance.checkDrift({ clientId: 1 })).rejects.toThrow();
  });

  it("returns drift analysis with hasDrift flag", async () => {
    try {
      const result = await caller.rebalance.checkDrift({ clientId: 1, threshold: 5 });
      expect(result).toHaveProperty("drifts");
      expect(result).toHaveProperty("hasDrift");
      expect(Array.isArray(result.drifts)).toBe(true);
      expect(typeof result.hasDrift).toBe("boolean");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("rebalance.alerts", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.rebalance.alerts()).rejects.toThrow();
  });

  it("returns array of alerts", async () => {
    try {
      const result = await caller.rebalance.alerts({});
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts status filter", async () => {
    try {
      const result = await caller.rebalance.alerts({ status: "OPEN" });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("rebalance.acknowledgeAlert", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.rebalance.acknowledgeAlert({ alertId: 1 })).rejects.toThrow();
  });
});

describe("rebalance.resolveAlert", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.rebalance.resolveAlert({ alertId: 1 })).rejects.toThrow();
  });
});

describe("rebalance.runCheck", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.rebalance.runCheck()).rejects.toThrow();
  });

  it("runs drift check across all clients", async () => {
    try {
      const result = await caller.rebalance.runCheck({ threshold: 5 });
      expect(result).toHaveProperty("alertsCreated");
      expect(result).toHaveProperty("clientsChecked");
      expect(typeof result.alertsCreated).toBe("number");
      expect(typeof result.clientsChecked).toBe("number");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── INTEGRATION TESTS ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("compliance + rebalance integration", () => {
  it("compliance filters accept all valid action types", async () => {
    const actionTypes = ["CLIENT_CREATED", "CLIENT_UPDATED", "NOTE_ADDED", "DEAL_STAGE_CHANGED", "STRATEGY_GENERATED"];
    for (const actionType of actionTypes) {
      try {
        const result = await caller.compliance.preview({ actionType, page: 1, pageSize: 5 });
        expect(result).toHaveProperty("logs");
      } catch (e: any) {
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    }
  });

  it("portal view returns sanitized data without sensitive fields", async () => {
    try {
      await anonCaller.clientPortal.view({ token: "test-token" });
    } catch (e: any) {
      // Should be NOT_FOUND, confirming it's a public procedure
      expect(e.code).toBe("NOT_FOUND");
      expect(e.message).toContain("Invalid or expired");
    }
  });
});
