import { describe, it, expect } from "vitest";
import {
  US_STATES,
  STATE_GUARANTY,
  getStateGuaranty,
  getStateName,
  getTopProductsForState,
  getCarrierSplitRecommendation,
  getFullStateReport,
  type StateCode,
} from "../shared/annuityData";

describe("shared/annuityData", () => {
  describe("US_STATES", () => {
    it("contains all 50 states plus DC", () => {
      expect(US_STATES.length).toBe(51);
    });

    it("has unique state codes", () => {
      const codes = US_STATES.map(s => s.code);
      expect(new Set(codes).size).toBe(51);
    });

    it("includes key states", () => {
      const codes = US_STATES.map(s => s.code);
      expect(codes).toContain("FL");
      expect(codes).toContain("CA");
      expect(codes).toContain("NY");
      expect(codes).toContain("TX");
      expect(codes).toContain("DC");
    });
  });

  describe("STATE_GUARANTY", () => {
    it("has entries for all 51 jurisdictions", () => {
      expect(Object.keys(STATE_GUARANTY).length).toBe(51);
    });

    it("has required fields for each state", () => {
      for (const [code, g] of Object.entries(STATE_GUARANTY)) {
        expect(g.annuityLimit).toBeGreaterThan(0);
        expect(g.lifeDeathBenefit).toBeGreaterThan(0);
        expect(["Premium", "Enhanced", "Standard", "Below Standard"]).toContain(g.tier);
        expect(g.website).toBeTruthy();
      }
    });

    it("New York has $500K annuity limit (Premium)", () => {
      const ny = STATE_GUARANTY["NY"];
      expect(ny.annuityLimit).toBe(500000);
      expect(ny.tier).toBe("Premium");
    });

    it("California has $250K annuity limit (Standard)", () => {
      const ca = STATE_GUARANTY["CA"];
      expect(ca.annuityLimit).toBe(250000);
      expect(ca.tier).toBe("Standard");
    });

    it("Florida has $250K annuity limit", () => {
      const fl = STATE_GUARANTY["FL"];
      expect(fl.annuityLimit).toBe(250000);
    });
  });

  describe("getStateGuaranty", () => {
    it("returns correct data for valid state code", () => {
      const result = getStateGuaranty("TX");
      expect(result.annuityLimit).toBeGreaterThan(0);
      expect(result.tier).toBeTruthy();
    });

    it("returns default for invalid state code", () => {
      const result = getStateGuaranty("ZZ" as StateCode);
      expect(result.annuityLimit).toBe(250000);
      expect(result.tier).toBe("Standard");
    });
  });

  describe("getStateName", () => {
    it("returns full name for valid code", () => {
      expect(getStateName("FL")).toBe("Florida");
      expect(getStateName("CA")).toBe("California");
      expect(getStateName("NY")).toBe("New York");
    });

    it("returns code for unknown code", () => {
      expect(getStateName("ZZ" as StateCode)).toBe("ZZ");
    });
  });

  describe("getTopProductsForState", () => {
    it("returns income products for a state", () => {
      const products = getTopProductsForState("FL", "income", 10);
      expect(products.length).toBeGreaterThan(0);
      expect(products.length).toBeLessThanOrEqual(10);
      products.forEach(p => {
        expect(p.category).toBe("income");
        expect(p.carrier).toBeTruthy();
        expect(p.product).toBeTruthy();
      });
    });

    it("returns growth products for a state", () => {
      const products = getTopProductsForState("TX", "growth", 10);
      expect(products.length).toBeGreaterThan(0);
      products.forEach(p => {
        expect(p.category).toBe("growth");
      });
    });

    it("returns MYGA products for a state", () => {
      const products = getTopProductsForState("NY", "myga", 10);
      expect(products.length).toBeGreaterThan(0);
      products.forEach(p => {
        expect(p.category).toBe("myga");
      });
    });

    it("excludes products not available in a state", () => {
      // Get products for all states and verify excluded states are respected
      for (const state of US_STATES) {
        const products = getTopProductsForState(state.code as StateCode, "income", 50);
        products.forEach(p => {
          if (p.excludedStates) {
            expect(p.excludedStates).not.toContain(state.code);
          }
        });
      }
    });

    it("respects the limit parameter", () => {
      const products5 = getTopProductsForState("FL", "income", 5);
      expect(products5.length).toBeLessThanOrEqual(5);

      const products3 = getTopProductsForState("FL", "income", 3);
      expect(products3.length).toBeLessThanOrEqual(3);
    });

    it("returns products sorted by rank", () => {
      const products = getTopProductsForState("FL", "income", 10);
      for (let i = 1; i < products.length; i++) {
        expect(products[i].rank).toBeGreaterThanOrEqual(products[i - 1].rank);
      }
    });
  });

  describe("getCarrierSplitRecommendation", () => {
    it("recommends no split when premium is under guaranty limit", () => {
      const result = getCarrierSplitRecommendation(200000, "FL"); // FL limit is $300K
      expect(result.splitCount).toBe(1);
    });

    it("recommends split when premium exceeds guaranty limit", () => {
      const result = getCarrierSplitRecommendation(1000000, "FL"); // FL limit is $300K
      expect(result.splitCount).toBeGreaterThan(1);
    });

    it("recommends more splits for larger premiums", () => {
      const small = getCarrierSplitRecommendation(500000, "CA"); // CA limit is $250K
      const large = getCarrierSplitRecommendation(2000000, "CA");
      expect(large.splitCount).toBeGreaterThan(small.splitCount);
    });

    it("returns per-carrier amount", () => {
      const result = getCarrierSplitRecommendation(1000000, "NY"); // NY limit is $500K
      expect(result.perCarrier).toBeLessThanOrEqual(500000);
      expect(result.perCarrier * result.splitCount).toBeGreaterThanOrEqual(1000000);
    });
  });

  describe("getFullStateReport", () => {
    it("returns a comprehensive report for a state", () => {
      const report = getFullStateReport("FL");
      expect(report.stateCode).toBe("FL");
      expect(report.stateName).toBe("Florida");
      expect(report.guaranty).toBeTruthy();
      expect(report.guaranty.annuityLimit).toBe(250000);
      expect(report.incomeProducts.length).toBeGreaterThan(0);
      expect(report.growthProducts.length).toBeGreaterThan(0);
      expect(report.mygaProducts.length).toBeGreaterThan(0);
    });

    it("generates reports for all 51 jurisdictions without error", () => {
      for (const state of US_STATES) {
        const report = getFullStateReport(state.code as StateCode);
        expect(report.stateCode).toBe(state.code);
        expect(report.stateName).toBe(state.name);
        expect(report.guaranty).toBeTruthy();
      }
    });
  });

  describe("product data integrity", () => {
    it("all products have required fields", () => {
      for (const category of ["income", "growth", "myga"] as const) {
        const products = getTopProductsForState("FL", category, 50);
        products.forEach(p => {
          expect(p.id).toBeTruthy();
          expect(p.carrier).toBeTruthy();
          expect(p.product).toBeTruthy();
          expect(p.amBest).toBeTruthy();
          expect(p.category).toBe(category);
          expect(typeof p.rank).toBe("number");
        });
      }
    });

    it("income products have income-specific fields", () => {
      const products = getTopProductsForState("FL", "income", 50);
      products.forEach(p => {
        expect(typeof p.rollupRate).toBe("number");
        // payoutPer100k65 is the payout field
        expect(typeof p.payoutPer100k65).toBe("number");
      });
    });

    it("MYGA products have term rate fields", () => {
      const products = getTopProductsForState("FL", "myga", 50);
      products.forEach(p => {
        // At least one term rate should exist
        const hasRate = p.term3yr || p.term5yr || p.term7yr || p.term10yr;
        expect(hasRate).toBeTruthy();
      });
    });
  });
});
