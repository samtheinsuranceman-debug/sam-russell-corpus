// ============================================================
// Effective Performance Potential — the Liebig-weighted capability number
// ============================================================
// A plain average of your 32 lines flatters you: it lets strong lines hide a
// crippling weak one. This metric does the opposite — it weights the BOTTLENECK
// (your weakest lines) far more heavily than the mean, because that is how real
// systems behave (Liebig's Law of the Minimum, Kremer's O-Ring, Theory of
// Constraints). It answers: "after your weakest links are accounted for, how much
// of your capability actually shows up in outcomes?"
//
// It is NOT the rarity score (that's statistical uncommonness). This is realized
// capability — and the gap between it and your average is the cost of your
// bottleneck, i.e. exactly what the outcome-engineering plan tells you to fix.

export type EffectivePotential = {
  effective: number;  // 0..1 — realized capability after the bottleneck
  mean: number;       // 0..1 — the flattering average
  bottleneck: number; // 0..1 — mean of the weakest K lines
  drag: number;       // mean - effective, the cost of the weakest links (>= 0)
};

// alpha = how much the bottleneck dominates (0.55 → the weakest lines carry a bit
// more than half the weight). bottleneckK = how many of the weakest lines define
// the bottleneck (default 3, so it isn't hostage to a single noisy score).
export function effectivePotential(
  scores: number[],
  opts: { bottleneckK?: number; alpha?: number } = {},
): EffectivePotential {
  const vals = scores.filter((s) => s > 0);
  if (vals.length === 0) return { effective: 0, mean: 0, bottleneck: 0, drag: 0 };

  const sorted = [...vals].sort((a, b) => a - b);
  const k = Math.max(1, Math.min(opts.bottleneckK ?? 3, sorted.length));
  const bottleneck = sorted.slice(0, k).reduce((a, b) => a + b, 0) / k;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;

  const alpha = opts.alpha ?? 0.55;
  const effective = alpha * bottleneck + (1 - alpha) * mean;
  return {
    effective,
    mean,
    bottleneck,
    drag: Math.max(0, mean - effective),
  };
}
