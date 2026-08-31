// @ts-nocheck
/**
 * ConsumerOutcomeBlocks — Shared components for consumer-outcome upgrades.
 * 
 * VISUAL IDENTITY:
 *   Executive Summary  → Playfair Display font, warm teal-to-gold gradient, serif elegance
 *   Goals Accelerator  → Space Grotesk font, deep amber-to-coral gradient, bold modern
 *   Recommendation     → Emerald/green confidence palette
 *   Do Nothing         → Red warning palette
 *   Tax Bracket Panel  → Violet analytical palette
 */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb, Target, TrendingUp, ArrowRight, ChevronDown, ChevronUp,
  DollarSign, Shield, Zap, Brain, Sparkles, AlertTriangle, CheckCircle2,
  HelpCircle, Rocket, BarChart3, Scale, BookOpen, MessageCircle,
  ArrowUpRight, Loader2,
} from "lucide-react";
import { useClientData } from "@/contexts/ClientDataContext";
import { trpc } from "@/lib/trpc";
import {
  calculateTax, calculateTaxSavings, formatTaxCurrency, formatTaxRate,
  type TaxResult, type TaxSavingsResult, type FilingStatus,
} from "@shared/taxBracketEngine";

// ════════════════════════════════════════════════════════════════════════════
// 1. EXECUTIVE SUMMARY — Playfair Display, Teal-to-Gold
// ════════════════════════════════════════════════════════════════════════════

export interface ExecutiveSummaryProps {
  pageTitle: string;
  whatItDoes: string;
  opportunities: string;
  intent: string;
  takeaway: string;
  callToAction?: string;
  followUpQuestions: string[];
  followUpLinks?: string[];
  className?: string;
}

export function ExecutiveSummary({
  pageTitle, whatItDoes, opportunities, intent, takeaway,
  callToAction, followUpQuestions, followUpLinks, className = "",
}: ExecutiveSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className={`relative overflow-hidden border-0 shadow-xl ${className}`}
      style={{ background: "linear-gradient(135deg, #0a2e2e 0%, #0d3b3b 30%, #1a3a2a 60%, #2a3520 100%)" }}>
      {/* Decorative top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #14b8a6, #d4a853, #f59e0b)" }} />
      
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #14b8a6, #d4a853)" }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-teal-400/70" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Executive Summary
              </p>
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#e8d5a3" }}>
                {pageTitle}
              </h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-teal-400/50 hover:text-teal-300">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-5 pt-0">
          {/* What This Page Does — Large, memorable text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" style={{ color: "#d4a853" }} />
              <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#d4a853" }}>
                What This Page Does For You
              </span>
            </div>
            <p className="text-base leading-relaxed" style={{ fontFamily: "'Playfair Display', serif", color: "#c8dcd0", fontSize: "1.05rem", lineHeight: "1.75" }}>
              {whatItDoes}
            </p>
          </div>

          {/* Overlooked Opportunities — Highlighted */}
          <div className="p-4 rounded-xl border" style={{ background: "rgba(20, 184, 166, 0.08)", borderColor: "rgba(20, 184, 166, 0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Opportunities You May Have Overlooked
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ fontFamily: "'Playfair Display', serif", color: "#a8c8b8", fontSize: "0.95rem", lineHeight: "1.7" }}>
              {opportunities}
            </p>
          </div>

          {/* Intent & Takeaway — Side by side cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl" style={{ background: "rgba(212, 168, 83, 0.06)", border: "1px solid rgba(212, 168, 83, 0.15)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4" style={{ color: "#b8a060" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#b8a060" }}>Our Intent</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ fontFamily: "'Playfair Display', serif", color: "#a0a080" }}>
                {intent}
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(20, 184, 166, 0.06)", border: "1px solid rgba(20, 184, 166, 0.15)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Key Takeaway</span>
              </div>
              <p className="text-[0.95rem] font-medium leading-relaxed" style={{ fontFamily: "'Playfair Display', serif", color: "#90d0c0" }}>
                {takeaway}
              </p>
            </div>
          </div>

          {/* Call to Action — Bold, large */}
          {callToAction && (
            <div className="p-4 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(212, 168, 83, 0.12))", border: "1px solid rgba(212, 168, 83, 0.25)" }}>
              <div className="flex items-center gap-3">
                <ArrowRight className="w-5 h-5" style={{ color: "#d4a853" }} />
                <span className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#e8d5a3" }}>
                  {callToAction}
                </span>
              </div>
            </div>
          )}

          {/* Follow-Up Questions */}
          {followUpQuestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-teal-500/70" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-500/70" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Questions Worth Exploring Next
                </span>
              </div>
              <div className="space-y-2">
                {followUpQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg transition-colors"
                    style={{ background: "rgba(20, 184, 166, 0.04)", border: "1px solid rgba(20, 184, 166, 0.08)" }}>
                    <HelpCircle className="w-4 h-4 text-teal-500/50 mt-0.5 shrink-0" />
                    <span className="text-sm leading-relaxed" style={{ fontFamily: "'Playfair Display', serif", color: "#90b0a0" }}>
                      {q}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. YOUR STATED GOALS ACCELERATOR — Space Grotesk, Amber-to-Coral
// ════════════════════════════════════════════════════════════════════════════

export interface GoalsAcceleratorProps {
  pageName: string;
  pageContext: string;
  calculatorResults?: string;
  className?: string;
}

export function GoalsAccelerator({
  pageName, pageContext, calculatorResults, className = "",
}: GoalsAcceleratorProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { clientData } = useClientData();
  const goalsAccelerator = trpc.ai.goalsAccelerator.useMutation();

  const clientGoals = useMemo(() => {
    if (!clientData) return null;
    return {
      retirementAge: clientData.retirementAge,
      annualIncomeNeeded: clientData.annualIncomeNeeded,
      legacyGoal: clientData.legacyGoal,
      currentAge: clientData.age,
      currentIncome: clientData.annualIncome,
      netWorth: (clientData.cashSavings || 0) + (clientData.taxableInvestments || 0) +
        (clientData.realEstateEquity || 0) + (clientData.iraBalance || 0) +
        (clientData.rothBalance || 0) + (clientData.k401Balance || 0) +
        (clientData.annuityValue || 0) + (clientData.lifeInsuranceCv || 0) -
        (clientData.mortgageBalance || 0) - (clientData.otherDebt || 0),
      clientName: clientData.clientName,
    };
  }, [clientData]);

  const handleAnalyze = async () => {
    if (!clientGoals) return;
    setIsLoading(true);
    try {
      const result = await goalsAccelerator.mutateAsync({
        pageName,
        pageContext,
        calculatorResults: calculatorResults || "Client is exploring this tool — no specific results yet.",
        clientGoals: JSON.stringify(clientGoals),
      });
      setAnalysis(result.analysis);
    } catch {
      setAnalysis("Unable to generate analysis at this time. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientData) return null;

  return (
    <Card className={`relative overflow-hidden border-0 shadow-xl ${className}`}
      style={{ background: "linear-gradient(135deg, #2a1a0a 0%, #3a2010 30%, #3a1520 60%, #2a1025 100%)" }}>
      {/* Decorative top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444, #ec4899)" }} />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "'Playfair Display', serif", color: "rgba(245, 158, 11, 0.6)" }}>
                Powered by RussellCap.com AI
              </p>
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#f5a623", letterSpacing: "-0.02em" }}>
                Your Stated Goals Accelerator
              </h2>
            </div>
            <Badge className="text-[10px] border-0" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f5a623" }}>
              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI-Powered
            </Badge>
          </div>
          {!analysis && (
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="text-white text-xs h-8 px-4 border-0 shadow-lg"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            >
              {isLoading ? (
                <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Analyzing...</>
              ) : (
                <><Zap className="w-3 h-3 mr-1.5" /> Analyze My Goals</>
              )}
            </Button>
          )}
        </div>

        {/* Client Goals Badges */}
        {clientGoals && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-[10px] border-0 px-3 py-1"
              style={{ background: "rgba(245, 158, 11, 0.08)", color: "#d4a040", fontFamily: "'Space Grotesk', sans-serif" }}>
              <Target className="w-2.5 h-2.5 mr-1" /> Retire by {clientGoals.retirementAge}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-0 px-3 py-1"
              style={{ background: "rgba(239, 68, 68, 0.08)", color: "#e07050", fontFamily: "'Space Grotesk', sans-serif" }}>
              <DollarSign className="w-2.5 h-2.5 mr-1" /> {formatTaxCurrency(clientGoals.annualIncomeNeeded)}/yr income
            </Badge>
            <Badge variant="outline" className="text-[10px] border-0 px-3 py-1"
              style={{ background: "rgba(236, 72, 153, 0.08)", color: "#d070a0", fontFamily: "'Space Grotesk', sans-serif" }}>
              <TrendingUp className="w-2.5 h-2.5 mr-1" /> {formatTaxCurrency(clientGoals.legacyGoal)} legacy
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading && !analysis && (
          <div className="flex items-center gap-3 p-5 rounded-xl" style={{ background: "rgba(245, 158, 11, 0.05)" }}>
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#f5a623" }} />
            <div>
              <p className="text-sm font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#e8c080" }}>
                Analyzing how this page accelerates your goals...
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(245, 158, 11, 0.4)" }}>
                Reviewing your portfolio, stated goals, and this tool's capabilities
              </p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: "rgba(245, 158, 11, 0.04)", border: "1px solid rgba(245, 158, 11, 0.1)" }}>
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#d0b080", fontSize: "0.95rem", lineHeight: "1.8" }}>
                {analysis}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="text-xs h-7 border-0"
                style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f5a623", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <Sparkles className="w-3 h-3 mr-1" /> Refresh Analysis
              </Button>
              <span className="text-[10px]" style={{ color: "rgba(245, 158, 11, 0.3)", fontFamily: "'Space Grotesk', sans-serif" }}>
                Powered by www.RussellCap.com AI
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. RECOMMENDATION SUMMARY — Emerald confidence palette
// ════════════════════════════════════════════════════════════════════════════

export interface RecommendationSummaryProps {
  headline: string;
  detail: string;
  dollarBenefit?: number;
  timeHorizon?: string;
  confidence?: "high" | "medium" | "low";
  nextStep?: string;
  nextStepLink?: string;
  className?: string;
}

export function RecommendationSummary({
  headline, detail, dollarBenefit, timeHorizon,
  confidence = "medium", nextStep, nextStepLink, className = "",
}: RecommendationSummaryProps) {
  const confColors = {
    high: { bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.2)", text: "#10b981", label: "High Confidence" },
    medium: { bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.2)", text: "#3b82f6", label: "Moderate Confidence" },
    low: { bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.2)", text: "#f59e0b", label: "Estimate" },
  };
  const c = confColors[confidence];

  return (
    <Card className={`border-0 shadow-lg ${className}`} style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl shrink-0" style={{ background: c.bg }}>
            <CheckCircle2 className="w-6 h-6" style={{ color: c.text }} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{headline}</h3>
              <Badge className="text-[10px] border-0" style={{ background: c.bg, color: c.text }}>
                <Shield className="w-2.5 h-2.5 mr-0.5" /> {c.label}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">{detail}</p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              {dollarBenefit !== undefined && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-2xl font-bold text-green-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {formatTaxCurrency(dollarBenefit)}
                  </span>
                  {timeHorizon && <span className="text-xs text-zinc-500">over {timeHorizon}</span>}
                </div>
              )}
              {nextStep && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{nextStep}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. DO NOTHING BASELINE — Red warning palette
// ════════════════════════════════════════════════════════════════════════════

export interface DoNothingBaselineProps {
  doNothingLabel?: string;
  recommendedLabel?: string;
  metrics: Array<{
    label: string;
    doNothing: number;
    recommended: number;
    format?: "currency" | "percent" | "years" | "number";
    higherIsBetter?: boolean;
  }>;
  summary?: string;
  className?: string;
}

export function DoNothingBaseline({
  doNothingLabel = "Do Nothing (Current Path)",
  recommendedLabel = "Recommended Strategy",
  metrics, summary, className = "",
}: DoNothingBaselineProps) {
  const formatValue = (val: number, format?: string) => {
    switch (format) {
      case "currency": return formatTaxCurrency(val);
      case "percent": return `${val.toFixed(1)}%`;
      case "years": return `${val.toFixed(1)} yrs`;
      default: return val.toLocaleString();
    }
  };

  return (
    <Card className={`border-0 shadow-lg ${className}`}
      style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(30, 30, 30, 0.95))" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
            <Scale className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#f87171" }}>
            What Happens If You Do Nothing?
          </h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <span className="text-zinc-500">Metric</span>
          <span className="text-red-400/80 text-center">{doNothingLabel}</span>
          <span className="text-green-400/80 text-center">{recommendedLabel}</span>
        </div>

        {metrics.map((m, i) => {
          const diff = m.recommended - m.doNothing;
          const isBetter = m.higherIsBetter !== false ? diff > 0 : diff < 0;
          return (
            <div key={i} className="grid grid-cols-3 gap-2 items-center py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-xs text-zinc-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.label}</span>
              <div className="text-center">
                <span className="text-sm font-mono text-red-400/70">{formatValue(m.doNothing, m.format)}</span>
              </div>
              <div className="text-center flex items-center justify-center gap-1">
                <span className="text-sm font-mono font-bold text-green-400">{formatValue(m.recommended, m.format)}</span>
                {isBetter && (
                  <Badge className="text-[9px] px-1 border-0" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                    <ArrowUpRight className="w-2.5 h-2.5" />
                    {m.format === "currency" ? formatTaxCurrency(Math.abs(diff)) :
                      m.format === "percent" ? `${Math.abs(diff).toFixed(1)}%` :
                      `+${Math.abs(diff).toFixed(1)}`}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}

        {summary && (
          <div className="p-3 rounded-xl mt-2" style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.12)" }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300/70 leading-relaxed">{summary}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. TAX BRACKET PANEL — Violet analytical palette
// ════════════════════════════════════════════════════════════════════════════

export interface TaxBracketPanelProps {
  grossIncome: number;
  filingStatus?: FilingStatus;
  stateCode?: string;
  proposedIncome?: number;
  projectionYears?: number;
  className?: string;
}

export function TaxBracketPanel({
  grossIncome, filingStatus = "single", stateCode = "TX",
  proposedIncome, projectionYears = 20, className = "",
}: TaxBracketPanelProps) {
  const taxResult = useMemo(() =>
    calculateTax(grossIncome, filingStatus, stateCode),
    [grossIncome, filingStatus, stateCode]
  );

  const savings = useMemo(() => {
    if (proposedIncome === undefined) return null;
    return calculateTaxSavings(grossIncome, proposedIncome, filingStatus, stateCode, projectionYears);
  }, [grossIncome, proposedIncome, filingStatus, stateCode, projectionYears]);

  return (
    <Card className={`border-0 shadow-lg ${className}`}
      style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(30, 30, 30, 0.95))" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
            <BarChart3 className="w-5 h-5" style={{ color: "#a78bfa" }} />
          </div>
          <h3 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#a78bfa" }}>
            Tax Bracket Analysis
          </h3>
          <Badge className="text-[10px] border-0" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#a78bfa" }}>
            2026 Brackets
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Marginal Rate", value: formatTaxRate(taxResult.federalMarginalRate), color: "#a78bfa" },
            { label: "Effective Rate", value: formatTaxRate(taxResult.totalEffectiveRate), color: "#67e8f9" },
            { label: "Federal Tax", value: formatTaxCurrency(taxResult.federalTax), color: "#f87171" },
            { label: `State Tax (${stateCode})`, value: formatTaxCurrency(taxResult.stateTax), color: "#fb923c" },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-[10px] text-zinc-500 uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.label}</p>
              <p className="text-lg font-bold" style={{ color: item.color, fontFamily: "'Space Grotesk', sans-serif" }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          {taxResult.bracketBreakdown.map((b, i) => {
            const width = grossIncome > 0 ? (b.taxableInBracket / taxResult.taxableIncome) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="w-10 text-right text-zinc-500 font-mono">{(b.bracket.rate * 100).toFixed(0)}%</span>
                <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "rgba(139, 92, 246, 0.08)" }}>
                  <div className="h-full rounded-md" style={{ width: `${Math.max(width, 2)}%`, background: "linear-gradient(90deg, #8b5cf6, #a78bfa)" }} />
                </div>
                <span className="w-16 text-right text-zinc-500 font-mono">{formatTaxCurrency(b.taxInBracket)}</span>
              </div>
            );
          })}
        </div>

        {taxResult.incomeToNextBracket !== null && taxResult.incomeToNextBracket < 50000 && (
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Only {formatTaxCurrency(taxResult.incomeToNextBracket)} from the {formatTaxRate(taxResult.nextBracketRate!)} bracket
              </span>
            </div>
          </div>
        )}

        {savings && (
          <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Strategy Tax Savings</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-zinc-500">Annual Federal</p>
                <p className="text-sm font-bold text-green-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatTaxCurrency(savings.federalSavings)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">Annual State</p>
                <p className="text-sm font-bold text-green-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatTaxCurrency(savings.stateSavings)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">{projectionYears}-Year Total</p>
                <p className="text-sm font-bold text-emerald-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatTaxCurrency(savings.lifetimeSavings)}</p>
              </div>
            </div>
            {savings.bracketDropped && (
              <Badge className="text-[10px] border-0" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> Drops to lower tax bracket!
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
