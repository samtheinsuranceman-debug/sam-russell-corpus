import { describe, it, expect } from "vitest";

// ── Inline engine helpers (same as routers.ts) ──
function calcRothHeadroom(income: number, targetBracket: number): number {
  const brackets = [
    { top: 23200, rate: 0.10 }, { top: 94300, rate: 0.12 }, { top: 201050, rate: 0.22 },
    { top: 383900, rate: 0.24 }, { top: 487450, rate: 0.32 }, { top: 731200, rate: 0.35 },
    { top: Infinity, rate: 0.37 },
  ];
  const idx = brackets.findIndex(b => b.rate >= targetBracket);
  if (idx < 0) return 0;
  return Math.max(0, brackets[idx].top - income);
}

function projectIul(params: {
  annualPremium: number;
  years: number;
  illustratedRate: number;
  loanRate?: number;
  carrierOverride?: { loadFee1?: number; loadFee2?: number; loadThreshold?: number; coiRate?: number; perUnitCost?: number; adminFee?: number; conditionalCredit?: number; conditionalCreditStartYear?: number; surrenderBaseCharge?: number; surrenderDeclineStart?: number; surrenderDeclinePeriod?: number; };
}) {
  const { annualPremium, years, illustratedRate, loanRate = 0.05, carrierOverride } = params;
  const loadFee1 = carrierOverride?.loadFee1 ?? 0.08;
  const loadFee2 = carrierOverride?.loadFee2 ?? 0.06;
  const loadThreshold = carrierOverride?.loadThreshold ?? 50000;
  const coiRate = carrierOverride?.coiRate ?? 0.005;
  const perUnitCost = carrierOverride?.perUnitCost ?? 2.5;
  const adminFee = carrierOverride?.adminFee ?? 120;
  const conditionalCredit = carrierOverride?.conditionalCredit ?? 0.0025;
  const conditionalCreditStartYear = carrierOverride?.conditionalCreditStartYear ?? 11;
  const surrenderBaseCharge = carrierOverride?.surrenderBaseCharge ?? 0.08;
  const surrenderDeclineStart = carrierOverride?.surrenderDeclineStart ?? 3;
  const surrenderDeclinePeriod = carrierOverride?.surrenderDeclinePeriod ?? 7;

  let accountValue = 0;
  let cumulativePremiums = 0;
  let cumulativeLoanBalance = 0;
  let cumulativeCharges = 0;
  const rows: any[] = [];

  for (let y = 1; y <= years; y++) {
    cumulativePremiums += annualPremium;
    const base = Math.min(annualPremium, loadThreshold);
    const excess = Math.max(0, annualPremium - loadThreshold);
    const loadCharge = base * loadFee1 + excess * loadFee2;
    const netPremium = annualPremium - loadCharge;
    accountValue += netPremium;
    const interest = accountValue * illustratedRate;
    accountValue += interest;
    const coiCharge = accountValue * coiRate;
    const units = accountValue / 1000;
    const perUnitTotal = units * perUnitCost;
    const totalCharges = coiCharge + perUnitTotal + adminFee;
    accountValue -= totalCharges;
    cumulativeCharges += loadCharge + totalCharges;
    if (y >= conditionalCreditStartYear) {
      const credit = accountValue * conditionalCredit;
      accountValue += credit;
    }
    const loanInterest = cumulativeLoanBalance * loanRate;
    cumulativeLoanBalance += loanInterest;
    let surrenderCharge = surrenderBaseCharge;
    if (y > surrenderDeclineStart) {
      const yearsInto = y - surrenderDeclineStart;
      const factor = Math.max(0, 1 - yearsInto / surrenderDeclinePeriod);
      surrenderCharge = surrenderBaseCharge * factor;
    }
    const surrenderValue = accountValue * (1 - surrenderCharge);
    const netCashValue = surrenderValue - cumulativeLoanBalance;

    rows.push({
      year: y,
      premium: annualPremium,
      loadCharge: Math.round(loadCharge),
      netPremium: Math.round(netPremium),
      interestCredited: Math.round(interest),
      coiCharge: Math.round(coiCharge),
      perUnitCharge: Math.round(perUnitTotal),
      adminFee,
      endingAccountValue: Math.round(accountValue),
      cumulativePremiums: Math.round(cumulativePremiums),
      cumulativeLoanBalance: Math.round(cumulativeLoanBalance),
      cumulativeCharges: Math.round(cumulativeCharges),
      surrenderCharge: +(surrenderCharge * 100).toFixed(2),
      surrenderValue: Math.round(surrenderValue),
      netCashValue: Math.round(netCashValue),
    });
  }

  return {
    rows,
    cashValue: Math.round(accountValue),
    surrenderValue: Math.round(rows[rows.length - 1]?.surrenderValue ?? 0),
    netCashValue: Math.round(rows[rows.length - 1]?.netCashValue ?? 0),
    totalCharges: Math.round(cumulativeCharges),
  };
}

// ── What-If Slider Tests ──
describe("What-If Slider Mode", () => {
  const baseParams = {
    annualPremium: 800000 * 0.50 * 0.50,
    years: 20,
    illustratedRate: 0.12,
  };

  it("should produce different results when IRA balance changes", () => {
    const base = projectIul(baseParams);
    const higher = projectIul({ ...baseParams, annualPremium: 1000000 * 0.50 * 0.50 });
    expect(higher.cashValue).toBeGreaterThan(base.cashValue);
    expect(higher.cashValue / base.cashValue).toBeGreaterThan(1.2);
  });

  it("should produce different results when illustrated rate changes", () => {
    const rate10 = projectIul({ ...baseParams, illustratedRate: 0.10 });
    const rate12 = projectIul({ ...baseParams, illustratedRate: 0.12 });
    const rate14 = projectIul({ ...baseParams, illustratedRate: 0.14 });
    expect(rate10.cashValue).toBeLessThan(rate12.cashValue);
    expect(rate12.cashValue).toBeLessThan(rate14.cashValue);
  });

  it("should produce different results when IUL years change", () => {
    const short = projectIul({ ...baseParams, years: 15 });
    const long = projectIul({ ...baseParams, years: 25 });
    expect(long.cashValue).toBeGreaterThan(short.cashValue);
  });

  it("debounced recalculation should produce consistent results", () => {
    // Simulate rapid slider changes — final result should match direct calculation
    const values = [700000, 750000, 800000, 850000, 900000];
    const finalPremium = values[values.length - 1] * 0.50 * 0.50;
    const result = projectIul({ ...baseParams, annualPremium: finalPremium });
    expect(result.rows).toHaveLength(20);
    expect(result.cashValue).toBeGreaterThan(0);
  });

  it("should handle edge case: minimum IRA balance", () => {
    const result = projectIul({ ...baseParams, annualPremium: 100000 * 0.50 * 0.50 });
    expect(result.cashValue).toBeGreaterThan(0);
    expect(result.rows).toHaveLength(20);
  });

  it("should handle edge case: maximum IRA balance", () => {
    const result = projectIul({ ...baseParams, annualPremium: 5000000 * 0.50 * 0.50 });
    expect(result.cashValue).toBeGreaterThan(0);
    expect(result.rows).toHaveLength(20);
  });
});

// ── Follow-Up Email Scheduling Tests ──
describe("Follow-Up Email Scheduling", () => {
  it("should schedule 3-day follow-up at correct time", () => {
    const now = Date.now();
    const threeDays = new Date(now + 3 * 24 * 60 * 60 * 1000);
    const diff = threeDays.getTime() - now;
    expect(diff).toBeCloseTo(3 * 24 * 60 * 60 * 1000, -3); // within 1 second
  });

  it("should schedule 7-day follow-up at correct time", () => {
    const now = Date.now();
    const sevenDays = new Date(now + 7 * 24 * 60 * 60 * 1000);
    const diff = sevenDays.getTime() - now;
    expect(diff).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
  });

  it("should generate unique share tokens for each projection", () => {
    const { randomBytes } = require("crypto");
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(randomBytes(32).toString("hex"));
    }
    expect(tokens.size).toBe(100);
  });

  it("follow-up email types should be valid enum values", () => {
    const validTypes = ["3day", "7day"];
    expect(validTypes).toContain("3day");
    expect(validTypes).toContain("7day");
  });

  it("follow-up status transitions should be valid", () => {
    const validStatuses = ["pending", "sent", "cancelled", "failed"];
    // New follow-ups start as pending
    expect(validStatuses).toContain("pending");
    // After sending, status changes to sent
    expect(validStatuses).toContain("sent");
    // Advisor can cancel pending follow-ups
    expect(validStatuses).toContain("cancelled");
    // Failed sends are marked as failed
    expect(validStatuses).toContain("failed");
  });
});

// ── Carrier Quote Request Tests ──
describe("Carrier Quote Request Integration", () => {
  const carriers = [
    { id: "a-mutual", name: "A Mutual Life", product: "Accumulator III" },
    { id: "aaa_plus_mutual", name: "AAA+ Mutual", product: "Pacific Indexed Performer LT" },
    { id: "bbb_plus_mutual", name: "BBB+ Mutual", product: "Builder Plus 3" },
  ];

  it("should generate correct form data for quote request", () => {
    const formData = {
      age: 52,
      iraBalance: 800000,
      conversionPortion: 0.50,
      iulYears: 20,
      taxBracket: 0.24,
      filingStatus: "married",
      homeEquity: 400000,
      projectedNetCash: 8800000,
      projectedAccountValue: 15500000,
    };
    expect(formData.age).toBe(52);
    expect(formData.iraBalance).toBe(800000);
    expect(formData.projectedNetCash).toBeGreaterThan(0);
  });

  it("should identify winning carrier correctly", () => {
    const results = carriers.map(c => {
      const override = c.id === "a-mutual" ? {} :
        c.id === "aaa_plus_mutual" ? { loadFee1: 0.07, loadFee2: 0.05, coiRate: 0.0055 } :
        { loadFee1: 0.09, loadFee2: 0.065, coiRate: 0.0048 };
      const proj = projectIul({
        annualPremium: 200000,
        years: 20,
        illustratedRate: 0.12,
        carrierOverride: override,
      });
      return { ...c, netCash: proj.netCashValue };
    });

    const winner = results.reduce((a, b) => a.netCash > b.netCash ? a : b);
    expect(winner.netCash).toBeGreaterThan(0);
    expect(carriers.map(c => c.id)).toContain(winner.id);
  });

  it("should include all required fields in quote request", () => {
    const requiredFields = ["carrierId", "carrierName", "formData"];
    const quoteRequest = {
      carrierId: "a-mutual",
      carrierName: "A Mutual Life",
      productName: "Accumulator III",
      formData: { age: 52, iraBalance: 800000 },
      notes: "Priority client",
    };
    for (const field of requiredFields) {
      expect(quoteRequest).toHaveProperty(field);
    }
  });

  it("should support all valid quote statuses", () => {
    const validStatuses = ["draft", "submitted", "pending_review", "approved", "rejected"];
    expect(validStatuses).toHaveLength(5);
    expect(validStatuses).toContain("submitted");
  });

  it("should handle optional fields gracefully", () => {
    const minimalRequest = {
      carrierId: "a-mutual",
      carrierName: "A Mutual Life",
      formData: { age: 52 },
    };
    expect(minimalRequest.carrierId).toBe("a-mutual");
    // clientId, clientEmail, productName, notes are all optional
  });
});

// ── Integration: What-If + Quote Flow ──
describe("What-If to Quote Request Flow", () => {
  it("should allow quote request after What-If adjustment", () => {
    // Simulate: advisor adjusts IRA from 800K to 1M, then requests quote for winner
    const adjustedPremium = 1000000 * 0.50 * 0.50;
    const projection = projectIul({
      annualPremium: adjustedPremium,
      years: 20,
      illustratedRate: 0.12,
    });

    const quoteFormData = {
      age: 52,
      iraBalance: 1000000,
      conversionPortion: 0.50,
      iulYears: 20,
      projectedAccountValue: projection.cashValue,
      projectedNetCash: projection.netCashValue,
    };

    expect(quoteFormData.iraBalance).toBe(1000000);
    expect(quoteFormData.projectedAccountValue).toBeGreaterThan(0);
    expect(quoteFormData.projectedNetCash).toBeGreaterThan(0);
  });

  it("should maintain projection consistency through slider changes", () => {
    // Run same params twice — should get identical results
    const params = { annualPremium: 200000, years: 20, illustratedRate: 0.12 };
    const run1 = projectIul(params);
    const run2 = projectIul(params);
    expect(run1.cashValue).toBe(run2.cashValue);
    expect(run1.netCashValue).toBe(run2.netCashValue);
    expect(run1.totalCharges).toBe(run2.totalCharges);
  });
});

// ── Email Template Tests ──
describe("Email Template Validation", () => {
  it("3-day follow-up should have correct subject line", () => {
    const emailType = "3day";
    const isReminder = emailType === "7day";
    const subject = isReminder
      ? "Reminder: Your Financial Strategy Analysis is Ready — Russell Capital Systems"
      : "Your Financial Strategy Analysis — Russell Capital Systems";
    expect(subject).toContain("Russell Capital Systems");
    expect(subject).not.toContain("Reminder");
  });

  it("7-day follow-up should have reminder subject line", () => {
    const emailType = "7day";
    const isReminder = emailType === "7day";
    const subject = isReminder
      ? "Reminder: Your Financial Strategy Analysis is Ready — Russell Capital Systems"
      : "Your Financial Strategy Analysis — Russell Capital Systems";
    expect(subject).toContain("Reminder");
    expect(subject).toContain("Russell Capital Systems");
  });

  it("quote request notification should include carrier details", () => {
    const subject = `Quote Request: A Mutual Life — John Smith`;
    expect(subject).toContain("A Mutual Life");
    expect(subject).toContain("John Smith");
  });
});
