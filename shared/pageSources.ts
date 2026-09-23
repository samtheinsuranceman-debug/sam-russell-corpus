/**
 * Page sources — figures a page types in itself, sourced route by route.
 *
 * WHY THIS EXISTS. The shell's footer (EngineSourcesFooter) prints the source
 * list of the engine behind a route. Many portal pages also carry their own
 * typed-in tables: a bracket schedule, an IRMAA table, a full-retirement-age
 * table, a list of market crashes. Those numbers belong to no engine, so no
 * engine's list covers them. This file names, for each such route, the
 * primary source of each real-world figure the page shows, the date it was
 * read, and where the page disagrees with that source.
 *
 * The rule is the one the engines follow: a disagreement is recorded, not
 * silently corrected, so a reviewer can see what the page actually prints.
 * Anything no one publishes (a default growth rate, an illustrative dollar
 * figure) is declared an assumption in words, never left bare.
 *
 * Keys are the router's paths (client/src/App.tsx). The footer prints these
 * after the engines' own sources (shared/engineSources.ts, loadRouteSources).
 */
import type { SourceRef } from "./engineSources";

const READ = "read 2026-09-23";

// ─── Shared primary sources ────────────────────────────────────────────────

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

const ESTATE_TAX_RATE: SourceRef = {
  label: "IRC section 2001(c): the estate tax rate schedule, 40% on amounts over $1,000,000 (the rate that applies above the exclusion)",
  url: "https://www.law.cornell.edu/uscode/text/26/2001",
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

const DAMODARAN_SP500: SourceRef = {
  label: "Aswath Damodaran, NYU Stern, 'Historical Returns on Stocks, Bonds and Bills: 1928-2025' (histretSP), S&P 500 including dividends: -8.30% (1929), -25.12% (1930), -43.84% (1931), 52.56% (1954), -36.55% (2008), -18.04% (2022), 26.06% (2023), 24.88% (2024), 17.78% (2025)",
  url: "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html",
  asOf: "page updated January 5, 2026; " + READ,
};

const FED_HISTORY_1987: SourceRef = {
  label: "Federal Reserve History, 'Stock Market Crash of 1987': on October 19, 1987 the Dow Jones Industrial Average fell 22.6%",
  url: "https://www.federalreservehistory.org/essays/stock-market-crash-of-1987",
  asOf: READ,
};

const FED_HISTORY_1973: SourceRef = {
  label: "Federal Reserve History, 'Oil Shock of 1973-74': the OAPEC embargo from October 1973 nearly quadrupled the oil price",
  url: "https://www.federalreservehistory.org/essays/oil-shock-of-1973-74",
  asOf: READ,
};

const LPL_COVID: SourceRef = {
  label: "LPL Financial, Weekly Market Commentary, March 22, 2021: the S&P 500 fell 33.9% from the February 19, 2020 peak to the March 23, 2020 low",
  url: "https://www.lpl.com/content/dam/lpl-www/documents/asset-library/weekly-market-commentary-032221.pdf",
  asOf: READ,
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

// ─── Assumption lines ───────────────────────────────────────────────────────

/** Every page below carries a RecommendationSummary block with a fixed dollar figure. */
function illustrativeBlock(dollarBenefit: number): SourceRef {
  return {
    label: `Assumption: the 'recommendation summary' and 'do nothing' blocks near the top of the page show fixed illustrative figures typed into the page (a $${dollarBenefit.toLocaleString("en-US")} benefit and the paired before-and-after rows); they are not computed from the client's inputs and have no external source`,
  };
}

const USER_INPUTS: SourceRef = {
  label: "The calculator's other figures are the inputs entered on the page (income, balances, ages, rates) and arithmetic on them; every default input is the firm's example, not a published figure",
};

// ─── Pages ──────────────────────────────────────────────────────────────────

export const PAGE_SOURCES: Record<string, readonly SourceRef[]> = {
  "/portal/hot-income": [
    { ...IRS_TY2024_ITEMS, note: "The page's own bracket table (labelled '2026 Federal') is the 2024 table: $11,600 / $47,150 / $100,525 / $191,950 / $243,725 / $609,350 single and $23,200 ... $731,200 joint. The 2026 table is in IR-2025-103 below; the tax panel uses the 2026 table. Not changed; flagged for review." },
    IRS_TY2026_ITEMS,
    { label: "Assumption: intangible drilling costs = 75% of an oil and gas investment, and a 15% annual target return, both chosen by the firm as a typical program profile; no external source. The real split is the sponsor's and the CPA's" },
    illustrativeBlock(420000),
    USER_INPUTS,
  ],
  "/portal/house-recycling": [
    NAIC_AG49A,
    { label: "Assumption: the policy credits 7.4% a year (POLICY_RETURN), an assumed rate chosen by the firm; the page's claim that it is 'within AG 49' depends on the product, since AG 49-A sets each product's maximum by formula" },
    { label: "Assumption: HELOC rate choices of 0.5% to 2.0% are the firm's illustrative spread choices, not quoted lender rates" },
    illustrativeBlock(550000),
    USER_INPUTS,
  ],
  "/portal/household-wealth": [illustrativeBlock(550000)],
  "/portal/iul-vs-roth": [
    { ...IRS_TY2024_ITEMS, note: "The page's bracket tables are the 2024 tables (single to $609,350, joint to $731,200). The tax panel uses 2026. Not changed; flagged for review." },
    { ...IRS_2024_RETIREMENT_LIMITS, note: "The page's Roth figures ($7,000 / $8,000 at 50; phase-out $146,000-$161,000 single, $230,000-$240,000 joint) are the 2024 figures. The 2026 figures are in IR-2025-111 below." },
    IRS_2026_RETIREMENT_LIMITS,
    RMD_AGE_STATUTE,
    { label: "Assumption: 7.5% IUL crediting rate default, an assumed rate chosen by the firm, not a carrier illustration" },
    illustrativeBlock(185000),
    USER_INPUTS,
  ],
  "/portal/ibbotson-charts": [
    { ...DAMODARAN_SP500, note: "The page's annual return table matches this series year for year (checked 1929-1931, 1954, 2008, 2022-2025). It is Damodaran's reconstruction, not the Morningstar SBBI Yearbook the page's name refers to; SBBI figures differ slightly (for example -37.00% for 2008)." },
    { label: "Assumption: cap, floor and participation settings on the page are inputs; the defaults are the firm's examples, not a carrier's current terms" },
    illustrativeBlock(280000),
  ],
  "/portal/illustration-compare": [
    { label: "The policy values compared on this page are read from the carrier illustrations the advisor uploads; the page adds no figures of its own beyond the tax panel" },
    illustrativeBlock(150000),
  ],
  "/portal/income-gap": [
    { label: "Assumption: healthcare inflation 5.5% and Social Security COLA 2.5% default inputs, chosen by the firm; the 2.5% matches the 2025 COLA in the SSA fact sheet below, not a forecast" },
    SSA_2025_FACTS,
    illustrativeBlock(420000),
    USER_INPUTS,
  ],
  "/portal/income-timeline": [
    { label: "Assumption: 3% inflation and a 22% tax rate as default inputs, chosen by the firm; no external source" },
    illustrativeBlock(420000),
    USER_INPUTS,
  ],
  "/portal/inflation": [
    { label: "Assumption: the scenario inflation rates 2%, 3%, 4%, 5%, 6% and 7% and their volatility bands are round figures chosen by the firm to span outcomes; they are not a CPI series or forecast" },
    illustrativeBlock(200000),
    USER_INPUTS,
  ],
  "/portal/market-stress-test": [
    FED_HISTORY_1987,
    FED_HISTORY_1973,
    LPL_COVID,
    { ...DAMODARAN_SP500, note: "Calendar-year S&P 500 total returns: -9.03% (2000), -11.85% (2001), -21.97% (2002), -36.55% (2008), -18.04% (2022)." },
    NBER_CYCLES,
    { label: "Assumption: each scenario's asset-class impacts (for example equities -50% for 2008, bonds +5%) and the recovery times are the firm's stylised shocks, not measured drawdowns. The page's descriptions also quote peak-to-trough falls (S&P 500 -56.8% in 2007-09, Nasdaq -78% and S&P 500 -49% in 2000-02, -48% in 1973-74) that are not traced to a source here; the 1987 figure of 22.6% is the Dow's one-day fall, not the S&P 500's" },
    { label: "Assumption: the portfolio split (for example 60% equities in taxable and IRA accounts) is a fixed allocation chosen by the firm, not the client's holdings" },
    illustrativeBlock(280000),
  ],
  "/portal/mechanism/:slug": [
    { label: "Assumption: the role-fitness scores, ordering rules and plausibility figures shown for each sequence come from shared/sequenceOrderings.ts and are the firm's judgement; no external source" },
  ],
  "/portal/medicare-irmaa": [
    { ...CMS_IRMAA_2025, note: "The page's income thresholds match CMS. Its Part B monthly adjustments ($70.90, $176.40, $281.90, $387.30) do not match CMS ($74.00, $185.00, $295.90, $406.90), its Part D adjustments ($13.70, $35.50, $57.30, $79.00) differ slightly from CMS ($13.70, $35.30, $57.00, $78.60), and it has no top tier at $500,000 ($750,000 joint) and above. Not changed; flagged for review." },
    { label: "Assumption: 3% inflation and a 24% tax rate as default inputs, chosen by the firm; no external source" },
    illustrativeBlock(200000),
    USER_INPUTS,
  ],
  "/portal/multi-gen-wealth": [
    { ...IRS_TY2024_ITEMS, note: "The page uses the 2024 exclusion ($13,610,000) and the 2024 gift exclusion ($18,000)." },
    { ...IRS_TY2026_ITEMS, note: "For 2026 the basic exclusion is $15,000,000. The page's '2025 sunset' option (exemption halved to $7,000,000) no longer happens under P.L. 119-21. Not changed; flagged for review." },
    ESTATE_TAX_RATE,
    RMD_AGE_STATUTE,
    { label: "Assumption: the 'aggressive' policy option's 45% estate tax rate is a hypothetical chosen by the firm, not current law" },
    illustrativeBlock(200000),
    USER_INPUTS,
  ],
  "/portal/scenario-play": [
    { ...UNIFORM_LIFETIME_TABLE, note: "The page divides by 27.4 for a first RMD at 73; 27.4 is the age-72 period, the age-73 period is 26.5. Not changed; flagged for review." },
    RMD_AGE_STATUTE,
    { label: "Assumption: IUL income = 6.5% of cash value, Roth income = 4% of balance, and 6.7% more Social Security per year of delay past 62, all chosen by the firm; no external source. SSA's actual reductions and delayed credits depend on birth year (see the full-retirement-age table)" },
    SSA_FULL_RETIREMENT_AGE,
    illustrativeBlock(280000),
    USER_INPUTS,
  ],
  "/portal/policy-review": [
    { label: "The policy details reviewed on this page are the ones the advisor enters or uploads; the gap scores (100 / 75 / 45 / 15 by severity) are the firm's scale, not a published standard" },
    illustrativeBlock(350000),
  ],
  "/portal/portfolio-drift": [
    { label: "Sample data: the tax lots and rebalancing history shown before a client's accounts are loaded are demonstration rows typed into the page, not real holdings" },
    LONG_TERM_GAINS_RATES,
    illustrativeBlock(280000),
    USER_INPUTS,
  ],
  "/portal/predictive-analytics": [
    { ...IRS_TY2024_ITEMS, note: "The estate insight uses the 2024 exclusion of $13,610,000; for 2026 it is $15,000,000 (IR-2025-103). Not changed; flagged for review." },
    IRS_TY2026_ITEMS,
    ESTATE_TAX_RATE,
    { label: "Assumption: IUL income = 6.5% of cash value and the success probabilities shown are the firm's model outputs on assumed rates; no external source" },
    illustrativeBlock(200000),
    USER_INPUTS,
  ],
  "/portal/quick-quote": [
    { label: "Assumption: the quote's cost of insurance (0.1% of the death benefit, rising 5% a year), $120 admin fee plus 5% premium load, 60% guaranteed-value ratio and surrender scale are rough figures chosen by the firm, not any carrier's charges; the carrier's illustration governs" },
    { label: "Assumption: 6% assumed return, 2.5% inflation and 5% loan rate default inputs, chosen by the firm; no external source" },
    illustrativeBlock(200000),
    USER_INPUTS,
  ],
  "/portal/real-estate-mogul": [
    RESIDENTIAL_DEPRECIATION,
    { label: "Assumption: 7% IUL rate, 2.5% inflation, 15% oil and gas cash yield and a 5% IUL draw from year 10, all default inputs chosen by the firm; no external source" },
    illustrativeBlock(800000),
    USER_INPUTS,
  ],
  "/portal/recommendations": [
    CAPITAL_LOSS_LIMIT,
    { ...RMD_AGE_STATUTE, note: "The page says RMDs begin at 72; since 2023 they begin at 73. Not changed; flagged for review." },
    { label: "Sample data: the action plan dates (2023-2024) and the risk metrics table are demonstration rows typed into the page, not a client's record" },
    illustrativeBlock(600000),
  ],
  "/portal/retirement-guardrails": [
    { ...UNIFORM_LIFETIME_TABLE, note: "The page approximates the table as 27.4 minus one per year from age 73; the published periods are 26.5 at 73, 25.5 at 74 and so on, and they shrink by less than one a year at older ages. Not changed; flagged for review." },
    RMD_AGE_STATUTE,
    { label: "Assumption: a 4% initial withdrawal default and the guardrail percentages are inputs; the defaults are the firm's examples" },
    illustrativeBlock(420000),
    USER_INPUTS,
  ],
  "/portal/reverse-heloc": [illustrativeBlock(550000)],
  "/portal/saved-scenarios": [
    { label: "Assumption: the scenario projections (4% base growth plus up to 8% for aggression, a 2% leverage boost, 4% income draw, and the optimistic and pessimistic bands) are formulas chosen by the firm; no external source" },
    illustrativeBlock(280000),
    USER_INPUTS,
  ],
  "/portal/scenarios": [
    { label: "Assumption: equity return 3% plus up to 7% by aggression, fixed income 2% to 4%, an 8% alternatives premium, a 5% loan rate and 5% extra principal are formulas chosen by the firm; no external source" },
    illustrativeBlock(280000),
    USER_INPUTS,
  ],
  "/portal/scenario-side-by-side": [
    { label: "The scenarios compared are the ones saved by the advisor; their figures come from the scenario pages and their stated assumptions" },
    illustrativeBlock(280000),
  ],
  "/portal/social-security": [
    { ...SSA_FULL_RETIREMENT_AGE, note: "The page's full-retirement-age table matches SSA for births 1943 to 1960 and later." },
    { ...SSA_2025_FACTS, note: "The page's 2025 wage base, earnings-test amounts and maximum benefit match this fact sheet. They are 2025 figures; the 2026 earnings-test amounts are in the SSA table below." },
    SSA_EARNINGS_TEST_TABLE,
    SS_BENEFIT_TAXATION,
    { label: "Assumption: a 2.5% COLA every year (the 2025 figure used as a constant) and a 22% marginal rate on taxable benefits, chosen by the firm; no external source" },
    illustrativeBlock(420000),
    USER_INPUTS,
  ],
  "/portal/strategy": [
    { label: "Sample data: the monthly chart series on this page (uv / pv / amt) are placeholder rows typed into the page; they carry no meaning" },
    illustrativeBlock(600000),
  ],
  "/portal/succession-planning": [
    { label: "Assumption: the valuation split (for example AUM fees as 75% of revenue) and the other defaults are the firm's examples; no external source" },
    illustrativeBlock(800000),
    USER_INPUTS,
  ],
  "/portal/tax-advantaged-growth": [
    { ...IRS_2025_RETIREMENT_LIMITS, note: "The page uses the 2025 limits ($23,500 401(k), $7,500 catch-up, $7,000 Roth IRA). The 2026 limits are in IR-2025-111 below." },
    IRS_2026_RETIREMENT_LIMITS,
    RMD_AGE_STATUTE,
    illustrativeBlock(185000),
    USER_INPUTS,
  ],
  "/portal/tax-loss-harvesting": [
    CAPITAL_LOSS_LIMIT,
    LONG_TERM_GAINS_RATES,
    { label: "Sample data: the holdings (AAPL, TSLA, AMZN, NVDA, VTI and others) and the harvest history are demonstration rows typed into the page, not a client's positions or market prices" },
    illustrativeBlock(185000),
  ],
  "/portal/tax-opportunities": [
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
  "/portal/tax-return-upload": [
    { ...IRS_TY2023_RATES, note: "The page's bracket chart uses this 2023 single table (the $1,000,000 top is a chart limit, not a threshold). Figures extracted from the uploaded return are the client's own." },
    IRS_TY2026_ITEMS,
    illustrativeBlock(185000),
  ],
  "/portal/time-machine-ag49": [
    NAIC_AG49A,
    { label: "Assumption: the 6.5% crediting rate default is an input chosen by the firm; it is not a carrier's AG 49-A maximum" },
    illustrativeBlock(200000),
    USER_INPUTS,
  ],
  "/portal/time-machine-calculator": [
    NAIC_AG49A,
    illustrativeBlock(200000),
    USER_INPUTS,
  ],
  "/portal/time-machine-method": [
    { ...NAIC_AG49A, note: "The page says 'AG 49-B limits illustrated rates to the lesser of 6.5% or the Benchmark Index Account rate'. The guideline sets no fixed 6.5% ceiling; its limit is the formula above, product by product. Not changed; flagged for review." },
    illustrativeBlock(200000),
    USER_INPUTS,
  ],
  "/portal/withdrawal-sequencing": [
    IRS_TY2026_ITEMS,
    { label: "The page's 'current' bracket thresholds ($22,000 / $89,075 / $170,050 / $215,950) do not match any one IRS year: $22,000 is the 2023 joint 10% ceiling (Rev. Proc. 2022-38) and $89,075 / $170,050 / $215,950 are the 2022 single 22% / 24% / 32% ceilings. Its 'sunset' schedule (15% / 25% / 28%) models a reversion that P.L. 119-21 cancelled. Not changed; flagged for review", url: "https://www.irs.gov/pub/irs-drop/rp-22-38.pdf", asOf: READ },
    { ...RMD_AGE_STATUTE, note: "The page's RMD age default of 73 matches the statute." },
    illustrativeBlock(420000),
    USER_INPUTS,
  ],
};

/** Routes with page-level sources. Exported for the census and its test. */
export const ROUTES_WITH_PAGE_SOURCES: readonly string[] = Object.keys(PAGE_SOURCES).sort();
