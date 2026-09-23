/**
 * Cluster engine (Q2) — which indicators move as a team, and does the team
 * survive from one era to the next.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Sam's words (23 Sep 2026): "groupings and clusters". The testable question
 * (04_THE_100_INDICATOR_REVERSE_TIME_STUDY.md §1 Q2 and §5): which indicators
 * move together in each phase of the cycle, and do the teams stay the same
 * across eras E1…E5?
 *
 * What this module does, all over stored monthly history:
 *
 *   1. `correlationMatrix(series)` — Pearson r between every pair of series on
 *      the aligned monthly grid (`alignMonthly` from emergentPatterns.ts),
 *      pairwise complete: each pair uses only the months both have. Pass
 *      `transform: "change"` to correlate month-on-month changes (the study's
 *      "monthly state changes"), and `include` to restrict to one era or one
 *      cycle phase. Fewer than `cluster.minPairMonths` shared months leaves r
 *      unknown (null), never guessed.
 *   2. `hierarchicalCluster(matrix, "average" | "complete")` — agglomerative
 *      clustering on distance 1 − |r| (a pair that moves exactly opposite is
 *      as much a team as a pair that moves together; the sign is kept in the
 *      matrix). Unknown r is distance 1. Returns the dendrogram and
 *      `cutTree(height)`; `teams()` cuts at `cluster.cutHeight` and keeps
 *      clusters of at least `cluster.minSize`.
 *   3. `adjustedRandIndex(a, b)` — Hubert & Arabie (1985) agreement between
 *      two partitions, 1 for identical, ≈ 0 for chance. `compareAcrossEras`
 *      uses it on the indicators two eras share, and then follows every team
 *      of `cluster.minSize` or more from the era it was found in to every
 *      other era: it holds where at least `cluster.teamHoldShare` of its
 *      members present there fall in one cluster, breaks where they do not,
 *      and is unknown where too few of its members existed.
 *   4. `dtwDistance(a, b, window)` + `clusterByShape(windows)` — a second,
 *      shape-based clustering: dynamic time warping with a Sakoe-Chiba band
 *      (`cluster.dtwWindow`) on each indicator's z-normalised path through the
 *      `cluster.shapeWindowMonths` months around each market peak
 *      (`peakWindows` cuts them). Two indicators whose paths match once a lead
 *      of a few months is allowed for are a shape team even when their
 *      contemporaneous r is low.
 *   5. `clusterBreadth(cluster, states, month)` — the share of a team's
 *      members in an adverse state in one month: a candidate diffusion
 *      signal. Members whose state is unknown are left out of the denominator
 *      and listed.
 *
 * What it refuses to do: fill a missing month, invent an r from too few
 * months, call a team stable when it has been seen in one era only, or break
 * a tie by chance. Every tie is broken by input order, so the same input
 * always gives the same dendrogram (no Math.random anywhere).
 *
 * Every threshold is a `cluster.*` row in assumptions.ts with source and
 * as-of date.
 *
 * ─── PORT STEPS (to sam-russell-corpus/russell-capital-systems @ master) ────
 *
 *  1. Copy `shared/macro/clusters.ts`. It imports only `./assumptions` and
 *     `./emergentPatterns` (both already in `shared/macro/`).
 *  2. Append the eight `cluster.*` rows (block "Cluster engine (Q2)") to the
 *     rules table in `shared/macro/assumptions.ts`, after `COMBO_ROWS`.
 *  3. Add `export * from "./clusters";` to `shared/macro/index.ts` (after
 *     `./combinations`). No name collides with an existing export.
 *  4. Copy `server/macroClusters.test.ts` (tests live in `server/` because the
 *     trunk's vitest config includes `server/**` only). It is offline and uses
 *     labelled synthetic fixtures only.
 *  5. Proof of done: `pnpm check` adds no error; `pnpm test
 *     server/macroClusters.test.ts` passes.
 *  6. Map/Set iteration here goes through `Array.from(...)`, because the
 *     trunk's tsconfig sets no `target`. Keep it that way.
 *
 * Pure: no fetch, no database, no `process`.
 */
import { A } from "./assumptions";
import { alignMonthly, pearson, type Series } from "./emergentPatterns";

// ─── 1. Correlation matrix ────────────────────────────────────────────────

export type CorrelationMatrix = {
  ids: string[];
  /** Month keys (YYYY-MM) that entered the matrix after `include`. */
  months: string[];
  /** r[i][j]; null when the pair shares fewer than `minPairMonths` months. Diagonal is 1. */
  r: Array<Array<number | null>>;
  /** Shared months behind each r. */
  n: number[][];
  transform: "level" | "change";
};

export type CorrelationOptions = {
  /** "level" (default) correlates the aligned monthly values; "change" correlates month-on-month changes. */
  transform?: "level" | "change";
  /** Keep only months for which this returns true (an era, a cycle phase). Receives YYYY-MM. */
  include?: (monthKey: string) => boolean;
  minPairMonths?: number;
};

function monthOnMonth(values: Array<number | null>): Array<number | null> {
  return values.map((v, i) => (i === 0 || v === null || values[i - 1] === null ? null : v - (values[i - 1] as number)));
}

/** Pairwise-complete Pearson correlation on the aligned monthly grid. */
export function correlationMatrix(series: Series[], opts: CorrelationOptions = {}): CorrelationMatrix {
  const transform = opts.transform ?? "level";
  const minPair = opts.minPairMonths ?? A("cluster.minPairMonths");
  const ids: string[] = [];
  for (const s of series) if (ids.indexOf(s.indicatorId) < 0) ids.push(s.indicatorId);
  const { keys, matrix } = alignMonthly(series);
  // Transform first (a change needs the previous calendar month), then restrict.
  const keepIdx: number[] = [];
  keys.forEach((k, i) => {
    if (!opts.include || opts.include(k)) keepIdx.push(i);
  });
  const cols = ids.map(id => {
    const raw = matrix.get(id) ?? keys.map(() => null);
    const t = transform === "change" ? monthOnMonth(raw) : raw;
    return keepIdx.map(i => t[i]);
  });
  const k = ids.length;
  const r: Array<Array<number | null>> = ids.map(() => ids.map(() => null));
  const n: number[][] = ids.map(() => ids.map(() => 0));
  for (let i = 0; i < k; i++) {
    n[i][i] = cols[i].filter(v => v !== null).length;
    r[i][i] = 1;
    for (let j = i + 1; j < k; j++) {
      const x: number[] = [];
      const y: number[] = [];
      for (let t = 0; t < keepIdx.length; t++) {
        const a = cols[i][t];
        const b = cols[j][t];
        if (a !== null && b !== null) {
          x.push(a);
          y.push(b);
        }
      }
      n[i][j] = n[j][i] = x.length;
      const v = x.length >= minPair ? pearson(x, y) : null;
      r[i][j] = r[j][i] = v;
    }
  }
  return { ids, months: keepIdx.map(i => keys[i]), r, n, transform };
}

// ─── 2. Hierarchical clustering ───────────────────────────────────────────

export type Linkage = "average" | "complete";

export type Merge = {
  /** Node ids: 0…n−1 are leaves (in `ids` order); n + m is the node made by merge m. */
  left: number;
  right: number;
  height: number;
  size: number;
  members: string[];
};

export type Dendrogram = {
  ids: string[];
  linkage: Linkage;
  merges: Merge[];
  /** Flat labels (aligned to `ids`) after applying every merge at or below `height`. Labels are numbered by first appearance. */
  cutTree(height: number): number[];
  /** The clusters at `height` with at least `minSize` members, each in `ids` order, ordered by first member. */
  clustersAt(height: number, minSize?: number): string[][];
  /** Teams at the rules-table cut: `cluster.cutHeight`, `cluster.minSize`. */
  teams(): string[][];
};

/** Correlation → distance 1 − |r|; unknown r is distance 1 (no evidence of a team). */
export function correlationDistance(m: CorrelationMatrix): number[][] {
  return m.r.map((row, i) => row.map((v, j) => (i === j ? 0 : v === null ? 1 : 1 - Math.abs(v))));
}

/** Cut a dendrogram at `height`. Exported separately so a stored dendrogram (plain JSON) can be cut. */
export function cutTree(d: Pick<Dendrogram, "ids" | "merges">, height: number): number[] {
  const n = d.ids.length;
  const parent: number[] = [];
  for (let i = 0; i < 2 * n; i++) parent.push(i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const tol = 1e-12;
  d.merges.forEach((m, idx) => {
    if (m.height <= height + tol) {
      const node = n + idx;
      parent[find(m.left)] = node;
      parent[find(m.right)] = node;
    }
  });
  const labelOf = new Map<number, number>();
  return d.ids.map((_, i) => {
    const root = find(i);
    if (!labelOf.has(root)) labelOf.set(root, labelOf.size);
    return labelOf.get(root)!;
  });
}

function groupLabels(ids: string[], labels: number[], minSize: number): string[][] {
  const groups = new Map<number, string[]>();
  labels.forEach((l, i) => {
    if (!groups.has(l)) groups.set(l, []);
    groups.get(l)!.push(ids[i]);
  });
  return Array.from(groups.values()).filter(g => g.length >= minSize);
}

/**
 * Agglomerative clustering on a precomputed symmetric distance matrix
 * (Lance–Williams updates). Ties go to the pair of lowest node ids, so the
 * result depends only on the input order.
 */
export function hierarchicalFromDistances(ids: string[], dist: number[][], linkage: Linkage = "average"): Dendrogram {
  const n = ids.length;
  if (dist.length !== n || dist.some(row => row.length !== n)) throw new Error("Distance matrix must be n × n for n ids");
  const total = Math.max(2 * n - 1, 1);
  const D: number[][] = [];
  for (let i = 0; i < total; i++) {
    const row: number[] = [];
    for (let j = 0; j < total; j++) row.push(i < n && j < n ? dist[i][j] : 0);
    D.push(row);
  }
  const size: number[] = [];
  const members: string[][] = [];
  for (let i = 0; i < total; i++) {
    size.push(i < n ? 1 : 0);
    members.push(i < n ? [ids[i]] : []);
  }
  let active: number[] = [];
  for (let i = 0; i < n; i++) active.push(i);
  const merges: Merge[] = [];
  while (active.length > 1) {
    let bi = -1;
    let bj = -1;
    let best = Infinity;
    for (let x = 0; x < active.length; x++) {
      for (let y = x + 1; y < active.length; y++) {
        const d = D[active[x]][active[y]];
        if (d < best || bi < 0) {
          best = d;
          bi = active[x];
          bj = active[y];
        }
      }
    }
    const node = n + merges.length;
    size[node] = size[bi] + size[bj];
    members[node] = members[bi].concat(members[bj]).sort((a, b) => ids.indexOf(a) - ids.indexOf(b));
    merges.push({ left: bi, right: bj, height: best, size: size[node], members: members[node] });
    active = active.filter(a => a !== bi && a !== bj);
    for (const k of active) {
      const dik = D[bi][k];
      const djk = D[bj][k];
      const v = linkage === "complete" ? Math.max(dik, djk) : (size[bi] * dik + size[bj] * djk) / (size[bi] + size[bj]);
      D[node][k] = D[k][node] = v;
    }
    active.push(node);
  }
  const base = { ids: ids.slice(), merges };
  return {
    ids: base.ids,
    linkage,
    merges,
    cutTree: (height: number) => cutTree(base, height),
    clustersAt: (height: number, minSize = 1) => groupLabels(base.ids, cutTree(base, height), minSize),
    teams: () => groupLabels(base.ids, cutTree(base, A("cluster.cutHeight")), A("cluster.minSize")),
  };
}

/** Hierarchical clustering of a correlation matrix on distance 1 − |r|. */
export function hierarchicalCluster(matrix: CorrelationMatrix, linkage: Linkage = "average"): Dendrogram {
  return hierarchicalFromDistances(matrix.ids, correlationDistance(matrix), linkage);
}

// ─── 3. Adjusted Rand index ───────────────────────────────────────────────

const choose2 = (x: number) => (x * (x - 1)) / 2;

/**
 * Adjusted Rand index (Hubert & Arabie 1985) between two labelings of the
 * same items. 1 = identical partitions (label names do not matter); ≈ 0 =
 * agreement no better than chance; can be negative.
 */
export function adjustedRandIndex(a: ReadonlyArray<string | number>, b: ReadonlyArray<string | number>): number {
  if (a.length !== b.length) throw new Error(`adjustedRandIndex: labelings differ in length (${a.length} vs ${b.length})`);
  const n = a.length;
  if (n < 2) return 1;
  const cell = new Map<string, number>();
  const rowSum = new Map<string, number>();
  const colSum = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const ka = String(a[i]);
    const kb = String(b[i]);
    const key = JSON.stringify([ka, kb]);
    cell.set(key, (cell.get(key) ?? 0) + 1);
    rowSum.set(ka, (rowSum.get(ka) ?? 0) + 1);
    colSum.set(kb, (colSum.get(kb) ?? 0) + 1);
  }
  const index = Array.from(cell.values()).reduce((s, v) => s + choose2(v), 0);
  const sumA = Array.from(rowSum.values()).reduce((s, v) => s + choose2(v), 0);
  const sumB = Array.from(colSum.values()).reduce((s, v) => s + choose2(v), 0);
  const expected = (sumA * sumB) / choose2(n);
  const max = (sumA + sumB) / 2;
  if (max === expected) return 1; // both partitions trivial and identical (all one cluster, or all singletons)
  return (index - expected) / (max - expected);
}

// ─── 4. Dynamic time warping and shape clustering ─────────────────────────

/**
 * DTW distance with a Sakoe-Chiba band: cell (i, j) is reachable only when
 * |i − j| ≤ max(window, |len(a) − len(b)|). Local cost |a_i − b_j|; the
 * result is the total cost of the cheapest warping path.
 */
export function dtwDistance(a: ReadonlyArray<number>, b: ReadonlyArray<number>, window: number = A("cluster.dtwWindow")): number {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) throw new Error("dtwDistance: empty series");
  if (!(window >= 0)) throw new Error("dtwDistance: window must be ≥ 0");
  const w = Math.max(Math.floor(window), Math.abs(n - m));
  let prev: number[] = new Array(m + 1).fill(Infinity);
  prev[0] = 0;
  for (let i = 1; i <= n; i++) {
    const cur: number[] = new Array(m + 1).fill(Infinity);
    const lo = Math.max(1, i - w);
    const hi = Math.min(m, i + w);
    for (let j = lo; j <= hi; j++) {
      const cost = Math.abs(a[i - 1] - b[j - 1]);
      cur[j] = cost + Math.min(prev[j], cur[j - 1], prev[j - 1]);
    }
    prev = cur;
  }
  return prev[m];
}

/** z-normalise a window so DTW compares shape, not level or scale. A flat window becomes all zeros. */
export function zNormalise(xs: ReadonlyArray<number>): number[] {
  const n = xs.length;
  const mean = xs.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(xs.reduce((s, v) => s + (v - mean) * (v - mean), 0) / n);
  return xs.map(v => (sd === 0 ? 0 : (v - mean) / sd));
}

/** One indicator's paths around each peak; `windows[k]` is the window around peak k, null if the indicator has no data there. */
export type ShapeWindows = { indicatorId: string; windows: Array<ReadonlyArray<number | null> | null> };

export type ShapeClustering = {
  ids: string[];
  /** Mean over shared peaks of DTW(z(a), z(b)) / window length; Infinity when the pair shares no complete peak window. */
  distances: number[][];
  /** Number of peak windows each pair was compared on. */
  peaksCompared: number[][];
  dendrogram: Dendrogram;
  /** Clusters at `cluster.shapeCutHeight` with at least `cluster.minSize` members. */
  teams: string[][];
};

const completeWindow = (w: ReadonlyArray<number | null> | null | undefined): w is ReadonlyArray<number> =>
  !!w && w.length > 0 && w.every(v => v !== null && Number.isFinite(v));

/**
 * Shape-based clustering. For each pair of indicators, every peak where both
 * have a complete window contributes DTW(z(a), z(b), window) / length; the
 * pair distance is the mean. Pairs with no shared complete window are
 * Infinity apart (unknown, never merged below an infinite height).
 */
export function clusterByShape(
  input: ShapeWindows[],
  opts: { window?: number; linkage?: Linkage; cutHeight?: number; minSize?: number } = {},
): ShapeClustering {
  const window = opts.window ?? A("cluster.dtwWindow");
  const cut = opts.cutHeight ?? A("cluster.shapeCutHeight");
  const minSize = opts.minSize ?? A("cluster.minSize");
  const ids = input.map(s => s.indicatorId);
  const z = input.map(s => s.windows.map(w => (completeWindow(w) ? zNormalise(w) : null)));
  const k = ids.length;
  const distances: number[][] = ids.map(() => ids.map(() => 0));
  const peaksCompared: number[][] = ids.map(() => ids.map(() => 0));
  for (let i = 0; i < k; i++) {
    peaksCompared[i][i] = z[i].filter(w => w !== null).length;
    for (let j = i + 1; j < k; j++) {
      let sum = 0;
      let count = 0;
      const peaks = Math.min(z[i].length, z[j].length);
      for (let p = 0; p < peaks; p++) {
        const a = z[i][p];
        const b = z[j][p];
        if (!a || !b) continue;
        sum += dtwDistance(a, b, window) / Math.max(a.length, b.length);
        count++;
      }
      distances[i][j] = distances[j][i] = count > 0 ? sum / count : Infinity;
      peaksCompared[i][j] = peaksCompared[j][i] = count;
    }
  }
  const dendrogram = hierarchicalFromDistances(ids, distances, opts.linkage ?? "average");
  return { ids, distances, peaksCompared, dendrogram, teams: dendrogram.clustersAt(cut, minSize) };
}

function addMonths(monthKey: string, delta: number): string {
  const y = Number(monthKey.slice(0, 4));
  const m = Number(monthKey.slice(5, 7)) - 1 + delta;
  const yy = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  return `${String(yy).padStart(4, "0")}-${String(mm + 1).padStart(2, "0")}`;
}

/**
 * Cut each series' path around each peak: `length` months starting `before`
 * months ahead of the peak month (defaults: 36 and 18, from the rules
 * table). A month the series lacks is null, so the window is incomplete and
 * `clusterByShape` skips it for that peak.
 */
export function peakWindows(series: Series[], peaks: string[], opts: { length?: number; before?: number } = {}): ShapeWindows[] {
  const length = opts.length ?? A("cluster.shapeWindowMonths");
  const before = opts.before ?? A("cluster.shapeMonthsBefore");
  return series.map(s => {
    const byMonth = new Map<string, number>();
    for (const p of s.points.slice().sort((x, y) => (x.asOf < y.asOf ? -1 : x.asOf > y.asOf ? 1 : 0))) byMonth.set(p.asOf.slice(0, 7), p.value);
    const windows = peaks.map(pk => {
      const start = addMonths(pk.slice(0, 7), -before);
      const w: Array<number | null> = [];
      for (let t = 0; t < length; t++) {
        const key = addMonths(start, t);
        w.push(byMonth.has(key) ? byMonth.get(key)! : null);
      }
      return w;
    });
    return { indicatorId: s.indicatorId, windows };
  });
}

// ─── 5. Breadth: share of a team in an adverse state ──────────────────────

/** Monthly states per indicator on a shared grid (YYYY-MM or ISO dates). null = unknown. */
export type StatePanel = { keys: string[]; states: ReadonlyMap<string, ReadonlyArray<string | null>> };

/** The label counted as adverse unless the caller passes its own test (A10's state vocabulary is not yet fixed; see DECISIONS.md). */
export const DEFAULT_ADVERSE_STATES: ReadonlyArray<string> = ["adverse"];

export type Breadth = {
  month: string;
  members: number;
  /** Members with a known state this month. */
  known: number;
  adverse: number;
  /** adverse / known; null when no member's state is known. */
  breadth: number | null;
  adverseMembers: string[];
  unknownMembers: string[];
};

/**
 * Breadth of a team in one month: the share of its members (with a known
 * state) that are in an adverse state. Members absent from the panel or with
 * a null state are unknown: listed, not counted either way.
 */
export function clusterBreadth(
  cluster: ReadonlyArray<string>,
  states: StatePanel,
  month: string,
  opts: { isAdverse?: (state: string) => boolean } = {},
): Breadth {
  const isAdverse = opts.isAdverse ?? ((s: string) => DEFAULT_ADVERSE_STATES.indexOf(s) >= 0);
  const mk = month.slice(0, 7);
  const idx = states.keys.findIndex(k => k.slice(0, 7) === mk);
  const adverseMembers: string[] = [];
  const unknownMembers: string[] = [];
  let known = 0;
  for (const id of cluster) {
    const row = states.states.get(id);
    const s = idx >= 0 && row ? row[idx] ?? null : null;
    if (s === null) {
      unknownMembers.push(id);
      continue;
    }
    known++;
    if (isAdverse(s)) adverseMembers.push(id);
  }
  return {
    month: mk,
    members: cluster.length,
    known,
    adverse: adverseMembers.length,
    breadth: known > 0 ? adverseMembers.length / known : null,
    adverseMembers,
    unknownMembers,
  };
}

/** Breadth for every month of the panel: the candidate diffusion series. */
export function breadthSeries(cluster: ReadonlyArray<string>, states: StatePanel, opts: { isAdverse?: (state: string) => boolean } = {}): Breadth[] {
  return states.keys.map(k => clusterBreadth(cluster, states, k, opts));
}

// ─── 6. Across eras: which teams hold ─────────────────────────────────────

/** One era's flat clustering, e.g. `{ ids: d.ids, labels: d.cutTree(h) }`. */
export type FlatClustering = { ids: string[]; labels: ReadonlyArray<number | string> };

export type EraAgreement = { a: string; b: string; common: number; ari: number | null };

export type TeamStatus = "stable" | "era-bound" | "single-era";

export type TeamAcrossEras = {
  key: string;
  members: string[];
  name: string;
  /** Eras where this exact member set was a cluster. */
  foundIn: string[];
  holdsIn: string[];
  breaksIn: string[];
  /** Eras where fewer than `minSize` members existed. */
  unknownIn: string[];
  /** Per era: the largest share of present members in one cluster, or null when unknown. */
  cohesion: Record<string, number | null>;
  /** stable: holds in ≥ 2 eras and breaks in none; era-bound: breaks somewhere; single-era: seen in one era only. */
  status: TeamStatus;
};

export type EraComparison = {
  eras: string[];
  pairwise: EraAgreement[];
  teams: TeamAcrossEras[];
  stableTeams: TeamAcrossEras[];
};

/**
 * Compare flat clusterings across eras. ARI is computed on the indicators
 * both eras contain (null when fewer than two). Each cluster of at least
 * `minSize` in any era is a candidate team and is followed into every era.
 */
export function compareAcrossEras(
  clusteringsByEra: Record<string, FlatClustering>,
  opts: { minSize?: number; holdShare?: number; name?: (members: string[]) => string } = {},
): EraComparison {
  const minSize = opts.minSize ?? A("cluster.minSize");
  const holdShare = opts.holdShare ?? A("cluster.teamHoldShare");
  const namer = opts.name ?? ((m: string[]) => m.join(" + "));
  const eras = Object.keys(clusteringsByEra);
  const labelMaps = new Map<string, Map<string, string>>();
  for (const e of eras) {
    const c = clusteringsByEra[e];
    if (c.ids.length !== c.labels.length) throw new Error(`compareAcrossEras: era ${e} has ${c.ids.length} ids and ${c.labels.length} labels`);
    const m = new Map<string, string>();
    c.ids.forEach((id, i) => m.set(id, String(c.labels[i])));
    labelMaps.set(e, m);
  }

  const pairwise: EraAgreement[] = [];
  for (let i = 0; i < eras.length; i++) {
    for (let j = i + 1; j < eras.length; j++) {
      const ma = labelMaps.get(eras[i])!;
      const mb = labelMaps.get(eras[j])!;
      const common = clusteringsByEra[eras[i]].ids.filter(id => mb.has(id));
      const ari = common.length >= 2 ? adjustedRandIndex(common.map(id => ma.get(id)!), common.map(id => mb.get(id)!)) : null;
      pairwise.push({ a: eras[i], b: eras[j], common: common.length, ari });
    }
  }

  const candidates = new Map<string, { members: string[]; foundIn: string[] }>();
  for (const e of eras) {
    const c = clusteringsByEra[e];
    const groups = new Map<string, string[]>();
    c.ids.forEach((id, i) => {
      const l = String(c.labels[i]);
      if (!groups.has(l)) groups.set(l, []);
      groups.get(l)!.push(id);
    });
    for (const g of Array.from(groups.values())) {
      if (g.length < minSize) continue;
      const members = g.slice().sort();
      const key = members.join("|");
      if (!candidates.has(key)) candidates.set(key, { members, foundIn: [] });
      candidates.get(key)!.foundIn.push(e);
    }
  }

  const teams: TeamAcrossEras[] = Array.from(candidates.entries()).map(([key, c]) => {
    const holdsIn: string[] = [];
    const breaksIn: string[] = [];
    const unknownIn: string[] = [];
    const cohesion: Record<string, number | null> = {};
    for (const e of eras) {
      const m = labelMaps.get(e)!;
      const present = c.members.filter(id => m.has(id));
      if (present.length < minSize) {
        unknownIn.push(e);
        cohesion[e] = null;
        continue;
      }
      const counts = new Map<string, number>();
      for (const id of present) counts.set(m.get(id)!, (counts.get(m.get(id)!) ?? 0) + 1);
      const share = Math.max(...Array.from(counts.values())) / present.length;
      cohesion[e] = share;
      (share >= holdShare - 1e-12 ? holdsIn : breaksIn).push(e);
    }
    const status: TeamStatus = breaksIn.length > 0 ? "era-bound" : holdsIn.length >= 2 ? "stable" : "single-era";
    return { key, members: c.members, name: namer(c.members), foundIn: c.foundIn, holdsIn, breaksIn, unknownIn, cohesion, status };
  });

  const rank: Record<TeamStatus, number> = { stable: 0, "single-era": 1, "era-bound": 2 };
  teams.sort((x, y) => rank[x.status] - rank[y.status] || y.holdsIn.length - x.holdsIn.length || y.members.length - x.members.length || (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
  return { eras, pairwise, teams, stableTeams: teams.filter(t => t.status === "stable") };
}
