/**
 * Emergent Pattern Detector — relationships below the level of the public
 * conversation.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Given time series for the indicator panels, this finds:
 *
 *   1. Pairwise correlations (contemporaneous) above a threshold.
 *   2. Lead–lag relationships: X at t−k predicts Y at t, for k in 1..maxLag.
 *      Reported with the best lag and the improvement over the contemporaneous
 *      correlation — a lead that adds nothing over "they move together" is
 *      not a lead.
 *   3. Conditional triples: when A and B are both above their median, how
 *      often is C above its median, versus its base rate. Second-order
 *      structure that no pairwise scan shows.
 *
 * Every finding carries a confidence score (sample size, effect size,
 * stability across halves of the sample) and is tagged with the awareness
 * level of the indicators involved. Findings that involve only "latent"
 * indicators are what the page calls "below awareness".
 *
 * Statistics are deliberately plain: Pearson r, a Fisher-z interval, and a
 * split-half stability check. No black box. The reader can recompute every
 * number from the series on the page.
 */
import type { IsoDate, Indicator, Direction, FactorSpec, FactorVerdict } from "./types";
import { INDICATOR_BY_ID } from "./indicators";

export type Series = { indicatorId: string; points: Array<{ asOf: IsoDate; value: number }> };

export type PairFinding = {
  kind: "correlation" | "lead-lag";
  a: string;
  b: string;
  aName: string;
  bName: string;
  r: number;
  /** For lead-lag: months a leads b. */
  lag: number;
  /** Improvement over the contemporaneous |r|. */
  leadGain?: number;
  n: number;
  confidence: number;
  grade: "A" | "B" | "C" | "D" | "F";
  /** Fisher-z 80 % interval. */
  low: number;
  high: number;
  stable: boolean;
  awareness: "visible" | "structural" | "latent";
  /** One sentence a reader can act on. */
  reading: string;
};

export type TripleFinding = {
  kind: "conditional";
  a: string;
  b: string;
  c: string;
  names: [string, string, string];
  /** P(C high | A high & B high). */
  conditional: number;
  /** P(C high). */
  base: number;
  lift: number;
  n: number;
  support: number;
  confidence: number;
  grade: "A" | "B" | "C" | "D" | "F";
  awareness: "visible" | "structural" | "latent";
  reading: string;
};

export type PatternReport = {
  asOf: IsoDate;
  seriesCount: number;
  months: number;
  correlations: PairFinding[];
  leads: PairFinding[];
  conditionals: TripleFinding[];
  /** Findings whose indicators are all structural or latent. */
  belowAwareness: Array<PairFinding | TripleFinding>;
  method: string[];
};

export type PatternOptions = {
  minAbsR?: number;
  maxLag?: number;
  minN?: number;
  maxFindings?: number;
  today?: IsoDate;
};

function monthKey(d: IsoDate) {
  return d.slice(0, 7);
}

/** Align all series to a common monthly grid (last value in the month). */
export function alignMonthly(series: Series[]): { keys: string[]; matrix: Map<string, Array<number | null>> } {
  const keySet = new Set<string>();
  const perSeries = new Map<string, Map<string, number>>();
  for (const s of series) {
    const m = new Map<string, number>();
    for (const p of [...s.points].sort((x, y) => (x.asOf < y.asOf ? -1 : 1))) {
      const k = monthKey(p.asOf);
      m.set(k, p.value);
      keySet.add(k);
    }
    perSeries.set(s.indicatorId, m);
  }
  const keys = Array.from(keySet).sort();
  const matrix = new Map<string, Array<number | null>>();
  perSeries.forEach((m, id) => matrix.set(id, keys.map(k => (m.has(k) ? m.get(k)! : null))));
  return { keys, matrix };
}

export function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return 0;
  return sxy / Math.sqrt(sxx * syy);
}

function fisherInterval(r: number, n: number, z = 1.2816): { low: number; high: number } {
  if (n < 4) return { low: -1, high: 1 };
  const rr = Math.max(-0.999999, Math.min(0.999999, r));
  const fz = 0.5 * Math.log((1 + rr) / (1 - rr));
  const se = 1 / Math.sqrt(n - 3);
  const lo = Math.tanh(fz - z * se);
  const hi = Math.tanh(fz + z * se);
  return { low: lo, high: hi };
}

function paired(a: Array<number | null>, b: Array<number | null>, lag: number): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  for (let t = lag; t < b.length; t++) {
    const av = a[t - lag];
    const bv = b[t];
    if (av === null || bv === null || av === undefined || bv === undefined) continue;
    x.push(av);
    y.push(bv);
  }
  return { x, y };
}

function grade(c: number): PairFinding["grade"] {
  if (c >= 85) return "A";
  if (c >= 70) return "B";
  if (c >= 50) return "C";
  if (c >= 30) return "D";
  return "F";
}

function confidenceFor(r: number, n: number, stable: boolean): number {
  const { low, high } = fisherInterval(r, n);
  const excludesZero = low > 0 || high < 0;
  const size = Math.min(1, n / 60); // five years of monthly data = full marks
  const effect = Math.min(1, Math.abs(r) / 0.8);
  let c = 100 * (0.4 * size + 0.35 * effect + 0.25 * (stable ? 1 : 0));
  if (!excludesZero) c = Math.min(c, 40);
  return Math.round(c);
}

function awarenessOf(ids: string[]): PairFinding["awareness"] {
  const levels = ids.map(id => INDICATOR_BY_ID.get(id)?.awareness ?? "visible");
  if (levels.every(l => l === "latent")) return "latent";
  if (levels.every(l => l !== "visible")) return "structural";
  return "visible";
}

function nameOf(id: string) {
  return INDICATOR_BY_ID.get(id)?.name ?? id;
}

function splitHalfStable(x: number[], y: number[]): boolean {
  const h = Math.floor(x.length / 2);
  if (h < 4) return false;
  const r1 = pearson(x.slice(0, h), y.slice(0, h));
  const r2 = pearson(x.slice(h), y.slice(h));
  return Math.sign(r1) === Math.sign(r2) && Math.min(Math.abs(r1), Math.abs(r2)) > 0.2;
}

export function detectPatterns(series: Series[], opts: PatternOptions = {}): PatternReport {
  const minAbsR = opts.minAbsR ?? 0.6;
  const maxLag = opts.maxLag ?? 6;
  const minN = opts.minN ?? 12;
  const maxFindings = opts.maxFindings ?? 40;
  const { keys, matrix } = alignMonthly(series);
  const ids = Array.from(matrix.keys());

  const correlations: PairFinding[] = [];
  const leads: PairFinding[] = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = matrix.get(ids[i])!;
      const b = matrix.get(ids[j])!;
      const { x, y } = paired(a, b, 0);
      if (x.length < minN) continue;
      const r0 = pearson(x, y);
      const stable0 = splitHalfStable(x, y);
      if (Math.abs(r0) >= minAbsR) {
        const c = confidenceFor(r0, x.length, stable0);
        const { low, high } = fisherInterval(r0, x.length);
        correlations.push({
          kind: "correlation",
          a: ids[i],
          b: ids[j],
          aName: nameOf(ids[i]),
          bName: nameOf(ids[j]),
          r: round3(r0),
          lag: 0,
          n: x.length,
          confidence: c,
          grade: grade(c),
          low: round3(low),
          high: round3(high),
          stable: stable0,
          awareness: awarenessOf([ids[i], ids[j]]),
          reading: `${nameOf(ids[i])} and ${nameOf(ids[j])} move ${r0 > 0 ? "together" : "in opposite directions"} (r = ${r0.toFixed(2)}, n = ${x.length}).`,
        });
      }
      // Lead–lag both directions.
      for (const [lead, follow] of [[ids[i], ids[j]], [ids[j], ids[i]]] as const) {
        let best: { r: number; lag: number; n: number; stable: boolean } | null = null;
        for (let k = 1; k <= maxLag; k++) {
          const p = paired(matrix.get(lead)!, matrix.get(follow)!, k);
          if (p.x.length < minN) continue;
          const r = pearson(p.x, p.y);
          if (!best || Math.abs(r) > Math.abs(best.r)) best = { r, lag: k, n: p.x.length, stable: splitHalfStable(p.x, p.y) };
        }
        if (!best) continue;
        const gain = Math.abs(best.r) - Math.abs(r0);
        if (Math.abs(best.r) >= minAbsR && gain >= 0.1) {
          const c = confidenceFor(best.r, best.n, best.stable);
          const { low, high } = fisherInterval(best.r, best.n);
          leads.push({
            kind: "lead-lag",
            a: lead,
            b: follow,
            aName: nameOf(lead),
            bName: nameOf(follow),
            r: round3(best.r),
            lag: best.lag,
            leadGain: round3(gain),
            n: best.n,
            confidence: c,
            grade: grade(c),
            low: round3(low),
            high: round3(high),
            stable: best.stable,
            awareness: awarenessOf([lead, follow]),
            reading: `${nameOf(lead)} leads ${nameOf(follow)} by ${best.lag} month${best.lag > 1 ? "s" : ""} (r = ${best.r.toFixed(2)} at lag ${best.lag}, vs ${r0.toFixed(2)} contemporaneous).`,
          });
        }
      }
    }
  }

  // Conditional triples on medians. Limit to the top-variance 12 series to keep it tractable.
  const conditionals: TripleFinding[] = [];
  const medians = new Map<string, number>();
  for (const id of ids) {
    const vals = matrix.get(id)!.filter((v): v is number => v !== null).sort((a, b) => a - b);
    if (vals.length >= minN) medians.set(id, vals[Math.floor(vals.length / 2)]);
  }
  const cand = Array.from(medians.keys()).slice(0, 12);
  for (let i = 0; i < cand.length; i++) {
    for (let j = i + 1; j < cand.length; j++) {
      for (let k = 0; k < cand.length; k++) {
        if (k === i || k === j) continue;
        const A = matrix.get(cand[i])!;
        const B = matrix.get(cand[j])!;
        const C = matrix.get(cand[k])!;
        let both = 0;
        let bothAndC = 0;
        let cHigh = 0;
        let n = 0;
        for (let t = 0; t < keys.length; t++) {
          const av = A[t];
          const bv = B[t];
          const cv = C[t];
          if (av === null || bv === null || cv === null) continue;
          n++;
          const ch = cv > medians.get(cand[k])!;
          if (ch) cHigh++;
          if (av > medians.get(cand[i])! && bv > medians.get(cand[j])!) {
            both++;
            if (ch) bothAndC++;
          }
        }
        if (n < minN || both < Math.max(5, n * 0.15)) continue;
        const cond = bothAndC / both;
        const base = cHigh / n;
        const lift = base > 0 ? cond / base : 0;
        if (lift >= 1.5 && cond >= 0.7) {
          const c = Math.round(100 * (0.4 * Math.min(1, n / 60) + 0.3 * Math.min(1, (lift - 1) / 1) + 0.3 * Math.min(1, both / 20)));
          conditionals.push({
            kind: "conditional",
            a: cand[i],
            b: cand[j],
            c: cand[k],
            names: [nameOf(cand[i]), nameOf(cand[j]), nameOf(cand[k])],
            conditional: round3(cond),
            base: round3(base),
            lift: round3(lift),
            n,
            support: both,
            confidence: c,
            grade: grade(c),
            awareness: awarenessOf([cand[i], cand[j], cand[k]]),
            reading: `When ${nameOf(cand[i])} and ${nameOf(cand[j])} are both above median, ${nameOf(cand[k])} is above median ${Math.round(cond * 100)}% of the time (base rate ${Math.round(base * 100)}%, lift ${lift.toFixed(1)}×, ${both} cases).`,
          });
        }
      }
    }
  }

  correlations.sort((a, b) => b.confidence - a.confidence || Math.abs(b.r) - Math.abs(a.r));
  leads.sort((a, b) => b.confidence - a.confidence || Math.abs(b.r) - Math.abs(a.r));
  conditionals.sort((a, b) => b.confidence - a.confidence || b.lift - a.lift);

  const all: Array<PairFinding | TripleFinding> = [...correlations, ...leads, ...conditionals];
  const belowAwareness = all.filter(f => f.awareness !== "visible").sort((a, b) => b.confidence - a.confidence);

  return {
    asOf: opts.today ?? keys[keys.length - 1] + "-28",
    seriesCount: ids.length,
    months: keys.length,
    correlations: correlations.slice(0, maxFindings),
    leads: leads.slice(0, maxFindings),
    conditionals: conditionals.slice(0, maxFindings),
    belowAwareness: belowAwareness.slice(0, maxFindings),
    method: [
      `Monthly alignment (last value in month); pairs need ≥ ${minN} overlapping months.`,
      `Pearson r; 80 % Fisher-z interval; a finding whose interval spans zero is capped at confidence 40.`,
      `Lead–lag: best |r| over lags 1–${maxLag}, reported only if it beats contemporaneous |r| by ≥ 0.10.`,
      `Conditional triples on medians: reported when P(C | A,B) ≥ 0.70 and lift ≥ 1.5 with ≥ 5 supporting months.`,
      `Split-half stability: same sign and |r| > 0.2 in both halves.`,
      `Correlation is not causation; every finding is a hypothesis for a source-backed explanation, and the page says so.`,
    ],
  };
}

/**
 * Build synthetic-but-structured series from the panels for the demo state,
 * so the page is never blank before the refresh has accumulated months of
 * real observations. Marked clearly as illustrative on the page.
 */
export function illustrativeSeries(indicators: Indicator[], months = 36, seed = 7): Series[] {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Two latent factors drive everything: a "stress" factor and a "plumbing" factor.
  const stress: number[] = [];
  const plumbing: number[] = [];
  let st = 0;
  let pl = 0;
  for (let m = 0; m < months; m++) {
    st = 0.85 * st + (rnd() - 0.5);
    pl += 0.02 + 0.03 * (rnd() - 0.5);
    stress.push(st);
    plumbing.push(pl);
  }
  const start = new Date(Date.UTC(2023, 8, 1));
  return indicators.map((ind, idx) => {
    const loadS = ((idx * 7919) % 100) / 100 - 0.5;
    const loadP = ((idx * 104729) % 100) / 100 - 0.5;
    const lag = idx % 4;
    const points = [] as Series["points"];
    for (let m = 0; m < months; m++) {
      const d = new Date(start);
      d.setUTCMonth(d.getUTCMonth() + m);
      const sIdx = Math.max(0, m - lag);
      const v = 50 + 20 * loadS * stress[sIdx] + 30 * loadP * plumbing[m] + 5 * (rnd() - 0.5);
      points.push({ asOf: d.toISOString().slice(0, 10), value: Math.round(v * 100) / 100 });
    }
    return { indicatorId: ind.id, points };
  });
}

function round3(x: number) {
  return Math.round(x * 1000) / 1000;
}

// ═══════════════════════════════════════════════════════════════════════════
// Factor arithmetic and backtest (W8)
// ═══════════════════════════════════════════════════════════════════════════
// A factor is a data row (indicators.ts); this is the one place its
// arithmetic lives. Everything works on a monthly grid: the last reading in
// each month stands for the month, which is how the detector above already
// aligns series, so a factor's backtest and the pattern scan agree.

export type MonthlyPoint = { asOf: IsoDate; value: number };

const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));

/** Last reading per calendar month, in date order. Daily series become monthly here. */
export function monthEndPoints(points: MonthlyPoint[]): MonthlyPoint[] {
  const byMonth = new Map<string, MonthlyPoint>();
  for (const p of [...points].sort((a, b) => (a.asOf < b.asOf ? -1 : 1))) byMonth.set(monthKey(p.asOf), p);
  return Array.from(byMonth.values());
}

function shiftMonth(key: string, months: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 7);
}

/** Year-on-year percent change, month by month. */
export function yoyPct(points: MonthlyPoint[]): MonthlyPoint[] {
  const monthly = monthEndPoints(points);
  const byKey = new Map(monthly.map(p => [monthKey(p.asOf), p.value]));
  const out: MonthlyPoint[] = [];
  for (const p of monthly) {
    const prior = byKey.get(shiftMonth(monthKey(p.asOf), -12));
    if (prior === undefined || prior === 0) continue;
    out.push({ asOf: p.asOf, value: round3(((p.value - prior) / Math.abs(prior)) * 100) });
  }
  return out;
}

/**
 * Sahm rule (Sahm 2019): the three-month average of the unemployment rate
 * minus the lowest three-month average over the preceding twelve months.
 */
export function sahmRule(points: MonthlyPoint[]): MonthlyPoint[] {
  const monthly = monthEndPoints(points);
  const byKey = new Map(monthly.map(p => [monthKey(p.asOf), p.value]));
  const avg3 = new Map<string, number>();
  for (const p of monthly) {
    const k = monthKey(p.asOf);
    const a = byKey.get(shiftMonth(k, -1));
    const b = byKey.get(shiftMonth(k, -2));
    if (a === undefined || b === undefined) continue;
    avg3.set(k, (p.value + a + b) / 3);
  }
  const out: MonthlyPoint[] = [];
  for (const p of monthly) {
    const k = monthKey(p.asOf);
    const cur = avg3.get(k);
    if (cur === undefined) continue;
    let low = Infinity;
    for (let i = 1; i <= 12; i++) {
      const v = avg3.get(shiftMonth(k, -i));
      if (v !== undefined && v < low) low = v;
    }
    if (!Number.isFinite(low)) continue;
    out.push({ asOf: p.asOf, value: round3(cur - low) });
  }
  return out;
}

/** numerator / denominator × 100 on the months both report. */
export function ratioPct(numerator: MonthlyPoint[], denominator: MonthlyPoint[]): MonthlyPoint[] {
  const den = new Map(monthEndPoints(denominator).map(p => [monthKey(p.asOf), p.value]));
  const out: MonthlyPoint[] = [];
  for (const p of monthEndPoints(numerator)) {
    const d = den.get(monthKey(p.asOf));
    if (d === undefined || d === 0) continue;
    out.push({ asOf: p.asOf, value: round3((p.value / d) * 100) });
  }
  return out;
}

/** Apply a factor row's transform to its stored base series. */
export function transformSeries(transform: FactorSpec["transform"], base: MonthlyPoint[], denominator: MonthlyPoint[] = []): MonthlyPoint[] {
  switch (transform) {
    case "level":
      return monthEndPoints(base);
    case "yoy":
      return yoyPct(base);
    case "sahm":
      return sahmRule(base);
    case "ratio-pct":
      return ratioPct(base, denominator);
  }
}

/**
 * A factor value → a signal in [−1, 1] where positive means "the target
 * moves up / fires". `direction` is the row's: risk-down flips the sign.
 */
export function factorSignal(value: number, spec: { neutral: number; span: number }, direction: Direction): number {
  if (spec.span === 0) return 0;
  let s = clamp1((value - spec.neutral) / Math.abs(spec.span));
  if (spec.span < 0) s = -s;
  if (direction === "risk-down") s = -s;
  return round3(s);
}

export type BacktestOptions = {
  horizonMonths: number;
  direction: Direction;
  neutral: number;
  span: number;
  targetKind: "level" | "binary";
  minN?: number;
  minAbsR?: number;
  minHitRate?: number;
  neutralBand?: number;
  today?: IsoDate;
};

/**
 * Does the factor LEAD its target at the stated horizon?
 *
 * For each month t with a factor reading: signal s_t; outcome d_t is the
 * target's change over t..t+h (level) or whether it fired inside (t, t+h]
 * (binary). Lead r = Pearson(s, d). Hit rate counts the months where |s| is
 * outside the neutral band and sign(s) matched sign(d) (binary: s > 0 ⇔
 * fired). r0 is the same correlation against the target's move over the
 * PRECEDING h months, so a reader can see whether the factor leads or merely
 * follows. Verdict: signal when n ≥ minN, |r| ≥ minAbsR and hit rate ≥
 * minHitRate; context otherwise; pending when n < minN.
 */
export function backtestFactor(indicatorId: string, factorPoints: MonthlyPoint[], targetPoints: MonthlyPoint[], opts: BacktestOptions): FactorVerdict {
  const h = opts.horizonMonths;
  const minN = opts.minN ?? 60;
  const minAbsR = opts.minAbsR ?? 0.2;
  const minHitRate = opts.minHitRate ?? 0.55;
  const band = opts.neutralBand ?? 0.1;
  const f = new Map(monthEndPoints(factorPoints).map(p => [monthKey(p.asOf), p.value]));
  const tMonthly = monthEndPoints(targetPoints);
  const t = new Map(tMonthly.map(p => [monthKey(p.asOf), p.value]));
  const tKeys = tMonthly.map(p => monthKey(p.asOf));
  const xs: number[] = [];
  const ys: number[] = [];
  const xs0: number[] = [];
  const ys0: number[] = [];
  let decided = 0;
  let hits = 0;
  let lastKey: string | null = null;
  const firedIn = (from: string, to: string): number | null => {
    const inWin = tKeys.filter(k => k > from && k <= to);
    if (!inWin.length) return null;
    return inWin.some(k => (t.get(k) ?? 0) >= 0.5) ? 1 : 0;
  };
  for (const [k, v] of Array.from(f.entries()).sort()) {
    const s = factorSignal(v, opts, opts.direction);
    const ahead = shiftMonth(k, h);
    const behind = shiftMonth(k, -h);
    let d: number | null = null;
    let d0: number | null = null;
    if (opts.targetKind === "binary") {
      d = firedIn(k, ahead);
      d0 = firedIn(behind, k);
    } else {
      const now = t.get(k);
      const later = t.get(ahead);
      const earlier = t.get(behind);
      if (now !== undefined && later !== undefined) d = later - now;
      if (now !== undefined && earlier !== undefined) d0 = now - earlier;
    }
    if (d === null) continue;
    xs.push(s);
    ys.push(d);
    lastKey = k;
    if (d0 !== null) {
      xs0.push(s);
      ys0.push(d0);
    }
    if (Math.abs(s) >= band) {
      const predictedUp = s > 0;
      const wentUp = opts.targetKind === "binary" ? d === 1 : d > 0;
      if (opts.targetKind === "level" && d === 0) continue;
      decided++;
      if (predictedUp === wentUp) hits++;
    }
  }
  const n = xs.length;
  const leadR = n >= 3 ? round3(pearson(xs, ys)) : null;
  const r0 = xs0.length >= 3 ? round3(pearson(xs0, ys0)) : null;
  const hitRate = decided ? round3(hits / decided) : null;
  const asOf = lastKey ? `${lastKey}-28` : null;
  if (n < minN) {
    return { indicatorId, verdict: "pending", leadR, hitRate, r0, n, horizonMonths: h, asOf, reason: `${n} scored months; ${minN} needed before a lead can be called` };
  }
  const passes = leadR !== null && Math.abs(leadR) >= minAbsR && hitRate !== null && hitRate >= minHitRate;
  if (passes) {
    return { indicatorId, verdict: "signal", leadR, hitRate, r0, n, horizonMonths: h, asOf, reason: `lead r ${leadR} at ${h} months (contemporaneous ${r0 ?? "n/a"}), hit rate ${Math.round((hitRate ?? 0) * 100)}% over ${n} months` };
  }
  return { indicatorId, verdict: "context", leadR, hitRate, r0, n, horizonMonths: h, asOf, reason: `no measurable lead: r ${leadR ?? "n/a"} (need |r| ≥ ${minAbsR}), hit rate ${hitRate === null ? "n/a" : Math.round(hitRate * 100) + "%"} (need ≥ ${Math.round(minHitRate * 100)}%) over ${n} months; kept as context, weight 0` };
}

/**
 * Apply verdicts to a panel: a factor that is context or pending keeps its
 * row (so the page can show it) but carries weight 0 into any model, and its
 * rationale says so.
 */
export function applyFactorVerdicts(indicators: Indicator[], verdicts: FactorVerdict[]): Indicator[] {
  const byId = new Map(verdicts.map(v => [v.indicatorId, v]));
  return indicators.map(i => {
    if (!i.factor) return i;
    const v = byId.get(i.id);
    if (v && v.verdict === "signal") return i;
    const label = v ? v.verdict : "pending";
    return { ...i, weight: 0, rationale: `[${label}: context, weight 0] ${i.rationale}` };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Archaeology (owner's ask, 23 Sep 2026): domino chains, loudest movers,
// regime splits — the scans that find what no pairwise correlation shows.
// ═══════════════════════════════════════════════════════════════════════════

export type DominoChain = {
  /** Series ids in causal order. */
  path: string[];
  /** Lag at each link, months. */
  lags: number[];
  totalLagMonths: number;
  /** Product of the link correlations (sign carries through). */
  strength: number;
  /** Minimum link confidence. */
  confidence: number;
  reading: string;
};

/**
 * Chain lead-lag findings into dominoes: A→B (lag k1) and B→C (lag k2) become
 * A→B→C with lag k1+k2, when each link's |r| clears the threshold. Cycles are
 * refused; chains are ranked by |strength|. This is the "domino effect" scan:
 * a five-link chain such as fed funds → dollar → foreign holdings → term
 * premium → mortgage rate is invisible to any pairwise table.
 */
export function dominoChains(leads: PairFinding[], opts: { maxLinks?: number; minAbsR?: number; maxChains?: number } = {}): DominoChain[] {
  const maxLinks = opts.maxLinks ?? 5;
  const minAbsR = opts.minAbsR ?? 0.3;
  const links = leads.filter(f => f.kind === "lead-lag" && Math.abs(f.r) >= minAbsR && f.lag >= 1);
  const byLeader = new Map<string, PairFinding[]>();
  for (const l of links) byLeader.set(l.a, [...(byLeader.get(l.a) ?? []), l]);
  const chains: DominoChain[] = [];
  const walk = (path: string[], lags: number[], strength: number, confidence: number) => {
    if (path.length >= 3) {
      chains.push({ path: [...path], lags: [...lags], totalLagMonths: lags.reduce((s, x) => s + x, 0), strength: round3(strength), confidence, reading: path.map((id, i) => (i === 0 ? nameOf(id) : `→ (${lags[i - 1]} m) ${nameOf(id)}`)).join(" ") });
    }
    if (path.length >= maxLinks) return;
    for (const next of byLeader.get(path[path.length - 1]) ?? []) {
      if (path.includes(next.b)) continue;
      walk([...path, next.b], [...lags, next.lag], strength * next.r, Math.min(confidence, next.confidence));
    }
  };
  for (const first of links) walk([first.a, first.b], [first.lag], first.r, first.confidence);
  chains.sort((x, y) => Math.abs(y.strength) - Math.abs(x.strength) || y.path.length - x.path.length);
  // Keep the longest chain per distinct path prefix so sub-chains do not crowd out their parents.
  const seen = new Set<string>();
  const out: DominoChain[] = [];
  for (const ch of chains) {
    const key = ch.path.join(">");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ch);
    if (out.length >= (opts.maxChains ?? 25)) break;
  }
  return out;
}

export type TurningPoint = { asOf: IsoDate; kind: "peak" | "trough"; value: number };

/**
 * Turning points of a rate series on a monthly grid: a peak is a month whose
 * value is the highest of the surrounding ±window months and at least
 * `minSwing` above the following trough; troughs symmetrically. This is how
 * the archaeology finds "the change in interest rates" without a human
 * naming the dates.
 */
export function turningPoints(points: MonthlyPoint[], opts: { window?: number; minSwing?: number } = {}): TurningPoint[] {
  const window = opts.window ?? 6;
  const minSwing = opts.minSwing ?? 1;
  const m = monthEndPoints(points);
  const out: TurningPoint[] = [];
  for (let i = window; i < m.length - window; i++) {
    const v = m[i].value;
    const around = m.slice(i - window, i + window + 1).map(p => p.value);
    const isPeak = v === Math.max(...around) && around.filter(x => x === v).length === 1;
    const isTrough = v === Math.min(...around) && around.filter(x => x === v).length === 1;
    if (!isPeak && !isTrough) continue;
    const after = m.slice(i + 1, i + 1 + 24).map(p => p.value);
    const swing = isPeak ? v - Math.min(...after) : Math.max(...after) - v;
    if (!Number.isFinite(swing) || swing < minSwing) continue;
    const last = out[out.length - 1];
    if (last && last.kind === (isPeak ? "peak" : "trough")) continue; // peaks and troughs must alternate
    out.push({ asOf: m[i].asOf, kind: isPeak ? "peak" : "trough", value: v });
  }
  return out;
}

export type LoudestMover = { indicatorId: string; name: string; z: number; awareness: Indicator["awareness"] };
export type LoudestReport = { turningPoint: TurningPoint; movers: LoudestMover[] };

/**
 * "Screamed the loudest": for each turning point of the reference series,
 * every other series' move over the preceding `lookback` months expressed as
 * a z-score against its own history of such moves. The ones at the top are the
 * ones that were shouting before the turn, whether or not anyone was listening;
 * the awareness tag says whether anyone was.
 */
export function loudestBeforeTurns(series: Series[], referenceId: string, opts: { lookback?: number; window?: number; minSwing?: number; top?: number } = {}): LoudestReport[] {
  const lookback = opts.lookback ?? 6;
  const top = opts.top ?? 8;
  const ref = series.find(s => s.indicatorId === referenceId);
  if (!ref) return [];
  const { keys, matrix } = alignMonthly(series);
  const idx = new Map(keys.map((k, i) => [k, i]));
  const tps = turningPoints(ref.points.map(p => ({ asOf: p.asOf, value: p.value })), { window: opts.window, minSwing: opts.minSwing });
  // Distribution of lookback-month changes per series, for the z-score.
  const changeStats = new Map<string, { mean: number; sd: number }>();
  matrix.forEach((row, id) => {
    const ch: number[] = [];
    for (let t = lookback; t < row.length; t++) {
      const a = row[t - lookback];
      const b = row[t];
      if (a === null || b === null || a === undefined || b === undefined) continue;
      ch.push(b - a);
    }
    if (ch.length < 12) return;
    const mean = ch.reduce((s, x) => s + x, 0) / ch.length;
    const sd = Math.sqrt(ch.reduce((s, x) => s + (x - mean) ** 2, 0) / ch.length) || 1;
    changeStats.set(id, { mean, sd });
  });
  const out: LoudestReport[] = [];
  for (const tp of tps) {
    const t = idx.get(monthKey(tp.asOf));
    if (t === undefined || t < lookback) continue;
    const movers: LoudestMover[] = [];
    matrix.forEach((row, id) => {
      if (id === referenceId) return;
      const st = changeStats.get(id);
      const a = row[t - lookback];
      const b = row[t];
      if (!st || a === null || b === null || a === undefined || b === undefined) return;
      const z = (b - a - st.mean) / st.sd;
      movers.push({ indicatorId: id, name: nameOf(id), z: round3(z), awareness: INDICATOR_BY_ID.get(id)?.awareness ?? "structural" });
    });
    movers.sort((x, y) => Math.abs(y.z) - Math.abs(x.z));
    out.push({ turningPoint: tp, movers: movers.slice(0, top) });
  }
  return out;
}

/**
 * Regime split: the same lead-lag measured separately when the reference
 * series was rising and when it was falling. An asymmetry (card rates follow
 * hikes but not cuts, H30) is a signal a pooled correlation hides.
 */
export function regimeSplit(leader: MonthlyPoint[], follower: MonthlyPoint[], reference: MonthlyPoint[], lag: number): { rising: { r: number; n: number }; falling: { r: number; n: number }; asymmetry: number } {
  const L = new Map(monthEndPoints(leader).map(p => [monthKey(p.asOf), p.value]));
  const F = new Map(monthEndPoints(follower).map(p => [monthKey(p.asOf), p.value]));
  const R = monthEndPoints(reference);
  const rx: number[] = [], ry: number[] = [], fx: number[] = [], fy: number[] = [];
  for (let i = 12; i < R.length; i++) {
    const k = monthKey(R[i].asOf);
    const dir = R[i].value - R[i - 12].value;
    const [y, m] = k.split("-").map(Number);
    const ahead = new Date(Date.UTC(y, m - 1 + lag, 1)).toISOString().slice(0, 7);
    const lv = L.get(k);
    const fv = F.get(ahead);
    const fv0 = F.get(k);
    if (lv === undefined || fv === undefined || fv0 === undefined) continue;
    if (dir > 0) {
      rx.push(lv);
      ry.push(fv - fv0);
    } else if (dir < 0) {
      fx.push(lv);
      fy.push(fv - fv0);
    }
  }
  const rising = { r: rx.length >= 6 ? round3(pearson(rx, ry)) : 0, n: rx.length };
  const falling = { r: fx.length >= 6 ? round3(pearson(fx, fy)) : 0, n: fx.length };
  return { rising, falling, asymmetry: round3(rising.r - falling.r) };
}

/** Latest reading of each series as a z-score against its own full history — the prediction grid's input. */
export function latestZScores(series: Series[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of series) {
    const vals = s.points.map(p => p.value).filter(v => Number.isFinite(v));
    if (vals.length < 12) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
    const last = [...s.points].sort((a, b) => (a.asOf < b.asOf ? -1 : 1))[s.points.length - 1];
    if (!last || !sd) continue;
    out.set(s.indicatorId, round3((last.value - mean) / sd));
  }
  return out;
}

/** Coverage in years between two dates, one decimal. */
export function coverageYears(earliest: IsoDate | null, latest: IsoDate | null): number {
  if (!earliest || !latest) return 0;
  const ms = Date.parse(latest) - Date.parse(earliest);
  return Math.max(0, Math.round((ms / (365.25 * 86_400_000)) * 10) / 10);
}
