/**
 * Validation toolkit — the honesty guards of the 100-indicator study (04 §7).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A hundred indicators, three states and combinations of up to four give
 * millions of candidate patterns; fewer than 40 bear markets test them. Most
 * patterns that look strong will be chance. This module is the arithmetic
 * that says which survive, and it runs the moment a finding arrives:
 *
 *   benjaminiHochberg   BH step-up FDR control across everything tested
 *                       (Benjamini & Hochberg 1995), padded to the true test
 *                       count so unreported tests cannot be dropped.
 *   stationaryBootstrap Politis & Romano (1994) resampling of a dependent
 *                       monthly series; seeded, so every p-value reproduces.
 *   realityCheck        White (2000): is the best of k rules better than the
 *                       benchmark once the search over k rules is paid for?
 *   spaTest             Hansen (2005) consistent SPA: studentised, and poor
 *                       rules do not dilute the test.
 *   meetsTHurdle        Harvey, Liu & Zhu (2016): t ≥ 3.0.
 *   episodeCount        Episodes, not months: twelve firing months inside
 *                       one bear are one event.
 *   holdoutGate         Rejects a finding whose holdout was evaluated before
 *                       (or at) its PREREGISTRATION.md timestamp.
 *   validateFinding     Hand-written checks against 07_FINDINGS_SCHEMA.json,
 *                       plus the §6 "a finding without all of these is a
 *                       lead" rule.
 *   fillBhQ / headline  A19 fills `bhQ`; the report opens with
 *                       "tested N, survived K".
 *
 * Every threshold (q, t, draws, block length, test size, the SPA log-log
 * factor, the SPA small-sample floor) is a `val.*` row in assumptions.ts
 * with its source and asOf; the default seed is `MACRO_DEFAULT_SEED` from random.ts (Mulberry32). Nothing
 * here calls Math.random.
 *
 * Sign convention for the data-snooping tests: `lossDiffMatrix[t][k]` is
 * loss(benchmark, t) − loss(rule k, t). Positive means rule k did better than
 * the benchmark in period t. H0: no rule has positive expected difference.
 *
 * Pure: no fetch, no database, no `process`, no new dependency.
 *
 * ─── PORT STEPS (to sam-russell-corpus/russell-capital-systems @ master) ───
 *  1. Copy `shared/macro/validation.ts`. It imports only `./assumptions` and
 *     `./random`, both already in `shared/macro/`.
 *  2. Append the seven `VALIDATION_ROWS` (`val.*`) to `shared/macro/assumptions.ts`
 *     after `COMBO_ROWS`, with the `T.push(...VALIDATION_ROWS)` line.
 *  3. Add `export * from "./validation";` to `shared/macro/index.ts`.
 *  4. Copy `server/macroValidation.test.ts` (vitest includes `server/**` only).
 *  5. Proof of done: `pnpm check` 0 errors; `pnpm vitest run
 *     server/macroValidation.test.ts` green, offline, in a few seconds.
 *  No tables, routes, env vars or client files are touched.
 */
import { A } from "./assumptions";
import { MACRO_DEFAULT_SEED, mulberry32 } from "./random";

// ─── Benjamini–Hochberg ──────────────────────────────────────────────────────

export type BhResult = {
  /** Level used. */
  q: number;
  /** Number of hypotheses the correction was run over (≥ pValues.length). */
  m: number;
  /** BH-adjusted p-values ("q-values"), in the input order, capped at 1. */
  qValues: number[];
  /** Rejected (discovery) flags, in the input order. */
  rejected: boolean[];
  /** Number of discoveries. */
  discoveries: number;
  /** Largest p-value rejected, or null when none. */
  pCutoff: number | null;
};

/**
 * Benjamini–Hochberg (1995) step-up. Sort p ascending; find the largest k with
 * p(k) ≤ (k / m)·q; reject the k smallest. Adjusted value
 * q(i) = min over j ≥ i of m·p(j)/j, capped at 1.
 *
 * `opts.m` is the total number of tests actually run. When an agent reports
 * p-values for 50 patterns out of 200,000 tested, pass m = 200,000: the
 * unreported tests are treated as p = 1 (the most favourable assumption for
 * them that is still honest about the count), which shrinks every threshold.
 */
export function benjaminiHochberg(pValues: number[], q: number = A("val.fdr.q"), opts: { m?: number } = {}): BhResult {
  if (!(q > 0 && q < 1)) throw new Error(`benjaminiHochberg: q must be in (0,1), got ${q}`);
  for (const p of pValues) {
    if (typeof p !== "number" || Number.isNaN(p) || p < 0 || p > 1) throw new Error(`benjaminiHochberg: p-value out of [0,1]: ${p}`);
  }
  const n = pValues.length;
  const m = Math.max(n, Math.floor(opts.m ?? n));
  const order = pValues.map((p, i) => i).sort((a, b) => pValues[a] - pValues[b] || a - b);
  let k = 0;
  for (let r = 1; r <= n; r++) if (pValues[order[r - 1]] <= (r / m) * q) k = r;
  const qValues = new Array<number>(n);
  let running = 1;
  for (let r = n; r >= 1; r--) {
    const i = order[r - 1];
    running = Math.min(running, (m * pValues[i]) / r);
    qValues[i] = Math.min(1, running);
  }
  const rejected = new Array<boolean>(n).fill(false);
  for (let r = 1; r <= k; r++) rejected[order[r - 1]] = true;
  return { q, m, qValues, rejected, discoveries: k, pCutoff: k > 0 ? pValues[order[k - 1]] : null };
}

// ─── Stationary bootstrap (Politis & Romano 1994) ────────────────────────────

/**
 * One stationary-bootstrap index path of length n: start uniformly; each next
 * index continues the block (i + 1, wrapping) with probability 1 − 1/meanBlock,
 * or jumps to a fresh uniform start with probability 1/meanBlock.
 */
export function stationaryBootstrapIndices(n: number, meanBlock: number, rng: () => number): Int32Array {
  if (!(n > 0)) throw new Error("stationaryBootstrapIndices: n must be positive");
  if (!(meanBlock >= 1)) throw new Error("stationaryBootstrapIndices: meanBlock must be ≥ 1");
  const p = 1 / meanBlock;
  const idx = new Int32Array(n);
  idx[0] = Math.floor(rng() * n);
  for (let t = 1; t < n; t++) idx[t] = rng() < p ? Math.floor(rng() * n) : (idx[t - 1] + 1) % n;
  return idx;
}

/** `draws` resampled copies of `series`, deterministic under `seed`. */
export function stationaryBootstrap(
  series: number[],
  meanBlock: number = A("val.bootstrap.meanBlockMonths"),
  draws: number = A("val.bootstrap.draws"),
  seed: number = MACRO_DEFAULT_SEED,
): number[][] {
  const rng = mulberry32(seed);
  const n = series.length;
  const out: number[][] = [];
  for (let b = 0; b < draws; b++) {
    const idx = stationaryBootstrapIndices(n, meanBlock, rng);
    const s = new Array<number>(n);
    for (let t = 0; t < n; t++) s[t] = series[idx[t]];
    out.push(s);
  }
  return out;
}

// ─── Data-snooping tests: White's Reality Check and Hansen's SPA ─────────────

export type SnoopingOptions = { meanBlock?: number; alpha?: number };

export type RealityCheckResult = {
  test: "white-reality-check";
  n: number;
  rules: number;
  draws: number;
  seed: number;
  meanBlock: number;
  /** V = max_k √n · d̄_k. */
  statistic: number;
  pValue: number;
  alpha: number;
  reject: boolean;
  /** Column index of the best rule (largest d̄_k). */
  bestRule: number;
  bestMean: number;
  /** Naive t of the best rule, √n·d̄/ω (bootstrap ω): what a single-test reading would claim. */
  bestTStat: number;
  /** HLZ hurdle on that naive t; necessary, never sufficient. */
  passesTHurdle: boolean;
};

export type SpaResult = {
  test: "hansen-spa";
  n: number;
  rules: number;
  draws: number;
  seed: number;
  meanBlock: number;
  /** T = max(0, max_k √n·d̄_k/ω_k). */
  statistic: number;
  /**
   * Hansen's three p-values — liberal (g_l), consistent (g_c, the one used),
   * conservative (g_u) — plus White's unstudentised Reality Check p-value from
   * the same draws.
   */
  pValues: { lower: number; consistent: number; upper: number; realityCheck: number };
  pValue: number;
  alpha: number;
  /** n / meanBlock below `val.spa.minBlocks`: the studentisation is too noisy to trust alone. */
  smallSample: boolean;
  /** consistent p < α, and, in a small sample, the Reality Check p < α as well. */
  reject: boolean;
  warnings: string[];
  bestRule: number;
  bestTStat: number;
  passesTHurdle: boolean;
};

type Columns = { n: number; k: number; cols: Float64Array[]; means: Float64Array };

function toColumns(m: number[][]): Columns {
  const n = m.length;
  if (n < 2) throw new Error("lossDiffMatrix needs at least 2 periods");
  const k = m[0].length;
  if (k < 1) throw new Error("lossDiffMatrix needs at least 1 rule");
  const cols = Array.from({ length: k }, () => new Float64Array(n));
  for (let t = 0; t < n; t++) {
    if (m[t].length !== k) throw new Error(`lossDiffMatrix row ${t} has ${m[t].length} columns, expected ${k}`);
    for (let j = 0; j < k; j++) {
      const v = m[t][j];
      if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`lossDiffMatrix[${t}][${j}] is not a finite number`);
      cols[j][t] = v;
    }
  }
  const means = new Float64Array(k);
  for (let j = 0; j < k; j++) {
    let s = 0;
    for (let t = 0; t < n; t++) s += cols[j][t];
    means[j] = s / n;
  }
  return { n, k, cols, means };
}

/**
 * Bootstrap √n·(d̄*_{b,k} − d̄_k) for every draw and rule. The same index path
 * is used for every rule in a draw, so cross-rule correlation is preserved.
 */
function bootstrapDeviations(c: Columns, meanBlock: number, draws: number, seed: number): Float64Array {
  const rng = mulberry32(seed);
  const out = new Float64Array(draws * c.k);
  const sq = Math.sqrt(c.n);
  for (let b = 0; b < draws; b++) {
    const idx = stationaryBootstrapIndices(c.n, meanBlock, rng);
    for (let j = 0; j < c.k; j++) {
      const col = c.cols[j];
      let s = 0;
      for (let t = 0; t < c.n; t++) s += col[idx[t]];
      out[b * c.k + j] = sq * (s / c.n - c.means[j]);
    }
  }
  return out;
}

function omegas(dev: Float64Array, draws: number, k: number): Float64Array {
  const w = new Float64Array(k);
  for (let j = 0; j < k; j++) {
    let s = 0;
    for (let b = 0; b < draws; b++) s += dev[b * k + j] ** 2;
    w[j] = Math.max(Math.sqrt(s / draws), 1e-12);
  }
  return w;
}

function argmax(xs: ArrayLike<number>): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[best]) best = i;
  return best;
}

/**
 * White (2000) Reality Check. V = max_k √n·d̄_k; the bootstrap distribution
 * V*_b = max_k √n·(d̄*_{b,k} − d̄_k) is the null at the least favourable
 * configuration (every rule exactly as good as the benchmark). p = share of
 * V*_b ≥ V.
 */
export function realityCheck(
  lossDiffMatrix: number[][],
  draws: number = A("val.bootstrap.draws"),
  seed: number = MACRO_DEFAULT_SEED,
  opts: SnoopingOptions = {},
): RealityCheckResult {
  const meanBlock = opts.meanBlock ?? A("val.bootstrap.meanBlockMonths");
  const alpha = opts.alpha ?? A("val.rc.alpha");
  const c = toColumns(lossDiffMatrix);
  const sq = Math.sqrt(c.n);
  const best = argmax(c.means);
  const V = sq * c.means[best];
  const dev = bootstrapDeviations(c, meanBlock, draws, seed);
  let exceed = 0;
  for (let b = 0; b < draws; b++) {
    let mx = -Infinity;
    for (let j = 0; j < c.k; j++) mx = Math.max(mx, dev[b * c.k + j]);
    if (mx >= V) exceed++;
  }
  const w = omegas(dev, draws, c.k);
  const pValue = exceed / draws;
  const bestTStat = (sq * c.means[best]) / w[best];
  return {
    test: "white-reality-check", n: c.n, rules: c.k, draws, seed, meanBlock,
    statistic: V, pValue, alpha, reject: pValue < alpha,
    bestRule: best, bestMean: c.means[best], bestTStat, passesTHurdle: meetsTHurdle(bestTStat),
  };
}

/**
 * Hansen (2005) test for Superior Predictive Ability, consistent version.
 * Studentised: T = max(0, max_k √n·d̄_k/ω_k), ω_k from the same bootstrap.
 * Null re-centring g_c(d̄_k) = d̄_k·1{√n·d̄_k/ω_k ≥ −√(2·log log n)}: a clearly
 * inferior rule keeps its negative mean in the bootstrap, so adding junk rules
 * to the search does not wash out a real edge the way it does in the RC.
 *
 * Small-sample guard (`val.spa.minBlocks`): with fewer than 20 mean blocks of
 * data the bootstrap s.d. of each rule is noisy, the max picks rules whose
 * s.d. came out low, and the SPA over-rejects on pure noise (measured 12/40 at
 * n = 120, block 12). There the SPA rejects only if White's unstudentised
 * Reality Check, computed from the same draws, rejects too.
 */
export function spaTest(
  lossDiffMatrix: number[][],
  draws: number = A("val.bootstrap.draws"),
  seed: number = MACRO_DEFAULT_SEED,
  opts: SnoopingOptions = {},
): SpaResult {
  const meanBlock = opts.meanBlock ?? A("val.bootstrap.meanBlockMonths");
  const alpha = opts.alpha ?? A("val.rc.alpha");
  const c = toColumns(lossDiffMatrix);
  const sq = Math.sqrt(c.n);
  const dev = bootstrapDeviations(c, meanBlock, draws, seed);
  const w = omegas(dev, draws, c.k);
  const tk = new Float64Array(c.k);
  for (let j = 0; j < c.k; j++) tk[j] = (sq * c.means[j]) / w[j];
  const best = argmax(tk);
  const T = Math.max(0, tk[best]);
  const lnln = Math.log(Math.log(c.n));
  const cut = -Math.sqrt(A("val.spa.loglogFactor") * Math.max(lnln, 0));
  // Shift added to each bootstrap deviation, in studentised units: (d̄ − g(d̄))·√n/ω.
  const shiftL = new Float64Array(c.k), shiftC = new Float64Array(c.k);
  for (let j = 0; j < c.k; j++) {
    shiftL[j] = Math.min(tk[j], 0); // g_l = max(d̄,0) → d̄ − g_l = min(d̄,0)
    shiftC[j] = tk[j] >= cut ? 0 : tk[j]; // g_c
    // g_u = d̄ → shift 0
  }
  const V = sq * c.means[argmax(c.means)];
  let eL = 0, eC = 0, eU = 0, eRC = 0;
  for (let b = 0; b < draws; b++) {
    let mL = 0, mC = 0, mU = 0, mRC = -Infinity;
    for (let j = 0; j < c.k; j++) {
      const d = dev[b * c.k + j];
      const z = d / w[j];
      mL = Math.max(mL, z + shiftL[j]);
      mC = Math.max(mC, z + shiftC[j]);
      mU = Math.max(mU, z);
      mRC = Math.max(mRC, d);
    }
    if (mL >= T) eL++;
    if (mC >= T) eC++;
    if (mU >= T) eU++;
    if (mRC >= V) eRC++;
  }
  const pValues = { lower: eL / draws, consistent: eC / draws, upper: eU / draws, realityCheck: eRC / draws };
  const smallSample = c.n / meanBlock < A("val.spa.minBlocks");
  const warnings: string[] = [];
  if (smallSample) warnings.push(`only ${(c.n / meanBlock).toFixed(1)} mean blocks (< ${A("val.spa.minBlocks")}): studentisation is noisy, so the SPA rejects only if the Reality Check also rejects`);
  const reject = pValues.consistent < alpha && (!smallSample || pValues.realityCheck < alpha);
  return {
    test: "hansen-spa", n: c.n, rules: c.k, draws, seed, meanBlock,
    statistic: T, pValues, pValue: pValues.consistent, alpha, smallSample, reject, warnings,
    bestRule: best, bestTStat: tk[best], passesTHurdle: meetsTHurdle(tk[best]),
  };
}

/** Harvey, Liu & Zhu (2016): |t| ≥ 3.0 (rules row `val.tStatMin`). */
export function meetsTHurdle(t: number): boolean {
  return Number.isFinite(t) && Math.abs(t) >= A("val.tStatMin");
}

// ─── Episodes, not months ───────────────────────────────────────────────────

export type Episode = { id: string; start: string; end: string };

export type EpisodeCountResult = {
  /** Distinct episodes credited — the effective sample size. */
  episodes: number;
  episodeIds: string[];
  /** Distinct firing months supplied (duplicates removed). */
  firingMonths: number;
  /** Firing months credited to no episode (false alarms, in months). */
  monthsOutside: string[];
  /** Months credited to each episode. */
  byEpisode: Record<string, string[]>;
};

/** "YYYY-MM" or "YYYY-MM-DD…" → months since year 0. */
export function monthIndex(s: string): number {
  const m = /^(\d{4})-(\d{2})/.exec(s);
  if (!m) throw new Error(`monthIndex: not a YYYY-MM date: ${s}`);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) throw new Error(`monthIndex: bad month in ${s}`);
  return Number(m[1]) * 12 + (mo - 1);
}

const monthLabel = (i: number) => `${String(Math.floor(i / 12)).padStart(4, "0")}-${String((i % 12) + 1).padStart(2, "0")}`;

/**
 * Count the distinct target episodes a pattern's firing months touch. Each
 * episode's window is [start − leadMonths, end] (leadMonths = the pattern's
 * horizon when counting "preceded"). Each firing month is credited to at most
 * one episode — the earliest-starting episode whose start is at or after the
 * month (the one it precedes), otherwise the latest-starting one whose window
 * contains it — so one month can never count twice, and any number of months
 * inside one episode count once.
 */
export function episodeCount(firingMonths: string[], episodes: Episode[], opts: { leadMonths?: number } = {}): EpisodeCountResult {
  const lead = Math.max(0, Math.floor(opts.leadMonths ?? 0));
  const eps = episodes
    .map(e => ({ id: e.id, s: monthIndex(e.start), e: monthIndex(e.end) }))
    .sort((a, b) => a.s - b.s);
  for (const e of eps) if (e.e < e.s) throw new Error(`episodeCount: episode ${e.id} ends before it starts`);
  const months = Array.from(new Set(firingMonths.map(monthIndex))).sort((a, b) => a - b);
  const byEpisode: Record<string, string[]> = {};
  const outside: string[] = [];
  for (const m of months) {
    const containing = eps.filter(e => m >= e.s - lead && m <= e.e);
    if (containing.length === 0) { outside.push(monthLabel(m)); continue; }
    const ahead = containing.filter(e => e.s >= m);
    const pick = ahead.length ? ahead[0] : containing[containing.length - 1];
    (byEpisode[pick.id] ??= []).push(monthLabel(m));
  }
  const episodeIds = eps.map(e => e.id).filter(id => byEpisode[id]);
  return { episodes: episodeIds.length, episodeIds, firingMonths: months.length, monthsOutside: outside, byEpisode };
}

// ─── Findings: schema (07_FINDINGS_SCHEMA.json) ─────────────────────────────

export const FINDING_KINDS = ["combination", "cluster", "sequence", "keystone", "lead-lag", "break", "hypothesis", "factor"] as const;
export const FINDING_TARGETS = ["bear-start", "bull-start", "nber-recession", "treasury-hypothesis", "other"] as const;
export const FINDING_STATUSES = ["lead", "finding", "rejected"] as const;
export const RED_TEAM_VERDICTS = ["survives", "weakened", "broken", "not-yet"] as const;
export const ERA_IDS = ["E1", "E2", "E3", "E4", "E5"] as const;
/** Standing order: American AI model families only. */
export const ALLOWED_MODEL_FAMILIES = ["anthropic", "openai", "google", "xai", "meta"] as const;

export type FindingKind = (typeof FINDING_KINDS)[number];
export type FindingTarget = (typeof FINDING_TARGETS)[number];
export type FindingStatus = (typeof FINDING_STATUSES)[number];
export type RedTeamVerdict = (typeof RED_TEAM_VERDICTS)[number];
export type EraId = (typeof ERA_IDS)[number];

export type Finding = {
  id: string;
  agent: string;
  model?: string;
  kind: FindingKind;
  members: string[];
  target: FindingTarget;
  horizonMonths: number;
  preRegisteredAt: string;
  episodes: number;
  eraSupport: Partial<Record<EraId, unknown>>;
  effect: { lift?: number; lo?: number; hi?: number; cascadeMultiplier?: number; kendallW?: number };
  tested: number;
  pValue?: number;
  bhQ?: number;
  holdoutPassed?: boolean;
  breakYear?: number | null;
  reproducedBy?: string | null;
  redTeam?: RedTeamVerdict;
  status: FindingStatus;
  reasoning?: string;
  sources?: string[];
  /** Extension (not in the schema): when the holdout was first evaluated, if the agent records it on the row. */
  holdoutEvaluatedAt?: string;
};

export type FindingValidation = {
  /** Passes every schema check. */
  valid: boolean;
  /** Schema violations. */
  errors: string[];
  /** Section 6/7 gaps: things a "finding" needs that a schema-valid row may lack. */
  warnings: string[];
  /** What the status should be after the §6 rule: missing elements → lead; failed guard → rejected. */
  recommendedStatus: FindingStatus | null;
};

const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
export const isDateTime = (s: unknown): s is string => typeof s === "string" && RFC3339.test(s) && !Number.isNaN(Date.parse(s));
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const isInt = (x: unknown): x is number => isNum(x) && Number.isInteger(x);

/**
 * Hand-written checks mirroring 07_FINDINGS_SCHEMA.json (required fields,
 * types, enums, integer and date-time formats), plus the standing order on
 * model families, plus §6: a row marked "finding" that lacks any required
 * element is a lead, and one that failed a guard is rejected.
 */
export function validateFinding(finding: unknown, q: number = A("val.fdr.q")): FindingValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isObj(finding)) return { valid: false, errors: ["finding is not an object"], warnings, recommendedStatus: null };
  const f = finding;
  const required = ["id", "agent", "kind", "members", "target", "horizonMonths", "preRegisteredAt", "episodes", "eraSupport", "effect", "tested", "status"];
  for (const r of required) if (!(r in f) || f[r] === undefined) errors.push(`missing required field: ${r}`);

  const str = (k: string) => { if (k in f && f[k] !== undefined && typeof f[k] !== "string") errors.push(`${k} must be a string`); };
  const int = (k: string) => { if (k in f && f[k] !== undefined && !isInt(f[k])) errors.push(`${k} must be an integer`); };
  const num = (k: string) => { if (k in f && f[k] !== undefined && !isNum(f[k])) errors.push(`${k} must be a number`); };
  const oneOf = (k: string, vals: readonly string[]) => { if (k in f && f[k] !== undefined && !vals.includes(f[k] as string)) errors.push(`${k} must be one of ${vals.join(", ")}; got ${JSON.stringify(f[k])}`); };

  str("id"); str("agent"); str("model"); str("reasoning");
  if (typeof f.id === "string" && f.id.trim() === "") errors.push("id must be non-empty");
  if (typeof f.agent === "string" && !/^A\d{2}$/.test(f.agent)) warnings.push(`agent "${f.agent}" is not of the form A11 … A18`);
  if (typeof f.model === "string" && !(ALLOWED_MODEL_FAMILIES as readonly string[]).includes(f.model.toLowerCase())) errors.push(`model "${f.model}" is not an allowed American model family (${ALLOWED_MODEL_FAMILIES.join(", ")})`);
  oneOf("kind", FINDING_KINDS);
  oneOf("target", FINDING_TARGETS);
  oneOf("status", FINDING_STATUSES);
  oneOf("redTeam", RED_TEAM_VERDICTS);
  if ("members" in f && f.members !== undefined && !(Array.isArray(f.members) && f.members.every(m => typeof m === "string"))) errors.push("members must be an array of strings");
  if ("sources" in f && f.sources !== undefined && !(Array.isArray(f.sources) && f.sources.every(m => typeof m === "string"))) errors.push("sources must be an array of strings");
  int("horizonMonths"); int("episodes"); int("tested");
  if (isInt(f.horizonMonths) && f.horizonMonths <= 0) errors.push("horizonMonths must be positive");
  if (isInt(f.episodes) && f.episodes < 0) errors.push("episodes must be ≥ 0");
  if (isInt(f.tested) && f.tested < 1) errors.push("tested must be ≥ 1");
  if ("preRegisteredAt" in f && f.preRegisteredAt !== undefined && !isDateTime(f.preRegisteredAt)) errors.push("preRegisteredAt must be an RFC 3339 date-time");
  if ("holdoutEvaluatedAt" in f && f.holdoutEvaluatedAt !== undefined && !isDateTime(f.holdoutEvaluatedAt)) errors.push("holdoutEvaluatedAt must be an RFC 3339 date-time");
  num("pValue"); num("bhQ");
  for (const k of ["pValue", "bhQ"]) if (isNum(f[k]) && ((f[k] as number) < 0 || (f[k] as number) > 1)) errors.push(`${k} must be in [0,1]`);
  if ("holdoutPassed" in f && f.holdoutPassed !== undefined && typeof f.holdoutPassed !== "boolean") errors.push("holdoutPassed must be a boolean");
  if ("breakYear" in f && f.breakYear !== undefined && f.breakYear !== null && !isInt(f.breakYear)) errors.push("breakYear must be an integer or null");
  if ("reproducedBy" in f && f.reproducedBy !== undefined && f.reproducedBy !== null && typeof f.reproducedBy !== "string") errors.push("reproducedBy must be a string or null");
  if ("eraSupport" in f && f.eraSupport !== undefined) {
    if (!isObj(f.eraSupport)) errors.push("eraSupport must be an object");
    else for (const k of Object.keys(f.eraSupport)) if (!(ERA_IDS as readonly string[]).includes(k)) warnings.push(`eraSupport has unknown era key ${k}`);
  }
  if ("effect" in f && f.effect !== undefined) {
    if (!isObj(f.effect)) errors.push("effect must be an object");
    else {
      for (const k of ["lift", "lo", "hi", "cascadeMultiplier", "kendallW"]) if (k in f.effect && f.effect[k] !== undefined && !isNum(f.effect[k])) errors.push(`effect.${k} must be a number`);
      const { lift, lo, hi } = f.effect as Finding["effect"];
      if (isNum(lo) && isNum(hi) && lo > hi) errors.push("effect.lo must be ≤ effect.hi");
      if (isNum(lift) && isNum(lo) && isNum(hi) && (lift < lo || lift > hi)) warnings.push("effect.lift lies outside [lo, hi]");
    }
  }

  let recommendedStatus: FindingStatus | null = (FINDING_STATUSES as readonly string[]).includes(f.status as string) ? (f.status as FindingStatus) : null;
  if (f.status === "finding") {
    const eff = isObj(f.effect) ? f.effect : {};
    const failed: string[] = [];
    if (isNum(f.bhQ) && f.bhQ > q) failed.push(`bhQ ${f.bhQ} > ${q}`);
    if (f.holdoutPassed === false) failed.push("holdout failed");
    if (f.redTeam === "broken") failed.push("red team broke it");
    const missing: string[] = [];
    if (!isNum(eff.lift) && !isNum(eff.cascadeMultiplier) && !isNum(eff.kendallW)) missing.push("effect size");
    if (!isNum(eff.lo) || !isNum(eff.hi)) missing.push("effect interval (lo, hi)");
    if (!isInt(f.episodes) || f.episodes < 1) missing.push("episodes ≥ 1");
    if (!isObj(f.eraSupport) || Object.keys(f.eraSupport).length === 0) missing.push("era support");
    if (f.holdoutPassed !== true && f.holdoutPassed !== false) missing.push("holdout result");
    if (!isNum(f.bhQ)) missing.push("bhQ");
    if (typeof f.reproducedBy !== "string" || f.reproducedBy.trim() === "") missing.push("reproducedBy");
    if (failed.length) { warnings.push(`marked finding but failed a guard: ${failed.join("; ")}`); recommendedStatus = "rejected"; }
    else if (missing.length) { warnings.push(`marked finding but missing §6 elements (a lead until supplied): ${missing.join(", ")}`); recommendedStatus = "lead"; }
  }
  return { valid: errors.length === 0, errors, warnings, recommendedStatus };
}

// ─── Holdout gate ───────────────────────────────────────────────────────────

export type PreregistrationEntry = {
  /** A finding id, or a family prefix when scope is "family" (e.g. "A11-combo" covers "A11-combo-0007"). */
  id: string;
  registeredAt: string;
  scope?: "finding" | "family";
  line?: string;
};

export type HoldoutEvaluation = { id: string; era?: EraId; evaluatedAt: string };

export type PreregistrationLog = {
  /** In file order; PREREGISTRATION.md is append-only, so timestamps must not decrease. */
  entries: PreregistrationEntry[];
  /** Every time a holdout era was touched for a finding or family. */
  holdoutEvaluations?: HoldoutEvaluation[];
};

export type HoldoutGateResult = {
  passed: boolean;
  reasons: string[];
  registeredAt: string | null;
  earliestHoldoutAt: string | null;
};

const covers = (e: { id: string; scope?: string }, findingId: string) =>
  e.id === findingId || (e.scope === "family" && findingId.startsWith(e.id + "-"));

/**
 * Pass only if: the log is append-only (non-decreasing timestamps); the
 * finding (or its family) is registered in it; the finding's own
 * `preRegisteredAt` is not earlier than the log's (a back-dated claim fails);
 * a holdout evaluation is on record whenever `holdoutPassed` is claimed; and
 * every holdout evaluation for it happened strictly after registration. An
 * evaluation at the same instant fails: the order cannot be proven.
 */
export function holdoutGate(finding: Pick<Finding, "id" | "preRegisteredAt"> & Partial<Finding>, log: PreregistrationLog, opts: { requireEras?: EraId[] } = {}): HoldoutGateResult {
  const reasons: string[] = [];
  let prev = -Infinity;
  for (const e of log.entries) {
    if (!isDateTime(e.registeredAt)) { reasons.push(`log entry ${e.id} has an invalid timestamp`); continue; }
    const t = Date.parse(e.registeredAt);
    if (t < prev) reasons.push(`log is not append-only: ${e.id} (${e.registeredAt}) is earlier than the entry above it`);
    prev = Math.max(prev, t);
  }
  const regs = log.entries.filter(e => covers(e, finding.id) && isDateTime(e.registeredAt));
  const reg = regs.length ? regs.reduce((a, b) => (Date.parse(a.registeredAt) <= Date.parse(b.registeredAt) ? a : b)) : null;
  const registeredAt = reg ? reg.registeredAt : null;
  if (!reg) reasons.push(`${finding.id} is not in the pre-registration log`);
  if (!isDateTime(finding.preRegisteredAt)) reasons.push("finding.preRegisteredAt is not a valid date-time");
  else if (reg && Date.parse(finding.preRegisteredAt) < Date.parse(reg.registeredAt)) reasons.push(`finding claims pre-registration at ${finding.preRegisteredAt}, before its log line (${reg.registeredAt})`);

  const evals: HoldoutEvaluation[] = (log.holdoutEvaluations ?? []).filter(e => covers({ id: e.id, scope: e.id === finding.id ? "finding" : "family" }, finding.id));
  if (finding.holdoutEvaluatedAt) evals.push({ id: finding.id, evaluatedAt: finding.holdoutEvaluatedAt });
  let earliest: number | null = null;
  for (const ev of evals) {
    if (!isDateTime(ev.evaluatedAt)) { reasons.push(`holdout evaluation${ev.era ? ` (${ev.era})` : ""} has an invalid timestamp`); continue; }
    const t = Date.parse(ev.evaluatedAt);
    earliest = earliest === null ? t : Math.min(earliest, t);
    if (reg && t <= Date.parse(reg.registeredAt)) reasons.push(`holdout${ev.era ? ` ${ev.era}` : ""} evaluated at ${ev.evaluatedAt}, not after pre-registration at ${reg.registeredAt}: holdout spoiled`);
  }
  if (finding.holdoutPassed === true && evals.length === 0) reasons.push("holdoutPassed is claimed but no holdout evaluation is on record");
  for (const era of opts.requireEras ?? []) if (!evals.some(e => e.era === era)) reasons.push(`no evaluation recorded for holdout era ${era}`);
  return { passed: reasons.length === 0, reasons, registeredAt, earliestHoldoutAt: earliest === null ? null : new Date(earliest).toISOString() };
}

// ─── A19 fills bhQ; the headline ────────────────────────────────────────────

/** Family key used to avoid double-counting `tested`: agent | kind | target | horizon. */
export const familyKey = (f: Pick<Finding, "agent" | "kind" | "target" | "horizonMonths">) => `${f.agent}|${f.kind}|${f.target}|${f.horizonMonths}`;

/**
 * Total patterns tested: per family, the larger of its reported `tested` and
 * the rows it submitted, summed over families.
 */
export function totalTested(findings: Finding[]): { total: number; families: number } {
  const fam = new Map<string, { tested: number; rows: number }>();
  for (const f of findings) {
    const k = familyKey(f);
    const cur = fam.get(k) ?? { tested: 0, rows: 0 };
    cur.tested = Math.max(cur.tested, isInt(f.tested) ? f.tested : 0);
    cur.rows += 1;
    fam.set(k, cur);
  }
  let total = 0;
  for (const v of Array.from(fam.values())) total += Math.max(v.tested, v.rows);
  return { total, families: fam.size };
}

/**
 * Run BH across every finding with a p-value, padded to the total tested
 * count, and return copies with `bhQ` filled. Rows without a p-value keep
 * `bhQ` undefined (they cannot be discoveries).
 */
export function fillBhQ(findings: Finding[], q: number = A("val.fdr.q")): { findings: Finding[]; bh: BhResult } {
  const withP = findings.map((f, i) => ({ f, i })).filter(x => isNum(x.f.pValue));
  const { total } = totalTested(findings);
  const bh = benjaminiHochberg(withP.map(x => x.f.pValue as number), q, { m: total });
  const out = findings.map(f => ({ ...f }));
  withP.forEach((x, j) => { out[x.i].bhQ = bh.qValues[j]; });
  return { findings: out, bh };
}

const commas = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export type Headline = { tested: number; survived: number; rows: number; families: number; survivors: string[]; text: string };

/**
 * "tested N, survived K". N counts every pattern tested (see totalTested); K
 * counts rows marked "finding" that are schema-valid and keep that status
 * under the §6 rule (bhQ ≤ q, holdout passed, reproduced, interval, eras).
 */
export function headline(findings: Finding[], q: number = A("val.fdr.q")): Headline {
  const { total, families } = totalTested(findings);
  const survivors = findings
    .filter(f => f.status === "finding")
    .filter(f => { const v = validateFinding(f, q); return v.valid && v.recommendedStatus === "finding"; })
    .map(f => f.id);
  return { tested: total, survived: survivors.length, rows: findings.length, families, survivors, text: `tested ${commas(total)}, survived ${survivors.length}` };
}
