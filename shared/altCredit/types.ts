// ============================================================
// ALTERNATIVE LINES OF CREDIT — the data model.
//
// This is the shape every page in the tab is generated from. It exists as a
// type rather than as thirty hand-written pages for one reason: a page you
// write by hand goes stale silently, and a registry with tests does not.
//
// THE CONTACT-DATA RULE, AND WHY IT IS A TYPE AND NOT A GUIDELINE.
// `phone`, `address`, `bbbRating`, `googleReviews` and the rest are all
// `Verified<T>`: a value is either { verified: true, value, source, asOf } or
// { verified: false, whyNot, checkAt }. There is no way to record a phone
// number without also recording where it came from and when it was read.
//
// That is deliberate and it is not negotiable in this file. A wrong phone
// number on a lending page does not send a client to a wrong number — it
// sends them to whoever bought that number, which in lending is an active
// fraud channel. A number that cannot be sourced is worse than a blank,
// because a blank makes the client go and look, and a wrong one does not.
// ============================================================

export type Verified<T> =
  | { verified: true; value: T; source: string; asOf: string }
  | { verified: false; whyNot: string; checkAt?: string };

export function verified<T>(value: T, source: string, asOf: string): Verified<T> {
  return { verified: true, value, source, asOf };
}

export function notVerified<T>(whyNot: string, checkAt?: string): Verified<T> {
  return { verified: false, whyNot, checkAt };
}

export function valueOf<T>(v: Verified<T>): T | null {
  return v.verified ? v.value : null;
}

/** How a figure reads on the page when it could not be confirmed. */
export const NOT_VERIFIED_LABEL = "not verified — check with the company";

export type LenderCategory =
  | "dscr" | "bridge" | "portfolio" | "crypto" | "securities" | "policy"
  | "equity-share" | "sale-leaseback" | "cdfi" | "sba" | "private-credit" | "merchant";

/**
 * A lender record. Everything a client would want before picking up the
 * phone, and nothing this system cannot show them the source for.
 */
export type Lender = {
  id: string;
  name: string;
  /** The company's own site. Always required — it is where the client verifies everything else. */
  url: string;
  categories: readonly LenderCategory[];
  /** What they actually do, from their own material. */
  what: string;
  /** Regulatory identifiers the company publishes. NMLS, state licence, CDFI certification. */
  identifiers: readonly string[];
  phone: Verified<string>;
  address: Verified<string>;
  /** Year founded or year began operating. */
  founded: Verified<number>;
  bbbRating: Verified<string>;
  googleReviews: Verified<{ count: number; rating: number }>;
  /** The published rate range, exactly as the company states it. */
  rates: Verified<string>;
  /** Maximum loan-to-value or advance rate. */
  maxAdvance: Verified<string>;
  /** Terms offered. */
  terms: Verified<string>;
  /** Minimum and maximum loan size. */
  loanSize: Verified<string>;
  /** The underwriting gate, stated concretely. */
  underwriting: readonly string[];
  /** States or jurisdictions excluded, where the company publishes them. */
  restrictions: Verified<string>;
  /** Anything genuinely distinctive — good or bad. */
  notes: readonly string[];
};

export type RiskFactor = {
  risk: string;
  /** How likely this is to actually bite, per client, stated as a band rather than false precision. */
  likelihood: "rare" | "occasional" | "common" | "near-certain";
  /** What it costs when it does. */
  consequence: string;
  /** What reduces it. */
  mitigation: string;
};

export type WorkedExample = {
  who: string;
  /** Their position, in figures. */
  position: readonly string[];
  /** What this route would actually do for them. */
  outcome: readonly string[];
  /** The honest verdict for THIS person. */
  verdict: "strong fit" | "workable" | "poor fit" | "wrong tool";
  why: string;
};

/** A question people actually type into a search engine about this topic. */
export type CommonQuestion = { question: string; answer: string };

/**
 * How far a page is written out. Every route and every strategy is currently
 * "full" — over a thousand words, with worked arithmetic — and a test enforces
 * it. "structured" remains in the type for anything added in outline first, so
 * that a half-written page is labelled rather than passed off as finished.
 */
export type Depth = "full" | "structured";

export type CreditRoute = {
  slug: string;
  n: number;
  title: string;
  /** The URL description — what this is, in one line, for a link preview. */
  description: string;
  family: RouteFamily;
  depth: Depth;
  /** The long-form explanation. Paragraphs, not bullets. */
  body: readonly string[];
  /** The mechanics of underwriting, step by step, as the lender actually runs it. */
  underwritingMechanics: readonly string[];
  /** What is pledged, and what happens to it. */
  collateral: string;
  /** Lender ids from the directory. */
  lenderIds: readonly string[];
  risks: readonly RiskFactor[];
  examples: readonly WorkedExample[];
  questions: readonly CommonQuestion[];
  /** Risk-adjusted attractiveness for a rental-property owner, 1 (worst) to 10 (best). */
  scoreForRentalOwner: number;
  scoreReasoning: string;
  /** Other pages on this site that belong beside it. */
  relatedPaths: readonly string[];
};

export type RouteFamily =
  | "against-the-property" | "against-other-assets" | "selling-a-share"
  | "private-capital" | "structural";

export const FAMILY_LABEL: Record<RouteFamily, string> = {
  "against-the-property": "Borrowing against the property",
  "against-other-assets": "Borrowing against something else you own",
  "selling-a-share": "Selling a share rather than borrowing",
  "private-capital": "Private capital and relationships",
  structural: "Structural and entity routes",
};

export const FAMILY_ORDER: readonly RouteFamily[] = [
  "against-the-property", "against-other-assets", "selling-a-share", "private-capital", "structural",
];

/* ----------------------------------------------------------------
   THE DEPLOYMENT SIDE — putting capital OUT rather than taking it in.
------------------------------------------------------------------- */

export type DeploymentStrategy = {
  slug: string;
  n: number;
  title: string;
  description: string;
  depth: Depth;
  body: readonly string[];
  /** How the money actually gets to the borrower and back. */
  mechanics: readonly string[];
  /** The gross return the strategy targets, stated as the operators state it. */
  targetReturn: string;
  /** What the return looks like after realistic losses. This is the honest number. */
  netOfLosses: string;
  /** Typical duration of one turn of capital. Drives how often it can be recycled. */
  termMonths: { min: number; max: number };
  /** Is there collateral, and what is it worth in a default? */
  collateral: string;
  /** A personal guarantee, a confession of judgment, insurance, a reserve — or nothing. */
  secondaryGuarantees: readonly string[];
  risks: readonly RiskFactor[];
  /** 1 (speculative, illiquid, unsecured) to 10 (secured, liquid, predictable). */
  riskRewardScore: number;
  scoreReasoning: string;
  /** Accreditation, licensing or state-law constraints on doing this at all. */
  eligibility: readonly string[];
  providerIds: readonly string[];
  questions: readonly CommonQuestion[];
  relatedPaths: readonly string[];
};

/** The standing disclosure on every page in this tab. */
export const ALT_CREDIT_DISCLOSURE =
  "Russell Capital Systems receives no compensation, referral fee, commission or other consideration from any " +
  "company named anywhere in this section, and has no business relationship with any of them. Nothing here is a " +
  "recommendation, an endorsement, an offer of credit, or an offer to sell a security. Rates, terms, ratings and " +
  "contact details were read from each company's own published material on the date shown beside them and change " +
  "constantly — verify everything directly before you act on it. Several of these routes are expensive, several are " +
  "irreversible, and at least two can cost you the asset. Confirm any structure with your own attorney and CPA first.";
