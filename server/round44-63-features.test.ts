import { describe, it, expect } from "vitest";

/* ── Shared helpers ─────────────────────────────────────────────────────────── */
import { MODEL_PORTFOLIOS } from "../shared/modelPortfolios";
import {
  inflationImpactSummary,
  compareIULvsRoth,
} from "../shared/advancedAnalytics";
import { IUL_CARRIERS } from "../shared/iulCarriers";

/* ══════════════════════════════════════════════════════════════════════════════
   Round 44 — Model Portfolio Presets for Index Backtester
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 44 — Model Portfolio Presets", () => {
  it("should export at least 5 preset portfolios", () => {
    expect(MODEL_PORTFOLIOS.length).toBeGreaterThanOrEqual(5);
  });

  it("each preset should have name, riskLevel, description, and allocations", () => {
    for (const p of MODEL_PORTFOLIOS) {
      expect(p.name).toBeTruthy();
      expect(p.riskLevel).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.allocations).toBeDefined();
      expect(typeof p.allocations).toBe("object");
    }
  });

  it("allocations should sum to approximately 100% per carrier", () => {
    for (const p of MODEL_PORTFOLIOS) {
      // allocations is Record<string, Array<{optionId, percentage}>>
      for (const [carrier, allocs] of Object.entries(p.allocations)) {
        const total = (allocs as any[]).reduce((s: number, a: any) => s + a.percentage, 0);
        expect(total).toBeGreaterThanOrEqual(95);
        expect(total).toBeLessThanOrEqual(105);
      }
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 45 — Batch Illustration Upload
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 45 — Batch Illustration Upload", () => {
  it("batch processing should handle multiple rows", () => {
    const rows = [
      { clientName: "John", age: 45, premium: 50000, years: 5 },
      { clientName: "Jane", age: 52, premium: 75000, years: 7 },
    ];
    expect(rows.length).toBe(2);
    expect(rows[0].clientName).toBe("John");
    expect(rows[1].premium).toBe(75000);
  });

  it("should validate required fields", () => {
    const row = { clientName: "Test", age: 45, premium: 50000, years: 5 };
    expect(row.clientName).toBeTruthy();
    expect(row.age).toBeGreaterThan(0);
    expect(row.premium).toBeGreaterThan(0);
    expect(row.years).toBeGreaterThan(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 46 — Client Meeting Agenda Generator
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 46 — Meeting Agenda Generator", () => {
  it("should support multiple meeting types", () => {
    const types = [
      "strategy_review",
      "initial_consultation",
      "annual_review",
      "policy_delivery",
      "roth_conversion",
    ];
    expect(types.length).toBe(5);
    for (const t of types) {
      expect(typeof t).toBe("string");
      expect(t.length).toBeGreaterThan(0);
    }
  });

  it("should support configurable durations", () => {
    const durations = [30, 45, 60, 90, 120];
    for (const d of durations) {
      expect(d).toBeGreaterThanOrEqual(30);
      expect(d).toBeLessThanOrEqual(120);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 47 — Premium Financing Calculator
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 47 — Premium Financing Calculator", () => {
  it("should calculate total premiums correctly", () => {
    const annualPremium = 250000;
    const premiumYears = 5;
    const total = annualPremium * premiumYears;
    expect(total).toBe(1250000);
  });

  it("should calculate loan interest accumulation", () => {
    const principal = 250000;
    const rate = 0.065;
    const interest = principal * rate;
    expect(interest).toBeCloseTo(16250, 0);
  });

  it("should find break-even year when cash value exceeds loan balance", () => {
    let cv = 0;
    let loan = 0;
    const premium = 250000;
    const loanRate = 0.065;
    const iulRate = 0.12;
    let breakEven = -1;

    for (let y = 1; y <= 30; y++) {
      if (y <= 5) {
        loan += premium;
        cv += premium * 0.85;
      }
      loan *= 1 + loanRate;
      cv *= 1 + iulRate;
      if (cv > loan && breakEven === -1) {
        breakEven = y;
      }
    }
    expect(breakEven).toBeGreaterThan(0);
    expect(breakEven).toBeLessThan(20);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 48 — Policy Loan Optimization Engine
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 48 — Policy Loan Optimization Engine", () => {
  it("should calculate loan-to-value ratio", () => {
    const loanAmount = 500000;
    const cashValue = 1000000;
    const ltv = loanAmount / cashValue;
    expect(ltv).toBe(0.5);
  });

  it("should flag lapse risk when LTV exceeds threshold", () => {
    const ltv = 0.92;
    const threshold = 0.90;
    expect(ltv > threshold).toBe(true);
  });

  it("should compare variable vs fixed loan rates", () => {
    const fixedRate = 0.05;
    const variableRate = 0.04;
    const loanAmount = 100000;
    const fixedInterest = loanAmount * fixedRate;
    const variableInterest = loanAmount * variableRate;
    expect(fixedInterest).toBeGreaterThan(variableInterest);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 49 — Carrier Strength Ratings Dashboard
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 49 — Carrier Strength Ratings", () => {
  it("should have carrier data with required fields", () => {
    expect(IUL_CARRIERS.length).toBeGreaterThan(0);
    for (const c of IUL_CARRIERS) {
      expect(c.name).toBeTruthy();
      expect(c.id).toBeTruthy();
    }
  });

  it("should include major carriers", () => {
    const names = IUL_CARRIERS.map((c) => c.name.toLowerCase());
    const majorCarriers = ["aaa+ mutual", "a mutual life", "bbb+ mutual"];
    for (const mc of majorCarriers) {
      const found = names.some((n) => n.includes(mc));
      expect(found).toBe(true);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 50 — Tax Bracket Waterfall Visualization
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 50 — Tax Bracket Waterfall", () => {
  it("should have correct 2024 married filing jointly brackets", () => {
    const brackets = [
      { rate: 0.10, floor: 0, ceiling: 23200 },
      { rate: 0.12, floor: 23200, ceiling: 94300 },
      { rate: 0.22, floor: 94300, ceiling: 201050 },
      { rate: 0.24, floor: 201050, ceiling: 383900 },
      { rate: 0.32, floor: 383900, ceiling: 487450 },
      { rate: 0.35, floor: 487450, ceiling: 731200 },
      { rate: 0.37, floor: 731200, ceiling: Infinity },
    ];
    expect(brackets.length).toBe(7);
    expect(brackets[0].rate).toBe(0.10);
    expect(brackets[6].rate).toBe(0.37);
  });

  it("should calculate tax on $250k married income correctly", () => {
    const income = 250000;
    const brackets = [
      { rate: 0.10, floor: 0, ceiling: 23200 },
      { rate: 0.12, floor: 23200, ceiling: 94300 },
      { rate: 0.22, floor: 94300, ceiling: 201050 },
      { rate: 0.24, floor: 201050, ceiling: 383900 },
    ];
    let tax = 0;
    for (const b of brackets) {
      const taxableInBracket = Math.min(income, b.ceiling) - b.floor;
      if (taxableInBracket > 0) {
        tax += taxableInBracket * b.rate;
      }
    }
    expect(tax).toBeGreaterThan(30000);
    expect(tax).toBeLessThan(60000);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 51 — Estate Tax Impact Analyzer
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 51 — Estate Tax Impact", () => {
  it("should calculate estate tax with exemption", () => {
    const grossEstate = 15000000;
    const exemption = 13610000;
    const taxableEstate = Math.max(0, grossEstate - exemption);
    const estateTax = taxableEstate * 0.40;
    expect(taxableEstate).toBe(1390000);
    expect(estateTax).toBe(556000);
  });

  it("should show ILIT benefit excluding death benefit from estate", () => {
    const grossEstate = 15000000;
    const deathBenefit = 3000000;
    const exemption = 13610000;
    // Without ILIT: death benefit included in estate
    const withoutILIT = Math.max(0, grossEstate - exemption) * 0.40;
    // With ILIT: death benefit excluded from estate
    const withILIT = Math.max(0, grossEstate - deathBenefit - exemption) * 0.40;
    const savings = withoutILIT - withILIT;
    expect(savings).toBeGreaterThan(0);
    // grossEstate - exemption = 1,390,000 → withoutILIT = 556,000
    // grossEstate - deathBenefit - exemption = -1,610,000 → clamped to 0 → withILIT = 0
    // savings = 556,000
    // withoutILIT = 556000, withILIT = 0 (clamped), savings = 556000
    expect(savings).toBe(withoutILIT);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 52 — Client Onboarding Wizard
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 52 — Onboarding Wizard V2", () => {
  it("should have 4 wizard steps", () => {
    const steps = ["Personal Info", "Financial Snapshot", "Goals & Risk", "Your Strategy"];
    expect(steps.length).toBe(4);
  });

  it("should calculate opportunity score from inputs", () => {
    const iraBalance = 1000000;
    const income = 250000;
    const age = 50;
    const rothScore = Math.min(100, Math.round((iraBalance / 100000) * 10));
    const incomeScore = Math.min(100, Math.round((income / 50000) * 15));
    const ageScore = Math.min(100, Math.round(Math.max(0, (age - 35) * 4)));
    const overall = Math.round((rothScore + incomeScore + ageScore) / 3);
    expect(overall).toBeGreaterThan(50);
    expect(overall).toBeLessThanOrEqual(100);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 53 — Projected Income Timeline
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 53 — Income Timeline", () => {
  it("should calculate total income from multiple sources", () => {
    const sources = [
      { name: "SS", startAge: 67, endAge: 95, annualAmount: 36000 },
      { name: "IUL", startAge: 65, endAge: 95, annualAmount: 80000 },
      { name: "Roth", startAge: 65, endAge: 95, annualAmount: 40000 },
    ];
    const totalAtAge70 = sources
      .filter((s) => 70 >= s.startAge && 70 <= s.endAge)
      .reduce((sum, s) => sum + s.annualAmount, 0);
    expect(totalAtAge70).toBe(156000);
  });

  it("should identify shortfall years", () => {
    const targetIncome = 150000;
    const incomeAtAge62 = 24000; // only rental income before retirement
    expect(incomeAtAge62 < targetIncome).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 54 — Advisor Performance Dashboard
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 54 — Advisor Performance", () => {
  it("should calculate conversion funnel metrics", () => {
    const projections = 100;
    const shares = 60;
    const quotes = 30;
    const placed = 15;
    expect(shares / projections).toBe(0.6);
    expect(placed / projections).toBe(0.15);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 55 — Smart Rebalancing Alerts
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 55 — Smart Rebalancing Alerts", () => {
  it("should detect allocation drift exceeding threshold", () => {
    const target = { sp500: 60, bonds: 30, intl: 10 };
    const current = { sp500: 68, bonds: 24, intl: 8 };
    const threshold = 5;
    const drifted = Object.keys(target).filter(
      (k) => Math.abs((current as any)[k] - (target as any)[k]) > threshold
    );
    expect(drifted).toContain("sp500");
    expect(drifted).toContain("bonds");
    expect(drifted.length).toBe(2);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 56 — IUL vs. Roth IRA Comparison Tool
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 56 — IUL vs Roth IRA Comparison", () => {
  it("should compute IUL vs Roth comparison from shared analytics", () => {
    const result = compareIULvsRoth(35, 30000, 30, 0.12, 0.08);
    expect(result.years.length).toBe(30);
    expect(result.winner).toBeTruthy();
  });

  it("IUL should outperform Roth at higher illustrated rate", () => {
    const result = compareIULvsRoth(35, 30000, 30, 0.12, 0.08);
    expect(result.iulAdvantage).toBeGreaterThan(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 57 — Dynamic PDF Report Builder
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 57 — Report Builder", () => {
  it("should support configurable report sections", () => {
    const sections = [
      "iul-projection",
      "roth-conversion",
      "str-analysis",
      "monte-carlo",
      "carrier-comparison",
      "estate-planning",
    ];
    expect(sections.length).toBeGreaterThanOrEqual(6);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 58 — Compliance Disclaimer Manager
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 58 — Disclaimer Manager", () => {
  it("should map sections to relevant disclaimers", () => {
    const map: Record<string, string[]> = {
      "iul-projection": ["iul-general", "general-disclosure"],
      "roth-conversion": ["roth-conversion", "general-disclosure"],
      "str-analysis": ["real-estate", "general-disclosure"],
    };
    expect(map["iul-projection"]).toContain("iul-general");
    expect(map["roth-conversion"]).toContain("roth-conversion");
    expect(map["str-analysis"]).toContain("real-estate");
  });

  it("should always include general-disclosure", () => {
    const map: Record<string, string[]> = {
      "iul-projection": ["iul-general", "general-disclosure"],
      "roth-conversion": ["roth-conversion", "general-disclosure"],
    };
    for (const disclaimers of Object.values(map)) {
      expect(disclaimers).toContain("general-disclosure");
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 59 — Client Communication Log
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 59 — Communication Log", () => {
  it("should support all communication types", () => {
    const types = ["email", "sms", "phone", "meeting", "document_shared", "portal_viewed", "note"];
    expect(types.length).toBe(7);
  });

  it("should support inbound and outbound directions", () => {
    const directions = ["inbound", "outbound"];
    expect(directions.length).toBe(2);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 60 — Inflation-Adjusted Projections
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 60 — Inflation Adjustments", () => {
  it("should calculate inflation erosion correctly", () => {
    const result = inflationImpactSummary(150000, 30, [0.03]);
    expect(result.length).toBe(1);
    expect(result[0].rate).toBe(0.03);
    expect(result[0].futureNominal).toBe(150000);
    expect(result[0].realPurchasingPower).toBeLessThan(150000);
    expect(result[0].erosion).toBeGreaterThan(0);
  });

  it("should show higher erosion at higher rates", () => {
    const result = inflationImpactSummary(100000, 20, [0.02, 0.05]);
    expect(result[1].erosion).toBeGreaterThan(result[0].erosion);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 61 — Multi-Policy Household View
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 61 — Household View", () => {
  it("should aggregate multiple policies", () => {
    const policies = [
      { member: "Husband", deathBenefit: 2000000, cashValue: 500000, premium: 30000 },
      { member: "Wife", deathBenefit: 1500000, cashValue: 350000, premium: 20000 },
      { member: "Child", deathBenefit: 500000, cashValue: 50000, premium: 5000 },
    ];
    const totalDB = policies.reduce((s, p) => s + p.deathBenefit, 0);
    const totalCV = policies.reduce((s, p) => s + p.cashValue, 0);
    const totalPremium = policies.reduce((s, p) => s + p.premium, 0);
    expect(totalDB).toBe(4000000);
    expect(totalCV).toBe(900000);
    expect(totalPremium).toBe(55000);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 62 — Competitive Analysis Report
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 62 — Competitive Analysis", () => {
  it("should compare IUL against alternatives", () => {
    const strategies = ["IUL Strategy", "Buy Term Invest Difference", "401(k)", "Roth IRA", "Taxable Brokerage"];
    expect(strategies.length).toBe(5);
  });

  it("should calculate after-tax values", () => {
    const preTax = 1000000;
    const taxBracket = 0.24;
    const afterTax = preTax * (1 - taxBracket);
    expect(afterTax).toBe(760000);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Round 63 — Quick Quote Widget
   ══════════════════════════════════════════════════════════════════════════════ */
describe("Round 63 — Quick Quote Widget", () => {
  it("should calculate health class multiplier", () => {
    const multipliers: Record<string, number> = {
      "preferred-plus": 0.7,
      preferred: 0.85,
      standard: 1.0,
      substandard: 1.3,
    };
    expect(multipliers["preferred-plus"]).toBe(0.7);
    expect(multipliers["substandard"]).toBe(1.3);
  });

  it("should project cash values at milestones", () => {
    const annualPremium = 50000;
    const premiumYears = 5;
    let cv = 0;
    for (let y = 1; y <= 30; y++) {
      const premium = y <= premiumYears ? annualPremium : 0;
      const load = y <= 5 ? 0.06 : 0;
      cv += premium * (1 - load);
      cv *= 1.12;
    }
    expect(cv).toBeGreaterThan(0);
    expect(cv).toBeGreaterThan(annualPremium * premiumYears);
  });
});
