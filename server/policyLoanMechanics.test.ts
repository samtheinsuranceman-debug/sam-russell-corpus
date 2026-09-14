/**
 * The loan arithmetic, and the two things it is built to make visible: that a
 * participating loan is charged in the years the index credits nothing, and
 * that a lapse hands the client a tax bill with no cash to pay it.
 */

import { describe, it, expect } from 'vitest';
import {
  runPolicyLoanMechanics,
  yearsToCrossover,
  type LoanTerms,
  type PolicyYearState,
  type TaxContext,
} from '../shared/policyLoanMechanics';
import { getCreditingHistory, ALL_INDEX_OPTIONS } from '../shared/indexCreditingData';

const TAX: TaxContext = {
  cumulativePremiumsPaid: 500_000,
  isMec: false,
  ownerAgeAtStart: 55,
  ordinaryIncomeRatePct: 37,
};

/** A policy that simply grows, so the loan overlay is what is being tested. */
function states(opts: {
  years: number; startValue: number; creditPct: number | number[]; draw: number; drawFrom: number;
  surrenderRatio?: number;
}): PolicyYearState[] {
  const out: PolicyYearState[] = [];
  let av = opts.startValue;
  for (let y = 1; y <= opts.years; y++) {
    const rate = Array.isArray(opts.creditPct)
      ? opts.creditPct[(y - 1) % opts.creditPct.length]!
      : opts.creditPct;
    av = av * (1 + rate / 100);
    out.push({
      policyYear: y,
      attainedAge: 55 + y,
      accountValue: av,
      surrenderValue: av * (opts.surrenderRatio ?? 1),
      creditedRatePct: rate,
      loanTaken: y >= opts.drawFrom ? opts.draw : 0,
    });
  }
  return out;
}

describe('the three loan types are three different bets', () => {
  const s = states({ years: 20, startValue: 1_000_000, creditPct: 6, draw: 60_000, drawFrom: 1 });

  it('a wash loan costs nothing, every year', () => {
    const terms: LoanTerms = { type: 'wash', chargedRatePct: 5 };
    const r = runPolicyLoanMechanics(s, terms, TAX);
    expect(r.summary.totalNetCost).toBe(0);
    for (const y of r.years) expect(y.netCost, `year ${y.policyYear}`).toBe(0);
  });

  it('a fixed loan costs the spread, and the spread only', () => {
    const terms: LoanTerms = { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3 };
    const r = runPolicyLoanMechanics(s, terms, TAX);
    for (const y of r.years) {
      if (y.loanBalance > 0 && !y.lapsed) {
        // Charged 5% on the balance carried in, credited 3% on it.
        expect(y.netCost).toBeGreaterThan(0);
      }
    }
    expect(r.summary.totalNetCost).toBeGreaterThan(0);
  });

  it('a participating loan costs the full rate in a year the index credits nothing', () => {
    // Six good years then a zero, repeating — the shape of a real index record.
    const withZeros = states({
      years: 21, startValue: 1_000_000, creditPct: [8, 8, 8, 0, 8, 8, 0], draw: 50_000, drawFrom: 1,
    });
    const r = runPolicyLoanMechanics(withZeros, { type: 'participating', chargedRatePct: 5 }, TAX);
    const flat = r.years.filter((y) => y.collateralCreditedNothing);
    expect(flat.length).toBeGreaterThan(0);
    for (const y of flat) {
      expect(y.collateralCredit, `year ${y.policyYear}`).toBe(0);
      expect(y.interestCharged, `year ${y.policyYear}`).toBeGreaterThan(0);
      expect(y.netCost).toBe(y.interestCharged);
    }
    expect(r.summary.yearsCollateralCreditedNothing).toBe(flat.length);
    expect(r.notes.join(' ')).toMatch(/charged its full rate anyway/);
  });
});

describe('against the real index record', () => {
  it('counts the zero-credit years a participating loan is charged through', () => {
    const capped = ALL_INDEX_OPTIONS.find((o) => o.id === 'am-sp500-ptp')!;
    const history = getCreditingHistory(capped, 1996, 2025);
    const s = history.map((h, i) => ({
      policyYear: i + 1,
      attainedAge: 55 + i + 1,
      accountValue: 1_000_000,
      surrenderValue: 1_000_000,
      creditedRatePct: h.creditedRate,
      loanTaken: 40_000,
    }));
    const r = runPolicyLoanMechanics(s, { type: 'participating', chargedRatePct: 5 }, TAX);
    // The floor means several years credit exactly nothing, and the loan is
    // charged in every one of them.
    expect(r.summary.yearsCollateralCreditedNothing).toBeGreaterThan(0);
    const zeroYears = history.filter((h) => h.creditedRate <= 0).length;
    expect(r.summary.yearsCollateralCreditedNothing).toBeLessThanOrEqual(zeroYears + 1);
  });
});

describe('charged in advance vs in arrears', () => {
  const s = states({ years: 10, startValue: 2_000_000, creditPct: 6, draw: 60_000, drawFrom: 1 });

  it('in arrears, the client gets the whole draw and the interest compounds', () => {
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3 }, TAX);
    expect(r.summary.totalCashReceived).toBe(r.summary.totalBorrowed);
    expect(r.years[0]!.cashReceived).toBe(60_000);
  });

  it('in advance, the interest comes out of the proceeds and the income column lies', () => {
    const r = runPolicyLoanMechanics(
      s, { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3, inArrears: false }, TAX);
    // A $60,000 draw at 5% hands over $57,000.
    expect(r.years[0]!.cashReceived).toBe(57_000);
    expect(r.summary.totalCashReceived).toBeLessThan(r.summary.totalBorrowed);
  });

  it('charges the year a draw is taken, not the year after', () => {
    // A loan taken in year 1 is on loan through year 1 and is charged for it.
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3 }, TAX);
    expect(r.years[0]!.interestCharged).toBe(3_000);
  });
});

describe('the crossover', () => {
  it('is closed-form when the charged rate exceeds the credited rate', () => {
    // $100k against $200k at 6% charged and 4% credited.
    const n = yearsToCrossover(100_000, 200_000, 6, 4)!;
    expect(n).toBeGreaterThan(0);
    // Verify by simulation rather than by restating the formula.
    let loan = 100_000, cv = 200_000, y = 0;
    while (loan < cv && y < 200) { loan *= 1.06; cv *= 1.04; y++; }
    expect(Math.ceil(n)).toBe(y);
  });

  it('never arrives when the charged rate is at or below the credited rate', () => {
    expect(yearsToCrossover(100_000, 200_000, 4, 6)).toBeNull();
    expect(yearsToCrossover(100_000, 200_000, 5, 5)).toBeNull();
  });

  it('is reported even on a run that does not reach it inside the projection', () => {
    const s = states({ years: 10, startValue: 2_000_000, creditPct: 4, draw: 30_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 7, collateralCreditRatePct: 2 }, TAX);
    expect(r.summary.lapseYear).toBeNull();
    expect(r.summary.projectedCrossoverYear).not.toBeNull();
    expect(r.notes.join(' ')).toMatch(/Nothing reverses it/);
  });
});

describe('what a lapse actually costs', () => {
  it('lapses when the loan overtakes the surrender value, and stops projecting after', () => {
    const s = states({ years: 40, startValue: 400_000, creditPct: 2, draw: 60_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 6, collateralCreditRatePct: 2 }, TAX);
    expect(r.summary.lapseYear).not.toBeNull();
    const after = r.years.filter((y) => y.policyYear > r.summary.lapseYear!);
    expect(after.every((y) => y.lapsed && y.loanBalance === 0)).toBe(true);
  });

  it('hands the client ordinary income on a gain they never received', () => {
    const s = states({ years: 40, startValue: 900_000, creditPct: 3, draw: 90_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 7, collateralCreditRatePct: 2 }, TAX);

    expect(r.lapseConsequence.occurred).toBe(true);
    expect(r.lapseConsequence.phantomIncomeOnLapse).toBeGreaterThan(0);
    expect(r.lapseConsequence.taxOwed).toBeGreaterThan(0);
    // The cash value went to the loan, so almost nothing reaches the client.
    expect(r.lapseConsequence.cashToClient).toBeLessThan(r.lapseConsequence.taxOwed);
    // Which means a cheque has to be written from somewhere else.
    expect(r.lapseConsequence.cashShortfall).toBeGreaterThan(0);
    expect(r.notes.join(' ')).toMatch(/ordinary income/);
  });

  it('prices the consequence even when the policy does not lapse', () => {
    const s = states({ years: 15, startValue: 2_000_000, creditPct: 6, draw: 20_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, TAX);
    expect(r.summary.lapseYear).toBeNull();
    expect(r.lapseConsequence.occurred).toBe(false);
    // Still computed, because a projection that holds still needs to show what
    // failing would cost.
    expect(r.lapseConsequence.phantomIncomeOnLapse).toBeGreaterThan(0);
  });

  it('says the death benefit route avoids all of it', () => {
    const s = states({ years: 10, startValue: 1_000_000, creditPct: 6, draw: 30_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, TAX);
    expect(r.notes.join(' ')).toMatch(/101\(a\)/);
  });
});

describe('modified endowment contracts', () => {
  const s = states({ years: 12, startValue: 1_000_000, creditPct: 6, draw: 50_000, drawFrom: 1 });

  it('taxes a loan from a MEC gain-first, unlike a loan from a non-MEC', () => {
    const nonMec = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, TAX);
    const mec = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, { ...TAX, isMec: true });

    expect(nonMec.years.every((y) => y.taxableDistribution === 0)).toBe(true);
    expect(mec.years.some((y) => y.taxableDistribution > 0)).toBe(true);
  });

  it('adds the 10% additional tax before 59 and a half, and not after', () => {
    const young = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, { ...TAX, isMec: true, ownerAgeAtStart: 50 });
    const older = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, { ...TAX, isMec: true, ownerAgeAtStart: 62 });
    expect(young.years.some((y) => y.penaltyTax > 0)).toBe(true);
    expect(older.years.every((y) => y.penaltyTax === 0)).toBe(true);
  });
});

describe('what is a carrier quote and what is mechanics', () => {
  it('names the charged rate as quoted, and the collateral rate only for a fixed loan', () => {
    const s = states({ years: 5, startValue: 1_000_000, creditPct: 6, draw: 20_000, drawFrom: 1 });
    const fixed = runPolicyLoanMechanics(s, { type: 'fixed', chargedRatePct: 5, collateralCreditRatePct: 3 }, TAX);
    const part = runPolicyLoanMechanics(s, { type: 'participating', chargedRatePct: 5 }, TAX);

    expect(fixed.carrierQuoted.join(' ')).toMatch(/charged loan rate/);
    expect(fixed.carrierQuoted.join(' ')).toMatch(/held collateral/);
    // A participating loan has no declared collateral rate to quote — it earns
    // the index, which the platform already models.
    expect(part.carrierQuoted.join(' ')).not.toMatch(/held collateral/);
  });

  it('warns that a wash loan may be a current practice rather than a guarantee', () => {
    const s = states({ years: 5, startValue: 1_000_000, creditPct: 6, draw: 20_000, drawFrom: 1 });
    const r = runPolicyLoanMechanics(s, { type: 'wash', chargedRatePct: 5 }, TAX);
    expect(r.notes.join(' ')).toMatch(/contractually guaranteed/);
  });
});
