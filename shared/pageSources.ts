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

/* ─── Shared references (portal pages HotIncome to WithdrawalSequencing) ─── */

const IRS_TY2023_RATES: SourceRef = {
  label: "IRS, Rev. Proc. 2022-38 (tax year 2023), section 3.01 tax rate tables: single 10% to $11,000, 12% to $44,725, 22% to $95,375, 24% to $182,100, 32% to $231,250, 35% to $578,125",
  url: "https://www.irs.gov/pub/irs-drop/rp-22-38.pdf",
  asOf: READ,
};

const IRS_TY2024_ITEMS: SourceRef = {
  label: "IRS, IR-2023-208 and Rev. Proc. 2023-34 (tax year 2024): 37% above $609,350 single ($731,200 joint), 35% above $243,725 ($487,450 joint); estate basic exclusion $13,610,000; annual gift exclusion $18,000",
  url: "https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024",
  asOf: READ,
};

const IRS_TY2025_RATES: SourceRef = {
  label: "IRS, Rev. Proc. 2024-40 (tax year 2025), section 2.01 tax rate tables: single 10% to $11,925, 12% to $48,475, 22% to $103,350, 24% to $197,300, 32% to $250,525, 35% to $626,350; basic exclusion $13,990,000; annual gift exclusion $19,000",
  url: "https://www.irs.gov/pub/irs-drop/rp-24-40.pdf",
  asOf: READ,
};

const IRS_TY2026_ITEMS: SourceRef = {
  label: "IRS, IR-2025-103 (tax year 2026, Rev. Proc. 2025-32, including the One, Big, Beautiful Bill, P.L. 119-21): 12% above $12,400 single ($24,800 joint) up to 37% above $640,600 ($768,700 joint); estate basic exclusion $15,000,000; annual gift exclusion $19,000",
  url: "https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill",
  asOf: "released 2025-10-09, " + READ,
  note: "P.L. 119-21 made the 2018 rate structure permanent, so the 'TCJA sunset' that several pages still model no longer happens under current law.",
};

const IRS_2024_RETIREMENT_LIMITS: SourceRef = {
  label: "IRS, IR-2023-203 (2024 limits): IRA $7,000 ($1,000 catch-up at 50); Roth IRA phase-out $146,000 to $161,000 single, $230,000 to $240,000 joint",
  url: "https://www.irs.gov/newsroom/401k-limit-increases-to-23000-for-2024-ira-limit-rises-to-7000",
  asOf: READ,
};

const IRS_2025_RETIREMENT_LIMITS: SourceRef = {
  label: "IRS, IR-2024-285 and Notice 2024-80 (2025 limits): 401(k) deferral $23,500, catch-up $7,500; IRA $7,000",
  url: "https://www.irs.gov/newsroom/401k-limit-increases-to-23500-for-2025-ira-limit-remains-7000",
  asOf: READ,
};

const IRS_2026_RETIREMENT_LIMITS: SourceRef = {
  label: "IRS, IR-2025-111 and Notice 2025-67 (2026 limits): 401(k) deferral $24,500, catch-up $8,000; IRA $7,500 ($1,100 catch-up); Roth IRA phase-out begins at $153,000 single",
  url: "https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500",
  asOf: "released 2025-11-13, " + READ,
};

const UNIFORM_LIFETIME_TABLE: SourceRef = {
  label: "26 CFR 1.401(a)(9)-9(c), Uniform Lifetime Table (distribution years from 2022): distribution period 27.4 at age 72, 26.5 at age 73",
  url: "https://www.law.cornell.edu/cfr/text/26/1.401(a)(9)-9",
  asOf: READ,
};

const RMD_AGE_STATUTE: SourceRef = {
  label: "IRC section 401(a)(9)(C), required beginning date: age 73 for those who reach 72 after 2022 (SECURE 2.0 Act section 107); section 401(a)(9)(H), the 10-year rule for most non-spouse beneficiaries (SECURE Act 2019)",
  url: "https://www.law.cornell.edu/uscode/text/26/401",
  asOf: READ,
};

const CAPITAL_LOSS_LIMIT: SourceRef = {
  label: "IRC section 1211(b): net capital losses offset up to $3,000 of ordinary income a year ($1,500 married filing separately); section 1212(b) carries the rest forward",
  url: "https://www.law.cornell.edu/uscode/text/26/1211",
  asOf: READ,
};

const LONG_TERM_GAINS_RATES: SourceRef = {
  label: "IRC section 1(h): long-term capital gains taxed at 0%, 15% or 20% by taxable income",
  url: "https://www.law.cornell.edu/uscode/text/26/1",
  asOf: READ,
};

const CMS_IRMAA_2025: SourceRef = {
  label: "Centers for Medicare & Medicaid Services, 2025 Medicare Parts A & B Premiums and Deductibles fact sheet: Part B standard premium $185.00; income-related monthly adjustments $74.00, $185.00, $295.90, $406.90, $443.90 above $106,000, $133,000, $167,000, $200,000 and at or above $500,000 single ($212,000 / $266,000 / $334,000 / $400,000 / $750,000 joint)",
  url: "https://www.cms.gov/newsroom/fact-sheets/2025-medicare-parts-b-premiums-and-deductibles",
  asOf: "released 2024-11-08, " + READ,
};

const SSA_FULL_RETIREMENT_AGE: SourceRef = {
  label: "Social Security Administration, Retirement Age and Benefit Reduction: full retirement age 66 for births 1943-1954, rising two months a year to 67 for births 1960 and later",
  url: "https://www.ssa.gov/benefits/retirement/planner/agereduction.html",
  asOf: READ,
};

const SSA_2025_FACTS: SourceRef = {
  label: "Social Security Administration, 2025 Social Security Changes fact sheet: 2.5% COLA; taxable maximum $176,100; earnings test $23,400 a year under full retirement age ($1 withheld per $2) and $62,160 in the year of reaching it ($1 per $3); maximum benefit at full retirement age $4,018 a month",
  url: "https://www.ssa.gov/news/press/factsheets/colafacts2025.pdf",
  asOf: READ,
};

const SSA_EARNINGS_TEST_TABLE: SourceRef = {
  label: "Social Security Administration, Office of the Chief Actuary, Exempt Amounts Under the Earnings Test: $24,480 and $65,160 for 2026",
  url: "https://www.ssa.gov/oact/cola/rtea.html",
  asOf: READ,
};

const SS_BENEFIT_TAXATION: SourceRef = {
  label: "IRC section 86(c): base amounts $25,000 single and $32,000 joint (up to 50% of benefits taxable), adjusted base amounts $34,000 and $44,000 (up to 85%); not indexed",
  url: "https://www.law.cornell.edu/uscode/text/26/86",
  asOf: READ,
};

const NAIC_AG49A: SourceRef = {
  label: "NAIC, Actuarial Guideline XLIX-A as revised (adopted 2023-02-24, effective for policies sold on or after 2023-05-01, often called AG 49-B): the Benchmark Index Account may not be illustrated above the lesser of the average of its 25-year geometric lookback rates and 145% of the net investment earnings rate; other index accounts may not illustrate above it",
  url: "https://content.naic.org/sites/default/files/committees-pending-action-actuarial-guideline-xlix-a-230224.pdf",
  asOf: READ,
  note: "The guideline sets a formula per product, not a fixed percentage. A carrier's maximum illustrated rate is on its own illustration.",
};

const NBER_CYCLES: SourceRef = {
  label: "National Bureau of Economic Research, US Business Cycle Expansions and Contractions: recessions November 1973 to March 1975, March to November 2001, December 2007 to June 2009, February to April 2020",
  url: "https://www.nber.org/research/data/us-business-cycle-expansions-and-contractions",
  asOf: READ,
};

const IRS_HSA_2026: SourceRef = {
  label: "IRS, Rev. Proc. 2025-19: 2026 HSA contribution limits $4,400 self-only and $8,750 family",
  url: "https://www.irs.gov/pub/irs-drop/rp-25-19.pdf",
  asOf: READ,
};

const QCD_STATUTE: SourceRef = {
  label: "IRC section 408(d)(8): qualified charitable distributions from an IRA at 70½ or older, $100,000 a year indexed for inflation from 2024 (SECURE 2.0 Act section 307)",
  url: "https://www.law.cornell.edu/uscode/text/26/408",
  asOf: READ,
};

const MEDICAL_FLOOR: SourceRef = {
  label: "IRC section 213(a): medical expenses deductible above 7.5% of adjusted gross income",
  url: "https://www.law.cornell.edu/uscode/text/26/213",
  asOf: READ,
};

const SALT_STATUTE: SourceRef = {
  label: "IRC section 164(b): the cap on the itemized deduction for state and local taxes, $10,000 for 2018-2024, raised from 2025 by P.L. 119-21",
  url: "https://www.law.cornell.edu/uscode/text/26/164",
  asOf: READ,
};

const RESIDENTIAL_DEPRECIATION: SourceRef = {
  label: "IRC section 168(c): residential rental property is depreciated over 27.5 years",
  url: "https://www.law.cornell.edu/uscode/text/26/168",
  asOf: READ,
};

/* ─── Assumption lines ─── */

/** Every page below carries a RecommendationSummary block with a fixed dollar figure. */
function illustrativeBlock(dollarBenefit: number): SourceRef {
  return {
    label: `Assumption: the 'recommendation summary' and 'do nothing' blocks near the top of the page show fixed illustrative figures typed into the page (a $${dollarBenefit.toLocaleString("en-US")} benefit and the paired before-and-after rows); they are not computed from the client's inputs and have no external source`,
  };
}

const USER_INPUTS: SourceRef = {
  label: "The calculator's other figures are the inputs entered on the page (income, balances, ages, rates) and arithmetic on them; every default input is the firm's example, not a published figure",
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

  // The household wealth page computes with householdWealth; its tax panel runs taxBracketEngine.
  "/portal/household-wealth": {
    engines: ["shared/householdWealth.ts", "shared/taxBracketEngine.ts"],
    sources: [illustrativeBlock(550000)],
  },

  // One component serves the three mechanism views; the dossier and the mechanism list are the figures.
  "/portal/mechanism/:slug": {
    engines: ["shared/mechanismDossiers.ts", "shared/cycleEngine.ts"],
    sources: [
      { label: "Assumption: the role-fitness scores, ordering rules and plausibility figures shown for each sequence come from shared/sequenceOrderings.ts and are the firm's judgement; no external source" },
    ],
  },
  "/portal/mechanism/:slug/providers": { engines: ["shared/mechanismDossiers.ts", "shared/cycleEngine.ts"] },
  "/portal/mechanism/:slug/sequences": { engines: ["shared/mechanismDossiers.ts", "shared/cycleEngine.ts"] },

  "/portal/medicare-irmaa": {
    engines: ["shared/taxBracketEngine.ts"],
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
      { label: "Assumption: 3% inflation and a 24% tax rate as default inputs, chosen by the firm; no external source" },
      illustrativeBlock(200000),
      USER_INPUTS,
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
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { ...IRS_ESTATE_BY_YEAR, note: `The page's current-law exclusion of $13,610,000 matches the IRS figure for 2024. ${TCJA_SUNSET_SUPERSEDED}` },
      { ...IRS_GIFT_FAQ, note: "The page's '$18,000/person/year in 2024' matches; the figure for 2025 and 2026 is $19,000." },
      ESTATE_RATE_SCHEDULE,
      INHERITED_TEN_YEAR,
      { label: "Not sourced: the claim that 70% of wealth transfers fail by the second generation and 90% by the third is widely repeated but no primary study is attached here; treat it as anecdote" },
      { label: "Assumption: the growth, inflation and spending rates in the scenarios, and the GRAT figure in the insight panel, are illustrations chosen by the firm; no external source" },
      { label: "Assumption: the 'aggressive' policy option's 45% estate tax rate is a hypothetical chosen by the firm, not current law" },
      illustrativeBlock(200000),
      USER_INPUTS,
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
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { ...BRACKETS_2024, note: "The page labels its bracket tables '2026 Federal'; the figures are the 2024 schedules. The 2026 schedules are in the next source. Not changed; flagged for review." },
      BRACKETS_2026,
      { label: "26 U.S.C. §263(c): intangible drilling and development costs of oil and gas wells may be deducted as expenses (Cornell Legal Information Institute)", url: LII("263"), asOf: READ, note: "The statute allows the deduction; the page's 75% intangible share is the firm's assumption." },
      { label: "26 U.S.C. §613A(c): percentage depletion of 15% of gross income for independent producers and royalty owners (Cornell Legal Information Institute)", url: LII("613A"), asOf: READ },
      { label: "Assumption: the 15% annual return is a target chosen by the firm, not a published or guaranteed figure; the 15% tangible share and straight-line 7-year write-off are simplifications chosen by the firm; no external source" },
      illustrativeBlock(420000),
      USER_INPUTS,
    ],
  },

  "/portal/iul-vs-roth": {
    engines: ["shared/ibbotsonModel.ts", "shared/taxBracketEngine.ts"],
    sources: [
      {
        label: "Internal Revenue Service, 'Amount of Roth IRA contributions that you can make for 2024': phase-out $146,000-$161,000 (single) and $230,000-$240,000 (married filing jointly); IR-2023-203: IRA limit $7,000 for 2024, plus $1,000 catch-up at 50",
        url: "https://www.irs.gov/retirement-plans/plan-participant-employee/amount-of-roth-ira-contributions-that-you-can-make-for-2024",
        asOf: `tax year 2024; ${READ}`,
        note: "The page's Roth limits are the 2024 figures. For 2026 the IRA limit is $7,500 with a $1,100 catch-up (IRS Notice 2025-67). Not changed; flagged for review.",
      },
      { ...BRACKETS_2024, note: "The page's bracket tables are the 2024 schedules. The tax panel uses 2026. Not changed; flagged for review." },
      IRS_2026_RETIREMENT_LIMITS,
      INHERITED_TEN_YEAR,
      { label: "Not sourced here: the chronic-illness 4% and 'often 10-20x first premium' figures are carrier-dependent illustrations. The historical S&P 500 series behind the IUL column is sourced by shared/ibbotsonModel.ts, listed above" },
      { label: "Assumption: 7.5% IUL crediting rate default, an assumed rate chosen by the firm, not a carrier illustration" },
      illustrativeBlock(185000),
      USER_INPUTS,
    ],
  },

  "/portal/ibbotson-charts": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { ...DAMODARAN_SP500, note: "All 97 annual returns on this page (1929-2025) match this column exactly. The page calls the series 'Ibbotson'; it is Damodaran's S&P 500 total return series, not the Morningstar SBBI Yearbook, whose figures differ slightly (for example -37.00% for 2008)." },
      { label: "Assumption: the cap, floor and participation rates are inputs chosen on the page, not any carrier's current terms" },
      illustrativeBlock(280000),
    ],
  },

  "/portal/market-stress-test": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Federal Reserve History, 'Stock Market Crash of 1987': on October 19, 1987 the Dow Jones Industrial Average fell 22.6%", url: "https://www.federalreservehistory.org/essays/stock-market-crash-of-1987", asOf: READ },
      { label: "LPL Financial, Weekly Market Commentary, March 22, 2021: the S&P 500 fell 33.9% from the February 19, 2020 peak to the March 23, 2020 low", url: "https://www.lpl.com/content/dam/lpl-www/documents/asset-library/weekly-market-commentary-032221.pdf", asOf: `published 2021-03-22; ${READ}` },
      { ...DAMODARAN_SP500, note: "Calendar-year returns: S&P 500 -9.03% (2000), -11.85% (2001), -21.97% (2002), -36.55% (2008), -18.04% (2022); 10-year Treasury bond -17.83% in 2022." },
      { label: "Federal Reserve History, 'Oil Shock of 1973-74': OAPEC embargo from October 1973; the oil price rose from $2.90 a barrel to $11.65 in January 1974", url: "https://www.federalreservehistory.org/essays/oil-shock-of-1973-74", asOf: READ },
      { label: "Not sourced here: the peak-to-trough figures of 56.8% (2007-09), 49% (2000-02), 48% (1973-74) and NASDAQ 78%, and the durations and recovery times, are widely published but no primary source is attached yet" },
      NBER_CYCLES,
      { label: "Assumption: each scenario's impact by asset class (for example equities -50%, bonds +5% in 2008) and the two custom scenarios are the firm's round estimates, not measured returns; no external source" },
      { label: "Assumption: the portfolio split (for example 60% equities in taxable and IRA accounts) is a fixed allocation chosen by the firm, not the client's holdings" },
      illustrativeBlock(280000),
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

  "/portal/house-recycling": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      NAIC_AG49A,
      { label: "Assumption: the policy credits 7.4% a year (POLICY_RETURN), an assumed rate chosen by the firm; the page's claim that it is 'within AG 49' depends on the product, since AG 49-A sets each product's maximum by formula" },
      { label: "Assumption: HELOC rate choices of 0.5% to 2.0% are the firm's illustrative spread choices, not quoted lender rates" },
      illustrativeBlock(550000),
      USER_INPUTS,
    ],
  },

  "/portal/illustration-compare": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "The policy values compared on this page are read from the carrier illustrations the advisor uploads; the page adds no figures of its own beyond the tax panel" },
      illustrativeBlock(150000),
    ],
  },

  "/portal/income-gap": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Assumption: healthcare inflation 5.5% and Social Security COLA 2.5% default inputs, chosen by the firm; the 2.5% matches the 2025 COLA in the SSA fact sheet below, not a forecast" },
      SSA_2025_FACTS,
      illustrativeBlock(420000),
      USER_INPUTS,
    ],
  },

  "/portal/income-timeline": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Assumption: 3% inflation and a 22% tax rate as default inputs, chosen by the firm; no external source" },
      illustrativeBlock(420000),
      USER_INPUTS,
    ],
  },

  "/portal/inflation": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Assumption: the scenario inflation rates 2%, 3%, 4%, 5%, 6% and 7% and their volatility bands are round figures chosen by the firm to span outcomes; they are not a CPI series or forecast" },
      illustrativeBlock(200000),
      USER_INPUTS,
    ],
  },

  "/portal/scenario-play": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { ...UNIFORM_LIFETIME_TABLE, note: "The page divides by 27.4 for a first RMD at 73; 27.4 is the age-72 period, the age-73 period is 26.5. Not changed; flagged for review." },
      RMD_AGE_STATUTE,
      { label: "Assumption: IUL income = 6.5% of cash value, Roth income = 4% of balance, and 6.7% more Social Security per year of delay past 62, all chosen by the firm; no external source. SSA's actual reductions and delayed credits depend on birth year (see the full-retirement-age table)" },
      SSA_FULL_RETIREMENT_AGE,
      illustrativeBlock(280000),
      USER_INPUTS,
    ],
  },

  "/portal/policy-review": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "The policy details reviewed on this page are the ones the advisor enters or uploads; the gap scores (100 / 75 / 45 / 15 by severity) are the firm's scale, not a published standard" },
      illustrativeBlock(350000),
    ],
  },

  "/portal/portfolio-drift": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Sample data: the tax lots and rebalancing history shown before a client's accounts are loaded are demonstration rows typed into the page, not real holdings" },
      LONG_TERM_GAINS_RATES,
      illustrativeBlock(280000),
      USER_INPUTS,
    ],
  },

  "/portal/predictive-analytics": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { ...IRS_TY2024_ITEMS, note: "The estate insight uses the 2024 exclusion of $13,610,000; for 2026 it is $15,000,000 (IR-2025-103). Not changed; flagged for review." },
      IRS_TY2026_ITEMS,
      ESTATE_RATE_SCHEDULE,
      { label: "Assumption: IUL income = 6.5% of cash value and the success probabilities shown are the firm's model outputs on assumed rates; no external source" },
      illustrativeBlock(200000),
      USER_INPUTS,
    ],
  },

  "/portal/quick-quote": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Assumption: the quote's cost of insurance (0.1% of the death benefit, rising 5% a year), $120 admin fee plus 5% premium load, 60% guaranteed-value ratio and surrender scale are rough figures chosen by the firm, not any carrier's charges; the carrier's illustration governs" },
      { label: "Assumption: 6% assumed return, 2.5% inflation and 5% loan rate default inputs, chosen by the firm; no external source" },
      illustrativeBlock(200000),
      USER_INPUTS,
    ],
  },

  "/portal/real-estate-mogul": {
    engines: ["shared/ibbotsonModel.ts", "shared/taxBracketEngine.ts"],
    sources: [
      RESIDENTIAL_DEPRECIATION,
      { label: "Assumption: 7% IUL rate, 2.5% inflation, 15% oil and gas cash yield and a 5% IUL draw from year 10, all default inputs chosen by the firm; no external source" },
      illustrativeBlock(800000),
      USER_INPUTS,
    ],
  },

  "/portal/recommendations": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      CAPITAL_LOSS_LIMIT,
      { ...RMD_AGE_STATUTE, note: "The page says RMDs begin at 72; since 2023 they begin at 73. Not changed; flagged for review." },
      { label: "Sample data: the action plan dates (2023-2024) and the risk metrics table are demonstration rows typed into the page, not a client's record" },
      illustrativeBlock(600000),
    ],
  },

  "/portal/retirement-guardrails": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { ...UNIFORM_LIFETIME_TABLE, note: "The page approximates the table as 27.4 minus one per year from age 73; the published periods are 26.5 at 73, 25.5 at 74 and so on, and they shrink by less than one a year at older ages. Not changed; flagged for review." },
      RMD_AGE_STATUTE,
      { label: "Assumption: a 4% initial withdrawal default and the guardrail percentages are inputs; the defaults are the firm's examples" },
      illustrativeBlock(420000),
      USER_INPUTS,
    ],
  },

  "/portal/reverse-heloc": {
    engines: ["shared/reverseHeloc.ts", "shared/taxBracketEngine.ts"],
    sources: [
      illustrativeBlock(550000),
    ],
  },

  "/portal/saved-scenarios": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Assumption: the scenario projections (4% base growth plus up to 8% for aggression, a 2% leverage boost, 4% income draw, and the optimistic and pessimistic bands) are formulas chosen by the firm; no external source" },
      illustrativeBlock(280000),
      USER_INPUTS,
    ],
  },

  "/portal/scenarios": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Assumption: equity return 3% plus up to 7% by aggression, fixed income 2% to 4%, an 8% alternatives premium, a 5% loan rate and 5% extra principal are formulas chosen by the firm; no external source" },
      illustrativeBlock(280000),
      USER_INPUTS,
    ],
  },

  "/portal/scenario-side-by-side": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "The scenarios compared are the ones saved by the advisor; their figures come from the scenario pages and their stated assumptions" },
      illustrativeBlock(280000),
    ],
  },

  "/portal/social-security": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { ...SSA_FULL_RETIREMENT_AGE, note: "The page's full-retirement-age table matches SSA for births 1943 to 1960 and later." },
      { ...SSA_2025_FACTS, note: "The page's 2025 wage base, earnings-test amounts and maximum benefit match this fact sheet. They are 2025 figures; the 2026 earnings-test amounts are in the SSA table below." },
      SSA_EARNINGS_TEST_TABLE,
      SS_BENEFIT_TAXATION,
      { label: "Assumption: a 2.5% COLA every year (the 2025 figure used as a constant) and a 22% marginal rate on taxable benefits, chosen by the firm; no external source" },
      illustrativeBlock(420000),
      USER_INPUTS,
    ],
  },

  "/portal/strategy": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Sample data: the monthly chart series on this page (uv / pv / amt) are placeholder rows typed into the page; they carry no meaning" },
      illustrativeBlock(600000),
    ],
  },

  "/portal/succession-planning": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { label: "Assumption: the valuation split (for example AUM fees as 75% of revenue) and the other defaults are the firm's examples; no external source" },
      illustrativeBlock(800000),
      USER_INPUTS,
    ],
  },

  "/portal/tax-advantaged-growth": {
    engines: ["shared/ibbotsonModel.ts", "shared/taxBracketEngine.ts"],
    sources: [
      { ...IRS_2025_RETIREMENT_LIMITS, note: "The page uses the 2025 limits ($23,500 401(k), $7,500 catch-up, $7,000 Roth IRA). The 2026 limits are in IR-2025-111 below." },
      IRS_2026_RETIREMENT_LIMITS,
      RMD_AGE_STATUTE,
      illustrativeBlock(185000),
      USER_INPUTS,
    ],
  },

  "/portal/tax-loss-harvesting": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      CAPITAL_LOSS_LIMIT,
      LONG_TERM_GAINS_RATES,
      { label: "Sample data: the holdings (AAPL, TSLA, AMZN, NVDA, VTI and others) and the harvest history are demonstration rows typed into the page, not a client's positions or market prices" },
      illustrativeBlock(185000),
    ],
  },

  "/portal/tax-opportunities": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { ...IRS_TY2025_RATES, note: "The page's bracket table is the 2025 single table. The tax panel uses 2026." },
      IRS_TY2026_ITEMS,
      { ...SALT_STATUTE, note: "The page applies a $10,000 state and local tax cap; that was the 2018-2024 cap. Not changed; flagged for review." },
      MEDICAL_FLOOR,
      { ...QCD_STATUTE, note: "The page's $105,000 is the 2024 indexed amount; the limit is indexed each year. Not changed; flagged for review." },
      CAPITAL_LOSS_LIMIT,
      { ...IRS_HSA_2026, note: "The page says '$4,300 individual / $8,550 family in 2026'; those are the 2025 limits. Not changed; flagged for review." },
      RMD_AGE_STATUTE,
      { label: "Assumption: RMDs estimated at 4% of the IRA balance, a round figure chosen by the firm; the actual first RMD is the balance divided by the Uniform Lifetime Table period (26.5 at 73, about 3.8%)" },
      illustrativeBlock(185000),
      USER_INPUTS,
    ],
  },

  "/portal/tax-return-upload": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      { ...IRS_TY2023_RATES, note: "The page's bracket chart uses this 2023 single table (the $1,000,000 top is a chart limit, not a threshold). Figures extracted from the uploaded return are the client's own." },
      IRS_TY2026_ITEMS,
      illustrativeBlock(185000),
    ],
  },

  "/portal/time-machine-ag49": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      NAIC_AG49A,
      { label: "Assumption: the 6.5% crediting rate default is an input chosen by the firm; it is not a carrier's AG 49-A maximum" },
      illustrativeBlock(200000),
      USER_INPUTS,
    ],
  },

  "/portal/time-machine-calculator": {
    engines: ["shared/timeMachineEngine.ts", "shared/taxBracketEngine.ts"],
    sources: [
      NAIC_AG49A,
      illustrativeBlock(200000),
      USER_INPUTS,
    ],
  },

  "/portal/time-machine-method": {
    engines: ["shared/timeMachineEngine.ts", "shared/taxBracketEngine.ts"],
    sources: [
      { ...NAIC_AG49A, note: "The page says 'AG 49-B limits illustrated rates to the lesser of 6.5% or the Benchmark Index Account rate'. The guideline sets no fixed 6.5% ceiling; its limit is the formula above, product by product. Not changed; flagged for review." },
      illustrativeBlock(200000),
      USER_INPUTS,
    ],
  },

  "/portal/withdrawal-sequencing": {
    engines: ["shared/taxBracketEngine.ts"],
    sources: [
      IRS_TY2026_ITEMS,
      { label: "The page's 'current' bracket thresholds ($22,000 / $89,075 / $170,050 / $215,950) do not match any one IRS year: $22,000 is the 2023 joint 10% ceiling (Rev. Proc. 2022-38) and $89,075 / $170,050 / $215,950 are the 2022 single 22% / 24% / 32% ceilings. Its 'sunset' schedule (15% / 25% / 28%) models a reversion that P.L. 119-21 cancelled. Not changed; flagged for review", url: "https://www.irs.gov/pub/irs-drop/rp-22-38.pdf", asOf: READ },
      { ...RMD_AGE_STATUTE, note: "The page's RMD age default of 73 matches the statute." },
      illustrativeBlock(420000),
      USER_INPUTS,
    ],
  },
};

/** Route patterns that carry page-level sources or engine mappings. */
export const ROUTES_WITH_PAGE_SOURCES: readonly string[] = Object.keys(ROUTE_SOURCES).sort();
