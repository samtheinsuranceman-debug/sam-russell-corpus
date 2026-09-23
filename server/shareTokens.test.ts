import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertShareToken, isPlausibleShareToken, noDatabase } from "./_core/shareTokens";

describe("public share tokens", () => {
  it("accepts the shape we issue (hex from randomBytes) and refuses probes", () => {
    expect(isPlausibleShareToken("a".repeat(48))).toBe(true);
    expect(isPlausibleShareToken("0123456789abcdef".repeat(6))).toBe(true);
    expect(isPlausibleShareToken("p7_probe_token")).toBe(false);
    expect(isPlausibleShareToken("invalidtoken123")).toBe(false);
    expect(isPlausibleShareToken("../../etc/passwd-xxxxxxxx")).toBe(false);
    expect(isPlausibleShareToken("")).toBe(false);
  });

  it("a bad token is a 404 (NOT_FOUND), and a missing database is a 503, never a 500", () => {
    try {
      assertShareToken("nope", "shared projection");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(TRPCError);
      expect((e as TRPCError).code).toBe("NOT_FOUND");
    }
    expect(noDatabase().code).toBe("SERVICE_UNAVAILABLE");
  });
});
