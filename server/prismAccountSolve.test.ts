import { describe, expect, it } from 'vitest';
import {
  MULTIPLIER_HYPOTHESIS,
  PRISM_POSITIONING,
  PRISM_SEGMENTS,
  PRISM_SOLVE,
  prismCredit,
  prismGrowthPct,
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

  it('reproduces every printed crediting rate at exactly 105%', () => {
    for (const s of PRISM_SEGMENTS) {
      const growth = prismGrowthPct(s.startingIndexValue, s.endingIndexValue);
      expect(
        prismPrintedCreditingPct(growth),
        `${s.label}: printed ${s.segmentCreditingRatePctPrinted}%`,
      ).toBeCloseTo(s.segmentCreditingRatePctPrinted, 1);
      expect(s.participationRatePrintedPct).toBe(105);
    }
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
  it('reproduces every dollar credit at 1.05 x 1.25, to under half a cent', () => {
    expect(credited.length).toBe(3);
    for (const s of credited) {
      const growth = prismGrowthPct(s.startingIndexValue, s.endingIndexValue);
      expect(
        prismCredit(growth, s.segmentAccumulationValueBeforeCredit),
        `${s.label}: printed $${s.indexCredit}`,
      ).toBeCloseTo(s.indexCredit, 2);
    }
  });

  it('the printed crediting rate alone does NOT reproduce the dollars', () => {
    for (const s of credited) {
      const naive = s.segmentAccumulationValueBeforeCredit * (s.segmentCreditingRatePctPrinted / 100);
      expect(naive, `${s.label}`).toBeLessThan(s.indexCredit);
    }
  });

  it('the shortfall is a constant 25% wherever the floor does not bind', () => {
    for (const s of credited) {
      const growth = prismGrowthPct(s.startingIndexValue, s.endingIndexValue);
      expect(printedRateUnderstatementPct(growth)).toBe(25);
    }
    expect(printedRateUnderstatementPct(-1)).toBe(0);
  });

  it('the effective factor is the product of the two', () => {
    expect(PRISM_SOLVE.participationOperative * PRISM_SOLVE.creditMultiplier).toBeCloseTo(
      PRISM_SOLVE.effectiveFactor,
      10,
    );
    expect(PRISM_SOLVE.effectiveFactor).toBe(1.3125);
  });

  it('is not a fit to one number: three segments across two orders of magnitude', () => {
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

  it('rests on five segments across two accounts', () => {
    const total = MULTIPLIER_HYPOTHESIS.fits.reduce((t, f) => t + f.segments, 0);
    expect(total).toBe(5);
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
