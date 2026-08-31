/**
 * AchievementUnlockOverlay — Full-screen celebration when an achievement is unlocked.
 * Plays Sound of Money "level-up" trigger, shows animated badge with particles.
 * Polls for newly unlocked achievements and displays them one at a time.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEntrainment } from "@/contexts/EntrainmentEngine";
import { Trophy, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const RARITY_STYLES: Record<string, { border: string; glow: string; bg: string; text: string }> = {
  common: { border: "border-gray-400", glow: "shadow-gray-400/30", bg: "from-gray-500/20 to-gray-600/20", text: "text-gray-300" },
  rare: { border: "border-blue-400", glow: "shadow-blue-400/40", bg: "from-blue-500/20 to-indigo-500/20", text: "text-blue-400" },
  epic: { border: "border-purple-400", glow: "shadow-purple-400/50", bg: "from-purple-500/20 to-pink-500/20", text: "text-purple-400" },
  legendary: { border: "border-amber-400", glow: "shadow-amber-400/60", bg: "from-amber-500/20 to-orange-500/20", text: "text-amber-400" },
};

interface Achievement {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  rarity: string;
  xp: number;
  coin: number;
}

export function AchievementUnlockOverlay() {
  const { isAuthenticated } = useAuth();
  const { playSoundEffect } = useEntrainment();
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [animPhase, setAnimPhase] = useState<"enter" | "show" | "exit">("enter");
  const seenSlugs = useRef<Set<string>>(new Set());

  // Poll achievements every 15s
  const { data: achievements } = trpc.experience.getAchievements.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15000,
    retry: false,
  });

  // Detect newly unlocked achievements
  useEffect(() => {
    if (!achievements?.unlocked) return;
    const newlyUnlocked: Achievement[] = [];
    for (const a of achievements.unlocked) {
      if (!seenSlugs.current.has(a.achievementSlug)) {
        seenSlugs.current.add(a.achievementSlug);
        // Only show if unlocked in the last 60 seconds
        const unlockedAt = new Date(a.unlockedAt).getTime();
        if (Date.now() - unlockedAt < 60000) {
          const def = achievements.all?.find((d: any) => d.slug === a.achievementSlug);
          if (def) newlyUnlocked.push(def);
        }
      }
    }
    if (newlyUnlocked.length > 0) {
      setQueue(prev => [...prev, ...newlyUnlocked]);
    }
  }, [achievements]);

  // Process queue
  useEffect(() => {
    if (current || queue.length === 0) return;
    const next = queue[0];
    setQueue(prev => prev.slice(1));
    setCurrent(next);
    setAnimPhase("enter");

    // Play sound
    try { playSoundEffect?.("level-up"); } catch {}

    // Animation sequence
    setTimeout(() => setAnimPhase("show"), 100);
    setTimeout(() => setAnimPhase("exit"), 4000);
    setTimeout(() => setCurrent(null), 4500);
  }, [current, queue, playSoundEffect]);

  const dismiss = useCallback(() => {
    setAnimPhase("exit");
    setTimeout(() => setCurrent(null), 500);
  }, []);

  if (!current) return null;

  const style = RARITY_STYLES[current.rarity] || RARITY_STYLES.common;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-500 ${
        animPhase === "enter" ? "opacity-0" :
        animPhase === "show" ? "opacity-100" :
        "opacity-0 scale-95"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${style.text} opacity-80`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: "currentColor",
            }}
          />
        ))}
      </div>

      {/* Badge card */}
      <div
        className={`relative bg-[#0b1628] border-2 ${style.border} rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl ${style.glow} transition-all duration-500 ${
          animPhase === "show" ? "scale-100 translate-y-0" : "scale-90 translate-y-8"
        }`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 text-[#4a6585] hover:text-white"
          onClick={dismiss}
        >
          <X size={16} />
        </Button>

        {/* Rarity label */}
        <div className="text-center mb-4">
          <span className={`text-[10px] uppercase font-bold tracking-widest ${style.text}`}>
            {current.rarity} Achievement
          </span>
        </div>

        {/* Emoji badge */}
        <div className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center text-5xl mb-4 animate-bounce`}>
          {current.emoji}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-1">
          <Trophy size={18} className={`inline mr-2 ${style.text}`} />
          {current.title}
        </h2>
        <p className="text-sm text-[#7a95b8] text-center mb-4">{current.description}</p>

        {/* Rewards */}
        <div className="flex items-center justify-center gap-4">
          {current.xp > 0 && (
            <div className="flex items-center gap-1 bg-[#060f1e] rounded-lg px-3 py-1.5">
              <Star size={14} className="text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">+{current.xp} XP</span>
            </div>
          )}
          {current.coin > 0 && (
            <div className="flex items-center gap-1 bg-[#060f1e] rounded-lg px-3 py-1.5">
              <span className="text-sm">🪙</span>
              <span className="text-sm font-bold text-amber-400">+{current.coin} RC</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
