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
  MapPin,
  Menu,
  Target,
  ScanSearch,
  Settings2,
  Shield,
  ShieldCheck,
  Stethoscope,
  Sunrise,
  TrendingUp,
  TreePine,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import HomeAIConcierge from "@/components/HomeAIConcierge";
import HomeLeadFactFinder from "@/components/HomeLeadFactFinder";
import ProprietaryTech from "@/components/ProprietaryTech";

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
    <div id="main-content" tabIndex={-1} className="rc-homepage rc-homepage-type-scale relative min-h-screen bg-[#060f20] text-[#c8d8ec] outline-none">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-[.05] [background-image:linear-gradient(rgba(52,211,153,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.6)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_85%_12%,rgba(16,185,129,.08),transparent_34%),radial-gradient(circle_at_10%_80%,rgba(16,185,129,.06),transparent_36%)]" />
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
              <a href="#ai-brain-trust" className="text-white/80 transition-colors hover:text-emerald-300">Ask AI</a>
              <a href="#technology" className="text-white/80 transition-colors hover:text-emerald-300">Technology</a>
              <a href="#client-login" className="text-white/80 transition-colors hover:text-emerald-300">Resources</a>
              <a href="#about" className="text-white/80 transition-colors hover:text-emerald-300">About</a>
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
              <a href="#ai-brain-trust" className="block rounded-lg px-4 py-3 text-white/80 hover:bg-white/5 hover:text-emerald-300" onClick={() => setMenuOpen(false)}>Ask AI</a>
              <a href="#technology" className="block rounded-lg px-4 py-3 text-white/80 hover:bg-white/5 hover:text-emerald-300" onClick={() => setMenuOpen(false)}>Technology</a>
              <a href="#client-login" className="block rounded-lg px-4 py-3 text-white/80 hover:bg-white/5 hover:text-emerald-300" onClick={() => setMenuOpen(false)}>Resources</a>
              <a href="#about" className="block rounded-lg px-4 py-3 text-white/80 hover:bg-white/5 hover:text-emerald-300" onClick={() => setMenuOpen(false)}>About</a>
            </div>
          )}
        </div>
      </nav>

      <section id="top" className="rc-homepage-hero rc-command-center relative flex min-h-[100vh] items-center overflow-hidden bg-[#050b0a]">
        <img src="/rcs-neon-hero.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover object-center blur-[16px] brightness-[.28]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,10,.74)_0%,rgba(5,11,10,.5)_42%,#050b0a_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(16,185,129,.18),transparent_46%)]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[.13] [background-image:linear-gradient(rgba(52,211,153,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.55)_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="container relative z-10 flex flex-col items-center pb-16 pt-36 text-center">
          <h1 className="mb-8 flex w-full max-w-4xl flex-col items-center gap-3" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            <span className="w-full rounded-2xl border border-white/35 bg-white/[.06] px-5 py-2.5 text-[clamp(1.8rem,4.4vw,3.6rem)] font-bold leading-tight text-white [text-shadow:_0_0_18px_rgba(255,255,255,.45)] backdrop-blur-sm">Financial &amp; Tax</span>
            <span className="w-full rounded-2xl border border-emerald-300/60 bg-emerald-400/[.06] px-5 py-2.5 text-[clamp(1.8rem,4.4vw,3.6rem)] font-bold leading-tight text-emerald-300 [text-shadow:_0_0_22px_rgba(52,211,153,.9),_0_0_46px_rgba(16,185,129,.5)] backdrop-blur-sm">Relief and Recovery</span>
            <span className="w-full rounded-2xl border border-emerald-300/45 bg-emerald-400/[.05] px-5 py-3 text-[clamp(1.35rem,3.4vw,2.7rem)] font-bold leading-tight text-emerald-200 [text-shadow:_0_0_18px_rgba(52,211,153,.7)] backdrop-blur-sm">For Physicians, Psychiatrists, &amp; Surgeons</span>
          </h1>
          <p className="mb-9 max-w-2xl text-lg leading-relaxed text-white/85 drop-shadow-[0_5px_20px_rgba(0,0,0,.9)]">
            Coordinated <span className="font-semibold text-emerald-300">tax reduction</span>, <span className="font-semibold text-emerald-300">interest recovery</span>, practice, risk, retirement, and legacy planning — built for the finances of physicians, psychiatrists, and surgeons.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <a href="#consultation" className="rc-btn rc-btn-primary rounded-xl px-7 py-3.5 text-base shadow-[0_16px_42px_rgba(34,197,94,.28)]"><Calendar size={18} /> Plan Beyond the Practice</a>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="rc-btn rounded-xl border border-emerald-300/45 bg-black/30 px-7 py-3.5 text-base text-white backdrop-blur hover:bg-emerald-300/10"><Calendar size={18} /> Book a Physician Planning Review</a>
          </div>

          <div className="mt-16 grid w-full max-w-5xl grid-cols-2 overflow-hidden rounded-2xl border border-emerald-200/25 bg-black/45 backdrop-blur-xl sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Practice Economics", Icon: TrendingUp, href: "#practice-planning" },
              { label: "Physician Tax Strategy", Icon: Stethoscope, href: "#physician-planning" },
              { label: "Risk & Protection", Icon: ShieldCheck, href: "#planning-options" },
              { label: "Retirement Income", Icon: Sunrise, href: "#planning-options" },
              { label: "Succession & Legacy", Icon: TreePine, href: "#planning-options" },
            ].map(({ label, Icon, href }) => (
              <a key={label} href={href} className="flex min-h-[8rem] flex-col items-center justify-center gap-3 border-emerald-200/12 px-3 py-6 text-white/85 transition-colors hover:bg-emerald-300/10 hover:text-emerald-200 [&:not(:last-child)]:border-r">
                <Icon size={30} strokeWidth={1.4} className="text-emerald-300" />
                <span className="text-sm font-semibold">{label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="container relative z-10 pb-24">
          <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-emerald-200/35 bg-black/55 p-4 shadow-[0_28px_90px_rgba(0,0,0,.5),inset_0_0_45px_rgba(16,185,129,.045)] backdrop-blur-xl sm:p-5">
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
                <div id="calculator" className="mb-3 flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-white">Tax &amp; Interest Savings Calculator</p><p className="text-xs text-white/50">Directional estimate only — not guaranteed. Reviewed by our tax professional team for suitability and IRS compliance.</p></div><span className="text-lg font-bold text-emerald-300">${illustrativeOpportunity.toLocaleString()}</span></div>
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

      <HomeAIConcierge />

      <HomeLeadFactFinder />

      {/* ── Chapter: Concept 06 — Tax Strategy for High-Earning Physicians ── */}
      <section aria-label="Tax strategy for high-earning physicians" className="relative flex min-h-[100vh] items-center overflow-hidden border-t border-emerald-300/10 bg-[#050b0a]">
        <img src="/rcs-bg-06.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-105 object-cover object-center brightness-[.5]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050b0a_0%,rgba(5,11,10,.72)_46%,rgba(5,11,10,.35)_100%)]" />
        <div className="container relative z-10 py-24">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[.24em] text-emerald-300">The Physician War-Chest Strategy</p>
            <h2 className="mt-3 text-[clamp(2.6rem,6.4vw,5.4rem)] font-extrabold leading-[1.03] tracking-[-.02em] text-white [text-shadow:_0_0_30px_rgba(16,185,129,.45)]" style={{ fontFamily: "DM Sans, sans-serif" }}>Transform Debt Into a <span className="text-emerald-300 [text-shadow:_0_0_30px_rgba(52,211,153,.9)]">Tax-Free Liquid War Chest</span> — On Demand&trade;</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[clamp(1rem,2.1vw,1.4rem)] font-medium text-white/85">You bring the goal. We build the tailored <span className="font-semibold text-emerald-300">Systems</span> around that.</p>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60">Directional strategy education for physicians — not tax, legal, or investment advice. Confirm with your professionals.</p>
          </div>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-[clamp(2.2rem,5vw,4rem)] font-extrabold leading-[1.02] tracking-[-.03em] text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Tax Strategy for<br />High-Earning Physicians</h2>
            <div className="mt-5 h-1 w-24 rounded bg-emerald-400" />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/80">Explore coordinated planning opportunities for medical income, practice entities, retirement plans, and long-term wealth.</p>
            <div className="mt-8 flex flex-col gap-3 sm:max-w-md">
              <a href="#planning-options" className="rc-btn rc-btn-primary rounded-xl px-6 py-3.5 text-base"><CircleDollarSign size={18} /> Explore Physician Tax Strategies</a>
              <a href="#physician-planning" className="rc-btn rounded-xl border border-emerald-300/45 bg-black/30 px-6 py-3.5 text-base text-white hover:bg-emerald-300/10"><Stethoscope size={18} /> Build My Physician Plan</a>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-300/35 bg-black/55 p-5 shadow-[0_28px_90px_rgba(0,0,0,.5)] backdrop-blur-xl">
            <p className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-300"><Landmark size={20} /> Physician Tax-Planning Review</p>
            <div className="space-y-3">
              {[
                { label: "Medical Specialty", Icon: Stethoscope, opts: ["Select specialty", "Surgery", "Psychiatry", "Internal Medicine", "Radiology", "Anesthesiology", "Other"] },
                { label: "Income Range", Icon: TrendingUp, opts: ["Select income", "$300k–$500k", "$500k–$1M", "$1M–$2M", "$2M+"] },
                { label: "Filing Status", Icon: Users, opts: ["Select status", "Single", "Married filing jointly"] },
                { label: "State", Icon: MapPin, opts: ["Select state", "California", "Florida", "New York", "Texas", "Other"] },
                { label: "Practice Entity", Icon: Building2, opts: ["Select entity", "W-2 employee", "Sole proprietor", "S-Corp", "Partnership/Group"] },
              ].map(({ label, Icon, opts }) => (
                <label key={label} className="flex items-center gap-3 rounded-xl border border-emerald-200/20 bg-[#00110d]/70 px-4 py-3">
                  <Icon size={18} className="shrink-0 text-emerald-300" />
                  <select aria-label={label} defaultValue="" className="w-full bg-transparent text-sm text-white outline-none">
                    {opts.map((o, i) => <option key={o} value={i === 0 ? "" : o} disabled={i === 0} className="bg-[#00110d]">{o}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <a href="#calculator" className="rc-btn rc-btn-primary mt-4 w-full justify-center rounded-xl py-3.5 text-base"><Calendar size={18} /> See My Planning Opportunities</a>
          </div>
          </div>
        </div>
      </section>

      {/* ── Chapter: Concept 23 — Turn Capital Into Income (Emerald Dawn) ── */}
      <section id="about" aria-label="Turn capital into income" className="relative flex min-h-[100vh] items-center overflow-hidden border-t border-emerald-300/10 bg-[#050b0a]">
        <img src="/rcs-bg-23.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-105 object-cover object-center brightness-[.55]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050b0a_0%,rgba(5,11,10,.72)_50%,rgba(5,11,10,.4)_100%)]" />
        <div className="container relative z-10 py-28">
          <p className="text-sm font-semibold uppercase tracking-[.24em] text-emerald-300">Russell Capital Systems&trade;</p>
          <h2 className="mt-3 text-[clamp(2.4rem,5.4vw,4.6rem)] font-extrabold leading-[1.0] tracking-[-.03em] text-emerald-400 [text-shadow:_0_0_26px_rgba(52,211,153,.5)]" style={{ fontFamily: "DM Sans, sans-serif" }}>Turn Capital Into Income&trade;</h2>
          <div className="mt-5 h-1 w-24 rounded bg-emerald-400" />
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">Advanced, tax-efficient retirement strategies designed to help you keep more, grow confidently, and create lasting income.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ManagedPortalAction href="/portal/planning-cases" className="rc-btn rc-btn-primary rounded-xl px-6 py-3.5 text-base"><ArrowRight size={18} /> Create Client Plan</ManagedPortalAction>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="rc-btn rounded-xl border border-emerald-300/45 bg-black/30 px-6 py-3.5 text-base text-white hover:bg-emerald-300/10"><Calendar size={18} /> Book Consultation</a>
            <ManagedPortalAction href="/portal/dashboard" className="rc-btn rounded-xl border border-emerald-300/45 bg-black/30 px-6 py-3.5 text-base text-white hover:bg-emerald-300/10"><TrendingUp size={18} /> Go to Dashboard</ManagedPortalAction>
          </div>
          <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-emerald-300/25 bg-black/40 px-4 py-3">
            <ShieldCheck size={20} className="text-emerald-300" />
            <div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Systems-Driven</p><p className="text-sm text-white/75">Proprietary Retirement Income Engine&trade;</p></div>
          </div>
          <div className="mt-12 grid gap-6 rounded-2xl border border-emerald-200/15 bg-black/40 p-6 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: ShieldCheck, t: "Fiduciary-Led", d: "Acting in your best interest." },
              { Icon: TrendingUp, t: "Tax-Efficient", d: "Strategies designed to keep more." },
              { Icon: CircleDollarSign, t: "Income-Focused", d: "Built to deliver confidence in retirement." },
              { Icon: Target, t: "Disciplined Process", d: "Proprietary engine. Proven discipline." },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-300/35 text-emerald-300"><Icon size={20} /></span>
                <div><p className="font-semibold text-white">{t}</p><p className="text-sm text-white/65">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chapter: Concept 25 — Turn Medical Income Into Lasting Wealth ── */}
      <section aria-label="Russell Capital Systems for physicians" className="relative flex min-h-[100vh] items-center overflow-hidden border-t border-emerald-300/10 bg-[#050b0a]">
        <img src="/rcs-bg-25.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-105 object-cover object-center brightness-[.5]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050b0a_0%,rgba(5,11,10,.72)_46%,rgba(5,11,10,.35)_100%)]" />
        <div className="container relative z-10 py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-[clamp(2.2rem,5vw,4rem)] font-extrabold leading-[1.02] tracking-[-.03em] text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>Russell Capital<br />Systems for Physicians</h2>
              <p className="mt-4 text-[clamp(1.1rem,2.4vw,1.7rem)] font-semibold text-emerald-300 [text-shadow:_0_0_18px_rgba(52,211,153,.6)]">Turn Medical Income Into Lasting Wealth&trade;</p>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">Specialized tax, practice, retirement, risk, and legacy planning for physicians, specialists, and medical practice owners.</p>
              <div className="mt-8 flex flex-col gap-3 sm:max-w-md">
                <a href="#physician-planning" className="rc-btn rc-btn-primary rounded-xl px-6 py-3.5 text-base"><Stethoscope size={18} /> Build My Physician Plan</a>
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="rc-btn rounded-xl border border-emerald-300/45 bg-black/30 px-6 py-3.5 text-base text-white hover:bg-emerald-300/10"><Calendar size={18} /> Book a Physician Planning Review</a>
                <ManagedPortalAction href="/portal/dashboard" className="rc-btn rounded-xl border border-emerald-300/45 bg-black/30 px-6 py-3.5 text-base text-white hover:bg-emerald-300/10"><Lock size={18} /> Enter the Physician Portal</ManagedPortalAction>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-300/35 bg-black/55 p-5 backdrop-blur-xl">
              <p className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-300"><ShieldCheck size={20} /> Design Your Physician Financial System</p>
              <div className="space-y-3">
                {[
                  { label: "Medical Specialty", Icon: Stethoscope, opts: ["Select your specialty", "Surgery", "Psychiatry", "Internal Medicine", "Radiology", "Other"] },
                  { label: "Career Stage", Icon: Users, opts: ["Select your stage", "Resident/Fellow", "Early career", "Mid-career", "Approaching retirement"] },
                  { label: "Practice Structure", Icon: Building2, opts: ["Select your structure", "Employed", "Private practice", "Group/Partnership", "Locum"] },
                  { label: "Primary Priority", Icon: Target, opts: ["Select your priority", "Reduce taxes", "Build retirement income", "Protect assets", "Plan legacy"] },
                ].map(({ label, Icon, opts }) => (
                  <label key={label} className="flex items-center gap-3 rounded-xl border border-emerald-200/20 bg-[#00110d]/70 px-4 py-3">
                    <Icon size={18} className="shrink-0 text-emerald-300" />
                    <select aria-label={label} defaultValue="" className="w-full bg-transparent text-sm text-white outline-none">
                      {opts.map((o, i) => <option key={o} value={i === 0 ? "" : o} disabled={i === 0} className="bg-[#00110d]">{o}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl border border-emerald-200/15 bg-black/40 p-5 backdrop-blur-xl sm:grid-cols-3 lg:grid-cols-5">
            {[
              { Icon: CircleDollarSign, t: "Physician Tax", d: "Optimize today. Protect tomorrow." },
              { Icon: Building2, t: "Practice Planning", d: "Strengthen your practice. Build lasting value." },
              { Icon: Shield, t: "Risk Protection", d: "Protect what matters most." },
              { Icon: Sunrise, t: "Retirement Income", d: "Create confidence. Live on your terms." },
              { Icon: TreePine, t: "Legacy Design", d: "Your legacy. Their future." },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="text-center">
                <Icon size={26} className="mx-auto text-emerald-300" />
                <p className="mt-2 text-sm font-semibold text-white">{t}</p>
                <p className="mt-1 text-xs text-white/60">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProprietaryTech />

      {/* ── Credibility: senior partner & multi-decade client retention ── */}
      <section aria-label="Experience and client retention" className="relative overflow-hidden border-t border-emerald-300/10 bg-[#050b0a] py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.06] [background-image:linear-gradient(rgba(52,211,153,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.55)_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl rounded-[1.6rem] border border-emerald-300/25 bg-black/50 p-8 shadow-[0_24px_70px_rgba(0,0,0,.4)] backdrop-blur-xl sm:p-10">
            <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="flex items-center gap-5">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/40 bg-[linear-gradient(135deg,rgba(16,185,129,.28),rgba(16,185,129,.05))] text-emerald-200 shadow-[inset_0_0_18px_rgba(52,211,153,.28)]"><ShieldCheck size={30} strokeWidth={1.6} /></span>
                <div>
                  <p className="text-[clamp(2.6rem,7vw,4rem)] font-black leading-none text-emerald-300 [text-shadow:_0_0_28px_rgba(52,211,153,.7)]" style={{ fontFamily: "DM Sans, sans-serif" }}>60%</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[.16em] text-white/70">on the books 20+ years</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">Experience you can lean on</p>
                <h2 className="mt-2 text-[clamp(1.5rem,3.2vw,2.2rem)] font-extrabold leading-snug text-white [text-shadow:_0_0_20px_rgba(16,185,129,.3)]" style={{ fontFamily: "DM Sans, sans-serif" }}>Clients who stay for decades.</h2>
                <p className="mt-3 leading-relaxed text-white/75">Our senior business partner — 69 years old, with a long career working in medical malpractice — has kept more than <span className="font-semibold text-emerald-300">60% of their clients on the books for 20 years or longer</span>. That kind of loyalty is earned, not bought.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Relief today, recovery for life" className="relative overflow-hidden border-y border-emerald-300/20 bg-[#050b0a] py-20">
        <img src="/rcs-neon-banner.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover object-center blur-[18px] brightness-[.3]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#050b0a,rgba(5,11,10,.5),#050b0a)]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[.1] [background-image:linear-gradient(rgba(52,211,153,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.55)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="container relative z-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[.28em] text-emerald-300/80">Relief today · Recovery for life</p>
          <h2 className="mx-auto mt-3 max-w-4xl text-[clamp(1.7rem,4vw,3.2rem)] font-bold leading-tight text-white [text-shadow:_0_0_22px_rgba(16,185,129,.4)]" style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>
            Keep More of What You Earn. <span className="text-emerald-300 [text-shadow:_0_0_24px_rgba(52,211,153,.85)]">Protect What You Built.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">Tax reduction, interest recovery, and coordinated planning — engineered for the finances of physicians, psychiatrists, and surgeons.</p>
        </div>
      </section>

      <section className="border-y border-[#12233e] bg-[#0b1628]/50" aria-label="Planning principles">
        <div className="container grid grid-cols-1 gap-3 py-6 text-center text-sm text-[#c8d8ec] sm:grid-cols-2 lg:grid-cols-4">
          {['Medical-career coordination','Practice-owner planning','Tax-aware scenario review','Secure advisor collaboration'].map((label) => <div key={label} className="flex items-center justify-center gap-2"><CheckCircle size={13} className="text-[#22c55e]" />{label}</div>)}
        </div>
      </section>

      <ClientLoginSection />

      <section aria-label="Built for high-income medicine" className="relative overflow-hidden border-y border-emerald-300/15 bg-[#050b0a] py-16">
        <div aria-hidden="true" className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(52,211,153,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.55)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,.12),transparent_55%)]" />
        <div className="container relative z-10 text-center">
          <h2 className="mx-auto max-w-4xl text-[clamp(1.6rem,3.6vw,3rem)] font-bold text-white [text-shadow:_0_0_22px_rgba(16,185,129,.35)]" style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>
            Built for <span className="text-emerald-300 [text-shadow:_0_0_24px_rgba(52,211,153,.85)]">High-Income Medicine.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">The financial pressures of a medical career are specific. So is the system built to answer them.</p>
        </div>
      </section>

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

      <section aria-label="One coordinated system" className="relative overflow-hidden bg-[#050b0a] py-16">
        <div aria-hidden="true" className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(52,211,153,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.55)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="container relative z-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[.28em] text-emerald-300/80">Tax reduction · Interest recovery · Legacy</p>
          <h2 className="mx-auto mt-3 max-w-4xl text-[clamp(1.6rem,3.6vw,3rem)] font-bold text-white" style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>
            Every Strategy. <span className="text-emerald-300 [text-shadow:_0_0_24px_rgba(52,211,153,.85)]">One Coordinated System.</span>
          </h2>
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
