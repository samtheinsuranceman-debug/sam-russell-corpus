/**
 * Mortgage Killer Engine v4 — IUL-Funded HELOC Mortgage Acceleration
 *
 * Strategy:
 * 1. Take 70% LTV HELOC to fund IUL premium years 1-2
 * 2. At end of year 2, take 80% life loan of surrender value → principal-only mortgage payment
 * 3. Take new 70% LTV HELOC (based on appreciated home value) to fund IUL year 3
 * 4. At end of year 3, take 80% life loan → principal-only mortgage payment
 * 5. Repeat through year 5 (max IUL payment schedule)
 * 6. After year 5: IUL interest credits applied as principal-only payments each year
 * 7. Home appreciates 5% annually, updating HELOC capacity
 * 8. Track all values for 30-year cascading projection
 *
 * AG 49 Compliance: 7.5% max illustrated rate
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MortgageKillerInput {
  mortgageBalance: number;
  mortgageRate: number;
  mortgageTermMonths: number;
  monthlyMortgagePayment: number;
  monthlyInterestOnlyPayment: number;
  totalInterestPayments: number;
  homeEquityValue: number;
  homeMarketValue: number;
  iraValue: number;
  cashValue: number;
  investments: number;
  annuities: number;
  otherInvestments: number;
  cryptocurrency: number;
  annualIncome: number;
  incomeAllocationPct?: number;
  iulCreditRate?: number;
  premiumYears?: number;
  helocRate?: number;
  helocLtvPct?: number;
  helocDrawPct?: number;
  policyLoanPct?: number;
  policyLoanDragRate?: number;
  interestReinvestRate?: number;
  interestReinvestYears?: number;
  clientAge?: number;
}

export interface AmortizationRow {
  month: number;
  year: number;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  extraPrincipal?: number;
  source?: "regular" | "iul_loan" | "iul_credit" | "heloc";
}

export interface IULPolicyYear {
  year: number;
  premium: number;
  premiumSource: "heloc" | "income" | "none";
  cashValue: number;
  surrenderValue: number;
  policyLoan: number;
  policyLoanAppliedTo: "mortgage_principal";
  netCashValue: number;
  cumulativePolicyLoans: number;
  loanDragCost: number;
  loanableValue: number;
  interestCredit: number;
  interestCreditAppliedToPrincipal: number;
}

export interface HELOCYear {
  year: number;
  drawAmount: number;
  purpose: string;
  balance: number;
  interestPaid: number;
  cumulativeInterest: number;
  repaymentFromSavings: number;
}

export interface CascadingProjectionYear {
  year: number;
  homeValue: number;
  homeEquity: number;
  helocBalance: number;
  helocInterestPaid: number;
  helocInterestOnlyPayment: number;
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

export interface InterestSavingsRow {
  year: number;
  interestSaved: number;
  cumulativeSaved: number;
  compoundedValue: number;
  mgaAnnuityValue: number;
}

export interface MortgageKillerResult {
  currentPlan: {
    schedule: AmortizationRow[];
    totalInterest: number;
    totalPayments: number;
    payoffMonths: number;
    monthlyPayment: number;
  };
  recommendedPlan: {
    schedule: AmortizationRow[];
    totalInterest: number;
    totalPayments: number;
    payoffMonths: number;
    monthlyPayment: number;
    extraPayments: { month: number; amount: number; source: string }[];
  };
  iulPolicy: IULPolicyYear[];
  helocSchedule: HELOCYear[];
  cascadingProjection: CascadingProjectionYear[];
  interestSavings: {
    totalInterestSaved: number;
    compoundedValue20yr: number;
    mgaAnnuityValue30yr: number;
    yearByYear: InterestSavingsRow[];
  };
  summary: {
    yearsSaved: number;
    monthsSaved: number;
    totalInterestSaved: number;
    totalWealthCreated: number;
    mortgageFreeDate: string;
    originalPayoffDate: string;
    annualIulPremium: number;
    totalIulPremiums: number;
    totalPolicyLoans: number;
    totalHelocDrawn: number;
    totalHelocInterest: number;
    finalPolicyCashValue: number;
    totalAssets: number;
    debtFreeYear: number;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const HOME_APPRECIATION_RATE = 0.05;
const MAX_PREMIUM_YEARS = 5;
const HELOC_LTV_DEFAULT = 0.70;
const LIFE_LOAN_PCT = 0.80;
const MGA_RATE = 0.0625;

// ─── Current Plan: Standard Amortization ─────────────────────────────────────

export function buildStandardAmortization(
  balance: number,
  annualRate: number,
  termMonths: number,
  monthlyPayment?: number
): AmortizationRow[] {
  const monthlyRate = annualRate / 12;
  if (!monthlyPayment || monthlyPayment <= 0) {
    monthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
  }
  const rows: AmortizationRow[] = [];
  let remaining = balance;
  let cumInterest = 0;
  let cumPrincipal = 0;
  for (let m = 1; m <= termMonths && remaining > 0.01; m++) {
    const interest = remaining * monthlyRate;
    const principal = Math.min(monthlyPayment - interest, remaining);
    const payment = interest + principal;
    cumInterest += interest;
    cumPrincipal += principal;
    remaining = Math.max(0, remaining - principal);
    rows.push({
      month: m,
      year: Math.ceil(m / 12),
      beginningBalance: Math.round((remaining + principal) * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      endingBalance: Math.round(remaining * 100) / 100,
      cumulativeInterest: Math.round(cumInterest * 100) / 100,
      cumulativePrincipal: Math.round(cumPrincipal * 100) / 100,
    });
  }
  return rows;
}

// ─── IUL Policy Projection (v4) ─────────────────────────────────────────────

function projectIulPolicy(
  annualPremium: number,
  projectionYears: number,
  creditRate: number,
  premiumYears: number,
  lifeLoanPct: number,
  loanDragRate: number,
  issueAge: number,
  mortgagePaidOffYear: number
): IULPolicyYear[] {
  let cv = 0;
  let cumulativePolicyLoans = 0;
  const rows: IULPolicyYear[] = [];
  const specifiedAmount = annualPremium * 10;
  const perUnitCharge = (specifiedAmount / 1000) * 7.78;

  for (let y = 1; y <= projectionYears; y++) {
    const age = issueAge + y;
    const premium = y <= premiumYears ? annualPremium : 0;
    const premiumLoadRate = y === 1 ? 0.08 : (y <= premiumYears ? 0.06 : 0);
    const premiumLoad = premium * premiumLoadRate;
    const perPolicyCharge = 120;
    const perUnitCost = y <= 10 ? perUnitCharge : 0;
    const netAmountAtRisk = Math.max(0, specifiedAmount * 1.5 - cv);
    const baseCOIRate = age <= 40 ? 0.0008 : age <= 50 ? 0.0012 : age <= 55 ? 0.0018 :
      age <= 60 ? 0.0028 : age <= 65 ? 0.0042 : age <= 70 ? 0.0065 :
      age <= 75 ? 0.0100 : age <= 80 ? 0.0160 : age <= 85 ? 0.0220 :
      age <= 90 ? 0.0180 : age <= 95 ? 0.0080 : 0;
    const coiCharge = netAmountAtRisk * baseCOIRate;
    const conditionalCredit = y >= 11 ? cv * 0.002 : 0;
    const netPremium = premium - premiumLoad;
    const beginningValue = cv + netPremium;
    const totalCharges = perPolicyCharge + perUnitCost + coiCharge;
    const afterCharges = Math.max(0, beginningValue - totalCharges + conditionalCredit);
    const interestEarned = afterCharges * creditRate;
    cv = afterCharges + interestEarned;

    const baseCharge = annualPremium * 0.376;
    let surrenderCharge = 0;
    if (y <= 3) surrenderCharge = baseCharge;
    else if (y < 11) surrenderCharge = baseCharge * ((11 - y) / 7);
    const surrenderValue = Math.max(0, cv - surrenderCharge);

    const loanDragCost = cumulativePolicyLoans * loanDragRate;

    // Life loan strategy:
    // Year 2: take 80% of surrender value as life loan → principal-only mortgage payment
    // Years 3-5: take 80% of NEW surrender value (incremental) → principal-only
    // After year 5: interest credits applied to principal-only mortgage payment
    let policyLoan = 0;
    let loanableValue = 0;
    let interestCreditAppliedToPrincipal = 0;

    if (y <= mortgagePaidOffYear) {
      if (y >= 2 && y <= premiumYears) {
        // During premium years (starting year 2): take 80% of surrender value as life loan
        const grossLoanable = surrenderValue * lifeLoanPct;
        const netLoanable = Math.max(0, grossLoanable - cumulativePolicyLoans);
        if (netLoanable > 0) {
          policyLoan = Math.round(netLoanable);
          loanableValue = policyLoan;
        }
      } else if (y > premiumYears) {
        // After premium years: apply interest credits + incremental life loan
        const grossLoanable = surrenderValue * lifeLoanPct;
        const netLoanable = Math.max(0, grossLoanable - cumulativePolicyLoans);
        if (netLoanable > 0) {
          policyLoan = Math.round(netLoanable);
          loanableValue = policyLoan;
        }
        // Interest credit portion applied to mortgage principal
        interestCreditAppliedToPrincipal = Math.round(interestEarned * 0.80);
      }
    }

    cumulativePolicyLoans += policyLoan;
    const premiumSource: "heloc" | "income" | "none" = y <= premiumYears ? "heloc" : "none";

    rows.push({
      year: y,
      premium: Math.round(premium),
      premiumSource,
      cashValue: Math.round(cv),
      surrenderValue: Math.round(surrenderValue),
      policyLoan,
      policyLoanAppliedTo: "mortgage_principal",
      netCashValue: Math.round(cv - cumulativePolicyLoans),
      cumulativePolicyLoans: Math.round(cumulativePolicyLoans),
      loanDragCost: Math.round(loanDragCost),
      loanableValue,
      interestCredit: Math.round(interestEarned),
      interestCreditAppliedToPrincipal,
    });
  }
  return rows;
}

// ─── HELOC Schedule (v4: 70% LTV, fund IUL yr 1-2, then yr 3+) ─────────────

function buildHelocSchedule(
  initialHomeValue: number,
  existingMortgageBalance: number,
  helocLtvPct: number,
  helocRate: number,
  annualIulPremium: number,
  premiumYears: number,
  mortgageBalanceByYear: number[],
  freedMortgagePayment: number
): HELOCYear[] {
  const rows: HELOCYear[] = [];
  let helocBalance = 0;
  let cumulativeHelocInterest = 0;

  for (let y = 1; y <= 30; y++) {
    const homeValue = initialHomeValue * Math.pow(1 + HOME_APPRECIATION_RATE, y);
    const mortgageBal = y <= mortgageBalanceByYear.length ? mortgageBalanceByYear[y - 1] : 0;
    const maxHelocCapacity = homeValue * helocLtvPct;
    const availableEquity = Math.max(0, maxHelocCapacity - mortgageBal - helocBalance);

    let draw = 0;
    let purpose = "";

    if (y <= premiumYears) {
      draw = Math.min(annualIulPremium, availableEquity);
      if (y <= 2) {
        purpose = `Fund Year ${y} IUL Premium (70% LTV HELOC)`;
      } else {
        purpose = `Fund Year ${y} IUL Premium (New 70% LTV HELOC — appreciated home)`;
      }
    }

    helocBalance += draw;
    const interestPaid = helocBalance * helocRate;
    cumulativeHelocInterest += interestPaid;

    let repayment = 0;
    if (mortgageBal <= 0 && helocBalance > 0) {
      repayment = Math.min(helocBalance, freedMortgagePayment * 12);
      helocBalance = Math.max(0, helocBalance - repayment);
    }

    rows.push({
      year: y,
      drawAmount: Math.round(draw),
      purpose: purpose || (helocBalance > 0 ? "Interest-only — paydown from freed mortgage payment" : "Paid off"),
      balance: Math.round(helocBalance),
      interestPaid: Math.round(interestPaid),
      cumulativeInterest: Math.round(cumulativeHelocInterest),
      repaymentFromSavings: Math.round(repayment),
    });

    if (helocBalance <= 0 && y > premiumYears) break;
  }
  return rows;
}

// ─── Accelerated Amortization (v4) ──────────────────────────────────────────

function buildAcceleratedAmortization(
  balance: number,
  annualRate: number,
  termMonths: number,
  monthlyPayment: number,
  iulPolicy: IULPolicyYear[]
): { schedule: AmortizationRow[]; extraPayments: { month: number; amount: number; source: string }[]; mortgageBalanceByYear: number[] } {
  const monthlyRate = annualRate / 12;
  const rows: AmortizationRow[] = [];
  const extraPayments: { month: number; amount: number; source: string }[] = [];
  const mortgageBalanceByYear: number[] = [];
  let remaining = balance;
  let cumInterest = 0;
  let cumPrincipal = 0;

  for (let m = 1; m <= termMonths && remaining > 0.01; m++) {
    const interest = remaining * monthlyRate;
    let principal = Math.min(monthlyPayment - interest, remaining);
    const regularPayment = interest + principal;
    let extraPrincipal = 0;
    let source: "regular" | "iul_loan" | "iul_credit" | "heloc" = "regular";
    const currentYear = Math.ceil(m / 12);

    // Year 2 end (month 24): first 80% life loan → principal-only
    const isYear2End = m === 24;
    // Years 3-5 start: 80% life loan → principal-only
    const isSubsequentYearStart = m > 24 && m % 12 === 1 && currentYear <= 5;
    // After year 5: interest credits + incremental life loan → principal-only
    const isPostPremiumYearStart = m > 60 && m % 12 === 1;

    if (isYear2End) {
      const policyYear = iulPolicy.find(p => p.year === 2);
      if (policyYear && policyYear.policyLoan > 0) {
        extraPrincipal = Math.min(policyYear.policyLoan, remaining - principal);
        source = "iul_loan";
        if (extraPrincipal > 0) {
          extraPayments.push({
            month: m,
            amount: Math.round(extraPrincipal),
            source: `Year 2 Life Loan (80% of Surrender Value $${Math.round(policyYear.surrenderValue).toLocaleString()})`,
          });
        }
      }
    } else if (isSubsequentYearStart) {
      const policyYear = iulPolicy.find(p => p.year === currentYear);
      if (policyYear && policyYear.policyLoan > 0) {
        extraPrincipal = Math.min(policyYear.policyLoan, remaining - principal);
        source = "iul_loan";
        if (extraPrincipal > 0) {
          extraPayments.push({
            month: m,
            amount: Math.round(extraPrincipal),
            source: `Year ${currentYear} Life Loan (80% of Surrender Value $${Math.round(policyYear.surrenderValue).toLocaleString()})`,
          });
        }
      }
    } else if (isPostPremiumYearStart) {
      const policyYear = iulPolicy.find(p => p.year === currentYear);
      if (policyYear) {
        const totalExtra = policyYear.policyLoan + policyYear.interestCreditAppliedToPrincipal;
        if (totalExtra > 0) {
          extraPrincipal = Math.min(totalExtra, remaining - principal);
          source = "iul_credit";
          if (extraPrincipal > 0) {
            extraPayments.push({
              month: m,
              amount: Math.round(extraPrincipal),
              source: `Year ${currentYear} IUL Interest Credit + Life Loan → Principal Only`,
            });
          }
        }
      }
    }

    principal += extraPrincipal;
    cumInterest += interest;
    cumPrincipal += principal;
    remaining = Math.max(0, remaining - principal);

    rows.push({
      month: m,
      year: currentYear,
      beginningBalance: Math.round((remaining + principal) * 100) / 100,
      payment: Math.round((regularPayment + extraPrincipal) * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      endingBalance: Math.round(remaining * 100) / 100,
      cumulativeInterest: Math.round(cumInterest * 100) / 100,
      cumulativePrincipal: Math.round(cumPrincipal * 100) / 100,
      extraPrincipal: Math.round(extraPrincipal * 100) / 100,
      source,
    });

    if (m % 12 === 0 || remaining <= 0) {
      mortgageBalanceByYear.push(Math.round(remaining));
    }
    if (remaining <= 0) break;
  }

  while (mortgageBalanceByYear.length < 30) {
    mortgageBalanceByYear.push(0);
  }
  return { schedule: rows, extraPayments, mortgageBalanceByYear };
}

// ─── Cascading 30-Year Projection ───────────────────────────────────────────

function buildCascadingProjection(
  initialHomeValue: number,
  initialMortgageBalance: number,
  mortgageRate: number,
  monthlyMortgagePayment: number,
  iulPolicy: IULPolicyYear[],
  helocSchedule: HELOCYear[],
  mortgageBalanceByYear: number[]
): CascadingProjectionYear[] {
  const projection: CascadingProjectionYear[] = [];

  for (let y = 1; y <= 30; y++) {
    const homeValue = initialHomeValue * Math.pow(1 + HOME_APPRECIATION_RATE, y);
    const prevHomeValue = y === 1 ? initialHomeValue : initialHomeValue * Math.pow(1 + HOME_APPRECIATION_RATE, y - 1);
    const homeAppreciation = homeValue - prevHomeValue;
    const mortgageBalance = y <= mortgageBalanceByYear.length ? mortgageBalanceByYear[y - 1] : 0;
    const helocRow = helocSchedule.find(h => h.year === y);
    const helocBalance = helocRow?.balance ?? 0;
    const helocInterestPaid = helocRow?.interestPaid ?? 0;
    const homeEquity = homeValue - mortgageBalance - helocBalance;
    const iulRow = iulPolicy.find(p => p.year === y);

    const prevMortBal = y === 1 ? initialMortgageBalance : (mortgageBalanceByYear[y - 2] ?? 0);
    const avgMortBal = (prevMortBal + mortgageBalance) / 2;
    const mortgageInterestPaid = avgMortBal > 0 ? avgMortBal * mortgageRate : 0;

    let principalPayment = 0;
    let principalSource = "—";
    if (iulRow) {
      if (iulRow.policyLoan > 0 && y >= 2 && y <= 5) {
        principalPayment = iulRow.policyLoan;
        principalSource = `80% Life Loan ($${iulRow.policyLoan.toLocaleString()})`;
      } else if (y > 5 && (iulRow.policyLoan > 0 || iulRow.interestCreditAppliedToPrincipal > 0)) {
        principalPayment = iulRow.policyLoan + iulRow.interestCreditAppliedToPrincipal;
        principalSource = `IUL Credit + Loan ($${principalPayment.toLocaleString()})`;
      }
    }

    const netWorth = homeEquity + (iulRow?.netCashValue ?? 0);

    projection.push({
      year: y,
      homeValue: Math.round(homeValue),
      homeEquity: Math.round(homeEquity),
      helocBalance: Math.round(helocBalance),
      helocInterestPaid: Math.round(helocInterestPaid),
      helocInterestOnlyPayment: Math.round(helocInterestPaid),
      iulPremium: iulRow?.premium ?? 0,
      iulCashValue: iulRow?.cashValue ?? 0,
      iulSurrenderValue: iulRow?.surrenderValue ?? 0,
      iulInterestCredit: iulRow?.interestCredit ?? 0,
      lifeLoanAmount: iulRow?.policyLoan ?? 0,
      lifeLoanCumulative: iulRow?.cumulativePolicyLoans ?? 0,
      mortgageBalance: Math.round(mortgageBalance),
      mortgageInterestPaid: Math.round(mortgageInterestPaid),
      principalOnlyPayment: Math.round(principalPayment),
      principalPaymentSource: principalSource,
      mortgageMonthlyPayment: mortgageBalance > 0 ? monthlyMortgagePayment : 0,
      homeAppreciation: Math.round(homeAppreciation),
      netWorth: Math.round(netWorth),
    });
  }

  return projection;
}

// ─── Interest Savings Compound Calculator ────────────────────────────────────

export function calculateInterestSavings(
  currentSchedule: AmortizationRow[],
  acceleratedSchedule: AmortizationRow[],
  reinvestRate: number,
  _reinvestYears: number
): { totalInterestSaved: number; compoundedValue20yr: number; mgaAnnuityValue30yr: number; yearByYear: InterestSavingsRow[] } {
  const currentTotalInterest = currentSchedule.length > 0
    ? currentSchedule[currentSchedule.length - 1].cumulativeInterest : 0;
  const accelTotalInterest = acceleratedSchedule.length > 0
    ? acceleratedSchedule[acceleratedSchedule.length - 1].cumulativeInterest : 0;
  const totalInterestSaved = currentTotalInterest - accelTotalInterest;

  const yearByYear: InterestSavingsRow[] = [];
  let cumulativeSaved = 0;
  let compoundedValue = 0;
  let mgaAnnuityValue = 0;

  for (let y = 1; y <= 30; y++) {
    const currentYearInterest = currentSchedule.filter(r => r.year === y).reduce((s, r) => s + r.interest, 0);
    const accelYearInterest = acceleratedSchedule.filter(r => r.year === y).reduce((s, r) => s + r.interest, 0);
    const yearSaved = Math.max(0, currentYearInterest - accelYearInterest);
    cumulativeSaved += yearSaved;
    compoundedValue = (compoundedValue + yearSaved) * (1 + reinvestRate);
    mgaAnnuityValue = (mgaAnnuityValue + yearSaved) * (1 + MGA_RATE);
    yearByYear.push({
      year: y,
      interestSaved: Math.round(yearSaved),
      cumulativeSaved: Math.round(cumulativeSaved),
      compoundedValue: Math.round(compoundedValue),
      mgaAnnuityValue: Math.round(mgaAnnuityValue),
    });
  }

  return {
    totalInterestSaved: Math.round(totalInterestSaved),
    compoundedValue20yr: Math.round(compoundedValue),
    mgaAnnuityValue30yr: Math.round(mgaAnnuityValue),
    yearByYear,
  };
}

// ─── Main Orchestrator (v4) ─────────────────────────────────────────────────

export function runMortgageKillerAnalysis(input: MortgageKillerInput): MortgageKillerResult {
  const {
    mortgageBalance, mortgageRate, mortgageTermMonths, monthlyMortgagePayment,
    homeMarketValue, annualIncome,
    iraValue = 0, cashValue = 0, investments = 0, annuities = 0,
    otherInvestments = 0, cryptocurrency = 0,
    incomeAllocationPct = 0.20, iulCreditRate = 0.075,
    premiumYears = MAX_PREMIUM_YEARS,
    helocRate = 0.085, helocLtvPct = HELOC_LTV_DEFAULT,
    policyLoanPct = LIFE_LOAN_PCT, policyLoanDragRate = 0.05,
    interestReinvestRate = 0.07, interestReinvestYears = 20, clientAge = 45,
  } = input;

  // helocDrawPct is accepted for backward compat but not used in v4
  const totalAssets = iraValue + cashValue + investments + annuities + otherInvestments + cryptocurrency;
  const annualIulPremium = Math.round(annualIncome * incomeAllocationPct);
  const effectivePremiumYears = Math.min(premiumYears, MAX_PREMIUM_YEARS);

  // 1. Current Plan (do nothing)
  const currentSchedule = buildStandardAmortization(mortgageBalance, mortgageRate, mortgageTermMonths, monthlyMortgagePayment);
  const currentTotalInterest = currentSchedule.length > 0 ? currentSchedule[currentSchedule.length - 1].cumulativeInterest : 0;
  const currentTotalPayments = currentSchedule.reduce((s, r) => s + r.payment, 0);

  // 2. IUL Policy first pass (project 30 years)
  const iulPolicyFirstPass = projectIulPolicy(
    annualIulPremium, 30, iulCreditRate, effectivePremiumYears, policyLoanPct, policyLoanDragRate, clientAge, 30
  );

  // 3. Accelerated amortization with life loans + interest credits
  const { schedule: accelSchedule, extraPayments, mortgageBalanceByYear } = buildAcceleratedAmortization(
    mortgageBalance, mortgageRate, mortgageTermMonths, monthlyMortgagePayment, iulPolicyFirstPass
  );

  // 4. Rebuild IUL with actual payoff year
  const mortgagePaidOffYear = Math.ceil(accelSchedule.length / 12);
  const iulPolicy = projectIulPolicy(
    annualIulPremium, 30, iulCreditRate, effectivePremiumYears, policyLoanPct, policyLoanDragRate, clientAge, mortgagePaidOffYear
  );

  // 5. HELOC schedule (70% LTV draws to fund IUL premiums)
  const helocSchedule = buildHelocSchedule(
    homeMarketValue, mortgageBalance, helocLtvPct, helocRate, annualIulPremium, effectivePremiumYears, mortgageBalanceByYear, monthlyMortgagePayment
  );

  // 6. Cascading 30-year projection
  const cascadingProjection = buildCascadingProjection(
    homeMarketValue, mortgageBalance, mortgageRate, monthlyMortgagePayment,
    iulPolicy, helocSchedule, mortgageBalanceByYear
  );

  const accelTotalInterest = accelSchedule.length > 0 ? accelSchedule[accelSchedule.length - 1].cumulativeInterest : 0;
  const accelTotalPayments = accelSchedule.reduce((s, r) => s + r.payment, 0);

  // 7. Interest savings
  const interestSavings = calculateInterestSavings(currentSchedule, accelSchedule, interestReinvestRate, interestReinvestYears);

  // 8. Summary
  const currentPayoffMonths = currentSchedule.length;
  const accelPayoffMonths = accelSchedule.length;
  const monthsSaved = currentPayoffMonths - accelPayoffMonths;
  const yearsSaved = Math.floor(monthsSaved / 12);

  const now = new Date();
  const originalPayoffDate = new Date(now);
  originalPayoffDate.setMonth(originalPayoffDate.getMonth() + currentPayoffMonths);
  const mortgageFreeDate = new Date(now);
  mortgageFreeDate.setMonth(mortgageFreeDate.getMonth() + accelPayoffMonths);

  const totalPolicyLoans = iulPolicy.reduce((s, p) => s + p.policyLoan, 0);
  const totalHelocDrawn = helocSchedule.reduce((s, h) => s + h.drawAmount, 0);
  const totalHelocInterest = helocSchedule.reduce((s, h) => s + h.interestPaid, 0);
  const finalPolicyCv = iulPolicy.length > 0 ? iulPolicy[iulPolicy.length - 1].cashValue : 0;

  const helocPaidOffYear = helocSchedule.length > 0
    ? helocSchedule.findIndex(h => h.balance <= 0 && h.year > effectivePremiumYears) + 1 || helocSchedule.length : 0;
  const debtFreeYear = Math.max(mortgagePaidOffYear, helocPaidOffYear);

  return {
    currentPlan: {
      schedule: currentSchedule,
      totalInterest: Math.round(currentTotalInterest),
      totalPayments: Math.round(currentTotalPayments),
      payoffMonths: currentPayoffMonths,
      monthlyPayment: monthlyMortgagePayment,
    },
    recommendedPlan: {
      schedule: accelSchedule,
      totalInterest: Math.round(accelTotalInterest),
      totalPayments: Math.round(accelTotalPayments),
      payoffMonths: accelPayoffMonths,
      monthlyPayment: monthlyMortgagePayment,
      extraPayments,
    },
    iulPolicy,
    helocSchedule,
    cascadingProjection,
    interestSavings,
    summary: {
      yearsSaved, monthsSaved,
      totalInterestSaved: interestSavings.totalInterestSaved,
      totalWealthCreated: interestSavings.compoundedValue20yr + finalPolicyCv + interestSavings.mgaAnnuityValue30yr,
      mortgageFreeDate: mortgageFreeDate.toISOString().slice(0, 10),
      originalPayoffDate: originalPayoffDate.toISOString().slice(0, 10),
      annualIulPremium,
      totalIulPremiums: annualIulPremium * effectivePremiumYears,
      totalPolicyLoans, totalHelocDrawn, totalHelocInterest,
      finalPolicyCashValue: finalPolicyCv,
      totalAssets, debtFreeYear,
    },
  };
}
