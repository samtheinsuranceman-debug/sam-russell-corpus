import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

const PATH_LABELS: Record<string, string> = {
  portal: "Home",
  // Command Center
  clients: "Clients & CRM",
  meetings: "Meetings",
  "client-onboarding": "Client Onboarding",
  "client-files": "Client Files",
  "quick-quote": "Quick Quote",
  "ai-assist": "Strategy Assist",
  dashboard: "Dashboard",
  // Sales & Growth
  recommendations: "Score Boosters",
  "sales-story": "Sales Story Builder",
  "seminar-generator": "Seminar Generator",
  "referral-tracking": "Referral Tracking",
  leaderboard: "Leaderboard",
  competitive: "Competitive Analysis",
  // Planning — Retirement
  "ecological-drivers": "Retirement Drivers",
  "social-security": "Social Security",
  "income-gap": "Income Gap Analyzer",
  "goals-planning": "Goals-Based Planning",
  "withdrawal-sequencing": "Withdrawal Sequencing",
  "medicare-irmaa": "Medicare & IRMAA",
  "retirement-projection": "Income Projection",
  // Planning — Wealth Strategy
  strategy: "Strategy Lab",
  "roth-conversion": "Roth Strategies (6)",
  "strategy-compare": "Strategy Compare",
  scenarios: "Scenario Builder",
  "saved-scenarios": "Saved Scenarios",
  "scenario-play": "Multi-Scenario Play",
  "iul-vs-roth": "IUL vs Roth",
  "risk-tolerance": "Risk Tolerance",
  "ai-recommender": "Strategy Recommender",
  // Planning — Tax & Estate
  "tax-waterfall": "Tax Waterfall",
  "tax-brackets": "Tax Brackets",
  "tax-advantaged-growth": "Tax-Advantaged Growth",
  "estate-tax": "Estate Tax",
  "estate-flow": "Estate Flow Chart",
  "hot-income": "Hot Income (Oil & Gas)",
  // Tax Secrets — Divorce & Trusts
  "divorce-calculator": "Divorce Devastation Engine",
  "trusts": "Trust Structures",
  "mortgage-killer-v3": "Mortgage Killer V3",
  "str-strategy": "STR Tax Strategy",
  "client-portfolio": "Client Portfolio Dashboard",
  // Calculators — IUL & Ibbotson
  "ibbotson-charts": "Ibbotson Charts",
  "iul-historical": "IUL Historical",
  "index-strategies": "Index Strategies",
  "income-timeline": "Income Timeline",
  "policy-loans": "Policy Loans",
  "premium-financing": "Premium Financing",
  "index-backtester": "Index Backtester",
  // Calculators — Time Machine
  "time-machine-calculator": "Time Machine",
  "time-machine-ag49": "AG 49 Compounding",
  "time-machine-method": "Dual Illustration",
  // Calculators — Real Estate
  "mortgage-killer": "Mortgage Killer",
  "house-recycling": "House Recycling",
  "household-wealth": "Household Wealth",
  "real-estate-mogul": "Real Estate Mogul",
  // Calculators — Annuities
  "lifetime-income": "Lifetime Income",
  "growth-annuities": "Growth Annuities",
  "myga-fixed-rate": "Amazing MYGA Waterfall",
  "existing-annuities": "Existing Annuities",
  "advisor-income-calculator": "Income Calculator",
  "income-annuity-top10": "Top 10 Income",
  "fia-top10": "Top 10 FIA",
  "annuity-accumulation-db": "Accumulation Database",
  // Calculators — Carriers
  "carrier-rates": "Carrier Rates",
  "carrier-comparison": "Carrier Compare",
  "illustration-compare": "Illustration Compare",
  "carrier-ratings": "Carrier Ratings",
  quotes: "Carrier Quotes",
  "axonic-sp500": "S&P 500 Axonic",
  "athene-pe-plus15": "Athene PE Plus 15",
  "athene-guaranteed-income": "Athene Income",
  "business-owner": "Business Owner",
  "crypto-corner": "Crypto Corner",
  // Market & Analytics
  "market-data": "Market Data",
  "predictive-analytics": "Predictive Analytics",
  "advisor-performance": "Advisor Metrics",
  "client-comparison": "Client Compare",
  inflation: "Inflation Adjust",
  "stale-digest": "Stale Digest",
  rebalance: "Rebalance",
  // AI & Productivity
  "advisor-chat": "Advisor Chat",
  "ai-meeting-notes": "Smart Meeting Notes",
  "document-templates": "Document Templates",
  "tax-return-upload": "Tax Return OCR",
  "collaborative-planning": "Collaborative Planning",
  "policy-review-checklist": "Policy Review",
  "report-builder": "Report Builder",
  "email-campaigns": "Email Campaigns",
  // Administration — Team & Training
  team: "Team Members",
  "team-management": "Agency Teams",
  education: "Education Hub",
  "advisor-training": "Advisor Training",
  "agent-tutorial": "Agent Tutorial",
  "agency-tutorial": "Agency Tutorial",
  // Administration — Compliance & Legal
  compliance: "Compliance Center",
  "compliance-audit": "Audit Center",
  "compliance-alerts": "Alerts",
  "compliance-reports": "Compliance Reports",
  disclaimers: "Disclaimers",
  "communication-log": "Comm Log",
  "website-usage": "Website Usage",
  "legal-payment-folder": "Payment Folder",
  "monitoring-agreement": "Monitoring",
  "owner-oversight": "Owner Oversight",
  // Administration — Settings
  billing: "Billing",
  enterprise: "Enterprise",
  "client-portal-config": "Client Portal",
  knowledge: "Knowledge Base",
  branding: "Branding",
  webhooks: "Webhooks",
  slack: "Slack",
  hubspot: "HubSpot",
  "affiliate-links": "Affiliate Links",
  "bulk-generation": "Bulk Generation",
  "meeting-agenda": "Meeting Agenda",
  "hidden-material": "Archived",
};

export function Breadcrumbs() {
  const [location] = useLocation();
  const segments = location.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs: { label: string; path: string }[] = [];

  // Always start with Home
  crumbs.push({ label: "Home", path: "/portal" });

  // Build crumbs from path segments (skip "portal")
  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += "/" + segments[i];
    if (segments[i] === "portal") continue;

    // If it's a numeric ID, skip labeling it (it's a detail page)
    if (/^\d+$/.test(segments[i])) continue;

    const label = PATH_LABELS[segments[i]] ?? segments[i].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, path: currentPath });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7a95b8] mb-4 px-6 pt-4">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} className="text-[#4a6a8e]" />}
            {isLast ? (
              <span className="text-white font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.path} className="hover:text-[#22c55e] transition-colors">
                {i === 0 ? (
                  <span className="flex items-center gap-1">
                    <Home size={12} />
                    {crumb.label}
                  </span>
                ) : (
                  crumb.label
                )}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
