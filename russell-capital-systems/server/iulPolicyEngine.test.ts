import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_TEMPLATES,
  ENGINE_RULES,
  type PolicyInput,
  compareToNaive,
  creditPctForTemplate,
  naiveAnnualProjection,
  naiveNoWaitProjection,
  observedTemplates,
  runPolicy,
  templateById,
} from '../shared/iulPolicyEngine';
import { BGA2_ACCOUNT_2_SEGMENTS } from '../shared/securianBGA2Statement';

/** A flat index: no movement, so nothing can credit above the floor. */
function flatIndex(months: number, level = 5000): number[] {
  const out: number[] = [];
  for (let i = 0; i <= months; i += 1) out.push(level);
  return out;
}

/** A steadily rising index at a fixed monthly rate. */
function risingIndex(months: number, monthlyPct: number, level = 5000): number[] {
  const out: number[] = [level];
  for (let i = 1; i <= months; i += 1) out.push(out[i - 1] * (1 + monthlyPct / 100));
  return out;
}

const base: PolicyInput = {
  indexLevels: risingIndex(120, 0.6),
  months: 120,
  monthlyPremium: 1000,
  monthlyCharge: 200,
  templateId: 'x-formation-observed',
};

describe('the observed template reproduces the statement it was fitted to', () => {
  it('matches every matured segment on the audited policy', () => {
    const t = templateById('x-formation-observed')!;
    for (const row of BGA2_ACCOUNT_2_SEGMENTS) {
      expect(
        creditPctForTemplate(t, row.indexGrowthRatePct),
        `segment ${row.segmentStart}`,
      ).toBeCloseTo(row.segmentCreditingRatePct, 4);
    }
  });

  it('the published template for the same account does not', () => {
    const published = templateById('x-formation-published')!;
    for (const row of BGA2_ACCOUNT_2_SEGMENTS) {
      const claimed = creditPctForTemplate(published, row.indexGrowthRatePct);
      expect(claimed - row.segmentCreditingRatePct, `segment ${row.segmentStart}`).toBeGreaterThan(10);
    }
  });
});

describe('a segment credits once, at maturity, and never before', () => {
  it('pays nothing at all for the first two years on a 24-month account', () => {
    const run = runPolicy(base);
    expect(run.ok).toBe(true);
    if (!run.ok) return;
    for (const m of run.months.filter((x) => x.month < 25)) {
      expect(m.creditsPosted, `month ${m.month} credited`).toBe(0);
    }
    expect(run.firstCreditMonth).toBe(25);
  });

  it('a 12-month account pays a year earlier, on the same money', () => {
    const run = runPolicy({ ...base, templateId: 'z-formation' });
    expect(run.ok).toBe(true);
    if (!run.ok) return;
    expect(run.firstCreditMonth).toBe(13);
  });

  it('a 36-month account pays a year later still', () => {
    const run = runPolicy({ ...base, templateId: 'x-formation-three-year' });
    expect(run.ok).toBe(true);
    if (!run.ok) return;
    expect(run.firstCreditMonth).toBe(37);
  });

  it('holds nearly the whole account value asleep before the first maturity', () => {
    const run = runPolicy(base);
    if (!run.ok) return;
    const monthTwelve = run.months[11];
    expect(monthTwelve.moneyAsleep).toBeGreaterThan(0);
    expect(monthTwelve.moneyAsleep / monthTwelve.accumulationValue).toBeGreaterThan(0.99);
    expect(monthTwelve.creditsPosted).toBe(0);
  });

  it('charges come out every month regardless, including the sleeping ones', () => {
    const run = runPolicy(base);
    if (!run.ok) return;
    for (const m of run.months.filter((x) => x.month < 25)) {
      expect(m.chargeDeducted, `month ${m.month}`).toBeCloseTo(200, 6);
    }
    expect(run.totalCharges).toBeCloseTo(200 * 120, 4);
  });
});

describe('the floor holds and the cap binds', () => {
  it('credits nothing, rather than losing, on a flat index', () => {
    const run = runPolicy({ ...base, indexLevels: flatIndex(120) });
    if (!run.ok) return;
    expect(run.totalCredits).toBe(0);
    // Value is premiums less charges: the floor protected the principal.
    expect(run.finalAccumulationValue).toBeCloseTo((1000 - 200) * 120, 4);
  });

  it('never credits below the floor on a falling index', () => {
    const falling: number[] = [5000];
    for (let i = 1; i <= 120; i += 1) falling.push(falling[i - 1] * 0.99);
    const run = runPolicy({ ...base, indexLevels: falling });
    if (!run.ok) return;
    expect(run.totalCredits).toBe(0);
    for (const m of run.months) expect(m.creditsPosted).toBe(0);
  });

  it('binds the Z Formation cap at 8.50% however far the index runs', () => {
    const t = templateById('z-formation')!;
    expect(creditPctForTemplate(t, 40)).toBe(8.5);
    expect(creditPctForTemplate(t, 8.5)).toBeCloseTo(8.5, 6);
    expect(creditPctForTemplate(t, 4)).toBeCloseTo(4, 6);
    expect(creditPctForTemplate(t, -20)).toBe(0);
  });

  it('applies the cap before the floor, so a loss never becomes a capped gain', () => {
    const t = templateById('z-formation')!;
    expect(creditPctForTemplate(t, -50)).toBe(0);
  });
});

describe('the engine refuses rather than approximating', () => {
  it('will not extend a short index series', () => {
    const run = runPolicy({ ...base, indexLevels: risingIndex(10, 0.6) });
    expect(run.ok).toBe(false);
    if (run.ok) return;
    expect(run.reason).toMatch(/inventing market history/);
  });

  it('rejects an unknown template, a negative charge and a zero-length run', () => {
    expect(runPolicy({ ...base, templateId: 'nope' }).ok).toBe(false);
    expect(runPolicy({ ...base, monthlyCharge: -1 }).ok).toBe(false);
    expect(runPolicy({ ...base, months: 0 }).ok).toBe(false);
  });

  it('rejects a non-positive index level', () => {
    const bad = risingIndex(120, 0.6);
    bad[40] = 0;
    expect(runPolicy({ ...base, indexLevels: bad }).ok).toBe(false);
  });
});

describe('loans accrue whether or not anything credits', () => {
  it('accrues interest in the sleeping months too', () => {
    const run = runPolicy({ ...base, startingLoan: 50000, loanRateAnnual: 0.0425 });
    if (!run.ok) return;
    expect(run.months[5].loanInterest).toBeGreaterThan(0);
    expect(run.months[5].creditsPosted).toBe(0);
    expect(run.totalLoanInterest).toBeGreaterThan(0);
  });

  it('compounds monthly to the stated annual rate over twelve months', () => {
    const run = runPolicy({
      ...base,
      months: 12,
      indexLevels: flatIndex(12),
      monthlyPremium: 0,
      monthlyCharge: 0,
      startingLoan: 10000,
      loanRateAnnual: 0.0425,
    });
    if (!run.ok) return;
    expect(run.months[11].loanBalance).toBeCloseTo(10000 * 1.0425, 2);
  });

  it('nets the loan off the surrender value', () => {
    const run = runPolicy({ ...base, startingLoan: 10000, loanRateAnnual: 0.0425 });
    if (!run.ok) return;
    for (const m of run.months) {
      expect(m.netSurrenderValue).toBeCloseTo(m.accumulationValue - m.loanBalance, 6);
    }
  });
});

describe('the two naive models are wrong in opposite directions', () => {
  // The first version of this file assumed a year-at-a-time model always
  // overstates. It does not, and this test is what caught that.
  it('the term error understates: a per-segment deduction taken annually', () => {
    const cmp = compareToNaive(base)!;
    expect(cmp).not.toBeNull();
    expect(cmp.naiveAnnual).toBeLessThan(cmp.segmentAware);
    expect(cmp.termErrorDollars).toBeLessThan(0);
  });

  it('the wait error overstates: credits paid in months nothing matured', () => {
    const cmp = compareToNaive(base)!;
    expect(cmp.naiveNoWait).toBeGreaterThan(cmp.segmentAware);
    expect(cmp.waitErrorDollars).toBeGreaterThan(0);
  });

  it('the engine sits between them, which is the reason to model the segment', () => {
    const cmp = compareToNaive(base)!;
    expect(cmp.segmentAware).toBeGreaterThan(cmp.naiveAnnual);
    expect(cmp.segmentAware).toBeLessThan(cmp.naiveNoWait);
    expect(cmp.spreadBetweenNaiveModels).toBeGreaterThan(0);
  });

  it('on a 1-year template the two naive models collapse into one', () => {
    // There is no segment term to get wrong, so the term error disappears and
    // both models reduce to the same wait error. This is why the 1-year shape
    // is the one a spreadsheet can model and the multi-year shapes are not.
    const cmp = compareToNaive({ ...base, templateId: 'z-formation' })!;
    expect(cmp.naiveAnnual).toBeCloseTo(cmp.naiveNoWait, 6);
    expect(cmp.spreadBetweenNaiveModels).toBeCloseTo(0, 6);
  });

  it('the longer the term, the worse a naive model gets', () => {
    const oneYear = compareToNaive({ ...base, templateId: 'z-formation' })!;
    const threeYear = compareToNaive({ ...base, templateId: 'x-formation-three-year' })!;
    // On $120,000 of premium, waiting three years instead of one roughly
    // doubles what an unwary spreadsheet hands the client.
    expect(threeYear.waitErrorDollars).toBeGreaterThan(oneYear.waitErrorDollars);
    expect(threeYear.waitErrorDollars).toBeGreaterThan(20000);
  });

  it('reports the sleeping months that cause the gap', () => {
    const cmp = compareToNaive(base)!;
    expect(cmp.firstCreditMonth).toBe(25);
    expect(cmp.monthsWithNoCreditPossible).toBeGreaterThan(0);
  });

  it('agrees with the engine when nothing can credit, so the gap is not an artefact', () => {
    const flat: PolicyInput = { ...base, indexLevels: flatIndex(120) };
    const run = runPolicy(flat);
    if (!run.ok) return;
    const naive = naiveAnnualProjection(flat);
    expect(naive).toBeCloseTo(run.finalAccumulationValue, 4);
    expect(naiveNoWaitProjection(flat)).toBeCloseTo(run.finalAccumulationValue, 4);
  });
});

describe('provenance is carried, not assumed', () => {
  it('marks the fitted template as observed and bans illustrating it', () => {
    const observed = observedTemplates();
    expect(observed.length).toBeGreaterThan(0);
    for (const t of observed) expect(t.source).toMatch(/Fitted/);
    expect(ENGINE_RULES.neverPrinted.join(' ')).toMatch(/`observed` template/);
  });

  it('every template names where its parameters came from', () => {
    for (const t of ACCOUNT_TEMPLATES) {
      expect(t.source.length, t.id).toBeGreaterThan(30);
      expect(t.structure.length, t.id).toBeGreaterThan(20);
    }
  });

  it('the 3-year template claims no deduction, because none is known', () => {
    const t = templateById('x-formation-three-year')!;
    expect(t.basis).toBe('parameter');
    expect(t.interceptPoints).toBe(0);
    expect(t.note).toMatch(/no segment of that account has matured|placeholder/i);
  });

  it('bans presenting a house name as a carrier product', () => {
    expect(ENGINE_RULES.neverPrinted.join(' ')).toMatch(/house template name offered as a carrier product/i);
  });
});
