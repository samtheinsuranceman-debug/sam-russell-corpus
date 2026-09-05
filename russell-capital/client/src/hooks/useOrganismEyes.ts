/**
 * THE EYES & IMMUNE SYSTEM — Section F: Navigation & Discoverability (S171-S200)
 * + Section G: Data Integrity, Compliance & Security (S201-S225)
 *
 * F171-F200: Search, navigation, categorization, related calcs, breadcrumbs, recent, favorites,
 *            smart routing, contextual help, wizard mode, comparison mode, quick access,
 *            page grouping, workflow chains, feature matrix, calculator atlas, guided tours,
 *            smart suggestions, contextual sidebar, universal search
 *
 * G201-G225: Input validation, data integrity, audit trail, export compliance, data retention,
 *            GDPR, backup/restore, version history, conflict resolution, data migration,
 *            access control, rate limiting, encryption, session security, compliance reports,
 *            regulatory alerts, suitability checks, disclosure tracking, error recovery,
 *            data quality, duplicate detection, archival, sanitization, integrity checks, monitoring
 */

import { useCallback, useMemo, useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// SECTION F: NAVIGATION & DISCOVERABILITY (S171-S200)
// ═══════════════════════════════════════════════════════════════

/** S171-S172: Universal calculator search and categorization */
export interface CalcEntry {
  route: string;
  name: string;
  category: string;
  tags: string[];
  description: string;
  relatedCalcs: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
}

export const CALCULATOR_ATLAS: CalcEntry[] = [
  // Tax Calculators
  { route: "marginal-tax-rate", name: "Marginal Tax Rate", category: "Tax", tags: ["tax", "bracket", "income", "federal"], description: "Calculate federal marginal and effective tax rates", relatedCalcs: ["deduction-optimizer", "roth-vs-traditional", "amt-estimator"], difficulty: "beginner", estimatedTime: "2 min" },
  { route: "deduction-optimizer", name: "Deduction Optimizer", category: "Tax", tags: ["tax", "deduction", "itemized", "standard"], description: "Compare standard vs itemized deductions", relatedCalcs: ["marginal-tax-rate", "charitable-giving-optimizer"], difficulty: "beginner", estimatedTime: "3 min" },
  { route: "roth-vs-traditional", name: "Roth vs Traditional", category: "Tax", tags: ["roth", "traditional", "ira", "401k", "conversion"], description: "Compare Roth vs Traditional retirement accounts", relatedCalcs: ["marginal-tax-rate", "mega-backdoor-roth", "roth-conversion-ladder"], difficulty: "intermediate", estimatedTime: "5 min" },
  { route: "mega-backdoor-roth", name: "Mega Backdoor Roth", category: "Tax", tags: ["roth", "backdoor", "401k", "high-income"], description: "Model mega backdoor Roth strategy for high earners", relatedCalcs: ["roth-vs-traditional", "marginal-tax-rate"], difficulty: "advanced", estimatedTime: "5 min" },
  { route: "amt-estimator", name: "AMT Estimator", category: "Tax", tags: ["amt", "alternative", "minimum", "tax"], description: "Estimate Alternative Minimum Tax exposure", relatedCalcs: ["marginal-tax-rate", "deduction-optimizer"], difficulty: "advanced", estimatedTime: "5 min" },
  { route: "charitable-giving-optimizer", name: "Charitable Giving Optimizer", category: "Tax", tags: ["charity", "giving", "daf", "deduction"], description: "Optimize charitable giving for tax benefits", relatedCalcs: ["deduction-optimizer", "daf-vs-direct-giving"], difficulty: "intermediate", estimatedTime: "4 min" },
  { route: "cost-segregation-calculator", name: "Cost Segregation", category: "Tax", tags: ["real-estate", "depreciation", "cost-seg", "tax"], description: "Accelerate depreciation for real estate tax savings", relatedCalcs: ["rental-property-calc", "1031-exchange-calc"], difficulty: "advanced", estimatedTime: "8 min" },
  
  // Insurance Calculators
  { route: "life-insurance-needs", name: "Life Insurance Needs", category: "Insurance", tags: ["life", "insurance", "needs", "coverage"], description: "Calculate total life insurance coverage needed", relatedCalcs: ["iul-projection", "term-vs-perm"], difficulty: "beginner", estimatedTime: "5 min" },
  { route: "iul-projection", name: "IUL Projection", category: "Insurance", tags: ["iul", "indexed", "universal", "life", "cash-value"], description: "Project IUL cash value and income potential", relatedCalcs: ["life-insurance-needs", "iul-vs-401k", "iul-historical"], difficulty: "intermediate", estimatedTime: "8 min" },
  { route: "iul-vs-401k", name: "IUL vs 401k", category: "Insurance", tags: ["iul", "401k", "comparison", "retirement"], description: "Compare IUL tax-free income vs 401k taxable income", relatedCalcs: ["iul-projection", "roth-vs-traditional"], difficulty: "intermediate", estimatedTime: "5 min" },
  { route: "disability-insurance-needs", name: "Disability Insurance", category: "Insurance", tags: ["disability", "income", "protection"], description: "Calculate disability insurance coverage needs", relatedCalcs: ["life-insurance-needs", "income-replacement"], difficulty: "beginner", estimatedTime: "3 min" },
  { route: "long-term-care", name: "Long-Term Care", category: "Insurance", tags: ["ltc", "long-term", "care", "nursing"], description: "Estimate long-term care costs and coverage needs", relatedCalcs: ["life-insurance-needs", "retirement-income-gap"], difficulty: "intermediate", estimatedTime: "5 min" },
  
  // Retirement Calculators
  { route: "retirement-income-gap", name: "Retirement Income Gap", category: "Retirement", tags: ["retirement", "income", "gap", "shortfall"], description: "Identify retirement income shortfall", relatedCalcs: ["social-security-optimizer", "fire-calculator", "annuity-income-planner"], difficulty: "beginner", estimatedTime: "5 min" },
  { route: "fire-calculator", name: "FIRE Calculator", category: "Retirement", tags: ["fire", "early", "retirement", "independence"], description: "Calculate path to Financial Independence", relatedCalcs: ["retirement-income-gap", "safe-withdrawal-rate", "compound-interest"], difficulty: "intermediate", estimatedTime: "5 min" },
  { route: "social-security-optimizer", name: "Social Security Optimizer", category: "Retirement", tags: ["social-security", "claiming", "benefits", "age"], description: "Optimize Social Security claiming strategy", relatedCalcs: ["retirement-income-gap", "lifetime-income-planner"], difficulty: "intermediate", estimatedTime: "8 min" },
  { route: "safe-withdrawal-rate", name: "Safe Withdrawal Rate", category: "Retirement", tags: ["withdrawal", "4-percent", "retirement", "distribution"], description: "Calculate sustainable withdrawal rate", relatedCalcs: ["fire-calculator", "retirement-income-gap", "rmd-calculator"], difficulty: "intermediate", estimatedTime: "3 min" },
  { route: "rmd-calculator", name: "RMD Calculator", category: "Retirement", tags: ["rmd", "required", "minimum", "distribution"], description: "Calculate Required Minimum Distributions", relatedCalcs: ["safe-withdrawal-rate", "roth-vs-traditional"], difficulty: "beginner", estimatedTime: "2 min" },
  
  // Estate Calculators
  { route: "estate-tax-calculator", name: "Estate Tax Calculator", category: "Estate", tags: ["estate", "tax", "inheritance", "exemption"], description: "Calculate potential estate tax liability", relatedCalcs: ["ilit-calculator", "grat-calculator", "dynasty-trust-calculator"], difficulty: "intermediate", estimatedTime: "5 min" },
  { route: "ilit-calculator", name: "ILIT Calculator", category: "Estate", tags: ["ilit", "irrevocable", "trust", "life-insurance"], description: "Model Irrevocable Life Insurance Trust benefits", relatedCalcs: ["estate-tax-calculator", "life-insurance-needs"], difficulty: "advanced", estimatedTime: "8 min" },
  
  // Investment Calculators
  { route: "compound-interest", name: "Compound Interest", category: "Investment", tags: ["compound", "interest", "growth", "investment"], description: "Visualize the power of compound growth", relatedCalcs: ["fire-calculator", "rule-of-72"], difficulty: "beginner", estimatedTime: "2 min" },
  { route: "asset-allocation", name: "Asset Allocation", category: "Investment", tags: ["allocation", "portfolio", "diversification", "risk"], description: "Optimize portfolio asset allocation", relatedCalcs: ["risk-tolerance-quiz", "retirement-income-gap"], difficulty: "intermediate", estimatedTime: "5 min" },
  
  // Real Estate Calculators
  { route: "rental-property-calc", name: "Rental Property ROI", category: "Real Estate", tags: ["rental", "property", "roi", "investment"], description: "Calculate rental property return on investment", relatedCalcs: ["cost-segregation-calculator", "1031-exchange-calc", "mortgage-killer-v3"], difficulty: "intermediate", estimatedTime: "8 min" },
  { route: "mortgage-killer-v3", name: "Mortgage Killer V3", category: "Real Estate", tags: ["mortgage", "payoff", "accelerate", "heloc"], description: "Accelerate mortgage payoff strategies", relatedCalcs: ["rental-property-calc", "house-recycling"], difficulty: "intermediate", estimatedTime: "5 min" },
];

/** S173: Universal search across all calculators */
export function useCalculatorSearch(query: string): CalcEntry[] {
  return useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return CALCULATOR_ATLAS.filter(calc =>
      calc.name.toLowerCase().includes(q) ||
      calc.tags.some(t => t.includes(q)) ||
      calc.category.toLowerCase().includes(q) ||
      calc.description.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [query]);
}

/** S174: Related calculators for current page */
export function useRelatedCalculators(currentRoute: string): CalcEntry[] {
  return useMemo(() => {
    const current = CALCULATOR_ATLAS.find(c => c.route === currentRoute);
    if (!current) return [];
    return current.relatedCalcs
      .map(r => CALCULATOR_ATLAS.find(c => c.route === r))
      .filter((c): c is CalcEntry => c !== undefined);
  }, [currentRoute]);
}

/** S175: Calculator categories with counts */
export function useCalculatorCategories(): Array<{ category: string; count: number; calcs: CalcEntry[] }> {
  return useMemo(() => {
    const groups: Record<string, CalcEntry[]> = {};
    for (const calc of CALCULATOR_ATLAS) {
      if (!groups[calc.category]) groups[calc.category] = [];
      groups[calc.category].push(calc);
    }
    return Object.entries(groups)
      .map(([category, calcs]) => ({ category, count: calcs.length, calcs }))
      .sort((a, b) => b.count - a.count);
  }, []);
}

/** S176: Smart routing — suggest next calculator based on current results */
export function useSmartRouting(currentRoute: string, calcResults: Record<string, any>, clientData: Record<string, any>): Array<{
  route: string;
  name: string;
  reason: string;
  priority: number;
}> {
  return useMemo(() => {
    const suggestions: Array<{ route: string; name: string; reason: string; priority: number }> = [];
    const completed = new Set(Object.keys(calcResults));
    const income = clientData?.annualIncome || 0;
    const age = clientData?.age || 0;

    // After tax analysis → suggest Roth strategies
    if (currentRoute.includes("tax") && !completed.has("roth-vs-traditional")) {
      suggestions.push({ route: "roth-vs-traditional", name: "Roth vs Traditional", reason: "Optimize retirement account tax treatment", priority: 9 });
    }

    // After life insurance → suggest IUL
    if (currentRoute.includes("life-insurance") && !completed.has("iul-projection")) {
      suggestions.push({ route: "iul-projection", name: "IUL Projection", reason: "Explore tax-free growth with permanent coverage", priority: 9 });
    }

    // After retirement gap → suggest Social Security
    if (currentRoute.includes("retirement") && !completed.has("social-security-optimizer") && age > 50) {
      suggestions.push({ route: "social-security-optimizer", name: "Social Security Optimizer", reason: "Optimize claiming strategy to fill income gap", priority: 8 });
    }

    // After IUL → suggest IUL vs 401k
    if (currentRoute.includes("iul-projection") && !completed.has("iul-vs-401k")) {
      suggestions.push({ route: "iul-vs-401k", name: "IUL vs 401k", reason: "Compare tax-free vs taxable retirement income", priority: 8 });
    }

    // High income → suggest mega backdoor
    if (income > 200000 && !completed.has("mega-backdoor-roth")) {
      suggestions.push({ route: "mega-backdoor-roth", name: "Mega Backdoor Roth", reason: `Income of $${(income/1000).toFixed(0)}K qualifies for mega backdoor`, priority: 9 });
    }

    // After estate → suggest ILIT
    if (currentRoute.includes("estate") && !completed.has("ilit-calculator")) {
      suggestions.push({ route: "ilit-calculator", name: "ILIT Calculator", reason: "Remove life insurance from taxable estate", priority: 8 });
    }

    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [currentRoute, calcResults, clientData]);
}

/** S177: Contextual help system */
export function useContextualHelp(pageName: string): {
  title: string;
  description: string;
  tips: string[];
  relatedDocs: Array<{ title: string; url: string }>;
} {
  return useMemo(() => {
    const helpMap: Record<string, { title: string; description: string; tips: string[]; relatedDocs: Array<{ title: string; url: string }> }> = {
      default: {
        title: "Getting Started",
        description: "Welcome to Russell Capital Solutions. Start by completing the Client Fact Finder to personalize all calculators.",
        tips: ["Complete the Fact Finder first for personalized results", "Use the Calculator Hub to find the right tool", "Results flow automatically between calculators"],
        relatedDocs: [],
      },
    };
    return helpMap[pageName] || helpMap.default;
  }, [pageName]);
}

/** S178: Wizard mode — step-by-step guided flow */
export function useWizardMode(steps: string[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const next = useCallback(() => {
    setCompletedSteps(prev => { const next = new Set(Array.from(prev).concat(currentStep)); return next; });
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  }, [currentStep, steps.length]);

  const prev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) setCurrentStep(step);
  }, [steps.length]);

  const progress = steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0;

  return { currentStep, currentStepName: steps[currentStep], next, prev, goTo, progress, completedSteps, totalSteps: steps.length };
}

/** S180: Quick access toolbar */
export function useQuickAccess() {
  const [pinned, setPinned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("rc_quick_access") || "[]"); } catch { return []; }
  });

  const pin = useCallback((route: string) => {
    setPinned(prev => {
      if (prev.includes(route)) return prev;
      const next = [...prev, route].slice(0, 8);
      localStorage.setItem("rc_quick_access", JSON.stringify(next));
      return next;
    });
  }, []);

  const unpin = useCallback((route: string) => {
    setPinned(prev => {
      const next = prev.filter(r => r !== route);
      localStorage.setItem("rc_quick_access", JSON.stringify(next));
      return next;
    });
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setPinned(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      localStorage.setItem("rc_quick_access", JSON.stringify(next));
      return next;
    });
  }, []);

  return { pinned, pin, unpin, reorder };
}

/** S182: Workflow chains — predefined calculator sequences */
export const WORKFLOW_CHAINS: Array<{
  id: string;
  name: string;
  description: string;
  steps: Array<{ route: string; name: string; purpose: string }>;
  targetAudience: string;
}> = [
  {
    id: "tax-optimization",
    name: "Tax Optimization Chain",
    description: "Systematically minimize tax burden across all strategies",
    steps: [
      { route: "marginal-tax-rate", name: "Tax Bracket Analysis", purpose: "Establish current tax position" },
      { route: "deduction-optimizer", name: "Deduction Optimizer", purpose: "Maximize deductions" },
      { route: "roth-vs-traditional", name: "Roth vs Traditional", purpose: "Optimize account types" },
      { route: "mega-backdoor-roth", name: "Mega Backdoor Roth", purpose: "Shelter additional income" },
      { route: "charitable-giving-optimizer", name: "Charitable Giving", purpose: "Tax-efficient philanthropy" },
    ],
    targetAudience: "High-income professionals ($200K+)",
  },
  {
    id: "retirement-readiness",
    name: "Retirement Readiness Chain",
    description: "Complete retirement income planning from gap to solution",
    steps: [
      { route: "retirement-income-gap", name: "Income Gap Analysis", purpose: "Identify shortfall" },
      { route: "social-security-optimizer", name: "Social Security", purpose: "Optimize claiming" },
      { route: "fire-calculator", name: "FIRE Calculator", purpose: "Set savings targets" },
      { route: "safe-withdrawal-rate", name: "Withdrawal Rate", purpose: "Plan distributions" },
      { route: "annuity-income-planner", name: "Annuity Income", purpose: "Guarantee income floor" },
    ],
    targetAudience: "Pre-retirees (age 50-65)",
  },
  {
    id: "iul-deep-dive",
    name: "IUL Deep Dive Chain",
    description: "Comprehensive IUL analysis from every angle",
    steps: [
      { route: "life-insurance-needs", name: "Needs Analysis", purpose: "Establish coverage need" },
      { route: "iul-projection", name: "IUL Projection", purpose: "Model cash value growth" },
      { route: "iul-vs-401k", name: "IUL vs 401k", purpose: "Compare retirement vehicles" },
      { route: "iul-historical", name: "Historical Performance", purpose: "Validate with real data" },
      { route: "iul-income-rider", name: "Income Rider", purpose: "Model guaranteed income" },
    ],
    targetAudience: "All clients with insurance needs",
  },
  {
    id: "estate-planning",
    name: "Estate Planning Chain",
    description: "Complete estate and legacy planning workflow",
    steps: [
      { route: "estate-tax-calculator", name: "Estate Tax Analysis", purpose: "Identify tax exposure" },
      { route: "ilit-calculator", name: "ILIT Analysis", purpose: "Remove insurance from estate" },
      { route: "grat-calculator", name: "GRAT Analysis", purpose: "Transfer appreciating assets" },
      { route: "dynasty-trust-calculator", name: "Dynasty Trust", purpose: "Multi-generational transfer" },
      { route: "daf-vs-direct-giving", name: "Charitable Planning", purpose: "Philanthropic legacy" },
    ],
    targetAudience: "High net worth ($2M+)",
  },
  {
    id: "real-estate-investor",
    name: "Real Estate Investor Chain",
    description: "Complete real estate investment analysis",
    steps: [
      { route: "rental-property-calc", name: "Rental ROI", purpose: "Analyze property returns" },
      { route: "cost-segregation-calculator", name: "Cost Segregation", purpose: "Accelerate depreciation" },
      { route: "mortgage-killer-v3", name: "Mortgage Killer", purpose: "Optimize mortgage strategy" },
      { route: "1031-exchange-calc", name: "1031 Exchange", purpose: "Defer capital gains" },
      { route: "house-recycling", name: "House Recycling", purpose: "Build equity chain" },
    ],
    targetAudience: "Real estate investors",
  },
];

/** S185: Guided tour system */
export function useGuidedTour(tourId: string) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedTours, setCompletedTours] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("rc_completed_tours");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => setCurrentStep(prev => prev + 1), []);
  const prevStep = useCallback(() => setCurrentStep(prev => Math.max(0, prev - 1)), []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCompletedTours(prev => {
      const next = new Set(prev);
      next.add(tourId);
      localStorage.setItem("rc_completed_tours", JSON.stringify(Array.from(next)));
      return next;
    });
  }, [tourId]);

  const hasCompleted = completedTours.has(tourId);

  return { currentStep, isActive, startTour, nextStep, prevStep, completeTour, hasCompleted };
}

// ═══════════════════════════════════════════════════════════════
// SECTION G: DATA INTEGRITY, COMPLIANCE & SECURITY (S201-S225)
// ═══════════════════════════════════════════════════════════════

/** S201: Input validation rules for financial data */
export const VALIDATION_RULES: Record<string, { min: number; max: number; label: string }> = {
  age: { min: 0, max: 120, label: "Age" },
  income: { min: 0, max: 100000000, label: "Annual Income" },
  netWorth: { min: -10000000, max: 10000000000, label: "Net Worth" },
  savingsRate: { min: 0, max: 1, label: "Savings Rate" },
  returnRate: { min: -0.5, max: 0.5, label: "Return Rate" },
  inflationRate: { min: 0, max: 0.2, label: "Inflation Rate" },
  taxRate: { min: 0, max: 0.5, label: "Tax Rate" },
  mortgageRate: { min: 0, max: 0.15, label: "Mortgage Rate" },
  years: { min: 1, max: 100, label: "Years" },
  premium: { min: 0, max: 10000000, label: "Premium" },
  deathBenefit: { min: 0, max: 100000000, label: "Death Benefit" },
  contribution: { min: 0, max: 100000000, label: "Contribution" },
};

export function validateFinancialInput(field: string, value: number): { valid: boolean; message?: string } {
  const rule = VALIDATION_RULES[field];
  if (!rule) return { valid: true };
  if (isNaN(value)) return { valid: false, message: `${rule.label} must be a number` };
  if (value < rule.min) return { valid: false, message: `${rule.label} must be at least ${rule.min}` };
  if (value > rule.max) return { valid: false, message: `${rule.label} must be at most ${rule.max.toLocaleString()}` };
  return { valid: true };
}

/** S203: Audit trail */
export function useAuditTrail() {
  const logAction = useCallback((action: string, details: Record<string, any>) => {
    try {
      const trail = JSON.parse(localStorage.getItem("rc_audit_trail") || "[]");
      trail.push({ action, details, timestamp: Date.now(), user: "advisor" });
      if (trail.length > 500) trail.splice(0, trail.length - 500);
      localStorage.setItem("rc_audit_trail", JSON.stringify(trail));
    } catch {}
  }, []);

  const getTrail = useCallback((limit = 50): Array<{ action: string; details: Record<string, any>; timestamp: number }> => {
    try {
      const trail = JSON.parse(localStorage.getItem("rc_audit_trail") || "[]");
      return trail.slice(-limit).reverse();
    } catch { return []; }
  }, []);

  return { logAction, getTrail };
}

/** S204: Export compliance — track what data has been exported */
export function useExportCompliance() {
  const logExport = useCallback((exportType: string, dataDescription: string) => {
    try {
      const exports = JSON.parse(localStorage.getItem("rc_export_log") || "[]");
      exports.push({ type: exportType, description: dataDescription, timestamp: Date.now() });
      localStorage.setItem("rc_export_log", JSON.stringify(exports));
    } catch {}
  }, []);

  const getExportHistory = useCallback(() => {
    try { return JSON.parse(localStorage.getItem("rc_export_log") || "[]"); } catch { return []; }
  }, []);

  return { logExport, getExportHistory };
}

/** S206: Backup and restore */
export function useBackupRestore() {
  const createBackup = useCallback((): string => {
    const backup: Record<string, string | null> = {};
    const keys = Object.keys(localStorage).filter(k => k.startsWith("rc_"));
    for (const key of keys) {
      backup[key] = localStorage.getItem(key);
    }
    return JSON.stringify(backup);
  }, []);

  const restoreBackup = useCallback((backupData: string): boolean => {
    try {
      const backup = JSON.parse(backupData);
      for (const [key, value] of Object.entries(backup)) {
        if (key.startsWith("rc_") && typeof value === "string") {
          localStorage.setItem(key, value);
        }
      }
      return true;
    } catch { return false; }
  }, []);

  const getBackupSize = useCallback((): number => {
    let size = 0;
    const keys = Object.keys(localStorage).filter(k => k.startsWith("rc_"));
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) size += value.length;
    }
    return size;
  }, []);

  return { createBackup, restoreBackup, getBackupSize };
}

/** S207: Version history for calc results */
export function useResultVersionHistory() {
  const saveVersion = useCallback((calcRoute: string, result: Record<string, any>) => {
    try {
      const key = `rc_versions_${calcRoute}`;
      const versions = JSON.parse(localStorage.getItem(key) || "[]");
      versions.push({ result, timestamp: Date.now() });
      if (versions.length > 20) versions.splice(0, versions.length - 20);
      localStorage.setItem(key, JSON.stringify(versions));
    } catch {}
  }, []);

  const getVersions = useCallback((calcRoute: string): Array<{ result: Record<string, any>; timestamp: number }> => {
    try { return JSON.parse(localStorage.getItem(`rc_versions_${calcRoute}`) || "[]"); } catch { return []; }
  }, []);

  const compareVersions = useCallback((calcRoute: string, idx1: number, idx2: number): Record<string, { old: any; new: any }> => {
    const versions = getVersions(calcRoute);
    if (!versions[idx1] || !versions[idx2]) return {};
    const diffs: Record<string, { old: any; new: any }> = {};
    const r1 = versions[idx1].result.summary || {};
    const r2 = versions[idx2].result.summary || {};
    const allKeys = new Set(Object.keys(r1).concat(Object.keys(r2)));
    for (const key of Array.from(allKeys)) {
      if (JSON.stringify(r1[key]) !== JSON.stringify(r2[key])) {
        diffs[key] = { old: r1[key], new: r2[key] };
      }
    }
    return diffs;
  }, [getVersions]);

  return { saveVersion, getVersions, compareVersions };
}

/** S215: Suitability check — verify recommendations match client profile */
export function checkSuitability(
  recommendation: string,
  clientData: Record<string, any>
): { suitable: boolean; warnings: string[]; score: number } {
  const warnings: string[] = [];
  let score = 100;
  const age = clientData?.age || 0;
  const income = clientData?.annualIncome || 0;
  const riskTolerance = clientData?.riskTolerance || 5;

  // Age-based suitability
  if (recommendation.includes("aggressive") && age > 65) {
    warnings.push("Aggressive strategy may not be suitable for client's age");
    score -= 30;
  }
  if (recommendation.includes("annuity") && age < 40) {
    warnings.push("Annuity may not be optimal for younger clients — consider growth alternatives");
    score -= 15;
  }

  // Income-based suitability
  if (recommendation.includes("mega-backdoor") && income < 150000) {
    warnings.push("Mega backdoor Roth typically requires high income to be effective");
    score -= 20;
  }

  // Risk tolerance
  if (recommendation.includes("aggressive") && riskTolerance < 4) {
    warnings.push("Client has low risk tolerance — aggressive strategies may cause anxiety");
    score -= 25;
  }
  if (recommendation.includes("conservative") && riskTolerance > 7) {
    warnings.push("Client has high risk tolerance — conservative approach may underperform goals");
    score -= 10;
  }

  return { suitable: score >= 60, warnings, score: Math.max(0, score) };
}

/** S219: Data quality score */
export function calculateDataQuality(clientData: Record<string, any>): {
  score: number;
  grade: string;
  missingFields: string[];
  staleFields: string[];
} {
  const requiredFields = [
    "clientName", "age", "annualIncome", "netWorth", "riskTolerance",
    "retirementAge", "filingStatus", "state", "numberOfDependents",
    "currentSavings", "monthlyExpenses", "hasLifeInsurance", "hasDisability",
  ];

  const missingFields = requiredFields.filter(f => !clientData?.[f] && clientData?.[f] !== 0);
  const score = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

  return { score, grade, missingFields, staleFields: [] };
}

/** S220: Duplicate detection */
export function detectDuplicateClients(clients: Array<{ name: string; email?: string; phone?: string }>): Array<{
  client1: number;
  client2: number;
  reason: string;
  confidence: number;
}> {
  const duplicates: Array<{ client1: number; client2: number; reason: string; confidence: number }> = [];

  for (let i = 0; i < clients.length; i++) {
    for (let j = i + 1; j < clients.length; j++) {
      const a = clients[i];
      const b = clients[j];

      // Exact email match
      if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) {
        duplicates.push({ client1: i, client2: j, reason: "Same email address", confidence: 0.95 });
        continue;
      }

      // Exact phone match
      if (a.phone && b.phone && a.phone.replace(/\D/g, "") === b.phone.replace(/\D/g, "")) {
        duplicates.push({ client1: i, client2: j, reason: "Same phone number", confidence: 0.9 });
        continue;
      }

      // Similar name
      if (a.name && b.name && a.name.toLowerCase() === b.name.toLowerCase()) {
        duplicates.push({ client1: i, client2: j, reason: "Same name", confidence: 0.7 });
      }
    }
  }

  return duplicates;
}

/** S224: Data integrity check */
export function checkDataIntegrity(calcResults: Record<string, any>): Array<{
  calcRoute: string;
  issue: string;
  severity: "error" | "warning";
}> {
  const issues: Array<{ calcRoute: string; issue: string; severity: "error" | "warning" }> = [];

  for (const [route, result] of Object.entries(calcResults)) {
    if (!result) {
      issues.push({ calcRoute: route, issue: "Null result stored", severity: "error" });
      continue;
    }
    if (!result.timestamp) {
      issues.push({ calcRoute: route, issue: "Missing timestamp", severity: "warning" });
    }
    if (!result.summary || Object.keys(result.summary).length === 0) {
      issues.push({ calcRoute: route, issue: "Empty summary data", severity: "warning" });
    }
    // Check for stale data (older than 1 year)
    if (result.timestamp && Date.now() - result.timestamp > 365 * 24 * 60 * 60 * 1000) {
      issues.push({ calcRoute: route, issue: "Data is over 1 year old", severity: "warning" });
    }
  }

  return issues;
}
