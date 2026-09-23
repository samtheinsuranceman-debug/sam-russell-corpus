import { describe, it, expect } from 'vitest';
import {
  describeSeries, realValue, projectUnderScenario, compareScenarios, localOutlook,
  LEGISLATIVE_SCENARIOS,
  UnsourcedSeriesError, SeriesTooShortError,
  type SourcedSeries, type ProjectionInputs, type LocalHistory,
} from '@shared/scenarioEngine';

const mk = (values: number[]): SourcedSeries => ({
  values, startYear: 1990, source: 'FHFA HPI, ZIP-level', asOf: '2026-06-30',
});

const flat36 = (r: number) => mk(Array.from({ length: 36 }, () => r));

const inflation = { annualRate: 0.03, basis: 'cpi-headline' as const, source: 'BLS CPI-U' };

describe('series contract', () => {
  it('refuses an unsourced series', () => {
    const bad = { ...flat36(0.04), source: '' };
    expect(() => describeSeries(bad, 'appreciation')).toThrow(UnsourcedSeriesError);
  });

  it('refuses a series shorter than the window presented', () => {
    expect(() => describeSeries(mk([0.04, 0.05]), 'appreciation')).toThrow(SeriesTooShortError);
  });

  it('computes CAGR, extremes, and the worst rolling decade', () => {
    const s = describeSeries(flat36(0.05), 'appreciation');
    expect(s.cagr).toBeCloseTo(0.05, 4);
    expect(s.worstDecade).toBeCloseTo(0.05, 4);
    expect(s.years).toBe(36);
  });

  it('surfaces a bad decade the full-period CAGR hides', () => {
    const values = [
      ...Array.from({ length: 10 }, () => -0.04),
      ...Array.from({ length: 26 }, () => 0.09),
    ];
    const s = describeSeries(mk(values), 'appreciation');
    expect(s.cagr).toBeGreaterThan(0);
    expect(s.worstDecade).toBeLessThan(0);
    expect(s.plain).toMatch(/Worst ten-year stretch/);
  });
});

describe('inflation', () => {
  it('discounts nominal dollars to purchasing power', () => {
    expect(realValue(1000, 10, inflation)).toBeCloseTo(1000 / Math.pow(1.03, 10), 6);
  });

  it('refuses an assumption with no source', () => {
    expect(() => realValue(1000, 10, { ...inflation, source: '' })).toThrow();
  });
});

describe('legislative scenarios', () => {
  const base: ProjectionInputs = {
    startingValue: 1_000_000, annualReturn: 0.06, years: 20, currentYear: 2026,
    baseOrdinaryRate: 0.37, taxTreatment: 'ordinary', baseCapitalGainRate: 0.20, inflation,
  };

  it('is symmetric — includes a rate-cutting case, not only increases', () => {
    const deltas = LEGISLATIVE_SCENARIOS.map((s) => s.ordinaryRateDelta);
    expect(deltas.some((d) => d > 0)).toBe(true);
    expect(deltas.some((d) => d < 0)).toBe(true);
  });

  it('names scenarios by government structure, not by party', () => {
    for (const s of LEGISLATIVE_SCENARIOS) {
      expect(s.label.toLowerCase()).not.toMatch(/democrat|republican|gop/);
      expect(s.rationale.toLowerCase()).not.toMatch(/will win|likely to win/);
    }
  });

  it('leaves a tax-free position unmoved across every scenario', () => {
    const taxFree = { ...base, taxTreatment: 'tax-free' as const };
    const results = compareScenarios(taxFree);
    for (const r of results) expect(r.costVsCurrentLaw).toBe(0);
    expect(results[0].plain).toMatch(/does not move with the rate scenario/);
  });

  it('costs an ordinary-income position real money under a rate increase', () => {
    const results = compareScenarios(base);
    const unified = results.find((r) => r.scenarioId === 'unified-expansion')!;
    expect(unified.costVsCurrentLaw).toBeLessThan(0);
  });

  it('shows a gain under the rate-cutting scenario', () => {
    const results = compareScenarios(base);
    const cut = results.find((r) => r.scenarioId === 'unified-reduction')!;
    expect(cut.costVsCurrentLaw).toBeGreaterThan(0);
  });

  it('applies a scenario only from its effective year', () => {
    const sunset = LEGISLATIVE_SCENARIOS.find((s) => s.id === 'what-if-pre-tcja-rates')!;
    const short = projectUnderScenario({ ...base, years: 20 }, sunset);
    expect(short.find((r) => r.year === 2027)).toBeTruthy();
    expect(short).toHaveLength(20);
  });

  it('reports both nominal and real dollars on every row', () => {
    const rows = projectUnderScenario(base, LEGISLATIVE_SCENARIOS[0]);
    for (const r of rows) {
      expect(r.real).toBeLessThan(r.nominal);
      expect(r.afterTaxReal).toBeLessThanOrEqual(r.real);
    }
  });

  it('refuses a non-positive horizon', () => {
    expect(() => projectUnderScenario({ ...base, years: 0 }, LEGISLATIVE_SCENARIOS[0])).toThrow(RangeError);
  });
});

describe('local outlook', () => {
  const history = (over: Partial<LocalHistory> = {}): LocalHistory => ({
    zip: '28429',
    appreciation: flat36(0.04),
    rentGrowth: flat36(0.03),
    insuranceCost: { ...mk(Array.from({ length: 37 }, (_, i) => 900 * Math.pow(1.05, i))), source: 'State DOI filings', asOf: '2026-06-30' },
    mortgageRate: flat36(0.065),
    ...over,
  });

  it('warns when insurance outruns rent growth', () => {
    const o = localOutlook(history());
    expect(o.warnings.join(' ')).toMatch(/Carrying cost is outrunning/);
  });

  it('warns when the market had a losing decade', () => {
    const bad = history({
      appreciation: mk([...Array.from({ length: 10 }, () => -0.03), ...Array.from({ length: 26 }, () => 0.08)]),
    });
    expect(localOutlook(bad).warnings.join(' ')).toMatch(/not a floor here/);
  });

  it('flags cheap legacy debt as an asset worth keeping', () => {
    const rates = history({
      mortgageRate: mk([...Array.from({ length: 18 }, () => 0.09), ...Array.from({ length: 18 }, () => 0.03)]),
    });
    expect(localOutlook(rates).warnings.join(' ')).toMatch(/holding an asset/);
  });

  it('refuses an unsourced insurance series', () => {
    const bad = history({ insuranceCost: { ...mk(Array.from({ length: 37 }, () => 900)), source: '' } });
    expect(() => localOutlook(bad)).toThrow(UnsourcedSeriesError);
  });

  it('refuses a short insurance series', () => {
    const bad = history({ insuranceCost: mk([900, 950]) });
    expect(() => localOutlook(bad)).toThrow(SeriesTooShortError);
  });

  it('summarizes all four series for the ZIP', () => {
    const o = localOutlook(history());
    expect(o.plain).toMatch(/28429/);
    expect(o.appreciation.years).toBe(36);
    expect(o.rentGrowth.years).toBe(36);
    expect(o.mortgageRate.years).toBe(36);
  });
});
