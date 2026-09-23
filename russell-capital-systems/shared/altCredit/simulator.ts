// ============================================================
// THE CYCLE SIMULATOR — borrow on a line, deploy it, do it again.
//
// The question this answers is the one the whole tab is really about: if I
// draw on a line of credit at X% and lend it out at Y% for N months, then do
// that again, what do I actually end up with — and how often does it go wrong?
//
// WHY A SIMULATION AND NOT A SPREADSHEET. A spreadsheet answers with one
// number, which is always the average case, which is the one outcome you are
// least likely to get. The interesting questions here are distributional: how
// often do I lose money, what does the bad decade look like, how much does one
// default cost when the borrowing cost keeps running regardless. Ten thousand
// runs answer those; a single cell does not.
//
// THE TERM MISMATCH IS THE WHOLE POINT. The line accrues interest every day of
// the year. A merchant advance repays over six months. A bridge loan repays
// over nine. So capital sits idle between deployments unless you redeploy
// instantly, and the borrowing cost does not pause while it does. That gap —
// modelled here as `idleDays` — is the thing most back-of-envelope versions of
// this plan leave out, and it is frequently the difference between a good
// spread and no spread at all.
// ============================================================

export type CycleInput = {
  /** Amount drawn on the line at the start. */
  principal: number;
  /** Annual cost of the borrowed money, as a decimal. Accrues every day. */
  borrowAnnualRate: number;
  /** Total years to run the simulation. */
  years: number;

  /** Gross return on one completed deployment, as a decimal of the amount deployed. */
  returnPerCycle: number;
  /** Standard deviation of that return, so good and bad cycles differ. */
  returnStdDev: number;
  /** Months one deployment takes to come back. */
  cycleMonths: number;
  /** Days of dead time between one repayment and the next deployment. */
  idleDays: number;

  /** Probability that any given deployment defaults. */
  defaultProbability: number;
  /** Fraction of principal recovered on a default, after costs and time. */
  recoveryRate: number;

  /** Fees taken off each deployment before you see it (syndication, servicing). */
  feePerCycle: number;
  /** Ordinary income tax rate applied to net profit each year. Set 0 to see pre-tax. */
  taxRate: number;

  /**
   * How many separate borrowers the capital is split across in each cycle.
   *
   * This is the most consequential input on the page and the one most often
   * left at one. With a single position, one default destroys the whole
   * deployment and the run rarely recovers. With twenty, a default costs five
   * percent of that cycle. The default RATE is unchanged either way — what
   * changes is whether a default is an event or a catastrophe.
   */
  positionsPerCycle: number;

  runs: number;
  /** Fixed seed so the same inputs give the same answer every time. */
  seed: number;
};

export type CycleResult = {
  /** Final equity — what is left after repaying the line — per run, sorted. */
  finalEquity: number[];
  median: number;
  mean: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  worst: number;
  best: number;
  /** Share of runs that ended with less than the principal drawn. */
  probabilityOfLoss: number;
  /** Share of runs that ended below zero — the line is not repaid. */
  probabilityOfRuin: number;
  /** Cycles completed per run. */
  cyclesPerRun: number;
  /** Total borrowing cost over the period, which does not vary by run. */
  totalBorrowCost: number;
  /** Effective annualised return on the drawn principal, at the median. */
  medianAnnualised: number;
  /** The reading a person should take away. */
  verdict: string;
};

/** Deterministic PRNG (mulberry32) so a given seed always reproduces. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller, so returns are normally distributed rather than uniform. */
function normal(next: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = next();
  while (v === 0) v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? sorted[lo]! : sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (i - lo);
}

// Where DEFAULT_CYCLE's numbers come from. Only the tax rate is a published
// figure. The rest describe a hypothetical lending plan and are declared as the
// firm's choices, with the published benchmarks a reader should hold them against.

/** taxRate 0.37. */
const TOP_BRACKET_SOURCE = {
  label: "IRS Rev. Proc. 2025-32, section 4.01, 2026 tax rate tables: top marginal ordinary income rate 37%",
  url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf",
  asOf: "tax year 2026; read 2026-09-23",
};

/** Benchmark for borrowAnnualRate: the base rate most business lines float over. */
const PRIME_RATE_SOURCE = {
  label: "Board of Governors of the Federal Reserve System, H.15 Selected Interest Rates, Bank Prime Loan Rate (DPRIME), via FRED: 6.75% on 2026-09-02",
  url: "https://fred.stlouisfed.org/series/DPRIME",
  asOf: "read 2026-09-23",
};

/** Benchmark for borrowAnnualRate if the line is a credit card. */
const CARD_RATE_SOURCE = {
  label:
    "Board of Governors of the Federal Reserve System, G.19 Consumer Credit, Commercial Bank Interest Rate on Credit Card Plans, All Accounts (TERMCBCCALLNS), via FRED: 20.94% for May 2026",
  url: "https://fred.stlouisfed.org/series/TERMCBCCALLNS",
  asOf: "read 2026-09-23",
  note: "A plan funded on credit cards at this rate, rather than on a line near prime, needs a far higher return than DEFAULT_CYCLE assumes.",
};

/** 30.4375 days per month in the cycle-length arithmetic. */
const MONTH_LENGTH_NOTE = {
  label: "Arithmetic: 30.4375 days per month is 365.25 days divided by 12; a 365-day year is used for the run length",
};

/** Everything else in DEFAULT_CYCLE: the firm's choices, said in words. */
const CYCLE_ASSUMPTIONS = [
  { label: "Assumption: amount drawn = $250,000 over 5 years, chosen by the firm as a representative line size and horizon for the example; no external source" },
  { label: "Assumption: borrowing cost = 9.5% a year, chosen by the firm as a secured line priced above the prime rate; the lender's quote governs; no external source" },
  { label: "Assumption: gross return per deployment = 14% with a 5% standard deviation, chosen by the firm as an illustrative merchant-advance or bridge-loan yield; no external source" },
  { label: "Assumption: deployment length = 6 months with 21 idle days between deployments, chosen by the firm to show the cost of the term mismatch; no external source" },
  { label: "Assumption: default probability = 6% per deployment with 15% recovery, chosen by the firm as a cautious figure for unsecured small-business advances; no external source" },
  { label: "Assumption: fees = 2% per deployment and 10 positions per cycle, chosen by the firm as a syndication cost and a modest level of diversification; no external source" },
  { label: "Assumption: verdict bands at 50%, 25% and 10% chance of loss, chosen by the firm as the points where the wording should change; no external source" },
] as const;

export const DEFAULT_CYCLE: CycleInput = {
  principal: 250_000,
  borrowAnnualRate: 0.095,
  years: 5,
  returnPerCycle: 0.14,
  returnStdDev: 0.05,
  cycleMonths: 6,
  idleDays: 21,
  defaultProbability: 0.06,
  recoveryRate: 0.15,
  feePerCycle: 0.02,
  taxRate: 0.37,
  positionsPerCycle: 10,
  runs: 10_000,
  seed: 20260917,
};

export function simulateCycles(input: CycleInput): CycleResult {
  const next = rng(input.seed);
  const cycleDays = input.cycleMonths * 30.4375 + input.idleDays;
  const cyclesPerRun = Math.max(1, Math.floor((input.years * 365) / cycleDays));

  // The line accrues for the whole period regardless of what the capital is
  // doing. This is the term mismatch, and it is why idle time is expensive.
  const totalBorrowCost = input.principal * input.borrowAnnualRate * input.years;

  const finals: number[] = [];
  for (let r = 0; r < input.runs; r++) {
    let capital = input.principal;
    for (let c = 0; c < cyclesPerRun; c++) {
      const deployed = capital;
      if (deployed <= 0) break;

      // The capital is split across N independent positions. Each one either
      // defaults or performs. This is what turns a default from a catastrophe
      // into a cost, and it is the whole argument for diversification.
      const positions = Math.max(1, Math.round(input.positionsPerCycle));
      const each = deployed / positions;
      let returned = 0;
      for (let i = 0; i < positions; i++) {
        if (next() < input.defaultProbability) {
          returned += each * input.recoveryRate;
          continue;
        }
        const gross = input.returnPerCycle + normal(next) * input.returnStdDev;
        const net = Math.max(-1, gross - input.feePerCycle);
        returned += each * (1 + net);
      }
      capital = returned;
    }
    // Tax falls on profit only, and only if there is any.
    const profitBeforeTax = capital - input.principal - totalBorrowCost;
    const tax = profitBeforeTax > 0 ? profitBeforeTax * input.taxRate : 0;
    finals.push(input.principal + profitBeforeTax - tax);
  }

  finals.sort((a, b) => a - b);
  const mean = finals.reduce((s, x) => s + x, 0) / finals.length;
  const median = quantile(finals, 0.5);
  const lossRuns = finals.filter((x) => x < input.principal).length;
  const ruinRuns = finals.filter((x) => x < 0).length;
  const medianAnnualised = input.principal > 0 && median > 0
    ? Math.pow(median / input.principal, 1 / input.years) - 1
    : -1;

  const pLoss = lossRuns / finals.length;
  const verdict =
    pLoss >= 0.5
      ? `More than half of the ten thousand runs ended with less than the ${fmt(input.principal)} drawn. The spread does not cover the cost of the money at these inputs.`
      : pLoss >= 0.25
      ? `About ${Math.round(pLoss * 100)}% of runs lost money. That is a real chance of being worse off, and the borrowing cost of ${fmt(totalBorrowCost)} runs whether the deployments work or not.`
      : pLoss >= 0.1
      ? `${Math.round(pLoss * 100)}% of runs lost money. The median outcome is positive, but a one-in-${Math.round(1 / Math.max(pLoss, 0.01))} chance of ending behind is not a rounding error.`
      : `${Math.round(pLoss * 100)}% of runs lost money at these inputs. Check whether the default rate and the return are ones you can actually evidence, because the result is only as good as those two numbers.`;

  return {
    finalEquity: finals,
    median, mean,
    p5: quantile(finals, 0.05), p25: quantile(finals, 0.25),
    p75: quantile(finals, 0.75), p95: quantile(finals, 0.95),
    worst: finals[0]!, best: finals[finals.length - 1]!,
    probabilityOfLoss: pLoss,
    probabilityOfRuin: ruinRuns / finals.length,
    cyclesPerRun, totalBorrowCost, medianAnnualised, verdict,
  };
}

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/**
 * The break-even gross return per cycle: the return at which the deployments
 * exactly pay for the borrowing, ignoring defaults and variance.
 *
 * Worth showing beside any simulation, because it is the number a person can
 * sanity-check in their head, and if the strategy's realistic return is not
 * comfortably above it, no amount of simulation makes the plan work.
 */
export function breakEvenReturnPerCycle(input: CycleInput): number {
  const cycleDays = input.cycleMonths * 30.4375 + input.idleDays;
  const cycles = Math.max(1, Math.floor((input.years * 365) / cycleDays));
  const totalCost = input.borrowAnnualRate * input.years;
  // (1 + r - fee)^cycles = 1 + totalCost
  return Math.pow(1 + totalCost, 1 / cycles) - 1 + input.feePerCycle;
}

/** How much of the year the capital is actually deployed. */
export function utilisation(input: CycleInput): number {
  const cycleDays = input.cycleMonths * 30.4375 + input.idleDays;
  return (input.cycleMonths * 30.4375) / cycleDays;
}

/** Every source and declared assumption behind the simulator, for the shell's source footer. */
export const ALT_CREDIT_SIMULATOR_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  TOP_BRACKET_SOURCE,
  PRIME_RATE_SOURCE,
  CARD_RATE_SOURCE,
  MONTH_LENGTH_NOTE,
  ...CYCLE_ASSUMPTIONS,
];
