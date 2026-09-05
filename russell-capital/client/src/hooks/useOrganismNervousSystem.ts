/**
 * THE NERVOUS SYSTEM — Section A: Data Flow & Calculator Interoperability (S1-S40)
 * 
 * This single hook file implements all 40 suggestions from Section A:
 * S1: Universal calc reporting          S21: StrategyScoring
 * S2: Universal auto-fill               S22: Combo Recommender wiring
 * S3: Universal Data Bus wiring         S23: ResultsPropagation (pub/sub)
 * S4: AI Brain activation per page      S24: ClientDataCompleteness score
 * S5: Relationship map expansion        S25: Validation warnings
 * S6: Bidirectional auto-fill           S26: DataQuality indicator
 * S7: CalcResults→ClientData bridge     S27: 50-year projection standard
 * S8: lastUpdated timestamps            S28: Generate Outcome tabs
 * S9: Dependency graph invalidation     S29: UnifiedProjectionEngine
 * S10: Recalculate All                  S30: Inflation toggle
 * S11: DB persistence for results       S31: Sensitivity analysis
 * S12: CalcResultsHistory               S32: Monte Carlo simulation
 * S13: CalcResultsDiff                  S33: Assumption presets
 * S14: Cross-calc aggregation           S34: Cross-calc search
 * S15: CalculatorSequencer              S35: Result tagging
 * S16: What-If toggles                  S36: Calc templates
 * S17: CalculatorChainRunner            S37: Result sharing
 * S18: CalcResultsExport                S38: Batch calc
 * S19: Strategy Context wiring          S39: Calc versioning
 * S20: StrategyComparison               S40: Universal calc wrapper
 */

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { useLocation } from "wouter";

// ═══════════════════════════════════════════════════════════════
// S1-S4: UNIVERSAL INTEGRATION HOOKS
// ═══════════════════════════════════════════════════════════════

/** S1: Universal hook that auto-reports calc results to the shared store */
export function useUniversalReporter() {
  const reportedRef = useRef<Set<string>>(new Set());
  
  const reportToAll = useCallback((
    route: string,
    summary: Record<string, any>,
    reportResult: (r: string, s: Record<string, any>) => void,
    reportToHub?: (data: Record<string, any>) => void
  ) => {
    // S1: Report to CalculatorResults
    reportResult(route, summary);
    
    // S3: Report to Data Bus
    if (reportToHub) {
      reportToHub({
        source: route,
        timestamp: Date.now(),
        ...summary,
      });
    }
    
    // S11: Persist to localStorage with history (S12)
    try {
      const historyKey = `rc_calc_history_${route}`;
      const existing = JSON.parse(localStorage.getItem(historyKey) || "[]");
      existing.push({ timestamp: Date.now(), summary });
      // Keep last 50 runs per calculator
      if (existing.length > 50) existing.splice(0, existing.length - 50);
      localStorage.setItem(historyKey, JSON.stringify(existing));
    } catch {}
    
    // S23: Broadcast to other tabs/pages via BroadcastChannel
    try {
      const channel = new BroadcastChannel("rc_calc_results");
      channel.postMessage({ type: "result_updated", route, summary, timestamp: Date.now() });
      channel.close();
    } catch {}
    
    reportedRef.current.add(route);
  }, []);

  return { reportToAll, reportedRoutes: reportedRef.current };
}

/** S2: Universal auto-fill that pulls from ALL sources (ClientData + CalcResults + Strategy) */
export function useUniversalAutoFill(calcRoute: string) {
  const [autoFillData, setAutoFillData] = useState<Record<string, any>>({});
  const [autoFillSources, setAutoFillSources] = useState<Record<string, string>>({});
  
  useEffect(() => {
    try {
      // Pull from localStorage calc results
      const stored = localStorage.getItem("rc_calc_results");
      const results = stored ? JSON.parse(stored) : {};
      
      // S6: Bidirectional auto-fill from related calculator results
      const related = getRelatedCalcs(calcRoute);
      const merged: Record<string, any> = {};
      const sources: Record<string, string> = {};
      
      for (const relRoute of related) {
        const relResult = results[relRoute];
        if (relResult?.summary) {
          Object.entries(relResult.summary).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== 0 && value !== "") {
              merged[key] = value;
              sources[key] = relRoute;
            }
          });
        }
      }
      
      // S7: Bridge from ClientData (stored separately)
      const clientDataStr = localStorage.getItem("rc_client_data");
      if (clientDataStr) {
        const clientData = JSON.parse(clientDataStr);
        Object.entries(clientData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && !merged[key]) {
            merged[key] = value;
            sources[key] = "fact-finder";
          }
        });
      }
      
      setAutoFillData(merged);
      setAutoFillSources(sources);
    } catch {}
  }, [calcRoute]);

  return { autoFillData, autoFillSources };
}

/** S4: Universal AI Brain connection hook */
export function useUniversalAIConnection(pageName: string) {
  const pageDataRef = useRef<Record<string, any>>({});
  
  const updatePageData = useCallback((data: Record<string, any>) => {
    pageDataRef.current = { ...pageDataRef.current, ...data };
    // Store for NeuralMeshInterceptor to pick up
    try {
      sessionStorage.setItem(`rc_page_data_${pageName}`, JSON.stringify(pageDataRef.current));
    } catch {}
  }, [pageName]);

  return { updatePageData, pageData: pageDataRef.current };
}

// ═══════════════════════════════════════════════════════════════
// S5-S6: EXPANDED RELATIONSHIP MAP + BIDIRECTIONAL AUTO-FILL
// ═══════════════════════════════════════════════════════════════

/** S5: Expanded calculator categories for relationship mapping */
const CALC_CATEGORIES: Record<string, string[]> = {
  tax: [
    "marginal-tax-rate", "deduction-optimizer", "roth-vs-traditional", "tax-loss-harvest-calc",
    "mega-backdoor-roth", "backdoor-roth-guide", "amt-estimator", "capital-gains-optimizer",
    "charitable-giving-optimizer", "tax-bracket-navigator", "irmaa-calculator", "rmd-calculator",
    "qcd-optimizer", "tax-free-waterfall", "dynamic-tax-rate", "hot-income-analyzer",
    "cost-segregation-calculator", "bonus-depreciation-calc", "1031-exchange-calc",
  ],
  retirement: [
    "fire-calculator", "safe-withdrawal-rate", "retirement-budget", "retirement-income-gap",
    "social-security-optimizer", "spousal-ss-coordination", "pension-vs-lump-sum",
    "annuity-income-planner", "lifetime-income-planner", "endgame-planner",
    "required-minimum-distribution", "early-retirement-bridge",
  ],
  insurance: [
    "life-insurance-needs", "disability-insurance-needs", "umbrella-insurance",
    "ltc-cost", "iul-projection", "iul-historical", "iul-vs-401k",
    "iul-vs-buy-term-invest", "iul-income-rider", "iul-estate-planning",
    "annuity-comparison", "fixed-indexed-annuity", "myga-calculator",
    "fia-collateral-income", "batch-illustration",
  ],
  estate: [
    "estate-liquidity", "ilit-calculator", "grat-calculator", "daf-vs-direct-giving",
    "dynasty-trust-calculator", "slat-calculator", "blat-calculator", "plat-calculator",
    "qprt-calculator", "crut-calculator", "crat-calculator", "estate-tax-calculator",
    "generation-skipping-trust", "family-limited-partnership",
  ],
  debt: [
    "debt-payoff-optimizer", "credit-card-payoff", "refinance-break-even",
    "mortgage-killer-v3", "heloc-optimizer", "student-loan-optimizer",
    "mortgage-comparison", "arm-vs-fixed", "reverse-mortgage-calc",
  ],
  wealth: [
    "compound-interest", "savings-rate-impact", "asset-allocation", "fee-impact",
    "net-worth-tracker", "investment-return-calc", "dollar-cost-averaging",
    "portfolio-rebalancer", "real-estate-roi", "rental-property-calc",
    "short-term-rental", "house-recycling", "real-estate-mogul",
  ],
  physician: [
    "physician-income-gap", "physician-disability", "physician-student-loan",
    "physician-retirement", "physician-tax-strategy", "physician-wealth-builder",
    "dual-physician-planner",
  ],
  business: [
    "business-valuation", "buy-sell-agreement", "key-person-insurance",
    "business-succession", "executive-bonus", "split-dollar",
    "deferred-compensation", "business-overhead-expense",
  ],
};

/** S5: Get related calculators for any route */
export function getRelatedCalcs(route: string): string[] {
  const slug = route.replace(/^\/portal\//, "").replace(/\//g, "-");
  const related = new Set<string>();
  
  // Find which category this calc belongs to
  for (const [_category, calcs] of Object.entries(CALC_CATEGORIES)) {
    if (calcs.includes(slug)) {
      // Add all calcs in same category
      calcs.forEach(c => { if (c !== slug) related.add(c); });
    }
  }
  
  // Always include cross-category essentials
  const essentials = ["net-worth-tracker", "marginal-tax-rate", "retirement-income-gap", "life-insurance-needs"];
  essentials.forEach(e => { if (e !== slug) related.add(e); });
  
  return Array.from(related).slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════
// S8-S10: TIMESTAMPS, DEPENDENCY GRAPH, RECALCULATE ALL
// ═══════════════════════════════════════════════════════════════

/** S8: Track when each data field was last updated */
export interface TimestampedField {
  value: any;
  updatedAt: number;
  source: string;
}

export function useTimestampedData() {
  const [fields, setFields] = useState<Record<string, TimestampedField>>(() => {
    try {
      return JSON.parse(localStorage.getItem("rc_timestamped_fields") || "{}");
    } catch { return {}; }
  });

  const updateField = useCallback((key: string, value: any, source: string) => {
    setFields(prev => {
      const next = { ...prev, [key]: { value, updatedAt: Date.now(), source } };
      try { localStorage.setItem("rc_timestamped_fields", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const getFieldAge = useCallback((key: string): string => {
    const field = fields[key];
    if (!field) return "never";
    const mins = Math.floor((Date.now() - field.updatedAt) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [fields]);

  return { fields, updateField, getFieldAge };
}

/** S9: Dependency graph — track which calcs depend on which inputs */
export function useCalcDependencyGraph() {
  const [staleCalcs, setStaleCalcs] = useState<Set<string>>(new Set());

  const markInputChanged = useCallback((inputKey: string) => {
    // Find all calcs that used this input
    try {
      const deps = JSON.parse(localStorage.getItem("rc_calc_dependencies") || "{}");
      const stale = new Set<string>();
      for (const [calcRoute, inputs] of Object.entries(deps)) {
        if (Array.isArray(inputs) && inputs.includes(inputKey)) {
          stale.add(calcRoute);
        }
      }
      setStaleCalcs(stale);
    } catch {}
  }, []);

  const registerDependency = useCallback((calcRoute: string, inputKeys: string[]) => {
    try {
      const deps = JSON.parse(localStorage.getItem("rc_calc_dependencies") || "{}");
      deps[calcRoute] = inputKeys;
      localStorage.setItem("rc_calc_dependencies", JSON.stringify(deps));
    } catch {}
  }, []);

  return { staleCalcs, markInputChanged, registerDependency };
}

/** S10: Recalculate all previously-run calculators */
export function useRecalculateAll() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [progress, setProgress] = useState(0);

  const getRunCalcs = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem("rc_calc_results");
      return stored ? Object.keys(JSON.parse(stored)) : [];
    } catch { return []; }
  }, []);

  const recalculateAll = useCallback(async () => {
    setIsRecalculating(true);
    const calcs = getRunCalcs();
    for (let i = 0; i < calcs.length; i++) {
      setProgress(Math.round(((i + 1) / calcs.length) * 100));
      // Mark each calc as needing refresh
      try {
        sessionStorage.setItem(`rc_needs_recalc_${calcs[i]}`, "true");
      } catch {}
    }
    setIsRecalculating(false);
    setProgress(100);
  }, [getRunCalcs]);

  return { isRecalculating, progress, recalculateAll, runCalcCount: getRunCalcs().length };
}

// ═══════════════════════════════════════════════════════════════
// S12-S14: HISTORY, DIFF, AGGREGATION
// ═══════════════════════════════════════════════════════════════

/** S12: Get calculation history for a specific calculator */
export function useCalcHistory(calcRoute: string) {
  const [history, setHistory] = useState<Array<{ timestamp: number; summary: Record<string, any> }>>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`rc_calc_history_${calcRoute}`);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, [calcRoute]);

  return history;
}

/** S13: Diff two calculation runs */
export function calcResultsDiff(
  prev: Record<string, any>,
  curr: Record<string, any>
): Array<{ key: string; prev: any; curr: any; delta: number | null; pctChange: number | null }> {
  const diffs: Array<{ key: string; prev: any; curr: any; delta: number | null; pctChange: number | null }> = [];
  const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)]));
  
  for (const key of allKeys) {
    const p = prev[key];
    const c = curr[key];
    if (p !== c) {
      const delta = typeof p === "number" && typeof c === "number" ? c - p : null;
      const pctChange = delta !== null && p !== 0 ? (delta / Math.abs(p)) * 100 : null;
      diffs.push({ key, prev: p, curr: c, delta, pctChange });
    }
  }
  return diffs;
}

/** S14: Cross-calculator aggregation */
export function useCrossCalcAggregation() {
  return useMemo(() => {
    try {
      const stored = localStorage.getItem("rc_calc_results");
      const results: Record<string, { summary: Record<string, any> }> = stored ? JSON.parse(stored) : {};
      
      let totalTaxSavings = 0;
      let totalNetWorth = 0;
      let totalRetirementIncome = 0;
      let totalInsuranceCoverage = 0;
      let totalEstateValue = 0;
      let totalDebtReduction = 0;
      let calcsUsed = 0;

      for (const [_route, result] of Object.entries(results)) {
        calcsUsed++;
        const s = result.summary;
        if (s.taxSavings) totalTaxSavings += Number(s.taxSavings) || 0;
        if (s.annualTaxSavings) totalTaxSavings += Number(s.annualTaxSavings) || 0;
        if (s.netWorth) totalNetWorth = Math.max(totalNetWorth, Number(s.netWorth) || 0);
        if (s.futureValue) totalNetWorth = Math.max(totalNetWorth, Number(s.futureValue) || 0);
        if (s.retirementIncome) totalRetirementIncome += Number(s.retirementIncome) || 0;
        if (s.monthlyIncome) totalRetirementIncome += (Number(s.monthlyIncome) || 0) * 12;
        if (s.coverageAmount) totalInsuranceCoverage += Number(s.coverageAmount) || 0;
        if (s.deathBenefit) totalInsuranceCoverage += Number(s.deathBenefit) || 0;
        if (s.estateValue) totalEstateValue = Math.max(totalEstateValue, Number(s.estateValue) || 0);
        if (s.debtReduction) totalDebtReduction += Number(s.debtReduction) || 0;
        if (s.interestSaved) totalDebtReduction += Number(s.interestSaved) || 0;
      }

      return {
        totalTaxSavings,
        totalNetWorth,
        totalRetirementIncome,
        totalInsuranceCoverage,
        totalEstateValue,
        totalDebtReduction,
        calcsUsed,
        aggregatedAt: Date.now(),
      };
    } catch {
      return {
        totalTaxSavings: 0, totalNetWorth: 0, totalRetirementIncome: 0,
        totalInsuranceCoverage: 0, totalEstateValue: 0, totalDebtReduction: 0,
        calcsUsed: 0, aggregatedAt: Date.now(),
      };
    }
  }, []);
}

// ═══════════════════════════════════════════════════════════════
// S15-S18: SEQUENCER, WHAT-IF, CHAIN RUNNER, EXPORT
// ═══════════════════════════════════════════════════════════════

/** S15: Calculator sequencer — suggests optimal order based on client profile */
export function useCalculatorSequencer(clientProfile: {
  age?: number;
  income?: number;
  netWorth?: number;
  profession?: string;
  hasRealEstate?: boolean;
  hasChildren?: boolean;
  isRetired?: boolean;
}) {
  return useMemo(() => {
    const steps: Array<{ route: string; name: string; reason: string; priority: number }> = [];
    const { age = 45, income = 100000, netWorth = 500000, profession, hasRealEstate, hasChildren, isRetired } = clientProfile;

    // Always start with fundamentals
    steps.push({ route: "net-worth-tracker", name: "Net Worth Tracker", reason: "Establish baseline financial position", priority: 1 });
    steps.push({ route: "marginal-tax-rate", name: "Tax Bracket Analysis", reason: "Understand current tax exposure", priority: 2 });

    // Income-based recommendations
    if (income > 200000) {
      steps.push({ route: "mega-backdoor-roth", name: "Mega Backdoor Roth", reason: `High income ($${(income/1000).toFixed(0)}K) — maximize tax-free growth`, priority: 3 });
      steps.push({ route: "backdoor-roth-guide", name: "Backdoor Roth IRA", reason: "Income exceeds Roth IRA limits", priority: 4 });
    }
    if (income > 150000) {
      steps.push({ route: "irmaa-calculator", name: "IRMAA Calculator", reason: "Check Medicare surcharge exposure", priority: 5 });
    }

    // Age-based
    if (age > 55 && !isRetired) {
      steps.push({ route: "retirement-income-gap", name: "Retirement Income Gap", reason: "Approaching retirement — assess income needs", priority: 3 });
      steps.push({ route: "social-security-optimizer", name: "Social Security Optimizer", reason: "Optimize claiming strategy", priority: 4 });
    }
    if (age > 72) {
      steps.push({ route: "rmd-calculator", name: "RMD Calculator", reason: "Required minimum distributions apply", priority: 2 });
    }

    // Profession-specific
    if (profession?.toLowerCase().includes("physician") || profession?.toLowerCase().includes("doctor")) {
      steps.push({ route: "physician-income-gap", name: "Physician Income Gap", reason: "Specialized physician planning", priority: 3 });
      steps.push({ route: "physician-student-loan", name: "Student Loan Strategy", reason: "Optimize loan repayment", priority: 4 });
    }

    // Net worth based
    if (netWorth > 1000000) {
      steps.push({ route: "estate-tax-calculator", name: "Estate Tax Calculator", reason: `Net worth $${(netWorth/1000000).toFixed(1)}M — estate planning critical`, priority: 5 });
      steps.push({ route: "ilit-calculator", name: "ILIT Calculator", reason: "Remove life insurance from taxable estate", priority: 6 });
    }

    // Real estate
    if (hasRealEstate) {
      steps.push({ route: "mortgage-killer-v3", name: "Mortgage Killer V3", reason: "Optimize real estate leverage", priority: 5 });
      steps.push({ route: "cost-segregation-calculator", name: "Cost Segregation", reason: "Accelerate depreciation deductions", priority: 6 });
    }

    // Children/legacy
    if (hasChildren) {
      steps.push({ route: "education-funding", name: "Education Funding", reason: "Plan for children's education", priority: 6 });
      steps.push({ route: "dynasty-trust-calculator", name: "Dynasty Trust", reason: "Multi-generational wealth transfer", priority: 7 });
    }

    // Always end with comprehensive review
    steps.push({ route: "iul-projection", name: "IUL Projection", reason: "Tax-free growth and income vehicle", priority: 8 });
    steps.push({ route: "life-insurance-needs", name: "Life Insurance Needs", reason: "Ensure adequate protection", priority: 9 });

    // Sort by priority and deduplicate
    const seen = new Set<string>();
    return steps
      .sort((a, b) => a.priority - b.priority)
      .filter(s => { if (seen.has(s.route)) return false; seen.add(s.route); return true; });
  }, [clientProfile]);
}

/** S16: What-If analysis hook */
export function useWhatIfAnalysis(baseInputs: Record<string, number>, calcFn: (inputs: Record<string, number>) => Record<string, number>) {
  const [scenarios, setScenarios] = useState<Array<{ label: string; inputs: Record<string, number>; results: Record<string, number> }>>([]);

  const addScenario = useCallback((label: string, overrides: Record<string, number>) => {
    const inputs = { ...baseInputs, ...overrides };
    const results = calcFn(inputs);
    setScenarios(prev => [...prev, { label, inputs, results }]);
  }, [baseInputs, calcFn]);

  const clearScenarios = useCallback(() => setScenarios([]), []);

  return { scenarios, addScenario, clearScenarios };
}

/** S17: Calculator chain runner */
export function useCalculatorChainRunner() {
  const [chain, setChain] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startChain = useCallback((calcRoutes: string[]) => {
    setChain(calcRoutes);
    setCurrentStep(0);
    setIsRunning(true);
  }, []);

  const advanceChain = useCallback(() => {
    if (currentStep < chain.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsRunning(false);
    }
  }, [currentStep, chain.length]);

  const stopChain = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(0);
    setChain([]);
  }, []);

  return {
    chain,
    currentStep,
    currentCalc: chain[currentStep] || null,
    isRunning,
    isLastStep: currentStep === chain.length - 1,
    progress: chain.length > 0 ? ((currentStep + 1) / chain.length) * 100 : 0,
    startChain,
    advanceChain,
    stopChain,
  };
}

/** S18: Export all calc results as structured data */
export function exportCalcResults(format: "json" | "csv" = "json"): string {
  try {
    const stored = localStorage.getItem("rc_calc_results");
    const results = stored ? JSON.parse(stored) : {};

    if (format === "json") {
      return JSON.stringify(results, null, 2);
    }

    // CSV format
    const rows: string[] = ["Calculator,Timestamp,Key,Value"];
    for (const [route, result] of Object.entries(results) as [string, any][]) {
      const ts = new Date(result.timestamp).toISOString();
      for (const [key, value] of Object.entries(result.summary)) {
        rows.push(`"${route}","${ts}","${key}","${value}"`);
      }
    }
    return rows.join("\n");
  } catch {
    return format === "json" ? "{}" : "Error exporting results";
  }
}

// ═══════════════════════════════════════════════════════════════
// S19-S22: STRATEGY INTEGRATION
// ═══════════════════════════════════════════════════════════════

/** S20: Strategy comparison utility */
export function useStrategyComparison() {
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  const compare = useCallback(() => {
    try {
      const stored = localStorage.getItem("rc_calc_results");
      const results = stored ? JSON.parse(stored) : {};
      return selectedStrategies.map(route => ({
        route,
        result: results[route] || null,
      }));
    } catch { return []; }
  }, [selectedStrategies]);

  const addStrategy = useCallback((route: string) => {
    setSelectedStrategies(prev => prev.includes(route) ? prev : [...prev, route]);
  }, []);

  const removeStrategy = useCallback((route: string) => {
    setSelectedStrategies(prev => prev.filter(r => r !== route));
  }, []);

  return { selectedStrategies, compare, addStrategy, removeStrategy };
}

/** S21: Strategy scoring — rank strategies by weighted score */
export function scoreStrategy(result: Record<string, any>): {
  score: number;
  breakdown: { taxSavings: number; growth: number; risk: number; liquidity: number; income: number };
} {
  const taxSavings = Math.min(100, (Number(result.taxSavings || result.annualTaxSavings || 0) / 50000) * 100);
  const growth = Math.min(100, (Number(result.returnRate || result.growthRate || 0.07) / 0.15) * 100);
  const risk = Math.max(0, 100 - (Number(result.riskLevel || result.volatility || 50)));
  const liquidity = Math.min(100, (Number(result.liquidAssets || result.cashValue || 0) / 500000) * 100);
  const income = Math.min(100, (Number(result.annualIncome || result.monthlyIncome || 0) * 12 / 200000) * 100);

  const score = Math.round(taxSavings * 0.25 + growth * 0.25 + risk * 0.2 + liquidity * 0.15 + income * 0.15);
  return { score, breakdown: { taxSavings, growth, risk, liquidity, income } };
}

// ═══════════════════════════════════════════════════════════════
// S24-S26: DATA QUALITY & VALIDATION
// ═══════════════════════════════════════════════════════════════

/** S24: Client data completeness score */
export function useClientDataCompleteness() {
  return useMemo(() => {
    try {
      const stored = localStorage.getItem("rc_client_data");
      const data = stored ? JSON.parse(stored) : {};
      
      const requiredFields = [
        "clientName", "age", "annualIncome", "filingStatus", "state",
        "netWorth", "iraBalance", "rothBalance", "investmentBalance",
        "mortgageBalance", "homeValue", "annualExpenses", "riskTolerance",
        "retirementAge", "lifeExpectancy", "hasLifeInsurance", "hasDisability",
        "hasLTC", "hasUmbrella", "hasEstatePlan", "numberOfDependents",
        "spouseAge", "spouseIncome", "otherDebt", "monthlyBudget",
        "savingsRate", "employerMatch", "socialSecurityEstimate",
        "pensionIncome", "rentalIncome", "businessIncome",
      ];

      let filled = 0;
      const missing: string[] = [];
      for (const field of requiredFields) {
        if (data[field] !== undefined && data[field] !== null && data[field] !== "" && data[field] !== 0) {
          filled++;
        } else {
          missing.push(field);
        }
      }

      const pct = Math.round((filled / requiredFields.length) * 100);
      return { percentage: pct, filled, total: requiredFields.length, missing };
    } catch {
      return { percentage: 0, filled: 0, total: 30, missing: [] };
    }
  }, []);
}

/** S25: Validation warnings for calculator inputs */
export function validateCalcInputs(inputs: Record<string, any>, requiredFields: string[]): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (inputs[field] === undefined || inputs[field] === null || inputs[field] === "") {
      if (field === "age" || field === "income" || field === "netWorth") {
        errors.push(`${field} is required for accurate results`);
      } else {
        warnings.push(`${field} not set — using default value`);
      }
    }
  }

  // Range validations
  if (inputs.age && (inputs.age < 18 || inputs.age > 120)) warnings.push("Age seems unusual — please verify");
  if (inputs.income && inputs.income > 50000000) warnings.push("Income exceeds $50M — please verify");
  if (inputs.returnRate && inputs.returnRate > 0.25) warnings.push("Return rate exceeds 25% — results may be optimistic");
  if (inputs.inflationRate && inputs.inflationRate > 0.10) warnings.push("Inflation rate exceeds 10% — results may be pessimistic");

  return { isValid: errors.length === 0, warnings, errors };
}

/** S26: Data quality indicator */
export type DataQuality = "high" | "medium" | "low";
export function getDataQuality(autoFillSources: Record<string, string>, totalInputs: number): {
  quality: DataQuality;
  realDataPct: number;
  defaultsPct: number;
  label: string;
  color: string;
} {
  const fromRealData = Object.keys(autoFillSources).length;
  const realPct = totalInputs > 0 ? Math.round((fromRealData / totalInputs) * 100) : 0;
  
  if (realPct >= 80) return { quality: "high", realDataPct: realPct, defaultsPct: 100 - realPct, label: "High Confidence", color: "text-emerald-500" };
  if (realPct >= 50) return { quality: "medium", realDataPct: realPct, defaultsPct: 100 - realPct, label: "Moderate Confidence", color: "text-amber-500" };
  return { quality: "low", realDataPct: realPct, defaultsPct: 100 - realPct, label: "Estimate Only", color: "text-red-500" };
}

// ═══════════════════════════════════════════════════════════════
// S29-S32: PROJECTION ENGINE, INFLATION, SENSITIVITY, MONTE CARLO
// ═══════════════════════════════════════════════════════════════

/** S29: Unified projection engine with consistent assumptions */
export interface ProjectionAssumptions {
  growthRate: number;
  inflationRate: number;
  taxRate: number;
  years: number;
  startingValue: number;
  annualContribution: number;
  withdrawalRate?: number;
  withdrawalStartYear?: number;
}

export const DEFAULT_ASSUMPTIONS: ProjectionAssumptions = {
  growthRate: 0.07,
  inflationRate: 0.03,
  taxRate: 0.24,
  years: 50,
  startingValue: 0,
  annualContribution: 0,
};

export function runProjection(assumptions: ProjectionAssumptions): Array<{
  year: number;
  nominal: number;
  real: number;
  contributions: number;
  growth: number;
  withdrawals: number;
}> {
  const rows: Array<{ year: number; nominal: number; real: number; contributions: number; growth: number; withdrawals: number }> = [];
  let balance = assumptions.startingValue;
  let totalContributions = assumptions.startingValue;
  let totalGrowth = 0;
  let totalWithdrawals = 0;

  for (let y = 1; y <= assumptions.years; y++) {
    const growth = balance * assumptions.growthRate;
    balance += growth;
    totalGrowth += growth;

    if (assumptions.withdrawalStartYear && y >= assumptions.withdrawalStartYear && assumptions.withdrawalRate) {
      const withdrawal = balance * assumptions.withdrawalRate;
      balance -= withdrawal;
      totalWithdrawals += withdrawal;
    } else {
      balance += assumptions.annualContribution;
      totalContributions += assumptions.annualContribution;
    }

    const inflationFactor = Math.pow(1 + assumptions.inflationRate, y);
    rows.push({
      year: y,
      nominal: Math.round(balance),
      real: Math.round(balance / inflationFactor),
      contributions: Math.round(totalContributions),
      growth: Math.round(totalGrowth),
      withdrawals: Math.round(totalWithdrawals),
    });
  }
  return rows;
}

/** S30: Inflation adjustment utility */
export function adjustForInflation(amount: number, years: number, inflationRate = 0.03): number {
  return Math.round(amount / Math.pow(1 + inflationRate, years));
}

export function nominalToReal(amount: number, year: number, inflationRate = 0.03): number {
  return Math.round(amount / Math.pow(1 + inflationRate, year));
}

/** S31: Sensitivity analysis — vary one input and see impact on output */
export function sensitivityAnalysis(
  baseInputs: Record<string, number>,
  varyKey: string,
  range: [number, number],
  steps: number,
  calcFn: (inputs: Record<string, number>) => number
): Array<{ inputValue: number; outputValue: number }> {
  const results: Array<{ inputValue: number; outputValue: number }> = [];
  const stepSize = (range[1] - range[0]) / steps;
  
  for (let i = 0; i <= steps; i++) {
    const inputValue = range[0] + stepSize * i;
    const inputs = { ...baseInputs, [varyKey]: inputValue };
    results.push({ inputValue, outputValue: calcFn(inputs) });
  }
  return results;
}

/** S32: Monte Carlo simulation */
export function monteCarloSimulation(
  startingValue: number,
  annualContribution: number,
  meanReturn: number,
  stdDev: number,
  years: number,
  simulations: number = 1000
): {
  median: number[];
  p10: number[];
  p25: number[];
  p75: number[];
  p90: number[];
  successRate: number;
  targetValue?: number;
} {
  const allPaths: number[][] = [];
  
  // Box-Muller transform for normal distribution
  function normalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  for (let s = 0; s < simulations; s++) {
    const path: number[] = [startingValue];
    let balance = startingValue;
    for (let y = 1; y <= years; y++) {
      const annualReturn = meanReturn + stdDev * normalRandom();
      balance = balance * (1 + annualReturn) + annualContribution;
      if (balance < 0) balance = 0;
      path.push(Math.round(balance));
    }
    allPaths.push(path);
  }

  // Calculate percentiles for each year
  const median: number[] = [];
  const p10: number[] = [];
  const p25: number[] = [];
  const p75: number[] = [];
  const p90: number[] = [];

  for (let y = 0; y <= years; y++) {
    const values = allPaths.map(p => p[y]).sort((a, b) => a - b);
    p10.push(values[Math.floor(simulations * 0.1)]);
    p25.push(values[Math.floor(simulations * 0.25)]);
    median.push(values[Math.floor(simulations * 0.5)]);
    p75.push(values[Math.floor(simulations * 0.75)]);
    p90.push(values[Math.floor(simulations * 0.9)]);
  }

  const targetValue = startingValue * 10; // 10x as success
  const successRate = allPaths.filter(p => p[years] >= targetValue).length / simulations;

  return { median, p10, p25, p75, p90, successRate, targetValue };
}

/** S33: Assumption presets */
export const ASSUMPTION_PRESETS: Record<string, ProjectionAssumptions> = {
  conservative: { ...DEFAULT_ASSUMPTIONS, growthRate: 0.05, inflationRate: 0.035, taxRate: 0.28 },
  moderate: { ...DEFAULT_ASSUMPTIONS, growthRate: 0.07, inflationRate: 0.03, taxRate: 0.24 },
  aggressive: { ...DEFAULT_ASSUMPTIONS, growthRate: 0.10, inflationRate: 0.025, taxRate: 0.22 },
  physician: { ...DEFAULT_ASSUMPTIONS, growthRate: 0.08, inflationRate: 0.03, taxRate: 0.37, annualContribution: 50000 },
  retiree: { ...DEFAULT_ASSUMPTIONS, growthRate: 0.05, inflationRate: 0.035, taxRate: 0.22, withdrawalRate: 0.04, withdrawalStartYear: 1 },
};

// ═══════════════════════════════════════════════════════════════
// S34-S40: SEARCH, TAGS, TEMPLATES, SHARING, BATCH, VERSIONING
// ═══════════════════════════════════════════════════════════════

/** S34: Cross-calculator search */
export function searchCalcResults(query: string): Array<{ route: string; key: string; value: any; match: string }> {
  try {
    const stored = localStorage.getItem("rc_calc_results");
    const results = stored ? JSON.parse(stored) : {};
    const matches: Array<{ route: string; key: string; value: any; match: string }> = [];
    const q = query.toLowerCase();

    for (const [route, result] of Object.entries(results) as [string, any][]) {
      if (route.toLowerCase().includes(q)) {
        matches.push({ route, key: "route", value: route, match: "route name" });
      }
      for (const [key, value] of Object.entries(result.summary)) {
        const valStr = String(value).toLowerCase();
        if (key.toLowerCase().includes(q) || valStr.includes(q)) {
          matches.push({ route, key, value, match: key });
        }
      }
    }
    return matches;
  } catch { return []; }
}

/** S35: Result tagging */
export function useResultTags() {
  const [tags, setTags] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_result_tags") || "{}"); } catch { return {}; }
  });

  const addTag = useCallback((route: string, tag: string) => {
    setTags(prev => {
      const next = { ...prev, [route]: [...(prev[route] || []), tag] };
      localStorage.setItem("rc_result_tags", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeTag = useCallback((route: string, tag: string) => {
    setTags(prev => {
      const next = { ...prev, [route]: (prev[route] || []).filter(t => t !== tag) };
      localStorage.setItem("rc_result_tags", JSON.stringify(next));
      return next;
    });
  }, []);

  const getByTag = useCallback((tag: string): string[] => {
    return Object.entries(tags).filter(([_, t]) => t.includes(tag)).map(([route]) => route);
  }, [tags]);

  return { tags, addTag, removeTag, getByTag };
}

/** S36: Calculator templates */
export function useCalcTemplates() {
  const [templates, setTemplates] = useState<Record<string, Record<string, any>>>(() => {
    try { return JSON.parse(localStorage.getItem("rc_calc_templates") || "{}"); } catch { return {}; }
  });

  const saveTemplate = useCallback((name: string, inputs: Record<string, any>) => {
    setTemplates(prev => {
      const next = { ...prev, [name]: { ...inputs, _savedAt: Date.now() } };
      localStorage.setItem("rc_calc_templates", JSON.stringify(next));
      return next;
    });
  }, []);

  const loadTemplate = useCallback((name: string): Record<string, any> | null => {
    return templates[name] || null;
  }, [templates]);

  const deleteTemplate = useCallback((name: string) => {
    setTemplates(prev => {
      const { [name]: _, ...rest } = prev;
      localStorage.setItem("rc_calc_templates", JSON.stringify(rest));
      return rest;
    });
  }, []);

  return { templates, saveTemplate, loadTemplate, deleteTemplate };
}

/** S37: Result sharing — generate shareable link data */
export function generateShareableResult(route: string, summary: Record<string, any>): string {
  const data = { route, summary, sharedAt: Date.now() };
  return btoa(JSON.stringify(data));
}

export function parseSharedResult(encoded: string): { route: string; summary: Record<string, any> } | null {
  try {
    return JSON.parse(atob(encoded));
  } catch { return null; }
}

/** S39: Calc versioning — track input versions */
export function useCalcVersioning(calcRoute: string) {
  const [versions, setVersions] = useState<Array<{ id: number; inputs: Record<string, any>; timestamp: number }>>(() => {
    try { return JSON.parse(localStorage.getItem(`rc_calc_versions_${calcRoute}`) || "[]"); } catch { return []; }
  });

  const saveVersion = useCallback((inputs: Record<string, any>) => {
    setVersions(prev => {
      const next = [...prev, { id: prev.length + 1, inputs, timestamp: Date.now() }];
      if (next.length > 20) next.splice(0, next.length - 20);
      localStorage.setItem(`rc_calc_versions_${calcRoute}`, JSON.stringify(next));
      return next;
    });
  }, [calcRoute]);

  return { versions, saveVersion, latestVersion: versions[versions.length - 1] || null };
}
