// @ts-nocheck
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Target, Zap, Trophy, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * THE TOILET DASHBOARD (Secret #4 — The Toilet Dashboard)
 * 
 * Quick-glance revenue data designed for bathroom breaks.
 * Shows only the most critical numbers in large, scannable format.
 * Auto-refreshes every 30 seconds. Minimal interaction required.
 */

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-4xl font-black text-white tabular-nums">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function BigStat({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: any; color: string; sub?: string;
}) {
  return (
    <Card className={`bg-gradient-to-br ${color} border-0 p-5 text-center`}>
      <Icon className="mx-auto mb-2 text-white/60" size={28} />
      <div className="text-3xl font-black text-white tracking-tight">{value}</div>
      <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mt-1">{label}</div>
      {sub && <div className="text-[10px] text-white/50 mt-1">{sub}</div>}
    </Card>
  );
}

export default function ToiletDashboard() {
  const { user } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, {
    retry: 1,
    refetchInterval: 30000, // Auto-refresh every 30s
  });
  const { data: profile } = trpc.experience.getProfile.useQuery(undefined, { retry: 1 });
  const { data: quests } = trpc.experience.getActiveQuests.useQuery(undefined, { retry: 1 });

  const totalAum = stats?.totalAum ?? 0;
  const clientCount = stats?.clientCount ?? 0;
  const dealCount = stats?.dealCount ?? 0;
  const pipelineValue = stats?.pipelineValue ?? 0;
  const goalProgress = (stats as any)?.goalProgress ?? 0;
  const xp = profile?.totalXp ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.currentStreak ?? 0;
  const activeQuests = quests?.length ?? 0;

  const fmtMoney = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-black p-4 flex flex-col gap-4">
      {/* Header - Time + Greeting */}
      <div className="text-center py-2">
        <LiveClock />
        <p className="text-sm text-slate-500 mt-1">
          {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, {user?.name?.split(" ")[0] || "Commander"}
        </p>
        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 mt-2 text-[10px]">
          <Zap size={10} className="mr-1" /> TOILET MODE — Auto-refreshing
        </Badge>
      </div>

      {/* Big 4 Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <BigStat
          label="Total AUM"
          value={fmtMoney(totalAum)}
          icon={DollarSign}
          color="from-emerald-600/80 to-emerald-800/80"
          sub="Assets Under Management"
        />
        <BigStat
          label="Pipeline"
          value={fmtMoney(pipelineValue)}
          icon={TrendingUp}
          color="from-blue-600/80 to-blue-800/80"
          sub="Weighted pipeline value"
        />
        <BigStat
          label="Clients"
          value={String(clientCount)}
          icon={Users}
          color="from-violet-600/80 to-violet-800/80"
          sub={`${dealCount} active deals`}
        />
        <BigStat
          label="Goal"
          value={`${goalProgress}%`}
          icon={Target}
          color="from-amber-600/80 to-amber-800/80"
          sub="Strategy coverage"
        />
      </div>

      {/* XP + Streak Bar */}
      <Card className="bg-[#0a1628] border-[#1a3055] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="text-amber-400" size={20} />
            <div>
              <span className="text-lg font-black text-white">Level {level}</span>
              <span className="text-xs text-slate-500 ml-2">{xp.toLocaleString()} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                🔥 {streak}-day streak
              </Badge>
            )}
            {activeQuests > 0 && (
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                ⚔️ {activeQuests} quests
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Motivational Footer */}
      <div className="text-center mt-auto pb-4">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest">
          Every second counts. Even this one. 💰
        </p>
        <div className="flex items-center justify-center gap-1 mt-2 text-emerald-500/40">
          <ArrowUp size={10} />
          <span className="text-[9px]">Pull to refresh</span>
        </div>
      </div>
    </div>
  );
}
