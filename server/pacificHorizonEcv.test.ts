/**
 * The first carrier on this platform with real terms, so these tests guard the
 * transcription rather than any arithmetic.
 *
 * Two things matter: the numbers match the documents, and the fields the
 * documents do not contain stay absent instead of drifting into plausible
 * placeholders.
 */

import { describe, it, expect } from 'vitest';
import {
  HORIZON_ACCOUNTS,
  HORIZON_CHARGES,
  HORIZON_LOANS,
  EPFR_DESIGNS,
  HORIZON_PUBLISHED_LOOKBACKS,
  HORIZON_INDEX_BENCHMARKS,
  accountById,
  modellableAccounts,
  cannotModel,
  PACIFIC_HORIZON_ECV,
} from '../shared/pacificHorizonEcv';

describe('the transcription', () => {
  it('carries one fixed and eight indexed accounts', () => {
    expect(HORIZON_ACCOUNTS).toHaveLength(9);
    expect(HORIZON_ACCOUNTS.filter((a) => a.index === 'FIXED')).toHaveLength(1);
  });

  it('has the premium load from the description page', () => {
    expect(HORIZON_CHARGES.premiumLoad.nonQualifiedPct).toBe(5.20);
    expect(HORIZON_CHARGES.premiumLoad.qualifiedPct).toBe(4.20);
    expect(HORIZON_CHARGES.premiumLoad.guaranteedMaximumPct).toBe(6.20);
    // The guaranteed maximum must exceed every current load, or the document
    // has been transcribed wrong.
    const l = HORIZON_CHARGES.premiumLoad;
    for (const cur of [l.nonQualifiedPct, l.qualifiedPct, l.internalNonQualifiedPct, l.internalQualifiedPct]) {
      expect(cur).toBeLessThan(l.guaranteedMaximumPct);
    }
  });

  it('has the $10 monthly administrative charge', () => {
    expect(HORIZON_CHARGES.monthlyAdministrativeCharge).toBe(10);
  });

  it('gives every account a floor at or above zero and a cap above its guarantee', () => {
    for (const a of HORIZON_ACCOUNTS) {
      expect(a.floorPct, a.id).toBeGreaterThanOrEqual(0);
      if (a.currentCapPct !== null && a.guaranteedCapPct !== null) {
        expect(a.currentCapPct, a.id).toBeGreaterThan(a.guaranteedCapPct);
      }
      expect(a.currentParticipationPct, a.id).toBeGreaterThanOrEqual(a.guaranteedParticipationPct);
    }
  });

  it('keeps the tenfold gap on the dynamic par account, which is its whole risk', () => {
    const a = accountById('ph-1yr-nocap-dynamic-par')!;
    expect(a.currentParticipationPct).toBe(50);
    expect(a.guaranteedParticipationPct).toBe(5);
    expect(a.note).toMatch(/declared as frequently as monthly/);
  });

  it('records the 2-year cap as a term cap, not an annual one', () => {
    const a = accountById('ph-2yr')!;
    expect(a.termYears).toBe(2);
    expect(a.currentCapPct).toBe(24.0);
    expect(a.note).toMatch(/over the full 2-year segment term/);
  });
});

describe('the loan terms', () => {
  it('makes the standard loan a contractual wash from year six, currently', () => {
    const s = HORIZON_LOANS.standard;
    expect(s.chargedRatePct).toBe(2.25);
    expect(s.creditedRatePctCurrentYears6Plus).toBe(2.25);
    expect(s.netCostCurrentYears6PlusPct).toBe(0);
    // And the arithmetic reconciles rather than being asserted separately.
    expect(s.chargedRatePct - s.creditedRatePctCurrentYears1to5).toBeCloseTo(s.netCostCurrentYears1to5Pct, 10);
    expect(s.chargedRatePct - s.creditedRatePctCurrentYears6Plus).toBeCloseTo(s.netCostCurrentYears6PlusPct, 10);
  });

  it('costs five times as much on the guaranteed basis', () => {
    const s = HORIZON_LOANS.standard;
    expect(s.chargedRatePct - s.creditedRatePctGuaranteedAllYears).toBeCloseTo(s.netCostGuaranteedPct, 10);
    expect(s.netCostGuaranteedPct / s.netCostCurrentYears1to5Pct).toBe(5);
  });

  it('leaves the alternate loan\'s current rate absent, because it is not published', () => {
    expect(HORIZON_LOANS.alternate.chargedRatePctCurrent).toBeNull();
    expect(HORIZON_LOANS.alternate.chargedRatePctGuaranteedMaximum).toBe(7.5);
  });

  it('keeps the carrier\'s own warning about the alternate loan verbatim', () => {
    expect(HORIZON_LOANS.alternate.carrierWarning).toMatch(/more volatile, and carry greater risk/);
  });
});

describe('the Enhanced Performance Factor Rider', () => {
  it('has three designs with factors and charges rising together', () => {
    expect(EPFR_DESIGNS).toHaveLength(3);
    for (let i = 1; i < EPFR_DESIGNS.length; i++) {
      expect(EPFR_DESIGNS[i]!.currentFactor).toBeGreaterThan(EPFR_DESIGNS[i - 1]!.currentFactor);
      expect(EPFR_DESIGNS[i]!.annualChargePct).toBeGreaterThan(EPFR_DESIGNS[i - 1]!.annualChargePct);
    }
  });

  it('reconciles the monthly charge to the annualized figure', () => {
    for (const d of EPFR_DESIGNS) {
      expect(d.monthlyChargePct * 12, d.id).toBeCloseTo(d.annualChargePct, 1);
    }
  });

  it('costs nothing on the Classic design, which is the guaranteed baseline', () => {
    const classic = EPFR_DESIGNS.find((d) => d.id === 'classic')!;
    expect(classic.currentFactor).toBe(1.0);
    expect(classic.guaranteedFactor).toBe(1.0);
    expect(classic.annualChargePct).toBe(0);
  });

  it('always guarantees less than it currently offers', () => {
    for (const d of EPFR_DESIGNS) {
      expect(d.guaranteedFactor, d.id).toBeLessThanOrEqual(d.currentFactor);
    }
  });
});

describe('Pacific Life\'s own published look-backs', () => {
  it('names a real account for every row', () => {
    for (const l of HORIZON_PUBLISHED_LOOKBACKS) {
      expect(accountById(l.accountId), l.accountId).not.toBeNull();
    }
  });

  it('orders best, average and worst consistently in every row', () => {
    for (const l of HORIZON_PUBLISHED_LOOKBACKS) {
      expect(l.bestPct, l.accountId).toBeGreaterThanOrEqual(l.averagePct);
      expect(l.averagePct, l.accountId).toBeGreaterThanOrEqual(l.worstPct);
    }
    for (const b of HORIZON_INDEX_BENCHMARKS) {
      expect(b.bestPct, b.index).toBeGreaterThanOrEqual(b.averagePct);
      expect(b.averagePct, b.index).toBeGreaterThanOrEqual(b.worstPct);
    }
  });

  it('shows the floor doing its work — every account beat its raw index at the worst', () => {
    // The point of a floor: the worst year of the account is far above the
    // worst of the index it tracks.
    const sp = HORIZON_INDEX_BENCHMARKS.find((b) => b.index.startsWith('S&P 500'))!;
    const spAccounts = HORIZON_PUBLISHED_LOOKBACKS.filter((l) => l.period === '1988-2023');
    for (const a of spAccounts) {
      expect(a.worstPct, a.accountId).toBeGreaterThan(sp.worstPct);
    }
  });

  it('shows the cap doing its work — the capped accounts trail the index at the best', () => {
    const sp = HORIZON_INDEX_BENCHMARKS.find((b) => b.index.startsWith('S&P 500'))!;
    const capped = ['ph-1yr', 'ph-1yr-high-cap'];
    for (const id of capped) {
      const l = HORIZON_PUBLISHED_LOOKBACKS.find((x) => x.accountId === id)!;
      expect(l.bestPct, id).toBeLessThan(sp.bestPct);
    }
  });
});

describe('what is refused, and why', () => {
  it('refuses the fixed account because its current rate is not published', () => {
    expect(cannotModel(accountById('ph-fixed')!)).toMatch(/not published/);
  });

  it('refuses the volatility control accounts for two reasons at once', () => {
    const reason = cannotModel(accountById('ph-1yr-vol-control')!)!;
    expect(reason).toMatch(/Endura/);
    expect(reason).toMatch(/participation rate is not published/);
  });

  it('refuses the QQQ account because the ETF is not the index', () => {
    expect(cannotModel(accountById('ph-1yr-qqq')!)).toMatch(/ETF's own fees and tracking/);
  });

  it('leaves exactly the five S&P accounts modellable, and agrees with cannotModel', () => {
    const ok = modellableAccounts();
    expect(ok.map((a) => a.id).sort()).toEqual([
      'ph-1yr', 'ph-1yr-high-cap', 'ph-1yr-nocap-dynamic-par', 'ph-2yr', 'ph-5yr-high-par',
    ]);
    expect(ok.every((a) => a.index === 'SP500_EX_DIV')).toBe(true);
    // The list and the reason function must never disagree — they did once.
    for (const a of HORIZON_ACCOUNTS) {
      expect(ok.includes(a), a.id).toBe(cannotModel(a) === null);
    }
  });

  it('marks the three charge schedules the documents do not contain', () => {
    expect(HORIZON_CHARGES.costOfInsurance.ratesHeld).toBe(false);
    expect(HORIZON_CHARGES.coverageCharge.ratesHeld).toBe(false);
    expect(HORIZON_CHARGES.surrenderCharge.scheduleHeld).toBe(false);
    // But the mechanic is recorded, and it is the one the engine implements.
    expect(HORIZON_CHARGES.costOfInsurance.basis).toMatch(/Net Amount at Risk/);
  });

  it('cites both source documents and the form series', () => {
    expect(PACIFIC_HORIZON_ECV.sources).toHaveLength(2);
    expect(PACIFIC_HORIZON_ECV.formSeries).toBe('P21IUL, S22ECV');
  });
});
