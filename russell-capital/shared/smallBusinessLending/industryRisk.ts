/**
 * Small business lending — which trades pay you back, and when they need the money.
 *
 * ## The honest shape of this file
 *
 * The ask was: out of the last thousand documented loans, how many paid in full?
 * There is no public dataset of a thousand individual small business loans with
 * per-loan outcomes by trade. What does exist, and what this engine is built to
 * consume, is the SBA's own loan-level FOIA release: every 7(a) and 504 loan with
 * its NAICS code, approval amount, status, and charge-off amount. That is roughly
 * two million loans, not one thousand, and it is the real answer to the question.
 *
 * So this file carries TWO kinds of knowledge, and keeps them apart on purpose:
 *
 *   1. STRUCTURE — the seasonality, the receivables cycle, the margin profile, the
 *      collateral. These are properties of how a trade actually operates. A roofer
 *      needs material money before the season, not after it. That is knowable
 *      without a dataset and it is encoded directly.
 *
 *   2. LOSS EXPERIENCE — the default and charge-off rates. These are NOT encoded.
 *      They must be supplied, each carrying a source and an as-of date, or scoring
 *      throws. Same contract as every other engine on this platform: no number on
 *      a screen without a source behind it.
 *
 * `loadSbaChargeOffRates()` is the loader. Point it at the SBA FOIA CSV and it
 * produces the SourcedRate records this engine requires.
 *
 * ## Why structure matters more than the headline rate
 *
 * The published sector rates are coarse — two-digit NAICS buckets that put a
 * dentist and a chiropractor in the same box, and a landscaper and a high-rise
 * contractor in another. What separates a loan that repays from one that does not,
 * at the size we lend, is rarely the sector average. It is:
 *
 *   - Whether the borrower needs the money BEFORE their season or DURING it.
 *     Money lent before the season buys materials that become revenue. Money lent
 *     during the season is usually plugging a hole.
 *   - How long until the work turns into cash. A trade that bills on completion and
 *     collects in 15 days can service a daily remittance. One that waits 90 days
 *     on a general contractor cannot, at any price.
 *   - Whether there is anything to take. Equipment can be repossessed. A signed
 *     receivable can be redirected. Goodwill cannot.
 *
 * `seedMultiple` is the number that decides whether the loan was ever a good idea:
 * revenue generated per dollar of working capital deployed in season. A landscaper
 * turning $1 of mulch and fuel into $3 of billed work can carry expensive money.
 * A business at 1.2x cannot, and lending to them at a high rate is how you end up
 * owning a lien on a truck instead of a client.
 */

export type Month =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type CollateralQuality =
  /** Titled, serialized, resaleable. Trucks, excavators, dental chairs. */
  | 'titled-equipment'
  /** A signed invoice against a creditworthy payer. Redirectable. */
  | 'receivables'
  /** Resaleable goods, but at a discount and slowly. */
  | 'inventory'
  /** Nothing to take but a personal guarantee. */
  | 'unsecured';

export type Cyclicality =
  /** Demand holds in a downturn. People still get toothaches. */
  | 'defensive'
  | 'neutral'
  /** Demand is the first thing cut. Discretionary, deferrable. */
  | 'cyclical';

export interface IndustryProfile {
  readonly naics: string;
  readonly name: string;
  /**
   * Months when this trade needs capital AHEAD of revenue. This is the window
   * where a loan buys inventory, materials, or crew capacity that becomes work.
   * Lending outside this window is lending into a hole.
   */
  readonly capitalNeedMonths: readonly Month[];
  /** Months when cash actually arrives, for sizing the remittance. */
  readonly collectionMonths: readonly Month[];
  /** Days from work performed to cash in the account. */
  readonly revenueLagDays: number;
  readonly grossMarginPct: number;
  readonly collateralQuality: CollateralQuality;
  readonly cyclicality: Cyclicality;
  /** Revenue generated per dollar of working capital deployed in season. */
  readonly seedMultiple: number;
  /** Typical annual revenue band, for sizing. */
  readonly typicalRevenue: readonly [number, number];
  readonly notes: string;
}

export interface SourcedRate {
  /** Annualized default or charge-off rate as a decimal. */
  readonly value: number;
  readonly source: string;
  /** ISO date the figure was published or pulled. */
  readonly asOf: string;
  readonly sampleSize?: number;
  readonly basis:
    | 'sba-7a-charge-off'
    | 'sba-504-charge-off'
    | 'published-portfolio'
    | 'internal-experience';
}

export class UnsourcedRateError extends Error {
  constructor(naics: string) {
    super(
      `Refused to score NAICS ${naics}: the loss rate carries no source or no as-of date. ` +
        'Structure is encoded in this file; loss experience is not. Supply it from the SBA ' +
        'FOIA dataset or from booked internal experience, with a date, or do not score.',
    );
    this.name = 'UnsourcedRateError';
  }
}

export class StaleRateError extends Error {
  constructor(naics: string, asOf: string, maxAgeMonths: number) {
    super(
      `Loss rate for NAICS ${naics} is dated ${asOf}, older than the ${maxAgeMonths}-month ` +
        'limit. Credit conditions move. Re-pull before pricing against it.',
    );
    this.name = 'StaleRateError';
  }
}

/**
 * The twenty-five trades, ordered by NAICS.
 *
 * Selected for spread across the three things that actually differentiate them:
 * seasonality (some have a hard window, some have none), collateral (titled iron
 * down to nothing), and cyclicality (a dentist and a wedding caterer behave
 * nothing alike in a bad year).
 */
export const INDUSTRY_PROFILES: readonly IndustryProfile[] = [
  {
    naics: '236118',
    name: 'Residential Remodeling',
    capitalNeedMonths: [2, 3, 4],
    collectionMonths: [5, 6, 7, 8, 9],
    revenueLagDays: 45,
    grossMarginPct: 0.32,
    collateralQuality: 'receivables',
    cyclicality: 'cyclical',
    seedMultiple: 2.4,
    typicalRevenue: [400_000, 3_000_000],
    notes:
      'Draws against a signed contract are collectible. Speculative remodels are not. ' +
      'Ask to see the executed contract before funding, not the pipeline.',
  },
  {
    naics: '238160',
    name: 'Roofing Contractors',
    capitalNeedMonths: [3, 4, 5],
    collectionMonths: [5, 6, 7, 8, 9, 10],
    revenueLagDays: 30,
    grossMarginPct: 0.34,
    collateralQuality: 'receivables',
    cyclicality: 'neutral',
    seedMultiple: 3.1,
    typicalRevenue: [500_000, 5_000_000],
    notes:
      'Among the best seasonal lends in the book. Material money in March becomes billed ' +
      'work by June, insurance claims pay reliably, and storm years are windfalls. The ' +
      'failure mode is the operator who takes deposits in spring and cannot staff the crews.',
  },
  {
    naics: '238210',
    name: 'Electrical Contractors',
    capitalNeedMonths: [2, 3, 4, 8, 9],
    collectionMonths: [4, 5, 6, 7, 10, 11],
    revenueLagDays: 60,
    grossMarginPct: 0.30,
    collateralQuality: 'receivables',
    cyclicality: 'neutral',
    seedMultiple: 2.2,
    typicalRevenue: [600_000, 6_000_000],
    notes:
      'Commercial subs wait on the general contractor, which is the whole risk. A 60-day ' +
      'lag cannot service a daily remittance. Structure weekly or monthly, never daily.',
  },
  {
    naics: '238220',
    name: 'Plumbing & HVAC Contractors',
    capitalNeedMonths: [3, 4, 5, 9, 10],
    collectionMonths: [5, 6, 7, 8, 11, 12, 1],
    revenueLagDays: 21,
    grossMarginPct: 0.38,
    collateralQuality: 'titled-equipment',
    cyclicality: 'defensive',
    seedMultiple: 2.8,
    typicalRevenue: [500_000, 8_000_000],
    notes:
      'Two seasons a year — cooling before summer, heating before winter — so two natural ' +
      'lending windows. Emergency service work is defensive: a failed furnace in January is ' +
      'not a deferrable purchase. One of the strongest profiles in this table.',
  },
  {
    naics: '238910',
    name: 'Site Preparation / Excavation',
    capitalNeedMonths: [2, 3, 4],
    collectionMonths: [5, 6, 7, 8, 9, 10],
    revenueLagDays: 60,
    grossMarginPct: 0.28,
    collateralQuality: 'titled-equipment',
    cyclicality: 'cyclical',
    seedMultiple: 2.0,
    typicalRevenue: [700_000, 9_000_000],
    notes:
      'Heavy titled iron is the best collateral in the book — serialized, auctionable, and ' +
      'the operator cannot hide an excavator. Offsetting that, the work is the most cyclical ' +
      'here and stops hard when construction stops.',
  },
  {
    naics: '484121',
    name: 'Long-Distance Trucking (TL)',
    capitalNeedMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 40,
    grossMarginPct: 0.18,
    collateralQuality: 'titled-equipment',
    cyclicality: 'cyclical',
    seedMultiple: 1.4,
    typicalRevenue: [200_000, 4_000_000],
    notes:
      'Thin margins and no season, so there is no window where borrowed money multiplies. ' +
      'Owner-operators borrow to cover fuel and a truck payment, which is a hole, not a seed. ' +
      'Factoring fits this trade; a fixed-fee advance usually does not.',
  },
  {
    naics: '541213',
    name: 'Tax Preparation Services',
    capitalNeedMonths: [11, 12, 1],
    collectionMonths: [2, 3, 4],
    revenueLagDays: 5,
    grossMarginPct: 0.55,
    collateralQuality: 'unsecured',
    cyclicality: 'defensive',
    seedMultiple: 3.4,
    typicalRevenue: [150_000, 1_500_000],
    notes:
      'The sharpest season in the table. Money in December staffs the office for February ' +
      'and collects at the counter with a five-day lag. Repayment is complete by May. ' +
      'Nothing to repossess, so this is a character-and-history lend.',
  },
  {
    naics: '541330',
    name: 'Engineering Services',
    capitalNeedMonths: [1, 2, 3],
    collectionMonths: [4, 5, 6, 7, 8],
    revenueLagDays: 75,
    grossMarginPct: 0.42,
    collateralQuality: 'receivables',
    cyclicality: 'neutral',
    seedMultiple: 1.8,
    typicalRevenue: [400_000, 5_000_000],
    notes:
      'Long collection lag against institutional payers. Creditworthy counterparties, slow ones. ' +
      'Price the time, not the risk.',
  },
  {
    naics: '561320',
    name: 'Temporary Staffing Agencies',
    capitalNeedMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 45,
    grossMarginPct: 0.22,
    collateralQuality: 'receivables',
    cyclicality: 'cyclical',
    seedMultiple: 1.6,
    typicalRevenue: [500_000, 10_000_000],
    notes:
      'Structurally capital-hungry: payroll goes out Friday, the invoice collects in 45 days. ' +
      'That gap is permanent and it grows with success. Good receivables against real companies. ' +
      'This is a factoring client more than an advance client.',
  },
  {
    naics: '561730',
    name: 'Landscaping Services',
    capitalNeedMonths: [2, 3],
    collectionMonths: [4, 5, 6, 7, 8, 9, 10],
    revenueLagDays: 20,
    grossMarginPct: 0.40,
    collateralQuality: 'titled-equipment',
    cyclicality: 'cyclical',
    seedMultiple: 3.2,
    typicalRevenue: [200_000, 3_000_000],
    notes:
      'The textbook seasonal lend, and the one you named. February and March money buys mulch, ' +
      'fuel, crew, and a second mower, and it bills from April. Contracted maintenance routes ' +
      'are near-annuity revenue; one-off installs are not. Underwrite the recurring contracts.',
  },
  {
    naics: '561740',
    name: 'Carpet & Upholstery Cleaning',
    capitalNeedMonths: [2, 3, 9],
    collectionMonths: [4, 5, 6, 10, 11],
    revenueLagDays: 7,
    grossMarginPct: 0.52,
    collateralQuality: 'titled-equipment',
    cyclicality: 'cyclical',
    seedMultiple: 2.6,
    typicalRevenue: [120_000, 900_000],
    notes: 'Fast collection, high margin, small tickets. Van and truck-mount are real collateral.',
  },
  {
    naics: '561720',
    name: 'Janitorial / Commercial Cleaning',
    capitalNeedMonths: [1, 7],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 35,
    grossMarginPct: 0.30,
    collateralQuality: 'receivables',
    cyclicality: 'defensive',
    seedMultiple: 1.9,
    typicalRevenue: [250_000, 4_000_000],
    notes:
      'Contracted, recurring, and boring in the way that pays. Capital need is tied to winning ' +
      'a new building, not to a season. Fund against the executed contract.',
  },
  {
    naics: '621210',
    name: 'Dental Practices',
    capitalNeedMonths: [1, 2, 9, 10],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 35,
    grossMarginPct: 0.60,
    collateralQuality: 'titled-equipment',
    cyclicality: 'defensive',
    seedMultiple: 2.1,
    typicalRevenue: [600_000, 3_000_000],
    notes:
      'Reported as the lowest-loss cohort in the SBA book. Insurance-backed receivables, ' +
      'recurring demand, licensed operator who cannot walk away from the license, and chairs ' +
      'and imaging that are titled and resaleable. Borrows for equipment and buildouts, not survival.',
  },
  {
    naics: '621310',
    name: 'Chiropractic Offices',
    capitalNeedMonths: [1, 2, 9],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 40,
    grossMarginPct: 0.58,
    collateralQuality: 'titled-equipment',
    cyclicality: 'neutral',
    seedMultiple: 1.7,
    typicalRevenue: [250_000, 1_200_000],
    notes: 'Healthcare economics with more cash-pay and less insurance backing than dental.',
  },
  {
    naics: '621320',
    name: 'Optometry Offices',
    capitalNeedMonths: [1, 8, 9],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 30,
    grossMarginPct: 0.55,
    collateralQuality: 'inventory',
    cyclicality: 'defensive',
    seedMultiple: 2.0,
    typicalRevenue: [400_000, 2_000_000],
    notes:
      'Frame inventory ahead of the back-to-school and use-your-benefits-before-December waves. ' +
      'Two clean stocking windows a year.',
  },
  {
    naics: '541940',
    name: 'Veterinary Services',
    capitalNeedMonths: [1, 2, 3],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 3,
    grossMarginPct: 0.57,
    collateralQuality: 'titled-equipment',
    cyclicality: 'defensive',
    seedMultiple: 2.2,
    typicalRevenue: [500_000, 3_000_000],
    notes:
      'Paid at the counter — a three-day lag is as good as it gets. Demand is famously ' +
      'recession-resistant. Consistently among the lowest-loss trades in the SBA data.',
  },
  {
    naics: '446110',
    name: 'Pharmacies & Drug Stores',
    capitalNeedMonths: [9, 10, 11],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 25,
    grossMarginPct: 0.22,
    collateralQuality: 'inventory',
    cyclicality: 'defensive',
    seedMultiple: 1.5,
    typicalRevenue: [1_500_000, 8_000_000],
    notes:
      'Defensive demand but brutal margins and reimbursement pressure from PBMs. High revenue ' +
      'masks thin economics. Size the advance off gross profit, never off revenue.',
  },
  {
    naics: '811111',
    name: 'General Automotive Repair',
    capitalNeedMonths: [2, 3, 9, 10],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 2,
    grossMarginPct: 0.48,
    collateralQuality: 'titled-equipment',
    cyclicality: 'defensive',
    seedMultiple: 2.5,
    typicalRevenue: [300_000, 2_500_000],
    notes:
      'Counter-paid, defensive, and lifts and diagnostic equipment are titled. Capital buys a ' +
      'bay, a lift, or parts inventory, all of which have a measurable payback. Strong profile.',
  },
  {
    naics: '722511',
    name: 'Full-Service Restaurants',
    capitalNeedMonths: [1, 2, 9],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 1,
    grossMarginPct: 0.12,
    collateralQuality: 'unsecured',
    cyclicality: 'cyclical',
    seedMultiple: 1.2,
    typicalRevenue: [400_000, 3_000_000],
    notes:
      'Reported at 12-15% default in normal conditions, the worst cohort in the SBA book, and ' +
      'worse in a downturn. Daily cash and a 1-day lag make the remittance easy to collect, ' +
      'which is exactly the trap: it is easy to collect right up until the doors close. ' +
      'A 1.2x seed multiple cannot carry expensive money. Underwrite these as an exception.',
  },
  {
    naics: '722513',
    name: 'Limited-Service Restaurants (QSR)',
    capitalNeedMonths: [1, 2],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 1,
    grossMarginPct: 0.18,
    collateralQuality: 'unsecured',
    cyclicality: 'neutral',
    seedMultiple: 1.4,
    typicalRevenue: [350_000, 2_000_000],
    notes:
      'Better than full-service on margin and resilience, and an established franchise brand ' +
      'materially changes the risk. Still a thin-margin trade with little to repossess.',
  },
  {
    naics: '445131',
    name: 'Convenience Stores',
    capitalNeedMonths: [4, 5, 10],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 1,
    grossMarginPct: 0.25,
    collateralQuality: 'inventory',
    cyclicality: 'defensive',
    seedMultiple: 1.6,
    typicalRevenue: [800_000, 4_000_000],
    notes: 'Daily cash, defensive basket, inventory is resaleable. Fuel exposure swings the margin.',
  },
  {
    naics: '448140',
    name: 'Family Clothing Stores',
    capitalNeedMonths: [7, 8, 9],
    collectionMonths: [11, 12, 1],
    revenueLagDays: 1,
    grossMarginPct: 0.45,
    collateralQuality: 'inventory',
    cyclicality: 'cyclical',
    seedMultiple: 2.0,
    typicalRevenue: [300_000, 2_500_000],
    notes:
      'One window that matters: stock for the fourth quarter, repay out of it. Miss the season ' +
      'and the collateral is last year’s inventory, which is worth a fraction of cost.',
  },
  {
    naics: '812112',
    name: 'Beauty Salons & Spas',
    capitalNeedMonths: [1, 2, 8],
    collectionMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    revenueLagDays: 1,
    grossMarginPct: 0.50,
    collateralQuality: 'unsecured',
    cyclicality: 'neutral',
    seedMultiple: 1.8,
    typicalRevenue: [150_000, 1_200_000],
    notes: 'Counter-paid and sticky clientele, but chair-rent models mean the revenue may not be the owner’s.',
  },
  {
    naics: '624410',
    name: 'Child Day Care Services',
    capitalNeedMonths: [6, 7, 8],
    collectionMonths: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12],
    revenueLagDays: 5,
    grossMarginPct: 0.35,
    collateralQuality: 'unsecured',
    cyclicality: 'defensive',
    seedMultiple: 1.9,
    typicalRevenue: [250_000, 2_000_000],
    notes:
      'Prepaid tuition and near-annuity enrollment. Summer is the hollow the loan bridges, and ' +
      'September enrollment repays it. Licensing risk is the real exposure, not credit.',
  },
  {
    naics: '713940',
    name: 'Fitness & Recreational Sports Centers',
    capitalNeedMonths: [10, 11, 12],
    collectionMonths: [1, 2, 3, 4, 5],
    revenueLagDays: 1,
    grossMarginPct: 0.42,
    collateralQuality: 'titled-equipment',
    cyclicality: 'cyclical',
    seedMultiple: 2.3,
    typicalRevenue: [300_000, 2_500_000],
    notes:
      'The cleanest inverse-season lend here: equipment and marketing money in November, ' +
      'repaid out of the January enrollment wave. Membership churn by March is the risk to size against.',
  },
] as const;

export interface ScoringTerms {
  /** Amount advanced. */
  readonly principal: number;
  /** Total repaid, including all fees. */
  readonly totalRepayment: number;
  /** Months over which repayment occurs. */
  readonly termMonths: number;
  /** Month the advance funds, 1-12. */
  readonly fundingMonth: Month;
  /** Remittance cadence — decides whether the revenue lag can service it. */
  readonly remittance: 'daily' | 'weekly' | 'monthly';
}

export interface IndustryScore {
  readonly naics: string;
  readonly name: string;
  readonly rank: number;
  /** Yield on the advance, annualized, as a decimal. */
  readonly grossYield: number;
  /** Yield after subtracting the sourced expected loss. */
  readonly riskAdjustedYield: number;
  readonly expectedLossRate: number;
  /** 0-100. Higher is a better risk-reward trade. */
  readonly score: number;
  /** True when the advance funds inside the trade's pre-season window. */
  readonly inSeason: boolean;
  /** True when the revenue lag cannot support the chosen remittance cadence. */
  readonly cadenceMismatch: boolean;
  readonly flags: readonly string[];
  readonly plain: string;
}

const MAX_RATE_AGE_MONTHS = 18;

function monthsBetween(iso: string, now: Date): number {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

/**
 * Score one trade for one proposed advance.
 *
 * Throws rather than guessing when the loss rate is missing or stale. The score is
 * deliberately harsh on two things the headline rate never captures: funding
 * outside the season, and a remittance cadence the collection cycle cannot carry.
 */
export function scoreIndustry(
  profile: IndustryProfile,
  lossRate: SourcedRate | undefined,
  terms: ScoringTerms,
  now: Date = new Date(),
): IndustryScore {
  if (!lossRate || !lossRate.source?.trim() || !lossRate.asOf?.trim()) {
    throw new UnsourcedRateError(profile.naics);
  }
  if (monthsBetween(lossRate.asOf, now) > MAX_RATE_AGE_MONTHS) {
    throw new StaleRateError(profile.naics, lossRate.asOf, MAX_RATE_AGE_MONTHS);
  }
  if (terms.principal <= 0) throw new RangeError('Principal must be positive.');
  if (terms.totalRepayment <= terms.principal) {
    throw new RangeError('Total repayment must exceed principal, or this is not a loan.');
  }
  if (terms.termMonths <= 0) throw new RangeError('Term must be positive.');

  const years = terms.termMonths / 12;
  const grossYield = (terms.totalRepayment / terms.principal - 1) / years;

  const inSeason = profile.capitalNeedMonths.includes(terms.fundingMonth);
  const lagDaysAllowed =
    terms.remittance === 'daily' ? 15 : terms.remittance === 'weekly' ? 35 : 75;
  const cadenceMismatch = profile.revenueLagDays > lagDaysAllowed;

  const flags: string[] = [];

  // Out-of-season money is not seed money. Penalize the expected loss, not the yield,
  // because the yield is contractual and the loss is what actually changes.
  let effectiveLoss = lossRate.value;
  if (!inSeason) {
    effectiveLoss *= 1.6;
    flags.push(
      `Funding in month ${terms.fundingMonth} is outside this trade’s capital window ` +
        `(${profile.capitalNeedMonths.join(', ')}). Money lent outside the season usually ` +
        'plugs a hole instead of buying revenue.',
    );
  }
  if (cadenceMismatch) {
    effectiveLoss *= 1.5;
    flags.push(
      `A ${profile.revenueLagDays}-day collection cycle cannot service a ${terms.remittance} ` +
        'remittance. The borrower will fund payments out of the advance itself, which is how ' +
        'a performing loan becomes a default in month three.',
    );
  }
  if (profile.seedMultiple < 1.5) {
    effectiveLoss *= 1.3;
    flags.push(
      `Seed multiple of ${profile.seedMultiple}x is too thin to carry priced money. Every ` +
        'dollar borrowed returns less than a dollar fifty of revenue before costs.',
    );
  }
  if (profile.collateralQuality === 'unsecured') {
    flags.push('Nothing to repossess. This is a character and cash-flow lend, priced accordingly.');
  }
  if (profile.cyclicality === 'cyclical') {
    flags.push('Discretionary demand. Model this cohort again at a recession loss rate before scaling into it.');
  }

  effectiveLoss = Math.min(effectiveLoss, 0.95);
  const riskAdjustedYield = grossYield - effectiveLoss / years;

  // Score blends the risk-adjusted yield with the structural qualities that
  // decide whether the loan survives contact with a bad quarter.
  const yieldPoints = Math.max(0, Math.min(50, riskAdjustedYield * 100));
  const collateralPoints =
    profile.collateralQuality === 'titled-equipment'
      ? 20
      : profile.collateralQuality === 'receivables'
        ? 15
        : profile.collateralQuality === 'inventory'
          ? 8
          : 0;
  const cyclePoints =
    profile.cyclicality === 'defensive' ? 15 : profile.cyclicality === 'neutral' ? 8 : 0;
  const seasonPoints = inSeason ? 10 : 0;
  const cadencePoints = cadenceMismatch ? 0 : 5;

  const score = Math.max(
    0,
    Math.round(yieldPoints + collateralPoints + cyclePoints + seasonPoints + cadencePoints),
  );

  return {
    naics: profile.naics,
    name: profile.name,
    rank: 0,
    grossYield: Number(grossYield.toFixed(4)),
    riskAdjustedYield: Number(riskAdjustedYield.toFixed(4)),
    expectedLossRate: Number(effectiveLoss.toFixed(4)),
    score,
    inSeason,
    cadenceMismatch,
    flags,
    plain:
      `${profile.name}: ${(grossYield * 100).toFixed(1)}% gross, ` +
      `${(riskAdjustedYield * 100).toFixed(1)}% after an expected ${(effectiveLoss * 100).toFixed(1)}% loss. ` +
      `${inSeason ? 'Funded in season.' : 'Funded OUT of season.'} ` +
      `Collateral: ${profile.collateralQuality}. ` +
      `Loss rate ${(lossRate.value * 100).toFixed(2)}% — ${lossRate.source}, ${lossRate.asOf}.`,
  };
}

/** Score every trade for which a sourced loss rate exists, best first. */
export function rankIndustries(
  lossRates: ReadonlyMap<string, SourcedRate>,
  terms: ScoringTerms,
  now: Date = new Date(),
): IndustryScore[] {
  const scored: IndustryScore[] = [];
  for (const profile of INDUSTRY_PROFILES) {
    const rate = lossRates.get(profile.naics);
    if (!rate) continue; // Unsourced trades are omitted, never guessed.
    scored.push(scoreIndustry(profile, rate, terms, now));
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

/** Which trades need capital in a given month. This is the calendar the campaign runs off. */
export function tradesNeedingCapital(month: Month): readonly IndustryProfile[] {
  return INDUSTRY_PROFILES.filter((p) => p.capitalNeedMonths.includes(month));
}

export interface SbaLoanRow {
  readonly naics: string;
  readonly grossApproval: number;
  readonly loanStatus: string;
  readonly grossChargeOffAmount: number;
  readonly approvalFiscalYear: number;
}

/**
 * Turn the SBA FOIA loan-level extract into the sourced rates this engine requires.
 *
 * The dataset is published at data.sba.gov (7(a) and 504 FOIA release) as loan-level
 * CSV including NAICS, gross approval, loan status, and charge-off amount. Pull it,
 * parse it to SbaLoanRow[], and hand it here.
 *
 * Rate is computed dollar-weighted, not loan-count-weighted: charged-off dollars over
 * approved dollars. Count-weighting flatters a book where the small loans fail and the
 * large ones hold, which is the usual shape.
 */
export function loadSbaChargeOffRates(
  rows: readonly SbaLoanRow[],
  opts: { readonly sourceLabel: string; readonly asOf: string; readonly minLoans?: number },
): Map<string, SourcedRate> {
  if (!opts.sourceLabel?.trim() || !opts.asOf?.trim()) {
    throw new Error('loadSbaChargeOffRates needs a source label and an as-of date.');
  }
  const minLoans = opts.minLoans ?? 50;

  const agg = new Map<string, { approved: number; chargedOff: number; count: number }>();
  for (const row of rows) {
    // SBA publishes 6-digit NAICS; roll to the 6-digit keys this table uses.
    const key = row.naics?.slice(0, 6);
    if (!key) continue;
    const cur = agg.get(key) ?? { approved: 0, chargedOff: 0, count: 0 };
    cur.approved += row.grossApproval;
    cur.chargedOff += row.grossChargeOffAmount;
    cur.count += 1;
    agg.set(key, cur);
  }

  const out = new Map<string, SourcedRate>();
  agg.forEach((a, naics) => {
    // A rate off a handful of loans is noise wearing a decimal point.
    if (a.count < minLoans || a.approved <= 0) return;
    out.set(naics, {
      value: Number((a.chargedOff / a.approved).toFixed(5)),
      source: opts.sourceLabel,
      asOf: opts.asOf,
      sampleSize: a.count,
      basis: 'sba-7a-charge-off',
    });
  });
  return out;
}

export const LENDING_RULES = {
  neverPrinted: [
    'A default or repayment rate with no source and no as-of date beside it.',
    'A "top 25" ranking that hides the trades whose loss rate we could not source.',
    'A count-weighted loss rate presented as if it were dollar-weighted.',
    'A seasonal window presented as a guarantee. It is where the odds sit, not a promise.',
    'A recommendation to fund a cyclical trade at a boom-year loss rate without also showing the recession rate.',
  ],
} as const;
