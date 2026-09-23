/**
 * 30-Year Index Crediting Data for IUL Backtester
 * 
 * Contains actual annual price returns for major indices (1994-2025)
 * and carrier-specific index options with their cap/floor/participation/spread parameters.
 * Crediting rates are derived by applying each carrier's parameters to the raw index returns.
 */
// ─── Raw Index Annual Price Returns (1994-2025) ─────────────────────────────
/**
 * S&P 500 PRICE returns by calendar year, 1994-2025.
 *
 * Source: ChartRow, "S&P 500 Returns by Year" (https://chartrow.com/sp500/returns),
 * read 14 September 2026. That table publishes total return and the dividend
 * contribution per year; the price return carried here is total less dividend,
 * which is what an indexed account credits against — the carrier documents say
 * "S&P 500 Price Index" and pay no dividends. Figures are to one decimal
 * because that is the precision the source publishes; claiming two would be
 * inventing a digit.
 *
 * ## Why this series replaced the previous one
 *
 * The series that stood here until now carried no source and did not reconcile
 * to the carrier's own published claims about this index. This one does. The
 * checks live in shared/sp500SeriesAudit.ts and run on every test pass:
 *
 *                                        carrier    old series    this series
 *     30-year average, 1994-2023           8.06%        8.29%          8.05%
 *     years above a 10% cap                   18           16             17
 *     average excess above the cap         12.23%       13.66%         12.29%
 *
 * Two of the three land within 0.06 of the carrier's published figure. The
 * year count is one out of thirty different, which is what a borderline year
 * near the cap does under one-decimal rounding — 2016 sits at 9.6%, just under
 * it. The old series missed by 0.23 points, two years, and 1.43 points, which
 * is a different index rather than a rounding difference.
 */
export const RAW_INDEX_RETURNS: Record<string, Record<number, number>> = {
  SP500: {
    1994: -2.2, 1995: 34.9, 1996: 20.1, 1997: 31.5, 1998: 27.1,
    1999: 19.1, 2000: -10.6, 2001: -12.9, 2002: -22.8, 2003: 26.1,
    2004: 8.6, 2005: 3.0, 2006: 13.7, 2007: 3.2, 2008: -38.3,
    2009: 23.5, 2010: 12.9, 2011: -0.2, 2012: 13.5, 2013: 29.7,
    2014: 11.3, 2015: -0.8, 2016: 9.6, 2017: 19.4, 2018: -6.4,
    2019: 28.8, 2020: 16.1, 2021: 27.0, 2022: -19.5, 2023: 24.3,
    2024: 23.3, 2025: 16.3,
  },
  /**
   * NOT YET SOURCED. These two series carry no source and have not been
   * checked against anything published, because no carrier document held here
   * makes an arithmetic claim about them to check against. They feed the
   * multi-index blends only. Treat any figure derived from them as
   * provisional — see sp500SeriesAudit.UNSOURCED_SERIES.
   */
  NASDAQ100: {
    1994: 1.50, 1995: 42.54, 1996: 42.54, 1997: 20.63, 1998: 85.30,
    1999: 101.95, 2000: -36.84, 2001: -32.65, 2002: -37.58, 2003: 49.12,
    2004: 10.44, 2005: 1.49, 2006: 6.79, 2007: 18.67, 2008: -41.89,
    2009: 53.54, 2010: 19.22, 2011: 2.70, 2012: 16.82, 2013: 34.99,
    2014: 17.94, 2015: 8.43, 2016: 5.89, 2017: 31.52, 2018: -1.04,
    2019: 37.96, 2020: 47.58, 2021: 26.63, 2022: -32.97, 2023: 53.81,
    2024: 24.88, 2025: 20.17,
  },
  RUSSELL2000: {
    1994: -3.37, 1995: 26.64, 1996: 10.81, 1997: 28.27, 1998: -15.06,
    1999: 47.28, 2000: -17.89, 2001: -1.06, 2002: -23.19, 2003: 62.42,
    2004: 8.28, 2005: 15.23, 2006: 8.58, 2007: -13.50, 2008: -43.31,
    2009: 61.58, 2010: 31.01, 2011: -1.52, 2012: 12.35, 2013: 29.84,
    2014: 4.26, 2015: -16.17, 2016: 34.12, 2017: 9.07, 2018: 4.17,
    2019: -6.29, 2020: 49.08, 2021: -6.95, 2022: -7.38, 2023: 8.32,
    2024: 5.27, 2025: 21.70,
  },
};
// ─── Crediting Engine ────────────────────────────────────────────────────────
export interface IndexOption {
  id: string;
  name: string;
  carrier: 'mutual-n' | 'mutual-s' | 'illustrative';
  /** Underlying index key in RAW_INDEX_RETURNS */
  index: string;
  /** Special index type for blended/hindsight strategies */
  indexType?: 'single' | 'blended' | 'hindsight' | 'multiIndex';
  /** For blended/multi strategies, the component indices and weights */
  components?: Array<{ index: string; weight: number }>;
  /** Cap rate (%) — null means uncapped */
  cap: number | null;
  /** Floor rate (%) — typically 0 */
  floor: number;
  /** Participation rate (%) — e.g. 100, 125, 215 */
  participation: number;
  /** Spread (%) — deducted from raw return before cap/floor */
  spread: number;
  /** Strategy charge (%) — deducted annually from the crediting */
  strategyCharge: number;
  /** Bonus rate (%) — added to crediting */
  bonus: number;
  /** Description for the UI */
  description: string;
  /** Available years (some strategies don't have 30-year history) */
  availableFrom: number;
  /**
   * Length of one index segment in years. Absent or 1 = an ordinary annual
   * point-to-point. 2 or more = a multi-year segment, where participation,
   * spread, cap and floor all apply ONCE across the whole term.
   *
   * For a multi-year option every per-year figure this module reports is the
   * ANNUALIZED credit of the segment ending in that year, because that is the
   * only figure comparable with an annual strategy. Use
   * shared/balancedIndexedAccount.ts when the segment credit itself is wanted.
   */
  segmentTermYears?: number;
  /** True only when every term above was transcribed from a carrier document. */
  sourced?: boolean;
  /** The document, or why there isn't one. */
  sourceNote?: string;
  /**
   * The de-identified product generation this option belongs to — "Product II",
   * "Product III", and so on.
   *
   * This is not cosmetic. Successive generations of the same carrier's product
   * carry DIFFERENT terms on options with the same name: the multi-index cap is
   * 13.00% on generation II and 14.00% on generation III. An option shown
   * without its generation invites somebody to quote one generation's cap
   * against the other's illustration. Null where no document establishes it.
   */
  product?: string | null;
}
// ─── MUTUAL COMPANY A Index Options ──────────────────────
export const A_MUTUAL_INDEX_OPTIONS: IndexOption[] = [
  {
    id: 'am-sp500-ptp',
    name: 'S&P 500 Point-to-Point',
    carrier: 'mutual-n',
    index: 'SP500',
    indexType: 'single',
    cap: 10.25,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Traditional capped S&P 500 strategy. 100% participation, 10.25% cap, 0% floor.',
    availableFrom: 1994,
    product: 'Product II',
    sourced: true,
    sourceNote:
      'Nationwide IUL Accumulator II 2020 rate guide, FLM-1491AO.10 (02/25), rates as of 15 March 2025.',
  },
  {
    id: 'am-sp500-uncapped',
    name: 'Uncapped S&P 500 PtP',
    carrier: 'mutual-n',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 100,
    // Spread corrected 5.75 -> 6.00 from FLM-1491AO.10 (02/25).
    spread: 6.0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Uncapped S&P 500 with 6.00% spread. Unlimited upside minus spread, 0% floor.',
    availableFrom: 1994,
    product: 'Product II',
    sourced: true,
    sourceNote:
      'Nationwide IUL Accumulator II 2020 rate guide, FLM-1491AO.10 (02/25), rates as of 15 March 2025.',
  },
  {
    id: 'am-highcap-sp500',
    name: 'High-Cap S&P 500 PtP',
    carrier: 'mutual-n',
    index: 'SP500',
    indexType: 'single',
    // Cap corrected 13.25 -> 13.00 from FLM-1491AO.10 (02/25).
    cap: 13,
    floor: 0,
    participation: 100,
    spread: 0,
    // Current charge 1.0%; guaranteed maximum 1.5%.
    strategyCharge: 1.0,
    bonus: 0,
    description: 'Higher cap (13.25%) with 1.5% strategy charge. More upside potential.',
    availableFrom: 1994,
    product: 'Product II',
    sourced: true,
    sourceNote:
      'Nationwide IUL Accumulator II 2020 rate guide, FLM-1491AO.10 (02/25), rates as of 15 March 2025.',
  },
  {
    id: 'am-multi-index',
    name: 'Multi-Index Monthly Average',
    carrier: 'mutual-n',
    index: 'SP500',
    indexType: 'multiIndex',
    components: [
      { index: 'SP500', weight: 0.50 },
      { index: 'NASDAQ100', weight: 0.30 },
      { index: 'RUSSELL2000', weight: 0.20 },
    ],
    cap: 13,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    // Cap corrected 14 -> 13.00 from the Nationwide IUL Accumulator II 2020
    // rate guide, FLM-1491AO.10 (02/25), rates as of 15 March 2025.
    // The third component should be the Dow Jones Industrial Average, not the
    // Russell 2000 — the contract names S&P 500, Nasdaq-100 and DJIA. We hold
    // no DJIA series, so it stays wrong here and the partner API refuses to
    // run this strategy. See docs/carriers/nationwide-iul-accumulator-ii-2020.md
    description: 'Blended 50/30/20 of best-performing indices. 13% cap, 0% floor. Third component is wrong until a DJIA series is sourced.',
    availableFrom: 1994,
    product: 'Product II',
    sourced: true,
    sourceNote:
      'Nationwide IUL Accumulator II 2020 rate guide, FLM-1491AO.10 (02/25), rates as of 15 March 2025.',
  },
  {
    id: 'am-highcap-multi',
    name: 'High-Cap Multi-Index Monthly Avg',
    carrier: 'mutual-n',
    index: 'SP500',
    indexType: 'multiIndex',
    components: [
      { index: 'SP500', weight: 0.50 },
      { index: 'NASDAQ100', weight: 0.30 },
      { index: 'RUSSELL2000', weight: 0.20 },
    ],
    cap: 25,
    floor: 0,
    participation: 100,
    spread: 0,
    // Current charge 0.85% per FLM-1491AO.10 (02/25); guaranteed maximum 1.5%.
    // The file previously carried the guaranteed figure against the current
    // cap, which mixes two columns of the rate sheet.
    strategyCharge: 0.85,
    bonus: 0,
    description: 'High-cap multi-index blend (25% cap) with 1.5% strategy charge.',
    availableFrom: 1994,
    product: 'Product II',
    sourced: true,
    sourceNote:
      'Nationwide IUL Accumulator II 2020 rate guide, FLM-1491AO.10 (02/25), rates as of 15 March 2025.',
  },
  {
    id: 'am-fixed',
    name: 'Fixed Interest',
    carrier: 'mutual-n',
    index: 'SP500',
    indexType: 'single',
    cap: 4.25,
    floor: 4.25,
    participation: 0,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Fixed account: 4.25% declared rate (the carrier may change it; only the contract minimum is guaranteed). No index exposure.',
    availableFrom: 1994,
  },
  {
    id: 'am-sp500-2yr',
    name: '2-Year S&P 500 PtP (Spread)',
    carrier: 'mutual-n',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 100,
    spread: 4.5,
    strategyCharge: 0,
    bonus: 0,
    description: '2-Year S&P 500 Point-to-Point. 100% participation, uncapped, -4.5% spread, 0% floor.',
    availableFrom: 1994,
  },
];

// ─── MUTUAL COMPANY B Index Options ──────────────────────
export const A_PLUS_MUTUAL_LIFE_INDEX_OPTIONS: IndexOption[] = [
  {
    id: 'apm-sp500-capped',
    name: 'S&P 500 Capped PtP',
    carrier: 'mutual-s',
    index: 'SP500',
    indexType: 'single',
    cap: 10.50,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Traditional S&P 500 capped at 10.50%. 100% participation, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'apm-sp500-multiplier',
    name: 'S&P 500 with Multiplier',
    carrier: 'mutual-s',
    index: 'SP500',
    indexType: 'single',
    cap: 14.0,
    floor: 0,
    participation: 110,
    spread: 0,
    strategyCharge: 0.75,
    bonus: 0,
    description: 'S&P 500 with 110% participation and 14% cap. 0.75% strategy charge.',
    availableFrom: 1994,
  },
  {
    id: 'apm-sp500-lowvol',
    name: 'S&P 500 Low Volatility',
    carrier: 'mutual-s',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 100,
    spread: 3.0,
    strategyCharge: 0,
    bonus: 0,
    description: 'S&P 500 Low Volatility — uncapped with 3% spread. Smoother returns.',
    availableFrom: 1994,
  },
  {
    id: 'apm-hindsight',
    name: 'Hindsight Account (S&P/Nasdaq/Russell)',
    carrier: 'mutual-s',
    index: 'SP500',
    indexType: 'hindsight',
    components: [
      { index: 'SP500', weight: 0.60 },
      { index: 'NASDAQ100', weight: 0.40 },
      { index: 'RUSSELL2000', weight: 0.0 },
    ],
    cap: 12.0,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Hindsight: 60% best + 40% second-best of S&P 500, Nasdaq-100, Russell 2000. 12% cap.',
    availableFrom: 1994,
  },
  {
    id: 'apm-fixed',
    name: 'Fixed Account',
    carrier: 'mutual-s',
    index: 'SP500',
    indexType: 'single',
    cap: 4.0,
    floor: 4.0,
    participation: 0,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Fixed account: 4.0% declared rate (the carrier may change it; only the contract minimum is guaranteed). No index exposure.',
    availableFrom: 1994,
  },
  {
    id: 'apm-sp500-2yr',
    name: '2-Year S&P 500 PtP (110% Participation)',
    carrier: 'mutual-s',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 110,
    spread: 2.5,
    strategyCharge: 0,
    bonus: 0,
    description: '2-Year S&P 500 Point-to-Point. Uncapped, 110% participation, -2.5% spread, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'apm-sp500-1yr-capped',
    name: '1-Year S&P 500 Capped PtP',
    carrier: 'mutual-s',
    index: 'SP500',
    indexType: 'single',
    cap: 10.5,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: '1-Year S&P 500 Point-to-Point. 100% participation, 10.5% cap, 0% floor.',
    availableFrom: 1994,
  },
];

// ─── ILLUSTRATIVE Index Options: a parameter set for comparison, not any carrier's ───
export const A_MINUS_MUTUAL_INDEX_OPTIONS: IndexOption[] = [
  {
    id: 'amm-sp500-core',
    name: 'S&P 500 Core PtP',
    carrier: 'illustrative',
    index: 'SP500',
    indexType: 'single',
    cap: 9.5,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Core S&P 500 strategy. 9.5% cap, 100% participation, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'amm-sp500-smart',
    name: 'S&P 500 Smart Strategy',
    carrier: 'illustrative',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 100,
    spread: 5.0,
    strategyCharge: 0,
    bonus: 0,
    description: 'S&P 500 Allocation Index — uncapped with 5.0% spread. 100% participation.',
    availableFrom: 1994,
  },
  {
    id: 'amm-nasdaq-ccar',
    name: 'Nasdaq-100 CCAR',
    carrier: 'illustrative',
    index: 'NASDAQ100',
    indexType: 'single',
    cap: 11.0,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Nasdaq-100 with CCAR rider. 11% cap, 100% participation, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'amm-sp500-highpar',
    name: 'S&P 500 High Participation',
    carrier: 'illustrative',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 85,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'S&P 500 uncapped with 85% participation. No spread.',
    availableFrom: 1994,
  },
  {
    id: 'amm-dynamic-bonus',
    name: 'Dynamic Low Vol with Bonus',
    carrier: 'illustrative',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 125,
    spread: 0,
    strategyCharge: 0,
    bonus: 0.75,
    description: 'Dynamic Low Volatility — 125% participation, 0.75% bonus, uncapped.',
    availableFrom: 1994,
  },
  {
    id: 'amm-fixed',
    name: 'Fixed Account',
    carrier: 'illustrative',
    index: 'SP500',
    indexType: 'single',
    cap: 3.75,
    floor: 3.75,
    participation: 0,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: 'Fixed account: 3.75% declared rate (the carrier may change it; only the contract minimum is guaranteed). No index exposure.',
    availableFrom: 1994,
  },
  {
    id: 'amm-sp500-2yr',
    name: '2-Year S&P 500 PtP (110% Participation)',
    carrier: 'illustrative',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 110,
    spread: 2.5,
    strategyCharge: 0,
    bonus: 0,
    description: '2-Year S&P 500 Point-to-Point. Uncapped, 110% participation, -2.5% spread, 0% floor.',
    availableFrom: 1994,
  },
  {
    id: 'amm-sp500-1yr-capped',
    name: '1-Year S&P 500 Capped PtP',
    carrier: 'illustrative',
    index: 'SP500',
    indexType: 'single',
    cap: 10.5,
    floor: 0,
    participation: 100,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    description: '1-Year S&P 500 Point-to-Point. 100% participation, 10.5% cap, 0% floor.',
    availableFrom: 1994,
  },
];

// ─── All Options Combined ────────────────────────────────────────────────────

/**
 * Volatility-control strategies from the Nationwide IUL Accumulator II 2020
 * rate guide, FLM-1491AO.10 (02/25). Terms transcribed exactly.
 *
 * These are where the high participation rates live — 185% to 315%, uncapped.
 * They are listed because a policyholder choosing an allocation should see
 * every strategy the contract offers, including the ones nobody can model
 * here.
 *
 * ## We hold no series for either index
 *
 * RAW_INDEX_RETURNS has SP500, NASDAQ100 and RUSSELL2000. It has nothing for
 * the J.P. Morgan Mercury or BNP Paribas Global H-Factor indices, so a
 * year-by-year credit cannot be computed for any of these and the engine
 * refuses them.
 *
 * ## And even with the series, the history would be thin
 *
 * Nationwide states it plainly: J.P. Morgan Mercury was established
 * 25 April 2022 and BNP Paribas Global H-Factor on 8 April 2022. Everything
 * published before those dates is back-tested and, in Nationwide's own words,
 * "designed with the benefit of hindsight". That is why their look-back table
 * shows N/A for the 30-year and 25-year columns on every one of these.
 *
 * Nationwide's published look-backs for them are carried in
 * NATIONWIDE_PUBLISHED_LOOKBACKS so a page can show the carrier's own figure
 * rather than computing one we cannot support.
 */
export const MUTUAL_N_VOLATILITY_CONTROL_OPTIONS: IndexOption[] = [
  { id: 'ma-jpm-mercury-plus', product: 'Product II', sourced: true, name: 'J.P. Morgan Mercury Plus', carrier: 'mutual-n',
    index: 'JPM_MERCURY', indexType: 'single', cap: null, floor: 0, participation: 185,
    spread: 0, strategyCharge: 0, bonus: 0.6,
    description: 'Uncapped, 185% participation, plus a 0.6% non-guaranteed strategy credit. Guaranteed participation 65%.',
    availableFrom: 2022 },
  { id: 'ma-bnpp-hfactor-plus', product: 'Product II', sourced: true, name: 'BNPP Global H-Factor Plus', carrier: 'mutual-n',
    index: 'BNPP_HFACTOR', indexType: 'single', cap: null, floor: 0, participation: 235,
    spread: 0, strategyCharge: 0, bonus: 0.6,
    description: 'Uncapped, 235% participation, plus a 0.6% non-guaranteed strategy credit. Guaranteed participation 65%.',
    availableFrom: 2022 },
  { id: 'ma-jpm-mercury-highpar', product: 'Product II', sourced: true, name: 'J.P. Morgan Mercury High Participation', carrier: 'mutual-n',
    index: 'JPM_MERCURY', indexType: 'single', cap: null, floor: 0, participation: 210,
    spread: 0, strategyCharge: 0, bonus: 0,
    description: 'Uncapped, 210% participation, no strategy credit. Guaranteed participation 65%.',
    availableFrom: 2022 },
  { id: 'ma-bnpp-hfactor-highpar', product: 'Product II', sourced: true, name: 'BNPP Global H-Factor High Participation', carrier: 'mutual-n',
    index: 'BNPP_HFACTOR', indexType: 'single', cap: null, floor: 0, participation: 265,
    spread: 0, strategyCharge: 0, bonus: 0,
    description: 'Uncapped, 265% participation, no strategy credit. Guaranteed participation 65%.',
    availableFrom: 2022 },
  { id: 'ma-jpm-mercury-select', product: 'Product II', sourced: true, name: 'J.P. Morgan Mercury High Par Select', carrier: 'mutual-n',
    index: 'JPM_MERCURY', indexType: 'single', cap: null, floor: 0, participation: 250,
    spread: 0, strategyCharge: 1.0, bonus: 0,
    description: 'Uncapped, 250% participation, in exchange for a 1.0% strategy charge (guaranteed maximum 1.5%).',
    availableFrom: 2022 },
  { id: 'ma-bnpp-hfactor-select', product: 'Product II', sourced: true, name: 'BNPP Global H-Factor High Par Select', carrier: 'mutual-n',
    index: 'BNPP_HFACTOR', indexType: 'single', cap: null, floor: 0, participation: 315,
    spread: 0, strategyCharge: 1.0, bonus: 0,
    description: 'Uncapped, 315% participation, in exchange for a 1.0% strategy charge (guaranteed maximum 1.5%).',
    availableFrom: 2022 },
];

/**
 * The carrier's own published look-back rates, FLM-1491AO.10 (02/25), as of
 * 15 January 2025. An ARITHMETIC average of annual rates, excluding the
 * strategy charges on the High-Cap and High-Par Select strategies and the
 * 0.60% Plus credit. N/A where the index did not exist.
 *
 * Two uses. For strategies we can model, this is the external check that the
 * arithmetic is right. For the volatility-control strategies, it is the only
 * figure available at all, and it is the carrier's, not ours.
 */
export interface PublishedLookback {
  readonly optionId: string;
  readonly y30: number | null;
  readonly y25: number | null;
  readonly y20: number | null;
  readonly y15: number | null;
  readonly y10: number | null;
  readonly y5: number | null;
}

export const NATIONWIDE_PUBLISHED_LOOKBACKS: readonly PublishedLookback[] = [
  { optionId: 'am-multi-index',            y30: 7.52,  y25: 6.54, y20: 7.32,  y15: 7.93,  y10: 7.86,  y5: 8.46 },
  { optionId: 'am-sp500-ptp',              y30: 6.98,  y25: 6.47, y20: 7.03,  y15: 7.51,  y10: 7.18,  y5: 7.22 },
  { optionId: 'am-sp500-uncapped',         y30: 8.68,  y25: 7.20, y20: 8.17,  y15: 8.81,  y10: 9.57,  y5: 13.98 },
  { optionId: 'am-highcap-multi',          y30: 9.32,  y25: 7.54, y20: 8.40,  y15: 8.90,  y10: 9.15,  y5: 11.08 },
  { optionId: 'am-highcap-sp500',          y30: 8.42,  y25: 7.74, y20: 8.48,  y15: 9.10,  y10: 8.77,  y5: 9.05 },
  { optionId: 'ma-jpm-mercury-plus',       y30: null,  y25: null, y20: 12.48, y15: 12.79, y10: 9.36,  y5: 3.36 },
  { optionId: 'ma-bnpp-hfactor-plus',      y30: null,  y25: null, y20: 14.48, y15: 15.44, y10: 12.57, y5: 8.58 },
  { optionId: 'ma-jpm-mercury-highpar',    y30: null,  y25: null, y20: 14.16, y15: 14.52, y10: 10.62, y5: 3.82 },
  { optionId: 'ma-bnpp-hfactor-highpar',   y30: null,  y25: null, y20: 16.33, y15: 17.41, y10: 14.17, y5: 9.68 },
  { optionId: 'ma-jpm-mercury-select',     y30: null,  y25: null, y20: 16.86, y15: 17.28, y10: 12.64, y5: 4.55 },
  { optionId: 'ma-bnpp-hfactor-select',    y30: null,  y25: null, y20: 19.41, y15: 20.69, y10: 16.84, y5: 11.51 },
];

/** Whether this repository holds an index series the option can be run on. */
export function hasIndexSeries(option: IndexOption): boolean {
  if (option.components?.length) {
    return option.components.every((c) => Boolean(RAW_INDEX_RETURNS[c.index]));
  }
  return Boolean(RAW_INDEX_RETURNS[option.index]);
}

export function publishedLookback(optionId: string): PublishedLookback | undefined {
  return NATIONWIDE_PUBLISHED_LOOKBACKS.find((l) => l.optionId === optionId);
}

/**
 * MUTUAL COMPANY B — the two-year balanced segment, and the 110% beside it.
 *
 * The first of these is the only option in this file whose terms came off a
 * carrier document rather than out of a band: a 2-year balanced indexed
 * account, 100% S&P 500 price index, 105% participation, 2.50% segment spread,
 * 0% floor, no cap, segments established monthly.
 *
 * The second is the 110%-of-the-S&P parameter people ask for. No document held
 * here offers 110% participation on an ANNUAL uncapped S&P segment — the
 * nearest real thing is a five-year account at 110% current / 105% guaranteed,
 * a different term and a different risk. So it is carried as a comparison
 * parameter, marked unsourced, and labelled as such wherever it is shown.
 */
export const B_MUTUAL_SEGMENT_OPTIONS: IndexOption[] = [
  {
    id: 'bm-sp500-2yr-balanced',
    name: '2-Year Balanced Indexed Account',
    carrier: 'mutual-s',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 105,
    spread: 2.5,
    strategyCharge: 0,
    bonus: 0,
    segmentTermYears: 2,
    product: 'Product II',
    sourced: true,
    sourceNote:
      'Balanced Growth Accumulator II IUL flier, F94327-15 DOFU 10-2022 Rev 08-2023 (2446408). ' +
      'Participation 105%, segment spread 2.50%, 0% floor, segments established monthly.',
    description:
      'Two-year segment on the S&P 500 price index: 105% participation, 2.50% spread over the ' +
      'segment, 0% floor, uncapped. Rates shown per year are the annualized credit of the ' +
      'two-year segment ending that year, not the segment credit itself.',
    availableFrom: 1994,
  },
  {
    id: 'bm-sp500-par110',
    name: '110% S&P 500, annual, uncapped',
    carrier: 'mutual-s',
    index: 'SP500',
    indexType: 'single',
    cap: null,
    floor: 0,
    participation: 110,
    spread: 0,
    strategyCharge: 0,
    bonus: 0,
    segmentTermYears: 1,
    product: null,
    sourced: false,
    sourceNote:
      'Not a carrier quote. No held document offers 110% participation on an annual uncapped ' +
      'S&P segment; the nearest real account is a five-year term at 110% current / 105% ' +
      'guaranteed. Carried as a comparison parameter only.',
    description:
      'Annual point-to-point at 110% participation, no cap, no spread, 0% floor. A parameter ' +
      'set for comparison, not a product anybody has quoted.',
    availableFrom: 1994,
  },
];

export const ALL_INDEX_OPTIONS: IndexOption[] = [
  ...A_MUTUAL_INDEX_OPTIONS,
  ...MUTUAL_N_VOLATILITY_CONTROL_OPTIONS,
  ...A_PLUS_MUTUAL_LIFE_INDEX_OPTIONS,
  ...A_MINUS_MUTUAL_INDEX_OPTIONS,
  ...B_MUTUAL_SEGMENT_OPTIONS,
];

// ─── Crediting Calculation ───────────────────────────────────────────────────

/**
 * Calculate the credited rate for a single year given an index option and raw return.
 * Applies participation, spread, cap, floor, strategy charge, and bonus in the correct order.
 */
export function calculateCreditedRate(option: IndexOption, rawReturn: number): number {
  // Fixed account — always returns the cap (which equals the floor)
  if (option.participation === 0) {
    return option.cap ?? 0;
  }

  // Step 1: Apply participation rate
  let credited = rawReturn * (option.participation / 100);

  // Step 2: Apply spread (deducted before cap/floor)
  credited = credited - option.spread;

  // Step 3: Apply floor (before cap, so floor protects against negative after spread)
  credited = Math.max(credited, option.floor);

  // Step 4: Apply cap
  if (option.cap !== null) {
    credited = Math.min(credited, option.cap);
  }

  // Step 5: Deduct strategy charge
  credited = credited - option.strategyCharge;

  // Step 6: Add bonus
  credited = credited + option.bonus;

  // Final floor: crediting can never go below 0% in an IUL
  return Math.max(credited, 0);
}

/**
 * Calculate the raw blended return for multi-index or hindsight strategies.
 * For 'multiIndex': weighted blend of returns (50% best, 30% second, 20% third).
 * For 'hindsight': 60% best + 40% second-best.
 */
export function calculateBlendedReturn(option: IndexOption, year: number): number {
  if (!option.components || option.components.length === 0) {
    return RAW_INDEX_RETURNS[option.index]?.[year] ?? 0;
  }

  // Get returns for all component indices
  const returns = option.components.map(c => ({
    index: c.index,
    ret: RAW_INDEX_RETURNS[c.index]?.[year] ?? 0,
  }));

  if (option.indexType === 'hindsight') {
    // Sort by return descending, take 60% best + 40% second
    returns.sort((a, b) => b.ret - a.ret);
    return returns[0].ret * 0.60 + (returns[1]?.ret ?? 0) * 0.40;
  }

  if (option.indexType === 'multiIndex') {
    // Sort by return descending, apply 50/30/20 weighting
    returns.sort((a, b) => b.ret - a.ret);
    const weights = [0.50, 0.30, 0.20];
    let blended = 0;
    for (let i = 0; i < returns.length && i < weights.length; i++) {
      blended += returns[i].ret * weights[i];
    }
    return blended;
  }

  // Default: simple weighted average
  let total = 0;
  for (const c of option.components) {
    total += (RAW_INDEX_RETURNS[c.index]?.[year] ?? 0) * c.weight;
  }
  return total;
}

/** The raw index move for one year, blended when the option is a blend. */
function rawReturnForYear(option: IndexOption, year: number): number {
  if (option.indexType === 'multiIndex' || option.indexType === 'hindsight' || option.indexType === 'blended') {
    return calculateBlendedReturn(option, year);
  }
  return RAW_INDEX_RETURNS[option.index]?.[year] ?? 0;
}

/** Years in this option's series, so a segment is never built on absent data. */
function hasYear(option: IndexOption, year: number): boolean {
  if (option.components?.length) {
    return option.components.every((c) => RAW_INDEX_RETURNS[c.index]?.[year] !== undefined);
  }
  return RAW_INDEX_RETURNS[option.index]?.[year] !== undefined;
}

/**
 * The ANNUALIZED credit of the multi-year segment ENDING in `year`.
 *
 * A two-year segment credits once, across two years. Reporting that credit
 * against a single year would read as an annual return and overstate the
 * account by roughly double, so what comes back here is the per-year
 * equivalent — the figure that compares with an annual strategy. The segment
 * credit itself, with its term stated beside it, lives in
 * shared/balancedIndexedAccount.ts.
 *
 * Participation, spread, cap and floor apply ONCE across the whole term, which
 * is what makes a segment different from repeating an annual strategy twice.
 * Near the start of the series a full term does not exist; the segment is then
 * built from the years that do, and annualized over that shorter span.
 */
export function segmentAnnualizedRate(option: IndexOption, year: number): number {
  const term = option.segmentTermYears ?? 1;
  const years: number[] = [];
  for (let k = term - 1; k >= 0; k--) {
    if (hasYear(option, year - k)) years.push(rawReturnForYear(option, year - k));
  }
  if (years.length === 0) return 0;

  const growth = years.reduce((acc, r) => acc * (1 + r / 100), 1);
  const cumulative = (growth - 1) * 100;
  const segmentCredit = calculateCreditedRate(option, cumulative);
  return (Math.pow(1 + segmentCredit / 100, 1 / years.length) - 1) * 100;
}

/**
 * Get the credited rate for an index option in a specific year.
 *
 * For an annual option this is that year's credit. For a multi-year segment it
 * is the annualized credit of the segment ending that year — see
 * segmentAnnualizedRate for why it is never the segment credit itself.
 */
export function getCreditedRate(option: IndexOption, year: number): number {
  if ((option.segmentTermYears ?? 1) > 1) return segmentAnnualizedRate(option, year);
  return calculateCreditedRate(option, rawReturnForYear(option, year));
}

/**
 * Get the full 30-year crediting history for an index option.
 */
export function getCreditingHistory(option: IndexOption, startYear = 1994, endYear = 2025): Array<{ year: number; rawReturn: number; creditedRate: number }> {
  const history: Array<{ year: number; rawReturn: number; creditedRate: number }> = [];

  for (let year = startYear; year <= endYear; year++) {
    const rawReturn = rawReturnForYear(option, year);
    const creditedRate = getCreditedRate(option, year);
    history.push({ year, rawReturn: Math.round(rawReturn * 100) / 100, creditedRate: Math.round(creditedRate * 100) / 100 });
  }

  return history;
}

/**
 * Run a backtested simulation with a given allocation across multiple index options.
 * Returns year-by-year account values.
 */
export interface AllocationEntry {
  optionId: string;
  percentage: number; // 0-100
}

export interface BacktestResult {
  years: Array<{
    year: number;
    startingValue: number;
    weightedCreditRate: number;
    endingValue: number;
    /** Per-option breakdown */
    optionBreakdown: Array<{
      optionId: string;
      optionName: string;
      allocation: number;
      rawReturn: number;
      creditedRate: number;
      contribution: number;
    }>;
  }>;
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  floorProtectedYears: number;
  capLimitedYears: number;
}

export function runBacktest(
  allocations: AllocationEntry[],
  annualPremium: number,
  simulationYears: number,
  startYear: number,
): BacktestResult {
  // Resolve options
  const resolvedAllocations = allocations
    .filter(a => a.percentage > 0)
    .map(a => {
      const option = ALL_INDEX_OPTIONS.find(o => o.id === a.optionId);
      if (!option) throw new Error(`Unknown option: ${a.optionId}`);
      return { option, pct: a.percentage / 100 };
    });

  // Validate allocations sum to 100%
  const totalPct = resolvedAllocations.reduce((s, a) => s + a.pct, 0);
  if (Math.abs(totalPct - 1.0) > 0.01) {
    throw new Error(`Allocations must sum to 100% (got ${(totalPct * 100).toFixed(1)}%)`);
  }

  let accountValue = 0;
  const years: BacktestResult['years'] = [];
  let floorProtectedYears = 0;
  let capLimitedYears = 0;

  for (let i = 0; i < simulationYears; i++) {
    const year = startYear + i;
    const startingValue = accountValue + annualPremium;

    // Calculate weighted credit rate
    let weightedRate = 0;
    const optionBreakdown: BacktestResult['years'][0]['optionBreakdown'] = [];

    let anyFloorProtected = false;
    let anyCapLimited = false;

    for (const { option, pct } of resolvedAllocations) {
      let rawReturn: number;
      if (option.indexType === 'multiIndex' || option.indexType === 'hindsight' || option.indexType === 'blended') {
        rawReturn = calculateBlendedReturn(option, year);
      } else {
        rawReturn = RAW_INDEX_RETURNS[option.index]?.[year] ?? 0;
      }

      const creditedRate = calculateCreditedRate(option, rawReturn);
      const contribution = creditedRate * pct;
      weightedRate += contribution;

      // Track floor/cap events
      if (rawReturn < 0 && creditedRate === 0) anyFloorProtected = true;
      if (option.cap !== null && creditedRate >= option.cap - option.strategyCharge) anyCapLimited = true;

      optionBreakdown.push({
        optionId: option.id,
        optionName: option.name,
        allocation: Math.round(pct * 100),
        rawReturn: Math.round(rawReturn * 100) / 100,
        creditedRate: Math.round(creditedRate * 100) / 100,
        contribution: Math.round(contribution * 100) / 100,
      });
    }

    if (anyFloorProtected) floorProtectedYears++;
    if (anyCapLimited) capLimitedYears++;

    const endingValue = startingValue * (1 + weightedRate / 100);
    accountValue = endingValue;

    years.push({
      year,
      startingValue: Math.round(startingValue),
      weightedCreditRate: Math.round(weightedRate * 100) / 100,
      endingValue: Math.round(endingValue),
      optionBreakdown,
    });
  }

  const totalPremiums = annualPremium * simulationYears;
  const totalReturn = ((accountValue - totalPremiums) / totalPremiums) * 100;
  const annualizedReturn = (Math.pow(accountValue / totalPremiums, 1 / simulationYears) - 1) * 100;

  return {
    years,
    finalValue: Math.round(accountValue),
    totalReturn: Math.round(totalReturn * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    floorProtectedYears,
    capLimitedYears,
  };
}

// ─── Carrier Grouping Helper ─────────────────────────────────────────────────
export function getOptionsByCarrier(carrier: 'mutual-n' | 'mutual-s' | 'illustrative'): IndexOption[] {
  return ALL_INDEX_OPTIONS.filter(o => o.carrier === carrier);
}

export const CARRIERS = [
  { id: 'mutual-n', name: 'Mutual Company N', color: '#1e40af' },
  { id: 'mutual-s', name: 'Mutual Company S', color: '#059669' },
  { id: 'illustrative', name: 'Illustrative (no carrier)', color: '#7c3aed' },
] as const;

/*
 * Three aliases were here — NATIONWIDE_INDEX_OPTIONS, SECURIAN_INDEX_OPTIONS
 * and SYMETRA_INDEX_OPTIONS — each pointing at one of the anonymised option
 * sets above. They were unused, and they asserted that these caps,
 * participation rates and spreads are those three companies' actual products.
 *
 * None of the terms in this file carries a source or an as-of date, so that
 * identification could not be checked, and a cap named as a real carrier's is
 * a factual claim about a real company. Removed rather than left as dead code
 * somebody later trusts.
 *
 * Real carrier terms belong in docs/carriers/, sourced per field, and are
 * being collected — see docs/carriers/INTAKE.md.
 */

export const AVAILABLE_YEARS = Object.keys(RAW_INDEX_RETURNS.SP500).map(Number).sort((a, b) => a - b);
export const MIN_YEAR = AVAILABLE_YEARS[0]; // 1994
export const MAX_YEAR = AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]; // 2025

/** The trunk's index series are sourced; the advisor may cite them. */
export const INDEX_RETURNS_ARE_VERIFIED = true;

/**
 * Provenance the advisor cites when it quotes a backtest. Mirrors the header
 * of this file: ChartRow price-return series, reconciled against the carrier's
 * own published 30-year figures (shared/sp500SeriesAudit.ts runs the check).
 */
export const INDEX_RETURN_SOURCES = {
  basis: "calendar-year price return, excluding dividends",
  verifiedOn: "2026-09-14",
  firstYear: 1994,
  lastYear: 2025,
  perIndex: {
    SP500: "ChartRow 'S&P 500 Returns by Year' (total less dividend), reconciled to the carrier's published 30-year average and cap-year count",
  },
} as const;
