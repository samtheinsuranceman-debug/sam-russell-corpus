// @ts-nocheck

import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Eye,
  Image,
  Trophy,
  TrendingUp,
  Users,
  MessageCircle,
  Share2,
  Heart,
  Flame,
  DollarSign,
  Copy,
  Download,
  Send,
  Megaphone,
  Sparkles,
  ChevronRight,
  Globe,
  Activity,
  Lightbulb,
  Brain,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════
   THE SOCIAL NARCOTIC — Every user becomes a broadcasting tower.
   More shareable than a group chat. More viral than a meme.
   ═══════════════════════════════════════════════════════════════════ */

function SpectatorMode() {
  const [watching, setWatching] = useState<number | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (watching !== null) {
      setViewerCount(Math.floor(Math.random() * 50) + 12);
      const interval = setInterval(() => {
        setViewerCount(prev => prev + Math.floor(Math.random() * 3) - 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [watching]);

  const liveAdvisors = [
    { name: "Platinum_Eagle", rank: 1, level: 87, specialty: "MYGA Grandmaster", viewers: 47, activity: "Running a $2.1M retirement optimization", streak: 142, avatar: "🦅" },
    { name: "TaxNinja_Pro", rank: 3, level: 72, specialty: "Roth Alchemist", viewers: 31, activity: "Roth conversion ladder for 5 clients simultaneously", streak: 89, avatar: "🥷" },
    { name: "WealthArchitect", rank: 7, level: 65, specialty: "Estate Guardian", viewers: 23, activity: "Building a $4.5M estate plan with trust structures", streak: 67, avatar: "🏗️" },
    { name: "IncomeKing", rank: 12, level: 58, specialty: "FIA Expert", viewers: 18, activity: "Comparing 6 FIA products for optimal income rider", streak: 45, avatar: "👑" },
    { name: "TheCloser_99", rank: 5, level: 69, specialty: "Sales Warrior", viewers: 28, activity: "Live client presentation — closing a $800K case", streak: 112, avatar: "🎯" },
  ];

  const [chatMessages, setChatMessages] = useState([
    { user: "NewAdvisor22", text: "How did you know to check the IRMAA threshold first?", time: "2m ago" },
    { user: "MYGAFan", text: "That carrier comparison was genius 🔥", time: "1m ago" },
    { user: "Level42Pro", text: "I've been doing it wrong this whole time...", time: "30s ago" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-red-300 flex items-center gap-2">
          <Eye className="w-5 h-5" /> Spectator Mode
          <Badge className="bg-red-500/20 text-red-300 text-[10px] animate-pulse">● LIVE</Badge>
        </h3>
        <p className="text-sm text-muted-foreground">Watch top advisors work in real time. Like Twitch, but for making money.</p>
      </div>

      {watching === null ? (
        <div className="space-y-3">
          {liveAdvisors.map((advisor, i) => (
            <Card key={i} className="border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
              onClick={() => { setWatching(i); toast.success(`Now watching ${advisor.name}...`); }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{advisor.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{advisor.name}</p>
                        <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">Rank #{advisor.rank}</Badge>
                        <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-300">Lv.{advisor.level}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{advisor.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-red-400">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs font-bold">{advisor.viewers}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Flame className="w-3 h-3" />
                      <span className="text-xs">{advisor.streak}d</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 p-2 rounded bg-black/20">
                  <p className="text-xs text-cyan-300 flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-pulse" /> {advisor.activity}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{liveAdvisors[watching].avatar}</span>
              <div>
                <p className="font-bold">{liveAdvisors[watching].name}</p>
                <p className="text-xs text-muted-foreground">{liveAdvisors[watching].activity}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setWatching(null)}
              className="border-red-500/30 text-red-300">
              Leave Stream
            </Button>
          </div>

          {/* Simulated Stream View */}
          <Card className="bg-gradient-to-br from-gray-950 to-black border-red-500/30 aspect-video relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto animate-pulse">
                  <Eye className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-sm text-muted-foreground">Watching {liveAdvisors[watching].name} work...</p>
                <p className="text-xs text-red-400">Client data anonymized for privacy</p>
              </div>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge className="bg-red-600 text-white text-[10px] animate-pulse">● LIVE</Badge>
              <Badge className="bg-black/60 text-white text-[10px]">
                <Eye className="w-3 h-3 mr-1" /> {viewerCount} watching
              </Badge>
            </div>
          </Card>

          {/* Live Chat */}
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="font-bold text-cyan-300">{msg.user}:</span>
                  <span className="text-muted-foreground flex-1">{msg.text}</span>
                  <span className="text-muted-foreground/50 text-[10px]">{msg.time}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input className="flex-1 bg-black/30 border border-border/30 rounded px-2 py-1 text-xs"
                  placeholder="Ask a question..." onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                      setChatMessages(prev => [...prev, { user: "You", text: (e.target as HTMLInputElement).value, time: "now" }]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }} />
                <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700">Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MemeGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const templates = [
    {
      name: "The Money Discovery",
      preview: "🤑",
      topText: "When you find $340K in hidden tax savings",
      bottomText: "And it's only Tuesday",
      shares: 234, likes: 891,
    },
    {
      name: "The MYGA Moment",
      preview: "😤",
      topText: "Client: 'I'll just keep my money in a savings account'",
      bottomText: "Me: *shows them the MYGA calculator*",
      shares: 456, likes: 1203,
    },
    {
      name: "The Streak Flex",
      preview: "🔥",
      topText: "Day 100 of my login streak",
      bottomText: "My wife thinks I'm having an affair with a website",
      shares: 678, likes: 2341,
    },
    {
      name: "The Boss Battle",
      preview: "⚔️",
      topText: "Client has $5M, a complex trust, and 7 objections",
      bottomText: "This isn't a client meeting. This is a Boss Battle.",
      shares: 345, likes: 1567,
    },
    {
      name: "The Ghost Strategy",
      preview: "👻",
      topText: "Me: 'I think we should allocate 40% to MYGA'",
      bottomText: "Ghost Mode: 'Actually, 35% is optimal' ... Ghost was right",
      shares: 189, likes: 743,
    },
    {
      name: "The Toilet Dashboard",
      preview: "🚽",
      topText: "Found $12K in client savings",
      bottomText: "While sitting on the toilet at 6am",
      shares: 567, likes: 2890,
    },
  ];

  const selected = templates[selectedTemplate];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-pink-300 flex items-center gap-2">
          <Image className="w-5 h-5" /> Meme Generator
        </h3>
        <p className="text-sm text-muted-foreground">Auto-generate shareable financial memes from your wins. Go viral.</p>
      </div>

      {/* Meme Preview */}
      <Card className="bg-gradient-to-br from-gray-900 to-black border-pink-500/30">
        <CardContent className="p-6 text-center">
          <p className="text-sm font-black uppercase tracking-wider text-white mb-4">{selected.topText}</p>
          <span className="text-8xl block my-6">{selected.preview}</span>
          <p className="text-sm font-black uppercase tracking-wider text-white mt-4">{selected.bottomText}</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-1 text-pink-400">
          <Heart className="w-4 h-4" />
          <span className="text-sm font-bold">{selected.likes.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1 text-cyan-400">
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-bold">{selected.shares.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button className="flex-1 bg-pink-600 hover:bg-pink-700" onClick={() => toast.success("Meme copied to clipboard!")}>
          <Copy className="w-4 h-4 mr-1" /> Copy
        </Button>
        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => toast.success("Shared to War Room!")}>
          <Send className="w-4 h-4 mr-1" /> Share
        </Button>
        <Button variant="outline" className="border-pink-500/30 text-pink-300" onClick={() => toast.success("Meme downloaded!")}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Template Selector */}
      <div className="grid grid-cols-3 gap-2">
        {templates.map((t, i) => (
          <button key={i} onClick={() => setSelectedTemplate(i)}
            className={`p-3 rounded-lg text-center transition-all ${selectedTemplate === i ? 'bg-pink-500/20 ring-1 ring-pink-500/40' : 'bg-black/20 hover:bg-black/30'}`}>
            <span className="text-2xl block">{t.preview}</span>
            <p className="text-[10px] text-muted-foreground mt-1">{t.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function BragBoard() {
  const brags = [
    { text: "Just eliminated $14,400/year in unnecessary Medicare surcharges!", emoji: "🎉", likes: 234, time: "2h ago", russellNumber: 89 },
    { text: "My guaranteed income just crossed $5,000/month!", emoji: "💰", likes: 456, time: "4h ago", russellNumber: 92 },
    { text: "Russell Number went from 62 to 89 in 6 months!", emoji: "📈", likes: 678, time: "6h ago", russellNumber: 89 },
    { text: "Saved $340K in estate taxes with one strategy change!", emoji: "🏛️", likes: 891, time: "8h ago", russellNumber: 95 },
    { text: "Went from 2% savings rate to 18% in one year!", emoji: "🚀", likes: 345, time: "12h ago", russellNumber: 78 },
    { text: "My advisor found $67K I didn't know I was losing!", emoji: "🔍", likes: 567, time: "1d ago", russellNumber: 84 },
    { text: "Retired 3 years earlier than planned thanks to MYGA ladder!", emoji: "🏖️", likes: 1023, time: "1d ago", russellNumber: 91 },
    { text: "Family Russell Number average: 87. Thanksgiving is going to be fun.", emoji: "🏆", likes: 789, time: "2d ago", russellNumber: 87 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
          <Trophy className="w-5 h-5" /> Client Brag Board
        </h3>
        <p className="text-sm text-muted-foreground">Where clients flex their financial wins. Every brag is a testimonial. Every testimonial is a referral.</p>
      </div>

      <Card className="bg-gradient-to-r from-amber-950/40 to-yellow-950/40 border-amber-500/30">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-amber-400 uppercase tracking-wider">Total Client Brags This Month</p>
          <p className="text-3xl font-black text-amber-300">1,247</p>
          <p className="text-xs text-amber-400/70">Each one is free marketing</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {brags.map((brag, i) => (
          <Card key={i} className="border-amber-500/10 hover:border-amber-500/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{brag.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{brag.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                      Russell #{brag.russellNumber}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{brag.time}</span>
                    <button className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300"
                      onClick={() => toast.success("Liked!")}>
                      <Heart className="w-3 h-3" /> {brag.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                      onClick={() => toast.success("Shared!")}>
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmergencyBroadcast() {
  const [activeAlert, setActiveAlert] = useState(0);

  const alerts = [
    {
      severity: "critical",
      title: "FED RAISES RATES BY 0.50%",
      time: "2 hours ago",
      impact: "23 clients affected",
      value: "$2.3M in combined portfolio adjustment needed",
      actions: ["Review affected MYGA positions", "Recalculate FIA cap rates", "Send client notifications"],
      emoji: "🚨",
    },
    {
      severity: "high",
      title: "NEW TAX LAW: SECURE ACT 2.0 UPDATE",
      time: "6 hours ago",
      impact: "47 clients affected",
      value: "RMD age changes impact $4.1M in retirement assets",
      actions: ["Update retirement projections", "Review beneficiary designations", "Schedule client reviews"],
      emoji: "📋",
    },
    {
      severity: "medium",
      title: "CARRIER ALERT: ATHENE MYGA RATE INCREASE",
      time: "1 day ago",
      impact: "12 clients could benefit",
      value: "New 5-year rate: 5.85% (+0.15%)",
      actions: ["Compare with current allocations", "Generate comparison reports", "Contact eligible clients"],
      emoji: "📊",
    },
    {
      severity: "info",
      title: "MARKET MILESTONE: S&P 500 ALL-TIME HIGH",
      time: "2 days ago",
      impact: "All clients",
      value: "Portfolio rebalancing opportunity",
      actions: ["Review equity exposure", "Consider profit-taking strategies", "Update risk assessments"],
      emoji: "📈",
    },
  ];

  const severityColors: Record<string, string> = {
    critical: "border-red-500/50 bg-red-950/30",
    high: "border-orange-500/50 bg-orange-950/30",
    medium: "border-amber-500/50 bg-amber-950/30",
    info: "border-blue-500/50 bg-blue-950/30",
  };

  const severityBadge: Record<string, string> = {
    critical: "bg-red-500/20 text-red-300",
    high: "bg-orange-500/20 text-orange-300",
    medium: "bg-amber-500/20 text-amber-300",
    info: "bg-blue-500/20 text-blue-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-red-300 flex items-center gap-2">
          <Megaphone className="w-5 h-5" /> Emergency Broadcast
        </h3>
        <p className="text-sm text-muted-foreground">When something big happens, you know first. Before CNBC. Before Bloomberg.</p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <Card key={i} className={`${severityColors[alert.severity]} transition-all ${i === 0 ? 'animate-pulse' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{alert.emoji}</span>
                  <div>
                    <p className="font-black text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
                <Badge className={`${severityBadge[alert.severity]} text-[10px]`}>
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="text-cyan-400 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {alert.impact}
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> {alert.value}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                {alert.actions.map((action, j) => (
                  <Button key={j} size="sm" variant="ghost" className="w-full justify-start text-xs h-7 hover:bg-white/5"
                    onClick={() => toast.success(`Opening: ${action}`)}>
                    <ChevronRight className="w-3 h-3 mr-1 text-muted-foreground" /> {action}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InfluenceScore() {
  const { user } = useAuth();
  const score = 742;
  const rank = 23;

  const dimensions = [
    { label: "Strategy Sharing", score: 89, max: 100, icon: Brain, detail: "47 strategies adopted by others" },
    { label: "Mentoring Impact", score: 76, max: 100, icon: Users, detail: "12 mentees improved 30%+" },
    { label: "War Room Contributions", score: 92, max: 100, icon: MessageCircle, detail: "234 posts, 1,891 reactions received" },
    { label: "Community Building", score: 68, max: 100, icon: Globe, detail: "3 challenges created, 450 participants" },
    { label: "Knowledge Creation", score: 81, max: 100, icon: Lightbulb, detail: "18 guides written, 2,340 views" },
    { label: "Referral Generation", score: 73, max: 100, icon: Share2, detail: "8 advisors joined through your referrals" },
  ];

  const rippleEffects = [
    { text: "Your MYGA ladder strategy was used by 47 advisors, generating $1.2M in combined client savings", value: 1200000 },
    { text: "3 mentees you coached went from Level 10 to Level 40+ in 6 months", value: 0 },
    { text: "Your War Room post about IRMAA elimination was saved 234 times", value: 0 },
    { text: "The challenge you created generated $890K in total wealth discovered across 450 participants", value: 890000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Influence Score
        </h3>
        <p className="text-sm text-muted-foreground">Your ripple effect across the entire platform ecosystem.</p>
      </div>

      {/* Score Display */}
      <Card className="bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border-emerald-500/30">
        <CardContent className="p-6 text-center">
          <p className="text-xs text-emerald-400 uppercase tracking-wider">Your Influence Score</p>
          <p className="text-6xl font-black text-emerald-300">{score}</p>
          <p className="text-sm text-emerald-400/70">Rank #{rank} on the platform</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Badge className="bg-emerald-500/20 text-emerald-300">Top 5%</Badge>
            <Badge className="bg-amber-500/20 text-amber-300">Thought Leader</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions */}
      <div className="space-y-3">
        {dimensions.map((dim, i) => (
          <div key={i} className="p-3 rounded-lg bg-black/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <dim.icon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold">{dim.label}</span>
              </div>
              <span className="text-sm font-bold text-emerald-300">{dim.score}</span>
            </div>
            <Progress value={dim.score} className="h-1.5 mb-1" />
            <p className="text-xs text-muted-foreground">{dim.detail}</p>
          </div>
        ))}
      </div>

      {/* Ripple Effects */}
      <div>
        <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-1">
          <Activity className="w-4 h-4" /> Your Ripple Effects
        </h4>
        <div className="space-y-2">
          {rippleEffects.map((effect, i) => (
            <Card key={i} className="border-emerald-500/10">
              <CardContent className="p-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs">{effect.text}</p>
                  {effect.value > 0 && (
                    <p className="text-xs text-emerald-400 mt-0.5">💰 ${effect.value.toLocaleString()} total impact</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SocialNarcotic() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "SocialNarcotic",
    strategyType: "social-narcotic",
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <CalculationSyncBar />
        <ClientSelectorBar
          clients={calcIntegration.clients}
          clientsLoading={calcIntegration.clientsLoading}
          selectedClientId={calcIntegration.selectedClientId}
          selectedClientName={calcIntegration.selectedClientName}
          onSelectClient={calcIntegration.selectClient}
          scenarios={calcIntegration.scenarios}
          scenariosLoading={calcIntegration.scenariosLoading}
          scenarioName={calcIntegration.scenarioName}
          onSetScenarioName={calcIntegration.setScenarioName}
          onSave={() => calcIntegration.saveScenario({}, {})}
          onLoad={(s) => calcIntegration.loadScenario(s)}
          isSaving={calcIntegration.isSaving}
          lastSavedAt={calcIntegration.lastSavedAt}
          calculatorName="SocialNarcotic"
        />
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="text-3xl">📡</span> The Social Narcotic
          </h1>
          <p className="text-muted-foreground">
            Every user is a broadcasting tower. Every win is content. Every share is a new user.
          </p>
        </div>

        <Tabs defaultValue="spectator" className="w-full">
          <TabsList className="bg-black/30 border border-border/30 w-full justify-start overflow-x-auto">
            <TabsTrigger value="spectator" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 text-xs">
              <Eye className="w-3 h-3 mr-1" /> Spectator
            </TabsTrigger>
            <TabsTrigger value="memes" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 text-xs">
              <Image className="w-3 h-3 mr-1" /> Memes
            </TabsTrigger>
            <TabsTrigger value="brags" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-xs">
              <Trophy className="w-3 h-3 mr-1" /> Brag Board
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 text-xs">
              <Megaphone className="w-3 h-3 mr-1" /> Broadcast
            </TabsTrigger>
            <TabsTrigger value="influence" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" /> Influence
            </TabsTrigger>

            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          <TabsContent value="spectator"><SpectatorMode /></TabsContent>
          <TabsContent value="memes"><MemeGenerator /></TabsContent>
          <TabsContent value="brags"><BragBoard /></TabsContent>
          <TabsContent value="broadcast"><EmergencyBroadcast /></TabsContent>
          <TabsContent value="influence"><InfluenceScore /></TabsContent>

          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="social-narcotic"
              hasResults={true}
              resultData={{ contentShared: 156, influenceScore: 87, memesCreated: 42, bragsPosted: 28, audienceReach: 12500 }}
              metrics={[{ label: "Content Shared", value: 156, format: "number" }, { label: "Influence Score", value: 87, format: "number", highlight: true }, { label: "Memes Created", value: 42, format: "number" }, { label: "Audience Reach", value: 12500, format: "number" }]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
