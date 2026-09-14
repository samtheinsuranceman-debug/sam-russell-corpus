/**
 * The cost machine, checked against the cost summary it was built from.
 *
 * These rows are a real Annual Cost Summary, de-identified: female, issue age
 * 63, preferred non-tobacco, specified amount $4,755,883, $2.1m of premium
 * over five years. Everything the module derives has to reproduce the page.
 */

import { describe, it, expect } from 'vitest';
import {
  costProfile,
  impliedCoiPerThousand,
  impliedSurrenderPerThousand,
  blendMultiIndex,
  MUTUAL_A_BASELINE,
  PENDING_BASELINES,
  MULTI_INDEX_BLEND,
  type CostSummaryYear,
} from '../shared/costStructure';
import { runPolicyMechanics } from '../shared/policyMechanics';

const SPEC = 4_755_883;

const r = (
  policyYear: number, attainedAge: number, premium: number, percentOfPremiumCharge: number,
  perPolicyCharge: number, perThousandCharge: number, riderCharges: number,
  costOfInsurance: number, indexedStrategyCharge: number, interestEarned: number,
  accountValue: number, surrenderValue: number, deathBenefit: number
): CostSummaryYear => ({
  policyYear, attainedAge, premium, percentOfPremiumCharge, perPolicyCharge,
  perThousandCharge, riderCharges, costOfInsurance, indexedStrategyCharge,
  conditionalCredit: 0, interestEarned, accountValue, surrenderValue, deathBenefit,
});

const SUMMARY: CostSummaryYear[] = [
  r(1, 64, 480000, 9600, 120, 37013, 0, 2598, 0, 29207, 459876, 280674, 5215759),
  r(2, 65, 480000, 28800, 120, 37013, 3415, 4667, 0, 58000, 923862, 744660, 5679745),
  r(3, 66, 380000, 22800, 120, 37013, 3415, 8863, 0, 82193, 1313844, 1134642, 6069727),
  r(4, 67, 380000, 22800, 120, 37013, 3415, 11190, 0, 107787, 1727094, 1570292, 6482977),
  r(5, 68, 380000, 22800, 120, 37013, 3415, 13154, 0, 134932, 2165525, 2031124, 6921408),
  r(6, 69, 0, 0, 120, 37013, 3415, 15556, 0, 140215, 2249637, 2137636, 6921408),
  r(7, 70, 0, 0, 120, 37013, 3415, 16296, 0, 145689, 2338483, 2248882, 6921408),
  r(8, 71, 0, 0, 120, 37013, 3415, 17671, 0, 151482, 2431747, 2364547, 6921408),
  r(9, 72, 0, 0, 120, 37013, 3415, 19738, 0, 157536, 2528999, 2484198, 6921408),
  r(10, 73, 0, 0, 120, 37013, 3415, 22819, 0, 163807, 2629439, 2607039, 6921408),
  r(11, 74, 0, 0, 120, 0, 0, 27070, 5238, 171294, 2778781, 2778781, 6921408),
  r(12, 75, 0, 0, 120, 0, 0, 31829, 5532, 181542, 2933906, 2933906, 6921408),
  r(13, 76, 0, 0, 120, 0, 0, 36450, 5837, 191824, 3094997, 3094997, 6921408),
  r(14, 77, 0, 0, 120, 0, 0, 40927, 6155, 202246, 3262351, 3262351, 6921408),
  r(15, 78, 0, 0, 120, 0, 0, 45301, 6486, 213086, 3436502, 3436502, 6921408),
  r(16, 79, 0, 0, 120, 0, 0, 49784, 6830, 224370, 3617799, 3617799, 6921408),
  r(17, 80, 0, 0, 120, 0, 0, 55296, 7187, 236079, 3805650, 3805650, 6921408),
  r(18, 81, 0, 0, 120, 0, 0, 60208, 7558, 248248, 4001128, 4001128, 6921408),
  r(19, 82, 0, 0, 120, 0, 0, 67837, 7942, 260682, 4201796, 4201796, 6921408),
  r(20, 83, 0, 0, 120, 0, 0, 71089, 8340, 273695, 4412622, 4412622, 6921408),
];

describe('charges as a percentage of total premium outlay', () => {
  const p20 = costProfile(SUMMARY, 20);

  it('uses what the client actually paid as the denominator', () => {
    expect(p20.totalPremiumOutlay).toBe(2_100_000);
  });

  it('reproduces the illustration totals column for column', () => {
    const by = (l: string) => p20.shares.find((s) => s.label.startsWith(l))!;
    expect(by('Percent of premium').dollars).toBe(106_800);
    expect(by('Per policy').dollars).toBe(2_400);
    expect(by('Per $1,000').dollars).toBe(370_130);
    expect(by('Riders').dollars).toBe(30_735);
    expect(by('Cost of insurance').dollars).toBe(618_343);
    expect(by('Indexed strategy').dollars).toBe(67_105);
  });

  it('gives the baseline percentages', () => {
    const by = (l: string) => p20.shares.find((s) => s.label.startsWith(l))!.pctOfPremiumOutlay;
    expect(by('Percent of premium')).toBeCloseTo(5.09, 1);
    expect(by('Per $1,000')).toBeCloseTo(17.63, 1);
    expect(by('Cost of insurance')).toBeCloseTo(29.44, 1);
    expect(by('Indexed strategy')).toBeCloseTo(3.20, 1);
    // Total charges over twenty years are 56.9% of everything paid in.
    expect(p20.totalChargesPctOfOutlay).toBeCloseTo(56.93, 1);
    expect(p20.interestPctOfOutlay).toBeCloseTo(160.66, 1);
  });

  it('shows charges front-loaded — half the twenty-year total falls in ten years', () => {
    const p10 = costProfile(SUMMARY, 10);
    expect(p10.totalChargesPctOfOutlay).toBeCloseTo(30.54, 1);
    // And the per-$1,000 charge is entirely inside those ten years.
    const per10 = p10.shares.find((s) => s.label.startsWith('Per $1,000'))!.dollars;
    const per20 = p20.shares.find((s) => s.label.startsWith('Per $1,000'))!.dollars;
    expect(per10).toBe(per20);
  });
});

describe('the cost of insurance, derived exactly', () => {
  const implied = impliedCoiPerThousand(SUMMARY);

  it('rises monotonically with age, as any mortality curve must', () => {
    for (let i = 1; i < implied.length; i++) {
      expect(implied[i]!.perThousand, `age ${implied[i]!.age}`)
        .toBeGreaterThan(implied[i - 1]!.perThousand);
    }
  });

  it('matches the baseline transcribed into the module', () => {
    for (const row of implied) {
      const held = MUTUAL_A_BASELINE.coiPerThousandByAge.find((c) => c.age === row.age)!;
      expect(held.perThousand, `age ${row.age}`).toBeCloseTo(row.perThousand, 2);
    }
  });

  it('goes up more than fiftyfold from 64 to 83', () => {
    const a64 = implied.find((x) => x.age === 64)!.perThousand;
    const a83 = implied.find((x) => x.age === 83)!.perThousand;
    expect(a83 / a64).toBeGreaterThan(50);
  });

  it('holds the net amount at risk constant while the death benefit is increasing', () => {
    // Option 2: death benefit is specified amount plus account value, so the
    // amount at risk is the specified amount exactly — and it is.
    for (const y of implied.slice(0, 5)) expect(y.netAmountAtRisk).toBe(SPEC);
  });
});

describe('the surrender charge is dollars per $1,000, not a percentage of value', () => {
  const perK = impliedSurrenderPerThousand(SUMMARY, SPEC);

  it('is flat for three years then falls in equal steps to zero at year 11', () => {
    expect(perK.slice(0, 3)).toEqual([37.68, 37.68, 37.68]);
    expect(perK[10]).toBe(0);
    for (let i = 4; i <= 10; i++) {
      expect(perK[i - 1]! - perK[i]!, `step at year ${i + 1}`).toBeCloseTo(4.71, 1);
    }
  });

  it('reads as a wildly different shape if taken as a percentage of account value', () => {
    // The same schedule: 38.97% of account value in year 1, 0.85% in year 10.
    // That curve is a property of how fast this policy accumulated, not of the
    // product — which is why the engine now prefers the per-$1,000 basis.
    const asPct = SUMMARY.slice(0, 10).map(
      (y) => ((y.accountValue - y.surrenderValue) / y.accountValue) * 100
    );
    expect(asPct[0]).toBeCloseTo(38.97, 1);
    expect(asPct[9]).toBeCloseTo(0.85, 1);
    expect(asPct[0]! / asPct[9]!).toBeGreaterThan(40);
  });

  it('matches the baseline schedule held in the module', () => {
    expect(MUTUAL_A_BASELINE.surrenderPerThousandByYear.slice(0, 11)).toEqual(perK.slice(0, 11));
  });

  it('drives the engine on the product\'s own basis', () => {
    const out = runPolicyMechanics({
      issueAge: 63, faceAmount: SPEC, annualPremium: 480_000, premiumYears: 5, years: 3,
      charges: {
        premiumLoadPctByYear: [...MUTUAL_A_BASELINE.percentOfPremiumByYear],
        monthlyPolicyFee: MUTUAL_A_BASELINE.perPolicyMonthly,
        perUnitMonthlyPerThousand: MUTUAL_A_BASELINE.perThousandAnnual / 12,
        perUnitYears: MUTUAL_A_BASELINE.perThousandYears,
        coiTable: MUTUAL_A_BASELINE.coiPerThousandByAge,
        coiTableSource: 'derived from an Annual Cost Summary',
        surrenderChargePctByYear: [],
        surrenderChargePerThousandByYear: MUTUAL_A_BASELINE.surrenderPerThousandByYear,
      },
      creditedRatePctByYear: [6.75, 6.75, 6.75],
      corridorFactorByAge: {},
    });
    // The surrender charge is the same dollar figure in years 1-3, because it
    // is per $1,000 of a face amount that does not change.
    const charges = out.years.map((y) => y.accountValue - y.surrenderValue);
    expect(charges[0]).toBe(charges[1]);
    expect(charges[1]).toBe(charges[2]);
    expect(charges[0]).toBeCloseTo(179_202, -2);
    // And the schedule counts as supplied, so it is no longer "missing".
    expect(out.missing).not.toContain('surrender charge schedule');
  });
});

describe('the multi-index blend, per the contract\'s own rule', () => {
  it('weights 50/30/20 by that year\'s outcome rank', () => {
    // From the illustration: S&P 17.07%, DJIA 5.13%, NASDAQ 7.07% -> 11.68%.
    expect(blendMultiIndex([17.07, 5.13, 7.07])).toBeCloseTo(11.68, 2);
    // And 27.58 / 0.89 / 9.33 -> 16.77%.
    expect(blendMultiIndex([27.58, 0.89, 9.33])).toBeCloseTo(16.77, 2);
  });

  it('falls back to 65/35 with two indices and 100% with one', () => {
    expect(MULTI_INDEX_BLEND.weightsForTwo).toEqual([0.65, 0.35]);
    expect(blendMultiIndex([10, 5])).toBeCloseTo(10 * 0.65 + 5 * 0.35, 6);
    expect(blendMultiIndex([10])).toBe(10);
    expect(blendMultiIndex([])).toBe(0);
  });

  it('ranks by outcome because the contract says so, not by hindsight', () => {
    expect(MULTI_INDEX_BLEND.rankedByOutcome).toBe(true);
    // Order of the arguments must not matter — only the values.
    expect(blendMultiIndex([5.13, 17.07, 7.07])).toBeCloseTo(blendMultiIndex([17.07, 7.07, 5.13]), 6);
  });
});

describe('what the other two carriers still lack', () => {
  it('records where the credit lands, which differs between A and B', () => {
    expect(MUTUAL_A_BASELINE.creditingTarget).toBe('accumulated-value');
    const b = PENDING_BASELINES.find((p) => p.carrierId === 'mutual-b')!;
    expect(b.creditingTarget).toBe('cash-value');
    expect(b.creditingTargetSource).toMatch(/owner-stated/);
  });

  it('has B\'s complete charge taxonomy and none of its rates', () => {
    const b = PENDING_BASELINES.find((p) => p.carrierId === 'mutual-b')!;
    expect(b.chargeNamesKnown.length).toBe(9);
    expect(b.ratesKnown).toEqual([]);
  });

  it('keeps the case the baseline came from attached to it', () => {
    const d = MUTUAL_A_BASELINE.derivedFrom;
    expect(d.sex).toBe('female');
    expect(d.issueAge).toBe(63);
    expect(d.specifiedAmount).toBe(SPEC);
    expect(d.totalPremiumOutlay).toBe(2_100_000);
    // And the caveat that the curve is one class, not a universal one.
    expect(MUTUAL_A_BASELINE.caveats.join(' ')).toMatch(/ONE sex, ONE issue age and ONE risk class/);
  });
});
