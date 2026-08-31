// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Flame,
  Sparkles,
  Calendar,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Star,
  Zap,
  Target,
  RefreshCw,
  Trophy,
  Sun,
  Moon,
  Coffee,
  Brain,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";


const DAILY_INSIGHTS = [
  { type: "opportunity", title: "Roth Conversion Window", description: "3 clients have IRA balances that could benefit from partial Roth conversions before year-end. Estimated tax savings: $47,000 combined.", impact: "$47K", icon: DollarSign, color: "text-green-400" },
  { type: "alert", title: "Policy Anniversary Alert", description: "2 clients have IUL policies approaching their annual review date. This is the perfect time to run updated illustrations.", impact: "2 clients", icon: Calendar, color: "text-blue-400" },
  { type: "strategy", title: "MYGA Rate Spike", description: "5-year MYGA rates just hit 5.2% — highest in 18 months. 5 clients with maturing CDs could benefit from a rollover conversation.", impact: "5.2% rate", icon: TrendingUp, color: "text-amber-400" },
  { type: "insight", title: "Tax Bracket Optimization", description: "Based on current projections, 4 clients are within $15K of the next tax bracket. Strategic Roth conversions could save them $12K+ each.", impact: "$48K+", icon: Brain, color: "text-purple-400" },
  { type: "opportunity", title: "Estate Planning Gap", description: "7 clients have estate values exceeding $5M but no trust structure in place. Each conversation could unlock $200K+ in estate tax savings.", impact: "$1.4M", icon: Target, color: "text-teal-400" },
  { type: "alert", title: "Market Opportunity", description: "S&P 500 pulled back 3% this week. 6 clients with cash positions over $100K could benefit from dollar-cost averaging into indexed products.", impact: "6 clients", icon: Lightbulb, color: "text-orange-400" },
];

const STREAK_MILESTONES = [
  { days: 3, reward: "50 RC", label: "Getting Started" },
  { days: 7, reward: "150 RC", label: "One Week Warrior" },
  { days: 14, reward: "300 RC", label: "Two Week Titan" },
  { days: 30, reward: "1,000 RC", label: "Monthly Master" },
  { days: 60, reward: "2,500 RC", label: "Sixty Day Sage" },
  { days: 90, reward: "5,000 RC", label: "Quarter King" },
  { days: 180, reward: "15,000 RC", label: "Half-Year Hero" },
  { days: 365, reward: "50,000 RC", label: "Annual Legend" },
];

function AnimatedCounter({ value, prefix = "$", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const dur = 2500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.round(value * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

export default function DailyDiscovery() {
  const { user } = useAuth();
  const profileQuery = trpc.experience.getProfile.useQuery();
  const clientsQuery = trpc.clients.list.useQuery();
  const checkInMutation = trpc.experience.checkIn.useMutation({
    onSuccess: (data) => {
      toast.success(`Checked in! ${!data.alreadyCheckedIn ? "Streak continued!" : "Already checked in today."} +${data.xpEarned ?? 0} XP`);
      profileQuery.refetch();
    },
  });

  const [activeTab, setActiveTab] = useState<"discovery" | "streak" | "ticker">("discovery");
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);

  const profile = profileQuery.data;
  const clients = clientsQuery.data as any[] | undefined;
  const totalWealth = useMemo(() => clients?.reduce((sum: number, c: any) => sum + Number(c.totalNetWorth ?? 0), 0) ?? 0, [clients]);
  const streak = profile?.currentStreak ?? 0;
  const todayInsight = DAILY_INSIGHTS[discoveryIndex % DAILY_INSIGHTS.length];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const GreetIcon = hour < 12 ? Coffee : hour < 17 ? Sun : Moon;

  const handleCheckIn = () => {
    checkInMutation.mutate();
    setCheckedIn(true);
  };

  const tabs = [
    { id: "discovery" as const, label: "Daily Discovery", icon: Sparkles },
    { id: "streak" as const, label: "Streak", icon: Flame },
    { id: "ticker" as const, label: "Wealth Ticker", icon: DollarSign },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Persistent Wealth Ticker Bar */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-emerald-500/10 via-background to-teal-500/10 border-b border-emerald-500/20 backdrop-blur-xl">
          <div className="container py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-emerald-400">
                  <AnimatedCounter value={totalWealth} />
                </span>
                <span className="text-xs text-muted-foreground">Total Wealth Discovered</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`} />
                <span className={`text-sm font-bold ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`}>{streak}</span>
                <span className="text-xs text-muted-foreground">day streak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{(profile?.totalXp ?? 0).toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="border-b border-border/30 bg-gradient-to-r from-amber-500/5 via-background to-orange-500/5">
          <div className="container py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <GreetIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{greeting}, {user?.name?.split(" ")[0] ?? "Commander"}</h1>
                <p className="text-sm text-muted-foreground">Your daily briefing is ready. Let's find some money.</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container py-8">
          {/* ─── DAILY DISCOVERY TAB ─── */}
          {activeTab === "discovery" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Check-in Card */}
              {!checkedIn && (
                <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
                  <CardContent className="p-6 text-center">
                    <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-white mb-2">Start Your Day</h2>
                    <p className="text-muted-foreground mb-4">Check in to maintain your streak and unlock today's discovery.</p>
                    <Button onClick={handleCheckIn} disabled={checkInMutation.isPending} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                      <Flame className="w-4 h-4 mr-2" /> Check In (+25 XP, +10 RC)
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Today's Discovery */}
              <Card className="border-amber-500/20 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Today's Discovery</Badge>
                    <Badge variant="outline" className="text-xs">{todayInsight.type}</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">{todayInsight.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{todayInsight.description}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-lg font-bold text-green-400">{todayInsight.impact}</span>
                      <span className="text-sm text-muted-foreground">potential impact</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 flex justify-between items-center">
                  <Button variant="outline" size="sm" onClick={() => setDiscoveryIndex(i => i + 1)}>
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Next Discovery
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success("+50 XP for acting on a discovery!")}>
                    Take Action <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-border/30">
                  <CardContent className="p-4 text-center">
                    <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{clients?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Active Clients</p>
                  </CardContent>
                </Card>
                <Card className="border-border/30">
                  <CardContent className="p-4 text-center">
                    <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">Level {profile?.level ?? 1}</p>
                    <p className="text-xs text-muted-foreground">{profile?.levelName ?? "Optimizer"}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/30">
                  <CardContent className="p-4 text-center">
                    <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{(profile?.russellCoin ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">RussellCoin</p>
                  </CardContent>
                </Card>
              </div>

              {/* All Insights Feed */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" /> More Discoveries
                </h3>
                <div className="space-y-3">
                  {DAILY_INSIGHTS.map((insight, i) => {
                    const Icon = insight.icon;
                    return (
                      <Card key={i} className="border-border/30 hover:border-border/60 transition-colors cursor-pointer" onClick={() => setDiscoveryIndex(i)}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${insight.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{insight.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{insight.description.slice(0, 80)}...</p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 ${insight.color}`}>{insight.impact}</Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── STREAK TAB ─── */}
          {activeTab === "streak" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center py-8">
                <div className="relative inline-block mb-4">
                  <div className={`absolute inset-0 blur-3xl opacity-30 ${streak > 7 ? "bg-orange-500" : "bg-gray-500"} rounded-full scale-150`} />
                  <Flame className={`relative w-24 h-24 ${streak > 0 ? "text-orange-400" : "text-muted-foreground"} ${streak > 7 ? "animate-pulse" : ""}`} />
                </div>
                <p className={`text-[80px] font-black leading-none ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`}>{streak}</p>
                <p className="text-xl text-muted-foreground mt-2">Day Streak</p>
                {streak >= 7 && <Badge className="mt-3 bg-orange-500/20 text-orange-400 border-orange-500/30">ON FIRE</Badge>}
                {streak >= 30 && <Badge className="mt-3 ml-2 bg-red-500/20 text-red-400 border-red-500/30">UNSTOPPABLE</Badge>}
              </div>

              <Card className="border-orange-500/20">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" /> Streak Milestones</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {STREAK_MILESTONES.map((m) => {
                      const reached = streak >= m.days;
                      return (
                        <div key={m.days} className={`flex items-center gap-4 p-3 rounded-lg ${reached ? "bg-orange-500/10 border border-orange-500/20" : "bg-white/2"}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reached ? "bg-orange-500/20" : "bg-white/5"}`}>
                            {reached ? <CheckCircle2 className="w-5 h-5 text-orange-400" /> : <span className="text-sm font-bold text-muted-foreground">{m.days}</span>}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${reached ? "text-orange-400" : "text-white"}`}>{m.label}</p>
                            <p className="text-xs text-muted-foreground">{m.days} day streak</p>
                          </div>
                          <Badge variant="outline" className={reached ? "text-green-400 border-green-500/30" : ""}>{m.reward}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Streak Calendar */}
              <Card className="border-border/30">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> This Month</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                    ))}
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 2;
                      const today = new Date().getDate();
                      const isToday = day === today;
                      const isActive = day > 0 && day <= today && day >= today - streak;
                      const isValid = day > 0 && day <= 31;
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                            isToday ? "bg-emerald-500 text-white ring-2 ring-emerald-400/50" :
                            isActive ? "bg-orange-500/30 text-orange-400" :
                            isValid ? "text-muted-foreground hover:bg-white/5" : ""
                          }`}
                        >
                          {isValid ? day : ""}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── WEALTH TICKER TAB ─── */}
          {activeTab === "ticker" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                  <DollarSign className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-400">LIVE WEALTH TICKER</span>
                </div>
                <p className="text-[60px] sm:text-[80px] font-black text-emerald-400 leading-none">
                  <AnimatedCounter value={totalWealth} />
                </p>
                <p className="text-xl text-muted-foreground mt-3">Total Wealth Discovered Across All Clients</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "IRA Balances", value: clients?.reduce((s: number, c: any) => s + Number(c.iraBalance ?? 0), 0) ?? 0, color: "text-blue-400" },
                  { label: "Roth Balances", value: clients?.reduce((s: number, c: any) => s + Number(c.rothBalance ?? 0), 0) ?? 0, color: "text-green-400" },
                  { label: "401(k) Balances", value: clients?.reduce((s: number, c: any) => s + Number(c.k401Balance ?? 0), 0) ?? 0, color: "text-purple-400" },
                  { label: "Life Insurance DB", value: clients?.reduce((s: number, c: any) => s + Number(c.lifeInsuranceDb ?? 0), 0) ?? 0, color: "text-amber-400" },
                ].map((item) => (
                  <Card key={item.label} className="border-border/30">
                    <CardContent className="p-4 text-center">
                      <p className={`text-2xl font-bold ${item.color}`}>
                        <AnimatedCounter value={item.value} />
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Top Clients by Wealth */}
              <Card className="border-border/30">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Top Clients by Net Worth</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(clients ?? [])
                      .sort((a: any, b: any) => Number(b.totalNetWorth ?? 0) - Number(a.totalNetWorth ?? 0))
                      .slice(0, 10)
                      .map((client: any, i: number) => {
                        const nw = Number(client.totalNetWorth ?? 0);
                        const pct = totalWealth > 0 ? (nw / totalWealth) * 100 : 0;
                        return (
                          <div key={client.id} className="flex items-center gap-3">
                            <span className="text-sm font-bold text-muted-foreground w-6 text-right">#{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-white">{client.name || `${client.firstName} ${client.lastName}`}</span>
                                <span className="text-sm font-bold text-emerald-400">${(nw / 1000).toFixed(0)}K</span>
                              </div>
                              <Progress value={pct} className="h-1.5" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
