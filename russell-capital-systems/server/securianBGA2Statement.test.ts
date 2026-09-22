import { describe, expect, it } from 'vitest';
import {
  BGA2_ACCOUNT_2_SEGMENTS,
  BGA2_STATEMENT,
  BGA2_TRANSFER_FUNCTION,
  CROSS_STATEMENT_FINDING,
  STRUCTURAL_AGREEMENT_WITH_SEGMENT_AUDIT,
  ACCOUNT_TERMS,
  BGA2_MONTHLY_CHARGES,
  CURRENT_GROWTH_CAPS,
  INDEX_NAMED,
  MATURITY_RULE,
  POSTED_CREDITS_LEDGER,
  READ_COVERAGE,
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

describe('a multi-year segment credits once, at its end, and nothing before', () => {
  it('only the segments that matured in the period appear on the crediting page', () => {
    expect(MATURITY_RULE.segmentsMaturedInPeriod).toBe(BGA2_ACCOUNT_2_SEGMENTS.length);
  });

  it('the two accounts in force run on different terms, and only one has credited', () => {
    const a2 = ACCOUNT_TERMS.filter((a) => a.account === 'Balanced Indexed Account 2')[0];
    const a7 = ACCOUNT_TERMS.filter((a) => a.account === 'Balanced Indexed Account 7')[0];
    expect(a2.segmentYears).toBe(2);
    expect(a7.segmentYears).toBe(3);
    expect(a2.participationPrintedPct).toBe(110);
    expect(a7.participationPrintedPct).toBe(115);
    expect(a2.creditedInThisPeriod).toBe(true);
    expect(a7.creditedInThisPeriod).toBe(false);
  });

  it('first credit lands in month 25 on a 2-year account and month 37 on a 3-year', () => {
    expect(MATURITY_RULE.account2FirstCreditMonth).toBe(24 + 1);
    expect(MATURITY_RULE.account7FirstCreditMonth).toBe(36 + 1);
  });

  it('the solved transfer function is the 2-year account and is not applied to the 3-year one', () => {
    const a2 = ACCOUNT_TERMS.filter((a) => a.account === 'Balanced Indexed Account 2')[0];
    expect(BGA2_TRANSFER_FUNCTION.segmentYears).toBe(a2.segmentYears);
    // No segment of Account 7 has matured, so there is nothing to fit it to.
    expect(MATURITY_RULE.accountsWithNoCreditYet).toContain('Balanced Indexed Account 7');
  });

  it('the credits total what the six segments paid', () => {
    const sum = BGA2_ACCOUNT_2_SEGMENTS.reduce((t, r) => t + r.indexCredit, 0);
    expect(sum).toBeCloseTo(MATURITY_RULE.totalCreditedInPeriod, 2);
  });
});

describe('the transaction ledger confirms the credits a third time', () => {
  it('every posting matches a solved segment, to the cent', () => {
    for (const p of POSTED_CREDITS_LEDGER) {
      const match = BGA2_ACCOUNT_2_SEGMENTS.filter(
        (r) => Math.abs(r.indexCredit - p.amount) < 0.005,
      );
      expect(match.length, `no solved segment pays ${p.amount}`).toBe(1);
      expect(p.accountAffected).toBe('Balanced Indexed Account 2');
    }
  });

  it('credits land in the indexed account here, unlike the other statement on file', () => {
    // Recorded so nobody generalises where a credit posts from one policy.
    for (const p of POSTED_CREDITS_LEDGER) {
      expect(p.accountAffected).not.toBe('Interim Account');
    }
  });
});

describe('the index and the floor are read, not inferred', () => {
  it('names the index from the growth caps page', () => {
    expect(INDEX_NAMED).toBe('S&P 500');
    const named = CURRENT_GROWTH_CAPS.filter((c) => c.account.indexOf('S&P 500') !== -1);
    expect(named.length).toBeGreaterThan(0);
  });

  it('a 100% participation account on the same page is capped where the Balanced ones are not', () => {
    const hundred = CURRENT_GROWTH_CAPS.filter(
      (c) => c.account === 'Index A - S&P 500 100% Participation',
    )[0];
    expect(hundred.cap).toBe('8.50%');
    for (const a of ACCOUNT_TERMS) expect(a.cap).toBe('Unlimited');
  });

  it('carries the 0% floor as a printed term', () => {
    for (const a of ACCOUNT_TERMS) expect(a.floorPrintedPct).toBe(0);
  });

  it('monthly charges add to the printed total', () => {
    const parts =
      BGA2_MONTHLY_CHARGES.costOfInsurance +
      BGA2_MONTHLY_CHARGES.monthlyPolicyCharge +
      BGA2_MONTHLY_CHARGES.agreementsCharge +
      BGA2_MONTHLY_CHARGES.policyIssueCharge;
    expect(parts).toBeCloseTo(BGA2_MONTHLY_CHARGES.total, 2);
  });
});

describe('read coverage is stated rather than implied', () => {
  it('does not claim the statement was read in full', () => {
    expect(READ_COVERAGE.complete).toBe(false);
    expect(READ_COVERAGE.pagesRead.length).toBeLessThan(READ_COVERAGE.pagesInDocument);
  });

  it('every page an assertion rests on is in the read list', () => {
    for (const page of [6, 9, 15, 19]) {
      expect(READ_COVERAGE.pagesRead, `page ${page} carries a recorded finding`).toContain(page);
    }
  });
});
