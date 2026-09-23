/**
 * Sequence engine — what turns first, second, third before a bear market (Q4).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The owner's ask (23 Sep 2026): "multi and sequencing of one after the
 * other". The study question (handoff 04 §5 Q4): before each bear market, in
 * what order did the indicators change state; is that order the same from
 * one bear to the next; which indicator reliably turns first, which second?
 *
 * What this module does, over the state-change event stream A10 writes
 * (`events.csv`: month, indicator, kind, from, to):
 *
 *   1. Episodes. `episodeSequences` cuts, for every bear-market peak, the
 *      state changes in the `seq.lookbackMonths` (36) months before it —
 *      months peak−36 … peak−1; the peak month itself is excluded — and
 *      orders them by month. Changes in the same month are simultaneous: they
 *      form one itemset and are never given an order between them.
 *   2. Frequent orders. `prefixSpan` (Pei et al. 2001) mines every ordered
 *      pattern "A, then later B, then later C" (strictly earlier months) with
 *      support counted in EPISODES: an episode supports a pattern once, however
 *      many times the events repeat inside it. Minimum support
 *      `seq.minSupportEpisodes`; maximum length `seq.maxPatternLength`.
 *   3. Consistency. `kendallW` is Kendall & Babington Smith's (1939)
 *      coefficient of concordance over m rankings of n objects, with the tie
 *      correction and the χ² p-value. `orderConsistency` builds the rankings
 *      from the episodes (rank = order of each indicator's first change).
 *   4. The typical sequence. `typicalSequence` gives, for every item that
 *      turns in at least `seq.minSupportEpisodes` bears, its median rank, how
 *      often it appears (share of bears), the median months before the peak
 *      and the eras in which it appeared — ordered first to last.
 *   5. Is the order predictive? `sequencePrecision` scores a pattern against
 *      the bear episodes AND against non-bear control windows
 *      (`nonBearWindows`), so a pattern that appears everywhere (lift ≈ 1)
 *      is never reported as a warning. Lift, precision, one-sided Fisher
 *      exact p.
 *   6. Dominoes. `sequenceDominoes` turns mined patterns into the
 *      `DominoChain` shape of `emergentPatterns.ts` (path, median lags,
 *      strength, confidence) and `mergeDominoes` ranks them beside the
 *      lead-lag chains of `dominoChains`, without duplicating that scan.
 *
 * What it refuses to do: count months as support; order two changes that
 * happened in the same month; call a pattern predictive without control
 * windows to compare against; look at data (it is pure — the caller decides
 * which eras it passes, and the holdout rule of handoff 04 §3 is the
 * caller's to keep: pass E5 episodes only until a pattern is pre-registered).
 *
 * Deterministic: no randomness; every tie is broken by a stated key.
 *
 * ─── PORT STEPS (to the trunk, with the rest of shared/macro) ──────────────
 *  1. Copy `shared/macro/sequences.ts`; it imports only `./assumptions` and
 *     the `DominoChain` type from `./emergentPatterns`.
 *  2. Append the six `seq.*` rows (the `SEQ_ROWS` block) to
 *     `shared/macro/assumptions.ts`.
 *  3. Add `export * from "./sequences";` to `shared/macro/index.ts`.
 *  4. Copy `server/macroSequences.test.ts` (vitest includes `server/**`).
 *  5. Proof of done: `pnpm vitest run server/macroSequences.test.ts` green;
 *     `pnpm check` adds no errors. No table, route or client change.
 *  Map/Set iteration uses `Array.from(...)` (trunk tsconfig sets no target).
 */
import { A } from "./assumptions";
import type { DominoChain } from "./emergentPatterns";

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * One state change, as A10's `events.csv` writes it (month, indicator, kind,
 * from, to). A10's own `StateEvent` (states.ts) is assignable to this; the
 * name differs so both modules can be re-exported from index.ts. `month` is
 * YYYY-MM (a YYYY-MM-DD is truncated). Direction states (up/down/flat) and
 * level states (extreme-high/normal/extreme-low) use disjoint labels, so the
 * item `indicator:to` is unambiguous without `kind`.
 */
export type SequenceStateEvent = { month: string; indicator: string; kind?: string; from: string; to: string };

export type SequenceEraId = "E1" | "E2" | "E3" | "E4" | "E5";

/** A bear-market peak. `previousTrough` (YYYY-MM), when given, clips the window so the prior bear's own changes are not counted. */
export type BearPeak = { id: string; peak: string; previousTrough?: string; era?: SequenceEraId };

/** Anything PrefixSpan can mine: an id and an ordered list of itemsets (one per month with changes). */
export type SequenceInput = {
  id: string;
  itemsets: string[][];
  /** Month index (year×12 + month−1) of each itemset; used for lags. */
  months?: number[];
  era?: SequenceEraId | null;
};

export type SequenceEvent = SequenceStateEvent & { item: string; monthsBeforePeak: number };

export type EpisodeSequence = SequenceInput & {
  peak: string;
  era: SequenceEraId | null;
  windowStart: string;
  windowEnd: string;
  lookbackMonths: number;
  events: SequenceEvent[];
  itemsets: string[][];
  months: number[];
};

export type SequentialPattern = {
  items: string[];
  /** Distinct episodes containing the pattern in order. */
  support: number;
  supportShare: number;
  episodes: string[];
  /** Median months between consecutive steps (leftmost embedding in each supporting episode). */
  medianLags: Array<number | null>;
  eras: Partial<Record<SequenceEraId, number>>;
  reading: string;
};

export type KendallW = {
  W: number | null;
  /** Raters (episodes) and objects (indicators) actually used. */
  m: number;
  n: number;
  S: number;
  /** Σ over raters of Σ(t³ − t) over tie groups. */
  tieCorrection: number;
  chiSquare: number | null;
  df: number;
  pValue: number | null;
  /** Object indices dropped because a rater had no value for them (missing: "drop"). */
  dropped: number[];
  reading: string;
};

export type TypicalStep = {
  step: number;
  item: string;
  medianRank: number;
  /** Bears in which the item turned (in the window), and the share of all bears. */
  episodes: number;
  frequency: number;
  medianMonthsBeforePeak: number;
  eras: Partial<Record<SequenceEraId, number>>;
};

export type TypicalSequence = {
  steps: TypicalStep[];
  episodes: number;
  kendall: KendallW;
  consistent: boolean;
  reading: string;
};

export type SequencePrecision = {
  pattern: string[];
  bearHits: number;
  bearEpisodes: number;
  nonBearHits: number;
  nonBearWindows: number;
  bearRate: number | null;
  nonBearRate: number | null;
  /** P(bear | pattern seen) among bear episodes + control windows. */
  precision: number | null;
  baseRate: number | null;
  /** bearRate / nonBearRate with the Haldane +0.5 correction; null without controls. */
  lift: number | null;
  /** One-sided Fisher exact P(bear hits ≥ observed | margins). */
  fisherP: number | null;
  predictive: boolean;
  reading: string;
};

// ─── Eras (handoff 04 §3) ──────────────────────────────────────────────────

export const SEQUENCE_ERAS: ReadonlyArray<{ id: SequenceEraId; from: number; to: number; source: string; asOf: string }> = [
  { id: "E1", from: -Infinity, to: 1888, source: "RCS handoff (2026) 04_THE_100_INDICATOR_REVERSE_TIME_STUDY.md §3", asOf: "2026-09-23" },
  { id: "E2", from: 1889, to: 1935, source: "RCS handoff (2026) 04_THE_100_INDICATOR_REVERSE_TIME_STUDY.md §3", asOf: "2026-09-23" },
  { id: "E3", from: 1936, to: 1961, source: "RCS handoff (2026) 04_THE_100_INDICATOR_REVERSE_TIME_STUDY.md §3", asOf: "2026-09-23" },
  { id: "E4", from: 1962, to: 1989, source: "RCS handoff (2026) 04_THE_100_INDICATOR_REVERSE_TIME_STUDY.md §3", asOf: "2026-09-23" },
  { id: "E5", from: 1990, to: Infinity, source: "RCS handoff (2026) 04_THE_100_INDICATOR_REVERSE_TIME_STUDY.md §3", asOf: "2026-09-23" },
];

export function sequenceEraOf(month: string): SequenceEraId {
  const y = Number(month.slice(0, 4));
  return (SEQUENCE_ERAS.find(e => y >= e.from && y <= e.to) ?? SEQUENCE_ERAS[SEQUENCE_ERAS.length - 1]).id;
}

// ─── Month arithmetic ──────────────────────────────────────────────────────

/** "YYYY-MM" (or "YYYY-MM-DD") → year×12 + month−1. */
export function sequenceMonthIndex(month: string): number {
  const m = /^(\d{4})-(\d{2})/.exec(month);
  if (!m) throw new Error(`Bad month: ${month}`);
  return Number(m[1]) * 12 + Number(m[2]) - 1;
}

export function monthLabel(index: number): string {
  const y = Math.floor(index / 12);
  const mo = index - y * 12 + 1;
  return `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}`;
}

/** The symbol an event contributes: `indicator:to` (e.g. `rt-term-spread:down`). */
export const eventItem = (e: Pick<SequenceStateEvent, "indicator" | "to">) => `${e.indicator}:${e.to}`;

const round3 = (x: number) => Math.round(x * 1000) / 1000;
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const h = Math.floor(s.length / 2);
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

function eraCounts(eras: Array<SequenceEraId | null | undefined>): Partial<Record<SequenceEraId, number>> {
  const out: Partial<Record<SequenceEraId, number>> = {};
  for (const e of eras) if (e) out[e] = (out[e] ?? 0) + 1;
  return out;
}

// ─── 1. Episodes ───────────────────────────────────────────────────────────

function windowSequence(id: string, endExclusive: number, startInclusive: number, events: Array<SequenceStateEvent & { mi: number }>, lookbackMonths: number, era: SequenceEraId | null): EpisodeSequence {
  const inside = events
    .filter(e => e.mi >= startInclusive && e.mi < endExclusive)
    .sort((a, b) => a.mi - b.mi || cmp(a.indicator, b.indicator) || cmp(a.to, b.to) || cmp(a.from, b.from));
  const seqEvents: SequenceEvent[] = inside.map(e => ({ month: monthLabel(e.mi), indicator: e.indicator, ...(e.kind ? { kind: e.kind } : {}), from: e.from, to: e.to, item: eventItem(e), monthsBeforePeak: endExclusive - e.mi }));
  const itemsets: string[][] = [];
  const months: number[] = [];
  for (const e of inside) {
    const item = eventItem(e);
    if (months.length && months[months.length - 1] === e.mi) {
      const last = itemsets[itemsets.length - 1];
      if (!last.includes(item)) last.push(item);
    } else {
      itemsets.push([item]);
      months.push(e.mi);
    }
  }
  itemsets.forEach(s => s.sort(cmp));
  return { id, peak: monthLabel(endExclusive), era, windowStart: monthLabel(startInclusive), windowEnd: monthLabel(endExclusive - 1), lookbackMonths, events: seqEvents, itemsets, months };
}

/**
 * For each bear peak, the ordered state changes in the `lookbackMonths`
 * months before it (peak−L … peak−1). Same-month changes share an itemset.
 * If a peak carries `previousTrough`, the window starts no earlier than the
 * month after it, so the last bear's own changes are not counted twice.
 */
export function episodeSequences(events: SequenceStateEvent[], peaks: BearPeak[], lookbackMonths: number = A("seq.lookbackMonths")): EpisodeSequence[] {
  if (!(lookbackMonths >= 1)) throw new Error("lookbackMonths must be ≥ 1");
  const indexed = events.map(e => ({ ...e, mi: sequenceMonthIndex(e.month) }));
  return [...peaks]
    .sort((a, b) => sequenceMonthIndex(a.peak) - sequenceMonthIndex(b.peak) || cmp(a.id, b.id))
    .map(p => {
      const end = sequenceMonthIndex(p.peak);
      let start = end - lookbackMonths;
      if (p.previousTrough) start = Math.max(start, sequenceMonthIndex(p.previousTrough) + 1);
      return windowSequence(p.id, end, start, indexed, lookbackMonths, p.era ?? sequenceEraOf(p.peak));
    });
}

/**
 * Non-bear control windows: windows of the same length, stepped without
 * overlap across [from, to], kept only if no bear peak lies inside the
 * window or within `seq.controlGuardMonths` after it. They are what
 * `sequencePrecision` compares the bears against.
 */
export function nonBearWindows(events: SequenceStateEvent[], peaks: BearPeak[], range: { from: string; to: string }, lookbackMonths: number = A("seq.lookbackMonths"), guardMonths: number = A("seq.controlGuardMonths")): EpisodeSequence[] {
  const indexed = events.map(e => ({ ...e, mi: sequenceMonthIndex(e.month) }));
  const peakIdx = peaks.map(p => sequenceMonthIndex(p.peak));
  const out: EpisodeSequence[] = [];
  const last = sequenceMonthIndex(range.to);
  for (let start = sequenceMonthIndex(range.from); start + lookbackMonths <= last + 1; start += lookbackMonths) {
    const end = start + lookbackMonths; // pseudo-peak, exclusive
    if (end + guardMonths > last + 1) break; // the guard must be observable
    if (peakIdx.some(p => p >= start && p <= end + guardMonths)) continue;
    out.push(windowSequence(`control-${monthLabel(end)}`, end, start, indexed, lookbackMonths, sequenceEraOf(monthLabel(end))));
  }
  return out;
}

// ─── 2. PrefixSpan ─────────────────────────────────────────────────────────

/** Leftmost embedding of `pattern` in `seq` (strictly increasing itemset indices), or null. */
export function embed(seq: Pick<SequenceInput, "itemsets">, pattern: string[]): number[] | null {
  const pos: number[] = [];
  let j = -1;
  for (const item of pattern) {
    let k = j + 1;
    while (k < seq.itemsets.length && !seq.itemsets[k].includes(item)) k++;
    if (k >= seq.itemsets.length) return null;
    pos.push(k);
    j = k;
  }
  return pos;
}

export const containsPattern = (seq: Pick<SequenceInput, "itemsets">, pattern: string[]) => embed(seq, pattern) !== null;

/**
 * PrefixSpan (Pei et al. 2001) over sequences of itemsets, sequence-
 * extensions only: a pattern A → B → C means A's month is strictly before
 * B's, B's strictly before C's. Support = the number of distinct sequences
 * (episodes) containing the pattern — an item repeated inside one episode
 * still counts that episode once. Output sorted by support, then length,
 * then key; `closedOnly` drops a pattern when a one-longer super-pattern
 * has the same support.
 */
export function prefixSpan(sequences: SequenceInput[], minSupportEpisodes: number = A("seq.minSupportEpisodes"), maxLength: number = A("seq.maxPatternLength"), opts: { closedOnly?: boolean } = {}): SequentialPattern[] {
  const minSup = Math.max(1, Math.ceil(minSupportEpisodes));
  const total = sequences.length;
  const found: Array<{ items: string[]; proj: Array<{ s: number; pos: number[] }> }> = [];

  type Proj = { s: number; last: number; pos: number[] };
  const grow = (prefix: string[], proj: Proj[]) => {
    if (prefix.length >= maxLength) return;
    const bySeq = new Map<string, Set<number>>();
    for (const p of proj) {
      const sets = sequences[p.s].itemsets;
      for (let j = p.last + 1; j < sets.length; j++) for (const item of sets[j]) {
        let s = bySeq.get(item);
        if (!s) bySeq.set(item, (s = new Set()));
        s.add(p.s);
      }
    }
    const items = Array.from(bySeq.keys()).filter(i => bySeq.get(i)!.size >= minSup).sort(cmp);
    for (const item of items) {
      const next: Proj[] = [];
      for (const p of proj) {
        const sets = sequences[p.s].itemsets;
        let j = p.last + 1;
        while (j < sets.length && !sets[j].includes(item)) j++;
        if (j < sets.length) next.push({ s: p.s, last: j, pos: [...p.pos, j] });
      }
      const pattern = [...prefix, item];
      found.push({ items: pattern, proj: next.map(n => ({ s: n.s, pos: n.pos })) });
      grow(pattern, next);
    }
  };
  grow([], sequences.map((_, s) => ({ s, last: -1, pos: [] })));

  let out: SequentialPattern[] = found.map(f => {
    const lags: Array<number | null> = [];
    for (let k = 1; k < f.items.length; k++) {
      const gaps: number[] = [];
      for (const p of f.proj) {
        const months = sequences[p.s].months;
        if (months) gaps.push(months[p.pos[k]] - months[p.pos[k - 1]]);
      }
      lags.push(median(gaps));
    }
    const eps = f.proj.map(p => sequences[p.s].id).sort(cmp);
    const support = f.proj.length;
    return {
      items: f.items,
      support,
      supportShare: total ? round3(support / total) : 0,
      episodes: eps,
      medianLags: lags,
      eras: eraCounts(f.proj.map(p => sequences[p.s].era)),
      reading: `${f.items.join(" → ")}: in ${support} of ${total} episodes${lags.length ? ` (median gaps ${lags.map(l => (l === null ? "?" : `${l} m`)).join(", ")})` : ""}.`,
    };
  });
  if (opts.closedOnly) {
    const isSub = (a: string[], b: string[]) => {
      let j = 0;
      for (const x of b) if (j < a.length && a[j] === x) j++;
      return j === a.length;
    };
    out = out.filter(p => !out.some(q => q.items.length === p.items.length + 1 && q.support === p.support && isSub(p.items, q.items)));
  }
  return out.sort((a, b) => b.support - a.support || b.items.length - a.items.length || cmp(a.items.join(">"), b.items.join(">")));
}

// ─── 3. Kendall's W ────────────────────────────────────────────────────────

/** Average ranks (1-based) of `values`, ties sharing the mean of their positions. */
export function averageRanks(values: number[]): { ranks: number[]; tieSum: number } {
  const idx = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v || a.i - b.i);
  const ranks = new Array<number>(values.length);
  let tieSum = 0;
  for (let k = 0; k < idx.length; ) {
    let e = k;
    while (e + 1 < idx.length && idx[e + 1].v === idx[k].v) e++;
    const t = e - k + 1;
    const r = (k + 1 + e + 1) / 2;
    for (let q = k; q <= e; q++) ranks[idx[q].i] = r;
    if (t > 1) tieSum += t ** 3 - t;
    k = e + 1;
  }
  return { ranks, tieSum };
}

/**
 * Kendall & Babington Smith's (1939) W. `rankings[r][j]` is rater r's value
 * for object j — a rank or any ordering key (lower = earlier); each row is
 * re-ranked with average ranks for ties, and the tie correction
 * W = 12 S / (m²(n³ − n) − m Σ T), T = Σ(t³ − t), is applied. `null` means
 * the rater has no value for that object: "drop" (default) removes the
 * object for everyone; "tieLast" ties all of a rater's missing objects
 * after its last observed one. χ² = m (n − 1) W on n − 1 df.
 */
export function kendallW(rankings: Array<Array<number | null>>, opts: { missing?: "drop" | "tieLast" } = {}): KendallW {
  const missing = opts.missing ?? "drop";
  const m = rankings.length;
  const n0 = m ? rankings[0].length : 0;
  if (rankings.some(r => r.length !== n0)) throw new Error("kendallW: every ranking must cover the same objects");
  let keep = Array.from({ length: n0 }, (_, j) => j);
  let dropped: number[] = [];
  if (missing === "drop") {
    dropped = keep.filter(j => rankings.some(r => r[j] === null || !Number.isFinite(r[j] as number)));
    keep = keep.filter(j => !dropped.includes(j));
  }
  const n = keep.length;
  const empty = (why: string): KendallW => ({ W: null, m, n, S: 0, tieCorrection: 0, chiSquare: null, df: Math.max(0, n - 1), pValue: null, dropped, reading: why });
  if (m < 2 || n < 2) return empty(`Kendall's W needs at least 2 rankings of at least 2 objects (have ${m} × ${n}).`);
  const R = new Array<number>(n).fill(0);
  let T = 0;
  for (const row of rankings) {
    const vals = keep.map(j => row[j]);
    const maxSeen = Math.max(...vals.filter((v): v is number => v !== null && Number.isFinite(v)), 0);
    const filled = vals.map(v => (v === null || !Number.isFinite(v) ? maxSeen + 1 : v));
    const { ranks, tieSum } = averageRanks(filled);
    ranks.forEach((r, j) => (R[j] += r));
    T += tieSum;
  }
  const mean = (m * (n + 1)) / 2;
  const S = R.reduce((s, r) => s + (r - mean) ** 2, 0);
  const denom = m * m * (n ** 3 - n) - m * T;
  if (denom <= 0) return { ...empty("Every ranking ties every object; W is undefined."), S, tieCorrection: T };
  const W = Math.min(1, Math.max(0, (12 * S) / denom));
  const chi = m * (n - 1) * W;
  const p = chiSquareSurvival(chi, n - 1);
  return { W: round3(W), m, n, S: round3(S), tieCorrection: T, chiSquare: round3(chi), df: n - 1, pValue: p, dropped, reading: `Kendall's W = ${round3(W)} over ${m} rankings of ${n} objects (χ² = ${round3(chi)}, df ${n - 1}, p = ${p.toPrecision(3)})${T ? `, tie-corrected` : ""}.` };
}

/**
 * The rankings Kendall's W needs, from episodes: for each episode (rater)
 * and item (object), the month of the item's FIRST change in the window
 * (earlier = lower rank); null if it did not change there.
 */
export function orderConsistency(sequences: EpisodeSequence[], items: string[], opts: { missing?: "drop" | "tieLast" } = {}): KendallW {
  const rows = sequences.map(seq => items.map(item => {
    const k = seq.itemsets.findIndex(set => set.includes(item));
    return k < 0 ? null : seq.months[k];
  }));
  return kendallW(rows, opts);
}

// ─── 4. The typical sequence ───────────────────────────────────────────────

/**
 * The typical first-to-last order. Candidates are items that change in at
 * least `minSupportEpisodes` episodes. Within each episode the candidates
 * present are ranked by their first change (ties averaged); each step's
 * order key is its median rank over the episodes where it appears, then
 * the median months before the peak (more = earlier), then frequency, then
 * name. Kendall's W over the same candidates (missing tied last) says how
 * much the bears agree on that order.
 */
export function typicalSequence(sequences: EpisodeSequence[], opts: { minSupportEpisodes?: number; maxSteps?: number } = {}): TypicalSequence {
  const minSup = opts.minSupportEpisodes ?? A("seq.minSupportEpisodes");
  const nEp = sequences.length;
  const presence = new Map<string, number>();
  for (const seq of sequences) for (const item of Array.from(new Set(seq.itemsets.flat()))) presence.set(item, (presence.get(item) ?? 0) + 1);
  const candidates = Array.from(presence.keys()).filter(i => presence.get(i)! >= minSup).sort(cmp);

  const ranks = new Map<string, number[]>();
  const before = new Map<string, number[]>();
  const eras = new Map<string, Array<SequenceEraId | null>>();
  for (const seq of sequences) {
    const present = candidates
      .map(item => ({ item, k: seq.itemsets.findIndex(set => set.includes(item)) }))
      .filter(x => x.k >= 0);
    const { ranks: r } = averageRanks(present.map(x => seq.months[x.k]));
    const peakIdx = sequenceMonthIndex(seq.peak);
    present.forEach((x, q) => {
      ranks.set(x.item, [...(ranks.get(x.item) ?? []), r[q]]);
      before.set(x.item, [...(before.get(x.item) ?? []), peakIdx - seq.months[x.k]]);
      eras.set(x.item, [...(eras.get(x.item) ?? []), seq.era]);
    });
  }
  const rows = candidates.map(item => ({
    item,
    medianRank: median(ranks.get(item) ?? []) ?? Infinity,
    episodes: presence.get(item)!,
    frequency: nEp ? round3(presence.get(item)! / nEp) : 0,
    medianMonthsBeforePeak: median(before.get(item) ?? []) ?? 0,
    eras: eraCounts(eras.get(item) ?? []),
  }));
  rows.sort((a, b) => a.medianRank - b.medianRank || b.medianMonthsBeforePeak - a.medianMonthsBeforePeak || b.frequency - a.frequency || cmp(a.item, b.item));
  const steps: TypicalStep[] = rows.slice(0, opts.maxSteps ?? rows.length).map((r, i) => ({ step: i + 1, ...r }));
  const kendall = orderConsistency(sequences, steps.map(s => s.item), { missing: "tieLast" });
  const consistent = kendall.W !== null && kendall.W >= A("seq.minKendallW");
  const reading = steps.length
    ? `Typical order over ${nEp} bears: ${steps.map(s => `${s.step}. ${s.item} (${s.episodes}/${nEp}, ~${s.medianMonthsBeforePeak} m before)`).join("; ")}. ${kendall.reading} ${consistent ? "Consistent" : "Not consistent"} at the W ≥ ${A("seq.minKendallW")} cut [seq.minKendallW].`
    : `No item changed in at least ${minSup} of ${nEp} bears; no typical order.`;
  return { steps, episodes: nEp, kendall, consistent, reading };
}

// ─── 5. Precision against non-bear windows ─────────────────────────────────

function lnFactorial(n: number): number {
  let s = 0;
  for (let k = 2; k <= n; k++) s += Math.log(k);
  return s;
}

/** One-sided Fisher exact test: P(X ≥ a) for X hypergeometric with rows (a+b, c+d) and column a+c. */
export function fisherOneSided(a: number, b: number, c: number, d: number): number {
  const n1 = a + b, n2 = c + d, k = a + c, N = n1 + n2;
  const lnC = (n: number, r: number) => lnFactorial(n) - lnFactorial(r) - lnFactorial(n - r);
  const denom = lnC(N, k);
  let p = 0;
  for (let x = a; x <= Math.min(n1, k); x++) p += Math.exp(lnC(n1, x) + lnC(n2, k - x) - denom);
  return Math.min(1, p);
}

/**
 * Is an ordered pattern a warning, or just something that always happens?
 * Counts the bear episodes and the non-bear control windows that contain
 * it in order. Predictive only if it clears `seq.minSupportEpisodes` in the
 * bears AND its lift (bear rate / control rate, Haldane-corrected) clears
 * `combo.minLift`. Without controls it is never called predictive.
 */
export function sequencePrecision(pattern: string[], allSequences: SequenceInput[], nonBear: SequenceInput[]): SequencePrecision {
  const a = allSequences.filter(s => containsPattern(s, pattern)).length;
  const n1 = allSequences.length;
  const c = nonBear.filter(s => containsPattern(s, pattern)).length;
  const n2 = nonBear.length;
  const bearRate = n1 ? round3(a / n1) : null;
  const nonBearRate = n2 ? round3(c / n2) : null;
  const precision = a + c ? round3(a / (a + c)) : null;
  const baseRate = n1 + n2 ? round3(n1 / (n1 + n2)) : null;
  const lift = n1 && n2 ? round3(((a + 0.5) / (n1 + 1)) / ((c + 0.5) / (n2 + 1))) : null;
  const fisherP = n1 && n2 ? fisherOneSided(a, n1 - a, c, n2 - c) : null;
  const minSup = A("seq.minSupportEpisodes");
  const minLift = A("combo.minLift");
  const predictive = lift !== null && a >= minSup && lift >= minLift;
  const label = pattern.join(" → ");
  const reading = !n2
    ? `${label}: in ${a}/${n1} bears; no control windows, so whether it is a warning is unknown.`
    : `${label}: in ${a}/${n1} bears vs ${c}/${n2} non-bear windows (lift ${lift}, precision ${precision ?? "n/a"} vs base ${baseRate}, Fisher p ${fisherP!.toPrecision(3)}). ${predictive ? "Predictive" : a < minSup ? `Too rare in bears (need ≥ ${minSup}) [seq.minSupportEpisodes]` : `Not predictive: appears about as often outside bears (need lift ≥ ${minLift}) [combo.minLift]`}.`;
  return { pattern, bearHits: a, bearEpisodes: n1, nonBearHits: c, nonBearWindows: n2, bearRate, nonBearRate, precision, baseRate, lift, fisherP, predictive, reading };
}

// ─── 6. Dominoes: extend emergentPatterns' dominoChains ────────────────────

/** Two-sided Wilson interval lower bound for k successes in n. */
export function sequenceWilsonLower(k: number, n: number, z: number = A("seq.wilsonZ")): number {
  if (!n) return 0;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const half = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return Math.max(0, (centre - half) / d);
}

/**
 * Mined patterns (length ≥ 2) in the `DominoChain` shape: path = items in
 * order, lags = median months between steps, strength = episode support
 * share, confidence = 100 × the Wilson lower bound of that share
 * [seq.wilsonZ]. A precision map (from `sequencePrecision`) multiplies
 * strength by min(1, lift / combo.minLift), so a chain that is as common
 * outside bears as inside it is ranked down.
 */
export function sequenceDominoes(patterns: SequentialPattern[], totalEpisodes: number, precision?: Map<string, SequencePrecision>): DominoChain[] {
  return patterns
    .filter(p => p.items.length >= 2)
    .map(p => {
      const lags = p.medianLags.map(l => l ?? 0);
      const pr = precision?.get(p.items.join(">"));
      const damp = pr && pr.lift !== null ? Math.min(1, pr.lift / A("combo.minLift")) : 1;
      const share = totalEpisodes ? p.support / totalEpisodes : 0;
      return {
        path: p.items,
        lags,
        totalLagMonths: lags.reduce((s, x) => s + x, 0),
        strength: round3(share * damp),
        confidence: Math.round(100 * sequenceWilsonLower(p.support, totalEpisodes)),
        reading: `[sequence, ${p.support}/${totalEpisodes} bears] ` + p.items.map((id, i) => (i === 0 ? id : `→ (${lags[i - 1]} m) ${id}`)).join(" ") + (pr ? ` — lift ${pr.lift ?? "n/a"} vs non-bear windows` : ""),
      };
    })
    .sort((x, y) => y.strength - x.strength || y.path.length - x.path.length || cmp(x.path.join(">"), y.path.join(">")));
}

/**
 * Lead-lag chains (from `dominoChains`) and sequence chains side by side,
 * ranked by |strength| then confidence, one row per distinct path (a path
 * found by both keeps the lead-lag row and notes the sequence support).
 */
export function mergeDominoes(leadLag: DominoChain[], sequence: DominoChain[], maxChains = 25): DominoChain[] {
  const byPath = new Map<string, DominoChain>();
  for (const ch of leadLag) byPath.set(ch.path.join(">"), ch);
  for (const ch of sequence) {
    const k = ch.path.join(">");
    const prior = byPath.get(k);
    if (prior) byPath.set(k, { ...prior, reading: `${prior.reading} ${ch.reading}` });
    else byPath.set(k, ch);
  }
  return Array.from(byPath.values())
    .sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength) || b.confidence - a.confidence || cmp(a.path.join(">"), b.path.join(">")))
    .slice(0, maxChains);
}

// ─── χ² survival (for W's p-value) ─────────────────────────────────────────

function lnGamma(x: number): number {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const c of g) ser += c / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/** Regularized upper incomplete gamma Q(a, x) (Numerical Recipes gammq). */
function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  const gln = lnGamma(a);
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 0; n < 500; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
    }
    return Math.max(0, 1 - sum * Math.exp(-x + a * Math.log(x) - gln));
  }
  let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c;
    if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return Math.min(1, Math.exp(-x + a * Math.log(x) - gln) * h);
}

/** P(χ²_df ≥ x). */
export function chiSquareSurvival(x: number, df: number): number {
  if (df <= 0) return 1;
  return gammaQ(df / 2, x / 2);
}
