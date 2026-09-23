/**
 * Reverse walk — history from 2025 back to 1888, one year at a time (Q6).
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The owner's ask (23 Sep 2026): "going in reverse time … one year at a time".
 * The study spec (04_THE_100_INDICATOR_REVERSE_TIME_STUDY.md §2, §3, §5 Q6):
 * patterns learned on the best-measured recent data (E5, 1990–2025) are
 * carried backwards, year by year, as the indicator set shrinks. Each year
 * gets an EPOCH CARD; each pattern gets a running hit rate with a Wilson
 * lower bound; the first year (walking back) at which that lower bound falls
 * below the pattern's pre-registered base-rate threshold is its BREAK YEAR,
 * and the atlas says which documented regime change that year sits next to.
 *
 * Why backwards: a pattern learned on 1990–2025 has never seen 1935–1989, so
 * every earlier year is fresh evidence (§2.1); the break year says what the
 * pattern depends on (§2.2: breaks at 1971 → fiat regime, at 2008 → QE); and
 * each step back is scored only on the indicators that existed (§2.3).
 *
 * The steps, all pure:
 *   1. `eraOf(year)` — E1 ≤ 1888, E2 1889–1935, E3 1936–1961, E4 1962–1989,
 *      E5 1990–2025. Boundaries are rules-table rows (`walk.era.*`).
 *   2. `indicatorsAvailable(year, catalogue)` — the toolkit that year. The
 *      embedded catalogue is the study's 100 indicators with their earliest
 *      usable years; it reproduces the spec's 100/96/93/87/81/73/67/54/41.
 *   3. `epochCard(year, inputs)` — indicators available, every state change
 *      that year (available indicators only), the bull/bear phase, and every
 *      firing of every pre-registered pattern with whether its target followed
 *      within the horizon (`true`, `false`, or `null` when the window runs past
 *      the target's coverage — unknown stays unknown).
 *   4. `reverseWalk(fromYear, toYear, inputs)` — iterates DOWNWARD one year at
 *      a time, keeping each pattern's cumulative firings, hits, hit rate and
 *      Wilson (1927) lower bound after every year.
 *   5. `breakYear(history, pattern)` — first year (in walk order) with at least
 *      `walk.minFirings` scored firings and a lower bound below the pattern's
 *      pre-registered threshold.
 *   6. `atlasMarkdown(result)` — REVERSE_WALK_ATLAS.md: one life line per
 *      pattern, the break year and the regime events it coincides with.
 *
 * Two guards, both tested:
 *   • A pattern is NEVER scored in a year where any member indicator did not
 *     yet exist (catalogue `earliestUsableYear` > year). Supplied state data
 *     for such a year is ignored, because a series back-cast before its
 *     source begins is not evidence.
 *   • A pattern with no valid `preRegisteredAt` cannot fire in a holdout year
 *     (before E5's first year). Looking at a holdout before pre-registering
 *     spoils it (§3), so such a pattern is scored on E5 only.
 *
 * What a firing is: the ONSET month of the pattern (all members in their
 * stated states this month, not all last month). A pattern that stays active
 * for twelve months is one firing, not twelve (§5, "count episodes").
 *
 * Pure: no fetch, no database, no `process`, no clock, no randomness. Same
 * inputs, same cards, same atlas.
 *
 * ─── PORT STEPS (to sam-russell-corpus/russell-capital-systems @ master) ────
 *  1. Copy `shared/macro/reverseWalk.ts`. It imports only `./assumptions`
 *     (the `Assumption` row type) and `./types` (`IsoDate`). Nothing else in
 *     the trunk changes; its rules live in `REVERSE_WALK_RULES` below so it
 *     does not collide with other agents' rows in `assumptions.ts`. If the
 *     lead prefers one table, append `REVERSE_WALK_RULES` to `assumptions.ts`
 *     with `T.push(...REVERSE_WALK_RULES)` and switch `walkRule()` to `A()`.
 *  2. Add `export * from "./reverseWalk";` to `shared/macro/index.ts`.
 *  3. Copy `server/macroReverseWalk.test.ts` (tests live in `server/` because
 *     the trunk's vitest config includes `server/**` only).
 *  4. Proof of done: `pnpm check` 0; `npx vitest run server/macroReverseWalk.test.ts`
 *     green, offline.
 *  5. Real run (not in this module): feed `states` from A10's
 *     `states/<id>.csv`, the chronology from A09's `bear_bull_chronology.csv`,
 *     patterns from `PREREGISTRATION.md` (A01), then write each
 *     `epochCardFiles(result)` entry to disk and `atlasMarkdown(result)` to
 *     `REVERSE_WALK_ATLAS.md`.
 *
 * Standing rules honoured: every threshold is a rules row with source and
 * asOf; no DeepSeek; no secrets; iteration via `Array.from` (no downlevel
 * iteration needed).
 */
import type { Assumption } from "./assumptions";
import type { IsoDate } from "./types";

// ─── Rules table ─────────────────────────────────────────────────────────────

const SPEC = "04_THE_100_INDICATOR_REVERSE_TIME_STUDY.md §3 (Sam, handoff 23 Sep 2026)";
const WILSON = "Wilson, E. B. (1927), 'Probable inference, the law of succession, and statistical inference', JASA 22(158): 209–212";
const BCD = "Brown, L. D., Cai, T. T. & DasGupta, A. (2001), 'Interval estimation for a binomial proportion', Statistical Science 16(2): 101–133";

export const REVERSE_WALK_RULES: Assumption[] = [
  { id: "walk.era.E1.last", value: 1888, unit: "year", kind: "threshold", source: SPEC, asOf: "2026-09-23", basis: "E1 is 1888 and before: only the long series (prices, rates, money, iron, railroads, gold); 41 indicators." },
  { id: "walk.era.E2.first", value: 1889, unit: "year", kind: "threshold", source: SPEC, asOf: "2026-09-23", basis: "E2 1889–1935: gold standard, no Fed until 1914, 1907 panic, 1929–33; 43–73 indicators." },
  { id: "walk.era.E3.first", value: 1936, unit: "year", kind: "threshold", source: SPEC, asOf: "2026-09-23", basis: "E3 1936–1961: war finance, Bretton Woods, the 1951 Accord; 73–88 indicators." },
  { id: "walk.era.E4.first", value: 1962, unit: "year", kind: "threshold", source: SPEC, asOf: "2026-09-23", basis: "E4 1962–1989: Great Inflation, 1971, Volcker; 88–95 indicators." },
  { id: "walk.era.E5.first", value: 1990, unit: "year", kind: "threshold", source: SPEC, asOf: "2026-09-23", basis: "E5 1990–2025 is the training window; every earlier year is holdout (E3+E4 first, E1+E2 second)." },
  { id: "walk.era.E5.last", value: 2025, unit: "year", kind: "threshold", source: SPEC, asOf: "2026-09-23", basis: "The walk starts at 2025, the last complete year of the study." },
  { id: "walk.wilson.confidence", value: 0.95, unit: "two-sided confidence", kind: "model-choice", source: `${WILSON}; ${BCD}`, asOf: "1927-06-01", basis: "The hit-rate lower bound is the lower end of the two-sided 95 % Wilson score interval (z ≈ 1.96). Brown–Cai–DasGupta recommend Wilson over the Wald interval for small n, which is the reverse walk's regime (tens of firings, not thousands)." },
  { id: "walk.minFirings", value: 10, unit: "scored firings", kind: "threshold", source: `${WILSON}; ${BCD}`, asOf: "2001-05-01", basis: "Below ten trials the Wilson bound is dominated by the z²/(n+z²) shrinkage (10/10 hits still only reaches 0.72) and binomial coverage is erratic (Brown–Cai–DasGupta Fig. 1–5); no break is declared before ten scored firings." },
  { id: "walk.coincidence.lagYears", value: 5, unit: "years", kind: "model-choice", source: "platform", asOf: "2026-09-23", basis: "Walking back, the failures that sink the lower bound accumulate AFTER the walk passes a regime change, so the declared break year lies at or up to ~5 years before the event year (a pattern firing every one to two years needs a few misses to pull a 10+-firing bound down)." },
];

const RULES: ReadonlyMap<string, Assumption> = new Map(REVERSE_WALK_RULES.map(r => [r.id, r]));

/** Read a reverse-walk rule. Throws on an unknown id. */
export function walkRule(id: string): number {
  const r = RULES.get(id);
  if (!r) throw new Error(`Unknown reverse-walk rule: ${id}`);
  return r.value;
}

// ─── Regime events (the "what does the break year coincide with" list) ──────

export type RegimeEvent = { id: string; from: number; to: number; label: string; source: string; asOf: IsoDate };

export const REGIME_EVENTS: RegimeEvent[] = [
  { id: "fed-founded", from: 1913, to: 1913, label: "Federal Reserve Act signed (23 Dec 1913)", source: "Federal Reserve Act, 38 Stat. 251 (1913); Federal Reserve History, 'Federal Reserve Act Signed into Law'", asOf: "1913-12-23" },
  { id: "fed-opens-ww1", from: 1914, to: 1914, label: "Reserve Banks open; NYSE closed Jul–Dec 1914 (WWI)", source: "Silber, W. L. (2007), When Washington Shut Down Wall Street, Princeton; Federal Reserve History, 'The Founding of the Fed'", asOf: "1914-11-16" },
  { id: "gold-devaluation", from: 1933, to: 1934, label: "Gold devaluation: EO 6102 (Apr 1933), Gold Reserve Act (Jan 1934), $20.67 → $35/oz", source: "Executive Order 6102 (5 Apr 1933); Gold Reserve Act, 48 Stat. 337 (30 Jan 1934); Friedman & Schwartz (1963) ch. 8", asOf: "1934-01-31" },
  { id: "bretton-woods", from: 1944, to: 1944, label: "Bretton Woods agreement (Jul 1944)", source: "United Nations Monetary and Financial Conference, Final Act (22 Jul 1944); Bordo & Eichengreen (1993), A Retrospective on the Bretton Woods System, NBER", asOf: "1944-07-22" },
  { id: "treasury-fed-accord", from: 1951, to: 1951, label: "Treasury–Fed Accord ends the bond-price peg (4 Mar 1951)", source: "Hetzel, R. L. & Leach, R. F. (2001), 'The Treasury-Fed Accord: A New Narrative Account', FRB Richmond Economic Quarterly 87(1)", asOf: "1951-03-04" },
  { id: "end-convertibility", from: 1971, to: 1971, label: "End of dollar–gold convertibility (15 Aug 1971)", source: "Nixon, R. M., Address to the Nation, 15 Aug 1971; Federal Reserve History, 'Nixon Ends Convertibility of U.S. Dollars to Gold'", asOf: "1971-08-15" },
  { id: "volcker", from: 1979, to: 1979, label: "Volcker shift to reserve targeting (6 Oct 1979)", source: "Lindsey, D. E., Orphanides, A. & Rasche, R. H. (2005), 'The Reform of October 1979', FRB St. Louis Review 87(2)", asOf: "1979-10-06" },
  { id: "zero-rates-qe", from: 2008, to: 2008, label: "Zero policy rate and QE1 (25 Nov / 16 Dec 2008)", source: "FOMC statement, 16 Dec 2008; Federal Reserve press release, 25 Nov 2008 (GSE MBS purchases)", asOf: "2008-12-16" },
];

// ─── The 100-indicator catalogue (research_100_indicators.csv) ──────────────

export type WalkCatalogueEntry = {
  n: number;
  id: string;
  name: string;
  earliestUsableYear: number;
  speed: string;
  keystoneCandidate: boolean;
  source: string;
  asOf: IsoDate;
};

const CATALOGUE_AS_OF = "2026-09-23";
type CatRow = [number, string, string, number, string, boolean, string];
const CAT: CatRow[] = [
  [1, "eq-sp-composite", "S&P Composite price, nominal and real", 1871, "fast", false, "Shiller online data (econ.yale.edu/~shiller/data.htm)"],
  [2, "eq-dividend-yield", "Dividend yield", 1871, "slow", false, "Goyal-Welch predictor data (sites.google.com/view/agoyal145)"],
  [3, "eq-cape", "Cyclically adjusted P/E (CAPE)", 1881, "slow", true, "Shiller online data (econ.yale.edu/~shiller/data.htm)"],
  [4, "eq-earnings-growth", "S&P earnings, 12-month growth", 1872, "medium", false, "Shiller online data (econ.yale.edu/~shiller/data.htm)"],
  [5, "eq-djia-daily", "Dow Jones Industrial Average, daily", 1885, "fast", false, "MeasuringWorth (measuringworth.com)"],
  [6, "eq-dow-transports", "Dow Transportation (Rail) Average", 1896, "fast", false, "S&P Dow Jones Indices; historical via Barron's archives"],
  [7, "eq-realized-vol", "Realized stock volatility (monthly from daily)", 1885, "fast", false, "Goyal-Welch predictor data (sites.google.com/view/agoyal145); Schwert (1989)"],
  [8, "eq-volume", "NYSE share volume", 1900, "fast", false, "NYSE Facts and Figures archive"],
  [9, "eq-net-issuance", "Net equity issuance", 1926, "medium", false, "Goyal-Welch predictor data (sites.google.com/view/agoyal145)"],
  [10, "eq-stock-bond-corr", "Stock-bond return correlation, rolling 36 months", 1871, "slow", true, "Computed from Shiller stock and long-bond returns"],
  [11, "rt-long-yield", "Long-term government bond yield", 1871, "slow", true, "Shiller online data (econ.yale.edu/~shiller/data.htm); FRED GS10 from 1953"],
  [12, "rt-short-rate", "Short rate: commercial paper to 1934, 3-month bill after", 1857, "medium", false, "NBER Macrohistory Database (nber.org/research/data/nber-macrohistory-database); FRED (fred.stlouisfed.org) TB3MS"],
  [13, "rt-call-money", "Call money rate", 1857, "fast", false, "NBER Macrohistory Database (nber.org/research/data/nber-macrohistory-database)"],
  [14, "rt-term-spread", "Term spread, long minus short", 1871, "medium", true, "Computed; FRED (fred.stlouisfed.org) T10Y3M from 1982"],
  [15, "rt-policy-rate", "Fed policy rate: NY Fed discount rate to 1954, fed funds after", 1914, "slow", false, "FRASER, Banking and Monetary Statistics 1914-1941 (fraser.stlouisfed.org); FRED FEDFUNDS"],
  [16, "rt-real-policy", "Real policy rate (policy rate minus CPI inflation)", 1914, "slow", true, "Computed"],
  [17, "rt-aaa", "Moody's Aaa corporate yield", 1919, "medium", false, "FRED (fred.stlouisfed.org)"],
  [18, "rt-baa", "Moody's Baa corporate yield", 1919, "medium", false, "FRED (fred.stlouisfed.org)"],
  [19, "rt-default-spread", "Baa minus Aaa default spread", 1919, "fast", false, "Computed; Goyal-Welch predictor data (sites.google.com/view/agoyal145) dfy"],
  [20, "rt-railroad-bonds", "Railroad bond yields (Macaulay)", 1857, "medium", false, "NBER Macrohistory Database (nber.org/research/data/nber-macrohistory-database)"],
  [21, "mc-m2", "M2 money stock, year-over-year", 1867, "slow", true, "Friedman and Schwartz (1963) tables; FRED M2SL from 1959"],
  [22, "mc-base", "Monetary base", 1867, "slow", false, "Friedman and Schwartz; FRED BOGMBASE from 1959"],
  [23, "mc-bank-loans", "Commercial and industrial loans", 1914, "medium", false, "FRASER, Banking and Monetary Statistics 1914-1941 (fraser.stlouisfed.org); FRED BUSLOANS from 1947"],
  [24, "mc-margin-debt", "Brokers' loans and margin debt", 1918, "fast", false, "FRASER, Banking and Monetary Statistics 1914-1941 (fraser.stlouisfed.org); NYSE from 1959; FINRA from 1997"],
  [25, "mc-bank-failures", "Bank suspensions and failures", 1921, "fast", false, "Federal Reserve (1921-33); FDIC failed-bank list from 1934"],
  [26, "mc-business-failures", "Business failures, liabilities", 1894, "medium", false, "NBER Macrohistory Database (nber.org/research/data/nber-macrohistory-database) (Dun and Bradstreet)"],
  [27, "mc-consumer-credit", "Consumer credit outstanding", 1943, "medium", false, "FRED (fred.stlouisfed.org)"],
  [28, "mc-mortgage-rate", "30-year mortgage rate", 1971, "medium", false, "FRED (fred.stlouisfed.org); earlier annual estimates in Historical Statistics of the United States"],
  [29, "mc-credit-gap", "Private credit to GDP gap", 1870, "slow", true, "Jorda-Schularick-Taylor Macrohistory Database (macrohistory.net); BIS credit gap from 1952"],
  [30, "mc-fed-balance-sheet", "Federal Reserve total assets", 1914, "slow", true, "FRASER, Banking and Monetary Statistics 1914-1941 (fraser.stlouisfed.org); FRED WALCL from 2002"],
  [31, "re-industrial-production", "Industrial production", 1884, "medium", false, "Miron and Romer (1990) index 1884-1940; FRED INDPRO from 1919"],
  [32, "re-pig-iron", "Pig iron production", 1877, "medium", false, "NBER Macrohistory Database (nber.org/research/data/nber-macrohistory-database)"],
  [33, "re-freight", "Railroad freight car loadings", 1919, "medium", false, "NBER Macrohistory Database (nber.org/research/data/nber-macrohistory-database); AAR weekly today"],
  [34, "re-unemployment", "Unemployment rate", 1890, "medium", false, "Romer (1986) and Lebergott annual 1890-1947; NBER monthly 1929-42; FRED UNRATE from 1948"],
  [35, "re-claims", "Initial jobless claims", 1967, "fast", false, "FRED (fred.stlouisfed.org)"],
  [36, "re-payrolls", "Nonfarm payrolls", 1939, "medium", false, "FRED (fred.stlouisfed.org)"],
  [37, "re-housing-starts", "Housing starts", 1889, "medium", false, "Historical Statistics of the United States (annual, verify); FRED HOUST from 1959"],
  [38, "re-permits", "Building permits and construction contracts", 1919, "fast", false, "NBER Macrohistory Database (nber.org/research/data/nber-macrohistory-database) (F.W. Dodge contracts); FRED PERMIT from 1960"],
  [39, "re-gdp", "Real GDP", 1790, "medium", false, "MeasuringWorth (measuringworth.com) annual; FRED GDPC1 quarterly from 1947"],
  [40, "re-profits", "Corporate profits", 1929, "medium", false, "BEA NIPA; FRED CP from 1947"],
  [41, "px-cpi", "Consumer price index", 1774, "slow", true, "MeasuringWorth (measuringworth.com); FRED CPIAUCNS monthly from 1913"],
  [42, "px-wholesale", "Wholesale and producer prices", 1720, "medium", false, "Warren and Pearson (NBER) to 1932; FRED PPIACO from 1913"],
  [43, "px-gold", "Gold price", 1257, "slow", true, "MeasuringWorth (measuringworth.com); LBMA from 1968"],
  [44, "px-oil", "Crude oil price", 1861, "fast", false, "Energy Institute Statistical Review (annual); FRED WTISPLC from 1946"],
  [45, "px-copper", "Copper price", 1900, "fast", false, "USGS historical statistics"],
  [46, "px-commodities", "Broad commodity index", 1947, "fast", false, "BLS spot index; CRB from 1957"],
  [47, "px-wheat", "Wheat price", 1866, "medium", false, "USDA NASS; NBER"],
  [48, "px-home-prices", "Home prices", 1890, "slow", true, "Shiller online data (econ.yale.edu/~shiller/data.htm) (annual); Case-Shiller monthly from 1987; FHFA from 1975"],
  [49, "px-wages", "Hourly earnings", 1890, "slow", false, "Rees and NBER (annual/monthly, verify); FRED CES0500000003 from 2006, AHETPI from 1964"],
  [50, "px-infl-expect", "Inflation expectations", 1946, "slow", false, "Philadelphia Fed Livingston Survey; Michigan from 1978; breakevens from 2003"],
  [51, "fx-debt-gdp", "Federal debt to GDP", 1790, "slow", true, "U.S. Treasury historical debt; CBO"],
  [52, "fx-deficit", "Federal deficit to GDP", 1789, "slow", false, "OMB Historical Tables"],
  [53, "fx-dollar-broad", "Trade-weighted dollar", 1973, "medium", false, "FRED (fred.stlouisfed.org) TWEXBMTH to 2019, DTWEXBGS from 2006"],
  [54, "fx-gbpusd", "Pound-dollar exchange rate", 1791, "slow", false, "MeasuringWorth (measuringworth.com)"],
  [55, "fx-gold-stock", "U.S. monetary gold stock", 1914, "slow", true, "FRASER, Banking and Monetary Statistics 1914-1941 (fraser.stlouisfed.org); Friedman and Schwartz earlier"],
  [56, "fx-foreign-holdings", "Foreign holdings of Treasuries", 1974, "slow", false, "Treasury TIC; Treasury Bulletin tables earlier (verify)"],
  [57, "fx-current-account", "Current account balance", 1790, "slow", false, "Historical Statistics of the United States (annual); BEA quarterly from 1960"],
  [58, "fx-world-trade", "World trade volume", 1800, "medium", false, "Federico and Tena-Junguito (annual); CPB World Trade Monitor monthly from 1991"],
  [59, "fx-uk-consol", "UK consol / long gilt yield", 1753, "slow", false, "Bank of England, A millennium of macroeconomic data (bankofengland.co.uk)"],
  [60, "fx-dollar-reserve-share", "Dollar share of global reserves", 1899, "slow", true, "Eichengreen and Flandreau benchmarks; IMF COFER from 1995"],
  [61, "st-consumer-sentiment", "Consumer sentiment", 1952, "fast", false, "University of Michigan"],
  [62, "st-ism", "ISM manufacturing PMI", 1948, "fast", false, "Institute for Supply Management"],
  [63, "st-vix", "VIX (VXO from 1986)", 1986, "fast", false, "Cboe; FRED VIXCLS"],
  [64, "st-hy-oas", "High-yield option-adjusted spread", 1996, "fast", false, "FRED (fred.stlouisfed.org)"],
  [65, "st-aaii", "AAII bull-bear spread", 1987, "fast", false, "American Association of Individual Investors"],
  [66, "st-term-premium", "10-year term premium (ACM)", 1961, "slow", false, "New York Fed"],
  [67, "st-sloos", "Senior Loan Officer survey, C&I tightening", 1990, "medium", false, "Federal Reserve SLOOS; older series 1967-83"],
  [68, "st-ipo", "IPO count and first-day returns", 1960, "fast", false, "Jay Ritter IPO data"],
  [69, "st-equity-allocation", "Household equity allocation", 1945, "slow", true, "Federal Reserve Z.1"],
  [70, "st-epu", "Economic policy uncertainty", 1900, "fast", false, "Baker, Bloom and Davis (historical U.S. index from 1900; monthly news index from 1985)"],
  [71, "sl-real-long-rate", "Real long rate (10-year minus trailing inflation)", 1871, "slow", true, "Computed from Shiller"],
  [72, "sl-labor-share", "Labor share of income", 1929, "slow", false, "BEA; FRED PRS85006173 from 1947"],
  [73, "sl-demographics", "Prime-age share and dependency ratio", 1900, "slow", true, "Census population estimates"],
  [74, "sl-household-debt", "Household debt to disposable income", 1945, "slow", true, "Federal Reserve Z.1"],
  [75, "sl-top-share", "Top 1% income share", 1913, "slow", false, "Piketty and Saez"],
  [76, "sl-mktcap-gdp", "Equity market value to GDP", 1945, "slow", true, "Federal Reserve Z.1"],
  [77, "sl-bank-capital", "Bank equity to assets", 1934, "slow", false, "FDIC historical statistics; OCC earlier (verify)"],
  [78, "sl-monetary-regime", "Monetary regime (gold 1879, Fed 1913, devaluation 1933-34, Bretton Woods 1944, 1971, Volcker 1979, zero rates 2008)", 1879, "slow", true, "Event list, documented with sources"],
  [79, "sl-gov-share", "Government spending share of GDP", 1929, "slow", false, "BEA NIPA"],
  [80, "sl-productivity", "Productivity growth trend", 1889, "slow", false, "Kendrick (1961); BLS from 1947"],
  [81, "gl-uk-equity", "UK equity prices", 1709, "fast", false, "Bank of England, A millennium of macroeconomic data (bankofengland.co.uk)"],
  [82, "gl-jst-returns", "Equity and housing returns, 18 countries", 1870, "medium", false, "Jorda-Schularick-Taylor Macrohistory Database (macrohistory.net)"],
  [83, "gl-nikkei", "Nikkei 225", 1949, "fast", false, "FRED (fred.stlouisfed.org)"],
  [84, "gl-oecd-cli", "OECD composite leading indicator, U.S. and G7", 1955, "medium", false, "OECD; FRED"],
  [85, "gl-global-recession", "Global recession indicator", 1870, "slow", false, "Kose, Sugawara and Terrones (2020); JST"],
  [86, "gl-banking-crises", "Banking crises, 70 countries", 1800, "slow", false, "Reinhart and Rogoff crisis database"],
  [87, "gl-sovereign-defaults", "Sovereign defaults count", 1800, "slow", false, "Reinhart and Rogoff"],
  [88, "gl-em-spread", "Emerging-market corporate spread", 1998, "fast", false, "FRED (fred.stlouisfed.org)"],
  [89, "gl-china-credit", "China credit impulse", 2002, "medium", false, "BIS credit statistics, China row (total credit to the private non-financial sector); no Chinese government or state source is read"],
  [90, "gl-japan-yields", "Japan 10-year yield", 1966, "slow", false, "Ministry of Finance Japan; FRED IRLTLT01JPM156N from 1989"],
  [91, "ev-nber-recession", "NBER recession indicator (target)", 1854, "slow", false, "NBER business cycle dates"],
  [92, "ev-bull-bear", "Bull or bear market state (target)", 1871, "medium", false, "Computed: 20% rule and Pagan-Sossounov on Shiller and DJIA"],
  [93, "ev-sahm", "Sahm rule", 1948, "fast", false, "Computed from UNRATE; FRED SAHMREALTIME"],
  [94, "ev-stress-index", "Financial stress index", 1993, "fast", false, "St. Louis Fed STLFSI4; Kansas City Fed from 1990"],
  [95, "ev-inversion", "Yield-curve inversion state", 1871, "slow", true, "Computed"],
  [96, "ev-credit-z", "Credit spread z-score state", 1919, "fast", false, "Computed"],
  [97, "ev-vol-regime", "Volatility regime state", 1885, "fast", false, "Computed (Markov switching)"],
  [98, "ev-gpr", "Geopolitical risk index", 1900, "fast", false, "Caldara and Iacoviello (historical index from 1900)"],
  [99, "ev-catastrophes", "Pandemics, wars, disasters (event list)", 1888, "fast", false, "Documented event list with sources"],
  [100, "ev-policy-shocks", "Monetary and fiscal policy shocks", 1945, "fast", false, "Romer and Romer narrative shocks (monetary from 1969; tax from 1945)"],
];

/** The study's 100 indicators (handoff `data/research_100_indicators.csv`, sha256 25afb73d…c6ea). */
export const RESEARCH_100_CATALOGUE: WalkCatalogueEntry[] = CAT.map(([n, id, name, earliestUsableYear, speed, keystoneCandidate, source]) => ({
  n, id, name, earliestUsableYear, speed, keystoneCandidate, source, asOf: CATALOGUE_AS_OF,
}));

// ─── Types ───────────────────────────────────────────────────────────────────

export type WalkEra = "E1" | "E2" | "E3" | "E4" | "E5";
/** Monthly state of an indicator (§5): 12-month change band, or level band for slow series. */
export type WalkIndicatorState = "up" | "down" | "flat" | "extreme-high" | "normal" | "extreme-low";
/** "YYYY-MM". */
export type WalkMonth = string;

export type WalkPatternMember = { indicator: string; state: WalkIndicatorState };

export type Pattern = {
  id: string;
  members: WalkPatternMember[];
  /** Key into `WalkInputs.targets`, e.g. "bear-start". */
  target: string;
  horizonMonths: number;
  /** ISO timestamp from PREREGISTRATION.md; missing or unparsable ⇒ cannot fire in a holdout year. */
  preRegisteredAt?: string | null;
  /** The pre-registered base-rate threshold the Wilson lower bound is held against. */
  baseRate: { value: number; source: string; asOf: IsoDate };
  /** Which agent's family it came from (A11–A15), for the atlas. */
  origin?: string;
};

export type WalkTarget = {
  /** Months in which the target event occurred. */
  events: WalkMonth[];
  /** Months the target is known for; a window reaching outside it scores `null`. */
  coverage: { from: WalkMonth; to: WalkMonth };
  source: string;
  asOf: IsoDate;
};

export type WalkBearMarket = { peak: WalkMonth; trough: WalkMonth };

export type WalkInputs = {
  catalogue: WalkCatalogueEntry[];
  /** indicator id → month → state. */
  states: Record<string, Record<WalkMonth, WalkIndicatorState>>;
  patterns: Pattern[];
  targets: Record<string, WalkTarget>;
  /** Bear markets (peak exclusive, trough inclusive); every other covered month is bull. */
  chronology: { bears: WalkBearMarket[]; coverage: { from: WalkMonth; to: WalkMonth }; source: string; asOf: IsoDate };
  /** Label printed on every card and the atlas, e.g. "SYNTHETIC FIXTURE — not market data". */
  provenance: string;
  asOf: IsoDate;
};

export type WalkStateChange = { indicator: string; month: WalkMonth; from: WalkIndicatorState | null; to: WalkIndicatorState };
export type WalkFiring = { patternId: string; month: WalkMonth; followedBy: boolean | null };
export type WalkNotScored = { patternId: string; reason: "member-missing" | "not-pre-registered"; missing?: string[] };
export type WalkPhase = "bull" | "bear" | "mixed" | "unknown";

export type EpochCard = {
  year: number;
  era: WalkEra;
  holdout: boolean;
  indicatorsAvailable: string[];
  stateChanges: WalkStateChange[];
  phase: WalkPhase;
  phaseMonths: { bull: number; bear: number };
  firings: WalkFiring[];
  notScored: WalkNotScored[];
  provenance: string;
};

export type PatternYear = {
  year: number;
  /** False when a guard kept the pattern out of this year. */
  scored: boolean;
  firings: number;
  hits: number;
  /** Firings with `followedBy === null` (censored), not counted in n. */
  censored: number;
  cumulativeN: number;
  cumulativeHits: number;
  hitRate: number | null;
  wilsonLower: number | null;
};

export type PatternStatus = "held-throughout" | "broke" | "never-held" | "insufficient-firings";

export type PatternLife = {
  pattern: Pattern;
  history: PatternYear[];
  breakYear: number | null;
  status: PatternStatus;
  /** Years scored before the break (walk order), and the span they cover. */
  yearsHeld: number;
  heldFrom: number | null;
  heldTo: number | null;
  coincidesWith: RegimeEvent[];
};

export type WalkResult = {
  fromYear: number;
  toYear: number;
  cards: EpochCard[];
  lives: PatternLife[];
  rules: Assumption[];
  provenance: string;
  asOf: IsoDate;
};

// ─── Month arithmetic ───────────────────────────────────────────────────────

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
export function walkMonthIndex(m: WalkMonth): number {
  const g = MONTH_RE.exec(m);
  if (!g) throw new Error(`Bad month: ${m} (want YYYY-MM)`);
  return Number(g[1]) * 12 + Number(g[2]) - 1;
}
export function walkMonthOf(index: number): WalkMonth {
  const y = Math.floor(index / 12);
  const mm = index - y * 12 + 1;
  return `${y}-${mm < 10 ? "0" : ""}${mm}`;
}
const monthsOfYear = (year: number): WalkMonth[] => Array.from({ length: 12 }, (_, i) => walkMonthOf(year * 12 + i));

// ─── Eras, toolkit, statistics ──────────────────────────────────────────────

export function eraOf(year: number): WalkEra {
  if (!Number.isInteger(year)) throw new Error(`Year must be an integer: ${year}`);
  if (year >= walkRule("walk.era.E5.first")) return "E5";
  if (year >= walkRule("walk.era.E4.first")) return "E4";
  if (year >= walkRule("walk.era.E3.first")) return "E3";
  if (year >= walkRule("walk.era.E2.first")) return "E2";
  return "E1";
}

export const isHoldoutYear = (year: number) => year < walkRule("walk.era.E5.first");

export function indicatorsAvailable(year: number, catalogue: WalkCatalogueEntry[] = RESEARCH_100_CATALOGUE): string[] {
  return catalogue.filter(c => c.earliestUsableYear <= year).map(c => c.id);
}

/** Inverse standard normal CDF (Acklam 2003 rational approximation, |rel. error| < 1.2e-9). */
export function inverseNormalCdf(p: number): number {
  if (!(p > 0 && p < 1)) throw new Error(`Quantile needs 0 < p < 1: ${p}`);
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425, hi = 1 - lo;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > hi) return -inverseNormalCdf(1 - p);
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Lower end of the two-sided Wilson (1927) score interval for k successes in n trials. */
export function wilsonLower(k: number, n: number, confidence = walkRule("walk.wilson.confidence")): number | null {
  if (n <= 0) return null;
  if (k < 0 || k > n) throw new Error(`Wilson needs 0 ≤ k ≤ n: k=${k}, n=${n}`);
  const z = inverseNormalCdf(1 - (1 - confidence) / 2);
  const p = k / n, z2 = z * z;
  const centre = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return Math.max(0, (centre - margin) / (1 + z2 / n));
}

// ─── Guards ─────────────────────────────────────────────────────────────────

const ISO_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;
export function isPreRegistered(p: Pattern): boolean {
  const t = p.preRegisteredAt;
  return typeof t === "string" && ISO_RE.test(t) && !Number.isNaN(Date.parse(t));
}

/** Why a pattern may not be scored in a year, or null when it may. */
export function scoringGuard(p: Pattern, year: number, catalogue: WalkCatalogueEntry[]): WalkNotScored | null {
  const byId = new Map(catalogue.map(c => [c.id, c]));
  const missing = p.members.map(m => m.indicator).filter(id => {
    const c = byId.get(id);
    return !c || c.earliestUsableYear > year;
  });
  if (missing.length) return { patternId: p.id, reason: "member-missing", missing };
  if (isHoldoutYear(year) && !isPreRegistered(p)) return { patternId: p.id, reason: "not-pre-registered" };
  return null;
}

// ─── Epoch card ─────────────────────────────────────────────────────────────

function active(p: Pattern, month: WalkMonth, states: WalkInputs["states"]): boolean {
  return p.members.every(m => states[m.indicator]?.[month] === m.state);
}

export function targetFollowed(target: WalkTarget | undefined, month: WalkMonth, horizonMonths: number): boolean | null {
  if (!target) return null;
  const m = walkMonthIndex(month);
  const end = m + horizonMonths;
  if (target.events.some(e => { const i = walkMonthIndex(e); return i > m && i <= end; })) return true;
  if (m < walkMonthIndex(target.coverage.from) || end > walkMonthIndex(target.coverage.to)) return null;
  return false;
}

function phaseOf(year: number, chronology: WalkInputs["chronology"]): { phase: WalkPhase; bull: number; bear: number } {
  const from = walkMonthIndex(chronology.coverage.from), to = walkMonthIndex(chronology.coverage.to);
  const bears = chronology.bears.map(b => [walkMonthIndex(b.peak), walkMonthIndex(b.trough)] as const);
  let bull = 0, bear = 0, unknown = 0;
  for (const mo of monthsOfYear(year)) {
    const i = walkMonthIndex(mo);
    if (i < from || i > to) { unknown++; continue; }
    if (bears.some(([pk, tr]) => i > pk && i <= tr)) bear++; else bull++;
  }
  const phase: WalkPhase = unknown === 12 ? "unknown" : bull > 0 && bear > 0 ? "mixed" : bear > 0 ? "bear" : "bull";
  return { phase, bull, bear };
}

export function epochCard(year: number, inputs: WalkInputs): EpochCard {
  const available = indicatorsAvailable(year, inputs.catalogue);
  const months = monthsOfYear(year);

  const stateChanges: WalkStateChange[] = [];
  for (const id of available) {
    const s = inputs.states[id];
    if (!s) continue;
    for (const mo of months) {
      const to = s[mo];
      if (to === undefined) continue;
      const from = s[walkMonthOf(walkMonthIndex(mo) - 1)] ?? null;
      if (from !== to) stateChanges.push({ indicator: id, month: mo, from, to });
    }
  }
  stateChanges.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : a.indicator < b.indicator ? -1 : a.indicator > b.indicator ? 1 : 0));

  const firings: WalkFiring[] = [];
  const notScored: WalkNotScored[] = [];
  for (const p of inputs.patterns) {
    const guard = scoringGuard(p, year, inputs.catalogue);
    if (guard) { notScored.push(guard); continue; }
    for (const mo of months) {
      const prev = walkMonthOf(walkMonthIndex(mo) - 1);
      // Onset only. In January the previous month is last December; if a member did not yet
      // exist then, its back-cast state is not evidence and the pattern counts as inactive.
      const prevGuard = walkMonthIndex(mo) % 12 === 0 ? scoringGuard(p, year - 1, inputs.catalogue) : null;
      const wasActive = prevGuard?.reason === "member-missing" ? false : active(p, prev, inputs.states);
      if (active(p, mo, inputs.states) && !wasActive) {
        firings.push({ patternId: p.id, month: mo, followedBy: targetFollowed(inputs.targets[p.target], mo, p.horizonMonths) });
      }
    }
  }

  const ph = phaseOf(year, inputs.chronology);
  return {
    year,
    era: eraOf(year),
    holdout: isHoldoutYear(year),
    indicatorsAvailable: available,
    stateChanges,
    phase: ph.phase,
    phaseMonths: { bull: ph.bull, bear: ph.bear },
    firings,
    notScored,
    provenance: inputs.provenance,
  };
}

// ─── The walk ───────────────────────────────────────────────────────────────

export function breakYear(history: PatternYear[], pattern: Pattern, minFirings = walkRule("walk.minFirings")): number | null {
  for (const h of history) {
    if (h.cumulativeN >= minFirings && h.wilsonLower !== null && h.wilsonLower < pattern.baseRate.value) return h.year;
  }
  return null;
}

export function coincidingEvents(year: number, events: RegimeEvent[] = REGIME_EVENTS, lagYears = walkRule("walk.coincidence.lagYears")): RegimeEvent[] {
  return events
    .filter(e => year >= e.from - lagYears && year <= e.to)
    .sort((a, b) => (a.from - year) - (b.from - year) || a.id.localeCompare(b.id));
}

function lifeOf(pattern: Pattern, history: PatternYear[]): PatternLife {
  const minF = walkRule("walk.minFirings");
  const br = breakYear(history, pattern, minF);
  const scoredBefore = history.filter(h => h.scored && (br === null || h.year > br));
  const firstEstablished = history.find(h => h.cumulativeN >= minF);
  let status: PatternStatus;
  if (br === null) status = firstEstablished ? "held-throughout" : "insufficient-firings";
  else status = firstEstablished && firstEstablished.year === br ? "never-held" : "broke";
  const held = status === "never-held" || status === "insufficient-firings" ? [] : scoredBefore;
  return {
    pattern,
    history,
    breakYear: br,
    status,
    yearsHeld: held.length,
    heldFrom: held.length ? held[0].year : null,
    heldTo: held.length ? held[held.length - 1].year : null,
    coincidesWith: br === null ? [] : coincidingEvents(br),
  };
}

export function reverseWalk(fromYear: number, toYear: number, inputs: WalkInputs): WalkResult {
  if (!Number.isInteger(fromYear) || !Number.isInteger(toYear)) throw new Error("Years must be integers");
  if (fromYear < toYear) throw new Error(`The reverse walk goes DOWN: fromYear ${fromYear} < toYear ${toYear}`);
  const ids = new Set<string>();
  for (const p of inputs.patterns) {
    if (ids.has(p.id)) throw new Error(`Duplicate pattern id: ${p.id}`);
    ids.add(p.id);
    if (!p.members.length) throw new Error(`Pattern ${p.id} has no members`);
    if (!(p.horizonMonths >= 1 && Number.isInteger(p.horizonMonths))) throw new Error(`Pattern ${p.id}: horizonMonths must be a positive integer`);
    if (!(p.baseRate.value >= 0 && p.baseRate.value <= 1)) throw new Error(`Pattern ${p.id}: baseRate must be in [0, 1]`);
  }

  const cards: EpochCard[] = [];
  const tally = new Map(inputs.patterns.map(p => [p.id, { n: 0, k: 0, history: [] as PatternYear[] }]));
  for (let year = fromYear; year >= toYear; year--) {
    const card = epochCard(year, inputs);
    cards.push(card);
    const skipped = new Set(card.notScored.map(s => s.patternId));
    for (const p of inputs.patterns) {
      const t = tally.get(p.id)!;
      const fs = card.firings.filter(f => f.patternId === p.id);
      const scoredFs = fs.filter(f => f.followedBy !== null);
      const hits = scoredFs.filter(f => f.followedBy === true).length;
      t.n += scoredFs.length;
      t.k += hits;
      t.history.push({
        year,
        scored: !skipped.has(p.id),
        firings: fs.length,
        hits,
        censored: fs.length - scoredFs.length,
        cumulativeN: t.n,
        cumulativeHits: t.k,
        hitRate: t.n ? t.k / t.n : null,
        wilsonLower: wilsonLower(t.k, t.n),
      });
    }
  }

  return {
    fromYear,
    toYear,
    cards,
    lives: inputs.patterns.map(p => lifeOf(p, tally.get(p.id)!.history)),
    rules: REVERSE_WALK_RULES,
    provenance: inputs.provenance,
    asOf: inputs.asOf,
  };
}

// ─── Outputs ────────────────────────────────────────────────────────────────

/** `epoch_cards/YYYY.json` contents, in walk order. Stable key order, two-space indent. */
export function epochCardFiles(result: WalkResult): Array<{ path: string; content: string }> {
  return result.cards.map(c => ({ path: `epoch_cards/${c.year}.json`, content: JSON.stringify(c, null, 2) + "\n" }));
}

/** Target bear-start events from a chronology: the peak month of each bear. */
export function bearStartTarget(chronology: WalkInputs["chronology"]): WalkTarget {
  return { events: chronology.bears.map(b => b.peak), coverage: chronology.coverage, source: chronology.source, asOf: chronology.asOf };
}

const pct = (x: number | null) => (x === null ? "—" : `${(100 * x).toFixed(1)} %`);

/** One glyph per decade, newest first: . not scored at all, x at/after break, ? under the firing floor, = held. */
function decadeStrip(life: PatternLife): string {
  const minF = walkRule("walk.minFirings");
  const byDecade = new Map<number, PatternYear[]>();
  for (const h of life.history) {
    const d = Math.floor(h.year / 10) * 10;
    if (!byDecade.has(d)) byDecade.set(d, []);
    byDecade.get(d)!.push(h);
  }
  return Array.from(byDecade.entries()).map(([, hs]) => {
    if (!hs.some(h => h.scored)) return ".";
    if (life.breakYear !== null && hs.some(h => h.year <= life.breakYear!)) return "x";
    if (hs.every(h => h.cumulativeN < minF)) return "?";
    return "=";
  }).join("");
}

export function atlasMarkdown(result: WalkResult): string {
  const L: string[] = [];
  const minF = walkRule("walk.minFirings");
  const conf = walkRule("walk.wilson.confidence");
  L.push("# REVERSE_WALK_ATLAS");
  L.push("");
  L.push(`**Provenance:** ${result.provenance}  `);
  L.push(`**Walk:** ${result.fromYear} → ${result.toYear}, one year at a time (${result.cards.length} epoch cards). **As of:** ${result.asOf}.`);
  L.push("");
  L.push(`Each pattern's running hit rate is scored on firings whose outcome is known; its break year is the first year, walking back, at which the lower end of the two-sided ${Math.round(conf * 100)} % Wilson (1927) interval falls below the pattern's pre-registered base-rate threshold after at least ${minF} scored firings. A pattern is never scored in a year where a member indicator did not yet exist, nor in a holdout year (before ${walkRule("walk.era.E5.first")}) without a pre-registration timestamp.`);
  L.push("");
  L.push("## Life lines");
  L.push("");
  const decades: number[] = [];
  for (let y = result.fromYear; y >= result.toYear; y--) { const d = Math.floor(y / 10) * 10; if (!decades.includes(d)) decades.push(d); }
  L.push(`Decade strip runs ${decades[0]}s → ${decades[decades.length - 1]}s. \`=\` held · \`x\` at or past the break · \`.\` not scored (member missing or not pre-registered) · \`?\` under ${minF} scored firings.`);
  L.push("");
  for (const life of result.lives) {
    const p = life.pattern;
    const last = life.history[life.history.length - 1];
    const members = p.members.map(m => `${m.indicator}:${m.state}`).join(" ∧ ");
    const held = life.heldFrom !== null ? `held ${life.heldFrom}→${life.heldTo} (${life.yearsHeld} scored years)` : "held in no scored year";
    const brk = life.breakYear === null
      ? (life.status === "insufficient-firings" ? `no break declared (only ${last?.cumulativeN ?? 0} scored firings < ${minF})` : `no break to ${result.toYear}`)
      : `**broke ${life.breakYear}**${life.status === "never-held" ? " (never held: below threshold the first year it had enough firings)" : ""}`;
    const coin = life.breakYear === null ? "" : life.coincidesWith.length
      ? ` — coincides with ${life.coincidesWith.map(e => `${e.from === e.to ? e.from : `${e.from}–${e.to}`} ${e.label} [${e.source}]`).join("; ")}`
      : ` — no documented regime event within ${walkRule("walk.coincidence.lagYears")} years after it; unexplained break`;
    L.push(`- \`${decadeStrip(life)}\` **${p.id}** (${members} → ${p.target} within ${p.horizonMonths} m${p.origin ? `, ${p.origin}` : ""}; pre-registered ${isPreRegistered(p) ? p.preRegisteredAt : "NO — E5 only"}): ${held}; ${brk}${coin}. Final ${last?.cumulativeHits ?? 0}/${last?.cumulativeN ?? 0} = ${pct(last?.hitRate ?? null)}, Wilson lower ${pct(last?.wilsonLower ?? null)} vs threshold ${pct(p.baseRate.value)} (${p.baseRate.source}, ${p.baseRate.asOf}).`);
  }
  L.push("");
  L.push("## The shrinking toolkit");
  L.push("");
  const marks = [2025, 2002, 1990, 1975, 1960, 1947, 1935, 1919, 1900, 1888].filter(y => y <= result.fromYear && y >= result.toYear);
  const cardBy = new Map(result.cards.map(c => [c.year, c]));
  L.push(`| Year | ${marks.join(" | ")} |`);
  L.push(`|---|${marks.map(() => "---").join("|")}|`);
  L.push(`| Indicators | ${marks.map(y => cardBy.get(y)!.indicatorsAvailable.length).join(" | ")} |`);
  L.push(`| Era | ${marks.map(y => cardBy.get(y)!.era).join(" | ")} |`);
  L.push("");
  L.push("## Regime events used for coincidence");
  L.push("");
  for (const e of REGIME_EVENTS) L.push(`- ${e.from === e.to ? e.from : `${e.from}–${e.to}`}: ${e.label}. Source: ${e.source} (as of ${e.asOf}).`);
  L.push("");
  L.push("## Rules");
  L.push("");
  for (const r of result.rules) L.push(`- \`${r.id}\` = ${r.value} ${r.unit} — ${r.source} (as of ${r.asOf}). ${r.basis}`);
  L.push("");
  return L.join("\n");
}
