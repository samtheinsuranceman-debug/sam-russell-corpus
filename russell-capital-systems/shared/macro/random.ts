/**
 * Seeded randomness for the macro Monte Carlo runs.
 *
 * Every simulation on this platform is reproducible: the same inputs and the
 * same seed give the same 10,000 paths. That is what lets a figure printed in
 * a client PDF be regenerated and defended a year later.
 */

/** Mulberry32 — small, fast, good enough for scenario sampling. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal via Box–Muller. */
export function normal(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Triangular draw — the honest distribution for "low / most likely / high" expert ranges. */
export function triangular(rng: () => number, low: number, mode: number, high: number): number {
  if (high <= low) return low;
  const u = rng();
  const c = (mode - low) / (high - low);
  return u < c
    ? low + Math.sqrt(u * (high - low) * (mode - low))
    : high - Math.sqrt((1 - u) * (high - low) * (high - mode));
}

/** Bernoulli. */
export function coin(rng: () => number, p: number): boolean {
  return rng() < p;
}

/** Percentile of a sorted array, linear interpolation. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export type Summary = {
  mean: number;
  p05: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  min: number;
  max: number;
  n: number;
};

export function summarise(values: number[]): Summary {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  const mean = n ? s.reduce((a, b) => a + b, 0) / n : NaN;
  return {
    mean,
    p05: percentile(s, 0.05),
    p10: percentile(s, 0.1),
    p25: percentile(s, 0.25),
    p50: percentile(s, 0.5),
    p75: percentile(s, 0.75),
    p90: percentile(s, 0.9),
    p95: percentile(s, 0.95),
    min: s[0] ?? NaN,
    max: s[n - 1] ?? NaN,
    n,
  };
}

/** The platform standard: ten thousand paths, as the LifeForge simulator runs. */
export const MACRO_SIMULATION_RUNS = 10_000;
export const MACRO_DEFAULT_SEED = 20260922;
