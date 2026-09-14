/**
 * Reading the charges back out of an illustration.
 *
 * The rate guide gave us crediting — caps, participation, spreads, floors,
 * strategy charges, and the carrier's own look-backs. It gave us nothing about
 * what the policy costs, and cost is most of the answer. On a thinly funded
 * design the cost of insurance alone, taken across a plausible range, swings
 * the thirty-year account value from $518,548 to $28,484. That is not a
 * projection with an error bar; it is a coin flip wearing a suit.
 *
 * So rather than typing charge assumptions in and hoping, this module reads
 * them out of an illustration ledger. Three of the four things we need come
 * out exactly, by arithmetic, with nothing assumed:
 *
 * ## 1. Total charges per year — exact
 *
 * The account value recursion is: take last year's value, add the premium,
 * subtract the charges, then credit. So
 *
 *     valueAfterCharges = accountValue / (1 + creditedRate)
 *     charges           = priorAccountValue + premium - valueAfterCharges
 *
 * Every term on the right is printed on the illustration. No assumption enters.
 * If a ledger and a credited rate are supplied, the total deduction for each
 * policy year is simply known.
 *
 * ## 2. Surrender charges — exact
 *
 * The illustration prints account value and surrender value side by side. The
 * schedule is their difference. No fitting, no guessing.
 *
 * ## 3. Corridor factors — exact where they bind
 *
 * Wherever the printed death benefit exceeds the face amount, IRC 7702 is
 * forcing it up, and the factor is the ratio of the two.
 *
 * ## 4. The split of total charges — fitted, and often NOT identifiable
 *
 * This is the honest part. Total charges are known exactly; what they are made
 * of is not. Charges are a premium load, plus fixed dollar amounts (policy fee
 * and per-unit charge), plus cost of insurance:
 *
 *     charges = load × premium + fixed + coiScale × referenceCoi
 *
 * Three unknowns, one equation per year. Least squares fits them — but a fit
 * always returns numbers, including when the data cannot tell the components
 * apart, and that is exactly when a fitted number is most dangerous. Two
 * confounds are structural:
 *
 *   - **Load against fixed.** While premium is level, `load × premium` and
 *     `fixed` are both constants. Nothing distinguishes them. They separate
 *     only across years where the premium changes — which is why the years
 *     after premiums stop are the most informative rows on the page.
 *
 *   - **Fixed against cost of insurance.** Where the net amount at risk barely
 *     moves, the mortality charge is near-constant too, and is absorbed into
 *     the fixed term. A max-funded policy separates them well because the
 *     amount at risk collapses; a thin protection design barely separates them
 *     at all.
 *
 *   - **Policy fee against per-unit charge.** These never separate from one
 *     illustration at any funding level — both are fixed dollars per year. It
 *     takes two illustrations at different face amounts, because only the
 *     per-unit charge scales with face.
 *
 * `identifiability` reports which of these bit, and `nextUpload` says which
 * document breaks each one. A fitted component that the data cannot pin down
 * comes back flagged, not quietly returned as fact.
 */

import { coiPerThousand, type CoiRate, type PolicyCharges } from './policyMechanics';

/** One row of an illustration's ledger, as printed. */
export interface LedgerYear {
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly premium: number;
  /** Account value / accumulation value at the end of the year. */
  readonly accountValue: number;
  /** Net cash surrender value at the end of the year, if the column is shown. */
  readonly surrenderValue?: number;
  /** Death benefit for the year, if the column is shown. */
  readonly deathBenefit?: number;
}

export interface CalibrationInput {
  readonly ledger: readonly LedgerYear[];
  readonly faceAmount: number;
  /**
   * The rate the illustration credited each year, as a percentage. A level
   * illustrated rate repeats; a historical one varies. This must be the rate
   * the ledger was actually produced at — it is the one thing that cannot be
   * recovered from the ledger, because rate and charges trade off exactly.
   */
  readonly creditedRatePctByYear: readonly number[];
  /**
   * A reference mortality curve, per $1,000 of net amount at risk by age. The
   * fit returns a scale factor against it, so the shape matters and the level
   * does not. Any published curve works as the shape.
   */
  readonly referenceCoiTable: readonly CoiRate[];
}

export interface YearCharges {
  readonly policyYear: number;
  readonly attainedAge: number;
  readonly premium: number;
  /** Exact: prior account value + premium − account value ÷ (1 + rate). */
  readonly totalCharges: number;
  /** Exact: the account value the charges left behind, before crediting. */
  readonly valueAfterCharges: number;
  /** Exact where the surrender column is printed. */
  readonly surrenderChargePct: number | null;
  /** Exact where the death benefit column is printed and the corridor binds. */
  readonly corridorFactor: number | null;
  readonly netAmountAtRisk: number | null;
}

export type Confidence = 'identified' | 'weak' | 'confounded';

export interface FittedComponent {
  readonly value: number;
  readonly confidence: Confidence;
  /** Why it landed at that confidence, in one sentence. */
  readonly reason: string;
}

export interface CalibrationResult {
  readonly years: readonly YearCharges[];
  /** Exact schedule, wherever the surrender column was printed. */
  readonly surrenderChargePctByYear: readonly number[];
  /** Exact factors, by attained age, wherever the corridor bound. */
  readonly corridorFactorByAge: Readonly<Record<number, number>>;
  readonly fit: {
    readonly premiumLoadPct: FittedComponent;
    readonly fixedAnnualCharge: FittedComponent;
    readonly coiScale: FittedComponent;
  };
  /** Root-mean-square dollar error of the fitted split against the exact totals. */
  readonly residualRms: number;
  /** The largest single-year miss, and which year. */
  readonly worstYear: { policyYear: number; error: number } | null;
  /** Which document breaks each remaining ambiguity. */
  readonly nextUpload: readonly string[];
  readonly notes: readonly string[];
}

function atYear(list: readonly number[], year: number): number {
  if (list.length === 0) return 0;
  return list[Math.min(year, list.length) - 1]!;
}

/**
 * Total charges, surrender charges and corridor factors — all exact.
 *
 * This runs before any fitting and does not depend on it. Even when the split
 * into components is hopeless, these three are known.
 */
export function exactChargesFromLedger(input: CalibrationInput): readonly YearCharges[] {
  const out: YearCharges[] = [];
  let prior = 0;
  for (const row of input.ledger) {
    const rate = atYear(input.creditedRatePctByYear, row.policyYear) / 100;
    const valueAfterCharges = row.accountValue / (1 + rate);
    const totalCharges = prior + row.premium - valueAfterCharges;

    const surrenderChargePct =
      row.surrenderValue !== undefined && row.accountValue > 0
        ? ((row.accountValue - row.surrenderValue) / row.accountValue) * 100
        : null;

    // Against the value the charges left behind, NOT the printed end-of-year
    // account value. The corridor is applied before the year is credited, so
    // dividing by the credited figure understates the factor by exactly the
    // year's growth — at 6.54% that turns a 2.44 corridor into 2.29.
    //
    // A small ambiguity survives: carriers apply the corridor at a point in
    // the monthly deduction cycle we cannot see from an annual ledger, so the
    // recovered factor sits within about a percent of the contractual one
    // rather than on it. The statutory table is the place to settle that; this
    // is here to check a transcription, not to replace it.
    const corridorFactor =
      row.deathBenefit !== undefined && valueAfterCharges > 0 && row.deathBenefit > input.faceAmount
        ? row.deathBenefit / valueAfterCharges
        : null;

    const netAmountAtRisk =
      row.deathBenefit !== undefined ? Math.max(0, row.deathBenefit - valueAfterCharges) : null;

    out.push({
      policyYear: row.policyYear,
      attainedAge: row.attainedAge,
      premium: row.premium,
      totalCharges,
      valueAfterCharges,
      surrenderChargePct,
      corridorFactor,
      netAmountAtRisk,
    });
    prior = row.accountValue;
  }
  return out;
}

/** Solve a symmetric 3×3 by Gaussian elimination with partial pivoting. */
function solve3(a: number[][], b: number[]): number[] | null {
  const m = a.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < 3; c++) {
    let piv = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(m[r]![c]!) > Math.abs(m[piv]![c]!)) piv = r;
    if (Math.abs(m[piv]![c]!) < 1e-9) return null;
    [m[c], m[piv]] = [m[piv]!, m[c]!];
    for (let r = 0; r < 3; r++) {
      if (r === c) continue;
      const f = m[r]![c]! / m[c]![c]!;
      for (let k = c; k < 4; k++) m[r]![k]! -= f * m[c]![k]!;
    }
  }
  return [m[0]![3]! / m[0]![0]!, m[1]![3]! / m[1]![1]!, m[2]![3]! / m[2]![2]!];
}

/** Pearson correlation, used to detect the confounds rather than assume them. */
function correlation(x: readonly number[], y: readonly number[]): number {
  const n = x.length;
  if (n < 2) return 1;
  const mx = x.reduce((a, v) => a + v, 0) / n;
  const my = y.reduce((a, v) => a + v, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - mx, dy = y[i]! - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx < 1e-12 || syy < 1e-12) return 1; // a constant column is perfectly confounded
  return sxy / Math.sqrt(sxx * syy);
}

/**
 * Fit the three charge components to the exact totals, and say which of them
 * the data actually determined.
 */
export function calibrateFromIllustration(input: CalibrationInput): CalibrationResult {
  const years = exactChargesFromLedger(input);
  const notes: string[] = [];
  const nextUpload: string[] = [];

  // The three design columns.
  const colLoad = years.map((y) => y.premium);
  const colFixed = years.map(() => 1);
  const colCoi = years.map((y) => {
    const rate = coiPerThousand(input.referenceCoiTable, y.attainedAge);
    if (rate === null) return 0;
    const nar = y.netAmountAtRisk ?? Math.max(0, input.faceAmount - y.valueAfterCharges);
    return (nar / 1000) * rate;
  });
  const target = years.map((y) => y.totalCharges);

  const cols = [colLoad, colFixed, colCoi];
  const ata = [0, 1, 2].map((i) => [0, 1, 2].map((j) =>
    cols[i]!.reduce((s, _, k) => s + cols[i]![k]! * cols[j]![k]!, 0)));
  const atb = [0, 1, 2].map((i) => cols[i]!.reduce((s, _, k) => s + cols[i]![k]! * target[k]!, 0));

  const sol = solve3(ata, atb);
  const [load, fixed, coiScale] = sol ?? [0, 0, 0];
  if (!sol) notes.push('The three charge columns were linearly dependent and no split could be solved at all. Only the exact totals above are usable.');

  // Residuals against the exact totals.
  let sse = 0;
  let worst: { policyYear: number; error: number } | null = null;
  years.forEach((y, k) => {
    const pred = load * colLoad[k]! + fixed + coiScale * colCoi[k]!;
    const err = y.totalCharges - pred;
    sse += err * err;
    if (!worst || Math.abs(err) > Math.abs(worst.error)) worst = { policyYear: y.policyYear, error: Math.round(err) };
  });
  const residualRms = years.length > 0 ? Math.sqrt(sse / years.length) : 0;

  // Identifiability, measured rather than assumed.
  // The fixed column is all ones by construction, so correlating anything
  // against it returns 1 and would mark every component confounded. What
  // actually separates a component from a flat annual charge is having a shape
  // of its own — so the measure is each column's own spread, not its
  // correlation with a constant.
  const spread = (v: readonly number[]): number => {
    const nz = v.filter((x) => x > 0);
    if (nz.length < 2) return 0;
    const lo = Math.min(...nz), hi = Math.max(...nz);
    return hi > 0 ? (hi - lo) / hi : 0;
  };
  const rLoadCoi = Math.abs(correlation(colLoad, colCoi));
  const premiumSpread = new Set(colLoad.map((p) => Math.round(p))).size > 1 ? 1 : 0;
  const narRange = spread(colCoi);

  // Load separates from a flat fee only if the premium changes somewhere in
  // the ledger; it separates from mortality only if the two do not move
  // together.
  const loadConf: Confidence =
    premiumSpread === 0 ? 'confounded' : rLoadCoi > 0.9 ? 'weak' : 'identified';
  // Mortality separates from a flat fee only if the amount at risk moves.
  const coiConf: Confidence =
    narRange < 0.1 ? 'confounded' : narRange < 0.25 ? 'weak' : rLoadCoi > 0.9 ? 'weak' : 'identified';
  const fixedConf: Confidence =
    loadConf === 'confounded' || coiConf === 'confounded' ? 'confounded'
      : loadConf === 'weak' || coiConf === 'weak' ? 'weak' : 'identified';

  if (loadConf !== 'identified') {
    nextUpload.push(
      premiumSpread > 0
        ? 'An illustration whose premium changes more sharply between years — a short-pay or a single-premium design — so the load stops tracking the mortality charge.'
        : 'An illustration with years after the premiums stop. While the premium is level, a percentage of it and a flat annual fee are the same constant, and nothing in the ledger can tell them apart.'
    );
  }
  if (coiConf !== 'identified') {
    nextUpload.push(
      'A max-funded illustration on the same product. Where the account value climbs into the death benefit the amount at risk collapses, the mortality charge falls with it, and it stops looking like a flat fee.'
    );
  }
  // This one never resolves from a single illustration, at any funding level.
  nextUpload.push(
    'A second illustration at a different face amount, same age and class. The policy fee and the per-unit charge are both flat dollars per year and never separate from one ledger; only the per-unit charge scales with face.'
  );
  if (!input.ledger.some((r) => r.surrenderValue !== undefined)) {
    nextUpload.push('An illustration showing the surrender value column. It is the one schedule that needs no fitting — it is the printed difference from the account value.');
  }
  if (!input.ledger.some((r) => r.deathBenefit !== undefined)) {
    nextUpload.push('An illustration showing the death benefit column, so the corridor factors and the true amount at risk can be read rather than assumed.');
  }

  const surrenderChargePctByYear: number[] = [];
  for (const y of years) {
    if (y.surrenderChargePct === null) break;
    surrenderChargePctByYear.push(Math.round(y.surrenderChargePct * 100) / 100);
  }

  const corridorFactorByAge: Record<number, number> = {};
  for (const y of years) {
    if (y.corridorFactor !== null) {
      corridorFactorByAge[y.attainedAge] = Math.round(y.corridorFactor * 1000) / 1000;
    }
  }

  notes.push(
    `Total charges for each of the ${years.length} years are exact — they are the ledger's own arithmetic, not a fit. Only the split into load, fixed charge and mortality is fitted.`
  );
  if (residualRms > 0) {
    notes.push(
      `The three-component split reproduces those totals to $${Math.round(residualRms).toLocaleString()} root-mean-square. A large residual means the product carries a charge this shape does not describe — a persistency credit, an asset charge, or a rider.`
    );
  }

  return {
    years,
    surrenderChargePctByYear,
    corridorFactorByAge,
    fit: {
      premiumLoadPct: {
        value: Math.round(load * 10000) / 100,
        confidence: loadConf,
        reason: loadConf === 'identified'
          ? 'The premium changes across the ledger, so the load separates from the flat charges.'
          : 'The premium is level across the paying years, so a percentage of it is indistinguishable from a flat annual charge.',
      },
      fixedAnnualCharge: {
        value: Math.round(fixed),
        confidence: fixedConf,
        reason: fixedConf === 'identified'
          ? 'Both the load and the mortality charge separated from it.'
          : 'It absorbs whatever the other two components could not be distinguished from.',
      },
      coiScale: {
        value: Math.round(coiScale * 1000) / 1000,
        confidence: coiConf,
        reason: coiConf === 'identified'
          ? `The net amount at risk moves by ${Math.round(narRange * 100)}% across the ledger, so the mortality charge has a shape of its own.`
          : `The net amount at risk moves by only ${Math.round(narRange * 100)}% across the ledger, so the mortality charge is nearly flat and is absorbed into the fixed term.`,
      },
    },
    residualRms: Math.round(residualRms),
    worstYear: worst,
    nextUpload,
    notes,
  };
}

/**
 * Turn a calibration into charges the projection engine can run.
 *
 * The policy fee and the per-unit charge cannot be separated from one
 * illustration, so the whole fixed amount is placed on the policy fee and the
 * per-unit charge is left at zero. That is not a claim that the product has no
 * per-unit charge — it is where the undivided total is parked until a second
 * illustration at a different face amount splits it. The totals are right
 * either way at this face amount; they are wrong at any other.
 */
export function chargesFromCalibration(
  result: CalibrationResult,
  referenceCoiTable: readonly CoiRate[]
): PolicyCharges {
  return {
    premiumLoadPctByYear: [Math.max(0, result.fit.premiumLoadPct.value)],
    monthlyPolicyFee: Math.max(0, result.fit.fixedAnnualCharge.value) / 12,
    perUnitMonthlyPerThousand: 0,
    perUnitYears: 0,
    coiTable: referenceCoiTable.map((r) => ({
      age: r.age,
      perThousand: r.perThousand * Math.max(0, result.fit.coiScale.value),
    })),
    coiTableSource: `fitted from an illustration ledger (${result.fit.coiScale.confidence})`,
    surrenderChargePctByYear: result.surrenderChargePctByYear,
  };
}
