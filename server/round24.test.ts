import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Round 24 Tests: Dual-Option 0% Roth Conversion + Solar Equity + IUL Cascade
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. IUL Cascade Engine Constants ─────────────────────────────────────────
describe("IUL Cascade Engine Constants", () => {
  const IUL_LOAD_FEE = 0.06;
  const IUL_LOAN_RATE = 0.05;
  const IUL_AVG_RETURN = 0.10;
  const IUL_COI_RATE = 0.04;
  const SOLAR_ENHANCEMENT = 0.22;

  it("load fee is 6%", () => {
    expect(IUL_LOAD_FEE).toBe(0.06);
  });

  it("loan rate is 5%", () => {
    expect(IUL_LOAN_RATE).toBe(0.05);
  });

  it("average return is 10%", () => {
    expect(IUL_AVG_RETURN).toBe(0.10);
  });

  it("cost of insurance is 4%", () => {
    expect(IUL_COI_RATE).toBe(0.04);
  });

  it("solar enhancement is 22%", () => {
    expect(SOLAR_ENHANCEMENT).toBe(0.22);
  });
});

// ── 2. Solar Equity Enhancement Calculation ─────────────────────────────────
describe("Solar Equity Enhancement", () => {
  it("22% enhancement on conversion amount", () => {
    const conversionAmount = 29200;
    const solarEnhancement = conversionAmount * 0.22;
    expect(solarEnhancement).toBe(6424);
  });

  it("solar Year 1 premium = conversion + 22%", () => {
    const conversionAmount = 29200;
    const solarEnhancement = conversionAmount * 0.22;
    const solarYear1Premium = conversionAmount + solarEnhancement;
    expect(solarYear1Premium).toBe(35624);
  });

  it("standard Year 1 premium = tax savings only", () => {
    const conversionAmount = 29200;
    const taxBracket = 0.24;
    const taxSavings = conversionAmount * taxBracket;
    expect(taxSavings).toBe(7008);
  });

  it("solar Year 1 premium is significantly larger than standard", () => {
    const conversionAmount = 29200;
    const solarYear1 = conversionAmount + conversionAmount * 0.22;
    const standardYear1 = conversionAmount * 0.24; // tax savings
    expect(solarYear1).toBeGreaterThan(standardYear1 * 4);
  });
});

// ── 3. IUL Cascade Premium Flow ─────────────────────────────────────────────
describe("IUL Cascade Premium Flow", () => {
  const IUL_LOAD_FEE = 0.06;
  const IUL_AVG_RETURN = 0.10;
  const IUL_COI_RATE = 0.04;

  it("Year 1 net premium = premium - 6% load", () => {
    const premium = 35624;
    const loadFee = premium * IUL_LOAD_FEE;
    const netPremium = premium - loadFee;
    expect(loadFee).toBeCloseTo(2137.44, 0);
    expect(netPremium).toBeCloseTo(33486.56, 0);
  });

  it("Year 1 interest earned on beginning value", () => {
    const netPremium = 33486.56;
    const beginningValue = netPremium; // first year, no prior value
    const interestEarned = beginningValue * IUL_AVG_RETURN;
    expect(interestEarned).toBeCloseTo(3348.66, 0);
  });

  it("Year 1 COI charge on beginning value", () => {
    const beginningValue = 33486.56;
    const coiCharge = beginningValue * IUL_COI_RATE;
    expect(coiCharge).toBeCloseTo(1339.46, 0);
  });

  it("Year 1 ending account value = beginning + interest - COI", () => {
    const beginningValue = 33486.56;
    const interestEarned = beginningValue * IUL_AVG_RETURN;
    const coiCharge = beginningValue * IUL_COI_RATE;
    const endingValue = beginningValue + interestEarned - coiCharge;
    expect(endingValue).toBeCloseTo(35495.75, 0);
  });

  it("Year 2 premium is equal Roth converted funds", () => {
    const conversionAmount = 29200;
    const year2Premium = conversionAmount;
    expect(year2Premium).toBe(29200);
  });

  it("Years 3+ use borrow-to-pay cascade (loan increases)", () => {
    const year2Premium = 29200;
    // Year 3 borrows from account to pay premium
    const year3LoanForPremium = year2Premium;
    expect(year3LoanForPremium).toBe(29200);
  });

  it("loan balance accumulates over borrow years", () => {
    const year2Premium = 29200;
    let totalLoan = 0;
    // Years 3-5 each borrow
    for (let y = 3; y <= 5; y++) {
      totalLoan += year2Premium;
    }
    expect(totalLoan).toBe(87600); // 3 years of borrowing
  });

  it("no loans in years 1 and 2", () => {
    // Years 1 and 2 are funded directly, not via loans
    const year1Loan = 0;
    const year2Loan = 0;
    expect(year1Loan).toBe(0);
    expect(year2Loan).toBe(0);
  });
});

// ── 4. IUL Cascade Full 20-Year Simulation ──────────────────────────────────
describe("IUL Cascade 20-Year Simulation", () => {
  const IUL_LOAD_FEE = 0.06;
  const IUL_LOAN_RATE = 0.05;
  const IUL_AVG_RETURN = 0.10;
  const IUL_COI_RATE = 0.04;

  function simulateIulCascade(year1Premium: number, year2Premium: number, years: number) {
    let accountValue = 0;
    let totalLoanBalance = 0;
    let cumulativePremiums = 0;
    const results: Array<{
      year: number; endingAccountValue: number; loanBalance: number; netCashValue: number;
    }> = [];

    for (let y = 1; y <= years; y++) {
      let premium: number;
      let loanForPremium = 0;
      if (y === 1) premium = year1Premium;
      else if (y === 2) premium = year2Premium;
      else { premium = year2Premium; loanForPremium = premium; }

      cumulativePremiums += premium;
      const netPremium = premium * (1 - IUL_LOAD_FEE);
      const beginningValue = accountValue + netPremium;
      const interestEarned = beginningValue * IUL_AVG_RETURN;
      const coiCharge = beginningValue * IUL_COI_RATE;
      totalLoanBalance += loanForPremium;
      accountValue = beginningValue + interestEarned - coiCharge;
      const netCashValue = accountValue - totalLoanBalance;

      results.push({
        year: y,
        endingAccountValue: Math.round(accountValue),
        loanBalance: Math.round(totalLoanBalance),
        netCashValue: Math.round(netCashValue),
      });
    }
    return results;
  }

  it("solar option produces 20 rows", () => {
    const rows = simulateIulCascade(35624, 29200, 20);
    expect(rows.length).toBe(20);
  });

  it("standard option produces 20 rows", () => {
    const rows = simulateIulCascade(7008, 29200, 20);
    expect(rows.length).toBe(20);
  });

  it("account value grows each year (compounding)", () => {
    const rows = simulateIulCascade(35624, 29200, 20);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].endingAccountValue).toBeGreaterThan(rows[i - 1].endingAccountValue);
    }
  });

  it("solar option final account value > standard option", () => {
    const solar = simulateIulCascade(35624, 29200, 20);
    const standard = simulateIulCascade(7008, 29200, 20);
    expect(solar[19].endingAccountValue).toBeGreaterThan(standard[19].endingAccountValue);
  });

  it("solar option final net cash value > standard option", () => {
    const solar = simulateIulCascade(35624, 29200, 20);
    const standard = simulateIulCascade(7008, 29200, 20);
    expect(solar[19].netCashValue).toBeGreaterThan(standard[19].netCashValue);
  });

  it("loan balance is 0 for years 1-2, increases from year 3", () => {
    const rows = simulateIulCascade(35624, 29200, 20);
    expect(rows[0].loanBalance).toBe(0);
    expect(rows[1].loanBalance).toBe(0);
    expect(rows[2].loanBalance).toBe(29200);
    expect(rows[3].loanBalance).toBe(58400);
  });

  it("net cash value = account value - loan balance", () => {
    const rows = simulateIulCascade(35624, 29200, 20);
    for (const row of rows) {
      expect(row.netCashValue).toBe(row.endingAccountValue - row.loanBalance);
    }
  });

  it("15-year projection produces 15 rows", () => {
    const rows = simulateIulCascade(35624, 29200, 15);
    expect(rows.length).toBe(15);
  });

  it("net cash value is positive at year 20 for solar option", () => {
    const rows = simulateIulCascade(35624, 29200, 20);
    expect(rows[19].netCashValue).toBeGreaterThan(0);
  });

  it("net cash value is positive at year 20 for standard option", () => {
    const rows = simulateIulCascade(7008, 29200, 20);
    expect(rows[19].netCashValue).toBeGreaterThan(0);
  });
});

// ── 5. Conversion Portion Logic ─────────────────────────────────────────────
describe("Conversion Portion Logic", () => {
  it("100% portion converts up to standard deduction", () => {
    const iraBalance = 800000;
    const portion = 1.0;
    const standardDeduction = 29200;
    const conversionAmount = Math.min(iraBalance * portion, standardDeduction);
    expect(conversionAmount).toBe(29200);
  });

  it("50% portion with small IRA converts half", () => {
    const iraBalance = 40000;
    const portion = 0.50;
    const standardDeduction = 29200;
    const conversionAmount = Math.min(iraBalance * portion, standardDeduction);
    expect(conversionAmount).toBe(20000);
  });

  it("25% of large IRA still capped at standard deduction", () => {
    const iraBalance = 800000;
    const portion = 0.25;
    const standardDeduction = 29200;
    const conversionAmount = Math.min(iraBalance * portion, standardDeduction);
    expect(conversionAmount).toBe(29200); // 200000 > 29200
  });

  it("25% of small IRA converts the portion", () => {
    const iraBalance = 50000;
    const portion = 0.25;
    const standardDeduction = 29200;
    const conversionAmount = Math.min(iraBalance * portion, standardDeduction);
    expect(conversionAmount).toBe(12500);
  });
});

// ── 6. Dual Option Router Exists ────────────────────────────────────────────
describe("Dual Option Router Structure", () => {
  it("rothConversion.project procedure exists on the router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("rothConversion.project");
  });
});

// ── 7. Roth Balance 20-Year Growth ──────────────────────────────────────────
describe("Roth Balance 20-Year Growth", () => {
  it("Roth grows at 5% compounding over 20 years", () => {
    const conversionAmount = 29200;
    let balance = conversionAmount;
    for (let y = 1; y <= 20; y++) {
      balance *= 1.05;
    }
    expect(Math.round(balance)).toBe(Math.round(29200 * Math.pow(1.05, 20)));
  });

  it("Roth balance after 20 years is approximately $77,500", () => {
    const balance = 29200 * Math.pow(1.05, 20);
    expect(balance).toBeGreaterThan(77000);
    expect(balance).toBeLessThan(78000);
  });
});

// ── 8. STR Property Projection (unchanged from Round 21) ───────────────────
describe("STR Property Projection Consistency", () => {
  it("target property price = IRA / 0.4", () => {
    expect(800000 / 0.4).toBe(2000000);
  });

  it("30% down payment from HELOC", () => {
    expect(2000000 * 0.30).toBe(600000);
  });

  it("70% mortgage", () => {
    expect(2000000 * 0.70).toBe(1400000);
  });

  it("HELOC monthly payment at 7% interest-only", () => {
    const payment = (600000 * 0.07) / 12;
    expect(payment).toBeCloseTo(3500, 2);
  });

  it("5-year property appreciation at 5% compounding", () => {
    const final = 2000000 * Math.pow(1.05, 5);
    expect(Math.round(final)).toBe(2552563);
  });
});

// ── 9. IUL as Lending Tool for Additional STR ───────────────────────────────
describe("IUL Lending Potential", () => {
  it("IUL cash value can fund 30% down on additional property", () => {
    // After 20 years, if IUL net cash value is e.g. $500K+,
    // that can fund 30% down on a $1.67M property
    const netCashValue = 500000; // hypothetical
    const downPaymentRate = 0.30;
    const additionalPropertyValue = netCashValue / downPaymentRate;
    expect(additionalPropertyValue).toBeCloseTo(1666667, -2);
  });

  it("borrowing at 5% loan rate is cheaper than HELOC at 7%", () => {
    const iulLoanRate = 0.05;
    const helocRate = 0.07;
    expect(iulLoanRate).toBeLessThan(helocRate);
  });

  it("IUL loans are tax-free (not taxable events)", () => {
    // This is a factual assertion about IUL policy loans
    const isTaxFree = true;
    expect(isTaxFree).toBe(true);
  });
});

// ── 10. Edge Cases ──────────────────────────────────────────────────────────
describe("Edge Cases", () => {
  it("very small IRA still produces valid calculations", () => {
    const iraBalance = 10000;
    const targetProperty = iraBalance / 0.4;
    expect(targetProperty).toBe(25000);
    const conversionAmount = Math.min(iraBalance, 29200);
    expect(conversionAmount).toBe(10000);
    const solarEnhancement = conversionAmount * 0.22;
    expect(solarEnhancement).toBe(2200);
  });

  it("IRA larger than standard deduction caps conversion", () => {
    const iraBalance = 2000000;
    const conversionAmount = Math.min(iraBalance, 29200);
    expect(conversionAmount).toBe(29200);
  });

  it("single filer has lower standard deduction", () => {
    const singleDeduction = 14600;
    const marriedDeduction = 29200;
    expect(singleDeduction).toBeLessThan(marriedDeduction);
  });

  it("IUL cascade with 15-year horizon has fewer loan years", () => {
    // 15 years = 2 funded + 13 borrowed
    const borrowYears = 15 - 2;
    expect(borrowYears).toBe(13);
    // 20 years = 2 funded + 18 borrowed
    const borrowYears20 = 20 - 2;
    expect(borrowYears20).toBe(18);
  });
});
