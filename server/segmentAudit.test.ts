/**
 * The Securian segment, pinned as a regression.
 *
 * This is the first piece of in-force evidence in the corpus — not a brochure
 * saying what an account should do, but a carrier's own system reporting what
 * one did. It is kept because it falsifies a naive reading of the crediting
 * formula, and a module that ever starts "reconciling" it by picking a segment
 * length has stopped being trustworthy.
 *
 * No policy number and no policy dollar values are recorded here. The rates are
 * product evidence; the balances are somebody's private business.
 */

import { describe, it, expect } from 'vitest';
import {
  SEGMENT_AUDIT_VERSION,
  auditSegment,
  creditAppliedCorrectly,
  type ObservedSegment,
} from '../shared/segmentAudit';
import { UNCAPPED_SENTINELS, creditFor, normaliseCap, shapeById } from '../shared/indexAccountShapes';

/** The segment as the advisor portal displayed it. */
const securian: ObservedSegment = {
  label: 'Securian indexed segment, 105% participation, uncapped',
  startIndexValue: 4780.94,
  endIndexValue: 6944.47,
  statedGrowthRatePct: 45.25,
  participationPct: 105,
  growthCapPct: 9999999900,
  creditedRatePct: 26.96,
};

describe('the Securian segment', () => {
  it('confirms the growth rate the carrier printed', () => {
    const a = auditSegment(securian);
    expect(a.computedGrowthPct).toBeCloseTo(45.2532, 3);
    expect(a.growthAgrees).toBe(true);
  });

  it('recognises 9999999900% as a sentinel, not a cap', () => {
    const a = auditSegment(securian);
    expect(a.capIsSentinel).toBe(true);
    expect(a.effectiveCapPct).toBeNull();
    // So the cap never enters the expected figure — it is 45.25% × 105% flat.
    expect(a.expectedCreditedPct).toBeCloseTo(47.5159, 3);
  });

  it('does not reconcile, and says so rather than finding a way', () => {
    const a = auditSegment(securian);
    expect(a.reconciles).toBe(false);
    expect(a.gapPct).toBeCloseTo(20.5559, 3);
    expect(a.summary).toMatch(/does NOT reconcile/);
    expect(a.summary).toMatch(/not on the screen/);
  });

  it('offers every segment length that would work and picks none', () => {
    const a = auditSegment(securian);
    expect(a.candidates.length).toBe(8);
    const byYear = new Map(a.candidates.map((c) => [c.segmentYears, c]));
    // One year needs a charge no loan carries, which is the whole point.
    expect(byYear.get(1)!.compoundingChargePct).toBeGreaterThan(15);
    // Two years lands at 7.79% a year compounding; four at 3.82%.
    expect(byYear.get(2)!.compoundingChargePct).toBeCloseTo(7.79, 1);
    expect(byYear.get(4)!.compoundingChargePct).toBeCloseTo(3.82, 1);
    // And the candidates differ enough that guessing would matter.
    expect(byYear.get(2)!.compoundingChargePct - byYear.get(4)!.compoundingChargePct).toBeGreaterThan(3);
  });

  it('names the segment length as the missing fact', () => {
    const a = auditSegment(securian);
    expect(a.missing.join(' ')).toMatch(/segment length/i);
    expect(a.missing.join(' ')).toMatch(/Which charge the gap is/i);
    expect(SEGMENT_AUDIT_VERSION.neverPrinted.join(' ')).toMatch(/chosen because it made the numbers work/);
  });

  it('confirms the credit was applied to the right base', () => {
    // The check that made the 26.96% worth reconciling at all: the dollar
    // credit divided by the segment value before crediting reproduces the
    // stated rate to four decimal places.
    const c = creditAppliedCorrectly(3823.09, 1030.75, 26.96);
    expect(c.ok).toBe(true);
    expect(c.impliedRatePct).toBeCloseTo(26.9612, 3);
  });

  it('catches a credit applied to the wrong base', () => {
    const c = creditAppliedCorrectly(3823.09, 1030.75, 22.0);
    expect(c.ok).toBe(false);
    expect(c.detail).toMatch(/different base|one of the two figures is wrong/);
  });

  it('reconciles a segment that actually does', () => {
    const clean = auditSegment({
      ...securian,
      participationPct: 100,
      creditedRatePct: 45.2532,
    });
    expect(clean.reconciles).toBe(true);
    expect(clean.candidates).toEqual([]);
    expect(clean.summary).toMatch(/reconciles/);
  });

  it('flags crediting above participation as needing a bonus, not a charge', () => {
    const rich = auditSegment({ ...securian, participationPct: 100, creditedRatePct: 60 });
    expect(rich.gapPct).toBeLessThan(0);
    expect(rich.candidates).toEqual([]);
    expect(rich.missing.join(' ')).toMatch(/benefit, a bonus or a multiplier/i);
  });

  it('honours a real cap when the field is not a sentinel', () => {
    const capped = auditSegment({ ...securian, growthCapPct: 10, creditedRatePct: 10 });
    expect(capped.capIsSentinel).toBe(false);
    expect(capped.expectedCreditedPct).toBe(10);
    expect(capped.reconciles).toBe(true);
  });
});

describe('uncapped sentinels', () => {
  it('normalises every known sentinel to null', () => {
    for (const s of UNCAPPED_SENTINELS) expect(normaliseCap(s), String(s)).toBeNull();
  });

  it('keeps a real cap, converted from percent to decimal', () => {
    expect(normaliseCap(10.5)).toBeCloseTo(0.105, 10);
    expect(normaliseCap(24)).toBeCloseTo(0.24, 10);
    expect(normaliseCap(null)).toBeNull();
    expect(normaliseCap(NaN)).toBeNull();
  });
});

describe('a loaned indexed account', () => {
  it('nets the loan charge against the credit rather than subtracting it', () => {
    // The two run concurrently, so the net is a ratio. Subtracting overstates
    // the result, and by more the longer the segment.
    const base = shapeById('mn-bga3-indexed-a')!;
    const loaned = { ...base, segmentYears: 2, cap: null, loanChargeAnnual: 0.0475 };
    const r = creditFor(loaned, 0.2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const accrued = Math.pow(1.0475, 2) - 1;
    const expected = 1.2 / (1 + accrued) - 1; // 20% credited, charge compounded
    expect(r.segmentCredited).toBeCloseTo(expected, 10);

    // Subtraction would have given 20% − 9.73% = 10.27%; the ratio gives less.
    expect(r.segmentCredited).toBeLessThan(0.2 - accrued + 1e-9);
    expect(r.working).toMatch(/loan charge a year, compounding to/);
  });

  it('leaves an unloaned account untouched', () => {
    const base = shapeById('mn-bga3-indexed-a')!;
    expect(base.loanChargeAnnual).toBeUndefined();
    const r = creditFor(base, 0.08);
    expect(r.ok && r.segmentCredited).toBeCloseTo(0.08, 10);
    expect(r.ok && r.working).not.toMatch(/loan charge/);
  });
});

describe('the segment, once the owner supplied 24 months', () => {
  /** Same segment, with the length the screen did not carry. */
  const known = { ...securian, segmentYears: 2 };

  it('collapses to a single reconciliation instead of eight', () => {
    const a = auditSegment(known);
    expect(a.candidates.length).toBe(1);
    expect(a.candidates[0].segmentYears).toBe(2);
    expect(a.candidates[0].compoundingChargePct).toBeCloseTo(7.79, 1);
    expect(a.candidates[0].simpleChargePct).toBeCloseTo(10.28, 1);
    // And the implied annual index growth becomes checkable: ~20.5% a year,
    // which is a strong but not impossible two-year run for the S&P 500.
    expect(a.candidates[0].impliedAnnualIndexGrowthPct).toBeCloseTo(20.52, 1);
  });

  it('stops asking for the segment length once it has it', () => {
    expect(auditSegment(known).missing.join(' ')).not.toMatch(/segment length/i);
    expect(auditSegment(securian).missing.join(' ')).toMatch(/segment length/i);
  });

  it('rules out the half-the-money reading arithmetically', () => {
    // The theory: the credit applies to only half the allocated money, so the
    // credited rate is half the participated rate. If that were so, doubling
    // the credit would land at or below full participation. It lands above, so
    // the credit is MORE than half the participated amount and cannot be a
    // halving of it. This is the one part of the owner's reading that the
    // numbers settle on their own.
    const a = auditSegment(known);
    const doubled = a.actualCreditedPct * 2;
    const atFullParticipation = a.computedGrowthPct * 1.1; // 110%
    expect(doubled).toBeGreaterThan(atFullParticipation);
    expect(doubled).toBeCloseTo(53.92, 1);
    expect(atFullParticipation).toBeCloseTo(49.78, 1);
  });

  it('does not close on 110% participation less a 2.50% spread either', () => {
    // The owner's stated product spec, tested directly: 110% of the index less
    // a 2.50% spread is 47.28% over the segment, against 26.96% credited. The
    // spec and the segment disagree by 20.32 points, so one of them is
    // describing something the other is not — which is why more documents are
    // the answer and not more arithmetic.
    const perSpec = auditSegment({ ...known, participationPct: 110, spreadPct: 2.5 });
    expect(perSpec.expectedCreditedPct).toBeCloseTo(47.28, 1);
    expect(perSpec.reconciles).toBe(false);
    expect(perSpec.gapPct).toBeCloseTo(20.32, 1);
    // Closing it would need a 7.71% annual charge, which is not the 4.75%
    // indexed loan charge on the carrier's loan page.
    expect(perSpec.candidates[0].compoundingChargePct).toBeCloseTo(7.71, 1);
    expect(perSpec.candidates[0].compoundingChargePct).toBeGreaterThan(4.75);
  });

  it('keeps the participation discrepancy visible rather than picking a side', () => {
    // The screen printed 105.00%; the owner states the account is 110%. Both
    // audits are kept because the difference is a real question: on several
    // products 110% current sits above a 105% guaranteed minimum, so a portal
    // printing 105 on an ALREADY CREDITED segment may mean the segment credited
    // at the guaranteed floor. That is worth a phone call, not a silent pick.
    const atScreen = auditSegment(known);
    const atSpec = auditSegment({ ...known, participationPct: 110 });
    expect(atScreen.expectedCreditedPct).toBeCloseTo(47.52, 1);
    expect(atSpec.expectedCreditedPct).toBeCloseTo(49.78, 1);
    expect(atSpec.expectedCreditedPct).toBeGreaterThan(atScreen.expectedCreditedPct);
    // Neither reconciles, so the participation rate is not the gap's cause.
    expect(atScreen.reconciles).toBe(false);
    expect(atSpec.reconciles).toBe(false);
  });
});
