import { describe, expect, it } from "vitest";
import {
  US_STATES,
  getTopProductsForState,
  getStateGuaranty,
  getStateName,
  getCarrierSplitRecommendation,
  type StateCode,
  type AnnuityProduct,
} from "@shared/annuityData";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/* ─── Helper: create an owner context for password verification ─── */
function createOwnerContext() {
  const user = {
    id: 1,
    openId: process.env.OWNER_OPEN_ID || "owner-open-id",
    email: "owner@example.com",
    name: "Sam Russell",
    loginMethod: "manus" as const,
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  } as TrpcContext;
}

/* ─── Annuity Data Store Tests ─── */
describe("Annuity Accumulation Database — Data Store", () => {
  it("US_STATES contains all 50 states + DC (51 entries)", () => {
    expect(US_STATES.length).toBe(51);
    // Check a few key states
    const codes = US_STATES.map((s) => s.code);
    expect(codes).toContain("FL");
    expect(codes).toContain("CA");
    expect(codes).toContain("TX");
    expect(codes).toContain("NY");
    expect(codes).toContain("DC");
  });

  it("getTopProductsForState returns up to 10 growth products for any state", () => {
    const states: StateCode[] = ["FL", "CA", "TX", "NY", "IL", "OH", "PA"];
    for (const state of states) {
      const products = getTopProductsForState(state, "growth", 10);
      expect(products.length).toBeGreaterThan(0);
      expect(products.length).toBeLessThanOrEqual(10);
      // All products should be growth category
      for (const p of products) {
        expect(p.category).toBe("growth");
      }
    }
  });

  it("growth products for NY exclude products with NY in excludedStates", () => {
    const nyProducts = getTopProductsForState("NY", "growth", 10);
    for (const p of nyProducts) {
      expect(p.excludedStates).not.toContain("NY");
    }
  });

  it("growth products have required fields for accumulation display", () => {
    const products = getTopProductsForState("FL", "growth", 10);
    for (const p of products) {
      expect(p.id).toBeTruthy();
      expect(p.carrier).toBeTruthy();
      expect(p.product).toBeTruthy();
      expect(p.amBest).toBeTruthy();
      expect(p.category).toBe("growth");
      expect(typeof p.participationRate).toBe("number");
      expect(typeof p.highlight).toBe("string");
      expect(p.highlight.length).toBeGreaterThan(0);
    }
  });

  it("getStateGuaranty returns valid guaranty data for each state", () => {
    const states: StateCode[] = ["FL", "CA", "TX", "NY"];
    for (const state of states) {
      const g = getStateGuaranty(state);
      expect(g.annuityLimit).toBeGreaterThan(0);
      expect(g.aggregateLimit).toBeGreaterThan(0);
      expect(["Premium", "Enhanced", "Standard", "Below Standard"]).toContain(g.tier);
      expect(g.website).toBeTruthy();
      expect(g.phone).toBeTruthy();
    }
  });

  it("getStateName returns correct state names", () => {
    expect(getStateName("FL")).toBe("Florida");
    expect(getStateName("CA")).toBe("California");
    expect(getStateName("TX")).toBe("Texas");
    expect(getStateName("NY")).toBe("New York");
    expect(getStateName("DC")).toBe("District of Columbia");
  });

  it("getCarrierSplitRecommendation returns single carrier when under limit", () => {
    const result = getCarrierSplitRecommendation(100000, "FL");
    // Florida has a $300K limit, so $100K should be single carrier
    expect(result.splitCount).toBe(1);
    expect(result.perCarrier).toBe(100000);
    expect(result.recommendation).toContain("Single carrier");
  });

  it("getCarrierSplitRecommendation recommends split when over limit", () => {
    // Use a state with $250K standard limit
    const result = getCarrierSplitRecommendation(600000, "OH");
    expect(result.splitCount).toBeGreaterThan(1);
    expect(result.perCarrier).toBeLessThan(600000);
    expect(result.recommendation).toContain("splitting");
  });

  it("products are ranked in order (rank 1 first)", () => {
    const products = getTopProductsForState("FL", "growth", 10);
    for (let i = 0; i < products.length - 1; i++) {
      expect(products[i].rank).toBeLessThanOrEqual(products[i + 1].rank);
    }
  });
});

/* ─── Managed Admin Verification Tests ─── */
describe("Annuity Accumulation Database — Managed Admin Gate", () => {
  it("hiddenMaterial.verifyPassword confirms managed admin access", async () => {
    const ctx = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.hiddenMaterial.verifyPassword({
      password: "Mike1248(?)",
    });
    expect(result).toEqual({ verified: true, access: "managed_oauth" });
  });

  it("legacy password values do not influence authorized admin access", async () => {
    const ctx = createOwnerContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.hiddenMaterial.verifyPassword({ password: "wrong-password" }))
      .resolves.toEqual({ verified: true, access: "managed_oauth" });
  });
});
