/**
 * The Time Machine — thirty years, dealt again.
 *
 * ## What it does
 *
 * Takes the last thirty years of real index returns, applies a real carrier
 * account's real cap, floor and participation rate to each one, then DEALS THEM
 * IN A DIFFERENT ORDER. The result is a thirty-year policy run made only of
 * returns that actually happened, arranged in a sequence that did not.
 *
 * ## Why the order is shuffled and the returns are not
 *
 * Every path here is a PERMUTATION: all thirty years, each exactly once. 2008 is
 * in every single run and so is 1995. Nothing is invented, duplicated or dropped.
 * Only the order varies.
 *
 * That is a deliberate and load-bearing choice. Drawing returns at random from a
 * distribution — sampling with replacement, the ordinary Monte Carlo — produces
 * sequences that never occurred and could not have, and a distribution of values
 * over invented paths is a forecast however it is labelled. Reordering a fixed
 * set of real years is not a forecast. It is the same history, shuffled, and the
 * sentence "every year in this column actually happened, exactly once" survives
 * anyone checking it.
 *
 * `shared/sequenceStress.ts` in the platform's other tree holds the same
 * distinction; the survival Monte Carlo there reports lapse rates and publishes no
 * values, for this reason.
 *
 * ## What it is not
 *
 * Not an illustration and not a projection. No value here may be carried into a
 * basic illustration, and the maximum illustrated rate for the product is a
 * separate, capped number that belongs to the carrier's own system — for Pacific
 * Horizon ECV that is 6.35%, read off the 16 September 2026 illustration.
 */

import { RAW_INDEX_RETURNS } from './indexCreditingData';
import { HORIZON_ACCOUNTS, type HorizonAccount } from './pacificHorizonEcv';

// ─── Deterministic shuffling ────────────────────────────────────────────────

/** Seeded PRNG. A seed reproduces a run exactly, so any figure can be re-shown. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates. Returns a new array; the input is never mutated. */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Carrier account → credited rate ────────────────────────────────────────

/** Which raw series a Horizon account reads. */
function seriesKeyFor(account: HorizonAccount): string | null {
  switch (account.index) {
    case 'SP500_EX_DIV': return 'SP500';
    case 'INVESCO_QQQ': return 'NASDAQ100';
    case 'BLACKROCK_ENDURA': return null; // no public series on this platform
    case 'FIXED': return null;
    default: return null;
  }
}

export type Basis = 'current' | 'guaranteed';

/**
 * Apply an account's real terms to one year's raw index return.
 *
 * Participation first, then the cap, then the floor — the order the contracts
 * describe. The account charge is NOT netted here: Pacific Life takes it inside
 * the monthly deduction, not out of the crediting rate, and the illustration says
 * so. It is applied to the account value in the run instead.
 */
export function creditedPct(
  account: HorizonAccount,
  rawReturnPct: number,
  basis: Basis = 'current',
): number {
  const par = basis === 'current'
    ? account.currentParticipationPct
    : account.guaranteedParticipationPct;
  const cap = basis === 'current' ? account.currentCapPct : account.guaranteedCapPct;

  let credited = rawReturnPct * (par / 100);
  if (cap !== null) credited = Math.min(credited, cap);
  credited = Math.max(credited, account.floorPct);

  const benefit = basis === 'current'
    ? (account.accountBenefitPctCurrent ?? 0)
    : (account.accountBenefitPctGuaranteed ?? 0);
  return credited + benefit;
}

export interface YearCredit {
  readonly sourceYear: number;
  readonly rawReturnPct: number;
  readonly creditedPct: number;
  readonly flooredThisYear: boolean;
  readonly cappedThisYear: boolean;
}

export const DEFAULT_WINDOW_YEARS = 30;

/**
 * The thirty real years for an account, in the order they happened.
 * Accounts with no public index series on this platform return an empty set
 * rather than a guess.
 */
export function realYears(
  account: HorizonAccount,
  endYear = 2025,
  windowYears = DEFAULT_WINDOW_YEARS,
  basis: Basis = 'current',
): YearCredit[] {
  const key = seriesKeyFor(account);
  if (!key) return [];
  const series = RAW_INDEX_RETURNS[key];
  if (!series) return [];

  const out: YearCredit[] = [];
  for (let y = endYear - windowYears + 1; y <= endYear; y += 1) {
    const raw = series[y];
    if (raw === undefined) continue;
    const c = creditedPct(account, raw, basis);
    const cap = basis === 'current' ? account.currentCapPct : account.guaranteedCapPct;
    out.push({
      sourceYear: y,
      rawReturnPct: raw,
      creditedPct: c,
      flooredThisYear: raw < 0 && c >= account.floorPct,
      cappedThisYear: cap !== null && c >= cap - 1e-9 && raw > c,
    });
  }
  return out;
}

// ─── The Enhanced Performance Factor Rider ──────────────────────────────────

/**
 * Pacific Life's multiplier, as the illustration describes it.
 *
 *   "Segment's Indexed Interest Credit x Segment's Performance Factor = total
 *    credit."
 *
 * Three designs, named in the 16 Sep 2026 illustration:
 *   Classic (A)          — no PF benefit, no cost
 *   Performance (B)      — PF benefit, segment-based charge on indexed segment AV
 *   Performance Plus (C) — highest PF benefit, higher segment-based charge
 *
 * ## What the uploaded documents do NOT contain
 *
 * The three illustrations of one client case (de-identified) all ran **Design A**: every Enhanced
 * Performance Factor Rider Credit and Charge column is zero for all thirty years.
 * So the uploaded set establishes the mechanism and the design names, and does
 * NOT establish the performance factors.
 *
 * `performanceFactor` is therefore a required input with no default. Supply it
 * from a Design B or Design C illustration. The engine will not invent one, and
 * `EPFR_DESIGNS` below carries only the charge figure the description page
 * states, with the factor left null where it is not yet in evidence.
 */
export interface EpfrDesign {
  readonly key: 'classic' | 'performance' | 'performance-plus';
  readonly label: string;
  /** Annualized charge as a percentage of indexed segment accumulated value. */
  readonly annualChargePct: number | null;
  /** Multiplier applied to the indexed interest credit. Null = not yet in evidence. */
  readonly performanceFactor: number | null;
  readonly sourceNote: string;
}

export const EPFR_DESIGNS: readonly EpfrDesign[] = [
  {
    key: 'classic',
    label: 'Classic (Design A)',
    annualChargePct: 0,
    performanceFactor: 1,
    sourceNote: 'No rider PF benefit and no cost. Stated in the illustration; the three uploaded illustrations of one client case (de-identified) all ran this design.',
  },
  {
    key: 'performance',
    label: 'Performance (Design B)',
    annualChargePct: null,
    performanceFactor: null,
    sourceNote: 'A PF benefit on a segment-based charge assessed as a percentage of indexed segment AV. Neither the charge nor the factor appears in the uploaded documents — both require a Design B illustration.',
  },
  {
    key: 'performance-plus',
    label: 'Performance Plus (Design C)',
    annualChargePct: 7.5,
    performanceFactor: null,
    sourceNote: 'The highest PF benefit on a higher segment-based charge. The 7.50% annualized charge is from the description page; the factor requires a Design C illustration.',
  },
];

export interface EpfrSetting {
  readonly design: EpfrDesign['key'];
  /** Required when the design is not Classic, because no factor is on file. */
  readonly performanceFactor?: number;
  readonly annualChargePct?: number;
}

export class MissingPerformanceFactorError extends Error {
  constructor(design: string) {
    super(
      `Refused to run the ${design} design without a performance factor. The uploaded ` +
        'Pacific Life documents establish the rider mechanism and the design names but ' +
        'contain no factors — all three illustrations of that client case ran Design A, whose EPFR ' +
        'credit and charge columns are zero for every year. Supply performanceFactor from ' +
        'a Design B or C illustration, or run Classic.',
    );
    this.name = 'MissingPerformanceFactorError';
  }
}

function resolveEpfr(setting: EpfrSetting): { factor: number; chargePct: number } {
  const design = EPFR_DESIGNS.find((d) => d.key === setting.design);
  if (!design) throw new Error(`Unknown EPFR design: ${setting.design}`);
  const factor = setting.performanceFactor ?? design.performanceFactor;
  const chargePct = setting.annualChargePct ?? design.annualChargePct;
  if (factor === null || factor === undefined || chargePct === null || chargePct === undefined) {
    throw new MissingPerformanceFactorError(design.label);
  }
  return { factor, chargePct };
}

// ─── The run ────────────────────────────────────────────────────────────────

/**
 * Derive the issue age from the client's real age today.
 *
 * The framing is a policy taken out THIRTY YEARS AGO on someone who is the
 * client's age now. A 70-year-old sees what a policy opened at 40 would have done
 * across the thirty years that followed, and the last row of the table is the age
 * they are today.
 *
 * Derived rather than asked for, so the two figures cannot drift apart.
 */
export function issueAgeFromCurrentAge(
  currentAge: number,
  windowYears = DEFAULT_WINDOW_YEARS,
): number {
  if (!Number.isFinite(currentAge) || currentAge <= windowYears) {
    throw new RangeError(
      `A ${windowYears}-year look-back needs a current age above ${windowYears}; received ${currentAge}. ` +
        'Shorten the window, or this framing does not apply to this client.',
    );
  }
  return Math.round(currentAge - windowYears);
}

export interface RunInputs {
  readonly accountId: string;
  readonly annualPremium: number;
  readonly premiumYears: number;
  /**
   * Age the hypothetical policy was issued at, thirty years ago. Prefer
   * `currentAge` and let the engine subtract.
   */
  readonly issueAge?: number;
  /** The client's real age today. The engine derives the issue age from it. */
  readonly currentAge?: number;
  readonly specifiedAmount: number;
  /** Seed for the shuffle. Omit to run history in the order it happened. */
  readonly seed?: number;
  readonly basis?: Basis;
  readonly epfr?: EpfrSetting;
  readonly endYear?: number;
  readonly windowYears?: number;
  /** Fraction of surrender value a loan may reach. */
  readonly maxLoanFraction?: number;
}

export interface RunYear {
  readonly policyYear: number;
  readonly attainedAge: number;
  /** Which real calendar year's return landed on this policy year. */
  readonly sourceYear: number;
  readonly rawReturnPct: number;
  readonly baseCreditedPct: number;
  /** Credit after the performance factor, before charges. */
  readonly creditedPct: number;
  readonly premium: number;
  /**
   * Account value — the figure crediting is computed on. It is NOT reduced by a
   * policy loan, which is the whole mechanism: the money can leave and the
   * crediting base stays.
   */
  readonly accountValue: number;
  readonly surrenderValue: number;
  readonly indexedCredit: number;
  readonly epfrCharge: number;
  readonly accountCharge: number;
  readonly flooredThisYear: boolean;
  readonly cappedThisYear: boolean;
  /** What could be borrowed this year without exceeding the loan fraction. */
  readonly borrowable: number;
}

export interface RunResult {
  readonly account: HorizonAccount;
  /** Age the hypothetical policy was issued at, thirty years before today. */
  readonly issueAge: number;
  /** Age in the final row — the client's age today, when currentAge was supplied. */
  readonly endingAge: number;
  readonly basis: Basis;
  readonly seed: number | null;
  readonly shuffled: boolean;
  readonly epfrDesign: string;
  readonly years: readonly RunYear[];
  readonly endingAccountValue: number;
  readonly totalPremium: number;
  readonly totalIndexedCredit: number;
  readonly totalEpfrCharge: number;
  readonly yearsFloored: number;
  readonly yearsCapped: number;
  readonly provenance: string;
}

/** Surrender charge grades to zero 120 policy months after issue — the illustration's words. */
function surrenderChargeFor(policyYear: number, annualPremium: number): number {
  if (policyYear > 10) return 0;
  const base = annualPremium * 0.376;
  return base * ((11 - policyYear) / 10);
}

/**
 * Run a policy through thirty real years in a given order.
 *
 * With a seed, the years are dealt in a shuffled order. Without one, they run in
 * the order they actually happened — useful as the reference column.
 */
export function runTimeMachine(inputs: RunInputs): RunResult {
  const account = HORIZON_ACCOUNTS.find((a) => a.id === inputs.accountId);
  if (!account) throw new Error(`Unknown Pacific Horizon account: ${inputs.accountId}`);

  const windowYears = inputs.windowYears ?? DEFAULT_WINDOW_YEARS;
  if (inputs.issueAge === undefined && inputs.currentAge === undefined) {
    throw new RangeError(
      'Supply currentAge — the client’s real age today — or issueAge. ' +
        'currentAge is preferred; the engine subtracts the look-back window itself.',
    );
  }
  const issueAge = inputs.currentAge !== undefined
    ? issueAgeFromCurrentAge(inputs.currentAge, windowYears)
    : inputs.issueAge!;

  const basis = inputs.basis ?? 'current';
  const source = realYears(account, inputs.endYear ?? 2025, windowYears, basis);
  if (source.length === 0) {
    throw new Error(
      `No public index series is held on this platform for ${account.name}. ` +
        'Accounts on the BlackRock Endura index and the fixed account cannot be run here.',
    );
  }

  const dealt = inputs.seed === undefined ? source : shuffle(source, inputs.seed);
  const epfrSetting: EpfrSetting = inputs.epfr ?? { design: 'classic' };
  const { factor, chargePct } = resolveEpfr(epfrSetting);
  const loanFraction = inputs.maxLoanFraction ?? 0.9;

  const years: RunYear[] = [];
  let av = 0;
  let totalPremium = 0;
  let totalCredit = 0;
  let totalEpfr = 0;

  for (let i = 0; i < dealt.length; i += 1) {
    const y = dealt[i];
    const policyYear = i + 1;
    const premium = policyYear <= inputs.premiumYears ? inputs.annualPremium : 0;
    totalPremium += premium;

    const beforeCredit = av + premium;
    const credited = y.creditedPct * factor;
    const indexedCredit = beforeCredit * (credited / 100);
    const accountCharge = beforeCredit * (account.accountChargePctAnnual / 100);
    const epfrCharge = beforeCredit * (chargePct / 100);

    av = Math.max(0, beforeCredit + indexedCredit - accountCharge - epfrCharge);
    totalCredit += indexedCredit;
    totalEpfr += epfrCharge;

    const sv = Math.max(0, av - surrenderChargeFor(policyYear, inputs.annualPremium));

    years.push({
      policyYear,
      attainedAge: issueAge + i,
      sourceYear: y.sourceYear,
      rawReturnPct: y.rawReturnPct,
      baseCreditedPct: y.creditedPct,
      creditedPct: credited,
      premium: Math.round(premium),
      accountValue: Math.round(av),
      surrenderValue: Math.round(sv),
      indexedCredit: Math.round(indexedCredit),
      epfrCharge: Math.round(epfrCharge),
      accountCharge: Math.round(accountCharge),
      flooredThisYear: y.flooredThisYear,
      cappedThisYear: y.cappedThisYear,
      borrowable: Math.round(sv * loanFraction),
    });
  }

  return {
    account,
    issueAge,
    endingAge: issueAge + years.length - 1,
    basis,
    seed: inputs.seed ?? null,
    shuffled: inputs.seed !== undefined,
    epfrDesign: epfrSetting.design,
    years,
    endingAccountValue: Math.round(av),
    totalPremium: Math.round(totalPremium),
    totalIndexedCredit: Math.round(totalCredit),
    totalEpfrCharge: Math.round(totalEpfr),
    yearsFloored: years.filter((y) => y.flooredThisYear).length,
    yearsCapped: years.filter((y) => y.cappedThisYear).length,
    provenance:
      `${dealt.length} real calendar years of ${account.name}, each appearing exactly once, ` +
      (inputs.seed === undefined
        ? 'in the order they occurred.'
        : `dealt in a shuffled order from seed ${inputs.seed}. No return was invented, ` +
          'duplicated or omitted — only the order changed.') +
      ' Not an illustration and not a projection.',
  };
}

// ─── Liquidity windows ──────────────────────────────────────────────────────

export interface LiquidityWindow {
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly sourceYear: number;
  readonly accountValue: number;
  readonly surrenderValue: number;
  readonly borrowable: number;
  /**
   * Credit the account value earns in the years AFTER this loan is taken, on the
   * full unreduced balance. This is the figure the strategy turns on.
   */
  readonly creditEarnedAfterLoan: number;
  /** creditEarnedAfterLoan divided by the amount borrowed. */
  readonly creditPerDollarBorrowed: number;
  readonly yearsRemaining: number;
  readonly plain: string;
}

/**
 * The years where the most can be borrowed, and what the account keeps earning.
 *
 * Crediting is computed on the account value, which a policy loan does not reduce
 * at a non-direct-recognition carrier. So a loan taken in year N leaves the base
 * intact and the account goes on crediting for the remaining years. This function
 * finds where that is worth the most.
 *
 * Ranked by the DOLLARS the account goes on to earn after the loan, not by the
 * amount borrowable. Ranking on borrowable puts the last two years at the top,
 * where the balance is largest and there is no time left for it to earn anything
 * — the arithmetically largest number and the least useful answer. Ranking on
 * what is earned afterwards balances "enough to borrow" against "enough years
 * left to matter", which is the actual question.
 */
export function liquidityWindows(run: RunResult, top = 5): LiquidityWindow[] {
  const windows: LiquidityWindow[] = run.years.map((y, idx) => {
    const after = run.years.slice(idx + 1);
    const credit = after.reduce((s, r) => s + r.indexedCredit, 0);
    return {
      policyYear: y.policyYear,
      attainedAge: y.attainedAge,
      sourceYear: y.sourceYear,
      accountValue: y.accountValue,
      surrenderValue: y.surrenderValue,
      borrowable: y.borrowable,
      creditEarnedAfterLoan: Math.round(credit),
      creditPerDollarBorrowed: y.borrowable > 0 ? Number((credit / y.borrowable).toFixed(2)) : 0,
      yearsRemaining: after.length,
      plain:
        `Year ${y.policyYear} (age ${y.attainedAge}): ${y.borrowable.toLocaleString()} available ` +
        `against a ${y.surrenderValue.toLocaleString()} surrender value. Taken as a loan, the ` +
        `account value stays at ${y.accountValue.toLocaleString()} and goes on to earn ` +
        `${Math.round(credit).toLocaleString()} over the remaining ${after.length} years — ` +
        `${y.borrowable > 0 ? (credit / y.borrowable).toFixed(2) : '0'} for every dollar taken out.`,
    };
  });
  return windows
    .sort((a, b) => b.creditEarnedAfterLoan - a.creditEarnedAfterLoan)
    .slice(0, top);
}

/**
 * The performance factor at which a paid design breaks even against its charge.
 *
 * This exists because the charge is known and the factor is not. The uploaded
 * documents give Performance Plus a 7.50% annualized charge on indexed segment
 * accumulated value and give no factor at all, so the only honest thing the
 * engine can say about that design is what the factor would have to be.
 *
 * Solved by bisection on the same ordering, so the comparison is like for like.
 */
export function breakEvenPerformanceFactor(
  inputs: RunInputs,
  design: EpfrSetting['design'],
  annualChargePct?: number,
): { factor: number | null; chargePct: number; note: string } {
  const d = EPFR_DESIGNS.find((x) => x.key === design);
  if (!d) throw new Error(`Unknown EPFR design: ${design}`);
  const chargePct = annualChargePct ?? d.annualChargePct;
  if (chargePct === null) {
    return {
      factor: null,
      chargePct: 0,
      note: `No charge is on file for ${d.label}, so no break-even can be computed. ${d.sourceNote}`,
    };
  }
  if (chargePct === 0) {
    return { factor: 1, chargePct: 0, note: `${d.label} is free, so it breaks even at a factor of 1.` };
  }

  const baseline = runTimeMachine({ ...inputs, epfr: { design: 'classic' } }).endingAccountValue;
  let lo = 1;
  let hi = 8;
  const endingAt = (f: number) =>
    runTimeMachine({ ...inputs, epfr: { design, performanceFactor: f, annualChargePct: chargePct } })
      .endingAccountValue;

  if (endingAt(hi) < baseline) {
    return {
      factor: null,
      chargePct,
      note:
        `Even an ${hi}x performance factor does not recover a ${chargePct}% annual charge on ` +
        'this ordering. Either the charge is assessed on a narrower base than the whole ' +
        'accumulated value, or this design is not viable at this funding level. Get a ' +
        'Design C illustration before showing anything.',
    };
  }
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (endingAt(mid) < baseline) lo = mid; else hi = mid;
  }
  return {
    factor: Number(hi.toFixed(3)),
    chargePct,
    note:
      `On this ordering, ${d.label} needs a performance factor of about ${hi.toFixed(2)}x just to ` +
      `match Classic after its ${chargePct}% annual charge. Anything below that is a net loss. ` +
      'The factor is not in the uploaded documents — this is what it would have to be.',
  };
}

// ─── Toggles: multiplier comparison and the year picker ─────────────────────

export interface MultiplierComparison {
  readonly withoutRider: RunResult;
  readonly withRider: RunResult;
  readonly endingValueDelta: number;
  readonly totalChargesPaid: number;
  readonly netOfCharges: number;
  readonly worthIt: boolean;
  readonly plain: string;
}

/**
 * The same shuffled order, run twice: Classic against a paid design.
 *
 * Identical seed, so the two columns differ by the rider and nothing else. The
 * charge is reported alongside the gain, because a multiplier shown without its
 * cost is an advertisement.
 */
export function compareMultiplier(
  inputs: RunInputs,
  paid: EpfrSetting,
): MultiplierComparison {
  const withoutRider = runTimeMachine({ ...inputs, epfr: { design: 'classic' } });
  const withRider = runTimeMachine({ ...inputs, epfr: paid });
  const delta = withRider.endingAccountValue - withoutRider.endingAccountValue;
  const charges = withRider.totalEpfrCharge;
  return {
    withoutRider,
    withRider,
    endingValueDelta: delta,
    totalChargesPaid: charges,
    netOfCharges: delta,
    worthIt: delta > 0,
    plain:
      `Same ${withRider.years.length} years in the same order, run with and without the rider. ` +
      `Ending account value moves by ${delta.toLocaleString()} and the rider charged ` +
      `${charges.toLocaleString()} over the period. ` +
      (delta > 0
        ? 'The factor more than covered its charge on this ordering.'
        : 'The charge exceeded what the factor added on this ordering.'),
  };
}

export interface YearSlice {
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly sourceYear: number;
  readonly rawReturnPct: number;
  readonly creditedPct: number;
  readonly accountValue: number;
  readonly surrenderValue: number;
  readonly borrowable: number;
  readonly indexedCredit: number;
}

/**
 * Pull specific policy years — 2, 5, 7, 9, 12, 19, 22, whatever is typed.
 *
 * Out-of-range years are reported rather than silently dropped, so a typo in the
 * entry box does not quietly shorten the table.
 */
export function pickYears(
  run: RunResult,
  wanted: readonly number[],
): { rows: YearSlice[]; notFound: number[] } {
  const rows: YearSlice[] = [];
  const notFound: number[] = [];
  for (const n of wanted) {
    const y = run.years.find((r) => r.policyYear === n);
    if (!y) { notFound.push(n); continue; }
    rows.push({
      policyYear: y.policyYear,
      attainedAge: y.attainedAge,
      sourceYear: y.sourceYear,
      rawReturnPct: y.rawReturnPct,
      creditedPct: y.creditedPct,
      accountValue: y.accountValue,
      surrenderValue: y.surrenderValue,
      borrowable: y.borrowable,
      indexedCredit: y.indexedCredit,
    });
  }
  return { rows, notFound };
}

/** Every Nth year, for the 5-year and 10-year buttons. */
export function everyNthYear(run: RunResult, n: number): YearSlice[] {
  if (n < 1) throw new RangeError('n must be at least 1');
  return pickYears(run, run.years.filter((y) => y.policyYear % n === 0).map((y) => y.policyYear)).rows;
}

export const TIME_MACHINE_RULES = {
  neverPrinted: [
    'That this is an illustration or a projection. It is a reordering of returns that already occurred.',
    'A rate taken from this run used to project policy values. The maximum illustrated rate for Pacific Horizon ECV is 6.35% and belongs to the carrier’s own system.',
    'A performance factor that is not on an illustration. The uploaded Design A illustrations contain none.',
    'A multiplier benefit shown without the charge that bought it.',
    'A borrowable figure presented as tax-free income without the loan, the loan interest, and the lapse consequence beside it.',
  ],
} as const;
