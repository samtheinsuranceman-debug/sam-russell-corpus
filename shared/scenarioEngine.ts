/**
 * Scenario overlays — inflation, rates, tax policy, and thirty-six years of local history.
 *
 * ## What this is for
 *
 * A projection in nominal dollars at today's tax rates is a projection of a world that
 * will not exist. This engine layers the three things that actually move a thirty-year
 * outcome and are usually left out: what a dollar buys, what credit costs, and what the
 * government takes.
 *
 * ## On the political scenario, and how it must be presented
 *
 * Federal tax rates are set by statute, and statutes change with which party controls
 * the House, the Senate, and the White House. That is a real planning variable and it
 * would be negligent to model a thirty-year plan as though rates were fixed. So
 * `LEGISLATIVE_SCENARIOS` exists.
 *
 * It is built as neutral scenario analysis, and that framing is not decoration:
 *
 *   - Scenarios are named by the STRUCTURE of government (unified, divided, sunset-only),
 *     not by party. The tax consequence of unified control is what it is regardless of
 *     which party holds it, and both parties have raised and cut rates.
 *   - Nothing here predicts an election. `probability` is an input the advisor supplies
 *     and must defend, not a forecast this engine produces.
 *   - There is no scheduled sunset any more. P.L. 119-21 (One Big Beautiful Bill Act,
 *     4 July 2025) made the TCJA individual rates permanent (§ 70101), so "current law"
 *     is the default and a return to pre-2018 rates is a what-if that would need a new
 *     act of Congress. Source: P.L. 119-21, title VII, § 70101 et seq. (TCJA individual provisions made permanent), https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf; CRS R48611, https://www.congress.gov/crs-product/R48611 (read 23 Sep 2026).
 *
 * Presenting a tax scenario to a client as a political prediction is a bad idea twice
 * over: it is outside an advisor's competence, and it converts a planning conversation
 * into an argument. Show the client what happens to their plan under higher rates and
 * under current rates. That is the useful question and it does not require anyone to
 * agree about an election.
 *
 * ## The 36-year local series
 *
 * Neighborhood appreciation, rent growth, insurance cost, and mortgage rates by ZIP are
 * the numbers that decide whether a real estate plan works, and they vary enormously by
 * market. They are NOT encoded here — no national average is worth anything at the ZIP
 * level. `LocalHistory` is a contract that must be filled from a sourced series, and
 * every function that consumes one throws if it is unsourced or too short.
 */

export interface SourcedSeries {
  /** Annual observations, oldest first. Decimals for rates, dollars for levels. */
  readonly values: readonly number[];
  /** Calendar year of values[0]. */
  readonly startYear: number;
  readonly source: string;
  readonly asOf: string;
}

export class UnsourcedSeriesError extends Error {
  constructor(what: string) {
    super(
      `Refused to use the ${what} series: it carries no source or no as-of date. ` +
        'A local series with no provenance is a guess with a chart around it.',
    );
    this.name = 'UnsourcedSeriesError';
  }
}

export class SeriesTooShortError extends Error {
  constructor(what: string, have: number, need: number) {
    super(
      `The ${what} series covers ${have} years; ${need} are required. A look-back shorter than ` +
        'the window being presented cherry-picks by construction.',
    );
    this.name = 'SeriesTooShortError';
  }
}

export interface LocalHistory {
  readonly zip: string;
  /** Annual home price appreciation, as decimals. */
  readonly appreciation: SourcedSeries;
  /** Annual market rent growth, as decimals. */
  readonly rentGrowth: SourcedSeries;
  /** Annual homeowners insurance premium, in dollars. */
  readonly insuranceCost: SourcedSeries;
  /** Average 30-year mortgage rate available in this market, as decimals. */
  readonly mortgageRate: SourcedSeries;
}

const REQUIRED_YEARS = 36;

function assertSeries(s: SourcedSeries, what: string, minYears = REQUIRED_YEARS): void {
  if (!s.source?.trim() || !s.asOf?.trim()) throw new UnsourcedSeriesError(what);
  if (s.values.length < minYears) throw new SeriesTooShortError(what, s.values.length, minYears);
}

export interface SeriesStats {
  readonly years: number;
  /** Compound annual growth rate over the whole series. */
  readonly cagr: number;
  readonly arithmeticMean: number;
  readonly best: number;
  readonly worst: number;
  /** Worst rolling ten-year compound rate in the series. */
  readonly worstDecade: number;
  readonly plain: string;
}

/**
 * Describe a series honestly, including the worst decade in it.
 *
 * The worst rolling decade matters more than the average for anyone who might need the
 * money inside ten years, and it is the number a full-period CAGR hides.
 */
export function describeSeries(s: SourcedSeries, what: string, minYears = REQUIRED_YEARS): SeriesStats {
  assertSeries(s, what, minYears);
  const v = s.values;
  const growth = v.reduce((acc, r) => acc * (1 + r), 1);
  const cagr = Math.pow(growth, 1 / v.length) - 1;
  const mean = v.reduce((a, b) => a + b, 0) / v.length;

  let worstDecade = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 10 <= v.length; i++) {
    const window = v.slice(i, i + 10).reduce((acc, r) => acc * (1 + r), 1);
    worstDecade = Math.min(worstDecade, Math.pow(window, 1 / 10) - 1);
  }

  return {
    years: v.length,
    cagr: Number(cagr.toFixed(5)),
    arithmeticMean: Number(mean.toFixed(5)),
    best: Math.max(...v),
    worst: Math.min(...v),
    worstDecade: Number(worstDecade.toFixed(5)),
    plain:
      `${what} over ${v.length} years: ${(cagr * 100).toFixed(2)}% compound. ` +
      `Best year ${(Math.max(...v) * 100).toFixed(1)}%, worst ${(Math.min(...v) * 100).toFixed(1)}%. ` +
      `Worst ten-year stretch compounded at ${(worstDecade * 100).toFixed(2)}% — that is the ` +
      `number that matters if the money is needed inside a decade. Source: ${s.source}, ${s.asOf}.`,
  };
}

export type InflationBasis = 'cpi-headline' | 'cpi-core' | 'local-cost-of-living' | 'custom';

export interface InflationAssumption {
  readonly annualRate: number;
  readonly basis: InflationBasis;
  readonly source: string;
}

/** Convert nominal dollars to today's purchasing power. */
export function realValue(nominal: number, years: number, inflation: InflationAssumption): number {
  if (!inflation.source?.trim()) {
    throw new Error('An inflation assumption needs a source. "I assumed 3%" is a source; state it.');
  }
  return nominal / Math.pow(1 + inflation.annualRate, years);
}

export interface ProjectionRow {
  readonly year: number;
  readonly nominal: number;
  readonly real: number;
  readonly afterTaxNominal: number;
  readonly afterTaxReal: number;
}

/**
 * Government structure, not party.
 *
 * Each scenario describes what CAN pass, which is the only thing that matters to a tax
 * projection. `ordinaryRateDelta` and `capitalGainRateDelta` are the advisor's inputs and
 * must be defensible; this engine supplies the plumbing, not the forecast.
 */
export interface LegislativeScenario {
  readonly id: string;
  readonly label: string;
  /** Change in top ordinary rate, in points. +0.05 means five points higher. */
  readonly ordinaryRateDelta: number;
  readonly capitalGainRateDelta: number;
  /** Year the change is assumed effective. */
  readonly effectiveYear: number;
  readonly rationale: string;
}

export const LEGISLATIVE_SCENARIOS: readonly LegislativeScenario[] = [
  {
    id: 'current-law',
    label: 'Current law holds',
    ordinaryRateDelta: 0,
    capitalGainRateDelta: 0,
    effectiveYear: 0,
    rationale: 'Baseline. Rates as enacted today, extended indefinitely. Useful as a comparison, not as a forecast.',
  },
  // Was 'scheduled-sunset' (TCJA expiry in 2026, "the true default"). P.L. 119-21 § 70101 made the
  // TCJA rates permanent — P.L. 119-21, title VII, § 70101 et seq. (TCJA individual provisions made permanent), https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf; CRS R48611, https://www.congress.gov/crs-product/R48611 (read 23 Sep 2026). Kept only as a labelled what-if.
  // The +3 points is the old top-rate step (37% → 39.6%, rounded), an assumption the advisor can change.
  {
    id: 'what-if-pre-tcja-rates',
    label: 'What if Congress raises rates back to pre-2018 levels',
    ordinaryRateDelta: 0.03,
    capitalGainRateDelta: 0,
    effectiveYear: 2027,
    rationale:
      'Not current law: P.L. 119-21 made the TCJA rates permanent, so nothing expires. This scenario ' +
      'asks what happens if a future Congress restores the pre-2018 top rate. It is a stress test, not a default.',
  },
  {
    id: 'divided-government',
    label: 'Divided government',
    ordinaryRateDelta: 0.01,
    capitalGainRateDelta: 0,
    effectiveYear: 2029,
    rationale:
      'Split control historically produces extensions and patches rather than structural change. ' +
      'Modeled as drift, not reform.',
  },
  {
    id: 'unified-expansion',
    label: 'Unified control, revenue-raising agenda',
    ordinaryRateDelta: 0.07,
    capitalGainRateDelta: 0.05,
    effectiveYear: 2029,
    rationale:
      'Single-party control of both chambers and the White House with a revenue agenda. Applies ' +
      'regardless of which party — the structural fact is that unified control can pass a rate change.',
  },
  {
    id: 'unified-reduction',
    label: 'Unified control, rate-cutting agenda',
    ordinaryRateDelta: -0.03,
    capitalGainRateDelta: -0.02,
    effectiveYear: 2029,
    rationale:
      'The mirror case. Included so the analysis is symmetric — a model that only shows rates ' +
      'rising is an argument, not a projection.',
  },
] as const;

export interface ProjectionInputs {
  readonly startingValue: number;
  readonly annualReturn: number;
  readonly years: number;
  readonly currentYear: number;
  readonly baseOrdinaryRate: number;
  readonly taxTreatment: 'tax-free' | 'tax-deferred' | 'ordinary' | 'capital-gain';
  readonly baseCapitalGainRate: number;
  readonly inflation: InflationAssumption;
}

/**
 * Project a position under one legislative scenario, in both nominal and real dollars.
 *
 * Tax-free positions are the point of the comparison: their after-tax line does not move
 * when the rate scenario does, and showing the two side by side is the clearest argument
 * for tax-free accumulation that exists. It does not require anyone to predict an election.
 */
export function projectUnderScenario(
  inputs: ProjectionInputs,
  scenario: LegislativeScenario,
): ProjectionRow[] {
  if (inputs.years <= 0) throw new RangeError('Years must be positive.');
  const rows: ProjectionRow[] = [];
  let value = inputs.startingValue;

  for (let y = 1; y <= inputs.years; y++) {
    const calendarYear = inputs.currentYear + y;
    const scenarioActive = scenario.effectiveYear > 0 && calendarYear >= scenario.effectiveYear;

    const ordinary = inputs.baseOrdinaryRate + (scenarioActive ? scenario.ordinaryRateDelta : 0);
    const capGain = inputs.baseCapitalGainRate + (scenarioActive ? scenario.capitalGainRateDelta : 0);

    value *= 1 + inputs.annualReturn;

    const effectiveRate =
      inputs.taxTreatment === 'tax-free'
        ? 0
        : inputs.taxTreatment === 'capital-gain'
          ? Math.max(0, capGain)
          : Math.max(0, ordinary);

    const gain = value - inputs.startingValue;
    const afterTaxNominal = value - Math.max(0, gain) * effectiveRate;

    rows.push({
      year: calendarYear,
      nominal: Math.round(value),
      real: Math.round(realValue(value, y, inputs.inflation)),
      afterTaxNominal: Math.round(afterTaxNominal),
      afterTaxReal: Math.round(realValue(afterTaxNominal, y, inputs.inflation)),
    });
  }
  return rows;
}

export interface ScenarioComparison {
  readonly scenarioId: string;
  readonly label: string
  readonly endingAfterTaxReal: number;
  readonly costVsCurrentLaw: number;
  readonly plain: string;
}

/** Run every scenario and report what each costs against current law, in today's dollars. */
export function compareScenarios(inputs: ProjectionInputs): ScenarioComparison[] {
  const baseline = projectUnderScenario(inputs, LEGISLATIVE_SCENARIOS[0]);
  const baseEnd = baseline[baseline.length - 1].afterTaxReal;

  return LEGISLATIVE_SCENARIOS.map((s) => {
    const rows = projectUnderScenario(inputs, s);
    const end = rows[rows.length - 1].afterTaxReal;
    return {
      scenarioId: s.id,
      label: s.label,
      endingAfterTaxReal: end,
      costVsCurrentLaw: end - baseEnd,
      plain:
        `${s.label}: ${end.toLocaleString()} after tax in today's dollars` +
        (s.id === 'current-law'
          ? ' (baseline).'
          : ` — ${(end - baseEnd >= 0 ? '+' : '')}${(end - baseEnd).toLocaleString()} vs current law.`) +
        (inputs.taxTreatment === 'tax-free'
          ? ' Tax-free treatment means this line does not move with the rate scenario.'
          : ''),
    };
  });
}

export interface LocalOutlook {
  readonly zip: string;
  readonly appreciation: SeriesStats;
  readonly rentGrowth: SeriesStats;
  readonly insurance: SeriesStats;
  readonly mortgageRate: SeriesStats;
  readonly warnings: readonly string[];
  readonly plain: string;
}

/**
 * Thirty-six years of this ZIP code, described without flattery.
 *
 * Insurance is included because it is the line item that has quietly rewritten the
 * economics of rental property in coastal and wildfire markets, and a rent-growth
 * projection that ignores it is telling half the story.
 */
export function localOutlook(history: LocalHistory): LocalOutlook {
  const appreciation = describeSeries(history.appreciation, 'appreciation');
  const rentGrowth = describeSeries(history.rentGrowth, 'rent growth');
  const mortgageRate = describeSeries(history.mortgageRate, 'mortgage rate', REQUIRED_YEARS);

  // Insurance is a dollar level, not a rate, so convert to year-over-year change first.
  const ins = history.insuranceCost;
  if (!ins.source?.trim() || !ins.asOf?.trim()) throw new UnsourcedSeriesError('insurance cost');
  if (ins.values.length < REQUIRED_YEARS) {
    throw new SeriesTooShortError('insurance cost', ins.values.length, REQUIRED_YEARS);
  }
  const insChanges: number[] = [];
  for (let i = 1; i < ins.values.length; i++) {
    insChanges.push(ins.values[i] / ins.values[i - 1] - 1);
  }
  const insurance = describeSeries(
    { values: insChanges, startYear: ins.startYear + 1, source: ins.source, asOf: ins.asOf },
    'insurance cost',
    REQUIRED_YEARS - 1,
  );

  const warnings: string[] = [];
  if (insurance.cagr > rentGrowth.cagr) {
    warnings.push(
      `Insurance has compounded at ${(insurance.cagr * 100).toFixed(2)}% against rent growth of ` +
        `${(rentGrowth.cagr * 100).toFixed(2)}%. Carrying cost is outrunning the income that covers ` +
        'it, and a projection holding insurance flat will overstate net cash flow every year.',
    );
  }
  if (appreciation.worstDecade < 0) {
    warnings.push(
      `This market had a ten-year stretch that compounded at ${(appreciation.worstDecade * 100).toFixed(2)}%. ` +
        'Appreciation is not a floor here and should not be presented as one.',
    );
  }
  if (mortgageRate.worst < mortgageRate.arithmeticMean - 0.02) {
    warnings.push(
      `The lowest rate in this series is ${(mortgageRate.worst * 100).toFixed(2)}% against a ` +
        `${(mortgageRate.arithmeticMean * 100).toFixed(2)}% average. A client holding debt below the ` +
        'long-run average is holding an asset, and paying it down early forfeits it.',
    );
  }

  return {
    zip: history.zip,
    appreciation,
    rentGrowth,
    insurance,
    mortgageRate,
    warnings,
    plain:
      `${history.zip} over 36 years — appreciation ${(appreciation.cagr * 100).toFixed(2)}%, ` +
      `rent ${(rentGrowth.cagr * 100).toFixed(2)}%, insurance ${(insurance.cagr * 100).toFixed(2)}%, ` +
      `mortgage rates averaging ${(mortgageRate.arithmeticMean * 100).toFixed(2)}%.`,
  };
}

export const SCENARIO_RULES = {
  neverPrinted: [
    'A projection in nominal dollars with no real-dollar column beside it.',
    'A tax scenario presented as an election prediction.',
    'A scenario set that only shows rates rising. Symmetry or it is an argument, not analysis.',
    'A local series shorter than the window being presented.',
    'A rental projection holding insurance cost flat.',
    'An inflation assumption with no stated source, including "I assumed 3%".',
  ],
} as const;
