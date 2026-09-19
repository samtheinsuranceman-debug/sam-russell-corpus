import { describe, expect, it } from 'vitest';
import {
  MULTIPLIER_HYPOTHESIS,
  PRISM_POSITIONING,
  PRISM_SEGMENTS,
  PRISM_SOLVE,
  prismCredit,
  prismGrowthPct,
  tierFor,
  CONSECUTIVE_SEGMENT_PROOF,
  UNEXPLAINED_SEGMENT,
  prismPrintedCreditingPct,
  printedRateUnderstatementPct,
} from '../shared/prismAccountSolve';
import { OPERATIVE_MULTIPLIER } from '../shared/securianAnnualPolicyReview';

const credited = PRISM_SEGMENTS.filter((s) => s.indexCredit > 0);

describe('the printed participation rate is operative on this account', () => {
  it('reproduces every printed growth rate from the index values', () => {
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

  it('carries two printed participation tiers, not one', () => {
    const rates: number[] = [];
    for (const s of PRISM_SEGMENTS) {
      if (rates.indexOf(s.participationRatePrintedPct) === -1) rates.push(s.participationRatePrintedPct);
    }
    expect(rates.sort().join(',')).toBe('100,105');
  });

  it('is the first account in the audit where the printed rate holds', () => {
    // Elsewhere 105% printed against an operative 1.47. Here it is real.
    expect(PRISM_SOLVE.participationOperative).toBe(1.05);
    expect(OPERATIVE_MULTIPLIER).not.toBeCloseTo(PRISM_SOLVE.participationOperative, 2);
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

describe('but the dollar credit is 25% more than that rate implies', () => {
  it('reproduces every dollar credit at its tier factor, to under half a cent', () => {
    expect(credited.length).toBe(7);
    for (const s of credited) {
      const growth = prismGrowthPct(s.startingIndexValue, s.endingIndexValue);
      expect(
        prismCredit(growth, s.segmentAccumulationValueBeforeCredit, s.participationRatePrintedPct),
        `${s.label}: printed $${s.indexCredit}`,
      ).toBeCloseTo(s.indexCredit, 2);
    }
  });

  it('the 100% tier pays MORE per unit of growth than the 105% tier', () => {
    const lo = tierFor(100)!;
    const hi = tierFor(105)!;
    expect(lo.effectiveFactor).toBeGreaterThan(hi.effectiveFactor);
    // A participation rate alone tells you nothing about what an account pays.
    expect(lo.participationPrintedPct).toBeLessThan(hi.participationPrintedPct);
  });

  it('records the segment that does not fit rather than dropping it', () => {
    expect(UNEXPLAINED_SEGMENT.label).toBe('F');
    expect(UNEXPLAINED_SEGMENT.resolved).toBe(false);
    expect(UNEXPLAINED_SEGMENT.readings.length).toBe(2);
    const f = PRISM_SEGMENTS.filter((s) => s.label === 'F')[0];
    expect(prismGrowthPct(f.startingIndexValue, f.endingIndexValue)).toBeGreaterThan(0);
    expect(f.indexCredit).toBe(0);
  });

  it('two segments are consecutive, proving one rolling account', () => {
    const d = PRISM_SEGMENTS.filter((s) => s.label === CONSECUTIVE_SEGMENT_PROOF.first)[0];
    const h = PRISM_SEGMENTS.filter((s) => s.label === CONSECUTIVE_SEGMENT_PROOF.second)[0];
    expect(d.endingIndexValue).toBe(h.startingIndexValue);
    expect(d.endingIndexValue).toBe(CONSECUTIVE_SEGMENT_PROOF.sharedIndexValue);
  });

  it('the printed crediting rate alone does NOT reproduce the dollars', () => {
    for (const s of credited) {
      const naive = s.segmentAccumulationValueBeforeCredit * (s.segmentCreditingRatePctPrinted / 100);
      expect(naive, `${s.label}`).toBeLessThan(s.indexCredit);
    }
  });

  it('the shortfall on the 105% tier is a constant 25%', () => {
    expect(printedRateUnderstatementPct(1)).toBe(25);
    expect(printedRateUnderstatementPct(-1)).toBe(0);
  });

  it('the effective factor is the product of the two', () => {
    expect(PRISM_SOLVE.participationOperative * PRISM_SOLVE.creditMultiplier).toBeCloseTo(
      PRISM_SOLVE.effectiveFactor,
      10,
    );
    expect(PRISM_SOLVE.effectiveFactor).toBe(1.3125);
  });

  it('is not a fit to one number: wide ranges of value and growth', () => {
    const values = credited.map((s) => s.segmentAccumulationValueBeforeCredit);
    expect(Math.max.apply(null, values) / Math.min.apply(null, values)).toBeGreaterThan(4);
    const growths = credited.map((s) => prismGrowthPct(s.startingIndexValue, s.endingIndexValue));
    expect(Math.max.apply(null, growths) / Math.min.apply(null, growths)).toBeGreaterThan(50);
  });
});

describe('the multiplier hypothesis is labelled a hypothesis', () => {
  it('explains the indexed loan account with the same 105% and a different multiplier', () => {
    const loan = MULTIPLIER_HYPOTHESIS.fits.filter((f) => f.account.indexOf('Loan') !== -1)[0];
    expect(loan.participation * loan.multiplier).toBeCloseTo(OPERATIVE_MULTIPLIER, 10);
    expect(loan.multiplier).toBe(1.4);
  });

  it('records what it does not explain rather than omitting it', () => {
    expect(MULTIPLIER_HYPOTHESIS.status).toBe('hypothesis');
    expect(MULTIPLIER_HYPOTHESIS.doesNotFit.length).toBeGreaterThanOrEqual(2);
    expect(MULTIPLIER_HYPOTHESIS.doesNotFit.join(' ')).toMatch(/1\.6286/);
  });

  it('rests on nine segments across three accounts, with round multipliers', () => {
    const total = MULTIPLIER_HYPOTHESIS.fits.reduce((t, f) => t + f.segments, 0);
    expect(total).toBe(9);
    expect(MULTIPLIER_HYPOTHESIS.fits.length).toBe(3);
    for (const f of MULTIPLIER_HYPOTHESIS.fits) {
      // 1.25, 1.40, 1.60 - all land on a twentieth.
      expect(Math.round(f.multiplier * 20) / 20).toBeCloseTo(f.multiplier, 10);
      expect(f.participation * f.multiplier).toBeCloseTo(f.effective, 10);
    }
  });
});

describe('the PRISM story is the drawdown year, not the participation rate', () => {
  it('names the window that carries it', () => {
    const sep = PRISM_SEGMENTS.filter((s) => s.window === 'Sep 2021 - Sep 2022');
    expect(sep.length).toBe(1);
    expect(sep[0].indexCredit).toBeGreaterThan(0);
    expect(PRISM_POSITIONING.supportable).toMatch(/Sep 2021/);
  });

  it('discloses the other side of the trade in the same breath', () => {
    expect(PRISM_POSITIONING.theTradeToDisclose).toMatch(/gives up upside/i);
  });

  it('bans the participation comparison and the 131.25%-of-the-market claim', () => {
    expect(PRISM_POSITIONING.doNotSay.join(' ')).toMatch(/not comparable on participation/i);
    expect(PRISM_POSITIONING.doNotSay.join(' ')).toMatch(/131\.25% of a damped index/i);
  });
});
