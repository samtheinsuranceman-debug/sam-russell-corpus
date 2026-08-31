// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Share2,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Users,
  Flame,
  Star,
  Zap,
  Crown,
  Heart,
  Sparkles,
} from "lucide-react";


interface SlideData {
  id: string;
  bg: string;
  icon: any;
  iconColor: string;
  title: string;
  subtitle: string;
  bigNumber: string;
  bigLabel: string;
  detail: string;
  funFact?: string;
}

export default function RussellWrapped() {
  const { user } = useAuth();
  const profileQuery = trpc.experience.getProfile.useQuery();
  const clientsQuery = trpc.clients.list.useQuery();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const profile = profileQuery.data;
  const clients = clientsQuery.data as any[] | undefined;
  const totalWealth = useMemo(() => clients?.reduce((s: number, c: any) => s + Number(c.totalNetWorth ?? 0), 0) ?? 0, [clients]);
  const totalClients = clients?.length ?? 0;

  const slides: SlideData[] = useMemo(() => [
    {
      id: "intro", bg: "from-emerald-600 via-emerald-800 to-black",
      icon: Sparkles, iconColor: "text-emerald-300",
      title: "Your 2025 Wrapped", subtitle: `${user?.name?.split(" ")[0] ?? "Advisor"}, what a year.`,
      bigNumber: "365", bigLabel: "Days of Building Wealth",
      detail: "Let's look back at everything you accomplished.",
    },
    {
      id: "clients", bg: "from-blue-600 via-blue-800 to-black",
      icon: Users, iconColor: "text-blue-300",
      title: "Clients Served", subtitle: "Every client is a family protected.",
      bigNumber: totalClients.toString(), bigLabel: "Families You Helped",
      detail: `That's ${totalClients} families sleeping better at night because of you.`,
      funFact: totalClients > 20 ? "You're in the top 10% of advisors on the platform." : "Every empire starts with one client.",
    },
    {
      id: "wealth", bg: "from-green-600 via-green-800 to-black",
      icon: DollarSign, iconColor: "text-green-300",
      title: "Wealth Discovered", subtitle: "Money found. Lives changed.",
      bigNumber: `$${(totalWealth / 1_000_000).toFixed(1)}M`, bigLabel: "Total Assets Under Management",
      detail: `If you stacked $${(totalWealth / 1_000_000).toFixed(1)}M in $100 bills, it would be ${Math.round(totalWealth / 100 * 0.0043 / 12)} feet tall.`,
      funFact: "That's more than most advisors discover in a decade.",
    },
    {
      id: "streak", bg: "from-orange-600 via-orange-800 to-black",
      icon: Flame, iconColor: "text-orange-300",
      title: "Your Dedication", subtitle: "Consistency is the real superpower.",
      bigNumber: (profile?.longestStreak ?? 0).toString(), bigLabel: "Longest Streak (Days)",
      detail: `Your current streak is ${profile?.currentStreak ?? 0} days. ${(profile?.currentStreak ?? 0) > 7 ? "You're on fire right now." : "Time to build it back up."}`,
      funFact: (profile?.longestStreak ?? 0) > 30 ? "Only 3% of users maintain a 30+ day streak." : undefined,
    },
    {
      id: "xp", bg: "from-purple-600 via-purple-800 to-black",
      icon: Zap, iconColor: "text-purple-300",
      title: "Experience Earned", subtitle: "Every action made you stronger.",
      bigNumber: (profile?.totalXp ?? 0).toLocaleString(), bigLabel: "Total XP Earned",
      detail: `You reached Level ${profile?.level ?? 1} — ${profile?.levelName ?? "Optimizer"}. That's not luck. That's work.`,
    },
    {
      id: "coins", bg: "from-amber-600 via-amber-800 to-black",
      icon: Crown, iconColor: "text-amber-300",
      title: "RussellCoin Earned", subtitle: "The currency of excellence.",
      bigNumber: (profile?.lifetimeRussellCoin ?? 0).toLocaleString(), bigLabel: "Lifetime RussellCoin",
      detail: `You currently hold ${(profile?.russellCoin ?? 0).toLocaleString()} RC. Spend wisely — or hoard like a dragon.`,
    },
    {
      id: "topClient", bg: "from-teal-600 via-teal-800 to-black",
      icon: Star, iconColor: "text-teal-300",
      title: "Your Biggest Win", subtitle: "The one that made you smile.",
      bigNumber: clients && clients.length > 0 ? `$${(Math.max(...clients.map((c: any) => Number(c.totalNetWorth ?? 0))) / 1000).toFixed(0)}K` : "$0",
      bigLabel: "Largest Client Portfolio",
      detail: "Behind every number is a family's future secured.",
    },
    {
      id: "outro", bg: "from-emerald-600 via-teal-800 to-black",
      icon: Heart, iconColor: "text-red-400",
      title: "Thank You", subtitle: `${user?.name?.split(" ")[0] ?? "Advisor"}, you're building something special.`,
      bigNumber: "2026", bigLabel: "Is Going to Be Even Bigger",
      detail: "Share your Wrapped with your team. Let them see what's possible.",
      funFact: "The best is yet to come.",
    },
  ], [profile, clients, totalWealth, totalClients, user]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= slides.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <AppShell>
      <div className="min-h-screen bg-black flex flex-col">
        {/* Slide */}
        <div className={`flex-1 bg-gradient-to-b ${slide.bg} transition-all duration-700 flex flex-col items-center justify-center p-8 relative overflow-hidden`}>
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 text-center max-w-lg mx-auto">
            <SlideIcon className={`w-12 h-12 ${slide.iconColor} mx-auto mb-6 animate-pulse`} />
            <p className="text-sm font-medium text-white/60 uppercase tracking-widest mb-2">{slide.subtitle}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">{slide.title}</h1>

            <div className="mb-8">
              <p className="text-[72px] sm:text-[96px] font-black text-white leading-none tracking-tight">{slide.bigNumber}</p>
              <p className="text-lg text-white/70 mt-2">{slide.bigLabel}</p>
            </div>

            <p className="text-white/60 text-lg leading-relaxed mb-4">{slide.detail}</p>
            {slide.funFact && (
              <Badge className="bg-white/10 text-white/80 border-white/20 text-sm">{slide.funFact}</Badge>
            )}
          </div>

          {/* Progress dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "bg-white w-6" : "bg-white/30 hover:bg-white/50"}`}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black border-t border-white/10 p-4">
          <div className="container flex items-center justify-between max-w-lg mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="text-white/60 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                {isPlaying ? "Pause" : "Play All"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const text = `My Russell Capital Wrapped 2025:\n${totalClients} families helped\n$${(totalWealth / 1_000_000).toFixed(1)}M in wealth discovered\nLevel ${profile?.level ?? 1} ${profile?.levelName ?? "Optimizer"}\n${(profile?.totalXp ?? 0).toLocaleString()} XP earned\n\n#RussellCapitalWrapped`;
                  navigator.clipboard.writeText(text);
                  toast.success("Wrapped summary copied! Share it with your team.");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === slides.length - 1}
              className="text-white/60 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
