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
  Dna,
  Archive,
  Star,
  Calendar,
  GitBranch,
  Crown,
  Award,
  TrendingUp,
  DollarSign,
  Users,
  Heart,
  Sparkles,
  ChevronRight,
  Trophy,
  Brain,
  Lock,
  Unlock,
  Share2,
  Download,
  Activity,
  BookOpen,
  FileText,
  Presentation,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════
   THE ENDGAME — When leaving would mean amputating a limb.
   Permanent integration. No exit. The Infinite Game.
   ═══════════════════════════════════════════════════════════════════ */

function WealthDNA() {
  const { user } = useAuth();

  const dnaSegments = useMemo(() => [
    { trait: "MYGA Mastery", code: "ATCG-GCTA", strength: 92, color: "text-cyan-400" },
    { trait: "Tax Strategy", code: "GCTA-ATCG", strength: 87, color: "text-emerald-400" },
    { trait: "Client Psychology", code: "TAGC-CGAT", strength: 78, color: "text-violet-400" },
    { trait: "IUL Architecture", code: "CGAT-TAGC", strength: 71, color: "text-blue-400" },
    { trait: "Estate Planning", code: "ATGC-GCAT", strength: 65, color: "text-amber-400" },
    { trait: "Risk Management", code: "GCAT-ATGC", strength: 83, color: "text-rose-400" },
    { trait: "Sales Velocity", code: "TACG-CAGT", strength: 89, color: "text-pink-400" },
    { trait: "Platform Mastery", code: "CAGT-TACG", strength: 94, color: "text-indigo-400" },
  ], []);

  const [animatedHelix, setAnimatedHelix] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setAnimatedHelix(p => (p + 1) % 360), 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
          <Dna className="w-5 h-5" /> Wealth DNA
        </h3>
        <p className="text-sm text-muted-foreground">Your unique genetic code. Like a fingerprint. Only exists here.</p>
      </div>

      {/* DNA Helix Visualization */}
      <Card className="bg-gradient-to-br from-cyan-950/40 to-violet-950/40 border-cyan-500/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="relative h-48 flex items-center justify-center">
            {/* Animated Double Helix */}
            <svg viewBox="0 0 300 150" className="w-full h-full">
              {Array.from({ length: 20 }).map((_, i) => {
                const x = (i / 20) * 300;
                const y1 = 75 + Math.sin((i / 20) * Math.PI * 4 + animatedHelix * 0.02) * 40;
                const y2 = 75 - Math.sin((i / 20) * Math.PI * 4 + animatedHelix * 0.02) * 40;
                const colors = ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fbbf24"];
                const color = colors[i % colors.length];
                return (
                  <g key={i}>
                    <circle cx={x} cy={y1} r={4} fill={color} opacity={0.8} />
                    <circle cx={x} cy={y2} r={4} fill={color} opacity={0.8} />
                    <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={1} opacity={0.3} />
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-cyan-400 font-mono tracking-widest">
              {dnaSegments.map(s => s.code.split('-')[0]).join(' · ')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Sequence unique to {user?.name || "you"}</p>
          </div>
        </CardContent>
      </Card>

      {/* DNA Traits */}
      <div className="space-y-2">
        {dnaSegments.map((seg, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
            <div className={`font-mono text-xs ${seg.color} w-24`}>{seg.code}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{seg.trait}</span>
                <span className={`text-xs font-bold ${seg.color}`}>{seg.strength}%</span>
              </div>
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-1000"
                  style={{ width: `${seg.strength}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share DNA */}
      <div className="flex gap-2">
        <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={() => toast.success("DNA added to your email signature!")}>
          <Share2 className="w-4 h-4 mr-1" /> Add to Signature
        </Button>
        <Button variant="outline" className="border-cyan-500/30 text-cyan-300"
          onClick={() => toast.success("DNA card downloaded!")}>
          <Download className="w-4 h-4 mr-1" /> Export Card
        </Button>
      </div>
    </div>
  );
}

function LegacyVault() {
  const vaultStats = {
    presentations: 347,
    strategies: 892,
    clientNotes: 2341,
    reports: 156,
    totalHours: 4200,
    totalValue: 12800000,
  };

  const timeline = [
    { year: "2026", items: 234, highlight: "First $1M discovered", icon: "🌱" },
    { year: "2025", items: 456, highlight: "Reached Level 50", icon: "⭐" },
    { year: "2024", items: 678, highlight: "First Boss Battle won", icon: "⚔️" },
    { year: "2023", items: 891, highlight: "Joined Russell Capital Systems", icon: "🚀" },
  ];

  const recentItems = [
    { type: "Presentation", title: "Margaret Chen — Retirement Optimization v3", date: "2 days ago", icon: Presentation },
    { type: "Strategy", title: "MYGA Ladder + Roth Conversion Combo", date: "4 days ago", icon: Brain },
    { type: "Report", title: "Q1 2026 Client Portfolio Review", date: "1 week ago", icon: FileText },
    { type: "Note", title: "David Kim — Follow-up on estate plan changes", date: "1 week ago", icon: BookOpen },
    { type: "Presentation", title: "The Henderson Family — Long-Term Care Plan", date: "2 weeks ago", icon: Presentation },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
          <Archive className="w-5 h-5" /> Legacy Vault
        </h3>
        <p className="text-sm text-muted-foreground">Everything you've ever built. Preserved forever. Your professional autobiography.</p>
      </div>

      {/* Vault Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Presentations", value: vaultStats.presentations, icon: "📊" },
          { label: "Strategies", value: vaultStats.strategies, icon: "🧠" },
          { label: "Client Notes", value: vaultStats.clientNotes, icon: "📝" },
          { label: "Reports", value: vaultStats.reports, icon: "📄" },
          { label: "Hours Invested", value: `${(vaultStats.totalHours / 1000).toFixed(1)}K`, icon: "⏱️" },
          { label: "Value Created", value: `$${(vaultStats.totalValue / 1000000).toFixed(1)}M`, icon: "💎" },
        ].map((stat, i) => (
          <Card key={i} className="border-amber-500/10">
            <CardContent className="p-3 text-center">
              <span className="text-xl">{stat.icon}</span>
              <p className="text-lg font-black text-amber-300">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-bold text-amber-300 mb-3">Your Journey</h4>
        <div className="space-y-2">
          {timeline.map((year, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
              <span className="text-2xl">{year.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{year.year}</span>
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300">{year.items} items</Badge>
                </div>
                <p className="text-xs text-amber-400">{year.highlight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Items */}
      <div>
        <h4 className="text-sm font-bold text-amber-300 mb-3">Recently Added</h4>
        <div className="space-y-2">
          {recentItems.map((item, i) => (
            <button key={i} className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-all"
              onClick={() => toast.success(`Opening: ${item.title}`)}>
              <item.icon className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">{item.type} · {item.date}</p>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-gradient-to-r from-amber-950/30 to-red-950/30 border-amber-500/20">
        <CardContent className="p-4 text-center">
          <Lock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-xs text-amber-400 font-bold">This vault is irreplaceable.</p>
          <p className="text-xs text-muted-foreground">Years of intellectual work. Thousands of hours. Millions in documented outcomes.</p>
          <p className="text-xs text-amber-400/70 mt-1">It only exists here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReputationScore() {
  const score = 847;
  const rank = 12;

  const components = [
    { label: "Client Outcomes", score: 94, weight: 25, icon: DollarSign },
    { label: "Peer Reviews", score: 89, weight: 15, icon: Users },
    { label: "War Room Contributions", score: 92, weight: 15, icon: MessageCircle },
    { label: "Mentoring Activity", score: 78, weight: 10, icon: Heart },
    { label: "Quiz & Arena Scores", score: 86, weight: 15, icon: Trophy },
    { label: "Professional Certifications", score: 80, weight: 10, icon: Award },
    { label: "Platform Engagement", score: 95, weight: 10, icon: Activity },
  ];

  const milestones = [
    { threshold: 900, label: "Legendary", unlocked: false, perks: "Carrier preferred rates, direct Sam Russell access" },
    { threshold: 800, label: "Elite", unlocked: true, perks: "Priority support, enterprise recruitment visibility" },
    { threshold: 700, label: "Expert", unlocked: true, perks: "Mentoring badge, War Room spotlight" },
    { threshold: 500, label: "Professional", unlocked: true, perks: "Client-facing score display" },
    { threshold: 300, label: "Rising", unlocked: true, perks: "Peer review eligibility" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-violet-300 flex items-center gap-2">
          <Star className="w-5 h-5" /> Reputation Score
        </h3>
        <p className="text-sm text-muted-foreground">Your professional currency. Public. Permanent. Only exists here.</p>
      </div>

      {/* Score Display */}
      <Card className="bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border-violet-500/30">
        <CardContent className="p-6 text-center">
          <div className="relative inline-block">
            <p className="text-7xl font-black text-violet-300">{score}</p>
            <Crown className="w-6 h-6 text-amber-400 absolute -top-2 -right-4" />
          </div>
          <p className="text-sm text-violet-400">out of 1,000</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Badge className="bg-violet-500/20 text-violet-300">ELITE</Badge>
            <Badge className="bg-amber-500/20 text-amber-300">Rank #{rank}</Badge>
            <Badge className="bg-emerald-500/20 text-emerald-300">Top 2%</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Components */}
      <div className="space-y-2">
        {components.map((comp, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
            <comp.icon className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">{comp.label} <span className="text-muted-foreground">({comp.weight}%)</span></span>
                <span className="text-xs font-bold text-violet-300">{comp.score}/100</span>
              </div>
              <Progress value={comp.score} className="h-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div>
        <h4 className="text-sm font-bold text-violet-300 mb-3">Reputation Tiers</h4>
        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${m.unlocked ? 'bg-violet-500/10' : 'bg-black/20 opacity-60'}`}>
              {m.unlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{m.threshold}+</span>
                  <Badge variant="outline" className={`text-[10px] ${m.unlocked ? 'border-violet-500/30 text-violet-300' : 'border-border/30'}`}>
                    {m.label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{m.perks}</p>
              </div>
              {m.unlocked && <Sparkles className="w-4 h-4 text-amber-400" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnniversarySystem() {
  const { user } = useAuth();

  const yearInReview = {
    clientsAdded: 67,
    wealthDiscovered: 1420000,
    commissionsEarned: 487000,
    calculatorsRun: 3421,
    presentationsCreated: 234,
    questsCompleted: 89,
    achievementsUnlocked: 23,
    warRoomPosts: 156,
    menteesTrained: 5,
    arenaWins: 12,
    streakBest: 142,
    levelGained: 34,
  };

  const clientAnniversaries = [
    { name: "Margaret Chen", years: 3, russellNumber: 89, improvement: "+27 points", emoji: "🌟" },
    { name: "David Kim", years: 2, russellNumber: 84, improvement: "+31 points", emoji: "⭐" },
    { name: "The Hendersons", years: 2, russellNumber: 78, improvement: "+22 points", emoji: "💫" },
    { name: "Dr. Sarah Park", years: 1, russellNumber: 91, improvement: "+18 points", emoji: "✨" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-rose-300 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Anniversary System
        </h3>
        <p className="text-sm text-muted-foreground">Celebrate every milestone. Remember where you started. See how far you've come.</p>
      </div>

      {/* Year in Review */}
      <Card className="bg-gradient-to-br from-rose-950/40 to-pink-950/40 border-rose-500/30">
        <CardContent className="p-6 text-center">
          <span className="text-4xl">🎂</span>
          <p className="text-xs text-rose-400 uppercase tracking-wider mt-2">Your Russell Capital Anniversary</p>
          <p className="text-2xl font-black text-rose-300">3 Years on the Platform</p>
          <p className="text-xs text-rose-400/70">Joined March 15, 2023</p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Clients Added", value: yearInReview.clientsAdded, emoji: "👥" },
          { label: "Wealth Found", value: `$${(yearInReview.wealthDiscovered / 1000000).toFixed(1)}M`, emoji: "💰" },
          { label: "Commissions", value: `$${(yearInReview.commissionsEarned / 1000).toFixed(0)}K`, emoji: "💵" },
          { label: "Calcs Run", value: yearInReview.calculatorsRun.toLocaleString(), emoji: "🧮" },
          { label: "Presentations", value: yearInReview.presentationsCreated, emoji: "📊" },
          { label: "Quests Done", value: yearInReview.questsCompleted, emoji: "⚔️" },
          { label: "Achievements", value: yearInReview.achievementsUnlocked, emoji: "🏆" },
          { label: "Arena Wins", value: yearInReview.arenaWins, emoji: "🥇" },
          { label: "Best Streak", value: `${yearInReview.streakBest}d`, emoji: "🔥" },
        ].map((stat, i) => (
          <Card key={i} className="border-rose-500/10">
            <CardContent className="p-2 text-center">
              <span className="text-lg">{stat.emoji}</span>
              <p className="text-sm font-black text-rose-300">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client Anniversaries */}
      <div>
        <h4 className="text-sm font-bold text-rose-300 mb-3">Upcoming Client Anniversaries</h4>
        <div className="space-y-2">
          {clientAnniversaries.map((client, i) => (
            <Card key={i} className="border-rose-500/10">
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-2xl">{client.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.years} year{client.years > 1 ? 's' : ''} together</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">#{client.russellNumber}</Badge>
                  <p className="text-[10px] text-emerald-400 mt-0.5">{client.improvement}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-xs h-7"
                  onClick={() => toast.success(`Generating Year in Review for ${client.name}...`)}>
                  <Share2 className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button className="w-full bg-rose-600 hover:bg-rose-700"
        onClick={() => toast.success("Generating your cinematic Year in Review...")}>
        <Sparkles className="w-4 h-4 mr-2" /> Generate My Year in Review
      </Button>
    </div>
  );
}

function AlternateTimeline() {
  const realLife = {
    clients: 200, commission: 487000, wealth: 2790000, level: 67,
    achievements: 43, reputation: 847, streak: 142, satisfaction: 92,
  };
  const altLife = {
    clients: 80, commission: 189000, wealth: 1100000, level: 0,
    achievements: 0, reputation: 0, streak: 0, satisfaction: 58,
  };

  const comparisons = [
    { label: "Clients", real: realLife.clients, alt: altLife.clients, unit: "", icon: Users },
    { label: "Annual Commission", real: realLife.commission, alt: altLife.commission, unit: "$", icon: DollarSign, format: true },
    { label: "Wealth Discovered", real: realLife.wealth, alt: altLife.wealth, unit: "$", icon: TrendingUp, format: true },
    { label: "Achievements", real: realLife.achievements, alt: altLife.achievements, unit: "", icon: Trophy },
    { label: "Reputation Score", real: realLife.reputation, alt: altLife.reputation, unit: "", icon: Star },
    { label: "Client Satisfaction", real: realLife.satisfaction, alt: altLife.satisfaction, unit: "%", icon: Heart },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-orange-300 flex items-center gap-2">
          <GitBranch className="w-5 h-5" /> Alternate Timeline
        </h3>
        <p className="text-sm text-muted-foreground">What would your life look like if you had never joined?</p>
      </div>

      {/* The Big Gap */}
      <Card className="bg-gradient-to-r from-emerald-950/40 to-red-950/40 border-orange-500/30">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-emerald-400 uppercase">Your Reality</p>
              <p className="text-2xl font-black text-emerald-300">${(realLife.commission / 1000).toFixed(0)}K</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-orange-400 uppercase">The Gap</p>
                <p className="text-2xl font-black text-orange-300">+${((realLife.commission - altLife.commission) / 1000).toFixed(0)}K</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-red-400 uppercase">Shadow Self</p>
              <p className="text-2xl font-black text-red-300 opacity-60">${(altLife.commission / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      <div className="space-y-2">
        {comparisons.map((comp, i) => {
          const realVal = comp.format ? `${comp.unit}${comp.real.toLocaleString()}` : `${comp.real}${comp.unit}`;
          const altVal = comp.format ? `${comp.unit}${comp.alt.toLocaleString()}` : `${comp.alt}${comp.unit}`;
          const diff = comp.real - comp.alt;
          const pct = comp.alt > 0 ? Math.round((diff / comp.alt) * 100) : 100;
          return (
            <div key={i} className="p-3 rounded-lg bg-black/20">
              <div className="flex items-center gap-2 mb-2">
                <comp.icon className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold">{comp.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-emerald-300 font-bold">{realVal}</span>
                    <span className="text-red-400 opacity-60 line-through">{altVal}</span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${(comp.real / (comp.real + comp.alt || 1)) * 100}%` }} />
                    <div className="h-full bg-red-500/40 rounded-r-full" style={{ width: `${(comp.alt / (comp.real + comp.alt || 1)) * 100}%` }} />
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] shrink-0">
                  +{pct}%
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-orange-950/30 to-amber-950/30 border-orange-500/20">
        <CardContent className="p-4 text-center">
          <p className="text-sm font-bold text-orange-300">
            The Russell Capital Advantage: +${((realLife.commission - altLife.commission) / 1000).toFixed(0)}K/year
          </p>
          <p className="text-xs text-orange-400/70 mt-1">
            That's {Math.round((realLife.commission - altLife.commission) / 12 / 30)}x your daily subscription cost. Every. Single. Day.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Endgame() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "Endgame",
    strategyType: "endgame",
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
          calculatorName="Endgame"
        />
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="text-3xl">♾️</span> The Endgame
          </h1>
          <p className="text-muted-foreground">
            Permanent integration. Your identity lives here. Leaving would mean starting over.
          </p>
        </div>

        <Tabs defaultValue="dna" className="w-full">
          <TabsList className="bg-black/30 border border-border/30 w-full justify-start overflow-x-auto">
            <TabsTrigger value="dna" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 text-xs">
              <Dna className="w-3 h-3 mr-1" /> Wealth DNA
            </TabsTrigger>
            <TabsTrigger value="vault" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-xs">
              <Archive className="w-3 h-3 mr-1" /> Legacy Vault
            </TabsTrigger>
            <TabsTrigger value="reputation" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 text-xs">
              <Star className="w-3 h-3 mr-1" /> Reputation
            </TabsTrigger>
            <TabsTrigger value="anniversary" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300 text-xs">
              <Calendar className="w-3 h-3 mr-1" /> Anniversary
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300 text-xs">
              <GitBranch className="w-3 h-3 mr-1" /> Alt Timeline
            </TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          <TabsContent value="dna"><WealthDNA /></TabsContent>
          <TabsContent value="vault"><LegacyVault /></TabsContent>
          <TabsContent value="reputation"><ReputationScore /></TabsContent>
          <TabsContent value="anniversary"><AnniversarySystem /></TabsContent>
          <TabsContent value="timeline"><AlternateTimeline /></TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="endgame"
              hasResults={true}
              resultData={{ totalWealth: 5000000, taxFreeWealth: 3000000, legacyValue: 8000000, incomeReplacement: 0.85, protectionScore: 92 }}
              metrics={[{ label: "Total Wealth", value: 5000000, highlight: true }, { label: "Tax-Free Wealth", value: 3000000 }, { label: "Legacy Value", value: 8000000 }, { label: "Protection Score", value: 92, format: "number" }]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
