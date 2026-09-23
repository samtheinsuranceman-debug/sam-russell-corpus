/**
 * Macro Scoring — log the day's factor forecasts, score the ones that matured (W8).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every refresh writes one `macro_forecast_log` row per factor
 * (`modelId = factor:<id>`): the probability that the target moves the
 * factor's way over its horizon, from the current signal. When a row's
 * horizon has passed it is scored against the stored target (Brier), marked
 * scored, and the factor's running score in `macro_factor_scores` moves.
 * The backtest verdict lives in the same row so one read gives Thomas the
 * lead, the hit rate and the live track record together.
 *
 * Arithmetic is in `shared/macro/scoring.ts`; this file only reads and writes.
 *
 * PORT TO THE TRUNK: copies unchanged with `macroHistory.ts`.
 */
import {
  A,
  ALL_FACTORS,
  factorSignal,
  resolveFactorForecast,
  updateRunning,
  meanBrier,
  hitRate as runningHitRate,
  skill,
  valueAtOrBefore,
  type FactorForecast,
  type FactorVerdict,
  type RunningScore,
  type MonthlyPoint,
} from "@shared/macro";
import { factorSeries, loadSeries } from "./macroHistory";

type Db = NonNullable<Awaited<ReturnType<typeof import("./db").getDb>>>;

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export type FactorScoreRow = {
  indicatorId: string;
  verdict: FactorVerdict["verdict"];
  leadR: number | null;
  hitRate: number | null;
  r0: number | null;
  backtestN: number;
  backtestAsOf: string | null;
  reason: string;
  running: RunningScore;
  meanBrier: number | null;
  liveHitRate: number | null;
  skill: number | null;
};

/** Persist backtest verdicts (one row per factor; running scores untouched). */
export async function storeVerdicts(db: Db, verdicts: FactorVerdict[]): Promise<void> {
  const { macroFactorScores } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  for (const v of verdicts) {
    const [row] = await db.select().from(macroFactorScores).where(eq(macroFactorScores.indicatorId, v.indicatorId)).limit(1);
    const values = { verdict: v.verdict, leadR: v.leadR === null ? null : String(v.leadR), hitRate: v.hitRate === null ? null : String(v.hitRate), r0: v.r0 === null ? null : String(v.r0), backtestN: v.n, backtestAsOf: v.asOf, reason: v.reason.slice(0, 500) };
    if (row) await db.update(macroFactorScores).set(values).where(eq(macroFactorScores.indicatorId, v.indicatorId));
    else await db.insert(macroFactorScores).values({ indicatorId: v.indicatorId, ...values });
  }
}

export async function loadFactorScores(db: Db): Promise<FactorScoreRow[]> {
  const { macroFactorScores } = await import("../drizzle/schema");
  const rows = await db.select().from(macroFactorScores);
  return rows.map(r => {
    const running: RunningScore = { indicatorId: r.indicatorId, n: r.n, brierSum: Number(r.brierSum), hits: r.hits, lastScoredAsOf: r.lastScoredAsOf };
    return {
      indicatorId: r.indicatorId,
      verdict: r.verdict as FactorVerdict["verdict"],
      leadR: r.leadR === null ? null : Number(r.leadR),
      hitRate: r.hitRate === null ? null : Number(r.hitRate),
      r0: r.r0 === null ? null : Number(r.r0),
      backtestN: r.backtestN,
      backtestAsOf: r.backtestAsOf,
      reason: r.reason ?? "",
      running,
      meanBrier: meanBrier(running),
      liveHitRate: runningHitRate(running),
      skill: skill(running),
    };
  });
}

/** The forecast a factor makes today from its latest stored value. */
export function forecastFromSignal(indicatorId: string, signal: number, today: string, spec: { target: string; targetKind: "level" | "binary"; horizonMonths: number }, targetValueAtForecast: number | null): FactorForecast {
  const band = A("factor.backtest.neutralBand");
  const direction: 1 | -1 | 0 = signal >= band ? 1 : signal <= -band ? -1 : 0;
  const probability = Math.round(sigmoid(A("factor.forecast.scale") * Math.abs(signal)) * 10_000) / 10_000;
  return { modelId: `factor:${indicatorId}`, indicatorId, asOf: today, probability: direction === 0 ? 0.5 : probability, horizonMonths: spec.horizonMonths, target: spec.target, targetKind: spec.targetKind, targetValueAtForecast, direction };
}

/** Log one forecast per factor from its latest stored value. Returns the signals for the brief. */
export async function logFactorForecasts(db: Db, today: string): Promise<Array<{ indicatorId: string; value: number | null; signal: number | null; probability: number | null; asOf: string | null }>> {
  const { macroForecastLog } = await import("../drizzle/schema");
  const out: Array<{ indicatorId: string; value: number | null; signal: number | null; probability: number | null; asOf: string | null }> = [];
  const targetCache = new Map<string, MonthlyPoint[]>();
  for (const f of ALL_FACTORS) {
    const spec = f.factor!;
    const points = await factorSeries(db, f);
    const latest = points[points.length - 1];
    if (!latest) {
      out.push({ indicatorId: f.id, value: null, signal: null, probability: null, asOf: null });
      continue;
    }
    const signal = factorSignal(latest.value, spec, f.direction);
    let target = targetCache.get(spec.target);
    if (!target) {
      const tf = ALL_FACTORS.find(x => x.id === spec.target);
      target = tf ? await factorSeries(db, tf) : await loadSeries(db, spec.target);
      targetCache.set(spec.target, target);
    }
    const tv = spec.targetKind === "level" ? valueAtOrBefore(target, today)?.value ?? null : null;
    const fc = forecastFromSignal(f.id, signal, today, spec, tv);
    await db.insert(macroForecastLog).values({
      modelId: fc.modelId,
      asOf: today,
      probability: String(fc.probability),
      low: null,
      high: null,
      confidence: null,
      grade: null,
      payloadJson: JSON.stringify({ ...fc, value: latest.value, valueAsOf: latest.asOf }),
    });
    out.push({ indicatorId: f.id, value: latest.value, signal, probability: fc.probability, asOf: latest.asOf });
  }
  return out;
}

/** Score every unscored factor forecast whose horizon has passed; update running scores. */
export async function scoreMaturedForecasts(db: Db, today: string): Promise<{ scored: number; pending: number }> {
  const { macroForecastLog, macroFactorScores } = await import("../drizzle/schema");
  const { and, eq, isNull, like } = await import("drizzle-orm");
  const rows = await db.select().from(macroForecastLog).where(and(like(macroForecastLog.modelId, "factor:%"), isNull(macroForecastLog.scoredAt))).limit(5000);
  let scored = 0;
  let pending = 0;
  const targetCache = new Map<string, MonthlyPoint[]>();
  const runningCache = new Map<string, RunningScore>();
  for (const row of rows) {
    let fc: FactorForecast;
    try {
      fc = JSON.parse(row.payloadJson) as FactorForecast;
    } catch {
      continue;
    }
    let target = targetCache.get(fc.target);
    if (!target) {
      const tf = ALL_FACTORS.find(x => x.id === fc.target);
      target = tf ? await factorSeries(db, tf) : await loadSeries(db, fc.target);
      targetCache.set(fc.target, target);
    }
    const r = resolveFactorForecast(fc, target, today);
    if (!r.resolved) {
      pending++;
      continue;
    }
    await db.update(macroForecastLog).set({ outcome: r.outcome, brier: String(r.brier), scoredAt: new Date() }).where(eq(macroForecastLog.id, row.id));
    let running = runningCache.get(fc.indicatorId);
    if (!running) {
      const [existing] = await db.select().from(macroFactorScores).where(eq(macroFactorScores.indicatorId, fc.indicatorId)).limit(1);
      running = existing ? { indicatorId: fc.indicatorId, n: existing.n, brierSum: Number(existing.brierSum), hits: existing.hits, lastScoredAsOf: existing.lastScoredAsOf } : { indicatorId: fc.indicatorId, n: 0, brierSum: 0, hits: 0, lastScoredAsOf: null };
      if (!existing) await db.insert(macroFactorScores).values({ indicatorId: fc.indicatorId, verdict: "pending", reason: "no backtest yet" });
    }
    running = updateRunning(running, r);
    runningCache.set(fc.indicatorId, running);
    scored++;
  }
  for (const [id, s] of Array.from(runningCache.entries())) {
    await db.update(macroFactorScores).set({ n: s.n, brierSum: String(s.brierSum), hits: s.hits, lastScoredAsOf: s.lastScoredAsOf }).where(eq(macroFactorScores.indicatorId, id));
  }
  return { scored, pending };
}
