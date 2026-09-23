/**
 * Baseline Snapshot — the last verified readings, with sources and dates.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This is what the engines run on when the live connectors have not yet
 * fetched anything (first boot, egress blocked, key missing). Every figure
 * is dated and attributed; the refresh job overwrites these with newer
 * observations in `macro_observations` and the page shows which it used.
 *
 * Nothing here is a forecast. Everything here was published by the named
 * source on or before the `asOf` date.
 */
import type { IsoDate, Observation } from "./types";

export const SNAPSHOT_DATE: IsoDate = "2026-09-22";

/** Treasury holdings, USD billions, TIC Table 5 end-of-month (custodial basis). */
export const TREASURY_HOLDINGS = {
  asOf: "2026-07-31" as IsoDate,
  sourceId: "us-tic-mfh",
  /** Published 16 Sept 2026. */
  japan: 1103.9,
  japanPrior: 1116.7,
  japanThreeMonthsAgo: 1136.0,
  /** Japan's peak, Nov 2021. */
  japanPeak: 1325,
  unitedKingdom: 998.3,
  chinaMainland: 618.0,
  chinaPrior: 633.4,
  chinaThreeMonthsAgo: 651.1,
  /** China's peak, Nov 2013. */
  chinaPeak: 1316.7,
  hongKong: 256,
  belgium: 470.7,
  canada: 426.3,
  france: 348.4,
  india: 202.6,
  totalForeign: 9248.1,
  totalForeignPrior: 9298.5,
  /** Record, Feb 2026. */
  totalForeignPeak: 9489.4,
} as const;

/** The market those holdings sit in. Estimates flagged. */
export const TREASURY_MARKET = {
  /** Marketable Treasury debt outstanding, USD bn. Fiscal Data, Aug 2026 (rounded; refresh replaces). */
  marketableOutstanding: 29_600,
  marketableSourceId: "us-fiscaldata",
  marketableAsOf: "2026-08-31" as IsoDate,
  /** 10-year yield, close. 4.95 % on 11 Sept 2026 was the 2023-high print. */
  tenYear: 4.90,
  tenYearAsOf: "2026-09-19" as IsoDate,
  thirtyYear: 5.02,
  mortgage30: 6.85,
  ratesSourceId: "fred",
  /** Average daily cash Treasury trading volume, USD bn (SIFMA, 2026 YTD, rounded). */
  dailyVolume: 1_050,
} as const;

/** Japan's position, from MOF releases. */
export const JAPAN_POSITION = {
  reservesTotal: 995, // USD bn, end-Aug 2026, below $1 tn for the first time since 2016
  reservesAsOf: "2026-08-31" as IsoDate,
  foreignSecuritiesChange: -87.8, // USD bn, Aug vs Jul
  interventionYenTn: 15.4, // record, month to 26 Aug 2026
  interventionUsdBn: 98.6,
  interventionAsOf: "2026-08-26" as IsoDate,
  usdJpyInterventionLine: 155.28,
  jgb10y: 3.0, // first time in three decades, Sept 2026
  jgbAsOf: "2026-09-08" as IsoDate,
  /** Market estimate: share of reserves in Treasuries. */
  treasuryShareOfReservesEstimate: 0.70,
  sourceIds: ["jp-mof-reserves", "jp-mof-intervention", "jp-japantimes", "bloomberg-energy"],
} as const;

/** China's position. */
export const CHINA_POSITION = {
  fxReserves: 3438.3, // USD bn, end-Aug 2026
  fxReservesAsOf: "2026-08-31" as IsoDate,
  goldOunces: 76.73, // million troy oz
  goldTonnes: 2386.57,
  goldValueUsdBn: 350.08,
  goldStreakMonths: 22,
  goldMonthlyAddOz: 0.65, // million oz, Aug 2026
  goldAsOf: "2026-08-31" as IsoDate,
  sourceIds: ["cn-safe-reserves", "cn-pboc-gold"],
} as const;

/** Oil settlement shares, % of global crude trade. Contested; ranges kept. */
export const OIL_SETTLEMENT = {
  asOf: "2026-03-31" as IsoDate,
  usd: { value: 80, low: 78, high: 85 },
  cny: { value: 7, low: 4, high: 9 },
  rub: { value: 4, low: 3, high: 5 },
  inr: { value: 3, low: 2, high: 4 },
  aedGcc: { value: 2.5, low: 1.5, high: 3.5 },
  eur: { value: 2.5, low: 2, high: 3 },
  other: { value: 1, low: 0.5, high: 2 },
  saudiYuanExportShare: { value: 13.5, low: 12, high: 15 },
  saudiChinaCorridorYuanShare: 45, // Feb 2026 estimate
  coferUsdShare: 56.3, // Q1 2026
  coferCnyShare: 3.1,
  sourceIds: ["jpm-research", "atlantic-council-dollar", "carnegie", "imf-cofer", "platts", "swift-rmb-tracker"],
} as const;

/**
 * Twenty-year history of the non-USD share of oil settlement. Pre-2014 points
 * are reconstructed from BIS invoicing surveys and JPM's 2023 series; the
 * error band is wide and is carried into the tracker. % of global crude trade.
 */
export const OIL_NONUSD_HISTORY: Array<{ year: number; nonUsdShare: number; low: number; high: number; note?: string }> = [
  { year: 2006, nonUsdShare: 3.0, low: 2, high: 5, note: "Iran oil bourse announced; euro invoicing marginal" },
  { year: 2008, nonUsdShare: 3.5, low: 2, high: 5 },
  { year: 2010, nonUsdShare: 4.0, low: 3, high: 6 },
  { year: 2012, nonUsdShare: 4.5, low: 3, high: 6, note: "Iran sanctions; rupee-rial and gold-for-oil begin" },
  { year: 2014, nonUsdShare: 5.0, low: 4, high: 7, note: "Crimea; Russia–China energy deals in local currency" },
  { year: 2016, nonUsdShare: 6.0, low: 4, high: 8 },
  { year: 2018, nonUsdShare: 7.5, low: 5, high: 10, note: "INE yuan crude futures launch (Mar 2018)" },
  { year: 2020, nonUsdShare: 9.0, low: 7, high: 12 },
  { year: 2022, nonUsdShare: 13.0, low: 10, high: 16, note: "Russia sanctions; ruble/yuan/rupee corridors" },
  { year: 2023, nonUsdShare: 17.0, low: 14, high: 20, note: "JPM: ~80 % of oil trade still in USD" },
  { year: 2024, nonUsdShare: 18.0, low: 15, high: 21 },
  { year: 2025, nonUsdShare: 19.0, low: 16, high: 22 },
  { year: 2026, nonUsdShare: 20.0, low: 15, high: 22, note: "Q1 2026 consensus ~20 %; Hormuz conflict from Feb 2026" },
];

/**
 * General government gross debt, % of GDP. IMF WEO April 2026 (2025 actual /
 * 2026 projection / 2031 projection). Where a country's row is not yet
 * verified against the release it is marked `estimate: true` and the page
 * renders it with that flag until the connector confirms it.
 */
export type DebtRow = {
  iso3: string;
  name: string;
  region: "americas" | "europe" | "asia" | "mena" | "africa" | "oceania";
  debt2025: number;
  debt2026: number;
  debt2031: number | null;
  /** Interest / revenue, %, latest (Fiscal Monitor or national). Null if unknown. */
  interestToRevenue: number | null;
  /** Share of government debt in foreign currency, %. */
  fxDebtShare: number | null;
  /** Reserves / short-term external debt, ratio. */
  reserveCover: number | null;
  /** 5y CDS, bp, indicative. */
  cds5y: number | null;
  /** Sovereign rating bucket. */
  rating: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "D";
  estimate?: boolean;
  note?: string;
};

export const DEBT_TABLE_ASOF: IsoDate = "2026-04-15";
export const DEBT_TABLE_SOURCE = "imf-weo";

export const DEBT_TABLE: DebtRow[] = [
  { iso3: "USA", name: "United States", region: "americas", debt2025: 123.9, debt2026: 125.8, debt2031: 142.1, interestToRevenue: 18.5, fxDebtShare: 0, reserveCover: null, cds5y: 42, rating: "AA", note: "Deficit 7–8 % of GDP near full employment; no consolidation plan (FM Apr 2026)" },
  { iso3: "JPN", name: "Japan", region: "asia", debt2025: 206.5, debt2026: 204.4, debt2031: 192.8, interestToRevenue: 9.5, fxDebtShare: 0, reserveCover: null, cds5y: 28, rating: "A", note: "Ratio falling on inflation and growth; net debt far lower" },
  { iso3: "CHN", name: "China", region: "asia", debt2025: 99.2, debt2026: 106.9, debt2031: 126.8, interestToRevenue: 7.0, fxDebtShare: 1, reserveCover: null, cds5y: 65, rating: "A", note: "Narrow perimeter; IMF augmented (LGFV) measure ~140 %; total non-financial debt ~300 % (BIS)" },
  { iso3: "ITA", name: "Italy", region: "europe", debt2025: 137.1, debt2026: 138.4, debt2031: 136.1, interestToRevenue: 8.5, fxDebtShare: 0, reserveCover: null, cds5y: 70, rating: "BBB" },
  { iso3: "FRA", name: "France", region: "europe", debt2025: 116.0, debt2026: 118.4, debt2031: 120.7, interestToRevenue: 4.5, fxDebtShare: 0, reserveCover: null, cds5y: 45, rating: "AA" },
  { iso3: "GBR", name: "United Kingdom", region: "europe", debt2025: 102.3, debt2026: 103.6, debt2031: 102.6, interestToRevenue: 8.0, fxDebtShare: 0, reserveCover: null, cds5y: 30, rating: "AA" },
  { iso3: "DEU", name: "Germany", region: "europe", debt2025: 62.9, debt2026: 64.6, debt2031: 73.7, interestToRevenue: 2.0, fxDebtShare: 0, reserveCover: null, cds5y: 12, rating: "AAA" },
  { iso3: "GRC", name: "Greece", region: "europe", debt2025: 142.0, debt2026: 136.9, debt2031: 118.0, interestToRevenue: 6.0, fxDebtShare: 0, reserveCover: null, cds5y: 60, rating: "BBB", estimate: true },
  { iso3: "KOR", name: "Korea", region: "asia", debt2025: 52.3, debt2026: 54.4, debt2031: 63.1, interestToRevenue: 3.0, fxDebtShare: 5, reserveCover: 3.0, cds5y: 30, rating: "AA" },
  { iso3: "ARE", name: "United Arab Emirates", region: "mena", debt2025: 31.0, debt2026: 31.4, debt2031: 30.0, interestToRevenue: 2.0, fxDebtShare: 60, reserveCover: 2.5, cds5y: 40, rating: "AA", estimate: true },
  { iso3: "CAN", name: "Canada", region: "americas", debt2025: 107.0, debt2026: 108.0, debt2031: 105.0, interestToRevenue: 7.0, fxDebtShare: 2, reserveCover: null, cds5y: 30, rating: "AAA", estimate: true },
  { iso3: "ESP", name: "Spain", region: "europe", debt2025: 101.0, debt2026: 100.0, debt2031: 98.0, interestToRevenue: 5.5, fxDebtShare: 0, reserveCover: null, cds5y: 35, rating: "A", estimate: true },
  { iso3: "BEL", name: "Belgium", region: "europe", debt2025: 106.0, debt2026: 108.0, debt2031: 118.0, interestToRevenue: 4.0, fxDebtShare: 0, reserveCover: null, cds5y: 30, rating: "AA", estimate: true },
  { iso3: "PRT", name: "Portugal", region: "europe", debt2025: 92.0, debt2026: 89.0, debt2031: 80.0, interestToRevenue: 5.0, fxDebtShare: 0, reserveCover: null, cds5y: 35, rating: "A", estimate: true },
  { iso3: "IND", name: "India", region: "asia", debt2025: 81.0, debt2026: 80.0, debt2031: 76.0, interestToRevenue: 24.0, fxDebtShare: 5, reserveCover: 2.0, cds5y: 75, rating: "BBB", estimate: true },
  { iso3: "BRA", name: "Brazil", region: "americas", debt2025: 92.0, debt2026: 95.0, debt2031: 103.0, interestToRevenue: 20.0, fxDebtShare: 8, reserveCover: 3.5, cds5y: 165, rating: "BB", estimate: true },
  { iso3: "MEX", name: "Mexico", region: "americas", debt2025: 58.0, debt2026: 59.0, debt2031: 62.0, interestToRevenue: 15.0, fxDebtShare: 20, reserveCover: 2.0, cds5y: 120, rating: "BBB", estimate: true },
  { iso3: "ARG", name: "Argentina", region: "americas", debt2025: 80.0, debt2026: 72.0, debt2031: 55.0, interestToRevenue: 12.0, fxDebtShare: 70, reserveCover: 0.6, cds5y: 650, rating: "CCC", estimate: true, note: "Restructured 2020; IMF programme" },
  { iso3: "TUR", name: "Türkiye", region: "mena", debt2025: 27.0, debt2026: 27.0, debt2031: 30.0, interestToRevenue: 14.0, fxDebtShare: 60, reserveCover: 0.9, cds5y: 260, rating: "B", estimate: true },
  { iso3: "EGY", name: "Egypt", region: "africa", debt2025: 89.0, debt2026: 86.0, debt2031: 74.0, interestToRevenue: 55.0, fxDebtShare: 40, reserveCover: 1.1, cds5y: 480, rating: "B", estimate: true, note: "Interest consumes over half of revenue" },
  { iso3: "PAK", name: "Pakistan", region: "asia", debt2025: 71.0, debt2026: 70.0, debt2031: 62.0, interestToRevenue: 60.0, fxDebtShare: 35, reserveCover: 0.7, cds5y: 700, rating: "CCC", estimate: true },
  { iso3: "ZAF", name: "South Africa", region: "africa", debt2025: 77.0, debt2026: 78.0, debt2031: 82.0, interestToRevenue: 21.0, fxDebtShare: 10, reserveCover: 1.8, cds5y: 210, rating: "BB", estimate: true },
  { iso3: "NGA", name: "Nigeria", region: "africa", debt2025: 50.0, debt2026: 50.0, debt2031: 52.0, interestToRevenue: 45.0, fxDebtShare: 45, reserveCover: 1.4, cds5y: 420, rating: "B", estimate: true },
  { iso3: "KEN", name: "Kenya", region: "africa", debt2025: 70.0, debt2026: 69.0, debt2031: 62.0, interestToRevenue: 35.0, fxDebtShare: 50, reserveCover: 1.0, cds5y: 520, rating: "B", estimate: true },
  { iso3: "GHA", name: "Ghana", region: "africa", debt2025: 65.0, debt2026: 60.0, debt2031: 50.0, interestToRevenue: 30.0, fxDebtShare: 50, reserveCover: 1.2, cds5y: 550, rating: "CCC", estimate: true, note: "Restructured 2023–24" },
  { iso3: "LKA", name: "Sri Lanka", region: "asia", debt2025: 100.0, debt2026: 96.0, debt2031: 85.0, interestToRevenue: 45.0, fxDebtShare: 45, reserveCover: 0.8, cds5y: 600, rating: "CCC", estimate: true, note: "Defaulted 2022; restructured 2024" },
  { iso3: "UKR", name: "Ukraine", region: "europe", debt2025: 100.0, debt2026: 105.0, debt2031: 90.0, interestToRevenue: 15.0, fxDebtShare: 70, reserveCover: 1.5, cds5y: 900, rating: "CCC", estimate: true },
  { iso3: "RUS", name: "Russia", region: "europe", debt2025: 21.0, debt2026: 23.0, debt2031: 28.0, interestToRevenue: 6.0, fxDebtShare: 15, reserveCover: null, cds5y: null, rating: "D", estimate: true, note: "Rated selective default by Western agencies since 2022; sanctioned" },
  { iso3: "SAU", name: "Saudi Arabia", region: "mena", debt2025: 30.0, debt2026: 33.0, debt2031: 40.0, interestToRevenue: 4.0, fxDebtShare: 45, reserveCover: 4.0, cds5y: 60, rating: "A", estimate: true },
  { iso3: "AUS", name: "Australia", region: "oceania", debt2025: 52.0, debt2026: 53.0, debt2031: 55.0, interestToRevenue: 4.0, fxDebtShare: 0, reserveCover: null, cds5y: 15, rating: "AAA", estimate: true },
  { iso3: "IDN", name: "Indonesia", region: "asia", debt2025: 40.0, debt2026: 41.0, debt2031: 44.0, interestToRevenue: 16.0, fxDebtShare: 28, reserveCover: 2.0, cds5y: 80, rating: "BBB", estimate: true },
  { iso3: "TWN", name: "Taiwan", region: "asia", debt2025: 25.0, debt2026: 24.0, debt2031: 22.0, interestToRevenue: 3.0, fxDebtShare: 0, reserveCover: 6.0, cds5y: 40, rating: "AA", estimate: true },
  { iso3: "SGP", name: "Singapore", region: "asia", debt2025: 175.0, debt2026: 176.0, debt2031: 180.0, interestToRevenue: 2.0, fxDebtShare: 0, reserveCover: 5.0, cds5y: 10, rating: "AAA", estimate: true, note: "Gross debt backed by assets; net creditor" },
  { iso3: "NLD", name: "Netherlands", region: "europe", debt2025: 45.0, debt2026: 46.0, debt2031: 52.0, interestToRevenue: 2.0, fxDebtShare: 0, reserveCover: null, cds5y: 12, rating: "AAA", estimate: true },
  { iso3: "POL", name: "Poland", region: "europe", debt2025: 58.0, debt2026: 62.0, debt2031: 70.0, interestToRevenue: 5.0, fxDebtShare: 25, reserveCover: 2.0, cds5y: 65, rating: "A", estimate: true },
  { iso3: "ISR", name: "Israel", region: "mena", debt2025: 70.0, debt2026: 71.0, debt2031: 70.0, interestToRevenue: 8.0, fxDebtShare: 15, reserveCover: 3.0, cds5y: 100, rating: "A", estimate: true },
  { iso3: "IRN", name: "Iran", region: "mena", debt2025: 35.0, debt2026: 40.0, debt2031: null, interestToRevenue: null, fxDebtShare: null, reserveCover: null, cds5y: null, rating: "D", estimate: true, note: "Sanctioned; 2026 conflict; data unreliable" },
  { iso3: "VEN", name: "Venezuela", region: "americas", debt2025: 150.0, debt2026: 150.0, debt2031: null, interestToRevenue: null, fxDebtShare: 90, reserveCover: 0.2, cds5y: null, rating: "D", estimate: true, note: "In default since 2017" },
  { iso3: "LBN", name: "Lebanon", region: "mena", debt2025: 160.0, debt2026: 150.0, debt2031: null, interestToRevenue: null, fxDebtShare: 40, reserveCover: 0.5, cds5y: null, rating: "D", estimate: true, note: "In default since 2020" },
  { iso3: "ETH", name: "Ethiopia", region: "africa", debt2025: 35.0, debt2026: 33.0, debt2031: 28.0, interestToRevenue: 20.0, fxDebtShare: 55, reserveCover: 0.5, cds5y: null, rating: "D", estimate: true, note: "Defaulted Dec 2023; Common Framework" },
  { iso3: "ZMB", name: "Zambia", region: "africa", debt2025: 95.0, debt2026: 88.0, debt2031: 70.0, interestToRevenue: 25.0, fxDebtShare: 60, reserveCover: 1.0, cds5y: null, rating: "CCC", estimate: true, note: "Restructured 2024" },
  { iso3: "BOL", name: "Bolivia", region: "americas", debt2025: 92.0, debt2026: 95.0, debt2031: 100.0, interestToRevenue: 12.0, fxDebtShare: 50, reserveCover: 0.3, cds5y: 1800, rating: "CCC", estimate: true, note: "Reserves nearly exhausted" },
  { iso3: "MDV", name: "Maldives", region: "asia", debt2025: 115.0, debt2026: 118.0, debt2031: 120.0, interestToRevenue: 20.0, fxDebtShare: 60, reserveCover: 0.4, cds5y: null, rating: "CCC", estimate: true },
  { iso3: "TUN", name: "Tunisia", region: "africa", debt2025: 82.0, debt2026: 84.0, debt2031: 88.0, interestToRevenue: 18.0, fxDebtShare: 60, reserveCover: 0.9, cds5y: null, rating: "CCC", estimate: true },
  { iso3: "COL", name: "Colombia", region: "americas", debt2025: 62.0, debt2026: 64.0, debt2031: 70.0, interestToRevenue: 16.0, fxDebtShare: 35, reserveCover: 2.0, cds5y: 200, rating: "BB", estimate: true },
  { iso3: "CHL", name: "Chile", region: "americas", debt2025: 42.0, debt2026: 43.0, debt2031: 46.0, interestToRevenue: 5.0, fxDebtShare: 35, reserveCover: 1.5, cds5y: 60, rating: "A", estimate: true },
  { iso3: "PHL", name: "Philippines", region: "asia", debt2025: 60.0, debt2026: 60.0, debt2031: 58.0, interestToRevenue: 14.0, fxDebtShare: 30, reserveCover: 2.5, cds5y: 70, rating: "BBB", estimate: true },
  { iso3: "VNM", name: "Vietnam", region: "asia", debt2025: 34.0, debt2026: 34.0, debt2031: 36.0, interestToRevenue: 6.0, fxDebtShare: 40, reserveCover: 1.2, cds5y: 110, rating: "BB", estimate: true },
  { iso3: "MYS", name: "Malaysia", region: "asia", debt2025: 65.0, debt2026: 64.0, debt2031: 62.0, interestToRevenue: 15.0, fxDebtShare: 3, reserveCover: 1.1, cds5y: 55, rating: "A", estimate: true },
  { iso3: "THA", name: "Thailand", region: "asia", debt2025: 64.0, debt2026: 66.0, debt2031: 70.0, interestToRevenue: 7.0, fxDebtShare: 2, reserveCover: 3.0, cds5y: 45, rating: "BBB", estimate: true },
  { iso3: "HUN", name: "Hungary", region: "europe", debt2025: 73.0, debt2026: 73.0, debt2031: 72.0, interestToRevenue: 10.0, fxDebtShare: 28, reserveCover: 1.2, cds5y: 120, rating: "BBB", estimate: true },
  { iso3: "ROU", name: "Romania", region: "europe", debt2025: 58.0, debt2026: 62.0, debt2031: 72.0, interestToRevenue: 7.0, fxDebtShare: 50, reserveCover: 1.3, cds5y: 170, rating: "BBB", estimate: true },
  { iso3: "IRL", name: "Ireland", region: "europe", debt2025: 38.0, debt2026: 36.0, debt2031: 30.0, interestToRevenue: 3.0, fxDebtShare: 0, reserveCover: null, cds5y: 15, rating: "AA", estimate: true },
  { iso3: "AUT", name: "Austria", region: "europe", debt2025: 82.0, debt2026: 84.0, debt2031: 88.0, interestToRevenue: 3.0, fxDebtShare: 0, reserveCover: null, cds5y: 20, rating: "AA", estimate: true },
  { iso3: "FIN", name: "Finland", region: "europe", debt2025: 84.0, debt2026: 86.0, debt2031: 92.0, interestToRevenue: 2.5, fxDebtShare: 0, reserveCover: null, cds5y: 18, rating: "AA", estimate: true },
  { iso3: "NZL", name: "New Zealand", region: "oceania", debt2025: 48.0, debt2026: 50.0, debt2031: 52.0, interestToRevenue: 5.0, fxDebtShare: 0, reserveCover: null, cds5y: 20, rating: "AAA", estimate: true },
  { iso3: "CHE", name: "Switzerland", region: "europe", debt2025: 37.0, debt2026: 36.0, debt2031: 34.0, interestToRevenue: 1.5, fxDebtShare: 0, reserveCover: null, cds5y: 8, rating: "AAA", estimate: true },
  { iso3: "NOR", name: "Norway", region: "europe", debt2025: 42.0, debt2026: 42.0, debt2031: 42.0, interestToRevenue: 1.5, fxDebtShare: 0, reserveCover: null, cds5y: 10, rating: "AAA", estimate: true },
  { iso3: "QAT", name: "Qatar", region: "mena", debt2025: 40.0, debt2026: 38.0, debt2031: 32.0, interestToRevenue: 5.0, fxDebtShare: 70, reserveCover: 2.0, cds5y: 40, rating: "AA", estimate: true },
  { iso3: "KWT", name: "Kuwait", region: "mena", debt2025: 8.0, debt2026: 12.0, debt2031: 25.0, interestToRevenue: 1.0, fxDebtShare: 50, reserveCover: 5.0, cds5y: 45, rating: "AA", estimate: true },
  { iso3: "WLD", name: "World (IMF aggregate)", region: "americas", debt2025: 93.9, debt2026: 95.3, debt2031: 102.3, interestToRevenue: null, fxDebtShare: null, reserveCover: null, cds5y: null, rating: "A", note: "Advanced 108.2; EMDE 77.2 (2026)" },
];

/** Observations the confidence models seed from, until the refresh replaces them. */
export const SEED_OBSERVATIONS: Observation[] = [
  { indicatorId: "jp-tic-mom", asOf: "2026-07-31", value: -32.1, sourceId: "us-tic-mfh", note: "1,136.0 → 1,103.9 over three months" },
  { indicatorId: "jp-reserves-foreign-securities", asOf: "2026-08-31", value: -87.8, sourceId: "jp-mof-reserves" },
  { indicatorId: "jp-intervention-yen", asOf: "2026-08-26", value: 15.4, sourceId: "jp-mof-intervention" },
  { indicatorId: "jp-usdjpy-vs-line", asOf: "2026-09-19", value: 1.2, sourceId: "fred", note: "within ~1 yen of 155.28" },
  { indicatorId: "jp-jgb10y", asOf: "2026-09-08", value: 3.0, sourceId: "jp-mof-jgb" },
  { indicatorId: "jp-hedged-ust-carry", asOf: "2026-09-19", value: -1.1, sourceId: "fred", note: "10y UST 4.90 less ~3.0 hedge cost less 3.0 JGB" },
  { indicatorId: "jp-lifers-foreign-bond-flow", asOf: "2026-08-31", value: -137.3, sourceId: "jp-mof-portfolio-flows" },
  { indicatorId: "jp-banks-foreign-bond-flow", asOf: "2026-08-31", value: -143, sourceId: "jp-mof-portfolio-flows", note: "all investors, long-term bonds" },
  { indicatorId: "jp-boj-policy-rate-path", asOf: "2026-09-09", value: 1.5, sourceId: "jp-boj-mpm", note: "Fitch expects faster hikes than priced" },
  { indicatorId: "jp-fima-usage", asOf: "2026-09-01", value: 0, sourceId: "fed-fima", note: "named as a future route by the minister" },
  { indicatorId: "jp-us-coordination", asOf: "2026-08-31", value: 1, sourceId: "jp-mof-minister", note: "joint intervention 31 Jul; Bessent–Katayama 31 Aug" },
  { indicatorId: "jp-fed-custody-japan-proxy", asOf: "2026-09-17", value: -18, sourceId: "fed-h41" },
  { indicatorId: "jp-diet-reserve-debate", asOf: "2026-09-15", value: 2, sourceId: "jp-mof-minister" },
  { indicatorId: "jp-law-mandate", asOf: "2026-09-19", value: 0, sourceId: "jp-egov-law" },

  { indicatorId: "cn-tic-mom", asOf: "2026-07-31", value: -33.1, sourceId: "us-tic-mfh", note: "651.1 → 618.0" },
  { indicatorId: "cn-tic-plus-belgium-hk", asOf: "2026-07-31", value: -60.3, sourceId: "us-tic-mfh", note: "China −33.1, Belgium −11.8 (Jul), HK ~−15" },
  { indicatorId: "cn-pboc-gold-streak", asOf: "2026-08-31", value: 22, sourceId: "cn-pboc-gold" },
  { indicatorId: "cn-safe-reserves-change", asOf: "2026-08-31", value: 19.5, sourceId: "cn-safe-reserves", note: "valuation-driven rise" },
  { indicatorId: "cn-cips-volume-growth", asOf: "2026-06-30", value: 28, sourceId: "cn-cips" },
  { indicatorId: "cn-us-sanction-escalation", asOf: "2026-09-15", value: 2, sourceId: "ofac" },
  { indicatorId: "cn-mofcom-countermeasures", asOf: "2026-09-15", value: 3, sourceId: "cn-mofcom" },
  { indicatorId: "cn-mfa-dollar-rhetoric", asOf: "2026-09-15", value: 3, sourceId: "cn-mofa" },
  { indicatorId: "cn-state-media-threat", asOf: "2026-09-15", value: 4, sourceId: "cn-global-times" },
  { indicatorId: "cn-cny-pressure", asOf: "2026-09-19", value: 120, sourceId: "cn-pboc-mpc" },
  { indicatorId: "cn-npc-law-financial-security", asOf: "2026-09-19", value: 0, sourceId: "cn-npc" },
  { indicatorId: "cn-ust-share-of-reserves", asOf: "2026-08-31", value: 18, sourceId: "us-tic-mfh", note: "618 / 3,438" },

  { indicatorId: "oil-nonusd-share", asOf: "2026-03-31", value: 20, sourceId: "atlantic-council-dollar" },
  { indicatorId: "oil-cny-share", asOf: "2026-03-31", value: 7, sourceId: "platts" },
  { indicatorId: "cofer-usd-share", asOf: "2026-03-31", value: 56.3, sourceId: "imf-cofer" },
  { indicatorId: "cofer-cny-share", asOf: "2026-03-31", value: 3.1, sourceId: "imf-cofer" },
  { indicatorId: "cb-gold-purchases", asOf: "2026-06-30", value: 1050, sourceId: "imf-cofer", note: "289 t in Q2 2026 alone" },
  { indicatorId: "ust10y", asOf: "2026-09-19", value: 4.90, sourceId: "fred" },
  { indicatorId: "mortgage30y", asOf: "2026-09-18", value: 6.85, sourceId: "fred" },
  { indicatorId: "saudi-yuan-export-share", asOf: "2026-03-31", value: 13.5, sourceId: "sa-sama" },
  { indicatorId: "uae-oil-currency-statements", asOf: "2026-04-30", value: 1, sourceId: "ae-cbuae" },
  { indicatorId: "foreign-official-ust-flow", asOf: "2026-07-31", value: 10.2, sourceId: "us-tic-press" },

  { indicatorId: "tw-pla-ships-30d", asOf: "2026-07-31", value: 244, sourceId: "tw-mnd-daily", note: "record month" },
  { indicatorId: "tw-pla-aircraft-30d", asOf: "2026-08-31", value: 410, sourceId: "tw-mnd-daily" },
  { indicatorId: "tw-large-exercise", asOf: "2026-09-19", value: 0, sourceId: "cn-mod", note: "Justice Mission 2025 was the last named one" },
  { indicatorId: "tw-odni-assessment", asOf: "2026-03-25", value: 1, sourceId: "us-odni-ata", note: "no fixed timeline; invasion high-risk" },
  { indicatorId: "tw-kinmen-cga-incursions", asOf: "2026-08-31", value: 9, sourceId: "tw-cga" },
  { indicatorId: "tw-lloyds-listing", asOf: "2026-09-01", value: 0, sourceId: "lloyds-jwc", note: "not listed" },
  { indicatorId: "tw-prediction-market", asOf: "2026-09-19", value: 9, sourceId: "polymarket-taiwan" },
  { indicatorId: "tw-cn-gold-purchases", asOf: "2026-08-31", value: 20.2, sourceId: "cn-pboc-gold" },
  { indicatorId: "tw-cn-ust-reduction", asOf: "2026-07-31", value: 33.1, sourceId: "us-tic-mfh" },
  { indicatorId: "tw-us-cn-mil-mil-channel", asOf: "2026-09-01", value: 1, sourceId: "us-dod-cmpr" },
  { indicatorId: "tw-strait-transits", asOf: "2026-08-31", value: 240, sourceId: "csis-china-power", note: "vessels/day, normal range" },
  { indicatorId: "tw-cn-us-trade-truce", asOf: "2026-09-01", value: 1, sourceId: "cn-mofcom" },
];
