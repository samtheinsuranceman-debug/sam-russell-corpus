// ============================================================
// THE INTEGRATION SCORECARD — /portal/integration-scorecard.
//
// Every catalogue page scored on ten dimensions read from the code, beside
// the hand ratings for value and frequency. The point of putting the two
// side by side: a page can be worth a 9 and wired at a 4, and that gap is
// the work list. The missing items are concrete — each one names a file.
// ============================================================
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Gauge, ChevronDown, Info } from "lucide-react";

const CARD = "rounded-2xl border border-white/10 bg-white/[0.04]";
const LABEL = "text-[10px] uppercase tracking-[0.18em] text-slate-400";

function Bar({ score, max = 10, accent = "#f5c542" }: { score: number; max?: number; accent?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2 w-24 rounded bg-white/10 overflow-hidden"><span className="block h-full rounded" style={{ width: `${(score / max) * 100}%`, background: accent }} /></span>
      <span className="text-xs tabular-nums text-white">{score}</span>
    </span>
  );
}

export default function IntegrationScorecard() {
  const q = trpc.integration.scorecard.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const [cat, setCat] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<"score" | "gap" | "value">("gap");

  const rows = useMemo(() => {
    const pages = q.data?.pages ?? [];
    const filtered = cat === "all" ? pages : pages.filter((p) => p.category === cat);
    const gap = (p: (typeof pages)[number]) => (p.rating ? p.rating.value - p.score : -99);
    return [...filtered].sort((a, b) => sort === "score" ? b.score - a.score : sort === "value" ? (b.rating?.value ?? 0) - (a.rating?.value ?? 0) : gap(b) - gap(a));
  }, [q.data, cat, sort]);

  const cats = useMemo(() => Array.from(new Set((q.data?.pages ?? []).map((p) => p.category))).sort(), [q.data]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-amber-300/80"><Gauge className="h-3.5 w-3.5" /> The integration scorecard</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">How wired each page is, read from the code</h1>
          <p className="text-slate-300 max-w-3xl leading-relaxed">
            Ten dimensions, computed from the router, the catalogue, each page's imports, the memory bank, the tests, the genome's related paths, the sphere, the provenance traces, and which tRPC routers fetch external data. Beside each: the hand rating for what the page is worth to someone it suits and how often an ordinary household needs it. Sort by <strong className="text-white">gap</strong> — value minus wiring — and the top of the list is the work.
          </p>
        </header>

        {q.isLoading && <p className="text-slate-400">Reading the repository…</p>}
        {q.error && <p className="text-rose-300">{q.error.message}</p>}

        {q.data && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`${CARD} p-4`}><div className={LABEL}>Pages</div><div className="text-2xl font-black text-white tabular-nums">{q.data.summary.pages}</div></div>
              <div className={`${CARD} p-4`}><div className={LABEL}>Mean wiring</div><div className="text-2xl font-black text-white tabular-nums">{q.data.summary.mean}<span className="text-sm text-slate-500">/10</span></div></div>
              <div className={`${CARD} p-4`}><div className={LABEL}>At ten</div><div className="text-2xl font-black text-white tabular-nums">{q.data.summary.perfect}</div></div>
              <div className={`${CARD} p-4`}><div className={LABEL}>Below five</div><div className="text-2xl font-black text-rose-300 tabular-nums">{q.data.summary.below5}</div></div>
            </section>

            <section className={`${CARD} p-5`}>
              <h2 className="font-bold text-white mb-3">Where the system-wide gaps are</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {(Object.keys(q.data.summary.gaps) as Array<keyof typeof q.data.summary.gaps>).map((d) => (
                  <div key={d} className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <div className="text-xs text-white font-semibold">{q.data!.labels[d]} <span className="text-slate-500">×{q.data!.weights[d]}</span></div>
                    <div className="text-lg font-black tabular-nums text-rose-300">{q.data!.summary.gaps[d]}<span className="text-xs text-slate-500"> pages missing</span></div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">Routers that fetch external data: {q.data.summary.dataRouters.join(", ")}</p>
            </section>

            <div className="flex flex-wrap gap-2 items-center">
              <select className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="all">All categories</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="gap">Sort by gap (value − wiring)</option><option value="score">Sort by wiring</option><option value="value">Sort by value</option>
              </select>
              <span className="text-xs text-slate-500">{q.data.ratedCount} pages carry hand ratings</span>
            </div>

            <ol className="space-y-2">
              {rows.map((p) => (
                <li key={p.path} className={`${CARD}`}>
                  <button className="w-full text-left p-4 flex flex-wrap items-center gap-x-6 gap-y-2" onClick={() => setOpen(open === p.path ? null : p.path)}>
                    <span className="min-w-[240px] flex-1">
                      <span className="block font-semibold text-white text-sm">{p.name}{p.featured && <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-300">featured</span>}</span>
                      <Link href={p.path} className="text-xs text-slate-400 hover:text-amber-300" onClick={(e) => e.stopPropagation()}>{p.path}</Link>
                    </span>
                    <span className="flex flex-col gap-1 text-xs">
                      <span className="flex items-center gap-2"><span className={`${LABEL} w-16`}>Wiring</span><Bar score={p.score} /></span>
                      {p.rating && <span className="flex items-center gap-2"><span className={`${LABEL} w-16`}>Value</span><Bar score={p.rating.value} accent="#7fd4a3" /></span>}
                      {p.rating && <span className="flex items-center gap-2"><span className={`${LABEL} w-16`}>Frequency</span><Bar score={p.rating.frequency} accent="#6fc3ff" /></span>}
                    </span>
                    <span className="flex flex-wrap gap-1 max-w-[320px]">
                      {(Object.keys(p.dims) as Array<keyof typeof p.dims>).map((d) => (
                        <span key={d} title={q.data!.labels[d]} className={`rounded px-1.5 py-0.5 text-[10px] ${p.dims[d] ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/15 text-rose-300 line-through"}`}>{q.data!.labels[d]}</span>
                      ))}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition ${open === p.path ? "rotate-180" : ""}`} />
                  </button>
                  {open === p.path && (
                    <div className="px-4 pb-4 space-y-3 text-sm">
                      {p.rating && <p className="text-slate-300"><span className={LABEL}>Right page when</span><br />{p.rating.conditions}</p>}
                      {p.missing.length > 0 && <div><div className={LABEL}>To reach ten — from the code</div><ul className="mt-1 space-y-1 text-slate-300">{p.missing.map((m, i) => <li key={i} className="flex gap-2"><span className="text-rose-400">·</span>{m}</li>)}</ul></div>}
                      {p.rating && p.rating.connectTo.length > 0 && <div><div className={LABEL}>Connections that would take it to ten — by judgement</div><ul className="mt-1 space-y-1 text-slate-300">{p.rating.connectTo.map((m, i) => <li key={i} className="flex gap-2"><span className="text-amber-300">·</span>{m}</li>)}</ul></div>}
                      <div className="text-xs text-slate-500">Evidence: {Object.entries(p.evidence).map(([k, v]) => `${k}: ${v}`).join(" · ")}</div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
        <p className={`${CARD} p-4 flex gap-2 text-xs text-slate-400`}><Info className="h-4 w-4 shrink-0 mt-0.5" /><span>Wiring is computed from the deployed code on every load and cannot drift from it. Value and frequency are judgements, kept separate on purpose, and each connection listed under them is a task naming a file. The weights are visible: the AI brain is 1.5 because a page the channels cannot use is a page the client has to find alone.</span></p>
      </div>
    </AppShell>
  );
}
