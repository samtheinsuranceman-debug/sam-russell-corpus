// @ts-nocheck

import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { AppShell } from "@/components/AppShell";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Waves,
  GitBranch,
  Ghost,
  Users,
  Moon,
  Brain,
  TrendingUp,
  DollarSign,
  Eye,
  Clock,
  Sparkles,
  Target,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  Shield,
  Activity,
  AlertTriangle,
  Compass,
  Heart,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════
   THE BLACK MIRROR — When the platform becomes more real than reality.
   Where the boundary between you and the machine dissolves.
   ═══════════════════════════════════════════════════════════════════ */

function WaterParticle({ delay, channel, amount }: { delay: number; channel: string; amount: number }) {
  const [y, setY] = useState(-10);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setY(prev => prev >= 100 ? -10 : prev + 0.5);
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div
      className="absolute w-2 h-2 rounded-full bg-cyan-400/60 blur-[1px] transition-all"
      style={{ top: `${y}%`, left: `${Math.random() * 80 + 10}%`, animationDelay: `${delay}ms` }}
    />
  );
}

function WealthWaterfall() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const channels = [
    { name: "MYGA Allocations", flow: 47200, clients: 23, color: "from-cyan-500 to-cyan-700", icon: "🏦", pct: 28 },
    { name: "FIA Products", flow: 38500, clients: 18, color: "from-blue-500 to-blue-700", icon: "📊", pct: 23 },
    { name: "IUL Policies", flow: 31800, clients: 15, color: "from-violet-500 to-violet-700", icon: "🛡️", pct: 19 },
    { name: "Tax Savings", flow: 22400, clients: 31, color: "from-emerald-500 to-emerald-700", icon: "💰", pct: 13 },
    { name: "Income Streams", flow: 18900, clients: 12, color: "from-amber-500 to-amber-700", icon: "💵", pct: 11 },
    { name: "Estate Planning", flow: 9800, clients: 8, color: "from-rose-500 to-rose-700", icon: "🏛️", pct: 6 },
  ];

  const totalFlow = channels.reduce((sum, c) => sum + c.flow, 0);
  const [animatedTotal, setAnimatedTotal] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setAnimatedTotal(prev => {
        const next = prev + Math.random() * 150 + 50;
        return next >= totalFlow ? 0 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, totalFlow]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
            <Waves className="w-5 h-5" /> Wealth Waterfall
          </h3>
          <p className="text-sm text-muted-foreground">Watch money flow through your entire practice in real time</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsPlaying(!isPlaying)}
            className="border-cyan-500/30 text-cyan-300">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setAnimatedTotal(0); toast.success("Waterfall reset"); }}
            className="border-cyan-500/30 text-cyan-300">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Source: Total Assets */}
      <Card className="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border-cyan-500/30">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-cyan-400 uppercase tracking-wider">Total Client Assets</p>
          <p className="text-3xl font-black text-cyan-300 font-mono">
            ${(2_790_000 + animatedTotal).toLocaleString()}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-xs text-cyan-400">Live flow: ${Math.round(animatedTotal).toLocaleString()}/cycle</span>
          </div>
        </CardContent>
      </Card>

      {/* Flow Channels */}
      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 to-transparent" />
        <div className="space-y-3">
          {channels.map((channel, i) => (
            <button
              key={channel.name}
              onClick={() => {
                setSelectedChannel(selectedChannel === channel.name ? null : channel.name);
                toast.info(`${channel.name}: $${channel.flow.toLocaleString()}/mo across ${channel.clients} clients`);
              }}
              className={`w-full text-left transition-all duration-300 ${selectedChannel === channel.name ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              <Card className={`border-transparent ${selectedChannel === channel.name ? 'ring-1 ring-cyan-400/50' : ''}`}
                style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))` }}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{channel.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{channel.name}</p>
                        <p className="text-xs text-muted-foreground">{channel.clients} clients</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-300 font-mono">${channel.flow.toLocaleString()}<span className="text-xs text-muted-foreground">/mo</span></p>
                      <p className="text-xs text-muted-foreground">{channel.pct}% of flow</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${channel.color} rounded-full transition-all duration-1000`}
                      style={{ width: isPlaying ? `${channel.pct * 3.3}%` : '0%' }}
                    />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Pool: Total Wealth Created */}
      <Card className="bg-gradient-to-r from-emerald-950/50 to-cyan-950/50 border-emerald-500/30">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-emerald-400 uppercase tracking-wider">Total Wealth Created</p>
          <p className="text-3xl font-black text-emerald-300 font-mono">
            ${totalFlow.toLocaleString()}<span className="text-lg">/mo</span>
          </p>
          <p className="text-xs text-emerald-400/70 mt-1">↓ Flowing into {channels.reduce((s, c) => s + c.clients, 0)} client portfolios</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ParallelLifeSimulator() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"6mo" | "1yr" | "3yr">("1yr");

  const scenarios = {
    "6mo": {
      real: { clients: 38, commission: 243000, wealth: 1890000, satisfaction: 87 },
      shadow: { clients: 30, commission: 112000, wealth: 780000, satisfaction: 61 },
    },
    "1yr": {
      real: { clients: 45, commission: 487000, wealth: 2790000, satisfaction: 92 },
      shadow: { clients: 34, commission: 189000, wealth: 1100000, satisfaction: 58 },
    },
    "3yr": {
      real: { clients: 49, commission: 1420000, wealth: 8900000, satisfaction: 96 },
      shadow: { clients: 41, commission: 520000, wealth: 2800000, satisfaction: 52 },
    },
  };

  const data = scenarios[timeframe];
  const gap = data.real.commission - data.shadow.commission;

  const metrics = [
    { label: "Clients", real: data.real.clients, shadow: data.shadow.clients, icon: Users, unit: "" },
    { label: "Commission", real: data.real.commission, shadow: data.shadow.commission, icon: DollarSign, unit: "$", format: true },
    { label: "Wealth Discovered", real: data.real.wealth, shadow: data.shadow.wealth, icon: TrendingUp, unit: "$", format: true },
    { label: "Client Satisfaction", real: data.real.satisfaction, shadow: data.shadow.satisfaction, icon: Heart, unit: "%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-violet-300 flex items-center gap-2">
            <GitBranch className="w-5 h-5" /> Parallel Life Simulator
          </h3>
          <p className="text-sm text-muted-foreground">What if you had never joined Russell Capital Systems?</p>
        </div>
        <div className="flex gap-1 bg-black/30 rounded-lg p-1">
          {(["6mo", "1yr", "3yr"] as const).map(tf => (
            <Button key={tf} size="sm" variant={timeframe === tf ? "default" : "ghost"}
              onClick={() => setTimeframe(tf)} className="text-xs h-7 px-3">
              {tf === "6mo" ? "6 Months" : tf === "1yr" ? "1 Year" : "3 Years"}
            </Button>
          ))}
        </div>
      </div>

      {/* The Split */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-emerald-950/40 to-cyan-950/40 border-emerald-500/30">
          <CardContent className="p-4 text-center">
            <Badge className="bg-emerald-500/20 text-emerald-300 mb-2">YOUR REALITY</Badge>
            <p className="text-xs text-emerald-400">With Russell Capital Systems</p>
            <p className="text-2xl font-black text-emerald-300 mt-2">${data.real.commission.toLocaleString()}</p>
            <p className="text-xs text-emerald-400/70">in commissions</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-950/40 to-gray-950/40 border-red-500/30 opacity-70">
          <CardContent className="p-4 text-center">
            <Badge className="bg-red-500/20 text-red-300 mb-2">SHADOW SELF</Badge>
            <p className="text-xs text-red-400">Without the platform</p>
            <p className="text-2xl font-black text-red-300 mt-2">${data.shadow.commission.toLocaleString()}</p>
            <p className="text-xs text-red-400/70">in commissions</p>
          </CardContent>
        </Card>
      </div>

      {/* The Gap */}
      <Card className="bg-gradient-to-r from-amber-950/40 to-yellow-950/40 border-amber-500/30">
        <CardContent className="p-4 text-center">
          <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-1" />
          <p className="text-xs text-amber-400 uppercase tracking-wider">The Russell Capital Advantage</p>
          <p className="text-4xl font-black text-amber-300">+${gap.toLocaleString()}</p>
          <p className="text-xs text-amber-400/70">more than your shadow self earned</p>
        </CardContent>
      </Card>

      {/* Metric Comparison */}
      <div className="space-y-3">
        {metrics.map(m => {
          const realVal = m.format ? `${m.unit}${m.real.toLocaleString()}` : `${m.real}${m.unit}`;
          const shadowVal = m.format ? `${m.unit}${m.shadow.toLocaleString()}` : `${m.shadow}${m.unit}`;
          const pct = Math.round(((m.real - m.shadow) / m.shadow) * 100);
          return (
            <div key={m.label} className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
              <m.icon className="w-4 h-4 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-300">{realVal}</span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <span className="text-sm text-red-400 line-through opacity-60">{shadowVal}</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] h-4">+{pct}%</Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GhostMode() {
  const [isActive, setIsActive] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(0);

  const scenarios = [
    {
      title: "Margaret Chen — Retirement Optimization",
      userStrategy: { myga: 40, fia: 30, iul: 20, cash: 10 },
      ghostStrategy: { myga: 35, fia: 25, iul: 30, cash: 10 },
      userOutcome: 4200,
      ghostOutcome: 4850,
      insight: "Ghost suggests increasing IUL allocation by 10% for better tax-free income in years 15+",
    },
    {
      title: "David Kim — Tax Efficiency",
      userStrategy: { roth: 30, traditional: 40, taxable: 20, muni: 10 },
      ghostStrategy: { roth: 45, traditional: 25, taxable: 15, muni: 15 },
      userOutcome: 38000,
      ghostOutcome: 52000,
      insight: "Ghost recommends aggressive Roth conversion in the current low-bracket window",
    },
    {
      title: "Sarah Chen — Estate Planning",
      userStrategy: { irrevocable: 25, revocable: 35, iul: 25, direct: 15 },
      ghostStrategy: { irrevocable: 40, revocable: 20, iul: 30, direct: 10 },
      userOutcome: 890000,
      ghostOutcome: 1240000,
      insight: "Ghost identifies $350K in additional estate tax savings through trust restructuring",
    },
  ];

  const scenario = scenarios[selectedScenario];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
            <Ghost className="w-5 h-5" /> Ghost Mode
          </h3>
          <p className="text-sm text-muted-foreground">See what the AI would do — learn by osmosis</p>
        </div>
        <Button
          size="sm"
          variant={isActive ? "default" : "outline"}
          onClick={() => { setIsActive(!isActive); toast.success(isActive ? "Ghost Mode deactivated" : "Ghost Mode activated — AI overlay enabled"); }}
          className={isActive ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-500/30 text-emerald-300"}
        >
          <Ghost className="w-4 h-4 mr-1" />
          {isActive ? "Active" : "Activate"}
        </Button>
      </div>

      {/* Scenario Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {scenarios.map((s, i) => (
          <Button key={i} size="sm" variant={selectedScenario === i ? "default" : "outline"}
            onClick={() => setSelectedScenario(i)}
            className={`text-xs whitespace-nowrap ${selectedScenario === i ? '' : 'border-emerald-500/20 text-emerald-300'}`}>
            {s.title.split(" — ")[0]}
          </Button>
        ))}
      </div>

      {/* Strategy Comparison */}
      <Card className={`transition-all duration-500 ${isActive ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10' : 'border-border/50'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{scenario.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Your Strategy
              </p>
              {Object.entries(scenario.userStrategy).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground w-20 capitalize">{key}</span>
                  <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${val}%` }} />
                  </div>
                  <span className="text-xs font-mono w-8 text-right">{val}%</span>
                </div>
              ))}
              <p className="text-sm font-bold text-blue-300 mt-2">
                Outcome: ${scenario.userOutcome.toLocaleString()}<span className="text-xs text-muted-foreground">/mo</span>
              </p>
            </div>

            {isActive && (
              <div className="border-l border-emerald-500/20 pl-4 animate-in fade-in duration-500">
                <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
                  <Ghost className="w-3 h-3" /> Ghost Strategy
                </p>
                {Object.entries(scenario.ghostStrategy).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground w-20 capitalize">{key}</span>
                    <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${val}%` }} />
                    </div>
                    <span className="text-xs font-mono w-8 text-right text-emerald-300">{val}%</span>
                  </div>
                ))}
                <p className="text-sm font-bold text-emerald-300 mt-2">
                  Outcome: ${scenario.ghostOutcome.toLocaleString()}<span className="text-xs text-muted-foreground">/mo</span>
                </p>
              </div>
            )}
          </div>

          {isActive && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-300 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Ghost Insight
              </p>
              <p className="text-sm text-emerald-200 mt-1">{scenario.insight}</p>
              <Button size="sm" className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-xs h-7"
                onClick={() => toast.success("Ghost strategy applied to your workspace")}>
                Apply Ghost Strategy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PhantomClients() {
  const [activePhantom, setActivePhantom] = useState<number | null>(null);

  const phantoms = [
    {
      name: "Phantom: Eleanor Vance",
      age: 62, assets: 780000, situation: "Recently widowed, needs income replacement strategy",
      personality: "Cautious, detail-oriented, asks many questions",
      objections: ["Doesn't trust annuities", "Worried about fees", "Wants liquidity"],
      difficulty: "Medium", xp: 300, skills: ["MYGA", "Income Planning"],
      emoji: "👻",
    },
    {
      name: "Phantom: Marcus Webb",
      age: 55, assets: 2100000, situation: "Tech executive planning early retirement, complex stock options",
      personality: "Analytical, impatient, wants data-driven approach",
      objections: ["Thinks he can do it himself", "Skeptical of insurance products", "Wants guaranteed returns"],
      difficulty: "Hard", xp: 500, skills: ["Tax Strategy", "IUL", "Estate"],
      emoji: "👤",
    },
    {
      name: "Phantom: The Hendersons",
      age: 68, assets: 450000, situation: "Married couple, one spouse has health issues, need long-term care plan",
      personality: "Warm but anxious, need reassurance, make decisions together",
      objections: ["Fixed income concerns", "Adult children involved in decisions", "Previous bad advisor experience"],
      difficulty: "Easy", xp: 200, skills: ["Medicare", "Income Planning"],
      emoji: "👥",
    },
    {
      name: "Phantom: Dr. Priya Sharma",
      age: 45, assets: 3400000, situation: "Surgeon with high income, minimal tax planning, wants legacy strategy",
      personality: "Brilliant but time-poor, needs concise presentations",
      objections: ["Only has 15 minutes", "Wants to see ROI immediately", "Compares everything to stock market"],
      difficulty: "Expert", xp: 750, skills: ["Tax Strategy", "Estate", "IUL"],
      emoji: "🧪",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
          <Users className="w-5 h-5" /> Phantom Clients
        </h3>
        <p className="text-sm text-muted-foreground">AI-generated practice clients. No risk. Full rewards. Never stop grinding.</p>
      </div>

      <div className="grid gap-3">
        {phantoms.map((phantom, i) => (
          <Card key={i}
            className={`cursor-pointer transition-all duration-300 ${activePhantom === i ? 'border-purple-500/40 shadow-lg shadow-purple-500/10' : 'border-border/30 hover:border-purple-500/20'}`}
            onClick={() => setActivePhantom(activePhantom === i ? null : i)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{phantom.emoji}</span>
                  <div>
                    <p className="font-bold text-sm">{phantom.name}</p>
                    <p className="text-xs text-muted-foreground">Age {phantom.age} · ${phantom.assets.toLocaleString()} assets</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`text-[10px] ${
                    phantom.difficulty === "Expert" ? "bg-red-500/20 text-red-300" :
                    phantom.difficulty === "Hard" ? "bg-orange-500/20 text-orange-300" :
                    phantom.difficulty === "Medium" ? "bg-amber-500/20 text-amber-300" :
                    "bg-emerald-500/20 text-emerald-300"
                  }`}>{phantom.difficulty}</Badge>
                  <p className="text-xs text-amber-400 mt-1">⭐ {phantom.xp} XP</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">{phantom.situation}</p>

              {activePhantom === i && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-xs text-purple-400 font-semibold">Personality</p>
                    <p className="text-xs text-muted-foreground">{phantom.personality}</p>
                  </div>
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-xs text-red-400 font-semibold">Common Objections</p>
                    {phantom.objections.map((obj, j) => (
                      <p key={j} className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 text-red-400/60" /> {obj}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {phantom.skills.map(skill => (
                      <Badge key={skill} variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">{skill}</Badge>
                    ))}
                  </div>
                  <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={(e) => { e.stopPropagation(); toast.success(`Starting practice session with ${phantom.name}...`); }}>
                    <Target className="w-4 h-4 mr-1" /> Begin Practice Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DreamJournal() {
  const dreamReports = [
    {
      date: "This Morning",
      processingTime: "6h 23m",
      insights: [
        { type: "pattern", text: "4 clients have CDs maturing within 60 days of each other. Coordinate MYGA transitions for a group rate — estimated savings: $12,000", value: 12000 },
        { type: "opportunity", text: "Margaret Chen's tax bracket drops next year. Accelerate Roth conversion now for $34K in lifetime tax savings", value: 34000 },
        { type: "risk", text: "David Kim's FIA cap rate expires in 90 days. Current market conditions suggest locking in a new 5-year term", value: 8500 },
      ],
      totalValue: 54500,
      mood: "🌅",
    },
    {
      date: "Yesterday",
      processingTime: "7h 11m",
      insights: [
        { type: "pattern", text: "Cross-referencing client data reveals 3 potential referral connections through shared employers", value: 0 },
        { type: "opportunity", text: "MYGA rates hit 5.8% overnight — 7 clients could benefit from immediate reallocation", value: 47000 },
        { type: "risk", text: "2 clients approaching IRMAA thresholds — proactive income adjustment needed", value: 28000 },
      ],
      totalValue: 75000,
      mood: "🌙",
    },
    {
      date: "2 Days Ago",
      processingTime: "5h 47m",
      insights: [
        { type: "opportunity", text: "Estate planning gap detected: 5 clients over 70 with no beneficiary review in 2+ years", value: 0 },
        { type: "pattern", text: "Your IUL presentations close 40% faster when you lead with the tax-free income angle", value: 0 },
        { type: "opportunity", text: "New carrier product matches 3 clients' exact risk profiles — pre-built comparison ready", value: 22000 },
      ],
      totalValue: 22000,
      mood: "✨",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
          <Moon className="w-5 h-5" /> Dream Journal
        </h3>
        <p className="text-sm text-muted-foreground">The platform processes your day while you sleep. Wake up to strategies you didn't create.</p>
      </div>

      <Card className="bg-gradient-to-r from-indigo-950/40 to-violet-950/40 border-indigo-500/30">
        <CardContent className="p-4 text-center">
          <Brain className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
          <p className="text-xs text-indigo-400 uppercase tracking-wider">Total Dream Value This Week</p>
          <p className="text-3xl font-black text-indigo-300">
            ${dreamReports.reduce((s, r) => s + r.totalValue, 0).toLocaleString()}
          </p>
          <p className="text-xs text-indigo-400/70">in opportunities discovered while you slept</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {dreamReports.map((report, i) => (
          <Card key={i} className="border-indigo-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{report.mood}</span> {report.date}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300">
                    <Clock className="w-3 h-3 mr-1" /> {report.processingTime} processing
                  </Badge>
                  {report.totalValue > 0 && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                      ${report.totalValue.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.insights.map((insight, j) => (
                <div key={j} className="flex items-start gap-2 p-2 rounded bg-black/20">
                  {insight.type === "pattern" ? <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" /> :
                   insight.type === "opportunity" ? <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> :
                   <Shield className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">{insight.text}</p>
                    {insight.value > 0 && (
                      <p className="text-xs text-emerald-400 mt-0.5">💰 ${insight.value.toLocaleString()} potential value</p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs h-6 px-2 text-indigo-300"
                    onClick={() => toast.success("Opening strategy workspace...")}>
                    Act <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function BlackMirror() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "BlackMirror",
    strategyType: "black-mirror",
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <CalculationSyncBar />
        <ClientSelectorBar
          clients={calcIntegration.clients}
          clientsLoading={calcIntegration.clientsLoading}
          selectedClientId={calcIntegration.selectedClientId}
          selectedClientName={calcIntegration.selectedClientName}
          onSelectClient={calcIntegration.selectClient}
          scenarios={calcIntegration.scenarios}
          scenariosLoading={calcIntegration.scenariosLoading}
          scenarioName={calcIntegration.scenarioName}
          onSetScenarioName={calcIntegration.setScenarioName}
          onSave={() => calcIntegration.saveScenario({}, {})}
          onLoad={(s) => calcIntegration.loadScenario(s)}
          isSaving={calcIntegration.isSaving}
          lastSavedAt={calcIntegration.lastSavedAt}
          calculatorName="BlackMirror"
        />
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="text-3xl">🪞</span> The Black Mirror
          </h1>
          <p className="text-muted-foreground">
            When the platform becomes more real than reality. Where the boundary between you and the machine dissolves.
          </p>
        </div>

        <Tabs defaultValue="waterfall" className="w-full">
          <TabsList className="bg-black/30 border border-border/30 w-full justify-start overflow-x-auto">
            <TabsTrigger value="waterfall" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 text-xs">
              <Waves className="w-3 h-3 mr-1" /> Waterfall
            </TabsTrigger>
            <TabsTrigger value="parallel" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 text-xs">
              <GitBranch className="w-3 h-3 mr-1" /> Shadow Self
            </TabsTrigger>
            <TabsTrigger value="ghost" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs">
              <Ghost className="w-3 h-3 mr-1" /> Ghost Mode
            </TabsTrigger>
            <TabsTrigger value="phantom" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-xs">
              <Users className="w-3 h-3 mr-1" /> Phantoms
            </TabsTrigger>
            <TabsTrigger value="dreams" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 text-xs">
              <Moon className="w-3 h-3 mr-1" /> Dreams
            </TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          <TabsContent value="waterfall"><WealthWaterfall /></TabsContent>
          <TabsContent value="parallel"><ParallelLifeSimulator /></TabsContent>
          <TabsContent value="ghost"><GhostMode /></TabsContent>
          <TabsContent value="phantom"><PhantomClients /></TabsContent>
          <TabsContent value="dreams"><DreamJournal /></TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="black-mirror"
              hasResults={true}
              resultData={{ doNothingOutcome: -500000, withStrategyOutcome: 1200000, netDifference: 1700000, yearsAnalyzed: 20, riskScore: 35 }}
              metrics={[{ label: "Do Nothing", value: -500000 }, { label: "With Strategy", value: 1200000, highlight: true }, { label: "Net Difference", value: 1700000 }, { label: "Risk Score", value: 35, format: "number" }]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
