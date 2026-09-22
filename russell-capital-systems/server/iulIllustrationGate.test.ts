/**
 * The gate must refuse, and it must refuse for the stated reason.
 *
 * Two modules in shared/ both claimed to know the maximum illustrated rate.
 * These tests pin down which one wins and what happens to the other's output
 * when they disagree — because the failure mode being guarded against is not a
 * crash, it is a plausible-looking illustration at a rate the carrier never
 * published.
 */

import { describe, it, expect } from 'vitest';
import {
  gatedIllustration,
  showableScenarios,
  FLEXIBILITY_COMES_FROM,
  type ExhibitFacts,
} from '../shared/iulIllustrationGate';
import { AG49_PRODUCTS } from '../shared/ag49Products';
import { MANDATED_NOTICE, REQUIRED_HISTORICAL_PERIOD_YEARS } from '../shared/ag49Validator';
import type { AG49Input } from '../shared/iulComplianceEngine';

const product = AG49_PRODUCTS[0];

const input: AG49Input = {
  carrier: product.carrier,
  productName: product.product,
  insuredAge: 45,
  gender: 'male',
  healthClass: 'preferred',
  annualPremium: 25_000,
  deathBenefit: 1_000_000,
  indexStrategy: 'S&P 500 annual point-to-point',
  capRate: 10.5,
  floorRate: 0,
  participationRate: 100,
  spreadFee: 0,
  hasMultiplier: false,
};

/** A disclosure that satisfies everything ag49Validator checks about the page. */
const cleanFacts: ExhibitFacts = {
  productId: product.id,
  historicalYearsShown: REQUIRED_HISTORICAL_PERIOD_YEARS,
  indexAgeYears: 70,
  noticeText: MANDATED_NOTICE,
  noticeAtTopOfData: true,
};

describe('the illustration gate', () => {
  it('bounds the generator by the carrier published maximum, not the generator own', () => {
    const g = gatedIllustration(input, cleanFacts);
    expect(g.cap.cap).toBe(product.maxIllustratedRate);
    // The summary must name the published figure, so a compliance log records
    // which number the exhibit was judged against.
    expect(g.summary).toContain((product.maxIllustratedRate * 100).toFixed(2));
  });

  it('refuses outright when no product is named, because AG 49-A maxima are product-specific', () => {
    const g = gatedIllustration(input, { ...cleanFacts, productId: '' });
    expect(g.showable).toBe(false);
    expect(g.scenarios).toEqual([]);
    expect(g.refusal).toMatch(/product/i);
  });

  it('refuses a product it holds no read disclosure for rather than guessing a cap', () => {
    const g = gatedIllustration(input, { ...cleanFacts, productId: 'no-such-product-on-file' });
    expect(g.showable).toBe(false);
    expect(g.refusal).toMatch(/disclosure|on file/i);
    expect(g.cap.cap).toBeNull();
  });

  it('withholds a violating scenario instead of clamping its rate', () => {
    // A disclosure showing too little history violates AG 49-A for every
    // scenario, whatever the rate. Nothing may be shown, and crucially no
    // scenario may come back with projections attached.
    const g = gatedIllustration(input, { ...cleanFacts, historicalYearsShown: 5 });
    expect(g.showable).toBe(false);
    expect(showableScenarios(g)).toEqual([]);
    for (const s of g.scenarios) {
      expect(s.projections, `${s.name} must not carry projections while violating`).toBeUndefined();
      // The proposed rate is still reported. The refusal says what was asked
      // for; it does not substitute a different request.
      expect(typeof s.proposedRate).toBe('number');
    }
  });

  it('names the violated rules in the refusal, in the validator own terms', () => {
    const g = gatedIllustration(input, { ...cleanFacts, historicalYearsShown: 5 });
    expect(g.refusal).toBeDefined();
    expect(g.refusal).toMatch(/withheld/);
    const rules = g.scenarios.flatMap((s) => s.findings.map((f) => f.rule));
    expect(rules.length).toBeGreaterThan(0);
    for (const s of g.scenarios) {
      for (const f of s.findings) {
        // Every finding must cite an authority a reviewer can go and read.
        expect(f.authority, f.rule).toMatch(/AG 49/);
      }
    }
  });

  it('treats a paraphrased mandated notice as a failure, not a near-miss', () => {
    const g = gatedIllustration(input, {
      ...cleanFacts,
      noticeText: 'Past index performance does not predict future results.',
    });
    const rules = g.scenarios.flatMap((s) => s.findings.map((f) => f.rule));
    expect(rules.join(' ')).toMatch(/notice/i);
  });

  it('never surfaces the generator persuasion optimisations', () => {
    const g = gatedIllustration(input, cleanFacts);
    // The whole object is searched, not just the field that was dropped —
    // a future refactor that reintroduces it under another name fails here.
    expect(JSON.stringify(g)).not.toMatch(/persuas/i);
  });

  it('does surface the generator regulatory warnings, which are the opposite thing', () => {
    const g = gatedIllustration(input, cleanFacts);
    expect(Array.isArray(g.generatorWarnings)).toBe(true);
    expect(Array.isArray(g.generatorChecklist)).toBe(true);
  });

  it('a partial pass is not a pass', () => {
    const g = gatedIllustration(input, { ...cleanFacts, historicalYearsShown: 5 });
    const anyShowable = g.scenarios.some((s) => s.showable);
    // Whatever the mix, showable at the top level requires ALL scenarios clear.
    expect(g.showable).toBe(g.scenarios.every((s) => s.showable));
    if (anyShowable) expect(g.showable).toBe(false);
  });

  it('records where flexibility is allowed to come from, and it is never the cap', () => {
    expect(FLEXIBILITY_COMES_FROM.length).toBeGreaterThanOrEqual(3);
    const joined = FLEXIBILITY_COMES_FROM.join(' ').toLowerCase();
    expect(joined).toMatch(/product/);
    expect(joined).toMatch(/loan/);
    // Nothing in that list may propose moving the maximum illustrated rate.
    expect(joined).not.toMatch(/raise the (cap|maximum)|higher (cap|maximum)|exceed/);
  });
});
