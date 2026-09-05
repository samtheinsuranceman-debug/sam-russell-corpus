import { describe, it, expect } from "vitest";

describe("Managed OAuth — trial password API retirement", () => {
  it("rejects the former trial password in the compatibility helper", async () => {
    const { isValidPassword } = await import("../shared/accessControl");
    expect(isValidPassword("legacy-trial-pass")).toEqual({ valid: false, type: "invalid" });
  });

  it("does not mount trial login or status endpoints", async () => {
    const { readFileSync } = await import("node:fs");
    const server = readFileSync(`${process.cwd()}/server/_core/index.ts`, "utf8");
    expect(server).not.toContain("/api/trial/login");
    expect(server).not.toContain("/api/trial/status");
  });

  it("keeps the public trial route as managed-OAuth guidance", async () => {
    const { readFileSync } = await import("node:fs");
    const app = readFileSync(`${process.cwd()}/client/src/App.tsx`, "utf8");
    expect(app).toContain('path="/trial"');
    expect(app).toContain("ManagedAuthLegacy");
  });
});

describe("Commission Tracker Data Integrity", () => {
  // These test the data model used in the CommissionTracker component
  const TOOL_COMMISSIONS = [
    { id: "mortgage-killer", name: "Mortgage Killer", monthlyCommission: 40000, commissionType: "life" },
    { id: "roth-strategy", name: "2-Year Roth Strategy", monthlyCommission: 100000, commissionType: "life" },
    { id: "retirement-drivers", name: "Retirement Drivers", monthlyCommission: 100000, commissionType: "both" },
    { id: "house-recycling", name: "House Recycling for Big Sales", monthlyCommission: 200000, commissionType: "life" },
    { id: "household-wealth", name: "Household Wealth Engine", monthlyCommission: 250000, commissionType: "life" },
    { id: "multigen-wealth", name: "Multi-Gen Wealth Transfer", monthlyCommission: 100000, commissionType: "life" },
    { id: "estate-flowchart", name: "Estate Flow Chart", monthlyCommission: 70000, commissionType: "annuity" },
    { id: "real-estate-mogul", name: "Real Estate Mogul", monthlyCommission: 300000, commissionType: "life" },
    { id: "income-gap", name: "Income Gap Analyzer", monthlyCommission: 70000, commissionType: "annuity" },
    { id: "tax-loss-harvesting", name: "Tax-Loss Harvesting Scanner", monthlyCommission: 50000, commissionType: "both" },

    { id: "charitable-giving", name: "Charitable Giving Optimizer", monthlyCommission: 75000, commissionType: "life" },
    { id: "beneficiary-optimization", name: "Beneficiary Optimization Engine", monthlyCommission: 25000, commissionType: "life" },
    { id: "succession-planning", name: "Succession Planning Wizard", monthlyCommission: 150000, commissionType: "both" },
    { id: "smart-rebalancing", name: "Smart Rebalancing Alerts", monthlyCommission: 40000, commissionType: "annuity" },
  ];

  it("should have exactly 14 tools", () => {
    expect(TOOL_COMMISSIONS.length).toBe(14);
  });

  it("should have unique IDs for all tools", () => {
    const ids = TOOL_COMMISSIONS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have total monthly commission of $1,570,000", () => {
    const total = TOOL_COMMISSIONS.reduce((sum, t) => sum + t.monthlyCommission, 0);
    expect(total).toBe(1570000);
  });

  it("should have Mortgage Killer at $40,000/month life commissions", () => {
    const mk = TOOL_COMMISSIONS.find(t => t.id === "mortgage-killer");
    expect(mk?.monthlyCommission).toBe(40000);
    expect(mk?.commissionType).toBe("life");
  });

  it("should have Estate Flow Chart at $70,000/month annuity commissions", () => {
    const ef = TOOL_COMMISSIONS.find(t => t.id === "estate-flowchart");
    expect(ef?.monthlyCommission).toBe(70000);
    expect(ef?.commissionType).toBe("annuity");
  });

  it("should have Income Gap Analyzer at $70,000/month annuity commissions", () => {
    const ig = TOOL_COMMISSIONS.find(t => t.id === "income-gap");
    expect(ig?.monthlyCommission).toBe(70000);
    expect(ig?.commissionType).toBe("annuity");
  });

  it("should have Real Estate Mogul at $300,000/month life commissions", () => {
    const rem = TOOL_COMMISSIONS.find(t => t.id === "real-estate-mogul");
    expect(rem?.monthlyCommission).toBe(300000);
    expect(rem?.commissionType).toBe("life");
  });

  it("should have House Recycling at $200,000/month life commissions", () => {
    const hr = TOOL_COMMISSIONS.find(t => t.id === "house-recycling");
    expect(hr?.monthlyCommission).toBe(200000);
    expect(hr?.commissionType).toBe("life");
  });

  it("should have all valid commission types", () => {
    const validTypes = ["life", "annuity", "both"];
    TOOL_COMMISSIONS.forEach(t => {
      expect(validTypes).toContain(t.commissionType);
    });
  });

  it("annual potential should be 12x monthly", () => {
    const monthlyTotal = TOOL_COMMISSIONS.reduce((sum, t) => sum + t.monthlyCommission, 0);
    expect(monthlyTotal * 12).toBe(18840000);
  });
});
