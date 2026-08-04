import { describe, it, expect } from "vitest";
import { PRODUCTS } from "./stripe/products";

describe("Stripe Products Configuration", () => {
  it("audio assessment is a $500 one-time payment", () => {
    expect(PRODUCTS.audio.price).toBe(50000);
    expect(PRODUCTS.audio.mode).toBe("payment");
  });

  it("fully underwritten assessment is a $1,500 one-time payment", () => {
    expect(PRODUCTS.underwritten.price).toBe(150000);
    expect(PRODUCTS.underwritten.mode).toBe("payment");
    expect(PRODUCTS.underwritten.name).toContain("Underwritten");
  });

  it("membership is a $79/month subscription with a 15-day free trial", () => {
    expect(PRODUCTS.membership.price).toBe(7900);
    expect(PRODUCTS.membership.mode).toBe("subscription");
    expect(PRODUCTS.membership.interval).toBe("month");
    expect(PRODUCTS.membership.trialDays).toBe(15);
  });

  it("has exactly the three current product keys", () => {
    expect(Object.keys(PRODUCTS)).toEqual(["audio", "underwritten", "membership"]);
  });
});
