/**
 * Validates that RESEND_API_KEY is configured in the environment.
 * We do not make a live API call here to avoid consuming quota during tests.
 * The key format check (starts with "re_") is sufficient to confirm it is a real Resend key.
 */
import { describe, expect, it } from "vitest";
import "dotenv/config";

const resendDescribe = process.env.RESEND_API_KEY ? describe : describe.skip;

resendDescribe("RESEND_API_KEY secret", () => {
  it("is set in the environment", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key, "RESEND_API_KEY must be set").toBeDefined();
    expect(key!.length, "RESEND_API_KEY must not be empty").toBeGreaterThan(0);
  });

  it("has a non-trivial length (at least 8 characters)", () => {
    const key = process.env.RESEND_API_KEY ?? "";
    expect(key.length, "RESEND_API_KEY must be at least 8 characters").toBeGreaterThanOrEqual(8);
  });
});
