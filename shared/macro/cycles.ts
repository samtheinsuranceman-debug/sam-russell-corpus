/**
 * Bull and bear market dating — the target every other engine predicts.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Study spec 04 §4: date bull and bear markets in a monthly price index two
 * ways, keep both, and record where they disagree without choosing.
 *
 *   "twenty-percent"   A bear market is a fall of at least 20 % from a peak
 *                      (`cycles.twenty.bearDecline`); it ends at the lowest
 *                      point before a rise of at least 20 %
 *                      (`cycles.twenty.bullRise`). A turn is only confirmed
 *                      once the opposite move has happened, so the last
 *                      extreme of the series is reported as `pending`, never
 *                      as a turn.
 *
 *   "pagan-sossounov"  Pagan & Sossounov (2003), J. Applied Econometrics
 *                      18(1): the Bry–Boschan algorithm adapted to stock
 *                      prices. Steps, in the order this module applies them:
 *                        1. Candidates: the highest (lowest) value within
 *                           `cycles.ps.window` months either side.
 *                        2. Alternation: of two adjacent peaks keep the higher,
 *                           of two adjacent troughs the lower (ties: the
 *                           earlier).
 *                        3. End censoring: drop turns within
 *                           `cycles.ps.endCensor` months of either end; drop a
 *                           first (last) peak lower than some value before
 *                           (after) it, and a first (last) trough higher than
 *                           some value before (after) it.
 *                        4. Minimum cycle: while a peak-to-peak or
 *                           trough-to-trough span is shorter than
 *                           `cycles.ps.minCycle`, remove the smaller-amplitude
 *                           of the two phases inside it (both of its turns).
 *                        5. Minimum phase: while a phase is shorter than
 *                           `cycles.ps.minPhase` and its move is smaller than
 *                           `cycles.ps.phaseOverride`, remove it (both turns).
 *                      After every removal each remaining turn is moved to the
 *                      extreme between its neighbours (a merged bear keeps the
 *                      lowest trough, a merged bull the highest peak), and
 *                      steps 2–5 repeat until nothing changes. Where the paper
 *                      leaves the choice of which turns to remove open, the
 *                      smallest-amplitude rule above is this module's choice.
 *
 * Every threshold is a row in `assumptions.ts` read through `A(id)`; nothing
 * numeric that shapes a date lives here.
 *
 * Month arithmetic. Durations are calendar months between month keys
 * ("YYYY-MM"), so "months" of a bear is trough month minus peak month. A phase
 * owns the months (start, end]: the peak month is the last month of the bull,
 * the trough month the last month of the bear. NBER contractions use the same
 * convention, so overlaps are counted on one grid.
 *
 * The series is whatever the caller passes (Shiller real or nominal S&P
 * Composite, DJIA month-ends). Daily input is reduced to month-ends with
 * `monthEndPoints`. The monthly grid must be contiguous; a gap throws, because
 * a silent gap would shorten every duration that spans it.
 *
 * NBER_CHRONOLOGY is data: the US business cycle reference dates since the
 * December 1854 trough, as published by the NBER Business Cycle Dating
 * Committee (table current after the 19 July 2021 announcement of the April
 * 2020 trough). It is a second target, not a stock-market chronology.
 *
 * ─── PORT TO THE TRUNK ───────────────────────────────────────────────────────
 *  1. Copy `shared/macro/cycles.ts`. It imports only `./types`,
 *     `./assumptions` and `./emergentPatterns` (`monthEndPoints`,
 *     `MonthlyPoint`); no I/O, no `process`, no Map/Set iteration without
 *     `Array.from`.
 *  2. Append the `CYCLE_ROWS` block (ids `cycles.*`) from this repo's
 *     `assumptions.ts` to the trunk's `shared/macro/assumptions.ts`, after
 *     `COMBO_ROWS`, with its `T.push(...CYCLE_ROWS)`.
 *  3. Add `export * from "./cycles";` to `shared/macro/index.ts`.
 *  4. Copy `server/macroCycles.test.ts` (synthetic fixtures only; no network).
 *  5. Proof of done: `pnpm check` 0; `npx vitest run server/macroCycles.test.ts`
 *     all green.
 *  6. When A02's Shiller/DJIA series land, `dateBullBear(points, rule)` for
 *     both rules, `compareRules(points)` and `nberOverlap(bears)` produce the
 *     rows of `bear_bull_chronology.csv`; that file is not generated here.
 */
import type { IsoDate } from "./types";
import { A } from "./assumptions";
import { monthEndPoints, type MonthlyPoint } from "./emergentPatterns";

export type BullBearRule = "twenty-percent" | "pagan-sossounov";
export type MarketPhase = "late-bull" | "early-bear" | "late-bear" | "early-bull";
export type TurnKind = "peak" | "trough";

/** A dated turning point. `month` is "YYYY-MM"; `asOf` is the observation that stood for that month. */
export type MarketTurn = { kind: TurnKind; month: string; asOf: IsoDate; value: number };

export type BearMarket = {
  peak: string;
  trough: string;
  peakValue: number;
  troughValue: number;
  /** troughValue / peakValue − 1 (negative; −0.25 is a 25 % fall). */
  depth: number;
  /** Calendar months from peak month to trough month. */
  months: number;
  /** Months from the trough until the index first closes at or above the peak value; null when it has not yet (unknown stays unknown). */
  recoveryMonths: number | null;
  recoveredMonth: string | null;
};

export type BullMarket = {
  trough: string;
  peak: string;
  troughValue: number;
  peakValue: number;
  /** peakValue / troughValue − 1. */
  gain: number;
  months: number;
};

export type BullBearChronology = {
  rule: BullBearRule;
  /** First and last month of the series that was dated. */
  firstMonth: string;
  lastMonth: string;
  /** Confirmed turns, alternating peak/trough, in date order. */
  turns: MarketTurn[];
  bears: BearMarket[];
  bulls: BullMarket[];
  /**
   * Twenty-percent rule only: the extreme since the last confirmed turn, which
   * the series has not (yet) moved far enough away from to confirm. Null for
   * Pagan–Sossounov, whose end censoring drops unconfirmable turns instead.
   */
  pending: MarketTurn | null;
};

// ─── month helpers ───────────────────────────────────────────────────────────

const monthOf = (d: IsoDate): string => d.slice(0, 7);

/** Calendar months from `a` to `b` (both "YYYY-MM" or ISO dates); positive when b is later. */
export function monthsBetween(a: string, b: string): number {
  const [ya, ma] = a.slice(0, 7).split("-").map(Number);
  const [yb, mb] = b.slice(0, 7).split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

function monthlyGrid(points: MonthlyPoint[]): MonthlyPoint[] {
  const m = monthEndPoints(points).filter(p => Number.isFinite(p.value) && p.value > 0);
  for (let i = 1; i < m.length; i++) {
    if (monthsBetween(m[i - 1].asOf, m[i].asOf) !== 1) {
      throw new Error(`dateBullBear: monthly grid has a gap between ${monthOf(m[i - 1].asOf)} and ${monthOf(m[i].asOf)}`);
    }
  }
  return m;
}

type Turn = { kind: TurnKind; i: number };

function toTurn(m: MonthlyPoint[], t: Turn): MarketTurn {
  return { kind: t.kind, month: monthOf(m[t.i].asOf), asOf: m[t.i].asOf, value: m[t.i].value };
}

// ─── the 20 % rule ───────────────────────────────────────────────────────────

function argExtreme(m: MonthlyPoint[], from: number, to: number, kind: TurnKind): number {
  let best = from;
  for (let j = from + 1; j <= to; j++) {
    if (kind === "peak" ? m[j].value > m[best].value : m[j].value < m[best].value) best = j;
  }
  return best;
}

function twentyPercent(m: MonthlyPoint[]): { turns: Turn[]; pending: Turn | null } {
  const fall = A("cycles.twenty.bearDecline");
  const rise = A("cycles.twenty.bullRise");
  const turns: Turn[] = [];
  if (m.length === 0) return { turns, pending: null };
  // Before the first confirmation both a running high and a running low are tracked.
  let hi = 0;
  let lo = 0;
  let state: "unknown" | "bull" | "bear" = "unknown";
  let cand = 0; // candidate peak (bull) or trough (bear)
  for (let i = 1; i < m.length; i++) {
    const v = m[i].value;
    if (state === "unknown") {
      if (v > m[hi].value) hi = i;
      if (v < m[lo].value) lo = i;
      if (v <= m[hi].value * (1 - fall)) {
        turns.push({ kind: "peak", i: hi });
        state = "bear";
        cand = argExtreme(m, hi, i, "trough");
      } else if (v >= m[lo].value * (1 + rise)) {
        turns.push({ kind: "trough", i: lo });
        state = "bull";
        cand = argExtreme(m, lo, i, "peak");
      }
      continue;
    }
    if (state === "bull") {
      if (v > m[cand].value) cand = i;
      else if (v <= m[cand].value * (1 - fall)) {
        turns.push({ kind: "peak", i: cand });
        state = "bear";
        cand = argExtreme(m, cand, i, "trough");
      }
    } else {
      if (v < m[cand].value) cand = i;
      else if (v >= m[cand].value * (1 + rise)) {
        turns.push({ kind: "trough", i: cand });
        state = "bull";
        cand = argExtreme(m, cand, i, "peak");
      }
    }
  }
  const pending: Turn | null = state === "unknown" ? null : { kind: state === "bull" ? "peak" : "trough", i: cand };
  return { turns, pending };
}

// ─── Pagan & Sossounov (2003) ────────────────────────────────────────────────

function candidates(m: MonthlyPoint[], w: number): Turn[] {
  const out: Turn[] = [];
  for (let i = 0; i < m.length; i++) {
    const lo = Math.max(0, i - w);
    const hi = Math.min(m.length - 1, i + w);
    // Ties inside the window go to the earliest month, so a plateau yields one turn.
    if (argExtreme(m, lo, hi, "peak") === i) out.push({ kind: "peak", i });
    else if (argExtreme(m, lo, hi, "trough") === i) out.push({ kind: "trough", i });
  }
  return out;
}

function alternate(m: MonthlyPoint[], turns: Turn[]): Turn[] {
  const out: Turn[] = [];
  for (const t of turns) {
    const last = out[out.length - 1];
    if (last && last.kind === t.kind) {
      const better = t.kind === "peak" ? m[t.i].value > m[last.i].value : m[t.i].value < m[last.i].value;
      if (better) out[out.length - 1] = t;
    } else out.push(t);
  }
  return out;
}

function endCensor(m: MonthlyPoint[], turns: Turn[]): Turn[] {
  const edge = A("cycles.ps.endCensor");
  const n = m.length;
  let out = turns.filter(t => t.i >= edge && t.i <= n - 1 - edge);
  const beats = (t: Turn, j: number) => (t.kind === "peak" ? m[j].value > m[t.i].value : m[j].value < m[t.i].value);
  let changed = true;
  while (changed && out.length > 0) {
    changed = false;
    const first = out[0];
    for (let j = 0; j < first.i; j++) if (beats(first, j)) { out = out.slice(1); changed = true; break; }
    if (changed || out.length === 0) continue;
    const last = out[out.length - 1];
    for (let j = last.i + 1; j < n; j++) if (beats(last, j)) { out = out.slice(0, -1); changed = true; break; }
  }
  return out;
}

/** Move each turn to the extreme of its kind strictly between its neighbours (series ends for the outermost turns). */
function reExtremize(m: MonthlyPoint[], turns: Turn[]): Turn[] {
  return turns.map((t, k) => {
    const from = k > 0 ? turns[k - 1].i + 1 : 0;
    const to = k < turns.length - 1 ? turns[k + 1].i - 1 : m.length - 1;
    return { kind: t.kind, i: argExtreme(m, from, to, t.kind) };
  });
}

const amplitude = (m: MonthlyPoint[], a: Turn, b: Turn) => Math.abs(Math.log(m[b.i].value / m[a.i].value));
const span = (m: MonthlyPoint[], a: Turn, b: Turn) => monthsBetween(m[a.i].asOf, m[b.i].asOf);

function removeShortCycle(m: MonthlyPoint[], turns: Turn[]): Turn[] | null {
  const minCycle = A("cycles.ps.minCycle");
  let worst = -1;
  for (let k = 0; k + 2 < turns.length; k++) {
    if (span(m, turns[k], turns[k + 2]) < minCycle && (worst < 0 || span(m, turns[k], turns[k + 2]) < span(m, turns[worst], turns[worst + 2]))) worst = k;
  }
  if (worst < 0) return null;
  // Of the two phases inside the short cycle, drop the one that moved the price less.
  const drop = amplitude(m, turns[worst], turns[worst + 1]) <= amplitude(m, turns[worst + 1], turns[worst + 2]) ? worst : worst + 1;
  return turns.filter((_, k) => k !== drop && k !== drop + 1);
}

function removeShortPhase(m: MonthlyPoint[], turns: Turn[]): Turn[] | null {
  const minPhase = A("cycles.ps.minPhase");
  const override = A("cycles.ps.phaseOverride");
  let worst = -1;
  for (let k = 0; k + 1 < turns.length; k++) {
    const a = turns[k], b = turns[k + 1];
    const move = Math.abs(m[b.i].value / m[a.i].value - 1);
    if (span(m, a, b) >= minPhase || move >= override) continue;
    if (worst < 0 || amplitude(m, a, b) < amplitude(m, turns[worst], turns[worst + 1])) worst = k;
  }
  if (worst < 0) return null;
  return turns.filter((_, k) => k !== worst && k !== worst + 1);
}

function paganSossounov(m: MonthlyPoint[]): Turn[] {
  let turns = alternate(m, candidates(m, A("cycles.ps.window")));
  // Each pass removes at most one pair of turns, so the loop ends within turns.length / 2 passes.
  for (;;) {
    turns = endCensor(m, alternate(m, turns));
    const next = removeShortCycle(m, turns) ?? removeShortPhase(m, turns);
    if (!next) return turns;
    turns = alternate(m, reExtremize(m, next));
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

function summarize(m: MonthlyPoint[], turns: Turn[]): { bears: BearMarket[]; bulls: BullMarket[] } {
  const bears: BearMarket[] = [];
  const bulls: BullMarket[] = [];
  for (let k = 0; k + 1 < turns.length; k++) {
    const a = turns[k], b = turns[k + 1];
    const av = m[a.i].value, bv = m[b.i].value;
    const am = monthOf(m[a.i].asOf), bm = monthOf(m[b.i].asOf);
    if (a.kind === "peak") {
      let rec = -1;
      for (let j = b.i + 1; j < m.length; j++) if (m[j].value >= av) { rec = j; break; }
      bears.push({
        peak: am, trough: bm, peakValue: av, troughValue: bv,
        depth: bv / av - 1,
        months: monthsBetween(am, bm),
        recoveryMonths: rec < 0 ? null : monthsBetween(bm, m[rec].asOf),
        recoveredMonth: rec < 0 ? null : monthOf(m[rec].asOf),
      });
    } else {
      bulls.push({ trough: am, peak: bm, troughValue: av, peakValue: bv, gain: bv / av - 1, months: monthsBetween(am, bm) });
    }
  }
  return { bears, bulls };
}

/**
 * Date the bull and bear markets of a price index under one rule. Pure: the
 * same points and rules table always give the same chronology.
 */
export function dateBullBear(points: MonthlyPoint[], rule: BullBearRule): BullBearChronology {
  const m = monthlyGrid(points);
  if (m.length === 0) return { rule, firstMonth: "", lastMonth: "", turns: [], bears: [], bulls: [], pending: null };
  let turns: Turn[];
  let pending: Turn | null = null;
  if (rule === "twenty-percent") ({ turns, pending } = twentyPercent(m));
  else turns = paganSossounov(m);
  return {
    rule,
    firstMonth: monthOf(m[0].asOf),
    lastMonth: monthOf(m[m.length - 1].asOf),
    turns: turns.map(t => toTurn(m, t)),
    ...summarize(m, turns),
    pending: pending ? toTurn(m, pending) : null,
  };
}

/**
 * The cycle phase of a month.
 *
 * Each closed phase between two consecutive turns owns the months
 * (start, end]: month k = 1 … L after the start turn, L = end − start in
 * calendar months. The phase is "early" when k ≤ L × `cycles.phase.earlyShare`
 * (0.5: the first half, the midpoint month of an even-length phase included)
 * and "late" otherwise. So the peak month itself is late-bull, the month after
 * it early-bear; the trough month is late-bear, the month after it early-bull.
 *
 * Returns null on or before the first turn and after the last one: the phase
 * there is open (its length is unknown), so which half a month sits in cannot
 * be known yet. `directionAt` still answers bull or bear for the open tail.
 */
export function phaseAt(chronology: BullBearChronology, date: IsoDate): MarketPhase | null {
  const t = chronology.turns;
  const share = A("cycles.phase.earlyShare");
  for (let k = 0; k + 1 < t.length; k++) {
    const k0 = monthsBetween(t[k].month, date);
    const len = monthsBetween(t[k].month, t[k + 1].month);
    if (k0 < 1 || k0 > len) continue;
    const early = k0 <= len * share;
    if (t[k].kind === "peak") return early ? "early-bear" : "late-bear";
    return early ? "early-bull" : "late-bull";
  }
  return null;
}

/**
 * Bull or bear at a month, including the open phase after the last turn
 * (inside the dated span only). Null before the first turn and outside the series.
 */
export function directionAt(chronology: BullBearChronology, date: IsoDate): "bull" | "bear" | null {
  const t = chronology.turns;
  if (t.length === 0) return null;
  if (monthsBetween(chronology.lastMonth, date) > 0) return null;
  let last: MarketTurn | null = null;
  for (const turn of t) if (monthsBetween(turn.month, date) >= 1) last = turn;
  if (!last) return null;
  return last.kind === "peak" ? "bear" : "bull";
}

// ─── disagreements between the rules ─────────────────────────────────────────

export type RuleDisagreement = {
  kind: "peak-date" | "trough-date" | "only-twenty-percent" | "only-pagan-sossounov" | "split";
  /** Earliest month involved, for sorting. */
  month: string;
  twentyPercent: BearMarket[];
  paganSossounov: BearMarket[];
  /** For date disagreements: the Pagan–Sossounov month minus the twenty-percent month. */
  monthsApart?: number;
  note: string;
};

const overlaps = (a: { peak: string; trough: string }, b: { peak: string; trough: string }) =>
  monthsBetween(a.peak, b.trough) > 0 && monthsBetween(b.peak, a.trough) > 0;

/**
 * Every bear market on which two chronologies of the same series disagree.
 * Bears are matched when their (peak, trough] intervals overlap. Nothing is
 * resolved: each disagreement lists both rules' bears as found.
 */
export function compareChronologies(twenty: BullBearChronology, ps: BullBearChronology): RuleDisagreement[] {
  const out: RuleDisagreement[] = [];
  const earliest = (bs: BearMarket[]) => bs.map(b => b.peak).sort()[0];
  const seenSplit = new Set<string>();
  for (const a of twenty.bears) {
    const hits = ps.bears.filter(b => overlaps(a, b));
    if (hits.length === 0) {
      out.push({ kind: "only-twenty-percent", month: a.peak, twentyPercent: [a], paganSossounov: [], note: `Twenty-percent bear ${a.peak}→${a.trough} (${(a.depth * 100).toFixed(1)} %) has no overlapping Pagan–Sossounov bear.` });
      continue;
    }
    if (hits.length > 1) {
      const key = hits.map(h => h.peak).join("|");
      seenSplit.add(key);
      out.push({ kind: "split", month: earliest([a, ...hits]), twentyPercent: [a], paganSossounov: hits, note: `One twenty-percent bear ${a.peak}→${a.trough} spans ${hits.length} Pagan–Sossounov bears.` });
      continue;
    }
    const b = hits[0];
    const back = twenty.bears.filter(x => overlaps(x, b));
    if (back.length > 1) continue; // reported below as a split from the other side
    const dp = monthsBetween(a.peak, b.peak);
    const dt = monthsBetween(a.trough, b.trough);
    if (dp !== 0) out.push({ kind: "peak-date", month: a.peak < b.peak ? a.peak : b.peak, twentyPercent: [a], paganSossounov: [b], monthsApart: dp, note: `Peak ${a.peak} (twenty-percent) vs ${b.peak} (Pagan–Sossounov).` });
    if (dt !== 0) out.push({ kind: "trough-date", month: a.trough < b.trough ? a.trough : b.trough, twentyPercent: [a], paganSossounov: [b], monthsApart: dt, note: `Trough ${a.trough} (twenty-percent) vs ${b.trough} (Pagan–Sossounov).` });
  }
  for (const b of ps.bears) {
    const hits = twenty.bears.filter(a => overlaps(a, b));
    if (hits.length === 0) {
      out.push({ kind: "only-pagan-sossounov", month: b.peak, twentyPercent: [], paganSossounov: [b], note: `Pagan–Sossounov bear ${b.peak}→${b.trough} (${(b.depth * 100).toFixed(1)} %) has no overlapping twenty-percent bear.` });
    } else if (hits.length > 1) {
      out.push({ kind: "split", month: earliest([b, ...hits]), twentyPercent: hits, paganSossounov: [b], note: `One Pagan–Sossounov bear ${b.peak}→${b.trough} spans ${hits.length} twenty-percent bears.` });
    }
  }
  return out.sort((x, y) => (x.month < y.month ? -1 : x.month > y.month ? 1 : 0));
}

/** Date one series under both rules and list where they disagree. */
export function compareRules(points: MonthlyPoint[]): RuleDisagreement[] {
  return compareChronologies(dateBullBear(points, "twenty-percent"), dateBullBear(points, "pagan-sossounov"));
}

// ─── NBER business cycle reference dates ─────────────────────────────────────

export const NBER_SOURCE = "NBER Business Cycle Dating Committee, nber.org/research/data/us-business-cycle-expansions-and-contractions";
/** The date of the Committee's most recent determination (the April 2020 trough, announced 19 July 2021). */
export const NBER_AS_OF: IsoDate = "2021-07-19";

export type NberTurn = { kind: TurnKind; month: string; source: string; asOf: IsoDate };

const NBER_MONTHS: Array<[TurnKind, string]> = [
  ["trough", "1854-12"],
  ["peak", "1857-06"], ["trough", "1858-12"],
  ["peak", "1860-10"], ["trough", "1861-06"],
  ["peak", "1865-04"], ["trough", "1867-12"],
  ["peak", "1869-06"], ["trough", "1870-12"],
  ["peak", "1873-10"], ["trough", "1879-03"],
  ["peak", "1882-03"], ["trough", "1885-05"],
  ["peak", "1887-03"], ["trough", "1888-04"],
  ["peak", "1890-07"], ["trough", "1891-05"],
  ["peak", "1893-01"], ["trough", "1894-06"],
  ["peak", "1895-12"], ["trough", "1897-06"],
  ["peak", "1899-06"], ["trough", "1900-12"],
  ["peak", "1902-09"], ["trough", "1904-08"],
  ["peak", "1907-05"], ["trough", "1908-06"],
  ["peak", "1910-01"], ["trough", "1912-01"],
  ["peak", "1913-01"], ["trough", "1914-12"],
  ["peak", "1918-08"], ["trough", "1919-03"],
  ["peak", "1920-01"], ["trough", "1921-07"],
  ["peak", "1923-05"], ["trough", "1924-07"],
  ["peak", "1926-10"], ["trough", "1927-11"],
  ["peak", "1929-08"], ["trough", "1933-03"],
  ["peak", "1937-05"], ["trough", "1938-06"],
  ["peak", "1945-02"], ["trough", "1945-10"],
  ["peak", "1948-11"], ["trough", "1949-10"],
  ["peak", "1953-07"], ["trough", "1954-05"],
  ["peak", "1957-08"], ["trough", "1958-04"],
  ["peak", "1960-04"], ["trough", "1961-02"],
  ["peak", "1969-12"], ["trough", "1970-11"],
  ["peak", "1973-11"], ["trough", "1975-03"],
  ["peak", "1980-01"], ["trough", "1980-07"],
  ["peak", "1981-07"], ["trough", "1982-11"],
  ["peak", "1990-07"], ["trough", "1991-03"],
  ["peak", "2001-03"], ["trough", "2001-11"],
  ["peak", "2007-12"], ["trough", "2009-06"],
  ["peak", "2020-02"], ["trough", "2020-04"],
];

/** US business cycle peaks and troughs (monthly), December 1854 trough to April 2020 trough. */
export const NBER_CHRONOLOGY: ReadonlyArray<NberTurn> = NBER_MONTHS.map(([kind, month]) => ({ kind, month, source: NBER_SOURCE, asOf: NBER_AS_OF }));

/** NBER contractions as (peak, trough] intervals. */
export function nberRecessions(table: ReadonlyArray<NberTurn> = NBER_CHRONOLOGY): Array<{ peak: string; trough: string }> {
  const out: Array<{ peak: string; trough: string }> = [];
  for (let k = 0; k + 1 < table.length; k++) {
    if (table[k].kind === "peak" && table[k + 1].kind === "trough") out.push({ peak: table[k].month, trough: table[k + 1].month });
  }
  return out;
}

export type NberOverlap = {
  peak: string;
  trough: string;
  /** Every NBER contraction whose (peak, trough] shares at least one month with the bear's (peak, trough]. */
  recessions: Array<{ peak: string; trough: string; overlapMonths: number }>;
  overlapMonths: number;
  /** NBER peak month minus the bear's peak month for the first overlapping recession (positive: stocks peaked first); null without one. */
  leadMonths: number | null;
};

/** Which NBER recessions each bear market overlapped, and by how many months. */
export function nberOverlap(bears: ReadonlyArray<{ peak: string; trough: string }>, table: ReadonlyArray<NberTurn> = NBER_CHRONOLOGY): NberOverlap[] {
  const recs = nberRecessions(table);
  return bears.map(b => {
    const hits = recs
      .map(r => {
        const start = monthsBetween(b.peak, r.peak) > 0 ? r.peak : b.peak.slice(0, 7);
        const end = monthsBetween(b.trough, r.trough) < 0 ? r.trough : b.trough.slice(0, 7);
        return { peak: r.peak, trough: r.trough, overlapMonths: Math.max(0, monthsBetween(start, end)) };
      })
      .filter(r => r.overlapMonths > 0);
    return {
      peak: b.peak.slice(0, 7),
      trough: b.trough.slice(0, 7),
      recessions: hits,
      overlapMonths: hits.reduce((s, r) => s + r.overlapMonths, 0),
      leadMonths: hits.length ? monthsBetween(b.peak, hits[0].peak) : null,
    };
  });
}
