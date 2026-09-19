import { describe, expect, it } from 'vitest';
import {
  CONSECUTIVE_CHAIN,
  MULTIPLIER_FINDING,
  OBSERVED_VINTAGES,
  PARTICIPATION_IS_NOT_A_RANKING,
  PRISM_POSITIONING,
  PRISM_SOLVE,
  PRISM_SEGMENTS,
  UNEXPLAINED_SEGMENT,
  prismCredit,
  prismGrowthPct,
  prismPrintedCreditingPct,
  printedRateUnderstatementPct,
  vintageForSegment,
} from '../shared/prismAccountSolve';
import { OPERATIVE_MULTIPLIER } from '../shared/securianAnnualPolicyReview';

const credited = PRISM_SEGMENTS.filter((s) => s.indexCredit > 0);

describe('the printed participation rate is operative on these accounts', () => {
  it('reproduces every printed growth rate from the index values', () => {
    expect(PRISM_SEGMENTS.length).toBe(14);
    for (const s of PRISM_SEGMENTS) {
      expect(
        prismGrowthPct(s.startingIndexValue, s.endingIndexValue),
        `${s.label}: printed ${s.indexGrowthRatePctPrinted}%`,
      ).toBeCloseTo(s.indexGrowthRatePctPrinted, 1);
    }
  });

  it('reproduces every printed crediting rate from its own printed participation', () => {
    for (const s of PRISM_SEGMENTS) {
      const growth = prismGrowthPct(s.startingIndexValue, s.endingIndexValue);
      expect(
        prismPrintedCreditingPct(growth, s.participationRatePrintedPct),
        `${s.label}: printed ${s.segmentCreditingRatePctPrinted}%`,
      ).toBeCloseTo(s.segmentCreditingRatePctPrinted, 1);
    }
  });

  it('floors a negative segment rather than debiting it', () => {
    const negative = PRISM_SEGMENTS.filter(
      (s) => prismGrowthPct(s.startingIndexValue, s.endingIndexValue) < 0,
    );
    expect(negative.length).toBe(1);
    for (const s of negative) {
      expect(s.segmentCreditingRatePctPrinted).toBe(0);
      expect(s.indexCredit).toBe(0);
    }
  });
});

describe('twelve credited segments reconcile on three vintages', () => {
  it('reproduces every dollar credit to under half a cent', () => {
    expect(credited.length).toBe(12);
    for (const s of credited) {
      const v = vintageForSegment(s.label);
      expect(v, `${s.label} has no vintage`).not.toBeNull();
      const growth = prismGrowthPct(s.startingIndexValue, s.endingIndexValue);
      expect(
        prismCredit(growth, s.segmentAccumulationValueBeforeCredit, v!.participationPrintedPct, v!.multiplier),
        `${s.label}: printed $${s.indexCredit}`,
      ).toBeCloseTo(s.indexCredit, 2);
    }
  });

  it('every vintage names the participation its segments actually print', () => {
    for (const v of OBSERVED_VINTAGES) {
      for (const label of v.segments) {
        const seg = PRISM_SEGMENTS.filter((s) => s.label === label)[0];
        expect(seg.participationRatePrintedPct, label).toBe(v.participationPrintedPct);
      }
    }
  });

  it('accounts for every credited segment exactly once', () => {
    const assigned: string[] = [];
    for (const v of OBSERVED_VINTAGES) {
      for (const label of v.segments) {
        expect(assigned.indexOf(label), `${label} assigned twice`).toBe(-1);
        assigned.push(label);
      }
    }
    expect(assigned.length).toBe(credited.length);
  });

  it('the printed crediting rate alone does NOT reproduce the dollars', () => {
    for (const s of credited) {
      const naive = s.segmentAccumulationValueBeforeCredit * (s.segmentCreditingRatePctPrinted / 100);
      expect(naive, `${s.label}`).toBeLessThan(s.indexCredit);
    }
  });

  it('the understatement is 25%, 40% and 60% by vintage', () => {
    const gaps = OBSERVED_VINTAGES.map((v) => Math.round(printedRateUnderstatementPct(v.multiplier)));
    expect(gaps.slice().sort((a, b) => a - b)).toEqual([25, 40, 60]);
  });

  it('is not a fit to one number: wide ranges of value and growth', () => {
    const values = credited.map((s) => s.segmentAccumulationValueBeforeCredit);
    expect(Math.max.apply(null, values) / Math.min.apply(null, values)).toBeGreaterThan(10);
    const growths = credited.map((s) => prismGrowthPct(s.startingIndexValue, s.endingIndexValue));
    expect(Math.max.apply(null, growths) / Math.min.apply(null, growths)).toBeGreaterThan(100);
  });
});

describe('the multiplier is per-vintage, which supersedes the per-account claim', () => {
  it('the same printed participation carries two different multipliers', () => {
    const at100 = OBSERVED_VINTAGES.filter((v) => v.participationPrintedPct === 100);
    expect(at100.length).toBe(2);
    expect(at100[0].multiplier).not.toBe(at100[1].multiplier);
    expect(PRISM_SOLVE.multiplierIsPerVintage).toBe(true);
  });

  it('so a multiplier cannot be derived from a participation rate', () => {
    // prismCredit demands the multiplier explicitly; this is why.
    const m14 = prismCredit(5, 1000, 100, 1.4);
    const m16 = prismCredit(5, 1000, 100, 1.6);
    expect(m14).not.toBeCloseTo(m16, 2);
  });

  it('records that it supersedes the earlier hypothesis rather than quietly replacing it', () => {
    expect(MULTIPLIER_FINDING.supersedes).toMatch(/per-ACCOUNT multiplier hypothesis/);
    expect(MULTIPLIER_FINDING.status).toBe('strong hypothesis');
  });

  it('the indexed loan account decomposes with a multiplier seen elsewhere', () => {
    // 1.47 = 1.05 x 1.40, and 1.40 appears on PRISM segments M and N.
    expect(1.05 * 1.4).toBeCloseTo(OPERATIVE_MULTIPLIER, 10);
    const has14 = OBSERVED_VINTAGES.filter((v) => v.multiplier === 1.4);
    expect(has14.length).toBe(1);
  });

  it('every multiplier lands on a twentieth', () => {
    for (const m of PRISM_SOLVE.multipliersObserved) {
      expect(Math.round(m * 20) / 20).toBeCloseTo(m, 10);
    }
  });

  it('records what it does not explain', () => {
    expect(MULTIPLIER_FINDING.doesNotFit.length).toBeGreaterThanOrEqual(2);
    expect(MULTIPLIER_FINDING.doesNotFit.join(' ')).toMatch(/1\.6286/);
  });
});

describe('the consecutive chain proves one rolling account across vintages', () => {
  it('each link shares an index value end-to-start', () => {
    for (const link of CONSECUTIVE_CHAIN) {
      const a = PRISM_SEGMENTS.filter((s) => s.label === link.from)[0];
      const b = PRISM_SEGMENTS.filter((s) => s.label === link.to)[0];
      expect(a.endingIndexValue, `${link.from} -> ${link.to}`).toBe(b.startingIndexValue);
      expect(a.endingIndexValue).toBe(link.sharedIndexValue);
    }
  });

  it('the chain crosses a vintage boundary, so both rates were redeclared', () => {
    const h = PRISM_SEGMENTS.filter((s) => s.label === 'H')[0];
    const l = PRISM_SEGMENTS.filter((s) => s.label === 'L')[0];
    expect(h.participationRatePrintedPct).not.toBe(l.participationRatePrintedPct);
    expect(vintageForSegment('H')!.multiplier).not.toBe(vintageForSegment('L')!.multiplier);
  });
});

describe('participation is not a ranking', () => {
  it('the lower printed rate pays more per unit of growth', () => {
    const at100 = OBSERVED_VINTAGES.filter((v) => v.participationPrintedPct === 100 && v.multiplier === 1.6)[0];
    const at105 = OBSERVED_VINTAGES.filter((v) => v.participationPrintedPct === 105)[0];
    expect(at100.participationPrintedPct).toBeLessThan(at105.participationPrintedPct);
    expect(at100.effectiveFactor).toBeGreaterThan(at105.effectiveFactor);
    expect(at100.effectiveFactor / at105.effectiveFactor).toBeGreaterThan(1.2);
  });

  it('the unprinted half of the calculation moves more than the printed half', () => {
    expect(PARTICIPATION_IS_NOT_A_RANKING.multiplierSpreadPct).toBeGreaterThan(
      PARTICIPATION_IS_NOT_A_RANKING.printedSpreadPoints,
    );
    expect(PARTICIPATION_IS_NOT_A_RANKING.consequence).toMatch(/gets the order wrong/i);
  });
});

describe('the unfitted segment and the PRISM story', () => {
  it('records segment F rather than dropping it', () => {
    expect(UNEXPLAINED_SEGMENT.label).toBe('F');
    expect(UNEXPLAINED_SEGMENT.resolved).toBe(false);
    expect(UNEXPLAINED_SEGMENT.readings.length).toBe(2);
    expect(vintageForSegment('F')).toBeNull();
  });

  it('names the drawdown window that carries the story', () => {
    const sep = PRISM_SEGMENTS.filter((s) => s.window === 'Sep 2021 - Sep 2022');
    expect(sep.length).toBe(1);
    expect(sep[0].indexCredit).toBeGreaterThan(0);
    expect(PRISM_POSITIONING.supportable).toMatch(/Sep 2021/);
  });

  it('discloses the lag year from the same data, in the same object', () => {
    expect(PRISM_POSITIONING.theTradeToDisclose).toMatch(/Jun 2023 to Jun 2024/);
    expect(PRISM_POSITIONING.theTradeToDisclose).toMatch(/1\.31%/);
  });

  it('bans quoting any multiplier as a rate', () => {
    expect(PRISM_POSITIONING.doNotSay.join(' ')).toMatch(/redeclared by vintage/i);
    expect(PRISM_POSITIONING.doNotSay.join(' ')).toMatch(/not comparable on participation/i);
  });
});
