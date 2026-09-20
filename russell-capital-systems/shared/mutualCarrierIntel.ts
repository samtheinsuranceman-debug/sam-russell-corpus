// ============================================================
// CARRIER INTELLIGENCE — the fields an agent decides on, keyed to the
// registry in shared/mutualIulCarriers.ts.
//
// WHY THIS IS A SEPARATE FILE. `mutualIulCarriers.ts` answers one question:
// is this company mutual, and what does its own site say about the product?
// Other pages already import that type, so it is not rewritten here. This
// module adds the things an agent actually chooses between — where the
// borrowing is cheapest, whose underwriting is easiest, who takes a card,
// and what each carrier is genuinely best at — and joins on `carrierId`.
//
// Carriers that are NOT mutual appear here too, clearly marked. Excluding a
// stock carrier from an IUL comparison because of its ownership structure
// would hide Allianz's guaranteed 5% loan rate and Symetra's eight-year
// floor guarantee, and both of those beat most mutuals on the merits. The
// structure is a column, not a filter.
//
// SOURCING. Same rule as everywhere else: `Verified<T>` carries the page and
// the date. Anything that could not be read from a carrier's own material is
// `verified: false` and renders as unverified rather than being filled in.
//
// A WARNING THAT COST REAL RESEARCH TIME. Several searches return "this
// carrier accepts credit cards" for carriers that do not. Those strings trace
// to doxo, a third-party bill-payment aggregator that is not authorised by
// most billers, is the subject of a class action, and carries an FTC consumer
// alert for posing as an official payment portal. An aggregator taking a card
// is not the carrier taking a card — and under Chase's and Capital One's
// cardholder agreements, paying through an aggregator is exactly what gets a
// charge recoded as a cash advance. Every card row below is either read from
// the carrier's own page or marked unverified.
// ============================================================

import type { Verified } from "./mutualIulCarriers";

const D = "2026-09-20";
const v = <T,>(value: T, source: string, asOf: string, note?: string): Verified<T> =>
  ({ value, verified: true, source, asOf, note });
const unverified = <T,>(value: T, note: string, source = ""): Verified<T> =>
  ({ value, verified: false, source, asOf: "", note });

/**
 * Three genuinely different things that get called "mutual" interchangeably,
 * and the difference decides who owns the surplus.
 */
export type OwnershipClass =
  /** Policyholder-owned outright. No parent, no shareholders. */
  | "true-mutual"
  /** A stock insurer whose ultimate parent is a chartered mutual holding company. */
  | "mutual-holding-company"
  /** A stock insurer under a mutual parent that is not a statutory mutual holding company. */
  | "stock-under-mutual"
  /** Shareholder-owned. */
  | "stock";

export const OWNERSHIP_LABEL: Record<OwnershipClass, string> = {
  "true-mutual": "True mutual — policyholder-owned, no parent",
  "mutual-holding-company": "Mutual holding company structure",
  "stock-under-mutual": "Stock insurer under a mutual parent",
  stock: "Stock company — shareholder-owned",
};

export type CarrierIntel = {
  /** Joins to MUTUAL_IUL_CARRIERS[].id where one exists; otherwise stands alone. */
  carrierId: string;
  name: string;
  ownershipClass: OwnershipClass;
  ownershipDetail: Verified<string>;
  homeCity: Verified<string | null>;
  homeState: Verified<string | null>;
  founded: Verified<number | null>;
  /** Lowest published participating/indexed loan charge. The arbitrage lives here. */
  loanRate: Verified<string | null>;
  /** Sortable: the lowest participating loan charge as a decimal, for ranking. null when unread. */
  loanRateNumeric: number | null;
  coiNote: Verified<string | null>;
  underwriting: Verified<string | null>;
  /** Does the carrier itself take a card for premium, and for what. */
  cardPolicy: Verified<string>;
  /** Two or three sentences: where does this carrier beat the others. */
  superpower: string;
  /** Always populated. A carrier with no stated caveat has not been looked at. */
  caveats: readonly string[];
  openToIndependents: Verified<boolean | null>;
  home: string;
};

export const CARRIER_INTEL: CarrierIntel[] = [
  {
    carrierId: "pacific-life",
    name: "Pacific Life",
    ownershipClass: "mutual-holding-company",
    ownershipDetail: v("Pacific Mutual Holding Company → Pacific LifeCorp → Pacific Life Insurance Company (stock).", "https://www.pacificlife.com", D),
    homeCity: v("Newport Beach", "https://www.pacificlife.com", D),
    homeState: v("CA", "https://www.pacificlife.com", D),
    founded: v(1868, "https://www.pacificlife.com", D, "Founded in Sacramento; 158 years."),
    loanRate: v("Standard loan 2.25% current, with collateral credited 2.00% years 1–5 and 2.25% from year 6 — a true wash from year 6. Fixed-charge indexed loan 4.50%, current AND guaranteed. Indexed loan 4.90% current / 8.00% guaranteed maximum.", "https://mylionstreet.com/media/MPF4406Generic.pdf", D, "Read from a brokerage rate sheet, not Pacific Life's own page. Confirm against the policy form before a plan relies on it."),
    loanRateNumeric: 0.045,
    coiNote: v(null, "https://www.pacificlife.com", D, "No published COI data. Frequently cited for strong Preferred Plus classification, which is an underwriting outcome rather than a COI figure."),
    underwriting: v("No-exam underwriting to $1,000,000 for ages 60 and under using data sources.", "https://www.pacificlife.com", D),
    cardPolicy: unverified("unknown", "The payment portal runs through Aliaswire; accepted tenders were not confirmed on Pacific Life's own page."),
    superpower: "The cheapest borrowing in the market, and the only carrier found with a participating loan charge that is guaranteed rather than current. A 4.50% fixed-charge indexed loan that cannot be repriced is the strongest contractual arbitrage spread available — it caps the cost of the strategy for the life of the contract while the collateral stays in the index.",
    caveats: [
      "Agreed a $58 million settlement in a California class action over the legacy PDX product. Relevant on any page an agent presents in a fiduciary capacity.",
      "The loan rates above come from a brokerage rate sheet, not Pacific Life's own published material.",
    ],
    openToIndependents: v(true, "https://www.pacificlife.com", D),
    home: "https://www.pacificlife.com",
  },
  {
    carrierId: "penn-mutual",
    name: "Penn Mutual",
    ownershipClass: "true-mutual",
    ownershipDetail: v("True mutual — no parent corporation and no external shareholders. Seventh mutual life company chartered in the United States. Dividends paid every year since 1847; $265 million awarded for 2025.", "https://www.pennmutual.com/about-us/financial-strength/ratings", D),
    homeCity: v("Horsham", "https://www.pennmutual.com", D),
    homeState: v("PA", "https://www.pennmutual.com", D),
    founded: v(1847, "https://en.wikipedia.org/wiki/Penn_Mutual", D, "179 years."),
    loanRate: v("6% participating loan, contractually locked for the life of the policy. Collateral stays in the S&P 500 index while borrowing.", "https://gateway.pennmutual.com/products-performance/indexed-universal-life/accumulation-indexed-universal-life", D, "Locked at issue is the feature. The rate is higher than Pacific Life's or Allianz's; the certainty is better than either."),
    loanRateNumeric: 0.06,
    coiNote: v(null, "https://www.pennmutual.com", D, "No published COI data."),
    underwriting: v("Lowest minimum face amount in its peer set at $50,000. Lowest NAIC upheld-complaint levels in its peer set.", "https://www.pennmutual.com/about-us/financial-strength/ratings", D),
    cardPolicy: v("YES — initial new-business premium only. Visa and Mastercard, credit or debit. Premium must not exceed $10,000. Online only. Not available in New York. Loan repayments, paid-up additions and every premium after the initial premium are ACH only.", "https://gateway.pennmutual.com/static-assets/files/products/life/t4473.pdf", D, "The best-documented carrier card policy found anywhere in this research — read from Penn Mutual's own payment-options document."),
    superpower: "The most modelable IUL on the shelf. Several indexed accounts carry a guaranteed 1% floor rather than the usual 0%, and the participating loan rate is locked contractually at issue — so neither the downside nor the borrowing cost can be repriced against the client in year twenty-five. For a plan whose whole thesis is a spread held for decades, a rate that cannot move is worth more than a rate that is currently lower.",
    caveats: [
      "The only carrier here with a verified card policy — and it is initial premium only, $10,000 once. There is no recurring card funding at Penn Mutual.",
      "Not available for card payment in New York.",
    ],
    openToIndependents: v(true, "https://www.pennmutual.com", D),
    home: "https://www.pennmutual.com",
  },
  {
    carrierId: "securian",
    name: "Securian Financial / Minnesota Life",
    ownershipClass: "mutual-holding-company",
    ownershipDetail: v("Minnesota Mutual Companies, Inc. (mutual holding company, effective 1 October 1998) → Securian Holding Company → Securian Financial Group → Minnesota Life (stock).", "https://www.securian.com/about-us/corporate-structure/minnesota-life.html", D),
    homeCity: v("St. Paul", "https://www.securian.com", D),
    homeState: v("MN", "https://www.securian.com", D),
    founded: v(1880, "https://www.securian.com/about-us/corporate-structure/minnesota-life.html", D, "Founded 6 August 1880; first life insurer in Minnesota. 146 years."),
    loanRate: v("Four loan options — a first among carriers: fixed, indexed, variable, and a 90-day interest-free short-term loan. Fixed loan 5%, direct recognition.", "https://www.securian.com/content/dam/doc/il/eclipse-accumulator-ii-iul-fixed-loans-5-percent_108140-16.pdf", D),
    loanRateNumeric: 0.05,
    coiNote: v("Positioned explicitly as low-charge: the product carries no multipliers and no asset-charge bonus structures by design.", "https://www.securian.com/financial-professionals/products/individual-life-insurance/indexed-universal-life/eclipse-accumulator.html", D, "A design thesis, not a published COI scale."),
    underwriting: unverified(null, "Not published in the pages read."),
    cardPolicy: unverified("unknown", "An online payment system with guest single-payment exists; accepted tenders were not confirmed on Securian's own page."),
    superpower: "The anti-multiplier IUL. Eclipse Accumulator II deliberately carries no multipliers and no asset-charge leverage, so there is nothing to unwind in a bad decade — it behaves the way it illustrates. When a case needs a policy that a reviewer, a trustee or a court will find defensible ten years on, that is the whole argument. The 90-day interest-free loan is unique and genuinely useful for short-term liquidity without disturbing an index position.",
    caveats: [
      "Eclipse Accumulator II is not available in California, Florida or New York.",
      "Conservative by design means it will lose an illustration beauty contest against a multiplier product every time.",
    ],
    openToIndependents: v(true, "https://www.securian.com", D),
    home: "https://www.securian.com",
  },
  {
    carrierId: "nationwide",
    name: "Nationwide",
    ownershipClass: "stock-under-mutual",
    ownershipDetail: v("Nationwide Life Insurance Company — the entity that issues the IUL — is an Ohio-domiciled STOCK life insurer, incorporated 1929. It is wholly owned by Nationwide Financial Services → Nationwide Corporation (~95.2%) → Nationwide Mutual Insurance Company, which is a mutual property-and-casualty insurer, not a statutory mutual holding company.", "https://www.sec.gov/Archives/edgar/data/205695/000119312519086622/R8.htm", D, "CORRECTION to the common framing. Accurate phrasing: a stock life issuer under a policyholder-owned mutual P&C parent. It is not structured the way Pacific Mutual Holding Company or Minnesota Mutual Companies are."),
    homeCity: v("Columbus", "https://www.nationwide.com/personal/about-us/affiliated-companies/", D),
    homeState: v("OH", "https://www.nationwide.com/personal/about-us/affiliated-companies/", D),
    founded: v(1929, "https://www.sec.gov/Archives/edgar/data/205695/000119312519086622/R8.htm", D, "Nationwide Life incorporated 1929; Nationwide Mutual founded 1926."),
    loanRate: unverified(null, "Marketing material refers to 'low-interest loans'; no rate was published on any reachable page. Read the policy form."),
    loanRateNumeric: null,
    coiNote: unverified(null, "Cited by secondary sources as lowest-cost. No published data — present as industry opinion, not fact."),
    underwriting: v("Accelerated underwriting to $5,000,000 for ages 18–50 and $1,000,000 for ages 51–60, with no exam and no labs when accelerated. The most generous no-exam limits found.", "https://nationwidefinancial.com/media/pdf/NFM-23978AO-WG.pdf", D),
    cardPolicy: unverified("unknown", "Reported as taking cards for initial AND renewal premium in all states — but the source is a brokerage general agency restating Nationwide bulletin FAN-0114AO, not Nationwide's own page, and a separate Nationwide document indicates cards are taken 'on an exception basis' for fixed life products. 'All states' and 'exception basis' cannot both be routinely true. This is the least-verified claim in the entire Plastic-to-Cash strategy and one phone call settles it."),
    superpower: "The broadest index menu on a genuinely low-cost chassis: six uncapped indexed strategies, Nasdaq-100 accounts, two-year segment terms, Performance Lock to capture a gain mid-segment, and an 8% Enhanced dollar-cost-averaging credit on first-year premium held in the fixed account for twelve months. Accelerated underwriting to $5 million with no exam is the most generous found, which matters when the case has to be issued quickly.",
    caveats: [
      "The product is Accumulator III, launched 26 March 2026. There is no 'Accumulator 3' — Nationwide uses Roman numerals, and Accumulator II (2020) is the superseded predecessor.",
      "The life issuer is a stock company. Calling Nationwide 'a mutual' on a client-facing page is not accurate.",
      "The $9,999/month card ceiling that the Plastic-to-Cash strategy is built on could not be read from Nationwide's own policyholder-services page.",
    ],
    openToIndependents: v(true, "https://nationwidefinancial.com", D),
    home: "https://nationwidefinancial.com",
  },
  {
    carrierId: "allianz",
    name: "Allianz Life",
    ownershipClass: "stock",
    ownershipDetail: v("Stock company: Allianz Life of North America → Allianz of America → Allianz Europe B.V. → Allianz SE (Munich).", "https://en.wikipedia.org/wiki/Allianz_Life", D, "Not a mutual. Included because its loan and multiplier terms beat most mutuals on the merits."),
    homeCity: v("Minneapolis", "https://www.allianzlife.com", D),
    homeState: v("MN", "https://www.allianzlife.com", D),
    founded: unverified(null, "Not confirmed on Allianz's own pages."),
    loanRate: v("5% GUARANTEED index loan rate — guaranteed, not merely current.", "https://www.allianzlife.com/what-we-offer/Life-Insurance/Indexed-Universal-Life/Allianz-Life-Accumulator/Rates", D, "The guarantee is the distinction. A current rate can be repriced; this one cannot."),
    loanRateNumeric: 0.05,
    coiNote: unverified(null, "Multiple secondary sources name Allianz lowest-COI in the accumulation category. Consistent industry commentary, NOT published carrier data. Present as opinion."),
    underwriting: unverified(null, "Not published in the pages read."),
    cardPolicy: unverified("unknown", "No US policy found. Search results describing recurring card debits refer to Allianz Malaysia, a different company — do not use them."),
    superpower: "The most aggressive accumulation-and-distribution chassis available. Index Lock and Auto Lock let a client capture an index gain mid-segment at a preset target rather than waiting on the anniversary and hoping — that is a genuinely different product behaviour, not a marketing feature. Paired with a 40% multiplier on the Select option and a 5% guaranteed loan rate, both ends of the spread are pinned down.",
    caveats: [
      "The Select option's 40% multiplier carries a 1% annual asset charge. The multiplier is not free and the charge applies whether or not the index performs.",
      "Stock company owned by a foreign parent. If mutual ownership is a stated client requirement, this fails it regardless of terms.",
    ],
    openToIndependents: v(true, "https://www.allianzlife.com", D),
    home: "https://www.allianzlife.com",
  },
  {
    carrierId: "symetra",
    name: "Symetra",
    ownershipClass: "stock",
    ownershipDetail: v("Stock company, wholly owned by Sumitomo Life Insurance Company (Japan) since 1 February 2016.", "https://investors.symetra.com/sumitomo-life-insurance-company-completes-acquisition-symetra-financial-corporation", D),
    homeCity: v("Bellevue", "https://www.symetra.com", D),
    homeState: v("WA", "https://www.symetra.com", D),
    founded: unverified(null, "Not confirmed on Symetra's own pages."),
    loanRate: unverified(null, "Not published in the pages read."),
    loanRateNumeric: null,
    coiNote: unverified(null, "Not published. Diligence note: Symetra has cost-of-insurance increase litigation and settlement history."),
    underwriting: v("Accelerated underwriting to $2,000,000 with coverage available to $5,000,000. Known for streamlined, predictable approvals.", "https://financialprofessionals.symetra.com/AAIUL", D),
    cardPolicy: v("NO. Symetra's own individual-life FAQ lists online premium payment, personal check, bank bill-payer service and recurring EFT. Credit cards are not among them.", "https://www.symetra.com/customer-service/faq-individual-life-insurance/", D),
    superpower: "The strongest downside guarantee in the category, and it is not close. An eight-year lookback: if the indexed strategies have not returned at least 2% cumulatively over eight years, Symetra guarantees a 2% minimum. That converts the IUL's theoretical 0% floor — which is only a floor on a single year — into an actual minimum return over a real holding period. For a client whose fear is a lost decade rather than a lost year, this is the answer.",
    caveats: [
      "Does not take cards, so it is excluded from the Plastic-to-Cash strategy entirely. Listed because it is a serious ACH-funded accumulation candidate.",
      "Cost-of-insurance increase litigation in its history is a diligence item on any long-horizon case.",
      "Stock company under a foreign parent.",
    ],
    openToIndependents: v(true, "https://financialprofessionals.symetra.com/AAIUL", D),
    home: "https://www.symetra.com",
  },
  {
    carrierId: "national-life",
    name: "National Life Group / LSW",
    ownershipClass: "mutual-holding-company",
    ownershipDetail: unverified("National Life Holding Company (mutual holding company) → NLV Financial Corporation → National Life Insurance Company and Life Insurance Company of the Southwest (stock).", "Flagged for re-verification — the holding structure was not read from National Life's own corporate page."),
    homeCity: v("Montpelier", "https://www.nationallife.com", D, "LSW is in Addison, Texas."),
    homeState: v("VT", "https://www.nationallife.com", D),
    founded: v(1848, "https://en.wikipedia.org/wiki/National_Life_Group", D, "Chartered by the Vermont legislature 13 November 1848; 178 years. LSW chartered 1955."),
    loanRate: v("Four loan types: Participating Declared, Participating Fixed at 5.00% set at issue, Participating Variable, and Standard. Variable and Standard are tied to the Moody's Corporate Bond Yield Average. Available after policy year one.", "https://www.nationallife.com/NWI/Help/en-US/NLGFlexLife2/DBF_Loan_Rate.htm", D),
    loanRateNumeric: 0.05,
    coiNote: unverified(null, "Not published."),
    underwriting: unverified(null, "Not published in the pages read."),
    cardPolicy: unverified("unknown", "DO NOT STATE THAT NATIONAL LIFE ACCEPTS CARDS. Results claiming Visa/Mastercard/Discover acceptance trace to doxo, a third-party aggregator that is the subject of a class action and an FTC consumer alert for posing as an official payment portal. National Life itself publishes a warning about sites impersonating it for payments."),
    superpower: "The deepest product segmentation in the market — a distinct chassis for each client size rather than one policy stretched across all of them: FlexLife from a $50,000 minimum for the mass-affluent, PeakLife at $1 million for accumulation and supplemental retirement, SummitLife at $1 million for wealth transfer with guaranteed lifetime income. All three carry the same 5% participating fixed loan locked at issue.",
    caveats: [
      "The apparent card acceptance is an aggregator artefact. Routing premium through that channel is exactly what triggers cash-advance recoding under Chase's and Capital One's agreements.",
      "The mutual holding structure could not be verified from National Life's own corporate material.",
    ],
    openToIndependents: v(true, "https://www.nationallife.com", D, "Heavily IMO-driven."),
    home: "https://www.nationallife.com",
  },
  {
    carrierId: "ameritas",
    name: "Ameritas",
    ownershipClass: "mutual-holding-company",
    ownershipDetail: v("Ameritas Mutual Holding Company (originally UNIFI Mutual Holding Company, effective 1 January 1998) → Ameritas Holding Company → Ameritas Life Insurance Corp. (stock).", "https://en.wikipedia.org/wiki/Ameritas", D),
    homeCity: v("Lincoln", "https://www.ameritas.com", D),
    homeState: v("NE", "https://www.ameritas.com", D),
    founded: unverified(null, "Commonly cited as 1887; not confirmed on Ameritas' own pages."),
    loanRate: unverified(null, "Not published in the pages read."),
    loanRateNumeric: null,
    coiNote: unverified(null, "Not published."),
    underwriting: unverified(null, "Not published in the pages read."),
    cardPolicy: v("NO for credit. Ameritas' own life FAQ lists checks, wires, cashier's checks, bank bill-pay, and phone or online payment using bank account information or a DEBIT card. Credit cards are not listed.", "https://www.ameritas.com/life/faq-life/", D, "A debit payment defeats the purpose entirely — no float, no 0% window."),
    superpower: "Low-cost, low-drama accumulation from a mutual-holding structure, and the only major carrier pairing a real IUL with a direct-to-consumer digital front end through its Ethos partnership. Five index options including the S&P MARC 5% and BNP Paribas Momentum Multi-Asset 5 volatility-controlled indices, aimed squarely at the affluent and emerging-affluent 35–55 bracket.",
    caveats: [
      "Debit may be accepted; credit is not listed. Excluded from Plastic-to-Cash.",
      "Loan provisions, cost of insurance and underwriting limits are all unpublished — a plan cannot be modelled on this carrier without an illustration.",
    ],
    openToIndependents: v(true, "https://www.ameritas.com/industry-professionals/life-insurance/index-universal/", D),
    home: "https://www.ameritas.com",
  },
  {
    carrierId: "augustar",
    name: "AuguStar Life (formerly Ohio National)",
    ownershipClass: "stock",
    ownershipDetail: v("STOCK company. Demutualized 31 March 2022 — the largest life demutualization in two decades — becoming a subsidiary of Constellation Insurance Holdings. The Ohio National Life Insurance Company was renamed AuguStar Life on 2 October 2023.", "https://www.prnewswire.com/news-releases/ohio-nationals-life-insurance-business-repositioned-and-rebranded-to-augustar-life-301878437.html", D, "CORRECTION: Ohio National is no longer a mutual and no longer carries that name. Any list still showing it as a mutual is at least four years stale."),
    homeCity: v("Cincinnati", "https://augustarfinancial.com", D),
    homeState: v("OH", "https://augustarfinancial.com", D),
    founded: unverified(null, "Ohio National commonly cited as 1909; not confirmed."),
    loanRate: unverified(null, "Not published in the pages read."),
    loanRateNumeric: null,
    coiNote: unverified(null, "Not published."),
    underwriting: unverified(null, "Not published."),
    cardPolicy: unverified("unknown", "No published policy found."),
    superpower: "A recapitalised carrier rebuilding independent distribution from scratch, which historically means aggressive pricing to win shelf space. Virtus IUL III plus an income-focused IUL, sold through both a direct agent network and IMOs.",
    caveats: [
      "Not a mutual. Demutualized in 2022 and renamed in 2023 — clients will not recognise the name.",
      "Exited individual disability in May 2023 and annuities in 2018. A carrier narrowing its lines is a consideration on a multi-decade contract.",
    ],
    openToIndependents: v(true, "https://augustarfinancial.com/professionals/indexed-universal-life-iul/", D),
    home: "https://augustarfinancial.com",
  },
];

/**
 * Carriers an agent might expect to find here and will not, with the reason.
 *
 * An omission with no explanation reads as an oversight. Each of these is a
 * deliberate exclusion and the reason is the useful part.
 */
export const NOTABLE_EXCLUSIONS = [
  {
    name: "Northwestern Mutual",
    reason: "Does not sell indexed universal life at all, by published policy — their own page argues that IUL illustrations do not reflect real-world results, that fees and complexity limit gains, and that caps are adjustable by the insurer through formulas that are hard to parse. They are also fully captive: an independent agent cannot access them at any production level.",
    source: "https://www.northwesternmutual.com/life-insurance/indexed-universal-life-insurance-iul/",
  },
  {
    name: "Global Atlantic / Accordia",
    reason: "Ceased new fixed indexed UL sales on 1 July 2023 and exited individual life to focus on annuities and reinsurance. In-force policies are serviced; there is no new business to write.",
    source: "https://insurancenewsnet.com/innarticle/global-atlantic-to-stop-selling-new-fixed-indexed-universal-life-policies",
  },
  {
    name: "Lafayette Life",
    reason: "No IUL product name could be verified. The marketed lineup is eight whole life policies and one term policy. The Marquis Centennial products are fixed indexed ANNUITIES, not IUL — a mislabelling worth avoiding.",
    source: "https://www.westernsouthern.com/lafayette/products",
  },
  {
    name: "New York Life and MassMutual",
    reason: "Both are true mutuals with top-tier ratings, and both remain in the registry — but neither's current IUL product could be confirmed. New York Life's confirmed accumulation product is Variable Universal Life Accumulator II, which is a VUL. Sources conflict on whether MassMutual currently markets an IUL at all. Do not publish a product name for either without confirming with the carrier.",
    source: "https://www.newyorklife.com/products/insurance/variable-universal-life",
  },
  {
    name: "Guardian Life",
    reason: "A true mutual, but no named Guardian IUL was found. Index exposure is offered inside Flexible Solutions VUL as one of three investment choices — index-blended VUL, not IUL.",
    source: "https://www.guardianlife.com/life-insurance/indexed-universal",
  },
];

/** Why carriers restrict card payment. The reason is regulatory, not commercial. */
export const CARD_ACCEPTANCE_EXPLAINER = {
  headline: "Why so few carriers take a credit card",
  lines: [
    "Interchange is the obvious answer and it is not the main one. Cards cost a merchant 1.5–3.5%; on a $50,000 annual premium that is over $1,000 of margin per policy-year. Real, but survivable.",
    "The binding constraint is anti-rebating law. Under New York DFS Office of General Counsel opinions, the METHOD OF PREMIUM PAYMENT is itself a benefit under the policy, and Insurance Law Articles 23 and 42 prohibit benefit discrimination within a class. A carrier that accepts cards cannot accept them from some insureds in a class and not others.",
    "Separately, absorbing interchange for card-payers while ACH-payers receive no equivalent benefit reads as an unlawful inducement or rebate unless it is written into the filed policy or rate filing. So card acceptance is filed and class-wide, or it does not exist — which is why 'ask the carrier for an exception' is not a workaround.",
    "Persistency is the third reason. Cards expire, get reissued and get declined, so card-paid policies lapse at materially higher rates. For a product priced on twenty-plus years of persistency, that is an underwriting problem rather than a convenience problem.",
    "And a carrier has no legal obligation to accept a card. No state law requires it.",
  ],
  sources: [
    { label: "NY DFS OGC 02-10-03", url: "https://www.dfs.ny.gov/insurance/ogco2002/rg021003.htm" },
    { label: "NY DFS OGC 08-04-07", url: "https://www.dfs.ny.gov/insurance/ogco2008/rg080407.htm" },
    { label: "NY DFS OGC 01-06-21", url: "https://www.dfs.ny.gov/insurance/ogco2001/rg106261.htm" },
  ],
};

/**
 * Ranked by lowest published participating loan charge — the number that sets
 * the arbitrage spread. Carriers whose rate could not be read sort last rather
 * than being assigned a guess.
 */
export function byLoanCost(): CarrierIntel[] {
  return [...CARRIER_INTEL].sort((a, b) => {
    if (a.loanRateNumeric == null && b.loanRateNumeric == null) return a.name.localeCompare(b.name);
    if (a.loanRateNumeric == null) return 1;
    if (b.loanRateNumeric == null) return -1;
    return a.loanRateNumeric - b.loanRateNumeric;
  });
}

/** Carriers whose own published material confirms they take a card for premium. */
export function cardAccepting(): CarrierIntel[] {
  return CARRIER_INTEL.filter(c => c.cardPolicy.verified && c.cardPolicy.value.startsWith("YES"));
}

/**
 * A wash loan produces certainty, not arbitrage — by definition the credit and
 * the charge cancel. Positive arbitrage needs a participating or indexed loan
 * where the collateral stays in the index and the charge is below the credit.
 * The page says so rather than letting "lowest loan rate" imply "best spread."
 */
export const ARBITRAGE_NOTE =
  "Lowest loan rate and best arbitrage are not the same ranking. A wash loan — where the carrier credits the collateral at the same rate it charges on the loan — produces zero spread by design; what it buys is certainty. Positive arbitrage requires a participating or indexed loan whose charge sits below the index credit while the collateral keeps earning. On that basis the ranking is Pacific Life's 4.50% guaranteed fixed-charge indexed loan first, then Allianz, National Life and Securian at 5%, then Penn Mutual at a locked 6%. A guaranteed rate beats a lower current rate on any plan measured in decades.";
