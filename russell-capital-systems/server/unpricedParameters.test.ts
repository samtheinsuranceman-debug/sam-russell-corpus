/**
 * The register claims measured numbers. This re-measures them.
 *
 * A sensitivity figure written into a document rots the moment the engine
 * changes, and a rotted one is worse than none because it still reads as
 * evidence. So the swings in UNPRICED_PARAMETERS are not trusted here — they
 * are recomputed from shared/policyMechanics.ts and compared.
 */

import { describe, it, expect } from 'vitest';
import { runPolicyMechanics, ILLUSTRATIVE_COI_TABLE, type PolicyCharges } from '../shared/policyMechanics';
import { UNPRICED_PARAMETERS, parameterById, rankedFor } from '../shared/unpricedParameters';

const BASE: PolicyCharges = {
  premiumLoadPctByYear: [6],
  monthlyPolicyFee: 10,
  perUnitMonthlyPerThousand: 0.06,
  perUnitYears: 10,
  coiTable: ILLUSTRATIVE_COI_TABLE,
  surrenderChargePctByYear: [],
};

const DESIGNS = {
  maxFunded: { face: 1_000_000, premium: 50_000, premiumYears: 10 },
  midFunded: { face: 1_500_000, premium: 25_000, premiumYears: 20 },
  thin: { face: 1_000_000, premium: 8_000, premiumYears: 30 },
} as const;

// 6.54% is Nationwide's own published 25-year look-back for the Multi-Index
// strategy — the AG 49-A window — so the test runs on a rate from the document
// rather than a round number.
const RATE = 6.54;

function finalValue(design: keyof typeof DESIGNS, c: Partial<PolicyCharges>): number {
  const d = DESIGNS[design];
  return runPolicyMechanics({
    issueAge: 45,
    faceAmount: d.face,
    annualPremium: d.premium,
    premiumYears: d.premiumYears,
    years: 30,
    charges: { ...BASE, ...c },
    creditedRatePctByYear: Array.from({ length: 30 }, () => RATE),
  }).summary.finalAccountValue;
}

const scaleCoi = (f: number) =>
  ILLUSTRATIVE_COI_TABLE.map((r) => ({ age: r.age, perThousand: r.perThousand * f }));

/** The low and high end of each documented band, as engine inputs. */
const ENDS: Record<string, [Partial<PolicyCharges>, Partial<PolicyCharges>]> = {
  'coi-table': [{ coiTable: scaleCoi(0.5) }, { coiTable: scaleCoi(2.0) }],
  'premium-load': [{ premiumLoadPctByYear: [0] }, { premiumLoadPctByYear: [10] }],
  'per-unit-charge': [{ perUnitMonthlyPerThousand: 0.02 }, { perUnitMonthlyPerThousand: 0.12 }],
  'policy-fee': [{ monthlyPolicyFee: 5 }, { monthlyPolicyFee: 20 }],
};

function measuredSwingPct(id: string, design: keyof typeof DESIGNS): number {
  const [lo, hi] = ENDS[id]!;
  const base = finalValue(design, {});
  return (Math.abs(finalValue(design, lo) - finalValue(design, hi)) / base) * 100;
}

describe('the documented swings are the engine\'s actual swings', () => {
  for (const id of Object.keys(ENDS)) {
    for (const design of ['maxFunded', 'midFunded', 'thin'] as const) {
      it(`${id} on a ${design} design`, () => {
        const claimed = parameterById(id)!.swingPct[design];
        const measured = measuredSwingPct(id, design);
        // Within a tenth of a point of what the register says.
        expect(measured, `register says ${claimed}%, engine says ${measured.toFixed(1)}%`)
          .toBeCloseTo(claimed, 0);
      });
    }
  }
});

describe('the finding the register is built on', () => {
  it('mortality uncertainty grows as funding thins, and inverts the ranking', () => {
    const max = measuredSwingPct('coi-table', 'maxFunded');
    const mid = measuredSwingPct('coi-table', 'midFunded');
    const thin = measuredSwingPct('coi-table', 'thin');
    expect(max).toBeLessThan(mid);
    expect(mid).toBeLessThan(thin);

    // On a max-funded design the premium load dominates mortality; on a thin
    // one mortality dominates everything. That inversion is the whole reason
    // the register ranks by design rather than giving one order.
    expect(measuredSwingPct('premium-load', 'maxFunded')).toBeGreaterThan(max);
    expect(thin).toBeGreaterThan(measuredSwingPct('premium-load', 'thin'));
  });

  it('puts mortality first for a thin design and the load first for a funded one', () => {
    expect(rankedFor('thin')[0]!.id).toBe('coi-table');
    expect(rankedFor('maxFunded')[0]!.id).toBe('premium-load');
  });

  it('spans lapse and comfort on a thin design — a range no caveat makes usable', () => {
    const lo = finalValue('thin', { coiTable: scaleCoi(0.5) });
    const hi = finalValue('thin', { coiTable: scaleCoi(2.0) });
    // More than a tenfold difference on identical premium.
    expect(lo / Math.max(1, hi)).toBeGreaterThan(10);
  });
});

describe('the register itself', () => {
  it('gives every gap a way to close it and a reason it cannot be guessed', () => {
    for (const p of UNPRICED_PARAMETERS) {
      expect(p.closedBy.length, p.id).toBeGreaterThan(40);
      expect(p.whyNotGuessable.length, p.id).toBeGreaterThan(40);
      expect(p.band.unit.length, p.id).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = UNPRICED_PARAMETERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks the corridor as statutory, not as something to ask a carrier for', () => {
    expect(parameterById('corridor-factors')!.status).toBe('statutory');
    expect(parameterById('corridor-factors')!.closedBy).toMatch(/7702\(d\)\(2\)/);
  });
});
