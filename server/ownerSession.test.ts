import { afterEach, describe, expect, it } from "vitest";
import { isOwnerSession } from "./ownerGuard";
import { guestOpenId, isReservedOwnerEmail, ownerOpenId } from "./_core/ownerLogin";

const OWNER = "owner@example.com";

describe("owner checks need the owner's session, not just the owner's email", () => {
  const saved = process.env.OWNER_EMAIL;
  afterEach(() => { process.env.OWNER_EMAIL = saved; });

  it("accepts the owner's own session", () => {
    process.env.OWNER_EMAIL = OWNER;
    expect(isOwnerSession({ email: OWNER, openId: ownerOpenId() })).toBe(true);
  });

  it("refuses a guest session that typed the owner's email", () => {
    process.env.OWNER_EMAIL = OWNER;
    expect(isOwnerSession({ email: OWNER, openId: guestOpenId(OWNER) })).toBe(false);
  });

  it("refuses a missing user or a non-owner email", () => {
    process.env.OWNER_EMAIL = OWNER;
    expect(isOwnerSession(null)).toBe(false);
    expect(isOwnerSession({ email: "someone@example.com", openId: ownerOpenId() })).toBe(false);
  });
});

describe("the shared entrance passcode cannot be used with the owner's address", () => {
  it("reserves the owner address, case-insensitively", () => {
    const env = { ownerEmail: OWNER } as Parameters<typeof isReservedOwnerEmail>[1];
    expect(isReservedOwnerEmail("  Owner@Example.com ", env)).toBe(true);
    expect(isReservedOwnerEmail("visitor@example.com", env)).toBe(false);
    expect(isReservedOwnerEmail("", env)).toBe(false);
  });
});
