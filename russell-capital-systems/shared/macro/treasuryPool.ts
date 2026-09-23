/**
 * The Treasury Pool — the United States' borrowing pool, who fills it, who
 * drains it, what it costs, and what that does to everyone else's cost of money.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The owner's ask (23 Sep 2026): the Treasury as the liquidity pool the
 * country borrows against; its interest rates back as far as the record goes
 * (the 3-month bill from 1934, prime from 1949, the 10-year from 1953
 * monthly); every country's share of it; the prime rate and consumer and
 * business lending rates beside it; fifty related indicators; and an
 * archaeology of the last seventy years for patterns — the obvious ones and
 * the ones "beneath the threshold of human awareness" — as a prediction grid,
 * plus an indicator that says when the pool is draining and how to position.
 *
 * What is data here:
 *   • TREASURY_POOL_SERIES  — fifty series, each with its keyless key, first
 *     date, cadence, role in the pool (fills it, drains it, prices it, carries
 *     it into the economy, or backdrop) and the reasoning for including it.
 *   • TREASURY_EPISODES     — the documented chronicle 1951–2026: what moved,
 *     who bought or sold, what it did to homes, mortgages and bank lending.
 *     Documented history with dates and sources; every coefficient the
 *     pipeline measures from the stored series, never from this text.
 *   • TREASURY_HYPOTHESES   — the register of patterns to test, obvious and
 *     hidden, each naming its variables, expected sign, lag and the detector
 *     that scores it. Status is "pending" until measured.
 *   • LIQUIDITY_PLAYBOOK    — positioning considerations per regime and wealth
 *     tier, for the advisor to review. Considerations, not instructions.
 *
 * What is arithmetic here (pure):
 *   • liquidityDryUp()      — the composite dry-up indicator, 0–100, from the
 *     latest readings, with the regime and the drivers.
 *   • predictionGrid()      — target × horizon cells from measured lead-lag
 *     findings and current z-scores; every cell "pending" until the pattern
 *     scan has stored history to work on.
 *
 * The seventy-year correlations, domino chains and loudest movers are
 * computed by `emergentPatterns.ts` over the stored series; this file names
 * the series and interprets the results. No number here was measured by
 * this seat; the sandbox has no egress, and that is stated on the page.
 */
import type { IsoDate } from "./types";
import { A } from "./assumptions";
import type { PairFinding } from "./emergentPatterns";

// ─── 1. The fifty series ──────────────────────────────────────────────────────

export type PoolRole = "fills" | "drains" | "prices" | "channel" | "backdrop";
export type PoolGroup = "supply" | "yields" | "policy" | "prime-and-lending" | "bank-credit" | "fed-balance-sheet" | "foreign-holders" | "dollar-and-gold" | "fiscal-flows" | "risk-and-backdrop";

export type TreasuryPoolSeries = {
  id: string;
  name: string;
  group: PoolGroup;
  role: PoolRole;
  /** Connector series key (fred:…, tic:history:…, nyfed:…, fiscaldata:…). */
  series: string;
  sourceId: string;
  publishedFrom: IsoDate;
  cadence: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  unit: string;
  /** Plausibility bounds on the raw series. */
  min: number;
  max: number;
  /** Existing indicator id when the series is already stored under one; otherwise the pool id is the indicator id. */
  indicatorId?: string;
  reasoning: string;
};

const p = (id: string, name: string, group: PoolGroup, role: PoolRole, series: string, sourceId: string, publishedFrom: IsoDate, cadence: TreasuryPoolSeries["cadence"], unit: string, min: number, max: number, reasoning: string, indicatorId?: string): TreasuryPoolSeries =>
  ({ id, name, group, role, series, sourceId, publishedFrom, cadence, unit, min, max, reasoning, ...(indicatorId ? { indicatorId } : {}) });

export const TREASURY_POOL_SERIES: TreasuryPoolSeries[] = [
  // Supply and fiscal flows: the size of the pool and what feeds it (6)
  p("tp-debt-total", "Total public debt outstanding", "supply", "backdrop", "fred:GFDEBTN", "fred", "1966-01-01", "quarterly", "USD mn", 100_000, 100_000_000, "The pool itself, quarterly since 1966; annual FYGFD extends it to 1939. Debt-to-GDP is already a factor (f-debt-to-gdp) and is not repeated here."),
  p("tp-debt-public", "Debt held by the public", "supply", "backdrop", "fred:FYGFDPUN", "fred", "1970-01-01", "quarterly", "USD mn", 100_000, 100_000_000, "What the market must absorb: total debt less the trust funds' holdings."),
  p("tp-debt-to-penny", "Debt to the penny, daily", "supply", "backdrop", "fiscaldata:debt_to_penny", "fiscaldata-debt", "1993-01-04", "daily", "USD bn", 3_000, 100_000, "The daily read on the pool the owner asked for; keyless from Fiscal Data.", "us-debt-to-penny"),
  p("tp-deficit-monthly", "Federal surplus or deficit, monthly", "fiscal-flows", "fills", "fred:MTSDS133FMS", "fred", "1980-10-01", "monthly", "USD mn", -1_000_000, 1_000_000, "New borrowing need month by month; the pool grows by the deficit."),
  p("tp-deficit-annual", "Federal surplus or deficit, fiscal year", "fiscal-flows", "fills", "fred:FYFSD", "fred", "1929-06-30", "annual", "USD mn", -4_000_000, 500_000, "Ninety-seven years of the borrowing requirement."),
  p("tp-interest-outlays", "Federal interest outlays, % of GDP", "fiscal-flows", "drains", "fred:FYOIGDA188S", "fred", "1940-06-30", "annual", "% of GDP", 0, 10, "What the pool costs the Treasury; the fiscal-dominance gauge.", "f-interest-outlays-gdp"),
  // Yields: what the pool pays (9)
  p("tp-tbill-3m", "3-month Treasury bill, secondary market", "yields", "prices", "fred:TB3MS", "fred", "1934-01-01", "monthly", "%", 0, 20, "The longest Treasury rate record on FRED: ninety-two years, monthly."),
  p("tp-1y", "1-year Treasury constant maturity", "yields", "prices", "fred:GS1", "fred", "1953-04-01", "monthly", "%", 0, 20, "The front end since 1953."),
  p("tp-2y", "2-year Treasury constant maturity", "yields", "prices", "fred:DGS2", "fred", "1976-06-01", "daily", "%", 0, 20, "The policy-expectations tenor."),
  p("tp-5y", "5-year Treasury constant maturity", "yields", "prices", "fred:GS5", "fred", "1953-04-01", "monthly", "%", 0, 20, "The belly, where foreign official portfolios sit."),
  p("tp-10y", "10-year Treasury constant maturity", "yields", "prices", "fred:DGS10", "fred", "1962-01-02", "daily", "%", 0, 20, "The benchmark; monthly GS10 extends it to 1953.", "ust10y"),
  p("tp-30y", "30-year Treasury constant maturity", "yields", "prices", "fred:DGS30", "fred", "1977-02-15", "daily", "%", 0, 20, "The long bond; the mortgage market's anchor before 2008."),
  p("tp-curve-10y3m", "10-year minus 3-month", "yields", "prices", "fred:T10Y3M", "fred", "1982-01-04", "daily", "pp", -5, 6, "The recession lead; also the bank's lending margin.", "f-curve-10y3m"),
  p("tp-real-10y", "10-year TIPS real yield", "yields", "prices", "fred:DFII10", "fred", "2003-01-02", "daily", "%", -3, 6, "The real cost of the pool since TIPS."),
  p("tp-term-premium", "ACM 10-year term premium", "yields", "prices", "nyfed:acm", "nyfed-acm", "1961-06-14", "daily", "pp", -3, 6, "The part of the 10-year that is compensation for duration: what foreign selling moves.", "f-acm-term-premium"),
  // Policy and the recession tape (2)
  p("tp-fed-funds", "Effective federal funds rate", "policy", "prices", "fred:FEDFUNDS", "fred", "1954-07-01", "monthly", "%", 0, 25, "The Fed's rate since 1954; the floor under every other rate.", "f-fed-funds"),
  p("tp-recession", "NBER recession indicator", "risk-and-backdrop", "backdrop", "fred:USREC", "fred", "1854-12-01", "monthly", "0/1", 0, 1, "The outcome most patterns are scored against.", "f-recession"),
  // Prime and lending: how the pool's price reaches households and firms (8)
  p("tp-prime", "Bank prime loan rate, monthly", "prime-and-lending", "channel", "fred:MPRIME", "fred", "1949-01-01", "monthly", "%", 0, 25, "The owner's prime-lending anchor: seventy-seven years; historically fed funds + 3 pp."),
  p("tp-mortgage-30y", "30-year fixed mortgage rate", "prime-and-lending", "channel", "fred:MORTGAGE30US", "fred", "1971-04-02", "weekly", "%", 2, 20, "The home-buyer's price of the pool.", "h-mortgage-rate"),
  p("tp-auto-loan-48m", "48-month new-car loan rate, commercial banks", "prime-and-lending", "channel", "fred:TERMCBAUTO48NS", "fred", "1972-02-01", "quarterly", "%", 0, 25, "The car-buyer's price of the pool since 1972."),
  p("tp-personal-loan-24m", "24-month personal loan rate, commercial banks", "prime-and-lending", "channel", "fred:TERMCBPER24NS", "fred", "1972-02-01", "quarterly", "%", 0, 30, "Unsecured consumer credit since 1972."),
  p("tp-card-rate", "Credit-card interest rate, all accounts", "prime-and-lending", "channel", "fred:TERMCBCCALLNS", "fred", "1994-11-01", "quarterly", "%", 5, 40, "The most-paid rate in America."),
  p("tp-aaa", "Moody's Aaa corporate yield", "prime-and-lending", "channel", "fred:AAA", "fred", "1919-01-01", "monthly", "%", 0, 20, "The best corporate borrower's price of the pool, since 1919."),
  p("tp-baa", "Moody's Baa corporate yield", "prime-and-lending", "channel", "fred:BAA", "fred", "1919-01-01", "monthly", "%", 0, 25, "The ordinary corporate borrower's price of the pool, since 1919."),
  p("tp-baa-spread", "Baa minus 10-year Treasury", "prime-and-lending", "channel", "fred:BAA10Y", "fred", "1986-01-02", "daily", "pp", 0, 8, "Credit stress in one number.", "f-baa-spread"),
  // Bank credit: how much the banks actually lend (6)
  p("tp-ci-loans", "Commercial and industrial loans, all commercial banks", "bank-credit", "channel", "fred:BUSLOANS", "fred", "1947-01-01", "monthly", "USD bn", 10, 10_000, "Business lending since 1947; the owner's 'bank lending to businesses'."),
  p("tp-real-estate-loans", "Real estate loans, all commercial banks", "bank-credit", "channel", "fred:REALLN", "fred", "1947-01-01", "monthly", "USD bn", 5, 20_000, "Property lending since 1947."),
  p("tp-consumer-loans", "Consumer loans, all commercial banks", "bank-credit", "channel", "fred:CONSUMER", "fred", "1947-01-01", "monthly", "USD bn", 1, 10_000, "Lending to households since 1947. The three components are stored; the weekly total (TOTLL) is their sum and is not repeated."),
  p("tp-ci-standards-large", "Banks tightening standards for C&I loans, large firms", "bank-credit", "channel", "fred:DRTSCILM", "fred", "1990-04-01", "quarterly", "% net", -60, 100, "The Fed's loan-officer survey: whether banks are shutting the window on big business."),
  p("tp-ci-standards-small", "Banks tightening standards for C&I loans, small firms", "bank-credit", "channel", "fred:DRTSCIS", "fred", "1990-04-01", "quarterly", "% net", -60, 100, "The same for small business — the owner's clients."),
  p("tp-business-delinquency", "Delinquency rate on business loans", "bank-credit", "channel", "fred:DRBLACBS", "fred", "1987-01-01", "quarterly", "%", 0, 15, "What tightening did to the firms that borrowed before it."),
  // Fed balance sheet: the buyer of last resort (4)
  p("tp-fed-assets", "Federal Reserve total assets", "fed-balance-sheet", "fills", "fred:WALCL", "fred", "2002-12-18", "weekly", "USD mn", 500_000, 12_000_000, "QE fills the pool's demand side; QT drains it."),
  p("tp-fed-treasuries", "Treasury securities held by the Fed", "fed-balance-sheet", "fills", "fred:TREAST", "fred", "2002-12-18", "weekly", "USD mn", 200_000, 8_000_000, "The Fed's own share of the pool, weekly since 2002; the quarterly FDHBFRBN series extends it to 1970 for the review."),
  p("tp-reserves", "Total reserves of depository institutions", "fed-balance-sheet", "backdrop", "fred:TOTRESNS", "fred", "1959-01-01", "monthly", "USD bn", 1, 6_000, "Bank liquidity since 1959: scarce until 2008, abundant since."),
  p("tp-reverse-repo", "Overnight reverse repurchase agreements", "fed-balance-sheet", "drains", "fred:RRPONTSYD", "fred", "2013-09-23", "daily", "USD bn", 0, 3_000, "Cash parked at the Fed instead of in bills: the pool's overflow tank, and its drain since 2023."),
  // Foreign holders: who fills the pool from outside (7)
  p("tp-foreign-total", "Federal debt held by foreign and international investors", "foreign-holders", "fills", "fred:FDHBFIN", "fred", "1970-01-01", "quarterly", "USD mn", 1_000, 20_000_000, "The foreign share of the pool since 1970; the owner's core ask."),
  p("tp-foreign-share", "Foreign-held share of federal debt", "foreign-holders", "fills", "fred:FDHBFIN", "fred", "1970-01-01", "quarterly", "% of debt", 0, 60, "The same as a share: who holds the debt decides who sets the price.", "f-foreign-share-debt"),
  p("tp-tic-total", "TIC: all foreign holders of Treasuries", "foreign-holders", "fills", "tic:history:Grand Total", "us-tic-mfh", "2000-03-31", "monthly", "USD bn", 500, 20_000, "Monthly, by country, since 2000; the annual survey extends country detail to 1974 (review)."),
  p("tp-tic-japan", "TIC: Japan", "foreign-holders", "fills", "tic:history:Japan", "us-tic-mfh", "2000-03-31", "monthly", "USD bn", 100, 3_000, "The largest holder and the seller of 2022–26.", "tic:japan"),
  p("tp-tic-china", "TIC: China, mainland", "foreign-holders", "fills", "tic:history:China, Mainland", "us-tic-mfh", "2000-03-31", "monthly", "USD bn", 50, 3_000, "The 2000–2013 accumulator and the 2015–16 and 2022–26 seller.", "tic:china"),
  p("tp-tic-uk", "TIC: United Kingdom", "foreign-holders", "fills", "tic:history:United Kingdom", "us-tic-mfh", "2000-03-31", "monthly", "USD bn", 20, 3_000, "London custody: where Gulf and other official money shows up as 'UK'."),
  p("tp-tic-belgium", "TIC: Belgium (Euroclear)", "foreign-holders", "fills", "tic:history:Belgium", "us-tic-mfh", "2000-03-31", "monthly", "USD bn", 5, 1_000, "Euroclear custody: China's second door, visible in 2014–15."),
  // Dollar and gold: the alternatives to the pool (4)
  p("tp-dollar-broad", "Broad dollar index", "dollar-and-gold", "prices", "fred:DTWEXBGS", "fred", "2006-01-02", "daily", "index", 80, 140, "A stronger dollar is an inflow's reward and a debtor's punishment."),
  p("tp-usdjpy", "USD/JPY", "dollar-and-gold", "prices", "fred:DEXJPUS", "fred", "1971-01-04", "daily", "JPY", 70, 400, "The yen is the largest holder's funding currency."),
  p("tp-usdcny", "USD/CNY", "dollar-and-gold", "prices", "fred:DEXCHUS", "fred", "1981-01-02", "daily", "CNY", 1, 10, "The second-largest holder's managed rate."),
  p("tp-gold", "Gold, London PM fix", "dollar-and-gold", "drains", "fred:GOLDAMGBD228NLBM", "fred", "1968-04-01", "daily", "USD/oz", 30, 10_000, "Where official money goes when it leaves the pool (2022–26 central-bank buying)."),
  // Risk and backdrop (4). Groups: 6 + 9 + 2 + 8 + 6 + 4 + 7 + 4 + 4 = 50.
  p("tp-vix", "CBOE VIX", "risk-and-backdrop", "backdrop", "fred:VIXCLS", "fred", "1990-01-02", "daily", "index", 5, 100, "Fear buys Treasuries (1998, 2008, 2020) until it does not (March 2020's dash for cash).", "f-vix"),
  p("tp-cpi", "CPI, all items", "risk-and-backdrop", "backdrop", "fred:CPIAUCSL", "fred", "1947-01-01", "monthly", "index", 10, 400, "Inflation is what the pool's lenders fear most.", "f-cpi-yoy:base"),
  p("tp-m2", "M2 money stock", "risk-and-backdrop", "backdrop", "fred:M2SL", "fred", "1959-01-01", "monthly", "USD bn", 200, 40_000, "Domestic liquidity that competes with, and funds, the pool.", "f-m2-yoy:base"),
  p("tp-home-price", "Median sales price of houses sold", "risk-and-backdrop", "channel", "fred:MSPUS", "fred", "1963-01-01", "quarterly", "USD", 15_000, 600_000, "The owner's 'what did it do to the price of homes'.", "h-median-home-price-yoy:base"),
];

/**
 * Storage rows for the history manifest: every pool series under its stored
 * indicator id (the factor/target id it shares, else its own). The manifest
 * deduplicates by connector key, so a series a factor already stores is
 * pulled once; readers resolve the stored id by key, never by pool id.
 */
export function treasuryStorageManifest(): Array<{ indicatorId: string; series: string; sourceId: string; min: number; max: number; publishedFrom: string }> {
  return [
    ...TREASURY_POOL_SERIES.map(s => ({ indicatorId: poolIndicatorId(s), series: s.series, sourceId: s.sourceId, min: s.min, max: s.max, publishedFrom: s.publishedFrom })),
    // The auction tape is not one of the fifty (it is a monthly mean of a tender statistic) but the dry-up indicator reads it.
    { indicatorId: "tp-auctions-btc", series: "fiscaldata:auctions", sourceId: "fiscaldata-debt", min: 1, max: 5, publishedFrom: "1979-01-01" },
  ];
}

/** The stored indicator id for a pool series (its own id, or the factor/target id it shares). */
export function poolIndicatorId(s: TreasuryPoolSeries): string {
  return s.indicatorId ?? s.id;
}

// ─── 2. The chronicle: documented episodes 1951–2026 ──────────────────────────

export type TreasuryEpisode = {
  id: string;
  from: IsoDate;
  to: IsoDate;
  title: string;
  /** What happened to rates and to the pool. */
  rates: string;
  /** Who filled or drained the pool. */
  flows: string;
  /** Homes, mortgages, bank lending, business, and by wealth tier. */
  transmission: string;
  sourceIds: string[];
  /** The hypotheses this episode is evidence for. */
  hypotheses: string[];
};

export const TREASURY_EPISODES: TreasuryEpisode[] = [
  { id: "1951-accord", from: "1951-03-04", to: "1953-12-31", title: "The Treasury–Fed Accord ends the wartime peg", rates: "The Fed stops pegging long bonds at 2.5 %; the 10-year drifts from 2.4 % toward 3 %; the 3-month bill rises from ~1.4 % to ~2 % by 1953.", flows: "The Fed stops being the forced buyer; banks and insurers become the marginal holder; foreign holdings are negligible (Bretton Woods gold-dollar era).", transmission: "Mortgage rates were regulated (FHA/VA ceilings) so the pass-through was rationing, not price: the first 'credit crunch' episodes of 1953 and 1957 show lending volume, not rate, absorbing the shock.", sourceIds: ["fred", "fed-h41"], hypotheses: ["H01", "H20"] },
  { id: "1966-crunch", from: "1966-01-01", to: "1966-12-31", title: "The 1966 credit crunch", rates: "Fed funds from 4 % to 5.75 %; the 3-month bill above Regulation Q ceilings for the first time.", flows: "Deposits left thrifts for bills (disintermediation): the pool drained the mortgage lenders directly.", transmission: "Housing starts fell ~25 % in a year with mortgage rates barely moving — the rationing channel. Small business felt it first; large firms had the commercial-paper market.", sourceIds: ["fred"], hypotheses: ["H12", "H21"] },
  { id: "1971-nixon", from: "1971-08-15", to: "1973-03-31", title: "Gold window closed; the dollar floats", rates: "10-year ~6 %; the bill rate volatile; inflation begins its climb.", flows: "Foreign central banks, no longer able to convert dollars to gold, hold Treasuries instead: FDHBFIN (from 1970) begins the climb that defines the next fifty years.", transmission: "Mortgage rates (from 1971 on FRED) rise from 7.3 % toward 9 % by 1974; the first wave of the housing affordability squeeze.", sourceIds: ["fred", "us-tic-mfh"], hypotheses: ["H02", "H03"] },
  { id: "1974-petrodollar", from: "1974-01-01", to: "1979-12-31", title: "Petrodollar recycling", rates: "Rates rise with inflation: the bill from 5 % to 10 % by 1979; prime from 7 % to 15.25 %.", flows: "Oil exporters' surpluses are recycled into Treasuries and bank deposits; the 1974 US–Saudi arrangement (add-on purchases outside auctions) formalises the Gulf as a filler of the pool. The annual TIC survey begins.", transmission: "Prime-linked business lending explodes in cost; the 1974–75 recession sees C&I loan growth collapse; housing suffers twice (1974, 1979–82).", sourceIds: ["fred", "us-tic-mfh", "bis-annual-report"], hypotheses: ["H04", "H13"] },
  { id: "1979-volcker", from: "1979-10-06", to: "1982-08-31", title: "Volcker: reserves targeting, rates to 20 %", rates: "Fed funds peaks 19–20 % (1981); the 10-year 15.8 % (Sep 1981); prime 21.5 % (Dec 1980); the 30-year mortgage 18.6 % (Oct 1981).", flows: "Foreign official demand rises with the dollar (DEXJPUS ~200→260 by 1985); domestic bond buyers are rewarded for the rest of the decade.", transmission: "Housing starts halve; existing-home sales fall 50 %; auto loans at 17 %; business bankruptcies double; the wealthy who held cash and bills earned 15 % risk-free while leveraged borrowers were destroyed — the sharpest wealth-tier divergence in the record.", sourceIds: ["fred"], hypotheses: ["H05", "H06", "H14", "H22"] },
  { id: "1985-plaza", from: "1985-09-22", to: "1987-10-19", title: "Plaza, the dollar halves, Japan becomes the buyer", rates: "10-year from 10.6 % to 7 % (1986) then back to 10 % into the October 1987 crash.", flows: "Japan's surplus recycles into Treasuries: Japanese holdings become the largest foreign position by the late 1980s; the yen's rise makes those holdings expensive to keep.", transmission: "Mortgage rates fall to 9 %, the 1986 refinancing wave; bank lending to real estate expands into the S&L crisis.", sourceIds: ["fred", "us-tic-mfh"], hypotheses: ["H03", "H07"] },
  { id: "1994-massacre", from: "1994-02-04", to: "1995-02-28", title: "The 1994 bond massacre", rates: "Fed funds 3 % to 6 % in a year; the 10-year from 5.8 % to 8 %; the 30-year mortgage from 6.9 % to 9.2 %.", flows: "Leveraged holders (Orange County, hedge funds) sell; foreign official holdings keep rising (Japan, and China's first appearance). The pool's price fell while its foreign filling continued — evidence that official buyers are price-insensitive.", transmission: "Existing-home sales fell ~15 %; refinancing died; consumer credit growth did not slow — households borrowed through it (H23).", sourceIds: ["fred", "us-tic-mfh"], hypotheses: ["H08", "H23"] },
  { id: "1997-asia", from: "1997-07-02", to: "1998-10-31", title: "Asian crisis, LTCM: flight to the pool", rates: "10-year from 6.5 % to 4.2 % (Oct 1998) as money flees emerging markets and LTCM unwinds; the Fed cuts three times.", flows: "Asian central banks that had drained reserves defending currencies then rebuild them in Treasuries at scale from 1999: the reserve-accumulation era begins here.", transmission: "Mortgage rates fall below 7 %; the 1998 refinancing wave; bank C&I standards tighten sharply in Q4 1998 (first year of the survey showing it) then ease.", sourceIds: ["fred", "us-tic-mfh", "imf-ifs"], hypotheses: ["H09", "H10", "H15"] },
  { id: "2001-glut", from: "2001-01-03", to: "2007-06-30", title: "The savings glut and Greenspan's conundrum", rates: "Fed funds cut to 1 % (2003) then raised to 5.25 % (2006) while the 10-year barely moved (4 %→5 %): the 'conundrum'.", flows: "China's holdings from ~$60 bn (2000) to ~$500 bn (2007); Japan to ~$600 bn; oil exporters via London. Foreign official buying is the reason the long end did not follow the Fed — the strongest documented case of the pool being filled from outside overriding domestic policy.", transmission: "Mortgage rates stayed ~6 % through a 425 bp hiking cycle; that is what made 2004–06 lending possible. Real estate loans at banks doubled; subprime was funded by the glut.", sourceIds: ["fred", "us-tic-mfh", "bis-quarterly"], hypotheses: ["H03", "H11", "H16"] },
  { id: "2008-gfc", from: "2008-09-15", to: "2009-06-30", title: "Lehman: the pool as the only safe place", rates: "10-year from 4 % to 2.1 % (Dec 2008); bills briefly negative; the Fed to zero; QE1 buys $300 bn of Treasuries and $1.25 tn of MBS.", flows: "Everyone fills the pool at once: foreign official, money funds, banks. Foreign holdings rise $700 bn in 18 months.", transmission: "Mortgage rates fall below 5 % only after the Fed buys MBS (the spread, not the Treasury, was the block); C&I standards tightened at a record 80 % net; business loans fell 25 % over two years; delinquency peaked 2009–10. Wealth tiers: those with cash bought assets at the bottom; those with leverage lost homes.", sourceIds: ["fred", "us-tic-mfh", "fed-h41"], hypotheses: ["H09", "H17", "H18", "H22"] },
  { id: "2013-taper", from: "2013-05-22", to: "2014-01-31", title: "Taper tantrum", rates: "10-year from 1.6 % to 3.0 % in four months on a hint that QE would slow; mortgage rates from 3.4 % to 4.5 %.", flows: "Emerging-market currencies fall; EM central banks sell Treasuries to defend them (H15 in reverse); Japan and China hold.", transmission: "Refinancing collapsed; purchase mortgages held; existing-home sales dipped 10 %; bank lending unaffected — the shock was price, not quantity.", sourceIds: ["fred", "us-tic-mfh"], hypotheses: ["H17", "H19"] },
  { id: "2015-china", from: "2015-08-11", to: "2017-01-31", title: "China defends the yuan by selling Treasuries", rates: "10-year fell (2.2 % → 1.4 % in 2016) despite the largest foreign official sale on record — because the ECB and BoJ were buying everything else, and growth fears dominated.", flows: "China −$180 bn from a ~$1.24 tn book over 18 months (≈ 0.8 %/month); Belgium's custody fell in step. The pool was filled by private foreign and domestic buyers.", transmission: "None visible at the household level: mortgage rates fell. Evidence that a single seller does not move the pool's price when the global backdrop is easing (H24).", sourceIds: ["us-tic-mfh", "fred"], hypotheses: ["H24", "H25"] },
  { id: "2020-dash", from: "2020-03-09", to: "2020-04-30", title: "The dash for cash", rates: "10-year from 0.5 % to 1.2 % in eight sessions while equities crashed: the safe asset stopped being safe; the Fed bought $1.6 tn in six weeks.", flows: "Foreign official accounts sold ~$150 bn in March to raise dollars (the FIMA repo facility was created for exactly this); hedge-fund basis trades unwound.", transmission: "Mortgage rates spiked then fell to record lows once the Fed bought MBS; bank C&I loans jumped $700 bn in a month as firms drew credit lines (the reverse of 2008); business standards tightened to 70 % net by Q3.", sourceIds: ["fred", "us-tic-mfh", "fed-fima"], hypotheses: ["H18", "H26", "H27"] },
  { id: "2022-hike", from: "2022-03-16", to: "2023-10-31", title: "The fastest hiking cycle since Volcker, plus QT", rates: "Fed funds 0 → 5.5 %; the 10-year 1.5 % → 5 % (Oct 2023); the 30-year mortgage 3 % → 7.8 %; prime 3.25 % → 8.5 %.", flows: "The Fed drains ($95 bn/month QT); Japan sells to defend the yen (Sep–Oct 2022); China's holdings fall below $800 bn; the reverse repo facility drains from $2.5 tn to near zero (2023–24) — the overflow tank refills the pool.", transmission: "Existing-home sales fell to 1995 levels; the median price did not fall (locked-in owners); auto loans at 8–9 %; card rates 21 %+; C&I standards tightened to 50 % net (2023 Q2); small-business borrowing costs highest since 2001. Wealth tiers: cash earned 5 % again — the first time since 2007 that the top tier was paid to wait.", sourceIds: ["fred", "us-tic-mfh", "jp-mof-intervention"], hypotheses: ["H05", "H06", "H14", "H19", "H28"] },
  { id: "2024-japan", from: "2024-04-29", to: "2026-09-22", title: "Japan intervenes; the term premium returns", rates: "10-year 3.6–4.8 %; the ACM term premium turns positive for the first time since 2016; the 3-month bill above 5 % then eased.", flows: "Japan's holdings fall from $1.15 tn toward $1.10 tn; the MOF's 'foreign securities' reserve line falls $87.8 bn in a month against a $98.6 bn intervention (Aug 2026) — the fingerprint of Treasury sales. China below $620 bn. Gold at records on official buying.", transmission: "Mortgage rates 6–7 % with sales at 30-year lows; the lock-in effect; bank lending flat in real terms; card delinquency at 2011 levels.", sourceIds: ["us-tic-mfh", "jp-mof-reserves", "jp-mof-intervention", "fred", "nyfed-acm"], hypotheses: ["H07", "H25", "H28", "H29"] },
];

// ─── 3. The hypothesis register: patterns to measure, obvious and hidden ──────

export type HypothesisKind = "obvious" | "structural" | "hidden";
export type Detector = "correlation" | "lead-lag" | "conditional" | "domino" | "loudest" | "regime";

export type TreasuryHypothesis = {
  id: string;
  kind: HypothesisKind;
  claim: string;
  /** Pool series ids (or stored indicator ids) involved, in causal order. */
  variables: string[];
  /** Expected sign of the lead relation (first → last). */
  expectedSign: 1 | -1;
  lagMonths: number;
  detector: Detector;
  reasoning: string;
  status: "pending";
};

const h = (id: string, kind: HypothesisKind, claim: string, variables: string[], expectedSign: 1 | -1, lagMonths: number, detector: Detector, reasoning: string): TreasuryHypothesis =>
  ({ id, kind, claim, variables, expectedSign, lagMonths, detector, reasoning, status: "pending" });

export const TREASURY_HYPOTHESES: TreasuryHypothesis[] = [
  // Obvious (the ones a human names first)
  h("H01", "obvious", "Fed funds leads the 3-month bill within a month.", ["tp-fed-funds", "tp-tbill-3m"], 1, 1, "lead-lag", "The bill is the policy rate plus a few basis points; if this is not found the data is wrong."),
  h("H02", "obvious", "Foreign official holdings rise with the dollar's reserve role and fall with confidence shocks.", ["tp-dollar-broad", "tp-foreign-total"], 1, 6, "lead-lag", "A stronger dollar rewards holders and draws reserve accumulation; the 1971 and 2022 episodes show both directions."),
  h("H03", "obvious", "Foreign official buying lowers the 10-year relative to fed funds (the conundrum).", ["tp-foreign-total", "tp-term-premium"], -1, 6, "lead-lag", "Warnock & Warnock (2009) and the 2004–06 record: $100 bn of official inflow ≈ −13 to −80 bp; the term premium is where it shows."),
  h("H04", "obvious", "Oil prices lead Gulf recycling into the pool.", ["f-oil-wti-yoy", "tp-tic-uk"], 1, 6, "lead-lag", "Petrodollars arrive through London custody; oil up → UK holdings up with a lag."),
  h("H05", "obvious", "Prime follows fed funds one-for-one within a month.", ["tp-fed-funds", "tp-prime"], 1, 1, "lead-lag", "Prime = fed funds + 3 pp since the 1990s; a break in this relation is itself a signal."),
  h("H06", "obvious", "Mortgage rates follow the 10-year with a 0.9 pass-through within a quarter.", ["tp-10y", "tp-mortgage-30y"], 1, 1, "lead-lag", "The liquidation engine already assumes 0.9 (liq.tx.mortgagePassThrough); this measures it over fifty-five years."),
  h("H07", "obvious", "Yen weakness leads Japanese Treasury sales by 3–6 months.", ["tp-usdjpy", "tp-tic-japan"], -1, 6, "lead-lag", "Intervention is funded from reserves; reserves are Treasuries; 2022 and 2024–26 are the cases."),
  h("H08", "obvious", "Rising rates cut existing-home sales within six months.", ["tp-mortgage-30y", "h-existing-home-sales-yoy"], -1, 6, "lead-lag", "1981, 1994, 2013, 2022."),
  h("H09", "obvious", "Equity fear (VIX) buys Treasuries: the 10-year falls when VIX spikes, contemporaneously.", ["tp-vix", "tp-10y"], -1, 0, "correlation", "Flight to safety, 1998, 2008, 2011, 2020 (until the dash for cash broke it)."),
  h("H10", "obvious", "Rate cuts lead C&I lending by 9–12 months.", ["tp-fed-funds", "tp-ci-loans"], -1, 12, "lead-lag", "Cheaper money → more borrowing, but with the long lag the 1991 and 2001 recoveries showed."),
  // Structural (analysts know these; the public does not)
  h("H11", "structural", "When foreign official buying is strong, the 10-year does not follow fed funds up (the curve flattens on hikes).", ["tp-foreign-total", "tp-curve-10y3m"], -1, 3, "conditional", "The conundrum as a conditional: hikes flatten more when the pool is being filled from outside."),
  h("H12", "structural", "Bank standards tighten before delinquency rises, by 3–4 quarters.", ["tp-ci-standards-small", "tp-business-delinquency"], 1, 12, "lead-lag", "Banks see the stress first; the survey leads the write-offs."),
  h("H13", "structural", "Real rates (bill minus CPI) drive reserve accumulation: negative real rates push official money out of the pool into gold and other reserves.", ["tp-tbill-3m", "tp-gold"], -1, 12, "lead-lag", "1970s and 2020–26: gold rises when the pool pays less than inflation."),
  h("H14", "structural", "Small-firm standards tighten more than large-firm standards in every hiking cycle.", ["tp-ci-standards-small", "tp-ci-standards-large"], 1, 0, "correlation", "The small-business channel is the fragile one; the difference between the two series is the owner's client's cost."),
  h("H15", "structural", "Emerging-market stress drains the pool first (reserves sold to defend currencies) and refills it later (reserves rebuilt).", ["f-dollar-broad-yoy", "tp-foreign-total"], -1, 3, "lead-lag", "1997–98, 2013, 2015: a strong dollar first forces sales, then draws inflows."),
  h("H16", "structural", "The term premium, not the expected policy path, is what foreign flows move.", ["tp-foreign-total", "tp-term-premium"], -1, 3, "lead-lag", "ACM decomposition; if the lead is in the premium and not in the 2-year, the channel is confirmed."),
  h("H17", "structural", "Fed balance-sheet changes lead the 10-year by 1–3 months, in the opposite direction.", ["tp-fed-treasuries", "tp-10y"], -1, 3, "lead-lag", "QE1–3, taper, QT: the Fed's own share is the largest single flow."),
  h("H18", "structural", "In crises, foreign official accounts sell first (to raise dollars) and buy later (to rebuild).", ["tp-vix", "tp-tic-total"], -1, 1, "conditional", "March 2020 and October 2008 both show a one-month sale before the inflow."),
  h("H19", "structural", "Refinancing volume collapses on a 100 bp rise but purchase lending holds; sales fall, prices lag by a year.", ["tp-mortgage-30y", "tp-home-price"], -1, 12, "lead-lag", "2013 and 2022: the lock-in effect delays the price response."),
  h("H20", "structural", "Prime's spread over fed funds widens when bank reserves are scarce and narrows when abundant.", ["tp-reserves", "tp-prime"], -1, 3, "lead-lag", "Pre-2008 the spread wandered 2.5–3.5 pp; post-2008 it is pinned at 3."),
  // Hidden: the ones the owner asked for — quiet, second-order, or visible only across many series at once
  h("H21", "hidden", "Reverse-repo drawdown leads bill yields down and the 10-year up: the overflow tank refilling the pool steepens the curve.", ["tp-reverse-repo", "tp-curve-10y3m"], -1, 2, "lead-lag", "2023–24: $2 tn left the RRP into bills; a mechanical flow no macro model carries."),
  h("H22", "hidden", "The Belgium custody line moves inversely to mainland China's line with a one-month lag when China is selling.", ["tp-tic-china", "tp-tic-belgium"], 1, 1, "conditional", "Euroclear is the second door; the two together are the true China position."),
  h("H23", "hidden", "Consumer credit growth does not slow in the first six months of a hiking cycle; it accelerates (households borrow through it), then breaks.", ["tp-fed-funds", "h-consumer-credit-yoy"], 1, 6, "lead-lag", "1994, 2004, 2022: the sign flips at month 6–9 — a non-monotone lead a linear scan misses; the conditional-triple detector finds it."),
  h("H24", "hidden", "A single foreign seller does not move the 10-year when global central banks are easing; it does when they are tightening. The interaction term, not the seller, is the signal.", ["tp-tic-china", "tp-fed-treasuries", "tp-10y"], 1, 3, "conditional", "2015–16 versus 2022–23: the same seller, opposite price effect, explained by the Fed's direction."),
  h("H25", "hidden", "Japan's sales show up in the MOF 'foreign securities' reserve line a month before TIC prints them.", ["jp-reserves-foreign-securities", "tp-tic-japan"], 1, 1, "lead-lag", "Reserve accounting is faster than the custody survey; the August 2026 case."),
  h("H26", "hidden", "Bank C&I loans jump, not fall, in the first month of a crisis (credit-line draws), then fall for two years.", ["tp-vix", "tp-ci-loans"], 1, 1, "conditional", "March 2020's $700 bn; the sign reverses by month 3 — another non-monotone lead."),
  h("H27", "hidden", "The dash-for-cash signature: VIX up AND 10-year up AND dollar up in the same month is the rarest triple in the record and precedes Fed intervention within weeks.", ["tp-vix", "tp-10y", "tp-dollar-broad"], 1, 0, "conditional", "Only 2020 and (partly) 2008 show it; the conditional-triple detector can find it if it recurs."),
  h("H28", "hidden", "The term premium turns positive 6–12 months after foreign official holdings start falling as a share of debt.", ["tp-foreign-share", "tp-term-premium"], -1, 9, "lead-lag", "2022–24: the share fell below 24 % and the premium turned positive in 2024."),
  h("H29", "hidden", "Gold's rise leads reductions in official Treasury holdings by 6 months (reserve managers reallocate after the price move, not before).", ["tp-gold", "tp-tic-total"], -1, 6, "lead-lag", "2022–26 central-bank buying; the order matters for the dry-up indicator."),
  h("H30", "hidden", "Card rates rise with fed funds one-for-one but never fall with it: an asymmetry a linear correlation hides.", ["tp-fed-funds", "tp-card-rate"], 1, 1, "conditional", "1994–2026: up-moves pass through; down-moves do not; the regime detector splits by direction."),
  h("H31", "hidden", "Auto-loan rates lag the 5-year Treasury by two quarters, longer than mortgages lag the 10-year; the car market re-prices last.", ["tp-5y", "tp-auto-loan-48m"], 1, 6, "lead-lag", "Dealer-finance contracts are set quarterly; the lag is institutional."),
  h("H32", "hidden", "When the deficit widens while foreign holdings fall, the term premium rises twice as fast as when either happens alone.", ["tp-deficit-monthly", "tp-foreign-share", "tp-term-premium"], 1, 6, "conditional", "Supply up and demand down together: 2023 is the only clean case so far; the triple detector will say whether it generalises."),
  h("H33", "hidden", "Domino: Fed hikes → dollar up (1–3 m) → EM reserve sales (3–6 m) → foreign holdings down (6–9 m) → term premium up (9–12 m) → mortgage rate up beyond the 10-year's move (12 m).", ["tp-fed-funds", "tp-dollar-broad", "tp-foreign-total", "tp-term-premium", "tp-mortgage-30y"], 1, 12, "domino", "A five-link chain no pairwise scan shows; the domino detector chains lead-lag findings whose lags add."),
  h("H34", "hidden", "Loudest before a turn: in the six months before a rate-cycle turning point, the series with the largest z-score moves are not yields but bank standards and the curve.", ["tp-ci-standards-small", "tp-curve-10y3m", "tp-fed-funds"], 1, 6, "loudest", "The regime detector ranks pre-turn movers; if standards and the curve lead the ranking, the pool's price is told by the banks first."),
  h("H35", "hidden", "M2 growth leads the 10-year by 18 months through CPI (the trunk's macroEngine lag), but only when reserves are abundant.", ["tp-m2", "f-cpi-yoy", "tp-10y"], 1, 18, "conditional", "Pre-2008 the lag is weak; post-2008 it is the 2020–22 story; the interaction with reserves is the hidden part."),
  h("H36", "hidden", "Foreign official inflows are price-insensitive on the way in and price-sensitive on the way out.", ["tp-10y", "tp-foreign-total"], 1, 3, "regime", "Accumulation for reserves ignores yield; sales for intervention are timed. The regime split by direction of holdings tests it."),
  h("H37", "hidden", "The reverse-repo balance is the best single predictor of bill-curve slope three months ahead since 2013.", ["tp-reverse-repo", "tp-tbill-3m"], -1, 3, "lead-lag", "Money-fund cash competes with bills; a mechanical relation."),
  h("H38", "hidden", "Home prices respond to the mortgage rate with a 12-month lag but to the foreign share of debt with a 24-month lag through the term premium.", ["tp-foreign-share", "tp-home-price"], 1, 24, "lead-lag", "Two channels with different clocks; the longer one is invisible to a one-year window."),
  h("H39", "hidden", "Business delinquency rises 4 quarters after small-firm standards tighten, and 6 quarters after prime rises 200 bp, whichever comes first.", ["tp-prime", "tp-business-delinquency"], 1, 18, "lead-lag", "The owner's 'bank lending to small business' channel with its true lag."),
  h("H40", "hidden", "The dry-up signature is three quiet series moving together: RRP near zero, foreign share falling, term premium rising — none alarming alone.", ["tp-reverse-repo", "tp-foreign-share", "tp-term-premium"], 1, 0, "conditional", "The indicator below is this hypothesis made operational; the triple detector grades it."),
];

// ─── 4. The dry-up indicator ──────────────────────────────────────────────────

export type DryUpReading = {
  /** 3-month % change in foreign-held Treasuries (TIC total or FDHBFIN). */
  foreignHoldings3mPct: number | null;
  /** 3-month % change in Fed Treasury holdings. */
  fedTreasuries3mPct: number | null;
  /** Reverse repo balance, USD bn. */
  reverseRepoUsdBn: number | null;
  /** 3-month change in the ACM term premium, pp. */
  termPremium3mPp: number | null;
  /** 3-month change in the 10-year, bp. */
  tenYear3mBp: number | null;
  /** 3-month % change in the broad dollar. */
  dollar3mPct: number | null;
  /** Latest 10-year auction bid-to-cover minus its 12-month mean. */
  bidToCoverDeviation: number | null;
  /** 3-month % change in the deficit run-rate (12-month sum). */
  deficit3mPct: number | null;
};

export type DryUpRegime = "abundant" | "normal" | "tightening" | "draining" | "dried-up";

export type DryUpResult = {
  asOf: IsoDate;
  score: number;
  regime: DryUpRegime;
  coverage: number;
  drivers: Array<{ id: string; reading: number | null; points: number; note: string }>;
  playbook: PlaybookRow[];
  method: string[];
  hypothesisIds: string[];
};

export type PlaybookRow = { regime: DryUpRegime; tier: "mass-affluent" | "average" | "high-net-worth" | "business-owner"; considerations: string[] };

/**
 * Positioning considerations per regime and tier — for the advisor to review
 * with the client, never applied automatically. Reasoning per row is in the
 * secrets document; the rows here are what the page shows.
 */
export const LIQUIDITY_PLAYBOOK: PlaybookRow[] = [
  { regime: "draining", tier: "mass-affluent", considerations: ["Lock any pending mortgage or refinance rate now; the term premium is rising faster than the policy path.", "Build the cash ladder to twelve months of expenses in bills, not a savings account: bills reprice up first.", "Pause new variable-rate borrowing (HELOC draws, card balances); prime follows funds up and card rates do not come down."] },
  { regime: "draining", tier: "average", considerations: ["Shorten bond duration in retirement accounts; a 100 bp rise costs a 10-year fund ~8 %.", "Delay large financed purchases (car, appliances) unless the rate is fixed today.", "Check employer stability: small-firm credit standards tighten first (H14) and hiring follows."] },
  { regime: "draining", tier: "high-net-worth", considerations: ["Extend IUL policy-loan usage instead of margin: policy loans are fixed-cost while margin follows prime.", "Ladder bills and short notes for the yield; a draining pool pays cash for the first time in the cycle.", "Review any foreign-currency exposure: a draining pool has coincided with a stronger dollar (H02, H15)."] },
  { regime: "draining", tier: "business-owner", considerations: ["Draw or extend credit lines before standards tighten (H12 lead of 3–4 quarters); the window closes before delinquency shows.", "Fix the rate on term debt; prime-linked lines will reprice within the month (H05).", "Slow receivables risk: customers' card and consumer-loan rates are rising (H30)."] },
  { regime: "dried-up", tier: "mass-affluent", considerations: ["Hold cash in Treasury bills or government money funds only; in a dash for cash the safe asset is the bill, not the bond (2020).", "Do not refinance into a variable product under any incentive.", "Keep emergency reserves outside any account that can gate withdrawals."] },
  { regime: "dried-up", tier: "average", considerations: ["Expect the Fed to intervene within weeks (H27); the largest rate moves reverse after intervention (liq.fed.damping).", "Do not sell long bonds into the spike; the 2020 and 2008 reversals were 50 % within a month.", "Hold off home purchase decisions for one quarter: mortgage spreads, not Treasuries, are the block (2008)."] },
  { regime: "dried-up", tier: "high-net-worth", considerations: ["Deploy cash into the assets forced sellers are dumping (equities, MBS, munis), staged over eight weeks — the 2008 and 2020 bottoms were within that window of the intervention.", "Use policy loans, not sales, for liquidity needs; selling at the spike is the wealth-tier mistake the record shows.", "Gold and Treasuries have diverged in these episodes; do not assume the 2022–26 correlation holds in a dash for cash."] },
  { regime: "dried-up", tier: "business-owner", considerations: ["Credit lines drawn now may be the last for two years (2008: C&I loans −25 %); hold the cash.", "Expect standards at 70–80 % net tightening for three quarters (2008, 2020).", "Renegotiate supplier terms before customers' delinquency rises (H39 lag of 4–6 quarters)."] },
  { regime: "abundant", tier: "mass-affluent", considerations: ["Refinance and extend fixed-rate debt while the pool is overflowing; the 2020–21 window lasted eighteen months.", "Do not hold more cash than the ladder needs; bills pay less than inflation in this regime (H13)."] },
  { regime: "abundant", tier: "average", considerations: ["Lengthen duration cautiously; the next regime is 'tightening' and 2022 followed 2021.", "Lock mortgage rates on any planned purchase; abundant regimes end with a taper (2013)."] },
  { regime: "abundant", tier: "high-net-worth", considerations: ["Fund IUL and long-dated structures at low fixed costs; the carry is cheapest here.", "Reduce gold exposure added in the draining regime; official buying slows when real rates turn positive."] },
  { regime: "abundant", tier: "business-owner", considerations: ["Term out debt at fixed rates; standards are loosest here (survey below zero).", "Build the cash buffer for the tightening that follows; every abundant regime in the record was followed by one within three years."] },
  { regime: "tightening", tier: "mass-affluent", considerations: ["Stop adding variable-rate debt; begin the bill ladder.", "Review any adjustable-rate mortgage reset dates against the hiking path."] },
  { regime: "tightening", tier: "average", considerations: ["Shorten duration gradually; the curve inverts in this regime and the front end pays more.", "Employment risk rises 12 months later (f-curve-10y3m); build the reserve now."] },
  { regime: "tightening", tier: "high-net-worth", considerations: ["Shift from margin to policy loans ahead of prime's rise (H05).", "Begin staging cash for the draining regime's opportunities."] },
  { regime: "tightening", tier: "business-owner", considerations: ["Extend credit lines to their maximum tenor now; small-firm standards tighten within two quarters of the first hike (H14).", "Fix rates on equipment finance; auto and equipment rates lag by two quarters (H31) — the window is still open."] },
  { regime: "normal", tier: "mass-affluent", considerations: ["Maintain the ladder; no regime action."] },
  { regime: "normal", tier: "average", considerations: ["Maintain allocation; watch the dry-up score monthly."] },
  { regime: "normal", tier: "high-net-worth", considerations: ["Maintain; rebalance policy-loan usage to plan."] },
  { regime: "normal", tier: "business-owner", considerations: ["Maintain lines; review covenants annually."] },
];

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/**
 * The dry-up score: eight readings, each mapped to 0–100 points against a
 * rules-table threshold (`dryup.*`), weighted, and rescaled to the share of
 * readings present so a missing series lowers coverage rather than the score.
 */
export function liquidityDryUp(r: DryUpReading, asOf: IsoDate = "2026-09-22"): DryUpResult {
  const spec: Array<{ id: keyof DryUpReading; weight: number; toPoints: (v: number) => number; note: string }> = [
    { id: "foreignHoldings3mPct", weight: A("dryup.w.foreign"), toPoints: v => clamp((-v / A("dryup.foreignDrop3mPct")) * 100, 0, 100), note: "foreign holders selling drains the pool from outside (H02, H36)" },
    { id: "fedTreasuries3mPct", weight: A("dryup.w.fed"), toPoints: v => clamp((-v / A("dryup.fedDrop3mPct")) * 100, 0, 100), note: "QT drains the demand side (H17)" },
    { id: "reverseRepoUsdBn", weight: A("dryup.w.rrp"), toPoints: v => clamp((1 - v / A("dryup.rrpFullUsdBn")) * 100, 0, 100), note: "an empty overflow tank means no cash left to refill bills (H21, H37, H40)" },
    { id: "termPremium3mPp", weight: A("dryup.w.termPremium"), toPoints: v => clamp((v / A("dryup.termPremiumRise3mPp")) * 100, 0, 100), note: "the premium is where a draining pool prices (H16, H28)" },
    { id: "tenYear3mBp", weight: A("dryup.w.tenYear"), toPoints: v => clamp((v / A("dryup.tenYearRise3mBp")) * 100, 0, 100), note: "the price of the pool rising" },
    { id: "dollar3mPct", weight: A("dryup.w.dollar"), toPoints: v => clamp((v / A("dryup.dollarRise3mPct")) * 100, 0, 100), note: "a rising dollar accompanies EM reserve sales (H15)" },
    { id: "bidToCoverDeviation", weight: A("dryup.w.auction"), toPoints: v => clamp((-v / A("dryup.bidToCoverDrop")) * 100, 0, 100), note: "weak auctions are the pool asking for buyers" },
    { id: "deficit3mPct", weight: A("dryup.w.deficit"), toPoints: v => clamp((v / A("dryup.deficitRise3mPct")) * 100, 0, 100), note: "supply growing while demand shrinks (H32)" },
  ];
  let weighted = 0;
  let weightPresent = 0;
  let weightTotal = 0;
  const drivers: DryUpResult["drivers"] = [];
  for (const s of spec) {
    const v = r[s.id];
    weightTotal += s.weight;
    if (v === null || !Number.isFinite(v)) {
      drivers.push({ id: s.id, reading: null, points: 0, note: `${s.note} — no reading` });
      continue;
    }
    const pts = Math.round(s.toPoints(v));
    weighted += pts * s.weight;
    weightPresent += s.weight;
    drivers.push({ id: s.id, reading: v, points: pts, note: s.note });
  }
  const coverage = weightTotal ? Math.round((weightPresent / weightTotal) * 100) / 100 : 0;
  const score = weightPresent ? Math.round(weighted / weightPresent) : 0;
  const regime: DryUpRegime = !weightPresent ? "normal" : score >= A("dryup.regime.driedUp") ? "dried-up" : score >= A("dryup.regime.draining") ? "draining" : score >= A("dryup.regime.tightening") ? "tightening" : score <= A("dryup.regime.abundant") ? "abundant" : "normal";
  drivers.sort((a, b) => b.points - a.points);
  return {
    asOf,
    score,
    regime,
    coverage,
    drivers,
    playbook: LIQUIDITY_PLAYBOOK.filter(row => row.regime === regime),
    method: [
      "Eight readings, each scaled 0–100 against a rules-table threshold (dryup.*), weighted, averaged over the readings present; coverage is the share of weight with a reading.",
      `Regimes: ≥ ${A("dryup.regime.driedUp")} dried-up, ≥ ${A("dryup.regime.draining")} draining, ≥ ${A("dryup.regime.tightening")} tightening, ≤ ${A("dryup.regime.abundant")} abundant, otherwise normal.`,
      "Thresholds are stated choices from the 2013, 2020 and 2022–23 episodes; the backtest re-sets them once the stored history covers those episodes (regime detector).",
      coverage < 0.5 ? "Fewer than half the readings are present: the score is provisional and the regime should not drive any action." : "Coverage is adequate for the regime call.",
    ],
    hypothesisIds: ["H02", "H15", "H16", "H17", "H21", "H28", "H32", "H36", "H37", "H40"],
  };
}

// ─── 5. The prediction grid ───────────────────────────────────────────────────

export type GridTarget = "tp-10y" | "tp-foreign-total" | "tp-prime" | "tp-mortgage-30y" | "tp-ci-loans" | "tp-home-price";
export const GRID_TARGETS: GridTarget[] = ["tp-10y", "tp-foreign-total", "tp-prime", "tp-mortgage-30y", "tp-ci-loans", "tp-home-price"];
export const GRID_HORIZONS = [3, 6, 12] as const;

export type GridCell = {
  target: GridTarget;
  horizonMonths: number;
  /** −1…+1: the weighted, signed sum of leader z-scores × lead correlations. */
  score: number;
  direction: "up" | "down" | "flat" | "pending";
  confidence: number;
  grade: "A" | "B" | "C" | "D" | "F" | "—";
  drivers: Array<{ leader: string; r: number; lag: number; z: number; contribution: number }>;
};

/**
 * From measured lead-lag findings (emergentPatterns.detectPatterns) and the
 * current standardised reading of every leader, a cell per target and
 * horizon. A finding contributes when its follower is the target and its lag
 * is within the horizon; contribution = r × z(leader), so a strong leader that
 * is far from its mean drives the cell. Confidence is the finding-weighted
 * mean of the findings' own confidence; no findings → pending.
 */
export function predictionGrid(leads: PairFinding[], z: Map<string, number>, targetIds: Record<string, string> = {}): GridCell[] {
  const cells: GridCell[] = [];
  for (const target of GRID_TARGETS) {
    const storedId = targetIds[target] ?? target;
    for (const h of GRID_HORIZONS) {
      const rel = leads.filter(f => (f.b === storedId || f.b === target) && f.lag <= h && f.lag >= 1);
      if (!rel.length) {
        cells.push({ target, horizonMonths: h, score: 0, direction: "pending", confidence: 0, grade: "—", drivers: [] });
        continue;
      }
      let sum = 0;
      let wsum = 0;
      let csum = 0;
      const drivers: GridCell["drivers"] = [];
      for (const f of rel) {
        const zl = z.get(f.a) ?? 0;
        const contribution = f.r * zl * (f.confidence / 100);
        sum += contribution;
        wsum += Math.abs(f.r) * (f.confidence / 100);
        csum += f.confidence;
        drivers.push({ leader: f.a, r: f.r, lag: f.lag, z: Math.round(zl * 100) / 100, contribution: Math.round(contribution * 1000) / 1000 });
      }
      const score = wsum ? clamp(sum / wsum, -1, 1) : 0;
      const confidence = Math.round(csum / rel.length);
      const grade: GridCell["grade"] = confidence >= 85 ? "A" : confidence >= 70 ? "B" : confidence >= 50 ? "C" : confidence >= 30 ? "D" : "F";
      drivers.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
      cells.push({ target, horizonMonths: h, score: Math.round(score * 1000) / 1000, direction: Math.abs(score) < 0.1 ? "flat" : score > 0 ? "up" : "down", confidence, grade, drivers: drivers.slice(0, 6) });
    }
  }
  return cells;
}

export const TREASURY_POOL_BY_ID: ReadonlyMap<string, TreasuryPoolSeries> = new Map(TREASURY_POOL_SERIES.map(s => [s.id, s]));
