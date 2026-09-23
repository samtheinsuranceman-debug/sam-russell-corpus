/**
 * The sequence engine (A13, Q4): episodes, PrefixSpan with episode support,
 * Kendall's W with ties, the typical sequence, precision against non-bear
 * windows, and the domino extension. Offline.
 *
 * ALL FIXTURES HERE ARE SYNTHETIC. Indicator ids "A", "B", "C", "N", "D",
 * "X" and peaks "SYN-1" … "SYN-5" are invented to plant known orders; no
 * number in this file is a market observation.
 */
import { describe, expect, it } from "vitest";
import {
  A,
  MACRO_ASSUMPTIONS,
  episodeSequences,
  nonBearWindows,
  prefixSpan,
  kendallW,
  averageRanks,
  orderConsistency,
  typicalSequence,
  sequencePrecision,
  sequenceDominoes,
  mergeDominoes,
  dominoChains,
  embed,
  sequenceEraOf,
  sequenceMonthIndex,
  monthLabel,
  fisherOneSided,
  chiSquareSurvival,
  sequenceWilsonLower,
  type SequenceStateEvent,
  type BearPeak,
  type PairFinding,
} from "@shared/macro";

// ─── SYNTHETIC fixture ─────────────────────────────────────────────────────
const peaks: BearPeak[] = [
  { id: "SYN-1", peak: "1995-06" },
  { id: "SYN-2", peak: "2001-06" },
  { id: "SYN-3", peak: "2007-06" },
  { id: "SYN-4", peak: "2013-06" },
  { id: "SYN-5", peak: "2019-06" },
];
const at = (peak: string, monthsBefore: number) => monthLabel(sequenceMonthIndex(peak) - monthsBefore);
const ev = (month: string, indicator: string, to: string, from = "flat"): SequenceStateEvent => ({ month, indicator, from, to });

function syntheticEvents(): SequenceStateEvent[] {
  const out: SequenceStateEvent[] = [];
  peaks.forEach((p, k) => {
    if (k < 4) {
      // Planted order A:up → B:down → C:up in SYN-1 … SYN-4.
      out.push(ev(at(p.peak, 30), "A", "up"), ev(at(p.peak, 20), "B", "down"), ev(at(p.peak, 10), "C", "up"));
    } else {
      // SYN-5: the reverse order.
      out.push(ev(at(p.peak, 30), "C", "up"), ev(at(p.peak, 20), "B", "down"), ev(at(p.peak, 10), "A", "up"));
    }
    // Ubiquitous noise: N:up in every bear window …
    out.push(ev(at(p.peak, 15), "N", "up"));
  });
  // SYN-2: A:up repeats three more times (support must still count SYN-2 once).
  out.push(ev(at("2001-06", 31), "A", "up", "down"), ev(at("2001-06", 29), "A", "up", "down"), ev(at("2001-06", 5), "A", "up", "down"));
  // SYN-3: X:up in the same month as B:down (simultaneous, never ordered).
  out.push(ev(at("2007-06", 20), "X", "up"));
  // Outside every window: … and N:up and D:down in the quiet years (control windows).
  for (const m of ["1996-09", "1998-03", "2002-09", "2004-03", "2008-09", "2010-03", "2014-09", "2016-03"]) out.push(ev(m, "N", "up"), ev(monthLabel(sequenceMonthIndex(m) + 2), "D", "down"));
  // Changes at the window edges: peak−36 is in, peak−37 and the peak month are out.
  out.push(ev(at("1995-06", 36), "E", "up"), ev(at("1995-06", 37), "F", "up"), ev("1995-06", "G", "up"));
  return out;
}

const ABC = ["A:up", "B:down", "C:up"];

describe("episodeSequences", () => {
  const eps = episodeSequences(syntheticEvents(), peaks);

  it("cuts peak−36 … peak−1, excludes the peak month, and orders by month", () => {
    expect(A("seq.lookbackMonths")).toBe(36);
    const e1 = eps[0];
    expect(e1.id).toBe("SYN-1");
    expect(e1.windowStart).toBe(at("1995-06", 36));
    expect(e1.windowEnd).toBe(at("1995-06", 1));
    const items = e1.events.map(e => e.item);
    expect(items).toContain("E:up");
    expect(items).not.toContain("F:up");
    expect(items).not.toContain("G:up");
    expect(items).toEqual(["E:up", "A:up", "B:down", "N:up", "C:up"]);
    expect(e1.events.map(e => e.monthsBeforePeak)).toEqual([36, 30, 20, 15, 10]);
  });

  it("accepts A10's events.csv rows (with kind) and keeps kind on the event", () => {
    const a10 = [{ month: "1994-01", indicator: "syn-lvl", kind: "level", from: "normal", to: "extreme-high" }];
    const e = episodeSequences(a10, [{ id: "SYN-1", peak: "1995-06" }])[0];
    expect(e.events[0].item).toBe("syn-lvl:extreme-high");
    expect(e.events[0].kind).toBe("level");
  });

  it("puts same-month changes in one itemset", () => {
    const e3 = eps.find(e => e.id === "SYN-3")!;
    expect(e3.itemsets).toContainEqual(["B:down", "X:up"]);
  });

  it("labels eras from the peak year and clips at a previous trough", () => {
    expect(eps.map(e => e.era)).toEqual(["E5", "E5", "E5", "E5", "E5"]);
    expect(sequenceEraOf("1929-09")).toBe("E2");
    expect(sequenceEraOf("1973-01")).toBe("E4");
    expect(sequenceEraOf("1888-01")).toBe("E1");
    const clipped = episodeSequences(syntheticEvents(), [{ id: "SYN-2c", peak: "2001-06", previousTrough: at("2001-06", 25) }]);
    expect(clipped[0].windowStart).toBe(at("2001-06", 24));
    expect(clipped[0].events.some(e => e.monthsBeforePeak > 24)).toBe(false);
  });
});

describe("prefixSpan: support in episodes, not months", () => {
  const eps = episodeSequences(syntheticEvents(), peaks);

  it("finds the planted A → B → C in 4 of 5 episodes with support 4", () => {
    const pats = prefixSpan(eps, 3, 5);
    const abc = pats.find(p => p.items.join(">") === ABC.join(">"));
    expect(abc).toBeDefined();
    expect(abc!.support).toBe(4);
    expect(abc!.episodes).toEqual(["SYN-1", "SYN-2", "SYN-3", "SYN-4"]);
    expect(abc!.supportShare).toBe(0.8);
    expect(abc!.medianLags).toEqual([10, 10]);
    expect(abc!.eras).toEqual({ E5: 4 });
    // The reversed order is only in SYN-5: below minimum support.
    expect(pats.find(p => p.items.join(">") === "C:up>B:down>A:up")).toBeUndefined();
  });

  it("counts an episode once even when the event repeats inside it", () => {
    const pats = prefixSpan(eps, 1, 2);
    const aOnly = pats.find(p => p.items.length === 1 && p.items[0] === "A:up")!;
    expect(aOnly.support).toBe(5); // 5 episodes, 8 A:up events
    const aa = pats.find(p => p.items.join(">") === "A:up>A:up")!;
    expect(aa.support).toBe(1); // only SYN-2 has A:up more than once: four times, one episode
    expect(aa.episodes).toEqual(["SYN-2"]);
  });

  it("never orders two changes from the same month", () => {
    const pats = prefixSpan(eps, 1, 2);
    expect(pats.find(p => p.items.join(">") === "B:down>X:up")).toBeUndefined();
    expect(pats.find(p => p.items.join(">") === "X:up>B:down")).toBeUndefined();
  });

  it("respects maxLength, closedOnly, and is deterministic under input order", () => {
    const pats = prefixSpan(eps, 3, 2);
    expect(Math.max(...pats.map(p => p.items.length))).toBe(2);
    const closed = prefixSpan(eps, 3, 5, { closedOnly: true });
    // The ubiquitous N:up (month −15) sits between B and C, so A→B→N→C has the same support 4
    // and absorbs A→B, A→B→C, … in the closed output.
    expect(closed.find(p => p.items.join(">") === "A:up>B:down")).toBeUndefined();
    expect(closed.find(p => p.items.join(">") === ABC.join(">"))).toBeUndefined();
    expect(closed.find(p => p.items.join(">") === "A:up>B:down>N:up>C:up")!.support).toBe(4);
    const shuffled = episodeSequences([...syntheticEvents()].reverse(), [...peaks].reverse());
    expect(JSON.stringify(prefixSpan(shuffled))).toBe(JSON.stringify(prefixSpan(eps)));
  });

  it("embed returns the leftmost strictly-increasing embedding", () => {
    const seq = { itemsets: [["a"], ["b", "c"], ["a"], ["c"]] };
    expect(embed(seq, ["a", "c"])).toEqual([0, 1]);
    expect(embed(seq, ["b", "c"])).toEqual([1, 3]);
    expect(embed(seq, ["c", "b"])).toBeNull();
  });
});

describe("kendallW (Kendall & Babington Smith 1939)", () => {
  it("is 1 for identical rankings", () => {
    const r = [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]];
    const w = kendallW(r);
    expect(w.W).toBe(1);
    expect(w.pValue!).toBeLessThan(0.05);
  });

  it("is low (0) when half the raters reverse the other half", () => {
    const up = [1, 2, 3, 4, 5], down = [5, 4, 3, 2, 1];
    const w = kendallW([up, up, down, down]);
    expect(w.W).toBe(0);
    expect(w.pValue!).toBeGreaterThan(0.9);
  });

  it("matches a hand-computed value", () => {
    // R = [4, 6, 8, 12], mean 7.5, S = 35, W = 12·35 / (9·60) = 0.778.
    const w = kendallW([[1, 2, 3, 4], [2, 1, 3, 4], [1, 3, 2, 4]]);
    expect(w.S).toBe(35);
    expect(w.W).toBe(0.778);
    expect(w.chiSquare).toBe(7);
  });

  it("applies the tie correction", () => {
    // Identical tied rankings: uncorrected 72/96 = 0.75, corrected 72/72 = 1.
    const w = kendallW([[1, 1, 2], [1, 1, 2]]);
    expect(w.tieCorrection).toBe(12);
    expect(w.W).toBe(1);
    expect(averageRanks([10, 20, 20, 30]).ranks).toEqual([1, 2.5, 2.5, 4]);
  });

  it("drops or ties-last missing objects, and refuses degenerate input", () => {
    const withGap = [[1, 2, null], [1, 2, 3], [1, 2, 3]];
    const drop = kendallW(withGap);
    expect(drop.n).toBe(2);
    expect(drop.dropped).toEqual([2]);
    expect(drop.W).toBe(1);
    expect(kendallW(withGap, { missing: "tieLast" }).n).toBe(3);
    expect(kendallW([[1, 2, 3]]).W).toBeNull();
    expect(() => kendallW([[1, 2], [1, 2, 3]])).toThrow();
  });

  it("orderConsistency ranks by first change: the planted order agrees strongly", () => {
    const eps = episodeSequences(syntheticEvents(), peaks);
    const w4 = orderConsistency(eps.slice(0, 4), ABC);
    expect(w4.W).toBe(1);
    const w5 = orderConsistency(eps, ABC);
    expect(w5.W!).toBeLessThan(1);
    expect(w5.W!).toBeGreaterThan(0.2);
  });
});

describe("typicalSequence", () => {
  it("orders by median rank with per-step frequency and eras", () => {
    const eps = episodeSequences(syntheticEvents(), peaks);
    const t = typicalSequence(eps);
    const order = t.steps.map(s => s.item);
    expect(order.indexOf("A:up")).toBeLessThan(order.indexOf("B:down"));
    expect(order.indexOf("B:down")).toBeLessThan(order.indexOf("C:up"));
    const a = t.steps.find(s => s.item === "A:up")!;
    expect(a.episodes).toBe(5);
    expect(a.frequency).toBe(1);
    expect(a.eras).toEqual({ E5: 5 });
    expect(t.steps.find(s => s.item === "B:down")!.medianMonthsBeforePeak).toBe(20);
    // Items in fewer than seq.minSupportEpisodes bears are not steps.
    expect(order).not.toContain("X:up");
    expect(order).not.toContain("E:up");
    expect(t.kendall.W).not.toBeNull();
    expect(t.reading).toMatch(/Typical order over 5 bears/);
  });
});

describe("sequencePrecision: a pattern that appears everywhere is not predictive", () => {
  const events = syntheticEvents();
  const bears = episodeSequences(events, peaks);
  const controls = nonBearWindows(events, peaks, { from: "1990-01", to: "2025-12" });

  it("control windows hold no peak inside or within the guard after", () => {
    expect(controls.length).toBeGreaterThan(0);
    const guard = A("seq.controlGuardMonths");
    for (const c of controls) {
      const start = sequenceMonthIndex(c.windowStart), end = sequenceMonthIndex(c.peak);
      for (const p of peaks) expect(sequenceMonthIndex(p.peak) < start || sequenceMonthIndex(p.peak) > end + guard, `${c.id} vs ${p.id}`).toBe(true);
    }
  });

  it("the planted order is predictive; the ubiquitous N:up is not", () => {
    const abc = sequencePrecision(ABC, bears, controls);
    expect(abc.bearHits).toBe(4);
    expect(abc.nonBearHits).toBe(0);
    expect(abc.predictive).toBe(true);
    expect(abc.lift!).toBeGreaterThan(A("combo.minLift"));
    const n = sequencePrecision(["N:up"], bears, controls);
    expect(n.bearHits).toBe(5);
    expect(n.nonBearRate!).toBeGreaterThan(0);
    expect(n.bearRate).toBe(1);
    const everywhere = sequencePrecision(["N:up"], bears, controls.filter(c => c.itemsets.flat().includes("N:up")));
    expect(everywhere.nonBearRate).toBe(1);
    expect(everywhere.lift!).toBeLessThan(A("combo.minLift"));
    expect(everywhere.predictive).toBe(false);
    expect(everywhere.reading).toMatch(/Not predictive/);
  });

  it("without controls a pattern is never called predictive", () => {
    const r = sequencePrecision(ABC, bears, []);
    expect(r.predictive).toBe(false);
    expect(r.lift).toBeNull();
    expect(r.reading).toMatch(/unknown/);
  });

  it("Fisher, χ² and Wilson helpers agree with known values", () => {
    expect(fisherOneSided(4, 0, 0, 4)).toBeCloseTo(1 / 70, 10);
    expect(chiSquareSurvival(3.841459, 1)).toBeCloseTo(0.05, 4);
    expect(chiSquareSurvival(5.991465, 2)).toBeCloseTo(0.05, 4);
    expect(sequenceWilsonLower(4, 5)).toBeGreaterThan(0.5);
    expect(sequenceWilsonLower(4, 5)).toBeLessThan(0.8);
  });
});

describe("dominoes: extending dominoChains", () => {
  it("turns patterns into DominoChain rows and merges them with lead-lag chains", () => {
    const eps = episodeSequences(syntheticEvents(), peaks);
    const controls = nonBearWindows(syntheticEvents(), peaks, { from: "1990-01", to: "2025-12" });
    const pats = prefixSpan(eps, 3, 5);
    const prec = new Map(pats.map(p => [p.items.join(">"), sequencePrecision(p.items, eps, controls)]));
    const seqChains = sequenceDominoes(pats, eps.length, prec);
    const abc = seqChains.find(c => c.path.join(">") === ABC.join(">"))!;
    expect(abc.lags).toEqual([10, 10]);
    expect(abc.totalLagMonths).toBe(20);
    expect(abc.strength).toBe(0.8);
    expect(abc.confidence).toBe(Math.round(100 * sequenceWilsonLower(4, 5)));
    expect(abc.reading).toMatch(/\[sequence, 4\/5 bears\]/);

    const f = (a: string, b: string, r: number, lag: number): PairFinding => ({ kind: "lead-lag", a, b, aName: a, bName: b, r, lag, n: 120, confidence: 60, grade: "C", low: r - 0.1, high: r + 0.1 } as PairFinding);
    const leadLag = dominoChains([f("x1", "x2", 0.9, 2), f("x2", "x3", 0.9, 3)], { minAbsR: 0.3 });
    const merged = mergeDominoes(leadLag, seqChains);
    expect(merged.some(c => c.path.join(">") === "x1>x2>x3")).toBe(true);
    expect(merged.some(c => c.path.join(">") === ABC.join(">"))).toBe(true);
    const pos = (k: string) => merged.findIndex(c => c.path.join(">") === k);
    expect(pos("x1>x2>x3")).toBeLessThan(pos(ABC.join(">"))); // |0.81| > 0.8
    for (let i = 1; i < merged.length; i++) expect(Math.abs(merged[i - 1].strength)).toBeGreaterThanOrEqual(Math.abs(merged[i].strength));
  });
});

describe("rules table rows", () => {
  it("every seq.* threshold is a cited row with an as-of date", () => {
    for (const id of ["seq.lookbackMonths", "seq.minSupportEpisodes", "seq.maxPatternLength", "seq.controlGuardMonths", "seq.wilsonZ", "seq.minKendallW"]) {
      const row = MACRO_ASSUMPTIONS.get(id);
      expect(row, id).toBeDefined();
      expect(row!.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(MACRO_ASSUMPTIONS.get("seq.minSupportEpisodes")!.source).toMatch(/Pei.*2001.*ICDE/);
    expect(MACRO_ASSUMPTIONS.get("seq.minKendallW")!.source).toMatch(/Kendall & Babington Smith \(1939\)/);
  });
});
