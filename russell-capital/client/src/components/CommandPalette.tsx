import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, Command, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface NavItem {
  path: string;
  label: string;
  section: string;
}

const ALL_PAGES: NavItem[] = [
  { path: "/portal", label: "Dashboard Home", section: "Home" },
  { path: "/portal/financial-vitals", label: "Financial Vitals", section: "Home" },
  { path: "/portal/client-snapshot", label: "Snapshot Map", section: "Clients" },
  { path: "/portal/client-health", label: "Client Health Alerts", section: "Home" },
  { path: "/portal/clients", label: "Client Directory", section: "Clients" },
  { path: "/portal/client-files", label: "Client Files", section: "Clients" },
  { path: "/portal/client-self-service", label: "Self-Service Portal", section: "Clients" },
  { path: "/portal/client-portal-config", label: "Portal Settings", section: "Clients" },
  { path: "/portal/client-onboarding", label: "Client Onboarding", section: "Clients" },
  { path: "/portal/client-onboarding-auto", label: "Onboarding Automation", section: "Clients" },
  { path: "/portal/client-intake", label: "Smart Client Intake", section: "Clients" },
  { path: "/portal/meetings", label: "Meetings", section: "Clients" },
  { path: "/portal/meeting-agenda", label: "Meeting Agenda", section: "Clients" },
  { path: "/portal/ai-meeting-notes", label: "Smart Meeting Notes", section: "Clients" },
  { path: "/portal/ecological-drivers", label: "Retirement Drivers", section: "Retirement" },
  { path: "/portal/social-security", label: "Social Security", section: "Retirement" },
  { path: "/portal/income-gap", label: "Income Gap Analyzer", section: "Retirement" },
  { path: "/portal/goals-planning", label: "Goals-Based Planning", section: "Retirement" },
  { path: "/portal/retirement-guardrails", label: "Retirement Guardrails", section: "Retirement" },
  { path: "/portal/withdrawal-sequencing", label: "Withdrawal Sequencing", section: "Retirement" },
  { path: "/portal/medicare-irmaa", label: "Medicare & IRMAA", section: "Retirement" },
  { path: "/portal/retirement-projection", label: "Income Projection", section: "Retirement" },
  { path: "/portal/lifetime-income", label: "Lifetime Income", section: "Retirement" },
  { path: "/portal/income-timeline", label: "Income Timeline", section: "Retirement" },
  { path: "/portal/advisor-income-calculator", label: "Income Calculator", section: "Retirement" },
  { path: "/portal/tax-waterfall", label: "Tax Waterfall", section: "Tax" },
  { path: "/portal/tax-brackets", label: "Tax Brackets", section: "Tax" },
  { path: "/portal/tax-advantaged-growth", label: "Tax-Advantaged Growth", section: "Tax" },
  { path: "/portal/tax-opportunities", label: "Tax Opportunities", section: "Tax" },
  { path: "/portal/tax-loss-harvesting", label: "Tax-Loss Harvesting", section: "Tax" },
  { path: "/portal/hot-income", label: "Hot Income (Oil & Gas)", section: "Tax" },
  { path: "/portal/tax-return-upload", label: "Tax Return OCR", section: "Tax" },
  { path: "/portal/estate-tax", label: "Estate Tax", section: "Wealth" },
  { path: "/portal/estate-flow", label: "Estate Flow Chart", section: "Wealth" },
  { path: "/portal/estate-document-gen", label: "Estate Doc Generator", section: "Wealth" },
  { path: "/portal/beneficiary-optimization", label: "Beneficiary Optimizer", section: "Wealth" },
  { path: "/portal/multi-gen-wealth", label: "Multi-Gen Wealth Transfer", section: "Wealth" },
  { path: "/portal/charitable-giving", label: "Charitable Giving", section: "Tax" },
  { path: "/portal/succession-planning", label: "Succession Planning", section: "Clients" },
  { path: "/portal/divorce-calculator", label: "Divorce Devastation Engine", section: "Wealth" },
  { path: "/portal/trusts", label: "Trust Structures (ILIT/SLAT/BLAT/PLAT/Dynasty)", section: "Wealth" },
  { path: "/portal/mortgage-killer-v3", label: "Mortgage Killer V3 — Infinite Property Acquisition", section: "Wealth" },
  { path: "/portal/str-strategy", label: "STR Tax Strategy — Cost Segregation & Bonus Depreciation", section: "Tax" },
  { path: "/portal/client-portfolio", label: "Client Portfolio Dashboard — Aggregate Strategy View", section: "Home" },
  { path: "/portal/strategy", label: "Strategy Lab", section: "Strategy" },
  { path: "/portal/roth-conversion", label: "Roth Strategies (6)", section: "Tax" },
  { path: "/portal/strategy-compare", label: "Strategy Compare", section: "Strategy" },
  { path: "/portal/scenarios", label: "Scenario Builder", section: "Strategy" },
  { path: "/portal/saved-scenarios", label: "Saved Scenarios", section: "Strategy" },
  { path: "/portal/scenario-play", label: "Multi-Scenario Play", section: "Strategy" },
  { path: "/portal/scenario-side-by-side", label: "Side-by-Side Compare", section: "Strategy" },
  { path: "/portal/iul-vs-roth", label: "IUL vs Roth", section: "Insurance" },
  { path: "/portal/risk-tolerance", label: "Risk Tolerance", section: "Strategy" },
  { path: "/portal/ai-recommender", label: "Strategy Recommender", section: "Strategy" },
  { path: "/portal/market-stress-test", label: "Market Stress Test", section: "Strategy" },
  { path: "/portal/smart-rebalancing", label: "Smart Rebalancing", section: "Wealth" },
  { path: "/portal/rebalance", label: "Rebalance", section: "Wealth" },
  { path: "/portal/portfolio-drift", label: "Portfolio Drift", section: "Wealth" },
  { path: "/portal/ibbotson-charts", label: "Ibbotson Charts", section: "Insurance" },
  { path: "/portal/iul-historical", label: "IUL Historical", section: "Insurance" },
  { path: "/portal/index-strategies", label: "Index Strategies", section: "Insurance" },
  { path: "/portal/policy-loans", label: "Policy Loans", section: "Insurance" },
  { path: "/portal/premium-financing", label: "Premium Financing", section: "Insurance" },
  { path: "/portal/index-backtester", label: "Index Backtester", section: "Insurance" },
  { path: "/portal/time-machine-calculator", label: "Time Machine", section: "Insurance" },
  { path: "/portal/time-machine-ag49", label: "AG 49 Compounding", section: "Insurance" },
  { path: "/portal/time-machine-method", label: "Dual Illustration", section: "Insurance" },
  { path: "/portal/quick-quote", label: "Quick Quote", section: "Insurance" },
  { path: "/portal/inflation", label: "Inflation Adjust", section: "Wealth" },
  { path: "/portal/fee-transparency", label: "Fee Transparency", section: "Wealth" },
  { path: "/portal/business-owner", label: "Business Owner", section: "Clients" },
  { path: "/portal/crypto-corner", label: "Crypto Corner", section: "Tax" },
  { path: "/portal/mortgage-killer", label: "Mortgage Killer", section: "Wealth" },
  { path: "/portal/house-recycling", label: "House Recycling", section: "Wealth" },
  { path: "/portal/household-wealth", label: "Household Wealth", section: "Wealth" },
  { path: "/portal/real-estate-mogul", label: "Real Estate Mogul", section: "Wealth" },
  { path: "/portal/growth-annuities", label: "Growth Annuities", section: "Insurance" },
  { path: "/portal/myga-fixed-rate", label: "Amazing MYGA Waterfall", section: "Insurance" },
  { path: "/portal/existing-annuities", label: "Existing Annuities", section: "Insurance" },
  { path: "/portal/income-annuity-top10", label: "Top 10 Income", section: "Insurance" },
  { path: "/portal/fia-top10", label: "Top 10 FIA", section: "Insurance" },
  { path: "/portal/annuity-accumulation-db", label: "Accumulation Database", section: "Insurance" },
  { path: "/portal/carrier-rates", label: "Carrier Rates", section: "Insurance" },
  { path: "/portal/carrier-comparison", label: "Carrier Compare", section: "Insurance" },
  { path: "/portal/illustration-compare", label: "Illustration Compare", section: "Insurance" },
  { path: "/portal/carrier-ratings", label: "Carrier Ratings", section: "Insurance" },
  { path: "/portal/quotes", label: "Carrier Quotes", section: "Insurance" },
  { path: "/portal/axonic-sp500", label: "S&P 500 Axonic", section: "Insurance" },
  { path: "/portal/athene-pe-plus15", label: "Athene PE Plus 15", section: "Insurance" },
  { path: "/portal/athene-guaranteed-income", label: "Athene Income", section: "Insurance" },
  { path: "/portal/policy-review-checklist", label: "Policy Review", section: "Insurance" },
  { path: "/portal/ai-policy-review", label: "Policy Gap Analysis", section: "Insurance" },
  { path: "/portal/ai-assist", label: "Strategy Assist", section: "Strategy" },
  { path: "/portal/advisor-chat", label: "Advisor Chat", section: "Strategy" },
  { path: "/portal/voice-plan", label: "Voice-to-Plan", section: "Strategy" },
  { path: "/portal/data-query", label: "Ask Your Data", section: "Strategy" },
  { path: "/portal/document-templates", label: "Document Templates", section: "Strategy" },
  { path: "/portal/report-builder", label: "Report Builder", section: "Clients" },
  { path: "/portal/collaborative-planning", label: "Collaborative Planning", section: "Strategy" },
  { path: "/portal/recommendations", label: "Score Boosters", section: "Strategy" },
  { path: "/portal/sales-story", label: "Sales Story Builder", section: "Strategy" },
  { path: "/portal/lead-generator", label: "Lead Generator", section: "Strategy" },
  { path: "/portal/referral-tracking", label: "Referral Tracking", section: "Strategy" },
  { path: "/portal/engagement-score", label: "Engagement Score", section: "Engage" },
  { path: "/portal/leaderboard", label: "Leaderboard", section: "Engage" },
  { path: "/portal/competitive", label: "Competitive Analysis", section: "Strategy" },
  { path: "/portal/seminar-generator", label: "Seminar Generator", section: "Strategy" },
  { path: "/portal/presentation-builder", label: "Presentation Builder", section: "Strategy" },
  { path: "/portal/email-campaigns", label: "Email Campaigns", section: "Strategy" },
  { path: "/portal/market-data", label: "Market Data", section: "Strategy" },
  { path: "/portal/predictive-analytics", label: "Predictive Analytics", section: "Strategy" },
  { path: "/portal/advisor-performance", label: "Advisor Metrics", section: "Admin" },
  { path: "/portal/client-comparison", label: "Client Compare", section: "Strategy" },
  { path: "/portal/stale-digest", label: "Stale Digest", section: "Strategy" },
  { path: "/portal/compliance", label: "Compliance Center", section: "Admin" },
  { path: "/portal/compliance-monitoring", label: "Compliance Monitor", section: "Admin" },
  { path: "/portal/compliance-audit", label: "Audit Center", section: "Admin" },
  { path: "/portal/compliance-alerts", label: "Alerts", section: "Admin" },
  { path: "/portal/compliance-reports", label: "Reports", section: "Admin" },
  { path: "/portal/compliance-audit-trail", label: "Audit Trail", section: "Admin" },
  { path: "/portal/disclaimers", label: "Disclaimers", section: "Admin" },
  { path: "/portal/communication-log", label: "Comm Log", section: "Admin" },
  { path: "/portal/website-usage", label: "Website Usage", section: "Admin" },
  { path: "/portal/legal-payment-folder", label: "Payment Folder", section: "Admin" },
  { path: "/portal/monitoring-agreement", label: "Monitoring", section: "Admin" },
  { path: "/portal/owner-oversight", label: "Owner Oversight", section: "Admin" },
  { path: "/portal/team", label: "Team Members", section: "Admin" },
  { path: "/portal/team-management", label: "Agency Teams", section: "Admin" },
  { path: "/portal/education", label: "Education Hub", section: "Admin" },
  { path: "/portal/advisor-training", label: "Advisor Training", section: "Admin" },
  { path: "/portal/agent-tutorial", label: "Agent Tutorial", section: "Admin" },
  { path: "/portal/agency-tutorial", label: "Agency Tutorial", section: "Admin" },
  { path: "/portal/billing", label: "Billing", section: "Admin" },
  { path: "/portal/enterprise", label: "Enterprise", section: "Admin" },
  { path: "/portal/knowledge", label: "Knowledge Base", section: "Admin" },
  { path: "/portal/branding", label: "Branding", section: "Admin" },
  { path: "/portal/webhooks", label: "Webhooks", section: "Admin" },
  { path: "/portal/slack", label: "Slack", section: "Admin" },
  { path: "/portal/hubspot", label: "HubSpot", section: "Admin" },
  { path: "/portal/affiliate-links", label: "Affiliate Links", section: "Admin" },
  { path: "/portal/workflow-automations", label: "Workflow Automations", section: "Admin" },
  { path: "/portal/bulk-generation", label: "Bulk Generation", section: "Admin" },
  { path: "/portal/hidden-material", label: "Archived", section: "Admin" },
  { path: "/portal/calculator-hub", label: "★ Calculator Hub — All 100+ Calculators", section: "Home" },
  { path: "/portal/physician-vitals", label: "★ Physician Financial Vitals Dashboard", section: "Home" },
  { path: "/portal/pslf-calculator", label: "PSLF (Public Service Loan Forgiveness) Calculator", section: "Clients" },
  { path: "/portal/idr-comparison", label: "IDR Plan Comparison (SAVE/PAYE/REPAYE/IBR)", section: "Clients" },
  { path: "/portal/own-occ-disability", label: "Own-Occupation Disability Insurance Calculator", section: "Clients" },
  { path: "/portal/physician-contract", label: "Physician Contract Negotiation Analyzer", section: "Clients" },
  { path: "/portal/residency-to-attending", label: "Residency-to-Attending Financial Pipeline", section: "Clients" },
  { path: "/portal/physician-forum", label: "Physician Lounge & Community Forum", section: "Clients" },
  { path: "/portal/onboarding-quiz", label: "Financial Physical Quiz — Personalized Calculator Playlist", section: "Home" },
  { path: "/portal/peer-benchmarking", label: "Physician Peer Benchmarking — Specialty Percentile Comparison", section: "Clients" },
  { path: "/portal/annual-financial-physical", label: "Annual Financial Physical — Yearly Health Report", section: "Home" },
  { path: "/portal/rmd-calculator", label: "RMD Calculator", section: "Tax" },
  { path: "/portal/marginal-tax-rate", label: "Marginal Tax Rate", section: "Tax" },
  { path: "/portal/capital-gains-tax", label: "Capital Gains Tax", section: "Tax" },
  { path: "/portal/amt-calculator", label: "AMT Calculator", section: "Tax" },
  { path: "/portal/self-employment-tax", label: "Self-Employment Tax", section: "Tax" },
  { path: "/portal/tax-equivalent-yield", label: "Tax-Equivalent Yield", section: "Tax" },
  { path: "/portal/w4-optimizer", label: "W-4 Optimizer", section: "Tax" },
  { path: "/portal/crypto-tax", label: "Crypto Tax", section: "Tax" },
  { path: "/portal/rsu-tax", label: "RSU Tax", section: "Tax" },
  { path: "/portal/deduction-optimizer", label: "Deduction Optimizer", section: "Tax" },
  { path: "/portal/fire-calculator", label: "FIRE Calculator", section: "Retirement" },
  { path: "/portal/safe-withdrawal-rate", label: "Safe Withdrawal Rate", section: "Retirement" },
  { path: "/portal/pension-vs-lump-sum", label: "Pension vs Lump Sum", section: "Retirement" },
  { path: "/portal/qlac-calculator", label: "QLAC Calculator", section: "Retirement" },
  { path: "/portal/retirement-healthcare", label: "Retirement Healthcare", section: "Retirement" },
  { path: "/portal/medicare-irmaa-calc", label: "Medicare IRMAA Calc", section: "Retirement" },
  { path: "/portal/spousal-ss-coordination", label: "Spousal SS Coordination", section: "Retirement" },
  { path: "/portal/dca-vs-lump-sum", label: "DCA vs Lump Sum", section: "Retirement" },
  { path: "/portal/retirement-budget", label: "Retirement Budget", section: "Retirement" },
  { path: "/portal/inflation-adjusted-income", label: "Inflation-Adjusted Income", section: "Retirement" },
  { path: "/portal/life-insurance-needs", label: "Life Insurance Needs", section: "Insurance" },
  { path: "/portal/disability-insurance-needs", label: "Disability Insurance Needs", section: "Insurance" },
  { path: "/portal/ltc-cost", label: "Long-Term Care Cost", section: "Insurance" },
  { path: "/portal/umbrella-insurance", label: "Umbrella Insurance", section: "Insurance" },
  { path: "/portal/term-vs-whole-vs-iul", label: "Term vs Whole vs IUL", section: "Insurance" },
  { path: "/portal/key-person-insurance", label: "Key Person Insurance", section: "Insurance" },
  { path: "/portal/buy-sell-funding", label: "Buy-Sell Funding", section: "Insurance" },
  { path: "/portal/crt-calculator", label: "CRT Calculator", section: "Wealth" },
  { path: "/portal/grat-calculator", label: "GRAT Calculator", section: "Wealth" },
  { path: "/portal/ilit-calculator", label: "ILIT Calculator", section: "Wealth" },
  { path: "/portal/qprt-calculator", label: "QPRT Calculator", section: "Wealth" },
  { path: "/portal/gstt-calculator", label: "GSTT Calculator", section: "Wealth" },
  { path: "/portal/daf-vs-direct-giving", label: "DAF vs Direct Giving", section: "Wealth" },
  { path: "/portal/estate-liquidity", label: "Estate Liquidity", section: "Wealth" },
  { path: "/portal/net-worth-tracker", label: "Net Worth Tracker", section: "Home" },
  { path: "/portal/compound-interest", label: "Compound Interest", section: "Wealth" },
  { path: "/portal/millionaire-calculator", label: "Millionaire Calculator", section: "Wealth" },
  { path: "/portal/emergency-fund-vs-iul", label: "Emergency Fund vs IUL", section: "Wealth" },
  { path: "/portal/529-vs-iul", label: "529 vs IUL", section: "Wealth" },
  { path: "/portal/debt-payoff-optimizer", label: "Debt Payoff Optimizer", section: "Wealth" },
  { path: "/portal/rental-property-roi", label: "Rental Property ROI", section: "Wealth" },
  { path: "/portal/1031-exchange", label: "1031 Exchange", section: "Wealth" },
  { path: "/portal/opportunity-zone", label: "Opportunity Zone", section: "Wealth" },
  { path: "/portal/home-affordability", label: "Home Affordability", section: "Wealth" },
  { path: "/portal/refinance-break-even", label: "Refinance Break-Even", section: "Wealth" },
  { path: "/portal/cost-of-living", label: "Cost of Living", section: "Wealth" },
  { path: "/portal/reverse-mortgage", label: "Reverse Mortgage", section: "Wealth" },
  { path: "/portal/depreciation-tax-shield", label: "Depreciation Tax Shield", section: "Wealth" },
  { path: "/portal/property-tax-appeal", label: "Property Tax Appeal", section: "Wealth" },
  { path: "/portal/vacation-rental", label: "Vacation Rental", section: "Wealth" },
  { path: "/portal/business-valuation", label: "Business Valuation", section: "Clients" },
  { path: "/portal/cash-balance-plan", label: "Cash Balance Plan", section: "Clients" },
  { path: "/portal/entity-comparison", label: "Entity Comparison", section: "Clients" },
  { path: "/portal/qbi-calculator", label: "QBI Calculator", section: "Clients" },
  { path: "/portal/deferred-compensation", label: "Deferred Compensation", section: "Retirement" },
  { path: "/portal/captive-insurance", label: "Captive Insurance", section: "Clients" },
  { path: "/portal/succession-plan", label: "Succession Plan", section: "Clients" },
  { path: "/portal/esop-calculator", label: "ESOP Calculator", section: "Clients" },
  { path: "/portal/severance-calculator", label: "Severance Calculator", section: "Clients" },
  { path: "/portal/overhead-expense", label: "Overhead Expense", section: "Clients" },
  { path: "/portal/asset-allocation", label: "Asset Allocation", section: "Wealth" },
  { path: "/portal/pe-irr-calculator", label: "Private Equity IRR", section: "Wealth" },
  { path: "/portal/bond-ladder", label: "Bond Ladder", section: "Wealth" },
  { path: "/portal/muni-bond-ladder", label: "Muni Bond Ladder", section: "Wealth" },
  { path: "/portal/drip-growth", label: "DRIP Growth", section: "Wealth" },
  { path: "/portal/options-profit-loss", label: "Options Profit/Loss", section: "Wealth" },
  { path: "/portal/portfolio-risk-return", label: "Portfolio Risk/Return", section: "Wealth" },
  { path: "/portal/sector-rotation", label: "Sector Rotation", section: "Wealth" },
  { path: "/portal/fee-impact", label: "Fee Impact", section: "Wealth" },
  { path: "/portal/tax-loss-harvest-calc", label: "Tax-Loss Harvesting Scanner", section: "Tax" },
  { path: "/portal/budget-50-30-20", label: "50/30/20 Budget", section: "Wealth" },
  { path: "/portal/zero-based-budget", label: "Zero-Based Budget", section: "Wealth" },
  { path: "/portal/spend-vs-invest", label: "Spend vs Invest", section: "Wealth" },
  { path: "/portal/lease-vs-buy", label: "Lease vs Buy", section: "Wealth" },
  { path: "/portal/student-loan-vs-invest", label: "Student Loan vs Invest", section: "Wealth" },
  { path: "/portal/credit-card-payoff", label: "Credit Card Payoff", section: "Wealth" },
  { path: "/portal/savings-rate-impact", label: "Savings Rate Impact", section: "Wealth" },
  { path: "/portal/cost-of-waiting", label: "Cost of Waiting", section: "Wealth" },
  { path: "/portal/lifestyle-inflation", label: "Lifestyle Inflation", section: "Wealth" },
  { path: "/portal/financial-freedom-number", label: "Financial Freedom Number", section: "Home" },
  { path: "/portal/mega-backdoor-roth", label: "Mega Backdoor Roth", section: "Tax" },
  { path: "/portal/backdoor-roth", label: "Backdoor Roth", section: "Tax" },
  { path: "/portal/roth-vs-traditional", label: "Roth vs Traditional", section: "Tax" },
  { path: "/portal/nua-calculator", label: "NUA Calculator", section: "Tax" },
  { path: "/portal/charitable-stock-donation", label: "Charitable Stock Donation", section: "Tax" },
  { path: "/portal/installment-sale", label: "Installment Sale", section: "Tax" },
  { path: "/portal/like-kind-exchange", label: "Like-Kind Exchange", section: "Tax" },
  { path: "/portal/gain-loss-harvesting", label: "Gain/Loss Harvesting", section: "Tax" },
  { path: "/portal/state-tax-arbitrage", label: "State Tax Arbitrage", section: "Tax" },
  { path: "/portal/income-shifting", label: "Income Shifting", section: "Tax" },
  { path: "/portal/special-needs-trust", label: "Special Needs Trust", section: "Wealth" },
  { path: "/portal/divorce-settlement-enhanced", label: "Divorce Settlement (Enhanced)", section: "Wealth" },
  { path: "/portal/alimony-tax-impact", label: "Alimony Tax Impact", section: "Tax" },
  { path: "/portal/windfall-management", label: "Windfall Management", section: "Wealth" },
  { path: "/portal/sabbatical-planner", label: "Sabbatical Planner", section: "Wealth" },
  { path: "/portal/aca-subsidy", label: "ACA Subsidy", section: "Insurance" },
  { path: "/portal/hsa-triple-tax", label: "HSA Triple Tax", section: "Tax" },
  { path: "/portal/pension-max", label: "Pension Max", section: "Retirement" },
  { path: "/portal/annuity-comparison", label: "Annuity Comparison", section: "Insurance" },
  { path: "/portal/financial-health-score", label: "Financial Health Score", section: "Home" },
  { path: "/portal/retirement-advantage", label: "Retirement Advantage", section: "Retirement" },
];
function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Use shared auth hook — no duplicate trpc.auth.me query
  const { isAuthenticated: isAuth } = useAuth();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: open && isAuth,
    staleTime: 60_000,
    retry: false,
  });

  const results = useMemo(() => {
    if (!query.trim()) return ALL_PAGES.slice(0, 8);
    const pageResults = ALL_PAGES.filter(
      (p) => fuzzyMatch(p.label, query) || fuzzyMatch(p.section, query)
    ).map((p) => ({ ...p, type: "page" as const }));

    const clientResults = (clients ?? [])
      .filter((c: any) => fuzzyMatch(c.name ?? "", query))
      .slice(0, 5)
      .map((c: any) => ({
        path: `/portal/clients/${c.id}`,
        label: c.name ?? "Unknown",
        section: "Client",
        type: "client" as const,
      }));

    return [...pageResults.slice(0, 8), ...clientResults];
  }, [query, clients]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex].path);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setOpen(false)} />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
        <div className="bg-[#0b1628] border border-[#1a3055] rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#12233e]">
            <Search size={18} className="text-[#7a95b8] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search pages, clients, actions..."
              className="flex-1 bg-transparent text-white text-sm placeholder-[#4a6a8e] outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#12233e] text-[10px] text-[#7a95b8] border border-[#1a3055]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto py-2">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[#7a95b8]">
                No results found for "{query}"
              </div>
            ) : (
              results.map((item, i) => (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex
                      ? "bg-[#22c55e]/10 text-white"
                      : "text-[#c8d8ec] hover:bg-[#12233e]"
                  }`}
                >
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8] flex-shrink-0">
                    {item.section}
                  </span>
                  <span className="flex-1 text-sm truncate">{item.label}</span>
                  <ArrowRight size={14} className="text-[#4a6a8e] flex-shrink-0" />
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[#12233e] text-[10px] text-[#4a6a8e]">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[#12233e] border border-[#1a3055]">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[#12233e] border border-[#1a3055]">↵</kbd> Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[#12233e] border border-[#1a3055]">Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
