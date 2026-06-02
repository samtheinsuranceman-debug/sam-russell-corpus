import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, FileText, AlertTriangle, Scale, Lock, CheckCircle2, PenTool, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

/* ─── Legal Content Data ─── */

const TERMS_SECTIONS = [
  {
    id: "scope",
    title: "1. Scope of Service",
    body: `Equity Express Inc. & Drass Wealth Management LLC provides educational calculators, charts, visualizations, and user-directed modeling tools for general informational use only. The website does not provide carrier-issued illustrations, insurance quotes, underwriting decisions, guarantees, or personalized legal, tax, accounting, actuarial, investment, or insurance advice.`,
  },
  {
    id: "no-illustration",
    title: "2. No Insurance Illustration; No Reliance",
    body: `Any output, chart, report, or summary generated through this website is not a life insurance illustration, not a policy ledger, not a quote, not a policy proposal, and not a supplemental illustration. It may not be relied upon as the basis for purchasing, replacing, financing, exchanging, or surrendering any insurance or financial product.`,
  },
  {
    id: "historical",
    title: "3. Historical and Hypothetical Results",
    body: `Any historical data, back-tested information, hypothetical calculations, or scenario modeling provided through this website is educational only. Such material depends on assumptions, formulas, data availability, and user inputs, and does not predict or guarantee future market behavior, future credited rates, future policy values, future tax treatment, or future financial results.`,
  },
  {
    id: "user-responsibility",
    title: "4. User Responsibility",
    body: `Users are solely responsible for the information entered into the tool, all assumptions selected, and all interpretations or decisions made from any website output. Users agree not to interpret any output as individualized advice or as a substitute for carrier-issued materials or professional advice.`,
  },
  {
    id: "no-advice",
    title: "5. No Advisory or Fiduciary Relationship",
    body: `Use of the website does not create any fiduciary, advisory, broker-client, attorney-client, accountant-client, insurance-client, or other professional relationship. No duty is undertaken to monitor, update, verify, correct, or warn regarding user assumptions, calculations, outputs, or decisions.`,
  },
  {
    id: "prohibited",
    title: "6. Prohibited Uses",
    list: [
      "Representing any website output as a carrier-issued illustration, ledger, quote, or product projection.",
      "Using any output as the sole basis for a purchase, replacement, financing, exchange, or surrender decision.",
      "Removing, obscuring, or altering required disclosures, legends, or acknowledgments.",
      "Misattributing any output to an insurer, policy form, licensed producer, or regulated financial institution.",
      "Using the website or any generated output in violation of insurance, advertising, consumer protection, privacy, securities, or other applicable law.",
    ],
  },
  {
    id: "warranty",
    title: "7. No Warranty",
    body: `The website and all content, tools, outputs, data, and software are provided "as is" and "as available" without warranties of any kind, express or implied, including accuracy, completeness, merchantability, fitness for a particular purpose, noninfringement, availability, security, or uninterrupted operation.`,
  },
  {
    id: "liability",
    title: "8. Limitation of Liability",
    body: `To the fullest extent permitted by law, Equity Express Inc. & Drass Wealth Management LLC, its affiliates, owners, officers, employees, contractors, licensors, and representatives shall not be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages arising from or relating to the use of, inability to use, reliance on, or misuse of the website, the tools, or any generated output, including loss of profits, tax consequences, policy outcomes, lost opportunity, financing decisions, replacement decisions, data loss, or regulatory issues.`,
  },
  {
    id: "indemnity",
    title: "9. Indemnification",
    body: `You agree to defend, indemnify, and hold harmless Equity Express Inc. & Drass Wealth Management LLC, its affiliates, owners, officers, employees, contractors, licensors, and representatives from and against claims, liabilities, damages, losses, costs, and expenses, including reasonable attorneys' fees, arising out of your use of the website, your misuse of any output, your violation of these Terms, or your violation of any law or third-party right.`,
  },
  {
    id: "changes",
    title: "10. Changes and Availability",
    body: `We may modify, suspend, restrict, or discontinue any feature, tool, methodology, formula, assumption set, content, or output format at any time without notice. We are under no obligation to preserve any prior output, export, or methodology.`,
  },
  {
    id: "law",
    title: "11. Governing Law; Venue; Arbitration",
    body: `These Terms shall be governed by the laws of the State of Delaware, without regard to conflict-of-law principles. Any dispute arising out of or relating to the website or these Terms shall be resolved exclusively by binding arbitration in New Castle, Delaware, except that Equity Express Inc. & Drass Wealth Management LLC may seek injunctive or equitable relief in a court of competent jurisdiction to protect intellectual property, confidential information, or platform integrity.`,
  },
  {
    id: "severability",
    title: "12. Severability",
    body: `If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
  },
  {
    id: "contact",
    title: "13. Contact",
    body: `Questions regarding these Terms may be directed to Equity Express Inc. & Drass Wealth Management LLC, Wilmington, Delaware, at support@drasswealthmanagement.com.`,
  },
];

const DISCLAIMER_PARAGRAPHS = [
  `The tools, calculators, charts, and reports on this website are provided solely for general educational and informational purposes.`,
  `They are designed to demonstrate how selected historical market index movements may interact with user-selected formulas or assumptions. They are not life insurance policy illustrations, are not issued by any insurance company, and do not represent the current illustrated scale, disciplined current scale, currently payable scale, premiums, policy charges, policy values, death benefits, surrender values, loan performance, lapse risk, or any other guaranteed or nonguaranteed element of any life insurance policy.`,
  `No output generated by this website is a solicitation, recommendation, offer, or promise regarding any specific life insurance product, insurer, policy form, or policy outcome. Historical index performance, hypothetical crediting calculations, and user-generated scenarios are not predictive of future results and are not representations or estimates of future index changes, future credited rates, or future policy performance.`,
  `This website does not provide legal, tax, accounting, investment, fiduciary, actuarial, or insurance advice. Any discussion of life insurance, indexed universal life insurance, policy loans, taxation, retirement planning, estate planning, or business planning is general in nature only and may not apply to your circumstances.`,
  `No insurance purchase, replacement, exchange, surrender, financing decision, tax decision, or planning decision should be made based on this website or any output it generates. Any decision regarding a life insurance policy should be based only on a carrier-issued illustration and the applicable policy form, reviewed with a properly licensed insurance professional authorized to discuss the product in the applicable jurisdiction.`,
  `Use of this website does not create an advisory, fiduciary, broker-client, attorney-client, accountant-client, or other professional relationship. By using this website, you acknowledge that you are solely responsible for how you interpret and use any information or output generated here.`,
];

const INTERNAL_POLICY_SECTIONS = [
  {
    title: "Purpose",
    body: `This policy governs the use of all website calculators, historical modeling tools, back-testing tools, charts, downloadable reports, and similar educational software made available through Equity Express Inc. & Drass Wealth Management LLC.`,
  },
  {
    title: "Policy Statement",
    body: `These tools are educational resources only. They are not approved carrier illustrations and may not be used as substitutes for carrier-issued materials in any insurance solicitation, recommendation, replacement analysis, or application process.`,
  },
  {
    title: "Prohibited Conduct",
    list: [
      "Describing any website output as an illustration, ledger, proposal, quote, carrier numbers, or policy projection.",
      "Stating or implying that any historical or hypothetical result is likely, expected, projected, or representative of future policy performance.",
      "Pairing tool output with a specific insurer or policy unless a carrier-issued illustration is separately provided and clearly identified as the only official illustration.",
      "Using the tool to show policy performance more favorably than a carrier-issued illustration.",
      "Emailing, texting, screen-sharing, posting, or presenting tool output as part of a policy recommendation without prior compliance approval.",
      "Using tool output in any policy replacement, exchange, premium-financing, rollover, or similar recommendation.",
      "Removing or altering any disclosure, watermark, acknowledgment, or educational-use legend from any output.",
    ],
  },
  {
    title: "Required Procedure When a Prospect Requests Numbers",
    orderedList: [
      "Stop using the educational tool for product discussion.",
      "State that the website output is educational only and not a policy illustration.",
      "Obtain a carrier-issued illustration through approved channels.",
      "Use only the carrier-issued illustration for policy-specific discussion.",
      "Retain the carrier illustration and any required acknowledgments in the client file.",
    ],
  },
  {
    title: "Recordkeeping",
    list: [
      "Maintain current versions of website disclaimers and Terms.",
      "Maintain version history of tool disclosures.",
      "Store compliance approvals for any producer training related to tool use.",
      "Maintain logs of complaints, inquiries, corrections, and sample exports used in production.",
    ],
  },
  {
    title: "Training and Certification",
    body: `All producers and staff with access to the tool must complete annual training and certify that they understand the educational-only nature of the tool, the prohibition on using it as a carrier illustration, and the requirement that policy-specific discussions use carrier-issued illustrations only.`,
  },
  {
    title: "Enforcement",
    body: `Violation of this policy may result in immediate removal of access, internal discipline, mandatory remediation, reporting to compliance leadership, reporting to carriers where required, and any other corrective action deemed appropriate.`,
  },
];

const ACKNOWLEDGMENTS = [
  "This tool is for educational and informational purposes only.",
  "Any report or output may include historical data, hypothetical calculations, and user-selected assumptions that do not predict future results.",
  "No output represents any insurer's current illustrated scale, disciplined current scale, currently payable scale, premiums, charges, policy values, policy loan results, death benefits, or tax treatment.",
  "I will not rely on this tool or any output from it as the sole basis for purchasing, replacing, financing, exchanging, or surrendering any life insurance policy or other financial product.",
  "Any actual life insurance discussion must be based solely on a carrier-issued illustration and applicable policy materials.",
  "No legal, tax, accounting, investment, fiduciary, actuarial, or insurance advice is being provided through this tool.",
  "My use of this tool is subject to the website Terms of Use and Privacy Policy.",
];

/* ─── Compliance is now DB-backed (no localStorage) ─── */

/* ─── Sub-components ─── */

function SectionCard({
  title,
  body,
  list,
  orderedList,
  id,
}: {
  title: string;
  body?: string;
  list?: string[];
  orderedList?: string[];
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
    >
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      {body && <p className="text-sm text-slate-300 leading-relaxed">{body}</p>}
      {list && (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          {list.map((item) => (
            <li key={item} className="text-sm text-slate-300 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}
      {orderedList && (
        <ol className="list-decimal pl-5 space-y-2 mt-2">
          {orderedList.map((item) => (
            <li key={item} className="text-sm text-slate-300 leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

type TabId = "tool-page" | "terms" | "disclaimer" | "internal-policy";

const TABS: { id: TabId; label: string; icon: typeof Shield }[] = [
  { id: "tool-page", label: "Tool Page", icon: Shield },
  { id: "terms", label: "Terms of Use", icon: FileText },
  { id: "disclaimer", label: "Public Disclaimer", icon: AlertTriangle },
  { id: "internal-policy", label: "Internal Policy", icon: Lock },
];

/* ─── Main Page Component ─── */

interface ComplianceDisclosureProps {
  returnTo?: string;
  onSigned?: (sessionId: number) => void;
  isAnonymous?: boolean;
}

export default function ComplianceDisclosure({ returnTo, onSigned, isAnonymous }: ComplianceDisclosureProps) {
  const [, navigate] = useLocation();
  const signMut = trpc.complianceTracking.sign.useMutation();
  const [signing, setSigning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("tool-page");
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array(ACKNOWLEDGMENTS.length).fill(false)
  );
  const [signatureName, setSignatureName] = useState("");
  const [signatureEmail, setSignatureEmail] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [showSignatureSection, setShowSignatureSection] = useState(false);

  // Set today's date as default
  useEffect(() => {
    const today = new Date();
    const formatted = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(
      today.getDate()
    ).padStart(2, "0")}/${today.getFullYear()}`;
    setSignatureDate(formatted);
  }, []);

  const allChecked = checkedItems.every(Boolean);
  const nameValid = signatureName.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signatureEmail.trim());
  const dateValid = signatureDate.trim().length >= 8;
  const canSign = allChecked && nameValid && emailValid && dateValid;

  const toggleCheck = useCallback(
    (index: number) => {
      setCheckedItems((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        return next;
      });
    },
    []
  );

  const termsToc = useMemo(
    () =>
      TERMS_SECTIONS.filter((s) =>
        [
          "scope",
          "no-illustration",
          "historical",
          "user-responsibility",
          "no-advice",
          "prohibited",
          "warranty",
          "liability",
          "indemnity",
          "law",
        ].includes(s.id)
      ),
    []
  );

  const handleSign = async () => {
    if (!canSign || signing) return;
    setSigning(true);
    try {
      // Store email in localStorage for all users
      try { localStorage.setItem("rc_user_email", signatureEmail.trim()); } catch {}
      if (isAnonymous) {
        if (onSigned) {
          onSigned(0);
        } else {
          navigate(returnTo || "/portal/dashboard");
        }
        return;
      }
      const result = await signMut.mutateAsync({
        signedName: signatureName.trim(),
        signedDate: signatureDate.trim(),
        userAgent: navigator.userAgent,
      });
      if (result.success && result.sessionId && onSigned) {
        onSigned(result.sessionId);
      } else {
        navigate(returnTo || "/portal/dashboard");
      }
    } catch (err) {
      console.error("Failed to sign compliance:", err);
      // If the sign mutation fails (e.g. not authenticated), allow entry anyway
      // The compliance disclaimer + name signature is the ONLY gate
      if (onSigned) {
        onSigned(0);
        return;
      }
      navigate(returnTo || "/portal/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1020] to-[#0d1430] text-slate-100">
      {/* Hero Section */}
      <section className="pt-14 pb-5">
        <div className="w-[min(100%-32px,1040px)] mx-auto">
          <span className="inline-block text-xs tracking-[0.12em] uppercase text-blue-400 font-bold mb-2.5">
            Educational Modeling Tool
          </span>
          <h1 className="text-[clamp(34px,5vw,50px)] font-bold leading-[1.15] mb-3.5 text-white">
            Historical Index Modeling & Disclosure Center
          </h1>
          <p className="text-slate-400">
            Equity Express Inc. & Drass Wealth Management LLC — Compliance &
            Disclosure Center
          </p>

          {/* Important Disclosure Banner */}
          <div className="rounded-[14px] p-4 border border-yellow-500/30 bg-yellow-500/[0.08] my-5">
            <strong className="block mb-1.5 text-yellow-300">
              <AlertTriangle className="inline w-4 h-4 mr-1.5 -mt-0.5" />
              Important Disclosure
            </strong>
            <p className="text-sm text-slate-300 leading-relaxed">
              This tool is for general educational use only. It is not a
              carrier-issued life insurance illustration, not a quote, not a
              policy proposal, and not a prediction of future policy performance.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-gradient-to-b from-[#121933] to-[#0f1730] border border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.28)] p-6 space-y-3.5">
            <p className="text-sm text-slate-300 leading-relaxed">
              Outputs may include historical data, hypothetical calculations, and
              user-selected assumptions. They do not represent any insurer's
              current illustrated scale, disciplined current scale, premiums,
              policy charges, policy values, surrender values, death benefits,
              loan performance, lapse risk, or tax treatment.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Do not use any report generated by this tool as the basis for
              purchasing, replacing, financing, exchanging, or surrendering a
              life insurance policy or other financial product.
            </p>

            <div className="flex flex-wrap gap-3 mt-5">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3.5 font-semibold text-[15px] bg-gradient-to-b from-blue-500 to-blue-700 text-white transition hover:-translate-y-0.5"
                onClick={() => setShowSignatureSection(true)}
              >
                <PenTool className="w-4 h-4 mr-2" />
                Sign & Enter
              </button>
              <a
                href="#terms-anchor"
                className="inline-flex items-center justify-center rounded-xl px-4 py-3.5 font-semibold text-[15px] border border-white/10 bg-transparent text-slate-100 hover:bg-white/[0.04] transition"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("terms");
                }}
              >
                Terms of Use
              </a>
              <a
                href="#disclaimer-anchor"
                className="inline-flex items-center justify-center rounded-xl px-4 py-3.5 font-semibold text-[15px] border border-white/10 bg-transparent text-slate-100 hover:bg-white/[0.04] transition"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("disclaimer");
                }}
              >
                Public Disclaimer
              </a>
              <a
                href="#internal-anchor"
                className="inline-flex items-center justify-center rounded-xl px-4 py-3.5 font-semibold text-[15px] border border-white/10 bg-transparent text-slate-100 hover:bg-white/[0.04] transition"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("internal-policy");
                }}
              >
                Internal Policy
              </a>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/10 text-slate-400 text-[13px]">
              By continuing, you agree that any actual insurance discussion must
              rely only on a carrier-issued illustration and applicable policy
              materials.
            </div>
          </div>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="py-8">
        <div className="w-[min(100%-32px,1040px)] mx-auto">
          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-2.5 mb-5" role="tablist" aria-label="Compliance sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-medium border transition ${
                    activeTab === tab.id
                      ? "bg-gradient-to-b from-blue-500 to-blue-700 border-transparent text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tool Page Tab */}
          {activeTab === "tool-page" && (
            <div className="bg-gradient-to-b from-[#121933] to-[#0f1730] border border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.28)] p-6 space-y-3.5">
              <h2 className="text-[clamp(24px,3vw,32px)] font-bold text-white mb-3.5">
                Tool Entry Page
              </h2>

              <div className="rounded-[14px] p-4 border border-red-500/20 bg-red-500/[0.08]">
                <strong className="block mb-1.5 text-red-300">
                  <AlertTriangle className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                  Before Using This Tool
                </strong>
                <p className="text-sm text-slate-300">
                  Educational calculator only. Not a carrier-issued life insurance
                  illustration. Historical and hypothetical outputs do not predict
                  future results.
                </p>
              </div>

              <div className="mt-5 p-4 border border-dashed border-white/10 rounded-[14px] bg-white/[0.02]">
                <div className="border border-white/10 rounded-[14px] p-4 bg-white/[0.03] min-h-[180px] space-y-3.5">
                  <h3 className="text-xl font-semibold text-white mb-3.5">
                    <Scale className="inline w-5 h-5 mr-2 -mt-0.5 text-blue-400" />
                    Russell Capital Solutions™ Tools
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Access to all financial modeling tools, strategy builders,
                    calculators, and educational resources requires acknowledgment
                    of the terms below.
                  </p>

                  <div className="rounded-[14px] p-4 border border-red-500/20 bg-red-500/[0.08]">
                    <strong className="block mb-1.5 text-red-300">
                      Results Disclosure
                    </strong>
                    <p className="text-sm text-slate-300">
                      This report is educational output only. It is not a life
                      insurance illustration, not an insurer projection, and not a
                      basis for a policy purchase, replacement, financing,
                      exchange, or surrender decision. Any actual policy discussion
                      must rely on a carrier-issued illustration.
                    </p>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-white/10 text-slate-400 text-[13px]">
                    Educational output only. Not a carrier-issued life insurance
                    illustration. Not for policy purchase, replacement,
                    financing, exchange, or surrender decisions.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terms of Use Tab */}
          {activeTab === "terms" && (
            <div
              className="bg-gradient-to-b from-[#121933] to-[#0f1730] border border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.28)] p-6 space-y-3.5"
              id="terms-anchor"
            >
              <span className="inline-block text-xs tracking-[0.12em] uppercase text-blue-400 font-bold">
                Legal
              </span>
              <h2 className="text-[clamp(24px,3vw,32px)] font-bold text-white mb-3.5">
                Terms of Use
              </h2>
              <p className="text-slate-400 text-sm">Effective Date: April 1, 2026</p>

              <div className="flex flex-wrap gap-2.5 mb-5">
                {termsToc.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="inline-block px-3 py-2.5 border border-white/10 rounded-full bg-white/[0.03] text-slate-200 text-sm no-underline hover:bg-white/[0.06] transition"
                  >
                    {section.title.replace(/^\d+\.\s*/, "")}
                  </a>
                ))}
              </div>

              {TERMS_SECTIONS.map((section) => (
                <SectionCard key={section.id} {...section} />
              ))}
            </div>
          )}

          {/* Public Disclaimer Tab */}
          {activeTab === "disclaimer" && (
            <div
              className="bg-gradient-to-b from-[#121933] to-[#0f1730] border border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.28)] p-6 space-y-3.5"
              id="disclaimer-anchor"
            >
              <span className="inline-block text-xs tracking-[0.12em] uppercase text-blue-400 font-bold">
                Disclosure
              </span>
              <h2 className="text-[clamp(24px,3vw,32px)] font-bold text-white mb-3.5">
                Educational Tool Disclaimer
              </h2>

              <div className="rounded-[14px] p-4 border border-yellow-500/30 bg-yellow-500/[0.08]">
                <strong className="block mb-1.5 text-yellow-300">
                  General Educational Use Only
                </strong>
                <p className="text-sm text-slate-300">
                  The tools, calculators, charts, and reports on this website are
                  provided solely for general educational and informational
                  purposes.
                </p>
              </div>

              {DISCLAIMER_PARAGRAPHS.map((paragraph, i) => (
                <p key={i} className="text-sm text-slate-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-lg font-semibold text-white mb-3">Contact</h3>
                <p className="text-sm text-slate-300">
                  Equity Express Inc. & Drass Wealth Management LLC
                  <br />
                  Wilmington, Delaware
                  <br />
                  <a
                    href="mailto:support@drasswealthmanagement.com"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    support@drasswealthmanagement.com
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Internal Policy Tab */}
          {activeTab === "internal-policy" && (
            <div
              className="bg-gradient-to-b from-[#121933] to-[#0f1730] border border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.28)] p-6 space-y-3.5"
              id="internal-anchor"
            >
              <span className="inline-block text-xs tracking-[0.12em] uppercase text-blue-400 font-bold">
                Internal Compliance
              </span>
              <h2 className="text-[clamp(24px,3vw,32px)] font-bold text-white mb-3.5">
                Producer Internal-Use Policy
              </h2>
              <p className="text-slate-400 text-sm">
                For internal staff and producer use only.
              </p>

              {INTERNAL_POLICY_SECTIONS.map((section) => (
                <SectionCard
                  key={section.title}
                  title={section.title}
                  body={section.body}
                  list={section.list}
                  orderedList={section.orderedList}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* E-Signature Section */}
      {showSignatureSection && (
        <section className="py-8" id="esign-section">
          <div className="w-[min(100%-32px,1040px)] mx-auto">
            <div className="bg-gradient-to-b from-[#121933] to-[#0f1730] border-2 border-blue-500/30 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.28)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <PenTool className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Electronic Signature Required
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Please review and accept all acknowledgments, then sign below
                    to proceed
                  </p>
                </div>
              </div>

              {/* Danger Notice */}
              <div className="rounded-[14px] p-4 border border-red-500/20 bg-red-500/[0.08] mb-6">
                <strong className="block mb-1.5 text-red-300">
                  <AlertTriangle className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                  Not a Life Insurance Illustration
                </strong>
                <p className="text-sm text-slate-300">
                  This tool is an educational calculator only. It is not a
                  carrier-issued illustration, policy ledger, quote,
                  recommendation, or solicitation.
                </p>
              </div>

              {/* Acknowledgments */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-6">
                <p className="text-white font-semibold mb-4">
                  I acknowledge and agree that:
                </p>
                <div className="space-y-3">
                  {ACKNOWLEDGMENTS.map((item, index) => (
                    <label
                      key={index}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        checkedItems[index]
                          ? "border-green-500/30 bg-green-500/[0.08]"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[index]}
                        onChange={() => toggleCheck(index)}
                        className="mt-1 scale-110 accent-green-500"
                      />
                      <span
                        className={`text-sm leading-relaxed ${
                          checkedItems[index] ? "text-green-200" : "text-slate-300"
                        }`}
                      >
                        {item}
                      </span>
                      {checkedItems[index] && (
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Master Checkbox */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border mb-6 cursor-pointer transition ${
                  allChecked
                    ? "border-blue-500/30 bg-blue-500/[0.08]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={() => {
                    const newVal = !allChecked;
                    setCheckedItems(new Array(ACKNOWLEDGMENTS.length).fill(newVal));
                  }}
                  className="mt-1 scale-125 accent-blue-500"
                />
                <span className="text-sm text-white font-semibold leading-relaxed">
                  I understand that this tool is educational only, is not a
                  carrier-issued life insurance illustration, and may not be
                  relied on to make an insurance purchase or replacement decision.
                </span>
              </label>

              {/* E-Signature Fields */}
              <div className="rounded-xl border border-white/10 bg-[#0a1020] p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">
                  <PenTool className="inline w-5 h-5 mr-2 -mt-0.5 text-blue-400" />
                  E-Signature
                </h3>
                <p className="text-slate-400 text-sm mb-5">
                  Type your full legal name and today's date to electronically
                  sign this acknowledgment.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Legal Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Type your full name..."
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-serif text-lg italic"
                      autoComplete="name"
                    />
                    {signatureName.trim().length > 0 && (
                      <p className="mt-2 text-sm text-slate-400">
                        Signature preview:{" "}
                        <span className="font-serif italic text-blue-300 text-lg">
                          {signatureName}
                        </span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={signatureEmail}
                      onChange={(e) => setSignatureEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                      autoComplete="email"
                    />
                    {signatureEmail.trim().length > 0 && !emailValid && (
                      <p className="mt-2 text-xs text-red-400">Please enter a valid email address</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={signatureDate}
                      onChange={(e) => setSignatureDate(e.target.value)}
                      placeholder="MM/DD/YYYY"
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-4 mb-6 text-sm">
                <div
                  className={`flex items-center gap-1.5 ${
                    allChecked ? "text-green-400" : "text-slate-500"
                  }`}
                >
                  {allChecked ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-500" />
                  )}
                  All acknowledged
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <div
                  className={`flex items-center gap-1.5 ${
                    nameValid ? "text-green-400" : "text-slate-500"
                  }`}
                >
                  {nameValid ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-500" />
                  )}
                  Name signed
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <div
                  className={`flex items-center gap-1.5 ${
                    dateValid ? "text-green-400" : "text-slate-500"
                  }`}
                >
                  {dateValid ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-500" />
                  )}
                  Date entered
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSign}
                  disabled={!canSign || signing}
                  className={`inline-flex items-center justify-center rounded-xl px-6 py-3.5 font-semibold text-[15px] transition ${
                    canSign
                      ? "bg-gradient-to-b from-green-500 to-green-700 text-white hover:-translate-y-0.5 cursor-pointer"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {signing ? "Signing..." : "I Agree and Continue"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3.5 font-semibold text-[15px] border border-white/10 bg-transparent text-slate-100 hover:bg-white/[0.04] transition"
                  onClick={() => setShowSignatureSection(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="w-[min(100%-32px,1040px)] mx-auto text-center text-slate-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Equity Express Inc. & Drass Wealth
            Russell Holdings Management LLC. All rights reserved. www.RussellCapitalSystems.com is owned by Russell Holdings Management LLC.
          </p>
          <p className="mt-2">
            Wilmington, Delaware &middot;{" "}
            <a
              href="mailto:support@drasswealthmanagement.com"
              className="text-blue-400 hover:text-blue-300"
            >
              support@drasswealthmanagement.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
