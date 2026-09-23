/**
 * Ledger-driven whole-life engine — participating whole-life MECHANICS, year by
 * year, from the caller's own guaranteed values and dividends.
 *
 * ## Mechanics, not an illustration
 *
 * This engine does not know any carrier's cash values, dividend scale or
 * paid-up-addition rates. The caller supplies them: the guaranteed cash value
 * schedule, the dividends (as dollars by year, or as a dividend scale), the
 * guaranteed growth of a paid-up addition's cash value, and the rider and loan
 * terms. The engine applies them in a fixed order and reports the result. It
 * never invents a dividend rate, and it never models the dividend as one flat
 * percentage of total cash value: a carrier's dividend follows the base
 * policy's reserve, mortality and expense margins, not the cash-value total
 * (the two Lafayette designs for one insured pay a larger year-1 dividend on the
 * base-heavy design with LESS cash value). Dividends are not guaranteed. The
 * output is not an illustration, and nothing here is a promise.
 *
 * ## The layers
 *
 *   Base policy   — `base.guaranteedCashValue` by year and the base face.
 *                   When only an illustration is at hand, its guaranteed net
 *                   cash value column may be supplied here instead: that column
 *                   already contains the guaranteed value of rider-premium
 *                   paid-up additions and the guaranteed-basis handling of
 *                   premiums, so the caller then sets `base.premium` to the
 *                   cash premiums that column assumes (zero in years it pays
 *                   premiums by surrendering guaranteed PUAs) and supplies no
 *                   `puaRider`.
 *   PUA pool      — paid-up additions bought by the PUA rider and by dividends.
 *                   Their cash value grows each year at the caller's guaranteed
 *                   PUA growth rate (from the carrier's PUA cash value table);
 *                   their paid-up face comes from `pua.facePerDollar`.
 *   Term rider    — face and premium to its end year; the death benefit drops
 *                   after it.
 *
 * ## Dividends and dividend options
 *
 *   'pua'           — the dividend buys paid-up additions at the anniversary.
 *   'cash'          — the dividend is paid out.
 *   'premiumOffset' — from `fromYear`, the dividend buys PUAs and the premium
 *                     due (base + term) is paid by surrendering PUA cash value.
 *                     That is the same as paying the premium from the dividend
 *                     first and surrendering PUAs for any shortfall. When the
 *                     pool cannot cover the premium the remainder is due in
 *                     cash, and `premiumOffsetFailedYear` records the first
 *                     such year.
 *
 * `dividendScalePct` (default 100) scales every dividend: 50 is the midpoint
 * stress an illustration prints beside the current scale. With per-year
 * dividend dollars, a stressed run shrinks each supplied dollar; if the caller
 * also supplies the dividend rate on dividend-bought PUAs
 * (`dividendLayerRatePct`), the dividends those lost PUAs would have earned are
 * removed too. Without it a stressed run OVERSTATES late-year values, because
 * the dividends the missing PUAs would have earned are still counted.
 *
 * ## Loans
 *
 * A loan is borrowed against the cash value; every PUA stays in the policy. It
 * reduces net cash value and the death benefit by the balance. Unpaid interest
 * capitalises annually at the year's rate (a variable rate is a schedule by
 * year). Under non-direct recognition the dividend is the same with or without
 * a loan; under direct recognition the dividend on the loaned share of cash
 * value is cut to the caller's retained percentage. The policy lapses when the
 * loan exceeds the gross cash value.
 *
 * ## PUA-rider rules
 *
 * A PUA rider payment below the minimum closes the rider permanently: no later
 * PUA premium is accepted. After `averageCapAfterYear` the annual maximum
 * becomes the average of the payments made through that year, so a payment
 * skipped or cut early permanently lowers later room.
 */
import { resolveYearSeries, type YearSeries } from './ledgerIulEngine';

export type { YearSeries, YearBand } from './ledgerIulEngine';

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

export interface BasePolicy {
  readonly faceAmount: number;
  /** Premium due at the start of each year, dollars. */
  readonly premium: YearSeries;
  /** Guaranteed cash value at the end of each year, dollars. */
  readonly guaranteedCashValue: YearSeries;
  /** Guaranteed death benefit by year, dollars. Default: the face amount. */
  readonly guaranteedDeathBenefit?: YearSeries;
}

export interface PuaRiderRules {
  /** Minimum rider payment in rider year 1, dollars. */
  readonly minimumFirstYear: number;
  /** Minimum rider payment in later years, dollars. */
  readonly minimumLater: number;
  /** After this policy year, the annual maximum is the average of payments made in years 1..this year. */
  readonly averageCapAfterYear?: number;
  /** A carrier-stated maximum by year, dollars (optional). */
  readonly maximumByYear?: YearSeries;
}

export interface PuaRider {
  /** Rider premium the owner plans to pay each year, dollars. 0 = no payment. */
  readonly plannedPremium: YearSeries;
  /** Share of a rider premium that becomes PUA cash value on purchase, % (default 100). */
  readonly cashValuePctOfPremium?: YearSeries;
  readonly rules?: PuaRiderRules;
}

export interface PuaTerms {
  /** Guaranteed growth of an existing paid-up addition's cash value over each policy year, %. */
  readonly cashValueGrowthPct: YearSeries;
  /** Paid-up face bought per $1 of PUA purchase in each year. Without it the death benefit omits PUA face. */
  readonly facePerDollar?: YearSeries;
}

export interface WholeLifeTermRider {
  readonly faceAmount: number;
  readonly premium: YearSeries;
  /** Last policy year in force. */
  readonly endYear: number;
}

export type DividendInput =
  | {
      readonly kind: 'perYear';
      /** Dividend declared at the end of each year at 100% of the scale, dollars. */
      readonly amounts: YearSeries;
      /** Dividend rate paid on dividend-bought PUA cash value, %. Needed for an honest stressed run. */
      readonly dividendLayerRatePct?: YearSeries;
    }
  | {
      readonly kind: 'scale';
      /** Base-policy dividend per $1,000 of base face, by year. */
      readonly perThousandBaseFace: YearSeries;
      /** Dividend on PUA cash value (rider and dividend PUAs), % of prior year-end PUA cash value. */
      readonly onPuaCashValuePct: YearSeries;
    };

export type DividendOption =
  | { readonly kind: 'pua' }
  | { readonly kind: 'cash' }
  | { readonly kind: 'premiumOffset'; readonly fromYear: number };

export type LoanRecognition =
  | { readonly kind: 'nonDirect' }
  | {
      readonly kind: 'direct';
      /** Share of the dividend on the loaned portion of cash value that is still paid, %. */
      readonly loanedDividendRetainedPct: YearSeries;
    };

export interface WholeLifeLoans {
  readonly requests?: YearSeries;
  readonly repayments?: YearSeries;
  /** Loan rate by year, % (a variable rate is a schedule). */
  readonly ratePct: YearSeries;
  readonly interest: 'capitalize' | 'paid';
  readonly recognition: LoanRecognition;
  /** Maximum loan as % of gross cash value (default 90). */
  readonly limitPctOfCashValue?: number;
}

export interface LedgerWholeLifeInput {
  readonly years: number;
  readonly issueAge: number;
  readonly base: BasePolicy;
  readonly puaRider?: PuaRider;
  readonly termRider?: WholeLifeTermRider;
  readonly pua: PuaTerms;
  readonly dividends: DividendInput;
  /** 100 = the supplied scale; 50 = the midpoint stress. 0-100. */
  readonly dividendScalePct?: number;
  readonly dividendOption: DividendOption;
  readonly loans?: WholeLifeLoans;
}

/* ------------------------------------------------------------------ *
 * Output
 * ------------------------------------------------------------------ */

export interface LedgerWholeLifeYear {
  readonly year: number;
  readonly attainedAge: number;
  readonly basePremiumDue: number;
  readonly termPremiumDue: number;
  readonly puaRiderPremiumPlanned: number;
  readonly puaRiderPremiumAccepted: number;
  /** Premium paid by surrendering PUA cash value (premium offset). */
  readonly premiumPaidFromValues: number;
  /** Cash the owner pays: premiums not covered by values, plus accepted rider premium, plus loan interest paid. */
  readonly outOfPocket: number;
  readonly dividend: number;
  readonly dividendPaidInCash: number;
  readonly baseCashValue: number;
  readonly puaCashValue: number;
  /** Base + PUA cash value, before the loan. */
  readonly grossCashValue: number;
  readonly loanBalance: number;
  readonly loanInterest: number;
  /** Gross cash value − loan. */
  readonly netCashValue: number;
  readonly puaFace: number;
  readonly termRiderInForce: boolean;
  /** Base guaranteed DB + PUA face + term face (in force) − loan. */
  readonly netDeathBenefit: number;
  readonly puaRiderOpen: boolean;
  readonly puaRiderCapped: boolean;
  readonly lapsed: boolean;
}

export interface LedgerWholeLifeResult {
  readonly ok: true;
  readonly years: readonly LedgerWholeLifeYear[];
  readonly premiumOffsetFailedYear: number | null;
  readonly premiumOffsetShortfallTotal: number;
  readonly puaRiderClosedYear: number | null;
  readonly lapseYear: number | null;
  /** False when `pua.facePerDollar` was not supplied, so the death benefit leaves out PUA face. */
  readonly deathBenefitIncludesPuaFace: boolean;
  readonly dividendScalePct: number;
  readonly notes: readonly string[];
}

export type LedgerWholeLifeRun = LedgerWholeLifeResult | { readonly ok: false; readonly reason: string };

/* ------------------------------------------------------------------ *
 * Engine
 * ------------------------------------------------------------------ */

function validate(input: LedgerWholeLifeInput): string | null {
  if (!Number.isInteger(input.years) || input.years < 1 || input.years > 121) return 'A run needs a whole number of policy years between 1 and 121.';
  if (!Number.isFinite(input.issueAge) || input.issueAge < 0 || input.issueAge > 121) return 'Issue age must be between 0 and 121.';
  const scale = input.dividendScalePct ?? 100;
  if (!Number.isFinite(scale) || scale < 0 || scale > 100) return 'The dividend scale must be between 0% and 100% of the supplied scale.';
  const gcv = resolveYearSeries(input.base.guaranteedCashValue, input.years);
  const gap = gcv.covered.indexOf(false);
  if (gap >= 0) return `No guaranteed cash value was supplied for policy year ${gap + 1}. Supply the carrier's guaranteed values for every year of the run.`;
  const growth = resolveYearSeries(input.pua.cashValueGrowthPct, input.years);
  const gGap = growth.covered.indexOf(false);
  if (gGap >= 0) return `No guaranteed PUA cash value growth was supplied for policy year ${gGap + 1}.`;
  const d = input.dividends;
  const dividendSeries = d.kind === 'perYear' ? [d.amounts] : [d.perThousandBaseFace, d.onPuaCashValuePct];
  for (const s of dividendSeries) {
    const r = resolveYearSeries(s, input.years);
    const dg = r.covered.indexOf(false);
    if (dg >= 0) return `No dividend input was supplied for policy year ${dg + 1}. Supply the carrier's dividends (or scale) for every year; this engine will not assume a dividend rate.`;
    if (r.values.some((v) => !Number.isFinite(v) || v < 0)) return 'Dividend inputs must be finite and not negative.';
  }
  if (input.dividendOption.kind === 'premiumOffset' && !(Number.isInteger(input.dividendOption.fromYear) && input.dividendOption.fromYear >= 1)) {
    return 'Premium offset needs a whole-number start year.';
  }
  if (input.loans) {
    const lim = input.loans.limitPctOfCashValue ?? 90;
    if (!(lim >= 0 && lim <= 100)) return 'The loan limit must be between 0% and 100% of cash value.';
    const lr = resolveYearSeries(input.loans.ratePct, input.years);
    if (lr.values.some((v) => !Number.isFinite(v) || v < 0)) return 'A loan rate must be a finite, non-negative percentage.';
  }
  return null;
}

/**
 * Run the whole-life mechanics. Refuses (ok: false) rather than guessing a
 * missing guaranteed value, PUA growth rate or dividend.
 */
export function runLedgerWholeLife(input: LedgerWholeLifeInput): LedgerWholeLifeRun {
  const problem = validate(input);
  if (problem) return { ok: false, reason: problem };
  const scale = (input.dividendScalePct ?? 100) / 100;
  const d = input.dividends;
  // A stressed per-year run with a dividend-layer rate needs the 100% path's PUA pool, to take out
  // the dividends the 100% PUAs earned and put back those the stressed PUAs earn.
  let referencePool: number[] | null = null;
  if (d.kind === 'perYear' && d.dividendLayerRatePct && scale !== 1) {
    const ref = runLedgerWholeLife({ ...input, dividendScalePct: 100 });
    if (!ref.ok) return ref;
    referencePool = ref.years.map((y) => y.puaCashValue);
  }
  return simulate(input, scale, referencePool);
}

function simulate(input: LedgerWholeLifeInput, scale: number, referencePool: number[] | null): LedgerWholeLifeResult {
  const N = input.years;
  const s = (x: YearSeries | undefined, fill = 0) => resolveYearSeries(x, N, fill).values;
  const basePrem = s(input.base.premium);
  const baseCv = s(input.base.guaranteedCashValue);
  const baseDbRes = resolveYearSeries(input.base.guaranteedDeathBenefit, N);
  const growth = s(input.pua.cashValueGrowthPct);
  const faceSupplied = !!input.pua.facePerDollar && input.pua.facePerDollar.length > 0;
  const facePerDollar = s(input.pua.facePerDollar);
  const term = input.termRider;
  const termPrem = s(term?.premium);
  const rider = input.puaRider;
  const riderPlanned = s(rider?.plannedPremium);
  const riderCvPct = s(rider?.cashValuePctOfPremium, 100);
  const riderMaxRes = resolveYearSeries(rider?.rules?.maximumByYear, N);
  const d = input.dividends;
  const divAmounts = d.kind === 'perYear' ? s(d.amounts) : [];
  const divLayerRate = d.kind === 'perYear' ? s(d.dividendLayerRatePct) : [];
  const perThousand = d.kind === 'scale' ? s(d.perThousandBaseFace) : [];
  const onPua = d.kind === 'scale' ? s(d.onPuaCashValuePct) : [];
  const opt = input.dividendOption;
  const loans = input.loans;
  const loanReq = s(loans?.requests);
  const loanRepay = s(loans?.repayments);
  const loanRate = s(loans?.ratePct);
  const retained = loans?.recognition.kind === 'direct' ? s(loans.recognition.loanedDividendRetainedPct) : [];
  const loanLimitPct = loans?.limitPctOfCashValue ?? 90;

  const notes: string[] = [
    'Mechanics from caller-supplied guaranteed values and dividends. Not an illustration. Dividends are not guaranteed.',
  ];
  if (!faceSupplied) notes.push('No paid-up face per dollar was supplied, so the death benefit leaves out PUA face.');
  if (d.kind === 'perYear' && scale !== 1 && !d.dividendLayerRatePct) {
    notes.push('Stressed run on per-year dividend dollars without a dividend-layer rate: late-year values are overstated, because the dividends that the missing PUAs would have earned are still counted.');
  }
  if (loans?.recognition.kind === 'nonDirect') notes.push('Non-direct recognition: the dividend is the same with or without a loan.');

  let pool = 0; // PUA cash value (rider + dividend PUAs)
  let puaFace = 0;
  let loan = 0;
  let riderOpen = !!rider;
  let riderClosedYear: number | null = null;
  const riderPaid: number[] = [];
  let offsetFailedYear: number | null = null;
  let offsetShortfall = 0;
  let lapseYear: number | null = null;
  const rows: LedgerWholeLifeYear[] = [];

  const surrenderFromPool = (amount: number): number => {
    const take = Math.min(Math.max(0, amount), Math.max(0, pool));
    if (take > 0 && pool > 0) {
      puaFace -= puaFace * (take / pool);
      pool -= take;
    }
    return take;
  };

  for (let y = 1; y <= N; y += 1) {
    const i = y - 1;
    const age = input.issueAge + i;
    if (lapseYear !== null) {
      rows.push(emptyRow(y, age));
      continue;
    }
    const termInForce = !!term && y <= term.endYear;
    const basePremiumDue = basePrem[i];
    const termPremiumDue = termInForce ? termPrem[i] : 0;
    let outOfPocket = 0;

    // 1. Base and term premiums: cash, or by PUA surrender under premium offset.
    let premiumPaidFromValues = 0;
    const due = basePremiumDue + termPremiumDue;
    if (opt.kind === 'premiumOffset' && y >= opt.fromYear && due > 0) {
      // Loaned value is not available to pay premiums.
      const available = Math.max(0, pool - Math.max(0, loan - baseCv[i]));
      premiumPaidFromValues = surrenderFromPool(Math.min(due, available));
      const short = due - premiumPaidFromValues;
      if (short > 1e-6) {
        if (offsetFailedYear === null) offsetFailedYear = y;
        offsetShortfall += short;
        outOfPocket += short;
      }
    } else {
      outOfPocket += due;
    }

    // 2. PUA rider premium, under the rider's rules.
    const planned = riderPlanned[i];
    let accepted = 0;
    let capped = false;
    if (rider && riderOpen) {
      const rules = rider.rules;
      const minimum = rules ? (riderPaid.length === 0 ? rules.minimumFirstYear : rules.minimumLater) : 0;
      if (rules && planned < minimum) {
        riderOpen = false;
        riderClosedYear = y;
      } else {
        let max = Infinity;
        if (rules?.averageCapAfterYear !== undefined && y > rules.averageCapAfterYear) {
          const window = riderPaid.slice(0, rules.averageCapAfterYear);
          const avg = window.reduce((t, v) => t + v, 0) / rules.averageCapAfterYear;
          max = Math.min(max, avg);
        }
        if (riderMaxRes.covered[i]) max = Math.min(max, riderMaxRes.values[i]);
        accepted = Math.min(planned, max);
        capped = planned > max + 1e-9;
        const cv = (accepted * riderCvPct[i]) / 100;
        pool += cv;
        puaFace += accepted * facePerDollar[i];
        outOfPocket += accepted;
      }
    }
    riderPaid.push(accepted);

    // 3. Loans at the start of the year.
    if (loans) {
      const repaid = Math.min(loanRepay[i], loan);
      loan -= repaid;
      outOfPocket += repaid;
      const gross = baseCv[i] + pool;
      const available = Math.max(0, (loanLimitPct / 100) * gross - loan);
      loan += Math.min(loanReq[i], available);
    }

    // 4. PUA cash value grows over the year at the guaranteed rate.
    // Paid-up face is level; only its cash value grows.
    pool *= 1 + growth[i] / 100;

    // 5. Dividend at the end of the year.
    let dividend: number;
    const priorPool = i > 0 ? rows[i - 1]?.puaCashValue ?? 0 : 0;
    if (d.kind === 'perYear') {
      if (referencePool && divLayerRate.length) {
        const refPrior = i > 0 ? referencePool[i - 1] : 0;
        const basepart = divAmounts[i] - (divLayerRate[i] / 100) * refPrior;
        dividend = scale * (basepart + (divLayerRate[i] / 100) * priorPool);
      } else {
        dividend = scale * divAmounts[i];
      }
    } else {
      dividend = scale * ((perThousand[i] * input.base.faceAmount) / 1000 + (onPua[i] / 100) * priorPool);
    }
    if (loans?.recognition.kind === 'direct' && loan > 0) {
      const gross = baseCv[i] + pool;
      const loanedShare = gross > 0 ? Math.min(1, loan / gross) : 1;
      dividend *= 1 - loanedShare * (1 - retained[i] / 100);
    }
    dividend = Math.max(0, dividend);
    let dividendPaidInCash = 0;
    if (opt.kind === 'cash') {
      dividendPaidInCash = dividend;
    } else {
      pool += dividend;
      puaFace += dividend * facePerDollar[i];
    }

    // 6. Loan interest at the end of the year.
    let loanInterest = 0;
    if (loans && loan > 0) {
      loanInterest = loan * (loanRate[i] / 100);
      if (loans.interest === 'capitalize') loan += loanInterest;
      else outOfPocket += loanInterest;
    }

    const gross = baseCv[i] + pool;
    const baseDb = baseDbRes.covered[i] ? baseDbRes.values[i] : input.base.faceAmount;
    const deathBenefit = baseDb + puaFace + (termInForce ? term!.faceAmount : 0);
    const lapsed = loan > gross + 1e-6;
    rows.push({
      year: y,
      attainedAge: age,
      basePremiumDue,
      termPremiumDue,
      puaRiderPremiumPlanned: planned,
      puaRiderPremiumAccepted: accepted,
      premiumPaidFromValues,
      outOfPocket,
      dividend,
      dividendPaidInCash,
      baseCashValue: baseCv[i],
      puaCashValue: pool,
      grossCashValue: gross,
      loanBalance: loan,
      loanInterest,
      netCashValue: gross - loan,
      puaFace,
      termRiderInForce: termInForce,
      netDeathBenefit: deathBenefit - loan,
      puaRiderOpen: riderOpen,
      puaRiderCapped: capped,
      lapsed,
    });
    if (lapsed) {
      lapseYear = y;
      notes.push(`Year ${y}: the loan balance exceeds the gross cash value; the policy lapses.`);
    }
  }

  return {
    ok: true,
    years: rows,
    premiumOffsetFailedYear: offsetFailedYear,
    premiumOffsetShortfallTotal: offsetShortfall,
    puaRiderClosedYear: riderClosedYear,
    lapseYear,
    deathBenefitIncludesPuaFace: faceSupplied,
    dividendScalePct: scale * 100,
    notes,
  };
}

function emptyRow(year: number, age: number): LedgerWholeLifeYear {
  return {
    year, attainedAge: age, basePremiumDue: 0, termPremiumDue: 0, puaRiderPremiumPlanned: 0, puaRiderPremiumAccepted: 0, premiumPaidFromValues: 0,
    outOfPocket: 0, dividend: 0, dividendPaidInCash: 0, baseCashValue: 0, puaCashValue: 0, grossCashValue: 0, loanBalance: 0, loanInterest: 0,
    netCashValue: 0, puaFace: 0, termRiderInForce: false, netDeathBenefit: 0, puaRiderOpen: false, puaRiderCapped: false, lapsed: true,
  };
}

/** Sources behind the engine's rules, in the shape the provenance census reads. */
export const LEDGER_WHOLE_LIFE_ENGINE_SOURCES = [
  {
    label: 'Lafayette Life LL-2639, "Direct vs Non-Direct Recognition": the dividend is a three-factor return of surplus (interest on reserves, mortality, expense) and, under non-direct recognition, is the same whether or not there is a loan (secondary copy on a broker site)',
    url: 'https://strengthinsurancebrokerage.com/wp-content/uploads/lay10.pdf',
  },
  {
    label: '26 U.S. Code Section 7702A (seven-pay test): a design at its 7-pay limit can become a modified endowment contract if benefits are reduced in the first seven years; this engine does not run the 7-pay test',
    url: 'https://www.law.cornell.edu/uscode/text/26/7702A',
  },
] as const;
