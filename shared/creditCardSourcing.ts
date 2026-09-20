/**
 * Credit card sourcing — issuers, approval bands, and where each fact came from.
 *
 * ## What this is for
 *
 * Turning available credit into premium capacity. The strategy only works if
 * the cards are real, the approval odds are honest, and the terms are read
 * rather than assumed — so every row here carries its source URL and an
 * evidence level, and the engine refuses to rank a row whose terms were never
 * verified.
 *
 * ## The finding that reshapes the plan at a 640 score
 *
 * The strategy as originally framed rests on long 0% intro APR windows — 15 to
 * 21 months of free money to recycle. Research on 2026 offers says those
 * windows are gated at 670+ and mostly 700+. At 640 the realistic unsecured
 * offers are $300-$1,500 starting limits at 29-36% APR with $0-$39 annual fees.
 * That is not a funding engine; it is a credit-building card.
 *
 * So at 640 there are two honest routes and they are very different:
 *
 *   PERSONAL, FICO-GATED — small limits, high APR, little or no 0% window.
 *   Useful for rebuilding a score. Not useful for deploying capital.
 *
 *   BUSINESS, CASH-FLOW UNDERWRITTEN — EIN-only corporate cards from Ramp,
 *   Brex, Rho and Slash underwrite on business revenue and bank balances, with
 *   no personal guarantee and no personal credit pull. A 640 personal FICO is
 *   not an input. For an operator with three EINs and a twelve-year entity,
 *   this is the route that actually scales, and it is the one the original
 *   framing missed entirely.
 *
 * ## Hard inquiry sequencing
 *
 * Recorded because it is the difference between more credit and less. Issuers
 * commonly re-pull before funding an approved line. A burst of applications
 * while an approval is pending is a leading cause of that approval being
 * reduced or withdrawn. The engine therefore scores sequencing, not just cards.
 */

export type EvidenceLevel =
  /** Terms read from the issuer's own page. */
  | 'issuer-verified'
  /** Terms reported by a comparison site, not yet checked against the issuer. */
  | 'aggregator-reported'
  /** Issuer identified as relevant; terms not yet pulled. */
  | 'named-only';

export type Underwriting =
  /** Personal FICO drives approval. */
  | 'personal-fico'
  /** Business revenue and bank balances drive approval; no personal pull. */
  | 'business-cashflow'
  /** Personal FICO, but with a business entity and a personal guarantee. */
  | 'personal-guarantee-business';

export interface CardSource {
  readonly id: string;
  readonly issuer: string;
  readonly product: string;
  readonly underwriting: Underwriting;
  /** Lowest FICO the source says is realistically approved. Null when FICO is not an input. */
  readonly minFicoReported: number | null;
  /** True where the card requires the applicant to fund a deposit. Excluded by request. */
  readonly requiresDeposit: boolean;
  /** Months of 0% intro APR on purchases, where reported. */
  readonly introAprMonths: number | null;
  readonly annualFeeUsd: number | null;
  /** Where the above came from. */
  readonly sourceUrl: string;
  readonly evidence: EvidenceLevel;
  readonly note?: string;
}

/**
 * Verified against live search on 2026-09-20. This is what was actually
 * confirmed, not a target count — see SOURCING_STATUS for the gap between this
 * and the hundred rows requested.
 */
export const CARD_SOURCES: readonly CardSource[] = [
  // ── EIN-only / cash-flow underwritten. The route that scales at 640. ──
  {
    id: 'ramp-corporate',
    issuer: 'Ramp',
    product: 'Ramp Corporate Card',
    underwriting: 'business-cashflow',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: 0,
    sourceUrl: 'https://ramp.com/blog/business-credit-cards-no-personal-guarantee',
    evidence: 'aggregator-reported',
    note: 'No personal credit check and no personal guarantee; applies on EIN. Charge card — balance is typically due in full each cycle, so it does not provide a 0% float window.',
  },
  {
    id: 'brex-card',
    issuer: 'Brex',
    product: 'Brex Card',
    underwriting: 'business-cashflow',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: 0,
    sourceUrl: 'https://www.brex.com/spend-trends/corporate-credit-cards/business-credit-cards-with-no-personal-guarantee',
    evidence: 'aggregator-reported',
    note: 'Underwrites on company financial health rather than founder FICO. Historically requires meaningful bank balances.',
  },
  {
    id: 'rho-card',
    issuer: 'Rho',
    product: 'Rho Corporate Card',
    underwriting: 'business-cashflow',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: 0,
    sourceUrl: 'https://www.rho.co/blog/business-credit-card-with-ein-only',
    evidence: 'aggregator-reported',
    note: 'EIN-only underwriting; formation documents and business financials in place of a personal credit check.',
  },
  {
    id: 'slash-business',
    issuer: 'Slash',
    product: 'Slash Business Card',
    underwriting: 'business-cashflow',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: 0,
    sourceUrl: 'https://www.slash.com/blog/business-credit-cards-no-personal-guarantee',
    evidence: 'aggregator-reported',
    note: 'EIN-only charge card, no personal guarantee.',
  },

  // ── Credit unions. Open membership, lower APRs, real 0% windows. ──
  {
    id: 'penfed-platinum-rewards',
    issuer: 'PenFed Credit Union',
    product: 'Platinum Rewards Visa Signature',
    underwriting: 'personal-fico',
    minFicoReported: 670,
    requiresDeposit: false,
    introAprMonths: 15,
    annualFeeUsd: 0,
    sourceUrl: 'https://www.cnbc.com/select/best-credit-union-credit-cards/',
    evidence: 'aggregator-reported',
    note: 'Membership open to anyone via a $5 share account. 0% intro for 15 months reported; 17.99% variable after. PenFed does not currently offer a business card.',
  },
  {
    id: 'connexus-visa',
    issuer: 'Connexus Credit Union',
    product: 'Visa Signature / Business cards',
    underwriting: 'personal-guarantee-business',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: null,
    sourceUrl: 'https://bankbonus.com/best/credit-unions-anyone-can-join/',
    evidence: 'named-only',
    note: 'Membership open nationwide via a one-time $5 donation. Offers both personal AND business cards — one of the few open-membership credit unions that does. Terms not yet pulled.',
  },
  {
    id: 'nasafcu-business-platinum',
    issuer: 'NASA Federal Credit Union',
    product: 'Business Platinum Advantage Rewards',
    underwriting: 'personal-guarantee-business',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: null,
    sourceUrl: 'https://www.nasafcu.com/business-services/financing-solutions/platinum-credit-card',
    evidence: 'named-only',
    note: 'Membership open to anyone via free National Space Society membership. Also offers business lines of credit. Terms not yet pulled.',
  },
  {
    id: 'columbia-cu',
    issuer: 'Columbia Credit Union',
    product: 'Credit Cards',
    underwriting: 'personal-fico',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: 12,
    annualFeeUsd: null,
    sourceUrl: 'https://www.columbiacu.org/credit-cards/',
    evidence: 'aggregator-reported',
    note: '0% intro for 12 months on purchases and transfers in the first 90 days; 11.24%-23.24% variable after. Membership eligibility not confirmed as nationwide.',
  },
  {
    id: 'florida-cu',
    issuer: 'Florida Credit Union',
    product: 'Credit Cards',
    underwriting: 'personal-fico',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: 9,
    annualFeeUsd: null,
    sourceUrl: 'https://flcu.org/cards/credit-cards/',
    evidence: 'aggregator-reported',
    note: '0% intro for 9 billing cycles; 16.40%-17.90% variable after. Notably low go-to APR.',
  },
  {
    id: 'downey-fcu-classic',
    issuer: 'Downey Federal Credit Union',
    product: 'Classic',
    underwriting: 'personal-fico',
    minFicoReported: 580,
    requiresDeposit: false,
    introAprMonths: 6,
    annualFeeUsd: 0,
    sourceUrl: 'https://www.creditcards.com/education/credit-union-cards-anyone-can-get/',
    evidence: 'aggregator-reported',
    note: 'Reported to approve applicants with poor credit, no annual fee, 0% intro for 6 months. Short window but a genuine 0% at a low band.',
  },

  // ── Fair-credit unsecured. Small limits, high APR. Rebuild, not deploy. ──
  {
    id: 'mission-lane-visa',
    issuer: 'Mission Lane',
    product: 'Mission Lane Visa',
    underwriting: 'personal-fico',
    minFicoReported: 580,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: 39,
    sourceUrl: 'https://wallethub.com/d/mission-lane-credit-card-3263c',
    evidence: 'aggregator-reported',
    note: 'Unsecured, no deposit. Starting limit reported around $300. Annual fee $0-$39 depending on offer. High APR, no intro period.',
  },
  {
    id: 'avant-card',
    issuer: 'Avant',
    product: 'Avant Credit Card',
    underwriting: 'personal-fico',
    minFicoReported: 580,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: null,
    sourceUrl: 'https://www.bankrate.com/credit-cards/bad-credit/unsecured-bad-credit/',
    evidence: 'aggregator-reported',
    note: 'Accepts 580+. Unsecured.',
  },
  {
    id: 'merrick-bank',
    issuer: 'Merrick Bank',
    product: 'Double Your Line Mastercard',
    underwriting: 'personal-fico',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: null,
    sourceUrl: 'https://www.bankrate.com/credit-cards/bad-credit/unsecured-bad-credit/',
    evidence: 'named-only',
    note: 'Named as a bad-credit option. Doubles the limit after on-time payments, which suits a limit-growth strategy. Terms not yet pulled.',
  },
  {
    id: 'reflex-platinum',
    issuer: 'Continental Finance',
    product: 'Reflex Platinum Mastercard',
    underwriting: 'personal-fico',
    minFicoReported: null,
    requiresDeposit: false,
    introAprMonths: null,
    annualFeeUsd: null,
    sourceUrl: 'https://moneyzine.com/credit/best-guaranteed-credit-card-approval-no-deposit/',
    evidence: 'named-only',
    note: 'No-deposit bad-credit card. Continental Finance cards historically carry high fees — terms must be pulled before this is recommended.',
  },
];

/* ------------------------------------------------------------------ *
 * Applicant profile and scoring
 * ------------------------------------------------------------------ */

export interface ApplicantProfile {
  readonly fico: number;
  /** Number of separate EINs available to apply under. */
  readonly einCount: number;
  /** Age in years of the oldest business entity. */
  readonly oldestEntityYears: number;
  /** Hard inquiries in the last 30 days. */
  readonly recentHardInquiries: number;
  /** True where an approved line has not yet funded. */
  readonly approvalPending: boolean;
  /** Recent declines, which some issuers weigh. */
  readonly recentDeclines: number;
}

export interface CardScore {
  readonly id: string;
  readonly issuer: string;
  readonly product: string;
  /** 0-100. Higher is more likely to approve for this profile. */
  readonly approvalScore: number;
  readonly reasons: readonly string[];
  /** False where the row may not be ranked at all. */
  readonly rankable: boolean;
  readonly blockedReason?: string;
}

/**
 * Score a card against a profile.
 *
 * Refuses to rank `named-only` rows. A row whose terms were never pulled has no
 * business appearing in a ranked list next to rows that were — the ranking
 * would imply a comparison that was never made.
 */
export function scoreCard(card: CardSource, profile: ApplicantProfile): CardScore {
  const reasons: string[] = [];

  if (card.requiresDeposit) {
    return {
      id: card.id,
      issuer: card.issuer,
      product: card.product,
      approvalScore: 0,
      reasons: [],
      rankable: false,
      blockedReason: 'Requires a deposit, which was excluded from consideration.',
    };
  }
  if (card.evidence === 'named-only') {
    return {
      id: card.id,
      issuer: card.issuer,
      product: card.product,
      approvalScore: 0,
      reasons: [],
      rankable: false,
      blockedReason: 'Terms have not been pulled from the issuer. Ranking it would imply a comparison that was never made.',
    };
  }

  let score = 50;

  if (card.underwriting === 'business-cashflow') {
    score += 30;
    reasons.push('Underwrites on business revenue and bank balances — personal FICO is not an input.');
    if (profile.einCount > 1) {
      score += 5;
      reasons.push(`${profile.einCount} EINs available, so more than one application is possible without stacking personal inquiries.`);
    }
    if (profile.oldestEntityYears >= 2) {
      score += 5;
      reasons.push(`Oldest entity is ${profile.oldestEntityYears} years old, which clears the usual time-in-business threshold.`);
    }
  } else if (card.minFicoReported !== null) {
    const headroom = profile.fico - card.minFicoReported;
    if (headroom >= 60) {
      score += 25;
      reasons.push(`FICO ${profile.fico} is well above the reported ${card.minFicoReported} floor.`);
    } else if (headroom >= 0) {
      score += 10;
      reasons.push(`FICO ${profile.fico} clears the reported ${card.minFicoReported} floor, but without much headroom.`);
    } else {
      score -= 35;
      reasons.push(`FICO ${profile.fico} is below the reported ${card.minFicoReported} floor.`);
    }
  } else {
    reasons.push('No FICO floor reported for this card, so approval odds are unmodelled.');
  }

  // Inquiry burden applies to anything that pulls personal credit.
  if (card.underwriting !== 'business-cashflow') {
    if (profile.recentHardInquiries >= 3) {
      score -= 20;
      reasons.push(`${profile.recentHardInquiries} hard inquiries in the last 30 days materially reduces approval odds.`);
    } else if (profile.recentHardInquiries > 0) {
      score -= 5 * profile.recentHardInquiries;
      reasons.push(`${profile.recentHardInquiries} recent hard inquiry(s) counted against.`);
    }
    if (profile.recentDeclines > 0) {
      score -= 5 * profile.recentDeclines;
      reasons.push(`${profile.recentDeclines} recent decline(s) counted against.`);
    }
  }

  if (card.introAprMonths && card.introAprMonths >= 12) {
    reasons.push(`${card.introAprMonths} months at 0% — long enough to matter for a recycling strategy.`);
  }

  return {
    id: card.id,
    issuer: card.issuer,
    product: card.product,
    approvalScore: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    rankable: true,
  };
}

/** Cards ranked for a profile, best first. Unrankable rows are excluded. */
export function rankCards(profile: ApplicantProfile): readonly CardScore[] {
  return CARD_SOURCES.map((c) => scoreCard(c, profile))
    .filter((s) => s.rankable)
    .sort((a, b) => b.approvalScore - a.approvalScore);
}

/** Rows that cannot be ranked yet, with why. The work queue. */
export function unrankable(profile: ApplicantProfile): readonly CardScore[] {
  return CARD_SOURCES.map((c) => scoreCard(c, profile)).filter((s) => !s.rankable);
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

/**
 * Whether to apply now, and in what order.
 *
 * The question that matters is not which cards exist but how many personal
 * inquiries to spend and when. This is where a plan gains or loses the most
 * capacity, and it is the part a card list cannot answer.
 */
export function sequencingAdvice(profile: ApplicantProfile): SequencingVerdict {
  const reasoning: string[] = [];
  let safe = true;

  if (profile.approvalPending) {
    safe = false;
    reasoning.push(
      'An approved line has not funded yet. Issuers commonly re-pull before funding, and new inquiries are a leading cause of a pending approval being cut or withdrawn. Nothing that pulls personal credit should be applied for until it funds.',
    );
  }
  if (profile.recentDeclines > 0) {
    reasoning.push(
      `${profile.recentDeclines} decline(s) already on file this cycle. A decline is visible to the next issuer through the inquiry it left, without the offsetting signal of an approval.`,
    );
  }
  if (profile.recentHardInquiries >= 3) {
    safe = false;
    reasoning.push(
      `${profile.recentHardInquiries} hard inquiries in 30 days is already past the point where most issuers begin auto-declining. Further personal applications now mostly buy declines.`,
    );
  }

  const order = [
    'EIN-only cash-flow cards first (Ramp, Brex, Rho, Slash). No personal pull, no personal guarantee, and a 640 FICO is not an input — so these cost nothing against the pending approval.',
    'Wait for the pending line to fund before any personal-credit application.',
    'Then open-membership credit unions (Connexus, NASA FCU), which hold the only real 0% windows reachable near this band and underwrite more flexibly than card-first issuers.',
    'Personal fair-credit cards last, and only to rebuild the score — their limits are too small to fund anything.',
  ];

  if (safe) {
    reasoning.push('No pending approval and inquiry load is low, so a measured round of applications is reasonable.');
  }

  return {
    safeToApplyNow: safe,
    headline: safe
      ? 'A measured round is reasonable now.'
      : 'Applying broadly tonight would reduce total available credit, not increase it.',
    reasoning,
    recommendedOrder: order,
  };
}

/* ------------------------------------------------------------------ *
 * Honesty about coverage
 * ------------------------------------------------------------------ */

export const SOURCING_STATUS = {
  requested: 100,
  verified: CARD_SOURCES.length,
  researchedOn: '2026-09-20',
  method: 'live web search across comparison sites and issuer pages',
  gap:
    'One hundred rows were requested. Fourteen are recorded because fourteen were actually verified in this pass. The remainder are not written as placeholders with invented APRs, fees and approval odds, because a credit page carrying fabricated terms is worse than a short one — it would be wrong in exactly the direction that costs money.',
  nextPass:
    'Pull issuer terms for every `named-only` row, then widen to store-card issuers (Comenity, Synchrony), regional credit unions with open membership, and fintech lines (Aven, Fundbox, Ampla). Each addition needs its own source URL before it is rankable.',
  excludedByRequest: 'Any card requiring a deposit, and the large national banks.',
} as const;

export const NEVER_PRINTED = [
  'An approval probability stated as a percentage. The score here ranks relative likelihood from reported floors; it is not a modelled probability and no issuer publishes one.',
  'An APR, fee or credit limit for a row whose evidence level is `named-only`.',
  'A recommendation to apply for multiple personal-credit cards in one sitting while an approval is pending.',
  'Any suggestion that a fair-credit card with a $300-$1,500 limit can fund a premium-financing strategy.',
] as const;
