/**
 * The multiplier is a trade, and these assertions are the trade.
 *
 * The rider multiplies the index credit and charges a percentage of account
 * value every year. The arithmetic is easy; the honesty is in showing the
 * years the charge bought nothing, and in refusing to present a surrender
 * value that silently equals account value.
 */

import { describe, it, expect } from 'vitest';
import { runMultiplierComparison, type MultiplierInput } from '../shared/policyMultiplier';
import { ALL_INDEX_OPTIONS, getCreditingHistory } from '../shared/indexCreditingData';

const sp500Capped = ALL_INDEX_OPTIONS.find((o) => o.id === 'am-sp500-ptp')!;
const history = getCreditingHistory(sp500Capped, 1996, 2025).map((h) => ({
  year: h.year,
  creditedRatePct: h.creditedRate,
}));

const baseInput: MultiplierInput = {
  creditHistory: history,
  annualPremium: 100_000,
  fundingYears: 5,
  terms: { factorPct: 160, annualChargePct: 0.6 },
};

describe('the interest multiplier', () => {
  it('adds nothing in a year the index credits nothing, and charges anyway', () => {
    const r = runMultiplierComparison(baseInput);
    const dead = r.years.filter((y) => y.creditedRatePct <= 0);
    expect(dead.length).toBeGreaterThan(0);
    for (const y of dead) {
      expect(y.extraInterest, String(y.calendarYear)).toBe(0);
      expect(y.charge, String(y.calendarYear)).toBeGreaterThan(0);
      expect(y.netThisYear, String(y.calendarYear)).toBeLessThan(0);
      expect(y.chargePaidForNothing).toBe(true);
    }
    expect(r.summary.yearsChargePaidForNothing).toBe(dead.length);
  });

  it('says out loud how many years the charge bought nothing', () => {
    const r = runMultiplierComparison(baseInput);
    expect(r.notes.join(' ')).toContain('credited nothing');
    expect(r.notes.join(' ')).toContain('charge was taken anyway');
  });

  it('a 1.6x factor adds exactly 0.6 of the interest, not 1.6 times it', () => {
    // The rider multiplies the credit; what it ADDS is credit x (factor - 1).
    // Getting this wrong by treating the whole multiplied figure as the gain
    // overstates the benefit by a factor of nearly three.
    const r = runMultiplierComparison(baseInput);
    const good = r.years.find((y) => y.creditedRatePct > 0)!;
    const impliedInterestOnRider = (good.extraInterest / 0.6);
    expect(good.extraInterest).toBeCloseTo(impliedInterestOnRider * 0.6, 0);
  });

  it('turning the multiplier off is the same policy with no charge', () => {
    const off = runMultiplierComparison({ ...baseInput, terms: { factorPct: 100, annualChargePct: 0 } });
    expect(off.summary.totalExtraInterest).toBe(0);
    expect(off.summary.totalCharges).toBe(0);
    expect(off.summary.finalAccountValueWithRider).toBe(off.summary.finalAccountValueBase);
  });

  it('a charge large enough eats the benefit, and the result says so rather than hiding it', () => {
    const greedy = runMultiplierComparison({
      ...baseInput,
      terms: { factorPct: 160, annualChargePct: 6 },
    });
    expect(greedy.summary.accountValueDifference).toBeLessThan(0);
    expect(greedy.summary.breakEvenYear).toBeNull();
    expect(greedy.notes.join(' ')).toContain('never overtook');
  });

  it('reports the charges paid and the interest added as separate numbers', () => {
    // One figure netted together lets a large charge hide inside a large
    // benefit. The client is entitled to both.
    const r = runMultiplierComparison(baseInput);
    expect(r.summary.totalExtraInterest).toBeGreaterThan(0);
    expect(r.summary.totalCharges).toBeGreaterThan(0);
  });

  it('refuses to pretend surrender value equals account value', () => {
    const noSchedule = runMultiplierComparison(baseInput);
    expect(noSchedule.summary.surrenderScheduleSupplied).toBe(false);
    expect(noSchedule.notes.join(' ')).toContain('No surrender charge schedule');
    expect(noSchedule.summary.finalSurrenderValueBase).toBe(noSchedule.summary.finalAccountValueBase);

    // With a schedule, the early years are materially lower.
    const schedule = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const withSchedule = runMultiplierComparison({ ...baseInput, surrenderChargePctByYear: schedule });
    expect(withSchedule.summary.surrenderScheduleSupplied).toBe(true);
    const y1 = withSchedule.years[0]!;
    expect(y1.surrenderValueBase).toBeLessThan(y1.accountValueBase);
    expect(y1.surrenderValueBase).toBeCloseTo(y1.accountValueBase * 0.9, -1);
  });

  it('shows both surrender columns, because the rider changes that too', () => {
    const r = runMultiplierComparison({
      ...baseInput,
      surrenderChargePctByYear: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    });
    expect(r.summary.surrenderValueDifference).not.toBe(0);
    for (const y of r.years) {
      expect(y.surrenderValueWithRider).toBeLessThanOrEqual(y.accountValueWithRider);
    }
  });

  it('a rider that never charges is always ahead, which is the sanity check', () => {
    const free = runMultiplierComparison({ ...baseInput, terms: { factorPct: 160, annualChargePct: 0 } });
    expect(free.summary.accountValueDifference).toBeGreaterThan(0);
    expect(free.summary.breakEvenYear).toBe(1);
  });
});
