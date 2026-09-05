// @ts-nocheck

import React, { useMemo } from 'react';

export const IRC_SECTION_DESCRIPTIONS: Record<string, string> = {
  '7702': 'Life Insurance Contract Definition',
  '72': 'Annuity Taxation Rules',
  '101(a)': 'Death Benefit Income Tax Exclusion',
  '408A': 'Roth IRA Provisions',
  '163': 'Mortgage Interest Deduction',
  '168(k)': 'Bonus Depreciation',
  '179': 'Section 179 Expensing',
  '263(c)': 'Intangible Drilling Costs',
  '1031': 'Like-Kind Exchange',
  '2042': 'Estate Tax — Life Insurance Proceeds',
  '2503(b)': 'Annual Gift Tax Exclusion',
  '2611': 'Generation-Skipping Transfer Tax',
  '469': 'Passive Activity Losses',
  '280A': 'Vacation Home / STR Rules',
  '2702': 'QPRT Valuation Rules',
  '401(k)': 'Qualified Cash or Deferred Arrangement',
  '403(b)': 'Tax-Sheltered Annuity Plans',
  '457': 'Deferred Compensation Plans of State and Local Governments',
  '529': 'Qualified Tuition Programs',
  'IRA': 'Individual Retirement Accounts',
  'Roth IRA': 'Roth Individual Retirement Accounts',
  'SEP IRA': 'Simplified Employee Pension',
  'SIMPLE IRA': 'Savings Incentive Match Plan for Employees',
  'Keogh Plan': 'Defined Benefit and Contribution Plans for Self-Employed',
  'ESOP': 'Employee Stock Ownership Plan',
  '401(a)': 'Qualified Pension, Profit-Sharing, and Stock Bonus Plans',
  '412(e)(3)': 'Defined Benefit Plans',
  '414(h)': 'Pick-Up Contributions',
  '457(b)': 'Deferred Compensation Plans',
  '501(c)(3)': 'Charitable Organizations',
};

export function formatCurrency(amount: number, options?: { currency?: string; decimals?: number }): string {
  const { currency = '$', decimals = 2 } = options || {};
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: currency === '$' ? 'USD' : currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercentage(rate: number, decimals: number = 2): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

export function formatDateRange(start: Date, end: Date): string {
  return `${start.toDateString()} - ${end.toDateString()}`;
}

export function formatYearRange(startYear: number, endYear: number): string {
  return `${startYear} - ${endYear}`;
}

export function formatTaxBracket(rate: number, income: number): string {
  return `${(rate * 100).toFixed(0)}% for $${income.toLocaleString()}`;
}

export function formatIRCSection(code: string): string {
  return `IRC ${code} — ${IRC_SECTION_DESCRIPTIONS[code] || 'Description not found'}`;
}

export function validateIncome(income: number | string): { valid: boolean; error?: string; normalized?: number } {
  let normalized: number = typeof income === 'string' ? parseFloat(income.replace(/[^0-9.-]/g, '')) : income;
  if (isNaN(normalized) || normalized < 0) {
    return { valid: false, error: 'Income must be a positive number' };
  }
  return { valid: true, normalized };
}

export function validateAge(age: number | string): { valid: boolean; error?: string; normalized?: number } {
  let normalized: number = typeof age === 'string' ? parseInt(age, 10) : age;
  if (isNaN(normalized) || normalized < 0 || normalized > 120) {
    return { valid: false, error: 'Age must be between 0 and 120' };
  }
  return { valid: true, normalized };
}

export function validatePercentage(pct: number | string): { valid: boolean; error?: string; normalized?: number } {
  let normalized: number = typeof pct === 'string' ? parseFloat(pct) : pct;
  if (isNaN(normalized) || normalized < 0 || normalized > 100) {
    return { valid: false, error: 'Percentage must be between 0 and 100' };
  }
  return { valid: true, normalized };
}

export function validateCurrency(amount: number | string): { valid: boolean; error?: string; normalized?: number } {
  let normalized: number = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  if (isNaN(normalized) || normalized < 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }
  return { valid: true, normalized };
}

export function validateSSN(ssn: string): { valid: boolean; error?: string } {
  const regex = /^\d{3}-?\d{2}-?\d{4}$/;
  if (!regex.test(ssn)) {
    return { valid: false, error: 'Invalid SSN format' };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  if (!regex.test(phone)) {
    return { valid: false, error: 'Invalid phone format' };
  }
  return { valid: true };
}

export function validateZipCode(zip: string): { valid: boolean; error?: string; state?: string } {
  const regex = /^\d{5}$/;
  if (!regex.test(zip)) {
    return { valid: false, error: 'Invalid ZIP code' };
  }
  return { valid: true };
}

export function annualToMonthly(amount: number): number {
  return amount / 12;
}

export function monthlyToAnnual(amount: number): number {
  return amount * 12;
}

export function nominalToReal(nominal: number, inflation: number): number {
  return nominal / (1 + inflation);
}

export function preToPostTax(amount: number, taxRate: number): number {
  return amount * (1 - taxRate);
}

export function postToPreTax(amount: number, taxRate: number): number {
  return amount / (1 - taxRate);
}

export function futureValue(pv: number, rate: number, years: number): number {
  return pv * Math.pow(1 + rate, years);
}

export function presentValue(fv: number, rate: number, years: number): number {
  return fv / Math.pow(1 + rate, years);
}

export function pmt(rate: number, nper: number, pv: number): number {
  const factor = Math.pow(1 + rate, nper);
  return pv * rate * factor / (factor - 1);
}

export function irr(cashflows: number[]): number {
  return 0; // Placeholder implementation
}

export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, val, i) => acc + val / Math.pow(1 + rate, i), 0);
}

export function generate50YearProjection(initial: number, growthRate: number, contributions: number[] = [], withdrawals: number[] = []): number[] {
  const projections: number[] = [];
  let balance = initial;
  for (let year = 0; year < 50; year++) {
    balance = balance * (1 + growthRate) + (contributions[year] || 0) - (withdrawals[year] || 0);
    projections.push(balance);
  }
  return projections;
}

export function generateAmortization(principal: number, rate: number, years: number): Array<{ year: number; payment: number; principal: number; interest: number; balance: number }> {
  const monthlyRate = rate / 12;
  const nper = years * 12;
  const payment = pmt(monthlyRate, nper, principal);
  let balance = principal;
  const amortization: Array<{ year: number; payment: number; principal: number; interest: number; balance: number }> = [];
  for (let year = 1; year <= years; year++) {
    let yearPayment = 0;
    let yearPrincipal = 0;
    let yearInterest = 0;
    for (let month = 1; month <= 12; month++) {
      const interest = balance * monthlyRate;
      const principalPaid = payment - interest;
      balance -= principalPaid;
      yearPayment += payment;
      yearPrincipal += principalPaid;
      yearInterest += interest;
    }
    amortization.push({ year, payment: yearPayment, principal: yearPrincipal, interest: yearInterest, balance });
  }
  return amortization;
}

export function generateCompoundGrowth(initial: number, rate: number, years: number, compounding: string = 'annual'): number[] {
  const projections: number[] = [];
  let balance = initial;
  for (let year = 0; year < years; year++) {
    balance *= (1 + rate);
    projections.push(balance);
  }
  return projections;
}

export function generateInflationAdjusted(amounts: number[], inflationRate: number): number[] {
  return amounts.map(amount => amount / (1 + inflationRate));
}

export function generateTaxBracketProgression(income: number, growthRate: number, years: number): Array<{ year: number; income: number; bracket: string; tax: number }> {
  const brackets = [0, 10000, 40000, 80000];
  const rates = [0.1, 0.2, 0.3];
  const results: Array<{ year: number; income: number; bracket: string; tax: number }> = [];
  for (let year = 0; year < years; year++) {
    income *= (1 + growthRate);
    let bracketRate = 0;
    for (let i = brackets.length - 1; i >= 0; i--) {
      if (income > brackets[i]) {
        bracketRate = rates[i];
        break;
      }
    }
    const tax = income * bracketRate;
    results.push({ year: year + 1, income, bracket: `${bracketRate * 100}%`, tax });
  }
  return results;
}

export function useSkeletonDeep() {
  return useMemo(() => ({
    formatCurrency,
    formatPercentage,
    formatCompactNumber,
    formatDateRange,
    formatYearRange,
    formatTaxBracket,
    formatIRCSection,
    validateIncome,
    validateAge,
    validatePercentage,
    validateCurrency,
    validateSSN,
    validateEmail,
    validatePhone,
    validateZipCode,
    annualToMonthly,
    monthlyToAnnual,
    nominalToReal,
    preToPostTax,
    postToPreTax,
    futureValue,
    presentValue,
    pmt,
    irr,
    npv,
    generate50YearProjection,
    generateAmortization,
    generateCompoundGrowth,
    generateInflationAdjusted,
    generateTaxBracketProgression,
    IRC_SECTION_DESCRIPTIONS,
  }), []);
}
