/**
 * Household Wealth Engine — Multigenerational IUL + Mortgage Killer Calculation Engine
 *
 * Assumptions:
 * - 7.5% annual growth rate on IUL policies (NAIC AG 49 max illustrated rate)
 * - 5% loan rate on each policy (+0.5% positive arbitrage)
 * - 6% load fee on every new annual premium
 * - 80% of surrender value can be loaned against
 * - Spouse premium = 80% of primary premium
 * - Parent death benefit must be >= 2x child's (unless child has massive income/net worth)
 * - Grandchild death benefit limited to 50% of parent's
 * - Home equity loans at fixed 6% for grandchildren (70% LTV)
 * - Real estate appreciates 5% annually
 * - Rental income = 5% gross of property value (if "Rent the Basement" enabled)
 * - Interest savings compound at 6.25% annually
 * - Long-term care rider: 4% of death benefit over 24 months
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PolicyHolder {
  name: string;
  age: number;
  annualPremium: number;
  deathBenefit: number;
  relationship: "primary" | "spouse" | "child" | "grandchild";
  parentId?: string; // for children/grandchildren linking
}

export interface PolicyYearData {
  year: number;
  age: number;
  premiumPaid: number;
  loadFee: number;
  netPremium: number;
  growthCredit: number;
  loanDrag: number;
  accountValue: number;
  surrenderValue: number;
  loanableValue: number; // 80% of surrender
  cumulativePremiums: number;
  deathBenefit: number;
  ltcMonthlyBenefit: number; // 4% of DB / 24
  loansOutstanding: number;
  netCashValue: number; // surrender - loans
}

export interface MortgageKillerResult {
  originalTotalInterest: number;
  acceleratedTotalInterest: number;
  interestSaved: number;
  yearsToPayoff: number;
  originalYears: number;
  monthlyPayment: number;
  amortization: AmortizationRow[];
  interestGrowth: InterestGrowthRow[]; // saved interest growing at 6.25%
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  extraPrincipal: number;
}

export interface InterestGrowthRow {
  year: number;
  interestSaved: number;
  compoundedValue: number;
}

export interface HelocTracker {
  year: number;
  helocBalance: number;
  helocInterest: number;
  helocPayment: number;
  cumulativeInterest: number;
}

export interface HouseholdSimulationInput {
  // Primary
  primaryAge: number;
  primaryAnnualPremium: number;
  primaryDeathBenefit: number;
  primaryHomeValue: number;
  primaryHomeEquity: number;
  primaryMortgageBalance: number;
  primaryMortgageRate: number;
  primaryMortgageYearsLeft: number;
  // Spouse
  spouseAge: number;
  spouseName: string;
  // Children
  children: ChildInput[];
  // Grandchildren
  grandchildren: GrandchildInput[];
  // Options
  rentBasement: boolean;
  helocRate: number; // default 6%
  simulationYears: number; // default 50
}

export interface ChildInput {
  id: string;
  name: string;
  age: number;
  income: number;
  ira: number;
  rothIra: number;
  cash: number;
  homeValue: number;
  homeEquity: number;
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsLeft: number;
  totalInterest: number;
}

export interface GrandchildInput {
  id: string;
  name: string;
  age: number;
  parentId: string;
  // Employment & Income
  occupation: string;
  employer: string;
  earnedIncome: number;
  otherIncome: number;
  filingStatus: 'single' | 'married' | 'hoh';
  // Real Estate
  homeValue: number;
  homeEquity: number;
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsLeft: number;
  totalInterest: number;
  monthlyMortgagePayment: number;
  propertyTax: number;
  homeInsurance: number;
  // Retirement & Savings
  checking: number;
  savings: number;
  ira: number;
  rothIra: number;
  fourOhOneK: number;
  otherInvestments: number;
  // Debt
  studentDebtBalance: number;
  studentDebtRate: number;
  studentDebtMonthlyPayment: number;
  autoLoanBalance: number;
  autoLoanMonthlyPayment: number;
  creditCardDebt: number;
  creditCardMonthlyPayment: number;
  otherDebtBalance: number;
  otherDebtMonthlyPayment: number;
  // Monthly Expenses
  monthlyExpenses: number;
  // Insurance
  hasHealthInsurance: boolean;
  hasLifeInsurance: boolean;
  existingLifeInsuranceCoverage: number;
  hasDisabilityInsurance: boolean;
}

export interface FamilyPolicyResult {
  name: string;
  relationship: string;
  annualPremium: number;
  deathBenefit: number;
  years: PolicyYearData[];
  ltcRider: { monthlyBenefit: number; totalBenefit: number; durationMonths: number };
}

export interface HouseholdSimulationResult {
  policies: FamilyPolicyResult[];
  mortgageKillerResults: {
    name: string;
    relationship: string;
    result: MortgageKillerResult;
  }[];
  helocTracking: HelocTracker[];
  realEstateAppreciation: { year: number; primaryValue: number; totalFamilyValue: number; rentalIncome: number }[];
  familyWealthRecapture: {
    year: number;
    totalInterestSaved: number;
    compoundedValue: number;
    totalPolicyCashValue: number;
    totalDeathBenefit: number;
    totalFamilyWealth: number;
  }[];
  summary: {
    totalPremiumsPaid: number;
    totalAccountValue: number;
    totalSurrenderValue: number;
    totalDeathBenefit: number;
    totalInterestSaved: number;
    wealthRecaptureValue: number;
    totalLtcProtection: number;
    totalRealEstateValue: number;
    totalRentalIncome: number;
    totalHelocInterestPaid: number;
    netFamilyWealth: number;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GROWTH_RATE = 0.075; // NAIC AG 49 max illustrated rate
const LOAN_DRAG = 0.05;
const LOAD_FEE = 0.06;
const LOANABLE_PCT = 0.80;
const SPOUSE_PREMIUM_RATIO = 0.80;
const CHILD_DB_RATIO = 0.50; // parent must have 2x child, so child = 50% of parent
const GRANDCHILD_DB_RATIO = 0.50; // grandchild = 50% of parent (child)
const RE_APPRECIATION = 0.05;
const RENTAL_YIELD = 0.05;
const INTEREST_COMPOUND_RATE = 0.0625;
const GRANDCHILD_HELOC_LTV = 0.70;
const GRANDCHILD_HELOC_RATE = 0.06;
const LTC_PAYOUT_RATE = 0.04; // 4% of DB
const LTC_DURATION_MONTHS = 24;
const LOAN_START_MONTH = 13; // loans begin month 13

// ─── Policy Simulation ──────────────────────────────────────────────────────

export function simulatePolicy(
  name: string,
  relationship: string,
  age: number,
  annualPremium: number,
  deathBenefit: number,
  years: number,
  fundingSource?: "self" | "parent_loan" | "grandparent_loan",
  loanStartYear?: number
): FamilyPolicyResult {
  const policyYears: PolicyYearData[] = [];
  let accountValue = 0;
  let cumulativePremiums = 0;
  let loansOutstanding = 0;

  for (let y = 1; y <= years; y++) {
    const currentAge = age + y;
    const premiumPaid = annualPremium;
    const loadFee = premiumPaid * LOAD_FEE;
    const netPremium = premiumPaid - loadFee;

    cumulativePremiums += premiumPaid;

    // Add net premium to account
    accountValue += netPremium;

    // Growth credit on the full account value
    const growthCredit = accountValue * GROWTH_RATE;
    accountValue += growthCredit;

    // Loan drag on outstanding loans
    const loanDrag = loansOutstanding * LOAN_DRAG;
    accountValue = Math.max(0, accountValue - loanDrag);

    // Surrender value (account value minus early surrender charges, simplified)
    const surrenderCharge = y <= 10 ? Math.max(0, (10 - y) / 10 * 0.10) : 0;
    const surrenderValue = Math.max(0, accountValue * (1 - surrenderCharge));
    const loanableValue = surrenderValue * LOANABLE_PCT;

    // Death benefit grows with account value if it exceeds initial DB
    const currentDB = Math.max(deathBenefit, accountValue * 1.05);

    // LTC rider
    const ltcMonthlyBenefit = (currentDB * LTC_PAYOUT_RATE) / LTC_DURATION_MONTHS * LTC_DURATION_MONTHS;

    const netCashValue = surrenderValue - loansOutstanding;

    policyYears.push({
      year: y,
      age: currentAge,
      premiumPaid,
      loadFee,
      netPremium,
      growthCredit,
      loanDrag,
      accountValue: Math.round(accountValue * 100) / 100,
      surrenderValue: Math.round(surrenderValue * 100) / 100,
      loanableValue: Math.round(loanableValue * 100) / 100,
      cumulativePremiums: Math.round(cumulativePremiums * 100) / 100,
      deathBenefit: Math.round(currentDB * 100) / 100,
      ltcMonthlyBenefit: Math.round((currentDB * LTC_PAYOUT_RATE) / LTC_DURATION_MONTHS * 100) / 100,
      loansOutstanding: Math.round(loansOutstanding * 100) / 100,
      netCashValue: Math.round(netCashValue * 100) / 100,
    });
  }

  const ltcRider = {
    monthlyBenefit: policyYears.length > 0
      ? Math.round((policyYears[policyYears.length - 1].deathBenefit * LTC_PAYOUT_RATE) / LTC_DURATION_MONTHS * 100) / 100
      : 0,
    totalBenefit: policyYears.length > 0
      ? Math.round(policyYears[policyYears.length - 1].deathBenefit * LTC_PAYOUT_RATE * 100) / 100
      : 0,
    durationMonths: LTC_DURATION_MONTHS,
  };

  return {
    name,
    relationship,
    annualPremium,
    deathBenefit,
    years: policyYears,
    ltcRider,
  };
}

// ─── Mortgage Killer ─────────────────────────────────────────────────────────

export function runMortgageKiller(
  mortgageBalance: number,
  mortgageRate: number,
  yearsLeft: number,
  extraMonthlyPrincipal: number
): MortgageKillerResult {
  const monthlyRate = mortgageRate / 12;
  const totalMonths = yearsLeft * 12;

  // Standard monthly payment
  const monthlyPayment = mortgageBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  // Original amortization (no extra payments)
  let origBalance = mortgageBalance;
  let origTotalInterest = 0;
  for (let m = 1; m <= totalMonths && origBalance > 0; m++) {
    const interest = origBalance * monthlyRate;
    origTotalInterest += interest;
    const principal = Math.min(monthlyPayment - interest, origBalance);
    origBalance -= principal;
  }

  // Accelerated amortization
  let balance = mortgageBalance;
  let totalInterest = 0;
  const amortization: AmortizationRow[] = [];
  let month = 0;

  while (balance > 0.01 && month < totalMonths) {
    month++;
    const interest = balance * monthlyRate;
    totalInterest += interest;
    let principal = monthlyPayment - interest;
    const extra = Math.min(extraMonthlyPrincipal, balance - principal);
    principal += extra;
    principal = Math.min(principal, balance);
    balance = Math.max(0, balance - principal);

    amortization.push({
      month,
      payment: Math.round((monthlyPayment + extra) * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      extraPrincipal: Math.round(extra * 100) / 100,
    });
  }

  const interestSaved = origTotalInterest - totalInterest;

  // Interest savings growing at 6.25% compound
  const interestGrowth: InterestGrowthRow[] = [];
  let compounded = interestSaved;
  for (let y = 1; y <= 40; y++) {
    compounded *= (1 + INTEREST_COMPOUND_RATE);
    interestGrowth.push({
      year: y,
      interestSaved: Math.round(interestSaved * 100) / 100,
      compoundedValue: Math.round(compounded * 100) / 100,
    });
  }

  return {
    originalTotalInterest: Math.round(origTotalInterest * 100) / 100,
    acceleratedTotalInterest: Math.round(totalInterest * 100) / 100,
    interestSaved: Math.round(interestSaved * 100) / 100,
    yearsToPayoff: Math.round((month / 12) * 10) / 10,
    originalYears: yearsLeft,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    amortization,
    interestGrowth,
  };
}

// ─── HELOC Tracking ──────────────────────────────────────────────────────────

export function simulateHeloc(
  initialBalance: number,
  rate: number,
  annualPayment: number,
  years: number
): HelocTracker[] {
  const tracker: HelocTracker[] = [];
  let balance = initialBalance;
  let cumInterest = 0;

  for (let y = 1; y <= years; y++) {
    const interest = balance * rate;
    cumInterest += interest;
    const payment = Math.min(annualPayment, balance + interest);
    balance = Math.max(0, balance + interest - payment);

    tracker.push({
      year: y,
      helocBalance: Math.round(balance * 100) / 100,
      helocInterest: Math.round(interest * 100) / 100,
      helocPayment: Math.round(payment * 100) / 100,
      cumulativeInterest: Math.round(cumInterest * 100) / 100,
    });

    if (balance <= 0.01) break;
  }

  return tracker;
}

// ─── Full Household Simulation ───────────────────────────────────────────────

export function runHouseholdSimulation(input: HouseholdSimulationInput): HouseholdSimulationResult {
  const years = input.simulationYears || 50;

  // ── 1. Simulate all policies ──────────────────────────────────────────────

  // Primary policy
  const primaryPolicy = simulatePolicy(
    "Primary Owner",
    "primary",
    input.primaryAge,
    input.primaryAnnualPremium,
    input.primaryDeathBenefit,
    years
  );

  // Spouse policy (80% of primary premium)
  const spousePremium = input.primaryAnnualPremium * SPOUSE_PREMIUM_RATIO;
  const spouseDB = input.primaryDeathBenefit * SPOUSE_PREMIUM_RATIO;
  const spousePolicy = simulatePolicy(
    input.spouseName || "Spouse",
    "spouse",
    input.spouseAge,
    spousePremium,
    spouseDB,
    years,
    "parent_loan",
    2 // funded from month 13 = year 2
  );

  // Children policies
  const childPolicies = input.children.map(child => {
    const childDB = input.primaryDeathBenefit * CHILD_DB_RATIO;
    const childPremium = input.primaryAnnualPremium * CHILD_DB_RATIO;
    return simulatePolicy(
      child.name,
      "child",
      child.age,
      childPremium,
      childDB,
      years,
      "parent_loan"
    );
  });

  // Grandchildren policies
  const grandchildPolicies = input.grandchildren.map(gc => {
    const parentChild = input.children.find(c => c.id === gc.parentId);
    const parentDB = input.primaryDeathBenefit * CHILD_DB_RATIO;
    const gcDB = parentDB * GRANDCHILD_DB_RATIO;
    const gcPremium = input.primaryAnnualPremium * CHILD_DB_RATIO * GRANDCHILD_DB_RATIO;
    return simulatePolicy(
      gc.name,
      "grandchild",
      gc.age,
      gcPremium,
      gcDB,
      years,
      "grandparent_loan"
    );
  });

  const allPolicies = [primaryPolicy, spousePolicy, ...childPolicies, ...grandchildPolicies];

  // ── 2. Mortgage Killer for each family member ─────────────────────────────

  const mortgageResults: { name: string; relationship: string; result: MortgageKillerResult }[] = [];

  // Primary mortgage killer
  if (input.primaryMortgageBalance > 0) {
    // Extra principal from policy loans (available after year 2)
    const extraMonthly = input.primaryAnnualPremium * 0.3 / 12; // 30% of premium as extra
    const result = runMortgageKiller(
      input.primaryMortgageBalance,
      input.primaryMortgageRate,
      input.primaryMortgageYearsLeft,
      extraMonthly
    );
    mortgageResults.push({ name: "Primary Owner", relationship: "primary", result });
  }

  // Children mortgage killer (parent uses their policy + home equity)
  input.children.forEach(child => {
    if (child.mortgageBalance > 0) {
      const extraMonthly = (input.primaryAnnualPremium * CHILD_DB_RATIO * 0.4) / 12;
      const result = runMortgageKiller(
        child.mortgageBalance,
        child.mortgageRate,
        child.mortgageYearsLeft,
        extraMonthly
      );
      mortgageResults.push({ name: child.name, relationship: "child", result });
    }
  });

  // Grandchildren mortgage killer (70% HELOC at 6%)
  input.grandchildren.forEach(gc => {
    if (gc.mortgageBalance > 0) {
      const extraMonthly = (gc.homeEquity * GRANDCHILD_HELOC_LTV * 0.05) / 12;
      const result = runMortgageKiller(
        gc.mortgageBalance,
        gc.mortgageRate,
        gc.mortgageYearsLeft,
        extraMonthly
      );
      mortgageResults.push({ name: gc.name, relationship: "grandchild", result });
    }
  });

  // ── 3. HELOC tracking ─────────────────────────────────────────────────────

  const totalHelocNeeded = input.grandchildren.reduce((sum, gc) => {
    return sum + gc.homeEquity * GRANDCHILD_HELOC_LTV;
  }, 0);

  // HELOC paid back by excess interest credits from policies
  const avgAnnualExcess = allPolicies.reduce((sum, p) => {
    const lastYear = p.years[Math.min(9, p.years.length - 1)];
    return sum + (lastYear ? lastYear.growthCredit * 0.3 : 0);
  }, 0);

  const helocTracking = totalHelocNeeded > 0
    ? simulateHeloc(totalHelocNeeded, input.helocRate || 0.06, avgAnnualExcess, years)
    : [];

  // ── 4. Real estate appreciation ───────────────────────────────────────────

  const realEstateAppreciation = [];
  let primaryHomeVal = input.primaryHomeValue;
  for (let y = 1; y <= years; y++) {
    primaryHomeVal *= (1 + RE_APPRECIATION);
    const childrenHomeVal = input.children.reduce((sum, c) => sum + c.homeValue * Math.pow(1 + RE_APPRECIATION, y), 0);
    const gcHomeVal = input.grandchildren.reduce((sum, gc) => sum + gc.homeValue * Math.pow(1 + RE_APPRECIATION, y), 0);
    const totalVal = primaryHomeVal + childrenHomeVal + gcHomeVal;
    const rentalIncome = input.rentBasement ? totalVal * RENTAL_YIELD : 0;

    realEstateAppreciation.push({
      year: y,
      primaryValue: Math.round(primaryHomeVal * 100) / 100,
      totalFamilyValue: Math.round(totalVal * 100) / 100,
      rentalIncome: Math.round(rentalIncome * 100) / 100,
    });
  }

  // ── 5. Family Wealth Recapture ────────────────────────────────────────────

  const totalInterestSaved = mortgageResults.reduce((sum, mr) => sum + mr.result.interestSaved, 0);
  const familyWealthRecapture = [];
  let compoundedSavings = totalInterestSaved;

  for (let y = 1; y <= years; y++) {
    compoundedSavings *= (1 + INTEREST_COMPOUND_RATE);

    const totalPolicyCash = allPolicies.reduce((sum, p) => {
      const yearData = p.years[y - 1];
      return sum + (yearData ? yearData.surrenderValue : 0);
    }, 0);

    const totalDB = allPolicies.reduce((sum, p) => {
      const yearData = p.years[y - 1];
      return sum + (yearData ? yearData.deathBenefit : 0);
    }, 0);

    const reVal = realEstateAppreciation[y - 1]?.totalFamilyValue ?? 0;
    const helocBal = helocTracking[y - 1]?.helocBalance ?? 0;

    familyWealthRecapture.push({
      year: y,
      totalInterestSaved: Math.round(totalInterestSaved * 100) / 100,
      compoundedValue: Math.round(compoundedSavings * 100) / 100,
      totalPolicyCashValue: Math.round(totalPolicyCash * 100) / 100,
      totalDeathBenefit: Math.round(totalDB * 100) / 100,
      totalFamilyWealth: Math.round((compoundedSavings + totalPolicyCash + reVal - helocBal) * 100) / 100,
    });
  }

  // ── 6. Summary ────────────────────────────────────────────────────────────

  const lastYear = years - 1;
  const totalPremiumsPaid = allPolicies.reduce((sum, p) => {
    const last = p.years[lastYear];
    return sum + (last ? last.cumulativePremiums : 0);
  }, 0);

  const totalAccountValue = allPolicies.reduce((sum, p) => {
    const last = p.years[lastYear];
    return sum + (last ? last.accountValue : 0);
  }, 0);

  const totalSurrenderValue = allPolicies.reduce((sum, p) => {
    const last = p.years[lastYear];
    return sum + (last ? last.surrenderValue : 0);
  }, 0);

  const totalDeathBenefit = allPolicies.reduce((sum, p) => {
    const last = p.years[lastYear];
    return sum + (last ? last.deathBenefit : 0);
  }, 0);

  const totalLtcProtection = allPolicies.reduce((sum, p) => sum + p.ltcRider.totalBenefit, 0);

  const totalRealEstateValue = realEstateAppreciation[lastYear]?.totalFamilyValue ?? 0;
  const totalRentalIncome = realEstateAppreciation.reduce((sum, r) => sum + r.rentalIncome, 0);
  const totalHelocInterestPaid = helocTracking.reduce((sum, h) => sum + h.helocInterest, 0);
  const wealthRecaptureValue = familyWealthRecapture[lastYear]?.compoundedValue ?? 0;

  return {
    policies: allPolicies,
    mortgageKillerResults: mortgageResults,
    helocTracking,
    realEstateAppreciation,
    familyWealthRecapture,
    summary: {
      totalPremiumsPaid: Math.round(totalPremiumsPaid * 100) / 100,
      totalAccountValue: Math.round(totalAccountValue * 100) / 100,
      totalSurrenderValue: Math.round(totalSurrenderValue * 100) / 100,
      totalDeathBenefit: Math.round(totalDeathBenefit * 100) / 100,
      totalInterestSaved: Math.round(totalInterestSaved * 100) / 100,
      wealthRecaptureValue: Math.round(wealthRecaptureValue * 100) / 100,
      totalLtcProtection: Math.round(totalLtcProtection * 100) / 100,
      totalRealEstateValue: Math.round(totalRealEstateValue * 100) / 100,
      totalRentalIncome: Math.round(totalRentalIncome * 100) / 100,
      totalHelocInterestPaid: Math.round(totalHelocInterestPaid * 100) / 100,
      netFamilyWealth: Math.round((totalAccountValue + totalRealEstateValue + wealthRecaptureValue - totalHelocInterestPaid) * 100) / 100,
    },
  };
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
