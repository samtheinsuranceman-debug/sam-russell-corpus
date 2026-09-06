import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PageBackdrop from "@/components/PageBackdrop";
import { useState, useCallback } from "react";
import { ArrowLeft, CheckCircle, X, Shield, Zap, Crown, CreditCard, Building2, Users, Brain, BarChart3, FileText, Headphones, Lock, Star, ArrowRight, AlertTriangle, Scale, Clock, TrendingUp, DollarSign, Percent } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import SubscriptionDisclaimer, { type DisclosureData } from "@/components/SubscriptionDisclaimer";

const PLAN_ICONS: Record<string, typeof Zap> = {
  beginner: Zap,
  professional: Crown,
  enterprise: Building2,
};

const PLAN_COLORS: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  beginner: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", badge: "rc-badge-blue" },
  professional: { border: "border-[#22c55e]/40", bg: "bg-[#22c55e]/10", text: "text-[#22c55e]", badge: "rc-badge-green" },
  enterprise: { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", badge: "rc-badge-yellow" },
};

const DETAILED_FEATURES: Record<string, { category: string; items: string[] }[]> = {
  beginner: [
    { category: "Core Platform", items: ["3 advisor seats", "Full CRM & pipeline management", "Client portfolio tracking", "Meeting scheduler"] },
    { category: "Financial Engine", items: ["Roth ladder calculator", "IUL projection engine", "Real estate shelter analysis", "Social Security optimizer"] },
    { category: "Smart Tools", items: ["Strategy assist (50 runs/mo)", "Smart closing scripts", "Smart opportunity scoring"] },
    { category: "Data & Reports", items: ["Knowledge library (10 docs)", "Client PDF reports", "Basic analytics dashboard"] },
  ],
  professional: [
    { category: "Everything in Beginner, plus:", items: ["10 advisor seats", "Team invitations & management", "Role-based access control"] },
    { category: "Advanced Features", items: ["Unlimited strategy runs", "Note summarization", "Advisor chat assistant", "Predictive analytics"] },
    { category: "Compliance & Audit", items: ["Full audit log", "Compliance center", "Activity tracking", "E-signature disclaimers"] },
    { category: "Premium Support", items: ["Priority email support", "Onboarding assistance", "Monthly strategy review"] },
  ],
  enterprise: [
    { category: "Everything in Professional, plus:", items: ["25+ advisor seats", "Custom seat allocation", "Multi-workspace support"] },
    { category: "White Label", items: ["Custom branding & domain", "White-label deployment", "Custom landing page"] },
    { category: "Enterprise Features", items: ["Custom knowledge ingestion", "API access", "SSO integration", "Dedicated account manager"] },
    { category: "Premium Support", items: ["Priority implementation", "Compliance review", "Quarterly business review", "24/7 phone support"] },
  ],
};

const COMPARISON_FEATURES = [
  { name: "Advisor Seats", beginner: "3", professional: "10", enterprise: "25+" },
  { name: "CRM & Pipeline", beginner: true, professional: true, enterprise: true },
  { name: "Financial Calculators", beginner: true, professional: true, enterprise: true },
  { name: "Strategy Runs", beginner: "50/mo", professional: "Unlimited", enterprise: "Unlimited" },
  { name: "Knowledge Library", beginner: "10 docs", professional: "Unlimited", enterprise: "Unlimited" },
  { name: "Team Management", beginner: false, professional: true, enterprise: true },
  { name: "Audit Log", beginner: false, professional: true, enterprise: true },
  { name: "Compliance Center", beginner: false, professional: true, enterprise: true },
  { name: "Chat Assistant", beginner: false, professional: true, enterprise: true },
  { name: "Predictive Analytics", beginner: false, professional: true, enterprise: true },
  { name: "White-Label Branding", beginner: false, professional: false, enterprise: true },
  { name: "API Access", beginner: false, professional: false, enterprise: true },
  { name: "SSO Integration", beginner: false, professional: false, enterprise: true },
  { name: "Dedicated Account Manager", beginner: false, professional: false, enterprise: true },
  { name: "Priority Support", beginner: false, professional: true, enterprise: "24/7" },
];

/** All tools and services included with a subscription */
const INCLUDED_SERVICES = [
  "Full CRM & Client Management System with pipeline tracking",
  "Advanced Strategy Generation Engine (Roth conversion, IUL, real estate)",
  "Social Security Optimization Calculator",
  "Retirement Income Gap Analysis Tool",
  "Goals-Based Financial Planning Suite",
  "IUL Historical Performance Modeling with Time Machine",
  "Roth Conversion Ladder & Tax Bracket Optimizer",
  "Real Estate Tax Shelter & House Recycling Calculator",
  "Mortgage Killer Analysis Tool",
  "Estate Tax Planning Calculator",
  "Lifetime Guaranteed Income Calculator",
  "FIA Top 10 Accumulation Database (state-by-state)",
  "MYGA Fixed Rate Comparison Engine",
  "Carrier Rate Comparison & Financial Ratings",
  "Advisor Chat Assistant",
  "Meeting Notes Summarizer",
  "Smart Closing Script Generator",
  "Smart Opportunity Scoring",
  "Predictive Analytics Dashboard",
  "Client PDF Report Generator",
  "Knowledge Library & Document Management",
  "Team & Agency Management Tools",
  "Compliance Center & Audit Logging",
  "Meeting Scheduler & Calendar Integration",
  "Score Boosters & Sales Story Builder",
  "Quick Quote Engine",
  "Index Strategy Performance Tracker",
  "Market Data & Analytics Feed",
  "Education Hub & Advisor Training Resources",
  "Webhook & Integration Framework",
];

export default function Pricing() {
  const [interval, setInterval] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{ planSlug: string; interval: "MONTHLY" | "ANNUAL" } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const recordDisclosureMut = trpc.paymentCompliance.recordDisclosure.useMutation();
  const plansQuery = trpc.billing.plans.useQuery();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const checkoutMut = trpc.billing.createCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      toast.info("Redirecting to secure checkout…");
      window.open(checkoutUrl, "_blank");
      setShowDisclaimer(false);
      setCheckoutLoading(false);
      setPendingCheckout(null);
    },
    onError: (e) => { toast.error(`Checkout error: ${e.message}`); setCheckoutLoading(false); },
  });

  const plans = plansQuery.data ?? [];

  const handleSubscribe = useCallback((planSlug: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (planSlug === "enterprise") {
      window.location.href = "mailto:sam@russellcapitalsystems.com?subject=Enterprise%20Plan%20Inquiry";
      return;
    }
    // Show legal disclaimer before checkout
    setPendingCheckout({ planSlug, interval });
    setShowDisclaimer(true);
  }, [isAuthenticated, interval, navigate]);

  const handleDisclaimerAccept = useCallback(async (disclosureData: DisclosureData) => {
    if (!pendingCheckout) return;
    setCheckoutLoading(true);
    try {
      const plan = plans.find(p => p.slug === pendingCheckout.planSlug);
      const priceVal = pendingCheckout.interval === "ANNUAL" ? plan?.annualPrice : plan?.monthlyPrice;
      // Record disclosure in legal payment folder
      await recordDisclosureMut.mutateAsync({
        planSlug: pendingCheckout.planSlug,
        billingInterval: pendingCheckout.interval,
        priceAtAcceptance: String(priceVal ?? 0),
        payorFirstName: disclosureData.payorFirstName,
        payorLastName: disclosureData.payorLastName,
        payorBusinessEntity: disclosureData.payorBusinessEntity || undefined,
        payorAddress: disclosureData.payorAddress,
        payorCity: disclosureData.payorCity,
        payorState: disclosureData.payorState,
        payorZip: disclosureData.payorZip,
        payorPhone: disclosureData.payorPhone,
        payorEmail: disclosureData.payorEmail || undefined,
        signatureText: disclosureData.signatureText,
        pinVerifiedAt: disclosureData.pinVerifiedAt,
      });
      // Now create Stripe checkout
      checkoutMut.mutate({
        planSlug: pendingCheckout.planSlug as "beginner" | "professional" | "enterprise",
        interval: pendingCheckout.interval,
        origin: window.location.origin,
        agreementAcceptedAt: disclosureData.agreedAt,
      });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to record disclosure. Please try again.");
      setCheckoutLoading(false);
    }
  }, [pendingCheckout, plans, recordDisclosureMut, checkoutMut]);

  return (
    <div className="relative min-h-screen bg-[#060f20] text-[#c8d8ec]">
      <PageBackdrop src="/rcs-city-harbor.webp" phoneSrc="/rcs-city-towers.webp" alt="Green-lit harbour city at night, towers reflected in the water" fade="#060f20" position="center 35%" brightness=".5" />
      {/* Header */}
      <div className="relative z-10 border-b border-white/10">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#7a95b8] hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          {!isAuthenticated && (
            <Link href="/login" className="rc-btn rc-btn-secondary text-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="container relative z-10 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm font-medium mb-6">
            <Star size={14} /> 14-Day Free Trial on All Plans
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Plans That Scale<br />With Your Practice
          </h1>
          <p className="text-lg text-[#7a95b8] max-w-xl mx-auto">
            From solo advisors to enterprise firms — get the advanced tools, compliance features, and client management you need to grow.
          </p>
        </div>

        {/* Interval toggle */}
        <div className="flex flex-col items-center mt-10 gap-3">
          <div className="flex gap-1 bg-[#0b1628] rounded-xl p-1 border border-[#12233e]">
            <button
              onClick={() => setInterval("MONTHLY")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${interval === "MONTHLY" ? "bg-[#22c55e] text-white shadow-lg shadow-[#22c55e]/20" : "text-[#7a95b8] hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("ANNUAL")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all relative ${interval === "ANNUAL" ? "bg-[#22c55e] text-white shadow-lg shadow-[#22c55e]/20" : "text-[#7a95b8] hover:text-white"}`}
            >
              Annual
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                <Percent size={10} /> 20% OFF
              </span>
            </button>
          </div>
          {interval === "ANNUAL" && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard size={14} className="text-[#22c55e]" />
              <span className="text-[#22c55e] font-medium">Pay full year with credit card and save 25%</span>
            </div>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="container pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const colors = PLAN_COLORS[plan.slug] || PLAN_COLORS.beginner;
            const Icon = PLAN_ICONS[plan.slug] || Zap;
            const price = interval === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;
            const perMonth = interval === "ANNUAL" ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;
            const fullAnnual = plan.monthlyPrice * 12;
            const annualSavings = fullAnnual - plan.annualPrice;
            const isPopular = plan.slug === "professional";
            const detailedFeatures = DETAILED_FEATURES[plan.slug] ?? [];
            const isExpanded = expandedPlan === plan.slug;

            return (
              <div
                key={plan.slug}
                className={`relative rounded-2xl border ${isPopular ? "border-[#22c55e]/40 ring-2 ring-[#22c55e]/15" : "border-[#12233e]"} bg-[#0a1929] overflow-hidden transition-all hover:border-[#22c55e]/30`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#22c55e] via-[#22c55e]/80 to-[#22c55e]" />
                )}
                <div className="p-6">
                  {/* Plan header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                        <Icon size={18} className={colors.text} />
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{plan.name}</div>
                        <div className="text-xs text-[#7a95b8]">Up to {plan.seats} seats</div>
                      </div>
                    </div>
                    {isPopular && (
                      <span className="rc-badge rc-badge-green text-xs">Most Popular</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white">${perMonth.toLocaleString()}</span>
                      <span className="text-[#7a95b8] text-sm">/mo</span>
                    </div>
                    {interval === "ANNUAL" ? (
                      <div className="mt-1 space-y-0.5">
                        <div className="text-xs text-[#22c55e] font-medium">${price.toLocaleString()} billed annually</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[#7a95b8] line-through">${fullAnnual.toLocaleString()}/yr</span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold">
                            Save ${annualSavings.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#7a95b8] mt-1">Billed monthly</div>
                    )}
                  </div>

                  {/* Quick features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle size={14} className="text-[#22c55e] mt-0.5 shrink-0" />
                        <span className="text-[#c8d8ec]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.slug)}
                    disabled={checkoutMut.isPending}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? "bg-[#22c55e] text-white hover:bg-[#22c55e]/90 shadow-lg shadow-[#22c55e]/20"
                        : plan.slug === "enterprise"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
                          : "bg-white/8 text-white border border-[#12233e] hover:bg-white/12"
                    }`}
                  >
                    {checkoutMut.isPending ? (
                      <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Processing…</>
                    ) : plan.slug === "enterprise" ? (
                      <>Contact Sales <ArrowRight size={14} /></>
                    ) : (
                      <>Start Free Trial <ArrowRight size={14} /></>
                    )}
                  </button>

                  {/* Expand details */}
                  <button
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.slug)}
                    className="w-full mt-3 text-xs text-[#7a95b8] hover:text-white transition-colors text-center"
                  >
                    {isExpanded ? "Hide details" : "View all features"}
                  </button>

                  {/* Expanded features */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#12233e] space-y-4">
                      {detailedFeatures.map((cat) => (
                        <div key={cat.category}>
                          <div className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2">{cat.category}</div>
                          <ul className="space-y-1.5">
                            {cat.items.map((item) => (
                              <li key={item} className="flex items-start gap-2 text-xs">
                                <CheckCircle size={11} className="text-[#22c55e] mt-0.5 shrink-0" />
                                <span className="text-[#c8d8ec]">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Methods + Non-Refundable Disclaimer */}
      <div className="border-t border-[#12233e]">
        <div className="container py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Secure Payment Processing</h2>
            <p className="text-[#7a95b8] text-sm">All payments processed securely through Stripe. Your data is encrypted and never stored on our servers.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl mx-auto">
            {[
              { icon: CreditCard, label: "Credit Cards", sub: "Visa, Mastercard, Amex, Discover" },
              { icon: CreditCard, label: "Debit Cards", sub: "All major banks" },
              { icon: Lock, label: "Stripe Link", sub: "One-click checkout" },
              { icon: Shield, label: "Apple Pay", sub: "Supported devices" },
              { icon: Shield, label: "Google Pay", sub: "Supported devices" },
            ].map((method) => (
              <div key={method.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0a1929] border border-[#12233e] min-w-[180px]">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <method.icon size={16} className="text-[#22c55e]" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{method.label}</div>
                  <div className="text-[#7a95b8] text-xs">{method.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-[#7a95b8]">
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-[#22c55e]" /> 256-bit SSL Encryption</span>
            <span className="flex items-center gap-1.5"><Lock size={12} className="text-[#22c55e]" /> PCI DSS Compliant</span>
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-[#22c55e]" /> SOC 2 Type II</span>
          </div>

          {/* NON-REFUNDABLE DISCLAIMER */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-red-400 font-bold text-sm mb-2">Non-Refundable Payment Policy</div>
                  <p className="text-sm text-[#c8d8ec] leading-relaxed">
                    All subscription payments — whether monthly or annual — are <span className="text-white font-semibold">non-refundable</span>.
                    By subscribing to any Russell Capital Systems™ plan, you acknowledge and agree that all charges are final and no refunds
                    will be issued for any reason, including but not limited to early cancellation, unused subscription time, downgrade requests,
                    or dissatisfaction with the service. Cancellations take effect at the end of the current billing period. You will retain
                    access to all features until your subscription period expires. Annual subscribers who cancel will maintain access through
                    the remainder of their paid annual term.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="border-t border-[#12233e]">
        <div className="container py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Compare All Features</h2>
            <p className="text-[#7a95b8]">See exactly what's included in each plan</p>
          </div>
          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#12233e]">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#7a95b8] w-[40%]">Feature</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-blue-400 w-[20%]">Beginner</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-[#22c55e] w-[20%]">Professional</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-amber-400 w-[20%]">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, i) => (
                  <tr key={feature.name} className={`border-b border-[#12233e]/50 ${i % 2 === 0 ? "bg-[#0a1929]/30" : ""}`}>
                    <td className="py-3 px-4 text-sm text-[#c8d8ec]">{feature.name}</td>
                    {(["beginner", "professional", "enterprise"] as const).map((plan) => {
                      const val = feature[plan];
                      return (
                        <td key={plan} className="py-3 px-4 text-center text-sm">
                          {val === true ? (
                            <CheckCircle size={16} className="text-[#22c55e] mx-auto" />
                          ) : val === false ? (
                            <X size={16} className="text-[#7a95b8]/40 mx-auto" />
                          ) : (
                            <span className="text-[#c8d8ec] font-medium">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Estimated Benefits Section */}
      <div className="border-t border-[#12233e]">
        <div className="container py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Research-Based Estimated Subscriber Benefits</h2>
            <p className="text-[#7a95b8] max-w-2xl mx-auto">Based on published industry research for advisors spending 4-5 hours per working day on the platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-[#22c55e]/20 bg-gradient-to-b from-[#22c55e]/5 to-transparent p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-[#22c55e]" />
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">180–480%</div>
              <div className="text-[#22c55e] font-semibold text-sm mb-3">Research-Based Est. Annual Life Premium Increase</div>
              <p className="text-xs text-[#7a95b8] leading-relaxed">
                Industry research suggests advanced strategy generation, IUL modeling, and closing scripts help advisors identify more opportunities and close at higher rates. These are research-based estimates, not guaranteed production increases.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <DollarSign size={24} className="text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">240–600%</div>
              <div className="text-blue-400 font-semibold text-sm mb-3">Research-Based Est. Annual Annuity Premium Increase</div>
              <p className="text-xs text-[#7a95b8] leading-relaxed">
                Published research indicates state-by-state FIA and MYGA databases, Roth conversion strategies, and lifetime income calculators enable advisors to present more compelling annuity solutions. These are research-based estimates, not guaranteed production increases.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock size={24} className="text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">8–15 hrs</div>
              <div className="text-amber-400 font-semibold text-sm mb-3">Research-Based Est. Time Saved Per Week</div>
              <p className="text-xs text-[#7a95b8] leading-relaxed">
                Automated CRM workflows, automated meeting note summarization, one-click report generation, and pre-built financial models eliminate manual work. These are research-based estimates, not guaranteed time savings.
              </p>
            </div>
          </div>
          <div className="mt-6 max-w-3xl mx-auto">
            <p className="text-[10px] text-[#7a95b8]/60 text-center leading-relaxed italic">
              * These figures are research-based estimates derived from independent industry research and published advisor productivity studies.
              They do not constitute a guarantee, warranty, or promise of specific production increases. Actual results vary significantly based on individual
              effort, market conditions, client base, geographic location, experience level, regulatory environment, and other factors beyond the control of
              Russell Holdings Management LLC d/b/a Russell Capital Systems™. Past performance of other subscribers or research subjects is not indicative of future results.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="border-t border-[#12233e]">
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Shield, title: "Bank-Grade Security", desc: "All data encrypted at rest and in transit. SOC 2 Type II compliant infrastructure." },
              { icon: Users, title: "Built for Advisors", desc: "Designed by financial professionals who understand compliance, client management, and beginner." },
              { icon: Headphones, title: "Dedicated Support", desc: "Get help when you need it. Professional and Enterprise plans include priority support." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon size={20} className="text-[#22c55e]" />
                </div>
                <div className="text-white font-bold mb-2">{item.title}</div>
                <p className="text-sm text-[#7a95b8]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-[#12233e]">
        <div className="container py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: "Can I cancel anytime?", a: "Yes. All plans can be cancelled at any time from your billing settings. Cancellations take effect at the end of your current billing period. Please note that all payments are non-refundable." },
              { q: "What payment methods do you accept?", a: "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover), Stripe Link for one-click checkout, Apple Pay, and Google Pay." },
              { q: "How does the 25% annual discount work?", a: "When you choose annual billing and pay the full year upfront with a credit card, you receive a 25% discount off the total annual cost compared to paying monthly. This is a one-time annual charge that covers 12 months of access." },
              { q: "Is there a free trial?", a: "Yes! All plans include a 14-day free trial. No credit card required to start. You'll only be charged after the trial period ends." },
              { q: "Can I upgrade or downgrade my plan?", a: "Absolutely. You can change your plan at any time from the Billing page. Upgrades take effect immediately, and downgrades take effect at the end of your current billing period." },
              { q: "Are payments refundable?", a: "No. All subscription payments are non-refundable. By subscribing, you agree that all charges are final. Cancellations take effect at the end of the current billing period, and you retain access until that date." },
              { q: "Is my data secure?", a: "Yes. We use 256-bit SSL encryption, and all payment processing is handled by Stripe (PCI DSS Level 1 compliant). Your financial data is never stored on our servers." },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-[#12233e] bg-[#0a1929] p-5">
                <div className="text-white font-semibold mb-2">{faq.q}</div>
                <p className="text-sm text-[#7a95b8]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-[#12233e]">
        <div className="container py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Practice?</h2>
          <p className="text-[#7a95b8] mb-8 max-w-lg mx-auto">Join hundreds of financial advisors using Russell Capital Systems™ to grow their business with advanced tools.</p>
          <div className="flex items-center justify-center gap-4">
            <a href={isAuthenticated ? "/portal/dashboard" : getLoginUrl("/portal/dashboard")} className="rc-btn rc-btn-primary px-8 py-3 text-base">
              Start Free Trial <ArrowRight size={16} />
            </a>
            <a href="mailto:sam@russellcapitalsystems.com" className="rc-btn rc-btn-secondary px-8 py-3 text-base">
              Contact Sales
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#12233e] py-6">
        <div className="container text-center text-xs text-[#7a95b8] space-y-2">
          <p>Russell Holdings Management LLC d/b/a Russell Capital Systems™. All plans include a 14-day free trial. Prices shown in USD.</p>
          <p className="text-red-400/80 font-medium">All payments are non-refundable. By subscribing, you agree to our terms of service and refund policy.</p>
        </div>
      </div>

      {/* Legal Disclaimer & Payment Compliance Modal */}
      {showDisclaimer && pendingCheckout && (() => {
        const plan = plans.find(p => p.slug === pendingCheckout.planSlug);
        const priceVal = pendingCheckout.interval === "ANNUAL" ? (plan?.annualPrice ?? 0) : (plan?.monthlyPrice ?? 0);
        return (
          <SubscriptionDisclaimer
            planName={pendingCheckout.planSlug.charAt(0).toUpperCase() + pendingCheckout.planSlug.slice(1)}
            interval={pendingCheckout.interval}
            price={priceVal}
            onAccept={handleDisclaimerAccept}
            onDecline={() => { setShowDisclaimer(false); setPendingCheckout(null); }}
            isLoading={checkoutLoading || checkoutMut.isPending}
          />
        );
      })()}
    </div>
  );
}
