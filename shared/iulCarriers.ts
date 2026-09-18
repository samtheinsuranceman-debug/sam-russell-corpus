/**
 * IUL Carrier Data — Generic carrier names, typical fee structures, cap rates,
 * and links to illustration software platforms.
 *
 * NOTE: These are representative/typical values for modeling purposes.
 * Actual rates vary by product, age, health class, and policy design.
 * Always verify with the carrier's current illustration software.
 */

export interface IULCarrier {
  id: string;
  name: string;
  product: string;
  /** Load fee as decimal (e.g., 0.06 = 6%) — premium expense charge */
  loadFee: number;
  /** Cost of insurance rate as decimal — annual COI charge on new premium */
  coiRate: number;
  /** S&P 500 cap rate as decimal (e.g., 0.105 = 10.5%) */
  capRate: number;
  /** Participation rate as decimal (e.g., 1.0 = 100%) */
  participationRate: number;
  /** Policy loan rate as decimal */
  loanRate: number;
  /** Floor rate (guaranteed minimum) as decimal */
  floorRate: number;
  /** Average illustrated rate as decimal */
  avgIllustratedRate: number;
  /** Link to carrier's illustration software */
  illustrationUrl: string;
  /** Brief description of the carrier/product */
  description: string;
  /** AM Best rating */
  amBestRating: string;
}

export const IUL_CARRIERS: IULCarrier[] = [
  {
    id: "aaa-plus-mutual",
    name: "AAA+ Mutual",
    product: "Indexed Accumulator III",
    loadFee: 0.055,
    coiRate: 0.04,
    capRate: 0.105,
    participationRate: 1.0,
    loanRate: 0.05,
    floorRate: 0.0,
    avgIllustratedRate: 0.075, // AG 49 max
    illustrationUrl: "",
    description: "Top-rated carrier with competitive cap rates and strong cash value accumulation. Offers multiple index strategies with 100% participation rate on S&P 500.",
    amBestRating: "A+ (Superior)",
  },
  {
    id: "aa-mutual",
    name: "AA Mutual",
    product: "Accumulation Builder II IUL",
    loadFee: 0.06,
    coiRate: 0.045,
    capRate: 0.10,
    participationRate: 1.0,
    loanRate: 0.05,
    floorRate: 0.0,
    avgIllustratedRate: 0.075, // AG 49 max
    illustrationUrl: "",
    description: "Mutual company with strong dividends history. Accumulation Builder II offers competitive cap rates and low COI charges for cash value growth strategies.",
    amBestRating: "A+ (Superior)",
  },
  {
    id: "a-mutual",
    name: "A Mutual Life",
    product: "Indexed UL Accumulator III",
    loadFee: 0.08,
    coiRate: 0.008,
    capRate: 0.145,
    participationRate: 1.0,
    loanRate: 0.05,
    floorRate: 0.0,
    avgIllustratedRate: 0.0659,
    illustrationUrl: "",
    description: "A Mutual Life Indexed UL Accumulator III — 1-Yr Multi-Index Monthly Average (S&P 500/NASDAQ-100/DJIA blend). 14% cap, 0% floor, 0.20% conditional credit from year 11. Premium load: 8% Y1, 6% Y2-5, 0% after. Surrender charges: 37.6% flat Y1-3, linear decline to $0 by Y11. 25-year historical compound: 6.75% crediting rate.",
    amBestRating: "A+ (Superior)",
  },
  {
    id: "aa-minus-mutual",
    name: "AA- Mutual",
    product: "Life Pro+ Advantage",
    loadFee: 0.07,
    coiRate: 0.05,
    capRate: 0.12,
    participationRate: 1.0,
    loanRate: 0.05,
    floorRate: 0.0,
    avgIllustratedRate: 0.075, // AG 49 max (actual historical avg exceeds this)
    illustrationUrl: "",
    description: "Highest cap rates in the industry at 12%+ on select strategies. Life Pro+ Advantage offers uncapped index options with participation rate multipliers.",
    amBestRating: "A+ (Superior)",
  },
  {
    id: "bbb-plus-mutual",
    name: "BBB+ Mutual",
    product: "Builder Plus IUL 3",
    loadFee: 0.06,
    coiRate: 0.045,
    capRate: 0.11,
    participationRate: 1.0,
    loanRate: 0.05,
    floorRate: 0.0,
    avgIllustratedRate: 0.075, // AG 49 max
    illustrationUrl: "",
    description: "Strong accumulation product with competitive cap rates and low internal costs. Builder Plus 3 is popular for premium financing and cash value strategies.",
    amBestRating: "A+ (Superior)",
  },
  {
    id: "bbb-mutual",
    name: "BBB Mutual",
    product: "Accumulation IUL 20",
    loadFee: 0.065,
    coiRate: 0.05,
    capRate: 0.095,
    participationRate: 1.0,
    loanRate: 0.05,
    floorRate: 0.0,
    avgIllustratedRate: 0.075, // AG 49 max
    illustrationUrl: "",
    description: "Established carrier with wellness program integration. Accumulation IUL 20 offers competitive rates with potential premium discounts for healthy policyholders.",
    amBestRating: "A+ (Superior)",
  },
  {
    id: "a-plus-mutual",
    name: "A+ Mutual Life",
    product: "WealthAccumulate IUL 2025",
    loadFee: 0.06,
    coiRate: 0.045,
    capRate: 0.10,
    participationRate: 1.0,
    loanRate: 0.05,
    floorRate: 0.0,
    avgIllustratedRate: 0.075, // AG 49 max
    illustrationUrl: "",
    description: "Solid carrier with WealthAccumulate featuring multiple index strategies and competitive accumulation potential. Good for long-term cash value growth.",
    amBestRating: "A+ (Superior)",
  },
  {
    id: "a-plus-mutual-life",
    name: "A+ Mutual Life",
    product: "Eclipse Accumulator IUL",
    loadFee: 0.055,
    coiRate: 0.04,
    capRate: 0.10,
    participationRate: 1.0,
    loanRate: 0.05,
    floorRate: 0.0,
    avgIllustratedRate: 0.075, // AG 49 max
    illustrationUrl: "",
    description: "Low-cost carrier with competitive load fees and COI charges. Eclipse Accumulator is designed for maximum cash value accumulation with efficient internal costs.",
    amBestRating: "A+ (Superior)",
  },
  {
    id: "a-minus-mutual",
    name: "A- Mutual Life",
    product: "Accumulator Ascent IUL 3.0 - GPT",
    loadFee: 0.098,
    coiRate: 0.01,
    capRate: 0.0671,
    participationRate: 1.0,
    loanRate: 0.055,
    floorRate: 0.0,
    avgIllustratedRate: 0.0671,
    illustrationUrl: "",
    description: "A- Mutual Life Accumulator Ascent IUL 3.0 (GPT) — Nasdaq-100 Index with Bonus, 1-Year Point to Point. 6.71% illustrated rate, 0% floor, 9.80% Y1 / 5.55% Y2-5 premium load. 9-year surrender schedule. Chronic Care Advantage Rider and Charitable Giving Benefit Rider available.",
    amBestRating: "A (Excellent)",
  },
  {
    id: "custom",
    name: "Custom / Manual Entry",
    product: "Custom Carrier",
    loadFee: 0.06,
    coiRate: 0.05,
    capRate: 0.10,
    participationRate: 1.0,
    loanRate: 0.05,
    floorRate: 0.0,
    avgIllustratedRate: 0.075, // AG 49 max
    illustrationUrl: "",
    description: "Enter custom carrier parameters manually. Use this option when working with a carrier not listed above or when you have specific illustration values.",
    amBestRating: "N/A",
  },
];

/** Default carrier used when none is selected — A Mutual Life Accumulator III */
export const DEFAULT_CARRIER_ID = "a-mutual";

/** Get a carrier by ID, falls back to custom */
export function getCarrierById(id: string): IULCarrier {
  return IUL_CARRIERS.find((c) => c.id === id) ?? IUL_CARRIERS[IUL_CARRIERS.length - 1];
}

/** General illustration software tools (not carrier-specific) */
export const ILLUSTRATION_TOOLS = [
  {
    name: "Illustration Platform A",
    url: "",
    description: "Multi-carrier illustration and quoting platform. Run what-if scenarios and compare compliant quotes across carriers.",
  },
  {
    name: "Illustration Platform B",
    url: "",
    description: "Compare traditional plans to IUL policies with interactive features showing progress over time.",
  },
  {
    name: "Illustration Platform C",
    url: "",
    description: "Run illustrations on fixed, indexed, and immediate annuities, as well as all life products.",
  },
  {
    name: "Illustration Platform D",
    url: "",
    description: "Industry-standard life insurance illustration software used by many carriers and agencies.",
  },
];
