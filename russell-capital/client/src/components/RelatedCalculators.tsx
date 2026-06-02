import { useState, useMemo, lazy, Suspense } from "react";
import { Link } from "wouter";

// ============================================================
// CALCULATOR INTERRELATION MAP
// Groups calculators into clusters based on financial strategy relationships.
// Each calculator belongs to 1-3 clusters. When toggled on, the related
// calculator's core content renders inline without duplicating shared data
// (Fact Finder, disclosures, client context).
// ============================================================

export interface CalculatorCluster {
  id: string;
  name: string;
  color: string;       // Tailwind bg color class
  textColor: string;   // Tailwind text color class
  borderColor: string; // Tailwind border color class
  icon: string;        // Emoji icon
  description: string;
  members: string[];   // Page names (PascalCase)
}

export const CALCULATOR_CLUSTERS: CalculatorCluster[] = [
  // ── INCOME & RETIREMENT ──
  {
    id: "income-retirement",
    name: "Income & Retirement",
    color: "bg-emerald-50",
    textColor: "text-emerald-800",
    borderColor: "border-emerald-300",
    icon: "\u{1F4B0}",
    description: "Lifetime income planning, retirement projections, and income gap analysis",
    members: [
      "LifetimeGuaranteedIncome", "IncomeAnnuityTop10", "IncomeGapAnalyzer",
      "IncomeTimeline", "RetirementIncomeProjection", "RetirementGuardrails",
      "SocialSecurityOptimizer", "WithdrawalSequencing", "AdvisorIncomeCalculator",
      "HotIncome"
    ]
  },
  // ── TAX OPTIMIZATION ──
  {
    id: "tax-optimization",
    name: "Tax Optimization",
    color: "bg-amber-50",
    textColor: "text-amber-800",
    borderColor: "border-amber-300",
    icon: "\u{1F4CA}",
    description: "Tax bracket modeling, Roth conversions, tax-loss harvesting, and IRMAA impact",
    members: [
      "TaxBracketVisualizer", "TaxAdvantagedGrowth", "TaxLossHarvestingScanner",
      "TaxOpportunityDetector", "TaxWaterfall", "TaxReturnUpload",
      "RothConversionSTR", "MedicareIRMAA", "InflationAnalysis"
    ]
  },
  // ── ANNUITY PRODUCTS ──
  {
    id: "annuity-products",
    name: "Annuity Products",
    color: "bg-blue-50",
    textColor: "text-blue-800",
    borderColor: "border-blue-300",
    icon: "\u{1F3E6}",
    description: "MYGA, FIA, accumulation, and guaranteed income annuity comparisons",
    members: [
      "MYGAFixedRate", "AnnuityAccumulationDB", "AtheneGuaranteedIncome",
      "AthenePEPlus15", "AxonicSP500", "ExistingAnnuities", "FIATop10",
      "GrowthAnnuities", "IncomeAnnuityTop10", "LifetimeGuaranteedIncome",
      "CarrierComparison", "CarrierRatings"
    ]
  },
  // ── IUL & LIFE INSURANCE ──
  {
    id: "iul-life",
    name: "IUL & Life Insurance",
    color: "bg-purple-50",
    textColor: "text-purple-800",
    borderColor: "border-purple-300",
    icon: "\u{1F6E1}\uFE0F",
    description: "IUL performance, Ibbotson-based modeling, policy loans, and premium financing",
    members: [
      "IULvsRoth", "IULHistoricalPerformance", "IbbotsonCharts",
      "MortgageKiller", "PolicyLoans", "PolicyReview", "PremiumFinancing",
      "TimeMachineAG49", "TimeMachineCalculator", "TimeMachineMethod",
      "IndexBacktester", "IndexStrategyComparison"
    ]
  },
  // ── REAL ESTATE & HELOC ──
  {
    id: "real-estate-heloc",
    name: "Real Estate & HELOC",
    color: "bg-orange-50",
    textColor: "text-orange-800",
    borderColor: "border-orange-300",
    icon: "\u{1F3E0}",
    description: "Mortgage elimination, HELOC recycling, real estate wealth building",
    members: [
      "MortgageKiller", "ReverseHeloc", "HouseRecyclingStrategy",
      "RealEstateMogul", "MYGAFixedRate", "HouseholdWealth"
    ]
  },
  // ── ESTATE & LEGACY ──
  {
    id: "estate-legacy",
    name: "Estate & Legacy",
    color: "bg-rose-50",
    textColor: "text-rose-800",
    borderColor: "border-rose-300",
    icon: "\u{1F3DB}\uFE0F",
    description: "Estate tax planning, beneficiary optimization, multi-generational wealth transfer",
    members: [
      "EstateTax", "EstateFlowChart", "BeneficiaryOptimization",
      "MultiGenWealthTransfer", "SuccessionPlanningWizard",
      "CharitableGivingOptimizer"
    ]
  },
  // ── STRATEGY & COMPARISON ──
  {
    id: "strategy-comparison",
    name: "Strategy & Comparison",
    color: "bg-cyan-50",
    textColor: "text-cyan-800",
    borderColor: "border-cyan-300",
    icon: "\u{2696}\uFE0F",
    description: "Side-by-side strategy analysis, scenario modeling, and competitive benchmarking",
    members: [
      "StrategyCompare", "StrategyLab", "ScenarioSideBySide",
      "ScenarioAdjustments", "MultiScenarioPlayZone", "CompetitiveAnalysis",
      "IllustrationCompare", "MarketScenarioStressTest", "SavedScenariosHub"
    ]
  },
  // ── AI & AUTOMATION ──
  {
    id: "ai-automation",
    name: "AI & Automation",
    color: "bg-violet-50",
    textColor: "text-violet-800",
    borderColor: "border-violet-300",
    icon: "\u{1F916}",
    description: "AI-powered recommendations, strategy analysis, and predictive modeling",
    members: [
      "AiStrategyRecommender", "AIPolicyReviewGap", "PredictiveAnalytics",
      "ClientSnapshotMap", "GoalsBasedPlanning", "Recommendations",
      "BulkGeneration"
    ]
  },
  // ── PORTFOLIO & RISK ──
  {
    id: "portfolio-risk",
    name: "Portfolio & Risk",
    color: "bg-slate-50",
    textColor: "text-slate-800",
    borderColor: "border-slate-300",
    icon: "\u{1F4C8}",
    description: "Portfolio drift monitoring, rebalancing, risk scoring, and market data",
    members: [
      "PortfolioDriftMonitor", "SmartRebalancingAlerts", "FinancialVitalsScorecard",
      "CryptoCurrencyCorner", "BusinessOwnerPlanning", "HouseholdWealth"
    ]
  },
  // ── BUSINESS & OWNER ──
  {
    id: "business-owner",
    name: "Business & Owner",
    color: "bg-teal-50",
    textColor: "text-teal-800",
    borderColor: "border-teal-300",
    icon: "\u{1F4BC}",
    description: "Business owner planning, succession, key person insurance, and buy-sell agreements",
    members: [
      "BusinessOwnerPlanning", "SuccessionPlanningWizard", "PremiumFinancing",
      "SalesStoryBuilder", "CommissionCalculator"
    ]
  }
];

// ============================================================
// Helper: Get clusters for a given page
// ============================================================
export function getClustersForPage(pageName: string): CalculatorCluster[] {
  return CALCULATOR_CLUSTERS.filter(c => c.members.includes(pageName));
}

// ============================================================
// Helper: Get related pages (excluding self) for a given page
// ============================================================
export function getRelatedPages(pageName: string): { page: string; clusters: string[] }[] {
  const myClusters = getClustersForPage(pageName);
  const relatedMap = new Map<string, Set<string>>();

  for (const cluster of myClusters) {
    for (const member of cluster.members) {
      if (member === pageName) continue;
      if (!relatedMap.has(member)) relatedMap.set(member, new Set());
      relatedMap.get(member)!.add(cluster.name);
    }
  }

  return Array.from(relatedMap.entries())
    .map(([page, clusters]) => ({ page, clusters: Array.from(clusters) }))
    .sort((a, b) => b.clusters.length - a.clusters.length); // Most shared clusters first
}

// ============================================================
// Human-readable page names
// ============================================================
const PAGE_DISPLAY_NAMES: Record<string, string> = {
  AIPolicyReviewGap: "AI Policy Review Gap",
  AdvisorIncomeCalculator: "Advisor Income Calculator",
  AiStrategyRecommender: "AI Strategy Recommender",
  AnnuityAccumulationDB: "Annuity Accumulation Database",
  AtheneGuaranteedIncome: "Athene Guaranteed Income",
  AthenePEPlus15: "Athene PE Plus 15",
  AxonicSP500: "Axonic S&P 500",
  BeneficiaryOptimization: "Beneficiary Optimization",
  BulkGeneration: "Bulk Generation",
  BusinessOwnerPlanning: "Business Owner Planning",
  CarrierComparison: "Carrier Comparison",
  CarrierRatings: "Carrier Ratings",
  CharitableGivingOptimizer: "Charitable Giving Optimizer",
  ClientSnapshotMap: "Client Snapshot Map",
  CommissionCalculator: "Commission Calculator",
  CompetitiveAnalysis: "Competitive Analysis",
  CryptoCurrencyCorner: "Cryptocurrency Corner",
  EstateFlowChart: "Estate Flow Chart",
  EstateTax: "Estate Tax Calculator",
  ExistingAnnuities: "Existing Annuities",
  FIATop10: "FIA Top 10",
  FinancialVitalsScorecard: "Financial Vitals Scorecard",
  GoalsBasedPlanning: "Goals-Based Planning",
  GrowthAnnuities: "Growth Annuities",
  HotIncome: "Hot Income",
  HouseRecyclingStrategy: "House Recycling Strategy",
  HouseholdWealth: "Household Wealth",
  IULHistoricalPerformance: "IUL Historical Performance",
  IULvsRoth: "IUL vs Roth",
  IbbotsonCharts: "Ibbotson Charts",
  IllustrationCompare: "Illustration Compare",
  IncomeAnnuityTop10: "Income Annuity Top 10",
  IncomeGapAnalyzer: "Income Gap Analyzer",
  IncomeTimeline: "Income Timeline",
  IndexBacktester: "Index Backtester",
  IndexStrategyComparison: "Index Strategy Comparison",
  InflationAnalysis: "Inflation Analysis",
  LifetimeGuaranteedIncome: "Lifetime Guaranteed Income",
  MYGAFixedRate: "MYGA Fixed Rate",
  MarketScenarioStressTest: "Market Scenario Stress Test",
  MedicareIRMAA: "Medicare IRMAA",
  MortgageKiller: "Mortgage Killer",
  MultiGenWealthTransfer: "Multi-Gen Wealth Transfer",
  MultiScenarioPlayZone: "Multi-Scenario Play Zone",
  PolicyLoans: "Policy Loans",
  PolicyReview: "Policy Review",
  PortfolioDriftMonitor: "Portfolio Drift Monitor",
  PredictiveAnalytics: "Predictive Analytics",
  PremiumFinancing: "Premium Financing",
  QuickQuote: "Quick Quote",
  RealEstateMogul: "Real Estate Mogul",
  Recommendations: "Recommendations",
  RetirementGuardrails: "Retirement Guardrails",
  RetirementIncomeProjection: "Retirement Income Projection",
  ReverseHeloc: "Reverse HELOC",
  RothConversionSTR: "Roth Conversion STR",
  SalesStoryBuilder: "Sales Story Builder",
  SavedScenariosHub: "Saved Scenarios Hub",
  ScenarioAdjustments: "Scenario Adjustments",
  ScenarioSideBySide: "Scenario Side by Side",
  SmartRebalancingAlerts: "Smart Rebalancing Alerts",
  SocialSecurityOptimizer: "Social Security Optimizer",
  StrategyCompare: "Strategy Compare",
  StrategyLab: "Strategy Lab",
  SuccessionPlanningWizard: "Succession Planning Wizard",
  TaxAdvantagedGrowth: "Tax-Advantaged Growth",
  TaxBracketVisualizer: "Tax Bracket Visualizer",
  TaxLossHarvestingScanner: "Tax-Loss Harvesting Scanner",
  TaxOpportunityDetector: "Tax Opportunity Detector",
  TaxReturnUpload: "Tax Return Upload",
  TaxWaterfall: "Tax Waterfall",
  TimeMachineAG49: "Time Machine AG49",
  TimeMachineCalculator: "Time Machine Calculator",
  TimeMachineMethod: "Time Machine Method",
  WithdrawalSequencing: "Withdrawal Sequencing",
};

function getDisplayName(pageName: string): string {
  return PAGE_DISPLAY_NAMES[pageName] || pageName.replace(/([A-Z])/g, " $1").trim();
}

function getPageRoute(pageName: string): string {
  // Convert PascalCase to kebab-case for route
  return "/portal/" + pageName.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
}

// ============================================================
// MAIN COMPONENT: RelatedCalculators
// ============================================================
interface RelatedCalculatorsProps {
  currentPage: string; // PascalCase page name
}

export function RelatedCalculators({ currentPage }: RelatedCalculatorsProps) {
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [activeToggles, setActiveToggles] = useState<Set<string>>(new Set());

  const clusters = useMemo(() => getClustersForPage(currentPage), [currentPage]);
  const relatedPages = useMemo(() => getRelatedPages(currentPage), [currentPage]);

  if (clusters.length === 0) return null;

  const toggleCluster = (clusterId: string) => {
    setExpandedClusters(prev => {
      const next = new Set(prev);
      if (next.has(clusterId)) next.delete(clusterId);
      else next.add(clusterId);
      return next;
    });
  };

  const toggleCalculator = (pageName: string) => {
    setActiveToggles(prev => {
      const next = new Set(prev);
      if (next.has(pageName)) next.delete(pageName);
      else next.add(pageName);
      return next;
    });
  };

  return (
    <div className="mt-8 mb-6">
      {/* Section Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
            <path d="M2 12h20"/>
          </svg>
          Related Calculators
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Toggle related calculators to view their core insights alongside this page. Shared data (Fact Finder, disclosures) syncs automatically — no duplicate entry needed.
        </p>
      </div>

      {/* Cluster Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {clusters.map(cluster => (
          <div
            key={cluster.id}
            className={`rounded-lg border-2 ${cluster.borderColor} ${cluster.color} p-3 cursor-pointer transition-all hover:shadow-md`}
            onClick={() => toggleCluster(cluster.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cluster.icon}</span>
                <span className={`font-semibold text-sm ${cluster.textColor}`}>{cluster.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {cluster.members.filter(m => m !== currentPage).length} related
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${expandedClusters.has(cluster.id) ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
            <p className={`text-xs mt-1 ${cluster.textColor} opacity-75`}>{cluster.description}</p>

            {/* Expanded: Show toggle buttons for each related calculator */}
            {expandedClusters.has(cluster.id) && (
              <div className="mt-3 space-y-1.5" onClick={e => e.stopPropagation()}>
                {cluster.members
                  .filter(m => m !== currentPage)
                  .map(member => (
                    <div key={member} className="flex items-center justify-between bg-white/70 rounded-md px-2.5 py-1.5">
                      <Link href={getPageRoute(member)} className="text-xs font-medium hover:underline truncate flex-1 mr-2">
                        {getDisplayName(member)}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCalculator(member);
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                          activeToggles.has(member) ? "bg-blue-600" : "bg-gray-300"
                        }`}
                        aria-label={`Toggle ${getDisplayName(member)}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                            activeToggles.has(member) ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active Toggles: Show linked calculator summaries */}
      {activeToggles.size > 0 && (
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Synced Calculator Views ({activeToggles.size} active)
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {Array.from(activeToggles).map(pageName => {
            const pageClusters = getClustersForPage(pageName);
            const primaryCluster = pageClusters[0];

            return (
              <div
                key={pageName}
                className={`rounded-lg border ${primaryCluster?.borderColor || "border-border"} ${primaryCluster?.color || "bg-muted/30"} p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{primaryCluster?.icon || "\u{1F4CB}"}</span>
                    <h4 className={`font-semibold text-sm ${primaryCluster?.textColor || "text-foreground"}`}>
                      {getDisplayName(pageName)}
                    </h4>
                    {pageClusters.map(c => (
                      <span key={c.id} className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.color} ${c.textColor} border ${c.borderColor}`}>
                        {c.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={getPageRoute(pageName)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Open Full Page →
                    </Link>
                    <button
                      onClick={() => toggleCalculator(pageName)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="bg-white/60 rounded-md p-3 text-sm text-muted-foreground">
                  <p className="italic">
                    Synced view of <strong>{getDisplayName(pageName)}</strong> — client data, Fact Finder inputs, and disclosures are shared with the current page.
                    Open the full page for interactive calculations and detailed analysis.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Fact Finder Synced</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Client Data Shared</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Disclosures Unified</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RelatedCalculators;
