import { describe, expect, it } from "vitest";
import { PRODUCTS } from "./stripe/products";

describe("Stripe Products Configuration", () => {
  it("has correct monthly subscription pricing", () => {
    expect(PRODUCTS.MONTHLY_SUBSCRIPTION.priceAmount).toBe(999);
    expect(PRODUCTS.MONTHLY_SUBSCRIPTION.currency).toBe("usd");
    expect(PRODUCTS.MONTHLY_SUBSCRIPTION.interval).toBe("month");
  });

  it("has a 7-day trial period", () => {
    expect(PRODUCTS.MONTHLY_SUBSCRIPTION.trialDays).toBe(7);
  });

  it("has product name and description", () => {
    expect(PRODUCTS.MONTHLY_SUBSCRIPTION.name).toBe("Stop Fatty Premium");
    expect(PRODUCTS.MONTHLY_SUBSCRIPTION.description).toBeTruthy();
    expect(PRODUCTS.MONTHLY_SUBSCRIPTION.description.length).toBeGreaterThan(10);
  });
});

describe("Stripe Subscription Router", () => {
  it("subscription router exists in app router", async () => {
    const { appRouter } = await import("./routers");
    // Verify the subscription procedures exist
    expect(appRouter._def.procedures).toHaveProperty("subscription.createCheckout");
    expect(appRouter._def.procedures).toHaveProperty("subscription.status");
  });
});
