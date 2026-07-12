import { describe, it, expect } from "vitest";
import { PRODUCTS } from "./stripe/products";

describe("Stripe Products Configuration", () => {
  it("assessment product is priced at $299 (29900 cents) for founding members", () => {
    expect(PRODUCTS.assessment.price).toBe(29900);
    expect(PRODUCTS.assessment.mode).toBe("payment");
  });

  it("assessment product includes correct founding member naming", () => {
    expect(PRODUCTS.assessment.name).toContain("Founding Member");
  });

  it("regular assessment is priced at $1,500 (150000 cents)", () => {
    expect(PRODUCTS.assessmentRegular.price).toBe(150000);
    expect(PRODUCTS.assessmentRegular.mode).toBe("payment");
  });

  it("coaching membership (silver) is a monthly subscription at $39", () => {
    expect(PRODUCTS.silver.price).toBe(3900);
    expect(PRODUCTS.silver.mode).toBe("subscription");
    expect(PRODUCTS.silver.interval).toBe("month");
  });

  it("growth & network (gold) is a monthly subscription at $149", () => {
    expect(PRODUCTS.gold.price).toBe(14900);
    expect(PRODUCTS.gold.mode).toBe("subscription");
    expect(PRODUCTS.gold.interval).toBe("month");
  });

  it("private network (platinum) is a monthly subscription at $499", () => {
    expect(PRODUCTS.platinum.price).toBe(49900);
    expect(PRODUCTS.platinum.mode).toBe("subscription");
    expect(PRODUCTS.platinum.interval).toBe("month");
  });

  it("has correct product keys", () => {
    const keys = Object.keys(PRODUCTS);
    expect(keys).toEqual(["assessment", "assessmentRegular", "silver", "gold", "platinum"]);
  });
});
