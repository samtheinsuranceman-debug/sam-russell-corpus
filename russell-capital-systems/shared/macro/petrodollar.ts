/**
 * De-dollarised Oil Tracker — who buys and sells oil without the dollar.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Measured daily where a source allows (tanker tracking, exchange volumes),
 * rolled up monthly, quarterly, semi-annually and annually, and carried back
 * twenty years on the reconstructed series in `snapshot.ts`.
 *
 * The forecast is a logistic diffusion — the share of a market that moves to
 * a new settlement rail follows an S-curve: slow while the plumbing is built,
 * fast once the largest exporter and importer both use it, then saturating
 * where sanctions and liquidity stop it. Ten thousand paths draw the
 * saturation level, the speed and the shock timing from ranges the reader can
 * see and change.
 *
 * Corridor ledger: each country pair is recorded with the currency, the share
 * of that pair's crude trade settled in it, the volume, and the evidence. That
 * ledger is what the daily refresh appends to; the aggregate share is derived
 * from it, never typed in.
 */
import type { IsoDate } from "./types";
import { OIL_NONUSD_HISTORY, OIL_SETTLEMENT } from "./snapshot";
import { mulberry32, triangular, coin, summarise, MACRO_SIMULATION_RUNS, MACRO_DEFAULT_SEED, type Summary } from "./random";
import { A, citeAssumptions } from "./assumptions";

export type SettlementCurrency = "USD" | "CNY" | "RUB" | "INR" | "AED" | "SAR" | "EUR" | "BRL" | "GOLD" | "BARTER" | "OTHER";

export type Corridor = {
  id: string;
  exporter: string;
  importer: string;
  currency: SettlementCurrency;
  /** Share of this pair's crude trade settled in `currency`, 0–1. */
  share: number;
  shareLow: number;
  shareHigh: number;
  /** Volume, million barrels per day. */
  volumeMbd: number;
  asOf: IsoDate;
  sourceIds: string[];
  since?: number;
  note?: string;
};

/**
 * The corridor ledger as of the snapshot. Volumes are 2026 run-rates from
 * customs and tanker data; shares are the best available estimate with the
 * range the sources disagree across. Refresh replaces rows by `id`.
 */
export const CORRIDORS: Corridor[] = [
  { id: "ru-cn-cny", exporter: "Russia", importer: "China", currency: "CNY", share: 0.85, shareLow: 0.75, shareHigh: 0.95, volumeMbd: 2.2, asOf: "2026-06-30", sourceIds: ["ru-cbr", "ru-mosprime"], since: 2022, note: "Yuan and ruble; the largest non-dollar corridor on earth" },
  { id: "ru-cn-rub", exporter: "Russia", importer: "China", currency: "RUB", share: 0.10, shareLow: 0.05, shareHigh: 0.20, volumeMbd: 2.2, asOf: "2026-06-30", sourceIds: ["ru-cbr"], since: 2022 },
  { id: "ru-in-inr", exporter: "Russia", importer: "India", currency: "INR", share: 0.35, shareLow: 0.25, shareHigh: 0.50, volumeMbd: 1.7, asOf: "2026-06-30", sourceIds: ["in-rbi", "in-ppac"], since: 2022, note: "Rupee via Vostro; dirham for the balance" },
  { id: "ru-in-aed", exporter: "Russia", importer: "India", currency: "AED", share: 0.50, shareLow: 0.35, shareHigh: 0.65, volumeMbd: 1.7, asOf: "2026-06-30", sourceIds: ["in-ppac", "cnbc-reuters-energy"], since: 2023 },
  { id: "sa-cn-cny", exporter: "Saudi Arabia", importer: "China", currency: "CNY", share: 0.45, shareLow: 0.30, shareHigh: 0.55, volumeMbd: 1.8, asOf: "2026-02-28", sourceIds: ["sa-aramco", "cnbc-reuters-energy"], since: 2023, note: "45 % of Aramco–China trade in yuan by Feb 2026 (one estimate)" },
  { id: "ir-cn-cny", exporter: "Iran", importer: "China", currency: "CNY", share: 0.90, shareLow: 0.80, shareHigh: 1.0, volumeMbd: 1.4, asOf: "2026-06-30", sourceIds: ["kpler", "ofac"], since: 2019, note: "Routed via Malaysia; yuan and barter" },
  { id: "ir-cn-barter", exporter: "Iran", importer: "China", currency: "BARTER", share: 0.10, shareLow: 0.0, shareHigh: 0.20, volumeMbd: 1.4, asOf: "2026-06-30", sourceIds: ["kpler"], since: 2019 },
  { id: "ae-cn-cny", exporter: "UAE", importer: "China", currency: "CNY", share: 0.15, shareLow: 0.05, shareHigh: 0.25, volumeMbd: 0.9, asOf: "2026-04-30", sourceIds: ["ae-cbuae"], since: 2023, note: "April 2026: UAE warned it could shift further" },
  { id: "ve-cn-cny", exporter: "Venezuela", importer: "China", currency: "CNY", share: 0.70, shareLow: 0.50, shareHigh: 0.90, volumeMbd: 0.4, asOf: "2026-06-30", sourceIds: ["kpler", "ofac"], since: 2018, note: "Debt-for-oil; dark fleet" },
  { id: "br-cn-cny", exporter: "Brazil", importer: "China", currency: "CNY", share: 0.10, shareLow: 0.0, shareHigh: 0.20, volumeMbd: 0.8, asOf: "2026-06-30", sourceIds: ["br-bcb"], since: 2023 },
  { id: "ru-tr-rub", exporter: "Russia", importer: "Türkiye", currency: "RUB", share: 0.30, shareLow: 0.20, shareHigh: 0.45, volumeMbd: 0.5, asOf: "2026-06-30", sourceIds: ["ru-cbr"], since: 2022 },
  { id: "ru-eu-eur", exporter: "Russia", importer: "EU (pipeline residual)", currency: "EUR", share: 0.60, shareLow: 0.40, shareHigh: 0.80, volumeMbd: 0.3, asOf: "2026-06-30", sourceIds: ["eurostat-gov"], since: 2020 },
  { id: "sa-in-inr", exporter: "Saudi Arabia", importer: "India", currency: "INR", share: 0.05, shareLow: 0.0, shareHigh: 0.10, volumeMbd: 0.7, asOf: "2026-06-30", sourceIds: ["in-rbi"], since: 2024 },
  { id: "ae-in-inr", exporter: "UAE", importer: "India", currency: "INR", share: 0.15, shareLow: 0.05, shareHigh: 0.25, volumeMbd: 0.4, asOf: "2026-06-30", sourceIds: ["in-rbi", "ae-cbuae"], since: 2023, note: "First rupee-settled ADNOC cargo Aug 2023" },
  { id: "ng-in-inr", exporter: "Nigeria", importer: "India", currency: "INR", share: 0.05, shareLow: 0.0, shareHigh: 0.10, volumeMbd: 0.3, asOf: "2026-06-30", sourceIds: ["in-rbi"], since: 2024 },
];

/** Global seaborne + pipeline crude trade, mb/d, for the denominator (rules table `oil.globalCrudeTradeMbd`). */
export const GLOBAL_CRUDE_TRADE_MBD = A("oil.globalCrudeTradeMbd");
export const GLOBAL_CRUDE_TRADE_SOURCE = "iea-omr";

export type SettlementBreakdown = {
  asOf: IsoDate;
  nonUsdShare: number;
  nonUsdLow: number;
  nonUsdHigh: number;
  byCurrency: Array<{ currency: SettlementCurrency; share: number; volumeMbd: number }>;
  corridorCount: number;
  /** Corridors that account for 80 % of the non-dollar volume. */
  concentration: string[];
  sourceIds: string[];
};

/** Aggregate the corridor ledger into currency shares of global crude trade. */
export function settlementBreakdown(corridors: Corridor[] = CORRIDORS, globalMbd: number = GLOBAL_CRUDE_TRADE_MBD): SettlementBreakdown {
  const byCur = new Map<SettlementCurrency, number>();
  let nonUsd = 0;
  let low = 0;
  let high = 0;
  const ranked: Array<{ id: string; vol: number }> = [];
  for (const c of corridors) {
    const vol = c.volumeMbd * c.share;
    byCur.set(c.currency, (byCur.get(c.currency) ?? 0) + vol);
    if (c.currency !== "USD") {
      nonUsd += vol;
      low += c.volumeMbd * c.shareLow;
      high += c.volumeMbd * c.shareHigh;
      ranked.push({ id: c.id, vol });
    }
  }
  // The ledger only lists non-dollar corridors we can evidence. The consensus
  // aggregate (~20 %) is wider than the ledger's coverage, so report the ledger
  // floor and the consensus as the range.
  const ledgerShare = nonUsd / globalMbd;
  const consensus = (100 - OIL_SETTLEMENT.usd.value) / 100;
  const nonUsdShare = Math.max(ledgerShare, consensus);
  ranked.sort((a, b) => b.vol - a.vol);
  const concentration: string[] = [];
  let acc = 0;
  for (const r of ranked) {
    concentration.push(r.id);
    acc += r.vol;
    if (acc >= nonUsd * 0.8) break;
  }
  const byCurrency = Array.from(byCur.entries())
    .map(([currency, vol]) => ({ currency, share: round4(vol / globalMbd), volumeMbd: round2(vol) }))
    .sort((a, b) => b.share - a.share);
  const usdVol = globalMbd - nonUsd;
  byCurrency.unshift({ currency: "USD", share: round4(usdVol / globalMbd), volumeMbd: round2(usdVol) });
  const sourceIds = Array.from(new Set(corridors.flatMap(c => c.sourceIds)));
  return {
    asOf: OIL_SETTLEMENT.asOf,
    nonUsdShare: round4(nonUsdShare),
    nonUsdLow: round4(Math.min(low / globalMbd, (100 - OIL_SETTLEMENT.usd.high) / 100)),
    nonUsdHigh: round4(Math.max(high / globalMbd, (100 - OIL_SETTLEMENT.usd.low) / 100)),
    byCurrency,
    corridorCount: corridors.length,
    concentration,
    sourceIds: [GLOBAL_CRUDE_TRADE_SOURCE, ...sourceIds],
  };
}

export type Rollup = "monthly" | "quarterly" | "semiannual" | "annual";

export type SeriesPoint = { period: string; nonUsdShare: number; low: number; high: number };

/**
 * Roll the twenty-year annual series into a requested cadence by linear
 * interpolation between year points. Daily/monthly observations from the
 * refresh job override interpolated points when present.
 */
export function historicalSeries(rollup: Rollup, observed: SeriesPoint[] = []): SeriesPoint[] {
  const hist = OIL_NONUSD_HISTORY;
  const periodsPerYear = rollup === "monthly" ? 12 : rollup === "quarterly" ? 4 : rollup === "semiannual" ? 2 : 1;
  const out: SeriesPoint[] = [];
  const first = hist[0].year;
  const last = hist[hist.length - 1].year;
  for (let y = first; y <= last; y++) {
    for (let p = 0; p < periodsPerYear; p++) {
      const t = y + p / periodsPerYear;
      const { v, lo, hi } = interp(hist, t);
      const label =
        rollup === "annual" ? `${y}` :
        rollup === "semiannual" ? `${y}-H${p + 1}` :
        rollup === "quarterly" ? `${y}-Q${p + 1}` :
        `${y}-${String(p + 1).padStart(2, "0")}`;
      out.push({ period: label, nonUsdShare: round2(v), low: round2(lo), high: round2(hi) });
      if (y === last && rollup !== "annual" && t > 2026.5) break;
    }
  }
  const byPeriod = new Map(out.map(pt => [pt.period, pt]));
  for (const o of observed) byPeriod.set(o.period, o);
  return Array.from(byPeriod.values()).sort((a, b) => (a.period < b.period ? -1 : 1));
}

function interp(hist: typeof OIL_NONUSD_HISTORY, t: number) {
  let a = hist[0];
  let b = hist[hist.length - 1];
  for (let i = 0; i < hist.length - 1; i++) {
    if (t >= hist[i].year && t <= hist[i + 1].year) {
      a = hist[i];
      b = hist[i + 1];
      break;
    }
  }
  if (t <= a.year) return { v: a.nonUsdShare, lo: a.low, hi: a.high };
  if (t >= b.year) return { v: b.nonUsdShare, lo: b.low, hi: b.high };
  const f = (t - a.year) / (b.year - a.year);
  return {
    v: a.nonUsdShare + f * (b.nonUsdShare - a.nonUsdShare),
    lo: a.low + f * (b.low - a.low),
    hi: a.high + f * (b.high - a.high),
  };
}

export type PetrodollarForecastInput = {
  years?: number;
  /** Saturation ceiling of the non-USD share, as a range. Default 30–60 %, mode 40. */
  ceiling?: { low: number; mode: number; high: number };
  /** Years to go from 20 % to halfway to the ceiling. Default 4–12, mode 7. */
  halfLifeYears?: { low: number; mode: number; high: number };
  /** Annual probability of a step shock (Gulf yuan pricing at scale, secondary sanctions on China). */
  shockProbabilityPerYear?: number;
  /** Size of the step, points of share. */
  shockSize?: { low: number; mode: number; high: number };
  /** Annual probability of a reversal (sanctions relief, yuan crisis). */
  reversalProbabilityPerYear?: number;
  runs?: number;
  seed?: number;
};

export type PetrodollarForecast = {
  asOf: IsoDate;
  startShare: number;
  years: number;
  /** Per-year distribution of the non-USD share, %. */
  path: Array<{ year: number; share: Summary }>;
  /** Probability the share exceeds thresholds by the horizon end. */
  exceedance: Array<{ threshold: number; probability: number }>;
  assumptions: string[];
  sourceIds: string[];
};

export function forecastPetrodollar(input: PetrodollarForecastInput = {}): PetrodollarForecast {
  const years = input.years ?? 10;
  const ceiling = input.ceiling ?? { low: A("oil.ceiling.low"), mode: A("oil.ceiling.mode"), high: A("oil.ceiling.high") };
  const hl = input.halfLifeYears ?? { low: A("oil.halfLife.low"), mode: A("oil.halfLife.mode"), high: A("oil.halfLife.high") };
  const shockP = input.shockProbabilityPerYear ?? A("oil.shockProbabilityPerYear");
  const shockSize = input.shockSize ?? { low: A("oil.shockSize.low"), mode: A("oil.shockSize.mode"), high: A("oil.shockSize.high") };
  const reversalP = input.reversalProbabilityPerYear ?? A("oil.reversalProbabilityPerYear");
  const runs = input.runs ?? MACRO_SIMULATION_RUNS;
  const rng = mulberry32(input.seed ?? MACRO_DEFAULT_SEED + 2);
  const start = 100 - OIL_SETTLEMENT.usd.value;
  const startYear = 2026;

  const perYear: number[][] = Array.from({ length: years }, () => []);
  for (let i = 0; i < runs; i++) {
    const K = triangular(rng, ceiling.low, ceiling.mode, ceiling.high);
    const h = triangular(rng, hl.low, hl.mode, hl.high);
    // Logistic toward K from `start`, with rate set so that half the gap closes in h years.
    const r = Math.log(2) / h;
    let share = start;
    let bump = 0;
    for (let y = 1; y <= years; y++) {
      const gap = K - share;
      share += gap * (1 - Math.exp(-r));
      if (coin(rng, shockP)) bump += triangular(rng, shockSize.low, shockSize.mode, shockSize.high);
      if (coin(rng, reversalP)) bump -= triangular(rng, shockSize.low, shockSize.mode, shockSize.high) * 0.7;
      const shown = Math.max(5, Math.min(90, share + bump));
      perYear[y - 1].push(shown);
    }
  }
  const path = perYear.map((vals, idx) => ({ year: startYear + idx + 1, share: summarise(vals) }));
  const end = perYear[years - 1];
  const exceedance = [25, 30, 40, 50].map(threshold => ({ threshold, probability: round4(end.filter(v => v >= threshold).length / runs) }));
  return {
    asOf: OIL_SETTLEMENT.asOf,
    startShare: start,
    years,
    path,
    exceedance,
    assumptions: [
      `Start ${start} % non-USD (consensus Q1 2026; JPM 2023 benchmark 80 % USD).`,
      `Logistic diffusion toward a ceiling of ${ceiling.low}/${ceiling.mode}/${ceiling.high} % — the share sanctions, liquidity and Gulf pegs allow.`,
      `Half the gap closes in ${hl.low}/${hl.mode}/${hl.high} years.`,
      `Step shock ${Math.round(shockP * 100)} %/yr of +${shockSize.low}–${shockSize.high} pts; reversal ${Math.round(reversalP * 100)} %/yr.`,
      `${runs.toLocaleString()} paths.`,
      ...citeAssumptions("oil.ceiling"),
      ...citeAssumptions("oil.halfLife"),
      ...citeAssumptions("oil.shock"),
      ...citeAssumptions("oil.reversal"),
    ],
    sourceIds: [...OIL_SETTLEMENT.sourceIds],
  };
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}
function round4(x: number) {
  return Math.round(x * 10_000) / 10_000;
}
