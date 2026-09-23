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
  COMPLETE_BASELINES,
  MUTUAL_N_BASELINE,
  MUTUAL_S_BASELINE,
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
      const held = MUTUAL_N_BASELINE.coiPerThousandByAge.find((c) => c.age === row.age)!;
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
    expect(MUTUAL_N_BASELINE.surrenderPerThousandByYear.slice(0, 11)).toEqual(perK.slice(0, 11));
  });

  it('drives the engine on the product\'s own basis', () => {
    const out = runPolicyMechanics({
      issueAge: 63, faceAmount: SPEC, annualPremium: 480_000, premiumYears: 5, years: 3,
      charges: {
        premiumLoadPctByYear: [...MUTUAL_N_BASELINE.percentOfPremiumByYear],
        monthlyPolicyFee: MUTUAL_N_BASELINE.perPolicyMonthly,
        perUnitMonthlyPerThousand: MUTUAL_N_BASELINE.perThousandAnnual / 12,
        perUnitYears: MUTUAL_N_BASELINE.perThousandYears,
        coiTable: MUTUAL_N_BASELINE.coiPerThousandByAge,
        coiTableSource: 'derived from an Annual Cost Summary',
        surrenderChargePctByYear: [],
        surrenderChargePerThousandByYear: MUTUAL_N_BASELINE.surrenderPerThousandByYear,
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

/**
 * Mutual Company S, read off its Charges Report ("Your policy's current
 * charges summary"), de-identified: female, issue age 64, preferred
 * non-tobacco, level death benefit $2,918,696, $300,000 a year for five years,
 * GPT. Columns as printed: premium charge, cost of insurance, policy issue
 * charge, additional charges, bonus interest credit, additional policy
 * credits, interest earned, cash value, surrender value, death benefit.
 */
const B_SPEC = 2_918_696;

const b = (
  policyYear: number, attainedAge: number, premium: number, premiumCharge: number,
  costOfInsurance: number, policyIssueCharge: number, additionalCharges: number,
  bonusInterest: number, additionalCredits: number, interestEarned: number,
  cashValue: number, surrenderValue: number, deathBenefit: number
): CostSummaryYear => ({
  policyYear, attainedAge, premium,
  percentOfPremiumCharge: premiumCharge,
  perPolicyCharge: additionalCharges,
  perThousandCharge: policyIssueCharge,
  riderCharges: 0,
  costOfInsurance,
  indexedStrategyCharge: 0,
  conditionalCredit: bonusInterest + additionalCredits,
  interestEarned,
  accountValue: cashValue,
  surrenderValue,
  deathBenefit,
});

const B_SUMMARY: CostSummaryYear[] = [
  b(1, 64, 300000, 24000, 6896, 19818, 60, 0, 471, 8987, 258685, 108411, 2918696),
  b(2, 65, 300000, 19500, 8223, 19818, 60, 0, 624, 34486, 546193, 400994, 2918696),
  b(3, 66, 300000, 19500, 8024, 19818, 60, 0, 692, 45307, 844790, 704657, 2918696),
  b(4, 67, 300000, 19500, 7652, 19818, 60, 0, 770, 73402, 1171931, 1036850, 2918696),
  b(5, 68, 300000, 19500, 6977, 19818, 60, 0, 857, 86265, 1512699, 1382650, 2918696),
  b(6, 69, 0, 0, 7469, 19818, 60, 0, 957, 108560, 1594869, 1469828, 2918696),
  b(7, 70, 0, 0, 7865, 19818, 60, 0, 1070, 94771, 1662968, 1542907, 2918696),
  b(8, 71, 0, 0, 8353, 19818, 60, 0, 1197, 119369, 1755303, 1646302, 2918696),
  b(9, 72, 0, 0, 8681, 19818, 60, 0, 1342, 104357, 1832443, 1777943, 2918696),
  b(10, 73, 0, 0, 8930, 19818, 60, 0, 1478, 131566, 1936679, 1936679, 2918696),
  b(11, 74, 0, 0, 6934, 0, 60, 11665, 1283, 115566, 2058199, 2058199, 2918696),
  b(12, 75, 0, 0, 6642, 0, 60, 12545, 1403, 147928, 2213372, 2213372, 2918696),
  b(13, 76, 0, 0, 5956, 0, 60, 13345, 1537, 132270, 2354508, 2354508, 2918696),
  b(14, 77, 0, 0, 5506, 0, 60, 14363, 1779, 169101, 2534184, 2534184, 2918696),
  b(15, 78, 0, 0, 4355, 0, 60, 15296, 2072, 151661, 2698799, 2698799, 2918696),
  b(16, 79, 0, 0, 2883, 0, 60, 16484, 2424, 193706, 2908471, 2908471, 3053894),
  b(17, 80, 0, 0, 2208, 0, 60, 17576, 2983, 174313, 3101075, 3101075, 3256128),
  b(18, 81, 0, 0, 2785, 0, 60, 18949, 3762, 222353, 3343294, 3343294, 3510459),
  b(19, 82, 0, 0, 3563, 0, 60, 20207, 4815, 200585, 3565277, 3565277, 3743541),
  b(20, 83, 0, 0, 4525, 0, 60, 21786, 6113, 255309, 3843901, 3843901, 4036097),
];

/** The second B case, same sex, issue age and class: face $2,724,116, $280,000 a year. */
const B_SECOND_CASE = [
  { age: 64, premium: 280000, premiumCharge: 22400, coi: 6436, issue: 18504, cashValue: 248626 },
  { age: 65, premium: 280000, premiumCharge: 18200, coi: 7651, issue: 18504, cashValue: 516806 },
  { age: 66, premium: 280000, premiumCharge: 18200, coi: 7463, issue: 18504, cashValue: 802799 },
  { age: 67, premium: 280000, premiumCharge: 18200, coi: 7082, issue: 18504, cashValue: 1107977 },
  { age: 68, premium: 280000, premiumCharge: 18200, coi: 6445, issue: 18504, cashValue: 1433865 },
];
const B_SECOND_SPEC = 2_724_116;

describe('Mutual Company S, read off its Charges Report', () => {
  it('rolls forward to the printed cash value in every one of twenty years', () => {
    let prior = 0;
    for (const y of B_SUMMARY) {
      const reconstructed =
        prior + y.premium - y.percentOfPremiumCharge - y.costOfInsurance - y.perThousandCharge -
        y.perPolicyCharge + y.conditionalCredit + y.interestEarned;
      expect(Math.abs(reconstructed - y.accountValue), `year ${y.policyYear}`).toBeLessThanOrEqual(2);
      prior = y.accountValue;
    }
  });

  it('reproduces the printed five-year and fifteen-year totals', () => {
    const p5 = costProfile(B_SUMMARY, 5);
    const by = (p: ReturnType<typeof costProfile>, l: string) => p.shares.find((s) => s.label.startsWith(l))!.dollars;
    expect(p5.totalPremiumOutlay).toBe(1_500_000);
    expect(by(p5, 'Percent of premium')).toBe(102_000);
    expect(by(p5, 'Cost of insurance')).toBe(37_772);
    expect(by(p5, 'Per $1,000')).toBe(99_090);
    expect(by(p5, 'Per policy')).toBe(300);
    expect(Math.round(p5.interestCredited)).toBe(248_447);
    const p15 = costProfile(B_SUMMARY, 15);
    expect(by(p15, 'Cost of insurance')).toBe(108_463);
    expect(by(p15, 'Per $1,000')).toBe(198_180);
    expect(Math.round(p15.interestCredited)).toBe(1_523_596);
  });

  it('gives the baseline percentages against what the client paid', () => {
    const p10 = costProfile(B_SUMMARY, 10);
    const pct = (l: string) => p10.shares.find((s) => s.label.startsWith(l))!.pctOfPremiumOutlay;
    expect(pct('Percent of premium')).toBeCloseTo(6.8, 2);
    expect(pct('Per $1,000')).toBeCloseTo(13.21, 2);
    expect(pct('Cost of insurance')).toBeCloseTo(5.27, 2);
    expect(p10.totalChargesPctOfOutlay).toBeCloseTo(25.32, 2);
    // Twenty years: the bonus interest credit alone gives back 10.8% of outlay.
    const p20 = costProfile(B_SUMMARY, 20);
    expect(p20.totalChargesPctOfOutlay).toBeCloseTo(28.39, 2);
    expect(p20.interestPctOfOutlay).toBeCloseTo(171.32, 2);
  });

  it('holds the premium charge, policy issue charge and monthly charge the report prints', () => {
    expect(B_SUMMARY[0]!.percentOfPremiumCharge / B_SUMMARY[0]!.premium).toBeCloseTo(0.08, 6);
    for (const y of B_SUMMARY.slice(1, 5)) expect(y.percentOfPremiumCharge / y.premium).toBeCloseTo(0.065, 6);
    expect(MUTUAL_S_BASELINE.percentOfPremiumByYear.slice(0, 5)).toEqual([8.0, 6.5, 6.5, 6.5, 6.5]);
    // $19,818 a year for exactly ten years, $6.79 per $1,000 of face.
    expect(B_SUMMARY.filter((y) => y.perThousandCharge > 0)).toHaveLength(10);
    expect(19818 / (B_SPEC / 1000)).toBeCloseTo(MUTUAL_S_BASELINE.perThousandAnnual, 2);
    expect(MUTUAL_S_BASELINE.perThousandYears).toBe(10);
    // Additional charges are $60 in every year: the $5 monthly policy charge.
    for (const y of B_SUMMARY) expect(y.perPolicyCharge).toBe(60);
    expect(MUTUAL_S_BASELINE.perPolicyMonthly).toBe(5);
  });

  it('credits the bonus interest as 0.60% of the prior year-end cash value from year 11', () => {
    for (let i = 10; i < B_SUMMARY.length; i++) {
      const bonus = B_SUMMARY[i]!.conditionalCredit - [471, 624, 692, 770, 857, 957, 1070, 1197, 1342, 1478, 1283, 1403, 1537, 1779, 2072, 2424, 2983, 3762, 4815, 6113][i]!;
      const pctOfPrior = (bonus / B_SUMMARY[i - 1]!.accountValue) * 100;
      expect(pctOfPrior).toBeGreaterThan(0.6);
      expect(pctOfPrior).toBeLessThan(0.612);
    }
    for (let i = 0; i < 10; i++) expect(B_SUMMARY[i]!.conditionalCredit).toBeLessThan(1500);
    expect(MUTUAL_S_BASELINE.bonusInterestPctOfCashValue).toBe(0.6);
    expect(MUTUAL_S_BASELINE.bonusInterestFromYear).toBe(11);
  });

  it('has a surrender charge in dollars per $1,000 of face that falls from year 1 and ends at year 10', () => {
    const perK = impliedSurrenderPerThousand(B_SUMMARY, B_SPEC);
    expect(perK.slice(0, 10)).toEqual(MUTUAL_S_BASELINE.surrenderPerThousandByYear);
    expect(perK[0]).toBe(51.49);
    for (let i = 1; i < 9; i++) expect(perK[i]!, `year ${i + 1}`).toBeLessThan(perK[i - 1]!);
    expect(perK[9]).toBe(0);
    expect(perK.slice(10).every((v) => v === 0)).toBe(true);
  });

  it('derives the cost of insurance exactly and it rises through age 73', () => {
    const implied = impliedCoiPerThousand(B_SUMMARY);
    for (const row of implied) {
      const held = MUTUAL_S_BASELINE.coiPerThousandByAge.find((c) => c.age === row.age)!;
      expect(held.perThousand, `age ${row.age}`).toBeCloseTo(row.perThousand, 2);
    }
    const first10 = implied.slice(0, 10);
    for (let i = 1; i < first10.length; i++) {
      expect(first10[i]!.perThousand, `age ${first10[i]!.age}`).toBeGreaterThan(first10[i - 1]!.perThousand);
    }
    // The death benefit is level, so the amount at risk falls as value builds.
    for (let i = 1; i < 15; i++) expect(implied[i]!.netAmountAtRisk).toBeLessThan(implied[i - 1]!.netAmountAtRisk);
  });

  it('matches a second case of the same sex, age and class to within one percent', () => {
    for (const y of B_SECOND_CASE) {
      expect(y.premiumCharge / y.premium).toBeCloseTo(y.age === 64 ? 0.08 : 0.065, 6);
      expect(y.issue / (B_SECOND_SPEC / 1000)).toBeCloseTo(MUTUAL_S_BASELINE.perThousandAnnual, 2);
      const perThousand = y.coi / ((B_SECOND_SPEC - y.cashValue) / 1000);
      const held = MUTUAL_S_BASELINE.coiPerThousandByAge.find((c) => c.age === y.age)!.perThousand;
      expect(Math.abs(perThousand - held) / held, `age ${y.age}`).toBeLessThan(0.01);
    }
  });

  it('confirms from the illustration that B credits interest to the cash value', () => {
    expect(MUTUAL_S_BASELINE.creditingTarget).toBe('cash-value');
    expect(MUTUAL_S_BASELINE.fromCostSummary).toBe(true);
    // Surrender value equals cash value less the surrender charge in every year.
    for (const y of B_SUMMARY) expect(y.surrenderValue).toBeLessThanOrEqual(y.accountValue);
    for (const y of B_SUMMARY.slice(10)) expect(y.surrenderValue).toBe(y.accountValue);
  });

  it('keeps the case it came from attached, de-identified', () => {
    const d = MUTUAL_S_BASELINE.derivedFrom;
    expect(d.sex).toBe('female');
    expect(d.issueAge).toBe(64);
    expect(d.riskClass).toBe('preferred non-tobacco');
    expect(d.specifiedAmount).toBe(B_SPEC);
    expect(d.totalPremiumOutlay).toBe(1_500_000);
    expect(d.definitionalTest).toBe('GPT');
    expect(MUTUAL_S_BASELINE.caveats.join(' ')).toMatch(/ONE sex, ONE issue age and ONE risk class/);
    expect(JSON.stringify(MUTUAL_S_BASELINE)).not.toMatch(/Brandt|Aufdembrink|Case ID/);
  });

  it('drives the engine on the product\'s own basis', () => {
    const out = runPolicyMechanics({
      issueAge: 64, faceAmount: B_SPEC, annualPremium: 300_000, premiumYears: 5, years: 3,
      charges: {
        premiumLoadPctByYear: [...MUTUAL_S_BASELINE.percentOfPremiumByYear],
        monthlyPolicyFee: MUTUAL_S_BASELINE.perPolicyMonthly,
        perUnitMonthlyPerThousand: MUTUAL_S_BASELINE.perThousandAnnual / 12,
        perUnitYears: MUTUAL_S_BASELINE.perThousandYears,
        coiTable: MUTUAL_S_BASELINE.coiPerThousandByAge,
        coiTableSource: 'derived from a Charges Report',
        surrenderChargePctByYear: [],
        surrenderChargePerThousandByYear: MUTUAL_S_BASELINE.surrenderPerThousandByYear,
      },
      creditedRatePctByYear: [6.6, 6.6, 6.6],
      corridorFactorByAge: {},
    });
    const charges = out.years.map((y) => y.accountValue - y.surrenderValue);
    // $51.49, $49.75, $48.01 per $1,000 of a face that does not change.
    expect(charges[0]).toBeCloseTo(51.49 * (B_SPEC / 1000), -2);
    expect(charges[1]).toBeCloseTo(49.75 * (B_SPEC / 1000), -2);
    expect(charges[0]).toBeGreaterThan(charges[1]!);
    expect(out.missing).not.toContain('surrender charge schedule');
  });
});

describe('what the third carrier still lacks', () => {
  it('lists A and B as complete and only C as pending', () => {
    expect(COMPLETE_BASELINES.map((c) => c.carrierId)).toEqual(['mutual-n', 'mutual-s']);
    expect(PENDING_BASELINES.map((p) => p.carrierId)).toEqual(['mutual-pc']);
    expect(MUTUAL_N_BASELINE.creditingTarget).toBe('accumulated-value');
    expect(MUTUAL_S_BASELINE.creditingTarget).toBe('cash-value');
  });

  it('keeps the case the baseline came from attached to it', () => {
    const d = MUTUAL_N_BASELINE.derivedFrom;
    expect(d.sex).toBe('female');
    expect(d.issueAge).toBe(63);
    expect(d.specifiedAmount).toBe(SPEC);
    expect(d.totalPremiumOutlay).toBe(2_100_000);
    // And the caveat that the curve is one class, not a universal one.
    expect(MUTUAL_N_BASELINE.caveats.join(' ')).toMatch(/ONE sex, ONE issue age and ONE risk class/);
  });
});
