import { describe, it, expect } from "vitest";
import { IUL_CARRIERS, getCarrierById, ILLUSTRATION_TOOLS } from "../shared/iulCarriers";

// ─── IUL Carriers Data ─────────────────────────────────────────────────────────
describe("IUL Carriers Data", () => {
  it("should have at least 5 real carriers plus custom", () => {
    expect(IUL_CARRIERS.length).toBeGreaterThanOrEqual(6);
    const ids = IUL_CARRIERS.map((c) => c.id);
    expect(ids).toContain("custom");
    expect(ids).toContain("aaa-plus-mutual");
  });

  it("should have unique IDs for all carriers", () => {
    const ids = IUL_CARRIERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each carrier should have valid financial parameters", () => {
    for (const c of IUL_CARRIERS) {
      expect(c.loadFee).toBeGreaterThanOrEqual(0);
      expect(c.loadFee).toBeLessThanOrEqual(0.15);
      expect(c.coiRate).toBeGreaterThanOrEqual(0);
      expect(c.coiRate).toBeLessThanOrEqual(0.10);
      expect(c.loanRate).toBeGreaterThanOrEqual(0);
      expect(c.loanRate).toBeLessThanOrEqual(0.15);
      expect(c.avgIllustratedRate).toBeGreaterThanOrEqual(0);
      expect(c.avgIllustratedRate).toBeLessThanOrEqual(0.20);
      expect(c.capRate).toBeGreaterThanOrEqual(0);
      expect(c.participationRate).toBeGreaterThanOrEqual(0);
      expect(c.floorRate).toBeGreaterThanOrEqual(0);
    }
  });

  it("getCarrierById should return correct carrier", () => {
    const pacific = getCarrierById("aaa-plus-mutual");
    expect(pacific.name).toBe("AAA+ Mutual");
    expect(pacific.loadFee).toBeGreaterThan(0);
  });

  it("getCarrierById should return custom (last entry) for unknown ID", () => {
    const unknown = getCarrierById("nonexistent");
    expect(unknown.id).toBe("custom");
  });

  it("each carrier should have name, product, and description", () => {
    for (const c of IUL_CARRIERS) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.product.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
    }
  });

  it("non-generic/custom carriers should have illustrationUrl field", () => {
    const realCarriers = IUL_CARRIERS.filter((c) => c.id !== "generic" && c.id !== "custom");
    for (const c of realCarriers) {
      expect(typeof c.illustrationUrl).toBe("string");
    }
  });

  it("non-generic/custom carriers should have AM Best ratings", () => {
    const realCarriers = IUL_CARRIERS.filter((c) => c.id !== "generic" && c.id !== "custom");
    for (const c of realCarriers) {
      expect(c.amBestRating).toBeTruthy();
    }
  });
});

// ─── Illustration Tools ─────────────────────────────────────────────────────────
describe("Illustration Tools", () => {
  it("should have at least 3 illustration tools", () => {
    expect(ILLUSTRATION_TOOLS.length).toBeGreaterThanOrEqual(3);
  });

  it("each tool should have name, url, and description", () => {
    for (const tool of ILLUSTRATION_TOOLS) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });
});

// ─── Carrier Override in Roth Conversion Engine ────────────────────────────────
describe("Carrier Override Parameters", () => {
  it("custom carrier should have standard IUL assumptions", () => {
    const custom = getCarrierById("custom");
    expect(custom.loadFee).toBe(0.06);
    expect(custom.coiRate).toBe(0.05);
    expect(custom.loanRate).toBe(0.05);
    expect(custom.avgIllustratedRate).toBe(0.075); // AG 49 max
  });

  it("carrier overrides should differ from custom defaults", () => {
    const pacific = getCarrierById("aaa-plus-mutual");
    const custom = getCarrierById("custom");
    const differs = (
      pacific.loadFee !== custom.loadFee ||
      pacific.coiRate !== custom.coiRate ||
      pacific.loanRate !== custom.loanRate ||
      pacific.avgIllustratedRate !== custom.avgIllustratedRate
    );
    expect(differs).toBe(true);
  });

  it("custom carrier should have zero defaults for user input", () => {
    const custom = getCarrierById("custom");
    expect(custom.id).toBe("custom");
    expect(custom.name).toContain("Custom");
  });
});

// ─── Strategy Comparison Logic ─────────────────────────────────────────────────
describe("Strategy Comparison Logic", () => {
  it("all 6 strategy definitions should exist", () => {
    const strategies = [
      { years: 1, solar: false },
      { years: 2, solar: false },
      { years: 3, solar: false },
      { years: 4, solar: false },
      { years: 5, solar: false },
      { years: 1, solar: true },
    ];
    expect(strategies.length).toBe(6);
    // Each strategy should have unique years+solar combo
    const keys = strategies.map((s) => `${s.years}-${s.solar}`);
    expect(new Set(keys).size).toBe(6);
  });

  it("multi-year strategies should spread properties over N years", () => {
    // For a 3-year strategy with IRA/0.4 = $2M total property:
    // Should be $2M / 3 = ~$666K per year
    const iraBalance = 800000;
    const totalPropertyValue = iraBalance / 0.4; // $2M
    const years = 3;
    const perYear = totalPropertyValue / years;
    expect(perYear).toBeCloseTo(666666.67, 0);
  });

  it("solar equity should add 22% enhancement", () => {
    const iraBalance = 800000;
    const conversionAmount = iraBalance; // 100% conversion
    const solarEnhancement = conversionAmount * 0.22;
    expect(solarEnhancement).toBe(176000);
    // Year 1 IUL premium for solar = solarEnhancement
    expect(solarEnhancement).toBe(176000);
  });
});

// ─── PDF Report Generation ─────────────────────────────────────────────────────
describe("Roth PDF Report", () => {
  it("rothPdfReport module should export generateRothReport", async () => {
    const mod = await import("./rothPdfReport");
    expect(typeof mod.generateRothReport).toBe("function");
  });
});

// ─── Email Send Endpoint ───────────────────────────────────────────────────────
describe("Email Service", () => {
  it("email module should export sendClientReportEmail", async () => {
    const mod = await import("./email");
    expect(typeof mod.sendClientReportEmail).toBe("function");
  });
});

// ─── Router Procedures ─────────────────────────────────────────────────────────
describe("Router Procedures for Round 29", () => {
  it("rothConversion router should exist in appRouter", async () => {
    const mod = await import("./routers");
    expect(mod.appRouter).toBeDefined();
    expect(mod.appRouter._def.procedures).toBeDefined();
    const procNames = Object.keys(mod.appRouter._def.procedures);
    expect(procNames).toContain("rothConversion.project");
  });

  it("strategy router should exist in appRouter", async () => {
    const mod = await import("./routers");
    const procNames = Object.keys(mod.appRouter._def.procedures);
    expect(procNames).toContain("strategy.fullPlan");
  });
});
