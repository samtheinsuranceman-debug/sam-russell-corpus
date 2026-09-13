/**
 * The loan engine's own arithmetic is loans. The policy underneath it is the
 * shared engine, and these tests hold that seam in place: the charges the loan
 * columns are built on are the same charges every other tool deducts, and the
 * result says out loud which of them were never sourced.
 */

import { describe, it, expect } from 'vitest';
import {
  optimizePolicyLoans,
  DEFAULT_LOAN_MODEL_CHARGES,
  type PolicyLoanInput,
} from '../shared/policyLoanOptimizer';
import { stepPolicyYear, ILLUSTRATIVE_SOURCE } from '../shared/policyMechanics';

const base: PolicyLoanInput = {
  currentCashValue: 250_000,
  currentAge: 50,
  retirementAge: 65,
  illustratedRate: 0.06,
  loanRate: 0.05,
  loanType: 'wash',
  annualIncomeNeeded: 80_000,
  maxLoanToValue: 0.9,
  projectionYears: 30,
  annualPremium: 50_000,
  premiumYearsRemaining: 5,
  deathBenefit: 1_000_000,
};

describe('the policy under the loans', () => {
  it('deducts exactly what the shared engine deducts in year one', () => {
    const r = optimizePolicyLoans(base);
    const y1 = r.years[0]!;
    const step = stepPolicyYear({
      accountValue: base.currentCashValue,
      policyYear: 1,
      attainedAge: base.currentAge + 1,
      premium: base.annualPremium,
      faceAmount: base.deathBenefit,
      charges: DEFAULT_LOAN_MODEL_CHARGES,
      creditedRatePct: base.illustratedRate * 100,
    });
    const expected =
      step.row.premiumLoad + step.row.policyFee + step.row.perUnitCharge + step.row.costOfInsurance;
    expect(y1.charges).toBe(Math.round(expected));
    expect(y1.interest).toBe(step.row.interestCredited);
  });

  it('charges mortality on the net amount at risk, so the charge falls as cash value rises', () => {
    // No distributions, so cash value only grows. An engine charging a
    // percentage of account value would produce a rising charge here.
    // No premium, so no load: the only charges moving are the fee (flat) and
    // the cost of insurance.
    const r = optimizePolicyLoans({
      ...base,
      currentCashValue: 400_000,
      annualPremium: 0,
      premiumYearsRemaining: 0,
      retirementAge: 84,
      projectionYears: 20,
    });
    // Ages 51-60 sit inside one band of the illustrative table, so the rate per
    // thousand is constant and only the amount at risk moves. It falls every
    // year, and the charge with it. (Across a band boundary the charge jumps —
    // which is the coarseness of five bands, and why they are flagged.)
    const oneBand = r.years.filter((y) => y.age >= 51 && y.age <= 60);
    expect(oneBand.length).toBe(10);
    for (let i = 1; i < oneBand.length; i++) {
      expect(oneBand[i]!.charges, `year ${oneBand[i]!.year}`).toBeLessThan(oneBand[i - 1]!.charges);
    }
  });
});

describe('what the loan projection admits', () => {
  it('flags the illustrative mortality bands and the absent surrender schedule', () => {
    const r = optimizePolicyLoans(base);
    expect(r.mechanics.reliable).toBe(false);
    expect(r.mechanics.missing).toContain('a carrier cost of insurance table');
    expect(r.mechanics.missing).toContain('surrender charge schedule');
    expect(DEFAULT_LOAN_MODEL_CHARGES.coiTableSource).toBe(ILLUSTRATIVE_SOURCE);
  });

  it('says no AG 49 ceiling was checked when none was supplied', () => {
    const r = optimizePolicyLoans(base);
    expect(r.mechanics.missing).toContain('the carrier AG 49 maximum illustrated rate');
    expect(r.mechanics.notes.join(' ')).toMatch(/not a constant/);
  });

  it('names the violation when the illustrated rate is above the carrier maximum', () => {
    const r = optimizePolicyLoans({
      ...base,
      illustratedRate: 0.12,
      maximumIllustratedRate: 5.8,
    });
    expect(r.mechanics.missing).toContain('an illustrated rate within the AG 49 maximum');
    expect(r.mechanics.notes.join(' ')).toMatch(/AG 49/);
    expect(r.mechanics.notes.join(' ')).toMatch(/could not be shown to a client/);
  });

  it('is clean when a full carrier schedule and a ceiling are supplied', () => {
    const r = optimizePolicyLoans({
      ...base,
      maximumIllustratedRate: 6.5,
      charges: {
        premiumLoadPctByYear: [6, 6, 6, 6, 6, 0],
        monthlyPolicyFee: 10,
        perUnitMonthlyPerThousand: 0.04,
        perUnitYears: 10,
        coiTable: [
          { age: 50, perThousand: 3 },
          { age: 65, perThousand: 11 },
        ],
        coiTableSource: 'test fixture rate sheet',
        surrenderChargePctByYear: [25, 20, 15, 10, 5, 0],
      },
    });
    expect(r.mechanics.reliable).toBe(true);
    expect(r.mechanics.missing).toEqual([]);
  });
});

describe('the distribution phase still behaves', () => {
  it('takes no loan before the retirement age and some after', () => {
    const r = optimizePolicyLoans(base);
    const before = r.years.filter((y) => y.age < base.retirementAge);
    expect(before.every((y) => y.loanTaken === 0)).toBe(true);
    expect(r.years.some((y) => y.age >= base.retirementAge && y.loanTaken > 0)).toBe(true);
  });

  it('never lends past the stated loan-to-value limit', () => {
    const r = optimizePolicyLoans(base);
    for (const y of r.years) {
      if (y.endingCV > 0 && y.lapseRisk !== 'danger') {
        expect(y.loanToValueRatio, `year ${y.year}`).toBeLessThanOrEqual(0.96);
      }
    }
  });
});
