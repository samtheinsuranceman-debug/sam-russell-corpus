// ============================================================
// CALIBRATION-WEIGHTED CONSENSUS BUS — software embodiment.
// Patent family shared component 5 (lifts AQAL-001, 003, 004).
//
// Weights each of the 8 panel models, per dimension, by its own
// HISTORICAL calibration accuracy: models that have tracked the
// panel's settled consensus closely on a given line earn more
// weight on that line; models that scatter earn less.
//
// HONEST SCOPE:
// - Cold start is equal weights. Until a model has MIN_SAMPLES
//   recorded observations on a dimension, it gets weight 1.0 —
//   the bus never invents accuracy history it does not have.
// - The reference signal is the settled trimmed-mean consensus
//   (each model's error = distance from what the full panel
//   agreed, accumulated over real scoring runs). This measures
//   calibration-to-panel, which is the claimed mechanism; it is
//   not a claim of ground-truth validity, which no instrument
//   has for these constructs yet.
// - The trimmed-mean outlier guard stays ON underneath the
//   weights: a well-calibrated model that suddenly produces an
//   outlier is still trimmed on that axis.
// ============================================================
import { trimmedMean, agreement, type AxisScore } from "../scoring/consensus";

export const MIN_SAMPLES = 5;
const ERR_EPSILON = 0.02; // floor on mean abs error so no model's weight explodes

export type CalibrationStat = { model: string; axisIndex: number; n: number; sumAbsErr: number };

// weight = 1 / (meanAbsErr + ε), equal-weight (1.0) until enough samples.
// Scores live on 0..1, so meanAbsErr of ~0.02 (excellent) → weight ~25,
// ~0.25 (scatter) → weight ~3.7. Normalization happens at combine time.
export function calibrationWeight(stat: CalibrationStat | undefined): number {
  if (!stat || stat.n < MIN_SAMPLES) return 1.0;
  const meanAbsErr = stat.sumAbsErr / stat.n;
  return 1 / (meanAbsErr + ERR_EPSILON);
}

export type ModelAxisScores = { model: string; scores: AxisScore[] };
export type WeightsProvider = (model: string, axisIndex: number) => number;

export const equalWeights: WeightsProvider = () => 1.0;

// Weighted mean over the values that SURVIVE the trim (with >=4 models the
// single highest and single lowest raw scores are excluded, exactly as the
// unweighted consensus does), then weights applied to the survivors.
export function weightedTrimmedMean(entries: Array<{ value: number; weight: number }>): number {
  if (entries.length === 0) return 0;
  let pool = entries;
  if (entries.length >= 4) {
    const sorted = [...entries].sort((a, b) => a.value - b.value);
    pool = sorted.slice(1, sorted.length - 1);
  }
  const totalWeight = pool.reduce((a, e) => a + e.weight, 0);
  if (totalWeight <= 0) return trimmedMean(entries.map((e) => e.value));
  return pool.reduce((a, e) => a + e.value * e.weight, 0) / totalWeight;
}

// The bus: combine per-model axis arrays into one calibrated consensus.
// With an equal-weights provider this reproduces the classic trimmed-mean
// consensus exactly — the calibration path is a strict generalization.
export function calibratedConsensus(
  perModel: ModelAxisScores[],
  weightsFor: WeightsProvider = equalWeights,
): AxisScore[] {
  const models = perModel.filter((m) => m.scores && m.scores.length > 0);
  if (models.length === 0) return [];
  if (models.length === 1) return models[0].scores;

  const axisIndices = models[0].scores.map((s) => s.axisIndex);
  return axisIndices.map((idx) => {
    const picks = models
      .map((m) => ({ model: m.model, s: m.scores.find((s) => s.axisIndex === idx) }))
      .filter((p): p is { model: string; s: AxisScore } => !!p.s);
    const entries = picks.map((p) => ({ value: p.s.score, weight: weightsFor(p.model, idx) }));
    const values = entries.map((e) => e.value);
    const confs = picks.map((p) => p.s.confidence ?? 0.5);

    const score = weightedTrimmedMean(entries);
    const agree = agreement(values);
    const meanConf = confs.reduce((a, b) => a + b, 0) / confs.length;
    const confidence = Math.max(0, Math.min(1, 0.5 * meanConf + 0.5 * agree));

    const calibrated = entries.some((e) => e.weight !== 1.0);
    return {
      axisIndex: idx,
      axisName: picks[0].s.axisName,
      score,
      confidence,
      reasoning: `Consensus of ${picks.length} models · ${(agree * 100).toFixed(0)}% agreement${calibrated ? " · calibration-weighted" : ""}.`,
    };
  });
}

// Per-run calibration observation: each model's absolute error against the
// settled consensus, per axis. Returned for persistence by the caller.
export function calibrationObservations(
  perModel: ModelAxisScores[],
  consensus: AxisScore[],
): Array<{ model: string; axisIndex: number; absErr: number }> {
  const byAxis = new Map(consensus.map((c) => [c.axisIndex, c.score]));
  const out: Array<{ model: string; axisIndex: number; absErr: number }> = [];
  for (const m of perModel) {
    for (const s of m.scores ?? []) {
      const ref = byAxis.get(s.axisIndex);
      if (ref !== undefined) out.push({ model: m.model, axisIndex: s.axisIndex, absErr: Math.abs(s.score - ref) });
    }
  }
  return out;
}

// ── Database glue ───────────────────────────────────────────────────────────

export async function loadCalibrationStats(): Promise<Map<string, CalibrationStat>> {
  const map = new Map<string, CalibrationStat>();
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return map;
  const { modelCalibration } = await import("../../drizzle/schema");
  const rows = await db.select().from(modelCalibration);
  for (const r of rows) map.set(`${r.model}|${r.axisIndex}`, r as CalibrationStat);
  return map;
}

export function weightsFromStats(stats: Map<string, CalibrationStat>): WeightsProvider {
  return (model, axisIndex) => calibrationWeight(stats.get(`${model}|${axisIndex}`));
}

export async function recordCalibrationObservations(
  obs: Array<{ model: string; axisIndex: number; absErr: number }>,
): Promise<void> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db || obs.length === 0) return;
  const { modelCalibration } = await import("../../drizzle/schema");
  const { sql } = await import("drizzle-orm");
  try {
    for (const o of obs) {
      await db.insert(modelCalibration)
        .values({ model: o.model, axisIndex: o.axisIndex, n: 1, sumAbsErr: o.absErr })
        .onDuplicateKeyUpdate({
          set: {
            n: sql`${modelCalibration.n} + 1`,
            sumAbsErr: sql`${modelCalibration.sumAbsErr} + ${o.absErr}`,
          },
        });
    }
  } catch (error) {
    console.warn("[calibration] record failed:", String(error).slice(0, 200));
  }
}
