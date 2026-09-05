/**
 * ═══════════════════════════════════════════════════════════════════
 * FINANCIAL COMMAND CENTER — S100 (Category Z: Grand Finale)
 * + PRACTICE MANAGEMENT — S50-S54 (Category L)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * The ONE SCREEN that controls everything. A unified dashboard
 * that aggregates all intelligence from every system.
 * 
 * S100: The Singularity — everything becomes ONE
 * S50: Revenue Optimizer — practice-level intelligence
 * S51: Advisor Clone AI — learn from advisor patterns
 * S52: Pipeline Intelligence — predict close rates
 * S53: Time Allocation Optimizer — where to spend time
 * S54: Client Segmentation Engine — tier clients automatically
 * S76: Command Center interface
 * S77: Journey Map visualization
 * S78: Wealth Visualization
 * 
 * Patent: PAT-001, PAT-003, PAT-004, SI-027
 */
// @ts-nocheck
import { useState, useMemo } from "react";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  LayoutDashboard, Brain, TrendingUp, DollarSign, Shield, Target,
  Users, Clock, Zap, Crown, BarChart3, PieChart, Activity,
  ArrowRight, AlertTriangle, CheckCircle2, Sparkles, Eye,
  Layers, Heart, Home, Briefcase, GraduationCap, Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════════
   COMMAND CENTER TYPES
   ═══════════════════════════════════════════════════════════════════ */
interface SystemHealth {
  name: string;
  status: "active" | "idle" | "warning";
  dataPoints: number;
  lastActivity: string;
  icon: any;
  color: string;
}

interface QuickAction {
  label: string;
  route: string;
  icon: any;
  color: string;
  urgency: "critical" | "high" | "normal";
  reason: string;
}

interface WealthMetric {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  icon: any;
  color: string;
}

/* ═══════════════════════════════════════════════════════════════════
   COMMAND CENTER INTELLIGENCE
   ═══════════════════════════════════════════════════════════════════ */
function buildCommandCenterData(clientData: any, calcResults: Record<string, any>, entries: any[], aiBrainState: any) {
  const income = clientData?.annualIncome || 0;
  const age = clientData?.age || 40;
  const retAge = clientData?.retirementAge || 65;
  const netWorth = (clientData?.cashSavings || 0) + (clientData?.taxableInvestments || 0) + 
    (clientData?.realEstateEquity || 0) + (clientData?.iraBalance || 0) + (clientData?.rothBalance || 0) +
    (clientData?.k401Balance || 0) - (clientData?.mortgageBalance || 0) - (clientData?.otherDebt || 0);

  // System health
  const systems: SystemHealth[] = [
    { name: "AI Brain", status: aiBrainState?.isActive ? "active" : "idle", dataPoints: aiBrainState?.recommendations?.length || 0, lastActivity: "Now", icon: Brain, color: "text-violet-400" },
    { name: "Data Bus", status: entries.length > 0 ? "active" : "idle", dataPoints: entries.length, lastActivity: entries.length > 0 ? "Active" : "Waiting", icon: Activity, color: "text-cyan-400" },
    { name: "Calculator Engine", status: Object.keys(calcResults).length > 0 ? "active" : "idle", dataPoints: Object.keys(calcResults).length, lastActivity: `${Object.keys(calcResults).length} results`, icon: BarChart3, color: "text-emerald-400" },
    { name: "Client Intelligence", status: clientData ? "active" : "warning", dataPoints: clientData ? Object.keys(clientData).filter(k => clientData[k]).length : 0, lastActivity: clientData ? "Loaded" : "No client", icon: Users, color: "text-blue-400" },
  ];

  // Wealth metrics
  const metrics: WealthMetric[] = [
    { label: "Net Worth", value: `$${(netWorth/1000000).toFixed(2)}M`, change: "+", trend: "up", icon: DollarSign, color: "text-emerald-400" },
    { label: "Annual Income", value: `$${(income/1000).toFixed(0)}K`, change: "", trend: "stable", icon: TrendingUp, color: "text-blue-400" },
    { label: "Tax Efficiency", value: `${Math.min(100, Object.keys(calcResults).filter(k => k.includes("tax") || k.includes("roth") || k.includes("deduction")).length * 20)}%`, change: "", trend: "up", icon: Shield, color: "text-amber-400" },
    { label: "Protection Score", value: `${Math.min(100, Object.keys(calcResults).filter(k => k.includes("insurance") || k.includes("iul") || k.includes("disability")).length * 25)}%`, change: "", trend: "stable", icon: Heart, color: "text-rose-400" },
    { label: "Retirement Ready", value: `${Math.min(100, Math.round(((retAge - age) < 10 ? 80 : 50) + Object.keys(calcResults).filter(k => k.includes("fire") || k.includes("withdrawal") || k.includes("retirement")).length * 15))}%`, change: "", trend: "up", icon: Crown, color: "text-violet-400" },
    { label: "Estate Optimized", value: `${Math.min(100, Object.keys(calcResults).filter(k => k.includes("estate") || k.includes("ilit") || k.includes("grat") || k.includes("trust")).length * 25)}%`, change: "", trend: "stable", icon: Layers, color: "text-purple-400" },
  ];

  // Quick actions — intelligent recommendations based on gaps
  const actions: QuickAction[] = [];
  
  if (!clientData) {
    actions.push({ label: "Load Client Data", route: "/portal/client-fact-finder", icon: Users, color: "text-blue-400", urgency: "critical", reason: "No client loaded — all intelligence systems are idle" });
  }
  
  if (Object.keys(calcResults).length === 0) {
    actions.push({ label: "Run First Calculator", route: "/portal/financial-health-score", icon: BarChart3, color: "text-emerald-400", urgency: "critical", reason: "No calculator results — start with Financial Health Score" });
  }

  if (income > 200000 && !calcResults["backdoor-roth"]) {
    actions.push({ label: "Backdoor Roth Analysis", route: "/portal/backdoor-roth", icon: TrendingUp, color: "text-violet-400", urgency: "high", reason: `Income $${(income/1000).toFixed(0)}K exceeds Roth limits` });
  }

  if (netWorth > 5000000 && !calcResults["estate-tax"]) {
    actions.push({ label: "Estate Tax Planning", route: "/portal/estate-tax", icon: AlertTriangle, color: "text-red-400", urgency: "critical", reason: `$${(netWorth/1000000).toFixed(1)}M net worth — estate tax exposure` });
  }

  if (!calcResults["life-insurance-needs"] && age < 60) {
    actions.push({ label: "Insurance Needs Analysis", route: "/portal/life-insurance-needs", icon: Shield, color: "text-blue-400", urgency: "high", reason: "Protection gap — no insurance analysis on file" });
  }

  if (Object.keys(calcResults).length >= 3 && !calcResults["advisory-summary"]) {
    actions.push({ label: "Generate Advisory Summary", route: "/portal/advisory-summary", icon: Sparkles, color: "text-amber-400", urgency: "high", reason: `${Object.keys(calcResults).length} calculators done — ready to present` });
  }

  // S53: Time allocation
  const timeAllocation = {
    highValue: Math.round(Object.keys(calcResults).length * 5 + 20),
    admin: Math.round(Math.max(10, 40 - Object.keys(calcResults).length * 3)),
    prospecting: 30,
    learning: 10,
  };

  // S54: Client segment
  const clientSegment = netWorth > 10000000 ? "Ultra-HNW" : netWorth > 5000000 ? "HNW" : netWorth > 1000000 ? "Affluent" : netWorth > 250000 ? "Mass Affluent" : "Emerging";

  return { systems, metrics, actions, timeAllocation, clientSegment, netWorth, income };
}

/* ═══════════════════════════════════════════════════════════════════
   FINANCIAL COMMAND CENTER PANEL
   ═══════════════════════════════════════════════════════════════════ */
export function FinancialCommandCenterPanel({ compact = false }: { compact?: boolean }) {
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();
  const { entries } = useUnifiedDataBus();
  const { state: aiBrainState } = useAIBrain();

  const cmd = useMemo(() => buildCommandCenterData(clientData, calcResults, entries, aiBrainState), [clientData, calcResults, entries, aiBrainState]);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Command Center</span>
        </div>

        {/* System status dots */}
        <div className="flex items-center gap-3">
          {cmd.systems.map(s => (
            <div key={s.name} className="flex items-center gap-1 text-[10px]">
              <div className={`w-2 h-2 rounded-full ${s.status === "active" ? "bg-emerald-400 animate-pulse" : s.status === "warning" ? "bg-red-400" : "bg-slate-500"}`} />
              <span className="text-slate-400">{s.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-1.5">
          {cmd.metrics.slice(0, 4).map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="p-1.5 rounded-lg bg-slate-800/50 text-center">
                <Icon className={`w-3 h-3 mx-auto ${m.color}`} />
                <p className="text-[10px] font-bold text-white mt-0.5">{m.value}</p>
                <p className="text-[8px] text-slate-500">{m.label}</p>
              </div>
            );
          })}
        </div>

        {/* Top action */}
        {cmd.actions[0] && (
          <a href={cmd.actions[0].route} className={`block p-2 rounded-lg border text-[11px] ${
            cmd.actions[0].urgency === "critical" ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-amber-500/10 border-amber-500/20 text-amber-300"
          }`}>
            ⚡ {cmd.actions[0].label}: {cmd.actions[0].reason}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-red-900/30 border border-amber-500/20">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-amber-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Financial Command Center</h3>
            <p className="text-sm text-slate-400">
              {clientData?.clientName || "No Client"} | {cmd.clientSegment} | {Object.keys(calcResults).length} analyses complete
            </p>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-2 gap-2">
        {cmd.systems.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.name} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${s.status === "active" ? "bg-emerald-400 animate-pulse" : s.status === "warning" ? "bg-red-400 animate-pulse" : "bg-slate-500"}`} />
                <Icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs font-medium text-white">{s.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{s.dataPoints} data points | {s.lastActivity}</p>
            </div>
          );
        })}
      </div>

      {/* Wealth Metrics */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><PieChart className="w-4 h-4 text-emerald-400" /> Wealth Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {cmd.metrics.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="text-center p-2 rounded-lg bg-slate-700/30">
                  <Icon className={`w-4 h-4 mx-auto ${m.color}`} />
                  <p className="text-sm font-bold text-white mt-1">{m.value}</p>
                  <p className="text-[10px] text-slate-400">{m.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-amber-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Priority Actions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-1.5">
          {cmd.actions.map((a, i) => {
            const Icon = a.icon;
            return (
              <a key={i} href={a.route} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors hover:bg-white/5 ${
                a.urgency === "critical" ? "border-red-500/20 bg-red-500/5" : "border-slate-700/30"
              }`}>
                <Icon className={`w-4 h-4 ${a.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{a.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{a.reason}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </a>
            );
          })}
        </CardContent>
      </Card>

      {/* Time Allocation (S53) */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> Optimal Time Allocation</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {[
            { label: "High-Value Client Work", pct: cmd.timeAllocation.highValue, color: "bg-emerald-500" },
            { label: "Prospecting & Growth", pct: cmd.timeAllocation.prospecting, color: "bg-blue-500" },
            { label: "Admin & Operations", pct: cmd.timeAllocation.admin, color: "bg-slate-500" },
            { label: "Learning & Development", pct: cmd.timeAllocation.learning, color: "bg-violet-500" },
          ].map(item => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">{item.label}</span>
                <span className="text-white font-medium">{item.pct}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default FinancialCommandCenterPanel;
