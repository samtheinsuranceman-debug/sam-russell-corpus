// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Star,
  Zap,
  Target,
  Shield,
  Crown,
  Gift,
  ChevronRight,
  Lock,
  Sparkles,
  Brain,
  Heart,
  Compass,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEntrainment } from "@/contexts/EntrainmentEngine";

/* ═════════════════════════════════════════════════════════════════
   THE ARENA — Where advisors become legends.
   Quests. Skill Trees. Daily Dungeons. Loot. Leaderboards.
   Every action is gameplay. Every calculation is a combo.
   ═══════════════════════════════════════════════════════════════════ */

function SwordIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" x2="19" y1="19" y2="13" /><line x1="16" x2="20" y1="16" y2="20" /><line x1="19" x2="21" y1="21" y2="19" />
    </svg>
  );
}

function getAutoQuests() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekOfYear = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 604800000);

  const dailyPool = [
    { title: "Morning Warrior", desc: "Complete 3 actions before noon", xp: 100, max: 3, icon: "☀️", rarity: "common" as const },
    { title: "Client Whisperer", desc: "Contact 2 clients today", xp: 150, max: 2, icon: "🤝", rarity: "common" as const },
    { title: "Number Cruncher", desc: "Run 5 calculations", xp: 200, max: 5, icon: "🧮", rarity: "uncommon" as const },
    { title: "Strategy Architect", desc: "Create 2 new strategies", xp: 250, max: 2, icon: "🏗️", rarity: "uncommon" as const },
    { title: "Data Miner", desc: "View 10 client profiles", xp: 120, max: 10, icon: "⛏️", rarity: "common" as const },
    { title: "Pipeline Pusher", desc: "Update 3 deal stages", xp: 180, max: 3, icon: "🚀", rarity: "common" as const },
    { title: "Knowledge Seeker", desc: "Access 4 different tools", xp: 160, max: 4, icon: "📚", rarity: "common" as const },
  ];

  const weeklyPool = [
    { title: "The Closer", desc: "Move 3 deals to the next stage", xp: 500, max: 3, icon: "🎯", rarity: "rare" as const },
    { title: "Tool Explorer", desc: "Use 10 different tools this week", xp: 750, max: 10, icon: "🧭", rarity: "rare" as const },
    { title: "Revenue Hunter", desc: "Add $500K in pipeline value", xp: 800, max: 500000, icon: "💰", rarity: "rare" as const },
    { title: "Client Magnet", desc: "Add 5 new clients this week", xp: 600, max: 5, icon: "🧲", rarity: "rare" as const },
    { title: "Strategy Master", desc: "Complete 8 strategy analyses", xp: 900, max: 8, icon: "🎓", rarity: "epic" as const },
    { title: "Combo Breaker", desc: "Achieve 3 tool combos", xp: 1000, max: 3, icon: "⚡", rarity: "epic" as const },
  ];

  const dailyStart = (dayOfWeek * 3) % dailyPool.length;
  const dailies = [0, 1, 2].map(i => {
    const q = dailyPool[(dailyStart + i) % dailyPool.length];
    return { ...q, id: `daily-${i}`, type: "daily" as const, progress: Math.floor(Math.random() * q.max) };
  });

  const weeklyStart = (weekOfYear * 2) % weeklyPool.length;
  const weeklies = [0, 1].map(i => {
    const q = weeklyPool[(weeklyStart + i) % weeklyPool.length];
    return { ...q, id: `weekly-${i}`, type: "weekly" as const, progress: Math.floor(Math.random() * q.max * 0.6) };
  });

  return { dailies, weeklies };
}

const EPIC_QUEST_CHAINS = [
  {
    id: "epic-chain-1", type: "epic" as const, title: "The Million Dollar Quest",
    desc: "Discover $1M in new wealth opportunities", xp: 2000,
    progress: 650000, max: 1000000, icon: "💎", rarity: "epic" as const,
    chain: ["Find $250K", "Find $500K", "Find $750K", "Find $1M"],
    chainProgress: 2,
  },
  {
    id: "epic-chain-2", type: "epic" as const, title: "Roth Conversion Master",
    desc: "Complete 50 Roth conversion analyses", xp: 3000,
    progress: 32, max: 50, icon: "⚗️", rarity: "epic" as const,
    chain: ["10 Conversions", "25 Conversions", "40 Conversions", "50 Conversions"],
    chainProgress: 2,
  },
  {
    id: "legendary-1", type: "legendary" as const, title: "Legendary Advisor",
    desc: "Reach Level 10 and close 100 deals", xp: 10000,
    progress: 42, max: 100, icon: "⭐", rarity: "legendary" as const,
    chain: ["Level 5", "25 Deals", "Level 8", "50 Deals", "Level 10", "100 Deals"],
    chainProgress: 3,
  },
];

const RARITY_COLORS = {
  common: { border: "border-slate-500/30", bg: "from-slate-500/10 to-slate-600/5", text: "text-slate-400", label: "Common", glow: "" },
  uncommon: { border: "border-emerald-500/30", bg: "from-emerald-500/10 to-emerald-600/5", text: "text-emerald-400", label: "Uncommon", glow: "" },
  rare: { border: "border-blue-500/30", bg: "from-blue-500/10 to-blue-600/5", text: "text-blue-400", label: "Rare", glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]" },
  epic: { border: "border-violet-500/30", bg: "from-violet-500/10 to-violet-600/5", text: "text-violet-400", label: "Epic", glow: "shadow-[0_0_20px_rgba(139,92,246,0.2)]" },
  legendary: { border: "border-amber-500/30", bg: "from-amber-500/10 to-amber-600/5", text: "text-amber-400", label: "Legendary", glow: "shadow-[0_0_25px_rgba(245,158,11,0.25)]" },
};

function QuestCard({ quest }: { quest: any }) {
  const rarity = RARITY_COLORS[quest.rarity as keyof typeof RARITY_COLORS];
  const pct = Math.min((quest.progress / quest.max) * 100, 100);
  const isComplete = quest.progress >= quest.max;
  const { playSoundEffect } = useEntrainment();

  return (
    <div className={`rounded-xl bg-gradient-to-r ${rarity.bg} border ${rarity.border} ${rarity.glow} p-4 transition-all hover:scale-[1.01] ${isComplete ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{quest.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-white">{quest.title}</span>
            <Badge variant="outline" className={`text-[9px] ${rarity.text} border-current px-1 py-0`}>
              {rarity.label}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">{quest.desc}</p>
          {/* Epic quest chain visualization */}
          {quest.chain && (
            <div className="flex items-center gap-1 mb-2">
              {quest.chain.map((step: string, i: number) => (
                <div key={i} className="flex items-center flex-1">
                  <div className={`flex-1 h-6 rounded text-[8px] font-medium flex items-center justify-center ${
                    i < quest.chainProgress
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : i === quest.chainProgress
                      ? "bg-violet-500/10 text-violet-400 border border-dashed border-violet-500/30 animate-pulse"
                      : "bg-[#0a1628] text-slate-600 border border-[#1a3055]"
                  }`}>
                    {i < quest.chainProgress ? "✓" : step}
                  </div>
                  {i < quest.chain.length - 1 && <ChevronRight size={8} className="text-slate-600 mx-0.5 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-[#0a1628] overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-violet-500"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 flex-shrink-0">
              {quest.max >= 10000 ? `${(quest.progress / 1000).toFixed(0)}K / ${(quest.max / 1000).toFixed(0)}K` : `${quest.progress} / ${quest.max}`}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400">{quest.xp.toLocaleString()}</span>
          </div>
          <span className="text-[9px] text-slate-500">XP</span>
        </div>
      </div>
    </div>
  );
}

const SKILL_BRANCHES = [{ name: "MYGA Master", emoji: "🏦", color: "emerald", level: 4, maxLevel: 5, skills: ["Rate Analysis", "Carrier Compare", "Split Strategy", "Guarantee Stacking", "MYGA Domination"], desc: "Master the art of Multi-Year Guaranteed Annuities" },
,
  { name: "IUL Architect", emoji: "🏗️", color: "cyan", level: 3, maxLevel: 5, skills: ["Index Selection", "Cap Optimization", "Loan Strategy", "AG49 Mastery", "IUL Legendary"], desc: "Design perfect Indexed Universal Life strategies" },
,
  { name: "Roth Alchemist", emoji: "⚗️", color: "violet", level: 5, maxLevel: 5, skills: ["Conversion Basics", "Tax Bracket Play", "Ladder Strategy", "Mega Backdoor", "Roth Perfection"], desc: "Transform tax-deferred assets into tax-free gold" },
,
  { name: "Tax Strategist", emoji: "📊", color: "orange", level: 2, maxLevel: 5, skills: ["Bracket Awareness", "Harvest Timing", "Estate Shields", "Trust Structures", "Tax Invisibility"], desc: "Navigate the tax code like a financial ninja" },
,
  { name: "Estate Guardian", emoji: "🏰", color: "amber", level: 1, maxLevel: 5, skills: ["Will Basics", "Trust Formation", "Asset Protection", "Dynasty Planning", "Legacy Immortal"], desc: "Protect and transfer wealth across generations" }
];

const SKILL_COLOR_MAP: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10", cyan: "border-cyan-500/30 bg-cyan-500/10",
  violet: "border-violet-500/30 bg-violet-500/10", orange: "border-orange-500/30 bg-orange-500/10",
  amber: "border-amber-500/30 bg-amber-500/10", teal: "border-teal-500/30 bg-teal-500/10",
  rose: "border-rose-500/30 bg-rose-500/10", blue: "border-blue-500/30 bg-blue-500/10",
  red: "border-red-500/30 bg-red-500/10",
};

function SkillBranch({ branch }: { branch: typeof SKILL_BRANCHES[0] }) {
  const colorClass = SKILL_COLOR_MAP[branch.color] || "border-slate-500/30 bg-slate-500/10";
  return (
    <div className={`rounded-xl border ${colorClass} p-4 transition-all hover:scale-[1.02]`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{branch.emoji}</div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">{branch.name}</div>
          <div className="text-[10px] text-slate-400">{branch.desc}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-white">{branch.level}<span className="text-xs text-slate-500">/{branch.maxLevel}</span></div>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-2">
        {branch.skills.map((skill, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`w-full h-7 rounded-md flex items-center justify-center text-[9px] font-semibold transition-all ${
              i < branch.level ? "bg-white/10 text-white border border-white/20" :
              i === branch.level ? "bg-white/5 text-slate-400 border border-dashed border-white/10 animate-pulse" :
              "bg-[#0a1628] text-slate-600 border border-[#1a3055]"
            }`} title={skill}>
              {i < branch.level ? "✓" : i === branch.level ? "→" : <Lock size={10} />}
            </div>
            {i < branch.skills.length - 1 && <div className={`w-2 h-0.5 flex-shrink-0 ${i < branch.level ? "bg-white/20" : "bg-[#1a3055]"}`} />}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-500">
        {branch.level < branch.maxLevel ? `Next: ${branch.skills[branch.level]}` : "✨ MASTERED"}
      </div>
    </div>
  );
}

const LOOT_ITEMS = [
  { name: "Bronze Strategy Token", emoji: "🪙", rarity: "common" as const, desc: "Redeemable for 1 free strategy run" },
  { name: "Silver Insight Crystal", emoji: "🔮", rarity: "uncommon" as const, desc: "Unlocks hidden market insight" },
  { name: "Gold Conversion Key", emoji: "🗝️", rarity: "rare" as const, desc: "Instant Roth conversion analysis" },
  { name: "Diamond Client Magnet", emoji: "💎", rarity: "epic" as const, desc: "Auto-generates 3 referral leads" },
  { name: "Legendary Crown", emoji: "👑", rarity: "legendary" as const, desc: "Permanent 2x XP boost for 1 week" },
  { name: "Emerald Shield", emoji: "🛡️", rarity: "rare" as const, desc: "Blocks 1 compliance audit" },
  { name: "Ruby Heart", emoji: "❤️", rarity: "epic" as const, desc: "Instant client satisfaction boost" },
  { name: "Sapphire Compass", emoji: "🧭", rarity: "uncommon" as const, desc: "Reveals optimal next action" },
];

function SlotMachineLoot() {
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState<typeof LOOT_ITEMS[0] | null>(null);
  const [reelItems, setReelItems] = useState<string[]>([]);
  const { playSoundEffect } = useEntrainment();

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setRevealed(null);

    const reel = Array.from({ length: 20 }, () => LOOT_ITEMS[Math.floor(Math.random() * LOOT_ITEMS.length)].emoji);
    setReelItems(reel);

    const roll = Math.random() * 100;
    let picked: typeof LOOT_ITEMS[0];
    if (roll < 1) picked = LOOT_ITEMS.find(l => l.rarity === "legendary")!;
    else if (roll < 5) picked = LOOT_ITEMS.find(l => l.rarity === "epic")!;
    else if (roll < 20) picked = LOOT_ITEMS[Math.floor(Math.random() * LOOT_ITEMS.filter(l => l.rarity === "rare").length + 3)];
    else if (roll < 50) picked = LOOT_ITEMS.find(l => l.rarity === "uncommon")!;
    else picked = LOOT_ITEMS[0];

    setTimeout(() => {
      setSpinning(false);
      setRevealed(picked);
      playSoundEffect("loot-reveal");
      toast.success(`You found: ${picked.name}!`, { icon: picked.emoji });
    }, 2500);
  }, [spinning, playSoundEffect]);

  const revealRarity = revealed ? RARITY_COLORS[revealed.rarity] : null;

  return (
    <Card className="bg-[#0b1628] border-[#1a3055] overflow-hidden">
      <CardContent className="p-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Gift size={14} className="text-amber-400" /> Loot Drop Machine
        </h3>

        {/* Slot Machine Reel */}
        <div className="relative h-24 mb-4 rounded-xl bg-[#060e1a] border border-[#1a3055] overflow-hidden">
          {/* Reel window */}
          <div className="absolute inset-0 flex items-center justify-center">
            {spinning ? (
              <div className="animate-slot-spin flex flex-col items-center gap-2">
                {reelItems.map((emoji, i) => (
                  <span key={i} className="text-4xl">{emoji}</span>
                ))}
              </div>
            ) : revealed ? (
              <div className={`text-center animate-loot-reveal`}>
                <span className="text-5xl block mb-1">{revealed.emoji}</span>
                <span className={`text-xs font-bold ${revealRarity?.text}`}>{revealRarity?.label}</span>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-4xl block mb-1">❓</span>
                <span className="text-[10px] text-slate-500">Pull to reveal</span>
              </div>
            )}
          </div>

          {/* Glow overlay on reveal */}
          {revealed && (
            <div className={`absolute inset-0 animate-loot-glow ${
              revealed.rarity === "legendary" ? "bg-amber-500/10" :
              revealed.rarity === "epic" ? "bg-violet-500/10" :
              revealed.rarity === "rare" ? "bg-blue-500/10" : "bg-emerald-500/5"
            }`} />
          )}

          {/* Scan lines for slot machine feel */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)"
          }} />
        </div>

        {/* Revealed item details */}
        {revealed && (
          <div className={`rounded-lg bg-gradient-to-r ${revealRarity?.bg} border ${revealRarity?.border} ${revealRarity?.glow} p-3 mb-4 animate-fade-in`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{revealed.emoji}</span>
              <div>
                <div className="text-sm font-bold text-white">{revealed.name}</div>
                <div className="text-[10px] text-slate-400">{revealed.desc}</div>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={spin}
          disabled={spinning}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold"
        >
          {spinning ? (
            <span className="flex items-center gap-2"><Sparkles size={16} className="animate-spin" /> Spinning...</span>
          ) : (
            <span className="flex items-center gap-2"><Gift size={16} /> Pull the Lever!</span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function LootInventory() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Loot Drops</h3>
      {LOOT_ITEMS.slice(0, 5).map((item, i) => {
        const rarity = RARITY_COLORS[item.rarity];
        return (
          <div key={i} className={`flex items-center gap-3 rounded-lg bg-gradient-to-r ${rarity.bg} border ${rarity.border} ${rarity.glow} p-2.5 transition-all hover:scale-[1.02]`}>
            <span className="text-xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{item.name}</span>
                <Badge variant="outline" className={`text-[8px] ${rarity.text} border-current px-1 py-0`}>{rarity.label}</Badge>
              </div>
              <span className="text-[10px] text-slate-400">{item.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComboTracker() {
  const combos = [
    { name: "Discovery Combo", chain: ["Fact Finder", "Risk Assessment", "Strategy Lab"], completed: 2, multiplier: "2x", active: true },
    { name: "Conversion Chain", chain: ["Roth Analysis", "Tax Waterfall", "Scenario Builder"], completed: 1, multiplier: "3x", active: true },
    { name: "Full Spectrum", chain: ["IUL", "Annuity", "Real Estate", "Tax", "Estate"], completed: 5, multiplier: "5x", active: false },
  ];
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Combos</h3>
      {combos.map((combo, i) => (
        <div key={i} className={`rounded-lg border p-3 ${combo.active ? "border-violet-500/30 bg-violet-500/5" : "border-[#1a3055] bg-[#0a1628]"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white">{combo.name}</span>
            <Badge variant="outline" className={`text-[10px] ${combo.active ? "text-violet-400 border-violet-500/30" : "text-slate-500 border-slate-500/30"}`}>
              {combo.multiplier} XP
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {combo.chain.map((step, j) => (
              <div key={j} className="flex items-center flex-1">
                <div className={`flex-1 h-6 rounded text-[9px] font-medium flex items-center justify-center ${
                  j < combo.completed ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "bg-[#0a1628] text-slate-600 border border-[#1a3055]"
                }`}>{step}</div>
                {j < combo.chain.length - 1 && <ChevronRight size={10} className="text-slate-600 mx-0.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Arena() {
  const [tab, setTab] = useState("quests");
  const { playSoundEffect } = useEntrainment();

  const { data: profile } = trpc.experience.getProfile.useQuery(undefined, { retry: 1 });
  const { data: skillTree } = trpc.experience.getSkillTree.useQuery(undefined, { retry: 1 });
  const { data: lootInventory } = trpc.experience.getLoot.useQuery(undefined, { retry: 1 });
  const { data: lootShop } = trpc.experience.getLootShop.useQuery(undefined, { retry: 1 });
  const utils = trpc.useUtils();

  const claimReward = trpc.experience.claimQuestReward.useMutation({
    onSuccess: () => {
      playSoundEffect("quest-complete");
      toast.success("Quest reward claimed!", { icon: "⚔️" });
      utils.experience.getProfile.invalidate();
      utils.experience.getActiveQuests.invalidate();
    },
  });

  const investSkill = trpc.experience.investInSkill.useMutation({
    onSuccess: () => {
      playSoundEffect("xp-ping");
      toast.success("Skill upgraded!", { icon: "🧠" });
      utils.experience.getSkillTree.invalidate();
      utils.experience.getProfile.invalidate();
    },
  });

  const purchaseLoot = trpc.experience.purchaseLoot.useMutation({
    onSuccess: () => {
      playSoundEffect("ka-ching");
      toast.success("Item purchased!", { icon: "🎁" });
      utils.experience.getLoot.invalidate();
      utils.experience.getProfile.invalidate();
    },
  });

  const xpDisplay = profile?.totalXp?.toLocaleString() ?? "0";
  const levelDisplay = profile?.level ?? 1;

  const autoQuests = useMemo(() => getAutoQuests(), []);

  return (
    <AppShell>
      {/* Slot machine animation styles */}
      <style>{`
        @keyframes slotSpin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-80%); }
        }
        @keyframes lootReveal {
          0% { transform: scale(0.3) rotateY(180deg); opacity: 0; }
          50% { transform: scale(1.2) rotateY(90deg); opacity: 0.8; }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
        @keyframes lootGlow {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slot-spin { animation: slotSpin 2.5s cubic-bezier(0.2, 0.8, 0.3, 1) forwards; }
        .animate-loot-reveal { animation: lootReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-loot-glow { animation: lootGlow 1s ease-in-out; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-400" size={24} /> The Arena
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Every action is gameplay. Every calculation is a combo. Level up or get left behind.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs font-bold text-amber-400">{xpDisplay} XP</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <span className="text-xs font-bold text-violet-400">Level {levelDisplay}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#0a1628] border border-[#1a3055] flex-wrap">
            <TabsTrigger value="quests" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Target size={14} className="mr-1" /> Quests
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-xs data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <Brain size={14} className="mr-1" /> Skill Tree
            </TabsTrigger>
            <TabsTrigger value="loot" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Gift size={14} className="mr-1" /> Loot
            </TabsTrigger>
            <TabsTrigger value="combos" className="text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Zap size={14} className="mr-1" /> Combos
            </TabsTrigger>
          </TabsList>

          {/* Quests Tab */}
          <TabsContent value="quests" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-amber-400">☀️</span> Daily Quests
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">Resets at midnight</Badge>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Auto-generated</Badge>
              </h3>
              <div className="space-y-2">
                {autoQuests.dailies.map(q => <QuestCard key={q.id} quest={q} />)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-blue-400">📅</span> Weekly Quests
                <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">Resets Monday</Badge>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Auto-generated</Badge>
              </h3>
              <div className="space-y-2">
                {autoQuests.weeklies.map(q => <QuestCard key={q.id} quest={q} />)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-violet-400">💎</span> Epic & Legendary Quest Chains
                <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400">Permanent</Badge>
              </h3>
              <div className="space-y-2">
                {EPIC_QUEST_CHAINS.map(q => <QuestCard key={q.id} quest={q} />)}
              </div>
            </div>
          </TabsContent>

          {/* Skill Tree Tab */}
          <TabsContent value="skills" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SKILL_BRANCHES.map((branch, i) => <SkillBranch key={i} branch={branch} />)}
            </div>
          </TabsContent>

          {/* Loot Tab — with Slot Machine */}
          <TabsContent value="loot" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SlotMachineLoot />
              <div className="space-y-5">
                <LootInventory />
                <Card className="bg-[#0b1628] border-[#1a3055]">
                  <CardContent className="p-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Loot Probability</h3>
                    <div className="space-y-2">
                      {Object.entries(RARITY_COLORS).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className={`text-xs font-semibold w-20 ${val.text}`}>{val.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-[#0a1628] overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${val.bg.replace("to-", "to-").replace("/5", "/30")}`}
                              style={{ width: key === "common" ? "50%" : key === "uncommon" ? "30%" : key === "rare" ? "15%" : key === "epic" ? "4%" : "1%" }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 w-8 text-right">
                            {key === "common" ? "50%" : key === "uncommon" ? "30%" : key === "rare" ? "15%" : key === "epic" ? "4%" : "1%"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Combos Tab */}
          <TabsContent value="combos" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ComboTracker />
              <Card className="bg-[#0b1628] border-[#1a3055]">
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Combo Multipliers</h3>
                  <div className="space-y-3">
                    {[
                      { chain: 2, mult: "1.5x", desc: "Chain 2 related tools" },
                      { chain: 3, mult: "2x", desc: "Chain 3 related tools" },
                      { chain: 4, mult: "3x", desc: "Chain 4 related tools" },
                      { chain: 5, mult: "5x", desc: "Complete a full spectrum" },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[#0a1628] border border-[#1a3055]">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-xs font-black text-violet-400">{c.chain}</div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-white">{c.mult} XP Multiplier</div>
                          <div className="text-[10px] text-slate-400">{c.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
