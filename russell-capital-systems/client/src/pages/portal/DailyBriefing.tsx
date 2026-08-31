// @ts-nocheck
/**
 * Daily Briefing — Quick-start screen combining:
 * - Morning Ritual status
 * - Active quests
 * - Pet mood
 * - Today's revenue snapshot
 */
import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { useEntrainment } from "@/contexts/EntrainmentEngine";
import { toast } from "sonner";
import {
  Sun, Flame, Swords, Heart, DollarSign, TrendingUp, ArrowRight,
  CheckCircle2, Circle, Clock, Sparkles, Trophy, Star, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Working late";
}

export default function DailyBriefing() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Advisor";

  const { data: profile } = trpc.experience.getProfile.useQuery();
  const { data: quests } = trpc.experience.getActiveQuests.useQuery();
  const { data: pet } = trpc.pet.get.useQuery();
  const { data: ritual } = trpc.morningRitual.getToday.useQuery();
  const { data: dashboard } = trpc.dashboard.stats.useQuery();
  const { data: dailyReward } = trpc.experience.getDailyRewardStatus.useQuery();

  const [now] = useState(() => new Date());
  const greeting = useMemo(() => getGreeting(), []);
  const [, navigate] = useLocation();
  const { playMood } = useEntrainment();
  const startRitual = trpc.morningRitual.start.useMutation();
  const [startingDay, setStartingDay] = useState(false);

  const handleStartMyDay = useCallback(async () => {
    setStartingDay(true);
    try {
      playMood?.("excitement");
      toast.success("Let's crush it today!", { description: "Morning Momentum music playing..." });

      if (!ritual) {
        try { await startRitual.mutateAsync(); } catch (e) { /* may already exist */ }
      }

      setTimeout(() => navigate("/portal/morning-ritual"), 800);
    } catch (err) {
      toast.error("Failed to start your day");
    } finally {
      setStartingDay(false);
    }
  }, [ritual, playMood, startRitual, navigate]);

  const ritualCompleted = ritual?.stepsCompleted?.length ?? 0;
  const ritualTotal = ritual?.totalSteps ?? 5;
  const ritualPct = ritualTotal > 0 ? Math.round((ritualCompleted / ritualTotal) * 100) : 0;
  const ritualStepLabels = ["Gratitude Affirmation", "Revenue Visualization", "Goal Review", "Market Scan", "Client Outreach Plan"];

  const activeQuests = quests || [];
  const completedToday = activeQuests.filter((q: any) => q.status === "completed" || q.progress >= q.target).length;
  const totalQuests = activeQuests.length;

  const petMood = pet ? (
    pet.happiness >= 80 ? "Ecstatic" :
    pet.happiness >= 60 ? "Happy" :
    pet.happiness >= 40 ? "Content" :
    pet.happiness >= 20 ? "Lonely" : "Sad"
  ) : null;
  const petMoodColor = pet ? (
    pet.happiness >= 80 ? "text-green-400" :
    pet.happiness >= 60 ? "text-blue-400" :
    pet.happiness >= 40 ? "text-yellow-400" :
    pet.happiness >= 20 ? "text-orange-400" : "text-red-400"
  ) : "";

  return (
    <div className="min-h-screen bg-[#060f1e] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Sun size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{greeting}, {firstName}</h1>
              <p className="text-[#7a95b8] text-sm">
                {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-3 mt-4">
            {profile && (
              <div className="flex items-center gap-2 bg-[#0b1628] border border-[#12233e] rounded-lg px-3 py-1.5">
                <Star size={14} className="text-amber-400" />
                <span className="text-xs text-[#7a95b8]">Level {profile.level}</span>
                <span className="text-xs font-bold text-white">{profile.levelName}</span>
              </div>
            )}
            {profile && (
              <div className="flex items-center gap-2 bg-[#0b1628] border border-[#12233e] rounded-lg px-3 py-1.5">
                <Flame size={14} className="text-orange-400" />
                <span className="text-xs font-bold text-white">{profile.currentStreak}-day streak</span>
              </div>
            )}
            {profile && (
              <div className="flex items-center gap-2 bg-[#0b1628] border border-[#12233e] rounded-lg px-3 py-1.5">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-xs font-bold text-white">{profile.totalXp?.toLocaleString()} XP</span>
              </div>
            )}
            {profile && (
              <div className="flex items-center gap-2 bg-[#0b1628] border border-[#12233e] rounded-lg px-3 py-1.5">
                <DollarSign size={14} className="text-green-400" />
                <span className="text-xs font-bold text-white">{profile.russellCoin?.toLocaleString()} RC</span>
              </div>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Morning Ritual Card */}
          <Card className="bg-[#0b1628] border-[#12233e]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun size={18} className="text-amber-400" />
                  <span className="text-base">Morning Ritual</span>
                </div>
                <Link href="/portal/morning-ritual">
                  <Button variant="ghost" size="sm" className="text-xs text-[#4a6585] hover:text-white">
                    Open <ArrowRight size={12} className="ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ritual ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#7a95b8]">{ritualCompleted}/{ritualTotal} steps complete</span>
                    <span className="text-sm font-bold text-amber-400">{ritualPct}%</span>
                  </div>
                  <Progress value={ritualPct} className="h-2 mb-3" />
                  <div className="space-y-1.5">
                    {ritualStepLabels.map((label, i) => {
                      const done = ritual?.stepsCompleted?.includes(i) ?? false;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {done ? (
                            <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                          ) : (
                            <Circle size={14} className="text-[#2a3f5a] shrink-0" />
                          )}
                          <span className={done ? "text-[#4a6585] line-through" : "text-[#7a95b8]"}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Sun size={32} className="text-[#2a3f5a] mx-auto mb-2" />
                  <p className="text-sm text-[#4a6585] mb-3">No ritual started today</p>
                  <Link href="/portal/morning-ritual">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                      Start Ritual
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Quests Card */}
          <Card className="bg-[#0b1628] border-[#12233e]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords size={18} className="text-purple-400" />
                  <span className="text-base">Active Quests</span>
                </div>
                <Link href="/portal/arena">
                  <Button variant="ghost" size="sm" className="text-xs text-[#4a6585] hover:text-white">
                    Arena <ArrowRight size={12} className="ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeQuests.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[#7a95b8]">{completedToday}/{totalQuests} quests active</span>
                    <div className="flex items-center gap-1">
                      <Trophy size={14} className="text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">
                        {activeQuests.reduce((sum: number, q: any) => sum + (q.xpReward || 0), 0)} XP available
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {activeQuests.slice(0, 4).map((quest: any) => {
                      const pct = quest.target > 0 ? Math.min(100, Math.round((quest.progress / quest.target) * 100)) : 0;
                      return (
                        <div key={quest.id} className="bg-[#060f1e] rounded-lg p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-white truncate">{quest.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              quest.questType === "daily" ? "bg-blue-500/10 text-blue-400" :
                              quest.questType === "weekly" ? "bg-purple-500/10 text-purple-400" :
                              "bg-amber-500/10 text-amber-400"
                            }`}>{quest.questType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-[#4a6585] whitespace-nowrap">{quest.progress}/{quest.target}</span>
                          </div>
                        </div>
                      );
                    })}
                    {activeQuests.length > 4 && (
                      <p className="text-[10px] text-[#4a6585] text-center">+{activeQuests.length - 4} more quests</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Swords size={32} className="text-[#2a3f5a] mx-auto mb-2" />
                  <p className="text-sm text-[#4a6585] mb-3">No active quests</p>
                  <Link href="/portal/arena">
                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                      Visit Arena
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pet Status Card */}
          <Card className="bg-[#0b1628] border-[#12233e]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-pink-400" />
                  <span className="text-base">Pet Companion</span>
                </div>
                <Link href="/portal/pet">
                  <Button variant="ghost" size="sm" className="text-xs text-[#4a6585] hover:text-white">
                    Visit <ArrowRight size={12} className="ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pet ? (
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20 flex items-center justify-center text-3xl">
                      {pet.speciesId === "phoenix" ? "🔥" :
                       pet.speciesId === "dragon" ? "🐉" :
                       pet.speciesId === "wolf" ? "🐺" :
                       pet.speciesId === "eagle" ? "🦅" :
                       pet.speciesId === "lion" ? "🦁" : "🐾"}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-white">{pet.name}</div>
                      <div className="text-xs text-[#7a95b8] capitalize">{pet.speciesId} &middot; Stage {pet.evolutionStage}</div>
                      <div className={`text-sm font-semibold mt-0.5 ${petMoodColor}`}>{petMood}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#060f1e] rounded-lg p-2 text-center">
                      <div className="text-[10px] text-[#4a6585] mb-0.5">Happiness</div>
                      <div className="text-sm font-bold text-pink-400">{pet.happiness}%</div>
                    </div>
                    <div className="bg-[#060f1e] rounded-lg p-2 text-center">
                      <div className="text-[10px] text-[#4a6585] mb-0.5">Hunger</div>
                      <div className="text-sm font-bold text-yellow-400">{pet.hunger}%</div>
                    </div>
                    <div className="bg-[#060f1e] rounded-lg p-2 text-center">
                      <div className="text-[10px] text-[#4a6585] mb-0.5">Level</div>
                      <div className="text-sm font-bold text-blue-400">{pet.level}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Heart size={32} className="text-[#2a3f5a] mx-auto mb-2" />
                  <p className="text-sm text-[#4a6585] mb-3">No pet adopted yet</p>
                  <Link href="/portal/pet">
                    <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white">
                      Adopt a Pet
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Snapshot Card */}
          <Card className="bg-[#0b1628] border-[#12233e]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-400" />
                  <span className="text-base">Today's Snapshot</span>
                </div>
                <Link href="/portal/toilet">
                  <Button variant="ghost" size="sm" className="text-xs text-[#4a6585] hover:text-white">
                    Full View <ArrowRight size={12} className="ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#060f1e] rounded-lg p-3">
                        <div className="text-[10px] text-[#4a6585] mb-1">Total Clients</div>
                        <div className="text-xl font-bold text-white">{dashboard.clientCount ?? 0}</div>
                      </div>
                      <div className="bg-[#060f1e] rounded-lg p-3">
                        <div className="text-[10px] text-[#4a6585] mb-1">Active Deals</div>
                        <div className="text-xl font-bold text-green-400">{dashboard.dealCount ?? 0}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#060f1e] rounded-lg p-3">
                      <div className="text-[10px] text-[#4a6585] mb-1">Total AUM</div>
                      <div className="text-xl font-bold text-blue-400">${((dashboard.totalAum ?? 0) / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="bg-[#060f1e] rounded-lg p-3">
                      <div className="text-[10px] text-[#4a6585] mb-1">Pipeline Value</div>
                      <div className="text-xl font-bold text-purple-400">${((dashboard.pipelineValue ?? 0) / 1000000).toFixed(1)}M</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <DollarSign size={32} className="text-[#2a3f5a] mx-auto mb-2" />
                    <p className="text-sm text-[#4a6585]">Loading dashboard data...</p>
                  </div>
                )}

                {/* Daily Reward */}
                {dailyReward && dailyReward.canClaim && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
                    <Sparkles size={20} className="text-amber-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-amber-400">Daily Reward Available!</div>
                      <div className="text-[10px] text-[#7a95b8]">Claim your daily XP and RussellCoin bonus</div>
                    </div>
                    <Link href="/portal/nerve-center">
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                        Claim
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start My Day CTA */}
        <div className="mt-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent animate-pulse" />
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={20} className="text-amber-400" />
                Start My Day
              </h3>
              <p className="text-sm text-[#7a95b8] mt-1">
                {!ritual ? "Begin your morning ritual, play focus music, and tackle your first quest" :
                 ritualPct < 100 ? `Continue your ritual (${ritualPct}% done) and tackle quests` :
                 "Ritual complete! Jump to your quests"}
              </p>
            </div>
            <Button
              onClick={handleStartMyDay}
              disabled={startingDay}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              {startingDay ? (
                <span className="flex items-center gap-2"><Clock size={16} className="animate-spin" /> Starting...</span>
              ) : (
                <span className="flex items-center gap-2"><Zap size={16} /> Let's Go!</span>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 bg-[#0b1628] border border-[#12233e] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link href="/portal/morning-ritual">
              <Button variant="outline" className="w-full text-xs h-9 border-[#1a3050] text-[#7a95b8] hover:text-white hover:border-amber-500/30 hover:bg-amber-500/5">
                <Sun size={14} className="mr-1.5 text-amber-400" /> Morning Ritual
              </Button>
            </Link>
            <Link href="/portal/arena">
              <Button variant="outline" className="w-full text-xs h-9 border-[#1a3050] text-[#7a95b8] hover:text-white hover:border-purple-500/30 hover:bg-purple-500/5">
                <Swords size={14} className="mr-1.5 text-purple-400" /> Quest Arena
              </Button>
            </Link>
            <Link href="/portal/pet">
              <Button variant="outline" className="w-full text-xs h-9 border-[#1a3050] text-[#7a95b8] hover:text-white hover:border-pink-500/30 hover:bg-pink-500/5">
                <Heart size={14} className="mr-1.5 text-pink-400" /> Pet System
              </Button>
            </Link>
            <Link href="/portal/war-story-generator">
              <Button variant="outline" className="w-full text-xs h-9 border-[#1a3050] text-[#7a95b8] hover:text-white hover:border-red-500/30 hover:bg-red-500/5">
                <Flame size={14} className="mr-1.5 text-red-400" /> War Stories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
