// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen, Sparkles, Copy, Share2, Users, DollarSign,
  Heart, Shield, TrendingUp, Loader2, RefreshCw, FileText
} from "lucide-react";


const STORY_TEMPLATES = [
  { id: "retirement-rescue", label: "Retirement Rescue", description: "How you saved their retirement from disaster", icon: Shield, color: "text-blue-400" },
  { id: "tax-savings", label: "Tax Savings Hero", description: "The strategy that saved them thousands in taxes", icon: DollarSign, color: "text-green-400" },
  { id: "family-protection", label: "Family Protection", description: "How their family is now protected forever", icon: Heart, color: "text-red-400" },
  { id: "wealth-growth", label: "Wealth Growth", description: "The journey from worried to wealthy", icon: TrendingUp, color: "text-purple-400" },
  { id: "legacy-builder", label: "Legacy Builder", description: "Building generational wealth that lasts", icon: Users, color: "text-amber-400" },
];

const TONES = [
  { id: "emotional", label: "Emotional & Heartfelt" },
  { id: "professional", label: "Professional & Polished" },
  { id: "urgent", label: "Urgent & Compelling" },
  { id: "inspirational", label: "Inspirational & Uplifting" },
  { id: "conversational", label: "Casual & Conversational" },
];

export default function ClientStoryGenerator() {
  const { user } = useAuth();
  const clientsQuery = trpc.clients.list.useQuery();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("emotional");
  const [customContext, setCustomContext] = useState("");
  const [generatedStory, setGeneratedStory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const clients = clientsQuery.data as any[] | undefined;
  const client = clients?.find((c: any) => c.id?.toString() === selectedClient);

  const generateStory = async () => {
    if (!selectedClient || !selectedTemplate) {
      toast.error("Please select a client and story template.");
      return;
    }
    setIsGenerating(true);

    const c = client;
    const name = c?.name || `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim() || "the client";
    const age = c?.age ?? "unknown";
    const nw = Number(c?.totalNetWorth ?? 0);
    const ira = Number(c?.iraBalance ?? 0);
    const roth = Number(c?.rothBalance ?? 0);
    const template = STORY_TEMPLATES.find(t => t.id === selectedTemplate);
    const tone = TONES.find(t => t.id === selectedTone);

    await new Promise(r => setTimeout(r, 2000));

    const stories: Record<string, string> = {
      "retirement-rescue": `**${name}'s Retirement Rescue**\n\nWhen ${name}, age ${age}, first walked into our office, they were carrying a weight most people never talk about — the quiet terror of running out of money.\n\nTheir ${ira > 0 ? `IRA of $${(ira/1000).toFixed(0)}K` : "retirement accounts"} ${roth > 0 ? `and Roth balance of $${(roth/1000).toFixed(0)}K` : ""} looked like numbers on a page. But behind those numbers was a ${age > 60 ? "couple who'd worked their entire lives" : "family with decades of dreams ahead"}.\n\n**The Problem:** Without intervention, ${name} was on track to ${nw > 500000 ? "lose over $" + Math.round(nw * 0.15 / 1000) + "K to unnecessary taxes" : "face a significant retirement shortfall"}.\n\n**The Solution:** Through a carefully designed ${template?.label} strategy, we restructured their portfolio to maximize tax-free growth while protecting their principal.\n\n**The Result:** ${name} now has a retirement plan that provides ${nw > 0 ? "$" + Math.round(nw * 0.04 / 12).toLocaleString() + "/month" : "reliable monthly income"} in tax-efficient income — for life.\n\n*"I sleep better now than I have in years."* — ${name}\n\n${customContext ? `\n**Additional Context:** ${customContext}` : ""}`,

      "tax-savings": `**How ${name} Saved $${Math.round(nw * 0.12 / 1000)}K in Taxes**\n\nMost people think taxes are inevitable. ${name} thought so too — until we showed them the math.\n\nWith ${ira > 0 ? `$${(ira/1000).toFixed(0)}K sitting in a traditional IRA` : "significant pre-tax retirement assets"}, ${name} was looking at a tax time bomb. Every dollar withdrawn would be taxed at their highest marginal rate.\n\n**The Strategy:** A multi-year Roth conversion ladder, timed to their specific tax brackets, combined with strategic income shifting.\n\n**Year 1:** Converted $${Math.round(nw * 0.05 / 1000)}K at the 22% bracket — saving vs. the 32% they'd pay later.\n**Year 2-5:** Systematic conversions totaling $${Math.round(nw * 0.2 / 1000)}K, all at favorable rates.\n\n**Total Tax Savings:** $${Math.round(nw * 0.12 / 1000)}K over 10 years.\n\nThat's not a rounding error. That's a vacation home. That's their grandchildren's education. That's freedom.\n\n${customContext ? `\n**Additional Context:** ${customContext}` : ""}`,

      "family-protection": `**The Day ${name}'s Family Became Untouchable**\n\nNobody likes to think about the worst-case scenario. But ${name}, age ${age}, had the courage to face it head-on.\n\nWith a total estate of $${(nw/1000).toFixed(0)}K, their family was exposed. No trust structure. No succession plan. No safety net.\n\n**What We Built:**\n- A comprehensive estate plan that protects every dollar\n- Life insurance structured to cover estate taxes\n- A trust that ensures their wishes are honored — not the government's\n\n**The Moment It Clicked:** When ${name} saw the side-by-side comparison — their family's future WITH our plan vs. WITHOUT — they didn't speak for a full minute. Then they said:\n\n*"Why didn't someone show me this ten years ago?"*\n\nBecause nobody cared enough to. We do.\n\n${customContext ? `\n**Additional Context:** ${customContext}` : ""}`,

      "wealth-growth": `**${name}'s Journey: From Worried to Wealthy**\n\nA year ago, ${name} was worried. Not the kind of worry that keeps you up at night — the kind that sits in the back of your mind during every family dinner, every vacation, every quiet moment.\n\n*"Am I going to be okay?"*\n\nWith $${(nw/1000).toFixed(0)}K in total assets, they weren't poor. But they weren't confident either.\n\n**The Transformation:**\n\nWe didn't just move money around. We built a system:\n1. Tax-optimized withdrawals that save $${Math.round(nw * 0.03 / 1000)}K/year\n2. Growth-oriented allocations in protected vehicles\n3. A guaranteed income floor that can never run out\n\n**12 Months Later:** ${name}'s portfolio has grown, their tax bill has shrunk, and for the first time in years, they're not worried.\n\nThey're excited.\n\n${customContext ? `\n**Additional Context:** ${customContext}` : ""}`,

      "legacy-builder": `**${name}: Building a Legacy That Outlives Them**\n\nSome people save for retirement. ${name} is building something bigger.\n\nWith $${(nw/1000).toFixed(0)}K in assets and a family that spans generations, ${name} didn't just want financial security. They wanted a legacy.\n\n**The Vision:** Every child and grandchild inherits not just money, but a system — a financial framework that grows, protects, and provides for generations.\n\n**What We Designed:**\n- A dynasty trust structure that shields wealth from estate taxes\n- Indexed universal life policies that create tax-free generational transfers\n- A family governance framework that teaches financial literacy\n\n**The Numbers:** Over 3 generations, this plan is projected to transfer $${Math.round(nw * 3.5 / 1000)}K in total wealth — tax-efficiently.\n\nThat's not financial planning. That's empire building.\n\n*"My grandfather worked in a factory. My grandchildren will never have to worry."* — ${name}\n\n${customContext ? `\n**Additional Context:** ${customContext}` : ""}`,
    };

    setGeneratedStory(stories[selectedTemplate] || stories["retirement-rescue"]);
    setIsGenerating(false);
    toast.success("Story generated! +75 XP");
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/30 bg-gradient-to-r from-rose-500/5 via-background to-purple-500/5">
          <div className="container py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Client Story Generator</h1>
                <p className="text-sm text-muted-foreground">Transform cold numbers into warm stories that close deals.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
            {/* Left: Configuration */}
            <div className="space-y-6">
              {/* Select Client */}
              <Card className="border-border/30">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Select Client</CardTitle></CardHeader>
                <CardContent>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger><SelectValue placeholder="Choose a client..." /></SelectTrigger>
                    <SelectContent>
                      {(clients ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id?.toString()}>
                          {c.name || `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()} — ${(Number(c.totalNetWorth ?? 0) / 1000).toFixed(0)}K
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {client && (
                    <div className="mt-3 p-3 rounded-lg bg-white/5 text-xs text-muted-foreground space-y-1">
                      <p>Age: {client.age ?? "N/A"} | Net Worth: ${(Number(client.totalNetWorth ?? 0) / 1000).toFixed(0)}K</p>
                      <p>IRA: ${(Number(client.iraBalance ?? 0) / 1000).toFixed(0)}K | Roth: ${(Number(client.rothBalance ?? 0) / 1000).toFixed(0)}K</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Story Template */}
              <Card className="border-border/30">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-purple-400" /> Story Template</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {STORY_TEMPLATES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          selectedTemplate === t.id ? "bg-emerald-500/10 border border-emerald-500/30" : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${t.color} shrink-0`} />
                        <div>
                          <p className="text-sm font-medium text-white">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Tone */}
              <Card className="border-border/30">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Tone</CardTitle></CardHeader>
                <CardContent>
                  <Select value={selectedTone} onValueChange={setSelectedTone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Custom Context */}
              <Card className="border-border/30">
                <CardHeader><CardTitle className="text-base">Additional Context (Optional)</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    placeholder="Add any personal details, specific wins, or emotional moments to include..."
                    rows={3}
                  />
                </CardContent>
              </Card>

              <Button
                onClick={generateStory}
                disabled={isGenerating || !selectedClient || !selectedTemplate}
                className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 h-12 text-lg"
              >
                {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Crafting Your Story...</> : <><Sparkles className="w-5 h-5 mr-2" /> Generate Story</>}
              </Button>
            </div>

            {/* Right: Generated Story */}
            <div>
              {generatedStory ? (
                <Card className="border-emerald-500/20 sticky top-4">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-400" /> Your Story</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generatedStory.replace(/\*\*/g, "")); toast.success("Copied!"); }}>
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toast.success("Shared! +25 XP")}>
                        <Share2 className="w-4 h-4 mr-1" /> Share
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert prose-sm max-w-none">
                      {generatedStory.split("\n").map((line, i) => {
                        if (line.startsWith("**") && line.endsWith("**")) return <h3 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.replace(/\*\*/g, "")}</h3>;
                        if (line.startsWith("*") && line.endsWith("*")) return <p key={i} className="italic text-emerald-400/80">{line.replace(/\*/g, "")}</p>;
                        if (line.startsWith("- ") || line.startsWith("1.")) return <p key={i} className="text-muted-foreground ml-4">{line}</p>;
                        if (line.trim() === "") return <br key={i} />;
                        return <p key={i} className="text-muted-foreground leading-relaxed">{line.replace(/\*\*/g, "")}</p>;
                      })}
                    </div>
                    <div className="mt-6 flex gap-2">
                      <Button variant="outline" size="sm" onClick={generateStory}><RefreshCw className="w-4 h-4 mr-1" /> Regenerate</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/30 border-dashed">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">Your Story Will Appear Here</h3>
                    <p className="text-sm text-muted-foreground/60">Select a client, choose a template, and click Generate to create a compelling narrative.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
