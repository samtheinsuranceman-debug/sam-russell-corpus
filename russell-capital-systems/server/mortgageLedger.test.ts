// Mortgage arithmetic is checkable against closed-form results, so these tests
// assert the maths rather than the implementation. Where a figure appears it
// was derived independently of the code.
import { describe, it, expect } from "vitest";
import {
  MAX_HORIZON_MONTHS,
  monthlyRate, interestOnlyPayment, amortisingPayment, monthsToPayoff, buildLedger,
  summarise, splitThisMonth, extraPaymentScenarios, standardScenarios, checkStatement,
  mortgageLedgerReport, normaliseStatement, equityPosition, STATEMENT_TOLERANCE,
  type LoanInput, type ExtractedStatement,
} from "@shared/mortgageLedger";

// A 30-year, $400,000 note at 6.5%. The amortising payment is
// 400000 * (0.065/12) / (1 - (1+0.065/12)^-360) = $2,528.27.
const EXACT_PAYMENT = amortisingPayment(400_000, 0.065, 360); // $2,528.2725...
const LOAN: LoanInput = { balance: 400_000, annualRate: 0.065, monthlyPayment: EXACT_PAYMENT, termMonthsRemaining: 360 };

describe("the closed forms", () => {
  it("uses APR ÷ 12, the US mortgage convention", () => {
    expect(monthlyRate(0.065)).toBeCloseTo(0.00541667, 8);
  });

  it("computes the interest-only payment as balance × monthly rate", () => {
    expect(interestOnlyPayment(400_000, 0.065)).toBeCloseTo(2_166.67, 2);
  });

  it("computes the amortising payment for a 30-year note", () => {
    expect(amortisingPayment(400_000, 0.065, 360)).toBeCloseTo(2_528.27, 2);
  });

  it("falls back to straight division at a zero rate", () => {
    expect(amortisingPayment(120_000, 0, 120)).toBe(1_000);
  });

  it("recovers the term from the payment it produced", () => {
    expect(monthsToPayoff(400_000, 0.065, EXACT_PAYMENT)).toBe(360);
  });

  it("leaves a stub month when the payment is rounded down to the cent, as a real servicer's is", () => {
    // $2,528.27 is a third of a cent short of the exact payment, so the loan
    // runs one more month with a few dollars left. This is not a defect; it is
    // why a final payment is never the same as the other 359.
    expect(monthsToPayoff(400_000, 0.065, 2_528.27)).toBe(361);
  });

  it("returns null — not a crash, not Infinity — when the payment cannot cover the interest", () => {
    expect(monthsToPayoff(400_000, 0.065, 2_166.66)).toBeNull();
    expect(monthsToPayoff(400_000, 0.065, 500)).toBeNull();
  });

  it("also returns null when the payment clears the interest by so little that the term is unreadable", () => {
    // $2,166.67 exceeds the $2,166.666... interest by a third of a cent, which
    // is arithmetically a 206-year loan. Beyond the shared horizon that is
    // reported as not retiring rather than as a number nobody can use.
    expect(monthsToPayoff(400_000, 0.065, 2_166.67)).toBeNull();
    expect(MAX_HORIZON_MONTHS).toBe(1_200);
  });

  it("returns zero months for a balance already at zero", () => {
    expect(monthsToPayoff(0, 0.065, 1_000)).toBe(0);
  });
});

describe("where the payment is actually going", () => {
  it("splits the first payment and reports the interest share", () => {
    const s = splitThisMonth(LOAN);
    expect(s.interest).toBeCloseTo(2_166.67, 2);
    expect(s.principal).toBeCloseTo(361.61, 2);
    expect(s.interestShare).toBeCloseTo(0.857, 3);
    expect(s.reading).toMatch(/8[56] cents of every dollar is interest/);
  });

  it("carries escrow separately — it is not part of principal and interest", () => {
    const s = splitThisMonth({ ...LOAN, monthlyEscrow: 650 });
    expect(s.principalAndInterest).toBeCloseTo(2_528.27, 2);
    expect(s.totalOutlay).toBeCloseTo(3_178.27, 2);
    expect(s.escrow).toBe(650);
  });

  it("gives the daily interest figure, which lands harder than the monthly one", () => {
    expect(splitThisMonth(LOAN).interestPerDay).toBeCloseTo(2_166.67 * 12 / 365, 2);
  });

  it("says plainly when the payment does not cover the interest", () => {
    const s = splitThisMonth({ ...LOAN, monthlyPayment: 1_500 });
    expect(s.principal).toBe(0);
    expect(s.reading).toMatch(/balance is growing, not shrinking/);
  });

  it("reads a nearly-retired loan as principal-heavy", () => {
    const s = splitThisMonth({ balance: 20_000, annualRate: 0.065, monthlyPayment: EXACT_PAYMENT, termMonthsRemaining: 8 });
    expect(s.interestShare).toBeLessThan(0.1);
    expect(s.reading).toMatch(/crossed over/);
  });
});

describe("the schedule", () => {
  const ledger = buildLedger(LOAN);

  it("runs the full term and lands the balance on zero", () => {
    expect(ledger.length).toBe(360);
    expect(ledger[359]!.closingBalance).toBeCloseTo(0, 1);
  });

  it("never overpays the final month", () => {
    const last = ledger[359]!;
    expect(last.principal + last.extra).toBeLessThanOrEqual(last.openingBalance + 0.01);
  });

  it("has interest falling and principal rising every month up to the final one", () => {
    // The last month pays only the remaining balance, so its principal is a
    // stub and breaks the monotonic run by design.
    for (let i = 1; i < ledger.length - 1; i++) {
      expect(ledger[i]!.interest).toBeLessThan(ledger[i - 1]!.interest + 0.01);
      expect(ledger[i]!.principal).toBeGreaterThan(ledger[i - 1]!.principal - 0.01);
    }
  });

  it("accumulates to the published total interest on a 30-year note", () => {
    // 360 × 2528.27 − 400,000 = $510,177 of interest, give or take rounding.
    expect(ledger[359]!.cumulativeInterest).toBeCloseTo(510_177, -2);
  });

  it("stops rather than walking a century when the payment cannot amortise", () => {
    expect(buildLedger({ ...LOAN, monthlyPayment: 1_000 }).length).toBe(1);
  });
});

describe("the summary", () => {
  it("reports the term, the interest and the crossover month", () => {
    const s = summarise(LOAN);
    expect(s.monthsToPayoff).toBe(360);
    expect(s.yearsToPayoff).toBe(30);
    expect(s.neverAmortises).toBe(false);
    // On a 30-year 6.5% note principal only exceeds interest well past year 15.
    expect(s.crossoverMonth).toBeGreaterThan(200);
    expect(s.crossoverMonth).toBeLessThan(260);
  });

  it("flags a loan that never amortises instead of returning a number", () => {
    const s = summarise({ ...LOAN, monthlyPayment: 2_000 });
    expect(s.neverAmortises).toBe(true);
    expect(s.monthsToPayoff).toBeNull();
  });

  it("reports no crossover when the loan already pays more principal than interest", () => {
    expect(summarise({ balance: 20_000, annualRate: 0.065, monthlyPayment: EXACT_PAYMENT, termMonthsRemaining: 8 }).crossoverMonth).toBeNull();
  });
});

describe("what an extra payment actually buys", () => {
  const scenarios = standardScenarios(LOAN);

  it("includes the doubled payment the client asked about", () => {
    const doubled = scenarios.find((s) => s.label.startsWith("Double"))!;
    expect(doubled.extraMonthly).toBeCloseTo(LOAN.monthlyPayment, 2);
    expect(doubled.monthsSaved).toBeGreaterThan(200);
    expect(doubled.interestSaved).toBeGreaterThan(300_000);
  });

  it("reports the extra cash put in beside the interest saved, so the two are not confused", () => {
    for (const s of scenarios) {
      expect(s.extraPaidIn).toBeGreaterThan(0);
      expect(s.savedPerDollar).toBeGreaterThan(0);
    }
  });

  it("is honest that prepaying earns the note rate and nothing more", () => {
    for (const s of scenarios) expect(s.effectiveAnnualReturn).toBe(LOAN.annualRate);
  });

  it("saves more the larger the extra payment, and retires the loan sooner", () => {
    const hundred = scenarios.find((s) => s.label === "+$100 a month")!;
    const fiveHundred = scenarios.find((s) => s.label === "+$500 a month")!;
    expect(fiveHundred.interestSaved).toBeGreaterThan(hundred.interestSaved);
    expect(fiveHundred.monthsToPayoff!).toBeLessThan(hundred.monthsToPayoff!);
  });

  it("shows diminishing interest saved per extra dollar as the extra grows", () => {
    const hundred = scenarios.find((s) => s.label === "+$100 a month")!;
    const doubled = scenarios.find((s) => s.label.startsWith("Double"))!;
    expect(doubled.savedPerDollar).toBeLessThan(hundred.savedPerDollar);
  });

  it("prices one extra payment a year", () => {
    const annual = scenarios.find((s) => s.label === "One extra payment a year")!;
    expect(annual.monthsSaved).toBeGreaterThan(40);
    expect(annual.monthsSaved).toBeLessThan(90);
  });

  it("returns a zero-saving row rather than NaN when the extra is zero", () => {
    const [s] = extraPaymentScenarios(LOAN, [{ label: "nothing", extraMonthly: 0 }]);
    expect(s!.interestSaved).toBeCloseTo(0, 2);
    expect(s!.savedPerDollar).toBe(0);
  });
});

describe("does the statement add up", () => {
  it("passes a consistent statement", () => {
    const c = checkStatement(LOAN);
    expect(c.ok).toBe(true);
    expect(c.verdict).toBe("consistent");
    expect(Math.abs(c.differencePct)).toBeLessThanOrEqual(STATEMENT_TOLERANCE);
  });

  it("catches a payment that includes escrow, and says that is the likely cause", () => {
    const c = checkStatement({ ...LOAN, monthlyPayment: 3_178 });
    expect(c.verdict).toBe("payment exceeds schedule");
    expect(c.note).toMatch(/includes escrow/);
  });

  it("catches a misread rate or term", () => {
    const c = checkStatement({ ...LOAN, monthlyPayment: 2_000, termMonthsRemaining: 360 });
    expect(c.ok).toBe(false);
    expect(c.verdict).toBe("interest-only or negative amortisation");
  });

  it("names a payment below the schedule and says what it actually implies", () => {
    const c = checkStatement({ balance: 400_000, annualRate: 0.065, monthlyPayment: 2_300, termMonthsRemaining: 360 });
    expect(c.verdict).toBe("payment below schedule");
    expect(c.note).toMatch(/rate or the remaining term was misread/);
  });

  it("asks for the missing figure rather than guessing it", () => {
    const c = checkStatement({ balance: 0, annualRate: 0.065, monthlyPayment: 2_500, termMonthsRemaining: 360 });
    expect(c.verdict).toBe("insufficient data");
    expect(c.note).toMatch(/read off the statement rather than estimated/);
  });
});

describe("reading an extracted statement", () => {
  const clean: ExtractedStatement = {
    mortgageBalance: 400_000, mortgageRate: 0.065, monthlyMortgagePayment: 2_528.27,
    monthlyInterestOnlyPayment: 2_166.67, totalInterestPayments: 510_177, mortgageTermMonths: 360,
    homeMarketValue: 620_000, lenderName: "Example Servicing", propertyAddress: "1 Example St", escrowBalance: 2_100,
  };

  it("reads a clean statement with no warnings", () => {
    const n = normaliseStatement(clean);
    expect(n.warnings).toEqual([]);
    expect(n.missing).toEqual([]);
    expect(n.interestOnlyAgrees).toBe(true);
    expect(n.loan.annualRate).toBe(0.065);
  });

  it("repairs a rate read as a percentage and says it did", () => {
    const n = normaliseStatement({ ...clean, mortgageRate: 6.5 });
    expect(n.loan.annualRate).toBeCloseTo(0.065, 6);
    expect(n.warnings.join(" ")).toMatch(/percentage rather than a decimal/);
  });

  it("treats the extractor's zeros as missing values, not as real zeros", () => {
    const n = normaliseStatement({ ...clean, mortgageBalance: 0, mortgageRate: 0 });
    expect(n.missing).toContain("current balance");
    expect(n.missing).toContain("interest rate");
  });

  it("catches an interest figure that disagrees with the balance and rate", () => {
    const n = normaliseStatement({ ...clean, monthlyInterestOnlyPayment: 900 });
    expect(n.interestOnlyAgrees).toBe(false);
    expect(n.warnings.join(" ")).toMatch(/does not match/);
  });

  it("drops the extractor's 'Unknown' placeholders rather than showing them to a client", () => {
    const n = normaliseStatement({ ...clean, lenderName: "Unknown", propertyAddress: "Unknown", homeMarketValue: 0 });
    expect(n.lenderName).toBeNull();
    expect(n.propertyAddress).toBeNull();
    expect(n.homeMarketValue).toBeNull();
  });

  it("carries the statement check's own complaint into the warnings", () => {
    const n = normaliseStatement({ ...clean, monthlyMortgagePayment: 2_000, monthlyInterestOnlyPayment: 0 });
    expect(n.warnings.length).toBeGreaterThan(0);
  });
});

describe("equity available to borrow against", () => {
  it("computes equity, LTV and the room at a given lending LTV", () => {
    const e = equityPosition(400_000, 620_000, 0.75);
    expect(e.equity).toBe(220_000);
    expect(e.currentLtv).toBeCloseTo(0.645, 3);
    expect(e.maxLoan).toBe(465_000);
    expect(e.availableToBorrow).toBe(65_000);
  });

  it("reports nothing available when already above the lending LTV", () => {
    expect(equityPosition(500_000, 620_000, 0.75).availableToBorrow).toBe(0);
  });
});

describe("the whole report", () => {
  const r = mortgageLedgerReport({ ...LOAN, monthlyEscrow: 650 });

  it("rolls the schedule up by year", () => {
    expect(r.byYear.length).toBe(30);
    expect(r.byYear[0]!.interestShare).toBeGreaterThan(0.8);
    expect(r.byYear[29]!.interestShare).toBeLessThan(0.1);
    expect(r.byYear[29]!.endingBalance).toBeCloseTo(0, 1);
  });

  it("leads with where the payment is going and when it crosses over", () => {
    expect(r.headlines[0]).toMatch(/cents of every dollar is interest/);
    expect(r.headlines.join(" ")).toMatch(/more toward principal than interest/);
  });

  it("states the doubled-payment result with the cash put in beside it", () => {
    const line = r.headlines.find((h) => h.includes("Doubling"))!;
    expect(line).toMatch(/puts \$[\d,]+ of extra cash in/);
    expect(line).toMatch(/Prepaying earns the note rate/);
  });

  it("refuses to imply that prepaying is the right answer", () => {
    expect(r.headlines.join(" ")).toMatch(/says nothing about whether prepaying is the best use of the money/);
  });
});
