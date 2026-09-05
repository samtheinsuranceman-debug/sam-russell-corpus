import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight, BarChart3, Brain, Calculator, Calendar, CheckCircle,
  GraduationCap, Heart, KeyRound, Lock, Shield, Stethoscope,
  TrendingUp, Users, Zap, DollarSign, FileText, Scale,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/hero-skyline_518eb7fe.jpg";

const PHYSICIAN_FEATURES = [
  { icon: GraduationCap, title: "Student Loan Optimizer", desc: "PSLF tracking, IDR plan comparison (SAVE vs PAYE vs REPAYE vs IBR), and forgiveness projections calibrated for physician income trajectories." },
  { icon: Brain, title: "AI Physician Advisor", desc: "An AI brain trained on physician financial lifecycles — from residency to retirement — that cross-references 100+ calculators to build your optimal strategy." },
  { icon: Calculator, title: "100+ Financial Calculators", desc: "Tax optimization, Roth conversions, estate planning, disability insurance, and more — all auto-filled from your fact finder and interconnected." },
  { icon: Shield, title: "Own-Occupation Disability", desc: "Specialty-specific disability insurance analysis. Because a surgeon who can't operate needs different coverage than a psychiatrist." },
  { icon: DollarSign, title: "Tax Alpha Engine", desc: "Backdoor Roth, Mega Backdoor Roth, tax-loss harvesting, and bracket management strategies built for $300K–$1M+ physician incomes." },
  { icon: FileText, title: "Contract Analyzer", desc: "Evaluate signing bonuses, relocation packages, partnership buy-ins, tail coverage, and non-compete clauses before you sign." },
];

const PAIN_POINTS = [
  { stat: "$250K+", label: "Average physician student debt", detail: "at 6.8% interest" },
  { stat: "37%", label: "Top marginal tax bracket", detail: "for most attending physicians" },
  { stat: "$4.6M", label: "Lifetime tax burden", detail: "without optimization strategies" },
  { stat: "10–15 yrs", label: "Behind peers financially", detail: "due to training timeline" },
];

const SPECIALTIES = [
  "Orthopedic Surgery", "Cardiology", "Dermatology", "Anesthesiology",
  "Radiology", "Gastroenterology", "Neurosurgery", "Emergency Medicine",
  "Ophthalmology", "Urology", "Plastic Surgery", "Oncology",
  "OB/GYN", "Psychiatry", "Internal Medicine", "General Surgery",
  "ENT", "Pulmonology", "Dentistry", "Pediatrics",
];

const CALENDLY_URL = "https://calendly.com/samtheinsuranceman-1/30min";

function formatAum(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

/* ─── Client Portal Token Login ────────────────────────────────────────────── */
function ClientLoginSection() {
  const [token, setToken] = useState("");
  const [, navigate] = useLocation();
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Please enter your portal access code.");
      return;
    }
    setError("");
    setIsValidating(true);
    navigate(`/client-portal/${trimmed}`);
  };

  return (
    <section className="container py-20">
      <div className="max-w-2xl mx-auto">
        <div className="rc-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#22c55e] via-[#22c55e]/60 to-transparent" />
          <div className="flex flex-col md:flex-row items-start gap-8 pt-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e]/12 border border-[#22c55e]/20 flex items-center justify-center">
                  <KeyRound size={18} className="text-[#22c55e]" />
                </div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  Physician Portal Access
                </h2>
              </div>
              <p className="text-sm text-[#7a95b8] leading-relaxed mb-4">
                Your financial advisor has shared a secure access code. Enter it below to view your personalized financial plan, student loan strategy, tax projections, and portfolio summary.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#7a95b8]">
                <Lock size={12} className="text-[#22c55e]" />
                <span>HIPAA-grade encryption — your financial data is secure</span>
              </div>
            </div>
            <div className="w-full md:w-80">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-[#7a95b8] mb-1.5 font-medium">Portal Access Code</label>
                  <input
                    type="text"
                    className="rc-input w-full text-sm"
                    placeholder="e.g. abc123def456..."
                    value={token}
                    onChange={(e) => { setToken(e.target.value); setError(""); }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>
                <button
                  type="submit"
                  className="rc-btn rc-btn-primary w-full justify-center text-sm py-2.5"
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Validating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Access My Portal <ArrowRight size={14} />
                    </span>
                  )}
                </button>
              </form>
              <p className="text-xs text-[#7a95b8]/60 mt-3 text-center">
                Don't have a code? Contact your financial advisor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Book a Consultation CTA ──────────────────────────────────────────────── */
function ConsultationSection() {
  const [showCalendly, setShowCalendly] = useState(false);

  return (
    <section className="container py-20">
      <div className="rc-card text-center max-w-3xl mx-auto py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 left-8 w-32 h-32 rounded-full border border-[#22c55e]" />
          <div className="absolute bottom-4 right-8 w-48 h-48 rounded-full border border-[#22c55e]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-[#22c55e]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#22c55e]/12 border border-[#22c55e]/20 flex items-center justify-center">
              <Stethoscope size={22} className="text-[#22c55e]" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Free Physician Financial Assessment
          </h2>
          <p className="text-[#7a95b8] mb-8 max-w-lg mx-auto leading-relaxed">
            In 30 minutes, we'll analyze your student loan strategy, tax position, disability coverage gaps,
            and retirement trajectory. Most physicians discover $500K–$2M in unrealized gains they didn't know existed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rc-btn rc-btn-primary text-base px-8 py-3 rounded-xl shadow-lg shadow-[#22c55e]/20"
              onClick={(e) => {
                e.preventDefault();
                setShowCalendly(true);
              }}
            >
              <Calendar size={16} /> Schedule My Assessment
            </a>
            <a
              href="tel:+18005551234"
              className="rc-btn text-base px-8 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Or Call Us Directly
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#7a95b8]">
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#22c55e]" /> No obligation</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#22c55e]" /> Physician-specific analysis</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#22c55e]" /> Avg. $127K in identified savings</span>
          </div>
        </div>

        {showCalendly && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0b1628] border border-[#12233e] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-[#12233e]">
                <h3 className="text-white font-semibold">Schedule Your Physician Financial Assessment</h3>
                <button
                  onClick={() => setShowCalendly(false)}
                  className="text-[#7a95b8] hover:text-white transition-colors text-xl leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="p-4">
                <iframe
                  src={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=0b1628&text_color=c8d8ec&primary_color=22c55e`}
                  width="100%"
                  height="600"
                  frameBorder="0"
                  title="Schedule a consultation"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Main Landing Page ────────────────────────────────────────────────────── */
export default function Landing() {
  const { isAuthenticated } = useAuth();
  const plansQuery = trpc.billing.plans.useQuery();
  const demoQuery = trpc.demo.data.useQuery(undefined, { staleTime: 60_000 });
  const metrics = demoQuery.data?.metrics;

  const METRICS = [
    { value: "100+", label: "Financial Calculators" },
    { value: "$250K+", label: "Avg. Student Debt Optimized" },
    { value: "32", label: "Medical Specialties Covered" },
    { value: "50-Year", label: "Projection Models" },
  ];

  return (
    <div className="min-h-screen bg-[#060f20] text-[#c8d8ec]">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/30 flex items-center justify-center">
              <span className="text-[#22c55e] font-bold text-sm">RCS</span>
            </div>
            <span className="font-bold text-white text-lg" style={{ fontFamily: "DM Sans, sans-serif" }}>Russell Capital Solutions™</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#physician-tools" className="text-white/70 hover:text-white transition-colors">Physician Tools</a>
            <a href="#client-login" className="text-white/70 hover:text-white transition-colors">Client Login</a>
            <a href="#consultation" className="text-white/70 hover:text-white transition-colors">Free Assessment</a>
            <Link href="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link>
          </div>
          {isAuthenticated ? (
            <Link href="/portal/dashboard" className="rc-btn rc-btn-primary text-sm">
              Go to Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <Link href="/portal/dashboard" className="rc-btn rc-btn-primary text-sm">
              Enter Dashboard <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </nav>

      {/* Hero — Physician-focused */}
      <section
        className="relative min-h-[85vh] flex flex-col items-center justify-center text-center overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center 70%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#060f20]/80 via-[#060f20]/50 to-[#060f20]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060f20] via-transparent to-transparent" />

        <div className="relative z-10 px-4 max-w-4xl mx-auto">
          {/* Specialty badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="px-4 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-sm font-medium flex items-center gap-2">
              <Stethoscope size={14} />
              Built Exclusively for Physicians
            </div>
          </div>

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            The Financial Command Center
            <br />
            <span className="text-[#22c55e]">for Physicians</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 mb-4 max-w-2xl mx-auto leading-relaxed">
            You spent a decade mastering medicine. We built the platform that masters your money.
            Student loan optimization, tax-free retirement strategies, and 100+ interconnected calculators
            — all calibrated for physician income trajectories.
          </p>

          <p className="text-sm text-[#22c55e]/70 font-medium tracking-wide mb-8">
            Trusted by Surgeons &bull; Cardiologists &bull; Dermatologists &bull; Anesthesiologists &bull; Radiologists &bull; All Specialties
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/portal/calculator-hub"
              className="rc-btn rc-btn-primary text-base px-8 py-3 rounded-xl shadow-lg shadow-[#22c55e]/20"
            >
              <Calculator size={16} /> Explore 100+ Calculators
            </Link>
            <a
              href="#consultation"
              className="rc-btn text-base px-8 py-3 rounded-xl border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors"
            >
              <Stethoscope size={16} /> Free Physician Assessment
            </a>
            <Link
              href="/portal/dashboard"
              className="rc-btn text-base px-8 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Enter Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics bar */}
      <section className="border-y border-[#12233e] bg-[#0b1628]/50">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {METRICS.map((m) => (
              <div key={m.label} className="text-center">
                <div className="rc-stat-value">{m.value}</div>
                <div className="rc-stat-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Physician Pain Points */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "DM Sans, sans-serif" }}>
            The Physician Financial Problem
          </h2>
          <p className="text-[#7a95b8] max-w-2xl mx-auto">
            Doctors earn more but start later, carry more debt, and face higher tax brackets than any other profession.
            Without physician-specific strategies, you're leaving hundreds of thousands on the table.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {PAIN_POINTS.map((p) => (
            <div key={p.label} className="rc-card text-center group hover:border-red-500/30 transition-colors">
              <div className="text-2xl md:text-3xl font-extrabold text-red-400 mb-2">{p.stat}</div>
              <div className="text-white font-medium text-sm mb-1">{p.label}</div>
              <div className="text-xs text-[#7a95b8]">{p.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Client Portal Login */}
      <div id="client-login">
        <ClientLoginSection />
      </div>

      {/* Physician-Specific Features */}
      <section className="container py-20" id="physician-tools">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Built for How Physicians Actually Build Wealth
          </h2>
          <p className="text-[#7a95b8] max-w-xl mx-auto">
            Every tool, calculator, and AI recommendation is calibrated for the physician financial lifecycle.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PHYSICIAN_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rc-card group">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e]/12 border border-[#22c55e]/20 flex items-center justify-center mb-4 group-hover:bg-[#22c55e]/20 transition-colors">
                  <Icon size={18} className="text-[#22c55e]" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[#7a95b8] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Specialties Ticker */}
      <section className="border-y border-[#12233e] bg-[#0b1628]/30 py-8 overflow-hidden">
        <div className="text-center mb-4">
          <p className="text-xs text-[#7a95b8] uppercase tracking-widest font-medium">Serving All Medical Specialties</p>
        </div>
        <div className="flex gap-6 animate-marquee whitespace-nowrap">
          {[...SPECIALTIES, ...SPECIALTIES].map((s, i) => (
            <span key={i} className="text-sm text-[#7a95b8]/60 font-medium px-4 py-1.5 rounded-full border border-[#12233e]">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container py-20" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "DM Sans, sans-serif" }}>Physician-Grade Financial Tools</h2>
          <p className="text-[#7a95b8]">Start with Growth, scale to Enterprise.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(plansQuery.data ?? []).map((plan) => (
            <div key={plan.slug} className={`rc-card relative ${plan.slug === "professional" ? "border-[#22c55e]/40 ring-1 ring-[#22c55e]/20" : ""}`}>
              {plan.slug === "professional" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rc-badge rc-badge-green text-xs">Most Popular with Physicians</span>
                </div>
              )}
              <div className="mb-4">
                <div className="text-white font-bold text-lg">{plan.name}</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-white">${plan.monthlyPrice.toLocaleString()}</span>
                  <span className="text-[#7a95b8] text-sm">/mo</span>
                </div>
                <div className="text-xs text-[#7a95b8] mt-1">Up to {plan.seats} seats</div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#c8d8ec]">
                    <CheckCircle size={14} className="text-[#22c55e] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/portal/dashboard" className={`rc-btn w-full justify-center ${plan.slug === "professional" ? "rc-btn-primary" : "rc-btn-secondary"}`}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Consultation */}
      <div id="consultation">
        <ConsultationSection />
      </div>

      {/* Final CTA */}
      <section className="container py-20">
        <div className="rc-card text-center max-w-2xl mx-auto py-12">
          <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "DM Sans, sans-serif" }}>
            You Mastered Medicine. Now Master Your Money.
          </h2>
          <p className="text-[#7a95b8] mb-6">
            Join thousands of physicians using Russell Capital Solutions™ to eliminate student debt faster,
            pay less in taxes, and build tax-free retirement income.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/portal/dashboard" className="rc-btn rc-btn-primary">
              Enter the Physician Hub <ArrowRight size={16} />
            </Link>
            <a href="#consultation" className="rc-btn rc-btn-secondary">
              <Stethoscope size={14} /> Free Assessment
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#12233e] py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#7a95b8]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#22c55e]/20 flex items-center justify-center">
              <span className="text-[#22c55e] font-bold text-xs">RCS</span>
            </div>
            <span>Russell Capital Solutions™ &copy; {new Date().getFullYear()}. All rights reserved.</span>
            <span className="text-xs text-[#4a6585] block mt-1">www.RussellCapitalSystems.com is owned by Russell Holdings Management LLC. Russell Capital Solutions™ is a registered trademark.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
