// ============================================================
// THRESHOLDS — every gate a mechanism has to clear, what the standard number
// is, every legitimate way it is lower, and the ones that are not ours to move.
//
// ## Why this file exists
//
// A sequence is only as fast as its slowest gate. Six months of seasoning
// before a cash-out, a 75% LTV cap, a 1.0 coverage floor, a ten-year equity
// share settlement — these decide how many turns a household gets, and most
// of them are softer than the marketing implies. Some have a documented
// exception (the delayed-financing rule lets a cash purchase refinance at
// month zero). Some vary by lender (a 90-day seasoning program exists; a
// 30-year equity-share term exists). Some are contract terms that no amount of
// cleverness moves, and the honest thing is to say so where they sit.
//
// Each threshold below carries its standard value, its variants, and — where
// it cannot be lowered — the reason, with the statute or contract term that
// makes it so. Researched 2026-09-18 with a research assistant that returned
// source URLs; the URL is kept on every figure so a reader can check it in
// the time it takes to click.
//
// ## The one that is not a threshold
//
// The equity-share covenants (no further encumbrance; settlement on sale) are
// listed here under `fixed`, not `variants`, because they are a counterparty's
// contract. The legitimate route around them is not a loophole — it is that
// they bind PER PROPERTY. A household with thirty houses has thirty separate
// covenant states, and an agreement on one closes nothing on the other
// twenty-nine. sequencePlanner.ts models that; this file only records the
// rule.
// ============================================================

import type { MechanismId } from './cycleEngine';

export interface ThresholdVariant {
  /** Short name for the variant, e.g. "Delayed financing exception". */
  readonly name: string;
  /** The value under this variant, in the threshold's own unit. */
  readonly value: number;
  /** Who offers it or what rule provides it. Names only; no rates, no contacts. */
  readonly providedBy: string;
  /** The conditions that must hold for the variant to apply. */
  readonly conditions: readonly string[];
  /** What the variant costs or gives up, so it is never a free lunch on the page. */
  readonly tradeoff: string;
  /** Source URL the figure was read from. */
  readonly source: string;
  /** 1–10. How confident we are the variant exists as described. Statute 10, lender page 8, market report 5. */
  readonly evidence: number;
}

export interface Threshold {
  readonly id: string;
  readonly mechanism: MechanismId;
  readonly name: string;
  readonly unit: 'months' | 'percent' | 'ratio' | 'years' | 'count' | 'dollars';
  /** What most households encounter without shopping. */
  readonly standard: number;
  readonly standardSource: string;
  /** Why this number exists at all. */
  readonly why: string;
  /** Every legitimate way it is lower or better. Empty means we found none. */
  readonly variants: readonly ThresholdVariant[];
  /** Set when the threshold cannot be moved, with the reason and the authority. */
  readonly fixed?: { readonly reason: string; readonly authority: string; readonly source: string };
  /** Which engine input this threshold maps to, so a variant can change a projection. */
  readonly affects: 'turnMonths' | 'releaseRate' | 'coverage' | 'settlementYears' | 'costOfCapital' | 'eligibility' | 'exposure';
}

const FNMA_B2 = 'https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions';
const GARN = 'https://www.law.cornell.edu/uscode/text/12/1701j-3';
const CFR191 = 'https://www.law.cornell.edu/cfr/text/12/191.5';
const IRC7702A = 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section7702A&num=0&edition=prelim';

export const THRESHOLDS: readonly Threshold[] = [
  /* ═══════════════ BRRRR / DSCR ═══════════════ */
  {
    id: 'dscr-seasoning',
    mechanism: 'brrrr-dscr',
    name: 'Ownership seasoning before cash-out at appraised value',
    unit: 'months',
    standard: 6,
    standardSource: 'https://dscrauthority.com/invest/brrrr-and-dscr-strategy/',
    why: 'Lenders will not lend against a value the borrower created last month without proof it holds. Six months is the point at which most will accept an appraisal over the purchase price.',
    affects: 'turnMonths',
    variants: [
      {
        name: 'Delayed financing exception',
        value: 0,
        providedBy: 'Fannie Mae Selling Guide B2-1.3-03, through any conforming lender',
        conditions: [
          'Property purchased with no mortgage financing — cash, or a loan secured by a DIFFERENT property such as a HELOC or policy loan.',
          'Arm\'s-length purchase documented by a settlement statement.',
          'No existing liens on title.',
          'Source of the purchase cash documented.',
          'New loan disburses within six months of the purchase date.',
        ],
        tradeoff: 'The loan is capped at the documented purchase price plus eligible closing costs — NOT at 75% of the new appraised value. Renovation uplift cannot be pulled out under this rule; it recovers the cash, not the equity created.',
        source: FNMA_B2,
        evidence: 10,
      },
      {
        name: '90-day seasoning program',
        value: 3,
        providedBy: 'Reported at Kiavi and Griffin Funding on selected programs',
        conditions: ['Program-specific; product, LTV, credit and state restrictions apply.', 'Confirm in the written term sheet whether value seasoning is separate from ownership seasoning.'],
        tradeoff: 'Often paired with a lower LTV cap or a higher rate than the six-month product.',
        source: 'https://www.crowdfundedwealth.com/articles/best-dscr-loan-lender-2026',
        evidence: 5,
      },
    ],
  },
  {
    id: 'dscr-cashout-ltv',
    mechanism: 'brrrr-dscr',
    name: 'Maximum cash-out loan-to-value',
    unit: 'percent',
    standard: 75,
    standardSource: 'https://dscrauthority.com/loan-types/cash-out-refinance/',
    why: 'The lender keeps a 25% cushion against a value it did not set. This is the number that decides how much of the all-in cost comes back, and therefore whether a cycle grows or shrinks.',
    affects: 'releaseRate',
    variants: [
      {
        name: '80% cash-out on strong files',
        value: 80,
        providedBy: 'Selected programs at Kiavi, Lima One and Visio, per market comparisons',
        conditions: ['Strong credit.', 'Coverage typically 1.25 or better rather than 1.0.', 'Eligible property type; rarely available on short-term rentals.'],
        tradeoff: 'Higher rate, tighter coverage requirement, and the advertised 80% is frequently the purchase or rate-and-term figure rather than cash-out — read the term sheet.',
        source: 'https://www.selecthomeloans.com/best-dscr-lenders-in-illinois-rental-property-loans-2026-guide/',
        evidence: 5,
      },
      {
        name: '70% on higher-risk files',
        value: 70,
        providedBy: 'Common floor across DSCR lenders for weaker credit, no-ratio, or short-term rental files',
        conditions: ['Applied by the lender, not chosen by the borrower.'],
        tradeoff: 'At 70% and a 1.18 uplift, one turn returns 0.826 of all-in cost — the cycle shrinks 17% a turn instead of 11.5%.',
        source: 'https://mbanc.com/blog/dscr-cash-out-refinance/',
        evidence: 6,
      },
    ],
  },
  {
    id: 'dscr-coverage',
    mechanism: 'brrrr-dscr',
    name: 'Minimum debt service coverage ratio',
    unit: 'ratio',
    standard: 1.0,
    standardSource: 'https://dscrauthority.com/tools/cash-out-refi-calculator/',
    why: 'Rent must at least equal principal, interest, taxes, insurance and association dues at the rate on the day of closing. This is the gate a rate rise closes mid-project.',
    affects: 'coverage',
    variants: [
      {
        name: 'Sub-1.0 and no-ratio programs',
        value: 0.75,
        providedBy: 'Reported at Griffin Funding and some Angel Oak programs',
        conditions: ['Lower LTV cap, typically 65–70%.', 'Higher rate.', 'Larger reserves required.'],
        tradeoff: 'A property that does not cover its own debt is being carried by the household. This variant lowers the gate by moving the risk onto the owner rather than removing it.',
        source: 'https://dscrauthority.com/loan-types/cash-out-refinance/',
        evidence: 5,
      },
      {
        name: 'Portfolio in-place DSCR at 1.00',
        value: 1.0,
        providedBy: 'Roc Capital rental portfolio, loans up to $2M and 10 properties',
        conditions: ['Loan at or under $2M.', 'Ten or fewer properties.', 'Loans between 1.00 and 1.19 must be 30-year fully amortising.'],
        tradeoff: 'Above that size the same lender requires 1.20 on net cash flow, which is a materially harder gate.',
        source: 'https://roccapital.com/wp-content/uploads/2022/07/Roc-Capital-Rental-Portfolio-TearSheet-072222.pdf',
        evidence: 8,
      },
    ],
  },
  {
    id: 'financed-property-cap',
    mechanism: 'brrrr-dscr',
    name: 'Conventional financed-property limit per borrower',
    unit: 'count',
    standard: 10,
    standardSource: 'https://www.selltohomepros.com/blog/dscr-loans-for-real-estate-investors-2026-underwriting-guide',
    why: 'Fannie Mae caps a borrower at ten financed one-to-four unit properties. Past ten, conventional financing stops and the borrower is in DSCR, portfolio or commercial territory whether they planned to be or not.',
    affects: 'eligibility',
    variants: [
      {
        name: 'Portfolio / blanket DSCR loan',
        value: 999,
        providedBy: 'CoreVest (5+), Lima One (5+), Visio Rental360 Portfolio+ (4+), Kiavi (2+), Roc Capital',
        conditions: [
          'Minimum property count per lender, listed above.',
          'One loan secured by the whole pool; the pool is underwritten together.',
          'A partial-release clause MUST be negotiated before closing, or individual properties cannot be sold out of the blanket.',
        ],
        tradeoff: 'Cross-collateralised: a problem on one property is a problem on the loan. LTV typically 65–75% rather than 80%. Coverage often 1.20 at institutional lenders.',
        source: 'https://roccapital.com/rental-portfolios/',
        evidence: 7,
      },
      {
        name: 'Entity borrower',
        value: 999,
        providedBy: 'DSCR and portfolio lenders lending to an LLC with a personal guaranty',
        conditions: ['Lender permits entity borrowers.', 'Beneficial owners disclosed and guaranteeing.'],
        tradeoff: 'Does not hide exposure — lenders aggregate global debt across entities. It changes who signs, not how much is owed.',
        source: 'https://www.selltohomepros.com/blog/dscr-loans-for-real-estate-investors-2026-underwriting-guide',
        evidence: 6,
      },
    ],
  },
  {
    id: 'portfolio-partial-release',
    mechanism: 'brrrr-dscr',
    name: 'Partial release from a blanket loan',
    unit: 'percent',
    standard: 0,
    standardSource: 'https://roccapital.com/rental-portfolios/',
    why: 'A blanket loan does not automatically let the borrower sell one house. Without a release clause, the whole loan is due to free one property. The standard is zero because the default document has none.',
    affects: 'exposure',
    variants: [
      {
        name: 'Negotiated release schedule',
        value: 100,
        providedBy: 'Any portfolio lender, at the borrower\'s insistence before closing',
        conditions: [
          'A stated release price per property — a fixed figure, or a percentage of current principal tied to appraised value.',
          'Sale proceeds applied to principal.',
          'Whether the lender may refuse a release because portfolio coverage or LTV would deteriorate.',
          'Whether substitute collateral is permitted.',
        ],
        tradeoff: 'Release prices are usually set above pro-rata, so the first properties sold pay down more than their share. Negotiate the schedule, not the principle.',
        source: 'https://lendingstreet.io/best-blanket-portfolio-loan-lenders.html',
        evidence: 7,
      },
    ],
  },

  /* ═══════════════ SELLER WRAP ═══════════════ */
  {
    id: 'due-on-sale-exposure',
    mechanism: 'seller-wrap',
    name: 'Due-on-sale exposure on a wraparound',
    unit: 'years',
    standard: 5,
    standardSource: GARN,
    why: 'A wrap transfers the property while the seller\'s mortgage stays in place. The underlying lender has the contractual right to call the loan for as long as the wrap exists, which is typically the life of the seller note.',
    affects: 'exposure',
    fixed: {
      reason: 'No Garn-St Germain exemption covers a wraparound or an instalment land contract. The junior-lien exemption expressly excludes liens created under a contract for deed; the inter vivos trust exemption protects the transfer INTO the trust and collapses on assignment of the beneficial interest to a buyer; the three-year lease exemption requires no option to purchase. A wrap is a sale, and the statute treats it as one.',
      authority: '12 U.S.C. § 1701j-3(d); 12 CFR § 191.5(b)',
      source: CFR191,
    },
    variants: [
      {
        name: 'Refinance out within the seasoning window',
        value: 1,
        providedBy: 'The buyer, by DSCR-refinancing the property and retiring the wrap',
        conditions: ['Buyer qualifies for the refinance at the coverage available on the day.', 'Seller note permits early payoff.'],
        tradeoff: 'This does not make the wrap legal under the clause; it shortens how long the exposure exists from years to months. Exposure at one year is not exposure at zero.',
        source: GARN,
        evidence: 9,
      },
      {
        name: 'Formal assumption with lender consent',
        value: 0,
        providedBy: 'The underlying lender, on request, at its discretion',
        conditions: ['Buyer qualifies under the lender\'s assumption underwriting.', 'Lender agrees; many will, at current rates or with a fee.'],
        tradeoff: 'The spread between the old rate and the current rate — the entire economic reason for the wrap — is usually lost, because the lender reprices on assumption.',
        source: GARN,
        evidence: 8,
      },
      {
        name: 'Lease of three years or less with no option',
        value: 0,
        providedBy: 'Statutory exemption, 12 U.S.C. § 1701j-3(d)(4)',
        conditions: ['Lease term three years or less.', 'No option to purchase in the lease.', 'Residential, fewer than five units.'],
        tradeoff: 'This is a lease, not a sale. It creates a tenant, not a buyer, and produces no note to carry or sell. Listed because it is the closest exempt structure, and to make clear that adding an option removes the exemption.',
        source: GARN,
        evidence: 10,
      },
    ],
  },
  {
    id: 'note-seasoning-for-sale',
    mechanism: 'seller-wrap',
    name: 'Payment seasoning before a note is saleable at a sane discount',
    unit: 'months',
    standard: 12,
    standardSource: 'https://paperstac.com',
    why: 'A note buyer prices on payment history. Twelve documented payments is roughly where the discount stops being punitive.',
    affects: 'turnMonths',
    variants: [
      {
        name: 'Partial sale of the payment stream',
        value: 6,
        providedBy: 'Note buyers offering partials, e.g. Seascape Capital, Amerinote Xchange',
        conditions: ['Third-party servicing with documented payment history from the first payment.', 'Buyer purchases a defined number of payments rather than the whole note.'],
        tradeoff: 'The seller keeps the tail of the note and the balloon risk. Less capital now, more instrument retained.',
        source: 'https://seascapecapital.com',
        evidence: 6,
      },
    ],
  },

  /* ═══════════════ EQUITY SHARE ═══════════════ */
  {
    id: 'hei-no-further-encumbrance',
    mechanism: 'equity-share',
    name: 'Subordinate financing after the agreement',
    unit: 'count',
    standard: 0,
    standardSource: 'https://help.point.com/article/580-what-is-combined-loan-to-value-cltv-and-how-does-point-use-it',
    why: 'The provider holds a share of the home\'s value and will not have it diluted by a lien it did not price. The agreement prohibits further encumbrance without consent.',
    affects: 'eligibility',
    fixed: {
      reason: 'This is the counterparty\'s contract term. Consent is the only route, it is discretionary, and none of the five providers\' public pages state a consent process — Point\'s help centre contemplates a HELOC as a REPAYMENT source, which is the opposite of a subordinate line held alongside the agreement. Treat a line behind an equity share as unavailable unless the provider says otherwise in writing.',
      authority: 'Provider agreement; Point help centre on CLTV and end-of-term options',
      source: 'https://help.point.com/article/637-what-are-the-options-at-the-end-of-my-term',
    },
    variants: [
      {
        name: 'Open the line FIRST, then take the agreement behind it',
        value: 1,
        providedBy: 'Any provider that underwrites on combined LTV and accepts a subordinate position',
        conditions: ['Provider accepts a position behind the existing line; Point underwrites on CLTV including existing secured debt.', 'Combined LTV within the provider\'s cap, which is not published universally.'],
        tradeoff: 'The line reduces the equity available to the agreement, so the advance is smaller. This is the ordering rule in sequenceOrderings.ts, stated as a threshold.',
        source: 'https://help.point.com/article/580-what-is-combined-loan-to-value-cltv-and-how-does-point-use-it',
        evidence: 6,
      },
      {
        name: 'A different property',
        value: 999,
        providedBy: 'Arithmetic',
        conditions: ['The household owns more than one property.'],
        tradeoff: 'None. The covenant binds the encumbered property only. On a portfolio, this is the whole answer, and it is why the planner tracks covenants per asset.',
        source: CFR191,
        evidence: 10,
      },
    ],
  },
  {
    id: 'hei-term',
    mechanism: 'equity-share',
    name: 'Term before mandatory settlement',
    unit: 'years',
    standard: 10,
    standardSource: 'https://help.point.com/article/637-what-are-the-options-at-the-end-of-my-term',
    why: 'The provider wants its money back on a schedule. Ten years is the common term and the reason the mechanism is a balloon ladder.',
    affects: 'settlementYears',
    variants: [
      {
        name: '30-year term',
        value: 30,
        providedBy: 'Point, on most current agreements (some specify 10)',
        conditions: ['Agreement states the 30-year term.', 'Buy-back permitted at any time before then.'],
        tradeoff: 'A longer term is a longer share of appreciation for the provider. The balloon moves; the meter keeps running. On a share-of-total-value agreement the settlement grows every year the home does.',
        source: 'https://help.point.com/article/637-what-are-the-options-at-the-end-of-my-term',
        evidence: 8,
      },
      {
        name: 'Early buy-back',
        value: 0,
        providedBy: 'Point states the equity can be bought back at any time; others vary',
        conditions: ['Cash or a refinance sufficient to settle at the current formula.'],
        tradeoff: 'Settling early on a share-of-value agreement in a rising market is cheaper than settling late. It also means the household needed the exit capital it was trying to avoid needing.',
        source: 'https://point.com/',
        evidence: 8,
      },
    ],
  },
  {
    id: 'hei-investment-property',
    mechanism: 'equity-share',
    name: 'Investment property eligibility',
    unit: 'count',
    standard: 0,
    standardSource: 'https://help.point.com/collection/166-frequently-asked-questions-faqs',
    why: 'Providers price on owner-occupied risk. Most agreements are primary-residence products; the research could not verify a rental-eligible programme at any of the five providers from their own pages.',
    affects: 'eligibility',
    variants: [],
    fixed: {
      reason: 'Not verifiable as available. Until a provider\'s own page confirms non-owner-occupied eligibility, the planner treats an equity share on a rental as unavailable. This is the single largest reason the mechanism is one-shot on a portfolio: it reaches the primary residence and nothing else.',
      authority: 'Provider eligibility pages, read 2026-09-18',
      source: 'https://help.point.com/collection/166-frequently-asked-questions-faqs',
    },
  },

  /* ═══════════════ POLICY LOAN ═══════════════ */
  {
    id: 'policy-loan-value',
    mechanism: 'policy-loan',
    name: 'Maximum loan as a share of cash value',
    unit: 'percent',
    standard: 90,
    standardSource: 'https://www.lifecreditcompany.com/blog/whole-life-insurance-loan',
    why: 'The carrier keeps a margin so accruing loan interest does not lapse the policy in the next year. Ninety to ninety-five is the practical band; the contract\'s "available loan value" governs.',
    affects: 'releaseRate',
    variants: [
      {
        name: 'Non-direct recognition contract',
        value: 95,
        providedBy: 'Commonly reported at MassMutual and New York Life; varies by policy series',
        conditions: ['The specific policy series is non-direct recognition — confirm in writing.'],
        tradeoff: 'Not a higher loan limit as such, but the borrowed portion keeps the full dividend, which is what makes borrowing near the limit survivable. On direct recognition (Guardian, Penn Mutual, Northwestern Mutual commonly) the loaned portion is credited less.',
        source: 'https://gateway.pennmutual.com/static-assets/files/products/life/pm9192.pdf',
        evidence: 6,
      },
      {
        name: 'Preferred / wash loan after year 10',
        value: 95,
        providedBy: 'Penn Mutual preferred-loan provision, year 11 onward, in years dividends are paid',
        conditions: ['Policy in force past year ten.', 'Dividends declared that year.'],
        tradeoff: 'The adjusted dividend equals the loan rate — the spread goes to roughly zero — but interest still compounds if unpaid, and the death benefit is still reduced. A wash is not free.',
        source: 'https://gateway.pennmutual.com/static-assets/files/products/life/pm9192.pdf',
        evidence: 8,
      },
    ],
  },
  {
    id: 'seven-pay',
    mechanism: 'policy-loan',
    name: 'Seven-pay funding limit before MEC status',
    unit: 'years',
    standard: 7,
    standardSource: IRC7702A,
    why: 'Fund a policy faster than seven level premiums would have paid it up and it becomes a modified endowment contract: distributions taxed income-first, a 10% additional tax before 59½, and the loan-is-not-income treatment lost.',
    affects: 'costOfCapital',
    variants: [],
    fixed: {
      reason: 'Statutory. The limit is actuarial, not seven times the premium, and a material change restarts the test. There is no lender to shop; the number is the code.',
      authority: 'IRC § 7702A',
      source: IRC7702A,
    },
  },
  {
    id: 'policy-ramp',
    mechanism: 'policy-loan',
    name: 'Years before the pool is worth borrowing against',
    unit: 'years',
    standard: 10,
    standardSource: 'https://betterwealth.com/blogs/best-whole-life-for-cash-value',
    why: 'Early cash value sits below premium paid. The crossover is a function of design, and no design makes it year two.',
    affects: 'turnMonths',
    variants: [
      {
        name: 'Maximum-funded with paid-up additions',
        value: 5,
        providedBy: 'Any mutual carrier, when the agent designs for it',
        conditions: ['Base death benefit minimised.', 'Paid-up-additions rider carrying most of the premium.', 'Funded to just under the seven-pay limit.'],
        tradeoff: 'Smaller death benefit per premium dollar and a lower commission, which is why it has to be asked for. Cash value can approach premium paid around year five rather than year ten; it does not exceed it early.',
        source: 'https://betterwealth.com/blogs/whole-life-insurance-policy-loans',
        evidence: 6,
      },
    ],
  },

  /* ═══════════════ VELOCITY ═══════════════ */
  {
    id: 'heloc-cltv',
    mechanism: 'velocity-heloc',
    name: 'Maximum combined loan-to-value on a home equity line',
    unit: 'percent',
    standard: 80,
    standardSource: 'https://point.com/blog/requirements-for-helocs',
    why: 'The line sits behind the first mortgage and the lender caps the total. This decides how large a line the household can run the mechanism through.',
    affects: 'releaseRate',
    variants: [
      {
        name: 'First-lien HELOC replacing the mortgage',
        value: 90,
        providedBy: 'CMG All In One Loan and similar first-position lines',
        conditions: ['The line IS the mortgage; there is no first lien in front of it.', 'Qualification on income, as the line is the primary debt.'],
        tradeoff: 'The entire mortgage balance floats. Model it three points above today\'s rate before signing, because the sweep saving is small next to a rate shock on the whole balance.',
        source: 'https://www.cmgfi.com',
        evidence: 7,
      },
    ],
  },
];

export function thresholdsFor(mechanism: MechanismId): Threshold[] {
  return THRESHOLDS.filter((t) => t.mechanism === mechanism);
}

export function threshold(id: string): Threshold | undefined {
  return THRESHOLDS.find((t) => t.id === id);
}

/** Thresholds with at least one legitimate way down. */
export function movable(): Threshold[] {
  return THRESHOLDS.filter((t) => t.variants.length > 0);
}

/** Thresholds that are somebody else's contract or the statute. */
export function immovable(): Threshold[] {
  return THRESHOLDS.filter((t) => Boolean(t.fixed));
}

/** The best (lowest for months/years, highest for percent/count/ratio) legitimate value, with its variant. */
export function bestVariant(t: Threshold): { value: number; via: string } {
  if (t.variants.length === 0) return { value: t.standard, via: 'standard' };
  const lowerIsBetter = t.unit === 'months' || t.unit === 'years';
  const pick = [...t.variants].sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value))[0];
  const better = lowerIsBetter ? pick.value < t.standard : pick.value > t.standard;
  return better ? { value: pick.value, via: pick.name } : { value: t.standard, via: 'standard' };
}

export const THRESHOLD_COUNT = THRESHOLDS.length;
export const VARIANT_COUNT = THRESHOLDS.reduce((n, t) => n + t.variants.length, 0);

export const THRESHOLDS_DISCLOSURE =
  'Every figure carries the page it was read from and the date. Lender programme figures are market reports unless the source is the lender\'s own page, and they move weekly; statutory figures are the code. A variant marked evidence 5 is a report, not a promise — confirm it in a written term sheet before a plan depends on it. Nothing here lowers a counterparty\'s contract term; where a threshold is fixed, the file says so and names the authority.';

/**
 * The sources the shell prints: every page a standard, variant or fixed rule
 * above was read from, researched 2026-09-18. Built from THRESHOLDS so a new
 * threshold is printed without a second edit. The evidence score (statute 10,
 * lender page 8, market report 5) travels in the note.
 */
export const THRESHOLDS_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = (() => {
  const asOf = 'researched 2026-09-18';
  const out: { label: string; url?: string; asOf?: string; note?: string }[] = [];
  for (const t of THRESHOLDS) {
    out.push({ label: `${t.name}: standard ${t.standard} ${t.unit}`, url: t.standardSource, asOf });
    for (const v of t.variants) {
      out.push({ label: `${t.name}, ${v.name}: ${v.value} ${t.unit} (${v.providedBy})`, url: v.source, asOf, note: `evidence ${v.evidence} of 10` });
    }
    if (t.fixed) out.push({ label: `${t.name}, cannot be moved: ${t.fixed.authority}`, url: t.fixed.source, asOf, note: t.fixed.reason });
  }
  return out;
})();
