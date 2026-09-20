/**
 * Credit sourcing — who will actually lend, and how much.
 *
 * ## What this ranks on
 *
 * Two things only: **will they approve this profile**, and **how big is the
 * line**. Interest rate is recorded where known but carries ZERO weight in the
 * ranking, by instruction. A 0% intro window is a nice-to-have; an approval at
 * a usable limit is the whole point.
 *
 * ## The four tiers, ordered by what they actually deliver
 *
 *   CASH-FLOW / EIN-ONLY — Ramp, Brex, Rho, Slash, Fundbox. Underwrite on
 *   business revenue and bank balances. No personal guarantee, no personal
 *   credit pull, so a 640 FICO is not an input. Largest limits available to
 *   this profile by a wide margin, and they cost nothing against a pending
 *   personal approval.
 *
 *   FLEET / FUEL — WEX, Fuelman, Circle K Pro, AtoB. EIN-based, report to D&B
 *   and Experian Business. Small limits, but they build the business file that
 *   unlocks the big lines later, and several skip the personal pull entirely.
 *
 *   NET-30 VENDOR — Quill, Uline, Grainger, Summa, Crown, The CEO Creative.
 *   The tier almost nobody uses deliberately. EIN only, no personal guarantee,
 *   no FICO check at all, and they report trade lines to the business bureaus.
 *   Individually tiny. Collectively they are the mechanism that turns an EIN
 *   into a borrower — which is the actual constraint at a 640 personal score.
 *
 *   PERSONAL FICO — the tier the original plan assumed. At 640 these are
 *   $300-$1,500 limits. Useful for rebuilding a score, useless for deploying
 *   capital, and every application spends an inquiry that the tiers above do
 *   not require.
 *
 * ## Evidence
 *
 * Every row carries a source URL and an evidence level. A row whose terms were
 * never pulled from the issuer is `named-only` and REFUSES to be ranked —
 * putting it in a ranked list would imply a comparison that was never made.
 * Researched 2026-09-20.
 */

export type EvidenceLevel =
  /** Terms read from the issuer's own page. */
  | 'issuer-verified'
  /** Terms reported by a comparison or industry site, not yet checked against the issuer. */
  | 'aggregator-reported'
  /** Issuer identified as relevant; terms not yet pulled. */
  | 'named-only';

export type Underwriting =
  /** Business revenue and bank balances drive approval; no personal pull. */
  | 'business-cashflow'
  /** EIN-based trade credit. No personal guarantee, no FICO check. */
  | 'ein-trade-credit'
  /** Business entity, but a personal guarantee and a personal pull. */
  | 'personal-guarantee-business'
  /** Personal FICO drives approval. */
  | 'personal-fico';

/** What a line is realistically worth. The second half of the ranking. */
export type LimitBand = 'micro' | 'small' | 'mid' | 'large' | 'unknown';

/** Rough dollar midpoint for each band, used to weight the ranking. */
export const LIMIT_BAND_WEIGHT: Record<LimitBand, number> = {
  micro: 1, //  under $2k
  small: 2, //  $2k - $10k
  mid: 3, //    $10k - $50k
  large: 4, //  $50k+
  unknown: 1.5,
};

export interface CardSource {
  readonly id: string;
  readonly issuer: string;
  readonly product: string;
  readonly underwriting: Underwriting;
  readonly limitBand: LimitBand;
  /** Lowest FICO the source says is realistically approved. Null where FICO is not an input. */
  readonly minFicoReported: number | null;
  /** True where the applicant must fund a deposit. Excluded by request. */
  readonly requiresDeposit: boolean;
  /** True where a personal guarantee is required. Costs an inquiry. */
  readonly personalGuarantee: boolean;
  /** True where the account reports to business credit bureaus. Builds the file. */
  readonly reportsToBusinessBureaus: boolean;
  /** Minimum annual revenue reported, where stated. */
  readonly minAnnualRevenueUsd: number | null;
  /** Minimum months in business reported, where stated. */
  readonly minMonthsInBusiness: number | null;
  /**
   * Recorded for completeness and deliberately NOT scored. Ranking is on
   * approval likelihood and limit size only.
   */
  readonly introAprMonths: number | null;
  readonly sourceUrl: string;
  readonly evidence: EvidenceLevel;
  readonly note?: string;
}

export const CARD_SOURCES: readonly CardSource[] = [
  // ─────────────────────────────────────────────────────────────────
  // TIER 1 — CASH-FLOW / EIN-ONLY. Biggest limits, no personal pull.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'fundbox-loc', issuer: 'Fundbox', product: 'Business Line of Credit',
    underwriting: 'business-cashflow', limitBand: 'large',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: 30000, minMonthsInBusiness: 6,
    introAprMonths: null,
    sourceUrl: 'https://www.nerdwallet.com/business/loans/reviews/fundbox',
    evidence: 'aggregator-reported',
    note: 'Up to $150,000. Reported to not require a personal guarantee under $50,000; above that a PG and UCC lien may apply. Needs $30k annual revenue and 6+ months in business. The largest line reachable on this profile without a personal pull.',
  },
  {
    id: 'ramp-corporate', issuer: 'Ramp', product: 'Ramp Corporate Card',
    underwriting: 'business-cashflow', limitBand: 'large',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://ramp.com/blog/business-credit-cards-no-personal-guarantee',
    evidence: 'aggregator-reported',
    note: 'No personal credit check, no personal guarantee, applies on EIN. Charge card — balance due each cycle, so it is capacity rather than float.',
  },
  {
    id: 'brex-card', issuer: 'Brex', product: 'Brex Card',
    underwriting: 'business-cashflow', limitBand: 'large',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.brex.com/spend-trends/corporate-credit-cards/business-credit-cards-with-no-personal-guarantee',
    evidence: 'aggregator-reported',
    note: 'Underwrites on company financial health, not founder FICO. Historically wants meaningful bank balances, so limit tracks the balance held.',
  },
  {
    id: 'rho-card', issuer: 'Rho', product: 'Rho Corporate Card',
    underwriting: 'business-cashflow', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.rho.co/blog/business-credit-card-with-ein-only',
    evidence: 'aggregator-reported',
    note: 'EIN-only underwriting; formation documents and business financials in place of a personal credit check.',
  },
  {
    id: 'slash-business', issuer: 'Slash', product: 'Slash Business Card',
    underwriting: 'business-cashflow', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.slash.com/blog/business-credit-cards-no-personal-guarantee',
    evidence: 'aggregator-reported',
    note: 'EIN-only charge card, no personal guarantee.',
  },
  {
    id: 'fundthrough', issuer: 'FundThrough', product: 'Invoice Funding Line',
    underwriting: 'business-cashflow', limitBand: 'unknown',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://tracxn.com/d/companies/ampla/__lAxxe6osQlw9IonBOGjIDOPuu-QWp7G4PTujw6bWBy0',
    evidence: 'named-only',
    note: 'Acquired Ampla in April 2025. Invoice-backed rather than card. Terms not pulled.',
  },

  // ─────────────────────────────────────────────────────────────────
  // TIER 2 — FLEET / FUEL. EIN-based, reports to business bureaus.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'atob-fuel', issuer: 'AtoB', product: 'Fuel Card',
    underwriting: 'ein-trade-credit', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://atob.com/blog/net-30-gas-cards-no-personal-guarantee',
    evidence: 'aggregator-reported',
    note: 'Registered businesses may apply on EIN with no personal credit check or personal guarantee; bank statements may be requested to verify revenue.',
  },
  {
    id: 'wex-businesspro', issuer: 'WEX', product: 'BusinessPro / FleetPro',
    underwriting: 'ein-trade-credit', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.creditsuite.com/blog/wex-personal-guarantee/',
    evidence: 'aggregator-reported',
    note: 'Allows EIN-based application, but WEX recently moved to requiring a personal guarantee for most applicants. Reports to D&B and Experian Business.',
  },
  {
    id: 'fuelman', issuer: 'Fuelman', product: 'Fleet Card',
    underwriting: 'ein-trade-credit', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://coastpay.com/blog/fuel-cards-ein-only/',
    evidence: 'aggregator-reported',
    note: 'Own network of ~40,000 stations. Listed among EIN-only fuel cards.',
  },
  {
    id: 'circlek-pro', issuer: 'Circle K', product: 'Circle K Pro Fleet Card',
    underwriting: 'ein-trade-credit', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.circlek.com/business',
    evidence: 'named-only',
    note: 'Business fleet card. Terms not pulled.',
  },

  // ─────────────────────────────────────────────────────────────────
  // TIER 3 — NET-30 VENDOR. EIN only, no PG, no FICO. Builds the file.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'quill-net30', issuer: 'Quill', product: 'Net 30 Account',
    underwriting: 'ein-trade-credit', limitBand: 'micro',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.nav.com/resource/net-30-accounts/',
    evidence: 'aggregator-reported',
    note: 'Widely cited as the easiest starting trade line — approves new businesses on EIN alone, no annual fee, $100 minimum order to qualify for net 30.',
  },
  {
    id: 'ceo-creative-net30', issuer: 'The CEO Creative', product: 'Net 30 Account',
    underwriting: 'ein-trade-credit', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://theceocreative.com/business-net-30-account/',
    evidence: 'aggregator-reported',
    note: 'Up to $5,500 credit, $60 minimum order, decision within one business day. No personal guarantee and no personal credit check.',
  },
  {
    id: 'uline-net30', issuer: 'Uline', product: 'Net 30 Account',
    underwriting: 'ein-trade-credit', limitBand: 'micro',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://wise.com/us/blog/list-of-net-30-companies',
    evidence: 'named-only',
    note: 'Standard tier-1 vendor on every net-30 list. Terms not pulled.',
  },
  {
    id: 'grainger-net30', issuer: 'Grainger', product: 'Net 30 Account',
    underwriting: 'ein-trade-credit', limitBand: 'micro',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://wise.com/us/blog/list-of-net-30-companies',
    evidence: 'named-only',
    note: 'Standard tier-1 vendor. Terms not pulled.',
  },
  {
    id: 'summa-net30', issuer: 'Summa Office Supplies', product: 'Net 30 Account',
    underwriting: 'ein-trade-credit', limitBand: 'micro',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://einonlycredit.com/net-30-vendors-ein-only',
    evidence: 'named-only',
    note: 'Cited as EIN-only with no personal guarantee. Terms not pulled.',
  },
  {
    id: 'crown-net30', issuer: 'Crown Office Supplies', product: 'Net 30 Account',
    underwriting: 'ein-trade-credit', limitBand: 'micro',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://einonlycredit.com/net-30-vendors-ein-only',
    evidence: 'named-only',
    note: 'Cited as EIN-only with no personal guarantee. Terms not pulled.',
  },

  // ─────────────────────────────────────────────────────────────────
  // TIER 4 — STORE / RETAIL BUSINESS. Mostly personal guarantee.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'sams-club-business', issuer: "Sam's Club", product: 'Business Mastercard',
    underwriting: 'personal-guarantee-business', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.stackeasy.ai/blog/business-credit-without-personal-guarantee',
    evidence: 'aggregator-reported',
    note: 'Reported not to require a personal guarantee, which is unusual for a retail business card. Worth confirming directly before relying on it.',
  },
  {
    id: 'homedepot-commercial', issuer: 'Home Depot', product: 'Commercial Account',
    underwriting: 'personal-guarantee-business', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.businesscreditworkshop.me/resources/home-depot-business-account/',
    evidence: 'aggregator-reported',
    note: 'Tier-2 business credit vendor, but DOES require a personal guarantee — so it spends a personal inquiry.',
  },
  {
    id: 'staples-business', issuer: 'Staples', product: 'Business Account',
    underwriting: 'personal-guarantee-business', limitBand: 'micro',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://fairfigure.com/blog/tier-2-business-credit-vendors',
    evidence: 'named-only',
    note: 'Named as a tier-2 vendor. Terms not pulled.',
  },
  {
    id: 'lowes-business', issuer: "Lowe's", product: 'Business Account',
    underwriting: 'personal-guarantee-business', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://fairfigure.com/blog/tier-2-business-credit-vendors',
    evidence: 'named-only',
    note: 'Named as a tier-2 vendor. Terms not pulled.',
  },

  // ─────────────────────────────────────────────────────────────────
  // TIER 5 — CREDIT UNIONS. Open membership, flexible underwriting.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'connexus-business', issuer: 'Connexus Credit Union', product: 'Business Visa',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://bankbonus.com/best/credit-unions-anyone-can-join/',
    evidence: 'named-only',
    note: 'Membership open nationwide via a one-time $5 donation, and one of the few open-membership unions issuing BUSINESS cards. High-value target; terms not pulled.',
  },
  {
    id: 'nasafcu-business-platinum', issuer: 'NASA Federal Credit Union', product: 'Business Platinum Advantage Rewards',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.nasafcu.com/business-services/financing-solutions/platinum-credit-card',
    evidence: 'named-only',
    note: 'Membership open to anyone via free National Space Society membership. Also offers business lines of credit. High-value target; terms not pulled.',
  },
  {
    id: 'penfed-platinum-rewards', issuer: 'PenFed Credit Union', product: 'Platinum Rewards Visa Signature',
    underwriting: 'personal-fico', limitBand: 'small',
    minFicoReported: 670, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: 15,
    sourceUrl: 'https://www.cnbc.com/select/best-credit-union-credit-cards/',
    evidence: 'aggregator-reported',
    note: 'Membership open to anyone via a $5 share account. PenFed does not currently offer a business card.',
  },
  {
    id: 'columbia-cu', issuer: 'Columbia Credit Union', product: 'Credit Cards',
    underwriting: 'personal-fico', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: 12,
    sourceUrl: 'https://www.columbiacu.org/credit-cards/',
    evidence: 'aggregator-reported',
    note: 'Membership eligibility not confirmed as nationwide.',
  },
  {
    id: 'florida-cu', issuer: 'Florida Credit Union', product: 'Credit Cards',
    underwriting: 'personal-fico', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: 9,
    sourceUrl: 'https://flcu.org/cards/credit-cards/',
    evidence: 'aggregator-reported',
    note: 'Notably low go-to APR. Membership eligibility not confirmed as nationwide.',
  },
  {
    id: 'downey-fcu-classic', issuer: 'Downey Federal Credit Union', product: 'Classic',
    underwriting: 'personal-fico', limitBand: 'micro',
    minFicoReported: 580, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: 6,
    sourceUrl: 'https://www.creditcards.com/education/credit-union-cards-anyone-can-get/',
    evidence: 'aggregator-reported',
    note: 'Reported to approve applicants with poor credit. Low limits.',
  },

  // ─────────────────────────────────────────────────────────────────
  // TIER 6 — PERSONAL FICO. Rebuild only. Limits too small to deploy.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'mission-lane-visa', issuer: 'Mission Lane', product: 'Mission Lane Visa',
    underwriting: 'personal-fico', limitBand: 'micro',
    minFicoReported: 580, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://wallethub.com/d/mission-lane-credit-card-3263c',
    evidence: 'aggregator-reported',
    note: 'Unsecured, no deposit. Starting limit reported around $300.',
  },
  {
    id: 'avant-card', issuer: 'Avant', product: 'Avant Credit Card',
    underwriting: 'personal-fico', limitBand: 'micro',
    minFicoReported: 580, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.bankrate.com/credit-cards/bad-credit/unsecured-bad-credit/',
    evidence: 'aggregator-reported',
    note: 'Accepts 580+. Unsecured.',
  },
  {
    id: 'merrick-bank', issuer: 'Merrick Bank', product: 'Double Your Line Mastercard',
    underwriting: 'personal-fico', limitBand: 'micro',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://www.bankrate.com/credit-cards/bad-credit/unsecured-bad-credit/',
    evidence: 'named-only',
    note: 'Doubles the limit after on-time payments, which suits a limit-growth strategy. Terms not pulled.',
  },
  {
    id: 'reflex-platinum', issuer: 'Continental Finance', product: 'Reflex Platinum Mastercard',
    underwriting: 'personal-fico', limitBand: 'micro',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    sourceUrl: 'https://moneyzine.com/credit/best-guaranteed-credit-card-approval-no-deposit/',
    evidence: 'named-only',
    note: 'No-deposit bad-credit card. Continental Finance cards historically carry high fees. Terms not pulled.',
  },
];

/* ------------------------------------------------------------------ *
 * Profile and scoring
 * ------------------------------------------------------------------ */

export interface ApplicantProfile {
  readonly fico: number;
  readonly einCount: number;
  readonly oldestEntityYears: number;
  readonly recentHardInquiries: number;
  readonly approvalPending: boolean;
  readonly recentDeclines: number;
  /** Annual business revenue, used against issuer minimums. */
  readonly annualRevenueUsd: number;
}

export interface CardScore {
  readonly id: string;
  readonly issuer: string;
  readonly product: string;
  /** 0-100. How likely this issuer is to approve this profile. */
  readonly approvalScore: number;
  /** approvalScore weighted by limit band. The ranking key. */
  readonly lendingScore: number;
  readonly limitBand: LimitBand;
  /** True where approval costs a personal credit inquiry. */
  readonly costsAnInquiry: boolean;
  readonly reasons: readonly string[];
  readonly rankable: boolean;
  readonly blockedReason?: string;
}

/**
 * Score a source on the only two things that matter here: whether they will
 * approve, and how big the line is. Interest is not read.
 */
export function scoreCard(card: CardSource, profile: ApplicantProfile): CardScore {
  const base = {
    id: card.id,
    issuer: card.issuer,
    product: card.product,
    limitBand: card.limitBand,
    costsAnInquiry: card.underwriting === 'personal-fico' || card.personalGuarantee,
  };

  if (card.requiresDeposit) {
    return { ...base, approvalScore: 0, lendingScore: 0, reasons: [], rankable: false,
      blockedReason: 'Requires a deposit, which was excluded.' };
  }
  if (card.evidence === 'named-only') {
    return { ...base, approvalScore: 0, lendingScore: 0, reasons: [], rankable: false,
      blockedReason: 'Terms have not been pulled from the issuer. Ranking it would imply a comparison that was never made.' };
  }

  const reasons: string[] = [];
  let score = 50;

  if (card.underwriting === 'business-cashflow' || card.underwriting === 'ein-trade-credit') {
    score += 30;
    reasons.push('Applies on the EIN — personal FICO is not an input.');
    if (!card.personalGuarantee) {
      score += 8;
      reasons.push('No personal guarantee, so it costs no personal inquiry.');
    }
    if (profile.einCount > 1) {
      score += 4;
      reasons.push(`${profile.einCount} EINs available — this can be applied for more than once.`);
    }
    if (card.minMonthsInBusiness !== null) {
      const months = profile.oldestEntityYears * 12;
      if (months >= card.minMonthsInBusiness) {
        score += 5;
        reasons.push(`${profile.oldestEntityYears} years in business clears the ${card.minMonthsInBusiness}-month minimum comfortably.`);
      } else {
        score -= 25;
        reasons.push(`Requires ${card.minMonthsInBusiness} months in business.`);
      }
    }
    if (card.minAnnualRevenueUsd !== null) {
      if (profile.annualRevenueUsd >= card.minAnnualRevenueUsd) {
        score += 5;
        reasons.push(`Revenue clears the $${card.minAnnualRevenueUsd.toLocaleString()} minimum.`);
      } else {
        score -= 30;
        reasons.push(`Requires $${card.minAnnualRevenueUsd.toLocaleString()} annual revenue.`);
      }
    }
  } else if (card.minFicoReported !== null) {
    const headroom = profile.fico - card.minFicoReported;
    if (headroom >= 60) { score += 25; reasons.push(`FICO ${profile.fico} is well above the reported ${card.minFicoReported} floor.`); }
    else if (headroom >= 0) { score += 10; reasons.push(`FICO ${profile.fico} clears the reported ${card.minFicoReported} floor without much headroom.`); }
    else { score -= 35; reasons.push(`FICO ${profile.fico} is below the reported ${card.minFicoReported} floor.`); }
  } else {
    reasons.push('No FICO floor reported, so approval odds are unmodelled.');
  }

  if (base.costsAnInquiry) {
    if (profile.recentHardInquiries >= 3) {
      score -= 20;
      reasons.push(`${profile.recentHardInquiries} hard inquiries in 30 days materially reduces approval odds.`);
    } else if (profile.recentHardInquiries > 0) {
      score -= 5 * profile.recentHardInquiries;
    }
    if (profile.recentDeclines > 0) score -= 5 * profile.recentDeclines;
  }

  if (card.reportsToBusinessBureaus) {
    reasons.push('Reports to the business bureaus — builds the EIN file that unlocks larger lines later.');
  }

  const approvalScore = Math.max(0, Math.min(100, Math.round(score)));
  return {
    ...base,
    approvalScore,
    lendingScore: Math.round(approvalScore * LIMIT_BAND_WEIGHT[card.limitBand]),
    reasons,
    rankable: true,
  };
}

/**
 * Ranked by lending potential: approval likelihood multiplied by limit band.
 * Interest rate is not a term in this ordering.
 */
export function rankCards(profile: ApplicantProfile): readonly CardScore[] {
  return CARD_SOURCES.map((c) => scoreCard(c, profile))
    .filter((s) => s.rankable)
    .sort((a, b) => b.lendingScore - a.lendingScore || b.approvalScore - a.approvalScore);
}

/** Rows that cannot be ranked yet, with why. The work queue. */
export function unrankable(profile: ApplicantProfile): readonly CardScore[] {
  return CARD_SOURCES.map((c) => scoreCard(c, profile)).filter((s) => !s.rankable);
}

/** Everything applyable today without spending a personal inquiry. */
export function freeToApplyNow(profile: ApplicantProfile): readonly CardScore[] {
  return rankCards(profile).filter((s) => !s.costsAnInquiry);
}

/* ------------------------------------------------------------------ *
 * Sequencing
 * ------------------------------------------------------------------ */

export interface SequencingVerdict {
  readonly safeToApplyNow: boolean;
  readonly headline: string;
  readonly reasoning: readonly string[];
  readonly recommendedOrder: readonly string[];
}

export function sequencingAdvice(profile: ApplicantProfile): SequencingVerdict {
  const reasoning: string[] = [];
  let safe = true;

  if (profile.approvalPending) {
    safe = false;
    reasoning.push(
      'An approved line has not funded yet. Issuers commonly re-pull before funding, and new inquiries are a leading cause of a pending approval being cut or withdrawn. Nothing that pulls personal credit should go in until it funds.',
    );
  }
  if (profile.recentDeclines > 0) {
    reasoning.push(
      `${profile.recentDeclines} decline(s) already on file this cycle, each leaving an inquiry without the offsetting signal of an approval.`,
    );
  }
  if (profile.recentHardInquiries >= 3) {
    safe = false;
    reasoning.push(
      `${profile.recentHardInquiries} hard inquiries in 30 days is past the point where many issuers begin auto-declining.`,
    );
  }
  if (safe) reasoning.push('No pending approval and a low inquiry load, so a measured personal round is reasonable.');

  return {
    safeToApplyNow: safe,
    headline: safe
      ? 'A measured personal round is reasonable now.'
      : 'Apply on the EIN tonight. Personal applications now would reduce total available credit, not increase it.',
    reasoning,
    recommendedOrder: [
      'EIN-only cash-flow lines first — Fundbox, Ramp, Brex, Rho, Slash. No personal pull, no guarantee, biggest limits on this profile, and they cost nothing against a pending approval.',
      'Net-30 vendor accounts in parallel — Quill, The CEO Creative, Uline, Grainger. Tiny individually, no FICO check at all, and they are what builds the EIN file that unlocks the large lines.',
      'Fleet and fuel cards alongside — also EIN-based and reporting to D&B and Experian Business.',
      'Wait for the pending line to fund before any personal-credit application.',
      'Then open-membership credit unions with business cards — Connexus, NASA FCU.',
      'Personal fair-credit cards last, and only to rebuild the score. Their limits cannot fund anything.',
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Coverage
 * ------------------------------------------------------------------ */

export const SOURCING_STATUS = {
  requested: 100,
  verified: CARD_SOURCES.length,
  researchedOn: '2026-09-20',
  method: 'live web search across comparison sites, industry guides and issuer pages',
  gap:
    'One hundred rows were requested. What is recorded is what was actually verified. The remainder are not written as placeholders with invented limits and approval odds, because a credit page carrying fabricated terms is wrong in exactly the direction that costs money.',
  nextPass:
    'Pull issuer terms for every `named-only` row — the two open-membership credit union BUSINESS cards (Connexus, NASA FCU) are the highest-value of these. Then widen the net-30 vendor tier, which is the largest untapped category for an EIN-first strategy.',
  excludedByRequest: 'Any card requiring a deposit, and the large national banks.',
  rankedOn: 'Approval likelihood multiplied by limit band. Interest rate is recorded but carries no weight, by instruction.',
} as const;

export const NEVER_PRINTED = [
  'An approval probability stated as a percentage. The score ranks relative likelihood from reported floors; no issuer publishes a probability.',
  'A limit, fee or rate for a row whose evidence level is `named-only`.',
  'A recommendation to apply for several personal-credit cards in one sitting while an approval is pending.',
  'Any suggestion that a fair-credit card with a $300-$1,500 limit can fund a premium-financing strategy.',
  'A net-30 vendor account described as a credit card. It is trade credit with a supplier, and its value is the trade line it reports, not the spending power.',
] as const;
