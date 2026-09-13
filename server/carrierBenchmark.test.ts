/**
 * Our model against the carrier's own published answer.
 *
 * The Nationwide IUL Accumulator II 2020 rate guide (FLM-1491AO.10, 02/25)
 * publishes look-back rates for each strategy over 30, 25, 20, 15, 10 and 5
 * years. That is Nationwide answering the same question our engine answers, so
 * it is the only external check available on whether our crediting arithmetic
 * is right.
 *
 * Nationwide's stated method: an ARITHMETIC average of the one-year rates,
 * excluding the strategy charges for the High-Cap strategies. Matched here so
 * the comparison is like for like — a compound figure would be lower and the
 * test would be measuring the wrong difference.
 *
 * Their window ends at their as-of date, January 2025, and ours ends at 2025;
 * their index series is not ours. So this is a tolerance check, not an
 * equality check. It catches an engine that is wrong by points, which is the
 * failure that matters.
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_INDEX_OPTIONS,
  NATIONWIDE_PUBLISHED_LOOKBACKS,
  getCreditingHistory,
  hasIndexSeries,
  publishedLookback,
} from '../shared/indexCreditingData';

/** Published by Nationwide, 30-year column, as of 15 January 2025. */
const NATIONWIDE_30YR: Record<string, number> = {
  'am-sp500-ptp': 6.98,
  'am-sp500-uncapped': 8.68,
  'am-highcap-sp500': 8.42,
};

function arithmeticLookback(optionId: string, from: number, to: number, ignoreCharge: boolean): number {
  const o = ALL_INDEX_OPTIONS.find((x) => x.id === optionId)!;
  const opt = ignoreCharge ? { ...o, strategyCharge: 0 } : o;
  const h = getCreditingHistory(opt, from, to);
  return h.reduce((t, x) => t + x.creditedRate, 0) / h.length;
}

describe('our crediting model against the carrier rate guide', () => {
  it('lands within a point of Nationwide on every single-index strategy', () => {
    const off: string[] = [];
    for (const [id, published] of Object.entries(NATIONWIDE_30YR)) {
      // High-Cap carries a charge Nationwide excludes from its look-back.
      const ours = arithmeticLookback(id, 1996, 2025, id.includes('highcap'));
      if (Math.abs(ours - published) > 1.0) {
        off.push(`${id}: ours ${ours.toFixed(2)}% vs published ${published}%`);
      }
    }
    expect(off).toEqual([]);
  });

  it('has the terms the rate guide states, so the comparison means something', () => {
    // A model that matches by luck while carrying the wrong cap is not a model
    // that works. These are transcribed from FLM-1491AO.10 (02/25).
    const byId = (id: string) => ALL_INDEX_OPTIONS.find((o) => o.id === id)!;
    expect(byId('am-sp500-ptp').cap).toBe(10.25);
    expect(byId('am-sp500-ptp').participation).toBe(100);
    expect(byId('am-sp500-uncapped').cap).toBeNull();
    expect(byId('am-sp500-uncapped').spread).toBe(6.0);
    expect(byId('am-highcap-sp500').cap).toBe(13);
    expect(byId('am-multi-index').cap).toBe(13);
  });

  it('the multi-index strategy is still far from the carrier, which is why it is refused', () => {
    // Nationwide publishes 7.52% over 30 years for the core Multi-Index
    // strategy. Ours is materially higher because the monthly average is
    // modelled as annual point-to-point and one component index is
    // substituted. Pinned so that if either is fixed, this test fails and
    // somebody re-reads the refusal rather than leaving it in place forever.
    const ours = arithmeticLookback('am-multi-index', 1996, 2025, true);
    expect(Math.abs(ours - 7.52)).toBeGreaterThan(1.0);
  });

  it('carries every strategy the rate guide lists, including the ones it cannot run', () => {
    // A policyholder choosing an allocation should see the whole contract,
    // not only the part this system can model.
    for (const id of ['ma-jpm-mercury-plus', 'ma-bnpp-hfactor-select', 'ma-jpm-mercury-highpar']) {
      const o = ALL_INDEX_OPTIONS.find((x) => x.id === id);
      expect(o, id).toBeDefined();
      expect(o!.cap).toBeNull();
      expect(o!.participation).toBeGreaterThan(150);
    }
    expect(ALL_INDEX_OPTIONS.find((o) => o.id === 'ma-bnpp-hfactor-select')!.participation).toBe(315);
  });

  it('knows which strategies it holds no index series for', () => {
    const missing = ALL_INDEX_OPTIONS.filter((o) => !hasIndexSeries(o));
    expect(missing.length).toBe(6);
    for (const o of missing) {
      expect(['JPM_MERCURY', 'BNPP_HFACTOR'], o.id).toContain(o.index);
      // And the carrier's own figure is available in place of one we cannot
      // compute, so the strategy is not simply blank.
      expect(publishedLookback(o.id)?.y20, o.id).toBeGreaterThan(0);
      // Both indices were established in 2022, so no long look-back exists.
      expect(publishedLookback(o.id)?.y30, o.id).toBeNull();
    }
  });

  it('every published look-back names a strategy that exists', () => {
    for (const l of NATIONWIDE_PUBLISHED_LOOKBACKS) {
      expect(ALL_INDEX_OPTIONS.some((o) => o.id === l.optionId), l.optionId).toBe(true);
    }
  });

  it('no strategy credits below its floor or above its cap in any year', () => {
    for (const o of ALL_INDEX_OPTIONS.filter(hasIndexSeries)) {
      for (const y of getCreditingHistory(o, 1996, 2025)) {
        expect(y.creditedRate, `${o.id} ${y.year}`).toBeGreaterThanOrEqual(o.floor - o.strategyCharge - 0.001);
        if (o.cap !== null) {
          expect(y.creditedRate, `${o.id} ${y.year}`).toBeLessThanOrEqual(o.cap + 0.001);
        }
      }
    }
  });
});
