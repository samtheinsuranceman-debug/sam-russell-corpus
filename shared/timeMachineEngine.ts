/**
 * Time Machine Method — Shared Engine
 *
 * This module provides the core formulaic engine that powers the Time Machine Method
 * across all IUL calculators. It generates two side-by-side illustrations:
 *
 * 1. "Boring" Illustration — Standard AG 49-compliant flat crediting rate
 * 2. Historical Performance Illustration — Uses actual 30-year index crediting histories
 *    from the Index Backtester, with auto-sized account values to match credits dollar-for-dollar
 *
 * CORE FORMULAS:
 *
 * BORING ILLUSTRATION (flat rate R per year):
 *   During funding: AV[y] = (AV[y-1] + Premium) × (1 + R)
 *   After funding:  AV[y] = AV[y-1] × (1 + R)
 *   SurrenderValue[y] = AV[y] × surrenderRatio(y)
 *
 * HISTORICAL ILLUSTRATION (variable credited rates from index backtester):
 *   creditedRate[y] = getCreditedRate(indexOption, startYear + y - 1)
 *   During funding: AV[y] = (AV[y-1] + Premium) × (1 + creditedRate[y] / 100)
 *   After funding:  AV[y] = AV[y-1] × (1 + creditedRate[y] / 100)
 *
 * TIME MACHINE AUTO-SIZING:
 *   For each year Y, the "effective return on premium" is:
 *     effectiveReturn[y] = (AV[y] × creditedRate[y]) / totalPremiumsPaid × 100
 *   The Time Machine shows what account value would be needed so that
 *   a single year's credit equals X% of the original premium.
 *
 * LOAN ARBITRAGE:
 *   Stated loan rate: 5.0% (what carriers quote)
 *   Positive arbitrage: +0.5% (interest crediting on borrowed cash value)
 *   Overstated cost = loanBalance × (statedRate - actualSpread)
 *   Real cost = loanBalance × actualSpread
 */

import {
  RAW_INDEX_RETURNS,
  ALL_INDEX_OPTIONS,
  CARRIERS,
  getCreditedRate,
  getCreditingHistory,
  type IndexOption,
} from "./indexCreditingData";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PremiumSchedule {
  annualPremium: number;
  fundingYears: number;
}

export interface TimeMachineInputs {
  premiumSchedule: PremiumSchedule;
  currentAge: number;
  projectionYears: number; // total years to project (e.g., 30)
  boringRate: number; // flat AG49 rate as decimal (e.g., 0.06 for 6%)
  /** Up to 3 index option IDs from the backtester */
  selectedIndexOptions: string[];
  /** Historical start year for the index crediting (e.g., 1994) */
  historicalStartYear: number;
  /** Loan parameters */
  statedLoanRate: number; // e.g., 0.05
  actualArbitrageSpread: number; // e.g., 0.005
  /** Optional: year to start taking loans */
  loanStartYear?: number;
  /** Optional: annual loan amount */
  annualLoanAmount?: number;
}

export interface IllustrationYear {
  year: number;
  age: number;
  calendarYear: number;
  premiumPaid: number;
  cumulativePremiums: number;
  /** Crediting rate applied this year (decimal) */
  creditingRate: number;
  /** Dollar amount of interest credit */
  interestCredit: number;
  /** Beginning of year account value (after premium, before credit) */
  beginningValue: number;
  /** End of year account value */
  accountValue: number;
  /** Surrender value (account value × surrender ratio) */
  surrenderValue: number;
  /** Effective return: interestCredit / totalPremiums × 100 */
  effectiveReturnOnPremium: number;
  /** Loan taken this year */
  loanTaken: number;
  /** Cumulative loan balance */
  loanBalance: number;
  /** Loan interest at stated rate */
  statedLoanInterest: number;
  /** Loan interest at actual arbitrage spread */
  actualLoanInterest: number;
  /** Net cash value after loans */
  netCashValue: number;
}

export interface DualIllustrationResult {
  boring: IllustrationYear[];
  historical: IllustrationYear[];
  /** Per-index historical breakdowns when multiple indices selected */
  indexBreakdowns: Array<{
    optionId: string;
    optionName: string;
    carrier: string;
    years: IllustrationYear[];
  }>;
  /** Summary stats */
  summary: {
    totalPremiums: number;
    boringFinalAV: number;
    boringFinalSV: number;
    boringAvgRate: number;
    historicalFinalAV: number;
    historicalFinalSV: number;
    historicalAvgRate: number;
    historicalFloorProtectedYears: number;
    historicalCapLimitedYears: number;
    /** Dollar difference */
    avDifference: number;
    /** Percentage difference */
    avDifferencePct: number;
    /** Loan arbitrage summary */
    totalStatedLoanCost: number;
    totalActualLoanCost: number;
    loanCostOverstatement: number;
  };
  /** Benchmark milestones: years to reach 28%, 50%, 80% effective return */
  benchmarks: {
    boring: BenchmarkMilestone[];
    historical: BenchmarkMilestone[];
  };
  inputs: TimeMachineInputs;
}

export interface BenchmarkMilestone {
  targetPct: number;
  yearReached: number | null;
  ageReached: number | null;
  accountValueAtTarget: number;
  interestCreditAtTarget: number;
}

// ─── Surrender Value Schedule ───────────────────────────────────────────────
// Simplified surrender charge schedule — decreasing over 15 years
function getSurrenderRatio(policyYear: number): number {
  if (policyYear <= 0) return 0;
  // Typical IUL surrender charge schedule
  const schedule: Record<number, number> = {
    1: 0.50, 2: 0.55, 3: 0.60, 4: 0.65, 5: 0.70,
    6: 0.75, 7: 0.80, 8: 0.85, 9: 0.90, 10: 0.92,
    11: 0.94, 12: 0.96, 13: 0.98, 14: 0.99, 15: 1.00,
  };
  return schedule[policyYear] ?? 1.0;
}

// ─── Core Illustration Engine ───────────────────────────────────────────────

function runSingleIllustration(
  premiumSchedule: PremiumSchedule,
  currentAge: number,
  projectionYears: number,
  getRateForYear: (policyYear: number) => number,
  statedLoanRate: number,
  actualArbitrageSpread: number,
  loanStartYear?: number,
  annualLoanAmount?: number,
): IllustrationYear[] {
  const { annualPremium, fundingYears } = premiumSchedule;
  const totalPremiums = annualPremium * fundingYears;
  const rows: IllustrationYear[] = [];
  let accountValue = 0;
  let cumulativePremiums = 0;
  let loanBalance = 0;

  for (let y = 1; y <= projectionYears; y++) {
    const premium = y <= fundingYears ? annualPremium : 0;
    cumulativePremiums += premium;

    const beginningValue = accountValue + premium;
    const rate = getRateForYear(y);
    const interestCredit = beginningValue * rate;
    const endingValue = beginningValue + interestCredit;

    // Loans
    let loanTaken = 0;
    if (loanStartYear && annualLoanAmount && y >= loanStartYear) {
      loanTaken = annualLoanAmount;
    }

    // Loan interest compounds
    const statedInterest = loanBalance * statedLoanRate;
    const actualInterest = loanBalance * actualArbitrageSpread;
    loanBalance = loanBalance + loanTaken + actualInterest; // actual cost

    const surrenderRatio = getSurrenderRatio(y);
    const surrenderValue = endingValue * surrenderRatio;
    const netCashValue = Math.max(0, surrenderValue - loanBalance);

    const effectiveReturn = totalPremiums > 0
      ? (interestCredit / totalPremiums) * 100
      : 0;

    rows.push({
      year: y,
      age: currentAge + y,
      calendarYear: new Date().getFullYear() + y,
      premiumPaid: premium,
      cumulativePremiums,
      creditingRate: rate,
      interestCredit,
      beginningValue,
      accountValue: endingValue,
      surrenderValue,
      effectiveReturnOnPremium: effectiveReturn,
      loanTaken,
      loanBalance,
      statedLoanInterest: statedInterest,
      actualLoanInterest: actualInterest,
      netCashValue,
    });

    accountValue = endingValue;
  }

  return rows;
}

// ─── Blended Historical Rate Calculator ─────────────────────────────────────
// When multiple index options are selected, blend their credited rates equally

function getBlendedHistoricalRate(
  options: IndexOption[],
  calendarYear: number,
): number {
  if (options.length === 0) return 0;
  let total = 0;
  for (const opt of options) {
    total += getCreditedRate(opt, calendarYear);
  }
  return (total / options.length) / 100; // convert from % to decimal
}

// ─── Benchmark Calculator ───────────────────────────────────────────────────

function findBenchmarks(
  rows: IllustrationYear[],
  targets: number[],
): BenchmarkMilestone[] {
  return targets.map(target => {
    const row = rows.find(r => r.effectiveReturnOnPremium >= target);
    return {
      targetPct: target,
      yearReached: row?.year ?? null,
      ageReached: row?.age ?? null,
      accountValueAtTarget: row?.accountValue ?? 0,
      interestCreditAtTarget: row?.interestCredit ?? 0,
    };
  });
}

// ─── Main Dual Illustration Generator ───────────────────────────────────────

export function generateDualIllustration(inputs: TimeMachineInputs): DualIllustrationResult {
  const {
    premiumSchedule,
    currentAge,
    projectionYears,
    boringRate,
    selectedIndexOptions,
    historicalStartYear,
    statedLoanRate,
    actualArbitrageSpread,
    loanStartYear,
    annualLoanAmount,
  } = inputs;

  const totalPremiums = premiumSchedule.annualPremium * premiumSchedule.fundingYears;

  // ── Boring Illustration ──
  const boring = runSingleIllustration(
    premiumSchedule,
    currentAge,
    projectionYears,
    () => boringRate,
    statedLoanRate,
    actualArbitrageSpread,
    loanStartYear,
    annualLoanAmount,
  );

  // ── Resolve selected index options ──
  const resolvedOptions = selectedIndexOptions
    .map(id => ALL_INDEX_OPTIONS.find(o => o.id === id))
    .filter((o): o is IndexOption => o !== undefined);

  // ── Historical Illustration (blended if multiple) ──
  const historical = runSingleIllustration(
    premiumSchedule,
    currentAge,
    projectionYears,
    (policyYear: number) => {
      const calYear = historicalStartYear + policyYear - 1;
      if (calYear > 2025) {
        // Beyond available data — use the average of available years
        const allRates: number[] = [];
        for (let yr = historicalStartYear; yr <= Math.min(historicalStartYear + policyYear - 2, 2025); yr++) {
          allRates.push(getBlendedHistoricalRate(resolvedOptions, yr));
        }
        return allRates.length > 0
          ? allRates.reduce((s, r) => s + r, 0) / allRates.length
          : boringRate;
      }
      return getBlendedHistoricalRate(resolvedOptions, calYear);
    },
    statedLoanRate,
    actualArbitrageSpread,
    loanStartYear,
    annualLoanAmount,
  );

  // ── Per-index breakdowns ──
  const indexBreakdowns = resolvedOptions.map(opt => ({
    optionId: opt.id,
    optionName: opt.name,
    carrier: opt.carrier,
    years: runSingleIllustration(
      premiumSchedule,
      currentAge,
      projectionYears,
      (policyYear: number) => {
        const calYear = historicalStartYear + policyYear - 1;
        if (calYear > 2025) {
          const history = getCreditingHistory(opt, historicalStartYear, 2025);
          const avg = history.reduce((s, h) => s + h.creditedRate, 0) / history.length;
          return avg / 100;
        }
        return getCreditedRate(opt, calYear) / 100;
      },
      statedLoanRate,
      actualArbitrageSpread,
      loanStartYear,
      annualLoanAmount,
    ),
  }));

  // ── Summary stats ──
  const boringLast = boring[boring.length - 1];
  const histLast = historical[historical.length - 1];

  const boringAvgRate = boring.reduce((s, r) => s + r.creditingRate, 0) / boring.length;
  const histAvgRate = historical.reduce((s, r) => s + r.creditingRate, 0) / historical.length;

  let histFloorYears = 0;
  let histCapYears = 0;
  for (const row of historical) {
    if (row.creditingRate === 0) histFloorYears++;
    // Cap detection is approximate
    if (resolvedOptions.length > 0) {
      const maxCap = Math.max(...resolvedOptions.map(o => o.cap ?? 999));
      if (maxCap < 999 && row.creditingRate * 100 >= maxCap - 0.5) histCapYears++;
    }
  }

  const totalStatedCost = boring.reduce((s, r) => s + r.statedLoanInterest, 0);
  const totalActualCost = boring.reduce((s, r) => s + r.actualLoanInterest, 0);

  const summary = {
    totalPremiums,
    boringFinalAV: boringLast?.accountValue ?? 0,
    boringFinalSV: boringLast?.surrenderValue ?? 0,
    boringAvgRate: boringAvgRate * 100,
    historicalFinalAV: histLast?.accountValue ?? 0,
    historicalFinalSV: histLast?.surrenderValue ?? 0,
    historicalAvgRate: histAvgRate * 100,
    historicalFloorProtectedYears: histFloorYears,
    historicalCapLimitedYears: histCapYears,
    avDifference: (histLast?.accountValue ?? 0) - (boringLast?.accountValue ?? 0),
    avDifferencePct: boringLast?.accountValue
      ? (((histLast?.accountValue ?? 0) - boringLast.accountValue) / boringLast.accountValue) * 100
      : 0,
    totalStatedLoanCost: totalStatedCost,
    totalActualLoanCost: totalActualCost,
    loanCostOverstatement: totalStatedCost - totalActualCost,
  };

  const targets = [28, 50, 80];

  return {
    boring,
    historical,
    indexBreakdowns,
    summary,
    benchmarks: {
      boring: findBenchmarks(boring, targets),
      historical: findBenchmarks(historical, targets),
    },
    inputs,
  };
}

// ─── Exports for use in other calculators ───────────────────────────────────

export { ALL_INDEX_OPTIONS, CARRIERS, RAW_INDEX_RETURNS, getCreditingHistory, getCreditedRate };
export type { IndexOption };

/**
 * Quick helper: get a list of "popular" index options for the selector UI.
 * Returns one representative option per carrier per index type.
 */
export function getPopularIndexOptions(): Array<{ id: string; label: string; carrier: string; description: string }> {
  const popular = [
    "am-sp500-ptp", "am-sp500-uncapped", "am-multi-index",
    "apm-sp500-capped", "apm-hindsight", "apm-sp500-multiplier",
    "amm-sp500-core", "amm-nasdaq-ccar", "amm-dynamic-bonus",
  ];
  return popular
    .map(id => {
      const opt = ALL_INDEX_OPTIONS.find(o => o.id === id);
      if (!opt) return null;
      const carrierName = CARRIERS.find(c => c.id === opt.carrier)?.name ?? opt.carrier;
      return {
        id: opt.id,
        label: `${carrierName}: ${opt.name}`,
        carrier: opt.carrier,
        description: opt.description,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/**
 * Simplified Time Machine toggle for existing calculators.
 * Takes an existing flat-rate projection and overlays historical performance.
 *
 * @param flatRateRows - The existing "boring" projection rows from the calculator
 * @param indexOptionIds - Selected index option IDs (1-3)
 * @param historicalStartYear - Start year for historical data
 * @param premiumSchedule - Premium schedule
 * @param currentAge - Client's current age
 * @returns Historical overlay rows matching the same year structure
 */
export function generateTimeMachineOverlay(
  indexOptionIds: string[],
  historicalStartYear: number,
  premiumSchedule: PremiumSchedule,
  currentAge: number,
  projectionYears: number,
  statedLoanRate = 0.05,
  actualArbitrageSpread = 0.005,
  loanStartYear?: number,
  annualLoanAmount?: number,
): IllustrationYear[] {
  const resolvedOptions = indexOptionIds
    .map(id => ALL_INDEX_OPTIONS.find(o => o.id === id))
    .filter((o): o is IndexOption => o !== undefined);

  return runSingleIllustration(
    premiumSchedule,
    currentAge,
    projectionYears,
    (policyYear: number) => {
      const calYear = historicalStartYear + policyYear - 1;
      if (calYear > 2025) {
        const allRates: number[] = [];
        for (let yr = historicalStartYear; yr <= Math.min(historicalStartYear + policyYear - 2, 2025); yr++) {
          allRates.push(getBlendedHistoricalRate(resolvedOptions, yr));
        }
        return allRates.length > 0
          ? allRates.reduce((s, r) => s + r, 0) / allRates.length
          : 0.06;
      }
      return getBlendedHistoricalRate(resolvedOptions, calYear);
    },
    statedLoanRate,
    actualArbitrageSpread,
    loanStartYear,
    annualLoanAmount,
  );
}
