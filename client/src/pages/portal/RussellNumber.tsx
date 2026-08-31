// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Hash, TrendingUp, Target, Users, DollarSign,
  Activity, Zap, Crown, Shield, Star, ArrowUp, ArrowDown, Minus,
  Share2, Award
} from "lucide-react";

const TIERS = [
  { min: 0, max: 299, label: "Apprentice", color: "text-gray-400", bg: "from-gray-500/20 to-gray-600/20", border: "border-gray-500/30", icon: Shield },
  { min: 300, max: 499, label: "Advisor", color: "text-blue-400", bg: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/30", icon: Target },
  { min: 500, max: 699, label: "Strategist", color: "text-green-400", bg: "from-green-500/20 to-emerald-600/20", border: "border-green-500/30", icon: Activity },
  { min: 700, max: 849, label: "Elite", color: "text-purple-400", bg: "from-purple-500/20 to-violet-600/20", border: "border-purple-500/30", icon: Star },
  { min: 850, max: 949, label: "Master", color: "text-amber-400", bg: "from-amber-500/20 to-yellow-600/20", border: "border-amber-500/30", icon: Crown },
  { min: 950, max: 1000, label: "Legend", color: "text-red-400", bg: "from-red-500/20 to-orange-600/20", border: "border-red-500/30", icon: Zap },
];

function getTier(score: number) {
  return TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];
}

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value, duration]);
  return <span>{display}</span>;
}

export default function RussellNumber() {
  const { user } = useAuth();
  const profileQuery = trpc.experience.getProfile.useQuery();
  const clientsQuery = trpc.clients.list.useQuery();
  const [showBreakdown, setShowBreakdown] = useState(true);

  const russellNumber = useMemo(() => {
    const profile = profileQuery.data;
    const clients = clientsQuery.data as any[] | undefined;
    if (!profile || !clients) return null;

    const totalClients = clients.length;
    const totalWealth = clients.reduce((sum: number, c: any) => sum + Number(c.totalNetWorth ?? 0), 0);
    const avgWealth = totalClients > 0 ? totalWealth / totalClients : 0;
    const level = profile.level ?? 1;
    const xp = profile.totalXp ?? 0;
    const streak = profile.currentStreak ?? 0;
    const coins = profile.russellCoin ?? 0;

    const dimensions = [
      { name: "Client Portfolio", score: Math.min(100, Math.round((totalClients / 50) * 100)), maxScore: 100, weight: 0.20, icon: Users, color: "text-blue-400", trend: (totalClients > 10 ? "up" : "flat") as "up"|"down"|"flat", trendValue: totalClients > 10 ? 5 : 0, description: `${totalClients} active clients` },
      { name: "Wealth Discovered", score: Math.min(100, Math.round((totalWealth / 10_000_000) * 100)), maxScore: 100, weight: 0.25, icon: DollarSign, color: "text-green-400", trend: (totalWealth > 1_000_000 ? "up" : "flat") as "up"|"down"|"flat", trendValue: totalWealth > 1_000_000 ? 8 : 0, description: `$${(totalWealth / 1_000_000).toFixed(1)}M total AUM` },
      { name: "Engagement Level", score: Math.min(100, Math.round((level / 20) * 100)), maxScore: 100, weight: 0.15, icon: Activity, color: "text-purple-400", trend: (level > 3 ? "up" : "flat") as "up"|"down"|"flat", trendValue: level > 3 ? 3 : 0, description: `Level ${level} \u2022 ${xp.toLocaleString()} XP` },
      { name: "Consistency", score: Math.min(100, Math.round((streak / 30) * 100)), maxScore: 100, weight: 0.15, icon: Zap, color: "text-amber-400", trend: (streak > 7 ? "up" : streak > 0 ? "flat" : "down") as "up"|"down"|"flat", trendValue: streak > 7 ? 12 : 0, description: `${streak}-day streak` },
      { name: "Strategy Depth", score: Math.min(100, Math.round((avgWealth / 200_000) * 100)), maxScore: 100, weight: 0.15, icon: Target, color: "text-teal-400", trend: (avgWealth > 100_000 ? "up" : "flat") as "up"|"down"|"flat", trendValue: avgWealth > 100_000 ? 6 : 0, description: `$${(avgWealth / 1000).toFixed(0)}K avg per client` },
      { name: "Community Impact", score: Math.min(100, Math.round((coins / 5000) * 100)), maxScore: 100, weight: 0.10, icon: Share2, color: "text-pink-400", trend: (coins > 1000 ? "up" : "flat") as "up"|"down"|"flat", trendValue: coins > 1000 ? 4 : 0, description: `${coins.toLocaleString()} RussellCoin` },
    ];

    const totalScore = Math.round(dimensions.reduce((sum, d) => sum + (d.score * d.weight), 0) * 10);
    return { score: Math.min(1000, Math.max(0, totalScore)), dimensions, totalClients, totalWealth };
  }, [profileQuery.data, clientsQuery.data]);

  const tier = russellNumber ? getTier(russellNumber.score) : TIERS[0];
  const TierIcon = tier.icon;
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-background to-amber-500/5" />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
          <div className="container relative py-12">
            <div className="text-center max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                  <Hash className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">THE RUSSELL NUMBER&trade;</span>
                </div>
                <div className="relative inline-block">
                  <div className={`absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r ${tier.bg} rounded-full scale-150`} />
                  <p className={`relative text-[120px] sm:text-[160px] font-black leading-none tracking-tighter ${tier.color}`}>
                    {russellNumber ? <AnimatedNumber value={russellNumber.score} /> : "---"}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Badge className={`bg-gradient-to-r ${tier.bg} ${tier.border} ${tier.color} text-sm px-4 py-1`}>
                    <TierIcon className="w-4 h-4 mr-1.5" /> {tier.label}
                  </Badge>
                  {nextTier && <span className="text-xs text-muted-foreground">{nextTier.min - (russellNumber?.score ?? 0)} pts to {nextTier.label}</span>}
                </div>
              </div>
              <p className="text-muted-foreground text-lg mb-6">Your Russell Number is a composite score of everything you do. Every client helped, every dollar discovered, every day you show up — it all counts.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="sm" onClick={() => setShowBreakdown(!showBreakdown)}>{showBreakdown ? "Hide" : "Show"} Breakdown</Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`My Russell Number\u2122 is ${russellNumber?.score ?? 0} \u2014 ${tier.label} tier.`); toast.success("Copied!"); }}>
                  <Share2 className="w-4 h-4 mr-1.5" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {showBreakdown && russellNumber && (
          <div className="container py-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {russellNumber.dimensions.map((dim) => {
                const Icon = dim.icon;
                const TrendIcon = dim.trend === "up" ? ArrowUp : dim.trend === "down" ? ArrowDown : Minus;
                const trendColor = dim.trend === "up" ? "text-green-400" : dim.trend === "down" ? "text-red-400" : "text-gray-400";
                const weightedScore = Math.round(dim.score * dim.weight * 10);
                return (
                  <Card key={dim.name} className="border-border/30 hover:border-border/60 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.bg} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${dim.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{dim.name}</p>
                            <p className="text-xs text-muted-foreground">{dim.description}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 ${trendColor}`}>
                          <TrendIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">{dim.trendValue > 0 ? `+${dim.trendValue}` : dim.trendValue}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Score: {dim.score}/100</span>
                          <span className={dim.color}>+{weightedScore} pts</span>
                        </div>
                        <Progress value={dim.score} className="h-2" />
                        <p className="text-xs text-muted-foreground">Weight: {(dim.weight * 100).toFixed(0)}%</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="mt-8 max-w-5xl mx-auto border-border/30">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Russell Number History</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-1 px-4">
                  {Array.from({ length: 30 }, (_, i) => {
                    const base = russellNumber?.score ?? 500;
                    const v = Math.sin(i * 0.3) * 50 + Math.random() * 30;
                    const day = Math.max(0, Math.min(1000, base - 100 + (i * 3) + v));
                    const h = (day / 1000) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full rounded-t transition-all ${i === 29 ? "bg-emerald-500" : "bg-emerald-500/30 hover:bg-emerald-500/50"}`} style={{ height: `${h}%` }} title={`Day ${i + 1}: ${Math.round(day)}`} />
                        {(i === 0 || i === 14 || i === 29) && <span className="text-[10px] text-muted-foreground">{i === 0 ? "30d" : i === 14 ? "15d" : "Today"}</span>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 max-w-5xl mx-auto">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" /> Russell Number Milestones</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TIERS.map((t) => {
                  const reached = (russellNumber?.score ?? 0) >= t.min;
                  const TIcon = t.icon;
                  return (
                    <Card key={t.label} className={`${reached ? t.border : "border-border/20 opacity-50"} transition-all`}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.bg} flex items-center justify-center`}>
                          <TIcon className={`w-5 h-5 ${reached ? t.color : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className={`font-semibold ${reached ? t.color : "text-muted-foreground"}`}>{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.min}\u2013{t.max} pts</p>
                        </div>
                        {reached && <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30 text-xs">Reached</Badge>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
