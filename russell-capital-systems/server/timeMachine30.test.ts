import { describe, it, expect } from "vitest";
import {
  shuffle, mulberry32, creditedPct, realYears, runTimeMachine,
  liquidityWindows, pickYears, everyNthYear, compareMultiplier,
  breakEvenPerformanceFactor, EPFR_DESIGNS, MissingPerformanceFactorError,
  TIME_MACHINE_RULES, DEFAULT_WINDOW_YEARS,
} from "../shared/timeMachine30";
import { HORIZON_ACCOUNTS, HORIZON_ILLUSTRATION_FACTS } from "../shared/pacificHorizonEcv";

const BASE = {
  accountId: "ph-1yr", annualPremium: 200_000, premiumYears: 5,
  issueAge: 45, specifiedAmount: 8_583_171,
};
const ONE_YR = HORIZON_ACCOUNTS.find((a) => a.id === "ph-1yr")!;

describe("shuffling — real years reordered, never resampled", () => {
  it("is reproducible from a seed", () => {
    expect(shuffle([1, 2, 3, 4, 5], 7)).toEqual(shuffle([1, 2, 3, 4, 5], 7));
    expect(Array.from({ length: 4 }, mulberry32(9))).toEqual(Array.from({ length: 4 }, mulberry32(9)));
  });

  it("permutes without adding, dropping or mutating", () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(src, 42);
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort((a, b) => a - b)).toEqual(src);
  });

  it("every shuffled run contains each real year exactly once", () => {
    const actual = runTimeMachine(BASE);
    const shuffled = runTimeMachine({ ...BASE, seed: 11 });
    const a = actual.years.map((y) => y.sourceYear).sort();
    const b = shuffled.years.map((y) => y.sourceYear).sort();
    expect(b).toEqual(a);
    expect(new Set(b).size).toBe(b.length);
    expect(b).toContain(2008);
  });

  it("says in its provenance that only the order changed", () => {
    const r = runTimeMachine({ ...BASE, seed: 5 });
    expect(r.provenance).toContain("each appearing exactly once");
    expect(r.provenance).toContain("No return was invented, duplicated or omitted");
    expect(r.provenance).toContain("Not an illustration and not a projection");
  });
});

describe("carrier terms — participation, then cap, then floor", () => {
  it("caps a big year at the account's current cap", () => {
    expect(creditedPct(ONE_YR, 31.4, "current")).toBe(ONE_YR.currentCapPct);
  });

  it("floors a negative year at zero", () => {
    expect(creditedPct(ONE_YR, -44.76, "current")).toBe(0);
  });

  it("uses guaranteed terms on the guaranteed basis, and they are worse", () => {
    const cur = creditedPct(ONE_YR, 31.4, "current");
    const gtd = creditedPct(ONE_YR, 31.4, "guaranteed");
    expect(gtd).toBeLessThan(cur);
  });

  it("applies participation before the cap on the dynamic par account", () => {
    const dyn = HORIZON_ACCOUNTS.find((a) => a.id === "ph-1yr-nocap-dynamic-par")!;
    // 50% par, uncapped: a 30% index year credits 15%.
    expect(creditedPct(dyn, 30, "current")).toBeCloseTo(30 * (dyn.currentParticipationPct / 100), 4);
  });

  it("returns thirty real years and refuses accounts with no public series", () => {
    expect(realYears(ONE_YR).length).toBe(DEFAULT_WINDOW_YEARS);
    const endura = HORIZON_ACCOUNTS.find((a) => a.index === "BLACKROCK_ENDURA");
    if (endura) expect(realYears(endura)).toHaveLength(0);
    const fixed = HORIZON_ACCOUNTS.find((a) => a.id === "ph-fixed")!;
    expect(realYears(fixed)).toHaveLength(0);
  });

  it("refuses to run an account it has no series for, rather than guessing", () => {
    expect(() => runTimeMachine({ ...BASE, accountId: "ph-fixed" }))
      .toThrow(/No public index series/);
    expect(() => runTimeMachine({ ...BASE, accountId: "nope" }))
      .toThrow(/Unknown Pacific Horizon account/);
  });
});

describe("the run", () => {
  const r = runTimeMachine({ ...BASE, seed: 11 });

  it("credits on account value that a loan does not reduce", () => {
    for (const y of r.years) expect(y.accountValue).toBeGreaterThanOrEqual(y.surrenderValue);
  });

  it("counts floored and capped years — the product's own story", () => {
    expect(r.yearsFloored).toBeGreaterThan(0);
    expect(r.yearsCapped).toBeGreaterThan(0);
    expect(r.yearsFloored + r.yearsCapped).toBeLessThanOrEqual(r.years.length);
  });

  it("stops premium after the pay period", () => {
    expect(r.years[4].premium).toBe(BASE.annualPremium);
    expect(r.years[5].premium).toBe(0);
    expect(r.totalPremium).toBe(BASE.annualPremium * BASE.premiumYears);
  });

  it("grades the surrender charge to zero by year 11 — the 120-month rule", () => {
    const y11 = r.years.find((y) => y.policyYear === 11)!;
    expect(y11.surrenderValue).toBe(y11.accountValue);
    expect(HORIZON_ILLUSTRATION_FACTS.surrenderChargeZeroAtMonths).toBe(120);
  });

  it("different seeds give different outcomes from identical years", () => {
    const a = runTimeMachine({ ...BASE, seed: 11 }).endingAccountValue;
    const b = runTimeMachine({ ...BASE, seed: 22 }).endingAccountValue;
    expect(a).not.toBe(b);
  });
});

describe("liquidity windows", () => {
  const r = runTimeMachine({ ...BASE, seed: 11 });

  it("ranks by what the account earns after the loan, not by the biggest balance", () => {
    const w = liquidityWindows(r, 5);
    for (let i = 1; i < w.length; i += 1) {
      expect(w[i].creditEarnedAfterLoan).toBeLessThanOrEqual(w[i - 1].creditEarnedAfterLoan);
    }
    // The final year has the largest balance and nothing left to earn, so it
    // must not top the list.
    expect(w[0].policyYear).not.toBe(r.years.length);
  });

  it("reports the borrowable amount against the surrender value, not the account value", () => {
    for (const w of liquidityWindows(r, 5)) {
      expect(w.borrowable).toBeLessThanOrEqual(w.surrenderValue);
    }
  });

  it("explains the mechanism in the sentence", () => {
    expect(liquidityWindows(r, 1)[0].plain).toContain("the account value stays at");
  });
});

describe("the multiplier toggle", () => {
  it("REFUSES a paid design with no factor on file", () => {
    expect(() => compareMultiplier({ ...BASE, seed: 11 }, { design: "performance-plus" }))
      .toThrow(MissingPerformanceFactorError);
    expect(() => compareMultiplier({ ...BASE, seed: 11 }, { design: "performance" }))
      .toThrow(MissingPerformanceFactorError);
  });

  it("records that the uploaded illustrations carry no factors", () => {
    const plus = EPFR_DESIGNS.find((d) => d.key === "performance-plus")!;
    expect(plus.performanceFactor).toBeNull();
    expect(plus.annualChargePct).toBe(7.5);
    const b = EPFR_DESIGNS.find((d) => d.key === "performance")!;
    expect(b.performanceFactor).toBeNull();
    expect(b.annualChargePct).toBeNull();
    expect(HORIZON_ILLUSTRATION_FACTS.epfrDesignIllustrated).toContain("Design A");
  });

  it("runs Classic for free and at a factor of one", () => {
    const c = EPFR_DESIGNS.find((d) => d.key === "classic")!;
    expect(c.annualChargePct).toBe(0);
    expect(c.performanceFactor).toBe(1);
    expect(() => compareMultiplier({ ...BASE, seed: 11 }, { design: "classic" })).not.toThrow();
  });

  it("compares like for like — same seed, same years, rider is the only difference", () => {
    const cmp = compareMultiplier({ ...BASE, seed: 11 }, { design: "performance-plus", performanceFactor: 1.35 });
    expect(cmp.withRider.years.map((y) => y.sourceYear))
      .toEqual(cmp.withoutRider.years.map((y) => y.sourceYear));
    expect(cmp.totalChargesPaid).toBeGreaterThan(0);
  });

  it("always shows the charge beside the gain", () => {
    const cmp = compareMultiplier({ ...BASE, seed: 11 }, { design: "performance-plus", performanceFactor: 3 });
    expect(cmp.plain).toContain("the rider charged");
  });
});

describe("break-even performance factor — what the charge demands", () => {
  it("computes the factor Design C needs to match Classic", () => {
    const b = breakEvenPerformanceFactor({ ...BASE, seed: 11 }, "performance-plus");
    expect(b.chargePct).toBe(7.5);
    expect(b.factor).toBeGreaterThan(1.5);
    expect(b.note).toContain("just to match Classic");
  });

  it("a factor below break-even loses and above it wins", () => {
    const b = breakEvenPerformanceFactor({ ...BASE, seed: 11 }, "performance-plus");
    const below = compareMultiplier({ ...BASE, seed: 11 }, { design: "performance-plus", performanceFactor: b.factor! - 0.3 });
    const above = compareMultiplier({ ...BASE, seed: 11 }, { design: "performance-plus", performanceFactor: b.factor! + 0.3 });
    expect(below.endingValueDelta).toBeLessThan(0);
    expect(above.endingValueDelta).toBeGreaterThan(0);
  });

  it("returns null with a reason where no charge is on file", () => {
    const b = breakEvenPerformanceFactor({ ...BASE, seed: 11 }, "performance");
    expect(b.factor).toBeNull();
    expect(b.note).toContain("No charge is on file");
  });

  it("Classic breaks even at one", () => {
    expect(breakEvenPerformanceFactor({ ...BASE, seed: 11 }, "classic").factor).toBe(1);
  });
});

describe("year picker", () => {
  const r = runTimeMachine({ ...BASE, seed: 11 });

  it("pulls exactly the years asked for, in order", () => {
    const { rows } = pickYears(r, [2, 5, 7, 9, 12, 19, 22]);
    expect(rows.map((x) => x.policyYear)).toEqual([2, 5, 7, 9, 12, 19, 22]);
  });

  it("reports out-of-range years rather than silently dropping them", () => {
    const { rows, notFound } = pickYears(r, [1, 99, 30, -4]);
    expect(rows.map((x) => x.policyYear)).toEqual([1, 30]);
    expect(notFound).toEqual([99, -4]);
  });

  it("every-Nth drives the 5 and 10 year buttons", () => {
    expect(everyNthYear(r, 10).map((x) => x.policyYear)).toEqual([10, 20, 30]);
    expect(everyNthYear(r, 5).map((x) => x.policyYear)).toEqual([5, 10, 15, 20, 25, 30]);
    expect(() => everyNthYear(r, 0)).toThrow(RangeError);
  });
});

describe("never-printed list", () => {
  it("forbids calling this an illustration, and names the real cap", () => {
    const j = TIME_MACHINE_RULES.neverPrinted.join(" ");
    expect(j).toContain("an illustration or a projection");
    expect(j).toContain("already occurred");
    expect(j).toContain("6.35%");
    expect(j).toContain("without the charge that bought it");
  });

  it("matches the maximum illustrated rate on the illustration", () => {
    expect(HORIZON_ILLUSTRATION_FACTS.maximumIllustratedRatePct).toBe(6.35);
  });
});
