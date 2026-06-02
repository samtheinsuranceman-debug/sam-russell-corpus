/**
 * ═══════════════════════════════════════════════════════════════════
 * INTELLIGENCE COMMAND PANEL — Upgraded with Real Organism Data
 * ═══════════════════════════════════════════════════════════════════
 * 
 * The ONE panel that unifies all 100 suggestions + 250 organism hooks
 * into a single collapsible right-side intelligence dashboard.
 * Now shows real-time organism health, cross-calc aggregation,
 * and proactive alerts.
 */
// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { 
  PanelRightOpen, PanelRightClose, LayoutDashboard, Brain, Users,
  Swords, Activity, Trophy, Crown, Shield, DollarSign, Gem,
  FileText, ChevronDown, ChevronRight, Sparkles, X, Zap,
  AlertTriangle, Heart, Network, TrendingUp
} from "lucide-react";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";
import {
  useCrossCalcAggregation,
  useClientDataCompleteness,
  useProactiveAlerts,
  useRiskAlerts,
  formatCurrency,
} from "@/hooks/useOrganism";
import { getMeshHealth } from "@/components/NeuralMeshInterceptor";

// Intelligence Engines
import { FinancialCommandCenterPanel } from "./FinancialCommandCenter";
import { AIWhisperCoachPanel } from "./AIWhisperCoach";
import { ClientDigitalTwinPanel } from "./ClientDigitalTwin";
import { ScenarioWarfarePanel } from "./ScenarioWarfare";
import { PredictiveLifeEventPanel } from "./PredictiveLifeEventEngine";
import { GamificationPanel } from "./GamificationRevolution";
import { DynastyIntelligencePanel } from "./DynastyIntelligence";
import { InsuranceOptimizerPanel } from "./InsuranceOptimizer";
import { GuaranteedIncomePanel } from "./GuaranteedIncomeEngine";
import { MonetizationGrandFinalePanel } from "./MonetizationMarketplace";
import { ComplianceEducationPanel } from "./ComplianceEducationEngine";

/* ═══════════════════════════════════════════════════════════════════
   PANEL TABS
   ═══════════════════════════════════════════════════════════════════ */
interface PanelTab {
  id: string;
  label: string;
  icon: any;
  color: string;
  component: React.ComponentType<{ compact?: boolean }>;
  suggestions: string;
}

const PANEL_TABS: PanelTab[] = [
  { id: "command", label: "Command Center", icon: LayoutDashboard, color: "text-amber-400", component: FinancialCommandCenterPanel, suggestions: "S76-S78, S100" },
  { id: "whisper", label: "AI Whisper Coach", icon: Brain, color: "text-violet-400", component: AIWhisperCoachPanel, suggestions: "S6-S10" },
  { id: "twin", label: "Client Digital Twin", icon: Users, color: "text-blue-400", component: ClientDigitalTwinPanel, suggestions: "S11-S15" },
  { id: "warfare", label: "Scenario Warfare", icon: Swords, color: "text-red-400", component: ScenarioWarfarePanel, suggestions: "S35-S38, S16-S20" },
  { id: "predictive", label: "Predictive Engine", icon: Activity, color: "text-cyan-400", component: PredictiveLifeEventPanel, suggestions: "S26-S30, S57-S60" },
  { id: "gamification", label: "Advisor RPG", icon: Trophy, color: "text-yellow-400", component: GamificationPanel, suggestions: "S39-S42, S63-S64" },
  { id: "dynasty", label: "Dynasty & Growth", icon: Crown, color: "text-purple-400", component: DynastyIntelligencePanel, suggestions: "S31-S34, S61-S73" },
  { id: "insurance", label: "Insurance Intel", icon: Shield, color: "text-rose-400", component: InsuranceOptimizerPanel, suggestions: "S21-S25, S79-S80" },
  { id: "income", label: "Income & Tax", icon: DollarSign, color: "text-emerald-400", component: GuaranteedIncomePanel, suggestions: "S57-S60, S16-S20, S83-S86" },
  { id: "equation", label: "Wealth Equation", icon: Gem, color: "text-yellow-400", component: MonetizationGrandFinalePanel, suggestions: "S87-S99, S100" },
  { id: "compliance", label: "Compliance & Tools", icon: FileText, color: "text-slate-400", component: ComplianceEducationPanel, suggestions: "S43-S56, S65-S67, S81-S82" },
];

/* ═══════════════════════════════════════════════════════════════════
   INTELLIGENCE COMMAND PANEL
   ═══════════════════════════════════════════════════════════════════ */
export function IntelligenceCommandPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTab, setExpandedTab] = useState<string | null>("command");
  const [location] = useLocation();

  // Real organism data
  const { results: calcResults } = useCalcResults();
  const { data: clientData } = useClientData();
  const crossAgg = useCrossCalcAggregation();
  const completeness = useClientDataCompleteness();
  const proactiveAlerts = useProactiveAlerts(calcResults, clientData || {});
  const riskAlerts = useRiskAlerts(calcResults, clientData || {});

  const meshHealth = useMemo(() => getMeshHealth(), [calcResults, clientData]);
  const alertCount = useMemo(() => proactiveAlerts.length + riskAlerts.length, [proactiveAlerts, riskAlerts]);

  const overallHealth = useMemo(() => {
    const d = completeness.percentage;
    const c = Math.min(100, (crossAgg.calcsUsed / 10) * 100);
    const a = Math.max(0, 100 - alertCount * 15);
    const m = meshHealth.healthScore;
    return Math.round((d + c + a + m) / 4);
  }, [completeness, crossAgg, alertCount, meshHealth]);

  const healthColor = overallHealth >= 70 ? "text-emerald-400" : overallHealth >= 40 ? "text-amber-400" : "text-red-400";
  const pulseColor = overallHealth >= 70 ? "bg-emerald-400" : overallHealth >= 40 ? "bg-amber-400" : "bg-red-400";

  // Auto-select relevant tab based on current page
  useEffect(() => {
    if (location.includes("tax") || location.includes("roth") || location.includes("deduction")) {
      setExpandedTab("income");
    } else if (location.includes("insurance") || location.includes("iul") || location.includes("disability")) {
      setExpandedTab("insurance");
    } else if (location.includes("estate") || location.includes("trust") || location.includes("dynasty")) {
      setExpandedTab("dynasty");
    } else if (location.includes("fire") || location.includes("retirement") || location.includes("withdrawal")) {
      setExpandedTab("income");
    } else if (location.includes("scenario") || location.includes("combo") || location.includes("optimizer")) {
      setExpandedTab("warfare");
    }
  }, [location]);

  return (
    <>
      {/* Toggle Button — always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-20 z-50 p-2.5 rounded-xl bg-gradient-to-r from-amber-600/90 to-orange-600/90 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-300 hover:scale-105 group"
        title="Intelligence Command Panel"
      >
        {isOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        )}
        {/* Alert badge */}
        {!isOpen && alertCount > 0 && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[8px] text-white flex items-center justify-center font-bold">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </button>

      {/* Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "380px" }}
      >
        <div className="h-full bg-[#070e1e]/95 backdrop-blur-xl border-l border-amber-500/10 flex flex-col">
          {/* Header with Real Organism Health */}
          <div className="p-4 border-b border-amber-500/10 bg-gradient-to-r from-amber-900/20 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Intelligence Command</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Live Health Bar */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${pulseColor} animate-pulse`} />
                <Heart className={`w-3.5 h-3.5 ${healthColor}`} />
                <span className={`text-xs font-bold ${healthColor}`}>{overallHealth}%</span>
              </div>
              <div className="flex-1 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    overallHealth >= 70 ? "bg-emerald-500" : overallHealth >= 40 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${overallHealth}%` }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                {crossAgg.calcsUsed} calcs
              </span>
              <span className="flex items-center gap-1">
                <Network className="w-3 h-3 text-purple-400" />
                {meshHealth.connectedPages}/{meshHealth.totalPages}
              </span>
              {alertCount > 0 && (
                <span className="flex items-center gap-1 text-orange-400">
                  <AlertTriangle className="w-3 h-3" />
                  {alertCount} alerts
                </span>
              )}
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-400" />
                {completeness.percentage}% data
              </span>
            </div>
          </div>

          {/* Proactive Alerts Banner */}
          {alertCount > 0 && (
            <div className="px-4 py-2 bg-orange-500/5 border-b border-orange-500/10">
              <div className="flex items-center gap-2 text-[10px] text-orange-400">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {proactiveAlerts[0]?.message || riskAlerts[0]?.message || `${alertCount} active alerts`}
                </span>
              </div>
            </div>
          )}

          {/* Cross-Calc Aggregation Quick View */}
          {crossAgg.calcsUsed > 0 && (
            <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/10">
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500">Net Worth</span>
                  <div className="text-white font-medium">{formatCurrency(crossAgg.totalNetWorth)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Tax Savings</span>
                  <div className="text-emerald-400 font-medium">{formatCurrency(crossAgg.totalTaxSavings)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Retirement</span>
                  <div className="text-blue-400 font-medium">{formatCurrency(crossAgg.totalRetirementIncome)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Accordion */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {PANEL_TABS.map(tab => {
              const Icon = tab.icon;
              const isExpanded = expandedTab === tab.id;
              const Component = tab.component;

              return (
                <div key={tab.id} className="border-b border-slate-800/50">
                  {/* Tab Header */}
                  <button
                    onClick={() => setExpandedTab(isExpanded ? null : tab.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors ${
                      isExpanded ? "bg-slate-800/30" : "hover:bg-slate-800/20"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${tab.color}`} />
                    <span className="text-xs font-medium text-white flex-1">{tab.label}</span>
                    <span className="text-[8px] text-slate-600">{tab.suggestions}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>

                  {/* Tab Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1">
                      <Component compact={false} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer with Real Data */}
          <div className="p-3 border-t border-slate-800/50 bg-slate-900/50">
            <Link href="/portal/organism-dashboard">
              <div className="flex items-center justify-between text-[10px] text-slate-500 cursor-pointer hover:text-amber-400 transition-colors">
                <span>Russell Capital Intelligence v3.0 • 350 hooks active</span>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${pulseColor} animate-pulse`} />
                  <span className={healthColor}>Organism {overallHealth >= 70 ? "healthy" : overallHealth >= 40 ? "warming" : "critical"}</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

export default IntelligenceCommandPanel;
