// ============================================================
// MUTUAL-ONLY INDEXED UNIVERSAL LIFE — the registry the trust engine draws from.
//
// The rule Sam set: a carrier is on this list only if it is a mutual company
// or owned by a mutual holding company, so the policyholders, not
// shareholders, own it. Every figure below was read from the page named
// beside it on the date given; anything that could not be read from the
// carrier's own site is marked `verified: false` and the page shows it as
// unverified rather than filling it in. Nothing here is a rate quote; the
// crediting used in the loop comes from the backtester's index history
// (`shared/indexCreditingData.ts`), and the carrier's current caps are read
// from its own rate sheet on the day the plan is built.
// ============================================================

export type Verified<T> = { value: T; verified: boolean; source: string; asOf: string; note?: string };
const v = <T,>(value: T, source: string, asOf: string, note?: string): Verified<T> => ({ value, verified: true, source, asOf, note });
const unverified = <T,>(value: T, note: string, source = ""): Verified<T> => ({ value, verified: false, source, asOf: "", note });

export type AgencyRating = { agency: "AM Best" | "S&P" | "Moody's" | "Fitch" | "KBRA"; rating: string; asOf: string; source: string; verified: boolean; note?: string };

export type MutualIulCarrier = {
  id: string;
  name: string;
  /** The mutual structure: a mutual company, or a stock company owned by a mutual holding company. Cited. */
  ownership: Verified<string>;
  founded: Verified<number | null>;
  ratings: AgencyRating[];
  /** Employees, assets, in force, customers: whatever the carrier's own page states, each with its page. */
  size: Array<Verified<string> & { label: string }>;
  /** The accumulation-oriented indexed universal life product, when its page could be read. */
  product: Verified<string | null>;
  /** Index strategies as the carrier's own page lists them. */
  strategies: Array<Verified<string>>;
  /** What the carrier's site says about policy loans in the first policy year — never assumed. */
  firstYearLoans: Verified<"allowed" | "not-allowed" | "unknown">;
  /** Underwriting and special features as published. */
  notes: Array<Verified<string>>;
  /** The backtester's anonymised carrier key when its strategies are modelled there. */
  backtestKey: "a-mutual" | "a-plus-mutual-life" | "a-minus-mutual" | null;
  home: string;
};

const D = "2026-09-07";
const NOT_READ = "Not read from the carrier's own site in this pass; shown as unverified until it is.";

export const MUTUAL_IUL_CARRIERS: MutualIulCarrier[] = [
  {
    id: "securian",
    name: "Securian Financial (Minnesota Life)",
    ownership: v("Mutual holding company: Securian Financial Group is owned by Minnesota Mutual Companies, Inc., a mutual holding company; policyholders are members.", "https://www.securian.com/about-us/member-info.html", D),
    founded: unverified(null, "The financial-strength page states more than 145 years in business; the founding year itself is not printed there.", "https://www.securian.com/about-us/financial-strength.html"),
    ratings: [
      { agency: "AM Best", rating: "A+ (Superior)", asOf: "2025", source: "https://www.securian.com/about-us/financial-strength.html", verified: true },
      { agency: "Fitch", rating: "AA (Very Strong)", asOf: "2025", source: "https://www.securian.com/about-us/financial-strength.html", verified: true },
      { agency: "Moody's", rating: "Aa3 (Excellent)", asOf: "2025", source: "https://www.securian.com/about-us/financial-strength.html", verified: true },
      { agency: "S&P", rating: "AA- (Very Strong)", asOf: "2025", source: "https://www.securian.com/about-us/financial-strength.html", verified: true },
    ],
    size: [
      { label: "Surplus", ...v("$3.5 billion", "https://www.securian.com/about-us/financial-strength.html", D) },
      { label: "Invested assets", ...v("$38.0 billion", "https://www.securian.com/about-us/financial-strength.html", D) },
      { label: "Life insurance in force", ...v("$1.7 trillion", "https://www.securian.com/about-us/financial-strength.html", D) },
      { label: "Employees", ...v("5,700", "https://www.securian.com/about-us/financial-strength.html", D) },
      { label: "Customers", ...v("23 million", "https://www.securian.com/about-us/financial-strength.html", D) },
    ],
    product: v("Eclipse Accumulator IUL", "https://www.securian.com/financial-professionals/products/individual-life-insurance/indexed-universal-life/eclipse-accumulator.html", D),
    strategies: [v("S&P 500 point-to-point and the other index accounts listed on the product page; caps and participation rates are on the current rate sheet linked there.", "https://www.securian.com/financial-professionals/products/individual-life-insurance/indexed-universal-life/eclipse-accumulator.html", D)],
    firstYearLoans: unverified("unknown", "First-policy-year loan availability was not stated on the pages read. Read the policy form or ask the carrier before the plan relies on it."),
    notes: [v("Modelled in the backtester under the anonymised key a-plus-mutual-life.", "shared/indexCreditingData.ts", D)],
    backtestKey: "a-plus-mutual-life",
    home: "https://www.securian.com",
  },
  {
    id: "nationwide",
    name: "Nationwide Life Insurance Company",
    ownership: v("Mutual: Nationwide Mutual Insurance Company owns Nationwide Financial and its life companies.", "https://www.nationwidefinancial.com/about-us/financial-strength", D),
    founded: unverified(null, NOT_READ),
    ratings: [
      { agency: "AM Best", rating: "see carrier page", asOf: "", source: "https://www.nationwide.com/personal/about-us/ratings", verified: false, note: "The ratings page did not answer when read in this pass; the ratings are shown unverified until it does." },
    ],
    size: [],
    product: v("Nationwide Indexed UL Accumulator III (all states except New York); Nationwide YourLife Indexed UL Accumulator (New York).", "https://nationwidefinancial.com/products/life/indexed-universal/yourlife-indexed-accumulator", D),
    strategies: [
      v("1-year S&P 500 point-to-point, capped.", "https://nationwidefinancial.com/products/life/indexed-universal/yourlife-indexed-accumulator", D),
      v("1-year S&P 500 point-to-point, uncapped (participation-rate strategy).", "https://nationwidefinancial.com/products/life/indexed-universal/yourlife-indexed-accumulator", D),
      v("Multi-Index Monthly Average: the S&P 500, Nasdaq-100 and Dow Jones Industrial Average are ranked by that year's performance and weighted 50% best, 30% middle, 20% worst, on their monthly averages. This is a look-back weighting of three indices, not a high-water-mark guarantee.", "https://nationwidefinancial.com/products/life/indexed-universal/yourlife-indexed-accumulator", D),
      v("New York rate guide dated 15 March 2026 on the product page: current cap 10.75%, guaranteed cap 3%, thirty-year look-back average 6.58% for the capped S&P 500 strategy.", "https://nationwidefinancial.com/products/life/indexed-universal/yourlife-indexed-accumulator", "2026-03-15", "A carrier's look-back is its own illustration figure, not a return any policy received."),
    ],
    firstYearLoans: unverified("unknown", "Not stated on the product page read; the policy form governs."),
    notes: [v("Modelled in the backtester under the anonymised key a-mutual.", "shared/indexCreditingData.ts", D)],
    backtestKey: "a-mutual",
    home: "https://nationwidefinancial.com",
  },
  {
    id: "penn-mutual",
    name: "The Penn Mutual Life Insurance Company",
    ownership: v("Mutual company since 1847; owned by its policyholders.", "https://www.pennmutual.com/about-us", D),
    founded: v(1847, "https://www.pennmutual.com/about-us", D),
    ratings: [
      { agency: "AM Best", rating: "A+ (Superior)", asOf: "2026-04", source: "https://www.pennmutual.com/about-us/financial-strength/ratings", verified: true, note: "The page states 99 consecutive years at A+ or better." },
      { agency: "Moody's", rating: "Aa3", asOf: "2025-11", source: "https://www.pennmutual.com/about-us/financial-strength/ratings", verified: true },
      { agency: "S&P", rating: "A+", asOf: "2025-12", source: "https://www.pennmutual.com/about-us/financial-strength/ratings", verified: true },
      { agency: "Fitch", rating: "AA-", asOf: "2025-10", source: "https://www.pennmutual.com/about-us/financial-strength/ratings", verified: true },
      { agency: "KBRA", rating: "AA", asOf: "2025", source: "https://www.pennmutual.com/about-us/financial-strength/ratings", verified: true },
    ],
    size: [],
    product: v("Accumulation Builder Select Indexed Universal Life", "https://www.pennmutual.com/absiul-riders", D),
    strategies: [unverified("Index accounts as listed in the product's current rate sheet.", NOT_READ)],
    firstYearLoans: unverified("unknown", "Not stated on the pages read."),
    notes: [],
    backtestKey: null,
    home: "https://www.pennmutual.com",
  },
  {
    id: "ameritas",
    name: "Ameritas Life Insurance Corp.",
    ownership: v("Owned by Ameritas Mutual Holding Company.", "https://www.ameritas.com/about/financial-strength/", D),
    founded: unverified(null, NOT_READ, "https://www.ameritas.com/about/our-story/"),
    ratings: [
      { agency: "S&P", rating: "A+ (Strong)", asOf: "2026-04-08", source: "https://www.ameritas.com/about/financial-strength/", verified: true },
      { agency: "AM Best", rating: "A (Excellent)", asOf: "2026-06-25", source: "https://www.ameritas.com/about/financial-strength/", verified: true, note: "The page states the rating has been held for fifty years." },
    ],
    size: [],
    product: unverified(null, "The indexed universal life product page returned 404 when read; the product name is not recorded until the page answers.", "https://www.ameritas.com/products/life-insurance/indexed-universal-life/"),
    strategies: [],
    firstYearLoans: unverified("unknown", "Not stated on the pages read."),
    notes: [],
    backtestKey: null,
    home: "https://www.ameritas.com",
  },
  {
    id: "pacific-life",
    name: "Pacific Life Insurance Company",
    ownership: v("Owned by Pacific Mutual Holding Company through Pacific LifeCorp, as the ratings page and Moody's describe.", "https://www.pacificlife.com/home/about/financials-and-insurance-ratings.html", D),
    founded: unverified(null, NOT_READ),
    ratings: [
      { agency: "Moody's", rating: "Aa3 (Excellent)", asOf: "2025", source: "https://www.pacificlife.com/home/about/financials-and-insurance-ratings.html", verified: true },
      { agency: "AM Best", rating: "Superior (letter grade on the page)", asOf: "2025", source: "https://www.pacificlife.com/home/about/financials-and-insurance-ratings.html", verified: true, note: "The page gives the descriptor; read the letter from the page before quoting it." },
      { agency: "S&P", rating: "Very Strong (descriptor)", asOf: "2025", source: "https://www.pacificlife.com/home/about/financials-and-insurance-ratings.html", verified: true },
      { agency: "Fitch", rating: "Very Strong (descriptor)", asOf: "2025", source: "https://www.pacificlife.com/home/about/financials-and-insurance-ratings.html", verified: true },
    ],
    size: [
      { label: "Total assets", ...v("$275 billion (2025)", "https://www.pacificlife.com/home/about/financials-and-insurance-ratings.html", D) },
      { label: "Invested assets", ...v("$186 billion (2025)", "https://www.pacificlife.com/home/about/financials-and-insurance-ratings.html", D) },
    ],
    product: unverified(null, "The accumulation IUL product name was not read from the carrier's own page in this pass."),
    strategies: [],
    firstYearLoans: unverified("unknown", "Not stated on the pages read."),
    notes: [],
    backtestKey: null,
    home: "https://www.pacificlife.com",
  },
  {
    id: "mutual-of-omaha",
    name: "United of Omaha Life Insurance Company (Mutual of Omaha)",
    ownership: v("Mutual of Omaha is a mutual company; United of Omaha Life Insurance Company, its subsidiary, issues the life policies.", "https://www.mutualofomaha.com/about/financial-strength", D, "A 2026 reorganisation into a mutual holding company was reported by a secondary source and is not confirmed on the carrier's page read here."),
    founded: unverified(null, NOT_READ),
    ratings: [
      { agency: "S&P", rating: "A+", asOf: "2025", source: "https://www.mutualofomaha.com/about/financial-strength", verified: true },
      { agency: "Moody's", rating: "A1", asOf: "2025", source: "https://www.mutualofomaha.com/about/financial-strength", verified: true },
      { agency: "AM Best", rating: "A+", asOf: "2025", source: "https://www.mutualofomaha.com/about/financial-strength", verified: true },
    ],
    size: [],
    product: unverified("Income Advantage IUL", "Product name from a secondary source; not read from the carrier's own product page in this pass."),
    strategies: [],
    firstYearLoans: unverified("unknown", "Not stated on the pages read."),
    notes: [],
    backtestKey: null,
    home: "https://www.mutualofomaha.com",
  },
  {
    id: "national-life",
    name: "National Life Insurance Company (National Life Group)",
    ownership: v("Mutual company, founded 1848; National Life Group is the mutual holding structure.", "https://www.nationallife.com/Non-Newsroom-Contents/RATINGS-IN-PERSPECTIVE", D),
    founded: v(1848, "https://www.nationallife.com/Non-Newsroom-Contents/RATINGS-IN-PERSPECTIVE", D),
    ratings: [
      { agency: "AM Best", rating: "A+ (Superior)", asOf: "2025", source: "https://www.nationallife.com/Non-Newsroom-Contents/RATINGS-IN-PERSPECTIVE", verified: true },
      { agency: "S&P", rating: "A+ (Strong)", asOf: "2025", source: "https://www.nationallife.com/Non-Newsroom-Contents/RATINGS-IN-PERSPECTIVE", verified: true },
      { agency: "Moody's", rating: "A1 (Good)", asOf: "2025", source: "https://www.nationallife.com/Non-Newsroom-Contents/RATINGS-IN-PERSPECTIVE", verified: true },
    ],
    size: [{ label: "Assets under management", ...unverified("about $47 billion", "From a secondary source; not read from the carrier's own page in this pass.") }],
    product: unverified("FlexLife / PeakLife / SummitLife", "Product names from a secondary source; not read from the carrier's own product pages in this pass."),
    strategies: [],
    firstYearLoans: unverified("unknown", "Not stated on the pages read."),
    notes: [],
    backtestKey: null,
    home: "https://www.nationallife.com",
  },
  {
    id: "columbus-life",
    name: "Columbus Life Insurance Company (Western & Southern Financial Group)",
    ownership: unverified("Columbus Life was founded in 1906 as Columbus Mutual and is a member of Western & Southern Financial Group (heritage 1888). Whether the group's parent is a mutual holding company was not confirmed on its own site in this pass.", "Kept on the list provisionally; remove if the parent's charter is not mutual.", "https://www.westernsouthern.com/about/family-of-companies"),
    founded: v(1906, "https://www.westernsouthern.com/columbuslife/about/financial-information", D),
    ratings: [
      { agency: "AM Best", rating: "A+ (Superior)", asOf: "2025", source: "https://www.westernsouthern.com/about/financial-strength", verified: true },
      { agency: "S&P", rating: "AA- (Very Strong)", asOf: "2025", source: "https://www.westernsouthern.com/about/financial-strength", verified: true },
      { agency: "Fitch", rating: "AA (Very Strong)", asOf: "2025", source: "https://www.westernsouthern.com/about/financial-strength", verified: true },
      { agency: "Moody's", rating: "Aa3 (Excellent)", asOf: "2025", source: "https://www.westernsouthern.com/about/financial-strength", verified: true },
    ],
    size: [
      { label: "Group assets", ...v("$75.1 billion (2023 annual report)", "https://www.westernsouthern.com/-/media/files/wsfg/2023-annual-report.pdf", D) },
      { label: "Associates", ...v("about 3,400", "https://www.westernsouthern.com/about", D) },
      { label: "Comdex", ...v("95–96 as stated on the group's page", "https://www.westernsouthern.com/about/financial-strength", D) },
    ],
    product: v("Indexed Explorer Plus (universal life, indexed)", "https://www.westernsouthern.com/wslife/products/life-insurance/universal-life-insurance/indexed-explorer-plus", D),
    strategies: [],
    firstYearLoans: unverified("unknown", "Not stated on the pages read."),
    notes: [],
    backtestKey: null,
    home: "https://www.westernsouthern.com/columbuslife",
  },
];

/** Carriers whose mutual ownership is confirmed on their own site; the rest are shown separately as provisional. */
export function confirmedMutuals(): MutualIulCarrier[] { return MUTUAL_IUL_CARRIERS.filter((c) => c.ownership.verified); }
export function provisionalMutuals(): MutualIulCarrier[] { return MUTUAL_IUL_CARRIERS.filter((c) => !c.ownership.verified); }

/** What a rating letter means in words, per the agencies' own scales, so the page never invents a descriptor. */
export const RATING_SCALES = [
  { agency: "AM Best", url: "https://ratings.ambest.com/", top: "A++ and A+ are Superior; A and A- Excellent." },
  { agency: "S&P", url: "https://www.spglobal.com/ratings/", top: "AAA Extremely Strong; AA Very Strong; A Strong." },
  { agency: "Moody's", url: "https://ratings.moodys.com/", top: "Aaa Exceptional; Aa Excellent; A Good." },
  { agency: "Fitch", url: "https://www.fitchratings.com/", top: "AAA Exceptionally Strong; AA Very Strong; A Strong." },
];

/** The reading the client does before any policy is chosen: the carrier's current rate sheet and the policy form's loan provision. */
export const CARRIER_READ_PROTOCOL = [
  "Open the carrier's own financial-strength page and copy each agency's rating with its date.",
  "Open the product's current rate sheet: the cap, participation rate, floor and any strategy charge for each index account, with the sheet's date.",
  "Read the policy form's loan provision: the first policy year a loan is allowed, the loan rate, and whether it is a fixed or indexed (participating) loan.",
  "Confirm the company is a mutual company or owned by a mutual holding company on its own 'about' page.",
  "Enter each figure on the plan with its date; the loop runs on the entered figures and on the backtester's index history, never on a remembered number.",
];
