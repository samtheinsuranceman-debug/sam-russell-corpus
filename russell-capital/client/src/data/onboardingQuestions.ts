/**
 * Russell Capital Solutions™ — 100-Question Client Onboarding Assessment
 * 10 Categories × 10 Questions = 100 Total
 * Priority 1-5 (20 questions each level, 2 per category per level)
 * Depth selector: level N shows all questions with priority ≤ N
 *   Level 1 = 20 questions (essentials)
 *   Level 2 = 40 questions
 *   Level 3 = 60 questions
 *   Level 4 = 80 questions
 *   Level 5 = 100 questions (full deep-dive)
 */

export interface OnboardingQuestion {
  id: number;
  text: string;
  category: string;
  priority: number; // 1-5
  type: "text" | "number" | "select" | "slider" | "boolean";
  options?: { label: string; value: string }[];
  placeholder?: string;
  helperText?: string;
}

export interface OnboardingCategory {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export const ONBOARDING_CATEGORIES: OnboardingCategory[] = [
  { key: "personal", label: "Personal & Family", description: "Your household, dependents, and life stage", icon: "User" },
  { key: "income", label: "Income & Employment", description: "Earnings, job stability, and income sources", icon: "Briefcase" },
  { key: "assets", label: "Assets & Net Worth", description: "Savings, investments, and property", icon: "Wallet" },
  { key: "debt", label: "Debt & Obligations", description: "Mortgages, loans, and recurring liabilities", icon: "CreditCard" },
  { key: "insurance", label: "Insurance Coverage", description: "Life, health, disability, and long-term care", icon: "Shield" },
  { key: "retirement", label: "Retirement Planning", description: "401(k), IRA, pension, and Social Security", icon: "Clock" },
  { key: "tax", label: "Tax Situation", description: "Filing status, bracket, and tax planning", icon: "FileText" },
  { key: "estate", label: "Estate & Legacy", description: "Wills, trusts, and wealth transfer", icon: "Building" },
  { key: "goals", label: "Goals & Priorities", description: "Short-term and long-term financial objectives", icon: "Target" },
  { key: "risk", label: "Risk & Behavioral", description: "Investment temperament and decision-making style", icon: "Brain" },
];

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  // ═══════════════════════════════════════════════════════════════
  // PERSONAL & FAMILY — 10 questions (2 per priority level)
  // ═══════════════════════════════════════════════════════════════
  { id: 1, category: "personal", priority: 1, type: "text", text: "What is your full legal name?", placeholder: "First and last name" },
  { id: 2, category: "personal", priority: 1, type: "number", text: "What is your current age?", placeholder: "e.g. 45" },
  { id: 3, category: "personal", priority: 2, type: "select", text: "What is your marital status?", options: [{ label: "Single", value: "single" }, { label: "Married", value: "married" }, { label: "Divorced", value: "divorced" }, { label: "Widowed", value: "widowed" }, { label: "Domestic Partner", value: "partner" }] },
  { id: 4, category: "personal", priority: 2, type: "number", text: "How many dependents do you currently support?", placeholder: "0" },
  { id: 5, category: "personal", priority: 3, type: "text", text: "What is your spouse or partner's name and age?", placeholder: "Name, age" },
  { id: 6, category: "personal", priority: 3, type: "select", text: "What is your primary state of residence?", options: [{ label: "Select state", value: "" }], helperText: "Used for state-specific tax and insurance analysis" },
  { id: 7, category: "personal", priority: 4, type: "text", text: "List the ages and relationships of all dependents (children, parents, etc.)", placeholder: "e.g. Son 12, Daughter 8, Mother 72" },
  { id: 8, category: "personal", priority: 4, type: "select", text: "Do you anticipate any major life changes in the next 3 years?", options: [{ label: "No major changes expected", value: "none" }, { label: "Marriage or divorce", value: "marriage_change" }, { label: "New child or adoption", value: "child" }, { label: "Career change", value: "career" }, { label: "Relocation", value: "relocation" }, { label: "Retirement", value: "retirement" }] },
  { id: 9, category: "personal", priority: 5, type: "text", text: "Describe your family's health history and any chronic conditions that may affect financial planning.", placeholder: "Health considerations..." },
  { id: 10, category: "personal", priority: 5, type: "boolean", text: "Are you a U.S. citizen or permanent resident for tax purposes?" },

  // ═══════════════════════════════════════════════════════════════
  // INCOME & EMPLOYMENT — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 11, category: "income", priority: 1, type: "number", text: "What is your annual gross household income?", placeholder: "$0", helperText: "Include all sources: salary, business, rental, etc." },
  { id: 12, category: "income", priority: 1, type: "select", text: "What is your primary employment type?", options: [{ label: "W-2 Employee", value: "w2" }, { label: "Self-Employed / 1099", value: "self_employed" }, { label: "Business Owner", value: "business_owner" }, { label: "Retired", value: "retired" }, { label: "Not Currently Employed", value: "unemployed" }] },
  { id: 13, category: "income", priority: 2, type: "number", text: "What is your spouse's annual income (if applicable)?", placeholder: "$0" },
  { id: 14, category: "income", priority: 2, type: "select", text: "How stable do you consider your primary income source?", options: [{ label: "Very stable (government, tenured)", value: "very_stable" }, { label: "Stable (established employer)", value: "stable" }, { label: "Moderate (commission-based, contract)", value: "moderate" }, { label: "Variable (seasonal, gig economy)", value: "variable" }, { label: "Uncertain", value: "uncertain" }] },
  { id: 15, category: "income", priority: 3, type: "number", text: "What percentage of your income is variable (bonuses, commissions, etc.)?", placeholder: "0%", helperText: "Approximate percentage" },
  { id: 16, category: "income", priority: 3, type: "boolean", text: "Do you have any passive income streams (rental, royalties, dividends)?" },
  { id: 17, category: "income", priority: 4, type: "number", text: "What is your annual passive income amount?", placeholder: "$0" },
  { id: 18, category: "income", priority: 4, type: "text", text: "Describe any side businesses or additional income sources.", placeholder: "Business details..." },
  { id: 19, category: "income", priority: 5, type: "select", text: "Do you expect your income to increase, stay flat, or decrease over the next 5 years?", options: [{ label: "Significant increase (>15%)", value: "sig_increase" }, { label: "Moderate increase (5-15%)", value: "mod_increase" }, { label: "Stay roughly the same", value: "flat" }, { label: "Moderate decrease", value: "mod_decrease" }, { label: "Significant decrease (retirement, etc.)", value: "sig_decrease" }] },
  { id: 20, category: "income", priority: 5, type: "boolean", text: "Does your employer offer equity compensation (stock options, RSUs, ESPP)?" },

  // ═══════════════════════════════════════════════════════════════
  // ASSETS & NET WORTH — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 21, category: "assets", priority: 1, type: "number", text: "What is the total value of your liquid savings (checking, savings, money market)?", placeholder: "$0" },
  { id: 22, category: "assets", priority: 1, type: "number", text: "What is the approximate total value of your investment accounts (brokerage, mutual funds)?", placeholder: "$0" },
  { id: 23, category: "assets", priority: 2, type: "number", text: "What is the estimated market value of all real estate you own?", placeholder: "$0" },
  { id: 24, category: "assets", priority: 2, type: "number", text: "What is the total equity in your primary residence?", placeholder: "$0" },
  { id: 25, category: "assets", priority: 3, type: "number", text: "Do you own any investment or rental properties? If so, what is their combined value?", placeholder: "$0" },
  { id: 26, category: "assets", priority: 3, type: "boolean", text: "Do you have any collectibles, precious metals, or alternative assets worth over $50,000?" },
  { id: 27, category: "assets", priority: 4, type: "number", text: "What is the total cash value of any life insurance policies you own?", placeholder: "$0" },
  { id: 28, category: "assets", priority: 4, type: "number", text: "What is the current value of any annuity contracts you hold?", placeholder: "$0" },
  { id: 29, category: "assets", priority: 5, type: "text", text: "List any business interests, partnerships, or private equity holdings and their estimated value.", placeholder: "Business interests..." },
  { id: 30, category: "assets", priority: 5, type: "number", text: "What is the total value of any cryptocurrency or digital asset holdings?", placeholder: "$0" },

  // ═══════════════════════════════════════════════════════════════
  // DEBT & OBLIGATIONS — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 31, category: "debt", priority: 1, type: "number", text: "What is your total outstanding mortgage balance?", placeholder: "$0" },
  { id: 32, category: "debt", priority: 1, type: "number", text: "What are your total monthly debt payments (mortgage, car, student loans, credit cards)?", placeholder: "$0" },
  { id: 33, category: "debt", priority: 2, type: "number", text: "What is your current mortgage interest rate?", placeholder: "0.00%", helperText: "If multiple properties, use primary residence rate" },
  { id: 34, category: "debt", priority: 2, type: "number", text: "What is your total credit card balance?", placeholder: "$0" },
  { id: 35, category: "debt", priority: 3, type: "number", text: "What is your total student loan balance?", placeholder: "$0" },
  { id: 36, category: "debt", priority: 3, type: "number", text: "What is your total auto loan balance?", placeholder: "$0" },
  { id: 37, category: "debt", priority: 4, type: "boolean", text: "Do you have any outstanding HELOC or home equity loan balances?" },
  { id: 38, category: "debt", priority: 4, type: "number", text: "What is your debt-to-income ratio (total monthly debt / gross monthly income)?", placeholder: "0%", helperText: "We can calculate this for you if unsure" },
  { id: 39, category: "debt", priority: 5, type: "text", text: "Describe any co-signed loans, business debts, or contingent liabilities.", placeholder: "Details..." },
  { id: 40, category: "debt", priority: 5, type: "select", text: "What is your primary debt elimination strategy?", options: [{ label: "Minimum payments only", value: "minimum" }, { label: "Avalanche (highest rate first)", value: "avalanche" }, { label: "Snowball (smallest balance first)", value: "snowball" }, { label: "Consolidation", value: "consolidation" }, { label: "No specific strategy", value: "none" }] },

  // ═══════════════════════════════════════════════════════════════
  // INSURANCE COVERAGE — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 41, category: "insurance", priority: 1, type: "boolean", text: "Do you currently have life insurance?" },
  { id: 42, category: "insurance", priority: 1, type: "select", text: "What type of life insurance do you have?", options: [{ label: "None", value: "none" }, { label: "Term Life", value: "term" }, { label: "Whole Life", value: "whole" }, { label: "Universal Life (UL/IUL/VUL)", value: "universal" }, { label: "Multiple types", value: "multiple" }] },
  { id: 43, category: "insurance", priority: 2, type: "number", text: "What is your total life insurance death benefit?", placeholder: "$0" },
  { id: 44, category: "insurance", priority: 2, type: "boolean", text: "Do you have disability insurance (short-term or long-term)?" },
  { id: 45, category: "insurance", priority: 3, type: "boolean", text: "Do you have long-term care insurance?" },
  { id: 46, category: "insurance", priority: 3, type: "number", text: "What is your annual total insurance premium (all policies combined)?", placeholder: "$0" },
  { id: 47, category: "insurance", priority: 4, type: "select", text: "How would you rate your current insurance coverage?", options: [{ label: "Excellent — well protected", value: "excellent" }, { label: "Good — most bases covered", value: "good" }, { label: "Fair — some gaps", value: "fair" }, { label: "Poor — significant gaps", value: "poor" }, { label: "Unsure", value: "unsure" }] },
  { id: 48, category: "insurance", priority: 4, type: "boolean", text: "Does your employer provide group life, disability, or supplemental insurance?" },
  { id: 49, category: "insurance", priority: 5, type: "text", text: "List all insurance policies with carrier names, policy types, and coverage amounts.", placeholder: "Policy details..." },
  { id: 50, category: "insurance", priority: 5, type: "boolean", text: "Have you ever been declined for life or disability insurance?" },

  // ═══════════════════════════════════════════════════════════════
  // RETIREMENT PLANNING — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 51, category: "retirement", priority: 1, type: "number", text: "At what age do you plan to retire?", placeholder: "65" },
  { id: 52, category: "retirement", priority: 1, type: "number", text: "What is the total balance of all your retirement accounts (401k, IRA, Roth, etc.)?", placeholder: "$0" },
  { id: 53, category: "retirement", priority: 2, type: "number", text: "How much do you contribute monthly to retirement accounts?", placeholder: "$0" },
  { id: 54, category: "retirement", priority: 2, type: "boolean", text: "Does your employer offer a 401(k) match? If so, are you maximizing it?" },
  { id: 55, category: "retirement", priority: 3, type: "number", text: "What is your estimated Social Security benefit at full retirement age?", placeholder: "$0/month" },
  { id: 56, category: "retirement", priority: 3, type: "boolean", text: "Do you have a pension from any current or previous employer?" },
  { id: 57, category: "retirement", priority: 4, type: "number", text: "How much annual income do you need in retirement (in today's dollars)?", placeholder: "$0" },
  { id: 58, category: "retirement", priority: 4, type: "select", text: "Have you considered a Roth conversion strategy?", options: [{ label: "Already doing Roth conversions", value: "active" }, { label: "Interested but haven't started", value: "interested" }, { label: "Not sure what it is", value: "unsure" }, { label: "Not interested", value: "not_interested" }] },
  { id: 59, category: "retirement", priority: 5, type: "text", text: "Describe your ideal retirement lifestyle and any specific plans (travel, relocation, part-time work).", placeholder: "Retirement vision..." },
  { id: 60, category: "retirement", priority: 5, type: "boolean", text: "Are you concerned about outliving your retirement savings?" },

  // ═══════════════════════════════════════════════════════════════
  // TAX SITUATION — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 61, category: "tax", priority: 1, type: "select", text: "What is your federal tax filing status?", options: [{ label: "Single", value: "single" }, { label: "Married Filing Jointly", value: "mfj" }, { label: "Married Filing Separately", value: "mfs" }, { label: "Head of Household", value: "hoh" }, { label: "Qualifying Widow(er)", value: "qw" }] },
  { id: 62, category: "tax", priority: 1, type: "select", text: "What is your approximate federal tax bracket?", options: [{ label: "10% ($0-$11,600)", value: "10" }, { label: "12% ($11,601-$47,150)", value: "12" }, { label: "22% ($47,151-$100,525)", value: "22" }, { label: "24% ($100,526-$191,950)", value: "24" }, { label: "32% ($191,951-$243,725)", value: "32" }, { label: "35% ($243,726-$609,350)", value: "35" }, { label: "37% ($609,351+)", value: "37" }, { label: "Not sure", value: "unsure" }] },
  { id: 63, category: "tax", priority: 2, type: "number", text: "What was your total federal tax liability last year?", placeholder: "$0" },
  { id: 64, category: "tax", priority: 2, type: "select", text: "Do you itemize deductions or take the standard deduction?", options: [{ label: "Standard deduction", value: "standard" }, { label: "Itemize deductions", value: "itemize" }, { label: "Not sure", value: "unsure" }] },
  { id: 65, category: "tax", priority: 3, type: "number", text: "What is your state income tax rate?", placeholder: "0%", helperText: "Enter 0 if your state has no income tax" },
  { id: 66, category: "tax", priority: 3, type: "boolean", text: "Do you have any capital gains or losses to report this year?" },
  { id: 67, category: "tax", priority: 4, type: "boolean", text: "Are you subject to the Alternative Minimum Tax (AMT)?" },
  { id: 68, category: "tax", priority: 4, type: "boolean", text: "Do you have any tax-loss harvesting strategies in place?" },
  { id: 69, category: "tax", priority: 5, type: "text", text: "Describe any complex tax situations (foreign income, K-1 partnerships, real estate depreciation, etc.).", placeholder: "Tax details..." },
  { id: 70, category: "tax", priority: 5, type: "boolean", text: "Are you currently working with a CPA or tax advisor?" },

  // ═══════════════════════════════════════════════════════════════
  // ESTATE & LEGACY — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 71, category: "estate", priority: 1, type: "boolean", text: "Do you have a current will or living trust?" },
  { id: 72, category: "estate", priority: 1, type: "boolean", text: "Have you designated beneficiaries on all your financial accounts?" },
  { id: 73, category: "estate", priority: 2, type: "boolean", text: "Do you have a power of attorney (financial and healthcare)?" },
  { id: 74, category: "estate", priority: 2, type: "boolean", text: "Do you have an advance healthcare directive or living will?" },
  { id: 75, category: "estate", priority: 3, type: "select", text: "How important is leaving a financial legacy to your heirs?", options: [{ label: "Extremely important — top priority", value: "top" }, { label: "Important — but not at expense of my lifestyle", value: "important" }, { label: "Somewhat important", value: "somewhat" }, { label: "Not a priority", value: "not_priority" }] },
  { id: 76, category: "estate", priority: 3, type: "number", text: "What is the total estimated value of your estate?", placeholder: "$0" },
  { id: 77, category: "estate", priority: 4, type: "boolean", text: "Have you considered or established an irrevocable life insurance trust (ILIT)?" },
  { id: 78, category: "estate", priority: 4, type: "boolean", text: "Are you making annual gifts to family members or charities for estate tax planning?" },
  { id: 79, category: "estate", priority: 5, type: "text", text: "Describe your estate planning goals and any specific wishes for wealth transfer.", placeholder: "Estate goals..." },
  { id: 80, category: "estate", priority: 5, type: "boolean", text: "Do you have any charitable giving strategies (donor-advised fund, charitable remainder trust, etc.)?" },

  // ═══════════════════════════════════════════════════════════════
  // GOALS & PRIORITIES — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 81, category: "goals", priority: 1, type: "select", text: "What is your single most important financial goal right now?", options: [{ label: "Retirement security", value: "retirement" }, { label: "Wealth accumulation", value: "wealth" }, { label: "Debt elimination", value: "debt" }, { label: "Tax optimization", value: "tax" }, { label: "Income protection", value: "protection" }, { label: "Legacy/estate planning", value: "legacy" }, { label: "Education funding", value: "education" }, { label: "Home purchase", value: "home" }] },
  { id: 82, category: "goals", priority: 1, type: "number", text: "What is your target net worth goal?", placeholder: "$0", helperText: "Where do you want to be financially?" },
  { id: 83, category: "goals", priority: 2, type: "number", text: "By what age do you want to achieve financial independence?", placeholder: "55" },
  { id: 84, category: "goals", priority: 2, type: "select", text: "How would you describe your current financial confidence level?", options: [{ label: "Very confident — on track", value: "very_confident" }, { label: "Somewhat confident", value: "somewhat" }, { label: "Neutral — could go either way", value: "neutral" }, { label: "Concerned — falling behind", value: "concerned" }, { label: "Anxious — need help urgently", value: "anxious" }] },
  { id: 85, category: "goals", priority: 3, type: "boolean", text: "Do you have children's education funding needs (529 plans, etc.)?" },
  { id: 86, category: "goals", priority: 3, type: "number", text: "How much do you need for upcoming major purchases in the next 5 years?", placeholder: "$0" },
  { id: 87, category: "goals", priority: 4, type: "text", text: "What keeps you up at night financially? Describe your biggest financial worry.", placeholder: "Financial concerns..." },
  { id: 88, category: "goals", priority: 4, type: "select", text: "How do you prefer to work with a financial advisor?", options: [{ label: "Hands-off — you manage everything", value: "hands_off" }, { label: "Collaborative — we decide together", value: "collaborative" }, { label: "Educational — teach me to manage my own", value: "educational" }, { label: "Periodic check-ins only", value: "periodic" }] },
  { id: 89, category: "goals", priority: 5, type: "text", text: "If money were no object, what would your ideal life look like in 10 years?", placeholder: "Dream scenario..." },
  { id: 90, category: "goals", priority: 5, type: "text", text: "What financial mistakes have you made in the past that you want to avoid repeating?", placeholder: "Past lessons..." },

  // ═══════════════════════════════════════════════════════════════
  // RISK & BEHAVIORAL — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 91, category: "risk", priority: 1, type: "slider", text: "On a scale of 1-10, how comfortable are you with investment risk?", helperText: "1 = avoid all risk, 10 = embrace maximum risk" },
  { id: 92, category: "risk", priority: 1, type: "select", text: "If your portfolio dropped 25% in one month, what would you do?", options: [{ label: "Sell everything immediately", value: "sell_all" }, { label: "Sell some to reduce exposure", value: "sell_some" }, { label: "Hold and wait for recovery", value: "hold" }, { label: "Buy more at lower prices", value: "buy_more" }] },
  { id: 93, category: "risk", priority: 2, type: "select", text: "What is your investment time horizon for your largest account?", options: [{ label: "Less than 3 years", value: "short" }, { label: "3-7 years", value: "medium" }, { label: "7-15 years", value: "long" }, { label: "15+ years", value: "very_long" }] },
  { id: 94, category: "risk", priority: 2, type: "select", text: "How much investment experience do you have?", options: [{ label: "None — complete beginner", value: "none" }, { label: "Limited — basic stocks/bonds", value: "limited" }, { label: "Moderate — diversified portfolio", value: "moderate" }, { label: "Extensive — options, alternatives, etc.", value: "extensive" }] },
  { id: 95, category: "risk", priority: 3, type: "select", text: "Which best describes your investment philosophy?", options: [{ label: "Capital preservation above all", value: "preservation" }, { label: "Steady income with minimal risk", value: "income" }, { label: "Balanced growth and income", value: "balanced" }, { label: "Aggressive growth, accept volatility", value: "growth" }, { label: "Maximum growth, high risk tolerance", value: "aggressive" }] },
  { id: 96, category: "risk", priority: 3, type: "boolean", text: "Have you ever panic-sold investments during a market downturn?" },
  { id: 97, category: "risk", priority: 4, type: "select", text: "How do you typically make financial decisions?", options: [{ label: "Quickly — trust my gut", value: "quick" }, { label: "Research thoroughly then decide", value: "research" }, { label: "Consult advisors before any decision", value: "consult" }, { label: "Procrastinate — avoid decisions", value: "procrastinate" }] },
  { id: 98, category: "risk", priority: 4, type: "boolean", text: "Are you comfortable with illiquid investments (real estate, private equity) that lock up capital for years?" },
  { id: 99, category: "risk", priority: 5, type: "text", text: "Describe the worst financial loss you've experienced and how it affected your decision-making.", placeholder: "Past experience..." },
  { id: 100, category: "risk", priority: 5, type: "select", text: "Would you prefer a guaranteed 5% return or a 50/50 chance of 0% or 12%?", options: [{ label: "Guaranteed 5% — certainty is king", value: "guaranteed" }, { label: "The 50/50 gamble — higher expected value", value: "gamble" }, { label: "Depends on the amount at stake", value: "depends" }] },
];
