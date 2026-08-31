import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Target,
  Lock,
  Layers,
  BarChart3,
  MessageCircle,
  Fingerprint,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";

interface Patent {
  id: string;
  title: string;
  filingDate: string;
  claimCount: number;
  status: string;
  icon: typeof Shield;
  color: string;
  summary: string;
  keyClaims: string[];
  competitiveAdvantage: string;
}

const PATENTS: Patent[] = [
  {
    id: "PAT-001",
    title: "Cascading Multi-Calculator Financial Planning Engine",
    filingDate: "2024",
    claimCount: 8,
    status: "Patent Pending",
    icon: Layers,
    color: "#22c55e",
    summary: "A system and method for cascading multiple financial calculators in a unified engine where the output of one calculator automatically feeds as input to the next, creating a holistic financial plan. The engine processes IUL projections, Roth conversions, HELOC optimization, divorce asset protection, and tax-free income strategies in a single computational pipeline.",
    keyClaims: [
      "Automated cascading of financial calculator outputs as inputs to downstream calculators",
      "Real-time recalculation across all connected calculators when any single input changes",
      "Unified dashboard displaying aggregate results from multiple simultaneous financial models",
      "Dynamic scenario comparison across cascaded calculator chains",
    ],
    competitiveAdvantage: "No competing platform connects multiple financial calculators into a single cascading pipeline. Each tool operates in isolation elsewhere — Russell Capital's engine is the first to chain them.",
  },
  {
    id: "PAT-002",
    title: "HELOC-to-IUL Arbitrage Optimization Engine",
    filingDate: "2024",
    claimCount: 6,
    status: "Patent Pending",
    icon: Zap,
    color: "#3b82f6",
    summary: "A method for optimizing the conversion of home equity line of credit (HELOC) funds into Indexed Universal Life (IUL) premium payments, calculating optimal timing, amounts, and repayment schedules to maximize the arbitrage spread between HELOC interest rates and IUL crediting rates over 20-50 year horizons.",
    keyClaims: [
      "Automated calculation of optimal HELOC-to-IUL premium conversion amounts and timing",
      "Dynamic interest rate spread analysis between HELOC cost and IUL crediting potential",
      "Multi-decade projection engine for HELOC repayment vs. IUL cash value accumulation",
      "Risk-adjusted scenario modeling for variable HELOC rates against IUL floor/cap structures",
    ],
    competitiveAdvantage: "First patented system to specifically model and optimize the HELOC-to-IUL arbitrage strategy with dynamic rate spread analysis.",
  },
  {
    id: "PAT-003",
    title: "AI Whisper Coaching System for Financial Advisors",
    filingDate: "2024",
    claimCount: 7,
    status: "Patent Pending",
    icon: MessageCircle,
    color: "#8b5cf6",
    summary: "An artificial intelligence system that provides real-time conversational coaching to financial advisors during client meetings. The system analyzes client responses, financial data, and conversation context to suggest optimal talking points, objection handlers, and next-best-action recommendations through a private advisor-only interface.",
    keyClaims: [
      "Real-time AI analysis of client conversation context to generate advisor coaching prompts",
      "Dynamic objection handling suggestions based on client sentiment and financial profile",
      "Integration with live financial calculator outputs to suggest data-driven talking points",
      "Private advisor-only display channel invisible to the client during joint sessions",
      "Learning system that improves coaching quality based on advisor feedback and close rates",
    ],
    competitiveAdvantage: "No existing financial planning platform offers real-time AI coaching during live client meetings with integrated calculator data.",
  },
  {
    id: "PAT-004",
    title: "Wealth Genome Scoring & Classification System",
    filingDate: "2024",
    claimCount: 5,
    status: "Patent Pending",
    icon: Fingerprint,
    color: "#ec4899",
    summary: "A system for generating a unique 'Wealth Genome' score and classification for each client based on multi-dimensional analysis of their financial DNA — including income patterns, tax exposure, risk tolerance, asset allocation, debt structure, insurance coverage, and behavioral tendencies. The Wealth Genome drives personalized strategy recommendations.",
    keyClaims: [
      "Multi-dimensional financial profiling algorithm generating a unique Wealth Genome score",
      "Classification system mapping Wealth Genome scores to optimal financial strategy templates",
      "Dynamic Wealth Genome recalculation as client circumstances change over time",
      "Comparative analytics showing client's Wealth Genome relative to peer cohorts",
    ],
    competitiveAdvantage: "First system to create a comprehensive, multi-factor 'financial DNA' profile that drives automated strategy recommendations.",
  },
  {
    id: "PAT-005",
    title: "Tax-Free Retirement Income Waterfall Engine",
    filingDate: "2024",
    claimCount: 6,
    status: "Patent Pending",
    icon: BarChart3,
    color: "#f97316",
    summary: "A computational engine that models and optimizes the waterfall sequence of tax-free retirement income sources — including IUL policy loans, Roth distributions, municipal bond income, and Health Savings Account withdrawals — to minimize lifetime tax liability while maximizing income durability across 30-50 year retirement horizons.",
    keyClaims: [
      "Automated optimization of tax-free income source sequencing across multiple account types",
      "Dynamic rebalancing of withdrawal waterfall based on changing tax law scenarios",
      "Integration with Social Security timing optimization to minimize taxation of benefits",
      "Monte Carlo simulation of waterfall sequences under 10,000+ economic scenarios",
    ],
    competitiveAdvantage: "First engine to specifically optimize the sequencing of multiple tax-free income sources as an integrated waterfall strategy.",
  },
  {
    id: "PAT-006",
    title: "Divorce Asset Protection Calculator with IUL Shielding",
    filingDate: "2024",
    claimCount: 5,
    status: "Patent Pending",
    icon: Shield,
    color: "#06b6d4",
    summary: "A specialized calculator that models the asset protection benefits of Indexed Universal Life insurance in divorce scenarios, projecting the differential outcomes between protected (IUL/ILIT) and unprotected asset structures across equitable distribution, community property, and hybrid state frameworks.",
    keyClaims: [
      "State-specific divorce asset classification modeling for IUL cash values and death benefits",
      "Side-by-side projection of protected vs. unprotected asset outcomes in divorce scenarios",
      "ILIT (Irrevocable Life Insurance Trust) integration for enhanced asset shielding analysis",
      "Dynamic modeling of IRS Code Section 72(e) and IRC Section 101(a) protections",
    ],
    competitiveAdvantage: "No existing calculator specifically models IUL asset protection in divorce scenarios with state-specific legal framework integration.",
  },
  {
    id: "PAT-007",
    title: "Ecological Drivers Retirement Risk Assessment Framework",
    filingDate: "2024",
    claimCount: 5,
    status: "Patent Pending",
    icon: Target,
    color: "#ef4444",
    summary: "A comprehensive retirement risk assessment framework that identifies, quantifies, and visualizes the 10 primary 'ecological drivers' that determine retirement success or failure. The system generates personalized risk scores across each driver and maps IUL protection capabilities against each identified threat.",
    keyClaims: [
      "Multi-factor retirement risk scoring across 10 ecological driver dimensions",
      "Automated mapping of IUL product features to specific retirement risk factors",
      "Visual radar chart generation comparing market-only vs. structured protection scores",
      "Personalized risk assessment based on client-specific financial data and demographics",
    ],
    competitiveAdvantage: "First framework to systematically identify and score 10 retirement failure factors with automated IUL protection mapping.",
  },
  {
    id: "PAT-008",
    title: "Behavioral Lock-In Prevention System for Retirement Portfolios",
    filingDate: "2024",
    claimCount: 5,
    status: "Patent Pending",
    icon: Lock,
    color: "#14b8a6",
    summary: "A system that detects and prevents behavioral lock-in errors in retirement portfolio management — including panic selling, performance chasing, and premature withdrawal — by providing real-time behavioral analytics, automated guardrails, and AI-driven intervention prompts when destructive patterns are detected.",
    keyClaims: [
      "Real-time behavioral pattern detection in client portfolio management actions",
      "Automated guardrail triggers when destructive behavioral patterns are identified",
      "AI-driven intervention prompts with personalized messaging based on client psychology profile",
      "Historical behavioral error tracking and cost quantification for client education",
    ],
    competitiveAdvantage: "First system to combine real-time behavioral detection with automated intervention in retirement portfolio management.",
  },
];

const totalClaims = PATENTS.reduce((sum, p) => sum + p.claimCount, 0);

export default function PatentShowcase() {
  const { user } = useAuth();
  const [expandedPatent, setExpandedPatent] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-medium">
          <Brain size={14} /> Intellectual Property Portfolio
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Patent Applications & Proprietary Technology
        </h1>
        <p className="text-[#7a95b8] max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
          Russell Capital Systems has filed {PATENTS.length} patent applications with the United States Patent and Trademark Office (USPTO),
          covering {totalClaims} unique claims across our proprietary financial planning technology stack.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#22c55e]/10 to-[#22c55e]/5 border-[#22c55e]/20">
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-[#22c55e]">{PATENTS.length}</div>
            <div className="text-xs text-[#7a95b8] mt-1">Patent Applications Filed</div>
            <div className="text-[10px] text-[#22c55e]/70 mt-2">USPTO Patent Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-blue-400">{totalClaims}</div>
            <div className="text-xs text-[#7a95b8] mt-1">Total Patent Claims</div>
            <div className="text-[10px] text-blue-400/70 mt-2">Unique intellectual property claims</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-5 text-center">
            <div className="text-3xl font-bold text-purple-400">100%</div>
            <div className="text-xs text-[#7a95b8] mt-1">Proprietary Technology</div>
            <div className="text-[10px] text-purple-400/70 mt-2">All technology developed in-house</div>
          </CardContent>
        </Card>
      </div>

      {/* Patent List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText size={18} className="text-[#22c55e]" />
          Filed Patent Applications
        </h2>

        {PATENTS.map((patent, idx) => {
          const Icon = patent.icon;
          const isExpanded = expandedPatent === patent.id;

          return (
            <Card key={patent.id} className={`bg-[#0a1628] border-[#12233e] overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-[#22c55e]/30" : ""}`}>
              <button
                onClick={() => setExpandedPatent(isExpanded ? null : patent.id)}
                className="w-full text-left p-4 md:p-5 flex items-center gap-4 hover:bg-[#12233e]/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: patent.color + "15", border: `1px solid ${patent.color}30` }}>
                  <Icon size={20} style={{ color: patent.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8]">
                      {patent.id}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e]">
                      {patent.status}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {patent.claimCount} Claims
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-white mt-1">{patent.title}</h3>
                  <p className="text-xs text-[#7a95b8]">Filed {patent.filingDate} | USPTO</p>
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? <ChevronUp size={18} className="text-[#7a95b8]" /> : <ChevronDown size={18} className="text-[#7a95b8]" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 md:px-5 pb-5 space-y-4 border-t border-[#12233e]">
                  <div className="pt-4">
                    <h4 className="text-xs font-bold text-white mb-2">Summary</h4>
                    <p className="text-sm text-[#c8d6e5] leading-relaxed">{patent.summary}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <Shield size={14} className="text-[#22c55e]" />
                      Key Claims
                    </h4>
                    <div className="space-y-2">
                      {patent.keyClaims.map((claim, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#c8d6e5]">
                          <span className="text-[#22c55e] font-mono font-bold flex-shrink-0">Claim {i + 1}:</span>
                          <span>{claim}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#22c55e]/10 to-[#0a1628] border border-[#22c55e]/20 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-[#22c55e] mb-1">Competitive Advantage</h4>
                    <p className="text-xs text-[#c8d6e5] leading-relaxed">{patent.competitiveAdvantage}</p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Legal Notice */}
      <div className="bg-[#0a1628] border border-[#12233e] rounded-xl p-5 text-center space-y-2">
        <p className="text-xs text-[#7a95b8]">
          All patent applications are filed with the United States Patent and Trademark Office (USPTO).
          "Patent Pending" status indicates applications have been submitted and are under review.
          The intellectual property described herein is owned by Russell Holdings Management LLC.
        </p>
        <p className="text-[10px] text-[#4a6a8e]">
          Unauthorized use, reproduction, or implementation of patented or patent-pending technology is prohibited.
        </p>
      </div>

      <NAICDisclaimer variant="footer" showsProjections={false} showsCashValues={false} showsComparisons={false} />
      <PageInsights pageId="patent-showcase" />
    </div>
  );
}
