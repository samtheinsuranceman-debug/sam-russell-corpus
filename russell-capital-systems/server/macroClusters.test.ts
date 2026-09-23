/**
 * The cluster engine (Q2): correlation teams, the adjusted Rand index, DTW
 * shape teams, breadth, and team stability across eras.
 *
 * SYNTHETIC FIXTURES ONLY. Every series below is generated here from a seeded
 * mulberry32 stream (no Math.random, no network); none is market data and no
 * number here is a finding.
 */
import { describe, expect, it } from "vitest";
import {
  correlationMatrix,
  hierarchicalCluster,
  hierarchicalFromDistances,
  cutTree,
  adjustedRandIndex,
  dtwDistance,
  clusterByShape,
  peakWindows,
  clusterBreadth,
  breadthSeries,
  compareAcrossEras,
  mulberry32,
  normal,
  A,
  assumption,
  MACRO_ASSUMPTIONS,
  type Series,
  type StatePanel,
} from "@shared/macro";

const month = (i: number) => new Date(Date.UTC(1990, i + 1, 0)).toISOString().slice(0, 10);
const toSeries = (id: string, xs: Array<number | null>, offset = 0): Series => ({
  indicatorId: id,
  points: xs.flatMap((v, i) => (v === null ? [] : [{ asOf: month(i + offset), value: v }])),
});

/** SYNTHETIC: two planted teams driven by two independent factors, plus two loners. Levels are random walks. */
function plantedTeams(seed = 11, months = 240) {
  const rng = mulberry32(seed);
  const ids = ["g1a", "g1b", "g1c", "g1d", "g2a", "g2b", "g2c", "g2d", "lone1", "lone2"];
  const truth = [0, 0, 0, 0, 1, 1, 1, 1, 2, 3];
  // g1d loads negatively: it moves opposite, and 1 − |r| still puts it on the team.
  const load = [1, 0.8, 1.3, -1, 1, 1.1, 0.7, 1, 0, 0];
  const levels = ids.map(() => 0);
  const paths: number[][] = ids.map(() => []);
  for (let t = 0; t < months; t++) {
    const f1 = normal(rng);
    const f2 = normal(rng);
    ids.forEach((_, k) => {
      const factor = k < 4 ? f1 : k < 8 ? f2 : 0;
      levels[k] += load[k] * factor + 0.3 * normal(rng) + (k >= 8 ? normal(rng) : 0);
      paths[k].push(levels[k]);
    });
  }
  return { ids, truth, series: ids.map((id, k) => toSeries(id, paths[k])) };
}

describe("rules table", () => {
  it("every cluster threshold is a row with a source and an as-of date", () => {
    const ids = ["cluster.cutHeight", "cluster.minSize", "cluster.minPairMonths", "cluster.dtwWindow", "cluster.shapeWindowMonths", "cluster.shapeMonthsBefore", "cluster.shapeCutHeight", "cluster.teamHoldShare"];
    for (const id of ids) {
      expect(MACRO_ASSUMPTIONS.has(id), id).toBe(true);
      const row = assumption(id);
      expect(row.source.length, id).toBeGreaterThan(3);
      expect(row.asOf, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(A("cluster.shapeWindowMonths")).toBe(36);
  });
});

describe("correlationMatrix", () => {
  it("is pairwise complete, symmetric, and leaves r unknown below the minimum overlap", () => {
    const rng = mulberry32(3);
    const base = Array.from({ length: 60 }, () => normal(rng));
    const x = base.map(v => v);
    const y = base.map((v, i) => (i < 20 ? null : 2 * v + 1)); // 40 shared months: r = 1
    const z = base.map((v, i) => (i < 50 ? null : v)); // 10 shared months: unknown
    const m = correlationMatrix([toSeries("x", x), toSeries("y", y), toSeries("z", z)]);
    expect(m.ids).toEqual(["x", "y", "z"]);
    expect(m.n[0][1]).toBe(40);
    expect(m.r[0][1]).toBeCloseTo(1, 10);
    expect(m.r[1][0]).toBe(m.r[0][1]);
    expect(m.n[0][2]).toBe(10);
    expect(m.r[0][2]).toBeNull();
    expect(m.r[2][2]).toBe(1);
  });

  it("restricts to an era or phase with `include`, and correlates changes with transform 'change'", () => {
    const { series } = plantedTeams();
    const all = correlationMatrix(series, { transform: "change" });
    const firstHalf = correlationMatrix(series, { transform: "change", include: k => k < "2000-01" });
    expect(all.months.length).toBe(240);
    expect(firstHalf.months.every(k => k < "2000-01")).toBe(true);
    expect(firstHalf.months.length).toBe(120);
    // Levels of independent random walks correlate spuriously; changes do not.
    const ia = all.ids.indexOf("g1a");
    const ib = all.ids.indexOf("g1b");
    const ic = all.ids.indexOf("g2a");
    expect(all.r[ia][ib]!).toBeGreaterThan(0.8);
    expect(Math.abs(all.r[ia][ic]!)).toBeLessThan(0.25);
  });
});

describe("hierarchicalCluster", () => {
  it("recovers two planted co-moving groups (average and complete linkage), counting an opposite mover as a member", () => {
    const { ids, truth, series } = plantedTeams();
    const m = correlationMatrix(series, { transform: "change" });
    for (const linkage of ["average", "complete"] as const) {
      const d = hierarchicalCluster(m, linkage);
      expect(d.merges.length).toBe(ids.length - 1);
      expect(d.teams()).toEqual([
        ["g1a", "g1b", "g1c", "g1d"],
        ["g2a", "g2b", "g2c", "g2d"],
      ]);
      const labels = d.cutTree(A("cluster.cutHeight"));
      expect(adjustedRandIndex(labels, truth)).toBe(1);
    }
  });

  it("gives non-decreasing merge heights, is deterministic, and cuts at 0 and at the top as expected", () => {
    const { series } = plantedTeams();
    const m = correlationMatrix(series, { transform: "change" });
    const d1 = hierarchicalCluster(m, "average");
    const d2 = hierarchicalCluster(m, "average");
    expect(d2.merges).toEqual(d1.merges);
    for (let i = 1; i < d1.merges.length; i++) expect(d1.merges[i].height).toBeGreaterThanOrEqual(d1.merges[i - 1].height - 1e-12);
    expect(new Set(d1.cutTree(-1)).size).toBe(series.length);
    expect(new Set(d1.cutTree(1)).size).toBe(1);
    // A stored dendrogram (plain JSON) cuts the same way.
    const stored = JSON.parse(JSON.stringify({ ids: d1.ids, merges: d1.merges }));
    expect(cutTree(stored, 0.5)).toEqual(d1.cutTree(0.5));
  });

  it("uses average vs complete linkage as defined (Lance–Williams) on a hand-checked matrix", () => {
    // a–b 0.1, c 0.3 from a and 0.5 from b: average puts c at 0.4, complete at 0.5.
    const D = [
      [0, 0.1, 0.3],
      [0.1, 0, 0.5],
      [0.3, 0.5, 0],
    ];
    expect(hierarchicalFromDistances(["a", "b", "c"], D, "average").merges.map(x => x.height)).toEqual([0.1, 0.4]);
    expect(hierarchicalFromDistances(["a", "b", "c"], D, "complete").merges.map(x => x.height)).toEqual([0.1, 0.5]);
  });
});

describe("adjustedRandIndex", () => {
  it("is 1 for identical partitions, whatever the label names", () => {
    const a = [0, 0, 1, 1, 2, 2, 2];
    expect(adjustedRandIndex(a, a)).toBe(1);
    expect(adjustedRandIndex(a, ["x", "x", "y", "y", "z", "z", "z"])).toBe(1);
  });

  it("matches the hand-computed value on a small example", () => {
    // index 2, expected 18/15, max 4.5 → (2 − 1.2) / (4.5 − 1.2) = 0.2424…
    expect(adjustedRandIndex([0, 0, 0, 1, 1, 1], [0, 0, 1, 1, 2, 2])).toBeCloseTo(0.8 / 3.3, 12);
  });

  it("is ≈ 0 for a random-label benchmark (seeded, deterministic)", () => {
    const rng = mulberry32(20260923);
    const n = 5000;
    const a = Array.from({ length: n }, () => Math.floor(rng() * 4));
    const b = Array.from({ length: n }, () => Math.floor(rng() * 4));
    const ari = adjustedRandIndex(a, b);
    expect(Math.abs(ari)).toBeLessThan(0.01);
    // Same seed → same value.
    const rng2 = mulberry32(20260923);
    const a2 = Array.from({ length: n }, () => Math.floor(rng2() * 4));
    const b2 = Array.from({ length: n }, () => Math.floor(rng2() * 4));
    expect(adjustedRandIndex(a2, b2)).toBe(ari);
  });

  it("refuses labelings of different lengths", () => {
    expect(() => adjustedRandIndex([0, 1], [0])).toThrow(/differ in length/);
  });
});

describe("dtwDistance", () => {
  const wave = (shift: number) => Array.from({ length: 36 }, (_, t) => Math.sin((2 * Math.PI * (t - shift)) / 24));

  it("scores a shifted copy far closer than an unrelated series", () => {
    const rng = mulberry32(5);
    const unrelated = Array.from({ length: 36 }, () => normal(rng));
    const a = wave(0);
    const shifted = wave(3);
    const w = A("cluster.dtwWindow");
    expect(dtwDistance(a, a, w)).toBe(0);
    expect(dtwDistance(a, shifted, w)).toBeLessThan(dtwDistance(a, unrelated, w));
    expect(dtwDistance(a, shifted, w)).toBeLessThan(dtwDistance(a, shifted, 0)); // warping absorbs the lead
    expect(dtwDistance(a, shifted, w)).toBeCloseTo(dtwDistance(shifted, a, w), 12);
  });

  it("with a zero band equals the L1 distance, and the band caps how far a path may warp", () => {
    const a = [0, 1, 2, 3];
    const b = [1, 1, 1, 5];
    expect(dtwDistance(a, b, 0)).toBe(1 + 0 + 1 + 2);
    const spike = [0, 0, 5, 0, 0, 0, 0, 0, 0, 0];
    const late = [0, 0, 0, 0, 0, 0, 0, 5, 0, 0]; // the same spike five months later
    expect(dtwDistance(spike, late, 5)).toBe(0);
    expect(dtwDistance(spike, late, 2)).toBeGreaterThan(0);
  });
});

describe("clusterByShape and peakWindows", () => {
  /** SYNTHETIC: a hump-then-fall shape and a V shape, each copied with a lead, a scale and deterministic noise. */
  function shapes() {
    const rng = mulberry32(17);
    const L = 36;
    const hump = (lead: number, scale: number, level: number) => Array.from({ length: L }, (_, t) => level + scale * Math.exp(-(((t - 18 + lead) / 5) ** 2)) + 0.05 * normal(rng));
    const vee = (lead: number, scale: number, level: number) => Array.from({ length: L }, (_, t) => level + scale * Math.abs(t - 18 + lead) / 18 + 0.05 * normal(rng));
    return [
      { indicatorId: "h1", windows: [hump(0, 1, 0), hump(1, 1, 5)] },
      { indicatorId: "h2", windows: [hump(3, 4, 100), hump(-2, 2, 0)] },
      { indicatorId: "h3", windows: [hump(-3, 0.5, -7), null] }, // missing around the second peak
      { indicatorId: "v1", windows: [vee(0, 1, 0), vee(2, 1, 1)] },
      { indicatorId: "v2", windows: [vee(4, 3, 50), vee(-1, 2, 2)] },
      { indicatorId: "v3", windows: [vee(-2, 10, 0), vee(0, 1, 0)] },
    ];
  }

  it("groups indicators by shape despite leads, levels and scales", () => {
    const out = clusterByShape(shapes());
    expect(out.teams).toEqual([
      ["h1", "h2", "h3"],
      ["v1", "v2", "v3"],
    ]);
    expect(out.peaksCompared[0][2]).toBe(1); // h3 has only the first peak
    expect(out.peaksCompared[0][1]).toBe(2);
  });

  it("marks a pair with no shared complete window as unknown (Infinity), never merged below an infinite height", () => {
    const out = clusterByShape([
      { indicatorId: "a", windows: [[1, 2, 3], null] },
      { indicatorId: "b", windows: [null, [3, 2, 1]] },
    ]);
    expect(out.distances[0][1]).toBe(Infinity);
    expect(out.dendrogram.cutTree(1e9)).toEqual([0, 1]);
  });

  it("cuts 36-month windows centred on each peak, with null where the series has no data", () => {
    const xs = Array.from({ length: 120 }, (_, i) => i);
    const s = toSeries("idx", xs); // month(i) holds value i; month(0) = 1990-01
    const [w] = peakWindows([s], ["1995-01-31", "1990-06-30"]);
    expect(w.windows[0]!.length).toBe(36);
    expect(w.windows[0]![0]).toBe(60 - 18); // 1995-01 is index 60
    expect(w.windows[0]![18]).toBe(60);
    expect(w.windows[1]![0]).toBeNull(); // 1988-12: before the series starts
    expect(w.windows[1]![18]).toBe(5);
  });
});

describe("clusterBreadth", () => {
  const panel: StatePanel = {
    keys: ["2007-10", "2007-11"],
    states: new Map<string, Array<string | null>>([
      ["a", ["adverse", "adverse"]],
      ["b", ["adverse", "calm"]],
      ["c", ["calm", "calm"]],
      ["d", [null, "adverse"]],
    ]),
  };

  it("is the share of members with a known state that are adverse; unknowns are listed, not counted", () => {
    const b = clusterBreadth(["a", "b", "c", "d"], panel, "2007-10-31");
    expect(b.month).toBe("2007-10");
    expect(b.members).toBe(4);
    expect(b.known).toBe(3);
    expect(b.adverse).toBe(2);
    expect(b.breadth).toBeCloseTo(2 / 3, 12);
    expect(b.adverseMembers).toEqual(["a", "b"]);
    expect(b.unknownMembers).toEqual(["d"]);
  });

  it("takes a caller's adverse test, treats absent members and months as unknown, and runs as a series", () => {
    expect(clusterBreadth(["a", "b", "c"], panel, "2007-11", { isAdverse: s => s === "calm" }).breadth).toBeCloseTo(2 / 3, 12);
    expect(clusterBreadth(["a", "zz"], panel, "2007-11").unknownMembers).toEqual(["zz"]);
    const none = clusterBreadth(["a", "b"], panel, "1999-01");
    expect(none.breadth).toBeNull();
    expect(none.known).toBe(0);
    expect(breadthSeries(["a", "b", "c", "d"], panel).map(x => x.breadth)).toEqual([2 / 3, 2 / 4]);
  });
});

describe("compareAcrossEras", () => {
  it("finds a team that holds in every era where it existed, and one that breaks", () => {
    const out = compareAcrossEras({
      E5: { ids: ["a", "b", "c", "d", "e", "f", "g"], labels: [0, 0, 0, 1, 1, 1, 2] },
      E4: { ids: ["a", "b", "c", "d", "e", "f"], labels: [7, 7, 7, 3, 3, 3] },
      E3: { ids: ["a", "b", "c", "d", "e", "f"], labels: [1, 1, 1, 0, 2, 2] },
      E2: { ids: ["a", "b", "c", "x"], labels: [0, 0, 0, 1] },
      E1: { ids: ["a", "b"], labels: [0, 0] },
    });
    expect(out.pairwise.find(p => p.a === "E5" && p.b === "E4")!.ari).toBe(1);
    expect(out.pairwise.find(p => p.a === "E5" && p.b === "E4")!.common).toBe(6);
    expect(out.pairwise.find(p => p.a === "E5" && p.b === "E3")!.ari!).toBeLessThan(1);
    const abc = out.teams.find(t => t.key === "a|b|c")!;
    expect(abc.status).toBe("stable");
    expect(abc.holdsIn).toEqual(["E5", "E4", "E3", "E2"]);
    expect(abc.unknownIn).toEqual(["E1"]); // only two members existed
    expect(abc.foundIn).toEqual(["E5", "E4", "E3", "E2"]);
    const def = out.teams.find(t => t.key === "d|e|f")!;
    expect(def.status).toBe("era-bound");
    expect(def.breaksIn).toEqual(["E3"]);
    expect(def.cohesion.E3).toBeCloseTo(2 / 3, 12);
    expect(out.stableTeams.map(t => t.key)).toEqual(["a|b|c"]);
    expect(out.teams[0].key).toBe("a|b|c");
  });

  it("calls a team seen in one era only a single-era hypothesis, and ARI unknown when eras share < 2 indicators", () => {
    const out = compareAcrossEras({
      E5: { ids: ["p", "q", "r"], labels: [0, 0, 0] },
      E2: { ids: ["s"], labels: [0] },
    });
    expect(out.teams[0].status).toBe("single-era");
    expect(out.pairwise[0].ari).toBeNull();
  });

  it("runs end to end: planted teams found in two synthetic eras are stable", () => {
    const { series } = plantedTeams(29, 480);
    const eraOf = (k: string) => (k < "2010-01" ? "early" : "late");
    const flat: Record<string, { ids: string[]; labels: number[] }> = {};
    for (const era of ["late", "early"]) {
      const m = correlationMatrix(series, { transform: "change", include: k => eraOf(k) === era });
      const d = hierarchicalCluster(m, "average");
      flat[era] = { ids: d.ids, labels: d.cutTree(A("cluster.cutHeight")) };
    }
    const out = compareAcrossEras(flat);
    expect(out.pairwise[0].ari).toBe(1);
    expect(out.stableTeams.map(t => t.members)).toEqual([
      ["g1a", "g1b", "g1c", "g1d"],
      ["g2a", "g2b", "g2c", "g2d"],
    ]);
  });
});
