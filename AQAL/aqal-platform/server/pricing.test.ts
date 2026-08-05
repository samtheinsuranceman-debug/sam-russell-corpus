import { describe, it, expect } from "vitest";
import { PRODUCTS } from "./stripe/products";
import {
  PRICE_MEMBERSHIP_MONTHLY_CENTS,
  PRICE_MEMBERSHIP_ANNUAL_CENTS,
} from "@shared/giveawayLadder";

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

  it("membership is a $449/month subscription with a 15-day free trial", () => {
    expect(PRODUCTS.membership.price).toBe(44900);
    expect(PRODUCTS.membership.mode).toBe("subscription");
    expect(PRODUCTS.membership.interval).toBe("month");
    expect(PRODUCTS.membership.trialDays).toBe(15);
  });

  it("annual membership is $4,499/year (saves $889 vs monthly)", () => {
    expect(PRODUCTS.membershipAnnual.price).toBe(449900);
    expect(PRODUCTS.membershipAnnual.mode).toBe("subscription");
    expect(PRODUCTS.membershipAnnual.interval).toBe("year");
    expect(PRODUCTS.membership.price * 12 - PRODUCTS.membershipAnnual.price).toBe(88900);
  });

  it("Stripe prices match the shared single-source-of-truth constants", () => {
    expect(PRODUCTS.membership.price).toBe(PRICE_MEMBERSHIP_MONTHLY_CENTS);
    expect(PRODUCTS.membershipAnnual.price).toBe(PRICE_MEMBERSHIP_ANNUAL_CENTS);
  });

  it("has exactly the four current product keys", () => {
    expect(Object.keys(PRODUCTS)).toEqual(["audio", "underwritten", "membership", "membershipAnnual"]);
  });
});
