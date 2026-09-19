import { describe, expect, it } from 'vitest';
import {
  BGA2_ACCOUNT_2_SEGMENTS,
  BGA2_STATEMENT,
  BGA2_TRANSFER_FUNCTION,
  CROSS_STATEMENT_FINDING,
  STRUCTURAL_AGREEMENT_WITH_SEGMENT_AUDIT,
  bga2Credit,
  bga2CreditingPct,
  bga2IndexGrowthPct,
  creditedIfPrintedParticipationWereReal,
} from '../shared/securianBGA2Statement';
import { OPERATIVE_MULTIPLIER, PRINTED_PARTICIPATION_PCT } from '../shared/securianAnnualPolicyReview';

describe('the statement reconciles three independent ways on every segment', () => {
  it('has six matured segments', () => {
    expect(BGA2_ACCOUNT_2_SEGMENTS.length).toBe(6);
  });

  it('reproduces every printed growth rate from the two index values', () => {
    for (const row of BGA2_ACCOUNT_2_SEGMENTS) {
      expect(
        bga2IndexGrowthPct(row.startingIndexValue, row.endingIndexValue),
        `${row.segmentStart}: statement prints ${row.indexGrowthRatePct}%`,
      ).toBeCloseTo(row.indexGrowthRatePct, 3);
    }
  });

  it('reproduces every printed crediting rate from the transfer function', () => {
    for (const row of BGA2_ACCOUNT_2_SEGMENTS) {
      expect(
        bga2CreditingPct(row.indexGrowthRatePct),
        `${row.segmentStart}: 0.84 x ${row.indexGrowthRatePct} - 5.25`,
      ).toBeCloseTo(row.segmentCreditingRatePct, 4);
    }
  });

  it('reproduces every printed dollar credit to the cent', () => {
    for (const row of BGA2_ACCOUNT_2_SEGMENTS) {
      expect(
        bga2Credit(row.indexGrowthRatePct, row.segmentAccumulationValueBeforeCredit),
        `${row.segmentStart}`,
      ).toBeCloseTo(row.indexCredit, 2);
    }
  });

  it('is not a fit to noise: the segments span a wide range of growth', () => {
    const growths = BGA2_ACCOUNT_2_SEGMENTS.map((r) => r.indexGrowthRatePct);
    expect(Math.max.apply(null, growths) - Math.min.apply(null, growths)).toBeGreaterThan(10);
    for (const row of BGA2_ACCOUNT_2_SEGMENTS) {
      expect(row.indexCredit).toBeGreaterThan(0);
    }
  });

  it('a least-squares refit returns the recorded coefficients', () => {
    const xs = BGA2_ACCOUNT_2_SEGMENTS.map((r) => r.indexGrowthRatePct);
    const ys = BGA2_ACCOUNT_2_SEGMENTS.map((r) => r.segmentCreditingRatePct);
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i += 1) {
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) * (xs[i] - mx);
    }
    const slope = num / den;
    const intercept = my - slope * mx;
    expect(slope).toBeCloseTo(BGA2_TRANSFER_FUNCTION.slope, 5);
    expect(intercept).toBeCloseTo(BGA2_TRANSFER_FUNCTION.interceptPoints, 4);
  });
});

describe('the printed participation rate overstates what the account paid', () => {
  it('prints 110% on every segment', () => {
    for (const row of BGA2_ACCOUNT_2_SEGMENTS) {
      expect(row.participationRatePrintedPct).toBe(110);
      expect(row.growthCap).toBe('Unlimited');
    }
  });

  it('would have promised materially more than the account credited, every time', () => {
    for (const row of BGA2_ACCOUNT_2_SEGMENTS) {
      const promised = creditedIfPrintedParticipationWereReal(row.indexGrowthRatePct);
      expect(promised, row.segmentStart).toBeGreaterThan(row.segmentCreditingRatePct);
      // Not a rounding gap. Every segment is out by more than ten points.
      expect(promised - row.segmentCreditingRatePct, row.segmentStart).toBeGreaterThan(10);
    }
  });

  it('the worst case is the first segment, out by roughly half again', () => {
    const first = BGA2_ACCOUNT_2_SEGMENTS[0];
    const promised = creditedIfPrintedParticipationWereReal(first.indexGrowthRatePct);
    expect(promised).toBeCloseTo(51.931, 2);
    expect(first.segmentCreditingRatePct).toBeCloseTo(34.406, 2);
    expect(promised / first.segmentCreditingRatePct).toBeGreaterThan(1.5);
  });
});

describe('the two statements contradict the printed rate in opposite directions', () => {
  it('the first statement understated, this one overstates', () => {
    // Indexed Loan Account: printed 105%, operative 1.47 -> printed is LOW.
    expect(OPERATIVE_MULTIPLIER).toBeGreaterThan(PRINTED_PARTICIPATION_PCT / 100);
    // Balanced Indexed Account 2: printed 110%, operative slope 0.84 -> printed is HIGH.
    expect(BGA2_TRANSFER_FUNCTION.slope).toBeLessThan(
      BGA2_TRANSFER_FUNCTION.printedParticipationPct / 100,
    );
  });

  it('records both directions as the reason no single explanation survives', () => {
    expect(CROSS_STATEMENT_FINDING.evidence.length).toBe(2);
    expect(CROSS_STATEMENT_FINDING.whyTheDirectionsMatter).toMatch(/opposite/i);
    expect(CROSS_STATEMENT_FINDING.salesConsequence).toMatch(/34\.41/);
  });

  it('claims only the functional form transfers between products, not the coefficients', () => {
    expect(STRUCTURAL_AGREEMENT_WITH_SEGMENT_AUDIT.transfersAcross).toBe('the functional form only');
    expect(STRUCTURAL_AGREEMENT_WITH_SEGMENT_AUDIT.thisStatement.deductionPoints).not.toBe(
      STRUCTURAL_AGREEMENT_WITH_SEGMENT_AUDIT.segmentAudit.deductionPoints,
    );
  });
});

describe('the statement carries no identifying information', () => {
  it('records product mechanics and nothing about the insured', () => {
    const serialised = JSON.stringify(BGA2_STATEMENT).toLowerCase();
    for (const forbidden of ['policy number', 'insured', 'scheib', 'wilmington', 'broadmoor']) {
      expect(serialised, `leaked ${forbidden}`).not.toContain(forbidden);
    }
    expect(BGA2_STATEMENT.product).toBe('Balanced Growth Accumulator II IUL');
  });
});
