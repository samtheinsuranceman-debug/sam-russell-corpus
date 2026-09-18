import { describe, it, expect } from "vitest";
import {
  creditedAmount,
  takeLoan,
  surrenderWouldCost,
  detectSurrender,
  checkLapseRisk,
  screenForMec,
  LOAN_STRATEGY_RULES,
  type PolicyYearState,
  type CarrierLoanTerms,
} from "../shared/policyLoanMechanics";

const NON_DIRECT: CarrierLoanTerms = {
  carrier: "Example Mutual",
  recognition: "nonDirect",
  loanInterestRate: 0.05,
  source: "Carrier policy loan provision, read 2026-09-16",
};

const DIRECT: CarrierLoanTerms = {
  carrier: "Example Stock",
  recognition: "direct",
  loanInterestRate: 0.05,
  creditedRateOnLoanedPortion: 0.02,
  source: "Carrier policy loan provision, read 2026-09-16",
};

const state = (over: Partial<PolicyYearState> = {}): PolicyYearState => ({
  year: 8,
  accountValue: 700_000,
  surrenderValue: 700_000,
  loanBalance: 0,
  basis: 700_000,
  ...over,
});

describe("crediting basis — the claim the strategy rests on", () => {
  it("non-direct-recognition credits the FULL account value even with a large loan", () => {
    // The inventor's example: $700k account value, 95% already loaned out,
    // 20% credit. At a non-direct carrier this is correct.
    const s = state({ loanBalance: 665_000 });
    const r = creditedAmount(s, 0.2, NON_DIRECT);
    expect(r.basis).toBe("full-account-value");
    expect(r.credited).toBe(140_000);
  });

  it("direct-recognition does NOT, and the difference is large", () => {
    const s = state({ loanBalance: 665_000 });
    const r = creditedAmount(s, 0.2, DIRECT);
    expect(r.basis).toBe("split");
    // 35,000 unloaned at 20% + 665,000 loaned at 2%
    expect(r.credited).toBe(35_000 * 0.2 + 665_000 * 0.02);
    expect(r.credited).toBeLessThan(creditedAmount(s, 0.2, NON_DIRECT).credited);
  });

  it("rejects a nonsensical index rate rather than producing a number", () => {
    expect(() => creditedAmount(state(), -0.1, NON_DIRECT)).toThrow(RangeError);
    expect(() => creditedAmount(state(), Number.NaN, NON_DIRECT)).toThrow(RangeError);
  });
});

describe("loans only — the strategy has one distribution", () => {
  it("a loan leaves the crediting base intact and raises the loan balance", () => {
    const after = takeLoan(state(), 100_000);
    expect(after.accountValue).toBe(700_000);
    expect(after.loanBalance).toBe(100_000);
    expect(after.basis).toBe(700_000);
  });

  it("repeated loans never touch the account value — this is the whole cycle", () => {
    let s = state();
    for (let y = 0; y < 7; y += 1) s = takeLoan(s, 95_000);
    expect(s.accountValue).toBe(700_000);
    expect(s.loanBalance).toBe(665_000);
    // 95% of the money has left and the credit still lands on the full figure.
    expect(creditedAmount(s, 0.2, NON_DIRECT).credited).toBe(140_000);
  });

  it("refuses a negative or non-finite loan", () => {
    expect(() => takeLoan(state(), -1)).toThrow(RangeError);
    expect(() => takeLoan(state(), Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("surrender — red flag only, never a path", () => {
  it("reports what a surrender would cost the crediting base, and why we never take one", () => {
    const r = surrenderWouldCost(state(), 665_000);
    expect(r.creditingBaseLost).toBe(665_000);
    expect(r.why).toContain("takes loans and never surrenders");
  });

  it("caps the reported loss at the account value rather than going negative", () => {
    expect(surrenderWouldCost(state(), 10_000_000).creditingBaseLost).toBe(700_000);
  });

  it("stays quiet when the account value holds or grows across a year", () => {
    const a = state({ year: 3, accountValue: 300_000 });
    const b = state({ year: 4, accountValue: 400_000 });
    expect(detectSurrender(a, b).suspected).toBe(false);
    expect(detectSurrender(a, { ...a, year: 4 }).suspected).toBe(false);
  });

  it("raises the flag when the account value falls, which a loan-only cycle cannot do", () => {
    const a = state({ year: 3, accountValue: 400_000 });
    const b = state({ year: 4, accountValue: 250_000 });
    const r = detectSurrender(a, b);
    expect(r.suspected).toBe(true);
    expect(r.drop).toBe(150_000);
    expect(r.message).toContain("does not fall");
    expect(r.message).toContain("Stop and check");
  });
});

describe("lapse risk — the failure mode that was invisible", () => {
  it("is quiet when the loan is small", () => {
    expect(checkLapseRisk(state({ loanBalance: 100_000 })).severity).toBe("none");
  });

  it("warns at 70% of surrender value", () => {
    expect(checkLapseRisk(state({ loanBalance: 490_000 })).severity).toBe("watch");
  });

  it("escalates at 90%, naming the 0% floor year as the trigger", () => {
    const r = checkLapseRisk(state({ loanBalance: 630_000 }));
    expect(r.severity).toBe("critical");
    expect(r.message).toContain("0% floor year");
  });

  it("reports lapse AND the tax owed on money already spent", () => {
    // Basis is low because premiums were recycled out years ago.
    const r = checkLapseRisk(state({ accountValue: 700_000, surrenderValue: 700_000, loanBalance: 720_000, basis: 300_000 }));
    expect(r.severity).toBe("lapsed");
    expect(r.taxableOnLapse).toBe(700_000 + 720_000 - 300_000);
    expect(r.message).toContain("not available to pay the tax");
  });

  it("treats a zero surrender value with any loan as lapsed, not as divide-by-zero", () => {
    const r = checkLapseRisk(state({ surrenderValue: 0, loanBalance: 1 }));
    expect(r.severity).toBe("lapsed");
    expect(Number.isFinite(r.loanToSurrender)).toBe(false);
  });
});

describe("MEC screen — the risk that deletes the strategy rather than weakening it", () => {
  it("flags an aggressive funding schedule and says why it matters", () => {
    const r = screenForMec(700_000, 1_000_000, 7);
    expect(r.isLikelyMec).toBe(true);
    expect(r.message).toContain("TAXABLE");
    expect(r.message).toContain("screening proxy");
  });

  it("passes a conservatively funded contract", () => {
    expect(screenForMec(100_000, 2_000_000, 3).isLikelyMec).toBe(false);
  });

  it("uses the carrier figure when one is supplied, and stops calling itself a proxy", () => {
    const r = screenForMec(700_000, 1_000_000, 7, 120_000);
    expect(r.sevenPayLimitApprox).toBe(840_000);
    expect(r.isLikelyMec).toBe(false);
    expect(r.message).not.toContain("screening proxy");
  });

  it("does not let policyYear run past seven", () => {
    expect(screenForMec(0, 1_000_000, 30).sevenPayLimitApprox)
      .toBe(screenForMec(0, 1_000_000, 7).sevenPayLimitApprox);
  });
});

describe("never-printed list", () => {
  it("forbids the four sentences that get people hurt", () => {
    const joined = LOAN_STRATEGY_RULES.neverPrinted.join(" ");
    expect(joined).toContain("free money");
    expect(joined).toContain("never surrenders");
    expect(joined).toContain("non-direct-recognition");
    expect(joined).toContain("MEC");
  });
});
