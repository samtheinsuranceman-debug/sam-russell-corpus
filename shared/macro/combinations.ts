/**
 * Combination engine — the patterns in many small moves at once, and the
 * combinations that have not happened yet.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The owner's ask (23 Sep 2026): "too many moving parts with too many slight
 * movements … it looks like chaos to a human, but you can read through it …
 * combinational patterns and sequences that become predictable … are you able
 * to predict other different combinations that may not have happened yet?"
 *
 * What this module does, in four steps, all over stored monthly history:
 *
 *   1. States. Each series' monthly change is turned into a state — "up",
 *      "down" or "flat" — by its own z-score against the rules-table band
 *      (`combo.stateZ`). A move of half a standard deviation is invisible on
 *      a chart; as a state it is a symbol, and symbols can be counted.
 *   2. Mining. Every conjunction of two or three states (from different
 *      series) is counted: how often it occurred, and how often the target
 *      event followed within the horizon. A combination is kept when it has
 *      enough occurrences (`combo.minSupport`), when the event followed
 *      markedly more often than its base rate (`combo.minLift`), and when the
 *      lift holds in both halves of the history (`combo.stableHalves`).
 *      This is the "screamed together" finding: no single member need be
 *      alarming; the conjunction is.
 *   3. Unseen combinations. Two kept combinations that share a member and
 *      point the same way are composed into a larger one (A∧B and B∧C →
 *      A∧B∧C). When the composed combination has never occurred in the
 *      stored history, the engine estimates its lift from its parts (a
 *      bounded naive-Bayes composition, `combo.unseenLiftCap`) and registers
 *      it as a PREDICTED combination: a hypothesis about a configuration the
 *      record has not yet shown, with a capped confidence and a status of
 *      "untested". It is scored the first time it occurs, exactly like the
 *      pre-registered Treasury hypotheses.
 *   4. Now. The current month's states are matched against both lists: the
 *      mined combinations that are active today, and the predicted ones that
 *      are one state away from activating ("forming").
 *
 * What it refuses to do: call a predicted combination a finding before it has
 * occurred; keep a mined combination that holds in only one half of the
 * record; or run on anything but stored history (with none, every list is
 * empty and says so).
 *
 * Pure: no fetch, no database, no `process`. Drops into the corpus trunk with
 * the rest of `shared/macro/`.
 */
import { A } from "./assumptions";
import { alignMonthly, type Series } from "./emergentPatterns";

export type StateSymbol = "up" | "down" | "flat";
export type StateAtom = { series: string; state: Exclude<StateSymbol, "flat"> };

export type MinedCombination = {
  atoms: StateAtom[];
  /** Months the combination occurred. */
  support: number;
  /** Months the event followed within the horizon. */
  hits: number;
  /** P(event | combination). */
  precision: number;
  /** precision / base rate. */
  lift: number;
  /** Lift in the first and second half of the history. */
  liftFirstHalf: number;
  liftSecondHalf: number;
  /** Last month the combination occurred. */
  lastSeen: string | null;
  reading: string;
};

export type PredictedCombination = {
  atoms: StateAtom[];
  /** The mined combinations it was composed from. */
  parents: [string, string];
  /** Estimated lift from the parents, capped. */
  estimatedLift: number;
  /** Confidence 0–100, capped at `combo.unseenConfidenceCap`: it has never happened. */
  confidence: number;
  status: "untested";
  reading: string;
};

export type ComboReport = {
  target: string;
  horizonMonths: number;
  months: number;
  baseRate: number;
  mined: MinedCombination[];
  predicted: PredictedCombination[];
  activeNow: MinedCombination[];
  forming: Array<{ combination: PredictedCombination; missing: StateAtom[] }>;
  method: string[];
};

export const comboKey = (atoms: StateAtom[]) => atoms.map(a => `${a.series}:${a.state}`).sort().join(" ∧ ");

/** A z-score → state at the band. Shared by the full-sample and the rolling modes of `toStates`. */
export function zToState(z: number | null, band = A("combo.stateZ")): StateSymbol | null {
  if (z === null || Number.isNaN(z)) return null;
  return z >= band ? "up" : z <= -band ? "down" : "flat";
}

/**
 * Rolling mode for `toStates` (A10, the 100-indicator study §5). `values`
 * must sit on a contiguous monthly grid (one slot per calendar month, null
 * where missing). The change at month t is `values[t] − values[t − lag]`;
 * its z-score is taken against the changes of the `windowMonths` months
 * strictly BEFORE t — never t itself, never anything after — so a state
 * uses only what was known at t. Null until `minObs` prior changes exist.
 * A window with zero spread gives z = 0 when the change equals the window
 * mean and ±Infinity otherwise (the sign is the only honest reading).
 */
export type RollingStateOptions = { lag: number; windowMonths: number; minObs: number };

export function rollingChangeZ(values: Array<number | null>, opts: RollingStateOptions): { change: Array<number | null>; z: Array<number | null> } {
  const { lag, windowMonths, minObs } = opts;
  const change: Array<number | null> = values.map((v, i) => (i < lag || v === null || values[i - lag] === null ? null : v - (values[i - lag] as number)));
  const z: Array<number | null> = change.map((x, t) => {
    if (x === null) return null;
    const lo = Math.max(0, t - windowMonths);
    let n = 0, sum = 0;
    for (let k = lo; k < t; k++) if (change[k] !== null) { n++; sum += change[k] as number; }
    if (n < Math.max(2, minObs)) return null;
    const mean = sum / n;
    let ss = 0; // two-pass variance: no cancellation on large-valued series
    for (let k = lo; k < t; k++) if (change[k] !== null) ss += ((change[k] as number) - mean) ** 2;
    const sd = Math.sqrt(ss / n);
    const d = x - mean;
    if (sd <= 1e-12 * Math.max(1, Math.abs(mean))) return Math.abs(d) <= 1e-12 * Math.max(1, Math.abs(mean)) ? 0 : d > 0 ? Infinity : -Infinity;
    return d / sd;
  });
  return { change, z };
}

/**
 * Monthly change → state by its own z-score. Without `rolling`: the
 * one-month change against the full sample (the original combination-engine
 * behaviour, unchanged). With `rolling`: the `lag`-month change against a
 * trailing window with no look-ahead (see `rollingChangeZ`).
 */
export function toStates(values: Array<number | null>, band = A("combo.stateZ"), rolling?: RollingStateOptions): Array<StateSymbol | null> {
  if (rolling) return rollingChangeZ(values, rolling).z.map(z => zToState(z, band));
  const ch: Array<number | null> = values.map((v, i) => (i === 0 || v === null || values[i - 1] === null ? null : (v as number) - (values[i - 1] as number)));
  const xs = ch.filter((x): x is number => x !== null);
  if (xs.length < 12) return values.map(() => null);
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length) || 1;
  return ch.map(x => (x === null ? null : (x - mean) / sd >= band ? "up" : (x - mean) / sd <= -band ? "down" : "flat"));
}

/** The target event per month: 1 when it occurs within the next `horizon` months. */
function eventAhead(events: Array<number | null>, horizon: number): Array<number | null> {
  return events.map((_, t) => {
    let seen = false;
    let any = false;
    for (let k = 1; k <= horizon && t + k < events.length; k++) {
      const e = events[t + k];
      if (e === null) continue;
      any = true;
      if (e > 0) seen = true;
    }
    return any ? (seen ? 1 : 0) : null;
  });
}

function round3(x: number) {
  return Math.round(x * 1000) / 1000;
}

/**
 * Mine the combinations that preceded a target event. `target` is the id of a
 * series in `series`; the event is that series' state (`targetState`) — e.g.
 * the 10-year moving up, or the recession tape switching to 1 (`targetState`
 * "level-1" reads the raw value > 0 instead of a state).
 */
export function mineCombinations(series: Series[], target: string, opts: { targetState?: StateSymbol | "level-1"; horizonMonths?: number; maxOrder?: 2 | 3; top?: number; rolling?: RollingStateOptions } = {}): ComboReport {
  const horizon = opts.horizonMonths ?? 6;
  const maxOrder = opts.maxOrder ?? 3;
  const targetState = opts.targetState ?? "up";
  const { keys, matrix } = alignMonthly(series);
  const states = new Map<string, Array<StateSymbol | null>>();
  // Without `rolling`, states are z-scored against the whole series (future included): fine for describing history,
  // not for testing prediction. The bull/bear study (PREREGISTRATION) must pass `rolling` so each month sees only its past.
  matrix.forEach((row, id) => states.set(id, toStates(row, A("combo.stateZ"), opts.rolling)));
  const targetRow = matrix.get(target) ?? [];
  const eventNow = targetState === "level-1" ? targetRow.map(v => (v === null ? null : v > 0 ? 1 : 0)) : (states.get(target) ?? []).map(s => (s === null ? null : s === targetState ? 1 : 0));
  const ahead = eventAhead(eventNow, horizon);
  const valid = ahead.map((e, t) => e !== null && t < keys.length);
  const nValid = valid.filter(Boolean).length;
  const baseRate = nValid ? ahead.filter((e, t) => valid[t] && e === 1).length / nValid : 0;
  const method = [
    `States: each series' monthly change as a z-score against its own history; |z| ≥ ${A("combo.stateZ")} is up or down, otherwise flat [combo.stateZ].`,
    `Event: ${target} ${targetState === "level-1" ? "switches on" : `moves ${targetState}`} within ${horizon} months; base rate ${round3(baseRate)} over ${nValid} months.`,
    `Kept: support ≥ ${A("combo.minSupport")} months, lift ≥ ${A("combo.minLift")}, lift ≥ 1 in both halves of the history [combo.minSupport, combo.minLift, combo.stableHalves].`,
    `Predicted (unseen) combinations: two kept combinations sharing a member and pointing the same way, composed; never observed in the stored history; lift estimated from the parents and capped at ${A("combo.unseenLiftCap")}; confidence capped at ${A("combo.unseenConfidenceCap")}; status untested until they occur [combo.unseenLiftCap, combo.unseenConfidenceCap].`,
  ];
  const empty: ComboReport = { target, horizonMonths: horizon, months: nValid, baseRate: round3(baseRate), mined: [], predicted: [], activeNow: [], forming: [], method };
  if (nValid < A("combo.minMonths") || baseRate <= 0 || baseRate >= 1) return { ...empty, method: [...method, `Not enough history (${nValid} months; ${A("combo.minMonths")} needed) or a degenerate event; nothing mined.`] };

  // Atoms: every up/down state of every non-target series.
  const ids = Array.from(states.keys()).filter(id => id !== target);
  const atoms: StateAtom[] = ids.flatMap(id => [{ series: id, state: "up" as const }, { series: id, state: "down" as const }]);
  const on = (a: StateAtom, t: number) => states.get(a.series)![t] === a.state;
  const half = Math.floor(keys.length / 2);
  const minSupport = A("combo.minSupport");
  const minLift = A("combo.minLift");

  const evaluate = (combo: StateAtom[]): MinedCombination | null => {
    let support = 0, hits = 0, s1 = 0, h1 = 0, s2 = 0, h2 = 0, n1 = 0, e1 = 0, n2 = 0, e2 = 0;
    let lastSeen: string | null = null;
    for (let t = 0; t < keys.length; t++) {
      if (!valid[t]) continue;
      const first = t < half;
      if (first) { n1++; if (ahead[t] === 1) e1++; } else { n2++; if (ahead[t] === 1) e2++; }
      if (!combo.every(a => on(a, t))) continue;
      support++;
      lastSeen = keys[t];
      const hit = ahead[t] === 1;
      if (hit) hits++;
      if (first) { s1++; if (hit) h1++; } else { s2++; if (hit) h2++; }
    }
    if (support < minSupport) return null;
    const precision = hits / support;
    const lift = precision / baseRate;
    const lift1 = s1 && e1 ? h1 / s1 / (e1 / n1) : 0;
    const lift2 = s2 && e2 ? h2 / s2 / (e2 / n2) : 0;
    const stable = A("combo.stableHalves") ? lift1 >= 1 && lift2 >= 1 : true;
    if (lift < minLift || !stable) return null;
    return {
      atoms: combo,
      support,
      hits,
      precision: round3(precision),
      lift: round3(lift),
      liftFirstHalf: round3(lift1),
      liftSecondHalf: round3(lift2),
      lastSeen,
      reading: `${comboKey(combo)} → ${target} ${targetState === "level-1" ? "on" : targetState} within ${horizon} m: ${hits}/${support} (${Math.round(precision * 100)} % vs base ${Math.round(baseRate * 100)} %, lift ${round3(lift)}; halves ${round3(lift1)} / ${round3(lift2)}).`,
    };
  };

  const mined: MinedCombination[] = [];
  // Order 2, then order 3 extending kept or near-kept pairs (Apriori: a triple needs its pairs to have support).
  const pairs: StateAtom[][] = [];
  for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
    if (atoms[i].series === atoms[j].series) continue;
    let s = 0;
    for (let t = 0; t < keys.length; t++) if (valid[t] && on(atoms[i], t) && on(atoms[j], t)) s++;
    if (s < minSupport) continue;
    pairs.push([atoms[i], atoms[j]]);
    const m = evaluate([atoms[i], atoms[j]]);
    if (m) mined.push(m);
  }
  if (maxOrder >= 3) {
    const seen = new Set<string>();
    for (const p of pairs) for (const a of atoms) {
      if (p.some(x => x.series === a.series)) continue;
      const triple = [...p, a];
      const k = comboKey(triple);
      if (seen.has(k)) continue;
      seen.add(k);
      const m = evaluate(triple);
      // A triple is kept only if it beats every pair inside it: otherwise the third member adds nothing.
      if (m && m.lift > Math.max(...mined.filter(x => x.atoms.length === 2 && x.atoms.every(y => triple.some(z => z.series === y.series && z.state === y.state))).map(x => x.lift), minLift)) mined.push(m);
    }
  }
  mined.sort((a, b) => b.lift * Math.sqrt(b.support) - a.lift * Math.sqrt(a.support));
  const top = mined.slice(0, opts.top ?? 40);

  const predicted = predictUnseen(top, (combo) => {
    for (let t = 0; t < keys.length; t++) if (valid[t] && combo.every(a => on(a, t))) return true;
    return false;
  }, baseRate, target);

  const last = keys.length - 1;
  const nowStates = (a: StateAtom) => states.get(a.series)?.[last] === a.state;
  const activeNow = top.filter(m => m.atoms.every(nowStates));
  const forming = predicted
    .map(p => ({ combination: p, missing: p.atoms.filter(a => !nowStates(a)) }))
    .filter(f => f.missing.length === 1);
  return { ...empty, mined: top, predicted, activeNow, forming };
}

/**
 * Compose kept combinations into ones the record has not shown. Two parents
 * that share a member (same series, same state) and have no contradicting
 * members compose into their union; if the union has never occurred, its
 * lift is estimated as the product of the parents' lifts divided by the
 * shared member's own contribution (approximated by the smaller parent's
 * lift, a conservative naive-Bayes step), capped.
 */
export function predictUnseen(mined: MinedCombination[], occurred: (atoms: StateAtom[]) => boolean, baseRate: number, target: string): PredictedCombination[] {
  const out: PredictedCombination[] = [];
  const seen = new Set<string>(mined.map(m => comboKey(m.atoms)));
  const cap = A("combo.unseenLiftCap");
  const confCap = A("combo.unseenConfidenceCap");
  for (let i = 0; i < mined.length; i++) for (let j = i + 1; j < mined.length; j++) {
    const a = mined[i], b = mined[j];
    const shared = a.atoms.filter(x => b.atoms.some(y => y.series === x.series && y.state === x.state));
    if (!shared.length) continue;
    const contradict = a.atoms.some(x => b.atoms.some(y => y.series === x.series && y.state !== x.state));
    if (contradict) continue;
    const union = [...a.atoms, ...b.atoms.filter(y => !a.atoms.some(x => x.series === y.series))];
    if (union.length > 4 || union.length <= Math.max(a.atoms.length, b.atoms.length)) continue;
    const k = comboKey(union);
    if (seen.has(k)) continue;
    seen.add(k);
    if (occurred(union)) continue;
    const est = Math.min(cap, (a.lift * b.lift) / Math.max(1, Math.min(a.lift, b.lift)));
    const precision = Math.min(1, est * baseRate);
    // Confidence: the weaker parent's support, scaled, and never above the cap — it has never happened.
    const conf = Math.round(Math.min(confCap, (Math.min(a.support, b.support) / A("combo.minSupport")) * 10));
    out.push({
      atoms: union,
      parents: [comboKey(a.atoms), comboKey(b.atoms)],
      estimatedLift: round3(est),
      confidence: conf,
      status: "untested",
      reading: `PREDICTED, never observed: ${k} → ${target} (estimated lift ${round3(est)}, P ≈ ${Math.round(precision * 100)} %), composed from [${comboKey(a.atoms)}] and [${comboKey(b.atoms)}]. Scored the first time it occurs.`,
    });
  }
  return out.sort((x, y) => y.estimatedLift - x.estimatedLift).slice(0, 60);
}
