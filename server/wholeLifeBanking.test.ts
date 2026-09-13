/**
 * The assertions that keep a banking illustration honest.
 *
 * Most of these are about the parts a pitch leaves out: the years cash value
 * is below premiums paid, the loan interest, and whether the carrier uses
 * direct recognition. The compounding is easy arithmetic and needs little
 * defending; the shape of the first decade is where people are misled.
 */

import { describe, it, expect } from 'vitest';
import { runWholeLifeBanking, type WholeLifeTerms } from '../shared/wholeLifeBanking';

/**
 * A plausible shape for testing the mechanism — NOT any carrier's product.
 * Real guaranteed values come from the contract's own table.
 */
const guaranteed = Array.from({ length: 40 }, (_, i) => {
  const y = i + 1;
  return y <= 2 ? 0 : Math.round(50_000 * (y - 2) * 0.55);
});

const terms: WholeLifeTerms = {
  basePremium: 20_000,
  puaPremium: 30_000,
  payYears: 10,
  guaranteedCashValueByYear: guaranteed,
  dividendScalePct: 5.0,
  puaCashValueEfficiencyPct: 90,
  directRecognition: false,
  loanRatePct: 5.0,
};

describe('participating whole life as a banking vehicle', () => {
  it('is underwater in the early years, and says for how long', () => {
    // The single most misrepresented fact about these policies.
    const r = runWholeLifeBanking({ terms, years: 30, dividendOption: { kind: 'paidUpAdditions' } });
    expect(r.summary.yearsUnderwater).toBeGreaterThan(0);
    expect(r.years[0]!.totalCashValue).toBeLessThan(r.years[0]!.cumulativePremiums);
    expect(r.notes.join(' ')).toContain('surrendering would have returned less than was paid in');
  });

  it('never claims the dividend is guaranteed', () => {
    const r = runWholeLifeBanking({ terms, years: 20, dividendOption: { kind: 'paidUpAdditions' } });
    expect(r.notes[0]).toContain('not guaranteed');
    expect(r.notes.join(' ')).toContain("declared annually at the carrier's discretion");
  });

  it('paid-up additions compound; taking the dividend in cash does not', () => {
    const pua = runWholeLifeBanking({ terms, years: 30, dividendOption: { kind: 'paidUpAdditions' } });
    const cash = runWholeLifeBanking({ terms, years: 30, dividendOption: { kind: 'cash' } });
    expect(pua.summary.finalCashValue).toBeGreaterThan(cash.summary.finalCashValue);
    // And the difference grows, because each addition earns its own dividend.
    expect(pua.summary.totalDividends).toBeGreaterThan(cash.summary.totalDividends);
  });

  it('direct recognition changes the answer, so it cannot be left unstated', () => {
    const loans = [{ year: 11, amount: 200_000, annualRepayment: 0 }];
    const nonDirect = runWholeLifeBanking({
      terms, years: 30, dividendOption: { kind: 'paidUpAdditions' }, loans,
    });
    const direct = runWholeLifeBanking({
      terms: { ...terms, directRecognition: true, dividendOnLoanedPortionPct: 3.0 },
      years: 30, dividendOption: { kind: 'paidUpAdditions' }, loans,
    });
    expect(direct.summary.totalDividends).toBeLessThan(nonDirect.summary.totalDividends);
    expect(nonDirect.notes.join(' ')).toContain('does not use direct recognition');
    expect(direct.notes.join(' ')).toContain('uses direct recognition');
  });

  it('shows loan interest as its own number rather than burying it', () => {
    // "Borrowing from yourself" is not free. The insurer lends its money
    // against your cash value and charges for it.
    const r = runWholeLifeBanking({
      terms, years: 30, dividendOption: { kind: 'paidUpAdditions' },
      loans: [{ year: 11, amount: 200_000, annualRepayment: 0 }],
    });
    expect(r.summary.totalLoanInterest).toBeGreaterThan(0);
    const afterLoan = r.years.find((y) => y.policyYear === 12)!;
    expect(afterLoan.loanInterestThisYear).toBeGreaterThan(0);
    expect(afterLoan.loanBalance).toBeGreaterThan(200_000);
  });

  it('an unrepaid loan compounds and eats the surrender value', () => {
    const r = runWholeLifeBanking({
      terms, years: 40, dividendOption: { kind: 'paidUpAdditions' },
      loans: [{ year: 5, amount: 150_000, annualRepayment: 0 }],
    });
    const repaid = runWholeLifeBanking({
      terms, years: 40, dividendOption: { kind: 'paidUpAdditions' },
      loans: [{ year: 5, amount: 150_000, annualRepayment: 25_000 }],
    });
    expect(r.summary.finalLoanBalance).toBeGreaterThan(150_000);
    expect(repaid.summary.finalLoanBalance).toBeLessThan(r.summary.finalLoanBalance);
    expect(repaid.summary.finalNetSurrenderValue).toBeGreaterThan(r.summary.finalNetSurrenderValue);
  });

  it('surrender value is cash value less the loan, never the gross figure', () => {
    const r = runWholeLifeBanking({
      terms, years: 30, dividendOption: { kind: 'paidUpAdditions' },
      loans: [{ year: 11, amount: 200_000, annualRepayment: 0 }],
    });
    // The displayed columns must agree with each other exactly: a reader
    // subtracting the loan from the cash value has to land on the net.
    for (const y of r.years) {
      expect(y.netSurrenderValue, `year ${y.policyYear}`).toBe(Math.max(0, y.totalCashValue - y.loanBalance));
    }
    expect(r.summary.finalNetSurrenderValue).toBeLessThan(r.summary.finalCashValue);
  });

  it('with no guaranteed table it shows zero and says why, rather than inventing one', () => {
    const r = runWholeLifeBanking({
      terms: { ...terms, guaranteedCashValueByYear: [] },
      years: 20,
      dividendOption: { kind: 'paidUpAdditions' },
    });
    for (const y of r.years) expect(y.guaranteedCashValue).toBe(0);
    expect(r.notes.join(' ')).toContain('cannot be derived');
  });

  it('premiums stop when the pay period ends, and cash value keeps growing', () => {
    const r = runWholeLifeBanking({ terms, years: 30, dividendOption: { kind: 'paidUpAdditions' } });
    expect(r.years[9]!.premiumPaid).toBeGreaterThan(0);
    expect(r.years[10]!.premiumPaid).toBe(0);
    expect(r.summary.totalPremiums).toBe((terms.basePremium + terms.puaPremium) * terms.payYears);
    expect(r.years[29]!.totalCashValue).toBeGreaterThan(r.years[10]!.totalCashValue);
  });
});
