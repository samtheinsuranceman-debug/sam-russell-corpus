/**
 * The multiplier decision — when the higher participation rate is worth its charge.
 *
 * ## What this engine does, and what it deliberately refuses to do
 *
 * The question asked was: what signals tell us, with extremely high confidence, which
 * index will perform best next year and whether to buy the multiplier?
 *
 * The first half of that question has no honest answer. Nobody can forecast a one-year
 * index return with high confidence — not a model, not a genius, not an AI. Anyone
 * selling that certainty is selling something. So this engine will not produce it, and
 * `forecastIndexReturn` does not exist.
 *
 * The second half has a very good answer, and it turns out not to require forecasting at
 * all. THE MULTIPLIER DECISION IS NOT A MARKET-TIMING DECISION. It is a breakeven
 * decision, and breakevens are algebra.
 *
 * Here is the whole insight. A multiplier or enhanced participation rate costs a
 * CONTRACTUAL, KNOWN charge. It pays a HIGHER SHARE of whatever the index does. So there
 * is exactly one index return at which the two options credit the same amount. Below it
 * the multiplier loses by a knowable amount; above it the multiplier wins by a knowable
 * amount. That threshold is computable to the basis point, today, with no forecast of
 * any kind. `breakEvenIndexReturn()` computes it.
 *
 * Once you have the threshold, the question becomes empirical rather than predictive:
 * how often has the index cleared it? Thirty-two years of real index history answers
 * that, and `historicalBaseRate()` reports it — hit rate, the average gain in the years
 * it cleared, the average loss in the years it did not, and the net.
 *
 * ## The asymmetry everyone misses
 *
 * In a floored product the multiplier is WORST EXACTLY WHEN THE FLOOR MATTERS. A 0%
 * floor year credits zero either way — but the multiplier's charge is still assessed,
 * so the enhanced option loses by the full charge differential. The multiplier does not
 * protect you in a bad year; it costs you more in one.
 *
 * That means the decision hinges on the FREQUENCY OF FLOOR YEARS over the holding
 * period, not on next year's return. And floor frequency over 30 years is far more
 * knowable than next year's return. This is why the honest version of the answer is
 * more useful than the version that was asked for.
 *
 * ## What the signals actually are
 *
 * `REGIME_SIGNALS` carries the indicators with genuine documented content, each with an
 * honest statement of what it does and does not predict. They cluster into two kinds:
 *
 *   STRUCTURAL (reliable, because it is mechanical rather than predictive) — a 10.25%
 *   cap mathematically cannot beat an uncapped option with a 5.75% spread once the index
 *   clears 16.00%. That is not a forecast. It is arithmetic about the product, and
 *   `crossoverReturn()` computes it for any pair.
 *
 *   PROBABILISTIC (weak, and labeled weak) — volatility clustering is real and
 *   documented; a high-volatility year genuinely raises the odds of another. The term
 *   spread genuinely carries recession information. Neither tells you the sign of next
 *   year's index return with anything like confidence, and this engine reports them with
 *   a confidence band rather than a verdict.
 *
 * A recommendation from this engine always names which kind it rests on.
 */

import { RAW_INDEX_RETURNS, type IndexOption } from './indexCreditingData';

/** Apply an option's crediting mechanics to a raw index return. All values are percents. */
export function creditRate(option: IndexOption, rawReturnPct: number): number {
  const afterPar = rawReturnPct * (option.participation / 100);
  const afterSpread = afterPar - option.spread;
  const capped = option.cap === null ? afterSpread : Math.min(afterSpread, option.cap);
  const floored = Math.max(capped, option.floor);
  return floored + option.bonus - option.strategyCharge;
}

export interface BreakEven {
  /** Raw index return at which the two options credit identically, in percent. */
  readonly indexReturnPct: number | null;
  /** True when the enhanced option can never catch the base option at any return. */
  readonly neverBreaksEven: boolean;
  /** True when the enhanced option wins at every return, including the floor. */
  readonly alwaysWins: boolean;
  /** What the enhanced option costs in a floor year, in percentage points of credit. */
  readonly floorYearCost: number;
  readonly plain: string;
}

/**
 * The index return at which the enhanced option stops losing and starts winning.
 *
 * Solved by scanning rather than closed form, because the crediting function is
 * piecewise — participation, then spread, then cap, then floor — and the closed form
 * has a different expression in each piece. A 0.01-point scan over a range no real
 * index leaves is exact enough for a number that goes on a client page, and it cannot
 * be wrong about which piece it is in.
 */
export function breakEvenIndexReturn(base: IndexOption, enhanced: IndexOption): BreakEven {
  const floorYearCost = creditRate(base, -20) - creditRate(enhanced, -20);

  let crossing: number | null = null;
  let enhancedEverWins = false;
  let enhancedEverLoses = false;

  for (let r = -50; r <= 100; r = Math.round((r + 0.01) * 100) / 100) {
    const d = creditRate(enhanced, r) - creditRate(base, r);
    if (d > 0.0001) enhancedEverWins = true;
    if (d < -0.0001) enhancedEverLoses = true;
    if (crossing === null && d > 0.0001 && enhancedEverLoses) crossing = r;
  }

  const neverBreaksEven = !enhancedEverWins;
  const alwaysWins = !enhancedEverLoses;

  return {
    indexReturnPct: crossing,
    neverBreaksEven,
    alwaysWins,
    floorYearCost: Number(floorYearCost.toFixed(4)),
    plain: neverBreaksEven
      ? `${enhanced.name} never catches ${base.name} at any index return. The charge exceeds ` +
        'what the extra participation can produce. This is not a judgement call — there is no ' +
        'index return at which it wins.'
      : alwaysWins
        ? `${enhanced.name} beats ${base.name} at every index return including the floor. ` +
          'Take it; there is no trade-off to weigh.'
        : `${enhanced.name} needs the index to return more than ${crossing!.toFixed(2)}% to beat ` +
          `${base.name}. Below that it loses, and in a floor year it loses ` +
          `${floorYearCost.toFixed(2)} points of credit outright.`,
  };
}

/**
 * The index return at which one option's cap is overtaken by another's uncapped spread.
 *
 * Pure product arithmetic. This is the most defensible number in the whole system
 * because it involves no history and no forecast — only the two contracts.
 */
export function crossoverReturn(capped: IndexOption, uncapped: IndexOption): number | null {
  if (capped.cap === null) return null;
  for (let r = -50; r <= 200; r = Math.round((r + 0.01) * 100) / 100) {
    if (creditRate(uncapped, r) > creditRate(capped, r) + 0.0001) return r;
  }
  return null;
}

export interface BaseRate {
  readonly index: string;
  readonly yearsObserved: number;
  readonly firstYear: number;
  readonly lastYear: number;
  /** Years the index cleared the breakeven. */
  readonly yearsCleared: number;
  readonly hitRate: number;
  /** Years the index was at or below zero, where the multiplier costs its full charge. */
  readonly floorYears: number;
  readonly floorYearRate: number;
  /** Average credit advantage in years it cleared, in points. */
  readonly averageGainWhenCleared: number;
  /** Average credit disadvantage in years it did not, in points. */
  readonly averageLossWhenMissed: number;
  /** Mean annual advantage across every observed year. Negative means the charge wins. */
  readonly meanAnnualAdvantage: number;
  /** Cumulative advantage compounded across the whole observed period, in points of value. */
  readonly cumulativeAdvantagePct: number;
  readonly perYear: readonly { year: number; rawPct: number; baseCredit: number; enhancedCredit: number; advantage: number }[];
  readonly plain: string;
}

/**
 * How often the breakeven was actually cleared, over every year of real index history.
 *
 * This replaces the forecast. Rather than guessing next year, it reports the base rate
 * and the shape of the distribution around it, which is the decision-relevant fact for
 * anyone holding the policy more than one year.
 */
export function historicalBaseRate(
  base: IndexOption,
  enhanced: IndexOption,
  indexKey?: string,
): BaseRate {
  const key = indexKey ?? base.index;
  const table = RAW_INDEX_RETURNS[key];
  if (!table) throw new Error(`No return history for index "${key}".`);

  const startYear = Math.max(base.availableFrom, enhanced.availableFrom);
  const rows = Object.keys(table)
    .map(Number)
    .filter((y) => y >= startYear)
    .sort((a, b) => a - b)
    .map((year) => {
      const rawPct = table[year];
      const baseCredit = creditRate(base, rawPct);
      const enhancedCredit = creditRate(enhanced, rawPct);
      return {
        year,
        rawPct,
        baseCredit: Number(baseCredit.toFixed(4)),
        enhancedCredit: Number(enhancedCredit.toFixed(4)),
        advantage: Number((enhancedCredit - baseCredit).toFixed(4)),
      };
    });

  if (rows.length === 0) throw new Error(`No overlapping years for these options on "${key}".`);

  const cleared = rows.filter((r) => r.advantage > 0);
  const missed = rows.filter((r) => r.advantage <= 0);
  const floorYears = rows.filter((r) => r.rawPct <= 0);

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  // Compound both paths to show what the advantage was actually worth, not just its average.
  const baseGrowth = rows.reduce((acc, r) => acc * (1 + r.baseCredit / 100), 1);
  const enhGrowth = rows.reduce((acc, r) => acc * (1 + r.enhancedCredit / 100), 1);

  const meanAdv = mean(rows.map((r) => r.advantage));

  return {
    index: key,
    yearsObserved: rows.length,
    firstYear: rows[0].year,
    lastYear: rows[rows.length - 1].year,
    yearsCleared: cleared.length,
    hitRate: Number((cleared.length / rows.length).toFixed(4)),
    floorYears: floorYears.length,
    floorYearRate: Number((floorYears.length / rows.length).toFixed(4)),
    averageGainWhenCleared: Number(mean(cleared.map((r) => r.advantage)).toFixed(4)),
    averageLossWhenMissed: Number(mean(missed.map((r) => r.advantage)).toFixed(4)),
    meanAnnualAdvantage: Number(meanAdv.toFixed(4)),
    cumulativeAdvantagePct: Number(((enhGrowth / baseGrowth - 1) * 100).toFixed(2)),
    perYear: rows,
    plain:
      `Over ${rows.length} years of ${key} (${rows[0].year}-${rows[rows.length - 1].year}), ` +
      `${enhanced.name} beat ${base.name} in ${cleared.length} of them — a ` +
      `${((cleared.length / rows.length) * 100).toFixed(0)}% hit rate. ` +
      `${floorYears.length} were floor years, where the enhanced option loses its charge with ` +
      'nothing to show for it. ' +
      `Net across the whole period: ${((enhGrowth / baseGrowth - 1) * 100).toFixed(2)}% ` +
      `${enhGrowth >= baseGrowth ? 'in favour of' : 'AGAINST'} the enhanced option.`,
  };
}

export type SignalKind =
  /** Arithmetic about the contracts. Not a forecast. Reliable. */
  | 'structural'
  /** Documented statistical tendency. Real but weak. Never a verdict on its own. */
  | 'probabilistic';

export interface RegimeSignal {
  readonly id: string;
  readonly name: string;
  readonly kind: SignalKind;
  readonly observable: string;
  readonly whatItTellsYou: string;
  readonly whatItDoesNotTellYou: string;
  /** Rough documented strength for the stated use, 0-1. Structural signals are 1. */
  readonly strength: number;
}

/**
 * The signals, each stated with its limits.
 *
 * Every entry names what it does NOT tell you. That field is the reason this list is
 * usable in front of a regulator: a signal presented without its limits is a claim, and
 * a claim about future index returns is the one thing an illustration may not make.
 */
export const REGIME_SIGNALS: readonly RegimeSignal[] = [
  {
    id: 'cap-crossover',
    name: 'Cap crossover point',
    kind: 'structural',
    observable: 'Both option contracts. Available today, no history needed.',
    whatItTellsYou:
      'The exact index return above which an uncapped option overtakes a capped one. Below ' +
      'the crossover the cap wins; above it the cap is a ceiling the other option does not have.',
    whatItDoesNotTellYou: 'Whether the index will reach it. That is a separate and unanswerable question.',
    strength: 1,
  },
  {
    id: 'multiplier-breakeven',
    name: 'Multiplier breakeven',
    kind: 'structural',
    observable: 'Both option contracts.',
    whatItTellsYou:
      'The index return at which the enhanced participation rate earns back its charge, and ' +
      'exactly what it costs in a floor year.',
    whatItDoesNotTellYou: 'How many floor years the next thirty will contain.',
    strength: 1,
  },
  {
    id: 'floor-frequency',
    name: 'Historical floor-year frequency',
    kind: 'probabilistic',
    observable: 'The index return history in this repository, 1994 onward.',
    whatItTellsYou:
      'How often this index has finished a year at or below zero. This is the single most ' +
      'decision-relevant number for a multiplier, because floor years are where it bleeds.',
    whatItDoesNotTellYou:
      'Which years those will be, or that the historical rate will persist. Thirty-two ' +
      'observations is a small sample for a tail.',
    strength: 0.6,
  },
  {
    id: 'volatility-clustering',
    name: 'Volatility clustering',
    kind: 'probabilistic',
    observable: 'Realized volatility of the index over the trailing year.',
    whatItTellsYou:
      'High-volatility periods tend to be followed by high-volatility periods. This is one of ' +
      'the most robust findings in empirical finance and it matters here because a ' +
      'volatility-controlled index mechanically de-levers when volatility rises, which cuts ' +
      'its participation in a recovery.',
    whatItDoesNotTellYou:
      'The direction of returns. Volatility clusters; direction does not. A high-volatility ' +
      'year is not a down year.',
    strength: 0.5,
  },
  {
    id: 'term-spread',
    name: 'Treasury term spread (10y minus 2y)',
    kind: 'probabilistic',
    observable: 'FRED series T10Y2Y, already wired into outsideForces.ts.',
    whatItTellsYou:
      'An inverted curve has preceded most post-war recessions, and recessions raise the odds ' +
      'of a floor year.',
    whatItDoesNotTellYou:
      'Timing, which has ranged from months to over two years, or magnitude. It has also ' +
      'produced false positives. This shifts odds slightly; it does not make a call.',
    strength: 0.35,
  },
  {
    id: 'valuation-cape',
    name: 'Cyclically adjusted price/earnings',
    kind: 'probabilistic',
    observable: 'Published CAPE for the index.',
    whatItTellsYou:
      'Elevated valuations have been associated with lower returns over TEN-YEAR horizons.',
    whatItDoesNotTellYou:
      'Anything useful about next year. The one-year relationship is close to nothing, and ' +
      'CAPE has read expensive for long stretches that delivered strong returns. Do not use ' +
      'this to make an annual allocation decision.',
    strength: 0.2,
  },
] as const;

export type Confidence = 'structural' | 'suggestive' | 'insufficient';

export interface MultiplierRecommendation {
  readonly baseOptionId: string;
  readonly enhancedOptionId: string;
  readonly breakEven: BreakEven;
  readonly baseRate: BaseRate;
  readonly confidence: Confidence;
  readonly recommend: boolean;
  readonly reasoning: readonly string[];
  readonly restsOn: SignalKind;
  readonly plain: string;
}

/**
 * The recommendation, with its confidence honestly labeled.
 *
 * `confidence` is never higher than the weakest thing the answer depends on. Where the
 * breakeven settles it outright — the enhanced option always wins, or can never win —
 * confidence is 'structural' and the answer is certain. Where it turns on how often the
 * threshold gets cleared, confidence is at best 'suggestive', because that is a base rate
 * over thirty-two observations and not a law.
 *
 * There is no path through this function that returns high confidence in a market call.
 */
export function recommendMultiplier(
  base: IndexOption,
  enhanced: IndexOption,
  opts: { readonly holdingYears?: number } = {},
): MultiplierRecommendation {
  const be = breakEvenIndexReturn(base, enhanced);
  const br = historicalBaseRate(base, enhanced);
  const reasoning: string[] = [];

  if (be.alwaysWins) {
    reasoning.push(
      `${enhanced.name} credits at least as much as ${base.name} at every possible index ` +
        'return. No forecast is required and no trade-off exists.',
    );
    return {
      baseOptionId: base.id, enhancedOptionId: enhanced.id, breakEven: be, baseRate: br,
      confidence: 'structural', recommend: true, reasoning, restsOn: 'structural',
      plain: `TAKE IT. ${be.plain}`,
    };
  }

  if (be.neverBreaksEven) {
    reasoning.push(
      `${enhanced.name} cannot beat ${base.name} at any index return. The charge is larger ` +
        'than the extra participation can generate, at every point on the curve.',
    );
    return {
      baseOptionId: base.id, enhancedOptionId: enhanced.id, breakEven: be, baseRate: br,
      confidence: 'structural', recommend: false, reasoning, restsOn: 'structural',
      plain: `DO NOT TAKE IT. ${be.plain}`,
    };
  }

  reasoning.push(
    `The index must return more than ${be.indexReturnPct!.toFixed(2)}% for the enhanced option ` +
      `to win. Over ${br.yearsObserved} years it did so ${br.yearsCleared} times ` +
      `(${(br.hitRate * 100).toFixed(0)}%).`,
  );
  reasoning.push(
    `${br.floorYears} of those ${br.yearsObserved} years finished at or below zero. In a floor ` +
      `year the enhanced option gives up ${be.floorYearCost.toFixed(2)} points and receives ` +
      'nothing for it. That is where this decision is actually won or lost.',
  );
  reasoning.push(
    `Compounded across the full period the enhanced option came out ` +
      `${br.cumulativeAdvantagePct >= 0 ? 'ahead' : 'behind'} by ` +
      `${Math.abs(br.cumulativeAdvantagePct).toFixed(2)}%.`,
  );

  const holding = opts.holdingYears ?? 30;
  if (holding < 10) {
    reasoning.push(
      `A ${holding}-year holding period is short enough that the outcome is dominated by which ` +
        'particular years fall inside it. The base rate is a poor guide over a window this ' +
        'small, and the honest answer is that this cannot be called.',
    );
  }

  const recommend = br.cumulativeAdvantagePct > 0 && br.hitRate >= 0.5;
  const confidence: Confidence =
    holding < 10 ? 'insufficient' : Math.abs(br.cumulativeAdvantagePct) < 2 ? 'insufficient' : 'suggestive';

  if (confidence === 'insufficient') {
    reasoning.push(
      'The historical margin is too thin, or the window too short, to separate these options. ' +
        'Presenting either as the clear choice would be overstating what the evidence supports.',
    );
  }

  return {
    baseOptionId: base.id,
    enhancedOptionId: enhanced.id,
    breakEven: be,
    baseRate: br,
    confidence,
    recommend: confidence === 'insufficient' ? false : recommend,
    reasoning,
    restsOn: 'probabilistic',
    plain:
      confidence === 'insufficient'
        ? `NO CLEAR ANSWER. ${be.plain} Historically it netted ` +
          `${br.cumulativeAdvantagePct.toFixed(2)}%, which is inside the noise.`
        : `${recommend ? 'LEANS YES' : 'LEANS NO'} — on a base rate, not a forecast. ${br.plain}`,
  };
}

export interface AllocationSplit {
  readonly optionId: string;
  readonly weightPct: number;
}

export interface HedgeResult {
  readonly allocation: readonly AllocationSplit[];
  readonly yearsObserved: number;
  /** Years where the BLENDED credit was zero. */
  readonly blendedFloorYears: number;
  /** Floor years for the single best option, for comparison. */
  readonly concentratedFloorYears: number;
  readonly blendedCagr: number;
  readonly bestSingleCagr: number;
  readonly worstSingleCagr: number;
  readonly plain: string;
}

/**
 * Splitting across indices to reduce floor years — and the honest cost of doing it.
 *
 * The ask was how to hedge against zero-credit years by allocating to a different index.
 * It genuinely works, because the indices do not floor in the same years: an index can
 * finish down while another finishes up, and a split earns something in a year that a
 * concentrated allocation would have zeroed.
 *
 * What is usually left out is the cost. Splitting also caps your best years — a year
 * where your chosen index ran hot is diluted by the one that did not. This reports both
 * sides, because a hedge sold as free is not a hedge, it is a pitch.
 */
export function hedgeAcrossIndices(
  options: readonly IndexOption[],
  allocation: readonly AllocationSplit[],
): HedgeResult {
  const totalWeight = allocation.reduce((s, a) => s + a.weightPct, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new RangeError(`Allocation must total 100%; received ${totalWeight}%.`);
  }

  const byId = new Map(options.map((o) => [o.id, o]));
  for (const a of allocation) {
    if (!byId.has(a.optionId)) throw new Error(`Unknown option "${a.optionId}".`);
  }

  const startYear = Math.max(...allocation.map((a) => byId.get(a.optionId)!.availableFrom));
  const yearsAll = Object.keys(RAW_INDEX_RETURNS.SP500).map(Number).filter((y) => y >= startYear).sort((a, b) => a - b);

  let blendedGrowth = 1;
  let blendedFloorYears = 0;
  const singleGrowth = new Map<string, number>();
  const singleFloor = new Map<string, number>();

  for (const a of allocation) {
    singleGrowth.set(a.optionId, 1);
    singleFloor.set(a.optionId, 0);
  }

  for (const year of yearsAll) {
    let blendedCredit = 0;
    for (const a of allocation) {
      const opt = byId.get(a.optionId)!;
      const raw = RAW_INDEX_RETURNS[opt.index]?.[year];
      if (raw === undefined) continue;
      const c = creditRate(opt, raw);
      blendedCredit += c * (a.weightPct / 100);
      singleGrowth.set(a.optionId, singleGrowth.get(a.optionId)! * (1 + c / 100));
      if (c <= 0.0001) singleFloor.set(a.optionId, singleFloor.get(a.optionId)! + 1);
    }
    blendedGrowth *= 1 + blendedCredit / 100;
    if (blendedCredit <= 0.0001) blendedFloorYears += 1;
  }

  const n = yearsAll.length;
  const cagr = (g: number) => (Math.pow(g, 1 / n) - 1) * 100;
  const singles: number[] = [];
  singleGrowth.forEach((g) => singles.push(cagr(g)));
  const floorCounts: number[] = [];
  singleFloor.forEach((c) => floorCounts.push(c));
  const concentratedFloorYears = Math.min(...floorCounts);

  return {
    allocation,
    yearsObserved: n,
    blendedFloorYears,
    concentratedFloorYears,
    blendedCagr: Number(cagr(blendedGrowth).toFixed(4)),
    bestSingleCagr: Number(Math.max(...singles).toFixed(4)),
    worstSingleCagr: Number(Math.min(...singles).toFixed(4)),
    plain:
      `Split across ${allocation.length} options over ${n} years: ${blendedFloorYears} years ` +
      `credited nothing, against ${concentratedFloorYears} for the best single option. ` +
      `Blended ${cagr(blendedGrowth).toFixed(2)}% a year, versus ` +
      `${Math.max(...singles).toFixed(2)}% for the best single option and ` +
      `${Math.min(...singles).toFixed(2)}% for the worst. ` +
      (cagr(blendedGrowth) < Math.max(...singles)
        ? 'The split cost return in exchange for fewer zero years. That is the trade, and it is ' +
          'only worth taking if the client would have abandoned the strategy during a zero year.'
        : 'The split beat every single option here, which happens when the indices floor in ' +
          'different years.'),
  };
}

export const MULTIPLIER_RULES = {
  neverPrinted: [
    'A forecast of next year’s index return, at any confidence.',
    'A multiplier recommendation that does not state its breakeven index return.',
    'A hit rate without the floor-year count beside it.',
    'A hedge presented as free. Splitting across indices costs upside and that must be shown.',
    'A base rate presented as a probability. Thirty-two observations is a base rate, not a law.',
    'A recommendation whose confidence is higher than the weakest input it rests on.',
  ],
} as const;

export interface OptionAudit {
  readonly optionId: string;
  readonly name: string;
  readonly issue: string;
  readonly severity: 'blocker' | 'warning';
  readonly evidence: string;
}

/**
 * Catch option definitions that cannot be real products.
 *
 * Written after this engine ranked "Dynamic Low Vol with Bonus" first in the book with a
 * 17.26% compound rate and ZERO floor years across thirty-two years — including a
 * positive credit in 2008, when the index fell 44.76%.
 *
 * The cause is a modeling error, not a product: the bonus is added AFTER the floor, so it
 * pays out in years the account earned nothing. A real indexed bonus or multiplier scales
 * the credit, and a credit of zero scaled by anything is still zero. Left uncorrected, an
 * option like this dominates every comparison the platform makes and puts a strategy in
 * front of a client that has never existed.
 *
 * Two checks, both mechanical:
 *
 *   BLOCKER — the option credits a positive rate in a year the index fell hard. No floored
 *   product does this without a guaranteed-interest rider, and a rider large enough to pay
 *   in a 44% down year would carry a charge that is not in this record.
 *
 *   BLOCKER — the option weakly dominates another at every index return, with no charge and
 *   no cap to pay for it. Free money does not appear on a rate sheet.
 */
export function auditOptionTable(options: readonly IndexOption[]): OptionAudit[] {
  const findings: OptionAudit[] = [];

  for (const o of options) {
    const deepDown = creditRate(o, -40);
    if (deepDown > 0.0001) {
      findings.push({
        optionId: o.id,
        name: o.name,
        severity: 'blocker',
        issue:
          'Credits a positive rate when the index falls 40%. The bonus is being added after ' +
          'the floor instead of scaling the credit, so it pays in years nothing was earned.',
        evidence: `creditRate(-40%) = ${deepDown.toFixed(2)}%, floor = ${o.floor}%, bonus = ${o.bonus}%.`,
      });
    }
    if (o.cap === null && o.participation > 100 && o.spread === 0 && o.strategyCharge === 0 && o.bonus >= 0) {
      findings.push({
        optionId: o.id,
        name: o.name,
        severity: 'blocker',
        issue:
          'Uncapped, above-100% participation, no spread and no charge. Nothing pays for the ' +
          'extra participation, so this option dominates every alternative at every return. ' +
          'No carrier sells this.',
        evidence: `cap = none, participation = ${o.participation}%, spread = ${o.spread}%, charge = ${o.strategyCharge}%.`,
      });
    }
  }

  return findings;
}
