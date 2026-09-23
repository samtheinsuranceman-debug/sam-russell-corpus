// ============================================================
// LIQUIDITY WITHOUT THE BANK — routes to cash against property and other
// assets that do not run through a retail bank HELOC.
//
// WHY THIS PAGE EXISTS. An investor building a portfolio hits the same wall
// twice: the bank caps financed properties (conventional programs typically
// stop at ten), and a HELOC on an investment property is underwritten on
// personal income and credit rather than on the asset. Everything below is a
// legal, documented route that sidesteps one or both of those constraints.
//
// WHAT THIS IS NOT. Not a recommendation, not a solicitation, and not a
// referral arrangement — this firm receives nothing from any company named
// here. Several of these routes are genuinely expensive or genuinely
// dangerous, and the ones that are say so in `weaknesses` before they say
// anything else. Two of them (sale-leaseback, shared appreciation) convert an
// owner into a tenant or a minority holder and are listed because they exist
// and get sold hard, not because they are usually right.
//
// SOURCING. Every company named was found in a live search of its own
// published material and is recorded with the URL that described it. Where a
// term is quoted it is the company's own published term with the date it was
// read. NO PHONE NUMBERS ARE RECORDED HERE: a number that cannot be verified
// is worse than no number, and every company below publishes current contact
// details on the site listed. Terms move constantly — `asOf` is the date the
// description was read, and anything past it must be re-checked.
// ============================================================

export type RouteFamily =
  | "asset-based-lending"
  | "equity-sharing"
  | "policy-and-portfolio"
  | "private-and-relationship"
  | "structural";

export type Collateral = "the property" | "a portfolio of properties" | "a life policy" | "securities" | "a note receivable" | "the business" | "none — sold outright";

export type Provider = {
  name: string;
  /** The company's own site. Verified present in a live search. */
  url: string;
  /** What it actually does, from its own material. */
  note: string;
  /** Regulatory identifier where the company publishes one. */
  identifier?: string;
};

export type LiquidityRoute = {
  id: string;
  n: number;
  name: string;
  family: RouteFamily;
  collateral: Collateral;
  /** One sentence: what actually happens. */
  mechanism: string;
  /** How the money reaches them, step by step. */
  howItWorks: readonly string[];
  strengths: readonly string[];
  /** Always populated. A route with no stated weakness has not been thought about. */
  weaknesses: readonly string[];
  /** Who this genuinely suits. */
  bestFor: string;
  /** Who should not do this. Stated as plainly as bestFor. */
  wrongFor: string;
  /** Typical cost, where a range is published. Null where it is not, rather than invented. */
  typicalCost: string | null;
  /** Speed to funding, where published. */
  typicalSpeed: string | null;
  providers: readonly Provider[];
  /** The question to ask before signing. */
  diligence: string;
  /** Date the descriptions here were read from source. */
  asOf: string;
};

const ASOF = "2026-09-17";

export const LIQUIDITY_ROUTES: readonly LiquidityRoute[] = [
  {
    id: "dscr-cash-out", n: 1, name: "DSCR cash-out refinance", family: "asset-based-lending",
    collateral: "the property",
    mechanism: "A new first mortgage on the rental, underwritten on the property's rent rather than on your income, with the difference between the new loan and the old one paid to you in cash.",
    howItWorks: [
      "The lender computes the debt service coverage ratio: gross monthly rent divided by principal, interest, taxes, insurance and association dues (PITIA).",
      "A ratio of 1.00 breaks even; most programs want 1.20 to 1.25, meaning the rent exceeds the payment by 20 to 25 percent.",
      "No tax returns, no W-2s, no employment verification, and no debt-to-income test on you personally.",
      "The new loan pays off the existing one; the remainder is wired to you and is not taxable, because a loan is not income.",
    ],
    strengths: [
      "Your personal income is irrelevant, which is the entire point for a self-employed investor whose returns understate real cash flow.",
      "No cap on the number of financed properties, where conventional programs typically stop at ten.",
      "The loan can be held in an LLC, which conventional financing generally will not allow.",
      "Short-term rental income qualifies at most lenders, typically counted at 75 to 80 percent of gross.",
      "Interest-only and 40-year terms are available at several lenders, which lifts the coverage ratio.",
    ],
    weaknesses: [
      "Cash-out is usually capped near 75 percent loan-to-value, below the 80 percent available on a purchase.",
      "The rate carries a premium over conventional, because the loan is non-QM and prices in the secondary market accordingly.",
      "It refinances the whole loan. If the existing note carries a low legacy rate, you surrender it to reach the equity — often the single largest hidden cost, and the one nobody quotes.",
      "Business purpose only. It cannot be used on a primary residence.",
      "Prepayment penalties are common on DSCR paper even where the lender advertises none on some programs.",
    ],
    bestFor: "An investor with rented, cash-flowing property and a current mortgage rate at or above today's market, who wants to recycle equity into the next acquisition.",
    wrongFor: "Anyone holding a sub-4 percent legacy mortgage. Doing this to reach equity destroys more value than the equity is worth; a second-position product is the right tool.",
    typicalCost: "Rate premium over conventional investor pricing; two to three points of origination is common. Confirm the actual quote in writing.",
    typicalSpeed: "As fast as fifteen days at some lenders, against thirty to forty-five for conventional investment loans.",
    providers: [
      { name: "Ternus", url: "https://www.ternus.com/loan-programs/long-term-rental-loans", note: "Publishes 1–4 unit residential investor loans across 39 states, up to 80% LTV on purchase and rate-and-term, up to 75% on cash-out, 650 minimum credit score, 30-year fixed and 5/1 and 7/1 ARMs, interest-only option." },
      { name: "Visio Lending", url: "https://www.visiolending.com", note: "DSCR specialist named by CNBC Select among investment property lenders in September 2026, cited there for lower-than-average rates and fees and an A+ Better Business Bureau rating." },
      { name: "Lendmire", url: "https://www.lendmire.com/loanoptions/dscr-investor-loans", note: "Broker working multiple non-QM wholesale DSCR lenders across single-family, 1–10 unit, condo and short-term rental; publishes a DSCR calculator.", identifier: "NMLS #2371349" },
    ],
    diligence: "Ask for the prepayment penalty schedule in writing before the appraisal is ordered, and ask what rate you are giving up on the existing note. Those two numbers decide whether this is worth doing.",
    asOf: ASOF,
  },
  {
    id: "dscr-second", n: 2, name: "Second-position investor loan", family: "asset-based-lending",
    collateral: "the property",
    mechanism: "A standalone second mortgage or equity line behind the existing first, so a low legacy rate on the first is left untouched.",
    howItWorks: [
      "The lender sizes the line on combined loan-to-value across both loans, occupancy and credit — not on the property's coverage ratio.",
      "The first mortgage stays exactly where it is, at its original rate and term.",
      "Investment-property lines are underwritten more tightly than owner-occupied: a published tier requires a 700 minimum score, caps combined LTV near 70 percent, and caps the line near $500,000.",
    ],
    strengths: [
      "Preserves a legacy first mortgage, which on a sub-4 percent note is usually worth more than the rate difference on the second.",
      "A line rather than a lump sum: you pay interest only on what is drawn.",
      "Faster and cheaper to close than a full refinance.",
    ],
    weaknesses: [
      "Investment-property tiers demand higher credit and give lower combined LTV than owner-occupied equivalents.",
      "Almost always a floating rate, so the cost moves against you when rates rise — exactly when a portfolio is already under pressure.",
      "The line can be frozen or reduced by the lender, which is what happened broadly in 2008 and 2020.",
      "Second-position paper is scarcer on non-owner-occupied property, and the pricing reflects that.",
    ],
    bestFor: "An investor with a cheap first mortgage and real equity, who needs flexible, revolving access rather than a one-time lump.",
    wrongFor: "Anyone who would draw it to the cap and treat it as permanent capital. A callable line is not permanent capital.",
    typicalCost: "Floating, priced over an index; expect a meaningful margin on non-owner-occupied.",
    typicalSpeed: null,
    providers: [
      { name: "Lendmire", url: "https://www.lendmire.com/dscr-loan-vs-heloc-for-investment-property", note: "Publishes a combined-LTV calculator for investment-property equity lines with tiered credit bands, and states the investment-property minimum score and line cap." },
    ],
    diligence: "Ask specifically what triggers a freeze or a reduction of the line, and get the answer in the agreement rather than from the salesperson.",
    asOf: ASOF,
  },
  {
    id: "blanket-portfolio", n: 3, name: "Blanket or portfolio loan", family: "asset-based-lending",
    collateral: "a portfolio of properties",
    mechanism: "One loan secured by several properties at once, sized on the portfolio's combined value and combined rent rather than on any single door.",
    howItWorks: [
      "Several rentals are cross-collateralised under a single note, usually inside an LLC.",
      "Equity trapped in properties that are individually too small to finance economically becomes borrowable in aggregate.",
      "Release provisions govern whether and how an individual property can be sold out from under the blanket.",
    ],
    strengths: [
      "One closing, one set of costs, one payment, instead of five of each.",
      "Unlocks equity in small-balance properties that no lender will write a standalone loan against.",
      "Scales past the conventional ten-property ceiling.",
    ],
    weaknesses: [
      "Cross-collateralisation is the whole risk: a default on the blanket puts every property in it at risk, not just the one that failed.",
      "Selling one property requires a release, and the release price is set by the lender, not by you.",
      "Balloon maturities are common, which means refinancing risk on a date you do not control.",
    ],
    bestFor: "An investor with five or more doors, real aggregate equity, and no intention of selling individual properties in the near term.",
    wrongFor: "Anyone who expects to trade in and out of properties, or who cannot survive a balloon arriving in a bad credit market.",
    typicalCost: null,
    typicalSpeed: null,
    providers: [
      { name: "Visio Lending", url: "https://www.visiolending.com", note: "Publishes single-family rental portfolio financing alongside its DSCR programs." },
    ],
    diligence: "Read the release provision before anything else. If you cannot sell one property without the lender's discretion, you do not control your own portfolio.",
    asOf: ASOF,
  },
  {
    id: "private-hard-money", n: 4, name: "Private and hard money lending", family: "private-and-relationship",
    collateral: "the property",
    mechanism: "A short-term loan from a private lender or fund, underwritten almost entirely on the asset and the exit, priced for speed.",
    howItWorks: [
      "The lender looks at the property's value and at how you will repay — a sale, a refinance, or a lease-up — and largely ignores income documentation and rental strategy.",
      "Terms run months rather than decades; interest is frequently paid monthly with the principal due at maturity.",
      "Funding can be days, because there is no agency underwriting queue.",
    ],
    strengths: [
      "The fastest money available against real property, and often the only money available on a property that does not yet cash flow.",
      "Underwrites the deal, not the borrower.",
      "Terms are genuinely negotiable, because you are dealing with the decision-maker.",
    ],
    weaknesses: [
      "By far the most expensive route on this list, and the cost compounds if the exit slips.",
      "A short maturity is an exit deadline. If the refinance is not ready, the property is.",
      "Documentation quality varies enormously; some paper carries terms that would not survive a bank's compliance review.",
      "Default provisions can be aggressive, and a private lender can foreclose faster than an institution with a reputation to manage.",
    ],
    bestFor: "A bridge with a defined, already-underwritten exit — a property under contract to sell, or one with a DSCR refinance already approved.",
    wrongFor: "Anyone using it as permanent financing, or anyone whose exit is a plan rather than a commitment.",
    typicalCost: "Materially above institutional rates, plus points. Assume it is the most expensive option and require the deal to work anyway.",
    typicalSpeed: "Days.",
    providers: [],
    diligence: "Write the exit down with a date and a named counterparty before you sign. A bridge without a landing is a fall.",
    asOf: ASOF,
  },
  {
    id: "home-equity-investment", n: 5, name: "Home equity investment / shared appreciation", family: "equity-sharing",
    collateral: "the property",
    mechanism: "A company pays you a lump sum today in exchange for a share of the home's future value or future appreciation. It is a contract, not a loan: there are no monthly payments and no interest.",
    howItWorks: [
      "Two distinct models, and the difference is the whole decision.",
      "SHARE OF TOTAL VALUE (Hometap, Unlock): at settlement the company takes an agreed percentage of the home's entire value at that moment, not of the growth.",
      "SHARE OF CHANGE IN VALUE (Unison): the company shares only in the change in value; where the home falls, the company shares the loss.",
      "Settlement happens on sale, at the end of the term, or when you buy the stake out — with savings, a home equity loan, or a cash-out refinance.",
      "Terms published: Hometap around ten years; Unison up to thirty years, converting up to 15 percent of value to cash.",
    ],
    strengths: [
      "No monthly payment and no interest, so it does not touch cash flow or the coverage ratio on any other loan.",
      "Income and credit requirements are looser than a loan's, because the company is buying an interest rather than underwriting repayment.",
      "On a share-of-change structure, a falling market reduces what you owe — genuine downside sharing that no loan offers.",
      "Capital improvement adjustments exist at several providers, so renovations you pay for are not handed over as appreciation.",
    ],
    weaknesses: [
      "On a share-of-TOTAL-value structure you can owe substantially more than you received even when the home barely moved, because the share applies to the whole house rather than to the growth. This is the single most misunderstood term in the category.",
      "In a strongly appreciating market the effective cost can exceed any mortgage rate by a wide margin, and it is not expressed as a rate, which is why it does not feel like it.",
      "You are committing a share of the asset for up to thirty years; the buyout is at the company's formula, not yours.",
      "Investment-property eligibility varies and is often restricted to primary residences — confirm before anything else.",
    ],
    bestFor: "An owner with real equity, weak documentable income, and a need for cash that must not create a monthly payment.",
    wrongFor: "Anyone who can qualify for ordinary debt and expects the property to appreciate. In that case this is far more expensive than a loan and does not look it.",
    typicalCost: "Not expressed as a rate. Model the dollar settlement at several future values before signing — it is the only way to see the real cost.",
    typicalSpeed: null,
    providers: [
      { name: "Hometap", url: "https://www.hometap.com/blog/what-is-home-equity-sharing", note: "Share-of-total-value model. Publishes a renovation adjustment applying to improvements adding $10,000 or more as determined by an independent appraiser." },
      { name: "Unison", url: "https://www.unison.com/how-it-works", note: "Equity Sharing Agreement on the change in value rather than total value; up to 30-year term; converts up to 15% of value to cash. States $1.76bn across more than 10,500 homeowners, investing since 2006." },
      { name: "Unlock", url: "https://www.unlock.com/learn/article/a-guide-to-home-equity-investments", note: "Share-of-total-value model; publishes its own guide to how home equity investments are structured as equity finance contracts rather than loans." },
      { name: "Point", url: "https://point.com", note: "Home equity investment provider in the same category. Confirm current model and terms directly." },
    ],
    diligence: "Ask one question: does your share apply to the whole value of the home, or only to the change in value? Then model the settlement at minus 15 percent, flat, and plus 25 percent before signing anything.",
    asOf: ASOF,
  },
  {
    id: "sale-leaseback", n: 6, name: "Residential sale-leaseback", family: "equity-sharing",
    collateral: "none — sold outright",
    mechanism: "You sell the property outright to a company and immediately lease it back, staying in place as a tenant with all of the equity converted to cash.",
    howItWorks: [
      "The company buys the home and simultaneously signs a lease with you as tenant.",
      "You receive the sale proceeds — the full equity, not a percentage of it.",
      "You become a renter in a property you formerly owned, subject to the lease terms.",
    ],
    strengths: [
      "Converts one hundred percent of the equity to cash, which no loan and no equity-sharing agreement does.",
      "No debt, no monthly loan payment, no qualification on income or credit in the ordinary sense.",
      "You stay in the property.",
    ],
    weaknesses: [
      "You are no longer the owner. All future appreciation belongs to the buyer, permanently.",
      "You are a tenant, and tenants can face renewal terms they do not control and rent increases they did not agree to at the outset.",
      "The sale is a taxable event. The capital gain is realised now, and any primary-residence exclusion is consumed.",
      "This is generally the most irreversible option here. There is usually no path back to ownership.",
    ],
    bestFor: "An owner with heavy equity, no viable income to support debt, and a genuine need to stay in the property — most often an older owner.",
    wrongFor: "Almost any investor. Selling the asset to reach its equity is the opposite of building a portfolio.",
    typicalCost: "The whole of future appreciation, plus rent. Price it that way.",
    typicalSpeed: null,
    providers: [
      { name: "Truehold", url: "https://www.truehold.com/", note: "Sell-and-rent-back programs for single-family homes; purchases homes from owners who then lease the same property. Founded 2004, New York." },
      { name: "EasyKnock", url: "https://www.easyknock.com", note: "Residential sale-leaseback provider in the same category. Confirm current programs and state availability directly." },
    ],
    diligence: "Get the lease — the whole lease, including renewal and rent-escalation terms — before agreeing any price. The price is not the deal; the lease is.",
    asOf: ASOF,
  },
  {
    id: "policy-loan", n: 7, name: "Life insurance policy loan", family: "policy-and-portfolio",
    collateral: "a life policy",
    mechanism: "The insurer lends you money from its general account with your policy's cash value as collateral. The cash value itself is not withdrawn and keeps earning.",
    howItWorks: [
      "You are not borrowing your own money and not paying yourself interest, despite how it is often sold. The insurer lends from its general investment account and holds your cash value as security.",
      "DIRECT RECOGNITION: the carrier credits a different dividend rate on the borrowed portion.",
      "NON-DIRECT RECOGNITION: the carrier credits the same dividend rate whether or not a loan is outstanding — but typically sets its loan rate to compensate, so the advantage is narrower than it is presented.",
      "No credit check, no underwriting, no approval. The money is contractually available.",
    ],
    strengths: [
      "No qualification of any kind. The policy is the approval.",
      "No fixed repayment schedule; you choose when and whether to repay.",
      "The cash value continues to earn, which is the structural advantage over simply withdrawing it.",
      "Fast, private, and reported nowhere.",
    ],
    weaknesses: [
      "Only available if a funded permanent policy already exists. This is a route for someone who planned years ago, not a route to cash this month.",
      "Unpaid interest capitalises. A loan left long enough can consume the policy, and a lapsed policy with an outstanding loan triggers a taxable event on gain the owner never received in cash.",
      "It reduces the death benefit dollar for dollar until repaid.",
      "The direct versus non-direct distinction is marketed far harder than it pays; compare the loan rate alongside the dividend treatment, not instead of it.",
    ],
    bestFor: "An owner of a long-funded permanent policy who wants fast, unreported, unqualified liquidity and understands the lapse risk.",
    wrongFor: "Anyone who would rely on never repaying it, and anyone whose policy is young and thinly funded.",
    typicalCost: "The carrier's contractual loan rate, which varies by policy and by carrier. Read it in the contract, not in an illustration.",
    typicalSpeed: "Days.",
    providers: [
      { name: "Your existing carrier", url: "https://www.northwesternmutual.com/life-and-money/borrowing-against-life-insurance", note: "Policy loans are available on any policy that accumulates cash value; the carrier that issued the policy is the lender. Linked material explains the mechanics and that interest is still paid." },
    ],
    diligence: "Ask the carrier for an in-force illustration showing the policy with the loan outstanding and unpaid for twenty years. If it lapses on that illustration, the plan needs a repayment schedule.",
    asOf: ASOF,
  },
  {
    id: "cvloc", n: 8, name: "Cash value line of credit from a third party", family: "policy-and-portfolio",
    collateral: "a life policy",
    mechanism: "A bank, not the insurer, lends against the policy's cash value through an assignment — leaving the policy's own crediting entirely undisturbed.",
    howItWorks: [
      "A third-party lender takes a collateral assignment of the policy and extends a line of credit against the cash value.",
      "Because the insurer has not made the loan, no direct-recognition adjustment applies at all — the full dividend or credit continues on the entire cash value.",
      "This is the structure sometimes described as synthetic non-direct recognition.",
    ],
    strengths: [
      "Preserves the policy's full crediting, which a carrier loan on a direct-recognition contract does not.",
      "Rates are often lower than the carrier's own contractual loan rate.",
      "Revolving, so you draw and repay as needed.",
    ],
    weaknesses: [
      "A floating rate, unlike most carrier loan rates, so the cost moves with the market.",
      "A third-party lender can call or reduce the line; the insurer, on its own contractual loan, generally cannot.",
      "Requires a lender that writes this product, and the market for it is narrow.",
      "Adds a counterparty and an assignment to what was a simple contract.",
    ],
    bestFor: "A holder of a substantial direct-recognition policy who wants to borrow without giving up crediting on the borrowed portion.",
    wrongFor: "Anyone who needs the certainty of a fixed, non-callable rate, which is precisely what a carrier loan offers.",
    typicalCost: "Floating, priced over an index. Shop it; the spread between providers on this product is wide.",
    typicalSpeed: null,
    providers: [
      { name: "Specialist banks via a broker", url: "https://bankingtruths.com/direct-vs-non-direct-recognition-life-insurance", note: "Explains the direct versus non-direct recognition distinction and the cash value line of credit as an alternative that preserves full crediting. Confirm the current lender roster directly; this market is narrow and moves." },
    ],
    diligence: "Ask what happens to the line in a rate spike and who may call it. That is the difference between this and a carrier loan.",
    asOf: ASOF,
  },
  {
    id: "securities-based", n: 9, name: "Securities-based line of credit", family: "policy-and-portfolio",
    collateral: "securities",
    mechanism: "A line of credit secured by a taxable brokerage portfolio, so the shares are never sold and no capital gain is realised.",
    howItWorks: [
      "The brokerage or an affiliated bank lends against the marketable value of the account at an advance rate that depends on what is held.",
      "A non-purpose line may not be used to buy more securities; that restriction is what distinguishes it from a margin loan.",
      "Proceeds can generally be used for real estate, which is the point here.",
    ],
    strengths: [
      "No capital gains tax, because nothing is sold. On a low-basis position this alone can exceed the entire cost of the loan.",
      "Rates are typically well below unsecured borrowing and often below hard money.",
      "Fast to set up and fast to draw once in place, with no property appraisal.",
      "No lien on any property, so it does not affect any real estate loan's collateral position.",
    ],
    weaknesses: [
      "A market fall triggers a maintenance call, and the call arrives when markets are down and selling is worst. This is the risk, and it is not theoretical.",
      "The lender can generally change the advance rate or demand repayment, sometimes with little notice.",
      "The rate floats and resets without warning, so a position that was comfortably serviceable can stop being so while nothing about the property or the portfolio has changed.",
      "It only works if a substantial taxable portfolio already exists — retirement accounts cannot be pledged.",
    ],
    bestFor: "An investor with a large low-basis taxable portfolio who wants property capital without triggering the gain.",
    wrongFor: "Anyone who would draw near the maximum advance. The headroom is the whole safety margin.",
    typicalCost: "Floating over an index, tiered by size. Ask for the rate grid in writing.",
    typicalSpeed: null,
    providers: [
      { name: "Your existing custodian", url: "https://www.schwab.com", note: "Major custodians publish pledged asset lines and non-purpose lines against taxable brokerage accounts. Terms, advance rates and tiered pricing differ materially between them — request the current rate grid from each." },
    ],
    diligence: "Ask what the account falls to before a call, and stress it against a 35 percent drawdown. If you cannot survive that, borrow less.",
    asOf: ASOF,
  },
  {
    id: "seller-financing", n: 10, name: "Seller financing and wraparound notes", family: "structural",
    collateral: "the property",
    mechanism: "The seller becomes the lender. On a wraparound, the seller's existing mortgage stays in place and the new note wraps around it.",
    howItWorks: [
      "The buyer pays the seller directly on a note the two of them write; no institution is involved.",
      "On a wrap, the seller keeps paying their original mortgage out of what the buyer pays them, and keeps the spread between the two rates.",
      "Terms — rate, amortisation, balloon, down payment — are whatever the two parties agree.",
    ],
    strengths: [
      "No lender underwriting, no appraisal queue, no property-count cap.",
      "Terms are genuinely negotiable, including interest-only periods and deferred starts that no institution would write.",
      "The seller can spread their gain over time under an instalment sale, which is often what makes them say yes.",
      "Closes quickly and cheaply.",
    ],
    weaknesses: [
      "A wraparound almost always violates the due-on-sale clause in the underlying mortgage, which gives that lender the right to call the loan. This is a real risk and it must be disclosed to every party.",
      "Requires an owner with substantial equity and a willingness to wait for their money — a small fraction of sellers.",
      "Documentation quality is entirely on you. A badly drafted wrap is a lawsuit.",
      "The buyer depends on the seller continuing to pay the underlying loan, and has limited visibility into whether they do.",
    ],
    bestFor: "A buyer with a motivated seller who owns free and clear or nearly so, where both sides benefit from the instalment treatment.",
    wrongFor: "Anyone doing it without a real estate attorney, and anyone who cannot survive the underlying lender calling the note.",
    typicalCost: "Whatever is negotiated. Usually above the seller's own rate and below hard money.",
    typicalSpeed: "As fast as the paperwork.",
    providers: [],
    diligence: "Have a real estate attorney in your state draft it, and address the due-on-sale clause explicitly and in writing. Every party must understand that the underlying lender can call.",
    asOf: ASOF,
  },
  {
    id: "self-directed-retirement", n: 11, name: "Self-directed IRA and Solo 401(k)", family: "structural",
    collateral: "the property",
    mechanism: "Retirement money buys or lends against real estate directly, inside the plan, so the gains stay tax-deferred or tax-free.",
    howItWorks: [
      "A self-directed custodian holds the account and the property is titled to the plan, not to you.",
      "An IRA borrowing to buy property must use non-recourse debt, and the leveraged portion generates unrelated debt-financed income taxable to the IRA.",
      "A Solo 401(k) is exempt from that UDFI charge on leveraged real estate, which is the single largest structural advantage it holds over an IRA here.",
      "A Solo 401(k) also permits a participant loan of up to the statutory limit, which an IRA does not permit at all.",
    ],
    strengths: [
      "Gains are sheltered, and in a Roth version they are never taxed at all.",
      "A Solo 401(k) avoids the debt-financed income tax that makes leveraged IRA real estate expensive.",
      "The plan can also be the lender, making secured loans to unrelated third parties at negotiated rates.",
    ],
    weaknesses: [
      "The prohibited transaction rules are strict and the penalty is catastrophic: a violation can disqualify the entire account, making the whole balance taxable at once.",
      "You cannot use the property personally, cannot do the work yourself, and cannot transact with a disqualified person — which includes you, your spouse, your ascendants and descendants.",
      "Every expense must be paid by the plan and every dollar of income must return to it, with no commingling whatsoever.",
      "A Solo 401(k) requires genuine self-employment income and no full-time employees other than a spouse.",
    ],
    bestFor: "An investor with substantial retirement assets, real self-employment income, and the discipline to keep the plan entirely at arm's length.",
    wrongFor: "Anyone who wants to renovate the property themselves, or who does not have a competent custodian and CPA on the file from day one.",
    typicalCost: "Custodian fees plus non-recourse lending rates, which run above conventional.",
    typicalSpeed: null,
    providers: [],
    diligence: "Before anything else, have a CPA or ERISA attorney confirm no disqualified person touches the transaction. The downside here is not a bad deal; it is losing the account.",
    asOf: ASOF,
  },
  {
    id: "note-hypothecation", n: 12, name: "Hypothecating a note you hold", family: "structural",
    collateral: "a note receivable",
    mechanism: "If you sold a property with seller financing, you hold a note. You can borrow against that note without selling it, or sell a slice of its payment stream.",
    howItWorks: [
      "The note and its payment stream are pledged to a lender as collateral for a new loan to you.",
      "Alternatively a partial sale: you sell the next N payments and keep the tail, retaining the back end of the note.",
      "Pricing depends on the payer's record, the seasoning of the note, and the equity behind it.",
    ],
    strengths: [
      "Turns an illiquid receivable into cash without giving up the whole instrument.",
      "A partial sale keeps the long-term upside while solving a short-term need.",
      "Does not touch any property you currently own.",
    ],
    weaknesses: [
      "Only available if you already hold seller-financed paper — a narrow precondition.",
      "Notes are discounted hard, particularly unseasoned ones; expect to be surprised by the price.",
      "The lender will underwrite the payer, not you, so a shaky payer makes the note nearly unfinanceable.",
    ],
    bestFor: "A seller who financed a sale, now needs capital, and would rather not surrender the whole income stream.",
    wrongFor: "Anyone holding a note with fewer than twelve months of clean payment history — the discount will be punishing.",
    typicalCost: "A discount to face that widens sharply with poor seasoning or a weak payer.",
    typicalSpeed: null,
    providers: [],
    diligence: "Get two independent quotes before accepting a discount. The spread between note buyers on the same paper is wide.",
    asOf: ASOF,
  },
  {
    id: "cdfi", n: 13, name: "Community development financial institutions", family: "private-and-relationship",
    collateral: "the property",
    mechanism: "Treasury-certified mission lenders making small-balance real estate and small business loans in underserved markets, on terms banks will not write.",
    howItWorks: [
      "CDFIs are certified by the US Treasury's CDFI Fund and lend into markets and deal sizes conventional lenders decline.",
      "Underwriting weighs community impact alongside credit, so a deal that fails a bank's box can still work.",
      "Loan sizes are typically small-balance — precisely the range where conventional lending is uneconomic.",
    ],
    strengths: [
      "Genuinely flexible underwriting, with real people making decisions.",
      "Rates are usually far below private money, sometimes below bank pricing.",
      "Frequently comes with technical assistance rather than only capital.",
      "A relationship that compounds: the second loan is easier than the first.",
    ],
    weaknesses: [
      "Geographically restricted — a CDFI lends in its territory and nowhere else.",
      "Slower than private money, sometimes slower than a bank.",
      "Mission alignment matters; a purely opportunistic investor may not fit the mandate.",
      "Loan sizes cap out well below what a portfolio investor eventually needs.",
    ],
    bestFor: "An investor working in a low-to-moderate income market, especially on smaller properties where conventional lending is not economic.",
    wrongFor: "Anyone needing speed, or operating in a market no CDFI serves.",
    typicalCost: "Often below market. Ask; it varies by institution and by program.",
    typicalSpeed: null,
    providers: [
      { name: "CDFI Fund searchable award database", url: "https://www.cdfifund.gov/", note: "The US Treasury's CDFI Fund publishes the list of certified institutions and their service areas. This is the authoritative starting point for finding the CDFIs that lend in a given market." },
    ],
    diligence: "Start at the CDFI Fund's own list rather than a broker's. Certification is a fact you can check; a claim of it is not.",
    asOf: ASOF,
  },
  {
    id: "private-credit-preferred", n: 14, name: "Private credit, mezzanine and preferred equity", family: "private-and-relationship",
    collateral: "the business",
    mechanism: "A fund provides capital that sits between the senior mortgage and your own equity — as subordinated debt, or as preferred equity that is paid before you are.",
    howItWorks: [
      "Mezzanine debt sits behind the first mortgage and is typically secured by a pledge of the ownership interests rather than by the property itself.",
      "Preferred equity is not debt at all: the fund takes an equity position with a priority return paid ahead of yours.",
      "Both are used to fill the gap between what a senior lender will advance and the total capital a deal needs.",
    ],
    strengths: [
      "Reaches capital well above what a senior lender alone will advance, without selling the asset.",
      "Preferred equity carries no mortgage payment and does not appear as debt on the balance sheet.",
      "Fund investors are sophisticated and can move quickly on a deal they understand.",
    ],
    weaknesses: [
      "Expensive. The required return sits well above senior debt, because the position is genuinely riskier.",
      "Control provisions are the real cost: change-of-control, forced-sale and removal rights are common, and they bite exactly when the deal is struggling.",
      "Generally only available at institutional deal sizes, which puts it out of reach for a small portfolio.",
      "The documents are long and adversarial, and the cost of reviewing them properly is itself significant.",
    ],
    bestFor: "An operator with an institutional-scale deal, a strong senior lender in place, and a genuine capital gap.",
    wrongFor: "A small portfolio investor. The legal cost alone will exceed the benefit below a certain deal size.",
    typicalCost: "Well above senior debt. Model the all-in blended cost of capital, not the coupon.",
    typicalSpeed: null,
    providers: [],
    diligence: "Read the control provisions before the economics. What the fund can force you to do in a bad year matters more than the rate in a good one.",
    asOf: ASOF,
  },
  {
    id: "sba-owner-occupied", n: 15, name: "SBA 504 and 7(a) for owner-occupied commercial", family: "structural",
    collateral: "the property",
    mechanism: "Government-guaranteed financing for commercial property your own business occupies — which for a practice owner means the building the practice operates from.",
    howItWorks: [
      "The 504 program pairs a bank first mortgage with a Certified Development Company second, and is aimed at long-term fixed-asset purchases.",
      "The 7(a) program is broader and can include working capital alongside real estate.",
      "Owner-occupancy requirements apply: the business must occupy a defined majority of the space.",
    ],
    strengths: [
      "Down payments far below conventional commercial lending, which is the point.",
      "Long amortisation and, on 504, a long-dated fixed rate that is genuinely hard to find elsewhere.",
      "The practice stops paying rent to a landlord and starts building equity in an asset the owner keeps after the practice is sold.",
    ],
    weaknesses: [
      "Owner-occupancy is a hard requirement. This cannot be used for a pure investment property.",
      "Paperwork and timelines are heavier than any private route here.",
      "Personal guarantees are generally required, which puts personal assets behind the business.",
      "Prepayment penalties on 504 run for the early years.",
    ],
    bestFor: "A practice owner buying the building the practice operates from — which is the most common unexamined opportunity in this firm's client base.",
    wrongFor: "Any pure investment property, and anyone unwilling to sign a personal guarantee.",
    typicalCost: "Below conventional commercial pricing, particularly on the 504 second.",
    typicalSpeed: null,
    providers: [
      { name: "US Small Business Administration", url: "https://www.sba.gov/funding-programs/loans", note: "The SBA publishes current 504 and 7(a) program terms, eligibility and the lender match service. Loans are made by participating lenders, not by the SBA itself." },
    ],
    diligence: "Confirm the occupancy percentage your use satisfies before spending anything on the application. It is the gate.",
    asOf: ASOF,
  },
] as const;

export const LIQUIDITY_ROUTE_COUNT = LIQUIDITY_ROUTES.length;

export const FAMILY_LABELS: Record<RouteFamily, string> = {
  "asset-based-lending": "Lending against the property",
  "equity-sharing": "Selling a share rather than borrowing",
  "policy-and-portfolio": "Borrowing against what you already own elsewhere",
  "private-and-relationship": "Private capital and relationships",
  structural: "Structural and entity routes",
};

export const FAMILY_ORDER: readonly RouteFamily[] = [
  "asset-based-lending", "equity-sharing", "policy-and-portfolio", "private-and-relationship", "structural",
];

export function route(id: string): LiquidityRoute | undefined {
  return LIQUIDITY_ROUTES.find((r) => r.id === id);
}

export function byFamily(family: RouteFamily): LiquidityRoute[] {
  return LIQUIDITY_ROUTES.filter((r) => r.family === family);
}

/** Routes that do not create a monthly payment — the ones that protect a coverage ratio. */
export function noMonthlyPayment(): LiquidityRoute[] {
  return LIQUIDITY_ROUTES.filter((r) => ["home-equity-investment", "sale-leaseback", "policy-loan"].includes(r.id));
}

/** Routes that preserve an existing low-rate first mortgage. */
export function preservesFirstMortgage(): LiquidityRoute[] {
  return LIQUIDITY_ROUTES.filter((r) =>
    ["dscr-second", "home-equity-investment", "policy-loan", "cvloc", "securities-based", "note-hypothecation"].includes(r.id));
}

/**
 * The standing disclosure. Shown on the page and carried into any AI answer
 * that names a route, because the firm's position here has to be unambiguous.
 */
export const LIQUIDITY_DISCLOSURE =
  "Russell Capital Systems receives no compensation, referral fee or other consideration from any company named on this page. " +
  "Nothing here is a recommendation of any kind: it is not a recommendation, not an endorsement, and not an offer of credit. Several of these routes are expensive and several are " +
  "irreversible; each one states its own weaknesses before its strengths for that reason. Terms move constantly — every description " +
  "carries the date it was read from the company's own published material, and anything past that date must be re-checked directly " +
  "with the company. Confirm any structure with your own attorney and CPA before acting on it.";

/**
 * The sources the shell prints: every provider page each route was described
 * from, with the date it was read, built from LIQUIDITY_ROUTES so a provider
 * added to a route is printed without a second edit. A page named under more
 * than one route is printed once.
 */
export const LIQUIDITY_ROUTES_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = (() => {
  const seen = new Set<string>();
  const out: { label: string; url?: string; asOf?: string; note?: string }[] = [];
  for (const r of LIQUIDITY_ROUTES) {
    for (const p of r.providers) {
      if (seen.has(p.url)) continue;
      seen.add(p.url);
      out.push({ label: `${p.name} (${r.name})`, url: p.url, asOf: `read ${r.asOf}`, note: p.note });
    }
  }
  return out;
})();
