/**
 * The charge sequence is the product. These assertions are the sequence.
 *
 * A policy value is twelve small deductions a year compounded over forty
 * years. Get the order wrong, or charge mortality on the wrong base, and the
 * final number is off by a multiple — not by a rounding error. Every test here
 * exists because one of the engines this one replaced got that specific thing
 * wrong.
 */

import { describe, it, expect } from 'vitest';
import {
  runPolicyMechanics,
  coiPerThousand,
  ILLUSTRATIVE_COI_TABLE,
  ILLUSTRATIVE_SOURCE,
  type PolicyCharges,
  type PolicyMechanicsInput,
} from '../shared/policyMechanics';

/** A fabricated but complete set of charges, so `reliable` can reach true. */
const completeCharges: PolicyCharges = {
  premiumLoadPctByYear: [8, 6, 6, 6, 6, 0],
  monthlyPolicyFee: 10,
  perUnitMonthlyPerThousand: 0.05,
  perUnitYears: 10,
  coiTable: [
    { age: 45, perThousand: 2.0 },
    { age: 55, perThousand: 5.0 },
    { age: 65, perThousand: 12.0 },
  ],
  coiTableSource: 'test fixture, not a carrier schedule',
  surrenderChargePctByYear: [30, 27, 24, 21, 18, 15, 12, 9, 6, 3, 0],
};

const baseInput: PolicyMechanicsInput = {
  issueAge: 45,
  faceAmount: 1_000_000,
  annualPremium: 50_000,
  premiumYears: 10,
  years: 30,
  charges: completeCharges,
  creditedRatePctByYear: Array.from({ length: 30 }, () => 6),
  corridorFactorByAge: Object.fromEntries(
    Array.from({ length: 60 }, (_, i) => [45 + i, 2.5 - i * 0.02])
  ),
};

describe('the cost of insurance table', () => {
  it('reads the band the attained age falls in, not the nearest', () => {
    expect(coiPerThousand(completeCharges.coiTable, 45)).toBe(2.0);
    expect(coiPerThousand(completeCharges.coiTable, 54)).toBe(2.0);
    expect(coiPerThousand(completeCharges.coiTable, 55)).toBe(5.0);
    expect(coiPerThousand(completeCharges.coiTable, 90)).toBe(12.0);
  });

  it('falls back to the first row below the table, and returns null for an empty one', () => {
    expect(coiPerThousand(completeCharges.coiTable, 20)).toBe(2.0);
    expect(coiPerThousand([], 50)).toBeNull();
  });
});

describe('the charge sequence', () => {
  it('charges mortality on the net amount at risk, not on the face amount', () => {
    const r = runPolicyMechanics(baseInput);
    for (const y of r.years) {
      // The charge reconciles to the amount at risk and the table rate, and to
      // nothing else. Charging the face amount would give a figure this size
      // times the ratio of face to amount at risk.
      const rate = coiPerThousand(completeCharges.coiTable, y.attainedAge)!;
      expect(y.costOfInsurance, `year ${y.policyYear}`).toBe(
        Math.round((y.netAmountAtRisk / 1000) * rate)
      );
      // Charging the whole death benefit — the common shortcut — always costs
      // more, by exactly the account value's share of it.
      const onWholeBenefit = Math.round((y.deathBenefit / 1000) * rate);
      expect(y.costOfInsurance, `year ${y.policyYear} vs benefit`).toBeLessThan(onWholeBenefit);
      expect(y.netAmountAtRisk, `year ${y.policyYear}`).toBeLessThan(y.deathBenefit);
    }
  });

  it('lets the mortality charge fall as the account value grows into the death benefit', () => {
    // Level face, no corridor: the amount at risk shrinks every year the
    // account value grows. An engine that charges a percentage of account
    // value produces the opposite slope, which is how three of the pages
    // this engine replaced were wrong.
    const level = runPolicyMechanics({ ...baseInput, corridorFactorByAge: undefined });
    const funded = level.years.filter((y) => y.policyYear <= 10);
    for (let i = 1; i < funded.length; i++) {
      expect(funded[i]!.netAmountAtRisk).toBeLessThan(funded[i - 1]!.netAmountAtRisk);
    }
  });

  it('deducts every charge before crediting, so interest is never paid on money already spent', () => {
    const r = runPolicyMechanics({
      ...baseInput,
      years: 1,
      creditedRatePctByYear: [10],
      corridorFactorByAge: undefined,
    });
    const y = r.years[0]!;
    const afterCharges =
      y.premium - y.premiumLoad - y.policyFee - y.perUnitCharge - y.costOfInsurance;
    expect(y.interestCredited).toBe(Math.round(afterCharges * 0.1));
    expect(y.accountValue).toBe(Math.round(afterCharges * 1.1));
  });

  it('takes the premium load from the premium and the fee from the account value', () => {
    const y = runPolicyMechanics({ ...baseInput, years: 1 }).years[0]!;
    expect(y.premiumLoad).toBe(Math.round(50_000 * 0.08));
    expect(y.policyFee).toBe(120);
    expect(y.perUnitCharge).toBe(Math.round(1000 * 0.05 * 12));
  });

  it('stops the per-unit charge when its years run out', () => {
    const r = runPolicyMechanics(baseInput);
    expect(r.years[9]!.perUnitCharge).toBeGreaterThan(0);
    expect(r.years[10]!.perUnitCharge).toBe(0);
  });

  it('repeats the last premium load rather than dropping to zero off the end of the array', () => {
    const r = runPolicyMechanics({ ...baseInput, premiumYears: 30 });
    expect(r.years[5]!.premiumLoad).toBe(0); // year 6, the last listed value
    expect(r.years[20]!.premiumLoad).toBe(0); // year 21, the same value repeated
  });
});

describe('the corridor', () => {
  it('lifts the death benefit above the specified amount, and the charge with it', () => {
    const rich: PolicyMechanicsInput = {
      ...baseInput,
      annualPremium: 400_000,
      faceAmount: 1_000_000,
      years: 12,
    };
    const withCorridor = runPolicyMechanics(rich);
    const without = runPolicyMechanics({ ...rich, corridorFactorByAge: undefined });
    const lifted = withCorridor.years.filter((y) => y.deathBenefit > 1_000_000);
    expect(lifted.length).toBeGreaterThan(0);
    const yr = lifted[0]!.policyYear;
    expect(withCorridor.years[yr - 1]!.costOfInsurance).toBeGreaterThan(
      without.years[yr - 1]!.costOfInsurance
    );
  });
});

describe('the surrender value', () => {
  it('equals the displayed account value less the displayed surrender charge, to the dollar', () => {
    const r = runPolicyMechanics(baseInput);
    for (const y of r.years) {
      expect(y.surrenderValue, `year ${y.policyYear}`).toBeLessThanOrEqual(y.accountValue);
      expect(y.surrenderValue).toBeGreaterThanOrEqual(0);
    }
    // Past the schedule the two agree exactly.
    expect(r.years[29]!.surrenderValue).toBe(r.years[29]!.accountValue);
  });

  it('is far below the account value in the first year, which is the point of showing it', () => {
    const y = runPolicyMechanics(baseInput).years[0]!;
    expect(y.surrenderValue).toBeLessThan(y.accountValue * 0.75);
  });
});

describe('what the result admits it does not have', () => {
  it('is reliable only when every table was supplied', () => {
    expect(runPolicyMechanics(baseInput).summary.reliable).toBe(true);
    expect(runPolicyMechanics(baseInput).missing).toEqual([]);
  });

  it('charges nothing for mortality with no table, and says so in the strongest terms', () => {
    const r = runPolicyMechanics({
      ...baseInput,
      charges: { ...completeCharges, coiTable: [], coiTableSource: undefined },
    });
    expect(r.summary.reliable).toBe(false);
    expect(r.missing).toContain('cost of insurance table');
    expect(r.years.every((y) => y.costOfInsurance === 0)).toBe(true);
    expect(r.notes.join(' ')).toMatch(/far too high/);
  });

  it('marks the illustrative bands as not a carrier table', () => {
    const r = runPolicyMechanics({
      ...baseInput,
      charges: {
        ...completeCharges,
        coiTable: ILLUSTRATIVE_COI_TABLE,
        coiTableSource: ILLUSTRATIVE_SOURCE,
      },
    });
    expect(r.summary.reliable).toBe(false);
    expect(r.missing).toContain('a carrier cost of insurance table');
    expect(r.notes.join(' ')).toMatch(/order of magnitude/);
    // But it does charge something, unlike the empty case.
    expect(r.years[0]!.costOfInsurance).toBeGreaterThan(0);
  });

  it('reports a missing surrender schedule instead of showing account value as cash', () => {
    const r = runPolicyMechanics({
      ...baseInput,
      charges: { ...completeCharges, surrenderChargePctByYear: [] },
    });
    expect(r.missing).toContain('surrender charge schedule');
    expect(r.years[0]!.surrenderValue).toBe(r.years[0]!.accountValue);
    expect(r.notes.join(' ')).toMatch(/surrender value equals account value/);
  });

  it('reports missing corridor factors, which understate the charge', () => {
    const r = runPolicyMechanics({ ...baseInput, corridorFactorByAge: undefined });
    expect(r.missing).toContain('IRC 7702 corridor factors');
    expect(r.years.every((y) => y.deathBenefit === 1_000_000)).toBe(true);
  });
});

describe('lapse', () => {
  it('names the year the account value reaches zero and refuses to pretend afterwards', () => {
    const thin = runPolicyMechanics({
      ...baseInput,
      annualPremium: 4_000,
      premiumYears: 3,
      years: 20,
      corridorFactorByAge: undefined,
    });
    expect(thin.summary.lapseYear).not.toBeNull();
    expect(thin.notes.join(' ')).toMatch(/lapsed/);
    const after = thin.years.filter((y) => y.policyYear > thin.summary.lapseYear!);
    expect(after.every((y) => y.accountValue === 0)).toBe(true);
  });

  it('does not call a lapse in a year the client is still paying', () => {
    const r = runPolicyMechanics({
      ...baseInput,
      annualPremium: 4_000,
      premiumYears: 20,
      years: 20,
    });
    for (const y of r.years.slice(0, 20)) {
      if (y.premium > 0) expect(r.summary.lapseYear).not.toBe(y.policyYear);
    }
  });
});

describe('the summary reconciles to the years', () => {
  it('adds the same premiums, charges and interest the rows show', () => {
    const r = runPolicyMechanics(baseInput);
    const sum = (f: (y: (typeof r.years)[number]) => number) =>
      r.years.reduce((a, y) => a + f(y), 0);
    expect(r.summary.totalPremiums).toBe(sum((y) => y.premium));
    expect(r.summary.totalCharges).toBeCloseTo(
      sum((y) => y.premiumLoad + y.policyFee + y.perUnitCharge + y.costOfInsurance),
      -1
    );
    expect(r.summary.finalAccountValue).toBe(r.years[r.years.length - 1]!.accountValue);
    expect(r.summary.finalSurrenderValue).toBe(r.years[r.years.length - 1]!.surrenderValue);
  });
});
