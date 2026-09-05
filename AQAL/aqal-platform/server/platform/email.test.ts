import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createUnsubscribeToken, readUnsubscribeToken, unsubscribeUrl } from "./email";

const originalSecret = process.env.JWT_SECRET;

describe("marketing unsubscribe tokens", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-only-unsubscribe-secret-with-enough-entropy";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("round-trips a normalized address without exposing it in the token", () => {
    const token = createUnsubscribeToken("  Person@Example.COM ");
    expect(token).not.toContain("Person");
    expect(token).not.toContain("example.com");
    expect(readUnsubscribeToken(token)).toBe("person@example.com");
  });

  it("rejects a tampered token", () => {
    const token = createUnsubscribeToken("person@example.com");
    expect(readUnsubscribeToken(`${token}broken`)).toBeNull();
  });

  it("builds a scanner-safe URL containing only an opaque token", () => {
    const url = unsubscribeUrl("https://www.joinaqal.com/", "person@example.com");
    expect(url).toMatch(/^https:\/\/www\.joinaqal\.com\/api\/unsubscribe\?t=/);
    expect(url).not.toContain("person%40example.com");
    expect(url).not.toContain("person@example.com");
  });

  it("fails closed when JWT_SECRET is absent", () => {
    delete process.env.JWT_SECRET;
    expect(() => createUnsubscribeToken("person@example.com")).toThrow(/JWT_SECRET/);
    expect(readUnsubscribeToken("anything")).toBeNull();
  });
});
