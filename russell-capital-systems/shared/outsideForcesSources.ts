/**
 * Outside Forces — the primary sources behind every series the page reads.
 *
 * server/outsideForces.ts reads its figures live from FRED and caches them in
 * the database, so the app shell cannot import it. This module is the
 * shell-safe half: for each FRED series the engine reads, the publisher and
 * release FRED names on the series page, and the page itself. The shell's
 * source footer loads OUTSIDE_FORCES_SOURCES through shared/engineSources.ts.
 *
 * Every row below was checked against its FRED series page on 23 Sep 2026
 * (the "Notes → Source / Release" block). server/outsideForces.test.ts asserts
 * that every series in FORCES has a row here, so the two cannot drift apart.
 *
 * The values themselves are never stored here: the page reads them live and
 * prints each one with its own as-of date.
 */

export type OutsideForcesSeriesSource = {
  /** FRED series id, as the engine requests it. */
  seriesId: string;
  /** Series title as FRED publishes it. */
  title: string;
  /** Publisher FRED names as the source. */
  publisher: string;
  /** Release FRED names for the series. */
  release: string;
  /** Publisher's release page, where FRED links one. */
  releaseUrl?: string;
};

export const OUTSIDE_FORCES_VERIFIED_ON = "2026-09-23";

const BLS_CPI = { publisher: "U.S. Bureau of Labor Statistics", release: "Consumer Price Index", releaseUrl: "https://www.bls.gov/cpi/" };
const FRB_H15_SPREADS = { publisher: "Federal Reserve Bank of St. Louis", release: "Interest Rate Spreads" };
const TREASURY_BULLETIN = { publisher: "U.S. Department of the Treasury, Fiscal Service", release: "Treasury Bulletin", releaseUrl: "https://fiscal.treasury.gov/reports-statements/treasury-bulletin/" };
const BEA_MOTOR_VEHICLES = { publisher: "U.S. Bureau of Economic Analysis", release: "Supplemental Estimates, Motor Vehicles", releaseUrl: "https://www.bea.gov/data/gdp/gross-domestic-product" };

export const OUTSIDE_FORCES_SERIES_SOURCES: readonly OutsideForcesSeriesSource[] = [
  { seriesId: "CPIAUCSL", title: "Consumer Price Index for All Urban Consumers: All Items in U.S. City Average", ...BLS_CPI },
  { seriesId: "CPILFESL", title: "Consumer Price Index for All Urban Consumers: All Items Less Food and Energy in U.S. City Average", ...BLS_CPI },
  { seriesId: "T10YIE", title: "10-Year Breakeven Inflation Rate", ...FRB_H15_SPREADS },
  { seriesId: "M2SL", title: "M2", publisher: "Board of Governors of the Federal Reserve System", release: "H.6 Money Stock Measures", releaseUrl: "https://www.federalreserve.gov/releases/h6/" },
  { seriesId: "WALCL", title: "Assets: Total Assets: Total Assets (Less Eliminations from Consolidation): Wednesday Level", publisher: "Board of Governors of the Federal Reserve System", release: "H.4.1 Factors Affecting Reserve Balances", releaseUrl: "https://www.federalreserve.gov/releases/h41/" },
  { seriesId: "GFDEBTN", title: "Federal Debt: Total Public Debt", ...TREASURY_BULLETIN },
  { seriesId: "CSUSHPINSA", title: "S&P Cotality Case-Shiller U.S. National Home Price Index", publisher: "S&P Dow Jones Indices LLC", release: "S&P Cotality Case-Shiller Home Price Indices", releaseUrl: "https://www.spglobal.com/spdji/en/index-family/indicators/sp-corelogic-case-shiller/sp-corelogic-case-shiller-composite/" },
  { seriesId: "RHORUSQ156N", title: "Homeownership Rate in the United States", publisher: "U.S. Census Bureau", release: "Housing Vacancies and Homeownership", releaseUrl: "https://www.census.gov/housing/hvs/" },
  { seriesId: "MSPUS", title: "Median Sales Price of New Houses Sold for the United States", publisher: "U.S. Census Bureau and U.S. Department of Housing and Urban Development", release: "New Residential Sales", releaseUrl: "https://www.census.gov/construction/nrs/" },
  { seriesId: "MEHOINUSA672N", title: "Real Median Household Income in the United States", publisher: "U.S. Census Bureau", release: "Income and Poverty in the United States", releaseUrl: "https://www.census.gov/topics/income-poverty.html" },
  { seriesId: "MORTGAGE30US", title: "30-Year Fixed Rate Mortgage Average in the United States", publisher: "Freddie Mac", release: "Primary Mortgage Market Survey", releaseUrl: "https://www.freddiemac.com/pmms" },
  { seriesId: "FEDFUNDS", title: "Federal Funds Effective Rate", publisher: "Board of Governors of the Federal Reserve System", release: "H.15 Selected Interest Rates", releaseUrl: "https://www.federalreserve.gov/releases/h15/" },
  { seriesId: "DRTSCILM", title: "Net Percentage of Domestic Banks Tightening Standards for Commercial and Industrial Loans to Large and Middle-Market Firms", publisher: "Board of Governors of the Federal Reserve System", release: "Senior Loan Officer Opinion Survey on Bank Lending Practices", releaseUrl: "https://www.federalreserve.gov/data/sloos.htm" },
  { seriesId: "TOTLL", title: "Loans and Leases in Bank Credit, All Commercial Banks", publisher: "Board of Governors of the Federal Reserve System", release: "H.8 Assets and Liabilities of Commercial Banks in the United States", releaseUrl: "https://www.federalreserve.gov/releases/h8/" },
  { seriesId: "NFCI", title: "Chicago Fed National Financial Conditions Index", publisher: "Federal Reserve Bank of Chicago", release: "Chicago Fed National Financial Conditions Index", releaseUrl: "https://www.chicagofed.org/publications/nfci/index" },
  { seriesId: "BAMLH0A0HYM2", title: "ICE BofA US High Yield Index Option-Adjusted Spread", publisher: "ICE Data Indices, LLC", release: "ICE BofA Indices", releaseUrl: "https://www.theice.com/market-data/indices" },
  { seriesId: "GFDEGDQ188S", title: "Federal Debt: Total Public Debt as Percent of Gross Domestic Product", publisher: "U.S. Office of Management and Budget and Federal Reserve Bank of St. Louis", release: "Debt to Gross Domestic Product Ratios" },
  { seriesId: "FDHBFIN", title: "Federal Debt Held by Foreign and International Investors", ...TREASURY_BULLETIN },
  { seriesId: "T10Y2Y", title: "10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity", ...FRB_H15_SPREADS },
  { seriesId: "TOTALSA", title: "Total Vehicle Sales", ...BEA_MOTOR_VEHICLES },
  { seriesId: "ALTSALES", title: "Light Weight Vehicle Sales: Autos and Light Trucks", ...BEA_MOTOR_VEHICLES },
  { seriesId: "CUSR0000SETA01", title: "Consumer Price Index for All Urban Consumers: New Vehicles in U.S. City Average", ...BLS_CPI },
  { seriesId: "CUSR0000SETA02", title: "Consumer Price Index for All Urban Consumers: Used Cars and Trucks in U.S. City Average", ...BLS_CPI },
  { seriesId: "TRFVOLUSM227NFWA", title: "Vehicle Miles Traveled", publisher: "U.S. Federal Highway Administration", release: "Traffic Volume Trends", releaseUrl: "https://www.fhwa.dot.gov/policyinformation/travel_monitoring/tvt.cfm" },
  { seriesId: "AIRRPMTSI", title: "Air Revenue Passenger Miles", publisher: "U.S. Bureau of Transportation Statistics", release: "Transportation Services Index and Seasonally-Adjusted Transportation Data", releaseUrl: "https://data.bts.gov/Research-and-Statistics/Transportation-Services-Index-and-Seasonally-Adjus/bw6n-ddqk" },
  { seriesId: "CUSR0000SETG01", title: "Consumer Price Index for All Urban Consumers: Airline Fares in U.S. City Average", ...BLS_CPI },
];

export const fredSeriesUrl = (seriesId: string): string => `https://fred.stlouisfed.org/series/${seriesId}`;

/** The source list the shell prints for /portal/outside-forces: FRED as the carrier, then one line per series naming its publisher and release. */
export const OUTSIDE_FORCES_SOURCES = [
  {
    label: "FRED, Federal Reserve Bank of St. Louis: every series on the page is read live from FRED and printed with its own as-of date",
    url: "https://fred.stlouisfed.org/",
    asOf: `series pages checked ${OUTSIDE_FORCES_VERIFIED_ON}`,
  },
  ...OUTSIDE_FORCES_SERIES_SOURCES.map(s => ({
    label: `${s.title} (${s.seriesId}): ${s.publisher}, ${s.release}`,
    url: fredSeriesUrl(s.seriesId),
    asOf: `verified ${OUTSIDE_FORCES_VERIFIED_ON}`,
    ...(s.releaseUrl ? { note: `Release: ${s.releaseUrl}` } : {}),
  })),
];
