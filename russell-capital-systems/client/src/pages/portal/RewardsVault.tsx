// @ts-nocheck
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Gem, Crown, Trophy, Lock, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/* ═════════════════════════════════════════════════════════════════
   REWARDS VAULT — The addiction engine.
   RussellCoin. Loot Shop. Daily Rewards. Collections.
   Switching costs so high, leaving feels like amputation.
   ═══════════════════════════════════════════════════════════════════ */

function RussellCoinBalance() {
  const { data: profile } = trpc.experience.getProfile.useQuery(undefined, { retry: 1 });
  const balance = profile?.russellCoin ?? 0;

  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-900/30 via-amber-800/20 to-amber-900/30 border border-amber-500/30 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-600/20 border-2 border-amber-500/50 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-3xl">🪙</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold">RussellCoin Balance</div>
            <div className="text-3xl font-black text-amber-400 tracking-tight font-mono">{balance.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Earn coins by using tools, completing quests, and winning challenges</div>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center gap-1 justify-end">
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="text-xs text-emerald-400">Level {profile?.level ?? 1}: {profile?.levelName ?? 'Rookie'}</span>
          </div>
          <div className="text-[10px] text-slate-500">{profile?.totalXp?.toLocaleString() ?? 0} Total XP</div>
        </div>
      </div>
    </div>
  );
}

function DailyRewardCalendar() {
  const today = new Date().getDate();
  const rewards = Array.from({ length: 7 }, (_, i) => {
    const day = i + 1;
    const claimed = day <= 4; // Mock: first 4 days claimed
    const isToday = day === 5;
    const items = [
      { emoji: "🪙", label: "50 RC", rarity: "common" },
      { emoji: "🪙", label: "100 RC", rarity: "common" },
      { emoji: "🎁", label: "Loot Box", rarity: "uncommon" },
      { emoji: "🪙", label: "200 RC", rarity: "common" },
      { emoji: "💎", label: "Rare Loot", rarity: "rare" },
      { emoji: "🪙", label: "500 RC", rarity: "uncommon" },
      { emoji: "👑", label: "Epic Loot", rarity: "epic" },
    ];
    return { day, claimed, isToday, ...items[i] };
  });

  return (
    <Card className="bg-[#0b1628] border-[#1a3055]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daily Login Rewards</h3>
          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">Day 5 of 7</Badge>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {rewards.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                if (r.isToday) toast.success(`Claimed: ${r.label}!`, { icon: r.emoji });
                else if (!r.claimed) toast.info("Come back tomorrow!");
              }}
              className={`rounded-xl border p-2 text-center transition-all ${
                r.claimed
                  ? "bg-emerald-500/10 border-emerald-500/30 opacity-60"
                  : r.isToday
                  ? "bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20 animate-pulse cursor-pointer"
                  : "bg-[#0a1628] border-[#1a3055] opacity-40"
              }`}
            >
              <div className="text-[9px] font-semibold text-slate-400 mb-0.5">Day {r.day}</div>
              <div className="text-xl mb-0.5">{r.claimed ? "✅" : r.emoji}</div>
              <div className="text-[9px] font-bold text-white">{r.label}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LootShop() {
  const items = [{ name: "XP Booster (2x, 24h)", emoji: "⚡", price: 500, rarity: "uncommon", desc: "Double all XP earned for 24 hours" },
,
    { name: "Custom Title Color", emoji: "🎨", price: 1000, rarity: "rare", desc: "Change your title color on the leaderboard" },
,
    { name: "Profile Border: Gold", emoji: "✨", price: 2000, rarity: "rare", desc: "Gold animated border on your avatar" },
,
    { name: "Exclusive Badge: Diamond", emoji: "💎", price: 5000, rarity: "epic", desc: "Ultra-rare diamond badge for your profile" },
,
    { name: "Strategy Template Pack", emoji: "📋", price: 750, rarity: "uncommon", desc: "5 premium strategy templates" }
];

  const rarityColors: Record<string, { border: string; bg: string; text: string }> = {
    common: { border: "border-slate-500/30", bg: "bg-slate-500/5", text: "text-slate-400" },
    uncommon: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-400" },
    rare: { border: "border-blue-500/30", bg: "bg-blue-500/5", text: "text-blue-400" },
    epic: { border: "border-violet-500/30", bg: "bg-violet-500/5", text: "text-violet-400" },
    legendary: { border: "border-amber-500/30", bg: "bg-amber-500/5", text: "text-amber-400" },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-400">Spend your RussellCoins on exclusive items, boosts, and cosmetics.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, i) => {
          const r = rarityColors[item.rarity];
          return (
            <div key={i} className={`rounded-xl ${r.bg} border ${r.border} p-4 hover:scale-[1.02] transition-all`}>
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                  </div>
                  <Badge variant="outline" className={`text-[8px] ${r.text} border-current px-1 py-0 mb-1`}>
                    {item.rarity.toUpperCase()}
                  </Badge>
                  <p className="text-[10px] text-slate-400 mb-2">{item.desc}</p>
                  <Button
                    size="sm"
                    className="w-full bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 text-xs"
                    onClick={() => toast.success(`Purchased: ${item.name}!`, { icon: item.emoji })}
                  >
                    🪙 {item.price.toLocaleString()} RC
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollectionSystem() {
  const collections = [
    {
      name: "The Strategist Set", emoji: "🧠", owned: 4, total: 6,
      items: [
        { name: "Roth Master", emoji: "⚗️", owned: true },
        { name: "Tax Ninja", emoji: "🥷", owned: true },
        { name: "Estate Guardian", emoji: "🏰", owned: true },
        { name: "Income Architect", emoji: "🏗️", owned: true },
        { name: "Risk Oracle", emoji: "🔮", owned: false },
        { name: "Wealth Sage", emoji: "🧙", owned: false },
      ],
      reward: "Exclusive 'Master Strategist' title + 5000 RC",
    },
    {
      name: "The Speed Demon Set", emoji: "⚡", owned: 2, total: 4,
      items: [
        { name: "Quick Quote", emoji: "💨", owned: true },
        { name: "Speed Calc", emoji: "🏎️", owned: true },
        { name: "Flash Close", emoji: "⚡", owned: false },
        { name: "Instant Analysis", emoji: "🔬", owned: false },
      ],
      reward: "Permanent 1.5x XP boost on speed challenges",
    },
    {
      name: "The Social Butterfly Set", emoji: "🦋", owned: 3, total: 5,
      items: [
        { name: "Story Teller", emoji: "📖", owned: true },
        { name: "Challenge King", emoji: "👑", owned: true },
        { name: "Predictor", emoji: "🎱", owned: true },
        { name: "Team Player", emoji: "🤝", owned: false },
        { name: "Viral Legend", emoji: "🌊", owned: false },
      ],
      reward: "Custom animated profile frame + 3000 RC",
    },
  ];

  return (
    <div className="space-y-4">
      {collections.map((col, i) => (
        <Card key={i} className="bg-[#0b1628] border-[#1a3055]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{col.emoji}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{col.name}</h4>
                  <div className="text-[10px] text-slate-400">{col.owned}/{col.total} collected</div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-1.5 w-24 rounded-full bg-[#0a1628] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: `${(col.owned / col.total) * 100}%` }} />
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">{Math.round((col.owned / col.total) * 100)}%</div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {col.items.map((item, j) => (
                <div
                  key={j}
                  className={`rounded-lg border p-2 text-center ${
                    item.owned
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-[#0a1628] border-[#1a3055] opacity-40"
                  }`}
                  title={item.name}
                >
                  <div className="text-lg">{item.owned ? item.emoji : "❓"}</div>
                  <div className="text-[8px] font-semibold text-white truncate">{item.name}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <Gift size={14} className="text-amber-400 flex-shrink-0" />
              <span className="text-[10px] text-amber-300">Complete set reward: {col.reward}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PrestigeSystem() {
  const prestiges = [
    { level: 1, name: "Bronze", emoji: "🥉", unlocked: true, benefit: "Access to basic loot shop" },
    { level: 2, name: "Silver", emoji: "🥈", unlocked: true, benefit: "1.2x RC earning rate" },
    { level: 3, name: "Gold", emoji: "🥇", unlocked: true, benefit: "Exclusive gold profile border" },
    { level: 4, name: "Platinum", emoji: "💠", unlocked: false, benefit: "1.5x XP + exclusive challenges" },
    { level: 5, name: "Diamond", emoji: "💎", unlocked: false, benefit: "2x RC + diamond badge" },
    { level: 6, name: "Obsidian", emoji: "🖤", unlocked: false, benefit: "Custom theme + name glow" },
    { level: 7, name: "Legendary", emoji: "⭐", unlocked: false, benefit: "All perks + legendary crown" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-slate-400">Reach max level, prestige, and start again with permanent bonuses.</p>
      <div className="space-y-2">
        {prestiges.map((p, i) => (
          <div key={i} className={`flex items-center gap-4 rounded-xl border p-3 transition-all ${
            p.unlocked
              ? "bg-gradient-to-r from-amber-500/5 to-transparent border-amber-500/20"
              : "bg-[#0b1628] border-[#1a3055] opacity-50"
          }`}>
            <div className="w-10 h-10 rounded-xl bg-[#0a1628] border border-[#1a3055] flex items-center justify-center text-xl">
              {p.unlocked ? p.emoji : "🔒"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Prestige {p.level}: {p.name}</span>
                {p.unlocked && <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 px-1 py-0">UNLOCKED</Badge>}
              </div>
              <div className="text-[10px] text-slate-400">{p.benefit}</div>
            </div>
            {!p.unlocked && (
              <Lock size={14} className="text-slate-600 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RewardsVault() {
  const [tab, setTab] = useState("shop");
  const utils = trpc.useUtils();
  const { data: profile } = trpc.experience.getProfile.useQuery(undefined, { retry: 1 });
  const { data: dailyReward } = trpc.experience.getDailyRewardStatus.useQuery(undefined, { retry: 1 });
  const claimDaily = trpc.experience.claimDailyReward.useMutation({
    onSuccess: () => {
      toast.success("Daily reward claimed!", { icon: "\u{1F381}" });
      utils.experience.getDailyRewardStatus.invalidate();
      utils.experience.getProfile.invalidate();
    },
  });
  const purchaseLoot = trpc.experience.purchaseLoot.useMutation({
    onSuccess: () => {
      toast.success("Item purchased from the Loot Shop!", { icon: "\u{1F48E}" });
      utils.experience.getProfile.invalidate();
      utils.experience.getLoot.invalidate();
    },
  });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Gift className="text-emerald-400" size={24} /> Rewards Vault
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Your treasure room. Earn it. Spend it. Collect it. Never leave it.</p>
        </div>

        {/* RussellCoin Balance */}
        <RussellCoinBalance />

        {/* Daily Rewards */}
        <DailyRewardCalendar />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#0a1628] border border-[#1a3055]">
            <TabsTrigger value="shop" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Gem size={14} className="mr-1" /> Loot Shop
            </TabsTrigger>
            <TabsTrigger value="collections" className="text-xs data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <Trophy size={14} className="mr-1" /> Collections
            </TabsTrigger>
            <TabsTrigger value="prestige" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Crown size={14} className="mr-1" /> Prestige
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-4"><LootShop /></TabsContent>
          <TabsContent value="collections" className="mt-4"><CollectionSystem /></TabsContent>
          <TabsContent value="prestige" className="mt-4"><PrestigeSystem /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
