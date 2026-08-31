import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import {
  Stethoscope, Brain, Calculator, Shield, DollarSign, TrendingUp,
  ChevronRight, ChevronDown, Zap, Target, Lock, Home as HomeIcon,
  Scissors, BarChart3, Landmark, ArrowRight, CheckCircle2, AlertTriangle,
  Sparkles, Crown, Eye
} from "lucide-react";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

/* ─── Data ─────────────────────────────────────────────────────── */

interface CalculatorModule {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  portalLink?: string;
  highlights: string[];
}

const CALCULATOR_MODULES: CalculatorModule[] = [
  {
    id: "zero-roth",
    name: "Zero-Percent Roth Conversion",
    tagline: "Convert $2M+ to Roth — Pay $0 in Tax",
    description: "The 248-calculator brain sequences IUL cash value loans against Roth conversion income, creating a zero-tax corridor that traditional advisors say is impossible. For physicians with $500K–$2M in traditional IRAs, this module shows the exact year-by-year conversion schedule.",
    icon: Landmark,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    portalLink: "/portal/roth-conversion",
    highlights: [
      "Year-by-year conversion schedule with zero tax liability",
      "IUL cash value loan offset against conversion income",
      "Works for $500K–$2M+ traditional IRA balances",
      "IRC §72(e) tax-free loan provisions applied automatically"
    ]
  },
  {
    id: "mortgage-killer",
    name: "Mortgage Killer V3",
    tagline: "Eliminate Your Mortgage in 7–12 Years",
    description: "Physicians carry $800K–$2M mortgages. This module shows how HELOC-to-IUL arbitrage eliminates the mortgage while simultaneously building a tax-free retirement fund. The waterfall engine calculates exact monthly cash flows.",
    icon: HomeIcon,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    portalLink: "/portal/mortgage-killer-v3",
    highlights: [
      "HELOC-to-IUL arbitrage with exact monthly cash flows",
      "Eliminates $800K–$2M mortgages in 7–12 years",
      "Simultaneously builds tax-free retirement fund",
      "50-year waterfall projection engine"
    ]
  },
  {
    id: "divorce-protection",
    name: "Divorce Asset Protection",
    tagline: "Shield 60–80% of Wealth from Division",
    description: "With physician divorce rates exceeding 24%, asset protection isn't optional. This module calculates how IUL + ILIT + fixed annuity structures create creditor-protected wealth that survives equitable distribution proceedings.",
    icon: Scissors,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    portalLink: "/portal/divorce-calculator",
    highlights: [
      "IRS Code §72(e) and IRC §101(a) protection structures",
      "IUL + ILIT + Fixed Annuity triple-layer shield",
      "Side-by-side protected vs. unprotected comparison",
      "50-year projection with conservative/moderate/aggressive scenarios"
    ]
  },
  {
    id: "tax-waterfall",
    name: "Tax Waterfall Engine",
    tagline: "Visualize Every Dollar's Tax Journey",
    description: "Physicians in the 37%+ bracket lose more to taxes than any other profession. The cascading waterfall shows exactly where each dollar goes — federal, state, FICA, NIIT, AMT — and how to redirect those flows into tax-free vehicles.",
    icon: BarChart3,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    portalLink: "/portal/tax-waterfall",
    highlights: [
      "Federal + State + FICA + NIIT + AMT breakdown",
      "Visual cascade showing exact dollar flows",
      "Before/after comparison with IUL optimization",
      "Customizable for any state tax jurisdiction"
    ]
  },
  {
    id: "estate-planning",
    name: "Estate & Trust Structures",
    tagline: "Transfer $10M+ Tax-Free Across Generations",
    description: "For physicians with $5M+ estates, the ILIT and dynasty trust modules calculate exact premium structures, death benefit leveraging, and generation-skipping transfer strategies that preserve wealth across 3+ generations.",
    icon: Crown,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    portalLink: "/portal/trusts",
    highlights: [
      "ILIT premium financing with exact cost analysis",
      "Dynasty trust structures for 3+ generations",
      "Generation-skipping transfer tax optimization",
      "Death benefit leverage ratios by age and health class"
    ]
  },
  {
    id: "income-replacement",
    name: "Guaranteed Income Floor",
    tagline: "Replace $30K–$50K/Month — Tax-Free",
    description: "When physicians retire, they need $30K–$50K/month to maintain lifestyle. This module builds a guaranteed income floor using fixed indexed annuities with income riders, layered with IUL tax-free distributions.",
    icon: Shield,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    portalLink: "/portal/lifetime-income",
    highlights: [
      "Guaranteed income floor of $30K–$50K/month",
      "Fixed indexed annuity + IUL distribution layering",
      "Zero market risk on guaranteed portion",
      "Tax-free income via IUL loan provisions"
    ]
  },
];

const INCOME_TIERS = [
  { range: "$350K – $500K", label: "Early Career Specialist", strategies: 4, savings: "$1.2M – $3.5M", color: "bg-cyan-500" },
  { range: "$500K – $750K", label: "Mid-Career Surgeon/Specialist", strategies: 6, savings: "$3.5M – $8M", color: "bg-violet-500" },
  { range: "$750K – $1.5M", label: "Practice Owner / Partner", strategies: 8, savings: "$8M – $18M", color: "bg-amber-500" },
  { range: "$1.5M – $2M+", label: "Multi-Practice / Executive", strategies: 10, savings: "$18M – $40M+", color: "bg-emerald-500" },
];

const PAIN_POINTS = [
  { stat: "37%+", label: "Federal Tax Bracket", desc: "Physicians lose more to taxes than any other profession" },
  { stat: "24%", label: "Divorce Rate", desc: "Nearly 1 in 4 physician marriages end in divorce" },
  { stat: "$250K+", label: "Avg Student Debt", desc: "Medical school debt delays wealth building by 10+ years" },
  { stat: "62%", label: "Burnout Rate", desc: "Most physicians can't afford to retire when they want to" },
];

/* ─── Component ────────────────────────────────────────────────── */

export default function PhysiciansEdge() {
  const { user } = useAuth();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  return (
    <AppShell title="The Physician's Edge" subtitle="248-Calculator Brain × Physician-Grade Wealth Engineering">
      {/* ── Hero Section ──────────────────────────────────────── */}
      <div className="rc-page-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30">
            <Stethoscope className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">The Physician's Edge</h1>
            <p className="text-sm text-muted-foreground">Aggressive Wealth Engineering for $350K–$2M+ Earners</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-3 max-w-3xl leading-relaxed">
          You didn't spend 12+ years in training to hand 37% of every dollar to the IRS. The Russell Capital Systems™ 
          248-calculator brain was engineered specifically for physicians — the highest-taxed, most divorce-vulnerable, 
          most financially underserved professionals in America. This isn't a generic financial plan. This is a 
          <span className="text-violet-400 font-semibold"> weaponized tax elimination system</span>.
        </p>
      </div>

      {/* ── Pain Points Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {PAIN_POINTS.map((p, i) => (
          <div key={i} className="rc-card p-4 text-center border border-red-500/20 bg-red-500/5">
            <div className="text-2xl font-bold text-red-400 mb-1">{p.stat}</div>
            <div className="text-xs font-semibold text-white mb-1">{p.label}</div>
            <div className="text-xs text-muted-foreground">{p.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Income Tier Selector ─────────────────────────────── */}
      <div className="rc-card p-6 mb-8 border border-violet-500/20">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-400" />
          Select Your Income Tier
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          The 248-calculator brain adapts its strategy recommendations based on your income level and practice structure.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {INCOME_TIERS.map((tier, i) => (
            <button
              key={i}
              onClick={() => setSelectedTier(selectedTier === i ? null : i)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedTier === i
                  ? "border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/30"
                  : "border-border/50 bg-card/50 hover:border-violet-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                <span className="text-sm font-bold text-white">{tier.range}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{tier.label}</div>
              <div className="flex justify-between text-xs">
                <span className="text-violet-400">{tier.strategies} strategies</span>
                <span className="text-emerald-400">{tier.savings} saved</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Calculator Modules ───────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          Core Calculator Modules
        </h2>
        <div className="space-y-3">
          {CALCULATOR_MODULES.map((mod) => (
            <div key={mod.id} className={`rc-card border ${mod.borderColor} overflow-hidden`}>
              <button
                onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className={`p-3 rounded-xl ${mod.bgColor} border ${mod.borderColor} shrink-0`}>
                  <mod.icon className={`w-6 h-6 ${mod.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-white">{mod.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{mod.tagline}</p>
                </div>
                {expandedModule === mod.id ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {expandedModule === mod.id && (
                <div className="px-5 pb-5 border-t border-border/30">
                  <p className="text-sm text-muted-foreground mt-4 mb-4 leading-relaxed">{mod.description}</p>
                  <div className="space-y-2 mb-4">
                    {mod.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${mod.color} mt-0.5 shrink-0`} />
                        <span className="text-sm text-white/80">{h}</span>
                      </div>
                    ))}
                  </div>
                  {mod.portalLink && (
                    <Link href={mod.portalLink}>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                        Launch Calculator <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── The 248-Calculator Brain ─────────────────────────── */}
      <div className="rc-card p-6 mb-8 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-violet-500/5">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          The 248-Calculator Brain
        </h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Unlike single-purpose financial calculators, the Russell Capital Systems™ engine runs 248 interconnected 
          calculations simultaneously. When you adjust one variable — say, increasing your IUL premium by $500/month — 
          the brain recalculates your Roth conversion schedule, mortgage payoff timeline, divorce protection ratio, 
          estate transfer efficiency, and retirement income floor in real time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card/50 border border-border/30">
            <div className="text-2xl font-bold text-cyan-400 mb-1">248</div>
            <div className="text-xs font-semibold text-white">Simultaneous Calculations</div>
            <div className="text-xs text-muted-foreground mt-1">Every variable change cascades across the entire engine</div>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border/30">
            <div className="text-2xl font-bold text-violet-400 mb-1">50 Years</div>
            <div className="text-xs font-semibold text-white">Projection Horizon</div>
            <div className="text-xs text-muted-foreground mt-1">Conservative, moderate, and aggressive scenarios</div>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border/30">
            <div className="text-2xl font-bold text-emerald-400 mb-1">8 Patents</div>
            <div className="text-xs font-semibold text-white">Filed with USPTO</div>
            <div className="text-xs text-muted-foreground mt-1">47 claims protecting the cascading calculation engine</div>
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <div className="rc-card p-6 mb-8 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-violet-500/10 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Ready to See Your Numbers?</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
          Select any calculator module above to run your personalized projections. The 248-calculator brain 
          will show you exactly how much wealth you're leaving on the table.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/portal/roth-conversion">
            <button className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Start with Roth Conversion
            </button>
          </Link>
          <Link href="/portal/divorce-calculator">
            <button className="px-5 py-2.5 rounded-lg border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/10 transition-colors">
              Divorce Protection Analysis
            </button>
          </Link>
          <Link href="/portal/mortgage-killer-v3">
            <button className="px-5 py-2.5 rounded-lg border border-teal-500/30 text-teal-400 text-sm font-medium hover:bg-teal-500/10 transition-colors">
              Mortgage Killer V3
            </button>
          </Link>
        </div>
      </div>

      <NAICDisclaimer />
    </AppShell>
  );
}
