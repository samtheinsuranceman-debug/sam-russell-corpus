/**
 * Ibbotson Model Utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Based on Roger Ibbotson's foundational research (Stocks, Bonds, Bills, and
 * Inflation — SBBI) tracking S&P 500 annual returns since 1926.
 *
 * This utility provides:
 *   • Historical S&P 500 annual returns (1929–2025)
 *   • IUL crediting engine with configurable cap / floor / participation rate
 *   • Year-range selector with default start year of 2005
 *   • Compound growth projections using actual historical index data
 *
 * Default parameters:
 *   Cap Rate:           7.5% (an assumed rate; AG 49-A sets each carrier's illustrated maximum by formula)
 *   Floor Rate:         0%   (standard IUL floor)
 *   Participation Rate: 100%
 *   Default Start Year: 2005
 *
 * IMPORTANT: All projections are research-based estimates derived from
 * historical data. They are NOT guaranteed production increases. Past
 * performance does not guarantee future results.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── S&P 500 Annual Returns (1929–2025) ────────────────────────────────────
// Total return, dividends reinvested, as a decimal.
// Source, checked 23 Sep 2026 against recent years: these are S&P Dow Jones
// Indices' published S&P 500 total returns (2008 −37.00%, 2022 −18.11%,
// 2023 +26.29%, 2024 +25.02%), with the early years matching the Ibbotson SBBI
// large-company stock series (the S&P composite before the S&P 500 existed in
// 1957). They are NOT Damodaran's histretSP series, which differs by 0.1–0.5
// points a year (e.g. 2008 −36.55%, 2022 −18.04%, 2023 +26.06%, 2024 +24.88%;
// https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html).
// The earlier "NYU Stern / Damodaran" label was inaccurate.
export const SP500_ANNUAL_RETURNS: Record<number, number> = {
  1929: -0.0842,
  1930: -0.2490,
  1931: -0.4334,
  1932: -0.0819,
  1933:  0.5399,
  1934: -0.0144,
  1935:  0.4767,
  1936:  0.3392,
  1937: -0.3503,
  1938:  0.3112,
  1939: -0.0041,
  1940: -0.0978,
  1941: -0.1159,
  1942:  0.2034,
  1943:  0.2590,
  1944:  0.1975,
  1945:  0.3644,
  1946: -0.0807,
  1947:  0.0571,
  1948:  0.0550,
  1949:  0.1879,
  1950:  0.3171,
  1951:  0.2402,
  1952:  0.1837,
  1953: -0.0099,
  1954:  0.5262,
  1955:  0.3156,
  1956:  0.0656,
  1957: -0.1078,
  1958:  0.4336,
  1959:  0.1196,
  1960:  0.0047,
  1961:  0.2689,
  1962: -0.0873,
  1963:  0.2280,
  1964:  0.1648,
  1965:  0.1245,
  1966: -0.1006,
  1967:  0.2398,
  1968:  0.1106,
  1969: -0.0850,
  1970:  0.0401,
  1971:  0.1431,
  1972:  0.1898,
  1973: -0.1466,
  1974: -0.2647,
  1975:  0.3720,
  1976:  0.2384,
  1977: -0.0718,
  1978:  0.0656,
  1979:  0.1844,
  1980:  0.3242,
  1981: -0.0491,
  1982:  0.2141,
  1983:  0.2251,
  1984:  0.0627,
  1985:  0.3216,
  1986:  0.1847,
  1987:  0.0581,
  1988:  0.1654,
  1989:  0.3148,
  1990: -0.0306,
  1991:  0.3023,
  1992:  0.0762,
  1993:  0.0999,
  1994:  0.0132,
  1995:  0.3743,
  1996:  0.2294,
  1997:  0.3336,
  1998:  0.2858,
  1999:  0.2104,
  2000: -0.0910,
  2001: -0.1189,
  2002: -0.2210,
  2003:  0.2889,
  2004:  0.1088,
  2005:  0.0491,
  2006:  0.1579,
  2007:  0.0549,
  2008: -0.3700,
  2009:  0.2646,
  2010:  0.1506,
  2011:  0.0211,
  2012:  0.1600,
  2013:  0.3239,
  2014:  0.1369,
  2015:  0.0138,
  2016:  0.1196,
  2017:  0.2183,
  2018: -0.0438,
  2019:  0.3149,
  2020:  0.1840,
  2021:  0.2871,
  2022: -0.1811,
  2023:  0.2629,
  2024:  0.2502,
  // 2025 full year: price +16.39% (5,881.63 → 6,845.50), total return +17.88% — S&P Dow Jones Indices,
  // "U.S. Equities Market Attributes December 2025",
  // https://www.spglobal.com/spdji/en/commentary/article/us-equities-market-attributes/ (read 23 Sep 2026).
  // Damodaran's histretSP reports 17.72% for the same year. Was 0.0200 marked "YTD estimate".
  2025:  0.1788,
};

// ─── Available Years ────────────────────────────────────────────────────────
export const IBBOTSON_START_YEAR = 1929;
export const IBBOTSON_END_YEAR = 2025;
export const IBBOTSON_DEFAULT_START_YEAR = 2005;

export function getAvailableYears(): number[] {
  return Object.keys(SP500_ANNUAL_RETURNS).map(Number).sort((a, b) => a - b);
}

// ─── IUL Crediting Engine ───────────────────────────────────────────────────

export interface IbbotsonConfig {
  /** Annual cap rate (decimal, e.g. 0.075 for 7.5%). Default: 0.075 */
  capRate?: number;
  /** Annual floor rate (decimal, e.g. 0.0 for 0%). Default: 0.0 */
  floorRate?: number;
  /** Participation rate (decimal, e.g. 1.0 for 100%). Default: 1.0 */
  participationRate?: number;
  /** Start year for the projection. Default: 2005 */
  startYear?: number;
  /** End year for the projection. Default: latest available */
  endYear?: number;
}

export interface IbbotsonYearResult {
  year: number;
  sp500Return: number;
  creditedRate: number;
  cumulativeGrowthFactor: number;
  /** Cumulative return as percentage (e.g. 45.2 means +45.2%) */
  cumulativeReturnPct: number;
}

/**
 * Calculate the IUL credited rate for a given raw S&P 500 return.
 */
export function calculateCreditedRate(
  rawReturn: number,
  capRate: number = 0.075,
  floorRate: number = 0.0,
  participationRate: number = 1.0
): number {
  if (rawReturn <= 0) return floorRate;
  const adjusted = rawReturn * participationRate;
  return Math.min(adjusted, capRate);
}

/**
 * Run the Ibbotson model over a range of years, returning year-by-year
 * credited rates and cumulative growth.
 */
export function runIbbotsonModel(config: IbbotsonConfig = {}): IbbotsonYearResult[] {
  const {
    capRate = 0.075,
    floorRate = 0.0,
    participationRate = 1.0,
    startYear = IBBOTSON_DEFAULT_START_YEAR,
    endYear = IBBOTSON_END_YEAR,
  } = config;

  const results: IbbotsonYearResult[] = [];
  let cumulativeGrowthFactor = 1.0;

  for (let year = startYear; year <= endYear; year++) {
    const sp500Return = SP500_ANNUAL_RETURNS[year];
    if (sp500Return === undefined) continue;

    const creditedRate = calculateCreditedRate(sp500Return, capRate, floorRate, participationRate);
    cumulativeGrowthFactor *= (1 + creditedRate);

    results.push({
      year,
      sp500Return,
      creditedRate,
      cumulativeGrowthFactor,
      cumulativeReturnPct: (cumulativeGrowthFactor - 1) * 100,
    });
  }

  return results;
}

/**
 * Calculate the average annual credited rate over a range of years.
 */
export function getAverageAnnualCreditedRate(config: IbbotsonConfig = {}): number {
  const results = runIbbotsonModel(config);
  if (results.length === 0) return 0;
  const totalCredited = results.reduce((sum, r) => sum + r.creditedRate, 0);
  return totalCredited / results.length;
}

/**
 * Calculate the compound annual growth rate (CAGR) over a range of years.
 */
export function getIbbotsonCAGR(config: IbbotsonConfig = {}): number {
  const results = runIbbotsonModel(config);
  if (results.length === 0) return 0;
  const finalGrowthFactor = results[results.length - 1].cumulativeGrowthFactor;
  return Math.pow(finalGrowthFactor, 1 / results.length) - 1;
}

// ─── IUL Cash Value Projection Using Ibbotson Data ─────────────────────────

export interface IbbotsonCashValueConfig extends IbbotsonConfig {
  /** Annual premium amount */
  annualPremium: number;
  /** Number of years to pay premiums (0 = pay every year) */
  premiumYears?: number;
  /** Load fee as decimal (e.g. 0.06 for 6%) */
  loadFee?: number;
  /** Cost of insurance rate as decimal (e.g. 0.008 for 0.8%) */
  coiRate?: number;
  /** Policy loan rate as decimal (e.g. 0.05 for 5%) */
  loanRate?: number;
  /** Surrender charge schedule (array of rates by year, e.g. [0.10, 0.09, ...]) */
  surrenderSchedule?: number[];
}

export interface IbbotsonCashValueYear {
  year: number;
  calendarYear: number;
  sp500Return: number;
  creditedRate: number;
  premium: number;
  netPremium: number;
  beginningValue: number;
  endingValue: number;
  surrenderValue: number;
  deathBenefit: number;
  cumulativePremiums: number;
}

/**
 * Project IUL cash values using actual Ibbotson historical data
 * instead of a flat assumed rate.
 */
export function projectCashValueWithIbbotson(config: IbbotsonCashValueConfig): IbbotsonCashValueYear[] {
  const {
    annualPremium,
    premiumYears = 0,
    loadFee = 0.06,
    coiRate = 0.008,
    capRate = 0.075,
    floorRate = 0.0,
    participationRate = 1.0,
    startYear = IBBOTSON_DEFAULT_START_YEAR,
    endYear = IBBOTSON_END_YEAR,
    surrenderSchedule = [0.10, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01],
  } = config;

  const results: IbbotsonCashValueYear[] = [];
  let accountValue = 0;
  let cumulativePremiums = 0;
  let policyYear = 0;

  for (let calendarYear = startYear; calendarYear <= endYear; calendarYear++) {
    const sp500Return = SP500_ANNUAL_RETURNS[calendarYear];
    if (sp500Return === undefined) continue;

    policyYear++;
    const payingPremium = premiumYears === 0 || policyYear <= premiumYears;
    const premium = payingPremium ? annualPremium : 0;
    cumulativePremiums += premium;

    const netPremium = premium * (1 - loadFee);
    const beginningValue = accountValue + netPremium;

    // Apply COI
    const afterCOI = beginningValue * (1 - coiRate);

    // Apply credited rate based on Ibbotson data
    const creditedRate = calculateCreditedRate(sp500Return, capRate, floorRate, participationRate);
    const endingValue = afterCOI * (1 + creditedRate);

    // Surrender value
    const surrenderCharge = policyYear <= surrenderSchedule.length
      ? surrenderSchedule[policyYear - 1]
      : 0;
    const surrenderValue = Math.max(0, endingValue * (1 - surrenderCharge));

    // Death benefit (corridor factor based on age — simplified)
    const deathBenefit = Math.max(endingValue * 1.5, annualPremium * 10);

    accountValue = endingValue;

    results.push({
      year: policyYear,
      calendarYear,
      sp500Return,
      creditedRate,
      premium,
      netPremium,
      beginningValue,
      endingValue,
      surrenderValue,
      deathBenefit,
      cumulativePremiums,
    });
  }

  return results;
}

// ─── Summary Statistics ─────────────────────────────────────────────────────

export interface IbbotsonSummary {
  startYear: number;
  endYear: number;
  totalYears: number;
  averageCreditedRate: number;
  cagr: number;
  positiveYears: number;
  zeroYears: number;
  yearsAtCap: number;
  bestCreditedYear: { year: number; rate: number };
  worstSP500Year: { year: number; rate: number };
  sp500CAGR: number;
}

export function getIbbotsonSummary(config: IbbotsonConfig = {}): IbbotsonSummary {
  const results = runIbbotsonModel(config);
  if (results.length === 0) {
    return {
      startYear: config.startYear ?? IBBOTSON_DEFAULT_START_YEAR,
      endYear: config.endYear ?? IBBOTSON_END_YEAR,
      totalYears: 0,
      averageCreditedRate: 0,
      cagr: 0,
      positiveYears: 0,
      zeroYears: 0,
      yearsAtCap: 0,
      bestCreditedYear: { year: 0, rate: 0 },
      worstSP500Year: { year: 0, rate: 0 },
      sp500CAGR: 0,
    };
  }

  const capRate = config.capRate ?? 0.075;
  const floorRate = config.floorRate ?? 0.0;

  const positiveYears = results.filter(r => r.creditedRate > floorRate).length;
  const zeroYears = results.filter(r => r.creditedRate === floorRate).length;
  const yearsAtCap = results.filter(r => r.creditedRate === capRate).length;

  const bestCredited = results.reduce((best, r) => r.creditedRate > best.creditedRate ? r : best, results[0]);
  const worstSP500 = results.reduce((worst, r) => r.sp500Return < worst.sp500Return ? r : worst, results[0]);

  const totalCredited = results.reduce((sum, r) => sum + r.creditedRate, 0);
  const avgCredited = totalCredited / results.length;

  const finalGrowthFactor = results[results.length - 1].cumulativeGrowthFactor;
  const cagr = Math.pow(finalGrowthFactor, 1 / results.length) - 1;

  // S&P 500 CAGR for comparison
  let sp500Growth = 1.0;
  results.forEach(r => { sp500Growth *= (1 + r.sp500Return); });
  const sp500CAGR = Math.pow(sp500Growth, 1 / results.length) - 1;

  return {
    startYear: results[0].year,
    endYear: results[results.length - 1].year,
    totalYears: results.length,
    averageCreditedRate: avgCredited,
    cagr,
    positiveYears,
    zeroYears,
    yearsAtCap,
    bestCreditedYear: { year: bestCredited.year, rate: bestCredited.creditedRate },
    worstSP500Year: { year: worstSP500.year, rate: worstSP500.sp500Return },
    sp500CAGR,
  };
}

// ─── Disclaimer Text ────────────────────────────────────────────────────────

export const IBBOTSON_DISCLAIMER =
  "Projections are based on historical S&P 500 total returns (S&P Dow Jones Indices; " +
  "Ibbotson SBBI large-company stocks for years before the S&P 500) and " +
  "represent research-based estimates only. They are NOT guaranteed production " +
  "increases. Past performance does not guarantee future results. Actual IUL " +
  "policy performance depends on carrier crediting methods, policy charges, " +
  "current cap rates, and other factors. The 7.5% rate is an assumption, not a " +
  "carrier illustration. Consult with a qualified financial " +
  "professional before making any financial decisions.";

export const IBBOTSON_SHORT_DISCLAIMER =
  "Based on historical S&P 500 total returns (S&P Dow Jones Indices / Ibbotson SBBI). Research-based estimates only — not guaranteed. " +
  "Past performance ≠ future results. Assumed crediting rate: 7.5%.";

// ─── Where These Numbers Come From ──────────────────────────────────────────

/**
 * The return table above is the S&P 500 total return (price plus reinvested
 * dividends), calendar years, in the series S&P Dow Jones Indices publishes
 * and the Ibbotson SBBI yearbooks carry back to 1926. It was checked year by
 * year against a public compilation of that series; it is not Damodaran's
 * reconstruction, which differs slightly (-36.55% for 2008 against -37.00%).
 */
export const IBBOTSON_MODEL_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  {
    label: "S&P Dow Jones Indices, S&P 500 total return (the index's publisher; before 1957 the S&P 90 Composite, as carried in Morningstar's Ibbotson SBBI yearbooks)",
    url: "https://www.spglobal.com/spdji/en/indices/equity/sp-500/",
    asOf: "read 2026-09-23",
  },
  {
    label: "Slickcharts, S&P 500 Total Returns by Year Since 1926 (year-by-year compilation of the same series): -8.42% (1929), -24.90% (1930), -43.34% (1931), 52.62% (1954), -37.00% (2008), -18.11% (2022), 26.29% (2023), 25.02% (2024), 17.88% (2025)",
    url: "https://www.slickcharts.com/sp500/returns",
    asOf: "page last verified 2026-09-17; read 2026-09-23",
    note: "SP500_ANNUAL_RETURNS matches this table for the years checked (1929-1931, 1954, 2008, 2022-2024). Its 2025 entry is 2.00%, marked 'YTD estimate'; the full-year 2025 total return is 17.88%. Not changed; flagged for review.",
  },
  { label: "Assumption: the 7.5% cap (the capRate default), 0% floor, 100% participation and 2005 default start year are inputs chosen by the firm; a carrier's current terms and its AG 49-A maximum illustrated rate govern" },
];
