/**
 * Page sources — where a page's numbers come from when the page, not a
 * catalogue engine, carries them.
 *
 * WHY THIS EXISTS. The shell's source footer (EngineSourcesFooter, via
 * shared/engineSources.ts) could only speak for a route in the calculator
 * catalogue whose entry names an engine. Many pages sit outside the
 * catalogue, or compute with an engine the catalogue does not name, or type
 * their own statutory figures into the page (an IRMAA table, an estate
 * exclusion, a bracket schedule). Those pages printed no source at all.
 *
 * One entry per route, keyed by the route exactly as App.tsx declares it
 * (`:param` segments allowed):
 *
 *   - `engines`: engines the page really computes with or reads its figures
 *     from, each of which has a loader in ENGINE_SOURCE_LOADERS. The footer
 *     prints those engines' own source lists.
 *   - `sources`: figures the page itself carries, each with the institution,
 *     the document, the URL and the date read. Where the page's figure does
 *     not match the source, the note says so plainly and the figure is left
 *     for review rather than silently changed. A figure the firm chose is
 *     written as an assumption in words, never passed off as sourced.
 *
 * A route belongs here only when its footer would then tell the truth about
 * the figures on the page. Pages whose figures are carrier product terms
 * with no dated carrier source, or that compute only from what the client
 * types in, are not listed: they stay on the provenance census.
 *
 * server/pageSources.test.ts checks every route exists in App.tsx, every
 * engine has a loader, and every source names a URL and a date.
 */
import type { SourceRef } from "./engineSources";

export type RouteSources = {
  /** Engines behind the page, each a key of ENGINE_SOURCE_LOADERS. */
  engines?: readonly string[];
  /** Figures the page carries itself. */
  sources?: readonly SourceRef[];
};

const READ = "read 2026-09-23";
const LII = (s: string) => `https://www.law.cornell.edu/uscode/text/26/${s}`;

/* ─── Shared references ─── */

const IRS_ESTATE_BY_YEAR: SourceRef = {
  label: "Internal Revenue Service, Estate tax: filing threshold (basic exclusion amount) by year of death — $13,610,000 (2024), $13,990,000 (2025), $15,000,000 (2026)",
  url: "https://www.irs.gov/businesses/small-businesses-self-employed/estate-tax",
  asOf: READ,
};

const IRS_GIFT_FAQ: SourceRef = {
  label: "Internal Revenue Service, Frequently asked questions on gift taxes: annual exclusion per donee $18,000 (2024), $19,000 (2025 and 2026); P.L. 119-21, signed July 4, 2025, sets the 2026 basic exclusion at $15,000,000",
  url: "https://www.irs.gov/businesses/small-businesses-self-employed/frequently-asked-questions-on-gift-taxes",
  asOf: `updated December 2025; ${READ}`,
};

const ESTATE_RATE_SCHEDULE: SourceRef = {
  label: "26 U.S.C. §2001(c), estate and gift tax rate schedule: 18% on the first $10,000 rising to $345,800 plus 40% of the excess over $1,000,000 (Cornell Legal Information Institute)",
  url: LII("2001"),
  asOf: READ,
  note: "Every exclusion since 2011 is above $1,000,000, so the tax on an estate above the exclusion is 40% of the excess; a flat 40% on the excess matches the schedule.",
};

const TCJA_SUNSET_SUPERSEDED =
  "The page's '2026 sunset' figure of about $7,000,000 per person was the pre-2025 projection. P.L. 119-21 set the 2026 exclusion at $15,000,000, indexed, so no sunset occurs. Not changed; flagged for review.";

const INHERITED_TEN_YEAR: SourceRef = {
  label: "26 U.S.C. §401(a)(9)(H), added by the SECURE Act (P.L. 116-94, 2019): most designated beneficiaries other than an eligible designated beneficiary must distribute an inherited account within 10 years of the owner's death (Cornell Legal Information Institute)",
  url: LII("401"),
  asOf: READ,
};

const BRACKETS_2024: SourceRef = {
  label: "Internal Revenue Service, IR-2023-208, 'IRS provides tax inflation adjustments for tax year 2024' (Rev. Proc. 2023-34): 10% to $11,600 / $23,200, 12% to $47,150 / $94,300, 22% to $100,525 / $201,050, 24% to $191,950 / $383,900, 32% to $243,725 / $487,450, 35% to $609,350 / $731,200, 37% above (single / married filing jointly)",
  url: "https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024",
  asOf: `tax year 2024, released 2023-11-09; ${READ}`,
};

const BRACKETS_2026: SourceRef = {
  label: "Internal Revenue Service, 'IRS releases tax inflation adjustments for tax year 2026, including amendments from the One Big Beautiful Bill' (Rev. Proc. 2025-32): 12% over $12,400 / $24,800, 22% over $50,400 / $100,800, 24% over $105,700 / $211,400, 32% over $201,775 / $403,550, 35% over $256,225 / $512,450, 37% over $640,600 / $768,700 (single / married filing jointly)",
  url: "https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill",
  asOf: `tax year 2026, released 2025-10-09; ${READ}`,
};

const DAMODARAN_SP500: SourceRef = {
  label: "Aswath Damodaran, NYU Stern, 'Historical Returns on Stocks, Bonds and Bills', S&P 500 (includes dividends) annual returns, 1928-2025",
  url: "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html",
  asOf: `page updated January 5, 2026; ${READ}`,
};

/* ─── Routes ─── */

export const ROUTE_SOURCES: Record<string, RouteSources> = {
  // The specialty index lists each career path's training years and BLS code from the career engine.
  "/for": { engines: ["shared/careerEngine.ts"] },

  // The fact-finder sections, and the bracket and NIIT options inside them, come from clientFactFinder.
  "/portal/ai-advisor": { engines: ["shared/clientFactFinder.ts"] },

  // The chain builder's money-printing presets and module defaults come from the macro and ultra engines.
  "/portal/chain": { engines: ["shared/macroEngine.ts", "shared/ultraEngine.ts"] },

  // The portfolio dashboard runs runMYGAWaterfall on the MYGA, bank-loan, oil and gas and HELOC defaults.
  "/portal/client-portfolio": {
    engines: ["shared/mygaWaterfall.ts"],
    sources: [
      { label: "Not sourced here: the rates written into the strategy cards (MYGA at 6.25%, oil and gas at 15%, a 90% year-1 deduction) are illustrations; the waterfall itself runs on the engine's defaults (MYGA 7%, 80% year-1 deduction), whose sources are listed above. The IRC section numbers on each card name the rule, not a figure" },
    ],
  },

  // Every figure on the crypto corner is served by the cryptoCycle router from cryptoCycleEngine.
  "/portal/crypto-corner": {
    engines: ["shared/cryptoCycleEngine.ts"],
    sources: [
      {
        label: "26 U.S.C. §168(k) as amended by P.L. 119-21 §70301: 100% bonus depreciation for qualified property acquired after January 19, 2025 (Cornell Legal Information Institute)",
        url: LII("168"),
        asOf: READ,
        note: "The page's '40% first-year depreciation' is the pre-2025 phase-down rate, superseded for property acquired after January 19, 2025. Not changed; flagged for review.",
      },
      { label: "Not sourced here: the spot figures typed into the page (bitcoin about $67,000 and a $126,200 high, a $2.5T market value, gold about $4,783 and silver about $72 an ounce in April 2026) carry no feed or dated source" },
    ],
  },

  // The household wealth page computes with householdWealth.
  "/portal/household-wealth": { engines: ["shared/householdWealth.ts"] },

  // One component serves the three mechanism views; the dossier and the mechanism list are the figures.
  "/portal/mechanism/:slug": { engines: ["shared/mechanismDossiers.ts", "shared/cycleEngine.ts"] },
  "/portal/mechanism/:slug/providers": { engines: ["shared/mechanismDossiers.ts", "shared/cycleEngine.ts"] },
  "/portal/mechanism/:slug/sequences": { engines: ["shared/mechanismDossiers.ts", "shared/cycleEngine.ts"] },

  "/portal/medicare-irmaa": {
    sources: [
      {
        label: "Centers for Medicare & Medicaid Services, 2025 Medicare Parts A & B Premiums and Deductibles fact sheet: Part B standard premium $185.00 a month; Part B and Part D income-related monthly adjustment amount tables",
        url: "https://www.cms.gov/newsroom/fact-sheets/2025-medicare-parts-b-premiums-and-deductibles",
        asOf: `2025 premium year, released 2024-11-08; ${READ}`,
        note: "The page's income thresholds ($106,000 / $133,000 / $167,000 / $200,000 / $500,000 single; $212,000 / $266,000 / $334,000 / $400,000 / $750,000 joint) and the $185.00 base premium match. CMS Part B monthly adjustments are $74.00, $185.00, $295.90, $406.90, $443.90; the page has $70.90, $176.40, $281.90, $387.30, $422.00. CMS Part D monthly adjustments are $13.70, $35.30, $57.00, $78.60, $85.80; the page has $13.70, $35.50, $57.30, $79.00, $85.80. CMS puts MAGI of exactly $500,000 ($750,000 joint) in the top tier. The page's $36.78 Part D base premium is not in this fact sheet; Part D premiums vary by plan. Not changed; flagged for review.",
      },
      {
        label: "Social Security Administration, POMS HI 01101.020, IRMAA Sliding Scale Tables: for the 2026 premium year surcharges begin above $109,000 (single) and $218,000 (joint)",
        url: "https://secure.ssa.gov/poms.nsf/lnx/0601101020",
        asOf: `POMS revision 2025-12-02; ${READ}`,
        note: "The page carries the 2025 table; 2026 is the current premium year and its thresholds and amounts are higher.",
      },
    ],
  },

  "/portal/estate-tax": {
    sources: [
      {
        label: "Computed by shared/estateTaxEngine.ts: the figures on this page come from that engine, which reads the exclusion and the annual gift exclusion from the versioned rule set in shared/taxRules.ts (Rev. Proc. 2024-40 for 2025; Rev. Proc. 2025-32 and P.L. 119-21 for 2026)",
      },
      IRS_ESTATE_BY_YEAR,
      IRS_GIFT_FAQ,
      ESTATE_RATE_SCHEDULE,
      {
        label: "Not corrected yet: the explanatory copy on the '2026 Sunset' tab ('$13.61M per person … sunsets on January 1, 2026, reverting the exemption to approximately $7M') and the gifting copy ('$18,000 per recipient in 2024') predate P.L. 119-21; the computed figures above them use the current rule set. Not changed; flagged for review.",
      },
    ],
  },

  "/portal/estate-flow": {
    sources: [
      { ...IRS_ESTATE_BY_YEAR, note: `The page's 2024 exclusion ($13,610,000 single, $27,220,000 married) matches. ${TCJA_SUNSET_SUPERSEDED}` },
      ESTATE_RATE_SCHEDULE,
      { label: "Assumption: the state estate tax, probate and administration costs, and the per-beneficiary splits are the figures entered on the page or chosen by the firm as examples; no external source" },
    ],
  },

  "/portal/beneficiary-optimization": {
    sources: [
      { ...IRS_ESTATE_BY_YEAR, note: "The page tests estates against the 2024 exclusion of $13,610,000, which matches the IRS figure for 2024; the 2026 figure is $15,000,000. Not changed; flagged for review." },
      ESTATE_RATE_SCHEDULE,
      INHERITED_TEN_YEAR,
    ],
  },

  "/portal/multi-gen-wealth": {
    sources: [
      { ...IRS_ESTATE_BY_YEAR, note: `The page's current-law exclusion of $13,610,000 matches the IRS figure for 2024. ${TCJA_SUNSET_SUPERSEDED}` },
      { ...IRS_GIFT_FAQ, note: "The page's '$18,000/person/year in 2024' matches; the figure for 2025 and 2026 is $19,000." },
      ESTATE_RATE_SCHEDULE,
      INHERITED_TEN_YEAR,
      { label: "Not sourced: the claim that 70% of wealth transfers fail by the second generation and 90% by the third is widely repeated but no primary study is attached here; treat it as anecdote" },
      { label: "Assumption: the growth, inflation and spending rates in the scenarios, and the GRAT figure in the insight panel, are illustrations chosen by the firm; no external source" },
    ],
  },

  "/portal/business-owner": {
    sources: [
      { ...IRS_ESTATE_BY_YEAR, note: "The page's default exclusion of $13,610,000 is the IRS figure for 2024; the 2026 figure is $15,000,000. The slider lets the user set any amount. Not changed; flagged for review." },
      ESTATE_RATE_SCHEDULE,
      { label: "Assumption: the succession-phase costs, executive-benefit costs and the term, whole life, universal life and indexed UL premiums and cash values in the funding table are illustrations chosen by the firm, not carrier quotes; no external source" },
    ],
  },

  "/portal/charitable-giving": {
    sources: [
      {
        label: "26 U.S.C. §170(b)(1)(G): cash gifts to public charities deductible up to 60% of the contribution base, excess carried forward 5 years; §170(b)(1)(C): capital gain property up to 30% (U.S. Code, Office of the Law Revision Counsel)",
        url: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section170&num=0&edition=prelim",
        asOf: READ,
      },
      {
        label: "Internal Revenue Service, Publication 590-B (2024): the maximum annual exclusion for qualified charitable distributions is $105,000; owner must be at least age 70½",
        url: "https://www.irs.gov/pub/irs-prior/p590b--2024.pdf",
        asOf: `tax year 2024; ${READ}`,
        note: "The page's $105,000 is the 2024 figure. IRS Notice 2025-67 raises the limit to $111,000 for 2026. The page tests age 70, not 70½. Not changed; flagged for review.",
      },
      { label: "26 U.S.C. §1411: net investment income tax of 3.8% (Cornell Legal Information Institute)", url: LII("1411"), asOf: READ },
      { label: "26 U.S.C. §664(d)(1)(D) and (d)(2)(D): a charitable remainder trust's remainder must be worth at least 10% of the property placed in trust; the term may not exceed 20 years (Cornell Legal Information Institute)", url: LII("664"), asOf: READ },
      { label: "26 U.S.C. §4942(e): a private foundation's minimum investment return is 5% of its non-charitable-use assets (Cornell Legal Information Institute)", url: LII("4942"), asOf: READ },
      { label: "26 U.S.C. §4940(a): excise tax of 1.39% of a private foundation's net investment income (Cornell Legal Information Institute)", url: LII("4940"), asOf: READ },
      { label: "Assumption: donor-advised fund minimums of $5,000-$25,000, the CRT deduction share and the '$1M+' foundation threshold are the firm's rules of thumb; no external source" },
    ],
  },

  "/portal/hot-income": {
    sources: [
      { ...BRACKETS_2024, note: "The page labels its bracket tables '2026 Federal'; the figures are the 2024 schedules. The 2026 schedules are in the next source. Not changed; flagged for review." },
      BRACKETS_2026,
      { label: "26 U.S.C. §263(c): intangible drilling and development costs of oil and gas wells may be deducted as expenses (Cornell Legal Information Institute)", url: LII("263"), asOf: READ, note: "The statute allows the deduction; the page's 75% intangible share is the firm's assumption." },
      { label: "26 U.S.C. §613A(c): percentage depletion of 15% of gross income for independent producers and royalty owners (Cornell Legal Information Institute)", url: LII("613A"), asOf: READ },
      { label: "Assumption: the 15% annual return is a target chosen by the firm, not a published or guaranteed figure; the 15% tangible share and straight-line 7-year write-off are simplifications chosen by the firm; no external source" },
    ],
  },

  "/portal/iul-vs-roth": {
    sources: [
      {
        label: "Internal Revenue Service, 'Amount of Roth IRA contributions that you can make for 2024': phase-out $146,000-$161,000 (single) and $230,000-$240,000 (married filing jointly); IR-2023-203: IRA limit $7,000 for 2024, plus $1,000 catch-up at 50",
        url: "https://www.irs.gov/retirement-plans/plan-participant-employee/amount-of-roth-ira-contributions-that-you-can-make-for-2024",
        asOf: `tax year 2024; ${READ}`,
        note: "The page's Roth limits are the 2024 figures. For 2026 the IRA limit is $7,500 with a $1,100 catch-up (IRS Notice 2025-67). Not changed; flagged for review.",
      },
      { ...BRACKETS_2024, note: "The page's bracket tables are the 2024 schedules." },
      INHERITED_TEN_YEAR,
      { label: "Not sourced here: the historical S&P 500 series behind the IUL column comes from shared/ibbotsonModel.ts, which describes itself as Ibbotson SBBI data but exports no dated source; the chronic-illness 4% and 'often 10-20x first premium' figures are carrier-dependent illustrations" },
    ],
  },

  "/portal/ibbotson-charts": {
    sources: [
      { ...DAMODARAN_SP500, note: "All 97 annual returns on this page (1929-2025) match this column exactly. The page calls the series 'Ibbotson'; it is Damodaran's S&P 500 total return series." },
      { label: "Assumption: the cap, floor and participation rates are inputs chosen on the page, not any carrier's current terms" },
    ],
  },

  "/portal/market-stress-test": {
    sources: [
      { label: "Federal Reserve History, 'Stock Market Crash of 1987': on October 19, 1987 the Dow Jones Industrial Average fell 22.6%", url: "https://www.federalreservehistory.org/essays/stock-market-crash-of-1987", asOf: READ },
      { label: "LPL Financial, Weekly Market Commentary, March 22, 2021: the S&P 500 fell 33.9% from the February 19, 2020 peak to the March 23, 2020 low", url: "https://www.lpl.com/content/dam/lpl-www/documents/asset-library/weekly-market-commentary-032221.pdf", asOf: `published 2021-03-22; ${READ}` },
      { ...DAMODARAN_SP500, note: "Calendar-year returns: S&P 500 -9.03% (2000), -11.85% (2001), -21.97% (2002), -36.55% (2008), -18.04% (2022); 10-year Treasury bond -17.83% in 2022." },
      { label: "Federal Reserve History, 'Oil Shock of 1973-74': OAPEC embargo from October 1973; the oil price rose from $2.90 a barrel to $11.65 in January 1974", url: "https://www.federalreservehistory.org/essays/oil-shock-of-1973-74", asOf: READ },
      { label: "Not sourced here: the peak-to-trough figures of 56.8% (2007-09), 49% (2000-02), 48% (1973-74) and NASDAQ 78%, and the durations and recovery times, are widely published but no primary source is attached yet" },
      { label: "Assumption: each scenario's impact by asset class (for example equities -50%, bonds +5% in 2008) and the two custom scenarios are the firm's round estimates, not measured returns; no external source" },
    ],
  },

  "/portal/client-snapshot": {
    sources: [
      { label: "Social Security Administration, Delayed Retirement Credits: 8% a year for people born in 1943 or later", url: "https://www.ssa.gov/benefits/retirement/planner/delayret.html", asOf: READ },
      {
        label: "Social Security Administration, Starting Your Retirement Benefits Early: with a full retirement age of 67, a benefit claimed at 62 is 70% of the full amount",
        url: "https://www.ssa.gov/benefits/retirement/planner/agereduction.html",
        asOf: READ,
        note: "70% at 62 against 124% at 70 (three years of 8% credits) is a 77% increase, the page's figure.",
      },
      { label: "Assumption: the loan and investment rate bands by FICO tier, and the '20 points saves 0.25-0.50%' rule, are the firm's rules of thumb, not a lender's rate sheet; no external source" },
    ],
  },
};

/** Route patterns that carry page-level sources or engine mappings. */
export const ROUTES_WITH_PAGE_SOURCES: readonly string[] = Object.keys(ROUTE_SOURCES).sort();
