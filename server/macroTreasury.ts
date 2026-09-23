/**
 * Macro Treasury — the daily watch on the pool, the archaeology over the
 * stored history, the prediction grid, and the global flow calculus.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Reads only. The series themselves are pulled and stored by
 * `runHistoryRefresh` (the manifest now carries the fifty pool series and the
 * twenty-five countries' series). This module:
 *
 *   1. builds the dry-up reading from the stored series and scores it;
 *   2. runs the pattern detector, the domino-chain scan, the loudest-mover
 *      scan and the regime splits over the pool's monthly matrix;
 *   3. turns measured lead-lag findings and current z-scores into the grid;
 *   4. builds each country's ten readings and runs the flow calculus.
 *
 * With no stored history every section says so and returns pending state;
 * nothing is invented from the seed or from memory.
 *
 * PORT TO THE TRUNK: copies unchanged with `macroHistory.ts`.
 */
import {
  TREASURY_POOL_SERIES,
  TREASURY_HYPOTHESES,
  TREASURY_EPISODES,
  poolIndicatorId,
  liquidityDryUp,
  predictionGrid,
  GRID_TARGETS,
  COUNTRIES,
  COUNTRY_SANCTIONS_EXPOSURE,
  globalFlowCalculus,
  FLOW_INDICATORS,
  COUNTRY_FLOW_EPISODES,
  detectPatterns,
  dominoChains,
  loudestBeforeTurns,
  regimeSplit,
  latestZScores,
  mineCombinations,
  monthEndPoints,
  yoyPct,
  type DryUpReading,
  type FlowReading,
  type TreasuryPoolSeries,
  type Series,
  type MonthlyPoint,
  type PatternReport,
  type ComboReport,
} from "@shared/macro";
import { loadSeries, loadSeriesMeta, historyManifest } from "./macroHistory";

type Db = NonNullable<Awaited<ReturnType<typeof import("./db").getDb>>>;

/**
 * The stored indicator id for a pool series, resolved by connector key against
 * the history manifest (a factor may already store the same key under its own
 * id, e.g. FDHBFIN under `f-foreign-share-debt:base`); the pool's own id is
 * the fallback for a key the manifest does not carry.
 */
let storedIdByKey: Map<string, string> | null = null;
export function poolStorageId(s: TreasuryPoolSeries): string {
  if (!storedIdByKey) storedIdByKey = new Map(historyManifest().map(r => [r.series, r.indicatorId]));
  return storedIdByKey.get(s.series) ?? poolIndicatorId(s);
}

const last = (p: MonthlyPoint[]) => (p.length ? p[p.length - 1] : null);
function changeOver(points: MonthlyPoint[], months: number): number | null {
  const m = monthEndPoints(points);
  if (m.length <= months) return null;
  const a = m[m.length - 1 - months].value;
  const b = m[m.length - 1].value;
  return Number.isFinite(a) && Number.isFinite(b) ? b - a : null;
}
function pctChangeOver(points: MonthlyPoint[], months: number): number | null {
  const m = monthEndPoints(points);
  if (m.length <= months) return null;
  const a = m[m.length - 1 - months].value;
  const b = m[m.length - 1].value;
  return a ? Math.round(((b - a) / Math.abs(a)) * 10_000) / 100 : null;
}

/** Every pool series as stored, keyed by pool id. */
export async function loadPoolSeries(db: Db): Promise<Map<string, MonthlyPoint[]>> {
  const out = new Map<string, MonthlyPoint[]>();
  for (const s of TREASURY_POOL_SERIES) {
    const pts = await loadSeries(db, poolStorageId(s));
    // A pool row that names a `:base` factor id reads the factor's transform (year-on-year), as the factor does.
    out.set(s.id, poolIndicatorId(s).endsWith(":base") ? yoyPct(pts) : pts);
  }
  return out;
}

export async function dryUpFromStore(db: Db, today: string) {
  const pool = await loadPoolSeries(db);
  const g = (id: string) => pool.get(id) ?? [];
  const tic = g("tp-tic-total").length ? g("tp-tic-total") : g("tp-foreign-total");
  const auctions = await loadSeries(db, "tp-auctions-btc");
  const btcLast = last(auctions);
  const btcMean12 = auctions.slice(-12).reduce((s, p) => s + p.value, 0) / Math.max(1, Math.min(12, auctions.length));
  const deficit = g("tp-deficit-monthly");
  const rolling12 = (pts: MonthlyPoint[]): MonthlyPoint[] => {
    const m = monthEndPoints(pts);
    return m.map((p, i) => ({ asOf: p.asOf, value: m.slice(Math.max(0, i - 11), i + 1).reduce((s, x) => s + x.value, 0) }));
  };
  const reading: DryUpReading = {
    foreignHoldings3mPct: pctChangeOver(tic, 3),
    fedTreasuries3mPct: pctChangeOver(g("tp-fed-treasuries"), 3),
    reverseRepoUsdBn: last(g("tp-reverse-repo"))?.value ?? null,
    termPremium3mPp: changeOver(g("tp-term-premium"), 3),
    tenYear3mBp: (() => {
      const c = changeOver(g("tp-10y"), 3);
      return c === null ? null : Math.round(c * 100);
    })(),
    dollar3mPct: pctChangeOver(g("tp-dollar-broad"), 3),
    bidToCoverDeviation: btcLast && auctions.length >= 3 ? Math.round((btcLast.value - btcMean12) * 1000) / 1000 : null,
    deficit3mPct: deficit.length > 15 ? pctChangeOver(rolling12(deficit).map(p => ({ asOf: p.asOf, value: -p.value })), 3) : null,
  };
  return { reading, result: liquidityDryUp(reading, today) };
}

export type ArchaeologyReport = {
  asOf: string;
  seriesStored: number;
  seriesTotal: number;
  months: number;
  patterns: PatternReport | null;
  dominoes: ReturnType<typeof dominoChains>;
  loudest: ReturnType<typeof loudestBeforeTurns>;
  regimeSplits: Array<{ hypothesisId: string; leader: string; follower: string; lag: number; rising: { r: number; n: number }; falling: { r: number; n: number }; asymmetry: number }>;
  hypotheses: Array<{ id: string; kind: string; detector: string; claim: string; measured: null | { r: number; lag: number; confidence: number; grade: string; agrees: boolean } }>;
  grid: ReturnType<typeof predictionGrid>;
  /** Combination engine: what preceded a 10-year rise and a recession, and the predicted never-seen combinations. */
  combinations: { tenYearUp: ComboReport | null; recession: ComboReport | null };
  method: string[];
};

/** The archaeology: every scan over the stored pool matrix, and the hypotheses graded against what was found. */
export async function archaeologyFromStore(db: Db, today: string, opts: { minMonths?: number } = {}): Promise<ArchaeologyReport> {
  const minMonths = opts.minMonths ?? 24;
  const pool = await loadPoolSeries(db);
  const series: Series[] = [];
  pool.forEach((pts, id) => {
    if (pts.length >= minMonths) series.push({ indicatorId: id, points: monthEndPoints(pts) });
  });
  const months = series.length ? Math.max(...series.map(s => s.points.length)) : 0;
  const patterns = series.length >= 6 ? detectPatterns(series, { minAbsR: 0.5, maxLag: 24, minN: 60, maxFindings: 80, today }) : null;
  const dominoes = patterns ? dominoChains(patterns.leads, { maxLinks: 5, minAbsR: 0.3 }) : [];
  const loudest = series.some(s => s.indicatorId === "tp-fed-funds") ? loudestBeforeTurns(series, "tp-fed-funds", { lookback: 6, window: 6, minSwing: 1, top: 8 }) : [];
  const ref = pool.get("tp-fed-funds") ?? [];
  const regimeSplits: ArchaeologyReport["regimeSplits"] = [];
  for (const hyp of TREASURY_HYPOTHESES.filter(h => h.detector === "regime" || h.id === "H30")) {
    const [a, b] = [hyp.variables[0], hyp.variables[hyp.variables.length - 1]];
    const L = pool.get(a) ?? [];
    const F = pool.get(b) ?? [];
    if (L.length < 60 || F.length < 60 || ref.length < 60) continue;
    regimeSplits.push({ hypothesisId: hyp.id, leader: a, follower: b, lag: Math.max(1, hyp.lagMonths), ...regimeSplit(L, F, ref, Math.max(1, hyp.lagMonths)) });
  }
  const hypotheses = TREASURY_HYPOTHESES.map(hyp => {
    const a = hyp.variables[0];
    const b = hyp.variables[hyp.variables.length - 1];
    const found = patterns ? [...patterns.leads, ...patterns.correlations].find(f => f.a === a && f.b === b) ?? [...patterns.leads, ...patterns.correlations].find(f => f.a === b && f.b === a) : undefined;
    return { id: hyp.id, kind: hyp.kind, detector: hyp.detector, claim: hyp.claim, measured: found ? { r: found.r, lag: found.lag, confidence: found.confidence, grade: found.grade, agrees: Math.sign(found.r) === hyp.expectedSign } : null };
  });
  const z = latestZScores(series);
  const grid = predictionGrid(patterns?.leads ?? [], z);
  const has = (id: string) => series.some(x => x.indicatorId === id);
  const combinations = {
    tenYearUp: has("tp-10y") && series.length >= 6 ? mineCombinations(series, "tp-10y", { targetState: "up", horizonMonths: 6 }) : null,
    recession: has("tp-recession") && series.length >= 6 ? mineCombinations(series, "tp-recession", { targetState: "level-1", horizonMonths: 12 }) : null,
  };
  return {
    asOf: today,
    seriesStored: series.length,
    seriesTotal: TREASURY_POOL_SERIES.length,
    months,
    patterns,
    dominoes,
    loudest,
    regimeSplits,
    hypotheses,
    grid,
    combinations,
    method: [
      `Monthly grid of the ${TREASURY_POOL_SERIES.length} pool series; a series enters the scan with ≥ ${minMonths} stored months, a pair is measured with ≥ 60 overlapping months.`,
      "Pairwise: Pearson r, 80 % Fisher-z interval, split-half stability; lead–lag over lags 1–24, reported when it beats the contemporaneous |r| by ≥ 0.10.",
      "Conditional triples on medians (P(C | A,B) ≥ 0.70, lift ≥ 1.5); domino chains from lead-lag links with |r| ≥ 0.3, up to five links, lags summed.",
      "Loudest movers: z-scores of every series' six-month change before each fed-funds turning point; regime splits: the same lead measured on rising and falling twelve-month fed-funds trends.",
      "Combinations: every series' monthly change as a state (up/down/flat at |z| ≥ 0.5); conjunctions of two and three states that preceded a 10-year rise (6 m) or a recession (12 m) with lift ≥ 1.5 in both halves; kept pairs sharing a member composed into never-observed combinations, registered as untested predictions (confidence ≤ 25).",
      "Hypotheses are graded by whether the detector found the named pair with the expected sign; 'measured: null' means not yet found, which with no stored history is every row.",
      series.length ? `${series.length} of ${TREASURY_POOL_SERIES.length} series stored with ≥ ${minMonths} months.` : "No pool series stored yet: every scan returns empty and every hypothesis is pending. The first cron run with egress changes this.",
    ],
  };
}

export type CountryStatus = { iso3: string; name: string; readings: FlowReading; result: ReturnType<typeof globalFlowCalculus>; stored: Record<string, number> };

/** Ten readings per country from the stored series, then the calculus. */
export async function globalFromStore(db: Db, today: string): Promise<{ asOf: string; countries: CountryStatus[]; indicators: typeof FLOW_INDICATORS; episodes: typeof COUNTRY_FLOW_EPISODES; method: string[] }> {
  const usPolicy = await loadSeries(db, "f-fed-funds");
  const us10y = await loadSeries(db, "ust10y");
  const dollar = await loadSeries(db, "tp-dollar-broad");
  const ofr = await loadSeries(db, "ofr-fsi");
  const ofrVals = ofr.map(p => p.value);
  const ofrMean = ofrVals.length ? ofrVals.reduce((a, b) => a + b, 0) / ofrVals.length : 0;
  const ofrSd = ofrVals.length ? Math.sqrt(ofrVals.reduce((a, b) => a + (b - ofrMean) ** 2, 0) / ofrVals.length) : 0;
  const countries: CountryStatus[] = [];
  for (const x of COUNTRIES) {
    const get = async (suffix: string) => loadSeries(db, `gt:${x.iso3}:${suffix}`);
    const [tic, policy, reserves, bond, ca, debt, fx] = await Promise.all([get("tic"), get("policy"), get("reserves"), get("bond"), get("current-account"), get("debt-gdp"), get("fx")]);
    const fxLast12 = pctChangeOver(fx, 12);
    // FRED quotes most pairs as local per USD (weakening = rising); DEXUSUK/DEXUSEU/DEXUSAL are USD per local (weakening = falling).
    const usdPerLocal = /DEXUS(UK|EU|AL)/.test(x.fredFx ?? "");
    const readings: FlowReading = {
      rateDifferentialPp: last(usPolicy) && last(policy) ? Math.round((last(usPolicy)!.value - last(policy)!.value) * 100) / 100 : null,
      reserves12mPct: pctChangeOver(reserves, 12),
      currentAccountPctGdp: last(ca)?.value ?? null,
      fxWeakening12mPct: fxLast12 === null ? null : usdPerLocal ? -fxLast12 : fxLast12,
      tic12mPct: pctChangeOver(tic, 12),
      debtPctGdp: last(debt)?.value ?? null,
      bondDifferentialPp: last(us10y) && last(bond) ? Math.round((last(us10y)!.value - last(bond)!.value) * 100) / 100 : null,
      dollar12mPct: pctChangeOver(dollar, 12),
      usStressZ: last(ofr) && ofrSd ? Math.round(((last(ofr)!.value - ofrMean) / ofrSd) * 100) / 100 : null,
      sanctionsExposure: COUNTRY_SANCTIONS_EXPOSURE[x.iso3] ?? null,
    };
    countries.push({ iso3: x.iso3, name: x.name, readings, result: globalFlowCalculus(x.iso3, readings, today), stored: { tic: tic.length, policy: policy.length, reserves: reserves.length, bond: bond.length, currentAccount: ca.length, debt: debt.length, fx: fx.length } });
  }
  countries.sort((a, b) => b.result.score - a.result.score);
  return {
    asOf: today,
    countries,
    indicators: FLOW_INDICATORS,
    episodes: COUNTRY_FLOW_EPISODES,
    method: [
      "Readings are computed from the stored series per country (TIC holdings, BIS policy rate, IMF IFS reserves and bond yield, World Bank current account, IMF WEO debt, FRED exchange rate) and the U.S. references (fed funds, 10-year, broad dollar, OFR stress).",
      "Sanctions exposure is a stated per-country figure (COUNTRY_SANCTIONS_EXPOSURE) until the sanctions-domain connectors supply a measured one.",
      "The same ten drivers and weights for every country; the calculus, not a per-country pattern hunt, is what the owner asked for.",
    ],
  };
}

/** The pool snapshot for the page: latest reading and coverage per series. */
export async function poolSnapshot(db: Db) {
  const meta = new Map((await loadSeriesMeta(db)).map(m => [m.indicatorId, m]));
  const pool = await loadPoolSeries(db);
  return TREASURY_POOL_SERIES.map(s => {
    const pts = pool.get(s.id) ?? [];
    const l = last(pts);
    const m = meta.get(poolStorageId(s));
    return { ...s, latest: l, change3m: s.role === "prices" || s.group === "yields" ? changeOver(pts, 3) : pctChangeOver(pts, 3), meta: m ?? null, points: pts.length };
  });
}

export const TREASURY_STATIC = { hypotheses: TREASURY_HYPOTHESES, episodes: TREASURY_EPISODES, gridTargets: GRID_TARGETS };
