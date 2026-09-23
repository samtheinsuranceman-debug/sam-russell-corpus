/**
 * Validation toolkit (A19): BH, stationary bootstrap, White's Reality Check,
 * Hansen's SPA, episode counting, the holdout gate, schema checks and the
 * headline. Offline. Every dataset below is a SYNTHETIC FIXTURE generated from
 * the seeded Mulberry32 PRNG, except the BH example, which is the published
 * one from Benjamini & Hochberg (1995), §4.
 */
import { describe, expect, it } from "vitest";
import {
  A,
  MACRO_ASSUMPTIONS,
  mulberry32,
  normal,
  benjaminiHochberg,
  stationaryBootstrap,
  stationaryBootstrapIndices,
  realityCheck,
  spaTest,
  meetsTHurdle,
  episodeCount,
  holdoutGate,
  validateFinding,
  fillBhQ,
  headline,
  totalTested,
  type Finding,
  type PreregistrationLog,
} from "@shared/macro";

/** SYNTHETIC FIXTURE: n × k loss differentials, N(mu_k, 1), seeded. */
function syntheticLossDiffs(n: number, k: number, seed: number, edge: { rule: number; mean: number } | null = null): number[][] {
  const rng = mulberry32(seed);
  const m: number[][] = [];
  for (let t = 0; t < n; t++) {
    const row: number[] = [];
    for (let j = 0; j < k; j++) row.push(normal(rng) + (edge && edge.rule === j ? edge.mean : 0));
    m.push(row);
  }
  return m;
}

describe("rules table", () => {
  it("every validation threshold is a sourced, dated row", () => {
    const expected: Record<string, number> = {
      "val.fdr.q": 0.10,
      "val.tStatMin": 3.0,
      "val.bootstrap.draws": 10_000,
      "val.bootstrap.meanBlockMonths": 12,
      "val.rc.alpha": 0.05,
      "val.spa.loglogFactor": 2,
      "val.spa.minBlocks": 20,
    };
    for (const [id, v] of Object.entries(expected)) {
      const row = MACRO_ASSUMPTIONS.get(id);
      expect(row, id).toBeDefined();
      expect(row!.value).toBe(v);
      expect(row!.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row!.source.length).toBeGreaterThan(10);
      expect(row!.basis.length).toBeGreaterThan(20);
    }
    expect(MACRO_ASSUMPTIONS.get("val.fdr.q")!.source).toMatch(/Benjamini & Hochberg \(1995\)/);
    expect(MACRO_ASSUMPTIONS.get("val.tStatMin")!.source).toMatch(/Harvey, Liu & Zhu \(2016\)/);
    expect(MACRO_ASSUMPTIONS.get("val.bootstrap.meanBlockMonths")!.source).toMatch(/Politis & Romano \(1994\)/);
    expect(MACRO_ASSUMPTIONS.get("val.spa.loglogFactor")!.source).toMatch(/Hansen \(2005\)/);
    expect(MACRO_ASSUMPTIONS.get("val.bootstrap.draws")!.source).toMatch(/White \(2000\)/);
  });
});

describe("Benjamini–Hochberg", () => {
  // Benjamini & Hochberg (1995), §4: fifteen p-values from a myocardial-infarction trial.
  const BH95 = [0.0001, 0.0004, 0.0019, 0.0095, 0.0201, 0.0278, 0.0298, 0.0344, 0.0459, 0.324, 0.4262, 0.5719, 0.6528, 0.759, 1.0];

  it("reproduces the textbook example: four discoveries at q = 0.05", () => {
    const r = benjaminiHochberg(BH95, 0.05);
    expect(r.discoveries).toBe(4);
    expect(r.pCutoff).toBe(0.0095);
    expect(r.rejected.slice(0, 4)).toEqual([true, true, true, true]);
    expect(r.rejected.slice(4).every(x => !x)).toBe(true);
    // Bonferroni would keep only three (0.05 / 15 = 0.00333).
    expect(BH95.filter(p => p <= 0.05 / 15).length).toBe(3);
  });

  it("gives the step-up adjusted q-values (p.adjust 'BH')", () => {
    const r = benjaminiHochberg(BH95, 0.05);
    expect(r.qValues[3]).toBeCloseTo(0.035625, 10); // 0.0095·15/4
    expect(r.qValues[2]).toBeCloseTo(0.0095, 10); // min(0.0019·15/3, later) = 0.0095
    expect(r.qValues[4]).toBeCloseTo(0.0603, 10); // 0.0201·15/5
    expect(r.qValues[5]).toBeCloseTo((0.0298 * 15) / 7, 10); // monotone: takes the later, smaller value
    expect(r.qValues[14]).toBe(1);
    // Rejected exactly when q-value ≤ q.
    r.qValues.forEach((qv, i) => expect(r.rejected[i]).toBe(qv <= 0.05));
  });

  it("is order-invariant and uses the rules-table q by default", () => {
    const shuffled = [...BH95].reverse();
    const r = benjaminiHochberg(shuffled);
    expect(r.q).toBe(A("val.fdr.q"));
    expect(r.rejected.filter(Boolean).length).toBe(benjaminiHochberg(BH95, 0.1).discoveries);
    expect(r.rejected[shuffled.indexOf(0.0001)]).toBe(true);
  });

  it("pads to the true number of tests: unreported tests are not free", () => {
    const reported = [0.0001, 0.0004, 0.002];
    expect(benjaminiHochberg(reported, 0.1).discoveries).toBe(3);
    const padded = benjaminiHochberg(reported, 0.1, { m: 10_000 });
    expect(padded.m).toBe(10_000);
    expect(padded.discoveries).toBe(0); // 0.0001 > 0.1/10,000
    expect(padded.qValues[0]).toBeCloseTo(1, 5);
  });

  it("refuses p-values outside [0,1]", () => {
    expect(() => benjaminiHochberg([0.1, 1.2])).toThrow();
    expect(() => benjaminiHochberg([0.1, NaN])).toThrow();
  });
});

describe("stationary bootstrap", () => {
  const series = Array.from({ length: 120 }, (_, i) => i); // SYNTHETIC FIXTURE: 0..119

  it("is deterministic under a seed and differs across seeds", () => {
    const a = stationaryBootstrap(series, 12, 50, 42);
    const b = stationaryBootstrap(series, 12, 50, 42);
    const c = stationaryBootstrap(series, 12, 50, 43);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a.length).toBe(50);
    for (const s of a) {
      expect(s.length).toBe(120);
      for (const v of s) expect(series).toContain(v);
    }
  });

  it("draws blocks whose mean length is close to meanBlock", () => {
    const rng = mulberry32(7);
    let breaks = 0, total = 0;
    for (let b = 0; b < 400; b++) {
      const idx = stationaryBootstrapIndices(240, 12, rng);
      for (let t = 1; t < idx.length; t++) { total++; if (idx[t] !== (idx[t - 1] + 1) % 240) breaks++; }
    }
    // A new block starts with probability 1/12 (minus the 1/n chance of landing on the next index).
    const meanBlock = total / breaks;
    expect(meanBlock).toBeGreaterThan(10.5);
    expect(meanBlock).toBeLessThan(13.8);
  });

  it("meanBlock = 1 is the i.i.d. bootstrap", () => {
    const idx = stationaryBootstrapIndices(1000, 1, mulberry32(1));
    let runs = 0;
    for (let t = 1; t < idx.length; t++) if (idx[t] === (idx[t - 1] + 1) % 1000) runs++;
    expect(runs).toBeLessThan(10);
  });
});

describe("White's Reality Check and Hansen's SPA", () => {
  const n = 240; // twenty years of months
  const k = 50; // fifty rules searched
  const draws = 1000;

  it("rejects when one rule has a real, planted edge", () => {
    const m = syntheticLossDiffs(n, k, 101, { rule: 17, mean: 0.4 });
    const rc = realityCheck(m, draws, 11);
    expect(rc.bestRule).toBe(17);
    expect(rc.pValue).toBeLessThan(0.01);
    expect(rc.reject).toBe(true);
    expect(rc.bestTStat).toBeGreaterThan(3);
    expect(rc.passesTHurdle).toBe(true);
    const spa = spaTest(m, draws, 11);
    expect(spa.bestRule).toBe(17);
    expect(spa.reject).toBe(true);
    expect(spa.pValues.lower).toBeLessThanOrEqual(spa.pValues.consistent);
    expect(spa.pValues.consistent).toBeLessThanOrEqual(spa.pValues.upper);
  });

  it("does not reject for pure noise, though the best of 50 noise rules looks good alone", () => {
    const m = syntheticLossDiffs(n, k, 202);
    const rc = realityCheck(m, draws, 11);
    const spa = spaTest(m, draws, 11);
    expect(rc.reject).toBe(false);
    expect(spa.reject).toBe(false);
    // The data-snooping trap: the best noise rule's naive t clears the classic 1.96 …
    expect(rc.bestTStat).toBeGreaterThan(1.96);
    // … but not the HLZ hurdle, and the search-adjusted p-value is large.
    expect(rc.passesTHurdle).toBe(false);
    expect(rc.pValue).toBeGreaterThan(0.2);
  });

  it("keeps its size across many noise datasets (short sample: SPA falls back on the Reality Check)", () => {
    let rcRejects = 0, spaRejects = 0;
    const trials = 20;
    for (let s = 0; s < trials; s++) {
      const m = syntheticLossDiffs(120, 30, 1000 + s);
      if (realityCheck(m, 400, s).reject) rcRejects++;
      const spa = spaTest(m, 400, s);
      expect(spa.smallSample).toBe(true);
      expect(spa.warnings.length).toBe(1);
      if (spa.reject) spaRejects++;
    }
    // At α = 0.05, expect about one rejection in twenty; four or more would signal a broken test.
    expect(rcRejects).toBeLessThanOrEqual(3);
    expect(spaRejects).toBeLessThanOrEqual(3);
  });

  it("keeps its size across many noise datasets (long sample: SPA on its own)", () => {
    let rcRejects = 0, spaRejects = 0;
    const trials = 20;
    for (let s = 0; s < trials; s++) {
      const m = syntheticLossDiffs(480, 30, 7000 + s);
      if (realityCheck(m, 400, s).reject) rcRejects++;
      const spa = spaTest(m, 400, s);
      expect(spa.smallSample).toBe(false);
      if (spa.reject) spaRejects++;
    }
    expect(rcRejects).toBeLessThanOrEqual(3);
    expect(spaRejects).toBeLessThanOrEqual(3);
  });

  it("SPA keeps power when junk rules are added; the Reality Check loses it", () => {
    // SYNTHETIC FIXTURE: a modest edge in rule 0 plus 199 clearly worse rules.
    const rng = mulberry32(303);
    const m: number[][] = [];
    for (let t = 0; t < 240; t++) {
      const row = [normal(rng) * 1 + 0.2];
      for (let j = 1; j < 200; j++) row.push(normal(rng) * 3 - 1.5);
      m.push(row);
    }
    const rc = realityCheck(m, 1000, 5);
    const spa = spaTest(m, 1000, 5);
    expect(spa.bestRule).toBe(0);
    expect(spa.pValues.consistent).toBeLessThan(rc.pValue);
    expect(spa.reject).toBe(true);
  });

  it("is deterministic under a seed", () => {
    const m = syntheticLossDiffs(60, 5, 9);
    expect(realityCheck(m, 200, 3)).toEqual(realityCheck(m, 200, 3));
    expect(spaTest(m, 200, 3)).toEqual(spaTest(m, 200, 3));
  });

  it("refuses ragged or non-finite matrices", () => {
    expect(() => realityCheck([[1, 2], [3]], 10, 1)).toThrow();
    expect(() => spaTest([[1], [NaN]], 10, 1)).toThrow();
  });

  it("HLZ hurdle is t ≥ 3.0", () => {
    expect(meetsTHurdle(2.99)).toBe(false);
    expect(meetsTHurdle(3.0)).toBe(true);
    expect(meetsTHurdle(-3.2)).toBe(true);
    expect(meetsTHurdle(NaN)).toBe(false);
  });
});

describe("episode counting", () => {
  // SYNTHETIC FIXTURE: two bear markets.
  const bears = [
    { id: "bear-A", start: "2000-03", end: "2002-10" },
    { id: "bear-B", start: "2007-10", end: "2009-03" },
  ];

  it("twelve firing months inside one bear are one episode", () => {
    const months = Array.from({ length: 12 }, (_, i) => `2001-${String(i + 1).padStart(2, "0")}`);
    const r = episodeCount(months, bears);
    expect(r.episodes).toBe(1);
    expect(r.episodeIds).toEqual(["bear-A"]);
    expect(r.firingMonths).toBe(12);
    expect(r.byEpisode["bear-A"].length).toBe(12);
  });

  it("months across two bears count two; outside months count none; duplicates collapse", () => {
    const r = episodeCount(["2001-05", "2001-05-31", "2008-01", "2008-02", "2005-06"], bears);
    expect(r.episodes).toBe(2);
    expect(r.firingMonths).toBe(4);
    expect(r.monthsOutside).toEqual(["2005-06"]);
  });

  it("a lead window credits the bear a month precedes, and never credits one month twice", () => {
    // 2006-01 is 21 months before bear-B; with a 24-month lead it precedes it.
    expect(episodeCount(["2006-01"], bears).episodes).toBe(0);
    expect(episodeCount(["2006-01"], bears, { leadMonths: 24 }).episodeIds).toEqual(["bear-B"]);
    // Overlapping windows: 2002-06 sits inside bear-A and (with a long lead) before bear-B.
    const r = episodeCount(["2002-06"], bears, { leadMonths: 72 });
    expect(r.episodes).toBe(1);
    expect(r.episodeIds).toEqual(["bear-B"]);
  });

  it("refuses malformed dates", () => {
    expect(() => episodeCount(["June 2001"], bears)).toThrow();
  });
});

describe("holdout gate", () => {
  const finding = { id: "A11-combo-0007", preRegisteredAt: "2026-09-24T10:00:00Z", holdoutPassed: true };
  const log = (evals: PreregistrationLog["holdoutEvaluations"], extra: PreregistrationLog["entries"] = []): PreregistrationLog => ({
    entries: [
      { id: "A11-combo", scope: "family", registeredAt: "2026-09-24T09:00:00Z" },
      { id: "A11-combo-0007", registeredAt: "2026-09-24T10:00:00Z" },
      ...extra,
    ],
    holdoutEvaluations: evals,
  });

  it("passes when every holdout was touched after registration", () => {
    const r = holdoutGate(finding, log([{ id: "A11-combo-0007", era: "E4", evaluatedAt: "2026-09-25T08:00:00Z" }, { id: "A11-combo-0007", era: "E3", evaluatedAt: "2026-09-25T08:05:00Z" }]), { requireEras: ["E3", "E4"] });
    expect(r.reasons).toEqual([]);
    expect(r.passed).toBe(true);
    expect(r.registeredAt).toBe("2026-09-24T09:00:00Z"); // family line came first
  });

  it("rejects a finding whose holdout was evaluated before pre-registration", () => {
    const r = holdoutGate({ id: "A12-cluster-0001", preRegisteredAt: "2026-09-24T12:00:00Z" }, {
      entries: [{ id: "A12-cluster-0001", registeredAt: "2026-09-24T12:00:00Z" }],
      holdoutEvaluations: [{ id: "A12-cluster-0001", era: "E3", evaluatedAt: "2026-09-24T11:59:00Z" }],
    });
    expect(r.passed).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/spoiled/);
  });

  it("rejects a holdout evaluated at the same instant, and one recorded on the row itself", () => {
    const same = holdoutGate({ id: "X-1", preRegisteredAt: "2026-09-24T12:00:00Z" }, { entries: [{ id: "X-1", registeredAt: "2026-09-24T12:00:00Z" }], holdoutEvaluations: [{ id: "X-1", evaluatedAt: "2026-09-24T12:00:00Z" }] });
    expect(same.passed).toBe(false);
    const onRow = holdoutGate({ id: "X-1", preRegisteredAt: "2026-09-24T12:00:00Z", holdoutEvaluatedAt: "2026-09-20T00:00:00Z" }, { entries: [{ id: "X-1", registeredAt: "2026-09-24T12:00:00Z" }] });
    expect(onRow.passed).toBe(false);
  });

  it("family-level evaluations count against every member", () => {
    const r = holdoutGate(finding, log([{ id: "A11-combo", era: "E4", evaluatedAt: "2026-09-24T08:00:00Z" }]));
    expect(r.passed).toBe(false);
  });

  it("rejects unregistered, back-dated, unevidenced and non-append-only cases", () => {
    expect(holdoutGate({ id: "A13-seq-0001", preRegisteredAt: "2026-09-24T10:00:00Z" }, log([])).reasons.join(" ")).toMatch(/not in the pre-registration log/);
    const backdated = holdoutGate({ id: "Y-1", preRegisteredAt: "2026-09-01T00:00:00Z" }, { entries: [{ id: "Y-1", registeredAt: "2026-09-24T00:00:00Z" }] });
    expect(backdated.reasons.join(" ")).toMatch(/before its log line/);
    expect(holdoutGate(finding, log([])).reasons.join(" ")).toMatch(/no holdout evaluation is on record/);
    const tampered = holdoutGate(finding, log([{ id: "A11-combo-0007", evaluatedAt: "2026-09-25T00:00:00Z" }], [{ id: "late-insert", registeredAt: "2026-09-01T00:00:00Z" }]));
    expect(tampered.reasons.join(" ")).toMatch(/append-only/);
    expect(holdoutGate(finding, log([{ id: "A11-combo-0007", era: "E4", evaluatedAt: "2026-09-25T00:00:00Z" }]), { requireEras: ["E1"] }).passed).toBe(false);
  });
});

describe("findings: schema, bhQ and the headline", () => {
  // SYNTHETIC FIXTURE rows; no real study result.
  const good: Finding = {
    id: "A11-combo-0007", agent: "A11", model: "anthropic", kind: "combination",
    members: ["rt-term-spread:down", "m2-growth:down"], target: "bear-start", horizonMonths: 12,
    preRegisteredAt: "2026-09-24T10:00:00Z", episodes: 9,
    eraSupport: { E5: { preceded: 4, inEra: 6, lift: 2.1 }, E4: { preceded: 3, inEra: 5, lift: 1.9 }, E1: null },
    effect: { lift: 2.0, lo: 1.4, hi: 2.8 }, tested: 5000, pValue: 0.000001, bhQ: 0.01,
    holdoutPassed: true, breakYear: null, reproducedBy: "A20/openai", redTeam: "survives", status: "finding",
    reasoning: "synthetic", sources: ["fixture"],
  };

  it("accepts a complete row", () => {
    const v = validateFinding(good);
    expect(v.errors).toEqual([]);
    expect(v.valid).toBe(true);
    expect(v.recommendedStatus).toBe("finding");
  });

  it("names missing fields, bad enums, bad types and bad dates", () => {
    const { tested: _t, ...noTested } = good;
    expect(validateFinding(noTested).errors).toContain("missing required field: tested");
    expect(validateFinding({ ...good, kind: "vibes" }).valid).toBe(false);
    expect(validateFinding({ ...good, horizonMonths: 1.5 }).errors).toContain("horizonMonths must be an integer");
    expect(validateFinding({ ...good, preRegisteredAt: "yesterday" }).valid).toBe(false);
    expect(validateFinding({ ...good, pValue: 1.3 }).valid).toBe(false);
    expect(validateFinding({ ...good, effect: { lift: 2, lo: 3, hi: 1 } }).valid).toBe(false);
    expect(validateFinding("not an object").valid).toBe(false);
  });

  it("refuses model families not on the allow-list", () => {
    expect(validateFinding({ ...good, model: "acme" }).valid).toBe(false);
    expect(validateFinding({ ...good, model: "Google" }).valid).toBe(true);
  });

  it("a 'finding' missing §6 elements is a lead; one that failed a guard is rejected", () => {
    expect(validateFinding({ ...good, reproducedBy: null }).recommendedStatus).toBe("lead");
    expect(validateFinding({ ...good, effect: { lift: 2 } }).recommendedStatus).toBe("lead");
    expect(validateFinding({ ...good, bhQ: 0.3 }).recommendedStatus).toBe("rejected");
    expect(validateFinding({ ...good, holdoutPassed: false }).recommendedStatus).toBe("rejected");
    expect(validateFinding({ ...good, status: "lead", reproducedBy: null }).recommendedStatus).toBe("lead");
  });

  it("fills bhQ across all findings, padded to the total tested, and writes the headline", () => {
    const rows: Finding[] = [
      good,
      { ...good, id: "A11-combo-0008", pValue: 0.2, bhQ: undefined, status: "rejected" },
      { ...good, id: "A12-cluster-0001", agent: "A12", kind: "cluster", tested: 1_195_000, pValue: 0.00001, bhQ: undefined },
    ];
    expect(totalTested(rows)).toEqual({ total: 1_200_000, families: 2 });
    const { findings, bh } = fillBhQ(rows);
    expect(bh.m).toBe(1_200_000);
    // Smallest p = 1e-6: m·p/1 = 1.2, capped at 1. A p-value of one in a million is not a discovery among 1.2 million tests.
    expect(findings.map(f => f.bhQ)).toEqual([1, 1, 1]);
    expect(bh.discoveries).toBe(0);
    expect(rows[0].bhQ).toBe(0.01); // input untouched
    // Once padded to 1.2 million tests, neither "finding" survives.
    const h = headline(findings);
    expect(h.tested).toBe(1_200_000);
    expect(h.survived).toBe(0);
    expect(h.text).toBe("tested 1,200,000, survived 0");
    // With the original small family and a genuine p-value, the complete row survives.
    const h2 = headline([good, { ...good, id: "A11-combo-0009", status: "rejected" }]);
    expect(h2.text).toBe("tested 5,000, survived 1");
    expect(h2.survivors).toEqual(["A11-combo-0007"]);
  });
});
