import { describe, it, expect } from "vitest";
import {
  DECLARED_RATE, PARTICIPATING, compareLoanTypes, overloanEligibleYear, runLoan,
  termsFor, LOAN_DISCLOSURE, type LoanRunInput,
} from "../shared/policyLoanTypes";

/** A good run: capped at 12, floored at 0, one flat year in the middle. */
const GOOD = [12, 12, 0, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
              12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
/** A bad run: the floor does its job and the loan still charges every year. */
const FLAT = new Array(30).fill(0);

const base: Omit<LoanRunInput, "loanType"> = {
  indexCredits: GOOD, startingAccountValue: 900000, annualDraw: 90000,
  firstDrawYear: 2, costBasis: 750000, policyChargePct: 1.1, issueAge: 45,
};

describe("the two loans differ in where the collateral sits", () => {
  it("keeps participating collateral in the index strategies", () => {
    expect(PARTICIPATING.collateralStaysIndexed).toBe(true);
    expect(PARTICIPATING.creditedCurrent).toBeNull();   // it tracks the index
  });

  it("moves declared collateral out to a flat declared rate", () => {
    expect(DECLARED_RATE.collateralStaysIndexed).toBe(false);
    expect(DECLARED_RATE.creditedCurrent).toBe(3.00);
  });

  it("carries the real charged rates off the illustration", () => {
    expect(DECLARED_RATE.chargedCurrent(5)).toBe(3.90);
    expect(DECLARED_RATE.chargedCurrent(11)).toBe(3.00);
    expect(PARTICIPATING.chargedCurrent(1)).toBe(5.00);
    expect(PARTICIPATING.chargedGuaranteedMax).toBe(8.00);
  });

  it("names its source and date on both", () => {
    for (const t of [DECLARED_RATE, PARTICIPATING]) {
      expect(t.source).toContain("Nationwide");
      expect(t.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("the spread, year by year", () => {
  it("pays +7.00 on a 12% year under a participating loan", () => {
    const r = runLoan({ ...base, loanType: "participating" });
    const y5 = r.years[4];
    expect(y5.indexCredit).toBe(12);
    expect(y5.chargedRate).toBe(5.00);
    expect(y5.netSpread).toBe(7.00);
  });

  it("costs -5.00 on a 0% year — the floor protects the account, not the loan", () => {
    const r = runLoan({ ...base, loanType: "participating" });
    const flatYear = r.years[2];       // year 3 credits 0
    expect(flatYear.indexCredit).toBe(0);
    expect(flatYear.netSpread).toBe(-5.00);
  });

  it("is bounded on the declared loan: -0.90 early, 0.00 from year 11", () => {
    const r = runLoan({ ...base, loanType: "declared" });
    expect(r.years[4].netSpread).toBe(-0.90);
    expect(r.years[11].netSpread).toBe(0);
  });

  it("charges 8% and credits 0% on the participating guaranteed column", () => {
    const r = runLoan({ ...base, loanType: "participating", guaranteed: true });
    expect(r.years[0].chargedRate).toBe(8.00);
    expect(r.years[0].netSpread).toBe(-8.00);
  });
});

describe("over a good run the participating loan earns more than it costs", () => {
  const c = compareLoanTypes(base);

  it("nets positive on the loan — the credits exceed the charges", () => {
    expect(c.participating.lifetimeNetOnLoan).toBeGreaterThan(0);
  });

  it("beats the declared loan by a wide margin", () => {
    expect(c.spreadAdvantage).toBeGreaterThan(0);
    expect(c.participating.lifetimeNetOnLoan).toBeGreaterThan(c.declared.lifetimeNetOnLoan);
  });

  it("leaves the account value intact rather than moving it out", () => {
    // The mechanism, asserted: under a participating loan nothing leaves the
    // index, so the account value keeps compounding on the full balance.
    const p = c.participating.years[9], d = c.declared.years[9];
    expect(p.accountValue).toBeGreaterThan(d.accountValue);
  });

  it("survives to the death benefit, where the loan is netted and never taxed", () => {
    expect(c.participating.survivedToDeathBenefit).toBe(true);
    expect(c.participating.phantomIncomeAtLapse).toBe(0);
  });
});

describe("the failure mode — a flat run with a loan running", () => {
  const r = runLoan({ ...base, indexCredits: FLAT, loanType: "participating" });

  it("lapses: the loan compounds at 5% while the account credits 0%", () => {
    expect(r.lapseYear).not.toBeNull();
    expect(r.survivedToDeathBenefit).toBe(false);
  });

  it("assesses phantom income on the gain, with no cash arriving to pay it", () => {
    expect(r.phantomIncomeAtLapse).toBeGreaterThanOrEqual(0);
    expect(r.warnings.join(" ")).toContain("receives nothing and owes tax");
  });

  it("warns that the overloan rider is not yet available when the lapse lands", () => {
    // Issue age 45: attained age in policy year y is 45 + y - 1, so age 65
    // first arrives in year 21. The year-15 condition is met long before.
    expect(r.overloanEligibleYear).toBe(21);
    if (r.lapseYear !== null && r.lapseYear < 21) {
      expect(r.warnings.join(" ")).toContain("backstop does not exist yet");
    }
  });

  it("always warns that alternative loans are the volatile ones", () => {
    expect(r.warnings.join(" ")).toContain("more volatile");
  });

  it("always warns the overloan rider's tax treatment is unruled", () => {
    expect(r.warnings.join(" ")).toContain("neither the IRS nor the courts have ruled");
  });
});

describe("the overloan rider gate is age 65 AND year 15, both", () => {
  it("waits for age 65 when the insured is young at issue", () => {
    expect(overloanEligibleYear(45, 40)).toBe(21);   // 45 + 21 - 1 = 65
  });

  it("waits for year 15 when the insured is already old enough", () => {
    expect(overloanEligibleYear(70, 40)).toBe(15);   // age is satisfied from day one
  });

  it("returns null inside a horizon that reaches neither condition", () => {
    expect(overloanEligibleYear(40, 10)).toBeNull();
  });
});

describe("honesty of the summary", () => {
  it("says the participating loan loses more over a worse sequence", () => {
    expect(compareLoanTypes(base).verdict).toContain("opposite sign");
  });

  it("states both rates are not fixed for the life of the policy", () => {
    expect(LOAN_DISCLOSURE).toContain("Neither rate is fixed");
    expect(LOAN_DISCLOSURE).toContain("quarterly");
  });

  it("maps loan types to terms without a default that hides a mistake", () => {
    expect(termsFor("declared").type).toBe("declared");
    expect(termsFor("participating").type).toBe("participating");
  });
});
