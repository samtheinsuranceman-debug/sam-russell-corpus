/**
 * Time Machine — the three-panel presentation, with the AG 49-A line drawn in code.
 *
 * ## What this engine is for
 *
 * The thirty-year index history is the most persuasive true thing in this product.
 * It does not need help. What it needs is a presentation that shows it in full
 * without turning it into a policy projection the rate cap forbids — because the
 * moment history becomes a projection, it stops being history and starts being an
 * illustration, and illustrations are capped.
 *
 * That line is the whole design. This file draws it at the type level so it cannot
 * be crossed by accident or by enthusiasm.
 *
 * ## The distinction the regulation actually turns on
 *
 * INDEX HISTORY is a fact about an index. The S&P 500 returned 31.40% in 1995.
 * Applying a product's real cap, floor and participation rate to that year gives
 * the credit that crediting method would have produced. Both are facts. Neither is
 * capped, because neither is a depiction of what a policy will do.
 *
 * A POLICY PROJECTION is a depiction of non-guaranteed elements of a policy over a
 * period of years. Under AG 49-A the rate used to project those values may not
 * exceed the maximum illustrated rate derived from the benchmark index account.
 * That cap is not a suggestion and it is not defeated by routing the number
 * through an intermediate figure first.
 *
 * So: `IndexHistoryRow` may carry a 31.40% year. `ProjectionRow` may not. The
 * types are different, the functions that produce them are different, and
 * `projectPolicyValues` refuses a rate above the cap rather than trusting its
 * caller. A number cannot get from the first into the second without going
 * through a function that clamps it and says so.
 *
 * ## On deriving a credit from a scaled reference contract
 *
 * A variant was proposed in which a hypothetical contract — issued a century or
 * more ago, with premiums orders of magnitude larger, which no living person could
 * own — is illustrated within the cap, and its movement is then mapped by ratio
 * onto the buyer's own policy to present a much larger effective credit.
 *
 * The argument for it is that such a contract cannot be the buyer's policy, so a
 * depiction of it is not a supplemental illustration of the policy being sold and
 * Model Regulation #582 §8A never attaches. That argument is not frivolous and it
 * may well be right about §8A.
 *
 * It does not help, for a reason that sits one level up. Model #582 is issued
 * under Unfair Trade Practices Act authority, and NAIC Model #570 defines an
 * advertisement to include prepared sales talks and presentations for use by
 * agents — oral ones included, whether or not anything is printed or kept. The
 * test under both is whether the presentation creates a misleading impression
 * about the policy being sold. A construct whose only function is to deliver a
 * buyer an effective credit figure the cap exists to prevent meets that test no
 * matter whose name is on the hypothetical contract, and the fact that the
 * reference policy must be impossible for the ratio to be large is the thing an
 * examiner would notice first.
 *
 * Leaving no artifact does not help either. Market conduct examinations and
 * consumer complaints run on testimony, not files: the complaint arrives in year
 * six from the buyer, and their recollection is the evidence. A presentation
 * deliberately left unrecorded reads, to an examiner or to opposing counsel, as
 * knowledge that it would not survive being written down. And the practical
 * exposure is not the state fine — it is the carrier. Appointment agreements carry
 * field-conduct terms, and a termination for cause is reportable and ends a
 * distribution career.
 *
 * None of that is in this file as an opinion. It is here because the next engineer
 * to open this engine will have the same good idea, and should find the analysis
 * rather than repeat the work.
 *
 * What is built instead is the strongest lawful form: all thirty-plus years of
 * real history, at the product's real parameters, shown in full beside a capped
 * projection that is clearly labelled as the only thing being illustrated.
 */

import {
  ALL_INDEX_OPTIONS,
  RAW_INDEX_RETURNS,
  calculateCreditedRate,
  type IndexOption,
} from './indexCreditingData';

/** A fact about an index and a crediting method. Never capped. Never a projection. */
export interface IndexHistoryRow {
  readonly year: number;
  /** The index's actual annual return that year, as a percentage. */
  readonly indexReturnPct: number;
  /** What this product's cap, floor and participation would have credited. */
  readonly creditedPct: number;
  /** True when the floor did the work — the index fell and the credit held at the floor. */
  readonly floorProtected: boolean;
  /** True when the cap did the work — the index beat the cap and the credit was trimmed. */
  readonly capLimited: boolean;
}

/** A depiction of policy values over years. ALWAYS capped at the AG 49-A maximum. */
export interface ProjectionRow {
  readonly policyYear: number;
  readonly age: number;
  readonly premium: number;
  readonly accountValue: number;
  /** The rate used. Guaranteed never to exceed the AG 49-A maximum illustrated rate. */
  readonly rateUsed: number;
}

export interface Ag49Envelope {
  /**
   * The maximum illustrated rate from the CARRIER'S illustration system, derived
   * from the benchmark index account. This is a number that comes off a carrier
   * document. It is not computed here and must never be guessed.
   */
  readonly maximumIllustratedRate: number;
  /** Where that figure was read. */
  readonly source: string;
  /** ISO date read. */
  readonly readOn: string;
}

export class Ag49ViolationError extends Error {
  constructor(attempted: number, maximum: number) {
    super(
      `Refused to project policy values at ${(attempted * 100).toFixed(2)}%. ` +
        `AG 49-A caps the illustrated rate for this product at ` +
        `${(maximum * 100).toFixed(2)}%. Historical index performance above the cap ` +
        `may be shown as INDEX HISTORY — it may not be used to project policy values, ` +
        `directly or by derivation from any other figure.`,
    );
    this.name = 'Ag49ViolationError';
  }
}

/**
 * Panel 2. The real history, in full, at the product's real parameters.
 *
 * This is the panel that does the persuading, and every number in it is true and
 * checkable. Years where the index beat the cap are marked; years where the floor
 * caught a crash are marked. Both marks are the product's actual story.
 */
export function indexHistory(
  option: IndexOption,
  startYear: number,
  endYear: number,
): IndexHistoryRow[] {
  const rows: IndexHistoryRow[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    const raw = RAW_INDEX_RETURNS[option.index]?.[year];
    if (raw === undefined) continue;
    const credited = calculateCreditedRate(option, raw);
    rows.push({
      year,
      indexReturnPct: raw,
      creditedPct: credited,
      floorProtected: raw < 0 && credited >= 0,
      capLimited: option.cap !== null && credited >= option.cap - 1e-9 && raw > credited,
    });
  }
  return rows;
}

export interface HistorySummary {
  readonly years: number;
  readonly averageCreditedPct: number;
  readonly bestYear: { year: number; creditedPct: number } | null;
  readonly worstIndexYear: { year: number; indexReturnPct: number; creditedPct: number } | null;
  readonly yearsFloorProtected: number;
  readonly yearsCapLimited: number;
  /**
   * The average credit the history produced. Stated as history — NOT as a rate
   * anything may be projected at. `projectPolicyValues` will refuse it if it is
   * above the cap, which is the point.
   */
  readonly note: string;
}

export function summarizeHistory(rows: IndexHistoryRow[]): HistorySummary {
  if (rows.length === 0) {
    return {
      years: 0, averageCreditedPct: 0, bestYear: null, worstIndexYear: null,
      yearsFloorProtected: 0, yearsCapLimited: 0,
      note: 'No history available for this index and period.',
    };
  }
  const avg = rows.reduce((s, r) => s + r.creditedPct, 0) / rows.length;
  const best = rows.reduce((a, b) => (b.creditedPct > a.creditedPct ? b : a));
  const worst = rows.reduce((a, b) => (b.indexReturnPct < a.indexReturnPct ? b : a));
  return {
    years: rows.length,
    averageCreditedPct: Number(avg.toFixed(2)),
    bestYear: { year: best.year, creditedPct: best.creditedPct },
    worstIndexYear: {
      year: worst.year,
      indexReturnPct: worst.indexReturnPct,
      creditedPct: worst.creditedPct,
    },
    yearsFloorProtected: rows.filter((r) => r.floorProtected).length,
    yearsCapLimited: rows.filter((r) => r.capLimited).length,
    note:
      'This is what this crediting method would have produced on this index’s actual ' +
      'history. It is a record of the past, not a rate at which anything is projected.',
  };
}

/**
 * Panels 1 and 3. Policy values over years, at a rate that CANNOT exceed the cap.
 *
 * The clamp is not advisory. Passing a rate above the envelope throws, so a caller
 * cannot route a historical average — or any figure derived from one — into a
 * policy projection. That refusal is the mechanism this engine exists to provide.
 */
export function projectPolicyValues(params: {
  annualPremium: number;
  premiumYears: number;
  projectionYears: number;
  issueAge: number;
  rate: number;
  envelope: Ag49Envelope;
  /** Annual charge drag as a decimal of account value. */
  chargeDrag?: number;
}): ProjectionRow[] {
  const { annualPremium, premiumYears, projectionYears, issueAge, rate, envelope } = params;
  if (!Number.isFinite(rate) || rate < 0) {
    throw new RangeError('rate must be a finite, non-negative decimal');
  }
  if (rate > envelope.maximumIllustratedRate + 1e-9) {
    throw new Ag49ViolationError(rate, envelope.maximumIllustratedRate);
  }
  const drag = params.chargeDrag ?? 0.012;
  const rows: ProjectionRow[] = [];
  let av = 0;
  for (let y = 1; y <= projectionYears; y += 1) {
    const premium = y <= premiumYears ? annualPremium : 0;
    av = (av + premium) * (1 - drag);
    av = av * (1 + rate);
    rows.push({
      policyYear: y,
      age: issueAge + y,
      premium: Math.round(premium),
      accountValue: Math.round(av),
      rateUsed: rate,
    });
  }
  return rows;
}

export interface ThreePanel {
  /** Panel 1 — the illustrated policy, at the AG 49-A maximum. The only projection being illustrated. */
  readonly illustrated: { rows: ProjectionRow[]; label: string; rate: number };
  /** Panel 2 — the index's real history at this product's real parameters. Not a projection. */
  readonly history: { rows: IndexHistoryRow[]; summary: HistorySummary; label: string };
  /** Panel 3 — the guaranteed floor. What happens if the index never helps again. */
  readonly guaranteed: { rows: ProjectionRow[]; label: string; rate: number };
  readonly envelope: Ag49Envelope;
  readonly disclosures: readonly string[];
}

/**
 * The full presentation. Three panels, each labelled with what it is and is not.
 *
 * Panel 2 carries the thirty-year record in full, including years the index ran
 * far above the cap, because that is a true fact about the index and this product
 * caught what it caught. Panel 1 is the only thing being illustrated and it sits
 * at the cap. Panel 3 is the floor. A reader can see all three at once, and no
 * number moves from panel 2 into panel 1.
 */
export function buildThreePanel(params: {
  optionId: string;
  startYear: number;
  endYear: number;
  annualPremium: number;
  premiumYears: number;
  projectionYears: number;
  issueAge: number;
  envelope: Ag49Envelope;
  guaranteedRate?: number;
}): ThreePanel {
  const option = ALL_INDEX_OPTIONS.find((o) => o.id === params.optionId);
  if (!option) throw new Error(`Unknown index option: ${params.optionId}`);

  const rows = indexHistory(option, params.startYear, params.endYear);
  const summary = summarizeHistory(rows);
  const guaranteedRate = params.guaranteedRate ?? 0;

  return {
    illustrated: {
      rows: projectPolicyValues({ ...params, rate: params.envelope.maximumIllustratedRate }),
      rate: params.envelope.maximumIllustratedRate,
      label:
        `YOUR ILLUSTRATION — projected at ${(params.envelope.maximumIllustratedRate * 100).toFixed(2)}%, ` +
        'the maximum rate AG 49-A permits for this product. Non-guaranteed. ' +
        'This is the only panel that projects policy values.',
    },
    history: {
      rows,
      summary,
      label:
        `INDEX HISTORY — ${option.name} (${option.index}), ${params.startYear} to ${params.endYear}, ` +
        'with this product’s actual cap, floor and participation applied to each ' +
        'year’s real return. This is a record of what the index did and what this ' +
        'crediting method would have caught. It is NOT a projection of your policy ' +
        'and no value in your illustration is derived from it.',
    },
    guaranteed: {
      rows: projectPolicyValues({ ...params, rate: guaranteedRate }),
      rate: guaranteedRate,
      label:
        `GUARANTEED — projected at ${(guaranteedRate * 100).toFixed(2)}%. ` +
        'What the contract does if the index never credits again.',
    },
    envelope: params.envelope,
    disclosures: PRESENTATION_RULES.required,
  };
}

export const PRESENTATION_RULES = {
  required: [
    'Past index performance does not predict future results.',
    'Values shown outside the guaranteed panel are not guaranteed and will change.',
    'The illustrated rate is capped by AG 49-A and is not a projection of expected returns.',
    'The index history panel shows what an index did. It does not show what this policy will do.',
  ],
  /**
   * Sentences this presentation must never make. The first is the one that
   * matters: it is the whole reason the two row types are different types.
   */
  neverPrinted: [
    'Any policy value projected at a rate above the AG 49-A maximum illustrated rate, however that rate was arrived at — including by ratio, scaling, or derivation from a reference contract.',
    'That historical index performance is what this policy will credit.',
    'That a figure is compliant because each of its inputs was individually compliant.',
    'Any suggestion that the presentation may not be recorded, kept, or shown to the client’s own advisor.',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// HISTORICAL BACK-TEST AT AN ALTERNATE ISSUE AGE
// ═══════════════════════════════════════════════════════════════════════════
//
// ## What this is, and why it is different from the scaled-reference variant
//
// The variant rejected above worked by DERIVATION: illustrate an impossible
// contract inside the cap, then map its movement by ratio onto the buyer's policy
// to produce an effective credit the cap forbids. The number shown to the buyer
// was manufactured, and nothing in the index's history ever produced it.
//
// This is not that. There is no ratio, no scaling and no mapping. A hypothetical
// policy is issued at a chosen age in a chosen historical year and run forward
// through the index's ACTUAL annual returns, at the product's ACTUAL cap, floor
// and participation, with the ACTUAL cost of insurance for each attained age. The
// number at the end is not derived from anything. It is what that sequence of real
// years did to that policy.
//
// That is a back-test, and a back-test is a normal, disclosed instrument. Ensight,
// Zinnia, iPipeline and WinFlex all ship one. `runBacktest` already exists in this
// repository. The thing being added here is not the back-test — it is the two
// disclosures that make an alternate-age back-test honest, and a guard that makes
// them impossible to omit.
//
// ## The two things that make it misleading if left out
//
// 1. THE PRODUCT DID NOT EXIST. Today's caps, floors and participation rates were
//    not available in 1995. Applying current parameters to a historical index
//    series produces a true statement about the crediting METHOD and a false
//    impression about availability, unless it is said plainly. Every carrier
//    back-test discloses this and so does this one.
//
// 2. THE INSURED IS NOT THE BUYER. This is the one that actually matters, and it
//    is the reason for the guard below. Cost of insurance is the dominant driver
//    of an IUL's net performance, and it is not linear in age. On the table this
//    platform already uses, a 45-year-old is charged 0.0012 of the net amount at
//    risk and a 75-year-old is charged 0.0100 — more than eight times as much. A
//    back-test issued at 45 and shown to a 75-year-old is a true statement about a
//    45-year-old and tells the buyer almost nothing about their own contract.
//
// ## The guard
//
// `alternateAgeBacktest` REFUSES to return a back-test at an age other than the
// buyer's unless the buyer's own figures are computed in the same call. The two
// travel together or neither exists. A caller cannot obtain the younger number on
// its own, hold it up, and leave the buyer's real costs off the screen.
//
// That pairing is also the honest sales argument, and it is stronger than the
// alternative: here is what thirty real years did for someone who started at 45,
// here is what the same contract does for you at 75, and the gap between them is
// what waiting costs. Every number in that sentence is true and checkable.
//
// ## Before this is shown to anyone
//
// Get the carrier's written sign-off on the back-test format. This engine encodes
// the disclosures a back-test needs; it cannot encode a particular carrier's field
// conduct rules, and those are what govern an appointed producer.

/** The cost-of-insurance table this platform already uses, as a function. */
export function coiRateForAge(age: number): number {
  if (age <= 40) return 0.0008;
  if (age <= 50) return 0.0012;
  if (age <= 55) return 0.0018;
  if (age <= 60) return 0.0028;
  if (age <= 65) return 0.0042;
  if (age <= 70) return 0.0065;
  if (age <= 75) return 0.0100;
  if (age <= 80) return 0.0160;
  if (age <= 85) return 0.0220;
  if (age <= 90) return 0.0180;
  if (age <= 95) return 0.0080;
  return 0;
}

export interface BacktestYear {
  readonly calendarYear: number;
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly premium: number;
  readonly indexReturnPct: number;
  readonly creditedPct: number;
  readonly coiCharge: number;
  readonly accountValue: number;
}

export interface AlternateAgeBacktest {
  readonly issueAge: number;
  readonly startYear: number;
  readonly rows: BacktestYear[];
  readonly finalAccountValue: number;
  readonly totalPremiumPaid: number;
  readonly totalCoiCharged: number;
  readonly yearsFloorProtected: number;
  readonly yearsCapLimited: number;
}

function runBacktestAtAge(params: {
  option: IndexOption;
  issueAge: number;
  startYear: number;
  annualPremium: number;
  premiumYears: number;
  years: number;
  specifiedAmount: number;
}): AlternateAgeBacktest {
  const rows: BacktestYear[] = [];
  let av = 0;
  let totalPremium = 0;
  let totalCoi = 0;
  let floored = 0;
  let capped = 0;

  for (let i = 0; i < params.years; i += 1) {
    const calendarYear = params.startYear + i;
    const raw = RAW_INDEX_RETURNS[params.option.index]?.[calendarYear];
    if (raw === undefined) break;

    const attainedAge = params.issueAge + i;
    const premium = i < params.premiumYears ? params.annualPremium : 0;
    totalPremium += premium;

    const netAmountAtRisk = Math.max(0, params.specifiedAmount - av);
    const coiCharge = netAmountAtRisk * coiRateForAge(attainedAge);
    totalCoi += coiCharge;

    const afterCharges = Math.max(0, av + premium - coiCharge);
    const creditedPct = calculateCreditedRate(params.option, raw);
    if (raw < 0 && creditedPct >= 0) floored += 1;
    if (params.option.cap !== null && creditedPct >= params.option.cap - 1e-9 && raw > creditedPct) capped += 1;

    av = afterCharges * (1 + creditedPct / 100);

    rows.push({
      calendarYear,
      policyYear: i + 1,
      attainedAge,
      premium: Math.round(premium),
      indexReturnPct: raw,
      creditedPct,
      coiCharge: Math.round(coiCharge),
      accountValue: Math.round(av),
    });
  }

  return {
    issueAge: params.issueAge,
    startYear: params.startYear,
    rows,
    finalAccountValue: Math.round(av),
    totalPremiumPaid: Math.round(totalPremium),
    totalCoiCharged: Math.round(totalCoi),
    yearsFloorProtected: floored,
    yearsCapLimited: capped,
  };
}

export interface PairedBacktest {
  /** The alternate-age run. Never returned without `buyer`. */
  readonly hypothetical: AlternateAgeBacktest;
  /** The same thirty years, at the buyer's ACTUAL age. This is the honest comparison. */
  readonly buyer: AlternateAgeBacktest;
  /** What the age difference cost, in the only terms that matter. */
  readonly ageGap: {
    readonly years: number;
    readonly coiMultipleAtIssue: number;
    readonly extraCoiPaid: number;
    readonly endingValueDifference: number;
    readonly plain: string;
  };
  readonly disclosures: readonly string[];
}

export class UnpairedBacktestError extends Error {
  constructor() {
    super(
      'Refused to produce an alternate-age back-test without the buyer’s own ' +
        'figures. Cost of insurance is the dominant driver of net performance and ' +
        'is not linear in age, so a run issued at a younger age is a true statement ' +
        'about a younger person and says little about this buyer’s contract. The ' +
        'two runs are returned together or not at all.',
    );
    this.name = 'UnpairedBacktestError';
  }
}

/**
 * Thirty real years, run twice: once at a chosen issue age, once at the buyer's.
 *
 * Every number in both runs comes from the index's actual annual returns, the
 * product's actual crediting parameters, and the actual cost of insurance for each
 * attained age. Nothing is scaled, mapped or derived.
 *
 * The buyer's run is not optional. `buyerAge` is a required parameter and the
 * function throws without it, because an alternate-age back-test shown on its own
 * is the part that would mislead.
 */
export function alternateAgeBacktest(params: {
  optionId: string;
  /** The age the hypothetical policy is issued at. */
  hypotheticalIssueAge: number;
  /** The buyer's ACTUAL age today. Required. There is no default. */
  buyerAge: number;
  startYear: number;
  years: number;
  annualPremium: number;
  premiumYears: number;
  specifiedAmount: number;
}): PairedBacktest {
  if (!Number.isFinite(params.buyerAge) || params.buyerAge <= 0) {
    throw new UnpairedBacktestError();
  }
  const option = ALL_INDEX_OPTIONS.find((o) => o.id === params.optionId);
  if (!option) throw new Error(`Unknown index option: ${params.optionId}`);

  const common = {
    option,
    startYear: params.startYear,
    annualPremium: params.annualPremium,
    premiumYears: params.premiumYears,
    years: params.years,
    specifiedAmount: params.specifiedAmount,
  };

  const hypothetical = runBacktestAtAge({ ...common, issueAge: params.hypotheticalIssueAge });
  const buyer = runBacktestAtAge({ ...common, issueAge: params.buyerAge });

  const gapYears = params.buyerAge - params.hypotheticalIssueAge;
  const coiYoung = coiRateForAge(params.hypotheticalIssueAge);
  const coiBuyer = coiRateForAge(params.buyerAge);
  const multiple = coiYoung > 0 ? Number((coiBuyer / coiYoung).toFixed(1)) : 0;

  return {
    hypothetical,
    buyer,
    ageGap: {
      years: gapYears,
      coiMultipleAtIssue: multiple,
      extraCoiPaid: buyer.totalCoiCharged - hypothetical.totalCoiCharged,
      endingValueDifference: hypothetical.finalAccountValue - buyer.finalAccountValue,
      plain:
        gapYears > 0
          ? `Both columns run the same ${hypothetical.rows.length} real calendar years ` +
            `at the same premiums and the same crediting parameters. The only ` +
            `difference is age. At issue, the cost of insurance is ${multiple}x higher ` +
            `at ${params.buyerAge} than at ${params.hypotheticalIssueAge}, and over the ` +
            `period that difference comes to ` +
            `${(buyer.totalCoiCharged - hypothetical.totalCoiCharged).toLocaleString()} ` +
            `in additional charges. That gap is what waiting costs.`
          : 'The buyer is at or below the hypothetical issue age, so no age gap applies.',
    },
    disclosures: BACKTEST_DISCLOSURES,
  };
}

/**
 * Required beside any back-test. The first two are the ones that make an
 * alternate-age run honest rather than misleading; they are not boilerplate.
 */
export const BACKTEST_DISCLOSURES: readonly string[] = [
  'This is a HYPOTHETICAL back-test, not an illustration and not a projection. No policy was issued on these terms and no policyholder received these values.',
  'The insured in the left column is not the buyer. Cost of insurance rises steeply with age and is the dominant driver of net performance; the buyer’s own figures are shown beside it for that reason.',
  'Current product parameters — cap, floor and participation rate — have been applied to historical index returns. This product and these parameters were not available during the historical period shown.',
  'Index returns shown are actual historical annual returns. Past performance does not predict future results.',
  'Nothing in this back-test is guaranteed, and no value in the buyer’s own illustration is derived from it.',
];

// ═══════════════════════════════════════════════════════════════════════════
// ARCHAEOLOGY — what an account WOULD HAVE DONE, across allocations and periods
// ═══════════════════════════════════════════════════════════════════════════
//
// ## The distinction, stated once and relied on below
//
// AG 49-A caps the rate used to PROJECT non-guaranteed policy values forward. It
// governs a forward-looking depiction. A record of what a crediting method would
// have produced on index returns that have already happened is not a projection
// and is not governed by that cap. It is a back-test, and the numbers in it are
// history rather than forecast.
//
// This section is that record, made explorable: any allocation across the
// available index options, over any available window, with the real cap, floor,
// participation and spread of each option applied to each year's real return.
//
// Nothing here produces a rate that anything is projected at. `projectPolicyValues`
// above still refuses any rate over the AG 49-A maximum, and that refusal is what
// keeps the two categories apart in code rather than in a policy memo.
//
// ## Why this reports every window and not the good one
//
// The single most misleading thing a back-test can do is pick its start year. The
// same allocation over the same length of time produces very different outcomes
// depending on when it started, because sequence of returns dominates. A window
// beginning in 1995 catches five straight capped years before the dot-com fall; a
// window beginning in 2000 opens with three negative index years and earns the
// floor three times before it earns anything.
//
// So `rollingWindows` computes EVERY available start year and reports the full
// distribution — best, worst, median, and the count. And `bestWindow` cannot be
// called on its own: it takes a completed distribution as its argument, so the
// best case is reachable only by way of the set it came from. An engine that can
// only produce the flattering number is an engine that will eventually produce
// only the flattering number.
//
// That is also the honest version of the sales argument. "Here is the best
// thirty-year window and here is the worst, and you are buying the shape that
// survived both" is a stronger sentence than a single cherry, and it is one that
// holds up when a client's own advisor checks it.

export interface Allocation {
  readonly optionId: string;
  /** Percentage of premium directed to this option, 0-100. */
  readonly percent: number;
}

export interface AllocationRunYear {
  readonly calendarYear: number;
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly premium: number;
  /**
   * Premium-weighted credit across the allocation, as a percentage, at full
   * precision. `accountValue` is derived from exactly this figure, so a view that
   * rounds it must round for display only.
   */
  readonly blendedCreditedPct: number;
  readonly coiCharge: number;
  readonly accountValue: number;
  readonly perOption: ReadonlyArray<{
    readonly optionId: string;
    readonly percent: number;
    readonly indexReturnPct: number;
    readonly creditedPct: number;
  }>;
}

export interface AllocationRun {
  readonly label: string;
  readonly allocation: readonly Allocation[];
  readonly startYear: number;
  readonly endYear: number;
  readonly issueAge: number;
  readonly rows: AllocationRunYear[];
  readonly totalPremiumPaid: number;
  readonly totalCoiCharged: number;
  readonly endingAccountValue: number;
  /** Ending value divided by premium paid. A multiple, not a rate. */
  readonly multipleOfPremium: number;
  readonly yearsFloorProtected: number;
  readonly yearsCapLimited: number;
  readonly worstIndexYear: { calendarYear: number; indexReturnPct: number; creditedPct: number } | null;
}

function resolveAllocation(allocation: readonly Allocation[]): Array<{ option: IndexOption; weight: number }> {
  const live = allocation.filter((a) => a.percent > 0);
  if (live.length === 0) throw new Error('Allocation must direct premium to at least one option.');
  const total = live.reduce((s, a) => s + a.percent, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new Error(`Allocation must total 100% (got ${total.toFixed(1)}%).`);
  }
  return live.map((a) => {
    const option = ALL_INDEX_OPTIONS.find((o) => o.id === a.optionId);
    if (!option) throw new Error(`Unknown index option: ${a.optionId}`);
    return { option, weight: a.percent / 100 };
  });
}

/**
 * One allocation, one window. What the account would have done.
 *
 * Every credit is the option's real parameters applied to that year's real index
 * return. COI is the real charge for the attained age. Nothing is projected.
 */
export function runAllocation(params: {
  label?: string;
  allocation: readonly Allocation[];
  startYear: number;
  years: number;
  issueAge: number;
  annualPremium: number;
  premiumYears: number;
  specifiedAmount: number;
}): AllocationRun {
  const resolved = resolveAllocation(params.allocation);
  const rows: AllocationRunYear[] = [];
  let av = 0;
  let totalPremium = 0;
  let totalCoi = 0;
  let floored = 0;
  let capped = 0;
  let worst: AllocationRun['worstIndexYear'] = null;

  for (let i = 0; i < params.years; i += 1) {
    const calendarYear = params.startYear + i;
    const perOption: Array<{ optionId: string; percent: number; indexReturnPct: number; creditedPct: number }> = [];
    let blended = 0;
    let haveData = false;

    for (const { option, weight } of resolved) {
      const raw = RAW_INDEX_RETURNS[option.index]?.[calendarYear];
      if (raw === undefined) continue;
      haveData = true;
      const credited = calculateCreditedRate(option, raw);
      blended += credited * weight;
      perOption.push({ optionId: option.id, percent: weight * 100, indexReturnPct: raw, creditedPct: credited });
      if (worst === null || raw < worst.indexReturnPct) {
        worst = { calendarYear, indexReturnPct: raw, creditedPct: credited };
      }
    }
    if (!haveData) break;

    const attainedAge = params.issueAge + i;
    const premium = i < params.premiumYears ? params.annualPremium : 0;
    totalPremium += premium;

    const netAmountAtRisk = Math.max(0, params.specifiedAmount - av);
    const coiCharge = netAmountAtRisk * coiRateForAge(attainedAge);
    totalCoi += coiCharge;

    const afterCharges = Math.max(0, av + premium - coiCharge);
    av = afterCharges * (1 + blended / 100);

    const anyFloored = perOption.some((p) => p.indexReturnPct < 0 && p.creditedPct >= 0);
    const anyCapped = perOption.some((p) => {
      const opt = resolved.find((r) => r.option.id === p.optionId)!.option;
      return opt.cap !== null && p.creditedPct >= opt.cap - 1e-9 && p.indexReturnPct > p.creditedPct;
    });
    if (anyFloored) floored += 1;
    if (anyCapped) capped += 1;

    rows.push({
      calendarYear,
      policyYear: i + 1,
      attainedAge,
      premium: Math.round(premium),
      // Stored at full precision on purpose. The account value above is computed
      // from the unrounded blend, so rounding here would publish a credit that
      // does not reproduce the balance printed beside it. Round at the edge, in
      // the view, never in the record.
      blendedCreditedPct: blended,
      coiCharge: Math.round(coiCharge),
      accountValue: Math.round(av),
      perOption,
    });
  }

  return {
    label: params.label ?? resolved.map((r) => `${Math.round(r.weight * 100)}% ${r.option.name}`).join(' + '),
    allocation: params.allocation,
    startYear: params.startYear,
    endYear: rows.length > 0 ? rows[rows.length - 1].calendarYear : params.startYear,
    issueAge: params.issueAge,
    rows,
    totalPremiumPaid: Math.round(totalPremium),
    totalCoiCharged: Math.round(totalCoi),
    endingAccountValue: Math.round(av),
    multipleOfPremium: totalPremium > 0 ? Number((av / totalPremium).toFixed(2)) : 0,
    yearsFloorProtected: floored,
    yearsCapLimited: capped,
    worstIndexYear: worst,
  };
}

/**
 * Several allocations, one window. Which mix would have done what.
 *
 * Returned in the caller's order, never re-sorted to put a winner first — the
 * ranking is the reader's job and a pre-sorted list is an argument disguised as a
 * table.
 */
export function compareAllocations(params: {
  allocations: ReadonlyArray<{ label?: string; allocation: readonly Allocation[] }>;
  startYear: number;
  years: number;
  issueAge: number;
  annualPremium: number;
  premiumYears: number;
  specifiedAmount: number;
}): AllocationRun[] {
  if (params.allocations.length === 0) throw new Error('Nothing to compare.');
  return params.allocations.map((a) =>
    runAllocation({ ...params, label: a.label, allocation: a.allocation }),
  );
}

export interface WindowOutcome {
  readonly startYear: number;
  readonly endYear: number;
  readonly endingAccountValue: number;
  readonly multipleOfPremium: number;
  readonly yearsFloorProtected: number;
  readonly yearsCapLimited: number;
}

export interface WindowDistribution {
  readonly allocationLabel: string;
  readonly windowLength: number;
  /** Every available start year, in chronological order. Never filtered. */
  readonly windows: readonly WindowOutcome[];
  readonly best: WindowOutcome;
  readonly worst: WindowOutcome;
  readonly median: WindowOutcome;
  readonly plain: string;
}

/**
 * The same allocation over EVERY available start year.
 *
 * This is the guard against the most misleading thing a back-test can do, which is
 * choose when to start. Sequence of returns dominates: a window opening in 1995
 * catches capped year after capped year before the dot-com fall, and one opening
 * in 2000 earns the floor three times before it earns anything. Reporting one of
 * those and not the other is not analysis.
 */
export function rollingWindows(params: {
  allocation: readonly Allocation[];
  label?: string;
  windowLength: number;
  issueAge: number;
  annualPremium: number;
  premiumYears: number;
  specifiedAmount: number;
  firstYear?: number;
  lastYear?: number;
}): WindowDistribution {
  const first = params.firstYear ?? MIN_HISTORY_YEAR;
  const last = params.lastYear ?? MAX_HISTORY_YEAR;
  const windows: WindowOutcome[] = [];

  for (let start = first; start + params.windowLength - 1 <= last; start += 1) {
    const run = runAllocation({
      allocation: params.allocation,
      startYear: start,
      years: params.windowLength,
      issueAge: params.issueAge,
      annualPremium: params.annualPremium,
      premiumYears: params.premiumYears,
      specifiedAmount: params.specifiedAmount,
    });
    if (run.rows.length < params.windowLength) continue;
    windows.push({
      startYear: start,
      endYear: run.endYear,
      endingAccountValue: run.endingAccountValue,
      multipleOfPremium: run.multipleOfPremium,
      yearsFloorProtected: run.yearsFloorProtected,
      yearsCapLimited: run.yearsCapLimited,
    });
  }

  if (windows.length === 0) {
    throw new Error(
      `No complete ${params.windowLength}-year window exists in ${first}-${last}. ` +
        'Shorten the window or widen the period.',
    );
  }

  const byValue = [...windows].sort((a, b) => a.endingAccountValue - b.endingAccountValue);
  const best = byValue[byValue.length - 1];
  const worst = byValue[0];
  const median = byValue[Math.floor(byValue.length / 2)];
  const label = params.label ?? runAllocation({ ...params, startYear: first, years: 1 }).label;

  return {
    allocationLabel: label,
    windowLength: params.windowLength,
    windows,
    best,
    worst,
    median,
    plain:
      `${windows.length} complete ${params.windowLength}-year windows exist in this ` +
      `history. The best started in ${best.startYear} and ended at ` +
      `${best.endingAccountValue.toLocaleString()} (${best.multipleOfPremium}x premium). ` +
      `The worst started in ${worst.startYear} and ended at ` +
      `${worst.endingAccountValue.toLocaleString()} (${worst.multipleOfPremium}x). ` +
      `The median started in ${median.startYear} at ${median.multipleOfPremium}x. ` +
      'Same allocation, same length, same product — only the start year differs. ' +
      'That spread is sequence-of-returns risk, and it is the reason a single ' +
      'window is not an answer.',
  };
}

/**
 * The best window — reachable only THROUGH the distribution it came from.
 *
 * This signature is the point. There is no function that computes a best case
 * without first computing every case, so the flattering number cannot be produced
 * on its own, and anything that displays it has the worst and the median in hand.
 */
export function bestWindow(distribution: WindowDistribution): {
  outcome: WindowOutcome;
  mustAlsoShow: { worst: WindowOutcome; median: WindowOutcome };
  caution: string;
} {
  return {
    outcome: distribution.best,
    mustAlsoShow: { worst: distribution.worst, median: distribution.median },
    caution:
      `This is the best of ${distribution.windows.length} windows. Showing it ` +
      'without the worst and the median misrepresents the record it came from.',
  };
}

export const MIN_HISTORY_YEAR = 1994;
export const MAX_HISTORY_YEAR = 2025;

/**
 * Required beside any archaeology view. Shorter than the back-test list because
 * this is not issued at an alternate age — but the first line is the one that
 * keeps the whole section on the right side of the category line.
 */
export const ARCHAEOLOGY_DISCLOSURES: readonly string[] = [
  'This is a historical record of what a crediting method would have produced on index returns that have already occurred. It is not a projection and no policy value is projected from it.',
  'Current product parameters have been applied to historical index returns. These products and parameters were not available throughout the period shown.',
  'Index returns are actual historical annual returns. Past performance does not predict future results.',
  'Outcomes vary substantially with start year. Any single window is one draw from the distribution shown, not a representative result.',
];
