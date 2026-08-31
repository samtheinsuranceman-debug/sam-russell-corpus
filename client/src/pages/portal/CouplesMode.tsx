// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Heart,
  Users,
  Trophy,
  Crown,
  Star,
  Copy,
  UserPlus,
  Flame,
  Target,
  Zap,
  Shield,
  Gift,
  Medal,
  TrendingUp,
  LogOut,
  Sparkles,
} from "lucide-react";


export default function CouplesMode() {
  const { user } = useAuth();
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "leaderboard" | "challenges" | "milestones">("overview");

  const familyQuery = trpc.experience.getMyFamily.useQuery();
  const xpProfile = trpc.experience.getProfile.useQuery();

  const createFamilyMutation = trpc.experience.createFamily.useMutation({
    onSuccess: () => { familyQuery.refetch(); toast.success("Family created! Share the invite code."); },
    onError: (err) => toast.error(err.message),
  });
  const joinFamilyMutation = trpc.experience.joinFamily.useMutation({
    onSuccess: () => { familyQuery.refetch(); toast.success("Joined the family!"); },
    onError: (err) => toast.error(err.message),
  });
  const leaveFamilyMutation = trpc.experience.leaveFamily.useMutation({
    onSuccess: () => { familyQuery.refetch(); toast.success("Left the family group."); },
    onError: (err) => toast.error(err.message),
  });

  const family = familyQuery.data;
  const hasFamily = family && "id" in family;

  const renderNoFamily = () => (
    <div className="space-y-8 max-w-2xl mx-auto py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 border-2 border-pink-500/30 mb-6 relative">
          <Heart className="w-12 h-12 text-pink-400" />
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center animate-pulse">
            <Star className="w-4 h-4 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Couples Mode</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Team up with your spouse, partner, or family members. Compete together, 
          earn together, and climb the Family Leaderboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Family */}
        <Card className="border-pink-500/20 hover:border-pink-500/40 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5 text-pink-400" /> Create a Family
            </CardTitle>
            <CardDescription>Start a new family group and invite your partner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Family name (e.g., 'The Russells')"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="bg-background/50"
            />
            <Button
              onClick={() => createFamilyMutation.mutate({ name: familyName })}
              disabled={!familyName.trim() || createFamilyMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600"
            >
              <Heart className="w-4 h-4 mr-2" /> Create Family
            </Button>
          </CardContent>
        </Card>

        {/* Join Family */}
        <Card className="border-amber-500/20 hover:border-amber-500/40 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-amber-400" /> Join a Family
            </CardTitle>
            <CardDescription>Enter the invite code from your partner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="bg-background/50 font-mono"
            />
            <Button
              onClick={() => joinFamilyMutation.mutate({ inviteCode })}
              disabled={!inviteCode.trim() || joinFamilyMutation.isPending}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Join Family
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      <Card className="border-border/20 bg-gradient-to-r from-pink-500/5 to-amber-500/5">
        <CardContent className="p-6">
          <h3 className="font-semibold text-white mb-4 text-center">Why Couples Mode?</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Trophy, title: "Family Leaderboard", desc: "Compete as a team against other families", color: "text-amber-400" },
              { icon: Zap, title: "Combo XP Bonuses", desc: "Earn 2x XP when both partners are active", color: "text-cyan-400" },
              { icon: Gift, title: "Shared Rewards", desc: "Unlock exclusive couples-only achievements", color: "text-pink-400" },
            ].map((b, i) => (
              <div key={i} className="text-center">
                <b.icon className={`w-8 h-8 ${b.color} mx-auto mb-2`} />
                <p className="font-medium text-white text-sm">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFamilyDashboard = () => {
    if (!hasFamily) return null;
    const fam = family as any;
    const members = fam.members || [];
    const totalXp = members.reduce((sum: number, m: any) => sum + (m.totalXp || 0), 0);
    const totalCoins = members.reduce((sum: number, m: any) => sum + (m.coins || 0), 0);

    return (
      <div className="space-y-6">
        {/* Family Header */}
        <Card className="border-pink-500/20 bg-gradient-to-r from-pink-500/5 via-background to-amber-500/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{fam.name}</h2>
                  <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""} · Created {new Date(fam.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">{totalXp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Family XP</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{totalCoins.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Family RC</p>
                </div>
              </div>
            </div>

            {/* Invite Code */}
            <div className="mt-4 flex items-center gap-2 bg-background/50 rounded-lg p-3">
              <span className="text-xs text-muted-foreground">Invite Code:</span>
              <code className="font-mono text-amber-400 text-sm font-bold">{fam.inviteCode}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(fam.inviteCode);
                  toast.success("Invite code copied!");
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "overview" as const, label: "Overview", icon: Users },
            { id: "leaderboard" as const, label: "Leaderboard", icon: Trophy },
            { id: "challenges" as const, label: "Challenges", icon: Target },
            { id: "milestones" as const, label: "Milestones", icon: Medal },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "bg-pink-600 hover:bg-pink-700" : ""}
            >
              <tab.icon className="w-4 h-4 mr-1" /> {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && renderOverview(members)}
        {activeTab === "leaderboard" && renderLeaderboard(members)}
        {activeTab === "challenges" && renderChallenges()}
        {activeTab === "milestones" && renderMilestones(totalXp)}
      </div>
    );
  };

  const renderOverview = (members: any[]) => (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Members */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-400" /> Family Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${i === 0 ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-pink-500 to-rose-600"} flex items-center justify-center`}>
                  {i === 0 ? <Crown className="w-5 h-5 text-white" /> : <Heart className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{m.userName || "Member"}</p>
                  <p className="text-xs text-muted-foreground">Level {m.level || 1} · {(m.totalXp || 0).toLocaleString()} XP</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{m.role || "member"}</Badge>
            </div>
          ))}

          {members.length < 2 && (
            <p className="text-sm text-muted-foreground text-center italic py-2">
              Share your invite code to add family members!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Today's Activity */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" /> Today's Family Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { action: "Logged in", who: user?.name || "You", time: "Just now", xp: 50 },
            { action: "Completed a quest", who: "Partner", time: "2h ago", xp: 200 },
            { action: "Ran a calculator", who: user?.name || "You", time: "3h ago", xp: 100 },
            { action: "Earned achievement", who: "Partner", time: "5h ago", xp: 500 },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-background/30">
              <div>
                <p className="text-sm text-white">{a.who} {a.action}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">+{a.xp} XP</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Leave Family */}
      <Card className="border-red-500/10 md:col-span-2">
        <CardContent className="p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Want to leave this family group?</p>
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            onClick={() => leaveFamilyMutation.mutate()}
          >
            <LogOut className="w-3 h-3 mr-1" /> Leave Family
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderLeaderboard = (members: any[]) => {
    const families = [
      { rank: 1, name: "The Johnsons", xp: 125000, members: 3, streak: 45 },
      { rank: 2, name: "Team Williams", xp: 98000, members: 2, streak: 32 },
      { rank: 3, name: "House Martinez", xp: 87500, members: 4, streak: 28 },
      { rank: 4, name: (family as any)?.name || "Your Family", xp: members.reduce((s: number, m: any) => s + (m.totalXp || 0), 0), members: members.length, streak: 18, isYou: true },
      { rank: 5, name: "The Andersons", xp: 65000, members: 2, streak: 22 },
      { rank: 6, name: "Dynasty Chen", xp: 54000, members: 3, streak: 15 },
      { rank: 7, name: "Team Garcia", xp: 48000, members: 2, streak: 12 },
      { rank: 8, name: "The Patels", xp: 42000, members: 4, streak: 19 },
    ];

    return (
      <Card className="border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Family Leaderboard
          </CardTitle>
          <CardDescription>Top families competing on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {families.map((f) => (
            <div
              key={f.rank}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                (f as any).isYou ? "bg-pink-500/10 border border-pink-500/30" : "bg-background/30 hover:bg-background/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  f.rank === 1 ? "bg-amber-500 text-white" :
                  f.rank === 2 ? "bg-gray-400 text-white" :
                  f.rank === 3 ? "bg-orange-700 text-white" :
                  "bg-background text-muted-foreground border border-border/30"
                }`}>
                  {f.rank}
                </div>
                <div>
                  <p className="font-medium text-white text-sm">
                    {f.name} {(f as any).isYou && <Badge className="ml-1 bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs">You</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">{f.members} members · {f.streak}-day streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-400 text-sm">{f.xp.toLocaleString()} XP</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderChallenges = () => {
    const challenges = [
      { title: "Morning Duo", desc: "Both partners log in before 9am", reward: "500 XP + 200 RC", progress: 3, target: 5, icon: Flame, color: "text-orange-400" },
      { title: "Calculator Relay", desc: "Run 10 calculators between you today", reward: "1,000 XP", progress: 6, target: 10, icon: Zap, color: "text-cyan-400" },
      { title: "Streak Sync", desc: "Maintain matching 7-day streaks", reward: "2,000 XP + Rare Badge", progress: 5, target: 7, icon: Shield, color: "text-purple-400" },
      { title: "Wealth Discovery Race", desc: "First couple to discover $1M this week", reward: "5,000 XP + Legendary Loot", progress: 680000, target: 1000000, icon: TrendingUp, color: "text-green-400" },
      { title: "Love Letter", desc: "Both generate a Will Writer document", reward: "3,000 XP + Exclusive Title", progress: 1, target: 2, icon: Heart, color: "text-pink-400" },
    ];

    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-white">Couples Challenges</h3>
          <p className="text-sm text-muted-foreground">Complete together for bonus rewards</p>
        </div>
        {challenges.map((c, i) => {
          const Icon = c.icon;
          const pct = Math.min(100, (c.progress / c.target) * 100);
          return (
            <Card key={i} className="border-border/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white text-sm">{c.title}</h4>
                      <Badge variant="outline" className="text-xs">{c.reward}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{c.desc}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-background/50 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-amber-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {c.target >= 100000 ? `$${(c.progress / 1000).toFixed(0)}K / $${(c.target / 1000).toFixed(0)}K` : `${c.progress}/${c.target}`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMilestones = (totalXp: number) => {
    const milestones = [
      { xp: 1000, title: "First Steps Together", reward: "Couples Badge", unlocked: totalXp >= 1000 },
      { xp: 5000, title: "Power Couple", reward: "Custom Title Color", unlocked: totalXp >= 5000 },
      { xp: 10000, title: "Dynamic Duo", reward: "Exclusive Avatar Frame", unlocked: totalXp >= 10000 },
      { xp: 25000, title: "Wealth Builders", reward: "2x XP Weekend Pass", unlocked: totalXp >= 25000 },
      { xp: 50000, title: "Financial Royalty", reward: "Crown Avatar Accessory", unlocked: totalXp >= 50000 },
      { xp: 100000, title: "Legendary Partners", reward: "Custom Family Crest", unlocked: totalXp >= 100000 },
      { xp: 250000, title: "Dynasty Founders", reward: "Hall of Fame Entry", unlocked: totalXp >= 250000 },
      { xp: 500000, title: "Immortal Legacy", reward: "Permanent Platform Recognition", unlocked: totalXp >= 500000 },
    ];

    return (
      <div className="space-y-3">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-white">Family Milestones</h3>
          <p className="text-sm text-muted-foreground">Combined family XP: <span className="text-amber-400 font-bold">{totalXp.toLocaleString()}</span></p>
        </div>
        {milestones.map((m, i) => (
          <Card key={i} className={`border-border/30 ${m.unlocked ? "bg-green-500/5 border-green-500/20" : ""}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.unlocked ? "bg-green-500/20" : "bg-background/50"}`}>
                  {m.unlocked ? <Sparkles className="w-5 h-5 text-green-400" /> : <Star className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className={`font-medium text-sm ${m.unlocked ? "text-green-400" : "text-white"}`}>{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.xp.toLocaleString()} XP · Reward: {m.reward}</p>
                </div>
              </div>
              {m.unlocked ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Unlocked</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">{((m.xp - totalXp) > 0 ? (m.xp - totalXp).toLocaleString() : 0)} XP to go</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/30 bg-gradient-to-r from-pink-500/5 via-background to-amber-500/5">
          <div className="container py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Couples Mode</h1>
                <p className="text-sm text-muted-foreground">Family Leaderboard & Team Challenges</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-8">
          {familyQuery.isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading family data...</div>
          ) : hasFamily ? (
            renderFamilyDashboard()
          ) : (
            renderNoFamily()
          )}
        </div>
      </div>
    </AppShell>
  );
}
