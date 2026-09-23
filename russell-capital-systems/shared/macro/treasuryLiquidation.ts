/**
 * Treasury Liquidation Engine — Japan, China, or both, at any sell fraction.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Two questions, kept separate because they are different kinds of claim:
 *
 *   1. IF a holder sells X % of its Treasuries over N months, what happens?
 *      → `simulateLiquidation` — a scenario engine. Deterministic given its
 *        parameters; 10,000-path Monte Carlo over the parameter uncertainty.
 *
 *   2. HOW LIKELY is it, and how much, over the next 24 months?
 *      → `forecastLiquidation` — a forecast built from the measured run-rate
 *        (TIC), the intervention regime (MOF), and the confidence model's
 *        stress probability. Reported as a distribution, never a point.
 *
 * ─── PRICE IMPACT: WHERE THE NUMBER COMES FROM ──────────────────────────────
 *
 * The literature on foreign official demand and Treasury yields gives a wide
 * range, and the range is the honest answer:
 *
 *   • Warnock & Warnock (2009, J. Int. Money & Finance): foreign official
 *     inflows of ~1 % of GDP lowered the 10-year by ~80 bp over 2005 — roughly
 *     10–15 bp per $100 bn at that time.
 *   • Beltran, Kretchmer, Marquez & Thomas (2013, Fed IFDP 1041): a $100 bn
 *     change in foreign official holdings moves the 5-year term premium by
 *     ~13 bp on impact, with larger long-run estimates (40–60 bp) that most
 *     later work regards as an upper bound.
 *   • Kaminska & Zinna (2020, JMCB, "Official Demand for U.S. Debt"): official
 *     purchases lowered 10-year yields by up to 100 bp at the 2013 peak of
 *     official holdings; the effect scales with the share of float held.
 *   • 2022–23 experience: China and Japan together reduced holdings by
 *     ~$300 bn while yields rose ~250 bp — but the Fed's hiking cycle
 *     dominates that sample, so the foreign contribution is unidentified.
 *
 * We therefore draw the impact per $100 bn sold from a triangular
 * distribution: low 5 bp, mode 12 bp, high 30 bp — and scale it by pace (the
 * same $100 bn over one month hits harder than over twelve; market makers
 * absorb ~$1 tn a day but *net* directional flow of that size is a different
 * animal) and by a Fed-response damping that activates when the modelled move
 * crosses a disorderly threshold. Every one of those choices is a parameter
 * a reader can change on the page.
 */
import type { IsoDate } from "./types";
import { TREASURY_HOLDINGS, TREASURY_MARKET, JAPAN_POSITION, CHINA_POSITION } from "./snapshot";
import { mulberry32, triangular, coin, summarise, MACRO_SIMULATION_RUNS, MACRO_DEFAULT_SEED, type Summary } from "./random";
import { A, citeAssumptions } from "./assumptions";

export type Holder = "JP" | "CN" | "BOTH";

export type LiquidationScenarioInput = {
  holder: Holder;
  /** Share of current holdings sold, 0–1. 1 = everything. */
  fraction: number;
  /** Months over which the selling is spread. 1 = a dump. */
  months: number;
  /** Override the holdings (USD bn) if the page has a fresher TIC reading. */
  holdingsOverride?: { JP?: number; CN?: number };
  /** Sensitivity: bp of 10-year yield per $100 bn sold. Defaults to the literature triangle. */
  impactBpPer100bn?: { low: number; mode: number; high: number };
  /** Probability the Fed steps in (QE / FIMA / standing repo expansion) once the move exceeds `fedThresholdBp`. */
  fedResponseProbability?: number;
  fedThresholdBp?: number;
  /** How much a Fed response damps the peak move (0.5 = halves it). */
  fedDamping?: number;
  /** Months for the impact to decay by half once selling stops. */
  recoveryHalfLifeMonths?: number;
  runs?: number;
  seed?: number;
};

export type LiquidationPathPoint = {
  month: number;
  cumulativeSoldUsdBn: number;
  tenYearDeltaBp: number;
};

export type LiquidationScenarioResult = {
  input: Required<Pick<LiquidationScenarioInput, "holder" | "fraction" | "months">>;
  asOf: IsoDate;
  holdingsUsdBn: number;
  soldUsdBn: number;
  shareOfForeignHoldings: number;
  shareOfMarketable: number;
  /** Deterministic path at the mode parameters. */
  centralPath: LiquidationPathPoint[];
  /** Monte Carlo over parameter uncertainty. */
  peakTenYearDeltaBp: Summary;
  twelveMonthTenYearDeltaBp: Summary;
  /** Probability the Fed was modelled as responding. */
  fedResponded: number;
  /** Transmission at the central path's peak. */
  transmission: Transmission;
  assumptions: string[];
  sourceIds: string[];
};

export type Transmission = {
  tenYearDeltaBp: number;
  mortgageRateDeltaBp: number;
  /** Percent change, negative is a fall. */
  equityIndexPct: number;
  dollarIndexPct: number;
  goldPct: number;
  /** Change in one-year recession probability, points. */
  recessionProbabilityDelta: number;
  /** Annual federal interest cost change once the curve reprices, USD bn (on ~$29.6 tn marketable, one-third rolling in a year). */
  federalInterestCostUsdBnPerYear: number;
  /** Holder's own currency. Positive = strengthens vs USD. */
  holderCurrencyPct: number;
  /** Mark-to-market loss on the holder's remaining Treasuries, USD bn (duration ~6). */
  holderMarkToMarketLossUsdBn: number;
  notes: string[];
};

/** Rules table `liq.impact.*` — see assumptions.ts for the three papers behind the triangle. */
const DEFAULT_IMPACT = { low: A("liq.impact.low"), mode: A("liq.impact.mode"), high: A("liq.impact.high") };

function holdingsFor(holder: Holder, override?: LiquidationScenarioInput["holdingsOverride"]): number {
  const jp = override?.JP ?? TREASURY_HOLDINGS.japan;
  const cn = override?.CN ?? TREASURY_HOLDINGS.chinaMainland;
  if (holder === "JP") return jp;
  if (holder === "CN") return cn;
  return jp + cn;
}

/**
 * Pace multiplier: selling $S over m months. Relative to a 12-month glide, a
 * one-month dump hits ~2.2× harder; a 36-month drip ~0.55×. Square-root law,
 * the standard market-impact shape.
 */
export function paceMultiplier(months: number): number {
  const m = Math.max(1, months);
  return Math.pow(12 / m, A("liq.pace.exponent"));
}

/** Transmission from a 10-year move to the rest of the system. All coefficients are page-editable assumptions. */
export function transmit(tenYearDeltaBp: number, holder: Holder, soldUsdBn: number, remainingHoldingsUsdBn: number): Transmission {
  const bp = tenYearDeltaBp;
  // Every coefficient below is a row in assumptions.ts (`liq.tx.*`) with its
  // source and as-of date; the notes cite them by id so the PDF ledger can.
  const mortgage = bp * A("liq.tx.mortgagePassThrough");
  const equity = (bp / 100) * A("liq.tx.equityPctPer100bp");
  const converted = soldUsdBn / 100;
  const dollar = Math.max(A("liq.tx.dollarCapPct"), A("liq.tx.dollarPctPer100bnConverted") * converted);
  const gold = Math.min(A("liq.tx.goldCapPct"), A("liq.tx.goldPctPer100bn") * converted);
  const recession = (bp / 100) * A("liq.tx.recessionPtsPer100bp");
  const interest = TREASURY_MARKET.marketableOutstanding * A("liq.tx.repricingShareYearOne") * (bp / 10_000);
  const fxJP = Math.min(A("liq.tx.holderFxCapPct.JP"), A("liq.tx.holderFxPctPer100bn.JP") * converted);
  const fxCN = Math.min(A("liq.tx.holderFxCapPct.CN"), A("liq.tx.holderFxPctPer100bn.CN") * converted);
  const holderFx = holder === "JP" ? fxJP : holder === "CN" ? fxCN : (fxJP + fxCN) / 2;
  const mtm = remainingHoldingsUsdBn * A("liq.tx.holderDurationYears") * (bp / 10_000);

  const notes = [
    `Mortgage pass-through ${A("liq.tx.mortgagePassThrough")}× the 10-year move [liq.tx.mortgagePassThrough].`,
    `Equity ${A("liq.tx.equityPctPer100bp")} % per +100 bp via the discount-rate channel; no earnings offset [liq.tx.equityPctPer100bp].`,
    `Dollar ${A("liq.tx.dollarPctPer100bnConverted")} % per $100 bn converted, capped at ${A("liq.tx.dollarCapPct")} % [liq.tx.dollar*].`,
    `Gold +${A("liq.tx.goldPctPer100bn")} % per $100 bn of official sales, capped at +${A("liq.tx.goldCapPct")} % [liq.tx.gold*].`,
    `Recession probability +${A("liq.tx.recessionPtsPer100bp")} points per +100 bp [liq.tx.recessionPtsPer100bp].`,
    `Federal interest: ${Math.round(A("liq.tx.repricingShareYearOne") * 100)} % of $${TREASURY_MARKET.marketableOutstanding.toLocaleString()} bn marketable reprices in year one [liq.tx.repricingShareYearOne; us-fiscaldata ${TREASURY_MARKET.marketableAsOf}].`,
    `Seller's remaining book marked at duration ${A("liq.tx.holderDurationYears")} [liq.tx.holderDurationYears].`,
  ];

  return {
    tenYearDeltaBp: round1(bp),
    mortgageRateDeltaBp: round1(mortgage),
    equityIndexPct: round1(equity),
    dollarIndexPct: round1(dollar),
    goldPct: round1(gold),
    recessionProbabilityDelta: round1(recession),
    federalInterestCostUsdBnPerYear: round1(interest),
    holderCurrencyPct: round1(holderFx),
    holderMarkToMarketLossUsdBn: round1(mtm),
    notes,
  };
}

/**
 * Build the yield path for one draw of the parameters.
 */
function pathFor(
  soldUsdBn: number,
  months: number,
  impactBpPer100bn: number,
  fedResponds: boolean,
  fedThresholdBp: number,
  fedDamping: number,
  recoveryHalfLife: number,
  horizon: number,
): LiquidationPathPoint[] {
  const perMonth = soldUsdBn / Math.max(1, months);
  const pace = paceMultiplier(months);
  const path: LiquidationPathPoint[] = [];
  let cumulative = 0;
  let impact = 0;
  let fedActive = false;
  const decay = Math.pow(0.5, 1 / Math.max(1, recoveryHalfLife));
  for (let m = 1; m <= horizon; m++) {
    if (m <= months) {
      cumulative += perMonth;
      impact += (perMonth / 100) * impactBpPer100bn * pace;
    } else {
      impact *= decay;
    }
    if (fedResponds && !fedActive && impact > fedThresholdBp) fedActive = true;
    const shown = fedActive ? impact * (1 - fedDamping) : impact;
    path.push({ month: m, cumulativeSoldUsdBn: round1(cumulative), tenYearDeltaBp: round1(shown) });
  }
  return path;
}

export function simulateLiquidation(input: LiquidationScenarioInput): LiquidationScenarioResult {
  const fraction = Math.min(1, Math.max(0, input.fraction));
  const months = Math.max(1, Math.round(input.months));
  const holdings = holdingsFor(input.holder, input.holdingsOverride);
  const sold = holdings * fraction;
  const impact = input.impactBpPer100bn ?? DEFAULT_IMPACT;
  const fedP = input.fedResponseProbability ?? A("liq.fed.responseProbability");
  const fedThreshold = input.fedThresholdBp ?? A("liq.fed.thresholdBp");
  const fedDamping = input.fedDamping ?? A("liq.fed.damping");
  const halfLife = input.recoveryHalfLifeMonths ?? A("liq.recovery.halfLifeMonths");
  const runs = input.runs ?? MACRO_SIMULATION_RUNS;
  const horizon = Math.max(24, months + 12);

  const central = pathFor(sold, months, impact.mode, false, fedThreshold, fedDamping, halfLife, horizon);

  const rng = mulberry32(input.seed ?? MACRO_DEFAULT_SEED);
  const peaks: number[] = [];
  const at12: number[] = [];
  let fedCount = 0;
  for (let i = 0; i < runs; i++) {
    const bp100 = triangular(rng, impact.low, impact.mode, impact.high);
    const fed = coin(rng, fedP);
    // Recovery speed is itself uncertain: ±50 % around the half-life.
    const hl = halfLife * (0.5 + rng());
    const p = pathFor(sold, months, bp100, fed, fedThreshold, fedDamping, hl, horizon);
    let peak = 0;
    for (const pt of p) if (pt.tenYearDeltaBp > peak) peak = pt.tenYearDeltaBp;
    peaks.push(peak);
    at12.push(p[Math.min(11, p.length - 1)].tenYearDeltaBp);
    if (fed && peak > fedThreshold * (1 - fedDamping)) fedCount++;
  }

  const peakCentral = Math.max(...central.map(p => p.tenYearDeltaBp));
  const remaining = holdings - sold;

  return {
    input: { holder: input.holder, fraction, months },
    asOf: TREASURY_HOLDINGS.asOf,
    holdingsUsdBn: round1(holdings),
    soldUsdBn: round1(sold),
    shareOfForeignHoldings: round4(sold / TREASURY_HOLDINGS.totalForeign),
    shareOfMarketable: round4(sold / TREASURY_MARKET.marketableOutstanding),
    centralPath: central,
    peakTenYearDeltaBp: summarise(peaks),
    twelveMonthTenYearDeltaBp: summarise(at12),
    fedResponded: round4(fedCount / runs),
    transmission: transmit(peakCentral, input.holder, sold, remaining),
    assumptions: [
      `Impact per $100 bn sold: triangular ${impact.low}/${impact.mode}/${impact.high} bp [liq.impact.*: Warnock & Warnock 2009; Beltran et al. 2013; Kaminska & Zinna 2020].`,
      `Pace multiplier (12/months)^${A("liq.pace.exponent")}: a one-month dump hits ${paceMultiplier(1).toFixed(2)}× a twelve-month glide [liq.pace.exponent].`,
      `Fed responds with probability ${fedP} once the move exceeds ${fedThreshold} bp, damping it by ${Math.round(fedDamping * 100)} % [liq.fed.*].`,
      `Impact decays with a ${halfLife}-month half-life after selling stops (±50 % per path) [liq.recovery.halfLifeMonths].`,
      `${runs.toLocaleString()} paths, seed ${input.seed ?? MACRO_DEFAULT_SEED}.`,
      `Holdings are TIC Table 5 custodial figures as of ${TREASURY_HOLDINGS.asOf}; China's true exposure via Belgium/Hong Kong is larger.`,
      ...citeAssumptions("liq.impact"),
      ...citeAssumptions("liq.tx"),
    ],
    sourceIds: ["us-tic-mfh", "us-fiscaldata", "fred", "jp-mof-reserves", "cn-safe-reserves"],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FORECAST — how much will they sell over 24 months, and how likely
// ═══════════════════════════════════════════════════════════════════════════

export type LiquidationForecastInput = {
  holder: "JP" | "CN";
  /** Probability (0–1) from the confidence model that the holder enters a stress-selling regime within 24 months. */
  stressProbability: number;
  /** Optional: measured monthly run-rate override, USD bn (negative = selling). */
  runRateOverride?: number;
  runs?: number;
  seed?: number;
  today?: IsoDate;
};

export type LiquidationForecast = {
  holder: "JP" | "CN";
  asOf: IsoDate;
  holdingsUsdBn: number;
  measuredRunRateUsdBnPerMonth: number;
  stressProbability: number;
  /** Cumulative net sales (positive = sold) at each horizon, USD bn. */
  horizons: Array<{ months: number; sold: Summary; soldPctOfHoldings: Summary }>;
  /** Probability cumulative 24-month sales exceed each share of holdings. */
  exceedance: Array<{ share: number; probability: number }>;
  /** What the paths assume. */
  regimes: {
    baseline: string;
    intervention: string;
    stress: string;
  };
  sourceIds: string[];
};

export function forecastLiquidation(input: LiquidationForecastInput): LiquidationForecast {
  const runs = input.runs ?? MACRO_SIMULATION_RUNS;
  const rng = mulberry32(input.seed ?? MACRO_DEFAULT_SEED + 1);
  const holdings = input.holder === "JP" ? TREASURY_HOLDINGS.japan : TREASURY_HOLDINGS.chinaMainland;
  const measured =
    input.runRateOverride ??
    (input.holder === "JP"
      ? (TREASURY_HOLDINGS.japan - TREASURY_HOLDINGS.japanThreeMonthsAgo) / 3
      : (TREASURY_HOLDINGS.chinaMainland - TREASURY_HOLDINGS.chinaThreeMonthsAgo) / 3);
  const stressP = Math.min(1, Math.max(0, input.stressProbability));

  // Regime parameters (USD bn per month, positive = selling). Every number is
  // a row in assumptions.ts (`liq.fc.*`) with the TIC or MOF episode behind it.
  const baselineMean = -measured;
  const baselineSd = A(`liq.fc.baselineSd.${input.holder}`);
  const interventionPPerMonth = input.holder === "JP" ? A("liq.fc.interventionPPerMonth.JP") : 0.0;
  const interventionSale = { low: A("liq.fc.interventionSale.low"), mode: A("liq.fc.interventionSale.mode"), high: A("liq.fc.interventionSale.high") };
  const stressPctPerMonth = { low: A("liq.fc.stressPctPerMonth.low"), mode: A("liq.fc.stressPctPerMonth.mode"), high: A("liq.fc.stressPctPerMonth.high") };
  const stressDuration = { low: A("liq.fc.stressDuration.low"), mode: A("liq.fc.stressDuration.mode"), high: A("liq.fc.stressDuration.high") };

  const horizonsMonths = [6, 12, 18, 24];
  const soldAt: Record<number, number[]> = { 6: [], 12: [], 18: [], 24: [] };

  for (let i = 0; i < runs; i++) {
    const stress = coin(rng, stressP);
    const stressStart = stress ? Math.floor(rng() * 12) + 1 : Infinity;
    const stressLen = stress ? Math.round(triangular(rng, stressDuration.low, stressDuration.mode, stressDuration.high)) : 0;
    const stressRate = stress ? triangular(rng, stressPctPerMonth.low, stressPctPerMonth.mode, stressPctPerMonth.high) : 0;
    let cumulative = 0;
    let remaining = holdings;
    for (let m = 1; m <= 24; m++) {
      let sale = baselineMean + (rng() - 0.5) * 2 * baselineSd;
      if (coin(rng, interventionPPerMonth)) sale += triangular(rng, interventionSale.low, interventionSale.mode, interventionSale.high);
      if (m >= stressStart && m < stressStart + stressLen) sale += remaining * stressRate;
      // Cannot sell more than you hold; can buy back (negative sale) without limit within reason.
      sale = Math.min(sale, remaining);
      cumulative += sale;
      remaining -= sale;
      if (horizonsMonths.includes(m)) soldAt[m].push(cumulative);
    }
  }

  const horizons = horizonsMonths.map(months => ({
    months,
    sold: summarise(soldAt[months]),
    soldPctOfHoldings: summarise(soldAt[months].map(s => (s / holdings) * 100)),
  }));

  const s24 = soldAt[24];
  const exceedance = [0.05, 0.1, 0.25, 0.5, 0.75, 1.0].map(share => ({
    share,
    probability: round4(s24.filter(s => s >= holdings * share).length / runs),
  }));

  return {
    holder: input.holder,
    asOf: input.today ?? TREASURY_HOLDINGS.asOf,
    holdingsUsdBn: holdings,
    measuredRunRateUsdBnPerMonth: round1(measured),
    stressProbability: stressP,
    horizons,
    exceedance,
    regimes: {
      baseline: `Measured 3-month run-rate ${measured >= 0 ? "+" : ""}${measured.toFixed(1)} bn/month (TIC, ${TREASURY_HOLDINGS.asOf}) with ±${baselineSd} bn/month noise [liq.fc.baselineSd.${input.holder}].`,
      intervention:
        input.holder === "JP"
          ? `${Math.round(interventionPPerMonth * 100)} %/month chance of an intervention-funded sale of $${interventionSale.low}–${interventionSale.high} bn [liq.fc.intervention*] (Aug 2026 precedent: ¥${JAPAN_POSITION.interventionYenTn} tn, foreign securities −$${Math.abs(JAPAN_POSITION.foreignSecuritiesChange)} bn).`
          : `No intervention channel: China defends the yuan by fixing and capital controls before it sells Treasuries at scale (SAFE reserves $${CHINA_POSITION.fxReserves.toLocaleString()} bn).`,
      stress: `With probability ${(stressP * 100).toFixed(0)} % a stress regime starts within 12 months and sells ${Math.round(stressPctPerMonth.low * 100)}–${Math.round(stressPctPerMonth.high * 100)} % of the book per month for ${stressDuration.low}–${stressDuration.high} months [liq.fc.stress*] (China Aug 2015–Jan 2017 precedent: −$180 bn from a ~$1.24 tn book, ~1 %/month, TIC).`,
    },
    sourceIds: ["us-tic-mfh", "jp-mof-reserves", "jp-mof-intervention", "cn-safe-reserves", "fed-h41"],
  };
}

function round1(x: number) {
  return Math.round(x * 10) / 10;
}
function round4(x: number) {
  return Math.round(x * 10_000) / 10_000;
}
