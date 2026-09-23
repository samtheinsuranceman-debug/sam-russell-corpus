// ============================================================
// PAGE RATINGS — value and frequency for the fifty pages that matter most,
// with the conditions under which each one applies and the specific wires
// it still needs.
//
// The audit in server/integrationAudit.ts computes how connected a page IS.
// This file is the human half: how much a page is WORTH to someone it suits
// (value), how often an ordinary household actually needs it (frequency),
// the conditions that make it the right page, and the connections that
// would take it to ten — named specifically, so each one is a task rather
// than a wish. The two ratings are kept apart for the same reason they are
// on the mechanism dossiers: a policy-loan modeller is a 7 and a 2, and one
// number cannot say both.
//
// Fifty is the featured set plus the pages the featured ones depend on.
// A test asserts every path here is in the catalogue, so a renamed route
// fails the build rather than orphaning a rating.
// ============================================================

export interface PageRating {
  readonly path: string;
  /** 1–10. Worth to a household it suits. */
  readonly value: number;
  /** 1–10. How often an ordinary household needs it. */
  readonly frequency: number;
  /** When this page is the right one. */
  readonly conditions: string;
  /** The connections that would take it to ten. Specific, checkable. */
  readonly connectTo: readonly string[];
}

export const PAGE_RATINGS: readonly PageRating[] = [
  { path: "/ultra-calculator", value: 9, frequency: 7, conditions: "Any household with a decade to plan and a tax return to start from.", connectTo: ["Genome: name it in the accumulation strategies' relatedPaths.", "Provenance: a FigureTrace for the decade headline.", "Live: FRED CPI for the real-dollar line."] },
  { path: "/portal/income-for-life", value: 9, frequency: 5, conditions: "Within ten years of retirement, or any age with a Roth conversion decision pending.", connectTo: ["Planner: policy:borrow stage should cite this page's rate sheet.", "Genome: already linked; add the longevity factor as a gate.", "Live: SSA period life table refresh."] },
  { path: "/portal/lifetime-income", value: 8, frequency: 5, conditions: "Guaranteed-income appetite above 6 on the genome, or a spouse with it.", connectTo: ["Live: carrier payout-rate sheets on a dated sweep.", "Household genome: pair the two spouses' income-floor factors here."] },
  { path: "/portal/retirement-projection", value: 7, frequency: 8, conditions: "Everyone; it is the first page most households should see.", connectTo: ["Engine: retirementDNA.ts is named but the page imports policyMechanics — reconcile.", "Brain: add retirementDNA.ts to a memory group.", "Test: none imports retirementDNA."] },
  { path: "/portal/social-security", value: 8, frequency: 8, conditions: "Fifty-five and older, or younger with a spouse who is.", connectTo: ["Engine: move the claiming arithmetic to shared/ and name it.", "Live: SSA COLA and bend points on a sweep.", "Genome: link from the guaranteed-income strategies."] },
  { path: "/portal/withdrawal-sequencing", value: 8, frequency: 6, conditions: "Any household with more than one account type at retirement.", connectTo: ["Engine: name one; the page's arithmetic is inline.", "Erosion: feed the trajectory's tax odds into the sequencing.", "Provenance: trace the tax-saved figure."] },
  { path: "/portal/medicare-irmaa", value: 7, frequency: 6, conditions: "Sixty-three and older with income near a bracket edge.", connectTo: ["Live: CMS IRMAA thresholds annually.", "Roth: link both ways with the conversion ladder.", "Engine: name it."] },
  { path: "/portal/ecological-drivers", value: 8, frequency: 6, conditions: "Households who want to know what actually predicts retirement outcomes before they optimise a rate.", connectTo: ["Genome: link from the durability factors.", "Sources: DOIs already verified; expose them on the page."] },
  { path: "/portal/forgiveness", value: 8, frequency: 3, conditions: "Federal student debt over $50k, or a household with a physician or public-service worker.", connectTo: ["Career ledger: hand the loan balance across.", "Live: studentaid.gov rule changes."] },
  { path: "/portal/tax-waterfall", value: 8, frequency: 8, conditions: "Any tax-paying household; the first tax page to read.", connectTo: ["Provenance: trace one bracket figure.", "Genome: link from the tax strategies."] },
  { path: "/portal/roth-conversion", value: 9, frequency: 6, conditions: "Pre-tax balance over $200k and a horizon past the conversion year.", connectTo: ["Erosion: the power-adjusted tax odds should be the conversion's headline assumption.", "Planner: a conversion is a stage; expose it as a move.", "Provenance: trace the break-even year."] },
  { path: "/portal/erosion", value: 9, frequency: 7, conditions: "Anyone with a tax-deferred balance and a horizon; the argument behind half the site.", connectTo: ["Already the hub; add inbound links from every tax page's footer."] },
  { path: "/portal/tax-combos", value: 8, frequency: 5, conditions: "Households ready to stack two or more strategies.", connectTo: ["Engine: name one.", "Genome: strategy-fit should rank the combos.", "Planner: combos are sequences; route through it."] },
  { path: "/portal/qbi-optimizer", value: 9, frequency: 4, conditions: "Any pass-through business owner, especially specified-service trades near the phase-out.", connectTo: ["Genome: link from the business-owner strategies.", "Live: annual inflation adjustment of the threshold."] },
  { path: "/portal/oil-gas", value: 7, frequency: 2, conditions: "W-2 over $300k with a large current-year liability and real appetite for illiquidity.", connectTo: ["Engine: name one.", "Brain: no group carries the IDC rule.", "Provenance: trace the year-one deduction."] },
  { path: "/portal/str-tax-eliminator", value: 8, frequency: 3, conditions: "Owns or will buy a short-term rental and can meet material participation.", connectTo: ["STR engine: hand the revenue model across.", "Zip: pull nightly rates by zip.", "Engine: name strEngine here too."] },
  { path: "/portal/iul-engine", value: 8, frequency: 4, conditions: "Overfunding capacity for ten years and an accumulation goal beyond qualified plans.", connectTo: ["Time machine: link historical crediting both ways.", "Mechanism dossier: cross-link policy-loan.", "Live: carrier cap/participation sheets dated."] },
  { path: "/portal/iul-vs-roth", value: 8, frequency: 5, conditions: "Already maxing a Roth, or ineligible for one.", connectTo: ["Erosion: tax odds should drive the comparison.", "Genome: already linked."] },
  { path: "/portal/policy-cost-lab", value: 8, frequency: 3, conditions: "Holding or considering a permanent policy and wanting the cost decomposed.", connectTo: ["Provenance: trace the cost-of-insurance line.", "Carrier registry: pull the product's charges from a dated source."] },
  { path: "/portal/policy-loans", value: 7, frequency: 2, conditions: "Cash value over $50k and a use for it.", connectTo: ["Mechanism: link to /portal/mechanism/policy-loan both ways.", "Thresholds: use policy-loan-value and the wash-loan variant.", "Planner: the policy:borrow stage should open this page."] },
  { path: "/portal/long-term-care", value: 9, frequency: 6, conditions: "Fifty-five and older, or caring for a parent.", connectTo: ["Longevity engine: joint survival odds.", "Zip: cost by zip is there; expose on the household page.", "Genome: link from the protection strategies."] },
  { path: "/portal/carrier-ratings", value: 7, frequency: 4, conditions: "Any purchase of a permanent policy or annuity.", connectTo: ["Live: A.M. Best and S&P on a sweep with dates.", "Engine: carrierRatings.ts exists and is untested."] },
  { path: "/portal/fia-top10", value: 7, frequency: 4, conditions: "Conservative appetite with a lump to place.", connectTo: ["Live: rate sheets dated; the ten move monthly.", "Genome: link from the guaranteed-growth strategies."] },
  { path: "/portal/myga-fixed-rate", value: 7, frequency: 5, conditions: "A CD alternative decision, any age.", connectTo: ["Live: rates dated.", "Tested: mygaWaterfall.ts has no test."] },
  { path: "/portal/index-strategies", value: 7, frequency: 3, conditions: "Choosing a crediting method on an indexed product.", connectTo: ["Already traced in provenance; add a genome link."] },
  { path: "/portal/mortgage-killer", value: 8, frequency: 7, conditions: "Any mortgage and any surplus.", connectTo: ["Mechanism: cross-link velocity-heloc dossier.", "Thresholds: heloc-cltv and the interest-calculation variant.", "Test: mortgageKiller.ts has none — the highest-traffic untested engine."] },
  { path: "/portal/mortgage-ledger", value: 8, frequency: 6, conditions: "Any mortgage the household wants to see by the dollar.", connectTo: ["Planner: velocity stages should cite the ledger's interest line."] },
  { path: "/portal/liquidity-routes", value: 7, frequency: 3, conditions: "Needing capital without a bank underwriting event.", connectTo: ["Alt-credit: merge or cross-link; they overlap.", "Genome: link from the liquidity factor."] },
  { path: "/portal/alt-credit", value: 8, frequency: 3, conditions: "Rental owner declined by, or done with, conventional lenders.", connectTo: ["Providers: the 39 dossier records should link into the directory.", "Thresholds: each lender's seasoning/LTV should appear on its record."] },
  { path: "/portal/zip-engine", value: 9, frequency: 5, conditions: "Any property decision in a named zip.", connectTo: ["Genome: link from the property strategies.", "Planner: appreciation input should default from the zip series."] },
  { path: "/portal/real-estate-mogul", value: 8, frequency: 3, conditions: "Intending to own more than three doors.", connectTo: ["Planner: this IS a sequence; route the mogul model through it.", "Provenance: trace the equity line."] },
  { path: "/portal/rental-enterprise", value: 8, frequency: 3, conditions: "Five or more rentals, or the plan to get there.", connectTo: ["Planner: the blanket-refinance stage should hand the pool across.", "Thresholds: partial-release clause surfaced here."] },
  { path: "/portal/short-term-rentals", value: 7, frequency: 3, conditions: "Considering nightly rental in a specific market.", connectTo: ["STR tax page: link both ways.", "Genome: link."] },
  { path: "/portal/house-recycling", value: 7, frequency: 3, conditions: "Owns a home with equity and wants a second without a second down payment.", connectTo: ["Mechanism: this is BRRRR on the primary; cross-link the dossier.", "Engine: name one."] },
  { path: "/portal/household-wealth", value: 7, frequency: 6, conditions: "Any household wanting the whole balance sheet on one page.", connectTo: ["Household genome: pair the spouses here.", "Test: householdWealth.ts has none."] },
  { path: "/portal/estate-tax", value: 8, frequency: 3, conditions: "Estate over the exemption, or a state with its own.", connectTo: ["Live: exemption inflation adjustment annually.", "Test: estateTaxEngine.ts has none."] },
  { path: "/portal/inheritance", value: 8, frequency: 5, conditions: "Expecting or planning an inheritance.", connectTo: ["Erosion: already fed; expose the tax-odds source on the page.", "Household genome: step-family factors."] },
  { path: "/portal/estate-planning", value: 7, frequency: 6, conditions: "Any household with dependants or property.", connectTo: ["Engine: name one.", "Trusts: link both ways.", "Brain: no group carries estate planning rules beyond the tax engine."] },
  { path: "/portal/business-owner", value: 8, frequency: 3, conditions: "Owns a business with income over $150k.", connectTo: ["QBI: link both ways.", "Career ledger: hand the practice figures across.", "Genome: link from the business strategies."] },
  { path: "/portal/career-path", value: 8, frequency: 4, conditions: "Choosing or changing a professional path; physicians, dentists, vets, lawyers.", connectTo: ["Forgiveness: hand the loan balance across.", "Genome: link from the career factor."] },
  { path: "/portal/wealth-genome", value: 9, frequency: 8, conditions: "Everyone, once, before any strategy page.", connectTo: ["Already the predictive hub; add the household pairing prompt on completion."] },
  { path: "/portal/genome-strategies", value: 9, frequency: 7, conditions: "After the genome; the page that says what to do.", connectTo: ["Planner: each fit strategy should open a pre-filled planner situation.", "Mechanisms: link each property strategy to its dossier."] },
  { path: "/portal/household-genome", value: 8, frequency: 5, conditions: "Any couple with shared assets.", connectTo: ["Planner: the primary-residence moves should show the veto weight.", "Consent: already gated; expose the record."] },
  { path: "/portal/infinite-banking", value: 8, frequency: 3, conditions: "Anyone who has heard the phrase and wants the arithmetic.", connectTo: ["Planner: link both ways.", "Thresholds: link the policy thresholds."] },
  { path: "/portal/mechanisms", value: 8, frequency: 5, conditions: "Any household choosing among capital mechanisms.", connectTo: ["Genome: strategy-fit should rank the five by the household's factors.", "Sphere: place it."] },
  { path: "/portal/sequence-planner", value: 9, frequency: 4, conditions: "Any portfolio owner, or a first-time household with a goal.", connectTo: ["Genome: seed the situation from the genome and the fact finder.", "Zip: default appreciation from the zip series.", "Providers: name the lender whose threshold each stage used."] },
  { path: "/portal/thresholds", value: 8, frequency: 3, conditions: "Before signing anything with a lender or provider.", connectTo: ["Lender directory: each variant's providedBy should link a verified record.", "Freshness: 90-day re-verification sweep with a flag."] },
  { path: "/portal/outside-forces", value: 8, frequency: 5, conditions: "Anyone who wants the macro inputs behind every projection, with sources.", connectTo: ["Planner: appreciation and rate inputs should default from here.", "Provenance: each series is a sourced step; expose as traces."] },
  { path: "/portal/time-machine", value: 8, frequency: 4, conditions: "Any indexed-product decision; what the last thirty years would have paid.", connectTo: ["Engine: name timeMachineEngine.ts; it has a test but the catalogue does not name it.", "IUL engine: link both ways."] },
  { path: "/portal/financial-assessment", value: 9, frequency: 9, conditions: "Everyone, first — before any strategy page is worth reading.", connectTo: ["Planner: the fact finder should emit a Situation.", "Genome: link on completion."] },
  { path: "/portal/how-a-figure-is-made", value: 8, frequency: 4, conditions: "Any client or advisor who wants to check a number.", connectTo: ["Three traces exist; every featured page should have one."] },
  { path: "/portal/ai-brain-hub", value: 8, frequency: 3, conditions: "Advisors and the owner; what the channels know.", connectTo: ["Integration scorecard: link both ways; the hub should show unwired groups."] },
];

export function rating(path: string): PageRating | undefined {
  return PAGE_RATINGS.find((r) => r.path === path);
}

export const RATED_COUNT = PAGE_RATINGS.length;

/**
 * The ratings above are judgments, not measurements, and are declared as such
 * so the shell does not print them as if they had a source.
 */
export const PAGE_RATINGS_SOURCES: readonly { label: string; url?: string; asOf?: string; note?: string }[] = [
  { label: "Assumption: every value and frequency rating (1 to 10) in the page ratings is the firm's own editorial judgment of what a page is worth to a household it suits and how often an ordinary household needs it; no external source" },
  { label: "The \"Live:\" items (FRED CPI, SSA COLA and bend points, CMS IRMAA thresholds, A.M. Best and S&P ratings, the SSA period life table) name data a page should be wired to; they are to-do items, not figures this module uses" },
];
