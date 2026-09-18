// ─── Real Estate Stress Engine ──────────────────────────────────────────────
// Three complementary views of downside on a modelled capital stack:
//
//   1. SCENARIOS — named, deterministic shocks an investment committee argues
//      about ("rates +300bp, caps +100bp, NOI -15%").
//   2. BREAK-EVENS — the inverse question, solved rather than guessed: how far
//      can NOI fall before the DSCR covenant trips? How much cap rate
//      expansion wipes the equity out?
//   3. MONTE CARLO — the distribution, with rate, cap rate and NOI growth
//      drawn as CORRELATED variables, because they are. Sampling them
//      independently is the single most common way a stress model lies:
//      it makes the joint tail (rates up, caps out, growth gone) look far
//      less likely than it is.
//
// Rate shocks apply to FLOATING tranches only. Fixed-rate debt genuinely is
// insulated from a rate move — right up until it matures, at which point the
// exposure is refinance risk, surfaced separately via `refinanceRequired`.

import { analyzeCapitalStack } from "./realEstateDealModel";
import type {
  BreakEvenPoints,
  CapitalStackInput,
  MonteCarloSummary,
  ScenarioOutcome,
  StressResult,
  StressScenario,
} from "./realEstateCapitalTypes";

/* ═══ Deterministic RNG (matches the platform's monteCarloEngine) ══════════ */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller standard normal. */
function normalRandom(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ═══ Scenario application ═════════════════════════════════════════════════ */

/** Pure: returns a new input with the scenario's shocks applied. */
export function applyScenario(
  input: CapitalStackInput,
  scenario: StressScenario,
): CapitalStackInput {
  const p = input.property;

  const noiShock = 1 + (scenario.noiShockPct ?? 0);
  const capShift = (scenario.exitCapShiftBps ?? 0) / 10_000;
  const rateShift = (scenario.rateShiftBps ?? 0) / 10_000;

  return {
    ...input,
    property: {
      ...p,
      year1NOI: p.year1NOI * noiShock,
      noiGrowthRate: p.noiGrowthRate + (scenario.noiGrowthShift ?? 0),
      // Cap rates cannot go to or below zero — value would be infinite.
      exitCapRate: Math.max(0.005, p.exitCapRate + capShift),
      capexReservePctOfNOI:
        p.capexReservePctOfNOI * (scenario.capexReserveMultiplier ?? 1),
      holdYears: p.holdYears + (scenario.holdExtensionYears ?? 0),
    },
    debt: input.debt.map((d) =>
      d.rateType === "floating" ? { ...d, rate: Math.max(0, d.rate + rateShift) } : d,
    ),
  };
}

/** The standard stress library an IC will ask for. */
export const DEFAULT_STRESS_SCENARIOS: StressScenario[] = [
  {
    id: "mild_recession",
    label: "Mild recession — NOI −10%, caps +50bp",
    noiShockPct: -0.1,
    exitCapShiftBps: 50,
  },
  {
    id: "severe_recession",
    label: "Severe recession — NOI −25%, caps +150bp, growth stalls",
    noiShockPct: -0.25,
    noiGrowthShift: -0.03,
    exitCapShiftBps: 150,
  },
  {
    id: "rate_shock",
    label: "Rate shock — +300bp on floating debt",
    rateShiftBps: 300,
  },
  {
    id: "stagflation",
    label: "Stagflation — rates +250bp, caps +125bp, NOI growth −2%",
    rateShiftBps: 250,
    exitCapShiftBps: 125,
    noiGrowthShift: -0.02,
    capexReserveMultiplier: 1.5,
  },
  {
    id: "blocked_exit",
    label: "Blocked exit — hold extended 3 years, caps +75bp",
    holdExtensionYears: 3,
    exitCapShiftBps: 75,
  },
  {
    id: "cap_reversion",
    label: "Cap rate reversion — exit caps +200bp",
    exitCapShiftBps: 200,
  },
];

/* ═══ Scenario evaluation ══════════════════════════════════════════════════ */

function evaluate(input: CapitalStackInput) {
  const r = analyzeCapitalStack(input);
  return {
    leveredIrr: r.returns.leveredIrr,
    equityMultiple: r.returns.equityMultiple,
    minDscr: r.returns.minDscr,
    maxLtv: r.returns.maxLtv,
    lpIrr: r.waterfall.lpIrr,
    covenantBreached: r.covenantBreachYears.length > 0,
    equityWipedOut: r.exit.netProceedsToCommon <= 0,
    // Asset worth less than the debt against it.
    underwater:
      r.exit.grossSalePrice - r.exit.saleCosts < r.exit.debtPayoff,
  };
}

export function runScenarios(
  input: CapitalStackInput,
  scenarios: StressScenario[] = DEFAULT_STRESS_SCENARIOS,
): ScenarioOutcome[] {
  const base = evaluate(input);
  return scenarios.map((scenario) => {
    const out = evaluate(applyScenario(input, scenario));
    return {
      scenario,
      leveredIrr: out.leveredIrr,
      equityMultiple: out.equityMultiple,
      minDscr: out.minDscr,
      maxLtv: out.maxLtv,
      lpIrr: out.lpIrr,
      irrDelta: out.leveredIrr - base.leveredIrr,
      covenantBreached: out.covenantBreached,
      equityWipedOut: out.equityWipedOut,
      underwater: out.underwater,
    };
  });
}

/* ═══ Break-even solving ═══════════════════════════════════════════════════ */

/**
 * Smallest x in [lo, hi] where `predicate` first becomes true, assuming the
 * predicate is monotonic in x. Returns null when it never trips inside bounds.
 */
function bisectThreshold(
  lo: number,
  hi: number,
  predicate: (x: number) => boolean,
  iterations = 60,
): number | null {
  if (predicate(lo)) return lo;
  if (!predicate(hi)) return null;
  let low = lo;
  let high = hi;
  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2;
    if (predicate(mid)) high = mid;
    else low = mid;
  }
  return high;
}

export function findBreakEvens(input: CapitalStackInput): BreakEvenPoints {
  const covenant = Math.max(
    0,
    ...input.debt.map((d) => d.dscrCovenant ?? 0),
  );

  const dscrAfterNoiDecline = (decline: number) =>
    evaluate(applyScenario(input, { id: "be", label: "be", noiShockPct: -decline })).minDscr;

  const noiDeclineToBreachDscr =
    covenant > 0
      ? bisectThreshold(0, 0.95, (d) => dscrAfterNoiDecline(d) < covenant)
      : null;

  const noiDeclineToNegativeCashFlow = bisectThreshold(
    0,
    0.95,
    (d) => dscrAfterNoiDecline(d) < 1,
  );

  const multipleAfterCapExpansion = (bps: number) =>
    evaluate(applyScenario(input, { id: "be", label: "be", exitCapShiftBps: bps }))
      .equityMultiple;

  const capExpansionToZeroProfit = bisectThreshold(
    0,
    2000,
    (bps) => multipleAfterCapExpansion(bps) <= 1,
  );

  const capExpansionToWipeout = bisectThreshold(
    0,
    2000,
    (bps) =>
      evaluate(applyScenario(input, { id: "be", label: "be", exitCapShiftBps: bps }))
        .equityWipedOut,
  );

  const hasFloating = input.debt.some((d) => d.rateType === "floating");
  const rateShockToBreachDscr =
    covenant > 0 && hasFloating
      ? bisectThreshold(
          0,
          2000,
          (bps) =>
            evaluate(applyScenario(input, { id: "be", label: "be", rateShiftBps: bps }))
              .minDscr < covenant,
        )
      : null;

  return {
    noiDeclineToBreachDscr,
    noiDeclineToNegativeCashFlow,
    capExpansionToZeroProfit,
    capExpansionToWipeout,
    rateShockToBreachDscr,
  };
}

/* ═══ Monte Carlo ══════════════════════════════════════════════════════════ */

export interface MonteCarloConfig {
  runs: number;
  /** Standard deviation of the parallel rate shock, in basis points. */
  rateVolBps: number;
  /** Standard deviation of exit cap rate movement, in basis points. */
  capVolBps: number;
  /** Standard deviation of the NOI growth shift, in absolute rate terms. */
  growthVol: number;
  /** Correlation between rate moves and cap rate moves. Caps follow rates. */
  rateCapCorrelation: number;
  /** Correlation between rate moves and NOI growth. Applied NEGATIVELY:
   *  rate spikes accompany weaker growth. */
  rateGrowthCorrelation: number;
  seed: number;
}

export const DEFAULT_MC_CONFIG: MonteCarloConfig = {
  runs: 2000,
  rateVolBps: 150,
  capVolBps: 75,
  growthVol: 0.015,
  rateCapCorrelation: 0.6,
  rateGrowthCorrelation: 0.35,
  seed: 42,
};

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
};

export function runMonteCarlo(
  input: CapitalStackInput,
  config: Partial<MonteCarloConfig> = {},
): MonteCarloSummary {
  const cfg = { ...DEFAULT_MC_CONFIG, ...config };
  const rng = mulberry32(cfg.seed);

  const irrs: number[] = [];
  let breaches = 0;
  let wipeouts = 0;

  const rhoCap = Math.max(-1, Math.min(1, cfg.rateCapCorrelation));
  const rhoGrowth = Math.max(-1, Math.min(1, cfg.rateGrowthCorrelation));

  for (let i = 0; i < cfg.runs; i++) {
    const n1 = normalRandom(rng);
    const n2 = normalRandom(rng);
    const n3 = normalRandom(rng);

    // Cholesky on the rate factor: caps track rates, growth leans against them.
    const rateZ = n1;
    const capZ = rhoCap * n1 + Math.sqrt(1 - rhoCap * rhoCap) * n2;
    const growthZ = -rhoGrowth * n1 + Math.sqrt(1 - rhoGrowth * rhoGrowth) * n3;

    const scenario: StressScenario = {
      id: `mc_${i}`,
      label: "monte carlo draw",
      rateShiftBps: rateZ * cfg.rateVolBps,
      exitCapShiftBps: capZ * cfg.capVolBps,
      noiGrowthShift: growthZ * cfg.growthVol,
    };

    const out = evaluate(applyScenario(input, scenario));
    if (Number.isFinite(out.leveredIrr)) irrs.push(out.leveredIrr);
    if (out.covenantBreached) breaches++;
    if (out.equityWipedOut) wipeouts++;
  }

  const sorted = [...irrs].sort((a, b) => a - b);
  const tailCount = Math.max(1, Math.floor(sorted.length * 0.05));
  const conditionalTailIrr =
    sorted.slice(0, tailCount).reduce((s, x) => s + x, 0) / tailCount;

  return {
    runs: cfg.runs,
    p5: percentile(sorted, 0.05),
    p25: percentile(sorted, 0.25),
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p95: percentile(sorted, 0.95),
    mean: sorted.reduce((s, x) => s + x, 0) / (sorted.length || 1),
    probabilityOfLoss: sorted.filter((x) => x < 0).length / (sorted.length || 1),
    probabilityOfCovenantBreach: breaches / cfg.runs,
    probabilityOfEquityWipeout: wipeouts / cfg.runs,
    conditionalTailIrr,
  };
}

/* ═══ Full stress run ══════════════════════════════════════════════════════ */

export function runStressTest(
  input: CapitalStackInput,
  options: {
    scenarios?: StressScenario[];
    monteCarlo?: Partial<MonteCarloConfig> | false;
  } = {},
): StressResult {
  const base = evaluate(input);

  return {
    base: {
      leveredIrr: base.leveredIrr,
      equityMultiple: base.equityMultiple,
      minDscr: base.minDscr,
      maxLtv: base.maxLtv,
      lpIrr: base.lpIrr,
    },
    scenarios: runScenarios(input, options.scenarios ?? DEFAULT_STRESS_SCENARIOS),
    breakEven: findBreakEvens(input),
    monteCarlo:
      options.monteCarlo === false
        ? null
        : runMonteCarlo(input, options.monteCarlo ?? {}),
  };
}
