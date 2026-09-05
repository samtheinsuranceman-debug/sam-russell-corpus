// @ts-nocheck
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Sun, Coffee, Flame, DollarSign, Zap,
  Volume2, VolumeX, Clock, Target, CheckCircle, Sparkles,
  ArrowRight, Heart, Shield, Bell, AlertTriangle
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   THE MORNING RITUAL — WIRED TO REAL BACKEND
   ═══════════════════════════════════════════════════════════════════ */

const SOUND_TIERS = [
  { min: 0, max: 999, label: "Coin Drop", emoji: "🪙" },
  { min: 1000, max: 9999, label: "Cash Register", emoji: "💵" },
  { min: 10000, max: 99999, label: "Vault Opening", emoji: "🏦" },
  { min: 100000, max: 999999, label: "Jackpot", emoji: "🎰" },
  { min: 1000000, max: Infinity, label: "Wealth Explosion", emoji: "💎" },
];

const RITUAL_STEPS = [
  { id: "breathe", title: "Breathe", subtitle: "Center yourself. Today is going to be profitable.", icon: Sun, iconColor: "text-amber-400", duration: 10, bgGradient: "from-amber-500/5 to-amber-900/10" },
  { id: "wealth", title: "Wealth Discovered", subtitle: "While you slept, the numbers moved.", icon: DollarSign, iconColor: "text-emerald-400", duration: 15, bgGradient: "from-emerald-500/5 to-emerald-900/10" },
  { id: "streak", title: "Streak Check", subtitle: "Another day. Another link in the chain.", icon: Flame, iconColor: "text-orange-400", duration: 10, bgGradient: "from-orange-500/5 to-orange-900/10" },
  { id: "discovery", title: "Daily Discovery", subtitle: "Your AI found something while you were away.", icon: Sparkles, iconColor: "text-cyan-400", duration: 20, bgGradient: "from-cyan-500/5 to-cyan-900/10" },
  { id: "quest", title: "Today's Quest", subtitle: "Your mission, should you choose to accept it.", icon: Target, iconColor: "text-violet-400", duration: 15, bgGradient: "from-violet-500/5 to-violet-900/10" },
  { id: "launch", title: "Launch", subtitle: "Go make someone's financial life better.", icon: Zap, iconColor: "text-yellow-400", duration: 10, bgGradient: "from-yellow-500/5 to-yellow-900/10" },
];

function BreathingCircle({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className={`w-32 h-32 rounded-full border-2 border-amber-400/30 transition-all duration-[4000ms] ease-in-out ${active ? "scale-150 opacity-20" : "scale-100 opacity-60"}`} />
      <div className={`absolute w-24 h-24 rounded-full border border-amber-400/50 transition-all duration-[4000ms] ease-in-out delay-500 ${active ? "scale-150 opacity-10" : "scale-100 opacity-40"}`} />
      <div className="absolute w-16 h-16 rounded-full bg-amber-400/20 flex items-center justify-center">
        <Sun className="text-amber-400" size={24} />
      </div>
      <p className="absolute -bottom-8 text-xs text-amber-400/60 font-medium">
        {active ? "Breathe out..." : "Breathe in..."}
      </p>
    </div>
  );
}

function AnimatedCounter({ target, prefix = "$", duration = 2000 }: { target: number; prefix?: string; duration?: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const steps = 60;
    const increment = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(Math.round(increment * step), target));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{prefix}{current.toLocaleString()}</span>;
}

function ToiletDashboard() {
  const quickWins = [
    { title: "Call Mrs. Johnson", subtitle: "Policy renewal in 7 days", time: "30s", xp: 15, icon: "📞", urgency: "high" },
    { title: "Send Birthday Card", subtitle: "Tom Anderson turns 65 today", time: "20s", xp: 10, icon: "🎂", urgency: "medium" },
    { title: "Review MYGA Rate", subtitle: "Athene rate changed overnight", time: "15s", xp: 5, icon: "📊", urgency: "low" },
    { title: "Approve Pending App", subtitle: "Chen family FIA application", time: "45s", xp: 20, icon: "✅", urgency: "high" },
    { title: "Reply to Referral", subtitle: "New lead from Dr. Williams", time: "60s", xp: 25, icon: "🤝", urgency: "high" },
  ];
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const totalXp = quickWins.filter((_, i) => completed.has(i)).reduce((sum, w) => sum + w.xp, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Clock size={18} className="text-cyan-400" /> Quick Wins
          </h3>
          <p className="text-xs text-slate-500">90-second tasks. One thumb. Big impact.</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">+{totalXp} XP</Badge>
      </div>
      {quickWins.map((win, i) => (
        <Card key={i} className={`bg-slate-800/50 border-slate-700/50 cursor-pointer transition-all duration-200 ${completed.has(i) ? "opacity-50 border-emerald-500/30" : "hover:bg-slate-800/80"}`}
          onClick={() => {
            if (!completed.has(i)) {
              setCompleted(prev => { const next = new Set(Array.from(prev)); next.add(i); return next; });
              toast.success(`+${win.xp} XP`, { description: win.title });
            }
          }}>
          <CardContent className="p-3 flex items-center gap-3">
            <span className="text-2xl">{completed.has(i) ? "✅" : win.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${completed.has(i) ? "text-emerald-400 line-through" : "text-white"}`}>{win.title}</p>
              <p className="text-xs text-slate-500 truncate">{win.subtitle}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-400">{win.time}</p>
              <p className="text-[10px] text-yellow-400">+{win.xp} XP</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${win.urgency === "high" ? "bg-red-400" : win.urgency === "medium" ? "bg-amber-400" : "bg-blue-400"}`} />
          </CardContent>
        </Card>
      ))}
      <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Quick Win Progress</span>
          <span className="text-xs text-emerald-400 font-bold">{completed.size}/{quickWins.length}</span>
        </div>
        <Progress value={(completed.size / quickWins.length) * 100} className="h-2" />
      </div>
    </div>
  );
}

function WithdrawalSymptoms() {
  const { data: triggers, isLoading } = trpc.withdrawal.getUnread.useQuery();
  const markReadMut = trpc.withdrawal.markRead.useMutation();
  const markClickedMut = trpc.withdrawal.markClicked.useMutation();
  const generateMut = trpc.withdrawal.generate.useMutation({
    onSuccess: () => toast.success("Re-engagement triggers generated!"),
  });
  const utils = trpc.useUtils();

  const staticSymptoms = [
    { level: 1, trigger: "12 hours away", message: "Your wealth feed has new insights waiting...", icon: Bell, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
    { level: 2, trigger: "24 hours away", message: "Your streak is at risk! Log in to save it.", icon: Flame, color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
    { level: 3, trigger: "48 hours away", message: "Your pet is getting lonely. It hasn't been fed.", icon: Heart, color: "text-pink-400", bgColor: "bg-pink-500/10 border-pink-500/20" },
    { level: 4, trigger: "72 hours away", message: "ALERT: Clients have been contacted by competitors.", icon: AlertTriangle, color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
    { level: 5, trigger: "7 days away", message: "EMERGENCY: Your Russell Number dropped significantly.", icon: Shield, color: "text-red-500", bgColor: "bg-red-500/15 border-red-500/30" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" /> Re-Engagement Triggers
          </h3>
          <p className="text-xs text-slate-500">Escalating notifications that bring advisors back.</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { generateMut.mutate(); setTimeout(() => utils.withdrawal.getUnread.invalidate(), 1000); }}>
          Generate Test
        </Button>
      </div>

      {triggers && triggers.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-yellow-400 font-bold">Active Triggers ({triggers.length})</p>
          {triggers.map((t: any) => (
            <Card key={t.id} className="bg-red-500/5 border-red-500/20 border">
              <CardContent className="p-3 flex items-start gap-3">
                <AlertTriangle size={14} className="text-red-400 mt-1 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-white/80">{t.hookText}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Level {t.triggerLevel} — {t.triggerType}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-[10px] text-slate-400 h-6" onClick={() => { markReadMut.mutate({ triggerId: t.id }); utils.withdrawal.getUnread.invalidate(); }}>
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-slate-400 font-medium">Trigger Escalation Levels</p>
        {staticSymptoms.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.level} className={`${s.bgColor} border`}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={14} className={s.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-black/20 text-white/60 border-white/10 text-[10px]">Level {s.level}</Badge>
                    <span className="text-[10px] text-slate-500">{s.trigger}</span>
                  </div>
                  <p className="text-xs text-white/80">{s.message}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
        <p className="text-xs text-slate-400">Current status: <span className="text-emerald-400 font-bold">Active</span></p>
        <p className="text-[10px] text-slate-500 mt-1">
          {triggers && triggers.length > 0 ? `${triggers.length} active trigger(s)` : "No withdrawal symptoms triggered. Keep it up!"}
        </p>
      </div>
    </div>
  );
}

function SoundSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Volume2 size={18} className="text-emerald-400" /> Sound of Money
        </h3>
        <p className="text-xs text-slate-500">Pavlovian conditioning. Every positive event has a sound.</p>
      </div>
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} className="text-slate-500" />}
              <span className="text-sm text-white font-medium">Sound Effects</span>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">Sound Tiers</p>
            {SOUND_TIERS.map((tier) => (
              <div key={tier.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/20">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{tier.emoji}</span>
                  <div>
                    <p className="text-xs text-white font-medium">{tier.label}</p>
                    <p className="text-[10px] text-slate-500">${tier.min.toLocaleString()} - {tier.max === Infinity ? "∞" : `$${tier.max.toLocaleString()}`}</p>
                  </div>
                </div>
                <button className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                  onClick={() => toast.success(`${tier.emoji} ${tier.label}!`, { description: `Playing sound for $${tier.min.toLocaleString()}+ discoveries` })}>
                  Preview
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MorningRitualPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"ritual" | "toilet" | "sound" | "withdrawal">("ritual");
  const [ritualStep, setRitualStep] = useState(0);
  const [ritualStarted, setRitualStarted] = useState(false);
  const [ritualComplete, setRitualComplete] = useState(false);
  const [breatheIn, setBreatheIn] = useState(true);
  const [stepProgress, setStepProgress] = useState(0);

  const { data: todayRitual } = trpc.morningRitual.getToday.useQuery(undefined, { enabled: !!user });
  const { data: streakData } = trpc.morningRitual.getStreak.useQuery(undefined, { enabled: !!user });
  const startMutation = trpc.morningRitual.start.useMutation({
    onSuccess: () => { utils.morningRitual.getToday.invalidate(); },
  });
  const completeStepMutation = trpc.morningRitual.completeStep.useMutation({
    onSuccess: (data) => {
      if (data.justCompleted) {
        toast.success("Morning Ritual Complete!", { description: `+${data.xpGained} XP, +${data.coinsGained} RC` });
      }
      utils.morningRitual.getToday.invalidate();
      utils.morningRitual.getStreak.invalidate();
    },
  });

  useEffect(() => {
    if (todayRitual?.isComplete) {
      setRitualComplete(true);
      setRitualStarted(true);
    }
  }, [todayRitual]);

  useEffect(() => {
    if (!ritualStarted || ritualStep !== 0) return;
    const timer = setInterval(() => setBreatheIn(prev => !prev), 4000);
    return () => clearInterval(timer);
  }, [ritualStarted, ritualStep]);

  useEffect(() => {
    if (!ritualStarted || ritualComplete) return;
    const step = RITUAL_STEPS[ritualStep];
    if (!step) return;
    const interval = 100;
    const increment = (interval / (step.duration * 1000)) * 100;
    const timer = setInterval(() => {
      setStepProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          completeStepMutation.mutate({ stepIndex: ritualStep });
          if (ritualStep < RITUAL_STEPS.length - 1) {
            setTimeout(() => { setRitualStep(s => s + 1); setStepProgress(0); }, 500);
          } else {
            setRitualComplete(true);
          }
          return 100;
        }
        return prev + increment;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [ritualStarted, ritualStep, ritualComplete]);

  const tabs = [
    { id: "ritual" as const, label: "Morning Ritual", icon: Sun, color: "text-amber-400" },
    { id: "toilet" as const, label: "Quick Wins", icon: Clock, color: "text-cyan-400" },
    { id: "sound" as const, label: "Sound of Money", icon: Volume2, color: "text-emerald-400" },
    { id: "withdrawal" as const, label: "Re-Engage", icon: AlertTriangle, color: "text-red-400" },
  ];

  const currentStep = RITUAL_STEPS[ritualStep];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sun className="text-amber-400" /> Daily Rituals
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Own the first 90 seconds. Condition the brain. Build the habit.
            {streakData && <span className="text-orange-400 ml-2">🔥 {streakData.currentStreak} day streak</span>}
          </p>
        </div>

        <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? "bg-slate-700 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>
                <Icon size={14} className={activeTab === tab.id ? tab.color : ""} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "ritual" && (
          <div className="space-y-4">
            {!ritualStarted ? (
              <Card className="bg-gradient-to-br from-amber-500/5 to-amber-900/10 border-amber-500/20">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center mx-auto">
                    <Coffee className="text-amber-400" size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user?.name?.split(" ")[0] || "Commander"}</h2>
                    <p className="text-sm text-slate-400 mt-2">Your 90-second Morning Ritual is ready.</p>
                    {streakData && <p className="text-xs text-orange-400 mt-1">🔥 Current streak: {streakData.currentStreak} days ({streakData.totalCompleted} total)</p>}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                    {RITUAL_STEPS.map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <Icon size={14} className={step.iconColor} />
                          <span>{step.duration}s</span>
                        </div>
                      );
                    })}
                  </div>
                  <Button className="bg-amber-600 hover:bg-amber-500 text-white font-black px-8 h-12 rounded-xl text-lg"
                    disabled={startMutation.isPending}
                    onClick={() => { startMutation.mutate(); setRitualStarted(true); }}>
                    Begin Ritual <ArrowRight className="ml-2" size={18} />
                  </Button>
                </CardContent>
              </Card>
            ) : ritualComplete ? (
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 border-emerald-500/30">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-400/20 border-2 border-emerald-400/40 flex items-center justify-center mx-auto animate-pulse">
                    <CheckCircle className="text-emerald-400" size={36} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Ritual Complete</h2>
                    <p className="text-sm text-slate-400 mt-2">You're centered, informed, and ready to dominate.</p>
                  </div>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-black text-yellow-400">+{todayRitual?.xpEarned ?? 100}</p>
                      <p className="text-xs text-slate-500">XP Earned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-orange-400">🔥</p>
                      <p className="text-xs text-slate-500">{streakData?.currentStreak ?? 1} Day Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-emerald-400">+{todayRitual?.coinsEarned ?? 50}</p>
                      <p className="text-xs text-slate-500">RC Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {RITUAL_STEPS.map((_, i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < ritualStep ? "bg-emerald-400" : i === ritualStep ? "bg-amber-400" : "bg-slate-700"}`}>
                      {i === ritualStep && <div className="h-full bg-amber-400 rounded-full transition-all duration-100" style={{ width: `${stepProgress}%` }} />}
                    </div>
                  ))}
                </div>
                <Card className={`bg-gradient-to-br ${currentStep?.bgGradient} border-slate-700/50 min-h-[300px]`}>
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                    <Badge className="bg-black/20 text-white/60 border-white/10 text-[10px]">Step {ritualStep + 1} of {RITUAL_STEPS.length}</Badge>
                    {ritualStep === 0 ? (
                      <BreathingCircle active={breatheIn} />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center">
                        {currentStep && <currentStep.icon size={28} className={currentStep.iconColor} />}
                      </div>
                    )}
                    <div className="mt-4">
                      <h2 className="text-2xl font-black text-white">{currentStep?.title}</h2>
                      <p className="text-sm text-slate-400 mt-2">{currentStep?.subtitle}</p>
                    </div>
                    {ritualStep === 1 && (
                      <div className="text-center">
                        <p className="text-3xl font-black text-emerald-400"><AnimatedCounter target={47200} /></p>
                        <p className="text-xs text-slate-500 mt-1">Discovered while you slept</p>
                      </div>
                    )}
                    {ritualStep === 2 && (
                      <div className="flex items-center gap-3">
                        <Flame className="text-orange-400" size={32} />
                        <span className="text-4xl font-black text-orange-400">{streakData?.currentStreak ?? 1}</span>
                        <span className="text-sm text-slate-400">day streak</span>
                      </div>
                    )}
                    {ritualStep === 3 && (
                      <div className="bg-black/20 rounded-xl p-4 border border-cyan-500/20 w-full max-w-xs">
                        <p className="text-sm text-cyan-400 font-bold">AI Discovery</p>
                        <p className="text-xs text-slate-400 mt-1">The Martinez family is overpaying $23,400/yr in taxes. A charitable remainder trust fixes this.</p>
                      </div>
                    )}
                    {ritualStep === 4 && (
                      <div className="bg-black/20 rounded-xl p-4 border border-violet-500/20 w-full max-w-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={14} className="text-violet-400" />
                          <span className="text-xs text-violet-400 font-bold">Daily Quest</span>
                        </div>
                        <p className="text-sm text-white font-bold">Complete 3 client follow-ups</p>
                        <p className="text-xs text-slate-500 mt-1">Reward: 75 XP + Rare Loot Drop</p>
                      </div>
                    )}
                    <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs"
                      onClick={() => {
                        completeStepMutation.mutate({ stepIndex: ritualStep });
                        if (ritualStep < RITUAL_STEPS.length - 1) {
                          setRitualStep(s => s + 1);
                          setStepProgress(0);
                        } else {
                          setRitualComplete(true);
                        }
                      }}>
                      {ritualStep < RITUAL_STEPS.length - 1 ? "Skip →" : "Complete ✓"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "toilet" && <ToiletDashboard />}
        {activeTab === "sound" && <SoundSettings />}
        {activeTab === "withdrawal" && <WithdrawalSymptoms />}
      </div>
    </AppShell>
  );
}
