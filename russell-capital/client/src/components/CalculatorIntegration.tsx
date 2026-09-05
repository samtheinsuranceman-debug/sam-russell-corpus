// @ts-nocheck
/**
 * CalculatorIntegration.tsx
 * ═══════════════════════════════════════════════════════════════════
 * Unified integration layer for all 100 financial calculators:
 *
 * 1. CALCULATOR_RELATIONSHIPS — cross-reference map linking related calculators
 * 2. useCalculatorAutoFill() — hook that reads ClientDataContext and returns
 *    pre-filled values for any calculator based on its route key
 * 3. <RelatedCalculators /> — component showing related calculator links
 * 4. <CalculatorWrapper /> — wrapper that auto-reports results to AI Brain
 * 5. useFinancialHealthFromCalculators() — aggregates all calculator results
 *    into a single financial health score for the AI Advisor
 * ═══════════════════════════════════════════════════════════════════
 */

import { useMemo, useEffect, useCallback, createContext, useContext, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClientData, type ClientFactFinderData } from "@/contexts/ClientDataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight, Calculator, TrendingUp, Shield, Landmark, Building2,
  Briefcase, BarChart3, Wallet, Zap, Sparkles, Flame, Receipt
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   1. CALCULATOR RELATIONSHIP MAP
   Each key is a route slug; value is array of related route slugs.
   ═══════════════════════════════════════════════════════════════════ */

export const CALCULATOR_RELATIONSHIPS: Record<string, string[]> = {
  // Tax & Income Optimization
  "rmd-calculator": ["roth-vs-traditional", "safe-withdrawal-rate", "medicare-irmaa-calc", "qlac-calculator", "inflation-adjusted-income", "retirement-budget"],
  "marginal-tax-rate": ["capital-gains-tax", "deduction-optimizer", "roth-vs-traditional", "income-shifting", "self-employment-tax", "tax-equivalent-yield"],
  "capital-gains-tax": ["marginal-tax-rate", "tax-loss-harvest-calc", "gain-loss-harvesting", "charitable-stock-donation", "1031-exchange", "opportunity-zone"],
  "amt-calculator": ["marginal-tax-rate", "deduction-optimizer", "rsu-tax", "capital-gains-tax", "income-shifting"],
  "self-employment-tax": ["entity-comparison", "qbi-calculator", "marginal-tax-rate", "cash-balance-plan", "deduction-optimizer"],
  "tax-equivalent-yield": ["muni-bond-ladder", "bond-ladder", "marginal-tax-rate", "asset-allocation", "fee-impact"],
  "w4-optimizer": ["marginal-tax-rate", "deduction-optimizer", "roth-vs-traditional", "self-employment-tax"],
  "crypto-tax": ["capital-gains-tax", "tax-loss-harvest-calc", "gain-loss-harvesting", "marginal-tax-rate"],
  "rsu-tax": ["capital-gains-tax", "amt-calculator", "nua-calculator", "marginal-tax-rate", "deferred-compensation"],
  "deduction-optimizer": ["marginal-tax-rate", "charitable-stock-donation", "daf-vs-direct-giving", "w4-optimizer", "hsa-triple-tax"],

  // Retirement Planning
  "fire-calculator": ["safe-withdrawal-rate", "compound-interest", "millionaire-calculator", "savings-rate-impact", "retirement-budget", "financial-freedom-number"],
  "safe-withdrawal-rate": ["fire-calculator", "retirement-budget", "inflation-adjusted-income", "rmd-calculator", "annuity-comparison"],
  "pension-vs-lump-sum": ["pension-max", "annuity-comparison", "safe-withdrawal-rate", "roth-vs-traditional", "spousal-ss-coordination"],
  "qlac-calculator": ["rmd-calculator", "annuity-comparison", "safe-withdrawal-rate", "inflation-adjusted-income"],
  "retirement-healthcare": ["medicare-irmaa-calc", "aca-subsidy", "hsa-triple-tax", "retirement-budget", "fire-calculator"],
  "medicare-irmaa-calc": ["retirement-healthcare", "roth-vs-traditional", "rmd-calculator", "income-shifting", "aca-subsidy"],
  "spousal-ss-coordination": ["pension-vs-lump-sum", "safe-withdrawal-rate", "retirement-budget", "inflation-adjusted-income"],
  "dca-vs-lump-sum": ["compound-interest", "asset-allocation", "cost-of-waiting", "fee-impact", "portfolio-risk-return"],
  "retirement-budget": ["safe-withdrawal-rate", "fire-calculator", "inflation-adjusted-income", "spousal-ss-coordination", "retirement-healthcare"],
  "inflation-adjusted-income": ["retirement-budget", "safe-withdrawal-rate", "compound-interest", "rmd-calculator", "spousal-ss-coordination"],

  // Insurance & Risk
  "life-insurance-needs": ["term-vs-whole-vs-iul", "disability-insurance-needs", "key-person-insurance", "estate-liquidity", "pension-max"],
  "disability-insurance-needs": ["life-insurance-needs", "umbrella-insurance", "overhead-expense", "retirement-healthcare"],
  "ltc-cost": ["retirement-healthcare", "life-insurance-needs", "estate-liquidity", "hsa-triple-tax", "annuity-comparison"],
  "umbrella-insurance": ["disability-insurance-needs", "life-insurance-needs", "net-worth-tracker", "estate-liquidity"],
  "term-vs-whole-vs-iul": ["life-insurance-needs", "pension-max", "ilit-calculator", "emergency-fund-vs-iul", "529-vs-iul"],
  "key-person-insurance": ["life-insurance-needs", "business-valuation", "buy-sell-funding", "succession-plan"],
  "buy-sell-funding": ["key-person-insurance", "business-valuation", "succession-plan", "entity-comparison"],

  // Estate & Legacy
  "crt-calculator": ["daf-vs-direct-giving", "charitable-stock-donation", "grat-calculator", "ilit-calculator", "estate-liquidity"],
  "grat-calculator": ["ilit-calculator", "gstt-calculator", "crt-calculator", "qprt-calculator", "estate-liquidity"],
  "ilit-calculator": ["grat-calculator", "estate-liquidity", "life-insurance-needs", "term-vs-whole-vs-iul", "gstt-calculator"],
  "qprt-calculator": ["grat-calculator", "estate-liquidity", "home-affordability", "ilit-calculator"],
  "gstt-calculator": ["grat-calculator", "ilit-calculator", "estate-liquidity", "special-needs-trust"],
  "daf-vs-direct-giving": ["crt-calculator", "charitable-stock-donation", "deduction-optimizer", "capital-gains-tax"],
  "estate-liquidity": ["ilit-calculator", "life-insurance-needs", "grat-calculator", "net-worth-tracker", "business-valuation"],

  // Wealth Building
  "net-worth-tracker": ["financial-health-score", "compound-interest", "millionaire-calculator", "fire-calculator", "asset-allocation"],
  "compound-interest": ["millionaire-calculator", "cost-of-waiting", "drip-growth", "fire-calculator", "savings-rate-impact"],
  "millionaire-calculator": ["compound-interest", "fire-calculator", "savings-rate-impact", "net-worth-tracker", "financial-freedom-number"],
  "emergency-fund-vs-iul": ["term-vs-whole-vs-iul", "529-vs-iul", "savings-rate-impact", "budget-50-30-20"],
  "529-vs-iul": ["emergency-fund-vs-iul", "term-vs-whole-vs-iul", "compound-interest", "millionaire-calculator"],
  "debt-payoff-optimizer": ["credit-card-payoff", "student-loan-vs-invest", "budget-50-30-20", "savings-rate-impact", "spend-vs-invest"],

  // Real Estate
  "rental-property-roi": ["1031-exchange", "depreciation-tax-shield", "vacation-rental", "opportunity-zone", "home-affordability"],
  "1031-exchange": ["rental-property-roi", "like-kind-exchange", "opportunity-zone", "capital-gains-tax", "depreciation-tax-shield"],
  "opportunity-zone": ["1031-exchange", "capital-gains-tax", "rental-property-roi", "depreciation-tax-shield"],
  "home-affordability": ["refinance-break-even", "cost-of-living", "rental-property-roi", "budget-50-30-20"],
  "refinance-break-even": ["home-affordability", "cost-of-living", "rental-property-roi", "debt-payoff-optimizer"],
  "cost-of-living": ["home-affordability", "state-tax-arbitrage", "retirement-budget", "refinance-break-even"],
  "reverse-mortgage": ["home-affordability", "retirement-budget", "estate-liquidity", "safe-withdrawal-rate"],
  "depreciation-tax-shield": ["rental-property-roi", "1031-exchange", "opportunity-zone", "marginal-tax-rate"],
  "property-tax-appeal": ["home-affordability", "rental-property-roi", "cost-of-living"],
  "vacation-rental": ["rental-property-roi", "depreciation-tax-shield", "1031-exchange", "self-employment-tax"],

  // Business Owner Tools
  "business-valuation": ["succession-plan", "esop-calculator", "buy-sell-funding", "entity-comparison", "key-person-insurance"],
  "cash-balance-plan": ["self-employment-tax", "qbi-calculator", "deferred-compensation", "entity-comparison", "roth-vs-traditional"],
  "entity-comparison": ["self-employment-tax", "qbi-calculator", "cash-balance-plan", "business-valuation"],
  "qbi-calculator": ["entity-comparison", "self-employment-tax", "marginal-tax-rate", "cash-balance-plan"],
  "deferred-compensation": ["rsu-tax", "cash-balance-plan", "roth-vs-traditional", "severance-calculator"],
  "captive-insurance": ["key-person-insurance", "business-valuation", "entity-comparison", "overhead-expense"],
  "succession-plan": ["business-valuation", "buy-sell-funding", "esop-calculator", "estate-liquidity", "key-person-insurance"],
  "esop-calculator": ["business-valuation", "succession-plan", "entity-comparison", "deferred-compensation"],
  "severance-calculator": ["deferred-compensation", "rsu-tax", "marginal-tax-rate", "windfall-management"],
  "overhead-expense": ["disability-insurance-needs", "key-person-insurance", "business-valuation", "captive-insurance"],

  // Investment Analysis
  "asset-allocation": ["portfolio-risk-return", "sector-rotation", "fee-impact", "dca-vs-lump-sum", "bond-ladder"],
  "pe-irr-calculator": ["asset-allocation", "portfolio-risk-return", "fee-impact", "compound-interest"],
  "bond-ladder": ["muni-bond-ladder", "tax-equivalent-yield", "asset-allocation", "safe-withdrawal-rate"],
  "muni-bond-ladder": ["bond-ladder", "tax-equivalent-yield", "marginal-tax-rate", "asset-allocation"],
  "drip-growth": ["compound-interest", "fee-impact", "asset-allocation", "millionaire-calculator"],
  "options-profit-loss": ["portfolio-risk-return", "asset-allocation", "capital-gains-tax", "sector-rotation"],
  "portfolio-risk-return": ["asset-allocation", "sector-rotation", "fee-impact", "options-profit-loss"],
  "sector-rotation": ["asset-allocation", "portfolio-risk-return", "options-profit-loss", "dca-vs-lump-sum"],
  "fee-impact": ["asset-allocation", "compound-interest", "drip-growth", "portfolio-risk-return"],
  "tax-loss-harvest-calc": ["capital-gains-tax", "gain-loss-harvesting", "asset-allocation", "portfolio-risk-return"],

  // Budgeting & Cash Flow
  "budget-50-30-20": ["zero-based-budget", "savings-rate-impact", "financial-freedom-number", "spend-vs-invest"],
  "zero-based-budget": ["budget-50-30-20", "savings-rate-impact", "lifestyle-inflation", "financial-freedom-number"],
  "spend-vs-invest": ["cost-of-waiting", "compound-interest", "savings-rate-impact", "lease-vs-buy"],
  "lease-vs-buy": ["spend-vs-invest", "home-affordability", "debt-payoff-optimizer", "budget-50-30-20"],
  "student-loan-vs-invest": ["debt-payoff-optimizer", "compound-interest", "spend-vs-invest", "savings-rate-impact"],
  "credit-card-payoff": ["debt-payoff-optimizer", "budget-50-30-20", "savings-rate-impact", "spend-vs-invest"],
  "savings-rate-impact": ["fire-calculator", "compound-interest", "financial-freedom-number", "cost-of-waiting", "millionaire-calculator"],
  "cost-of-waiting": ["compound-interest", "savings-rate-impact", "spend-vs-invest", "fire-calculator"],
  "lifestyle-inflation": ["savings-rate-impact", "budget-50-30-20", "fire-calculator", "financial-freedom-number"],
  "financial-freedom-number": ["fire-calculator", "savings-rate-impact", "millionaire-calculator", "retirement-budget", "net-worth-tracker"],

  // Advanced Tax Strategies
  "mega-backdoor-roth": ["backdoor-roth", "roth-vs-traditional", "cash-balance-plan", "deferred-compensation"],
  "backdoor-roth": ["mega-backdoor-roth", "roth-vs-traditional", "marginal-tax-rate", "rmd-calculator"],
  "roth-vs-traditional": ["backdoor-roth", "mega-backdoor-roth", "rmd-calculator", "marginal-tax-rate", "medicare-irmaa-calc"],
  "nua-calculator": ["rsu-tax", "capital-gains-tax", "roth-vs-traditional", "rmd-calculator"],
  "charitable-stock-donation": ["daf-vs-direct-giving", "crt-calculator", "capital-gains-tax", "deduction-optimizer"],
  "installment-sale": ["capital-gains-tax", "1031-exchange", "like-kind-exchange", "business-valuation"],
  "like-kind-exchange": ["1031-exchange", "installment-sale", "capital-gains-tax", "depreciation-tax-shield"],
  "gain-loss-harvesting": ["tax-loss-harvest-calc", "capital-gains-tax", "asset-allocation", "portfolio-risk-return"],
  "state-tax-arbitrage": ["cost-of-living", "marginal-tax-rate", "income-shifting", "retirement-budget"],
  "income-shifting": ["marginal-tax-rate", "state-tax-arbitrage", "entity-comparison", "qbi-calculator", "deduction-optimizer"],

  // Specialized Planning
  "special-needs-trust": ["gstt-calculator", "estate-liquidity", "ilit-calculator", "life-insurance-needs"],
  "divorce-settlement-enhanced": ["alimony-tax-impact", "asset-allocation", "retirement-budget", "estate-liquidity"],
  "alimony-tax-impact": ["divorce-settlement-enhanced", "marginal-tax-rate", "retirement-budget", "spousal-ss-coordination"],
  "windfall-management": ["asset-allocation", "marginal-tax-rate", "estate-liquidity", "daf-vs-direct-giving", "severance-calculator"],
  "sabbatical-planner": ["fire-calculator", "retirement-budget", "savings-rate-impact", "emergency-fund-vs-iul"],
  "aca-subsidy": ["retirement-healthcare", "medicare-irmaa-calc", "marginal-tax-rate", "roth-vs-traditional"],
  "hsa-triple-tax": ["retirement-healthcare", "deduction-optimizer", "aca-subsidy", "ltc-cost"],
  "pension-max": ["pension-vs-lump-sum", "life-insurance-needs", "term-vs-whole-vs-iul", "annuity-comparison"],
  "annuity-comparison": ["pension-vs-lump-sum", "safe-withdrawal-rate", "qlac-calculator", "pension-max"],
  "financial-health-score": ["net-worth-tracker", "financial-freedom-number", "fire-calculator", "retirement-budget", "asset-allocation"],
  "retirement-advantage": ["fire-calculator", "roth-vs-traditional", "safe-withdrawal-rate", "pension-max", "retirement-budget"],
};

/* ═══════════════════════════════════════════════════════════════════
   CALCULATOR METADATA (titles for display)
   ═══════════════════════════════════════════════════════════════════ */

const CALC_TITLES: Record<string, string> = {
  "rmd-calculator": "RMD Calculator",
  "marginal-tax-rate": "Marginal Tax Rate",
  "capital-gains-tax": "Capital Gains Tax",
  "amt-calculator": "AMT Calculator",
  "self-employment-tax": "Self-Employment Tax",
  "tax-equivalent-yield": "Tax-Equivalent Yield",
  "w4-optimizer": "W-4 Optimizer",
  "crypto-tax": "Crypto Tax",
  "rsu-tax": "RSU Tax",
  "deduction-optimizer": "Deduction Optimizer",
  "fire-calculator": "FIRE Calculator",
  "safe-withdrawal-rate": "Safe Withdrawal Rate",
  "pension-vs-lump-sum": "Pension vs Lump Sum",
  "qlac-calculator": "QLAC Calculator",
  "retirement-healthcare": "Retirement Healthcare",
  "medicare-irmaa-calc": "Medicare IRMAA",
  "spousal-ss-coordination": "Spousal SS Coordination",
  "dca-vs-lump-sum": "DCA vs Lump Sum",
  "retirement-budget": "Retirement Budget",
  "inflation-adjusted-income": "Inflation-Adjusted Income",
  "life-insurance-needs": "Life Insurance Needs",
  "disability-insurance-needs": "Disability Insurance",
  "ltc-cost": "Long-Term Care Cost",
  "umbrella-insurance": "Umbrella Insurance",
  "term-vs-whole-vs-iul": "Term vs Whole vs IUL",
  "key-person-insurance": "Key Person Insurance",
  "buy-sell-funding": "Buy-Sell Funding",
  "crt-calculator": "CRT Calculator",
  "grat-calculator": "GRAT Calculator",
  "ilit-calculator": "ILIT Calculator",
  "qprt-calculator": "QPRT Calculator",
  "gstt-calculator": "GSTT Calculator",
  "daf-vs-direct-giving": "DAF vs Direct Giving",
  "estate-liquidity": "Estate Liquidity",
  "net-worth-tracker": "Net Worth Tracker",
  "compound-interest": "Compound Interest",
  "millionaire-calculator": "Millionaire Calculator",
  "emergency-fund-vs-iul": "Emergency Fund vs IUL",
  "529-vs-iul": "529 vs IUL",
  "debt-payoff-optimizer": "Debt Payoff Optimizer",
  "rental-property-roi": "Rental Property ROI",
  "1031-exchange": "1031 Exchange",
  "opportunity-zone": "Opportunity Zone",
  "home-affordability": "Home Affordability",
  "refinance-break-even": "Refinance Break-Even",
  "cost-of-living": "Cost of Living",
  "reverse-mortgage": "Reverse Mortgage",
  "depreciation-tax-shield": "Depreciation Tax Shield",
  "property-tax-appeal": "Property Tax Appeal",
  "vacation-rental": "Vacation Rental",
  "business-valuation": "Business Valuation",
  "cash-balance-plan": "Cash Balance Plan",
  "entity-comparison": "Entity Comparison",
  "qbi-calculator": "QBI Calculator",
  "deferred-compensation": "Deferred Compensation",
  "captive-insurance": "Captive Insurance",
  "succession-plan": "Succession Plan",
  "esop-calculator": "ESOP Calculator",
  "severance-calculator": "Severance Calculator",
  "overhead-expense": "Overhead Expense",
  "asset-allocation": "Asset Allocation",
  "pe-irr-calculator": "Private Equity IRR",
  "bond-ladder": "Bond Ladder",
  "muni-bond-ladder": "Muni Bond Ladder",
  "drip-growth": "DRIP Growth",
  "options-profit-loss": "Options Profit/Loss",
  "portfolio-risk-return": "Portfolio Risk/Return",
  "sector-rotation": "Sector Rotation",
  "fee-impact": "Fee Impact",
  "tax-loss-harvest-calc": "Tax-Loss Harvesting",
  "budget-50-30-20": "50/30/20 Budget",
  "zero-based-budget": "Zero-Based Budget",
  "spend-vs-invest": "Spend vs Invest",
  "lease-vs-buy": "Lease vs Buy",
  "student-loan-vs-invest": "Student Loan vs Invest",
  "credit-card-payoff": "Credit Card Payoff",
  "savings-rate-impact": "Savings Rate Impact",
  "cost-of-waiting": "Cost of Waiting",
  "lifestyle-inflation": "Lifestyle Inflation",
  "financial-freedom-number": "Financial Freedom #",
  "mega-backdoor-roth": "Mega Backdoor Roth",
  "backdoor-roth": "Backdoor Roth",
  "roth-vs-traditional": "Roth vs Traditional",
  "nua-calculator": "NUA Calculator",
  "charitable-stock-donation": "Charitable Stock",
  "installment-sale": "Installment Sale",
  "like-kind-exchange": "Like-Kind Exchange",
  "gain-loss-harvesting": "Gain/Loss Harvesting",
  "state-tax-arbitrage": "State Tax Arbitrage",
  "income-shifting": "Income Shifting",
  "special-needs-trust": "Special Needs Trust",
  "divorce-settlement-enhanced": "Divorce Settlement",
  "alimony-tax-impact": "Alimony Tax Impact",
  "windfall-management": "Windfall Management",
  "sabbatical-planner": "Sabbatical Planner",
  "aca-subsidy": "ACA Subsidy",
  "hsa-triple-tax": "HSA Triple Tax",
  "pension-max": "Pension Max",
  "annuity-comparison": "Annuity Comparison",
  "financial-health-score": "Financial Health Score",
  "retirement-advantage": "Retirement Advantage",
};

/* Category colors for badges */
const CALC_CATEGORY_COLORS: Record<string, string> = {
  "rmd-calculator": "orange", "marginal-tax-rate": "orange", "capital-gains-tax": "orange",
  "amt-calculator": "orange", "self-employment-tax": "orange", "tax-equivalent-yield": "orange",
  "w4-optimizer": "orange", "crypto-tax": "orange", "rsu-tax": "orange", "deduction-optimizer": "orange",
  "fire-calculator": "amber", "safe-withdrawal-rate": "amber", "pension-vs-lump-sum": "amber",
  "qlac-calculator": "amber", "retirement-healthcare": "amber", "medicare-irmaa-calc": "amber",
  "spousal-ss-coordination": "amber", "dca-vs-lump-sum": "amber", "retirement-budget": "amber",
  "inflation-adjusted-income": "amber",
  "life-insurance-needs": "emerald", "disability-insurance-needs": "emerald", "ltc-cost": "emerald",
  "umbrella-insurance": "emerald", "term-vs-whole-vs-iul": "emerald", "key-person-insurance": "emerald",
  "buy-sell-funding": "emerald",
  "crt-calculator": "purple", "grat-calculator": "purple", "ilit-calculator": "purple",
  "qprt-calculator": "purple", "gstt-calculator": "purple", "daf-vs-direct-giving": "purple",
  "estate-liquidity": "purple",
  "net-worth-tracker": "cyan", "compound-interest": "cyan", "millionaire-calculator": "cyan",
  "emergency-fund-vs-iul": "cyan", "529-vs-iul": "cyan", "debt-payoff-optimizer": "cyan",
  "rental-property-roi": "teal", "1031-exchange": "teal", "opportunity-zone": "teal",
  "home-affordability": "teal", "refinance-break-even": "teal", "cost-of-living": "teal",
  "reverse-mortgage": "teal", "depreciation-tax-shield": "teal", "property-tax-appeal": "teal",
  "vacation-rental": "teal",
  "business-valuation": "blue", "cash-balance-plan": "blue", "entity-comparison": "blue",
  "qbi-calculator": "blue", "deferred-compensation": "blue", "captive-insurance": "blue",
  "succession-plan": "blue", "esop-calculator": "blue", "severance-calculator": "blue",
  "overhead-expense": "blue",
  "asset-allocation": "indigo", "pe-irr-calculator": "indigo", "bond-ladder": "indigo",
  "muni-bond-ladder": "indigo", "drip-growth": "indigo", "options-profit-loss": "indigo",
  "portfolio-risk-return": "indigo", "sector-rotation": "indigo", "fee-impact": "indigo",
  "tax-loss-harvest-calc": "indigo",
  "budget-50-30-20": "green", "zero-based-budget": "green", "spend-vs-invest": "green",
  "lease-vs-buy": "green", "student-loan-vs-invest": "green", "credit-card-payoff": "green",
  "savings-rate-impact": "green", "cost-of-waiting": "green", "lifestyle-inflation": "green",
  "financial-freedom-number": "green",
  "mega-backdoor-roth": "rose", "backdoor-roth": "rose", "roth-vs-traditional": "rose",
  "nua-calculator": "rose", "charitable-stock-donation": "rose", "installment-sale": "rose",
  "like-kind-exchange": "rose", "gain-loss-harvesting": "rose", "state-tax-arbitrage": "rose",
  "income-shifting": "rose",
  "special-needs-trust": "yellow", "divorce-settlement-enhanced": "yellow", "alimony-tax-impact": "yellow",
  "windfall-management": "yellow", "sabbatical-planner": "yellow", "aca-subsidy": "yellow",
  "hsa-triple-tax": "yellow", "pension-max": "yellow", "annuity-comparison": "yellow",
  "financial-health-score": "yellow", "retirement-advantage": "yellow",
};

/* ═══════════════════════════════════════════════════════════════════
   2. AUTO-FILL HOOK — maps ClientFactFinderData to calculator inputs
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Returns auto-fill values for a specific calculator based on the
 * currently selected client's Fact Finder data.
 *
 * Usage in any calculator:
 *   const autoFill = useCalculatorAutoFill("fire-calculator");
 *   const [age, setAge] = useState(autoFill.age ?? 30);
 */
export function useCalculatorAutoFill(calcRoute: string): Record<string, any> {
  const { data } = useClientData();

  return useMemo(() => {
    if (!data) return {};

    // Common fields that most calculators need
    const common = {
      age: data.age,
      retirementAge: data.retirementAge,
      annualIncome: data.annualIncome,
      filingStatus: data.filingStatus,
      state: data.state,
      spouseAge: data.spouseAge,
      spouseIncome: data.spouseIncome,
    };

    // Calculator-specific mappings
    const specific: Record<string, Record<string, any>> = {
      "rmd-calculator": { balance: data.iraBalance + data.k401Balance },
      "marginal-tax-rate": { income: data.annualIncome + data.spouseIncome },
      "capital-gains-tax": { income: data.annualIncome },
      "amt-calculator": { income: data.annualIncome + data.spouseIncome },
      "self-employment-tax": { selfEmploymentIncome: data.annualIncome },
      "tax-equivalent-yield": { taxBracket: data.annualIncome > 500000 ? 37 : data.annualIncome > 200000 ? 32 : 24 },
      "w4-optimizer": { income: data.annualIncome, dependents: data.dependents },
      "rsu-tax": { income: data.annualIncome },
      "deduction-optimizer": { income: data.annualIncome + data.spouseIncome, mortgageInterest: data.totalMortgageInterest },

      "fire-calculator": { currentAge: data.age, currentSavings: data.cashSavings + data.taxableInvestments + data.iraBalance + data.rothBalance },
      "safe-withdrawal-rate": { portfolioValue: data.taxableInvestments + data.iraBalance + data.rothBalance + data.cashSavings },
      "pension-vs-lump-sum": { pensionIncome: data.pensionIncome },
      "qlac-calculator": { iraBalance: data.iraBalance },
      "retirement-healthcare": { currentAge: data.age },
      "medicare-irmaa-calc": { income: data.annualIncome + data.spouseIncome },
      "spousal-ss-coordination": { primaryAge: data.age, spouseAge: data.spouseAge, primaryBenefit: data.socialSecurityEstimate },
      "retirement-budget": { monthlyExpenses: data.monthlyExpenses, socialSecurity: data.socialSecurityEstimate },
      "inflation-adjusted-income": { currentIncome: data.annualIncome },

      "life-insurance-needs": { income: data.annualIncome, mortgageBalance: data.mortgageBalance, dependents: data.dependents },
      "disability-insurance-needs": { income: data.annualIncome },
      "ltc-cost": { currentAge: data.age, state: data.state },
      "term-vs-whole-vs-iul": { currentAge: data.age, income: data.annualIncome },
      "key-person-insurance": { revenue: data.annualIncome },

      "crt-calculator": { assetValue: data.taxableInvestments },
      "grat-calculator": { assetValue: data.taxableInvestments + data.realEstateEquity },
      "ilit-calculator": { deathBenefit: data.lifeInsuranceDb, premium: data.annualPremium },
      "qprt-calculator": { homeValue: data.homeValue },
      "gstt-calculator": { estateValue: data.cashSavings + data.taxableInvestments + data.realEstateEquity + data.iraBalance + data.rothBalance },
      "estate-liquidity": { totalEstate: data.cashSavings + data.taxableInvestments + data.realEstateEquity + data.iraBalance + data.rothBalance + data.lifeInsuranceDb },

      "net-worth-tracker": { cash: data.cashSavings, investments: data.taxableInvestments, realEstate: data.realEstateEquity, retirement: data.iraBalance + data.rothBalance + data.k401Balance, debt: data.mortgageBalance + data.otherDebt },
      "compound-interest": { principal: data.cashSavings + data.taxableInvestments },
      "millionaire-calculator": { currentSavings: data.cashSavings + data.taxableInvestments, annualContribution: data.annualIncome * 0.15 },
      "emergency-fund-vs-iul": { monthlyExpenses: data.monthlyExpenses, cashSavings: data.cashSavings },
      "debt-payoff-optimizer": { totalDebt: data.mortgageBalance + data.otherDebt },

      "rental-property-roi": { propertyValue: data.homeValue },
      "home-affordability": { income: data.annualIncome + data.spouseIncome, downPayment: data.cashSavings * 0.5 },
      "refinance-break-even": { currentRate: data.mortgageRate, balance: data.mortgageBalance },
      "cost-of-living": { currentState: data.state },

      "business-valuation": { revenue: data.annualIncome },
      "cash-balance-plan": { income: data.annualIncome },
      "entity-comparison": { businessIncome: data.annualIncome },
      "qbi-calculator": { qualifiedIncome: data.annualIncome },
      "deferred-compensation": { salary: data.annualIncome },

      "asset-allocation": { totalPortfolio: data.taxableInvestments + data.iraBalance + data.rothBalance, riskTolerance: data.riskTolerance },
      "portfolio-risk-return": { portfolioValue: data.taxableInvestments + data.iraBalance + data.rothBalance },
      "fee-impact": { portfolioValue: data.taxableInvestments + data.iraBalance + data.rothBalance },

      "budget-50-30-20": { monthlyIncome: (data.annualIncome + data.spouseIncome) / 12 },
      "zero-based-budget": { monthlyIncome: (data.annualIncome + data.spouseIncome) / 12 },
      "savings-rate-impact": { income: data.annualIncome, currentSavingsRate: data.monthlyExpenses > 0 ? Math.round((1 - (data.monthlyExpenses * 12) / data.annualIncome) * 100) : 20 },
      "financial-freedom-number": { annualExpenses: data.monthlyExpenses * 12, currentSavings: data.cashSavings + data.taxableInvestments },
      "credit-card-payoff": { totalDebt: data.otherDebt },

      "mega-backdoor-roth": { income: data.annualIncome, k401Balance: data.k401Balance },
      "backdoor-roth": { income: data.annualIncome, iraBalance: data.iraBalance },
      "roth-vs-traditional": { income: data.annualIncome, currentAge: data.age, retirementAge: data.retirementAge },
      "nua-calculator": { employerStockValue: data.k401Balance * 0.3 },
      "charitable-stock-donation": { stockValue: data.taxableInvestments * 0.1 },
      "state-tax-arbitrage": { income: data.annualIncome, currentState: data.state },
      "income-shifting": { income: data.annualIncome, dependents: data.dependents },

      "divorce-settlement-enhanced": { totalAssets: data.cashSavings + data.taxableInvestments + data.realEstateEquity + data.iraBalance + data.rothBalance },
      "windfall-management": { windfallAmount: 0 },
      "sabbatical-planner": { income: data.annualIncome, savings: data.cashSavings },
      "aca-subsidy": { income: data.annualIncome + data.spouseIncome, dependents: data.dependents },
      "hsa-triple-tax": { income: data.annualIncome },
      "pension-max": { pensionIncome: data.pensionIncome },
      "annuity-comparison": { investmentAmount: data.cashSavings },
      "financial-health-score": {
        income: data.annualIncome, savings: data.cashSavings, investments: data.taxableInvestments,
        retirement: data.iraBalance + data.rothBalance, debt: data.mortgageBalance + data.otherDebt,
        insurance: data.lifeInsuranceDb, monthlyExpenses: data.monthlyExpenses
      },
    };

    return { ...common, ...(specific[calcRoute] || {}) };
  }, [data, calcRoute]);
}

/* ═══════════════════════════════════════════════════════════════════
   3. CALCULATOR RESULTS CONTEXT — stores results from all calculators
   ═══════════════════════════════════════════════════════════════════ */

interface CalcResult {
  route: string;
  timestamp: number;
  summary: Record<string, any>;
}

interface CalcResultsContextType {
  results: Record<string, CalcResult>;
  reportResult: (route: string, summary: Record<string, any>) => void;
  getFinancialHealthScore: () => FinancialHealthScore;
  getAISummary: () => string;
}

export interface FinancialHealthScore {
  overall: number;
  categories: {
    taxEfficiency: number;
    retirementReadiness: number;
    riskProtection: number;
    estatePreparedness: number;
    wealthGrowth: number;
    debtManagement: number;
  };
  insights: string[];
  calculatorsUsed: number;
}

const CalcResultsContext = createContext<CalcResultsContextType>({
  results: {},
  reportResult: () => {},
  getFinancialHealthScore: () => ({
    overall: 0,
    categories: { taxEfficiency: 0, retirementReadiness: 0, riskProtection: 0, estatePreparedness: 0, wealthGrowth: 0, debtManagement: 0 },
    insights: [],
    calculatorsUsed: 0,
  }),
  getAISummary: () => "",
});

const RESULTS_STORAGE_KEY = "rc_calc_results";

export function CalculatorResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<Record<string, CalcResult>>(() => {
    try {
      const stored = localStorage.getItem(RESULTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const reportResult = useCallback((route: string, summary: Record<string, any>) => {
    setResults(prev => {
      const next = { ...prev, [route]: { route, timestamp: Date.now(), summary } };
      try { localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const { data: clientData } = useClientData();

  const getFinancialHealthScore = useCallback((): FinancialHealthScore => {
    const used = Object.keys(results).length;
    const insights: string[] = [];

    // Tax Efficiency (from tax calculators)
    let taxScore = 50;
    if (results["marginal-tax-rate"]?.summary?.effectiveRate < 25) taxScore += 15;
    if (results["deduction-optimizer"]?.summary?.savings > 5000) taxScore += 10;
    if (results["roth-vs-traditional"]?.summary?.rothAdvantage) taxScore += 10;
    if (results["tax-loss-harvest-calc"]?.summary?.harvestable > 0) taxScore += 5;
    if (results["mega-backdoor-roth"]?.summary?.eligible) taxScore += 10;
    taxScore = Math.min(100, taxScore);

    // Retirement Readiness
    let retireScore = 40;
    if (results["fire-calculator"]?.summary?.yearsToFire < 20) retireScore += 20;
    if (results["safe-withdrawal-rate"]?.summary?.safeRate >= 3.5) retireScore += 15;
    if (results["retirement-budget"]?.summary?.surplus > 0) retireScore += 15;
    if (results["spousal-ss-coordination"]?.summary?.optimized) retireScore += 10;
    if (clientData && clientData.iraBalance + clientData.rothBalance > clientData.annualIncome * 5) retireScore += 10;
    retireScore = Math.min(100, retireScore);

    // Risk Protection
    let riskScore = 30;
    if (results["life-insurance-needs"]?.summary?.adequateCoverage) riskScore += 20;
    if (results["disability-insurance-needs"]?.summary?.covered) riskScore += 15;
    if (results["umbrella-insurance"]?.summary?.adequate) riskScore += 10;
    if (results["ltc-cost"]?.summary?.planned) riskScore += 15;
    if (clientData?.hasLTC) riskScore += 10;
    riskScore = Math.min(100, riskScore);

    // Estate Preparedness
    let estateScore = 30;
    if (results["estate-liquidity"]?.summary?.liquidityAdequate) estateScore += 25;
    if (results["ilit-calculator"]?.summary?.taxSavings > 0) estateScore += 15;
    if (results["grat-calculator"]?.summary?.wealthTransferred > 0) estateScore += 15;
    if (results["daf-vs-direct-giving"]?.summary?.taxBenefit > 0) estateScore += 15;
    estateScore = Math.min(100, estateScore);

    // Wealth Growth
    let wealthScore = 40;
    if (results["compound-interest"]?.summary?.futureValue > 1000000) wealthScore += 15;
    if (results["savings-rate-impact"]?.summary?.savingsRate > 20) wealthScore += 15;
    if (results["asset-allocation"]?.summary?.diversified) wealthScore += 10;
    if (results["fee-impact"]?.summary?.feeSavings > 0) wealthScore += 10;
    if (results["net-worth-tracker"]?.summary?.netWorth > 0) wealthScore += 10;
    wealthScore = Math.min(100, wealthScore);

    // Debt Management
    let debtScore = 60;
    if (results["debt-payoff-optimizer"]?.summary?.debtFreeYears < 10) debtScore += 15;
    if (results["credit-card-payoff"]?.summary?.paidOff) debtScore += 15;
    if (results["refinance-break-even"]?.summary?.savingsOverLife > 0) debtScore += 10;
    if (clientData && clientData.otherDebt === 0) debtScore += 15;
    debtScore = Math.min(100, debtScore);

    const overall = Math.round(
      (taxScore * 0.2 + retireScore * 0.25 + riskScore * 0.15 +
       estateScore * 0.15 + wealthScore * 0.15 + debtScore * 0.1)
    );

    // Generate insights
    if (taxScore < 60) insights.push("Tax optimization opportunities detected — run the Deduction Optimizer and Roth Conversion calculators");
    if (retireScore < 60) insights.push("Retirement readiness needs attention — use FIRE Calculator and Safe Withdrawal Rate tools");
    if (riskScore < 50) insights.push("Insurance coverage gaps identified — check Life Insurance Needs and Disability Insurance calculators");
    if (estateScore < 50) insights.push("Estate planning incomplete — run Estate Liquidity and ILIT calculators");
    if (wealthScore < 60) insights.push("Wealth growth could be accelerated — try Compound Interest and Asset Allocation tools");
    if (debtScore < 60) insights.push("Debt management can be improved — use Debt Payoff Optimizer");
    if (used < 10) insights.push(`Only ${used} calculators used — run more calculators for a comprehensive financial picture`);
    if (used >= 20) insights.push("Excellent calculator coverage! Your financial health assessment is highly accurate.");

    return {
      overall,
      categories: {
        taxEfficiency: taxScore,
        retirementReadiness: retireScore,
        riskProtection: riskScore,
        estatePreparedness: estateScore,
        wealthGrowth: wealthScore,
        debtManagement: debtScore,
      },
      insights,
      calculatorsUsed: used,
    };
  }, [results, clientData]);

  const getAISummary = useCallback((): string => {
    const health = getFinancialHealthScore();
    const clientName = clientData?.clientName || "Client";
    const resultEntries = Object.entries(results);

    let summary = `Financial Health Assessment for ${clientName}\n`;
    summary += `Overall Score: ${health.overall}/100 (based on ${health.calculatorsUsed} calculators)\n\n`;
    summary += `Category Scores:\n`;
    summary += `- Tax Efficiency: ${health.categories.taxEfficiency}/100\n`;
    summary += `- Retirement Readiness: ${health.categories.retirementReadiness}/100\n`;
    summary += `- Risk Protection: ${health.categories.riskProtection}/100\n`;
    summary += `- Estate Preparedness: ${health.categories.estatePreparedness}/100\n`;
    summary += `- Wealth Growth: ${health.categories.wealthGrowth}/100\n`;
    summary += `- Debt Management: ${health.categories.debtManagement}/100\n\n`;

    if (resultEntries.length > 0) {
      summary += `Calculator Results:\n`;
      for (const [route, result] of resultEntries) {
        const title = CALC_TITLES[route] || route;
        const vals = Object.entries(result.summary)
          .map(([k, v]) => `${k}: ${typeof v === "number" ? v.toLocaleString() : v}`)
          .join(", ");
        summary += `- ${title}: ${vals}\n`;
      }
    }

    if (health.insights.length > 0) {
      summary += `\nKey Insights:\n`;
      health.insights.forEach(i => { summary += `- ${i}\n`; });
    }

    return summary;
  }, [results, clientData, getFinancialHealthScore]);

  return (
    <CalcResultsContext.Provider value={{ results, reportResult, getFinancialHealthScore, getAISummary }}>
      {children}
    </CalcResultsContext.Provider>
  );
}

export function useCalcResults() {
  return useContext(CalcResultsContext);
}

/* ═══════════════════════════════════════════════════════════════════
   4. RELATED CALCULATORS COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

const colorMap: Record<string, string> = {
  orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  purple: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  teal: "bg-teal-500/10 border-teal-500/20 text-teal-400",
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  green: "bg-green-500/10 border-green-500/20 text-green-400",
  rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
};

export function RelatedCalculators({ currentRoute }: { currentRoute: string }) {
  const slug = currentRoute.replace("/portal/", "");
  const related = CALCULATOR_RELATIONSHIPS[slug] || [];
  const { results } = useCalcResults();

  if (related.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-[#1a3055]">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Related Calculators</h3>
        <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 text-xs">
          {related.length} connected
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {related.map(relSlug => {
          const title = CALC_TITLES[relSlug] || relSlug;
          const color = CALC_CATEGORY_COLORS[relSlug] || "cyan";
          const classes = colorMap[color] || colorMap.cyan;
          const hasResult = !!results[relSlug];

          return (
            <Link key={relSlug} href={`/portal/${relSlug}`}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${classes} hover:opacity-80 transition-all cursor-pointer group`}>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors truncate block">
                    {title}
                  </span>
                </div>
                {hasResult && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Results available" />
                )}
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-3 text-center">
        <Link href="/portal/calculator-hub">
          <span className="text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer">
            View all 100+ calculators in Calculator Hub →
          </span>
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5. AUTO-FILL BANNER — shows when client data is being used
   ═══════════════════════════════════════════════════════════════════ */

export function AutoFillBanner({ calcRoute }: { calcRoute: string }) {
  const { data } = useClientData();
  const autoFill = useCalculatorAutoFill(calcRoute);
  const fieldCount = Object.keys(autoFill).length;

  if (!data || fieldCount === 0) return null;

  return (
    <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      <span className="text-sm text-emerald-400">
        <strong>{fieldCount} fields</strong> auto-filled from <strong>{data.clientName}</strong>'s Fact Finder
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════════════════ */

export { CALC_TITLES, CALC_CATEGORY_COLORS };
