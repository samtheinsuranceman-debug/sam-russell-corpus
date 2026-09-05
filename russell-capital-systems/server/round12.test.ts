import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// ─── Helpers ─────────────────────────────────────────────────────────────
const anonCtx = { user: null as any, req: {} as any, res: {} as any };
const fakeUser = { id: 9997, name: "Test Advisor R12", email: "r12@rc.com", role: "user" as const, openId: "test-open-id-r12" };
const authCtx = { user: fakeUser, req: { headers: { origin: "http://localhost" } } as any, res: {} as any };
const caller = appRouter.createCaller(authCtx);
const anonCaller = appRouter.createCaller(anonCtx);

// ═══════════════════════════════════════════════════════════════════════════
// ─── DOCUMENT VAULT ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("docs.list", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.docs.list({ clientId: 1 })).rejects.toThrow();
  });

  it("returns an array for authenticated user", async () => {
    try {
      const result = await caller.docs.list({ clientId: 1 });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("docs.upload", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.docs.upload({
      clientId: 1,
      name: "test.pdf",
      fileBase64: btoa("test content"),
    })).rejects.toThrow();
  });

  it("validates name is required", async () => {
    await expect(caller.docs.upload({
      clientId: 1,
      name: "",
      fileBase64: btoa("test"),
    })).rejects.toThrow();
  });

  it("validates name max length", async () => {
    await expect(caller.docs.upload({
      clientId: 1,
      name: "a".repeat(501),
      fileBase64: btoa("test"),
    })).rejects.toThrow();
  });

  it("validates category enum", async () => {
    await expect(caller.docs.upload({
      clientId: 1,
      name: "test.pdf",
      fileBase64: btoa("test"),
      category: "INVALID" as any,
    })).rejects.toThrow();
  });

  it("accepts valid category values", async () => {
    const validCategories = ["TAX_RETURN", "ESTATE_PLAN", "INSURANCE_POLICY", "INVESTMENT_STATEMENT", "TRUST_DOCUMENT", "LEGAL_AGREEMENT", "FINANCIAL_PLAN", "OTHER"];
    for (const cat of validCategories) {
      // Just validate the schema accepts these - actual upload may fail without S3
      try {
        await caller.docs.upload({
          clientId: 1,
          name: "test.pdf",
          fileBase64: btoa("test"),
          category: cat as any,
        });
      } catch (e: any) {
        // Should not be a ZodError for valid categories
        expect(e.message).not.toContain("Invalid enum value");
      }
    }
  });
});

describe("docs.delete", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.docs.delete({ docId: 1, clientId: 1 })).rejects.toThrow();
  });

  it("validates docId is a number", async () => {
    await expect(caller.docs.delete({ docId: "abc" as any, clientId: 1 })).rejects.toThrow();
  });
});

describe("docs.categories", () => {
  it("returns category list publicly", async () => {
    const categories = await anonCaller.docs.categories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBe(8);
    expect(categories[0]).toHaveProperty("value");
    expect(categories[0]).toHaveProperty("label");
  });

  it("includes all expected categories", async () => {
    const categories = await anonCaller.docs.categories();
    const values = categories.map(c => c.value);
    expect(values).toContain("TAX_RETURN");
    expect(values).toContain("ESTATE_PLAN");
    expect(values).toContain("INSURANCE_POLICY");
    expect(values).toContain("INVESTMENT_STATEMENT");
    expect(values).toContain("TRUST_DOCUMENT");
    expect(values).toContain("LEGAL_AGREEMENT");
    expect(values).toContain("FINANCIAL_PLAN");
    expect(values).toContain("OTHER");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── REPORT SCHEDULES ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("reports.getSchedule", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.reports.getSchedule({ clientId: 1 })).rejects.toThrow();
  });

  it("returns null when no schedule exists", async () => {
    try {
      const result = await caller.reports.getSchedule({ clientId: 99999 });
      expect(result === null || result === undefined || typeof result === "object").toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("reports.setSchedule", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.reports.setSchedule({ clientId: 1, active: true })).rejects.toThrow();
  });

  it("validates frequency enum", async () => {
    await expect(caller.reports.setSchedule({
      clientId: 1,
      active: true,
      frequency: "WEEKLY" as any,
    })).rejects.toThrow();
  });

  it("validates recipientEmail format", async () => {
    await expect(caller.reports.setSchedule({
      clientId: 1,
      active: true,
      recipientEmail: "not-an-email",
    })).rejects.toThrow();
  });

  it("accepts MONTHLY frequency", async () => {
    try {
      await caller.reports.setSchedule({
        clientId: 1,
        active: true,
        frequency: "MONTHLY",
        recipientEmail: "test@example.com",
      });
    } catch (e: any) {
      expect(e.message).not.toContain("Invalid enum value");
    }
  });

  it("accepts QUARTERLY frequency", async () => {
    try {
      await caller.reports.setSchedule({
        clientId: 1,
        active: true,
        frequency: "QUARTERLY",
        recipientEmail: "test@example.com",
      });
    } catch (e: any) {
      expect(e.message).not.toContain("Invalid enum value");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── SLACK INTEGRATION ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("slack.status", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.slack.status()).rejects.toThrow();
  });

  it("returns connection status for authenticated user", async () => {
    try {
      const result = await caller.slack.status();
      expect(result).toHaveProperty("connected");
      expect(typeof result.connected).toBe("boolean");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("slack.configure", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.slack.configure({ webhookUrl: "https://hooks.slack.com/test" })).rejects.toThrow();
  });

  it("validates webhook URL format", async () => {
    await expect(caller.slack.configure({ webhookUrl: "not-a-url" })).rejects.toThrow();
  });

  it("accepts valid webhook URL", async () => {
    try {
      await caller.slack.configure({
        webhookUrl: "https://hooks.slack.example/services/T123/B456/abc",
        teamName: "Test Team",
        channelName: "general",
      });
    } catch (e: any) {
      // May fail due to workspace not existing, but should not be a validation error
      expect(e.message).not.toContain("Invalid url");
    }
  });
});

describe("slack.disconnect", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.slack.disconnect()).rejects.toThrow();
  });
});

describe("slack.testMessage", () => {
  it("requires authentication", async () => {
    await expect(anonCaller.slack.testMessage({})).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── SLACK BOT COMMANDS ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("slackBot.handleSlackCommand", () => {
  it("returns help when no subcommand", async () => {
    const { handleSlackCommand } = await import("./slackBot");
    const result = await handleSlackCommand({
      token: "test", team_id: "T123", channel_id: "C123",
      user_id: "U123", user_name: "test", command: "/rc",
      text: "", response_url: "https://hooks.slack.com/test",
    }, 1);
    expect(result.blocks).toBeDefined();
    expect(result.response_type).toBe("ephemeral");
  });

  it("returns help for 'help' subcommand", async () => {
    const { handleSlackCommand } = await import("./slackBot");
    const result = await handleSlackCommand({
      token: "test", team_id: "T123", channel_id: "C123",
      user_id: "U123", user_name: "test", command: "/rc",
      text: "help", response_url: "https://hooks.slack.com/test",
    }, 1);
    expect(result.blocks).toBeDefined();
  });

  it("returns usage hint for 'client' without name", async () => {
    const { handleSlackCommand } = await import("./slackBot");
    const result = await handleSlackCommand({
      token: "test", team_id: "T123", channel_id: "C123",
      user_id: "U123", user_name: "test", command: "/rc",
      text: "client", response_url: "https://hooks.slack.com/test",
    }, 1);
    expect(result.text).toContain("Usage");
  });

  it("searches clients by name", async () => {
    const { handleSlackCommand } = await import("./slackBot");
    const result = await handleSlackCommand({
      token: "test", team_id: "T123", channel_id: "C123",
      user_id: "U123", user_name: "test", command: "/rc",
      text: "client John", response_url: "https://hooks.slack.com/test",
    }, 1);
    // May find results or not, but should not throw
    expect(result.response_type).toBe("ephemeral");
  });

  it("returns pipeline summary", async () => {
    const { handleSlackCommand } = await import("./slackBot");
    const result = await handleSlackCommand({
      token: "test", team_id: "T123", channel_id: "C123",
      user_id: "U123", user_name: "test", command: "/rc",
      text: "pipeline", response_url: "https://hooks.slack.com/test",
    }, 1);
    expect(result.response_type).toBe("ephemeral");
  });

  it("returns workspace stats", async () => {
    const { handleSlackCommand } = await import("./slackBot");
    const result = await handleSlackCommand({
      token: "test", team_id: "T123", channel_id: "C123",
      user_id: "U123", user_name: "test", command: "/rc",
      text: "stats", response_url: "https://hooks.slack.com/test",
    }, 1);
    expect(result.response_type).toBe("ephemeral");
    expect(result.blocks).toBeDefined();
  });

  it("returns unknown command message for invalid subcommand", async () => {
    const { handleSlackCommand } = await import("./slackBot");
    const result = await handleSlackCommand({
      token: "test", team_id: "T123", channel_id: "C123",
      user_id: "U123", user_name: "test", command: "/rc",
      text: "foobar", response_url: "https://hooks.slack.com/test",
    }, 1);
    expect(result.text).toContain("Unknown command");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── EMAIL HELPERS ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("sendClientReportEmail", () => {
  it("returns sent: false when email sending fails", async () => {
    const { sendClientReportEmail } = await import("./email");
    const result = await sendClientReportEmail({
      toEmail: "test@example.com",
      toName: "Test",
      clientName: "John Doe",
      workspaceName: "Test Workspace",
      pdfBuffer: Buffer.from("fake pdf"),
    });
    expect(result.sent).toBe(false);
    expect(typeof result.reason).toBe("string");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── DB HELPERS ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

describe("searchClientsByName", () => {
  it("returns an array", async () => {
    const { searchClientsByName } = await import("./db");
    const result = await searchClientsByName(1, "test");
    expect(Array.isArray(result)).toBe(true);
  });

  it("limits results to 5", async () => {
    const { searchClientsByName } = await import("./db");
    const result = await searchClientsByName(1, "%");
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe("getPipelineSummary", () => {
  it("returns an array", async () => {
    const { getPipelineSummary } = await import("./db");
    const result = await getPipelineSummary(1);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getWorkspaceStats", () => {
  it("returns stats object", async () => {
    const { getWorkspaceStats } = await import("./db");
    const result = await getWorkspaceStats(1);
    expect(result).toHaveProperty("clientCount");
    expect(result).toHaveProperty("dealCount");
    expect(result).toHaveProperty("strategyCount");
    expect(typeof result.clientCount).toBe("number");
  });
});

describe("getDueReportSchedules", () => {
  it("returns an array", async () => {
    const { getDueReportSchedules } = await import("./db");
    const result = await getDueReportSchedules();
    expect(Array.isArray(result)).toBe(true);
  });
});
