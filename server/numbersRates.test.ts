/**
 * Rate and corridor defaults, verified 2026-09-23.
 *
 *  - MYGA default 6.3% compounding (was 7%), HELOC default 7.09% (was 8.5%, 6% fallback)
 *    — shared/marketRateDefaults.ts
 *  - IRC 7702(d)(2) cash value corridor by attained age (was a flat 105%)
 *    — shared/irc7702.ts cashValueCorridorPct
 *  - Mortgage Killer generic COI curve clamped non-decreasing after 85
 *    — shared/mortgageKiller.ts genericCoiRate
 */
import { describe, it, expect } from "vitest";
import {
  HELOC_RATE_DEFAULT,
  HELOC_RATE_DEFAULT_PCT,
  HELOC_RATE_DEFAULT_SOURCE,
  MYGA_RATE_DEFAULT_PCT,
  MYGA_RATE_DEFAULT_SOURCES,
  MARKET_RATE_DEFAULTS_SOURCES,
} from "../shared/marketRateDefaults";
import { cashValueCorridorPct, corridorFactor, IRC_7702_CORRIDOR_SOURCE } from "../shared/irc7702";
import { genericCoiRate, COI_RATE_CARRIED_FORWARD_MAX } from "../shared/mortgageKiller";
import { simulatePolicy } from "../shared/householdWealth";
import { getDefaultInput as mygaDefaults } from "../shared/mygaWaterfall";
import { getDefaultMultiPropertyInput, createDefaultProperty } from "../shared/multiPropertyMyga";
import { getDefaultReverseHelocInput } from "../shared/reverseHeloc";

describe("market-rate defaults", () => {
  it("HELOC default is the 7.09% Curinos national average, in both units", () => {
    expect(HELOC_RATE_DEFAULT_PCT).toBe(7.09);
    expect(HELOC_RATE_DEFAULT).toBeCloseTo(HELOC_RATE_DEFAULT_PCT / 100, 12);
    expect(HELOC_RATE_DEFAULT_SOURCE.url).toMatch(/^https:\/\//);
    expect(HELOC_RATE_DEFAULT_SOURCE.asOf).toMatch(/2026-09-21/);
  });

  it("MYGA default is 6.3% compounding, below the simple-interest headline", () => {
    expect(MYGA_RATE_DEFAULT_PCT).toBe(6.3);
    // The 6.95% 7-year headline is simple interest: its compound equivalent is ~5.83%.
    const compoundEquivalent = Math.pow(1 + 0.0695 * 7, 1 / 7) - 1;
    expect(compoundEquivalent).toBeCloseTo(0.0583, 4);
    expect(MYGA_RATE_DEFAULT_PCT / 100).toBeGreaterThan(compoundEquivalent);
    expect(MYGA_RATE_DEFAULT_SOURCES.some(s => "url" in s && /myannuitystore/.test(s.url))).toBe(true);
    expect(MYGA_RATE_DEFAULT_SOURCES.some(s => /^Assumption:/.test(s.label))).toBe(true);
  });

  it("every sourced entry carries a url and an as-of date", () => {
    for (const s of MARKET_RATE_DEFAULTS_SOURCES) {
      if (s.url) expect(s.asOf).toBeTruthy();
    }
  });

  it("engines read the shared defaults", () => {
    expect(mygaDefaults().mygaRate).toBe(6.3);
    expect(mygaDefaults().helocRate).toBe(7.09);
    expect(getDefaultMultiPropertyInput().mygaRate).toBe(6.3);
    expect(createDefaultProperty(1).helocRate).toBe(7.09);
    expect(getDefaultReverseHelocInput().helocRate).toBe(7.09);
  });
});

describe("cashValueCorridorPct — 26 U.S.C. 7702(d)(2)", () => {
  const cases: [number, number][] = [
    [0, 250], [25, 250], [40, 250],
    [41, 243], [42, 236], [43, 229], [44, 222], [45, 215],
    [48, 197], [50, 185], [53, 164], [55, 150], [58, 138],
    [60, 130], [63, 124], [65, 120], [68, 117], [70, 115], [72, 111],
    [75, 105], [80, 105], [85, 105], [90, 105],
    [91, 104], [92, 103], [93, 102], [94, 101],
    [95, 100], [100, 100], [121, 100],
  ];
  it.each(cases)("age %i → %i%%", (age, pct) => {
    expect(cashValueCorridorPct(age)).toBe(pct);
  });

  it("is a whole number at every age, never increases, and matches corridorFactor", () => {
    for (let a = 0; a <= 121; a++) {
      expect(Number.isInteger(cashValueCorridorPct(a))).toBe(true);
      if (a > 0) expect(cashValueCorridorPct(a)).toBeLessThanOrEqual(cashValueCorridorPct(a - 1));
      expect(corridorFactor(a)).toBeCloseTo(cashValueCorridorPct(a) / 100, 12);
    }
  });

  it("cites the statute", () => {
    expect(IRC_7702_CORRIDOR_SOURCE.url).toBe("https://www.law.cornell.edu/uscode/text/26/7702");
    expect(IRC_7702_CORRIDOR_SOURCE.asOf).toMatch(/2026-09-23/);
  });

  it("householdWealth floors the death benefit at the age-based corridor, not a flat 105%", () => {
    // Tiny face, big premium: the corridor binds from year 1.
    const young = simulatePolicy("A", "primary", 30, 100_000, 1, 5);
    for (const y of young.years) {
      const pct = cashValueCorridorPct(y.age);
      expect(y.deathBenefit).toBeCloseTo(y.accountValue * pct / 100, 0);
      expect(y.deathBenefit).toBeGreaterThan(y.accountValue * 1.05 + 1);
    }
    const old = simulatePolicy("A", "primary", 76, 100_000, 1, 5); // ages 77-81 → 105%
    for (const y of old.years) {
      expect(y.deathBenefit).toBeCloseTo(y.accountValue * 1.05, 0);
    }
  });
});

describe("Mortgage Killer generic COI curve", () => {
  it("never falls with age (clamped from 86 on)", () => {
    for (let a = 1; a <= 121; a++) {
      expect(genericCoiRate(a)).toBeGreaterThanOrEqual(genericCoiRate(a - 1));
    }
  });

  it("keeps the unchanged bands and carries the 2.2% maximum forward", () => {
    expect(genericCoiRate(40)).toBe(0.0008);
    expect(genericCoiRate(70)).toBe(0.0065);
    expect(genericCoiRate(80)).toBe(0.0160);
    expect(genericCoiRate(85)).toBe(0.0220);
    expect(COI_RATE_CARRIED_FORWARD_MAX).toBe(0.0220);
    for (const a of [86, 90, 91, 95, 96, 110]) expect(genericCoiRate(a)).toBe(COI_RATE_CARRIED_FORWARD_MAX);
  });
});
