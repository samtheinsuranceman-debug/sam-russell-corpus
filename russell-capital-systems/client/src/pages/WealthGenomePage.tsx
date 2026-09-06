// ============================================================
// WEALTH GENOME ANALYSIS — the eight-dimension financial health score,
// computed from the client's own Financial Assessment (shared/wealthGenome.ts).
// Every score comes with its reasons and what would raise it. Education only.
// ============================================================
import { useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowRight, ChevronRight, Dna, Lightbulb, ListChecks } from "lucide-react";

const CARD = "rounded-2xl border border-violet-400/20 bg-white/[0.04]";
const TABS = ["Genome Overview", "Dimension Detail", "What Moves It"] as const;

function tone(score: number) {
  if (score >= 70) return { bar: "from-emerald-400 to-cyan-300", text: "text-emerald-300" };
  if (score >= 50) return { bar: "from-violet-400 to-cyan-300", text: "text-violet-200" };
  if (score >= 35) return { bar: "from-amber-400 to-violet-400", text: "text-amber-200" };
  return { bar: "from-red-400 to-amber-400", text: "text-red-300" };
}

export default function WealthGenomePage() {
  const genome = trpc.factFinder.genome.useQuery(undefined, { refetchOnWindowFocus: false });
  const [tab, setTab] = useState<(typeof TABS)[number]>("Genome Overview");
  const [selected, setSelected] = useState<string | null>(null);
  const g = genome.data;
  const dim = g?.dimensions.find((d) => d.key === selected) ?? g?.dimensions[0] ?? null;

  return (
    <AppShell title="Wealth Genome Analysis">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80"><Dna size={12} className="mr-1 inline" /> New Client Welcome List · Step 3</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Wealth Genome Analysis</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">Eight-dimension financial health score, computed from your Financial Assessment. Every point has a reason drawn from your own facts, and every dimension lists what would raise it.</p>
            </div>
            {g && (
              <div className="text-right">
                <div className={`text-4xl font-semibold ${tone(g.overall).text}`}>{g.overall}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{g.tier}</div>
              </div>
            )}
          </div>
          {g && !g.complete && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3">
              <p className="text-sm text-amber-100">Based on {g.assessmentPercent}% of your assessment — scores firm up as you complete it.</p>
              <Link href="/portal/financial-assessment" className="rounded-lg bg-amber-300 px-3 py-1.5 text-sm font-semibold text-black hover:bg-amber-200">Complete the assessment <ArrowRight size={14} className="ml-1 inline" /></Link>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${tab === t ? "border-violet-300 bg-violet-500 text-white" : "border-white/15 text-slate-300 hover:bg-white/5"}`}>{t}</button>
          ))}
        </div>

        {genome.isLoading && <p className="text-sm text-slate-400">Reading your assessment…</p>}

        {g && tab === "Genome Overview" && (
          <div className={`${CARD} p-6`}>
            <h2 className="text-lg font-semibold text-white"><Activity size={16} className="mr-1 inline text-violet-300" /> Overall financial health</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.dimensions.map((d) => (
                <button key={d.key} type="button" onClick={() => { setSelected(d.key); setTab("Dimension Detail"); }}
                  className="rounded-xl border border-white/10 bg-[#0b0f1a] p-4 text-left transition hover:border-violet-300/40">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{d.name}</p>
                    <span className={`text-lg font-semibold ${tone(d.score).text}`}>{d.score}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full bg-gradient-to-r ${tone(d.score).bar}`} style={{ width: `${d.score}%` }} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-400">{d.rationale[0]}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {g && dim && tab === "Dimension Detail" && (
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            <nav className={`${CARD} p-3`} aria-label="Dimensions">
              {g.dimensions.map((d) => (
                <button key={d.key} type="button" onClick={() => setSelected(d.key)} aria-current={dim.key === d.key ? "true" : undefined}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${dim.key === d.key ? "bg-violet-500/20 text-white" : "text-slate-300 hover:bg-white/5"}`}>
                  <span>{d.name}</span><span className={tone(d.score).text}>{d.score}</span>
                </button>
              ))}
            </nav>
            <div className={`${CARD} p-6`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{dim.name}</h2>
                <span className={`text-3xl font-semibold ${tone(dim.score).text}`}>{dim.score}<span className="text-sm text-slate-500">/100</span></span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-gradient-to-r ${tone(dim.score).bar}`} style={{ width: `${dim.score}%` }} /></div>
              <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200/80"><ListChecks size={12} className="mr-1 inline" /> Why it scored this way</h3>
              <ul className="mt-2 space-y-1.5">{dim.rationale.map((r, i) => <li key={i} className="flex gap-2 text-sm text-slate-200"><ChevronRight size={14} className="mt-0.5 shrink-0 text-violet-300" />{r}</li>)}</ul>
              {dim.raise.length > 0 && (
                <>
                  <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200"><Lightbulb size={12} className="mr-1 inline" /> What would raise it</h3>
                  <ul className="mt-2 space-y-1.5">{dim.raise.map((r, i) => <li key={i} className="flex gap-2 text-sm text-amber-50"><ChevronRight size={14} className="mt-0.5 shrink-0 text-amber-300" />{r}</li>)}</ul>
                </>
              )}
            </div>
          </div>
        )}

        {g && tab === "What Moves It" && (
          <div className={`${CARD} p-6`}>
            <h2 className="text-lg font-semibold text-white">The moves that raise the whole genome</h2>
            <p className="mt-1 text-sm text-slate-400">Collected from every dimension, weakest first. Ask the AI Financial Advisor to turn these into a journey.</p>
            <ol className="mt-4 space-y-3">
              {[...g.dimensions].sort((a, b) => a.score - b.score).filter((d) => d.raise.length).map((d) => (
                <li key={d.key} className="rounded-xl border border-white/10 bg-[#0b0f1a] p-4">
                  <div className="flex items-center justify-between"><p className="font-medium text-white">{d.name}</p><span className={`text-sm ${tone(d.score).text}`}>{d.score}</span></div>
                  <ul className="mt-2 space-y-1">{d.raise.map((r, i) => <li key={i} className="text-sm text-slate-300">• {r}</li>)}</ul>
                </li>
              ))}
            </ol>
            <Link href="/portal/ai-advisor" className="mt-5 inline-flex items-center gap-1 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400">Ask the advisor how to sequence these <ArrowRight size={14} /></Link>
          </div>
        )}

        <p className="text-center text-xs text-slate-500">Scores are a map of where the plan must work hardest — education only, not tax, legal, or investment advice. Your licensed advisor and the tax professional team review suitability before anything is implemented.</p>
      </div>
    </AppShell>
  );
}
