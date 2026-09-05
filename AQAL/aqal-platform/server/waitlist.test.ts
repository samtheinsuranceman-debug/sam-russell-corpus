import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("waitlist", () => {
  it("join mutation accepts valid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.waitlist.join({
      email: `test-${Date.now()}@example.com`,
    });

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
  });

  it("join mutation rejects invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.waitlist.join({ email: "not-an-email" })
    ).rejects.toThrow();
  });

  it("count query returns a number", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.waitlist.count();
    expect(result).toHaveProperty("count");
    expect(typeof result.count).toBe("number");
  });
});
