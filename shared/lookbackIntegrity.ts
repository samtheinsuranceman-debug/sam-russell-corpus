// ============================================================
// LOOKBACK INTEGRITY — separating what an index LIVED from what it was BACKTESTED to.
//
// ## Why this file exists
//
// The engine is not an illustration. AG 49-B binds a carrier's illustration
// document; it does not bind an educational tool, so this platform may show
// real historical crediting where an illustration may not. That freedom is
// real and worth using.
//
// It is also the exact place where an honest tool becomes a dishonest one,
// because the highest 20-year number a carrier publishes is almost always the
// number with the least actual history behind it.
//
// ## What Nationwide's own table shows
//
// From the Accumulator II 2020 rate guide (FLM-1491AO.10 (02/25)), carried in
// NATIONWIDE_PUBLISHED_LOOKBACKS:
//
//                                    30yr    25yr    20yr    15yr    10yr     5yr
//   BNPP H-Factor Select              N/A     N/A   19.41   20.69   16.84   11.51
//   JPM Mercury Select                N/A     N/A   16.86   17.28   12.64    4.55
//   High-Cap S&P 500                 8.42    7.74    8.48    9.10    8.77    9.05
//   Multi-Index                      7.52    6.54    7.32    7.93    7.86    8.46
//
// The N/A in the 30- and 25-year columns is not missing data. It is Nationwide
// saying the index did not exist. J.P. Morgan Mercury was established
// 25 April 2022; BNP Paribas Global H-Factor on 8 April 2022. Everything
// published before those dates is back-tested and, in Nationwide's own words,
// "designed with the benefit of hindsight".
//
// ## The tell, and why it is the whole point
//
// Read the JPM Mercury Select row left to right: 16.86, 17.28, 12.64, then
// 4.55. The long windows — the ones that are almost entirely simulated — are
// spectacular. The 5-year window, the only stretch the index actually lived
// through, is the worst number on the row by a factor of three.
//
// That shape is the signature of an index designed against the history it is
// then measured on. It is not fraud and Nationwide discloses it plainly. But a
// page that prints 19.41% as "Nationwide's best 20-year allocation" and stops
// there has taken a disclosed backtest and presented it as a track record.
//
// ## What this module does
//
// It refuses to let that happen by construction. `classify()` sorts every
// option into LIVED or BACKTESTED from the presence of the long columns —
// carrier data, not judgement. `hindsightGap()` measures how much better the
// simulated stretch looks than the lived one. `headline()` returns the figure
// a page may print, and for a backtested series that figure is the LIVED
// window, with the backtest available beside it and labelled.
//
// The conservative default is deliberate: a page can always choose to show
// more, but it should have to choose.
// ============================================================

import { NATIONWIDE_PUBLISHED_LOOKBACKS, type PublishedLookback } from "./indexCreditingData";
import { assumed, sourced, type Sourced } from "./sourcing";

export type Provenance = "lived" | "backtested" | "unknown";

export interface Integrity {
  optionId: string;
  provenance: Provenance;
  /** Longest window the carrier will publish a figure for, in years. */
  longestPublished: number | null;
  /** Longest window we treat as actually lived, in years. */
  livedYears: number | null;
  /** The rate over the lived window. */
  livedRate: number | null;
  /** The carrier's longest published rate, lived or not. */
  longestRate: number | null;
  /** longestRate − livedRate. Large and positive is the hindsight signature. */
  hindsightGap: number | null;
  /** What a page may print without a label. */
  headlineRate: number | null;
  /** Why headlineRate is what it is. Always present, always renderable. */
  basis: string;
}

/**
 * Index inception dates, from Nationwide's own disclosure in the rate guide.
 * Anything published for a window beginning before these is simulated.
 */
export const INDEX_INCEPTION: Record<string, string> = {
  "jpm-mercury": "2022-04-25",
  "bnpp-hfactor": "2022-04-08",
};

/**
 * The window we treat as lived for an index established in 2022.
 *
 * Five years, because the 5-year column is the only published window that sits
 * entirely inside the index's real life as of 2026. We do not interpolate a
 * 4-year figure the carrier did not publish — inventing precision is the error
 * this whole module exists to prevent.
 */
const LIVED_WINDOW_YEARS = 5;

/** Ordered longest-first so the first non-null is the longest published. */
const COLUMNS: Array<[keyof PublishedLookback, number]> = [
  ["y30", 30], ["y25", 25], ["y20", 20], ["y15", 15], ["y10", 10], ["y5", 5],
];

function longestPublished(l: PublishedLookback): { years: number | null; rate: number | null } {
  for (const [key, years] of COLUMNS) {
    const v = l[key];
    if (typeof v === "number") return { years, rate: v };
  }
  return { years: null, rate: null };
}

/**
 * Sorts an option by whether its long windows are real.
 *
 * The rule is the carrier's own: if they will not publish a 25- or 30-year
 * figure, the index is younger than that window and every longer figure they
 * DO publish is simulated. This reads provenance off the data rather than
 * asking anyone to remember which indices are new.
 */
export function classify(l: PublishedLookback): Provenance {
  const hasLong = typeof l.y30 === "number" || typeof l.y25 === "number";
  if (hasLong) return "lived";
  const hasAny = COLUMNS.some(([k]) => typeof l[k] === "number");
  return hasAny ? "backtested" : "unknown";
}

export function integrityOf(l: PublishedLookback): Integrity {
  const provenance = classify(l);
  const { years: lpY, rate: lpR } = longestPublished(l);

  if (provenance === "lived") {
    return {
      optionId: l.optionId, provenance,
      longestPublished: lpY, livedYears: lpY, livedRate: lpR,
      longestRate: lpR, hindsightGap: null, headlineRate: lpR,
      basis: `${lpY}-year published look-back. The index has at least that much real history, so the figure is a record rather than a simulation.`,
    };
  }

  if (provenance === "unknown") {
    return {
      optionId: l.optionId, provenance,
      longestPublished: null, livedYears: null, livedRate: null,
      longestRate: null, hindsightGap: null, headlineRate: null,
      basis: "No published look-back. Nothing to show, so nothing is shown.",
    };
  }

  const lived = typeof l.y5 === "number" ? l.y5 : null;
  const gap = lpR !== null && lived !== null ? Number((lpR - lived).toFixed(2)) : null;
  return {
    optionId: l.optionId, provenance,
    longestPublished: lpY, livedYears: LIVED_WINDOW_YEARS, livedRate: lived,
    longestRate: lpR, hindsightGap: gap,
    // The headline is the LIVED figure. The backtest is available on the record
    // beside it, but it does not get to be the number on the card.
    headlineRate: lived,
    basis: lpY !== null && gap !== null
      ? `Index established 2022; the ${lpY}-year figure of ${lpR}% is back-tested, which Nationwide discloses. The ${LIVED_WINDOW_YEARS}-year figure of ${lived}% is the window the index actually lived. The gap is ${gap} points.`
      : `Index established 2022. Longer windows are back-tested.`,
  };
}

/** Every Nationwide option, sorted most-honest-first: lived before backtested. */
export function nationwideIntegrity(): Integrity[] {
  return NATIONWIDE_PUBLISHED_LOOKBACKS.map(integrityOf).sort((a, b) => {
    if (a.provenance !== b.provenance) return a.provenance === "lived" ? -1 : 1;
    return (b.headlineRate ?? -1) - (a.headlineRate ?? -1);
  });
}

/**
 * The best figure a page may print as "Nationwide's strongest allocation".
 *
 * Deliberately returns the best LIVED option rather than the best published
 * one. The difference between those two answers is the entire reason this file
 * exists: as of the current rate guide, the best published 20-year figure is
 * 19.41% on an index three years old, and the best figure standing on real
 * 20-year history is 8.48%.
 */
export function bestDefensible(): Integrity | null {
  const lived = nationwideIntegrity().filter((i) => i.provenance === "lived" && i.headlineRate !== null);
  return lived.length ? lived.reduce((a, b) => ((b.headlineRate ?? 0) > (a.headlineRate ?? 0) ? b : a)) : null;
}

/**
 * Arithmetic mean of annual returns overstates what compounded. Always.
 *
 * Over 2006–2025 the S&P 500 price series averages 10.37% arithmetically and
 * 8.86% geometrically — a 1.51-point gap that is pure artefact of the averaging
 * method. A "20-year average return" quoted arithmetically and then applied as
 * a growth rate produces a number no account ever reached.
 */
export function geometricMean(annualPercents: readonly number[]): number | null {
  if (!annualPercents.length) return null;
  const product = annualPercents.reduce((acc, r) => acc * (1 + r / 100), 1);
  if (product <= 0) return null;
  return (Math.pow(product, 1 / annualPercents.length) - 1) * 100;
}

export function arithmeticMean(annualPercents: readonly number[]): number | null {
  if (!annualPercents.length) return null;
  return annualPercents.reduce((a, b) => a + b, 0) / annualPercents.length;
}

/** How much an arithmetic average overstates the compounded result. */
export function averagingOverstatement(annualPercents: readonly number[]): number | null {
  const g = geometricMean(annualPercents), a = arithmeticMean(annualPercents);
  if (g === null || a === null) return null;
  const d = Number((a - g).toFixed(2));
  // A series with no variance gives -0 through toFixed. Nobody means negative zero.
  return Object.is(d, -0) ? 0 : d;
}

export const LOOKBACK_DISCLOSURE =
  "Figures are Nationwide's own published look-backs from the Accumulator II 2020 rate guide " +
  "(FLM-1491AO.10 (02/25)). Where an index was established in 2022, every window longer than " +
  "five years is back-tested — Nationwide's term is \"designed with the benefit of hindsight\" — " +
  "and this platform shows the lived window as the headline with the back-test labelled beside it.";

// ============================================================
// START-YEAR INTEGRITY — how much of a backtest is the choice of where it begins.
//
// The published table above is one carrier's; the same trick works on any
// series. Choose the start year after a crash and a ten-year backtest looks
// like a strategy; choose it at a peak and the same strategy looks broken.
// Neither number is false. Each is one draw from the set of every window of
// that length the history allows, and a reader shown one draw without the
// others cannot tell which kind they were handed.
//
// So a window is never judged on its own. `startYearIntegrity()` places it in
// the full distribution of same-length windows from the same series, reports
// where it ranks, and flags it when it sits in the flattering tail. The flag is
// arithmetic on the series; the thresholds are named constants below and are
// declared as assumptions in LOOKBACK_INTEGRITY_SOURCES, not dressed as rules.
// ============================================================

/** Calendar-year returns in percent, keyed by year. */
export type AnnualSeries = Readonly<Record<number, number>>;

export interface LookbackWindow {
  startYear: number;
  endYear: number;
  years: number;
  /** Compounded (geometric) annual rate over the window, percent. Null on a total loss. */
  compounded: number | null;
  /** Arithmetic mean of the annual rates, percent — shown beside, never instead. */
  arithmetic: number | null;
}

export type WindowVerdict =
  /** In the top tail of same-length windows: the start year is doing the work. */
  | "flattering"
  /** In the bottom tail: the start year makes the strategy look worse than typical. */
  | "unflattering"
  /** Inside the middle of the distribution. */
  | "typical"
  /** Too few same-length windows to rank against. Reported, not ranked. */
  | "thin"
  /** The window runs outside the years the series holds. */
  | "unplaced";

export interface StartYearIntegrity {
  chosen: LookbackWindow | null;
  /** Every same-length window the series holds, by start year. */
  windows: LookbackWindow[];
  n: number;
  /** Mid-rank percentile of the chosen window among `windows`, 0–100. */
  percentile: number | null;
  median: number | null;
  best: LookbackWindow | null;
  worst: LookbackWindow | null;
  /** chosen − median, in points. */
  vsMedian: number | null;
  /** The market's return in the year before the window begins, when known. */
  priorYearReturn: number | null;
  /** True when the window begins straight after a fall of TROUGH_DROP or worse. */
  startsAfterDrop: boolean;
  verdict: WindowVerdict;
  /** True only for "flattering": the case a reader must be warned about. */
  flagged: boolean;
  /** One renderable paragraph. Always present. */
  basis: string;
}

/** A window at or above this percentile of its peers is flagged as cherry-picked. */
export const CHERRY_PICK_PERCENTILE = 80;
/** A window at or below this percentile is reported as unflattering. */
export const UNFLATTERING_PERCENTILE = 20;
/** Fewer same-length windows than this is too thin to rank (sourcing.ts tooThin default). */
export const MIN_WINDOWS_TO_RANK = 15;
/** A prior-year market return at or below this (percent) counts as starting after a fall. */
export const TROUGH_DROP = -10;

const round2 = (x: number) => Number(x.toFixed(2));

/** Years the series holds, ascending. */
export function seriesYears(series: AnnualSeries): number[] {
  return Object.keys(series).map(Number).filter((y) => Number.isFinite(series[y])).sort((a, b) => a - b);
}

/** One window, or null when any year in it is missing from the series. */
export function windowOf(series: AnnualSeries, startYear: number, years: number): LookbackWindow | null {
  if (!Number.isInteger(years) || years < 1) return null;
  const rates: number[] = [];
  for (let y = startYear; y < startYear + years; y++) {
    const r = series[y];
    if (typeof r !== "number" || !Number.isFinite(r)) return null;
    rates.push(r);
  }
  const g = geometricMean(rates), a = arithmeticMean(rates);
  return {
    startYear, endYear: startYear + years - 1, years,
    compounded: g === null ? null : round2(g),
    arithmetic: a === null ? null : round2(a),
  };
}

/** Every complete window of `years` length, one per start year, ascending. */
export function allWindows(series: AnnualSeries, years: number): LookbackWindow[] {
  const ys = seriesYears(series);
  const out: LookbackWindow[] = [];
  for (const start of ys) {
    const w = windowOf(series, start, years);
    if (w) out.push(w);
  }
  return out;
}

/**
 * "Since year X" figures: every start year compounded through the same end year.
 *
 * The form in which start-year choice most often reaches a reader — a figure
 * quoted "since" a crash year — and the one where it is hardest to see, because the
 * window length changes with the start and nothing on the page looks chosen.
 */
export function sinceSweep(series: AnnualSeries, endYear: number, minYears = 5): LookbackWindow[] {
  const out: LookbackWindow[] = [];
  for (const start of seriesYears(series)) {
    const years = endYear - start + 1;
    if (years < minYears) continue;
    const w = windowOf(series, start, years);
    if (w) out.push(w);
  }
  return out;
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/**
 * Where a chosen backtest window sits among every window of the same length.
 *
 * `series` is what the backtest compounds (raw or credited). `market`, when
 * given, is the raw index used to tell whether the window starts just after a
 * fall — a credited series is floored at zero and cannot show the crash.
 */
export function startYearIntegrity(
  series: AnnualSeries,
  startYear: number,
  years: number,
  market: AnnualSeries = series,
): StartYearIntegrity {
  const windows = allWindows(series, years).filter((w) => w.compounded !== null);
  const chosen = windowOf(series, startYear, years);
  const rates = windows.map((w) => w.compounded as number);
  const n = windows.length;
  const med = median(rates);
  const best = n ? windows.reduce((a, b) => ((b.compounded as number) > (a.compounded as number) ? b : a)) : null;
  const worst = n ? windows.reduce((a, b) => ((b.compounded as number) < (a.compounded as number) ? b : a)) : null;
  const prior = market[startYear - 1];
  const priorYearReturn = typeof prior === "number" && Number.isFinite(prior) ? prior : null;
  const startsAfterDrop = priorYearReturn !== null && priorYearReturn <= TROUGH_DROP;

  const base = { windows, n, median: med === null ? null : round2(med), best, worst, priorYearReturn, startsAfterDrop };

  if (!chosen || chosen.compounded === null) {
    return {
      ...base, chosen, percentile: null, vsMedian: null, verdict: "unplaced", flagged: false,
      basis: `The ${years}-year window from ${startYear} runs outside the years this series holds, so it cannot be compared with anything.`,
    };
  }

  const c = chosen.compounded;
  const below = rates.filter((r) => r < c).length;
  const equal = rates.filter((r) => r === c).length;
  const percentile = n ? round2(((below + 0.5 * equal) / n) * 100) : null;
  const vsMedian = med === null ? null : round2(c - med);
  const range = best && worst
    ? `Across all ${n} such windows the same method compounds from ${worst.compounded}% (${worst.startYear}–${worst.endYear}) to ${best.compounded}% (${best.startYear}–${best.endYear}); the median is ${base.median}%.`
    : "";

  let verdict: WindowVerdict;
  if (n < MIN_WINDOWS_TO_RANK) verdict = "thin";
  else if ((percentile as number) >= CHERRY_PICK_PERCENTILE) verdict = "flattering";
  else if ((percentile as number) <= UNFLATTERING_PERCENTILE) verdict = "unflattering";
  else verdict = "typical";

  const head =
    verdict === "thin"
      ? `Only ${n} ${years}-year window${n === 1 ? "" : "s"} fit in this series — too few to say whether ${startYear}–${chosen.endYear} is typical.`
      : verdict === "flattering"
        ? `${startYear}–${chosen.endYear} compounds at ${c}%, better than ${Math.round(percentile as number)}% of ${years}-year windows. The start year is flattering the result.`
        : verdict === "unflattering"
          ? `${startYear}–${chosen.endYear} compounds at ${c}%, worse than ${100 - Math.round(percentile as number)}% of ${years}-year windows. This start year understates the method.`
          : `${startYear}–${chosen.endYear} compounds at ${c}%, near the middle of ${years}-year windows (percentile ${Math.round(percentile as number)}).`;

  const drop = !startsAfterDrop ? ""
    : verdict === "flattering"
      ? ` It also begins the year after a ${priorYearReturn}% market fall, so it starts from a low base.`
      : ` It begins the year after a ${priorYearReturn}% market fall.`;

  return {
    ...base, chosen, percentile, vsMedian, verdict, flagged: verdict === "flattering",
    basis: [head, range].filter(Boolean).join(" ") + drop,
  };
}

/** A calendar-year series of credited rates from any per-year crediting function. */
export function creditedSeries(market: AnnualSeries, credit: (raw: number, year: number) => number): Record<number, number> {
  const out: Record<number, number> = {};
  for (const y of seriesYears(market)) out[y] = credit(market[y]!, y);
  return out;
}

/**
 * Where this engine's figures come from, as `Sourced` records (shared/sourcing.ts).
 *
 * The published look-backs and the index series are sourced and dated. The
 * thresholds that turn a ranking into a flag are the firm's conventions, so
 * they are carried as assumptions: the sources footer prints them under "we
 * assumed" and `assertSourced` would refuse them, which is the point.
 */
export const LOOKBACK_INTEGRITY_SOURCES: readonly Sourced<string | number>[] = [
  sourced(
    "Published look-back rates by option (30, 25, 20, 15, 10 and 5 years)",
    "Nationwide, Accumulator II 2020 IUL rate guide, FLM-1491AO.10 (02/25)",
    "2025-01-15",
  ),
  sourced(
    "Index inception dates: J.P. Morgan Mercury 2022-04-25, BNP Paribas Global H-Factor 2022-04-08",
    "Nationwide, Accumulator II 2020 IUL rate guide, FLM-1491AO.10 (02/25), index disclosures",
    "2025-01-15",
  ),
  sourced(
    "S&P 500 calendar-year price returns, 1994-2025 (total return less dividend)",
    "ChartRow, S&P 500 Returns by Year",
    "2026-09-14",
    { url: "https://chartrow.com/sp500/returns" },
  ),
  assumed(LIVED_WINDOW_YEARS, `An index established in 2022 is treated as having lived only the ${LIVED_WINDOW_YEARS}-year published window; no shorter figure is interpolated.`),
  assumed(CHERRY_PICK_PERCENTILE, `A window ranking at or above the ${CHERRY_PICK_PERCENTILE}th percentile of same-length windows is flagged as flattering. The firm's convention, not a regulatory standard.`),
  assumed(MIN_WINDOWS_TO_RANK, `Fewer than ${MIN_WINDOWS_TO_RANK} same-length windows is too thin to rank, matching the sample-size floor in shared/sourcing.ts.`),
  assumed(TROUGH_DROP, `A window is noted as starting after a fall when the prior calendar year returned ${TROUGH_DROP}% or worse.`),
];
