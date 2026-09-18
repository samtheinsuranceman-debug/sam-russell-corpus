// ─── Index-series reconciliation ────────────────────────────────────────────
//
// ## The finding
//
// This build carries TWO S&P 500 annual series, and they disagree.
//
//   `indexCreditingData.RAW_INDEX_RETURNS.SP500` — PRICE return. Audited on
//     16 September 2026 against two carrier fliers on three independent checks
//     (thirty-year mean, count of years above a 10% cap, average excess above
//     the cap) and replaced when the previous series failed all three. See
//     `sp500SeriesAudit.ts`, which runs those checks on every test pass.
//
//   `ibbotsonModel.SP500_ANNUAL_RETURNS` — sourced "NYU Stern / Damodaran,
//     Ibbotson SBBI", which is a TOTAL return series: price appreciation plus
//     reinvested dividends. It has never been audited, it imports nothing, and
//     it is the series actually driving crediting math on the Mortgage Killer,
//     IUL vs Roth, Tax-Advantaged Growth, Real Estate Mogul, the crediting
//     windows and the partner API.
//
// ## Why it matters more than two numbers
//
// Indexed crediting is calculated on the PRICE index. A carrier's index account
// tracks the index level; it does not pay dividends. Using a total-return
// series to model crediting overstates every segment, and the overstatement is
// systematic rather than random — dividends have contributed roughly 1.8 to 2.0
// points a year over the long run, every year, in the same direction.
//
// The two years that show it most plainly:
//
//     2008    price -38.49%    total -37.00%
//     2009    price +23.45%    total +26.46%
//
// A 0% floor hides the 2008 difference entirely. The 2009 difference does not
// hide: against a 10% cap both credit 10%, but against a 12% cap the total-
// return series credits 12% where the price series credits 11.75%, and every
// two-year segment built on 2009 inherits it.
//
// ## Why this module reports rather than replaces
//
// `sp500SeriesAudit.ts` is explicit that replacing this series is material:
// when it was last replaced, two-year segment credits for 2019–2024 moved from
// {36.22, 47.97, 1.89, 14.84, 49.97, 34.22} to {49.51, 47.32, 0, 0, 53.42,
// 43.07}, and it instructs that anything quoted before the change be discarded
// rather than reconciled.
//
// Swapping the series a second time is therefore an OWNER decision with a
// republication consequence, not a bug fix a builder makes in passing. So this
// module measures the divergence, names it, and fails a test if either series
// moves without the record being updated — and leaves the swap to a decision
// that is made deliberately.
//
// ## What to do about it
//
// Point `ibbotsonModel` at `RAW_INDEX_RETURNS.SP500` for 1994 onward, and
// either drop the pre-1994 years or label them explicitly as a different
// series measuring a different thing. Then re-run every published illustration.

import { SP500_ANNUAL_RETURNS } from "./ibbotsonModel";
import { RAW_INDEX_RETURNS } from "./indexCreditingData";

export interface SeriesDivergence {
  readonly year: number;
  /** ibbotsonModel — total return. */
  readonly totalReturn: number;
  /** indexCreditingData — price return, audited. */
  readonly priceReturn: number;
  /** totalReturn − priceReturn, in decimal points. Positive means the unaudited series is higher. */
  readonly gap: number;
}

export interface ReconciliationReport {
  /** Years both series carry. */
  readonly overlapFrom: number | null;
  readonly overlapTo: number | null;
  readonly overlapYears: number;
  /** Years where the two disagree by more than `tolerance`. */
  readonly divergences: readonly SeriesDivergence[];
  /** Mean gap across the overlap, in decimal points. */
  readonly meanGap: number | null;
  /** Largest absolute gap in the overlap. */
  readonly maxGap: SeriesDivergence | null;
  /** True where every overlapping year agrees within tolerance. */
  readonly agrees: boolean;
  readonly disclosure: string;
}

export const RECONCILIATION_DISCLOSURE =
  "Indexed crediting is calculated on the price index, which pays no dividends. " +
  "A total-return series overstates every segment systematically. " +
  "Where these two series disagree, the audited price-return series in indexCreditingData is the one crediting math should use.";

/**
 * The two series are also in DIFFERENT UNITS, which is a hazard in its own right.
 *
 *     indexCreditingData.RAW_INDEX_RETURNS.SP500   percent   2009 → 23.5
 *     ibbotsonModel.SP500_ANNUAL_RETURNS           decimal   2009 → 0.2646
 *
 * Nothing in either file's type says so — both are `Record<number, number>` —
 * so a value copied from one into the other, or a helper pointed at the wrong
 * one, produces a number wrong by a factor of a hundred with no type error and
 * no test failure unless something is specifically looking. A 26% credit
 * rendered as 0.26% reads as a bad year rather than as a bug, which is exactly
 * the kind of error that survives review.
 *
 * Normalised here to decimal before any comparison.
 */
const PRICE_SERIES_IS_PERCENT = true;

const priceSeries = (): Record<number, number> => {
  const s = (RAW_INDEX_RETURNS as Record<string, Record<number, number>>)["SP500"];
  if (!s) return {};
  if (!PRICE_SERIES_IS_PERCENT) return s;
  const out: Record<number, number> = {};
  const keys = Object.keys(s);
  for (let i = 0; i < keys.length; i++) {
    const y = Number(keys[i]);
    if (isFinite(y) && typeof s[y] === "number") out[y] = s[y] / 100;
  }
  return out;
};

/**
 * Compare the two series year by year.
 *
 * `tolerance` is in decimal points: 0.001 is one tenth of one percent. The
 * default is deliberately tight, because the point is to detect that the two
 * series measure different things, not to wave through small differences.
 */
export function reconcile(tolerance = 0.001): ReconciliationReport {
  const price = priceSeries();
  const divergences: SeriesDivergence[] = [];
  const gaps: number[] = [];
  let from: number | null = null;
  let to: number | null = null;
  let overlap = 0;

  const years = Object.keys(SP500_ANNUAL_RETURNS).map(Number).filter(function (n) { return isFinite(n); });
  years.sort(function (a, b) { return a - b; });

  for (let i = 0; i < years.length; i++) {
    const y = years[i];
    const tr = SP500_ANNUAL_RETURNS[y];
    const pr = price[y];
    if (typeof tr !== "number" || typeof pr !== "number") continue;
    overlap += 1;
    if (from == null) from = y;
    to = y;
    const gap = tr - pr;
    gaps.push(gap);
    if (Math.abs(gap) > tolerance) divergences.push({ year: y, totalReturn: tr, priceReturn: pr, gap });
  }

  let maxGap: SeriesDivergence | null = null;
  for (let i = 0; i < divergences.length; i++) {
    if (!maxGap || Math.abs(divergences[i].gap) > Math.abs(maxGap.gap)) maxGap = divergences[i];
  }

  return {
    overlapFrom: from,
    overlapTo: to,
    overlapYears: overlap,
    divergences,
    meanGap: gaps.length ? gaps.reduce(function (a, b) { return a + b; }, 0) / gaps.length : null,
    maxGap,
    agrees: divergences.length === 0,
    disclosure: RECONCILIATION_DISCLOSURE,
  };
}

/**
 * The state of the divergence as recorded on 2026-09-18.
 *
 * A test asserts the live reconciliation still matches this. If either series
 * is edited the test fails, which is the point: neither series may move
 * silently while the other stays put.
 */
export const RECORDED_DIVERGENCE = {
  recordedOn: "2026-09-18",
  note:
    "ibbotsonModel carries a total-return series; indexCreditingData carries the audited price-return series. " +
    "They overlap and disagree. Crediting math on several surfaces currently runs on the unaudited total-return series.",
  /**
   * The two series are in different units — percent versus decimal — with
   * identical TypeScript types. A value moved between them is wrong by a factor
   * of a hundred with no type error and no test failure.
   */
  unitMismatch: {
    priceSeries: "percent (indexCreditingData: 2009 → 23.5)",
    totalSeries: "decimal (ibbotsonModel: 2009 → 0.2646)",
    hazard: "Both are Record<number, number>. Nothing in the types distinguishes them.",
  },
  /** Held figures for four overlapping years, normalised to decimal. */
  knownYears: [
    { year: 2008, totalReturn: -0.37, priceReturn: -0.383 },
    { year: 2009, totalReturn: 0.2646, priceReturn: 0.235 },
    { year: 2019, totalReturn: 0.3149, priceReturn: 0.288 },
    { year: 2021, totalReturn: 0.2871, priceReturn: 0.27 },
  ],
  consumersOnTheUnauditedSeries: [
    "shared/creditingWindows.ts",
    "server/partnerApi.ts",
    "client/src/hooks/useIbbotsonModel.ts",
    "client/src/pages/portal/MortgageKiller.tsx",
    "client/src/pages/portal/IULvsRoth.tsx",
    "client/src/pages/portal/TaxAdvantagedGrowth.tsx",
    "client/src/pages/portal/RealEstateMogul.tsx",
  ],
  ownerDecision:
    "Repointing ibbotsonModel at the audited series changes published figures materially. sp500SeriesAudit.ts records that " +
    "the last such change required prior quotes to be discarded rather than reconciled. This is a deliberate decision with a " +
    "republication consequence, not a passing fix.",
} as const;
