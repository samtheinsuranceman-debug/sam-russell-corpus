import { describe, it, expect } from "vitest";
import {
  mulberry32,
  resequence,
  runSequence,
  sequenceStressTest,
  policySurvivalMonteCarlo,
  buildExportPacket,
  ExportRefusedError,
  MAX_SHUFFLES,
  permutationDistribution,
  MAX_PERMUTATIONS,
  type LoanPolicyParams,
} from "../shared/sequenceStress";

const POLICY: LoanPolicyParams = {
  issueAge: 45, annualPremium: 100_000, premiumYears: 7, specifiedAmount: 1_000_000,
  annualLoanFraction: 0.8, loanStartYear: 2, loanInterestRate: 0.05,
};
const OPT = "am-sp500-ptp";

describe("deterministic randomness — a seed reproduces a run exactly", () => {
  it("the same seed gives the same stream", () => {
    const a = Array.from({ length: 5 }, mulberry32(99));
    const b = Array.from({ length: 5 }, mulberry32(99));
    expect(a).toEqual(b);
  });

  it("different seeds diverge", () => {
    expect(Array.from({ length: 5 }, mulberry32(1)))
      .not.toEqual(Array.from({ length: 5 }, mulberry32(2)));
  });

  it("resequence permutes without adding, removing or mutating", () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = resequence(src, 123);
    expect(out).not.toBe(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // input untouched
    expect([...out].sort((a, b) => a - b)).toEqual(src); // same multiset
  });

  it("is reproducible from the seed", () => {
    expect(resequence([1, 2, 3, 4, 5], 7)).toEqual(resequence([1, 2, 3, 4, 5], 7));
  });
});

describe("runSequence — the policy under loan load", () => {
  it("credits on the unreduced account value while a loan is outstanding", () => {
    const flat = new Array(10).fill(10);
    const r = runSequence(flat, POLICY);
    const withLoan = r.rows.find((x) => x.loanBalance > 0)!;
    expect(withLoan.accountValue).toBeGreaterThan(withLoan.loanBalance);
  });

  it("compounds loan interest every year, draw or no draw", () => {
    const r = runSequence(new Array(15).fill(6), { ...POLICY, annualLoanFraction: 0.5 });
    const balances = r.rows.map((x) => x.loanBalance).filter((b) => b > 0);
    expect(balances.length).toBeGreaterThan(3);
    expect(balances[balances.length - 1]).toBeGreaterThan(balances[0]);
  });

  it("lapses when the loan balance catches the surrender value, and stops there", () => {
    // All floor years with aggressive loans: the balance must catch the value.
    const allZero = new Array(30).fill(0);
    const r = runSequence(allZero, { ...POLICY, annualLoanFraction: 0.95 });
    expect(r.lapsed).toBe(true);
    expect(r.lapseYear).not.toBeNull();
    expect(r.rows[r.rows.length - 1].policyYear).toBe(r.lapseYear);
  });

  it("reports the tax bomb on lapse, on money already spent", () => {
    const r = runSequence(new Array(30).fill(0), { ...POLICY, annualLoanFraction: 0.95 });
    expect(r.lapsed).toBe(true);
    expect(r.taxableOnLapse).toBeGreaterThanOrEqual(0);
  });

  it("reports zero taxable when it survives", () => {
    const r = runSequence(new Array(10).fill(10), { ...POLICY, annualLoanFraction: 0.3 });
    expect(r.lapsed).toBe(false);
    expect(r.taxableOnLapse).toBe(0);
  });
});

describe("resequencing — same real years, different order", () => {
  const params = {
    optionId: OPT, startYear: 1995, endYear: 2024, policy: POLICY, shuffles: 20, seed: 7,
  };

  it("runs history as it happened, plus the requested shuffles", () => {
    const s = sequenceStressTest(params);
    expect(s.shuffles).toHaveLength(20);
    expect(s.asItHappened.rows.length).toBeGreaterThan(20);
  });

  it("every shuffle contains exactly the years that occurred — nothing added or removed", () => {
    const s = sequenceStressTest(params);
    const actual = [...s.shuffles[0].yearOrder].sort((a, b) => a - b);
    for (const sh of s.shuffles) {
      expect([...sh.yearOrder].sort((a, b) => a - b)).toEqual(actual);
      expect(sh.yearOrder).toHaveLength(actual.length);
    }
    expect(actual).toContain(2008); // the crash is in every ordering
  });

  it("each shuffle carries its seed so it can be reproduced", () => {
    const a = sequenceStressTest(params);
    const b = sequenceStressTest(params);
    expect(a.shuffles.map((s) => s.seed)).toEqual(b.shuffles.map((s) => s.seed));
    expect(a.shuffles[3].yearOrder).toEqual(b.shuffles[3].yearOrder);
    expect(a.worstEnding).toBe(b.worstEnding);
  });

  it("caps the shuffle count and refuses nonsense", () => {
    expect(() => sequenceStressTest({ ...params, shuffles: MAX_SHUFFLES + 1 })).toThrow(RangeError);
    expect(() => sequenceStressTest({ ...params, shuffles: 0 })).toThrow(RangeError);
  });

  it("refuses an unknown option or an empty period", () => {
    expect(() => sequenceStressTest({ ...params, optionId: "ghost" })).toThrow(/Unknown index option/);
    expect(() => sequenceStressTest({ ...params, startYear: 1800, endYear: 1801 }))
      .toThrow(/No history/);
  });

  it("says plainly that only the order changed", () => {
    const s = sequenceStressTest(params);
    expect(s.plain).toContain("nothing added");
    expect(s.plain).toContain("only the order changed");
  });

  it("names the earliest lapse when any ordering breaks the structure", () => {
    const brutal = sequenceStressTest({ ...params, policy: { ...POLICY, annualLoanFraction: 0.97 } });
    if (brutal.lapsedCount > 0) {
      expect(brutal.earliestLapseYear).not.toBeNull();
      expect(brutal.plain).toContain("Sequence alone is enough to break this structure");
    }
  });
});

describe("survival Monte Carlo — how often does it fail", () => {
  const base = {
    optionId: OPT, startYear: 1995, endYear: 2024, years: 30, paths: 2_000, seed: 42,
  };

  it("reports survival, and publishes NO ending-value distribution", () => {
    const r = policySurvivalMonteCarlo({ ...base, policy: POLICY });
    expect(r).toHaveProperty("lapseRate");
    expect(r).toHaveProperty("survivalByYear");
    expect(r).not.toHaveProperty("medianEndingValue");
    expect(r).not.toHaveProperty("percentiles");
    expect(r.whatThisIsNot).toContain("not what any policy will be worth");
  });

  it("lapse risk rises sharply with the loan fraction — the cliff", () => {
    const at60 = policySurvivalMonteCarlo({ ...base, policy: { ...POLICY, annualLoanFraction: 0.6 } });
    const at80 = policySurvivalMonteCarlo({ ...base, policy: { ...POLICY, annualLoanFraction: 0.8 } });
    const at90 = policySurvivalMonteCarlo({ ...base, policy: { ...POLICY, annualLoanFraction: 0.9 } });
    expect(at60.lapseRate).toBeLessThan(at80.lapseRate);
    expect(at80.lapseRate).toBeLessThan(at90.lapseRate);
    // The jump from 80 to 90 is the finding: it is not gradual.
    expect(at90.lapseRate).toBeGreaterThan(at80.lapseRate * 3);
  });

  it("survival is monotonically non-increasing across policy years", () => {
    const r = policySurvivalMonteCarlo({ ...base, policy: POLICY });
    for (let i = 1; i < r.survivalByYear.length; i += 1) {
      expect(r.survivalByYear[i].stillInForce)
        .toBeLessThanOrEqual(r.survivalByYear[i - 1].stillInForce);
    }
  });

  it("is reproducible from its seed and reports that seed", () => {
    const a = policySurvivalMonteCarlo({ ...base, policy: POLICY });
    const b = policySurvivalMonteCarlo({ ...base, policy: POLICY });
    expect(a.lapseRate).toBe(b.lapseRate);
    expect(a.seed).toBe(42);
  });

  it("tells the advisor what to do rather than only what happened", () => {
    const r = policySurvivalMonteCarlo({ ...base, policy: { ...POLICY, annualLoanFraction: 0.9 } });
    expect(r.plain).toContain("Reduce the annual loan fraction");
  });

  it("labels itself a model, not a record", () => {
    const r = policySurvivalMonteCarlo({ ...base, policy: POLICY });
    expect(r.whatThisIsNot).toContain("paths did not occur");
  });
});

describe("export packet — handing it over is a different act from showing it", () => {
  const ok = {
    basicIllustrationAttached: true,
    carrierApprovalReference: "SEC-2026-0914-A",
    disclosures: ["Past performance does not predict future results."],
    seeds: { shuffles: 7, montecarlo: 42 },
  };

  it("assembles when the basic illustration, approval and disclosures are all present", () => {
    const p = buildExportPacket(ok);
    expect(p.basicIllustrationAttached).toBe(true);
    expect(p.carrierApprovalReference).toBe("SEC-2026-0914-A");
    expect(p.seeds.montecarlo).toBe(42);
  });

  it("refuses without the basic illustration travelling with it", () => {
    expect(() => buildExportPacket({ ...ok, basicIllustrationAttached: false }))
      .toThrow(ExportRefusedError);
  });

  it("refuses without a carrier approval reference, and says why", () => {
    try {
      buildExportPacket({ ...ok, carrierApprovalReference: "   " });
      throw new Error("should have thrown");
    } catch (e) {
      expect(String(e)).toContain("prior written carrier approval");
      expect(String(e)).toContain("market conduct exam");
    }
  });

  it("refuses without disclosures", () => {
    expect(() => buildExportPacket({ ...ok, disclosures: [] })).toThrow(ExportRefusedError);
  });

  it("carries the seeds so every figure can be regenerated", () => {
    expect(buildExportPacket(ok).seeds).toEqual({ shuffles: 7, montecarlo: 42 });
  });
});

describe("permutation distribution — thousands of paths, every year real", () => {
  const base = {
    optionId: OPT, startYear: 1995, endYear: 2024, permutations: 1_000, seed: 2026,
  };

  it("every path is a true permutation — all years, each exactly once", () => {
    // Proven structurally at the resequence level, and relied on here: no year is
    // invented, duplicated or dropped, so the distribution is a rearrangement of a
    // record rather than a model of the future.
    const years = [1995, 1996, 2008, 2020];
    const dealt = resequence(years, 5);
    expect([...dealt].sort((a, b) => a - b)).toEqual(years);
    expect(new Set(dealt).size).toBe(years.length);
  });

  it("publishes a full ending-value distribution — values are allowed here", () => {
    const d = permutationDistribution({ ...base, policy: POLICY });
    expect(d.percentiles.p5).toBeLessThanOrEqual(d.percentiles.p50);
    expect(d.percentiles.p50).toBeLessThanOrEqual(d.percentiles.p95);
    expect(d.worst).toBeLessThanOrEqual(d.percentiles.p5);
    expect(d.best).toBeGreaterThanOrEqual(d.percentiles.p95);
  });

  it("locates the real ordering inside the distribution", () => {
    const d = permutationDistribution({ ...base, policy: POLICY });
    expect(d.actualHistoryPercentile).toBeGreaterThanOrEqual(0);
    expect(d.actualHistoryPercentile).toBeLessThanOrEqual(1);
    expect(d.plain).toContain("percentile of every possible ordering");
  });

  it("loans amplify sequence risk — spread widens and lapses appear", () => {
    const noLoans = permutationDistribution({ ...base, policy: { ...POLICY, annualLoanFraction: 0 } });
    const loaded = permutationDistribution({ ...base, policy: POLICY });
    expect(noLoans.lapsedCount).toBe(0);
    expect(loaded.spreadRatio).toBeGreaterThan(noLoans.spreadRatio);
  });

  it("states its provenance — a rearrangement, not a forecast", () => {
    const d = permutationDistribution({ ...base, policy: POLICY });
    expect(d.provenance).toContain("each exactly once");
    expect(d.provenance).toContain("No return was invented, duplicated or omitted");
    expect(d.provenance).toContain("not a model of the future");
  });

  it("is reproducible from its seed", () => {
    const a = permutationDistribution({ ...base, policy: POLICY });
    const b = permutationDistribution({ ...base, policy: POLICY });
    expect(a.percentiles).toEqual(b.percentiles);
    expect(a.actualHistoryEnding).toBe(b.actualHistoryEnding);
  });

  it("bounds the permutation count and refuses nonsense", () => {
    expect(() => permutationDistribution({ ...base, policy: POLICY, permutations: 0 }))
      .toThrow(RangeError);
    expect(() => permutationDistribution({ ...base, policy: POLICY, permutations: MAX_PERMUTATIONS + 1 }))
      .toThrow(RangeError);
  });

  it("refuses an unknown option or an empty period", () => {
    expect(() => permutationDistribution({ ...base, policy: POLICY, optionId: "ghost" }))
      .toThrow(/Unknown index option/);
    expect(() => permutationDistribution({ ...base, policy: POLICY, startYear: 1800, endYear: 1801 }))
      .toThrow(/No history/);
  });

  it("the survival Monte Carlo still publishes no values — the two stay different", () => {
    const mc = policySurvivalMonteCarlo({
      optionId: OPT, startYear: 1995, endYear: 2024, years: 30, paths: 500, seed: 1, policy: POLICY,
    });
    expect(mc).not.toHaveProperty("percentiles");
    const perm = permutationDistribution({ ...base, policy: POLICY });
    expect(perm).toHaveProperty("percentiles");
  });
});
