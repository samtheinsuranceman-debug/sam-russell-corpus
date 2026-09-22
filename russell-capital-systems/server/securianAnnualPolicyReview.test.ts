import { describe, expect, it } from 'vitest';
import {
  GROWTH_RATE_AND_INDEX_CREDIT_DETAIL,
  MONTHLY_CHARGES,
  OPERATIVE_MULTIPLIER,
  POLICY_STATE,
  POSTED_INDEX_CREDITS,
  PRINTED_PARTICIPATION_PCT,
  indexGrowthPct,
  indexedLoanAccountCredit,
  indexedLoanAccountCreditingPct,
} from '../shared/securianAnnualPolicyReview';

const loanRows = GROWTH_RATE_AND_INDEX_CREDIT_DETAIL.filter(
  (r) => r.account === 'Indexed Loan Account',
);

describe('the index growth rates the statement prints are plain point-to-point', () => {
  it('reproduces every printed growth rate to five decimal places', () => {
    expect(GROWTH_RATE_AND_INDEX_CREDIT_DETAIL.length).toBe(4);
    for (const row of GROWTH_RATE_AND_INDEX_CREDIT_DETAIL) {
      const computed = indexGrowthPct(row.startingIndexValue, row.endingIndexValue);
      expect(
        computed,
        `${row.account} ${row.segmentStart}: statement prints ${row.indexGrowthRatePct}%`,
      ).toBeCloseTo(row.indexGrowthRatePct, 4);
    }
  });
});

describe('the Indexed Loan Account credits at 1.47x, not at the participation rate it prints', () => {
  it('has three segments, all printing 105% participation', () => {
    expect(loanRows.length).toBe(3);
    for (const row of loanRows) {
      expect(row.participationRatePrintedPct).toBe(PRINTED_PARTICIPATION_PCT);
      expect(row.growthCap).toBe('Unlimited');
    }
  });

  it('reproduces both printed crediting rates from the multiplier alone', () => {
    const credited = loanRows.filter((r) => r.segmentCreditingRatePct > 0);
    expect(credited.length).toBe(2);
    for (const row of credited) {
      expect(
        indexedLoanAccountCreditingPct(row.indexGrowthRatePct),
        `${row.segmentStart}: ${row.indexGrowthRatePct}% x ${OPERATIVE_MULTIPLIER}`,
      ).toBeCloseTo(row.segmentCreditingRatePct, 4);
    }
  });

  it('floors a negative segment at zero rather than debiting it', () => {
    const negative = loanRows.filter((r) => r.indexGrowthRatePct < 0);
    expect(negative.length).toBe(1);
    for (const row of negative) {
      expect(row.segmentCreditingRatePct).toBe(0);
      expect(indexedLoanAccountCreditingPct(row.indexGrowthRatePct)).toBe(0);
      expect(indexedLoanAccountCredit(row.indexGrowthRatePct, row.segmentAccumulationValueBeforeCredit)).toBe(0);
    }
  });

  it('the printed participation rate cannot produce the printed crediting rate', () => {
    // The whole point. If 105% were operative, 8.10527% could credit at most
    // 8.51053%. The statement says 11.91475%.
    for (const row of loanRows.filter((r) => r.segmentCreditingRatePct > 0)) {
      const atPrintedParticipation =
        row.indexGrowthRatePct * (row.participationRatePrintedPct / 100);
      expect(
        atPrintedParticipation,
        `${row.segmentStart} would cap at ${atPrintedParticipation}% if 105% were real`,
      ).toBeLessThan(row.segmentCreditingRatePct);
    }
  });
});

describe('the transaction ledger settles what the growth-rate table reports as zero', () => {
  it('every row of the growth-rate table prints $0.00 in its index credit column', () => {
    for (const row of GROWTH_RATE_AND_INDEX_CREDIT_DETAIL) {
      expect(row.indexCreditOnThisRow).toBe(0);
    }
  });

  it('yet two dollar credits were posted, and the model reproduces both to the cent', () => {
    const credited = loanRows
      .filter((r) => r.segmentCreditingRatePct > 0)
      .slice()
      .sort((a, b) => a.segmentStart.localeCompare(b.segmentStart));
    const posted = POSTED_INDEX_CREDITS.slice().sort((a, b) => a.date.localeCompare(b.date));

    expect(credited.length).toBe(posted.length);
    for (let i = 0; i < credited.length; i += 1) {
      const row = credited[i];
      expect(
        indexedLoanAccountCredit(row.indexGrowthRatePct, row.segmentAccumulationValueBeforeCredit),
        `segment ${row.segmentStart} vs posting ${posted[i].date}`,
      ).toBeCloseTo(posted[i].amount, 2);
      expect(posted[i].accountAffected).toBe('Interim Account');
    }
  });

  it('the postings are not vacuous', () => {
    expect(POSTED_INDEX_CREDITS.length).toBe(2);
    for (const p of POSTED_INDEX_CREDITS) {
      expect(p.amount).toBeGreaterThan(0);
    }
  });
});

describe('policy-level facts that are read rather than inferred', () => {
  it('carries the variable policy loan rate as the statement states it', () => {
    expect(POLICY_STATE.variablePolicyLoanRate.before).toBe(4.0);
    expect(POLICY_STATE.variablePolicyLoanRate.after).toBe(4.25);
    expect(POLICY_STATE.variablePolicyLoanRate.effective).toBe('2024-10-01');
  });

  it('is none of the three charges the twelve-modal audit produced', () => {
    // 4.51 / 6.29 / 7.16 were candidate in-segment deductions. A policy loan
    // interest rate is a different quantity and this is the proof.
    for (const candidate of [4.51, 6.29, 7.16]) {
      expect(POLICY_STATE.variablePolicyLoanRate.after).not.toBeCloseTo(candidate, 2);
      expect(POLICY_STATE.variablePolicyLoanRate.before).not.toBeCloseTo(candidate, 2);
    }
  });

  it('allocation sums to 100 percent across the funded accounts', () => {
    const total = POLICY_STATE.currentAllocation.reduce((sum, a) => sum + a.percent, 0);
    expect(total).toBe(100);
  });

  it('monthly charges add up to the total the statement prints', () => {
    const parts =
      MONTHLY_CHARGES.costOfInsurance +
      MONTHLY_CHARGES.monthlyPolicyCharge +
      MONTHLY_CHARGES.policyIssueCharge;
    expect(parts).toBeCloseTo(MONTHLY_CHARGES.total, 2);
    expect(MONTHLY_CHARGES.annualised).toBeCloseTo(2684.76, 2);
  });
});
