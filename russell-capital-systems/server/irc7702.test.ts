/**
 * The corridor is law, so these are checks against the statute rather than
 * against our own arithmetic.
 *
 * The strongest one is the interpolation check: reading the brackets ratably,
 * as 7702(d)(2) directs, has to reproduce the integer percentages the table is
 * commonly published as. Two independent derivations agreeing is the closest
 * thing to proof available without the primary text in front of us.
 */

import { describe, it, expect } from 'vitest';
import {
  applicablePercentage,
  corridorFactor,
  corridorDeathBenefit,
  corridorBindsAboveCashValue,
  CORRIDOR_BRACKETS,
  CORRIDOR_FACTOR_BY_AGE,
  VERIFIED_AGAINST_PRIMARY_TEXT,
} from '../shared/irc7702';

describe('the statutory table', () => {
  it('hits every bracket endpoint exactly', () => {
    expect(applicablePercentage(0)).toBe(250);
    expect(applicablePercentage(40)).toBe(250);
    expect(applicablePercentage(45)).toBe(215);
    expect(applicablePercentage(50)).toBe(185);
    expect(applicablePercentage(55)).toBe(150);
    expect(applicablePercentage(60)).toBe(130);
    expect(applicablePercentage(65)).toBe(120);
    expect(applicablePercentage(70)).toBe(115);
    expect(applicablePercentage(75)).toBe(105);
    expect(applicablePercentage(90)).toBe(105);
    expect(applicablePercentage(95)).toBe(100);
  });

  it('reproduces the commonly published integer percentages by interpolating ratably', () => {
    // If the ratable reading and the published integers ever disagree, one of
    // them is wrong — and this is how we would find out.
    const published: Record<number, number> = {
      41: 243, 42: 236, 43: 229, 44: 222,
      46: 209, 47: 203, 48: 197, 49: 191,
      51: 178, 52: 171, 53: 164, 54: 157,
      56: 146, 57: 142, 58: 138, 59: 134,
      61: 128, 62: 126, 63: 124, 64: 122,
      66: 119, 67: 118, 68: 117, 69: 116,
      71: 113, 72: 111, 73: 109, 74: 107,
      91: 104, 92: 103, 93: 102, 94: 101,
    };
    for (const [age, pct] of Object.entries(published)) {
      expect(Math.round(applicablePercentage(Number(age))), `age ${age}`).toBe(pct);
    }
  });

  it('never increases with age, which is the shape the statute requires', () => {
    for (let a = 1; a <= 120; a++) {
      expect(applicablePercentage(a), `age ${a}`).toBeLessThanOrEqual(applicablePercentage(a - 1));
    }
  });

  it('holds at 100% from 95 onward and never drops below it', () => {
    for (let a = 95; a <= 121; a++) expect(applicablePercentage(a)).toBe(100);
  });

  it('has contiguous brackets with no gap or overlap', () => {
    for (let i = 1; i < CORRIDOR_BRACKETS.length; i++) {
      expect(CORRIDOR_BRACKETS[i]!.moreThan).toBe(CORRIDOR_BRACKETS[i - 1]!.butNotMoreThan);
    }
    // And each bracket picks up where the last left off.
    for (let i = 1; i < CORRIDOR_BRACKETS.length; i++) {
      expect(CORRIDOR_BRACKETS[i]!.from).toBe(CORRIDOR_BRACKETS[i - 1]!.to);
    }
  });

  it('is not yet confirmed against the primary text, and says so', () => {
    // This flips to true when a human reads 26 U.S.C. 7702(d)(2) beside the
    // file. Until then the flag is part of the record, not a formality.
    expect(VERIFIED_AGAINST_PRIMARY_TEXT).toBe(false);
  });
});

describe('what the corridor does to a policy', () => {
  it('forces the death benefit up once cash value passes the threshold', () => {
    const face = 1_000_000;
    const age = 60; // 130%
    const threshold = corridorBindsAboveCashValue(face, age);
    expect(threshold).toBeCloseTo(face / 1.3, 0);

    // Just below: the face amount stands.
    expect(corridorDeathBenefit(face, threshold - 1000, age)).toBe(face);
    // Just above: the corridor drags it up.
    expect(corridorDeathBenefit(face, threshold + 100_000, age)).toBeGreaterThan(face);
  });

  it('binds sooner at younger ages, because the required percentage is higher', () => {
    const face = 1_000_000;
    expect(corridorBindsAboveCashValue(face, 45)).toBeLessThan(corridorBindsAboveCashValue(face, 65));
  });

  it('exposes a factor map covering every age the engine can reach', () => {
    expect(CORRIDOR_FACTOR_BY_AGE[45]).toBeCloseTo(2.15, 4);
    expect(CORRIDOR_FACTOR_BY_AGE[100]).toBe(1);
    for (let a = 0; a <= 121; a++) expect(typeof CORRIDOR_FACTOR_BY_AGE[a]).toBe('number');
  });

  it('agrees with corridorFactor at every age', () => {
    for (let a = 0; a <= 121; a++) expect(CORRIDOR_FACTOR_BY_AGE[a]).toBe(corridorFactor(a));
  });
});
