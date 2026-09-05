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
  // Dashboard
  { path: "/portal", label: "Dashboard Home", section: "Dashboard" },
  { path: "/portal/financial-vitals", label: "Financial Vitals", section: "Dashboard" },
  { path: "/portal/client-snapshot", label: "Snapshot Map", section: "Dashboard" },
  { path: "/portal/client-health", label: "Client Health Alerts", section: "Dashboard" },
  // Clients & CRM
  { path: "/portal/clients", label: "Client Directory", section: "Clients & CRM" },
  { path: "/portal/client-files", label: "Client Files", section: "Clients & CRM" },
  { path: "/portal/client-self-service", label: "Self-Service Portal", section: "Clients & CRM" },
  { path: "/portal/client-portal-config", label: "Portal Settings", section: "Clients & CRM" },
  { path: "/portal/client-onboarding", label: "Client Onboarding", section: "Clients & CRM" },
  { path: "/portal/client-onboarding-auto", label: "Onboarding Automation", section: "Clients & CRM" },
  { path: "/portal/client-intake", label: "Smart Client Intake", section: "Clients & CRM" },
  { path: "/portal/meetings", label: "Meetings", section: "Clients & CRM" },
  { path: "/portal/meeting-agenda", label: "Meeting Agenda", section: "Clients & CRM" },
  { path: "/portal/ai-meeting-notes", label: "Smart Meeting Notes", section: "Clients & CRM" },
  // Retirement & Income
  { path: "/portal/ecological-drivers", label: "Retirement Drivers", section: "Retirement & Income" },
  { path: "/portal/social-security", label: "Social Security", section: "Retirement & Income" },
  { path: "/portal/income-gap", label: "Income Gap Analyzer", section: "Retirement & Income" },
  { path: "/portal/goals-planning", label: "Goals-Based Planning", section: "Retirement & Income" },
  { path: "/portal/retirement-guardrails", label: "Retirement Guardrails", section: "Retirement & Income" },
  { path: "/portal/withdrawal-sequencing", label: "Withdrawal Sequencing", section: "Retirement & Income" },
  { path: "/portal/medicare-irmaa", label: "Medicare & IRMAA", section: "Retirement & Income" },
  { path: "/portal/retirement-projection", label: "Income Projection", section: "Retirement & Income" },
  { path: "/portal/lifetime-income", label: "Lifetime Income", section: "Retirement & Income" },
  { path: "/portal/income-timeline", label: "Income Timeline", section: "Retirement & Income" },
  { path: "/portal/advisor-income-calculator", label: "Income Calculator", section: "Retirement & Income" },
  // Tax & Estate
  { path: "/portal/tax-waterfall", label: "Tax Waterfall", section: "Tax & Estate" },
  { path: "/portal/tax-brackets", label: "Tax Brackets", section: "Tax & Estate" },
  { path: "/portal/tax-advantaged-growth", label: "Tax-Advantaged Growth", section: "Tax & Estate" },
  { path: "/portal/tax-opportunities", label: "Tax Opportunities", section: "Tax & Estate" },
  { path: "/portal/tax-loss-harvesting", label: "Tax-Loss Harvesting", section: "Tax & Estate" },
  { path: "/portal/hot-income", label: "Hot Income (Oil & Gas)", section: "Tax & Estate" },
  { path: "/portal/tax-return-upload", label: "Tax Return OCR", section: "Tax & Estate" },
  { path: "/portal/estate-tax", label: "Estate Tax", section: "Tax & Estate" },
  { path: "/portal/estate-flow", label: "Estate Flow Chart", section: "Tax & Estate" },
  { path: "/portal/estate-document-gen", label: "Estate Doc Generator", section: "Tax & Estate" },
  { path: "/portal/beneficiary-optimization", label: "Beneficiary Optimizer", section: "Tax & Estate" },
  { path: "/portal/multi-gen-wealth", label: "Multi-Gen Wealth Transfer", section: "Tax & Estate" },
  { path: "/portal/charitable-giving", label: "Charitable Giving", section: "Tax & Estate" },
  { path: "/portal/succession-planning", label: "Succession Planning", section: "Tax & Estate" },
  { path: "/portal/divorce-calculator", label: "Divorce Devastation Engine", section: "Tax & Estate" },
  { path: "/portal/trusts", label: "Trust Structures (ILIT/SLAT/BLAT/PLAT/Dynasty)", section: "Tax & Estate" },
  { path: "/portal/mortgage-killer-v3", label: "Mortgage Killer V3 — Infinite Property Acquisition", section: "Real Estate" },
  { path: "/portal/str-strategy", label: "STR Tax Strategy — Cost Segregation & Bonus Depreciation", section: "Real Estate" },
  { path: "/portal/client-portfolio", label: "Client Portfolio Dashboard — Aggregate Strategy View", section: "Dashboard" },
  // Wealth Strategy
  { path: "/portal/strategy", label: "Strategy Lab", section: "Wealth Strategy" },
  { path: "/portal/roth-conversion", label: "Roth Strategies (6)", section: "Wealth Strategy" },
  { path: "/portal/strategy-compare", label: "Strategy Compare", section: "Wealth Strategy" },
  { path: "/portal/scenarios", label: "Scenario Builder", section: "Wealth Strategy" },
  { path: "/portal/saved-scenarios", label: "Saved Scenarios", section: "Wealth Strategy" },
  { path: "/portal/scenario-play", label: "Multi-Scenario Play", section: "Wealth Strategy" },
  { path: "/portal/scenario-side-by-side", label: "Side-by-Side Compare", section: "Wealth Strategy" },
  { path: "/portal/iul-vs-roth", label: "IUL vs Roth", section: "Wealth Strategy" },
  { path: "/portal/risk-tolerance", label: "Risk Tolerance", section: "Wealth Strategy" },
  { path: "/portal/ai-recommender", label: "Strategy Recommender", section: "Wealth Strategy" },
  { path: "/portal/market-stress-test", label: "Market Stress Test", section: "Wealth Strategy" },
  { path: "/portal/smart-rebalancing", label: "Smart Rebalancing", section: "Wealth Strategy" },
  { path: "/portal/rebalance", label: "Rebalance", section: "Wealth Strategy" },
  { path: "/portal/portfolio-drift", label: "Portfolio Drift", section: "Wealth Strategy" },
  // Calculators
  { path: "/portal/ibbotson-charts", label: "Ibbotson Charts", section: "Calculators" },
  { path: "/portal/iul-historical", label: "IUL Historical", section: "Calculators" },
  { path: "/portal/index-strategies", label: "Index Strategies", section: "Calculators" },
  { path: "/portal/policy-loans", label: "Policy Loans", section: "Calculators" },
  { path: "/portal/premium-financing", label: "Premium Financing", section: "Calculators" },
  { path: "/portal/index-backtester", label: "Index Backtester", section: "Calculators" },
  { path: "/portal/time-machine-calculator", label: "Time Machine", section: "Calculators" },
  { path: "/portal/time-machine-ag49", label: "AG 49 Compounding", section: "Calculators" },
  { path: "/portal/time-machine-method", label: "Dual Illustration", section: "Calculators" },
  { path: "/portal/quick-quote", label: "Quick Quote", section: "Calculators" },
  { path: "/portal/inflation", label: "Inflation Adjust", section: "Calculators" },
  { path: "/portal/fee-transparency", label: "Fee Transparency", section: "Calculators" },
  { path: "/portal/business-owner", label: "Business Owner", section: "Calculators" },
  { path: "/portal/crypto-corner", label: "Crypto Corner", section: "Calculators" },
  // Real Estate
  { path: "/portal/mortgage-killer", label: "Mortgage Killer", section: "Real Estate" },
  { path: "/portal/house-recycling", label: "House Recycling", section: "Real Estate" },
  { path: "/portal/household-wealth", label: "Household Wealth", section: "Real Estate" },
  { path: "/portal/real-estate-mogul", label: "Real Estate Mogul", section: "Real Estate" },
  // Annuities & Insurance
  { path: "/portal/growth-annuities", label: "Growth Annuities", section: "Annuities & Insurance" },
  { path: "/portal/myga-fixed-rate", label: "Amazing MYGA Waterfall", section: "Annuities & Insurance" },
  { path: "/portal/existing-annuities", label: "Existing Annuities", section: "Annuities & Insurance" },
  { path: "/portal/income-annuity-top10", label: "Top 10 Income", section: "Annuities & Insurance" },
  { path: "/portal/fia-top10", label: "Top 10 FIA", section: "Annuities & Insurance" },
  { path: "/portal/annuity-accumulation-db", label: "Accumulation Database", section: "Annuities & Insurance" },
  { path: "/portal/carrier-rates", label: "Carrier Rates", section: "Annuities & Insurance" },
  { path: "/portal/carrier-comparison", label: "Carrier Compare", section: "Annuities & Insurance" },
  { path: "/portal/illustration-compare", label: "Illustration Compare", section: "Annuities & Insurance" },
  { path: "/portal/carrier-ratings", label: "Carrier Ratings", section: "Annuities & Insurance" },
  { path: "/portal/quotes", label: "Carrier Quotes", section: "Annuities & Insurance" },
  { path: "/portal/axonic-sp500", label: "S&P 500 Axonic", section: "Annuities & Insurance" },
  { path: "/portal/athene-pe-plus15", label: "Athene PE Plus 15", section: "Annuities & Insurance" },
  { path: "/portal/athene-guaranteed-income", label: "Athene Income", section: "Annuities & Insurance" },
  { path: "/portal/policy-review-checklist", label: "Policy Review", section: "Annuities & Insurance" },
  { path: "/portal/ai-policy-review", label: "Policy Gap Analysis", section: "Annuities & Insurance" },
  // AI & Intelligence
  { path: "/portal/ai-assist", label: "Strategy Assist", section: "Intelligence Tools" },
  { path: "/portal/advisor-chat", label: "Advisor Chat", section: "Intelligence Tools" },
  { path: "/portal/voice-plan", label: "Voice-to-Plan", section: "Intelligence Tools" },
  { path: "/portal/data-query", label: "Ask Your Data", section: "Intelligence Tools" },
  { path: "/portal/document-templates", label: "Document Templates", section: "Intelligence Tools" },
  { path: "/portal/report-builder", label: "Report Builder", section: "Intelligence Tools" },
  { path: "/portal/collaborative-planning", label: "Collaborative Planning", section: "Intelligence Tools" },
  // Sales & Presentations
  { path: "/portal/recommendations", label: "Score Boosters", section: "Sales & Presentations" },
  { path: "/portal/sales-story", label: "Sales Story Builder", section: "Sales & Presentations" },
  { path: "/portal/lead-generator", label: "Lead Generator", section: "Sales & Presentations" },
  { path: "/portal/referral-tracking", label: "Referral Tracking", section: "Sales & Presentations" },
  { path: "/portal/engagement-score", label: "Engagement Score", section: "Sales & Presentations" },
  { path: "/portal/leaderboard", label: "Leaderboard", section: "Sales & Presentations" },
  { path: "/portal/competitive", label: "Competitive Analysis", section: "Sales & Presentations" },
  { path: "/portal/seminar-generator", label: "Seminar Generator", section: "Sales & Presentations" },
  { path: "/portal/presentation-builder", label: "Presentation Builder", section: "Sales & Presentations" },
  { path: "/portal/email-campaigns", label: "Email Campaigns", section: "Sales & Presentations" },
  // Market & Analytics
  { path: "/portal/market-data", label: "Market Data", section: "Market & Analytics" },
  { path: "/portal/predictive-analytics", label: "Predictive Analytics", section: "Market & Analytics" },
  { path: "/portal/advisor-performance", label: "Advisor Metrics", section: "Market & Analytics" },
  { path: "/portal/client-comparison", label: "Client Compare", section: "Market & Analytics" },
  { path: "/portal/stale-digest", label: "Stale Digest", section: "Market & Analytics" },
  // Compliance & Legal
  { path: "/portal/compliance", label: "Compliance Center", section: "Compliance & Legal" },
  { path: "/portal/compliance-monitoring", label: "Compliance Monitor", section: "Compliance & Legal" },
  { path: "/portal/compliance-audit", label: "Audit Center", section: "Compliance & Legal" },
  { path: "/portal/compliance-alerts", label: "Alerts", section: "Compliance & Legal" },
  { path: "/portal/compliance-reports", label: "Reports", section: "Compliance & Legal" },
  { path: "/portal/compliance-audit-trail", label: "Audit Trail", section: "Compliance & Legal" },
  { path: "/portal/disclaimers", label: "Disclaimers", section: "Compliance & Legal" },
  { path: "/portal/communication-log", label: "Comm Log", section: "Compliance & Legal" },
  { path: "/portal/website-usage", label: "Website Usage", section: "Compliance & Legal" },
  { path: "/portal/legal-payment-folder", label: "Payment Folder", section: "Compliance & Legal" },
  { path: "/portal/monitoring-agreement", label: "Monitoring", section: "Compliance & Legal" },
  { path: "/portal/owner-oversight", label: "Owner Oversight", section: "Compliance & Legal" },
  // Administration
  { path: "/portal/team", label: "Team Members", section: "Administration" },
  { path: "/portal/team-management", label: "Agency Teams", section: "Administration" },
  { path: "/portal/education", label: "Education Hub", section: "Administration" },
  { path: "/portal/advisor-training", label: "Advisor Training", section: "Administration" },
  { path: "/portal/agent-tutorial", label: "Agent Tutorial", section: "Administration" },
  { path: "/portal/agency-tutorial", label: "Agency Tutorial", section: "Administration" },
  { path: "/portal/billing", label: "Billing", section: "Administration" },
  { path: "/portal/enterprise", label: "Enterprise", section: "Administration" },
  { path: "/portal/knowledge", label: "Knowledge Base", section: "Administration" },
  { path: "/portal/branding", label: "Branding", section: "Administration" },
  { path: "/portal/webhooks", label: "Webhooks", section: "Administration" },
  { path: "/portal/slack", label: "Slack", section: "Administration" },
  { path: "/portal/hubspot", label: "HubSpot", section: "Administration" },
  { path: "/portal/affiliate-links", label: "Affiliate Links", section: "Administration" },
  { path: "/portal/workflow-automations", label: "Workflow Automations", section: "Administration" },
  { path: "/portal/bulk-generation", label: "Bulk Generation", section: "Administration" },
  { path: "/portal/hidden-material", label: "Archived", section: "Administration" },
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
