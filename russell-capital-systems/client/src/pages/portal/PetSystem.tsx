// @ts-nocheck
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Heart, Star, Shield, Crown, Sparkles, Target, Eye, Gem, Sword } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   SECRET #37 — THE PET SYSTEM
   Creates an irrational emotional bond. Impossible to abandon.
   Your financial pet grows as your wealth grows. Neglect it and
   it gets sad. Feed it deals and it evolves.
   ═══════════════════════════════════════════════════════════════════ */

interface PetSpecies {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockLevel: number;
  baseStats: { strength: number; wisdom: number; charisma: number; luck: number };
}

const PET_SPECIES: PetSpecies[] = [
  { id: "phoenix", name: "Wealth Phoenix", emoji: "🔥", description: "Born from the ashes of bad financial decisions. Rises stronger every time.", unlockLevel: 1, baseStats: { strength: 8, wisdom: 5, charisma: 6, luck: 7 } },
  { id: "dragon", name: "Gold Dragon", emoji: "🐉", description: "Hoards wealth like a dragon hoards gold. Breathes compound interest.", unlockLevel: 5, baseStats: { strength: 9, wisdom: 7, charisma: 5, luck: 6 } },
  { id: "eagle", name: "Eagle of Foresight", emoji: "🦅", description: "Sees opportunities from 30,000 feet. Never misses a deal.", unlockLevel: 3, baseStats: { strength: 6, wisdom: 9, charisma: 7, luck: 5 } },
  { id: "wolf", name: "Alpha Wolf", emoji: "🐺", description: "Leads the pack. Hunts in teams. Closes deals with pack mentality.", unlockLevel: 7, baseStats: { strength: 7, wisdom: 6, charisma: 9, luck: 5 } },
  { id: "unicorn", name: "Unicorn of Fortune", emoji: "🦄", description: "Mythically rare. Turns everything it touches into gold.", unlockLevel: 10, baseStats: { strength: 5, wisdom: 8, charisma: 8, luck: 10 } },
];

const EVOLUTION_STAGES = [
  { level: 1, name: "Hatchling", emoji: "🥚", description: "Just born. Full of potential.", bonusMultiplier: 1.0 },
  { level: 5, name: "Juvenile", emoji: "🐣", description: "Growing fast. Learning the ropes.", bonusMultiplier: 1.25 },
  { level: 10, name: "Adolescent", emoji: "🐥", description: "Getting stronger every day.", bonusMultiplier: 1.5 },
  { level: 20, name: "Adult", emoji: "⭐", description: "A force to be reckoned with.", bonusMultiplier: 2.0 },
  { level: 35, name: "Elder", emoji: "👑", description: "Wise beyond years. Commands respect.", bonusMultiplier: 3.0 },
  { level: 50, name: "Legendary", emoji: "💎", description: "Transcended mortality. Pure wealth energy.", bonusMultiplier: 5.0 },
];

const FOOD_ITEMS = [
  { id: "basic_treat", name: "Policy Crumbs", emoji: "🍞", xpGain: 10, happinessGain: 5, cost: 5, description: "Basic sustenance from daily logins", rarity: "common" as const },
  { id: "premium_meal", name: "Deal Steak", emoji: "🥩", xpGain: 25, happinessGain: 15, cost: 15, description: "A juicy closed deal. Your pet's favorite.", rarity: "common" as const },
  { id: "golden_feast", name: "Commission Feast", emoji: "🍖", xpGain: 50, happinessGain: 30, cost: 40, description: "A lavish meal funded by a fat commission check.", rarity: "rare" as const },
  { id: "deal_crumbs", name: "Referral Cake", emoji: "🎂", xpGain: 15, happinessGain: 10, cost: 0, description: "Baked with the sweetness of a warm referral.", rarity: "rare" as const },
  { id: "victory_steak", name: "Million Dollar Truffle", emoji: "🍫", xpGain: 100, happinessGain: 50, cost: 75, description: "Infused with the essence of a million-dollar policy.", rarity: "epic" as const },
];

const ACCESSORIES = [
  { id: "top_hat", name: "Top Hat of Professionalism", emoji: "🎩", slot: "hat", statBonus: "+5 Charisma", cost: 200, rarity: "common" as const },
  { id: "crown", name: "Crown of the Closer", emoji: "👑", slot: "hat", statBonus: "+10 Strength", cost: 500, rarity: "rare" as const },
  { id: "diamond_collar", name: "Diamond Collar", emoji: "💎", slot: "collar", statBonus: "+8 Luck", cost: 750, rarity: "epic" as const },
  { id: "golden_wings", name: "Golden Wings of Ascension", emoji: "🪽", slot: "wings", statBonus: "+15 All Stats", cost: 2000, rarity: "legendary" as const },
  { id: "wealth_aura", name: "Wealth Aura", emoji: "✨", slot: "aura", statBonus: "+20% XP Gain", cost: 3000, rarity: "legendary" as const },
];

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-400 border-slate-500/30 bg-slate-500/10",
  rare: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  epic: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  legendary: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
};

function getEvolutionStageForLevel(level: number) {
  return [...EVOLUTION_STAGES].reverse().find(s => level >= s.level) || EVOLUTION_STAGES[0];
}

function getSpeciesById(id: string) {
  return PET_SPECIES.find(s => s.id === id) || PET_SPECIES[0];
}

function PetDisplay({ pet }: { pet: any }) {
  const [bounce, setBounce] = useState(false);
  const species = getSpeciesById(pet.speciesId);
  const evo = getEvolutionStageForLevel(pet.level);

  useEffect(() => {
    const timer = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 500);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const moodEmoji = pet.happiness > 80 ? "😊" : pet.happiness > 50 ? "😐" : pet.happiness > 20 ? "😢" : "😭";
  const hungerEmoji = pet.hunger > 80 ? "🤤" : pet.hunger > 50 ? "😋" : pet.hunger > 20 ? "😐" : "🍽️";

  return (
    <div className="relative flex flex-col items-center">
      <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 ${
        pet.level >= 35 ? "bg-yellow-500/10" : pet.level >= 20 ? "bg-purple-500/10" : "bg-emerald-500/5"
      }`} />
      <div className={`text-8xl transition-transform duration-300 ${bounce ? "-translate-y-3" : ""}`}>
        {species.emoji}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-lg">{evo.emoji}</span>
        <span className="text-sm font-bold text-white">{pet.name}</span>
      </div>
      <p className="text-xs text-slate-500">{evo.name} {species.name}</p>
      <div className="flex items-center gap-4 mt-3">
        <div className="text-center">
          <span className="text-lg">{moodEmoji}</span>
          <p className="text-[10px] text-slate-500">Mood</p>
        </div>
        <div className="text-center">
          <span className="text-lg">{hungerEmoji}</span>
          <p className="text-[10px] text-slate-500">Hunger</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
          Lv. {pet.level}
        </Badge>
        <span className="text-[10px] text-slate-500">{pet.totalFeedings} feedings</span>
      </div>
    </div>
  );
}

function StatsPanel({ pet }: { pet: any }) {
  const stats = [
    { name: "Strength", value: pet.strength, icon: Sword, color: "text-red-400", barColor: "bg-red-400" },
    { name: "Wisdom", value: pet.wisdom, icon: Eye, color: "text-blue-400", barColor: "bg-blue-400" },
    { name: "Charisma", value: pet.charisma, icon: Star, color: "text-yellow-400", barColor: "bg-yellow-400" },
    { name: "Luck", value: pet.luck, icon: Gem, color: "text-emerald-400", barColor: "bg-emerald-400" },
  ];

  return (
    <div className="space-y-3">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Icon size={12} className={stat.color} />
                <span className="text-xs text-slate-400">{stat.name}</span>
              </div>
              <span className="text-xs font-bold text-white">{stat.value}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${stat.barColor} rounded-full transition-all duration-500`} style={{ width: `${Math.min(stat.value, 100)}%` }} />
            </div>
          </div>
        );
      })}
      <div className="pt-2 border-t border-slate-700/50 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Happiness</span>
          <span className={pet.happiness > 50 ? "text-emerald-400" : "text-red-400"}>{pet.happiness}%</span>
        </div>
        <Progress value={pet.happiness} className="h-1.5" />
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Hunger</span>
          <span className={pet.hunger > 50 ? "text-orange-400" : "text-emerald-400"}>{pet.hunger}% full</span>
        </div>
        <Progress value={pet.hunger} className="h-1.5" />
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">XP to Next Level</span>
          <span className="text-cyan-400">{pet.xp}/{pet.xpToNext}</span>
        </div>
        <Progress value={(pet.xp / pet.xpToNext) * 100} className="h-1.5" />
      </div>
    </div>
  );
}

export default function PetSystemPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("pet");
  const [adoptName, setAdoptName] = useState("");
  const [adoptSpecies, setAdoptSpecies] = useState<string>("phoenix");

  const { data: pet, isLoading } = trpc.pet.get.useQuery(undefined, { enabled: !!user });
  const adoptMutation = trpc.pet.adopt.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.name} the ${data.speciesId} has been born!`, { description: "Your new companion awaits!" });
      utils.pet.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const feedMutation = trpc.pet.feed.useMutation({
    onSuccess: (data) => {
      if (data.evolved) {
        toast.success(`EVOLUTION! ${data.pet.name} evolved to ${data.newStage}!`, { description: "Your pet has reached a new stage!" });
      } else if (data.levelUps > 0) {
        toast.success(`${data.pet.name} leveled up to ${data.pet.level}!`);
      } else {
        toast.success(`${data.pet.name} enjoyed the meal!`);
      }
      utils.pet.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const interactMutation = trpc.pet.interact.useMutation({
    onSuccess: (data) => {
      toast.success(`You pet ${data.name}!`, { description: `Happiness: ${data.happiness}%` });
      utils.pet.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-slate-500">Loading your companion...</div>
        </div>
      </AppShell>
    );
  }

  if (!pet) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-black text-white">Choose Your Companion</h1>
            <p className="text-sm text-slate-400 mt-2">Your financial pet grows as your wealth grows. Choose wisely.</p>
          </div>
          <div className="space-y-3">
            {PET_SPECIES.map(species => (
              <Card
                key={species.id}
                className={`cursor-pointer transition-all ${
                  adoptSpecies === species.id
                    ? "bg-yellow-500/10 border-yellow-500/30 ring-2 ring-yellow-400/30"
                    : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80"
                }`}
                onClick={() => setAdoptSpecies(species.id)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <span className="text-4xl">{species.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{species.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{species.description}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[10px] text-red-400">STR {species.baseStats.strength}</span>
                      <span className="text-[10px] text-blue-400">WIS {species.baseStats.wisdom}</span>
                      <span className="text-[10px] text-yellow-400">CHA {species.baseStats.charisma}</span>
                      <span className="text-[10px] text-emerald-400">LCK {species.baseStats.luck}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Name your companion..."
              value={adoptName}
              onChange={(e) => setAdoptName(e.target.value)}
              className="bg-slate-800/50 border-slate-700/50 text-white"
            />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              disabled={!adoptName.trim() || adoptMutation.isPending}
              onClick={() => adoptMutation.mutate({ speciesId: adoptSpecies as any, name: adoptName.trim() })}
            >
              {adoptMutation.isPending ? "Hatching..." : "Adopt!"}
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Heart className="text-pink-400" /> Pet Companion
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Your financial pet grows as your wealth grows. Feed it deals. Watch it evolve. Never abandon it.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="pet" className="text-xs">My Pet</TabsTrigger>
            <TabsTrigger value="feed" className="text-xs">Feed</TabsTrigger>
            <TabsTrigger value="species" className="text-xs">Species</TabsTrigger>
            <TabsTrigger value="evolution" className="text-xs">Evolution</TabsTrigger>
          </TabsList>

          {/* ─── My Pet Tab ─── */}
          <TabsContent value="pet" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <PetDisplay pet={pet} />
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Shield size={14} className="text-cyan-400" /> Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatsPanel pet={pet} />
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions — wired to real backend */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                className="bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 h-auto py-3"
                disabled={interactMutation.isPending}
                onClick={() => interactMutation.mutate()}
              >
                <div className="flex flex-col items-center gap-1">
                  <Heart size={18} />
                  <span className="text-xs">Pet</span>
                </div>
              </Button>
              <Button
                className="bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 h-auto py-3"
                disabled={feedMutation.isPending}
                onClick={() => feedMutation.mutate({ foodId: "deal_crumbs" })}
              >
                <div className="flex flex-col items-center gap-1">
                  <Target size={18} />
                  <span className="text-xs">Quick Feed</span>
                </div>
              </Button>
              <Button
                className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 h-auto py-3"
                disabled={feedMutation.isPending}
                onClick={() => feedMutation.mutate({ foodId: "basic_treat" })}
              >
                <div className="flex flex-col items-center gap-1">
                  <Sparkles size={18} />
                  <span className="text-xs">Treat</span>
                </div>
              </Button>
            </div>
          </TabsContent>

          {/* ─── Feed Tab ─── */}
          <TabsContent value="feed" className="space-y-3">
            <p className="text-xs text-slate-500">Feed your pet to gain XP and happiness. Better food = faster growth. Costs RussellCoin.</p>
            {FOOD_ITEMS.map(food => (
              <Card
                key={food.id}
                className={`${RARITY_COLORS[food.rarity]} border cursor-pointer hover:brightness-110 transition-all`}
                onClick={() => feedMutation.mutate({ foodId: food.id })}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-3xl">{food.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{food.name}</p>
                      <Badge className="text-[10px] bg-black/20 border-white/10 text-white/60">{food.rarity}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{food.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-emerald-400">+{food.xpGain} XP</p>
                    <p className="text-xs text-pink-400">+{food.happinessGain} 😊</p>
                    {food.cost > 0 && <p className="text-[10px] text-yellow-400">{food.cost} RC</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ─── Species Tab ─── */}
          <TabsContent value="species" className="space-y-3">
            <p className="text-xs text-slate-500">Your current companion species. Each species has unique strengths.</p>
            {PET_SPECIES.map(species => (
              <Card key={species.id} className={`bg-slate-800/50 border-slate-700/50 ${pet.speciesId === species.id ? "ring-2 ring-yellow-400/50 border-yellow-500/30" : ""}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <span className="text-4xl">{species.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{species.name}</p>
                      {pet.speciesId === species.id && <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Active</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{species.description}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[10px] text-red-400">STR {species.baseStats.strength}</span>
                      <span className="text-[10px] text-blue-400">WIS {species.baseStats.wisdom}</span>
                      <span className="text-[10px] text-yellow-400">CHA {species.baseStats.charisma}</span>
                      <span className="text-[10px] text-emerald-400">LCK {species.baseStats.luck}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ─── Evolution Tab ─── */}
          <TabsContent value="evolution" className="space-y-3">
            <p className="text-xs text-slate-500">Your pet evolves as it levels up. Each stage unlocks new abilities.</p>
            {EVOLUTION_STAGES.map((stage) => {
              const isReached = pet.level >= stage.level;
              const currentEvo = getEvolutionStageForLevel(pet.level);
              const isCurrent = currentEvo.level === stage.level;
              return (
                <Card key={stage.level} className={`border transition-all ${
                  isCurrent ? "bg-yellow-500/10 border-yellow-500/30 ring-2 ring-yellow-400/30" :
                  isReached ? "bg-emerald-500/5 border-emerald-500/20" :
                  "bg-slate-800/30 border-slate-700/30 opacity-60"
                }`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-3xl">{stage.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${isCurrent ? "text-yellow-400" : isReached ? "text-emerald-400" : "text-slate-500"}`}>{stage.name}</p>
                        <Badge className="text-[10px] bg-black/20 border-white/10 text-white/60">Level {stage.level}+</Badge>
                        {isCurrent && <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Current</Badge>}
                        {isReached && !isCurrent && <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Reached</Badge>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{stage.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-cyan-400">{stage.bonusMultiplier}x</p>
                      <p className="text-[10px] text-slate-500">Bonus</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
