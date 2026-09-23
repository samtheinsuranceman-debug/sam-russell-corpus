// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search, Calculator, Receipt, Flame, Shield, HeartPulse, Landmark, TrendingUp, Building2, Briefcase, BarChart3, Wallet, Zap, Sparkles, Crown, ChevronRight, Star } from 'lucide-react';
import { PageInsights } from "@/components/PageInsights";

/* ═══════════════════════════════════════════════════════════════
   CALCULATOR HUB — Searchable index of all 100+ financial calculators
   ═══════════════════════════════════════════════════════════════ */

interface CalcItem {
  name: string;
  route: string;
  description: string;
}

interface CalcCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  items: CalcItem[];
}

const CATEGORIES: CalcCategory[] = [
  {
    id: "physician",
    label: "⭐ Physician-Specific Tools",
    icon: HeartPulse,
    color: "from-rose-500/20 to-rose-600/5",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    textColor: "text-rose-400",
    items: [
      { name: "PSLF Calculator", route: "/portal/forgiveness", description: "Public Service Loan Forgiveness eligibility, qualifying payments, projected tax-free forgiveness for physicians at nonprofit hospitals, VA, and academic centers." },
      { name: "Own-Occupation Disability", route: "/portal/disability-gap-analyzer", description: "Specialty-specific disability insurance analysis with own-occ vs any-occ coverage gaps, premium-to-benefit ratios for surgeons and proceduralists." },
    ],
  },
  {
    id: "tax",
    label: "Tax & Income Optimization",
    icon: Receipt,
    color: "from-orange-500/20 to-orange-600/5",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    textColor: "text-orange-400",
    items: [
      { name: "Crypto Tax", route: "/portal/crypto-tax-strategy", description: "Calculate cryptocurrency tax obligations including mining, staking, and DeFi" },
    ],
  },
  {
    id: "retirement",
    label: "Retirement Planning",
    icon: Flame,
    color: "from-amber-500/20 to-amber-600/5",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-400",
    items: [
      { name: "Medicare IRMAA", route: "/portal/medicare-irmaa", description: "Income-Related Monthly Adjustment Amount surcharge calculator" },
      { name: "Inflation-Adjusted Income", route: "/portal/inflation", description: "Model purchasing power erosion and income needs over 50 years" },
    ],
  },
  {
    id: "insurance",
    label: "Insurance & Risk Management",
    icon: Shield,
    color: "from-emerald-500/20 to-emerald-600/5",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    textColor: "text-emerald-400",
    items: [
      { name: "Long-Term Care Cost", route: "/portal/long-term-care", description: "Project LTC costs by state with inflation and coverage gap analysis" },
      { name: "Key Person Insurance", route: "/portal/key-person-insurance", description: "Calculate key employee coverage needs for business continuity" },
      { name: "Buy-Sell Funding", route: "/portal/buy-sell-agreement", description: "Model buy-sell agreement funding strategies and insurance needs" },
    ],
  },
  {
    id: "estate",
    label: "Estate & Legacy Planning",
    icon: Landmark,
    color: "from-indigo-500/20 to-indigo-600/5",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    textColor: "text-indigo-400",
    items: [
      { name: "ILIT Calculator", route: "/portal/ilit-analyzer", description: "Irrevocable Life Insurance Trust estate tax elimination modeling" },
      { name: "QPRT Calculator", route: "/portal/qprt", description: "Qualified Personal Residence Trust gift tax savings calculator" },
      { name: "DAF vs Direct Giving", route: "/portal/daf-strategic", description: "Donor-Advised Fund vs direct charitable giving comparison" },
    ],
  },
  {
    id: "wealth",
    label: "Wealth Building",
    icon: TrendingUp,
    color: "from-cyan-500/20 to-cyan-600/5",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    textColor: "text-cyan-400",
    items: [
    ],
  },
  {
    id: "realestate",
    label: "Real Estate & Property",
    icon: Building2,
    color: "from-teal-500/20 to-teal-600/5",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    textColor: "text-teal-400",
    items: [
      { name: "1031 Exchange", route: "/portal/1031-exchange-analyzer", description: "Model tax-deferred property exchanges with timeline and basis tracking" },
      { name: "Opportunity Zone", route: "/portal/opportunity-zone-planner", description: "Calculate tax benefits of Qualified Opportunity Zone investments" },
      { name: "Vacation Rental", route: "/portal/short-term-rentals", description: "Model vacation rental income with seasonality and expenses" },
    ],
  },
  {
    id: "business",
    label: "Business Owner Tools",
    icon: Briefcase,
    color: "from-blue-500/20 to-blue-600/5",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-400",
    items: [
      { name: "Cash Balance Plan", route: "/portal/cash-balance-plan", description: "Model defined benefit plan contributions and tax savings" },
      { name: "QBI Calculator", route: "/portal/qbi-optimizer", description: "Qualified Business Income deduction (Section 199A) calculator" },
      { name: "Captive Insurance", route: "/portal/captive-insurance-planner", description: "Captive insurance premium calculator with tax benefit modeling" },
      { name: "Succession Plan", route: "/portal/succession-planning", description: "Business succession timeline and valuation transition modeling" },
    ],
  },
  {
    id: "investment",
    label: "Investment Analysis",
    icon: BarChart3,
    color: "from-indigo-500/20 to-indigo-600/5",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    textColor: "text-indigo-400",
    items: [
      { name: "Tax-Loss Harvesting", route: "/portal/tax-loss-harvesting", description: "Identify tax-loss harvesting opportunities in your portfolio" },
    ],
  },
  {
    id: "budgeting",
    label: "Budgeting & Cash Flow",
    icon: Wallet,
    color: "from-green-500/20 to-green-600/5",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-400",
    items: [
    ],
  },
  {
    id: "advanced-tax",
    label: "Advanced Tax Strategies",
    icon: Zap,
    color: "from-rose-500/20 to-rose-600/5",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    textColor: "text-rose-400",
    items: [
      { name: "NUA Calculator", route: "/portal/nua-strategy", description: "Net Unrealized Appreciation strategy for employer stock in 401k" },
      { name: "Installment Sale", route: "/portal/installment-sale-strategy", description: "Model installment sale tax deferral with interest income analysis" },
    ],
  },
  {
    id: "specialized",
    label: "Specialized Planning",
    icon: Sparkles,
    color: "from-yellow-500/20 to-yellow-600/5",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    textColor: "text-yellow-400",
    items: [
      { name: "Special Needs Trust", route: "/portal/special-needs", description: "Special needs trust funding calculator preserving benefits eligibility" },
      { name: "Divorce Settlement", route: "/portal/divorce-financial", description: "Enhanced divorce financial settlement analyzer with asset protection" },
      { name: "Pension Max", route: "/portal/pension-max-engine", description: "Pension maximization with life insurance replacement strategy" },
      { name: "Financial Health Score", route: "/portal/client-financial-health-score", description: "Comprehensive financial health dashboard with scoring and recommendations" },
      { name: "Retirement Advantage", route: "/portal/retirement-advantage", description: "Comprehensive retirement planning advantage calculator" },
    ],
  },
];

const TOTAL_CALCS = CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);

export default function CalculatorHub() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
        const matchesCat = !activeCategory || cat.id === activeCategory;
        return matchesSearch && matchesCat;
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [search, activeCategory]);

  const totalFiltered = filtered.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-400">{TOTAL_CALCS} Financial Calculators</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Calculator Hub
          </h1>
          <p className="text-lg text-[#7a95b8] max-w-2xl mx-auto">
            Every financial calculation you need — from tax optimization to estate planning.
            Each calculator features interactive inputs, real-time results, and 50-year projections.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Search calculators... (e.g., Roth, FIRE, estate, mortgage)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 bg-[#0a1628] border-[#1a3055] text-white placeholder:text-slate-500 text-base rounded-xl focus:border-cyan-500/50 focus:ring-cyan-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !activeCategory
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-[#0a1628] text-[#7a95b8] border border-[#1a3055] hover:border-slate-500"
            }`}
          >
            All ({TOTAL_CALCS})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? `${cat.bgColor} ${cat.textColor} border ${cat.borderColor}`
                  : "bg-[#0a1628] text-[#7a95b8] border border-[#1a3055] hover:border-slate-500"
              }`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label.split(" ")[0]} ({cat.items.length})
            </button>
          ))}
        </div>

        {/* Results count */}
        {(search || activeCategory) && (
          <p className="text-center text-sm text-slate-500">
            Showing {totalFiltered} of {TOTAL_CALCS} calculators
          </p>
        )}

        {/* Calculator Grid by Category */}
        <div className="space-y-10">
          {filtered.map((cat) => (
            <div key={cat.id}>
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${cat.bgColor}`}>
                  <cat.icon className={`w-5 h-5 ${cat.textColor}`} />
                </div>
                <h2 className="text-xl font-bold text-white">{cat.label}</h2>
                <Badge variant="outline" className={`${cat.textColor} ${cat.borderColor} text-xs`}>
                  {cat.items.length}
                </Badge>
              </div>

              {/* Calculator Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.items.map((item) => (
                  <Link key={item.route} href={item.route}>
                    <Card className={`bg-gradient-to-br ${cat.color} border ${cat.borderColor} hover:border-opacity-50 transition-all duration-200 cursor-pointer group hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                              {item.name}
                            </h3>
                            <p className="text-xs text-[#7a95b8] mt-1 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-0.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
      <PageInsights section="calculator-hub" />
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No calculators found</h3>
            <p className="text-[#7a95b8]">Try a different search term or clear filters</p>
            <button
              onClick={() => { setSearch(""); setActiveCategory(null); }}
              className="mt-4 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Footer Stats */}
        <div className="border-t border-[#1a3055] pt-8 mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-cyan-400">{TOTAL_CALCS}</div>
              <div className="text-xs text-slate-500 mt-1">Total Calculators</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{CATEGORIES.length}</div>
              <div className="text-xs text-slate-500 mt-1">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">50yr</div>
              <div className="text-xs text-slate-500 mt-1">Projection Range</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-400">IRS</div>
              <div className="text-xs text-slate-500 mt-1">Code Citations</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
