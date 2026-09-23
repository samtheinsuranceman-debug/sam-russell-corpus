import { describe, it, expect } from "vitest";
import {
  CREDIT_LINE_RULES,
  ISSUER_RULES,
  RULES_VERSION,
  assessSuitability,
  getDefaultCreditLineInput,
  runCreditLineSequence,
  summarizeCreditLine,
  type CreditLineInput,
} from "../shared/creditLineSequencingEngine";

function run(overrides: Partial<CreditLineInput> = {}) {
  return runCreditLineSequence({ ...getDefaultCreditLineInput(), ...overrides });
}

describe("rules table", () => {
  it("every rule carries a source and an as-of date, and issuer policies are all flagged unverified", () => {
    for (const [k, v] of Object.entries(CREDIT_LINE_RULES)) {
      if (k === "rulesVersion") continue;
      const s = v as { source: string; asOf: string; verified: boolean };
      expect(s.source.length, k).toBeGreaterThan(10);
      expect(s.asOf, k).toMatch(/^\d{4}-\d{2}/);
    }
    for (const r of ISSUER_RULES) {
      expect(r.verified).toBe(false);
      expect(r.source).toContain("Confirm with the issuer");
      expect(r.introPurchaseAprMonths).toBeGreaterThanOrEqual(12);
      expect(r.introPurchaseAprMonths).toBeLessThanOrEqual(21);
    }
    expect(RULES_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("cash advances are never a route", () => {
    const r = run();
    expect(r.routes.map(x => x.route)).not.toContain("cash_advance");
  });
});

describe("suitability gate", () => {
  it("the default household is suitable", () => {
    const s = assessSuitability(getDefaultCreditLineInput());
    expect(s.suitable).toBe(true);
    expect(s.score).toBe(100);
  });

  it("prints nothing when a check fails: no lines, no routes, no comparison", () => {
    for (const bad of [
      { fico: 690 },
      { emergencyFundMonths: 2 },
      { latePaymentsLast24Months: 1 },
      { mortgageApplicationInMonths: 6 },
      { monthlyDebtPayments: 20_000 },
      { existingRevolvingBalance: 30_000 },
    ] as Partial<CreditLineInput>[]) {
      const r = run(bad);
      expect(r.suitability.suitable, JSON.stringify(bad)).toBe(false);
      expect(r.lines).toEqual([]);
      expect(r.routes).toEqual([]);
      expect(r.comparison).toBeNull();
      expect(r.risks[0].severity).toBe("high");
    }
  });

  it("a mortgage planned beyond the blackout window is allowed", () => {
    expect(run({ mortgageApplicationInMonths: 18 }).suitability.suitable).toBe(true);
  });
});

describe("sequencing under velocity rules", () => {
  it("opens at most one card a month and never the same issuer twice", () => {
    const r = run();
    const months = r.lines.map(l => l.openedMonth);
    expect(new Set(months).size).toBe(months.length);
    const issuers = r.lines.map(l => l.issuer);
    expect(new Set(issuers).size).toBe(issuers.length);
    expect(r.lines.length).toBeGreaterThanOrEqual(3);
    expect(r.lines.length).toBeLessThanOrEqual(6);
  });

  it("approaches the 5/24-style issuer first", () => {
    const r = run();
    expect(r.lines[0].issuer).toBe("chase");
  });

  it("skips the 5/24-style issuer when the household already has five recent openings", () => {
    const r = run({ recentCardOpenings: [2, 5, 9, 14, 20] });
    expect(r.lines.some(l => l.issuer === "chase")).toBe(false);
    expect(r.lines.length).toBeGreaterThan(0);
  });

  it("every promo ends inside the horizon and every line is cleared one month before it", () => {
    const r = run({ horizonMonths: 24 });
    for (const l of r.lines) {
      expect(l.promoEndsMonth).toBeLessThanOrEqual(24);
      expect(l.clearedMonth).toBe(l.promoEndsMonth - 1);
      expect(l.monthlyPayoff * (l.clearedMonth - l.openedMonth)).toBeCloseTo(l.deployed, 0);
    }
  });

  it("issues a credit-line-increase request and a move-to-next-issuer note for each opened card", () => {
    const r = run();
    const applies = r.calendar.filter(e => e.kind === "apply");
    const clis = r.calendar.filter(e => e.kind === "cli_request");
    expect(applies.length).toBe(r.lines.length);
    expect(clis.length).toBeGreaterThan(0);
    for (const c of clis) expect(c.hardInquiry).toBe(false);
    for (const a of applies) expect(a.hardInquiry).toBe(true);
    expect(r.totals.hardInquiries).toBe(applies.length);
  });

  it("is deterministic", () => {
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });
});

describe("routes and deployment", () => {
  it("cheapest routes are used first and total deployment never exceeds the aggregate limit or the premium target", () => {
    const r = run({ targetAnnualPremium: 100_000, horizonMonths: 24 });
    const used = r.routes.filter(x => x.available && x.grossCapacity > 0);
    for (let i = 1; i < used.length; i++) expect(used[i].feeRate).toBeGreaterThanOrEqual(used[i - 1].feeRate);
    expect(r.totals.deployableGross).toBeLessThanOrEqual(r.totals.aggregateLimit + 1);
    expect(r.totals.deployableGross).toBeLessThanOrEqual(200_000 + 1);
    expect(r.totals.deployableNet).toBeCloseTo(r.totals.deployableGross - r.totals.fees, 2);
  });

  it("direct premium by card is unavailable unless the household confirms the carrier accepts it", () => {
    expect(run().routes.find(x => x.route === "premium_by_card")?.available).toBe(false);
    expect(run({ carrierAcceptsCard: true }).routes.find(x => x.route === "premium_by_card")?.available).toBe(true);
  });

  it("a household with no movable spend cannot use cash-flow substitution", () => {
    const r = run({ movableSpendShare: 0 });
    expect(r.routes.find(x => x.route === "cash_flow_substitution")?.available).toBe(false);
  });
});

describe("cash flow, comparison and risks", () => {
  it("flags infeasibility when the payoff exceeds the monthly surplus", () => {
    const r = run({ monthlyExpenses: 28_000, monthlyDebtPayments: 6_000 });
    if (r.suitability.suitable) {
      expect(r.comparison?.cashFlowFeasible).toBe(false);
      expect(r.risks.some(k => k.title.includes("Payoff exceeds"))).toBe(true);
    }
  });

  it("the default plan is feasible and the surplus never goes negative", () => {
    const r = run();
    expect(r.comparison?.cashFlowFeasible).toBe(true);
    for (const m of r.months) expect(m.cashFlowSurplus).toBeGreaterThanOrEqual(0);
  });

  it("break-even crediting rate is the rate at which policy value equals the capital placed", () => {
    const r = run();
    const c = r.comparison!;
    const netPremium = r.totals.deployableNet * (1 - CREDIT_LINE_RULES.policyLoadOnPremium.value);
    const years = r.months.length / 12 / 2;
    expect(netPremium * Math.pow(1 + c.breakEvenCreditingRate, years)).toBeCloseTo(c.premiumPlaced, 0);
  });

  it("always warns that promo end is a cliff and that this is not free money", () => {
    const r = run();
    expect(r.risks.some(k => k.title === "Promo end is a cliff")).toBe(true);
    expect(r.risks.some(k => k.title === "This is not free money")).toBe(true);
    expect(r.risks.some(k => k.title === "Issuer rules are unverified")).toBe(true);
  });

  it("provenance lists every issuer as unverified and names the verified score rules", () => {
    const r = run();
    for (const i of ISSUER_RULES) expect(r.provenance.unverifiedRules).toContain(`issuer:${i.id}`);
    expect(r.provenance.verifiedRules).toContain("hardInquiryPointsEach");
    expect(r.provenance.verifiedRules).toContain("utilizationWarnAbove");
    expect(r.provenance.rulesVersion).toBe(RULES_VERSION);
  });

  it("summary for the hub carries the headline numbers", () => {
    const s = summarizeCreditLine(run());
    expect(s.suitable).toBe(true);
    expect(typeof s.deployableNet).toBe("number");
    expect(s.rulesVersion).toBe(RULES_VERSION);
  });
});
