// ============================================================
// OUTSIDE FORCES — the six things a physician's plan cannot vote on:
// prices, the money itself, the house, credit, the federal balance sheet,
// and the two purchases that track confidence (cars and travel).
//
// Every number on the page is read live from a public statistical series
// (FRED's keyless CSV, or the keyed API when FRED_API_KEY is set) and carries
// its as-of date. Nothing is typed in from memory. A series that does not
// answer is shown as unavailable, never as a guess. Behind each force is a
// panel of the institutions that publish on it, weighted the same way the
// tax forecasters are: evidence × (½ + ½·track record) × (½ + ½·consistency).
// The weights say how much a reader should lean on each voice; they do not
// manufacture a forecast. Where the record does not support a causal claim,
// the caveat on the force says so.
// ============================================================
import { fetchFredObservationsSince, fredMode, type Observation } from "./_core/fred";
import { getMarketPoints, upsertMarketPoint } from "./messagingDb";
import { sourceWeight, type SourceDef } from "./forecastSources";

export type ForceId = "prices" | "fiat" | "home" | "credit" | "debt" | "cars" | "travel";
export type SeriesKind = "growth" | "points";
export type SeriesDef = {
  id: string;
  label: string;
  unit: string;
  /** growth: annualised change over each horizon (indexes, levels, dollars). points: change in the value itself (rates, shares). */
  kind: SeriesKind;
  publisher: string;
  /** A series the platform has not yet seen answer; it is shown only once it does. */
  candidate?: boolean;
};
export type ForceDef = {
  id: ForceId;
  title: string;
  question: string;
  series: SeriesDef[];
  sources: SourceDef[];
  caveat: string;
};

export const HORIZONS = [1, 5, 10, 20, 40] as const;
export type Horizon = (typeof HORIZONS)[number];

const src = (id: string, name: string, org: string, url: string, horizonYears: number, publishes: string, method: string, evidence: number, consistency: number, trackRecord = 0.5): SourceDef =>
  ({ id, name, org, url, horizonYears, publishes, method, defaults: { evidence, trackRecord, consistency } });

// Shared voices that sit on more than one panel.
const BLS_CPI = src("bls-cpi", "Consumer Price Index", "Bureau of Labor Statistics", "https://www.bls.gov/cpi/", 1, "Monthly price indexes for every category of household spending", "Survey of ~80,000 prices a month; official U.S. inflation measure", 0.95, 0.9);
const BEA = src("bea", "National accounts, PCE prices, vehicle sales", "Bureau of Economic Analysis", "https://www.bea.gov/", 1, "GDP, personal consumption, the PCE price index, monthly motor-vehicle unit sales", "National income and product accounts", 0.95, 0.85);
const FED_H6 = src("fed-h6", "H.6 Money Stock Measures", "Federal Reserve Board", "https://www.federalreserve.gov/releases/h6/", 1, "M1 and M2 weekly and monthly", "Aggregated from depository-institution reports", 0.95, 0.9);
const FED_H41 = src("fed-h41", "H.4.1 Factors Affecting Reserve Balances", "Federal Reserve Board", "https://www.federalreserve.gov/releases/h41/", 1, "The Fed's balance sheet, weekly", "Audited central-bank accounts", 0.95, 0.9);
const FED_H8 = src("fed-h8", "H.8 Assets and Liabilities of Commercial Banks", "Federal Reserve Board", "https://www.federalreserve.gov/releases/h8/", 1, "Bank loans and leases outstanding, weekly", "Reports from a panel of ~875 banks, benchmarked to Call Reports", 0.95, 0.85);
const FED_H15 = src("fed-h15", "H.15 Selected Interest Rates", "Federal Reserve Board", "https://www.federalreserve.gov/releases/h15/", 1, "Federal funds, Treasury and other benchmark rates, daily", "Market data compiled by the Board", 0.95, 0.9);
const FED_SLOOS = src("fed-sloos", "Senior Loan Officer Opinion Survey", "Federal Reserve Board", "https://www.federalreserve.gov/data/sloos.htm", 1, "Net share of banks tightening standards and seeing demand, by loan type, quarterly", "Survey of up to 80 large domestic banks and 24 foreign branches", 0.9, 0.8);
const FED_FOMC = src("fed-sep", "FOMC Summary of Economic Projections", "Federal Open Market Committee", "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm", 3, "Participants' projections for inflation, growth, unemployment and the policy rate", "Quarterly projections of the committee's own members", 0.85, 0.7);
const FED_FSR = src("fed-fsr", "Financial Stability Report", "Federal Reserve Board", "https://www.federalreserve.gov/publications/financial-stability-report.htm", 3, "Vulnerabilities in asset valuations, borrowing, leverage and funding", "Semi-annual assessment by Board staff", 0.85, 0.7);
const NYFED_HHDC = src("nyfed-hhdc", "Quarterly Report on Household Debt and Credit", "Federal Reserve Bank of New York", "https://www.newyorkfed.org/microeconomics/hhdc", 1, "Mortgage, auto, card and student balances, originations and delinquency, by age", "Consumer Credit Panel drawn from Equifax records", 0.9, 0.85);
const FED_G19 = src("fed-g19", "G.19 Consumer Credit", "Federal Reserve Board", "https://www.federalreserve.gov/releases/g19/", 1, "Revolving and non-revolving consumer credit outstanding, monthly", "Reports from lenders and securitizers", 0.9, 0.85);
const CBO = src("cbo", "Budget and Economic Outlook", "Congressional Budget Office", "https://www.cbo.gov/", 30, "Ten-year and long-term deficits, debt, interest and economic assumptions", "Nonpartisan agency baseline", 0.9, 0.7);
const GAO = src("gao", "America's Fiscal Future", "Government Accountability Office", "https://www.gao.gov/americas-fiscal-future", 30, "Long-term fiscal simulations", "Simulation reconciled to CBO and the Trustees", 0.8, 0.6);
const TREASURY_FD = src("treasury-fiscaldata", "Fiscal Data: Debt to the Penny", "U.S. Treasury", "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/", 1, "Total public debt outstanding, daily", "Treasury's own ledger", 0.95, 0.95);
const TREASURY_TIC = src("treasury-tic", "Treasury International Capital (TIC) System", "U.S. Treasury", "https://home.treasury.gov/data/treasury-international-capital-tic-system", 1, "Major foreign holders of Treasury securities, monthly", "Mandatory reports from U.S. custodians and dealers", 0.9, 0.8);
const TREASURY_QR = src("treasury-refunding", "Quarterly Refunding", "U.S. Treasury", "https://home.treasury.gov/policy-issues/financing-the-government/quarterly-refunding", 1, "Borrowing estimates and auction sizes", "Treasury's own financing plan", 0.9, 0.8);
const IMF_FM = src("imf-fm", "Fiscal Monitor", "International Monetary Fund", "https://www.imf.org/en/Publications/FM", 5, "Debt and deficit paths for every major economy", "Staff projections", 0.8, 0.6);
const IMF_WEO = src("imf-weo", "World Economic Outlook", "International Monetary Fund", "https://www.imf.org/en/Publications/WEO", 5, "Inflation and growth projections by country", "Staff projections, twice a year", 0.8, 0.6);
const BIS = src("bis-gaps", "Credit-to-GDP gaps", "Bank for International Settlements", "https://www.bis.org/statistics/c_gaps.htm", 5, "Private credit relative to GDP against its long-run trend", "Standardised early-warning indicator", 0.8, 0.7);
const RATINGS = src("sovereign-ratings", "Sovereign credit ratings", "S&P Global Ratings, Moody's, Fitch", "https://www.fitchratings.com/", 3, "Ratings and outlooks on U.S. Treasury debt", "Agency committees; published rationales", 0.7, 0.6);
const PWBM = src("pwbm", "Penn Wharton Budget Model", "University of Pennsylvania", "https://budgetmodel.wharton.upenn.edu/", 30, "Dynamic effects of legislation on debt, GDP and wages", "Overlapping-generations model", 0.8, 0.6);
const CASE_SHILLER = src("sp-case-shiller", "S&P CoreLogic Case-Shiller Home Price Indices", "S&P Dow Jones Indices", "https://www.spglobal.com/spdji/en/index-family/indicators/sp-corelogic-case-shiller/", 1, "Repeat-sales home price indexes, national and 20 metros, monthly", "Repeat-sales method on recorded transactions", 0.9, 0.85);
const FHFA = src("fhfa-hpi", "House Price Index", "Federal Housing Finance Agency", "https://www.fhfa.gov/data/hpi", 1, "Repeat-sales price indexes down to the zip code", "Fannie Mae and Freddie Mac loan records", 0.9, 0.85);
const CENSUS_HVS = src("census-hvs", "Housing Vacancies and Homeownership (CPS/HVS)", "U.S. Census Bureau", "https://www.census.gov/housing/hvs/", 1, "Homeownership rates by age of householder, quarterly, since 1982 for age groups", "Current Population Survey supplement", 0.95, 0.9);
const CENSUS_HVS_HIST = src("census-hvs-hist", "HVS historical tables (Table 19: by age)", "U.S. Census Bureau", "https://www.census.gov/housing/hvs/data/histtabs.html", 1, "The under-35 homeownership rate back to 1982", "Published table; read by the AI council with the verbatim-quote guard", 0.95, 0.9);
const NAR = src("nar-profile", "Profile of Home Buyers and Sellers", "National Association of Realtors", "https://www.nar.realtor/research-and-statistics/research-reports/highlights-from-the-profile-of-home-buyers-and-sellers", 1, "Median age of first-time buyers; first-time buyer share of purchases", "Annual survey of recent buyers", 0.75, 0.7);
const JCHS = src("jchs", "The State of the Nation's Housing", "Harvard Joint Center for Housing Studies", "https://www.jchs.harvard.edu/", 1, "Affordability, cost burdens and young-household formation", "Annual synthesis of federal data", 0.85, 0.75);
const FREDDIE = src("freddie-pmms", "Primary Mortgage Market Survey", "Freddie Mac", "https://www.freddiemac.com/pmms", 1, "The 30-year fixed mortgage rate, weekly since 1971", "Lender survey", 0.95, 0.9);
const FED_SCF = src("fed-scf", "Survey of Consumer Finances", "Federal Reserve Board", "https://www.federalreserve.gov/econres/scfindex.htm", 3, "Wealth, homeownership and debt by age cohort", "Triennial household survey", 0.9, 0.8);
const URBAN = src("urban-hfpc", "Housing Finance Policy Center", "Urban Institute", "https://www.urban.org/policy-centers/housing-finance-policy-center", 1, "Monthly chartbook on credit availability and first-time buyers", "Analysis of federal and industry data", 0.75, 0.7);
const ZILLOW = src("zillow-research", "Zillow Research", "Zillow", "https://www.zillow.com/research/", 1, "Home values, rents, and affordability by metro", "Proprietary index of listings and transactions", 0.7, 0.65);
const NFIB = src("nfib-sbet", "Small Business Economic Trends", "NFIB Research Center", "https://www.nfib.com/surveys/small-business-economic-trends/", 1, "Credit conditions reported by small businesses, monthly", "Member survey", 0.7, 0.65);
const FED_SBCS = src("fed-sbcs", "Small Business Credit Survey", "Federal Reserve Banks", "https://www.fedsmallbusiness.org/", 1, "Application and approval rates for small-firm credit", "Annual survey across the twelve Reserve Banks", 0.8, 0.7);
const CHI_NFCI = src("chicago-nfci", "National Financial Conditions Index", "Federal Reserve Bank of Chicago", "https://www.chicagofed.org/research/data/nfci/current-data", 1, "Weekly index of money, debt and equity market conditions", "105 indicators, weekly", 0.85, 0.8);
const MBA_MCAI = src("mba-mcai", "Mortgage Credit Availability Index", "Mortgage Bankers Association", "https://www.mba.org/", 1, "Monthly index of mortgage underwriting standards", "Lender program data", 0.75, 0.7);
const ICE_HY = src("ice-bofa-hy", "ICE BofA US High Yield Index option-adjusted spread", "ICE Data Indices", "https://fred.stlouisfed.org/series/BAMLH0A0HYM2", 1, "The premium the riskiest corporate borrowers pay over Treasuries, daily", "Bond index arithmetic", 0.9, 0.85);
const BEIGE = src("fed-beige", "Beige Book", "Federal Reserve Board", "https://www.federalreserve.gov/monetarypolicy/beigebook", 1, "Anecdotal lending and business conditions by district, eight times a year", "Interviews by the twelve Reserve Banks", 0.7, 0.6);
const CLEVELAND = src("cleveland-nowcast", "Inflation Nowcasting and Expectations", "Federal Reserve Bank of Cleveland", "https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting", 1, "Daily nowcast of the current month's CPI; expected inflation 1–30 years out", "Model on daily oil, gas and index data; expectations model", 0.85, 0.75);
const SPF = src("phil-spf", "Survey of Professional Forecasters", "Federal Reserve Bank of Philadelphia", "https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/survey-of-professional-forecasters", 10, "Quarterly consensus for inflation, including a 10-year average", "Panel of professional forecasters since 1968", 0.85, 0.75);
const MICHIGAN = src("umich-sca", "Surveys of Consumers", "University of Michigan", "https://data.sca.isr.umich.edu/", 5, "Households' one-year and five-year inflation expectations", "Monthly telephone/web survey", 0.8, 0.7);
const NYFED_SCE = src("nyfed-sce", "Survey of Consumer Expectations", "Federal Reserve Bank of New York", "https://www.newyorkfed.org/microeconomics/sce", 3, "Households' one- and three-year inflation expectations", "Rotating monthly panel of ~1,300 households", 0.85, 0.75);
const TIPS = src("tips-breakeven", "Treasury breakeven inflation rates", "U.S. Treasury market via the Federal Reserve", "https://fred.stlouisfed.org/series/T10YIE", 10, "What bond investors are paying for 5- and 10-year inflation protection, daily", "Nominal minus TIPS yields", 0.85, 0.8);
const ATL_STICKY = src("atlanta-sticky", "Sticky-Price CPI", "Federal Reserve Bank of Atlanta", "https://www.atlantafed.org/research/inflationproject/stickyprice", 1, "Inflation in the prices that change rarely", "CPI components sorted by frequency of change", 0.8, 0.75);
const BLS_PPI = src("bls-ppi", "Producer Price Index", "Bureau of Labor Statistics", "https://www.bls.gov/ppi/", 1, "Prices received by producers, a leading read on consumer prices", "Monthly survey of producers", 0.9, 0.8);
const CENSUS_RETAIL = src("census-marts", "Monthly Retail Trade", "U.S. Census Bureau", "https://www.census.gov/retail/", 1, "Motor vehicle and parts dealer sales, monthly", "Survey of retail firms", 0.9, 0.85);
const FED_G17 = src("fed-g17", "G.17 Industrial Production", "Federal Reserve Board", "https://www.federalreserve.gov/releases/g17/", 1, "Motor vehicle assemblies, monthly", "Production indexes", 0.9, 0.85);
const COX = src("cox-manheim", "Manheim Used Vehicle Value Index", "Cox Automotive", "https://www.coxautoinc.com/", 1, "Wholesale used-vehicle prices, monthly", "Auction transaction data", 0.75, 0.7);
const NADA = src("nada", "NADA Data", "National Automobile Dealers Association", "https://www.nada.org/", 1, "Dealer sales, financing and inventory", "Member reporting", 0.7, 0.65);
const EDMUNDS = src("edmunds", "Edmunds industry reports", "Edmunds", "https://www.edmunds.com/industry/", 1, "Transaction prices, incentives, loan terms", "Dealer transaction data", 0.65, 0.6);
const JDPOWER = src("jdpower", "J.D. Power sales forecasts", "J.D. Power", "https://www.jdpower.com/", 1, "Monthly retail sales pace and transaction prices", "Dealer data and forecasts", 0.65, 0.6);
const FHWA = src("fhwa-tvt", "Traffic Volume Trends", "Federal Highway Administration", "https://www.fhwa.dot.gov/policyinformation/travel_monitoring/tvt.cfm", 1, "Vehicle miles travelled on all roads, monthly", "~5,000 continuous traffic counters", 0.9, 0.85);
const BTS_T100 = src("bts-t100", "T-100 Market and Segment data", "Bureau of Transportation Statistics", "https://www.transtats.bts.gov/", 1, "Every scheduled flight's passengers, domestic and international, monthly", "Mandatory carrier reports", 0.95, 0.9);
const BTS_AIR = src("bts-air-traffic", "Air Traffic monthly releases", "Bureau of Transportation Statistics", "https://www.bts.gov/", 1, "System, domestic and international passenger counts and revenue passenger miles", "Carrier reports", 0.95, 0.9);
const TSA = src("tsa-throughput", "TSA checkpoint travel numbers", "Transportation Security Administration", "https://www.tsa.gov/travel/passenger-volumes", 1, "Passengers screened, daily, since 2019", "Checkpoint counts", 0.95, 0.9);
const NTTO_I94 = src("ntto-i94", "I-94 international arrivals", "National Travel and Tourism Office", "https://www.trade.gov/i-94-arrivals-program", 1, "Overseas visitor arrivals to the U.S., monthly", "DHS arrival records", 0.9, 0.85);
const NTTO_I92 = src("ntto-i92", "U.S. International Air Travel Statistics (I-92)", "National Travel and Tourism Office", "https://www.trade.gov/us-international-air-travel-statistics-i-92-data", 1, "U.S. citizen air departures abroad, monthly", "APIS manifests", 0.9, 0.85);
const AMTRAK = src("amtrak", "Amtrak ridership reports", "Amtrak", "https://www.amtrak.com/about-amtrak/reports-documents.html", 1, "Ridership and revenue by route", "Operator reporting", 0.8, 0.75);
const A4A = src("a4a", "Airlines for America data", "Airlines for America", "https://www.airlines.org/dataset/", 1, "Industry traffic, capacity and fares", "Member carrier data", 0.7, 0.65);
const STR_HOTEL = src("str-hotels", "U.S. hotel performance", "STR / CoStar", "https://str.com/", 1, "Occupancy, rate and revenue per room, weekly", "Hotel reporting panel", 0.75, 0.7);
const USTA = src("ustravel", "Travel Forecast", "U.S. Travel Association", "https://www.ustravel.org/research", 3, "Domestic and international trip forecasts", "Association model on federal data", 0.65, 0.6);
const BEA_TTSA = src("bea-ttsa", "Travel and Tourism Satellite Account", "Bureau of Economic Analysis", "https://www.bea.gov/data/special-topics/travel-and-tourism", 1, "Real tourism output and employment, quarterly", "Satellite account of the national accounts", 0.9, 0.8);

export const FORCES: ForceDef[] = [
  {
    id: "prices",
    title: "Prices",
    question: "What has a dollar bought over 40 years, and what does the market expect next?",
    series: [
      { id: "CPIAUCSL", label: "All-items CPI-U", unit: "index", kind: "growth", publisher: "BLS via FRED" },
      { id: "CPILFESL", label: "Core CPI (less food and energy)", unit: "index", kind: "growth", publisher: "BLS via FRED" },
      { id: "T10YIE", label: "10-year breakeven inflation", unit: "% a year", kind: "points", publisher: "Federal Reserve via FRED" },
    ],
    sources: [BLS_CPI, BEA, CLEVELAND, FED_FOMC, SPF, MICHIGAN, NYFED_SCE, TIPS, CBO, IMF_WEO, ATL_STICKY, BLS_PPI],
    caveat: "The 40-year panel is the record, not a forecast. The expectations sources disagree with each other by design; the weights say whose record has been steadier, nothing more.",
  },
  {
    id: "fiat",
    title: "The money itself",
    question: "How fast has the money supply grown against prices, homes and the federal debt?",
    series: [
      { id: "M2SL", label: "M2 money stock", unit: "$ billions", kind: "growth", publisher: "Federal Reserve H.6 via FRED" },
      { id: "WALCL", label: "Federal Reserve total assets", unit: "$ millions", kind: "growth", publisher: "Federal Reserve H.4.1 via FRED" },
      { id: "GFDEBTN", label: "Total public debt", unit: "$ millions", kind: "growth", publisher: "Treasury via FRED" },
      { id: "CSUSHPINSA", label: "Case-Shiller national home price index", unit: "index", kind: "growth", publisher: "S&P DJI via FRED" },
      { id: "CPIAUCSL", label: "All-items CPI-U", unit: "index", kind: "growth", publisher: "BLS via FRED" },
    ],
    sources: [FED_H6, FED_H41, TREASURY_FD, TREASURY_TIC, CBO, GAO, FED_FSR, IMF_FM, BIS, CASE_SHILLER, RATINGS, PWBM],
    caveat: "Money growth, price growth and asset growth are shown side by side as a record. The platform does not assert that one causes the other; the reader can see the gaps.",
  },
  {
    id: "home",
    title: "The house",
    question: "What are a young worker's odds of owning a home, and how have they moved?",
    series: [
      { id: "RHORUSQ156N", label: "Homeownership rate, all households", unit: "%", kind: "points", publisher: "Census HVS via FRED" },
      { id: "MSPUS", label: "Median sales price of houses sold", unit: "$", kind: "growth", publisher: "Census/HUD via FRED" },
      { id: "MEHOINUSA672N", label: "Real median household income", unit: "$ (2023 dollars)", kind: "growth", publisher: "Census via FRED" },
      { id: "MORTGAGE30US", label: "30-year fixed mortgage rate", unit: "%", kind: "points", publisher: "Freddie Mac via FRED" },
      { id: "CSUSHPINSA", label: "Case-Shiller national home price index", unit: "index", kind: "growth", publisher: "S&P DJI via FRED" },
    ],
    sources: [CENSUS_HVS, CENSUS_HVS_HIST, NAR, JCHS, FREDDIE, FHFA, CASE_SHILLER, ZILLOW, NYFED_HHDC, FED_SCF, URBAN, BLS_CPI],
    caveat: "The under-35 ownership rate itself is published by the Census Bureau in HVS Table 19 and is read through the harvest path with the verbatim-quote guard; until an approved reading exists, the page shows the all-household rate and the price-to-income record, and says so.",
  },
  {
    id: "credit",
    title: "Credit",
    question: "How freely are banks lending, and what has the Fed's rate done to it?",
    series: [
      { id: "FEDFUNDS", label: "Effective federal funds rate", unit: "%", kind: "points", publisher: "Federal Reserve H.15 via FRED" },
      { id: "DRTSCILM", label: "Banks tightening standards, C&I loans to large and mid-size firms (net %)", unit: "net % of banks", kind: "points", publisher: "Federal Reserve SLOOS via FRED" },
      { id: "TOTLL", label: "Loans and leases in bank credit, all commercial banks", unit: "$ billions", kind: "growth", publisher: "Federal Reserve H.8 via FRED" },
      { id: "NFCI", label: "Chicago Fed National Financial Conditions Index", unit: "index (0 = average)", kind: "points", publisher: "Chicago Fed via FRED" },
      { id: "BAMLH0A0HYM2", label: "High-yield bond spread over Treasuries", unit: "%", kind: "points", publisher: "ICE BofA via FRED" },
    ],
    sources: [FED_SLOOS, FED_H8, FED_H15, FED_FOMC, NYFED_HHDC, FED_G19, NFIB, FED_SBCS, CHI_NFCI, MBA_MCAI, ICE_HY, BEIGE],
    caveat: "Standards and the policy rate are read together so the reader sees whether lending loosened or tightened after each move. The survey is a share of banks, not a volume; the H.8 line is the volume.",
  },
  {
    id: "debt",
    title: "The federal balance sheet",
    question: "How much is owed, who holds it, and what do the default and stress gauges read?",
    series: [
      { id: "GFDEGDQ188S", label: "Federal debt as a share of GDP", unit: "% of GDP", kind: "points", publisher: "Treasury/BEA via FRED" },
      { id: "FDHBFIN", label: "Federal debt held by foreign and international investors", unit: "$ millions", kind: "growth", publisher: "Treasury via FRED" },
      { id: "GFDEBTN", label: "Total public debt", unit: "$ millions", kind: "growth", publisher: "Treasury via FRED" },
      { id: "T10Y2Y", label: "10-year minus 2-year Treasury yield", unit: "% points", kind: "points", publisher: "Federal Reserve via FRED" },
      { id: "BAMLH0A0HYM2", label: "High-yield bond spread over Treasuries", unit: "%", kind: "points", publisher: "ICE BofA via FRED" },
    ],
    sources: [TREASURY_FD, CBO, GAO, TREASURY_TIC, FED_H41, ICE_HY, FED_H15, FED_FSR, IMF_FM, RATINGS, TREASURY_QR, PWBM],
    caveat: "A rising debt share and a falling foreign share are facts of the record. Whether they end in higher taxes, inflation or neither is the question the tax trajectory and the prices force take up; this panel does not decide it.",
  },
  {
    id: "cars",
    title: "Cars",
    question: "How many vehicles is the country buying, and what do they cost?",
    series: [
      { id: "TOTALSA", label: "Total vehicle sales, annual rate", unit: "millions of units (SAAR)", kind: "growth", publisher: "BEA via FRED" },
      { id: "ALTSALES", label: "Light-weight vehicle sales: autos and light trucks", unit: "millions of units (SAAR)", kind: "growth", publisher: "BEA via FRED" },
      { id: "CUSR0000SETA01", label: "CPI: new vehicles", unit: "index", kind: "growth", publisher: "BLS via FRED" },
      { id: "CUSR0000SETA02", label: "CPI: used cars and trucks", unit: "index", kind: "growth", publisher: "BLS via FRED" },
    ],
    sources: [BEA, CENSUS_RETAIL, FED_G17, FED_G19, NYFED_HHDC, BLS_CPI, COX, NADA, EDMUNDS, JDPOWER, FHWA, FED_SLOOS],
    caveat: "Unit sales are a seasonally adjusted annual rate, so one month's figure is the pace, not the count. Prices are the BLS indexes, not dealer averages.",
  },
  {
    id: "travel",
    title: "Travel",
    question: "How often are Americans moving about, at home and abroad?",
    series: [
      { id: "TRFVOLUSM227NFWA", label: "Vehicle miles travelled, all roads", unit: "millions of miles a month", kind: "growth", publisher: "FHWA via FRED" },
      { id: "AIRRPMTSI", label: "Air revenue passenger miles", unit: "millions", kind: "growth", publisher: "BTS via FRED", candidate: true },
      { id: "CUSR0000SETG01", label: "CPI: airline fares", unit: "index", kind: "growth", publisher: "BLS via FRED" },
    ],
    sources: [BTS_T100, BTS_AIR, TSA, NTTO_I94, NTTO_I92, FHWA, AMTRAK, A4A, STR_HOTEL, USTA, BEA_TTSA, BLS_CPI],
    caveat: "International frequency (I-94 arrivals and I-92 departures) is published by NTTO as tables, not a feed, and comes in through the harvest path. The road and air lines above are the live feeds.",
  },
];

export type SeriesReading = {
  id: string; label: string; unit: string; kind: SeriesKind; publisher: string;
  latest: Observation | null;
  /** growth → annualised rate; points → change in the value. Keyed by horizon years. */
  change: Partial<Record<Horizon, number>>;
  /** One observation per calendar year (the last of each), for the 40-year line. */
  annual: Observation[];
  source: "live" | "cached" | "unavailable";
  candidate: boolean;
};
export type ForceReading = {
  id: ForceId; title: string; question: string; caveat: string;
  series: SeriesReading[];
  sources: Array<SourceDef & { weight: number }>;
};

export function annualised(then: number, now: number, years: number): number {
  if (then <= 0 || now <= 0 || years <= 0) return NaN;
  return Math.pow(now / then, 1 / years) - 1;
}

function observationYearsBefore(obs: Observation[], latest: Observation, years: number): Observation | null {
  const [y, m] = latest.date.split("-").map(Number);
  const wantYear = y! - years;
  const prefix = `${wantYear}-${String(m).padStart(2, "0")}`;
  const same = obs.find((o) => o.date.startsWith(prefix));
  if (same) return same;
  // quarterly / annual series: nearest observation in that year
  const inYear = obs.filter((o) => o.date.startsWith(`${wantYear}-`));
  if (!inYear.length) return null;
  return inYear.reduce((best, o) => (Math.abs(Number(o.date.slice(5, 7)) - m!) < Math.abs(Number(best.date.slice(5, 7)) - m!) ? o : best));
}

/** Pure: a reading from observations (oldest first). */
export function readSeries(def: SeriesDef, obs: Observation[], source: SeriesReading["source"] = "live"): SeriesReading {
  const latest = obs[obs.length - 1] ?? null;
  const change: SeriesReading["change"] = {};
  if (latest) {
    for (const h of HORIZONS) {
      const then = observationYearsBefore(obs, latest, h);
      if (!then) continue;
      const v = def.kind === "growth" ? annualised(then.value, latest.value, h) : latest.value - then.value;
      if (Number.isFinite(v)) change[h] = Math.round(v * 1e6) / 1e6;
    }
  }
  const byYear = new Map<string, Observation>();
  for (const o of obs) byYear.set(o.date.slice(0, 4), o);
  const annual = Array.from(byYear.values()).slice(-41);
  return { id: def.id, label: def.label, unit: def.unit, kind: def.kind, publisher: def.publisher, latest, change, annual, source: latest ? source : "unavailable", candidate: !!def.candidate };
}

export function weightedSources(force: ForceDef): ForceReading["sources"] {
  return force.sources.map((s) => ({ ...s, weight: sourceWeight(s.defaults.evidence, s.defaults.trackRecord, s.defaults.consistency) }));
}

const TTL = 6 * 60 * 60 * 1000;
const memo: Record<string, { at: number; obs: Observation[] }> = {};
export function _clearOutsideMemoForTests() { for (const k of Object.keys(memo)) delete memo[k]; }

export type FetchSeries = (id: string, start: string) => Promise<Observation[]>;

async function loadSeries(def: SeriesDef, fetchSeries: FetchSeries): Promise<SeriesReading> {
  const now = Date.now();
  const m = memo[def.id];
  if (m && now - m.at < TTL) return readSeries(def, m.obs, "cached");
  try {
    const start = `${new Date().getFullYear() - 41}-01-01`;
    const obs = await fetchSeries(def.id, start);
    if (obs.length) {
      memo[def.id] = { at: now, obs };
      const r = readSeries(def, obs, "live");
      const latest = r.latest!;
      await upsertMarketPoint({ series: `of:${def.id}:latest`, value: latest.value, asOf: latest.date, source: "fred" }).catch(() => undefined);
      for (const [h, v] of Object.entries(r.change)) await upsertMarketPoint({ series: `of:${def.id}:${h}Y`, value: v, asOf: latest.date, source: "fred" }).catch(() => undefined);
      return r;
    }
  } catch (e) { console.warn("[outside]", def.id, String(e).slice(0, 120)); }
  // last-good snapshot: the latest value and the changes, no annual line
  const keys = [`of:${def.id}:latest`, ...HORIZONS.map((h) => `of:${def.id}:${h}Y`)];
  const stored = await getMarketPoints(keys).catch(() => []);
  const latestRow = stored.find((p) => p.series.endsWith(":latest"));
  if (latestRow) {
    const change: SeriesReading["change"] = {};
    for (const p of stored) { const h = Number(p.series.split(":")[2]?.replace("Y", "")); if (HORIZONS.includes(h as Horizon)) change[h as Horizon] = p.value; }
    return { id: def.id, label: def.label, unit: def.unit, kind: def.kind, publisher: def.publisher, latest: { date: latestRow.asOf, value: latestRow.value }, change, annual: [], source: "cached", candidate: !!def.candidate };
  }
  return { id: def.id, label: def.label, unit: def.unit, kind: def.kind, publisher: def.publisher, latest: null, change: {}, annual: [], source: "unavailable", candidate: !!def.candidate };
}

export async function readForce(force: ForceDef, fetchSeries: FetchSeries = (id, start) => fetchFredObservationsSince(id, start)): Promise<ForceReading> {
  const series = await Promise.all(force.series.map((s) => loadSeries(s, fetchSeries)));
  return { id: force.id, title: force.title, question: force.question, caveat: force.caveat, series, sources: weightedSources(force) };
}

export async function readAllForces(fetchSeries?: FetchSeries): Promise<ForceReading[]> {
  return Promise.all(FORCES.map((f) => readForce(f, fetchSeries)));
}

/** Public, no client data: which feeds answered and when. */
export async function outsideStatus(fetchSeries?: FetchSeries): Promise<{ mode: string; forces: Array<{ id: ForceId; answered: number; of: number; series: Array<{ id: string; source: string; asOf: string | null }> }> }> {
  const all = await readAllForces(fetchSeries);
  return {
    mode: fredMode(),
    forces: all.map((f) => ({ id: f.id, answered: f.series.filter((s) => s.source !== "unavailable").length, of: f.series.length, series: f.series.map((s) => ({ id: s.id, source: s.source, asOf: s.latest?.date ?? null })) })),
  };
}
