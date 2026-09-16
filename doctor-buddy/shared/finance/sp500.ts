/**
 * S&P 500 calendar-year PRICE returns, dividends excluded.
 *
 * Dividends are excluded because that is what an indexed crediting strategy
 * tracks — you do not own the shares, so you do not receive the distributions.
 * A backtest run against total return overstates indexed crediting by roughly
 * two points a year.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 *
 * The dataset in `indexCrediting.ts` was carried over from Russell Capital
 * Systems and this site originally described it as "real annual price returns".
 * It is not. It does not reconcile with published S&P 500 calendar-year price
 * returns and we could not establish what period or series it represents:
 *
 *      year   this file   indexCrediting.ts
 *      2008     -38.49          -44.76
 *      2009      23.45           50.25
 *      2019      28.88            6.10
 *      2020      16.26           29.01
 *      2021      26.89           14.77
 *      2022     -19.44           -9.23
 *
 * Those are not rounding differences. Everything the site says about index
 * history now runs off this module; the legacy table is kept only for the
 * carrier parameter sets that sit alongside it, and is labelled as unverified
 * wherever it still appears.
 *
 * Figures are the widely published calendar-year price returns. Before using
 * any of this with a client, reconcile it against the carrier's own statement
 * of credited rates — that is the only number that binds them.
 */

export const SP500_PRICE_RETURN: Record<number, number> = {
  1994: -1.54, 1995: 34.11, 1996: 20.26, 1997: 31.01, 1998: 26.67,
  1999: 19.53, 2000: -10.14, 2001: -13.04, 2002: -23.37, 2003: 26.38,
  2004: 8.99, 2005: 3.00, 2006: 13.62, 2007: 3.53, 2008: -38.49,
  2009: 23.45, 2010: 12.78, 2011: 0.00, 2012: 13.41, 2013: 29.60,
  2014: 11.39, 2015: -0.73, 2016: 9.54, 2017: 19.42, 2018: -6.24,
  2019: 28.88, 2020: 16.26, 2021: 26.89, 2022: -19.44, 2023: 24.23,
  2024: 23.31, 2025: 15.96,
};

export const SP500_YEARS = Object.keys(SP500_PRICE_RETURN).map(Number).sort((a, b) => a - b);
export const SP500_FIRST_YEAR = SP500_YEARS[0];
export const SP500_LAST_YEAR = SP500_YEARS[SP500_YEARS.length - 1];

/**
 * Parameters of one indexed crediting account, as a carrier states them.
 *
 * `participation` is deliberately unbounded above. Real accounts go well past
 * 100% — Securian's Eclipse Accumulator advertises an uncapped account at 200%
 * participation — and an engine that silently assumed otherwise would make
 * genuine carrier behaviour look impossible.
 */
export interface AccountParams {
  /** Cap on the credited rate, in percent. `null` means uncapped. */
  cap: number | null;
  /** Share of the index move credited, in percent. 100 = one-for-one. */
  participation: number;
  /** Deducted from the participated move before the floor and cap, in percent. */
  spread: number;
  /** Floor, in percent. Effectively always 0 on an IUL. */
  floor: number;
  /**
   * Annual charge against account value that funds the option budget for a
   * high participation rate or a multiplier. This is the cost of the upside
   * and it is charged whether or not the index goes up.
   */
  assetChargePct: number;
  /** Flat addition to the credit, in percent. */
  bonus: number;
}

export const PAR_100: AccountParams =
  { cap: null, participation: 100, spread: 0, floor: 0, assetChargePct: 0, bonus: 0 };

/** Credited rate for one year, applying the carrier's order of operations. */
export function creditedRate(p: AccountParams, indexReturn: number): number {
  let credited = indexReturn * (p.participation / 100) - p.spread;
  credited = Math.max(credited, p.floor);
  if (p.cap !== null) credited = Math.min(credited, p.cap);
  return Math.max(credited + p.bonus, 0);
}

/**
 * Net growth for one year, after the asset charge.
 *
 * The charge comes out of account value regardless of the credit, which is the
 * whole point: in a 0% year a high-participation account does not stay flat,
 * it goes backwards by the charge. Reporting the credited rate without this is
 * how these accounts get oversold.
 */
export function netGrowthRate(p: AccountParams, indexReturn: number): number {
  return creditedRate(p, indexReturn) - p.assetChargePct;
}

export interface YearRow {
  year: number;
  index: number;
  credited: number;
  assetCharge: number;
  net: number;
}

export function creditingHistory(
  p: AccountParams,
  from = SP500_FIRST_YEAR,
  to = SP500_LAST_YEAR,
): YearRow[] {
  const rows: YearRow[] = [];
  for (let year = from; year <= to; year++) {
    const index = SP500_PRICE_RETURN[year];
    if (index === undefined) continue;
    const credited = creditedRate(p, index);
    rows.push({ year, index, credited, assetCharge: p.assetChargePct, net: credited - p.assetChargePct });
  }
  return rows;
}

/** Geometric mean of a series of annual percentage rates. */
export function compound(rates: number[]): number {
  if (rates.length === 0) return 0;
  const growth = rates.reduce((a, r) => a * (1 + r / 100), 1);
  return (Math.pow(growth, 1 / rates.length) - 1) * 100;
}

// ─── Multi-year segments ────────────────────────────────────────────────────

/**
 * Credit for a segment spanning several years.
 *
 * This is the mechanic that produces the headline numbers on two-year balanced
 * accounts, and it is routinely mistaken for a high participation rate. The
 * segment compounds the index across its whole term FIRST, then applies
 * participation and the segment spread once, then floors at zero.
 *
 * Two years of roughly 25% compound to about 56% before anything is applied.
 * At 105% participation less a 2.50% spread that credits about 56% — a number
 * that looks impossible on a one-year account and is ordinary on a two-year
 * one. The same mechanic cuts the other way: a single bad year inside the
 * segment can take the whole term to zero, and the account is locked for the
 * full term while that happens.
 */
export function segmentCredit(p: AccountParams, indexReturns: number[]): number {
  const compounded = (indexReturns.reduce((a, r) => a * (1 + r / 100), 1) - 1) * 100;
  let credited = compounded * (p.participation / 100) - p.spread;
  credited = Math.max(credited, p.floor);
  if (p.cap !== null) credited = Math.min(credited, p.cap);
  return Math.max(credited + p.bonus, 0);
}

export interface SegmentRow {
  startYear: number;
  endYear: number;
  /** Compound index move across the whole segment. */
  indexOverTerm: number;
  /** Credit applied to the segment. */
  credited: number;
  /** That credit expressed as an annual rate. */
  annualized: number;
}

/** Every segment of `termYears` starting in each year of the window. */
export function segmentHistory(
  p: AccountParams,
  termYears: number,
  from = SP500_FIRST_YEAR,
  to = SP500_LAST_YEAR,
): SegmentRow[] {
  const rows: SegmentRow[] = [];
  for (let start = from; start + termYears - 1 <= to; start++) {
    const returns: number[] = [];
    for (let y = start; y < start + termYears; y++) {
      const r = SP500_PRICE_RETURN[y];
      if (r === undefined) { returns.length = 0; break; }
      returns.push(r);
    }
    if (returns.length !== termYears) continue;
    const credited = segmentCredit(p, returns);
    rows.push({
      startYear: start,
      endYear: start + termYears - 1,
      indexOverTerm: (returns.reduce((a, r) => a * (1 + r / 100), 1) - 1) * 100,
      credited,
      annualized: (Math.pow(1 + credited / 100, 1 / termYears) - 1) * 100,
    });
  }
  return rows;
}
