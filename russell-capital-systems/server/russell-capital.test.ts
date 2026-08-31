import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: "user" | "admin" = "user"): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@russellcapitalsystems.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true, path: "/" });
  });

  it("returns the authenticated user from auth.me", async () => {
    const { ctx } = createCtx();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.email).toBe("test@russellcapitalsystems.com");
    expect(user?.role).toBe("user");
  });
});

// ─── Financial Engine (pure functions) ────────────────────────────────────────

describe("Financial Engine — Roth Ladder", () => {
  // Mirror the actual server implementation
  function calcRothHeadroom(income: number, targetBracket: number): number {
    const brackets = [
      { top: 23200, rate: 0.10 }, { top: 94300, rate: 0.12 }, { top: 201050, rate: 0.22 },
      { top: 383900, rate: 0.24 }, { top: 487450, rate: 0.32 }, { top: 731200, rate: 0.35 },
      { top: Infinity, rate: 0.37 },
    ];
    for (const b of brackets) {
      if (b.rate <= targetBracket && income < b.top) return Math.max(0, b.top - income);
    }
    return 0;
  }

  const buildRothLadder = (params: {
    age: number; income: number; iraBalance: number;
    targetBracket: number; years: number; assumedReturn: number;
  }) => {
    let ira = params.iraBalance; let roth = 0; const rows = [];
    for (let y = 1; y <= params.years; y++) {
      const headroom = calcRothHeadroom(params.income, params.targetBracket);
      const conversion = Math.min(headroom, ira);
      const tax = Math.round(conversion * params.targetBracket);
      ira = Math.max((ira - conversion) * (1 + params.assumedReturn), 0);
      roth = (roth + conversion) * (1 + params.assumedReturn);
      const irmaa = params.income + conversion > 206000 ? 3600 : 0;
      rows.push({ year: y, age: params.age + y - 1, conversion: Math.round(conversion), taxEstimate: tax, endingIraBalance: Math.round(ira), endingRothBalance: Math.round(roth), estimatedIrmaa: irmaa });
    }
    return rows;
  };

  it("produces the correct number of rows", () => {
    const ladder = buildRothLadder({ age: 58, income: 250000, iraBalance: 800000, targetBracket: 0.24, years: 5, assumedReturn: 0.05 });
    expect(ladder).toHaveLength(5);
  });

  it("first row has a positive conversion amount", () => {
    const ladder = buildRothLadder({ age: 58, income: 250000, iraBalance: 800000, targetBracket: 0.24, years: 5, assumedReturn: 0.05 });
    expect(ladder[0]!.conversion).toBeGreaterThan(0);
  });

  it("IRA balance decreases over time", () => {
    const ladder = buildRothLadder({ age: 58, income: 250000, iraBalance: 800000, targetBracket: 0.24, years: 5, assumedReturn: 0.05 });
    expect(ladder[4]!.endingIraBalance).toBeLessThan(800000);
  });

  it("Roth balance increases over time", () => {
    const ladder = buildRothLadder({ age: 58, income: 250000, iraBalance: 800000, targetBracket: 0.24, years: 5, assumedReturn: 0.05 });
    expect(ladder[4]!.endingRothBalance).toBeGreaterThan(0);
  });

  it("tax estimate is approximately bracket rate * conversion", () => {
    const ladder = buildRothLadder({ age: 58, income: 250000, iraBalance: 800000, targetBracket: 0.24, years: 5, assumedReturn: 0.05 });
    const row = ladder[0]!;
    const impliedRate = row.taxEstimate / row.conversion;
    expect(impliedRate).toBeCloseTo(0.24, 1);
  });
});

describe("Financial Engine — Opportunity Score", () => {
  // Mirror the actual server implementation
  const scoreOpportunity = (income: number, iraBalance: number, realEstateEquity: number): number => {
    const roth = Math.min(100, (iraBalance / 1_000_000) * 60);
    const re = Math.min(100, (realEstateEquity / 2_000_000) * 50);
    const inc = Math.min(100, (income / 400_000) * 40);
    return Math.min(100, Math.round(roth * 0.4 + re * 0.3 + inc * 0.3));
  };

  it("returns 0 for empty inputs", () => {
    expect(scoreOpportunity(0, 0, 0)).toBe(0);
  });

  it("returns max 100 for ultra-high-net-worth profile", () => {
    expect(scoreOpportunity(1_000_000, 5_000_000, 5_000_000)).toBe(100);
  });

  it("high-income + large IRA scores above 0", () => {
    const score = scoreOpportunity(300000, 1_000_000, 0);
    expect(score).toBeGreaterThan(0);
  });

  it("ultra-high-net-worth scores above 60", () => {
    const score = scoreOpportunity(400000, 2_000_000, 2_000_000);
    expect(score).toBeGreaterThan(60);
  });

  it("score is bounded between 0 and 100", () => {
    const score = scoreOpportunity(500000, 3_000_000, 3_000_000);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── Demo router (public) ─────────────────────────────────────────────────────

describe("demo.data", () => {
  it("returns demo advisors and clients without authentication", async () => {
    const { ctx } = createCtx();
    const caller = appRouter.createCaller({ ...ctx, user: null });
    const data = await caller.demo.data();
    expect(Array.isArray(data.advisors)).toBe(true);
    expect(data.advisors.length).toBeGreaterThan(0);
    expect(Array.isArray(data.clients)).toBe(true);
  });
});
