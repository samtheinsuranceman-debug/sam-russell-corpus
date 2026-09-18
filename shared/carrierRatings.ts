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

export function getComdexDescription(score: number): string {
  if (score >= 95) return 'Elite — Top 5% of all rated insurers';
  if (score >= 90) return 'Superior — Top 10% of all rated insurers';
  if (score >= 80) return 'Excellent — Top 20% of all rated insurers';
  if (score >= 70) return 'Good — Above average financial strength';
  return 'Fair — Average financial strength';
}
