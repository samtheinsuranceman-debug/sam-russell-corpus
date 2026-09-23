/**
 * Carrier Financial Strength Ratings Dashboard
 * AM Best, S&P, Moody's, and Fitch ratings for generic IUL carriers
 */

export interface CarrierRating {
  carrierId: string;
  carrierName: string;
  amBest: { rating: string; outlook: string; description: string };
  sp: { rating: string; outlook: string; description: string };
  moodys: { rating: string; outlook: string; description: string };
  fitch: { rating: string; outlook: string; description: string };
  financials: {
    surplusRatio: number; // percentage
    claimsPayingAbility: string;
    yearsInBusiness: number;
    totalAssets: string;
    policyholderSurplus: string;
    comdexScore: number; // 1-100 composite score
  };
  strengthLevel: 'superior' | 'excellent' | 'good' | 'fair';
  strengthColor: string;
}

// Where the scale words and the Comdex bands come from. The carriers below are
// generic placeholders, not real companies, so their financial figures are
// declared as illustrative rather than attributed to any filing.

/** AM Best descriptors: A++/A+ Superior, A/A- Excellent. */
const AM_BEST_SCALE_SOURCE = {
  label: "AM Best, 'Guide to Best's Financial Strength Ratings': A++ and A+ Superior; A and A- Excellent",
  url: "https://www.ambest.com/ratings/guide.pdf",
  asOf: "read 2026-09-23",
};

/** S&P descriptors: AA Very Strong, A Strong. */
const SP_SCALE_SOURCE = {
  label: "S&P Global Ratings, 'S&P Global Ratings Definitions', Insurer Financial Strength Ratings: 'AA' very strong, 'A' strong financial security characteristics",
  url: "https://www.spglobal.com/ratings/en/regulatory/article/190705-s-p-global-ratings-definitions-s504352",
  asOf: "read 2026-09-23",
};

/** Moody's descriptors: Aa High Grade, A Upper Medium Grade. */
const MOODYS_SCALE_SOURCE = {
  label:
    "Moody's, 'Rating Symbols and Definitions': long-term obligations Aa high quality, A upper-medium grade; insurance financial strength " +
    "Aa excellent and A good financial security, Aa and Aaa together 'generally known as high-grade companies'",
  url: "https://www.moodys.com/sites/products/ProductAttachments/Moodys%20Rating%20Symbols%20and%20Definitions.pdf",
  asOf: "read 2026-09-23",
  note: "'Upper Medium Grade' is the descriptor for A-rated obligations; on Moody's insurance financial strength scale an A insurer offers 'good financial security'.",
};

/** Fitch descriptors: AA Very Strong, A Strong. */
const FITCH_SCALE_SOURCE = {
  label: "Fitch Ratings, Rating Definitions, Insurer Financial Strength: 'AA' Very Strong, 'A' Strong",
  url: "https://www.fitchratings.com/products/rating-definitions",
  asOf: "read 2026-09-23",
};

/** comdexScore and the 90 / 80 / 70 / 60 / 50 / 40 bands in COMDEX_BANDS and getComdexDescription. */
const COMDEX_SOURCE = {
  label:
    "Comdex Ranking (VitalSigns, EbixExchange), as explained in 'Understanding an Insurance Carrier's Ratings and Comdex' (Gateway Financial Group): " +
    "the average percentile of an insurer's AM Best, S&P, Moody's and Fitch ratings on a 1 to 100 scale, needing at least two ratings; " +
    "a Comdex of 90 means 10% of rated insurers rank higher",
  url: "https://www.gatewayfinancial.biz/wp-content/uploads/sites/196/2022/01/Understanding-an-Insurance-Carriers-Ratings-and-Comdex.pdf",
  asOf: "ratings as of 2020-07-01, document 2021; read 2026-09-23",
  note:
    "Ebix publishes the Comdex number, not band names. The bands in COMDEX_BANDS follow from the percentile definition: 90-100 Excellent " +
    "(top 10%), 80-89 Very Good (top 20%), 70-79 Good (top 30%), 60-69 Above Average, 50-59 Average (a percentile of 50 is the middle), " +
    "40-49 Below Average, under 40 Weak. The earlier table labelled every score under 70 'average', which put a 30 and a 65 in one band.",
};

/** The placeholder carriers' own figures. */
const CARRIER_FIGURES_ASSUMPTION = {
  label:
    "Assumption: surplus ratios, years in business, total assets, policyholder surplus and Comdex scores for the nine placeholder carriers are " +
    "illustrative values chosen by the firm to show a realistic spread for highly rated mutual insurers; they describe no real company; no external source",
};

export const CARRIER_RATINGS: CarrierRating[] = [
  {
    carrierId: "a-mutual",
    carrierName: "A Mutual Life Insurance Company",
    amBest: { rating: "A+", outlook: "Stable", description: "Superior" },
    sp: { rating: "A+", outlook: "Stable", description: "Strong" },
    moodys: { rating: "A1", outlook: "Stable", description: "Upper Medium Grade" },
    fitch: { rating: "A+", outlook: "Stable", description: "Strong" },
    financials: {
      surplusRatio: 12.8,
      claimsPayingAbility: "Very Strong",
      yearsInBusiness: 98,
      totalAssets: "$282B",
      policyholderSurplus: "$22.4B",
      comdexScore: 93,
    },
    strengthLevel: "superior",
    strengthColor: "#22c55e",
  },
  {
    carrierId: "aaa-plus-mutual",
    carrierName: "AAA+ Mutual Insurance Company",
    amBest: { rating: "A+", outlook: "Stable", description: "Superior" },
    sp: { rating: "AA-", outlook: "Stable", description: "Very Strong" },
    moodys: { rating: "A1", outlook: "Stable", description: "Upper Medium Grade" },
    fitch: { rating: "AA-", outlook: "Stable", description: "Very Strong" },
    financials: {
      surplusRatio: 14.2,
      claimsPayingAbility: "Very Strong",
      yearsInBusiness: 156,
      totalAssets: "$200B",
      policyholderSurplus: "$8.7B",
      comdexScore: 96,
    },
    strengthLevel: "superior",
    strengthColor: "#22c55e",
  },
  {
    carrierId: "bbb-plus-mutual",
    carrierName: "BBB+ Mutual Insurance Company",
    amBest: { rating: "A+", outlook: "Stable", description: "Superior" },
    sp: { rating: "A+", outlook: "Stable", description: "Strong" },
    moodys: { rating: "A1", outlook: "Stable", description: "Upper Medium Grade" },
    fitch: { rating: "NR", outlook: "N/A", description: "Not Rated" },
    financials: {
      surplusRatio: 11.5,
      claimsPayingAbility: "Very Strong",
      yearsInBusiness: 138,
      totalAssets: "$38B",
      policyholderSurplus: "$3.2B",
      comdexScore: 90,
    },
    strengthLevel: "superior",
    strengthColor: "#22c55e",
  },
  {
    carrierId: "a-plus-mutual-life",
    carrierName: "A+ Mutual Life Insurance Company",
    amBest: { rating: "A+", outlook: "Stable", description: "Superior" },
    sp: { rating: "AA-", outlook: "Stable", description: "Very Strong" },
    moodys: { rating: "Aa3", outlook: "Stable", description: "High Grade" },
    fitch: { rating: "NR", outlook: "N/A", description: "Not Rated" },
    financials: {
      surplusRatio: 15.1,
      claimsPayingAbility: "Very Strong",
      yearsInBusiness: 144,
      totalAssets: "$85B",
      policyholderSurplus: "$6.8B",
      comdexScore: 95,
    },
    strengthLevel: "superior",
    strengthColor: "#22c55e",
  },
  {
    carrierId: "a-minus-mutual",
    carrierName: "A- Mutual Life Insurance Company",
    amBest: { rating: "A", outlook: "Stable", description: "Excellent" },
    sp: { rating: "A", outlook: "Stable", description: "Strong" },
    moodys: { rating: "A2", outlook: "Stable", description: "Upper Medium Grade" },
    fitch: { rating: "A+", outlook: "Stable", description: "Strong" },
    financials: {
      surplusRatio: 10.3,
      claimsPayingAbility: "Strong",
      yearsInBusiness: 67,
      totalAssets: "$47B",
      policyholderSurplus: "$2.9B",
      comdexScore: 85,
    },
    strengthLevel: "excellent",
    strengthColor: "#3b82f6",
  },
  {
    carrierId: "aa-minus-mutual",
    carrierName: "AA- Mutual Insurance Company",
    amBest: { rating: "A+", outlook: "Stable", description: "Superior" },
    sp: { rating: "AA", outlook: "Stable", description: "Very Strong" },
    moodys: { rating: "Aa3", outlook: "Stable", description: "High Grade" },
    fitch: { rating: "AA-", outlook: "Stable", description: "Very Strong" },
    financials: {
      surplusRatio: 13.7,
      claimsPayingAbility: "Very Strong",
      yearsInBusiness: 45,
      totalAssets: "$120B",
      policyholderSurplus: "$9.1B",
      comdexScore: 97,
    },
    strengthLevel: "superior",
    strengthColor: "#22c55e",
  },
  {
    carrierId: "aa-mutual",
    carrierName: "AA Mutual Insurance Company",
    amBest: { rating: "A+", outlook: "Stable", description: "Superior" },
    sp: { rating: "A+", outlook: "Stable", description: "Strong" },
    moodys: { rating: "NR", outlook: "N/A", description: "Not Rated" },
    fitch: { rating: "NR", outlook: "N/A", description: "Not Rated" },
    financials: {
      surplusRatio: 11.9,
      claimsPayingAbility: "Very Strong",
      yearsInBusiness: 177,
      totalAssets: "$32B",
      policyholderSurplus: "$3.8B",
      comdexScore: 88,
    },
    strengthLevel: "superior",
    strengthColor: "#22c55e",
  },
  {
    carrierId: "bbb-mutual",
    carrierName: "BBB Mutual Insurance Company",
    amBest: { rating: "A+", outlook: "Stable", description: "Superior" },
    sp: { rating: "AA-", outlook: "Stable", description: "Very Strong" },
    moodys: { rating: "A1", outlook: "Stable", description: "Upper Medium Grade" },
    fitch: { rating: "AA-", outlook: "Stable", description: "Very Strong" },
    financials: {
      surplusRatio: 13.2,
      claimsPayingAbility: "Very Strong",
      yearsInBusiness: 162,
      totalAssets: "$280B",
      policyholderSurplus: "$15.2B",
      comdexScore: 94,
    },
    strengthLevel: "superior",
    strengthColor: "#22c55e",
  },
  {
    carrierId: "a-plus-mutual",
    carrierName: "A+ Mutual Life Insurance Company",
    amBest: { rating: "A+", outlook: "Stable", description: "Superior" },
    sp: { rating: "A+", outlook: "Negative", description: "Strong" },
    moodys: { rating: "A2", outlook: "Stable", description: "Upper Medium Grade" },
    fitch: { rating: "A+", outlook: "Stable", description: "Strong" },
    financials: {
      surplusRatio: 10.8,
      claimsPayingAbility: "Strong",
      yearsInBusiness: 119,
      totalAssets: "$350B",
      policyholderSurplus: "$11.5B",
      comdexScore: 89,
    },
    strengthLevel: "superior",
    strengthColor: "#22c55e",
  },
];

export function getCarrierRating(carrierId: string): CarrierRating | undefined {
  return CARRIER_RATINGS.find(r => r.carrierId === carrierId);
}

export function getRatingColor(rating: string): string {
  if (rating.startsWith('AA') || rating === 'A+' || rating === 'Aa') return '#22c55e';
  if (rating.startsWith('A') || rating === 'A1' || rating === 'A2') return '#3b82f6';
  if (rating.startsWith('BBB') || rating.startsWith('Baa')) return '#f59e0b';
  if (rating === 'NR') return '#6b7280';
  return '#ef4444';
}

/**
 * Seven bands over the Comdex percentile. Ebix (VitalSigns) publishes the Comdex as a 1-100 percentile
 * ranking only; the band names are descriptive of that percentile (see COMDEX_SOURCE): 50 is the middle of
 * rated insurers, so 50-59 is average, 60-69 is above it and 40-49 below it.
 */
export const COMDEX_BANDS: readonly { min: number; label: string; description: string }[] = [
  { min: 90, label: 'Excellent', description: 'top 10% of rated insurers' },
  { min: 80, label: 'Very Good', description: 'top 20% of rated insurers' },
  { min: 70, label: 'Good', description: 'top 30% of rated insurers' },
  { min: 60, label: 'Above Average', description: 'upper half of rated insurers' },
  { min: 50, label: 'Average', description: 'around the middle of rated insurers' },
  { min: 40, label: 'Below Average', description: 'lower half of rated insurers' },
  { min: -Infinity, label: 'Weak', description: 'bottom 40% of rated insurers' },
];

/** The band label for a Comdex score: Excellent, Very Good, Good, Above Average, Average, Below Average or Weak. */
export function getComdexLabel(score: number): string {
  return (COMDEX_BANDS.find(b => score >= b.min) ?? COMDEX_BANDS[COMDEX_BANDS.length - 1]).label;
}

export function getComdexDescription(score: number): string {
  const band = COMDEX_BANDS.find(b => score >= b.min) ?? COMDEX_BANDS[COMDEX_BANDS.length - 1];
  return `${band.label} — ${band.description.charAt(0).toUpperCase()}${band.description.slice(1)}`;
}

/** Every source and declared assumption behind the ratings table, for the shell's source footer. */
export const CARRIER_RATINGS_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  AM_BEST_SCALE_SOURCE,
  SP_SCALE_SOURCE,
  MOODYS_SCALE_SOURCE,
  FITCH_SCALE_SOURCE,
  COMDEX_SOURCE,
  CARRIER_FIGURES_ASSUMPTION,
];
