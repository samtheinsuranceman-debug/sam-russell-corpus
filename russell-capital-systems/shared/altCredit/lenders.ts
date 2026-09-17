// ============================================================
// THE LENDER DIRECTORY.
//
// Every field is Verified<T>. A value carries the source it was read from and
// the date it was read, or it carries the reason it could not be confirmed and
// where the client should go to check. There is no third option in the type.
//
// WHAT IS MISSING AND WHY. Phone numbers, street addresses, Better Business
// Bureau grades and Google review counts are largely NOT VERIFIED below. That
// is not laziness — it is the honest state of the research. Those four fields
// share a property the others do not: they are trivially spoofed, they are the
// exact fields a lead-broker or a fraudster clones, and they change without
// notice. Publishing one I have not personally confirmed against the company's
// own site would be worse than publishing nothing, because a blank sends a
// client to look and a wrong number does not.
//
// Every record therefore carries `url`, which is always verified, because that
// is the one field a client can use to check all the others in ten seconds.
// When the team confirms a number from a company's own contact page, replace
// notVerified(...) with verified(value, source, date) and the page updates.
// ============================================================

import { type Lender, verified, notVerified } from "./types";

const READ = "2026-09-17";
const CHECK_CONTACT = "the company's own contact page, linked above";

export const LENDERS: readonly Lender[] = [
  /* ---------------- DSCR and investor property ---------------- */
  {
    id: "ternus", name: "Ternus",
    url: "https://www.ternus.com/loan-programs/long-term-rental-loans",
    categories: ["dscr"],
    what: "Long-term rental loans on 1–4 unit residential investment property, underwritten on the property's debt service coverage ratio rather than the borrower's income.",
    identifiers: [],
    phone: notVerified("Not confirmed from the company's own contact page.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not stated on the program page read."),
    bbbRating: notVerified("Not confirmed against a BBB profile.", "bbb.org, searching the company name"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search for the company name"),
    rates: notVerified("The program page states terms but not a rate range; rates move weekly.", "request a written quote"),
    maxAdvance: verified("Up to 80% LTV on purchase and rate-and-term refinance; up to 75% on cash-out.", "Ternus long-term rental loans program page", READ),
    terms: verified("30-year fixed, 5/1 ARM and 7/1 ARM, with an interest-only option.", "Ternus long-term rental loans program page", READ),
    loanSize: notVerified("Not stated on the page read.", CHECK_CONTACT),
    underwriting: [
      "DSCR = gross monthly rent ÷ PITIA (principal, interest, taxes, insurance, association dues).",
      "The company's worked example: $2,400 rent against $2,000 PITIA is a 1.20 ratio and qualifies.",
      "650 minimum credit score, as published.",
      "No income documents, no W-2s, no tax returns.",
      "1–4 unit residential, condos, townhomes and PUDs.",
    ],
    restrictions: verified("Lends across 39 states, per the program page. The specific states are not listed there.", "Ternus long-term rental loans program page", READ),
    notes: ["Publishes 'no prepayment penalty' on this program — confirm it applies to the specific loan you are quoted, because prepayment terms vary within a lender's own product set."],
  },
  {
    id: "visio", name: "Visio Lending",
    url: "https://www.visiolending.com",
    categories: ["dscr", "portfolio"],
    what: "DSCR specialist for rental and short-term rental property, plus single-family rental portfolio financing.",
    identifiers: [],
    phone: notVerified("Not confirmed from the company's own contact page.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not confirmed."),
    bbbRating: verified("A+, as reported by CNBC Select in its September 2026 investment property lender review.", "CNBC Select, 'Best Investment Property Lenders of September 2026'", READ),
    googleReviews: notVerified<{ count: number; rating: number }>("Trustpilot reviews are referenced by CNBC but the count was not confirmed.", "trustpilot.com and a Google search"),
    rates: verified("Described by CNBC Select as lower-than-average rates and fees for the category; no numeric range published there.", "CNBC Select, September 2026", READ),
    maxAdvance: notVerified("Not confirmed.", CHECK_CONTACT),
    terms: notVerified("Not confirmed.", CHECK_CONTACT),
    loanSize: notVerified("Not confirmed.", CHECK_CONTACT),
    underwriting: [
      "Underwrites projected rental income against the cost of the property rather than borrower income.",
      "Programs published for single-family rental, multifamily, short-term rental and construction.",
    ],
    restrictions: notVerified("Not confirmed.", CHECK_CONTACT),
    notes: ["Named by CNBC Select among investment property lenders in September 2026, cited there for consistency across hundreds of reviews."],
  },
  {
    id: "lendmire", name: "Lendmire",
    url: "https://www.lendmire.com/loanoptions/dscr-investor-loans",
    categories: ["dscr"],
    what: "Broker placing DSCR loans through multiple non-QM wholesale lenders, across single-family, 1–10 unit, condo and short-term rental.",
    identifiers: ["NMLS #2371349 (Lendmire LLC)", "NMLS #1129696 (Brandon Miller, author of its published guides)"],
    phone: notVerified("Not confirmed from the company's own contact page.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not confirmed."),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search for the company name"),
    rates: verified("Publishes that DSCR rates run above conventional investor pricing, priced by the non-QM secondary market; a live calculator is provided rather than a fixed range.", "Lendmire DSCR loan options page", READ),
    maxAdvance: verified("Up to 80% LTV on purchase; up to 75% on cash-out refinance.", "Lendmire DSCR loan options page", READ),
    terms: verified("Interest-only and 40-year terms available alongside 30-year.", "Lendmire DSCR loan options page", READ),
    loanSize: notVerified("Not confirmed.", CHECK_CONTACT),
    underwriting: [
      "No tax returns, no W-2s, no employment verification.",
      "Short-term rental income qualified at 75–80% of gross, after a 20% reduction.",
      "Conventional programs cap around ten financed properties; DSCR has no such cap.",
      "LLC and entity vesting accepted, which conventional investor loans generally will not do.",
      "Close in as little as 15 days against 30–45 for conventional investment loans.",
      "Business-purpose only. Not available on a primary residence.",
    ],
    restrictions: verified("Publishes coverage across 40 markets including Washington, D.C.", "Lendmire DSCR guide, updated September 2026", READ),
    notes: [
      "A broker rather than a direct lender, which cuts both ways: wider access to programs, and one more party in the transaction.",
      "Publishes that investment-property equity lines require a 700 minimum score, cap near 70% combined LTV, and cap the line near $500,000 in that tier.",
    ],
  },

  /* ---------------- Crypto-backed ---------------- */
  {
    id: "ledn", name: "Ledn",
    url: "https://www.ledn.io/post/bitcoin-loan-rates",
    categories: ["crypto"],
    what: "Bitcoin-backed dollar loans, with collateral held in custody and contractually not lent out.",
    identifiers: ["SOC 2, per the company's published standards page"],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not stated on the pages read."),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search for the company name"),
    rates: verified("9.25%–11.49% APR. The rate starts at 11.49% and falls with loan size to 9.25%.", "Ledn, 'Bitcoin Loan Rates in 2026'", READ),
    maxAdvance: verified("50% loan-to-value.", "Ledn Help Center, Loans", READ),
    terms: verified("Standard 12-month term, flexible repayment, no prepayment penalty. Interest accrues daily and is due when the loan closes.", "Ledn Help Center, Loans", READ),
    loanSize: verified("Minimum loan $500; a client must hold at least $1,000 equivalent in BTC to apply.", "Ledn Help Center, Loans", READ),
    underwriting: [
      "No credit check. The collateral is the underwriting.",
      "Collateral held in cold storage with BitGo Trust, ring-fenced from Ledn's funding partners.",
      "Neither Ledn, its institutional partner, nor any financing vehicle has the right to lend the collateral out.",
      "Monthly Proof-of-Reserves attestations published.",
      "Liquidation alerts fire at 70% and 75% LTV; automatic partial liquidation begins at 80% LTV.",
      "A 2% origination fee applies — but NOT to clients resident in the United States or Canada.",
    ],
    restrictions: notVerified("State-level availability not confirmed.", CHECK_CONTACT),
    notes: [
      "Over $2.8 billion in total originations since inception, per third-party research (Spark, June 2026).",
      "Tether made a strategic investment in Ledn in 2026 — relevant to anyone weighing counterparty concentration.",
    ],
  },
  {
    id: "arch", name: "Arch Lending (ChainFi, Inc.)",
    url: "https://archlending.com/crypto-loans/",
    categories: ["crypto"],
    what: "Crypto-backed USD and USDC loans against BTC, ETH, SOL, XRP and tokenised gold, with third-party qualified custody.",
    identifiers: ["NMLS #2637200"],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not stated on the page read."),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search for the company name"),
    rates: verified("From 7.25% APR.", "Arch Lending crypto loans page", READ),
    maxAdvance: verified("Up to 60% LTV.", "Arch Lending crypto loans page", READ),
    terms: notVerified("Not stated numerically on the page read.", CHECK_CONTACT),
    loanSize: notVerified("Not stated on the page read.", CHECK_CONTACT),
    underwriting: [
      "Collateral custodied by Anchorage Digital, a qualified custodian, with zero rehypothecation.",
      "Eligible collateral: BTC, ETH, SOL, XRP, PAXG and XAUT.",
      "Proceeds available as USD or USDC.",
    ],
    restrictions: verified("Not available to US residents of CA, DE, HI, MS, MT, NV, ND, RI, SC or VT.", "Arch Lending site footer disclosure", READ),
    notes: ["States plainly on its own site that it is not a bank. The exclusion list above is unusually long — check your state before spending time on an application."],
  },
  {
    id: "salt", name: "SALT Lending",
    url: "https://saltlending.com/how-no-credit-check-bitcoin-loans-work-in-2026",
    categories: ["crypto"],
    what: "Crypto-backed loans with the longest terms in the consumer category.",
    identifiers: [],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not confirmed."),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search for the company name"),
    rates: verified("Around 14.5% APR, per third-party comparison.", "Ledn, 'The 8 Best Crypto Loan Platforms in the USA', July 2026", READ),
    maxAdvance: verified("Up to 70% LTV.", "SALT, 'How No Credit Check Bitcoin Loans Work in 2026', 21 August 2026", READ),
    terms: verified("1, 3 and 5 year terms — unusual in a category where most lenders stop at one or two years.", "SALT, August 2026", READ),
    loanSize: notVerified("Not stated on the page read.", CHECK_CONTACT),
    underwriting: [
      "Underwritten on collateral value, not credit history.",
      "Collateral moves to a qualified custodian for the life of the loan; the borrower retains ownership and it is not rehypothecated or lent out.",
      "Funding typically one to two business days after approval and collateral confirmation.",
      "Not every token is eligible, and eligibility affects the terms offered.",
      "Proceeds usable for essentially any personal or business purpose — which is what makes this a real-estate route.",
    ],
    restrictions: notVerified("Not confirmed.", CHECK_CONTACT),
    notes: ["The highest published LTV of the custodial lenders here at 70%, and the highest rate of the three. Those two facts are the same fact."],
  },
  {
    id: "unchained", name: "Unchained",
    url: "https://unchained.com",
    categories: ["crypto"],
    what: "Bitcoin-backed loans for high-net-worth borrowers, using collaborative multisig custody rather than handing the coins over.",
    identifiers: [],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not confirmed."),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search for the company name"),
    rates: verified("Around 16.6% APR, per third-party comparison.", "Ledn, 'The 8 Best Crypto Loan Platforms in the USA', July 2026", READ),
    maxAdvance: verified("40% to 50% LTV.", "Spark, 'Bitcoin-Backed Loans in 2026', 17 June 2026", READ),
    terms: verified("3 to 60 months, denominated in USD.", "Spark, June 2026", READ),
    loanSize: verified("Minimum $150,000.", "Ledn comparison, July 2026", READ),
    underwriting: [
      "Collateral sits in a 2-of-3 multisig vault: the borrower holds one key, Unchained holds one, a third-party key agent holds the third.",
      "The structure means Unchained physically cannot rehypothecate the collateral — it does not hold enough keys to move it alone.",
      "Margin call warnings issue when the BTC price falls below the collateral-to-principal threshold.",
    ],
    restrictions: notVerified("Not confirmed.", CHECK_CONTACT),
    notes: [
      "The most expensive rate of the custodial alternatives, and the only one where counterparty failure does not put the collateral at risk. For a large holder that trade is often worth it.",
      "The $150,000 minimum rules this out for most borrowers.",
    ],
  },
  {
    id: "coinbase-borrow", name: "Coinbase Borrow",
    url: "https://www.coinbase.com",
    categories: ["crypto"],
    what: "BTC-backed USDC loans for existing Coinbase users, routed through the Morpho lending market.",
    identifiers: [],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not confirmed."),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search"),
    rates: verified("Variable, set by Morpho market conditions; quoted at around 8% in a July 2026 comparison.", "Ledn comparison, July 2026", READ),
    maxAdvance: verified("Up to 40% LTV.", "Ledn, 'Bitcoin Loan Rates in 2026'", READ),
    terms: verified("Open term.", "Ledn, 'Bitcoin Loan Rates in 2026'", READ),
    loanSize: verified("Up to $100,000.", "Ledn comparison, July 2026", READ),
    underwriting: ["No credit check.", "Proceeds issued in USDC rather than dollars, which means a conversion step before the money can buy property."],
    restrictions: verified("Not available in New York.", "Ledn comparison, July 2026", READ),
    notes: ["The rate is variable and set by an external market, so it can move against you mid-loan in a way a fixed-rate crypto loan cannot."],
  },
  {
    id: "youhodler", name: "YouHodler",
    url: "https://www.youhodler.com",
    categories: ["crypto"],
    what: "High-LTV short-duration crypto loans.",
    identifiers: [],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not confirmed."),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search"),
    rates: verified("Up to 27%.", "Ledn, 'Bitcoin Loan Rates in 2026'", READ),
    maxAdvance: verified("Up to 90% LTV.", "Ledn, 'Bitcoin Loan Rates in 2026'", READ),
    terms: verified("30, 60 or 180 days.", "Ledn, 'Bitcoin Loan Rates in 2026'", READ),
    loanSize: notVerified("Not confirmed.", CHECK_CONTACT),
    underwriting: ["Collateral IS lent out, per the comparison table — the only lender in this set where that is published as true."],
    restrictions: notVerified("Not confirmed.", CHECK_CONTACT),
    notes: [
      "Listed for completeness and as a contrast, not as a suggestion. 90% LTV on an asset that has repeatedly fallen 50% in a quarter is a liquidation waiting for a date, and the collateral being rehypothecated adds counterparty risk on top of price risk.",
    ],
  },

  /* ---------------- Equity sharing ---------------- */
  {
    id: "hometap", name: "Hometap",
    url: "https://www.hometap.com/blog/what-is-home-equity-sharing",
    categories: ["equity-share"],
    what: "Home equity investment on a share-of-total-value basis.",
    identifiers: [],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not confirmed."),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search"),
    rates: verified("Not expressed as a rate. Settlement is an agreed percentage of the home's total value at the end.", "Hometap, 'Does a Home Equity Investment Make Sense For You?', 9 July 2026", READ),
    maxAdvance: notVerified("Not confirmed.", CHECK_CONTACT),
    terms: verified("Around a ten-year term, per a competitor's published comparison.", "Unison vs Hometap comparison, 4 September 2026", READ),
    loanSize: notVerified("Not confirmed.", CHECK_CONTACT),
    underwriting: [
      "Income and credit requirements looser than a loan's, because the company buys an interest rather than underwriting repayment.",
      "No monthly payments and no interest.",
      "Settles on sale, at the end of the term, or on buyout.",
      "Renovation adjustment applies only to improvements adding $10,000 or more, as determined by an independent appraiser.",
    ],
    restrictions: notVerified("Investment-property eligibility not confirmed — confirm before anything else if the property is a rental.", CHECK_CONTACT),
    notes: ["Share-of-TOTAL-value. On a flat house you can owe substantially more than you received. This is the single most misunderstood term in the category."],
  },
  {
    id: "unison", name: "Unison",
    url: "https://www.unison.com/how-it-works",
    categories: ["equity-share"],
    what: "Equity Sharing Agreement on the change in the home's value rather than its total value.",
    identifiers: [],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: verified(2006, "Unison corporate statement — 'investing in homes since 2006' — Business Wire, 30 June 2026", READ),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search"),
    rates: verified("Not a rate. The company shares in the change in the home's value; where the home falls, it shares the loss.", "Unison, 'How It Works'", READ),
    maxAdvance: verified("Converts up to 15% of the home's value to cash.", "Unison, 'How It Works'", READ),
    terms: verified("Up to 30 years.", "Unison, 'How It Works'", READ),
    loanSize: notVerified("Not confirmed.", CHECK_CONTACT),
    underwriting: [
      "No added debt, no monthly payments and no interest.",
      "Capital Improvement Adjustment is value-based with no minimum, unlike competitors that require a $10,000 threshold.",
      "Settles when the home is sold, or up to thirty years later.",
    ],
    restrictions: notVerified("Investment-property eligibility not confirmed.", CHECK_CONTACT),
    notes: [
      "$1.76 billion in residential equity agreements across more than 10,500 homeowners, per the company, June 2026.",
      "Prime-credit customer base with an average home value above $500,000, per the company.",
      "Share-of-CHANGE rather than share-of-total is the structural difference that matters most in this category.",
    ],
  },
  {
    id: "unlock", name: "Unlock",
    url: "https://www.unlock.com/learn/article/a-guide-to-home-equity-investments",
    categories: ["equity-share"],
    what: "Home equity investment on a share-of-total-value basis.",
    identifiers: [],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: notVerified("Not confirmed.", CHECK_CONTACT),
    founded: notVerified<number>("Not confirmed."),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search"),
    rates: verified("Not a rate — an equity finance contract, settled on a percentage of value.", "Unlock, 'A Guide to Home Equity Investments', 18 August 2026", READ),
    maxAdvance: notVerified("Not confirmed.", CHECK_CONTACT),
    terms: notVerified("Not confirmed.", CHECK_CONTACT),
    loanSize: notVerified("Not confirmed.", CHECK_CONTACT),
    underwriting: ["Structured as an equity finance contract, not a loan.", "Settled at term end, on sale, or by buyout with savings, a home equity loan, or a cash-out refinance."],
    restrictions: notVerified("Not confirmed.", CHECK_CONTACT),
    notes: ["Share-of-total-value model, with the same structural caution as Hometap."],
  },
  {
    id: "truehold", name: "Truehold",
    url: "https://www.truehold.com/",
    categories: ["sale-leaseback"],
    what: "Sell-and-rent-back for single-family homes: buys the home, then leases it back to the former owner.",
    identifiers: [],
    phone: notVerified("Not confirmed.", CHECK_CONTACT),
    address: verified("New York City, New York.", "Company profile data", READ),
    founded: verified(2004, "Company profile data", READ),
    bbbRating: notVerified("Not confirmed.", "bbb.org"),
    googleReviews: notVerified<{ count: number; rating: number }>("Not confirmed.", "a Google search"),
    rates: notVerified("Not a rate. The cost is the whole of future appreciation, plus rent."),
    maxAdvance: verified("The full equity, since the property is sold outright.", "Company description", READ),
    terms: notVerified("Lease terms not confirmed — and the lease, not the price, is the deal.", CHECK_CONTACT),
    loanSize: notVerified("Not applicable."),
    underwriting: ["Purchases the home from the owner, who then signs a lease on the same property and is bound by its terms."],
    restrictions: notVerified("Not confirmed.", CHECK_CONTACT),
    notes: ["Not a loan. The owner becomes a tenant, the sale is a taxable event, and there is generally no route back to ownership."],
  },

  /* ---------------- Public and mission ---------------- */
  {
    id: "cdfi-fund", name: "US Treasury CDFI Fund (directory, not a lender)",
    url: "https://www.cdfifund.gov/",
    categories: ["cdfi"],
    what: "The federal certification body. Publishes the authoritative list of certified Community Development Financial Institutions and the areas they serve.",
    identifiers: ["US Department of the Treasury"],
    phone: notVerified("Not confirmed.", "cdfifund.gov contact page"),
    address: notVerified("Not confirmed.", "cdfifund.gov contact page"),
    founded: notVerified<number>("Not confirmed."),
    bbbRating: notVerified("Not applicable — a federal programme office."),
    googleReviews: notVerified<{ count: number; rating: number }>("Not applicable."),
    rates: notVerified("Not a lender. Individual CDFIs set their own, frequently below market."),
    maxAdvance: notVerified("Varies by institution."),
    terms: notVerified("Varies by institution."),
    loanSize: notVerified("Typically small-balance, which is the range conventional lending finds uneconomic."),
    underwriting: [
      "Certification is a checkable fact. Start here rather than with a broker who claims it.",
      "Individual CDFIs weigh community impact alongside credit, so a deal that fails a bank's box can still work.",
    ],
    restrictions: verified("Each certified institution lends only within its own defined service area.", "CDFI Fund programme structure", READ),
    notes: ["Use the Fund's own searchable list to find which certified institutions lend in a given market. A claim of CDFI status is not the same as certification, and the Fund's list settles it."],
  },
  {
    id: "sba", name: "US Small Business Administration (guarantor, not a lender)",
    url: "https://www.sba.gov/funding-programs/loans",
    categories: ["sba"],
    what: "Guarantees 504 and 7(a) loans made by participating lenders for owner-occupied commercial property and business purposes.",
    identifiers: ["US Small Business Administration"],
    phone: notVerified("Not confirmed.", "sba.gov contact page"),
    address: notVerified("Not confirmed.", "sba.gov contact page"),
    founded: notVerified<number>("Not relevant — a federal agency, not a company."),
    bbbRating: notVerified("Not applicable — a federal agency."),
    googleReviews: notVerified<{ count: number; rating: number }>("Not applicable."),
    rates: notVerified("Set by the participating lender within SBA caps; the 504 second carries a long-dated fixed rate.", "sba.gov programme pages"),
    maxAdvance: notVerified("Down payments far below conventional commercial lending; confirm the current figure on the programme page.", "sba.gov"),
    terms: notVerified("Long amortisation; confirm per programme.", "sba.gov"),
    loanSize: notVerified("Confirm per programme.", "sba.gov"),
    underwriting: [
      "Owner-occupancy is a hard gate: the business must occupy a defined majority of the space. Confirm the percentage before spending anything on an application.",
      "504 pairs a bank first mortgage with a Certified Development Company second, for long-term fixed assets.",
      "7(a) is broader and can include working capital alongside real estate.",
      "Personal guarantees are generally required.",
    ],
    restrictions: verified("Cannot be used for a pure investment property. Owner-occupancy is required.", "SBA programme structure", READ),
    notes: ["Loans are made by participating lenders, not by the SBA itself. The SBA publishes a lender match service."],
  },
] as const;

export const LENDER_COUNT = LENDERS.length;

export function lender(id: string): Lender | undefined {
  return LENDERS.find((l) => l.id === id);
}

export function lendersFor(ids: readonly string[]): Lender[] {
  return ids.map((id) => lender(id)).filter((l): l is Lender => Boolean(l));
}

/**
 * How complete a record is, as a fraction of the fields a client actually
 * wants before calling. Surfaced on the page so the gap is visible rather
 * than looking like the whole truth.
 */
export function completeness(l: Lender): { known: number; total: number; missing: string[] } {
  const fields: Array<[string, { verified: boolean }]> = [
    ["phone", l.phone], ["address", l.address], ["founded", l.founded],
    ["BBB rating", l.bbbRating], ["Google reviews", l.googleReviews],
    ["rates", l.rates], ["max advance", l.maxAdvance], ["terms", l.terms],
    ["loan size", l.loanSize], ["state restrictions", l.restrictions],
  ];
  const missing = fields.filter(([, v]) => !v.verified).map(([name]) => name);
  return { known: fields.length - missing.length, total: fields.length, missing };
}
