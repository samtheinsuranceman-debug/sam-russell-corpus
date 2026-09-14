/**
 * The series check, and the fact that it currently fails.
 *
 * These assertions record a real defect rather than a passing feature. The
 * platform's S&P 500 series carries no source and does not reconcile to the
 * carrier's own published claims about that index. When somebody replaces the
 * series with a sourced one, the reconciliation tests below start failing, and
 * that is the signal to flip SP500_SERIES_VERIFIED and delete them.
 */

import { describe, it, expect } from 'vitest';
import {
  SP500_SERIES_VERIFIED,
  PUBLISHED_INDEX_CLAIMS,
  checkSeriesAgainstPublishedClaims,
  seriesReconciles,
  provenanceWarning,
} from '../shared/sp500SeriesAudit';
import { RAW_INDEX_RETURNS } from '../shared/indexCreditingData';

const SP500 = RAW_INDEX_RETURNS.SP500;

describe('the carrier claims the series is checked against', () => {
  it('are quoted from a document, each with a window', () => {
    expect(PUBLISHED_INDEX_CLAIMS).toHaveLength(3);
    for (const c of PUBLISHED_INDEX_CLAIMS) {
      expect(c.document).toMatch(/2924526/);
      expect(c.windowFrom).toBe(1994);
      expect(c.windowTo).toBe(2023);
    }
  });
});

describe('the current series does not reconcile — this is the defect', () => {
  it('fails overall', () => {
    expect(seriesReconciles(SP500)).toBe(false);
    expect(SP500_SERIES_VERIFIED).toBe(false);
  });

  it('misses the published 30-year average', () => {
    const c = checkSeriesAgainstPublishedClaims(SP500).find((x) => x.id === 'avg-annual-30y')!;
    expect(c.published).toBe(8.06);
    expect(c.measured).toBeCloseTo(8.29, 1);
    expect(c.reconciles).toBe(false);
  });

  it('counts two fewer years above a 10% cap than the carrier published', () => {
    const c = checkSeriesAgainstPublishedClaims(SP500).find((x) => x.id === 'years-over-10-cap')!;
    expect(c.published).toBe(18);
    expect(c.measured).toBe(16);
    expect(c.reconciles).toBe(false);
  });

  it('overstates the average excess above the cap', () => {
    const c = checkSeriesAgainstPublishedClaims(SP500).find((x) => x.id === 'avg-excess-over-10-cap')!;
    expect(c.published).toBe(12.23);
    expect(c.measured).toBeCloseTo(13.66, 1);
    expect(c.reconciles).toBe(false);
  });

  it('produces a warning that says not to quote the figures', () => {
    const w = provenanceWarning(SP500);
    expect(w).toBeTruthy();
    expect(w).toMatch(/no source/);
    expect(w).toMatch(/Do not quote/);
  });
});

describe('the checker itself is sound', () => {
  it('passes a series built to satisfy every claim', () => {
    // 18 years above a 10% cap, exceeding it by exactly 12.23 points, and the
    // remaining 12 years set so the 30-year geometric mean lands on 8.06%.
    const good: Record<number, number> = {};
    for (let y = 1994; y <= 2011; y++) good[y] = 22.23;
    const growthSoFar = Math.pow(1.2223, 18);
    const target = Math.pow(1.0806, 30);
    const rest = Math.pow(target / growthSoFar, 1 / 12);
    for (let y = 2012; y <= 2023; y++) good[y] = (rest - 1) * 100;

    const checks = checkSeriesAgainstPublishedClaims(good);
    expect(checks.find((c) => c.id === 'years-over-10-cap')!.measured).toBe(18);
    expect(checks.find((c) => c.id === 'avg-excess-over-10-cap')!.measured).toBeCloseTo(12.23, 1);
    expect(checks.find((c) => c.id === 'avg-annual-30y')!.measured).toBeCloseTo(8.06, 1);
  });

  it('reports the difference with its sign', () => {
    const c = checkSeriesAgainstPublishedClaims(SP500).find((x) => x.id === 'years-over-10-cap')!;
    expect(c.difference).toBe(-2);
  });

  it('is empty-safe', () => {
    const checks = checkSeriesAgainstPublishedClaims({});
    expect(checks).toHaveLength(3);
    for (const c of checks) expect(Number.isFinite(c.measured)).toBe(true);
  });
});
