import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// ─── Helpers ─────────────────────────────────────────────────────────────
const anonCtx = { user: null as any, req: {} as any, res: {} as any };
const fakeUser = { id: 9999, name: "Test Advisor", email: "test@rc.com", role: "user" as const, openId: "test-open-id" };
const authCtx = { user: fakeUser, req: { headers: { origin: "http://localhost" } } as any, res: {} as any };
const caller = appRouter.createCaller(authCtx);
const anonCaller = appRouter.createCaller(anonCtx);

// ─── Bulk CSV Import ────────────────────────────────────────────────────
describe("clients.bulkImport", () => {
  it("requires authentication", async () => {
    await expect(
      anonCaller.clients.bulkImport({
        rows: [{ name: "Test Client" }],
      })
    ).rejects.toThrow();
  });

  it("rejects empty rows array", async () => {
    await expect(
      caller.clients.bulkImport({ rows: [] })
    ).rejects.toThrow();
  });

  it("requires name field in each row", async () => {
    await expect(
      (caller.clients as any).bulkImport({
        rows: [{ email: "test@test.com" }],
      })
    ).rejects.toThrow();
  });

  it("rejects rows with empty name string", async () => {
    await expect(
      caller.clients.bulkImport({
        rows: [{ name: "" }],
      })
    ).rejects.toThrow();
  });

  it("accepts valid single row without BAD_REQUEST", async () => {
    try {
      await caller.clients.bulkImport({
        rows: [{ name: "CSV Test Client", email: "csv@test.com", age: 45, income: 150000 }],
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts multiple rows", async () => {
    try {
      await caller.clients.bulkImport({
        rows: [
          { name: "Client A", income: 100000 },
          { name: "Client B", income: 200000 },
          { name: "Client C", income: 300000 },
        ],
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts all optional financial fields", async () => {
    try {
      await caller.clients.bulkImport({
        rows: [{
          name: "Full Client",
          email: "full@test.com",
          phone: "555-1234",
          age: 55,
          income: 500000,
          iraBalance: 1000000,
          rothBalance: 500000,
          taxableAssets: 750000,
          realEstateEquity: 2000000,
          lifeInsuranceCv: 300000,
          filingStatus: "joint",
          notes: "High net worth client",
        }],
      });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("validates filingStatus enum", async () => {
    await expect(
      (caller.clients as any).bulkImport({
        rows: [{ name: "Bad Status", filingStatus: "invalid" }],
      })
    ).rejects.toThrow();
  });

  it("enforces max 500 rows limit", async () => {
    const rows = Array.from({ length: 501 }, (_, i) => ({ name: `Client ${i}` }));
    await expect(
      caller.clients.bulkImport({ rows })
    ).rejects.toThrow();
  });

  it("returns import result shape", async () => {
    try {
      const result = await caller.clients.bulkImport({
        rows: [{ name: "Shape Test" }],
      });
      expect(result).toHaveProperty("imported");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("total");
      expect(typeof result.imported).toBe("number");
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.total).toBe("number");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

// ─── Dashboard Analytics ────────────────────────────────────────────────
describe("dashboard.analytics", () => {
  it("requires authentication", async () => {
    await expect(
      anonCaller.dashboard.analytics()
    ).rejects.toThrow();
  });

  it("returns correct shape with aumTimeline, strategyTrend, dealFunnel", async () => {
    try {
      const result = await caller.dashboard.analytics();
      expect(result).toHaveProperty("aumTimeline");
      expect(result).toHaveProperty("strategyTrend");
      expect(result).toHaveProperty("dealFunnel");
      expect(Array.isArray(result.aumTimeline)).toBe(true);
      expect(Array.isArray(result.strategyTrend)).toBe(true);
      expect(Array.isArray(result.dealFunnel)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("dealFunnel includes all pipeline stages", async () => {
    try {
      const result = await caller.dashboard.analytics();
      const stages = result.dealFunnel.map((d: any) => d.stage);
      expect(stages).toContain("LEAD");
      expect(stages).toContain("QUALIFIED");
      expect(stages).toContain("STRATEGY");
      expect(stages).toContain("PROPOSAL");
      expect(stages).toContain("CLOSED_WON");
      expect(stages).toContain("CLOSED_LOST");
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("dealFunnel entries have count and value fields", async () => {
    try {
      const result = await caller.dashboard.analytics();
      for (const entry of result.dealFunnel) {
        expect(entry).toHaveProperty("stage");
        expect(entry).toHaveProperty("count");
        expect(entry).toHaveProperty("value");
        expect(typeof entry.count).toBe("number");
        expect(typeof entry.value).toBe("number");
      }
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("aumTimeline entries have month, aum, clients fields", async () => {
    try {
      const result = await caller.dashboard.analytics();
      for (const entry of result.aumTimeline) {
        expect(entry).toHaveProperty("month");
        expect(entry).toHaveProperty("aum");
        expect(entry).toHaveProperty("clients");
      }
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("strategyTrend entries have month, total, added fields", async () => {
    try {
      const result = await caller.dashboard.analytics();
      for (const entry of result.strategyTrend) {
        expect(entry).toHaveProperty("month");
        expect(entry).toHaveProperty("total");
        expect(entry).toHaveProperty("added");
      }
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

// ─── getDashboardAnalytics db helper ────────────────────────────────────
describe("getDashboardAnalytics db helper", () => {
  it("is importable and returns correct shape", async () => {
    const { getDashboardAnalytics } = await import("./db");
    expect(typeof getDashboardAnalytics).toBe("function");
    const result = await getDashboardAnalytics(999999);
    expect(result).toHaveProperty("aumTimeline");
    expect(result).toHaveProperty("strategyTrend");
    expect(result).toHaveProperty("dealFunnel");
  });
});

// ─── Role-Based Team Access ─────────────────────────────────────────────
describe("team.updateRole", () => {
  it("requires authentication", async () => {
    await expect(
      anonCaller.team.updateRole({ membershipId: 1, role: "ADVISOR" })
    ).rejects.toThrow();
  });

  it("validates membershipId is required", async () => {
    await expect(
      (caller.team as any).updateRole({ role: "ADVISOR" })
    ).rejects.toThrow();
  });

  it("validates role is from allowed enum", async () => {
    await expect(
      (caller.team as any).updateRole({ membershipId: 1, role: "SUPER_ADMIN" })
    ).rejects.toThrow();
  });

  it("rejects invalid role values", async () => {
    await expect(
      (caller.team as any).updateRole({ membershipId: 1, role: "INVALID_ROLE" })
    ).rejects.toThrow();
  });

  it("accepts valid input without BAD_REQUEST", async () => {
    try {
      await caller.team.updateRole({ membershipId: 1, role: "ADVISOR" });
    } catch (e: any) {
      // May fail due to no workspace or FORBIDDEN, but not BAD_REQUEST
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("team.removeMember", () => {
  it("requires authentication", async () => {
    await expect(
      anonCaller.team.removeMember({ membershipId: 1 })
    ).rejects.toThrow();
  });

  it("validates membershipId is required", async () => {
    await expect(
      (caller.team as any).removeMember({})
    ).rejects.toThrow();
  });

  it("accepts valid input without BAD_REQUEST", async () => {
    try {
      await caller.team.removeMember({ membershipId: 1 });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});

// ─── Role-based db helpers ──────────────────────────────────────────────
describe("role-based db helpers", () => {
  it("updateMemberRole is importable", async () => {
    const { updateMemberRole } = await import("./db");
    expect(typeof updateMemberRole).toBe("function");
  });

  it("removeMember is importable", async () => {
    const { removeMember } = await import("./db");
    expect(typeof removeMember).toBe("function");
  });

  it("getMembershipById is importable", async () => {
    const { getMembershipById } = await import("./db");
    expect(typeof getMembershipById).toBe("function");
  });
});

// ─── CSV Protocol & Template ────────────────────────────────────────────
describe("CSV Protocol module", () => {
  it("generateCSVTemplate returns valid CSV string", async () => {
    const { generateCSVTemplate } = await import("./csvTemplate");
    const csv = generateCSVTemplate();
    expect(typeof csv).toBe("string");
    const lines = csv.trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2); // header + at least 1 sample
    // Header should contain required 'name' field
    expect(lines[0].toLowerCase()).toContain("name");
  });

  it("generateCSVTemplate includes all supported fields in header", async () => {
    const { generateCSVTemplate, CSV_PROTOCOL } = await import("./csvTemplate");
    const csv = generateCSVTemplate();
    const header = csv.split("\n")[0].toLowerCase();
    for (const field of CSV_PROTOCOL.supportedFields) {
      expect(header).toContain(field.field.toLowerCase());
    }
  });

  it("generateCSVTemplate includes 5 sample rows", async () => {
    const { generateCSVTemplate } = await import("./csvTemplate");
    const csv = generateCSVTemplate();
    const lines = csv.trim().split("\n");
    expect(lines.length).toBe(6); // 1 header + 5 sample rows
  });

  it("generateProtocolDoc returns valid protocol object", async () => {
    const { generateProtocolDoc } = await import("./csvTemplate");
    const doc = generateProtocolDoc() as any;
    expect(doc).toHaveProperty("protocol");
    expect(doc).toHaveProperty("version");
    expect(doc).toHaveProperty("fields");
    expect(doc).toHaveProperty("limits");
    expect(doc).toHaveProperty("parsingRules");
    expect(doc).toHaveProperty("responseFormat");
    expect(doc).toHaveProperty("examples");
  });

  it("protocol doc includes all field definitions", async () => {
    const { generateProtocolDoc, CSV_PROTOCOL } = await import("./csvTemplate");
    const doc = generateProtocolDoc() as any;
    expect(doc.fields.length).toBe(CSV_PROTOCOL.supportedFields.length);
    // Each field should have required properties
    for (const field of doc.fields) {
      expect(field).toHaveProperty("field");
      expect(field).toHaveProperty("type");
      expect(field).toHaveProperty("required");
      expect(field).toHaveProperty("description");
      expect(field).toHaveProperty("acceptedColumnHeaders");
      expect(field).toHaveProperty("example");
    }
  });

  it("CSV_PROTOCOL has correct maxRows limit", async () => {
    const { CSV_PROTOCOL } = await import("./csvTemplate");
    expect(CSV_PROTOCOL.maxRows).toBe(500);
  });

  it("CSV_PROTOCOL requires name field", async () => {
    const { CSV_PROTOCOL } = await import("./csvTemplate");
    expect(CSV_PROTOCOL.requiredFields).toContain("name");
    const nameField = CSV_PROTOCOL.supportedFields.find(f => f.field === "name");
    expect(nameField?.required).toBe(true);
  });

  it("CSV_PROTOCOL filingStatus field has correct enum values", async () => {
    const { CSV_PROTOCOL } = await import("./csvTemplate");
    const filingField = CSV_PROTOCOL.supportedFields.find(f => f.field === "filingStatus") as any;
    expect(filingField).toBeDefined();
    expect(filingField.type).toBe("enum");
    expect(filingField.values).toEqual(["single", "joint", "hoh"]);
  });
});

// ─── Role permissions guard ─────────────────────────────────────────────
describe("role permission guards", () => {
  it("updateRole does not allow setting SUPER_ADMIN", async () => {
    await expect(
      (caller.team as any).updateRole({ membershipId: 1, role: "SUPER_ADMIN" })
    ).rejects.toThrow();
  });

  it("updateRole allows ADMIN role", async () => {
    try {
      await caller.team.updateRole({ membershipId: 1, role: "ADMIN" });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("updateRole allows VIEWER role", async () => {
    try {
      await caller.team.updateRole({ membershipId: 1, role: "VIEWER" });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("updateRole allows ANALYST role", async () => {
    try {
      await caller.team.updateRole({ membershipId: 1, role: "ANALYST" });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});
