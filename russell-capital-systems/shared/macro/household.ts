/**
 * Household layer — what families pay and do, and how a client compares.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Three things, all data-first and pure (no fetch, no database, no clock):
 *
 *   1. `HOUSEHOLD_SIGNALS` — fifty series the owner asked to link into the
 *      site: car and house purchases, the forty-year price records for
 *      mortgages, cars, tuition, food, fuel, rent and health, the behaviour
 *      tells (saving, credit, where people eat and shop), and the wealth and
 *      income references. Each names its publisher, its earliest date, its
 *      cadence, what it signals and why. Twenty-five of them are also factor
 *      rows (`HOUSEHOLD_FACTORS` in indicators.ts) and get backtested like the
 *      macro factors; the rest are pages for the 36-hour review or connectors
 *      for the next pass.
 *
 *   2. `collegeCostProjection()` — the total college package for a child:
 *      sticker cost grown to the start year, four years of it, books, other
 *      expenses, the loan the family would take, what that loan costs over its
 *      term, and the opportunity cost of every dollar that goes to a lender
 *      instead of compounding at the owner's stated rate. Every baseline is a
 *      rules-table row flagged VERIFY until the review re-enters it from the
 *      publisher's release.
 *
 *   3. `relativeWealth()` — a client's net worth against every American of
 *      the same age (Survey of Consumer Finances 2022) and against a peer in
 *      the same profession (peer median income × the age bracket's
 *      net-worth-to-income multiple, scaled by years in the profession). The
 *      percentile is a log-normal fit to the bracket's median and mean, and
 *      the output says so; the reference rows are flagged VERIFY.
 *
 * Reasoning for "flagged VERIFY": the owner said "I don't know if we have to
 * make it up but we want to verify it". The layer never makes a number up; it
 * types the publisher's figure with the release date, marks it unverified,
 * and the review turns the flag off by re-entering it from the release.
 */
import type { IsoDate } from "./types";
import { A, assumption } from "./assumptions";
import { HOUSEHOLD_FACTORS } from "./indicators";

// ─── 1. The fifty signals ─────────────────────────────────────────────────────

export type SignalGroup = "housing" | "autos" | "education" | "food-and-shopping" | "saving-and-credit" | "income-and-wealth" | "health-energy-travel" | "corporate-tells";

export type HouseholdSignal = {
  id: string;
  name: string;
  group: SignalGroup;
  /** Registry source id. */
  sourceId: string;
  /** Series key when a keyless connector reads it (fred:…); a URL otherwise. */
  series?: string;
  url?: string;
  publishedFrom: IsoDate;
  cadence: "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "triennial";
  access: "keyless" | "page" | "keyless-keyed-optional";
  /** What a rise means for the economy the client lives in. */
  direction: "risk-up" | "risk-down" | "cost";
  /** Which factor row backtests it, if any. */
  factorId?: string;
  signals: string;
  reasoning: string;
};

const sig = (id: string, name: string, group: SignalGroup, sourceId: string, publishedFrom: IsoDate, cadence: HouseholdSignal["cadence"], access: HouseholdSignal["access"], direction: HouseholdSignal["direction"], signals: string, reasoning: string, extra: Partial<HouseholdSignal> = {}): HouseholdSignal =>
  ({ id, name, group, sourceId, publishedFrom, cadence, access, direction, signals, reasoning, ...extra });

export const HOUSEHOLD_SIGNALS: HouseholdSignal[] = [
  // Housing (11)
  sig("existing-home-sales", "Existing-home sales, monthly", "housing", "fred", "1968-01-01", "monthly", "keyless", "risk-down", "House purchases month by month", "Nine in ten home sales are existing homes; the series falls a year before recessions and is the volume side of the Mortgage Killer's market.", { series: "fred:EXHOSLUSM495S", factorId: "h-existing-home-sales-yoy" }),
  sig("new-home-sales", "New single-family home sales", "housing", "fred", "1963-01-01", "monthly", "keyless", "risk-down", "New construction demand", "Builders' sales lead starts and employment in construction, the most cyclical sector.", { series: "fred:HSN1F", factorId: "h-new-home-sales-yoy" }),
  sig("redfin-weekly", "Redfin weekly pending sales, price drops, days on market", "housing", "redfin-data-center", "2012-01-01", "weekly", "keyless", "risk-down", "The daily-cadence read on the housing market", "The owner asked for house purchases 'kept up on a daily amount'; the monthly NAR series cannot do that, Redfin's weekly TSV can, and it is keyless.", { url: "https://www.redfin.com/news/data-center/" }),
  sig("mortgage-rate-30y", "30-year fixed mortgage rate", "housing", "fred", "1971-04-02", "weekly", "keyless", "cost", "The average cost of the average mortgage, weekly since 1971", "Freddie Mac's survey rate is what a household is quoted; against median price and income it gives the affordability ratio over fifty years.", { series: "fred:MORTGAGE30US", factorId: "h-mortgage-rate" }),
  sig("median-home-price", "Median sales price of houses sold", "housing", "fred", "1963-01-01", "quarterly", "keyless", "cost", "The sixty-year house-price record", "Median, not average, so a few mansions do not move it; quarterly since 1963.", { series: "fred:MSPUS", factorId: "h-median-home-price-yoy" }),
  sig("case-shiller", "Case-Shiller national home price index", "housing", "fred", "1987-01-01", "monthly", "keyless", "risk-down", "Repeat-sales home prices", "Repeat-sales indices measure the same house twice, so they track what an owner's equity actually did.", { series: "fred:CSUSHPINSA", factorId: "h-case-shiller-yoy" }),
  sig("building-permits", "Building permits", "housing", "fred", "1960-01-01", "monthly", "keyless", "risk-down", "Housing supply a year ahead", "Permits lead starts by two months and the cycle by a year (Leamer 2007).", { series: "fred:PERMIT", factorId: "h-building-permits-yoy" }),
  sig("homeownership-rate", "Homeownership rate", "housing", "fred", "1965-01-01", "quarterly", "keyless", "risk-up", "Who owns versus rents", "Slow-moving, but the 2004 peak and 2016 trough bracket a whole credit cycle.", { series: "fred:RHORUSQ156N", factorId: "h-homeownership-rate" }),
  sig("rent-cpi", "Rent of primary residence CPI", "housing", "fred", "1914-12-01", "monthly", "keyless", "cost", "What renters pay, since 1914", "A third of core CPI and the longest household price record available.", { series: "fred:CUUR0000SEHA", factorId: "h-rent-cpi-yoy" }),
  sig("zillow-zhvi-zori", "Zillow home values and asking rents by metro", "housing", "zillow-research", "1996-01-01", "monthly", "keyless", "cost", "Local prices and rents", "A client lives in one metro, not the national median; Zillow's CSVs are keyless and by zip.", { url: "https://www.zillow.com/research/data/" }),
  sig("nahb-hmi", "NAHB builder sentiment", "housing", "nahb-hmi", "1985-01-01", "monthly", "page", "risk-down", "Builders' read on traffic and sales six months out", "Sentiment leads permits; a page read on the review.", { url: "https://www.nahb.org/news-and-economics/housing-economics/indices/housing-market-index" }),
  // Autos (5)
  sig("vehicle-sales", "Light-vehicle sales, annual rate", "autos", "fred", "1976-01-01", "monthly", "keyless", "risk-down", "Car sales for the year, month by month", "The first big-ticket purchase deferred; below 12 m in every recession since 1982.", { series: "fred:TOTALSA", factorId: "h-vehicle-sales" }),
  sig("new-vehicle-cpi", "New-vehicle CPI", "autos", "fred", "1953-01-01", "monthly", "keyless", "cost", "The average cost of a car, forty years in an index", "CPI holds quality constant, so the index is the price of 'the same car'; the transaction price below is the price of the car people actually buy.", { series: "fred:CUUR0000SETA01", factorId: "h-cpi-new-vehicles-yoy" }),
  sig("kbb-transaction-price", "Average new-vehicle transaction price (Kelley Blue Book / Cox)", "autos", "cox-manheim", "2012-01-01", "monthly", "page", "cost", "What buyers actually paid this month", "The owner's 'average cost of the car today'; BEA's average expenditure series extends it back to 1967.", { url: "https://www.coxautoinc.com/insights/" }),
  sig("manheim-used-index", "Manheim used-vehicle value index", "autos", "cox-manheim", "1995-01-01", "monthly", "page", "cost", "Used-car prices, wholesale", "Used prices move first and feed new-car demand and auto-loan collateral.", { url: "https://www.coxautoinc.com/insights/" }),
  sig("consumer-loan-delinquency", "Consumer loan delinquency rate", "autos", "fred", "1987-01-01", "quarterly", "keyless", "risk-up", "Auto and personal loan stress", "Delinquency is the cost of the car after the purchase; rises before unemployment.", { series: "fred:DRCLACBS", factorId: "h-consumer-loan-delinquency" }),
  // Education (6)
  sig("tuition-cpi", "College tuition and fees CPI", "education", "fred", "1978-01-01", "monthly", "keyless", "cost", "Tuition inflation since 1978", "The growth rate the college estimator uses; ~6 % a year for four decades.", { series: "fred:CUUR0000SEEB01", factorId: "h-cpi-tuition-yoy" }),
  sig("nces-330-10", "NCES: tuition, room and board since 1963", "education", "nces-digest", "1963-01-01", "annual", "page", "cost", "The sixty-year college cost table", "Tuition alone understates the package; NCES publishes room and board by sector back to 1963.", { url: "https://nces.ed.gov/programs/digest/d23/tables/dt23_330.10.asp" }),
  sig("college-board-budget", "College Board: books, supplies, transport, personal expenses", "education", "college-board-trends", "1971-01-01", "annual", "page", "cost", "The full cost of attendance", "The owner asked for 'books and food and all that'; the College Board budget is the published all-in figure.", { url: "https://research.collegeboard.org/trends/college-pricing" }),
  sig("student-loan-rates", "Federal student loan rates and fees", "education", "studentaid-rates", "2006-07-01", "annual", "page", "cost", "The interest side of the college package", "Undergraduate, graduate and Parent PLUS rates reset each July; the estimator's loan rows.", { url: "https://studentaid.gov/understand-aid/types/loans/interest-rates" }),
  sig("student-loan-balances", "Student loan balances and delinquency (NY Fed HHDC)", "education", "nyfed-hhdc", "2003-01-01", "quarterly", "page", "risk-up", "What the last generation's college cost is doing to their balance sheets", "The forward-looking client is the child; the backward-looking evidence is the parent's cohort.", { url: "https://www.newyorkfed.org/microeconomics/hhdc" }),
  sig("education-cpi-vs-wages", "Tuition CPI relative to the average wage index", "education", "ssa-awi", "1978-01-01", "annual", "page", "cost", "College cost in years of work", "Prices only mean something against pay; the SSA average wage index is the national pay series since 1951.", { url: "https://www.ssa.gov/oact/cola/AWI.html" }),
  // Food and shopping (8)
  sig("food-services-sales", "Restaurant and bar sales", "food-and-shopping", "fred", "1992-01-01", "monthly", "keyless", "risk-down", "How much people eat out", "Discretionary spending in its purest form.", { series: "fred:RSFSDPN", factorId: "h-food-services-sales-yoy" }),
  sig("grocery-sales", "Grocery store sales", "food-and-shopping", "fred", "1992-01-01", "monthly", "keyless", "risk-up", "Eating at home", "Rises relative to restaurants when households pull back; the ratio is a factor.", { series: "fred:RSGCSN", factorId: "h-grocery-vs-restaurants" }),
  sig("general-merch-sales", "General merchandise stores (clubs, supercenters, dollar stores)", "food-and-shopping", "fred", "1992-01-01", "monthly", "keyless", "risk-down", "Where the trade-down goes", "The owner's 'lower-end grocery' tell: dollar stores and supercenters gain share in downturns.", { series: "fred:RSGMSN", factorId: "h-general-merch-sales-yoy" }),
  sig("mcd-revenue-edgar", "McDonald's reported revenue and comparable sales (SEC filings)", "food-and-shopping", "sec-edgar-xbrl", "2009-01-01", "quarterly", "keyless", "risk-up", "The fast-food tell, from the filing", "The owner's hypothesis: more fast food, weaker economy. The test is the filing, not the anecdote; EDGAR's XBRL API is keyless.", { url: "https://data.sec.gov/api/xbrl/companyfacts/CIK0000063908.json" }),
  sig("dollar-general-edgar", "Dollar General and Walmart reported revenue (SEC filings)", "food-and-shopping", "sec-edgar-xbrl", "2009-01-01", "quarterly", "keyless", "risk-up", "Trade-down retailers' growth", "When their growth outruns total retail, households are trading down.", { url: "https://data.sec.gov/api/xbrl/companyfacts/CIK0000029534.json" }),
  sig("food-away-cpi", "Food away from home CPI", "food-and-shopping", "fred", "1953-01-01", "monthly", "keyless", "cost", "The price of eating out", "Separates 'people eat out less' from 'eating out costs more'.", { series: "fred:CUUR0000SEFV", factorId: "h-cpi-food-away-yoy" }),
  sig("food-home-cpi", "Food at home CPI", "food-and-shopping", "fred", "1952-01-01", "monthly", "keyless", "cost", "The grocery bill's price", "The other half of the same separation.", { series: "fred:CUUR0000SAF11", factorId: "h-cpi-food-home-yoy" }),
  sig("usda-food-plans", "USDA cost of food at home for a family of four", "food-and-shopping", "usda-food-plans", "1994-01-01", "monthly", "page", "cost", "A budget line, not an index", "Clients budget in dollars a month, not index points; USDA publishes the dollars.", { url: "https://www.fns.usda.gov/research/cnpp/usda-food-plans/cost-food-monthly-reports" }),
  // Saving and credit (7)
  sig("saving-rate", "Personal saving rate", "saving-and-credit", "fred", "1959-01-01", "monthly", "keyless", "risk-up", "People saving and not spending", "Precautionary saving jumps when households fear for jobs; the owner named this one directly.", { series: "fred:PSAVERT", factorId: "h-saving-rate" }),
  sig("consumer-credit", "Total consumer credit", "saving-and-credit", "fred", "1943-01-01", "monthly", "keyless", "risk-down", "Household borrowing", "Growth slows into recessions; eighty years of it.", { series: "fred:TOTALSL", factorId: "h-consumer-credit-yoy" }),
  sig("revolving-credit", "Revolving (card) credit", "saving-and-credit", "fred", "1968-01-01", "monthly", "keyless", "risk-up", "Borrowing to hold spending", "Card balances surging while saving falls is the late-cycle signature.", { series: "fred:REVOLSL", factorId: "h-revolving-credit-yoy" }),
  sig("card-delinquency", "Credit-card delinquency rate", "saving-and-credit", "fred", "1991-01-01", "quarterly", "keyless", "risk-up", "Households missing payments", "Rises a year before unemployment.", { series: "fred:DRCCLACBS", factorId: "h-card-delinquency" }),
  sig("nyfed-hhdc", "NY Fed household debt and credit by age", "saving-and-credit", "nyfed-hhdc", "2003-01-01", "quarterly", "page", "risk-up", "Delinquency transitions by age", "A client's own age band is what matters to a client.", { url: "https://www.newyorkfed.org/microeconomics/hhdc" }),
  sig("durable-goods", "Spending on durable goods", "saving-and-credit", "fred", "1959-01-01", "monthly", "keyless", "risk-down", "Deferred big purchases", "Cars, appliances and furniture are the first things postponed.", { series: "fred:PCEDG", factorId: "h-durable-goods-yoy" }),
  sig("challenger-layoffs", "Announced layoffs (Challenger)", "saving-and-credit", "challenger-layoffs", "1993-01-01", "monthly", "page", "risk-up", "Job cuts before they hit claims", "Announcements precede filings by a month or two.", { url: "https://www.challengergray.com/blog/category/job-cut-report/" }),
  // Income and wealth (7)
  sig("median-income", "Real median household income", "income-and-wealth", "fred", "1984-01-01", "annual", "keyless", "risk-down", "What the middle earns", "The denominator of every affordability ratio the site shows.", { series: "fred:MEHOINUSA672N", factorId: "h-median-income-real-yoy" }),
  sig("scf-networth-by-age", "Net worth by age (Survey of Consumer Finances)", "income-and-wealth", "fed-scf", "1989-01-01", "triennial", "page", "cost", "The relative-wealth reference table", "The only survey that measures both sides of a family's balance sheet; every three years since 1989.", { url: "https://www.federalreserve.gov/econres/scfindex.htm" }),
  sig("dfa-networth-quarterly", "Distributional Financial Accounts: net worth by age and percentile, quarterly", "income-and-wealth", "fed-dfa", "1989-07-01", "quarterly", "keyless", "cost", "The SCF table refreshed every quarter", "Keeps the relative-wealth module current between SCF waves; keyless CSV.", { url: "https://www.federalreserve.gov/releases/z1/dataviz/dfa/" }),
  sig("bls-oes-wages", "Median wage by occupation (OES)", "income-and-wealth", "bls-oes", "1997-01-01", "annual", "keyless-keyed-optional", "cost", "What a peer in the same profession earns", "The profession-peer comparison needs a peer income; OES has 800 occupations by state.", { url: "https://www.bls.gov/oes/" }),
  sig("census-acs-income", "Income by age, occupation and geography (ACS)", "income-and-wealth", "census-acs", "2005-01-01", "annual", "keyless-keyed-optional", "cost", "The local, age-specific income reference", "OES is national by occupation; ACS adds geography and age.", { url: "https://api.census.gov/data/2023/acs/acs1" }),
  sig("ssa-awi", "National average wage index", "income-and-wealth", "ssa-awi", "1951-01-01", "annual", "page", "cost", "Seventy years of the average wage", "Every price record on this list divided by this series is an affordability record.", { url: "https://www.ssa.gov/oact/cola/AWI.html" }),
  sig("bls-cex", "Consumer Expenditure Survey by income decile and age", "income-and-wealth", "bls-cex", "1984-01-01", "annual", "keyless-keyed-optional", "cost", "How households actually allocate", "Food away from home versus at home by decile is the fast-food hypothesis tested on households, not chains.", { url: "https://www.bls.gov/cex/" }),
  // Health, energy, travel (4)
  sig("medical-cpi", "Medical care CPI", "health-energy-travel", "fred", "1947-01-01", "monthly", "keyless", "cost", "Health costs since 1947", "The second-fastest-rising household line.", { series: "fred:CPIMEDSL", factorId: "h-medical-cpi-yoy" }),
  sig("kff-premiums", "Employer family health premium and worker share", "health-energy-travel", "kff-ehbs", "1999-01-01", "annual", "page", "cost", "What a family actually pays for coverage", "CPI measures prices; KFF measures the premium a household sees on a pay stub.", { url: "https://www.kff.org/health-costs/report/employer-health-benefits-survey/" }),
  sig("gasoline", "Regular gasoline price, weekly", "health-energy-travel", "fred", "1990-08-20", "weekly", "keyless", "cost", "The price on the corner", "The most-seen price in America; moves sentiment within a month.", { series: "fred:GASREGW", factorId: "h-gasoline-price-yoy" }),
  sig("tsa-throughput", "TSA passengers screened, daily", "health-energy-travel", "tsa-throughput", "2019-01-01", "daily", "page", "risk-down", "Discretionary travel in real time", "Daily, public, and the cleanest 'are people still flying' series there is.", { url: "https://www.tsa.gov/travel/passenger-volumes" }),
  // Corporate and qualitative tells (2)
  sig("opentable-diners", "OpenTable seated diners versus 2019", "corporate-tells", "opentable-state", "2020-02-18", "daily", "page", "risk-down", "Full-service dining, daily", "Pairs with the fast-food tell: when full-service falls and fast food holds, the trade-down is under way.", { url: "https://www.opentable.com/state-of-industry" }),
  sig("beige-book", "Beige Book district reports on consumers", "corporate-tells", "fed-beige-book", "1970-01-01", "monthly", "keyless", "risk-down", "What businesses told the Fed about their customers", "Eight times a year, twelve districts, on the record; the qualitative check on every series above.", { url: "https://www.federalreserve.gov/monetarypolicy/beige-book-default.htm" }),
];

export const HOUSEHOLD_SIGNAL_BY_ID: ReadonlyMap<string, HouseholdSignal> = new Map(HOUSEHOLD_SIGNALS.map(s => [s.id, s]));

// ─── 2. College cost projection ───────────────────────────────────────────────

export type SchoolType = "public-in-state" | "public-out-of-state" | "private-nonprofit";

export type CollegeCostInput = {
  /** Child's age today; college starts at `startAge` (default 18). */
  childAge: number;
  startAge?: number;
  years?: number;
  school: SchoolType;
  includeRoomBoard?: boolean;
  includeBooks?: boolean;
  includeOther?: boolean;
  /** Share of the package the family will borrow, 0–1. */
  borrowShare?: number;
  /** Override the rules-table growth rates (percent per year). */
  tuitionGrowthPct?: number;
  roomBoardGrowthPct?: number;
  /** Override the opportunity-cost rate (percent per year). */
  opportunityRatePct?: number;
  /** Loan rate override (percent). */
  loanRatePct?: number;
  /** Use Parent PLUS instead of undergraduate Direct. */
  parentPlus?: boolean;
};

export type CollegeYear = { year: number; calendarOffset: number; tuitionFees: number; roomBoard: number; books: number; other: number; total: number };

export type CollegeCostResult = {
  asOf: IsoDate;
  input: Required<Pick<CollegeCostInput, "childAge" | "startAge" | "years" | "school" | "includeRoomBoard" | "includeBooks" | "includeOther" | "borrowShare" | "parentPlus">> & { tuitionGrowthPct: number; roomBoardGrowthPct: number; opportunityRatePct: number; loanRatePct: number };
  yearsUntilStart: number;
  /** The same package at today's prices. */
  todayPackage: number;
  /** Year-by-year cost from the start year. */
  years: CollegeYear[];
  projectedPackage: number;
  loan: { principal: number; originationFee: number; ratePct: number; termYears: number; monthlyPayment: number; totalRepaid: number; totalInterest: number };
  /** What the loan payments would have become at the opportunity rate, had they been invested over the term instead. */
  opportunityCostOfPayments: number;
  /** What the projected package would become at the opportunity rate over the term (the "cost of not having it invested"). */
  opportunityCostOfPackage: number;
  totalEconomicCost: number;
  /** Rows the reader should re-enter from the publisher's release before quoting. */
  unverified: string[];
  sourceIds: string[];
  assumptions: string[];
};

const money = (x: number) => Math.round(x * 100) / 100;

function annuityPayment(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

function futureValueOfPayments(monthly: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

export function collegeCostProjection(input: CollegeCostInput, asOf: IsoDate = "2026-09-22"): CollegeCostResult {
  const startAge = input.startAge ?? 18;
  const years = input.years ?? 4;
  const includeRoomBoard = input.includeRoomBoard ?? true;
  const includeBooks = input.includeBooks ?? true;
  const includeOther = input.includeOther ?? true;
  const borrowShare = Math.min(1, Math.max(0, input.borrowShare ?? 0.5));
  const parentPlus = input.parentPlus ?? false;
  const tuitionGrowthPct = input.tuitionGrowthPct ?? A("college.growth.tuition");
  const roomBoardGrowthPct = input.roomBoardGrowthPct ?? A("college.growth.roomBoard");
  const opportunityRatePct = input.opportunityRatePct ?? A("college.opportunity.rate");
  const loanRatePct = input.loanRatePct ?? (parentPlus ? A("college.loan.parentPlusRate") : A("college.loan.undergradRate"));
  const yearsUntilStart = Math.max(0, startAge - input.childAge);

  const tuitionId = input.school === "public-in-state" ? "college.publicInState.tuitionFees" : input.school === "public-out-of-state" ? "college.publicOutOfState.tuitionFees" : "college.privateNonprofit.tuitionFees";
  const roomId = input.school === "private-nonprofit" ? "college.privateNonprofit.roomBoard" : "college.publicInState.roomBoard";
  const tuitionToday = A(tuitionId);
  const roomToday = includeRoomBoard ? A(roomId) : 0;
  const booksToday = includeBooks ? A("college.booksSupplies") : 0;
  const otherToday = includeOther ? A("college.otherExpenses") : 0;
  const todayPackage = (tuitionToday + roomToday + booksToday + otherToday) * years;

  const rows: CollegeYear[] = [];
  let projectedPackage = 0;
  for (let y = 0; y < years; y++) {
    const t = yearsUntilStart + y;
    const gT = Math.pow(1 + tuitionGrowthPct / 100, t);
    const gR = Math.pow(1 + roomBoardGrowthPct / 100, t);
    const row: CollegeYear = {
      year: y + 1,
      calendarOffset: t,
      tuitionFees: money(tuitionToday * gT),
      roomBoard: money(roomToday * gR),
      books: money(booksToday * gR),
      other: money(otherToday * gR),
      total: 0,
    };
    row.total = money(row.tuitionFees + row.roomBoard + row.books + row.other);
    projectedPackage += row.total;
    rows.push(row);
  }
  projectedPackage = money(projectedPackage);

  const termYears = A("college.loan.termYears");
  const feePct = parentPlus ? A("college.loan.originationFeePct") * 4 : A("college.loan.originationFeePct");
  const principal = money(projectedPackage * borrowShare);
  const originationFee = money(principal * (feePct / 100));
  // Totals are computed from the unrounded payment so a zero-rate loan shows exactly zero interest; the displayed payment is rounded to cents.
  const monthlyRaw = annuityPayment(principal, loanRatePct, termYears);
  const monthlyPayment = money(monthlyRaw);
  const totalRepaid = money(monthlyRaw * termYears * 12);
  const totalInterest = money(totalRepaid - principal);
  const opportunityCostOfPayments = money(futureValueOfPayments(monthlyRaw, opportunityRatePct, termYears) - monthlyRaw * termYears * 12);
  const opportunityCostOfPackage = money(projectedPackage * Math.pow(1 + opportunityRatePct / 100, termYears) - projectedPackage);

  const rowIds = [tuitionId, roomId, "college.booksSupplies", "college.otherExpenses", parentPlus ? "college.loan.parentPlusRate" : "college.loan.undergradRate", "college.loan.originationFeePct"];
  const unverified = rowIds.filter(id => /VERIFY/.test(assumption(id).basis));
  return {
    asOf,
    input: { childAge: input.childAge, startAge, years, school: input.school, includeRoomBoard, includeBooks, includeOther, borrowShare, parentPlus, tuitionGrowthPct, roomBoardGrowthPct, opportunityRatePct, loanRatePct },
    yearsUntilStart,
    todayPackage: money(todayPackage),
    years: rows,
    projectedPackage,
    loan: { principal, originationFee, ratePct: loanRatePct, termYears, monthlyPayment, totalRepaid, totalInterest },
    opportunityCostOfPayments,
    opportunityCostOfPackage,
    totalEconomicCost: money(projectedPackage + totalInterest + originationFee + opportunityCostOfPayments),
    unverified,
    sourceIds: ["college-board-trends", "studentaid-rates", "fred", "nces-digest"],
    assumptions: [
      `Tuition grows ${tuitionGrowthPct}% a year (college.growth.tuition: ${assumption("college.growth.tuition").basis})`,
      `Room, board, books and other grow ${roomBoardGrowthPct}% a year (college.growth.roomBoard)`,
      `Loan: ${borrowShare * 100}% of the package at ${loanRatePct}% over ${termYears} years, ${feePct.toFixed(3)}% origination fee`,
      `Opportunity cost: every payment compounded at ${opportunityRatePct}% for the term (college.opportunity.rate, the owner's stated rate)`,
      unverified.length ? `${unverified.length} baseline rows are flagged VERIFY: typed from the publisher's release, to be re-entered on the 36-hour review` : "All baseline rows verified",
    ],
  };
}

// ─── 3. Relative wealth ───────────────────────────────────────────────────────

export type AgeBracket = "u35" | "35-44" | "45-54" | "55-64" | "65-74" | "75plus";

export function ageBracket(age: number): AgeBracket {
  if (age < 35) return "u35";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  if (age < 65) return "55-64";
  if (age < 75) return "65-74";
  return "75plus";
}

export type RelativeWealthInput = {
  age: number;
  netWorth: number;
  /** Household income before tax, if known. */
  income?: number;
  profession?: string;
  yearsInProfession?: number;
  /** Median income of a peer in the same profession (from OES or entered by the advisor). */
  peerMedianIncome?: number;
};

export type RelativeWealthResult = {
  asOf: IsoDate;
  bracket: AgeBracket;
  reference: { medianNetWorth: number; meanNetWorth: number; medianIncome: number; allMedianNetWorth: number; allMedianIncome: number };
  /** Client versus every household in the age bracket. */
  vsAge: { ratioToMedian: number; percentile: number; deciles: number[]; readout: string };
  /** Client versus every household regardless of age. */
  vsAll: { ratioToMedian: number; percentile: number };
  /** Client versus a peer in the same profession, when a peer income is given. */
  vsPeer: null | { peerMedianIncome: number; expectedPeerNetWorth: number; multipleOfIncome: number; experienceScale: number; ratio: number; readout: string };
  /** Net worth needed to reach the next decile in the age bracket. */
  nextDecile: { percentile: number; netWorth: number; gap: number } | null;
  method: string[];
  unverified: string[];
  sourceIds: string[];
};

/** Standard normal CDF (Abramowitz–Stegun 7.1.26). */
function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
function normInv(p: number): number {
  // Acklam's rational approximation.
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Log-normal fit from a median and a mean: σ² = 2·ln(mean/median). Net worth
 * can be zero or negative, which a log-normal cannot hold; anything at or
 * below zero is placed at the bottom decile and the method line says so.
 */
function lognormalPercentile(value: number, median: number, mean: number): number {
  if (value <= 0 || median <= 0 || mean <= median) return value <= 0 ? 0.08 : 0.5;
  const sigma = Math.sqrt(2 * Math.log(mean / median));
  const z = (Math.log(value) - Math.log(median)) / sigma;
  return Math.round(normCdf(z) * 1000) / 1000;
}
function lognormalQuantile(p: number, median: number, mean: number): number {
  const sigma = Math.sqrt(2 * Math.log(mean / median));
  return Math.round(Math.exp(Math.log(median) + sigma * normInv(p)));
}

export function relativeWealth(input: RelativeWealthInput, asOf: IsoDate = "2026-09-22"): RelativeWealthResult {
  const bracket = ageBracket(input.age);
  const medianNetWorth = A(`scf.netWorth.median.${bracket}`);
  const meanNetWorth = A(`scf.netWorth.mean.${bracket}`);
  const medianIncome = A(`scf.income.median.${bracket}`);
  const allMedianNetWorth = A("scf.netWorth.median.all");
  const allMeanNetWorth = A("scf.netWorth.mean.all");
  const allMedianIncome = A("census.income.median.all");

  const pAge = lognormalPercentile(input.netWorth, medianNetWorth, meanNetWorth);
  const pAll = lognormalPercentile(input.netWorth, allMedianNetWorth, allMeanNetWorth);
  const deciles = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(p => lognormalQuantile(p, medianNetWorth, meanNetWorth));
  const nextP = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].find(p => p > pAge);
  const nextDecile = nextP ? { percentile: nextP, netWorth: lognormalQuantile(nextP, medianNetWorth, meanNetWorth), gap: Math.max(0, lognormalQuantile(nextP, medianNetWorth, meanNetWorth) - input.netWorth) } : null;

  let vsPeer: RelativeWealthResult["vsPeer"] = null;
  if (input.peerMedianIncome && input.peerMedianIncome > 0) {
    const multiple = medianNetWorth / medianIncome;
    const full = A("relwealth.experience.fullYears");
    const experienceScale = input.yearsInProfession === undefined ? 1 : Math.min(1.5, Math.max(0.5, input.yearsInProfession / full));
    const expected = Math.round(input.peerMedianIncome * multiple * experienceScale);
    const ratio = expected > 0 ? Math.round((input.netWorth / expected) * 100) / 100 : 0;
    vsPeer = {
      peerMedianIncome: input.peerMedianIncome,
      expectedPeerNetWorth: expected,
      multipleOfIncome: Math.round(multiple * 100) / 100,
      experienceScale: Math.round(experienceScale * 100) / 100,
      ratio,
      readout: `A ${input.profession ?? "peer"} earning the profession's median ($${input.peerMedianIncome.toLocaleString()}) at this age typically holds ${(multiple * experienceScale).toFixed(1)}× income ≈ $${expected.toLocaleString()}; the client holds ${ratio}× that.`,
    };
  }

  const unverified = [`scf.netWorth.median.${bracket}`, `scf.netWorth.mean.${bracket}`, `scf.income.median.${bracket}`, "scf.netWorth.median.all", "scf.netWorth.mean.all", "census.income.median.all"].filter(id => /VERIFY/.test(assumption(id).basis));
  return {
    asOf,
    bracket,
    reference: { medianNetWorth, meanNetWorth, medianIncome, allMedianNetWorth, allMedianIncome },
    vsAge: {
      ratioToMedian: Math.round((input.netWorth / medianNetWorth) * 100) / 100,
      percentile: pAge,
      deciles,
      readout: `At ${input.age}, net worth of $${Math.round(input.netWorth).toLocaleString()} is ${Math.round(pAge * 100)}th percentile for households headed by someone ${bracket === "u35" ? "under 35" : bracket === "75plus" ? "75 or older" : bracket.replace("-", "–")} (median $${medianNetWorth.toLocaleString()}, mean $${meanNetWorth.toLocaleString()}).`,
    },
    vsAll: { ratioToMedian: Math.round((input.netWorth / allMedianNetWorth) * 100) / 100, percentile: pAll },
    vsPeer,
    nextDecile,
    method: [
      "Reference: Survey of Consumer Finances 2022 (Federal Reserve, Oct 2023) medians and means by age of head; refreshed quarterly from the Distributional Financial Accounts once that connector runs.",
      "Percentile: log-normal fit to the bracket's median and mean (σ² = 2·ln(mean/median)); net worth at or below zero is placed in the bottom decile because a log-normal cannot hold it. The SCF's own percentile tables replace this fit on review.",
      "Peer comparison: peer median income (BLS OES for the occupation, or entered) × the bracket's median net-worth-to-income multiple × an experience scale (years in profession ÷ 20, clamped 0.5–1.5). A model, stated so it can be argued with.",
      unverified.length ? `${unverified.length} reference rows are flagged VERIFY: typed from the bulletin, to be re-entered on review.` : "Reference rows verified.",
    ],
    unverified,
    sourceIds: ["fed-scf", "fed-dfa", "bls-oes", "census-acs"],
  };
}

// ─── 4. Ideas the owner asked for: what else to wire in (data, so the doc is generated) ─

export type HouseholdIdea = { n: number; title: string; what: string; reasoning: string; sources: string[]; effort: "S" | "M" | "L" };

export const HOUSEHOLD_IDEAS: HouseholdIdea[] = [
  { n: 1, title: "Affordability ratios, not prices", what: "Every price record divided by the average wage index: house price in years of pay, a car in weeks of pay, a year of college in months of pay, 1951 to today.", reasoning: "A client cannot feel an index; 'a house cost 4 years of pay in 1985 and 7 today' they can. The wage series exists (SSA AWI) and every numerator is already on the list.", sources: ["ssa-awi", "fred"], effort: "S" },
  { n: 2, title: "The client's own cost-of-living index", what: "Weight the CPI components by what this household actually buys (from their budget in the platform), so their inflation is theirs, not the national basket's.", reasoning: "A retiree's basket is medical and housing; a young family's is childcare, food and cars. The national CPI is wrong for both; the components are all keyless.", sources: ["fred", "bls-cex"], effort: "M" },
  { n: 3, title: "Trade-down index", what: "One number from three series: dollar-store and supercenter growth minus total retail, grocery over restaurants, fast-food revenue growth over full-service.", reasoning: "The owner's hypothesis (more fast food, lower-end grocers = weaker economy) deserves one measured index with a backtest, not three anecdotes.", sources: ["fred", "sec-edgar-xbrl"], effort: "S" },
  { n: 4, title: "Precautionary saving detector", what: "Saving rate rising while sentiment falls and durable spending falls: the three-way condition the pattern detector already scores as a conditional triple.", reasoning: "Saving rises for good reasons (a windfall) and bad (fear); the triple separates them.", sources: ["fred"], effort: "S" },
  { n: 5, title: "Local, not national", what: "Zillow by zip, Redfin by metro, ACS income by county: the client's own market beside the national line on every chart.", reasoning: "A Castle Hayne client and a Manhattan client share no housing market; the data is free and by zip.", sources: ["zillow-research", "redfin-data-center", "census-acs"], effort: "M" },
  { n: 6, title: "College cost by named school", what: "IPEDS (NCES) publishes tuition, room and board, net price by income band and graduation rate for every institution, keyless.", reasoning: "Parents plan for a school, not a sector; IPEDS turns the estimator from 'private nonprofit' into 'Duke'.", sources: ["nces-digest"], effort: "M" },
  { n: 7, title: "Net price, not sticker", what: "Apply the College Board's average grant aid by income band so the estimate is what families in the client's bracket actually pay.", reasoning: "Sticker overstates cost for most families by a third or more; the net figure is published annually.", sources: ["college-board-trends"], effort: "S" },
  { n: 8, title: "Loan versus 529 versus IUL, on the same page as the cost", what: "Feed the projected package into the existing 529 planner and the 529-vs-IUL comparison automatically (the wiring for the 529 planner is in this commit).", reasoning: "The estimate is only useful where the decision is made; the calculators already exist.", sources: ["college-board-trends", "studentaid-rates"], effort: "S" },
  { n: 9, title: "Opportunity cost at the client's own return", what: "Replace the flat 6 % with the client's LifeForge simulated return distribution, giving a range of opportunity costs.", reasoning: "6 % is the owner's stated default; the platform already simulates 10,000 paths per client.", sources: ["platform"], effort: "S" },
  { n: 10, title: "Career earnings curve by profession", what: "OES wages by age band (from ACS) give the shape of pay over a career; project the client's income path and the peer's.", reasoning: "A 32-year-old surgeon and a 32-year-old teacher have different curves ahead; the relative-wealth module should compare trajectories, not snapshots.", sources: ["bls-oes", "census-acs"], effort: "M" },
  { n: 11, title: "Wealth percentile refreshed quarterly", what: "Read the Distributional Financial Accounts CSV each quarter so the relative-wealth table moves between SCF waves.", reasoning: "The SCF is triennial; the DFA interpolates it quarterly and is keyless.", sources: ["fed-dfa"], effort: "S" },
  { n: 12, title: "Peer net worth by profession, measured", what: "The SCF public microdata has occupation category and net worth; tabulate median net worth by category and age from the file rather than modelling it from income.", reasoning: "The current peer estimate is a model; the microdata makes it a measurement for the ten broad categories the SCF codes.", sources: ["fed-scf"], effort: "M" },
  { n: 13, title: "Debt-service ratio for the household", what: "The client's payments over income against the Fed's household debt-service ratio (FRED TDSP, 1980+).", reasoning: "A single ratio with forty years of context answers 'am I overextended' better than any balance.", sources: ["fred"], effort: "S" },
  { n: 14, title: "Delinquency by age band", what: "NY Fed HHDC transition-to-delinquency by age, so a 30-year-old client sees 30-year-olds' stress, not the national rate.", reasoning: "Stress is concentrated by age; the national number hides it.", sources: ["nyfed-hhdc"], effort: "S" },
  { n: 15, title: "Fast-food and trade-down tells from the filings", what: "SEC EDGAR XBRL revenue for McDonald's, Walmart, Dollar General, Costco, Kroger, AutoZone each quarter, keyless, with the same backtest as every factor.", reasoning: "The filing is the primary source; the earnings-call anecdote is not. The API needs only a User-Agent header.", sources: ["sec-edgar-xbrl"], effort: "M" },
  { n: 16, title: "Daily discretionary index", what: "TSA passengers, OpenTable diners and Redfin pending sales combined into one daily line with a 7-day average.", reasoning: "The owner asked for daily cadence; these three are the only daily, public, discretionary series that go back to 2019.", sources: ["tsa-throughput", "opentable-state", "redfin-data-center"], effort: "M" },
  { n: 17, title: "Car cost of ownership, forty years", what: "Transaction price plus insurance CPI, gasoline, maintenance CPI and the auto-loan rate into one annual cost since 1986.", reasoning: "The car's price is a third of what it costs to own; the other components are all on FRED.", sources: ["fred", "cox-manheim"], effort: "S" },
  { n: 18, title: "Health premium in the plan", what: "KFF family premium and worker share as a line in every retirement projection, grown at medical CPI.", reasoning: "It is the largest expense most plans omit; both series exist.", sources: ["kff-ehbs", "fred"], effort: "S" },
  { n: 19, title: "Beige Book sentiment score", what: "Score each Beige Book's consumer paragraphs with the platform's model (through brainComplete) into a −1…+1 line since 1970, then backtest it like a factor.", reasoning: "It is the Fed's own qualitative read, on the record eight times a year; scoring it makes it a series.", sources: ["fed-beige-book"], effort: "M" },
  { n: 20, title: "Layoffs before claims", what: "Challenger announced cuts as a factor leading initial claims by one to two months.", reasoning: "It is the earliest labour signal that is public; the claims factor already exists as its target.", sources: ["challenger-layoffs"], effort: "S" },
  { n: 21, title: "Regime-conditioned household advice", what: "When the trade-down index and saving-rate detector both fire, the advisor's brief says so and the calculators default to the recession toggle.", reasoning: "The point of a signal is to change a default; today the toggles are manual.", sources: ["platform"], effort: "M" },
  { n: 22, title: "Every household number with its age", what: "Print 'as of' beside every cost and behaviour figure on client output, and the days since the source last answered.", reasoning: "The series meta table already holds it; showing it is the honesty the owner asked for.", sources: ["platform"], effort: "S" },
  { n: 23, title: "Client cohort comparison inside the platform", what: "Anonymised medians of the platform's own clients by age and profession beside the SCF, once there are enough of them.", reasoning: "The platform's clients are not the SCF's average family; the comparison a client most wants is to people like them.", sources: ["platform"], effort: "L" },
  { n: 24, title: "Cost-of-living shock toggle", what: "A fifth macro toggle: tuition +2 pp, medical +2 pp, rent +3 pp over the plan horizon, from the household factors' own history of surprises.", reasoning: "The four existing toggles are geopolitical; the household one is what families actually experience.", sources: ["fred"], effort: "S" },
  { n: 25, title: "Publish the household factor track record", what: "A public page: which of the 25 household factors led, which did not, with Brier scores, updated daily.", reasoning: "Nothing builds trust in a predictive platform like publishing its misses beside its hits.", sources: ["platform"], effort: "S" },
];

/** Consistency: every signal with a factorId names a real household factor, and every household factor is on the list. */
export function householdCatalogueCheck(): { missingFactors: string[]; unknownFactorIds: string[] } {
  const factorIds = new Set(HOUSEHOLD_FACTORS.map(f => f.id));
  const named = new Set(HOUSEHOLD_SIGNALS.map(s => s.factorId).filter((x): x is string => !!x));
  return {
    missingFactors: Array.from(factorIds).filter(id => !named.has(id)),
    unknownFactorIds: Array.from(named).filter(id => !factorIds.has(id)),
  };
}
