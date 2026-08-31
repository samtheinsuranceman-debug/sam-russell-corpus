// @ts-nocheck
import { useState, useEffect, useMemo, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TreePine, Star, Gem, Crown, Moon, Map, Zap, TrendingUp, Shield } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════
   MY WORLD — Your personal financial universe.
   Wealth Garden. Client Constellation. Avatar. Dream Mode.
   A place you live inside that happens to make you rich.
   ═══════════════════════════════════════════════════════════════════ */

function WealthGarden() {
  const plants = [{ name: "Roth Oak", emoji: "🌳", health: 95, age: "3 years", value: "$420K", type: "Tax-Free Growth", stage: 4 },
,
    { name: "IUL Redwood", emoji: "🌲", health: 88, age: "2 years", value: "$280K", type: "Protected Growth", stage: 3 },
,
    { name: "MYGA Bamboo", emoji: "🎋", health: 100, age: "1 year", value: "$150K", type: "Guaranteed Growth", stage: 2 },
,
    { name: "Annuity Bonsai", emoji: "🌿", health: 72, age: "6 months", value: "$85K", type: "Income Stream", stage: 2 },
,
    { name: "Estate Sequoia", emoji: "🏔️", health: 60, age: "5 years", value: "$1.2M", type: "Legacy Asset", stage: 5 }
];

  const totalValue = plants.reduce((sum, p) => sum + parseInt(p.value.replace(/[$K,M]/g, "")) * (p.value.includes("M") ? 1000 : 1), 0);

  const getHealthColor = (h: number) => h >= 80 ? "text-emerald-400" : h >= 60 ? "text-amber-400" : "text-red-400";
  const getHealthBg = (h: number) => h >= 80 ? "bg-emerald-500" : h >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-4">
      {/* Garden Overview */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-900/20 via-[#0f1e35] to-emerald-900/10 border border-emerald-500/20 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TreePine size={16} className="text-emerald-400" /> Your Wealth Garden
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Every strategy is a plant. Water them with attention. Watch them grow.</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-emerald-400">${totalValue.toLocaleString()}K</div>
            <div className="text-[10px] text-slate-400">Total Garden Value</div>
          </div>
        </div>

        {/* Garden Grid */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {plants.map((plant, i) => (
            <button
              key={i}
              onClick={() => toast.info(`${plant.name}: ${plant.value} — ${plant.type}`, { icon: plant.emoji })}
              className="rounded-xl bg-[#0a1628]/80 border border-[#1a3055] p-3 text-center hover:border-emerald-500/30 transition-all group"
            >
              <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">{plant.emoji}</div>
              <div className="text-[10px] font-bold text-white truncate">{plant.name}</div>
              <div className="text-[9px] text-emerald-400 font-semibold">{plant.value}</div>
              <div className="mt-1 h-1 rounded-full bg-[#1a3055] overflow-hidden">
                <div className={`h-full rounded-full ${getHealthBg(plant.health)}`} style={{ width: `${plant.health}%` }} />
              </div>
              <div className={`text-[8px] mt-0.5 ${getHealthColor(plant.health)}`}>{plant.health}% health</div>
            </button>
          ))}
        </div>
      </div>

      {/* Garden Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Water All Plants", emoji: "💧", desc: "Review all strategies", color: "border-blue-500/30 bg-blue-500/5" },
          { label: "Plant New Seed", emoji: "🌱", desc: "Start a new strategy", color: "border-emerald-500/30 bg-emerald-500/5" },
          { label: "Harvest Rewards", emoji: "🌾", desc: "Collect earned gains", color: "border-amber-500/30 bg-amber-500/5" },
          { label: "Garden Report", emoji: "📊", desc: "Full growth analysis", color: "border-violet-500/30 bg-violet-500/5" },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => toast.success(`${action.label} — Coming soon!`, { icon: action.emoji })}
            className={`rounded-lg border ${action.color} p-3 text-center hover:scale-[1.02] transition-all`}
          >
            <div className="text-xl mb-1">{action.emoji}</div>
            <div className="text-[10px] font-bold text-white">{action.label}</div>
            <div className="text-[9px] text-slate-400">{action.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientConstellation() {
  const clients = [
    { name: "Michael Torres", value: "$1.2M", status: "active", x: 25, y: 20, size: 40, connections: [1, 3] },
    { name: "Sarah Chen", value: "$890K", status: "active", x: 60, y: 15, size: 35, connections: [0, 2] },
    { name: "James Wilson", value: "$2.1M", status: "hot", x: 45, y: 45, size: 50, connections: [1, 4] },
    { name: "Lauren Hall", value: "$650K", status: "warm", x: 15, y: 55, size: 30, connections: [0] },
    { name: "Robert Kim", value: "$3.4M", status: "active", x: 75, y: 50, size: 55, connections: [2, 5] },
    { name: "Emily Davis", value: "$420K", status: "cold", x: 85, y: 25, size: 25, connections: [4] },
    { name: "David Park", value: "$1.8M", status: "hot", x: 35, y: 75, size: 45, connections: [2, 3] },
    { name: "Jessica Lee", value: "$560K", status: "warm", x: 70, y: 80, size: 28, connections: [4, 6] },
  ];

  const statusColors: Record<string, string> = {
    hot: "bg-red-500 shadow-red-500/50",
    active: "bg-emerald-500 shadow-emerald-500/50",
    warm: "bg-amber-500 shadow-amber-500/50",
    cold: "bg-blue-500 shadow-blue-500/50",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Star size={16} className="text-violet-400" /> Client Constellation
          </h3>
          <p className="text-[10px] text-slate-400">Your universe of relationships. Brighter stars = bigger portfolios.</p>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${color.split(" ")[0]}`} />
              <span className="text-[9px] text-slate-400 capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Constellation Map */}
      <div className="relative rounded-xl bg-[#050d1a] border border-[#1a3055] overflow-hidden" style={{ height: 400 }}>
        {/* Stars background */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.15), transparent), radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.25), transparent), radial-gradient(1px 1px at 90% 70%, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 20% 80%, rgba(255,255,255,0.1), transparent), radial-gradient(1px 1px at 60% 90%, rgba(255,255,255,0.15), transparent), radial-gradient(1px 1px at 80% 15%, rgba(255,255,255,0.2), transparent)",
        }} />

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {clients.map((client, i) =>
            client.connections.map(j => (
              <line
                key={`${i}-${j}`}
                x1={`${client.x}%`} y1={`${client.y}%`}
                x2={`${clients[j].x}%`} y2={`${clients[j].y}%`}
                stroke="rgba(139,92,246,0.15)" strokeWidth="1" strokeDasharray="4,4"
              />
            ))
          )}
        </svg>

        {/* Client nodes */}
        {clients.map((client, i) => (
          <button
            key={i}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${client.x}%`, top: `${client.y}%`, zIndex: 2 }}
            onClick={() => toast.info(`${client.name}: ${client.value}`, { description: `Status: ${client.status}` })}
          >
            <div className={`rounded-full ${statusColors[client.status]} shadow-lg transition-all group-hover:scale-125`}
              style={{ width: client.size * 0.6, height: client.size * 0.6 }}
            />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-[9px] font-bold text-white bg-[#0a1628]/90 border border-[#1a3055] rounded px-1.5 py-0.5">
                {client.name} · {client.value}
              </div>
            </div>
          </button>
        ))}

        {/* Nebula effects */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 40% 40%, rgba(139,92,246,0.05) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(34,197,94,0.04) 0%, transparent 40%)",
        }} />
      </div>
    </div>
  );
}

function AvatarSystem() {
  const { user } = useAuth();
  const [selectedTitle, setSelectedTitle] = useState("Wealth Architect");

  const titles = [
    { name: "Wealth Architect", emoji: "🏗️", unlocked: true, req: "Reach Level 3" },
    { name: "Roth Alchemist", emoji: "⚗️", unlocked: true, req: "Complete 10 Roth conversions" },
    { name: "The Closer", emoji: "🎯", unlocked: true, req: "Close 25 deals" },
    { name: "Tax Ninja", emoji: "🥷", unlocked: false, req: "Complete Tax Mastery skill tree" },
    { name: "Estate Guardian", emoji: "🏰", unlocked: false, req: "Reach Level 7" },
    { name: "Legendary Advisor", emoji: "⭐", unlocked: false, req: "Reach Level 10" },
    { name: "The Oracle", emoji: "🔮", unlocked: false, req: "Predict 50 market moves correctly" },
    { name: "Diamond Hands", emoji: "💎", unlocked: false, req: "100-day login streak" },
  ];

  const badges = [
    { emoji: "🏆", name: "First Blood" }, { emoji: "💯", name: "Century Club" },
    { emoji: "🔥", name: "Streak Master" }, { emoji: "⚡", name: "Speed Demon" },
    { emoji: "🧮", name: "Calculator King" }, { emoji: "💎", name: "Million Dollar" },
  ];

  const stats = [
    { label: "Total XP", value: "47,500", icon: <Star size={14} className="text-amber-400" /> },
    { label: "Level", value: "5", icon: <Crown size={14} className="text-violet-400" /> },
    { label: "Streak", value: "18 days", icon: <Zap size={14} className="text-orange-400" /> },
    { label: "Quests Done", value: "142", icon: <Shield size={14} className="text-blue-400" /> },
    { label: "Badges", value: "23", icon: <Gem size={14} className="text-emerald-400" /> },
    { label: "Rank", value: "#12", icon: <TrendingUp size={14} className="text-rose-400" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Avatar Card */}
      <div className="rounded-xl bg-gradient-to-br from-violet-900/20 via-[#0f1e35] to-blue-900/20 border border-violet-500/20 p-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/30 border-2 border-violet-500/50 flex items-center justify-center text-4xl shadow-lg shadow-violet-500/20">
              👤
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-[#0f1e35] flex items-center justify-center text-xs font-black text-white">
              5
            </div>
          </div>
          {/* Info */}
          <div className="flex-1">
            <div className="text-lg font-black text-white">{user?.name || "Commander"}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400">
                {selectedTitle}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                Level 5 — Optimizer
              </Badge>
            </div>
            {/* Badge row */}
            <div className="flex items-center gap-1 mt-2">
              {badges.map((b, i) => (
                <div key={i} className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xs" title={b.name}>
                  {b.emoji}
                </div>
              ))}
              <div className="w-6 h-6 rounded bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-slate-500">
                +17
              </div>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-0.5">{s.icon}</div>
                <div className="text-sm font-bold text-white">{s.value}</div>
                <div className="text-[9px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Titles */}
      <Card className="bg-[#0b1628] border-[#1a3055]">
        <CardContent className="p-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Unlockable Titles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {titles.map((t, i) => (
              <button
                key={i}
                onClick={() => {
                  if (t.unlocked) {
                    setSelectedTitle(t.name);
                    toast.success(`Title equipped: ${t.name}`, { icon: t.emoji });
                  } else {
                    toast.info(`Locked: ${t.req}`, { icon: "🔒" });
                  }
                }}
                className={`rounded-lg border p-2.5 text-center transition-all ${
                  t.unlocked
                    ? selectedTitle === t.name
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-[#1a3055] bg-[#0a1628] hover:border-violet-500/30"
                    : "border-[#1a3055] bg-[#0a1628] opacity-50"
                }`}
              >
                <div className="text-xl mb-0.5">{t.unlocked ? t.emoji : "🔒"}</div>
                <div className="text-[10px] font-bold text-white">{t.name}</div>
                <div className="text-[8px] text-slate-500">{t.req}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DreamMode() {
  const [dreaming, setDreaming] = useState(false);
  const scenarios = [
    { title: "What if I retired at 55?", emoji: "🏖️", desc: "Simulate early retirement with your current portfolio", color: "from-amber-500/10 to-amber-600/5 border-amber-500/30" },
    { title: "What if markets crash 40%?", emoji: "📉", desc: "Stress test your wealth garden against a major downturn", color: "from-red-500/10 to-red-600/5 border-red-500/30" },
    { title: "What if I double my savings?", emoji: "🚀", desc: "See the compound effect of aggressive saving", color: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/30" },
    { title: "What if inflation hits 8%?", emoji: "🔥", desc: "Test your strategies against persistent inflation", color: "from-orange-500/10 to-orange-600/5 border-orange-500/30" },
    { title: "What if I start a business?", emoji: "💼", desc: "Model the financial impact of entrepreneurship", color: "from-blue-500/10 to-blue-600/5 border-blue-500/30" },
    { title: "What if I live to 100?", emoji: "🎂", desc: "Longevity risk analysis for your income streams", color: "from-violet-500/10 to-violet-600/5 border-violet-500/30" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-br from-indigo-900/30 via-[#0f1e35] to-violet-900/20 border border-indigo-500/20 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Moon size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Dream Mode</h3>
            <p className="text-[10px] text-slate-400">Close your eyes. Open your mind. What does your financial future look like?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setDreaming(true);
                toast.success(`Entering dream: ${s.title}`, { icon: s.emoji });
                setTimeout(() => setDreaming(false), 3000);
              }}
              className={`rounded-xl bg-gradient-to-br ${s.color} border p-4 text-left hover:scale-[1.02] transition-all`}
            >
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="text-xs font-bold text-white mb-0.5">{s.title}</div>
              <div className="text-[10px] text-slate-400">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {dreaming && (
        <div className="fixed inset-0 z-50 bg-[#050d1a]/95 flex items-center justify-center animate-in fade-in duration-1000">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">🌙</div>
            <div className="text-xl font-bold text-indigo-300">Entering Dream Sequence...</div>
            <div className="text-sm text-slate-400">Calculating alternate realities</div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyWorld() {
  const [tab, setTab] = useState("garden");
  const { data: profile } = trpc.experience.getProfile.useQuery(undefined, { retry: 1 });
  const { data: clientsData } = trpc.clients.list.useQuery(undefined, { retry: 1 });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-violet-400" size={24} /> My World
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Your personal financial universe. A place you live inside that happens to make you rich.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#0a1628] border border-[#1a3055]">
            <TabsTrigger value="garden" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <TreePine size={14} className="mr-1" /> Wealth Garden
            </TabsTrigger>
            <TabsTrigger value="constellation" className="text-xs data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <Star size={14} className="mr-1" /> Constellation
            </TabsTrigger>
            <TabsTrigger value="avatar" className="text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Crown size={14} className="mr-1" /> My Avatar
            </TabsTrigger>
            <TabsTrigger value="dream" className="text-xs data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400">
              <Moon size={14} className="mr-1" /> Dream Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="garden" className="mt-4"><WealthGarden /></TabsContent>
          <TabsContent value="constellation" className="mt-4"><ClientConstellation /></TabsContent>
          <TabsContent value="avatar" className="mt-4"><AvatarSystem /></TabsContent>
          <TabsContent value="dream" className="mt-4"><DreamMode /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
