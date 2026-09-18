// ============================================================
// STRATEGY PRESETS FOR THE CYCLE SIMULATOR.
//
// The simulator on the hub page takes twelve numbers. Typing twelve numbers is
// how a reader ends up modelling a strategy they are not actually running, so
// this file lets them pick a strategy instead and start from figures that match
// what that strategy's own page says about it.
//
// EVERY PRESET CARRIES ITS `basis`. These are not measurements — nobody has an
// audited loss rate for a whole asset class — they are a reading of the
// targetReturn and netOfLosses text already written on each strategy's page,
// expressed as simulator inputs so the reader can see what those words imply
// before they change them. The page says so, in those words, beside the
// selector. A preset is a starting point that can be argued with, which is the
// only honest form a number like `defaultProbability` can take here.
//
// Where a strategy is genuinely not a cycling strategy — litigation finance and
// life settlements pay once, years later, on a date nobody sets — the preset
// says so and the simulator's premise does not apply. Those carry `cycles:
// false` and the page refuses to pretend otherwise.
// ============================================================

import type { CycleInput } from "./simulator";
import { DEPLOYMENT_STRATEGIES } from "./deployment";

/** The subset of CycleInput a strategy determines. Amount, rate, years and tax stay the reader's. */
export type StrategyPreset = {
  slug: string;
  returnPerCycle: number;
  returnStdDev: number;
  cycleMonths: number;
  idleDays: number;
  defaultProbability: number;
  recoveryRate: number;
  feePerCycle: number;
  positionsPerCycle: number;
  /** False where the strategy does not recycle capital on a schedule at all. */
  cycles: boolean;
  /** Where these numbers come from. Shown on the page, not hidden in a tooltip. */
  basis: string;
};

export const STRATEGY_PRESETS: readonly StrategyPreset[] = [
  {
    slug: "private-mortgage-notes",
    returnPerCycle: 0.055, returnStdDev: 0.012, cycleMonths: 12, idleDays: 30,
    defaultProbability: 0.02, recoveryRate: 0.9, feePerCycle: 0.004, positionsPerCycle: 8, cycles: true,
    basis: "About 11% a year at conservative first-position LTV, taken here as 5.5% per six-month half-turn on a twelve-month note. Default is set low and recovery high because the page's whole argument is that a recorded first lien at 55–65% LTV recovers nearly everything.",
  },
  {
    slug: "hard-money-lending",
    returnPerCycle: 0.08, returnStdDev: 0.025, cycleMonths: 6, idleDays: 45,
    defaultProbability: 0.05, recoveryRate: 0.75, feePerCycle: 0.005, positionsPerCycle: 8, cycles: true,
    basis: "A twelve percent note plus two points, held six months, is roughly 8% for the turn. Idle days are set at 45 rather than 21 because the page says deal flow, not rate, decides this strategy's annual return.",
  },
  {
    slug: "tax-lien-certificates",
    returnPerCycle: 0.07, returnStdDev: 0.03, cycleMonths: 18, idleDays: 60,
    defaultProbability: 0.03, recoveryRate: 0.6, feePerCycle: 0.01, positionsPerCycle: 25, cycles: true,
    basis: "Statutory ceilings of 8–18% bid down at auction, taken here as roughly 7% over an eighteen-month redemption. The loss case is not a borrower default — it is a parcel nobody redeems that is worth less than the taxes, so recovery is set well below the secured-lending presets.",
  },
  {
    slug: "seasoned-performing-notes",
    returnPerCycle: 0.05, returnStdDev: 0.015, cycleMonths: 12, idleDays: 30,
    defaultProbability: 0.03, recoveryRate: 0.85, feePerCycle: 0.005, positionsPerCycle: 12, cycles: true,
    basis: "High single digits yield-to-maturity on discounted performing paper. Note that the simulator cannot model this strategy's most common disappointment, which is prepayment truncating a long yield rather than a default destroying principal.",
  },
  {
    slug: "construction-draw-lending",
    returnPerCycle: 0.075, returnStdDev: 0.03, cycleMonths: 9, idleDays: 45,
    defaultProbability: 0.06, recoveryRate: 0.65, feePerCycle: 0.008, positionsPerCycle: 8, cycles: true,
    basis: "Low double digits plus points over a nine-month build. Recovery is set at 0.65 rather than at the first-lien level because the collateral in a default is a partially finished structure, which is the page's central warning.",
  },
  {
    slug: "invoice-factoring",
    returnPerCycle: 0.035, returnStdDev: 0.01, cycleMonths: 2, idleDays: 7,
    defaultProbability: 0.02, recoveryRate: 0.5, feePerCycle: 0.005, positionsPerCycle: 30, cycles: true,
    basis: "Roughly 2% of face per thirty days on a sixty-day invoice. Short cycles and few idle days are the point — this is the strategy on the page where turnover, not rate, produces the annual number.",
  },
  {
    slug: "purchase-order-and-inventory-finance",
    returnPerCycle: 0.09, returnStdDev: 0.035, cycleMonths: 3, idleDays: 21,
    defaultProbability: 0.06, recoveryRate: 0.4, feePerCycle: 0.01, positionsPerCycle: 12, cycles: true,
    basis: "Three percent per thirty days over a ninety-day transaction. Recovery is set at 0.4 as a blend: fungible goods resell at a discount, custom-manufactured goods approach scrap, and a real book holds both.",
  },
  {
    slug: "small-business-secured-lending",
    returnPerCycle: 0.08, returnStdDev: 0.03, cycleMonths: 12, idleDays: 30,
    defaultProbability: 0.08, recoveryRate: 0.45, feePerCycle: 0.01, positionsPerCycle: 15, cycles: true,
    basis: "Mid-teens annual on direct lending, taken as 8% per twelve-month turn. Recovery at 0.45 reflects the page's point that collateral must be valued at forced-liquidation rather than book.",
  },
  {
    slug: "equipment-leasing",
    returnPerCycle: 0.06, returnStdDev: 0.02, cycleMonths: 36, idleDays: 60,
    defaultProbability: 0.05, recoveryRate: 0.5, feePerCycle: 0.008, positionsPerCycle: 12, cycles: true,
    basis: "High single digits to mid teens over a multi-year lease. The long cycle is the honest part: this is the preset that shows why a three-year term against a revolving line is a different business from a six-month one.",
  },
  {
    slug: "gap-funding-for-flippers",
    returnPerCycle: 0.09, returnStdDev: 0.06, cycleMonths: 5, idleDays: 30,
    defaultProbability: 0.12, recoveryRate: 0.1, feePerCycle: 0.005, positionsPerCycle: 15, cycles: true,
    basis: "Three to five points on a five-month project. Recovery is set at 0.1 because the page's central claim is that the senior lender is paid in full at closing and the gap funder takes what remains, which in a disappointing sale is nothing.",
  },
  {
    slug: "subprime-auto-paper",
    returnPerCycle: 0.09, returnStdDev: 0.03, cycleMonths: 12, idleDays: 14,
    defaultProbability: 0.22, recoveryRate: 0.4, feePerCycle: 0.02, positionsPerCycle: 100, cycles: true,
    basis: "High-teens note rates bought at a discount, against the page's stated reality: frequent defaults and loss severity above half the balance once auction costs are netted. The large position count is not optimism — it is the minimum at which this book behaves statistically rather than randomly.",
  },
  {
    slug: "merchant-cash-advance",
    returnPerCycle: 0.14, returnStdDev: 0.05, cycleMonths: 6, idleDays: 21,
    defaultProbability: 0.18, recoveryRate: 0.1, feePerCycle: 0.02, positionsPerCycle: 20, cycles: true,
    basis: "A 1.40 factor over six months, less the syndication fee stack. Default is high and recovery near zero because there is no collateral to recover — a personal guarantee against a failed business owner is, in the page's words, decoration rather than security.",
  },
  {
    slug: "stablecoin-and-crypto-lending",
    returnPerCycle: 0.05, returnStdDev: 0.04, cycleMonths: 6, idleDays: 7,
    defaultProbability: 0.1, recoveryRate: 0.2, feePerCycle: 0.005, positionsPerCycle: 4, cycles: true,
    basis: "Low-teens annualised on stablecoins. The default probability here is platform insolvency, not borrower default, and the recovery figure is what unsecured creditors of Celsius, Voyager, BlockFi and Genesis actually faced. Position count is low because there are only a handful of venues, which is itself the risk.",
  },
  {
    slug: "litigation-funding",
    returnPerCycle: 1.4, returnStdDev: 1.2, cycleMonths: 42, idleDays: 90,
    defaultProbability: 0.45, recoveryRate: 0, feePerCycle: 0.02, positionsPerCycle: 20, cycles: false,
    basis: "A two-to-four-times multiple on winners against a hit rate near half, over a three-and-a-half-year case. Marked as non-cycling: this pays once, on a date a court sets, with no interim cash flow — so the simulator's premise of recycling capital does not hold, and the figure it produces should be read as a single-turn distribution rather than a plan.",
  },
  {
    slug: "life-settlement-purchases",
    returnPerCycle: 0.9, returnStdDev: 0.7, cycleMonths: 84, idleDays: 30,
    defaultProbability: 0.08, recoveryRate: 0, feePerCycle: 0.03, positionsPerCycle: 25, cycles: false,
    basis: "A portfolio IRR in the low teens over a seven-year average hold, expressed as a single-turn multiple. The default case is a lapsed policy, which is a total loss — hence zero recovery. Marked as non-cycling: mortality does not arrive on a schedule you choose, and no simulator should imply that it does.",
  },
];

export function presetFor(slug: string): StrategyPreset | undefined {
  return STRATEGY_PRESETS.find((p) => p.slug === slug);
}

/** Apply a preset to a cycle input, leaving the reader's amount, rate, years, tax and seed alone. */
export function applyPreset(base: CycleInput, preset: StrategyPreset): CycleInput {
  return {
    ...base,
    returnPerCycle: preset.returnPerCycle,
    returnStdDev: preset.returnStdDev,
    cycleMonths: preset.cycleMonths,
    idleDays: preset.idleDays,
    defaultProbability: preset.defaultProbability,
    recoveryRate: preset.recoveryRate,
    feePerCycle: preset.feePerCycle,
    positionsPerCycle: preset.positionsPerCycle,
  };
}

/** Presets in the same order the strategies are ranked, so the selector reads top to bottom. */
export function presetsRanked(): Array<{ preset: StrategyPreset; title: string; score: number }> {
  return [...DEPLOYMENT_STRATEGIES]
    .sort((a, b) => b.riskRewardScore - a.riskRewardScore)
    .flatMap((s) => {
      const preset = presetFor(s.slug);
      return preset ? [{ preset, title: s.title, score: s.riskRewardScore }] : [];
    });
}
