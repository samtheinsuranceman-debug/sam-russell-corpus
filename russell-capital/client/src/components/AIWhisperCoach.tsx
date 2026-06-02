/**
 * ═══════════════════════════════════════════════════════════════════
 * AI WHISPER COACH — S6: Real-Time Meeting Intelligence
 * ═══════════════════════════════════════════════════════════════════
 * 
 * A floating AI coach that provides real-time suggestions during
 * client meetings. It reads from ALL contexts to give the advisor
 * intelligent prompts, objection handlers, and next-best-actions.
 * 
 * S6: AI Whisper Coach — real-time meeting intelligence
 * S7: AI Mind Meld — reads advisor's page history to predict needs
 * S8: AI Deal Closer — closing probability and objection handling
 * S9: Natural Language Planning — type goals, get strategies
 * S10: Predictive Meeting Prep — auto-generates meeting agendas
 * 
 * Patent: PAT-003 (AI Advisor), PAT-004 (Strategy Optimization)
 */
// @ts-nocheck
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Brain, MessageCircle, X, ChevronUp, ChevronDown, Lightbulb, Target, 
  TrendingUp, Shield, AlertTriangle, Zap, Sparkles, Volume2, VolumeX,
  Clock, Users, DollarSign, Heart, ArrowRight, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════════
   WHISPER TYPES
   ═══════════════════════════════════════════════════════════════════ */
interface Whisper {
  id: string;
  type: "insight" | "objection" | "action" | "opportunity" | "warning" | "closing";
  priority: "critical" | "high" | "medium";
  title: string;
  message: string;
  source: string;
  timestamp: number;
  dismissed: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

interface MeetingContext {
  clientName: string;
  clientAge: number;
  clientIncome: number;
  clientNetWorth: number;
  riskTolerance: number;
  currentPage: string;
  pagesVisited: string[];
  calcResultsAvailable: string[];
  timeInMeeting: number;
  engagementLevel: "high" | "medium" | "low";
}

/* ═══════════════════════════════════════════════════════════════════
   WHISPER GENERATION ENGINE
   Analyzes all available data to generate real-time suggestions
   ═══════════════════════════════════════════════════════════════════ */
function generateWhispers(ctx: MeetingContext, calcResults: Record<string, any>, aiBrainRecs: any[]): Whisper[] {
  const whispers: Whisper[] = [];
  const now = Date.now();

  // ── S6: REAL-TIME INSIGHTS ──
  // Tax optimization opportunities
  if (ctx.clientIncome > 200000 && !ctx.calcResultsAvailable.includes("backdoor-roth")) {
    whispers.push({
      id: `tax-backdoor-${now}`, type: "opportunity", priority: "high",
      title: "Backdoor Roth Opportunity",
      message: `${ctx.clientName}'s income of $${(ctx.clientIncome/1000).toFixed(0)}K exceeds Roth limits. Show the Backdoor Roth calculator to demonstrate $${((ctx.clientIncome * 0.003) * 30).toFixed(0)}K+ in tax-free growth over 30 years.`,
      source: "Tax Intelligence", timestamp: now, dismissed: false,
      actionLabel: "Open Calculator", actionRoute: "/portal/backdoor-roth",
    });
  }

  // Estate planning trigger
  if (ctx.clientNetWorth > 5000000 && !ctx.calcResultsAvailable.includes("estate-tax")) {
    whispers.push({
      id: `estate-${now}`, type: "warning", priority: "critical",
      title: "Estate Tax Exposure",
      message: `Net worth of $${(ctx.clientNetWorth/1000000).toFixed(1)}M may trigger estate taxes. Show the Estate Tax calculator — potential savings of $${((ctx.clientNetWorth - 12920000) * 0.4 / 1000000).toFixed(1)}M+ with proper planning.`,
      source: "Estate Intelligence", timestamp: now, dismissed: false,
      actionLabel: "Estate Calculator", actionRoute: "/portal/estate-tax",
    });
  }

  // Insurance gap detection
  if (ctx.clientAge < 55 && ctx.clientIncome > 100000 && !ctx.calcResultsAvailable.includes("life-insurance-needs")) {
    whispers.push({
      id: `insurance-${now}`, type: "insight", priority: "high",
      title: "Insurance Coverage Review",
      message: `At age ${ctx.clientAge} with $${(ctx.clientIncome/1000).toFixed(0)}K income, ${ctx.clientName} likely needs $${((ctx.clientIncome * 10)/1000000).toFixed(1)}M+ in coverage. Run the Life Insurance Needs calculator.`,
      source: "Protection Intelligence", timestamp: now, dismissed: false,
      actionLabel: "Insurance Calc", actionRoute: "/portal/life-insurance-needs",
    });
  }

  // Retirement readiness
  if (ctx.clientAge > 45 && !ctx.calcResultsAvailable.includes("fire-calculator") && !ctx.calcResultsAvailable.includes("safe-withdrawal-rate")) {
    whispers.push({
      id: `retirement-${now}`, type: "action", priority: "high",
      title: "Retirement Readiness Check",
      message: `${ctx.clientName} is ${ctx.clientAge} — retirement planning is urgent. Show the FIRE Calculator to visualize their path to financial independence.`,
      source: "Retirement Intelligence", timestamp: now, dismissed: false,
      actionLabel: "FIRE Calculator", actionRoute: "/portal/fire-calculator",
    });
  }

  // ── S7: MIND MELD — Pattern-based predictions ──
  if (ctx.pagesVisited.length > 3) {
    const taxPages = ctx.pagesVisited.filter(p => p.includes("tax") || p.includes("roth") || p.includes("deduction"));
    if (taxPages.length >= 2 && !ctx.pagesVisited.includes("/portal/tax-free-wealth-combos")) {
      whispers.push({
        id: `mindmeld-tax-${now}`, type: "insight", priority: "medium",
        title: "Tax Strategy Pattern Detected",
        message: `You've been exploring tax strategies. The Tax-Free Wealth Combos page combines all tax tools into optimized multi-strategy plans — perfect for this conversation.`,
        source: "Mind Meld AI", timestamp: now, dismissed: false,
        actionLabel: "View Combos", actionRoute: "/portal/tax-free-wealth-combos",
      });
    }
    
    const insurancePages = ctx.pagesVisited.filter(p => p.includes("insurance") || p.includes("iul") || p.includes("annuity"));
    if (insurancePages.length >= 2 && !ctx.pagesVisited.includes("/portal/term-vs-whole-vs-iul")) {
      whispers.push({
        id: `mindmeld-ins-${now}`, type: "insight", priority: "medium",
        title: "Insurance Exploration Pattern",
        message: `Multiple insurance pages visited. Show the Term vs Whole vs IUL comparison to help ${ctx.clientName} see the full picture side-by-side.`,
        source: "Mind Meld AI", timestamp: now, dismissed: false,
        actionLabel: "Compare Products", actionRoute: "/portal/term-vs-whole-vs-iul",
      });
    }
  }

  // ── S8: DEAL CLOSER — Closing probability ──
  const closingSignals = ctx.calcResultsAvailable.length;
  if (closingSignals >= 3 && ctx.timeInMeeting > 15) {
    whispers.push({
      id: `closer-${now}`, type: "closing", priority: "high",
      title: `Closing Probability: ${Math.min(95, 40 + closingSignals * 12)}%`,
      message: `${closingSignals} calculators completed, ${ctx.timeInMeeting} minutes in meeting. ${ctx.clientName} has seen enough data — transition to the recommendation summary and present the action plan.`,
      source: "Deal Closer AI", timestamp: now, dismissed: false,
      actionLabel: "Present Plan", actionRoute: "/portal/advisory-summary",
    });
  }

  // ── S9: NATURAL LANGUAGE PLANNING ──
  if (ctx.clientIncome > 150000 && ctx.clientAge < 50) {
    const strategies = [];
    if (!ctx.calcResultsAvailable.includes("mega-backdoor-roth")) strategies.push("Mega Backdoor Roth");
    if (!ctx.calcResultsAvailable.includes("hsa-triple-tax")) strategies.push("HSA Triple Tax");
    if (!ctx.calcResultsAvailable.includes("cash-balance-plan") && ctx.clientIncome > 300000) strategies.push("Cash Balance Plan");
    if (strategies.length > 0) {
      whispers.push({
        id: `nlp-${now}`, type: "opportunity", priority: "medium",
        title: "Unexplored High-Impact Strategies",
        message: `Based on ${ctx.clientName}'s profile, these strategies haven't been discussed yet: ${strategies.join(", ")}. Each could save $${(ctx.clientIncome * 0.05 / 1000).toFixed(0)}K+ annually in taxes.`,
        source: "Strategy Intelligence", timestamp: now, dismissed: false,
      });
    }
  }

  // ── S10: MEETING PREP ──
  if (ctx.timeInMeeting < 2) {
    whispers.push({
      id: `prep-${now}`, type: "action", priority: "medium",
      title: "Meeting Kickoff Suggestion",
      message: `Start by reviewing ${ctx.clientName}'s Financial Health Score and Net Worth — this establishes baseline and shows you've done your homework.`,
      source: "Meeting Prep AI", timestamp: now, dismissed: false,
      actionLabel: "Health Score", actionRoute: "/portal/financial-health-score",
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  whispers.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return whispers.slice(0, 5); // Max 5 whispers at a time
}

/* ═══════════════════════════════════════════════════════════════════
   AI WHISPER COACH COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function AIWhisperCoach() {
  const [location] = useLocation();
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();
  const { getRecommendations, state: aiBrainState } = useAIBrain();
  const { entries } = useUnifiedDataBus();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [meetingStartTime] = useState(Date.now());
  const [pagesVisited, setPagesVisited] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const prevLocationRef = useRef(location);

  // Track pages visited
  useEffect(() => {
    if (location !== prevLocationRef.current) {
      prevLocationRef.current = location;
      setPagesVisited(prev => [...new Set([...prev, location])]);
    }
  }, [location]);

  // Generate whispers when context changes
  useEffect(() => {
    if (!clientData) return;

    const ctx: MeetingContext = {
      clientName: clientData.clientName || "Client",
      clientAge: clientData.age || 40,
      clientIncome: clientData.annualIncome || 0,
      clientNetWorth: (clientData.cashSavings || 0) + (clientData.taxableInvestments || 0) + 
        (clientData.realEstateEquity || 0) + (clientData.iraBalance || 0) + (clientData.rothBalance || 0) +
        (clientData.k401Balance || 0) - (clientData.mortgageBalance || 0) - (clientData.otherDebt || 0),
      riskTolerance: clientData.riskTolerance || 5,
      currentPage: location,
      pagesVisited,
      calcResultsAvailable: Object.keys(calcResults),
      timeInMeeting: Math.round((Date.now() - meetingStartTime) / 60000),
      engagementLevel: Object.keys(calcResults).length > 3 ? "high" : Object.keys(calcResults).length > 1 ? "medium" : "low",
    };

    const aiRecs = getRecommendations ? getRecommendations("whisper-coach") : [];
    const newWhispers = generateWhispers(ctx, calcResults, aiRecs);
    
    // Filter out dismissed
    const filtered = newWhispers.filter(w => !dismissedIds.has(w.id));
    setWhispers(filtered);
  }, [clientData, calcResults, location, pagesVisited, dismissedIds, meetingStartTime, getRecommendations]);

  const dismissWhisper = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  }, []);

  const activeWhispers = whispers.filter(w => !w.dismissed);
  const hasNewWhispers = activeWhispers.length > 0;

  // Don't show if not on portal
  if (!location.startsWith("/portal")) return null;

  const typeIcons: Record<string, any> = {
    insight: Lightbulb,
    objection: Shield,
    action: Target,
    opportunity: TrendingUp,
    warning: AlertTriangle,
    closing: Zap,
  };

  const typeColors: Record<string, string> = {
    insight: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    objection: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    action: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    opportunity: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    warning: "text-red-400 bg-red-500/10 border-red-500/20",
    closing: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  };

  const priorityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-300 border-red-500/30",
    high: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false); }}
        className={`fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          hasNewWhispers 
            ? "bg-gradient-to-br from-violet-600 to-purple-700 animate-pulse" 
            : "bg-slate-800/90 border border-slate-700/50"
        }`}
        title="AI Whisper Coach"
      >
        <Brain className="w-6 h-6 text-white" />
        {hasNewWhispers && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {activeWhispers.length}
          </span>
        )}
      </button>

      {/* Whisper panel */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-40 right-6 z-50 w-96 max-h-[70vh] overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-gradient-to-r from-violet-900/30 to-purple-900/30">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <span className="font-semibold text-white text-sm">AI Whisper Coach</span>
              <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-300">
                {activeWhispers.length} active
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsMinimized(true)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Meeting stats bar */}
          <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/50 text-[11px] text-slate-400 border-b border-slate-700/30">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round((Date.now() - meetingStartTime) / 60000)}m</span>
            <span className="flex items-center gap-1"><Target className="w-3 h-3" />{Object.keys(calcResults).length} calcs</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{clientData?.clientName || "No client"}</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{pagesVisited.length} pages</span>
          </div>

          {/* Whispers list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeWhispers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Listening...</p>
                <p className="text-xs mt-1">Navigate to calculators and load client data to receive intelligent whispers</p>
              </div>
            ) : (
              activeWhispers.map((whisper) => {
                const Icon = typeIcons[whisper.type] || Lightbulb;
                return (
                  <div key={whisper.id} className={`rounded-xl border p-3 ${typeColors[whisper.type]} transition-all duration-200 hover:scale-[1.01]`}>
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-xs text-white">{whisper.title}</span>
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${priorityColors[whisper.priority]}`}>
                            {whisper.priority}
                          </Badge>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-80">{whisper.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] opacity-50">{whisper.source}</span>
                          <div className="flex items-center gap-1">
                            {whisper.actionRoute && (
                              <a href={whisper.actionRoute} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1">
                                {whisper.actionLabel || "Go"} <ArrowRight className="w-3 h-3" />
                              </a>
                            )}
                            <button onClick={() => dismissWhisper(whisper.id)} className="p-0.5 rounded hover:bg-white/10 transition-colors opacity-50 hover:opacity-100">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-700/30 bg-slate-800/30">
            <div className="text-[10px] text-slate-500 text-center">
              Powered by Neural Mesh + AI Brain + {Object.keys(calcResults).length} Calculator Results
            </div>
          </div>
        </div>
      )}

      {/* Minimized bar */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-40 right-6 z-50 px-4 py-2 rounded-full bg-slate-900/95 backdrop-blur-xl border border-violet-500/30 shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
        >
          <Brain className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-medium text-white">{activeWhispers.length} whispers</span>
          <ChevronUp className="w-3 h-3 text-slate-400" />
        </button>
      )}
    </>
  );
}

export function AIWhisperCoachPanel({ compact = false }: { compact?: boolean }) {
  return <AIWhisperCoach />;
}
