import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import {
  Stethoscope, Brain, Calculator, Shield, DollarSign, TrendingUp,
  ChevronRight, ChevronDown, Zap, Target, Lock, Home as HomeIcon,
  Scissors, BarChart3, Landmark, ArrowRight, CheckCircle2, AlertTriangle,
  Sparkles, Crown, Eye
} from "lucide-react";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { techStatusLabel, statusSentence } from "@shared/patentStatus";
import { TAX_RULES_2026 } from "@shared/taxRules";
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
    name: "Roth Conversion Tax Offset",
    tagline: "Model a Large Roth Conversion — and What Could Offset Its Tax",
    description: "The engine sequences a Roth conversion year by year against deductions and credits you may qualify for (depreciation, oil and gas intangible drilling costs, charitable gifts), based on your facts. A conversion is taxable income in the year it happens; a policy loan is not a deduction and does not offset it. For physicians with $500K–$2M in traditional IRAs, this module shows a hypothetical conversion schedule for your CPA to review.",
    icon: Landmark,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    portalLink: "/portal/roth-conversion",
    highlights: [
      "Year-by-year hypothetical conversion schedule, with the tax shown each year",
      "Deductions and credits that may offset part of the conversion income (IRC §§ 168, 263(c), 170)",
      "Works for $500K–$2M+ traditional IRA balances",
      "Qualified Roth withdrawals later are tax-free (IRC § 408A(d)); every item needs CPA review"
    ]
  },
  {
    id: "mortgage-killer",
    name: "Mortgage Killer V3",
    tagline: "Model an Earlier Mortgage Payoff, Based on Your Facts",
    description: "Physicians often carry $800K–$2M mortgages. This module models borrowing against home equity to fund an indexed universal life (IUL) insurance policy, then using policy loans to pay the mortgage down, and shows the hypothetical monthly cash flows at the rates you set. Policy charges, loan interest and the HELOC rate can make the strategy cost more than it saves.",
    icon: HomeIcon,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    portalLink: "/portal/mortgage-killer-v3",
    highlights: [
      "HELOC-to-IUL life insurance strategy with hypothetical monthly cash flows",
      "Shows a modeled payoff year for your mortgage, not a promise",
      "Builds life insurance cash value that may later supplement retirement income",
      "50-year waterfall projection engine"
    ]
  },
  {
    id: "divorce-protection",
    name: "Divorce Asset Protection",
    tagline: "See What Your State's Rules May Protect — and What They May Not",
    description: "This module models how an irrevocable life insurance trust (ILIT), an IUL life insurance policy and a fixed annuity are treated under your state's divorce and creditor rules. North Carolina is an equitable-distribution state: cash value built during the marriage is generally marital property. Planning must happen before any claim arises, and every result needs a licensed attorney's review.",
    icon: Scissors,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    portalLink: "/portal/divorce-calculator",
    highlights: [
      "State exemption rules for cash value and annuities, side by side",
      "ILIT + IUL life insurance + fixed annuity structures modeled together",
      "Side-by-side protected vs. unprotected comparison",
      "50-year projection with conservative/moderate/aggressive scenarios"
    ]
  },
  {
    id: "tax-waterfall",
    name: "Tax Waterfall Engine",
    tagline: "Visualize Every Dollar's Tax Journey",
    description: "Physicians in the 37% bracket pay federal, state, FICA and NIIT on the same dollars. The cascading waterfall shows where each dollar goes — federal, state, FICA, NIIT, AMT — and models redirecting flows into tax-advantaged options, each with the conditions that make it so.",
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
    tagline: "Model Transfers of $10M+ Across Generations",
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
    name: "Lifetime Income Floor",
    tagline: "Model an Income Floor Sized to Your Expenses",
    description: "Many retired physicians want $30K–$50K/month to maintain their lifestyle. This module models an income floor from fixed indexed annuities with income riders (income the contract pays once elected, subject to the insurer's claims-paying ability), layered with IUL life insurance policy loans. Annuity income is generally taxable; loans from a non-MEC policy kept in force generally are not.",
    icon: Shield,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    portalLink: "/portal/lifetime-income",
    highlights: [
      "Income floor sized to the monthly figure you enter (hypothetical)",
      "Fixed indexed annuity + IUL life insurance loan layering",
      "No index exposure on the rider's contractual income, subject to the insurer's claims-paying ability",
      "Policy loans generally not taxable if the policy is not a MEC and stays in force; a lapse with a loan can be taxable"
    ]
  },
];

const INCOME_TIERS = [
  { range: "$350K – $500K", label: "Early Career Specialist", strategies: 4, savings: "$1.2M – $3.5M", color: "bg-cyan-500" },
  { range: "$500K – $750K", label: "Mid-Career Surgeon/Specialist", strategies: 6, savings: "$3.5M – $8M", color: "bg-emerald-500" },
  { range: "$750K – $1.5M", label: "Practice Owner / Partner", strategies: 8, savings: "$8M – $18M", color: "bg-amber-500" },
  { range: "$1.5M – $2M+", label: "Multi-Practice / Executive", strategies: 10, savings: "$18M – $40M+", color: "bg-emerald-500" },
];

// Unsourced statistics (divorce rate, "burnout rate", debt averages) were removed:
// NAIC Model 570 §5.R / 11 NCAC 12 .0427(l) require a named, recent source.
const PAIN_POINTS = [
  { stat: "37%", label: "Top Federal Bracket", desc: `Top ${TAX_RULES_2026.taxYear} federal income tax rate (IRC § 1; Rev. Proc. 2025-32)` },
  { stat: "3.8%", label: "Net Investment Income Tax", desc: "On investment income above the IRC § 1411 thresholds" },
  { stat: "0.9%", label: "Additional Medicare Tax", desc: "On wages above $200K single / $250K joint (IRC § 3101(b)(2))" },
  { stat: `$${TAX_RULES_2026.retirement.deferral401k.toLocaleString()}`, label: `${TAX_RULES_2026.taxYear} 401(k) Deferral Limit`, desc: "IRS Notice 2025-67; the engine reads it from shared tax rules" },
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
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
            <Stethoscope className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">The Physician's Edge</h1>
            <p className="text-sm text-muted-foreground">Aggressive Wealth Engineering for $350K–$2M+ Earners</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-3 max-w-3xl leading-relaxed">
          You didn't spend 12+ years in training to hand the top bracket more than the law requires. The Russell Capital Systems™
          calculator brain was engineered specifically for physicians, whose income, debt and practice decisions are
          unusually tangled together. This isn't a generic financial plan. This is a
          <span className="text-emerald-400 font-semibold"> coordinated tax-planning model</span>, hypothetical and based on your facts.
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
      <div className="rc-card p-6 mb-8 border border-emerald-500/20">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
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
                  ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "border-border/50 bg-card/50 hover:border-emerald-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                <span className="text-sm font-bold text-white">{tier.range}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{tier.label}</div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400">{tier.strategies} strategies</span>
                <span className="text-emerald-400" title="Hypothetical modeled range for this tier, not a result for you">{tier.savings} modeled (hypothetical)</span>
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
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
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
      <div className="rc-card p-6 mb-8 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5">
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
            <div className="text-2xl font-bold text-emerald-400 mb-1">50 Years</div>
            <div className="text-xs font-semibold text-white">Projection Horizon</div>
            <div className="text-xs text-muted-foreground mt-1">Conservative, moderate, and aggressive scenarios</div>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border/30">
            <div className="text-2xl font-bold text-emerald-400 mb-1">Proprietary</div>
            <div className="text-xs font-semibold text-white">{techStatusLabel()}</div>
            <div className="text-xs text-muted-foreground mt-1">{statusSentence()}</div>
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <div className="rc-card p-6 mb-8 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Ready to See Your Numbers?</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
          Select any calculator module above to run your personalized projections. The 248-calculator brain 
          will show you exactly how much wealth you're leaving on the table.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/portal/roth-conversion">
            <button className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Start with Roth Conversion
            </button>
          </Link>
          <Link href="/portal/divorce-calculator">
            <button className="px-5 py-2.5 rounded-lg border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition-colors">
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
