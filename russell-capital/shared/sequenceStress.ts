/**
 * Sequence stress and policy survival — does this thing hold up when you lean on it.
 *
 * ## Two different statistical animals, kept apart on purpose
 *
 * RESEQUENCING is a permutation. It takes the SAME thirty real annual returns and
 * deals them in a different order. Nothing is invented and nothing is resampled:
 * the multiset of returns is identical in every run, so the only variable is
 * order. That makes it the cleanest possible isolation of sequence-of-returns
 * risk, and it is still archaeology — every number in it happened.
 *
 * It also answers the question a client actually has, which is not "what will the
 * market do" but "what if the bad years had come first." With premiums flowing in
 * and loans flowing out, order matters enormously, and this measures exactly how
 * much without introducing a single assumption about the future.
 *
 * SURVIVAL MONTE CARLO is not archaeology and this file does not pretend it is. It
 * resamples from the historical distribution WITH replacement to generate paths
 * that never occurred. That is a model, and a model of the future is the thing
 * AG 49-A governs — so this one is deliberately built to answer a different
 * question than an illustration answers.
 *
 * It reports SURVIVAL, not value. The output is the share of paths in which the
 * policy lapses, the year it typically happens, and how much loan pressure it took
 * to get there. It does not report "your account value will be X," and there is no
 * function here that will tell you that. A survivability stress test and a value
 * projection are different instruments, and the second one is `projectPolicyValues`
 * in timeMachineCompliance.ts, which refuses anything above the AG 49-A cap.
 *
 * ## Why survival is the number that matters when you borrow to the hilt
 *
 * The recycling strategy takes loans every year and applies them to mortgage
 * principal. The loan balance compounds. The account value credits on the
 * unreduced balance at a non-direct-recognition carrier, which is what makes the
 * whole thing work — right up until a run of floor years lets the loan balance
 * catch the surrender value, at which point the policy lapses and the entire gain
 * becomes ordinary income on money that went into a mortgage a decade ago.
 *
 * That failure is binary, it is late, and it is invisible in an average. A median
 * ending value tells you nothing about it. The share of paths that lapse tells you
 * everything.
 */

import { RAW_INDEX_RETURNS, calculateCreditedRate, ALL_INDEX_OPTIONS, type IndexOption } from './indexCreditingData';
import { coiRateForAge } from './timeMachineCompliance';

// ── Deterministic randomness ────────────────────────────────────────────────
//
// Seeded, so any run is reproducible from its seed alone. That matters twice:
// a client can be handed the seed and get the identical result, and a sealed
// ledger entry can record the seed instead of ten thousand paths.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates using a seeded generator. Returns a new array; input untouched. */
export function resequence<T>(items: readonly T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── The policy under load ───────────────────────────────────────────────────

export interface LoanPolicyParams {
  readonly issueAge: number;
  readonly annualPremium: number;
  readonly premiumYears: number;
  readonly specifiedAmount: number;
  /** Fraction of surrender value drawn as a loan each year once loans begin. */
  readonly annualLoanFraction: number;
  /** Policy year loans start. */
  readonly loanStartYear: number;
  /** Annual interest charged on the loan balance. */
  readonly loanInterestRate: number;
}

export interface SequenceRunYear {
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly creditedPct: number;
  readonly accountValue: number;
  readonly surrenderValue: number;
  readonly loanBalance: number;
  readonly loanTaken: number;
}

export interface SequenceRun {
  readonly rows: SequenceRunYear[];
  readonly lapsed: boolean;
  /** Policy year of lapse, or null. */
  readonly lapseYear: number | null;
  readonly endingAccountValue: number;
  readonly endingLoanBalance: number;
  readonly totalLoansTaken: number;
  /**
   * Ordinary income recognised if the policy lapsed: account value plus loan
   * balance less basis. Zero when it survived.
   */
  readonly taxableOnLapse: number;
}

/**
 * Run a policy through one ordered list of annual credited rates, under loan load.
 *
 * Crediting is on the UNREDUCED account value — the non-direct-recognition model
 * the strategy depends on. Loans are loans; nothing is surrendered.
 */
export function runSequence(
  creditedRatesPct: readonly number[],
  p: LoanPolicyParams,
): SequenceRun {
  const rows: SequenceRunYear[] = [];
  let av = 0;
  let loan = 0;
  let basis = 0;
  let totalLoans = 0;
  let lapseYear: number | null = null;

  for (let i = 0; i < creditedRatesPct.length; i += 1) {
    const policyYear = i + 1;
    const attainedAge = p.issueAge + i;

    const premium = policyYear <= p.premiumYears ? p.annualPremium : 0;
    basis += premium;

    const netAmountAtRisk = Math.max(0, p.specifiedAmount - av);
    const coi = netAmountAtRisk * coiRateForAge(attainedAge);

    av = Math.max(0, av + premium - coi);
    av = av * (1 + creditedRatesPct[i] / 100);

    // Loan interest compounds whether or not a new draw is taken.
    loan = loan * (1 + p.loanInterestRate);

    // Surrender charge, grading off over the first ten years.
    const surrenderCharge =
      policyYear <= 3
        ? p.annualPremium * 0.376
        : policyYear < 11
          ? p.annualPremium * 0.376 * ((11 - policyYear) / 7)
          : 0;
    let surrenderValue = Math.max(0, av - surrenderCharge);

    let loanTaken = 0;
    if (policyYear >= p.loanStartYear && lapseYear === null) {
      const capacity = Math.max(0, surrenderValue * p.annualLoanFraction - loan);
      if (capacity > 0) {
        loanTaken = capacity;
        loan += loanTaken;
        totalLoans += loanTaken;
      }
    }

    // Lapse: the loan balance has caught the surrender value.
    if (lapseYear === null && loan >= surrenderValue && loan > 0) {
      lapseYear = policyYear;
    }

    rows.push({
      policyYear,
      attainedAge,
      creditedPct: creditedRatesPct[i],
      accountValue: Math.round(av),
      surrenderValue: Math.round(surrenderValue),
      loanBalance: Math.round(loan),
      loanTaken: Math.round(loanTaken),
    });

    if (lapseYear !== null) break;
  }

  const lapsed = lapseYear !== null;
  return {
    rows,
    lapsed,
    lapseYear,
    endingAccountValue: Math.round(av),
    endingLoanBalance: Math.round(loan),
    totalLoansTaken: Math.round(totalLoans),
    taxableOnLapse: lapsed ? Math.max(0, Math.round(av + loan - basis)) : 0,
  };
}

// ── Resequencing: the same real years, dealt again ──────────────────────────

export interface SequenceShuffle {
  readonly shuffleNumber: number;
  readonly seed: number;
  /** The order the years were dealt in, as calendar years. Reproducible from the seed. */
  readonly yearOrder: readonly number[];
  readonly run: SequenceRun;
}

export interface SequenceStressResult {
  /** The unshuffled run — history in the order it actually happened. */
  readonly asItHappened: SequenceRun;
  readonly shuffles: readonly SequenceShuffle[];
  readonly lapsedCount: number;
  readonly lapseRate: number;
  readonly bestEnding: number;
  readonly worstEnding: number;
  readonly medianEnding: number;
  readonly earliestLapseYear: number | null;
  readonly plain: string;
}

/**
 * The interactive button's ceiling. Twenty is right for a person clicking and
 * watching. It is deliberately NOT the ceiling for a distribution — see
 * `permutationDistribution`, which runs thousands, because twenty draws cannot
 * find a tail.
 */
export const MAX_SHUFFLES = 20;

/**
 * Deal the same thirty real years in a different order, up to twenty times.
 *
 * Every shuffle contains exactly the returns that occurred — 2008's crash and
 * 1995's run are in all of them. Only the order changes. If the policy survives
 * every ordering of its own history, that is a strong and honest thing to be able
 * to say. If it does not, the client should know which orderings kill it before
 * they sign, not after.
 */
export function sequenceStressTest(params: {
  optionId: string;
  startYear: number;
  endYear: number;
  policy: LoanPolicyParams;
  shuffles: number;
  seed?: number;
}): SequenceStressResult {
  const option = ALL_INDEX_OPTIONS.find((o) => o.id === params.optionId);
  if (!option) throw new Error(`Unknown index option: ${params.optionId}`);
  if (params.shuffles < 1 || params.shuffles > MAX_SHUFFLES) {
    throw new RangeError(`shuffles must be between 1 and ${MAX_SHUFFLES}`);
  }

  const history = historicalCredits(option, params.startYear, params.endYear);
  if (history.length === 0) throw new Error('No history in that period.');

  const asItHappened = runSequence(history.map((h) => h.creditedPct), params.policy);
  const baseSeed = params.seed ?? 1;
  const shuffles: SequenceShuffle[] = [];

  for (let n = 1; n <= params.shuffles; n += 1) {
    const seed = baseSeed * 1000 + n;
    const dealt = resequence(history, seed);
    shuffles.push({
      shuffleNumber: n,
      seed,
      yearOrder: dealt.map((d) => d.calendarYear),
      run: runSequence(dealt.map((d) => d.creditedPct), params.policy),
    });
  }

  const endings = shuffles.map((s) => s.run.endingAccountValue).sort((a, b) => a - b);
  const lapsed = shuffles.filter((s) => s.run.lapsed);
  const earliest = lapsed.length
    ? Math.min(...lapsed.map((s) => s.run.lapseYear!))
    : null;

  return {
    asItHappened,
    shuffles,
    lapsedCount: lapsed.length,
    lapseRate: Number((lapsed.length / shuffles.length).toFixed(4)),
    bestEnding: endings[endings.length - 1],
    worstEnding: endings[0],
    medianEnding: endings[Math.floor(endings.length / 2)],
    earliestLapseYear: earliest,
    plain:
      `The same ${history.length} real years, dealt ${shuffles.length} different ways. ` +
      `Every ordering contains exactly the returns that occurred — nothing added, ` +
      `nothing removed, only the order changed. ` +
      (lapsed.length === 0
        ? `The policy survived all ${shuffles.length} orderings. Ending values ran from ` +
          `${endings[0].toLocaleString()} to ${endings[endings.length - 1].toLocaleString()}.`
        : `${lapsed.length} of ${shuffles.length} orderings ended in lapse, the earliest in ` +
          `policy year ${earliest}. Sequence alone is enough to break this structure, ` +
          `which means the loan schedule is too aggressive for this history.`),
  };
}

function historicalCredits(
  option: IndexOption,
  startYear: number,
  endYear: number,
): Array<{ calendarYear: number; creditedPct: number }> {
  const out: Array<{ calendarYear: number; creditedPct: number }> = [];
  for (let y = startYear; y <= endYear; y += 1) {
    const raw = RAW_INDEX_RETURNS[option.index]?.[y];
    if (raw === undefined) continue;
    out.push({ calendarYear: y, creditedPct: calculateCreditedRate(option, raw) });
  }
  return out;
}

// ── Survival Monte Carlo ────────────────────────────────────────────────────

export interface SurvivalResult {
  readonly paths: number;
  readonly lapsedPaths: number;
  /** The headline. Share of paths in which the policy lapsed. */
  readonly lapseRate: number;
  readonly medianLapseYear: number | null;
  readonly earliestLapseYear: number | null;
  /** Median ordinary income recognised across the paths that lapsed. */
  readonly medianTaxableOnLapse: number;
  readonly survivalByYear: ReadonlyArray<{ policyYear: number; stillInForce: number }>;
  readonly seed: number;
  readonly plain: string;
  readonly whatThisIsNot: string;
}

/**
 * Ten thousand paths, resampled from this index's own historical returns, run
 * through the loan schedule. Reports SURVIVAL — not value.
 *
 * This is a model and not a record: the paths never occurred. It is included
 * because the question it answers — how often does this structure fail — cannot be
 * answered from thirty years of one ordering, and because a strategy that borrows
 * every year against a floored asset has a failure mode that averages hide.
 *
 * There is deliberately no ending-value percentile in the output. A survivability
 * test that also published a value distribution would be read as a projection, and
 * a projection is `projectPolicyValues`, which is capped.
 */
export function policySurvivalMonteCarlo(params: {
  optionId: string;
  startYear: number;
  endYear: number;
  policy: LoanPolicyParams;
  years: number;
  paths?: number;
  seed?: number;
}): SurvivalResult {
  const option = ALL_INDEX_OPTIONS.find((o) => o.id === params.optionId);
  if (!option) throw new Error(`Unknown index option: ${params.optionId}`);

  const pool = historicalCredits(option, params.startYear, params.endYear).map((h) => h.creditedPct);
  if (pool.length === 0) throw new Error('No history to resample from.');

  const paths = params.paths ?? 10_000;
  const seed = params.seed ?? 42;
  const rng = mulberry32(seed);

  const inForce = new Array<number>(params.years).fill(0);
  const lapseYears: number[] = [];
  const taxables: number[] = [];

  for (let p = 0; p < paths; p += 1) {
    const draw: number[] = [];
    for (let y = 0; y < params.years; y += 1) {
      draw.push(pool[Math.floor(rng() * pool.length)]);
    }
    const run = runSequence(draw, params.policy);
    const survivedThrough = run.lapsed ? run.lapseYear! - 1 : params.years;
    for (let y = 0; y < survivedThrough; y += 1) inForce[y] += 1;
    if (run.lapsed) {
      lapseYears.push(run.lapseYear!);
      taxables.push(run.taxableOnLapse);
    }
  }

  const sortedLapse = lapseYears.slice().sort((a, b) => a - b);
  const sortedTax = taxables.slice().sort((a, b) => a - b);
  const rate = lapseYears.length / paths;

  return {
    paths,
    lapsedPaths: lapseYears.length,
    lapseRate: Number(rate.toFixed(4)),
    medianLapseYear: sortedLapse.length ? sortedLapse[Math.floor(sortedLapse.length / 2)] : null,
    earliestLapseYear: sortedLapse.length ? sortedLapse[0] : null,
    medianTaxableOnLapse: sortedTax.length ? sortedTax[Math.floor(sortedTax.length / 2)] : 0,
    survivalByYear: inForce.map((count, i) => ({
      policyYear: i + 1,
      stillInForce: Number((count / paths).toFixed(4)),
    })),
    seed,
    plain:
      lapseYears.length === 0
        ? `Across ${paths.toLocaleString()} resampled paths the policy never lapsed under this ` +
          `loan schedule. That is a strong result and it is a statement about this ` +
          `schedule, not a guarantee about any contract.`
        : `${(rate * 100).toFixed(2)}% of ${paths.toLocaleString()} resampled paths ended in lapse ` +
          `— typically in policy year ${sortedLapse[Math.floor(sortedLapse.length / 2)]}, with a ` +
          `median ${sortedTax[Math.floor(sortedTax.length / 2)].toLocaleString()} of ordinary ` +
          `income recognised on money already spent. Reduce the annual loan fraction or start ` +
          `loans later and re-run.`,
    whatThisIsNot:
      'This is a survivability stress test built on resampled returns. The paths did ' +
      'not occur. It reports how often the structure fails, not what any policy will ' +
      'be worth, and no value shown to a client may be taken from it.',
  };
}

// ── Export packet ───────────────────────────────────────────────────────────

export interface ExportPacket {
  readonly disclosures: readonly string[];
  readonly basicIllustrationAttached: true;
  readonly carrierApprovalReference: string;
  readonly seeds: Readonly<Record<string, number>>;
}

export class ExportRefusedError extends Error {
  constructor(reason: string) {
    super(`Refused to build an export packet: ${reason}`);
    this.name = 'ExportRefusedError';
  }
}

/**
 * Assemble a packet for a PDF or a printout.
 *
 * Handing a client a document is a different act from showing them a screen. Once
 * it leaves the room it is sales material, and sales material is governed whether
 * or not it is an illustration: NAIC Model #570 reaches prepared presentations and
 * agent-produced material, and essentially every carrier appointment agreement
 * requires prior written approval of anything an appointed producer creates and
 * distributes.
 *
 * So this refuses to assemble unless three things are true: the basic illustration
 * travels with it, a carrier approval reference is on file, and the disclosures are
 * present. Those are not this engine's rules — they are the carrier's, and the
 * engine simply will not produce a packet that ignores them.
 *
 * The seeds are included so any figure in the packet can be regenerated exactly.
 */
export function buildExportPacket(params: {
  basicIllustrationAttached: boolean;
  carrierApprovalReference: string;
  disclosures: readonly string[];
  seeds: Record<string, number>;
}): ExportPacket {
  if (!params.basicIllustrationAttached) {
    throw new ExportRefusedError(
      'the basic illustration must accompany any supplemental material handed to a client',
    );
  }
  if (!params.carrierApprovalReference.trim()) {
    throw new ExportRefusedError(
      'no carrier approval reference on file. Agent-produced sales material generally ' +
        'requires prior written carrier approval under the appointment agreement, and ' +
        'a market conduct exam asks for it by name',
    );
  }
  if (params.disclosures.length === 0) {
    throw new ExportRefusedError('disclosures are required on any exported material');
  }
  return {
    disclosures: params.disclosures,
    basicIllustrationAttached: true,
    carrierApprovalReference: params.carrierApprovalReference.trim(),
    seeds: { ...params.seeds },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PERMUTATION DISTRIBUTION — thousands of paths, every one made of real years
// ═══════════════════════════════════════════════════════════════════════════
//
// ## What this is for
//
// `sequenceStressTest` above is the button: deal the years again, up to twenty
// times, watch what happens. Twenty is the right number for a person clicking.
//
// It is the wrong number for a distribution. Twenty draws cannot find a tail, and
// the interesting question — how wide is the spread of outcomes when only the
// ORDER varies — needs thousands of draws to answer. This function provides them.
//
// ## Why this and not the Monte Carlo
//
// Both produce a distribution of ending values. They are not the same object.
//
// The survival Monte Carlo above resamples WITH replacement, so a path can contain
// 2008 three times and 1995 never. Those paths did not occur and could not have;
// the sequence of returns they describe is synthetic. That is why that function
// reports survival and refuses to publish an ending-value distribution — a
// distribution of values over invented paths is a forecast, whatever the vessel
// displaying it is called.
//
// This function permutes WITHOUT replacement. Every path contains every one of the
// thirty real years, exactly once. Nothing is invented, nothing is duplicated,
// nothing is dropped. 2008's crash appears in every single path, and so does
// 1995's run. The ONLY thing that varies across thousands of paths is the order
// they arrive in.
//
// That distinction is the whole argument, and it is a strong one. "Every path in
// this distribution is composed only of years that actually happened, each exactly
// once" is a sentence that survives scrutiny. "Here is a probability model of the
// future" is not the same sentence and should not be dressed as one.
//
// ## Where the values may be shown
//
// On the Time Machine contract. These are ending values for a hypothetical policy
// run through real years in an order that did not occur — a historical
// rearrangement, not a forecast, and not anything a buyer can purchase. The values
// are as real as the years they are made of.
//
// What still may not happen: these figures cannot be handed to `projectPolicyValues`
// as a rate, and no value in the buyer's own basic illustration may be derived from
// them. That guard is unchanged and is enforced there.

export interface PermutationDistribution {
  readonly permutations: number;
  readonly yearsPerPath: number;
  /** Ending account value at each percentile, across all permutations. */
  readonly percentiles: Readonly<Record<'p5' | 'p25' | 'p50' | 'p75' | 'p95', number>>;
  readonly best: number;
  readonly worst: number;
  readonly mean: number;
  /** As-it-happened, for reference — the one ordering that is not a rearrangement. */
  readonly actualHistoryEnding: number;
  /** Where the real ordering fell within the distribution, 0 to 1. */
  readonly actualHistoryPercentile: number;
  readonly lapsedCount: number;
  readonly lapseRate: number;
  readonly spreadRatio: number;
  readonly seed: number;
  readonly plain: string;
  readonly provenance: string;
}

export const MAX_PERMUTATIONS = 10_000;

/**
 * Deal the same real years thousands of times and report the whole distribution.
 *
 * Every path is a permutation: all thirty years, each exactly once. This is a
 * rearrangement of history, not a model of the future, and the distinction is
 * structural rather than a matter of labelling — `policySurvivalMonteCarlo`
 * resamples with replacement and therefore cannot make this claim, which is
 * precisely why it publishes no values.
 */
export function permutationDistribution(params: {
  optionId: string;
  startYear: number;
  endYear: number;
  policy: LoanPolicyParams;
  permutations?: number;
  seed?: number;
}): PermutationDistribution {
  const option = ALL_INDEX_OPTIONS.find((o) => o.id === params.optionId);
  if (!option) throw new Error(`Unknown index option: ${params.optionId}`);

  const count = params.permutations ?? 5_000;
  if (count < 1 || count > MAX_PERMUTATIONS) {
    throw new RangeError(`permutations must be between 1 and ${MAX_PERMUTATIONS}`);
  }

  const history = historicalCredits(option, params.startYear, params.endYear);
  if (history.length === 0) throw new Error('No history in that period.');

  const actual = runSequence(history.map((h) => h.creditedPct), params.policy);
  const seed = params.seed ?? 2026;

  const endings: number[] = [];
  let lapsed = 0;

  for (let n = 0; n < count; n += 1) {
    const dealt = resequence(history, seed * 100_000 + n);
    const run = runSequence(dealt.map((d) => d.creditedPct), params.policy);
    endings.push(run.endingAccountValue);
    if (run.lapsed) lapsed += 1;
  }

  endings.sort((a, b) => a - b);
  const at = (q: number) => endings[Math.min(endings.length - 1, Math.floor(q * endings.length))];
  const mean = Math.round(endings.reduce((s, v) => s + v, 0) / endings.length);
  const below = endings.filter((v) => v < actual.endingAccountValue).length;

  return {
    permutations: count,
    yearsPerPath: history.length,
    percentiles: { p5: at(0.05), p25: at(0.25), p50: at(0.5), p75: at(0.75), p95: at(0.95) },
    best: endings[endings.length - 1],
    worst: endings[0],
    mean,
    actualHistoryEnding: actual.endingAccountValue,
    actualHistoryPercentile: Number((below / endings.length).toFixed(4)),
    lapsedCount: lapsed,
    lapseRate: Number((lapsed / count).toFixed(4)),
    spreadRatio: Number((endings[endings.length - 1] / Math.max(1, endings[0])).toFixed(2)),
    seed,
    plain:
      `${count.toLocaleString()} orderings of the same ${history.length} years. ` +
      `Ending values ran from ${endings[0].toLocaleString()} to ` +
      `${endings[endings.length - 1].toLocaleString()}, median ${at(0.5).toLocaleString()}. ` +
      `The order history actually arrived in ended at ` +
      `${actual.endingAccountValue.toLocaleString()}, which sits at the ` +
      `${Math.round((below / endings.length) * 100)}th percentile of every possible ordering. ` +
      (lapsed === 0
        ? 'No ordering produced a lapse.'
        : `${lapsed.toLocaleString()} orderings ended in lapse.`),
    provenance:
      `Every one of these ${count.toLocaleString()} paths contains all ${history.length} ` +
      `of the years ${params.startYear}-${params.endYear}, each exactly once. No return was ` +
      'invented, duplicated or omitted — only the order varies. This is a rearrangement ' +
      'of a record, not a model of the future, and no value here is derived from or ' +
      'applied to the buyer’s own illustration.',
  };
}
