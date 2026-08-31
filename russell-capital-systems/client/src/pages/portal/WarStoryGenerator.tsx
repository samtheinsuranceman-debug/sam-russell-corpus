// @ts-nocheck
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Sword, Zap, Heart, Crown, Share2, Copy, BookOpen, Sparkles } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   SECRET #51 — THE WAR STORY GENERATOR (AI-POWERED)
   ═══════════════════════════════════════════════════════════════════ */

const STORY_TEMPLATES = [
  { id: "hero", name: "The Hero's Journey", emoji: "⚔️", tone: "Epic" },
  { id: "comeback", name: "The Comeback", emoji: "🔥", tone: "Inspirational" },
  { id: "underdog", name: "The Underdog Win", emoji: "🏆", tone: "Motivational" },
  { id: "detective", name: "The Detective", emoji: "🔍", tone: "Suspenseful" },
  { id: "family", name: "The Family Legacy", emoji: "👨‍👩‍👧‍👦", tone: "Emotional" },
  { id: "numbers", name: "The Numbers Don't Lie", emoji: "📊", tone: "Data-Driven" },
  { id: "midnight", name: "The Midnight Save", emoji: "🌙", tone: "Dramatic" },
  { id: "domino", name: "The Domino Effect", emoji: "🎯", tone: "Strategic" },
];

interface DealData {
  clientAge: string;
  product: string;
  premium: string;
  challenge: string;
}

function DealInputForm({ onGenerate, isGenerating }: { onGenerate: (data: DealData, templateId: string) => void; isGenerating: boolean }) {
  const [data, setData] = useState<DealData>({ clientAge: "", product: "", premium: "", challenge: "" });
  const [selectedTemplate, setSelectedTemplate] = useState("hero");
  const update = (field: keyof DealData, value: string) => setData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-400 font-medium mb-2">Choose Your Story Style</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STORY_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
              className={`p-2 rounded-lg border text-left transition-all ${selectedTemplate === t.id ? "bg-yellow-500/10 border-yellow-500/30 ring-1 ring-yellow-400/30" : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80"}`}>
              <span className="text-lg">{t.emoji}</span>
              <p className="text-[10px] font-bold text-white mt-1">{t.name}</p>
              <p className="text-[10px] text-slate-500">{t.tone}</p>
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Deal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-medium">Client Age</label>
              <Input value={data.clientAge} onChange={e => update("clientAge", e.target.value)} placeholder="62" className="bg-slate-900/50 border-slate-700 text-sm h-9" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium">Premium / Deal Size</label>
              <Input value={data.premium} onChange={e => update("premium", e.target.value)} placeholder="250000" className="bg-slate-900/50 border-slate-700 text-sm h-9" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-medium">Product/Strategy</label>
            <Input value={data.product} onChange={e => update("product", e.target.value)} placeholder="IUL + Roth Conversion" className="bg-slate-900/50 border-slate-700 text-sm h-9" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-medium">The Challenge</label>
            <Input value={data.challenge} onChange={e => update("challenge", e.target.value)} placeholder="100% in market-risk funds, no tax strategy" className="bg-slate-900/50 border-slate-700 text-sm h-9" />
          </div>
        </CardContent>
      </Card>

      <Button className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-black h-12 rounded-xl"
        disabled={isGenerating}
        onClick={() => onGenerate(data, selectedTemplate)}>
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
            AI is crafting your legend...
          </>
        ) : (
          <><Sparkles className="mr-2" size={18} /> Generate War Story (AI-Powered)</>
        )}
      </Button>
    </div>
  );
}

function GeneratedStory({ story, templateId }: { story: string; templateId: string }) {
  const template = STORY_TEMPLATES.find(t => t.id === templateId) || STORY_TEMPLATES[0];
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-yellow-500/5 to-amber-900/10 border-yellow-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{template.emoji}</span>
            <div>
              <p className="text-sm font-bold text-yellow-400">{template.name}</p>
              <p className="text-[10px] text-slate-500">{template.tone} Tone</p>
            </div>
            <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">AI Generated</Badge>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">{story}</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button className="flex-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
          onClick={() => { navigator.clipboard.writeText(story); toast.success("Copied to clipboard!"); }}>
          <Copy size={14} className="mr-1" /> Copy
        </Button>
        <Button className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          onClick={() => toast.success("Shared to Brag Board!", { description: "+50 XP" })}>
          <Share2 size={14} className="mr-1" /> Share
        </Button>
        <Button className="flex-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
          onClick={() => toast.success("Saved to War Stories!")}>
          <BookOpen size={14} className="mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}

function HallOfFame() {
  const legendaryStories = [
    { title: "The $2.3M Tax-Free Retirement", author: "Sam Russell", emoji: "👑", likes: 342, shares: 89, template: "hero", excerpt: "They said it couldn't be done. A teacher and a firefighter, combined income under $120K, retiring with $2.3M in tax-free income..." },
    { title: "The Midnight MYGA Save", author: "Top Advisor", emoji: "🌙", likes: 218, shares: 67, template: "midnight", excerpt: "The rate was about to drop at midnight. I called the carrier at 11:47 PM. What happened next saved my client $340K..." },
    { title: "Three Generations, One Strategy", author: "Elite Producer", emoji: "👨‍👩‍👧‍👦", likes: 456, shares: 134, template: "family", excerpt: "Grandpa started with $50K. Today, three generations later, the family wealth engine produces $18K/month tax-free..." },
    { title: "The $47K/Year Tax Discovery", author: "Tax Strategist", emoji: "🔍", likes: 189, shares: 52, template: "detective", excerpt: "Their CPA missed it for 8 years. I found $47,000 in annual tax savings hiding in plain sight..." },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Crown size={18} className="text-yellow-400" /> Hall of Fame
        </h3>
        <p className="text-xs text-slate-500">The most legendary war stories ever told.</p>
      </div>
      {legendaryStories.map((story, i) => (
        <Card key={i} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{story.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{story.title}</p>
                <p className="text-[10px] text-slate-500">by {story.author}</p>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{story.excerpt}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-pink-400 flex items-center gap-1"><Heart size={10} /> {story.likes}</span>
                  <span className="text-[10px] text-blue-400 flex items-center gap-1"><Share2 size={10} /> {story.shares}</span>
                  <Badge className="text-[10px] bg-black/20 border-white/10 text-white/60">{story.template}</Badge>
                </div>
              </div>
              {i === 0 && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] shrink-0">#1</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function WarStoryGeneratorPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("generate");
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [usedTemplateId, setUsedTemplateId] = useState("hero");

  const generateMutation = trpc.warStoryAI.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedStory(data.story);
      toast.success("War Story Generated!", { description: "AI crafted your legend" });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleGenerate(data: DealData, templateId: string) {
    setUsedTemplateId(templateId);
    const dealSize = parseFloat(data.premium.replace(/[^0-9.]/g, "")) || 250000;
    const clientAge = parseInt(data.clientAge) || undefined;
    generateMutation.mutate({
      dealType: data.product || "IUL + Tax Strategy",
      dealSize,
      clientAge,
      strategy: `${STORY_TEMPLATES.find(t => t.id === templateId)?.tone || "Epic"} tone`,
      challenge: data.challenge || undefined,
    });
  }

  const stats = [
    { label: "Stories Generated", value: "47", icon: BookOpen, color: "text-blue-400" },
    { label: "Total Shares", value: "1,234", icon: Share2, color: "text-emerald-400" },
    { label: "Total Likes", value: "3,891", icon: Heart, color: "text-pink-400" },
    { label: "XP from Stories", value: "2,350", icon: Zap, color: "text-yellow-400" },
  ];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sword className="text-red-400" /> War Story Generator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Every deal is a story. Every story is a weapon. AI turns your wins into viral content.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-3 text-center">
                  <Icon size={18} className={`${stat.color} mx-auto mb-1`} />
                  <p className="text-lg font-black text-white">{stat.value}</p>
                  <p className="text-[10px] text-slate-500">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="generate" className="text-xs">Generate</TabsTrigger>
            <TabsTrigger value="hall-of-fame" className="text-xs">Hall of Fame</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            {generatedStory ? (
              <div className="space-y-4">
                <GeneratedStory story={generatedStory} templateId={usedTemplateId} />
                <Button variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-white"
                  onClick={() => setGeneratedStory(null)}>
                  Generate Another Story
                </Button>
              </div>
            ) : (
              <DealInputForm onGenerate={handleGenerate} isGenerating={generateMutation.isPending} />
            )}
          </TabsContent>

          <TabsContent value="hall-of-fame">
            <HallOfFame />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
