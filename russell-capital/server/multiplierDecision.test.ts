import { describe, it, expect } from 'vitest';
import {
  creditRate, breakEvenIndexReturn, crossoverReturn, historicalBaseRate,
  recommendMultiplier, hedgeAcrossIndices, REGIME_SIGNALS, MULTIPLIER_RULES, auditOptionTable,
} from '@shared/multiplierDecision';
import { A_MUTUAL_INDEX_OPTIONS, ALL_INDEX_OPTIONS, type IndexOption } from '@shared/indexCreditingData';
import {
  runAnnualLoanStrategy, startYearSensitivity, approximateCoiRate,
} from '@shared/annualLoanStrategy';

const capped = A_MUTUAL_INDEX_OPTIONS.find((o) => o.id === 'am-sp500-ptp')!;
const uncapped = A_MUTUAL_INDEX_OPTIONS.find((o) => o.id === 'am-sp500-uncapped')!;

const mk = (over: Partial<IndexOption>): IndexOption => ({
  id: 'x', name: 'X', carrier: 'a-mutual', index: 'SP500', indexType: 'single',
  cap: null, floor: 0, participation: 100, spread: 0, strategyCharge: 0, bonus: 0,
  description: '', availableFrom: 1994, ...over,
});

describe('creditRate mechanics', () => {
  it('applies participation, spread, cap and floor in order', () => {
    const o = mk({ participation: 150, spread: 2, cap: 12, floor: 0 });
    expect(creditRate(o, 10)).toBe(12);      // 10*1.5=15, -2=13, capped 12
    expect(creditRate(o, 4)).toBe(4);        // 4*1.5=6, -2=4, under cap
    expect(creditRate(o, -20)).toBe(0);      // floored
  });

  it('subtracts the strategy charge even in a floor year', () => {
    const o = mk({ strategyCharge: 7.5 });
    expect(creditRate(o, -20)).toBe(-7.5);
  });
});

describe('breakeven — the decision is algebra, not a forecast', () => {
  it('finds the return where an enhanced option overtakes the base', () => {
    const base = mk({ id: 'b', name: 'Base', participation: 100, cap: 10 });
    const enh = mk({ id: 'e', name: 'Enhanced', participation: 150, cap: 10, strategyCharge: 3 });
    const be = breakEvenIndexReturn(base, enh);
    expect(be.neverBreaksEven).toBe(false);
    expect(be.indexReturnPct).toBeGreaterThan(0);
    expect(be.plain).toMatch(/needs the index to return more than/);
  });

  it('prices exactly what the multiplier costs in a floor year', () => {
    const base = mk({ id: 'b', name: 'Base' });
    const enh = mk({ id: 'e', name: 'Enhanced', participation: 200, strategyCharge: 7.5 });
    expect(breakEvenIndexReturn(base, enh).floorYearCost).toBeCloseTo(7.5, 4);
  });

  it('detects an option that can never win at any return', () => {
    const base = mk({ id: 'b', name: 'Base', participation: 100, cap: 10 });
    const enh = mk({ id: 'e', name: 'Enhanced', participation: 101, cap: 10, strategyCharge: 9 });
    const be = breakEvenIndexReturn(base, enh);
    expect(be.neverBreaksEven).toBe(true);
    expect(be.plain).toMatch(/never catches/);
  });

  it('detects an option that wins everywhere, needing no judgement', () => {
    const base = mk({ id: 'b', name: 'Base', participation: 100 });
    const enh = mk({ id: 'e', name: 'Enhanced', participation: 120 });
    const be = breakEvenIndexReturn(base, enh);
    expect(be.alwaysWins).toBe(true);
    expect(recommendMultiplier(base, enh).confidence).toBe('structural');
    expect(recommendMultiplier(base, enh).recommend).toBe(true);
  });
});

describe('crossover — pure product arithmetic', () => {
  it('computes where uncapped-with-spread overtakes the cap', () => {
    const x = crossoverReturn(capped, uncapped)!;
    expect(x).toBeGreaterThan(0);
    // Below the crossover the cap must win; above it the uncapped must.
    expect(creditRate(capped, x - 1)).toBeGreaterThan(creditRate(uncapped, x - 1));
    expect(creditRate(uncapped, x + 1)).toBeGreaterThan(creditRate(capped, x + 1));
  });

  it('returns null when the first option has no cap to be overtaken', () => {
    expect(crossoverReturn(uncapped, capped)).toBe(null);
  });
});

describe('historical base rate replaces the forecast', () => {
  it('reports hit rate, floor years and the compounded net over real history', () => {
    const base = mk({ id: 'b', name: 'Base', cap: 10 });
    const enh = mk({ id: 'e', name: 'Enhanced', cap: 10, participation: 150, strategyCharge: 3 });
    const br = historicalBaseRate(base, enh);
    expect(br.yearsObserved).toBeGreaterThanOrEqual(30);
    expect(br.firstYear).toBe(1994);
    expect(br.hitRate).toBeGreaterThanOrEqual(0);
    expect(br.hitRate).toBeLessThanOrEqual(1);
    expect(br.floorYears).toBeGreaterThan(0);
    expect(br.perYear).toHaveLength(br.yearsObserved);
  });

  it('shows the enhanced option losing exactly the charge in every floor year', () => {
    const base = mk({ id: 'b', name: 'Base' });
    const enh = mk({ id: 'e', name: 'Enhanced', participation: 200, strategyCharge: 6 });
    const br = historicalBaseRate(base, enh);
    for (const row of br.perYear.filter((r) => r.rawPct <= 0)) {
      expect(row.advantage).toBeCloseTo(-6, 4);
    }
  });

  it('throws on an index with no history rather than guessing', () => {
    const o = mk({ index: 'NOT_A_REAL_INDEX' });
    expect(() => historicalBaseRate(o, o)).toThrow(/No return history/);
  });
});

describe('recommendation confidence is never overstated', () => {
  it('refuses a verdict on a short holding period', () => {
    const base = mk({ id: 'b', name: 'Base', cap: 10 });
    const enh = mk({ id: 'e', name: 'Enhanced', cap: 10, participation: 140, strategyCharge: 2 });
    const r = recommendMultiplier(base, enh, { holdingYears: 5 });
    expect(r.confidence).toBe('insufficient');
    expect(r.recommend).toBe(false);
    expect(r.reasoning.join(' ')).toMatch(/cannot be called/);
  });

  it('never returns a confidence above suggestive for a probabilistic answer', () => {
    const base = mk({ id: 'b', name: 'Base', cap: 10 });
    const enh = mk({ id: 'e', name: 'Enhanced', cap: 10, participation: 150, strategyCharge: 3 });
    const r = recommendMultiplier(base, enh, { holdingYears: 30 });
    if (r.restsOn === 'probabilistic') {
      expect(['suggestive', 'insufficient']).toContain(r.confidence);
    }
  });

  it('always states the breakeven in its reasoning', () => {
    const base = mk({ id: 'b', name: 'Base', cap: 10 });
    const enh = mk({ id: 'e', name: 'Enhanced', cap: 10, participation: 150, strategyCharge: 3 });
    expect(recommendMultiplier(base, enh).reasoning.join(' ')).toMatch(/must return more than/);
  });
});

describe('signals are published with their limits', () => {
  it('every signal states what it does NOT tell you', () => {
    for (const s of REGIME_SIGNALS) {
      expect(s.whatItDoesNotTellYou.length).toBeGreaterThan(20);
    }
  });

  it('structural signals carry full strength, probabilistic ones do not', () => {
    for (const s of REGIME_SIGNALS) {
      if (s.kind === 'structural') expect(s.strength).toBe(1);
      else expect(s.strength).toBeLessThan(1);
    }
  });

  it('CAPE is marked weak and explicitly warned off annual decisions', () => {
    const cape = REGIME_SIGNALS.find((s) => s.id === 'valuation-cape')!;
    expect(cape.strength).toBeLessThanOrEqual(0.25);
    expect(cape.whatItDoesNotTellYou).toMatch(/next year/i);
  });

  it('forbids printing a forecast', () => {
    expect(MULTIPLIER_RULES.neverPrinted.join(' ')).toMatch(/forecast of next year/i);
  });
});

describe('hedging across indices', () => {
  const sp = ALL_INDEX_OPTIONS.find((o) => o.index === 'SP500' && o.cap !== null)!;
  const other = ALL_INDEX_OPTIONS.find((o) => o.index !== 'SP500')!;

  it('rejects an allocation that does not total 100%', () => {
    expect(() => hedgeAcrossIndices([sp], [{ optionId: sp.id, weightPct: 80 }])).toThrow(RangeError);
  });

  it('reduces or matches floor years versus concentration, and reports the cost', () => {
    const r = hedgeAcrossIndices([sp, other], [
      { optionId: sp.id, weightPct: 60 },
      { optionId: other.id, weightPct: 40 },
    ]);
    expect(r.blendedFloorYears).toBeLessThanOrEqual(r.concentratedFloorYears);
    expect(r.plain).toMatch(/credited nothing/);
    expect(r.blendedCagr).toBeLessThanOrEqual(r.bestSingleCagr + 0.0001);
  });

  it('rejects an unknown option id', () => {
    expect(() => hedgeAcrossIndices([sp], [{ optionId: 'nope', weightPct: 100 }])).toThrow();
  });
});

describe('annual 80% loan strategy', () => {
  const base = {
    annualPremium: 100_000, premiumYears: 10, years: 30, issueAge: 45,
    drawFraction: 0.8, loanType: 'participating' as const, loanRate: 0.05,
    option: capped, premiumLoad: 0.06, accountChargeRate: 0.01,
    surrenderChargeYears: 10, firstLoanYear: 2,
  };

  it('runs and reports the loan peak alongside the return', () => {
    const r = runAnnualLoanStrategy({ ...base, startYear: 1994 });
    expect(r.years.length).toBeGreaterThan(0);
    expect(r.peakLapseRatio).toBeGreaterThan(0);
    expect(r.plain).toMatch(/Loan peaked at|LAPSED/);
  });

  it('charges loan interest in floor years while crediting nothing', () => {
    const r = runAnnualLoanStrategy({ ...base, startYear: 1994 });
    const floorRows = r.years.filter((y) => y.floorYear && y.loanBalance > 0);
    for (const row of floorRows) {
      expect(row.spreadOnBorrowed).toBeLessThan(0);
    }
  });

  it('warns that the floor does not protect against the loan rate', () => {
    const r = runAnnualLoanStrategy({ ...base, startYear: 1994 });
    if (r.negativeSpreadYears > 0) {
      expect(r.warnings.join(' ')).toMatch(/does not.*protect against the loan rate/i);
    }
  });

  it('warns about the thin buffer at an 80% draw', () => {
    const r = runAnnualLoanStrategy({ ...base, startYear: 1994 });
    expect(r.warnings.join(' ')).toMatch(/almost no buffer/);
  });

  it('prices phantom income when it lapses', () => {
    const r = runAnnualLoanStrategy({ ...base, startYear: 1994, drawFraction: 1.0, loanRate: 0.09 });
    if (r.lapsed) {
      expect(r.phantomIncomeIfLapsed).toBeGreaterThan(0);
      expect(r.plain).toMatch(/no policy and\s+no cash|taxable event/);
    }
  });

  it('rejects an out-of-range draw fraction', () => {
    expect(() => runAnnualLoanStrategy({ ...base, startYear: 1994, drawFraction: 1.5 })).toThrow(RangeError);
  });

  it('refuses a fixed-declared loan with no declared rate', () => {
    expect(() =>
      runAnnualLoanStrategy({ ...base, startYear: 1994, loanType: 'fixed-declared' }),
    ).toThrow(/declared credit rate/);
  });

  it('cost of insurance rises with attained age', () => {
    expect(approximateCoiRate(75)).toBeGreaterThan(approximateCoiRate(45));
    expect(approximateCoiRate(45)).toBeGreaterThan(approximateCoiRate(35));
  });

  it('start-year sensitivity exposes calendar dependence', () => {
    const s = startYearSensitivity(base, [1994, 1996, 1998, 2000]);
    expect(s.runs).toHaveLength(4);
    expect(s.plain).toMatch(/start years tested/);
  });
});

describe('option table audit — catches impossible products', () => {
  it('flags any option that credits positively in a deep down year', () => {
    const findings = auditOptionTable(ALL_INDEX_OPTIONS);
    const bonusBug = findings.filter((f) => f.issue.includes('added after'));
    for (const f of bonusBug) {
      expect(f.severity).toBe('blocker');
      expect(creditRate(ALL_INDEX_OPTIONS.find((o) => o.id === f.optionId)!, -40)).toBeGreaterThan(0);
    }
  });

  it('catches the Dynamic Low Vol bonus defect currently in the table', () => {
    const d = ALL_INDEX_OPTIONS.find((o) => o.id === 'amm-dynamic-bonus');
    if (d) {
      // 2008: the index fell 44.76%. A floored product credits 0, not 0.75.
      expect(creditRate(d, -44.76)).toBeGreaterThan(0);
      expect(auditOptionTable([d]).length).toBeGreaterThan(0);
    }
  });

  it('passes a well-formed option', () => {
    const clean = mk({ id: 'ok', cap: 10, participation: 100, spread: 0, strategyCharge: 0, bonus: 0 });
    expect(auditOptionTable([clean])).toHaveLength(0);
  });
});
