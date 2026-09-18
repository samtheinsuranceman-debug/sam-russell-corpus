// ─── Historical Market Regime Engine ────────────────────────────────────────
// Classifies each year of the public record into a market regime, then lets a
// projection resample history CONDITIONED on regime rather than drawing blindly
// from the whole record.
//
// Why this exists. A plain block bootstrap treats 1979 and 2013 as equally
// likely neighbours for the year ahead. They are not. Inflation, policy rates
// and asset prices move in persistent states, and a household sitting in a
// rate-shock year faces a different distribution from one sitting in an
// expansion. Sampling without that conditioning produces a fan that is too
// narrow in the tails and too wide in the middle — it understates the run of
// bad years that actually ruins a plan.
//
// Modelling decisions worth knowing, because they change the numbers:
//
//  · Classification is RULE-BASED and every threshold is named below. No fitted
//    model, no hidden state. A regime label can be checked against the year it
//    describes by anyone holding the same series.
//  · A year can satisfy several rules. Precedence is fixed and documented in
//    REGIME_PRECEDENCE — deflation and stagflation outrank the single-factor
//    labels because they are the states that break the ordinary relationships.
//  · The transition matrix is estimated from observed year-to-year moves. Where
//    a regime appears fewer than MIN_OBSERVATIONS times, its row is reported
//    but flagged `sparse` — a matrix row built on three observations is a
//    description of three years, not a probability.
//  · Conditioned resampling draws whole blocks whose FIRST year carries the
//    drawn regime, preserving the within-block sequence. Shuffling years inside
//    a regime would destroy the autocorrelation the regime exists to capture.
//  · Where the record cannot classify a year — any input series blank — the
//    year is labelled "unclassified" and excluded from sampling rather than
//    defaulted to expansion. Defaulting to the benign state is how a model
//    quietly becomes optimistic.
//
// Everything here is pure. Series arrive from the evidence adapters
// (server/zipData.ts, server/rentalData.ts, server/_core/fred.ts); this file
// never fetches.

import type { AnnualSeries, Evidence } from "./rentalMarketEngine";
import { valueAt, windowOf } from "./rentalMarketEngine";

/* ═══ Regimes ══════════════════════════════════════════════════════════════ */

export type Regime =
  | "deflation"        // prices falling outright
  | "stagflation"      // high inflation with stalled or negative real growth
  | "inflation-shock"  // high inflation, growth intact
  | "rate-shock"       // policy rate rising steeply
  | "contraction"      // real asset values falling
  | "recovery"         // first growth years after a contraction
  | "bubble"           // asset growth far above its own long-run pace
  | "expansion"        // the ordinary state
  | "unclassified";    // the record is blank for this year

export const REGIMES: readonly Regime[] = [
  "deflation", "stagflation", "inflation-shock", "rate-shock",
  "contraction", "recovery", "bubble", "expansion", "unclassified",
];

/** Applied in this order; the first rule a year satisfies wins. */
export const REGIME_PRECEDENCE: readonly Regime[] = [
  "deflation", "stagflation", "inflation-shock", "rate-shock",
  "contraction", "bubble", "recovery", "expansion",
];

/* ═══ Thresholds ═══════════════════════════════════════════════════════════
 * Named, not buried. Each is a defensible convention, and each is reported in
 * the evidence string so a reader can disagree with a specific number rather
 * than with "the model". */

export type RegimeThresholds = {
  /** CPI year-over-year below this is deflation. */
  deflationCpi: number;
  /** CPI year-over-year at or above this is an inflation shock. */
  highCpi: number;
  /** Real asset growth at or below this, with high CPI, is stagflation. */
  stagnantRealGrowth: number;
  /** Policy-rate rise over the trailing window, in percentage points, that marks a rate shock. */
  rateShockRise: number;
  /** Trailing window, in years, over which the rate rise is measured. */
  rateShockWindow: number;
  /** Nominal asset growth at or below this is a contraction. */
  contractionGrowth: number;
  /** Asset growth above this multiple of the long-run mean, for two consecutive years, is a bubble. */
  bubbleMultiple: number;
  /** Years after a contraction that count as recovery, while growth is positive. */
  recoveryYears: number;
};

export const DEFAULT_THRESHOLDS: RegimeThresholds = {
  deflationCpi: 0,
  highCpi: 0.05,
  stagnantRealGrowth: 0,
  rateShockRise: 0.02,
  rateShockWindow: 2,
  contractionGrowth: 0,
  bubbleMultiple: 2,
  recoveryYears: 2,
};

/** A regime row must be seen at least this often before its transition row is treated as a rate. */
export const MIN_OBSERVATIONS = 5;

/* ═══ Inputs and outputs ═══════════════════════════════════════════════════ */

export type RegimeInput = {
  /** Consumer prices, index level or rate level — growth is taken year over year. */
  cpi: AnnualSeries | null;
  /** Asset the household actually holds: a home price index, an equity index, or both blended upstream. */
  assetIndex: AnnualSeries | null;
  /** Policy or benchmark rate, as a decimal (0.0525 = 5.25%). Optional: without it, rate-shock is never labelled. */
  policyRate?: AnnualSeries | null;
};

export type RegimeYear = {
  year: number;
  regime: Regime;
  /** Why this label, in one sentence a reader can check against the year. */
  basis: string;
  cpiGrowth: number | null;
  assetGrowth: number | null;
  realAssetGrowth: number | null;
  policyRate: number | null;
  rateRise: number | null;
};

export type RegimeStats = {
  regime: Regime;
  years: number;
  yearsList: number[];
  meanAssetGrowth: number | null;
  worstAssetGrowth: number | null;
  meanCpiGrowth: number | null;
  /** True when this regime was seen fewer than MIN_OBSERVATIONS times. */
  sparse: boolean;
};

export type TransitionRow = {
  from: Regime;
  observations: number;
  sparse: boolean;
  /** Probability of moving to each regime next year; sums to 1 when observations > 0. */
  to: Record<Regime, number>;
};

export type RegimeClassification = {
  years: RegimeYear[];
  stats: RegimeStats[];
  transitions: TransitionRow[];
  evidence: Evidence;
  /** Years the record could not classify, and therefore excluded from sampling. */
  unclassifiedYears: number[];
};

/* ═══ Helpers ══════════════════════════════════════════════════════════════ */

const mean = (xs: number[]): number | null =>
  xs.length === 0 ? null : xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;

function emptyToRow(): Record<Regime, number> {
  const r = {} as Record<Regime, number>;
  for (let i = 0; i < REGIMES.length; i++) r[REGIMES[i]] = 0;
  return r;
}

/** Growth series aligned so index i is the growth INTO year startYear + i + 1. */
function growthAt(s: AnnualSeries | null | undefined, year: number): number | null {
  if (!s) return null;
  const prev = valueAt(s, year - 1), cur = valueAt(s, year);
  return prev != null && cur != null && prev > 0 ? cur / prev - 1 : null;
}

/** Rise in the rate level over the trailing window, in decimal points. */
function riseOver(s: AnnualSeries | null | undefined, year: number, window: number): number | null {
  if (!s) return null;
  const then = valueAt(s, year - window), now = valueAt(s, year);
  return then != null && now != null ? now - then : null;
}

/* ═══ Classification ═══════════════════════════════════════════════════════ */

/**
 * Label every year the record covers.
 *
 * The two-pass shape is deliberate: contraction must be known before recovery
 * can be labelled, because recovery is defined relative to the contraction that
 * preceded it, and a single forward pass cannot see backwards.
 */
export function classifyRegimes(
  input: RegimeInput,
  thresholds: RegimeThresholds = DEFAULT_THRESHOLDS,
): RegimeClassification {
  const wCpi = windowOf(input.cpi);
  const wAsset = windowOf(input.assetIndex);
  const from = Math.max(wCpi ? wCpi.from : -Infinity, wAsset ? wAsset.from : -Infinity) + 1;
  const to = Math.min(wCpi ? wCpi.to : Infinity, wAsset ? wAsset.to : Infinity);

  const years: RegimeYear[] = [];
  const unclassified: number[] = [];

  if (!isFinite(from) || !isFinite(to) || to < from) {
    return {
      years: [], stats: [], transitions: [], unclassifiedYears: [],
      evidence: {
        source: "no overlapping record",
        asOf: "",
        window: null,
        method: "CPI and asset series do not overlap by at least two years; nothing classified.",
      },
    };
  }

  // Pass one: everything except recovery.
  const longRunGrowths: number[] = [];
  for (let y = from; y <= to; y++) {
    const g = growthAt(input.assetIndex, y);
    if (g != null) longRunGrowths.push(g);
  }
  const longRunMean = mean(longRunGrowths);

  for (let y = from; y <= to; y++) {
    const cpiGrowth = growthAt(input.cpi, y);
    const assetGrowth = growthAt(input.assetIndex, y);
    const policyRate = input.policyRate ? valueAt(input.policyRate, y) : null;
    const rateRise = riseOver(input.policyRate, y, thresholds.rateShockWindow);
    const realAssetGrowth =
      assetGrowth != null && cpiGrowth != null ? (1 + assetGrowth) / (1 + cpiGrowth) - 1 : null;

    if (cpiGrowth == null || assetGrowth == null) {
      unclassified.push(y);
      years.push({
        year: y, regime: "unclassified",
        basis: "The record is blank for at least one input series in this year; excluded from sampling rather than assumed benign.",
        cpiGrowth, assetGrowth, realAssetGrowth, policyRate, rateRise,
      });
      continue;
    }

    let regime: Regime = "expansion";
    let basis = "No shock rule met: prices, rates and asset values all inside their ordinary ranges.";

    const prevGrowth = growthAt(input.assetIndex, y - 1);
    const bubbleNow =
      longRunMean != null && longRunMean > 0 &&
      assetGrowth >= longRunMean * thresholds.bubbleMultiple &&
      prevGrowth != null && prevGrowth >= longRunMean * thresholds.bubbleMultiple;

    if (cpiGrowth < thresholds.deflationCpi) {
      regime = "deflation";
      basis = "Consumer prices fell outright (" + pct(cpiGrowth) + "), which inverts the ordinary relationship between debt and inflation.";
    } else if (cpiGrowth >= thresholds.highCpi && realAssetGrowth != null && realAssetGrowth <= thresholds.stagnantRealGrowth) {
      regime = "stagflation";
      basis = "Inflation at " + pct(cpiGrowth) + " with real asset growth of " + pct(realAssetGrowth) + " — prices rising while real values did not.";
    } else if (cpiGrowth >= thresholds.highCpi) {
      regime = "inflation-shock";
      basis = "Inflation at " + pct(cpiGrowth) + ", at or above the " + pct(thresholds.highCpi) + " shock threshold, with real growth intact.";
    } else if (rateRise != null && rateRise >= thresholds.rateShockRise) {
      regime = "rate-shock";
      basis = "The benchmark rate rose " + pct(rateRise) + " over " + thresholds.rateShockWindow + " years, at or above the " + pct(thresholds.rateShockRise) + " shock threshold.";
    } else if (assetGrowth <= thresholds.contractionGrowth) {
      regime = "contraction";
      basis = "Asset values fell " + pct(assetGrowth) + " in nominal terms.";
    } else if (bubbleNow) {
      regime = "bubble";
      basis = "Asset growth of " + pct(assetGrowth) + " for a second consecutive year, at or above " + thresholds.bubbleMultiple + "× the record's long-run mean of " + pct(longRunMean!) + ".";
    }

    years.push({ year: y, regime, basis, cpiGrowth, assetGrowth, realAssetGrowth, policyRate, rateRise });
  }

  // Pass two: recovery — positive growth within recoveryYears of a contraction,
  // and only where pass one left the year as ordinary expansion.
  for (let i = 0; i < years.length; i++) {
    if (years[i].regime !== "expansion") continue;
    const g = years[i].assetGrowth;
    if (g == null || g <= 0) continue;
    for (let back = 1; back <= thresholds.recoveryYears; back++) {
      const prior = years[i - back];
      if (!prior) break;
      if (prior.regime === "contraction") {
        years[i].regime = "recovery";
        years[i].basis = "Asset values grew " + pct(g) + " within " + back + " year(s) of the contraction of " + prior.year + ".";
        break;
      }
    }
  }

  const stats = summarize(years);
  const transitions = transitionMatrix(years);

  const sourceBits: string[] = [];
  if (input.cpi) sourceBits.push("CPI");
  if (input.assetIndex) sourceBits.push("asset index");
  if (input.policyRate) sourceBits.push("benchmark rate");

  return {
    years, stats, transitions, unclassifiedYears: unclassified,
    evidence: {
      source: sourceBits.join(" + ") + " (series supplied by the evidence adapters)",
      asOf: String(to),
      window: { from: from, to: to },
      method:
        "Rule-based classification, precedence " + REGIME_PRECEDENCE.join(" > ") +
        "; thresholds: deflation CPI < " + pct(thresholds.deflationCpi) +
        ", inflation shock ≥ " + pct(thresholds.highCpi) +
        ", rate shock ≥ " + pct(thresholds.rateShockRise) + " over " + thresholds.rateShockWindow + "y" +
        ", contraction growth ≤ " + pct(thresholds.contractionGrowth) +
        ", bubble ≥ " + thresholds.bubbleMultiple + "× long-run mean for 2 consecutive years" +
        (input.policyRate ? "" : "; no rate series supplied, so rate-shock was never labelled"),
    },
  };
}

function pct(x: number): string {
  return (x * 100).toFixed(1) + "%";
}

/* ═══ Statistics and transitions ═══════════════════════════════════════════ */

export function summarize(years: RegimeYear[]): RegimeStats[] {
  const out: RegimeStats[] = [];
  for (let i = 0; i < REGIMES.length; i++) {
    const regime = REGIMES[i];
    const rows = years.filter(function (y) { return y.regime === regime; });
    if (rows.length === 0) continue;
    const assetGrowths: number[] = [];
    const cpiGrowths: number[] = [];
    for (let j = 0; j < rows.length; j++) {
      if (rows[j].assetGrowth != null) assetGrowths.push(rows[j].assetGrowth as number);
      if (rows[j].cpiGrowth != null) cpiGrowths.push(rows[j].cpiGrowth as number);
    }
    out.push({
      regime,
      years: rows.length,
      yearsList: rows.map(function (r) { return r.year; }),
      meanAssetGrowth: mean(assetGrowths),
      worstAssetGrowth: assetGrowths.length ? Math.min.apply(Math, assetGrowths) : null,
      meanCpiGrowth: mean(cpiGrowths),
      sparse: regime !== "unclassified" && rows.length < MIN_OBSERVATIONS,
    });
  }
  return out;
}

/**
 * Observed year-to-year regime moves, as rates.
 *
 * Unclassified years break the chain rather than bridging it: a transition
 * across a gap in the record is not an observation, it is a guess.
 */
export function transitionMatrix(years: RegimeYear[]): TransitionRow[] {
  const counts: Record<string, Record<Regime, number>> = {};
  const totals: Record<string, number> = {};

  for (let i = 1; i < years.length; i++) {
    const a = years[i - 1], b = years[i];
    if (a.regime === "unclassified" || b.regime === "unclassified") continue;
    if (b.year !== a.year + 1) continue;
    if (!counts[a.regime]) { counts[a.regime] = emptyToRow(); totals[a.regime] = 0; }
    counts[a.regime][b.regime] += 1;
    totals[a.regime] += 1;
  }

  const rows: TransitionRow[] = [];
  for (let i = 0; i < REGIMES.length; i++) {
    const from = REGIMES[i];
    if (from === "unclassified" || !counts[from]) continue;
    const n = totals[from];
    const to = emptyToRow();
    for (let j = 0; j < REGIMES.length; j++) {
      const r = REGIMES[j];
      to[r] = n > 0 ? counts[from][r] / n : 0;
    }
    rows.push({ from, observations: n, sparse: n < MIN_OBSERVATIONS, to });
  }
  return rows;
}

/* ═══ Regime-conditioned resampling ════════════════════════════════════════ */

/** Deterministic PRNG — the same seed must always produce the same fan. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RegimePathResult = {
  paths: number[][];
  /** For each path, the regime drawn for each block — so a chart can say which history it walked. */
  regimeTrace: Regime[][];
  evidence: Evidence;
  reason?: string;
};

/**
 * Build growth paths by drawing blocks conditioned on regime.
 *
 * The chain starts in `startRegime`, walks the transition matrix to choose each
 * next regime, and draws a block of consecutive historical years whose first
 * year carries that regime. When a regime has no usable block — it never occurs
 * early enough in the record to start one — the draw falls back to the whole
 * record and the fallback is counted, then reported in the method string. A
 * silent fallback would make a conditioned fan indistinguishable from an
 * unconditioned one.
 */
export function regimeConditionedPaths(
  classification: RegimeClassification,
  opts: {
    horizon: number;
    paths?: number;
    blockYears?: number;
    startRegime?: Regime;
    seed?: number;
  },
): RegimePathResult {
  const horizon = opts.horizon;
  const nPaths = opts.paths == null ? 10000 : opts.paths;
  const block = opts.blockYears == null ? 5 : opts.blockYears;
  const seed = opts.seed == null ? 42 : opts.seed;

  const usable = classification.years.filter(function (y) {
    return y.regime !== "unclassified" && y.assetGrowth != null;
  });

  if (usable.length < block * 2) {
    return {
      paths: [], regimeTrace: [],
      evidence: {
        source: classification.evidence.source,
        asOf: classification.evidence.asOf,
        window: classification.evidence.window,
        method: "Not run.",
      },
      reason: "The classified record holds " + usable.length + " usable years; at least " + block * 2 + " are required to draw blocks of " + block + ".",
    };
  }

  // Index of block start positions by the regime of their first year.
  const startsByRegime: Record<string, number[]> = {};
  const allStarts: number[] = [];
  for (let i = 0; i + block <= usable.length; i++) {
    // A block must be a run of consecutive years, or it splices unrelated history.
    let contiguous = true;
    for (let k = 1; k < block; k++) {
      if (usable[i + k].year !== usable[i + k - 1].year + 1) { contiguous = false; break; }
    }
    if (!contiguous) continue;
    const r = usable[i].regime;
    if (!startsByRegime[r]) startsByRegime[r] = [];
    startsByRegime[r].push(i);
    allStarts.push(i);
  }

  if (allStarts.length === 0) {
    return {
      paths: [], regimeTrace: [],
      evidence: { ...classification.evidence, method: "Not run." },
      reason: "No contiguous run of " + block + " classified years exists in the record.",
    };
  }

  const transitionByFrom: Record<string, TransitionRow> = {};
  for (let i = 0; i < classification.transitions.length; i++) {
    transitionByFrom[classification.transitions[i].from] = classification.transitions[i];
  }

  const rand = mulberry32(seed);
  const paths: number[][] = [];
  const traces: Regime[][] = [];
  let fallbacks = 0;
  let draws = 0;

  const openingRegime: Regime = opts.startRegime || mostRecentRegime(classification) || "expansion";

  for (let p = 0; p < nPaths; p++) {
    const path: number[] = [];
    const trace: Regime[] = [];
    let regime: Regime = openingRegime;

    while (path.length < horizon) {
      draws += 1;
      let starts = startsByRegime[regime];
      if (!starts || starts.length === 0) { starts = allStarts; fallbacks += 1; }
      const start = starts[Math.floor(rand() * starts.length)];
      trace.push(regime);
      for (let k = 0; k < block && path.length < horizon; k++) {
        path.push(usable[start + k].assetGrowth as number);
      }
      // The regime for the next block follows the observed chain from the
      // regime of the LAST year drawn, not the one we asked for — that is the
      // state the path actually ended in.
      const endedIn = usable[Math.min(start + block - 1, usable.length - 1)].regime;
      regime = nextRegime(transitionByFrom[endedIn], rand) || endedIn;
    }
    paths.push(path);
    traces.push(trace);
  }

  const fallbackShare = draws > 0 ? fallbacks / draws : 0;

  return {
    paths,
    regimeTrace: traces,
    evidence: {
      source: classification.evidence.source,
      asOf: classification.evidence.asOf,
      window: classification.evidence.window,
      method:
        nPaths + " paths, " + block + "-year blocks drawn conditioned on regime, seed " + seed +
        ", opening in " + openingRegime +
        "; " + (fallbackShare * 100).toFixed(1) + "% of draws fell back to the unconditioned record" +
        (fallbackShare > 0.25 ? " — high enough that this fan is only partly conditioned" : ""),
    },
    reason: fallbackShare > 0.25
      ? "More than a quarter of draws could not find a block starting in the drawn regime; treat the conditioning as weak."
      : undefined,
  };
}

/** The regime of the last classified year — the state a projection actually starts from. */
export function mostRecentRegime(c: RegimeClassification): Regime | null {
  for (let i = c.years.length - 1; i >= 0; i--) {
    if (c.years[i].regime !== "unclassified") return c.years[i].regime;
  }
  return null;
}

function nextRegime(row: TransitionRow | undefined, rand: () => number): Regime | null {
  if (!row || row.observations === 0) return null;
  const r = rand();
  let cum = 0;
  for (let i = 0; i < REGIMES.length; i++) {
    cum += row.to[REGIMES[i]];
    if (r <= cum) return REGIMES[i];
  }
  return null;
}

/** Percentile across paths, taken independently at each step — the standard fan. */
export function percentilePath(paths: number[][], q: number): number[] {
  if (paths.length === 0) return [];
  const horizon = paths[0].length;
  const out: number[] = [];
  for (let t = 0; t < horizon; t++) {
    const col: number[] = [];
    for (let p = 0; p < paths.length; p++) col.push(paths[p][t]);
    col.sort(function (a, b) { return a - b; });
    const idx = Math.min(col.length - 1, Math.max(0, Math.floor(q * (col.length - 1))));
    out.push(col[idx]);
  }
  return out;
}

/** Compounded level path from a growth path, starting at 1. */
export function compound(growth: number[]): number[] {
  const out: number[] = [];
  let level = 1;
  for (let i = 0; i < growth.length; i++) { level *= 1 + growth[i]; out.push(level); }
  return out;
}
