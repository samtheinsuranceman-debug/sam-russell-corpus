export interface InterviewStep {
  key: string;
  section: string;
  question: string;
  followUp: string;
  condition?: (data: Record<string, string>) => boolean | "" | undefined;
}

export const INTERVIEW_SECTIONS = [
  "Personal & Family",
  "Employment & Income",
  "Tax & Filing",
  "Assets & Net Worth",
  "Liabilities & Debt",
  "Credit & Banking",
  "Insurance Coverage",
  "Retirement Planning",
  "Estate & Legacy",
  "Risk & Behavioral",
  "Goals & Priorities",
  "Health & Lifestyle",
  "Real Estate",
  "Business Interests",
  "Advisor Relationship",
];

export const INTERVIEW_STEPS: InterviewStep[] = [
  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: Personal & Family (12 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "fullName", section: "Personal & Family", question: "Let's start with the basics. What is the client's full legal name — first, middle, and last?", followUp: "Perfect. " },
  { key: "dateOfBirth", section: "Personal & Family", question: "What is their date of birth? (MM/DD/YYYY)", followUp: "Thank you. " },
  { key: "ssn_last4", section: "Personal & Family", question: "For identification purposes, what are the last 4 digits of their Social Security Number?", followUp: "Noted securely. " },
  { key: "maritalStatus", section: "Personal & Family", question: "What is their current marital status? (Single, Married, Divorced, Widowed, Domestic Partnership)", followUp: "Understood. " },
  { key: "spouseName", section: "Personal & Family", question: "What is their spouse's full name, date of birth, and occupation?", followUp: "Great. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("married") || d.maritalStatus?.toLowerCase().includes("partner") },
  { key: "spouseIncome", section: "Personal & Family", question: "What is the spouse's approximate annual income and do they have their own retirement accounts?", followUp: "That's helpful. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("married") || d.maritalStatus?.toLowerCase().includes("partner") },
  { key: "dependents", section: "Personal & Family", question: "How many dependents do they have? Please list each with their name, age, and relationship (children, elderly parents, etc.)", followUp: "Noted. " },
  { key: "dependentNeeds", section: "Personal & Family", question: "Do any dependents have special needs that require long-term financial planning? (Special education, medical care, trust requirements)", followUp: "Important to know. " },
  { key: "homeAddress", section: "Personal & Family", question: "What is their primary residence address? (City, State, ZIP)", followUp: "Got it. " },
  { key: "citizenship", section: "Personal & Family", question: "Are they a U.S. citizen or permanent resident? Do they have dual citizenship or residency in any other state or country?", followUp: "Thank you. " },
  { key: "veteranStatus", section: "Personal & Family", question: "Are they a military veteran or active service member? (This may affect benefits eligibility)", followUp: "Noted. " },
  { key: "divorceDetails", section: "Personal & Family", question: "Were there any financial obligations from the divorce — alimony, child support, or asset division agreements?", followUp: "I see. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("divorced") },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: Employment & Income (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "occupation", section: "Employment & Income", question: "What is the client's current occupation, job title, and employer name?", followUp: "Perfect. " },
  { key: "yearsEmployed", section: "Employment & Income", question: "How long have they been with their current employer? And how stable do they consider their position?", followUp: "Good to know. " },
  { key: "annualSalary", section: "Employment & Income", question: "What is their base annual salary or wages (before taxes)?", followUp: "Thank you. " },
  { key: "bonusCommission", section: "Employment & Income", question: "Do they receive bonuses, commissions, or variable compensation? If so, what was the average over the last 3 years?", followUp: "Noted. " },
  { key: "otherIncome", section: "Employment & Income", question: "Do they have any other sources of income? (Rental income, side business, royalties, dividends, Social Security, pension, alimony received)", followUp: "That's helpful. " },
  { key: "spouseEmployment", section: "Employment & Income", question: "Is the spouse currently employed? What is their income and employment stability?", followUp: "Understood. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("married") || d.maritalStatus?.toLowerCase().includes("partner") },
  { key: "employerBenefits", section: "Employment & Income", question: "What employer benefits do they have access to? (401k match, pension, stock options, ESPP, deferred comp, group life/disability insurance)", followUp: "Important details. " },
  { key: "incomeGrowth", section: "Employment & Income", question: "What do they expect their income trajectory to look like over the next 5-10 years? Any expected promotions, career changes, or income disruptions?", followUp: "Good to plan for. " },
  { key: "savingsRate", section: "Employment & Income", question: "What percentage of their income are they currently saving or investing each month? (Include all retirement contributions, savings accounts, etc.)", followUp: "That's a key metric. " },
  { key: "monthlyExpenses", section: "Employment & Income", question: "What are their approximate total monthly living expenses? (Housing, food, transportation, childcare, subscriptions, discretionary)", followUp: "Thank you. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: Tax & Filing (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "filingStatus", section: "Tax & Filing", question: "What is their tax filing status? (Single, Married Filing Jointly, Married Filing Separately, Head of Household, Qualifying Surviving Spouse)", followUp: "Got it. " },
  { key: "taxBracket", section: "Tax & Filing", question: "What is their approximate federal marginal tax bracket? (10%, 12%, 22%, 24%, 32%, 35%, 37%)", followUp: "Noted. " },
  { key: "stateTax", section: "Tax & Filing", question: "What state do they file taxes in, and what is the approximate state income tax rate?", followUp: "Thank you. " },
  { key: "taxDeductions", section: "Tax & Filing", question: "Do they itemize deductions or take the standard deduction? If itemizing, what are the major deductions? (Mortgage interest, state/local taxes, charitable giving)", followUp: "Helpful for planning. " },
  { key: "capitalGains", section: "Tax & Filing", question: "Do they have any significant unrealized capital gains in taxable accounts? Approximately how much?", followUp: "Important for tax planning. " },
  { key: "taxConcerns", section: "Tax & Filing", question: "Are there any specific tax concerns or upcoming tax events? (AMT exposure, stock option exercises, property sales, Roth conversions, inherited IRA RMDs)", followUp: "Good to flag. " },
  { key: "cpaRelationship", section: "Tax & Filing", question: "Do they work with a CPA or tax professional? Would they be open to coordinating between their tax advisor and financial advisor?", followUp: "Coordination is key. " },
  { key: "lastYearTax", section: "Tax & Filing", question: "Approximately how much did they pay in total federal and state income taxes last year?", followUp: "That gives us a baseline. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: Assets & Net Worth (12 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "checkingSavings", section: "Assets & Net Worth", question: "What is the approximate total balance across all checking and savings accounts?", followUp: "Thank you. " },
  { key: "emergencyFund", section: "Assets & Net Worth", question: "How many months of living expenses do they have set aside in liquid emergency savings?", followUp: "Noted. " },
  { key: "taxableInvestments", section: "Assets & Net Worth", question: "Do they have any taxable brokerage or investment accounts? What is the approximate balance and what's in them? (Stocks, bonds, mutual funds, ETFs)", followUp: "Good. " },
  { key: "retirementAccounts", section: "Assets & Net Worth", question: "Please list all retirement accounts with approximate balances: 401(k), 403(b), IRA, Roth IRA, SEP IRA, SIMPLE IRA, pension, deferred comp, etc.", followUp: "Excellent detail. " },
  { key: "annuities", section: "Assets & Net Worth", question: "Do they own any annuities? If so, what type (MYGA, FIA, SPIA, variable), carrier, current value, surrender period remaining, and guaranteed rates?", followUp: "Important. " },
  { key: "lifeInsurance", section: "Assets & Net Worth", question: "Do they own any life insurance policies with cash value? (Whole life, universal life, IUL) What is the death benefit, cash value, and annual premium?", followUp: "Thank you. " },
  { key: "realEstateAssets", section: "Assets & Net Worth", question: "Do they own any real estate? For each property, what is the estimated market value, remaining mortgage balance, monthly payment, and is it primary residence, rental, or investment?", followUp: "Great detail. " },
  { key: "businessInterests", section: "Assets & Net Worth", question: "Do they own any business interests? (LLC, S-Corp, partnership, sole proprietorship) What is the estimated value and annual revenue?", followUp: "Noted. " },
  { key: "cryptoAlternatives", section: "Assets & Net Worth", question: "Do they hold any cryptocurrency, precious metals, collectibles, or other alternative investments? Approximate values?", followUp: "Good to know. " },
  { key: "cdsBonds", section: "Assets & Net Worth", question: "Do they own any CDs, Treasury bonds, savings bonds, or fixed-income instruments? What are the maturity dates, rates, and amounts?", followUp: "Thank you. " },
  { key: "stockOptions", section: "Assets & Net Worth", question: "Do they have any unvested stock options, RSUs, or employer equity? What is the vesting schedule and approximate current value?", followUp: "Important for planning. " },
  { key: "socialSecurity", section: "Assets & Net Worth", question: "Have they checked their Social Security statement? What is their estimated monthly benefit at full retirement age? Have they already started claiming?", followUp: "Critical for retirement planning. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5: Liabilities & Debt (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "mortgageDetails", section: "Liabilities & Debt", question: "What are the details of their primary mortgage? (Balance, interest rate, monthly payment, years remaining, fixed or adjustable)", followUp: "Got it. " },
  { key: "otherMortgages", section: "Liabilities & Debt", question: "Do they have any other mortgages or HELOCs? (Investment property, second home, home equity line) Please include balance, rate, and payment.", followUp: "Noted. " },
  { key: "autoLoans", section: "Liabilities & Debt", question: "Do they have any auto loans or leases? (Balance, monthly payment, interest rate, months remaining)", followUp: "Thank you. " },
  { key: "studentLoans", section: "Liabilities & Debt", question: "Any student loan debt? (Federal or private, balance, interest rate, repayment plan — standard, income-driven, PSLF eligible?)", followUp: "Important. " },
  { key: "creditCardDebt", section: "Liabilities & Debt", question: "What is their total credit card debt across all cards? What is the highest single card balance, and what are the interest rates?", followUp: "I see. " },
  { key: "personalLoans", section: "Liabilities & Debt", question: "Do they have any personal loans, 401k loans, or lines of credit? (Balance, rate, payment)", followUp: "Noted. " },
  { key: "medicalDebt", section: "Liabilities & Debt", question: "Any outstanding medical debt or payment plans?", followUp: "Thank you. " },
  { key: "taxDebt", section: "Liabilities & Debt", question: "Do they owe any back taxes to the IRS or state? Are they on a payment plan?", followUp: "Important to address. " },
  { key: "cosignedDebts", section: "Liabilities & Debt", question: "Have they co-signed any loans for children, family members, or business partners?", followUp: "Good to know. " },
  { key: "debtStrategy", section: "Liabilities & Debt", question: "What is their current approach to debt management? Are they focused on paying off specific debts, or maintaining minimum payments?", followUp: "Understood. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 6: Credit & Banking (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "ficoScore", section: "Credit & Banking", question: "What is their approximate FICO credit score? (Excellent 750+, Good 700-749, Fair 650-699, Poor below 650) Do they know their exact score?", followUp: "Credit score is a critical asset class. " },
  { key: "spouseFico", section: "Credit & Banking", question: "What is the spouse's approximate FICO score?", followUp: "Good to have both. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("married") || d.maritalStatus?.toLowerCase().includes("partner") },
  { key: "creditHistory", section: "Credit & Banking", question: "How long is their credit history? Any negative marks — late payments, collections, bankruptcies, or foreclosures in the past 7 years?", followUp: "Noted. " },
  { key: "creditUtilization", section: "Credit & Banking", question: "What is their approximate credit utilization ratio? (Total credit card balances divided by total credit limits)", followUp: "That's a key factor. " },
  { key: "totalCreditLimit", section: "Credit & Banking", question: "What is their total available credit limit across all cards and lines of credit?", followUp: "Access to credit is an important asset. " },
  { key: "bankingRelationships", section: "Credit & Banking", question: "Which banks and financial institutions do they have primary relationships with? (Checking, savings, credit cards, investment accounts)", followUp: "Thank you. " },
  { key: "creditMonitoring", section: "Credit & Banking", question: "Do they actively monitor their credit? Have they frozen their credit reports?", followUp: "Good practice. " },
  { key: "creditGoals", section: "Credit & Banking", question: "Are they planning any major credit-dependent purchases in the next 1-3 years? (Home purchase, refinance, auto, business loan)", followUp: "Important for timing. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 7: Insurance Coverage (12 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "lifeInsuranceDetails", section: "Insurance Coverage", question: "Do they have life insurance? For each policy: type (term, whole, universal, IUL), carrier, death benefit, premium, and beneficiary.", followUp: "Thank you. " },
  { key: "lifeInsuranceNeed", section: "Insurance Coverage", question: "Based on their income and family situation, do they feel adequately covered? The general guideline is 10-15x annual income for income replacement.", followUp: "Good to assess. " },
  { key: "disabilityInsurance", section: "Insurance Coverage", question: "Do they have disability insurance? (Employer-provided, individual, or both) What is the monthly benefit and elimination period?", followUp: "Critical protection. " },
  { key: "healthInsurance", section: "Insurance Coverage", question: "What health insurance do they have? (Employer, marketplace, Medicare, Medicaid) What are the annual premiums and deductibles?", followUp: "Noted. " },
  { key: "longTermCare", section: "Insurance Coverage", question: "Do they have long-term care insurance? If not, have they considered it? (Average nursing home cost is $8,000-$12,000/month)", followUp: "Important for later years. " },
  { key: "umbrellaPolicy", section: "Insurance Coverage", question: "Do they have an umbrella liability policy? If so, what is the coverage amount?", followUp: "Good protection. " },
  { key: "homeInsurance", section: "Insurance Coverage", question: "Do they have adequate homeowner's/renter's insurance? When was it last reviewed? Is the coverage amount current with home value?", followUp: "Thank you. " },
  { key: "autoInsurance", section: "Insurance Coverage", question: "What auto insurance coverage do they have? (Liability limits, comprehensive, collision, uninsured motorist)", followUp: "Noted. " },
  { key: "businessInsurance", section: "Insurance Coverage", question: "If they own a business, do they have business insurance? (General liability, E&O, key person, buy-sell agreement)", followUp: "Important for business owners. ", condition: (d) => d.businessInterests && d.businessInterests.toLowerCase() !== "no" && d.businessInterests.toLowerCase() !== "none" },
  { key: "insuranceGaps", section: "Insurance Coverage", question: "Are there any insurance gaps they're aware of or concerned about?", followUp: "Good to identify. " },
  { key: "beneficiaryReview", section: "Insurance Coverage", question: "When were their insurance beneficiary designations last reviewed? Are they current with their wishes?", followUp: "Beneficiary reviews are critical. " },
  { key: "insurancePremiums", section: "Insurance Coverage", question: "What is their total annual insurance premium spend across all policies? (Life, health, auto, home, umbrella, disability, LTC)", followUp: "That gives us the full picture. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 8: Retirement Planning (12 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "retirementAge", section: "Retirement Planning", question: "At what age do they plan to retire? Is this a firm target or flexible?", followUp: "Good target. " },
  { key: "retirementIncome", section: "Retirement Planning", question: "What annual income do they envision needing in retirement? (In today's dollars) What lifestyle do they want?", followUp: "That's a clear goal. " },
  { key: "retirementLocation", section: "Retirement Planning", question: "Where do they plan to live in retirement? (Same home, downsize, relocate to a different state, snowbird between two locations)", followUp: "Location affects costs significantly. " },
  { key: "socialSecurityStrategy", section: "Retirement Planning", question: "Have they thought about when to claim Social Security? (62 early, 67 full, 70 delayed) Do they understand the impact of timing?", followUp: "Timing can mean hundreds of thousands in lifetime benefits. " },
  { key: "pensionDetails", section: "Retirement Planning", question: "Do they have a pension? If so, what are the options — lump sum vs. annuity? What is the estimated monthly benefit? Is there a survivor benefit?", followUp: "Pension optimization is crucial. " },
  { key: "retirementContributions", section: "Retirement Planning", question: "Are they currently maxing out their retirement contributions? (401k: $23,500, IRA: $7,000, catch-up if over 50) If not, how much are they contributing?", followUp: "Every dollar counts. " },
  { key: "rothConversion", section: "Retirement Planning", question: "Have they considered or executed any Roth conversions? Do they understand the tax implications and potential benefits?", followUp: "Roth conversions can be powerful. " },
  { key: "retirementHealthcare", section: "Retirement Planning", question: "How do they plan to handle healthcare costs between retirement and Medicare eligibility at 65? (COBRA, marketplace, spouse's plan)", followUp: "Healthcare is often the biggest retirement expense. " },
  { key: "retirementWithdrawal", section: "Retirement Planning", question: "Do they have a withdrawal strategy in mind? (Which accounts to draw from first, tax-efficient sequencing)", followUp: "Withdrawal order matters enormously for taxes. " },
  { key: "retirementActivities", section: "Retirement Planning", question: "What do they envision doing in retirement? (Travel, hobbies, part-time work, volunteering, caring for grandchildren) This affects spending patterns.", followUp: "Lifestyle drives the numbers. " },
  { key: "retirementConcerns", section: "Retirement Planning", question: "What is their biggest fear about retirement? (Running out of money, healthcare costs, inflation, boredom, losing purpose)", followUp: "Addressing fears is part of good planning. " },
  { key: "retirementReadiness", section: "Retirement Planning", question: "On a scale of 1-10, how confident do they feel about their retirement readiness? What would increase their confidence?", followUp: "That's honest and helpful. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 9: Estate & Legacy (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "willTrust", section: "Estate & Legacy", question: "Do they have a will and/or trust? When was it last updated? Is it a simple will, revocable living trust, or irrevocable trust?", followUp: "Estate documents are foundational. " },
  { key: "powerOfAttorney", section: "Estate & Legacy", question: "Do they have a durable power of attorney and healthcare power of attorney / healthcare directive in place?", followUp: "Critical documents. " },
  { key: "beneficiaries", section: "Estate & Legacy", question: "Who are their primary and contingent beneficiaries across all accounts and policies? Are designations consistent with their wishes?", followUp: "Beneficiary alignment is essential. " },
  { key: "estateValue", section: "Estate & Legacy", question: "What is their approximate total estate value? (All assets minus liabilities) Are they near the federal estate tax exemption threshold?", followUp: "Important for estate tax planning. " },
  { key: "inheritanceExpected", section: "Estate & Legacy", question: "Are they expecting to receive any inheritance? If so, approximately how much, from whom, and what is the likely timeline? (Within 5 years, 5-15 years, 15+ years)", followUp: "Planning for inheritance is smart. " },
  { key: "inheritanceType", section: "Estate & Legacy", question: "What form would the inheritance likely take? (Cash, real estate, retirement accounts, business interests, life insurance proceeds, trust distributions)", followUp: "The form affects tax treatment. ", condition: (d) => d.inheritanceExpected && !d.inheritanceExpected.toLowerCase().includes("no") && !d.inheritanceExpected.toLowerCase().includes("none") },
  { key: "legacyGoals", section: "Estate & Legacy", question: "What are their legacy goals? (Leave maximum to children, charitable giving, family foundation, education funding for grandchildren, minimize estate taxes)", followUp: "Beautiful goals. " },
  { key: "charitableGiving", section: "Estate & Legacy", question: "Do they currently make charitable donations? How much annually? Have they considered donor-advised funds, charitable remainder trusts, or qualified charitable distributions?", followUp: "Charitable planning can be tax-efficient. " },
  { key: "estateAttorney", section: "Estate & Legacy", question: "Do they work with an estate planning attorney? When was their estate plan last reviewed?", followUp: "Regular reviews are important. " },
  { key: "specialInstructions", section: "Estate & Legacy", question: "Are there any special estate planning considerations? (Blended family, special needs beneficiary, family business succession, international assets)", followUp: "Good to flag. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 10: Risk & Behavioral (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "riskTolerance", section: "Risk & Behavioral", question: "How would they describe their overall investment risk tolerance? (Very Conservative, Conservative, Moderate, Aggressive, Very Aggressive)", followUp: "Thank you. " },
  { key: "marketDropReaction", section: "Risk & Behavioral", question: "If their portfolio dropped 30% in a single quarter, what would they realistically do? (Sell everything, sell some, hold, buy more)", followUp: "Honest self-assessment is valuable. " },
  { key: "investmentExperience", section: "Risk & Behavioral", question: "How would they rate their investment knowledge? (Novice, Intermediate, Advanced, Expert) What types of investments have they owned?", followUp: "Good context. " },
  { key: "pastMistakes", section: "Risk & Behavioral", question: "Have they ever made an investment decision they regret? What happened and what did they learn?", followUp: "Experience is the best teacher. " },
  { key: "decisionMaking", section: "Risk & Behavioral", question: "When making financial decisions, do they tend to research extensively, go with gut feeling, seek advice, or avoid decisions altogether?", followUp: "Understanding decision style helps us work together. " },
  { key: "sleepTest", section: "Risk & Behavioral", question: "What level of portfolio volatility would keep them up at night? (5% drop, 10% drop, 20% drop, 30%+ drop — or nothing bothers them)", followUp: "The sleep test is real. " },
  { key: "newsReaction", section: "Risk & Behavioral", question: "How do they react to financial news headlines? (Ignore them, read but don't act, feel anxious, want to make changes immediately)", followUp: "Media influence is a real factor. " },
  { key: "returnExpectation", section: "Risk & Behavioral", question: "What annual return do they expect from their investments over the next 10 years? (This helps calibrate expectations)", followUp: "Setting realistic expectations is important. " },
  { key: "lossVsGain", section: "Risk & Behavioral", question: "Which bothers them more: missing out on a 20% gain, or experiencing a 20% loss? (This reveals loss aversion tendency)", followUp: "That's very revealing. " },
  { key: "advisorRole", section: "Risk & Behavioral", question: "What role do they want their financial advisor to play? (Tell me what to do, give me options and let me decide, collaborative partnership, just execute my decisions)", followUp: "Understanding this shapes our relationship. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 11: Goals & Priorities (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "topGoals", section: "Goals & Priorities", question: "What are their top 3 financial goals right now, in order of priority? (Be as specific as possible — amounts, timelines, outcomes)", followUp: "Clear priorities drive great plans. " },
  { key: "shortTermGoals", section: "Goals & Priorities", question: "Are there any short-term financial goals in the next 1-3 years? (Home purchase, car, vacation, emergency fund, debt payoff, wedding)", followUp: "Short-term goals need different strategies. " },
  { key: "mediumTermGoals", section: "Goals & Priorities", question: "What about medium-term goals in the 3-10 year range? (College funding, home renovation, career change, sabbatical, starting a business)", followUp: "Good planning horizon. " },
  { key: "collegeFunding", section: "Goals & Priorities", question: "Are they saving for children's education? If so, do they have 529 plans, Coverdell ESAs, or other education savings? What are the target amounts?", followUp: "Education planning is time-sensitive. ", condition: (d) => d.dependents && !d.dependents.toLowerCase().includes("none") && d.dependents !== "0" },
  { key: "lifestyleGoals", section: "Goals & Priorities", question: "Are there any lifestyle goals that require significant funding? (Second home, boat, extended travel, early retirement, philanthropic project)", followUp: "Dreams deserve a plan. " },
  { key: "incomeGoal", section: "Goals & Priorities", question: "What is their target passive income goal? (Monthly or annual amount they'd like to receive without working)", followUp: "Passive income is the ultimate goal. " },
  { key: "netWorthGoal", section: "Goals & Priorities", question: "Do they have a target net worth they're working toward? By what age?", followUp: "Specific targets are powerful motivators. " },
  { key: "financialFreedom", section: "Goals & Priorities", question: "How do they define financial freedom? What would their life look like if money were no longer a constraint?", followUp: "That's a powerful vision. " },
  { key: "majorPurchases", section: "Goals & Priorities", question: "Are any major purchases or financial events planned in the next 1-5 years? (Home, business, investment property, vehicle, wedding, medical procedure)", followUp: "Good to plan ahead. " },
  { key: "dealBreakers", section: "Goals & Priorities", question: "Are there any investment types or strategies they absolutely will NOT consider? (Crypto, individual stocks, leverage, annuities, etc.) Any ethical or religious investment restrictions?", followUp: "Respecting boundaries is essential. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 12: Health & Lifestyle (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "healthStatus", section: "Health & Lifestyle", question: "How would they rate their overall health? (Excellent, Good, Fair, Poor) Any chronic conditions or ongoing medical treatments?", followUp: "Health affects insurance and planning. " },
  { key: "familyHealth", section: "Health & Lifestyle", question: "Is there a family history of any significant health conditions? (Heart disease, cancer, diabetes, Alzheimer's) This affects longevity planning.", followUp: "Important for long-term projections. " },
  { key: "longevityExpectation", section: "Health & Lifestyle", question: "Based on family history and personal health, how long do they expect to live? (This isn't morbid — it's essential for planning. Average is 85-90 for healthy individuals)", followUp: "Planning for longevity protects against outliving savings. " },
  { key: "tobaccoUse", section: "Health & Lifestyle", question: "Do they use tobacco products? (This significantly affects insurance rates and health projections)", followUp: "Noted. " },
  { key: "prescriptionCosts", section: "Health & Lifestyle", question: "What are their approximate annual out-of-pocket healthcare and prescription costs?", followUp: "Healthcare costs compound over time. " },
  { key: "ltcPlanning", section: "Health & Lifestyle", question: "Have they thought about long-term care planning? (In-home care, assisted living, nursing home) Do they have a preference?", followUp: "Planning now saves stress later. " },
  { key: "lifestyle", section: "Health & Lifestyle", question: "How would they describe their lifestyle spending? (Frugal, moderate, comfortable, lavish) Do they expect this to change in retirement?", followUp: "Lifestyle drives the numbers. " },
  { key: "hobbies", section: "Health & Lifestyle", question: "What are their hobbies and interests? (Some hobbies like golf, boating, or travel have significant cost implications for retirement planning)", followUp: "Good to factor in. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 13: Real Estate (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "primaryHome", section: "Real Estate", question: "Do they own their primary residence? What is the estimated current market value and remaining mortgage balance?", followUp: "Thank you. " },
  { key: "homeEquity", section: "Real Estate", question: "What is their approximate home equity? Have they considered using it strategically? (HELOC, reverse mortgage, downsizing)", followUp: "Home equity is often the largest asset. " },
  { key: "rentalProperties", section: "Real Estate", question: "Do they own any rental or investment properties? For each: location, value, mortgage, monthly rent, cash flow, and management approach.", followUp: "Real estate can be powerful. " },
  { key: "realEstateInterest", section: "Real Estate", question: "Are they interested in acquiring more real estate? (Rental properties, commercial, REITs, real estate syndications, vacation property)", followUp: "Good to know their appetite. " },
  { key: "propertyTaxes", section: "Real Estate", question: "What are their annual property taxes across all properties?", followUp: "Noted. " },
  { key: "homeImprovements", section: "Real Estate", question: "Are any major home improvements or repairs planned? (Roof, HVAC, renovation, addition) Approximate cost and timeline?", followUp: "Good to budget for. " },
  { key: "downsizePlan", section: "Real Estate", question: "Do they plan to downsize, relocate, or sell their home in the foreseeable future? If so, when and where?", followUp: "Housing transitions affect the whole plan. " },
  { key: "realEstateStrategy", section: "Real Estate", question: "Based on their FICO score, what interest rate range would they likely qualify for on a new mortgage or investment property loan?", followUp: "Credit score directly impacts borrowing costs. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 14: Business Interests (8 questions — conditional)
  // ═══════════════════════════════════════════════════════════════
  { key: "businessType", section: "Business Interests", question: "What type of business do they own? (LLC, S-Corp, C-Corp, Partnership, Sole Proprietorship) What industry?", followUp: "Thank you. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessRevenue", section: "Business Interests", question: "What is the annual revenue and approximate net profit of the business?", followUp: "Good metrics. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessEmployees", section: "Business Interests", question: "How many employees does the business have? Do they offer any employee benefits?", followUp: "Noted. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessValuation", section: "Business Interests", question: "Has the business been formally valued? If so, what was the valuation and when? If not, what do they estimate it's worth?", followUp: "Valuation is key for planning. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "successionPlan", section: "Business Interests", question: "Do they have a succession or exit plan for the business? (Sell to partner, sell to outsider, pass to children, ESOP, wind down)", followUp: "Exit planning is critical. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessRetirement", section: "Business Interests", question: "Does the business have a retirement plan? (SEP IRA, SIMPLE IRA, Solo 401k, defined benefit plan) Are they maximizing contributions?", followUp: "Business retirement plans offer powerful tax advantages. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "buySellAgreement", section: "Business Interests", question: "If they have business partners, is there a buy-sell agreement funded by life insurance?", followUp: "Essential for business continuity. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessDebt", section: "Business Interests", question: "Does the business have any outstanding debt? (SBA loans, lines of credit, equipment financing) Have they personally guaranteed any business debt?", followUp: "Personal guarantees affect personal risk. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 15: Advisor Relationship (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "currentAdvisor", section: "Advisor Relationship", question: "Are they currently working with a financial advisor, insurance agent, or wealth manager? If so, for how long?", followUp: "Understood. " },
  { key: "advisorSatisfaction", section: "Advisor Relationship", question: "If they have an existing advisor, what's working well and what's not? What prompted them to explore other options?", followUp: "That's helpful context. ", condition: (d) => d.currentAdvisor && !d.currentAdvisor.toLowerCase().includes("no") && d.currentAdvisor.toLowerCase() !== "none" },
  { key: "communicationPreference", section: "Advisor Relationship", question: "How do they prefer to communicate? (Phone, email, text, video call, in-person) How often do they want to meet? (Monthly, quarterly, annually)", followUp: "We'll match your preference. " },
  { key: "decisionMaker", section: "Advisor Relationship", question: "Who is the primary financial decision-maker in the household? Do both spouses/partners need to be involved in meetings?", followUp: "Important for meeting planning. " },
  { key: "referralSource", section: "Advisor Relationship", question: "How did they hear about us? (Referral, seminar, online, social media, advertising)", followUp: "Thank you. " },
  { key: "expectations", section: "Advisor Relationship", question: "What are their expectations for this advisory relationship? What would make them feel this was the best financial decision they ever made?", followUp: "That's a powerful standard to aim for. " },
  { key: "timeline_urgency", section: "Advisor Relationship", question: "Is there any urgency to getting started? Any deadlines, open enrollment periods, or time-sensitive opportunities?", followUp: "Good to know the timeline. " },
  { key: "additionalNotes", section: "Advisor Relationship", question: "Is there anything else important that we haven't covered? Any concerns, questions, or information you'd like to share?", followUp: "Thank you for being so thorough. " },
];
