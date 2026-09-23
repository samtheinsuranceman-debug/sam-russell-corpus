/**
 * Indicator states and the event stream — the 100-indicator study, §5.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Agent A10. Every indicator gets a state each month; a change of state is an
 * event stamped with its month; every later method (conditional odds,
 * clusters, sequences, the keystone detector, the reverse walk) reads the
 * event stream this module builds.
 *
 *   1. Direction (every indicator). The 12-month change (`states.changeMonths`)
 *      is z-scored against the 12-month changes of the trailing 10 years
 *      (`states.windowMonths`) that lie strictly BEFORE the month. |z| at or
 *      above `combo.stateZ` (0.5) is "up" or "down"; inside the band, "flat".
 *      Null (unknown) until `states.minWindowObs` prior changes exist.
 *      This is `toStates` from combinations.ts in its rolling mode — one
 *      state engine, not two.
 *   2. Level (slow indicators). The reading against the 10th and 90th
 *      percentiles (`states.levelLowPct`, `states.levelHighPct`) of the
 *      indicator's own history strictly before the month (expanding window,
 *      `states.levelWindowMonths` = 0). "extreme-low", "normal",
 *      "extreme-high". Null until `states.levelMinObs` prior readings exist.
 *   3. Events. A state that differs from the last KNOWN state of the same
 *      series and kind is an event {month, indicator, kind, from, to}. The
 *      first known state after warm-up is not an event (nothing changed; the
 *      record merely began), and a null gap is not an event either.
 *   4. The stream. Every series' events, merged and sorted by month, then
 *      indicator, then kind.
 *
 * No look-ahead, by construction: the state at month t is a function of the
 * readings at months ≤ t only. `server/macroStates.test.ts` proves it by
 * rewriting every value after a cut-off and checking every earlier state and
 * event is unchanged.
 *
 * Pure: no fetch, no database, no `process`, no file writes. `statesCsv` and
 * `eventsCsv` return strings; the caller writes `states/<id>.csv` and
 * `events.csv`.
 *
 * ─── PORT STEPS (to sam-russell-corpus/russell-capital-systems @ master)
 *  1. Copy `shared/macro/states.ts` next to `combinations.ts`.
 *  2. Apply the `combinations.ts` hunk: `zToState`, `RollingStateOptions`,
 *     `rollingChangeZ`, and the optional third argument of `toStates`. The
 *     two-argument call is byte-for-byte the old behaviour, so
 *     `mineCombinations` and `server/macroCombinations.test.ts` are untouched.
 *  3. Append the `STATE_ROWS` block (seven `states.*` rows) to
 *     `assumptions.ts` after `COMBO_ROWS`, and the same seven rows to the
 *     rules-table CSV if the trunk keeps one.
 *  4. Add `export * from "./states";` to `shared/macro/index.ts`.
 *  5. Copy `server/macroStates.test.ts`; `pnpm test` and `pnpm check` must stay
 *     green.
 *  6. Feed it: A02–A09's monthly series as `StateSeriesInput`
 *     ({ id, points, speed }) — `speed` from
 *     `data/research_100_indicators.csv`; "slow" turns on level states.
 */
import { A } from "./assumptions";
import { rollingChangeZ, zToState, type StateSymbol } from "./combinations";
import { monthEndPoints, type MonthlyPoint } from "./emergentPatterns";

export type LevelSymbol = "extreme-high" | "normal" | "extreme-low";
export type StateKind = "direction" | "level";
export type IndicatorSpeed = "slow" | "medium" | "fast";

export type DirectionRow = {
  /** Calendar month, "YYYY-MM". */
  month: string;
  /** The month's reading (last in the month), or null where missing. */
  value: number | null;
  /** value − value 12 months earlier. */
  change: number | null;
  /** The change's z-score against the trailing window (months before this one only). */
  z: number | null;
  state: StateSymbol | null;
};

export type LevelRow = {
  month: string;
  value: number | null;
  /** 10th and 90th percentiles of the readings before this month. */
  lo: number | null;
  hi: number | null;
  state: LevelSymbol | null;
};

export type StateEvent = { month: string; indicator: string; kind: StateKind; from: string; to: string };

export type StateSeriesInput = {
  id: string;
  points: MonthlyPoint[];
  /** "slow" also computes level states (study §5). */
  speed?: IndicatorSpeed;
  /** Force level states on or off regardless of speed. */
  level?: boolean;
};

export type DirectionOptions = { band?: number; changeMonths?: number; windowMonths?: number; minObs?: number };
export type LevelOptions = { lowPct?: number; highPct?: number; windowMonths?: number; minObs?: number };

const monthOf = (asOf: string) => asOf.slice(0, 7);

function nextMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/**
 * Put a series on a contiguous calendar-month grid (last reading in each
 * month; null for a month with none), from its first month to its last. The
 * 12-month lag is then twelve calendar months, not twelve readings.
 */
export function monthlyGrid(points: MonthlyPoint[]): { months: string[]; values: Array<number | null> } {
  const clean = points.filter(p => p && typeof p.value === "number" && Number.isFinite(p.value));
  const monthly = monthEndPoints(clean);
  if (!monthly.length) return { months: [], values: [] };
  const byMonth = new Map<string, number>(monthly.map(p => [monthOf(p.asOf), p.value]));
  const months: string[] = [];
  const last = monthOf(monthly[monthly.length - 1].asOf);
  for (let k = monthOf(monthly[0].asOf); k <= last; k = nextMonth(k)) months.push(k);
  return { months, values: months.map(k => (byMonth.has(k) ? byMonth.get(k)! : null)) };
}

/** Monthly up / down / flat from the 12-month change against a rolling 10-year window, no look-ahead. */
export function directionStates(points: MonthlyPoint[], opts: DirectionOptions = {}): DirectionRow[] {
  const band = opts.band ?? A("combo.stateZ");
  const rolling = {
    lag: opts.changeMonths ?? A("states.changeMonths"),
    windowMonths: opts.windowMonths ?? A("states.windowMonths"),
    minObs: opts.minObs ?? A("states.minWindowObs"),
  };
  const { months, values } = monthlyGrid(points);
  const { change, z } = rollingChangeZ(values, rolling);
  return months.map((month, t) => ({ month, value: values[t], change: change[t], z: z[t], state: zToState(z[t], band) }));
}

/** Percentile of a sorted array, linear interpolation between order statistics (Hyndman–Fan type 7). */
export function percentileSorted(sorted: number[], pct: number): number {
  if (!sorted.length) return NaN;
  const h = (sorted.length - 1) * (pct / 100);
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

function lowerBound(a: number[], x: number): number {
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] < x) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/** Extreme-high / normal / extreme-low against the percentiles of the readings before each month. */
export function levelStates(points: MonthlyPoint[], opts: LevelOptions = {}): LevelRow[] {
  const lowPct = opts.lowPct ?? A("states.levelLowPct");
  const highPct = opts.highPct ?? A("states.levelHighPct");
  const windowMonths = opts.windowMonths ?? A("states.levelWindowMonths");
  const minObs = Math.max(2, opts.minObs ?? A("states.levelMinObs"));
  const { months, values } = monthlyGrid(points);
  const sorted: number[] = []; // readings of months strictly before t (within the window)
  const out: LevelRow[] = [];
  for (let t = 0; t < months.length; t++) {
    if (windowMonths > 0 && t - windowMonths - 1 >= 0) {
      const old = values[t - windowMonths - 1];
      if (old !== null) sorted.splice(lowerBound(sorted, old), 1);
    }
    const v = values[t];
    let lo: number | null = null, hi: number | null = null, state: LevelSymbol | null = null;
    if (sorted.length >= minObs) {
      lo = percentileSorted(sorted, lowPct);
      hi = percentileSorted(sorted, highPct);
      if (v !== null) state = v >= hi ? "extreme-high" : v <= lo ? "extreme-low" : "normal";
    }
    out.push({ month: months[t], value: v, lo, hi, state });
    // Only now does month t join the history, for month t + 1 onward.
    if (v !== null) sorted.splice(lowerBound(sorted, v), 0, v);
  }
  return out;
}

/** State changes of one series: an event when a known state differs from the last known state. */
export function stateEvents(id: string, states: Array<{ month: string; state: string | null }>, kind: StateKind = "direction"): StateEvent[] {
  const out: StateEvent[] = [];
  let last: string | null = null;
  for (const s of states) {
    if (s.state === null) continue;
    if (last !== null && s.state !== last) out.push({ month: s.month, indicator: id, kind, from: last, to: s.state });
    last = s.state;
  }
  return out;
}

const KIND_ORDER: Record<StateKind, number> = { direction: 0, level: 1 };

export function compareEvents(a: StateEvent, b: StateEvent): number {
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  if (a.indicator !== b.indicator) return a.indicator < b.indicator ? -1 : 1;
  return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
}

export type SeriesStates = { id: string; direction: DirectionRow[]; level: LevelRow[] | null };

/** Direction states for every series; level states for slow ones (or where `level` is set). */
export function computeSeriesStates(s: StateSeriesInput, dir: DirectionOptions = {}, lvl: LevelOptions = {}): SeriesStates {
  const wantLevel = s.level ?? s.speed === "slow";
  return { id: s.id, direction: directionStates(s.points, dir), level: wantLevel ? levelStates(s.points, lvl) : null };
}

/** Every series' state changes, merged into one stream sorted by month, indicator, kind. */
export function buildEventStream(seriesList: StateSeriesInput[], dir: DirectionOptions = {}, lvl: LevelOptions = {}): StateEvent[] {
  const ids = new Set<string>();
  const out: StateEvent[] = [];
  for (const s of seriesList) {
    if (ids.has(s.id)) throw new Error(`Duplicate indicator id in event stream: ${s.id}`);
    ids.add(s.id);
    const st = computeSeriesStates(s, dir, lvl);
    out.push(...stateEvents(s.id, st.direction, "direction"));
    if (st.level) out.push(...stateEvents(s.id, st.level, "level"));
  }
  return out.sort(compareEvents);
}

const num = (x: number | null) => (x === null || !Number.isFinite(x) ? "" : String(Math.round(x * 1e6) / 1e6));

/** `states/<id>.csv`: month, value, change12, z, direction, levelLo, levelHi, level. Unknown stays empty. */
export function statesCsv(st: SeriesStates): string {
  const lvl = new Map((st.level ?? []).map(r => [r.month, r]));
  const lines = ["month,value,change12,z,direction,levelLo,levelHi,level"];
  for (const d of st.direction) {
    const l = lvl.get(d.month);
    // z of ±Infinity (a zero-spread window) prints as ±inf so the state's reason is visible.
    const z = d.z === null ? "" : Number.isFinite(d.z) ? num(d.z) : d.z > 0 ? "inf" : "-inf";
    lines.push([d.month, num(d.value), num(d.change), z, d.state ?? "", l ? num(l.lo) : "", l ? num(l.hi) : "", l?.state ?? ""].join(","));
  }
  return lines.join("\n") + "\n";
}

/** `events.csv`: month, indicator, kind, from, to. */
export function eventsCsv(events: StateEvent[]): string {
  return ["month,indicator,kind,from,to", ...events.map(e => [e.month, e.indicator, e.kind, e.from, e.to].join(","))].join("\n") + "\n";
}

/** The method, with every threshold cited by its rules-table id. */
export function statesMethod(): string[] {
  return [
    `Direction: the ${A("states.changeMonths")}-month change, z-scored against the changes of the previous ${A("states.windowMonths")} months (strictly before the month); |z| ≥ ${A("combo.stateZ")} is up or down, otherwise flat; null until ${A("states.minWindowObs")} prior changes exist [states.changeMonths, states.windowMonths, combo.stateZ, states.minWindowObs].`,
    `Level (slow indicators): at or above the ${A("states.levelHighPct")}th percentile of the readings before the month is extreme-high, at or below the ${A("states.levelLowPct")}th is extreme-low; window ${A("states.levelWindowMonths") > 0 ? `${A("states.levelWindowMonths")} months` : "all prior history"}; null until ${A("states.levelMinObs")} prior readings [states.levelHighPct, states.levelLowPct, states.levelWindowMonths, states.levelMinObs].`,
    "Events: a known state that differs from the series' last known state of the same kind; the first state after warm-up and null gaps are not events.",
  ];
}
