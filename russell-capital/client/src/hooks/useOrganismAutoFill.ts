// @ts-nocheck

import { useMemo } from 'react';
import { useDataBus } from './useDataBus';  // Assuming this hook exists to fetch data bus data
import { useDemographics } from './useDemographics';  // Assuming this hook exists for demographics

export const CALC_FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  'mortgage-killer': {
    homeValue: 'net_worth.homeEquity',
    mortgageBalance: 'net_worth.mortgageBalance',
    income: 'client_profile.income'
  },
  'roth-conversion': {
    traditionalIRA: 'retirement_status.traditionalBalance',
    income: 'tax_summary.agi',
    taxBracket: 'tax_summary.marginalRate'
  },
  'tax-bracket': {
    income: 'client_profile.income',
    filingStatus: 'client_profile.filingStatus',
    deductions: 'tax_summary.deductions'
  },
  'retirement-income': {
    age: 'client_profile.age',
    savings: 'retirement_status.totalSavings',
    ssEstimate: 'retirement_status.pia'
  },
  'estate-planning': {
    estateValue: 'net_worth.total',
    beneficiaries: 'client_profile.dependents'
  },
  'insurance-needs': {
    income: 'client_profile.income',
    age: 'client_profile.age',
    dependents: 'client_profile.dependents'
  },
  'debt-payoff': {
    totalDebt: 'net_worth.debts',
    interestRate: 'net_worth.interestRates',
    income: 'client_profile.income'
  },
  'college-savings': {
    childAge: 'client_profile.childrenAges',
    goalAmount: 'education_goals.amount',
    savingsRate: 'client_profile.savingsRate'
  },
  'car-loan': {
    carValue: 'net_worth.assets.car',
    loanAmount: 'net_worth.liabilities.carLoan'
  },
  'credit-card-payoff': {
    balance: 'net_worth.creditCardBalance',
    interestRate: 'net_worth.creditCardInterest'
  },
  'investment-portfolio': {
    currentValue: 'investment_status.totalValue',
    riskTolerance: 'client_profile.riskTolerance'
  },
  'budgeting': {
    monthlyIncome: 'client_profile.income',
    expenses: 'spending_summary.totalExpenses'
  },
  'emergency-fund': {
    monthlyExpenses: 'spending_summary.totalExpenses',
    savingsGoal: 'financial_goals.emergencyFund'
  },
  'retirement-withdrawal': {
    retirementAge: 'client_profile.retirementAge',
    savings: 'retirement_status.totalSavings'
  },
  'social-security': {
    birthYear: 'client_profile.birthYear',
    earningsHistory: 'employment_history.earnings'
  },
  'health-insurance': {
    age: 'client_profile.age',
    familySize: 'client_profile.familySize'
  },
  'life-insurance': {
    income: 'client_profile.income',
    dependents: 'client_profile.dependents'
  },
  'disability-insurance': {
    income: 'client_profile.income',
    occupation: 'client_profile.occupation'
  },
  'long-term-care': {
    age: 'client_profile.age',
    healthStatus: 'health_profile.status'
  },
  'annuity-purchase': {
    investmentAmount: 'net_worth.liquidAssets',
    age: 'client_profile.age'
  },
  'stock-investing': {
    portfolioValue: 'investment_status.stocks',
    marketConditions: 'market_data.current'
  },
  'real-estate-investment': {
    propertyValue: 'net_worth.realEstate',
    rentalIncome: 'income_sources.rental'
  },
  'vehicle-insurance': {
    vehicleValue: 'net_worth.assets.vehicle',
    driverAge: 'client_profile.age'
  },
  'home-insurance': {
    homeValue: 'net_worth.homeEquity',
    location: 'client_profile.address'
  },
  'business-loan': {
    businessValue: 'business_status.value',
    revenue: 'business_status.revenue'
  },
  'student-loan': {
    loanBalance: 'net_worth.studentLoans',
    interestRate: 'net_worth.studentLoanInterest'
  },
  'vacation-savings': {
    targetAmount: 'financial_goals.vacation',
    savingsRate: 'client_profile.savingsRate'
  },
  'wedding-planning': {
    budget: 'financial_goals.wedding',
    income: 'client_profile.income'
  },
  'car-maintenance': {
    carAge: 'net_worth.assets.carAge',
    maintenanceHistory: 'vehicle_history.maintenance'
  },
  'pet-insurance': {
    petAge: 'client_profile.petsAge',
    vetCosts: 'spending_summary.vetExpenses'
  },
  'travel-insurance': {
    tripCost: 'travel_plans.cost',
    destination: 'travel_plans.location'
  },
  'home-renovation': {
    homeValue: 'net_worth.homeEquity',
    renovationCost: 'financial_goals.renovation'
  }
};

// Utility function to get nested value from an object
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export function useAutoFill(calcName: string) {
  const dataBusData = useDataBus();  // Fetches data from the organism data bus

  const mappings = CALC_FIELD_MAPPINGS[calcName] || {};

  const { autoFilledValues, confidence, source } = useMemo(() => {
    const values: Record<string, any> = {};
    const conf: Record<string, number> = {};
    const src: Record<string, string> = {};

    for (const [field, path] of Object.entries(mappings)) {
      const value = getNestedValue(dataBusData, path);
      if (value !== undefined) {
        values[field] = value;
        conf[field] = 1;  // Full confidence if data is available
        src[field] = `From Data Bus: ${path}`;
      } else {
        values[field] = null;  // No value available
        conf[field] = 0;  // No confidence
        src[field] = 'Not available';
      }
    }

    return { autoFilledValues: values, confidence: conf, source: src };
  }, [dataBusData, calcName]);

  const applyAutoFill = (setter: (values: Record<string, any>) => void) => {
    setter(autoFilledValues);
  };

  return { autoFilledValues, confidence, source, applyAutoFill };
}

export function useSmartDefaults(calcName: string) {
  const demographics = useDemographics();  // Fetches demographic data

  const { defaults } = useMemo(() => {
    let defaultValues: Record<string, any> = {};
    const isEst = true;  // Always estimated

    switch (calcName) {
      case 'mortgage-killer':
        defaultValues = {
          homeValue: 300000,  // Based on average home value
          mortgageBalance: 200000,
          income: demographics.incomeBracket === 'middle' ? 75000 : 50000
        };
        break;
      case 'roth-conversion':
        defaultValues = {
          traditionalIRA: 50000,
          income: demographics.incomeBracket === 'high' ? 150000 : 100000,
          taxBracket: 0.22  // Default to a common bracket
        };
        break;
      case 'tax-bracket':
        defaultValues = {
          income: demographics.incomeBracket === 'low' ? 50000 : 100000,
          filingStatus: 'single',
          deductions: 12000  // Standard deduction
        };
        break;
      case 'retirement-income':
        defaultValues = {
          age: demographics.age || 40,
          savings: 100000,
          ssEstimate: 2000  // Average estimate
        };
        break;
      case 'estate-planning':
        defaultValues = {
          estateValue: 500000,
          beneficiaries: demographics.dependents || 2
        };
        break;
      case 'insurance-needs':
        defaultValues = {
          income: demographics.income || 60000,
          age: demographics.age || 35,
          dependents: demographics.dependents || 1
        };
        break;
      // Add defaults for the additional calculators
      case 'debt-payoff':
        defaultValues = { totalDebt: 20000, interestRate: 0.05, income: 50000 };
        break;
      case 'college-savings':
        defaultValues = { childAge: 5, goalAmount: 100000, savingsRate: 0.10 };
        break;
      case 'car-loan':
        defaultValues = { carValue: 25000, loanAmount: 15000 };
        break;
      case 'credit-card-payoff':
        defaultValues = { balance: 5000, interestRate: 0.18 };
        break;
      case 'investment-portfolio':
        defaultValues = { currentValue: 100000, riskTolerance: 'moderate' };
        break;
      case 'budgeting':
        defaultValues = { monthlyIncome: 5000, expenses: 4000 };
        break;
      case 'emergency-fund':
        defaultValues = { monthlyExpenses: 3000, savingsGoal: 9000 };
        break;
      case 'retirement-withdrawal':
        defaultValues = { retirementAge: 65, savings: 500000 };
        break;
      case 'social-security':
        defaultValues = { birthYear: 1980, earningsHistory: 50000 };
        break;
      case 'health-insurance':
        defaultValues = { age: 40, familySize: 3 };
        break;
      case 'life-insurance':
        defaultValues = { income: 60000, dependents: 2 };
        break;
      case 'disability-insurance':
        defaultValues = { income: 50000, occupation: 'office' };
        break;
      case 'long-term-care':
        defaultValues = { age: 50, healthStatus: 'average' };
        break;
      case 'annuity-purchase':
        defaultValues = { investmentAmount: 100000, age: 60 };
        break;
      case 'stock-investing':
        defaultValues = { portfolioValue: 50000, marketConditions: 'neutral' };
        break;
      case 'real-estate-investment':
        defaultValues = { propertyValue: 300000, rentalIncome: 2000 };
        break;
      case 'vehicle-insurance':
        defaultValues = { vehicleValue: 20000, driverAge: 30 };
        break;
      case 'home-insurance':
        defaultValues = { homeValue: 250000, location: 'urban' };
        break;
      case 'business-loan':
        defaultValues = { businessValue: 100000, revenue: 50000 };
        break;
      case 'student-loan':
        defaultValues = { loanBalance: 30000, interestRate: 0.04 };
        break;
    }

    return { defaults: defaultValues, isEstimated: isEst };
  }, [calcName, demographics]);

  return { defaults, isEstimated: true };  // isEstimated is always true for this hook
}
