import { describe, it, expect } from "vitest";
import {
  amortize, lostPurchasingPower, analyzeLoan, analyzeProperty, summarizePortfolio,
  threadingPlan, buildStrategies, rankStrategies, projectPortfolio, growthPath,
  CONSERVATIVE_ASSUMPTIONS, MAX_PROPERTIES, MOGUL_RULES,
  type Property, type PropertyLoan,
} from "../shared/realEstateMogul";

const loan = (over: Partial<PropertyLoan> = {}): PropertyLoan => ({
  lender: "Bank A", type: "first", originalBalance: 400_000, currentBalance: 300_000,
  rate: 0.065, monthlyPI: 2_528, termMonths: 360, monthsElapsed: 60, interestOnly: false, ...over,
});

const prop = (over: Partial<Property> = {}): Property => ({
  id: "P1", label: "Property 1", marketValue: 500_000, maxCltv: 0.75,
  loans: [loan()],
  rentalHistory: [
    { year: 2023, grossRent: 48_000, expenses: 17_000 },
    { year: 2024, grossRent: 50_000, expenses: 18_000 },
  ],
  ...over,
});

describe("amortization and the interest-only trap", () => {
  it("pays off an amortizing loan and totals the interest", () => {
    const r = amortize(300_000, 0.065, 2_528);
    expect(r.months).toBeGreaterThan(100);
    expect(r.months).toBeLessThan(300);
    expect(r.totalInterest).toBeGreaterThan(0);
  });

  it("returns Infinity when the payment never touches principal", () => {
    const io = (300_000 * 0.065) / 12;
    const r = amortize(300_000, 0.065, io);
    expect(r.months).toBe(Number.POSITIVE_INFINITY);
    expect(r.totalInterest).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns zero for a paid-off loan rather than dividing by nothing", () => {
    expect(amortize(0, 0.065, 1000)).toEqual({ months: 0, totalInterest: 0 });
  });

  it("computes the real interest share — the '55%' figure, not a slogan", () => {
    const a = analyzeLoan(loan());
    expect(a.interestShareOfPayments).toBeGreaterThan(0.2);
    expect(a.interestShareOfPayments).toBeLessThan(1);
  });

  it("flags an interest-only loan as never amortising", () => {
    const a = analyzeLoan(loan({ interestOnly: true, monthlyInterestOnly: 1_625, monthlyPI: 0 }));
    expect(a.monthsToPayoff).toBe(Number.POSITIVE_INFINITY);
    expect(a.interestShareOfPayments).toBe(1);
  });
});

describe("lost purchasing power — compounded per year, not in one lump", () => {
  it("is larger than the raw interest but not absurdly so", () => {
    const { totalInterest } = amortize(300_000, 0.065, 2_528);
    const lost = lostPurchasingPower(300_000, 0.065, 2_528, 0.06);
    expect(lost).toBeGreaterThan(totalInterest);
    // Compounding each year for only its remaining term, not all of it for the
    // full term — so the multiple must stay modest.
    expect(lost).toBeLessThan(totalInterest * 4);
  });

  it("treats interest-only as a permanent annual bleed", () => {
    const io = (300_000 * 0.065) / 12;
    expect(lostPurchasingPower(300_000, 0.065, io, 0.06)).toBeGreaterThan(1_000_000);
  });
});

describe("property and portfolio", () => {
  it("computes equity, LTV and borrowable headroom against the CLTV ceiling", () => {
    const a = analyzeProperty(prop());
    expect(a.equity).toBe(200_000);
    expect(a.ltv).toBeCloseTo(0.6, 2);
    expect(a.borrowableEquity).toBe(75_000); // 500k * 0.75 - 300k
  });

  it("averages NOI across the supplied rental years", () => {
    const a = analyzeProperty(prop());
    expect(a.netOperatingIncome).toBe(31_500);
  });

  it("returns zero borrowable equity when already past the ceiling", () => {
    const a = analyzeProperty(prop({ loans: [loan({ currentBalance: 480_000 })] }));
    expect(a.borrowableEquity).toBe(0);
  });

  it("summarises a portfolio and counts interest-only properties", () => {
    const s = summarizePortfolio([
      prop(),
      prop({ id: "P2", loans: [loan({ interestOnly: true, monthlyInterestOnly: 1_625, monthlyPI: 0 })] }),
    ]);
    expect(s.propertyCount).toBe(2);
    expect(s.interestOnlyCount).toBe(1);
    expect(s.plain).toContain("never amortises");
  });

  it("excludes infinite interest from the finite totals rather than poisoning them", () => {
    const s = summarizePortfolio([
      prop({ id: "P2", loans: [loan({ interestOnly: true, monthlyInterestOnly: 1_625, monthlyPI: 0 })] }),
      prop(),
    ]);
    expect(Number.isFinite(s.remainingInterestIfNothingChanges)).toBe(true);
    expect(Number.isFinite(s.lostPurchasingPowerIfNothingChanges)).toBe(true);
  });

  it("holds up to 150 properties and refuses more", () => {
    const many = Array.from({ length: MAX_PROPERTIES }, (_, i) => prop({ id: `P${i}` }));
    expect(summarizePortfolio(many).propertyCount).toBe(MAX_PROPERTIES);
    expect(() => summarizePortfolio([...many, prop({ id: "extra" })])).toThrow(RangeError);
  });
});

describe("threading — both sides of the ledger", () => {
  const base = {
    amount: 400_000, loanableFraction: 0.92,
    policyLoanRate: 0.05, helocRate: 0.065, creditedRate: 0.075,
  };

  it("builds account value faster than it builds loans", () => {
    const t = threadingPlan({ ...base, policyCount: 4 });
    expect(t.accountValueMultiple).toBeGreaterThan(3);
    expect(t.policyLoanStack).toBeGreaterThan(0);
    expect(t.policyLoanStack).toBeLessThan(t.totalAccountValue);
  });

  it("reports what actually reaches the mortgage, which shrinks with depth", () => {
    const one = threadingPlan({ ...base, policyCount: 1 });
    const five = threadingPlan({ ...base, policyCount: 5 });
    expect(five.amountReachingMortgage).toBeLessThan(one.amountReachingMortgage);
    expect(five.totalAccountValue).toBeGreaterThan(one.totalAccountValue);
  });

  it("computes a break-even credited rate that falls as depth rises", () => {
    const two = threadingPlan({ ...base, policyCount: 2 });
    const five = threadingPlan({ ...base, policyCount: 5 });
    expect(five.breakEvenCreditedRate).toBeLessThan(two.breakEvenCreditedRate);
  });

  it("calls a thread dilutive when the credited rate sits below break-even", () => {
    // AG 49-A capped rate against an 8% HELOC: this is the live case and it loses.
    const t = threadingPlan({ ...base, policyCount: 4, helocRate: 0.08, creditedRate: 0.0554 });
    expect(t.breakEvenCreditedRate).toBeGreaterThan(0.0554);
    expect(t.netFirstYear).toBeLessThan(0);
    expect(t.verdict).toBe("dilutive");
  });

  it("turns accretive once the credited rate clears break-even", () => {
    const t = threadingPlan({ ...base, policyCount: 4, helocRate: 0.065, creditedRate: 0.075 });
    expect(t.verdict).toBe("accretive");
    expect(t.netFirstYear).toBeGreaterThan(0);
  });

  it("names the floor year as the thing that reverses it", () => {
    expect(threadingPlan({ ...base, policyCount: 4 }).plain).toContain("floor year is exactly that");
  });

  it("refuses nonsense inputs", () => {
    expect(() => threadingPlan({ ...base, policyCount: 0 })).toThrow(RangeError);
    expect(() => threadingPlan({ ...base, amount: 0 })).toThrow(RangeError);
  });
});

describe("strategies — four, ranked, each with its risk stated", () => {
  const portfolio = summarizePortfolio([
    prop({ id: "A", marketValue: 400_000, loans: [loan({ currentBalance: 120_000, rate: 0.045 })] }),
    prop({ id: "B", marketValue: 900_000, loans: [loan({ currentBalance: 700_000, rate: 0.089, interestOnly: true, monthlyInterestOnly: 5_191, monthlyPI: 0 })] }),
    prop({ id: "C", marketValue: 600_000, loans: [loan({ currentBalance: 300_000, rate: 0.061 })] }),
  ]);

  it("produces exactly four strategies, each with a weighting and a risk note", () => {
    const s = buildStrategies(portfolio, 200_000);
    expect(s).toHaveLength(4);
    for (const x of s) {
      expect(x.weighting.length).toBeGreaterThan(20);
      expect(x.riskNote.length).toBeGreaterThan(40);
      expect(x.order.length).toBeGreaterThan(0);
    }
  });

  it("Stop the Bleed targets the biggest interest dollars first", () => {
    const bleed = buildStrategies(portfolio, 200_000).find((s) => s.key === "bleed-rate")!;
    expect(bleed.order[0].propertyId).toBe("B"); // 700k at 8.9%, interest-only
    expect(bleed.order[0].reason).toContain("never amortising");
  });

  it("Take Them Outright targets the smallest balance first", () => {
    const clear = buildStrategies(portfolio, 200_000).find((s) => s.key === "free-and-clear")!;
    expect(clear.order[0].propertyId).toBe("A");
    expect(clear.order[0].reason).toContain("removes a lender");
  });

  it("ranks differently by appetite, and says why each time", () => {
    const s = buildStrategies(portfolio, 200_000);
    expect(rankStrategies(s, "aggressive")[0].key).toBe("equity-unlock");
    expect(rankStrategies(s, "balanced")[0].key).toBe("ladder-down");
    expect(rankStrategies(s, "conservative")[0].key).toBe("free-and-clear");
    for (const r of rankStrategies(s, "balanced")) expect(r.recommendation.length).toBeGreaterThan(20);
  });

  it("never returns a lone optimum with no alternative", () => {
    expect(rankStrategies(buildStrategies(portfolio, 200_000), "balanced")).toHaveLength(4);
  });

  it("Ladder Down attacks the biggest balance at the highest rate first", () => {
    const ladder = buildStrategies(portfolio, 200_000).find((s) => s.key === "ladder-down")!;
    // B is 700k at 8.9% — biggest balance AND highest rate.
    expect(ladder.order[0].propertyId).toBe("B");
    expect(ladder.order[0].reason).toContain("8.90%");
  });

  it("Ladder Down counts PMI as annual cost and says it buys the borrower nothing", () => {
    const withPmi = summarizePortfolio([
      prop({ id: "A", marketValue: 400_000, loans: [loan({ currentBalance: 120_000, rate: 0.045 })] }),
      prop({
        id: "D", marketValue: 500_000,
        loans: [loan({ currentBalance: 380_000, rate: 0.055, monthlyPmi: 260 })],
      }),
    ]);
    const ladder = buildStrategies(withPmi, 200_000).find((s) => s.key === "ladder-down")!;
    const d = ladder.order.find((t) => t.propertyId === "D")!;
    expect(d.reason).toContain("PMI");
    expect(d.reason).toContain("buys the borrower nothing");
    // 380k * 5.5% = 20,900 interest, plus 3,120 PMI — PMI must be inside the score.
    expect(d.score).toBeCloseTo(380_000 * 0.055 + 260 * 12, 0);
  });

  it("is ranked first on a balanced appetite — it finishes what it starts", () => {
    const ranked = rankStrategies(buildStrategies(portfolio, 200_000), "balanced");
    expect(ranked[0].key).toBe("ladder-down");
    expect(ranked[0].weighting).toContain("until its balance");
    expect(ranked[0].riskNote).toContain("concentration");
  });
});

describe("twenty-year projection and the growth path", () => {
  const portfolio = summarizePortfolio(
    Array.from({ length: 30 }, (_, i) => prop({ id: `P${i}` })),
  );
  const projection = projectPortfolio({
    portfolio, assumptions: CONSERVATIVE_ASSUMPTIONS, years: 20,
    annualDraw: 500_000, policyCount: 4, loanableFraction: 0.92,
  });

  it("runs the requested horizon and grows value and rents", () => {
    expect(projection.years).toHaveLength(20);
    expect(projection.years[19].portfolioValue).toBeGreaterThan(portfolio.totalValue);
    expect(projection.years[19].annualNoi).toBeGreaterThan(0);
  });

  it("caps the annual draw at the CLTV ceiling instead of borrowing forever", () => {
    for (const y of projection.years) {
      expect(y.portfolioDebt).toBeLessThanOrEqual(y.portfolioValue * CONSERVATIVE_ASSUMPTIONS.maxCltv + 1);
    }
  });

  it("never shows account value without the loan standing against it", () => {
    for (const y of projection.years) {
      expect(y).toHaveProperty("policyLoanBalance");
      if (y.policyAccountValue > 0) expect(y.policyLoanBalance).toBeGreaterThan(0);
    }
    expect(projection.plain).toContain("policy loans");
  });

  it("reports net worth net of policy loans, not gross", () => {
    const last = projection.years[19];
    expect(projection.endingNetWorth).toBe(last.equity + last.policyAccountValue - last.policyLoanBalance);
    expect(projection.endingNetWorth).toBeLessThan(last.equity + last.policyAccountValue);
  });

  it("carries a caution naming the assumptions the whole thing rests on", () => {
    expect(projection.caution).toContain("lenders keep extending");
    expect(projection.caution).toContain("sequenceStress");
  });

  it("says when a growth tier is reached and when it plainly is not", () => {
    const path = growthPath({
      projection, startingCount: 30, averagePrice: 350_000, downPaymentFraction: 0.25,
    });
    expect(path).toHaveLength(3);
    expect(path[0].targetCount).toBe(60);
    expect(path[2].targetCount).toBe(240);
    const unreached = path.filter((p) => !p.feasible);
    for (const u of unreached) {
      expect(u.yearReached).toBeNull();
      expect(u.note).toContain("does not reach that inside");
    }
  });

  it("requires more equity for each successive doubling", () => {
    const path = growthPath({ projection, startingCount: 30, averagePrice: 350_000, downPaymentFraction: 0.25 });
    expect(path[1].equityRequired).toBeGreaterThan(path[0].equityRequired);
    expect(path[2].equityRequired).toBeGreaterThan(path[1].equityRequired);
  });
});

describe("never-printed list", () => {
  it("forbids unlimited credit, naked account values and lone optima", () => {
    const joined = MOGUL_RULES.neverPrinted.join(" ");
    expect(joined).toContain("without limit");
    expect(joined).toContain("without the policy loan balance");
    expect(joined).toContain('single "optimal" sequence');
  });

  it("forbids presenting a lender as kept unaware of other liens", () => {
    expect(MOGUL_RULES.neverPrinted.join(" ")).toContain("kept unaware");
  });
});
