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
      { name: "PSLF Calculator", route: "/portal/pslf-calculator", description: "Public Service Loan Forgiveness eligibility, qualifying payments, projected tax-free forgiveness for physicians at nonprofit hospitals, VA, and academic centers." },
      { name: "IDR Plan Comparison", route: "/portal/idr-comparison", description: "Side-by-side comparison of SAVE, PAYE, REPAYE, IBR, and Standard repayment plans with income growth modeling from residency through attending." },
      { name: "Own-Occupation Disability", route: "/portal/own-occ-disability", description: "Specialty-specific disability insurance analysis with own-occ vs any-occ coverage gaps, premium-to-benefit ratios for surgeons and proceduralists." },
      { name: "Contract Negotiation Analyzer", route: "/portal/physician-contract", description: "Evaluate physician employment contracts: base salary, wRVU bonuses, signing bonuses, tail coverage, non-compete clauses, and total compensation." },
      { name: "Residency-to-Attending Pipeline", route: "/portal/residency-to-attending", description: "Complete physician financial lifecycle from med school through retirement: net worth trajectory, loan strategy, Roth windows, and attending transition." },
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
      { name: "RMD Calculator", route: "/portal/rmd-calculator", description: "Calculate forced taxable distributions from IRAs/401ks — shows how IUL avoids RMDs entirely" },
      { name: "Marginal Tax Rate", route: "/portal/marginal-tax-rate", description: "Visualize exact tax brackets — shows where IUL income avoids pushing into higher brackets" },
      { name: "Capital Gains Tax", route: "/portal/capital-gains-tax", description: "Calculate short-term vs long-term capital gains tax impact on investment returns" },
      { name: "AMT Calculator", route: "/portal/amt-calculator", description: "Alternative Minimum Tax exposure calculator with phase-out modeling" },
      { name: "Self-Employment Tax", route: "/portal/self-employment-tax", description: "Calculate SE tax burden and model entity structure optimization" },
      { name: "Tax-Equivalent Yield", route: "/portal/tax-equivalent-yield", description: "Compare municipal bond yields to taxable equivalents across brackets" },
      { name: "W-4 Optimizer", route: "/portal/w4-optimizer", description: "Optimize federal withholding to minimize tax liability and maximize cash flow" },
      { name: "Crypto Tax", route: "/portal/crypto-tax", description: "Calculate cryptocurrency tax obligations including mining, staking, and DeFi" },
      { name: "RSU Tax", route: "/portal/rsu-tax", description: "Model restricted stock unit vesting schedules and tax optimization strategies" },
      { name: "Deduction Optimizer", route: "/portal/deduction-optimizer", description: "Maximize deductions by comparing standard vs itemized with bunching strategies" },
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
      { name: "FIRE Calculator", route: "/portal/fire-calculator", description: "Financial Independence, Retire Early — model your path to freedom" },
      { name: "Safe Withdrawal Rate", route: "/portal/safe-withdrawal-rate", description: "Dynamic withdrawal rate modeling with Monte Carlo simulation" },
      { name: "Pension vs Lump Sum", route: "/portal/pension-vs-lump-sum", description: "Compare pension annuity vs lump sum rollover with breakeven analysis" },
      { name: "QLAC Calculator", route: "/portal/qlac-calculator", description: "Qualified Longevity Annuity Contract analysis for RMD reduction" },
      { name: "Retirement Healthcare", route: "/portal/retirement-healthcare", description: "Project healthcare costs from early retirement through Medicare" },
      { name: "Medicare IRMAA", route: "/portal/medicare-irmaa-calc", description: "Income-Related Monthly Adjustment Amount surcharge calculator" },
      { name: "Spousal SS Coordination", route: "/portal/spousal-ss-coordination", description: "Optimize Social Security claiming strategies for married couples" },
      { name: "DCA vs Lump Sum", route: "/portal/dca-vs-lump-sum", description: "Dollar-cost averaging vs lump sum investing comparison" },
      { name: "Retirement Budget", route: "/portal/retirement-budget", description: "Build a detailed retirement spending plan with inflation adjustments" },
      { name: "Inflation-Adjusted Income", route: "/portal/inflation-adjusted-income", description: "Model purchasing power erosion and income needs over 50 years" },
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
      { name: "Life Insurance Needs", route: "/portal/life-insurance-needs", description: "Calculate optimal coverage based on income replacement and obligations" },
      { name: "Disability Insurance", route: "/portal/disability-insurance-needs", description: "Model income protection needs and policy comparison" },
      { name: "Long-Term Care Cost", route: "/portal/ltc-cost", description: "Project LTC costs by state with inflation and coverage gap analysis" },
      { name: "Umbrella Insurance", route: "/portal/umbrella-insurance", description: "Assess liability exposure and optimal umbrella coverage levels" },
      { name: "Term vs Whole vs IUL", route: "/portal/term-vs-whole-vs-iul", description: "Side-by-side comparison of life insurance types with cash value modeling" },
      { name: "Key Person Insurance", route: "/portal/key-person-insurance", description: "Calculate key employee coverage needs for business continuity" },
      { name: "Buy-Sell Funding", route: "/portal/buy-sell-funding", description: "Model buy-sell agreement funding strategies and insurance needs" },
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
      { name: "CRT Calculator", route: "/portal/crt-calculator", description: "Charitable Remainder Trust income and tax deduction modeling" },
      { name: "GRAT Calculator", route: "/portal/grat-calculator", description: "Grantor Retained Annuity Trust wealth transfer optimization" },
      { name: "ILIT Calculator", route: "/portal/ilit-calculator", description: "Irrevocable Life Insurance Trust estate tax elimination modeling" },
      { name: "QPRT Calculator", route: "/portal/qprt-calculator", description: "Qualified Personal Residence Trust gift tax savings calculator" },
      { name: "GSTT Calculator", route: "/portal/gstt-calculator", description: "Generation-Skipping Transfer Tax planning and exemption modeling" },
      { name: "DAF vs Direct Giving", route: "/portal/daf-vs-direct-giving", description: "Donor-Advised Fund vs direct charitable giving comparison" },
      { name: "Estate Liquidity", route: "/portal/estate-liquidity", description: "Assess estate liquidity needs and funding gap analysis" },
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
      { name: "Net Worth Tracker", route: "/portal/net-worth-tracker", description: "Track and project net worth growth across all asset classes" },
      { name: "Compound Interest", route: "/portal/compound-interest", description: "Visualize the power of compounding over 50 years" },
      { name: "Millionaire Calculator", route: "/portal/millionaire-calculator", description: "Model your path to $1M, $5M, $10M+ with various strategies" },
      { name: "Emergency Fund vs IUL", route: "/portal/emergency-fund-vs-iul", description: "Compare traditional emergency fund vs IUL cash value access" },
      { name: "529 vs IUL", route: "/portal/529-vs-iul", description: "Education funding comparison — 529 plan vs IUL flexibility" },
      { name: "Debt Payoff Optimizer", route: "/portal/debt-payoff-optimizer", description: "Avalanche vs snowball vs hybrid debt elimination strategies" },
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
      { name: "Rental Property ROI", route: "/portal/rental-property-roi", description: "Calculate cash-on-cash return, cap rate, and total ROI for rentals" },
      { name: "1031 Exchange", route: "/portal/1031-exchange", description: "Model tax-deferred property exchanges with timeline and basis tracking" },
      { name: "Opportunity Zone", route: "/portal/opportunity-zone", description: "Calculate tax benefits of Qualified Opportunity Zone investments" },
      { name: "Home Affordability", route: "/portal/home-affordability", description: "Determine maximum home price based on income, debt, and down payment" },
      { name: "Refinance Break-Even", route: "/portal/refinance-break-even", description: "Calculate when refinancing pays for itself with rate comparison" },
      { name: "Cost of Living", route: "/portal/cost-of-living", description: "Compare cost of living between cities for relocation planning" },
      { name: "Reverse Mortgage", route: "/portal/reverse-mortgage", description: "Model HECM reverse mortgage proceeds and equity impact" },
      { name: "Depreciation Tax Shield", route: "/portal/depreciation-tax-shield", description: "Calculate real estate depreciation deductions and tax savings" },
      { name: "Property Tax Appeal", route: "/portal/property-tax-appeal", description: "Estimate savings from property tax assessment appeals" },
      { name: "Vacation Rental", route: "/portal/vacation-rental", description: "Model vacation rental income with seasonality and expenses" },
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
      { name: "Business Valuation", route: "/portal/business-valuation", description: "Estimate business value using DCF, multiples, and asset-based methods" },
      { name: "Cash Balance Plan", route: "/portal/cash-balance-plan", description: "Model defined benefit plan contributions and tax savings" },
      { name: "Entity Comparison", route: "/portal/entity-comparison", description: "S-Corp vs LLC vs C-Corp tax comparison with pass-through analysis" },
      { name: "QBI Calculator", route: "/portal/qbi-calculator", description: "Qualified Business Income deduction (Section 199A) calculator" },
      { name: "Deferred Compensation", route: "/portal/deferred-compensation", description: "Executive deferred compensation plan modeling and tax analysis" },
      { name: "Captive Insurance", route: "/portal/captive-insurance", description: "Captive insurance premium calculator with tax benefit modeling" },
      { name: "Succession Plan", route: "/portal/succession-plan", description: "Business succession timeline and valuation transition modeling" },
      { name: "ESOP Calculator", route: "/portal/esop-calculator", description: "Employee Stock Ownership Plan tax benefits and funding analysis" },
      { name: "Severance Calculator", route: "/portal/severance-calculator", description: "Golden parachute and severance package tax optimization" },
      { name: "Overhead Expense", route: "/portal/overhead-expense", description: "Business overhead expense insurance needs calculator" },
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
      { name: "Asset Allocation", route: "/portal/asset-allocation", description: "Model optimal portfolio allocation with rebalancing strategies" },
      { name: "Private Equity IRR", route: "/portal/pe-irr-calculator", description: "Calculate internal rate of return for PE and venture investments" },
      { name: "Bond Ladder", route: "/portal/bond-ladder", description: "Build and analyze bond ladder strategies for income and duration" },
      { name: "Muni Bond Ladder", route: "/portal/muni-bond-ladder", description: "Municipal bond ladder strategy with tax-equivalent yield analysis" },
      { name: "DRIP Growth", route: "/portal/drip-growth", description: "Dividend reinvestment plan growth projection over 50 years" },
      { name: "Options Profit/Loss", route: "/portal/options-profit-loss", description: "Options strategy P&L calculator with Greeks and breakeven" },
      { name: "Portfolio Risk/Return", route: "/portal/portfolio-risk-return", description: "Analyze portfolio risk-adjusted returns with Sharpe and Sortino ratios" },
      { name: "Sector Rotation", route: "/portal/sector-rotation", description: "Sector rotation and market timing backtester with historical data" },
      { name: "Fee Impact", route: "/portal/fee-impact", description: "Calculate the long-term impact of investment fees on returns" },
      { name: "Tax-Loss Harvesting", route: "/portal/tax-loss-harvest-calc", description: "Identify tax-loss harvesting opportunities in your portfolio" },
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
      { name: "50/30/20 Budget", route: "/portal/budget-50-30-20", description: "Apply the 50/30/20 rule to your income for balanced budgeting" },
      { name: "Zero-Based Budget", route: "/portal/zero-based-budget", description: "Allocate every dollar with zero-based budgeting methodology" },
      { name: "Spend vs Invest", route: "/portal/spend-vs-invest", description: "Calculate the true cost of spending vs investing any amount" },
      { name: "Lease vs Buy", route: "/portal/lease-vs-buy", description: "Car lease vs buy comparison with total cost of ownership" },
      { name: "Student Loan vs Invest", route: "/portal/student-loan-vs-invest", description: "Should you pay off student loans or invest? Break-even analysis" },
      { name: "Credit Card Payoff", route: "/portal/credit-card-payoff", description: "Calculate payoff timeline and interest savings with extra payments" },
      { name: "Savings Rate Impact", route: "/portal/savings-rate-impact", description: "See how increasing your savings rate accelerates financial freedom" },
      { name: "Cost of Waiting", route: "/portal/cost-of-waiting", description: "Visualize the massive cost of delaying investment by even 1 year" },
      { name: "Lifestyle Inflation", route: "/portal/lifestyle-inflation", description: "Model how lifestyle creep erodes wealth-building potential" },
      { name: "Financial Freedom #", route: "/portal/financial-freedom-number", description: "Calculate your personal financial freedom number and timeline" },
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
      { name: "Mega Backdoor Roth", route: "/portal/mega-backdoor-roth", description: "Model after-tax 401k to Roth conversion for $69K+ annual contributions" },
      { name: "Backdoor Roth", route: "/portal/backdoor-roth", description: "Backdoor Roth IRA conversion calculator with pro-rata rule analysis" },
      { name: "Roth vs Traditional", route: "/portal/roth-vs-traditional", description: "Comprehensive Roth vs Traditional IRA/401k comparison over 50 years" },
      { name: "NUA Calculator", route: "/portal/nua-calculator", description: "Net Unrealized Appreciation strategy for employer stock in 401k" },
      { name: "Charitable Stock", route: "/portal/charitable-stock-donation", description: "Calculate tax savings from donating appreciated stock vs cash" },
      { name: "Installment Sale", route: "/portal/installment-sale", description: "Model installment sale tax deferral with interest income analysis" },
      { name: "Like-Kind Exchange", route: "/portal/like-kind-exchange", description: "Like-kind exchange basis calculator for investment property swaps" },
      { name: "Gain/Loss Harvesting", route: "/portal/gain-loss-harvesting", description: "Tax gain/loss harvesting pair finder for portfolio optimization" },
      { name: "State Tax Arbitrage", route: "/portal/state-tax-arbitrage", description: "Calculate savings from relocating to lower-tax states" },
      { name: "Income Shifting", route: "/portal/income-shifting", description: "Family income shifting and tax planning optimization strategies" },
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
      { name: "Special Needs Trust", route: "/portal/special-needs-trust", description: "Special needs trust funding calculator preserving benefits eligibility" },
      { name: "Divorce Settlement", route: "/portal/divorce-settlement-enhanced", description: "Enhanced divorce financial settlement analyzer with asset protection" },
      { name: "Alimony Tax Impact", route: "/portal/alimony-tax-impact", description: "Alimony and child support tax impact calculator" },
      { name: "Windfall Management", route: "/portal/windfall-management", description: "Optimize sudden wealth events — inheritance, lottery, IPO, sale" },
      { name: "Sabbatical Planner", route: "/portal/sabbatical-planner", description: "Career break financial planner with runway and re-entry modeling" },
      { name: "ACA Subsidy", route: "/portal/aca-subsidy", description: "Healthcare marketplace subsidy calculator with income optimization" },
      { name: "HSA Triple Tax", route: "/portal/hsa-triple-tax", description: "HSA triple tax advantage calculator — deduction, growth, withdrawal" },
      { name: "Pension Max", route: "/portal/pension-max", description: "Pension maximization with life insurance replacement strategy" },
      { name: "Annuity Comparison", route: "/portal/annuity-comparison", description: "Compare fixed, variable, and indexed annuity products side-by-side" },
      { name: "Financial Health Score", route: "/portal/financial-health-score", description: "Comprehensive financial health dashboard with scoring and recommendations" },
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
