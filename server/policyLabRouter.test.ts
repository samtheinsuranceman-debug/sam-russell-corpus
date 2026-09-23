/**
 * The seam between the engines and a human.
 *
 * Seven engines were correct and invisible. These tests hold the wiring open:
 * that the router serves the real charge structure rather than a band, that it
 * projects on the derived mortality curve, and that it says so when a
 * projection runs past the evidence the curve came from.
 */

import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import { chargesFromBaseline } from './policyLabRouter';
import { MUTUAL_A_BASELINE } from '../shared/costStructure';

const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any } as any);

describe('the carrier basis reaches the page', () => {
  it('serves Mutual Company A with the charges read off the cost summary', async () => {
    const r = await caller.policyLab.carriers();
    const a = r.complete[0]!;
    expect(a.label).toBe('Mutual Company A');
    expect(a.percentOfPremiumByYear[0]).toBe(2.0);
    expect(a.percentOfPremiumByYear[1]).toBe(6.0);
    expect(a.perPolicyMonthly).toBe(10);
    expect(a.perThousandAnnual).toBeCloseTo(7.783, 3);
    expect(a.perThousandYears).toBe(10);
    expect(a.indexedStrategyPctOfAv).toBeCloseTo(0.189, 3);
    expect(a.source).toMatch(/Annual Cost Summary/);
  });

  it('carries the real mortality curve and its age coverage', async () => {
    const a = (await caller.policyLab.carriers()).complete[0]!;
    expect(a.coi.fromAge).toBe(64);
    expect(a.coi.toAge).toBe(83);
    expect(a.coi.rows).toHaveLength(20);
    // Rising throughout, as any mortality curve must.
    for (let i = 1; i < a.coi.rows.length; i++) {
      expect(a.coi.rows[i]!.perThousand).toBeGreaterThan(a.coi.rows[i - 1]!.perThousand);
    }
  });

  it('keeps the caveat that the curve is one sex and one class', async () => {
    const a = (await caller.policyLab.carriers()).complete[0]!;
    expect(a.caveats.join(' ')).toMatch(/ONE sex, ONE issue age and ONE risk class/);
  });

  it('serves Mutual Company B with the charges read off its Charges Report', async () => {
    const r = await caller.policyLab.carriers();
    expect(r.complete).toHaveLength(2);
    const b = r.complete[1]!;
    expect(b.label).toBe('Mutual Company B');
    expect(b.creditingTarget).toBe('cash-value');
    expect(b.percentOfPremiumByYear.slice(0, 2)).toEqual([8.0, 6.5]);
    expect(b.perPolicyMonthly).toBe(5);
    expect(b.perThousandAnnual).toBeCloseTo(6.79, 2);
    expect(b.perThousandYears).toBe(10);
    expect(b.bonusInterestPctOfCashValue).toBe(0.6);
    expect(b.bonusInterestFromYear).toBe(11);
    expect(b.surrenderPerThousandByYear[0]).toBe(51.49);
    expect(b.coi.fromAge).toBe(64);
    expect(b.coi.toAge).toBe(83);
    expect(b.source).toMatch(/Charges Report/);
  });

  it('reports only C as pending now that B has its cost summary', async () => {
    const r = await caller.policyLab.carriers();
    expect(r.pending).toHaveLength(1);
    expect(r.pending[0]!.carrierId).toBe('mutual-c');
    expect(r.pending.find((p) => p.carrierId === 'mutual-b')).toBeUndefined();
  });

  it('projects on B when asked, and names B as the basis', async () => {
    const r = await caller.policyLab.project({
      issueAge: 64, faceAmount: 2_918_696, annualPremium: 300_000,
      premiumYears: 5, years: 10, creditedRatePct: 6.6, carrierId: 'mutual-b',
    });
    expect(r.basis.carrier).toBe('Mutual Company B');
    expect(r.basis.source).toMatch(/Charges Report/);
    // B's surrender charge falls every year from the first, unlike A's flat three.
    const charges = r.years.map((y) => y.accountValue - y.surrenderValue);
    expect(charges[0]).toBeGreaterThan(charges[1]!);
    expect(charges[1]).toBeGreaterThan(charges[2]!);
  });
});

describe('projecting on real charges', () => {
  it('uses the derived surrender basis, so the charge is flat in years 1-3', async () => {
    const r = await caller.policyLab.project({
      issueAge: 63, faceAmount: 4_755_883, annualPremium: 480_000,
      premiumYears: 5, years: 5, creditedRatePct: 6.75,
    });
    const charges = r.years.map((y) => y.accountValue - y.surrenderValue);
    expect(charges[0]).toBe(charges[1]);
    expect(charges[1]).toBe(charges[2]);
    // And it is no longer reported as a missing schedule.
    expect(r.missing).not.toContain('surrender charge schedule');
  });

  it('names the document the charges came from', async () => {
    const r = await caller.policyLab.project({
      issueAge: 63, faceAmount: 4_755_883, annualPremium: 480_000,
      premiumYears: 5, years: 10, creditedRatePct: 6.75,
    });
    expect(r.basis.carrier).toBe('Mutual Company A');
    expect(r.basis.source).toMatch(/Annual Cost Summary/);
    expect(r.basis.coiCoverage).toEqual({ fromAge: 64, toAge: 83 });
  });

  it('flags a projection that runs past the ages the curve covers', async () => {
    // Issue 40 for 40 years reaches well outside 64-83 at both ends.
    const r = await caller.policyLab.project({
      issueAge: 40, faceAmount: 1_000_000, annualPremium: 50_000,
      premiumYears: 10, years: 40, creditedRatePct: 6.75,
    });
    expect(r.basis.extrapolatedBeyondCoiTable).toBe(true);
    expect(r.basis.extrapolationNote).toMatch(/64 to 83/);
    expect(r.basis.extrapolationNote).toMatch(/one sex and one underwriting class/);
  });

  it('does not flag a projection that stays inside them', async () => {
    const r = await caller.policyLab.project({
      issueAge: 63, faceAmount: 4_755_883, annualPremium: 480_000,
      premiumYears: 5, years: 20, creditedRatePct: 6.75,
    });
    expect(r.basis.extrapolatedBeyondCoiTable).toBe(false);
    expect(r.basis.extrapolationNote).toBeNull();
  });

  it('charges mortality on the net amount at risk, falling as value builds', async () => {
    const r = await caller.policyLab.project({
      issueAge: 63, faceAmount: 4_755_883, annualPremium: 480_000,
      premiumYears: 5, years: 15, creditedRatePct: 6.75,
    });
    const later = r.years.slice(5);
    for (let i = 1; i < later.length; i++) {
      expect(later[i]!.netAmountAtRisk).toBeLessThan(later[i - 1]!.netAmountAtRisk);
    }
  });
});

describe('the loan comparison', () => {
  it('returns all three types with the wash costing nothing', async () => {
    const r = await caller.policyLab.loans({
      startingCashValue: 2_600_000, annualDraw: 150_000, years: 25, attainedAge: 73,
      creditedRatePct: 6.75, chargedRatePct: 5, collateralCreditRatePct: 3,
      cumulativePremiumsPaid: 2_100_000, isMec: false, ordinaryIncomeRatePct: 37,
      chargedInAdvance: false,
    });
    expect(r.wash.summary.totalNetCost).toBe(0);
    expect(r.fixed.summary.totalNetCost).toBeGreaterThan(0);
    expect(r.participating.summary.totalBorrowed).toBeGreaterThan(0);
  });

  it('reduces what reaches the client when interest is charged in advance', async () => {
    const base = {
      startingCashValue: 2_600_000, annualDraw: 150_000, years: 25, attainedAge: 73,
      creditedRatePct: 6.75, chargedRatePct: 5, collateralCreditRatePct: 3,
      cumulativePremiumsPaid: 2_100_000, isMec: false, ordinaryIncomeRatePct: 37,
    };
    const arrears = await caller.policyLab.loans({ ...base, chargedInAdvance: false });
    const advance = await caller.policyLab.loans({ ...base, chargedInAdvance: true });
    expect(arrears.fixed.summary.totalCashReceived).toBe(arrears.fixed.summary.totalBorrowed);
    expect(advance.fixed.summary.totalCashReceived).toBeLessThan(advance.fixed.summary.totalBorrowed);
  });

  it('taxes MEC draws gain-first and non-MEC draws not at all', async () => {
    const base = {
      startingCashValue: 2_600_000, annualDraw: 150_000, years: 15, attainedAge: 73,
      creditedRatePct: 6.75, chargedRatePct: 5, collateralCreditRatePct: 3,
      cumulativePremiumsPaid: 2_100_000, ordinaryIncomeRatePct: 37, chargedInAdvance: false,
    };
    const plain = await caller.policyLab.loans({ ...base, isMec: false });
    const mec = await caller.policyLab.loans({ ...base, isMec: true });
    expect(plain.wash.years.every((y) => y.taxableDistribution === 0)).toBe(true);
    expect(mec.wash.years.some((y) => y.taxableDistribution > 0)).toBe(true);
  });
});

describe('the statutory corridor and the gap register reach the page', () => {
  it('serves the corridor with its authority and verification flag', async () => {
    const r = await caller.policyLab.corridor();
    expect(r.authority).toMatch(/7702\(d\)\(2\)/);
    expect(r.verifiedAgainstPrimaryText).toBe(false);
    expect(r.byAge.find((x) => x.age === 45)!.applicablePercentage).toBe(215);
    expect(r.byAge.find((x) => x.age === 65)!.applicablePercentage).toBe(120);
  });

  it('ranks the remaining gaps and drops the ones already closed', async () => {
    const r = await caller.policyLab.gaps({ design: 'maxFunded' });
    expect(r.ranked[0]!.id).toBe('premium-load');
    const corridor = r.ranked.find((g) => g.id === 'corridor-factors')!;
    expect(corridor.status).toBe('closed');
  });
});

describe('the charge adapter', () => {
  it('puts the baseline into the shape the projection engine takes', () => {
    const c = chargesFromBaseline(MUTUAL_A_BASELINE);
    expect(c.monthlyPolicyFee).toBe(10);
    expect(c.perUnitMonthlyPerThousand).toBeCloseTo(7.783 / 12, 5);
    expect(c.coiTable).toHaveLength(20);
    expect(c.surrenderChargePerThousandByYear![0]).toBe(37.68);
    // The percentage basis is deliberately empty so the per-$1,000 one wins.
    expect(c.surrenderChargePctByYear).toEqual([]);
  });
});
