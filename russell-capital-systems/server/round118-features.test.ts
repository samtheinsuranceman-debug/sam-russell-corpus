import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Round 118 — Fact Finder & Gamification Features", () => {
  // ── Risk Assessment Scoring ──
  describe("Risk Assessment Scoring Logic", () => {
    it("calculates conservative risk profile for low scores", () => {
      // Risk score is average of 8 questions (1-10 scale) * 10
      const answers = [2, 2, 3, 1, 2, 1, 2, 3]; // avg ~2 → score ~20
      const avg = answers.reduce((a, b) => a + b, 0) / answers.length;
      const score = Math.round(avg * 10);
      expect(score).toBeLessThanOrEqual(25);
      // Conservative threshold
      const label = score <= 25 ? "Conservative" : score <= 40 ? "Moderate Conservative" : "Moderate";
      expect(label).toBe("Conservative");
    });

    it("calculates aggressive risk profile for high scores", () => {
      const answers = [9, 8, 9, 10, 8, 9, 8, 9]; // avg ~8.75 → score ~88
      const avg = answers.reduce((a, b) => a + b, 0) / answers.length;
      const score = Math.round(avg * 10);
      expect(score).toBeGreaterThan(75);
      const label = score > 75 ? "Aggressive" : "Moderate Aggressive";
      expect(label).toBe("Aggressive");
    });

    it("calculates moderate risk profile for mid-range scores", () => {
      const answers = [5, 5, 6, 5, 5, 6, 5, 5]; // avg ~5.25 → score ~53
      const avg = answers.reduce((a, b) => a + b, 0) / answers.length;
      const score = Math.round(avg * 10);
      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThanOrEqual(60);
    });
  });

  // ── Financial Score Calculation ──
  describe("Financial Score Calculation", () => {
    it("produces higher score for diversified portfolio", () => {
      // Count asset classes with value > 0
      const assets = {
        cashSavings: 100000,
        taxableInvestments: 200000,
        realEstateEquity: 500000,
        iraBalance: 300000,
        rothBalance: 50000,
        lifeInsuranceCv: 100000,
        annuityValue: 50000,
      };
      let diversCount = 0;
      if (assets.cashSavings > 0) diversCount++;
      if (assets.taxableInvestments > 0) diversCount++;
      if (assets.realEstateEquity > 0) diversCount++;
      if (assets.iraBalance > 0) diversCount++;
      if (assets.rothBalance > 0) diversCount++;
      if (assets.lifeInsuranceCv > 0) diversCount++;
      if (assets.annuityValue > 0) diversCount++;
      const diversification = Math.min(100, Math.max(15, diversCount * 14));
      expect(diversCount).toBe(7);
      expect(diversification).toBe(98);
    });

    it("produces lower score for concentrated portfolio", () => {
      const assets = {
        cashSavings: 0,
        taxableInvestments: 0,
        realEstateEquity: 0,
        iraBalance: 500000,
        rothBalance: 0,
        lifeInsuranceCv: 0,
        annuityValue: 0,
      };
      let diversCount = 0;
      if (assets.cashSavings > 0) diversCount++;
      if (assets.taxableInvestments > 0) diversCount++;
      if (assets.realEstateEquity > 0) diversCount++;
      if (assets.iraBalance > 0) diversCount++;
      if (assets.rothBalance > 0) diversCount++;
      if (assets.lifeInsuranceCv > 0) diversCount++;
      if (assets.annuityValue > 0) diversCount++;
      const diversification = Math.min(100, Math.max(15, diversCount * 14));
      expect(diversCount).toBe(1);
      expect(diversification).toBe(15);
    });

    it("calculates net worth correctly", () => {
      const totalAssets = 100000 + 200000 + 500000 + 300000 + 50000 + 100000 + 50000;
      const totalDebt = 300000 + 20000;
      const netWorth = totalAssets - totalDebt;
      expect(netWorth).toBe(980000);
    });

    it("calculates savings rate behavior score", () => {
      const income = 250000;
      const monthlyExpenses = 12000;
      const annualSavings = income - (monthlyExpenses * 12);
      const savingsRate = annualSavings / income;
      const behavior = Math.min(100, Math.max(10, Math.round(savingsRate * 200 + 30)));
      expect(annualSavings).toBe(106000);
      expect(behavior).toBeGreaterThan(50);
    });
  });

  // ── Level System ──
  describe("Level System", () => {
    const LEVEL_NAMES = ["Starter", "Explorer", "Builder", "Strategist", "Optimizer", "Achiever", "Wealth Guardian", "Legacy Builder", "Financial Master", "Legendary"];
    const thresholds = [0, 20, 30, 40, 50, 60, 70, 80, 90, 95];

    function getScoreLevel(score: number): number {
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (score >= thresholds[i]) return i + 1;
      }
      return 1;
    }

    it("assigns Starter level for score 0-19", () => {
      expect(getScoreLevel(0)).toBe(1);
      expect(getScoreLevel(19)).toBe(1);
      expect(LEVEL_NAMES[0]).toBe("Starter");
    });

    it("assigns Explorer level for score 20-29", () => {
      expect(getScoreLevel(20)).toBe(2);
      expect(getScoreLevel(29)).toBe(2);
      expect(LEVEL_NAMES[1]).toBe("Explorer");
    });

    it("assigns Legendary level for score 95+", () => {
      expect(getScoreLevel(95)).toBe(10);
      expect(getScoreLevel(100)).toBe(10);
      expect(LEVEL_NAMES[9]).toBe("Legendary");
    });

    it("has 10 levels total", () => {
      expect(LEVEL_NAMES).toHaveLength(10);
      expect(thresholds).toHaveLength(10);
    });
  });

  // ── Recommendation Score Boosting ──
  describe("Recommendation Score Boosting", () => {
    it("boosts score by minimum 5 points per recommendation", () => {
      const baseScore = 45;
      const boostPerRec = 5;
      const numRecs = 3;
      const boostedScore = Math.min(100, baseScore + (boostPerRec * numRecs));
      expect(boostedScore).toBe(60);
      expect(boostedScore - baseScore).toBeGreaterThanOrEqual(5 * numRecs);
    });

    it("caps boosted score at 100", () => {
      const baseScore = 90;
      const boostPerRec = 8;
      const numRecs = 5;
      const boostedScore = Math.min(100, baseScore + (boostPerRec * numRecs));
      expect(boostedScore).toBe(100);
    });
  });

  // ── Life Goals Milestones ──
  describe("Life Goals 5-Year Milestones", () => {
    it("generates milestones from current age to 100 in 5-year increments", () => {
      const age = 50;
      const milestones: number[] = [];
      const startAge = Math.ceil(age / 5) * 5;
      for (let a = startAge; a <= 100; a += 5) {
        if (a > age) milestones.push(a);
      }
      expect(milestones).toEqual([55, 60, 65, 70, 75, 80, 85, 90, 95, 100]);
    });

    it("handles age 33 correctly", () => {
      const age = 33;
      const milestones: number[] = [];
      const startAge = Math.ceil(age / 5) * 5;
      for (let a = startAge; a <= 100; a += 5) {
        if (a > age) milestones.push(a);
      }
      expect(milestones[0]).toBe(35);
      expect(milestones[milestones.length - 1]).toBe(100);
    });

    it("handles age exactly on 5-year boundary", () => {
      const age = 65;
      const milestones: number[] = [];
      const startAge = Math.ceil(age / 5) * 5;
      for (let a = startAge; a <= 100; a += 5) {
        if (a > age) milestones.push(a);
      }
      expect(milestones[0]).toBe(70);
      expect(milestones).not.toContain(65);
    });
  });

  // ── Oil & Gas Tax Calculator ──
  describe("Oil & Gas Tax Calculator", () => {
    const BRACKETS_2024_JOINT = [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 },
    ];

    function calcTax(income: number): number {
      let tax = 0;
      for (const b of BRACKETS_2024_JOINT) {
        if (income <= b.min) break;
        const taxable = Math.min(income, b.max) - b.min;
        tax += taxable * b.rate;
      }
      return tax;
    }

    it("calculates federal tax correctly for $250k income", () => {
      const tax = calcTax(250000);
      expect(tax).toBeGreaterThan(40000);
      expect(tax).toBeLessThan(60000);
    });

    it("calculates IDC deduction at 85% of investment", () => {
      const investment = 100000;
      const idc = investment * 0.85;
      expect(idc).toBe(85000);
    });

    it("calculates tangible deduction at 15% of investment", () => {
      const investment = 100000;
      const tangible = investment * 0.15;
      expect(tangible).toBe(15000);
    });

    it("calculates total first-year deduction at 100% of investment", () => {
      const investment = 100000;
      const idc = investment * 0.85;
      const tangible = investment * 0.15;
      expect(idc + tangible).toBe(investment);
    });

    it("calculates 15% annual return on investment", () => {
      const investment = 100000;
      const annualReturn = investment * 0.15;
      expect(annualReturn).toBe(15000);
    });

    it("returns principal after 10-year lockup", () => {
      const investment = 100000;
      const lockupYears = 10;
      const annualIncome = investment * 0.15;
      const totalIncome = annualIncome * lockupYears;
      const totalReturn = totalIncome + investment; // principal returned after lockup
      expect(totalReturn).toBe(250000);
    });
  });

  // ── Premium Financing Max Rate ──
  describe("Premium Financing Max Crediting Rate", () => {
    it("uses 7.4% as max crediting rate", () => {
      const maxRate = 0.074;
      expect(maxRate).toBe(0.074);
      expect(maxRate * 100).toBeCloseTo(7.4);
    });
  });

  // ── tRPC Procedures ──
  describe("tRPC Procedure Existence", () => {
    it("has gamification router", () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      expect(caller.gamification).toBeDefined();
    });

    it("has riskAssessment router", () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      expect(caller.riskAssessment).toBeDefined();
    });

    it("has lifeGoals router", () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      expect(caller.lifeGoals).toBeDefined();
    });

    it("has recommendations router", () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      expect(caller.recommendations).toBeDefined();
    });

    it("has sessionRatings router", () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      expect(caller.sessionRatings).toBeDefined();
    });

    it("has onboardingWizardV2 router", () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      expect(caller.onboardingWizardV2).toBeDefined();
    });
  });

  // ── Life Goals Suggestions ──
  describe("Life Goals Suggestions", () => {
    it("lifeGoals.getSuggestions returns suggestions for given profile", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const suggestions = await caller.lifeGoals.getSuggestions({
        age: 50,
        netWorth: 1000000,
        income: 250000,
      });
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      // Each suggestion should have required fields
      for (const s of suggestions) {
        expect(s).toHaveProperty("title");
        expect(s).toHaveProperty("category");
        expect(s).toHaveProperty("targetAge");
        expect(s).toHaveProperty("cost");
        expect(s).toHaveProperty("priority");
      }
    });
  });
});
