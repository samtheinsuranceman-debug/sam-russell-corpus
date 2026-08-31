// @ts-nocheck
// ───────────────────────────────────────────────────────────────────────────
// THE BROTHERHOOD — Sacred Seven #7 · Community + gamification
// war_stories (category, dollarImpact, likes, views, isAnonymous), XP leaderboard
// + crown/black-eye system, privacy-first transformation stories. Front-end with
// seed data — wire to war_stories / user_xp_profiles reads & like mutations later.
// ───────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Eye, Crown, Plus, Users, Trophy, EyeOff } from "lucide-react";
import { GENOME, GlowCard, GenomeBackdrop, SectionLabel, fmt$ } from "./_genome/GenomeKit";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "iul_strategy", label: "IUL Strategy" },
  { id: "roth_conversion", label: "Roth Conversion" },
  { id: "tax_savings", label: "Tax Savings" },
  { id: "estate_planning", label: "Estate Planning" },
];
const CAT_COLOR = {
  iul_strategy: GENOME.accent, roth_conversion: GENOME.cyan, tax_savings: "#f5b14c", estate_planning: "#34d399",
};
const SEED = [
  { id: 1, author: "Dr. M. · Cardiology", anon: false, cat: "iul_strategy", title: "Overfunded into Pacific Life — first tax-free loan year", body: "Started distributions at year 22. The audit log gave my CPA total confidence.", dollarImpact: 1_240_000, likes: 84, views: 612 },
  { id: 2, author: "Anonymous Physician", anon: true, cat: "roth_conversion", title: "Bracket-filling Roth ladder over 6 years", body: "Buddy kept me honest about the long game. Converted in the low-IRMAA window.", dollarImpact: 410_000, likes: 57, views: 388 },
  { id: 3, author: "Dr. R. · Anesthesiology", anon: false, cat: "estate_planning", title: "Drafted The Legacy with my kids in the room", body: "Spiritual tone. Hardest, best hour of the year. The reflection prompt undid me.", dollarImpact: 0, likes: 132, views: 904 },
  { id: 4, author: "Dr. K. · Surgery", anon: false, cat: "tax_savings", title: "HELOC cycling + solar credits stacked", body: "Three cycles into IUL on The Map. Watched the 30-yr curve bend.", dollarImpact: 286_000, likes: 41, views: 270 },
];
const LEADERS = [
  { name: "Dr. R.", xp: 9820, rep: 92, tier: "crown" },
  { name: "Dr. M.", xp: 8640, rep: 81, tier: "crown" },
  { name: "You", xp: 2480, rep: 81, tier: "crown", me: true },
  { name: "Dr. K.", xp: 2210, rep: 64, tier: "neutral" },
  { name: "Dr. P.", xp: 980, rep: 44, tier: "blackeye" },
];

export default function TheBrotherhood() {
  const [cat, setCat] = useState("all");
  const [stories, setStories] = useState(SEED);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "", cat: "iul_strategy", anon: false });

  const like = (id) => setStories((s) => s.map((x) => (x.id === id ? { ...x, likes: x.likes + (x.liked ? -1 : 1), liked: !x.liked } : x)));
  const visible = cat === "all" ? stories : stories.filter((s) => s.cat === cat);

  const post = () => {
    if (!draft.title.trim()) return;
    setStories([{ id: Date.now(), author: draft.anon ? "Anonymous Physician" : "You", anon: draft.anon, cat: draft.cat, title: draft.title, body: draft.body, dollarImpact: 0, likes: 0, views: 0 }, ...stories]);
    setDraft({ title: "", body: "", cat: "iul_strategy", anon: false });
    setComposing(false);
  };

  return (
    <AppShell title="The Brotherhood" subtitle="Physician to physician — proof, not promises">
      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
        <GenomeBackdrop />

        {/* Feed */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${cat === c.id ? "bg-violet-500/30 text-white" : "bg-white/5 text-slate-400 hover:text-slate-200"}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setComposing((v) => !v)} className="bg-violet-500 hover:bg-violet-400"><Plus className="mr-1.5 h-4 w-4" /> Share</Button>
          </div>

          {composing && (
            <GlowCard className="p-5">
              <SectionLabel>New war story</SectionLabel>
              <Input className="mt-3" placeholder="Headline" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <Textarea rows={3} className="mt-2" placeholder="What happened, and what it took…" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value })} className="h-9 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white">
                  {CATEGORIES.filter((c) => c.id !== "all").map((c) => <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>)}
                </select>
                <button onClick={() => setDraft({ ...draft, anon: !draft.anon })} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${draft.anon ? "bg-violet-500/30 text-violet-100" : "bg-white/5 text-slate-400"}`}>
                  <EyeOff className="h-3.5 w-3.5" /> {draft.anon ? "Anonymous" : "Named"}
                </button>
                <Button size="sm" onClick={post} className="ml-auto bg-violet-500 hover:bg-violet-400">Post</Button>
              </div>
            </GlowCard>
          )}

          {visible.map((s) => (
            <GlowCard key={s.id} className="p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  {s.anon ? <EyeOff className="h-3.5 w-3.5 text-slate-500" /> : <Users className="h-3.5 w-3.5 text-violet-300" />}
                  {s.author}
                </span>
                <Badge variant="outline" style={{ borderColor: `${CAT_COLOR[s.cat]}55`, color: CAT_COLOR[s.cat] }}>
                  {CATEGORIES.find((c) => c.id === s.cat)?.label}
                </Badge>
              </div>
              <h3 className="mt-2 text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.body}</p>
              <div className="mt-4 flex items-center gap-5 text-xs text-slate-500">
                <button onClick={() => like(s.id)} className={`flex items-center gap-1.5 transition-colors ${s.liked ? "text-rose-400" : "hover:text-rose-300"}`}>
                  <Heart className={`h-4 w-4 ${s.liked ? "fill-rose-400" : ""}`} /> {s.likes}
                </button>
                <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {s.views}</span>
                {s.dollarImpact > 0 && <span className="ml-auto font-semibold text-emerald-300">{fmt$(s.dollarImpact)} impact</span>}
              </div>
            </GlowCard>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <GlowCard className="p-6">
            <SectionLabel icon={Trophy}>XP leaderboard</SectionLabel>
            <ul className="mt-4 space-y-2">
              {LEADERS.map((l, i) => (
                <li key={l.name} className={`flex items-center gap-3 rounded-xl border p-3 ${l.me ? "border-violet-400/50 bg-violet-500/10" : "border-white/8 bg-white/[0.02]"}`}>
                  <span className="w-5 text-sm font-semibold text-slate-500">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                      {l.tier === "crown" && <Crown className="h-3.5 w-3.5 text-amber-300" />}
                      {l.tier === "blackeye" && <Eye className="h-3.5 w-3.5 text-rose-400" />}
                      {l.name}
                    </p>
                    <p className="text-[11px] text-slate-500">Rep {l.rep} · {l.xp.toLocaleString()} XP</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-slate-500">Crown above 75 · black eye below 50. Standing reflects matched word and action.</p>
          </GlowCard>

          <GlowCard className="p-6">
            <SectionLabel icon={Users}>The covenant</SectionLabel>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Privacy first. Share the strategy and the struggle, never a client's identity. Every story
              here is proof a physician chose power, love, and a sound mind over fear.
            </p>
          </GlowCard>
        </div>
      </div>
    </AppShell>
  );
}
