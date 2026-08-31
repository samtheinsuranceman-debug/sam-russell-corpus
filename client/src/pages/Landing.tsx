import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  BriefcaseMedical,
  Building2,
  Calendar,
  CheckCircle,
  CircleDollarSign,
  KeyRound,
  Landmark,
  Lock,
  Menu,
  ScanSearch,
  Settings2,
  Shield,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  TreePine,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const HERO_BG = "/manus-storage/rcs-concept-16-clean-background_a6ddebf1.png";
const CALENDLY_URL = "https://calendly.com/samtheinsuranceman-1/30min";

const COMMAND_PILLARS = [
  { id: "tax", label: "Tax", icon: CircleDollarSign, description: "Coordinate income, entity, benefit, and contribution questions for tax-professional review." },
  { id: "practice", label: "Practice", icon: Building2, description: "Connect practice ownership, cash flow, protection, and personal planning decisions." },
  { id: "retirement", label: "Retirement", icon: Landmark, description: "Model retirement-income approaches with assumptions and trade-offs shown clearly." },
  { id: "legacy", label: "Legacy", icon: TreePine, description: "Organize estate, family, charitable, and succession priorities in one documented plan." },
] as const;

const PLANNING_AREAS = [
  { icon: CircleDollarSign, title: "Tax Opportunity Review", desc: "Organize income, contribution, entity, and timing questions for coordinated advisor and tax-professional review.", href: "/portal/tax-opportunities" },
  { icon: Building2, title: "Practice Owner Planning", desc: "Connect practice economics, ownership decisions, succession priorities, and household planning without mixing record systems.", href: "/portal/business-owner" },
  { icon: Shield, title: "Protection and Policy Review", desc: "Review existing protection, policy assumptions, liquidity needs, and documented follow-up responsibilities.", href: "/portal/policy-review" },
  { icon: Landmark, title: "Retirement Income Modeling", desc: "Compare retirement timing, income guardrails, and planning assumptions without presenting projections as guarantees.", href: "/portal/retirement-projection" },
  { icon: TreePine, title: "Estate and Legacy Coordination", desc: "Map estate, family, charitable, and succession priorities to the professionals responsible for implementation.", href: "/portal/estate-flow" },
  { icon: TrendingUp, title: "Portfolio and Risk Alignment", desc: "Connect risk tolerance, portfolio drift, tax considerations, and long-term goals in a documented review cycle.", href: "/portal/portfolio-drift" },
  { icon: Stethoscope, title: "Physician Planning Cases", desc: "Save assumptions, notes, status, and next actions for complex medical-career and practice-owner decisions.", href: "/portal/planning-cases" },
  { icon: KeyRound, title: "Secure Document Vault", desc: "Keep planning documents inside managed access controls and share only through authorized workflows.", href: "/portal/document-vault" },
] as const;

const FEATURES = [
  {
    icon: Stethoscope,
    title: "Physician-Specific Planning",
    desc: "Coordinate medical income, benefits, practice ownership, and household priorities in one documented planning process.",
  },
  {
    icon: TrendingUp,
    title: "Tax-Aware Scenario Modeling",
    desc: "Compare planning scenarios with assumptions, trade-offs, and source dates shown clearly for advisor review.",
  },
  {
    icon: BriefcaseMedical,
    title: "Practice Owner Coordination",
    desc: "Organize personal and practice considerations without mixing operational records with household planning.",
  },
  {
    icon: Shield,
    title: "Risk and Protection Review",
    desc: "Bring insurance, liquidity, estate, and long-term risk questions into a documented review workflow.",
  },
  {
    icon: CheckCircle,
    title: "Retirement Income Planning",
    desc: "Evaluate multiple retirement-income approaches without presenting projections or guarantees as outcomes.",
  },
  {
    icon: Users,
    title: "Secure Advisor Collaboration",
    desc: "Use managed sign-in, role-based access, audit history, and read-only client sharing for sensitive planning work.",
  },
];

function ManagedPortalAction({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className: string;
}) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Link href={href} className={className}>{children}</Link>;
  return (
    <button type="button" className={className} onClick={() => { window.location.href = getLoginUrl(href); }}>
      {children}
    </button>
  );
}

function ClientLoginSection() {
  const [token, setToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Please enter your portal access code.");
      return;
    }
    setError("");
    setIsValidating(true);
    navigate(`/client-portal/${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="container py-20" id="client-login">
      <div className="rc-card relative mx-auto max-w-2xl overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#22c55e] via-[#22c55e]/60 to-transparent" />
        <div className="flex flex-col items-start gap-8 pt-4 md:flex-row">
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/12">
                <KeyRound size={18} className="text-[#22c55e]" />
              </div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Client Portal Access</h2>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-[#7a95b8]">
              Your advisor has shared a secure access code with you. Enter it to view your financial plan, documents, upcoming meetings, and portfolio summary.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#7a95b8]">
              <Lock size={12} className="text-[#22c55e]" />
              <span>Read-only access using the code supplied by your advisor</span>
            </div>
          </div>
          <div className="w-full md:w-80">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="portal-access-code" className="mb-1.5 block text-xs font-medium text-[#7a95b8]">Portal Access Code</label>
                <input
                  id="portal-access-code"
                  type="text"
                  className="rc-input w-full text-sm"
                  placeholder="e.g. abc123def456..."
                  value={token}
                  onChange={(event) => { setToken(event.target.value); setError(""); }}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={error ? "portal-code-error" : undefined}
                />
                {error && <p id="portal-code-error" role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
              </div>
              <button type="submit" className="rc-btn rc-btn-primary w-full justify-center py-2.5 text-sm" disabled={isValidating}>
                {isValidating ? "Opening portal…" : <span className="flex items-center gap-2">Access My Portal <ArrowRight size={14} /></span>}
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-[#7a95b8]/60">Don&apos;t have a code? Contact your financial advisor.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConsultationSection() {
  const [showCalendly, setShowCalendly] = useState(false);
  return (
    <section className="container py-20" id="consultation">
      <div className="rc-card relative mx-auto max-w-3xl overflow-hidden py-12 text-center">
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/12">
              <Calendar size={22} className="text-[#22c55e]" />
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl" style={{ fontFamily: "DM Sans, sans-serif" }}>Book a Free Consultation</h2>
          <p className="mx-auto mb-8 max-w-lg leading-relaxed text-[#7a95b8]">
            Discuss how your medical career, practice ownership, benefits, taxes, protection needs, and retirement goals fit together. Schedule a 30-minute introductory conversation with an advisor to identify the planning questions that deserve a deeper review.
          </p>
          <button type="button" className="rc-btn rc-btn-primary rounded-xl px-8 py-3 text-base shadow-lg shadow-[#22c55e]/20" onClick={() => setShowCalendly(true)}>
            <Calendar size={16} /> Schedule Now
          </button>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#7a95b8]">
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#22c55e]" /> No obligation</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#22c55e]" /> 30-minute call</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#22c55e]" /> Personalized strategy review</span>
          </div>
        </div>
      </div>
      {showCalendly && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="consultation-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCalendly(false); }}>
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#12233e] bg-[#0b1628] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#12233e] p-4">
              <h3 id="consultation-dialog-title" className="font-semibold text-white">Schedule Your Consultation</h3>
              <button type="button" onClick={() => setShowCalendly(false)} className="rounded p-2 text-[#7a95b8] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]" aria-label="Close scheduling dialog"><X size={20} /></button>
            </div>
            <iframe src={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=0b1628&text_color=c8d8ec&primary_color=22c55e`} width="100%" height="600" title="Schedule a consultation" className="max-h-[78vh]" />
          </div>
        </div>
      )}
    </section>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePillar, setActivePillar] = useState<(typeof COMMAND_PILLARS)[number]["id"]>("tax");
  const [income, setIncome] = useState("350000");
  const [filingStatus, setFilingStatus] = useState("married");
  const [taxState, setTaxState] = useState("other");
  const currentPillar = COMMAND_PILLARS.find((pillar) => pillar.id === activePillar) ?? COMMAND_PILLARS[0];
  const numericIncome = Math.min(5_000_000, Math.max(0, Number(income) || 0));
  const stateFactor = taxState === "ca" || taxState === "ny" ? 0.034 : taxState === "fl" || taxState === "tx" ? 0.02 : 0.026;
  const filingAdjustment = filingStatus === "single" ? 0.003 : 0;
  const illustrativeOpportunity = Math.round((numericIncome * (stateFactor + filingAdjustment)) / 250) * 250;

  return (
    <div id="main-content" tabIndex={-1} className="rc-homepage rc-homepage-type-scale min-h-screen bg-[#060f20] text-[#c8d8ec] outline-none">
      <nav className="rc-concept16-nav absolute inset-x-0 top-0 z-50" aria-label="Public navigation">
        <div className="container pt-5">
          <div className="flex min-h-[5.5rem] items-center justify-between gap-4 rounded-2xl border border-emerald-300/25 bg-black/55 px-5 shadow-[0_24px_70px_rgba(0,0,0,.35)] backdrop-blur-xl lg:px-7">
            <a href="#top" className="flex min-w-0 items-center gap-3" aria-label="Russell Capital Systems homepage">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300/50 bg-emerald-300/10 text-base font-black text-emerald-300 shadow-[inset_0_0_22px_rgba(52,211,153,.12)]">R</span>
              <span className="truncate text-base font-bold text-white lg:text-lg" style={{ fontFamily: "DM Sans, sans-serif" }}>Russell Capital Systems™</span>
            </a>
            <div className="hidden items-center gap-7 text-sm lg:flex">
              <a href="#physician-planning" className="text-white/80 transition-colors hover:text-emerald-300">For Physicians</a>
              <a href="#practice-planning" className="text-white/80 transition-colors hover:text-emerald-300">Practice Owners</a>
              <a href="#planning-framework" className="text-white/80 transition-colors hover:text-emerald-300">Strategies</a>
              <a href="#client-login" className="text-white/80 transition-colors hover:text-emerald-300">Resources</a>
            </div>
            <div className="flex items-center gap-2">
              <ManagedPortalAction href="/portal/dashboard" className="rc-btn border border-emerald-300/35 bg-emerald-300/10 text-sm text-white hover:bg-emerald-300/20"><Lock size={14} /> {isAuthenticated ? "Dashboard" : "Physician Login"}</ManagedPortalAction>
              <button type="button" className="rounded-lg border border-white/15 p-2 text-white lg:hidden" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
            </div>
          </div>
          {menuOpen && (
            <div className="mt-2 rounded-2xl border border-emerald-300/20 bg-black/90 p-3 shadow-xl backdrop-blur-xl lg:hidden">
              <a href="#physician-planning" className="block rounded-lg px-4 py-3 text-white/80 hover:bg-white/5 hover:text-emerald-300" onClick={() => setMenuOpen(false)}>For Physicians</a>
              <a href="#practice-planning" className="block rounded-lg px-4 py-3 text-white/80 hover:bg-white/5 hover:text-emerald-300" onClick={() => setMenuOpen(false)}>Practice Owners</a>
              <a href="#planning-framework" className="block rounded-lg px-4 py-3 text-white/80 hover:bg-white/5 hover:text-emerald-300" onClick={() => setMenuOpen(false)}>Strategies</a>
              <a href="#client-login" className="block rounded-lg px-4 py-3 text-white/80 hover:bg-white/5 hover:text-emerald-300" onClick={() => setMenuOpen(false)}>Resources</a>
            </div>
          )}
        </div>
      </nav>

      <section id="top" className="rc-homepage-hero rc-command-center relative flex min-h-[100vh] items-center overflow-hidden" style={{ backgroundImage: `url(${HERO_BG})`, backgroundPosition: "center", backgroundSize: "cover" }}>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,8,8,.96)_0%,rgba(0,10,10,.78)_38%,rgba(0,10,10,.3)_70%,rgba(0,8,8,.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.52)_0%,transparent_32%,rgba(2,15,12,.25)_68%,#060f20_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_45%,rgba(16,185,129,.17),transparent_32%)]" />
        <div className="container relative z-10 grid gap-10 pb-24 pt-40 lg:grid-cols-[.86fr_1.14fr] lg:items-center lg:gap-12 lg:pt-36">
          <div className="max-w-3xl">
            <p className="mb-5 flex items-center gap-3 text-sm font-semibold uppercase tracking-[.2em] text-emerald-300"><span className="h-px w-10 bg-emerald-300/70" /> Built for medical professionals</p>
            <h1 className="mb-7 max-w-[12ch] text-[clamp(3.4rem,6vw,7.1rem)] font-extrabold leading-[.93] tracking-[-.045em] text-white drop-shadow-[0_10px_35px_rgba(0,0,0,.85)]" style={{ fontFamily: "DM Sans, sans-serif" }}>The Physician Wealth Command Center</h1>
            <p className="mb-9 max-w-2xl text-lg leading-relaxed text-white/80 drop-shadow-[0_5px_20px_rgba(0,0,0,.9)]">
              A unified planning view for medical income, practice value, tax strategy, protection, retirement, and legacy—with assumptions and responsibilities documented clearly.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ManagedPortalAction href="/portal/dashboard" className="rc-btn rc-btn-primary rounded-xl px-7 py-3.5 text-base shadow-[0_16px_42px_rgba(34,197,94,.28)]"><ArrowRight size={18} /> Enter the Physician Portal</ManagedPortalAction>
              <a href="#consultation" className="rc-btn rounded-xl border border-emerald-300/45 bg-black/30 px-7 py-3.5 text-base text-white backdrop-blur hover:bg-emerald-300/10"><ShieldCheck size={18} /> Start My Physician Plan</a>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-emerald-200/35 bg-black/55 p-4 shadow-[0_28px_90px_rgba(0,0,0,.5),inset_0_0_45px_rgba(16,185,129,.045)] backdrop-blur-xl sm:p-5">
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-emerald-200/20 sm:grid-cols-4" role="tablist" aria-label="Physician planning pillars">
              {COMMAND_PILLARS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" role="tab" aria-selected={activePillar === id} onClick={() => setActivePillar(id)} className={`relative flex min-h-[6.8rem] flex-col items-center justify-center gap-2 border-emerald-200/15 px-3 py-4 text-white transition-colors hover:bg-emerald-300/10 ${activePillar === id ? "bg-emerald-300/10 text-emerald-200 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-emerald-300" : "text-white/72"}`}>
                  <Icon size={25} strokeWidth={1.5} />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-emerald-200/20 bg-[#00110d]/72 p-5">
              <div className="mb-5 flex items-start gap-3">
                <div className="mt-0.5 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-2 text-emerald-300"><currentPillar.icon size={20} /></div>
                <div><p className="text-sm font-semibold text-white">{currentPillar.label} planning view</p><p className="mt-1 text-xs leading-relaxed text-white/60">{currentPillar.description}</p></div>
              </div>
              <div id="planning-framework" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Review", icon: ScanSearch },
                  { label: "Coordinate", icon: Users },
                  { label: "Implement", icon: Settings2 },
                  { label: "Monitor", icon: ShieldCheck },
                ].map(({ label, icon: Icon }, index) => (
                  <div key={label} className="relative flex flex-col items-center gap-2 rounded-xl border border-emerald-200/15 bg-black/25 px-2 py-4 text-center text-white/75">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/35 text-emerald-300"><Icon size={18} /></span>
                    <span className="text-xs font-medium">{label}</span>
                    {index < 3 && <ArrowRight size={13} className="absolute -right-2 top-[2.15rem] hidden text-emerald-300/80 sm:block" />}
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-emerald-200/15 pt-5">
                <div className="mb-3 flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-white">Physician tax-planning preview</p><p className="text-xs text-white/50">Directional estimate only—not tax advice.</p></div><span className="text-lg font-bold text-emerald-300">${illustrativeOpportunity.toLocaleString()}</span></div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="text-xs text-white/60">Annual income<input aria-label="Annual income" type="number" min="0" max="5000000" step="1000" value={income} onChange={(event) => setIncome(event.target.value)} className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/45 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300" /></label>
                  <label className="text-xs text-white/60">Filing status<select aria-label="Filing status" value={filingStatus} onChange={(event) => setFilingStatus(event.target.value)} className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/45 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"><option value="married">Married filing jointly</option><option value="single">Single</option></select></label>
                  <label className="text-xs text-white/60">State<select aria-label="State" value={taxState} onChange={(event) => setTaxState(event.target.value)} className="mt-1 w-full rounded-lg border border-emerald-200/20 bg-black/45 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300"><option value="other">Other state</option><option value="ca">California</option><option value="fl">Florida</option><option value="ny">New York</option><option value="tx">Texas</option></select></label>
                </div>
                <a href="#consultation" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200">See your full optimization plan <ArrowRight size={13} /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#12233e] bg-[#0b1628]/50" aria-label="Planning principles">
        <div className="container grid grid-cols-1 gap-3 py-6 text-center text-sm text-[#c8d8ec] sm:grid-cols-2 lg:grid-cols-4">
          {['Medical-career coordination','Practice-owner planning','Tax-aware scenario review','Secure advisor collaboration'].map((label) => <div key={label} className="flex items-center justify-center gap-2"><CheckCircle size={13} className="text-[#22c55e]" />{label}</div>)}
        </div>
      </section>

      <ClientLoginSection />

      <section className="container py-20" id="physician-planning">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Planning built around a medical career</h2>
          <p className="mx-auto max-w-xl text-[#7a95b8]">A connected process for the financial decisions physicians and practice owners face across career and life stages.</p>
        </div>
        <span id="practice-planning" className="sr-only" aria-hidden="true">Practice owner planning</span>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rc-card group scroll-mt-32">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/12 transition-colors group-hover:bg-[#22c55e]/20"><Icon size={18} className="text-[#22c55e]" /></div>
              <h3 className="mb-2 font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-[#7a95b8]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#12233e] bg-[#081426] py-20" id="planning-options">
        <div className="container">
          <div className="mb-12 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[.16em] text-emerald-300">Continue below the command center</p>
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Every planning area remains within reach</h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-[#7a95b8]">Open a focused workflow after managed sign-in, or begin with a consultation when the right starting point is not yet clear.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PLANNING_AREAS.map(({ icon: Icon, title, desc, href }) => (
              <ManagedPortalAction key={title} href={href} className="rc-card group flex w-full flex-col items-start text-left transition-transform hover:-translate-y-1 hover:border-emerald-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-300"><Icon size={20} /></span>
                <span className="mb-2 font-semibold text-white">{title}</span>
                <span className="text-sm leading-relaxed text-[#7a95b8]">{desc}</span>
                <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-emerald-300">Open planning area <ArrowRight size={14} /></span>
              </ManagedPortalAction>
            ))}
          </div>
        </div>
      </section>

      <ConsultationSection />

      <section className="container py-20">
        <div className="rc-card mx-auto max-w-2xl py-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Ready to organize your physician financial plan?</h2>
          <p className="mb-6 text-[#7a95b8]">Begin with a secure planning conversation focused on your medical career, household, and practice-owner priorities.</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ManagedPortalAction href="/portal/dashboard" className="rc-btn rc-btn-primary">Go to Dashboard <ArrowRight size={16} /></ManagedPortalAction>
            <a href="#consultation" className="rc-btn rc-btn-secondary"><Calendar size={14} /> Book a Call</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#12233e] py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-[#7a95b8] md:flex-row">
          <div><span className="text-[#22c55e]">RCS</span> Russell Capital Systems™ © {new Date().getFullYear()}. All rights reserved.</div>
          <div className="flex gap-6"><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/terms" className="hover:text-white">Terms</Link><Link href="/support" className="hover:text-white">Support</Link></div>
        </div>
      </footer>
    </div>
  );
}
