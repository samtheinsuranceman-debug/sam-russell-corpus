// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Flame,
  Star,
  Trophy,
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  Gift,
  ChevronRight,
  Target,
  DollarSign,
  Volume2,
  VolumeX,
  Sunrise,
  Moon,
  Sun,
  ArrowUp,
  BarChart3,
  Users,
  Shield,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════
   THE NERVE CENTER — Where the addiction begins.
   A living, breathing command center that makes you feel alive.
   ═══════════════════════════════════════════════════════════════════ */

function useBreathingPulse(bpm: number = 6) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => (p + 1) % 360);
    }, (60 / bpm / 360) * 1000 * 60);
    return () => clearInterval(interval);
  }, [bpm]);
  const intensity = Math.sin((phase * Math.PI) / 180);
  return { intensity, phase };
}

function StreakFlame({ days }: { days: number }) {
  const flameSize = Math.min(days, 30);
  const flameColor = days >= 30 ? "text-violet-400" : days >= 14 ? "text-amber-400" : days >= 7 ? "text-orange-400" : "text-red-400";
  const label = days >= 100 ? "INFERNO" : days >= 30 ? "BLAZING" : days >= 14 ? "ON FIRE" : days >= 7 ? "HEATING UP" : days >= 3 ? "WARMING UP" : "SPARK";

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Flame className={`${flameColor} animate-pulse`} size={20 + flameSize * 0.5} />
        {days >= 7 && <Flame className={`${flameColor} absolute -top-1 -right-1 opacity-60`} size={12} />}
        {days >= 30 && <Sparkles className="text-yellow-300 absolute -top-2 left-0 opacity-80" size={10} />}
      </div>
      <div>
        <div className="text-xs font-bold text-white">{days}-Day Streak</div>
        <div className={`text-[10px] font-semibold ${flameColor}`}>{label}</div>
      </div>
    </div>
  );
}

function XPBar({ current, max, level, levelName }: { current: number; max: number; level: number; levelName: string }) {
  const pct = Math.min((current / max) * 100, 100);
  const LEVEL_COLORS = [
    "from-slate-500 to-slate-400",
    "from-emerald-600 to-emerald-400",
    "from-blue-600 to-blue-400",
    "from-violet-600 to-violet-400",
    "from-amber-600 to-amber-400",
    "from-orange-600 to-orange-400",
    "from-rose-600 to-rose-400",
    "from-fuchsia-600 to-fuchsia-400",
    "from-cyan-600 to-cyan-400",
    "from-yellow-500 to-yellow-300",
  ];
  const gradient = LEVEL_COLORS[Math.min(level - 1, 9)];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-sm font-black text-amber-400">
            {level}
          </div>
          <div>
            <div className="text-xs font-bold text-white">{levelName}</div>
            <div className="text-[10px] text-slate-400">{current.toLocaleString()} / {max.toLocaleString()} XP</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500">Next Level</div>
          <div className="text-xs font-semibold text-emerald-400">{(max - current).toLocaleString()} XP</div>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-[#0a1628] border border-[#1a3055] overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out relative`}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

function WealthTicker({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const target = value;
    const duration = 2000;
    const start = displayed;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  const formatted = displayed >= 1_000_000
    ? `$${(displayed / 1_000_000).toFixed(2)}M`
    : displayed >= 1_000
    ? `$${(displayed / 1_000).toFixed(1)}K`
    : `$${displayed.toLocaleString()}`;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-900/30 via-emerald-800/20 to-emerald-900/30 border border-emerald-500/20 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.08),transparent_70%)]" />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-semibold mb-1">Total Wealth Discovered</div>
        <div className="text-3xl font-black text-emerald-400 tracking-tight font-mono">{formatted}</div>
        <div className="flex items-center gap-1 mt-1">
          <ArrowUp size={12} className="text-emerald-400" />
          <span className="text-xs text-emerald-400/80">+$12.4K today</span>
        </div>
      </div>
    </div>
  );
}

function MorningRitual({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const icon = hour < 12 ? <Sunrise size={20} /> : hour < 17 ? <Sun size={20} /> : <Moon size={20} />;

  const ritualSteps = [
    { title: `${greeting}, Commander`, subtitle: "Your empire awaits. Let's see what happened overnight.", icon: icon, color: "text-amber-400" },
    { title: "3 New Opportunities Found", subtitle: "Your AI discovered $847K in potential wealth while you slept.", icon: <DollarSign size={20} />, color: "text-emerald-400" },
    { title: "Daily Discovery Card", subtitle: "\"The best time to plant a tree was 20 years ago. The second best time is now.\"", icon: <Lightbulb size={20} />, color: "text-violet-400" },
  ];

  if (!visible) return null;

  const current = ritualSteps[step];

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0f1e35] via-[#132544] to-[#0f1e35] border border-amber-500/20 p-5 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center ${current?.color}`}>
          {current?.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white mb-0.5">{current?.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{current?.subtitle}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-amber-400 hover:text-amber-300 text-xs"
          onClick={() => {
            if (step < ritualSteps.length - 1) {
              setStep(s => s + 1);
            } else {
              setVisible(false);
              onComplete();
              toast.success("Morning Ritual Complete! +50 XP", { icon: "☀️" });
            }
          }}
        >
          {step < ritualSteps.length - 1 ? "Next" : "Begin"} <ChevronRight size={14} />
        </Button>
      </div>
      <div className="flex gap-1 mt-3">
        {ritualSteps.map((_, i) => (
          <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-amber-400" : "bg-[#1a3055]"}`} />
        ))}
      </div>
    </div>
  );
}

function FortuneCookie() {
  const [revealed, setRevealed] = useState(false);
  const fortunes = [
    "A client you haven't spoken to in 60 days is about to make a major financial decision without you.",
    "The next Roth conversion you run will uncover a six-figure tax savings opportunity.",
    "Someone in your pipeline is comparing you to a robo-advisor right now. Call them.",
    "Your biggest competitor just lost their best advisor. Their clients are looking.",
    "The annuity you almost recommended last week just increased its cap rate by 2%.",
    "A referral is coming from someone you helped 3 years ago. Be ready.",
    "The client who ghosted you is about to inherit $500K. Follow up today.",
    "Your next closed deal will come from the tool you use least.",
  ];
  const [fortune] = useState(() => fortunes[Math.floor(Math.random() * fortunes.length)]);

  return (
    <button
      onClick={() => {
        if (!revealed) {
          setRevealed(true);
          toast.success("+25 XP — Fortune Cookie Opened!", { icon: "🥠" });
        }
      }}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-500 ${
        revealed
          ? "bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30"
          : "bg-gradient-to-br from-[#0f1e35] to-[#132544] border-[#1a3055] hover:border-amber-500/30 hover:bg-[#132544] cursor-pointer"
      }`}
    >
      {revealed ? (
        <div className="animate-in fade-in duration-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🥠</span>
            <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">Today's Fortune</span>
          </div>
          <p className="text-sm text-amber-200/90 leading-relaxed italic">"{fortune}"</p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl animate-bounce">
            🥠
          </div>
          <div>
            <div className="text-xs font-bold text-white">Daily Fortune Cookie</div>
            <div className="text-[10px] text-slate-400">Tap to crack it open (+25 XP)</div>
          </div>
        </div>
      )}
    </button>
  );
}

function QuickWinCards() {
  const wins = [
    { title: "Roth Conversion Window", desc: "3 clients in the 22% bracket could save $47K by converting before Dec 31", icon: <Zap size={16} />, color: "text-violet-400", bgColor: "from-violet-500/10 to-violet-600/5", xp: 100 },
    { title: "Stale Client Alert", desc: "Michael Torres hasn't been contacted in 45 days — he has a $320K IRA rollover pending", icon: <Clock size={16} />, color: "text-amber-400", bgColor: "from-amber-500/10 to-amber-600/5", xp: 50 },
    { title: "Market Opportunity", desc: "MYGA rates just hit 5.8% — 7 clients with expiring CDs could benefit", icon: <TrendingUp size={16} />, color: "text-emerald-400", bgColor: "from-emerald-500/10 to-emerald-600/5", xp: 75 },
    { title: "Cross-Sell Detected", desc: "Lauren Hall has life insurance but no annuity — her risk profile suggests a FIA", icon: <Target size={16} />, color: "text-blue-400", bgColor: "from-blue-500/10 to-blue-600/5", xp: 60 },
    { title: "Birthday Approaching", desc: "James Wilson turns 59½ in 12 days — penalty-free withdrawal conversation time", icon: <Gift size={16} />, color: "text-rose-400", bgColor: "from-rose-500/10 to-rose-600/5", xp: 40 },
    { title: "Policy Review Due", desc: "Annual review for 5 IUL policies — potential for increased allocation", icon: <Shield size={16} />, color: "text-cyan-400", bgColor: "from-cyan-500/10 to-cyan-600/5", xp: 80 },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Wins</h3>
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
          {wins.length} Available
        </Badge>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
        {wins.map((win, i) => (
          <button
            key={i}
            onClick={() => toast.success(`+${win.xp} XP — Quick Win Claimed!`, { icon: "⚡" })}
            className={`w-full text-left rounded-lg bg-gradient-to-r ${win.bgColor} border border-white/5 p-3 hover:border-white/10 transition-all group`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${win.color}`}>{win.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{win.title}</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 px-1 py-0">
                    +{win.xp} XP
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{win.desc}</p>
              </div>
              <ChevronRight size={14} className="text-slate-600 group-hover:text-white transition-colors mt-1 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AchievementShowcase() {
  const achievements = [
    { name: "First Blood", emoji: "⚔️", desc: "Closed your first deal", unlocked: true },
    { name: "Century Club", emoji: "💯", desc: "100 clients managed", unlocked: true },
    { name: "Million Dollar Baby", emoji: "💎", desc: "$1M in discovered wealth", unlocked: true },
    { name: "Streak Master", emoji: "🔥", desc: "30-day login streak", unlocked: false, progress: 18, max: 30 },
    { name: "Calculator King", emoji: "🧮", desc: "Used every calculator", unlocked: false, progress: 14, max: 20 },
    { name: "Night Owl", emoji: "🦉", desc: "Logged in after midnight", unlocked: false },
    { name: "Speed Demon", emoji: "⚡", desc: "Closed a deal in under 24 hours", unlocked: false },
    { name: "The Collector", emoji: "🏆", desc: "Earned 50 badges", unlocked: false, progress: 23, max: 50 },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Achievements</h3>
        <span className="text-[10px] text-slate-400">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {achievements.map((a, i) => (
          <div
            key={i}
            className={`relative rounded-lg border p-2 text-center transition-all ${
              a.unlocked
                ? "bg-gradient-to-b from-amber-500/10 to-amber-600/5 border-amber-500/30 hover:border-amber-400/50"
                : "bg-[#0a1628] border-[#1a3055] opacity-60 hover:opacity-80"
            }`}
            title={a.desc}
          >
            <div className="text-xl mb-0.5">{a.unlocked ? a.emoji : "🔒"}</div>
            <div className="text-[9px] font-semibold text-white truncate">{a.name}</div>
            {!a.unlocked && a.progress !== undefined && (
              <div className="mt-1 h-1 rounded-full bg-[#1a3055] overflow-hidden">
                <div className="h-full bg-amber-500/50 rounded-full" style={{ width: `${(a.progress / (a.max || 1)) * 100}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyDungeonPreview() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const dungeons = [
    { name: "The Roth Gauntlet", desc: "Convert 3 scenarios in under 5 minutes", reward: "500 XP + Rare Badge", difficulty: "HARD", color: "text-red-400" },
    { name: "Tax Harvest Sprint", desc: "Find the optimal tax-loss harvest for a sample portfolio", reward: "300 XP", difficulty: "MEDIUM", color: "text-amber-400" },
    { name: "Speed Quote Challenge", desc: "Generate 5 accurate quotes in 3 minutes", reward: "200 XP", difficulty: "EASY", color: "text-emerald-400" },
  ];

  const [todayDungeon] = useState(() => dungeons[Math.floor(Math.random() * dungeons.length)]);

  return (
    <div className="rounded-xl bg-gradient-to-br from-red-900/20 via-[#0f1e35] to-violet-900/20 border border-red-500/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <Swords size={16} className="text-red-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Daily Dungeon</div>
            <div className="text-[10px] text-slate-400">Resets in {timeLeft}</div>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] ${todayDungeon.color} border-current`}>
          {todayDungeon.difficulty}
        </Badge>
      </div>
      <div className="space-y-1">
        <div className="text-sm font-bold text-white">{todayDungeon.name}</div>
        <p className="text-[11px] text-slate-400">{todayDungeon.desc}</p>
        <div className="flex items-center gap-1 mt-2">
          <Gift size={12} className="text-amber-400" />
          <span className="text-[10px] text-amber-400 font-semibold">{todayDungeon.reward}</span>
        </div>
      </div>
      <Link href="/portal/arena">
        <Button size="sm" className="w-full mt-3 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs">
          Enter Dungeon <ChevronRight size={14} />
        </Button>
      </Link>
    </div>
  );
}

function Swords(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" x2="19" y1="19" y2="13" /><line x1="16" x2="20" y1="16" y2="20" /><line x1="19" x2="21" y1="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" /><line x1="5" x2="9" y1="14" y2="18" /><line x1="7" x2="4" y1="17" y2="20" /><line x1="3" x2="5" y1="19" y2="21" />
    </svg>
  );
}

function SocialProofTicker() {
  const [index, setIndex] = useState(0);
  const events = [
    { text: "An advisor in Texas just discovered $1.2M in hidden wealth", time: "2m ago", icon: "💰" },
    { text: "Someone unlocked the 'Speed Demon' achievement", time: "5m ago", icon: "⚡" },
    { text: "A 50-day streak was just recorded in Florida", time: "8m ago", icon: "🔥" },
    { text: "3 new Roth conversions completed this hour", time: "12m ago", icon: "📊" },
    { text: "An advisor just hit Level 8: Legacy Builder", time: "15m ago", icon: "🏰" },
    { text: "Someone earned the 'Million Dollar Baby' badge", time: "18m ago", icon: "💎" },
    { text: "A new personal best: 12 scenarios in one session", time: "22m ago", icon: "🏆" },
  ];

  useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % events.length), 4000);
    return () => clearInterval(interval);
  }, [events.length]);

  const current = events[index];

  return (
    <div className="rounded-lg bg-[#0a1628] border border-[#1a3055] px-3 py-2 overflow-hidden">
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500" key={index}>
        <span className="text-sm flex-shrink-0">{current.icon}</span>
        <span className="text-[11px] text-slate-300 truncate flex-1">{current.text}</span>
        <span className="text-[10px] text-slate-500 flex-shrink-0">{current.time}</span>
      </div>
    </div>
  );
}

function DopamineCalendar() {
  const dayOfWeek = new Date().getDay();
  const events = [
    { day: "Mon", name: "Strategy Monday", emoji: "🧠", desc: "Double XP on all strategy tools", active: dayOfWeek === 1 },
    { day: "Tue", name: "Client Tuesday", emoji: "🤝", desc: "Bonus points for client outreach", active: dayOfWeek === 2 },
    { day: "Wed", name: "Wealth Wednesday", emoji: "💰", desc: "Hidden loot drops everywhere", active: dayOfWeek === 3 },
    { day: "Thu", name: "Thunder Thursday", emoji: "⚡", desc: "Speed challenges unlocked", active: dayOfWeek === 4 },
    { day: "Fri", name: "Flash Friday", emoji: "🎉", desc: "Mystery rewards & rare badges", active: dayOfWeek === 5 },
    { day: "Sat", name: "Study Saturday", emoji: "📚", desc: "Knowledge base XP boost", active: dayOfWeek === 6 },
    { day: "Sun", name: "Reset Sunday", emoji: "🌅", desc: "Weekly recap & fresh quests", active: dayOfWeek === 0 },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider">This Week's Events</h3>
      <div className="grid grid-cols-7 gap-1">
        {events.map((e, i) => (
          <div
            key={i}
            className={`rounded-lg p-1.5 text-center transition-all ${
              e.active
                ? "bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 ring-1 ring-emerald-500/20"
                : "bg-[#0a1628] border border-[#1a3055]"
            }`}
            title={`${e.name}: ${e.desc}`}
          >
            <div className="text-[9px] font-semibold text-slate-400">{e.day}</div>
            <div className="text-base my-0.5">{e.emoji}</div>
            {e.active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mx-auto animate-pulse" />}
          </div>
        ))}
      </div>
    </div>
  );
}

const LEVEL_THRESHOLDS = [0, 1000, 3000, 6000, 10000, 15000, 22000, 30000, 40000, 55000, 75000];
function getXpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] || 75000;
}
function getXpForCurrentLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)] || 0;
}

export default function NerveCenter() {
  const { user } = useAuth();
  const { intensity } = useBreathingPulse(6);
  const [showRitual, setShowRitual] = useState(true);
  const [soundOn, setSoundOn] = useState(false);

  const { data: profile } = trpc.experience.getProfile.useQuery(undefined, { retry: 1 });
  const { data: clientsData } = trpc.clients.list.useQuery(undefined, { retry: 1 });
  const { data: achievements } = trpc.experience.getAchievements.useQuery(undefined, { retry: 1 });
  const { data: activeQuests } = trpc.experience.getActiveQuests.useQuery(undefined, { retry: 1 });
  const { data: dailyReward } = trpc.experience.getDailyRewardStatus.useQuery(undefined, { retry: 1 });
  const checkInMutation = trpc.experience.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Daily check-in complete! Streak extended.", { icon: "\u{1F525}" });
    },
  });

  const streakDays = profile?.currentStreak ?? 0;
  const totalXp = profile?.totalXp ?? 0;
  const level = profile?.level ?? 1;
  const levelName = profile?.levelName ?? "Rookie";
  const currentLevelXp = getXpForCurrentLevel(level);
  const nextLevelXp = getXpForNextLevel(level);
  const currentXP = totalXp - currentLevelXp;
  const maxXP = nextLevelXp - currentLevelXp;
  const totalWealth = (clientsData as any[])?.reduce((sum: number, c: any) => sum + (Number(c.totalNetWorth) || 0), 0) ?? 0;

  return (
    <AppShell>
      {/* Breathing background overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, rgba(34,197,94,${0.02 + intensity * 0.015}) 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">The Nerve Center</h1>
            <p className="text-xs text-slate-400 mt-0.5">Your empire's command center. Every pulse is money.</p>
          </div>
          <div className="flex items-center gap-3">
            <StreakFlame days={streakDays} />
            <button
              onClick={() => setSoundOn(!soundOn)}
              className="p-2 rounded-lg bg-[#0a1628] border border-[#1a3055] hover:border-white/20 transition-colors"
              title={soundOn ? "Mute sounds" : "Enable sounds"}
            >
              {soundOn ? <Volume2 size={14} className="text-emerald-400" /> : <VolumeX size={14} className="text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Social Proof Ticker */}
        <SocialProofTicker />

        {/* Morning Ritual */}
        {showRitual && <MorningRitual onComplete={() => setShowRitual(false)} />}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column — Stats & Progress */}
          <div className="lg:col-span-2 space-y-5">
            {/* XP & Wealth Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#0b1628] border-[#1a3055]">
                <CardContent className="p-4">
                  <XPBar current={currentXP} max={maxXP} level={level} levelName={levelName} />
                </CardContent>
              </Card>
              <WealthTicker value={totalWealth} />
            </div>

            {/* Quick Wins */}
            <Card className="bg-[#0b1628] border-[#1a3055]">
              <CardContent className="p-4">
                <QuickWinCards />
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-[#0b1628] border-[#1a3055]">
              <CardContent className="p-4">
                <AchievementShowcase />
              </CardContent>
            </Card>

            {/* Dopamine Calendar */}
            <Card className="bg-[#0b1628] border-[#1a3055]">
              <CardContent className="p-4">
                <DopamineCalendar />
              </CardContent>
            </Card>
          </div>

          {/* Right Column — Engagement */}
          <div className="space-y-5">
            {/* Fortune Cookie */}
            <FortuneCookie />

            {/* Daily Dungeon */}
            <DailyDungeonPreview />

            {/* Quick Stats */}
            <Card className="bg-[#0b1628] border-[#1a3055]">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Today's Stats</h3>
                {[
                  { label: "Actions Taken", value: "23", icon: <Zap size={14} className="text-violet-400" />, change: "+8" },
                  { label: "Clients Touched", value: "7", icon: <Users size={14} className="text-blue-400" />, change: "+3" },
                  { label: "Scenarios Run", value: "12", icon: <BarChart3 size={14} className="text-emerald-400" />, change: "+5" },
                  { label: "XP Earned", value: "450", icon: <Star size={14} className="text-amber-400" />, change: "+450" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1a3055] last:border-0">
                    <div className="flex items-center gap-2">
                      {stat.icon}
                      <span className="text-xs text-slate-300">{stat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{stat.value}</span>
                      <span className="text-[10px] text-emerald-400">+{stat.change}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Navigation Quick Links */}
            <Card className="bg-[#0b1628] border-[#1a3055]">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Explore</h3>
                {[
                  { label: "The Arena", path: "/portal/arena", icon: <Trophy size={14} />, color: "text-amber-400" },
                  { label: "My World", path: "/portal/my-world", icon: <Sparkles size={14} />, color: "text-violet-400" },
                  { label: "War Room", path: "/portal/war-room", icon: <Target size={14} />, color: "text-red-400" },
                  { label: "Rewards Vault", path: "/portal/rewards", icon: <Gift size={14} />, color: "text-emerald-400" },
                ].map((link, i) => (
                  <Link key={i} href={link.path}>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
                      <span className={link.color}>{link.icon}</span>
                      <span className="text-xs text-slate-300 group-hover:text-white transition-colors flex-1 text-left">{link.label}</span>
                      <ChevronRight size={12} className="text-slate-600 group-hover:text-white transition-colors" />
                    </button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
