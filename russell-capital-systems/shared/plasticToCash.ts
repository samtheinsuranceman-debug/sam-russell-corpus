// ============================================================
// PLASTIC TO CASH — converting unusable spending power into deployable cash.
//
// THE IDEA. A credit line is purchasing power you cannot invest with. You
// cannot buy an index fund, a property down payment, or a business stake with
// a credit card, and you cannot gift cash with one. But a life carrier that
// accepts cards for premium turns that line into policy cash value — and
// policy cash value IS deployable. That is the conversion this page models:
// spending power in, deployable cash out, inside a 0% intro APR window.
//
// SOURCING RULE, inherited from shared/mutualIulCarriers.ts and
// shared/liquidityRoutes.ts: every figure carries the page it was read from
// and the date it was read. Anything that could not be read is marked
// `verified: false` and renders as unverified rather than being filled in
// with a plausible number. Card terms move constantly; `asOf` is when the
// description was read and anything past it must be re-checked.
//
// WEAKNESSES ARE A REQUIRED FIELD. A route with no stated weakness has not
// been thought about. This strategy has real ones and they are listed before
// any upside is claimed.
//
// WHAT THIS IS NOT. Not a recommendation, not a solicitation, not tax or
// legal advice, and not an illustration. Illustrations come from the carrier.
// ============================================================

// ─── Sourcing primitives (same shape as shared/mutualIulCarriers.ts) ────────

export type Verified<T> = { value: T; verified: boolean; source: string; asOf: string; note?: string };

export const v = <T,>(value: T, source: string, asOf: string, note?: string): Verified<T> =>
  ({ value, verified: true, source, asOf, note });

export const unverified = <T,>(value: T, note: string, source = ""): Verified<T> =>
  ({ value, verified: false, source, asOf: "", note });

const D = "2026-09-20";

// ─── How a card issuer classifies an insurance premium ─────────────────────
//
// This is the question the whole strategy turns on, so it gets its own type
// rather than a boolean. A premium charged as a CASH ADVANCE carries a ~5%
// fee, a ~29% APR, and NO grace period — interest accrues from day one, which
// destroys the 0% window the strategy depends on.
//
// The honest finding, after reading the actual cardholder agreements:
// NO issuer lists insurance premiums as a cash equivalent, and NO issuer
// promises they are purchases either. Every cash-equivalent list is built
// around instruments that convert directly to cash — currency, money orders,
// wire transfers, traveler's cheques, crypto, casino chips, lottery tickets.
// Insurance appears on none of them. But Chase, Citi and Capital One all
// reserve open-ended discretion, so "not listed" is not "guaranteed."

export type PremiumCoding =
  | "purchase-by-mcc"        // Nothing in the agreement excludes it; MCC 6300 routes it as a purchase.
  | "issuer-discretion"      // Agreement reserves discretion with no enumerated list.
  | "aggregator-risk"        // Agreement names third-party bill-pay as cash-like.
  | "listed-as-cash";        // Agreement names insurance premiums as a cash equivalent. (Found on zero issuers.)

export type CardIssuerGate = {
  /** The issuer's application-velocity rule. */
  rule: string;
  /** True only where the issuer publishes it. Chase 5/24, BofA 2/3/4, CapOne 1/6 and Citi 8/65 are NOT published. */
  published: boolean;
  source: string;
};

export type ZeroAprCard = {
  id: string;
  issuer: string;
  card: string;
  /** 0% intro window on PURCHASES. This is the one that matters — a premium is a purchase, not a transfer. */
  introPurchase: Verified<number | null>;
  /** "months" or "billing_cycles" — not interchangeable; billing cycles start at account opening. */
  introUnit: "months" | "billing_cycles";
  introBalanceTransfer: Verified<number | null>;
  goToAprMin: Verified<number | null>;
  goToAprMax: Verified<number | null>;
  annualFee: Verified<number | null>;
  cashAdvanceFeePct: Verified<number | null>;
  cashAdvanceAprMax: Verified<number | null>;
  /** How this issuer's agreement handles a premium charge. */
  premiumCoding: PremiumCoding;
  /** Verbatim or near-verbatim from the cardholder agreement. */
  cashEquivalentLanguage: Verified<string>;
  /** Same-day, soft-pull credit line increases — confirmed only where the issuer says so. */
  sameDayCli: Verified<boolean | null>;
  creditGuidance: Verified<string | null>;
  applyUrl: string;
  termsUrl: string;
  /** Always populated. */
  weaknesses: readonly string[];
};

// ─── The card registry ─────────────────────────────────────────────────────
//
// Ordered by 0% purchase window, longest first. Three of these correct a
// premise that was given to me and turned out to be wrong; those corrections
// are in the `weaknesses` of the card concerned.

export const ZERO_APR_CARDS: ZeroAprCard[] = [
  {
    id: "bankamericard",
    issuer: "Bank of America",
    card: "BankAmericard®",
    introPurchase: v(21, "https://promo.bankofamerica.com/bankamericard/", D),
    introUnit: "billing_cycles",
    introBalanceTransfer: v(21, "https://promo.bankofamerica.com/bankamericard/", D, "Transfers must be made within 60 days of opening."),
    goToAprMin: v(14.99, "https://promo.bankofamerica.com/bankamericard/", D),
    goToAprMax: v(25.99, "https://promo.bankofamerica.com/bankamericard/", D),
    annualFee: v(0, "https://promo.bankofamerica.com/bankamericard/", D),
    cashAdvanceFeePct: unverified(5, "Read from BofA's shared consumer agreement template, not the BankAmericard-specific PDF, which returned HTTP 304.", "https://www.bankofamerica.com/content/documents/creditcard/bank_of_america_unlimited_cash_rewards_english.pdf"),
    cashAdvanceAprMax: unverified(29.24, "Template-derived, as above."),
    premiumCoding: "purchase-by-mcc",
    cashEquivalentLanguage: v("Cash Equivalents: foreign currency, money orders, travelers checks, wire transfers, or to obtain cash, each from a non-financial institution, or person-to-person money transfers, bets, lottery tickets purchased outside the United States, casino gaming chips, cryptocurrency. A Purchase is defined residually: any transaction that is not otherwise a Cash Advance.", "https://www.bankofamerica.com/content/documents/creditcard/bank_of_america_unlimited_cash_rewards_english.pdf", D, "Insurance premiums are not named in either direction. The residual Purchase definition is the most favourable wording of any issuer here."),
    sameDayCli: unverified(null, "Not published."),
    creditGuidance: v("Good / Excellent (roughly 670-850)", "https://www.fool.com/money/credit-cards/bank-of-america/bankamericard-credit-card-review", D),
    applyUrl: "https://promo.bankofamerica.com/bankamericard/",
    termsUrl: "https://promo.bankofamerica.com/bankamericard/",
    weaknesses: [
      "Balance transfer fee is a flat 5% with no intro discount — the worst in this set. Irrelevant if you only charge premium, but it rules the card out for consolidating an existing balance.",
      "Cash advance fee and APR are template-derived, not read from this card's own agreement.",
      "21 BILLING CYCLES, not 21 months. The first cycle may be short, so the window can end sooner than a calendar reading suggests.",
    ],
  },
  {
    id: "usbank-shield",
    issuer: "U.S. Bank",
    card: "U.S. Bank Shield™ Visa®",
    introPurchase: v(21, "https://www.usbank.com/credit-cards/shield-visa-credit-card.html", D),
    introUnit: "billing_cycles",
    introBalanceTransfer: v(21, "https://www.usbank.com/credit-cards/shield-visa-credit-card.html", D, "Transfers within 60 days of opening."),
    goToAprMin: v(16.99, "https://www.usbank.com/credit-cards/shield-visa-credit-card.html", D),
    goToAprMax: v(27.99, "https://www.usbank.com/credit-cards/shield-visa-credit-card.html", D),
    annualFee: v(0, "https://www.usbank.com/credit-cards/shield-visa-credit-card.html", D),
    cashAdvanceFeePct: unverified(null, "Cash advance terms sit behind the application flow, which returned a browser-gate page."),
    cashAdvanceAprMax: unverified(null, "As above."),
    premiumCoding: "purchase-by-mcc",
    cashEquivalentLanguage: v("Advances (including ATM withdrawals, wire transfers, traveler's checks, money orders, foreign cash transactions, betting transactions, and lottery tickets).", "https://www.usbank.com/credit-cards/visa-platinum-credit-card.html", D, "Insurance premiums not named. The intro APR expressly does not apply to cash advances."),
    sameDayCli: unverified(null, "Not published."),
    creditGuidance: v("\"In general, our credit card products are for customers with a credit score in the good to excellent range.\"", "https://www.usbank.com/credit-cards/shield-visa-credit-card.html", D),
    applyUrl: "https://www.usbank.com/credit-cards/shield-visa-credit-card.html",
    termsUrl: "https://www.usbank.com/credit-cards/shield-visa-credit-card.html",
    weaknesses: [
      "CORRECTION TO A COMMON LIST: the U.S. Bank Visa® Platinum no longer exists as a marketed product. That URL now serves the Shield Visa. Any list still naming Visa Platinum is stale.",
      "Cash advance fee and APR could not be read at all — the terms are behind an application gate.",
      "Sources conflict on the balance transfer fee: U.S. Bank's own footnote says a flat 5%, CNBC reports 3% intro for four months. Issuer footnote used here.",
    ],
  },
  {
    id: "wf-reflect",
    issuer: "Wells Fargo",
    card: "Wells Fargo Reflect®",
    introPurchase: v(21, "https://creditcards.wellsfargo.com/reflect-visa-credit-card/", D),
    introUnit: "months",
    introBalanceTransfer: v(21, "https://creditcards.wellsfargo.com/reflect-visa-credit-card/", D, "Transfer request must be made within 120 days."),
    goToAprMin: v(17.49, "https://creditcards.wellsfargo.com/reflect-visa-credit-card/", D, "Three fixed tiers — 17.49%, 23.99%, 28.24% — not a continuous range."),
    goToAprMax: v(28.24, "https://creditcards.wellsfargo.com/reflect-visa-credit-card/", D),
    annualFee: v(0, "https://creditcards.wellsfargo.com/reflect-visa-credit-card/", D),
    cashAdvanceFeePct: v(5, "https://www.wellsfargo.com/credit-cards/active-cash/terms/", D, "$10 minimum. Read from the Active Cash terms; Wells Fargo uses one consumer schedule."),
    cashAdvanceAprMax: v(29.99, "https://www.wellsfargo.com/credit-cards/active-cash/terms/", D),
    premiumCoding: "purchase-by-mcc",
    cashEquivalentLanguage: v("Wells Fargo's published list (cash advances, money orders, pre-paid gift cards, traveler's checks, wire transfers, peer-to-peer payments, overdraft advances, digital currencies, gambling transactions) is a REWARDS-ELIGIBILITY exclusion list, not a cash-advance coding list.", "https://www.wellsfargo.com/credit-cards/active-cash/terms/", D, "Do not read it as a cash-equivalent definition. Insurance premiums are not on it either way."),
    sameDayCli: unverified(null, "Not published."),
    creditGuidance: unverified(null, "Not published."),
    applyUrl: "https://creditcards.wellsfargo.com/reflect-visa-credit-card/",
    termsUrl: "https://www.wellsfargo.com/credit-cards/reflect-visa/terms/",
    weaknesses: [
      "Wells Fargo publishes a 6-month gate between ANY two of its consumer cards, so you get Reflect or Active Cash, not both.",
      "Wells Fargo also publishes a 48-month rule: you may not qualify for intro APRs or bonuses if you have held, or have opened, that product in the last 48 months — even if the account is closed with a $0 balance.",
      "Balance transfer fee is a flat 5% with a $5 minimum.",
    ],
  },
  {
    id: "chase-slate",
    issuer: "JPMorgan Chase",
    card: "Chase Slate®",
    introPurchase: v(21, "https://creditcards.chase.com/balance-transfer-credit-cards/slate", D),
    introUnit: "months",
    introBalanceTransfer: v(21, "https://creditcards.chase.com/balance-transfer-credit-cards/slate", D),
    goToAprMin: v(18.24, "https://creditcards.chase.com/balance-transfer-credit-cards/slate", D),
    goToAprMax: v(28.24, "https://creditcards.chase.com/balance-transfer-credit-cards/slate", D),
    annualFee: v(0, "https://creditcards.chase.com/balance-transfer-credit-cards/slate", D),
    cashAdvanceFeePct: v(5, "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html", D, "$10 minimum."),
    cashAdvanceAprMax: v(29.99, "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html", D),
    premiumCoding: "aggregator-risk",
    cashEquivalentLanguage: v("Cash-like transactions will be treated as cash advances. Cash-like transactions include, but are not limited to ... making a payment using a third party service including bill payment transactions not made directly with the merchant or their service provider.", "https://www.chase.com/content/feed/public/creditcards/cma/Chase/COL00091.pdf", D, "CRITICAL: insurance premiums are not named, but a premium paid through a third-party bill-pay aggregator rather than the carrier itself falls inside this wording. Pay the carrier directly."),
    sameDayCli: v(false, "https://www.chase.com/personal/credit-cards/education/basics/credit-limit-increase-faq", D, "Chase states a customer-initiated increase is likely to trigger a hard inquiry."),
    creditGuidance: unverified(null, "Not published."),
    applyUrl: "https://creditcards.chase.com/balance-transfer-credit-cards/slate",
    termsUrl: "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html",
    weaknesses: [
      "HIGHEST CODING RISK IN THIS SET. Chase's agreement expressly names third-party bill-payment as cash-like. If the carrier's payment page routes through an aggregator rather than the carrier's own processor, the charge can post as a cash advance — 5% fee, ~29% APR, no grace period.",
      "Chase's unpublished 5/24 rule is the only gate driven by OTHER issuers' accounts. Apply to Chase first or not at all.",
      "Customer-requested credit line increases likely draw a hard pull.",
    ],
  },
  {
    id: "citi-diamond",
    issuer: "Citibank",
    card: "Citi® Diamond Preferred®",
    introPurchase: v(12, "https://wallethub.com/edu/cc/citi-diamond-preferred-review/25934", D, "Citi's own page renders all numerals client-side and returned empty placeholders."),
    introUnit: "months",
    introBalanceTransfer: v(21, "https://wallethub.com/edu/cc/citi-diamond-preferred-review/25934", D),
    goToAprMin: v(16.49, "https://wallethub.com/edu/cc/citi-diamond-preferred-review/25934", D),
    goToAprMax: v(27.24, "https://wallethub.com/edu/cc/citi-diamond-preferred-review/25934", D),
    annualFee: v(0, "https://wallethub.com/edu/cc/citi-diamond-preferred-review/25934", D),
    cashAdvanceFeePct: v(5, "https://www.citi.com/CRD/PDF/CMA/cardAgreement/CMA_DoubleCashADA-3.pdf", D, "$10 minimum — Citi standard."),
    cashAdvanceAprMax: unverified(null, "Not readable for this specific card."),
    premiumCoding: "issuer-discretion",
    cashEquivalentLanguage: v("Cash Advance - Use of your Card to get cash, including foreign currency, or for what WE CONSIDER a cash-like transaction.", "https://www.citi.com/CRD/PDF/CMA/cardAgreement/CMA_DoubleCashADA-3.pdf", D, "Citi publishes NO enumerated list. Classification is expressly discretionary. This is the weakest contractual protection of any issuer here."),
    sameDayCli: unverified(null, "Not published."),
    creditGuidance: v("Good", "https://wallethub.com/edu/cc/citi-diamond-preferred-review/25934", D),
    applyUrl: "https://www.citi.com/credit-cards/citi-diamond-preferred-credit-card",
    termsUrl: "https://www.citi.com/credit-cards/citi-diamond-preferred-credit-card",
    weaknesses: [
      "The headline 21 months is the BALANCE TRANSFER window. The purchase window — the one a premium charge uses — is only 12 months.",
      "Citi's agreement has no enumerated cash-equivalent list at all, only 'what we consider a cash-like transaction.' Weakest protection in the set.",
      "Citi's own product page could not be read; figures come from a third party.",
    ],
  },
  {
    id: "chase-freedom-unlimited",
    issuer: "JPMorgan Chase",
    card: "Chase Freedom Unlimited®",
    introPurchase: v(15, "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html", D),
    introUnit: "months",
    introBalanceTransfer: v(15, "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html", D),
    goToAprMin: v(18.24, "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html", D),
    goToAprMax: v(27.74, "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html", D),
    annualFee: v(0, "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html", D),
    cashAdvanceFeePct: v(5, "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html", D, "$10 minimum."),
    cashAdvanceAprMax: v(28.49, "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html", D),
    premiumCoding: "aggregator-risk",
    cashEquivalentLanguage: v("Same Chase cardmember agreement as Slate — third-party bill-payment is named as cash-like.", "https://www.chase.com/content/feed/public/creditcards/cma/Chase/COL00091.pdf", D),
    sameDayCli: v(false, "https://www.chase.com/personal/credit-cards/education/basics/credit-limit-increase-faq", D),
    creditGuidance: unverified(null, "Not published."),
    applyUrl: "https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited",
    termsUrl: "https://sites.chase.com/services/creatives/pricingandterms.html/content/dam/pricingandterms/LGC61498.html",
    weaknesses: [
      "Same aggregator coding risk as Slate.",
      "15 months is 6 fewer than Slate. If you are only taking one Chase card, Slate is the better vehicle for this strategy.",
      "Burns a Chase 5/24 slot for a shorter window.",
    ],
  },
  {
    id: "capitalone-quicksilver",
    issuer: "Capital One",
    card: "Quicksilver",
    introPurchase: v(15, "https://www.capitalone.com/credit-cards/compare/results/?brandCodes=SAVOR.QUICKSILVER", D),
    introUnit: "months",
    introBalanceTransfer: v(15, "https://www.capitalone.com/credit-cards/compare/results/?brandCodes=SAVOR.QUICKSILVER", D),
    goToAprMin: v(18.49, "https://www.capitalone.com/credit-cards/compare/results/?brandCodes=SAVOR.QUICKSILVER", D),
    goToAprMax: v(28.49, "https://www.capitalone.com/credit-cards/compare/results/?brandCodes=SAVOR.QUICKSILVER", D),
    annualFee: v(0, "https://www.capitalone.com/credit-cards/compare/results/?brandCodes=SAVOR.QUICKSILVER", D),
    cashAdvanceFeePct: v(5, "https://www.capitalone.com/credit-cards/compare/results/?brandCodes=SAVOR.QUICKSILVER", D, "$5 minimum."),
    cashAdvanceAprMax: v(28.49, "https://www.capitalone.com/credit-cards/compare/results/?brandCodes=SAVOR.QUICKSILVER", D),
    premiumCoding: "aggregator-risk",
    cashEquivalentLanguage: v("'Cash Advance' means a loan in cash or things we consider cash equivalents, including wire transfers, travelers' checks, money orders, foreign currency, lottery tickets, gaming chips, wagers, debt servicing payments, person-to-person money transfers, or use of any third party payment service for a cash equivalent transaction.", "https://ecm.capitalone.com/Messaging/pages/CARD/PS/1350_WEB_11_en-us.html", D, "Insurance premiums are not named; 'debt servicing payments' are. The third-party payment service clause is the risk."),
    sameDayCli: v(true, "https://www.capitalone.com/credit-cards/credit-line-increase", D, "\"In most cases, credit limit increase decisions are available immediately after the request is submitted\" and the new line is \"available immediately.\" Capital One states these are SOFT inquiries."),
    creditGuidance: unverified(null, "Not published."),
    applyUrl: "https://www.capitalone.com/credit-cards/quicksilver/",
    termsUrl: "https://ecm.capitalone.com/Messaging/pages/CARD/PS/1350_WEB_11_en-us.html",
    weaknesses: [
      "Capital One's unpublished rule is one card per 6 months, so this is a one-shot issuer.",
      "Third-party payment service clause creates the same aggregator risk as Chase.",
      "15-month window is mid-pack.",
    ],
  },
  {
    id: "amex-blue-cash-everyday",
    issuer: "American Express",
    card: "Blue Cash Everyday®",
    introPurchase: v(15, "https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/", D),
    introUnit: "months",
    introBalanceTransfer: v(15, "https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/", D, "Transfer must be requested within the first 60 days."),
    goToAprMin: v(19.49, "https://www.creditcards.com/zero-interest/", D),
    goToAprMax: v(28.49, "https://www.creditcards.com/zero-interest/", D),
    annualFee: v(0, "https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/", D),
    cashAdvanceFeePct: unverified(5, "Amex US consumer template, not this card's own agreement.", "https://www.americanexpress.com/content/dam/amex/en-us/company/legal/cardmember-agreements/public-site-2022-q4-pdf-cmas/cps-lending/amex-cash-magnet-12-31-2022.pdf"),
    cashAdvanceAprMax: unverified(28.74, "Template-derived, as above."),
    premiumCoding: "purchase-by-mcc",
    cashEquivalentLanguage: v("A cash advance is a charge to get cash or cash equivalents, including travelers cheques, gift cheques, foreign currency, money orders, digital currency, casino gaming chips, race track wagers, and similar offline and online betting transactions.", "https://www.americanexpress.com/content/dam/amex/en-us/company/legal/cardmember-agreements/public-site-2022-q4-pdf-cmas/cps-lending/amex-cash-magnet-12-31-2022.pdf", D, "Insurance premiums not named. No third-party-aggregator clause, which makes this wording cleaner than Chase's or Capital One's."),
    sameDayCli: unverified(null, "The widely-repeated 3x soft-pull increase after 60 days could not be sourced from American Express."),
    creditGuidance: v("Good - Exceptional", "https://www.experian.com/credit-cards/details/blue-cash-everyday-card-from-american-express", D),
    applyUrl: "https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/",
    termsUrl: "https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/",
    weaknesses: [
      "Amex acceptance is narrower than Visa/Mastercard. Several life carriers that take cards take Visa and Mastercard only — confirm before relying on this card.",
      "Cash advance terms are template-derived, not read from this card's agreement. Balance transfer fee could not be verified at all.",
      "Amex's once-per-lifetime bonus rule means a card opened and closed years ago still blocks the welcome offer.",
    ],
  },
  {
    id: "discover-it",
    issuer: "Capital One, N.A. (Discover brand)",
    card: "Discover it® Cash Back",
    introPurchase: v(15, "https://www.discover.com/credit-cards/cash-back/it-card.html", D),
    introUnit: "months",
    introBalanceTransfer: v(15, "https://www.discover.com/credit-cards/cash-back/it-card.html", D),
    goToAprMin: v(17.49, "https://www.discover.com/credit-cards/cash-back/it-card.html", D),
    goToAprMax: v(26.49, "https://www.discover.com/credit-cards/cash-back/it-card.html", D),
    annualFee: v(0, "https://www.discover.com/credit-cards/cash-back/it-card.html", D),
    cashAdvanceFeePct: v(5, "https://files.consumerfinance.gov/a/assets/credit-card-agreements/pdf/CAPITAL_ONE_NATIONAL_ASSOCIATION/Credit_Card_Agreement_for_Discover.pdf-582095.pdf", D, "$10 minimum."),
    cashAdvanceAprMax: v(28.49, "https://files.consumerfinance.gov/a/assets/credit-card-agreements/pdf/CAPITAL_ONE_NATIONAL_ASSOCIATION/Credit_Card_Agreement_for_Discover.pdf-582095.pdf", D),
    premiumCoding: "aggregator-risk",
    cashEquivalentLanguage: v("Governed by Capital One's customer agreement following the acquisition — same 'use of any third party payment service' clause.", "https://ecm.capitalone.com/Messaging/pages/CARD/PS/1350_WEB_11_en-us.html", D),
    sameDayCli: v(true, "https://www.capitalone.com/credit-cards/credit-line-increase", D, "Capital One terms now govern."),
    creditGuidance: unverified(null, "Not published."),
    applyUrl: "https://www.discover.com/credit-cards/cash-back/it-card.html",
    termsUrl: "https://files.consumerfinance.gov/a/assets/credit-card-agreements/pdf/CAPITAL_ONE_NATIONAL_ASSOCIATION/Credit_Card_Agreement_for_Discover.pdf-582095.pdf",
    weaknesses: [
      "CORRECTION: Discover is now issued by Capital One, N.A. — the acquisition closed 18 May 2025. It is governed by Capital One's agreement and likely counts against Capital One's one-card-per-6-months rule.",
      "Discover acceptance is the narrowest of the four networks. Confirm the carrier takes Discover before relying on this.",
      "Balance transfer fee schedule could not be verified.",
    ],
  },
  {
    id: "citi-double-cash",
    issuer: "Citibank",
    card: "Citi® Double Cash",
    introPurchase: v(0, "https://www.citi.com/credit-cards/citi-double-cash-credit-card", D, "Citi's own pricing paragraph: \"Intro APR does not apply to purchases.\""),
    introUnit: "months",
    introBalanceTransfer: v(18, "https://www.citi.com/credit-cards/citi-double-cash-credit-card", D),
    goToAprMin: v(18.24, "https://www.citi.com/credit-cards/citi-double-cash-credit-card", D),
    goToAprMax: v(28.49, "https://www.citi.com/credit-cards/citi-double-cash-credit-card", D),
    annualFee: v(0, "https://www.citi.com/credit-cards/citi-double-cash-credit-card", D),
    cashAdvanceFeePct: v(5, "https://www.citi.com/credit-cards/citi-double-cash-credit-card", D, "$10 minimum."),
    cashAdvanceAprMax: v(29.74, "https://www.citi.com/credit-cards/citi-double-cash-credit-card", D),
    premiumCoding: "issuer-discretion",
    cashEquivalentLanguage: v("Cash Advance - Use of your Card to get cash, including foreign currency, or for what we consider a cash-like transaction.", "https://www.citi.com/CRD/PDF/CMA/cardAgreement/CMA_DoubleCashADA-3.pdf", D),
    sameDayCli: unverified(null, "Not published."),
    creditGuidance: unverified(null, "Not published."),
    applyUrl: "https://www.citi.com/credit-cards/citi-double-cash-credit-card",
    termsUrl: "https://www.citi.com/CRD/PDF/CMA/cardAgreement/CMA_DoubleCashADA-3.pdf",
    weaknesses: [
      "DISQUALIFIED FOR THIS STRATEGY. Citi's own pricing paragraph states the intro APR does not apply to purchases. The 18-month figure that circulates on top-10 lists is the BALANCE TRANSFER window. A premium charged to this card accrues interest at 18.24%-28.49% from the first statement.",
      "Listed here only so it is visibly excluded rather than silently missing — it appears on most published top-10 lists and would otherwise look like an oversight.",
    ],
  },
];

/** Cards that actually work for charging premium, longest 0% purchase window first. */
export const usableCards = (): ZeroAprCard[] =>
  ZERO_APR_CARDS
    .filter(c => (c.introPurchase.value ?? 0) > 0)
    .sort((a, b) => (b.introPurchase.value ?? 0) - (a.introPurchase.value ?? 0));

// ─── Issuer application gates ──────────────────────────────────────────────

export const ISSUER_GATES: Record<string, CardIssuerGate> = {
  "Wells Fargo": {
    rule: "One Wells Fargo consumer card per 6 months. Separately, no intro APR or bonus if you have held or opened that product in the last 48 months, even if closed at $0.",
    published: true,
    source: "https://www.wellsfargo.com/credit-cards/reflect-visa/terms/",
  },
  "JPMorgan Chase": {
    rule: "5/24 — most consumer applications auto-decline if you have opened 5 or more personal cards from ANY issuer in the past 24 months. Closed cards still count.",
    published: false,
    source: "https://www.doctorofcredit.com/chase-524-rule-explained-detail-need-know",
  },
  "Bank of America": {
    rule: "2/3/4 — no more than 2 cards in 2 months, 3 in 12 months, 4 in 24 months.",
    published: false,
    source: "https://militarymoneymanual.com/credit-card-application-rules",
  },
  "Capital One": {
    rule: "One card per 6 months, personal or business. Commonly reported cap of 2 personal cards held.",
    published: false,
    source: "https://pointsmax.app/guides/credit-card-application-rules",
  },
  Citibank: {
    rule: "8/65 — one card per 8 days, two per 65 days.",
    published: false,
    source: "https://www.stackeasy.ai/credit-card-application-rules",
  },
  "American Express": {
    rule: "1/5 (one card per 5 days) and 2/90 (two per 90 days). Welcome bonus once per lifetime per product.",
    published: false,
    source: "https://www.nerdwallet.com/travel/learn/your-guide-to-amexs-once-per-lifetime-rule",
  },
  "U.S. Bank": {
    rule: "No documented velocity gate.",
    published: false,
    source: "",
  },
};

/**
 * Application order that maximises total approved credit.
 *
 * The logic is not preference — it follows from the gates. Chase's 5/24 is the
 * only rule driven by OTHER issuers' accounts, so every card opened anywhere
 * burns a Chase slot. Apply to Chase before accumulating inquiries elsewhere,
 * or not at all. After that, order by how restrictive each issuer's own gate
 * is. Each application is a hard inquiry; inquiries affect scores for about
 * 12 months and stay on the report 24.
 */
export const APPLICATION_SEQUENCE: Array<{ step: number; issuer: string; take: string[]; why: string }> = [
  { step: 1, issuer: "JPMorgan Chase", take: ["chase-slate"], why: "5/24 is the only gate that counts other issuers' cards. Every card opened anywhere burns a slot here, so Chase goes first or not at all. Slate's 21 months is the longest Chase window." },
  { step: 2, issuer: "Bank of America", take: ["bankamericard"], why: "21 billing cycles at the lowest go-to APR in the set (14.99%-25.99%) and no penalty APR. 2/3/4 permits a second BofA card in the same 2-month window if needed." },
  { step: 3, issuer: "U.S. Bank", take: ["usbank-shield"], why: "21 billing cycles with no documented velocity gate, so it can be taken at any point without disturbing the sequence." },
  { step: 4, issuer: "Wells Fargo", take: ["wf-reflect"], why: "The 6-month gate means Reflect OR Active Cash, never both. Reflect wins on duration, 21 months against 12." },
  { step: 5, issuer: "Capital One", take: ["capitalone-quicksilver"], why: "One card per 6 months, so this is a single shot. Quicksilver's 15 months beats Savor's 12. Also the only issuer with confirmed same-day soft-pull credit line increases." },
  { step: 6, issuer: "American Express", take: ["amex-blue-cash-everyday"], why: "No documented outside-inquiry gate, so it goes last without cost. Confirm the carrier accepts Amex first." },
];

// ═══════════════════════════════════════════════════════════════════════════
// THE POLICY MECHANICS — and a correction that matters
// ═══════════════════════════════════════════════════════════════════════════
//
// The strategy is usually explained like this: pay premium, let it sit a day,
// withdraw it, and the index credit still lands on the full amount because the
// "account value" only ever goes up.
//
// That is not how an indexed universal life policy works, and building a
// calculator on it would produce numbers that are wrong by an order of
// magnitude. Two things are being conflated:
//
//   * An ANNUITY INCOME RIDER has a benefit base — a notional value that rolls
//     up with deposits and a guaranteed rate, is unaffected by withdrawals,
//     and exists only to compute income. You cannot withdraw it.
//
//   * An IUL has an ACCOUNT VALUE, which IS the cash value. Index credits are
//     applied to the balance actually sitting in the index segment at the
//     segment anniversary. Take money out and the balance falls. The next
//     credit is computed on what remains, not on what was once there.
//
// So "put $300k in, take $300k out, still earn on $300k" does not hold for a
// WITHDRAWAL.
//
// BUT THE STRATEGY IS REAL — the mechanism is a PARTICIPATING (WASH) LOAN, not
// a withdrawal. Under a participating loan the carrier lends against the
// policy using its general account. Your cash value is never removed; it stays
// in the index segment and keeps earning the full index credit. You hold the
// borrowed cash and pay a loan charge on it.
//
//     positive arbitrage = index credit earned − loan charge paid
//
// That is exactly the "9% credit minus a 5% loan equals 4%" arithmetic — the
// economics are right; only the label is wrong. It is arbitrage on a
// collateralised balance, not growth on a phantom account value. That
// distinction is the whole compliance difference between an illustration an
// agent can defend and one they cannot.
//
// This engine models the LOAN mechanism by default. Set `mechanism:
// "withdrawal"` to see the (much smaller) withdrawal case, and
// `mechanism: "benefit-base-myth"` to reproduce the incorrect version for
// side-by-side comparison — it is included ONLY so the gap is visible, and it
// is labelled as not achievable wherever it renders.

export type Mechanism = "participating-loan" | "withdrawal" | "benefit-base-myth";

export type PolicyAssumptions = {
  /** Annual premium charged to cards. Nationwide's published card ceiling is $9,999/month. */
  annualPremium: number;
  years: number;
  /** Assumed index credit. AG 49-A caps what may be ILLUSTRATED; this is a modelling input, not an illustration. */
  indexCreditRate: number;
  /** Participating loan charge. Commonly ~5%-6% fixed, or a variable rate. */
  loanChargeRate: number;
  /**
   * Premium load + per-unit + cost of insurance, as a share of premium.
   * On a max-funded, minimum-death-benefit design this is commonly 6%-12% in
   * the early years. There is NO policy where 100% of premium reaches cash value.
   */
  policyChargeRate: number;
  /** Surrender charge in year 1, amortising to zero. Why year-1 cash is not accessible. */
  surrenderChargeYears: number;
  /** Cash value accessible as a loan, as a share of cash value. Typically 0.90-0.95 after year 1. */
  maxLoanToValue: number;
  mechanism: Mechanism;
};

export const DEFAULT_ASSUMPTIONS: PolicyAssumptions = {
  annualPremium: 119_988, // 9,999 x 12 — the published Nationwide card ceiling
  years: 20,
  indexCreditRate: 0.09,
  loanChargeRate: 0.05,
  policyChargeRate: 0.08,
  surrenderChargeYears: 10,
  maxLoanToValue: 0.90,
  mechanism: "participating-loan",
};

export type YearRow = {
  year: number;
  premiumPaid: number;
  cumulativePremium: number;
  policyCharges: number;
  /** The real, withdrawable/borrowable balance. */
  accountValue: number;
  /** Account value net of any remaining surrender charge. */
  surrenderValue: number;
  indexCredit: number;
  /** Cash actually available to deploy this year. */
  accessibleCash: number;
  loanBalance: number;
  loanCharge: number;
  /** indexCredit − loanCharge. The number the strategy lives or dies on. */
  netArbitrage: number;
  cumulativeNetArbitrage: number;
};

export type PlasticToCashResult = {
  rows: YearRow[];
  mechanism: Mechanism;
  totalPremium: number;
  totalPolicyCharges: number;
  totalIndexCredits: number;
  totalLoanCharges: number;
  netArbitrage: number;
  finalAccountValue: number;
  finalLoanBalance: number;
  /** Death benefit net of outstanding loan — what beneficiaries actually receive. */
  netDeathBenefitNote: string;
  warnings: string[];
};

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Project the policy side of the strategy.
 *
 * Deliberately conservative choices, each stated rather than buried:
 *  - Index credit applies to the account value at the START of the year plus
 *    that year's net premium. No mid-year compounding.
 *  - Policy charges come off premium before anything is credited.
 *  - Under a participating loan the full account value keeps earning; the loan
 *    charge accrues on the outstanding loan balance and is NOT netted out of
 *    cash value, matching how carriers actually administer it.
 *  - A 0% floor is applied. Index credits are never negative.
 */
export function projectPlasticToCash(a: PolicyAssumptions = DEFAULT_ASSUMPTIONS): PlasticToCashResult {
  const rows: YearRow[] = [];
  const warnings: string[] = [];

  if (a.indexCreditRate > 0.12) {
    warnings.push(`An index credit assumption of ${(a.indexCreditRate * 100).toFixed(1)}% is above what AG 49-A permits a carrier to illustrate. Usable for modelling; not usable in anything presented as an illustration.`);
  }
  if (a.indexCreditRate <= a.loanChargeRate) {
    warnings.push("The assumed index credit does not exceed the loan charge. In this scenario the arbitrage is zero or negative and the strategy loses money every year it runs.");
  }
  if (a.policyChargeRate < 0.05) {
    warnings.push("A policy charge below 5% of premium is optimistic even for a max-funded, minimum-death-benefit design. Verify against the actual illustration.");
  }
  if (a.annualPremium > 119_988) {
    warnings.push("Annual premium exceeds $119,988, which is 12 x the $9,999 monthly ceiling Nationwide publishes for card payments. Anything above that has to be funded another way.");
  }

  let accountValue = 0;
  let loanBalance = 0;
  let cumulativePremium = 0;
  let cumulativeNet = 0;
  let totalPolicyCharges = 0;
  let totalIndexCredits = 0;
  let totalLoanCharges = 0;

  // The myth case: a notional base that only ratchets up. Modelled solely to
  // show the divergence from what a policy actually does.
  let mythBase = 0;

  for (let year = 1; year <= a.years; year++) {
    const premium = a.annualPremium;
    cumulativePremium += premium;

    const charges = premium * a.policyChargeRate;
    totalPolicyCharges += charges;
    const netPremium = premium - charges;

    const creditingBase =
      a.mechanism === "benefit-base-myth"
        ? (mythBase += premium)
        : accountValue + netPremium;

    const indexCredit = Math.max(0, creditingBase * a.indexCreditRate);
    totalIndexCredits += indexCredit;

    if (a.mechanism === "benefit-base-myth") {
      mythBase += indexCredit;
      accountValue = mythBase;
    } else {
      accountValue = accountValue + netPremium + indexCredit;
    }

    // Surrender charge amortises straight-line to zero.
    const surrenderFactor = year > a.surrenderChargeYears ? 0 : (a.surrenderChargeYears - year + 1) / a.surrenderChargeYears;
    const surrenderCharge = accountValue * 0.10 * surrenderFactor;
    const surrenderValue = Math.max(0, accountValue - surrenderCharge);

    let accessibleCash = 0;
    let loanCharge = 0;

    if (a.mechanism === "participating-loan") {
      // Loans generally are not available in year 1. The cash value stays in
      // the index segment and keeps crediting — that is the whole point.
      if (year > 1) {
        const capacity = accountValue * a.maxLoanToValue - loanBalance;
        accessibleCash = Math.max(0, capacity);
        loanBalance += accessibleCash;
      }
      loanCharge = loanBalance * a.loanChargeRate;
      totalLoanCharges += loanCharge;
      loanBalance += loanCharge; // accrues; not paid from cash value
    } else if (a.mechanism === "withdrawal") {
      // Withdrawals REMOVE the balance. Next year's credit is computed on what
      // is left — which is what makes this the weaker of the two mechanisms.
      if (year > 1) {
        accessibleCash = Math.max(0, surrenderValue);
        accountValue -= accessibleCash;
      }
    } else {
      if (year > 1) accessibleCash = Math.max(0, surrenderValue);
    }

    const netArbitrage = indexCredit - loanCharge;
    cumulativeNet += netArbitrage;

    rows.push({
      year,
      premiumPaid: round(premium),
      cumulativePremium: round(cumulativePremium),
      policyCharges: round(charges),
      accountValue: round(accountValue),
      surrenderValue: round(surrenderValue),
      indexCredit: round(indexCredit),
      accessibleCash: round(accessibleCash),
      loanBalance: round(loanBalance),
      loanCharge: round(loanCharge),
      netArbitrage: round(netArbitrage),
      cumulativeNetArbitrage: round(cumulativeNet),
    });
  }

  if (a.mechanism === "benefit-base-myth") {
    warnings.unshift(
      "THIS SCENARIO IS NOT ACHIEVABLE. It credits interest on every dollar of premium ever paid regardless of withdrawals, which is how an annuity income-rider benefit base behaves, not an IUL account value. It is included only to show the size of the gap against the participating-loan case. Do not present these figures to a client."
    );
  }

  return {
    rows,
    mechanism: a.mechanism,
    totalPremium: round(cumulativePremium),
    totalPolicyCharges: round(totalPolicyCharges),
    totalIndexCredits: round(totalIndexCredits),
    totalLoanCharges: round(totalLoanCharges),
    netArbitrage: round(totalIndexCredits - totalLoanCharges),
    finalAccountValue: round(accountValue),
    finalLoanBalance: round(loanBalance),
    netDeathBenefitNote:
      a.mechanism === "participating-loan"
        ? `An outstanding loan of ${round(loanBalance).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} is repaid from the death benefit before beneficiaries receive anything. The loan is not free money; it is an advance against the death benefit. If the policy lapses with a loan outstanding, the gain becomes immediately taxable.`
        : "Withdrawals above basis are taxable. Withdrawals reduce the death benefit dollar for dollar.",
    warnings,
  };
}

// ─── The card side: what the float actually costs ──────────────────────────

export type CardCostInput = {
  chargedPerCard: number;
  cards: string[]; // card ids
  /** Months before the balance is repaid. Past the intro window, interest starts. */
  monthsToRepay: number;
  /** Worst case uses the top of the go-to APR range. */
  useWorstCaseApr: boolean;
};

export type CardCostResult = {
  perCard: Array<{
    id: string;
    issuer: string;
    card: string;
    introMonths: number;
    charged: number;
    monthsOutsideIntro: number;
    interestIfUnpaid: number;
    aprUsed: number;
    codingRisk: PremiumCoding;
    /** What it costs if the charge posts as a CASH ADVANCE instead of a purchase. */
    cashAdvanceDownside: number | null;
  }>;
  totalCharged: number;
  totalInterestWorstCase: number;
  totalCashAdvanceDownside: number | null;
};

/**
 * Worst-case card cost.
 *
 * Deliberately pessimistic — this is the number that belongs next to the
 * upside, not buried under it. Interest is simple, not compounded, which
 * slightly understates a genuinely unpaid balance; the point is the order of
 * magnitude, and the cash-advance column is where the real risk sits.
 */
export function projectCardCost(input: CardCostInput): CardCostResult {
  const perCard = input.cards.map(id => {
    const c = ZERO_APR_CARDS.find(x => x.id === id);
    if (!c) throw new Error(`Unknown card id: ${id}`);

    const introMonths = c.introPurchase.value ?? 0;
    const outside = Math.max(0, input.monthsToRepay - introMonths);
    const apr = (input.useWorstCaseApr ? c.goToAprMax.value : c.goToAprMin.value) ?? 0;
    const interest = input.chargedPerCard * (apr / 100) * (outside / 12);

    // Cash advance: fee immediately, then interest from day one with no grace
    // period, for the WHOLE repayment period — the intro window does not apply.
    const caFee = c.cashAdvanceFeePct.value;
    const caApr = c.cashAdvanceAprMax.value;
    const cashAdvanceDownside =
      caFee != null && caApr != null
        ? round(input.chargedPerCard * (caFee / 100) + input.chargedPerCard * (caApr / 100) * (input.monthsToRepay / 12))
        : null;

    return {
      id: c.id,
      issuer: c.issuer,
      card: c.card,
      introMonths,
      charged: input.chargedPerCard,
      monthsOutsideIntro: outside,
      interestIfUnpaid: round(interest),
      aprUsed: apr,
      codingRisk: c.premiumCoding,
      cashAdvanceDownside,
    };
  });

  const anyUnknown = perCard.some(p => p.cashAdvanceDownside == null);

  return {
    perCard,
    totalCharged: round(perCard.reduce((s, p) => s + p.charged, 0)),
    totalInterestWorstCase: round(perCard.reduce((s, p) => s + p.interestIfUnpaid, 0)),
    totalCashAdvanceDownside: anyUnknown ? null : round(perCard.reduce((s, p) => s + (p.cashAdvanceDownside ?? 0), 0)),
  };
}

/**
 * The standing disclosure. Shown on the page and carried into any AI answer
 * that describes this strategy.
 */
export const PLASTIC_TO_CASH_DISCLOSURE =
  "Russell Capital Systems receives no compensation, referral fee or other consideration from any card issuer or carrier named on this page. " +
  "Nothing here is a recommendation, an endorsement, an offer of credit, or an insurance illustration — illustrations come from the carrier and only from the carrier. " +
  "This strategy borrows money to fund an insurance contract. It can fail, and the ways it fails are listed before anything it might earn. " +
  "Card terms and carrier payment policies move constantly: every figure carries the date it was read from the issuer's or carrier's own published material, " +
  "and anything past that date must be re-checked directly with them. Confirm any structure with your own attorney and CPA before acting on it.";

/**
 * The banner that stays on the page until a phone call retires it.
 *
 * The modelled ceiling and the verified ceiling are not the same number, and
 * the page must never let a reader mistake one for the other.
 */
export const FUNDING_CEILING_BANNER =
  "This page models premium at $9,999 a month — the ceiling widely cited for Nationwide. " +
  "That figure could NOT be read from Nationwide's own policyholder-services page, and a separate Nationwide document indicates cards are taken " +
  "'on an exception basis' for fixed life products. The only carrier card policy verified from its own published material is Penn Mutual: " +
  "initial premium only, $10,000 maximum, online, not available in New York. " +
  "Treat every figure above $10,000 as contingent on a carrier policy that is currently unconfirmed. One call to Nationwide settles it.";

// ─── Weaknesses of the strategy itself ─────────────────────────────────────
//
// Required field, same rule as shared/liquidityRoutes.ts. These go ABOVE the
// upside on the page, not below it.

export const STRATEGY_WEAKNESSES: readonly string[] = [
  "CODING RISK IS THE WHOLE STRATEGY. If a premium posts as a cash advance rather than a purchase, there is a ~5% fee, an APR near 29%, and no grace period — interest runs from day one and the 0% window never applies. No issuer's agreement names insurance premiums as a cash equivalent, and no issuer promises they are purchases either. Chase, Citi and Capital One all reserve open-ended discretion. Charge a small test premium and read the statement before charging anything material.",
  "PAY THE CARRIER DIRECTLY. Chase's agreement expressly treats \"a payment using a third party service including bill payment transactions not made directly with the merchant or their service provider\" as cash-like, and Capital One's covers \"use of any third party payment service.\" If the carrier's payment page routes through an aggregator, the charge can be recoded.",
  "YEAR-ONE CASH IS NOT AVAILABLE. Surrender charges run 10 years on most accumulation designs and most carriers do not permit loans in policy year 1. The card balance comes due on the card's schedule, not the policy's.",
  "A LOAN IS AN ADVANCE AGAINST THE DEATH BENEFIT, not income. It is repaid from the death benefit before beneficiaries receive anything, and the balance compounds at the loan rate for as long as it is outstanding.",
  "LAPSE WITH A LOAN OUTSTANDING IS A TAX EVENT. If the policy lapses or is surrendered while a loan is outstanding, the entire gain becomes immediately taxable — potentially a tax bill on money that has already been spent. This is the single most damaging failure mode of the strategy.",
  "THE FLOOR IS 0%, NOT A POSITIVE RETURN. A zero-credit year still incurs the loan charge, policy charges and cost of insurance. Several consecutive zero years with a loan outstanding can put the policy into a lapse spiral.",
  "ARBITRAGE CAN INVERT. The spread only exists while index credits exceed the loan charge. A variable loan rate that rises, or a run of low-credit years, turns the spread negative while the loan keeps compounding.",
  "THIS REQUIRES HEALTH AND INCOME UNDERWRITING. The policy has to be issued. It cannot be bought with money alone — it requires a medical exam and financial justification for the face amount.",
  "IT ALSO REQUIRES CREDIT. Multiple applications are multiple hard inquiries. The total approved line may come in far below what the plan assumes, and the strategy does not scale below a certain size.",
  "CARD TERMS CHANGE WITHOUT NOTICE. Every figure in this module carries the date it was read. An intro window, an APR or a cash-advance definition can move between when a plan is built and when it is executed.",
];

// ═══════════════════════════════════════════════════════════════════════════
// THE CARRIER SIDE — and the constraint that decides whether this scales
// ═══════════════════════════════════════════════════════════════════════════
//
// The strategy assumes a carrier will take roughly $120,000 a year on cards,
// every year. Researching that assumption produced the most important finding
// in this module, and it is a constraint, not a feature:
//
//   THE ONLY CARRIER WITH A CLEARLY PUBLISHED CARD POLICY ACCEPTS CARDS FOR
//   THE INITIAL PREMIUM ONLY, CAPPED AT $10,000, ONLINE ONLY, NOT IN NEW YORK.
//
// That is Penn Mutual, and it is the best-documented row here. Two carriers
// publish that they do NOT take cards at all. Everything else is unverified.
//
// WHY CARRIERS RESTRICT THIS — and it is not mainly interchange cost.
// Under New York DFS Office of General Counsel opinions, THE METHOD OF PREMIUM
// PAYMENT IS ITSELF A BENEFIT UNDER THE POLICY. Insurance Law Articles 23 and
// 42 prohibit benefit discrimination within a class, so a carrier that accepts
// cards cannot accept them from some insureds in a class and not others.
// Separately, absorbing 1.5-3.5% interchange for card-payers while ACH-payers
// receive no equivalent benefit reads as an unlawful inducement or rebate
// unless it is written into the filed policy or rate filing.
//
// So a carrier cannot quietly extend card payment to a favoured producer's
// book. It is filed and available to an entire class, or it is not available.
// That is a regulatory wall, not a negotiation, and it is why "call the
// carrier and ask for an exception" is not a workaround.
//
// Persistency is the third reason: cards expire, get reissued and get
// declined, so card-paid policies lapse at materially higher rates. For a
// product priced on 20+ years of persistency that is an underwriting problem.
//
// Sources: NY DFS OGC opinions 02-10-03, 08-04-07 and 01-06-21.

export type CarrierCardPolicy = {
  carrier: string;
  /** Accepts cards for premium? Stated only where a carrier's own page says so. */
  acceptsCards: Verified<"yes" | "no" | "unknown">;
  /** Initial premium only, or recurring too? This is the question that decides scale. */
  scope: Verified<"initial-premium-only" | "initial-and-renewal" | "none" | "unknown">;
  cap: Verified<number | null>;
  networks: Verified<string[] | null>;
  stateExclusions: Verified<string[] | null>;
  product: Verified<string | null>;
  weaknesses: readonly string[];
};

export const CARRIER_CARD_POLICIES: CarrierCardPolicy[] = [
  {
    carrier: "Penn Mutual",
    acceptsCards: v("yes", "https://gateway.pennmutual.com/static-assets/files/products/life/t4473.pdf", D, "Best-documented card policy of any carrier researched — read from Penn Mutual's own payment-options document."),
    scope: v("initial-premium-only", "https://www.pennmutual.com/for-individuals-and-businesses/client-services/account-faqs", D, "Loan repayments, paid-up additions and ALL premiums after the initial premium are ACH only."),
    cap: v(10_000, "https://gateway.pennmutual.com/static-assets/files/products/life/t4473.pdf", D, "Premium must not exceed $10,000."),
    networks: v(["Visa", "Mastercard"], "https://gateway.pennmutual.com/static-assets/files/products/life/t4473.pdf", D, "Credit or debit."),
    stateExclusions: v(["NY"], "https://gateway.pennmutual.com/static-assets/files/products/life/t4473.pdf", D),
    product: v("Accumulation Indexed UL (AIUL), introduced July 2022", "https://gateway.pennmutual.com/products-performance/indexed-universal-life/accumulation-indexed-universal-life", D),
    weaknesses: [
      "THIS IS THE CONSTRAINT THAT CAPS THE WHOLE STRATEGY. Initial premium only, $10,000 maximum, once. There is no recurring card funding here — every subsequent premium is ACH.",
      "Online only. Not available in New York.",
    ],
  },
  {
    carrier: "Nationwide",
    acceptsCards: unverified("unknown", "Reported as accepting cards for initial AND renewal premium in all states, but the source is a brokerage general agency restating Nationwide bulletin FAN-0114AO — not Nationwide's own page, which could not be reached. A separate Nationwide document indicates cards are accepted 'on an exception basis' for fixed life products, which sits awkwardly against 'all states'.", "https://www.ltcipartners.com/carriernews/nationwide-paying-premium-via-credit-card"),
    scope: unverified("unknown", "See above. 'Exception basis' and 'all states' cannot both be routinely true."),
    cap: unverified(null, "The widely-repeated $9,999/month ceiling could NOT be read from Nationwide's own policyholder-services page. Do not build a plan on it without confirming by phone."),
    networks: unverified(null, "Not published."),
    stateExclusions: unverified(null, "Not published."),
    product: v("Nationwide Indexed UL Accumulator III, launched 26 March 2026", "https://nationwidefinancial.com/products/life/indexed-universal/indexed-ul-accumulator-iii", D, "CORRECTION: there is no 'Accumulator 3'. Nationwide uses Roman numerals. Accumulator II (2020) is the direct predecessor and is superseded."),
    weaknesses: [
      "The single most load-bearing assumption in this strategy — that Nationwide takes $9,999/month on a card indefinitely — is the LEAST verified claim in this module. One phone call to Nationwide policyholder services settles it. Make that call before presenting this to anyone.",
      "'Exception basis' language, if it governs, means this is not a repeatable program and cannot be planned around.",
      "Note also: Nationwide LIFE is a STOCK company. Its ultimate parent, Nationwide Mutual, is a mutual property-and-casualty insurer. Calling the life issuer 'a mutual' is not accurate.",
    ],
  },
  {
    carrier: "Symetra",
    acceptsCards: v("no", "https://www.symetra.com/customer-service/faq-individual-life-insurance/", D, "Symetra's own individual-life FAQ lists accepted methods as online premium payment, personal check, bank bill-payer service and recurring EFT. Cards are not among them."),
    scope: v("none", "https://www.symetra.com/customer-service/faq-individual-life-insurance/", D),
    cap: v(null, "https://www.symetra.com/customer-service/faq-individual-life-insurance/", D),
    networks: v(null, "https://www.symetra.com/customer-service/faq-individual-life-insurance/", D),
    stateExclusions: v(null, "https://www.symetra.com/customer-service/faq-individual-life-insurance/", D),
    product: v("Accumulator Ascent IUL", "https://financialprofessionals.symetra.com/AAIUL", D, "Carries an 8-year lookback guarantee: if indexed strategies have not returned at least 2% cumulatively over 8 years, Symetra guarantees a 2% minimum. That is the strongest downside guarantee found in the category."),
    weaknesses: [
      "Does not accept cards. Excluded from this strategy, but listed because its 8-year 2% cumulative guarantee makes it a serious candidate for ACH-funded accumulation.",
    ],
  },
  {
    carrier: "Ameritas",
    acceptsCards: v("no", "https://www.ameritas.com/life/faq-life/", D, "Ameritas' own life FAQ lists checks, wires, cashier's checks, bank bill-pay, and phone/online payment using bank account information or a DEBIT card. Credit cards are not listed."),
    scope: v("none", "https://www.ameritas.com/life/faq-life/", D),
    cap: v(null, "https://www.ameritas.com/life/faq-life/", D),
    networks: v(null, "https://www.ameritas.com/life/faq-life/", D),
    stateExclusions: v(null, "https://www.ameritas.com/life/faq-life/", D),
    product: v("Ameritas Growth Index UL / Growth IUL II", "https://www.ameritas.com/industry-professionals/life-insurance/index-universal/", D),
    weaknesses: ["Debit may be accepted; credit is not listed. A debit payment defeats the entire purpose — there is no float and no 0% window."],
  },
  {
    carrier: "National Life Group / LSW",
    acceptsCards: unverified("unknown", "DO NOT STATE THAT NATIONAL LIFE ACCEPTS CARDS. Search results claiming Visa/Mastercard/Discover acceptance trace to doxo, a third-party bill-payment aggregator that is not authorised by most billers, charges its own fees, is the subject of a class action, and has an FTC consumer alert against it for posing as an official payment portal. National Life itself publishes a warning about sites impersonating it for payments. An aggregator accepting a card is not the carrier accepting a card — and under Chase's and Capital One's agreements, paying through an aggregator is exactly what gets a charge recoded as a cash advance.", "https://consumer.ftc.gov/consumer-alerts/2024/04/pay-your-bills-not-impersonators"),
    scope: unverified("unknown", "As above."),
    cap: unverified(null, "As above."),
    networks: unverified(null, "As above."),
    stateExclusions: unverified(null, "As above."),
    product: v("FlexLife ($50K min), PeakLife ($1M min), SummitLife ($1M min)", "https://www.nationallife.com/Our-Story/newsroom/flexlife-iul-enhancement-sandwich-generation-support", D, "Deepest IUL segmentation found; 5% participating fixed loan set at issue across the line."),
    weaknesses: [
      "The card-acceptance claim is an aggregator artefact. Treating it as real would route premium through exactly the third-party channel that triggers cash-advance recoding.",
    ],
  },
  {
    carrier: "Northwestern Mutual",
    acceptsCards: unverified("no", "Published payment methods are EFT, online payment and check. Card acceptance reported as unavailable, but the source is secondhand.", "https://www.northwesternmutual.com/faq/life-insurance-faq/"),
    scope: unverified("none", "As above."),
    cap: unverified(null, ""),
    networks: unverified(null, ""),
    stateExclusions: unverified(null, ""),
    product: v(null, "https://www.northwesternmutual.com/life-insurance/indexed-universal-life-insurance-iul/", D, "DOES NOT SELL IUL AT ALL, by published policy. Their stated reasons: illustrations do not reflect real-world results; fees and complexity limit gains; caps are adjustable by the insurer via formulas that are hard to parse."),
    weaknesses: [
      "Sells no IUL and is fully captive — an independent agent cannot access them at any production level. Listed only so the omission is deliberate rather than an oversight.",
    ],
  },
];

/** Carriers confirmed to take a card, with the scope that actually matters. */
export const cardFundableCarriers = (): CarrierCardPolicy[] =>
  CARRIER_CARD_POLICIES.filter(c => c.acceptsCards.value === "yes");

/**
 * The honest scale ceiling.
 *
 * Returns the maximum premium that can be verifiably funded by card today,
 * rather than the figure the strategy assumes. As of the research date this
 * is one carrier, one payment, $10,000 — until Nationwide's policy is
 * confirmed by phone.
 */
export function verifiedCardFundingCeiling(): { annual: number; basis: string } {
  const confirmed = cardFundableCarriers();
  const annual = confirmed.reduce((s, c) => s + (c.cap.value ?? 0), 0);
  return {
    annual,
    basis:
      confirmed.length === 0
        ? "No carrier's card acceptance could be verified from its own published material."
        : `Verified from carrier-published material: ${confirmed
            .map(c => `${c.carrier} ${c.cap.value != null ? "$" + c.cap.value.toLocaleString("en-US") : "cap unknown"} (${c.scope.value.replace(/-/g, " ")})`)
            .join("; ")}. Everything above this figure depends on carrier policies that are currently unverified.`,
  };
}
