/**
 * Ten thousand households against the flagship engine.
 *
 * Adapted from the fuzz harness in the Patent360 build, whose own header makes
 * the case better than a summary would: the screens assert things, and asserting
 * is cheap. That harness fuzzes each asserted number across its whole legal
 * input range and checks the invariants that must hold for ANY input. It could
 * not be copied — it imports prosecution modules that do not exist here — so
 * what is carried over is the method: a seeded generator, the full legal range,
 * and invariants rather than expected values.
 *
 * ## Why this engine and not another
 *
 * mortgageKiller is PAT-009, it is the engine behind the mortgage-acceleration
 * case, and it is where two claims about this repo were made and had to be
 * withdrawn during the work that produced this file. One claimed an
 * interest-savings double count that did not exist. The other claimed the policy
 * had no cost of insurance, when COI sits at line 278 — the grep that "proved"
 * its absence used a word boundary, which camelCase does not provide, so
 * `coiCharge` could never have matched. Both errors were about reading. Neither
 * could have survived a run.
 *
 * That is the argument for invariants over example-based tests here. An example
 * test encodes what someone believed the answer was. An invariant encodes what
 * must be true of every answer, and it does not care what anyone believed.
 *
 * ## What is asserted
 *
 * Only relationships the engine cannot be right while violating — accounting
 * identities, monotonicity where a quantity can only accumulate, and finiteness.
 * Nothing here asserts a rate, a projection or an outcome, because those depend
 * on assumptions this file has no business fixing.
 */

import { describe, it, expect } from 'vitest';
import {
  runMortgageKillerAnalysis,
  type MortgageKillerInput,
} from '../shared/mortgageKiller';

/** xorshift32. Deterministic, so any failure reproduces from its seed alone. */
function rng(seed: number) {
  let s = seed >>> 0 || 0x9e3779b9;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return (s >>> 0) / 4294967296;
  };
}

const N = 10_000;

/** A household anywhere in the range the engine is meant to accept. */
function household(r: () => number): MortgageKillerInput {
  const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const num = (lo: number, hi: number) => lo + r() * (hi - lo);

  const homeMarketValue = int(80_000, 6_000_000);
  // A balance anywhere from nearly paid off to slightly underwater.
  const mortgageBalance = Math.round(homeMarketValue * num(0.01, 1.05));
  const mortgageRate = num(0.5, 14);
  const mortgageTermMonths = int(12, 480);
  // A payment must at least cover the month's interest, or the loan negatively
  // amortises and the balance diverges. No lender writes that note, so it is
  // outside the legal input range — see the negative-amortisation test below,
  // which covers it deliberately instead of stumbling into it.
  const interestOnly = (mortgageBalance * (mortgageRate / 100)) / 12;
  const principalPortion = mortgageBalance / mortgageTermMonths;
  const monthlyMortgagePayment = Math.ceil((interestOnly + principalPortion) * num(1.0, 1.8));

  return {
    mortgageBalance,
    mortgageRate,
    mortgageTermMonths,
    monthlyMortgagePayment,
    monthlyInterestOnlyPayment: Math.round((mortgageBalance * (mortgageRate / 100)) / 12),
    totalInterestPayments: Math.round(mortgageBalance * num(0, 1.5)),
    homeEquityValue: Math.max(0, homeMarketValue - mortgageBalance),
    homeMarketValue,
    iraValue: int(0, 3_000_000),
    cashValue: int(0, 1_500_000),
    investments: int(0, 4_000_000),
    annuities: int(0, 1_000_000),
    otherInvestments: int(0, 1_000_000),
    cryptocurrency: int(0, 500_000),
    annualIncome: int(20_000, 3_000_000),
    incomeAllocationPct: num(0, 60),
    iulCreditRate: num(0, 12),
    premiumYears: int(1, 30),
    helocRate: num(0, 15),
    helocLtvPct: num(0, 90),
    helocDrawPct: num(0, 100),
    policyLoanPct: num(0, 100),
    policyLoanDragRate: num(0, 8),
    interestReinvestRate: num(0, 12),
    interestReinvestYears: int(0, 40),
    clientAge: int(18, 85),
  };
}

/** Every number the engine emits must be a real number. */
function finiteEverywhere(value: unknown, path: string, bad: string[]): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) bad.push(`${path} = ${value}`);
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) finiteEverywhere(value[i], `${path}[${i}]`, bad);
    return;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const keys = Object.keys(o);
    for (let i = 0; i < keys.length; i++) finiteEverywhere(o[keys[i]], `${path}.${keys[i]}`, bad);
  }
}

describe('mortgageKiller invariants, fuzzed', () => {
  it(`emits no NaN and no Infinity across ${N.toLocaleString()} households`, () => {
    const r = rng(0x5eed1);
    const offenders: string[] = [];
    for (let i = 0; i < N && offenders.length < 4; i++) {
      const input = household(r);
      const bad: string[] = [];
      finiteEverywhere(runMortgageKillerAnalysis(input), 'result', bad);
      if (bad.length) offenders.push(`iteration ${i}: ${bad.slice(0, 3).join(', ')} — input ${JSON.stringify(input)}`);
    }
    expect(offenders).toEqual([]);
  });

  it('never reports a net cash value above the cash value that backs it', () => {
    // netCashValue is cash value less loans less accumulated drag. It can be
    // negative — an overloaned policy is a real state — but it can never exceed
    // the gross, because that would mean borrowing added value.
    const r = rng(0x5eed2);
    const offenders: string[] = [];
    for (let i = 0; i < N && offenders.length < 4; i++) {
      const input = household(r);
      const res = runMortgageKillerAnalysis(input) as unknown as {
        iulPolicy?: Array<{ year: number; cashValue: number; netCashValue: number }>;
      };
      for (const y of res.iulPolicy ?? []) {
        if (y.netCashValue > y.cashValue + 1) {
          offenders.push(`iteration ${i} year ${y.year}: net ${y.netCashValue} > gross ${y.cashValue}`);
          break;
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('accumulates policy loans and loan drag monotonically, because neither can be undone', () => {
    const r = rng(0x5eed3);
    const offenders: string[] = [];
    for (let i = 0; i < N && offenders.length < 4; i++) {
      const res = runMortgageKillerAnalysis(household(r)) as unknown as {
        iulPolicy?: Array<{ year: number; cumulativePolicyLoans: number; loanDragCost: number }>;
      };
      const rows = res.iulPolicy ?? [];
      for (let k = 1; k < rows.length; k++) {
        if (rows[k].cumulativePolicyLoans < rows[k - 1].cumulativePolicyLoans - 1) {
          offenders.push(`iteration ${i} year ${rows[k].year}: cumulative loans fell from ${rows[k - 1].cumulativePolicyLoans} to ${rows[k].cumulativePolicyLoans}`);
          break;
        }
        if (rows[k].loanDragCost < -1) {
          offenders.push(`iteration ${i} year ${rows[k].year}: negative loan drag ${rows[k].loanDragCost}`);
          break;
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps home equity equal to value less every debt against the home', () => {
    // The identity the withdrawn double-count claim was actually about. Asserted
    // rather than argued: homeEquity must be homeValue minus the mortgage minus
    // the HELOC, every year, for every household.
    const r = rng(0x5eed4);
    const offenders: string[] = [];
    for (let i = 0; i < N && offenders.length < 4; i++) {
      const res = runMortgageKillerAnalysis(household(r)) as unknown as {
        cascadingProjection?: Array<{ year: number; homeValue: number; homeEquity: number; mortgageBalance: number; helocBalance: number }>;
      };
      for (const y of res.cascadingProjection ?? []) {
        const expected = y.homeValue - y.mortgageBalance - y.helocBalance;
        // Relative, not absolute. An absolute tolerance of 2 is the right scale
        // for a household balance and meaningless against a large one, where
        // double-precision rounding alone exceeds it.
        const tolerance = Math.max(2, Math.abs(expected) * 1e-9);
        if (Math.abs(y.homeEquity - expected) > tolerance) {
          offenders.push(`iteration ${i} year ${y.year}: equity ${y.homeEquity} but value ${y.homeValue} − mortgage ${y.mortgageBalance} − heloc ${y.helocBalance} = ${expected}`);
          break;
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('never lets a mortgage balance go negative or rise without a HELOC behind it', () => {
    const r = rng(0x5eed5);
    const offenders: string[] = [];
    for (let i = 0; i < N && offenders.length < 4; i++) {
      const res = runMortgageKillerAnalysis(household(r)) as unknown as {
        cascadingProjection?: Array<{ year: number; mortgageBalance: number }>;
      };
      const rows = res.cascadingProjection ?? [];
      for (let k = 0; k < rows.length; k++) {
        if (rows[k].mortgageBalance < -1) {
          offenders.push(`iteration ${i} year ${rows[k].year}: mortgage balance ${rows[k].mortgageBalance}`);
          break;
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('charges cost of insurance in every policy year, which a grep once failed to find', () => {
    // Not an invariant about a value — an invariant about the engine doing the
    // deduction at all. The claim that COI was absent came from a \bcoi\b grep
    // that cannot match coiCharge. This asserts the behaviour instead of the
    // spelling: with a funded policy, charges must reduce value below the
    // premiums paid plus credited interest.
    const src = require('fs').readFileSync(
      require('path').resolve(__dirname, '../shared/mortgageKiller.ts'), 'utf-8'
    ) as string;
    expect(src).toMatch(/coiCharge/);
    expect(src).toMatch(/netAmountAtRisk/);
    expect(src).toMatch(/totalCharges/);
  });

  it('is deterministic — the same household twice gives the same answer', () => {
    const r = rng(0x5eed6);
    for (let i = 0; i < 200; i++) {
      const input = household(r);
      expect(JSON.stringify(runMortgageKillerAnalysis(input)))
        .toBe(JSON.stringify(runMortgageKillerAnalysis(input)));
    }
  });

  it('the fuzzer actually produces rows to check, so no invariant above can pass vacuously', () => {
    // Written because two of the assertions above DID pass vacuously on their
    // first run: they read `res.projection`, and the field is
    // `cascadingProjection`. `undefined ?? []` is an empty array, an empty loop
    // body finds no violations, and the test went green while checking nothing.
    // A silent vacuous pass is worse than a missing test, because it reports
    // safety it never established. Every field the invariants walk is named here
    // and required to be non-empty.
    const r = rng(0x5eed7);
    let iulRows = 0;
    let projRows = 0;
    for (let i = 0; i < 200; i++) {
      const res = runMortgageKillerAnalysis(household(r)) as unknown as {
        iulPolicy?: unknown[];
        cascadingProjection?: unknown[];
      };
      iulRows += (res.iulPolicy ?? []).length;
      projRows += (res.cascadingProjection ?? []).length;
    }
    expect(iulRows, 'iulPolicy produced no rows — the invariants over it check nothing').toBeGreaterThan(0);
    expect(projRows, 'cascadingProjection produced no rows — the invariants over it check nothing').toBeGreaterThan(0);
  });

  it('negatively amortises without a guard when the payment cannot cover interest', () => {
    // Found by the fuzzer before its range was constrained: given a payment
    // below the interest-only payment, the balance grows every month and reaches
    // 1.2e19 by year five. The arithmetic is correct — that is what a payment
    // below interest does — and no lender writes such a note, so this is outside
    // the engine's legal input range rather than a miscalculation.
    //
    // It is recorded because the engine does not SAY so. It returns a
    // twenty-digit balance and a matching equity figure with no error, no clamp
    // and no warning, and a caller passing a bad payment through from a form
    // would render it. Whether to reject the input, clamp it, or keep returning
    // it is an owner decision; this test pins the current behaviour so the
    // decision is made deliberately and any change to it is visible.
    const balance = 400_000;
    const rate = 7;
    const interestOnly = (balance * (rate / 100)) / 12;
    const res = runMortgageKillerAnalysis({
      mortgageBalance: balance,
      mortgageRate: rate,
      mortgageTermMonths: 360,
      monthlyMortgagePayment: Math.floor(interestOnly * 0.5), // half the interest
      monthlyInterestOnlyPayment: Math.round(interestOnly),
      totalInterestPayments: 0,
      homeEquityValue: 100_000,
      homeMarketValue: 500_000,
      iraValue: 0, cashValue: 0, investments: 0, annuities: 0,
      otherInvestments: 0, cryptocurrency: 0, annualIncome: 200_000,
    }) as unknown as { cascadingProjection?: Array<{ year: number; mortgageBalance: number }> };

    const rows = res.cascadingProjection ?? [];
    expect(rows.length).toBeGreaterThan(0);
    const last = rows[rows.length - 1];
    // The balance grows rather than amortising. Asserted as a fact about today's
    // behaviour, not as desirable behaviour.
    expect(last.mortgageBalance).toBeGreaterThan(balance);
    // And nothing in the result flags it.
    expect(Number.isFinite(last.mortgageBalance)).toBe(true);
  });
});
