/**
 * Advisory Summary & Directory Data
 * 
 * Every tab/sub-tab in the platform is catalogued here with:
 * - Use case & utility description
 * - Unique problem it solves
 * - Result consistency assessment
 * - Hidden advantages
 * - Alternative uses
 * - Real-life accuracy rating
 * - Risk factors
 * - Differentiation from other tabs
 * - 1-10 ratings across 6 dimensions + total average
 * - Navigation metadata for personalized directory
 */

export interface TabRating {
  functionality: number;       // 1-10: Level of functionality
  efficiency: number;          // 1-10: Level of efficiency in problem solving
  predictability: number;      // 1-10: Level of predictability
  complexity: number;          // 1-10: Level of complexity
  comprehension: number;       // 1-10: Level of comprehension (ease of understanding)
  importance: number;          // 1-10: Level of importance
}

export interface SubTab {
  name: string;
  description: string;
  ratings: TabRating;
}

export interface TabSummary {
  id: string;
  name: string;
  path: string;
  category: string;
  categoryColor: string;
  icon: string;
  useCase: string;
  utility: string;
  uniqueProblem: string;
  resultConsistency: string;
  hiddenAdvantages: string[];
  alternativeUses: string[];
  realLifeAccuracy: string;
  riskFactors: string[];
  differentiation: string;
  ratings: TabRating;
  subTabs?: SubTab[];
  // Directory metadata
  experienceLevel: ("beginner" | "intermediate" | "advanced")[];
  goalTags: string[];
  clientTypes: string[];
  priority: number; // 1-10 how essential for a new advisor
  estimatedTimeMinutes: number;
  prerequisites: string[]; // other tab ids that should be visited first
}

export function computeAverage(r: TabRating): number {
  return Math.round(((r.functionality + r.efficiency + r.predictability + r.complexity + r.comprehension + r.importance) / 6) * 10) / 10;
}

export const CATEGORIES = [
  { id: "client-management", label: "Client Management", color: "blue" },
  { id: "iul-tools", label: "IUL & Life Insurance", color: "cyan" },
  { id: "real-estate", label: "Real Estate", color: "teal" },
  { id: "annuities", label: "Annuities & Insurance", color: "emerald" },
  { id: "intelligence", label: "Intelligence Tools", color: "purple" },
  { id: "sales", label: "Sales & Presentations", color: "rose" },
  { id: "tax-planning", label: "Tax Planning", color: "amber" },
  { id: "compliance", label: "Compliance & Admin", color: "slate" },
  { id: "oil-gas", label: "Oil & Gas", color: "orange" },
  { id: "market-data", label: "Market & Research", color: "indigo" },
] as const;

export const ADVISOR_GOALS = [
  "Grow my client base",
  "Close more sales",
  "Master IUL strategies",
  "Specialize in annuities",
  "Learn real estate strategies",
  "Tax planning for HNW clients",
  "Oil & gas investments",
  "Improve client presentations",
  "Streamline my workflow",
  "Compliance and documentation",
] as const;

export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "New Advisor (0-2 years)", description: "Just starting out, need fundamentals" },
  { id: "intermediate", label: "Growing Practice (3-7 years)", description: "Building momentum, expanding services" },
  { id: "advanced", label: "Established Practice (8+ years)", description: "Scaling operations, complex strategies" },
] as const;

export const CLIENT_TYPES = [
  "Retirees & Pre-Retirees",
  "High Net Worth Individuals",
  "Business Owners",
  "Young Professionals",
  "Real Estate Investors",
  "Oil & Gas Investors",
  "Families & Estate Planning",
] as const;

export const TAB_SUMMARIES: TabSummary[] = [
  // ═══════════════════════════════════════════════════════════════
  // CLIENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/portal/dashboard",
    category: "client-management",
    categoryColor: "blue",
    icon: "LayoutDashboard",
    useCase: "Central command center for your entire practice. See pipeline health, recent activity, client alerts, and key performance metrics at a glance.",
    utility: "Eliminates the need to check multiple screens. Every critical metric is surfaced in one view so you can prioritize your day in 30 seconds.",
    uniqueProblem: "Advisors waste 20-30 minutes daily hunting for what needs attention. The dashboard aggregates alerts, stale deals, upcoming meetings, and performance trends into a single actionable view.",
    resultConsistency: "High — data is pulled live from your client database and pipeline. Numbers update in real-time as you work.",
    hiddenAdvantages: [
      "Stale deal detection automatically flags opportunities going cold",
      "Revenue forecasting based on pipeline probability",
      "Quick-action buttons let you jump directly to any client or deal",
    ],
    alternativeUses: [
      "Morning standup tool — review your day's priorities",
      "Team performance monitoring for agency managers",
      "Client meeting prep — see full context before calls",
    ],
    realLifeAccuracy: "Very high. All data is sourced from your own entries and calculations. The dashboard reflects exactly what you've built.",
    riskFactors: [
      "Only as good as the data you enter — garbage in, garbage out",
      "Pipeline projections depend on accurate probability estimates",
    ],
    differentiation: "Unlike generic CRM dashboards, this is purpose-built for insurance and financial advisors with strategy-specific metrics.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Streamline my workflow", "Grow my client base"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Business Owners", "Young Professionals"],
    priority: 10,
    estimatedTimeMinutes: 5,
    prerequisites: [],
  },
  {
    id: "clients",
    name: "Client Management",
    path: "/portal/clients",
    category: "client-management",
    categoryColor: "blue",
    icon: "Users",
    useCase: "Complete client database with fact-finding, financial profiles, and strategy tracking. The foundation everything else builds on.",
    utility: "Centralizes all client data so every calculator and strategy engine auto-populates. Enter data once, use it everywhere.",
    uniqueProblem: "Advisors re-enter the same client data across 10 different tools. This eliminates that by creating a single source of truth that feeds every calculator on the platform.",
    resultConsistency: "Very high — client data persists and syncs across all tools automatically.",
    hiddenAdvantages: [
      "Fact-finder data auto-fills into Mortgage Killer, MYGA Waterfall, Tax Planning, and every other engine",
      "Client scoring identifies your best opportunities",
      "CSV import lets you migrate from other CRMs in minutes",
    ],
    alternativeUses: [
      "Compliance documentation — every client interaction is logged",
      "Household-level wealth analysis across multiple family members",
      "Lead scoring to prioritize outreach",
    ],
    realLifeAccuracy: "Exact — this is your own data. Accuracy depends entirely on the quality of information gathered during fact-finding.",
    riskFactors: [
      "Incomplete fact-finders lead to inaccurate strategy recommendations",
      "Client data should be updated annually for best results",
    ],
    differentiation: "Not just a contact list — it's a financial profile engine that powers every strategy tool on the platform.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    subTabs: [
      { name: "Client List", description: "Searchable, sortable database of all clients with quick-action buttons", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Fact Finder", description: "Comprehensive financial profile builder — income, assets, liabilities, goals, risk tolerance", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Client Detail", description: "Deep-dive view of individual client with all strategies, notes, and history", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
    ],
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Grow my client base", "Streamline my workflow"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Business Owners", "Young Professionals", "Real Estate Investors", "Oil & Gas Investors", "Families & Estate Planning"],
    priority: 10,
    estimatedTimeMinutes: 15,
    prerequisites: [],
  },
  {
    id: "pipeline",
    name: "Pipeline",
    path: "/portal/pipeline",
    category: "client-management",
    categoryColor: "blue",
    icon: "Kanban",
    useCase: "Visual sales pipeline with drag-and-drop deal tracking, AI closing scripts, and revenue forecasting.",
    utility: "Transforms chaotic deal tracking into a visual workflow. See exactly where every opportunity stands and what action to take next.",
    uniqueProblem: "Most advisors track deals in spreadsheets or their head. This creates a structured, visual pipeline with AI-generated closing scripts tailored to each deal's specifics.",
    resultConsistency: "High — pipeline stages are deterministic. AI closing scripts vary but are consistently relevant to the deal context.",
    hiddenAdvantages: [
      "AI closing scripts analyze the client's financial profile to generate personalized talking points",
      "Stale deal alerts prevent opportunities from falling through the cracks",
      "Revenue forecasting based on deal probability and stage",
    ],
    alternativeUses: [
      "Team management — assign deals to team members and track progress",
      "Meeting prep — generate talking points before client calls",
      "Performance tracking — measure conversion rates by stage",
    ],
    realLifeAccuracy: "Pipeline tracking is exact. AI closing scripts are directionally accurate but should be customized to your style.",
    riskFactors: [
      "AI scripts are suggestions, not guarantees — always personalize",
      "Pipeline accuracy depends on consistent stage updates",
    ],
    differentiation: "The only pipeline tool that generates insurance-specific closing scripts using the client's actual financial data from fact-finding.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Close more sales", "Grow my client base"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Business Owners"],
    priority: 9,
    estimatedTimeMinutes: 10,
    prerequisites: ["clients"],
  },

  // ═══════════════════════════════════════════════════════════════
  // IUL & LIFE INSURANCE TOOLS
  // ═══════════════════════════════════════════════════════════════
  {
    id: "iul-historical",
    name: "IUL Historical Performance",
    path: "/portal/iul-historical",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "History",
    useCase: "Shows how IUL policies would have performed using actual historical S&P 500 data with cap and floor mechanics. Proves the concept with real numbers.",
    utility: "Converts skeptical prospects by showing 'what would have happened' using decades of real market data instead of hypothetical illustrations.",
    uniqueProblem: "Clients don't trust hypothetical illustrations. This uses actual historical index data to show real performance under IUL cap/floor mechanics — creating 'truth numbers' that don't violate AG49.",
    resultConsistency: "Very high — calculations are deterministic based on historical data. Same inputs always produce same outputs.",
    hiddenAdvantages: [
      "Three-scenario comparison (conservative, moderate, aggressive) in one view",
      "Shows the power of 0% floor protection during market crashes",
      "Ibbotson-based methodology adds academic credibility",
    ],
    alternativeUses: [
      "Educational tool for client seminars and workshops",
      "Competitive comparison — show IUL vs. mutual funds during 2008",
      "Training tool for new advisors learning IUL mechanics",
    ],
    realLifeAccuracy: "High for historical periods. Forward projections are estimates based on historical patterns. Past performance does not guarantee future results.",
    riskFactors: [
      "Historical performance is not a guarantee of future results",
      "Cap rates change over time — current caps may differ from historical",
      "Policy charges and cost of insurance are not modeled here",
    ],
    differentiation: "Uses actual Ibbotson historical data rather than hypothetical illustration rates. Shows what DID happen, not what MIGHT happen.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    subTabs: [
      { name: "Performance Chart", description: "Visual chart of IUL growth vs. market index over selected time period", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Three Scenarios", description: "Side-by-side conservative, moderate, and aggressive cap scenarios", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Year-by-Year Detail", description: "Detailed annual breakdown of credits, caps, and floor protection", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
    ],
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Master IUL strategies", "Close more sales"],
    clientTypes: ["High Net Worth Individuals", "Business Owners", "Young Professionals"],
    priority: 8,
    estimatedTimeMinutes: 15,
    prerequisites: ["clients"],
  },
  {
    id: "index-strategies",
    name: "Index Strategy Comparison",
    path: "/portal/index-strategies",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "Layers",
    useCase: "Compare different index crediting strategies (S&P 500 cap, participation rate, spread, multiplier) side by side to find the optimal allocation.",
    utility: "Eliminates guesswork in index selection. Shows exactly how each strategy performs under different market conditions.",
    uniqueProblem: "Clients and advisors struggle to understand the difference between cap, participation, and spread strategies. This visualizes them side-by-side with real numbers.",
    resultConsistency: "Very high — mathematical calculations based on defined parameters.",
    hiddenAdvantages: [
      "Helps justify strategy recommendations with data",
      "Shows how blending strategies can optimize risk/return",
      "Reveals that 'highest cap' isn't always the best choice",
    ],
    alternativeUses: [
      "Carrier comparison — show how the same strategy performs across carriers",
      "Annual review tool — evaluate if current allocation is still optimal",
      "Training material for understanding index mechanics",
    ],
    realLifeAccuracy: "High for the mathematical modeling. Actual policy performance will vary based on carrier-specific factors.",
    riskFactors: [
      "Strategy parameters (caps, participation rates) change annually",
      "Does not account for policy charges",
      "Past index performance doesn't predict future results",
    ],
    differentiation: "The only tool that lets you visually compare 4+ index strategies simultaneously using actual historical data.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Master IUL strategies"],
    clientTypes: ["High Net Worth Individuals", "Business Owners"],
    priority: 7,
    estimatedTimeMinutes: 20,
    prerequisites: ["iul-historical"],
  },
  {
    id: "policy-loans",
    name: "Policy Loans",
    path: "/portal/policy-loans",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "Wallet",
    useCase: "Model tax-free policy loan distributions from IUL cash values. Shows how to create tax-free retirement income.",
    utility: "Demonstrates the 'bank on yourself' concept with real numbers. Shows clients how to access cash value without triggering taxes.",
    uniqueProblem: "Clients don't understand how policy loans work or why they're tax-advantaged. This visualizes the loan mechanics, interest arbitrage, and net income streams.",
    resultConsistency: "High — loan calculations are mathematical. Results depend on assumed crediting rates and loan rates.",
    hiddenAdvantages: [
      "Shows the spread between loan rate and crediting rate (arbitrage opportunity)",
      "Demonstrates why loans are preferable to withdrawals",
      "Models the impact of different loan amounts on policy sustainability",
    ],
    alternativeUses: [
      "Retirement income planning — show tax-free income streams",
      "Business planning — access capital without bank loans",
      "Education funding — tax-free access for college costs",
    ],
    realLifeAccuracy: "Moderate to high. Actual loan rates and crediting rates vary by carrier and year. Models use assumed rates.",
    riskFactors: [
      "Excessive loans can cause policy lapse (taxable event)",
      "Loan interest accrues and reduces death benefit",
      "Carrier loan rates may change",
    ],
    differentiation: "Specifically models IUL policy loan mechanics with visual breakdowns of the arbitrage opportunity.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Master IUL strategies", "Tax planning for HNW clients"],
    clientTypes: ["High Net Worth Individuals", "Business Owners", "Retirees & Pre-Retirees"],
    priority: 7,
    estimatedTimeMinutes: 15,
    prerequisites: ["iul-historical"],
  },
  {
    id: "premium-financing",
    name: "Premium Financing",
    path: "/portal/premium-financing",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "DollarSign",
    useCase: "Model premium financing strategies where clients borrow to fund large IUL policies, leveraging interest rate arbitrage.",
    utility: "Opens the door to jumbo IUL cases by showing how financing makes large premiums accessible. Turns $0 out-of-pocket into millions in coverage.",
    uniqueProblem: "High net worth clients have assets but don't want to liquidate them. Premium financing lets them use leverage to fund large policies while keeping assets invested.",
    resultConsistency: "Moderate — depends heavily on interest rate assumptions and crediting rate projections.",
    hiddenAdvantages: [
      "Shows clients how to get $5M+ in coverage with minimal out-of-pocket",
      "Models the exit strategy (when to pay off the loan)",
      "Demonstrates the wealth transfer multiplier effect",
    ],
    alternativeUses: [
      "Estate planning — fund ILIT with financed premiums",
      "Key person insurance — fund large corporate policies",
      "Wealth transfer — maximize death benefit with leverage",
    ],
    realLifeAccuracy: "Moderate. Interest rates, collateral requirements, and lending terms change frequently. Models should be updated with current rates.",
    riskFactors: [
      "Interest rate risk — rising rates can make financing uneconomical",
      "Collateral calls if asset values decline",
      "Carrier crediting rates may not exceed loan rates",
      "Complex strategy requiring ongoing monitoring",
    ],
    differentiation: "Purpose-built for insurance premium financing with exit strategy modeling — not a generic loan calculator.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["advanced"],
    goalTags: ["Master IUL strategies", "Tax planning for HNW clients"],
    clientTypes: ["High Net Worth Individuals", "Business Owners"],
    priority: 5,
    estimatedTimeMinutes: 25,
    prerequisites: ["iul-historical", "policy-loans"],
  },
  {
    id: "index-backtester",
    name: "Index Backtester",
    path: "/portal/index-backtester",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "BarChart3",
    useCase: "Backtest any index strategy against actual historical market data. Select specific indices, date ranges, caps, floors, and participation rates.",
    utility: "Provides evidence-based strategy selection. Instead of guessing which index to choose, test it against decades of real data.",
    uniqueProblem: "Carrier illustrations show hypothetical rates. This shows what ACTUALLY would have happened with specific index strategies over specific time periods.",
    resultConsistency: "Very high — deterministic calculations on historical data.",
    hiddenAdvantages: [
      "Test strategies across multiple market cycles (dot-com, 2008, COVID)",
      "Compare exotic indices against plain S&P 500",
      "Identify which strategies perform best in different market environments",
    ],
    alternativeUses: [
      "Due diligence tool — validate carrier index claims",
      "Client education — show why diversified index allocation matters",
      "Research tool — discover optimal cap/floor combinations",
    ],
    realLifeAccuracy: "Very high for historical periods. The backtester uses actual index values, not simulated data.",
    riskFactors: [
      "Past performance is not indicative of future results",
      "Some newer indices have limited historical data",
      "Backtesting doesn't account for policy charges",
    ],
    differentiation: "The only tool that lets you backtest specific IUL index strategies against actual market data with custom parameters.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 10, comprehension: 9, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Master IUL strategies"],
    clientTypes: ["High Net Worth Individuals", "Business Owners"],
    priority: 6,
    estimatedTimeMinutes: 20,
    prerequisites: ["iul-historical", "index-strategies"],
  },
  {
    id: "time-machine-calculator",
    name: "Time Machine Calculator",
    path: "/portal/time-machine-calculator",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "Clock",
    useCase: "Simulates what an IUL policy would look like TODAY if it had been started years ago, using actual historical returns. The 'what if you started 20 years ago' tool.",
    utility: "The most powerful closing tool on the platform. Shows clients the real dollar amounts they'd have today if they'd started an IUL in any past year.",
    uniqueProblem: "Clients say 'I wish I'd started earlier.' This tool shows them exactly what they missed — and what starting NOW will look like in 20 years based on the same historical patterns.",
    resultConsistency: "Very high — uses actual historical data for past periods. Future projections are estimates.",
    hiddenAdvantages: [
      "Creates urgency — shows the cost of waiting",
      "Uses 'truth numbers' from actual history, not hypotheticals",
      "Compliant with AG49 because it shows historical, not projected, performance",
    ],
    alternativeUses: [
      "Seminar presentation tool — show audience what they missed",
      "Annual review — show clients their policy's 'time machine' value",
      "Competitive comparison — IUL vs. what they actually earned in their 401k",
    ],
    realLifeAccuracy: "Very high for historical simulation. The 'what would have happened' numbers are based on actual index data.",
    riskFactors: [
      "Historical performance doesn't guarantee future results",
      "Policy charges and COI are simplified in the model",
      "Clients may have unrealistic expectations based on best historical periods",
    ],
    differentiation: "No other tool shows 'what your IUL would be worth today if you started in [year]' using actual historical data. This is the flagship closing tool.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 10, comprehension: 9, importance: 10 },
    subTabs: [
      { name: "Calculator", description: "Core time machine simulation with year selection and premium inputs", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 10, comprehension: 9, importance: 10 } },
      { name: "Comparison", description: "Side-by-side comparison of different start years", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 10, comprehension: 9, importance: 10 } },
    ],
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Master IUL strategies", "Close more sales"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Business Owners", "Young Professionals"],
    priority: 10,
    estimatedTimeMinutes: 10,
    prerequisites: [],
  },
  {
    id: "time-machine-ag49",
    name: "AG 49 Compounding",
    path: "/portal/time-machine-ag49",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "TrendingUp",
    useCase: "Demonstrates how IUL compounding works under AG49 regulatory limits. Shows the mathematical proof of tax-free compound growth.",
    utility: "Educates clients on why IUL compounding is powerful even with caps, and how the 0% floor creates asymmetric returns over time.",
    uniqueProblem: "Clients think capped returns mean limited growth. This shows how the floor protection + compound interest creates superior risk-adjusted returns over full market cycles.",
    resultConsistency: "Very high — pure mathematical modeling with regulatory-compliant assumptions.",
    hiddenAdvantages: [
      "Proves that 0% floor years are more valuable than they appear",
      "Shows the mathematical advantage of avoiding negative returns",
      "Demonstrates why average return ≠ compound return",
    ],
    alternativeUses: [
      "Training tool for understanding sequence-of-returns risk",
      "Seminar content — the math behind IUL",
      "Compliance-safe illustration methodology",
    ],
    realLifeAccuracy: "High for the mathematical concepts. Actual policy performance includes charges not modeled here.",
    riskFactors: [
      "Simplified model — doesn't include all policy charges",
      "AG49 regulations may change",
      "Cap rates are not guaranteed",
    ],
    differentiation: "Focuses specifically on the AG49 regulatory framework and proves the compounding advantage mathematically.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 10, comprehension: 9, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Master IUL strategies"],
    clientTypes: ["High Net Worth Individuals", "Business Owners"],
    priority: 6,
    estimatedTimeMinutes: 15,
    prerequisites: ["time-machine-calculator"],
  },
  {
    id: "time-machine-method",
    name: "Dual Illustration Method",
    path: "/portal/time-machine-method",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "Zap",
    useCase: "Shows the dual illustration methodology — comparing standard AG49 illustrations with Time Machine historical illustrations side by side.",
    utility: "Gives advisors two ways to present IUL: the compliant illustration AND the historical 'truth numbers.' Clients see both perspectives.",
    uniqueProblem: "Standard illustrations feel hypothetical and unconvincing. The dual method shows the regulated illustration alongside what actually happened historically.",
    resultConsistency: "High — both methods use defined calculation methodologies.",
    hiddenAdvantages: [
      "The contrast between standard and historical illustrations creates powerful 'aha moments'",
      "Fully compliant — shows the standard illustration alongside historical context",
      "Builds trust by showing transparency in methodology",
    ],
    alternativeUses: [
      "Compliance documentation — show you presented both perspectives",
      "Training tool — teach new advisors the difference between illustration types",
      "Carrier comparison — show how different carriers' illustrations compare to historical reality",
    ],
    realLifeAccuracy: "Standard illustration: moderate (hypothetical). Historical illustration: high (actual data).",
    riskFactors: [
      "Clients may anchor on the higher historical numbers",
      "Must clearly communicate that historical ≠ guaranteed",
      "Regulatory scrutiny if not presented properly",
    ],
    differentiation: "The only tool that presents standard and historical illustrations side-by-side for direct comparison.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 10, comprehension: 9, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Master IUL strategies", "Close more sales"],
    clientTypes: ["High Net Worth Individuals", "Business Owners"],
    priority: 5,
    estimatedTimeMinutes: 15,
    prerequisites: ["time-machine-calculator", "time-machine-ag49"],
  },
  {
    id: "retirement-income",
    name: "Retirement Income Projection",
    path: "/portal/retirement-income",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "Target",
    useCase: "Projects retirement income from IUL policy loans, showing year-by-year tax-free distributions and their impact on the policy.",
    utility: "Shows clients exactly how much tax-free income they can expect in retirement and for how long the policy can sustain distributions.",
    uniqueProblem: "Clients don't understand how IUL creates retirement income. This visualizes the distribution phase with specific dollar amounts and sustainability analysis.",
    resultConsistency: "Moderate to high — depends on assumed crediting rates during distribution phase.",
    hiddenAdvantages: [
      "Shows the tax advantage compared to 401k/IRA distributions",
      "Models the 'income gap' between Social Security and desired lifestyle",
      "Demonstrates policy sustainability under different withdrawal rates",
    ],
    alternativeUses: [
      "Supplemental income planning alongside pensions and Social Security",
      "Tax bracket management — use IUL income to stay in lower brackets",
      "Legacy planning — show remaining death benefit after distributions",
    ],
    realLifeAccuracy: "Moderate — projections depend on future crediting rates and policy charges. Use conservative assumptions.",
    riskFactors: [
      "Over-distribution can lapse the policy",
      "Crediting rates may be lower than projected",
      "Policy charges increase with age",
      "Tax laws may change",
    ],
    differentiation: "Specifically models IUL distribution phase with tax-free income streams — not a generic retirement calculator.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Master IUL strategies", "Tax planning for HNW clients"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals"],
    priority: 8,
    estimatedTimeMinutes: 15,
    prerequisites: ["iul-historical", "policy-loans"],
  },
  {
    id: "tax-advantaged-growth",
    name: "Tax-Advantaged Growth",
    path: "/portal/tax-advantaged-growth",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "Shield",
    useCase: "Compares IUL tax-advantaged growth against taxable alternatives. Shows the compounding benefit of tax-deferred growth with tax-free access.",
    utility: "Quantifies the tax advantage in real dollars. Shows clients how much more they keep by using IUL vs. taxable accounts.",
    uniqueProblem: "Clients underestimate the drag of annual taxation on investment growth. This visualizes the gap between taxable and tax-advantaged compounding over 20-30 years.",
    resultConsistency: "High — mathematical comparison with defined tax rates and growth assumptions.",
    hiddenAdvantages: [
      "Shows the 'tax drag' in actual dollar amounts, not just percentages",
      "Compares against multiple alternatives (taxable, 401k, Roth, IUL)",
      "Demonstrates the triple tax advantage of IUL",
    ],
    alternativeUses: [
      "Tax planning conversations — show the cost of doing nothing",
      "Roth conversion analysis — compare Roth vs. IUL",
      "Business owner planning — show tax-efficient accumulation strategies",
    ],
    realLifeAccuracy: "High for the mathematical comparison. Actual tax rates and investment returns will vary.",
    riskFactors: [
      "Tax laws may change",
      "IUL crediting rates are not guaranteed",
      "Comparison assumes consistent tax rates",
    ],
    differentiation: "Specifically compares IUL against all major alternatives with tax impact visualization.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Master IUL strategies", "Tax planning for HNW clients"],
    clientTypes: ["High Net Worth Individuals", "Business Owners", "Young Professionals"],
    priority: 7,
    estimatedTimeMinutes: 15,
    prerequisites: ["iul-historical"],
  },
  {
    id: "ibbotson-charts",
    name: "Ibbotson Charts",
    path: "/portal/ibbotson-charts",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "BarChart3",
    useCase: "Presents Roger Ibbotson's landmark research on long-term market returns, forming the academic foundation for IUL crediting assumptions.",
    utility: "Adds academic credibility to IUL presentations. Shows that the growth assumptions are based on Nobel Prize-winning research, not sales hype.",
    uniqueProblem: "Clients question where IUL growth rates come from. Ibbotson's research provides the academic answer with nearly 100 years of data.",
    resultConsistency: "Very high — historical data is fixed and well-documented.",
    hiddenAdvantages: [
      "Academic credibility from Yale/Morningstar research",
      "Shows that 7-8% average returns are historically conservative",
      "Demonstrates the power of the 0% floor against Ibbotson's worst years",
    ],
    alternativeUses: [
      "Seminar content — educational presentation on market history",
      "Due diligence documentation — academic basis for recommendations",
      "Training material for new advisors",
    ],
    realLifeAccuracy: "Very high — based on actual historical market data compiled by leading researchers.",
    riskFactors: [
      "Historical returns don't guarantee future performance",
      "Data starts from 1926 — market structure has changed",
    ],
    differentiation: "The only platform that directly ties IUL crediting assumptions to Ibbotson's academic research.",
    ratings: { functionality: 9, efficiency: 10, predictability: 10, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Master IUL strategies", "Close more sales"],
    clientTypes: ["High Net Worth Individuals", "Business Owners", "Young Professionals"],
    priority: 6,
    estimatedTimeMinutes: 10,
    prerequisites: [],
  },
  {
    id: "quick-quote",
    name: "Quick Quote",
    path: "/portal/quick-quote",
    category: "iul-tools",
    categoryColor: "cyan",
    icon: "Calculator",
    useCase: "Rapid IUL premium and benefit estimation without running a full illustration. Get ballpark numbers in 30 seconds.",
    utility: "Speeds up initial conversations. Get approximate premiums and benefits instantly to gauge client interest before running formal illustrations.",
    uniqueProblem: "Running full illustrations takes 15-20 minutes. Quick Quote gives you conversation-ready numbers in seconds.",
    resultConsistency: "Moderate — estimates based on general assumptions. Formal illustrations will differ.",
    hiddenAdvantages: [
      "Perfect for phone conversations and initial meetings",
      "Helps qualify prospects before investing time in full illustrations",
      "Shows multiple scenarios simultaneously",
    ],
    alternativeUses: [
      "Seminar follow-up — give attendees quick estimates on the spot",
      "Competitive quoting — quickly compare against other products",
      "Training tool — understand how age, health, and premium affect benefits",
    ],
    realLifeAccuracy: "Moderate — these are estimates. Always follow up with carrier-specific illustrations for accuracy.",
    riskFactors: [
      "Estimates may differ significantly from actual illustrations",
      "Does not account for health ratings or specific carrier products",
      "Should not be used as the basis for purchase decisions",
    ],
    differentiation: "Speed-focused — get IUL estimates in 30 seconds vs. 20 minutes for a full illustration.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Close more sales", "Streamline my workflow"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Business Owners", "Young Professionals"],
    priority: 7,
    estimatedTimeMinutes: 5,
    prerequisites: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // REAL ESTATE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "mortgage-killer",
    name: "Mortgage Killer",
    path: "/portal/mortgage-killer",
    category: "real-estate",
    categoryColor: "teal",
    icon: "Home",
    useCase: "Shows how to eliminate a mortgage faster using IUL cash values and strategic refinancing, then reinvest the savings into wealth-building vehicles.",
    utility: "Turns a liability (mortgage) into a wealth-building strategy. Shows clients they can be mortgage-free years earlier AND build more wealth simultaneously.",
    uniqueProblem: "Clients see their mortgage as a fixed 30-year burden. This shows how redirecting mortgage interest savings into IUL and MYGA creates a wealth multiplier effect.",
    resultConsistency: "High — amortization calculations are exact. IUL projections are estimates based on historical data.",
    hiddenAdvantages: [
      "Shows the 'do nothing' cost vs. the recommended strategy",
      "Includes IUL cash values and surrender values in the analysis",
      "Models HELOC integration for accelerated payoff",
      "Shows 'Total Opportunity Cost Accomplished' — what the saved interest earns when reinvested",
    ],
    alternativeUses: [
      "Refinance analysis — should the client refinance?",
      "HELOC strategy — use home equity to fund IUL premiums",
      "Retirement planning — show how mortgage elimination frees up cash flow",
    ],
    realLifeAccuracy: "High for amortization math. IUL projections are estimates. HELOC rates may vary.",
    riskFactors: [
      "HELOC rates are variable and may increase",
      "IUL crediting rates are not guaranteed",
      "Strategy requires discipline to redirect savings",
      "Home values may fluctuate",
    ],
    differentiation: "Combines mortgage acceleration with IUL wealth building in one integrated analysis — not just a mortgage calculator.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    subTabs: [
      { name: "Fact Finder", description: "Mortgage details, current rate, balance, and payment information", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Current Plan", description: "Visualization of current mortgage amortization and total interest cost", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Recommended", description: "Accelerated payoff strategy with IUL integration", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "30-Year Projection", description: "Before vs. after comparison over the full mortgage term", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Savings", description: "Total interest saved, compounded growth, and wealth accumulation", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Scenarios", description: "Compare multiple payoff strategies side by side", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Amortization", description: "Detailed year-by-year amortization schedule", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
    ],
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Learn real estate strategies", "Close more sales", "Master IUL strategies"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Real Estate Investors", "Families & Estate Planning"],
    priority: 9,
    estimatedTimeMinutes: 20,
    prerequisites: ["clients"],
  },
  {
    id: "household-wealth",
    name: "Household Wealth",
    path: "/portal/household-wealth",
    category: "real-estate",
    categoryColor: "teal",
    icon: "Home",
    useCase: "Comprehensive household balance sheet showing total net worth across all assets, liabilities, and investment vehicles.",
    utility: "Gives clients a complete picture of where they stand financially. Identifies opportunities hidden in their overall wealth structure.",
    uniqueProblem: "Clients have assets scattered across multiple accounts and properties. This consolidates everything into one view to reveal optimization opportunities.",
    resultConsistency: "Very high — aggregates data you enter. Accuracy depends on input quality.",
    hiddenAdvantages: [
      "Reveals concentration risk in a single asset class",
      "Shows the true cost of liabilities against asset growth",
      "Identifies underperforming assets that could be repositioned",
    ],
    alternativeUses: [
      "Estate planning — show total estate value for tax planning",
      "Annual review — track net worth growth year over year",
      "Lending analysis — show banks your client's full picture",
    ],
    realLifeAccuracy: "Exact for entered data. Asset valuations should be updated regularly.",
    riskFactors: [
      "Stale valuations can misrepresent net worth",
      "Real estate values are estimates until appraised",
      "Doesn't account for tax implications of liquidation",
    ],
    differentiation: "Insurance-focused wealth view that includes policy cash values alongside traditional assets.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Learn real estate strategies", "Streamline my workflow"],
    clientTypes: ["High Net Worth Individuals", "Real Estate Investors", "Families & Estate Planning"],
    priority: 7,
    estimatedTimeMinutes: 10,
    prerequisites: ["clients"],
  },
  {
    id: "real-estate-mogul",
    name: "Real Estate Mogul",
    path: "/portal/real-estate-mogul",
    category: "real-estate",
    categoryColor: "teal",
    icon: "Building2",
    useCase: "Models real estate investment strategies using IUL as the funding vehicle. Shows how to build a real estate portfolio with tax-advantaged capital.",
    utility: "Combines real estate investing with IUL strategy. Shows clients how to use policy loans to fund real estate acquisitions.",
    uniqueProblem: "Real estate investors need capital but don't want to liquidate investments. This shows how IUL cash values can fund real estate purchases tax-free.",
    resultConsistency: "Moderate — depends on real estate appreciation assumptions and IUL crediting rates.",
    hiddenAdvantages: [
      "Shows the leverage multiplier of using IUL loans for real estate",
      "Models rental income alongside policy performance",
      "Demonstrates the tax arbitrage of policy loans vs. traditional financing",
    ],
    alternativeUses: [
      "Portfolio diversification analysis",
      "1031 exchange alternative strategy",
      "Retirement income from rental properties + IUL distributions",
    ],
    realLifeAccuracy: "Moderate — real estate returns and IUL crediting rates are both variable.",
    riskFactors: [
      "Real estate markets are cyclical",
      "Leverage amplifies both gains and losses",
      "Property management costs may be underestimated",
      "IUL loan rates may exceed property returns",
    ],
    differentiation: "The only tool that integrates IUL policy loans with real estate investment modeling.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Learn real estate strategies", "Master IUL strategies"],
    clientTypes: ["High Net Worth Individuals", "Real Estate Investors"],
    priority: 6,
    estimatedTimeMinutes: 20,
    prerequisites: ["mortgage-killer", "policy-loans"],
  },
  {
    id: "reverse-heloc",
    name: "Reverse HELOC Strategy",
    path: "/portal/reverse-heloc",
    category: "real-estate",
    categoryColor: "teal",
    icon: "Landmark",
    useCase: "Models the reverse HELOC strategy — using home equity to fund IUL premiums, creating a self-funding wealth transfer mechanism.",
    utility: "Shows how to turn dormant home equity into a wealth-building engine without selling the home.",
    uniqueProblem: "Homeowners sit on hundreds of thousands in equity doing nothing. This strategy puts that equity to work funding tax-advantaged growth.",
    resultConsistency: "Moderate — depends on HELOC rates, IUL crediting rates, and home value assumptions.",
    hiddenAdvantages: [
      "Home equity is 'dead money' — this activates it",
      "HELOC interest may be tax-deductible",
      "Creates a death benefit that far exceeds the HELOC balance",
    ],
    alternativeUses: [
      "Retirement income supplement",
      "Estate equalization strategy",
      "Business funding without traditional loans",
    ],
    realLifeAccuracy: "Moderate — HELOC rates are variable and home values fluctuate.",
    riskFactors: [
      "HELOC rates are variable — rising rates increase cost",
      "Home values may decline, reducing available equity",
      "Requires discipline to maintain the strategy",
      "HELOC may be called by the lender",
    ],
    differentiation: "Specifically models the HELOC-to-IUL arbitrage strategy with full cash flow analysis.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["advanced"],
    goalTags: ["Learn real estate strategies", "Master IUL strategies"],
    clientTypes: ["High Net Worth Individuals", "Real Estate Investors"],
    priority: 4,
    estimatedTimeMinutes: 15,
    prerequisites: ["mortgage-killer"],
  },

  // ═══════════════════════════════════════════════════════════════
  // ANNUITIES & INSURANCE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "myga-fixed-rate",
    name: "Amazing MYGA Waterfall",
    path: "/portal/myga-fixed-rate",
    category: "annuities",
    categoryColor: "emerald",
    icon: "Lock",
    useCase: "The flagship MYGA waterfall strategy — models a 20-year cascading deployment of capital through multiple MYGA contracts with O&G income, tax savings reinvestment, and depreciation benefits.",
    utility: "Shows clients how to create a guaranteed income waterfall using MYGAs while simultaneously benefiting from O&G tax deductions and reinvesting tax savings.",
    uniqueProblem: "Clients want guaranteed returns but also want tax benefits and growth. The waterfall strategy delivers all three by cascading MYGA maturities with O&G income and tax savings reinvestment.",
    resultConsistency: "High — MYGA rates are guaranteed. O&G income projections are estimates. Tax savings calculations are based on current tax law.",
    hiddenAdvantages: [
      "Tax savings reinvestment (shown in green) compounds the strategy's total return",
      "5 deployment scenarios compared automatically to find the optimal strategy",
      "O&G depreciation creates immediate tax deductions that fund additional MYGA purchases",
      "20-year projection shows the full wealth accumulation trajectory",
    ],
    alternativeUses: [
      "Safe money strategy for conservative clients",
      "Pension replacement — create guaranteed income streams",
      "Tax planning — use O&G depreciation to reduce current tax burden",
      "Estate planning — guaranteed values for wealth transfer",
    ],
    realLifeAccuracy: "High for MYGA guarantees. O&G income is estimated. Tax savings depend on individual tax situations.",
    riskFactors: [
      "O&G income is not guaranteed and depends on production",
      "Tax laws may change, affecting deduction value",
      "Early MYGA surrender may incur penalties",
      "Interest rate environment affects future MYGA rates",
    ],
    differentiation: "The only tool that combines MYGA waterfall deployment with O&G tax benefits and reinvested tax savings in a single 20-year projection.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    subTabs: [
      { name: "Fact Finder", description: "Client financial profile, investment amount, tax bracket, and deployment preferences", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "Amazing Waterfall", description: "Full 20-year waterfall projection with charts, tax savings in green, and scenario comparison", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
      { name: "O&G Details", description: "Oil & gas income projections, depreciation schedules, and tax impact", ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 } },
    ],
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Specialize in annuities", "Oil & gas investments", "Tax planning for HNW clients"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Oil & Gas Investors"],
    priority: 9,
    estimatedTimeMinutes: 25,
    prerequisites: ["clients"],
  },
  {
    id: "fia-top10",
    name: "Top 10 FIA",
    path: "/portal/fia-top10",
    category: "annuities",
    categoryColor: "emerald",
    icon: "TrendingUp",
    useCase: "Ranks the top 10 Fixed Index Annuities by performance, features, and suitability. Updated database of the best FIA products available.",
    utility: "Eliminates hours of product research. See the best FIA options ranked and compared in one view.",
    uniqueProblem: "There are hundreds of FIA products. This curates the top 10 so advisors can quickly identify the best fit for each client.",
    resultConsistency: "High — rankings are based on defined criteria. Product features are factual.",
    hiddenAdvantages: [
      "Saves hours of product research per case",
      "Includes features not always highlighted in carrier materials",
      "Side-by-side comparison makes suitability analysis easy",
    ],
    alternativeUses: [
      "Client education — show why a specific product was recommended",
      "Competitive analysis — compare against products clients already own",
      "Training tool for new advisors learning the FIA landscape",
    ],
    realLifeAccuracy: "High — based on actual product features and rates. Rates are subject to change.",
    riskFactors: [
      "Product rates and features change periodically",
      "Rankings may not reflect the best fit for every client",
      "Surrender charges and fees vary by product",
    ],
    differentiation: "Curated, ranked comparison of top FIA products — not just a product database.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Specialize in annuities", "Close more sales"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals"],
    priority: 8,
    estimatedTimeMinutes: 10,
    prerequisites: [],
  },
  {
    id: "growth-annuities",
    name: "Growth Annuities",
    path: "/portal/growth-annuities",
    category: "annuities",
    categoryColor: "emerald",
    icon: "TrendingUp",
    useCase: "Models growth-focused annuity strategies for accumulation. Shows how FIAs and MYGAs grow over time with guaranteed minimums.",
    utility: "Demonstrates the accumulation power of annuities for clients who want growth with downside protection.",
    uniqueProblem: "Clients think annuities are only for income. This shows the accumulation potential with guaranteed floors.",
    resultConsistency: "High — guaranteed minimums are contractual. Upside potential varies.",
    hiddenAdvantages: [
      "Shows the guaranteed minimum vs. potential upside",
      "Compares annuity growth against taxable alternatives",
      "Demonstrates the benefit of tax-deferred compounding",
    ],
    alternativeUses: [
      "IRA rollover analysis — show growth potential in an annuity vs. staying invested",
      "Safe money allocation — portion of portfolio in guaranteed growth",
      "Pre-retirement accumulation strategy",
    ],
    realLifeAccuracy: "High for guaranteed values. Index-linked growth is estimated.",
    riskFactors: [
      "Surrender charges apply during the surrender period",
      "Index crediting rates are not guaranteed",
      "Opportunity cost if markets significantly outperform",
    ],
    differentiation: "Focuses on the accumulation phase of annuities rather than income — shows growth potential.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate"],
    goalTags: ["Specialize in annuities"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals"],
    priority: 7,
    estimatedTimeMinutes: 10,
    prerequisites: [],
  },
  {
    id: "carrier-ratings",
    name: "Carrier Ratings",
    path: "/portal/carrier-ratings",
    category: "annuities",
    categoryColor: "emerald",
    icon: "Star",
    useCase: "Financial strength ratings for insurance carriers from AM Best, S&P, Moody's, and Fitch. Know which companies are safest.",
    utility: "Builds client confidence by showing the financial strength of recommended carriers. Essential for suitability documentation.",
    uniqueProblem: "Clients worry about carrier solvency. This provides instant access to all major rating agency scores in one view.",
    resultConsistency: "Very high — ratings are factual data from rating agencies.",
    hiddenAdvantages: [
      "Instant suitability documentation",
      "Compare carrier strength side by side",
      "Historical rating trends show stability",
    ],
    alternativeUses: [
      "Compliance documentation",
      "Client reassurance during market volatility",
      "Carrier selection for product recommendations",
    ],
    realLifeAccuracy: "Very high — sourced from official rating agencies.",
    riskFactors: [
      "Ratings can change — check for updates",
      "High ratings don't guarantee solvency",
    ],
    differentiation: "All major rating agencies in one view — no need to check multiple sources.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Specialize in annuities", "Compliance and documentation"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals"],
    priority: 6,
    estimatedTimeMinutes: 5,
    prerequisites: [],
  },
  {
    id: "illustration-compare",
    name: "Illustration Compare",
    path: "/portal/illustration-compare",
    category: "annuities",
    categoryColor: "emerald",
    icon: "BarChart3",
    useCase: "Side-by-side comparison of carrier illustrations. Upload or enter illustration data to compare products objectively.",
    utility: "Makes product selection data-driven instead of relationship-driven. Show clients why one product beats another with numbers.",
    uniqueProblem: "Carrier illustrations use different formats and assumptions, making comparison difficult. This normalizes them for apples-to-apples comparison.",
    resultConsistency: "High — comparison is mathematical based on illustration inputs.",
    hiddenAdvantages: [
      "Reveals hidden fees and charges across products",
      "Normalizes different illustration methodologies",
      "Creates compliance-ready comparison documentation",
    ],
    alternativeUses: [
      "Replacement analysis — compare existing policy vs. proposed",
      "Annual review — compare current performance vs. original illustration",
      "Training tool — understand how different products compare",
    ],
    realLifeAccuracy: "High for the comparison methodology. Illustrations themselves are projections.",
    riskFactors: [
      "Illustrations are not guarantees",
      "Different carriers use different assumptions",
      "Past illustration performance doesn't predict future results",
    ],
    differentiation: "Normalizes carrier illustrations for true apples-to-apples comparison.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Specialize in annuities", "Close more sales"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals"],
    priority: 6,
    estimatedTimeMinutes: 15,
    prerequisites: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // TAX PLANNING
  // ═══════════════════════════════════════════════════════════════
  {
    id: "tax-waterfall",
    name: "Tax Waterfall",
    path: "/portal/tax-waterfall",
    category: "tax-planning",
    categoryColor: "amber",
    icon: "Receipt",
    useCase: "Visualizes the tax impact of different income sources and withdrawal strategies. Shows how to minimize lifetime tax burden through strategic distribution ordering.",
    utility: "Turns complex tax planning into a visual waterfall. Clients immediately see how different strategies affect their tax bill.",
    uniqueProblem: "Clients don't understand how different income sources are taxed differently. This visualizes the tax waterfall to show optimal distribution ordering.",
    resultConsistency: "High — tax calculations are based on current tax brackets and rules.",
    hiddenAdvantages: [
      "Shows the 'tax torpedo' effect of Social Security taxation",
      "Identifies the optimal order for drawing from different accounts",
      "Reveals hidden tax traps in traditional retirement planning",
    ],
    alternativeUses: [
      "Roth conversion planning — show the tax impact of converting",
      "Social Security optimization — show how timing affects taxes",
      "Estate planning — minimize taxes on inherited accounts",
    ],
    realLifeAccuracy: "High for current tax law. Tax laws change frequently.",
    riskFactors: [
      "Tax laws may change",
      "State taxes are not always included",
      "Individual circumstances may create exceptions",
    ],
    differentiation: "Visual waterfall format makes complex tax planning immediately understandable.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Tax planning for HNW clients"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals"],
    priority: 8,
    estimatedTimeMinutes: 15,
    prerequisites: ["clients"],
  },
  {
    id: "estate-tax",
    name: "Estate Tax",
    path: "/portal/estate-tax",
    category: "tax-planning",
    categoryColor: "amber",
    icon: "Landmark",
    useCase: "Models estate tax exposure and strategies to minimize it. Shows the impact of current exemptions and sunset provisions.",
    utility: "Quantifies estate tax liability and shows how life insurance can offset it. Essential for HNW planning.",
    uniqueProblem: "Clients don't realize their estate may be taxable, especially with the 2026 exemption sunset. This makes the problem visible and the solution clear.",
    resultConsistency: "High — estate tax calculations are based on current law. Sunset provisions are well-defined.",
    hiddenAdvantages: [
      "Models the 2026 exemption sunset impact",
      "Shows how ILIT-owned life insurance eliminates estate tax",
      "Calculates the exact insurance amount needed to cover the tax",
    ],
    alternativeUses: [
      "Charitable planning — show the tax benefit of charitable bequests",
      "Business succession — estate tax impact on business transfer",
      "Generation-skipping planning",
    ],
    realLifeAccuracy: "High for current law. Estate tax laws are subject to change.",
    riskFactors: [
      "Estate tax exemptions may change with new legislation",
      "State estate taxes vary significantly",
      "Asset valuations for estate purposes may differ from market value",
    ],
    differentiation: "Specifically models the 2026 sunset provision and shows insurance-based solutions.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Tax planning for HNW clients"],
    clientTypes: ["High Net Worth Individuals", "Business Owners", "Families & Estate Planning"],
    priority: 7,
    estimatedTimeMinutes: 15,
    prerequisites: ["clients"],
  },
  {
    id: "roth-conversion",
    name: "Roth Conversion STR",
    path: "/portal/roth-conversion",
    category: "tax-planning",
    categoryColor: "amber",
    icon: "ArrowRightLeft",
    useCase: "Models Roth conversion strategies with short-term rental (STR) tax offset. Shows how to convert tax-deferred accounts to Roth while minimizing the tax hit.",
    utility: "Turns a taxable event (Roth conversion) into a tax-neutral event by pairing it with STR depreciation deductions.",
    uniqueProblem: "Roth conversions trigger immediate taxes, which discourages clients. This shows how STR depreciation can offset the conversion tax, making it nearly free.",
    resultConsistency: "Moderate to high — conversion math is exact. STR depreciation depends on property specifics.",
    hiddenAdvantages: [
      "STR depreciation can offset 100% of conversion taxes in some cases",
      "Creates tax-free growth in Roth for life",
      "Eliminates RMDs from converted amounts",
    ],
    alternativeUses: [
      "General Roth conversion analysis without STR component",
      "STR investment analysis standalone",
      "Tax bracket management strategy",
    ],
    realLifeAccuracy: "High for conversion math. STR depreciation depends on cost segregation studies and property details.",
    riskFactors: [
      "STR tax rules may change",
      "Property management adds complexity",
      "Conversion timing matters — market conditions affect the amount converted",
      "Must meet material participation requirements for STR deductions",
    ],
    differentiation: "The only tool that pairs Roth conversion with STR depreciation offset — a unique tax strategy.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["advanced"],
    goalTags: ["Tax planning for HNW clients", "Learn real estate strategies"],
    clientTypes: ["High Net Worth Individuals", "Real Estate Investors"],
    priority: 5,
    estimatedTimeMinutes: 20,
    prerequisites: ["tax-waterfall"],
  },
  {
    id: "tax-bracket-visualizer",
    name: "Tax Bracket Visualizer",
    path: "/portal/tax-bracket-visualizer",
    category: "tax-planning",
    categoryColor: "amber",
    icon: "BarChart",
    useCase: "Visual representation of federal tax brackets showing where the client's income falls and the marginal impact of additional income or deductions.",
    utility: "Makes tax brackets tangible. Clients see exactly where they are and how strategies move them between brackets.",
    uniqueProblem: "Clients don't understand marginal vs. effective tax rates. This visualizes both so they can see the real impact of tax planning strategies.",
    resultConsistency: "Very high — tax brackets are defined by law.",
    hiddenAdvantages: [
      "Shows the 'tax cliff' effect where small income changes trigger big tax jumps",
      "Visualizes the benefit of each deduction in dollar terms",
      "Helps time income recognition for optimal bracket management",
    ],
    alternativeUses: [
      "Roth conversion planning — show the bracket impact",
      "Bonus/compensation planning for business owners",
      "Retirement distribution optimization",
    ],
    realLifeAccuracy: "Very high for current tax year. Brackets adjust annually for inflation.",
    riskFactors: [
      "Tax brackets change with legislation",
      "State taxes add another layer of complexity",
      "AMT may override standard bracket calculations",
    ],
    differentiation: "Visual, interactive bracket display — not just a table of rates.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Tax planning for HNW clients"],
    clientTypes: ["High Net Worth Individuals", "Business Owners", "Retirees & Pre-Retirees"],
    priority: 6,
    estimatedTimeMinutes: 5,
    prerequisites: [],
  },
  {
    id: "medicare-irmaa",
    name: "Medicare IRMAA",
    path: "/portal/medicare-irmaa",
    category: "tax-planning",
    categoryColor: "amber",
    icon: "Heart",
    useCase: "Calculates Medicare IRMAA surcharges based on income and shows how to avoid them through strategic income management.",
    utility: "Reveals a hidden tax that most clients don't know about. Shows how income planning can save thousands in Medicare premiums.",
    uniqueProblem: "IRMAA surcharges can cost retirees $5,000-$12,000+ per year, and most don't know they're coming. This identifies the risk and shows avoidance strategies.",
    resultConsistency: "High — IRMAA brackets are defined by CMS annually.",
    hiddenAdvantages: [
      "Identifies clients at risk before they hit the surcharge",
      "Shows the 'IRMAA cliff' where $1 of income triggers thousands in surcharges",
      "Quantifies the value of tax-free IUL income in avoiding IRMAA",
    ],
    alternativeUses: [
      "Roth conversion timing — avoid IRMAA during conversion years",
      "Social Security claiming strategy — manage income to avoid surcharges",
      "IUL positioning — show the IRMAA benefit of tax-free income",
    ],
    realLifeAccuracy: "High — based on current CMS brackets. Brackets adjust annually.",
    riskFactors: [
      "IRMAA brackets change annually",
      "Two-year lookback period adds complexity",
      "Life-changing events may provide exceptions",
    ],
    differentiation: "Specifically models IRMAA surcharges and shows insurance-based avoidance strategies.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Tax planning for HNW clients"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals"],
    priority: 6,
    estimatedTimeMinutes: 10,
    prerequisites: ["tax-bracket-visualizer"],
  },

  // ═══════════════════════════════════════════════════════════════
  // INTELLIGENCE TOOLS
  // ═══════════════════════════════════════════════════════════════
  {
    id: "ai-assist",
    name: "Strategy Assist (AI)",
    path: "/portal/ai-assist",
    category: "intelligence",
    categoryColor: "purple",
    icon: "Zap",
    useCase: "AI-powered strategy recommendation engine. Describe a client situation and get tailored strategy suggestions with supporting analysis.",
    utility: "Like having a senior advisor on call 24/7. Get strategy ideas and talking points for any client situation in seconds.",
    uniqueProblem: "Advisors face unique client situations and need creative strategy combinations. AI analyzes the situation and suggests approaches you might not have considered.",
    resultConsistency: "Moderate — AI responses vary but are consistently relevant. Quality improves with better prompts.",
    hiddenAdvantages: [
      "Suggests strategy combinations you might not have considered",
      "Generates client-ready talking points",
      "Learns from the platform's full toolkit to make relevant suggestions",
    ],
    alternativeUses: [
      "Meeting prep — get strategy ideas before client calls",
      "Training tool — learn how different strategies apply to different situations",
      "Objection handling — get responses to common client concerns",
    ],
    realLifeAccuracy: "Moderate — AI provides directional guidance. Always verify with your own analysis and compliance review.",
    riskFactors: [
      "AI suggestions are not financial advice",
      "May not account for all regulatory requirements",
      "Should be used as a starting point, not a final answer",
    ],
    differentiation: "Insurance and financial planning-specific AI — not a generic chatbot.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Close more sales", "Streamline my workflow"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Business Owners", "Young Professionals"],
    priority: 8,
    estimatedTimeMinutes: 5,
    prerequisites: [],
  },
  {
    id: "risk-tolerance",
    name: "Risk Tolerance Scoring",
    path: "/portal/risk-tolerance",
    category: "intelligence",
    categoryColor: "purple",
    icon: "Target",
    useCase: "Quantitative risk tolerance assessment that produces a numerical score and recommended asset allocation based on client responses.",
    utility: "Replaces subjective risk conversations with a structured, scored assessment. Creates documentation for suitability files.",
    uniqueProblem: "Risk tolerance is subjective and hard to document. This creates a quantified, repeatable assessment that satisfies compliance requirements.",
    resultConsistency: "High — scoring algorithm is deterministic based on responses.",
    hiddenAdvantages: [
      "Creates compliance-ready documentation",
      "Identifies mismatches between stated and actual risk tolerance",
      "Generates recommended allocation based on score",
    ],
    alternativeUses: [
      "Annual review — track how risk tolerance changes over time",
      "Couple planning — compare risk tolerance between spouses",
      "Compliance documentation for suitability files",
    ],
    realLifeAccuracy: "Moderate — risk tolerance is inherently subjective. The tool quantifies it as best as possible.",
    riskFactors: [
      "Clients may answer differently based on current market conditions",
      "Doesn't account for risk capacity (ability to take risk)",
      "Should be combined with other suitability factors",
    ],
    differentiation: "Insurance-focused risk assessment with allocation recommendations tied to the platform's product suite.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Compliance and documentation", "Streamline my workflow"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Young Professionals"],
    priority: 7,
    estimatedTimeMinutes: 10,
    prerequisites: ["clients"],
  },

  // ═══════════════════════════════════════════════════════════════
  // SALES & PRESENTATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    id: "presentation-builder",
    name: "Presentation Builder",
    path: "/portal/presentation-builder",
    category: "sales",
    categoryColor: "rose",
    icon: "Presentation",
    useCase: "Generate professional client presentations pulling data from any calculator or strategy engine on the platform.",
    utility: "Turns hours of presentation prep into minutes. Auto-generates slides with client-specific data and strategy visualizations.",
    uniqueProblem: "Advisors spend hours building presentations manually. This auto-generates professional presentations using data already in the system.",
    resultConsistency: "High — presentations are generated from structured data.",
    hiddenAdvantages: [
      "Pulls live data from client profiles and calculators",
      "Professional design templates built for financial presentations",
      "Export to PDF for email or print",
    ],
    alternativeUses: [
      "Seminar materials — generate educational presentations",
      "Team training — create standardized presentation decks",
      "Compliance documentation — record what was presented to clients",
    ],
    realLifeAccuracy: "High — presentations reflect the data in your system.",
    riskFactors: [
      "Auto-generated content should be reviewed before presenting",
      "Data accuracy depends on input quality",
    ],
    differentiation: "Auto-generates insurance-specific presentations from live platform data — not a generic slide tool.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Improve client presentations", "Close more sales"],
    clientTypes: ["Retirees & Pre-Retirees", "High Net Worth Individuals", "Business Owners"],
    priority: 8,
    estimatedTimeMinutes: 15,
    prerequisites: ["clients"],
  },
  {
    id: "leaderboard",
    name: "Leaderboard",
    path: "/portal/leaderboard",
    category: "sales",
    categoryColor: "rose",
    icon: "Trophy",
    useCase: "Competitive performance tracking across the advisor team. See who's closing the most deals, generating the most revenue, and leading in key metrics.",
    utility: "Drives healthy competition and accountability. Gamifies the sales process to motivate performance.",
    uniqueProblem: "Without visibility into team performance, there's no accountability or motivation. The leaderboard creates transparency and friendly competition.",
    resultConsistency: "Very high — based on actual pipeline and deal data.",
    hiddenAdvantages: [
      "Identifies top performers for mentoring opportunities",
      "Reveals activity patterns that correlate with success",
      "Creates accountability without micromanagement",
    ],
    alternativeUses: [
      "Team meetings — review performance together",
      "Recruiting — show prospects the team's success",
      "Compensation planning — data-driven bonus decisions",
    ],
    realLifeAccuracy: "Exact — based on actual deal data in the system.",
    riskFactors: [
      "Can create unhealthy competition if not managed well",
      "Metrics may not capture all value an advisor provides",
    ],
    differentiation: "Insurance-specific metrics — not generic sales KPIs.",
    ratings: { functionality: 10, efficiency: 10, predictability: 10, complexity: 9, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate", "advanced"],
    goalTags: ["Grow my client base", "Close more sales"],
    clientTypes: [],
    priority: 4,
    estimatedTimeMinutes: 5,
    prerequisites: ["pipeline"],
  },

  // ═══════════════════════════════════════════════════════════════
  // OIL & GAS
  // ═══════════════════════════════════════════════════════════════
  {
    id: "oil-gas-strategy",
    name: "Oil & Gas Strategy",
    path: "/portal/strategy-lab",
    category: "oil-gas",
    categoryColor: "orange",
    icon: "Flame",
    useCase: "Comprehensive O&G investment strategy modeling with depreciation benefits, income projections, and tax impact analysis.",
    utility: "Shows clients how O&G investments create immediate tax deductions while generating long-term income. The tax benefits alone can justify the investment.",
    uniqueProblem: "O&G investments are complex and misunderstood. This breaks down the depreciation benefits, income projections, and tax savings into a clear, visual analysis.",
    resultConsistency: "Moderate — O&G income depends on production and commodity prices. Tax benefits are more predictable.",
    hiddenAdvantages: [
      "Intangible drilling costs (IDC) create immediate 60-80% deductions",
      "Tangible drilling costs provide additional depreciation over 7 years",
      "Depletion allowance provides ongoing tax-free income",
      "Pairs perfectly with MYGA waterfall for reinvestment",
    ],
    alternativeUses: [
      "Tax planning — show the deduction impact on current year taxes",
      "Portfolio diversification — add commodity exposure",
      "Estate planning — O&G interests can be transferred with stepped-up basis",
    ],
    realLifeAccuracy: "Moderate — production estimates and commodity prices are variable. Tax deduction calculations are accurate based on current law.",
    riskFactors: [
      "Commodity price volatility affects income",
      "Production may be lower than estimated",
      "Regulatory changes could affect tax benefits",
      "Illiquid investment — difficult to sell quickly",
      "Environmental and operational risks",
    ],
    differentiation: "Integrates O&G tax benefits with the broader financial planning toolkit — not a standalone O&G calculator.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Oil & gas investments", "Tax planning for HNW clients"],
    clientTypes: ["High Net Worth Individuals", "Oil & Gas Investors"],
    priority: 7,
    estimatedTimeMinutes: 25,
    prerequisites: ["clients"],
  },
  {
    id: "ecological-drivers",
    name: "Ecological Drivers",
    path: "/portal/ecological-drivers",
    category: "oil-gas",
    categoryColor: "orange",
    icon: "Leaf",
    useCase: "Analyzes the environmental and sustainability factors in O&G investments. Shows how modern drilling practices address ecological concerns.",
    utility: "Addresses the #1 objection to O&G investments — environmental impact. Provides data-driven responses to sustainability concerns.",
    uniqueProblem: "Environmentally conscious clients reject O&G investments on principle. This shows how modern practices, carbon offset programs, and ESG considerations make O&G more sustainable than perceived.",
    resultConsistency: "Moderate — environmental data and practices evolve.",
    hiddenAdvantages: [
      "Turns an objection into a selling point",
      "Shows the energy transition timeline and why O&G remains essential",
      "Demonstrates carbon offset and ESG compliance programs",
    ],
    alternativeUses: [
      "Client education on energy markets",
      "Seminar content on sustainable investing",
      "Due diligence documentation for ESG-conscious clients",
    ],
    realLifeAccuracy: "Moderate — based on current industry data and practices.",
    riskFactors: [
      "Environmental regulations are tightening",
      "Public perception of O&G continues to evolve",
      "ESG scoring methodologies vary",
    ],
    differentiation: "The only tool that specifically addresses environmental objections to O&G investments with data.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Oil & gas investments"],
    clientTypes: ["High Net Worth Individuals", "Oil & Gas Investors"],
    priority: 4,
    estimatedTimeMinutes: 10,
    prerequisites: ["oil-gas-strategy"],
  },

  // ═══════════════════════════════════════════════════════════════
  // MARKET & RESEARCH
  // ═══════════════════════════════════════════════════════════════
  {
    id: "crypto-corner",
    name: "Crypto Corner",
    path: "/portal/crypto-corner",
    category: "market-data",
    categoryColor: "indigo",
    icon: "Coins",
    useCase: "Cryptocurrency market data, education, and portfolio analysis. Helps advisors have informed conversations about digital assets.",
    utility: "Keeps you current on crypto so you can address client questions intelligently. Shows how crypto fits (or doesn't) in a diversified portfolio.",
    uniqueProblem: "Clients ask about crypto and advisors feel unprepared. This provides the data and talking points to have confident conversations.",
    resultConsistency: "Moderate — crypto markets are highly volatile. Data is real-time.",
    hiddenAdvantages: [
      "Real-time market data for major cryptocurrencies",
      "Portfolio allocation analysis showing crypto's impact on risk/return",
      "Educational content for client conversations",
    ],
    alternativeUses: [
      "Client education — explain crypto basics",
      "Risk assessment — show crypto's volatility vs. traditional assets",
      "Alternative investment discussion starter",
    ],
    realLifeAccuracy: "High for market data. Projections and analysis are estimates.",
    riskFactors: [
      "Extreme volatility — prices can move 20%+ in a day",
      "Regulatory uncertainty",
      "Not FDIC insured or guaranteed",
      "Tax implications are complex",
    ],
    differentiation: "Advisor-focused crypto tool — designed for client conversations, not trading.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["intermediate", "advanced"],
    goalTags: ["Grow my client base"],
    clientTypes: ["Young Professionals", "High Net Worth Individuals"],
    priority: 3,
    estimatedTimeMinutes: 10,
    prerequisites: [],
  },
  {
    id: "inflation-analysis",
    name: "Inflation Analysis",
    path: "/portal/inflation",
    category: "market-data",
    categoryColor: "indigo",
    icon: "TrendingUp",
    useCase: "Models the impact of inflation on purchasing power, retirement income needs, and investment returns over time.",
    utility: "Makes inflation tangible. Shows clients that $100K today is worth $55K in 20 years at 3% inflation — creating urgency for growth strategies.",
    uniqueProblem: "Clients underestimate inflation's erosion of purchasing power. This visualizes the gap between nominal and real returns.",
    resultConsistency: "High — mathematical calculations based on assumed inflation rates.",
    hiddenAdvantages: [
      "Creates urgency for growth-oriented strategies",
      "Shows why 'safe' low-return investments are actually risky",
      "Demonstrates the real cost of keeping money in savings accounts",
    ],
    alternativeUses: [
      "Retirement planning — show inflation-adjusted income needs",
      "Insurance needs analysis — future cost of living",
      "Investment justification — why growth matters",
    ],
    realLifeAccuracy: "High for the math. Actual inflation rates vary year to year.",
    riskFactors: [
      "Inflation rates are unpredictable",
      "Historical averages may not reflect future inflation",
    ],
    differentiation: "Specifically tied to insurance and annuity solutions — shows how products address inflation risk.",
    ratings: { functionality: 10, efficiency: 10, predictability: 9, complexity: 10, comprehension: 10, importance: 10 },
    experienceLevel: ["beginner", "intermediate"],
    goalTags: ["Close more sales"],
    clientTypes: ["Retirees & Pre-Retirees", "Young Professionals"],
    priority: 5,
    estimatedTimeMinutes: 5,
    prerequisites: [],
  },
];

/**
 * Get all unique categories from the tab summaries
 */
export function getCategories(): string[] {
  return Array.from(new Set(TAB_SUMMARIES.map(t => t.category)));
}

/**
 * Get tabs filtered by category
 */
export function getTabsByCategory(category: string): TabSummary[] {
  return TAB_SUMMARIES.filter(t => t.category === category);
}

/**
 * Get recommended navigation path based on advisor profile
 */
export function getRecommendedPath(
  experienceLevel: "beginner" | "intermediate" | "advanced",
  goals: string[],
  clientTypes: string[]
): TabSummary[] {
  // Score each tab based on relevance to the advisor's profile
  const scored = TAB_SUMMARIES.map(tab => {
    let score = 0;
    
    // Experience level match
    if (tab.experienceLevel.includes(experienceLevel)) score += 3;
    
    // Goal match
    const goalMatches = tab.goalTags.filter(g => goals.includes(g)).length;
    score += goalMatches * 4;
    
    // Client type match
    const clientMatches = tab.clientTypes.filter(c => clientTypes.includes(c)).length;
    score += clientMatches * 2;
    
    // Priority bonus
    score += tab.priority;
    
    return { tab, score };
  });
  
  // Sort by score descending, then by priority
  scored.sort((a, b) => b.score - a.score || b.tab.priority - a.tab.priority);
  
  // Return top tabs, respecting prerequisites
  const result: TabSummary[] = [];
  const added = new Set<string>();
  
  for (const { tab } of scored) {
    // Add prerequisites first
    for (const prereqId of tab.prerequisites) {
      if (!added.has(prereqId)) {
        const prereq = TAB_SUMMARIES.find(t => t.id === prereqId);
        if (prereq) {
          result.push(prereq);
          added.add(prereqId);
        }
      }
    }
    if (!added.has(tab.id)) {
      result.push(tab);
      added.add(tab.id);
    }
    if (result.length >= 15) break; // Top 15 recommendations
  }
  
  return result;
}
