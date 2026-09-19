import { describe, expect, it } from 'vitest';
import {
  DOCUMENTS_THAT_WOULD_CLOSE_THIS,
  INVENTORY_RULES,
  PRISM_FINDING,
  SECURIAN_ACCOUNTS,
  accountById,
  accountsWithContradictedParticipation,
  openQuestions,
  printedRateDirection,
  solvedAccounts,
} from '../shared/securianAccountInventory';
import { BGA2_ACCOUNT_2_SEGMENTS } from '../shared/securianBGA2Statement';
import { OPERATIVE_MULTIPLIER } from '../shared/securianAnnualPolicyReview';
import { TWELVE_SEGMENT_SOLUTION } from '../shared/segmentAudit';

const PRINTED = PRISM_FINDING.printedParticipationPct;

describe('the inventory agrees with every source it was assembled from', () => {
  it('carries the BGA II Account 2 solve exactly as that module records it', () => {
    const a = accountById('bia2-bga2')!;
    expect(a.observed!.multiplier).toBe(0.84);
    expect(a.observed!.deductionPointsPerSegment).toBe(5.25);
    expect(a.observed!.segmentsObserved).toBe(BGA2_ACCOUNT_2_SEGMENTS.length);
  });

  it('carries the Indexed Loan Account multiplier from its own module', () => {
    const a = accountById('indexed-loan-account')!;
    expect(a.observed!.multiplier).toBe(OPERATIVE_MULTIPLIER);
  });

  it('carries the BGA3 deduction from the twelve-segment solution', () => {
    const a = accountById('bia2-bga3')!;
    expect(a.observed!.deductionPointsPerSegment).toBe(
      TWELVE_SEGMENT_SOLUTION.spreadPointsPerSegment,
    );
    // Three participation groups mean the multiplier is not one number.
    expect(a.observed!.multiplier).toBeNull();
    expect(TWELVE_SEGMENT_SOLUTION.participationGroups.length).toBe(3);
  });

  it('carries the PRISM observation from the disproof that established it', () => {
    const a = accountById('bia8')!;
    expect(a.observed!.multiplier).toBe(TWELVE_SEGMENT_SOLUTION.prismDisproof.multipleOfIndex);
    expect(PRISM_FINDING.actuallyCredited).toBe(TWELVE_SEGMENT_SOLUTION.prismDisproof.creditedPct);
    expect(PRISM_FINDING.onIndexGrowth).toBe(TWELVE_SEGMENT_SOLUTION.prismDisproof.growthPct);
  });
});

describe('the printed participation rate is wrong in both directions', () => {
  it('contradicts the printed rate on four accounts', () => {
    const bad = accountsWithContradictedParticipation();
    expect(bad.length).toBeGreaterThanOrEqual(3);
    for (const a of bad) expect(printedRateDirection(a)).not.toBe('unknown');
  });

  it('overstates on the 2-year S&P account and understates on PRISM and the loan account', () => {
    expect(printedRateDirection(accountById('bia2-bga2')!)).toBe('overstates');
    expect(printedRateDirection(accountById('bia8')!)).toBe('understates');
    expect(printedRateDirection(accountById('indexed-loan-account')!)).toBe('understates');
  });

  it('prints 105% on three different accounts that behave three different ways', () => {
    const at105 = SECURIAN_ACCOUNTS.filter((a) => a.participationPrintedPct === 105);
    expect(at105.length).toBeGreaterThanOrEqual(3);
    const behaviours: number[] = [];
    for (const a of at105) {
      if (a.observed && a.observed.multiplier !== null) behaviours.push(a.observed.multiplier);
    }
    // Same printed number, materially different observed behaviour.
    expect(Math.max.apply(null, behaviours) - Math.min.apply(null, behaviours)).toBeGreaterThan(0.2);
  });
});

describe('what is not known is recorded rather than filled in', () => {
  it('every account states at least one open question', () => {
    for (const a of SECURIAN_ACCOUNTS) {
      expect(a.unknown.length, `${a.carrierLabel} claims to have no unknowns`).toBeGreaterThan(0);
    }
  });

  it('two accounts have never been seen crediting anything', () => {
    const neverObserved = SECURIAN_ACCOUNTS.filter((a) => a.observed === null);
    expect(neverObserved.length).toBeGreaterThanOrEqual(2);
    for (const a of neverObserved) {
      expect(a.evidence).not.toBe('solved');
      expect(a.evidence).not.toBe('single-observation');
    }
  });

  it('nothing with one observation is marked solved', () => {
    for (const a of solvedAccounts()) {
      expect(a.observed, a.carrierLabel).not.toBeNull();
      expect(a.observed!.segmentsObserved, a.carrierLabel).toBeGreaterThan(1);
    }
  });

  it('no account claims a per-account fee it was never shown to charge', () => {
    // Only the Indexed Loan Account has a published account-level charge. On
    // both policies audited, deductions were policy-level monthly charges.
    const withCharge = SECURIAN_ACCOUNTS.filter((a) => a.accountChargeAnnualPct !== null);
    expect(withCharge.length).toBe(1);
    expect(withCharge[0].id).toBe('indexed-loan-account');
    expect(withCharge[0].accountChargeAnnualPct).toBe(4.75);
  });

  it('the open-question queue is populated and attributed', () => {
    const qs = openQuestions();
    expect(qs.length).toBeGreaterThan(10);
    for (const q of qs) {
      expect(q.account.length).toBeGreaterThan(0);
      expect(q.question.length).toBeGreaterThan(20);
    }
  });

  it('names the documents that would close the most questions', () => {
    expect(DOCUMENTS_THAT_WOULD_CLOSE_THIS.length).toBeGreaterThanOrEqual(4);
    expect(DOCUMENTS_THAT_WOULD_CLOSE_THIS.join(' ')).toMatch(/factsheet/i);
  });
});

describe('PRISM is recorded with the caveat that matters more than the number', () => {
  it('rests on exactly one segment and says so', () => {
    expect(PRISM_FINDING.segmentsObserved).toBe(1);
    expect(accountById('bia8')!.evidence).toBe('single-observation');
  });

  it('cannot have been produced at the printed rate', () => {
    expect(PRISM_FINDING.actuallyCredited).toBeGreaterThan(
      PRISM_FINDING.maximumPossibleAtPrintedRate,
    );
    expect(PRISM_FINDING.onIndexGrowth * (PRINTED / 100)).toBeCloseTo(
      PRISM_FINDING.maximumPossibleAtPrintedRate,
      1,
    );
  });

  it('refuses to be quoted as a participation rate', () => {
    expect(PRISM_FINDING.doNotQuote).toMatch(/171%/);
    expect(PRISM_FINDING.whyNotAWindfall).toMatch(/volatility-controlled|damped/i);
  });

  it('bans comparing PRISM participation to S&P 500 participation', () => {
    expect(INVENTORY_RULES.neverPrinted.join(' ')).toMatch(
      /PRISM participation compared against S&P 500 participation/i,
    );
  });
});

describe('house names are a presentation layer, not a disguise', () => {
  it('every account keeps its carrier label alongside the house name', () => {
    for (const a of SECURIAN_ACCOUNTS) {
      expect(a.carrierLabel.length, a.id).toBeGreaterThan(0);
      expect(a.houseName.length, a.id).toBeGreaterThan(0);
    }
  });

  it('bans substituting a house name for the product a client is buying', () => {
    expect(INVENTORY_RULES.neverPrinted.join(' ')).toMatch(
      /house name in place of the carrier and product/i,
    );
  });

  it('accounts sharing a shape share a house name across product generations', () => {
    expect(accountById('bia2-bga2')!.houseName).toBe(accountById('bia2-bga3')!.houseName);
    // ...and still carry different observed coefficients, which is the point.
    expect(accountById('bia2-bga2')!.observed!.deductionPointsPerSegment).not.toBe(
      accountById('bia2-bga3')!.observed!.deductionPointsPerSegment,
    );
  });
});
