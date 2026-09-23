// ============================================================
// THE CALCULATOR CATALOGUE — one registry, no dead links.
//
// WHY THIS EXISTS. The catalogue page used to carry its list of calculators as
// hand-written JSX: a name, a blurb and a guessed URL, typed once and never
// checked again. Eighteen of its thirty-five cards pointed at routes that did
// not exist — /portal/iul-projection, /portal/oil-gas, /portal/myga-waterfall
// and the rest all 404'd, while the pages themselves sat on disk unrouted.
// Half the visible catalogue was broken, which is why the working set felt
// like nine calculators instead of sixty.
//
// A hand-typed list cannot be checked. This one can: `path` is verified
// against the real router by server/calculatorCatalog.test.ts, so an entry
// whose route does not exist fails the build rather than reaching a client.
// Adding a calculator means adding a row here and a route there — and if you
// forget the route, you find out from a test rather than from a customer.
//
// The `engine` field names the shared module that does the arithmetic, so the
// AI channels can say which engine produced a figure, and so a reader of this
// file can find the maths without searching.
// ============================================================

export type CalculatorCategory =
  | "retirement-income"
  | "tax"
  | "insurance"
  | "real-estate"
  | "estate-legacy"
  | "business"
  | "life-events"
  | "markets"
  | "diagnostics"
  | "practice";

export type CalculatorEntry = {
  /** Route path, without the leading slash's domain. Verified against the router by test. */
  path: string;
  name: string;
  /** One sentence, in the client's language, about what they get — not what it does. */
  blurb: string;
  category: CalculatorCategory;
  /** The shared engine module behind it, when one exists. Used for provenance in AI answers. */
  engine?: string;
  /** Show this one first inside its category. */
  featured?: boolean;
  /** Search terms a person would actually type. */
  keywords?: readonly string[];
};

export const CATEGORY_LABELS: Record<CalculatorCategory, string> = {
  "retirement-income": "Retirement & Income",
  tax: "Tax",
  insurance: "Insurance & Policy",
  "real-estate": "Real Estate & Property",
  "estate-legacy": "Estate & Legacy",
  business: "Business Owners",
  "life-events": "Life Events",
  markets: "Markets & Outside Forces",
  diagnostics: "Diagnostics & Scoring",
  practice: "Practice Tools",
};

export const CATEGORY_ORDER: readonly CalculatorCategory[] = [
  "retirement-income", "tax", "insurance", "real-estate", "estate-legacy",
  "business", "life-events", "markets", "diagnostics", "practice",
];

export const CATEGORY_BLURBS: Record<CalculatorCategory, string> = {
  "retirement-income": "What the money has to do once the earning stops, and in which order it comes out.",
  tax: "What is taken, when it is taken, and which of it is a choice rather than a rule.",
  insurance: "What a policy actually costs, actually credits, and actually pays — from the carrier's own filings.",
  "real-estate": "The house, the rentals, the mortgage, and the equity that is doing nothing.",
  "estate-legacy": "What survives you, what it costs to pass it on, and who is left deciding.",
  business: "The practice or the company as an asset: what it is worth, and how it leaves your hands.",
  "life-events": "The years that reorganise a plan whether it was ready or not.",
  markets: "The forces nobody in the room controls, measured rather than assumed.",
  diagnostics: "Where you actually stand before anything is recommended.",
  practice: "The advisor's side of the desk.",
};

export const CALCULATORS: readonly CalculatorEntry[] = [
  // ---------------- Retirement & Income ----------------
  { path: "/portal/recin", name: "Real Estate Intelligence Workspace", category: "real-estate", featured: false,
    blurb: "Borrower-side capacity, capital stack, stress, exit and sale analysis for a property portfolio, with every external figure traced to its source.",
    engine: "shared/realEstateCapacityEngine.ts", keywords: ["recin", "capacity", "dscr", "capital stack", "syndication", "stress", "refinance"] },
  { path: "/ultra-calculator", name: "The Decade Machine", category: "retirement-income", featured: true,
    blurb: "Every calculator in one machine, with chained 5/10/20/30-year windows that carry each number into the next.",
    engine: "shared/ultraEngine.ts", keywords: ["ultra", "everything", "mega", "decade", "all"] },
  { path: "/portal/income-for-life", name: "Tax-Free Income for Life", category: "retirement-income", featured: true,
    blurb: "What a lifetime income stream pays, from published payout rates, next to what the same money does elsewhere.",
    engine: "shared/incomeForLife.ts", keywords: ["lifetime", "guaranteed", "payout", "pension"] },
  { path: "/portal/retirement-projection", name: "Retirement Income Projection", category: "retirement-income",
    blurb: "Every income source laid on one timeline, so the gap shows up before you reach it.",
    engine: "shared/retirementDNA.ts", keywords: ["projection", "retire", "income"] },
  { path: "/portal/income-gap", name: "Income Gap Analyzer", category: "retirement-income",
    blurb: "The distance between what retirement costs you and what is guaranteed to arrive.",
    keywords: ["gap", "shortfall", "deficit"] },
  { path: "/portal/withdrawal-sequencing", name: "Withdrawal Sequencing", category: "retirement-income",
    blurb: "Which account to draw first. The order alone is worth years of spending.",
    keywords: ["order", "drawdown", "sequence"] },
  { path: "/portal/lifetime-income", name: "Lifetime Guaranteed Income", category: "retirement-income",
    blurb: "Income that cannot be outlived, priced against the joint survival odds for you and your spouse.",
    engine: "shared/longevityEngine.ts", keywords: ["annuity", "guaranteed", "survival"] },
  { path: "/portal/income-timeline", name: "Income Timeline", category: "retirement-income",
    blurb: "Every source, every start date, drawn on one line you can hand to your spouse.",
    keywords: ["timeline", "when", "start"] },
  { path: "/portal/retirement-guardrails", name: "Retirement Spending Guardrails", category: "retirement-income",
    blurb: "How much you can spend without the plan breaking, and what to change when a year goes badly.",
    keywords: ["spending", "safe withdrawal", "guardrail", "4%"] },
  { path: "/portal/social-security", name: "Social Security Optimizer", category: "retirement-income",
    blurb: "The claiming age for both spouses that pays the most across both lives, not just yours.",
    keywords: ["social security", "claiming", "62", "70", "fra"] },
  { path: "/portal/retirement-opportunities", name: "Retirement Opportunities", category: "retirement-income",
    blurb: "What is still available to you at your age that will not be available at the next one.",
    keywords: ["opportunity", "age", "window"] },
  { path: "/portal/ecological-drivers", name: "Ecological Drivers of Retirement Success", category: "retirement-income", featured: true,
    blurb: "The non-financial factors that decide whether a retirement works — health, purpose, relationships, place — measured beside the money.",
    keywords: ["ecological", "drivers", "success", "health", "purpose", "wellbeing"] },
  { path: "/portal/forgiveness", name: "Forgiveness Engine", category: "retirement-income",
    blurb: "What a plan can still recover from, and how many years it takes.",
    engine: "shared/forgiveness.ts", keywords: ["recovery", "mistake", "late start"] },

  // ---------------- Tax ----------------
  { path: "/portal/tax-waterfall", name: "Tax Waterfall", category: "tax", featured: true,
    blurb: "Your income falling through the brackets, and exactly where the next dollar lands.",
    engine: "shared/taxBracketEngine.ts", keywords: ["bracket", "waterfall", "marginal"] },
  { path: "/portal/roth-conversion", name: "Roth Conversion Ladder", category: "tax", featured: true,
    blurb: "Multi-year conversions with the tax cost of each year and the break-even against doing nothing.",
    keywords: ["roth", "conversion", "ladder", "ira"] },
  { path: "/portal/erosion", name: "The Erosion Engine", category: "tax", featured: true,
    blurb: "What tax and inflation take between now and then, from the record since 1946 rather than from an assumption.",
    engine: "shared/erosion.ts", keywords: ["erosion", "future tax", "rates", "inflation"] },
  { path: "/portal/tax-brackets", name: "Tax Bracket Visualizer", category: "tax",
    blurb: "Every bracket, every threshold, and how close you are to the next edge.",
    engine: "shared/taxBracketEngine.ts", keywords: ["bracket", "threshold"] },
  { path: "/portal/tax-combos", name: "Tax-Free Wealth Combinations", category: "tax", featured: true,
    blurb: "Which tax mechanisms stack legally, which cancel each other, and the order they have to run in.",
    keywords: ["combination", "stack", "tax free", "combo"] },
  { path: "/portal/tax-opportunities", name: "Tax Opportunity Detector", category: "tax",
    blurb: "Deductions and elections your situation qualifies for that nobody has claimed.",
    keywords: ["deduction", "missed", "opportunity"] },
  { path: "/portal/tax-loss-harvesting", name: "Tax-Loss Harvesting Scanner", category: "tax",
    blurb: "Losses worth taking this year, with the wash-sale window drawn.",
    keywords: ["harvest", "loss", "wash sale"] },
  { path: "/portal/tax-advantaged-growth", name: "Tax-Advantaged Growth", category: "tax",
    blurb: "The same dollar grown in each tax wrapper, side by side, over your actual horizon.",
    keywords: ["wrapper", "taxable", "deferred", "free"] },
  { path: "/portal/hot-income", name: "Hot Income", category: "tax",
    blurb: "The income taxed hardest, and what can be moved out of the way of it.",
    keywords: ["hot", "highest taxed", "ordinary"] },
  { path: "/portal/tax-schedule", name: "Tax Schedule", category: "tax",
    blurb: "The year's tax calendar with every date that costs money if it passes.",
    engine: "shared/taxSchedule.ts", keywords: ["deadline", "calendar", "due"] },
  { path: "/portal/medicare-irmaa", name: "Medicare IRMAA Planner", category: "tax",
    blurb: "The income cliffs that raise your Medicare premiums two years later, and how far you are from each.",
    keywords: ["irmaa", "medicare", "premium", "cliff"] },
  { path: "/portal/str-tax-eliminator", name: "Short-Term Rental Tax Eliminator", category: "tax",
    blurb: "The short-term rental material-participation route, with the hour counts it actually requires.",
    keywords: ["str", "material participation", "loophole", "rental"] },
  { path: "/portal/oil-gas", name: "Oil & Gas Deductions", category: "tax",
    blurb: "Intangible drilling costs and depletion, with what the deduction is worth at your bracket.",
    keywords: ["oil", "gas", "drilling", "idc", "depletion"] },
  { path: "/portal/qbi-optimizer", name: "QBI / Section 199A Optimizer", category: "tax", featured: true,
    blurb: "Twenty percent of what the practice earns — and which of the three rules is actually taking it away from you.",
    engine: "shared/qbiDeduction.ts", keywords: ["qbi", "199a", "pass through", "deduction", "sstb", "s corp"] },
  { path: "/portal/tax-return-upload", name: "Tax Return Reader", category: "tax",
    blurb: "Upload last year's return and the whole system fills itself in from it.",
    keywords: ["upload", "1040", "return", "import"] },

  // ---------------- Insurance & Policy ----------------
  { path: "/portal/iul-engine", name: "IUL Engine", category: "insurance", featured: true,
    blurb: "An indexed policy modelled from the carrier's own filed rates, caps, spreads and charges.",
    engine: "shared/policyMechanics.ts", keywords: ["iul", "indexed", "universal life"] },
  { path: "/portal/iul-projection", name: "IUL Projection", category: "insurance",
    blurb: "Year-by-year cash value, death benefit and charges, on the assumptions you choose and can see.",
    keywords: ["iul", "projection", "illustration"] },
  { path: "/portal/iul-historical", name: "IUL Historical Performance", category: "insurance",
    blurb: "What the crediting method would have done across every historical window, not just the good ones.",
    engine: "shared/indexCreditingData.ts", keywords: ["historical", "backtest", "iul", "credited"] },
  { path: "/portal/lookback-integrity", name: "Look-back Integrity", category: "insurance",
    blurb: "Move a backtest's start year and see how much of the result it was. Cherry-picked windows are flagged.",
    engine: "shared/lookbackIntegrity.ts", keywords: ["lookback", "backtest", "cherry-pick", "start year", "hindsight", "iul"] },
  { path: "/portal/iul-vs-roth", name: "IUL vs Roth", category: "insurance",
    blurb: "The two tax-free vehicles compared honestly, including where the Roth wins.",
    keywords: ["iul", "roth", "compare", "versus"] },
  { path: "/portal/policy-cost-lab", name: "Policy Cost Lab", category: "insurance", featured: true,
    blurb: "Every charge inside a policy, itemised by year — the number illustrations bury.",
    engine: "shared/policyMechanics.ts", keywords: ["cost", "charges", "coi", "fees"] },
  { path: "/portal/policy-review", name: "Policy Review", category: "insurance",
    blurb: "An in-force policy read against what it was sold as, and what it is doing now.",
    keywords: ["review", "in force", "existing"] },
  { path: "/portal/policy-loans", name: "Policy Loan Modeller", category: "insurance", featured: true,
    blurb: "Borrowing against a policy: the four loan types, what each one does to the collateral, and the year it stops working.",
    engine: "shared/policyLoanMechanics.ts",
    keywords: ["loan", "borrow", "wash", "declared", "participating", "indexed loan account", "alternative loan", "overloan", "phantom income"] },
  { path: "/portal/premium-financing", name: "Premium Financing", category: "insurance",
    blurb: "Leveraged premiums with the lending rate as a live input, and the rate at which it breaks.",
    keywords: ["financing", "leverage", "borrow", "premium"] },
  { path: "/portal/fia-collateral", name: "FIA as Collateral", category: "insurance",
    blurb: "A fixed indexed annuity pledged as collateral — the structure and its failure modes.",
    keywords: ["fia", "collateral", "pledge"] },
  { path: "/portal/long-term-care", name: "Long-Term Care Planner", category: "insurance", featured: true,
    blurb: "Care cost by your zip code, the settings rated, and what the rider on a policy actually pays.",
    engine: "shared/ltcEngine.ts", keywords: ["ltc", "long term care", "nursing", "rider"] },
  { path: "/portal/carrier-comparison", name: "Carrier Comparison", category: "insurance",
    blurb: "Carriers side by side on strength, history and the terms they actually filed.",
    keywords: ["carrier", "compare", "rating", "am best"] },
  { path: "/portal/carrier-ratings", name: "Carrier Strength", category: "insurance",
    blurb: "Financial strength ratings with the date each was issued.",
    keywords: ["rating", "strength", "solvency"] },
  { path: "/portal/index-strategies", name: "Index Strategy Comparison", category: "insurance",
    blurb: "Every crediting strategy a carrier offers, run over the same history.",
    engine: "shared/balancedIndexedAccount.ts", keywords: ["crediting", "strategy", "cap", "participation", "spread"] },
  { path: "/portal/fia-top10", name: "Fixed Indexed Annuity Top Ten", category: "insurance",
    blurb: "The ten fixed indexed annuities worth comparing, on their published caps, participation rates and spreads.",
    keywords: ["fia", "fixed indexed", "top 10", "cap", "participation"] },
  { path: "/portal/myga-fixed-rate", name: "MYGA Fixed Rates", category: "insurance",
    blurb: "Multi-year guaranteed rates from current rate sheets, laddered.",
    keywords: ["myga", "fixed", "cd", "guaranteed"] },
  { path: "/portal/myga-waterfall", name: "MYGA Waterfall", category: "insurance",
    blurb: "A MYGA ladder with each rung's maturity and what it rolls into.",
    keywords: ["myga", "ladder", "waterfall"] },
  { path: "/portal/annuity-explorer", name: "Annuity Explorer", category: "insurance",
    blurb: "Every annuity type explained by what it does for you, not by its name.",
    keywords: ["annuity", "explore", "types"] },
  { path: "/portal/income-annuity", name: "Income Annuity", category: "insurance",
    blurb: "Immediate and deferred income annuities priced against your own longevity.",
    keywords: ["spia", "dia", "income annuity"] },
  { path: "/portal/quick-quote", name: "Quick Quote", category: "insurance",
    blurb: "A fast indicative number before anybody fills in a form.",
    keywords: ["quote", "fast", "indicative"] },

  // ---------------- Real Estate & Property ----------------
  { path: "/portal/mortgage-killer", name: "Mortgage Killer", category: "real-estate", featured: true,
    blurb: "The recycle cycle that retires a mortgage early, with the interest it stops shown year by year.",
    engine: "shared/mortgageKiller.ts", keywords: ["mortgage", "payoff", "heloc", "recycle"] },
  { path: "/portal/mortgage-ledger", name: "The Mortgage Ledger", category: "real-estate", featured: true,
    blurb: "Four numbers off your statement, and exactly where every dollar of the payment goes — interest, principal, and what an extra payment really buys.",
    engine: "shared/mortgageLedger.ts", keywords: ["amortization", "amortisation", "interest only", "principal", "schedule", "extra payment", "payoff"] },
  { path: "/portal/liquidity-routes", name: "Liquidity Without the Bank", category: "real-estate", featured: true,
    blurb: "Fifteen legal routes to cash against property that do not run through a retail bank equity line — each leading with what it costs you.",
    engine: "shared/liquidityRoutes.ts", keywords: ["heloc alternative", "dscr", "private lender", "equity", "line of credit", "cash out", "no bank"] },
  { path: "/portal/alt-credit", name: "Alternative Lines of Credit for Rental Properties", category: "real-estate", featured: true,
    blurb: "Fifteen ways to raise capital against a rental portfolio without a bank equity line, fifteen ways to put that capital back out ranked by risk-adjusted return, and a ten-thousand-run simulator that charges you the line's interest for the months the money sits idle.",
    engine: "shared/altCredit/simulator.ts",
    keywords: ["alternative line of credit", "rental property", "dscr", "crypto loan", "stablecoin", "securities backed", "policy loan", "merchant lending", "private notes", "hard money", "cross collateral", "no bank"] },
  { path: "/portal/mortgage-killer-v3", name: "Mortgage Killer III", category: "real-estate",
    blurb: "The current build of the payoff engine with live rates from the Zip Engine.",
    keywords: ["mortgage", "v3", "payoff"] },
  { path: "/portal/zip-engine", name: "The Zip Engine", category: "real-estate", featured: true,
    blurb: "Your zip code's actual appreciation, rents and rates from FHFA, Zillow and Freddie Mac.",
    engine: "shared/zipEngine.ts", keywords: ["zip", "appreciation", "rent", "local", "zhvi"] },
  { path: "/portal/real-estate-mogul", name: "Real Estate Mogul", category: "real-estate", featured: true,
    blurb: "A multi-property portfolio built one door at a time, with the financing that makes each one possible.",
    keywords: ["mogul", "portfolio", "doors", "multi property"] },
  { path: "/portal/rental-enterprise", name: "Rental Enterprise", category: "real-estate",
    blurb: "Candidate markets ranked on the data, with FEMA risk and the cost of money included.",
    engine: "shared/rentalEnterprise.ts", keywords: ["rental", "enterprise", "market", "cash flow"] },
  { path: "/portal/short-term-rentals", name: "Short-Term Rentals", category: "real-estate",
    blurb: "Nightly-rate economics for a specific address, from the registries that publish them.",
    engine: "shared/strEngine.ts", keywords: ["airbnb", "str", "nightly", "vrbo"] },
  { path: "/portal/str-strategy", name: "STR Strategy", category: "real-estate",
    blurb: "The short-term rental plan end to end, including the tax position.",
    keywords: ["str", "strategy"] },
  { path: "/portal/house-recycling", name: "House Recycling", category: "real-estate",
    blurb: "Equity pulled out, put to work, and replaced — the cycle drawn to scale.",
    keywords: ["equity", "recycle", "refinance"] },
  { path: "/portal/household-wealth", name: "Household Wealth", category: "real-estate",
    blurb: "Everything the household owns and owes on one page, netted.",
    keywords: ["net worth", "household", "balance sheet"] },
  { path: "/portal/reverse-heloc", name: "Reverse HELOC", category: "real-estate",
    blurb: "Using home equity as retirement income, with the conditions that make it safe or unsafe.",
    keywords: ["heloc", "reverse", "equity income"] },
  { path: "/portal/real-estate", name: "Real Estate Desk", category: "real-estate",
    blurb: "Every property tool in one place, sharing one set of your numbers.",
    keywords: ["property", "desk", "all"] },

  // ---------------- Estate & Legacy ----------------
  { path: "/portal/estate-tax", name: "Estate Tax", category: "estate-legacy", featured: true,
    blurb: "What the estate owes at today's exemption and at the one scheduled to replace it.",
    keywords: ["estate tax", "exemption", "sunset", "death tax"] },
  { path: "/portal/estate-planning", name: "Estate Planning", category: "estate-legacy",
    blurb: "The whole estate picture: documents, titling, beneficiaries and the order to fix them in.",
    keywords: ["estate", "plan", "will", "trust"] },
  { path: "/portal/estate-flow", name: "Estate Flow Chart", category: "estate-legacy",
    blurb: "Where each asset goes when you die, drawn — including the ones that go somewhere you did not intend.",
    keywords: ["flow", "chart", "who gets"] },
  { path: "/portal/trusts", name: "Trusts", category: "estate-legacy",
    blurb: "Which trust does which job, in plain language, with what each one costs to run.",
    keywords: ["trust", "ilit", "slat", "grat", "crt"] },
  { path: "/portal/inheritance", name: "The Inheritance Engine", category: "estate-legacy", featured: true,
    blurb: "What you expect to inherit, itemised by asset class, with taxability, timing and what inflation does to it first.",
    engine: "shared/inheritanceEngine.ts", keywords: ["inherit", "expect", "parents", "legacy"] },
  { path: "/portal/multi-gen-wealth", name: "Multi-Generational Transfer", category: "estate-legacy",
    blurb: "Money moving across three generations, and where each transfer is taxed.",
    keywords: ["dynasty", "generation", "gst", "grandchildren"] },
  { path: "/portal/beneficiary-optimization", name: "Beneficiary Optimization", category: "estate-legacy",
    blurb: "Who is named on what, and what the ten-year rule does to each of them.",
    keywords: ["beneficiary", "10 year", "stretch", "inherited ira"] },
  { path: "/portal/charitable-giving", name: "Charitable Giving Optimizer", category: "estate-legacy",
    blurb: "The most tax-efficient way to give what you were giving anyway.",
    keywords: ["charity", "daf", "crt", "donate", "appreciated"] },
  { path: "/portal/divorce-ilit", name: "Divorce & ILIT Strategy", category: "estate-legacy",
    blurb: "Protecting an insurance trust through a divorce without breaking it.",
    keywords: ["divorce", "ilit", "trust", "protect"] },
  { path: "/portal/estate-document-gen", name: "Estate Document Generator", category: "estate-legacy",
    blurb: "Draft documents for an attorney to review — a starting point, never a substitute.",
    keywords: ["document", "draft", "will"] },

  // ---------------- Business Owners ----------------
  { path: "/portal/business-owner", name: "Business Owner Planning", category: "business", featured: true,
    blurb: "The plan for someone whose largest asset is the thing they work at every day.",
    keywords: ["business", "owner", "practice", "company"] },
  { path: "/portal/succession-planning", name: "Succession Planning", category: "business",
    blurb: "Handing the business on: to whom, for what, and over how long.",
    keywords: ["succession", "exit", "sell", "transition"] },
  { path: "/portal/physicians-edge", name: "The Physician's Edge", category: "business",
    blurb: "Built for the clinical population: the debt, the late start, the liability, the exit.",
    engine: "shared/careerEngine.ts", keywords: ["physician", "doctor", "surgeon", "dentist"] },
  { path: "/portal/career-path", name: "The Career Ledger", category: "business",
    blurb: "What the training actually cost, what the years bought, and your true hourly rate against peers.",
    engine: "shared/careerEngine.ts", keywords: ["career", "training", "hourly", "peer", "residency"] },

  // ---------------- Life Events ----------------
  { path: "/portal/divorce-calculator", name: "Divorce Recovery", category: "life-events",
    blurb: "What the split leaves, and the fastest honest route back.",
    keywords: ["divorce", "split", "separation"] },
  { path: "/portal/divorce-recovery", name: "Divorce Recovery Planner", category: "life-events",
    blurb: "The longer-form divorce plan, including the assets that are harder to divide than they look.",
    keywords: ["divorce", "planner", "qdro"] },
  { path: "/portal/wealth-genome", name: "The Wealth Genome", category: "life-events", featured: true,
    blurb: "Twenty-one factors — durability, obligation, structure, disposition — weighted into a shape that is yours and nobody else's.",
    engine: "shared/wealthGenomeFactors.ts", keywords: ["genome", "profile", "factors", "shape", "personality"] },
  { path: "/portal/genome-strategies", name: "What the Genome Says to Do", category: "diagnostics", featured: true,
    blurb: "Twenty-four strategies scored against the genome — property, policies, credit arbitrage, tax, markets — each with its confidence, its gates, who it is wrong for, and whether this firm actually does it.",
    engine: "shared/genomeStrategyFit.ts",
    keywords: ["strategy fit", "what should i do", "allocation", "how much", "bitcoin", "annuity", "oil and gas", "iul", "rental", "roth conversion", "1031", "personality", "temperament"] },
  { path: "/portal/household-genome", name: "Wealth Genome Pairing Protocol", category: "diagnostics", featured: true,
    blurb: "Both spouses read separately, weighted per pot of money by who owns it, who bears the loss and who depends on it — with the divergences that will end a plan named before it is chosen.",
    engine: "shared/householdGenome.ts",
    keywords: ["spouse", "husband", "wife", "partner", "couple", "household", "marital", "joint", "pairing", "consent", "his ira", "her 401k", "home equity", "who decides", "friction", "conflict"] },
  { path: "/portal/infinite-banking", name: "Infinite Banking", category: "real-estate", featured: true,
    blurb: "Five capital mechanisms, a twenty-year simulation whose headline output is the year the sequence breaks, and eighty sequenced combinations with the bottleneck each one relieves.",
    engine: "shared/cycleEngine.ts",
    keywords: ["infinite banking", "be your own bank", "policy loan", "velocity banking", "brrrr", "cycle", "recycle", "equity share", "seller financing", "wrap", "cash value", "whole life", "capital cycle", "break year"] },
  { path: "/portal/mechanisms", name: "The Five Mechanisms", category: "real-estate", featured: true,
    blurb: "Every strategy rated twice — how much it is worth to someone it suits, and how often a normal household actually needs it. Those are different numbers and they are kept apart.",
    engine: "shared/mechanismDossiers.ts",
    keywords: ["strategies", "mechanisms", "compare", "which strategy", "rating", "how often", "worth it", "providers", "companies", "lenders", "carriers", "step by step", "how it works"] },
  { path: "/portal/mechanism/policy-loan", name: "Policy Loan Cycle — How It Works", category: "insurance",
    blurb: "Six steps from designing the policy to the year the loan balance meets the cash value, with the contract clause governing each one.",
    engine: "shared/mechanismDossiers.ts",
    keywords: ["policy loan", "infinite banking", "whole life", "paid-up additions", "seven-pay", "MEC", "direct recognition", "cash value", "lapse", "mutual carrier"] },
  { path: "/portal/mechanism/velocity-heloc", name: "Velocity Banking — How It Works", category: "real-estate",
    blurb: "Five steps, the average-daily-balance arithmetic behind them, and the one condition without which the whole thing produces nothing.",
    engine: "shared/mechanismDossiers.ts",
    keywords: ["velocity banking", "heloc", "first lien heloc", "all in one loan", "sweep", "average daily balance", "pay off mortgage early", "surplus"] },
  { path: "/portal/mechanism/brrrr-dscr", name: "BRRRR with DSCR — How It Works", category: "real-estate",
    blurb: "Seven steps from acquisition to repeat, including the seasoning wait and the renovation uplift that decides whether the cycle grows or shrinks.",
    engine: "shared/mechanismDossiers.ts",
    keywords: ["brrrr", "dscr", "refinance", "seasoning", "after repair value", "arv", "rental", "cash out", "uplift", "debt service coverage"] },
  { path: "/portal/mechanism/equity-share", name: "Equity Share Agreements — How It Works", category: "real-estate",
    blurb: "Six steps including the two covenants nobody markets: no further encumbrance, and settlement on sale.",
    engine: "shared/mechanismDossiers.ts",
    keywords: ["equity share", "home equity investment", "hei", "shared appreciation", "no monthly payment", "settlement", "balloon", "covenant"] },
  { path: "/portal/mechanism/seller-wrap", name: "Seller Financing and Wraps — How It Works", category: "real-estate",
    blurb: "Six steps from agreeing terms to the balloon, with the due-on-sale exposure stated where it actually arises.",
    engine: "shared/mechanismDossiers.ts",
    keywords: ["seller financing", "wrap", "wraparound", "owner financing", "due on sale", "note", "hypothecation", "installment sale", "servicing"] },
  { path: "/portal/sequence-planner", name: "The Sequence Planner", category: "real-estate", featured: true,
    blurb: "Your portfolio, your goal, every legal sequence up to twenty-four stages — ranked, with capital in and out, the obligation created, the months, and what to watch at each stage. Covenants enforced per property, so thirty houses is thousands of legal plans, counted on the screen.",
    engine: "shared/sequencePlanner.ts",
    keywords: ["sequence", "planner", "portfolio", "30 houses", "pay off mortgages", "expand", "double", "blanket loan", "portfolio loan", "sell", "refinance", "stages", "plan", "which order", "what next"] },
  { path: "/portal/thresholds", name: "The Thresholds", category: "real-estate",
    blurb: "Every gate a mechanism has to clear, the standard number, every documented way it is lower, and the ones that are a statute or somebody else's contract. Each figure links the page it was read from.",
    engine: "shared/thresholds.ts",
    keywords: ["seasoning", "delayed financing", "ltv", "dscr", "coverage", "due on sale", "garn st germain", "seven pay", "mec", "blanket", "partial release", "ten property limit", "loophole", "exception"] },
  { path: "/portal/integration-scorecard", name: "The Integration Scorecard", category: "practice",
    blurb: "Every page scored on ten dimensions read from the code — routed, engine, brain, tested, genome, cross-linked, sphere, live data, provenance — beside what it is worth and how often it is needed. The gap is the work list, and every missing item names a file.",
    engine: "shared/pageRatings.ts",
    keywords: ["integration", "scorecard", "audit", "wired", "connections", "10 out of 10", "gaps", "what is missing", "brain coverage", "test coverage"] },

  // ---------------- Markets & Outside Forces ----------------
  { path: "/portal/outside-forces", name: "Outside Forces", category: "markets", featured: true,
    blurb: "Inflation, credit, money supply and the rest — twelve weighted sources each, none of them opinions.",
    engine: "server/outsideForces.ts", keywords: ["inflation", "credit", "money supply", "forces", "macro"] },
  { path: "/portal/inflation", name: "Inflation Analysis", category: "markets",
    blurb: "What inflation does to this specific plan, on the forty-year record rather than a flat assumption.",
    keywords: ["inflation", "cpi", "purchasing power"] },
  { path: "/portal/time-machine", name: "The Time Machine", category: "markets", featured: true,
    blurb: "Run your plan through history: start in any year, live through what actually happened.",
    keywords: ["time machine", "history", "what if", "backtest"] },
  { path: "/portal/time-machine-ag49", name: "Time Machine (AG-49)", category: "markets",
    blurb: "The same history under the illustration rules carriers are actually bound by.",
    keywords: ["ag49", "illustration", "rules"] },
  { path: "/portal/index-backtester", name: "Index Backtester", category: "markets",
    blurb: "Any index, any crediting method, any window — with the losing windows shown too.",
    engine: "shared/indexCreditingData.ts", keywords: ["backtest", "index", "sp500", "history"] },
  { path: "/portal/crypto-corner", name: "Cryptocurrency Corner", category: "markets",
    blurb: "Where digital assets sit inside a plan that has to survive a bad decade — allocation kept separate from enthusiasm.",
    keywords: ["crypto", "bitcoin", "digital assets", "allocation"] },
  { path: "/portal/crypto-cycle", name: "Crypto Cycle", category: "markets",
    blurb: "Where the cycle has been, with the allocation question kept separate from the enthusiasm.",
    keywords: ["crypto", "bitcoin", "cycle"] },
  { path: "/portal/market-pulse", name: "Market Pulse", category: "markets",
    blurb: "Today's readings on the series this system actually uses.",
    keywords: ["market", "today", "live", "rates"] },

  // ---------------- Diagnostics & Scoring ----------------
  { path: "/portal/financial-assessment", name: "The Fact Finder", category: "diagnostics", featured: true,
    blurb: "The full picture. Everything else on this site gets better the moment this is done.",
    engine: "shared/clientFactFinder.ts", keywords: ["fact finder", "assessment", "intake", "profile"] },
  { path: "/portal/financial-vitals", name: "Financial Vitals", category: "diagnostics",
    blurb: "The handful of numbers that say whether this is working, checked like blood pressure.",
    keywords: ["vitals", "score", "health", "check"] },
  { path: "/portal/risk-tolerance", name: "Risk Tolerance", category: "diagnostics",
    blurb: "Not how much risk you say you can take — how much you took the last time it was real.",
    keywords: ["risk", "tolerance", "questionnaire"] },
  { path: "/portal/risk-score", name: "Risk Score", category: "diagnostics",
    blurb: "One number for the risk actually sitting in the portfolio today.",
    keywords: ["risk", "score", "portfolio"] },
  { path: "/portal/strategy-combos", name: "Strategy Combinations", category: "diagnostics",
    blurb: "Which strategies your facts qualify for, which pairs amplify, and which pairs cancel.",
    keywords: ["combination", "recommender", "which", "fit"] },
  { path: "/portal/scenario-side-by-side", name: "Scenario Side by Side", category: "diagnostics",
    blurb: "Two futures on one screen, with only the line that differs highlighted.",
    keywords: ["scenario", "compare", "side by side"] },
  { path: "/portal/strategy", name: "The Strategy Lab", category: "diagnostics",
    blurb: "Build a strategy from the pieces and watch every other number on the site move with it.",
    keywords: ["strategy", "lab", "build", "experiment"] },
  { path: "/portal/strategy-compare", name: "Strategy Compare", category: "diagnostics",
    blurb: "Any two strategies against the same facts and the same assumptions.",
    keywords: ["compare", "strategy", "versus"] },
  { path: "/portal/goals-planning", name: "Goals-Based Planning", category: "diagnostics",
    blurb: "Start from what the money is for, and work back to what it has to do.",
    keywords: ["goals", "planning", "purpose"] },

  // ---------------- Practice Tools ----------------
  { path: "/portal/advisor-income-calculator", name: "Advisor Income Calculator", category: "practice",
    blurb: "What a book of this shape actually pays the advisor who builds it.",
    keywords: ["advisor", "income", "production"] },
  { path: "/portal/commission-calculator", name: "Commission Calculator", category: "practice",
    blurb: "Compensation on a case, itemised.",
    keywords: ["commission", "comp", "payout"] },
  { path: "/portal/meeting-prep", name: "Meeting Prep", category: "practice",
    blurb: "Everything about this client on one page, ordered for the next forty minutes.",
    keywords: ["meeting", "prep", "agenda"] },
  { path: "/portal/whisper-coach", name: "Whisper Coach", category: "practice",
    blurb: "Live coaching in the ear during a call — signals read, arc tracked, and when to stop talking.",
    engine: "shared/nlpBrain.ts", keywords: ["coach", "live", "call", "whisper"] },
  { path: "/portal/deal-room", name: "Deal Room", category: "practice",
    blurb: "The case in progress, with everything it still needs listed.",
    keywords: ["deal", "case", "pipeline"] },
  { path: "/portal/auto-closer", name: "Auto Closer", category: "practice",
    blurb: "The follow-up sequence that runs itself after the meeting.",
    keywords: ["close", "follow up", "sequence"] },
  { path: "/portal/interop-engine", name: "Interop Engine", category: "practice",
    blurb: "How every calculator on this site hands its numbers to the next one.",
    keywords: ["interop", "shared", "carry forward"] },
  { path: "/portal/how-a-figure-is-made", name: "How a Figure Gets Made", category: "practice", featured: true,
    blurb: "Three real figures taken apart step by step — what you told us, what came from a document, what the law decided, and what we worked out.",
    engine: "shared/provenance.ts", keywords: ["provenance", "source", "how", "trace", "audit", "where did that come from", "trust"] },
  { path: "/portal/ai-brain-hub", name: "The AI Brain Hub", category: "practice", featured: true,
    blurb: "The twelve channels, the language layer and the engines behind every answer this site gives.",
    engine: "shared/compositeMind.ts", keywords: ["ai", "brain", "minds", "nlp", "hub"] },
] as const;

export const CALCULATOR_COUNT = CALCULATORS.length;

export function byCategory(category: CalculatorCategory): CalculatorEntry[] {
  const inCat = CALCULATORS.filter((c) => c.category === category);
  return [...inCat].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name));
}

export function featured(): CalculatorEntry[] {
  return CALCULATORS.filter((c) => c.featured);
}

export function calculator(path: string): CalculatorEntry | undefined {
  return CALCULATORS.find((c) => c.path === path);
}

/** Search over name, blurb and keywords. Empty query returns everything. */
export function searchCalculators(query: string): CalculatorEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...CALCULATORS];
  return CALCULATORS.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.blurb.toLowerCase().includes(q) ||
    (c.keywords ?? []).some((k) => k.includes(q)) ||
    CATEGORY_LABELS[c.category].toLowerCase().includes(q));
}

/** Counts per category, for the catalogue header. */
export function categoryCounts(): Array<{ category: CalculatorCategory; label: string; count: number }> {
  return CATEGORY_ORDER.map((category) => ({
    category, label: CATEGORY_LABELS[category], count: CALCULATORS.filter((c) => c.category === category).length,
  }));
}
