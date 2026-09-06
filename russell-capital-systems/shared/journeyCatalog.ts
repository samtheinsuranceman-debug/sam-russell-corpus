// ============================================================
// JOURNEY CATALOG — the pages the Financial Librarian can send a client to.
//
// Every entry is a real route in the app. `tags` are the topics a client's
// questions and fact-finder signals are matched against; `kind` tells the
// librarian whether a page teaches, calculates, compares, or protects, so a
// journey can be sequenced (understand → measure → compare → decide → protect).
// `builds` is a soft ordering weight: lower numbers belong earlier in a journey.
// ============================================================

export type PageKind = "orientation" | "education" | "calculator" | "comparison" | "protection" | "legacy" | "review";

export type JourneyPage = {
  id: string;
  path: string;
  title: string;
  purpose: string;
  kind: PageKind;
  tags: string[];
  builds: number; // 0 = start of any journey … 9 = closing/review
};

export const JOURNEY_CATALOG: JourneyPage[] = [
  // ── orientation ──────────────────────────────────────────────────────────
  { id: "assessment", path: "/portal/financial-assessment", title: "Financial Assessment", purpose: "Your complete financial picture — the foundation every answer rests on.", kind: "orientation", tags: ["start", "assessment", "everything"], builds: 0 },
  { id: "arrival", path: "/portal/the-arrival", title: "The Arrival", purpose: "Orientation and calibration: what the plan will do and in what order.", kind: "orientation", tags: ["start", "orientation", "goals"], builds: 0 },
  { id: "mirror", path: "/portal/the-mirror", title: "The Mirror", purpose: "Your personal dashboard — where you stand today, in one view.", kind: "orientation", tags: ["start", "dashboard", "net-worth", "goals"], builds: 0 },
  { id: "wealth-genome", path: "/portal/wealth-genome", title: "Wealth Genome Analysis", purpose: "Eight-dimension financial health score: where you are strong and where the plan must work hardest.", kind: "orientation", tags: ["start", "score", "risk", "tax", "insurance", "estate", "debt", "retirement"], builds: 1 },
  { id: "russell-number", path: "/portal/russell-number", title: "Russell Number", purpose: "A single number that tracks whether the coordinated plan is on course.", kind: "review", tags: ["score", "progress", "review"], builds: 8 },

  // ── taxes ────────────────────────────────────────────────────────────────
  { id: "tax-waterfall", path: "/portal/tax-waterfall", title: "Tax Waterfall", purpose: "How income flows through brackets today, and what changes the order of the buckets.", kind: "education", tags: ["tax", "income", "brackets", "waterfall"], builds: 2 },
  { id: "roth-conversion", path: "/portal/roth-conversion", title: "Roth Strategies", purpose: "Six ways to convert tax-deferred money into tax-free money, and when each fits.", kind: "calculator", tags: ["tax", "roth", "conversion", "retirement", "tax-free"], builds: 4 },
  { id: "tax-advantaged-growth", path: "/portal/tax-advantaged-growth", title: "Tax-Advantaged Growth", purpose: "Taxable vs tax-deferred vs tax-free growth over decades, side by side.", kind: "comparison", tags: ["tax", "investments", "growth", "tax-free"], builds: 3 },
  { id: "hot-income", path: "/portal/hot-income", title: "Hot Income (Oil & Gas)", purpose: "How intangible drilling deductions can offset high W-2 income — and the risks that come with them.", kind: "education", tags: ["tax", "deduction", "oil-gas", "high-income"], builds: 5 },
  { id: "str-strategy", path: "/portal/str-strategy", title: "STR Tax Strategy", purpose: "Short-term-rental real estate as an active-income tax lever.", kind: "education", tags: ["tax", "real-estate", "deduction"], builds: 5 },
  { id: "tax-combos", path: "/portal/tax-combos", title: "100 Tax-Free Combos", purpose: "How the individual strategies combine — the coordinated plan is the product.", kind: "education", tags: ["tax", "tax-free", "combination", "strategy"], builds: 6 },

  // ── debt, mortgage, home equity ──────────────────────────────────────────
  { id: "mortgage-killer", path: "/portal/mortgage-killer", title: "Mortgage Killer", purpose: "Accelerated payoff: how the same payments retire the mortgage years sooner and what that interest is worth.", kind: "calculator", tags: ["mortgage", "debt", "interest", "home", "payoff"], builds: 3 },
  { id: "house-recycling", path: "/portal/house-recycling", title: "House Recycling", purpose: "Cycling home equity into a liquid, tax-advantaged war chest and back again.", kind: "calculator", tags: ["mortgage", "equity", "heloc", "war-chest", "iul", "liquidity"], builds: 4 },
  { id: "reverse-heloc", path: "/portal/reverse-heloc", title: "Reverse HELOC", purpose: "Using a credit line deliberately instead of accidentally.", kind: "education", tags: ["heloc", "equity", "liquidity", "debt"], builds: 4 },
  { id: "household-wealth", path: "/portal/household-wealth", title: "Household Wealth", purpose: "The whole household balance sheet in motion — income, debt, equity, and savings together.", kind: "calculator", tags: ["net-worth", "debt", "student-loans", "cash-flow", "household"], builds: 2 },
  { id: "real-estate-mogul", path: "/portal/real-estate-mogul", title: "Real Estate Mogul", purpose: "Rental and investment property modelled with leverage, tax, and cash flow.", kind: "calculator", tags: ["real-estate", "rental", "leverage"], builds: 5 },

  // ── retirement and income ────────────────────────────────────────────────
  { id: "retirement-drivers", path: "/portal/ecological-drivers", title: "Retirement Drivers", purpose: "The handful of variables that decide retirement outcomes — and which you control.", kind: "education", tags: ["retirement", "variables", "control", "volatility"], builds: 2 },
  { id: "income-gap", path: "/portal/income-gap", title: "Income Gap Analyzer", purpose: "Desired retirement income versus what today's assets will produce.", kind: "calculator", tags: ["retirement", "income", "gap", "goals"], builds: 3 },
  { id: "withdrawal-sequencing", path: "/portal/withdrawal-sequencing", title: "Withdrawal Sequencing", purpose: "Which bucket to draw first — the order changes lifetime taxes.", kind: "calculator", tags: ["retirement", "tax", "withdrawal", "sequence"], builds: 5 },
  { id: "lifetime-income", path: "/portal/lifetime-income", title: "Lifetime Income", purpose: "Income that cannot be outlived, and what it costs to guarantee it.", kind: "education", tags: ["retirement", "income", "guarantee", "annuity", "longevity"], builds: 5 },
  { id: "income-timeline", path: "/portal/income-timeline", title: "Income Timeline", purpose: "Every income source laid out year by year to retirement and beyond.", kind: "calculator", tags: ["retirement", "income", "timeline", "social-security"], builds: 4 },
  { id: "social-security", path: "/portal/social-security", title: "Social Security", purpose: "Claiming age, spousal strategy, and taxation of benefits.", kind: "calculator", tags: ["retirement", "social-security", "claiming"], builds: 4 },

  // ── volatility, risk, and protection ─────────────────────────────────────
  { id: "risk-tolerance", path: "/portal/risk-tolerance", title: "Risk Tolerance", purpose: "How much volatility you can actually live with — measured, not guessed.", kind: "education", tags: ["risk", "volatility", "behavior", "investments"], builds: 2 },
  { id: "market-stress-test", path: "/portal/market-stress-test", title: "Market Stress Test", purpose: "Your plan run through the worst historical markets: what breaks and what holds.", kind: "calculator", tags: ["risk", "volatility", "stress", "investments", "sequence-risk"], builds: 4 },
  { id: "ibbotson-charts", path: "/portal/ibbotson-charts", title: "Ibbotson Charts", purpose: "A century of returns by asset class — the evidence behind every projection.", kind: "education", tags: ["investments", "evidence", "history", "volatility"], builds: 3 },
  { id: "iul-vs-roth", path: "/portal/iul-vs-roth", title: "IUL vs Roth", purpose: "Two tax-free vehicles compared honestly: costs, floors, caps, access, and legacy.", kind: "comparison", tags: ["iul", "roth", "tax-free", "insurance", "comparison"], builds: 5 },
  { id: "iul-historical", path: "/portal/iul-historical", title: "IUL Historical", purpose: "How indexed life would have credited through real market history — floors and caps in action.", kind: "education", tags: ["iul", "volatility", "floor", "insurance"], builds: 4 },
  { id: "policy-loans", path: "/portal/policy-loans", title: "Policy Loans", purpose: "Tax-free access to cash value — how loans, wash loans, and repayment really work.", kind: "education", tags: ["iul", "liquidity", "war-chest", "tax-free", "loans"], builds: 6 },
  { id: "ai-policy-review", path: "/portal/ai-policy-review", title: "Policy Gap Analysis", purpose: "Existing life, disability, and liability coverage checked for gaps.", kind: "review", tags: ["insurance", "disability", "malpractice", "gaps", "protection"], builds: 6 },
  { id: "divorce-calculator", path: "/portal/divorce-calculator", title: "Divorce Devastation Engine", purpose: "What a divorce does to an unprotected plan — and what a protected one keeps.", kind: "protection", tags: ["divorce", "protection", "asset-protection"], builds: 6 },
  { id: "trusts", path: "/portal/trusts", title: "Trust Structures", purpose: "Revocable, irrevocable, ILIT, asset-protection trusts: which does what.", kind: "protection", tags: ["trust", "estate", "asset-protection", "creditor", "legacy"], builds: 7 },

  // ── strategy, comparison, decision ───────────────────────────────────────
  { id: "strategy-lab", path: "/portal/strategy", title: "Strategy Lab", purpose: "Your numbers inside the coordinated strategy engine.", kind: "calculator", tags: ["strategy", "plan", "coordination"], builds: 5 },
  { id: "strategy-compare", path: "/portal/strategy-compare", title: "Strategy Compare", purpose: "Two or more strategies side by side on the same assumptions.", kind: "comparison", tags: ["strategy", "comparison", "decision"], builds: 6 },
  { id: "scenarios", path: "/portal/scenarios", title: "Scenario Builder", purpose: "Change one variable at a time and watch the plan respond.", kind: "calculator", tags: ["variables", "control", "scenario", "sensitivity"], builds: 6 },
  { id: "time-machine", path: "/portal/time-machine-calculator", title: "Time Machine", purpose: "The plan viewed from the future: what each year of delay costs.", kind: "calculator", tags: ["time", "delay", "compounding", "urgency"], builds: 7 },
  { id: "business-owner", path: "/portal/business-owner", title: "Business Owner", purpose: "Entity, retirement plan design, and exit planning for practice owners.", kind: "calculator", tags: ["practice", "business", "entity", "succession", "cash-balance"], builds: 4 },
  { id: "physicians-edge", path: "/portal/physicians-edge", title: "Physician's Edge", purpose: "The strategies that matter most for physician income and liability.", kind: "education", tags: ["physician", "high-income", "malpractice", "student-loans"], builds: 2 },
  { id: "combo-recommender", path: "/portal/combo-recommender", title: "AI Combo Recommender", purpose: "Which strategy combination fits your facts — ranked.", kind: "review", tags: ["strategy", "combination", "recommendation"], builds: 7 },

  // ── legacy and closing ───────────────────────────────────────────────────
  { id: "estate-flow", path: "/portal/estate-flow", title: "Estate Flow Chart", purpose: "Where everything goes at death today, drawn as a flow — and where it should go.", kind: "legacy", tags: ["estate", "legacy", "heirs", "beneficiaries"], builds: 7 },
  { id: "beneficiary-optimization", path: "/portal/beneficiary-optimization", title: "Beneficiary Optimizer", purpose: "Beneficiary designations checked against the plan and the tax code.", kind: "legacy", tags: ["estate", "beneficiaries", "legacy"], builds: 7 },
  { id: "estate-tax", path: "/portal/estate-tax", title: "Estate Tax", purpose: "Whether the estate tax touches you, and the levers if it will.", kind: "calculator", tags: ["estate", "tax", "legacy"], builds: 7 },
  { id: "will-writer", path: "/portal/will-writer", title: "Will Writer", purpose: "Draft the documents that are missing.", kind: "legacy", tags: ["estate", "will", "documents"], builds: 8 },
  { id: "the-legacy", path: "/portal/the-legacy", title: "The Legacy", purpose: "What the money is for after you.", kind: "legacy", tags: ["legacy", "estate", "meaning"], builds: 8 },
  { id: "the-map", path: "/portal/the-map", title: "The Map", purpose: "Portfolio and allocation: the whole plan on one map.", kind: "review", tags: ["review", "allocation", "plan"], builds: 8 },
  { id: "the-brotherhood", path: "/portal/the-brotherhood", title: "The Brotherhood", purpose: "Community and accountability so the plan survives real life.", kind: "review", tags: ["review", "community", "behavior"], builds: 9 },
];

export const CATALOG_BY_ID: Record<string, JourneyPage> = Object.fromEntries(JOURNEY_CATALOG.map((p) => [p.id, p]));
