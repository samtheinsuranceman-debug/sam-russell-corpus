import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, BrainCircuit, LockKeyhole, Search, Send, Sparkles, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SupportModeSelector } from "@/components/SupportModeSelector";
import { SUPPORT_MODE_COPY, useSupportMode } from "@/contexts/SupportModeContext";
import { SUPPORT_INVENTIONS, INVENTION_CATEGORIES, type SupportInvention } from "@/lib/supportInventions";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { PUBLIC_WELLNESS_MODE } from "@/lib/releasePolicy";

export default function SupportLab() {
  const { mode, privacy, setPrivacy } = useSupportMode();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [selected, setSelected] = useState<SupportInvention>(SUPPORT_INVENTIONS[2]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  const filtered = useMemo(() => SUPPORT_INVENTIONS.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const q = query.trim().toLowerCase();
    const matchesSearch = !q || `${item.name} ${item.userValue} ${item.mechanism}`.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  }), [category, query]);

  const runMutation = trpc.advisory.chat.useMutation({
    onSuccess: (data) => setResult(data.response),
    onError: () => setResult("I couldn't complete that reflection right now. Your text was not intentionally saved by this workspace. Please try again."),
  });

  const run = () => {
    const text = input.trim();
    if (!text || runMutation.isPending) return;
    if (!isAuthenticated) {
      window.location.href = getLoginUrl("/support-lab");
      return;
    }
    setResult("");
    setRating(null);
    runMutation.mutate({
      message: text,
      history: [],
      supportMode: mode,
      module: {
        id: selected.id,
        name: selected.name,
        goal: selected.mechanism,
      },
      privacy: {
        ephemeral: privacy.ephemeralByDefault,
        memoryEnabled: privacy.personalizationMemory,
      },
    });
  };

  const saveTakeaway = () => {
    if (!result) return;
    const key = "doctorbuddy-personal-toolkit-v1";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.unshift({ id: crypto.randomUUID(), moduleId: selected.id, moduleName: selected.name, result, createdAt: new Date().toISOString(), rating });
    localStorage.setItem(key, JSON.stringify(current.slice(0, 100)));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="container py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1"/>Back</Button></Link>
            <div>
              <div className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-violet-400"/><h1 className="text-lg font-bold">Adaptive Support Lab</h1></div>
              <p className="text-xs text-muted-foreground">50 personalized support engines · user-directed · non-diagnostic</p>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400"><LockKeyhole className="h-3 w-3 mr-1"/>Privacy-first controls</Badge>
        </div>
      </div>

      <div className="container py-6 grid xl:grid-cols-[1.15fr_.85fr] gap-6">
        <section>
          <Card className="mb-5 border-violet-500/20 bg-violet-500/5">
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-xs font-mono text-violet-400 mb-2">CHOOSE HOW DOCTOR BUDDY COMMUNICATES</p>
                <SupportModeSelector />
                <p className="text-[11px] text-muted-foreground mt-2">{SUPPORT_MODE_COPY[mode].boundary}</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 border-t border-border/40 pt-4">
                <label className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3">
                  <span><span className="text-xs font-semibold block">Ephemeral raw workspace</span><span className="text-[10px] text-muted-foreground">{PUBLIC_WELLNESS_MODE ? "Public edition does not persist raw lab text in Doctor Buddy session history; the AI processor still receives it for this request." : "Don't save raw workspace text locally."}</span></span>
                  <Switch checked={PUBLIC_WELLNESS_MODE ? true : privacy.ephemeralByDefault} disabled={PUBLIC_WELLNESS_MODE} onCheckedChange={(v) => setPrivacy({...privacy, ephemeralByDefault:v})}/>
                </label>
                <label className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3">
                  <span><span className="text-xs font-semibold block">Personalization memory</span><span className="text-[10px] text-muted-foreground">{PUBLIC_WELLNESS_MODE ? "Not enabled in the public edition." : "Opt in before patterns are retained."}</span></span>
                  <Switch checked={PUBLIC_WELLNESS_MODE ? false : privacy.personalizationMemory} disabled={PUBLIC_WELLNESS_MODE} onCheckedChange={(v) => setPrivacy({...privacy, personalizationMemory:v})}/>
                </label>
                <label className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3">
                  <span><span className="text-xs font-semibold block">Care-team sharing</span><span className="text-[10px] text-muted-foreground">{PUBLIC_WELLNESS_MODE ? "Not enabled in the public edition." : "Off unless you explicitly enable it."}</span></span>
                  <Switch checked={PUBLIC_WELLNESS_MODE ? false : privacy.shareWithCareTeam} disabled={PUBLIC_WELLNESS_MODE} onCheckedChange={(v) => setPrivacy({...privacy, shareWithCareTeam:v})}/>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search 50 support engines…" className="pl-9"/></div>
            <Button variant={category==="All"?"default":"outline"} size="sm" onClick={()=>setCategory("All")}>All</Button>
            {INVENTION_CATEGORIES.map((c)=><Button key={c} variant={category===c?"default":"outline"} size="sm" onClick={()=>setCategory(c)}>{c}</Button>)}
          </div>

          <div className="grid md:grid-cols-2 gap-3 max-h-[900px] overflow-y-auto pr-1">
            {filtered.map((item)=><button key={item.id} onClick={()=>{setSelected(item);setResult("");setInput("");}} className={`text-left rounded-xl border p-4 transition-all ${selected.id===item.id?"border-violet-400/50 bg-violet-500/10":"border-border/50 bg-card hover:border-violet-400/25"}`}>
              <div className="flex items-start justify-between gap-2"><span className="text-[10px] font-mono text-muted-foreground">#{String(item.number).padStart(2,"0")} · {item.category}</span>{selected.id===item.id&&<Sparkles className="h-4 w-4 text-violet-400"/>}</div>
              <h3 className="font-bold mt-1">{item.name}</h3><p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.userValue}</p>
            </button>)}
          </div>
        </section>

        <aside className="xl:sticky xl:top-24 h-fit">
          <Card className="border-violet-400/30 shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4"><div><Badge variant="outline" className="mb-2">{selected.category}</Badge><h2 className="text-2xl font-black">{selected.name}</h2><p className="text-sm text-muted-foreground mt-2">{selected.mechanism}</p></div><span className="text-4xl font-black text-violet-400/20">{selected.number}</span></div>
              <div className="rounded-lg bg-muted/50 border border-border/40 p-3 mb-4"><p className="text-xs font-semibold mb-1">Start here</p><p className="text-sm text-muted-foreground">{selected.starter}</p></div>
              <Textarea value={input} onChange={(e)=>setInput(e.target.value)} placeholder={SUPPORT_MODE_COPY[mode].placeholder} className="min-h-[130px]"/>
              <Button onClick={run} disabled={!input.trim()||runMutation.isPending} className="w-full mt-3 bg-violet-600 hover:bg-violet-500"><Send className="h-4 w-4 mr-2"/>{runMutation.isPending?"Working with your reflection…":`Run in ${SUPPORT_MODE_COPY[mode].label}`}</Button>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">This workspace supports reflection and education. It does not diagnose, prescribe, or replace a licensed professional. In an emergency, call 911 or 988 in the U.S.</p>

              {result && <div className="mt-5 border-t border-border/50 pt-5">
                <div className="prose prose-sm prose-invert max-w-none"><Streamdown>{result}</Streamdown></div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Useful?</span>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setRating(n)} className={`p-1 rounded ${rating&&n<=rating?"text-amber-400":"text-muted-foreground"}`}><Star className="h-4 w-4" fill={rating&&n<=rating?"currentColor":"none"}/></button>)}
                  <Button size="sm" variant="outline" className="ml-auto" onClick={saveTakeaway}>Save takeaway only</Button>
                  <Button size="sm" variant="ghost" onClick={()=>{setInput("");setResult("");setRating(null);}}><Trash2 className="h-4 w-4 mr-1"/>Clear</Button>
                </div>
              </div>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
