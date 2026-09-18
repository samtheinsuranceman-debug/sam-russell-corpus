/**
 * The round trip is the proof.
 *
 * Build a ledger from charges we chose, hand only the ledger to the solver,
 * and see whether it hands the charges back. Where it does, the method works.
 * Where it cannot — and there are cases where it structurally cannot — the
 * result has to say so rather than return a confident wrong number.
 */

import { describe, it, expect } from 'vitest';
import {
  runPolicyMechanics,
  ILLUSTRATIVE_COI_TABLE,
  type PolicyCharges,
} from '../shared/policyMechanics';
import {
  calibrateFromIllustration,
  exactChargesFromLedger,
  chargesFromCalibration,
  type LedgerYear,
} from '../shared/illustrationCalibration';

/** The charges we will hide from the solver and ask it to find. */
const TRUTH: PolicyCharges = {
  premiumLoadPctByYear: [7],
  monthlyPolicyFee: 15,
  perUnitMonthlyPerThousand: 0,
  perUnitYears: 0,
  coiTable: ILLUSTRATIVE_COI_TABLE.map((r) => ({ age: r.age, perThousand: r.perThousand * 1.4 })),
  surrenderChargePctByYear: [30, 26, 22, 18, 14, 10, 6, 3, 0],
};

const RATE = 6.54;

function makeLedger(opts: {
  issueAge: number; face: number; premium: number; premiumYears: number; years: number;
  charges?: PolicyCharges;
}): LedgerYear[] {
  const r = runPolicyMechanics({
    issueAge: opts.issueAge,
    faceAmount: opts.face,
    annualPremium: opts.premium,
    premiumYears: opts.premiumYears,
    years: opts.years,
    charges: opts.charges ?? TRUTH,
    creditedRatePctByYear: Array.from({ length: opts.years }, () => RATE),
  });
  return r.years.map((y) => ({
    policyYear: y.policyYear,
    attainedAge: y.attainedAge,
    premium: y.premium,
    accountValue: y.accountValue,
    surrenderValue: y.surrenderValue,
    deathBenefit: y.deathBenefit,
  }));
}

const rates = (n: number) => Array.from({ length: n }, () => RATE);

describe('what comes out of a ledger exactly', () => {
  it('recovers the total charges for every year without fitting anything', () => {
    const ledger = makeLedger({ issueAge: 45, face: 1_000_000, premium: 50_000, premiumYears: 10, years: 30 });
    const exact = exactChargesFromLedger({
      ledger, faceAmount: 1_000_000, creditedRatePctByYear: rates(30),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });

    // Rebuild what the engine actually charged, and compare.
    const truthRun = runPolicyMechanics({
      issueAge: 45, faceAmount: 1_000_000, annualPremium: 50_000,
      premiumYears: 10, years: 30, charges: TRUTH, creditedRatePctByYear: rates(30),
    });
    truthRun.years.forEach((t, i) => {
      const actual = t.premiumLoad + t.policyFee + t.perUnitCharge + t.costOfInsurance;
      // Within a dollar or two — the ledger is rounded to whole dollars.
      expect(exact[i]!.totalCharges, `year ${t.policyYear}`).toBeCloseTo(actual, -1);
    });
  });

  it('recovers the surrender charge schedule exactly, with no fitting', () => {
    const ledger = makeLedger({ issueAge: 45, face: 1_000_000, premium: 50_000, premiumYears: 10, years: 12 });
    const cal = calibrateFromIllustration({
      ledger, faceAmount: 1_000_000, creditedRatePctByYear: rates(12),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });
    TRUTH.surrenderChargePctByYear.forEach((pct, i) => {
      expect(cal.surrenderChargePctByYear[i], `year ${i + 1}`).toBeCloseTo(pct, 0);
    });
  });

  it('reads corridor factors off the death benefit column where the corridor binds', () => {
    const corridor: Record<number, number> = {};
    for (let a = 45; a < 100; a++) corridor[a] = Math.max(1, 2.5 - (a - 45) * 0.03);
    const r = runPolicyMechanics({
      issueAge: 45, faceAmount: 1_000_000, annualPremium: 200_000, premiumYears: 10,
      years: 25, charges: TRUTH, creditedRatePctByYear: rates(25), corridorFactorByAge: corridor,
    });
    const ledger: LedgerYear[] = r.years.map((y) => ({
      policyYear: y.policyYear, attainedAge: y.attainedAge, premium: y.premium,
      accountValue: y.accountValue, surrenderValue: y.surrenderValue, deathBenefit: y.deathBenefit,
    }));
    const cal = calibrateFromIllustration({
      ledger, faceAmount: 1_000_000, creditedRatePctByYear: rates(25),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });
    const found = Object.keys(cal.corridorFactorByAge);
    expect(found.length).toBeGreaterThan(0);
    for (const age of found) {
      expect(cal.corridorFactorByAge[Number(age)]).toBeCloseTo(corridor[Number(age)]!, 1);
    }
  });
});

describe('the fitted split', () => {
  it('recovers load, fixed charge and mortality scale on a max-funded ledger', () => {
    // Premiums stop at year 10 and the amount at risk collapses — both
    // confounds are broken, so all three components should come back.
    const ledger = makeLedger({ issueAge: 45, face: 1_000_000, premium: 50_000, premiumYears: 10, years: 30 });
    const cal = calibrateFromIllustration({
      ledger, faceAmount: 1_000_000, creditedRatePctByYear: rates(30),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });

    expect(cal.fit.premiumLoadPct.value).toBeCloseTo(7, 0);
    expect(cal.fit.fixedAnnualCharge.value).toBeCloseTo(180, -2);
    expect(cal.fit.coiScale.value).toBeCloseTo(1.4, 1);
    expect(cal.fit.premiumLoadPct.confidence).toBe('identified');
    expect(cal.fit.coiScale.confidence).toBe('identified');
    // And it reproduces the exact totals closely.
    expect(cal.residualRms).toBeLessThan(200);
  });

  it('round-trips: the fitted charges reproduce the ledger they came from', () => {
    const ledger = makeLedger({ issueAge: 45, face: 1_000_000, premium: 50_000, premiumYears: 10, years: 30 });
    const cal = calibrateFromIllustration({
      ledger, faceAmount: 1_000_000, creditedRatePctByYear: rates(30),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });
    const rebuilt = runPolicyMechanics({
      issueAge: 45, faceAmount: 1_000_000, annualPremium: 50_000, premiumYears: 10, years: 30,
      charges: chargesFromCalibration(cal, ILLUSTRATIVE_COI_TABLE),
      creditedRatePctByYear: rates(30),
    });
    const target = ledger[ledger.length - 1]!.accountValue;
    const got = rebuilt.summary.finalAccountValue;
    // Within 1% of the thirty-year value it was fitted to.
    expect(Math.abs(got - target) / target).toBeLessThan(0.01);
  });
});

describe('what the solver refuses to pretend it knows', () => {
  it('flags the load as confounded when the premium never changes', () => {
    // Level premium for the whole ledger: a percentage of it and a flat fee
    // are the same constant, and no arithmetic can separate them.
    const ledger = makeLedger({ issueAge: 45, face: 1_000_000, premium: 25_000, premiumYears: 30, years: 30 });
    const cal = calibrateFromIllustration({
      ledger, faceAmount: 1_000_000, creditedRatePctByYear: rates(30),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });
    expect(cal.fit.premiumLoadPct.confidence).toBe('confounded');
    expect(cal.fit.fixedAnnualCharge.confidence).toBe('confounded');
    expect(cal.nextUpload.join(' ')).toMatch(/after the premiums stop/);
  });

  it('flags mortality as weak or confounded on a thin design where the amount at risk barely moves', () => {
    const ledger = makeLedger({ issueAge: 45, face: 1_000_000, premium: 8_000, premiumYears: 30, years: 30 });
    const cal = calibrateFromIllustration({
      ledger, faceAmount: 1_000_000, creditedRatePctByYear: rates(30),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });
    expect(cal.fit.coiScale.confidence).not.toBe('identified');
    expect(cal.nextUpload.join(' ')).toMatch(/max-funded/);
  });

  it('always asks for a second face amount, because the fee and per-unit charge never separate from one ledger', () => {
    const ledger = makeLedger({ issueAge: 45, face: 1_000_000, premium: 50_000, premiumYears: 10, years: 30 });
    const cal = calibrateFromIllustration({
      ledger, faceAmount: 1_000_000, creditedRatePctByYear: rates(30),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });
    expect(cal.nextUpload.join(' ')).toMatch(/different face amount/);
    // And it parks the undivided total on the fee rather than splitting it blind.
    const charges = chargesFromCalibration(cal, ILLUSTRATIVE_COI_TABLE);
    expect(charges.perUnitMonthlyPerThousand).toBe(0);
  });

  it('asks for the surrender and death benefit columns when they are absent', () => {
    const bare = makeLedger({ issueAge: 45, face: 1_000_000, premium: 50_000, premiumYears: 10, years: 20 })
      .map((y) => ({ policyYear: y.policyYear, attainedAge: y.attainedAge, premium: y.premium, accountValue: y.accountValue }));
    const cal = calibrateFromIllustration({
      ledger: bare, faceAmount: 1_000_000, creditedRatePctByYear: rates(20),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });
    expect(cal.surrenderChargePctByYear).toEqual([]);
    expect(cal.corridorFactorByAge).toEqual({});
    expect(cal.nextUpload.join(' ')).toMatch(/surrender value column/);
    expect(cal.nextUpload.join(' ')).toMatch(/death benefit column/);
  });

  it('shows a large residual when the product carries a charge this shape cannot describe', () => {
    // A persistency credit from year 11 is not load, fee or mortality.
    const withCredit: PolicyCharges = { ...TRUTH, persistencyCreditPct: 0.6, persistencyCreditFromYear: 11 };
    const ledger = makeLedger({ issueAge: 45, face: 1_000_000, premium: 50_000, premiumYears: 10, years: 30, charges: withCredit });
    const cal = calibrateFromIllustration({
      ledger, faceAmount: 1_000_000, creditedRatePctByYear: rates(30),
      referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });
    const clean = calibrateFromIllustration({
      ledger: makeLedger({ issueAge: 45, face: 1_000_000, premium: 50_000, premiumYears: 10, years: 30 }),
      faceAmount: 1_000_000, creditedRatePctByYear: rates(30), referenceCoiTable: ILLUSTRATIVE_COI_TABLE,
    });
    expect(cal.residualRms).toBeGreaterThan(clean.residualRms * 3);
    expect(cal.notes.join(' ')).toMatch(/persistency credit|asset charge|rider/);
  });
});
