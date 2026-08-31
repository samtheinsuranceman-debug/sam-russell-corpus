/**
 * Russell Capital Systems™ — 100-Question Risk Tolerance Assessment
 * 10 Categories × 10 Questions = 100 Total
 * Each question scored 1-5 for a composite Risk Number (1-99)
 */

export interface RiskQuestion {
  id: number;
  text: string;
  category: string;
  priority: number;
  options: { label: string; value: number; detail: string }[];
}

export interface RiskCategory {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export const RISK_CATEGORIES: RiskCategory[] = [
  { key: "financial_capacity", label: "Financial Capacity", description: "Measures your ability to absorb financial losses based on income, assets, and obligations", icon: "DollarSign" },
  { key: "risk_attitude", label: "Risk Attitude & Behavior", description: "Gauges your emotional and psychological response to market volatility and uncertainty", icon: "Brain" },
  { key: "time_horizon", label: "Time Horizon & Life Stage", description: "Evaluates how long your money can remain invested before you need it", icon: "Clock" },
  { key: "investment_experience", label: "Investment Experience", description: "Assesses your familiarity with different asset classes and market cycles", icon: "TrendingUp" },
  { key: "income_stability", label: "Income Stability & Employment", description: "Measures the reliability and diversification of your income sources", icon: "Briefcase" },
  { key: "debt_obligations", label: "Debt & Obligations", description: "Evaluates your current debt load and its impact on risk-taking ability", icon: "CreditCard" },
  { key: "insurance_protection", label: "Insurance & Protection", description: "Assesses your safety net through insurance coverage and estate planning", icon: "Shield" },
  { key: "tax_situation", label: "Tax Situation & Planning", description: "Evaluates your tax bracket, planning sophistication, and tax-advantaged capacity", icon: "FileText" },
  { key: "goals_priorities", label: "Goals & Priorities", description: "Identifies your financial objectives and how they shape your risk requirements", icon: "Target" },
  { key: "behavioral_finance", label: "Behavioral Finance & Psychology", description: "Measures cognitive biases and decision-making patterns under financial stress", icon: "Zap" },
];

export const RISK_QUESTIONS: RiskQuestion[] = [
  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 1: FINANCIAL CAPACITY (Questions 1-10)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 1, category: "financial_capacity", priority: 1,
    text: "What is your current annual household income from all sources?",
    options: [
      { label: "Under $75,000", value: 1, detail: "Limited surplus for risk-taking" },
      { label: "$75,000 – $150,000", value: 2, detail: "Moderate surplus available" },
      { label: "$150,000 – $300,000", value: 3, detail: "Comfortable surplus for investing" },
      { label: "$300,000 – $750,000", value: 4, detail: "Strong surplus capacity" },
      { label: "Over $750,000", value: 5, detail: "Maximum financial capacity" },
    ],
  },
  {
    id: 2, category: "financial_capacity", priority: 1,
    text: "How many months of living expenses do you maintain in liquid reserves (cash, money market, short-term CDs)?",
    options: [
      { label: "Less than 2 months", value: 1, detail: "Critical liquidity gap" },
      { label: "2–4 months", value: 2, detail: "Below recommended minimum" },
      { label: "4–8 months", value: 3, detail: "Adequate emergency fund" },
      { label: "8–18 months", value: 4, detail: "Strong liquidity position" },
      { label: "Over 18 months", value: 5, detail: "Exceptional liquidity buffer" },
    ],
  },
  {
    id: 3, category: "financial_capacity", priority: 2,
    text: "What is your total investable net worth (excluding primary residence and business equity)?",
    options: [
      { label: "Under $100,000", value: 1, detail: "Early accumulation phase" },
      { label: "$100,000 – $500,000", value: 2, detail: "Building investment base" },
      { label: "$500,000 – $2,000,000", value: 3, detail: "Substantial portfolio" },
      { label: "$2,000,000 – $10,000,000", value: 4, detail: "High net worth" },
      { label: "Over $10,000,000", value: 5, detail: "Ultra-high net worth" },
    ],
  },
  {
    id: 4, category: "financial_capacity", priority: 2,
    text: "What percentage of your monthly income goes toward fixed obligations (mortgage, car payments, insurance, minimum debt payments)?",
    options: [
      { label: "Over 70%", value: 1, detail: "Severely constrained cash flow" },
      { label: "55% – 70%", value: 2, detail: "Tight cash flow" },
      { label: "40% – 55%", value: 3, detail: "Moderate flexibility" },
      { label: "25% – 40%", value: 4, detail: "Good discretionary capacity" },
      { label: "Under 25%", value: 5, detail: "Maximum financial flexibility" },
    ],
  },
  {
    id: 5, category: "financial_capacity", priority: 3,
    text: "Do you have additional income sources beyond your primary employment (rental income, dividends, business income, royalties)?",
    options: [
      { label: "No additional income sources", value: 1, detail: "Single income dependency" },
      { label: "One small additional source (<10% of income)", value: 2, detail: "Minimal diversification" },
      { label: "One significant source (10-25% of income)", value: 3, detail: "Moderate diversification" },
      { label: "Multiple sources (25-50% of income)", value: 4, detail: "Well-diversified income" },
      { label: "Multiple sources exceeding primary income", value: 5, detail: "Highly diversified income" },
    ],
  },
  {
    id: 6, category: "financial_capacity", priority: 3,
    text: "If you lost your primary income today, how long could you maintain your current lifestyle without selling investments?",
    options: [
      { label: "Less than 1 month", value: 1, detail: "Immediate financial vulnerability" },
      { label: "1–3 months", value: 2, detail: "Short-term runway" },
      { label: "3–6 months", value: 3, detail: "Moderate runway" },
      { label: "6–12 months", value: 4, detail: "Comfortable runway" },
      { label: "Over 12 months or indefinitely", value: 5, detail: "Financial independence" },
    ],
  },
  {
    id: 7, category: "financial_capacity", priority: 4,
    text: "What is the current equity position in your primary residence?",
    options: [
      { label: "Underwater or no equity", value: 1, detail: "No home equity cushion" },
      { label: "Less than 20% equity", value: 2, detail: "Limited home equity" },
      { label: "20% – 40% equity", value: 3, detail: "Moderate home equity" },
      { label: "40% – 70% equity", value: 4, detail: "Strong home equity" },
      { label: "Over 70% equity or paid off", value: 5, detail: "Maximum home equity" },
    ],
  },
  {
    id: 8, category: "financial_capacity", priority: 4,
    text: "How would you characterize your current savings rate (percentage of gross income saved/invested annually)?",
    options: [
      { label: "0% or negative (spending exceeds income)", value: 1, detail: "No savings capacity" },
      { label: "1% – 5%", value: 2, detail: "Minimal savings rate" },
      { label: "5% – 15%", value: 3, detail: "Moderate savings rate" },
      { label: "15% – 30%", value: 4, detail: "Strong savings discipline" },
      { label: "Over 30%", value: 5, detail: "Exceptional savings rate" },
    ],
  },
  {
    id: 9, category: "financial_capacity", priority: 5,
    text: "Do you anticipate any major financial obligations in the next 5 years (college tuition, wedding, elder care, business investment)?",
    options: [
      { label: "Yes, multiple large obligations (>$200K total)", value: 1, detail: "Heavy near-term demands" },
      { label: "Yes, one large obligation ($100K–$200K)", value: 2, detail: "Significant near-term demand" },
      { label: "Yes, moderate obligations ($25K–$100K)", value: 3, detail: "Manageable near-term needs" },
      { label: "Minor obligations only (<$25K)", value: 4, detail: "Minimal near-term demands" },
      { label: "No anticipated major obligations", value: 5, detail: "Clear financial runway" },
    ],
  },
  {
    id: 10, category: "financial_capacity", priority: 5,
    text: "What is the maximum dollar amount you could lose in your portfolio this year without it materially affecting your lifestyle?",
    options: [
      { label: "Less than $5,000", value: 1, detail: "Very limited loss capacity" },
      { label: "$5,000 – $25,000", value: 2, detail: "Limited loss capacity" },
      { label: "$25,000 – $100,000", value: 3, detail: "Moderate loss capacity" },
      { label: "$100,000 – $500,000", value: 4, detail: "Strong loss capacity" },
      { label: "Over $500,000", value: 5, detail: "Maximum loss capacity" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 2: RISK ATTITUDE & BEHAVIOR (Questions 11-20)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 11, category: "risk_attitude", priority: 1,
    text: "If your portfolio dropped 30% in a single quarter, what would be your most likely reaction?",
    options: [
      { label: "Sell everything immediately to stop the bleeding", value: 1, detail: "Panic-driven response" },
      { label: "Sell a significant portion to reduce exposure", value: 2, detail: "Fear-driven reduction" },
      { label: "Hold steady and wait for recovery", value: 3, detail: "Disciplined patience" },
      { label: "Rebalance by buying more of what dropped", value: 4, detail: "Contrarian discipline" },
      { label: "Aggressively buy more — this is an opportunity", value: 5, detail: "Opportunistic aggression" },
    ],
  },
  {
    id: 12, category: "risk_attitude", priority: 1,
    text: "How do you feel when you hear about friends or colleagues making large profits from speculative investments?",
    options: [
      { label: "Relieved I wasn't involved — too risky", value: 1, detail: "Risk-averse mindset" },
      { label: "Slightly envious but comfortable with my approach", value: 2, detail: "Conservative contentment" },
      { label: "Curious and willing to research the opportunity", value: 3, detail: "Open-minded evaluation" },
      { label: "Motivated to allocate a small portion similarly", value: 4, detail: "Calculated risk-taking" },
      { label: "Frustrated I missed out — ready to act on the next one", value: 5, detail: "FOMO-driven aggression" },
    ],
  },
  {
    id: 13, category: "risk_attitude", priority: 2,
    text: "Which statement best describes your investment philosophy?",
    options: [
      { label: "Preserving what I have is more important than growing it", value: 1, detail: "Capital preservation priority" },
      { label: "I want steady, predictable returns even if they're modest", value: 2, detail: "Stability-focused" },
      { label: "I accept some volatility for better long-term returns", value: 3, detail: "Balanced risk-reward" },
      { label: "I'm comfortable with significant swings for superior growth", value: 4, detail: "Growth-oriented" },
      { label: "Maximum growth is my goal — I can handle any volatility", value: 5, detail: "Aggressive growth" },
    ],
  },
  {
    id: 14, category: "risk_attitude", priority: 2,
    text: "When making a major financial decision, how much time do you typically spend analyzing before acting?",
    options: [
      { label: "I avoid major decisions or delegate them entirely", value: 1, detail: "Decision avoidance" },
      { label: "I research extensively and often delay decisions", value: 2, detail: "Analysis paralysis tendency" },
      { label: "I do thorough research and decide within a reasonable timeframe", value: 3, detail: "Balanced decision-making" },
      { label: "I research quickly and act decisively", value: 4, detail: "Confident decision-making" },
      { label: "I trust my instincts and act fast on opportunities", value: 5, detail: "Intuition-driven action" },
    ],
  },
  {
    id: 15, category: "risk_attitude", priority: 3,
    text: "How would you describe your comfort level with investment uncertainty?",
    options: [
      { label: "I need guaranteed returns — uncertainty causes me significant stress", value: 1, detail: "Zero uncertainty tolerance" },
      { label: "I prefer mostly guaranteed with a small speculative portion", value: 2, detail: "Low uncertainty tolerance" },
      { label: "I'm comfortable with moderate uncertainty if the expected return justifies it", value: 3, detail: "Moderate uncertainty tolerance" },
      { label: "I embrace uncertainty as the price of higher returns", value: 4, detail: "High uncertainty tolerance" },
      { label: "I thrive on uncertainty — it's where the best opportunities live", value: 5, detail: "Maximum uncertainty tolerance" },
    ],
  },
  {
    id: 16, category: "risk_attitude", priority: 3,
    text: "If a trusted advisor recommended a strategy with a 40% chance of doubling your money and a 20% chance of losing half, would you proceed?",
    options: [
      { label: "Absolutely not — the loss potential is unacceptable", value: 1, detail: "Loss-averse" },
      { label: "Probably not — I'd need much better odds", value: 2, detail: "Cautious" },
      { label: "I'd consider it with a small allocation", value: 3, detail: "Calculated" },
      { label: "Yes, the expected value is positive — I'd allocate meaningfully", value: 4, detail: "Probability-driven" },
      { label: "Yes, and I'd want to maximize my exposure to this opportunity", value: 5, detail: "Aggressive optimizer" },
    ],
  },
  {
    id: 17, category: "risk_attitude", priority: 4,
    text: "How do you typically react when you see your portfolio statement during a market downturn?",
    options: [
      { label: "I avoid looking at it entirely", value: 1, detail: "Avoidance behavior" },
      { label: "I check it anxiously and consider making changes", value: 2, detail: "Anxiety-driven monitoring" },
      { label: "I review it calmly and stick to my plan", value: 3, detail: "Disciplined review" },
      { label: "I see it as a buying opportunity and look for bargains", value: 4, detail: "Opportunistic review" },
      { label: "I get excited about the discount and increase contributions", value: 5, detail: "Contrarian enthusiasm" },
    ],
  },
  {
    id: 18, category: "risk_attitude", priority: 4,
    text: "What is your attitude toward concentrated positions (having a large percentage in a single investment)?",
    options: [
      { label: "Never — I want maximum diversification at all times", value: 1, detail: "Strict diversification" },
      { label: "Only in very safe assets like treasuries or CDs", value: 2, detail: "Conservative concentration" },
      { label: "Acceptable for high-conviction ideas with a limit (e.g., 10-15%)", value: 3, detail: "Controlled concentration" },
      { label: "Comfortable with 20-30% in my best ideas", value: 4, detail: "Conviction-weighted" },
      { label: "I believe concentration builds wealth — I'm comfortable with 40%+", value: 5, detail: "High conviction" },
    ],
  },
  {
    id: 19, category: "risk_attitude", priority: 5,
    text: "How important is it to you that your investments outperform the S&P 500 index?",
    options: [
      { label: "Not important — I just want to preserve capital", value: 1, detail: "Preservation focus" },
      { label: "Somewhat — but I'd accept lower returns for less risk", value: 2, detail: "Risk-adjusted focus" },
      { label: "Moderately — I'd like to match the market over time", value: 3, detail: "Market-matching goal" },
      { label: "Very important — I want to beat the market consistently", value: 4, detail: "Alpha-seeking" },
      { label: "Critical — I'm willing to take significant risk to outperform", value: 5, detail: "Aggressive alpha pursuit" },
    ],
  },
  {
    id: 20, category: "risk_attitude", priority: 5,
    text: "If you had to choose between a guaranteed $50,000 gain or a 50/50 chance of gaining $150,000 or gaining nothing, which would you choose?",
    options: [
      { label: "Guaranteed $50,000 — no question", value: 1, detail: "Strong certainty preference" },
      { label: "Probably the guarantee, but I'd think about it", value: 2, detail: "Mild certainty preference" },
      { label: "It's a coin flip — both have the same expected value", value: 3, detail: "Rational evaluation" },
      { label: "I'd lean toward the gamble for the upside", value: 4, detail: "Upside preference" },
      { label: "The gamble — the expected value is $75K vs $50K", value: 5, detail: "Expected value optimizer" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 3: TIME HORIZON & LIFE STAGE (Questions 21-30)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 21, category: "time_horizon", priority: 1,
    text: "What is your current age?",
    options: [
      { label: "Under 30", value: 5, detail: "Maximum time horizon" },
      { label: "30–40", value: 4, detail: "Long time horizon" },
      { label: "40–52", value: 3, detail: "Medium time horizon" },
      { label: "52–62", value: 2, detail: "Approaching retirement" },
      { label: "Over 62", value: 1, detail: "Near or in retirement" },
    ],
  },
  {
    id: 22, category: "time_horizon", priority: 1,
    text: "When do you plan to begin drawing income from your investment portfolio?",
    options: [
      { label: "Within the next 2 years", value: 1, detail: "Immediate income need" },
      { label: "2–5 years", value: 2, detail: "Short-term income need" },
      { label: "5–10 years", value: 3, detail: "Medium-term planning" },
      { label: "10–20 years", value: 4, detail: "Long-term accumulation" },
      { label: "20+ years or never (legacy wealth)", value: 5, detail: "Multi-generational horizon" },
    ],
  },
  {
    id: 23, category: "time_horizon", priority: 2,
    text: "What is your planned retirement age?",
    options: [
      { label: "Already retired or within 3 years", value: 1, detail: "Immediate transition" },
      { label: "Within 3–7 years", value: 2, detail: "Near-term retirement" },
      { label: "Within 7–15 years", value: 3, detail: "Mid-career planning" },
      { label: "15–25 years away", value: 4, detail: "Early career accumulation" },
      { label: "25+ years or no plans to fully retire", value: 5, detail: "Maximum accumulation window" },
    ],
  },
  {
    id: 24, category: "time_horizon", priority: 2,
    text: "How long do you expect to live in retirement (considering family health history)?",
    options: [
      { label: "10–15 years", value: 1, detail: "Shorter distribution period" },
      { label: "15–20 years", value: 2, detail: "Moderate distribution period" },
      { label: "20–25 years", value: 3, detail: "Standard planning horizon" },
      { label: "25–35 years", value: 4, detail: "Extended longevity planning" },
      { label: "35+ years (family history of longevity)", value: 5, detail: "Maximum longevity risk" },
    ],
  },
  {
    id: 25, category: "time_horizon", priority: 3,
    text: "Do you have children or dependents who will need financial support in the next 10 years?",
    options: [
      { label: "Yes, multiple dependents with significant needs (college, special needs)", value: 1, detail: "Heavy dependent obligations" },
      { label: "Yes, children approaching college age", value: 2, detail: "Near-term education costs" },
      { label: "Yes, but their needs are mostly funded already", value: 3, detail: "Manageable dependent costs" },
      { label: "No dependents, or they are financially independent", value: 4, detail: "No dependent obligations" },
      { label: "No dependents and no plans for any", value: 5, detail: "Maximum financial freedom" },
    ],
  },
  {
    id: 26, category: "time_horizon", priority: 3,
    text: "What is your primary financial goal for the next 10 years?",
    options: [
      { label: "Generate stable income to cover living expenses", value: 1, detail: "Income preservation" },
      { label: "Grow wealth moderately while maintaining income", value: 2, detail: "Income with growth" },
      { label: "Balance growth and income equally", value: 3, detail: "Balanced objective" },
      { label: "Maximize portfolio growth with minimal income needs", value: 4, detail: "Growth accumulation" },
      { label: "Aggressive wealth building — I don't need this money for decades", value: 5, detail: "Pure growth" },
    ],
  },
  {
    id: 27, category: "time_horizon", priority: 4,
    text: "How would you describe your career trajectory?",
    options: [
      { label: "Winding down — planning to reduce work within 3 years", value: 1, detail: "Declining earning years" },
      { label: "Stable — maintaining current income level", value: 2, detail: "Plateau phase" },
      { label: "Growing moderately — expect 3-5% annual increases", value: 3, detail: "Steady growth" },
      { label: "Growing strongly — expect significant advancement", value: 4, detail: "Strong upward trajectory" },
      { label: "Peak earning years ahead — substantial income growth expected", value: 5, detail: "Maximum earning potential" },
    ],
  },
  {
    id: 28, category: "time_horizon", priority: 4,
    text: "Do you plan to leave a financial legacy for heirs or charitable causes?",
    options: [
      { label: "No — I plan to spend everything in my lifetime", value: 3, detail: "Spend-down approach" },
      { label: "Minimal — whatever is left goes to heirs", value: 2, detail: "Residual legacy" },
      { label: "Moderate — I want to leave a meaningful inheritance", value: 3, detail: "Intentional legacy" },
      { label: "Significant — legacy planning is a major priority", value: 4, detail: "Legacy-focused" },
      { label: "Multi-generational wealth transfer is my primary goal", value: 5, detail: "Dynasty planning" },
    ],
  },
  {
    id: 29, category: "time_horizon", priority: 5,
    text: "How stable is your current living situation?",
    options: [
      { label: "Likely to relocate or downsize within 2 years", value: 1, detail: "Near-term transition" },
      { label: "May relocate within 5 years", value: 2, detail: "Moderate uncertainty" },
      { label: "Settled for the foreseeable future (5-10 years)", value: 3, detail: "Stable situation" },
      { label: "Very settled — no plans to move for 10+ years", value: 4, detail: "Long-term stability" },
      { label: "Permanently settled — own home outright, no plans to move", value: 5, detail: "Maximum stability" },
    ],
  },
  {
    id: 30, category: "time_horizon", priority: 5,
    text: "What is your spouse/partner's age relative to yours (if applicable)?",
    options: [
      { label: "N/A — single", value: 3, detail: "Individual planning only" },
      { label: "Spouse is 5+ years older", value: 2, detail: "Earlier joint income needs" },
      { label: "Spouse is within 5 years of my age", value: 3, detail: "Aligned timeline" },
      { label: "Spouse is 5-10 years younger", value: 4, detail: "Extended planning horizon" },
      { label: "Spouse is 10+ years younger", value: 5, detail: "Multi-decade planning needed" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 4: INVESTMENT EXPERIENCE (Questions 31-40)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 31, category: "investment_experience", priority: 1,
    text: "How many years have you been actively managing or directing investments?",
    options: [
      { label: "Less than 1 year", value: 1, detail: "Beginner investor" },
      { label: "1–5 years", value: 2, detail: "Early-stage investor" },
      { label: "5–15 years", value: 3, detail: "Experienced investor" },
      { label: "15–25 years", value: 4, detail: "Seasoned investor" },
      { label: "Over 25 years", value: 5, detail: "Veteran investor" },
    ],
  },
  {
    id: 32, category: "investment_experience", priority: 1,
    text: "Which of the following have you personally invested in? (Select the most complex)",
    options: [
      { label: "Savings accounts and CDs only", value: 1, detail: "Basic savings only" },
      { label: "Mutual funds and/or ETFs", value: 2, detail: "Pooled investment vehicles" },
      { label: "Individual stocks and bonds", value: 3, detail: "Direct securities" },
      { label: "Options, futures, or margin accounts", value: 4, detail: "Derivatives and leverage" },
      { label: "Private equity, hedge funds, or venture capital", value: 5, detail: "Alternative investments" },
    ],
  },
  {
    id: 33, category: "investment_experience", priority: 2,
    text: "Have you ever invested in real estate beyond your primary residence?",
    options: [
      { label: "No real estate investment experience", value: 1, detail: "No RE experience" },
      { label: "Owned one rental property at some point", value: 2, detail: "Basic RE experience" },
      { label: "Currently own 1-2 rental properties", value: 3, detail: "Active RE investor" },
      { label: "Own 3-5 properties or have done commercial deals", value: 4, detail: "Experienced RE investor" },
      { label: "Extensive portfolio (5+ properties, syndications, or development)", value: 5, detail: "Professional RE investor" },
    ],
  },
  {
    id: 34, category: "investment_experience", priority: 2,
    text: "How familiar are you with life insurance as an investment vehicle (IUL, whole life, VUL)?",
    options: [
      { label: "Not familiar at all", value: 1, detail: "No insurance investment knowledge" },
      { label: "Heard of it but don't understand the mechanics", value: 2, detail: "Awareness only" },
      { label: "Understand the basics of cash value life insurance", value: 3, detail: "Foundational knowledge" },
      { label: "Own a cash value policy and understand its features", value: 4, detail: "Active policyholder" },
      { label: "Deep expertise — use IUL/whole life as a core strategy", value: 5, detail: "Advanced insurance strategist" },
    ],
  },
  {
    id: 35, category: "investment_experience", priority: 3,
    text: "Have you ever experienced a portfolio loss exceeding 20%?",
    options: [
      { label: "No, and I would find that devastating", value: 1, detail: "Untested, high anxiety" },
      { label: "No, but I think I could handle it", value: 2, detail: "Untested, moderate confidence" },
      { label: "Yes, and I recovered by staying the course", value: 3, detail: "Tested and disciplined" },
      { label: "Yes, multiple times — it's part of investing", value: 4, detail: "Battle-hardened" },
      { label: "Yes, and I profited by buying during the downturn", value: 5, detail: "Crisis-tested opportunist" },
    ],
  },
  {
    id: 36, category: "investment_experience", priority: 3,
    text: "How do you typically make investment decisions?",
    options: [
      { label: "I rely entirely on my advisor's recommendations", value: 1, detail: "Fully delegated" },
      { label: "I follow my advisor's lead but ask questions", value: 2, detail: "Guided with input" },
      { label: "I collaborate equally with my advisor on decisions", value: 3, detail: "Collaborative approach" },
      { label: "I do my own research and use my advisor to validate", value: 4, detail: "Self-directed with validation" },
      { label: "I make all decisions independently", value: 5, detail: "Fully self-directed" },
    ],
  },
  {
    id: 37, category: "investment_experience", priority: 4,
    text: "How well do you understand the concept of asset correlation and portfolio diversification?",
    options: [
      { label: "I don't know what these terms mean", value: 1, detail: "No diversification knowledge" },
      { label: "I know diversification means 'don't put all eggs in one basket'", value: 2, detail: "Basic concept" },
      { label: "I understand how different asset classes move relative to each other", value: 3, detail: "Intermediate understanding" },
      { label: "I can construct a diversified portfolio across asset classes", value: 4, detail: "Advanced understanding" },
      { label: "I understand modern portfolio theory, efficient frontier, and factor investing", value: 5, detail: "Expert-level knowledge" },
    ],
  },
  {
    id: 38, category: "investment_experience", priority: 4,
    text: "Have you ever used leverage (margin, HELOC for investing, premium financing) in your investment strategy?",
    options: [
      { label: "No, and I wouldn't consider it", value: 1, detail: "Anti-leverage" },
      { label: "No, but I'm open to learning about it", value: 2, detail: "Leverage-curious" },
      { label: "Yes, conservatively (e.g., HELOC for rental property)", value: 3, detail: "Conservative leverage user" },
      { label: "Yes, regularly as part of my strategy", value: 4, detail: "Active leverage user" },
      { label: "Yes, including premium financing and margin strategies", value: 5, detail: "Advanced leverage strategist" },
    ],
  },
  {
    id: 39, category: "investment_experience", priority: 5,
    text: "How familiar are you with annuity products (MYGA, FIA, SPIA, variable annuities)?",
    options: [
      { label: "Not familiar at all", value: 1, detail: "No annuity knowledge" },
      { label: "Heard of annuities but don't understand the types", value: 2, detail: "Awareness only" },
      { label: "Understand the basics of fixed and variable annuities", value: 3, detail: "Foundational knowledge" },
      { label: "Own annuities and understand riders, caps, and participation rates", value: 4, detail: "Active annuity owner" },
      { label: "Deep expertise — use annuities strategically for income and accumulation", value: 5, detail: "Advanced annuity strategist" },
    ],
  },
  {
    id: 40, category: "investment_experience", priority: 5,
    text: "Have you ever invested in cryptocurrency or digital assets?",
    options: [
      { label: "No, and I have no interest", value: 1, detail: "Crypto-averse" },
      { label: "No, but I'm curious about it", value: 2, detail: "Crypto-curious" },
      { label: "Yes, a small allocation (<5% of portfolio)", value: 3, detail: "Small crypto allocation" },
      { label: "Yes, a meaningful allocation (5-15% of portfolio)", value: 4, detail: "Active crypto investor" },
      { label: "Yes, significant allocation (>15%) including DeFi/staking", value: 5, detail: "Advanced crypto investor" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 5: INCOME STABILITY & EMPLOYMENT (Questions 41-50)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 41, category: "income_stability", priority: 1,
    text: "How would you describe your primary income source?",
    options: [
      { label: "Commission-only or gig/freelance (highly variable)", value: 1, detail: "Highly variable income" },
      { label: "Base + commission or seasonal employment", value: 2, detail: "Semi-variable income" },
      { label: "Salaried employee at a private company", value: 3, detail: "Stable private sector" },
      { label: "Government, tenured, or union-protected position", value: 4, detail: "Very stable income" },
      { label: "Business owner with diversified revenue or retired with guaranteed income", value: 5, detail: "Maximum income security" },
    ],
  },
  {
    id: 42, category: "income_stability", priority: 1,
    text: "How secure is your current employment or business?",
    options: [
      { label: "Very uncertain — layoffs possible or business struggling", value: 1, detail: "High job risk" },
      { label: "Somewhat uncertain — industry is volatile", value: 2, detail: "Moderate job risk" },
      { label: "Reasonably secure — stable company and role", value: 3, detail: "Stable employment" },
      { label: "Very secure — essential role or strong business", value: 4, detail: "High job security" },
      { label: "Extremely secure — tenured, business owner, or financially independent", value: 5, detail: "Maximum security" },
    ],
  },
  {
    id: 43, category: "income_stability", priority: 2,
    text: "Do you have a pension or defined benefit plan?",
    options: [
      { label: "No pension and no expectation of one", value: 1, detail: "No pension safety net" },
      { label: "Small pension that will cover <20% of retirement expenses", value: 2, detail: "Minimal pension" },
      { label: "Moderate pension covering 20-40% of retirement expenses", value: 3, detail: "Helpful pension" },
      { label: "Strong pension covering 40-70% of retirement expenses", value: 4, detail: "Substantial pension" },
      { label: "Full pension covering 70%+ of retirement expenses", value: 5, detail: "Comprehensive pension" },
    ],
  },
  {
    id: 44, category: "income_stability", priority: 2,
    text: "What is your expected Social Security benefit at full retirement age?",
    options: [
      { label: "Minimal or not eligible", value: 1, detail: "Little SS income" },
      { label: "Under $2,000/month", value: 2, detail: "Below average SS" },
      { label: "$2,000 – $3,000/month", value: 3, detail: "Average SS benefit" },
      { label: "$3,000 – $4,000/month", value: 4, detail: "Above average SS" },
      { label: "Maximum benefit ($4,000+/month) or spousal benefits combined", value: 5, detail: "Maximum SS income" },
    ],
  },
  {
    id: 45, category: "income_stability", priority: 3,
    text: "How marketable are your professional skills if you needed to find new employment?",
    options: [
      { label: "Very limited — niche skills with few opportunities", value: 1, detail: "Low marketability" },
      { label: "Somewhat limited — would take 6+ months to find equivalent role", value: 2, detail: "Below average marketability" },
      { label: "Moderate — could find comparable work within 3-6 months", value: 3, detail: "Average marketability" },
      { label: "Strong — in-demand skills, could find work within 1-3 months", value: 4, detail: "High marketability" },
      { label: "Exceptional — regularly recruited, could start immediately", value: 5, detail: "Maximum marketability" },
    ],
  },
  {
    id: 46, category: "income_stability", priority: 3,
    text: "Does your spouse/partner have independent income?",
    options: [
      { label: "No spouse/partner or spouse doesn't work", value: 1, detail: "Single income household" },
      { label: "Spouse works part-time or has irregular income", value: 2, detail: "Supplemental income" },
      { label: "Spouse has stable full-time income", value: 3, detail: "Dual income household" },
      { label: "Spouse has high-earning career", value: 4, detail: "Strong dual income" },
      { label: "Spouse's income alone could support the household", value: 5, detail: "Fully redundant income" },
    ],
  },
  {
    id: 47, category: "income_stability", priority: 4,
    text: "Do you receive any passive income (rental, royalties, dividends, business distributions)?",
    options: [
      { label: "No passive income", value: 1, detail: "Fully active income dependent" },
      { label: "Less than $1,000/month in passive income", value: 2, detail: "Minimal passive income" },
      { label: "$1,000 – $5,000/month in passive income", value: 3, detail: "Meaningful passive income" },
      { label: "$5,000 – $15,000/month in passive income", value: 4, detail: "Strong passive income" },
      { label: "Over $15,000/month — passive income exceeds expenses", value: 5, detail: "Financial independence via passive income" },
    ],
  },
  {
    id: 48, category: "income_stability", priority: 4,
    text: "How has your income trended over the past 5 years?",
    options: [
      { label: "Declining significantly", value: 1, detail: "Negative income trend" },
      { label: "Flat or slightly declining", value: 2, detail: "Stagnant income" },
      { label: "Growing at roughly the rate of inflation (2-4%)", value: 3, detail: "Inflation-matching growth" },
      { label: "Growing 5-15% annually", value: 4, detail: "Strong income growth" },
      { label: "Growing over 15% annually", value: 5, detail: "Exceptional income growth" },
    ],
  },
  {
    id: 49, category: "income_stability", priority: 5,
    text: "Do you have disability insurance or income protection coverage?",
    options: [
      { label: "No disability coverage of any kind", value: 1, detail: "No income protection" },
      { label: "Basic employer-provided short-term disability only", value: 2, detail: "Minimal coverage" },
      { label: "Employer-provided short and long-term disability", value: 3, detail: "Standard coverage" },
      { label: "Employer coverage plus supplemental private policy", value: 4, detail: "Enhanced coverage" },
      { label: "Comprehensive own-occupation disability with riders", value: 5, detail: "Maximum income protection" },
    ],
  },
  {
    id: 50, category: "income_stability", priority: 5,
    text: "If your industry experienced a major disruption (technology, regulation, recession), how would your income be affected?",
    options: [
      { label: "Devastating — my skills are highly industry-specific", value: 1, detail: "Maximum disruption risk" },
      { label: "Significant impact — would need retraining", value: 2, detail: "High disruption risk" },
      { label: "Moderate impact — transferable skills would help", value: 3, detail: "Moderate disruption risk" },
      { label: "Minimal impact — my skills transfer across industries", value: 4, detail: "Low disruption risk" },
      { label: "No impact — my income is diversified or recession-proof", value: 5, detail: "Disruption-proof" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 6: DEBT & OBLIGATIONS (Questions 51-60)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 51, category: "debt_obligations", priority: 1,
    text: "What is your total debt-to-income ratio (total monthly debt payments ÷ gross monthly income)?",
    options: [
      { label: "Over 50%", value: 1, detail: "Critically over-leveraged" },
      { label: "36% – 50%", value: 2, detail: "High debt burden" },
      { label: "20% – 36%", value: 3, detail: "Manageable debt level" },
      { label: "10% – 20%", value: 4, detail: "Conservative debt level" },
      { label: "Under 10% or debt-free", value: 5, detail: "Minimal to no debt" },
    ],
  },
  {
    id: 52, category: "debt_obligations", priority: 1,
    text: "What is your total outstanding mortgage balance?",
    options: [
      { label: "Over $1,000,000", value: 1, detail: "Very large mortgage" },
      { label: "$500,000 – $1,000,000", value: 2, detail: "Large mortgage" },
      { label: "$200,000 – $500,000", value: 3, detail: "Moderate mortgage" },
      { label: "Under $200,000", value: 4, detail: "Small mortgage" },
      { label: "No mortgage — home is paid off or renting", value: 5, detail: "No mortgage obligation" },
    ],
  },
  {
    id: 53, category: "debt_obligations", priority: 2,
    text: "Do you carry credit card balances month to month?",
    options: [
      { label: "Yes, over $25,000 in revolving balances", value: 1, detail: "Severe credit card debt" },
      { label: "Yes, $10,000 – $25,000", value: 2, detail: "Significant credit card debt" },
      { label: "Yes, under $10,000", value: 3, detail: "Moderate credit card debt" },
      { label: "Rarely — only occasionally carry a small balance", value: 4, detail: "Minimal credit card debt" },
      { label: "Never — I pay in full every month", value: 5, detail: "Zero revolving debt" },
    ],
  },
  {
    id: 54, category: "debt_obligations", priority: 2,
    text: "Do you have outstanding student loans?",
    options: [
      { label: "Yes, over $100,000", value: 1, detail: "Major student loan burden" },
      { label: "Yes, $50,000 – $100,000", value: 2, detail: "Significant student loans" },
      { label: "Yes, under $50,000", value: 3, detail: "Manageable student loans" },
      { label: "No — paid off or never had them", value: 5, detail: "No student loan debt" },
      { label: "Eligible for forgiveness programs", value: 4, detail: "Forgiveness pathway" },
    ],
  },
  {
    id: 55, category: "debt_obligations", priority: 3,
    text: "Do you have any outstanding auto loans or leases?",
    options: [
      { label: "Yes, multiple vehicles with $50K+ total owed", value: 1, detail: "Heavy auto debt" },
      { label: "Yes, one vehicle with $25K–$50K owed", value: 2, detail: "Significant auto debt" },
      { label: "Yes, one vehicle with under $25K owed", value: 3, detail: "Moderate auto debt" },
      { label: "No auto loans — vehicles paid off", value: 4, detail: "No auto debt" },
      { label: "No auto loans and vehicles are modest relative to income", value: 5, detail: "Financially disciplined auto choices" },
    ],
  },
  {
    id: 56, category: "debt_obligations", priority: 3,
    text: "Are you financially supporting anyone outside your immediate household (parents, adult children, ex-spouse)?",
    options: [
      { label: "Yes, significant ongoing support (>$2,000/month)", value: 1, detail: "Heavy external obligations" },
      { label: "Yes, moderate support ($500–$2,000/month)", value: 2, detail: "Meaningful external obligations" },
      { label: "Yes, occasional or small support (<$500/month)", value: 3, detail: "Minor external obligations" },
      { label: "No current obligations but may in the future", value: 4, detail: "Potential future obligations" },
      { label: "No external financial obligations", value: 5, detail: "No external support burden" },
    ],
  },
  {
    id: 57, category: "debt_obligations", priority: 4,
    text: "Do you have any alimony or child support obligations?",
    options: [
      { label: "Yes, significant (>$3,000/month)", value: 1, detail: "Major support obligation" },
      { label: "Yes, moderate ($1,000–$3,000/month)", value: 2, detail: "Meaningful support obligation" },
      { label: "Yes, but ending within 3 years", value: 3, detail: "Temporary obligation" },
      { label: "No current obligations", value: 4, detail: "No support obligations" },
      { label: "No obligations and no likelihood of future ones", value: 5, detail: "Zero support risk" },
    ],
  },
  {
    id: 58, category: "debt_obligations", priority: 4,
    text: "What is the interest rate on your highest-rate debt?",
    options: [
      { label: "Over 20% (credit cards, payday loans)", value: 1, detail: "Toxic debt present" },
      { label: "12% – 20% (high-rate personal loans or cards)", value: 2, detail: "Expensive debt" },
      { label: "6% – 12% (auto loans, older mortgages)", value: 3, detail: "Moderate-rate debt" },
      { label: "3% – 6% (favorable mortgage or student loans)", value: 4, detail: "Low-rate debt" },
      { label: "Under 3% or no debt", value: 5, detail: "Optimal debt structure" },
    ],
  },
  {
    id: 59, category: "debt_obligations", priority: 5,
    text: "Have you ever filed for bankruptcy or had a debt sent to collections?",
    options: [
      { label: "Yes, within the last 5 years", value: 1, detail: "Recent financial distress" },
      { label: "Yes, 5-10 years ago", value: 2, detail: "Past financial distress" },
      { label: "Yes, over 10 years ago — fully recovered", value: 3, detail: "Distant past issue" },
      { label: "No, but I've had some late payments", value: 4, detail: "Minor credit issues" },
      { label: "Never — perfect payment history", value: 5, detail: "Pristine credit history" },
    ],
  },
  {
    id: 60, category: "debt_obligations", priority: 5,
    text: "Do you have any co-signed loans or personal guarantees on business debt?",
    options: [
      { label: "Yes, significant guarantees (>$200K)", value: 1, detail: "Major contingent liability" },
      { label: "Yes, moderate guarantees ($50K–$200K)", value: 2, detail: "Meaningful contingent liability" },
      { label: "Yes, small guarantees (<$50K)", value: 3, detail: "Minor contingent liability" },
      { label: "No current guarantees", value: 4, detail: "No contingent liabilities" },
      { label: "No guarantees and no likelihood of needing to co-sign", value: 5, detail: "Zero contingent risk" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 7: INSURANCE & PROTECTION (Questions 61-70)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 61, category: "insurance_protection", priority: 1,
    text: "What is your current life insurance coverage relative to your annual income?",
    options: [
      { label: "No life insurance", value: 1, detail: "No death benefit protection" },
      { label: "Less than 3x annual income", value: 2, detail: "Underinsured" },
      { label: "3–7x annual income", value: 3, detail: "Moderately insured" },
      { label: "7–15x annual income", value: 4, detail: "Well insured" },
      { label: "Over 15x annual income or self-insured", value: 5, detail: "Fully protected" },
    ],
  },
  {
    id: 62, category: "insurance_protection", priority: 1,
    text: "Do you have an umbrella liability insurance policy?",
    options: [
      { label: "No, and I don't know what that is", value: 1, detail: "No liability protection" },
      { label: "No, but I've considered it", value: 2, detail: "Aware but unprotected" },
      { label: "Yes, $1M coverage", value: 3, detail: "Basic umbrella coverage" },
      { label: "Yes, $2M–$5M coverage", value: 4, detail: "Strong umbrella coverage" },
      { label: "Yes, $5M+ coverage", value: 5, detail: "Maximum liability protection" },
    ],
  },
  {
    id: 63, category: "insurance_protection", priority: 2,
    text: "Do you have long-term care insurance or a plan for long-term care expenses?",
    options: [
      { label: "No plan and no insurance", value: 1, detail: "No LTC protection" },
      { label: "Planning to self-insure but haven't earmarked funds", value: 2, detail: "Vague LTC plan" },
      { label: "Have a hybrid life/LTC policy", value: 3, detail: "Hybrid LTC coverage" },
      { label: "Have a standalone LTC policy", value: 4, detail: "Dedicated LTC coverage" },
      { label: "Comprehensive LTC plan with dedicated funds and insurance", value: 5, detail: "Full LTC protection" },
    ],
  },
  {
    id: 64, category: "insurance_protection", priority: 2,
    text: "Do you have an estate plan (will, trust, power of attorney, healthcare directive)?",
    options: [
      { label: "No estate plan documents", value: 1, detail: "No estate planning" },
      { label: "Basic will only", value: 2, detail: "Minimal estate plan" },
      { label: "Will plus power of attorney and healthcare directive", value: 3, detail: "Standard estate plan" },
      { label: "Revocable living trust with all supporting documents", value: 4, detail: "Comprehensive estate plan" },
      { label: "Advanced estate plan with irrevocable trusts, ILIT, and tax planning", value: 5, detail: "Sophisticated estate plan" },
    ],
  },
  {
    id: 65, category: "insurance_protection", priority: 3,
    text: "How adequate is your health insurance coverage?",
    options: [
      { label: "No health insurance", value: 1, detail: "No health coverage" },
      { label: "High-deductible plan with no HSA funding", value: 2, detail: "Minimal health coverage" },
      { label: "Standard employer plan with reasonable deductibles", value: 3, detail: "Standard health coverage" },
      { label: "Comprehensive plan with low deductibles and HSA", value: 4, detail: "Strong health coverage" },
      { label: "Premium plan with dental, vision, and fully funded HSA", value: 5, detail: "Maximum health coverage" },
    ],
  },
  {
    id: 66, category: "insurance_protection", priority: 3,
    text: "Do you have property insurance adequate to cover replacement costs?",
    options: [
      { label: "No property insurance or significantly underinsured", value: 1, detail: "Major property risk" },
      { label: "Basic coverage but haven't reviewed in years", value: 2, detail: "Potentially underinsured" },
      { label: "Standard coverage reviewed within 2 years", value: 3, detail: "Adequate coverage" },
      { label: "Comprehensive coverage with replacement cost and riders", value: 4, detail: "Strong coverage" },
      { label: "Full replacement cost with scheduled items and flood/earthquake", value: 5, detail: "Maximum property protection" },
    ],
  },
  {
    id: 67, category: "insurance_protection", priority: 4,
    text: "Do you have any key-person or business continuation insurance?",
    options: [
      { label: "N/A — not a business owner", value: 3, detail: "Not applicable" },
      { label: "Business owner with no key-person insurance", value: 1, detail: "Unprotected business" },
      { label: "Basic key-person policy", value: 3, detail: "Basic business protection" },
      { label: "Key-person plus buy-sell agreement funded with insurance", value: 4, detail: "Strong business protection" },
      { label: "Comprehensive business continuation plan with cross-purchase agreements", value: 5, detail: "Full business protection" },
    ],
  },
  {
    id: 68, category: "insurance_protection", priority: 4,
    text: "Have you designated and recently reviewed beneficiaries on all accounts and policies?",
    options: [
      { label: "I haven't designated beneficiaries on most accounts", value: 1, detail: "Critical gap" },
      { label: "Designated but haven't reviewed in over 5 years", value: 2, detail: "Potentially outdated" },
      { label: "Designated and reviewed within the last 2-5 years", value: 3, detail: "Reasonably current" },
      { label: "All accounts have current beneficiaries reviewed annually", value: 4, detail: "Well-maintained" },
      { label: "All beneficiaries aligned with estate plan and reviewed with attorney", value: 5, detail: "Fully coordinated" },
    ],
  },
  {
    id: 69, category: "insurance_protection", priority: 5,
    text: "Do you have identity theft protection or cyber insurance?",
    options: [
      { label: "No protection of any kind", value: 1, detail: "No cyber protection" },
      { label: "Free credit monitoring only", value: 2, detail: "Basic monitoring" },
      { label: "Paid identity theft protection service", value: 3, detail: "Active protection" },
      { label: "Identity protection plus cyber insurance rider", value: 4, detail: "Enhanced protection" },
      { label: "Comprehensive cyber coverage including business and personal", value: 5, detail: "Maximum cyber protection" },
    ],
  },
  {
    id: 70, category: "insurance_protection", priority: 5,
    text: "How would you rate your overall insurance and protection coverage?",
    options: [
      { label: "Significant gaps — I know I'm underprotected", value: 1, detail: "Major protection gaps" },
      { label: "Some coverage but I suspect gaps exist", value: 2, detail: "Probable gaps" },
      { label: "Reasonable coverage across most areas", value: 3, detail: "Adequate protection" },
      { label: "Comprehensive coverage with few gaps", value: 4, detail: "Strong protection" },
      { label: "Fully protected — all risks identified and covered", value: 5, detail: "Maximum protection" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 8: TAX SITUATION & PLANNING (Questions 71-80)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 71, category: "tax_situation", priority: 1,
    text: "What is your current marginal federal income tax bracket?",
    options: [
      { label: "10% or 12%", value: 1, detail: "Low tax bracket" },
      { label: "22%", value: 2, detail: "Moderate tax bracket" },
      { label: "24% or 32%", value: 3, detail: "Upper-middle tax bracket" },
      { label: "35%", value: 4, detail: "High tax bracket" },
      { label: "37% (top bracket)", value: 5, detail: "Maximum tax bracket" },
    ],
  },
  {
    id: 72, category: "tax_situation", priority: 1,
    text: "How much of your investment portfolio is in tax-advantaged accounts (401k, IRA, Roth, HSA)?",
    options: [
      { label: "Less than 10%", value: 1, detail: "Mostly taxable" },
      { label: "10% – 30%", value: 2, detail: "Limited tax advantage" },
      { label: "30% – 50%", value: 3, detail: "Moderate tax advantage" },
      { label: "50% – 75%", value: 4, detail: "Strong tax advantage" },
      { label: "Over 75%", value: 5, detail: "Maximum tax efficiency" },
    ],
  },
  {
    id: 73, category: "tax_situation", priority: 2,
    text: "Do you have a Roth IRA or Roth 401(k)?",
    options: [
      { label: "No Roth accounts and not eligible", value: 1, detail: "No Roth access" },
      { label: "No, but I'm considering Roth conversions", value: 2, detail: "Roth-curious" },
      { label: "Yes, small Roth balance (<$50K)", value: 3, detail: "Small Roth position" },
      { label: "Yes, meaningful Roth balance ($50K–$250K)", value: 4, detail: "Solid Roth position" },
      { label: "Yes, substantial Roth balance (>$250K) or active conversion strategy", value: 5, detail: "Strong Roth strategy" },
    ],
  },
  {
    id: 74, category: "tax_situation", priority: 2,
    text: "Do you work with a CPA or tax advisor who does proactive tax planning (not just filing)?",
    options: [
      { label: "I file my own taxes with software", value: 1, detail: "No professional tax guidance" },
      { label: "I use a tax preparer for filing only", value: 2, detail: "Filing only" },
      { label: "I have a CPA who does basic planning", value: 3, detail: "Basic tax planning" },
      { label: "I have a CPA who does proactive year-round planning", value: 4, detail: "Active tax planning" },
      { label: "I have a tax team with advanced strategies (trusts, entities, charitable)", value: 5, detail: "Sophisticated tax planning" },
    ],
  },
  {
    id: 75, category: "tax_situation", priority: 3,
    text: "Do you have any tax loss harvesting opportunities or carryforward losses?",
    options: [
      { label: "I don't know what tax loss harvesting is", value: 1, detail: "No TLH awareness" },
      { label: "I'm aware of it but haven't implemented it", value: 2, detail: "TLH awareness only" },
      { label: "I occasionally harvest losses when reminded", value: 3, detail: "Occasional TLH" },
      { label: "I systematically harvest losses throughout the year", value: 4, detail: "Active TLH strategy" },
      { label: "I have significant carryforward losses and a sophisticated TLH program", value: 5, detail: "Advanced TLH program" },
    ],
  },
  {
    id: 76, category: "tax_situation", priority: 3,
    text: "Do you own a business or have self-employment income?",
    options: [
      { label: "No business or self-employment income", value: 1, detail: "W-2 only" },
      { label: "Small side business (<$25K revenue)", value: 2, detail: "Small side income" },
      { label: "Meaningful business income ($25K–$100K)", value: 3, detail: "Significant business income" },
      { label: "Substantial business ($100K–$500K revenue)", value: 4, detail: "Major business income" },
      { label: "Large business (>$500K revenue) with entity structuring", value: 5, detail: "Complex business structure" },
    ],
  },
  {
    id: 77, category: "tax_situation", priority: 4,
    text: "Do you make charitable contributions as part of your tax strategy?",
    options: [
      { label: "No charitable giving", value: 1, detail: "No charitable deductions" },
      { label: "Small cash donations (<$1,000/year)", value: 2, detail: "Minimal charitable giving" },
      { label: "Regular giving ($1,000–$10,000/year)", value: 3, detail: "Moderate charitable giving" },
      { label: "Strategic giving ($10K+) including appreciated stock or DAF", value: 4, detail: "Tax-optimized giving" },
      { label: "Major philanthropy with CRT, foundation, or QCD strategies", value: 5, detail: "Advanced philanthropic planning" },
    ],
  },
  {
    id: 78, category: "tax_situation", priority: 4,
    text: "Are you subject to state income tax?",
    options: [
      { label: "Yes, high state tax (>7%: CA, NY, NJ, etc.)", value: 1, detail: "High state tax burden" },
      { label: "Yes, moderate state tax (4-7%)", value: 2, detail: "Moderate state tax" },
      { label: "Yes, low state tax (<4%)", value: 3, detail: "Low state tax" },
      { label: "No state income tax (FL, TX, NV, etc.)", value: 4, detail: "No state income tax" },
      { label: "No state tax and considering relocation for further tax optimization", value: 5, detail: "Tax-optimized residency" },
    ],
  },
  {
    id: 79, category: "tax_situation", priority: 5,
    text: "Do you have exposure to the Net Investment Income Tax (NIIT) or Alternative Minimum Tax (AMT)?",
    options: [
      { label: "I don't know what these are", value: 1, detail: "Unaware of additional taxes" },
      { label: "I may be subject but haven't checked", value: 2, detail: "Possible exposure" },
      { label: "Yes, I pay NIIT or AMT and it's managed", value: 3, detail: "Managed exposure" },
      { label: "Yes, and I have strategies to minimize impact", value: 4, detail: "Active mitigation" },
      { label: "Not subject due to income structure and planning", value: 5, detail: "Fully optimized" },
    ],
  },
  {
    id: 80, category: "tax_situation", priority: 5,
    text: "How would you rate your overall tax efficiency across all accounts and income sources?",
    options: [
      { label: "I've never thought about tax efficiency", value: 1, detail: "No tax optimization" },
      { label: "I take basic deductions but don't optimize", value: 2, detail: "Basic tax management" },
      { label: "I have some tax-efficient strategies in place", value: 3, detail: "Moderate tax efficiency" },
      { label: "I actively optimize across accounts, entities, and timing", value: 4, detail: "Strong tax efficiency" },
      { label: "Comprehensive multi-year tax plan with asset location, entity structuring, and timing", value: 5, detail: "Maximum tax efficiency" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 9: GOALS & PRIORITIES (Questions 81-90)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 81, category: "goals_priorities", priority: 1,
    text: "What is your single most important financial goal right now?",
    options: [
      { label: "Getting out of debt", value: 1, detail: "Debt elimination priority" },
      { label: "Building an emergency fund", value: 2, detail: "Safety net priority" },
      { label: "Saving for a specific goal (home, education, business)", value: 3, detail: "Goal-specific saving" },
      { label: "Maximizing retirement savings", value: 4, detail: "Retirement accumulation" },
      { label: "Growing wealth and creating generational legacy", value: 5, detail: "Wealth building" },
    ],
  },
  {
    id: 82, category: "goals_priorities", priority: 1,
    text: "How important is generating current income from your investments vs. long-term growth?",
    options: [
      { label: "I need maximum current income — growth is secondary", value: 1, detail: "Income-first priority" },
      { label: "Mostly income with some growth", value: 2, detail: "Income-leaning" },
      { label: "Equal balance of income and growth", value: 3, detail: "Balanced priority" },
      { label: "Mostly growth with some income", value: 4, detail: "Growth-leaning" },
      { label: "100% growth — I don't need any current income", value: 5, detail: "Pure growth priority" },
    ],
  },
  {
    id: 83, category: "goals_priorities", priority: 2,
    text: "How important is leaving a financial legacy to your heirs?",
    options: [
      { label: "Not important — I plan to enjoy every dollar", value: 1, detail: "No legacy priority" },
      { label: "Somewhat — whatever's left is fine", value: 2, detail: "Residual legacy" },
      { label: "Moderately important — I want to leave something meaningful", value: 3, detail: "Moderate legacy goal" },
      { label: "Very important — it's a major planning priority", value: 4, detail: "Strong legacy goal" },
      { label: "Critical — multi-generational wealth transfer is my primary objective", value: 5, detail: "Dynasty planning" },
    ],
  },
  {
    id: 84, category: "goals_priorities", priority: 2,
    text: "Do you have specific lifestyle goals that require significant capital (second home, travel, philanthropy)?",
    options: [
      { label: "No specific lifestyle goals beyond basic retirement", value: 1, detail: "Basic lifestyle needs" },
      { label: "Some travel and experiences planned", value: 2, detail: "Modest lifestyle goals" },
      { label: "Meaningful goals ($50K–$200K in capital needed)", value: 3, detail: "Moderate lifestyle goals" },
      { label: "Significant goals ($200K–$1M in capital needed)", value: 4, detail: "Substantial lifestyle goals" },
      { label: "Major lifestyle goals (>$1M — second home, yacht, philanthropy)", value: 5, detail: "Premium lifestyle goals" },
    ],
  },
  {
    id: 85, category: "goals_priorities", priority: 3,
    text: "How important is tax-free retirement income to you?",
    options: [
      { label: "I haven't thought about it", value: 1, detail: "No tax-free income awareness" },
      { label: "Somewhat — but I'm not sure how to achieve it", value: 2, detail: "Interested but uninformed" },
      { label: "Important — I'm actively working toward Roth conversions", value: 3, detail: "Active Roth strategy" },
      { label: "Very important — it's a core part of my retirement plan", value: 4, detail: "Tax-free income priority" },
      { label: "Critical — I want 100% of retirement income to be tax-free", value: 5, detail: "Maximum tax-free income goal" },
    ],
  },
  {
    id: 86, category: "goals_priorities", priority: 3,
    text: "Are you interested in using life insurance (IUL) as a wealth-building and income tool?",
    options: [
      { label: "No interest — I view insurance as protection only", value: 1, detail: "Insurance = protection only" },
      { label: "Curious but skeptical", value: 2, detail: "Open but cautious" },
      { label: "Interested and want to learn more", value: 3, detail: "Actively interested" },
      { label: "Already using IUL as part of my strategy", value: 4, detail: "Active IUL user" },
      { label: "IUL is a cornerstone of my wealth strategy", value: 5, detail: "IUL advocate" },
    ],
  },
  {
    id: 87, category: "goals_priorities", priority: 4,
    text: "How important is protecting your assets from lawsuits, creditors, or divorce?",
    options: [
      { label: "Not a concern", value: 1, detail: "No asset protection need" },
      { label: "Slightly concerned but haven't acted", value: 2, detail: "Mild concern" },
      { label: "Moderately concerned — some basic protections in place", value: 3, detail: "Basic protection" },
      { label: "Very concerned — have trusts and entity structures", value: 4, detail: "Active asset protection" },
      { label: "Critical priority — comprehensive asset protection plan", value: 5, detail: "Maximum asset protection" },
    ],
  },
  {
    id: 88, category: "goals_priorities", priority: 4,
    text: "Do you want your financial plan to account for potential business sale or liquidity event?",
    options: [
      { label: "N/A — no business to sell", value: 3, detail: "Not applicable" },
      { label: "No plans to sell my business", value: 2, detail: "Hold indefinitely" },
      { label: "Possible sale in 5-10 years", value: 3, detail: "Potential future event" },
      { label: "Planning to sell within 5 years", value: 4, detail: "Near-term liquidity event" },
      { label: "Actively preparing for sale — need exit planning", value: 5, detail: "Active exit planning" },
    ],
  },
  {
    id: 89, category: "goals_priorities", priority: 5,
    text: "How important is maintaining your current lifestyle in retirement vs. reducing expenses?",
    options: [
      { label: "I expect to significantly reduce expenses in retirement", value: 1, detail: "Major lifestyle reduction" },
      { label: "I'll reduce somewhat but maintain core lifestyle", value: 2, detail: "Moderate reduction" },
      { label: "I want to maintain my exact current lifestyle", value: 3, detail: "Lifestyle maintenance" },
      { label: "I want to improve my lifestyle in retirement", value: 4, detail: "Lifestyle improvement" },
      { label: "I want a significantly enhanced lifestyle (more travel, second home)", value: 5, detail: "Lifestyle upgrade" },
    ],
  },
  {
    id: 90, category: "goals_priorities", priority: 5,
    text: "How do you prioritize financial security vs. financial growth?",
    options: [
      { label: "Security is everything — I never want to worry about money", value: 1, detail: "Maximum security" },
      { label: "Mostly security with a small growth component", value: 2, detail: "Security-leaning" },
      { label: "Equal balance of security and growth", value: 3, detail: "Balanced priority" },
      { label: "Mostly growth — I have enough security already", value: 4, detail: "Growth-leaning" },
      { label: "Maximum growth — security comes from wealth accumulation", value: 5, detail: "Growth-first philosophy" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 10: BEHAVIORAL FINANCE & PSYCHOLOGY (Questions 91-100)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 91, category: "behavioral_finance", priority: 1,
    text: "How often do you check your investment portfolio?",
    options: [
      { label: "Multiple times per day", value: 1, detail: "Obsessive monitoring — high anxiety" },
      { label: "Daily", value: 2, detail: "Frequent monitoring" },
      { label: "Weekly", value: 3, detail: "Regular monitoring" },
      { label: "Monthly", value: 4, detail: "Disciplined monitoring" },
      { label: "Quarterly or less", value: 5, detail: "Patient, long-term focus" },
    ],
  },
  {
    id: 92, category: "behavioral_finance", priority: 1,
    text: "Have you ever made an impulsive financial decision you later regretted?",
    options: [
      { label: "Yes, multiple times with significant consequences", value: 1, detail: "Pattern of impulsive decisions" },
      { label: "Yes, a few times with moderate consequences", value: 2, detail: "Occasional impulsiveness" },
      { label: "Once or twice with minor consequences", value: 3, detail: "Rare impulsiveness" },
      { label: "Rarely — I almost always think decisions through", value: 4, detail: "Disciplined decision-maker" },
      { label: "Never — I have a rigorous decision-making process", value: 5, detail: "Systematic decision-maker" },
    ],
  },
  {
    id: 93, category: "behavioral_finance", priority: 2,
    text: "How do you handle financial disagreements with your spouse/partner?",
    options: [
      { label: "We avoid discussing money — it causes conflict", value: 1, detail: "Financial avoidance" },
      { label: "We disagree frequently and struggle to align", value: 2, detail: "Financial conflict" },
      { label: "We discuss but one person usually makes the final call", value: 3, detail: "Unequal financial partnership" },
      { label: "We discuss openly and usually reach consensus", value: 4, detail: "Collaborative approach" },
      { label: "We're fully aligned on financial goals and strategy", value: 5, detail: "Financial harmony" },
    ],
  },
  {
    id: 94, category: "behavioral_finance", priority: 2,
    text: "How would you describe your relationship with money?",
    options: [
      { label: "Money causes me significant stress and anxiety", value: 1, detail: "Money anxiety" },
      { label: "I worry about money more than I'd like", value: 2, detail: "Moderate money stress" },
      { label: "I have a healthy but cautious relationship with money", value: 3, detail: "Balanced money mindset" },
      { label: "I'm comfortable with money and see it as a tool", value: 4, detail: "Healthy money relationship" },
      { label: "I'm very confident managing money — it energizes me", value: 5, detail: "Money mastery" },
    ],
  },
  {
    id: 95, category: "behavioral_finance", priority: 3,
    text: "When financial news is overwhelmingly negative, what do you typically do?",
    options: [
      { label: "Panic and consider major portfolio changes", value: 1, detail: "News-driven panic" },
      { label: "Feel anxious and call my advisor for reassurance", value: 2, detail: "Anxiety-driven action" },
      { label: "Monitor more closely but stick to my plan", value: 3, detail: "Heightened awareness" },
      { label: "Tune out the noise and trust my strategy", value: 4, detail: "Disciplined tuning out" },
      { label: "Look for buying opportunities in the fear", value: 5, detail: "Contrarian action" },
    ],
  },
  {
    id: 96, category: "behavioral_finance", priority: 3,
    text: "How do you feel about paying for professional financial advice?",
    options: [
      { label: "I'd rather manage everything myself to save fees", value: 1, detail: "Fee-averse DIY" },
      { label: "I'll pay for advice but constantly question the value", value: 2, detail: "Value-questioning" },
      { label: "I see the value and am willing to pay reasonable fees", value: 3, detail: "Value-aware" },
      { label: "I believe good advice pays for itself many times over", value: 4, detail: "Advice advocate" },
      { label: "I invest heavily in advice — it's my competitive advantage", value: 5, detail: "Premium advice seeker" },
    ],
  },
  {
    id: 97, category: "behavioral_finance", priority: 4,
    text: "How do you react when a friend tells you about a 'can't miss' investment opportunity?",
    options: [
      { label: "I get excited and want to invest immediately", value: 1, detail: "Susceptible to tips" },
      { label: "I'm interested and do some quick research", value: 2, detail: "Tip-influenced" },
      { label: "I listen politely but do thorough due diligence", value: 3, detail: "Cautious evaluator" },
      { label: "I'm skeptical — most tips don't pan out", value: 4, detail: "Healthy skepticism" },
      { label: "I ignore tips entirely — I follow my own process", value: 5, detail: "Process-driven" },
    ],
  },
  {
    id: 98, category: "behavioral_finance", priority: 4,
    text: "How comfortable are you with the concept of 'good debt' (leverage that builds wealth)?",
    options: [
      { label: "All debt is bad — I want to be completely debt-free", value: 1, detail: "Anti-debt philosophy" },
      { label: "I accept a mortgage but no other debt", value: 2, detail: "Mortgage-only debt tolerance" },
      { label: "I understand good debt but am cautious about using it", value: 3, detail: "Cautious leverage acceptance" },
      { label: "I actively use strategic debt (real estate, business)", value: 4, detail: "Strategic leverage user" },
      { label: "I embrace leverage as a wealth-building accelerator", value: 5, detail: "Leverage advocate" },
    ],
  },
  {
    id: 99, category: "behavioral_finance", priority: 5,
    text: "If you could describe your financial personality in one word, which would it be?",
    options: [
      { label: "Anxious", value: 1, detail: "Fear-driven financial behavior" },
      { label: "Cautious", value: 2, detail: "Safety-first approach" },
      { label: "Balanced", value: 3, detail: "Measured approach" },
      { label: "Confident", value: 4, detail: "Self-assured decision-making" },
      { label: "Aggressive", value: 5, detail: "Bold financial action" },
    ],
  },
  {
    id: 100, category: "behavioral_finance", priority: 5,
    text: "Looking back at your financial decisions over the past 10 years, how would you rate them overall?",
    options: [
      { label: "Poor — I've made many costly mistakes", value: 1, detail: "Significant regret" },
      { label: "Below average — some good decisions but too many bad ones", value: 2, detail: "Mixed results" },
      { label: "Average — about what most people would have done", value: 3, detail: "Typical outcomes" },
      { label: "Good — I've made mostly smart decisions", value: 4, detail: "Positive track record" },
      { label: "Excellent — my financial decisions have compounded well", value: 5, detail: "Strong track record" },
    ],
  },
];
