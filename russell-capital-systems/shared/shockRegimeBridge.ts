// ─── Shock ↔ regime bridge ──────────────────────────────────────────────────
//
// ## The problem this closes
//
// `historicalShocks.ts` runs a policy's floor and cap across the actual index
// changes of the years clients remember. It is the right exhibit, and it is
// honest about its limit: `RAW_INDEX_RETURNS` begins in 1994, so the 1973–74
// oil shock and Black Monday 1987 come back as `available: false` with a
// reason, rather than being filled in from memory. That refusal is correct and
// must stay.
//
// But "unavailable" is the worst possible answer for precisely those two
// windows, because the clients who remember them are the ones with the longest
// horizon and the most at stake. An older client who asks "what would this have
// done in the seventies?" and is told the system has nothing has learned
// something false — that the event is beyond the platform's reach — when in
// fact the platform holds CPI from 1947, home prices from 1975 and the prime
// rate from 1955.
//
// ## What this bridge does, and what it refuses to do
//
// It attaches a REGIME READING to an unavailable window: what kind of years
// those were, computed from series that do cover them, with the basis sentence
// and the window stated.
//
// It does NOT invent a credited rate. There is no index series for 1973, so no
// crediting figure is produced, and the returned shape says so explicitly. The
// distinction is the whole point: a regime reading describes the economic
// weather; a credited rate is a contractual calculation. Blurring them would
// reintroduce exactly the fabrication `historicalShocks` refuses.
//
// So the surface moves from:
//
//     "The 1973–74 oil shock — unavailable."
//
// to:
//
//     "The 1973–74 oil shock. We hold no index series for these years, so no
//      credited rate is shown. What the record does say: 1973 and 1974 were
//      stagflation — inflation at 11.0% with real asset growth of −4.2%."
//
// That is strictly more information, honestly bounded.

import type { ShockResult, ShockUnavailable, ShockWindow } from "./historicalShocks";
import { isAvailable } from "./historicalShocks";
import { classifyRegimes, type RegimeInput, type RegimeYear, type Regime } from "./marketRegimeClassifier";
import type { AnnualSeries, Evidence } from "./rentalMarketEngine";

export interface RegimeReading {
  readonly year: number;
  readonly regime: Regime;
  readonly basis: string;
  readonly cpiGrowth: number | null;
  readonly assetGrowth: number | null;
  readonly realAssetGrowth: number | null;
}

export interface ShockContext {
  readonly shock: ShockWindow;
  /** The crediting result, where an index series covers the window. */
  readonly credited: ShockResult | null;
  /** Why no crediting figure exists, where it does not. */
  readonly creditedUnavailableReason: string | null;
  /** What kind of years these were, from series that do cover them. */
  readonly regimes: readonly RegimeReading[];
  /** The dominant regime across the window, where one exists. */
  readonly dominantRegime: Regime | null;
  /** Null where no supplied series covers the window either. */
  readonly regimeEvidence: Evidence | null;
  /** Why no regime reading exists, where none does. */
  readonly regimeUnavailableReason: string | null;
  /** One sentence a page can render without composing it itself. */
  readonly summary: string;
}

/** Never claim a credited rate came from a regime reading. */
export const BRIDGE_DISCLOSURE =
  "A regime reading describes what kind of years these were, computed from consumer prices, asset values and the benchmark rate. " +
  "It is not a credited rate and never substitutes for one: where no index series covers a window, no crediting figure is shown.";

function pct(x: number | null): string {
  return x == null ? "not on file" : (x * 100).toFixed(1) + "%";
}

function dominant(readings: readonly RegimeReading[]): Regime | null {
  if (readings.length === 0) return null;
  const count: Record<string, number> = {};
  for (let i = 0; i < readings.length; i++) {
    const r = readings[i].regime;
    if (r === "unclassified") continue;
    count[r] = (count[r] || 0) + 1;
  }
  const keys = Object.keys(count);
  if (keys.length === 0) return null;
  let best = keys[0];
  for (let i = 1; i < keys.length; i++) if (count[keys[i]] > count[best]) best = keys[i];
  return best as Regime;
}

function phrase(regime: Regime | null, readings: readonly RegimeReading[]): string {
  if (!regime || readings.length === 0) return "";
  const withCpi = readings.filter((r) => r.cpiGrowth != null);
  const withReal = readings.filter((r) => r.realAssetGrowth != null);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const cpi = withCpi.length ? avg(withCpi.map((r) => r.cpiGrowth as number)) : null;
  const real = withReal.length ? avg(withReal.map((r) => r.realAssetGrowth as number)) : null;
  const label = regime.replace("-", " ");
  if (cpi == null && real == null) return `What the record does say: these were ${label} years.`;
  if (real == null) return `What the record does say: ${label} — inflation averaging ${pct(cpi)}.`;
  return `What the record does say: ${label} — inflation averaging ${pct(cpi)} with real asset growth of ${pct(real)}.`;
}

/**
 * Attach a regime reading to one shock result.
 *
 * `series` supplies whatever long history is held — CPI reaches 1947, FHFA home
 * prices 1975, the prime rate 1955. Pass what you have; the classifier states
 * its own window and labels a year `unclassified` where any input is blank
 * rather than guessing.
 */
export function contextFor(
  result: ShockResult | ShockUnavailable,
  series: RegimeInput,
): ShockContext {
  const shock = result.shock;
  const credited = isAvailable(result) ? result : null;
  const creditedUnavailableReason = isAvailable(result) ? null : result.reason;

  const classification = classifyRegimes(series);
  const inWindow: RegimeReading[] = [];
  for (let i = 0; i < classification.years.length; i++) {
    const y: RegimeYear = classification.years[i];
    if (y.year < shock.fromYear || y.year > shock.toYear) continue;
    if (y.regime === "unclassified") continue;
    inWindow.push({
      year: y.year,
      regime: y.regime,
      basis: y.basis,
      cpiGrowth: y.cpiGrowth,
      assetGrowth: y.assetGrowth,
      realAssetGrowth: y.realAssetGrowth,
    });
  }

  const dom = dominant(inWindow);
  const regimeUnavailableReason =
    inWindow.length > 0
      ? null
      : `No supplied series covers ${shock.fromYear}–${shock.toYear}` +
        (classification.evidence.window
          ? `; the series on hand run ${classification.evidence.window.from}–${classification.evidence.window.to}.`
          : ".");

  let summary: string;
  if (credited) {
    summary = `${shock.label}. ${shock.description}`;
    const p = phrase(dom, inWindow);
    if (p) summary += " " + p;
  } else {
    summary = `${shock.label}. ${shock.description} We hold no index series for these years, so no credited rate is shown.`;
    const p = phrase(dom, inWindow);
    summary += p ? " " + p : "";
  }

  return {
    shock,
    credited,
    creditedUnavailableReason,
    regimes: inWindow,
    dominantRegime: dom,
    regimeEvidence: inWindow.length > 0 ? classification.evidence : null,
    regimeUnavailableReason,
    summary,
  };
}

/** Every shock, each with whatever the record can say about it. */
export function contextForAll(
  results: readonly (ShockResult | ShockUnavailable)[],
  series: RegimeInput,
): readonly ShockContext[] {
  return results.map((r) => contextFor(r, series));
}

/**
 * How much the bridge actually recovered.
 *
 * Reported rather than assumed: if the supplied series do not in fact reach
 * back, the count is zero and the surface should say so rather than implying a
 * coverage it does not have.
 */
export function recoveredWindows(contexts: readonly ShockContext[]): {
  total: number;
  credited: number;
  regimeOnly: number;
  stillDark: number;
} {
  let credited = 0, regimeOnly = 0, stillDark = 0;
  for (let i = 0; i < contexts.length; i++) {
    const c = contexts[i];
    if (c.credited) credited += 1;
    else if (c.regimes.length > 0) regimeOnly += 1;
    else stillDark += 1;
  }
  return { total: contexts.length, credited, regimeOnly, stillDark };
}

/** Convenience for callers holding raw series rather than a RegimeInput. */
export function seriesInput(
  cpi: AnnualSeries | null,
  assetIndex: AnnualSeries | null,
  policyRate?: AnnualSeries | null,
): RegimeInput {
  return { cpi, assetIndex, policyRate: policyRate ?? null };
}
