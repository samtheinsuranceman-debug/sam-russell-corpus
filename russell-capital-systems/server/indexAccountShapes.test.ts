/**
 * The arithmetic of an indexed account, pinned.
 *
 * These are the numbers an advisor says out loud in a meeting, so the tests are
 * written as the claims themselves rather than as unit assertions — if one
 * fails, a sentence someone is saying to a client has become untrue.
 */

import { describe, it, expect } from 'vitest';
import {
  INDEX_ACCOUNT_SHAPES,
  SHAPES_VERSION,
  annualise,
  creditFor,
  shapeById,
  shapesFor,
  shapesNeedingConfirmation,
  shapesWithoutMaximum,
} from '../shared/indexAccountShapes';
import { AG49_PRODUCTS, PRODUCTS_AWAITING_MAXIMUM, awaitingMaximum, productFor } from '../shared/ag49Products';
import { compareAccountShapes, compareLoanTypes, gatedIllustration } from '../shared/iulIllustrationGate';
import { MANDATED_NOTICE, MAX_ILLUSTRATED_LOAN_ARBITRAGE_PP } from '../shared/ag49Validator';

describe('index account shapes', () => {
  it('every shape belongs to a verified product, so nothing can be illustrated off-registry', () => {
    for (const s of INDEX_ACCOUNT_SHAPES) {
      expect(productFor(s.productId), `${s.id} names product ${s.productId}`).toBeTruthy();
    }
  });

  it('no shape claims a maximum illustrated rate above its product\'s', () => {
    // A product's figure is the highest across its accounts, so an account may
    // be lower, or absent, but never higher.
    for (const s of INDEX_ACCOUNT_SHAPES) {
      if (s.maxIllustratedRate === null) continue;
      const p = productFor(s.productId)!;
      expect(s.maxIllustratedRate, s.id).toBeLessThanOrEqual(p.maxIllustratedRate + 1e-12);
    }
  });

  it('every shape cites a carrier document and the date it was read', () => {
    for (const s of INDEX_ACCOUNT_SHAPES) {
      expect(s.source.length, s.id).toBeGreaterThan(20);
      expect(s.readOn, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('credits a capped account by bounding participation between floor and cap', () => {
    const a = shapeById('mn-bga3-indexed-a')!;
    // 8% index, 100% participation, 10.50% cap → 8%.
    const mid = creditFor(a, 0.08);
    expect(mid.ok && mid.segmentCredited).toBeCloseTo(0.08, 10);
    // 20% index → the cap bites at 10.50%.
    const over = creditFor(a, 0.2);
    expect(over.ok && over.segmentCredited).toBeCloseTo(0.105, 10);
    // −30% index → the floor holds at 0%.
    const under = creditFor(a, -0.3);
    expect(under.ok && under.segmentCredited).toBe(0);
  });

  it('now knows the Pacific 1-Year cap, which the illustration alone did not give', () => {
    // This row carried cap: null until the account-choices document was read —
    // the illustration's account line gives floor, illustrated rate, maximum
    // and allocation, but no cap. IUC4009 supplies it: 10% current, 2%
    // guaranteed minimum. The account is no longer describable-only.
    const p = shapeById('pacific-horizon-ecv-1yr')!;
    expect(p.cap).toBe(0.1);
    expect(p.capGuaranteedMin).toBe(0.02);
    const r = creditFor(p, 0.2);
    expect(r.ok && r.segmentCredited).toBeCloseTo(0.1, 10);
  });

  it('refuses an uncapped account whose spread basis is not on file', () => {
    const b = shapeById('mn-bga3-balanced-2')!;
    const r = creditFor({ ...b, spread: null, spreadBasis: null }, 0.1);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toMatch(/spread/);
  });

  it('credits an uncapped account as participation less the spread, floored', () => {
    const b = shapeById('mn-bga3-balanced-2')!;
    const r = creditFor(b, 0.1);
    // 10% × 110% = 11%, less a 2.50% per-segment spread → 8.50%.
    expect(r.ok && r.segmentCredited).toBeCloseTo(0.085, 10);
    // A fall is floored, not negative.
    const down = creditFor(b, -0.25);
    expect(down.ok && down.segmentCredited).toBe(0);
  });

  it('reproduces the Corrales account exactly, and shows why it still cannot be illustrated', () => {
    // Balanced Indexed Account 2: S&P 500, 2-year segment, uncapped, 110%
    // participation, 2.50% segment spread. On a 20% movement across the segment:
    //   20% × 110% = 22%, less 2.50% = 19.50% credited over two years.
    const b = shapeById('mn-bga3-balanced-2')!;
    const r = creditFor(b, 0.2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.segmentCredited).toBeCloseTo(0.195, 10);

    // That 19.50% is the figure worth quoting, and it is a SEGMENT figure. Per
    // year it is the geometric root, not half:
    expect(r.annualised).toBeCloseTo(Math.pow(1.195, 0.5) - 1, 12);
    expect(r.annualised * 100).toBeCloseTo(9.32, 1);

    // And this is the part that matters. 9.32% a year is above the product's
    // published maximum illustrated rate of 6.62%, so this result may be
    // DESCRIBED as what the structure does on a 20% movement — it cannot be
    // projected forward in an illustration. The account's breadth is real; the
    // ceiling on illustrating it is unchanged.
    expect(r.annualised).toBeGreaterThan(b.maxIllustratedRate!);
  });

  it('distinguishes a per-year spread from a per-segment one, because the gap is 250 basis points', () => {
    const b = shapeById('mn-bga3-balanced-2')!;
    const perSegment = creditFor(b, 0.2);
    const perYear = creditFor({ ...b, spreadBasis: 'per-year' }, 0.2);
    expect(perSegment.ok && perSegment.segmentCredited).toBeCloseTo(0.195, 10);
    expect(perYear.ok && perYear.segmentCredited).toBeCloseTo(0.17, 10);
    const gap = (perSegment.ok ? perSegment.segmentCredited : 0) - (perYear.ok ? perYear.segmentCredited : 0);
    expect(gap).toBeCloseTo(0.025, 10);
  });

  it('flags the one row inferred from wording rather than stated', () => {
    const needing = shapesNeedingConfirmation();
    expect(needing.length).toBeGreaterThan(0);
    for (const s of needing) expect(s.inferred!.length).toBeGreaterThan(40);
    expect(needing.map((s) => s.id)).toContain('mn-bga3-balanced-2');
  });

  it('annualises geometrically, never by division', () => {
    expect(annualise(0.195, 2)).toBeCloseTo(Math.pow(1.195, 0.5) - 1, 12);
    // Division would give 9.75%; the geometric root is lower. Getting this wrong
    // overstates a multi-year account every time.
    expect(annualise(0.195, 2)).toBeLessThan(0.195 / 2);
    expect(annualise(0.08, 1)).toBe(0.08);
  });

  it('refuses a non-finite index return rather than propagating it', () => {
    const a = shapeById('mn-bga3-indexed-a')!;
    expect(creditFor(a, NaN).ok).toBe(false);
    expect(creditFor(a, Infinity).ok).toBe(false);
  });

  it('never promises that participation above 100% beats a cap', () => {
    // At a small movement the capped account wins; at a large one the uncapped
    // does. The registry says so explicitly because the opposite is the natural
    // assumption and it is wrong.
    const capped = shapeById('mn-bga3-indexed-a')!;
    const uncapped = shapeById('mn-bga3-balanced-2')!;
    const small = 0.02;
    const cSmall = creditFor(capped, small);
    const uSmall = creditFor(uncapped, small);
    expect(cSmall.ok && uSmall.ok).toBe(true);
    if (cSmall.ok && uSmall.ok) {
      // 2% capped → 2%. 2% uncapped → 2.2% − 2.5%, floored at 0%.
      expect(cSmall.segmentCredited).toBeGreaterThan(uSmall.segmentCredited);
    }
    expect(SHAPES_VERSION.neverPrinted.join(' ')).toMatch(/above 100% participation/i);
  });
});

describe('the account comparison surface', () => {
  it('returns every verified account on the product', () => {
    const rows = compareAccountShapes('mn-life-bga3', 0.1);
    expect(rows.length).toBe(shapesFor('mn-life-bga3').length);
    expect(rows.map((r) => r.label)).toContain('Balanced Indexed Account 2');
  });

  it('warns that a multi-year segment is not answering the same question as a 1-year one', () => {
    const rows = compareAccountShapes('mn-life-bga3', 0.1);
    const twoYear = rows.find((r) => r.shapeId === 'mn-bga3-balanced-2')!;
    expect(twoYear.caveat).toMatch(/credits once/);
    expect(twoYear.caveat).toMatch(/annualised/);
    const oneYear = rows.find((r) => r.shapeId === 'mn-bga3-indexed-a')!;
    expect(oneYear.caveat).toBeUndefined();
  });

  it('carries each account\'s own maximum, not the product\'s, on every row', () => {
    for (const r of compareAccountShapes('mn-life-bga3', 0.1)) {
      expect(r.maxIllustratedPct).toBeGreaterThan(0);
      expect(r.maxIllustratedPct).toBeLessThanOrEqual(6.62);
    }
  });

  it('shows its working on every row, computed or refused', () => {
    for (const r of compareAccountShapes('mn-life-bga3', 0.1)) {
      expect(r.working.length, r.label).toBeGreaterThan(30);
    }
    // Every Pacific row now computes; what varies is whether it may be
    // illustrated, which is carried separately from whether it can be priced.
    const pac = compareAccountShapes('pacific-horizon-ecv', 0.1);
    expect(pac.length).toBe(8);
    for (const r of pac) expect(r.segmentCreditedPct, r.label).not.toBeNull();
  });

  it('returns nothing for a product with no verified accounts', () => {
    expect(compareAccountShapes('no-such-product', 0.1)).toEqual([]);
  });
});

describe('the loan comparison surface', () => {
  const charges = { fixed: 4.0, indexed: 4.75, variable: 6.0 };

  it('states what happens to the borrowed money, which is the column that matters', () => {
    const rows = compareLoanTypes(6.0, charges);
    const variable = rows.find((r) => r.type === 'variable')!;
    const fixed = rows.find((r) => r.type === 'fixed')!;
    expect(variable.borrowedMoney).toMatch(/keeps earning/);
    expect(fixed.borrowedMoney).toMatch(/stops receiving/);
  });

  it('records which charges are contractual and which float', () => {
    const rows = compareLoanTypes(6.0, charges);
    expect(rows.find((r) => r.type === 'fixed')!.chargeIsContractual).toBe(true);
    expect(rows.find((r) => r.type === 'indexed')!.chargeIsContractual).toBe(true);
    expect(rows.find((r) => r.type === 'variable')!.chargeIsContractual).toBe(false);
  });

  it('refuses to illustrate arbitrage above the AG 49-A limit', () => {
    // The framing this guards against: a 20% credit against a 4.75% charge, the
    // 15.25% difference compounding. The mechanism is real; projecting the
    // spread is not permitted, and this is the rule that says so.
    const rows = compareLoanTypes(20, charges);
    const indexed = rows.find((r) => r.type === 'indexed')!;
    expect(indexed.illustrable).toBe(false);
    const v = indexed.findings.find((f) => f.rule === 'illustrated_loan_arbitrage_above_limit')!;
    expect(v.severity).toBe('violation');
    expect(v.detail).toMatch(/15\.25 percentage points/);
    expect(v.detail).toMatch(/may still be\s+described in words/);
  });

  it('allows a spread inside the limit', () => {
    // 5.00% credited against a 4.75% charge is 25 basis points — inside 50.
    const rows = compareLoanTypes(5.0, charges);
    const indexed = rows.find((r) => r.type === 'indexed')!;
    expect(indexed.findings.some((f) => f.rule === 'illustrated_loan_arbitrage_above_limit')).toBe(false);
    expect(MAX_ILLUSTRATED_LOAN_ARBITRAGE_PP).toBe(0.5);
  });

  it('treats a variable charge held flat across a projection as a violation', () => {
    const rows = compareLoanTypes(6.0, charges, { variableIllustratedAsConstant: true });
    const variable = rows.find((r) => r.type === 'variable')!;
    expect(variable.illustrable).toBe(false);
    expect(variable.findings.map((f) => f.rule)).toContain('variable_loan_charge_illustrated_as_constant');
  });

  it('warns when a variable loan is shown at the indexed loan\'s constant charge', () => {
    // The specific conflation: pairing the variable loan's crediting feature
    // with the indexed loan's fixed 4.75% describes a product that does not
    // exist. A warning, not a violation — it may be a data-entry error.
    const rows = compareLoanTypes(5.0, { ...charges, variable: 4.75 });
    const variable = rows.find((r) => r.type === 'variable')!;
    const w = variable.findings.find((f) => f.rule === 'indexed_loan_charge_paired_with_variable_loan')!;
    expect(w.severity).toBe('warning');
    expect(variable.illustrable).toBe(true);
  });

  it('every finding cites an authority a reviewer can go and read', () => {
    for (const r of compareLoanTypes(20, charges, { variableIllustratedAsConstant: true })) {
      for (const f of r.findings) expect(f.authority, f.rule).toMatch(/AG 49/);
    }
  });
});

describe('the product registry after widening', () => {
  it('holds two verified products, both citing a carrier document', () => {
    expect(AG49_PRODUCTS.length).toBe(2);
    for (const p of AG49_PRODUCTS) {
      expect(p.disclosureUrl.length, p.id).toBeGreaterThan(20);
      expect(p.readOn, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Still no industry figure: every maximum is product-specific and under 10%.
      expect(p.maxIllustratedRate, p.id).toBeGreaterThan(0);
      expect(p.maxIllustratedRate, p.id).toBeLessThan(0.1);
    }
  });

  it('the two products do not share a maximum, which is the whole point of the table', () => {
    expect(AG49_PRODUCTS[0].maxIllustratedRate).not.toBe(AG49_PRODUCTS[1].maxIllustratedRate);
  });
});

describe('the Pacific Life profile, built from the Drive documents', () => {
  it('carries all eight Pacific Horizon ECV indexed accounts', () => {
    const ids = shapesFor('pacific-horizon-ecv').map((s) => s.label);
    expect(ids.length).toBe(8);
    for (const want of ['1-Year Indexed Account', '2-Year Indexed Account', 'High Par 5-Year Indexed Account',
      '1-Year Invesco QQQ Indexed Account', '1-Year High Cap Indexed Account',
      '1-Year High Par Volatility Control Indexed Account', '1-Year Volatility Control Indexed Account',
      '1-Year No Cap Dynamic Par Indexed Account']) {
      expect(ids, want).toContain(want);
    }
  });

  it('reads the 2-Year cap across the segment, not per year', () => {
    // "24% current growth cap over 2 years". Read as an annual cap it would be
    // 24% a year; correctly it is 24% across the segment, about 11.4% a year.
    const two = shapeById('pacific-horizon-ecv-2yr')!;
    expect(two.cap).toBe(0.24);
    expect(two.capBasis).toBe('per-segment');
    const r = creditFor(two, 0.6); // a 60% two-year run, well past the cap
    expect(r.ok && r.segmentCredited).toBeCloseTo(0.24, 10);
    expect(r.ok && r.annualised).toBeCloseTo(Math.pow(1.24, 0.5) - 1, 12);
    expect(r.ok && r.annualised).toBeLessThan(0.12);
    expect(SHAPES_VERSION.neverPrinted.join(' ')).toMatch(/24% ACROSS the segment/);
  });

  it('charges the High Cap account for its higher cap', () => {
    // 12% cap instead of 10%, bought with 0.80% a year. An account comparison
    // that ignores the charge flatters it by exactly that much.
    const high = shapeById('pacific-horizon-ecv-1yr-high-cap')!;
    const plain = shapeById('pacific-horizon-ecv-1yr')!;
    expect(high.accountChargeAnnual).toBe(0.008);
    const bigYear = 0.3;
    const h = creditFor(high, bigYear);
    const p = creditFor(plain, bigYear);
    // Capped at 12% then charged 0.80% → 11.20%, against a plain 10%.
    expect(h.ok && h.segmentCredited).toBeCloseTo(0.112, 10);
    expect(p.ok && p.segmentCredited).toBeCloseTo(0.1, 10);
    // In a flat year the charge makes it WORSE than the plain account.
    const flat = creditFor(high, 0);
    expect(flat.ok && flat.segmentCredited).toBeCloseTo(-0.008, 10);
    expect(h.ok && h.working).toMatch(/bought, not given/);
  });

  it('adds the volatility control account benefit', () => {
    const vc = shapeById('pacific-horizon-ecv-1yr-vc')!;
    expect(vc.accountBenefitAnnual).toBe(0.004);
    expect(vc.participation).toBe(1.8);
    // 5% index × 180% = 9%, plus the 0.40% benefit.
    const r = creditFor(vc, 0.05);
    expect(r.ok && r.segmentCredited).toBeCloseTo(0.094, 10);
  });

  it('treats the dynamic par rate as an assumption, never a term', () => {
    const dyn = shapeById('pacific-horizon-ecv-1yr-no-cap-dynamic-par')!;
    expect(dyn.participationDeclared).toBe(true);
    expect(dyn.participation).toBe(0.5);
    expect(dyn.participationGuaranteedMin).toBe(0.05);
    // The working must say so, because this is the figure most likely to be
    // quoted as though it were fixed.
    const r = creditFor(dyn, 0.1);
    expect(r.ok && r.working).toMatch(/assumed — the carrier redeclares it/);
    // At the guaranteed floor of 5% participation the same year credits a tenth.
    const guaranteed = creditFor({ ...dyn, participation: 0.05 }, 0.1);
    expect(guaranteed.ok && guaranteed.segmentCredited).toBeCloseTo(0.005, 10);
  });

  it('keeps the carrier backtests, and never lets one pass as a maximum', () => {
    const one = shapeById('pacific-horizon-ecv-1yr')!;
    expect(one.backtest!.average).toBe(0.064);
    expect(one.backtest!.window).toMatch(/1988-2023/);
    // The backtest average (6.40%) is ABOVE the maximum illustrated rate
    // (6.35%) — which is exactly why the two must never be conflated.
    expect(one.backtest!.average).toBeGreaterThan(one.maxIllustratedRate!);
    expect(SHAPES_VERSION.neverPrinted.join(' ')).toMatch(/backtest described as a maximum illustrated rate/i);
  });

  it('only the benchmark account has a maximum; the other seven may be described, not illustrated', () => {
    const withMax = shapesFor('pacific-horizon-ecv').filter((s) => s.maxIllustratedRate !== null);
    expect(withMax.map((s) => s.id)).toEqual(['pacific-horizon-ecv-1yr']);
    expect(shapesWithoutMaximum().length).toBeGreaterThanOrEqual(7);
  });

  it('refuses to illustrate an account with no maximum rather than lending it the product figure', () => {
    // The product's 6.35% is derived from the 1-Year account alone. Lending it
    // to the High Par 5-Year account would be lending it the best case.
    const g = gatedIllustration(
      { carrier: 'Pacific Life', productName: 'Pacific Horizon ECV', insuredAge: 45, gender: 'male',
        healthClass: 'preferred', annualPremium: 25000, deathBenefit: 1000000,
        indexStrategy: 'S&P 500', capRate: 10.5, floorRate: 0, participationRate: 100,
        spreadFee: 0, hasMultiplier: false },
      { productId: 'pacific-horizon-ecv', historicalYearsShown: 25, indexAgeYears: 70,
        noticeText: MANDATED_NOTICE, noticeAtTopOfData: true,
        accountShapeId: 'pacific-horizon-ecv-high-par-5yr' }
    );
    expect(g.showable).toBe(false);
    expect(g.refusal).toMatch(/no AG 49-A maximum illustrated rate on file/i);
    expect(g.refusal).toMatch(/may not stand in for it/);
  });

  it('names the three products still awaiting a maximum, and what each needs', () => {
    expect(PRODUCTS_AWAITING_MAXIMUM.length).toBe(3);
    for (const q of PRODUCTS_AWAITING_MAXIMUM) {
      expect(q.accounts.length, q.id).toBeGreaterThan(5);
      expect(q.needs.length, q.id).toBeGreaterThan(40);
      expect(q.source, q.id).toMatch(/IUF3969/);
      // None of them may be illustrated: no row in the verified table.
      expect(productFor(q.id), `${q.id} must not be in AG49_PRODUCTS`).toBeNull();
    }
    expect(awaitingMaximum('pacific-trident-iul')!.note).toMatch(/NO premium load/);
    expect(awaitingMaximum('no-such')).toBeNull();
  });

  it('records the carrier lookback that produced the maximum, mean and all', () => {
    const p = productFor('pacific-horizon-ecv')!;
    // 4.36 low / 6.35 mean / 7.79 high, and the mean IS the maximum.
    expect(p.note).toMatch(/4\.36%/);
    expect(p.note).toMatch(/7\.79%/);
    expect(p.note).toMatch(/middle of that range, not the top/);
    expect(p.maxIllustratedRate).toBe(0.0635);
  });
});
