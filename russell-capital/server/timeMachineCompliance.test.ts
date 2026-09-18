import { describe, it, expect } from "vitest";
import {
  indexHistory,
  summarizeHistory,
  projectPolicyValues,
  buildThreePanel,
  Ag49ViolationError,
  PRESENTATION_RULES,
  alternateAgeBacktest,
  UnpairedBacktestError,
  BACKTEST_DISCLOSURES,
  coiRateForAge,
  runAllocation,
  compareAllocations,
  rollingWindows,
  bestWindow,
  ARCHAEOLOGY_DISCLOSURES,
  type Ag49Envelope,
} from "../shared/timeMachineCompliance";
import { ALL_INDEX_OPTIONS } from "../shared/indexCreditingData";

const ENVELOPE: Ag49Envelope = {
  maximumIllustratedRate: 0.0554,
  source: "Carrier illustration system, benchmark index account per AG 49-A",
  readOn: "2026-09-16",
};

const OPTION = ALL_INDEX_OPTIONS.find((o) => o.index === "SP500" && o.cap !== null)!;

describe("index history — facts about an index, never capped", () => {
  it("returns a row per year with the product's real parameters applied", () => {
    const rows = indexHistory(OPTION, 1994, 2025);
    expect(rows.length).toBeGreaterThan(25);
    for (const r of rows) {
      expect(Number.isFinite(r.indexReturnPct)).toBe(true);
      expect(Number.isFinite(r.creditedPct)).toBe(true);
    }
  });

  it("marks the years the floor caught a crash", () => {
    const rows = indexHistory(OPTION, 1994, 2025);
    // 2008 was -44.76% on the S&P. A floored product credits 0, not -44.76.
    const y2008 = rows.find((r) => r.year === 2008)!;
    expect(y2008.indexReturnPct).toBeLessThan(0);
    expect(y2008.creditedPct).toBeGreaterThanOrEqual(0);
    expect(y2008.floorProtected).toBe(true);
  });

  it("marks the years the cap trimmed a big index year", () => {
    const rows = indexHistory(OPTION, 1994, 2025);
    const capped = rows.filter((r) => r.capLimited);
    expect(capped.length).toBeGreaterThan(0);
    for (const r of capped) expect(r.creditedPct).toBeLessThan(r.indexReturnPct);
  });

  it("summarises the record without turning it into a rate", () => {
    const s = summarizeHistory(indexHistory(OPTION, 1994, 2025));
    expect(s.years).toBeGreaterThan(25);
    expect(s.yearsFloorProtected).toBeGreaterThan(0);
    expect(s.note).toContain("not a rate at which anything is projected");
  });

  it("handles an empty period without inventing anything", () => {
    const s = summarizeHistory(indexHistory(OPTION, 1800, 1801));
    expect(s.years).toBe(0);
    expect(s.bestYear).toBeNull();
  });
});

describe("AG 49-A envelope — the cap is enforced, not suggested", () => {
  const base = {
    annualPremium: 100_000, premiumYears: 7, projectionYears: 30,
    issueAge: 45, envelope: ENVELOPE,
  };

  it("projects at the maximum illustrated rate", () => {
    const rows = projectPolicyValues({ ...base, rate: ENVELOPE.maximumIllustratedRate });
    expect(rows).toHaveLength(30);
    expect(rows.every((r) => r.rateUsed <= ENVELOPE.maximumIllustratedRate)).toBe(true);
    expect(rows[29].accountValue).toBeGreaterThan(0);
  });

  it("REFUSES a rate above the cap", () => {
    expect(() => projectPolicyValues({ ...base, rate: 0.12 })).toThrow(Ag49ViolationError);
  });

  it("refuses a historical average laundered into a projection", () => {
    // This is the exact move the engine exists to block: take the history's own
    // average credit and use it to project policy values.
    const avg = summarizeHistory(indexHistory(OPTION, 1994, 2025)).averageCreditedPct / 100;
    expect(avg).toBeGreaterThan(ENVELOPE.maximumIllustratedRate);
    expect(() => projectPolicyValues({ ...base, rate: avg })).toThrow(Ag49ViolationError);
  });

  it("refuses a rate derived by ratio from any reference figure", () => {
    // A scaled reference contract produces a number. It still has to pass here.
    const derived = ENVELOPE.maximumIllustratedRate * 8;
    expect(() => projectPolicyValues({ ...base, rate: derived })).toThrow(Ag49ViolationError);
  });

  it("names the cap and the reason in the error, so the refusal is self-explaining", () => {
    try {
      projectPolicyValues({ ...base, rate: 0.2 });
      throw new Error("should have thrown");
    } catch (e) {
      const msg = String(e);
      expect(msg).toContain("AG 49-A");
      expect(msg).toContain("may not be used to project policy values");
      expect(msg).toContain("derivation");
    }
  });

  it("allows the guaranteed floor, which is below the cap", () => {
    expect(() => projectPolicyValues({ ...base, rate: 0 })).not.toThrow();
  });

  it("rejects a nonsensical rate rather than producing numbers", () => {
    expect(() => projectPolicyValues({ ...base, rate: -0.01 })).toThrow(RangeError);
    expect(() => projectPolicyValues({ ...base, rate: Number.NaN })).toThrow(RangeError);
  });
});

describe("three-panel presentation", () => {
  const panel = buildThreePanel({
    optionId: OPTION.id, startYear: 1994, endYear: 2025,
    annualPremium: 100_000, premiumYears: 7, projectionYears: 30,
    issueAge: 45, envelope: ENVELOPE,
  });

  it("illustrates exactly one panel, at the cap", () => {
    expect(panel.illustrated.rate).toBe(ENVELOPE.maximumIllustratedRate);
    expect(panel.illustrated.label).toContain("the only panel that projects policy values");
  });

  it("shows the full history, including years above the cap, as history", () => {
    const above = panel.history.rows.filter(
      (r) => r.creditedPct / 100 > ENVELOPE.maximumIllustratedRate,
    );
    expect(above.length).toBeGreaterThan(0);
    expect(panel.history.label).toContain("NOT a projection of your policy");
    expect(panel.history.label).toContain("no value in your illustration is derived from it");
  });

  it("shows the guaranteed floor", () => {
    expect(panel.guaranteed.rate).toBe(0);
    expect(panel.guaranteed.label).toContain("if the index never credits again");
  });

  it("carries the required disclosures", () => {
    expect(panel.disclosures.length).toBeGreaterThan(3);
    expect(panel.disclosures.join(" ")).toContain("does not predict future results");
  });

  it("refuses an unknown index option rather than defaulting", () => {
    expect(() => buildThreePanel({
      optionId: "no-such-option", startYear: 1994, endYear: 2025,
      annualPremium: 1, premiumYears: 1, projectionYears: 1,
      issueAge: 45, envelope: ENVELOPE,
    })).toThrow(/Unknown index option/);
  });
});

describe("never-printed list", () => {
  it("forbids a projection at a derived rate, however it was arrived at", () => {
    const first = PRESENTATION_RULES.neverPrinted[0];
    expect(first).toContain("ratio, scaling, or derivation from a reference contract");
  });

  it("forbids telling a client the presentation may not be recorded or kept", () => {
    expect(PRESENTATION_RULES.neverPrinted.join(" ")).toContain("may not be recorded, kept");
  });
});

describe("alternate-age back-test — real years, paired with the buyer's reality", () => {
  const base = {
    optionId: OPTION.id,
    hypotheticalIssueAge: 45,
    buyerAge: 75,
    startYear: 1995,
    years: 30,
    annualPremium: 100_000,
    premiumYears: 7,
    specifiedAmount: 1_000_000,
  };

  it("runs the actual index years — nothing scaled, mapped or derived", () => {
    const r = alternateAgeBacktest(base);
    expect(r.hypothetical.rows.length).toBeGreaterThan(25);
    // 2008 is in the window and must appear at its real index return.
    const y2008 = r.hypothetical.rows.find((x) => x.calendarYear === 2008)!;
    expect(y2008.indexReturnPct).toBeCloseTo(-44.76, 1);
    // The floor caught it.
    expect(y2008.creditedPct).toBeGreaterThanOrEqual(0);
  });

  it("ages the insured year by year and charges the real COI for each attained age", () => {
    const r = alternateAgeBacktest(base);
    expect(r.hypothetical.rows[0].attainedAge).toBe(45);
    expect(r.hypothetical.rows[9].attainedAge).toBe(54);
    expect(r.buyer.rows[0].attainedAge).toBe(75);
    expect(r.hypothetical.totalCoiCharged).toBeGreaterThan(0);
  });

  it("REFUSES to produce the younger run without the buyer's own figures", () => {
    // The guard: the two runs travel together or neither exists.
    expect(() => alternateAgeBacktest({ ...base, buyerAge: 0 })).toThrow(UnpairedBacktestError);
    expect(() => alternateAgeBacktest({ ...base, buyerAge: Number.NaN })).toThrow(UnpairedBacktestError);
  });

  it("always returns both runs over the identical calendar years and premiums", () => {
    const r = alternateAgeBacktest(base);
    expect(r.buyer.rows).toHaveLength(r.hypothetical.rows.length);
    expect(r.buyer.totalPremiumPaid).toBe(r.hypothetical.totalPremiumPaid);
    expect(r.buyer.rows[0].calendarYear).toBe(r.hypothetical.rows[0].calendarYear);
    // Same index years, so the credits are identical. Only cost differs.
    expect(r.buyer.rows[5].creditedPct).toBe(r.hypothetical.rows[5].creditedPct);
  });

  it("the buyer pays materially more cost and ends materially lower", () => {
    const r = alternateAgeBacktest(base);
    expect(r.buyer.totalCoiCharged).toBeGreaterThan(r.hypothetical.totalCoiCharged);
    expect(r.buyer.finalAccountValue).toBeLessThan(r.hypothetical.finalAccountValue);
    expect(r.ageGap.extraCoiPaid).toBeGreaterThan(0);
    expect(r.ageGap.endingValueDifference).toBeGreaterThan(0);
  });

  it("quantifies the age gap instead of gesturing at it", () => {
    const r = alternateAgeBacktest(base);
    expect(r.ageGap.years).toBe(30);
    // 0.0100 at 75 vs 0.0012 at 45.
    expect(r.ageGap.coiMultipleAtIssue).toBeCloseTo(8.3, 1);
    expect(r.ageGap.plain).toContain("what waiting costs");
    expect(r.ageGap.plain).toContain("The only");
  });

  it("handles a buyer younger than the hypothetical without inventing a gap", () => {
    const r = alternateAgeBacktest({ ...base, buyerAge: 40 });
    expect(r.ageGap.years).toBeLessThan(0);
    expect(r.ageGap.plain).toContain("no age gap applies");
  });

  it("carries the two disclosures that make an alternate-age run honest", () => {
    const r = alternateAgeBacktest(base);
    const joined = r.disclosures.join(" ");
    expect(joined).toContain("is not the buyer");
    expect(joined).toContain("were not available during the historical period");
    expect(joined).toContain("HYPOTHETICAL back-test, not an illustration");
  });

  it("states that no illustrated value derives from the back-test", () => {
    expect(BACKTEST_DISCLOSURES.join(" ")).toContain("no value in the buyer");
  });

  it("still cannot feed its result into a policy projection above the cap", () => {
    const r = alternateAgeBacktest(base);
    const yrs = r.hypothetical.rows.length;
    const impliedAnnual =
      Math.pow(r.hypothetical.finalAccountValue / r.hypothetical.totalPremiumPaid, 1 / yrs) - 1;
    if (impliedAnnual > ENVELOPE.maximumIllustratedRate) {
      expect(() =>
        projectPolicyValues({
          annualPremium: 100_000, premiumYears: 7, projectionYears: 30,
          issueAge: 75, envelope: ENVELOPE, rate: impliedAnnual,
        }),
      ).toThrow(Ag49ViolationError);
    }
  });

  it("refuses an unknown option rather than defaulting", () => {
    expect(() => alternateAgeBacktest({ ...base, optionId: "nope" })).toThrow(/Unknown index option/);
  });
});

describe("COI curve — the reason the pairing exists", () => {
  it("rises steeply and non-linearly with age", () => {
    expect(coiRateForAge(45)).toBe(0.0012);
    expect(coiRateForAge(75)).toBe(0.0100);
    expect(coiRateForAge(75) / coiRateForAge(45)).toBeGreaterThan(8);
  });

  it("is monotonic through the working ages", () => {
    for (let a = 30; a < 85; a += 1) {
      expect(coiRateForAge(a + 1)).toBeGreaterThanOrEqual(coiRateForAge(a));
    }
  });
});

describe("archaeology — allocations over windows, as history not projection", () => {
  const common = {
    startYear: 1995, years: 30, issueAge: 45,
    annualPremium: 100_000, premiumYears: 7, specifiedAmount: 1_000_000,
  };
  const SP = [{ optionId: "am-sp500-ptp", percent: 100 }];

  it("runs one allocation on real index years", () => {
    const r = runAllocation({ ...common, allocation: SP });
    expect(r.rows.length).toBe(30);
    const y2000 = r.rows.find((x) => x.calendarYear === 2000)!;
    expect(y2000.perOption[0].indexReturnPct).toBeCloseTo(-9.26, 2);
    expect(y2000.blendedCreditedPct).toBe(0); // floor caught it
    expect(r.endingAccountValue).toBeGreaterThan(0);
  });

  it("blends a multi-option allocation by weight", () => {
    const blend = [
      { optionId: "am-sp500-ptp", percent: 50 },
      { optionId: "am-multi-index", percent: 50 },
    ];
    const r = runAllocation({ ...common, allocation: blend });
    const row = r.rows[0];
    expect(row.perOption).toHaveLength(2);
    const expected = row.perOption.reduce((s, p) => s + p.creditedPct * (p.percent / 100), 0);
    expect(row.blendedCreditedPct).toBeCloseTo(expected, 2);
  });

  it("rejects an allocation that does not total 100%", () => {
    expect(() => runAllocation({ ...common, allocation: [{ optionId: "am-sp500-ptp", percent: 60 }] }))
      .toThrow(/must total 100%/);
    expect(() => runAllocation({ ...common, allocation: [] }))
      .toThrow(/at least one option/);
  });

  it("rejects an unknown option rather than silently dropping it", () => {
    expect(() => runAllocation({ ...common, allocation: [{ optionId: "ghost", percent: 100 }] }))
      .toThrow(/Unknown index option/);
  });

  it("compares allocations without re-sorting them into an argument", () => {
    const runs = compareAllocations({
      ...common,
      allocations: [
        { label: "fixed", allocation: [{ optionId: "am-fixed", percent: 100 }] },
        { label: "capped", allocation: SP },
      ],
    });
    expect(runs.map((r) => r.label)).toEqual(["fixed", "capped"]);
    // The winner is second — the function must not have moved it.
    expect(runs[1].endingAccountValue).toBeGreaterThan(runs[0].endingAccountValue);
  });

  it("charges real COI and counts floor and cap years", () => {
    const r = runAllocation({ ...common, allocation: SP });
    expect(r.totalCoiCharged).toBeGreaterThan(0);
    expect(r.yearsFloorProtected).toBeGreaterThan(0);
    expect(r.yearsCapLimited).toBeGreaterThan(0);
    expect(r.worstIndexYear!.indexReturnPct).toBeLessThan(0);
  });
});

describe("rolling windows — the cherry-picking guard", () => {
  const params = {
    allocation: [{ optionId: "am-sp500-ptp", percent: 100 }],
    label: "100% S&P capped",
    windowLength: 20, issueAge: 45,
    annualPremium: 100_000, premiumYears: 7, specifiedAmount: 1_000_000,
  };

  it("computes EVERY available start year, never a filtered subset", () => {
    const d = rollingWindows(params);
    expect(d.windows.length).toBeGreaterThan(10);
    const starts = d.windows.map((w) => w.startYear);
    expect(starts).toEqual([...starts].sort((a, b) => a - b)); // chronological, not ranked
    expect(starts[0]).toBe(1994);
  });

  it("reports best, worst and median from the same set", () => {
    const d = rollingWindows(params);
    const values = d.windows.map((w) => w.endingAccountValue);
    expect(d.best.endingAccountValue).toBe(Math.max(...values));
    expect(d.worst.endingAccountValue).toBe(Math.min(...values));
    expect(values).toContain(d.median.endingAccountValue);
  });

  it("states the spread as sequence-of-returns risk in plain words", () => {
    const d = rollingWindows(params);
    expect(d.plain).toContain("only the start year differs");
    expect(d.plain).toContain("sequence-of-returns risk");
    expect(d.plain).toContain("a single window is not an answer");
  });

  it("the best case is reachable ONLY through the full distribution", () => {
    const d = rollingWindows(params);
    const b = bestWindow(d);
    expect(b.outcome).toEqual(d.best);
    // The signature is the guard: worst and median come back with it, always.
    expect(b.mustAlsoShow.worst).toEqual(d.worst);
    expect(b.mustAlsoShow.median).toEqual(d.median);
    expect(b.caution).toContain("misrepresents the record");
  });

  it("refuses a window longer than the history rather than truncating", () => {
    expect(() => rollingWindows({ ...params, windowLength: 60 }))
      .toThrow(/No complete 60-year window/);
  });

  it("shows the floor compressing the spread — the real product story", () => {
    const d = rollingWindows(params);
    const mult = d.windows.map((w) => w.multipleOfPremium);
    const spread = Math.max(...mult) / Math.min(...mult);
    // Cap-and-floor crediting narrows outcomes across start years. If this ever
    // widens dramatically the product's own argument has changed.
    expect(spread).toBeLessThan(2);
    expect(d.worst.yearsFloorProtected).toBeGreaterThan(0);
  });
});

describe("archaeology disclosures", () => {
  it("leads with the category line — history, not projection", () => {
    expect(ARCHAEOLOGY_DISCLOSURES[0]).toContain("already occurred");
    expect(ARCHAEOLOGY_DISCLOSURES[0]).toContain("not a projection");
  });

  it("warns that start year dominates", () => {
    expect(ARCHAEOLOGY_DISCLOSURES.join(" ")).toContain("vary substantially with start year");
  });
});
