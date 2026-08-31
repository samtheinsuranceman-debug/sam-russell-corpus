import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-manifesto-user",
    email: "manifesto@example.com",
    name: "Manifesto Tester",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

function createCaller() {
  const { ctx } = createAuthContext();
  return appRouter.createCaller(ctx);
}

// ═══════════════════════════════════════════════════════════════════
// PET SYSTEM TESTS
// ═══════════════════════════════════════════════════════════════════
describe("Pet System Router", () => {
  it("should have pet.get procedure", () => {
    const caller = createCaller();
    expect(caller.pet).toBeDefined();
    expect(caller.pet.get).toBeDefined();
  });

  it("should have pet.adopt procedure", () => {
    const caller = createCaller();
    expect(caller.pet.adopt).toBeDefined();
  });

  it("should have pet.feed procedure", () => {
    const caller = createCaller();
    expect(caller.pet.feed).toBeDefined();
  });

  it("should have pet.interact procedure", () => {
    const caller = createCaller();
    expect(caller.pet.interact).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// MORNING RITUAL TESTS
// ═══════════════════════════════════════════════════════════════════
describe("Morning Ritual Router", () => {
  it("should have morningRitual.getToday procedure", () => {
    const caller = createCaller();
    expect(caller.morningRitual).toBeDefined();
    expect(caller.morningRitual.getToday).toBeDefined();
  });

  it("should have morningRitual.start procedure", () => {
    const caller = createCaller();
    expect(caller.morningRitual.start).toBeDefined();
  });

  it("should have morningRitual.completeStep procedure", () => {
    const caller = createCaller();
    expect(caller.morningRitual.completeStep).toBeDefined();
  });

  it("should have morningRitual.getStreak procedure", () => {
    const caller = createCaller();
    expect(caller.morningRitual.getStreak).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// WITHDRAWAL TRIGGER TESTS
// ═══════════════════════════════════════════════════════════════════
describe("Withdrawal Trigger Router", () => {
  it("should have withdrawal.getUnread procedure", () => {
    const caller = createCaller();
    expect(caller.withdrawal).toBeDefined();
    expect(caller.withdrawal.getUnread).toBeDefined();
  });

  it("should have withdrawal.markRead procedure", () => {
    const caller = createCaller();
    expect(caller.withdrawal.markRead).toBeDefined();
  });

  it("should have withdrawal.markClicked procedure", () => {
    const caller = createCaller();
    expect(caller.withdrawal.markClicked).toBeDefined();
  });

  it("should have withdrawal.generate procedure", () => {
    const caller = createCaller();
    expect(caller.withdrawal.generate).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// REVENUE GUARANTEE TESTS
// ═══════════════════════════════════════════════════════════════════
describe("Revenue Guarantee Router", () => {
  it("should have revenueGuarantee.calculate procedure", () => {
    const caller = createCaller();
    expect(caller.revenueGuarantee).toBeDefined();
    expect(caller.revenueGuarantee.calculate).toBeDefined();
  });

  it("should have revenueGuarantee.history procedure", () => {
    const caller = createCaller();
    expect(caller.revenueGuarantee.history).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// WAR STORY AI GENERATOR TESTS
// ═══════════════════════════════════════════════════════════════════
describe("War Story AI Generator Router", () => {
  it("should have warStoryAI.generate procedure", () => {
    const caller = createCaller();
    expect(caller.warStoryAI).toBeDefined();
    expect(caller.warStoryAI.generate).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// ROUTER COMPOSITION TESTS
// ═══════════════════════════════════════════════════════════════════
describe("Manifesto Router Composition", () => {
  it("all manifesto routers should be registered in appRouter", () => {
    const caller = createCaller();
    // All 5 new manifesto routers must exist
    expect(caller.pet).toBeDefined();
    expect(caller.morningRitual).toBeDefined();
    expect(caller.withdrawal).toBeDefined();
    expect(caller.revenueGuarantee).toBeDefined();
    expect(caller.warStoryAI).toBeDefined();
  });

  it("existing experience router should still be accessible", () => {
    const caller = createCaller();
    expect(caller.experience).toBeDefined();
    expect(caller.experience.getProfile).toBeDefined();
    expect(caller.experience.checkIn).toBeDefined();
  });
});
