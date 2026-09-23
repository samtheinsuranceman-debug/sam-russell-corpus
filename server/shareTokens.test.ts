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

describe("share-token procedures with no database", () => {
  it("a well-formed token answers 503 on the client portal and video endpoints, not a revoked-link 404", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ user: null, req: { protocol: "https", headers: {} }, res: { clearCookie() {} } } as any);
    const token = "a".repeat(64);
    const { getDb } = await import("./db");
    if (await getDb()) return; // a database is attached: nothing to assert about outages
    await expect(caller.clientPortal.view({ token })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    await expect(caller.videoProposal.getByShareToken({ token })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    await expect(caller.clientPortal.view({ token: "short" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  }, 120000);
});
