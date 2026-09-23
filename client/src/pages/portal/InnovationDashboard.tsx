// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Shield, TrendingUp, Calculator, Brain, Heart, FileText, Users, Building2, Scale, TreePine, BarChart3, Award, Globe, Search, Zap, Target, BookOpen, FileCheck, UserCheck, Coins, AlertTriangle, Clock, Rocket, ChevronRight, Sparkles, Activity, Layers, Icon} from 'lucide-react';
import { PageInsights } from "@/components/PageInsights";

interface ToolCard {
  id: string;
  name: string;
  description: string;
  route: string; // "" when the engine has no page yet (status "coming-soon")
  icon: React.ElementType;
  category: "compliance" | "analysis" | "planning" | "practice" | "client";
  patentId: string;
  patentScore: number;
  status: "active" | "beta" | "coming-soon";
  tier: 1 | 2 | 3;
}

const TOOLS: ToolCard[] = [
  { id: "si-001", name: "IUL Compliance Engine", description: "Dynamic illustration compliance checking against state-specific AG49 regulations with automated flagging", route: "", icon: Shield, category: "compliance", patentId: "SI-001", patentScore: 82, status: "coming-soon", tier: 1 },
  { id: "si-002", name: "Multi-Carrier IUL Optimizer", description: "Side-by-side carrier comparison with cap rates, participation rates, and projected cash value analysis", route: "/portal/carrier-comparison", icon: Layers, category: "analysis", patentId: "SI-002", patentScore: 88, status: "active", tier: 1 },
  { id: "si-003", name: "Policy Replacement Analyzer", description: "1035 exchange analysis with surrender charge impact, tax implications, and suitability scoring", route: "", icon: Scale, category: "analysis", patentId: "SI-003", patentScore: 85, status: "coming-soon", tier: 1 },
  { id: "si-004", name: "Premium Financing Arbitrage", description: "Spread analysis between loan rates and IUL crediting with collateral optimization", route: "/portal/premium-financing", icon: TrendingUp, category: "planning", patentId: "SI-004", patentScore: 78, status: "active", tier: 2 },
  { id: "si-005", name: "Living Benefits Probability", description: "Actuarial probability modeling for chronic, critical, and terminal illness rider utilization", route: "", icon: Heart, category: "analysis", patentId: "SI-005", patentScore: 80, status: "coming-soon", tier: 1 },
  { id: "si-006", name: "Tax Code Change Simulator", description: "Model impact of proposed tax legislation on client portfolios and IUL strategies", route: "", icon: FileText, category: "planning", patentId: "SI-006", patentScore: 72, status: "coming-soon", tier: 2 },
  { id: "si-007", name: "Behavioral Bias Detector", description: "Identify loss aversion, anchoring, recency bias and other cognitive biases in client decisions", route: "", icon: Brain, category: "client", patentId: "SI-007", patentScore: 75, status: "coming-soon", tier: 2 },
  { id: "si-008", name: "CRT Wealth Replacement", description: "Charitable Remainder Trust + IUL wealth replacement strategy calculator with tax optimization", route: "", icon: Calculator, category: "planning", patentId: "SI-008", patentScore: 83, status: "coming-soon", tier: 1 },
  { id: "si-009", name: "Social Security Bridge", description: "Optimize SS claiming age using IUL cash value as bridge income with breakeven analysis", route: "/portal/social-security", icon: Clock, category: "planning", patentId: "SI-009", patentScore: 86, status: "active", tier: 1 },
  { id: "si-010", name: "State Tax Migration Planner", description: "Compare state tax burdens and model savings from relocation across all 50 states", route: "", icon: Globe, category: "planning", patentId: "SI-010", patentScore: 74, status: "coming-soon", tier: 2 },
  { id: "si-011", name: "Captive Insurance + IUL", description: "Model captive insurance premium deductions flowing into IUL for business owners", route: "/portal/captive-insurance-planner", icon: Building2, category: "planning", patentId: "SI-011", patentScore: 80, status: "active", tier: 1 },
  { id: "si-012", name: "Divorce Financial Impact", description: "Model asset division, alimony, child support, and insurance policy splitting scenarios", route: "/portal/divorce-financial", icon: Scale, category: "client", patentId: "SI-012", patentScore: 77, status: "active", tier: 2 },
  { id: "si-013", name: "Disability Gap Analysis", description: "Calculate income replacement gaps and recommend supplemental disability coverage", route: "/portal/disability-gap-analyzer", icon: AlertTriangle, category: "client", patentId: "SI-013", patentScore: 75, status: "active", tier: 2 },
  { id: "si-014", name: "Family Tree Financial Map", description: "Multi-generational wealth mapping with estate flow visualization and planning", route: "", icon: TreePine, category: "planning", patentId: "SI-014", patentScore: 72, status: "coming-soon", tier: 2 },
  { id: "si-015", name: "Generational Wealth Sim", description: "Dynasty trust + IUL simulation across 3 generations with estate tax optimization", route: "/portal/multi-gen-wealth", icon: Users, category: "planning", patentId: "SI-015", patentScore: 80, status: "active", tier: 1 },
  { id: "si-016", name: "Carrier Strength Monitor", description: "Real-time carrier financial ratings, claims-paying ability, and risk assessment", route: "/portal/carrier-ratings", icon: Activity, category: "compliance", patentId: "SI-016", patentScore: 76, status: "active", tier: 2 },
  { id: "si-017", name: "Succession Valuation", description: "Practice valuation using revenue multiples, DCF, and comparable sales analysis", route: "/portal/practice-valuation", icon: Award, category: "practice", patentId: "SI-017", patentScore: 79, status: "active", tier: 2 },
  { id: "si-018", name: "Commission Optimizer", description: "Route product placements to maximize advisor compensation while maintaining suitability", route: "", icon: Coins, category: "practice", patentId: "SI-018", patentScore: 75, status: "coming-soon", tier: 2 },
  { id: "si-019", name: "Peer Benchmarking Intel", description: "Compare your practice metrics against industry benchmarks and top performers", route: "", icon: BarChart3, category: "practice", patentId: "SI-019", patentScore: 74, status: "coming-soon", tier: 2 },
  { id: "si-020", name: "CE Credit Tracker", description: "Track continuing education requirements by state with renewal deadline alerts", route: "/portal/certifications", icon: BookOpen, category: "compliance", patentId: "SI-020", patentScore: 73, status: "active", tier: 3 },
  { id: "si-021", name: "Compliance Doc Generator", description: "Auto-generate suitability letters, needs analyses, and compliance documentation", route: "/portal/compliance-reports", icon: FileCheck, category: "compliance", patentId: "SI-021", patentScore: 77, status: "active", tier: 2 },
  { id: "si-022", name: "Client Retention Predictor", description: "ML-powered churn prediction with proactive intervention recommendations", route: "", icon: UserCheck, category: "client", patentId: "SI-022", patentScore: 74, status: "coming-soon", tier: 2 },
  { id: "si-023", name: "Prospect Qualification", description: "Score and rank prospects by conversion probability and lifetime value potential", route: "", icon: Target, category: "practice", patentId: "SI-023", patentScore: 76, status: "coming-soon", tier: 2 },
  { id: "si-024", name: "Multi-Currency Wealth", description: "Cross-border wealth optimization for clients with international assets", route: "", icon: Globe, category: "planning", patentId: "SI-024", patentScore: 72, status: "coming-soon", tier: 3 },
  { id: "si-025", name: "Annuity Hidden Fee Detector", description: "Dissect annuity contracts to reveal M&E charges, fund expenses, and surrender penalties", route: "/portal/fee-transparency", icon: Search, category: "analysis", patentId: "SI-025", patentScore: 70, status: "active", tier: 3 },
  { id: "si-026", name: "Client Onboarding Workflow", description: "Automated onboarding pipeline with document collection, KYC, and suitability assessment", route: "/portal/client-onboarding-auto", icon: Rocket, category: "practice", patentId: "SI-026", patentScore: 70, status: "active", tier: 3 },
  { id: "si-027", name: "Retirement Gap Calculator", description: "Inflation-adjusted retirement income gap analysis with IUL distribution modeling", route: "/portal/income-gap", icon: Calculator, category: "planning", patentId: "SI-027", patentScore: 68, status: "active", tier: 3 },
];

const CATEGORIES = [
  { key: "all", label: "All Tools", icon: Sparkles },
  { key: "compliance", label: "Compliance", icon: Shield },
  { key: "analysis", label: "Analysis", icon: BarChart3 },
  { key: "planning", label: "Planning", icon: TrendingUp },
  { key: "practice", label: "Practice Mgmt", icon: Building2 },
  { key: "client", label: "Client Tools", icon: Users },
] as const;

export default function InnovationDashboard() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredTools = useMemo(() => {
    return TOOLS.filter(tool => {
      const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
      const matchesSearch = !searchQuery || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.patentId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => b.patentScore - a.patentScore);
  }, [activeCategory, searchQuery]);

  const stats = useMemo(() => ({
    total: TOOLS.length,
    active: TOOLS.filter(t => t.status === "active").length,
    tier1: TOOLS.filter(t => t.tier === 1).length,
    avgScore: Math.round(TOOLS.reduce((s, t) => s + t.patentScore, 0) / TOOLS.length),
  }), []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "beta": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default: return "bg-slate-500/20 text-[#7a95b8] border-slate-500/30";
    }
  };

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 1: return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-0 text-[10px] px-1.5">Crown Jewel</Badge>;
      case 2: return <Badge className="bg-gradient-to-r from-slate-400 to-slate-300 text-black border-0 text-[10px] px-1.5">High Value</Badge>;
      default: return <Badge className="bg-slate-600/50 text-[#94a3b8] border-0 text-[10px] px-1.5">Emerging</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 75) return "text-amber-400";
    return "text-[#7a95b8]";
  };

  return (
    <AppShell title="Innovation Dashboard" subtitle="27 proprietary financial engines — patent claims drafted, none yet filed">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{stats.total}</p>
            <p className="text-xs text-[#7a95b8] mt-1">Total Engines</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.active}</p>
            <p className="text-xs text-[#7a95b8] mt-1">Active & Live</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{stats.tier1}</p>
            <p className="text-xs text-[#7a95b8] mt-1">Crown Jewels</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-indigo-400">{stats.avgScore}</p>
            <p className="text-xs text-[#7a95b8] mt-1">Avg Novelty Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search engines by name, description, or invention ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0d1526]/50 border-[#1e3a5f]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.key}
              variant={activeCategory === cat.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.key)}
              className={activeCategory === cat.key 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "border-[#1e3a5f] text-[#7a95b8] hover:text-white hover:border-slate-500 bg-transparent"}
            >
              <cat.icon className="w-3.5 h-3.5 mr-1.5" />
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">
        Showing {filteredTools.length} of {TOOLS.length} engines
        {activeCategory !== "all" && ` in ${CATEGORIES.find(c => c.key === activeCategory)?.label}`}
      </p>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map(tool => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              className="bg-[#0d1526]/40 border-[#1e3a5f]/50 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-emerald-500/5"
              onClick={() => { if (tool.route) navigate(tool.route); }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {tool.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono">{tool.patentId}</span>
                        {getTierBadge(tool.tier)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${getScoreColor(tool.patentScore)}`}>
                      {tool.patentScore}
                    </span>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-[#7a95b8] leading-relaxed mb-3">
                  {tool.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(tool.status)} text-[10px]`}>
                    {tool.status === "active" ? "● Live" : tool.status === "beta" ? "◐ Beta" : "○ Soon"}
                  </Badge>
                  {tool.route ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs px-2 h-7"
                  >
                    Launch <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                  ) : (
                    <span className="text-[10px] text-slate-500">No page yet</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      <PageInsights section="innovation-dashboard" />
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-[#7a95b8] text-lg">No engines match your search</p>
          <p className="text-slate-500 text-sm mt-1">Try a different keyword or category</p>
        </div>
      )}

      {/* Portfolio Summary */}
      <Card className="mt-8 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-[#1e3a5f]/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Invention Portfolio Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-400">27</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Proprietary Engines</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">15</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Core Claims Drafted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">258</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Claims</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-400">$50M+</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Portfolio Value</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-400">42</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Inventions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
