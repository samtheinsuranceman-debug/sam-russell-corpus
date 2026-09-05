import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, AlertTriangle, FileText, Shield, Scale, Clock, TrendingUp, DollarSign, Users, Brain, BarChart3, BookOpen, Lock, Phone, MapPin, User, Building2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

interface SubscriptionDisclaimerProps {
  planName: string;
  interval: "MONTHLY" | "ANNUAL";
  price: number;
  onAccept: (disclosureData: DisclosureData) => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export interface DisclosureData {
  payorFirstName: string;
  payorLastName: string;
  payorBusinessEntity: string;
  payorAddress: string;
  payorCity: string;
  payorState: string;
  payorZip: string;
  payorPhone: string;
  payorEmail: string;
  signatureText: string;
  pinVerifiedAt: string;
  agreedAt: string;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

const TOOL_CATEGORIES = [
  {
    category: "CRM & Client Management",
    icon: Users,
    tools: [
      "Client Database & Profile Management",
      "Lead Tracking & Pipeline Management",
      "Meeting Scheduler & Calendar Integration",
      "Client Fact Finder & Intake Forms",
      "Communication Log & Activity Tracking",
      "Client Portal Configuration",
      "Email Campaign Management",
    ],
  },
  {
    category: "Retirement Planning Tools",
    icon: TrendingUp,
    tools: [
      "Social Security Optimizer",
      "Ecological Drivers Retirement Analysis",
      "Income Gap Analysis Calculator",
      "Goals-Based Retirement Planning",
      "Withdrawal Sequencing Optimizer",
      "Medicare IRMAA Calculator",
      "Retirement Income Projection Engine",
    ],
  },
  {
    category: "Wealth & Tax Strategy Tools",
    icon: Scale,
    tools: [
      "Strategy Lab — Multi-Strategy Comparison",
      "Roth Conversion Strategies (6 Methods)",
      "Strategy Compare Side-by-Side",
      "Scenario Builder & Multi-Scenario Play",
      "IUL vs Roth Comparison Engine",
      "Risk Tolerance Assessment",
      "Advanced Strategy Recommender",
      "Tax Waterfall Analysis",
      "Tax Bracket Visualization",
      "Tax-Advantaged Growth Calculator",
      "Estate Tax Planning Tool",
      "Estate Flow Chart Generator",
    ],
  },
  {
    category: "Insurance & Annuity Tools",
    icon: Shield,
    tools: [
      "Lifetime Guaranteed Income Calculator",
      "Growth Annuity Comparison Engine",
      "MYGA Fixed Rate Analyzer with S&P 500 Comparison",
      "Premium Financing Calculator",
      "Existing Annuity Review Tool",
      "S&P 500 Axonic Index Strategy",
      "Athene PE Plus 15 Analyzer",
      "Athene Guaranteed Income Modeler",
      "Top 10 Income Annuities by State",
      "Top 10 FIA Accumulation by State",
      "Annuity Accumulation Database (All 50 States + DC)",
      "Advisor Income Calculator",
    ],
  },
  {
    category: "IUL & Index Performance Tools",
    icon: BarChart3,
    tools: [
      "IUL Historical Performance Engine",
      "Index Strategy Comparison Tool",
      "Income Timeline Projector",
      "Policy Loan Optimizer",
      "Time Machine Calculator",
      "AG 49 Compounding Analyzer",
      "Dual Illustration Method",
      "Index Backtester (Historical Data)",
    ],
  },
  {
    category: "Real Estate & Mortgage Tools",
    icon: DollarSign,
    tools: [
      "House Recycling Strategy Calculator",
      "Mortgage Killer Analysis Tool",
      "Household Wealth Dashboard",
      "Hot Income (Oil & Gas) Strategy",
      "Real Estate Mogul Planning Tool",
    ],
  },
  {
    category: "Carrier & Quoting Tools",
    icon: FileText,
    tools: [
      "Carrier Rate Comparison Engine",
      "Multi-Carrier Side-by-Side Compare",
      "Illustration Compare Tool",
      "Carrier Financial Ratings & COMDEX Scores",
      "Instant Carrier Quotes Generator",
      "Business Owner Insurance Planning",
      "Crypto Corner — Digital Asset Strategy",
    ],
  },
  {
    category: "Productivity Tools",
    icon: Brain,
    tools: [
      "Strategy Assistant",
      "Advisor Chat",
      "Smart Meeting Notes & Summarization",
      "Document Template Library",
      "Tax Return OCR & Analysis",
      "Collaborative Planning Workspace",
      "Policy Review Checklist",
      "Predictive Analytics Dashboard",
      "Market Data & Insights Feed",
      "Portfolio Rebalance Tool",
    ],
  },
  {
    category: "Education & Training",
    icon: BookOpen,
    tools: [
      "Education Hub — Continuing Education Content",
      "Advisor Training Modules",
      "Individual Agent Tutorial Program",
      "Agency Leader Tutorial Program",
    ],
  },
  {
    category: "Compliance & Administration",
    icon: Lock,
    tools: [
      "Compliance Center & Audit Trail",
      "Compliance Alerts & Monitoring",
      "Compliance Reports Generator",
      "Legal Disclaimers Management",
      "Team Member Management",
      "Agency Team Administration",
      "Owner Oversight Dashboard",
      "Webhook & API Integrations",
    ],
  },
];

const TOTAL_TOOLS = TOOL_CATEGORIES.reduce((sum, cat) => sum + cat.tools.length, 0);

type Step = "legal" | "identity" | "verify" | "sign";

export default function SubscriptionDisclaimer({
  planName,
  interval,
  price,
  onAccept,
  onDecline,
  isLoading,
}: SubscriptionDisclaimerProps) {
  const [step, setStep] = useState<Step>("legal");
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [legalAgreed, setLegalAgreed] = useState(false);

  // Payor identity fields
  const [payorFirstName, setPayorFirstName] = useState("");
  const [payorLastName, setPayorLastName] = useState("");
  const [payorBusinessEntity, setPayorBusinessEntity] = useState("");
  const [payorAddress, setPayorAddress] = useState("");
  const [payorCity, setPayorCity] = useState("");
  const [payorState, setPayorState] = useState("");
  const [payorZip, setPayorZip] = useState("");
  const [payorPhone, setPayorPhone] = useState("");
  const [payorEmail, setPayorEmail] = useState("");

  // PIN verification
  const [pinCode, setPinCode] = useState("");
  const [pinSent, setPinSent] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [pinVerifiedAt, setPinVerifiedAt] = useState("");
  const [pinExpiresAt, setPinExpiresAt] = useState("");

  // E-signature
  const [signatureText, setSignatureText] = useState("");
  const [signatureDate, setSignatureDate] = useState(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  );
  const [finalAgreed, setFinalAgreed] = useState(false);

  const sendPinMut = trpc.paymentCompliance.sendPin.useMutation();
  const verifyPinMut = trpc.paymentCompliance.verifyPin.useMutation();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 40;
    if (isAtBottom) setHasScrolledToBottom(true);
  };

  const effectiveDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Normalize phone to digits only
  const normalizePhone = (p: string) => p.replace(/\D/g, "");

  const handleSendPin = useCallback(async () => {
    const digits = normalizePhone(payorPhone);
    if (digits.length < 10) {
      toast.error("Please enter a valid phone number (at least 10 digits).");
      return;
    }
    try {
      const result = await sendPinMut.mutateAsync({ phone: digits });
      setPinSent(true);
      setPinExpiresAt(result.expiresAt);
      toast.success("A 6-digit verification PIN has been sent. Check your phone.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send PIN. Please try again.");
    }
  }, [payorPhone, sendPinMut]);

  const handleVerifyPin = useCallback(async () => {
    const digits = normalizePhone(payorPhone);
    if (pinCode.length !== 6) {
      toast.error("Please enter the 6-digit PIN.");
      return;
    }
    try {
      const result = await verifyPinMut.mutateAsync({ phone: digits, code: pinCode });
      setPinVerified(true);
      setPinVerifiedAt(result.verifiedAt);
      toast.success("Phone number verified successfully.");
    } catch (err: any) {
      toast.error(err.message ?? "Verification failed. Please try again.");
    }
  }, [payorPhone, pinCode, verifyPinMut]);

  const identityComplete =
    payorFirstName.trim().length > 0 &&
    payorLastName.trim().length > 0 &&
    payorAddress.trim().length > 0 &&
    payorCity.trim().length > 0 &&
    payorState.length > 0 &&
    payorZip.trim().length >= 5 &&
    normalizePhone(payorPhone).length >= 10;

  const signatureComplete =
    signatureText.trim().length > 0 &&
    finalAgreed &&
    pinVerified;

  const handleFinalAccept = () => {
    onAccept({
      payorFirstName: payorFirstName.trim(),
      payorLastName: payorLastName.trim(),
      payorBusinessEntity: payorBusinessEntity.trim(),
      payorAddress: payorAddress.trim(),
      payorCity: payorCity.trim(),
      payorState,
      payorZip: payorZip.trim(),
      payorPhone: normalizePhone(payorPhone),
      payorEmail: payorEmail.trim(),
      signatureText: signatureText.trim(),
      pinVerifiedAt,
      agreedAt: new Date().toISOString(),
    });
  };

  // Step indicator
  const steps: { key: Step; label: string }[] = [
    { key: "legal", label: "Legal Agreement" },
    { key: "identity", label: "Payor Identity" },
    { key: "verify", label: "Phone Verification" },
    { key: "sign", label: "E-Signature" },
  ];
  const currentStepIdx = steps.findIndex((s) => s.key === step);

  const inputCls = "w-full bg-[#060f20] border border-[#1a3050] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#3d5a7a] focus:outline-none focus:ring-1 focus:ring-[#22c55e]/50 focus:border-[#22c55e]/50 transition-colors";
  const labelCls = "block text-xs font-medium text-[#7a95b8] mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#0d1b30] border border-[#1a3050] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1a3050] bg-[#0b1628]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center">
              <FileText size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Payment Disclosure & E-Signature</h2>
              <p className="text-[#7a95b8] text-sm">Required by Delaware law before payment processing</p>
            </div>
          </div>
          {/* Step progress */}
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 ${i <= currentStepIdx ? "text-[#22c55e]" : "text-[#3d5a7a]"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < currentStepIdx ? "bg-[#22c55e] text-white" :
                    i === currentStepIdx ? "bg-[#22c55e]/20 border border-[#22c55e] text-[#22c55e]" :
                    "bg-[#0b1628] border border-[#1a3050] text-[#3d5a7a]"
                  }`}>
                    {i < currentStepIdx ? <CheckCircle size={10} /> : i + 1}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${i < currentStepIdx ? "bg-[#22c55e]/40" : "bg-[#1a3050]"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Legal Agreement */}
        {step === "legal" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5" onScroll={handleScroll}>
              <div className="space-y-6 text-sm text-[#c8d8ec] leading-relaxed">
                <div className="text-center border-b border-[#1a3050] pb-5">
                  <h3 className="text-white font-bold text-xl mb-1">RUSSELL CAPITAL SYSTEMS</h3>
                  <p className="text-[#7a95b8] text-sm">Subscription Services Agreement & Disclosure</p>
                  <p className="text-[#7a95b8] text-xs mt-2">Effective Date: {effectiveDate} | Governed by the Laws of the State of Delaware</p>
                </div>

                {/* Section 1 */}
                <div>
                  <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#22c55e]/15 flex items-center justify-center text-[#22c55e] text-xs font-bold">1</span>
                    Subscription Agreement
                  </h4>
                  <p className="mb-3">
                    By subscribing to the <span className="text-white font-semibold">{planName}</span> plan
                    ({interval === "ANNUAL" ? "Annual" : "Monthly"} billing at <span className="text-white font-semibold">${price.toLocaleString()}/{interval === "ANNUAL" ? "year" : "month"}</span>),
                    you ("Subscriber," "You," or "Your") agree to the terms and conditions set forth in this Subscription Services
                    Agreement & Disclosure ("Agreement") with Russell Holdings Management LLC, doing business as Russell Capital Solutions™ ("Company," "We," "Us," or "Our"). www.RussellCapitalSystems.com is owned by Russell Holdings Management LLC.
                  </p>
                  <p>
                    This Agreement constitutes a legally binding contract between You and the Company, governed by the laws of the
                    State of Delaware. For and in consideration of Your {interval === "ANNUAL" ? "annual" : "monthly"} subscription
                    payment, You shall receive access to the financial tools, services, and resources described in Section 2 below
                    for the duration of Your active subscription period.
                  </p>
                </div>

                {/* Section 2: Tools */}
                <div>
                  <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#22c55e]/15 flex items-center justify-center text-[#22c55e] text-xs font-bold">2</span>
                    Financial Tools & Services Included ({TOTAL_TOOLS} Tools)
                  </h4>
                  <p className="mb-4">
                    For the consideration of Your subscription, You shall have access to the following financial tools and services
                    throughout the duration of Your active subscription:
                  </p>
                  <div className="space-y-4">
                    {TOOL_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <div key={cat.category} className="rounded-xl border border-[#12233e] bg-[#0b1628]/60 p-4">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-6 h-6 rounded-md bg-[#22c55e]/10 flex items-center justify-center">
                              <Icon size={12} className="text-[#22c55e]" />
                            </div>
                            <span className="text-white font-semibold text-sm">{cat.category}</span>
                            <span className="text-[#7a95b8] text-xs ml-auto">{cat.tools.length} tools</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            {cat.tools.map((tool) => (
                              <div key={tool} className="flex items-start gap-2 text-xs">
                                <CheckCircle size={11} className="text-[#22c55e] mt-0.5 shrink-0" />
                                <span className="text-[#c8d8ec]">{tool}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Estimated Benefits */}
                <div>
                  <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 text-xs font-bold">3</span>
                    Research-Based Estimated Benefits Disclosure
                  </h4>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-amber-200 text-xs font-medium">
                        IMPORTANT: The following estimates are derived from independent industry research, published advisor
                        productivity studies, and aggregated platform usage analytics. They are provided for informational
                        purposes only and <span className="underline">do not constitute a guarantee, warranty, or promise of
                        specific production increases</span>. These are research-based projections — not guaranteed outcomes.
                      </p>
                    </div>
                  </div>
                  <p className="mb-4">
                    Based on published industry research involving comprehensive financial planning platforms and CRM tools used for approximately
                    <span className="text-white font-semibold"> 4 to 5 hours per working day</span>, the following research-based estimated benefits have been documented:
                  </p>
                  <div className="rounded-xl border border-[#12233e] bg-[#0b1628]/60 p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={14} className="text-[#22c55e]" />
                      <span className="text-white font-semibold text-sm">Research-Based Est. Annual Life Premium Increase: 180%–480%</span>
                    </div>
                    <p className="text-xs text-[#7a95b8]">
                      This is a research-based estimate, not a guaranteed production increase. Past performance does not guarantee future results.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#12233e] bg-[#0b1628]/60 p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={14} className="text-[#22c55e]" />
                      <span className="text-white font-semibold text-sm">Research-Based Est. Annual Annuity Premium Increase: 240%–600%</span>
                    </div>
                    <p className="text-xs text-[#7a95b8]">
                      This is a research-based estimate, not a guaranteed production increase. Actual results depend on individual effort and market conditions.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#12233e] bg-[#0b1628]/60 p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-[#22c55e]" />
                      <span className="text-white font-semibold text-sm">Research-Based Est. Time Saved Per Week: 8–15 hours</span>
                    </div>
                    <p className="text-xs text-[#7a95b8]">
                      This is a research-based estimate, not a guaranteed outcome. Actual time savings vary by workflow and proficiency.
                    </p>
                  </div>
                </div>

                {/* Section 4: Payment Terms */}
                <div>
                  <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center text-red-400 text-xs font-bold">4</span>
                    Payment Terms & Non-Refundable Policy
                  </h4>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-3">
                    <p className="text-red-200 font-semibold text-xs mb-2">ALL PAYMENTS ARE NON-REFUNDABLE.</p>
                    <ul className="list-disc list-inside text-xs space-y-1.5 mt-2 text-[#c8d8ec]">
                      <li>All subscription payments — whether monthly or annual — are <span className="text-white font-semibold">final and non-refundable</span>.</li>
                      <li>No refunds will be issued for any reason, including early cancellation, unused time, downgrades, or dissatisfaction.</li>
                      <li>{interval === "ANNUAL"
                        ? `Your annual payment of $${price.toLocaleString()} reflects a 25% discount off the monthly rate when paid in full.`
                        : `Your monthly payment of $${price.toLocaleString()} will recur each month until cancelled.`
                      }</li>
                      <li>Cancellation takes effect at the end of the current billing period.</li>
                    </ul>
                  </div>
                </div>

                {/* Section 5: Disclaimers */}
                <div>
                  <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#22c55e]/15 flex items-center justify-center text-[#22c55e] text-xs font-bold">5</span>
                    General Disclaimers & Limitations
                  </h4>
                  <div className="space-y-3 text-xs">
                    <p><span className="text-white font-semibold">No Financial Advice:</span> Tools and content are for informational and educational purposes only. Nothing herein constitutes financial, investment, tax, or legal advice.</p>
                    <p><span className="text-white font-semibold">No Guarantee of Results:</span> The Company makes no guarantee, warranty, or promise regarding specific production increases, income improvements, or time savings.</p>
                    <p><span className="text-white font-semibold">Limitation of Liability:</span> The Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Total liability shall not exceed the amount paid by Subscriber in the twelve (12) months preceding the claim.</p>
                  </div>
                </div>

                {/* Section 6: Governing Law — DELAWARE */}
                <div>
                  <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#22c55e]/15 flex items-center justify-center text-[#22c55e] text-xs font-bold">6</span>
                    Governing Law & Dispute Resolution
                  </h4>
                  <p className="text-xs">
                    This Agreement shall be governed by and construed in accordance with the laws of the <span className="text-white font-semibold">State of Delaware</span>, without
                    regard to its conflict of law provisions. Any disputes arising under or in connection with this Agreement shall
                    be resolved through binding arbitration in accordance with the rules of the American Arbitration Association,
                    with the arbitration to be conducted in the State of Delaware. The prevailing party in any such arbitration shall
                    be entitled to recover its reasonable attorneys' fees and costs.
                  </p>
                </div>

                {/* Section 7: Consent & E-Signature */}
                <div>
                  <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#22c55e]/15 flex items-center justify-center text-[#22c55e] text-xs font-bold">7</span>
                    Consent, Verification & E-Signature Requirements
                  </h4>
                  <p className="text-xs mb-2">
                    By clicking the agreement checkbox below and proceeding through the subsequent verification steps, You consent to the following:
                  </p>
                  <ul className="list-disc list-inside text-xs space-y-1.5 text-[#c8d8ec]">
                    <li>You have read and understood all terms of this Agreement.</li>
                    <li>You will provide accurate payor identity information (name, address, zip code, phone number) attached to Your method of payment.</li>
                    <li>You will verify Your identity via a <span className="text-white font-semibold">6-digit PIN sent to Your phone number</span> prior to e-signature acceptance.</li>
                    <li>Your e-signature, IP address, user agent, and timestamp will be recorded and maintained in a secure legal payment compliance folder.</li>
                    <li>This record constitutes a binding agreement under the laws of the State of Delaware.</li>
                  </ul>
                </div>

                <div className="border-t border-[#1a3050] pt-4">
                  <p className="text-xs text-[#7a95b8]">
                    © {new Date().getFullYear()} Russell Holdings Management LLC d/b/a Russell Capital Solutions™. All rights reserved. www.RussellCapitalSystems.com is owned by Russell Holdings Management LLC.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#1a3050] bg-[#0b1628] space-y-3">
              {!hasScrolledToBottom && (
                <p className="text-amber-400 text-xs text-center flex items-center justify-center gap-1.5">
                  <AlertTriangle size={12} />
                  Please scroll to the bottom of the agreement to continue
                </p>
              )}
              <label className={`flex items-start gap-3 cursor-pointer ${!hasScrolledToBottom ? "opacity-50 pointer-events-none" : ""}`}>
                <input
                  type="checkbox"
                  checked={legalAgreed}
                  onChange={(e) => setLegalAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#1a3050] bg-[#0b1628] text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-0"
                />
                <span className="text-xs text-[#c8d8ec] leading-relaxed">
                  I have read, understand, and agree to the terms of this Subscription Services Agreement & Legal Disclaimer.
                  I acknowledge that all payments are <span className="text-red-400 font-semibold">non-refundable</span>,
                  that the estimated benefits are research-based and not guaranteed, and that this agreement is governed by
                  <span className="text-white font-semibold"> Delaware law</span>. By checking this box, I consent to the terms and conditions.
                </span>
              </label>
              <div className="flex gap-3">
                <button onClick={onDecline} className="flex-1 px-4 py-2.5 rounded-xl border border-[#1a3050] text-[#7a95b8] hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
                  Decline
                </button>
                <button
                  onClick={() => setStep("identity")}
                  disabled={!legalAgreed || !hasScrolledToBottom}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue — Payor Identity <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Payor Identity */}
        {step === "identity" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                    <User size={18} className="text-[#22c55e]" />
                    Payor Identity Information
                  </h3>
                  <p className="text-[#7a95b8] text-sm">
                    Please provide the name and billing address attached to the method of payment. This information is required
                    for legal compliance and will be stored in a secure payment disclosure record.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>First Name <span className="text-red-400">*</span></label>
                    <input type="text" value={payorFirstName} onChange={(e) => setPayorFirstName(e.target.value)} placeholder="John" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name <span className="text-red-400">*</span></label>
                    <input type="text" value={payorLastName} onChange={(e) => setPayorLastName(e.target.value)} placeholder="Smith" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Business Entity Name <span className="text-[#3d5a7a]">(if applicable)</span></label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d5a7a]" />
                    <input type="text" value={payorBusinessEntity} onChange={(e) => setPayorBusinessEntity(e.target.value)} placeholder="Acme Financial Group, LLC" className={`${inputCls} pl-9`} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Billing Address <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-[#3d5a7a]" />
                    <input type="text" value={payorAddress} onChange={(e) => setPayorAddress(e.target.value)} placeholder="123 Main Street, Suite 200" className={`${inputCls} pl-9`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>City <span className="text-red-400">*</span></label>
                    <input type="text" value={payorCity} onChange={(e) => setPayorCity(e.target.value)} placeholder="Wilmington" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>State <span className="text-red-400">*</span></label>
                    <select value={payorState} onChange={(e) => setPayorState(e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>ZIP Code <span className="text-red-400">*</span></label>
                    <input type="text" value={payorZip} onChange={(e) => setPayorZip(e.target.value)} placeholder="19801" maxLength={10} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Phone Number <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d5a7a]" />
                      <input type="tel" value={payorPhone} onChange={(e) => setPayorPhone(e.target.value)} placeholder="(555) 123-4567" className={`${inputCls} pl-9`} />
                    </div>
                    <p className="text-[10px] text-[#3d5a7a] mt-1">A 6-digit PIN will be sent to this number for verification</p>
                  </div>
                  <div>
                    <label className={labelCls}>Email Address <span className="text-[#3d5a7a]">(optional)</span></label>
                    <input type="email" value={payorEmail} onChange={(e) => setPayorEmail(e.target.value)} placeholder="john@example.com" className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#1a3050] bg-[#0b1628]">
              <div className="flex gap-3">
                <button onClick={() => setStep("legal")} className="px-4 py-2.5 rounded-xl border border-[#1a3050] text-[#7a95b8] hover:text-white hover:bg-white/5 transition-colors text-sm font-medium flex items-center gap-1.5">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep("verify")}
                  disabled={!identityComplete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue — Phone Verification <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Phone Verification */}
        {step === "verify" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                    <Phone size={18} className="text-[#22c55e]" />
                    Phone Number Verification
                  </h3>
                  <p className="text-[#7a95b8] text-sm">
                    A 6-digit verification PIN will be sent to <span className="text-white font-semibold">{payorPhone || "your phone"}</span>.
                    You must enter and verify this PIN before your e-signature can be accepted.
                  </p>
                </div>

                {!pinVerified ? (
                  <div className="space-y-4">
                    {!pinSent ? (
                      <div className="rounded-xl border border-[#1a3050] bg-[#0b1628] p-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mx-auto mb-4">
                          <Phone size={28} className="text-[#22c55e]" />
                        </div>
                        <p className="text-white font-semibold mb-2">Ready to Send Verification PIN</p>
                        <p className="text-[#7a95b8] text-sm mb-4">
                          We'll send a 6-digit code to <span className="text-white">{payorPhone}</span>. The code expires in 10 minutes.
                        </p>
                        <button
                          onClick={handleSendPin}
                          disabled={sendPinMut.isPending}
                          className="px-6 py-3 rounded-xl bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                        >
                          {sendPinMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : "Send Verification PIN"}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#1a3050] bg-[#0b1628] p-6">
                        <p className="text-white font-semibold mb-1 text-center">Enter Your 6-Digit PIN</p>
                        <p className="text-[#7a95b8] text-xs text-center mb-4">
                          Sent to {payorPhone} · Expires at {new Date(pinExpiresAt).toLocaleTimeString()}
                        </p>
                        <div className="flex justify-center gap-2 mb-4">
                          <input
                            type="text"
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            maxLength={6}
                            placeholder="000000"
                            className="w-48 text-center text-2xl tracking-[0.5em] bg-[#060f20] border border-[#1a3050] rounded-xl px-4 py-3 text-white placeholder:text-[#3d5a7a] focus:outline-none focus:ring-1 focus:ring-[#22c55e]/50 font-mono"
                          />
                        </div>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={handleVerifyPin}
                            disabled={pinCode.length !== 6 || verifyPinMut.isPending}
                            className="px-6 py-2.5 rounded-xl bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {verifyPinMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Verifying…</> : "Verify PIN"}
                          </button>
                          <button
                            onClick={handleSendPin}
                            disabled={sendPinMut.isPending}
                            className="px-4 py-2.5 rounded-xl border border-[#1a3050] text-[#7a95b8] hover:text-white hover:bg-white/5 transition-colors text-sm"
                          >
                            Resend PIN
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#22c55e]/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={28} className="text-[#22c55e]" />
                    </div>
                    <p className="text-white font-bold text-lg mb-1">Phone Verified</p>
                    <p className="text-[#7a95b8] text-sm">
                      {payorPhone} verified at {new Date(pinVerifiedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#1a3050] bg-[#0b1628]">
              <div className="flex gap-3">
                <button onClick={() => setStep("identity")} className="px-4 py-2.5 rounded-xl border border-[#1a3050] text-[#7a95b8] hover:text-white hover:bg-white/5 transition-colors text-sm font-medium flex items-center gap-1.5">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep("sign")}
                  disabled={!pinVerified}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue — E-Signature <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 4: E-Signature */}
        {step === "sign" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                    <FileText size={18} className="text-[#22c55e]" />
                    Electronic Signature
                  </h3>
                  <p className="text-[#7a95b8] text-sm">
                    Type your full legal name below to execute this agreement. Your e-signature, IP address, and timestamp
                    will be recorded as a binding acceptance under Delaware law.
                  </p>
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-[#1a3050] bg-[#0b1628] p-4 space-y-2">
                  <div className="text-xs text-[#7a95b8] uppercase tracking-wider font-medium mb-2">Agreement Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-[#7a95b8]">Plan:</span> <span className="text-white font-medium">{planName}</span></div>
                    <div><span className="text-[#7a95b8]">Billing:</span> <span className="text-white font-medium">{interval === "ANNUAL" ? "Annual (25% off)" : "Monthly"}</span></div>
                    <div><span className="text-[#7a95b8]">Amount:</span> <span className="text-white font-medium">${price.toLocaleString()}/{interval === "ANNUAL" ? "yr" : "mo"}</span></div>
                    <div><span className="text-[#7a95b8]">Governing Law:</span> <span className="text-white font-medium">State of Delaware</span></div>
                    <div><span className="text-[#7a95b8]">Payor:</span> <span className="text-white font-medium">{payorFirstName} {payorLastName}</span></div>
                    <div><span className="text-[#7a95b8]">Phone Verified:</span> <span className="text-[#22c55e] font-medium">✓ {payorPhone}</span></div>
                    {payorBusinessEntity && <div className="col-span-2"><span className="text-[#7a95b8]">Business:</span> <span className="text-white font-medium">{payorBusinessEntity}</span></div>}
                    <div className="col-span-2"><span className="text-[#7a95b8]">Address:</span> <span className="text-white font-medium">{payorAddress}, {payorCity}, {payorState} {payorZip}</span></div>
                  </div>
                </div>

                {/* Signature field */}
                <div>
                  <label className={labelCls}>Type Your Full Legal Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="John A. Smith"
                    className={`${inputCls} text-lg font-serif italic`}
                  />
                </div>

                <div>
                  <label className={labelCls}>Date of Signature</label>
                  <input type="text" value={signatureDate} readOnly className={`${inputCls} opacity-70`} />
                </div>

                {/* Final agreement checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={finalAgreed}
                    onChange={(e) => setFinalAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#1a3050] bg-[#0b1628] text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-0"
                  />
                  <span className="text-xs text-[#c8d8ec] leading-relaxed">
                    By typing my name above and checking this box, I am executing this Subscription Services Agreement
                    as my electronic signature under the laws of the State of Delaware. I confirm that I have read and
                    agree to all terms, that all payments are <span className="text-red-400 font-semibold">non-refundable</span>,
                    and that my identity has been verified via the 6-digit PIN sent to my phone. I consent to the recording
                    of my e-signature, IP address, and timestamp in a secure legal payment compliance record.
                  </span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#1a3050] bg-[#0b1628]">
              <div className="flex gap-3">
                <button onClick={() => setStep("verify")} className="px-4 py-2.5 rounded-xl border border-[#1a3050] text-[#7a95b8] hover:text-white hover:bg-white/5 transition-colors text-sm font-medium flex items-center gap-1.5">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleFinalAccept}
                  disabled={!signatureComplete || isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 size={14} className="animate-spin" /> Processing…</>
                  ) : (
                    <><CheckCircle size={14} /> Sign & Proceed to Checkout</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
