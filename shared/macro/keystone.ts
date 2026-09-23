/**
 * The keystone engine — "a large object that hardly ever moves, and when it
 * moves all hell breaks loose" (Sam). Study question Q5, agents A14 + A15.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A keystone is a slow indicator (rare state changes, long stretches without
 * moving) whose moves are followed by a burst of state changes across the
 * other indicators. 04_THE_100_INDICATOR_REVERSE_TIME_STUDY.md §5 Q5
 * pre-registers four tests, run per era:
 *
 *   1. Rarity           `rarity()`  — median dwell ≥ 36 months, few flips.
 *   2. Cascade          `cascadeMultiplier()` / `cascadeProfile()` — share of
 *                       the other indicators changing state 3/6/12/24 months
 *                       after a move ÷ the same share after an average month
 *                       of the same era; ≥ 2 passes. `selfExcitation()` is the
 *                       Hawkes (1971) check of the same thing in intensity form.
 *   3. Bear odds        `bearOdds()` — bear-start probability within 24 months
 *                       of a move against the era's unconditional rate.
 *   4. Warning          `criticalSlowingDown()` — rising lag-1 autocorrelation
 *                       and variance over the 24–60 months before the move
 *                       (Scheffer et al. 2009; Dakos et al. 2008, 2012).
 *
 * `pelt()` dates moves on a level series (Killick, Fearnhead & Eckley 2012)
 * when state flips are too coarse. `keystoneVerdict()` runs all four per era
 * and says "headline" only when every test passes in every era with data.
 *
 * Conventions
 *  - Every series is aligned to one integer month axis (use `monthIndexOf`).
 *    An era is the half-open range [start, end).
 *  - Unknown stays unknown: a test without enough data returns "unknown" and
 *    null numbers, never a guessed value, and "unknown" is never a pass.
 *  - Every threshold is a row in `assumptions.ts` (prefix `keystone.`), read
 *    through `A()`; `keystoneAssumptions()` lists them for a ledger.
 *  - Randomness appears in exactly two places, both seeded (`mulberry32` from
 *    ./random): the permutation p-value of the cascade test and the AR(1)
 *    surrogate p-value of the warning test. Both are baselines for a null
 *    hypothesis, never data. The cascade multiplier itself uses the exact
 *    era-average baseline (the limit of random-month sampling), so it does
 *    not depend on the seed at all.
 *  - Pure: no I/O, no clock, no `process`. Map/Set iteration via Array.from.
 *
 * ─── PORT STEPS (to sam-russell-corpus/russell-capital-systems @ master) ───
 *  1. Copy `shared/macro/keystone.ts`. It imports only `./assumptions`,
 *     `./random` and `./types`.
 *  2. Append the `KEYSTONE_ROWS` block (24 rows, ids `keystone.*`) to
 *     `shared/macro/assumptions.ts` after `COMBO_ROWS`, with its
 *     `T.push(...KEYSTONE_ROWS)`. The block is self-contained; if another
 *     agent's block landed there first, append after it.
 *  3. Add `export * from "./keystone";` to `shared/macro/index.ts` after
 *     `./combinations`. No exported name collides with the existing surface or
 *     with the A09/A10/A12/A13/A17/A19 modules of 2026-09-23 (the event type is
 *     `KeystoneEvent`, not `StateEvent`, because A10's states.ts owns that name;
 *     `toKeystoneEvents()` converts A10's events).
 *  4. Copy `server/macroKeystone.test.ts` (the trunk's vitest includes
 *     `server/**` only). Run `pnpm vitest run server/macroKeystone.test.ts`
 *     and `pnpm check`.
 *  5. Wiring (A14/A15 data agents): build the event stream from A10's states
 *     with `eventsFromStates()`, the keystone's move months with `rarity()` or
 *     `pelt()`, bear starts from A09's chronology, and call `keystoneVerdict()`
 *     once per candidate. Holdout eras (before 1990) go in only after the
 *     pattern is written in PREREGISTRATION.md.
 */
import { A, assumption, type Assumption } from "./assumptions";
import { mulberry32, normal } from "./random";
import type { IsoDate } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────

/** A state label: "up" / "down" / "flat", a level bucket, a regime number. */
export type KeystoneState = string | number;
/** One state change of one indicator, stamped with its month index. */
export type KeystoneEvent = { month: number; indicatorId: string };
/** An era on the month axis, half-open: months start … end − 1. */
export type Era = { id: string; start: number; end: number };
export type TestOutcome = "pass" | "fail" | "unknown";

// ─── Month axis ───────────────────────────────────────────────────────────

/** "1990-01-31" → 1990 × 12 + 0. Any day of the month maps to the same index. */
export function monthIndexOf(asOf: IsoDate): number {
  const [y, m] = asOf.slice(0, 7).split("-").map(Number);
  return y * 12 + (m - 1);
}

/** Inverse of `monthIndexOf`, as the first of the month. */
export function isoOfMonthIndex(i: number): IsoDate {
  const y = Math.floor(i / 12);
  const m = i - y * 12 + 1;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-01`;
}

// ─── Small statistics (exported for reuse and tests) ──────────────────────

function mean(xs: readonly number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return xs.length ? s / xs.length : NaN;
}

/** Median; null for an empty list. */
export function medianOf(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const h = Math.floor(s.length / 2);
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

/** Population variance. */
export function varianceOf(xs: readonly number[]): number {
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) ** 2;
  return xs.length ? s / xs.length : NaN;
}

/** Lag-1 autocorrelation (demeaned, biased estimator as in Dakos et al. 2012). */
export function lag1Autocorrelation(xs: readonly number[]): number {
  const n = xs.length;
  if (n < 3) return NaN;
  const m = mean(xs);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const d = xs[i] - m;
    den += d * d;
    if (i > 0) num += d * (xs[i - 1] - m);
  }
  return den === 0 ? 0 : num / den;
}

/** Kendall's τ-b between two equal-length lists (ties handled). NaN if undefined. */
export function kendallTau(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length);
  let c = 0;
  let d = 0;
  let tx = 0;
  let ty = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = Math.sign(xs[j] - xs[i]);
      const b = Math.sign(ys[j] - ys[i]);
      if (a === 0 && b === 0) continue;
      if (a === 0) tx++;
      else if (b === 0) ty++;
      else if (a === b) c++;
      else d++;
    }
  }
  const den = Math.sqrt((c + d + tx) * (c + d + ty));
  return den === 0 ? NaN : (c - d) / den;
}

function linearDetrend(xs: readonly number[]): number[] {
  const n = xs.length;
  const tm = (n - 1) / 2;
  const xm = mean(xs);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (i - tm) * (xs[i] - xm);
    sxx += (i - tm) ** 2;
  }
  const b = sxx === 0 ? 0 : sxy / sxx;
  return xs.map((x, i) => x - (xm + b * (i - tm)));
}

const round = (x: number, dp = 4) => (Number.isFinite(x) ? Math.round(x * 10 ** dp) / 10 ** dp : x);

// ─── Events from states ───────────────────────────────────────────────────

/**
 * Turn aligned state arrays (e.g. `toStates()` output per indicator) into a
 * state-change event stream. A change is stamped at the first month whose
 * state differs from the last observed state; null months are skipped, so a
 * gap is not a change.
 */
export function eventsFromStates(series: Record<string, ReadonlyArray<KeystoneState | null>>): KeystoneEvent[] {
  const out: KeystoneEvent[] = [];
  for (const id of Object.keys(series)) {
    for (const m of rarity(series[id]).flipMonths) out.push({ month: m, indicatorId: id });
  }
  return out.sort((a, b) => a.month - b.month || (a.indicatorId < b.indicatorId ? -1 : 1));
}

/**
 * Adapter for A10's event stream (`shared/macro/states.ts`, `StateEvent` with
 * `month: "YYYY-MM"` and `indicator`). Structural, so this module does not
 * import states.ts; `kind` filters direction or level events if given.
 */
export function toKeystoneEvents(
  events: ReadonlyArray<{ month: string; indicator: string; kind?: string }>,
  kind?: string,
): KeystoneEvent[] {
  return events
    .filter(e => kind === undefined || e.kind === kind)
    .map(e => ({ month: monthIndexOf(e.month), indicatorId: e.indicator }))
    .sort((a, b) => a.month - b.month || (a.indicatorId < b.indicatorId ? -1 : 1));
}

// ─── Test 1: rarity ───────────────────────────────────────────────────────

export type DwellRun = { state: KeystoneState; start: number; lengthMonths: number; censored: boolean };
export type RarityResult = {
  observedMonths: number;
  runs: DwellRun[];
  /** Median observed months per run, all runs (the first and last are censored and understate). */
  medianDwellMonths: number | null;
  /** Median over uncensored runs only; null when the series never completed a run. */
  medianCompletedDwellMonths: number | null;
  flipCount: number;
  flipsPerDecade: number | null;
  /** Month indices of the flips — the keystone's moves. */
  flipMonths: number[];
  outcome: TestOutcome;
  thresholds: { minMedianDwellMonths: number; maxFlipsPerDecade: number };
};

/**
 * Rarity: how long the indicator dwells in one state and how often it flips.
 * Null months are skipped (dwell counts observed months only). `offset` is the
 * month index of `states[0]`, so flip months land on the shared axis.
 */
export function rarity(states: ReadonlyArray<KeystoneState | null>, offset = 0): RarityResult {
  const minDwell = A("keystone.rarity.minMedianDwellMonths");
  const maxFlips = A("keystone.rarity.maxFlipsPerDecade");
  const runs: DwellRun[] = [];
  const flipMonths: number[] = [];
  let observed = 0;
  for (let i = 0; i < states.length; i++) {
    const s = states[i];
    if (s === null || s === undefined) continue;
    observed++;
    const cur = runs[runs.length - 1];
    if (cur && cur.state === s) {
      cur.lengthMonths++;
    } else {
      if (cur) flipMonths.push(offset + i);
      runs.push({ state: s, start: offset + i, lengthMonths: 1, censored: false });
    }
  }
  if (runs.length) {
    runs[0].censored = true;
    runs[runs.length - 1].censored = true;
  }
  const med = medianOf(runs.map(r => r.lengthMonths));
  const medDone = medianOf(runs.filter(r => !r.censored).map(r => r.lengthMonths));
  const flipsPerDecade = observed ? (flipMonths.length / observed) * 120 : null;
  const outcome: TestOutcome =
    observed === 0 || med === null || flipsPerDecade === null
      ? "unknown"
      : med >= minDwell && flipsPerDecade <= maxFlips
        ? "pass"
        : "fail";
  return {
    observedMonths: observed,
    runs,
    medianDwellMonths: med,
    medianCompletedDwellMonths: medDone,
    flipCount: flipMonths.length,
    flipsPerDecade: flipsPerDecade === null ? null : round(flipsPerDecade),
    flipMonths,
    outcome,
    thresholds: { minMedianDwellMonths: minDwell, maxFlipsPerDecade: round(maxFlips) },
  };
}

// ─── Break dating: PELT, Gaussian mean shift ──────────────────────────────

export type PeltResult = {
  n: number;
  /** Index of the first observation of each new segment. */
  changePoints: number[];
  segments: Array<{ start: number; end: number; mean: number }>;
  penalty: number;
  sigma: number;
  minSegment: number;
};

/**
 * PELT (Killick, Fearnhead & Eckley 2012) for shifts in mean with a Gaussian
 * cost C(y_{s..t}) = Σ (y − ȳ)² / σ² (twice the negative log-likelihood up to
 * a constant). σ is estimated robustly from first differences (MAD / 0.6745
 * / √2) unless given, so the shift itself does not inflate it. Default
 * penalty β = keystone.pelt.penaltyLogNMultiplier × ln n (BIC). Pruning with
 * K = 0 is exact for this cost. O(n) expected, O(n²) worst case.
 */
export function pelt(
  values: readonly number[],
  penalty?: number,
  opts: { minSegment?: number; sigma?: number } = {},
): PeltResult {
  const n = values.length;
  const minSeg = Math.max(1, Math.round(opts.minSegment ?? A("keystone.pelt.minSegmentMonths")));
  const beta = penalty ?? A("keystone.pelt.penaltyLogNMultiplier") * Math.log(Math.max(n, 2));
  if (values.some(v => !Number.isFinite(v))) throw new Error("pelt: values must be finite numbers; drop or fill gaps first");
  let sigma = opts.sigma ?? NaN;
  if (!(sigma > 0)) {
    const diffs = values.slice(1).map((v, i) => v - values[i]);
    const med = medianOf(diffs) ?? 0;
    const mad = medianOf(diffs.map(d => Math.abs(d - med))) ?? 0;
    sigma = mad / 0.6745 / Math.SQRT2;
    if (!(sigma > 0)) sigma = Math.sqrt(varianceOf(diffs) / 2);
  }
  const whole = [{ start: 0, end: n, mean: round(mean(values)) }];
  if (n < 2 * minSeg || !(sigma > 0)) return { n, changePoints: [], segments: n ? whole : [], penalty: beta, sigma: round(sigma), minSegment: minSeg };

  const s1 = new Float64Array(n + 1);
  const s2 = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    s1[i + 1] = s1[i] + values[i];
    s2[i + 1] = s2[i] + values[i] * values[i];
  }
  const v2 = sigma * sigma;
  const cost = (s: number, t: number) => {
    const m = t - s;
    const a = s1[t] - s1[s];
    return Math.max(0, s2[t] - s2[s] - (a * a) / m) / v2;
  };
  const F = new Float64Array(n + 1).fill(Infinity);
  const last = new Int32Array(n + 1).fill(-1);
  F[0] = -beta;
  let R: number[] = [];
  for (let t = minSeg; t <= n; t++) {
    const cand = t - minSeg;
    if (cand === 0 || cand >= minSeg) R.push(cand);
    let best = Infinity;
    let arg = -1;
    const vals: number[] = [];
    for (const s of R) {
      const v = F[s] + cost(s, t) + beta;
      vals.push(v);
      if (v < best) {
        best = v;
        arg = s;
      }
    }
    F[t] = best;
    last[t] = arg;
    // Prune: s can never be optimal again once F[s] + C(s, t) > F[t] (K = 0).
    R = R.filter((_, k) => vals[k] - beta <= best);
  }
  const cps: number[] = [];
  let t = n;
  while (t > 0 && last[t] > 0) {
    cps.push(last[t]);
    t = last[t];
  }
  cps.reverse();
  const bounds = [0, ...cps, n];
  const segments = bounds.slice(0, -1).map((s, k) => ({ start: s, end: bounds[k + 1], mean: round((s1[bounds[k + 1]] - s1[s]) / (bounds[k + 1] - s)) }));
  return { n, changePoints: cps, segments, penalty: round(beta), sigma: round(sigma), minSegment: minSeg };
}

// ─── Test 2: cascade multiplier ───────────────────────────────────────────

export type CascadeResult = {
  era: string;
  windowMonths: number;
  /** Moves inside the era whose whole window fits in the era. */
  moves: number[];
  droppedMoves: number[];
  universeSize: number;
  /** Mean share of other indicators changing state in the window after a move. */
  observedShare: number | null;
  /** Same share averaged over every eligible month of the era (the random-month expectation). */
  baselineShare: number | null;
  multiplier: number | null;
  /**
   * 1 / baselineShare: the largest multiplier the era allows, reached only if
   * every other indicator moves after every keystone move. When the other
   * indicators flip often, the share after a random month is already high and
   * the ceiling falls below keystone.cascade.minMultiplier; the test then
   * cannot discriminate and reads "unknown", not "fail".
   */
  ceiling: number | null;
  /** Seeded permutation p-value: P(mean share of k random era months ≥ observed). Baseline, not data. */
  pValue: number | null;
  draws: number;
  seed: number;
  outcome: TestOutcome;
};

/** Per-month sets of indicator ids that changed state, restricted to a universe. */
function eventIndex(eventStream: readonly KeystoneEvent[], era: Era, universe: ReadonlySet<string>): Map<number, Set<string>> {
  const byMonth = new Map<number, Set<string>>();
  for (const e of eventStream) {
    if (e.month < era.start || e.month >= era.end || !universe.has(e.indicatorId)) continue;
    let s = byMonth.get(e.month);
    if (!s) byMonth.set(e.month, (s = new Set()));
    s.add(e.indicatorId);
  }
  return byMonth;
}

function resolveUniverse(eventStream: readonly KeystoneEvent[], era: Era, keystoneId?: string, universe?: readonly string[]): Set<string> {
  const ids = universe ? new Set(universe) : new Set(eventStream.filter(e => e.month >= era.start && e.month < era.end).map(e => e.indicatorId));
  if (keystoneId !== undefined) ids.delete(keystoneId);
  return ids;
}

/**
 * Cascade multiplier for one window. For a month m, the share is the number
 * of distinct other indicators with a state change in months m+1 … m+w,
 * divided by the universe size. Observed = mean share over the keystone's
 * moves; baseline = mean share over every era month whose window fits in the
 * era (exactly what random-month sampling converges to). The seeded
 * permutation draws k random era months (k = number of moves, without
 * replacement) `draws` times for a one-sided p-value.
 *
 * `keystoneId` removes the keystone's own events; `universe` fixes the
 * denominator to the indicators that exist in the era (default: those with at
 * least one event in the era, which understates the denominator for series
 * that never move and so is conservative for the share, neutral for the ratio).
 */
export function cascadeMultiplier(
  keystoneMoves: readonly number[],
  eventStream: readonly KeystoneEvent[],
  windowMonths: number,
  era: Era,
  seed: number,
  opts: { keystoneId?: string; universe?: readonly string[]; draws?: number } = {},
): CascadeResult {
  const w = Math.max(1, Math.round(windowMonths));
  const draws = Math.max(0, Math.round(opts.draws ?? A("keystone.cascade.permutationDraws")));
  const uni = resolveUniverse(eventStream, era, opts.keystoneId, opts.universe);
  const byMonth = eventIndex(eventStream, era, uni);
  const lastEligible = era.end - 1 - w; // m + w ≤ era.end − 1
  const eligible: number[] = [];
  for (let m = era.start; m <= lastEligible; m++) eligible.push(m);
  const shareAt = new Map<number, number>();
  for (const m of eligible) {
    const hit = new Set<string>();
    for (let k = 1; k <= w; k++) {
      const s = byMonth.get(m + k);
      if (s) for (const id of Array.from(s)) hit.add(id);
    }
    shareAt.set(m, uni.size ? hit.size / uni.size : 0);
  }
  const inEra = Array.from(new Set(keystoneMoves.filter(m => m >= era.start && m < era.end))).sort((a, b) => a - b);
  const moves = inEra.filter(m => shareAt.has(m));
  const droppedMoves = inEra.filter(m => !shareAt.has(m));
  const minMoves = A("keystone.minMovesPerEra");
  const base: Omit<CascadeResult, "observedShare" | "baselineShare" | "multiplier" | "ceiling" | "pValue" | "outcome"> = {
    era: era.id, windowMonths: w, moves, droppedMoves, universeSize: uni.size, draws, seed,
  };
  if (moves.length === 0 || uni.size === 0 || eligible.length === 0) {
    return { ...base, observedShare: null, baselineShare: null, multiplier: null, ceiling: null, pValue: null, outcome: "unknown" };
  }
  const observed = mean(moves.map(m => shareAt.get(m)!));
  const all = eligible.map(m => shareAt.get(m)!);
  const baseline = mean(all);
  const multiplier = baseline > 0 ? observed / baseline : null;
  let pValue: number | null = null;
  if (draws > 0) {
    const rng = mulberry32(seed);
    const k = Math.min(moves.length, all.length);
    const pool = all.slice();
    let atLeast = 0;
    for (let d = 0; d < draws; d++) {
      let s = 0;
      for (let i = 0; i < k; i++) {
        const j = i + Math.floor(rng() * (pool.length - i));
        const tmp = pool[i];
        pool[i] = pool[j];
        pool[j] = tmp;
        s += pool[i];
      }
      if (s / k >= observed - 1e-12) atLeast++;
    }
    pValue = (atLeast + 1) / (draws + 1);
  }
  const minMult = A("keystone.cascade.minMultiplier");
  const ceiling = baseline > 0 ? 1 / baseline : null;
  const outcome: TestOutcome =
    moves.length < minMoves || multiplier === null || ceiling === null || ceiling < minMult
      ? "unknown"
      : multiplier >= minMult
        ? "pass"
        : "fail";
  return {
    ...base,
    observedShare: round(observed),
    baselineShare: round(baseline),
    multiplier: multiplier === null ? null : round(multiplier),
    ceiling: ceiling === null ? null : round(ceiling),
    pValue: pValue === null ? null : round(pValue),
    outcome,
  };
}

/** The pre-registered windows, in months (3, 6, 12, 24). */
export function cascadeWindows(): number[] {
  return [A("keystone.cascade.window.3"), A("keystone.cascade.window.6"), A("keystone.cascade.window.12"), A("keystone.cascade.window.24")];
}

/** All four windows; each window gets its own derived seed so draws do not overlap. */
export function cascadeProfile(
  keystoneMoves: readonly number[],
  eventStream: readonly KeystoneEvent[],
  era: Era,
  seed: number,
  opts: { keystoneId?: string; universe?: readonly string[]; draws?: number } = {},
): CascadeResult[] {
  return cascadeWindows().map((w, i) => cascadeMultiplier(keystoneMoves, eventStream, w, era, (seed + 104729 * (i + 1)) >>> 0, opts));
}

// ─── Test 2b: Hawkes-style self-excitation ────────────────────────────────

export type SelfExcitationResult = {
  era: string;
  moves: number[];
  months: number;
  totalEvents: number;
  /** Background events per month. */
  mu: number | null;
  /** Jump in events per month in the first month after a move. */
  alpha: number | null;
  /** Kernel decay per month and its half-life. */
  beta: number | null;
  halfLifeMonths: number | null;
  /** (μ + α) / μ — the intensity jump ratio. */
  jumpRatio: number | null;
  /** Expected extra events per move, α / (1 − e^−β). */
  excessEventsPerMove: number | null;
  /** 2 (ℓ₁ − ℓ₀) against a constant-rate Poisson. */
  likelihoodRatio: number | null;
  /** Model-free check: events per month in the primary window after moves ÷ in all other months. */
  empiricalRatio: number | null;
  outcome: TestOutcome;
};

/**
 * Discrete-time Hawkes-style fit (Hawkes 1971) with the keystone's moves as
 * the exciting marks: y_t ~ Poisson(μ + α Σ_{m<t} e^{−β (t − m − 1)}), y_t the
 * number of other-indicator state changes in month t. For each half-life on a
 * grid (1 month plus the four cascade windows) (μ, α) are fitted by the EM for
 * an additive Poisson intensity (Veen & Schoenberg 2008); the half-life with
 * the highest likelihood wins. Passes when the jump ratio is at least
 * keystone.hawkes.minJumpRatio and the likelihood ratio clears
 * keystone.hawkes.lrCritical.
 */
export function selfExcitation(
  eventStream: readonly KeystoneEvent[],
  moves: readonly number[],
  opts: { era?: Era; keystoneId?: string; universe?: readonly string[] } = {},
): SelfExcitationResult {
  const evs = eventStream.filter(e => e.indicatorId !== opts.keystoneId);
  const span = [...evs.map(e => e.month), ...moves];
  const era: Era = opts.era ?? (span.length ? { id: "all", start: Math.min(...span), end: Math.max(...span) + 1 } : { id: "all", start: 0, end: 0 });
  const uni = opts.universe ? new Set(opts.universe) : null;
  const T = Math.max(0, era.end - era.start);
  const y = new Float64Array(T);
  let total = 0;
  for (const e of evs) {
    if (e.month < era.start || e.month >= era.end || (uni && !uni.has(e.indicatorId))) continue;
    y[e.month - era.start]++;
    total++;
  }
  const mv = Array.from(new Set(moves.filter(m => m >= era.start && m < era.end))).sort((a, b) => a - b);
  const empty: SelfExcitationResult = {
    era: era.id, moves: mv, months: T, totalEvents: total, mu: null, alpha: null, beta: null, halfLifeMonths: null,
    jumpRatio: null, excessEventsPerMove: null, likelihoodRatio: null, empiricalRatio: null, outcome: "unknown",
  };
  if (T === 0 || total === 0 || mv.length === 0) return empty;

  // Model-free ratio over the primary window.
  const w = A("keystone.cascade.primaryWindowMonths");
  const post = new Uint8Array(T);
  for (const m of mv) for (let k = 1; k <= w; k++) if (m - era.start + k < T) post[m - era.start + k] = 1;
  let inS = 0, inN = 0, outS = 0, outN = 0;
  for (let t = 0; t < T; t++) {
    if (post[t]) { inS += y[t]; inN++; } else { outS += y[t]; outN++; }
  }
  const empiricalRatio = inN && outN && outS > 0 ? (inS / inN) / (outS / outN) : null;

  const ybar = total / T;
  const ll0 = Array.from(y).reduce((s, yt) => s + (yt > 0 ? yt * Math.log(ybar) : 0) - ybar, 0);
  const iters = Math.round(A("keystone.hawkes.emIterations"));
  const halfLives = [1, ...cascadeWindows()];
  let best: { ll: number; mu: number; alpha: number; beta: number; h: number } | null = null;
  for (const h of halfLives) {
    const beta = Math.LN2 / h;
    const g = new Float64Array(T);
    for (const m of mv) for (let t = m - era.start + 1; t < T; t++) g[t] += Math.exp(-beta * (t - (m - era.start) - 1));
    const G = g.reduce((s, x) => s + x, 0);
    if (G <= 0) continue;
    let mu = ybar / 2 + 1e-9;
    let alpha = (ybar / 2) * (T / G) + 1e-9;
    for (let it = 0; it < iters; it++) {
      let bg = 0, ex = 0;
      for (let t = 0; t < T; t++) {
        if (y[t] === 0) continue;
        const lam = mu + alpha * g[t];
        const pb = lam > 0 ? mu / lam : 1;
        bg += y[t] * pb;
        ex += y[t] * (1 - pb);
      }
      const mu2 = bg / T;
      const a2 = ex / G;
      const done = Math.abs(mu2 - mu) <= 1e-12 * (1 + mu) && Math.abs(a2 - alpha) <= 1e-12 * (1 + alpha);
      mu = mu2;
      alpha = a2;
      if (done) break;
    }
    let ll = 0;
    for (let t = 0; t < T; t++) {
      const lam = mu + alpha * g[t];
      ll += (y[t] > 0 ? y[t] * Math.log(lam) : 0) - lam;
    }
    if (!best || ll > best.ll) best = { ll, mu, alpha, beta, h };
  }
  if (!best || !(best.mu > 0)) return { ...empty, empiricalRatio: empiricalRatio === null ? null : round(empiricalRatio) };
  const lr = Math.max(0, 2 * (best.ll - ll0));
  const jumpRatio = (best.mu + best.alpha) / best.mu;
  const outcome: TestOutcome =
    mv.length < A("keystone.minMovesPerEra")
      ? "unknown"
      : jumpRatio >= A("keystone.hawkes.minJumpRatio") && lr >= A("keystone.hawkes.lrCritical")
        ? "pass"
        : "fail";
  return {
    ...empty,
    mu: round(best.mu),
    alpha: round(best.alpha),
    beta: round(best.beta),
    halfLifeMonths: best.h,
    jumpRatio: round(jumpRatio),
    excessEventsPerMove: round(best.alpha / (1 - Math.exp(-best.beta))),
    likelihoodRatio: round(lr),
    empiricalRatio: empiricalRatio === null ? null : round(empiricalRatio),
    outcome,
  };
}

// ─── Test 3: bear odds ────────────────────────────────────────────────────

export type BearOddsResult = {
  era: string;
  horizonMonths: number;
  moves: number[];
  /** Share of moves followed by a bear-market start within the horizon. */
  conditional: number | null;
  /** Share of eligible era months followed by a bear start within the horizon. */
  unconditional: number | null;
  lift: number | null;
  /** Distinct bear markets that followed at least one move (episodes, not months). */
  distinctBears: number;
  outcome: TestOutcome;
};

/**
 * P(bear start in months m+1 … m+h | keystone moved in m) against the same
 * probability for every era month whose horizon fits in the era. Passes when
 * the lift is at least combo.minLift (the study's lift threshold everywhere).
 */
export function bearOdds(moves: readonly number[], bearStarts: readonly number[], era: Era, horizonMonths = A("keystone.bear.horizonMonths")): BearOddsResult {
  const h = Math.max(1, Math.round(horizonMonths));
  const starts = Array.from(new Set(bearStarts)).sort((a, b) => a - b);
  const follows = (m: number) => starts.filter(b => b > m && b <= m + h);
  const eligibleEnd = era.end - 1 - h;
  const mv = Array.from(new Set(moves.filter(m => m >= era.start && m <= eligibleEnd))).sort((a, b) => a - b);
  let hitMonths = 0;
  let n = 0;
  for (let m = era.start; m <= eligibleEnd; m++) {
    n++;
    if (follows(m).length) hitMonths++;
  }
  const unconditional = n ? hitMonths / n : null;
  const conditional = mv.length ? mv.filter(m => follows(m).length > 0).length / mv.length : null;
  const distinct = new Set(mv.flatMap(follows)).size;
  const lift = conditional !== null && unconditional ? conditional / unconditional : null;
  const outcome: TestOutcome =
    mv.length < A("keystone.minMovesPerEra") || lift === null ? "unknown" : lift >= A("combo.minLift") ? "pass" : "fail";
  return {
    era: era.id,
    horizonMonths: h,
    moves: mv,
    conditional: conditional === null ? null : round(conditional),
    unconditional: unconditional === null ? null : round(unconditional),
    lift: lift === null ? null : round(lift),
    distinctBears: distinct,
    outcome,
  };
}

// ─── Test 4: critical slowing down ────────────────────────────────────────

export type CsdResult = {
  moveIndex: number;
  lookbackMonths: number;
  rollingWindow: number;
  /** Kendall τ of the rolling lag-1 autocorrelation against time. */
  tauAutocorrelation: number | null;
  /** Kendall τ of the rolling variance against time. */
  tauVariance: number | null;
  /** Seeded AR(1)-surrogate p-value for τ_AC (Dakos et al. 2012). A baseline, not data. */
  pValueAutocorrelation: number | null;
  surrogates: number;
  outcome: TestOutcome;
};

function rollingTaus(resid: readonly number[], win: number): { tauAc: number; tauVar: number } {
  const ac: number[] = [];
  const vr: number[] = [];
  const time: number[] = [];
  for (let e = win; e <= resid.length; e++) {
    const seg = resid.slice(e - win, e);
    ac.push(lag1Autocorrelation(seg));
    vr.push(varianceOf(seg));
    time.push(e);
  }
  return { tauAc: kendallTau(time, ac), tauVar: kendallTau(time, vr) };
}

/**
 * Early warning before a move (Scheffer et al. 2009; Dakos et al. 2008). Take
 * the `lookback` months before `moveIndex` (clamped to the pre-registered
 * 24–60; fewer than 24 non-null months reads "unknown"), remove a linear
 * trend, compute lag-1 autocorrelation and variance in rolling windows of
 * keystone.csd.rollingWindowShare × look-back, and rank each against time
 * with Kendall τ. The autocorrelation τ is tested against seeded stationary
 * AR(1) surrogates fitted to the same residuals. Passes when both τ reach
 * keystone.csd.minTau and the surrogate p-value is at most keystone.csd.maxPValue.
 */
export function criticalSlowingDown(
  values: ReadonlyArray<number | null>,
  moveIndex: number,
  lookback = A("keystone.csd.lookbackMaxMonths"),
  opts: { seed?: number; surrogates?: number } = {},
): CsdResult {
  const minL = A("keystone.csd.lookbackMinMonths");
  const maxL = A("keystone.csd.lookbackMaxMonths");
  const want = Math.min(maxL, Math.max(minL, Math.round(lookback)));
  // Trailing run of non-null values ending the month before the move.
  const xs: number[] = [];
  for (let i = moveIndex - 1; i >= 0 && xs.length < want; i--) {
    const v = values[i];
    if (v === null || v === undefined || !Number.isFinite(v)) break;
    xs.push(v);
  }
  xs.reverse();
  const L = xs.length;
  const win = Math.max(3, Math.round(L * A("keystone.csd.rollingWindowShare")));
  const nSur = Math.max(0, Math.round(opts.surrogates ?? A("keystone.csd.surrogates")));
  const unknown: CsdResult = {
    moveIndex, lookbackMonths: L, rollingWindow: win, tauAutocorrelation: null, tauVariance: null,
    pValueAutocorrelation: null, surrogates: nSur, outcome: "unknown",
  };
  if (L < minL) return unknown;
  const resid = linearDetrend(xs);
  const { tauAc, tauVar } = rollingTaus(resid, win);
  if (!Number.isFinite(tauAc) || !Number.isFinite(tauVar)) return unknown;
  let p: number | null = null;
  if (nSur > 0) {
    const phi = Math.max(-0.99, Math.min(0.99, lag1Autocorrelation(resid)));
    const sdE = Math.sqrt(varianceOf(resid) * (1 - phi * phi));
    const rng = mulberry32(((opts.seed ?? 0) ^ (moveIndex * 2654435761)) >>> 0);
    let atLeast = 0;
    for (let k = 0; k < nSur; k++) {
      const s: number[] = [];
      let x = (sdE / Math.sqrt(1 - phi * phi)) * normal(rng);
      for (let i = 0; i < L; i++) {
        x = phi * x + sdE * normal(rng);
        s.push(x);
      }
      const t = rollingTaus(linearDetrend(s), win).tauAc;
      if (Number.isFinite(t) && t >= tauAc - 1e-12) atLeast++;
    }
    p = (atLeast + 1) / (nSur + 1);
  }
  const minTau = A("keystone.csd.minTau");
  const outcome: TestOutcome =
    tauAc >= minTau && tauVar >= minTau && (p === null || p <= A("keystone.csd.maxPValue")) ? "pass" : "fail";
  return {
    ...unknown,
    tauAutocorrelation: round(tauAc),
    tauVariance: round(tauVar),
    pValueAutocorrelation: p === null ? null : round(p),
    outcome,
  };
}

// ─── The verdict ──────────────────────────────────────────────────────────

export type KeystoneInput = {
  id: string;
  /** The keystone's state per month on the shared axis (index 0 = month 0 of the axis). */
  states: ReadonlyArray<KeystoneState | null>;
  /** Its level per month, for the warning test (and PELT dating). Absent → warning "unknown". */
  values?: ReadonlyArray<number | null>;
  /** Move months; default: the state flips found by `rarity()`. Pass `pelt(...).changePoints` to date on the level. */
  moves?: readonly number[];
  /** State changes of the other indicators; the keystone's own events are removed by id. */
  eventStream: readonly KeystoneEvent[];
  eras: readonly Era[];
  /** Bear-market start months (A09 chronology). Absent → bear test "unknown". */
  bearStarts?: readonly number[];
  /** Indicators that exist in each era, by era id (the cascade denominator). */
  universeByEra?: Readonly<Record<string, readonly string[]>>;
  seed: number;
};

export type EraVerdict = {
  era: Era;
  moves: number[];
  hasData: boolean;
  rarity: RarityResult;
  cascade: { outcome: TestOutcome; primary: CascadeResult; profile: CascadeResult[]; hawkes: SelfExcitationResult; hawkesAgrees: boolean | null };
  bear: BearOddsResult;
  warning: { outcome: TestOutcome; perMove: CsdResult[]; shareWarned: number | null };
  allFourPass: boolean;
};

export type KeystoneVerdict = {
  id: string;
  eras: EraVerdict[];
  erasWithData: string[];
  /** True only when all four tests pass in every era with data and there are enough such eras. */
  headline: boolean;
  reasons: string[];
  assumptions: Assumption[];
};

/** Every `keystone.*` rules-table row plus combo.minLift, for the evidence ledger. */
export function keystoneAssumptions(): Assumption[] {
  const ids = [
    "keystone.rarity.minMedianDwellMonths", "keystone.rarity.maxFlipsPerDecade",
    "keystone.cascade.window.3", "keystone.cascade.window.6", "keystone.cascade.window.12", "keystone.cascade.window.24",
    "keystone.cascade.primaryWindowMonths", "keystone.cascade.minMultiplier", "keystone.cascade.permutationDraws",
    "keystone.minMovesPerEra", "keystone.hawkes.minJumpRatio", "keystone.hawkes.lrCritical", "keystone.hawkes.emIterations",
    "keystone.bear.horizonMonths", "combo.minLift",
    "keystone.csd.lookbackMinMonths", "keystone.csd.lookbackMaxMonths", "keystone.csd.rollingWindowShare",
    "keystone.csd.minTau", "keystone.csd.maxPValue", "keystone.csd.surrogates", "keystone.csd.minShareOfMoves",
    "keystone.pelt.penaltyLogNMultiplier", "keystone.pelt.minSegmentMonths", "keystone.headline.minEras",
  ];
  return ids.map(assumption);
}

/**
 * Run the four pre-registered tests for one keystone candidate in every era.
 * "Headline" is said only if it is earned: every era with data (at least
 * keystone.minMovesPerEra moves) passes rarity, cascade, bear odds and warning,
 * and there are at least keystone.headline.minEras such eras. Any "unknown"
 * in an era with data blocks the headline and is named in `reasons`.
 */
export function keystoneVerdict(input: KeystoneInput): KeystoneVerdict {
  const allMoves = (input.moves ? Array.from(input.moves) : rarity(input.states).flipMonths).sort((a, b) => a - b);
  const stream = input.eventStream.filter(e => e.indicatorId !== input.id);
  const minMoves = A("keystone.minMovesPerEra");
  const reasons: string[] = [];
  const eras: EraVerdict[] = input.eras.map((era, i) => {
    const seed = (input.seed + 7919 * (i + 1)) >>> 0;
    const moves = allMoves.filter(m => m >= era.start && m < era.end);
    const universe = input.universeByEra?.[era.id];
    const rar = rarity(input.states.slice(Math.max(0, era.start), Math.max(0, era.end)), Math.max(0, era.start));
    const profile = cascadeProfile(moves, stream, era, seed, { keystoneId: input.id, universe });
    const primaryW = A("keystone.cascade.primaryWindowMonths");
    const primary = profile.find(c => c.windowMonths === primaryW) ?? cascadeMultiplier(moves, stream, primaryW, era, seed, { keystoneId: input.id, universe });
    const hawkes = selfExcitation(stream, moves, { era, keystoneId: input.id, universe });
    const hawkesAgrees = hawkes.outcome === "unknown" ? null : hawkes.outcome === primary.outcome;
    const bear = input.bearStarts
      ? bearOdds(moves, input.bearStarts, era)
      : { era: era.id, horizonMonths: A("keystone.bear.horizonMonths"), moves, conditional: null, unconditional: null, lift: null, distinctBears: 0, outcome: "unknown" as TestOutcome };
    const perMove = input.values ? moves.map(m => criticalSlowingDown(input.values!, m, undefined, { seed })) : [];
    const judged = perMove.filter(c => c.outcome !== "unknown");
    const shareWarned = judged.length ? judged.filter(c => c.outcome === "pass").length / judged.length : null;
    const warnOutcome: TestOutcome = shareWarned === null ? "unknown" : shareWarned >= A("keystone.csd.minShareOfMoves") ? "pass" : "fail";
    const hasData = moves.length >= minMoves;
    const outcomes: Array<[string, TestOutcome]> = [["rarity", rar.outcome], ["cascade", primary.outcome], ["bear odds", bear.outcome], ["warning", warnOutcome]];
    const allFourPass = outcomes.every(([, o]) => o === "pass");
    if (!hasData) reasons.push(`${era.id}: ${moves.length} move(s) < ${minMoves}; era has no data for this keystone`);
    else for (const [name, o] of outcomes) if (o !== "pass") reasons.push(`${era.id}: ${name} ${o}`);
    return {
      era: { ...era },
      moves,
      hasData,
      rarity: rar,
      cascade: { outcome: primary.outcome, primary, profile, hawkes, hawkesAgrees },
      bear,
      warning: { outcome: warnOutcome, perMove, shareWarned: shareWarned === null ? null : round(shareWarned) },
      allFourPass,
    };
  });
  const withData = eras.filter(e => e.hasData);
  const minEras = A("keystone.headline.minEras");
  if (withData.length < minEras) reasons.push(`${withData.length} era(s) with data < ${minEras} required`);
  const headline = withData.length >= minEras && withData.every(e => e.allFourPass);
  return { id: input.id, eras, erasWithData: withData.map(e => e.era.id), headline, reasons, assumptions: keystoneAssumptions() };
}
