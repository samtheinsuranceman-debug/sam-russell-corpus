/**
 * SI-021 — named historical shocks, run against a policy's own floor and cap.
 *
 * The portfolio review called the old name a misnomer, and it was: nothing
 * about this concerns quantum computing. What it actually does is worth more
 * than the name it had.
 *
 * A Monte Carlo answers "what happens across ten thousand futures". It is the
 * right tool and it persuades nobody, because no client has lived in a
 * distribution. They lived through 2008. So this takes the named events people
 * remember, runs the policy's contractual floor and cap across the actual
 * index changes of those years, and reports what would have been credited.
 *
 * ## The sourcing rule applies here too
 *
 * A shock window is only offered when the index series we hold actually covers
 * it. RAW_INDEX_RETURNS begins in 1994, so the 1973-74 oil shock and Black
 * Monday 1987 are declared unavailable with the reason, rather than being
 * filled in from memory. A stress test built on half-remembered numbers is
 * worse than one that is honest about its window, because the numbers look
 * exactly as authoritative either way.
 */

import { RAW_INDEX_RETURNS } from './indexCreditingData';

export interface ShockWindow {
  readonly id: string;
  readonly label: string;
  /** What happened, in one sentence a client would recognise. */
  readonly description: string;
  readonly fromYear: number;
  readonly toYear: number;
}

/**
 * The events clients name unprompted. Windows are inclusive of both years.
 * Two are listed deliberately outside our data so the surface can show them
 * as unavailable rather than silently omitting them — an omission looks like
 * the event never happened.
 */
export const SHOCKS: readonly ShockWindow[] = [
  { id: 'oil-1973', label: 'The 1973–74 oil shock', fromYear: 1973, toYear: 1974,
    description: 'An embargo quadrupled the oil price; equities fell hard across two years while inflation ran into double digits.' },
  { id: 'black-monday-1987', label: 'Black Monday, 1987', fromYear: 1987, toYear: 1987,
    description: 'The largest single-day percentage fall on record.' },
  { id: 'dotcom-2000', label: 'The dot-com unwind, 2000–2002', fromYear: 2000, toYear: 2002,
    description: 'Three consecutive losing years — the only such run in the modern series.' },
  { id: 'gfc-2008', label: 'The financial crisis, 2008', fromYear: 2008, toYear: 2008,
    description: 'Credit markets seized and equities lost roughly a third of their value in a year.' },
  { id: 'covid-2020', label: 'The pandemic crash, 2020', fromYear: 2020, toYear: 2020,
    description: 'The fastest fall into a bear market on record, followed by an equally sharp recovery.' },
  { id: 'rates-2022', label: 'The rate shock, 2022', fromYear: 2022, toYear: 2022,
    description: 'Stocks and bonds fell together — the diversification most retirees rely on did not hold.' },
];

export interface ShockYear {
  readonly year: number;
  readonly indexChange: number;
  readonly creditedRate: number;
  readonly floorHeld: boolean;
  readonly capApplied: boolean;
}

export interface ShockResult {
  readonly shock: ShockWindow;
  readonly available: true;
  readonly years: readonly ShockYear[];
  /** Cumulative index change across the window, compounded. */
  readonly indexCumulative: number;
  /** Cumulative credited change across the window, compounded. */
  readonly creditedCumulative: number;
  /** Percentage points of loss the floor absorbed across the window. */
  readonly protectedBy: number;
}

export interface ShockUnavailable {
  readonly shock: ShockWindow;
  readonly available: false;
  readonly reason: string;
}

export interface PolicyTerms {
  /** Cap as a percentage, e.g. 9.5. */
  readonly cap: number;
  /** Floor as a percentage, usually 0. */
  readonly floor: number;
  /** Participation as a percentage, e.g. 100. */
  readonly participation: number;
}

/** The order a carrier applies them: participation, then cap, then floor. */
export function creditFor(indexChange: number, terms: PolicyTerms): number {
  let c = indexChange * (terms.participation / 100);
  if (c > terms.cap) c = terms.cap;
  if (c < terms.floor) c = terms.floor;
  return c;
}

function compound(changes: readonly number[]): number {
  return (changes.reduce((acc, c) => acc * (1 + c / 100), 1) - 1) * 100;
}

/** The span of years the held series actually covers. */
export function coverage(indexKey: string): { from: number; to: number } | null {
  const series = RAW_INDEX_RETURNS[indexKey];
  if (!series) return null;
  const years = Object.keys(series).map(Number).filter(Number.isFinite);
  if (!years.length) return null;
  return { from: Math.min(...years), to: Math.max(...years) };
}

/**
 * Run one shock. Returns an unavailable result rather than throwing or
 * quietly returning an empty window, so a caller can render the reason.
 */
export function runShock(
  shock: ShockWindow,
  terms: PolicyTerms,
  indexKey = 'SP500'
): ShockResult | ShockUnavailable {
  const cov = coverage(indexKey);
  const series = RAW_INDEX_RETURNS[indexKey];
  if (!cov || !series) {
    return { shock, available: false, reason: `No index history is held for ${indexKey}.` };
  }
  if (shock.fromYear < cov.from || shock.toYear > cov.to) {
    return {
      shock,
      available: false,
      reason:
        `The held ${indexKey} series runs ${cov.from}–${cov.to}, which does not cover ${shock.fromYear}–${shock.toYear}. ` +
        `Rather than fill the gap from memory, this window is left out. A sourced series covering it would make it available.`,
    };
  }

  const years: ShockYear[] = [];
  for (let y = shock.fromYear; y <= shock.toYear; y++) {
    const indexChange = series[y];
    if (typeof indexChange !== 'number') {
      return { shock, available: false, reason: `The held series has no value for ${y}.` };
    }
    const creditedRate = creditFor(indexChange, terms);
    years.push({
      year: y,
      indexChange,
      creditedRate,
      floorHeld: indexChange < 0 && creditedRate >= terms.floor,
      capApplied: indexChange * (terms.participation / 100) > terms.cap,
    });
  }

  const indexCumulative = compound(years.map((y) => y.indexChange));
  const creditedCumulative = compound(years.map((y) => y.creditedRate));

  return {
    shock,
    available: true,
    years,
    indexCumulative,
    creditedCumulative,
    // The number the exhibit exists to show. Positive means the floor kept
    // value the index gave up.
    protectedBy: creditedCumulative - indexCumulative,
  };
}

export function runAllShocks(
  terms: PolicyTerms,
  indexKey = 'SP500'
): readonly (ShockResult | ShockUnavailable)[] {
  return SHOCKS.map((s) => runShock(s, terms, indexKey));
}

export function isAvailable(r: ShockResult | ShockUnavailable): r is ShockResult {
  return r.available;
}
