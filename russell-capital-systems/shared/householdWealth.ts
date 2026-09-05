/**
 * Household Wealth Engine v4 — Multigenerational IUL + Mortgage Killer
 *
 * Methodology (same as Mortgage Killer v4):
 * 1. Take 70% LTV HELOC → fund IUL years 1-2
 * 2. Take 80% life loan from year 2 surrender value → principal-only mortgage payment
 * 3. Take new 70% LTV HELOC (appreciated home) → fund IUL year 3
 * 4. Take 80% life loan → principal-only mortgage payment
 * 5. Continue through year 5 max, including interest credits applied to principal
 *
 * Multi-generational flow:
 * - Parents apply formula to themselves, leftover IUL credits → children's mortgages
 * - Children's mortgages paid simultaneously or one-at-a-time (user toggle)
 * - Grandchildren funded by excess from parents + children IUL credits
 * - Grandchildren's 70% HELOC → proportional payback to parents' IUL
 *
 * Assumptions:
 * - 7.5% annual growth rate on IUL policies (NAIC AG 49 max illustrated rate)
 * - 5% loan drag on policy loans (+0.5% positive arbitrage)
 * - 6% load fee on every new annual premium
 * - 80% of surrender value can be loaned against (life loan)
 * - 70% LTV on home equity line of credit
 * - Spouse premium = 80% of primary premium
 * - Parent death benefit must be >= 2x child's
 * - Grandchild death benefit limited to 50% of parent's
 * - Real estate appreciates 5% annually
 * - Rental income = 5% gross of property value (if enabled)
 * - Interest savings compound at 6.25% annually
 * - Long-term care rider: 4% of death benefit over 24 months
 * - IUL payment schedule NEVER exceeds 5 years
 */

// ─── Constants ───────────────────────────────────────────────────────────────
const GROWTH_RATE = 0.075;
const LOAN_DRAG = 0.05;
const LOAD_FEE = 0.06;
const LOANABLE_PCT = 0.80;
const HELOC_LTV = 0.70;
const MAX_PREMIUM_YEARS = 5;
const SPOUSE_PREMIUM_RATIO = 0.80;
const CHILD_DB_RATIO = 0.50;
const GRANDCHILD_DB_RATIO = 0.50;
const RE_APPRECIATION = 0.05;
const RENTAL_YIELD = 0.05;
const INTEREST_COMPOUND_RATE = 0.0625;
const LTC_PAYOUT_RATE = 0.04;
const LTC_DURATION_MONTHS = 24;
const HOME_APPRECIATION_RATE = 0.05;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PolicyHolder {
  name: string;
  age: number;
  annualPremium: number;
  deathBenefit: number;
  relationship: "primary" | "spouse" | "child" | "grandchild";
  parentId?: string;
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
  loanableValue: number;
  cumulativePremiums: number;
  deathBenefit: number;
  ltcMonthlyBenefit: number;
  loansOutstanding: number;
  netCashValue: number;
  lifeLoanThisYear: number;
  interestCredit: number;
  interestCreditAppliedToPrincipal: number;
  excessInterestCredit: number;
}

export interface MortgageKillerResult {
  originalTotalInterest: number;
  acceleratedTotalInterest: number;
  interestSaved: number;
  yearsToPayoff: number;
  originalYears: number;
  monthlyPayment: number;
  amortization: AmortizationRow[];
  interestGrowth: InterestGrowthRow[];
  cascadingProjection: MortgageCascadeRow[];
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  extraPrincipal: number;
  source: string;
}

export interface InterestGrowthRow {
  year: number;
  interestSaved: number;
  compoundedValue: number;
}

export interface MortgageCascadeRow {
  year: number;
  homeValue: number;
  homeEquity: number;
  helocBalance: number;
  helocInterestPaid: number;
  iulPremium: number;
  iulCashValue: number;
  iulSurrenderValue: number;
  iulInterestCredit: number;
  lifeLoanAmount: number;
  lifeLoanCumulative: number;
  mortgageBalance: number;
  mortgageInterestPaid: number;
  principalOnlyPayment: number;
  principalPaymentSource: string;
  mortgageMonthlyPayment: number;
  homeAppreciation: number;
  netWorth: number;
}

export interface HelocTracker {
  year: number;
  helocBalance: number;
  helocInterest: number;
  helocPayment: number;
  cumulativeInterest: number;
}

export interface HouseholdSimulationInput {
  primaryAge: number;
  primaryAnnualPremium: number;
  primaryDeathBenefit: number;
  primaryHomeValue: number;
  primaryHomeEquity: number;
  primaryMortgageBalance: number;
  primaryMortgageRate: number;
  primaryMortgageYearsLeft: number;
  spouseAge: number;
  spouseName: string;
  children: ChildInput[];
  grandchildren: GrandchildInput[];
  rentBasement: boolean;
  helocRate: number;
  simulationYears: number;
  payChildrenSimultaneously: boolean;
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
  occupation: string;
  employer: string;
  earnedIncome: number;
  otherIncome: number;
  filingStatus: "single" | "married" | "hoh";
  homeValue: number;
  homeEquity: number;
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsLeft: number;
  totalInterest: number;
  monthlyMortgagePayment: number;
  propertyTax: number;
  homeInsurance: number;
  checking: number;
  savings: number;
  ira: number;
  rothIra: number;
  fourOhOneK: number;
  otherInvestments: number;
  studentDebtBalance: number;
  studentDebtRate: number;
  studentDebtMonthlyPayment: number;
  autoLoanBalance: number;
  autoLoanMonthlyPayment: number;
  creditCardDebt: number;
  creditCardMonthlyPayment: number;
  otherDebtBalance: number;
  otherDebtMonthlyPayment: number;
  monthlyExpenses: number;
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

export interface GenerationalCascadeRow {
  year: number;
  parentHomeValue: number;
  parentHomeEquity: number;
  parentHelocBalance: number;
  parentIulCashValue: number;
  parentIulSurrenderValue: number;
  parentIulInterestCredit: number;
  parentLifeLoan: number;
  parentMortgageBalance: number;
  parentPrincipalPayment: number;
  parentExcessCredit: number;
  childrenMortgageBalance: number;
  childrenPrincipalPayment: number;
  childrenPrincipalSource: string;
  grandchildrenMortgageBalance: number;
  grandchildrenPrincipalPayment: number;
  grandchildrenPrincipalSource: string;
  grandchildrenHelocBalance: number;
  totalFamilyMortgage: number;
  totalFamilyNetWorth: number;
  totalInterestSaved: number;
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
  generationalCascade: GenerationalCascadeRow[];
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

// ─── IUL Policy Simulation (v4: with life loan tracking) ─────────────────────

export function simulatePolicy(
  name: string,
  relationship: string,
  age: number,
  annualPremium: number,
  deathBenefit: number,
  years: number,
  _fundingSource?: string,
  _startYear?: number
): FamilyPolicyResult {
  const policyYears: PolicyYearData[] = [];
  let accountValue = 0;
  let cumulativePremiums = 0;
  let loansOutstanding = 0;

  for (let y = 1; y <= years; y++) {
    const currentAge = age + y;
    const premiumPaid = y <= MAX_PREMIUM_YEARS ? annualPremium : 0;
    const loadFee = premiumPaid * LOAD_FEE;
    const netPremium = premiumPaid - loadFee;
    cumulativePremiums += premiumPaid;

    accountValue += netPremium;
    const growthCredit = accountValue * GROWTH_RATE;
    accountValue += growthCredit;

    const loanDragCost = loansOutstanding * LOAN_DRAG;
    accountValue = Math.max(0, accountValue - loanDragCost);

    const surrenderCharge = y <= 10 ? Math.max(0, (10 - y) / 10 * 0.10) : 0;
    const surrenderValue = Math.max(0, accountValue * (1 - surrenderCharge));
    const loanableValue = surrenderValue * LOANABLE_PCT;

    let lifeLoanThisYear = 0;
    let interestCreditAppliedToPrincipal = 0;
    let excessInterestCredit = 0;

    if (y >= 2 && y <= MAX_PREMIUM_YEARS) {
      // 80% life loan from surrender value
      const netLoanable = Math.max(0, loanableValue - loansOutstanding);
      if (netLoanable > 0) {
        lifeLoanThisYear = Math.round(netLoanable);
      }
    } else if (y > MAX_PREMIUM_YEARS) {
      // After premium years: interest credits + incremental life loan
      const netLoanable = Math.max(0, loanableValue - loansOutstanding);
      if (netLoanable > 0) {
        lifeLoanThisYear = Math.round(netLoanable);
      }
      interestCreditAppliedToPrincipal = Math.round(growthCredit * 0.80);
      excessInterestCredit = Math.round(growthCredit * 0.20);
    }

    loansOutstanding += lifeLoanThisYear;

    const currentDB = Math.max(deathBenefit, accountValue * 1.05);
    const netCashValue = surrenderValue - loansOutstanding;

    policyYears.push({
      year: y,
      age: currentAge,
      premiumPaid,
      loadFee,
      netPremium,
      growthCredit: Math.round(growthCredit * 100) / 100,
      loanDrag: Math.round(loanDragCost * 100) / 100,
      accountValue: Math.round(accountValue * 100) / 100,
      surrenderValue: Math.round(surrenderValue * 100) / 100,
      loanableValue: Math.round(loanableValue * 100) / 100,
      cumulativePremiums: Math.round(cumulativePremiums * 100) / 100,
      deathBenefit: Math.round(currentDB * 100) / 100,
      ltcMonthlyBenefit: Math.round((currentDB * LTC_PAYOUT_RATE) / LTC_DURATION_MONTHS * 100) / 100,
      loansOutstanding: Math.round(loansOutstanding * 100) / 100,
      netCashValue: Math.round(netCashValue * 100) / 100,
      lifeLoanThisYear: Math.round(lifeLoanThisYear),
      interestCredit: Math.round(growthCredit),
      interestCreditAppliedToPrincipal,
      excessInterestCredit,
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

  return { name, relationship, annualPremium, deathBenefit, years: policyYears, ltcRider };
}

// ─── Mortgage Killer v4 (HELOC → IUL → Life Loan → Principal-Only) ──────────

export function runMortgageKiller(
  mortgageBalance: number,
  mortgageRate: number,
  yearsLeft: number,
  homeValue: number,
  annualPremium: number,
  policyYears: PolicyYearData[],
  helocRate: number = 0.085
): MortgageKillerResult {
  const monthlyRate = mortgageRate / 12;
  const totalMonths = yearsLeft * 12;

  const monthlyPayment = mortgageBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  // Original amortization (no extra payments)
  let origBalance = mortgageBalance;
  let origTotalInterest = 0;
  for (let m = 1; m <= totalMonths && origBalance > 0.01; m++) {
    const interest = origBalance * monthlyRate;
    origTotalInterest += interest;
    const principal = Math.min(monthlyPayment - interest, origBalance);
    origBalance -= principal;
  }

  // Accelerated amortization with life loans + interest credits
  let balance = mortgageBalance;
  let totalInterest = 0;
  const amortization: AmortizationRow[] = [];
  let month = 0;
  const mortgageBalanceByYear: number[] = [];

  while (balance > 0.01 && month < totalMonths) {
    month++;
    const interest = balance * monthlyRate;
    totalInterest += interest;
    let principal = Math.min(monthlyPayment - interest, balance);
    let extraPrincipal = 0;
    let source = "regular";

    const currentYear = Math.ceil(month / 12);
    const isYearEnd = month % 12 === 0;

    if (isYearEnd && currentYear >= 2) {
      const py = policyYears.find(p => p.year === currentYear);
      if (py) {
        const lifeLoan = py.lifeLoanThisYear;
        const creditPrincipal = py.interestCreditAppliedToPrincipal;
        const totalExtra = lifeLoan + creditPrincipal;
        if (totalExtra > 0) {
          extraPrincipal = Math.min(totalExtra, balance - principal);
          source = currentYear <= MAX_PREMIUM_YEARS
            ? `80% Life Loan ($${lifeLoan.toLocaleString()})`
            : `IUL Credit + Loan ($${totalExtra.toLocaleString()})`;
        }
      }
    }

    principal = Math.min(principal + extraPrincipal, balance);
    balance = Math.max(0, balance - principal);

    amortization.push({
      month, payment: Math.round((monthlyPayment + extraPrincipal) * 100) / 100,
      principal: Math.round(principal * 100) / 100, interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      extraPrincipal: Math.round(extraPrincipal * 100) / 100, source,
    });

    if (isYearEnd || balance <= 0.01) {
      mortgageBalanceByYear[currentYear - 1] = Math.round(balance);
    }
  }

  const payoffYear = Math.ceil(month / 12);
  for (let y = payoffYear; y <= 30; y++) {
    if (mortgageBalanceByYear[y - 1] === undefined) mortgageBalanceByYear[y - 1] = 0;
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

  // Build cascading projection
  const cascadingProjection: MortgageCascadeRow[] = [];
  let helocBalance = 0;
  let cumulativeHelocInterest = 0;

  for (let y = 1; y <= 30; y++) {
    const hv = homeValue * Math.pow(1 + HOME_APPRECIATION_RATE, y);
    const prevHv = y === 1 ? homeValue : homeValue * Math.pow(1 + HOME_APPRECIATION_RATE, y - 1);
    const appreciation = hv - prevHv;
    const mortBal = y <= mortgageBalanceByYear.length ? mortgageBalanceByYear[y - 1] : 0;

    if (y <= MAX_PREMIUM_YEARS) {
      const maxCapacity = hv * HELOC_LTV;
      const available = Math.max(0, maxCapacity - mortBal - helocBalance);
      const draw = Math.min(annualPremium, available);
      helocBalance += draw;
    }

    const helocInterest = helocBalance * helocRate;
    cumulativeHelocInterest += helocInterest;

    if (mortBal <= 0 && helocBalance > 0) {
      const repay = Math.min(helocBalance, monthlyPayment * 12);
      helocBalance = Math.max(0, helocBalance - repay);
    }

    const homeEquity = hv - mortBal - helocBalance;
    const py = policyYears.find(p => p.year === y);

    let principalPayment = 0;
    let principalSource = "\u2014";
    if (py) {
      if (py.lifeLoanThisYear > 0 && y >= 2 && y <= MAX_PREMIUM_YEARS) {
        principalPayment = py.lifeLoanThisYear;
        principalSource = "80% Life Loan";
      } else if (y > MAX_PREMIUM_YEARS && (py.lifeLoanThisYear > 0 || py.interestCreditAppliedToPrincipal > 0)) {
        principalPayment = py.lifeLoanThisYear + py.interestCreditAppliedToPrincipal;
        principalSource = "IUL Credit + Loan";
      }
    }

    cascadingProjection.push({
      year: y,
      homeValue: Math.round(hv),
      homeEquity: Math.round(homeEquity),
      helocBalance: Math.round(helocBalance),
      helocInterestPaid: Math.round(helocInterest),
      iulPremium: py?.premiumPaid ?? 0,
      iulCashValue: py?.accountValue ?? 0,
      iulSurrenderValue: py?.surrenderValue ?? 0,
      iulInterestCredit: py?.interestCredit ?? 0,
      lifeLoanAmount: py?.lifeLoanThisYear ?? 0,
      lifeLoanCumulative: py?.loansOutstanding ?? 0,
      mortgageBalance: Math.round(mortBal),
      mortgageInterestPaid: Math.round(mortBal > 0 ? mortBal * mortgageRate : 0),
      principalOnlyPayment: Math.round(principalPayment),
      principalPaymentSource: principalSource,
      mortgageMonthlyPayment: mortBal > 0 ? Math.round(monthlyPayment) : 0,
      homeAppreciation: Math.round(appreciation),
      netWorth: Math.round(homeEquity + (py?.netCashValue ?? 0)),
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
    cascadingProjection,
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

  while (tracker.length < years) {
    tracker.push({
      year: tracker.length + 1,
      helocBalance: 0, helocInterest: 0, helocPayment: 0,
      cumulativeInterest: Math.round(cumInterest * 100) / 100,
    });
  }
  return tracker;
}

// ─── Main Simulation ─────────────────────────────────────────────────────────

export function runHouseholdSimulation(input: HouseholdSimulationInput): HouseholdSimulationResult {
  const years = input.simulationYears || 50;
  const paySimultaneously = input.payChildrenSimultaneously ?? true;

  // ── 1. Simulate all policies ──────────────────────────────────────────────

  const primaryPolicy = simulatePolicy(
    "Primary Owner", "primary", input.primaryAge,
    input.primaryAnnualPremium, input.primaryDeathBenefit, years
  );

  const spousePremium = input.primaryAnnualPremium * SPOUSE_PREMIUM_RATIO;
  const spouseDB = input.primaryDeathBenefit * SPOUSE_PREMIUM_RATIO;
  const spousePolicy = simulatePolicy(
    input.spouseName || "Spouse", "spouse", input.spouseAge,
    spousePremium, spouseDB, years, "parent_loan", 2
  );

  const childPolicies = input.children.map(child => {
    const childDB = input.primaryDeathBenefit * CHILD_DB_RATIO;
    const childPremium = input.primaryAnnualPremium * CHILD_DB_RATIO;
    return simulatePolicy(child.name, "child", child.age, childPremium, childDB, years, "parent_loan");
  });

  const grandchildPolicies = input.grandchildren.map(gc => {
    const parentDB = input.primaryDeathBenefit * CHILD_DB_RATIO;
    const gcDB = parentDB * GRANDCHILD_DB_RATIO;
    const gcPremium = input.primaryAnnualPremium * CHILD_DB_RATIO * GRANDCHILD_DB_RATIO;
    return simulatePolicy(gc.name, "grandchild", gc.age, gcPremium, gcDB, years, "grandparent_loan");
  });

  const allPolicies = [primaryPolicy, spousePolicy, ...childPolicies, ...grandchildPolicies];

  // ── 2. Mortgage Killer v4 for each family member ──────────────────────────

  const mortgageResults: { name: string; relationship: string; result: MortgageKillerResult }[] = [];

  // Primary mortgage killer (HELOC → IUL → 80% life loan → principal-only)
  if (input.primaryMortgageBalance > 0) {
    const result = runMortgageKiller(
      input.primaryMortgageBalance,
      input.primaryMortgageRate,
      input.primaryMortgageYearsLeft,
      input.primaryHomeValue,
      input.primaryAnnualPremium,
      primaryPolicy.years,
      input.helocRate || 0.085
    );
    mortgageResults.push({ name: "Primary Owner", relationship: "primary", result });
  }

  // Collect excess credits from parents' policies
  const parentExcessByYear: number[] = [];
  for (let y = 0; y < years; y++) {
    const primaryExcess = primaryPolicy.years[y]?.excessInterestCredit ?? 0;
    const spouseExcess = spousePolicy.years[y]?.excessInterestCredit ?? 0;
    parentExcessByYear.push(primaryExcess + spouseExcess);
  }

  // Children mortgage killer
  if (paySimultaneously) {
    const childrenWithMortgage = input.children.filter(c => c.mortgageBalance > 0);
    const numChildren = childrenWithMortgage.length;

    childrenWithMortgage.forEach((child, idx) => {
      const childPolicy = childPolicies[idx];
      if (!childPolicy) return;

      const augmentedYears = childPolicy.years.map((py, yIdx) => {
        const parentShare = numChildren > 0 ? Math.round(parentExcessByYear[yIdx] / numChildren) : 0;
        return {
          ...py,
          lifeLoanThisYear: py.lifeLoanThisYear + parentShare,
          interestCreditAppliedToPrincipal: py.interestCreditAppliedToPrincipal + parentShare,
        };
      });

      const result = runMortgageKiller(
        child.mortgageBalance, child.mortgageRate, child.mortgageYearsLeft,
        child.homeValue, input.primaryAnnualPremium * CHILD_DB_RATIO,
        augmentedYears, input.helocRate || 0.085
      );
      mortgageResults.push({ name: child.name, relationship: "child", result });
    });
  } else {
    const childrenWithMortgage = input.children.filter(c => c.mortgageBalance > 0);
    let remainingExcess = [...parentExcessByYear];

    childrenWithMortgage.forEach((child, idx) => {
      const childPolicy = childPolicies[idx];
      if (!childPolicy) return;

      const augmentedYears = childPolicy.years.map((py, yIdx) => {
        const parentShare = Math.round(remainingExcess[yIdx] ?? 0);
        return {
          ...py,
          lifeLoanThisYear: py.lifeLoanThisYear + parentShare,
          interestCreditAppliedToPrincipal: py.interestCreditAppliedToPrincipal + parentShare,
        };
      });

      const result = runMortgageKiller(
        child.mortgageBalance, child.mortgageRate, child.mortgageYearsLeft,
        child.homeValue, input.primaryAnnualPremium * CHILD_DB_RATIO,
        augmentedYears, input.helocRate || 0.085
      );
      mortgageResults.push({ name: child.name, relationship: "child", result });

      const payoffYear = Math.ceil(result.yearsToPayoff);
      for (let y = 0; y < payoffYear && y < remainingExcess.length; y++) {
        remainingExcess[y] = 0;
      }
    });
  }

  // Grandchildren mortgage killer
  const childExcessByYear: number[] = [];
  for (let y = 0; y < years; y++) {
    let childExcess = 0;
    for (const cp of childPolicies) {
      childExcess += cp.years[y]?.excessInterestCredit ?? 0;
    }
    childExcessByYear.push(childExcess);
  }

  input.grandchildren.forEach((gc, idx) => {
    if (gc.mortgageBalance <= 0) return;
    const gcPolicy = grandchildPolicies[idx];
    if (!gcPolicy) return;

    const numGrandchildren = input.grandchildren.filter(g => g.mortgageBalance > 0).length;

    const augmentedYears = gcPolicy.years.map((py, yIdx) => {
      const parentShare = numGrandchildren > 0
        ? Math.round((parentExcessByYear[yIdx] * 0.5 + childExcessByYear[yIdx]) / numGrandchildren)
        : 0;
      return {
        ...py,
        lifeLoanThisYear: py.lifeLoanThisYear + parentShare,
        interestCreditAppliedToPrincipal: py.interestCreditAppliedToPrincipal + parentShare,
      };
    });

    const result = runMortgageKiller(
      gc.mortgageBalance, gc.mortgageRate, gc.mortgageYearsLeft,
      gc.homeValue, input.primaryAnnualPremium * CHILD_DB_RATIO * GRANDCHILD_DB_RATIO,
      augmentedYears, input.helocRate || 0.085
    );
    mortgageResults.push({ name: gc.name, relationship: "grandchild", result });
  });

  // ── 3. HELOC tracking (grandchildren HELOC → payback to parents' IUL) ────

  const totalGcHeloc = input.grandchildren.reduce((sum, gc) => {
    return sum + gc.homeEquity * HELOC_LTV;
  }, 0);

  const avgAnnualExcess = allPolicies.reduce((sum, p) => {
    const postPremiumYears = p.years.filter(y => y.year > MAX_PREMIUM_YEARS);
    if (postPremiumYears.length === 0) return sum;
    const avgExcess = postPremiumYears.reduce((s, y) => s + y.excessInterestCredit, 0) / postPremiumYears.length;
    return sum + avgExcess;
  }, 0);

  const helocTracking = totalGcHeloc > 0
    ? simulateHeloc(totalGcHeloc, input.helocRate || 0.06, avgAnnualExcess, years)
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

  // ── 6. Generational Cascade (30-year projection) ──────────────────────────

  const generationalCascade: GenerationalCascadeRow[] = [];
  let cumulativeInterestSaved = 0;

  for (let y = 1; y <= Math.min(30, years); y++) {
    const py = primaryPolicy.years[y - 1];
    const parentHV = input.primaryHomeValue * Math.pow(1 + RE_APPRECIATION, y);
    const parentMortResult = mortgageResults.find(m => m.relationship === "primary");
    const parentMortBal = parentMortResult?.result.cascadingProjection[y - 1]?.mortgageBalance ?? 0;
    const parentHelocBal = parentMortResult?.result.cascadingProjection[y - 1]?.helocBalance ?? 0;
    const parentEquity = parentHV - parentMortBal - parentHelocBal;

    let childMortBal = 0;
    let childPrincipalPmt = 0;
    let childPrincipalSrc = "\u2014";
    const childMortResults = mortgageResults.filter(m => m.relationship === "child");
    for (const cm of childMortResults) {
      const cascade = cm.result.cascadingProjection[y - 1];
      if (cascade) {
        childMortBal += cascade.mortgageBalance;
        childPrincipalPmt += cascade.principalOnlyPayment;
        if (cascade.principalOnlyPayment > 0) {
          childPrincipalSrc = cascade.principalPaymentSource;
        }
      }
    }

    let gcMortBal = 0;
    let gcPrincipalPmt = 0;
    let gcPrincipalSrc = "\u2014";
    let gcHelocBal = 0;
    const gcMortResults = mortgageResults.filter(m => m.relationship === "grandchild");
    for (const gm of gcMortResults) {
      const cascade = gm.result.cascadingProjection[y - 1];
      if (cascade) {
        gcMortBal += cascade.mortgageBalance;
        gcPrincipalPmt += cascade.principalOnlyPayment;
        gcHelocBal += cascade.helocBalance;
        if (cascade.principalOnlyPayment > 0) {
          gcPrincipalSrc = cascade.principalPaymentSource;
        }
      }
    }

    const totalFamilyMortgage = parentMortBal + childMortBal + gcMortBal;
    const totalFamilyRE = realEstateAppreciation[y - 1]?.totalFamilyValue ?? 0;
    const totalPolicyCash = allPolicies.reduce((s, p) => s + (p.years[y - 1]?.surrenderValue ?? 0), 0);
    const totalHelocBal = parentHelocBal + gcHelocBal + (helocTracking[y - 1]?.helocBalance ?? 0);

    const yearInterestSaved = mortgageResults.reduce((s, mr) => {
      const orig = mr.result.originalTotalInterest / mr.result.originalYears;
      const accel = y <= mr.result.yearsToPayoff
        ? mr.result.acceleratedTotalInterest / mr.result.yearsToPayoff
        : 0;
      return s + Math.max(0, orig - accel);
    }, 0);
    cumulativeInterestSaved += yearInterestSaved;

    generationalCascade.push({
      year: y,
      parentHomeValue: Math.round(parentHV),
      parentHomeEquity: Math.round(parentEquity),
      parentHelocBalance: Math.round(parentHelocBal),
      parentIulCashValue: py?.accountValue ?? 0,
      parentIulSurrenderValue: py?.surrenderValue ?? 0,
      parentIulInterestCredit: py?.interestCredit ?? 0,
      parentLifeLoan: py?.lifeLoanThisYear ?? 0,
      parentMortgageBalance: Math.round(parentMortBal),
      parentPrincipalPayment: parentMortResult?.result.cascadingProjection[y - 1]?.principalOnlyPayment ?? 0,
      parentExcessCredit: py?.excessInterestCredit ?? 0,
      childrenMortgageBalance: Math.round(childMortBal),
      childrenPrincipalPayment: Math.round(childPrincipalPmt),
      childrenPrincipalSource: childPrincipalSrc,
      grandchildrenMortgageBalance: Math.round(gcMortBal),
      grandchildrenPrincipalPayment: Math.round(gcPrincipalPmt),
      grandchildrenPrincipalSource: gcPrincipalSrc,
      grandchildrenHelocBalance: Math.round(gcHelocBal),
      totalFamilyMortgage: Math.round(totalFamilyMortgage),
      totalFamilyNetWorth: Math.round(totalFamilyRE + totalPolicyCash - totalHelocBal - totalFamilyMortgage),
      totalInterestSaved: Math.round(cumulativeInterestSaved),
    });
  }

  // ── 7. Summary ────────────────────────────────────────────────────────────

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
    generationalCascade,
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
