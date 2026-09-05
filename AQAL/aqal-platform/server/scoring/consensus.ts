// ============================================================
// Multi-AI consensus — aggregate N independent models' 32-line scores
// ============================================================
// The high-confidence tier scores each response with a PANEL of AI models from
// different developers, then combines them so no single model's quirks decide a
// result. Aggregation = trimmed mean (drop the outlier). Confidence rises when
// the models agree and falls when they diverge — which is the honest meaning of
// "high confidence."

export type AxisScore = {
  axisIndex: number;
  axisName: string;
  score: number;
  confidence: number;
  reasoning?: string;
};

// Trimmed mean: with >=4 values, drop one lowest + one highest, then average.
// Fewer than 4 → plain mean (nothing safe to trim).
export function trimmedMean(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length < 4) return values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, sorted.length - 1);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

// Agreement in [0,1]: 1 when models cluster tightly, ~0 when they scatter.
// Scores live on 0..1, so a standard deviation of ~0.25 is treated as full
// disagreement.
export function agreement(values: number[]): number {
  if (values.length < 2) return 0.5; // single model → neutral, not "certain"
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const sd = Math.sqrt(variance);
  return Math.max(0, Math.min(1, 1 - sd / 0.25));
}

// Combine each model's full axis array into one consensus array. Models are
// matched per axis by axisIndex. Consensus confidence blends the models' own
// mean confidence with how much they agreed.
export function consensusScores(perModel: AxisScore[][]): AxisScore[] {
  const models = perModel.filter((m) => m && m.length > 0);
  if (models.length === 0) return [];
  if (models.length === 1) return models[0];

  const axisIndices = models[0].map((s) => s.axisIndex);
  return axisIndices.map((idx) => {
    const picks = models
      .map((m) => m.find((s) => s.axisIndex === idx))
      .filter((s): s is AxisScore => !!s);
    const scores = picks.map((p) => p.score);
    const confs = picks.map((p) => p.confidence ?? 0.5);

    const consensusScore = trimmedMean(scores);
    const agree = agreement(scores);
    const meanConf = confs.reduce((a, b) => a + b, 0) / confs.length;
    const consensusConf = Math.max(0, Math.min(1, 0.5 * meanConf + 0.5 * agree));

    const ref = picks[0];
    return {
      axisIndex: idx,
      axisName: ref.axisName,
      score: consensusScore,
      confidence: consensusConf,
      reasoning: `Consensus of ${picks.length} models · ${(agree * 100).toFixed(0)}% agreement.`,
    };
  });
}
