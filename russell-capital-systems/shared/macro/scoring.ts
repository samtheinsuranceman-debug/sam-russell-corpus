/**
 * Forecast scoring — Brier scores for the daily factor forecasts (W8).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every day the refresh logs, per factor, "the probability that the target
 * moves in the factor's direction over the horizon". When that horizon has
 * passed, the forecast is scored against what the target actually did. The
 * running mean Brier score per factor is what Thomas quotes beside the
 * probability, because a probability with no track record is an opinion.
 *
 * Brier = (p − outcome)²: 0 is perfect, 0.25 is the score of a coin flip on a
 * 50/50 event, 1 is confidently wrong. Skill = 1 − Brier / 0.25 reads as
 * "how much better than a coin flip", and goes negative when worse.
 *
 * Pure: no dates from the clock, no database. `server/macroScoring.ts` does
 * the reading and writing.
 */
import type { IsoDate } from "./types";
import type { MonthlyPoint } from "./emergentPatterns";

export type FactorForecast = {
  /** `factor:<indicatorId>` in `macro_forecast_log`. */
  modelId: string;
  indicatorId: string;
  asOf: IsoDate;
  /** P(target moves in the factor's direction over the horizon). */
  probability: number;
  horizonMonths: number;
  target: string;
  targetKind: "level" | "binary";
  /** Target level on the forecast date (level targets). */
  targetValueAtForecast: number | null;
  /** +1 when the factor says "target up", −1 for "down", 0 when neutral (not scored). */
  direction: 1 | -1 | 0;
};

export type RunningScore = {
  indicatorId: string;
  n: number;
  brierSum: number;
  hits: number;
  lastScoredAsOf: IsoDate | null;
};

export function brier(probability: number, outcome: 0 | 1): number {
  const p = Math.min(1, Math.max(0, probability));
  return (p - outcome) * (p - outcome);
}

export function addMonths(d: IsoDate, months: number): IsoDate {
  const [y, m, day] = d.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + months, day));
  // Clamp to the last day of the target month when the source day does not exist there.
  if (t.getUTCMonth() !== ((m - 1 + months) % 12 + 12) % 12) t.setUTCDate(0);
  return t.toISOString().slice(0, 10);
}

/** The target's value at or after `date` (first point on/after), or null. */
export function valueAtOrAfter(points: MonthlyPoint[], date: IsoDate): MonthlyPoint | null {
  let best: MonthlyPoint | null = null;
  for (const p of points) {
    if (p.asOf >= date && (!best || p.asOf < best.asOf)) best = p;
  }
  return best;
}

/** The target's last value on or before `date`, or null. */
export function valueAtOrBefore(points: MonthlyPoint[], date: IsoDate): MonthlyPoint | null {
  let best: MonthlyPoint | null = null;
  for (const p of points) {
    if (p.asOf <= date && (!best || p.asOf > best.asOf)) best = p;
  }
  return best;
}

export type Resolution =
  | { resolved: false; reason: string }
  | { resolved: true; outcome: 0 | 1; brier: number; hit: boolean; resolvedAt: IsoDate; targetThen: number };

/**
 * Score one forecast if its horizon has passed and the target has a reading
 * at or after maturity. A neutral forecast (direction 0) is never scored:
 * "no view" is not a prediction.
 */
export function resolveFactorForecast(f: FactorForecast, targetPoints: MonthlyPoint[], today: IsoDate): Resolution {
  if (f.direction === 0) return { resolved: false, reason: "neutral forecast; not scored" };
  const maturity = addMonths(f.asOf, f.horizonMonths);
  if (today < maturity) return { resolved: false, reason: `matures ${maturity}` };
  if (f.targetKind === "binary") {
    // Did the binary target fire at any point inside the window?
    const inWindow = targetPoints.filter(p => p.asOf > f.asOf && p.asOf <= maturity);
    if (!inWindow.length) return { resolved: false, reason: "no target readings inside the window" };
    const fired = inWindow.some(p => p.value >= 0.5);
    const outcome: 0 | 1 = fired === (f.direction > 0) ? 1 : 0;
    const last = inWindow[inWindow.length - 1];
    return { resolved: true, outcome, brier: brier(f.probability, outcome), hit: outcome === 1, resolvedAt: last.asOf, targetThen: last.value };
  }
  const then = valueAtOrAfter(targetPoints, maturity);
  if (!then) return { resolved: false, reason: "target has no reading at maturity yet" };
  if (f.targetValueAtForecast === null) return { resolved: false, reason: "no target level recorded at forecast time" };
  const moved = Math.sign(then.value - f.targetValueAtForecast);
  const outcome: 0 | 1 = moved === f.direction ? 1 : 0;
  return { resolved: true, outcome, brier: brier(f.probability, outcome), hit: outcome === 1, resolvedAt: then.asOf, targetThen: then.value };
}

export function updateRunning(score: RunningScore, r: Extract<Resolution, { resolved: true }>): RunningScore {
  return {
    indicatorId: score.indicatorId,
    n: score.n + 1,
    brierSum: score.brierSum + r.brier,
    hits: score.hits + (r.hit ? 1 : 0),
    lastScoredAsOf: !score.lastScoredAsOf || r.resolvedAt > score.lastScoredAsOf ? r.resolvedAt : score.lastScoredAsOf,
  };
}

export function meanBrier(s: RunningScore): number | null {
  return s.n ? Math.round((s.brierSum / s.n) * 10_000) / 10_000 : null;
}

export function hitRate(s: RunningScore): number | null {
  return s.n ? Math.round((s.hits / s.n) * 10_000) / 10_000 : null;
}

/** 1 − Brier/0.25: positive beats a coin flip, negative is worse than one. */
export function skill(s: RunningScore): number | null {
  const b = meanBrier(s);
  return b === null ? null : Math.round((1 - b / 0.25) * 1000) / 1000;
}

/** One line for the brief: how the factor forecasts have scored so far. */
export function accuracyLine(scores: RunningScore[]): string {
  const scored = scores.filter(s => s.n > 0);
  if (!scored.length) return "ACCURACY: no factor forecast has matured yet; the first scores arrive when the shortest horizon (3 months) passes.";
  const n = scored.reduce((a, s) => a + s.n, 0);
  const b = scored.reduce((a, s) => a + s.brierSum, 0) / n;
  const hits = scored.reduce((a, s) => a + s.hits, 0);
  const best = [...scored].sort((x, y) => (meanBrier(x) ?? 1) - (meanBrier(y) ?? 1)).slice(0, 3).map(s => `${s.indicatorId} ${meanBrier(s)}`);
  return `ACCURACY: ${n} matured factor forecasts, mean Brier ${b.toFixed(3)} (coin flip 0.250), hit rate ${Math.round((hits / n) * 100)}%. Best: ${best.join(", ")}.`;
}
