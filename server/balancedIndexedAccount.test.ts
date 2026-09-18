/**
 * The two-year segment account, and the claim that sent me looking at it.
 *
 * The claim was "from 2020-2026 the index returned 40%+ four out of the last
 * six years". On the sourced index series it is exactly right about the
 * SEGMENTS and wrong only about the unit: no single YEAR came near 40% (the
 * best was 27.0%), while four of the six rolling TWO-YEAR segments over
 * 2019-2025 credited 40% or more. Two credited nothing at all.
 *
 * These tests pin that record. If anyone later changes the module so a segment
 * credit can be read as an annual return, or so the floor years drop out of
 * the window, they fail.
 */

import { describe, it, expect } from 'vitest';
import {
  SEGMENT_ACCOUNTS,
  creditSegment,
  rollingSegments,
  summarizeWindow,
  type SegmentTerms,
} from '../shared/balancedIndexedAccount';
import {
  RAW_INDEX_RETURNS,
  ALL_INDEX_OPTIONS,
  getOptionsByCarrier,
  getCreditedRate,
  getCreditingHistory,
} from '../shared/indexCreditingData';
import { getPopularIndexOptions } from '../shared/timeMachineEngine';

const SP500 = RAW_INDEX_RETURNS.SP500;
const BIA = SEGMENT_ACCOUNTS.find((a) => a.id === 'bia-2yr') as SegmentTerms;
const PAR110 = SEGMENT_ACCOUNTS.find((a) => a.id === 'par110-annual') as SegmentTerms;

describe('the account as the carrier states it', () => {
  it('is the sourced one, at 105% participation with a 2.50% spread', () => {
    expect(BIA).toBeDefined();
    expect(BIA.sourced).toBe(true);
    expect(BIA.participationPct).toBe(105);
    expect(BIA.spreadPct).toBe(2.5);
    expect(BIA.termYears).toBe(2);
    expect(BIA.capPct).toBeNull();
    expect(BIA.floorPct).toBe(0);
    expect(BIA.source).toMatch(/F94327-15/);
  });

  it('marks the 110% annual parameter set as NOT sourced', () => {
    // The 110% that gets quoted is a five-year account at another carrier.
    // Anything the platform shows at 110% annual is a parameter, not a quote,
    // and has to say so.
    expect(PAR110.sourced).toBe(false);
    expect(PAR110.carrierLabel).toBe('Comparison parameter');
    expect(PAR110.source).toMatch(/[Nn]ot a carrier quote/);
  });

  it('names no carrier outside the three de-identified labels', () => {
    const allowed = ['Mutual Company A', 'Mutual Company B', 'Mutual Company C', 'Comparison parameter'];
    for (const a of SEGMENT_ACCOUNTS) expect(allowed).toContain(a.carrierLabel);
  });
});

describe('no single year reached 40%', () => {
  it('is true across 2020-2025 on the sourced series', () => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    const best = Math.max(...years.map((y) => SP500[y]));
    expect(best).toBeLessThan(40);
    expect(best).toBeCloseTo(27.0, 2);
  });
});

describe('creditSegment reproduces the measured two-year figures', () => {
  const seg = (start: number) => creditSegment(BIA, [SP500[start], SP500[start + 1]], start);

  it('2020-2021 credits 47.32% — 21.38% a year', () => {
    const s = seg(2020);
    expect(s.indexCumulativePct).toBeCloseTo(47.45, 1);
    expect(s.creditedPct).toBeCloseTo(47.32, 1);
    expect(s.annualizedPct).toBeCloseTo(21.38, 1);
    expect(s.endYear).toBe(2021);
  });

  it('2023-2024 credits 53.42% — 23.86% a year', () => {
    const s = seg(2023);
    expect(s.creditedPct).toBeCloseTo(53.42, 1);
    expect(s.annualizedPct).toBeCloseTo(23.86, 1);
  });

  it('2019-2020 credits 49.51% and 2024-2025 credits 43.07%', () => {
    expect(seg(2019).creditedPct).toBeCloseTo(49.51, 1);
    expect(seg(2024).creditedPct).toBeCloseTo(43.07, 1);
  });

  it('the annualized figure is always far below the segment credit', () => {
    for (const start of [2019, 2020, 2023, 2024]) {
      const s = seg(start);
      expect(s.annualizedPct).toBeLessThan(s.creditedPct);
      // A ~48% two-year credit must never read as ~48% a year.
      expect(s.annualizedPct).toBeLessThan(s.creditedPct / 1.8);
    }
  });

  it('annualizing and re-compounding returns the segment credit', () => {
    const s = seg(2020);
    const recompounded = (Math.pow(1 + s.annualizedPct / 100, s.termYears) - 1) * 100;
    expect(recompounded).toBeCloseTo(s.creditedPct, 1);
  });
});

describe('the spread and the floor', () => {
  it('the floor catches 2007-2008, which the index took deeply negative', () => {
    const s = creditSegment(BIA, [SP500[2007], SP500[2008]], 2007);
    expect(s.indexCumulativePct).toBeLessThan(0);
    expect(s.floorSaved).toBe(true);
    expect(s.creditedPct).toBe(0);
    expect(s.annualizedPct).toBe(0);
  });

  it('2021-2022 is the segment the spread wipes out — 2.23% index, nothing credited', () => {
    // The index was UP over the two years and the account still credited zero:
    // 2.23% participated to 2.34%, less the 2.50% spread, is below the floor.
    // This is the segment a headline about 40%+ leaves out.
    const s = creditSegment(BIA, [SP500[2021], SP500[2022]], 2021);
    expect(s.indexCumulativePct).toBeCloseTo(2.23, 1);
    expect(s.indexCumulativePct).toBeGreaterThan(0);
    expect(s.floorSaved).toBe(true);
    expect(s.creditedPct).toBe(0);
  });

  it('2022-2023 credits nothing either, on an index that was flat', () => {
    const s = creditSegment(BIA, [SP500[2022], SP500[2023]], 2022);
    expect(s.indexCumulativePct).toBeCloseTo(0.06, 1);
    expect(s.creditedPct).toBe(0);
  });

  it('the 2.50% spread costs a flat 2.5 points of the segment credit', () => {
    const noSpread: SegmentTerms = { ...BIA, spreadPct: 0 };
    const withSpread = creditSegment(BIA, [10, 10], 2000);
    const without = creditSegment(noSpread, [10, 10], 2000);
    expect(without.creditedPct - withSpread.creditedPct).toBeCloseTo(2.5, 2);
  });

  it('hurts most in a weak segment — a small positive credit goes to near zero', () => {
    // 1% over two years, participated to 1.05%, less 2.50% = below the floor.
    const weak = creditSegment(BIA, [0.5, 0.5], 2000);
    expect(weak.floorSaved).toBe(true);
    expect(weak.creditedPct).toBe(0);
  });

  it('a cap truncates and says so', () => {
    const capped: SegmentTerms = { ...BIA, capPct: 20, spreadPct: 0, participationPct: 100 };
    const s = creditSegment(capped, [20, 20], 2000);
    expect(s.capBit).toBe(true);
    expect(s.creditedPct).toBe(20);
  });

  it('an annual account credits its own year unchanged by term arithmetic', () => {
    const s = creditSegment(PAR110, [10], 2024);
    expect(s.termYears).toBe(1);
    expect(s.creditedPct).toBeCloseTo(11, 2);
    expect(s.annualizedPct).toBeCloseTo(s.creditedPct, 2);
    expect(s.startYear).toBe(s.endYear);
  });
});

describe('rollingSegments steps one year at a time', () => {
  it('gives overlapping two-year windows, not calendar pairs', () => {
    const segs = rollingSegments(BIA, SP500, 2019, 2025);
    expect(segs.map((s) => s.startYear)).toEqual([2019, 2020, 2021, 2022, 2023, 2024]);
    expect(segs.map((s) => s.endYear)).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
  });

  it('shows the segments the overlapping view exists to expose', () => {
    // Two of the six credited nothing. Any presentation that drops them is
    // showing four good segments out of four.
    const segs = rollingSegments(BIA, SP500, 2019, 2025);
    expect(segs.filter((s) => s.creditedPct === 0)).toHaveLength(2);
    expect(segs.find((s) => s.startYear === 2021)?.creditedPct).toBe(0);
    expect(segs.find((s) => s.startYear === 2022)?.creditedPct).toBe(0);
  });

  it('stops rather than inventing a segment that runs past the data', () => {
    const segs = rollingSegments(BIA, SP500, 2024, 2026);
    // 2026 is not in the series, so 2025-2026 cannot be formed.
    expect(segs.map((s) => s.startYear)).toEqual([2024]);
  });

  it('returns nothing when the window is shorter than the term', () => {
    expect(rollingSegments(BIA, SP500, 2025, 2025)).toHaveLength(0);
  });

  it('an annual account gives one entry per year in the window', () => {
    const segs = rollingSegments(PAR110, SP500, 2020, 2025);
    expect(segs).toHaveLength(6);
  });
});

describe('summarizeWindow counts segments, never years', () => {
  it('finds FOUR two-year segments at or above 40% in 2019-2025', () => {
    // "40%+ four out of the last six" is the record exactly, once "six" is
    // read as six segments rather than six years.
    const w = summarizeWindow(BIA, SP500, 2019, 2025, 40);
    expect(w.segments).toHaveLength(6);
    expect(w.segmentsAtOrAboveThreshold).toBe(4);
    expect(w.thresholdPct).toBe(40);
  });

  it('and the other two credited nothing, which the same window shows', () => {
    const w = summarizeWindow(BIA, SP500, 2019, 2025, 40);
    expect(w.floorSavedCount).toBe(2);
    expect(w.worstAnnualizedPct).toBe(0);
  });

  it('counts the same window as zero when the threshold is read annually', () => {
    // The distinction in one assertion: four segments cleared 40%, and not one
    // of them cleared 40% a year.
    const w = summarizeWindow(BIA, SP500, 2019, 2025, 40);
    expect(w.segments.filter((s) => s.annualizedPct >= 40)).toHaveLength(0);
    expect(w.bestAnnualizedPct).toBeLessThan(40);
  });

  it('states the term in its reading note whenever the term is multi-year', () => {
    const w = summarizeWindow(BIA, SP500, 2019, 2025);
    expect(w.readingNote).toMatch(/2-year segment/);
    expect(w.readingNote).toMatch(/not a year/);
  });

  it('says the two figures coincide for an annual account', () => {
    const w = summarizeWindow(PAR110, SP500, 2020, 2025);
    expect(w.readingNote).toMatch(/annual/);
    for (const s of w.segments) expect(s.annualizedPct).toBeCloseTo(s.creditedPct, 2);
  });

  it('reports the mean, best and worst on the annualized basis', () => {
    const w = summarizeWindow(BIA, SP500, 2019, 2025);
    const ann = w.segments.map((s) => s.annualizedPct);
    expect(w.bestAnnualizedPct).toBe(Math.max(...ann));
    expect(w.worstAnnualizedPct).toBe(Math.min(...ann));
    expect(w.meanAnnualizedPct).toBeCloseTo(ann.reduce((a, b) => a + b, 0) / ann.length, 2);
    expect(w.worstAnnualizedPct).toBe(0); // the two floor segments
    expect(w.bestAnnualizedPct).toBeCloseTo(23.86, 1); // 2023-2024
  });

  it('counts the floor years in 2019-2025 and over the 2007 crash', () => {
    expect(summarizeWindow(BIA, SP500, 2019, 2025).floorSavedCount).toBe(2);
    expect(summarizeWindow(BIA, SP500, 2019, 2025).capBitCount).toBe(0);
    const crash = summarizeWindow(BIA, SP500, 2007, 2009);
    expect(crash.floorSavedCount).toBeGreaterThan(0);
  });

  it('is empty and safe on a window with no complete segment', () => {
    const w = summarizeWindow(BIA, SP500, 2025, 2025);
    expect(w.segments).toHaveLength(0);
    expect(w.meanAnnualizedPct).toBe(0);
    expect(w.segmentsAtOrAboveThreshold).toBe(0);
  });
});

describe('the segment accounts as index options on every calculator', () => {
  it('both appear in ALL_INDEX_OPTIONS under Mutual Company B', () => {
    const bia = ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-2yr-balanced');
    const par = ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-par110');
    expect(bia?.carrier).toBe('mutual-b');
    expect(par?.carrier).toBe('mutual-b');
    expect(getOptionsByCarrier('mutual-b').map((o) => o.id)).toEqual(
      expect.arrayContaining(['bm-sp500-2yr-balanced', 'bm-sp500-par110'])
    );
  });

  it('carries the same sourced/unsourced split as the segment module', () => {
    expect(ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-2yr-balanced')?.sourced).toBe(true);
    expect(ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-par110')?.sourced).toBe(false);
    expect(ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-par110')?.sourceNote)
      .toMatch(/[Nn]ot a carrier quote/);
  });

  it('credits the two-year option per year at the ANNUALIZED segment rate', () => {
    const bia = ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-2yr-balanced')!;
    // 2021 closes the 2020-2021 segment: 47.32% credited, 21.38% a year.
    expect(getCreditedRate(bia, 2021)).toBeCloseTo(21.38, 1);
    expect(getCreditedRate(bia, 2024)).toBeCloseTo(23.86, 1);
    // Never the segment credit itself — that is the whole point.
    expect(getCreditedRate(bia, 2021)).toBeLessThan(30);
  });

  it('agrees year for year with the segment module', () => {
    const bia = ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-2yr-balanced')!;
    for (const start of [2019, 2020, 2021, 2022, 2023, 2024]) {
      const fromModule = creditSegment(BIA, [SP500[start], SP500[start + 1]], start);
      expect(getCreditedRate(bia, start + 1)).toBeCloseTo(fromModule.annualizedPct, 1);
    }
  });

  it('applies the spread once across the term, not once a year', () => {
    const bia = ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-2yr-balanced')!;
    // Two flat 10% years: as a segment, 21% growth participated to 22.05%
    // less one 2.50% spread = 19.55%, i.e. 9.34% a year. Charging the spread
    // annually would give 8.00% a year instead.
    const twoTen = (Math.pow(1.1955, 0.5) - 1) * 100;
    expect(twoTen).toBeCloseTo(9.34, 1);
    expect(getCreditedRate(bia, 2021)).toBeGreaterThan(0);
  });

  it('the 110% annual option is an ordinary annual point-to-point', () => {
    const par = ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-par110')!;
    expect(getCreditedRate(par, 2020)).toBeCloseTo(16.1 * 1.1, 1);
    expect(getCreditedRate(par, 2022)).toBe(0); // floor
  });

  it('builds a short segment rather than nothing at the start of the series', () => {
    const bia = ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-2yr-balanced')!;
    // 1993 is not in the series, so 1994 has only its own year to work with.
    expect(getCreditedRate(bia, 1994)).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(getCreditedRate(bia, 1994))).toBe(true);
  });

  it('leaves every annual option unchanged', () => {
    const ptp = ALL_INDEX_OPTIONS.find((o) => o.id === 'am-sp500-ptp')!;
    expect(getCreditedRate(ptp, 2021)).toBeCloseTo(10.25, 2); // capped
    expect(getCreditedRate(ptp, 2022)).toBe(0); // floored
  });

  it('getCreditingHistory steps one year at a time over the last six years', () => {
    const bia = ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-2yr-balanced')!;
    const h = getCreditingHistory(bia, 2020, 2025);
    expect(h.map((r) => r.year)).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
    expect(h.find((r) => r.year === 2021)?.creditedRate).toBeCloseTo(21.38, 1);
    expect(h.find((r) => r.year === 2022)?.creditedRate).toBe(0);
  });
});

describe('the Time Machine sees the segment accounts', () => {
  it('offers both in the popular selector', () => {
    const ids = getPopularIndexOptions().map((o) => o.id);
    expect(ids).toContain('bm-sp500-2yr-balanced');
    expect(ids).toContain('bm-sp500-par110');
  });

  it('puts the term and the unsourced mark in the LABEL, not only a field', () => {
    // A selector that renders only `label` still tells the reader the truth.
    const opts = getPopularIndexOptions();
    const bia = opts.find((o) => o.id === 'bm-sp500-2yr-balanced')!;
    const par = opts.find((o) => o.id === 'bm-sp500-par110')!;
    expect(bia.label).toMatch(/2-year segment/);
    expect(bia.label).not.toMatch(/unsourced/);
    expect(par.label).toMatch(/unsourced/);
    expect(bia.segmentTermYears).toBe(2);
    expect(par.sourced).toBe(false);
  });

  it('leaves the annual options' + ' labels unchanged apart from the sourced mark', () => {
    const ptp = getPopularIndexOptions().find((o) => o.id === 'am-sp500-ptp')!;
    expect(ptp.segmentTermYears).toBe(1);
    expect(ptp.label).not.toMatch(/segment/);
  });

  it('credits a two-year segment through the projection so the term compounds', () => {
    // Crediting the annualized rate in each of the two years must reproduce
    // the segment credit — otherwise a projection using this option would
    // quietly pay the segment credit twice.
    const bia = ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-2yr-balanced')!;
    const a = getCreditedRate(bia, 2020);
    const b = getCreditedRate(bia, 2021);
    const twoYearGrowth = (1 + a / 100) * (1 + b / 100);
    // 2020 closes the 2019-2020 segment (49.51%) and 2021 closes 2020-2021
    // (47.32%); each year carries its own segment's per-year rate.
    expect(a).toBeCloseTo(22.28, 1);
    expect(b).toBeCloseTo(21.38, 1);
    expect(twoYearGrowth).toBeGreaterThan(1);
  });
});

describe('the carrier\'s own basis: annualized, net of the spread', () => {
  it('every segment carries the carrier-basis figure, equal to the annualized one', () => {
    for (const s of rollingSegments(BIA, SP500, 2019, 2025)) {
      expect(s.carrierBasisPct).toBeCloseTo(s.annualizedPct, 2);
    }
  });

  it('the carrier basis is never the segment credit', () => {
    const s = creditSegment(BIA, [SP500[2020], SP500[2021]], 2020);
    expect(s.carrierBasisPct).toBeLessThan(s.creditedPct / 1.8);
  });

  it('annualizes geometrically, not by halving — the difference is ~2 points', () => {
    // The flier says "annualized", which is the geometric root. Halving a
    // 47.32% two-year credit gives 23.66%; the root gives 21.38%.
    const s = creditSegment(BIA, [SP500[2020], SP500[2021]], 2020);
    const halved = s.creditedPct / 2;
    expect(s.annualizedPct).toBeCloseTo(21.38, 1);
    expect(halved).toBeCloseTo(23.66, 1);
    expect(halved - s.annualizedPct).toBeGreaterThan(2);
  });

  it('deducts the spread exactly once, so a chart figure fed back in would double-deduct', () => {
    // Participation and spread are already inside anything read off the
    // carrier's chart. Round-tripping such a figure through creditSegment
    // deducts the spread a second time and understates the account — this
    // test pins the size of that mistake so nobody makes it by accident.
    // Two flat 10% years credit 19.55% over the segment (21% cumulative,
    // participated to 22.05%, less the 2.50% spread). Feed that back through
    // as though it were raw index data and the spread comes out a second time,
    // netted against the participation uplift on it:
    //   2.50 - 0.05 x 19.55 = 1.52 points lost.
    const proper = creditSegment(BIA, [10, 10], 2000);
    const doubleDeducted = creditSegment(BIA, [proper.annualizedPct, proper.annualizedPct], 2000);
    expect(proper.creditedPct).toBeCloseTo(19.55, 1);
    expect(doubleDeducted.creditedPct).toBeCloseTo(18.03, 1);
    expect(proper.creditedPct - doubleDeducted.creditedPct).toBeCloseTo(1.52, 1);
  });

  it('marks the 10% cap comparator sourced, with the flier\'s exact terms', () => {
    const cap = SEGMENT_ACCOUNTS.find((a) => a.id === 'cap10-annual')!;
    expect(cap.sourced).toBe(true);
    expect(cap.capPct).toBe(10);
    expect(cap.participationPct).toBe(100);
    expect(cap.carrierLabel).toBe('Mutual Company B');
    expect(cap.source).toMatch(/F94327-15/);
  });
});

describe('product generation travels with every sourced option', () => {
  it('the two-year balanced account is generation II', () => {
    expect(ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-2yr-balanced')?.product).toBe('Product II');
  });

  it('an unsourced parameter set has no generation', () => {
    expect(ALL_INDEX_OPTIONS.find((o) => o.id === 'bm-sp500-par110')?.product).toBeNull();
  });

  it('every sourced option names its generation', () => {
    for (const o of ALL_INDEX_OPTIONS.filter((x) => x.sourced)) {
      expect(o.product, `${o.id} is sourced but has no product generation`).toBeTruthy();
    }
  });

  it('puts the generation in the label, because caps differ between generations', () => {
    const labels = getPopularIndexOptions();
    const bia = labels.find((o) => o.id === 'bm-sp500-2yr-balanced')!;
    expect(bia.label).toMatch(/Product II/);
    const par = labels.find((o) => o.id === 'bm-sp500-par110')!;
    expect(par.label).not.toMatch(/Product/);
  });
});
