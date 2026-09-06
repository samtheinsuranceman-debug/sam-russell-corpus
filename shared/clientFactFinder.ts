// ============================================================
// CLIENT FACT FINDER — the comprehensive financial assessment.
//
// Fifteen sections, ~190 fields: household, every income source, the full
// tax picture, real estate and each mortgage, every debt, every investment
// account, cash and liquidity, monthly cash flow, insurance and risk, the
// practice/business, estate and legacy, asset-protection priorities,
// retirement targets, goals and priorities, and a document checklist.
//
// This one schema drives the questionnaire UI, the stored record, the
// completeness gate the AI Financial Advisor enforces, and the plain-text
// context the advisor is given. Shared by client and server.
// ============================================================

export type FieldType = "money" | "number" | "percent" | "text" | "textarea" | "select" | "boolean" | "date";

export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
  /** Only ask when this other field in the same section has one of these values. */
  showIf?: { key: string; equals: Array<string | boolean> };
};

export type ListSpec = {
  key: string;
  label: string;
  addLabel: string;
  fields: FieldSpec[];
};

export type SectionSpec = {
  id: string;
  title: string;
  intro: string;
  fields: FieldSpec[];
  list?: ListSpec;
};

export type FieldValue = string | number | boolean | null;
export type SectionData = Record<string, FieldValue>;
export type ListRow = Record<string, FieldValue>;

export type ClientFactFinder = {
  version: 1;
  sections: Record<string, SectionData>;
  lists: Record<string, ListRow[]>;
};

export const FACT_FINDER_VERSION = 1 as const;

const YES_NO = ["Yes", "No"];
const PRIORITY = ["1 — Not important", "2", "3 — Important", "4", "5 — Essential"];

export const FACT_FINDER_SECTIONS: SectionSpec[] = [
  {
    id: "household",
    title: "Household",
    intro: "Who the plan is for. Ages and family structure shape every tax, insurance, and legacy decision.",
    fields: [
      { key: "firstName", label: "First name", type: "text", required: true },
      { key: "lastName", label: "Last name", type: "text", required: true },
      { key: "dateOfBirth", label: "Date of birth", type: "date", required: true },
      { key: "maritalStatus", label: "Marital status", type: "select", required: true, options: ["Single", "Married", "Domestic partnership", "Divorced", "Widowed"] },
      { key: "spouseFirstName", label: "Spouse / partner first name", type: "text", showIf: { key: "maritalStatus", equals: ["Married", "Domestic partnership"] } },
      { key: "spouseDateOfBirth", label: "Spouse / partner date of birth", type: "date", showIf: { key: "maritalStatus", equals: ["Married", "Domestic partnership"] } },
      { key: "stateOfResidence", label: "State of residence", type: "text", required: true, hint: "Determines state tax, community-property rules, and asset-protection statutes." },
      { key: "citizenship", label: "Citizenship / residency status", type: "select", options: ["U.S. citizen", "Permanent resident", "Visa holder", "Other"] },
      { key: "dependents", label: "Number of dependents", type: "number", required: true },
      { key: "dependentsDetail", label: "Dependents — names, ages, special needs", type: "textarea" },
      { key: "occupation", label: "Occupation / role", type: "text", required: true },
      { key: "specialty", label: "Medical specialty (if applicable)", type: "text" },
      { key: "employerOrPractice", label: "Employer or practice name", type: "text" },
      { key: "phone", label: "Best phone", type: "text", required: true },
      { key: "email", label: "Email", type: "text", required: true },
      { key: "preferredContact", label: "Preferred way to reach you", type: "select", options: ["Phone", "Text", "Email", "Video call"] },
    ],
  },
  {
    id: "income",
    title: "Income",
    intro: "Every dollar coming in, by source, so nothing is planned around the wrong number.",
    fields: [
      { key: "employmentType", label: "How you are paid", type: "select", required: true, options: ["W-2 employee", "1099 / independent contractor", "Practice owner / partner", "Mixed W-2 and 1099", "Other"] },
      { key: "w2Income", label: "W-2 salary (annual)", type: "money", required: true },
      { key: "bonusIncome", label: "Bonus / incentive comp (annual)", type: "money" },
      { key: "contractorIncome", label: "1099 / self-employment income (annual)", type: "money" },
      { key: "practiceDistributions", label: "K-1 / practice distributions (annual)", type: "money" },
      { key: "rsuOrEquityComp", label: "RSU / equity compensation (annual value)", type: "money" },
      { key: "spouseEmploymentType", label: "Spouse / partner — how paid", type: "select", options: ["Not employed", "W-2 employee", "1099 / self-employed", "Business owner", "Retired"] },
      { key: "spouseIncome", label: "Spouse / partner income (annual)", type: "money", required: true, hint: "Enter 0 if none." },
      { key: "rentalIncome", label: "Net rental income (annual)", type: "money" },
      { key: "investmentIncome", label: "Dividends, interest, capital gains distributions (annual)", type: "money" },
      { key: "otherIncome", label: "Other income (annual)", type: "money" },
      { key: "otherIncomeDetail", label: "Other income — describe", type: "text" },
      { key: "incomeTrajectory", label: "Expected income change in the next 3–5 years", type: "select", required: true, options: ["Rising significantly", "Rising modestly", "Flat", "Declining", "Uncertain"] },
      { key: "incomeTrajectoryDetail", label: "Why? (partnership track, new practice, cutting back…)", type: "textarea" },
    ],
  },
  {
    id: "taxes",
    title: "Taxes",
    intro: "The tax picture is the largest lever in the plan. Last year's return is the best source.",
    fields: [
      { key: "filingStatus", label: "Filing status", type: "select", required: true, options: ["Single", "Married filing jointly", "Married filing separately", "Head of household", "Qualifying surviving spouse"] },
      { key: "adjustedGrossIncome", label: "Adjusted gross income (last return)", type: "money", required: true },
      { key: "federalTaxPaid", label: "Federal income tax paid (last return)", type: "money", required: true },
      { key: "stateTaxPaid", label: "State income tax paid (last return)", type: "money" },
      { key: "marginalBracket", label: "Marginal federal bracket", type: "select", options: ["10%", "12%", "22%", "24%", "32%", "35%", "37%", "Not sure"] },
      { key: "deductionMethod", label: "Standard or itemized deductions", type: "select", options: ["Standard", "Itemized", "Not sure"] },
      { key: "mortgageInterestDeduction", label: "Mortgage interest deducted (annual)", type: "money" },
      { key: "charitableGiving", label: "Charitable giving (annual)", type: "money" },
      { key: "quarterlyEstimates", label: "Quarterly estimated payments (annual total)", type: "money" },
      { key: "capitalGainsRealized", label: "Capital gains realized last year", type: "money" },
      { key: "capitalLossCarryforward", label: "Capital-loss carryforward", type: "money" },
      { key: "retirementContributionsPretax", label: "Pre-tax retirement contributions (annual)", type: "money" },
      { key: "niitExposure", label: "Subject to the 3.8% net investment income tax?", type: "select", options: ["Yes", "No", "Not sure"] },
      { key: "amtExposure", label: "Paid alternative minimum tax?", type: "select", options: ["Yes", "No", "Not sure"] },
      { key: "taxPreparer", label: "Who prepares your return", type: "select", options: ["CPA", "Enrolled agent", "Software / self", "Other"] },
      { key: "priorReturnsAvailable", label: "Can you share the last two returns?", type: "boolean", required: true },
      { key: "taxPain", label: "Your biggest tax frustration", type: "textarea", required: true },
    ],
  },
  {
    id: "realEstate",
    title: "Real Estate & Mortgages",
    intro: "Home equity and mortgage structure are central to the war-chest strategy.",
    fields: [
      { key: "ownsPrimaryHome", label: "Own your primary home?", type: "boolean", required: true },
      { key: "primaryHomeValue", label: "Primary home — current value", type: "money", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "primaryMortgageBalance", label: "Primary mortgage — balance", type: "money", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "primaryMortgageRate", label: "Primary mortgage — interest rate", type: "percent", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "primaryMortgageTermYears", label: "Original term (years)", type: "number", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "primaryMortgageYearsRemaining", label: "Years remaining", type: "number", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "primaryMonthlyPayment", label: "Monthly payment (principal + interest)", type: "money", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "primaryInterestOnly", label: "Interest-only mortgage?", type: "boolean", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "primaryInterestOnlyMonthly", label: "Interest-only monthly payment", type: "money", showIf: { key: "primaryInterestOnly", equals: [true] } },
      { key: "homeEquity", label: "Home equity (value minus all liens)", type: "money", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "helocLimit", label: "HELOC — credit limit", type: "money", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "helocBalance", label: "HELOC — balance", type: "money", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "helocRate", label: "HELOC — rate", type: "percent", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "propertyTaxAnnual", label: "Property tax (annual)", type: "money", showIf: { key: "ownsPrimaryHome", equals: [true] } },
      { key: "rentMonthly", label: "Rent (monthly)", type: "money", showIf: { key: "ownsPrimaryHome", equals: [false] } },
      { key: "housingPlans", label: "Plans to move, refinance, buy, or add a property", type: "textarea" },
    ],
    list: {
      key: "properties",
      label: "Additional properties (rental, vacation, land, office)",
      addLabel: "Add a property",
      fields: [
        { key: "type", label: "Type", type: "select", options: ["Rental", "Vacation", "Land", "Practice / office", "Other"] },
        { key: "value", label: "Value", type: "money" },
        { key: "mortgageBalance", label: "Mortgage balance", type: "money" },
        { key: "rate", label: "Rate", type: "percent" },
        { key: "netRentMonthly", label: "Net rent (monthly)", type: "money" },
      ],
    },
  },
  {
    id: "debts",
    title: "Debts",
    intro: "Every liability, with its rate, so payoff can be sequenced deliberately.",
    fields: [
      { key: "studentLoanBalance", label: "Student loans — balance", type: "money", required: true, hint: "Enter 0 if none." },
      { key: "studentLoanRate", label: "Student loans — weighted rate", type: "percent" },
      { key: "studentLoanPayment", label: "Student loans — monthly payment", type: "money" },
      { key: "studentLoanType", label: "Student loans — type", type: "select", options: ["Federal", "Private", "Mixed", "None"] },
      { key: "studentLoanForgiveness", label: "Pursuing PSLF or another forgiveness track?", type: "select", options: ["Yes", "No", "Not sure"] },
      { key: "practiceLoanBalance", label: "Practice / business loans — balance", type: "money" },
      { key: "practiceLoanRate", label: "Practice / business loans — rate", type: "percent" },
      { key: "autoLoans", label: "Auto loans / leases — balance", type: "money" },
      { key: "creditCardBalance", label: "Credit cards — balance carried", type: "money" },
      { key: "personalLoans", label: "Personal / family loans", type: "money" },
      { key: "otherDebt", label: "Other debt", type: "money" },
      { key: "otherDebtDetail", label: "Other debt — describe", type: "text" },
      { key: "debtStress", label: "Which debt bothers you most, and why?", type: "textarea" },
    ],
  },
  {
    id: "investments",
    title: "Investments & Retirement Accounts",
    intro: "Every account by tax character — taxable, tax-deferred, tax-free — plus how it is invested.",
    fields: [
      { key: "taxableBrokerage", label: "Taxable brokerage — total", type: "money", required: true, hint: "Enter 0 if none." },
      { key: "taxableCostBasis", label: "Taxable brokerage — cost basis (if known)", type: "money" },
      { key: "employerPlanBalance", label: "401(k) / 403(b) / TSP — your balance", type: "money", required: true },
      { key: "employerPlanContributionPct", label: "Your contribution rate", type: "percent" },
      { key: "employerMatchPct", label: "Employer match", type: "percent" },
      { key: "spouseEmployerPlanBalance", label: "Spouse / partner employer plan balance", type: "money" },
      { key: "traditionalIra", label: "Traditional IRA / SEP / SIMPLE", type: "money" },
      { key: "rothIra", label: "Roth IRA", type: "money", required: true },
      { key: "roth401k", label: "Roth 401(k)", type: "money" },
      { key: "backdoorRoth", label: "Doing backdoor / mega-backdoor Roth?", type: "select", options: ["Yes", "No", "Not sure"] },
      { key: "cashBalancePlan", label: "Cash-balance / defined-benefit plan", type: "money" },
      { key: "hsaBalance", label: "HSA balance", type: "money" },
      { key: "plan529", label: "529 / education accounts", type: "money" },
      { key: "annuities", label: "Annuities — total value", type: "money" },
      { key: "annuityDetail", label: "Annuities — type, carrier, guarantees", type: "text" },
      { key: "cryptoAlternatives", label: "Crypto / alternatives", type: "money" },
      { key: "privateInvestments", label: "Private investments (real estate syndications, private equity, oil & gas)", type: "money" },
      { key: "concentratedPosition", label: "Any single holding over 10% of investable assets?", type: "boolean", required: true },
      { key: "concentratedPositionDetail", label: "Concentrated holding — what and how much", type: "text", showIf: { key: "concentratedPosition", equals: [true] } },
      { key: "allocationStocks", label: "Approximate allocation — stocks", type: "percent" },
      { key: "allocationBonds", label: "Approximate allocation — bonds", type: "percent" },
      { key: "allocationCash", label: "Approximate allocation — cash", type: "percent" },
      { key: "riskTolerance", label: "Risk tolerance", type: "select", required: true, options: ["Conservative", "Moderately conservative", "Moderate", "Moderately aggressive", "Aggressive"] },
      { key: "worstYearReaction", label: "If your portfolio fell 30% in a year, you would…", type: "select", required: true, options: ["Sell to stop the losses", "Hold and wait", "Buy more", "Not sure"] },
      { key: "currentAdvisor", label: "Current advisor / custodian", type: "text" },
      { key: "advisoryFees", label: "Advisory fees paid (annual, if known)", type: "money" },
    ],
  },
  {
    id: "cash",
    title: "Cash & Liquidity",
    intro: "What is available on demand — the difference between a plan and a scramble.",
    fields: [
      { key: "checking", label: "Checking", type: "money", required: true },
      { key: "savings", label: "Savings / high-yield", type: "money", required: true },
      { key: "moneyMarketCds", label: "Money market / CDs / T-bills", type: "money" },
      { key: "emergencyFundMonths", label: "Months of expenses covered by cash", type: "number", required: true },
      { key: "liquidityNeeds12mo", label: "Large cash needs in the next 12 months", type: "money" },
      { key: "liquidityNeedsDetail", label: "What for? (tax bill, tuition, buy-in, renovation…)", type: "text" },
      { key: "lineOfCreditAvailable", label: "Unused lines of credit available", type: "money" },
    ],
  },
  {
    id: "cashFlow",
    title: "Cash Flow",
    intro: "What comes in and goes out each month. Savings rate drives everything downstream.",
    fields: [
      { key: "monthlyTakeHome", label: "Household take-home pay (monthly)", type: "money", required: true },
      { key: "monthlyFixedExpenses", label: "Fixed expenses — housing, debt, insurance, childcare (monthly)", type: "money", required: true },
      { key: "monthlyDiscretionary", label: "Discretionary spending (monthly)", type: "money", required: true },
      { key: "monthlySavings", label: "Saved / invested (monthly)", type: "money", required: true },
      { key: "childcareEducation", label: "Childcare + private school (annual)", type: "money" },
      { key: "supportForFamily", label: "Support for parents or other family (annual)", type: "money" },
      { key: "expenseChange5yr", label: "How expenses change in the next 5 years", type: "textarea" },
      { key: "retirementLifestyle", label: "Retirement lifestyle in one sentence", type: "text", required: true },
    ],
  },
  {
    id: "insurance",
    title: "Insurance & Risk",
    intro: "Coverage in force today — life, disability, liability, malpractice, and health.",
    fields: [
      { key: "termLifeDeathBenefit", label: "Term life — death benefit", type: "money", required: true, hint: "Enter 0 if none." },
      { key: "termLifeYearsRemaining", label: "Term life — years remaining", type: "number" },
      { key: "permanentLifeDeathBenefit", label: "Permanent life (whole / IUL / VUL) — death benefit", type: "money" },
      { key: "permanentLifeCashValue", label: "Permanent life — cash value", type: "money" },
      { key: "permanentLifeType", label: "Permanent life — type", type: "select", options: ["None", "Whole life", "Indexed universal life", "Variable universal life", "Guaranteed universal life", "Not sure"] },
      { key: "lifePremiumAnnual", label: "Life premiums (annual, all policies)", type: "money" },
      { key: "spouseLifeDeathBenefit", label: "Spouse / partner life — death benefit", type: "money" },
      { key: "disabilityMonthlyBenefit", label: "Disability — monthly benefit", type: "money", required: true, hint: "Enter 0 if none." },
      { key: "disabilityOwnOccupation", label: "Disability — true own-occupation definition?", type: "select", options: ["Yes", "No", "Not sure"] },
      { key: "disabilitySource", label: "Disability — individual, group, or both", type: "select", options: ["Individual", "Group / employer", "Both", "None"] },
      { key: "malpracticeLimits", label: "Malpractice limits (per claim / aggregate)", type: "text", required: true },
      { key: "malpracticeType", label: "Malpractice — occurrence or claims-made", type: "select", options: ["Occurrence", "Claims-made", "Not sure", "Not applicable"] },
      { key: "tailCoverage", label: "Tail coverage arranged?", type: "select", options: ["Yes", "No", "Not sure", "Not applicable"] },
      { key: "umbrellaLimit", label: "Umbrella liability limit", type: "money" },
      { key: "ltcCoverage", label: "Long-term-care coverage", type: "select", options: ["None", "Traditional LTC", "Hybrid life/LTC", "Not sure"] },
      { key: "healthPlanType", label: "Health plan type", type: "select", options: ["Employer PPO/HMO", "High-deductible (HSA-eligible)", "Marketplace", "Other"] },
      { key: "coverageGapsConcern", label: "Any coverage you suspect is missing or inadequate?", type: "textarea" },
    ],
  },
  {
    id: "practice",
    title: "Practice & Business",
    intro: "For owners and partners: how the practice is structured and where it is headed.",
    fields: [
      { key: "ownsPractice", label: "Own or partner in a practice / business?", type: "boolean", required: true },
      { key: "entityType", label: "Entity type", type: "select", options: ["Sole proprietor", "LLC", "S-corp", "C-corp", "Partnership / group", "Professional corporation"], showIf: { key: "ownsPractice", equals: [true] } },
      { key: "ownershipPct", label: "Your ownership", type: "percent", showIf: { key: "ownsPractice", equals: [true] } },
      { key: "annualRevenue", label: "Annual revenue", type: "money", showIf: { key: "ownsPractice", equals: [true] } },
      { key: "netIncome", label: "Net income to you", type: "money", showIf: { key: "ownsPractice", equals: [true] } },
      { key: "employeeCount", label: "Employees", type: "number", showIf: { key: "ownsPractice", equals: [true] } },
      { key: "practiceRetirementPlan", label: "Practice retirement plan", type: "select", options: ["None", "401(k)", "401(k) + profit sharing", "Cash-balance / defined benefit", "SEP / SIMPLE", "Not sure"], showIf: { key: "ownsPractice", equals: [true] } },
      { key: "buySellAgreement", label: "Buy-sell agreement in place (and funded)?", type: "select", options: ["Yes, funded", "Yes, unfunded", "No", "Not sure"], showIf: { key: "ownsPractice", equals: [true] } },
      { key: "practiceValuation", label: "Estimated practice value", type: "money", showIf: { key: "ownsPractice", equals: [true] } },
      { key: "practiceDebt", label: "Practice debt", type: "money", showIf: { key: "ownsPractice", equals: [true] } },
      { key: "exitTimeline", label: "Sale / succession / exit timeline", type: "select", options: ["Under 3 years", "3–7 years", "7–15 years", "No plans", "Not sure"], showIf: { key: "ownsPractice", equals: [true] } },
      { key: "successionPlan", label: "Succession plan — describe", type: "textarea", showIf: { key: "ownsPractice", equals: [true] } },
      { key: "partnershipTrack", label: "On a partnership / buy-in track?", type: "select", options: ["Yes", "No", "Not applicable"], showIf: { key: "ownsPractice", equals: [false] } },
    ],
  },
  {
    id: "estate",
    title: "Estate & Legacy",
    intro: "What is in place today, and what you want to happen with everything you build.",
    fields: [
      { key: "hasWill", label: "Current will?", type: "boolean", required: true },
      { key: "hasRevocableTrust", label: "Revocable living trust?", type: "boolean", required: true },
      { key: "hasIrrevocableTrust", label: "Irrevocable trust (ILIT, asset-protection, etc.)?", type: "boolean" },
      { key: "trustDetail", label: "Trusts — describe", type: "text" },
      { key: "poaFinancial", label: "Durable financial power of attorney?", type: "boolean" },
      { key: "healthcareDirective", label: "Healthcare directive / medical POA?", type: "boolean" },
      { key: "beneficiariesReviewed", label: "Beneficiary designations reviewed in the last 2 years?", type: "select", options: ["Yes", "No", "Not sure"] },
      { key: "guardianNamed", label: "Guardian named for minor children?", type: "select", options: ["Yes", "No", "Not applicable"] },
      { key: "charitableIntent", label: "Charitable / philanthropic intent", type: "select", options: ["None", "Some", "Significant", "Central to my plan"] },
      { key: "plannedGifting", label: "Planned gifting to family (annual)", type: "money" },
      { key: "inheritanceExpected", label: "Inheritance you expect to receive", type: "money" },
      { key: "heirs", label: "Who should inherit, and how (outright, in trust, staged)", type: "textarea", required: true },
      { key: "legacyGoals", label: "What you want your money to do after you", type: "textarea", required: true },
    ],
  },
  {
    id: "protection",
    title: "Asset Protection Priorities",
    intro: "How much the plan should be built to survive divorce, lawsuits, and creditors.",
    fields: [
      { key: "divorceProtectionPriority", label: "Divorce protection", type: "select", required: true, options: PRIORITY },
      { key: "creditorProtectionPriority", label: "Creditor / lawsuit protection", type: "select", required: true, options: PRIORITY },
      { key: "taxFreeIncomePriority", label: "Tax-free future income", type: "select", required: true, options: PRIORITY },
      { key: "prenup", label: "Prenuptial / postnuptial agreement?", type: "select", options: ["Yes", "No", "Not applicable"] },
      { key: "litigationExposure", label: "Litigation exposure you worry about", type: "textarea" },
      { key: "existingStructures", label: "Asset-protection structures already in place", type: "textarea" },
    ],
  },
  {
    id: "retirement",
    title: "Retirement",
    intro: "When, on how much, and from where.",
    fields: [
      { key: "targetRetirementAge", label: "Target retirement age", type: "number", required: true },
      { key: "spouseTargetRetirementAge", label: "Spouse / partner target retirement age", type: "number" },
      { key: "desiredRetirementIncomeMonthly", label: "Desired retirement income (monthly, today's dollars)", type: "money", required: true },
      { key: "socialSecuritySelf", label: "Social Security estimate — you (monthly at full retirement age)", type: "money" },
      { key: "socialSecuritySpouse", label: "Social Security estimate — spouse (monthly)", type: "money" },
      { key: "pensionIncome", label: "Pension income (monthly)", type: "money" },
      { key: "longevityAssumption", label: "Plan to age", type: "number", hint: "Many physician plans run to 95." },
      { key: "workOptional", label: "Work-optional or part-time phase planned?", type: "select", options: ["Yes", "No", "Not sure"] },
      { key: "relocationPlans", label: "Relocation in retirement (state / country)", type: "text" },
      { key: "retirementConcern", label: "Biggest retirement worry", type: "textarea", required: true },
    ],
  },
  {
    id: "goals",
    title: "Goals & Priorities",
    intro: "The questions that tell us what 'made it' means to you.",
    fields: [
      { key: "topGoals", label: "Your top three financial goals, in order", type: "textarea", required: true },
      { key: "fiveYearGoals", label: "5-year goals", type: "textarea" },
      { key: "tenYearGoals", label: "10-year goals", type: "textarea" },
      { key: "biggestConcern", label: "What worries you most about money?", type: "textarea", required: true },
      { key: "advisorFailures", label: "What have past advisors failed to do for you?", type: "textarea" },
      { key: "moreMoneyScenario", label: "With 2–3× the money and three more years, what would you do differently?", type: "textarea" },
      { key: "healthFamilyConsiderations", label: "Health or family considerations the plan must survive", type: "textarea" },
      { key: "decisionMakers", label: "Who else is part of financial decisions?", type: "text" },
      { key: "timelineToAct", label: "How soon do you want to act?", type: "select", required: true, options: ["Immediately", "Within 3 months", "This year", "Exploring"] },
    ],
  },
  {
    id: "documents",
    title: "Documents",
    intro: "What you can share so the analysis rests on facts, not estimates.",
    fields: [
      { key: "taxReturns", label: "Last two tax returns", type: "select", required: true, options: ["Will provide", "Provided", "Not available"] },
      { key: "payStubs", label: "Recent pay stubs / K-1s", type: "select", options: ["Will provide", "Provided", "Not available"] },
      { key: "accountStatements", label: "Investment and retirement statements", type: "select", options: ["Will provide", "Provided", "Not available"] },
      { key: "mortgageStatements", label: "Mortgage / HELOC statements", type: "select", options: ["Will provide", "Provided", "Not available", "Not applicable"] },
      { key: "insurancePolicies", label: "Insurance policies (life, disability, malpractice)", type: "select", options: ["Will provide", "Provided", "Not available"] },
      { key: "estateDocuments", label: "Will / trust documents", type: "select", options: ["Will provide", "Provided", "Not available", "Not applicable"] },
      { key: "notes", label: "Anything else we should know", type: "textarea" },
    ],
  },
];

// ─── helpers ────────────────────────────────────────────────────────────────

export function emptyFactFinder(): ClientFactFinder {
  const sections: Record<string, SectionData> = {};
  const lists: Record<string, ListRow[]> = {};
  for (const s of FACT_FINDER_SECTIONS) {
    sections[s.id] = {};
    if (s.list) lists[s.list.key] = [];
  }
  return { version: FACT_FINDER_VERSION, sections, lists };
}

export function isBlank(v: FieldValue | undefined): boolean {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

/** Whether a field is currently asked, given its section's answers. */
export function fieldVisible(field: FieldSpec, data: SectionData): boolean {
  if (!field.showIf) return true;
  const v = data[field.showIf.key];
  return field.showIf.equals.some((e) => e === v);
}

export type Completeness = {
  percent: number;
  answered: number;
  required: number;
  complete: boolean;
  missing: Array<{ section: string; sectionId: string; field: string; key: string }>;
  sectionPercent: Record<string, number>;
};

/**
 * Completeness over REQUIRED, currently-visible fields. `complete` is what the
 * AI Financial Advisor checks before it will answer a planning question.
 */
export function factFinderCompleteness(ff: ClientFactFinder | null | undefined): Completeness {
  const missing: Completeness["missing"] = [];
  const sectionPercent: Record<string, number> = {};
  let answered = 0;
  let required = 0;
  for (const s of FACT_FINDER_SECTIONS) {
    const data = ff?.sections?.[s.id] ?? {};
    let sReq = 0;
    let sAns = 0;
    for (const f of s.fields) {
      if (!f.required || !fieldVisible(f, data)) continue;
      sReq += 1;
      required += 1;
      if (!isBlank(data[f.key])) { sAns += 1; answered += 1; }
      else missing.push({ section: s.title, sectionId: s.id, field: f.label, key: f.key });
    }
    sectionPercent[s.id] = sReq === 0 ? 100 : Math.round((sAns / sReq) * 100);
  }
  const percent = required === 0 ? 100 : Math.round((answered / required) * 100);
  return { percent, answered, required, complete: missing.length === 0 && required > 0, missing, sectionPercent };
}

function fmt(field: FieldSpec, v: FieldValue): string {
  if (isBlank(v)) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (field.type === "money" && typeof v === "number") return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  if (field.type === "percent" && typeof v === "number") return `${v}%`;
  return String(v);
}

/**
 * Plain-text rendering of every answered field, section by section — the
 * context handed to the AI Financial Advisor, and the body of the printable
 * Financial Analysis Document.
 */
export function factFinderSummary(ff: ClientFactFinder | null | undefined, opts: { includeBlank?: boolean } = {}): string {
  if (!ff) return "";
  const out: string[] = [];
  for (const s of FACT_FINDER_SECTIONS) {
    const data = ff.sections?.[s.id] ?? {};
    const lines: string[] = [];
    for (const f of s.fields) {
      if (!fieldVisible(f, data)) continue;
      const v = data[f.key];
      if (isBlank(v) && !opts.includeBlank) continue;
      lines.push(`- ${f.label}: ${fmt(f, v ?? null)}`);
    }
    if (s.list) {
      const rows = ff.lists?.[s.list.key] ?? [];
      rows.forEach((row, i) => {
        const parts = s.list!.fields.filter((f) => !isBlank(row[f.key])).map((f) => `${f.label} ${fmt(f, row[f.key] ?? null)}`);
        if (parts.length) lines.push(`- ${s.list!.label} #${i + 1}: ${parts.join(", ")}`);
      });
    }
    if (lines.length) out.push(`## ${s.title}\n${lines.join("\n")}`);
  }
  return out.join("\n\n");
}

/** Total questions asked when every conditional branch is open. */
export function factFinderFieldCount(): number {
  return FACT_FINDER_SECTIONS.reduce((n, s) => n + s.fields.length + (s.list?.fields.length ?? 0), 0);
}
