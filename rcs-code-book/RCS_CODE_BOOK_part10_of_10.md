# Russell Capital Systems — Source Code Book (Part 10 of 10)

This is one part of the complete, plain-Markdown source of the Russell Capital Systems web app (React 19 + Vite client, Express + tRPC server, Drizzle ORM / MySQL), split so an assistant that cannot open archives can read every file. `LAUNCH.md` (in Part 1) is the runbook for installing, configuring, building, migrating, and running the app; read it first. Each file below is shown verbatim under its path relative to `russell-capital-systems/`. The source of truth is GitHub `samtheinsuranceman-debug/sam-russell-corpus` (branch `claude/claude-md-docs-0qgcvw`, folder `russell-capital-systems/`); the book is a derived snapshot generated on 2026-09-05. See `RCS_CODE_BOOK_00_INDEX.md` for the full file-to-part map and the list of intentionally excluded paths.

### Files in this part

- `client/src/data/onboardingQuestions.ts`
- `client/src/data/pageAuditSummary.ts`
- `client/src/data/riskToleranceQuestions.ts`
- `client/src/hooks/useCalculatorIntegration.ts`
- `client/src/hooks/useComposition.ts`
- `client/src/hooks/useIbbotsonModel.ts`
- `client/src/hooks/useKeyboardShortcuts.ts`
- `client/src/hooks/useMobile.tsx`
- `client/src/hooks/usePersistFn.ts`
- `client/src/hooks/useQuestTracker.ts`
- `client/src/hooks/useRealtimeEvents.ts`
- `client/src/hooks/useSoundOfMoney.ts`
- `client/src/styles/animations.css`
- `client/src/styles/sidebar-override.css`
- `database/rcs-schema.sql`
- `docs/ULTRA_AI_ENV.md`
- `docs/ai-architecture-council-review.md`
- `docs/comprehensive-audit-2026-08-27.md`
- `docs/concept16-domain-readiness-review.md`
- `docs/core-workflow-verification.md`
- `docs/database-persistence-verification.md`
- `docs/grok-delta-manifest.md`
- `docs/grok-handoff/01_FINANCIAL_LIBRARIAN_SPEC.md`
- `docs/grok-handoff/02_ASSESSMENT_AND_JOURNEY_DATA.md`
- `docs/grok-handoff/03_BUILD_STATUS_AND_NEXT.md`
- `docs/grok-merge-verification.md`
- `docs/homepage-hero-asset-review.md`
- `docs/homepage-typography-validation.md`
- `docs/implementation-and-functionality-audit.md`
- `docs/internet-integrations-verification.md`
- `docs/navigation-architecture.md`
- `docs/page-audit-summary.md`
- `docs/primary-port-verification.md`
- `docs/source-inventory-matrix.md`
- `docs/source-manifest.md`
- `docs/visual-system-verification.md`
- `docs/visual-validation.md`
- `live/README.md`
- `live/build_live_homepage.py`
- `live/rcs-live-homepage.template.html`

---

## `client/src/data/onboardingQuestions.ts`

```ts
/**
 * Russell Capital Systems™ — 100-Question Client Onboarding Assessment
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
```

## `client/src/data/pageAuditSummary.ts`

```ts
export const PAGE_AUDIT_SUMMARY = {
  methodologyVersion: "1.0-source-evidence",
  routeCount: 231,
  averageScore: 5.99,
  fiveOrHigherCount: 153,
  belowFiveCount: 78,
  renderHealth: { healthy: 225, atRisk: 6, broken: 0 },
  recommendations: { keep: 83, improve: 68, merge: 5, secondary: 68, retire: 7 },
  generatedAt: "2026-08-26T20:00:00.000Z",
} as const;
```

## `client/src/data/riskToleranceQuestions.ts`

```ts
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
```

## `client/src/hooks/useCalculatorIntegration.ts`

```ts
// @ts-nocheck
/**
 * useCalculatorIntegration — Reusable hook that wires any calculator page to the backend.
 * Provides:
 * 1. Client selector (load real client data)
 * 2. Save/load scenarios via tRPC
 * 3. Audit logging for compliance
 * 4. StrategyContext publishing
 */
import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useStrategy, StrategyType } from "@/contexts/StrategyContext";
import { useAuth } from "@/_core/hooks/useAuth";

export interface CalculatorIntegrationConfig {
  calculatorName: string;
  strategyType: StrategyType;
}

export function useCalculatorIntegration(config: CalculatorIntegrationConfig) {
  const { calculatorName, strategyType } = config;
  const { user } = useAuth();
  const { publishResult, getResult } = useStrategy();

  // Client selector state
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");

  // Scenario state
  const [scenarioName, setScenarioName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Client list query
  const clientsQuery = trpc.clients?.list?.useQuery?.(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });

  // Saved scenarios query
  const scenariosQuery = trpc.complianceAudit?.getScenarios?.useQuery?.(
    { calculatorType: calculatorName },
    { enabled: !!user, staleTime: 30_000 }
  );

  // Save scenario mutation
  const saveScenarioMutation = trpc.complianceAudit?.saveScenario?.useMutation?.({
    onSuccess: () => {
      setLastSavedAt(new Date());
      setIsSaving(false);
      scenariosQuery?.refetch?.();
    },
    onError: () => setIsSaving(false),
  });

  // Audit log mutation
  const logCalculationMutation = trpc.complianceAudit?.logCalculation?.useMutation?.();

  // Select a client
  const selectClient = useCallback((clientId: number, clientName: string) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
  }, []);

  // Save scenario
  const saveScenario = useCallback(async (inputs: Record<string, any>, results: Record<string, any>) => {
    if (!saveScenarioMutation) return;
    setIsSaving(true);
    try {
      await saveScenarioMutation.mutateAsync({
        name: scenarioName || `${calculatorName} - ${new Date().toLocaleDateString()}`,
        calculatorType: calculatorName,
        clientId: selectedClientId ?? undefined,
        inputs,
        results,
      });
    } catch (e) {
      setIsSaving(false);
    }
  }, [saveScenarioMutation, scenarioName, calculatorName, selectedClientId]);

  // Log calculation for compliance
  const logCalculation = useCallback(async (inputs: Record<string, any>, results: Record<string, any>) => {
    if (!logCalculationMutation) return;
    try {
      await logCalculationMutation.mutateAsync({
        calculatorType: calculatorName,
        clientId: selectedClientId ?? undefined,
        inputs,
        results,
        complianceNotes: `Calculated via ${calculatorName} for ${selectedClientName || "no client selected"}`,
      });
    } catch (e) {
      // Non-critical
    }
  }, [logCalculationMutation, calculatorName, selectedClientId, selectedClientName]);

  // Publish results to StrategyContext for cross-calculator sync
  const publishToStrategy = useCallback((results: Record<string, any>) => {
    publishResult(strategyType, {
      label: `${calculatorName}${selectedClientName ? ` - ${selectedClientName}` : ""}`,
      ...results,
    });
  }, [publishResult, strategyType, calculatorName, selectedClientName]);

  // Get data from another calculator
  const getFromStrategy = useCallback((type: StrategyType) => {
    return getResult(type);
  }, [getResult]);

  // Load scenario
  const loadScenario = useCallback((scenario: any) => {
    if (scenario?.inputs) {
      return scenario.inputs;
    }
    return null;
  }, []);

  return {
    // Client selector
    clients: clientsQuery?.data ?? [],
    clientsLoading: clientsQuery?.isLoading ?? false,
    selectedClientId,
    selectedClientName,
    selectClient,

    // Scenario management
    scenarios: scenariosQuery?.data ?? [],
    scenariosLoading: scenariosQuery?.isLoading ?? false,
    scenarioName,
    setScenarioName,
    saveScenario,
    loadScenario,
    isSaving,
    lastSavedAt,

    // Audit logging
    logCalculation,

    // Strategy context
    publishToStrategy,
    getFromStrategy,

    // User
    user,
  };
}
```

## `client/src/hooks/useComposition.ts`

```ts
import { useRef } from "react";
import { usePersistFn } from "./usePersistFn";

export interface UseCompositionReturn<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  onCompositionStart: React.CompositionEventHandler<T>;
  onCompositionEnd: React.CompositionEventHandler<T>;
  onKeyDown: React.KeyboardEventHandler<T>;
  isComposing: () => boolean;
}

export interface UseCompositionOptions<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  onKeyDown?: React.KeyboardEventHandler<T>;
  onCompositionStart?: React.CompositionEventHandler<T>;
  onCompositionEnd?: React.CompositionEventHandler<T>;
}

type TimerResponse = ReturnType<typeof setTimeout>;

export function useComposition<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement,
>(options: UseCompositionOptions<T> = {}): UseCompositionReturn<T> {
  const {
    onKeyDown: originalOnKeyDown,
    onCompositionStart: originalOnCompositionStart,
    onCompositionEnd: originalOnCompositionEnd,
  } = options;

  const c = useRef(false);
  const timer = useRef<TimerResponse | null>(null);
  const timer2 = useRef<TimerResponse | null>(null);

  const onCompositionStart = usePersistFn((e: React.CompositionEvent<T>) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (timer2.current) {
      clearTimeout(timer2.current);
      timer2.current = null;
    }
    c.current = true;
    originalOnCompositionStart?.(e);
  });

  const onCompositionEnd = usePersistFn((e: React.CompositionEvent<T>) => {
    // 使用两层 setTimeout 来处理 Safari 浏览器中 compositionEnd 先于 onKeyDown 触发的问题
    timer.current = setTimeout(() => {
      timer2.current = setTimeout(() => {
        c.current = false;
      });
    });
    originalOnCompositionEnd?.(e);
  });

  const onKeyDown = usePersistFn((e: React.KeyboardEvent<T>) => {
    // 在 composition 状态下，阻止 ESC 和 Enter（非 shift+Enter）事件的冒泡
    if (
      c.current &&
      (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey))
    ) {
      e.stopPropagation();
      return;
    }
    originalOnKeyDown?.(e);
  });

  const isComposing = usePersistFn(() => {
    return c.current;
  });

  return {
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
    isComposing,
  };
}
```

## `client/src/hooks/useIbbotsonModel.ts`

```ts
/**
 * useIbbotsonModel — React hook that wraps the shared Ibbotson model utility
 * for easy integration into any IUL calculator page.
 *
 * Provides:
 *   • Year selector state (default 2005)
 *   • Cap / floor / participation rate state (default 7.5% / 0% / 100%)
 *   • Computed year-by-year results, summary stats, and cash value projections
 *   • Helper to get credited rate for a specific year
 */

import { useState, useMemo } from "react";
import {
  type IbbotsonConfig,
  type IbbotsonYearResult,
  type IbbotsonSummary,
  type IbbotsonCashValueYear,
  runIbbotsonModel,
  getIbbotsonSummary,
  getIbbotsonCAGR,
  getAverageAnnualCreditedRate,
  projectCashValueWithIbbotson,
  calculateCreditedRate,
  SP500_ANNUAL_RETURNS,
  IBBOTSON_DEFAULT_START_YEAR,
  IBBOTSON_END_YEAR,
  IBBOTSON_START_YEAR,
  getAvailableYears,
  IBBOTSON_DISCLAIMER,
  IBBOTSON_SHORT_DISCLAIMER,
} from "@shared/ibbotsonModel";

export interface UseIbbotsonModelOptions {
  /** Initial start year. Default: 2005 */
  defaultStartYear?: number;
  /** Initial end year. Default: latest available */
  defaultEndYear?: number;
  /** Initial cap rate as decimal. Default: 0.075 */
  defaultCapRate?: number;
  /** Initial floor rate as decimal. Default: 0.0 */
  defaultFloorRate?: number;
  /** Initial participation rate as decimal. Default: 1.0 */
  defaultParticipationRate?: number;
}

export function useIbbotsonModel(options: UseIbbotsonModelOptions = {}) {
  const {
    defaultStartYear = IBBOTSON_DEFAULT_START_YEAR,
    defaultEndYear = IBBOTSON_END_YEAR,
    defaultCapRate = 0.075,
    defaultFloorRate = 0.0,
    defaultParticipationRate = 1.0,
  } = options;

  // ─── State ──────────────────────────────────────────────────────────────
  const [startYear, setStartYear] = useState(defaultStartYear);
  const [endYear, setEndYear] = useState(defaultEndYear);
  const [capRate, setCapRate] = useState(defaultCapRate);
  const [floorRate, setFloorRate] = useState(defaultFloorRate);
  const [participationRate, setParticipationRate] = useState(defaultParticipationRate);

  // ─── Config object ──────────────────────────────────────────────────────
  const config: IbbotsonConfig = useMemo(() => ({
    capRate,
    floorRate,
    participationRate,
    startYear,
    endYear,
  }), [capRate, floorRate, participationRate, startYear, endYear]);

  // ─── Computed results ───────────────────────────────────────────────────
  const yearResults: IbbotsonYearResult[] = useMemo(
    () => runIbbotsonModel(config),
    [config]
  );

  const summary: IbbotsonSummary = useMemo(
    () => getIbbotsonSummary(config),
    [config]
  );

  const cagr = useMemo(
    () => getIbbotsonCAGR(config),
    [config]
  );

  const averageCreditedRate = useMemo(
    () => getAverageAnnualCreditedRate(config),
    [config]
  );

  // ─── Helper: get credited rate for a specific year ──────────────────────
  const getCreditedRateForYear = (year: number): number => {
    const raw = SP500_ANNUAL_RETURNS[year];
    if (raw === undefined) return 0;
    return calculateCreditedRate(raw, capRate, floorRate, participationRate);
  };

  // ─── Helper: get S&P 500 return for a specific year ─────────────────────
  const getSP500ReturnForYear = (year: number): number | undefined => {
    return SP500_ANNUAL_RETURNS[year];
  };

  // ─── Helper: project cash values ────────────────────────────────────────
  const projectCashValues = (
    annualPremium: number,
    premiumYears?: number,
    loadFee?: number,
    coiRate?: number,
  ): IbbotsonCashValueYear[] => {
    return projectCashValueWithIbbotson({
      ...config,
      annualPremium,
      premiumYears,
      loadFee,
      coiRate,
    });
  };

  // ─── Available years for selectors ──────────────────────────────────────
  const availableYears = useMemo(() => getAvailableYears(), []);

  return {
    // State
    startYear,
    setStartYear,
    endYear,
    setEndYear,
    capRate,
    setCapRate,
    floorRate,
    setFloorRate,
    participationRate,
    setParticipationRate,

    // Config
    config,

    // Computed
    yearResults,
    summary,
    cagr,
    averageCreditedRate,

    // Helpers
    getCreditedRateForYear,
    getSP500ReturnForYear,
    projectCashValues,
    availableYears,

    // Constants
    IBBOTSON_DISCLAIMER,
    IBBOTSON_SHORT_DISCLAIMER,
    IBBOTSON_START_YEAR,
    IBBOTSON_END_YEAR,
    IBBOTSON_DEFAULT_START_YEAR,
  };
}

export default useIbbotsonModel;

// Re-export types and constants for convenience
export {
  type IbbotsonConfig,
  type IbbotsonYearResult,
  type IbbotsonSummary,
  type IbbotsonCashValueYear,
  SP500_ANNUAL_RETURNS,
  IBBOTSON_DISCLAIMER,
  IBBOTSON_SHORT_DISCLAIMER,
  calculateCreditedRate,
  runIbbotsonModel,
  getIbbotsonSummary,
  getIbbotsonCAGR,
  projectCashValueWithIbbotson,
} from "@shared/ibbotsonModel";
```

## `client/src/hooks/useKeyboardShortcuts.ts`

```ts
/**
 * Global Keyboard Shortcuts — Power-user navigation.
 * 
 * G+D → Dashboard/Daily Briefing
 * G+C → Clients
 * G+A → Arena
 * G+N → Nerve Center
 * G+S → Strategy Lab
 * G+P → Pet System
 * G+M → Morning Ritual
 * G+T → Toilet Dashboard (Quick Glance)
 * N+C → New Client (opens add client dialog)
 * N+D → New Deal
 * Escape → Close any open panel
 */
import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const GO_SHORTCUTS: Record<string, { path: string; label: string }> = {
  d: { path: "/portal/daily-briefing", label: "Daily Briefing" },
  c: { path: "/portal/clients", label: "Clients" },
  a: { path: "/portal/arena", label: "Arena" },
  n: { path: "/portal/nerve-center", label: "Nerve Center" },
  s: { path: "/portal/strategy-lab", label: "Strategy Lab" },
  p: { path: "/portal/pet", label: "Pet System" },
  m: { path: "/portal/morning-ritual", label: "Morning Ritual" },
  t: { path: "/portal/toilet", label: "Quick Glance" },
  w: { path: "/portal/war-story-generator", label: "War Stories" },
  l: { path: "/portal/leaderboard", label: "Leaderboard" },
};

export function useKeyboardShortcuts() {
  const [, navigate] = useLocation();
  const pendingPrefix = useRef<string | null>(null);
  const prefixTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger in input/textarea/contenteditable
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if ((e.target as HTMLElement).isContentEditable) return;

    const key = e.key.toLowerCase();

    // Handle prefix sequences (g+X, n+X)
    if (pendingPrefix.current) {
      const prefix = pendingPrefix.current;
      pendingPrefix.current = null;
      if (prefixTimer.current) clearTimeout(prefixTimer.current);

      if (prefix === "g" && GO_SHORTCUTS[key]) {
        e.preventDefault();
        const target = GO_SHORTCUTS[key];
        navigate(target.path);
        toast.info(`Navigated to ${target.label}`, { duration: 1500 });
        return;
      }

      if (prefix === "n") {
        if (key === "c") {
          e.preventDefault();
          navigate("/portal/clients?action=add");
          toast.info("New Client", { duration: 1500 });
          return;
        }
        if (key === "d") {
          e.preventDefault();
          navigate("/portal/pipeline?action=add");
          toast.info("New Deal", { duration: 1500 });
          return;
        }
      }
    }

    // Set prefix
    if (key === "g" || key === "n") {
      pendingPrefix.current = key;
      if (prefixTimer.current) clearTimeout(prefixTimer.current);
      prefixTimer.current = setTimeout(() => {
        pendingPrefix.current = null;
      }, 800); // 800ms window for second key
      return;
    }

    // ? → Show shortcuts help
    if (key === "?" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      toast.info(
        "Keyboard Shortcuts: G+D (Briefing), G+C (Clients), G+A (Arena), G+N (Nerve Center), G+S (Strategy), N+C (New Client), N+D (New Deal), ? (Help)",
        { duration: 5000 }
      );
    }
  }, [navigate]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
```

## `client/src/hooks/useMobile.tsx`

```tsx
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

## `client/src/hooks/usePersistFn.ts`

```ts
import { useRef } from "react";

type noop = (...args: any[]) => any;

/**
 * usePersistFn instead of useCallback to reduce cognitive load
 */
export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T>(null);
  if (!persistFn.current) {
    persistFn.current = function (this: unknown, ...args) {
      return fnRef.current!.apply(this, args);
    } as T;
  }

  return persistFn.current!;
}
```

## `client/src/hooks/useQuestTracker.ts`

```ts
/**
 * QUEST PROGRESS TRACKER — Global Action Interceptor
 * 
 * Listens to all tRPC mutation successes and auto-increments
 * quest progress on the backend. Works alongside useSoundOfMoney.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MUTATION_QUEST_MAP, getQuestCategoryForPath } from "./useSoundOfMoney";

export function useQuestTracker() {
  const queryClient = useQueryClient();
  const lastTrackedRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event: any) => {
      if (event?.type !== "updated" || event?.action?.type !== "success") return;
      
      // Throttle: don't track more than once per 500ms
      const now = Date.now();
      if (now - lastTrackedRef.current < 500) return;
      
      // Extract mutation key/path
      const mutationKey = event?.mutation?.options?.mutationKey;
      const path = Array.isArray(mutationKey) 
        ? mutationKey.flat().join(".") 
        : String(mutationKey || "");
      
      if (!path) return;
      
      // Don't track the quest progress mutation itself (avoid infinite loop)
      if (path.includes("questProgress")) return;
      
      // Look up quest category
      const category = MUTATION_QUEST_MAP[path] || getQuestCategoryForPath(path);
      
      if (category) {
        lastTrackedRef.current = now;
        // Fire-and-forget POST to increment quest progress
        fetch("/api/rpc/questProgress.incrementAction?batch=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ "0": { json: { category, mutationPath: path } } }),
        }).catch(() => { /* silently ignore quest tracking failures */ });
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [queryClient]);
}
```

## `client/src/hooks/useRealtimeEvents.ts`

```ts
/**
 * useRealtimeEvents — SSE hook for real-time server events.
 * Connects to /api/events and dispatches custom DOM events for:
 * - deal_update, notification, quest_complete, achievement_unlock,
 *   pet_evolution, xp_earned, streak_update
 * Components can listen via useRealtimeEvent("deal_update", handler).
 */
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

type EventHandler = (data: any) => void;

const listeners = new Map<string, Set<EventHandler>>();

export function useRealtimeEvents() {
  const { isAuthenticated } = useAuth();
  const esRef = useRef<EventSource | null>(null);
  const retryCount = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    function connect() {
      if (esRef.current) esRef.current.close();

      const es = new EventSource("/api/events", { withCredentials: true });
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          if (type && listeners.has(type)) {
            for (const handler of Array.from(listeners.get(type)!)) {
              try { handler(data); } catch {}
            }
          }
          // Also dispatch to "all" listeners
          if (listeners.has("*")) {
            for (const handler of Array.from(listeners.get("*")!)) {
              try { handler(data); } catch {}
            }
          }
          retryCount.current = 0;
        } catch {}
      };

      es.onerror = () => {
        es.close();
        retryCount.current++;
        // Exponential backoff: 2s, 4s, 8s, 16s, max 60s
        const delay = Math.min(2000 * Math.pow(2, retryCount.current), 60000);
        setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [isAuthenticated]);
}

/**
 * Subscribe to a specific event type from the SSE stream.
 * Use "*" to listen to all events.
 */
export function useRealtimeEvent(eventType: string, handler: EventHandler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback((data: any) => {
    handlerRef.current(data);
  }, []);

  useEffect(() => {
    if (!listeners.has(eventType)) listeners.set(eventType, new Set());
    listeners.get(eventType)!.add(stableHandler);

    return () => {
      listeners.get(eventType)?.delete(stableHandler);
      if (listeners.get(eventType)?.size === 0) listeners.delete(eventType);
    };
  }, [eventType, stableHandler]);
}
```

## `client/src/hooks/useSoundOfMoney.ts`

```ts
/**
 * SOUND OF MONEY — Global Pavlovian Conditioning Layer
 * 
 * This hook intercepts tRPC mutation cache events globally and plays
 * the appropriate reward sound based on the mutation path/type.
 * 
 * Instead of editing 100+ files, we listen to the mutation cache
 * from React Query and trigger sounds automatically.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEntrainment } from "@/contexts/EntrainmentEngine";

type SoundEffect = "ka-ching" | "xp-ping" | "level-up" | "loot-reveal" | "streak-hit" | "quest-complete" | "deal-closed";

// Map mutation paths to sound effects
const MUTATION_SOUND_MAP: Record<string, SoundEffect> = {
  // Deal / Pipeline / Revenue actions → ka-ching
  "billing.createCheckout": "ka-ching",
  "billing.createPortalSession": "ka-ching",
  "pipeline.updateStage": "ka-ching",
  "pipeline.create": "ka-ching",
  "pipeline.updateDeal": "ka-ching",
  "deals.create": "ka-ching",
  "deals.update": "ka-ching",
  "deals.updateStage": "ka-ching",
  "deals.close": "deal-closed",
  "referral.create": "ka-ching",
  "referral.convert": "deal-closed",
  
  // Client actions → xp-ping
  "clients.create": "xp-ping",
  "clients.update": "xp-ping",
  "properties.create": "xp-ping",
  "clientOnboarding.complete": "xp-ping",
  "clientOnboarding.completeStep": "xp-ping",
  "clientIntake.submit": "xp-ping",
  "clientEngagement.record": "xp-ping",
  
  // XP / Level / Achievement actions → level-up or xp-ping
  "experience.earnXp": "xp-ping",
  "experience.claimQuestReward": "quest-complete",
  "experience.investInSkill": "level-up",
  "experience.purchaseLoot": "loot-reveal",
  "experience.claimDailyReward": "streak-hit",
  "experience.checkIn": "streak-hit",
  
  // Pet system → xp-ping
  "pet.feed": "xp-ping",
  "pet.interact": "xp-ping",
  "pet.adopt": "loot-reveal",
  
  // Morning ritual → streak-hit
  "morningRitual.start": "xp-ping",
  "morningRitual.completeStep": "streak-hit",
  
  // Strategy / Calculation actions → xp-ping
  "strategyLab.calculate": "xp-ping",
  "strategyLab.save": "xp-ping",
  "rothConversion.calculate": "xp-ping",
  "taxBracket.calculate": "xp-ping",
  "incomeGap.analyze": "xp-ping",
  "mortgageKiller.calculate": "xp-ping",
  "premiumFinancing.calculate": "xp-ping",
  "annuity.calculate": "xp-ping",
  "iul.calculate": "xp-ping",
  "withdrawalSequencing.calculate": "xp-ping",
  "retirementGuardrails.calculate": "xp-ping",
  "charitableGiving.calculate": "xp-ping",
  "revenueGuarantee.calculate": "xp-ping",
  "indexBacktester.run": "xp-ping",
  "inflationAnalysis.calculate": "xp-ping",
  "householdWealth.calculate": "xp-ping",
  "policyLoans.calculate": "xp-ping",
  "successionPlanning.calculate": "xp-ping",
  "competitiveAnalysis.run": "xp-ping",
  "riskTolerance.calculate": "xp-ping",
  "advisorIncome.calculate": "xp-ping",
  "incomeTimeline.calculate": "xp-ping",
  "portfolioDrift.analyze": "xp-ping",
  "taxOpportunity.detect": "xp-ping",
  
  // AI / Generation actions → loot-reveal
  "ai.generate": "loot-reveal",
  "ai.generateSlides": "loot-reveal",
  "ai.generatePptx": "loot-reveal",
  "slides.batchGenerate": "loot-reveal",
  "bulkGeneration.run": "loot-reveal",
  "warStoryAI.generate": "loot-reveal",
  "experience.generateAvatar": "loot-reveal",
  "aiAssist.query": "xp-ping",
  "leadGenerator.generate": "loot-reveal",
  "seminarGenerator.generate": "loot-reveal",
  "emailCampaign.generate": "loot-reveal",
  "salesStory.generate": "loot-reveal",
  "clientReport.generate": "loot-reveal",
  "complianceReport.generate": "loot-reveal",
  "documentTemplates.generate": "loot-reveal",
  
  // Save / Export actions → xp-ping
  "savedStrategies.create": "xp-ping",
  "savedScenarios.save": "xp-ping",
  "strategyExport.generatePdf": "xp-ping",
  "complianceExport.generate": "xp-ping",
  "notes.add": "xp-ping",
  "favorites.save": "xp-ping",
  "documentVault.upload": "xp-ping",
  "clientFiles.upload": "xp-ping",
  
  // Rewards → streak-hit
  "rewards.claim": "streak-hit",
  "rewards.claimDaily": "streak-hit",
  "rewards.purchase": "ka-ching",
  
  // Compliance → xp-ping
  "complianceAlerts.acknowledge": "xp-ping",
  "auditTimeline.record": "xp-ping",
  
  // Team / Admin → xp-ping
  "team.invite": "xp-ping",
  "team.update": "xp-ping",
};

// Fallback: categorize by keyword patterns in mutation path
function getSoundForMutationPath(path: string): SoundEffect | null {
  const lower = path.toLowerCase();
  
  // High-value actions
  if (lower.includes("close") || lower.includes("won") || lower.includes("convert")) return "deal-closed";
  if (lower.includes("checkout") || lower.includes("payment") || lower.includes("purchase") || lower.includes("buy")) return "ka-ching";
  
  // Achievement actions
  if (lower.includes("claim") || lower.includes("reward") || lower.includes("complete")) return "quest-complete";
  if (lower.includes("levelup") || lower.includes("upgrade") || lower.includes("evolve")) return "level-up";
  if (lower.includes("streak") || lower.includes("checkin") || lower.includes("daily")) return "streak-hit";
  
  // Generation / Discovery
  if (lower.includes("generate") || lower.includes("create") || lower.includes("discover")) return "loot-reveal";
  
  // Calculations / Tool usage
  if (lower.includes("calculate") || lower.includes("analyze") || lower.includes("run") || lower.includes("compute")) return "xp-ping";
  
  // Save / Update actions
  if (lower.includes("save") || lower.includes("update") || lower.includes("add") || lower.includes("submit")) return "xp-ping";
  
  return null;
}

/**
 * Global hook that listens to ALL tRPC mutation successes and plays
 * the appropriate Pavlovian reward sound. Mount once in App.tsx.
 */
export function useSoundOfMoney() {
  const { playSoundEffect, soundEffectsEnabled } = useEntrainment();
  const lastPlayedRef = useRef<number>(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!soundEffectsEnabled) return;

    // Subscribe to the global mutation cache for Pavlovian conditioning
    const unsubscribe = queryClient.getMutationCache().subscribe((event: any) => {
      if (event?.type !== "updated" || event?.action?.type !== "success") return;
      
      // Throttle: don't play sounds more than once per 300ms
      const now = Date.now();
      if (now - lastPlayedRef.current < 300) return;
      
      // Extract mutation key/path
      const mutationKey = event?.mutation?.options?.mutationKey;
      const path = Array.isArray(mutationKey) 
        ? mutationKey.flat().join(".") 
        : String(mutationKey || "");
      
      if (!path) return;
      
      // Look up sound
      const sound = MUTATION_SOUND_MAP[path] || getSoundForMutationPath(path);
      
      if (sound) {
        lastPlayedRef.current = now;
        playSoundEffect(sound);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [soundEffectsEnabled, playSoundEffect, queryClient]);
}

/**
 * Quest action categories for tracking
 */
export type QuestActionCategory = 
  | "tool_usage"
  | "client_contact" 
  | "deal_movement"
  | "calculation_run"
  | "strategy_created"
  | "ai_generation"
  | "content_saved"
  | "login_streak";

// Map mutation paths to quest action categories
const MUTATION_QUEST_MAP: Record<string, QuestActionCategory> = {
  // Client contacts
  "clients.create": "client_contact",
  "clients.update": "client_contact",
  "clientOnboarding.complete": "client_contact",
  "clientIntake.submit": "client_contact",
  "clientEngagement.record": "client_contact",
  
  // Deal movements
  "pipeline.updateStage": "deal_movement",
  "pipeline.create": "deal_movement",
  "deals.create": "deal_movement",
  "deals.update": "deal_movement",
  "deals.updateStage": "deal_movement",
  "deals.close": "deal_movement",
  
  // Calculations
  "strategyLab.calculate": "calculation_run",
  "rothConversion.calculate": "calculation_run",
  "taxBracket.calculate": "calculation_run",
  "incomeGap.analyze": "calculation_run",
  "mortgageKiller.calculate": "calculation_run",
  "premiumFinancing.calculate": "calculation_run",
  "annuity.calculate": "calculation_run",
  "iul.calculate": "calculation_run",
  "withdrawalSequencing.calculate": "calculation_run",
  "retirementGuardrails.calculate": "calculation_run",
  "charitableGiving.calculate": "calculation_run",
  "revenueGuarantee.calculate": "calculation_run",
  "indexBacktester.run": "calculation_run",
  "inflationAnalysis.calculate": "calculation_run",
  "householdWealth.calculate": "calculation_run",
  "policyLoans.calculate": "calculation_run",
  "advisorIncome.calculate": "calculation_run",
  "incomeTimeline.calculate": "calculation_run",
  "portfolioDrift.analyze": "calculation_run",
  "taxOpportunity.detect": "calculation_run",
  "riskTolerance.calculate": "calculation_run",
  "competitiveAnalysis.run": "calculation_run",
  
  // AI generations
  "ai.generate": "ai_generation",
  "ai.generateSlides": "ai_generation",
  "warStoryAI.generate": "ai_generation",
  "experience.generateAvatar": "ai_generation",
  "leadGenerator.generate": "ai_generation",
  "seminarGenerator.generate": "ai_generation",
  "emailCampaign.generate": "ai_generation",
  "salesStory.generate": "ai_generation",
  "clientReport.generate": "ai_generation",
  
  // Strategy / Content saved
  "savedStrategies.create": "strategy_created",
  "savedScenarios.save": "content_saved",
  "notes.add": "content_saved",
  "favorites.save": "content_saved",
  "documentVault.upload": "content_saved",
};

function getQuestCategoryForPath(path: string): QuestActionCategory | null {
  const lower = path.toLowerCase();
  if (lower.includes("client") && (lower.includes("create") || lower.includes("add") || lower.includes("contact"))) return "client_contact";
  if (lower.includes("deal") || lower.includes("pipeline") || lower.includes("stage")) return "deal_movement";
  if (lower.includes("calculate") || lower.includes("analyze") || lower.includes("compute")) return "calculation_run";
  if (lower.includes("generate") || lower.includes("ai.")) return "ai_generation";
  if (lower.includes("save") || lower.includes("create") || lower.includes("strategy")) return "strategy_created";
  return "tool_usage"; // Default: any mutation counts as tool usage
}

export { MUTATION_SOUND_MAP, getSoundForMutationPath, MUTATION_QUEST_MAP, getQuestCategoryForPath };
```

## `client/src/styles/animations.css`

```css
/* Russell Capital Systems — Custom Animations */
/* Import this file in your main CSS entry point (e.g., index.css) */

html {
  scroll-behavior: smooth;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in forwards;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-pulse-green {
  animation: pulseGreen 1.5s infinite;
}
@keyframes pulseGreen {
  0% { box-shadow: 0 0 5px #22c55e; }
  50% { box-shadow: 0 0 15px #22c55e; }
  100% { box-shadow: 0 0 5px #22c55e; }
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out forwards;
}
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}
@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.3); }
  50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.6); }
}
```

## `client/src/styles/sidebar-override.css`

```css
/* ============================================================
   RUSSELL CAPITAL SYSTEMS — SIDEBAR STYLING OVERRIDE
   Purpose: Smaller uniform font sizes + brighter vibrant coloring
   ============================================================ */

/* ── SECTION HEADERS (HOME, CLIENTS, PLANNING, PRODUCTS, etc.) ── */
/* Current: 26px for main sections, 22px for lower sections — TOO BIG */
/* Fix: All section headers to 13px, vibrant gradient colors */

nav.rc-sidebar-nav .flex-1.text-left {
  font-size: 13px !important;
  letter-spacing: 1.2px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
}

/* ── VIBRANT COLOR SCHEME FOR SECTION HEADERS ── */
/* HOME section — bright emerald */
nav.rc-sidebar-nav button:nth-of-type(1) .flex-1.text-left {
  color: #34d399 !important;  /* emerald-400 */
}

/* CLIENTS section — bright cyan */
nav.rc-sidebar-nav button:nth-of-type(2) .flex-1.text-left {
  color: #22d3ee !important;  /* cyan-400 */
}

/* PLANNING section — bright violet */
nav.rc-sidebar-nav button:nth-of-type(3) .flex-1.text-left {
  color: #a78bfa !important;  /* violet-400 */
}

/* PRODUCTS section — bright amber */
nav.rc-sidebar-nav button:nth-of-type(4) .flex-1.text-left {
  color: #fbbf24 !important;  /* amber-400 */
}

/* MASSIVE CALCULATORS — bright rose */
nav.rc-sidebar-nav button:nth-of-type(5) .flex-1.text-left {
  color: #fb7185 !important;  /* rose-400 */
}

/* AI & TOOLS — bright sky */
nav.rc-sidebar-nav button:nth-of-type(6) .flex-1.text-left {
  color: #38bdf8 !important;  /* sky-400 */
}

/* COMPLIANCE — bright lime */
nav.rc-sidebar-nav button:nth-of-type(7) .flex-1.text-left {
  color: #a3e635 !important;  /* lime-400 */
}

/* THE EXPERIENCE — bright fuchsia */
nav.rc-sidebar-nav button:nth-of-type(8) .flex-1.text-left {
  color: #e879f9 !important;  /* fuchsia-400 */
}

/* COMMAND — bright orange */
nav.rc-sidebar-nav button:nth-of-type(9) .flex-1.text-left {
  color: #fb923c !important;  /* orange-400 */
}

/* COMPETE — bright teal */
nav.rc-sidebar-nav button:nth-of-type(10) .flex-1.text-left {
  color: #2dd4bf !important;  /* teal-400 */
}

/* EARN — bright yellow */
nav.rc-sidebar-nav button:nth-of-type(11) .flex-1.text-left {
  color: #facc15 !important;  /* yellow-400 */
}

/* EXPLORE — bright indigo */
nav.rc-sidebar-nav button:nth-of-type(12) .flex-1.text-left {
  color: #818cf8 !important;  /* indigo-400 */
}

/* TRANSCEND — bright pink */
nav.rc-sidebar-nav button:nth-of-type(13) .flex-1.text-left {
  color: #f472b6 !important;  /* pink-400 */
}

/* SETTINGS — bright slate/blue */
nav.rc-sidebar-nav button:nth-of-type(14) .flex-1.text-left {
  color: #60a5fa !important;  /* blue-400 */
}

/* INTEROP ENGINE — bright emerald glow */
nav.rc-sidebar-nav button:nth-of-type(15) .flex-1.text-left {
  color: #6ee7b7 !important;  /* emerald-300 */
}

/* ── SUB-ITEMS (Dashboard, Wealth Reels, Advisory Summary, etc.) ── */
/* Current: 15-16px — too big */
/* Fix: All sub-items to 12.5px, bright white with vibrant hover */

nav.rc-sidebar-nav a {
  font-size: 12.5px !important;
  font-weight: 500 !important;
  color: #e2e8f0 !important;  /* slate-200 — bright white-ish */
  letter-spacing: 0.3px !important;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  transition: all 0.2s ease !important;
}

/* Active sub-item — vibrant emerald with glow */
nav.rc-sidebar-nav a[aria-current="page"],
nav.rc-sidebar-nav a.active,
nav.rc-sidebar-nav a[data-active="true"] {
  color: #34d399 !important;  /* emerald-400 */
  font-weight: 600 !important;
  text-shadow: 0 0 8px rgba(52, 211, 153, 0.4) !important;
}

/* Hover state — bright cyan glow */
nav.rc-sidebar-nav a:hover {
  color: #22d3ee !important;  /* cyan-400 */
  text-shadow: 0 0 6px rgba(34, 211, 238, 0.3) !important;
  background-color: rgba(34, 211, 238, 0.08) !important;
}

/* ── SECTION HEADER BUTTONS — Uniform sizing ── */
nav.rc-sidebar-nav button {
  font-size: 13px !important;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  transition: all 0.2s ease !important;
}

/* Section header hover — subtle glow */
nav.rc-sidebar-nav button:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* ── BADGE NUMBERS (9, 5, 3, 2, 6) ── */
nav.rc-sidebar-nav .text-\[14px\] {
  font-size: 10px !important;
  opacity: 0.7 !important;
}

nav.rc-sidebar-nav .text-\[11px\] {
  font-size: 10px !important;
}

/* ── FAVORITES SECTION HEADER ── */
nav.rc-sidebar-nav .text-\[13px\] {
  font-size: 11px !important;
  color: #fbbf24 !important;  /* amber-400 — keep the amber but brighter */
}

/* ── CHEVRON/EXPAND ICONS ── */
nav.rc-sidebar-nav svg {
  width: 14px !important;
  height: 14px !important;
}

/* ── SIDEBAR SECTION DIVIDERS ── */
nav.rc-sidebar-nav > div {
  border-color: rgba(255, 255, 255, 0.06) !important;
}

/* ── SCROLLBAR STYLING ── */
nav.rc-sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

nav.rc-sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

nav.rc-sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(52, 211, 153, 0.3);
  border-radius: 4px;
}

nav.rc-sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(52, 211, 153, 0.5);
}
```

## `database/rcs-schema.sql`

```sql
-- Russell Capital Systems — complete database schema
-- Generated from drizzle/schema.ts by scripts/export_schema_sql.sh; do not hand-edit.
-- Tables: 117
-- Import: mysql -u USER -p DBNAME < database/rcs-schema.sql   (or phpMyAdmin → Import)
-- The database itself must already exist (create it in cPanel → MySQL Databases).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `advisor_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`accessTier` enum('trial','unlimited','subscriber') NOT NULL DEFAULT 'trial',
	`trialSecondsUsed` int NOT NULL DEFAULT 0,
	`lastHeartbeatAt` timestamp,
	`stripeCustomerId` varchar(100),
	`subscriptionStatus` enum('none','active','past_due','canceled') NOT NULL DEFAULT 'none',
	`stripeSubscriptionId` varchar(100),
	`trialAccessCount` int NOT NULL DEFAULT 0,
	`passwordType` enum('none','trial','eternal') NOT NULL DEFAULT 'none',
	`planSlug` varchar(50),
	`emailVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advisor_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `advisor_accounts_email_unique` UNIQUE(`email`)
);
CREATE TABLE `advisor_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`goalType` enum('AUM_TARGET','DEALS_CLOSED','NEW_CLIENTS','REVENUE') NOT NULL,
	`targetValue` decimal(15,2) NOT NULL,
	`period` varchar(20) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advisor_goals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `agency_team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`role` enum('supervisor','agent') NOT NULL DEFAULT 'agent',
	`status` enum('active','pending','suspended','removed') NOT NULL DEFAULT 'pending',
	`agreementSigned` boolean NOT NULL DEFAULT false,
	`agreementSignedAt` timestamp,
	`joinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agency_team_members_id` PRIMARY KEY(`id`)
);
CREATE TABLE `agency_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`supervisorId` int NOT NULL,
	`supervisorName` varchar(200) NOT NULL,
	`supervisorEmail` varchar(320),
	`workspaceId` int NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agency_teams_id` PRIMARY KEY(`id`)
);
CREATE TABLE `ai_memory_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`content` text NOT NULL,
	`source` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_memory_notes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `allocation_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`assetClass` varchar(100) NOT NULL,
	`targetPct` decimal(5,2) NOT NULL,
	`currentPct` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `allocation_targets_id` PRIMARY KEY(`id`)
);
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`actorUserId` int,
	`action` varchar(200) NOT NULL,
	`entityType` varchar(100),
	`entityId` varchar(100),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `batch_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`templateType` varchar(100) NOT NULL,
	`frequency` varchar(50) NOT NULL DEFAULT 'weekly',
	`paused` boolean NOT NULL DEFAULT false,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`runCount` int NOT NULL DEFAULT 0,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batch_schedules_id` PRIMARY KEY(`id`)
);
CREATE TABLE `calculation_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200),
	`clientId` int,
	`clientName` varchar(200),
	`calculationType` varchar(100) NOT NULL,
	`pagePath` varchar(500),
	`inputs` json,
	`outputs` json,
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calculation_audit_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`googleEventId` varchar(255),
	`title` varchar(255) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`location` text,
	`meetingType` varchar(50) DEFAULT 'general',
	`status` varchar(20) DEFAULT 'scheduled',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
CREATE TABLE `campaign_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`campaignId` int NOT NULL,
	`clientId` int NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientName` varchar(200),
	`status` enum('active','completed','unsubscribed') NOT NULL DEFAULT 'active',
	`currentStep` int NOT NULL DEFAULT 0,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	CONSTRAINT `campaign_enrollments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `carrier_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`carrierId` varchar(50) NOT NULL,
	`carrierName` varchar(200) NOT NULL,
	`loadFee` decimal(6,4),
	`coiRate` decimal(6,4),
	`capRate` decimal(6,4),
	`floorRate` decimal(6,4),
	`avgReturn` decimal(6,4),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carrier_overrides_id` PRIMARY KEY(`id`)
);
CREATE TABLE `carrier_quote_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`clientEmail` varchar(320),
	`advisorId` int NOT NULL,
	`advisorName` varchar(200),
	`advisorEmail` varchar(320),
	`carrierId` varchar(50) NOT NULL,
	`carrierName` varchar(200) NOT NULL,
	`productName` varchar(200),
	`formData` json NOT NULL,
	`status` enum('draft','submitted','pending_review','approved','rejected') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carrier_quote_requests_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`actorName` varchar(200),
	`actorUserId` int,
	`entityType` varchar(50),
	`entityId` int,
	`summary` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_activity_log_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`badgeType` varchar(100) NOT NULL,
	`badgeName` varchar(200) NOT NULL,
	`badgeEmoji` varchar(20) NOT NULL,
	`badgeDescription` text,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`level` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_badges_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_crypto_holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`coinId` varchar(100) NOT NULL,
	`coinName` varchar(200) NOT NULL,
	`coinSymbol` varchar(20),
	`quantity` decimal(20,8) NOT NULL,
	`avgPurchasePrice` decimal(15,2) NOT NULL,
	`amountStaked` decimal(20,8),
	`stakingPercentage` decimal(8,4),
	`predictedStakingIncome` decimal(15,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_crypto_holdings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`fileKey` varchar(1000) NOT NULL,
	`url` varchar(2000) NOT NULL,
	`mimeType` varchar(200),
	`sizeBytes` int,
	`category` enum('TAX_RETURN','ESTATE_PLAN','INSURANCE_POLICY','INVESTMENT_STATEMENT','TRUST_DOCUMENT','LEGAL_AGREEMENT','FINANCIAL_PLAN','OTHER') NOT NULL DEFAULT 'OTHER',
	`uploadedBy` int,
	`uploadedByName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_documents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_fact_finders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`data` json NOT NULL,
	`completeness` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_fact_finders_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_fact_finders_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE `client_journeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questions` json NOT NULL,
	`journey` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_journeys_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_life_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`targetAge` int NOT NULL,
	`goalCategory` enum('retirement','travel','education','home_purchase','debt_free','business','charity','health','family','luxury','legacy','other') NOT NULL DEFAULT 'other',
	`goalTitle` varchar(300) NOT NULL,
	`goalDescription` text,
	`estimatedCost` decimal(15,2),
	`priority` enum('must_have','nice_to_have','dream') NOT NULL DEFAULT 'nice_to_have',
	`achievabilityScore` int,
	`isAchieved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_life_goals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`scheduledAt` timestamp NOT NULL,
	`durationMin` int NOT NULL DEFAULT 60,
	`location` varchar(500),
	`meetingType` enum('IN_PERSON','VIDEO','PHONE','OTHER') NOT NULL DEFAULT 'VIDEO',
	`status` enum('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
	`notes` text,
	`createdBy` int,
	`createdByName` varchar(200),
	`reminderSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_meetings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(200),
	`noteType` enum('CALL','MEETING','EMAIL','TASK','GENERAL') NOT NULL DEFAULT 'GENERAL',
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_notes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_portal_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastAccessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_portal_sessions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_portal_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`label` varchar(200),
	`createdByUserId` int,
	`expiresAt` timestamp NOT NULL,
	`lastAccessedAt` timestamp,
	`accessCount` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_portal_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_portal_tokens_token_unique` UNIQUE(`token`)
);
CREATE TABLE `client_properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`propertyName` varchar(300) NOT NULL,
	`propertyType` enum('PRIMARY','INVESTMENT','SHORT_TERM_RENTAL','COMMERCIAL','LAND') NOT NULL DEFAULT 'PRIMARY',
	`propertyValue` decimal(15,2),
	`monthlyMortgagePayment` decimal(12,2),
	`monthlyInterestOnlyPayment` decimal(12,2),
	`totalInterestPayment` decimal(15,2),
	`monthlyRentalIncome` decimal(12,2),
	`annualAppreciation` decimal(5,4),
	`isPrimary` boolean NOT NULL DEFAULT false,
	`mortgageBalance` decimal(15,2),
	`interestRate` decimal(5,4),
	`loanTermYears` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_properties_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`category` enum('asset_allocation','spending','savings','insurance','tax_strategy','debt_management','retirement_timing','estate_planning','behavior','education') NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`scoreImpact` int NOT NULL,
	`difficulty` enum('easy','moderate','challenging') NOT NULL DEFAULT 'moderate',
	`estimatedTimeframe` varchar(100),
	`isAccepted` boolean NOT NULL DEFAULT false,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`suggestedTab` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_recommendations_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_risk_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`marketDropReaction` int,
	`timeHorizon` int,
	`incomeStability` int,
	`investmentExperience` int,
	`riskCapacity` int,
	`volatilityComfort` int,
	`guaranteePreference` int,
	`growthVsIncome` int,
	`riskScore` int,
	`riskCategory` enum('conservative','moderate_conservative','moderate','moderate_aggressive','aggressive'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_risk_assessments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`overallScore` int NOT NULL DEFAULT 50,
	`financialHealthScore` int,
	`goalAlignmentScore` int,
	`behaviorScore` int,
	`diversificationScore` int,
	`level` int NOT NULL DEFAULT 1,
	`levelName` varchar(100) NOT NULL DEFAULT 'Starter',
	`totalPointsEarned` int NOT NULL DEFAULT 0,
	`streakDays` int NOT NULL DEFAULT 0,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_scores_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_session_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`sessionId` int,
	`rating` decimal(3,1) NOT NULL,
	`explanation` text,
	`behaviors` json,
	`actions` json,
	`learningApproaches` json,
	`scoreEnhancementSteps` json,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_session_ratings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_tag_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_tag_assignments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#4f8cff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_tags_id` PRIMARY KEY(`id`)
);
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`household` varchar(200),
	`email` varchar(320),
	`phone` varchar(30),
	`age` int,
	`state` varchar(50),
	`filingStatus` enum('single','joint','hoh') DEFAULT 'joint',
	`income` decimal(15,2),
	`iraBalance` decimal(15,2),
	`rothBalance` decimal(15,2),
	`taxableAssets` decimal(15,2),
	`realEstateEquity` decimal(15,2),
	`lifeInsuranceCv` decimal(15,2),
	`firstName` varchar(100),
	`lastName` varchar(100),
	`riskTolerance` enum('conservative','moderate','aggressive','very_aggressive'),
	`annualIncome` decimal(15,2),
	`totalNetWorth` decimal(15,2),
	`retirementAge` int,
	`spouseName` varchar(200),
	`spouseAge` int,
	`dependents` int,
	`spouseIncome` decimal(15,2),
	`monthlyExpenses` decimal(15,2),
	`cashSavings` decimal(15,2),
	`homeValue` decimal(15,2),
	`k401Balance` decimal(15,2),
	`pensionIncome` decimal(15,2),
	`socialSecurityEstimate` decimal(15,2),
	`lifeInsuranceDb` decimal(15,2),
	`annualPremium` decimal(15,2),
	`annuityValue` decimal(15,2),
	`hasLTC` boolean DEFAULT false,
	`mortgageBalance` decimal(15,2),
	`mortgageRate` decimal(5,4),
	`mortgageYearsLeft` int,
	`totalMortgageInterest` decimal(15,2),
	`otherDebt` decimal(15,2),
	`helocRate` decimal(5,4),
	`ficoScore` int,
	`notes` text,
	`tags` json,
	`opportunityScore` int,
	`hubspotContactId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
CREATE TABLE `compliance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`alertType` enum('RMD_DEADLINE','CONTRIBUTION_LIMIT','FILING_DEADLINE','REBALANCE_OVERDUE','REVIEW_OVERDUE','AGE_MILESTONE','HIGH_CONCENTRATION','STALE_STRATEGY') NOT NULL,
	`severity` enum('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`dueDate` timestamp,
	`dismissed` boolean NOT NULL DEFAULT false,
	`dismissedBy` int,
	`dismissedAt` timestamp,
	`resolvedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_alerts_id` PRIMARY KEY(`id`)
);
CREATE TABLE `compliance_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`signedName` varchar(200) NOT NULL,
	`signedDate` varchar(20) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_signatures_id` PRIMARY KEY(`id`)
);
CREATE TABLE `daily_reward_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`rewardType` enum('xp','coin','loot','booster') NOT NULL,
	`rewardAmount` int NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_reward_claims_id` PRIMARY KEY(`id`)
);
CREATE TABLE `dashboard_widget_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`widgetId` varchar(100) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`size` enum('SMALL','MEDIUM','LARGE','FULL') NOT NULL DEFAULT 'MEDIUM',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_widget_configs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `deal_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`score` int NOT NULL,
	`confidence` varchar(10) NOT NULL DEFAULT 'medium',
	`factors` json,
	`recommendation` text,
	`scoredAt` timestamp NOT NULL DEFAULT (now()),
	`scoredBy` varchar(10) NOT NULL DEFAULT 'ai',
	CONSTRAINT `deal_scores_id` PRIMARY KEY(`id`)
);
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`stage` enum('LEAD','QUALIFIED','STRATEGY','PROPOSAL','CLOSED_WON','CLOSED_LOST') NOT NULL DEFAULT 'LEAD',
	`ownerName` varchar(200),
	`value` decimal(15,2),
	`probability` decimal(5,4),
	`notes` text,
	`closedAt` timestamp,
	`hubspotDealId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`campaignType` enum('welcome','nurture','reengagement','educational','custom') NOT NULL DEFAULT 'custom',
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`campaignId` int,
	`name` varchar(200) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
CREATE TABLE `email_verification_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`code` varchar(6) NOT NULL,
	`purpose` varchar(50) NOT NULL DEFAULT 'pre_checkout',
	`verified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verification_codes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `encouragement_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`emailType` enum('weekly_check_in','goal_reminder','level_up','badge_earned','score_boost','habit_tip') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text,
	`sentAt` timestamp,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `encouragement_emails_id` PRIMARY KEY(`id`)
);
CREATE TABLE `error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`source` varchar(20) NOT NULL DEFAULT 'client',
	`level` varchar(10) NOT NULL DEFAULT 'error',
	`message` text NOT NULL,
	`stack` text,
	`componentStack` text,
	`url` text,
	`userAgent` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `error_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `family_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`inviteCode` varchar(20) NOT NULL,
	`createdBy` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `family_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `family_groups_inviteCode_unique` UNIQUE(`inviteCode`)
);
CREATE TABLE `family_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_members_id` PRIMARY KEY(`id`)
);
CREATE TABLE `financial_reels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`hook_text` text NOT NULL,
	`slides` json NOT NULL,
	`emotion` varchar(50) NOT NULL DEFAULT 'educational',
	`is_mega` boolean NOT NULL DEFAULT false,
	`cta_text` varchar(200) DEFAULT 'Learn More',
	`cta_action` varchar(200) DEFAULT '',
	`music_mood` varchar(100) DEFAULT 'neutral',
	`bg_gradient` varchar(200) DEFAULT '',
	`icon_emoji` varchar(20) DEFAULT '💰',
	`read_time_seconds` int DEFAULT 30,
	`sort_order` int DEFAULT 0,
	`view_count` int NOT NULL DEFAULT 0,
	`like_count` int NOT NULL DEFAULT 0,
	`save_count` int NOT NULL DEFAULT 0,
	`share_count` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financial_reels_id` PRIMARY KEY(`id`)
);
CREATE TABLE `follow_up_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sharedProjectionId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`clientEmail` varchar(320) NOT NULL,
	`advisorName` varchar(200),
	`emailType` enum('3day','7day') NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('pending','sent','cancelled','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follow_up_emails_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hidden_material_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hidden_material_config_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hidden_material_reset_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(6) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hidden_material_reset_codes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `household_fact_finders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`primaryAge` int,
	`primaryIncome` decimal(15,2),
	`primaryIra` decimal(15,2),
	`primaryRothIra` decimal(15,2),
	`primaryCash` decimal(15,2),
	`primaryHomeValue` decimal(15,2),
	`primaryHomeEquity` decimal(15,2),
	`primaryMortgageBalance` decimal(15,2),
	`primaryMortgageRate` decimal(5,4),
	`primaryMortgageYearsLeft` int,
	`primaryTotalInterest` decimal(15,2),
	`primaryAnnualPremium` decimal(15,2),
	`primaryDeathBenefit` decimal(15,2),
	`spouseName` varchar(200),
	`spouseAge` int,
	`spouseIncome` decimal(15,2),
	`spouseIra` decimal(15,2),
	`spouseRothIra` decimal(15,2),
	`spouseCash` decimal(15,2),
	`helocRate` decimal(5,4),
	`helocMaxLtv` decimal(5,4),
	`rentBasement` boolean DEFAULT false,
	`children` json,
	`grandchildren` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `household_fact_finders_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hubspot_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`direction` enum('PUSH','PULL') NOT NULL,
	`objectType` enum('CONTACT','DEAL') NOT NULL,
	`hubspotId` varchar(100),
	`localId` int,
	`status` enum('SUCCESS','FAILED','SKIPPED') NOT NULL DEFAULT 'SUCCESS',
	`errorMessage` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hubspot_sync_log_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hubspot_sync_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`syncEnabled` boolean NOT NULL DEFAULT false,
	`syncContacts` boolean NOT NULL DEFAULT true,
	`syncDeals` boolean NOT NULL DEFAULT true,
	`syncDirection` enum('BIDIRECTIONAL','PUSH_ONLY','PULL_ONLY') NOT NULL DEFAULT 'BIDIRECTIONAL',
	`lastSyncAt` timestamp,
	`lastSyncStatus` enum('SUCCESS','PARTIAL','FAILED') DEFAULT 'SUCCESS',
	`lastSyncContactsPushed` int DEFAULT 0,
	`lastSyncContactsPulled` int DEFAULT 0,
	`lastSyncDealsPushed` int DEFAULT 0,
	`lastSyncDealsPulled` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hubspot_sync_settings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `illustration_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`fileName` varchar(500) NOT NULL,
	`fileUrl` varchar(2000) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`carrier` varchar(200),
	`productName` varchar(300),
	`insuredName` varchar(200),
	`insuredAge` int,
	`insuredGender` varchar(20),
	`insuredState` varchar(50),
	`annualPremium` decimal(15,2),
	`deathBenefit` decimal(15,2),
	`illustratedRate` decimal(6,4),
	`extractedData` json,
	`yearByYear` json,
	`status` enum('uploading','extracting','ready','error') NOT NULL DEFAULT 'uploading',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `illustration_uploads_id` PRIMARY KEY(`id`)
);
CREATE TABLE `in_app_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int,
	`type` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(1000),
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `in_app_notifications_id` PRIMARY KEY(`id`)
);
CREATE TABLE `knowledge_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`docType` enum('MESSAGING_LIBRARY','OBJECTION_GUIDE','OFFER_POSITIONING','RENEWAL_POSITIONING','TONE_RULE','COMPLIANCE_RULE','PLAYBOOK_GUIDANCE') NOT NULL DEFAULT 'PLAYBOOK_GUIDANCE',
	`status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`summary` text,
	`content` text,
	`tags` json,
	`sourceLabel` varchar(100),
	`versionLabel` varchar(50),
	`chunkCount` int NOT NULL DEFAULT 0,
	`fileUrl` varchar(1000),
	`fileKey` varchar(500),
	`fileMime` varchar(100),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_documents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `leaderboard_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`optedIn` boolean NOT NULL DEFAULT false,
	`respondedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leaderboard_consents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `leaderboard_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`handle` varchar(50) NOT NULL,
	`useRealName` boolean NOT NULL DEFAULT false,
	`currentlyOptedIn` boolean NOT NULL DEFAULT false,
	`baselineAnnualCommissions` decimal(15,2),
	`platformJoinDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboard_profiles_id` PRIMARY KEY(`id`)
);
CREATE TABLE `legal_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentType` enum('supervisor_monitoring_agreement','compliance_disclaimer','terms_of_service','privacy_policy','nda','other') NOT NULL,
	`title` varchar(500) NOT NULL,
	`signerUserId` int NOT NULL,
	`signerName` varchar(200) NOT NULL,
	`signerEmail` varchar(320),
	`relatedTeamId` int,
	`relatedTeamName` varchar(300),
	`supervisorId` int,
	`supervisorName` varchar(200),
	`signatureName` varchar(200) NOT NULL,
	`signatureDate` varchar(50) NOT NULL,
	`documentContent` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legal_documents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `meeting_reminder_prefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`meetingType` enum('IN_PERSON','VIDEO','PHONE','OTHER') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`leadTimeMinutes` int NOT NULL DEFAULT 1440,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_reminder_prefs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('SUPER_ADMIN','ADMIN','ADVISOR','ANALYST','VIEWER') NOT NULL DEFAULT 'VIEWER',
	`status` enum('ACTIVE','SUSPENDED','PENDING') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`)
);
CREATE TABLE `morning_rituals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`stepsCompleted` json,
	`totalSteps` int NOT NULL DEFAULT 7,
	`isComplete` boolean NOT NULL DEFAULT false,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`streakDay` int NOT NULL DEFAULT 1,
	`xpEarned` int NOT NULL DEFAULT 0,
	`coinsEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `morning_rituals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `owner_trusted_ips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`label` varchar(200),
	`loginCount` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `owner_trusted_ips_id` PRIMARY KEY(`id`),
	CONSTRAINT `owner_trusted_ips_ipAddress_unique` UNIQUE(`ipAddress`)
);
CREATE TABLE `page_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`pagePath` varchar(500) NOT NULL,
	`pageTitle` varchar(200) NOT NULL,
	`enteredAt` timestamp NOT NULL DEFAULT (now()),
	`exitedAt` timestamp,
	`durationSecs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_activity_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `page_audit_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`path` varchar(500) NOT NULL,
	`pageTitle` varchar(300),
	`componentName` varchar(200),
	`renderHealth` enum('untested','pass','warn','fail') NOT NULL DEFAULT 'untested',
	`navigationHealth` enum('untested','reachable','orphaned','broken') NOT NULL DEFAULT 'untested',
	`interactionHealth` enum('untested','working','partial','placeholder','broken') NOT NULL DEFAULT 'untested',
	`placeholderCount` int NOT NULL DEFAULT 0,
	`duplicateGroup` varchar(200),
	`usefulnessScore` int,
	`recommendation` enum('keep','improve','merge','secondary','retire'),
	`mergeTarget` varchar(500),
	`rationale` text,
	`improvementInstructions` text,
	`evidence` json,
	`auditedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_audit_records_id` PRIMARY KEY(`id`)
);
CREATE TABLE `page_audit_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`initiatedBy` int NOT NULL,
	`routeCount` int NOT NULL DEFAULT 0,
	`status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
	`methodologyVersion` varchar(50) NOT NULL DEFAULT '1.0',
	`summary` json,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_audit_runs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `payment_disclosures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int,
	`planSlug` varchar(50) NOT NULL,
	`billingInterval` enum('MONTHLY','ANNUAL') NOT NULL,
	`priceAtAcceptance` decimal(10,2) NOT NULL,
	`payorFirstName` varchar(100) NOT NULL,
	`payorLastName` varchar(100) NOT NULL,
	`payorBusinessEntity` varchar(200),
	`payorAddress` varchar(300) NOT NULL,
	`payorCity` varchar(100) NOT NULL,
	`payorState` varchar(50) NOT NULL,
	`payorZip` varchar(20) NOT NULL,
	`payorPhone` varchar(30) NOT NULL,
	`payorEmail` varchar(320),
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` varchar(500),
	`pinVerifiedAt` timestamp,
	`signatureText` varchar(300) NOT NULL,
	`signatureHash` varchar(128) NOT NULL,
	`disclosureVersion` varchar(20) NOT NULL DEFAULT '1.0',
	`governingLaw` varchar(50) NOT NULL DEFAULT 'Delaware',
	`agreedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_disclosures_id` PRIMARY KEY(`id`)
);
CREATE TABLE `planning_case_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planningCaseId` int NOT NULL,
	`userId` int NOT NULL,
	`noteType` enum('advisor','client','compliance','system') NOT NULL DEFAULT 'advisor',
	`content` text NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_case_notes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `planning_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`userId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`caseType` varchar(100) NOT NULL DEFAULT 'comprehensive',
	`status` enum('draft','active','review','completed','archived') NOT NULL DEFAULT 'draft',
	`currentStage` varchar(100) NOT NULL DEFAULT 'discovery',
	`assumptions` json,
	`results` json,
	`workflowState` json,
	`lastSavedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_cases_id` PRIMARY KEY(`id`)
);
CREATE TABLE `prediction_bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` varchar(500) NOT NULL,
	`prediction` varchar(100) NOT NULL,
	`wager` int NOT NULL,
	`status` enum('open','won','lost','cancelled') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`payout` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prediction_bets_id` PRIMARY KEY(`id`)
);
CREATE TABLE `prediction_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`question` varchar(500) NOT NULL,
	`category` varchar(50) NOT NULL DEFAULT 'general',
	`endDate` timestamp NOT NULL,
	`yesCount` int NOT NULL DEFAULT 0,
	`noCount` int NOT NULL DEFAULT 0,
	`totalWager` int NOT NULL DEFAULT 0,
	`status` enum('open','resolved_yes','resolved_no','cancelled') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prediction_questions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `public_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(40) NOT NULL,
	`firstName` varchar(120),
	`lastName` varchar(120),
	`email` varchar(320),
	`phone` varchar(40),
	`bestTimeToContact` varchar(200),
	`consentedAt` timestamp,
	`consentVersion` varchar(40),
	`lastIp` varchar(64),
	`ipHistory` json,
	`question` text,
	`factFinder` json,
	`analysis` json,
	`status` enum('new','contacted','qualified','client') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_leads_publicId_unique` UNIQUE(`publicId`)
);
CREATE TABLE `rebalance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`assetClass` varchar(100) NOT NULL,
	`targetPct` decimal(5,2) NOT NULL,
	`currentPct` decimal(5,2) NOT NULL,
	`driftPct` decimal(5,2) NOT NULL,
	`threshold` decimal(5,2) NOT NULL,
	`status` enum('OPEN','ACKNOWLEDGED','RESOLVED') NOT NULL DEFAULT 'OPEN',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rebalance_alerts_id` PRIMARY KEY(`id`)
);
CREATE TABLE `recommendation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`clientAge` int,
	`riskTolerance` varchar(20),
	`annualPremium` decimal(15,2),
	`recommendedCarrierId` varchar(50) NOT NULL,
	`recommendedCarrierName` varchar(200) NOT NULL,
	`totalScore` decimal(6,2) NOT NULL,
	`allScoresJson` json NOT NULL,
	`advisorId` int,
	`advisorName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendation_history_id` PRIMARY KEY(`id`)
);
CREATE TABLE `reel_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reelId` int NOT NULL,
	`action` enum('view','like','save','share') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reel_interactions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `referral_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`createdBy` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`partnerName` varchar(200) NOT NULL,
	`partnerEmail` varchar(320),
	`partnerType` enum('client','cpa','attorney','financial_advisor','other') NOT NULL DEFAULT 'client',
	`commissionPct` decimal(5,2),
	`clicks` int NOT NULL DEFAULT 0,
	`signups` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(15,2) DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_links_id` PRIMARY KEY(`id`)
);
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`referrerName` varchar(200) NOT NULL,
	`referredName` varchar(200) NOT NULL,
	`referredEmail` varchar(320),
	`referredPhone` varchar(30),
	`source` enum('Client','Professional','Event','Online','Other') NOT NULL DEFAULT 'Client',
	`status` enum('pending','contacted','meeting_scheduled','converted','lost') NOT NULL DEFAULT 'pending',
	`estimatedValue` decimal(15,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `report_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`reportType` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`fileUrl` text,
	`fileKey` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `report_exports_id` PRIMARY KEY(`id`)
);
CREATE TABLE `report_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`frequency` enum('MONTHLY','QUARTERLY') NOT NULL DEFAULT 'MONTHLY',
	`recipientEmail` varchar(320),
	`active` boolean NOT NULL DEFAULT true,
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_schedules_id` PRIMARY KEY(`id`)
);
CREATE TABLE `revenue_guarantee_calcs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentAUM` decimal(15,2) NOT NULL,
	`currentRevenue` decimal(15,2) NOT NULL,
	`projectedAUM` decimal(15,2) NOT NULL,
	`projectedRevenue` decimal(15,2) NOT NULL,
	`subscriptionCost` decimal(10,2) NOT NULL,
	`roiMultiple` decimal(8,2) NOT NULL,
	`breakEvenDays` int NOT NULL,
	`guaranteeTier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revenue_guarantee_calcs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `risk_score_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`score` int NOT NULL,
	`level` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`factors` json,
	`snapshotDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_score_history_id` PRIMARY KEY(`id`)
);
CREATE TABLE `risk_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`advisorId` int,
	`overallScore` int NOT NULL,
	`depthLevel` int NOT NULL,
	`questionsAnswered` int NOT NULL,
	`categories` json,
	`marketContext` json,
	`riskCategory` varchar(50),
	`trigger` varchar(50) NOT NULL DEFAULT 'initial',
	`driftScore` int,
	`flaggedForReassessment` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_snapshots_id` PRIMARY KEY(`id`)
);
CREATE TABLE `russellcoin_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`balance` int NOT NULL,
	`txType` enum('earn','spend','bonus','refund') NOT NULL,
	`source` varchar(100) NOT NULL,
	`sourceId` varchar(100),
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `russellcoin_transactions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `saved_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`name` varchar(200) NOT NULL,
	`inputs` json NOT NULL,
	`projectionData` json NOT NULL,
	`tags` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_scenarios_id` PRIMARY KEY(`id`)
);
CREATE TABLE `saved_slide_decks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`toolName` varchar(200) NOT NULL,
	`clientName` varchar(200),
	`audience` enum('client','advisor','team') NOT NULL DEFAULT 'client',
	`slideCount` int NOT NULL,
	`slides` json NOT NULL,
	`pptxUrl` varchar(2000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_slide_decks_id` PRIMARY KEY(`id`)
);
CREATE TABLE `saved_strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`advisorId` int NOT NULL,
	`advisorName` varchar(200),
	`version` int NOT NULL DEFAULT 1,
	`parentStrategyId` int,
	`strategyType` varchar(50) NOT NULL,
	`strategyLabel` varchar(200) NOT NULL,
	`carrierId` varchar(50),
	`carrierName` varchar(200),
	`inputsJson` json NOT NULL,
	`summaryJson` json NOT NULL,
	`iulProjectionJson` json,
	`strProjectionJson` json,
	`notes` text,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_strategies_id` PRIMARY KEY(`id`)
);
CREATE TABLE `scenario_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`name` varchar(200) NOT NULL,
	`scenarioType` enum('ROTH','IUL','REAL_ESTATE','COMBINED','ROTH_CONVERSION_STR','OIL_GAS_ROTH','MORTGAGE_KILLER') NOT NULL DEFAULT 'COMBINED',
	`inputJson` json,
	`outputJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenario_snapshots_id` PRIMARY KEY(`id`)
);
CREATE TABLE `shared_projections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`advisorName` varchar(200),
	`token` varchar(64) NOT NULL,
	`projectionData` json NOT NULL,
	`inputData` json NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_projections_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_projections_token_unique` UNIQUE(`token`)
);
CREATE TABLE `sidebar_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`path` varchar(500) NOT NULL,
	`label` varchar(200) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sidebar_favorites_id` PRIMARY KEY(`id`)
);
CREATE TABLE `skill_tree_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillSlug` varchar(100) NOT NULL,
	`skillName` varchar(200) NOT NULL,
	`currentLevel` int NOT NULL DEFAULT 0,
	`maxLevel` int NOT NULL DEFAULT 5,
	`xpInvested` int NOT NULL DEFAULT 0,
	`mastered` boolean NOT NULL DEFAULT false,
	`masteredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skill_tree_progress_id` PRIMARY KEY(`id`)
);
CREATE TABLE `slack_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`teamId` varchar(100),
	`teamName` varchar(200),
	`botToken` varchar(500),
	`channelId` varchar(100),
	`channelName` varchar(200),
	`webhookUrl` varchar(1000),
	`active` boolean NOT NULL DEFAULT true,
	`configJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slack_integrations_id` PRIMARY KEY(`id`)
);
CREATE TABLE `slide_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deckId` int NOT NULL,
	`slideIndex` int,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`content` text NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slide_comments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `slide_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deckId` int NOT NULL,
	`sharedByUserId` int NOT NULL,
	`sharedWithEmail` varchar(320) NOT NULL,
	`sharedWithUserId` int,
	`permission` enum('view','comment','edit') NOT NULL DEFAULT 'comment',
	`shareToken` varchar(255) NOT NULL,
	`accessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slide_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `slide_shares_shareToken_unique` UNIQUE(`shareToken`)
);
CREATE TABLE `slide_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`email` varchar(320),
	`accessTier` enum('trial','unlimited','subscriber','owner') NOT NULL DEFAULT 'trial',
	`topic` varchar(200),
	`toolName` varchar(200),
	`slideCount` int NOT NULL DEFAULT 0,
	`audience` enum('client','advisor','team') NOT NULL DEFAULT 'client',
	`action` enum('generate','export_pptx','save') NOT NULL DEFAULT 'generate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slide_usage_id` PRIMARY KEY(`id`)
);
CREATE TABLE `sms_verification_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(30) NOT NULL,
	`code` varchar(10) NOT NULL,
	`purpose` varchar(50) NOT NULL DEFAULT 'payment_disclosure',
	`verified` boolean NOT NULL DEFAULT false,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_verification_codes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`summary` text,
	`taxPlan` text,
	`insurancePlan` text,
	`investmentPlan` text,
	`advisorScript` text,
	`generatedBy` enum('AI','MANUAL','HYBRID') NOT NULL DEFAULT 'MANUAL',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
CREATE TABLE `supervisor_monitoring_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`teamId` int NOT NULL,
	`teamName` varchar(300) NOT NULL,
	`supervisorId` int NOT NULL,
	`supervisorName` varchar(200) NOT NULL,
	`signatureName` varchar(200) NOT NULL,
	`signatureDate` varchar(50) NOT NULL,
	`agreementVersion` varchar(20) NOT NULL DEFAULT '1.0',
	`agreementText` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supervisor_monitoring_agreements_id` PRIMARY KEY(`id`)
);
CREATE TABLE `trial_logins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`ipAddress` varchar(100) NOT NULL,
	`userAgent` text,
	`sessionToken` varchar(255) NOT NULL,
	`accessTier` enum('trial','unlimited','subscriber') NOT NULL DEFAULT 'trial',
	`expiresAt` timestamp NOT NULL,
	`loggedOutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trial_logins_id` PRIMARY KEY(`id`),
	CONSTRAINT `trial_logins_sessionToken_unique` UNIQUE(`sessionToken`)
);
CREATE TABLE `tutorial_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(50),
	`questionnaireAnswers` json,
	`questionnaireCompleted` boolean NOT NULL DEFAULT false,
	`completedSections` json,
	`completedSubSections` json,
	`currentStep` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 0,
	`badges` json,
	`totalPointsEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tutorial_progress_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementSlug` varchar(100) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`emoji` varchar(20) NOT NULL DEFAULT '🏆',
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`xpReward` int NOT NULL DEFAULT 100,
	`coinReward` int NOT NULL DEFAULT 50,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_loot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemSlug` varchar(100) NOT NULL,
	`itemName` varchar(300) NOT NULL,
	`itemType` enum('cosmetic','booster','title','pet','theme','sound','shield') NOT NULL,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`quantity` int NOT NULL DEFAULT 1,
	`equipped` boolean NOT NULL DEFAULT false,
	`acquiredVia` enum('purchase','quest','achievement','loot_drop','daily_reward','gift') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_loot_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_pets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`speciesId` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`xp` int NOT NULL DEFAULT 0,
	`xpToNext` int NOT NULL DEFAULT 100,
	`happiness` int NOT NULL DEFAULT 100,
	`hunger` int NOT NULL DEFAULT 100,
	`strength` int NOT NULL DEFAULT 5,
	`wisdom` int NOT NULL DEFAULT 5,
	`charisma` int NOT NULL DEFAULT 5,
	`luck` int NOT NULL DEFAULT 5,
	`evolutionStage` enum('hatchling','juvenile','adolescent','adult','elder','legendary') NOT NULL DEFAULT 'hatchling',
	`totalFeedings` int NOT NULL DEFAULT 0,
	`totalDeals` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastFedAt` timestamp,
	`lastInteractedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_pets_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_portal_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int,
	`defaultLandingPath` varchar(500) NOT NULL DEFAULT '/portal/dashboard',
	`openNavGroups` json,
	`secondaryCategories` json,
	`compactSidebar` boolean NOT NULL DEFAULT false,
	`reduceMotion` boolean NOT NULL DEFAULT false,
	`lastVisitedPath` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_portal_preferences_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questSlug` varchar(100) NOT NULL,
	`questType` enum('daily','weekly','epic','legendary') NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`xpReward` int NOT NULL DEFAULT 50,
	`coinReward` int NOT NULL DEFAULT 10,
	`progress` int NOT NULL DEFAULT 0,
	`target` int NOT NULL DEFAULT 1,
	`status` enum('active','completed','expired','claimed') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`completedAt` timestamp,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_quests_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`loginAt` timestamp NOT NULL DEFAULT (now()),
	`logoutAt` timestamp,
	`durationSecs` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_xp_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`levelName` varchar(100) NOT NULL DEFAULT 'Rookie',
	`russellCoin` int NOT NULL DEFAULT 0,
	`lifetimeRussellCoin` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastCheckInDate` varchar(10),
	`totalCheckIns` int NOT NULL DEFAULT 0,
	`avatarUrl` varchar(2000),
	`avatarOriginalUrl` varchar(2000),
	`spouseAvatarUrl` varchar(2000),
	`spouseAvatarOriginalUrl` varchar(2000),
	`avatarTitle` varchar(200) DEFAULT 'Newcomer',
	`avatarBorder` varchar(50) DEFAULT 'default',
	`petType` varchar(50) DEFAULT 'eagle',
	`petLevel` int NOT NULL DEFAULT 1,
	`addictionScore` int NOT NULL DEFAULT 0,
	`reputationScore` int NOT NULL DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_xp_profiles_id` PRIMARY KEY(`id`)
);
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`firstName` varchar(100),
	`lastName` varchar(100),
	`passwordHash` varchar(255),
	`resetToken` varchar(255),
	`resetTokenExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	`onboardingCompleted` boolean NOT NULL DEFAULT false,
	`loginCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
CREATE TABLE `video_engagement_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`viewerType` enum('client','advisor','anonymous') NOT NULL DEFAULT 'anonymous',
	`viewerId` int,
	`eventType` enum('play','pause','seek','chapter_enter','chapter_exit','complete','replay_section') NOT NULL,
	`chapterIndex` int,
	`videoTimestamp` int,
	`watchDuration` int,
	`totalWatchTime` int,
	`percentWatched` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_engagement_events_id` PRIMARY KEY(`id`)
);
CREATE TABLE `video_proposal_chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`chapterIndex` int NOT NULL,
	`chapterType` enum('introduction','current_situation','recommended_strategy','twenty_year_projection','next_steps','custom') NOT NULL,
	`title` varchar(300) NOT NULL,
	`script` text NOT NULL,
	`durationEstimate` int,
	`dataSnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_proposal_chapters_id` PRIMARY KEY(`id`)
);
CREATE TABLE `video_proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','generating_script','script_ready','generating_video','processing','completed','failed') NOT NULL DEFAULT 'draft',
	`avatarId` varchar(200),
	`voiceId` varchar(200),
	`heygenVideoId` varchar(200),
	`videoUrl` text,
	`thumbnailUrl` text,
	`shareToken` varchar(100),
	`totalDuration` int,
	`resolution` enum('1080p','720p') NOT NULL DEFAULT '1080p',
	`errorMessage` text,
	`generatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_proposals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `war_stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` enum('roth_conversion','iul_strategy','tax_savings','estate_planning','annuity_win','general') NOT NULL DEFAULT 'general',
	`dollarImpact` decimal(15,2),
	`likes` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`isAnonymous` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `war_stories_id` PRIMARY KEY(`id`)
);
CREATE TABLE `webhook_endpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`url` varchar(1000) NOT NULL,
	`label` varchar(200),
	`events` json NOT NULL,
	`secret` varchar(128),
	`active` boolean NOT NULL DEFAULT true,
	`lastTriggeredAt` timestamp,
	`failCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_endpoints_id` PRIMARY KEY(`id`)
);
CREATE TABLE `will_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`workspaceId` int,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','review','finalized') NOT NULL DEFAULT 'draft',
	`tone` enum('formal','heartfelt','spiritual','practical') NOT NULL DEFAULT 'heartfelt',
	`personalLetter` text,
	`assetDistribution` json,
	`guardianDesignations` json,
	`specialBequests` json,
	`finalWishes` text,
	`executorName` varchar(200),
	`executorRelation` varchar(100),
	`witnessNames` json,
	`generatedDocument` text,
	`familyContext` json,
	`pdfUrl` varchar(2000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `will_drafts_id` PRIMARY KEY(`id`)
);
CREATE TABLE `withdrawal_triggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`triggerType` enum('gentle_nudge','fomo_alert','pet_sad','streak_warning','loot_expiring','quest_expiring','rival_passed','market_move') NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`urgency` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`channel` enum('in_app','email','push','sms') NOT NULL DEFAULT 'in_app',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawal_triggers_id` PRIMARY KEY(`id`)
);
CREATE TABLE `workspace_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`invitedByUserId` int,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`role` enum('SUPER_ADMIN','ADMIN','ADVISOR','ANALYST','VIEWER') NOT NULL DEFAULT 'ANALYST',
	`status` enum('PENDING','ACCEPTED','EXPIRED','REVOKED') NOT NULL DEFAULT 'PENDING',
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
CREATE TABLE `workspace_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`planSlug` varchar(50) NOT NULL DEFAULT 'growth',
	`status` enum('TRIALING','ACTIVE','PAST_DUE','CANCELED','PAUSED') NOT NULL DEFAULT 'TRIALING',
	`billingInterval` enum('MONTHLY','ANNUAL') NOT NULL DEFAULT 'MONTHLY',
	`seats` int NOT NULL DEFAULT 1,
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspace_subscriptions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`ownerId` int NOT NULL,
	`logoUrl` varchar(2000),
	`primaryColor` varchar(20),
	`accentColor` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_slug_unique` UNIQUE(`slug`)
);
CREATE TABLE `xp_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`source` varchar(100) NOT NULL,
	`sourceId` varchar(100),
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xp_transactions_id` PRIMARY KEY(`id`)
);

SET FOREIGN_KEY_CHECKS = 1;
```

## `docs/ULTRA_AI_ENV.md`

```md
# Ultra Calculator — AI Environment Variables

The Ultra Calculator's AI team and voice output read API keys **only from
the server's environment**. Keys are never accepted from the browser, never
echoed in responses, never logged, and must NEVER be committed to this
repository or pasted into any chat.

Set these in the hosting provider's environment-variables panel
(Railway → service → Variables, cPanel → Setup Node.js App → Environment
Variables, etc.), then restart the app.

| Variable | Powers | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude — the lead model that tethers the site: module triage, the every-page advisor, panel synthesis | Recommended (the system falls back to the built-in LLM, then to deterministic rules) |
| `OPENAI_API_KEY` | ChatGPT seat on the multi-AI panel | Optional |
| `XAI_API_KEY` | Grok seat on the panel | Optional |
| `GEMINI_API_KEY` | Gemini seat on the panel | Optional |
| `PERPLEXITY_API_KEY` | Perplexity seat on the panel | Optional |
| `OPENROUTER_API_KEY` | OpenRouter seat (routes to many additional models) | Optional |
| `ELEVENLABS_API_KEY` | Spoken answers in the configured voice | Optional |
| `ELEVENLABS_VOICE_ID` | Which ElevenLabs voice speaks (the owner's cloned voice ID) | Required if voice output is wanted |

Notes:

- **Graceful degradation is designed in.** With zero keys set, the Ultra
  Calculator still runs fully (the math is client-side and deterministic);
  module triage falls back to rule-based logic, and the advisor button
  reports itself as not configured instead of failing.
- Providers without keys are shown as "not configured" in the UI and are
  never faked in panel results.
- "Manus" has no public inference API; additional models can be reached
  through `OPENROUTER_API_KEY`.
- Voice INPUT uses the browser's built-in speech recognition — no key, and
  the audio never leaves the visitor's machine; only the transcribed text
  is sent to the server.
- If any key is ever pasted into a chat, an email, or a commit, treat it as
  burned: rotate it at the provider immediately.
```

## `docs/ai-architecture-council-review.md`

```md
# AI Architecture Council Review

## OpenAI — gpt-5

- Safe merge order
  - Create an integration branch; land the shared component first, then the seven pages as stubs with route files present but content behind a feature flag so no existing of the 222 routes is displaced.
  - Introduce a route-manifest JSON (id, path, module, primary/secondary, data-mode: real/simulated) prefilled for all 260 page modules; add the seven pages to it in the same PR to prevent orphaning.
  - Wire the shared component to the design system tokens without changing the homepage: keep the black/green skyline on “/” only; scope the purple design tokens to an interior layout shell.
  - Run a “no-route-deletions” CI check that diffs the manifest and Next/React router to fail any removal; require migration notes for any path change.

- Authorization migration
  - Remove all hardcoded passwords, backdoors, email-owner bypasses, and the custom /login logic at the server boundary; keep the /login route but convert it to a server-side 302 that calls the managed runtime’s OAuth start endpoint and maps returns to server-enforced roles. No client-side secrets.
  - Centralize auth in tRPC with a server-only middleware: resolve session from the managed runtime, load role grants, and attach {userId, roles, orgId} to ctx; block when absent.
  - Replace any client/route guards with server-side procedure guards (isAuthenticated, hasRole, hasPlanAccess) and Drizzle queries filtered by user/org; add a slim users table keyed by managed subjectId only (no passwords).
  - Add a one-time migration script that scans the codebase for password literals and bypass flags; add ESLint rules and a pre-commit grep to prevent reintroduction.

- Persistence boundaries
  - Define data-mode per route/procedure in the manifest: core client/planning workflows = real; secondary/simulated = simulated.
  - For simulated flows, route writes to a sandbox schema or in-memory service on the server; visibly label UI controls as “Simulated” and suppress Drizzle writes. For real flows, require role checks and transactional Drizzle calls.
  - Add a server-only feature flag that can force simulated mode off in staging/production for designated routes; never gate with client flags.
  - New Drizzle migrations (on top of the existing 58) add linkage tables keyed by subjectId/orgId and audit tables (who, when, what) for all real writes.

- Navigation and page classification
  - Introduce two top-level nav buckets: “Primary Workflows” and “Secondary Information”; render category badges from the manifest so every routed page is clearly labeled without changing paths.
  - Keep existing slugs; if a page is reassigned, only update the manifest category and breadcrumbs.
  - Use an InteriorLayout that applies the refined purple system to all non-home routes; keep the homepage skyline theme isolated to HomeLayout to avoid bleed-through.

- Validation and testing
  - Expand tests from 90 to cover: (a) route smoke tests for all 222 routes (SSR render + 200/302), (b) auth matrix tests ensuring 401/403 for missing roles on protected tRPC procedures, (c) persistence tests that assert no Drizzle writes occur in simulated mode.
  - Add Playwright e2e for the seven new pages and critical primary flows; include visual snapshots to lock the homepage skyline and interior purple styling.
  - Implement four audit suites (render, interaction, duplication, placeholder/usefulness) driven by the manifest; export per-route findings without auto-deleting pages.
  - Gate CI on: schema migration up/down, tRPC contract checks, auth middleware coverage threshold, and a “no plain-text password/backdoor” static scan.

## Anthropic — claude-sonnet-4-6

1. **Merge additively in a protected sequence.**  
   First inventory and freeze the 222 routes/260 page modules; then introduce the seven pages and shared component behind new, non-conflicting route entries. Reuse existing layout, tRPC, Drizzle, and managed-runtime adapters before moving visual pieces. Preserve the homepage’s black/green city-at-night skyline and lights as an explicit visual-regression baseline; apply the purple system only to portal interiors. Do not overwrite route files until duplication and dependency audits identify a safe consolidation target.

2. **Replace imported authentication with server-enforced managed OAuth authorization.**  
   Remove hardcoded trial/backdoor passwords, email-owner checks, imported `/login` credential logic, and any client-managed role claims. Make the managed OAuth identity the sole authentication source; resolve roles and permissions server-side from authoritative managed database/session context. Gate tRPC procedures and storage/database access with centralized authorization middleware, using explicit roles such as `client`, `advisor`, `planner`, and `admin`, with deny-by-default behavior.

3. **Define real persistence boundaries before wiring workflows.**  
   Persist planning records, client profiles, goals, assumptions, documents/metadata, workflow status, and audit events through tRPC → server authorization → Drizzle migrations/database. Use managed storage only for uploaded artifacts, with database references and ownership checks—not direct client trust. Clearly label calculators, projections, sample dashboards, generated insights, and demo responses as simulated whenever they do not save or derive from authoritative data; never present mocked state as saved financial information.

4. **Reclassify navigation without removing pages.**  
   Establish a primary portal IA for core client and planning work—e.g., Dashboard, Clients, Plans, Goals, Cash Flow, Documents, Tasks/Reviews—and create a visibly labeled **Secondary Information** library for educational content, reference dashboards, FAQs, tools, and lower-frequency informational pages. Keep every existing route reachable, but add route metadata (`primary`, `secondary-information`, `legacy`, `internal`, `workflow`) to drive navigation, breadcrumbs, search, and audit reporting rather than hiding or deleting pages.

5. **Make route audits and migration validation release gates.**  
   For all routed pages, record render, interaction, duplication, placeholder, and usefulness outcomes, with owners and remediation status; flag issues but do not auto-delete routes. Add automated coverage for OAuth role boundaries, unauthorized tRPC calls, ownership isolation, migration up/down or rollback safety, persisted workflow round-trips, storage access checks, and navigation classification. Add visual regression tests for the homepage skyline and representative purple portal interiors, plus route smoke tests for all 222 explicit routes and integration tests for the 90-test baseline before and after each merge stage.

## Google Gemini — gemini-3-flash-preview

Based on the verified facts and platform constraints, here are five concise, implementation-specific recommendations for your portal merge:

### 1. Safe Merge Order: Namespace-Isolated Router Integration
To merge the 7 new pages and shared component without risking the existing 222 routes, use **tRPC Router Namespacing**. Instead of flat-merging procedures into the `appRouter`, mount the new functionality under a dedicated sub-router (e.g., `trpc.newPortal.*`). This prevents naming collisions and allows you to deploy the shared component as a standalone module that existing pages can opt into without modification. 
*   **Action:** Prefix all new Drizzle migrations with a timestamp later than the existing 58 to ensure sequential execution.

### 2. Authorization Migration: Context-Driven Middleware
Immediately replace the custom `/login` flow and hardcoded bypasses by refactoring the `createTRPCContext`. Inject the **managed runtime’s OAuth session** directly into the context. Create a `protectedProcedure` using tRPC middleware that validates the OAuth role before reaching any resolver.
*   **Action:** Delete the `trial_password` and `backdoor` fields from the Drizzle schema and replace them with a `managed_role` enum that maps directly to your OAuth provider's claims.

### 3. Persistence Boundaries: Simulated Data Interceptors
To separate real data from simulated controls, implement a **Service Layer Interceptor**. For planning workflows, use a `is_simulated` flag in the Drizzle schema or a separate `simulated_projections` table. Ensure the tRPC procedures for "Simulated" actions are explicitly typed to return mock-safe data structures, preventing accidental writes to core financial tables.
*   **Action:** Add a global UI decorator (e.g., a "Simulation Mode" banner) triggered by the data source metadata returned in the tRPC response.

### 4. Navigation & Classification: Layout-Based Theme Switching
Implement a **Dual-Layout Routing Strategy** to manage the design system shift. Wrap the homepage in a `SkylineLayout` (Black/Green CSS variables) and all portal routes in a `RefinedPurpleLayout`. Use a nested route structure to classify the "Secondary Information" library under a `/library/*` path, ensuring it uses a distinct `LibrarySidebar` component to separate it from primary workflows.
*   **Action:** Use Tailwind’s `data-theme` attribute on the layout wrapper to toggle between the city-skyline and purple design systems without per-page style overrides.

### 5. Validation: Automated 5-Point Audit Script
Instead of manual page-by-page checks, create a **React Testing Library (RTL) suite** that targets the 260 page modules. Use a script to crawl the 222 routes and verify: (1) **Render** (no crash), (2) **Interaction** (primary button existence), (3) **Duplication** (check for identical route paths), (4) **Placeholder** (detect "lorem ipsum" or TODO strings), and (5) **Usefulness** (log routes with zero internal links).
*   **Action:** Mark audited pages in a `manifest.json` file to track progress without deleting any files, satisfying the "no-deletion" requirement while identifying technical debt.

## Cohere — command-a-03-2025

Here are five concise, implementation-specific recommendations based on the priorities:

1. **Safe Merge Order**: Begin by merging the shared component, followed by the seven additional pages. Use feature flags to isolate new routes during integration, ensuring existing 222 routes remain unaffected. Validate each merge with targeted tests before proceeding.

2. **Authorization Migration**: Replace hardcoded passwords, backdoors, and email bypasses with server-enforced OAuth roles. Implement a phased rollout: first, disable custom `/login` flows, then integrate managed OAuth, and finally audit all 260 page modules for unauthorized access patterns.

3. **Persistence Boundaries**: Clearly delineate real data persistence in core workflows from simulated controls. Annotate simulated responses in code and documentation. Ensure all 58 migrations align with real data requirements, avoiding accidental simulation data persistence.

4. **Navigation & Page Classification**: Redesign navigation to separate primary workflows from the Secondary Information library. Update route labels and metadata for clarity. Audit all 222 routes to ensure compliance with the refined purple design system, preserving the homepage’s black-and-green theme.

5. **Validation/Testing**: Expand the 90 existing tests to cover new pages, OAuth integration, and persistence boundaries. Conduct render, interaction, duplication, placeholder, and usefulness audits for all routed pages. Use automated tools to flag issues without deleting pages, ensuring full coverage across 260 modules.

## Mistral AI / Le Chat — mistral-small-latest

1. **Safe Merge Order**: Merge the seven new pages and shared component into a feature branch first, validating route conflicts with `tsc --noEmit` and `react-router-config` checks before merging into main to preserve the 222 existing routes.

2. **Authorization Migration**: Replace all hardcoded credentials and `/login` flows with managed OAuth roles by updating Drizzle schema to enforce role-based access, then remove legacy auth code in a single commit referenced in migration #59.

3. **Persistence Boundaries**: Introduce a `PlanningDataService` layer to separate real data workflows from simulated controls, marking non-persisted responses with `@mock` decorators and routing them under `/simulated` for clear separation.

4. **Navigation & Classification**: Add a secondary nav section labeled "Secondary Information" in the layout, grouping non-core pages via a `routeCategory` field in the route manifest while preserving the black-and-green homepage and adopting the purple design system for `/planning/*` routes.

5. **Validation/Testing**: Run automated audits post-merge using Playwright to verify render, interaction, and duplication checks, then extend test coverage to 120 tests by adding role-based interaction tests for the new pages.

## GroqCloud — openai/gpt-oss-20b

**Implementation‑Specific Recommendations (in priority order)**  

1. **Safe Merge Order**  
   • Create a dedicated `import‑stage` feature branch from `main`.  
   • Cherry‑pick the seven new pages plus the shared component into a *small, isolated* sub‑branch (`import‑pages`).  
   • Run the full test suite (`npm test`) and the migration suite (`drizzle-kit up`) locally; ensure no existing route fails.  
   • Merge `import‑pages` into `import‑stage` only after the above passes, then merge `import‑stage` into `main` through a protected pull request.  
   • Use Git hooks to verify that no route files are deleted or renamed during the merge.

2. **Authorization Migration**  
   • Strip the custom `/login` handler and all hardcoded trial/backdoor passwords from both client and server.  
   • Add a server‑side middleware that checks `req.session.oauthRole` for every protected route.  
   • Replace any client‑side role checks with calls to the new `useAuth` hook that reads the session role from the server.  
   • Update route definitions to use the new `protected` wrapper (e.g., `app.route('/plan', protected, …)`).

3. **Persistence Boundaries**  
   • Tag each page module with a `/* @persistent true */` comment if it operates on real user data; otherwise mark `@persistent false`.  
   • Create a lightweight “simulation” context that can be toggled per page via a URL query (`?mock=true`) and use it to render dummy data while keeping the real API untouched.  
   • Ensure all new pages respect this boundary: real‑data pages use Drizzle queries; simulated pages use static fixtures.

4. **Navigation & Page Classification**  
   • Add a top‑level navigation section called “Secondary Information Library” and move all non‑workflow pages into it.  
   • Prefix all library routes with `/library/*` and update the sidebar accordingly.  
   • Keep the core client and planning pages under `/app/*` and mark them with a distinct “Core” badge in the UI.  
   • Maintain the black‑and‑green skyline on the homepage; apply the purple design tokens (spacing, color palette) to all newly merged pages.

5. **Validation & Testing**  
   • For every routed page, add three tests: a **render** snapshot, an **interaction** test (e.g., form submit), and a **duplication** test that ensures a copy of the component renders correctly.  
   • Implement an automated **usefulness audit** script that runs `jest --coverage` and flags pages with < 70 % coverage.  
   • Integrate these tests into the CI pipeline, and block merge until all new pages pass.  
   • Add a manual audit checklist (render, interaction, placeholder, usefulness) that reviewers must tick before approving the merge.
```

## `docs/comprehensive-audit-2026-08-27.md`

```md
# Russell Capital Systems Comprehensive Audit

**Author:** Manus AI  
**Audit date:** 2026-08-27

## Scope

The audit covered the managed React, TypeScript, Express, tRPC, Drizzle, managed-OAuth, storage, AI, market-data, routing, persistence, and responsive public-interface implementation. The active route manifest now contains **232 user-facing routes**, including the token-scoped client portal.

## Multi-Model Review

Independent reviews were collected from Cohere, GroqCloud, Mistral/Le Chat, OpenAI GPT-5, Anthropic Claude, and Google Gemini. OpenRouter did not authenticate, Perplexity returned an invalid-key response, and xAI reported no credits or model license; those failures were recorded rather than represented as completed reviews.

A renewed Grok attempt checked every available route before publication. The enabled Grok app was not exposed as a callable MCP server, direct xAI returned HTTP 403, the managed Forge catalog contained no Grok model ID, and OpenRouter failed during OAuth initialization. No Grok review is claimed. The earlier successful GroqCloud review is retained as a separate provider and is not mislabeled as xAI/Grok.

## Confirmed Repairs

The public homepage now explicitly addresses physicians, surgeons, medical professionals, and practice owners while retaining the people-free emerald metropolitan image. Public AUM, fabricated operational metrics, demo language, fake telephone data, and inactive software pricing were removed. Primary protected actions now begin managed authentication.

Broken internal navigation targets were mapped to registered routes, portal-prefixed onboarding routes were gated, session tokens reject cross-project application IDs, and legacy administrator, executive, password, and email-PIN authority paths fail closed. Financial-input AI now requires authentication. Response headers no longer identify Express and API responses are not cacheable.

Synthetic carrier identities, ratings, assets, product claims, and index illustrations were removed; carrier data now requires a verified provider response. The production dependency graph was upgraded to remove all high and critical advisories. Fabricated Billing, Legal Payment Folder, and AI Meeting Notes dashboards were replaced with truthful route-preserving integration or workflow pages.

The custom production build now uses automatic JSX runtime plus an explicit React namespace banner to prevent the published `React is not defined` crash. The two experience tables previously missing from the live database have a creation-only migration matching the Drizzle schema.

## Owner-Controlled Items

Authenticated browser acceptance still requires the owner’s OAuth session and modeling/compliance acknowledgement. Historical duplicate membership/workspace rows and orphaned portal-token records must not be deleted or merged automatically. Previously exposed provider keys and any legacy owner password must be rotated through their providers. The custom domain remains untouched and owner-controlled.

## Final Validation

Concept 16 was rebuilt as a functional responsive homepage rather than embedded as a flattened screenshot. Its people-free emerald metropolitan interior is stored in persistent web asset storage. The glass navigation, Physician Wealth Command Center headline, physician portal and planning calls to action, four planning pillars, Review–Coordinate–Implement–Monitor workflow, and three-field assumption-labeled tax-planning preview render at desktop and 390-pixel phone widths. The existing portal access, physician planning services, consultation, final call to action, and footer remain below the hero, with eight additional physician planning workflow options linked to registered protected routes.

The definitive pre-publication pass reports **0 high and 0 critical production dependency advisories**, **0 TypeScript errors**, **107 passed Vitest suites with 5 intentionally skipped live-provider suites**, **2,029 passed tests with 10 skipped**, and a successful custom production build. The compiled smoke suite passed all **232 user-facing routes** plus `/` and `/api/trpc/auth.me`. A headless Chromium execution confirmed both the Concept 16 hero and lower scrolling options rendered and no unresolved React module import or `React is not defined` error occurred. The final security checks also confirmed that the allowlisted Concept 16 background receives a managed-storage redirect, an unlisted anonymous storage key returns `404`, and the authentication API returns all four configured cache and browser-hardening headers.

Desktop and mobile visual checks passed without horizontal overflow. Desktop preserves the split hero and command-center hierarchy; mobile stacks the headline, calls to action, planning pillars, workflow, calculator controls, portal access, service cards, planning options, consultation, and footer into one complete scrolling page.

The focused browser audit measured a 1440-pixel desktop viewport at 1,437 pixels of document width and a 391-pixel phone viewport at exactly 391 pixels of document width, confirming no horizontal overflow. Both viewports rendered the hero and lower content, exposed four command tabs and all three labeled calculator fields, and contained zero unresolved in-page anchors. At phone width, the menu opened successfully, reported `aria-expanded=true`, and displayed all four mobile navigation links.

### Final Concept 16 screenshot review

| View | Result | Concrete observations |
|---|---|---|
| Desktop, 1440 × 1000 | Pass | The glass navigation remains within the viewport; the headline and both physician calls to action are unobstructed; the command-center tabs, workflow, and calculator form a cohesive right-hand panel; the city interior contains no people or baked-in lettering; and the trust band, portal access, six service cards, eight planning options, consultation, closing call to action, and footer continue in a consistent vertical sequence. No content is clipped at either edge. |
| Phone, 390 × 844 | Pass | The hero becomes a single-column stack; headline, description, and both calls to action remain visible; the command-center panel follows without overlap; the four pillars, workflow, estimate, and three fields fit the phone width; and every lower section continues in a readable single-column order through the footer. The long page is intentional because the owner requested all lower options. No horizontal clipping or dead-end section was visible. |

An independent style pass found the dark institutional palette, emerald signal color, physician positioning, secure tone, product panel, and command-center framing coherent. It suggested future brand differentiation and more varied lower-section composition, but identified no release-blocking layout failure. Those optional refinements were not allowed to override the owner-selected Concept 16 direction.
```

## `docs/concept16-domain-readiness-review.md`

```md
# Concept 16 Domain Readiness Review

Four authenticated providers completed separate reviews using the same credential-free facts: **OpenAI GPT-5**, **Google Gemini**, **Cohere Command A**, and **Mistral Magistral/Le Chat**. All four agreed that the application evidence supports a conditional launch and that the unresolved custom-domain step is operational: `russellcapitalsystems.com` must first be added in the managed Domains panel, and only the exact records generated there may be copied into GoDaddy.

| Finding | Provider consensus | Source/runtime verification | Decision |
|---|---|---|---|
| Existing Concept 16 deployment is reachable | Four of four | Both current domains return HTTP 200 with title `Russell Capital` | Confirmed |
| New domain is not yet attached | Four of four | Current managed domain list contains only the platform domain and `russellcap.com` | Confirmed blocker for the new hostname only |
| DNS records must not be guessed | Four of four | No authoritative values are available until the domain is added in the Domains panel | Enforced |
| Existing DNS must be preserved | Four of four | Owner explicitly requires unrelated GoDaddy records and `russellcap.com` to remain unchanged | Enforced |
| Repeated missing-session notices may be noisy | Four of four | `verifySession()` logs a warning whenever public `auth.me` is called without a cookie | Confirmed non-blocking log-noise repair |
| Application needs a hardcoded canonical redirect | Not established | Production server has no host redirect and public routes use relative/current-origin links | No code change before domain attachment |
| OAuth, TLS, MX/TXT, and live interaction behavior on the new domain | Conditional | Requires the real attached hostname and post-DNS browser checks | Verify after attachment |

The AI reviews do not provide or authorize DNS values. The managed Domains panel remains the sole source of truth. After attachment, verification must cover apex and `www`, TLS, the Concept 16 hero, one primary interaction, protected-route login behavior, existing-domain continuity, and production logs.
```

## `docs/core-workflow-verification.md`

```md
# Core Workflow Verification

The imported client directory and detail workflows now operate against the managed `clients` table rather than an absent source database. A rollback-only integration test performed a real workspace insert, client insert, client read, client update, and post-rollback absence check. No verification record remains in the database.

The new Planning Cases workspace is a primary Client Journey destination at `/portal/planning-cases`. Its protected tRPC API scopes every request to the authenticated user's workspace, validates linked-client ownership, and persists case title, client association, status, stage, assumptions, recommendation summary, workflow state, timestamps, and case notes. Advisors can create a case, save progress, advance stages, archive a case, and add timestamped notes. The UI includes explicit loading, empty, failure, retry, and saving states.

The main dashboard now reads persisted planning cases and displays Active Planning Cases plus review count. It provides a real-data empty state and a retryable error state alongside the existing client and pipeline metrics. It does not display live AUM; the empty state explicitly states that no fabricated client or AUM data is shown.

Validation completed:

| Check | Result |
|---|---|
| Planning API unit tests | 4 passed |
| Planning UI integration tests | 4 passed |
| Live rollback-only client CRUD | Passed; no retained row |
| Persistence and table tests | 5 passed |
| TypeScript after workflow integration | Passed |
| Planning route and primary navigation | Registered; authenticated browser content pending final OAuth round trip |

Additional integration coverage now loads the actual client directory and detail modules, verifies their protected tRPC contracts, validates directory loading/empty/retry states, confirms client form validation and save feedback, and requires a profile refetch after update before reporting success. The dashboard now tracks loading, empty, error, and retry behavior across practice metrics, planning cases, analytics, history, activity, top clients, allocation, goals, meetings, and coaching. Four focused suites currently pass 14 tests; authenticated browser create/edit/reload verification remains reserved for the final managed OAuth round trip.
```

## `docs/database-persistence-verification.md`

```md
# Database Persistence Verification

The imported source contained a comprehensive Drizzle schema but its historical SQL files were placeholder comments. The managed database initially contained only `users` and `__drizzle_migrations`, so core portal procedures would otherwise have failed at runtime.

Two focused, creation-only migrations were generated and reviewed before execution. `0068_dark_invaders.sql` adds planning cases, planning-case notes, page-audit runs, page-audit records, and portal preferences. `0069_core_portal_bootstrap.sql` creates 24 existing source tables required by workspaces, memberships, clients, deals, strategies, saved scenarios, snapshots, notes, tags, meetings, documents, knowledge, favorites, notifications, activity, audit, dashboard configuration, client-portal tokens, and error tracking. Neither migration touches the managed `users` table or contains destructive SQL.

The schema intentionally reuses `clients`, `saved_scenarios`, `scenario_snapshots`, and `client_notes` rather than creating duplicate records. `planning_cases` acts as a durable workflow envelope with JSON assumptions, results, and workflow state; `planning_case_notes` adds case-scoped notes. Page-audit runs and records persist the required 1–10 score, health dimensions, recommendation, merge target, rationale, instructions, and evidence. Portal preferences persist navigation and motion choices.

All five additive tables were queried after execution. A deterministic live test then parsed the exact 24-table list from `0069_core_portal_bootstrap.sql` and executed `SELECT COUNT(*)` against every listed table. All 29 created tables are therefore confirmed queryable. No mock customer, testimonial, or financial data was inserted.
```

## `docs/grok-delta-manifest.md`

```md
# Verified Grok Addition Delta

The canonical Grok import is restricted to seven routed pages plus one shared visual component. No Grok database, server, authentication, framework, migration, or environment file will overwrite the selected primary platform.

| Route | Page component |
|---|---|
| `/portal/the-arrival` | `TheArrival.tsx` |
| `/portal/the-mirror` | `TheMirror.tsx` |
| `/portal/the-strategy-table` | `TheStrategyTable.tsx` |
| `/portal/the-field` | `TheField.tsx` |
| `/portal/the-map` | `TheMap.tsx` |
| `/portal/the-legacy` | `TheLegacy.tsx` |
| `/portal/the-brotherhood` | `TheBrotherhood.tsx` |

All seven pages import `client/src/pages/portal/_genome/GenomeKit.tsx`. The canonical files are stored under `/home/ubuntu/russell-capital-unified-sources/release/addition`; their SHA-256 hashes are recorded in `docs/grok-delta-sha256.txt`.

The primary application remains `/home/ubuntu/russell-capital-unified-sources/release/primary`, which contains the 222-route platform selected from the 39.8 MB archive. The separate 12-route marketing application remains reference-only and is not allowed to replace the platform router, server, or database layer.
```

## `docs/grok-handoff/01_FINANCIAL_LIBRARIAN_SPEC.md`

```md
# Financial Librarian — build specification (handoff for Grok)

**Status:** built and merged. This document describes what exists so the next
builder can extend it without re-deriving it. Source of truth is the code; paths
below are relative to `russell-capital-systems/`.

## What it is

One AI Financial Advisor, presented as a **tape recorder**, that speaks for the
whole AI API team (Claude, ChatGPT, Grok, Gemini, Perplexity, OpenRouter,
Mistral, Groq, Manus — whichever have keys in the host environment). It answers
spoken or typed questions from a client or their advisor, **but only after the
client has completed the full Financial Assessment**. Before that it explains
what is missing and hands them the assessment.

It is a *librarian*, not an oracle: once the assessment is complete the client
may ask unlimited questions; the librarian answers each, and on request boils
everything asked down to **3–5 core questions**, names the **emergent
question** they have not asked (the pattern underneath their questions and
their facts), and lays out a **10–15 page journey** through the site — real
URLs, calculators included — in a logical, building sequence.

## The pieces

| Piece | File | Notes |
|---|---|---|
| Assessment schema (15 sections, ~190 fields) | `shared/clientFactFinder.ts` | `FACT_FINDER_SECTIONS`, `factFinderCompleteness()`, `factFinderSummary()`. Required fields gate the advisor. `showIf` hides fields that don't apply. |
| Assessment storage | `drizzle/schema.ts` → `client_fact_finders` (one row per user, JSON + completeness + completedAt) | Also `client_journeys` (each generated journey). Both in `database/rcs-schema.sql`. |
| Assessment API | `server/factFinderRouter.ts` (`factFinder.get/save/summary/reset`), `server/factFinderDb.ts` | Zod-validated; graceful when no DB. |
| Assessment page | `client/src/pages/portal/FinancialAssessment.tsx` → `/portal/financial-assessment` | Section rail, autosave (900 ms), completeness, printable **Financial Analysis Document**. |
| Page catalog | `shared/journeyCatalog.ts` | 45 real portal pages with `kind`, `tags`, `builds` (ordering weight). Add pages here to make them eligible for journeys. |
| Journey engine | `shared/journeyEngine.ts` | Deterministic: `detectTags`, `factFinderSignals`, `distillQuestions`, `emergentQuestion`, `buildJourney`, `validateJourney`. |
| Librarian API | `server/librarianRouter.ts` (`librarian.status/ask/journey/latestJourney`) | Gate → fan-out to providers → synthesis by the lead model; AI may only polish wording of a journey, never its pages. Offline fallback answers from the assessment alone. |
| Tape recorder | `client/src/components/TapeRecorderAdvisor.tsx` | REC (Web Speech), PLAY, STOP, TYPE, JOURNEY; ElevenLabs voice via `ultra.speak` when configured, else browser speech. |
| Advisor page | `client/src/pages/portal/AIFinancialAdvisor.tsx` → `/portal/ai-advisor` | Deck + "what it knows" + the journey (core questions, emergent question, ordered steps with visited state). |
| Navigation | `client/src/components/AppShell.tsx` → group **New Client Welcome List** | Assessment → AI Financial Advisor → Wealth Genome → The Arrival … The Brotherhood. |

## Rules the librarian obeys (do not loosen)

1. **Gate.** No planning answer of any kind until `factFinderCompleteness().complete` is true. Not even partial.
2. **No invented facts.** Every figure comes from the client's own assessment. The offline answer and the tests assert this.
3. **Education, not advice.** Projections under stated assumptions, no guarantees, no product solicitation; the licensed advisor and the tax professional team review suitability and IRS compliance before anything is implemented. The compliance line is on the deck.
4. **Pages are real.** Every journey step must exist in `JOURNEY_CATALOG` (validated) and every catalog path must be a route in `App.tsx`.
5. **Sizes.** 3–5 core questions, one emergent question, 10–15 steps, first step is orientation, last step is a review page, steps are sorted by `builds` so each page builds on the previous one.

## How a journey is composed (engine)

1. `detectTags(question)` — keyword topics per question (tax, mortgage, equity, debt, student-loans, retirement, income, investments, volatility, iul, insurance, estate, divorce, asset-protection, practice, liquidity, real-estate, oil-gas, strategy, time).
2. `factFinderSignals(assessment)` — weighted topics from the facts (effective tax rate, mortgage size/years, equity, student loans, tax-deferred balances, risk answers, cash months, disability gap, practice ownership, no will, protection priorities, retirement horizon, stated worries).
3. `distillQuestions(questions, signals)` — group by primary topic → 3–5 core questions using per-topic templates; if the client asked fewer topics, the strongest signals supply the rest ("from your assessment: …").
4. `emergentQuestion(distilled, signals)` — strongest signal **not covered** by what they asked, rendered with a per-topic template that quotes the reason (e.g. "you would sell in a 30% drop").
5. `buildJourney` — score every catalog page (question tags ×3, emergent ×3, signal weights), always open with The Mirror + Wealth Genome, take the two best pages per core question, two for the emergent question, guarantee a calculator, a comparison, a volatility/variables page, protection/legacy pages when signals say so, fill to 10, close with Russell Number, then order by `builds`. Each step's `why` names the previous page it builds on and which question it serves.
6. When AI providers are configured, `librarian.journey` asks the lead model to **reword** the questions, the emergent question, and each step's `why` in the client's own terms; the result is validated and discarded if it changes ids, order, or sizes.

## Extending it

- **Add a page to journeys:** append to `JOURNEY_CATALOG` (id, path that exists in `App.tsx`, title, purpose, kind, tags, builds). The tests check uniqueness and `/portal/` paths.
- **Add a topic:** add a keyword regex in `TOPIC_KEYWORDS`, a template in `CORE_TEMPLATES`, aliases in `TAG_ALIASES`, optionally an `EMERGENT_TEMPLATES` entry and a signal in `factFinderSignals`.
- **Add an assessment field:** append to the section in `FACT_FINDER_SECTIONS`; mark `required` only if the advisor genuinely cannot advise without it (required fields gate the advisor). The UI, storage, summary, document, and completeness all follow automatically.
- **Voice:** set `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` on the host; the deck then speaks in the cloned voice. Without them it uses the browser's voice.

## Tests

`server/journeyEngine.test.ts` (engine + assessment), `server/librarian.test.ts`
(gate, offline answer, fan-out, journey persistence, invalid AI polish
rejected). Run: `npx vitest run server/journeyEngine.test.ts server/librarian.test.ts`.
```

## `docs/grok-handoff/02_ASSESSMENT_AND_JOURNEY_DATA.md`

````md
# Assessment + journey data — shapes, tables, endpoints, examples (handoff for Grok)

Everything the Financial Librarian stores and exchanges, so another builder can
read, seed, or extend it. Paths relative to `russell-capital-systems/`.

## 1. The Financial Assessment (client fact finder)

**Shape** (`shared/clientFactFinder.ts` → `ClientFactFinder`):

```json
{
  "version": 1,
  "sections": {
    "household":   { "firstName": "…", "lastName": "…", "dateOfBirth": "1981-04-02", "maritalStatus": "Married", "stateOfResidence": "Texas", "dependents": 2, "occupation": "Surgeon", "phone": "…", "email": "…" },
    "income":      { "employmentType": "W-2 employee", "w2Income": 650000, "spouseIncome": 0, "incomeTrajectory": "Rising modestly" },
    "taxes":       { "filingStatus": "Married filing jointly", "adjustedGrossIncome": 640000, "federalTaxPaid": 205000, "priorReturnsAvailable": true, "taxPain": "…" },
    "realEstate":  { "ownsPrimaryHome": true, "primaryHomeValue": 1400000, "primaryMortgageBalance": 900000, "primaryMortgageRate": 6.5, "primaryMortgageYearsRemaining": 26, "homeEquity": 500000 },
    "debts":       { "studentLoanBalance": 180000 },
    "investments": { "taxableBrokerage": 150000, "employerPlanBalance": 700000, "rothIra": 40000, "concentratedPosition": false, "riskTolerance": "Moderate", "worstYearReaction": "Hold and wait" },
    "cash":        { "checking": 20000, "savings": 15000, "emergencyFundMonths": 2 },
    "cashFlow":    { "monthlyTakeHome": 30000, "monthlyFixedExpenses": 18000, "monthlyDiscretionary": 6000, "monthlySavings": 6000, "retirementLifestyle": "…" },
    "insurance":   { "termLifeDeathBenefit": 2000000, "disabilityMonthlyBenefit": 0, "malpracticeLimits": "1M/3M" },
    "practice":    { "ownsPractice": false },
    "estate":      { "hasWill": false, "hasRevocableTrust": false, "heirs": "…", "legacyGoals": "…" },
    "protection":  { "divorceProtectionPriority": "5 — Essential", "creditorProtectionPriority": "4", "taxFreeIncomePriority": "5 — Essential" },
    "retirement":  { "targetRetirementAge": 58, "desiredRetirementIncomeMonthly": 25000, "retirementConcern": "…" },
    "goals":       { "topGoals": "…", "biggestConcern": "…", "timelineToAct": "Immediately" },
    "documents":   { "taxReturns": "Will provide" }
  },
  "lists": { "properties": [ { "type": "Rental", "value": 450000, "mortgageBalance": 300000, "rate": 6.1, "netRentMonthly": 900 } ] }
}
```

- Section ids, field keys, types, options, `required`, and `showIf` all live in `FACT_FINDER_SECTIONS`; the UI is generated from it.
- `factFinderCompleteness(ff)` → `{ percent, answered, required, complete, missing[{section, sectionId, field, key}], sectionPercent }`. **52 required, currently-visible answers** make it complete (more if conditional sections open, e.g. owning a home or a practice).
- `factFinderSummary(ff)` → the plain-text document the librarian is given (and the printable Financial Analysis Document).

**Table** `client_fact_finders` (`drizzle/schema.ts`, `database/rcs-schema.sql`):
`id, userId (unique), data JSON, completeness INT, completedAt, createdAt, updatedAt`.

**Endpoints** (tRPC, signed-in user only; superjson envelope `{ "json": … }`):
- `factFinder.get` → `{ data, completeness, completedAt, updatedAt, persisted }`
- `factFinder.save` `{ data }` → `{ saved, completeness, completedAt }` (zod-validated; strings ≤ 4000 chars; lists ≤ 50 rows)
- `factFinder.summary` → `{ text, complete, percent }`
- `factFinder.reset`

## 2. The librarian

**Endpoints**
- `librarian.status` → `{ complete, percent, missingCount, missingSections[], completedAt, configured, contributorCount, contributors[], voiceConfigured }`
- `librarian.ask` `{ question, history?: [{role:"user"|"librarian", text}] }` →
  gated: `{ gated: true, percent, missingSections, spoken }` · answered: `{ gated: false, answer, spoken, contributors[], contributorCount }`
- `librarian.journey` `{ questions: string[] (1–40) }` → gated as above, or `{ gated: false, journey, journeyId, spoken }`
- `librarian.latestJourney` → the last stored journey for the user, or null
- `ultra.speak` `{ text }` → `{ ok: true, audioBase64, mimeType }` when ElevenLabs is configured

**Journey shape** (`shared/journeyEngine.ts` → `Journey`; stored in `client_journeys.journey`):

```json
{
  "coreQuestions": [
    "How do I pay less tax on the income I already earn — this year and every year after?",
    "What is the fastest sensible way to be free of my mortgage, and what is that interest worth to me?",
    "How do I keep growing while controlling volatility and the variables I can actually control?"
  ],
  "emergentQuestion": "Underneath your questions is a volatility question you haven't asked: with you would sell in a 30% drop, how do you keep the plan from depending on markets you can't control?",
  "steps": [
    { "id": "mirror",          "path": "/portal/the-mirror",          "title": "The Mirror",          "kind": "orientation", "why": "Start here. Your personal dashboard — where you stand today, in one view." },
    { "id": "wealth-genome",   "path": "/portal/wealth-genome",       "title": "Wealth Genome Analysis", "kind": "orientation", "why": "Builds on “The Mirror”. …" },
    { "id": "tax-waterfall",   "path": "/portal/tax-waterfall",       "title": "Tax Waterfall",       "kind": "education",   "why": "Builds on “Wealth Genome Analysis”. … It serves question 1." },
    { "id": "mortgage-killer", "path": "/portal/mortgage-killer",     "title": "Mortgage Killer",     "kind": "calculator",  "why": "… It serves question 2." },
    { "id": "market-stress-test", "path": "/portal/market-stress-test", "title": "Market Stress Test", "kind": "calculator", "why": "… It serves question 3 and the emergent question." },
    { "id": "russell-number",  "path": "/portal/russell-number",      "title": "Russell Number",      "kind": "review",      "why": "Close the loop. …" }
  ],
  "generatedBy": "journey-engine"
}
```
(10–15 steps in practice; the example is abbreviated.) `generatedBy` becomes
`journey-engine + claude` when the AI team polished the wording.

**Table** `client_journeys`: `id, userId, questions JSON, journey JSON, createdAt`.

## 3. The page catalog (`shared/journeyCatalog.ts`)

45 pages. Each: `{ id, path, title, purpose, kind, tags[], builds }`.
`kind` ∈ orientation · education · calculator · comparison · protection · legacy · review.
`builds` 0–9 orders a journey (0 = orientation, 8–9 = review/closing).
Tags in use: start, tax, roth, tax-free, mortgage, payoff, interest, equity, heloc,
war-chest, liquidity, debt, student-loans, retirement, income, gap, withdrawal,
social-security, investments, volatility, risk, stress, floor, iul, insurance,
disability, malpractice, gaps, estate, trust, legacy, heirs, beneficiaries, divorce,
asset-protection, creditor, practice, business, succession, real-estate, oil-gas,
strategy, combination, comparison, decision, variables, control, time, review …

## 4. Seeding for tests or demos

`server/journeyEngine.test.ts` exports `completeFactFinder(overrides)` which fills
every required, visible field with a placeholder and applies overrides — use it
to build a complete assessment in tests. For a running server, sign in as the
owner, POST `factFinder.save` with a complete document, then call `librarian.status`
to confirm `complete: true`.

## 5. Notes on the database drivers

MySQL 8 returns JSON columns parsed; MariaDB returns them as text. All readers go
through `server/_core/jsonColumn.ts` so both behave the same. Keep using it for any
new JSON column.
````

## `docs/grok-handoff/03_BUILD_STATUS_AND_NEXT.md`

```md
# Build status and what to build next (handoff for Grok)

Read `01_FINANCIAL_LIBRARIAN_SPEC.md` and `02_ASSESSMENT_AND_JOURNEY_DATA.md`
first. This file is the running ledger: what is done, what was verified, and the
next work in priority order. Do not undo the rules in the spec.

## Done and merged to `master`

- Public homepage rebuilt around the six crisp images; published as a single
  file (`docs/index.html`, GitHub Pages workflow) and mirrored in the React app;
  parity test keeps the two in step.
- Lead pipeline: homepage estimator → `public_leads` (IP, consent, fact finder,
  advisor-only analysis) → owner alert email → prospect acknowledgement →
  owner lead inbox with CSV export. Live smoke test: `scripts/smoke_lead_capture.mjs`.
- Owner sign-in for self-hosted installs (bcrypt hash in env; rate-limited), so
  `/portal/*` works on cPanel/VPS without the managed OAuth server.
- Database: 117-table schema as `database/rcs-schema.sql`; `pnpm db:build`
  applies and verifies it. Deploy bundle installs and runs from a clean unzip
  with plain npm. Mail via Resend or plain SMTP.
- **Financial Assessment** (15 sections, ~190 questions) with autosave,
  completeness, and the printable Financial Analysis Document.
- **Financial Librarian / tape recorder** with the assessment gate, unlimited
  Q&A, and the journey composer (3–5 core questions, emergent question,
  10–15 real pages in building order).
- Navigation group **New Client Welcome List**: Financial Assessment → AI
  Financial Advisor → Wealth Genome Analysis → The Arrival … The Brotherhood.
- One-command release: `pnpm release` (typecheck → docs/index.html → schema SQL
  → public-surface tests → build + bundle guard → deploy zip → code book).

## Verified how

- Full vitest suite against a real MariaDB: all passing (see the latest PR).
- Browser (headless Chromium) against the production build: sign in → compliance
  signature → assessment complete → advisor answers → JOURNEY renders the core
  questions, emergent question and ordered steps.

## About the "Grok checkpoint" zip

`GrokRussell_Capital_Systems_Checkpoint_bcfe0624.zip` was compared file-by-file
with the repository: it contains **no page that is not already in the repo**
(it is an older snapshot). The seven journey pages it refers to (The Arrival …
The Brotherhood, with `_genome/GenomeKit.tsx`) and the Fact Finder / Wealth
Genome pages were already merged; they are now grouped under New Client Welcome
List, with the Wealth Genome page given a portal route (`/portal/wealth-genome`).
One caveat for the owner: those pages are visually from the purple "genome"
design and the public homepage is emerald/neon; the portal shell is purple, so
inside the portal they match. `WealthGenomePage` still shows placeholder scores
(it is not yet driven by the assessment) — see next steps.

## Next steps, in order

1. **Drive the Wealth Genome from the assessment.** Replace the placeholder
   dimension scores in `client/src/pages/WealthGenomePage.tsx` with scores
   computed from `factFinderSignals()` / the assessment (income stability, tax
   efficiency, insurance coverage, retirement readiness, estate planning, debt
   management, diversification, risk mitigation). Keep it explanatory, no
   guarantees.
2. **Journey progress on the pages themselves.** When a client opens a journey
   step, show a small "Step N of M — next: …" bar (read `librarian.latestJourney`)
   so the journey carries them page to page. Mark steps visited server-side
   (add `visitedAt` per step to `client_journeys.journey`).
3. **Calculators pre-filled from the assessment.** Mortgage Killer, Income Gap,
   Roth Strategies, Market Stress Test: read the relevant assessment fields on
   load so the client does not retype. Keep the assessment the single source.
4. **Advisor view of a client's assessment and journey.** In the client
   directory, show the client's completeness, the Financial Analysis Document,
   and their latest journey; let the advisor ask the librarian *about* a client
   (same gate, client's data).
5. **Voice.** With `ELEVENLABS_API_KEY`/`ELEVENLABS_VOICE_ID` set the deck speaks
   in the cloned voice. Consider streaming for long answers.
6. **More catalog coverage.** Any planning page not yet in
   `shared/journeyCatalog.ts` cannot be recommended; add it with honest tags.
7. **Owner tasks (not code):** GitHub Pages → Source: GitHub Actions; set
   `OWNER_EMAIL`/`OWNER_PASSWORD_HASH`, `DATABASE_URL`, mail (`SMTP_*` or
   `RESEND_API_KEY`), AI keys; rotate the published credentials (see PR #10).

## Working agreements for Grok on this repo

- Build on a branch and open a PR to `master`; never force-push or delete files
  you did not create. (PR #3 destroyed content and had to be restored.)
- No secrets in code, tests, docs or commit messages. No fabricated numbers,
  results, or patent statuses ("patent-pending / in process" only).
- Run `pnpm check` and `pnpm release` before pushing; the tests encode the rules.
```

## `docs/grok-merge-verification.md`

```md
# Grok Addition Merge Verification

The seven client-journey pages and shared `GenomeKit.tsx` component were imported from the canonical eight-file delta. No Grok server, schema, migration, authentication, or framework file was imported.

| Verification | Result |
|---|---|
| Primary distinct routes before merge | 222 |
| Distinct routes after merge | 229 |
| Primary routes removed | 0 |
| Added routes | 7 |
| Canonical delta file hash matches | 8 of 8 |
| Added routes present in active sidebar | 7 of 7 |
| TypeScript after merge | Passed |
| Merge safeguard tests | 4 of 4 passed |

All seven direct URLs were also exercised in the managed browser preview. Each resolved through the managed authentication guard rather than the 404 fallback. A second pass confirmed that The Legacy and The Brotherhood progressed beyond the transient identity-check loader. The test suite additionally imports all seven page modules directly to detect missing runtime dependencies before authenticated page-level validation.

| Grok route | Direct URL reached auth guard | Module loaded | Authenticated content |
|---|---:|---:|---:|
| `/portal/the-arrival` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-mirror` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-strategy-table` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-field` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-map` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-legacy` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-brotherhood` | Yes | Yes | Pending final OAuth round trip |

The new pages appear in an ordered **Client Journey** sidebar group: The Arrival, The Mirror, Strategy Table, The Field, The Map, The Legacy, and The Brotherhood. The group is additive and does not replace any primary navigation entry. The deterministic verification is stored in `server/grok-merge.smoke.test.ts`.
```

## `docs/homepage-hero-asset-review.md`

```md
# Homepage Hero Asset Review

The imported homepage references an external CloudFront skyline image that does not render in the managed preview, leaving the hero as a plain dark background. Two replacement candidates were visually reviewed.

The 4181×2793 realistic skyline provides production-resolution detail, visible office lights, a centered illuminated avenue, atmospheric mist, and sufficient negative space for overlay text. It does not contain strong native emerald lighting, but it supports a controlled green color layer, radial emerald glows, and dark readability masks without reducing photographic quality.

The 625×350 emerald skyline has the desired green glow, reflected water, and dramatic night atmosphere, but its resolution and compression are insufficient for a full-width desktop hero.

The selected direction is therefore the high-resolution realistic skyline with layered emerald illumination in CSS. This preserves the city-at-night requirement, makes the green lighting intentional and consistent with Russell Capital branding, and avoids a visibly low-resolution hero.
```

## `docs/homepage-typography-validation.md`

```md
# Homepage Typography Validation

The public homepage now uses an exact **1.6 typography scale**, representing a 60 percent increase over the prior visible font sizes. The scale covers navigation, hero text, buttons, metrics, client-portal form, feature cards, pricing cards, consultation content, final CTA, badges, and footer copy. It is scoped beneath `.rc-homepage-type-scale`, so managed login and portal interiors retain their existing typography.

Responsive repairs include a taller hero, wider desktop hero measure, larger controls, flexible CTA wrapping, expanded pricing width, larger card padding, single-column mobile metrics, hidden long navigation branding on narrow screens, bounded mobile navigation actions, full-width mobile hero buttons, and wrapped footer content.

| Validation | Result |
|---|---|
| Desktop full-page, 1440×1200 | Passed; no horizontal overflow, clipped text, card collisions, or unusable actions |
| Mobile full-page, 390×844 | Passed; title wraps cleanly, actions remain usable, metrics and cards reflow, footer remains readable |
| TypeScript | Passed |
| Homepage typography safeguards | 3 passed |
| Existing design-system safeguards | 3 passed |
| Production build | Passed |

Final project-wide validation after the typography change also passed: **703 Vitest suites**, **2,011 passing tests**, **0 failures**, and **10 intentionally skipped optional live-provider checks**. The compiled production server returned HTTP success for all **231 audited user-facing routes**, the homepage, and the managed authentication API. The reusable smoke runner is stored at `scripts/smoke-production-routes.mjs`.

The change has not been published. It is prepared for an unpublished review checkpoint so the owner can publish manually.
```

## `docs/implementation-and-functionality-audit.md`

```md
# Russell Capital Unified Portal — Implementation and Functionality Audit

## Executive Result

The managed unified application now preserves the complete primary platform, adds all seven Grok client-journey pages, introduces a persisted Planning Cases workspace, creates a searchable Secondary Information library, and adds an administrator-only System Health dashboard. The public experience retains the requested black-and-green city-at-night identity; portal and managed-access surfaces use the purple Grok-inspired system.

The source router contains **232 explicit paths including `/404`**. The page audit covers **231 user-facing routed pages**, each with a 1–10 usefulness score and a Keep, Improve, Merge, Move to Secondary Information, or Retire recommendation. No page was deleted.

| Release check | Result |
|---|---:|
| TypeScript | Passed |
| Vitest suites | 701 passed, 0 failed |
| Tests | 2,008 passed, 0 failed, 10 optional live-provider checks skipped |
| Production build | Passed |
| Compiled production route requests | 231 of 231 returned HTTP 200 |
| Compiled JS, CSS, and auth API | HTTP 200 |
| Page audit coverage | 231 of 231 |
| Source-level broken pages | 0 |
| Source-level at-risk pages | 6 |

## Architecture and Security

The original client-side password, trial-code, eternal-password, owner-email bypass, hidden-material password, website-usage password, reset-code, and retired advisor-account access paths were removed or disabled. Managed OAuth now controls identity; server procedures use authenticated roles and workspace membership. Legacy `/register`, `/forgot-password`, `/reset-password`, and `/trial` routes explain the change and direct users to secure sign-in.

The application retained the managed Express/tRPC runtime, OAuth state and nonce protection, database, S3 storage helper, analytics, and runtime assets. Route-level error boundaries isolate page failures and provide Retry. Persisted client-error reporting feeds an administrator-only System Health dashboard alongside real usage analytics, top routes, and page-audit totals.

One acceptance test remains owner-dependent: a complete browser OAuth round trip followed by the required modeling-disclosure acknowledgment. Automated tests verify OAuth boundaries and return-path contracts, but the validation process did not accept legal terms on the owner’s behalf.

## Database and Core Workflows

Non-destructive migrations `0068` through `0072` align the managed database with the imported runtime. They add planning cases, case notes, audit runs and records, preferences, 24 core portal tables, runtime schedule/compliance/session tables, slide usage, risk-score history, and compliance alerts. The managed users table was preserved. No mock client, testimonial, or financial data was inserted.

Core workflow outcomes:

| Workflow | Status |
|---|---|
| Client create, list, select, load, update, and saved profile data | Database-backed; live rollback-only persistence test passed; owner-session browser UAT remains |
| Planning Cases | Database-backed create, save, stage, archive, note, and preference workflows implemented |
| Dashboard | Uses persisted client, pipeline, activity, and planning-case data with loading, empty, error, and retry states |
| Live AUM | Suppressed until the owner explicitly requests it |
| Mortgage Killer | Protected tRPC PDF export and email mutation replace broken REST calls; email reports honest unavailability without Resend |
| Carrier Ratings | Randomized filler removed; deterministic API-backed/reference-labeled interface implemented |
| Page errors | Route-keyed boundary plus persisted error reporting implemented |

## Internet-Backed Features

Core advisor AI workflows use a bounded server-only model adapter with timeouts, sanitized failures, and empty-output rejection. A live readiness call succeeded through the managed model gateway. The architecture council used independent OpenAI, Claude/Anthropic, Gemini, Cohere, Mistral/Le Chat, and GroqCloud responses before implementation resumed.

Market data no longer invents fallback prices. Bitcoin uses CoinGecko, gold and silver preserve live/cached/reference provenance, and SPY/QQQ report unavailable until a verified equity source is configured. The Market Data Dashboard labels provenance and exports the received snapshot rather than simulating a download.

Optional direct-provider tests are intentionally opt-in because they incur external latency or billing. Direct xAI/Grok remains unavailable because its account reported no credits or license. The OpenRouter credential pasted into chat should be rotated. Resend is optional; email-dependent actions surface a truthful provider-unavailable message when it is absent.

## Design and Navigation

The homepage uses a persistent high-resolution city-at-night asset with dark masks and emerald illumination. Desktop and mobile validation confirm readable contrast, responsive sections, and usable actions. The managed login and retired-auth pages use a polished dark-purple system.

Portal interiors inherit the scoped `.rc-portal-theme` purple system for navigation, cards, focus states, controls, and backgrounds. A deterministic color audit scanned 332 files and saved 891 unique tokens to `audit/interior-color-token-inventory.csv`. It distinguishes the shared purple shell from semantic red/amber status colors, positive finance greens, informational blues, and legacy page-level surfaces. Post-disclosure authenticated review is still recommended before attempting broad page-by-page token replacement, because many green, red, amber, and blue values are intentional financial semantics.

The left navigation now separates primary workflows from **Secondary Information**. The secondary catalog is generated from the router, searchable, categorized, duplicate-aware, and preserves every route. The seven Grok pages appear together as **Client Journey**; Planning Cases is promoted as the persisted workflow.

## Page Usefulness Audit

| Measure | Result |
|---|---:|
| Average score | 5.99 / 10 |
| Score 5 or higher | 153 pages |
| Score below 5 | 78 pages |
| Keep | 83 pages |
| Improve | 68 pages |
| Move to Secondary Information | 68 pages |
| Merge | 5 pages |
| Retire after owner approval | 7 pages |

The seven Retire recommendations are `/portal/ai-meeting-notes`, `/portal/command-center`, `/portal/monitoring-agreement`, `/portal/my-world`, `/portal/nerve-center`, `/portal/rewards`, and `/portal/secret-secrets/:id`. They remain active pending owner approval.

The five Merge recommendations are `/portal/client-intake-recommender` into `/portal/combo-recommender`, `/portal/client-onboarding-auto` into `/portal/client-onboarding`, `/portal/competitive` into `/portal/calculators`, `/portal/mortgage-killer-v3` into the primary tools/Mortgage Killer workflow, and `/portal/time-lapse` into the broader planning workflow.

The full record is available in `audit/page_audit_results.csv`, `audit/page_audit_results.json`, and `docs/page-audit-summary.md`.

## Known Limitations and Required Owner Follow-Up

1. Complete one managed OAuth sign-in from a protected deep link, acknowledge the modeling disclosure, and visually test Dashboard, Clients, Planning Cases, Secondary Information, System Health, and one Grok page with the owner account.
2. Exercise the browser client create/edit/reload flow and confirm persisted dashboard counts in that authenticated session.
3. Review the 78 pages below 5 before approving any move, merge, or retirement. No destructive action has been taken.
4. Rotate the OpenRouter credential pasted into chat. Fund or license xAI only if direct Grok access is desired; it is not required by the application.
5. Add `RESEND_API_KEY` only if production email delivery is required.
6. Configure a verified live equity provider before SPY/QQQ are presented as current prices.
7. Continue page-level purple cleanup only after authenticated visual review distinguishes intentional finance semantics from obsolete legacy styling.

## Highest-Value Next Steps

The highest-value next action is owner-session acceptance testing, followed by execution of the audit decisions. Start with the seven Retire candidates and five Merge candidates, then promote high-scoring primary workflows and leave the remaining low-priority reference content in Secondary Information. After information architecture is approved, invest in the strongest Improve candidates rather than spreading development across all 78 low-scoring pages.
```

## `docs/internet-integrations-verification.md`

```md
# Core Internet Integrations Verification

The unified portal now routes the three highest-value advisor AI workflows—strategy generation, closing scripts, and advisor chat—through `server/portalAI.ts`. This server-only adapter calls the managed model gateway, enforces a 45-second default timeout with a 30-second closing-script limit, rejects empty model output, logs sanitized failure categories, and returns a retryable message that confirms saved data was not changed. A live readiness call succeeded through `gemini-3.5-flash-lite`; no credential or generated content was recorded.

The shared market quote API no longer creates randomized fallback prices. Bitcoin is requested from CoinGecko with a five-second timeout and payload validation. A live verification returned HTTP 200 with both USD price and 24-hour-change fields. Gold and silver use the existing data-feed service and retain `live`, `cached`, or `static` provenance. SPY and QQQ now report `unavailable` until a verified live equity source is configured rather than displaying invented values.

The shared Market Data widget now has loading, retryable failure, unavailable, source, timestamp, and reference-snapshot states. The Market Data Dashboard distinguishes live, cached, reference, loading, and unavailable sources; explains that curated equity scenarios are not live quotes; and exports the actual received CPI, Treasury, commodity, and MYGA feed snapshot immediately as CSV instead of simulating a delayed success.

Validation completed:

| Check | Result |
|---|---|
| Portal AI live readiness | Passed |
| CoinGecko live endpoint | HTTP 200; required fields present |
| AI adapter unit tests | 4 passed |
| Internet integration safeguards | 4 passed |
| Client/dashboard regression safeguards | 5 passed |
| TypeScript after AI and market changes | Passed |

The broader page audit will still identify presentation-only buttons and simulated behavior elsewhere in the 231-route application. Those pages will receive explicit usefulness and disposition recommendations rather than being silently deleted.
```

## `docs/navigation-architecture.md`

```md
# Navigation Architecture

The active portal shell uses a single left-side navigation with **primary workflow groups** and one visually distinct **Secondary Information** group. Existing sidebar capabilities—collapsible groups, subgroup counts, active-route highlighting, favorites, global search, breadcrumbs, command palette, mobile drawer behavior, client selection, and workspace selection—remain in the shared `AppShell` rather than being reimplemented per page.

The seven added client-journey pages are presented as an ordered primary workflow. The Secondary Information group links to the searchable Secondary Library, Tool Explorer, Knowledge Library, Video Library, and Patent Portfolio. Duplicate Video Library and Patent Portfolio placements were removed from Tax Secrets; their routes remain unchanged.

The Secondary Library is generated from the live router and primary navigation. It currently exposes **85 static portal routes** that are not in the primary sidebar, organized into Advanced Analysis, Reports & Documents, Reference & Education, Operations & Administration, Experience & Experimental, and Additional Tools. Every static portal route is therefore discoverable through either the primary sidebar or the Secondary Library. Dynamic detail routes remain reachable through their parent workflows.

Deterministic validation in `server/navigation-organization.test.ts` confirms that primary sidebar destinations are unique, secondary catalog entries are routable and disjoint from primary navigation, every static portal route is discoverable, and the Secondary Library includes search, filters, counts, and no-deletion guidance.
```

## `docs/page-audit-summary.md`

```md
# Unified Russell Capital Page Audit Summary

**Author:** Manus AI  
**Method:** Source-level audit of every explicit routed page in the managed unified application. Scores evaluate likely usefulness and implementation evidence; they are not a substitute for the authenticated browser smoke tests scheduled in the final validation phase.

> **Coverage:** 231 of 231 routes received an individual score and recommendation. No page was deleted.

| Measure | Result |
|---|---:|
| Average usefulness score | 5.99 / 10 |
| Pages scoring 5 or higher | 153 |
| Pages scoring below 5 | 78 |
| Source-level healthy pages | 225 |
| Source-level at-risk pages | 6 |
| Source-level broken pages | 0 |

## Disposition Recommendations

| Classification | Pages |
|---|---:|
| Keep | 83 |
| Improve | 68 |
| Move To Secondary Information | 68 |
| Retire | 7 |
| Merge | 5 |

## Implementation Evidence

| Classification | Pages |
|---|---:|
| Mixed Connected | 83 |
| Client Only | 49 |
| Database Backed | 40 |
| Prototype | 38 |
| Static Reference | 17 |
| Internet Backed | 4 |

## Category Averages

| Category | Average Score |
|---|---:|
| Administration | 6.00 |
| Ai Workflow | 6.36 |
| Analysis Calculator | 5.86 |
| Client Journey | 3.75 |
| Client Workflow | 6.38 |
| Portal Other | 5.93 |
| Public Home | 8.00 |
| Public Or Auth | 7.24 |
| Reference Education | 5.75 |
| Reports Documents | 5.44 |

## Highest-Value Pages

| Route | Score | Recommendation | Evidence |
|---|---:|---|---|
| `/administrator` | 10 | Keep | The AdministratorPortal component is a fully functional, database-backed admin dashboard with real authentication and data fetching. It provides essential site management features without relying on simulated data for its core data. |
| `/portal/dashboard` | 10 | Keep | The dashboard is highly functional and clearly database-backed, executing 10 trpc queries to fetch real metrics, planning cases, analytics, net worth, activity, top clients, allocations, goals, meetings, and coaching prompts. It uses sophisticated data formatting, filtering, and charts (Recharts) to present a comprehensive view of the practice. There are no simulated timers, random values, or placeholder terms, and it explicitly states it only shows real saved records. |
| `/portal/household-wealth` | 10 | Keep | The Household Wealth page is a complex, database-backed simulation tool utilizing tRPC for saving and loading state (`saveFactFinder`, `getFactFinder`). It models intricate real estate and financial scenarios, making it an essential, high-value workflow for users. |
| `/portal/pipeline` | 10 | Keep | The page features a fully functional pipeline with Kanban, Table, and Forecast views, drag-and-drop interactions, and deal management. It is directly backed by a robust set of tRPC endpoints for querying clients and managing pipeline deals, indicating real persistence and strong user states. |
| `/portal/planning-cases` | 10 | Keep | The page provides a complete planning workflow with real trpc queries and mutations (create, update, addNote, list, get). It features comprehensive user states including loading, error, empty states, and dynamic status updates. The metrics show 4 queries, 3 mutations, and 15 loading states, confirming a fully database-backed and robust implementation. |
| `/executive` | 9 | Keep | The page provides a clear authentication workflow for executives, calling a dedicated backend API (`/api/executive/login`) and managing session state via localStorage. It is a critical functional entry point with no obvious duplication or simulated behavior. |
| `/portal/agency-tutorial` | 9 | Keep | The page is an extensive agency tutorial with real tRPC endpoints (`trpc.tutorial.getProgress`, `trpc.tutorial.saveProgress`, `trpc.tutorial.completeSection`) and significant workflow logic for onboarding agency leaders. It has no duplicate routes and demonstrates strong, differentiated workflow. |
| `/portal/ai-slides` | 9 | Keep | The source code shows active integration with TRPC for fetching clients, remaining slide quota, and generating/saving PPTX files. The implementation is robust with proper error handling and state management, lacking any placeholder or simulation code. |
| `/portal/athene-pe-plus15` | 9 | Keep | The page is a highly complex illustration tool with 1348 lines of code, 33 charts, and 38 buttons. It uses tRPC queries, useAuth, and useClientData to fetch real data, though it also contains hardcoded strategy projection data. The lack of simulated timers and random values indicates genuine functionality. |
| `/portal/bulk-generation` | 9 | Keep | The page demonstrates robust backend connectivity via tRPC for scheduling, client data fetching, bulk operations, and exporting (PDF/CSV). It manages complex state effectively and uses realistic components, making it a highly useful tool. |
| `/portal/client-onboarding` | 9 | Keep | The page provides a comprehensive 8-step wizard for client onboarding, featuring deep interactive states, AI recommendations via tRPC mutations, and final data persistence to the database. It handles complex form state and effectively drives the primary onboarding workflow without relying on placeholder behavior. |
| `/portal/clients` | 9 | Keep | The page implements a comprehensive client management dashboard with robust features including adding clients, bulk CSV imports, tag management, and risk scoring analytics. It relies on multiple tRPC queries and mutations for real persistence and strong user states, demonstrating essential differentiated workflow without significant simulation or duplication. |
| `/portal/clients/:id` | 9 | Keep | The page is highly complex (1524 lines) and clearly database-backed, featuring 16 tRPC queries and 17 mutations for real persistence (e.g., properties, crypto holdings, risk assessment). It has comprehensive user states including 27 loading states, 30 error states, and 23 empty states, making it an essential workflow. |
| `/portal/email-campaigns` | 9 | Keep | The page has comprehensive tRPC integrations for querying campaigns, templates, and clients, as well as multiple mutations for creating, updating, and managing campaigns. It manages its own state and renders complex charts based on backend data, proving it is a database-backed, high-value page. |
| `/portal/estate-tax` | 9 | Keep | The page utilizes a tRPC query (`trpc.estateTax.calculateComprehensive.useQuery`) to calculate estate taxes, indicating backend connectivity for complex logic rather than just client-side estimation. It also integrates real user state through `useClientData()`, pulling live financial metrics to populate defaults, making it a highly useful workflow. No other routes share this component. |
| `/portal/existing-annuities` | 9 | Keep | The page implements a complex, differentiated workflow for existing annuities analysis with multiple user inputs and state management. It connects to the backend via a tRPC query (analyzeExisting) to perform institutional-grade analysis, demonstrating reliable server behavior. |
| `/portal/income-annuity-top10` | 9 | Keep | The page provides a comprehensive, interactive tool for comparing income annuities, utilizing external data (`@shared/annuityData`) and real TRPC endpoints (`clients.get`, `notes.list`, `activity.list`, `strategy.get`, `scenario.list`). It features robust charting, filtering, and data projection capabilities, indicating a high-value, functional application rather than a mere prototype. |
| `/portal/inflation` | 9 | Keep | The page is a fully featured, interactive inflation analysis tool with extensive charts and data tables. It is heavily connected to the backend, utilizing 5 tRPC queries and 2 mutations to fetch market data, user scenarios, and save new scenarios, demonstrating real persistence and high value. |
| `/portal/knowledge` | 9 | Keep | The source code uses tRPC for real backend mutations (create, upload) and queries (list), proving it is fully database-backed and not a prototype. It features complex UI interactions including file uploads, forms, and charts, making it a high-value essential workflow. |
| `/portal/meeting-agenda` | 9 | Keep | The page is a highly functional Meeting Agenda tool with 11 distinct tRPC calls, including queries for clients, meetings, team members, and templates, as well as mutations for generating, exporting, and emailing agendas. The 1396-line component includes analytics, history, setup, and template tabs, indicating a well-developed, database-backed feature set. |
| `/portal/meetings` | 9 | Keep | The Meetings component is a comprehensive, database-backed page with 679 lines of code. It heavily utilizes tRPC for data fetching (3 queries) and mutations (4 mutations), with strong state management and analytics (13 charts). There are no simulated timers or random values, indicating real server behavior. |
| `/portal/mortgage-killer` | 9 | Keep | The page has a substantial amount of code (3161 lines) and uses tRPC for both queries (e.g., fetching clients and scenarios) and mutations (e.g., saving scenarios, uploading statements, and analyzing). This indicates it is a robust, database-backed implementation. |
| `/portal/onboarding` | 9 | Keep | The page implements a comprehensive 7-step client onboarding wizard that is database-backed, connecting to tRPC mutations (clients.create, onboardingWizardV2.getRecommendation) and queries (lifeGoals.getSuggestions). It has real persistence and robust user state management. The route shares its source component with '/onboarding' and '/portal/welcome', which serve as legitimate aliases for the same workflow. |
| `/portal/premium-financing` | 9 | Keep | The page is a robust, interactive financial projection tool with comprehensive data visualization and integrations. It relies on multiple TRPC queries and mutations, features dynamic calculation models like Monte Carlo simulations, and has no significant duplicate routes. |
| `/portal/retirement-guardrails` | 9 | Keep | The page provides a comprehensive retirement guardrails simulation that is fully database-backed, leveraging real client data, market data, risk profiles, and tax rates via tRPC. It includes complex charting and data visualization without significant duplication or mock data reliance. |

## Pages Scoring Below Five

| Route | Score | Recommendation | Merge Target | Required Action |
|---|---:|---|---|---|
| `/portal/ai-meeting-notes` | 2 | Retire | `` | Retire the page after owner approval as it contains no real functionality. The page consists of hardcoded chart data, hundreds of filler lines, and placeholder buttons that only log to the console. |
| `/portal/avatar-twins` | 2 | Move to Secondary Information | `` | Move this novelty avatar generator feature to Secondary Information since it provides no core financial utility and uses hardcoded toasts instead of actual API integration. Ensure it does not distract from main application workflows. |
| `/portal/advisor-directory` | 3 | Move to Secondary Information | `` | Move this page to Secondary Information since it is heavily presentation-focused and relies entirely on hardcoded state and mock data. Remove unused tRPC hooks to clean up the component. |
| `/portal/arena` | 3 | Move to Secondary Information | `` | Move this page to Secondary Information as it is primarily a presentation-heavy prototype with simulated gamification mechanics. Require owner approval before deciding whether to retire it or invest in fully backing the gamification engine with real data. |
| `/portal/batch-illustration` | 3 | Move to Secondary Information | `` | Move this heavy prototype to Secondary Information since it lacks real backend integration. If batch illustration is a core feature, implement real tRPC mutations and connect the UI to actual server data instead of simulated processing. |
| `/portal/batch-slides` | 3 | Move to Secondary Information | `` | Remove the massive blocks of dummy variables and hardcoded static data. Implement real backend integrations for the statistics and presentation generation before considering this for production. |
| `/portal/black-mirror` | 3 | Move to Secondary Information | `` | Move this gamified presentation layer to Secondary Information or a sandbox environment. If real integration is desired, connect the phantom clients and dream journal to actual CRM data and AI pipelines. |
| `/portal/collaborative-planning` | 3 | Move to Secondary Information | `/portal/dashboard` | Merge the collaborative planning workflow into the main client dashboard or retire if it's just a mockup. The page currently relies on hardcoded data arrays and local state mutations, making it non-functional for real multi-advisor collaboration. |
| `/portal/command-center` | 3 | Retire | `` | Retire the page as it relies heavily on mock data and simulated timers for its numerous charts, providing no real operational value. If the layout is needed for future development, move it to secondary information. |
| `/portal/commission-tracker` | 3 | Move to Secondary Information | `` | Move to Secondary Information as this is a static marketing or presentation page. Remove unused tRPC hooks and consider if this content belongs in a CMS or presentation deck instead of a functional route. |
| `/portal/data-query` | 3 | Move to Secondary Information | `` | The page's natural language querying is entirely simulated with regex rules on client-side data, and heavily relies on hardcoded patterns and random confidence scores. It should be moved to Secondary Information until a real backend NLP service is implemented. |
| `/portal/document-templates` | 3 | Keep | `` | Connect the disabled tRPC queries to the backend to fetch real templates. Replace the hardcoded TEMPLATES array and local state modifications with actual database mutations for saving, starring, and AI generation. |
| `/portal/education` | 3 | Move to Secondary Information | `` | Remove unused tRPC queries and redundant state variables. Consolidate the duplicate charts into a single visualization or remove them if unnecessary, and consider migrating the hardcoded content to a database or moving the page to a static resource section. |
| `/portal/estate-document-gen` | 3 | Move to Secondary Information | `` | Since the page merely generates static text drafts with hardcoded placeholders on the client side, it should be moved to Secondary Information to avoid misleading users into thinking it performs actual server-side legal document generation. Remove the PRO badge and explicitly label it as a static template viewer. |
| `/portal/lead-generator` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information since it relies on simulated data generation with Math.random() and setTimeout. Remove or document the disabled tRPC queries to prevent confusion. |
| `/portal/medicare-irmaa` | 3 | Move to Secondary Information | `` | Remove the dummy padding lines and hardcoded API status tables. Merge the core calculator functionality into a more robust financial planning tool, or move it to Secondary Information if it remains a standalone prototype. |
| `/portal/monitoring-agreement` | 3 | Retire | `` | Retire the page and move its agreement signing functionality to a modal or a settings section within the user profile. The extensive chart rendering and simulated data should be removed as they are unnecessary for a legal agreement page. |
| `/portal/my-world` | 3 | Retire | `` | Retire the page since it is an unused, static prototype that offers no real value. The backend hooks are present but completely ignored in the rendering logic. |
| `/portal/nerve-center` | 3 | Retire | `` | Retire this prototype after owner approval, as it serves as a presentation-heavy mockup rather than a functional workflow. Any genuine gamification logic should be extracted into core reusable components. |
| `/portal/patent-showcase` | 3 | Move to Secondary Information | `` | Move this page out of the core portal navigation into a secondary marketing or legal section. The content is static and serves as an educational reference rather than a functional tool. |
| `/portal/predictive-analytics` | 3 | Move to Secondary Information | `` | Connect the tRPC queries to actually populate the client profile and scenario data instead of using hardcoded defaults. Remove unused tRPC queries or implement their corresponding UI sections. |
| `/portal/referral-tracking` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information as it relies purely on mock data and simulated actions. A complete backend implementation with real database mutations is required before it can be useful. |
| `/portal/rewards` | 3 | Retire | `` | Retire the page after owner approval, as it is mostly a static prototype. If kept, it requires a full backend implementation for shop items, collections, and prestige tracking. |
| `/portal/secret-secrets/:id` | 3 | Retire | `` | Retire the page after owner approval, as it relies on hardcoded JSON data and provides no real user persistence or backend connectivity. If the calculators are deemed valuable, extract them into a shared utility or a secondary reference section. |
| `/portal/seminar-generator` | 3 | Move to Secondary Information | `` | This page is a heavily mocked, static prototype disguised as a functional tool. It should be moved to Secondary Information until actual backend persistence and data flow are implemented. |
| `/portal/social` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information or a prototype archive. Replace hardcoded social features with real backend implementations or retire the page if actual social networking is not a planned product capability. |
| `/portal/story-generator` | 3 | Move to Secondary Information | `` | Move this page to Secondary Information since it is a prototype that simulates AI generation with hardcoded strings and a timer. It can be revisited if actual AI integration is planned. |
| `/portal/the-arrival` | 3 | Move to Secondary Information | `` | Move to Secondary Information or retire after owner approval since it is a pure frontend prototype with hardcoded steps and no real backend persistence yet. Alternatively, implement the planned tRPC mutations for `tutorial_progress` and `advisor_goals` to make it database-backed. |
| `/portal/the-legacy` | 3 | Move to Secondary Information | `` | Move to secondary information or retire after owner approval. The page currently has no backend functionality and only serves as a visual prototype. |
| `/portal/the-map` | 3 | Move to Secondary Information | `` | Move this calculator to Secondary Information until actual persistence and dynamic base values are implemented. Alternatively, integrate it as a widget within the main dashboard. |
| `/portal/workflow-automations` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information since it is a pure client-side simulation. Remove the unused tRPC hooks and consider migrating the static logic to a real backend if this feature is prioritized. |
| `/portal/advisor-training` | 4 | Move to Secondary Information | `` | Move this training module prototype to Secondary Information since it is mostly a static, hardcoded demonstration. Alternatively, connect the quiz progress, scores, and certification status to a real backend database to make it a fully functional training portal. |
| `/portal/advisory-summary` | 4 | Move to Secondary Information | `` | Remove unused tRPC queries and move the page to a secondary information section or documentation portal. Ensure the static data is maintained if it serves as a reference. |
| `/portal/audit-timeline` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information since it is heavily reliant on simulated data and incomplete UI. Remove it from primary navigation. |
| `/portal/axonic-sp500` | 4 | Move to Secondary Information | `` | Move this static calculator to Secondary Information or a prototype directory until it can be connected to real, dynamic annuity data. Remove the unused tRPC hooks and dummy row generators. |
| `/portal/beneficiary-optimization` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information or retire it. If retained, replace the hardcoded `generateAccounts` and client-side simulations with actual backend data and persistence. |
| `/portal/business-owner` | 4 | Move to Secondary Information | `` | Move this page to a secondary tools menu or sandbox area. Remove unused TRPC query declarations and replace hardcoded arrays with real data fetches if it is to be fully integrated. |
| `/portal/client-intake` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information since it is a static prototype with simulated interactions. Before retiring or refactoring, owner approval is required to confirm if the complex UI layout should be preserved for a future real implementation. |
| `/portal/client-intake-recommender` | 4 | Merge | `/portal/combo-recommender` | Merge the two duplicate routes into a single recommender page. Ensure the unified page clarifies the scope of the static data used for recommendations. |
| `/portal/client-onboarding-auto` | 4 | Merge | `/portal/client-onboarding` | Convert hardcoded mock data (PIPELINE_DATA, COMPLIANCE_ALERTS, etc.) and simulated actions (handleRefresh, handleSubmit) to use actual tRPC mutations and backend queries. Since this appears to be a prototype dashboard, merge it into the main client onboarding flow or retire it if it's purely a conceptual mockup. |
| `/portal/client-portal-config` | 4 | Move to Secondary Information | `` | Move the static presentation code to Secondary Information for reference. Replace this route with a fully connected version using the actual tRPC queries and mutations. |
| `/portal/combo-recommender` | 4 | Move to Secondary Information | `` | Move this client-side prototype to Secondary Information since it relies entirely on static JSON files and local state. Consider integrating it with the backend database to provide real recommendations. |
| `/portal/competitive` | 4 | Merge | `/portal/calculators` | Merge the competitive analysis visualizations and calculators into the primary calculator tools page to consolidate redundant tools. Extract the hardcoded carrier data to the backend. |
| `/portal/compliance-audit-trail` | 4 | Improve | `` | Remove client-side mock data generation and fully integrate the table with real backend data via tRPC. Enhance the error handling and loading states to reflect actual API responses. |
| `/portal/compliance-monitoring` | 4 | Improve | `` | Replace the `generateComplianceItems` mock array with a TRPC query that fetches real compliance items from the database. Implement the corresponding TRPC mutations for the actions currently triggering dummy toasts (e.g., marking items resolved, updating settings, creating policies). |
| `/portal/daily-discovery` | 4 | Move to Secondary Information | `/portal/dashboard` | This page should be moved to Secondary Information or merged into a gamification/dashboard hub because its core "discovery" features are simulated via hardcoded arrays, despite having some live database connections for profile check-ins and client aggregates. The hardcoded insights and gamified streaks reduce its utility as a standalone core workflow. |
| `/portal/ecological-drivers` | 4 | Move to Secondary Information | `` | Remove the unused tRPC hooks and move this static presentation page to a secondary information or reference section. Alternatively, bind the real data from the hooks to make it a functional dashboard. |
| `/portal/enterprise` | 4 | Improve | `` | Replace the simulated data in the System Health and Feature Flags tabs with actual backend endpoints. If these features are not yet supported by the backend, remove them to prevent misleading users. |
| `/portal/fia-top10` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information since it is primarily a presentation-heavy calculator with simulated interactions. The core calculations and scenarios should be integrated into a unified financial planning view rather than existing as a standalone interactive prototype. |
| `/portal/index-backtester` | 4 | Improve | `` | Connect the charts and tables to real backend data via tRPC. Remove hardcoded mock data. |
| `/portal/index-strategies` | 4 | Move to Secondary Information | `` | Move the component and its complex hardcoded calculators out of the primary application routes into a secondary documentation or reference section. Remove the unused tRPC hooks and empty mutations before moving. |
| `/portal/integrations` | 4 | Improve | `` | Remove simulated random data and hardcoded states, and replace with actual backend integration. Connect the configuration forms to actual mutation endpoints. |
| `/portal/legal-payment-folder` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information until real backend mutations and actual metric data replace the dummy widgets and simulated charts. |
| `/portal/mortgage-killer-v3` | 4 | Merge | `/portal/tools` | Merge this client-only calculator into the main portal dashboard or tools section to consolidate financial simulators. Ensure any shared components are properly abstracted. |
| `/portal/multi-gen-wealth` | 4 | Move to Secondary Information | `` | Move the page to Secondary Information pending owner review. Replace the simulated Monte Carlo timer and hardcoded data generators with actual backend calculation endpoints before promoting it to a primary workflow. |
| `/portal/physicians-edge` | 4 | Move to Secondary Information | `` | Since this page is a static presentation with hardcoded data and no real calculations, it should be moved to Secondary Information or merged into a marketing page. It does not perform the 248-calculator functions it advertises. |
| `/portal/policy-review-checklist` | 4 | Move to Secondary Information | `` | Move to Secondary Information or merge into a real policy review workflow. The page has extensive hardcoded data and client-side only state, with unused tRPC queries. |
| `/portal/portfolio-drift` | 4 | Move to Secondary Information | `` | Connect the component to actual backend endpoints to fetch real portfolio and market data. Remove the simulated random drift generation and rely on actual live metrics before moving it back to primary navigation. |
| `/portal/presentation-builder` | 4 | Move to Secondary Information | `` | This is a heavy client-side UI with complex local state (slides array, drag/drop sorting, auto-populate logic) but no actual backend persistence for the presentations created. The data tab claims integration but only has placeholder edit buttons. Move to secondary information or retire if a real presentation builder isn't planned, as this is essentially a static prototype. |
| `/portal/revenue-guarantee` | 4 | Move to Secondary Information | `` | Move this marketing-heavy page to a secondary information section or landing page. It is largely a static promotional calculator and lacks deep backend persistence despite having a hook. |
| `/portal/sales-story` | 4 | Move to Secondary Information | `` | Complete the remaining presentation templates and implement the simulation logic. Add proper loading and error states for the tRPC queries to ensure reliable rendering. |
| `/portal/scenario-play` | 4 | Move to Secondary Information | `` | Move to Secondary Information or retire after owner approval since it relies entirely on hardcoded scenarios and math without server persistence or meaningful state management. If keeping, consider integrating with backend scenario storage. |
| `/portal/secret-secrets` | 4 | Move to Secondary Information | `` | The page renders purely static JSON content from @/data/strategies.json without backend integration or interactivity beyond local filtering. It should be moved to Secondary Information or merged into a knowledge base since it serves as an educational reference. |
| `/portal/slack` | 4 | Move to Secondary Information | `` | Move to Secondary Information as it is a presentation-heavy prototype with extensive hardcoded mock data. Consider merging useful real integration parts if they exist, but the current page is mostly simulated. |
| `/portal/stale-digest` | 4 | Move to Secondary Information | `` | Remove client-side data simulation and wire the table and charts directly to real backend data. If the backend cannot support these metrics, the page should be moved to Secondary Information until real data is available. |
| `/portal/str-strategy` | 4 | Move to Secondary Information | `` | Move the component to a secondary tools section if the business wants to keep it as an educational calculator. If persistence is needed, wire the inputs and generated projections to the database. |
| `/portal/strategy-compare` | 4 | Move to Secondary Information | `` | Move this static client-side comparison tool to Secondary Information since it lacks backend integration and relies entirely on local JSON files. Wait for owner approval before retiring or moving. |
| `/portal/succession-planning` | 4 | Move to Secondary Information | `` | Move the succession planning wizard to Secondary Information pending a complete backend integration of the valuation logic. Fix the render risks by ensuring string replacements are only called on valid non-empty strings, and clean up the dead code. |
| `/portal/tax-combos/:id` | 4 | Move to Secondary Information | `` | The page is a highly static, data-driven prototype with simulated calculators and hardcoded data references. Move it to Secondary Information or convert it into a fully connected, database-backed workflow. |
| `/portal/tax-loss-harvesting` | 4 | Move to Secondary Information | `` | The page relies entirely on hardcoded sample holdings and a mocked execution function. The tRPC queries are mostly disabled and unused. It should be moved to secondary information or retired until backend integration and actual execution logic are implemented. |
| `/portal/the-field` | 4 | Move to Secondary Information | `` | Move to Secondary Information as it is an unintegrated prototype. Ensure owner approval before moving. |
| `/portal/the-mirror` | 4 | Improve | `` | Replace the hardcoded seed data (DOMAINS, GOALS, MEMORY) with actual tRPC reads and mutations to make the dashboard functional. Connect the somatic check-in state to persistent storage. |
| `/portal/the-strategy-table` | 4 | Move to Secondary Information | `` | Move to secondary information or prototype gallery unless backend calculation and saving logic is wired up. The 'calculation_audit_logs' saving is purely client-side state ('setSaved(true)') without real persistence. |
| `/portal/time-lapse` | 4 | Move to Secondary Information | `/portal/planning` | This page should be moved to Secondary Information or merged with a broader planning module. The data visualization is mostly client-side simulation, though it connects to the client list via tRPC. |
| `/portal/toilet` | 4 | Move to Secondary Information | `/portal/dashboard` | Move this novelty dashboard to a secondary Easter egg section or retire it entirely if not actively used. If kept, consider merging its scannable mobile-friendly view into the main dashboard's responsive layout. |
| `/portal/video-library` | 4 | Move to Secondary Information | `` | Move this static video library to a secondary information section like a resources hub. It contains hardcoded video data and static content without backend integration. |
| `/portal/war-story-generator` | 4 | Move to Secondary Information | `` | Move this prototype page to Secondary Information until the 'Hall of Fame' and statistics features are connected to a real database. The AI generation endpoint is functional but the surrounding application shell is mostly simulated data. |
| `/support` | 4 | Move to Secondary Information | `` | Move this static content to a secondary information section such as a help center modal or footer link. |

## Interpretation and Limits

The audit intentionally keeps all routes. A **Retire** recommendation means the page should remain until the owner approves removal after reviewing usage and authenticated runtime evidence. A **Move to Secondary Information** recommendation means the route remains active but should not compete with primary advisor workflows. A **Merge** recommendation identifies an overlapping destination that can absorb the unique useful material after content and data contracts are reconciled.

Scores rely on route source, interaction hooks, state handling, duplicate-source evidence, and detected integration patterns. Final validation added TypeScript, a zero-failure deterministic test suite, a successful production build, 231 production route requests, desktop and mobile public-page checks, managed-auth route checks, module loading, and runtime-log review. Post-disclosure authenticated page-content verification remains an owner-session acceptance test and is documented in the implementation audit.
```

## `docs/primary-port-verification.md`

```md
# Primary Platform Port Verification

The complete 222-route primary platform was imported from the verified release copy while the managed server core, client authentication hook, project metadata, analytics configuration, and runtime public assets were retained. The imported dependency graph was reconciled without replacing managed package scripts or infrastructure versions.

The managed OAuth state codec and one-time nonce protection were restored. The `/login` page and every gated portal route now initiate managed OAuth; the OAuth state carries a validated internal return path so users return to the requested portal page. Legacy password registration, password login, reset procedures, trial passwords, eternal backdoors, owner-email bypasses, local-storage owner markers, and the hidden-material default password were retired. Hidden material now requires the server-side admin procedure.

The authoritative managed `server/storage.ts` helper was restored byte-for-byte from the current full-stack template after the source import was found to use a different storage protocol. The managed database accepted `SELECT 1 AS managed_database_ok`, confirming connectivity before any schema migration. Managed analytics placeholders remain in `client/index.html`, and `client/public/__manus__/debug-collector.js` plus `version.json` remain present.

Validation completed:

| Check | Result |
|---|---|
| Primary route declarations | 222 preserved |
| TypeScript after import and auth conversion | Passed |
| Managed server startup | Passed on port 3000 |
| Managed database connectivity | Passed |
| Managed storage helper integrity | Restored from current template |
| Managed analytics/runtime assets | Present |
| Targeted Vitest safeguards | 6 of 6 passed |

The deterministic safeguards are stored in `server/managed-port.smoke.test.ts`.

Route-level browser verification also passed for `/login`, `/register`, and the protected deep link `/portal/dashboard`. The login and retired-auth guidance pages render the purple managed-identity interface, while the protected dashboard deep link renders `ManagedAuthGuard` with its secure sign-in action and preserved return path rather than exposing portal content or a legacy gate.
```

## `docs/source-inventory-matrix.md`

```md
# Source Inventory Matrix

| Category | Primary platform | Grok addition snapshot |
|---|---:|---:|
| Files | 744 | 1347 |
| Manifests/tooling files | 5 | 5 |
| Lockfiles | 0 | 1 |
| Runtime entrypoints | 4 | 4 |
| Referenced environment variables | 17 | 16 |
| Database schema files | 2 | 2 |
| Migrations | 58 | 62 |
| Tests | 90 | 98 |
| Explicit routes | 222 | 653 |
| Unique routes | 222 | 612 |
| Local static assets | 0 | 0 |
| Credential-risk locations | 30 | 64 |

The JSON file accompanying this report contains the exact file and route lists. Credential-risk findings record only file locations and pattern categories; no detected value is copied into the audit.
```

## `docs/source-manifest.md`

```md
# Russell Capital Unified Source Manifest

**Audit date:** 2026-08-26  
**Purpose:** Establish immutable source identities and the verified application boundary before any managed-project import.

| Role | Uploaded archive | Exact size | SHA-256 | Status |
|---|---|---:|---|---|
| Primary source | `russell-capital-solutions-complete(4).zip` | 41,782,994 bytes | `e2d3ecaff235fd6ddf933d2f2634c2e0e956a6a21f0b787ed859a90a40e5ba27` | Frozen read-only |
| Additional pages | `Russell_Capital_FULL_SITE_GROK_JSON.zip` | 7,331,308 bytes | `d254351fe8927dcf4858c525b34ea856e403db4a47adc40037414b53a0eacca8` | Frozen read-only |

The latest `(4)` primary upload is byte-for-byte identical to the earlier `russell-capital-solutions-complete.zip`, so the latest filename is used while preserving a single canonical content identity. The primary archive contains two applications. The correct full platform is the directory named `russell-capital`; the directory named `russell-capital-solutions` is the much smaller marketing application and is retained only as reference material.

| Primary platform metric | Verified value |
|---|---:|
| Files | 744 |
| Explicit routed pages | 222 |
| TSX page modules | 260 |
| Vitest files | 90 |
| SQL migration files | 58 |
| Bundled local media files | 0 |
| Root lockfiles | 0 |

The primary platform is a React 19, TypeScript, Vite, Express, tRPC, Drizzle/MySQL application with managed authentication, storage helpers, PDF and PowerPoint generation libraries, spreadsheet export, email, Stripe dependencies, and an extensive test suite. Its archive was inventoried without executing bundled scripts.

## Additional-page delta

The Grok archive is a JSON-wrapped snapshot whose reconstructed source differs from the related large source build by eight modules: seven routed page components and one shared visual kit.

| Added route module | Shared dependency |
|---|---|
| `TheArrival.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheMirror.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheStrategyTable.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheField.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheMap.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheLegacy.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheBrotherhood.tsx` | `portal/_genome/GenomeKit.tsx` |

## Import and security rules

The uploaded ZIPs remain untouched under `/home/ubuntu/russell-capital-unified-sources/archives`. Code is imported only from extracted reference copies. No archive-provided environment file, embedded credential, dependency directory, database, or runtime process is trusted automatically. The managed project’s OAuth, database connection, storage, analytics, and secret injection remain authoritative. All direct-provider keys are server-side only, and no API key is permitted in browser bundles, route source, logs, or audit exports.

## Verified release-copy workspace

The import source is separated from both the immutable archive files and their broad extraction directories. The verified primary release is located at `/home/ubuntu/russell-capital-unified-sources/release/primary` and contains the complete 744-file `russell-capital` platform selected from the primary archive. The verified addition release is located at `/home/ubuntu/russell-capital-unified-sources/release/addition` and contains only the eight source modules proven to be additive: the seven Sacred Seven page components and their shared `GenomeKit.tsx` component.

The eight-file addition release is intentionally a delta rather than another complete application. The untouched Grok archive remains the authoritative raw source, and `/home/ubuntu/work/grok_render` is the reconstructed full snapshot used for route, test, migration, and credential-risk inventory. Restricting the canonical import release to the eight verified additive modules prevents older or conflicting framework, database, authentication, and server files from overwriting the selected primary platform.

The source application has no bundled media files, so the existing homepage’s city asset is an external reference rather than a deploy-blocking local file. Any retained external media will be verified and moved to persistent project asset storage before the final checkpoint.
```

## `docs/visual-system-verification.md`

```md
# Visual System Verification

The public homepage now uses a persistent 4181×2793 city-at-night image stored at `/manus-storage/russell-capital-city-night_0cb0b970.jpeg`. Layered dark masks, emerald color blending, radial green illumination, and text shadows preserve readability while delivering the requested illuminated skyline appearance. The previous external CloudFront URL, which rendered as a blank background in the managed preview, has been removed.

Portal interiors are wrapped by `.rc-portal-theme`, which scopes Grok-inspired violet tokens, dark plum surfaces, purple gradients, focus rings, active sidebar states, card borders, buttons, mobile tabs, scrollbars, and background texture to `AppShell`. The public homepage remains outside this class and retains the black, navy, and emerald identity.

Desktop browser verification passed for `/` and `/login`. Deterministic validation in `server/design-system.test.ts` confirms the persistent hero asset, emerald illumination, scoped purple theme, and separation between public and portal palettes.
```

## `docs/visual-validation.md`

```md
# Visual Validation

Desktop full-page verification was completed at 1440×1200 after the final production build.

| Route | Result |
|---|---|
| `/` | Passed. The high-resolution city-at-night skyline is visible beneath dark navy masks and emerald illumination; navigation, hero, feature, pricing, consultation, CTA, and footer sections remain readable. |
| `/login` | Passed. The managed OAuth page uses the intended dark purple split layout, clear sign-in action, retired-password explanation, and return-home link. |
| `/portal/planning-cases` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |
| `/portal/secondary-information` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |
| `/portal/system-health` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |
| `/portal/the-map` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |

The first screenshot pass exposed a global onboarding tour obscuring public and deep-link pages. `OnboardingTour` is now limited to authenticated `/portal/dashboard`, and a regression test enforces that scope. The second pass confirmed the public homepage and login page are unobstructed.

The remaining portal screenshots stop at the existing **Historical Index Modeling & Disclosure Center**, which requires an explicit user acknowledgment. The validation process did not accept legal terms or bypass the acknowledgment on the user’s behalf. Authenticated post-acknowledgment visual checks remain an owner-session follow-up; source-level module loading, routing, TypeScript, and automated safeguards pass for these pages.

Mobile full-page verification at 390×844 passed for `/` and `/login`. The homepage collapses into a single-column hero, metrics, portal-access form, feature cards, pricing cards, consultation panel, CTA, and footer without horizontal overflow. The managed sign-in card remains centered and readable with a full-width purple action.

Desktop verification at 1280×900 passed for `/login`, `/register`, `/forgot-password`, `/reset-password`, and `/trial`. Each route now presents a consistent dark-purple managed-identity page, explicitly explains that local password or trial-code access has been retired, and provides one secure sign-in action plus a homepage escape route.
```

## `live/README.md`

```md
# Live homepage (published)

**Live URL:** https://claude.ai/code/artifact/da0f1702-4b60-4091-8643-344b898b1555

A self-contained, single-file version of the Russell Capital Systems public
homepage, published as a live web page and kept identical in content to the
React app's homepage (`client/src/pages/Landing.tsx`).

## The page, screen by screen

Every one of the owner's six design images is shown **crisp, full-size, one per
screen** — nothing is blurred.

1. **Neon sign (hero)** — its words are the headline: *Financial & Tax Relief and
   Recovery for Physicians, Psychiatrists, & Surgeons*
2. **The Green City (Emerald Dawn)** — *Transform Debt Into a Tax-Free Liquid War
   Chest — On Demand™* with the line "You bring the goal. We build the tailored
   Systems around that."
3. **The bridge (Concept 10)** — *Your Practice Builds Income. We Build the System
   Around It.* + the five pillars
4. **The canyon (Concept 06)** — Tax Strategy for High-Earning Physicians + the
   tax-planning selector
5. **The interchange (Concept 25)** — Russell Capital Systems for Physicians /
   Turn Medical Income Into Lasting Wealth™ + the design-your-system selector
6. **Second neon sign** — the 60% / 20-year client-retention proof
7. Ask AI concierge · Tax & Savings Estimate (lead capture) · **the 14 engines**
   (five to six sentences each, in building order) · How We Work / Who We Serve /
   Planning Areas / FAQ · neon closing with booking

## Files

- `rcs-live-homepage.template.html` — **the source.** Placeholders injected at
  build time: `__IMG_NEON_A__`, `__IMG_NEON_B__`, `__IMG_EMERALD__`, `__IMG_BRIDGE__`,
  `__IMG_CANYON__`, `__IMG_INTERCHANGE__`, `__CALENDLY__`, `__ADVISOR_EMAIL__`.
- `build_live_homepage.py` — builds the template into the **single built copy**,
  `<repo>/docs/index.html` (~3.8 MB, six images embedded as WebP data URIs).
  `docs/` is what GitHub Pages serves, so merging to `master` updates the public
  URL. Run it directly or via `pnpm live:build` / `pnpm release`.
- The image sources live in `../client/public/` as `rcs-neon-a.webp`, `rcs-neon-b.webp`,
  `rcs-city-emerald.webp`, `rcs-city-bridge.webp`, `rcs-city-canyon.webp`,
  `rcs-city-interchange.webp` — crisp crops of the photographic regions of the
  original mockups (their baked-in UI excluded), saved at high quality.

## Keeping it in step with the React app

`server/livePageParity.test.ts` fails if the template and the React homepage
disagree on the 14 engines (names and order), the FAQ, the headline promises and
proof numbers, the six images, or if `docs/index.html` is stale relative to the
template. Edit the template and the React component together, then `pnpm release`.

## How it works without a server

- **AI concierge** uses the viewer's own Claude (the page's `sample` capability)
  for signed-in claude.ai viewers; for anyone else it falls back to sending the
  question to the advisor by email. It never reveals figures or formulas.
- **Lead capture** composes a pre-filled email to the advisor (nothing leaves the
  page until the visitor sends it), offers "Copy my summary", and links to
  Calendly booking.
- No secrets are embedded. No figures are shown to visitors (qualitative teaser only).

This is the live landing page. The full app (portal, lead inbox, nine-AI panel,
database) deploys per `../LAUNCH.md`.
```

## `live/build_live_homepage.py`

```python
#!/usr/bin/env python3
"""Build the single-file public homepage from its template.

Injects the six WebP images from ../client/public as data URIs plus the
booking link and advisor email, and writes the result to <repo>/docs/index.html
(served by GitHub Pages) so there is exactly one built copy in the repo.

    python3 live/build_live_homepage.py            # writes ../../docs/index.html
    python3 live/build_live_homepage.py out.html   # writes somewhere else
"""
import base64, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent          # russell-capital-systems/live
APP = HERE.parent                                        # russell-capital-systems
REPO = APP.parent                                        # repo root
PUB = APP / "client" / "public"
DEFAULT_OUT = REPO / "docs" / "index.html"

IMAGES = {
    "__IMG_NEON_A__": "rcs-neon-a.webp",
    "__IMG_NEON_B__": "rcs-neon-b.webp",
    "__IMG_EMERALD__": "rcs-city-emerald.webp",
    "__IMG_BRIDGE__": "rcs-city-bridge.webp",
    "__IMG_CANYON__": "rcs-city-canyon.webp",
    "__IMG_INTERCHANGE__": "rcs-city-interchange.webp",
}
CONSTS = {
    "__CALENDLY__": "https://calendly.com/samtheinsuranceman-1/30min",
    "__ADVISOR_EMAIL__": "samtheinsuranceman@gmail.com",
}


def build() -> str:
    html = (HERE / "rcs-live-homepage.template.html").read_text()
    for key, name in IMAGES.items():
        data = (PUB / name).read_bytes()
        uri = "data:image/webp;base64," + base64.b64encode(data).decode()
        assert key in html, f"placeholder missing: {key}"
        html = html.replace(key, uri)
    for key, val in CONSTS.items():
        html = html.replace(key, val)
    leftover = [k for k in list(IMAGES) + list(CONSTS) if k in html]
    assert not leftover, leftover
    return html


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_OUT
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build())
    print(f"wrote {out} ({out.stat().st_size:,} bytes)")
```

## `live/rcs-live-homepage.template.html`

```html
<title>Russell Capital Systems</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&family=Cormorant+Garamond:wght@600;700&display=swap">
<style>
  :root{
    --ground:#03090a; --panel:#00110d; --ink:#eaf5ef; --ink-2:rgba(255,255,255,.8); --muted:rgba(255,255,255,.6); --faint:rgba(255,255,255,.42);
    --em-200:#a7f3d0; --em-300:#6ee7b7; --em-400:#34d399; --em-500:#10b981;
    --line:rgba(110,231,183,.22); --line-2:rgba(110,231,183,.45);
    --amber:#fbbf24; --amber-ink:#fde68a; --danger:#f87171;
    --glow:0 0 22px rgba(52,211,153,.9),0 0 46px rgba(16,185,129,.5); --glow-soft:0 0 30px rgba(16,185,129,.45);
    --display:"DM Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    --serif:"Cormorant Garamond",Georgia,"Times New Roman",serif;
    --max:1240px;
  }
  *{box-sizing:border-box}
  [hidden]{display:none!important}
  [id]{scroll-margin-top:6rem}
  html{scroll-behavior:smooth}
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto} *{animation:none!important;transition:none!important}}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--display);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  a{color:inherit} h1,h2,h3{margin:0;text-wrap:balance;line-height:1.08} p{margin:0}
  .wrap{position:relative;z-index:2;width:min(var(--max),100% - 2.5rem);margin-inline:auto}
  .eyebrow{display:inline-flex;align-items:center;gap:.5rem;border:1px solid var(--line-2);background:rgba(3,15,12,.55);color:var(--em-300);border-radius:999px;padding:.45rem 1.05rem;font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;backdrop-filter:blur(6px)}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;border-radius:14px;padding:1rem 1.7rem;font:inherit;font-weight:700;font-size:1rem;cursor:pointer;text-decoration:none;border:1px solid transparent;transition:transform .2s,box-shadow .2s,background .2s}
  .btn:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--em-400);outline-offset:2px}
  .btn-primary{background:linear-gradient(135deg,#34d399,#059669);color:#03110c;box-shadow:0 0 0 1px rgba(167,243,208,.35),0 18px 48px rgba(16,185,129,.35)}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 0 1px rgba(167,243,208,.5),0 24px 60px rgba(16,185,129,.45)}
  .btn-ghost{background:rgba(3,15,12,.5);border-color:var(--line-2);color:#fff;backdrop-filter:blur(8px)}
  .btn-ghost:hover{background:rgba(52,211,153,.14)}
  .btn[disabled]{opacity:.5;cursor:not-allowed;transform:none}
  .glass{border:1px solid rgba(167,243,208,.32);background:rgba(2,12,10,.66);backdrop-filter:blur(14px);border-radius:26px;box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 0 40px rgba(16,185,129,.05)}
  .neon{color:var(--em-300);text-shadow:var(--glow)}
  .grad{background:linear-gradient(95deg,#fff 0%,#bbf7d0 48%,#34d399 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  .h-display{font-family:var(--display);font-weight:900;letter-spacing:-.02em;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.8),0 0 40px rgba(16,185,129,.35)}
  .sub{max-width:40rem;font-size:1.15rem;line-height:1.6;color:rgba(255,255,255,.88);text-shadow:0 4px 18px rgba(0,0,0,.9)}
  .sub b{color:var(--em-300);font-weight:600}
  .ctas{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:2rem}

  /* ── PAGES: one crisp image per screen ─────────────────────────────────── */
  .page{position:relative;isolation:isolate;overflow:hidden;min-height:100svh;display:flex;align-items:center;background:var(--ground)}
  .pic{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:0}
  .shade{position:absolute;inset:0;z-index:1;pointer-events:none}
  .shade-b{background:linear-gradient(180deg,rgba(3,9,10,.15) 0%,rgba(3,9,10,0) 35%,rgba(3,9,10,.55) 78%,#03090a 100%)}
  .shade-l{background:linear-gradient(90deg,rgba(3,9,10,.9) 0%,rgba(3,9,10,.6) 38%,rgba(3,9,10,.05) 70%)}
  .shade-r{background:linear-gradient(270deg,rgba(3,9,10,.9) 0%,rgba(3,9,10,.6) 38%,rgba(3,9,10,.05) 70%)}
  .shade-c{background:radial-gradient(ellipse at 50% 55%,rgba(3,9,10,.72) 0%,rgba(3,9,10,.35) 45%,rgba(3,9,10,.1) 75%)}
  .page .wrap{padding:7rem 0 5rem}
  /* split page: crisp portrait image on one side, words on the other */
  .split{display:grid;gap:2.5rem;align-items:center}
  @media(min-width:900px){.split{grid-template-columns:1fr 1fr;gap:4rem}.split.rev>.photo{order:2}}
  .photo{position:relative;border-radius:28px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 1px rgba(167,243,208,.3),0 0 60px rgba(16,185,129,.28);aspect-ratio:4/5;max-height:78svh}
  .photo img{width:100%;height:100%;object-fit:cover;display:block}
  .photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,9,10,0) 60%,rgba(3,9,10,.55) 100%)}
  .photo .cap{position:absolute;left:1.25rem;right:1.25rem;bottom:1.1rem;z-index:1;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--em-300);text-shadow:0 0 12px rgba(52,211,153,.8)}
  @media(max-width:899px){.photo{aspect-ratio:1/1;max-height:60svh}.photo img{object-position:center 65%}}
  /* fixed backdrop for long sections: the image stays viewport-sized instead of stretching to the section */
  .fixed-pic{position:absolute;inset:0;z-index:0;background-size:cover;background-position:center;background-attachment:fixed}
  @media(max-width:900px){.fixed-pic{background-attachment:scroll;background-position:center top}}
  #estimate .fixed-pic{background-image:url("__IMG_BRIDGE__");filter:brightness(.55) saturate(1.1)}
  #how .fixed-pic{background-image:url("__IMG_CANYON__");filter:brightness(.42) saturate(1.1)}

  /* nav */
  .nav{position:fixed;top:0;left:0;right:0;z-index:60;padding:.8rem 0}
  .nav-bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:4.4rem;padding:0 1.2rem;border:1px solid rgba(110,231,183,.3);background:rgba(2,10,9,.62);backdrop-filter:blur(18px);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.45)}
  .brand{display:flex;align-items:center;gap:.7rem;text-decoration:none;min-width:0}
  .brand-mark{display:grid;place-items:center;width:2.5rem;height:2.5rem;border-radius:11px;border:1px solid rgba(110,231,183,.55);background:rgba(110,231,183,.12);color:var(--em-300);font-weight:900;box-shadow:inset 0 0 22px rgba(52,211,153,.15),0 0 18px rgba(52,211,153,.25)}
  .brand-name{font-weight:700;font-size:1.02rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nav-links{display:none;gap:1.5rem;font-size:.92rem}.nav-links a{color:var(--ink-2);text-decoration:none}.nav-links a:hover{color:var(--em-300)}
  .nav-cta{display:flex;align-items:center;gap:.5rem}.nav-cta .btn{white-space:nowrap}
  @media(max-width:419px){.brand-name{display:none}}
  .menu-btn{display:grid;place-items:center;width:2.4rem;height:2.4rem;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;cursor:pointer}
  .mobile-menu{margin-top:.5rem;border:1px solid var(--line);background:rgba(2,10,9,.94);backdrop-filter:blur(18px);border-radius:16px;padding:.5rem}
  .mobile-menu a{display:block;padding:.8rem 1rem;border-radius:10px;color:var(--ink-2);text-decoration:none}.mobile-menu a:hover{background:rgba(255,255,255,.05);color:var(--em-300)}
  @media(min-width:1024px){.nav-links{display:flex}.menu-btn{display:none}}

  /* hero */
  .hero .wrap{display:flex;flex-direction:column;justify-content:flex-end;min-height:100svh;padding:7rem 0 4.5rem}
  .hero-foot{display:flex;flex-direction:column;gap:1.25rem;align-items:flex-start}
  @media(min-width:900px){.hero-foot{flex-direction:row;align-items:flex-end;justify-content:space-between}}
  .hero-tag{max-width:34rem;font-size:1.1rem;color:rgba(255,255,255,.9);text-shadow:0 4px 18px rgba(0,0,0,.95)}
  .hero-tag b{color:var(--em-300);font-weight:600}
  .scroll-hint{position:absolute;left:50%;bottom:1.2rem;transform:translateX(-50%);z-index:3;font-size:.65rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(167,243,208,.75);display:flex;flex-direction:column;align-items:center;gap:.35rem}
  .scroll-hint span{width:1px;height:2.2rem;background:linear-gradient(180deg,rgba(52,211,153,.9),transparent)}
  /* phones & tablets: keep the neon words in frame and give the copy a darker floor */
  @media(max-width:1023px){.hero .pic{object-position:25% center}}
  @media(max-width:640px){
    .hero .pic{object-position:18% center}
    .hero .shade-b{background:linear-gradient(180deg,rgba(3,9,10,.2) 0%,rgba(3,9,10,.05) 28%,rgba(3,9,10,.78) 62%,#03090a 100%)}
    .hero .wrap{padding-bottom:3.25rem}
    .scroll-hint{display:none}
    .band{margin:0 .25rem}
  }

  /* war chest */
  .war{max-width:62rem}
  .war h2{font-size:clamp(2.6rem,7vw,6rem);line-height:1;letter-spacing:-.025em}
  .bridge-line{margin-top:1.4rem;font-family:var(--serif);font-weight:600;font-size:clamp(1.35rem,2.8vw,2rem);color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.9)}
  .bridge-line b{color:var(--em-300);font-weight:700;text-shadow:0 0 18px rgba(52,211,153,.8)}
  .note{margin-top:1rem;max-width:40rem;font-size:.92rem;color:rgba(255,255,255,.65);text-shadow:0 2px 10px rgba(0,0,0,.9)}

  /* pillars */
  .pillars{display:grid;grid-template-columns:repeat(2,1fr);margin-top:2.25rem;border:1px solid rgba(167,243,208,.3);background:rgba(2,12,10,.55);backdrop-filter:blur(12px);border-radius:18px;overflow:hidden}
  .pillar{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;min-height:7rem;padding:1.2rem .6rem;color:rgba(255,255,255,.88);text-decoration:none;border-right:1px solid rgba(167,243,208,.14);border-bottom:1px solid rgba(167,243,208,.14);font-size:.86rem;font-weight:600;text-align:center}
  .pillar svg{color:var(--em-300);filter:drop-shadow(0 0 8px rgba(52,211,153,.7))}.pillar:hover{background:rgba(52,211,153,.12);color:var(--em-200)}
  @media(min-width:640px){.pillars{grid-template-columns:repeat(5,1fr)}.pillar{border-bottom:0}}
  @media(max-width:639px){.pillar:last-child,.feat5>div:last-child{grid-column:span 2}.pillar:last-child{border-bottom:0}}

  .h2{font-weight:900;font-size:clamp(2.2rem,5.4vw,4.2rem);letter-spacing:-.025em;line-height:1.02;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.8),0 0 40px rgba(16,185,129,.3)}
  .h2 .g{color:var(--em-400);text-shadow:0 0 22px rgba(52,211,153,.8)}
  .rule{height:4px;width:6rem;border-radius:4px;background:var(--em-400);box-shadow:0 0 16px rgba(52,211,153,.8);margin-top:1.25rem}
  .lead{margin-top:1.4rem;max-width:30rem;font-size:1.12rem;color:rgba(255,255,255,.85);text-shadow:0 3px 14px rgba(0,0,0,.9)}
  .stack{display:flex;flex-direction:column;gap:.75rem;margin-top:1.9rem;max-width:26rem}
  .tagline{margin-top:.9rem;font-family:var(--serif);font-weight:700;font-size:clamp(1.3rem,2.6vw,1.9rem);color:var(--em-300);text-shadow:0 0 18px rgba(52,211,153,.75)}

  /* selectors */
  .selector{padding:1.25rem}
  .selector .t{display:flex;align-items:center;gap:.55rem;margin-bottom:1rem;font-weight:600;font-size:1.05rem;color:var(--em-300)}
  .selector .row{display:flex;align-items:center;gap:.75rem;border:1px solid rgba(167,243,208,.2);background:rgba(0,17,13,.72);border-radius:12px;padding:.7rem 1rem;margin-bottom:.7rem}
  .selector .row svg{flex:none;color:var(--em-300)}
  .selector .row select{border:0;background:transparent;padding:0;color:#fff;font:inherit;width:100%}
  select option{background:#00110d}
  .feat5{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-top:2rem;padding:1.2rem;border:1px solid rgba(167,243,208,.2);background:rgba(2,12,10,.55);backdrop-filter:blur(12px);border-radius:18px;text-align:center}
  @media(min-width:640px){.feat5{grid-template-columns:repeat(5,1fr)}}
  .feat5 svg{color:var(--em-300);filter:drop-shadow(0 0 8px rgba(52,211,153,.7))}.feat5 b{display:block;margin-top:.5rem;font-size:.88rem;color:#fff}.feat5 span{display:block;margin-top:.2rem;font-size:.74rem;color:rgba(255,255,255,.62)}

  /* retention band */
  .band{position:relative;overflow:hidden;max-width:64rem;margin:0 auto;padding:2rem;border-radius:2rem}
  @media(min-width:640px){.band{padding:3rem}}
  .accent-top{position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,transparent,rgba(52,211,153,.95),transparent)}
  .band-grid{display:grid;gap:2.5rem;align-items:center}@media(min-width:820px){.band-grid{grid-template-columns:auto 1fr}}
  .medal{position:relative;width:11rem;height:11rem;margin:0 auto;display:grid;place-items:center}
  .medal .ring{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 210deg,rgba(52,211,153,.95),rgba(16,185,129,.15) 60%,rgba(52,211,153,.95));filter:blur(2px)}
  .medal .core{position:absolute;inset:3px;border-radius:50%;background:radial-gradient(circle at 50% 35%,rgba(6,26,20,.96),#03100c)}
  .medal .num{position:relative;font-size:3.6rem;font-weight:900;letter-spacing:-.02em;line-height:1}
  .medal .lbl{position:relative;margin-top:.25rem;font-size:.62rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(110,231,183,.9)}
  .band-h{margin-top:1rem;font-size:clamp(1.9rem,4.2vw,3rem);font-weight:900;letter-spacing:-.015em;line-height:1.08}
  .band-p{margin-top:1rem;max-width:36rem;font-size:1rem;color:rgba(255,255,255,.85)}.band-p b{color:#fff;font-weight:600}.band-p .em{color:var(--em-300);font-weight:600}
  .tags{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1.4rem}
  .tag{display:inline-flex;align-items:center;gap:.5rem;border:1px solid rgba(167,243,208,.22);background:rgba(0,0,0,.45);border-radius:999px;padding:.4rem .9rem;font-size:.78rem;color:rgba(255,255,255,.8)}.tag svg{color:var(--em-300)}

  /* concierge */
  .center{text-align:center}
  .lead-c{max-width:42rem;margin:1rem auto 0;font-size:1.12rem;color:var(--ink-2)}
  .concierge{max-width:52rem;margin:2.5rem auto 0;padding:1.5rem}
  .ask-row{display:flex;flex-direction:column;gap:.75rem}@media(min-width:640px){.ask-row{flex-direction:row}}
  input,select,textarea{font:inherit;color:#fff;background:rgba(0,17,13,.72);border:1px solid rgba(167,243,208,.22);border-radius:12px;padding:.7rem .85rem;width:100%}
  input::placeholder,textarea::placeholder{color:var(--faint)} input:focus,select:focus,textarea:focus{border-color:var(--em-400)}
  .ask-row textarea{flex:1;min-height:6.2rem;resize:vertical}
  .mic{white-space:nowrap}.mic.listening{background:#ef4444;color:#fff;border-color:#ef4444;box-shadow:none}
  .chips{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}
  .chip{border:1px solid rgba(167,243,208,.22);background:rgba(0,0,0,.35);color:var(--muted);border-radius:999px;padding:.4rem .8rem;font:inherit;font-size:.74rem;cursor:pointer;text-align:left}.chip:hover{border-color:var(--line-2);color:var(--em-200)}
  .status{margin-top:.8rem;text-align:center;font-size:.9rem;color:var(--muted);min-height:1.2em}
  .answer{display:none;margin-top:1.25rem;border:1px solid rgba(167,243,208,.22);background:rgba(0,17,13,.78);border-radius:14px;padding:1.25rem}.answer.show{display:block}
  .answer-meta{font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--em-300);margin-bottom:.75rem}
  .answer-body{white-space:pre-wrap;font-size:.98rem;line-height:1.65;color:rgba(255,255,255,.92)}
  .answer-ctas{display:flex;flex-direction:column;gap:.6rem;margin-top:1.2rem}@media(min-width:640px){.answer-ctas{flex-direction:row}.answer-ctas .btn{flex:1}}
  .fine{margin-top:1rem;text-align:center;font-size:.7rem;color:var(--faint);line-height:1.55}

  /* engines */
  .engines{position:relative;background:var(--ground)}
  .engines .fixed-pic{background-image:url("__IMG_EMERALD__");filter:brightness(.62) saturate(1.15)}
  .engines .shade{background:linear-gradient(180deg,#03090a 0%,rgba(3,9,10,.55) 12%,rgba(3,9,10,.55) 88%,#03090a 100%)}
  .engine-grid{display:grid;gap:1.6rem;margin-top:3rem}@media(min-width:1000px){.engine-grid{grid-template-columns:1fr 1fr}}
  .ecard{position:relative;overflow:hidden;border:1px solid rgba(110,231,183,.28);background:linear-gradient(160deg,rgba(4,20,16,.9),rgba(2,10,9,.86));backdrop-filter:blur(10px);border-radius:22px;padding:1.75rem;box-shadow:0 24px 70px rgba(0,0,0,.55);transition:transform .3s,border-color .3s,box-shadow .3s}
  .ecard:hover{transform:translateY(-5px);border-color:rgba(110,231,183,.7);box-shadow:0 30px 80px rgba(16,185,129,.25)}
  .ecard .accent-top{opacity:.6}.ecard:hover .accent-top{opacity:1}
  .ehead{display:flex;align-items:center;gap:.9rem}
  .ehead .ic{display:grid;place-items:center;width:3.2rem;height:3.2rem;border-radius:14px;border:1px solid rgba(110,231,183,.45);background:linear-gradient(135deg,rgba(16,185,129,.32),rgba(16,185,129,.06));color:var(--em-200);box-shadow:inset 0 0 18px rgba(52,211,153,.3),0 0 18px rgba(52,211,153,.25);flex:none}
  .ehead .n{font-size:.68rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:rgba(110,231,183,.85)}
  .ehead .only{margin-left:auto;border:1px solid rgba(110,231,183,.35);background:rgba(110,231,183,.07);border-radius:999px;padding:.3rem .7rem;font-size:.58rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(110,231,183,.85);white-space:nowrap}
  .ecard h3{margin-top:1.1rem;font-size:clamp(1.5rem,2.4vw,1.9rem);font-weight:900;letter-spacing:-.015em;line-height:1.1;text-shadow:0 0 34px rgba(52,211,153,.25)}
  .ecard .ul{height:2px;width:4.5rem;border-radius:2px;margin-top:.8rem;background:linear-gradient(90deg,#34d399,rgba(52,211,153,0));box-shadow:0 0 10px rgba(52,211,153,.7)}
  .ecard .why{margin-top:.9rem;font-size:.66rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--em-300)}
  .ecard p.body{margin-top:.6rem;font-size:1.02rem;line-height:1.72;color:rgba(255,255,255,.88)}
  .ecard p.body b{color:#fff;font-weight:600}
  .more{max-width:52rem;margin:3rem auto 0;padding:1.75rem;text-align:center;border-radius:20px}
  .more b{display:block;font-size:clamp(1.3rem,3vw,2rem);font-weight:900;color:#fff}.more p{margin:.6rem auto 0;max-width:42rem;color:rgba(255,255,255,.82);font-size:1.02rem}.more p b{display:inline;font-size:inherit;color:var(--em-300)}

  /* estimator */
  .form-card{padding:1.5rem}@media(min-width:640px){.form-card{padding:2rem}}
  .two{display:grid;gap:.75rem}@media(min-width:640px){.two{grid-template-columns:1fr 1fr}.span2{grid-column:span 2}}
  label.f{display:block;font-size:.74rem;color:var(--muted)}label.f input,label.f select{margin-top:.3rem}
  .subhead{margin:1.5rem 0 .6rem;font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--em-300)}
  .consent{display:flex;gap:.75rem;align-items:flex-start;margin-top:1.25rem;border:1px solid rgba(167,243,208,.2);background:rgba(0,0,0,.35);border-radius:14px;padding:1rem;font-size:.76rem;line-height:1.55;color:rgba(255,255,255,.75)}
  .consent input{width:1rem;height:1rem;margin-top:.15rem;accent-color:var(--em-400);flex:none}
  .err{margin-top:.75rem;color:var(--danger);font-size:.9rem;min-height:1.2em}
  .result{display:none;padding:2rem;border-color:rgba(110,231,183,.4)}.result.show{display:block}
  .result h3{font-size:clamp(1.3rem,3vw,2rem);font-weight:800;line-height:1.3;color:#fff;margin-top:.75rem}
  .pills{display:grid;gap:.5rem;margin-top:1.25rem}@media(min-width:640px){.pills{grid-template-columns:1fr 1fr}}
  .pill{display:flex;align-items:center;gap:.5rem;border:1px solid rgba(167,243,208,.16);background:rgba(0,17,13,.65);border-radius:10px;padding:.65rem .8rem;font-size:.9rem;color:rgba(255,255,255,.88)}.pill svg{color:var(--em-300);flex:none}
  .disclaimer{display:flex;gap:.75rem;align-items:flex-start;border:1px solid rgba(251,191,36,.32);background:rgba(251,191,36,.07);border-radius:14px;padding:.9rem 1rem;font-size:.72rem;line-height:1.55;color:var(--muted)}
  .disclaimer b{color:var(--amber-ink)}.disclaimer svg{flex:none;margin-top:.1rem;color:var(--amber)}

  /* process / areas / faq */
  .process{display:grid;gap:1rem;margin-top:3rem}@media(min-width:640px){.process{grid-template-columns:1fr 1fr}}@media(min-width:980px){.process{grid-template-columns:repeat(4,1fr)}}
  .step{position:relative;border:1px solid rgba(167,243,208,.18);background:rgba(2,12,10,.6);backdrop-filter:blur(12px);border-radius:16px;padding:1.5rem}
  .step .n{display:grid;place-items:center;width:2.75rem;height:2.75rem;border-radius:50%;border:1px solid rgba(110,231,183,.4);color:var(--em-300);font-weight:800;font-variant-numeric:tabular-nums;box-shadow:0 0 14px rgba(52,211,153,.3)}
  .step b{display:block;margin-top:1rem;font-size:1.1rem;color:#fff}.step p{margin-top:.5rem;font-size:.92rem;color:rgba(255,255,255,.7)}
  .areas{display:grid;gap:1rem;margin-top:3rem}@media(min-width:640px){.areas{grid-template-columns:1fr 1fr}}@media(min-width:1024px){.areas{grid-template-columns:repeat(4,1fr)}}
  .area{display:flex;flex-direction:column;border:1px solid rgba(167,243,208,.18);background:rgba(2,12,10,.6);backdrop-filter:blur(12px);border-radius:16px;padding:1.4rem;transition:transform .25s,border-color .25s}.area:hover{transform:translateY(-4px);border-color:rgba(110,231,183,.45)}
  .area .ic{display:grid;place-items:center;width:2.75rem;height:2.75rem;border-radius:12px;border:1px solid rgba(110,231,183,.3);background:rgba(110,231,183,.1);color:var(--em-300);margin-bottom:1rem}
  .area b{color:#fff;font-weight:600}.area p{margin-top:.5rem;font-size:.88rem;color:rgba(255,255,255,.68);flex:1}
  .serve{display:grid;gap:1rem;margin-top:2rem}@media(min-width:640px){.serve{grid-template-columns:repeat(2,1fr)}}@media(min-width:980px){.serve{grid-template-columns:repeat(4,1fr)}}
  .serve div{border:1px solid rgba(110,231,183,.3);background:rgba(110,231,183,.07);border-radius:14px;padding:1.2rem;text-align:center;color:#fff;font-weight:600}.serve div span{display:block;margin-top:.35rem;font-size:.82rem;font-weight:400;color:rgba(255,255,255,.65)}
  .faq{max-width:52rem;margin:2.5rem auto 0;display:grid;gap:.75rem}
  .faq details{border:1px solid rgba(167,243,208,.2);background:rgba(2,12,10,.65);backdrop-filter:blur(12px);border-radius:14px;padding:0 1.25rem}
  .faq summary{cursor:pointer;list-style:none;padding:1.1rem 0;font-weight:600;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:1rem}
  .faq summary::-webkit-details-marker{display:none}.faq summary::after{content:"+";color:var(--em-300);font-size:1.4rem;font-weight:400;flex:none}.faq details[open] summary::after{content:"−"}
  .faq details p{padding:0 0 1.1rem;color:rgba(255,255,255,.75);font-size:.95rem;line-height:1.6}

  /* consult / footer / sticky */
  .consult-card{max-width:46rem;margin:0 auto;padding:3rem 1.5rem;text-align:center}
  .consult-card h2{font-size:clamp(1.9rem,4vw,3rem);font-weight:900;color:#fff}
  .consult-card p{margin:1rem auto 2rem;max-width:34rem;color:rgba(255,255,255,.78)}
  .ticks{display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem;margin-top:1.5rem;font-size:.78rem;color:rgba(255,255,255,.7)}.ticks span{display:inline-flex;align-items:center;gap:.4rem}.ticks svg{color:var(--em-400)}
  footer{border-top:1px solid rgba(110,231,183,.15);padding:2rem 0;background:var(--ground)}
  footer .wrap{display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:1rem;font-size:.9rem;color:rgba(255,255,255,.55);text-align:center}
  @media(min-width:768px){footer .wrap{flex-direction:row}} footer .rcs{color:var(--em-400)}
  .sticky-cta{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;gap:.6rem;padding:.7rem .9rem calc(.7rem + env(safe-area-inset-bottom));background:rgba(2,10,9,.94);backdrop-filter:blur(14px);border-top:1px solid rgba(110,231,183,.35)}
  .sticky-cta .btn{flex:1;padding:.85rem .6rem;font-size:.9rem}
  @media(min-width:640px){.sticky-cta{display:none}}@media(max-width:639px){body{padding-bottom:4.6rem}}
  .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
</style>

<!-- ───────── NAV ───────── -->
<nav class="nav" aria-label="Public navigation">
  <div class="wrap" style="padding:0">
    <div class="nav-bar">
      <a href="#top" class="brand" aria-label="Russell Capital Systems homepage"><span class="brand-mark">R</span><span class="brand-name">Russell Capital Systems™</span></a>
      <div class="nav-links"><a href="#warchest">War Chest</a><a href="#physicians">For Physicians</a><a href="#ask">Ask AI</a><a href="#engines">Technology</a><a href="#estimate">Estimate</a><a href="#faq">FAQ</a></div>
      <div class="nav-cta">
        <a class="btn btn-ghost" style="padding:.6rem 1rem;font-size:.9rem" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a Review</a>
        <button class="menu-btn" id="menuBtn" aria-label="Open navigation menu" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      </div>
    </div>
    <div class="mobile-menu" id="mobileMenu" hidden><a href="#warchest">War Chest</a><a href="#physicians">For Physicians</a><a href="#ask">Ask AI</a><a href="#engines">Technology</a><a href="#estimate">Estimate</a><a href="#faq">FAQ</a></div>
  </div>
</nav>

<!-- ───────── PAGE 1 · HERO: the neon sign, full and crisp ───────── -->
<header id="top" class="page hero" aria-label="Financial and Tax Relief and Recovery for Physicians, Psychiatrists, and Surgeons">
  <img class="pic" src="__IMG_NEON_A__" alt="Neon sign reading Financial &amp; Tax Relief and Recovery for Physicians, Psychiatrists, &amp; Surgeons, over a glowing green city skyline">
  <div class="shade shade-b"></div>
  <h1 class="sr">Financial &amp; Tax Relief and Recovery for Physicians, Psychiatrists, &amp; Surgeons</h1>
  <div class="wrap">
    <div class="hero-foot">
      <p class="hero-tag">Coordinated <b>tax reduction</b>, <b>interest recovery</b>, practice, risk, retirement, and legacy planning — built for the finances of physicians, psychiatrists, and surgeons.</p>
      <div class="ctas" style="margin-top:0">
        <a class="btn btn-primary" href="#estimate">Plan Beyond the Practice</a>
        <a class="btn btn-ghost" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a Physician Planning Review</a>
      </div>
    </div>
  </div>
  <div class="scroll-hint" aria-hidden="true">Scroll<span></span></div>
</header>

<!-- ───────── PAGE 2 · GREEN CITY: the War Chest ───────── -->
<section id="warchest" class="page" aria-label="Transform debt into a tax-free liquid war chest">
  <img class="pic" src="__IMG_EMERALD__" alt="Emerald-lit city skyline at dawn with a river winding through it">
  <div class="shade shade-l"></div>
  <div class="wrap">
    <div class="war">
      <p class="eyebrow">The Physician War-Chest Strategy</p>
      <h2 class="h-display" style="margin-top:1.25rem">Transform Debt Into a <span class="neon">Tax-Free Liquid War Chest</span> — On Demand™</h2>
      <p class="bridge-line">You bring the goal. We build the tailored <b>Systems</b> around that.</p>
      <p class="note">Directional strategy education for physicians — not tax, legal, or investment advice. Confirm with your professionals.</p>
      <div class="ctas">
        <a class="btn btn-primary" href="#estimate">Show me the shape of my plan</a>
        <a class="btn btn-ghost" href="#engines">See the engines behind it</a>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 3 · THE BRIDGE: Your practice builds income ───────── -->
<section id="practice" class="page" aria-label="Your practice builds income; we build the system around it">
  <div class="shade" style="background:radial-gradient(circle at 20% 30%,rgba(16,185,129,.14),transparent 45%)"></div>
  <div class="wrap">
    <div class="split">
      <div class="photo"><img src="__IMG_BRIDGE__" alt="Suspension bridge glowing green over the bay at night, towers rising behind it"><span class="cap">Practice Economics</span></div>
      <div>
        <p class="eyebrow">Built around you</p>
        <h2 class="h2" style="margin-top:1.25rem">Your Practice Builds Income. <span class="g">We Build the System Around It.</span></h2>
        <div class="rule"></div>
        <p class="lead">Coordinated tax, practice, risk, retirement, and legacy planning for physicians and medical practice owners — one system, not a stack of separate advisors.</p>
        <div class="pillars">
          <a class="pillar" href="#practice"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>Practice Economics</a>
          <a class="pillar" href="#physicians"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>Physician Tax Strategy</a>
          <a class="pillar" href="#engines"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>Risk &amp; Protection</a>
          <a class="pillar" href="#engines"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/><path d="M22 22H2"/></svg>Retirement Income</a>
          <a class="pillar" href="#engines"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/></svg>Succession &amp; Legacy</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 4 · THE CANYON: Tax strategy for high-earning physicians ───────── -->
<section id="taxstrategy" class="page" aria-label="Tax strategy for high-earning physicians">
  <div class="shade" style="background:radial-gradient(circle at 80% 40%,rgba(16,185,129,.14),transparent 45%)"></div>
  <div class="wrap">
    <div class="split rev">
      <div class="photo"><img src="__IMG_CANYON__" alt="Looking down a canyon of green-lit skyscrapers at night"><span class="cap">Physician Tax Strategy</span></div>
      <div>
        <p class="eyebrow">Tax strategy</p>
        <h2 class="h2" style="margin-top:1.25rem">Tax Strategy for <span class="g">High-Earning Physicians</span></h2>
        <div class="rule"></div>
        <p class="lead">Explore coordinated planning opportunities for medical income, practice entities, retirement plans, and long-term wealth.</p>
        <div class="glass selector" style="margin-top:1.75rem">
          <p class="t"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 3 7h18Z"/></svg>Physician Tax-Planning Review</p>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg><select aria-label="Medical Specialty"><option value="" selected disabled>Select specialty</option><option>Surgery</option><option>Psychiatry</option><option>Internal Medicine</option><option>Radiology</option><option>Anesthesiology</option><option>Other</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg><select aria-label="Income Range"><option value="" selected disabled>Select income</option><option>$300k–$500k</option><option>$500k–$1M</option><option>$1M–$2M</option><option>$2M+</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><select aria-label="Filing Status"><option value="" selected disabled>Select status</option><option>Single</option><option>Married filing jointly</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><select aria-label="State"><option value="" selected disabled>Select state</option><option>California</option><option>Florida</option><option>New York</option><option>Texas</option><option>Other</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/></svg><select aria-label="Practice Entity"><option value="" selected disabled>Select entity</option><option>W-2 employee</option><option>Sole proprietor</option><option>S-Corp</option><option>Partnership/Group</option></select></div>
          <a class="btn btn-primary" href="#estimate" style="width:100%">See My Planning Opportunities</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 5 · THE INTERCHANGE: Turn medical income into lasting wealth ───────── -->
<section id="physicians" class="page" aria-label="Russell Capital Systems for physicians">
  <div class="shade" style="background:radial-gradient(circle at 20% 60%,rgba(16,185,129,.14),transparent 45%)"></div>
  <div class="wrap">
    <div class="split">
      <div class="photo"><img src="__IMG_INTERCHANGE__" alt="Green-lit skyline above a glowing highway interchange and river"><span class="cap">Lasting Wealth</span></div>
      <div>
        <p class="eyebrow">For physicians</p>
        <h2 class="h2" style="margin-top:1.25rem">Russell Capital Systems <span class="g">for Physicians</span></h2>
        <p class="tagline">Turn Medical Income Into Lasting Wealth™</p>
        <p class="lead">Specialized tax, practice, retirement, risk, and legacy planning for physicians, specialists, and medical practice owners.</p>
        <div class="glass selector" style="margin-top:1.75rem">
          <p class="t"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>Design Your Physician Financial System</p>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg><select aria-label="Medical Specialty"><option value="" selected disabled>Select your specialty</option><option>Surgery</option><option>Psychiatry</option><option>Internal Medicine</option><option>Radiology</option><option>Other</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><select aria-label="Career Stage"><option value="" selected disabled>Select your stage</option><option>Resident/Fellow</option><option>Early career</option><option>Mid-career</option><option>Approaching retirement</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/></svg><select aria-label="Practice Structure"><option value="" selected disabled>Select your structure</option><option>Employed</option><option>Private practice</option><option>Group/Partnership</option><option>Locum</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg><select aria-label="Primary Priority"><option value="" selected disabled>Select your priority</option><option>Reduce taxes</option><option>Build retirement income</option><option>Protect assets</option><option>Plan legacy</option></select></div>
          <a class="btn btn-primary" href="#estimate" style="width:100%">Build My Physician Plan</a>
        </div>
        <div class="feat5">
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg><b>Physician Tax</b><span>Optimize today. Protect tomorrow.</span></div>
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/></svg><b>Practice Planning</b><span>Strengthen your practice.</span></div>
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg><b>Risk Protection</b><span>Protect what matters most.</span></div>
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v8"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/><path d="M22 22H2"/></svg><b>Retirement Income</b><span>Live on your terms.</span></div>
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/></svg><b>Legacy Design</b><span>Your legacy. Their future.</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 6 · NEON B: clients who stay for decades ───────── -->
<section id="proof" class="page" aria-label="Experience and client retention">
  <img class="pic" src="__IMG_NEON_B__" alt="Neon sign reading Financial &amp; Tax Relief and Recovery for Physicians, Psychiatrists, &amp; Surgeons over a green city at night">
  <div class="shade shade-c"></div>
  <div class="wrap">
    <div class="glass band">
      <div class="accent-top"></div>
      <div class="band-grid">
        <div class="medal"><div class="ring"></div><div class="core"></div><div style="position:relative;text-align:center"><div class="num grad">60%</div><div class="lbl">20+ years</div></div></div>
        <div>
          <p class="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>Experience you can lean on</p>
          <h2 class="band-h"><span class="grad">Clients who stay for decades.</span></h2>
          <p class="band-p">Our senior business partner — <b>69 years old</b>, with a long career working in <b>medical malpractice</b> — has kept more than <span class="em">60% of their clients on the books for 20 years or longer</span>. That kind of loyalty is earned, not bought.</p>
          <div class="tags">
            <span class="tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>Medical-malpractice specialty</span>
            <span class="tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Senior partnership · 69</span>
            <span class="tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>Two-decade retention</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 7 · ASK AI ───────── -->
<section id="ask" class="page" aria-label="Ask the AI brain trust" style="min-height:auto;padding:6rem 0">
  <img class="pic" src="__IMG_EMERALD__" alt="" aria-hidden="true" style="object-position:center top;filter:brightness(.5) saturate(1.1)">
  <div class="shade" style="background:linear-gradient(180deg,#03090a 0%,rgba(3,9,10,.5) 30%,rgba(3,9,10,.75) 100%)"></div>
  <div class="wrap" style="padding:0">
    <div class="center">
      <p class="eyebrow" id="askEyebrow">AI Brain Trust</p>
      <h2 class="h2" style="margin-top:1.25rem;text-align:center">Press the mic. Ask <span class="g">anything</span>.</h2>
      <p class="lead-c">Describe your situation in as much detail as you want — income, debt, mortgage, savings, goals. Get the plain-language shape of a plan.</p>
    </div>
    <div class="glass concierge">
      <div class="ask-row">
        <button class="btn btn-primary mic" id="micBtn" type="button" aria-label="Start recording your question"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg><span id="micLabel">Speak your question</span></button>
        <textarea id="question" placeholder="…or type it here. The more detail, the better the answer."></textarea>
      </div>
      <div class="chips" id="chips"></div>
      <button class="btn btn-primary" id="askBtn" type="button" style="width:100%;margin-top:1rem">Ask the AI Brain Trust →</button>
      <button class="btn btn-ghost" id="stopBtn" type="button" style="width:100%;margin-top:.6rem" hidden>■ Stop</button>
      <div class="status" id="askStatus"></div>
      <div class="answer" id="answer">
        <div class="answer-meta" id="answerMeta">Answered by the AI advisor</div>
        <div class="answer-body" id="answerBody"></div>
        <div class="answer-ctas"><a class="btn btn-primary" href="#estimate">See your estimate &amp; get a plan</a><a class="btn btn-ghost" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a thorough evaluation</a></div>
      </div>
      <p class="fine">General education only — not tax, legal, or investment advice, and no specific figures are shared here. Your speech is transcribed in your browser; only the text of your question is sent. A licensed professional confirms every specific in a personal review.</p>
    </div>
  </div>
</section>

<!-- ───────── PAGE 8 · THE ENGINES (14, in building order) ───────── -->
<section id="engines" class="engines" aria-label="Patent-pending technology behind Russell Capital Systems" style="position:relative;padding:7rem 0">
  <div class="fixed-pic" aria-hidden="true"></div>
  <div class="shade"></div>
  <div class="wrap">
    <div class="center">
      <p class="eyebrow">Patent-pending · 15 patents in process</p>
      <h2 class="h2" style="margin-top:1.25rem;text-align:center">Engines that work for <span class="g">you and your family</span></h2>
      <p class="lead-c">Fourteen purpose-built engines, in the order they build on one another — with <b style="color:var(--em-300);font-weight:600">15 patents in process</b>, and <b style="color:var(--em-300);font-weight:600">not offered anywhere else</b>. Read them top to bottom: each one makes the next possible.</p>
    </div>
    <div class="engine-grid" id="engineGrid"></div>
    <div class="glass more">
      <b>And we're just getting started.</b>
      <p>Beyond these fourteen, <b>45 more unique patent-pending technologies</b> are in process — built to keep giving you and your family an edge no one else can offer. <b>Stay tuned.</b></p>
    </div>
    <p class="fine" style="max-width:52rem;margin:2rem auto 0">Patent-pending methods developed by Russell Capital Systems — 15 patent applications in process, with 45 more underway — described here at a high level. Not tax, legal, or investment advice; results are not guaranteed and are reviewed by our tax professional team for suitability and IRS compliance before implementation.</p>
  </div>
</section>

<!-- ───────── PAGE 9 · ESTIMATE / LEAD FACT-FINDER ───────── -->
<section id="estimate" class="page" aria-label="Tax and savings estimator" style="min-height:auto;padding:6rem 0">
  <div class="fixed-pic" aria-hidden="true"></div>
  <div class="shade" style="background:linear-gradient(180deg,#03090a 0%,rgba(3,9,10,.6) 25%,rgba(3,9,10,.6) 75%,#03090a 100%)"></div>
  <div class="wrap" style="padding:0">
    <div class="center">
      <h2 class="h2" style="text-align:center">Your <span class="g">Tax &amp; Savings Estimate</span></h2>
      <p class="lead-c">Share your picture and we'll show you the shape of a coordinated plan — then an advisor prepares the specifics for your evaluation.</p>
    </div>
    <form class="glass form-card" id="leadForm" novalidate style="max-width:52rem;margin:2.5rem auto 0">
      <div class="two">
        <input id="firstName" placeholder="First name" aria-label="First name" autocomplete="given-name">
        <input id="lastName" placeholder="Last name" aria-label="Last name" autocomplete="family-name">
        <input id="email" type="email" placeholder="Email" aria-label="Email" autocomplete="email">
        <input id="phone" type="tel" placeholder="Phone" aria-label="Phone" autocomplete="tel">
        <input id="bestTime" class="span2" placeholder="Best time to reach you / book an appointment" aria-label="Best time to contact">
      </div>
      <p class="subhead">Your financial picture</p>
      <div class="two" id="numFields"></div>
      <label class="f" style="margin-top:.75rem">Anything else about your goals?<textarea id="goals" rows="2" aria-label="Goals" style="margin-top:.3rem"></textarea></label>
      <label class="consent"><input type="checkbox" id="consent" aria-label="Consent to be contacted and to store this information"><span>I agree that Russell Capital Systems may store this information and contact me about a planning evaluation. This is general education, not tax, legal, or investment advice, and no figures shown are guarantees.</span></label>
      <div class="err" id="formErr" role="alert"></div>
      <button class="btn btn-primary" type="submit" style="width:100%;margin-top:.5rem">Show me the shape of my plan →</button>
    </form>
    <div class="glass result" id="result" style="max-width:52rem;margin:2.5rem auto 0">
      <p class="eyebrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>Your coordinated strategy</p>
      <h3>Accelerated mortgage payoff + low tax liability + Roth conversion + oil &amp; gas drilling + trust-owned Index Universal Life — combined to help make your money divorce-proof.</h3>
      <div class="pills" id="pills"></div>
      <p style="margin-top:1.25rem;font-size:.9rem;color:var(--muted)">General concepts and sequence only — the specific numbers, timing, and structure are worked out with a licensed advisor in your evaluation.</p>
      <div class="answer-ctas">
        <a class="btn btn-primary" id="sendLead" href="#" target="_blank" rel="noopener noreferrer">Send my details to an advisor</a>
        <button class="btn btn-ghost" id="copyLead" type="button">Copy my summary</button>
        <a class="btn btn-ghost" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book my evaluation</a>
      </div>
      <p class="fine">Sending opens a pre-filled email to our advisory team with what you entered — nothing leaves this page until you send it.</p>
    </div>
    <div class="disclaimer" style="max-width:52rem;margin:1.5rem auto 0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      <p><b>Important:</b> These results are not guaranteed. Any figures or strategies shown represent the best outcomes we have produced for some of our clients under certain conditions — they may or may not reflect the results you would receive. Every result must be thoroughly examined by our tax professional team for suitability and for compliance with applicable IRS statutes before anything is implemented. This estimator is general education only and is not tax, legal, or investment advice. The specific dollar amounts, percentages, and structure are prepared for your licensed advisor and shared in your personal evaluation — not shown here.</p>
    </div>
  </div>
</section>

<!-- ───────── PAGE 10 · HOW WE WORK / WHO WE SERVE / AREAS / FAQ ───────── -->
<section id="how" class="page" aria-label="How we work" style="min-height:auto;padding:6rem 0">
  <div class="fixed-pic" aria-hidden="true"></div>
  <div class="shade" style="background:linear-gradient(180deg,#03090a 0%,rgba(3,9,10,.72) 20%,rgba(3,9,10,.72) 80%,#03090a 100%)"></div>
  <div class="wrap" style="padding:0">
    <div class="center">
      <p class="eyebrow">How we work</p>
      <h2 class="h2" style="margin-top:1.25rem;text-align:center">One documented process. <span class="g">Every professional on the same page.</span></h2>
      <p class="lead-c">Your advisor, tax professional, and attorney work from a single plan — so strategies are sequenced deliberately, never bolted on one at a time.</p>
    </div>
    <div class="process">
      <div class="step"><span class="n">1</span><b>Review</b><p>We map your full picture — income, practice, debt, protection, retirement, and legacy — before recommending anything.</p></div>
      <div class="step"><span class="n">2</span><b>Coordinate</b><p>Your advisor, tax professional, and attorney align on one documented plan, with responsibilities assigned.</p></div>
      <div class="step"><span class="n">3</span><b>Implement</b><p>Strategies are sequenced deliberately, each checked for suitability and IRS compliance before anything moves.</p></div>
      <div class="step"><span class="n">4</span><b>Monitor</b><p>Reviewed on a cadence as tax law, markets, and your life change — so the plan stays current, not static.</p></div>
    </div>
    <div class="center" style="margin-top:5rem"><p class="eyebrow">Who we serve</p><h2 class="h2" style="margin-top:1.25rem;text-align:center;font-size:clamp(1.7rem,4vw,3rem)">Built for the finances of medicine</h2></div>
    <div class="serve"><div>Physicians<span>Employed and private practice</span></div><div>Psychiatrists<span>Practice owners and group partners</span></div><div>Surgeons<span>High-income, high-liability careers</span></div><div>Practice Owners<span>Entity, succession, and exit planning</span></div></div>
    <div class="center" style="margin-top:5rem"><p class="eyebrow">Planning areas</p><h2 class="h2" style="margin-top:1.25rem;text-align:center;font-size:clamp(1.7rem,4vw,3rem)">Every planning area, within reach</h2></div>
    <div class="areas" id="areas"></div>
    <div class="center" style="margin-top:5rem" id="faq"><p class="eyebrow">Questions physicians ask first</p><h2 class="h2" style="margin-top:1.25rem;text-align:center;font-size:clamp(1.7rem,4vw,3rem)">Straight answers</h2></div>
    <div class="faq" id="faqList"></div>
  </div>
</section>

<!-- ───────── PAGE 11 · CONSULTATION over the neon sign ───────── -->
<section id="consult" class="page" aria-label="Book a consultation">
  <img class="pic" src="__IMG_NEON_A__" alt="" aria-hidden="true" style="object-position:center 70%">
  <div class="shade shade-c"></div>
  <div class="wrap">
    <div class="glass consult-card">
      <p class="eyebrow">Relief today · Recovery for life</p>
      <h2 style="margin-top:1.25rem">Keep More of What You Earn. <span class="neon">Protect What You Built.</span></h2>
      <p>Schedule a 30-minute introductory conversation with an advisor to identify the planning questions that deserve a deeper review. No obligation.</p>
      <a class="btn btn-primary" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a Free Consultation</a>
      <div class="ticks">
        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>No obligation</span>
        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>30-minute call</span>
        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>Personalized strategy review</span>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="wrap" style="padding:0">
    <div><span class="rcs">RCS</span> Russell Capital Systems™ © <span id="year"></span>. All rights reserved.</div>
    <div>Not tax, legal, or investment advice. Results are not guaranteed.</div>
  </div>
</footer>

<div class="sticky-cta" aria-label="Quick actions">
  <a class="btn btn-ghost" href="#estimate">Get my estimate</a>
  <a class="btn btn-primary" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a Review</a>
</div>

<script>
(() => {
  const ADVISOR_EMAIL = "__ADVISOR_EMAIL__";
  const $ = (id) => document.getElementById(id);
  $("year").textContent = new Date().getFullYear();

  /* nav */
  const menuBtn = $("menuBtn"), mobileMenu = $("mobileMenu");
  menuBtn.addEventListener("click", () => { const open = mobileMenu.hidden; mobileMenu.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open)); menuBtn.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu"); });
  mobileMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { mobileMenu.hidden = true; menuBtn.setAttribute("aria-expanded","false"); }));

  /* ── THE 14 ENGINES — in building order, five to six sentences each ── */
  const I = {
    layers:'<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    dna:'<path d="m10 16 1.5 1.5"/><path d="m14 8-1.5-1.5"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m16.5 10.5 1 1"/><path d="m17 6-2.891-2.891"/><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="m20 9 .891.891"/><path d="M3.109 14.109 4 15"/><path d="m6.5 12.5 1 1"/><path d="m7 18 2.891 2.891"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/>',
    waves:'<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    boxes:'<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>',
    repeat:'<path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/>',
    home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    landmark:'<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 3 7h18Z"/>',
    shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    radar:'<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
    dice:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M16 8h.01"/><path d="M8 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M12 12h.01"/>',
    history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    brain:'<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>',
    award:'<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    network:'<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>'
  };
  const ENGINES = [
    ["layers","Cascading Calculator Core","The foundation",
     "Most financial software treats your mortgage, your taxes, your retirement, and your insurance as separate islands — you change one and nothing else notices. Our core snaps every calculator we own onto a single base, so when one number in your life changes, everything connected to it updates at once, in the right order. That's how we can show you, in one view, that a mortgage decision quietly moves your future tax bracket, or that a practice choice reshapes your retirement income. You stop guessing at how the pieces interact, because the system shows you. It's the foundation every other engine below stands on — and it's the reason a plan from us behaves like one machine instead of a stack of spreadsheets. <b>No off-the-shelf tool does this. It's ours.</b>"],
    ["dna","Wealth Genome™ Profile","It starts with you",
     "Before we recommend anything, we read your financial DNA. A standard risk questionnaire asks a handful of questions and drops you into a bucket; the Wealth Genome reads dozens of signals about your money life — your income sources, your practice, your family, your debts, your health, your career arc, your comfort with risk — and how they interact with each other. Two physicians who look identical on paper can come out with very different, better-fitting plans, because the genome captures the hidden connections between the factors. It maps you to the specific set of strategies that fit you, not a template. Everything we build next is built around that profile, so nothing in your plan is generic. <b>You've never been a category to us. You're a genome.</b>"],
    ["waves","Optimized Tax Waterfall Engine","Keep more, for life",
     "When you retire, your money sits in many buckets — Roth, IRA, Social Security, pension, rental income, policy cash values — and the IRS taxes each one differently. The order you draw from them can change what you keep over a lifetime by a staggering amount. Most tools optimize two or three sources; our Waterfall coordinates all of them together, year by year, across your whole retirement, and finds the drawdown sequence that leaves the least on the table. The savings it finds only appear when the sources are sequenced as a system — they're invisible when each bucket is planned alone. Every move is checked against the tax code, so your professionals can confirm it. <b>For your family, it means more of what you earned stays yours, and passes on intact.</b>"],
    ["boxes","Zero-Cost Roth Conversion Engine","Tax-free, without the sting",
     "Moving money from a taxable retirement account into a Roth is one of the most powerful things you can do for your future — but the tax bill in the year you convert stops most people cold. This engine pairs the conversion with offsetting deductions, sequenced in the same year, so the tax the conversion creates can be balanced out rather than paid in full. Both halves are well known on their own; almost no one models them together, because the coordination is where the value hides. The result is a path toward tax-free growth and tax-free withdrawals — money that can pass to your children without the IRS in the middle. Whether it fits you depends on your situation, and a licensed professional confirms every specific. <b>But the idea that a Roth conversion has to hurt is one we retire for our clients.</b>"],
    ["repeat","Equity Arbitrage Engine","Put idle equity to work",
     "The equity in your home may be the largest asset you own that earns nothing. It just sits in the walls. This engine finds the sweet spot for borrowing against that equity at a low cost and positioning it where it can grow faster than it costs to borrow — timing the draws and the premiums across decades, not months. Advisors have attempted this by hand in spreadsheets for years; the engine weighs thousands of interacting variables at once and surfaces windows no one could calculate manually. It accounts for the fees, the caps, the exit schedules, and the rate changes that trip people up. <b>Done right, idle equity becomes a working asset for your family, quietly compounding while you practice medicine.</b>"],
    ["home","Mortgage Killer™","Own your home, decades sooner",
     "This is where the equity engine turns into freedom. Mortgage Killer runs a recycling loop: put your idle equity to work, use that growth to pay down the mortgage years ahead of schedule, and when the home is free and clear, recycle the freed equity into the next property — cycle after cycle. Each cycle finishes faster than the last, because the growth from earlier cycles fuels the next one. Real-estate investors and insurance professionals each know their piece of this; nobody else runs it as one automated, compounding engine over a lifetime. For your family it means owning your home outright far sooner, cash flow freed up today, and a paid-off legacy tomorrow instead of thirty years of interest. <b>It's the single most-requested engine we own.</b>"],
    ["landmark","FIA Collateral Optimizer","Income you can count on, capital you can reach",
     "Retirement income usually forces a trade: lock money away for a guaranteed stream, or keep it accessible and give up the guarantee. This engine splits a fixed indexed annuity into two sleeves — one that generates dependable income, and one you can borrow against — and tunes the split to real carrier products and real lending limits. It then coordinates that borrowing power with tax-aware debt paydown, so the same dollars do more than one job. The architecture is a combination you won't find in off-the-shelf software, because it requires modeling the products, the lending, and the taxes together. What you feel is confidence: an income floor you can count on, and capital within reach if life changes. <b>Your money works without being locked in a box.</b>"],
    ["shield","Divorce-Proof Asset Shield","Protect everything you just built",
     "Everything you build is only as safe as its structure. This engine shows you which of your assets sit inside protected vehicles and which sit exposed — to a divorce, a lawsuit, a creditor — and applies the protection rules for your own state, because they differ enormously across the country. It can model more than one life event, so you see the difference protection makes over decades, not just once. Mainstream planning tools don't model asset protection this way at all; divorce attorneys work from simple asset lists after the fact. We do it before anything happens, which is the only time it helps. <b>It's how we help make a family's security durable — the part of your plan that protects all the other parts.</b>"],
    ["radar","Retirement Risk Radar","See every threat, not just the market",
     "Most retirement tools worry about exactly one danger: the stock market. But a long retirement faces ten of them at once — healthcare inflation, the odds of needing long-term care, changes to Social Security, tax law, general inflation, living longer than expected, interest rates, housing, and more. The Radar models all of them and, critically, how they cluster: three or four risks arriving together can do far more damage than any one alone, and single-factor tools never see it coming. You get one clear picture of how prepared you actually are, and specific ways to reduce each exposure. <b>Nothing blindsides your family, because we looked at the whole sky, not just the weather.</b>"],
    ["dice","10,000-Scenario Stress Test","Prove the plan survives",
     "A plan that only works in a rising market isn't a plan. This engine runs yours through ten thousand different futures — crashes, booms, long flat stretches, and everything in between — and shows the full range of outcomes, not one rosy line. It's built specifically for the protective floor and growth cap of the strategies we use, which ordinary simulations get mathematically wrong; that precision reveals patterns standard tools miss entirely. You'll see the best case, the worst case, and how likely each really is. Then you retire knowing the plan holds up when markets don't. <b>That's real peace of mind for the whole family — not something a brochure projection can give you.</b>"],
    ["history","Time Machine Dual-View","Evidence beside the estimate",
     "Regulations require insurance illustrations to show you a hypothetical future — an estimate, however careful. The Time Machine adds what the estimate can't: a look back at how the same strategy would actually have behaved through real market history, decade by decade, with the strategy's true mechanics applied. You see the required forward projection and the historical evidence side by side. It changes how a decision feels, because you're no longer trusting a promise; you're reading a record. No other platform pairs the two views this way. <b>For a family making a decades-long commitment, evidence beside estimate is the difference between hoping and knowing.</b>"],
    ["brain","Behavioral Safeguard","Protect the plan from human nature",
     "Every human brain is wired to make the same expensive money mistakes — panicking at a loss, anchoring on a number, chasing whatever did well last month, freezing when a change is needed. Over a lifetime those instincts can quietly cost a family more than any fee. This engine watches for those patterns as decisions happen and shows you the real numbers, drawn from your own plan, at the moment you need them most. It doesn't lecture; it quantifies, so the better choice is obvious. Behavioral science and financial planning have existed separately for years — putting them together, personally, in real time is what's new. <b>It protects your plan from the one risk no market model can: you.</b>"],
    ["award","The Russell Number™","Your advisor, measured",
     "You've seen how much of a plan's quality depends on the person running it. The Russell Number is a single, transparent score for financial advisors, built from many dimensions at once — client retention, satisfaction, compliance record, continuing education, technology adoption, and more — instead of the one or two revenue metrics the industry usually uses. It's portable, so an advisor can show it to you the way a credit score shows lenders who you are. And because it's earned, it changes behavior: the things that matter to clients are the things that move the score. For your family, it means the person guiding you is measured against a standard, not just licensed. <b>Nobody else scores advisors this way.</b>"],
    ["network","Advisor Practice Platform","Discipline that lasts for decades",
     "Behind every plan that lasts is a practice that runs with discipline. This platform is the nervous system of ours: it forecasts the work ahead, tracks every client's next action, flags anyone who hasn't been heard from, rehearses difficult conversations, and fires automated reminders so nothing falls through the cracks. Most advisory practices bolt these together from separate apps, and things get lost in the seams; ours works as one organism. You'll never experience the platform directly — but you'll feel it as consistent follow-through, year after year, from a practice that runs like the systems it builds. <b>It's how everything above stays true for the long haul.</b>"]
  ];
  $("engineGrid").innerHTML = ENGINES.map(([ic,name,why,body],i) => `
    <article class="ecard">
      <div class="accent-top"></div>
      <div class="ehead"><span class="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[ic]}</svg></span><span class="n">Engine ${String(i+1).padStart(2,"0")} of 14</span><span class="only">Only at RCS</span></div>
      <h3 class="grad">${name}</h3><div class="ul"></div>
      <p class="why">${why}</p>
      <p class="body">${body}</p>
    </article>`).join("");

  /* planning areas + FAQ */
  const AREAS = [
    ["Tax Opportunity Review","Organize income, contribution, entity, and timing questions for coordinated advisor and tax-professional review."],
    ["Practice Owner Planning","Connect practice economics, ownership decisions, succession priorities, and household planning without mixing record systems."],
    ["Protection &amp; Policy Review","Review existing protection, policy assumptions, liquidity needs, and documented follow-up responsibilities."],
    ["Retirement Income Modeling","Compare retirement timing, income guardrails, and planning assumptions — without presenting projections as guarantees."],
    ["Estate &amp; Legacy Coordination","Map estate, family, charitable, and succession priorities to the professionals responsible for implementation."],
    ["Portfolio &amp; Risk Alignment","Connect risk tolerance, portfolio drift, tax considerations, and long-term goals in a documented review cycle."],
    ["Physician Planning Cases","Assumptions, notes, status, and next actions for complex medical-career and practice-owner decisions — saved in one place."],
    ["Secure Document Vault","Planning documents kept inside managed access controls and shared only through authorized workflows."]
  ];
  $("areas").innerHTML = AREAS.map(([t,d]) => `<div class="area"><span class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></span><b>${t}</b><p>${d}</p></div>`).join("");
  const FAQ = [
    ["Who is this for?","Physicians, psychiatrists, surgeons, and medical practice owners — anyone whose income, debt, practice, and tax picture is too complex for a one-size-fits-all plan."],
    ["Is the estimate a quote or a guarantee?","Neither. It's general education showing the shape of a coordinated plan. Nothing is implemented until our tax professional team has examined it for suitability and compliance with applicable IRS statutes — and your own results may differ."],
    ["Why don't you show me the numbers here?","Because the specific dollar amounts, percentages, and structure depend on your exact situation. They're prepared for your licensed advisor and shared with you in your personal evaluation, not on a public page."],
    ["What happens after I submit the estimate?","An advisor reviews what you shared, prepares the specifics, and reaches out — by email or phone, at the time you gave — to schedule a thorough evaluation. There's no obligation."],
    ["What does \"divorce-proof\" mean?","It's the general idea of positioning assets inside structures designed to be more resilient to divorce, lawsuits, or creditors. How much protection applies depends on your state and circumstances, and is confirmed by your professionals."],
    ["What are the patent-pending engines?","Fifteen core planning technologies with patent applications in process — plus 45 more underway — built to coordinate strategies that most tools treat as separate islands. You won't find them offered anywhere else."],
    ["Is my information safe?","Nothing leaves this page until you choose to send it. The estimate opens a pre-filled email you review and send yourself, so you control exactly what's shared."]
  ];
  $("faqList").innerHTML = FAQ.map(([q,a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("");
  $("pills").innerHTML = ["Accelerated mortgage payoff","Lower tax liability","Roth-conversion sequencing","Oil &amp; gas drilling deduction","Trust-owned Index Universal Life"].map(p => `<div class="pill"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>${p}</div>`).join("");

  /* estimator */
  const NUM = [["w2Income","Your W-2 earnings"],["estimatedTaxes","Your estimated annual taxes"],["spouseIncome","Spouse income"],["spouseTaxes","Spouse estimated taxes"],["studentDebt","Student debt owed"],["studentDebtRate","Student loan interest rate (%)"],["homeEquity","Home equity"],["mortgageBalance","Mortgage balance (if known)"],["mortgageRate","Mortgage rate (%)"],["mortgageIO","Interest-only payment / month"],["mortgageYears","Years remaining on mortgage"],["taxDeferredSelf","Your tax-deferred (IRA/401k/403b/TSP)"],["taxDeferredSpouse","Spouse tax-deferred"],["liquid","Total liquid investments (brokerage, etc.)"]];
  $("numFields").innerHTML = NUM.map(([k,l]) => `<label class="f">${l}<input id="${k}" inputmode="decimal" aria-label="${l}"></label>`).join("") + `<label class="f">Are those liquid investments taxable?<select id="liquidTax" aria-label="Liquid investment taxability"><option value="Not sure">Not sure</option><option>Taxable</option><option>Non-taxable</option><option>A mix of both</option></select></label>`;
  const v = (id) => ($(id).value || "").trim();
  let leadSummary = "";
  $("leadForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("formErr"); err.textContent = "";
    if (!$("consent").checked) { err.textContent = "Please check the consent box so we can prepare your estimate."; return; }
    if (!v("email") && !v("phone")) { err.textContent = "Add an email or phone so an advisor can send your evaluation."; return; }
    const lines = [`Name: ${[v("firstName"), v("lastName")].filter(Boolean).join(" ") || "—"}`, `Email: ${v("email") || "—"}`, `Phone: ${v("phone") || "—"}`, `Best time: ${v("bestTime") || "—"}`, "", "FINANCIAL PICTURE", ...NUM.map(([k,l]) => `${l}: ${v(k) || "—"}`), `Liquid taxability: ${v("liquidTax")}`, "", `Goals: ${v("goals") || "—"}`, "", "Consent given: yes (Russell Capital Systems may store this and contact me about a planning evaluation)", `Submitted from the Russell Capital Systems estimate page on ${new Date().toLocaleString()}`];
    const subject = encodeURIComponent(`Planning estimate request — ${[v("firstName"), v("lastName")].filter(Boolean).join(" ") || "new prospect"}`);
    $("sendLead").href = `mailto:${ADVISOR_EMAIL}?subject=${subject}&body=${encodeURIComponent(lines.join("\n"))}`;
    leadSummary = lines.join("\n");
    $("leadForm").hidden = true;
    const r = $("result"); r.classList.add("show"); r.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  const copyBtn = $("copyLead");
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(leadSummary || ""); copyBtn.textContent = "Copied ✓"; }
    catch { const ta = document.createElement("textarea"); ta.value = leadSummary || ""; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); copyBtn.textContent = "Copied ✓"; } catch { copyBtn.textContent = "Select & copy the email instead"; } ta.remove(); }
    setTimeout(() => { copyBtn.textContent = "Copy my summary"; }, 2500);
  });

  /* AI concierge (sample capability; graceful email fallback) */
  const RULES = "You are the AI concierge on the Russell Capital Systems PUBLIC homepage, speaking to a prospective client — often a physician, psychiatrist, or surgeon — who may know nothing about the firm yet. Explain, in warm and confident plain language, the KINDS of strategies and the general FRAME that could apply to their situation: accelerated mortgage payoff, lowering tax liability, Roth-conversion sequencing, oil & gas drilling deductions, and trust-owned Index Universal Life used together — a coordinated combination designed to help make wealth resilient and hard to touch ('divorce-proof'). Talk about the IDEA of combining strategies in a sequence and why coordination beats any single tactic. HARD RULES — never break these: reveal NO specific dollar amounts, NO percentages, NO calculation formulas, NO exact number-of-combinations, NO named internal parameters, and NO step-by-step numeric instructions. Keep it to concepts, frames, and general sequences only. Never guarantee any outcome. State plainly that this is general education, not tax, legal, or investment advice, and that a licensed professional confirms every specific in a personal review. Close by inviting them to complete the short planning estimator and book a thorough evaluation. Under 180 words.";
  const EXAMPLES = ["I'm a surgeon with student loans, a big mortgage, and a 401(k) — how would you help me keep more and pay debt off faster?","How do you turn my home equity and taxable accounts into something that's protected and tax-efficient?","What's the general idea behind making my money 'divorce-proof'?"];
  const q = $("question"), askBtn = $("askBtn"), stopBtn = $("stopBtn"), status = $("askStatus"), answer = $("answer"), body = $("answerBody"), meta = $("answerMeta");
  $("chips").innerHTML = EXAMPLES.map(t => `<button type="button" class="chip">${t.length > 60 ? t.slice(0,60) + "…" : t}</button>`).join("");
  [...$("chips").children].forEach((c, i) => c.addEventListener("click", () => { q.value = EXAMPLES[i]; q.focus(); }));
  let sampleFn = null, ctl = null;
  const COPY = { rate_limited: "The advisor is busy right now — please try again in a moment.", session_expired: "Please sign in again to ask the advisor.", refused: "The advisor couldn't answer that one — try rephrasing your question.", empty_completion: "No answer came back — try asking with a little more detail.", upstream_error: "The connection dropped — please try again." };
  const HIDE = new Set(["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"]);
  function fallbackMode() { sampleFn = null; $("askEyebrow").textContent = "Ask an advisor"; askBtn.textContent = "Send my question to an advisor →"; status.textContent = ""; }
  function sendToAdvisor(text) { window.open(`mailto:${ADVISOR_EMAIL}?subject=${encodeURIComponent("Question from the Russell Capital Systems homepage")}&body=${encodeURIComponent(text + "\n\n(Sent from the Russell Capital Systems homepage)")}`, "_blank"); status.textContent = "Your email app should open with your question ready to send. Prefer a call? Book below."; }
  async function ask(text) {
    const t = (text || "").trim(); if (!t) { q.focus(); return; }
    if (!sampleFn) { sendToAdvisor(t); return; }
    ctl = new AbortController(); askBtn.disabled = true; stopBtn.hidden = false;
    status.textContent = "The AI advisor is reviewing your question…"; answer.classList.remove("show"); body.textContent = "";
    try {
      const res = await sampleFn([{ role: "user", content: RULES }, { role: "user", content: `The visitor asked: "${t}"\n\nAnswer per your hard rules — concepts and frames only, no numbers or formulas.` }], { cache: false, signal: ctl.signal, onText: ({ text }) => { status.textContent = ""; answer.classList.add("show"); body.textContent = text; } });
      body.textContent = res.text; meta.textContent = "Answered by the AI advisor · general education only";
      if (res.truncated) status.textContent = "Answer was cut short — ask a shorter question for the rest.";
    } catch (e) {
      if (e && e.code === "cancelled") { status.textContent = e.text ? "Stopped." : ""; if (e.text) { answer.classList.add("show"); body.textContent = e.text; } }
      else if (e && HIDE.has(e.code)) { fallbackMode(); sendToAdvisor(t); }
      else { if (e && e.text) { answer.classList.add("show"); body.textContent = e.text; } status.textContent = COPY[e && e.code] || COPY.upstream_error; }
    } finally { askBtn.disabled = false; stopBtn.hidden = true; ctl = null; }
  }
  askBtn.addEventListener("click", () => ask(q.value));
  stopBtn.addEventListener("click", () => ctl && ctl.abort());
  (async () => { try { sampleFn = (window.claude && typeof window.claude.use === "function") ? await window.claude.use("sample") : null; } catch { sampleFn = null; } if (!sampleFn) fallbackMode(); else { $("askEyebrow").textContent = "AI Brain Trust · live"; } })();

  /* mic */
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = $("micBtn"), micLabel = $("micLabel"); let rec = null, listening = false;
  if (!Rec) micBtn.hidden = true;
  micBtn.addEventListener("click", () => {
    if (listening) { rec && rec.stop(); return; }
    rec = new Rec(); rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true; let finalText = "";
    rec.onresult = (ev) => { let t = ""; for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript; finalText = t; q.value = t; };
    rec.onend = () => { listening = false; micBtn.classList.remove("listening"); micLabel.textContent = "Speak your question"; micBtn.setAttribute("aria-label","Start recording your question"); if (finalText.trim()) ask(finalText); };
    rec.onerror = () => { listening = false; micBtn.classList.remove("listening"); micLabel.textContent = "Speak your question"; status.textContent = "Microphone unavailable or permission denied — type your question instead."; };
    q.value = ""; status.textContent = "Listening… describe your situation in as much detail as you like, then tap the mic again.";
    listening = true; micBtn.classList.add("listening"); micLabel.textContent = "Stop & ask"; micBtn.setAttribute("aria-label","Stop recording and ask");
    try { rec.start(); } catch { rec.onerror(); }
  });
})();
</script>
```

