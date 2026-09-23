/**
 * Market-rate defaults shared across engines — one place for each figure.
 *
 * WHY THIS EXISTS. The HELOC default was typed in as 8.5% in a dozen places
 * (and as 6% in one fallback), and the MYGA default as 7% in three. Each
 * copy drifted on its own. Engines and pages now read these constants, and
 * each constant carries the primary source it was read from and the date.
 *
 * These are ASSUMPTIONS the visitor can overwrite, set to a sourced market
 * reading. They are not carrier quotes and not a promise of any rate.
 */

/**
 * Default HELOC rate, in percent: the national average variable HELOC rate.
 * Source: Curinos, as reported by Yahoo Finance, 21 Sep 2026 (see
 * HELOC_RATE_DEFAULT_SOURCE). Replaces 8.5% (and a 6% fallback).
 */
export const HELOC_RATE_DEFAULT_PCT = 7.09;

/** The same default as a decimal, for engines that take 0.0709 rather than 7.09. */
export const HELOC_RATE_DEFAULT = 0.0709;

export const HELOC_RATE_DEFAULT_SOURCE = {
  label: "Curinos national average adjustable-rate HELOC: 7.09% (a 2026 low), for applicants with a credit score of 780 or more and a combined loan-to-value under 70%, as reported by Yahoo Finance",
  url: "https://finance.yahoo.com/personal-finance/mortgages/article/heloc-and-home-equity-loan-rates-today-monday-september-21-2026-a-33-basis-point-differential-100000210.html",
  asOf: "2026-09-21, read 2026-09-23",
  note: "Assumption: the default HELOC rate is this national average. A borrower with a lower score or a higher CLTV will be quoted more; the visitor can change the rate.",
} as const;

/**
 * Default MYGA rate, in percent, compounding annually: the top 5-year MYGA
 * rate listed in September 2026. Source: MYGA_RATE_DEFAULT_SOURCES. Replaces 7%,
 * which was above every listed compounding rate.
 */
export const MYGA_RATE_DEFAULT_PCT = 6.3;

export const MYGA_RATE_DEFAULT_SOURCES = [
  {
    label: "MyAnnuityStore, What the Fed Rate Hike Means for Annuity Rates (September 2026): the top listed MYGA rate is 6.95% for a 7-year term, paid as simple interest, which is about 5.83% compounded annually; the top 5-year MYGA rate is about 6.30%",
    url: "https://myannuitystore.com/fed-rate-hike-annuity-rates-september-2026/",
    asOf: "September 2026 (rates as of 2026-09-18), read 2026-09-23",
    note: "Check: (1 + 0.0695 × 7)^(1/7) − 1 = 5.83%. A 7-year simple-interest headline is not comparable to a compounding rate, so the default is the 5-year compounding figure, not 6.95%.",
  },
  {
    label: "CBS News, What's a good annuity rate in 2026? (MYGA rate tracker): the highest 5-year MYGA rate is 6.30%",
    url: "https://www.cbsnews.com/news/good-annuity-rate-in-2026/",
    asOf: "September 2026, read 2026-09-23",
  },
  {
    label: "Assumption: the default MYGA rate is 6.3% a year compounding, the top 5-year rate above; the visitor can change it",
    note: "Other trackers read the same week list a top 5-year rate of 6.45% (AnnuityRatesHQ CANNEX table as of 2026-09-18, market average 5.16%); 6.3% sits between the market average and the top. Both pages above were read through search excerpts because this environment's proxy blocks a direct fetch.",
  },
] as const;

/** Every source behind the defaults above, for a page to print. */
export const MARKET_RATE_DEFAULTS_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  HELOC_RATE_DEFAULT_SOURCE,
  ...MYGA_RATE_DEFAULT_SOURCES,
];
