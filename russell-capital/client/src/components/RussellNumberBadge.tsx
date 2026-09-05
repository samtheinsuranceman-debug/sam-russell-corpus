/**
 * RussellNumberBadge — Universal badge showing the advisor's Russell Number,
 * XP level, streak, and engagement tier.  Pulls from the experience tRPC router.
 * Appears on every COMBO page via <ComboPageWrapper>.
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Trophy, Flame, Star, Zap } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  Rookie: "from-gray-500 to-gray-600",
  Apprentice: "from-green-500 to-green-600",
  Practitioner: "from-blue-500 to-blue-600",
  Specialist: "from-indigo-500 to-indigo-600",
  Optimizer: "from-purple-500 to-purple-600",
  Strategist: "from-pink-500 to-pink-600",
  Expert: "from-orange-500 to-orange-600",
  Master: "from-amber-500 to-amber-600",
  "Grand Master": "from-red-500 to-red-600",
  Legend: "from-yellow-400 to-yellow-600",
  Mythic: "from-cyan-400 to-cyan-600",
  Transcendent: "from-fuchsia-400 to-fuchsia-600",
};

export function RussellNumberBadge({ compact = false }: { compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const { data: profile } = trpc.experience.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const tierGradient = useMemo(
    () => TIER_COLORS[profile?.levelName || "Rookie"] || TIER_COLORS.Rookie,
    [profile?.levelName]
  );

  if (!isAuthenticated || !profile) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 rounded-lg px-3 py-1.5">
        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tierGradient} flex items-center justify-center`}>
          <Trophy className="w-3 h-3 text-white" />
        </div>
        <div>
          <div className="text-[10px] text-white/40">Lv.{profile.level}</div>
          <div className="text-xs font-bold text-white">{profile.levelName}</div>
        </div>
        {profile.currentStreak > 0 && (
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-3 h-3" />
            <span className="text-[10px] font-bold">{profile.currentStreak}</span>
          </div>
        )}
      </div>
    );
  }

  // XP progress to next level
  const xpRange = profile.xpForNextLevel - profile.xpForCurrentLevel;
  const xpIntoLevel = profile.totalXp - profile.xpForCurrentLevel;
  const xpProgress = xpRange > 0 ? (xpIntoLevel / xpRange) * 100 : 100;
  const xpRemaining = Math.max(0, profile.xpForNextLevel - profile.totalXp);

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${tierGradient} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-white" />
            <div>
              <div className="text-xs font-bold text-white/70">Russell Number</div>
              <div className="text-lg font-black text-white">{profile.levelName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">Lv.{profile.level}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 space-y-2">
        {/* XP Bar */}
        <div>
          <div className="flex justify-between text-[10px] text-white/40 mb-1">
            <span>XP: {profile.totalXp?.toLocaleString()}</span>
            <span>{xpRemaining > 0 ? `${xpRemaining.toLocaleString()} to next` : "MAX"}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tierGradient} transition-all`}
              style={{ width: `${Math.min(xpProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{profile.currentStreak || 0}</div>
            <div className="text-[10px] text-white/40">Streak</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{profile.russellCoin || 0}</div>
            <div className="text-[10px] text-white/40">Coins</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <Zap className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{profile.totalCheckIns || 0}</div>
            <div className="text-[10px] text-white/40">Check-ins</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RussellNumberBadge;
