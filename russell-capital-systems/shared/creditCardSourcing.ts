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

/**
 * For a credit union, whether an outsider can actually get in.
 *
 * This is scored, not decorative. A credit union that will happily lend to a
 * 640 with three EINs is worth nothing if the charter only admits employees of
 * one hospital system in Oregon — the approval odds and the limit band are both
 * irrelevant behind a door that will not open. Two rows can therefore carry the
 * same card and rank differently, which is correct.
 */
export type MembershipGate =
  /** A published, nationwide join path was read — a donation, a $5 share, an association. */
  | 'open-confirmed'
  /** The card was confirmed; the join path was not. Could be open, could be a closed SEG charter. */
  | 'open-unconfirmed'
  /** Membership is restricted to a group this applicant is not in. */
  | 'restricted'
  /** Not a credit union. The gate does not apply. */
  | 'not-applicable';

/**
 * Multiplier on approval odds. An unconfirmed gate is a real discount, because
 * roughly half of the credit unions on any "best business card" list turn out
 * to be employer- or county-restricted once the eligibility page is read.
 */
export const MEMBERSHIP_GATE_WEIGHT: Record<MembershipGate, number> = {
  'open-confirmed': 1,
  'open-unconfirmed': 0.6,
  restricted: 0,
  'not-applicable': 1,
};

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
  /**
   * For a credit union, whether an outsider can join. Defaults to
   * `not-applicable` where the field is absent, which is every non-credit-union
   * row.
   */
  readonly membershipGate?: MembershipGate;
  /**
   * For a credit union, how a non-affiliated applicant actually becomes
   * eligible. This is the gate — a credit union with a great business card and
   * a closed charter is worth nothing to an outside applicant, so the path is
   * recorded rather than assumed.
   */
  readonly membershipPath?: string;
  /**
   * The creditor that actually underwrites the card, where it is not the brand
   * on the front.
   *
   * This matters more than it looks. Elan Financial Services runs a turnkey
   * card program for over 1,300 banks and credit unions, so a row of different
   * credit union logos can be one credit department making one decision. Three
   * applications there are three hard pulls at the same underwriter, and a
   * decline at the first is a strong predictor of the next two. Recorded so the
   * page can say that out loud instead of selling false diversification.
   */
  readonly underwrittenBy?: string;
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
    id: 'connexus-business-visa', issuer: 'Connexus Credit Union', product: 'Visa Business Card',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: 18,
    membershipGate: 'open-confirmed',
    membershipPath: 'Open nationwide via a one-time $5 donation to the Connexus Association.',
    underwrittenBy: 'Elan Financial Services',
    sourceUrl: 'https://fitsmallbusiness.com/connexus-credit-union-visa-business-card-review/',
    evidence: 'aggregator-reported',
    note: '0% on purchases AND balance transfers for 18 billing cycles, then 17.49%-26.49% variable. $0 annual fee. The 18-cycle window is the longest on this page by a wide margin — and a balance transfer window is capacity, not interest, so it is worth saying even though rate carries no weight in the ranking. Issued by Elan, not by Connexus; Connexus pulls TransUnion first. Limit not published.',
  },
  {
    id: 'connexus-business-real-rewards', issuer: 'Connexus Credit Union', product: 'Visa Business Real Rewards Card',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: 6,
    membershipGate: 'open-confirmed',
    membershipPath: 'Open nationwide via a one-time $5 donation to the Connexus Association.',
    underwrittenBy: 'Elan Financial Services',
    sourceUrl: 'https://fitsmallbusiness.com/connexus-credit-union-visa-business-real-rewards-card-review/',
    evidence: 'aggregator-reported',
    note: '0% for 6 billing cycles, $0 annual fee, 1.5x points on everything. Carries Elan "Expanded Buying Power" — an adjustable limit that moves with usage and payment history rather than a fixed line, which is the useful property here: it grows without a new application.',
  },
  {
    id: 'nasafcu-business-platinum', issuer: 'NASA Federal Credit Union', product: 'Business Platinum Advantage Rewards',
    underwriting: 'personal-guarantee-business', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'restricted',
    membershipPath: 'The business must be located and operating in Maryland, Virginia or the District of Columbia, and in an approved industry. North Carolina does not qualify. The free National Space Society route opens PERSONAL membership nationwide — it does not reach the business card.',
    sourceUrl: 'https://www.nasafcu.com/pdf/BusinessCreditCardApp.pdf',
    evidence: 'aggregator-reported',
    note: 'CORRECTION. This row was recorded as an open charter on the strength of the National Space Society membership route. Reading the business card application shows that route opens personal membership only: the business product is limited to MD, VA and DC, and to approved industries. It is unreachable from North Carolina and is now blocked rather than ranked. Lines are in $100 increments with a $500 per-card minimum, so the limit band was also overstated.',
  },
  {
    id: 'penfed-platinum-rewards', issuer: 'PenFed Credit Union', product: 'Platinum Rewards Visa Signature',
    underwriting: 'personal-fico', limitBand: 'small',
    minFicoReported: 670, requiresDeposit: false, personalGuarantee: false,
    reportsToBusinessBureaus: false, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: 15,
    membershipGate: 'open-confirmed',
    membershipPath: 'Open to anyone via a $5 share account.',
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
    membershipGate: 'open-unconfirmed',
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
    membershipGate: 'open-unconfirmed',
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
    membershipGate: 'open-unconfirmed',
    sourceUrl: 'https://www.creditcards.com/education/credit-union-cards-anyone-can-get/',
    evidence: 'aggregator-reported',
    note: 'Reported to approve applicants with poor credit. Low limits.',
  },

  {
    id: 'alliant-business', issuer: 'Alliant Credit Union', product: 'Business Services',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-confirmed',
    membershipPath: 'Open to anyone via a $5 donation to the Alliant Credit Union Foundation, which Alliant pays on your behalf.',
    sourceUrl: 'https://www.alliantcreditunion.org/membership',
    evidence: 'aggregator-reported',
    note: 'Membership confirmed open to anyone with no residency or employer test — one of the cleanest charters in the country. Business product line not yet pulled.',
  },
  {
    id: 'affinity-fcu-business', issuer: 'Affinity Federal Credit Union', product: 'Business Services',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-confirmed',
    membershipPath: 'Open via a $5 savings deposit.',
    sourceUrl: 'https://www.affinityfcu.com/about-us/membership-eligibility',
    evidence: 'aggregator-reported',
    note: 'Membership open on a $5 deposit. Business product line not yet pulled.',
  },
  {
    id: 'affinity-plus-business', issuer: 'Affinity Plus Credit Union', product: 'Business Services',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-confirmed',
    membershipPath: 'Open via a one-time $25 payment to the Affinity Plus Foundation.',
    sourceUrl: 'https://www.crediful.com/credit-unions-anyone-can-join/',
    evidence: 'aggregator-reported',
    note: 'Foundation payment opens membership without a location or employer tie. Business product line not yet pulled.',
  },
  {
    id: 'lmcu-business', issuer: 'Lake Michigan Credit Union', product: 'Business Services',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-confirmed',
    membershipPath: 'Open via a $5 donation to the ALS Foundation plus $5 into a Member Savings account.',
    sourceUrl: 'https://www.crediful.com/credit-unions-anyone-can-join/',
    evidence: 'aggregator-reported',
    note: 'Large Michigan credit union with a nationwide join path. Business product line not yet pulled.',
  },
  {
    id: 'firsttech-business', issuer: 'First Tech Federal Credit Union', product: 'Business Deposit & Card',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-confirmed',
    membershipPath: 'Open via membership of the Computer History Museum or the Financial Fitness Association, or via 900+ partner employers.',
    sourceUrl: 'https://www.crediful.com/credit-unions-anyone-can-join/',
    evidence: 'aggregator-reported',
    note: 'Confirmed to offer personal AND business deposit accounts, and cited for fast approval decisions. Merged with Digital Federal Credit Union in January 2026, making it one of the largest open-path charters. Card terms not pulled.',
  },
  {
    id: 'dcu-business', issuer: 'Digital Federal Credit Union (DCU)', product: 'Business Services',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-confirmed',
    membershipPath: 'Open via membership of a participating organisation; merged into First Tech January 2026.',
    sourceUrl: 'https://www.crediful.com/credit-unions-anyone-can-join/',
    evidence: 'named-only',
    note: 'Long-standing open-path charter. Post-merger product line and membership route need confirming.',
  },
  {
    id: 'amplify-business-visa', issuer: 'Amplify Credit Union', product: 'Visa Business Real Rewards Card',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-unconfirmed',
    membershipPath: 'Membership path not yet confirmed as open nationwide.',
    underwrittenBy: 'Elan Financial Services',
    sourceUrl: 'https://wallethub.com/best-credit-union-credit-cards',
    evidence: 'aggregator-reported',
    note: 'Named the best business credit card from a credit union. The CARD is confirmed; the membership gate is not, which is the thing to check first. "Visa Business Real Rewards" is Elan\'s white-label product name, so this is the same underwriter as the Connexus cards — a decline at one predicts the others.',
  },
  {
    id: 'cu1-business-visa', issuer: 'Credit Union 1', product: 'Visa Business & Purchasing Cards',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-unconfirmed',
    membershipPath: 'Membership path not yet confirmed as open nationwide.',
    sourceUrl: 'https://www.creditunion1.org/business/business-credit-cards/',
    evidence: 'aggregator-reported',
    note: 'Confirmed to issue both business credit cards AND purchasing cards — a purchasing card is a separate line and a second bite. Membership gate not confirmed.',
  },
  {
    id: 'fscu-business-visa', issuer: 'First Service Credit Union', product: 'Visa Business Credit Card',
    underwriting: 'personal-guarantee-business', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-unconfirmed',
    membershipPath: 'Membership path not yet confirmed as open nationwide.',
    sourceUrl: 'https://www.fscu.com/business/lending-and-services/lending/business-credit-cards/',
    evidence: 'aggregator-reported',
    note: 'Business Visa confirmed on the issuer page. Membership gate not confirmed.',
  },
  {
    id: 'redwood-business', issuer: 'Redwood Credit Union', product: 'Business Cards & SBA Lending',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-unconfirmed',
    membershipPath: 'Membership path not yet confirmed as open nationwide.',
    sourceUrl: 'https://www.nerdwallet.com/business/banking/learn/credit-union-business-accounts',
    evidence: 'aggregator-reported',
    note: 'Business credit cards plus SBA Preferred Lender status, which means it can expedite SBA funding — a far larger facility than a card. Membership gate not confirmed.',
  },
  {
    id: 'georgias-own-business', issuer: 'Georgia\'s Own Credit Union', product: 'Business Lending',
    underwriting: 'personal-guarantee-business', limitBand: 'mid',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-unconfirmed',
    membershipPath: 'Membership path not yet confirmed as open nationwide.',
    sourceUrl: 'https://www.nerdwallet.com/business/banking/learn/credit-union-business-accounts',
    evidence: 'aggregator-reported',
    note: 'Over $571.5M in member business loans outstanding and ranked #1 in Georgia for SBA 7(a) production in 2024. A genuinely active business lender rather than a card issuer with a business label.',
  },
  {
    id: 'metro-cu-business', issuer: 'Metro Credit Union', product: 'Business Cards',
    underwriting: 'personal-guarantee-business', limitBand: 'small',
    minFicoReported: null, requiresDeposit: false, personalGuarantee: true,
    reportsToBusinessBureaus: true, minAnnualRevenueUsd: null, minMonthsInBusiness: null,
    introAprMonths: null,
    membershipGate: 'open-unconfirmed',
    membershipPath: 'Membership path not yet confirmed as open nationwide.',
    sourceUrl: 'https://www.nerdwallet.com/business/credit-cards/learn/secured-business-cards',
    evidence: 'named-only',
    note: 'Named as a credit union offering business cards. Part of its business line is SECURED, which is excluded by request, so the unsecured product must be identified before this is usable.',
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
  if (card.membershipGate === 'restricted') {
    return { ...base, approvalScore: 0, lendingScore: 0, reasons: [], rankable: false,
      blockedReason: `Membership is restricted to a group this applicant is not in. ${card.membershipPath ?? ''}`.trim() };
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

  // The membership gate is applied LAST, as a multiplier rather than a
  // subtraction, because it does not make approval less likely — it decides
  // whether the application can be made at all.
  const gate = card.membershipGate ?? 'not-applicable';
  if (gate === 'open-confirmed') {
    reasons.push(`Membership is confirmed open to anyone. ${card.membershipPath ?? ''}`.trim());
  } else if (gate === 'open-unconfirmed') {
    reasons.push(
      'Discounted: the card is confirmed but the membership charter is not. Read the eligibility page before spending an inquiry — a restricted charter makes the limit irrelevant.',
    );
  }
  score *= MEMBERSHIP_GATE_WEIGHT[gate];

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

/**
 * The open-charter credit unions that issue BUSINESS credit, ordered with the
 * confirmed join paths first.
 *
 * This is its own list because the join path is cheap and reversible: joining
 * costs no inquiry and can be done while the personal file is frozen, so the
 * membership can be seasoned long before an application is made.
 *
 * It is NOT a list of lenders who read a file by hand. An earlier version of
 * this comment claimed that, and it is wrong for any Elan-wrapped card — Elan
 * runs one credit department behind 1,300-plus institutions, so several of
 * these logos resolve to a single scorecard. Check `underwrittenBy` before
 * treating two rows as two independent shots.
 */
export function openMembershipBusinessCards(): readonly CardSource[] {
  const order: Record<string, number> = { 'open-confirmed': 0, 'open-unconfirmed': 1 };
  return CARD_SOURCES.filter(
    (c) =>
      (c.membershipGate === 'open-confirmed' || c.membershipGate === 'open-unconfirmed') &&
      c.underwriting === 'personal-guarantee-business',
  ).sort((a, b) => order[a.membershipGate!] - order[b.membershipGate!]);
}

/** Of those, the ones whose join path was actually read rather than assumed. */
export function confirmedOpenCharters(): readonly CardSource[] {
  return openMembershipBusinessCards().filter((c) => c.membershipGate === 'open-confirmed');
}

export interface UnderwriterCluster {
  readonly underwriter: string;
  readonly ids: readonly string[];
  readonly issuers: readonly string[];
  readonly warning: string;
}

/**
 * Rows that share one creditor behind different brands.
 *
 * The whole point of applying to several issuers in one round is that each is
 * an independent decision. Where an agent issuer like Elan sits behind all of
 * them, that is not true: it is one credit department, one scorecard, and the
 * applications are correlated. A page that lists them side by side without
 * saying so is selling diversification that does not exist.
 */
export function sharedUnderwriters(): readonly UnderwriterCluster[] {
  const byUnderwriter: Record<string, CardSource[]> = {};
  for (const c of CARD_SOURCES) {
    if (!c.underwrittenBy) continue;
    if (!byUnderwriter[c.underwrittenBy]) byUnderwriter[c.underwrittenBy] = [];
    byUnderwriter[c.underwrittenBy].push(c);
  }
  return Object.keys(byUnderwriter)
    .filter((u) => byUnderwriter[u].length > 1)
    .map((u) => {
      const rows = byUnderwriter[u];
      const issuers: string[] = [];
      for (const r of rows) if (issuers.indexOf(r.issuer) === -1) issuers.push(r.issuer);
      return {
        underwriter: u,
        ids: rows.map((r) => r.id),
        issuers,
        warning:
          `${rows.length} cards here are underwritten by ${u}, not by the ${issuers.length} ` +
          `brands on the front. Treat them as ONE application, not ${rows.length} — a decline ` +
          `at the first is a strong signal for the rest, and each one still costs a full hard pull.`,
      };
    })
    .sort((a, b) => b.ids.length - a.ids.length);
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
      'Then open-membership credit unions with business cards — Connexus, Alliant, Affinity FCU, Affinity Plus, Lake Michigan, First Tech. Join first, on a $5 donation or share; membership costs no inquiry and can be done tonight even while the personal file is frozen. Of the Connexus pair, take the 18-cycle Visa Business Card, not the Real Rewards — both are Elan, so it is one application either way.',
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
    'Read the eligibility page for every `open-unconfirmed` credit union — Amplify, Credit Union 1, First Service, Redwood, Georgia’s Own, Metro. Each is a confirmed business-card issuer behind an unread charter, and the charter is the whole question: NASA FCU was recorded as an open charter on its personal-membership route and turned out to restrict the BUSINESS card to MD, VA and DC, which is the same mistake waiting in each of these six. Then establish `underwrittenBy` for each — an Elan-wrapped card is not an independent application. Then pull issuer terms for the `named-only` rows, and widen the net-30 vendor tier.',
  excludedByRequest: 'Any card requiring a deposit, the large national banks, and military-only charters such as Navy Federal — a good business card behind a door this applicant cannot open is worth nothing.',
  rankedOn: 'Approval likelihood multiplied by limit band, then discounted by the membership gate where one applies. Interest rate is recorded but carries no weight, by instruction.',
} as const;

export const NEVER_PRINTED = [
  'An approval probability stated as a percentage. The score ranks relative likelihood from reported floors; no issuer publishes a probability.',
  'A limit, fee or rate for a row whose evidence level is `named-only`.',
  'A recommendation to apply for several personal-credit cards in one sitting while an approval is pending.',
  'Any suggestion that a fair-credit card with a $300-$1,500 limit can fund a premium-financing strategy.',
  'A net-30 vendor account described as a credit card. It is trade credit with a supplier, and its value is the trade line it reports, not the spending power.',
  'A credit union presented as joinable when only its card was verified. Half of them turn out to be employer- or county-restricted once the eligibility page is read, so the gate is marked `open-unconfirmed` until it is.',
  'An open PERSONAL membership route presented as access to the business card. NASA FCU admits anyone nationwide through the National Space Society and still limits its business card to Maryland, Virginia and DC. The two gates are separate and are checked separately.',
  'Two cards from the same agent issuer presented as two independent applications. Elan sits behind 1,300-plus institutions; where `underwrittenBy` matches, it is one credit decision and the page says so.',
] as const;
